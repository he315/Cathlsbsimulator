"""
Side-by-side contact sheets: simulator captures against the nearest-angle real library runs (C1, wave 2).

  python3 scripts/realism/contact_sheet.py <set>[,<set2>...] [--out DIR] [--tag NAME] [--n 3] [--size 384] [--side-by-side]

With --side-by-side and several sets, each sheet shows one simulator column per set (calibration variants
next to each other), then the real runs.

For every captured cine sequence of the set(s) (fluoroscopy companions are skipped) the sheet shows two
rows, a pre-contrast frame and the peak-opacification frame, with the capture in the first column and the
n real CoronaryDominance runs of the same artery nearest in C-arm angle (Euclidean distance of the primary
and secondary angles; runs tagged artefact or uncertain, and runs shorter than 20 frames, are skipped) in
the next columns.

Frame choice, identical in spirit on both sides:
- pre-contrast: frame 2 (the library's pre-contrast frame in measure.m_sequence; the simulator's run opens
  on pre-contrast frames because the push follows the press by the operator delay);
- peak: the real run's timing peak from the cached measure.m_sequence result (largest opacified-pixel
  count, metrics.timing_signal), the capture's largest coronary iodine amount from its metadata.

Simulator frames are the native 768 px PNGs resampled to the tile size with a bilinear filter; real frames
are the library JPEGs (512 px). No other processing: grey levels are shown as stored. Each tile carries
its run id, angles and frame index. Output: <out>/<tag>_<sequence>.png (default out
docs/realism/wave2/C1-sheets, tag = the first set name).
"""

import argparse
import math
import os
import sys

from PIL import Image, ImageDraw

import imlib
import measure
import sources

LIB_PROFILES = ("cd-ds", "cd-main")


def _real_pool(artery):
    pool = []
    for prof in LIB_PROFILES:
        for e in sources.library_index(prof):
            if e.get("artery") != artery or not e.get("angles"):
                continue
            tags = e.get("tags") or {}
            if tags.get("artefact") or tags.get("uncertain"):
                continue
            if len(e.get("frames") or []) < 20:
                continue
            pool.append((prof, e))
    return pool


def nearest_runs(artery, angles, n=3):
    p0, s0 = angles
    pool = _real_pool(artery)
    pool.sort(key=lambda pe: (math.hypot(pe[1]["angles"]["primary"] - p0, pe[1]["angles"]["secondary"] - s0), pe[1]["id"]))
    return pool[:n]


def _real_peak(prof, e):
    run = sources.LibraryRun(prof, "matched", e)
    r = measure.m_sequence(run, sources.FPS[prof])
    if isinstance(r, dict) and r.get("timing") and r["timing"].get("peak_frame") is not None:
        return int(r["timing"]["peak_frame"])
    if isinstance(r, dict) and r.get("local_contrast") and r["local_contrast"].get("peak_frame") is not None:
        return int(r["local_contrast"]["peak_frame"])
    return min(len(e["frames"]) - 1, 30)


def _real_tile(prof, e, k, size):
    path = os.path.join(imlib.LIB, sources.PROFILE_DIRS[prof], e.get("dir", e["id"]), e["frames"][k])
    return Image.open(path).convert("L").resize((size, size), Image.BILINEAR)


def _sim_tile(path, size):
    return Image.open(path).convert("L").resize((size, size), Image.BILINEAR)


def _label(img, text):
    d = ImageDraw.Draw(img)
    w = int(d.textlength(text)) + 8
    d.rectangle([0, 0, w, 14], fill=0)
    d.text((4, 1), text, fill=255)


def sheet(set_names, seq, meta, paths, n, size, out, sims=None):
    """sims: optional [(label, meta, paths)] of several capture sets of the same sequence, shown as one
    simulator column each (variants side by side); default the single (set, meta, paths)."""
    sims = sims or [(set_names[0], meta, paths)]
    ca = meta.get("cArm") or meta.get("spec", {}).get("cArm")
    angles = (ca["laoRao"], ca["cranialCaudal"])
    artery = meta.get("artery", "LCA")
    k_pre = 2
    reals = nearest_runs(artery, angles, n)
    ns = len(sims)
    W = size * (ns + len(reals))
    img = Image.new("L", (W, 2 * size + 18), 0)
    hdr = ImageDraw.Draw(img)
    hdr.text((4, 2 * size + 3), f"{'/'.join(set_names)} {seq}  {artery}  sim LAO+/CRA+ {angles[0]:.0f}/{angles[1]:.0f}  rows: pre-contrast (frame 2), peak opacification", fill=255)
    for col, (lab, m, ps) in enumerate(sims):
        io = [(a.get("iodine") or 0.0, a.get("k")) for a in m.get("annotations") or [] if a.get("k") is not None]
        k_peak = max(io)[1] if io else len(ps) // 2
        for row, k in enumerate((k_pre, k_peak)):
            t = _sim_tile(ps[min(k, len(ps) - 1)], size)
            _label(t, f"SIM {lab if ns > 1 else seq} f{k}")
            img.paste(t, (col * size, row * size))
    for j, (prof, e) in enumerate(reals):
        kp = _real_peak(prof, e)
        for row, k in enumerate((2, kp)):
            t = _real_tile(prof, e, min(k, len(e["frames"]) - 1), size)
            _label(t, f"{e['id']} {e['angles']['primary']:.0f}/{e['angles']['secondary']:.0f} f{k}")
            img.paste(t, ((j + ns) * size, row * size))
    img.save(out, optimize=True)
    return [e["id"] for _, e in reals]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sets")
    ap.add_argument("--out", default=os.path.join(imlib.ROOT, "docs", "realism", "wave2", "C1-sheets"))
    ap.add_argument("--tag", default=None)
    ap.add_argument("--n", type=int, default=3)
    ap.add_argument("--size", type=int, default=384)
    ap.add_argument("--only", default=None, help="comma-separated sequence names")
    ap.add_argument("--side-by-side", action="store_true", help="several sets: one sheet per sequence, one simulator column per set")
    a = ap.parse_args()
    names = a.sets.split(",")
    os.makedirs(a.out, exist_ok=True)
    tag = a.tag or names[0]
    only = set(a.only.split(",")) if a.only else None
    if a.side_by_side and len(names) > 1:
        # one sheet per sequence with a simulator column per set (variants side by side)
        caps = [sources.capture_sequences(s) for s in names]
        for seq in sorted(caps[0]):
            sims = []
            for s, c in zip(names, caps):
                meta, paths = c.get(seq, (None, None))
                if meta and paths and meta.get("spec", {}).get("mode") != "fluoro":
                    sims.append((s, meta, paths))
            if not sims or (only and seq not in only):
                continue
            out = os.path.join(a.out, f"{tag}_{seq}.png")
            ids = sheet(names, seq, sims[0][1], sims[0][2], a.n, a.size, out, sims)
            print(out, ids)
        return 0
    for s in names:
        for seq, (meta, paths) in sorted(sources.capture_sequences(s).items()):
            if not meta or not paths or meta.get("spec", {}).get("mode") == "fluoro":
                continue
            if only and seq not in only:
                continue
            out = os.path.join(a.out, f"{tag}_{seq}.png")
            ids = sheet(names, seq, meta, paths, a.n, a.size, out)
            print(out, ids)


if __name__ == "__main__":
    sys.exit(main())
