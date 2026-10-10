# Opacified-area and vessel-darkening at peak opacification in real runs (same method used on simulator frames in the browser)
import json, os, random, statistics as st
from PIL import Image, ImageChops, ImageStat
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
random.seed(11)
def small(p): return Image.open(p).convert('L').resize((128,128),Image.BOX)
def central(im): m=int(128*0.12); return im.crop((m,m,128-m,128-m))
def runs(d):
    j=json.load(open(LIB+d+'/index.json'))
    return [(r['id'],r['artery'],r.get('angles'),[os.path.join(LIB,d,r['id'],f) for f in r['frames']]) for p in j['patients'] for r in p['runs'] if len(r['frames'])>=30]
for d in ['dominance','dominance-main','cadica']:
    rr=runs(d); random.shuffle(rr)
    A10=[];A20=[];DK=[];P1d=[];P5d=[];PK=[]
    for rid,art,ang,fr in rr[:60]:
        ims=[central(small(f)) for f in fr]
        B=ims[0]
        for im in ims[1:3]: B=ImageChops.lighter(B,im)
        D=[ImageStat.Stat(ImageChops.subtract(B,im)).mean[0] for im in ims]
        k=max(range(len(D)),key=lambda i:D[i])
        diff=list(ImageChops.subtract(B,ims[k]).getdata())
        n=len(diff)
        a10=sum(v>10 for v in diff)/n; a20=sum(v>20 for v in diff)/n
        dk=st.median([v for v in diff if v>10]) if a10>0 else 0
        s0=sorted(ims[1].getdata()); sk=sorted(ims[k].getdata())
        q=lambda s,p:s[int(p*(len(s)-1))]
        A10.append(a10);A20.append(a20);DK.append(dk);P1d.append(q(s0,0.01)-q(sk,0.01));P5d.append(q(s0,0.05)-q(sk,0.05));PK.append(D[k])
    f=lambda v:(round(st.median(v),3),[round(x,3) for x in st.quantiles(v,n=4)])
    print(d,'n',len(A10),'peakD',f(PK),'area>10',f(A10),'area>20',f(A20),'median darkening in area>10',f(DK),'p1 drop',f(P1d),'p5 drop',f(P5d))
