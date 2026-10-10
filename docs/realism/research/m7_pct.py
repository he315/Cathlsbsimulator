import json, os, statistics as st
from PIL import Image, ImageChops, ImageStat
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
def fam(p,s):
    lr = 'LAO' if p>=15 else ('RAO' if p<=-15 else 'AP')
    cc = 'CRA' if s>=15 else ('CAU' if s<=-15 else '0')
    return lr+'-'+cc
groups={}
for d in ['dominance','dominance-main']:
    j=json.load(open(LIB+d+'/index.json'))
    for p in j['patients']:
        for r in p['runs']:
            a=r.get('angles')
            if not a or len(r['frames'])<20: continue
            k=(r['artery'],fam(a['primary'],a['secondary']))
            groups.setdefault(k,[]).append([os.path.join(LIB,d,r['id'],f) for f in r['frames']])
want=[('LCA','RAO-CRA'),('LCA','RAO-CAU'),('LCA','LAO-CRA'),('LCA','LAO-CAU'),('LCA','AP-CRA'),('RCA','LAO-0')]
for k in want:
    rs=groups.get(k,[])[:25]
    P={q:[] for q in (5,50,95)}
    for fr in rs:
        im=Image.open(fr[len(fr)//2]).convert('L'); w=im.size[0]; m=int(w*0.12)
        s=sorted(im.crop((m,m,w-m,w-m)).getdata())
        for q in P: P[q].append(s[int(q/100*(len(s)-1))])
    print(k,'n',len(rs),{q:(st.median(v),[round(x) for x in st.quantiles(v,n=4)]) for q,v in P.items()})
