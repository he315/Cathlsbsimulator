"""Polyenergetic beam model from NIST XCOM/XAAMDI mass attenuation tables (opened pages,
physics.nist.gov/PhysRefData/XrayMassCoef). Kramers' law bremsstrahlung (no characteristic lines,
no heel effect) is a MODEL ASSUMPTION; results are for relative trends only."""
import math

# mu/rho (cm2/g) at energies (keV); edges given as two entries at the same energy (below, above)
T = {
 'I':  [(10,162.6),(15,55.12),(20,25.43),(30,8.561),(33.1694,6.553),(33.1694,35.82),(40,22.10),(50,12.32),(60,7.579),(80,3.510),(100,1.942),(150,0.6978)],
 'Cs': [(10,179.3),(15,61.04),(20,28.22),(30,9.507),(35.9846,5.863),(35.9846,31.43),(40,23.81),(50,13.40),(60,8.248),(80,3.836),(100,2.124),(150,0.7589)],
 'tissue': [(10,5.379),(15,1.699),(20,0.823),(30,0.379),(40,0.2688),(50,0.2264),(60,0.2048),(80,0.1823),(100,0.1693),(150,0.1492)],
 'bone': [(10,28.51),(15,9.032),(20,4.001),(30,1.331),(40,0.6655),(50,0.4242),(60,0.3148),(80,0.2229),(100,0.1855),(150,0.1480)],
 'adipose': [(10,3.268),(15,1.083),(20,0.5677),(30,0.3063),(40,0.2396),(50,0.2123),(60,0.1974),(80,0.1800),(100,0.1688),(150,0.1500)],
 'lung': [(10,5.459),(15,1.721),(20,0.8316),(30,0.3815),(40,0.2699),(50,0.2270),(60,0.2053),(80,0.1826),(100,0.1695),(150,0.1493)],
 'Al': [(10,26.23),(15,7.955),(20,3.441),(30,1.128),(40,0.5685),(50,0.3681),(60,0.2778),(80,0.2018),(100,0.1704),(150,0.1378)],
 'Cu': [(10,215.9),(15,74.05),(20,33.79),(30,10.92),(40,4.862),(50,2.613),(60,1.593),(80,0.7630),(100,0.4584),(150,0.2217)],
 'Co': [(10,184.1),(15,62.01),(20,28.03),(30,8.962),(40,3.981),(50,2.144),(60,1.314),(80,0.6414),(100,0.3949),(150,0.2023)],
 'Fe': [(10,170.6),(15,57.08),(20,25.68),(30,8.176),(40,3.629),(50,1.958),(60,1.205),(80,0.5952),(100,0.3717),(150,0.1964)],
 'Pt': [(15,157.8),(20,75.74),(30,26.41),(40,12.45),(50,6.954),(60,4.339),(78.3948,2.203),(78.3948,9.301),(80,8.731),(100,4.993),(150,1.795)],
}
RHO = {'tissue':1.06,'bone':1.92,'adipose':0.95,'lung':1.05,'Al':2.699,'Cu':8.96,'Co':8.90,'Fe':7.874,'Pt':21.45,'I':4.93}

def mu_rho(m, E):
    t = T[m]
    # pick bracketing pair honouring edges: use the last entry with e<=E as lower, first entry with e>E as upper
    lo = None
    for i,(e,v) in enumerate(t):
        if e <= E: lo = i
    if lo is None: lo = 0
    hi = lo + 1
    if hi >= len(t): hi = len(t)-1; lo = hi-1
    e0,v0 = t[lo]; e1,v1 = t[hi]
    if e1 == e0: return v1
    a = (math.log(v1)-math.log(v0))/(math.log(e1)-math.log(e0))
    return math.exp(math.log(v0) + a*(math.log(E)-math.log(e0)))

def mu_mm(m, E):  # linear attenuation per mm
    return mu_rho(m,E)*RHO[m]/10.0

def mu_iodine_per_mg_mm(E):  # per mm per (mg I / mL)
    return mu_rho('I',E)*1e-3/10.0

def spectrum(kvp, cu_mm, al_mm=2.5):
    Es = [e+0.5 for e in range(15, int(kvp))]
    out = []
    for E in Es:
        n = (kvp - E)/E  # Kramers photon-number spectrum (model)
        n *= math.exp(-mu_mm('Al',E)*al_mm - mu_mm('Cu',E)*cu_mm)
        out.append((E,n))
    return out

def detector_weight(E, mode):
    if mode == 'ideal-EI': return E
    if mode == 'counting': return 1.0
    raise ValueError

def signal(spec, path, mode='ideal-EI'):
    """path: dict material->mm (tissue, bone...) plus 'iodine' in mg/mL*mm"""
    s = 0.0
    for E,n in spec:
        att = 0.0
        for m,L in path.items():
            if m == 'iodine': att += mu_iodine_per_mg_mm(E)*L
            else: att += mu_mm(m,E)*L
        s += n*detector_weight(E,mode)*math.exp(-att)
    return s

def eff_mu(spec, base, m, dL=1e-3, mode='ideal-EI'):
    s0 = signal(spec, base, mode)
    b2 = dict(base); b2[m] = b2.get(m,0)+dL
    s1 = signal(spec, b2, mode)
    return -math.log(s1/s0)/dL

def mean_energy(spec, base, mode='ideal-EI'):
    num=den=0.0
    for E,n in spec:
        att=sum((mu_iodine_per_mg_mm(E)*L if m=='iodine' else mu_mm(m,E)*L) for m,L in base.items())
        w=n*detector_weight(E,mode)*math.exp(-att)
        num+=w*E; den+=w
    return num/den

if __name__ == '__main__':
    print('# effective iodine attenuation (per mm per mg I/mL) at the detector, ideal energy-integrating detector')
    print('kVp  Cu   water0  water200  water300  meanE@200mm  bone/tissue@200  Pt/I@200  Co/I@200')
    for cu in (0.1, 0.4, 0.9):
        for kvp in (60, 70, 80, 90, 100, 110):
            sp = spectrum(kvp, cu)
            r = []
            for w in (0, 200, 300):
                r.append(eff_mu(sp, {'tissue': w}, 'iodine'))
            b = eff_mu(sp, {'tissue':200}, 'bone') / eff_mu(sp, {'tissue':200}, 'tissue')
            pt = eff_mu(sp, {'tissue':200}, 'Pt') / (eff_mu(sp, {'tissue':200}, 'iodine'))
            co = eff_mu(sp, {'tissue':200}, 'Co') / (eff_mu(sp, {'tissue':200}, 'iodine'))
            me = mean_energy(sp, {'tissue':200})
            print(f'{kvp:4d} {cu:.1f}  {r[0]:.5f} {r[1]:.5f} {r[2]:.5f}   {me:6.1f}     {b:6.3f}       {pt:8.1f} {co:8.1f}')
    print()
    print('# beam hardening in water: -ln(T) vs linear extrapolation from the entrance effective mu (80 kVp, 0.4 mm Cu)')
    sp = spectrum(80, 0.4)
    s0 = signal(sp, {'tissue':0})
    mu0 = eff_mu(sp, {'tissue':0}, 'tissue')
    for w in (50,100,150,200,250,300):
        P = -math.log(signal(sp, {'tissue':w})/s0)
        print(f'water {w:3d} mm: P_poly={P:.3f}  P_lin={mu0*w:.3f}  ratio={P/(mu0*w):.3f}  mu_eff_local={eff_mu(sp,{"tissue":w},"tissue"):.5f}/mm')
    print()
    print('# code check: CathMaster iodine gain (75/kV)^2.2 vs spectral model (relative to 75 kVp), 0.4 mm Cu, 200 mm tissue')
    ref = eff_mu(spectrum(75,0.4), {'tissue':200}, 'iodine')
    for kvp in (65,75,85,95,105):
        m = eff_mu(spectrum(kvp,0.4), {'tissue':200}, 'iodine')/ref
        print(f'kVp {kvp}: model {m:.3f}  code {(75/kvp)**2.2:.3f}')
    print('# metal (Pt) relative to 75 kVp vs code (75/kV)^1.4')
    refp = eff_mu(spectrum(75,0.4), {'tissue':200}, 'Pt')
    for kvp in (65,75,85,95,105):
        m = eff_mu(spectrum(kvp,0.4), {'tissue':200}, 'Pt')/refp
        print(f'kVp {kvp}: model {m:.3f}  code {(75/kvp)**1.4:.3f}')
    print('# bone excess over tissue relative to 75 kVp (code keeps bone fixed = 1.000)')
    def bex(kvp):
        sp=spectrum(kvp,0.4); return eff_mu(sp,{'tissue':200},'bone')-eff_mu(sp,{'tissue':200},'tissue')
    rb=bex(75)
    for kvp in (65,75,85,95,105): print(f'kVp {kvp}: model {bex(kvp)/rb:.3f}')
    print('# code iodinePerMg 0.00067/mm per mg/mL vs model at 75 kVp, 0.4 mm Cu, 200 mm tissue:', round(ref,6))
    print('# lung vs tissue mass attenuation ratio at 60 keV:', round(mu_rho('lung',60)/mu_rho('tissue',60),4))
