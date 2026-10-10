"""
(5) Background texture: radially averaged power spectrum of pre-contrast frames.

Method: 128x128 tiles on a 64-px grid (49 tiles) of a pre-contrast frame (frame index 2, after
exposure settling has mostly happened; no iodine yet in any run used), plane removed, Hann
window, radial power spectrum. Log-log slope fitted over 0.016-0.1 cycles/px (anatomy band:
wavelengths 10-64 px) and 0.1-0.3 cycles/px (fine texture + noise). Tiles are classed by mean
grey level into terciles within the frame (bright = aerated lung / thin paths, dark = heart,
spine, diaphragm, liver). Also reports the "texture contrast" as the RMS of the 4-32 px band
(band-pass via difference of 3x3 and 33x33 box means) in each class.
For comparison the same is run on renderer captures (resampled to 512 px).
"""

import json
import math
import sys

import imlib


def tile(img, x0, y0, n=128):
    return [[img[(y0 + j) * 512 + x0 + i] for i in range(n)] for j in range(n)]


def analyse(img, label):
    tiles = []
    for y0 in range(0, 512 - 128 + 1, 64):
        for x0 in range(0, 512 - 128 + 1, 64):
            t = tile(img, x0, y0)
            m = sum(map(sum, t)) / (128 * 128)
            ps = imlib.radial_ps(t)
            s1 = imlib.loglog_slope(ps, 0.016, 0.1)
            s2 = imlib.loglog_slope(ps, 0.1, 0.3)
            tiles.append({"x": x0, "y": y0, "mean": m, "s_lo": s1, "s_hi": s2, "ps": ps})
    tiles.sort(key=lambda t: t["mean"])
    n = len(tiles)
    cls = {"dark": tiles[: n // 3], "mid": tiles[n // 3 : 2 * n // 3], "bright": tiles[2 * n // 3 :]}
    # band-pass texture RMS
    b3 = imlib.box_mean(img, 1)
    b33 = imlib.box_mean(img, 16)
    out = {"label": label}
    for k, ts in cls.items():
        sl = sorted(t["s_lo"] for t in ts if t["s_lo"] == t["s_lo"])
        sh = sorted(t["s_hi"] for t in ts if t["s_hi"] == t["s_hi"])
        rms = []
        for t in ts:
            s = 0.0
            c = 0
            for j in range(t["y"] + 16, t["y"] + 112, 2):
                for i in range(t["x"] + 16, t["x"] + 112, 2):
                    d = b3[j * 512 + i] - b33[j * 512 + i]
                    s += d * d
                    c += 1
            rms.append(math.sqrt(s / c))
        rms.sort()
        # mean spectrum of the class (power at a few frequencies)
        f_sel = [0.016, 0.031, 0.062, 0.125, 0.25]
        pw = {}
        for f in f_sel:
            vals = []
            for t in ts:
                best = min(t["ps"], key=lambda q: abs(q[0] - f))
                vals.append(best[1])
            vals.sort()
            pw[str(f)] = round(vals[len(vals) // 2], 2)
        out[k] = {
            "mean_grey": round(sum(t["mean"] for t in ts) / len(ts), 1),
            "slope_0.016-0.1_median": round(sl[len(sl) // 2], 2),
            "slope_0.1-0.3_median": round(sh[len(sh) // 2], 2),
            "bandpass_4-32px_rms_median": round(rms[len(rms) // 2], 2),
            "power_at_f": pw,
        }
    return out


def load_any(spec):
    kind, rid, k = spec.split(":")
    k = int(k)
    if kind == "npz":
        fr, meta = imlib.load_npz_run(rid, frames=[k])
        return fr[0], f"Azurion {rid} f{k} ({meta['primary_angle']:.0f},{meta['secondary_angle']:.0f})"
    if kind == "cadica":
        return imlib.load_png(imlib.cadica_png(rid, k + 1)), f"CADICA {rid} f{k}"
    if kind == "jpg":
        return imlib.load_jpg(f"{imlib.LIB}/{rid}/f{k + 1:03d}.jpg"), f"JPEG {rid} f{k}"
    if kind == "png":
        w, h, px = imlib.read_png_gray(rid)
        img = imlib.to_f(px)
        if w != 512:
            # renderer capture: drop the outer 4% (black field border), resample the rest to 512
            m = int(0.04 * w)
            out = imlib.array.array("d", [0.0]) * (512 * 512)
            for y in range(512):
                for x in range(512):
                    out[y * 512 + x] = imlib.bil(img, m + x * (w - 1 - 2 * m) / 511, m + y * (h - 1 - 2 * m) / 511, w, h)
            img = out
        return img, f"PNG {rid.split('/')[-1]}"


if __name__ == "__main__":
    res = []
    for spec in sys.argv[1:]:
        img, label = load_any(spec)
        r = analyse(img, label)
        res.append(r)
        print(json.dumps(r), flush=True)
    json.dump(res, open(f"{imlib.SCR}/texture_{len(res)}.json", "w"), indent=1)
