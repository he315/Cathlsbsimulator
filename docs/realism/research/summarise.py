import json, sys, statistics as st
from collections import Counter, defaultdict

rows = [json.loads(l) for l in open(sys.argv[1])]
print("runs", len(rows))
studies = defaultdict(list)
for r in rows:
    studies[r["study"]].append(r)
print("studies", len(studies))


def q(xs, ps=(0.1, 0.25, 0.5, 0.75, 0.9)):
    xs = sorted(xs)
    if not xs:
        return []
    return [round(xs[min(len(xs) - 1, int(p * (len(xs) - 1) + 0.5))], 2) for p in ps]


nl = [sum(1 for r in v if r["artery"] == "LCA") for v in studies.values()]
nr = [sum(1 for r in v if r["artery"] == "RCA") for v in studies.values()]
print("LCA runs per study q10..q90", q(nl), "mean", round(st.mean(nl), 2))
print("RCA runs per study q10..q90", q(nr), "mean", round(st.mean(nr), 2))
print("total runs per study", q([a + b for a, b in zip(nl, nr)]))

# duration
for art in ("LCA", "RCA"):
    ns = [r["n"] for r in rows if r["artery"] == art]
    trunc = sum(1 for n in ns if n >= 120)
    nt = [n / 15 for n in ns if n < 120]
    print(art, "runs", len(ns), "truncated at 120", trunc, "duration s (untruncated) q10..q90", q(nt), "mean", round(st.mean(nt), 2))


def view(a):
    p, s = a["primary"], a["secondary"]
    side = "LAO" if p > 15 else "RAO" if p < -15 else "AP"
    tilt = "CRA" if s > 15 else "CAU" if s < -15 else "0"
    return side + "-" + tilt


for art in ("LCA", "RCA"):
    c = Counter(view(r["angles"]) for r in rows if r["artery"] == art and r.get("angles"))
    tot = sum(c.values())
    print(art, "projection classes (|angle|>15 deg)", [(k, v, round(100 * v / tot)) for k, v in c.most_common()])

# distinct projection classes per study
dl = [len(set(view(r["angles"]) for r in v if r["artery"] == "LCA" and r.get("angles"))) for v in studies.values()]
dr = [len(set(view(r["angles"]) for r in v if r["artery"] == "RCA" and r.get("angles"))) for v in studies.values()]
print("distinct LCA projection classes per study", q(dl), "RCA", q(dr))

# repeated near-identical projections within a study (repeat runs): angle distance < 5 deg on both axes
rep = 0
pairs = 0
for v in studies.values():
    for art in ("LCA", "RCA"):
        rs = [r for r in v if r["artery"] == art and r.get("angles")]
        for i in range(len(rs)):
            for j in range(i + 1, len(rs)):
                a, b = rs[i]["angles"], rs[j]["angles"]
                pairs += 1
                if abs(a["primary"] - b["primary"]) < 5 and abs(a["secondary"] - b["secondary"]) < 5:
                    rep += 1
print("same-artery run pairs", pairs, "near-identical projection pairs (<5 deg)", rep)
studies_with_repeat = 0
for v in studies.values():
    found = False
    for art in ("LCA", "RCA"):
        rs = [r for r in v if r["artery"] == art and r.get("angles")]
        for i in range(len(rs)):
            for j in range(i + 1, len(rs)):
                a, b = rs[i]["angles"], rs[j]["angles"]
                if abs(a["primary"] - b["primary"]) < 5 and abs(a["secondary"] - b["secondary"]) < 5:
                    found = True
    studies_with_repeat += found
print("studies with at least one repeated projection", studies_with_repeat, "of", len(studies))


# ---- contrast timing from vessel signal ----
def timing(v):
    v0 = st.median(v[:2])
    vmax = max(v)
    rise = vmax - v0
    if rise < 0.006:  # weak rise: no clear opacification change in the run
        return None
    thr = v0 + 0.3 * rise
    arr = next(i for i, x in enumerate(v) if x >= thr)
    pk = max(range(len(v)), key=lambda i: v[i])
    half = v0 + 0.5 * rise
    above = [i for i, x in enumerate(v) if x >= half]
    end = v[-3:]
    still = st.mean(end) >= half
    return arr, pk, len(above), still, rise


for art in ("LCA", "RCA"):
    arrs, pks, durs, stills, nrise, total = [], [], [], 0, 0, 0
    pre0 = 0
    for r in rows:
        if r["artery"] != art:
            continue
        total += 1
        t = timing(r["v"])
        if not t:
            continue
        nrise += 1
        a, p, d, s, rise = t
        arrs.append(a / 15)
        pks.append(p / 15)
        durs.append(d / 15)
        stills += s
        if a == 0:
            pre0 += 1
    print(art, "runs", total, "with clear opacification rise", nrise)
    print("  arrival (30% of rise) s q10..q90", q(arrs), " arrival at frame 0:", pre0)
    print("  peak s", q(pks), " time above 50% of rise s", q(durs), " still >=50% in last 3 frames:", stills)

# ---- global motion ----
for art in ("LCA", "RCA"):
    mx = []
    big = 0
    tot = 0
    for r in rows:
        if r["artery"] != art:
            continue
        tot += 1
        m = max((x * x + y * y) ** 0.5 for _, x, y in r["traj"])
        mx.append(m)
        if m >= 8:
            big += 1
    print(art, "max global displacement (px at 128 px) q10..q90", q(mx), " runs >=8 px (6% of image):", big, "of", tot)
