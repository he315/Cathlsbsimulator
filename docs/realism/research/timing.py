"""
(7) Contrast timing per run.

Per frame: vessel signal S = sum over pixels of max(0, (mean_15x15(I) - I) - 10), i.e. the
"black top-hat" energy of thin dark structures more than 10 grey levels below their local mean
(about 3x the noise SD), computed on a 256x256 2x2-binned frame for speed (binning keeps vessels
>= 1 px wide). The catheter and static dark lines give a baseline.
From S(t): baseline = median of the first 2 frames; peak = max; frames are reported where S first
exceeds baseline + 10%, 50% and 90% of (peak - baseline) (first appearance, half filling, full
opacification), the number of frames >= 90% (plateau), and the frames after the peak where S
falls below 50% and 20% (washout). Frame rates: Azurion 15/s, CADICA 10/s (dataset metadata).
"""

import json
import os
import sys

import imlib


def bin2(img):
    W = imlib.W
    out = imlib.array.array("d", [0.0]) * (256 * 256)
    for y in range(256):
        o = 2 * y * W
        o2 = o + W
        for x in range(256):
            out[y * 256 + x] = 0.25 * (img[o + 2 * x] + img[o + 2 * x + 1] + img[o2 + 2 * x] + img[o2 + 2 * x + 1])
    return out


def signal(img):
    """(all thin dark structures energy, count of pixels > 30 below local mean = major vessels)"""
    b = bin2(img)
    m = imlib.box_mean(b, 7, 256, 256)
    s = 0.0
    c = 0
    for i in range(256 * 256):
        d = m[i] - b[i]
        if d > 10:
            s += d - 10
            if d > 30:
                c += 1
    return s, c


def features(S):
    # frame 0 is excluded from the baseline: the first cine frame often differs (exposure settling)
    base = min(S[1:4])
    pk = max(S)
    ip = S.index(pk)
    rng = pk - base

    def first(th, start=0):
        for i in range(start, len(S)):
            if S[i] >= base + th * rng:
                return i
        return None

    def fall(th):
        for i in range(ip, len(S)):
            if S[i] < base + th * rng:
                return i
        return None

    f10, f50, f90 = first(0.1), first(0.5), first(0.9)
    plateau = sum(1 for v in S if v >= base + 0.9 * rng)
    return {
        "n": len(S),
        "base": round(base),
        "peak": round(pk),
        "peak_over_base": round(pk / base, 2) if base else None,
        "f10": f10,
        "f50": f50,
        "f90": f90,
        "peak_frame": ip,
        "frames_ge90": plateau,
        "wash50": fall(0.5),
        "wash20": fall(0.2),
        "end_rel": round((S[-1] - base) / rng, 2) if rng else None,
    }


def run_npz(rid):
    fr, meta = imlib.load_npz_run(rid)
    S = [signal(f) for f in fr]
    return S, meta


if __name__ == "__main__":
    kind = sys.argv[1]
    out = {}
    path = f"{imlib.SCR}/timing2_{kind}.json"
    if os.path.exists(path):
        out = json.load(open(path))
    for rid in sys.argv[2:]:
        if rid in out:
            continue
        if kind == "npz":
            S, meta = run_npz(rid)
            fps = 15
            label = f"{meta['artery_type']} ({meta['primary_angle']:.0f},{meta['secondary_angle']:.0f})"
        else:
            names = imlib.cadica_frames(rid)
            S = [signal(imlib.load_png(imlib.cadica_png(rid, k + 1))) for k in range(len(names))]
            fps = 10
            label = rid
        f = features([a for a, _ in S])
        f["major"] = features([b for _, b in S])
        f["fps"] = fps
        f["label"] = label
        f["S"] = [round(a) for a, _ in S]
        f["C"] = [b for _, b in S]
        out[rid] = f
        ff = dict(f)
        ff.pop("S")
        print(rid, json.dumps(ff), flush=True)
        json.dump(out, open(path, "w"))
