import json, collections, statistics as st
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
def fam(p,s):
    lr = 'LAO' if p>=15 else ('RAO' if p<=-15 else 'AP')
    cc = 'CRA' if s>=15 else ('CAU' if s<=-15 else '0')
    return lr+'-'+cc
runs=[]; studies=[]
for d in ['dominance','dominance-main']:
    j=json.load(open(LIB+d+'/index.json'))
    for p in j['patients']:
        nl=nr=0
        for r in p['runs']:
            a=r.get('angles')
            if not a: continue
            runs.append((r['artery'],a['primary'],a['secondary'],len(r['frames']),d))
            if r['artery']=='LCA': nl+=1
            elif r['artery']=='RCA': nr+=1
        studies.append((nl,nr))
print('runs with angles',len(runs),'studies',len(studies))
for art in ['LCA','RCA']:
    rr=[r for r in runs if r[0]==art]
    c=collections.Counter(fam(r[1],r[2]) for r in rr)
    print(art,len(rr),[(k,v,round(100*v/len(rr),1)) for k,v in c.most_common()])
    P=[r[1] for r in rr]; S=[r[2] for r in rr]
    print('  primary median/IQR',st.median(P),st.quantiles(P,n=4),' secondary',st.median(S),st.quantiles(S,n=4))
    print('  |primary|>=40:',sum(abs(x)>=40 for x in P),' |secondary|>=35:',sum(abs(x)>=35 for x in S))
L=[s[0] for s in studies]; R=[s[1] for s in studies]
print('LCA runs/study median',st.median(L),st.quantiles(L,n=4),'RCA runs/study',st.median(R),st.quantiles(R,n=4))
# frames per run (truncated at 120)
fr=[r[3] for r in runs]
print('frames/run median',st.median(fr),'quartiles',st.quantiles(fr,n=4),'truncated at 120:',sum(f>=120 for f in fr),'of',len(fr))
# CADICA run length (10 fps, not truncated)
j=json.load(open(LIB+'cadica/index.json'))
cf=[len(r['frames']) for p in j['patients'] for r in p['runs']]
print('CADICA runs',len(cf),'frames median',st.median(cf),'quartiles',st.quantiles(cf,n=4),'min',min(cf),'max',max(cf),'-> seconds at 10fps median',st.median(cf)/10)
