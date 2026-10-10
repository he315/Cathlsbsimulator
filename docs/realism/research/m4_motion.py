# Vessel motion in real cine: track high-contrast patches frame to frame (SAD block matching with PIL)
import json, os, random, statistics as st, math
from PIL import Image, ImageChops, ImageStat, ImageFilter
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
random.seed(3)
N=256; P=40; R=14
def prep(path):
    im=Image.open(path).convert('L').resize((N,N),Image.BILINEAR)
    return im
def best_shift(a,b,x,y):
    pa=a.crop((x,y,x+P,y+P))
    best=None
    for dy in range(-R,R+1):
        for dx in range(-R,R+1):
            if x+dx<0 or y+dy<0 or x+dx+P>N or y+dy+P>N: continue
            pb=b.crop((x+dx,y+dy,x+dx+P,y+dy+P))
            s=ImageStat.Stat(ImageChops.difference(pa,pb)).sum[0]
            if best is None or s<best[0]: best=(s,dx,dy)
    return best
def run(d,fps,limit):
    j=json.load(open(LIB+d+'/index.json'))
    rr=[(r['id'],r['artery'],r.get('angles'),[os.path.join(LIB,d,r['id'],f) for f in r['frames']]) for p in j['patients'] for r in p['runs'] if len(r['frames'])>=30]
    random.shuffle(rr)
    out=[]
    for rid,art,ang,fr in rr[:limit]:
        ims=[prep(f) for f in fr]
        # use the opacified part: the second half of the run
        k0=len(ims)//3
        seq=ims[k0:]
        ref=seq[0]
        # choose the patch with the largest local contrast (darkest vessels) in the reference, away from edges
        cand=[]
        for y in range(32,N-32-P,12):
            for x in range(32,N-32-P,12):
                st_=ImageStat.Stat(ref.crop((x,y,x+P,y+P)))
                cand.append((st_.stddev[0],x,y))
        cand.sort(reverse=True)
        px,py=cand[0][1],cand[0][2]
        cx=cy=0.0; xs=[0.0]; ys=[0.0]; sp=[]
        x,y=px,py
        for i in range(1,len(seq)):
            b=best_shift(seq[i-1],seq[i],x,y)
            dx,dy=b[1],b[2]
            sp.append(math.hypot(dx,dy)*512/N)
            cx+=dx; cy+=dy; xs.append(cx); ys.append(cy)
            # follow the patch
            x=min(max(0,x+dx),N-P); y=min(max(0,y+dy),N-P)
        ptp=math.hypot(max(xs)-min(xs),max(ys)-min(ys))*512/N
        sp.sort()
        out.append(dict(id=rid,art=art,ptp_px512=ptp,p95_speed_px512_per_frame=sp[int(0.95*(len(sp)-1))],median_speed=st.median(sp),n=len(seq)))
    return out
for d,fps,lim in [('dominance',15,40),('cadica',10,30)]:
    o=run(d,fps,lim)
    for art in ['LCA','RCA']:
        oo=[r for r in o if r['art']==art]
        if len(oo)<4: continue
        f=lambda k:(round(st.median([r[k] for r in oo]),1),[round(x,1) for x in st.quantiles([r[k] for r in oo],n=4)])
        print(d,art,'n',len(oo),'peak-to-peak excursion px@512',f('ptp_px512'),'(% width',round(100*st.median([r['ptp_px512'] for r in oo])/512,1),') P95 speed px/frame',f('p95_speed_px512_per_frame'),'median speed',f('median_speed'))
    json.dump(o,open(f'/private/tmp/claude-502/cathmaster-research/m4_{d}.json','w'))
