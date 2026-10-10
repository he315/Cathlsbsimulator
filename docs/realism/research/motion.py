"""
(6) Cardiac motion of identifiable vessel points.

Method: normalised cross-correlation template tracking (15x15 template from the previous
frame, +-search px, parabolic sub-pixel peak) of hand-picked vessel landmarks (bifurcations,
bends) through the opacified frames of a run. Reported per landmark: per-frame displacement
(median, 90th centile, max, px/frame), the extent of the trajectory (x and y ranges, px), the
cycle length (frames) from the autocorrelation of the speed signal, and the mean NCC score
(tracking quality). With the catheter-derived scale (about 0.25 mm/px, 6F assumed) and 15
frames/s these convert to mm/s.
"""

import json
import math
import sys

import imlib


def stats(tr, fps=15):
    d = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(tr, tr[1:])]
    xs = [p[0] for p in tr]
    ys = [p[1] for p in tr]
    ds = sorted(d)
    sc = [p[2] for p in tr[1:]]
    # cycle length from autocorrelation of the y position (detrended)
    def acorr_peak(sig):
        n = len(sig)
        m = sum(sig) / n
        s = [v - m for v in sig]
        v0 = sum(v * v for v in s) or 1
        best = (None, -1)
        ac = []
        for L in range(1, n // 2 + 1):
            c = sum(s[i] * s[i + L] for i in range(n - L)) / v0 * n / (n - L)
            ac.append(c)
        # first local maximum after the first negative lobe
        seen_neg = False
        for L, c in enumerate(ac, start=1):
            if c < 0:
                seen_neg = True
            if seen_neg and 1 < L < len(ac) and c > ac[L - 2] and c >= ac[L] and c > 0.2:
                return L, round(c, 2)
        return None, None

    cy, cc = acorr_peak([math.hypot(x - xs[0], y - ys[0]) for x, y in zip(xs, ys)])
    return {
        "frames": len(tr),
        "disp_px_per_frame_median": round(ds[len(ds) // 2], 2),
        "disp_p90": round(ds[int(0.9 * (len(ds) - 1))], 2),
        "disp_max": round(ds[-1], 2),
        "x_range_px": round(max(xs) - min(xs), 1),
        "y_range_px": round(max(ys) - min(ys), 1),
        "path_extent_px": round(max(math.hypot(a[0] - b[0], a[1] - b[1]) for a in tr for b in tr), 1),
        "cycle_frames": cy,
        "cycle_ac": cc,
        "ncc_mean": round(sum(sc) / len(sc), 3),
        "ncc_min": round(min(sc), 3),
        "track": [(round(p[0], 1), round(p[1], 1)) for p in tr],
        "disp": [round(v, 2) for v in d],
    }


if __name__ == "__main__":
    jobs = json.loads(open(sys.argv[1]).read())
    res = []
    for job in jobs:
        # landmarks are picked on frame `fk`; track forward to f1 and backward to f0, then join
        idx = list(range(job["f0"], job["f1"] + 1))
        if job["src"] == "npz":
            allf, _ = imlib.load_npz_run(job["run"], frames=idx)
        else:
            allf = [imlib.load_png(imlib.cadica_png(job["run"], k + 1)) for k in idx]
        k0 = job["fk"] - job["f0"]
        fwd = allf[k0:]
        bwd = allf[: k0 + 1][::-1]
        for (name, x, y) in job["pts"]:
            t1 = imlib.ncc_track(fwd, x, y, r=job.get("r", 7), search=job.get("search", 16))
            t0 = imlib.ncc_track(bwd, x, y, r=job.get("r", 7), search=job.get("search", 16))
            tr = t0[::-1][:-1] + t1
            st = stats(tr)
            st["name"] = f"{job['run']}:{name}"
            res.append(st)
            s2 = {k: v for k, v in st.items() if k not in ("track", "disp")}
            print(json.dumps(s2), flush=True)
    json.dump(res, open(f"{imlib.SCR}/motion_{jobs[0]['run']}.json", "w"), indent=1)
