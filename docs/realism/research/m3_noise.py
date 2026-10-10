import json, os, random, statistics as st
from PIL import Image, ImageFilter
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
random.seed(5)
def runs_of(d):
    j=json.load(open(LIB+d+'/index.json'))
    return [(r['id'],[os.path.join(LIB,d,r['id'],f) for f in r['frames']]) for p in j['patients'] for r in p['runs'] if len(r['frames'])>=3]
def noise(path):
    im=Image.open(path).convert('L'); w,h=im.size; m=int(w*0.2)
    im=im.crop((m,m,w-m,h-m)); bl=im.filter(ImageFilter.GaussianBlur(1.2))
    a=list(im.getdata()); b=list(bl.getdata()); W=im.size[0]
    r=[x-y for x,y in zip(a,b)]
    mean_grey=sum(a)/len(a)
    s=(sum(v*v for v in r)/len(r))**0.5
    for _ in range(3):
        keep=[v for v in r if abs(v)<3*s]
        s=(sum(v*v for v in keep)/len(keep))**0.5 if keep else 0
    if s==0: return None
    cl=[v if abs(v)<3*s else 0.0 for v in r]
    v0=sum(v*v for v in cl)/len(cl)
    def lag(L):
        t=0;n=0
        for y in range(0,im.size[1],2):
            row=cl[y*W:(y+1)*W]
            for x in range(W-L): t+=row[x]*row[x+L]; n+=1
        return t/n/v0
    return s,lag(1),lag(2),mean_grey,im.size
for d in ['dominance','dominance-main','cadica','angiocad']:
    rr=runs_of(d); random.shuffle(rr)
    S=[];L1=[];L2=[];G=[];sz=None
    for rid,fr in rr[:30]:
        o=noise(fr[1])
        if not o: continue
        S.append(o[0]);L1.append(o[1]);L2.append(o[2]);G.append(o[3]);sz=o[4]
    print(d,'crop',sz,'n',len(S),'resid sigma median',round(st.median(S),2),'IQR',[round(x,2) for x in st.quantiles(S,n=4)],'lag1',round(st.median(L1),3),'lag2',round(st.median(L2),3),'mean grey',round(st.median(G),1))
