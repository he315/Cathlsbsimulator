import json, collections, statistics as st
LIB="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library/"
j=json.load(open(LIB+'angiocad/index.json'))
P=j['patients']
print('AngioCAD patients',len(P))
dom=collections.Counter(p.get('dominance') for p in P); print('dominance',dom.most_common())
ind=collections.Counter(p.get('indication') for p in P); print('indication top',ind.most_common(6))
segs=collections.defaultdict(collections.Counter)
for p in P:
    for s,g in (p.get('segments') or {}).items(): segs[s][g]+=1
grades=sorted({g for c in segs.values() for g in c})
print('grades',grades)
for s,c in segs.items():
    n=sum(c.values()); sig=sum(v for g,v in c.items() if g in ('70-99','100','76-99','51-75','70-90','90-99','99'))
    print(f'{s:10s} n={n} ', dict(c.most_common()))
g=[p['gensini'] for p in P if isinstance(p.get('gensini'),(int,float))]
print('gensini median',st.median(g),'IQR',st.quantiles(g,n=4),'zero',sum(x==0 for x in g))
runs=[len(p['runs']) for p in P]; print('runs/patient median',st.median(runs),st.quantiles(runs,n=4))
# CADICA lesion labels
c=json.load(open(LIB+'cadica/index.json'))
r0=c['patients'][0]['runs'][0]; print('cadica run keys',list(r0.keys()))
