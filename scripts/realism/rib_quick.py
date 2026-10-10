"""
Quick rib-margin check of a capture set (C1, wave 2), with report.py's own code path and no cache.

  python3 scripts/realism/rib_quick.py <set> [--only seq1,seq2]

For each cine sequence: the still frame (report._still_frame), the rib margins annotated on it (capture
metadata `ribs`, upper and lower margin polylines from the thorax rib lines), clipped to the analysis frame,
at most 8 per sequence, measured with metrics.vessel_profiles on the matched pipeline. Prints the median FWHM
and depth per sequence and over all profiles (report.py takes the median of the per-run medians; compare
with its "rib margins" rows).
"""

import argparse
import sys

import imlib
import metrics
import report
import sources


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("set")
    ap.add_argument("--only", default=None)
    a = ap.parse_args()
    only = set(a.only.split(",")) if a.only else None
    per_run = {"fwhm_px": [], "depth": []}
    for seq, (meta, paths) in sorted(sources.capture_sequences(a.set).items()):
        if not meta or not paths or report._is_fluoro(meta) or report._is_flush(meta):
            continue
        if only and seq not in only:
            continue
        run = sources.CaptureRun(a.set, seq, meta, paths, "matched")
        ks = report._still_frame(run)
        ann = report._ann(run, ks) if ks is not None else None
        if not ann or not ann.get("ribs"):
            print(seq, "no rib annotations")
            continue
        fr = run.frames([ks])
        cands = []
        for i, rb in enumerate(ann["ribs"]):
            for side in ("upper", "lower"):
                poly = report._clip_poly(report._to512(run, rb[side]), 24)
                if len(poly) >= 3 and report._poly_len(poly) >= 40:
                    cands.append(poly)
        res = [r for r in (metrics.vessel_profiles(fr, p) for p in cands[:8]) if r and "error" not in r]
        if not res:
            print(seq, "no profiles")
            continue
        f = imlib.median([r["fwhm_px"] for r in res if r.get("fwhm_px") is not None])
        d = imlib.median([r["depth"] for r in res if r.get("depth") is not None])
        per_run["fwhm_px"].append(f)
        per_run["depth"].append(d)
        print(f"{seq:12s} n={len(res)} fwhm {f:.2f} depth {d:.2f}")
    if per_run["depth"]:
        print(f"median over runs: fwhm {imlib.median(per_run['fwhm_px']):.2f} depth {imlib.median(per_run['depth']):.2f}  (library 4.01-4.16, 13.9-29.7)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
