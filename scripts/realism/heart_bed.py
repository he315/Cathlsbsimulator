"""
Tree-bed contrast (C1, wave 2): is the coronary tree projected over a heart shadow?

  python3 scripts/realism/heart_bed.py <set>[,<set2>...] [--n 8] [--only seq1,seq2]

For each cine sequence of the capture set(s), and for the n real CoronaryDominance runs of the same artery
nearest in C-arm angle (contact_sheet.nearest_runs), on 512 px frames (library JPEGs for the real runs, the
capture PNGs resampled bilinearly to 512 px):
- the tree bed: pixels of the central 76 % that are more than 20 grey levels darker at the peak frame
  than the pixelwise lightest of frames 0-2 (the opacified tree, as metrics.opacified), dilated by 9 px;
- bed: median grey of the pre-contrast frame 2 inside the tree bed;
- lung: 90th centile of frame 2 over the central 76 % (the bright lung field beside the heart);
- contrast = lung - bed (grey levels) and bed_rel = (lung - bed) / (lung - p10);
- tex_ratio: band-pass RMS (1.5 - 6 px difference of Gaussians) of frame 2 inside the tree bed over the same
  outside it in the bright field (above the 75th centile): lung markings over the tree mean a ratio near 1,
  a smooth heart shadow under it a ratio well below 1;
- bed_rank: fraction of the central region of frame 2 brighter than the bed median. The display is close to
  a monotonic map of the line integral, so this places the tree bed in the frame's tone scale whatever the
  window: a tree over a heart shadow sits in the darker half (rank above 0.5), a tree over lung in the
  brighter half.
Peak frame: the capture's largest coronary iodine amount (metadata), the real run's timing peak
(measure.m_sequence, cached). A real heart shadow under the tree gives a large contrast; a tree drawn over
aerated lung gives a small one. Not a scorecard row (no selection set): a calibration check.
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

import contact_sheet
import imlib
import sources


def to_np(img):
    return np.asarray(img, dtype=np.float32).reshape(512, 512)


def bed_metrics(pre, base, peak):
    m = 61  # 12 % margin of 512
    d = base - peak
    mask = d > 20
    # dilate by 9 px (separable max filter on the boolean mask)
    k = 9
    mm = mask.copy()
    for ax in (0, 1):
        acc = mm.copy()
        for s in range(1, k + 1):
            acc |= np.roll(mm, s, axis=ax) | np.roll(mm, -s, axis=ax)
        mm = acc
    inner = np.zeros_like(mm)
    inner[m:-m, m:-m] = True
    sel = mm & inner
    c = pre[m:-m, m:-m]
    lung = float(np.percentile(c, 90))
    p10 = float(np.percentile(c, 10))
    if sel.sum() < 200:
        return None
    bed = float(np.median(pre[sel]))
    # texture: band-pass (difference of 1.5 and 6 px Gaussian blurs) RMS inside the tree bed, against the
    # bright field outside it (frame-2 pixels above the 75th centile of the central region, not in the bed)
    bp = _blur(pre, 1.5) - _blur(pre, 6.0)
    bright = inner & ~mm & (pre > np.percentile(c, 75))
    t_bed = float(np.sqrt(np.mean(bp[sel] ** 2)))
    t_lung = float(np.sqrt(np.mean(bp[bright] ** 2))) if bright.sum() > 200 else float("nan")
    return {"bed": round(bed, 1), "lung": round(lung, 1), "contrast": round(lung - bed, 1), "bed_rel": round((lung - bed) / max(1.0, lung - p10), 3), "tex_ratio": round(t_bed / t_lung, 3), "bed_rank": round(float((c > bed).mean()), 3), "frac": round(float(sel.sum()) / inner.sum(), 3)}


def _blur(img, sigma):
    r = int(3 * sigma + 0.5)
    x = np.arange(-r, r + 1, dtype=np.float32)
    g = np.exp(-0.5 * (x / sigma) ** 2)
    g /= g.sum()
    out = np.apply_along_axis(lambda v: np.convolve(v, g, mode="same"), 0, img)
    return np.apply_along_axis(lambda v: np.convolve(v, g, mode="same"), 1, out)


def sim_seq(meta, paths):
    io = [(a.get("iodine") or 0.0, a.get("k")) for a in meta.get("annotations") or [] if a.get("k") is not None]
    kp = max(io)[1] if io else len(paths) // 2
    load = lambda k: np.asarray(Image.open(paths[k]).convert("L").resize((512, 512), Image.BILINEAR), dtype=np.float32)
    f0, f1, f2 = load(0), load(1), load(2)
    return bed_metrics(f2, np.maximum(np.maximum(f0, f1), f2), load(kp))


def real_run(prof, e):
    kp = contact_sheet._real_peak(prof, e)
    load = lambda k: np.asarray(contact_sheet._real_tile(prof, e, min(k, len(e["frames"]) - 1), 512), dtype=np.float32)
    f0, f1, f2, fp = load(0), load(1), load(2), load(kp)
    return bed_metrics(f2, np.maximum(np.maximum(f0, f1), f2), fp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sets")
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("--only", default=None)
    ap.add_argument("--no-real", action="store_true")
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    real_done = set()
    for s in a.sets.split(","):
        for seq, (meta, paths) in sorted(sources.capture_sequences(s).items()):
            if not meta or not paths or meta.get("spec", {}).get("mode") == "fluoro" or "flush" in seq:
                continue
            if only and seq not in only:
                continue
            r = sim_seq(meta, paths)
            print(f"{s:14s} {seq:12s} {r}")
            if a.no_real or seq in real_done:
                continue
            real_done.add(seq)
            ca = meta.get("cArm") or meta.get("spec", {}).get("cArm")
            rows = []
            for prof, e in contact_sheet.nearest_runs(meta.get("artery", "LCA"), (ca["laoRao"], ca["cranialCaudal"]), a.n):
                try:
                    x = real_run(prof, e)
                except Exception as ex:  # a damaged library run must not stop the check
                    x = None
                    print("   ", e["id"], "error", ex)
                if x:
                    rows.append(x)
                    print(f"   {e['id']:22s} {e['angles']['primary']:.0f}/{e['angles']['secondary']:.0f} {x}")
            if rows:
                cs = sorted(x["contrast"] for x in rows)
                br = sorted(x["bed_rel"] for x in rows)
                tr = sorted(x["tex_ratio"] for x in rows)
                rk = sorted(x["bed_rank"] for x in rows)
                print(f"   real contrast min/median/max {cs[0]}/{cs[len(cs) // 2]}/{cs[-1]}  bed_rel {br[0]}/{br[len(br) // 2]}/{br[-1]}  tex_ratio {tr[0]}/{tr[len(tr) // 2]}/{tr[-1]}  bed_rank {rk[0]}/{rk[len(rk) // 2]}/{rk[-1]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
