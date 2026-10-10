# Time-density, heart rate and noise measurements on real cine runs (PIL + stdlib only)
import json, os, random, statistics as st, math, sys
from PIL import Image, ImageChops, ImageStat, ImageFilter
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
random.seed(11)
def load_runs(d, fps):
    j=json.load(open(LIB+d+'/index.json'))
    out=[]
    for p in j['patients']:
        for r in p['runs']:
            out.append((d,r['id'],r['artery'],r.get('angles'),[os.path.join(LIB,d,r['id'],f) for f in r['frames']],fps))
    return out
def small(path,n=128):
    im=Image.open(path).convert('L')
    return im.resize((n,n),Image.BILINEAR)
def central(im):
    w,h=im.size; m=int(w*0.12)
    return im.crop((m,m,w-m,h-m))
def tdc(frames):
    ims=[central(small(f)) for f in frames]
    # pre-contrast reference: per-pixel max (lightest) of first 3 frames
    B=ims[0]
    for im in ims[1:3]: B=ImageChops.lighter(B,im)
    D=[ImageStat.Stat(ImageChops.subtract(B,im)).mean[0] for im in ims]
    M=[0.0]+[ImageStat.Stat(ImageChops.difference(ims[i],ims[i-1])).mean[0] for i in range(1,len(ims))]
    return D,M
def autocorr_period(x, lo, hi):
    n=len(x)
    if n<hi*2+4: return None
    # detrend with centred moving average of ~hi frames
    w=hi
    y=[]
    for i in range(n):
        a=max(0,i-w//2); b=min(n,i+w//2+1)
        y.append(x[i]-sum(x[a:b])/(b-a))
    m=sum(y)/n; y=[v-m for v in y]
    v0=sum(v*v for v in y)
    if v0<=0: return None
    ac=[sum(y[i]*y[i+L] for i in range(n-L))/v0 for L in range(hi+2)]
    best=None
    for L in range(lo,hi+1):
        if ac[L]>ac[L-1] and ac[L]>=ac[L+1] and (best is None or ac[L]>ac[best]): best=L
    if best is None or ac[best]<0.25: return None
    # parabolic refinement
    a,b,c=ac[best-1],ac[best],ac[best+1]
    den=a-2*b+c
    off=0.5*(a-c)/den if den!=0 else 0
    return best+off, ac[best]
def noise(path):
    im=Image.open(path).convert('L')
    w,h=im.size; m=int(w*0.2)
    im=im.crop((m,m,w-m,h-m))
    bl=im.filter(ImageFilter.GaussianBlur(1.2))
    # residual offset by 128
    from PIL import ImageMath
    r=ImageMath.eval("float(a)-float(b)",a=im,b=bl)
    px=list(r.getdata())
    med=st.median([abs(v) for v in px])
    sigma=1.4826*med
    # horizontal lag-1 and lag-2 autocorrelation of the residual, robust: clip outliers at 4 sigma
    W=r.size[0]
    cl=[max(-4*sigma,min(4*sigma,v)) for v in px]
    mu=sum(cl)/len(cl)
    cl=[v-mu for v in cl]
    v0=sum(v*v for v in cl)/len(cl)
    def lag(L):
        s=0;n=0
        for y in range(0,r.size[1],2):
            row=cl[y*W:(y+1)*W]
            for x in range(0,W-L): s+=row[x]*row[x+L]; n+=1
        return s/n/v0
    return sigma, lag(1), lag(2)
res={}
for d,fps,N in [('dominance',15,90),('dominance-main',15,60),('cadica',10,60)]:
    runs=[r for r in load_runs(d,fps) if len(r[4])>=30]
    random.shuffle(runs)
    runs=runs[:N]
    rows=[]
    for (dd,rid,art,ang,frames,fps) in runs:
        D,M=tdc(frames)
        pk=max(range(len(D)),key=lambda i:D[i]); peak=D[pk]
        if peak<2: continue
        above=[i for i,v in enumerate(D) if v>=0.5*peak]
        first10=next((i for i,v in enumerate(D) if v>=0.1*peak),0)
        first90=next((i for i,v in enumerate(D) if v>=0.9*peak),pk)
        lastAbove=above[-1]
        washed = D[-1] < 0.5*peak
        hp=autocorr_period(M, max(2,int(fps*0.33)), int(fps*1.5))
        hr=60*fps/hp[0] if hp else None
        rows.append(dict(id=rid,art=art,peak_s=pk/fps,rise_s=(first90-first10)/fps,half_dur_s=(lastAbove-above[0]+1)/fps,washed=washed,end_s=len(D)/fps,peakD=peak,hr=hr,ac=hp[1] if hp else None,arrive_s=first10/fps))
    res[d]=rows
    def q(key,cond=lambda r:True):
        v=[r[key] for r in rows if r[key] is not None and cond(r)]
        return (len(v), round(st.median(v),2), [round(x,2) for x in st.quantiles(v,n=4)]) if len(v)>=4 else (len(v),)
    print('==',d,'runs',len(rows))
    for k in ['arrive_s','rise_s','peak_s','half_dur_s','end_s','peakD','hr']: print('  ',k,q(k))
    print('   washed out (<50% peak) by end of run:',sum(r['washed'] for r in rows),'/',len(rows))
    for art in ['LCA','RCA']:
        print('   ',art,'half_dur',q('half_dur_s',lambda r:r['art']==art),'rise',q('rise_s',lambda r:r['art']==art),'peakD',q('peakD',lambda r:r['art']==art))
# noise on a subset of frames (frame 2 of each run: usually pre-contrast) 
print('== noise (frame index 1, central 60% crop, residual vs Gaussian blur r=1.2, grey levels as stored)')
for d in ['dominance','cadica','angiocad']:
    runs=load_runs(d,15)
    random.shuffle(runs)
    S=[];L1=[];L2=[];size=None
    for r in runs[:25]:
        if len(r[4])<3: continue
        s,l1,l2=noise(r[4][1]); S.append(s);L1.append(l1);L2.append(l2)
        size=Image.open(r[4][1]).size
    print(d,'frame size',size,'n',len(S),'sigma median',round(st.median(S),2),'IQR',[round(x,2) for x in st.quantiles(S,n=4)],'lag1',round(st.median(L1),3),'lag2',round(st.median(L2),3))
json.dump(res,open('/private/tmp/claude-502/cathmaster-research/m2_rows.json','w'),indent=0)
