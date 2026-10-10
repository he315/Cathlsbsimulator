"""
(2b) Edge profiles across curved anatomical borders (heart border, diaphragm dome, spine edge)
given an approximate polyline. Every 2 px along the polyline the profile along the local normal
is searched within +-14 px for the maximum 6-px difference; the located offsets are smoothed
along the border (running median of 7, then running mean of 9) so that profile centring does not
use each noisy maximum (which would bias samples at +-3 px); profiles (+-40 px, 0.25 px steps)
are then sampled centred on the smoothed border and averaged over all positions and frames.
The bright side is put at negative offsets. Reported from the mean profile: plateaus at 25-40 px,
step, overshoot (bright side) / undershoot (dark side) within 1-20 px of the edge and their peak
positions, 10-90% rise distance.
"""

import json
import math
import sys

import imlib
from edge import describe


def run(frames, poly, half=40):
    acc = None
    cnt = 0
    for img in frames:
        samples = []
        for (x0, y0), (x1, y1) in zip(poly, poly[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            tx, ty = (x1 - x0) / L, (y1 - y0) / L
            nx, ny = -ty, tx
            s = 0.0
            while s < L:
                cx, cy = x0 + tx * s, y0 + ty * s
                best = None
                for k in range(-56, 57):
                    o = k * 0.25
                    d = imlib.bil(img, cx + nx * (o - 3), cy + ny * (o - 3)) - imlib.bil(img, cx + nx * (o + 3), cy + ny * (o + 3))
                    if d != d:
                        continue
                    if best is None or abs(d) > abs(best[1]):
                        best = (o, d)
                if best:
                    samples.append([cx, cy, nx, ny, best[0], best[1]])
                s += 2.0
        if len(samples) < 9:
            continue
        offs = [p[4] for p in samples]
        med = []
        for i in range(len(offs)):
            w = sorted(offs[max(0, i - 3) : i + 4])
            med.append(w[len(w) // 2])
        sm = []
        for i in range(len(med)):
            w = med[max(0, i - 4) : i + 5]
            sm.append(sum(w) / len(w))
        sign = 1 if sum(p[5] for p in samples) > 0 else -1
        for p, o in zip(samples, sm):
            cx, cy, nx, ny = p[0] + p[2] * o, p[1] + p[3] * o, p[2] * sign, p[3] * sign
            pr = imlib.profile(img, cx, cy, nx, ny, half=half, step=0.25)
            if any(v != v for _, v in pr):
                continue
            if acc is None:
                acc = [[q, 0.0] for q, _ in pr]
            for i, (q, v) in enumerate(pr):
                acc[i][1] += v
            cnt += 1
    prof = [(q, v / cnt) for q, v in acc]
    return prof, cnt


if __name__ == "__main__":
    jobs = json.loads(open(sys.argv[1]).read())
    res = []
    for job in jobs:
        if job["src"] == "npz":
            frames, _ = imlib.load_npz_run(job["run"], frames=job["frames"])
        elif job["src"] == "png":
            frames = []
            for f in job["files"]:
                w, h, px = imlib.read_png_gray(f)
                img = imlib.to_f(px)
                frames.append(imlib.resample512(img, w, h) if w != 512 else img)
        elif job["src"] == "cadica":
            frames = [imlib.load_png(imlib.cadica_png(job["run"], k + 1)) for k in job["frames"]]
        prof, cnt = run(frames, job["poly"])
        d = describe(prof)
        d["name"] = job["name"]
        d["n_profiles"] = cnt
        d["profile"] = [(q, round(v, 1)) for q, v in prof if abs(q - round(q)) < 1e-6 and abs(q) <= 30]
        res.append(d)
        dd = dict(d)
        dd.pop("profile")
        print(json.dumps(dd))
        print("   ", " ".join(f"{q:.0f}:{v:.0f}" for q, v in d["profile"] if abs(q) <= 24))
    json.dump(res, open(f"{imlib.SCR}/edge2_{jobs[0]['name']}.json", "w"), indent=1)
