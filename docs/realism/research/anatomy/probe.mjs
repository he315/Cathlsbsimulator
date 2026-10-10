// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/utils/math.ts
var V = (x = 0, y = 0, z = 0) => ({ x, y, z });
var add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});
var scale = (a, s) => ({
  x: a.x * s,
  y: a.y * s,
  z: a.z * s
});
var dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
var length = (a) => Math.sqrt(dot(a, a));
var normalize = (a) => {
  const l = length(a);
  if (l < 1e-9) return V(0, 1, 0);
  return scale(a, 1 / l);
};
var deg2rad = (d) => d * Math.PI / 180;

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy.ts
var ROOT_RADIUS = {
  small: 14,
  normal: 18,
  dilated: 24
};
var VALVE_PLANE_Y = 0;
var SINUS_TOP_Y = 26;
var radial = (az) => V(Math.cos(az), 0, Math.sin(az));
var axisPoint = (h) => V(0, h, 0);
function branch(from, deltas) {
  const pts = [from];
  let cur = from;
  for (const d of deltas) {
    cur = add(cur, d);
    pts.push(cur);
  }
  return pts;
}
function buildAnatomy(c2) {
  const R = ROOT_RADIUS[c2.rootSize];
  const rot = deg2rad(c2.rootRotationDeg);
  const tilt = deg2rad(c2.aortaTiltDeg);
  const tiltAz = tilt * 0.35;
  const tiltH = -c2.aortaTiltDeg * 0.12;
  const has = (v2) => c2.variants.includes(v2);
  let lmAz = deg2rad(-30) + rot + tiltAz;
  let lmHeight = 15 + tiltH;
  const lmLen = has("short-lm") ? 5 : has("long-lm") ? 16 : 9;
  const lm = {
    az: lmAz,
    height: lmHeight,
    pos: add(scale(radial(lmAz), R), axisPoint(lmHeight)),
    dir: normalize(add(radial(lmAz), V(0, -0.2, 0)))
  };
  let rcaAz = deg2rad(150) + rot + tiltAz;
  let rcaHeight = 12 + tiltH;
  if (has("high-rca")) rcaHeight += 6;
  if (has("superior-rca")) {
    rcaHeight += 8;
    rcaAz += deg2rad(10);
  }
  if (has("anterior-rca")) rcaAz -= deg2rad(28);
  if (has("shepherds-crook-rca")) rcaHeight += 5;
  const rca = {
    az: rcaAz,
    height: rcaHeight,
    pos: add(scale(radial(rcaAz), R), axisPoint(rcaHeight)),
    dir: normalize(add(radial(rcaAz), V(0, -0.25, 0)))
  };
  const conusAz = rcaAz - deg2rad(18);
  const conusHeight = rcaHeight + 4;
  const conus = {
    az: conusAz,
    height: conusHeight,
    pos: add(scale(radial(conusAz), R), axisPoint(conusHeight)),
    dir: normalize(add(radial(conusAz), V(0, 0.15, 0)))
    // points up/anterior
  };
  let leftOstium2 = null;
  if (has("separate-ostia")) {
    const az2 = lmAz + deg2rad(18);
    leftOstium2 = {
      az: az2,
      height: lmHeight - 2,
      pos: add(scale(radial(az2), R), axisPoint(lmHeight - 2)),
      dir: normalize(add(radial(az2), V(0, -0.2, 0)))
    };
  }
  const vessels = [];
  const lmDir = radial(lmAz);
  const bif = add(lm.pos, add(scale(lmDir, lmLen), V(0, -3, 0)));
  if (!has("separate-ostia")) {
    vessels.push({ id: "LM", points: [lm.pos, bif], radius: 1.7 });
  }
  const ladStart = has("separate-ostia") ? lm.pos : bif;
  const lad = branch(ladStart, [
    V(2, -6, 8),
    V(3, -12, 12),
    V(2, -14, 12),
    V(-2, -14, 8),
    V(-4, -12, 2)
  ]);
  vessels.push({ id: "LAD", points: lad, radius: 1.3 });
  vessels.push({
    id: "D1",
    points: branch(lad[1], [V(9, -8, 2), V(10, -9, 0)]),
    radius: 0.8
  });
  vessels.push({
    id: "D2",
    points: branch(lad[2], [V(8, -9, 0), V(8, -10, -2)]),
    radius: 0.7
  });
  vessels.push({
    id: "SEPTAL",
    points: branch(lad[1], [V(-2, -6, -6), V(-2, -7, -7)]),
    radius: 0.6
  });
  const lcxStart = has("separate-ostia") && leftOstium2 ? leftOstium2.pos : bif;
  const lcxDeltas = [
    V(2, -3, -6),
    V(0, -9, -9),
    V(-4, -10, -6)
  ];
  const leftDominant = c2.dominance === "left";
  const coDominant = c2.dominance === "codominant";
  if (leftDominant) lcxDeltas.push(V(-6, -8, -2), V(-6, -8, 4));
  else if (coDominant) lcxDeltas.push(V(-5, -6, -2));
  const lcx = branch(lcxStart, lcxDeltas);
  vessels.push({ id: "LCx", points: lcx, radius: 1.1 });
  vessels.push({
    id: "OM1",
    points: branch(lcx[1], [V(6, -7, -3), V(7, -8, -2)]),
    radius: 0.8
  });
  vessels.push({
    id: "OM2",
    points: branch(lcx[2], [V(4, -8, -2), V(4, -9, 0)]),
    radius: 0.7
  });
  if (has("ramus")) {
    vessels.push({
      id: "RAMUS",
      points: branch(bif, [V(7, -8, 3), V(8, -10, 2)]),
      radius: 0.8
    });
  }
  const rcaDir = radial(rcaAz);
  const rStart = rca.pos;
  const rcaDeltas = [];
  if (has("shepherds-crook-rca")) {
    rcaDeltas.push(V(rcaDir.x * 4, 6, rcaDir.z * 4));
    rcaDeltas.push(V(rcaDir.x * 4, -8, rcaDir.z * 2));
  } else {
    rcaDeltas.push(add(scale(rcaDir, 6), V(0, -4, 0)));
  }
  rcaDeltas.push(V(3, -12, -6));
  if (has("tortuous-rca")) {
    rcaDeltas.push(V(4, -6, -2), V(-2, -6, -4), V(4, -6, -2));
  } else {
    rcaDeltas.push(V(4, -10, -8));
  }
  const rightGivesCrux = c2.dominance === "right" || coDominant;
  if (rightGivesCrux) rcaDeltas.push(V(2, -6, -6));
  const rcaPath = branch(rStart, rcaDeltas);
  vessels.push({ id: "RCA", points: rcaPath, radius: 1.2 });
  vessels.push({
    id: "CONUS",
    points: branch(rcaPath[1], [V(2, 4, 4)]),
    radius: 0.5
  });
  const amIdx = Math.min(2, rcaPath.length - 1);
  vessels.push({
    id: "AM",
    points: branch(rcaPath[amIdx], [V(4, -8, 6), V(4, -9, 6)]),
    radius: 0.7
  });
  const cruxSource = rightGivesCrux ? rcaPath : lcx;
  const crux = cruxSource[cruxSource.length - 1];
  vessels.push({
    id: "PDA",
    points: branch(crux, [V(-2, -8, 6), V(-2, -9, 8)]),
    radius: 0.8
  });
  vessels.push({
    id: "PLV",
    points: branch(crux, [V(-6, -4, 0), V(-7, -5, -2)]),
    radius: 0.7
  });
  const cuspH = 6;
  const cusps = [
    { id: "LCC", pos: add(scale(radial(lmAz), R * 0.9), axisPoint(cuspH)) },
    { id: "RCC", pos: add(scale(radial(rcaAz), R * 0.9), axisPoint(cuspH)) },
    {
      id: "NCC",
      pos: add(scale(radial(lmAz + deg2rad(-150)), R * 0.9), axisPoint(cuspH))
    }
  ];
  return {
    sinusRadius: R,
    valvePlaneY: VALVE_PLANE_Y,
    sinusTopY: SINUS_TOP_Y,
    lm,
    rca,
    conus,
    leftOstium2,
    vessels,
    cusps,
    aortaTiltRad: tilt,
    dominance: c2.dominance
  };
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/utils/random.ts
function hashStringToSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h >>> 0;
}
var Rng = class {
  state;
  constructor(seed) {
    this.state = typeof seed === "string" ? hashStringToSeed(seed) : seed >>> 0;
    if (this.state === 0) this.state = 2654435769;
  }
  next() {
    let t2 = this.state += 1831565813;
    t2 = Math.imul(t2 ^ t2 >>> 15, t2 | 1);
    t2 ^= t2 + Math.imul(t2 ^ t2 >>> 7, t2 | 61);
    return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
  }
  range(lo, hi) {
    return lo + this.next() * (hi - lo);
  }
  int(lo, hi) {
    return Math.floor(this.range(lo, hi + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  pickWeighted(items) {
    const total = items.reduce((a, b) => a + b.weight, 0);
    let r = this.next() * total;
    for (const it of items) {
      r -= it.weight;
      if (r <= 0) return it.value;
    }
    return items[items.length - 1].value;
  }
  bool(pTrue = 0.5) {
    return this.next() < pTrue;
  }
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart.ts
var v = (x, y, z) => ({ x, y, z });
var add2 = (p, q) => v(p.x + q.x, p.y + q.y, p.z + q.z);
var sc = (p, k) => v(p.x * k, p.y * k, p.z * k);
var dot2 = (p, q) => p.x * q.x + p.y * q.y + p.z * q.z;
var cross = (p, q) => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
var nrm = (p) => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return v(p.x / l, p.y / l, p.z / l);
};
var V3 = { v, add: add2, sc, dot: dot2, cross, nrm, sub: (p, q) => v(p.x - q.x, p.y - q.y, p.z - q.z) };
function makeHeart(scale2 = 1) {
  const base = v(20, -4, -24);
  const apex = v(20 + 62 * scale2, -4 - 80 * scale2, -24 + 62 * scale2);
  const L = nrm(V3.sub(apex, base));
  const len = Math.hypot(apex.x - base.x, apex.y - base.y, apex.z - base.z);
  const xHat = v(1, 0, 0);
  const S = nrm(V3.sub(xHat, sc(L, dot2(xHat, L))));
  let A = nrm(cross(L, S));
  if (A.z < 0) A = sc(A, -1);
  return {
    base,
    len,
    L,
    A,
    S,
    rA: 50 * scale2,
    rAp: 44 * scale2,
    rS: 52 * scale2,
    rSr: 64 * scale2,
    centre: add2(base, sc(L, len * 0.45)),
    a: len / 2
  };
}
function profile(u) {
  const uu = Math.min(1, Math.max(0, u));
  return Math.sqrt(Math.max(0, 1 - Math.pow(uu, 2.6))) * (0.84 + 0.16 * Math.min(1, uu / 0.3));
}
function surfacePoint(H2, ell, phiDeg, h = 2.5, m2) {
  const e = m2?.contraction ?? 0;
  const u = (ell + 1) / 2;
  const dApex = (1 - u) * H2.len * (1 - 0.12 * e);
  const along = H2.len - dApex;
  const uM = along / H2.len;
  const rho = profile(uM) * (1 - 0.05 * e);
  const phi = (phiDeg + 8 * e * (uM - 0.4)) * Math.PI / 180;
  const c2 = Math.cos(phi), sn = Math.sin(phi);
  const rA = (c2 >= 0 ? H2.rA : H2.rAp) * rho + h;
  const rS = (sn >= 0 ? H2.rS : H2.rSr) * rho + h;
  const off = add2(sc(H2.A, c2 * rA), sc(H2.S, sn * rS));
  return add2(add2(H2.base, sc(H2.L, along)), off);
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree.ts
var STEP = 1.6;
function catmull(a, b, c2, d, t2) {
  const t22 = t2 * t2, t3 = t22 * t2;
  return 0.5 * (2 * b + (-a + c2) * t2 + (2 * a - 5 * b + 4 * c2 - d) * t22 + (-a + 3 * b - 3 * c2 + d) * t3);
}
function samplePos(H2, s, m2) {
  const surf = surfacePoint(H2, s.ell, s.phi, s.h, m2);
  if (!s.fixed || s.w >= 1) return surf;
  if (s.w <= 0) return s.fixed;
  return V3.add(V3.sc(s.fixed, 1 - s.w), V3.sc(surf, s.w));
}
function sampleVessel(H2, nodes) {
  const fixedNodes = [];
  const surf = [];
  for (const n of nodes) {
    if ("fixed" in n) {
      if (surf.length === 0) fixedNodes.push(n.fixed);
    } else {
      let phi = n.phi;
      if (surf.length) {
        const prev2 = surf[surf.length - 1].phi;
        while (phi - prev2 > 180) phi -= 360;
        while (phi - prev2 < -180) phi += 360;
      }
      surf.push({ ell: n.ell, phi, h: n.h ?? 3 });
    }
  }
  const out = [];
  for (let i = 0; i < fixedNodes.length - 1; i++) {
    const p0 = fixedNodes[i], p1 = fixedNodes[i + 1];
    const d = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
    const n = Math.max(1, Math.round(d / STEP));
    for (let k = 0; k < n; k++) {
      const t2 = k / n;
      out.push({ ell: -1, phi: 0, h: 0, fixed: V3.add(V3.sc(p0, 1 - t2), V3.sc(p1, t2)), w: 0 });
    }
  }
  if (surf.length === 0) {
    const last = fixedNodes[fixedNodes.length - 1];
    out.push({ ell: -1, phi: 0, h: 0, fixed: last, w: 0 });
    return out;
  }
  const fine = [];
  const get = (i) => surf[Math.max(0, Math.min(surf.length - 1, i))];
  for (let i = 0; i < surf.length - 1; i++) {
    for (let k = 0; k < 24; k++) {
      const t2 = k / 24;
      const a = get(i - 1), b = get(i), c2 = get(i + 1), d = get(i + 2);
      fine.push({
        ell: Math.min(0.995, catmull(a.ell, b.ell, c2.ell, d.ell, t2)),
        phi: catmull(a.phi, b.phi, c2.phi, d.phi, t2),
        h: catmull(a.h, b.h, c2.h, d.h, t2),
        w: 1
      });
    }
  }
  const lastS = surf[surf.length - 1];
  fine.push({ ell: lastS.ell, phi: lastS.phi, h: lastS.h, w: 1 });
  if (fixedNodes.length) {
    const p0 = fixedNodes[fixedNodes.length - 1];
    const before = fixedNodes.length > 1 ? fixedNodes[fixedNodes.length - 2] : null;
    const p1 = samplePos(H2, fine[0]);
    const p2 = samplePos(H2, fine[Math.min(fine.length - 1, 6)]);
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
    const t0 = before ? V3.nrm(V3.sub(p0, before)) : V3.nrm(V3.sub(p1, p0));
    const t1 = V3.nrm(V3.sub(p2, p1));
    const n = Math.max(2, Math.round(dist / STEP));
    for (let k = 0; k < n; k++) {
      const t2 = k / n;
      const h00 = 2 * t2 * t2 * t2 - 3 * t2 * t2 + 1, h10 = t2 * t2 * t2 - 2 * t2 * t2 + t2, h01 = -2 * t2 * t2 * t2 + 3 * t2 * t2, h11 = t2 * t2 * t2 - t2 * t2;
      const p = V3.add(V3.add(V3.sc(p0, h00), V3.sc(t0, h10 * dist)), V3.add(V3.sc(p1, h01), V3.sc(t1, h11 * dist)));
      out.push({ ...fine[0], fixed: p, w: t2 * t2 * 0.7 });
    }
  }
  let acc = 0;
  let prev = samplePos(H2, fine[0]);
  out.push(fine[0]);
  for (let i = 1; i < fine.length; i++) {
    const p = samplePos(H2, fine[i]);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
    prev = p;
    if (acc >= STEP || i === fine.length - 1) {
      out.push(fine[i]);
      acc = 0;
    }
  }
  return out;
}
function lengths(H2, s) {
  const out = [0];
  let prev = samplePos(H2, s[0]);
  for (let i = 1; i < s.length; i++) {
    const p = samplePos(H2, s[i]);
    out.push(out[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z));
    prev = p;
  }
  return out;
}
function specsFor(model, dominance, variants) {
  const lmLong = variants.includes("long-lm");
  const lmShort = variants.includes("short-lm") || variants.includes("separate-ostia");
  const lmLen = lmLong ? 16 : lmShort ? 4 : 10;
  const lmDir = V3.nrm(V3.add(model.lm.dir, V3.v(0.15, -0.05, 0.2)));
  const B = V3.add(model.lm.pos, V3.sc(lmDir, lmLen));
  const rcaRun = V3.add(model.rca.pos, V3.sc(V3.nrm(V3.add(model.rca.dir, V3.v(-0.2, -0.1, 0.25))), 7));
  const right = dominance !== "left";
  const leftDom = dominance === "left";
  const co = dominance === "codominant";
  const sp = [];
  const rcaEnd = right ? -172 : -118;
  sp.push({
    name: "RCA",
    fillId: "RCA",
    lesionId: "RCA",
    side: "right",
    nodes: [
      { fixed: model.rca.pos },
      { fixed: rcaRun },
      { ell: -0.97, phi: -50, h: 5 },
      { ell: -0.94, phi: -72, h: 4 },
      { ell: -0.9, phi: -95, h: 3.5 },
      { ell: -0.86, phi: -120, h: 3.5 },
      { ell: -0.86, phi: (-120 + rcaEnd) / 2, h: 3.5 },
      { ell: -0.88, phi: rcaEnd, h: 3.5 }
    ],
    r0: right ? 1.95 : 1.3,
    r1: right ? 1.6 : 0.8
  });
  sp.push({
    name: "CONUS",
    fillId: "CONUS",
    lesionId: "CONUS",
    side: "right",
    nodes: [{ fixed: model.conus.pos }, { ell: -0.99, phi: -18, h: 7 }, { ell: -0.93, phi: 0, h: 5 }, { ell: -0.85, phi: 12, h: 4 }],
    r0: 0.6,
    r1: 0.3
  });
  sp.push({
    name: "RV",
    fillId: "RCA",
    lesionId: null,
    side: "right",
    parent: { name: "RCA", at: 0.28 },
    nodes: [{ ell: -0.92, phi: -55 }, { ell: -0.6, phi: -42 }, { ell: -0.25, phi: -30 }, { ell: 0.05, phi: -24 }],
    r0: 0.75,
    r1: 0.3
  });
  sp.push({
    name: "AM",
    fillId: "AM",
    lesionId: "AM",
    side: "right",
    parent: { name: "RCA", at: 0.5 },
    nodes: [{ ell: -0.82, phi: -98 }, { ell: -0.5, phi: -88 }, { ell: -0.1, phi: -74 }, { ell: 0.3, phi: -62 }],
    r0: 0.95,
    r1: 0.35
  });
  if (right) {
    sp.push({
      name: "PDA",
      fillId: "PDA",
      lesionId: "PDA",
      side: "right",
      parent: { name: "RCA", at: 0.97 },
      nodes: [{ ell: -0.82, phi: -174 }, { ell: -0.55, phi: -177 }, { ell: -0.1, phi: 179 }, { ell: 0.35, phi: 176 }, { ell: 0.7, phi: 172 }],
      r0: 1.05,
      r1: 0.4
    });
    if (!co) {
      sp.push({
        name: "PLV",
        fillId: "PLV",
        lesionId: "PLV",
        side: "right",
        parent: { name: "RCA", at: 1 },
        nodes: [{ ell: -0.82, phi: -172 }, { ell: -0.8, phi: 168 }, { ell: -0.74, phi: 152 }, { ell: -0.5, phi: 142 }, { ell: -0.15, phi: 136 }],
        r0: 1.05,
        r1: 0.45
      });
      sp.push({
        name: "PL2",
        fillId: "PLV",
        lesionId: null,
        side: "right",
        parent: { name: "PLV", at: 0.35 },
        nodes: [{ ell: -0.79, phi: 162 }, { ell: -0.5, phi: 160 }, { ell: -0.15, phi: 158 }],
        r0: 0.7,
        r1: 0.3
      });
    }
  }
  sp.push({
    name: "LM",
    fillId: "LM",
    lesionId: "LM",
    side: "left",
    nodes: [{ fixed: model.lm.pos }, { fixed: B }],
    r0: 2.25,
    r1: 2.1
  });
  sp.push({
    name: "LAD",
    fillId: "LAD",
    lesionId: "LAD",
    side: "left",
    parent: { name: "LM", at: 1 },
    nodes: [
      { fixed: B },
      { ell: -0.9, phi: 18, h: 5 },
      { ell: -0.68, phi: 17, h: 3.5 },
      { ell: -0.4, phi: 12, h: 3 },
      { ell: -0.05, phi: 10, h: 3 },
      { ell: 0.35, phi: 8, h: 3 },
      { ell: 0.72, phi: 5, h: 3 },
      { ell: 0.95, phi: 10, h: 3 },
      { ell: 0.995, phi: 80, h: 2.5 }
    ],
    r0: 1.8,
    r1: 0.45
  });
  const diagonals = [
    ["D1", "D1", 0.16, 1.25, 0.45],
    ["D2", "D2", 0.42, 0.95, 0.4],
    ["D3", null, 0.62, 0.6, 0.3]
  ];
  for (const [name, id, at, r0, r1] of diagonals) {
    const e0 = -0.86 + at * 1.8;
    sp.push({
      name,
      fillId: id ?? "LAD",
      lesionId: id,
      side: "left",
      parent: { name: "LAD", at },
      nodes: [{ ell: e0, phi: 14 }, { ell: e0 + 0.18, phi: 40 }, { ell: e0 + 0.42, phi: 64 }, { ell: Math.min(0.92, e0 + 0.7), phi: 80 }],
      r0,
      r1
    });
  }
  [0.12, 0.24, 0.36, 0.5, 0.64].forEach((at, i) => {
    const e0 = -0.86 + at * 1.8;
    sp.push({
      name: `S${i + 1}`,
      fillId: "SEPTAL",
      lesionId: i === 0 ? "SEPTAL" : null,
      side: "left",
      parent: { name: "LAD", at },
      nodes: [{ ell: e0, phi: 10, h: 2 }, { ell: e0 + 0.12, phi: -6, h: -8 }, { ell: e0 + 0.26, phi: -14, h: -18 }, { ell: e0 + 0.4, phi: -18, h: -26 }],
      r0: 0.75 - i * 0.06,
      r1: 0.25
    });
  });
  const lcxEnd = leftDom ? -174 : co ? 170 : 146;
  sp.push({
    name: "LCx",
    fillId: "LCx",
    lesionId: "LCx",
    side: "left",
    parent: { name: "LM", at: 1 },
    nodes: [
      { fixed: B },
      { ell: -0.95, phi: 70, h: 4 },
      { ell: -0.9, phi: 90, h: 3.5 },
      { ell: -0.87, phi: 116, h: 3.5 },
      { ell: -0.84, phi: 136, h: 3.5 },
      ...leftDom || co ? [{ ell: -0.82, phi: 158, h: 3.5 }] : [],
      { ell: -0.82, phi: lcxEnd, h: 3.5 }
    ],
    r0: 1.7,
    r1: leftDom ? 1.2 : 0.8
  });
  sp.push({
    name: "OM1",
    fillId: "OM1",
    lesionId: "OM1",
    side: "left",
    parent: { name: "LCx", at: leftDom ? 0.18 : 0.28 },
    nodes: [{ ell: -0.9, phi: 84 }, { ell: -0.6, phi: 86 }, { ell: -0.2, phi: 92 }, { ell: 0.22, phi: 96 }, { ell: 0.5, phi: 98 }],
    r0: 1.25,
    r1: 0.4
  });
  sp.push({
    name: "OM2",
    fillId: "OM2",
    lesionId: "OM2",
    side: "left",
    parent: { name: "LCx", at: leftDom ? 0.38 : 0.62 },
    nodes: [{ ell: -0.86, phi: 120 }, { ell: -0.55, phi: 122 }, { ell: -0.15, phi: 126 }, { ell: 0.25, phi: 128 }],
    r0: 1,
    r1: 0.35
  });
  if (leftDom) {
    sp.push({
      name: "PDA",
      fillId: "PDA",
      lesionId: "PDA",
      side: "left",
      parent: { name: "LCx", at: 1 },
      nodes: [{ ell: -0.82, phi: -174 }, { ell: -0.55, phi: -177 }, { ell: -0.1, phi: 179 }, { ell: 0.35, phi: 176 }, { ell: 0.7, phi: 172 }],
      r0: 1,
      r1: 0.4
    });
  }
  if (co || leftDom) {
    sp.push({
      name: "PLV",
      fillId: "PLV",
      lesionId: "PLV",
      side: "left",
      parent: { name: "LCx", at: 0.82 },
      nodes: [{ ell: -0.82, phi: 152 }, { ell: -0.55, phi: 148 }, { ell: -0.2, phi: 142 }],
      r0: 0.9,
      r1: 0.35
    });
  }
  if (variants.includes("ramus")) {
    sp.push({
      name: "RAMUS",
      fillId: "RAMUS",
      lesionId: "RAMUS",
      side: "left",
      parent: { name: "LM", at: 1 },
      nodes: [{ fixed: B }, { ell: -0.75, phi: 50 }, { ell: -0.35, phi: 60 }, { ell: 0.05, phi: 66 }, { ell: 0.35, phi: 70 }],
      r0: 1.2,
      r1: 0.4
    });
  }
  return sp;
}
function lesionRadius(base, param, lesions, totalMm) {
  let r = base;
  for (const l of lesions) {
    const width = l.lengthMm ? l.lengthMm / 2 / Math.max(1, totalMm) : l.kind === "diffuse" ? 0.22 : l.kind === "cto" ? 0.04 : 0.055;
    const d = (param - l.position) / width;
    if (Math.abs(d) < 1) {
      const sev = Math.min(0.99, l.severity / 100);
      const f2 = 0.5 + 0.5 * Math.cos(Math.PI * d);
      r = Math.min(r, base * (1 - sev * f2));
    }
  }
  return r;
}
function buildCoronaryTree(model, c2, scaffolds = []) {
  const H2 = makeHeart(1);
  const specs = specsFor(model, c2.dominance, c2.variants);
  const built = /* @__PURE__ */ new Map();
  const out = [];
  const wig = new Rng("wiggle:" + c2.id);
  for (const s of specs) {
    const samples = sampleVessel(H2, s.nodes);
    const ph1 = wig.next() * 6.28, ph2 = wig.next() * 6.28;
    const amp = s.r0 > 1.5 ? 1.2 : 2.6;
    samples.forEach((sm, i) => {
      if (sm.w < 1) return;
      const t2 = i / Math.max(1, samples.length - 1);
      const env = Math.sin(Math.PI * Math.min(1, t2 * 1.1));
      sm.phi += env * amp * (Math.sin(i * 0.19 + ph1) + 0.45 * Math.sin(i * 0.47 + ph2));
      sm.h += env * 0.5 * Math.sin(i * 0.23 + ph2);
    });
    const len = lengths(H2, samples);
    const total = len[len.length - 1] || 1;
    let offset = 0;
    let parent;
    if (s.parent) {
      const p = built.get(s.parent.name);
      if (p) {
        const idx = Math.min(p.samples.length - 1, Math.round(s.parent.at * (p.samples.length - 1)));
        offset = p.pathMm[idx];
        parent = { name: p.name, index: idx };
      }
    }
    const lesions = s.lesionId ? c2.lesions.filter((l) => l.vessel === s.lesionId) : [];
    const param = len.map((x) => x / total);
    const irr = new Rng("irr:" + c2.id + s.name);
    let drift = 0;
    const stents = s.lesionId ? scaffolds.filter((x) => x.vessel === s.lesionId) : [];
    const radii = param.map((t2) => {
      drift = drift * 0.85 + (irr.next() - 0.5) * 0.06;
      const base = (s.r0 + (s.r1 - s.r0) * Math.pow(t2, 0.85)) * (1 + drift);
      const r = lesionRadius(base, t2, lesions, total);
      const st = stents.find((x) => t2 >= x.from && t2 <= x.to);
      return st ? st.radius * (1 + drift * 0.3) * (r / base) : r;
    });
    const cto = lesions.find((l) => l.kind === "cto" || l.severity >= 99);
    const occludedFrom = cto ? param.findIndex((t2) => t2 >= cto.position) : -1;
    const calcium = [];
    const thrombus = [];
    for (const l of lesions) {
      const i0 = param.findIndex((t2) => t2 >= l.position - 0.08);
      const i1 = param.findIndex((t2) => t2 >= l.position + 0.08);
      const span = [Math.max(0, i0), i1 < 0 ? samples.length - 1 : i1];
      if (l.kind === "calcified" || l.kind === "left-main" || l.kind === "ostial-rca") calcium.push(span);
      if (l.kind === "thrombotic") thrombus.push([Math.max(0, param.findIndex((t2) => t2 >= l.position - 0.03)), Math.max(0, param.findIndex((t2) => t2 >= l.position + 0.03))]);
    }
    const tv = {
      name: s.name,
      fillId: s.fillId,
      lesionId: s.lesionId,
      samples,
      radii,
      pathMm: len.map((x) => x + offset),
      param,
      occludedFrom,
      calcium,
      thrombus,
      side: s.side,
      parent
    };
    built.set(s.name, tv);
    out.push(tv);
  }
  if (c2.lesions.some((l) => l.kind === "cto")) addCollaterals(H2, out, c2.id);
  const rng = new Rng("tree:" + c2.id);
  const hosts = out.filter((v2) => ["RCA", "LAD", "LCx", "OM1", "OM2", "D1", "D2", "AM", "PDA", "PLV"].includes(v2.name));
  for (const host of hosts) {
    const n = host.name === "LAD" || host.name === "RCA" ? 24 : host.name === "LCx" ? 14 : 7;
    for (let i = 0; i < n; i++) {
      const at = 0.12 + rng.next() * 0.8;
      const idx = Math.round(at * (host.samples.length - 1));
      const base = host.samples[idx];
      if (!base || base.fixed) continue;
      const side = rng.next() < 0.5 ? -1 : 1;
      const dl = 0.05 + rng.next() * (rng.next() < 0.3 ? 0.3 : 0.14);
      const nodes = [
        { ell: base.ell, phi: base.phi, h: base.h },
        { ell: Math.min(0.97, base.ell + dl * 0.4), phi: base.phi + side * (10 + rng.next() * 14), h: base.h },
        { ell: Math.min(0.98, base.ell + dl), phi: base.phi + side * (16 + rng.next() * 24), h: base.h - 1 }
      ];
      const samples = sampleVessel(H2, nodes);
      const len = lengths(H2, samples);
      const total = len[len.length - 1] || 1;
      const r0 = Math.max(0.17, Math.min(0.55, host.radii[idx] * (0.14 + rng.next() * 0.24)));
      out.push({
        name: `${host.name}-twig${i}`,
        fillId: host.fillId,
        lesionId: null,
        samples,
        radii: len.map((x) => r0 * (1 - 0.6 * (x / total))),
        pathMm: len.map((x) => x + host.pathMm[idx]),
        param: len.map((x) => x / total),
        occludedFrom: host.occludedFrom >= 0 && idx >= host.occludedFrom ? 0 : -1,
        calcium: [],
        thrombus: [],
        side: host.side,
        parent: { name: host.name, index: idx },
        retro: host.retro && idx >= host.retro.from ? { ...host.retro, from: 0, delayS: host.retro.delayS + 0.4 } : void 0
      });
    }
  }
  return { heart: H2, vessels: out };
}
function addCollaterals(H2, out, id) {
  const occluded = out.find((v2) => v2.occludedFrom > 0 && v2.lesionId);
  if (!occluded) return;
  const donorSide = occluded.side === "left" ? "right" : "left";
  const byName = new Map(out.map((v2) => [v2.name, v2]));
  const recipients = /* @__PURE__ */ new Map([[occluded.name, Math.min(occluded.samples.length - 1, occluded.occludedFrom + 3)]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v2 of out) {
      if (recipients.has(v2.name) || !v2.parent) continue;
      const from = recipients.get(v2.parent.name);
      if (from !== void 0 && v2.parent.index >= from) {
        recipients.set(v2.name, 0);
        grew = true;
      }
    }
  }
  const donors = out.filter((v2) => v2.side === donorSide && v2.name !== "CONUS" && !recipients.has(v2.name));
  if (!donors.length) return;
  const rng = new Rng("collat:" + id);
  const P = (v2, i) => samplePos(H2, v2.samples[i]);
  const anchors = [];
  const oFrom = recipients.get(occluded.name);
  for (const f2 of [0.3, 0.6, 0.85]) anchors.push({ v: occluded, i: Math.round(oFrom + (occluded.samples.length - 1 - oFrom) * f2) });
  const branch2 = [...recipients.keys()].map((n2) => byName.get(n2)).filter((v2) => v2 !== occluded).sort((a, b) => b.radii[0] - a.radii[0])[0];
  if (branch2) anchors.push({ v: branch2, i: Math.round((branch2.samples.length - 1) * 0.6) });
  const entries = /* @__PURE__ */ new Map();
  let n = 0;
  for (const a of anchors) {
    const pa = P(a.v, a.i);
    let best = null;
    for (const d of donors) {
      for (let i = 0; i < d.samples.length; i += 2) {
        if (d.samples[i].fixed) continue;
        const q = P(d, i);
        const dist = Math.hypot(q.x - pa.x, q.y - pa.y, q.z - pa.z);
        if (!best || dist < best.d) best = { v: d, i, d: dist };
      }
    }
    if (!best || best.d > 90) continue;
    const s0 = best.v.samples[best.i];
    const s1 = a.v.samples[a.i];
    let dphi = s1.phi - s0.phi;
    while (dphi > 180) dphi -= 360;
    while (dphi < -180) dphi += 360;
    const steps = Math.max(8, Math.round(best.d / 1.1));
    const depth = best.d > 35 ? 14 : 5;
    const turns = 3 + Math.floor(rng.next() * 4);
    const amp = 2 + rng.next() * 3;
    const ph = rng.next() * 6.28;
    const samples = [];
    for (let k = 0; k <= steps; k++) {
      const t2 = k / steps;
      const env = Math.sin(Math.PI * t2);
      samples.push({
        ell: s0.ell + (s1.ell - s0.ell) * t2 + env * 0.02 * Math.sin(turns * 2 * Math.PI * t2 + ph),
        phi: s0.phi + dphi * t2 + env * amp * Math.sin(turns * 2 * Math.PI * t2),
        h: s0.h + (s1.h - s0.h) * t2 - depth * env,
        w: 1
      });
    }
    const len = lengths(H2, samples);
    const total = len[len.length - 1] || 1;
    out.push({
      name: `collateral${n++}`,
      fillId: best.v.fillId,
      lesionId: null,
      samples,
      radii: len.map((x) => 0.24 + 0.08 * Math.sin(Math.PI * x / total)),
      pathMm: len.map((x) => x + best.v.pathMm[best.i]),
      param: len.map((x) => x / total),
      occludedFrom: -1,
      calcium: [],
      thrombus: [],
      side: best.v.side,
      parent: { name: best.v.name, index: best.i }
    });
    if (!entries.has(a.v.name)) entries.set(a.v.name, a.v.pathMm[a.i]);
  }
  if (!n) return;
  for (const [name, from] of recipients) {
    const v2 = byName.get(name);
    const entry = entries.get(name);
    v2.retro = { side: donorSide, from, entryMm: entry ?? v2.pathMm[from], delayS: entry !== void 0 ? 1.6 : 2.2 };
  }
}

// probe.ts
var c = { id: "audit-right", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
var m = buildAnatomy(c);
var t = buildCoronaryTree(m, c);
var H = t.heart;
var f = (p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
console.log("A", f(H.A), "S", f(H.S), "L", f(H.L), "base", f(H.base), "apex", f({ x: H.base.x + H.L.x * H.len, y: H.base.y + H.L.y * H.len, z: H.base.z + H.L.z * H.len }));
console.log("LM os", f(m.lm.pos), "RCA os", f(m.rca.pos), "conus", f(m.conus.pos));
for (const n of ["LM", "LAD", "LCx", "RCA", "CONUS", "PDA", "S1", "D1", "OM1"]) {
  const v2 = t.vessels.find((x) => x.name === n);
  const pts = v2.samples.map((s) => samplePos(H, s));
  const ys = pts.map((p) => p.y);
  console.log(n, "first", f(pts[0]), "k=4", f(pts[Math.min(4, pts.length - 1)]), "k=10", f(pts[Math.min(10, pts.length - 1)]), "maxY", Math.max(...ys).toFixed(1), "at", ys.indexOf(Math.max(...ys)), "last", f(pts[pts.length - 1]));
}
for (const phi of [0, 45, 90, 135, 180, -135, -90, -45]) console.log("AV groove ell=-0.9 phi", phi, f(surfacePoint(H, -0.9, phi, 3)));
