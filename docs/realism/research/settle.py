"""Noise settling over the first cine frames: temporal-difference noise (static blocks, lowest
quartile of block variance, quadratic detrend) for consecutive pairs (k,k+1), k=0..7, averaged
over runs. Reported as sqrt(var/2) relative to the pair (8,9)."""
import json, math, sys, imlib, noise2
pairs = list(range(0, 10))
acc = {k: [] for k in pairs}
for rid in sys.argv[1:]:
    fr, meta = imlib.load_npz_run(rid, frames=list(range(0, 11)))
    ref = None
    vals = {}
    for k in pairs:
        a, b = fr[k], fr[k + 1]
        vs = []
        for (x0, y0) in noise2.GRID:
            va = noise2.blk(a, x0, y0); vb = noise2.blk(b, x0, y0)
            if max(vb) >= 254.5 or min(vb) <= 0.5: continue
            d = noise2.detrend([q - p for p, q in zip(va, vb)])
            vs.append(noise2.var(d))
        vs.sort()
        vals[k] = math.sqrt(vs[len(vs) // 4] / 2)
    for k in pairs:
        acc[k].append(vals[k] / vals[9])
    print(rid, " ".join(f"{vals[k]:.2f}" for k in pairs), flush=True)
print("median ratio to pair 9-10:", " ".join(f"{k}-{k+1}:{sorted(v)[len(v)//2]:.3f}" for k, v in acc.items()))
