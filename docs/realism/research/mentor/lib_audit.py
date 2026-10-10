import json, statistics as st, collections as C, os
L="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library"
def load(d): return json.load(open(os.path.join(L,d,"index.json")))
ds={d:load(d) for d in ["cadica","dominance","dominance-main","angiocad"]}
def q(xs):
    xs=sorted(xs); n=len(xs)
    if n==0: return None
    def p(f):
        k=(n-1)*f; i=int(k); j=min(n-1,i+1); return xs[i]+(xs[j]-xs[i])*(k-i)
    return dict(n=n,min=xs[0],p25=round(p(.25),2),median=round(p(.5),2),p75=round(p(.75),2),max=xs[-1])
def stdview(a):
    if not a: return None
    p=a["primary"]; s=a["secondary"]
    ap=abs(p)<15
    if ap and s>=15: return "AP cranial"
    if ap and s<=-15: return "AP caudal"
    if ap: return "AP"
    if p<0 and s>=15: return "RAO cranial"
    if p<0 and s<=-15: return "RAO caudal"
    if p<0: return "RAO"
    if p>=70: return "Left lateral"
    if s>=15: return "LAO cranial"
    if s<=-15: return "LAO caudal (spider)"
    return "LAO"
print("=== Runs per study and per artery")
for name in ["cadica","dominance","dominance-main","angiocad"]:
    d=ds[name]; per=[];perL=[];perR=[]
    for p in d["patients"]:
        rs=p["runs"]; per.append(len(rs))
        perL.append(sum(1 for r in rs if r.get("artery")=="LCA")); perR.append(sum(1 for r in rs if r.get("artery")=="RCA"))
    print(name,"patients",len(d["patients"]),"runs/study",q(per),"LCA runs/study",q(perL),"RCA runs/study",q(perR))
print("=== Run length (frames / fps = seconds)")
for name in ["cadica","dominance","dominance-main","angiocad"]:
    secs=[];frames=[]
    for p in ds[name]["patients"]:
        for r in p["runs"]:
            f=r["frames"] if isinstance(r["frames"],int) else len(r["frames"])
            frames.append(f); secs.append(f/r["fps"])
    cap=sum(1 for f in frames if f>=120) if name.startswith("dominance") else (sum(1 for f in frames if f>=90) if name=="angiocad" else 0)
    print(name,"frames",q(frames),"seconds",q([round(s,2) for s in secs]),"runs at truncation cap",cap,"of",len(frames))
print("=== CoronaryDominance angles")
both=ds["dominance"]["patients"]+ds["dominance-main"]["patients"]
vc={"LCA":C.Counter(),"RCA":C.Counter()}; near=0; tot=0
cov={"LCA":C.Counter(),"RCA":C.Counter()}; nst={"LCA":0,"RCA":0}
prim={"LCA":[],"RCA":[]}; sec={"LCA":[],"RCA":[]}
for p in both:
    seen={"LCA":set(),"RCA":set()}
    for r in p["runs"]:
        a=r.get("angles"); art=r.get("artery")
        if not a or art not in vc: continue
        v=stdview(a); vc[art][v]+=1; seen[art].add(v); tot+=1
        prim[art].append(a["primary"]); sec[art].append(a["secondary"])
        pp,ss=a["primary"],a["secondary"]
        if abs(abs(pp)-15)<5 or abs(abs(ss)-15)<5 or abs(pp-70)<5: near+=1
    for art in seen:
        if seen[art]:
            nst[art]+=1
            for v in seen[art]: cov[art][v]+=1
for art in vc:
    print(art,"runs",sum(vc[art].values()),dict(vc[art].most_common()))
    print(art,"studies with >=1 run of this artery",nst[art],"coverage % per view",{k:round(100*v/nst[art]) for k,v in cov[art].most_common()})
    print(art,"primary angle",q([round(x,1) for x in prim[art]]),"secondary",q([round(x,1) for x in sec[art]]))
print("runs with angles within 5 deg of a standardView() boundary:",near,"of",tot, round(100*near/tot,1),"%")
print("=== Dominance balance (drill pool = patients with dominance label and runs)")
pool=[p for n in ["dominance","dominance-main","angiocad"] for p in ds[n]["patients"] if p.get("dominance") and p["runs"]]
cnt=C.Counter(p["dominance"] for p in pool); print("pool",len(pool),dict(cnt),"always-right baseline %",round(100*cnt["right"]/len(pool),1))
for n in ["dominance","dominance-main","angiocad"]:
    c=C.Counter(p.get("dominance") for p in ds[n]["patients"]); print(n,dict(c))
print("=== Artery drill balance")
allruns=[r for n in ds for p in ds[n]["patients"] for r in p["runs"]]
c=C.Counter(r.get("artery") for r in allruns); print(dict(c), "always-LCA baseline %", round(100*c["LCA"]/(c["LCA"]+c["RCA"]),1))
print("=== CADICA grade drill pool (runs with worst and boxes)")
G=["p0_20","p20_50","p50_70","p70_90","p90_98","p99","p100"]
gr=[r["worst"] for p in ds["cadica"]["patients"] for r in p["runs"] if r.get("worst") and r.get("boxes") and len(r["boxes"])]
gc=C.Counter(gr); print(len(gr),{g:gc[g] for g in G})
best=None
for k,g in enumerate(G):
    sc=sum(gc[h]*(1 if h==g else 0.5 if abs(G.index(h)-k)==1 else 0) for h in G)/len(gr)
    if best is None or sc>best[1]: best=(g,sc)
print("best constant-answer expected score",best[0],round(100*best[1],1),"%")
print("=== CADICA patient-level labels")
P=ds["cadica"]["patients"]
print("vesselsAffected",dict(C.Counter(p.get("vesselsAffected") for p in P)),"maxDegree",dict(C.Counter(p.get("maxDegree") for p in P)))
print("indication",dict(C.Counter(p.get("indication") for p in P)))
print("=== AngioCAD segments")
seg=C.Counter(); segN=0; per=C.defaultdict(C.Counter)
for p in ds["angiocad"]["patients"]:
    for k,v in (p.get("segments") or {}).items(): seg[v]+=1; segN+=1; per[k][v]+=1
print(segN,dict(seg.most_common()),"always-normal baseline %",round(100*seg["NL"]/segN,1))
print("indication",dict(C.Counter(p.get("indication") for p in ds["angiocad"]["patients"]).most_common(10)))
print("gensini",q([p["gensini"] for p in ds["angiocad"]["patients"] if p.get("gensini") is not None]))
print("dominance-main category",dict(C.Counter(p.get("category") for p in ds["dominance-main"]["patients"])))
