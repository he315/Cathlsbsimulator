"""Per grey-level bin: sigma_t (static blocks) and the d2/d1 variance ratio (3 - rho for noise; well
below 2.9 when smooth motion of structure dominates), plus the NPS fraction below 0.1 cyc/px."""
import json, math, sys, imlib, noise2
def run(frames, ks):
    recs = []
    for k in ks:
        a, b, c = frames[k - 1], frames[k], frames[k + 1]
        for (x0, y0) in noise2.GRID:
            vb = noise2.blk(b, x0, y0)
            if max(vb) >= 254.5 or min(vb) <= 0.5: continue
            va = noise2.blk(a, x0, y0); vc = noise2.blk(c, x0, y0)
            d1 = noise2.detrend([q - p for p, q in zip(vb, vc)])
            d2 = noise2.detrend([p - 2 * q + r for p, q, r in zip(va, vb, vc)])
            recs.append((sum(vb) / noise2.N, noise2.var(d1), noise2.var(d2), d1))
    bins = {}
    for r in recs: bins.setdefault(int(r[0] // 32) * 32, []).append(r)
    out = {}
    for g, v in sorted(bins.items()):
        if len(v) < 10: continue
        v.sort(key=lambda r: r[1]); s = v[: max(3, int(0.3 * len(v)))]
        sig = sorted(math.sqrt(r[1] / 2) for r in s)[len(s) // 2]
        rat = sorted(r[2] / r[1] for r in s)[len(s) // 2]
        lo = []
        for r in s[:: max(1, len(s) // 15)]:
            ps = noise2.nps(r[3]); tot = sum(p for _, p in ps)
            lo.append(sum(p for f, p in ps if f <= 0.1) / tot)
        out[f"{g}-{g+31}"] = {"n": len(s), "sigma_t": round(sig, 2), "d2/d1": round(rat, 2), "nps<0.1": round(sorted(lo)[len(lo)//2], 2)}
    return out
if __name__ == "__main__":
    kind = sys.argv[1]
    for rid in sys.argv[2:]:
        fr, label = noise2.load_run(kind, rid)
        ks = [k for k in (3, 6, 9, 12, 20, 28, 36) if k + 1 < len(fr)]
        print(label, json.dumps(run(fr, ks)), flush=True)
