"""
(1) Noise: spatial SD in flat regions vs grey level, autocorrelation at lags 1-4 px, noise power
spectrum shape, and frame-to-frame (temporal) noise -> recursive-filter correlation estimate.

Method
  * 32x32 blocks on a regular grid (16 px stride), 16 px margin from the image edge.
  * Each block: least-squares quadratic surface removed; residual SD and mean grey level.
  * "Flat" blocks = the lowest-SD 20% of blocks within each 32-grey-level bin (anatomy only adds
    variance, so the lowest-variance blocks are noise dominated).
  * ACF: normalised autocorrelation of the residual at horizontal / vertical lags 1..4,
    averaged over flat blocks.
  * NPS: radially averaged |FFT|^2 of the Hann-windowed residual, normalised to sum 1, averaged.
  * Temporal: the same flat block locations in frame k and k+1; residual SD of the difference
    image (quadratic removed); rho = 1 - var(diff) / (2 var(single)), the correlation between
    consecutive frames' noise (motion inflates var(diff), so rho is a lower bound).
"""

import json
import math
import sys

import imlib

B = 32
STRIDE = 16
MARGIN = 16


def blocks_stats(img):
    out = []
    for y0 in range(MARGIN, imlib.H - MARGIN - B + 1, STRIDE):
        for x0 in range(MARGIN, imlib.W - MARGIN - B + 1, STRIDE):
            b = imlib.block(img, x0, y0, B, B)
            mx = max(max(r) for r in b)
            mn = min(min(r) for r in b)
            if mx >= 254.5 or mn <= 0.5:
                continue  # clipped
            res, m = imlib.detrend_quad(b)
            sd = math.sqrt(sum(v * v for r in res for v in r) / (B * B - 6))
            out.append({"x": x0, "y": y0, "mean": m, "sd": sd, "res": res})
    return out


def flat_select(stats, frac=0.2, binw=32):
    bins = {}
    for s in stats:
        bins.setdefault(int(s["mean"] // binw), []).append(s)
    sel = []
    for k, v in bins.items():
        v.sort(key=lambda s: s["sd"])
        n = max(1, int(len(v) * frac))
        if len(v) >= 5:
            sel.extend(v[:n])
    return sel


def nps_shape(sel):
    acc = None
    for s in sel:
        ps = imlib.radial_ps(s["res"])
        tot = sum(p for _, p in ps)
        if acc is None:
            acc = [[f, 0.0] for f, _ in ps]
        for i, (f, p) in enumerate(ps):
            acc[i][1] += p / tot / len(sel)
    return acc


def analyse_frames(frames, label, temporal_pairs=()):
    res = {"label": label}
    allsel = []
    for fi, img in enumerate(frames):
        st = blocks_stats(img)
        sel = flat_select(st)
        allsel.extend(sel)
    # noise vs grey level
    bins = {}
    for s in allsel:
        bins.setdefault(int(s["mean"] // 32) * 32, []).append(s["sd"])
    res["sd_by_grey"] = {f"{k}-{k + 31}": (round(sorted(v)[len(v) // 2], 2), len(v)) for k, v in sorted(bins.items())}
    sds = sorted(s["sd"] for s in allsel)
    res["sd_median_flat"] = round(sds[len(sds) // 2], 2)
    # ACF
    hx = [0.0] * 4
    vy = [0.0] * 4
    for s in allsel:
        a, b, _ = imlib.acf_block(s["res"])
        for i in range(4):
            hx[i] += a[i] / len(allsel)
            vy[i] += b[i] / len(allsel)
    res["acf_h"] = [round(v, 3) for v in hx]
    res["acf_v"] = [round(v, 3) for v in vy]

    def corr_len(a):
        seq = [1.0] + a
        for i in range(1, len(seq)):
            if seq[i] < 1 / math.e:
                return round(i - 1 + (seq[i - 1] - 1 / math.e) / (seq[i - 1] - seq[i]), 2)
        return ">4"

    res["corr_len_1e_px_h"] = corr_len(hx)
    res["corr_len_1e_px_v"] = corr_len(vy)
    # NPS shape (subset for speed)
    sub = allsel[:: max(1, len(allsel) // 60)]
    nps = nps_shape(sub)
    peak = max(nps, key=lambda q: q[1])
    res["nps_peak_cyc_per_px"] = round(peak[0], 3)
    # NPS in 4 bands
    bands = [(0.0, 0.1), (0.1, 0.2), (0.2, 0.3), (0.3, 0.5)]
    res["nps_band_fraction"] = {f"{a}-{b}": round(sum(p for f, p in nps if a < f <= b), 3) for a, b in bands}
    res["nps_curve"] = [(round(f, 3), round(p, 4)) for f, p in nps]
    # temporal
    if temporal_pairs:
        rhos = []
        ratios = []
        for (a, b) in temporal_pairs:
            st = blocks_stats(a)
            sel = flat_select(st)
            for s in sel:
                x0, y0 = s["x"], s["y"]
                d = [[b[(y0 + j) * imlib.W + x0 + i] - a[(y0 + j) * imlib.W + x0 + i] for i in range(B)] for j in range(B)]
                dr, _ = imlib.detrend_quad(d)
                vd = sum(v * v for r in dr for v in r) / (B * B - 6)
                ratios.append(vd / (2 * s["sd"] ** 2))
        ratios.sort()
        med = ratios[len(ratios) // 2]
        q1 = ratios[len(ratios) // 4]
        res["temporal_var_ratio_median"] = round(med, 3)
        res["temporal_var_ratio_q1"] = round(q1, 3)
        res["rho_consecutive_frames_median"] = round(1 - med, 3)
        res["rho_consecutive_frames_q1based"] = round(1 - q1, 3)
        res["n_temporal_blocks"] = len(ratios)
    res["n_flat_blocks"] = len(allsel)
    return res


def run_npz(run_id, idx):
    frames, meta = imlib.load_npz_run(run_id)
    use = [frames[i] for i in idx if i < len(frames)]
    pairs = [(frames[i], frames[i + 1]) for i in idx if i + 1 < len(frames)]
    r = analyse_frames(use, f"Azurion npz {run_id}", pairs)
    r["angles"] = (meta["primary_angle"], meta["secondary_angle"])
    return r


def run_cadica(run_id, idx):
    names = imlib.cadica_frames(run_id)
    frames = [imlib.load_png(imlib.cadica_png(run_id, k + 1)) for k in range(len(names))]
    use = [frames[i] for i in idx if i < len(frames)]
    pairs = [(frames[i], frames[i + 1]) for i in idx if i + 1 < len(frames)]
    return analyse_frames(use, f"CADICA png {run_id}", pairs)


def run_jpg(folder, idx):
    import os

    names = sorted(f for f in os.listdir(folder) if f.endswith(".jpg"))
    frames = [imlib.load_jpg(os.path.join(folder, names[i])) for i in sorted(set(idx + [i + 1 for i in idx])) if i < len(names)]
    return analyse_frames(frames[:: 2], f"JPEG {folder.split('/')[-1]}", [(frames[i], frames[i + 1]) for i in range(0, len(frames) - 1, 2)])


if __name__ == "__main__":
    kind = sys.argv[1]
    out = []
    if kind == "npz":
        for rid in sys.argv[2:]:
            out.append(run_npz(rid, [0, 2, 20, 30]))
    elif kind == "cadica":
        for rid in sys.argv[2:]:
            out.append(run_cadica(rid, [0, 2, 15, 25]))
    elif kind == "jpg":
        for f in sys.argv[2:]:
            out.append(run_jpg(f, [0, 2, 20, 30]))
    elif kind == "png1":
        # single PNG (e.g. a renderer capture), any square size: crop the central 512
        w, h, px = imlib.read_png_gray(sys.argv[2])
        x0 = (w - 512) // 2
        y0 = (h - 512) // 2
        img = imlib.to_f(bytes(px[(y0 + j) * w + x0 + i] for j in range(512) for i in range(512)))
        out.append(analyse_frames([img], "single " + sys.argv[2]))
    for r in out:
        r2 = dict(r)
        r2.pop("nps_curve", None)
        print(json.dumps(r2))
    json.dump(out, open(f"{imlib.SCR}/noise_{kind}_{len(out)}.json", "w"), indent=1)
