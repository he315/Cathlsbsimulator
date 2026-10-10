import json, os, random, statistics as st
from PIL import Image, ImageChops, ImageStat
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
random.seed(11)
def small(p): return Image.open(p).convert('L').resize((128,128),Image.BOX)
def central(im): m=int(128*0.12); return im.crop((m,m,128-m,128-m))
j=json.load(open(LIB+'dominance/index.json'))
rr=[(r['id'],[os.path.join(LIB,'dominance',r['id'],f) for f in r['frames']]) for p in j['patients'] for r in p['runs'] if len(r['frames'])>=30]
random.shuffle(rr)
b3=[];pk=[];last=[]
for rid,fr in rr[:60]:
    ims=[central(small(f)) for f in fr]
    B=ims[0]
    for im in ims[1:3]: B=ImageChops.lighter(B,im)
    area=lambda im: sum(v>10 for v in ImageChops.subtract(B,im).getdata())/(len(list(im.getdata())))
    D=[ImageStat.Stat(ImageChops.subtract(B,im)).mean[0] for im in ims]
    k=max(range(len(D)),key=lambda i:D[i])
    b3.append(area(ims[3])); pk.append(area(ims[k])); last.append(area(ims[-1]))
f=lambda v:(round(st.median(v),3),[round(x,3) for x in st.quantiles(v,n=4)])
print('area>10 at frame 3 (motion+early contrast baseline)',f(b3),' at peak',f(pk),' last frame',f(last))
