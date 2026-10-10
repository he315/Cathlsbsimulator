// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart.ts
var v = (x, y, z) => ({ x, y, z });
var add = (p, q) => v(p.x + q.x, p.y + q.y, p.z + q.z);
var sc = (p, k) => v(p.x * k, p.y * k, p.z * k);
var dot = (p, q) => p.x * q.x + p.y * q.y + p.z * q.z;
var cross = (p, q) => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
var nrm = (p) => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return v(p.x / l, p.y / l, p.z / l);
};
var V3 = { v, add, sc, dot, cross, nrm, sub: (p, q) => v(p.x - q.x, p.y - q.y, p.z - q.z) };
function makeHeart(scale = 1) {
  const base = v(20, -4, -24);
  const apex = v(20 + 62 * scale, -4 - 80 * scale, -24 + 62 * scale);
  const L = nrm(V3.sub(apex, base));
  const len = Math.hypot(apex.x - base.x, apex.y - base.y, apex.z - base.z);
  const xHat = v(1, 0, 0);
  const S = nrm(V3.sub(xHat, sc(L, dot(xHat, L))));
  let A = nrm(cross(L, S));
  if (A.z < 0) A = sc(A, -1);
  return {
    base,
    len,
    L,
    A,
    S,
    rA: 50 * scale,
    rAp: 44 * scale,
    rS: 52 * scale,
    rSr: 64 * scale,
    centre: add(base, sc(L, len * 0.45)),
    a: len / 2
  };
}
function profile(u) {
  const uu = Math.min(1, Math.max(0, u));
  return Math.sqrt(Math.max(0, 1 - Math.pow(uu, 2.6))) * (0.84 + 0.16 * Math.min(1, uu / 0.3));
}
function surfacePoint(H2, ell, phiDeg, h = 2.5, m) {
  const e = m?.contraction ?? 0;
  const u = (ell + 1) / 2;
  const dApex = (1 - u) * H2.len * (1 - 0.12 * e);
  const along = H2.len - dApex;
  const uM = along / H2.len;
  const rho = profile(uM) * (1 - 0.05 * e);
  const phi = (phiDeg + 8 * e * (uM - 0.4)) * Math.PI / 180;
  const c = Math.cos(phi), sn = Math.sin(phi);
  const rA = (c >= 0 ? H2.rA : H2.rAp) * rho + h;
  const rS = (sn >= 0 ? H2.rS : H2.rSr) * rho + h;
  const off = add(sc(H2.A, c * rA), sc(H2.S, sn * rS));
  return add(add(H2.base, sc(H2.L, along)), off);
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/thorax.ts
var MU = {
  soft: 0.02,
  lungExcess: -0.0146,
  airExcess: -0.02,
  liverExcess: 12e-4,
  fatExcess: -25e-4,
  cortical: 0.019,
  // excess over soft tissue
  cancellous: 65e-4,
  cartilage: 35e-4,
  /** iodine: excess per mm per mg I/mL */
  iodinePerMg: 67e-5
};
var ANAT = {
  BODY: 0,
  LUNG_R: 1,
  LUNG_L: 2,
  HEART: 3,
  RA: 4,
  MEDIA: 5,
  LIVER: 6,
  STOMACH: 7,
  TRACHEA: 8,
  BRONCH_R: 9,
  BRONCH_L: 10,
  HEART_FAT: 11,
  POST_MEDIA: 12,
  LA: 13,
  PA_TRUNK: 14,
  AORTIC_KNOB: 15,
  RVOT: 16,
  SVC: 17,
  LEFT_DOME: 18
};
var DIAPHRAGM_DESCENT = 32;
var v2 = (x, y, z) => ({ x, y, z });
var I3 = [v2(1, 0, 0), v2(0, 1, 0), v2(0, 0, 1)];
var add2 = (a, b) => v2(a.x + b.x, a.y + b.y, a.z + b.z);
var sc2 = (a, k) => v2(a.x * k, a.y * k, a.z * k);
var nrm2 = (a) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v2(a.x / l, a.y / l, a.z / l);
};
var cross2 = (p, q) => v2(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
function axesFrom(a, hint) {
  const x = nrm2(a);
  const z = nrm2(cross2(x, hint));
  const y = nrm2(cross2(z, x));
  return [x, y, z];
}
function buildThorax(o) {
  const k = o.habitus ?? 1;
  const r = o.resp;
  const hs = o.heartShift ?? v2(0, 0, 0);
  const H2 = o.heart;
  const anat = [];
  anat[ANAT.BODY] = { type: 1, c: v2(0, -40, -38), ax: I3, half: [176 * k, 320, 114 * k] };
  anat[ANAT.LUNG_R] = { type: 0, c: v2(-86 * k, 28 - 14 * r, -44), ax: I3, half: [56 * k, 136 + 18 * r, 86 * k] };
  anat[ANAT.LUNG_L] = { type: 0, c: v2(96 * k, 16 - 16 * r, -58), ax: I3, half: [48 * k, 134 + 20 * r, 74 * k] };
  const hc = add2(add2(H2.base, sc2(H2.L, H2.len * 0.44)), hs);
  anat[ANAT.HEART] = { type: 0, c: hc, ax: [H2.L, H2.A, H2.S], half: [H2.len * 0.6, (H2.rA + H2.rAp) * 0.5 + 4, (H2.rS + H2.rSr) * 0.5 + 4] };
  anat[ANAT.HEART_FAT] = { type: 0, c: hc, ax: [H2.L, H2.A, H2.S], half: [H2.len * 0.6 + 10, (H2.rA + H2.rAp) * 0.5 + 20, (H2.rS + H2.rSr) * 0.5 + 20] };
  anat[ANAT.RA] = { type: 0, c: add2(v2(-40, -12, -6), sc2(hs, 0.8)), ax: I3, half: [30, 40, 32] };
  anat[ANAT.MEDIA] = { type: 0, c: add2(v2(4, 36, -26), sc2(hs, 0.4)), ax: I3, half: [40, 85, 46] };
  anat[ANAT.POST_MEDIA] = { type: 0, c: v2(22, -36, -84), ax: I3, half: [56, 150, 38] };
  anat[ANAT.LA] = { type: 0, c: add2(v2(12, -8, -48), sc2(hs, 0.6)), ax: I3, half: [40, 25, 27] };
  anat[ANAT.PA_TRUNK] = { type: 0, c: add2(v2(24, 30, 14), sc2(hs, 0.4)), ax: axesFrom(v2(0.35, 1, -0.45), v2(1, 0, 0)), half: [34, 15, 15] };
  anat[ANAT.AORTIC_KNOB] = { type: 0, c: add2(v2(10, 92, -32), sc2(hs, 0.2)), ax: I3, half: [24, 17, 28] };
  anat[ANAT.RVOT] = { type: 0, c: add2(v2(8, -6, 26), sc2(hs, 0.9)), ax: I3, half: [32, 30, 22] };
  anat[ANAT.SVC] = { type: 1, c: add2(v2(-30, 62, -10), sc2(hs, 0.3)), ax: I3, half: [11, 46, 11] };
  const dd = DIAPHRAGM_DESCENT * r;
  anat[ANAT.LIVER] = { type: 0, c: v2(-62 * k, -160 - dd, -12), ax: I3, half: [125 * k, 92, 125 * k] };
  anat[ANAT.LEFT_DOME] = { type: 0, c: v2(58 * k, -176 - dd, -14), ax: I3, half: [112 * k, 92, 122 * k] };
  anat[ANAT.STOMACH] = { type: 0, c: v2(74 * k, -116 - dd, -48), ax: I3, half: [26, 12, 22] };
  anat[ANAT.TRACHEA] = { type: 1, c: v2(-4, 150, -42), ax: I3, half: [9, 72, 9] };
  const carina = v2(-4, 78, -44);
  const br = (end, rad) => {
    const mid = sc2(add2(carina, end), 0.5);
    const d = add2(end, sc2(carina, -1));
    const len = Math.hypot(d.x, d.y, d.z);
    const [ax0, ax1, ax2] = axesFrom(d, v2(1, 0, 0));
    return { type: 1, c: mid, ax: [ax1, ax0, ax2], half: [rad, len / 2, rad] };
  };
  anat[ANAT.BRONCH_R] = br(v2(-42, 56, -50), 7);
  anat[ANAT.BRONCH_L] = br(v2(44, 48, -54), 6);
  const bones = [];
  const spineX = -4;
  const spineZ = -112;
  const levels = 19;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const height = 19 + 9 * t;
    const y = 185 - i * (height + 5.5);
    const rx = (14 + 10 * t) * k;
    const rz = (12 + 7 * t) * k;
    const c = v2(spineX, y, spineZ + 4 * Math.sin(t * Math.PI));
    bones.push({ type: 1, c, ax: I3, half: [rx, height / 2, rz], mu: MU.cortical });
    bones.push({ type: 1, c, ax: I3, half: [rx - 1.6, height / 2 - 1.4, rz - 1.6], mu: MU.cancellous - MU.cortical });
    for (const s of [-1, 1]) {
      const pc = v2(spineX + s * (rx - 3), y + 3, spineZ - rz - 7);
      bones.push({ type: 0, c: pc, ax: I3, half: [4.5, 7, 9], mu: MU.cortical * 0.9 });
      bones.push({ type: 0, c: pc, ax: I3, half: [3, 5.2, 8], mu: -MU.cortical * 0.75 });
      bones.push({ type: 0, c: v2(spineX + s * (rx + 12), y + 2, spineZ - rz - 16), ax: I3, half: [13, 4.5, 5.5], mu: MU.cortical * 0.35 });
    }
    bones.push({ type: 0, c: v2(spineX, y - 10, spineZ - rz - 30), ax: axesFrom(v2(0, -0.7, -1), v2(1, 0, 0)), half: [22, 4, 4], mu: MU.cortical * 0.7 });
  }
  bones.push({ type: 2, c: v2(0, 70 + 6 * r, 70), ax: I3, half: [15, 95, 5], mu: MU.cancellous * 1.6 });
  for (const s of [-1, 1]) {
    bones.push({ type: 0, c: v2(s * 112 * k, 110, -132), ax: axesFrom(v2(s * 0.35, 1, 0.15), v2(1, 0, 0)), half: [78, 48, 4], mu: MU.cortical * 0.5 });
  }
  const tubes = [];
  const rib = (n, side) => {
    const yHead = 172 - (n - 1) * 25.5;
    const W = (108 + Math.min(1, n / 7) * 50) * k;
    const D = (82 + Math.min(1, n / 6) * 28) * k;
    const zc = -38;
    const pts = [];
    const radii = [];
    const thick = [];
    const outward = [];
    const thetaEnd = n <= 10 ? 150 - (n > 7 ? (n - 7) * 10 : 0) : 95 + (12 - n) * 10;
    const drop = (n <= 2 ? 30 : n <= 7 ? 72 : 58) * (1 - 0.18 * r);
    for (let th2 = 18; th2 <= thetaEnd; th2 += 4) {
      const a = th2 * Math.PI / 180;
      const f = (th2 - 18) / (thetaEnd - 18);
      const x = side * (W - 10) * Math.sin(a);
      const z = zc - (D - 10) * Math.cos(a);
      const y = yHead + 8 * Math.sin(Math.min(1, f * 3) * Math.PI) - drop * Math.pow(f, 1.35);
      pts.push(v2(x, y, z));
      radii.push(5 + 1.6 * Math.min(1, f * 1.6));
      thick.push(3.6 - 1.2 * f);
      outward.push(nrm2(v2(Math.sin(a) * side / (W - 10), 0, -Math.cos(a) / (D - 10))));
    }
    tubes.push({ pts, r: radii, mu: [MU.cortical, 0, 0], thin: { dir: outward, r: thick } });
    tubes.push({
      pts,
      r: radii.map((x) => x - 1.3),
      mu: [MU.cancellous - MU.cortical, 0, 0],
      thin: { dir: outward, r: thick.map((x) => x - 0.9) }
    });
    if (n <= 7) {
      const last = pts[pts.length - 1];
      const st = v2(side * 14, 150 - (n - 1) * 17, 66);
      const cart = [];
      for (let i = 0; i <= 6; i++) cart.push(add2(sc2(last, 1 - i / 6), sc2(st, i / 6)));
      tubes.push({ pts: cart, r: cart.map(() => 4.2), mu: [MU.cartilage, 0, 0] });
    }
  };
  for (let n = 1; n <= 12; n++) {
    rib(n, -1);
    rib(n, 1);
  }
  for (const s of [-1, 1]) {
    const cl = [v2(s * 18, 196, 62), v2(s * 60, 206, 50), v2(s * 105, 204, 22), v2(s * 150, 196, -8)];
    const r0 = cl.map(() => 6.5);
    tubes.push({ pts: cl, r: r0, mu: [MU.cortical, 0, 0] });
    tubes.push({ pts: cl, r: r0.map((x) => x - 1.6), mu: [MU.cancellous - MU.cortical, 0, 0] });
  }
  for (const t of pulmonaryTrees(r)) tubes.push(t);
  return { anat, bones, tubes };
}
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var LUNG_VESSEL_MU = 0.0135;
function pulmonaryTrees(resp) {
  const out = [];
  const rnd = prng(7);
  const grow = (start, dir, len, rad, depth, side) => {
    const pts = [start];
    const radii = [rad];
    let p = start;
    let d = nrm2(dir);
    const steps = Math.max(3, Math.round(len / 6));
    for (let i = 1; i <= steps; i++) {
      d = nrm2(add2(d, v2((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25 - 0.04, (rnd() - 0.5) * 0.25)));
      p = add2(p, sc2(d, len / steps));
      const lc = side < 0 ? v2(-80, 20 - 15 * resp, -42) : v2(84, 10 - 15 * resp, -46);
      const q = v2((p.x - lc.x) / 62, (p.y - lc.y) / 130, (p.z - lc.z) / 82);
      if (q.x * q.x + q.y * q.y + q.z * q.z > 0.85) d = nrm2(add2(d, sc2(nrm2(add2(lc, sc2(p, -1))), 0.6)));
      pts.push(p);
      radii.push(rad * (1 - 0.35 * (i / steps)));
    }
    out.push({ pts, r: radii, mu: [LUNG_VESSEL_MU, 0, 0] });
    if (depth <= 0 || rad < 0.45) return;
    const nChild = depth > 3 ? 2 : rnd() < 0.7 ? 2 : 3;
    for (let c = 0; c < nChild; c++) {
      const spread = 0.45 + rnd() * 0.5;
      const nd = nrm2(add2(d, v2((rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 1.4)));
      grow(p, nd, len * (0.62 + rnd() * 0.18), rad * 0.68, depth - 1, side);
    }
  };
  const hilaR = v2(-38, 26 - 10 * resp, -44);
  const hilaL = v2(40, 34 - 10 * resp, -50);
  const lobes = [
    [hilaR, v2(-0.5, 0.75, 0.1), -1],
    [hilaR, v2(-0.85, 0.1, 0.25), -1],
    [hilaR, v2(-0.55, -0.8, 0), -1],
    [hilaR, v2(-0.35, -0.7, -0.5), -1],
    [hilaL, v2(0.45, 0.8, 0.1), 1],
    [hilaL, v2(0.85, 0.05, 0.25), 1],
    [hilaL, v2(0.5, -0.8, -0.1), 1],
    [hilaL, v2(0.3, -0.7, -0.55), 1]
  ];
  for (const [h, d, side] of lobes) grow(h, d, 34, 5.5, 5, side);
  return out;
}

// consist.ts
var H = makeHeart(1);
var th = buildThorax({ resp: 0, heart: H });
var E = th.anat[ANAT.HEART];
var F = th.anat[ANAT.HEART_FAT];
function hit(S, o, d) {
  const oc = V3.sub(o, S.c);
  const q = (v3) => [V3.dot(v3, S.ax[0]) / S.half[0], V3.dot(v3, S.ax[1]) / S.half[1], V3.dot(v3, S.ax[2]) / S.half[2]];
  const a = q(d), b = q(oc);
  const A = a[0] ** 2 + a[1] ** 2 + a[2] ** 2, B = 2 * (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]), C = b[0] ** 2 + b[1] ** 2 + b[2] ** 2 - 1;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}
console.log("phi  ell  vessel-radius  heart-ellipsoid-radius  fat-ellipsoid-radius (mm from long axis)");
for (const ell of [-0.8, -0.3, 0.2, 0.6]) for (const phi of [0, 90, 180, -90]) {
  const u = (ell + 1) / 2;
  const ax = V3.add(H.base, V3.sc(H.L, u * H.len));
  const p = surfacePoint(H, ell, phi, 3);
  const d = V3.nrm(V3.sub(p, ax));
  const rv = Math.hypot(...Object.values(V3.sub(p, ax)));
  console.log(String(phi).padStart(4), ell.toFixed(1).padStart(5), rv.toFixed(1).padStart(8), hit(E, ax, d).toFixed(1).padStart(10), hit(F, ax, d).toFixed(1).padStart(10));
}
