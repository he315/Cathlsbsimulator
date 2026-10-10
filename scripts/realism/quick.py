"""
Quick image-metric check of a capture set for calibration loops (C1, wave 2). Not a scorecard.

  python3 scripts/realism/quick.py <set> [--only seq1,seq2] [--jpeg]

Per cine sequence, on the lossless path (bilinear resample to 512 as imlib.resample512; --jpeg adds the
library's sips JPEG q72 round trip), prints the image rows report.py scores, with the same metric code:
- pre-contrast frame 2: texture terciles (band-pass RMS, power at 0.125 cycles/px, high-band slope),
  local contrast p99, thin dark-line count;
- grey p5/p50/p95 of the mid-run frame;
- peak frame local contrast p99 (largest over frames 8, 12, ..., 36, as measure.m_sequence);
- opacified area > 10 and > 20 levels and peak mean darkening (metrics.opacified on all frames).
Nothing is cached. Compare with the targets printed by report.py; final numbers come from report.py.
"""

import argparse
import json
import os
import sys

import imlib
import metrics
import sources


def load512(path, jpeg):
    w, h, px = imlib.read_png_gray(path)
    img = imlib.resample512(imlib.to_f(px), w, h)
    if jpeg:
        img = imlib.to_f(imlib.jpeg_roundtrip_many([imlib.to_u8(img)])[0])
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("set")
    ap.add_argument("--only", default=None)
    ap.add_argument("--jpeg", action="store_true")
    ap.add_argument("--no-opac", action="store_true")
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    rows = {}
    for seq, (meta, paths) in sorted(sources.capture_sequences(a.set).items()):
        if not meta or not paths or meta.get("spec", {}).get("mode") == "fluoro":
            continue
        if only and seq not in only:
            continue
        r = {}
        pre = load512(paths[2], a.jpeg)
        tx = metrics.texture(pre)
        for k in ("bright", "mid", "dark"):
            r[f"bp_{k}"] = tx[k]["bandpass_rms"]
        r["pow0125_bright"] = tx["bright"]["power_at_f"]["0.125"]
        r["slope_hi_bright"] = tx["bright"]["slope_hi"]
        r["lc_pre"] = round(metrics.local_contrast_p99(pre), 2)
        r["ridges"] = sum(metrics.ridges(pre))
        mid = load512(paths[len(paths) // 2], a.jpeg)
        r["pct_mid"] = metrics.grey_percentiles(mid)
        peaks = [(metrics.local_contrast_p99(load512(paths[k], a.jpeg)), k) for k in range(8, min(39, len(paths)), 4)]
        r["lc_peak"] = round(max(peaks)[0], 2)
        r["lc_peak_k"] = max(peaks)[1]
        if not a.no_opac:
            fr = [load512(p, False) for p in paths]
            r["opac"] = metrics.opacified(fr)
        rows[seq] = r
        print(seq, json.dumps(r))
    # medians over views of the texture rows (report.py takes the median over runs)
    def med(v):
        v = sorted(v)
        return v[len(v) // 2] if len(v) % 2 else 0.5 * (v[len(v) // 2 - 1] + v[len(v) // 2])

    if rows:
        print("median", json.dumps({k: round(med([r[k] for r in rows.values()]), 3) for k in ("bp_bright", "bp_mid", "bp_dark", "pow0125_bright", "slope_hi_bright", "lc_pre", "lc_peak", "ridges")}))


if __name__ == "__main__":
    sys.exit(main())
