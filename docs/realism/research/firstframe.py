"""First-frame (exposure settling) signature: mean grey and noise of frame 0 vs frames 1-3."""
import json, math, sys, imlib, noise2
def frame_noise(a, b):
    # temporal-difference SD/sqrt2 in static blocks between consecutive frames a, b
    vs = []
    for (x0, y0) in noise2.GRID:
        va = noise2.blk(a, x0, y0); vb = noise2.blk(b, x0, y0)
        d = noise2.detrend([q - p for p, q in zip(va, vb)])
        vs.append(noise2.var(d))
    vs.sort()
    return math.sqrt(vs[len(vs) // 4] / 2)
def mean(a):
    return sum(a) / len(a)
out = []
for rid in sys.argv[1:]:
    fr, meta = imlib.load_npz_run(rid, frames=[0, 1, 2, 3])
    m = [mean(f) for f in fr]
    # mean abs difference images
    d01 = mean([abs(x - y) for x, y in zip(fr[0], fr[1])])
    d12 = mean([abs(x - y) for x, y in zip(fr[1], fr[2])])
    d23 = mean([abs(x - y) for x, y in zip(fr[2], fr[3])])
    r = {"run": rid, "mean_f0": round(m[0], 1), "mean_f1": round(m[1], 1), "mean_f2": round(m[2], 1), "mean_f3": round(m[3], 1),
         "mad_01": round(d01, 2), "mad_12": round(d12, 2), "mad_23": round(d23, 2)}
    out.append(r); print(json.dumps(r), flush=True)
json.dump(out, open(imlib.SCR + "/firstframe.json", "w"), indent=1)
