"""
Anatomy-only sheet (C1, wave 2): the CPU line integral of the exact anatomy (scripts/thorax/probe_c1.ts, map P:
soft tissue, lungs, carve shapes; no bones, clutter, vessels or processing) for each reference view, histogram-
matched to frame 2 of the nearest-angle real run, next to that real frame. The display of a capture is close to
a monotonic map of the line integral, so the matched map shows where the anatomy alone puts the heart shadow,
the lung fields and the domes in the frame's tone scale.

  python3 scripts/realism/pmap_sheet.py <tag> <out.png> [--k 2]

Expects scripts/thorax/out/c1/<view>_<scenario>_k<k>_P.f32 and .json (run probe_c1.ts for each view first).
"""

import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

import contact_sheet
import imlib

VIEWS = [("raocaudal", "lad-focal", "LCA"), ("raocranial", "lad-focal", "LCA"), ("apcranial", "lad-focal", "LCA"), ("laocranial", "lad-focal", "LCA"), ("rcalao", "rca-calcified", "RCA"), ("rcarao", "rca-calcified", "RCA")]


def match(src, ref):
    """Histogram-match src (higher = darker) to the grey levels of ref."""
    order = np.argsort(-src.ravel())  # brightest (lowest P) first ... inverted below
    out = np.empty(src.size, dtype=np.float32)
    rs = np.sort(ref.ravel())  # ascending grey
    # the highest P gets the darkest grey
    ranks = np.empty(src.size, dtype=np.int64)
    ranks[np.argsort(src.ravel())[::-1]] = np.arange(src.size)
    out = rs[(ranks * (rs.size - 1) // max(1, src.size - 1))]
    return out.reshape(src.shape)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tag")
    ap.add_argument("out")
    ap.add_argument("--k", type=int, default=2)
    ap.add_argument("--size", type=int, default=256)
    a = ap.parse_args()
    d = os.path.join(imlib.ROOT, "scripts", "thorax", "out", "c1")
    S = a.size
    img = Image.new("L", (S * len(VIEWS), 2 * S + 14), 0)
    dr = ImageDraw.Draw(img)
    for i, (view, scen, art) in enumerate(VIEWS):
        base = os.path.join(d, f"{view}_{scen}_k{a.k}")
        meta = json.load(open(base + ".json"))
        n = meta["n"]
        P = np.fromfile(base + "_P.f32", dtype=np.float32).reshape(n, n)
        ca = meta["cArm"]
        prof, e = contact_sheet.nearest_runs(art, (ca["laoRao"], ca["cranialCaudal"]), 1)[0]
        real = contact_sheet._real_tile(prof, e, 2, S)
        r = np.asarray(real, dtype=np.float32)
        Pm = np.asarray(Image.fromarray(P).resize((S, S), Image.BILINEAR))
        m = match(Pm, r)
        img.paste(Image.fromarray(m.clip(0, 255).astype(np.uint8)), (i * S, 0))
        img.paste(real, (i * S, S))
        dr.text((i * S + 3, 2), f"{a.tag} {view}", fill=255)
        dr.text((i * S + 3, S + 2), f"{e['id']}", fill=255)
    dr.text((3, 2 * S + 1), "top: anatomy line integral (no bones, clutter or processing) histogram-matched to the real frame 2 below", fill=255)
    img.save(a.out)
    print(a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
