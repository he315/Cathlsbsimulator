"""
(8) Field shape, collimation, vignetting, straight filter edges.

A. Mean image over many runs (one early frame per run) -> the anatomy averages out, leaving
   systematic field effects. Reported: mean grey in concentric rings (radius as a fraction of the
   half-width), mean of the outer 2/4/8/16 px border bands vs the centre, and the four corners.
B. Straight-edge detector per frame: for every column x (and row y), the median over all rows of
   the 4-px horizontal difference I[x-2]-I[x+2], and the fraction of rows where it has the same
   sign. A semi-transparent straight edge (wedge filter / shutter) gives |median| >= 4 grey levels
   with >= 70% sign agreement over the whole height; anatomy does not.
"""

import json
import math
import os
import random
import sys

import imlib


def ring_profile(img):
    acc = [0.0] * 12
    cnt = [0] * 12
    for y in range(512):
        for x in range(512):
            r = math.hypot((x - 255.5) / 256, (y - 255.5) / 256)
            k = min(11, int(r / 0.125))
            acc[k] += img[y * 512 + x]
            cnt[k] += 1
    return [round(a / c, 1) if c else None for a, c in zip(acc, cnt)]


def border_bands(img):
    def band(w0, w1):
        s = 0.0
        c = 0
        for y in range(512):
            for x in range(512):
                d = min(x, y, 511 - x, 511 - y)
                if w0 <= d < w1:
                    s += img[y * 512 + x]
                    c += 1
        return s / c

    centre = sum(img[y * 512 + x] for y in range(192, 320) for x in range(192, 320)) / (128 * 128)
    return {
        "centre": round(centre, 1),
        "0-2px": round(band(0, 2), 1),
        "2-4px": round(band(2, 4), 1),
        "4-8px": round(band(4, 8), 1),
        "8-16px": round(band(8, 16), 1),
        "16-32px": round(band(16, 32), 1),
        "32-64px": round(band(32, 64), 1),
    }


def straight_edges(img, thr=4.0, agree=0.7):
    found = []
    for x in range(8, 504):
        ds = [img[y * 512 + x - 2] - img[y * 512 + x + 2] for y in range(16, 496, 2)]
        ds.sort()
        med = ds[len(ds) // 2]
        if abs(med) >= thr:
            same = sum(1 for d in ds if d * med > 0) / len(ds)
            if same >= agree:
                found.append(("col", x, round(med, 1), round(same, 2)))
    for y in range(8, 504):
        ds = [img[y * 512 - 2 * 512 + x] - img[y * 512 + 2 * 512 + x] for x in range(16, 496, 2)]
        ds.sort()
        med = ds[len(ds) // 2]
        if abs(med) >= thr:
            same = sum(1 for d in ds if d * med > 0) / len(ds)
            if same >= agree:
                found.append(("row", y, round(med, 1), round(same, 2)))
    # merge adjacent detections
    merged = []
    for f in found:
        if merged and merged[-1][0] == f[0] and f[1] - merged[-1][1] <= 3:
            if abs(f[2]) > abs(merged[-1][2]):
                merged[-1] = f
            continue
        merged.append(f)
    return merged


def frames_for(kind, n, seed=3):
    random.seed(seed)
    if kind == "azurion":
        d = json.load(open(f"{imlib.LIB}/dominance/index.json"))
        runs = [r["id"] for p in d["patients"] for r in p["runs"]]
        for rid in random.sample(runs, n):
            fr, _ = imlib.load_npz_run(rid, frames=[2])
            yield rid, fr[0]
    elif kind == "cadica":
        d = json.load(open(f"{imlib.LIB}/cadica/index.json"))
        runs = [r["id"] for p in d["patients"] for r in p["runs"]]
        import os
        for rid in random.sample(runs, n):
            names = imlib.cadica_frames(rid) if os.path.isdir(os.path.dirname(imlib.cadica_png(rid, 1))) else []
            if len(names) < 3:
                continue
            p, v = rid.split("_")
            yield rid, imlib.load_png(os.path.join(imlib.CADICA_ROOT, p, v, "input", names[1]))
    else:
        sub = {"allura": "dominance-main", "angiocad": "angiocad"}[kind]
        d = json.load(open(f"{imlib.LIB}/{sub}/index.json"))
        runs = [r["id"] for p in d["patients"] for r in p["runs"]]
        for rid in random.sample(runs, n):
            yield rid, imlib.load_jpg(f"{imlib.LIB}/{sub}/{rid}/f003.jpg")


if __name__ == "__main__":
    kind = sys.argv[1]
    n = int(sys.argv[2])
    acc = imlib.array.array("d", [0.0]) * (512 * 512)
    edges = []
    k = 0
    for rid, img in frames_for(kind, n):
        for i in range(512 * 512):
            acc[i] += img[i]
        e = straight_edges(img)
        if e:
            edges.append((rid, e))
        k += 1
    mean = imlib.array.array("d", [v / k for v in acc])
    imlib.save_img(mean, f"{imlib.SCR}/view/mean_{kind}.png")
    out = {"kind": kind, "n": k, "rings_r_step_0.125": ring_profile(mean), "border": border_bands(mean),
           "corners_16px": [round(sum(mean[(y0 + j) * 512 + x0 + i] for j in range(16) for i in range(16)) / 256, 1) for (x0, y0) in ((0, 0), (496, 0), (0, 496), (496, 496))],
           "runs_with_straight_edges": len(edges), "edges": edges}
    print(json.dumps({k2: v for k2, v in out.items() if k2 != "edges"}))
    for e in edges:
        print(e)
    json.dump(out, open(f"{imlib.SCR}/field_{kind}.json", "w"), indent=1)
