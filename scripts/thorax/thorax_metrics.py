"""
S4 background metrics on real library frames and on renderer captures (Python stdlib).

Same definitions as scripts/thorax/metrics.ts (the harness port), so real and simulated frames
are measured identically:
  * texture terciles, 4-32 px band-pass RMS, power at 0.125 cycles/px, high-band slope
    (texture.py analyse)
  * thin dark-line pixel count (ridge.py ridges)
  * beta: -slope of the radial spectrum of the central 256 px block over 0.008-0.08 cycles/px
  * lc99: 99th percentile of (41x41 box mean - pixel) over the central 80 %
  * lung profile: half of (p95 - p5) of a 5-column vertical profile after removing a 41-px
    running mean, median over 8 columns from the brightest quartile of column means
  * anisotropy: share of 0.02-0.12 cycles/px power in the strongest 30-degree orientation sector
    and in the strongest sector at least 45 degrees away from it, bright-tercile tiles
Only statistics are written; no patient pixels leave the dataset folders.

Usage:
  python3 thorax_metrics.py real [n_runs]        -> real Azurion pre-contrast frames (frame 2)
  python3 thorax_metrics.py png <file.png> ...  -> captures (cropped 4 %, resampled to 512)
Output JSON goes to stdout and to scripts/thorax/out/.
"""

import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(PROJ, "docs", "realism", "research"))
import imlib  # noqa: E402
import texture  # noqa: E402
import ridge  # noqa: E402

OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)


def beta(img):
    b = imlib.block(img, 128, 128, 256, 256)
    ps = imlib.radial_ps(b)
    return -imlib.loglog_slope(ps, 0.008, 0.08)


def lc99(img):
    m = imlib.box_mean(img, 20)
    v = sorted(m[y * 512 + x] - img[y * 512 + x] for y in range(51, 461) for x in range(51, 461))
    return v[int(0.99 * (len(v) - 1))]


def lung_profile(img):
    cols = []
    for x in range(40, 472):
        s = sum(img[y * 512 + x] for y in range(64, 448))
        cols.append((x, s / 384))
    top = sorted(c[0] for c in sorted(cols, key=lambda c: -c[1])[: len(cols) // 4])
    pick = [top[int((k + 0.5) / 8 * len(top))] for k in range(8)]
    res = []
    for x in pick:
        prof = []
        for y in range(44, 468):
            prof.append(sum(img[y * 512 + min(511, max(0, x + dx))] for dx in range(-2, 3)) / 5)
        r = []
        for i in range(20, len(prof) - 20):
            r.append(prof[i] - sum(prof[i - 20 : i + 21]) / 41)
        r.sort()
        res.append((r[int(0.95 * (len(r) - 1))] - r[int(0.05 * (len(r) - 1))]) / 2)
    res.sort()
    return res[len(res) // 2]


def anisotropy(img):
    tiles = []
    for y0 in range(0, 385, 64):
        for x0 in range(0, 385, 64):
            m = sum(img[(y0 + j) * 512 + x0 + i] for j in range(0, 128, 2) for i in range(0, 128, 2))
            tiles.append((m, x0, y0))
    tiles.sort(reverse=True)
    conc, second = [], []
    for _, x0, y0 in tiles[: len(tiles) // 3]:
        b = imlib.block(img, x0, y0, 128, 128)
        res, _ = imlib.detrend_plane(b)
        hw = imlib.hann2(128)
        F = imlib.fft2([[res[j][i] * hw[j][i] for i in range(128)] for j in range(128)])
        bins = [0.0] * 12
        for v in range(128):
            fv = (v if v <= 64 else v - 128) / 128
            for u in range(128):
                fu = (u if u <= 64 else u - 128) / 128
                f = math.hypot(fu, fv)
                if f < 0.02 or f > 0.12:
                    continue
                a = math.atan2(fv, fu)
                if a < 0:
                    a += math.pi
                bins[min(11, int(a / math.pi * 12))] += abs(F[v][u]) ** 2
        tot = sum(bins) or 1
        best, bi = max((bins[i] + bins[(i + 1) % 12], i) for i in range(12))
        sec = max(
            (bins[i] + bins[(i + 1) % 12] for i in range(12) if min(abs(i - bi), 12 - abs(i - bi)) >= 3),
            default=0,
        )
        conc.append(best / tot)
        second.append(sec / tot)
    conc.sort()
    second.sort()
    return {"conc": conc[len(conc) // 2], "second": second[len(second) // 2]}


def all_metrics(img, label):
    t = texture.analyse(img, label)
    r = ridge.ridges(img)
    s = sorted(img)
    q = lambda p: s[int(p * (len(s) - 1))]  # noqa: E731
    return {
        "label": label,
        "lungBandRms": t["bright"]["bandpass_4-32px_rms_median"],
        "lungPower0125": t["bright"]["power_at_f"]["0.125"],
        "lungSlopeHi": t["bright"]["slope_0.1-0.3_median"],
        "midBandRms": t["mid"]["bandpass_4-32px_rms_median"],
        "darkBandRms": t["dark"]["bandpass_4-32px_rms_median"],
        "beta": round(beta(img), 3),
        "lc99": round(lc99(img), 2),
        "ridge": sum(r),
        "lungProfile": round(lung_profile(img), 2),
        "greyP5": q(0.05),
        "greyP50": q(0.5),
        "greyP95": q(0.95),
        "aniso": anisotropy(img),
    }


def summarise(rows):
    keys = ["lungBandRms", "lungPower0125", "lungSlopeHi", "beta", "lc99", "ridge", "lungProfile"]
    out = {}
    for k in keys:
        v = sorted(r[k] for r in rows if r[k] == r[k])
        if not v:
            continue
        out[k] = {"q25": v[len(v) // 4], "median": v[len(v) // 2], "q75": v[(3 * len(v)) // 4], "min": v[0], "max": v[-1]}
    for k in ("conc", "second"):
        v = sorted(r["aniso"][k] for r in rows)
        out["aniso_" + k] = {"q25": v[len(v) // 4], "median": v[len(v) // 2], "q75": v[(3 * len(v)) // 4]}
    return out


if __name__ == "__main__":
    kind = sys.argv[1]
    rows = []
    if kind == "real":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 12
        runs = json.load(open(os.path.join(PROJ, "docs", "realism", "research", "ridge_npz.json")))
        ids = sorted(runs)[:n]
        for rid in ids:
            fr, meta = imlib.load_npz_run(rid, frames=[2])
            lab = f"{rid} ({meta['primary_angle']:.0f},{meta['secondary_angle']:.0f})"
            row = all_metrics(fr[0], lab)
            rows.append(row)
            print(json.dumps(row), flush=True)
        res = {"rows": rows, "summary": summarise(rows)}
        json.dump(res, open(os.path.join(OUT, "real_metrics.json"), "w"), indent=1)
    else:
        for p in sys.argv[2:]:
            img, lab = texture.load_any(f"png:{p}:0")
            row = all_metrics(img, lab)
            rows.append(row)
            print(json.dumps(row), flush=True)
        tag = os.path.basename(sys.argv[2]).split("_")[1] if len(sys.argv) > 2 else "x"
        res = {"rows": rows, "summary": summarise(rows)}
        json.dump(res, open(os.path.join(OUT, f"sim_metrics_{tag}.json"), "w"), indent=1)
    print(json.dumps(res["summary"], indent=1))
