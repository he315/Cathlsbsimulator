"""
(2) Edge enhancement and edge sharpness across large steps (diaphragm, heart border, filter /
seam edges) and across the catheter.

Method: locate the edge along a set of scan lines by the maximum of a 6-px central difference,
fit a straight line to the located points (locally straight segment), sample bilinear profiles
along the fitted normal at 0.25 px steps, align each on its own located edge, average over all
scan lines and over several frames. From the mean profile:
  plateau levels A (bright side) and Bk (dark side) = medians 25-40 px from the edge,
  overshoot = max(bright side within 25 px) - A, undershoot = Bk - min(dark side within 25 px),
  halo width = distance from the edge to the overshoot peak and to where it returns to within
  25% of its height, and the 10-90% edge rise distance.
"""

import json
import math
import sys

import imlib


def locate(img, lines, axis, lo, hi, sign):
    """For each scan line coordinate c, find the position p in [lo,hi] maximising sign*(I[p-3]-I[p+3])
    along `axis` ('y' scans vertically at x=c, 'x' scans horizontally at y=c). Parabolic sub-pixel."""
    pts = []
    for c in lines:
        best = (-1e9, None)
        vals = {}
        for p in range(lo, hi + 1):
            if axis == "y":
                d = imlib.bil(img, c, p - 3) - imlib.bil(img, c, p + 3)
            else:
                d = imlib.bil(img, p - 3, c) - imlib.bil(img, p + 3, c)
            d *= sign
            vals[p] = d
            if d > best[0]:
                best = (d, p)
        d, p = best
        if p is None or p in (lo, hi):
            continue
        a, b, cc = vals[p - 1], vals[p], vals[p + 1]
        den = a - 2 * b + cc
        off = 0.5 * (a - cc) / den if den else 0
        pts.append((c, p + off, d))
    return pts


def fit_line(pts, order=1):
    """Least-squares polynomial p(c) (order 1 or 2) through the located points, with one round of
    outlier rejection (> 2 px). Returns a function c -> p. Profiles are centred on the fitted
    curve, not on each noisy per-line maximum (which would bias the samples at +-3 px)."""
    def fit(P):
        n = len(P)
        if order == 1:
            mc = sum(p[0] for p in P) / n
            mp = sum(p[1] for p in P) / n
            s = sum((p[0] - mc) ** 2 for p in P)
            b = sum((p[0] - mc) * (p[1] - mp) for p in P) / s if s else 0
            return lambda c: mp + b * (c - mc), b
        A = [[0.0] * 3 for _ in range(3)]
        r = [0.0] * 3
        for c, p, _ in P:
            f = (1.0, c, c * c)
            for i in range(3):
                r[i] += f[i] * p
                for j in range(3):
                    A[i][j] += f[i] * f[j]
        co = imlib.solve(A, r)
        return (lambda c: co[0] + co[1] * c + co[2] * c * c), None
    f, _ = fit(pts)
    keep = [p for p in pts if abs(p[1] - f(p[0])) <= 2.0]
    if len(keep) >= 3:
        f, _ = fit(keep)
    return f


def edge_profile(frames, lines, axis, lo, hi, sign, half=45):
    acc = None
    cnt = 0
    for img in frames:
        pts = locate(img, lines, axis, lo, hi, sign)
        if len(pts) < 3:
            continue
        # discard weak edges (bottom 25% gradient)
        ds = sorted(p[2] for p in pts)
        thr = ds[len(ds) // 4]
        pts = [p for p in pts if p[2] >= thr]
        f = fit_line(pts, order=2)
        for (c, _p, _) in pts:
            p = f(c)
            slope = (f(c + 1) - f(c - 1)) / 2
            if axis == "y":
                # edge point (c, p); edge direction (1, slope); normal pointing to +y (dark side when sign=+1)
                nx, ny = -slope, 1.0
                cx, cy = c, p
            else:
                nx, ny = 1.0, -slope
                cx, cy = p, c
            ln = math.hypot(nx, ny)
            nx, ny = nx / ln, ny / ln
            pr = imlib.profile(img, cx, cy, nx * sign, ny * sign, half=half, step=0.25)
            if any(v != v for _, v in pr):
                continue
            if acc is None:
                acc = [[o, 0.0] for o, _ in pr]
            for i, (o, v) in enumerate(pr):
                acc[i][1] += v
            cnt += 1
    if not acc:
        return None
    prof = [(o, v / cnt) for o, v in acc]
    return prof, cnt


def describe(prof):
    """prof: offsets (negative = bright side, positive = dark side) and values."""
    br = [v for o, v in prof if -40 <= o <= -25]
    dk = [v for o, v in prof if 25 <= o <= 40]
    A = sorted(br)[len(br) // 2]
    Bk = sorted(dk)[len(dk) // 2]
    step = A - Bk
    nearb = [(o, v) for o, v in prof if -25 <= o <= -0.5]
    neard = [(o, v) for o, v in prof if 0.5 <= o <= 25]
    ob = max(nearb, key=lambda q: q[1])
    ud = min(neard, key=lambda q: q[1])
    over = ob[1] - A
    under = Bk - ud[1]

    def back(points, peak, base, height, direction):
        # distance from edge where the halo falls back to within 25% of its height
        for o, v in (points if direction < 0 else points):
            pass
        cand = [o for o, v in points if (abs(o) > abs(peak[0])) and abs(v - base) <= 0.25 * abs(height)]
        return min((abs(o) for o in cand), default=None)

    ob_back = back(nearb, ob, A, over, -1)
    ud_back = back(neard, ud, Bk, under, 1)
    # 10-90 rise between bright plateau and dark plateau (ignoring halos): find crossing positions
    lo_lvl = Bk + 0.1 * step
    hi_lvl = Bk + 0.9 * step
    x90 = x10 = None
    for (o1, v1), (o2, v2) in zip(prof, prof[1:]):
        if -15 <= o1 <= 15:
            if x90 is None and (v1 - hi_lvl) * (v2 - hi_lvl) <= 0 and v1 != v2:
                x90 = o1 + (hi_lvl - v1) / (v2 - v1) * (o2 - o1)
            if (v1 - lo_lvl) * (v2 - lo_lvl) <= 0 and v1 != v2:
                x10 = o1 + (lo_lvl - v1) / (v2 - v1) * (o2 - o1)
    return {
        "bright_plateau": round(A, 1),
        "dark_plateau": round(Bk, 1),
        "step": round(step, 1),
        "overshoot": round(over, 1),
        "overshoot_rel_step": round(over / step, 3) if step else None,
        "overshoot_peak_px_from_edge": round(-ob[0], 2),
        "overshoot_extent_px": ob_back,
        "undershoot": round(under, 1),
        "undershoot_rel_step": round(under / step, 3) if step else None,
        "undershoot_peak_px_from_edge": round(ud[0], 2),
        "undershoot_extent_px": ud_back,
        "rise_10_90_px": round(abs(x10 - x90), 2) if (x10 is not None and x90 is not None) else None,
    }


JOBS = {
    # name: (loader, run, frames, lines, axis, lo, hi, sign)
}

if __name__ == "__main__":
    spec = json.loads(sys.argv[1])
    res = []
    for job in spec:
        if job["src"] == "npz":
            frames, _ = imlib.load_npz_run(job["run"], frames=job["frames"])
        elif job["src"] == "cadica":
            frames = [imlib.load_png(imlib.cadica_png(job["run"], k + 1)) for k in job["frames"]]
        elif job["src"] == "png":
            w, h, px = imlib.read_png_gray(job["run"])
            if w != 512:
                # renderer capture: resample to 512 by bilinear for comparability
                img = imlib.to_f(px)
                out = []
                for y in range(512):
                    for x in range(512):
                        out.append(imlib.bil(img, x * (w - 1) / 511, y * (h - 1) / 511, w, h))
                frames = [out]
            else:
                frames = [imlib.to_f(px)]
        else:
            frames = [imlib.load_jpg(f"{imlib.LIB}/{job['run']}/f{k + 1:03d}.jpg") for k in job["frames"]]
        lines = list(range(job["l0"], job["l1"] + 1, job.get("ls", 4)))
        r = edge_profile(frames, lines, job["axis"], job["lo"], job["hi"], job["sign"], half=job.get("half", 45))
        if r is None:
            print(job["name"], "no edge")
            continue
        prof, cnt = r
        d = describe(prof)
        d["name"] = job["name"]
        d["n_profiles"] = cnt
        d["profile_every_1px"] = [(o, round(v, 1)) for o, v in prof if abs(o - round(o)) < 1e-6]
        res.append(d)
        dd = dict(d)
        dd.pop("profile_every_1px")
        print(json.dumps(dd))
    json.dump(res, open(f"{imlib.SCR}/edge_{spec[0]['name']}.json", "w"), indent=1)
