import math, spectral as S
# tungsten mu/rho from NIST z74 (opened); the below-K-edge value at 69.525 keV is EXTRAPOLATED from 50-60 keV log slope (not in the fetched rows)
S.T['W'] = [(15,138.9),(20,65.73),(30,22.73),(40,10.67),(50,5.949),(60,3.713),(69.525,3.713*(69.525/60)**(math.log(3.713/5.949)/math.log(60/50))),(69.525,11.23),(80,7.810),(100,4.438),(150,1.581)]
S.RHO['W'] = 19.30
alpha = 9.0  # anode angle (Philips Azurion 7 C12 spec sheet)
half_field = 115.0; sid = 1060.0
for depth_um in (1.0, 2.0, 4.0):   # ASSUMED mean emission depth in the target
    row=[]
    for off in (-half_field, -57.5, 0, 57.5, half_field):  # mm on detector along anode-cathode axis (+ = cathode side)
        ang = alpha + math.degrees(math.atan(off/sid))
        L = depth_um*1e-3/math.sin(math.radians(ang))  # mm of W
        sp = S.spectrum(80, 0.4)
        s = sum(n*E*math.exp(-S.mu_mm('W',E)*L - S.mu_mm('tissue',E)*200) for E,n in sp)
        row.append((off, ang, s))
    c = row[2][2]
    print(f'depth {depth_um} um:', '  '.join(f'{o:+.0f}mm({a:.1f}deg)={s/c:.3f}' for o,a,s in row))
# geometric unsharpness (penumbra) at the detector for an object at distance d from the focal spot
for f in (0.5, 0.8):
    for name, d in (('sternum ~ iso+100',865),('iso',765),('spine ~ iso-100',665)):
        print(f'focal {f} mm, {name}: Ug = {f*(sid-d)/d:.3f} mm at detector, M = {sid/d:.3f}')
