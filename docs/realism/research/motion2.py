import json, sys
def q(xs,ps=(0.1,0.25,0.5,0.75,0.9)):
    xs=sorted(xs); return [round(xs[min(len(xs)-1,int(p*(len(xs)-1)+0.5))],2) for p in ps] if xs else []
for fn in sys.argv[1:]:
    rows=[json.loads(l) for l in open(fn)]
    for art in ('LCA','RCA'):
        R=[r for r in rows if r['artery']==art]
        ex=[];big=0;vert=0;used=0
        for r in R:
            tr=r['traj']; fps=r['fps']
            w=max(3,round(fps/2))  # samples are every 2 frames -> window ~1 s
            if len(tr)<w+2: continue
            used+=1
            sm=[]
            for i in range(len(tr)-w+1):
                xs=[t[1] for t in tr[i:i+w]]; ys=[t[2] for t in tr[i:i+w]]
                sm.append((sum(xs)/w,sum(ys)/w))
            x0,y0=sm[0]
            d=[((x-x0)**2+(y-y0)**2)**.5 for x,y in sm]
            k=max(range(len(d)),key=lambda i:d[i])
            ex.append(d[k])
            if d[k]>=8:
                big+=1
                if abs(sm[k][1]-y0)>abs(sm[k][0]-x0): vert+=1
        print(fn,art,'runs used',used,'of',len(R),'cardiac-averaged max excursion px@128 q10..q90',q(ex),'>=8px:',big,'vertical-dominant:',vert)
