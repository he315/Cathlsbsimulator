"""
(3)/(4) Vessel cross-section profiles.

Input: JSON list of jobs {name, src, run, frames, pts:[[x,y],...] polyline along the vessel}.
Method: walk the polyline every 1.5 px; at each step sample the profile along the local normal
(+-18 px, 0.25 px steps, bilinear), smooth with a 1-px running mean, find the darkest point
within +-4 px of the tracked centre and re-centre on it (the track follows curvature).
Per profile:
  bg     = mean of both sides 11..17 px from the centre (beyond the halo of thin vessels),
  depth  = bg - min (grey levels; display domain, dark = iodine),
  FWHM   = width at bg - depth/2, w80/w20 = widths at 80% and 20% of the depth (shape: ellipse
           chord 0.61, parabola 0.50, Gaussian 0.37, blurred flat-top > 0.7),
  edge   = mean over both sides of the 10%->90% depth distance,
  halo   = max of the profile 1..6 px outside the FWHM edges minus bg (bright rim from edge
           enhancement; positive = rim brighter than background).
Medians over all profiles of a job are reported, plus the median-aligned mean profile.
"""

import json
import math
import sys

import imlib


def smooth(vals, k=4):
    out = []
    n = len(vals)
    for i in range(n):
        a = max(0, i - k)
        b = min(n, i + k + 1)
        out.append(sum(vals[a:b]) / (b - a))
    return out


def width_at(off, vals, ci, level):
    """Distance between the crossings of `level` on either side of index ci (linear interp)."""
    L = R = None
    for i in range(ci, 0, -1):
        if vals[i - 1] >= level > vals[i] or vals[i - 1] >= level >= vals[i] and vals[i - 1] != vals[i]:
            L = off[i - 1] + (level - vals[i - 1]) / (vals[i] - vals[i - 1]) * (off[i] - off[i - 1])
            break
    for i in range(ci, len(vals) - 1):
        if vals[i + 1] >= level > vals[i] or vals[i + 1] >= level >= vals[i] and vals[i + 1] != vals[i]:
            R = off[i] + (level - vals[i]) / (vals[i + 1] - vals[i]) * (off[i + 1] - off[i])
            break
    if L is None or R is None:
        return None, None, None
    return R - L, L, R


def measure_profile(off, raw):
    sm = smooth(raw, 2)
    # centre index = darkest within +-4 px
    cand = [i for i, o in enumerate(off) if abs(o) <= 4]
    ci = min(cand, key=lambda i: sm[i])
    side = [v for o, v in zip(off, sm) if 11 <= abs(o - off[ci]) <= 17]
    if len(side) < 8:
        return None
    left = [v for o, v in zip(off, sm) if -17 <= o - off[ci] <= -11]
    right = [v for o, v in zip(off, sm) if 11 <= o - off[ci] <= 17]
    bg = 0.5 * (sum(left) / len(left) + sum(right) / len(right))
    mn = sm[ci]
    depth = bg - mn
    if depth <= 0:
        return None
    fw, L, R = width_at(off, sm, ci, bg - 0.5 * depth)
    w80, _, _ = width_at(off, sm, ci, bg - 0.8 * depth)
    w20, L20, R20 = width_at(off, sm, ci, bg - 0.2 * depth)
    w10, L10, R10 = width_at(off, sm, ci, bg - 0.1 * depth)
    w90, L90, R90 = width_at(off, sm, ci, bg - 0.9 * depth)
    if None in (fw, w80, w20, w10, w90):
        return None
    edge = 0.5 * ((L90 - L10) + (R10 - R90))
    hl = [v for o, v in zip(off, sm) if L - 6 <= o <= L - 1]
    hr = [v for o, v in zip(off, sm) if R + 1 <= o <= R + 6]
    bl = sum(left) / len(left)
    br = sum(right) / len(right)
    halo = 0.5 * ((max(hl) - bl) + (max(hr) - br)) if hl and hr else None
    # left/right asymmetry of the background (local gradient)
    return {
        "bg": bg,
        "depth": depth,
        "fwhm": fw,
        "w80_w20": w80 / w20 if w20 else None,
        "edge10_90": edge,
        "halo": halo,
        "centre": off[ci],
        "noise_bg": None,
    }


def walk(img, pts, half=18, step=0.25, every=1.5, notrack=False):
    profs = []
    track = 0.0
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0)
        tx, ty = (x1 - x0) / L, (y1 - y0) / L
        nx, ny = -ty, tx
        s = 0.0
        while s < L:
            cx, cy = x0 + tx * s, y0 + ty * s
            cx2, cy2 = cx + nx * track, cy + ny * track
            pr = imlib.profile(img, cx2, cy2, nx, ny, half=half, step=step)
            off = [o for o, _ in pr]
            raw = [v for _, v in pr]
            if all(v == v for v in raw):
                m = measure_profile(off, raw)
                if m and notrack:
                    m["raw"] = raw
                    profs.append(m)
                elif m:
                    track += m["centre"]
                    track = max(-6, min(6, track))
                    # re-sample centred
                    pr2 = imlib.profile(img, cx + nx * track, cy + ny * track, nx, ny, half=half, step=step)
                    raw2 = [v for _, v in pr2]
                    if all(v == v for v in raw2):
                        m2 = measure_profile(off, raw2)
                        if m2:
                            m2["raw"] = raw2
                            profs.append(m2)
            s += every
    return profs, off


def med(v):
    v = sorted(x for x in v if x is not None)
    return v[len(v) // 2] if v else None


def q(v, f):
    v = sorted(x for x in v if x is not None)
    return v[int(f * (len(v) - 1))] if v else None


def load(job):
    if job["src"] == "npz":
        fr, _ = imlib.load_npz_run(job["run"], frames=job["frames"])
        return fr
    if job["src"] == "cadica":
        return [imlib.load_png(imlib.cadica_png(job["run"], k + 1)) for k in job["frames"]]
    if job["src"] == "jpg":
        return [imlib.load_jpg(f"{imlib.LIB}/{job['run']}/f{k + 1:03d}.jpg") for k in job["frames"]]
    if job["src"] == "png":
        w, h, px = imlib.read_png_gray(job["run"])
        img = imlib.to_f(px)
        if w != 512:
            out = imlib.array.array("d", [0.0]) * (512 * 512)
            for y in range(512):
                for x in range(512):
                    out[y * 512 + x] = imlib.bil(img, x * (w - 1) / 511, y * (h - 1) / 511, w, h)
            img = out
        return [img]


if __name__ == "__main__":
    jobs = json.loads(open(sys.argv[1]).read()) if sys.argv[1].endswith(".json") else json.loads(sys.argv[1])
    res = []
    for job in jobs:
        frames = load(job)
        allp = []
        off = None
        for img in frames:
            p, off = walk(img, job["pts"], half=job.get("half", 18), notrack=job.get("notrack", False))
            allp.extend(p)
        if not allp:
            print(job["name"], "no profiles")
            continue
        mean = [sum(p["raw"][i] for p in allp) / len(allp) for i in range(len(off))]
        bgm = med([p["bg"] for p in allp])
        r = {
            "name": job["name"],
            "n": len(allp),
            "fwhm_px_median": round(med([p["fwhm"] for p in allp]), 2),
            "fwhm_px_iqr": (round(q([p["fwhm"] for p in allp], 0.25), 2), round(q([p["fwhm"] for p in allp], 0.75), 2)),
            "depth_grey_median": round(med([p["depth"] for p in allp]), 1),
            "depth_iqr": (round(q([p["depth"] for p in allp], 0.25), 1), round(q([p["depth"] for p in allp], 0.75), 1)),
            "bg_grey_median": round(bgm, 1),
            "w80_w20_median": round(med([p["w80_w20"] for p in allp]), 3),
            "edge10_90_px_median": round(med([p["edge10_90"] for p in allp]), 2),
            "halo_grey_median": round(med([p["halo"] for p in allp]), 1),
            "mean_profile_1px": [(round(o, 1), round(v, 1)) for o, v in zip(off, mean) if abs(o * 2 - round(o * 2)) < 1e-6 and abs(o) <= 12],
        }
        res.append(r)
        rr = dict(r)
        rr.pop("mean_profile_1px")
        print(json.dumps(rr), flush=True)
    tag = jobs[0]["name"]
    json.dump(res, open(f"{imlib.SCR}/vessel_{tag}.json", "w"), indent=1)
