"""
(6b) Cardiac motion, cross-section tracking: along a fixed scan line crossing a vessel, find
the vessel centre (darkest point of the 1-px-smoothed profile, within +-search px of its previous
position, parabolic sub-pixel) in every frame. This measures the motion component across the
vessel, which is unambiguous even where 2-D template matching drifts along the vessel.
"""
import json, math, sys
import imlib

def track_line(frames, x, y, dx, dy, half=40, search=14):
    """Candidates = local minima of the smoothed profile whose depth (vs. the mean 8-14 px either
    side) is at least 40% of the first frame's; choose the one nearest the predicted position
    (previous + half the previous velocity)."""
    L = math.hypot(dx, dy); dx /= L; dy /= L
    offs = [o * 0.5 for o in range(-2 * half, 2 * half + 1)]
    out = []
    pos = 0.0
    vel = 0.0
    d0 = None
    for img in frames:
        prof = [imlib.bil(img, x + dx * o, y + dy * o) for o in offs]
        sm = [sum(prof[max(0, i - 2): i + 3]) / len(prof[max(0, i - 2): i + 3]) for i in range(len(prof))]
        def depth(i):
            l = sm[max(0, i - 28): max(1, i - 16)]
            r = sm[i + 16: i + 28]
            if not l or not r:
                return -1
            return 0.5 * (sum(l) / len(l) + sum(r) / len(r)) - sm[i]
        mins = [i for i in range(3, len(sm) - 3) if sm[i] <= sm[i - 1] and sm[i] <= sm[i + 1] and sm[i] <= sm[i - 3] and sm[i] <= sm[i + 3]]
        pred = pos + 0.5 * vel
        if d0 is None:
            mins = [i for i in mins if abs(offs[i]) <= 4]
            i = min(mins, key=lambda k: sm[k])
            d0 = depth(i)
        else:
            good = [i for i in mins if depth(i) >= 0.4 * d0 and abs(offs[i] - pred) <= search]
            if not good:
                out.append((None, None))
                continue
            i = min(good, key=lambda k: abs(offs[k] - pred))
        a, b, c = sm[i - 1], sm[i], sm[i + 1]
        den = a - 2 * b + c
        sub = 0.5 * (a - c) / den if den else 0
        newpos = offs[i] + sub * 0.5
        vel = newpos - pos if out else 0.0
        pos = newpos
        out.append((round(pos, 2), round(depth(i), 1)))
    return out

if __name__ == "__main__":
    jobs = json.loads(open(sys.argv[1]).read())
    res = []
    for job in jobs:
        idx = list(range(job["f0"], job["f1"] + 1))
        if job.get("src") == "cap":
            import noise2
            allf, _ = noise2.load_run("cap", job["run"])
            fr = [allf[i] for i in idx]
        else:
            fr, _ = imlib.load_npz_run(job["run"], frames=idx)
        k0 = job["fk"] - job["f0"]
        for (name, x, y, dx, dy) in job["lines"]:
            t1 = track_line(fr[k0:], x, y, dx, dy, search=job.get("search", 14))
            t0 = track_line(fr[: k0 + 1][::-1], x, y, dx, dy, search=job.get("search", 14))
            t = t0[::-1][:-1] + t1
            p = [a for a, _ in t if a is not None]
            d = [abs(b - a) for a, b in zip(p, p[1:])]
            ds = sorted(d)
            r = {"name": f"{job['run']}:{name}", "frames": len(p), "range_px": round(max(p) - min(p), 1),
                 "step_median": round(ds[len(ds) // 2], 2), "step_p90": round(ds[int(0.9 * (len(ds) - 1))], 2), "step_max": round(ds[-1], 2),
                 "lost": sum(1 for a, _ in t if a is None), "min_depth": min(b for _, b in t if b is not None), "pos": p, "depth": [b for _, b in t]}
            res.append(r)
            print(json.dumps({k: v for k, v in r.items() if k not in ("depth",)}), flush=True)
    json.dump(res, open(f"{imlib.SCR}/xtrack_{jobs[0]['run']}.json", "w"), indent=1)
