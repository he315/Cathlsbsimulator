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
var cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});
var length = (a) => Math.sqrt(dot(a, a));
var normalize = (a) => {
  const l = length(a);
  if (l < 1e-9) return V(0, 1, 0);
  return scale(a, 1 / l);
};
var deg2rad = (d) => d * Math.PI / 180;
var rotateZ = (v3, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v3.x * c - v3.y * s, y: v3.x * s + v3.y * c, z: v3.z };
};

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
var toWorld = (model, p) => rotateZ(p, model.aortaTiltRad);
function branch(from, deltas) {
  const pts = [from];
  let cur = from;
  for (const d of deltas) {
    cur = add(cur, d);
    pts.push(cur);
  }
  return pts;
}
function buildAnatomy(c) {
  const R = ROOT_RADIUS[c.rootSize];
  const rot = deg2rad(c.rootRotationDeg);
  const tilt = deg2rad(c.aortaTiltDeg);
  const tiltAz = tilt * 0.35;
  const tiltH = -c.aortaTiltDeg * 0.12;
  const has = (v3) => c.variants.includes(v3);
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
  const leftDominant = c.dominance === "left";
  const coDominant = c.dominance === "codominant";
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
  const rightGivesCrux = c.dominance === "right" || coDominant;
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
    dominance: c.dominance
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
    let t = this.state += 1831565813;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
var cross2 = (p, q) => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
var nrm = (p) => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return v(p.x / l, p.y / l, p.z / l);
};
var V3 = { v, add: add2, sc, dot: dot2, cross: cross2, nrm, sub: (p, q) => v(p.x - q.x, p.y - q.y, p.z - q.z) };
function makeHeart(scale2 = 1) {
  const base = v(20, -4, -24);
  const apex = v(20 + 62 * scale2, -4 - 80 * scale2, -24 + 62 * scale2);
  const L = nrm(V3.sub(apex, base));
  const len = Math.hypot(apex.x - base.x, apex.y - base.y, apex.z - base.z);
  const xHat = v(1, 0, 0);
  const S = nrm(V3.sub(xHat, sc(L, dot2(xHat, L))));
  let A = nrm(cross2(L, S));
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
function surfacePoint(H, ell, phiDeg, h = 2.5, m) {
  const e = m?.contraction ?? 0;
  const u = (ell + 1) / 2;
  const dApex = (1 - u) * H.len * (1 - 0.12 * e);
  const along = H.len - dApex;
  const uM = along / H.len;
  const rho = profile(uM) * (1 - 0.05 * e);
  const phi = (phiDeg + 8 * e * (uM - 0.4)) * Math.PI / 180;
  const c = Math.cos(phi), sn = Math.sin(phi);
  const rA = (c >= 0 ? H.rA : H.rAp) * rho + h;
  const rS = (sn >= 0 ? H.rS : H.rSr) * rho + h;
  const off = add2(sc(H.A, c * rA), sc(H.S, sn * rS));
  return add2(add2(H.base, sc(H.L, along)), off);
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree.ts
var STEP = 1.6;
function catmull(a, b, c, d, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}
function samplePos(H, s, m) {
  const surf = surfacePoint(H, s.ell, s.phi, s.h, m);
  if (!s.fixed || s.w >= 1) return surf;
  if (s.w <= 0) return s.fixed;
  return V3.add(V3.sc(s.fixed, 1 - s.w), V3.sc(surf, s.w));
}
function sampleVessel(H, nodes) {
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
      const t = k / n;
      out.push({ ell: -1, phi: 0, h: 0, fixed: V3.add(V3.sc(p0, 1 - t), V3.sc(p1, t)), w: 0 });
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
      const t = k / 24;
      const a = get(i - 1), b = get(i), c = get(i + 1), d = get(i + 2);
      fine.push({
        ell: Math.min(0.995, catmull(a.ell, b.ell, c.ell, d.ell, t)),
        phi: catmull(a.phi, b.phi, c.phi, d.phi, t),
        h: catmull(a.h, b.h, c.h, d.h, t),
        w: 1
      });
    }
  }
  const lastS = surf[surf.length - 1];
  fine.push({ ell: lastS.ell, phi: lastS.phi, h: lastS.h, w: 1 });
  if (fixedNodes.length) {
    const p0 = fixedNodes[fixedNodes.length - 1];
    const before = fixedNodes.length > 1 ? fixedNodes[fixedNodes.length - 2] : null;
    const p1 = samplePos(H, fine[0]);
    const p2 = samplePos(H, fine[Math.min(fine.length - 1, 6)]);
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
    const t0 = before ? V3.nrm(V3.sub(p0, before)) : V3.nrm(V3.sub(p1, p0));
    const t1 = V3.nrm(V3.sub(p2, p1));
    const n = Math.max(2, Math.round(dist / STEP));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const h00 = 2 * t * t * t - 3 * t * t + 1, h10 = t * t * t - 2 * t * t + t, h01 = -2 * t * t * t + 3 * t * t, h11 = t * t * t - t * t;
      const p = V3.add(V3.add(V3.sc(p0, h00), V3.sc(t0, h10 * dist)), V3.add(V3.sc(p1, h01), V3.sc(t1, h11 * dist)));
      out.push({ ...fine[0], fixed: p, w: t * t * 0.7 });
    }
  }
  let acc = 0;
  let prev = samplePos(H, fine[0]);
  out.push(fine[0]);
  for (let i = 1; i < fine.length; i++) {
    const p = samplePos(H, fine[i]);
    acc += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
    prev = p;
    if (acc >= STEP || i === fine.length - 1) {
      out.push(fine[i]);
      acc = 0;
    }
  }
  return out;
}
function lengths(H, s) {
  const out = [0];
  let prev = samplePos(H, s[0]);
  for (let i = 1; i < s.length; i++) {
    const p = samplePos(H, s[i]);
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
      const f = 0.5 + 0.5 * Math.cos(Math.PI * d);
      r = Math.min(r, base * (1 - sev * f));
    }
  }
  return r;
}
function buildCoronaryTree(model, c, scaffolds = []) {
  const H = makeHeart(1);
  const specs = specsFor(model, c.dominance, c.variants);
  const built = /* @__PURE__ */ new Map();
  const out = [];
  const wig = new Rng("wiggle:" + c.id);
  for (const s of specs) {
    const samples = sampleVessel(H, s.nodes);
    const ph1 = wig.next() * 6.28, ph2 = wig.next() * 6.28;
    const amp = s.r0 > 1.5 ? 1.2 : 2.6;
    samples.forEach((sm, i) => {
      if (sm.w < 1) return;
      const t = i / Math.max(1, samples.length - 1);
      const env = Math.sin(Math.PI * Math.min(1, t * 1.1));
      sm.phi += env * amp * (Math.sin(i * 0.19 + ph1) + 0.45 * Math.sin(i * 0.47 + ph2));
      sm.h += env * 0.5 * Math.sin(i * 0.23 + ph2);
    });
    const len = lengths(H, samples);
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
    const lesions = s.lesionId ? c.lesions.filter((l) => l.vessel === s.lesionId) : [];
    const param = len.map((x) => x / total);
    const irr = new Rng("irr:" + c.id + s.name);
    let drift = 0;
    const stents = s.lesionId ? scaffolds.filter((x) => x.vessel === s.lesionId) : [];
    const radii = param.map((t) => {
      drift = drift * 0.85 + (irr.next() - 0.5) * 0.06;
      const base = (s.r0 + (s.r1 - s.r0) * Math.pow(t, 0.85)) * (1 + drift);
      const r = lesionRadius(base, t, lesions, total);
      const st = stents.find((x) => t >= x.from && t <= x.to);
      return st ? st.radius * (1 + drift * 0.3) * (r / base) : r;
    });
    const cto = lesions.find((l) => l.kind === "cto" || l.severity >= 99);
    const occludedFrom = cto ? param.findIndex((t) => t >= cto.position) : -1;
    const calcium = [];
    const thrombus = [];
    for (const l of lesions) {
      const i0 = param.findIndex((t) => t >= l.position - 0.08);
      const i1 = param.findIndex((t) => t >= l.position + 0.08);
      const span = [Math.max(0, i0), i1 < 0 ? samples.length - 1 : i1];
      if (l.kind === "calcified" || l.kind === "left-main" || l.kind === "ostial-rca") calcium.push(span);
      if (l.kind === "thrombotic") thrombus.push([Math.max(0, param.findIndex((t) => t >= l.position - 0.03)), Math.max(0, param.findIndex((t) => t >= l.position + 0.03))]);
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
  if (c.lesions.some((l) => l.kind === "cto")) addCollaterals(H, out, c.id);
  const rng = new Rng("tree:" + c.id);
  const hosts = out.filter((v3) => ["RCA", "LAD", "LCx", "OM1", "OM2", "D1", "D2", "AM", "PDA", "PLV"].includes(v3.name));
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
      const samples = sampleVessel(H, nodes);
      const len = lengths(H, samples);
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
  return { heart: H, vessels: out };
}
function addCollaterals(H, out, id) {
  const occluded = out.find((v3) => v3.occludedFrom > 0 && v3.lesionId);
  if (!occluded) return;
  const donorSide = occluded.side === "left" ? "right" : "left";
  const byName = new Map(out.map((v3) => [v3.name, v3]));
  const recipients = /* @__PURE__ */ new Map([[occluded.name, Math.min(occluded.samples.length - 1, occluded.occludedFrom + 3)]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v3 of out) {
      if (recipients.has(v3.name) || !v3.parent) continue;
      const from = recipients.get(v3.parent.name);
      if (from !== void 0 && v3.parent.index >= from) {
        recipients.set(v3.name, 0);
        grew = true;
      }
    }
  }
  const donors = out.filter((v3) => v3.side === donorSide && v3.name !== "CONUS" && !recipients.has(v3.name));
  if (!donors.length) return;
  const rng = new Rng("collat:" + id);
  const P = (v3, i) => samplePos(H, v3.samples[i]);
  const anchors = [];
  const oFrom = recipients.get(occluded.name);
  for (const f of [0.3, 0.6, 0.85]) anchors.push({ v: occluded, i: Math.round(oFrom + (occluded.samples.length - 1 - oFrom) * f) });
  const branch2 = [...recipients.keys()].map((n2) => byName.get(n2)).filter((v3) => v3 !== occluded).sort((a, b) => b.radii[0] - a.radii[0])[0];
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
      const t = k / steps;
      const env = Math.sin(Math.PI * t);
      samples.push({
        ell: s0.ell + (s1.ell - s0.ell) * t + env * 0.02 * Math.sin(turns * 2 * Math.PI * t + ph),
        phi: s0.phi + dphi * t + env * amp * Math.sin(turns * 2 * Math.PI * t),
        h: s0.h + (s1.h - s0.h) * t - depth * env,
        w: 1
      });
    }
    const len = lengths(H, samples);
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
    const v3 = byName.get(name);
    const entry = entries.get(name);
    v3.retro = { side: donorSide, from, entryMm: entry ?? v3.pathMm[from], delayS: entry !== void 0 ? 1.6 : 2.2 };
  }
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/projection.ts
function cameraBasis(cArm) {
  const th = deg2rad(cArm.laoRao);
  const ph = deg2rad(cArm.cranialCaudal);
  const n = {
    x: Math.sin(th),
    y: -Math.cos(th) * Math.sin(ph),
    z: Math.cos(th) * Math.cos(ph)
  };
  const forward = normalize({ x: -n.x, y: -n.y, z: -n.z });
  const worldUp = V(0, 1, 0);
  let right = cross(forward, worldUp);
  if (length(right) < 1e-4) right = V(1, 0, 0);
  right = normalize(right);
  const up = normalize(cross(right, forward));
  return { forward, right, up };
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/thorax.ts
var v2 = (x, y, z) => ({ x, y, z });
var I3 = [v2(1, 0, 0), v2(0, 1, 0), v2(0, 0, 1)];

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder.ts
var SOD = 760;
var SID = 1060;
function makeCamera(cArm, iso, field) {
  const b = cameraBasis(cArm);
  const src = V3.add(iso, V3.sc(b.forward, SOD));
  const detC = V3.sub(iso, V3.sc(b.forward, SID - SOD));
  return { src, detC, detU: V3.sc(b.right, field / 2), detV: V3.sc(b.up, field / 2) };
}
var centreCache = /* @__PURE__ */ new WeakMap();
function treeCentre(tree, side = "both") {
  const cache = centreCache.get(tree) ?? /* @__PURE__ */ new Map();
  centreCache.set(tree, cache);
  const hit = cache.get(side);
  if (hit) return hit;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const v3 of tree.vessels) {
    if (v3.name.includes("twig") || v3.name.startsWith("collateral")) continue;
    if (side !== "both" && v3.side !== side) continue;
    for (const s of v3.samples) {
      const p = samplePos(tree.heart, s);
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      z0 = Math.min(z0, p.z);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
      z1 = Math.max(z1, p.z);
    }
  }
  const c = V3.v((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  cache.set(side, c);
  return c;
}

// spectrum.mjs
import fs from "node:fs";
function bands(pts, mmPerPx) {
  const s = mmPerPx;
  const P = pts.map(([x, y]) => [x * s, y * s]);
  const R = [P[0]];
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    let [x0, y0] = P[i - 1];
    const [x1, y1] = P[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (acc + seg >= 1) {
      const t = (1 - acc) / seg;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      R.push([x0, y0]);
      seg = Math.hypot(x1 - x0, y1 - y0);
      acc = 0;
    }
    acc += seg;
  }
  const th = [];
  let prev = null;
  for (let i = 1; i < R.length - 1; i++) {
    let a = Math.atan2(R[i + 1][1] - R[i - 1][1], R[i + 1][0] - R[i - 1][0]);
    if (prev !== null) {
      while (a - prev > Math.PI) a -= 2 * Math.PI;
      while (a - prev < -Math.PI) a += 2 * Math.PI;
    }
    th.push(a);
    prev = a;
  }
  const ma = (x, w) => x.map((_, i) => {
    let s2 = 0, c = 0;
    for (let k = -w; k <= w; k++) if (x[i + k] !== void 0) {
      s2 += x[i + k];
      c++;
    }
    return s2 / c;
  });
  const a1 = ma(th, 1), a4 = ma(th, 4), a10 = ma(th, 10), a30 = ma(th, 30);
  const rms = (a, b) => {
    let s2 = 0, n = 0;
    for (let i = 30; i < th.length - 30; i++) {
      s2 += (a[i] - b[i]) ** 2;
      n++;
    }
    return n ? Math.sqrt(s2 / n) * 180 / Math.PI : null;
  };
  return { n: th.length, b3_8: rms(a1, a4), b8_20: rms(a4, a10), b20_60: rms(a10, a30) };
}
if ((process.argv[1] || "").endsWith("spectrum.mjs")) {
  const out = {};
  for (const f of fs.readdirSync("traces").filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync("traces/" + f, "utf8"));
    const b = bands(d.path, d.mmPerPx);
    out[d.label] = b;
    console.log(d.label, JSON.stringify(Object.fromEntries(Object.entries(b).map(([k, v3]) => [k, typeof v3 === "number" ? +v3.toFixed(1) : v3]))));
  }
}

// simspec.ts
var SID2 = 1060;
var SOD2 = 760;
for (const [k, lr, cc, side, vessel] of [["LAD_RAOcra_true", -30, -25, "left", "LAD"], ["RCA_LAO", 28, 0, "right", "RCA"]]) {
  for (let seed = 0; seed < 3; seed++) {
    const c = { id: "sp" + seed, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
    const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
    const v3 = tree.vessels.find((x) => x.name === vessel);
    const pts = v3.samples.map((s) => {
      const p = toWorld(model, samplePos(tree.heart, s));
      const d = V3.sub(p, cam.src);
      const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n);
      const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC);
      return [V3.dot(q, u) / (SID2 / SOD2), -V3.dot(q, w) / (SID2 / SOD2)];
    });
    const b = bands(pts, 1);
    console.log("SIM", k, seed, JSON.stringify(Object.fromEntries(Object.entries(b).map(([kk, vv]) => [kk, typeof vv === "number" ? +vv.toFixed(1) : vv]))));
  }
}
