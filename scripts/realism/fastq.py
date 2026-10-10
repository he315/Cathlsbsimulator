"""
Fast approximate image rows for calibration sweeps (C1, wave 2): numpy versions of quick.py's local contrast
and grey rows, plus the meter's window width from the capture metadata. Approximate (PIL bilinear resample,
edge-replicated box means); final numbers come from report.py.

  python3 scripts/realism/fastq.py <set>[,<set2>...]

Per cine sequence: lc_pre (local contrast p99 of frame 2), lc_peak (largest over frames 8, 12, ..., 36),
grey p5/p50/p95 of the mid-run frame (central 76 %), and the window width (log units) at frame 28.
"""

import sys

import numpy as np
from PIL import Image

import sources


def load(path):
    return np.asarray(Image.open(path).convert("L").resize((512, 512), Image.BILINEAR), dtype=np.float64)


def box_mean(a, r):
    k = 2 * r + 1
    p = np.pad(a, r, mode="edge")
    c = np.pad(p.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)


def lc_p99(a, r=20, margin=0.1):
    d = box_mean(a, r) - a
    m = int(512 * margin)
    v = np.sort(d[m:512 - m, m:512 - m].ravel())
    return float(v[int(0.99 * (v.size - 1))])


def pct(a, margin=0.12):
    m = int(512 * margin)
    c = a[m:512 - m, m:512 - m]
    return [int(round(float(np.percentile(c, q)))) for q in (5, 50, 95)]


def main():
    for s in sys.argv[1].split(","):
        rows = []
        for seq, (meta, paths) in sorted(sources.capture_sequences(s).items()):
            if not meta or not paths or (meta.get("spec") or {}).get("mode") == "fluoro" or "flush" in seq:
                continue
            pre = lc_p99(load(paths[2]))
            peak = max(lc_p99(load(paths[k])) for k in range(8, min(39, len(paths)), 4))
            p = pct(load(paths[len(paths) // 2]))
            w = None
            for a in meta.get("annotations") or []:
                if a.get("k") == 28 and a.get("meter"):
                    w = a["meter"]["width"]
            rows.append((seq, pre, peak, p, w))
            print(f"{s:14s} {seq:11s} lc_pre {pre:5.1f}  lc_peak {peak:5.1f}  grey {p}  width {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
