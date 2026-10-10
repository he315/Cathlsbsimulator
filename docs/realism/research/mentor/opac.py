# Opacification time course of real cine runs: count of pixels darker than the
# least-opacified frame's 5th-percentile grey level, per frame (128 px frames, central 70% crop).
import json, os, sys, random, subprocess, glob, statistics as st
sys.path.insert(0, "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/scripts/angio_library")
from common import read_png_gray
L="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library"
TMP="/private/tmp/claude-502/cathmaster-research/mentor/png"
os.makedirs(TMP, exist_ok=True)
random.seed(7)
def runs_of(d):
    j=json.load(open(os.path.join(L,d,"index.json")))
    out=[]
    for p in j["patients"]:
        for r in p["runs"]:
            n=r["frames"] if isinstance(r["frames"],int) else len(r["frames"])
            out.append((d, r.get("dir") or r["id"], r["fps"], r.get("artery"), n))
    return out
N=int(sys.argv[1]) if len(sys.argv)>1 else 20
sample=[]
for d in ["cadica","dominance","dominance-main"]:
    rs=[r for r in runs_of(d) if r[4]>=20 and r[3] in ("LCA","RCA")]
    sample+=random.sample(rs, N)

def hp_count(px,w,h,T=10,R=6):
    # integral image box blur, count pixels darker than local mean by > T (central 70% crop)
    I=[[0]*(w+1) for _ in range(h+1)]
    for y in range(h):
        row=0; Iy=I[y+1]; Ip=I[y]
        for x in range(w):
            row+=px[y*w+x]; Iy[x+1]=Ip[x+1]+row
    c=0
    x0,x1,y0,y1=int(w*.15),int(w*.85),int(h*.15),int(h*.85)
    for y in range(y0,y1):
        ya=max(0,y-R); yb=min(h,y+R+1)
        for x in range(x0,x1):
            xa=max(0,x-R); xb=min(w,x+R+1)
            m=(I[yb][xb]-I[ya][xb]-I[yb][xa]+I[ya][xa])/((yb-ya)*(xb-xa))
            if px[y*w+x]<m-T: c+=1
    return c
res=[]
for d,rid,fps,art,n in sample:
    src=os.path.join(L,d,rid)
    files=sorted(glob.glob(os.path.join(src,"*.jpg")))
    od=os.path.join(TMP,d,rid); os.makedirs(od,exist_ok=True)
    subprocess.run(["sips","-Z","128","-s","format","png",*files,"--out",od],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    pngs=sorted(glob.glob(os.path.join(od,"*.png")))
    cnt=[]
    for f in pngs:
        w,h,px=read_png_gray(f)
        cnt.append(hp_count(px,w,h))
    if len(cnt)<10: continue
    k=max(1,round(0.2*fps)); cnt=[sum(cnt[max(0,i-k):i+k+1])/len(cnt[max(0,i-k):i+k+1]) for i in range(len(cnt))]
    lo=min(cnt); pk=max(cnt); 
    if pk-lo<=0: continue
    nrm=[(c-lo)/(pk-lo) for c in cnt]
    ipk=nrm.index(1.0)
    onset=next(i for i,v in enumerate(nrm) if v>=0.2)
    above=[i for i,v in enumerate(nrm) if v>=0.5]
    fwhm=(above[-1]-above[0]+1)/fps
    end_rel=nrm[-1]
    res.append(dict(rid=rid,curve=[round(v,2) for v in nrm],d=d,art=art,fps=fps,n=len(cnt),dur=len(cnt)/fps,onset_s=onset/fps,ttp_s=(ipk-onset)/fps,fwhm_s=fwhm,end_rel=end_rel,start_rel=nrm[0],post_peak_s=(len(cnt)-1-ipk)/fps))
json.dump(res,open("/private/tmp/claude-502/cathmaster-research/mentor/opac.json","w"),indent=1)
def q(xs):
    xs=sorted(xs); n=len(xs)
    return dict(n=n,p25=round(xs[n//4],2),median=round(xs[n//2],2),p75=round(xs[(3*n)//4],2))
for grp in ["cadica","dominance","dominance-main","all"]:
    R=[r for r in res if grp=="all" or r["d"]==grp]
    if not R: continue
    print(grp, "runs",len(R))
    for k in ["dur","onset_s","ttp_s","fwhm_s","post_peak_s","end_rel","start_rel"]:
        print("  ",k,q([r[k] for r in R]))
    print("   runs ending with opacification >=50% of peak:",sum(1 for r in R if r["end_rel"]>=0.5),"of",len(R))
    print("   runs starting with opacification >=50% of peak:",sum(1 for r in R if r["start_rel"]>=0.5),"of",len(R))
