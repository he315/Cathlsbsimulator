"""
(1) Noise, v2: noise isolated with frame differences so static anatomy cancels.

For consecutive frames k, k+1 (lossless sources only):
  D = I[k+1] - I[k]; non-overlapping 32x32 blocks (16 px margin); quadratic surface removed.
  Static blocks = lowest-30% SD(D) within each 32-grey bin of I[k] (motion only adds variance).
  * sigma_t(grey) = SD(D)/sqrt(2): per-frame noise SD if consecutive frames were independent
    (with temporal correlation rho it is sigma*sqrt(1-rho)).
  * Spatial ACF of D at lags 1..4 (h and v) = noise ACF (static anatomy removed).
  * NPS shape of D (radial, Hann window), fraction of power per band, peak frequency.
  * Temporal correlation from the second difference: for AR(1) noise
        var(I[k+1] - 2 I[k] + I[k-1]) / var(I[k+1] - I[k]) = 3 - rho
    (constant-velocity motion cancels in the second difference; static blocks only).
  * Spatial single-frame high-pass SD: I - 5x5 box mean, in the same static blocks.
"""

import json
import math
import sys

import imlib

B = 32
MARGIN = 16
N = B * B

# quadratic detrend projector
_F = []
for j in range(B):
    for i in range(B):
        x = (i - (B - 1) / 2) / B
        y = (j - (B - 1) / 2) / B
        _F.append((1.0, x, y, x * x, x * y, y * y))
_A = [[sum(_F[n][a] * _F[n][c] for n in range(N)) for c in range(6)] for a in range(6)]


def _inv(A):
    n = len(A)
    M = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        pv = M[c][c]
        M[c] = [v / pv for v in M[c]]
        for r in range(n):
            if r != c and M[r][c]:
                f = M[r][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [row[n:] for row in M]


_Ai = _inv(_A)
_P = [[sum(_Ai[a][c] * _F[n][c] for c in range(6)) for n in range(N)] for a in range(6)]
_FT = [[_F[n][a] for n in range(N)] for a in range(6)]


def detrend(v):
    coef = [sum(p * x for p, x in zip(_P[a], v)) for a in range(6)]
    fit = [0.0] * N
    for a in range(6):
        c = coef[a]
        fa = _FT[a]
        for n in range(N):
            fit[n] += c * fa[n]
    return [x - f for x, f in zip(v, fit)]


def blk(img, x0, y0):
    out = []
    W = imlib.W
    for j in range(B):
        o = (y0 + j) * W + x0
        out.extend(img[o : o + B])
    return out


def var(v, dof=6):
    return sum(x * x for x in v) / (len(v) - dof)


def acf(res, maxlag=4):
    v0 = sum(x * x for x in res) / N
    hx, vy = [], []
    for L in range(1, maxlag + 1):
        s = 0.0
        n = 0
        for j in range(B):
            o = j * B
            for i in range(B - L):
                s += res[o + i] * res[o + i + L]
            n += B - L
        hx.append(s / n / v0)
        s = 0.0
        for j in range(B - L):
            o = j * B
            o2 = (j + L) * B
            for i in range(B):
                s += res[o + i] * res[o2 + i]
        vy.append(s / ((B - L) * B) / v0)
    return hx, vy


def nps(res):
    b = [res[j * B : (j + 1) * B] for j in range(B)]
    return imlib.radial_ps(b)


GRID = [(x0, y0) for y0 in range(MARGIN, imlib.H - MARGIN - B + 1, B) for x0 in range(MARGIN, imlib.W - MARGIN - B + 1, B)]


def analyse(frames, label, ks, hp_frames=None):
    """frames: list of full frames (consecutive); ks: indices k with k-1, k, k+1 available."""
    recs = []
    for k in ks:
        a, b, c = frames[k - 1], frames[k], frames[k + 1]
        for (x0, y0) in GRID:
            vb = blk(b, x0, y0)
            if max(vb) >= 254.5 or min(vb) <= 0.5:
                continue
            va = blk(a, x0, y0)
            vc = blk(c, x0, y0)
            d1 = detrend([q - p for p, q in zip(vb, vc)])
            d2 = detrend([p - 2 * q + r for p, q, r in zip(va, vb, vc)])
            recs.append({"k": k, "x": x0, "y": y0, "mean": sum(vb) / N, "v1": var(d1), "v2": var(d2), "d1": d1})
    bins = {}
    for r in recs:
        bins.setdefault(int(r["mean"] // 32) * 32, []).append(r)
    sel = []
    for g, v in bins.items():
        if len(v) < 6:
            continue
        v.sort(key=lambda r: r["v1"])
        sel.extend(v[: max(2, int(0.3 * len(v)))])
    out = {"label": label, "pairs": len(ks), "n_static_blocks": len(sel)}
    sb = {}
    for r in sel:
        sb.setdefault(int(r["mean"] // 32) * 32, []).append(math.sqrt(r["v1"] / 2))
    out["sigma_t_by_grey"] = {f"{g}-{g + 31}": (round(sorted(v)[len(v) // 2], 2), len(v)) for g, v in sorted(sb.items())}
    allv = sorted(math.sqrt(r["v1"] / 2) for r in sel)
    out["sigma_t_median"] = round(allv[len(allv) // 2], 2)
    ratios = sorted(r["v2"] / r["v1"] for r in sel)
    med = ratios[len(ratios) // 2]
    out["d2_over_d1_var_median"] = round(med, 3)
    out["rho_from_d2_d1"] = round(3 - med, 3)
    hx = [0.0] * 4
    vy = [0.0] * 4
    for r in sel:
        a1, b1 = acf(r["d1"])
        for i in range(4):
            hx[i] += a1[i] / len(sel)
            vy[i] += b1[i] / len(sel)
    out["acf_h_lag1-4"] = [round(v, 3) for v in hx]
    out["acf_v_lag1-4"] = [round(v, 3) for v in vy]
    sub = sel[:: max(1, len(sel) // 80)]
    acc = None
    for r in sub:
        ps = nps(r["d1"])
        tot = sum(p for _, p in ps)
        if acc is None:
            acc = [[f, 0.0] for f, _ in ps]
        for i, (f, p) in enumerate(ps):
            acc[i][1] += p / tot / len(sub)
    out["nps_peak_cyc_px"] = round(max(acc, key=lambda q: q[1])[0], 3)
    out["nps_band_frac"] = {f"{a}-{b}": round(sum(p for f, p in acc if a < f <= b), 3) for a, b in [(0, 0.1), (0.1, 0.2), (0.2, 0.3), (0.3, 0.4), (0.4, 0.5)]}
    out["nps_curve"] = [(round(f, 3), round(p, 4)) for f, p in acc]
    # single-frame high-pass SD in the same static blocks: I - 5x5 box mean (computed per block interior)
    hp = []
    for r in sel[:: max(1, len(sel) // 120)]:
        img = frames[r["k"]]
        W = imlib.W
        s = 0.0
        n = 0
        for j in range(2, B - 2):
            for i in range(2, B - 2):
                y = r["y"] + j
                x = r["x"] + i
                m = 0.0
                for dy in (-2, -1, 0, 1, 2):
                    o = (y + dy) * W + x
                    m += img[o - 2] + img[o - 1] + img[o] + img[o + 1] + img[o + 2]
                d = img[y * W + x] - m / 25
                s += d * d
                n += 1
        hp.append(math.sqrt(s / n))
    hp.sort()
    out["single_frame_hp5_sd_median"] = round(hp[len(hp) // 2], 2)
    return out


def load_run(kind, rid):
    if kind == "npz":
        fr, meta = imlib.load_npz_run(rid)
        return fr, f"Azurion {rid} ({meta['primary_angle']:.0f},{meta['secondary_angle']:.0f}) {meta['artery_type']}"
    if kind == "cadica":
        names = imlib.cadica_frames(rid)
        return [imlib.load_png(imlib.cadica_png(rid, k + 1)) for k in range(len(names))], f"CADICA {rid}"
    if kind in ("cap", "cap768"):
        import glob
        fs = sorted(glob.glob(f"{imlib.SCR}/captures/{rid}_*.png"))
        out = []
        for f in fs:
            w, h, px = imlib.read_png_gray(f)
            img = imlib.to_f(px)
            if kind == "cap":
                out.append(imlib.resample512(img, w, h))
            else:
                # native 768: take the central 512x512 crop (no resampling)
                x0 = (w - 512) // 2
                out.append(imlib.array.array("d", [img[(x0 + j) * w + x0 + i] for j in range(512) for i in range(512)]))
        return out, f"renderer {kind} {rid}"
    if kind == "jpg":
        import os

        names = sorted(f for f in os.listdir(rid) if f.endswith(".jpg"))
        return [imlib.load_jpg(os.path.join(rid, n)) for n in names], "JPEG " + rid.split("/")[-1]


if __name__ == "__main__":
    kind = sys.argv[1]
    results = []
    for rid in sys.argv[2:]:
        fr, label = load_run(kind, rid)
        n = len(fr)
        ks = [k for k in (1, 3, 12, 20, 28, 36) if k + 1 < n]
        r = analyse(fr, label, ks)
        results.append(r)
        rr = dict(r)
        rr.pop("nps_curve")
        print(json.dumps(rr), flush=True)
    json.dump(results, open(f"{imlib.SCR}/noise2_{kind}_{'_'.join(x.split('/')[-1] for x in sys.argv[2:4])}.json", "w"), indent=1)
