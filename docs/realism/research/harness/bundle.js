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
  const c2 = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v3.x * c2 - v3.y * s, y: v3.x * s + v3.y * c2, z: v3.z };
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
var toWorld = (model2, p) => rotateZ(p, model2.aortaTiltRad);
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
  const has = (v3) => c2.variants.includes(v3);
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
var uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/caseGenerator.ts
function recommendedLeft(rootSize, variants, access) {
  const radial3 = access !== "femoral";
  if (variants.includes("horizontal-aorta")) return ["AL1", "JL4"];
  if (rootSize === "small") return radial3 ? ["JL3.5", "TIG"] : ["JL3.5"];
  if (rootSize === "dilated") return ["JL4.5", "JL5"];
  return radial3 ? ["JL4", "TIG"] : ["JL4"];
}
function recommendedRight(variants, access) {
  const radial3 = access !== "femoral";
  if (variants.includes("high-rca") || variants.includes("superior-rca") || variants.includes("shepherds-crook-rca") || variants.includes("anterior-rca"))
    return ["AR", "JR4"];
  return radial3 ? ["JR4", "IKR", "TIG"] : ["JR4"];
}
function requiredViewsFor(focus) {
  const left2 = ["spider", "raocranial", "laocranial", "raocaudal"];
  const right2 = ["rcalao", "rcarao"];
  if (focus === "left") return left2;
  if (focus === "right") return right2;
  return [...left2.slice(0, 3), ...right2];
}
function trapsFor(p) {
  const traps = [];
  if (p.rootSize === "dilated" && p.focus !== "right")
    traps.push("A small left catheter will fall short and inject the root.");
  if (p.rootSize === "small")
    traps.push("An over-sized catheter will cram the cusp and prolapse toward the LV.");
  if (p.variants.includes("high-rca") || p.variants.includes("superior-rca"))
    traps.push("The RCA take-off is high \u2014 pushing a JR4 forward drops you into the LV.");
  if (p.variants.includes("anterior-rca"))
    traps.push("The RCA is anterior \u2014 extra clockwise torque is needed to face the ostium.");
  if (p.variants.includes("rotated-root"))
    traps.push("The root is rotated \u2014 the catheter's natural tip position is off; torque to compensate.");
  if (p.variants.includes("horizontal-aorta"))
    traps.push("Horizontal aorta \u2014 a Judkins may not seat; an Amplatz shape reaches the cusp.");
  if (p.pathology === "left-main")
    traps.push("Left main disease \u2014 avoid deep engagement and damping; keep the pressure clean.");
  if (p.pathology === "ostial-rca")
    traps.push("Ostial RCA disease \u2014 gentle, non-deep engagement; watch for damping.");
  traps.push("Confirm a clean aortic pressure before every injection.");
  return traps;
}
function lesionsFor(pathology, rng) {
  const mk = (vessel, position, severity) => ({
    vessel,
    position,
    severity,
    kind: pathology
  });
  switch (pathology) {
    case "none":
      return [];
    case "mild-irregularity":
      return [mk("LAD", 0.4, rng.int(20, 35)), mk("RCA", 0.5, rng.int(20, 30))];
    case "moderate-stenosis":
      return [mk("LAD", 0.45, rng.int(50, 68))];
    case "severe-stenosis":
      return [mk(rng.pick(["LAD", "LCx", "RCA"]), 0.5, rng.int(75, 90))];
    case "critical-lad":
      return [mk("LAD", 0.22, rng.int(90, 98))];
    case "left-main":
      return [mk("LM", 0.6, rng.int(60, 85))];
    case "ostial-rca":
      return [mk("RCA", 0.03, rng.int(70, 90))];
    case "mid-rca":
      return [mk("RCA", 0.5, rng.int(70, 90))];
    case "lcx-om":
      return [mk("LCx", 0.4, rng.int(70, 88)), mk("OM1", 0.3, rng.int(50, 70))];
    case "diffuse":
      return [
        mk("LAD", 0.3, rng.int(40, 60)),
        mk("LAD", 0.6, rng.int(45, 65)),
        mk("RCA", 0.5, rng.int(40, 60))
      ];
    case "cto":
      return [mk("RCA", 0.35, 100)];
    case "thrombotic":
      return [mk("LAD", 0.25, rng.int(92, 100))];
    case "calcified":
      return [mk("RCA", 0.45, rng.int(60, 80))];
    case "spasm":
      return [mk("RCA", 0.4, rng.int(50, 80))];
    default:
      return [];
  }
}
function teachingSummary(p) {
  const bits = [];
  bits.push(
    `${p.rootSize[0].toUpperCase()}${p.rootSize.slice(1)} aortic root, ${p.dominance} dominant, ${p.access.replace("-", " ")} access.`
  );
  if (p.variants.length) bits.push(`Variants: ${p.variants.join(", ")}.`);
  if (p.pathology !== "none") bits.push(`Pathology: ${p.pathology.replace("-", " ")}.`);
  bits.push(
    p.focus === "left" ? "Goal: safe selective left coronary angiography with diagnostic views of the LAD and LCx." : p.focus === "right" ? "Goal: safe selective RCA angiography with LAO and RAO working views." : "Goal: a complete, safe diagnostic study of both coronary systems."
  );
  return bits.join(" ");
}
function buildCase(p, id) {
  const seed = id ?? uid();
  const rng = new Rng(seed + p.name);
  const rec = p.focus === "left" ? recommendedLeft(p.rootSize, p.variants, p.access) : p.focus === "right" ? recommendedRight(p.variants, p.access) : [...recommendedLeft(p.rootSize, p.variants, p.access).slice(0, 1), ...recommendedRight(p.variants, p.access).slice(0, 1)];
  const acceptable = Array.from(
    /* @__PURE__ */ new Set([
      ...rec,
      ...recommendedLeft(p.rootSize, p.variants, p.access),
      ...recommendedRight(p.variants, p.access),
      "TIG"
    ])
  );
  return {
    id: seed,
    name: p.name,
    difficulty: p.difficulty,
    accessRoute: p.access,
    rootSize: p.rootSize,
    rootRotationDeg: p.rootRotationDeg,
    aortaTiltDeg: p.aortaTiltDeg,
    dominance: p.dominance,
    variants: p.variants,
    pathology: p.pathology,
    lesions: lesionsFor(p.pathology, rng),
    recommendedCatheters: rec,
    acceptableCatheters: acceptable,
    requiredViews: requiredViewsFor(p.focus),
    traps: trapsFor(p),
    objectives: p.objectives,
    teachingSummary: teachingSummary(p)
  };
}
var TEMPLATES = [
  { key: "easy-left", name: "Routine left coronary", base: { difficulty: 1, access: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 5, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "left", objectives: ["Engage the left main coaxially with a JL4", "Obtain diagnostic LAD and LCx views"] } },
  { key: "easy-rca", name: "Routine RCA", base: { difficulty: 1, access: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 5, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "right", objectives: ["Engage the RCA with torque and gentle withdrawal", "Obtain LAO and RAO RCA views"] } },
  { key: "complete-normal", name: "Complete normal study", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Complete both coronary systems safely", "Keep contrast and fluoro efficient"] } },
  { key: "small-root", name: "Small root \u2014 JL3.5", base: { difficulty: 2, access: "femoral", rootSize: "small", rootRotationDeg: 0, aortaTiltDeg: 4, dominance: "right", variants: ["small-root"], pathology: "none", focus: "left", objectives: ["Select JL3.5 for the small root", "Avoid deep engagement and prolapse"] } },
  { key: "large-root", name: "Dilated root \u2014 JL5", base: { difficulty: 3, access: "femoral", rootSize: "dilated", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["dilated-root"], pathology: "none", focus: "left", objectives: ["Recognise the dilated root", "Step up to JL4.5/JL5 to reach the left main"] } },
  { key: "rca-difficult", name: "Difficult RCA take-off", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 8, aortaTiltDeg: 8, dominance: "right", variants: ["anterior-rca"], pathology: "none", focus: "right", objectives: ["Use extra clockwise torque for the anterior ostium", "Avoid dropping into the LV"] } },
  { key: "high-rca", name: "High anterior RCA", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["high-rca", "anterior-rca"], pathology: "none", focus: "right", objectives: ["Reach the high anterior ostium", "Switch to an Amplatz Right if JR4 fails"] } },
  { key: "dilated-root-both", name: "Dilated root \u2014 full study", base: { difficulty: 4, access: "femoral", rootSize: "dilated", rootRotationDeg: 10, aortaTiltDeg: 14, dominance: "right", variants: ["dilated-root"], pathology: "mild-irregularity", focus: "both", objectives: ["Match catheters to the dilated root", "Complete a safe study"] } },
  { key: "horizontal-aorta", name: "Horizontal aorta", base: { difficulty: 4, access: "femoral", rootSize: "dilated", rootRotationDeg: 8, aortaTiltDeg: 32, dominance: "right", variants: ["horizontal-aorta", "dilated-root"], pathology: "none", focus: "left", objectives: ["Recognise the horizontal aorta", "Use an Amplatz shape to reach the left main"] } },
  { key: "tortuous-radial", name: "Tortuous radial route", base: { difficulty: 4, access: "radial-right", rootSize: "normal", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["radial-loop", "tortuous-subclavian"], pathology: "none", focus: "both", objectives: ["Navigate the radial loop with a hydrophilic wire", "Complete the study with a TIG"] } },
  { key: "femoral-easy", name: "Femoral \u2014 easy control", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 2, aortaTiltDeg: 6, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Use stable femoral catheter control", "Obtain a full diagnostic set"] } },
  { key: "radial-tig", name: "Radial \u2014 TIG universal", base: { difficulty: 3, access: "radial-left", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Engage both coronaries with one TIG", "Confirm which vessel before each injection"] } },
  { key: "lm-deep", name: "Left main deep-engagement risk", base: { difficulty: 4, access: "femoral", rootSize: "small", rootRotationDeg: 4, aortaTiltDeg: 6, dominance: "right", variants: ["small-root", "short-lm"], pathology: "none", focus: "left", objectives: ["Avoid deep left main engagement", "Recognise damping and withdraw"] } },
  { key: "rca-damping", name: "RCA damping risk", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "ostial-rca", focus: "right", objectives: ["Engage without damping the ostial RCA", "Read the pressure before injecting"] } },
  { key: "nonselective-trap", name: "Non-selective injection trap", base: { difficulty: 3, access: "femoral", rootSize: "dilated", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["dilated-root"], pathology: "none", focus: "left", objectives: ["Resist injecting a non-selective root puff", "Seat selectively first"] } },
  { key: "lv-entry-trap", name: "LV entry trap", base: { difficulty: 3, access: "femoral", rootSize: "small", rootRotationDeg: 4, aortaTiltDeg: 6, dominance: "right", variants: ["small-root"], pathology: "none", focus: "left", objectives: ["Do not push below the valve plane", "Recover from LV entry by withdrawing"] } },
  { key: "short-lm", name: "Short left main", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["short-lm"], pathology: "none", focus: "left", objectives: ["Handle a short LM without deep engagement", "Separate LAD and LCx with the spider view"] } },
  { key: "separate-ostia", name: "Separate LAD/LCx ostia", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["separate-ostia"], pathology: "none", focus: "left", objectives: ["Recognise the absent left main", "Engage the LAD and LCx ostia separately"] } },
  { key: "left-dominant", name: "Left dominant system", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "left", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Recognise left dominance (PDA from LCx)", "Image the dominant circumflex fully"] } },
  { key: "right-dominant", name: "Right dominant system", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 2, aortaTiltDeg: 6, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Confirm right dominance", "Image the crux and PDA in the RCA cranial view"] } },
  { key: "ramus", name: "Ramus intermedius", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["ramus"], pathology: "none", focus: "left", objectives: ["Identify the ramus intermedius", "Do not mistake it for a high diagonal"] } },
  { key: "prox-lad", name: "Proximal LAD lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "critical-lad", focus: "left", objectives: ["Demonstrate the proximal LAD lesion", "Choose views that avoid foreshortening it"] } },
  { key: "lcx-lesion", name: "Circumflex / OM lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "lcx-om", focus: "left", objectives: ["Lay out the LCx and OMs in RAO caudal", "Grade the lesion severity"] } },
  { key: "rca-lesion", name: "Mid RCA lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "mid-rca", focus: "right", objectives: ["Demonstrate the mid RCA lesion", "Elongate it in the RAO view"] } },
  { key: "left-main-lesion", name: "Left main disease recognition", base: { difficulty: 5, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "left-main", focus: "left", objectives: ["Recognise left main disease safely", "Avoid deep engagement; keep pressure clean"] } }
];
function variationName(base, i) {
  return i === 0 ? base : `${base} \u2014 variant ${i + 1}`;
}
var CASE_LIBRARY = (() => {
  const out = [];
  TEMPLATES.forEach((tpl) => {
    for (let i = 0; i < 4; i++) {
      const rng = new Rng(tpl.key + ":" + i);
      const p = {
        ...tpl.base,
        name: variationName(tpl.name, i),
        rootRotationDeg: tpl.base.rootRotationDeg + rng.int(-8, 12),
        aortaTiltDeg: Math.max(0, tpl.base.aortaTiltDeg + rng.int(-4, 8))
      };
      out.push(buildCase(p, `${tpl.key}-${i}`));
    }
  });
  return out;
})();

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
  const len2 = Math.hypot(apex.x - base.x, apex.y - base.y, apex.z - base.z);
  const xHat = v(1, 0, 0);
  const S = nrm(V3.sub(xHat, sc(L, dot2(xHat, L))));
  let A = nrm(cross2(L, S));
  if (A.z < 0) A = sc(A, -1);
  return {
    base,
    len: len2,
    L,
    A,
    S,
    rA: 50 * scale2,
    rAp: 44 * scale2,
    rS: 52 * scale2,
    rSr: 64 * scale2,
    centre: add2(base, sc(L, len2 * 0.45)),
    a: len2 / 2
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
  const c2 = Math.cos(phi), sn = Math.sin(phi);
  const rA = (c2 >= 0 ? H.rA : H.rAp) * rho + h;
  const rS = (sn >= 0 ? H.rS : H.rSr) * rho + h;
  const off = add2(sc(H.A, c2 * rA), sc(H.S, sn * rS));
  return add2(add2(H.base, sc(H.L, along)), off);
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree.ts
var STEP = 1.6;
function catmull(a, b, c2, d, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
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
      const a = get(i - 1), b = get(i), c2 = get(i + 1), d = get(i + 2);
      fine.push({
        ell: Math.min(0.995, catmull(a.ell, b.ell, c2.ell, d.ell, t)),
        phi: catmull(a.phi, b.phi, c2.phi, d.phi, t),
        h: catmull(a.h, b.h, c2.h, d.h, t),
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
function specsFor(model2, dominance, variants) {
  const lmLong = variants.includes("long-lm");
  const lmShort = variants.includes("short-lm") || variants.includes("separate-ostia");
  const lmLen = lmLong ? 16 : lmShort ? 4 : 10;
  const lmDir = V3.nrm(V3.add(model2.lm.dir, V3.v(0.15, -0.05, 0.2)));
  const B = V3.add(model2.lm.pos, V3.sc(lmDir, lmLen));
  const rcaRun = V3.add(model2.rca.pos, V3.sc(V3.nrm(V3.add(model2.rca.dir, V3.v(-0.2, -0.1, 0.25))), 7));
  const right2 = dominance !== "left";
  const leftDom = dominance === "left";
  const co = dominance === "codominant";
  const sp = [];
  const rcaEnd = right2 ? -172 : -118;
  sp.push({
    name: "RCA",
    fillId: "RCA",
    lesionId: "RCA",
    side: "right",
    nodes: [
      { fixed: model2.rca.pos },
      { fixed: rcaRun },
      { ell: -0.97, phi: -50, h: 5 },
      { ell: -0.94, phi: -72, h: 4 },
      { ell: -0.9, phi: -95, h: 3.5 },
      { ell: -0.86, phi: -120, h: 3.5 },
      { ell: -0.86, phi: (-120 + rcaEnd) / 2, h: 3.5 },
      { ell: -0.88, phi: rcaEnd, h: 3.5 }
    ],
    r0: right2 ? 1.95 : 1.3,
    r1: right2 ? 1.6 : 0.8
  });
  sp.push({
    name: "CONUS",
    fillId: "CONUS",
    lesionId: "CONUS",
    side: "right",
    nodes: [{ fixed: model2.conus.pos }, { ell: -0.99, phi: -18, h: 7 }, { ell: -0.93, phi: 0, h: 5 }, { ell: -0.85, phi: 12, h: 4 }],
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
  if (right2) {
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
    nodes: [{ fixed: model2.lm.pos }, { fixed: B }],
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
function buildCoronaryTree(model2, c2, scaffolds = []) {
  const H = makeHeart(1);
  const specs = specsFor(model2, c2.dominance, c2.variants);
  const built = /* @__PURE__ */ new Map();
  const out = [];
  const wig = new Rng("wiggle:" + c2.id);
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
    const len2 = lengths(H, samples);
    const total = len2[len2.length - 1] || 1;
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
    const param = len2.map((x) => x / total);
    const irr = new Rng("irr:" + c2.id + s.name);
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
      pathMm: len2.map((x) => x + offset),
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
  if (c2.lesions.some((l) => l.kind === "cto")) addCollaterals(H, out, c2.id);
  const rng = new Rng("tree:" + c2.id);
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
      const len2 = lengths(H, samples);
      const total = len2[len2.length - 1] || 1;
      const r0 = Math.max(0.17, Math.min(0.55, host.radii[idx] * (0.14 + rng.next() * 0.24)));
      out.push({
        name: `${host.name}-twig${i}`,
        fillId: host.fillId,
        lesionId: null,
        samples,
        radii: len2.map((x) => r0 * (1 - 0.6 * (x / total))),
        pathMm: len2.map((x) => x + host.pathMm[idx]),
        param: len2.map((x) => x / total),
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
    const len2 = lengths(H, samples);
    const total = len2[len2.length - 1] || 1;
    out.push({
      name: `collateral${n++}`,
      fillId: best.v.fillId,
      lesionId: null,
      samples,
      radii: len2.map((x) => 0.24 + 0.08 * Math.sin(Math.PI * x / total)),
      pathMm: len2.map((x) => x + best.v.pathMm[best.i]),
      param: len2.map((x) => x / total),
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
  let right2 = cross(forward, worldUp);
  if (length(right2) < 1e-4) right2 = V(1, 0, 0);
  right2 = normalize(right2);
  const up = normalize(cross(right2, forward));
  return { forward, right: right2, up };
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
var ANAT_COUNT = 19;
var CARVE = [11, 4, 5, 12, 13, 14, 15, 16, 17, 6, 18];
var DIAPHRAGM_DESCENT = 32;
var v2 = (x, y, z) => ({ x, y, z });
var I3 = [v2(1, 0, 0), v2(0, 1, 0), v2(0, 0, 1)];
var add3 = (a, b) => v2(a.x + b.x, a.y + b.y, a.z + b.z);
var sc2 = (a, k) => v2(a.x * k, a.y * k, a.z * k);
var nrm2 = (a) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v2(a.x / l, a.y / l, a.z / l);
};
var cross3 = (p, q) => v2(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
function axesFrom(a, hint) {
  const x = nrm2(a);
  const z = nrm2(cross3(x, hint));
  const y = nrm2(cross3(z, x));
  return [x, y, z];
}
function buildThorax(o) {
  const k = o.habitus ?? 1;
  const r = o.resp;
  const hs = o.heartShift ?? v2(0, 0, 0);
  const H = o.heart;
  const anat = [];
  anat[ANAT.BODY] = { type: 1, c: v2(0, -40, -38), ax: I3, half: [176 * k, 320, 114 * k] };
  anat[ANAT.LUNG_R] = { type: 0, c: v2(-86 * k, 28 - 14 * r, -44), ax: I3, half: [56 * k, 136 + 18 * r, 86 * k] };
  anat[ANAT.LUNG_L] = { type: 0, c: v2(96 * k, 16 - 16 * r, -58), ax: I3, half: [48 * k, 134 + 20 * r, 74 * k] };
  const hc = add3(add3(H.base, sc2(H.L, H.len * 0.44)), hs);
  anat[ANAT.HEART] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [H.len * 0.6, (H.rA + H.rAp) * 0.5 + 4, (H.rS + H.rSr) * 0.5 + 4] };
  anat[ANAT.HEART_FAT] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [H.len * 0.6 + 10, (H.rA + H.rAp) * 0.5 + 20, (H.rS + H.rSr) * 0.5 + 20] };
  anat[ANAT.RA] = { type: 0, c: add3(v2(-40, -12, -6), sc2(hs, 0.8)), ax: I3, half: [30, 40, 32] };
  anat[ANAT.MEDIA] = { type: 0, c: add3(v2(4, 36, -26), sc2(hs, 0.4)), ax: I3, half: [40, 85, 46] };
  anat[ANAT.POST_MEDIA] = { type: 0, c: v2(22, -36, -84), ax: I3, half: [56, 150, 38] };
  anat[ANAT.LA] = { type: 0, c: add3(v2(12, -8, -48), sc2(hs, 0.6)), ax: I3, half: [40, 25, 27] };
  anat[ANAT.PA_TRUNK] = { type: 0, c: add3(v2(24, 30, 14), sc2(hs, 0.4)), ax: axesFrom(v2(0.35, 1, -0.45), v2(1, 0, 0)), half: [34, 15, 15] };
  anat[ANAT.AORTIC_KNOB] = { type: 0, c: add3(v2(10, 92, -32), sc2(hs, 0.2)), ax: I3, half: [24, 17, 28] };
  anat[ANAT.RVOT] = { type: 0, c: add3(v2(8, -6, 26), sc2(hs, 0.9)), ax: I3, half: [32, 30, 22] };
  anat[ANAT.SVC] = { type: 1, c: add3(v2(-30, 62, -10), sc2(hs, 0.3)), ax: I3, half: [11, 46, 11] };
  const dd = DIAPHRAGM_DESCENT * r;
  anat[ANAT.LIVER] = { type: 0, c: v2(-62 * k, -160 - dd, -12), ax: I3, half: [125 * k, 92, 125 * k] };
  anat[ANAT.LEFT_DOME] = { type: 0, c: v2(58 * k, -176 - dd, -14), ax: I3, half: [112 * k, 92, 122 * k] };
  anat[ANAT.STOMACH] = { type: 0, c: v2(74 * k, -116 - dd, -48), ax: I3, half: [26, 12, 22] };
  anat[ANAT.TRACHEA] = { type: 1, c: v2(-4, 150, -42), ax: I3, half: [9, 72, 9] };
  const carina = v2(-4, 78, -44);
  const br = (end, rad) => {
    const mid = sc2(add3(carina, end), 0.5);
    const d = add3(end, sc2(carina, -1));
    const len2 = Math.hypot(d.x, d.y, d.z);
    const [ax0, ax1, ax2] = axesFrom(d, v2(1, 0, 0));
    return { type: 1, c: mid, ax: [ax1, ax0, ax2], half: [rad, len2 / 2, rad] };
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
    const c2 = v2(spineX, y, spineZ + 4 * Math.sin(t * Math.PI));
    bones.push({ type: 1, c: c2, ax: I3, half: [rx, height / 2, rz], mu: MU.cortical });
    bones.push({ type: 1, c: c2, ax: I3, half: [rx - 1.6, height / 2 - 1.4, rz - 1.6], mu: MU.cancellous - MU.cortical });
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
    for (let th = 18; th <= thetaEnd; th += 4) {
      const a = th * Math.PI / 180;
      const f = (th - 18) / (thetaEnd - 18);
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
      for (let i = 0; i <= 6; i++) cart.push(add3(sc2(last, 1 - i / 6), sc2(st, i / 6)));
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
  const grow = (start, dir, len2, rad, depth, side) => {
    const pts = [start];
    const radii = [rad];
    let p = start;
    let d = nrm2(dir);
    const steps = Math.max(3, Math.round(len2 / 6));
    for (let i = 1; i <= steps; i++) {
      d = nrm2(add3(d, v2((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25 - 0.04, (rnd() - 0.5) * 0.25)));
      p = add3(p, sc2(d, len2 / steps));
      const lc = side < 0 ? v2(-80, 20 - 15 * resp, -42) : v2(84, 10 - 15 * resp, -46);
      const q = v2((p.x - lc.x) / 62, (p.y - lc.y) / 130, (p.z - lc.z) / 82);
      if (q.x * q.x + q.y * q.y + q.z * q.z > 0.85) d = nrm2(add3(d, sc2(nrm2(add3(lc, sc2(p, -1))), 0.6)));
      pts.push(p);
      radii.push(rad * (1 - 0.35 * (i / steps)));
    }
    out.push({ pts, r: radii, mu: [LUNG_VESSEL_MU, 0, 0] });
    if (depth <= 0 || rad < 0.45) return;
    const nChild = depth > 3 ? 2 : rnd() < 0.7 ? 2 : 3;
    for (let c2 = 0; c2 < nChild; c2++) {
      const spread = 0.45 + rnd() * 0.5;
      const nd = nrm2(add3(d, v2((rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 1.4)));
      grow(p, nd, len2 * (0.62 + rnd() * 0.18), rad * 0.68, depth - 1, side);
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
function aorticCourse(route, yTop) {
  if (route === "femoral") {
    return [v2(18, -330, -92), v2(22, -240, -88), v2(24, -120, -84), v2(24, 0, -78), v2(22, 55, -70), v2(16, 88, -52), v2(8, 100, -28), v2(2, 94, -10), v2(0, 80, -3), v2(0, yTop, 0)];
  }
  if (route === "radial-left") {
    return [v2(150, 150, -40), v2(95, 128, -48), v2(42, 108, -46), v2(14, 100, -30), v2(4, 90, -12), v2(0, 78, -4), v2(0, yTop, 0)];
  }
  return [v2(-160, 150, -25), v2(-100, 132, -18), v2(-45, 112, -10), v2(-18, 96, -4), v2(-6, 82, -1), v2(0, yTop, 0)];
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder.ts
var SOD = 760;
var SID = 1060;
function makeCamera(cArm, iso, field) {
  const b = cameraBasis(cArm);
  const src = V3.add(iso, V3.sc(b.forward, SOD));
  const detC = V3.sub(iso, V3.sc(b.forward, SID - SOD));
  return { src, detC, detU: V3.sc(b.right, field / 2), detV: V3.sc(b.up, field / 2) };
}
function contraction(phase) {
  const q = (phase % 1 + 1) % 1;
  if (q < 0.08) return 0;
  if (q < 0.38) return Math.sin((q - 0.08) / 0.3 * Math.PI * 0.5);
  if (q < 0.55) return Math.cos((q - 0.38) / 0.17 * Math.PI * 0.5);
  return 0;
}
function flowFactor(phase) {
  const q = (phase % 1 + 1) % 1;
  return q > 0.1 && q < 0.42 ? 0.45 : 1.35;
}
function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function resample(pts, step) {
  if (pts.length < 2) return pts;
  const out = [];
  const get = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = get(i - 1), b = get(i), c2 = get(i + 1), d = get(i + 2);
    const seg = Math.hypot(c2.x - b.x, c2.y - b.y, c2.z - b.z);
    const n = Math.max(1, Math.ceil(seg / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (p, q, r, s) => 0.5 * (2 * q + (-p + r) * t + (2 * p - 5 * q + 4 * r - s) * t2 + (-p + 3 * q - 3 * r + s) * t3);
      out.push({ x: f(a.x, b.x, c2.x, d.x), y: f(a.y, b.y, c2.y, d.y), z: f(a.z, b.z, c2.z, d.z) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
var centreCache = /* @__PURE__ */ new WeakMap();
function treeCentre(tree2, side = "both") {
  const cache = centreCache.get(tree2) ?? /* @__PURE__ */ new Map();
  centreCache.set(tree2, cache);
  const hit = cache.get(side);
  if (hit) return hit;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const v3 of tree2.vessels) {
    if (v3.name.includes("twig") || v3.name.startsWith("collateral")) continue;
    if (side !== "both" && v3.side !== side) continue;
    for (const s of v3.samples) {
      const p = samplePos(tree2.heart, s);
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      z0 = Math.min(z0, p.z);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
      z1 = Math.max(z1, p.z);
    }
  }
  const c2 = V3.v((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  cache.set(side, c2);
  return c2;
}
function buildXrayScene(inp) {
  const hr = inp.heartRate ?? 72;
  const beatPhase = inp.t * hr / 60;
  const e = contraction(beatPhase);
  const resp = inp.breathHold ?? 0.22 * (0.5 - 0.5 * Math.cos(2 * Math.PI * inp.t / 4.3));
  const H = inp.tree.heart;
  const heartShift = V3.v(0, -0.85 * DIAPHRAGM_DESCENT * resp, 3 * resp);
  const thorax = buildThorax({ resp, heart: H, heartShift });
  const moveWorld = (p, weight) => toWorld(inp.model, V3.add(p, V3.sc(heartShift, weight)));
  const rootW = 0.45;
  const tubes = [...thorax.tubes];
  const bones = [...thorax.bones];
  const b = inp.bolus;
  const filled = new Set(b?.filled ?? []);
  const injecting = !!b && b.t < b.injectDur;
  const velocity = 115 * (inp.flowScale ?? 1);
  for (const v3 of inp.tree.vessels) {
    const pts = v3.samples.map((s) => {
      const p = samplePos(H, s, { contraction: e });
      return moveWorld(p, rootW + (1 - rootW) * s.w);
    });
    const opac = b && filled.has(v3.fillId);
    const retro = b && v3.retro && b.side === v3.retro.side ? v3.retro : null;
    const muArr = [];
    for (let i = 0; i < pts.length; i++) {
      let conc = 0;
      if (opac && b) {
        let dist = v3.pathMm[i];
        for (const les of inp.caseData.lesions) {
          if (les.vessel !== v3.lesionId || v3.param[i] <= les.position) continue;
          const sev = Math.min(0.995, les.severity / 100);
          const slow = 1 + 30 * Math.pow(Math.max(0, sev - 0.85), 2) + (sev >= 0.99 ? 1.5 : 0);
          const at = v3.pathMm[Math.max(0, v3.param.findIndex((q) => q >= les.position))];
          dist += (slow - 1) * (v3.pathMm[i] - at);
        }
        const front = velocity * b.t * (0.85 + 0.3 * flowFactor(beatPhase));
        const washT = Math.max(0, b.t - b.injectDur - 0.25);
        const tail = velocity * 0.9 * washT;
        conc = 350 * (0.55 + 0.35 * b.peak) * smooth(-10, 6, front - dist) * (washT > 0 ? 1 - smooth(0, 30, tail - dist) : 1);
        if (v3.occludedFrom >= 0 && i >= v3.occludedFrom) conc = 0;
        for (const [a, z] of v3.thrombus) if (i >= a && i <= z) conc *= 0.35 + 0.25 * Math.sin(i * 2.1);
      }
      if (retro && b && i >= retro.from) {
        const arrive = retro.delayS + Math.abs(v3.pathMm[i] - retro.entryMm) / 30;
        const wash = b.injectDur + retro.delayS + 2.2;
        conc = Math.max(conc, 350 * 0.3 * b.peak * smooth(arrive, arrive + 0.8, b.t) * (1 - smooth(wash, wash + 1.5, b.t)));
      }
      muArr.push([0, MU.iodinePerMg * conc, 0]);
    }
    if (opac || retro) tubes.push({ pts, r: v3.radii, mu: muArr });
    for (const [a, z] of v3.calcium) {
      const seg = pts.slice(a, z + 1);
      if (seg.length < 2) continue;
      const rr = v3.radii.slice(a, z + 1);
      tubes.push({ pts: seg, r: rr.map((r) => r + 0.9), mu: [0.055, 0, 0] });
      tubes.push({ pts: seg, r: rr.map((r) => r + 0.25), mu: [-0.055, 0, 0] });
    }
  }
  if (b && (b.plume !== "none" || b.lv)) {
    const level = b.plume === "root" ? 0.55 : b.plume === "reflux" ? 0.3 : 0;
    const fade = 1 - smooth(b.injectDur, b.injectDur + 1.6, b.t);
    const muI = MU.iodinePerMg * 350 * level * fade * smooth(0, 0.25, b.t);
    if (muI > 0) {
      const R = inp.model.sinusRadius;
      const root = moveWorld(V3.v(0, R * 0.55, 0), rootW * 0.6);
      bones.push({ type: 0, c: root, ax: [V3.v(1, 0, 0), V3.v(0, 1, 0), V3.v(0, 0, 1)], half: [R * 1.05, R * 0.85, R * 1.05], mu: 0, muI });
      const asc = moveWorld(V3.v(0, 45, 0), rootW * 0.4);
      bones.push({ type: 1, c: asc, ax: [V3.v(1, 0, 0), V3.v(0, 1, 0), V3.v(0, 0, 1)], half: [15, 30, 15], mu: 0, muI: muI * 0.6 });
    }
    if (b.lv) {
      const lvMu = MU.iodinePerMg * 350 * 0.45 * (1 - smooth(b.injectDur, b.injectDur + 3, b.t));
      const cav = V3.add(H.base, V3.sc(H.L, H.len * 0.48));
      bones.push({
        type: 0,
        c: moveWorld(cav, 1),
        ax: [H.L, H.A, H.S],
        half: [H.len * 0.4 * (1 - 0.15 * e), 24 * (1 - 0.3 * e), 26 * (1 - 0.3 * e)],
        mu: 0,
        muI: lvMu
      });
    }
  }
  if (b && b.side && !b.lv) {
    const blush = smooth(b.injectDur * 0.7, b.injectDur + 1, b.t) * (1 - smooth(b.injectDur + 2, b.injectDur + 4.5, b.t)) * b.peak * Math.min(1, inp.flowScale ?? 1);
    if (blush > 0.01) {
      const left2 = b.side === "left";
      let c2 = V3.add(H.base, V3.sc(H.L, H.len * 0.45));
      if (!left2) c2 = V3.add(c2, V3.add(V3.sc(H.S, -18), V3.sc(H.A, 12)));
      const k = 1 - 0.12 * e;
      bones.push({
        type: 0,
        c: moveWorld(c2, 1),
        ax: [H.L, H.A, H.S],
        half: [H.len * 0.52 * k, (left2 ? 46 : 36) * k, (left2 ? 50 : 38) * k],
        mu: 0,
        muI: MU.iodinePerMg * 4 * blush
      });
    }
  }
  const topY = inp.catheterRoot[0]?.y ?? 54;
  const course = aorticCourse(inp.caseData.accessRoute, topY);
  const cathAortic = [...course.slice(0, -1), ...inp.catheterRoot];
  const cath = resample(cathAortic, 2.5).map((p) => moveWorld(p, rootW));
  const od = inp.french === 5 ? 0.83 : inp.french === 7 ? 1.17 : 1;
  const id = od - 0.32;
  const wallMu = 0.32;
  const lumenIodine = injecting ? MU.iodinePerMg * 350 : 0;
  tubes.push({ pts: cath, r: cath.map(() => od), mu: [0, wallMu, 0] });
  tubes.push({ pts: cath, r: cath.map(() => id), mu: [0, lumenIodine - wallMu, 0] });
  if (inp.catheter2) {
    const c2 = inp.catheter2;
    const course2 = aorticCourse(c2.route, c2.root[0]?.y ?? 54);
    const pts2 = resample([...course2.slice(0, -1), ...c2.root], 2.5).map((p) => moveWorld(p, rootW));
    const od2 = c2.french === 5 ? 0.83 : c2.french === 7 ? 1.17 : 1;
    tubes.push({ pts: pts2, r: pts2.map(() => od2), mu: [0, wallMu, 0] });
    tubes.push({ pts: pts2, r: pts2.map(() => od2 - 0.32), mu: [0, (c2.injecting ? MU.iodinePerMg * 350 : 0) - wallMu, 0] });
  }
  const tipSeg = cath.slice(-2);
  if (tipSeg.length === 2) tubes.push({ pts: tipSeg, r: [od * 0.9, od * 0.8], mu: [0, 0, 0.08] });
  if (inp.wire && inp.wire.pts.length >= 2) {
    const w = resample(inp.wire.pts, 1.5).map((p) => moveWorld(p, rootW));
    const rw = inp.wire.kind === "035" ? 0.445 : 0.178;
    tubes.push({ pts: w, r: w.map(() => rw), mu: [0, 0, inp.wire.kind === "035" ? 0.95 : 1.9] });
    if (inp.wire.kind === "014") {
      let acc = 0;
      const tip = [w[w.length - 1]];
      for (let i = w.length - 2; i >= 0 && acc < 30; i--) {
        acc += Math.hypot(w[i + 1].x - w[i].x, w[i + 1].y - w[i].y, w[i + 1].z - w[i].z);
        tip.unshift(w[i]);
      }
      tubes.push({ pts: tip, r: tip.map(() => rw), mu: [0, 0, 6.5] });
    }
  }
  if (inp.extras) {
    const place = (sm) => moveWorld(samplePos(H, sm, { contraction: e }), rootW + (1 - rootW) * sm.w);
    const ex = inp.extras(place, { bolusT: b ? b.t : null, injecting });
    if (ex.tubes) tubes.push(...ex.tubes);
    if (ex.bones) bones.push(...ex.bones);
  }
  const iso = V3.add(treeCentre(inp.tree, inp.centreOn ?? "both"), inp.pan ?? V3.v(0, 0, 0));
  const field = inp.field ?? 230;
  const cam = makeCamera(inp.cArm, iso, field);
  const th = inp.cArm.laoRao * Math.PI / 180;
  const ph = inp.cArm.cranialCaudal * Math.PI / 180;
  const path = Math.hypot(168 * Math.sin(th), 112 * Math.cos(th)) * 2 / Math.max(0.55, Math.cos(ph));
  const kv = Math.max(65, Math.min(105, 62 + (path - 220) * 0.12));
  const gain = Math.pow(75 / kv, 2.2);
  const cine = inp.mode === "cine";
  const params = {
    counts: cine ? 1500 : 380,
    recursive: cine ? 0.12 : 0.5,
    edge: cine ? 0.75 : 0.55,
    spr: 0.75,
    iodineGain: gain,
    metalGain: Math.pow(75 / kv, 1.4),
    window: cine ? 2.3 : 2.7,
    // flat-panel harmonisation and level calibrated against real Philips cine frames
    // (CoronaryDominance dataset): grey-level quartiles of standard views match within ~10 levels
    drc: 0.7,
    level: -0.12,
    seed: inp.frame * 1.618,
    field: "square"
  };
  return { scene: { cam, anat: thorax.anat, bones, tubes }, params, resp, contraction: e };
}

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/XrayRenderer.ts
var HEADER = `#version 300 es
precision highp float;
precision highp int;
`;
var CAMERA_GLSL = `
uniform vec3 uSrc;
uniform vec3 uDetC;
uniform vec3 uDetU;
uniform vec3 uDetV;
vec3 rayDir(vec2 uv) {
  vec3 p = uDetC + uv.x * uDetU + uv.y * uDetV;
  return normalize(p - uSrc);
}
`;
var INTERVAL_GLSL = `
// returns (tIn, tOut); empty when tIn >= tOut
vec2 interval(int type, vec3 c, mat3 inv, vec3 ro, vec3 rd) {
  vec3 o = inv * (ro - c);
  vec3 d = inv * rd;
  if (type == 0) {
    float a = dot(d, d);
    float b = 2.0 * dot(o, d);
    float cc = dot(o, o) - 1.0;
    float disc = b * b - 4.0 * a * cc;
    if (disc <= 0.0) return vec2(1.0, 0.0);
    float s = sqrt(disc);
    return vec2((-b - s) / (2.0 * a), (-b + s) / (2.0 * a));
  }
  if (type == 1) {
    float a = d.x * d.x + d.z * d.z;
    float b = 2.0 * (o.x * d.x + o.z * d.z);
    float cc = o.x * o.x + o.z * o.z - 1.0;
    vec2 tc;
    if (a < 1e-10) {
      if (cc > 0.0) return vec2(1.0, 0.0);
      tc = vec2(-1e9, 1e9);
    } else {
      float disc = b * b - 4.0 * a * cc;
      if (disc <= 0.0) return vec2(1.0, 0.0);
      float s = sqrt(disc);
      tc = vec2((-b - s) / (2.0 * a), (-b + s) / (2.0 * a));
    }
    vec2 ty;
    if (abs(d.y) < 1e-10) {
      if (abs(o.y) > 1.0) return vec2(1.0, 0.0);
      ty = vec2(-1e9, 1e9);
    } else {
      float t1 = (-1.0 - o.y) / d.y;
      float t2 = (1.0 - o.y) / d.y;
      ty = vec2(min(t1, t2), max(t1, t2));
    }
    return vec2(max(tc.x, ty.x), min(tc.y, ty.y));
  }
  // box
  vec3 inv_d = 1.0 / d;
  vec3 t1 = (-1.0 - o) * inv_d;
  vec3 t2 = (1.0 - o) * inv_d;
  vec3 tmin = min(t1, t2);
  vec3 tmax = max(t1, t2);
  return vec2(max(max(tmin.x, tmin.y), tmin.z), min(min(tmax.x, tmax.y), tmax.z));
}
float ilen(vec2 i) { return max(0.0, i.y - i.x); }
float iand(vec2 a, vec2 b) { return max(0.0, min(a.y, b.y) - max(a.x, b.x)); }
float iand3(vec2 a, vec2 b, vec2 c) { return max(0.0, min(min(a.y, b.y), c.y) - max(max(a.x, b.x), c.x)); }
`;
var ANAT_VS = `${HEADER}
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
var ANAT_FS = `${HEADER}
${CAMERA_GLSL}
${INTERVAL_GLSL}
in vec2 vUv;
out vec4 frag;
uniform int uType[${ANAT_COUNT}];
uniform vec3 uC[${ANAT_COUNT}];
uniform mat3 uInv[${ANAT_COUNT}];
uniform float uMuSoft, uMuLungEx, uMuAirEx, uMuLiverEx, uMuFatEx;
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { return 0.5 * n3(p) + 0.25 * n3(p * 2.03) + 0.125 * n3(p * 4.01) + 0.0625 * n3(p * 8.05); }
void main() {
  vec3 rd = rayDir(vUv);
  vec2 iv[${ANAT_COUNT}];
  for (int i = 0; i < ${ANAT_COUNT}; i++) iv[i] = interval(uType[i], uC[i], uInv[i], uSrc, rd);
  float body = ilen(iv[0]);
  // lungs minus the union of the mediastinal structures, solved exactly per ray:
  // clip each carve interval to the lung interval, sort by entry, merge, measure
  float lungs = 0.0;
  for (int k = 1; k <= 2; k++) {
    vec2 L = iv[k];
    float a = ilen(L);
    if (a <= 0.0) continue;
    vec2 cv[${CARVE.length}];
    int m = 0;
    ${CARVE.map((idx) => `{ vec2 c = vec2(max(iv[${idx}].x, L.x), min(iv[${idx}].y, L.y)); if (c.y > c.x) { cv[m] = c; m++; } }`).join(" ")}
    for (int i = 1; i < ${CARVE.length}; i++) {
      if (i >= m) break;
      vec2 key = cv[i];
      int j = i - 1;
      for (int q = 0; q < ${CARVE.length}; q++) {
        if (j < 0 || cv[j].x <= key.x) break;
        cv[j + 1] = cv[j];
        j--;
      }
      cv[j + 1] = key;
    }
    float covered = 0.0, cs = -1e9, ce = -1e9;
    for (int i = 0; i < ${CARVE.length}; i++) {
      if (i >= m) break;
      if (cv[i].x > ce) { covered += max(0.0, ce - cs); cs = cv[i].x; ce = cv[i].y; }
      else ce = max(ce, cv[i].y);
    }
    covered += max(0.0, ce - cs);
    lungs += max(0.0, a - covered);
  }
  float air = ilen(iv[7]) + ilen(iv[8]) + ilen(iv[9]) + ilen(iv[10]);
  float fat = max(0.0, ilen(iv[11]) - ilen(iv[3])) * 0.5;
  float P = uMuSoft * body + uMuLungEx * lungs + uMuAirEx * air + uMuLiverEx * ilen(iv[6]) + uMuFatEx * fat;
  // tissue heterogeneity (fat planes, muscle, alveolar texture) fixed to the patient: sample along the ray
  vec3 mid = uSrc + rd * (0.5 * (iv[0].x + iv[0].y));
  float tex = fbm(mid * 0.035) - 0.47 + 0.6 * (fbm(mid * 0.11 + 3.1) - 0.47);
  P += 0.11 * tex + 0.05 * (fbm(mid * 0.33) - 0.47) * (lungs > 1.0 ? 1.0 : 0.3);
  frag = vec4(P, 0.0, 0.0, 0.0);
}
`;
var BONE_VS = `${HEADER}
${CAMERA_GLSL}
in vec2 aCorner;
in vec3 iC;
in vec3 iR0;
in vec3 iR1;
in vec3 iR2;
in float iType;
in float iMu;
in float iRad;
in float iMuI;
out vec2 vUv;
flat out vec3 fC;
flat out mat3 fInv;
flat out int fType;
flat out float fMu;
flat out float fMuI;
uniform float uDetHalf;
void main() {
  vec3 N = normalize(uDetC - uSrc);
  float sid = dot(uDetC - uSrc, N);
  vec3 d = iC - uSrc;
  float along = dot(d, N);
  float mag = sid / max(along, 1.0);
  vec3 p = uSrc + d * mag;
  vec2 uv = vec2(dot(p - uDetC, normalize(uDetU)), dot(p - uDetC, normalize(uDetV))) / uDetHalf;
  float r = iRad * mag / uDetHalf * 1.25 + 0.01;
  vUv = uv + aCorner * r;
  fC = iC;
  fInv = mat3(iR0, iR1, iR2);
  fType = int(iType + 0.5);
  fMu = iMu;
  fMuI = iMuI;
  gl_Position = vec4(vUv, 0.0, 1.0);
}
`;
var BONE_FS = `${HEADER}
${CAMERA_GLSL}
${INTERVAL_GLSL}
in vec2 vUv;
flat in vec3 fC;
flat in mat3 fInv;
flat in int fType;
flat in float fMu;
flat in float fMuI;
out vec4 frag;
void main() {
  vec3 rd = rayDir(vUv);
  vec2 i = interval(fType, fC, fInv, uSrc, rd);
  float l = ilen(i);
  frag = vec4(fMu * l, fMuI * l, 0.0, 0.0);
}
`;
var TUBE_VS = `${HEADER}
in vec2 aPos;
in float aAcross;
in float aChord;
in vec3 aMu;
out float vAcross;
out float vChord;
out vec3 vMu;
void main() {
  vAcross = aAcross;
  vChord = aChord;
  vMu = aMu;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
var TUBE_FS = `${HEADER}
in float vAcross;
in float vChord;
in vec3 vMu;
out vec4 frag;
void main() {
  float prof = sqrt(max(0.0, 1.0 - vAcross * vAcross));
  frag = vec4(vMu * vChord * prof, 0.0);
}
`;
var QUAD_VS = `${HEADER}
in vec2 aPos;
out vec2 vTex;
void main() { vTex = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
var TRANS_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uAcc;
uniform float uIodine, uMetal;
void main() {
  vec4 a = texture(uAcc, vTex);
  float P = a.r + uIodine * a.g + uMetal * a.b;
  frag = vec4(exp(-P), P, 0.0, 1.0);
}
`;
var DISPLAY_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uTrans;
uniform sampler2D uPrev;
uniform float uCounts, uRecursive, uEdge, uSpr, uWindow, uLevel, uSeed, uMaxLod, uCircle, uDrc;
uniform vec4 uShutters;
uniform vec2 uRes;
float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423) + uSeed);
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float gauss(vec2 p) {
  // Box\u2013Muller from two hashes
  float u1 = max(1e-6, hash(p));
  float u2 = hash(p + 17.3);
  return sqrt(-2.0 * log(u1)) * cos(6.2831853 * u2);
}
float vnoise(vec2 p) {
  // slightly correlated noise, like a real detector after its MTF
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  float a = gauss(i), b = gauss(i + vec2(1.0, 0.0)), c = gauss(i + vec2(0.0, 1.0)), d = gauss(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y) * 1.25;
}
void main() {
  vec2 uv = vTex;
  float T = textureLod(uTrans, uv, 0.85).r;
  float Ts = textureLod(uTrans, uv, 5.5).r;
  // automatic exposure control meters the central field (where the heart is)
  float lodC = max(0.0, uMaxLod - 4.0);
  float Tref = 0.2 * (textureLod(uTrans, vec2(0.5, 0.5), lodC).r + textureLod(uTrans, vec2(0.38, 0.5), lodC).r +
                      textureLod(uTrans, vec2(0.62, 0.5), lodC).r + textureLod(uTrans, vec2(0.5, 0.38), lodC).r +
                      textureLod(uTrans, vec2(0.5, 0.62), lodC).r);
  float Tdet = T + uSpr * Ts;
  float N0 = uCounts / max(Tref * (1.0 + uSpr), 1e-5);
  float N = N0 * Tdet;
  float Nn = max(1.0, N + sqrt(N) * vnoise(uv * uRes * 0.75));
  float L = -log(Nn / N0);
  // unsharp mask against a blurred, noise-free version
  float Tb = textureLod(uTrans, uv, 2.2).r + uSpr * Ts;
  float Lb = -log(max(Tb, 1e-6));
  float Le = L + uEdge * (L - Lb);
  float ref = -log(max(Tref * (1.0 + uSpr), 1e-6));
  // dynamic range compression (flat-panel "harmonisation"): flatten large-area differences
  // between lung, heart, spine and diaphragm while keeping vessels and edges at full contrast
  float Llow = -log(max(textureLod(uTrans, uv, 5.2).r + uSpr * Ts, 1e-6));
  Le -= uDrc * (Llow - ref);
  float vv = clamp((Le - (ref - uWindow * 0.36) - uLevel) / uWindow, 0.0, 1.0);
  float g = 1.0 - vv;
  g = pow(g, 1.08);
  // temporal recursion
  float prev = texture(uPrev, uv).g;
  g = mix(g, prev, uRecursive);
  // field: circular or square, with collimator shutters
  vec2 c = uv * 2.0 - 1.0;
  float inField = uCircle > 0.5 ? step(length(c), 0.985) : step(max(abs(c.x), abs(c.y)), 0.985);
  inField *= step(uShutters.x, uv.x) * step(uv.x, 1.0 - uShutters.y) * step(uShutters.w, uv.y) * step(uv.y, 1.0 - uShutters.z);
  float vig = 1.0 - 0.10 * dot(c, c);
  frag = vec4(vec3(g * vig * inField), 1.0);
  // keep the un-vignetted value in green for the recursion
  frag.g = g;
}
`;
var BLIT_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uTex;
void main() { float v = texture(uTex, vTex).r; frag = vec4(v, v, v, 1.0); }
`;
function compile(gl2, type, src) {
  const s = gl2.createShader(type);
  gl2.shaderSource(s, src);
  gl2.compileShader(s);
  if (!gl2.getShaderParameter(s, gl2.COMPILE_STATUS)) throw new Error(gl2.getShaderInfoLog(s) ?? "shader error");
  return s;
}
function program(gl2, vs, fs) {
  const p = gl2.createProgram();
  gl2.attachShader(p, compile(gl2, gl2.VERTEX_SHADER, vs));
  gl2.attachShader(p, compile(gl2, gl2.FRAGMENT_SHADER, fs));
  gl2.bindAttribLocation(p, 0, "aPos");
  gl2.linkProgram(p);
  if (!gl2.getProgramParameter(p, gl2.LINK_STATUS)) throw new Error(gl2.getProgramInfoLog(p) ?? "link error");
  return p;
}
var dot3 = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
var range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
function pick(t, idx) {
  return {
    pts: idx.map((i) => t.pts[i]),
    r: idx.map((i) => t.r[i]),
    mu: Array.isArray(t.mu[0]) ? idx.map((i) => t.mu[i]) : t.mu,
    thin: t.thin ? { dir: idx.map((i) => t.thin.dir[i]), r: idx.map((i) => t.thin.r[i]) } : void 0
  };
}
var cross32 = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
var len = (a) => Math.hypot(a.x, a.y, a.z);
function invMat(s) {
  const [a, b, c2] = s.ax;
  const [h0, h1, h2] = s.half;
  return [a.x / h0, b.x / h1, c2.x / h2, a.y / h0, b.y / h1, c2.y / h2, a.z / h0, b.z / h1, c2.z / h2];
}
var XrayRenderer = class _XrayRenderer {
  gl;
  res = 0;
  acc;
  trans;
  disp = [];
  flip = 0;
  pAnat;
  pBone;
  pTube;
  pTrans;
  pDisp;
  pBlit;
  quad;
  vaoQuad;
  boneVao;
  boneInst;
  cornerBuf;
  tubeVao;
  tubeBuf;
  tubeIdx;
  uniCache = /* @__PURE__ */ new Map();
  static create(canvas2) {
    try {
      const gl2 = canvas2.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
      if (!gl2) return null;
      if (!gl2.getExtension("EXT_color_buffer_float")) return null;
      gl2.getExtension("OES_texture_float_linear");
      return new _XrayRenderer(gl2);
    } catch {
      return null;
    }
  }
  constructor(gl2) {
    this.gl = gl2;
    this.pAnat = program(gl2, ANAT_VS, ANAT_FS);
    this.pBone = program(gl2, BONE_VS, BONE_FS);
    this.pTube = program(gl2, TUBE_VS, TUBE_FS);
    this.pTrans = program(gl2, QUAD_VS, TRANS_FS);
    this.pDisp = program(gl2, QUAD_VS, DISPLAY_FS);
    this.pBlit = program(gl2, QUAD_VS, BLIT_FS);
    this.quad = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, this.quad);
    gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl2.STATIC_DRAW);
    this.vaoQuad = gl2.createVertexArray();
    gl2.bindVertexArray(this.vaoQuad);
    for (const p of [this.pAnat, this.pTrans, this.pDisp, this.pBlit]) {
      const loc = gl2.getAttribLocation(p, "aPos");
      if (loc >= 0) {
        gl2.enableVertexAttribArray(loc);
        gl2.vertexAttribPointer(loc, 2, gl2.FLOAT, false, 0, 0);
      }
    }
    this.boneVao = gl2.createVertexArray();
    gl2.bindVertexArray(this.boneVao);
    this.cornerBuf = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, this.cornerBuf);
    gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl2.STATIC_DRAW);
    const cl = gl2.getAttribLocation(this.pBone, "aCorner");
    gl2.enableVertexAttribArray(cl);
    gl2.vertexAttribPointer(cl, 2, gl2.FLOAT, false, 0, 0);
    this.boneInst = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, this.boneInst);
    const stride = 16 * 4;
    const attrs = [
      ["iC", 3, 0],
      ["iR0", 3, 3],
      ["iR1", 3, 6],
      ["iR2", 3, 9],
      ["iType", 1, 12],
      ["iMu", 1, 13],
      ["iRad", 1, 14],
      ["iMuI", 1, 15]
    ];
    for (const [name, size, off] of attrs) {
      const loc = gl2.getAttribLocation(this.pBone, name);
      gl2.enableVertexAttribArray(loc);
      gl2.vertexAttribPointer(loc, size, gl2.FLOAT, false, stride, off * 4);
      gl2.vertexAttribDivisor(loc, 1);
    }
    this.tubeVao = gl2.createVertexArray();
    gl2.bindVertexArray(this.tubeVao);
    this.tubeBuf = gl2.createBuffer();
    this.tubeIdx = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, this.tubeBuf);
    gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, this.tubeIdx);
    const ts = 7 * 4;
    const tattrs = [
      ["aPos", 2, 0],
      ["aAcross", 1, 2],
      ["aChord", 1, 3],
      ["aMu", 3, 4]
    ];
    for (const [name, size, off] of tattrs) {
      const loc = gl2.getAttribLocation(this.pTube, name);
      gl2.enableVertexAttribArray(loc);
      gl2.vertexAttribPointer(loc, size, gl2.FLOAT, false, ts, off * 4);
    }
    gl2.bindVertexArray(null);
  }
  u(p, name) {
    let m = this.uniCache.get(p);
    if (!m) this.uniCache.set(p, m = /* @__PURE__ */ new Map());
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(p, name));
    return m.get(name);
  }
  target(res, mip = false) {
    const gl2 = this.gl;
    const tex = gl2.createTexture();
    gl2.bindTexture(gl2.TEXTURE_2D, tex);
    const levels = mip ? Math.floor(Math.log2(res)) + 1 : 1;
    gl2.texStorage2D(gl2.TEXTURE_2D, levels, gl2.RGBA16F, res, res);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, mip ? gl2.LINEAR_MIPMAP_LINEAR : gl2.LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
    const fbo = gl2.createFramebuffer();
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, fbo);
    gl2.framebufferTexture2D(gl2.FRAMEBUFFER, gl2.COLOR_ATTACHMENT0, gl2.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }
  resize(res) {
    if (res === this.res) return;
    this.res = res;
    this.acc = this.target(res);
    this.trans = this.target(res, true);
    this.disp = [this.target(res), this.target(res)];
    const gl2 = this.gl;
    for (const d of this.disp) {
      gl2.bindFramebuffer(gl2.FRAMEBUFFER, d.fbo);
      gl2.clearColor(0, 0, 0, 1);
      gl2.clear(gl2.COLOR_BUFFER_BIT);
    }
  }
  setCamera(p, cam) {
    const gl2 = this.gl;
    gl2.uniform3f(this.u(p, "uSrc"), cam.src.x, cam.src.y, cam.src.z);
    gl2.uniform3f(this.u(p, "uDetC"), cam.detC.x, cam.detC.y, cam.detC.z);
    gl2.uniform3f(this.u(p, "uDetU"), cam.detU.x, cam.detU.y, cam.detU.z);
    gl2.uniform3f(this.u(p, "uDetV"), cam.detV.x, cam.detV.y, cam.detV.z);
  }
  /** Project a world point to detector uv (−1..1) and magnification. */
  static project(cam, p) {
    const N0 = { x: cam.detC.x - cam.src.x, y: cam.detC.y - cam.src.y, z: cam.detC.z - cam.src.z };
    const sid = len(N0);
    const N = { x: N0.x / sid, y: N0.y / sid, z: N0.z / sid };
    const d = { x: p.x - cam.src.x, y: p.y - cam.src.y, z: p.z - cam.src.z };
    const along = Math.max(1, dot3(d, N));
    const mag = sid / along;
    const q = { x: cam.src.x + d.x * mag - cam.detC.x, y: cam.src.y + d.y * mag - cam.detC.y, z: cam.src.z + d.z * mag - cam.detC.z };
    const hu = len(cam.detU);
    const hv = len(cam.detV);
    return { u: dot3(q, cam.detU) / (hu * hu), v: dot3(q, cam.detV) / (hv * hv), mag, along };
  }
  buildTubes(cam, tubesIn) {
    const res = this.res;
    const half = len(cam.detU);
    const mmPerPx = 2 * half / res;
    const keepFor = /* @__PURE__ */ new Map();
    const decimated = tubesIn.map((t) => {
      const n = t.pts.length;
      if (n < 3) return t;
      let keep = keepFor.get(t.pts);
      if (!keep) {
        const pr = t.pts.map((p) => _XrayRenderer.project(cam, p));
        keep = [0];
        for (let i = 1; i < n - 1; i++) {
          const q = pr[keep[keep.length - 1]];
          const hwUv = Math.max(t.r[i] * pr[i].mag / mmPerPx, 1.25) / res * 2;
          if (Math.hypot(pr[i].u - q.u, pr[i].v - q.v) >= 0.5 * hwUv) keep.push(i);
        }
        keep.push(n - 1);
        keepFor.set(t.pts, keep);
      }
      if (keep.length === n) return t;
      return pick(t, keep);
    });
    const tubes = [];
    for (const t of decimated) {
      const n = t.pts.length;
      if (n < 3) {
        tubes.push(t);
        continue;
      }
      const pr = t.pts.map((p) => _XrayRenderer.project(cam, p));
      let start = 0;
      for (let i = 1; i < n - 1; i++) {
        const ax = pr[i].u - pr[i - 1].u, ay = pr[i].v - pr[i - 1].v, bx = pr[i + 1].u - pr[i].u, by = pr[i + 1].v - pr[i].v;
        if (ax * bx + ay * by < 0) {
          tubes.push(pick(t, range(start, i)));
          start = i;
        }
      }
      tubes.push(start === 0 ? t : pick(t, range(start, n - 1)));
    }
    let nv = 0, ni = 0;
    for (const t of tubes) if (t.pts.length >= 2) {
      nv += t.pts.length * 2;
      ni += (t.pts.length - 1) * 6;
    }
    const vb = new Float32Array(nv * 7);
    const ib = new Uint32Array(ni);
    let vo = 0, io = 0, base = 0;
    for (const t of tubes) {
      const n = t.pts.length;
      if (n < 2) continue;
      const pr = t.pts.map((p) => _XrayRenderer.project(cam, p));
      const muArr = Array.isArray(t.mu[0]) ? t.mu : null;
      let lnx = 0, lny = 1;
      for (let i = 0; i < n; i++) {
        const a = pr[Math.max(0, i - 1)], b = pr[Math.min(n - 1, i + 1)];
        let tx = b.u - a.u, ty = b.v - a.v;
        const tl = Math.hypot(tx, ty);
        let nx = lnx, ny = lny;
        if (tl > 1e-4) {
          tx /= tl;
          ty /= tl;
          nx = -ty;
          ny = tx;
          if (i > 0 && nx * lnx + ny * lny < 0) {
            nx = -nx;
            ny = -ny;
          }
          lnx = nx;
          lny = ny;
        }
        const P = t.pts[i];
        const P0 = t.pts[Math.max(0, i - 1)], P1 = t.pts[Math.min(n - 1, i + 1)];
        const T = { x: P1.x - P0.x, y: P1.y - P0.y, z: P1.z - P0.z };
        const R = { x: P.x - cam.src.x, y: P.y - cam.src.y, z: P.z - cam.src.z };
        const lt = len(T) || 1, lr = len(R) || 1;
        const cosA = Math.abs(dot3(T, R)) / (lt * lr);
        const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
        const invSin = 1 / Math.max(sinA, t.thin ? 0.35 : 0.14);
        let r = t.r[i];
        let c0 = 2 * r;
        const req = t.thin ? Math.sqrt(t.r[i] * Math.max(0.2, t.thin.r[i])) : r;
        const wEll = t.thin ? Math.min(1, Math.max(0, (sinA - 0.12) / 0.25)) : 0;
        if (t.thin) {
          r = req;
          c0 = 2 * req;
        }
        if (t.thin && wEll > 0) {
          const Tn = { x: T.x / lt, y: T.y / lt, z: T.z / lt };
          const Rn = { x: R.x / lr, y: R.y / lr, z: R.z / lr };
          const nn = cross32(Tn, Rn);
          const nl = len(nn);
          const d = t.thin.dir[i];
          const dd = dot3(d, Tn);
          const e2r = { x: d.x - dd * Tn.x, y: d.y - dd * Tn.y, z: d.z - dd * Tn.z };
          const el = len(e2r);
          if (nl > 1e-6 && el > 1e-6) {
            const n2 = { x: nn.x / nl, y: nn.y / nl, z: nn.z / nl };
            const e2 = { x: e2r.x / el, y: e2r.y / el, z: e2r.z / el };
            const e1 = cross32(Tn, e2);
            const u = cross32(n2, Tn);
            const a2 = t.r[i], b2 = Math.max(0.2, t.thin.r[i]);
            const rE = Math.sqrt(a2 * a2 * dot3(n2, e1) ** 2 + b2 * b2 * dot3(n2, e2) ** 2);
            const cE = 2 / Math.sqrt(dot3(u, e1) ** 2 / (a2 * a2) + dot3(u, e2) ** 2 / (b2 * b2));
            r = req + (rE - req) * wEll;
            c0 = 2 * req + (cE - 2 * req) * wEll;
          }
        }
        const rPx = r * pr[i].mag / mmPerPx;
        const hw = Math.max(rPx, 1.25);
        const k = Math.min(1, rPx / hw);
        const hwUv = hw / res * 2;
        const chord = c0 * k * invSin;
        const mu = muArr ? muArr[i] : t.mu;
        for (const side of [-1, 1]) {
          vb[vo++] = pr[i].u + nx * hwUv * side;
          vb[vo++] = pr[i].v + ny * hwUv * side;
          vb[vo++] = side;
          vb[vo++] = chord;
          vb[vo++] = mu[0];
          vb[vo++] = mu[1];
          vb[vo++] = mu[2];
        }
        if (i < n - 1) {
          const q = base + i * 2;
          ib[io++] = q;
          ib[io++] = q + 1;
          ib[io++] = q + 2;
          ib[io++] = q + 1;
          ib[io++] = q + 3;
          ib[io++] = q + 2;
        }
      }
      base += n * 2;
    }
    return { vb, ib, count: io };
  }
  render(scene, params, target = "canvas") {
    const gl2 = this.gl;
    const res = this.res;
    if (!res) return;
    gl2.viewport(0, 0, res, res);
    gl2.disable(gl2.DEPTH_TEST);
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, this.acc.fbo);
    gl2.disable(gl2.BLEND);
    gl2.useProgram(this.pAnat);
    this.setCamera(this.pAnat, scene.cam);
    const types = new Int32Array(ANAT_COUNT);
    const cs = new Float32Array(ANAT_COUNT * 3);
    const invs = new Float32Array(ANAT_COUNT * 9);
    scene.anat.forEach((s, i) => {
      types[i] = s.type;
      cs.set([s.c.x, s.c.y, s.c.z], i * 3);
      invs.set(invMat(s), i * 9);
    });
    gl2.uniform1iv(this.u(this.pAnat, "uType"), types);
    gl2.uniform3fv(this.u(this.pAnat, "uC"), cs);
    gl2.uniformMatrix3fv(this.u(this.pAnat, "uInv"), false, invs);
    gl2.uniform1f(this.u(this.pAnat, "uMuSoft"), 0.02);
    gl2.uniform1f(this.u(this.pAnat, "uMuLungEx"), -0.0146);
    gl2.uniform1f(this.u(this.pAnat, "uMuAirEx"), -0.02);
    gl2.uniform1f(this.u(this.pAnat, "uMuLiverEx"), 12e-4);
    gl2.uniform1f(this.u(this.pAnat, "uMuFatEx"), -25e-4);
    gl2.bindVertexArray(this.vaoQuad);
    gl2.drawArrays(gl2.TRIANGLES, 0, 6);
    gl2.enable(gl2.BLEND);
    gl2.blendFunc(gl2.ONE, gl2.ONE);
    gl2.blendEquation(gl2.FUNC_ADD);
    if (scene.bones.length) {
      const data = new Float32Array(scene.bones.length * 16);
      scene.bones.forEach((b, i) => {
        const m = invMat(b);
        const rad = Math.max(...b.half) * (b.type === 2 ? 1.75 : b.type === 1 ? 1.45 : 1);
        data.set([b.c.x, b.c.y, b.c.z, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], b.type, b.mu, rad, b.muI ?? 0], i * 16);
      });
      gl2.useProgram(this.pBone);
      this.setCamera(this.pBone, scene.cam);
      gl2.uniform1f(this.u(this.pBone, "uDetHalf"), len(scene.cam.detU));
      gl2.bindVertexArray(this.boneVao);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, this.boneInst);
      gl2.bufferData(gl2.ARRAY_BUFFER, data, gl2.DYNAMIC_DRAW);
      gl2.drawArraysInstanced(gl2.TRIANGLES, 0, 6, scene.bones.length);
    }
    const tb = this.buildTubes(scene.cam, scene.tubes);
    if (tb.count) {
      gl2.useProgram(this.pTube);
      gl2.bindVertexArray(this.tubeVao);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, this.tubeBuf);
      gl2.bufferData(gl2.ARRAY_BUFFER, tb.vb, gl2.DYNAMIC_DRAW);
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, this.tubeIdx);
      gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, tb.ib, gl2.DYNAMIC_DRAW);
      gl2.drawElements(gl2.TRIANGLES, tb.count, gl2.UNSIGNED_INT, 0);
    }
    gl2.disable(gl2.BLEND);
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, this.trans.fbo);
    gl2.useProgram(this.pTrans);
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.bindTexture(gl2.TEXTURE_2D, this.acc.tex);
    gl2.uniform1i(this.u(this.pTrans, "uAcc"), 0);
    gl2.uniform1f(this.u(this.pTrans, "uIodine"), params.iodineGain);
    gl2.uniform1f(this.u(this.pTrans, "uMetal"), params.metalGain);
    gl2.bindVertexArray(this.vaoQuad);
    gl2.drawArrays(gl2.TRIANGLES, 0, 6);
    gl2.bindTexture(gl2.TEXTURE_2D, this.trans.tex);
    gl2.generateMipmap(gl2.TEXTURE_2D);
    const prev = this.disp[this.flip];
    const next = this.disp[1 - this.flip];
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, next.fbo);
    gl2.useProgram(this.pDisp);
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.bindTexture(gl2.TEXTURE_2D, this.trans.tex);
    gl2.uniform1i(this.u(this.pDisp, "uTrans"), 0);
    gl2.activeTexture(gl2.TEXTURE1);
    gl2.bindTexture(gl2.TEXTURE_2D, prev.tex);
    gl2.uniform1i(this.u(this.pDisp, "uPrev"), 1);
    gl2.uniform1f(this.u(this.pDisp, "uCounts"), params.counts);
    gl2.uniform1f(this.u(this.pDisp, "uRecursive"), params.recursive);
    gl2.uniform1f(this.u(this.pDisp, "uEdge"), params.edge);
    gl2.uniform1f(this.u(this.pDisp, "uSpr"), params.spr);
    gl2.uniform1f(this.u(this.pDisp, "uWindow"), params.window);
    gl2.uniform1f(this.u(this.pDisp, "uDrc"), params.drc ?? 0.6);
    gl2.uniform1f(this.u(this.pDisp, "uLevel"), params.level);
    gl2.uniform1f(this.u(this.pDisp, "uSeed"), params.seed % 97.13);
    gl2.uniform1f(this.u(this.pDisp, "uMaxLod"), Math.floor(Math.log2(res)));
    gl2.uniform1f(this.u(this.pDisp, "uCircle"), params.field === "circle" ? 1 : 0);
    const sh = params.shutters ?? [0, 0, 0, 0];
    gl2.uniform4f(this.u(this.pDisp, "uShutters"), sh[0], sh[1], sh[2], sh[3]);
    gl2.uniform2f(this.u(this.pDisp, "uRes"), res, res);
    gl2.drawArrays(gl2.TRIANGLES, 0, 6);
    this.flip = 1 - this.flip;
    if (target === "canvas") {
      gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
      gl2.viewport(0, 0, gl2.drawingBufferWidth, gl2.drawingBufferHeight);
      gl2.useProgram(this.pBlit);
      gl2.activeTexture(gl2.TEXTURE0);
      gl2.bindTexture(gl2.TEXTURE_2D, next.tex);
      gl2.uniform1i(this.u(this.pBlit, "uTex"), 0);
      gl2.drawArrays(gl2.TRIANGLES, 0, 6);
    }
  }
  /** Re-present the last frame (last-image hold) without exposing. */
  present() {
    const gl2 = this.gl;
    if (!this.res) return;
    const last = this.disp[this.flip];
    gl2.bindFramebuffer(gl2.FRAMEBUFFER, null);
    gl2.viewport(0, 0, gl2.drawingBufferWidth, gl2.drawingBufferHeight);
    gl2.disable(gl2.BLEND);
    gl2.useProgram(this.pBlit);
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.bindTexture(gl2.TEXTURE_2D, last.tex);
    gl2.uniform1i(this.u(this.pBlit, "uTex"), 0);
    gl2.bindVertexArray(this.vaoQuad);
    gl2.drawArrays(gl2.TRIANGLES, 0, 6);
  }
  /** Release GPU resources. The context itself is left alive so a remount can reuse the canvas. */
  dispose() {
    const gl2 = this.gl;
    for (const p of [this.pAnat, this.pBone, this.pTube, this.pTrans, this.pDisp, this.pBlit]) gl2.deleteProgram(p);
    for (const b of [this.quad, this.boneInst, this.cornerBuf, this.tubeBuf, this.tubeIdx]) gl2.deleteBuffer(b);
    for (const t of [this.acc, this.trans, ...this.disp]) {
      if (!t) continue;
      gl2.deleteTexture(t.tex);
      gl2.deleteFramebuffer(t.fbo);
    }
    this.res = 0;
  }
};

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/ui/sim/helpers.ts
function catheterFamily(cath) {
  if (cath.category === "pigtail") return "pigtail";
  if (cath.category === "guide") return "guide";
  if (cath.id.startsWith("AL") || cath.id.startsWith("AR")) return "amplatz";
  if (cath.id.startsWith("MP")) return "mp";
  if (cath.category === "universal") return "universal";
  return "judkins";
}
function pigtailLoop(C, dir, R) {
  const rad = Math.max(2.4, R * 0.16);
  const d = normalize(V(dir.x, 0, dir.z));
  const center = add(C, scale(d, rad));
  const u = normalize(V(-d.z, 0, d.x));
  const w = V(0, 1, 0);
  const pts = [];
  for (let k = 0; k <= 11; k++) {
    const a = k / 11 * Math.PI * 2;
    pts.push(add(center, add(scale(u, Math.cos(a) * rad), scale(w, Math.sin(a) * rad))));
  }
  return pts;
}
function catheterPath(model2, tip, cath, _controls) {
  const fam = cath ? catheterFamily(cath) : "judkins";
  const right2 = cath ? cath.target === "right" || cath.id.startsWith("JR") || cath.id.startsWith("AR") : false;
  const R = model2.sinusRadius;
  const C = { x: tip.pos.x, y: tip.pos.y, z: tip.pos.z };
  const dir = normalize(tip.dir);
  const topH = model2.sinusTopY + 40;
  const opp = normalize(V(-C.x || -0.01, 0, -C.z || -0.01));
  if (fam === "pigtail") {
    const A2 = V(0, topH, 0);
    const curve = hermite(A2, V(0, -1, 0), C, normalize(add(V(0, -1, 0), scale(dir, 0.3))), 24);
    return [V(0, topH + 20, 0), ...curve, ...pigtailLoop(C, tip.dir, R)];
  }
  let W;
  switch (fam) {
    case "guide":
      W = add(scale(opp, R * 0.92), V(0, C.y - 9, 0));
      break;
    case "amplatz":
      W = add(scale(opp, R * 0.6), V(0, model2.valvePlaneY + 4, 0));
      break;
    case "mp":
      W = add(scale(C, 0.45), V(0, C.y + 12, 0));
      break;
    case "universal":
      W = add(scale(opp, R * 0.55), V(0, C.y + 6, 0));
      break;
    default:
      W = right2 ? add(add(C, scale(dir, -14)), V(0, 14, 0)) : add(scale(opp, R * 0.82), V(0, C.y + 7, 0));
  }
  const A = V(0, Math.max(topH - 6, W.y + 20), 0);
  const tA = V(0, -1, 0);
  const tW = normalize(add(normalize(sub3(C, W)), V(0, fam === "guide" || fam === "amplatz" ? 0.15 : -0.45, 0)));
  const tC = dir;
  const leg1 = hermite(A, scale(tA, len3(sub3(W, A)) * 1.1), W, scale(tW, len3(sub3(W, A)) * 1.1), 16);
  const leg2 = hermite(W, scale(tW, len3(sub3(C, W)) * 1.2), C, scale(tC, len3(sub3(C, W)) * 1.2), 16);
  const shaft = [V(0, topH + 20, 0), V(0, (topH + 20 + A.y) / 2, 0)];
  const out = [...shaft, ...leg1, ...leg2.slice(1)];
  out.push(add(C, scale(dir, fam === "amplatz" ? 3 : 2.4)));
  return out;
}
function hermite(p0, t0, p1, t1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const t2 = t * t, t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
    out.push({
      x: h00 * p0.x + h10 * t0.x + h01 * p1.x + h11 * t1.x,
      y: h00 * p0.y + h10 * t0.y + h01 * p1.y + h11 * t1.y,
      z: h00 * p0.z + h10 * t0.z + h01 * p1.z + h11 * t1.z
    });
  }
  return out;
}
var sub3 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
var len3 = (a) => Math.hypot(a.x, a.y, a.z);

// ../../../../../Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/data/catheters.ts
var LM_AZ = deg2rad(-30);
var RCA_AZ = deg2rad(150);
var NEUTRAL_AZ = deg2rad(60);
var CATHETERS = [
  {
    id: "JL3.5",
    name: "Judkins Left 3.5",
    seatCue: "Small root / radial: it finds the left main with almost no manipulation \u2014 let it seat, do not push.",
    category: "diagnostic",
    target: "left",
    curveSize: "3.5 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "Left coronary in a small or normal aortic root, shorter distance to the LM.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Small root, radial or short ascending aorta.",
    badAnatomy: "Dilated root \u2014 the tip falls short of the left main and injects non-selectively.",
    commonMistakes: [
      "Repeatedly pushing forward when the tip won't reach \u2014 this drives the catheter into the LV.",
      "Using JL3.5 in a dilated root and calling the faint filling 'the vessel'."
    ],
    teachingTips: [
      "In a small root the JL3.5 seats the left main with almost no manipulation \u2014 let it find the cusp.",
      "If it points at the left cusp but sits medial to the ostium, the curve is too small: step up to JL4."
    ],
    behaviour: {
      reach: 14,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.6,
      pushResponse: 0.5,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.2,
      shapedFor: "left",
      idealRootSize: "small"
    }
  },
  {
    id: "JL4",
    name: "Judkins Left 4",
    seatCue: "Advance to form the loop on the opposite (right) cusp, then withdraw gently to drop the tip into the left main.",
    category: "diagnostic",
    target: "left",
    curveSize: "4.0 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "The standard diagnostic left coronary catheter for an average aortic root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Normal aortic root, femoral or radial.",
    badAnatomy: "Small root (seats deep, poor alignment) or dilated root (falls short).",
    commonMistakes: [
      "Using JL4 in a small root where JL3.5 is safer and seats more coaxially.",
      "Advancing to 'reach' the ostium instead of gently withdrawing to seat."
    ],
    teachingTips: [
      "This is your default left catheter. Learn its behaviour in a normal root before anything else.",
      "Seat it by gentle withdrawal at the sinus level, not by pushing it down."
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.6,
      pushResponse: 0.5,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.25,
      shapedFor: "left",
      idealRootSize: "normal"
    }
  },
  {
    id: "JL4.5",
    name: "Judkins Left 4.5",
    category: "diagnostic",
    target: "left",
    curveSize: "4.5 cm",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Left coronary in a larger-than-average root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Enlarged root between normal and dilated.",
    badAnatomy: "Small/normal root \u2014 sits too high and non-coaxial.",
    commonMistakes: ["Reaching for JL4.5 before trying a well-seated JL4."],
    teachingTips: ["A half-step up when JL4 falls just short of the left main."],
    behaviour: {
      reach: 21,
      naturalAzimuth: LM_AZ,
      seatHeight: 16,
      torqueResponse: 0.55,
      pushResponse: 0.5,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.25,
      shapedFor: "left",
      idealRootSize: "dilated"
    }
  },
  {
    id: "JL5",
    name: "Judkins Left 5",
    category: "diagnostic",
    target: "left",
    curveSize: "5.0 cm",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Left coronary in a dilated aortic root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Dilated root, aneurysmal ascending aorta.",
    badAnatomy: "Normal/small root \u2014 aggressive, sits high and unstable.",
    commonMistakes: ["Using JL5 in a normal root, producing an unstable high tip."],
    teachingTips: ["Reserve for the genuinely dilated root where JL4/4.5 fall short."],
    behaviour: {
      reach: 24,
      naturalAzimuth: LM_AZ,
      seatHeight: 17,
      torqueResponse: 0.5,
      pushResponse: 0.5,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "left",
      idealRootSize: "dilated"
    }
  },
  {
    id: "JR4",
    name: "Judkins Right 4",
    seatCue: "Point at the right cusp, then gentle CLOCKWISE torque with slow withdrawal to drop into the RCA ostium.",
    category: "diagnostic",
    target: "right",
    curveSize: "4.0 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "The standard diagnostic catheter for the right coronary artery.",
    usualTarget: "RCA",
    bestAnatomy: "Normal RCA take-off from the right cusp.",
    badAnatomy: "High/anterior or shepherd's-crook take-off.",
    commonMistakes: [
      "Trying to engage the RCA with forward pressure instead of rotation and gentle withdrawal.",
      "Torquing while the tip is below the cusp \u2014 it whips into the LV."
    ],
    teachingTips: [
      "Point the tip anteriorly at the right cusp, then clockwise torque with slight withdrawal to drop into the ostium.",
      "If it enters the LV, you are too low \u2014 withdraw to the cusp before trying again."
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.65,
      pushResponse: 0.55,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "right",
      idealRootSize: "normal"
    }
  },
  {
    id: "JR3.5",
    name: "Judkins Right 3.5",
    category: "diagnostic",
    target: "right",
    curveSize: "3.5 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "RCA in a smaller root or radial access.",
    usualTarget: "RCA",
    bestAnatomy: "Small root, radial approach.",
    badAnatomy: "Dilated root \u2014 falls short of the RCA ostium.",
    commonMistakes: ["Persisting with JR3.5 when the tip cannot reach a laterally displaced ostium."],
    teachingTips: ["A gentler right catheter for the small root or radial route."],
    behaviour: {
      reach: 15,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.65,
      pushResponse: 0.55,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.28,
      shapedFor: "right",
      idealRootSize: "small"
    }
  },
  {
    id: "TIG",
    name: "Tiger / universal (radial)",
    seatCue: "Radial universal: anticlockwise in the left cusp for the LCA; clockwise + gentle pull for the RCA. Pre-empt the RCA dive with early withdrawal.",
    category: "universal",
    target: "both",
    curveSize: "universal",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Radial diagnostic angiography of both coronaries with one catheter.",
    usualTarget: "Both left and right coronary",
    bestAnatomy: "Radial access, normal root.",
    badAnatomy: "Dilated or rotated root where the ambiguous shape won't seat.",
    commonMistakes: [
      "Over-torquing \u2014 the tip response is less intuitive than a Judkins.",
      "Accepting a non-selective root puff instead of seating selectively."
    ],
    teachingTips: [
      "Torque toward the left cusp first; a small clockwise turn and pull often flips it to the RCA.",
      "Because it engages both sides, confirm which vessel you are in before injecting."
    ],
    behaviour: {
      reach: 17,
      naturalAzimuth: NEUTRAL_AZ,
      seatHeight: 13,
      torqueResponse: 0.4,
      pushResponse: 0.55,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "both",
      idealRootSize: "normal"
    }
  },
  {
    id: "AL1",
    name: "Amplatz Left 1",
    seatCue: "Amplatz seats deep and hard \u2014 advance to prolapse the tip up to disengage (never yank back). Watch the pressure for damping.",
    category: "diagnostic",
    target: "left",
    curveSize: "AL1",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Difficult left coronary engagement; also useful for anomalous or high take-offs.",
    usualTarget: "Left main (and problem RCA)",
    bestAnatomy: "Wide/horizontal root, difficult LM.",
    badAnatomy: "Small root \u2014 very easy to deep-seat and damp.",
    commonMistakes: [
      "Forgetting Amplatz shapes deep-seat aggressively \u2014 advancing causes deep LM engagement and damping.",
      "Withdrawing to disengage without first pushing the tip out of the ostium (it can dive deeper)."
    ],
    teachingTips: [
      "Powerful but unforgiving. Watch the pressure trace continuously for damping.",
      "Disengage by advancing to prolapse the tip up, not by yanking back."
    ],
    behaviour: {
      reach: 16,
      naturalAzimuth: LM_AZ,
      seatHeight: 13,
      torqueResponse: 0.55,
      pushResponse: 0.7,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "normal"
    }
  },
  {
    id: "AL2",
    name: "Amplatz Left 2",
    category: "diagnostic",
    target: "left",
    curveSize: "AL2",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Left coronary in a larger or horizontal root when AL1 falls short.",
    usualTarget: "Left main",
    bestAnatomy: "Dilated/horizontal root.",
    badAnatomy: "Small/normal root \u2014 deep-seats readily.",
    commonMistakes: ["Using AL2 where AL1 or a Judkins would be safer."],
    teachingTips: ["More reach than AL1 with the same deep-seating caution."],
    behaviour: {
      reach: 20,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.7,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.7,
      shapedFor: "left",
      idealRootSize: "dilated"
    }
  },
  {
    id: "AR",
    name: "Amplatz Right (mod.)",
    seatCue: "For a high / shepherds-crook RCA: reach up onto the cusp shelf and torque to face the anterior ostium.",
    category: "diagnostic",
    target: "right",
    curveSize: "AR mod",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Difficult RCA \u2014 high, anterior or shepherd's-crook take-off.",
    usualTarget: "RCA",
    bestAnatomy: "High/anterior RCA, shepherd's crook.",
    badAnatomy: "Simple RCA where JR4 is gentler.",
    commonMistakes: ["Aggressive seating causing RCA damping / ventricularisation."],
    teachingTips: [
      "When JR4 can't find a high anterior RCA, the Amplatz Right reaches up onto the cusp shelf."
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: RCA_AZ,
      seatHeight: 15,
      torqueResponse: 0.55,
      pushResponse: 0.65,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.6,
      shapedFor: "right",
      idealRootSize: "normal"
    }
  },
  {
    id: "MP",
    name: "Multipurpose",
    category: "diagnostic",
    target: "right",
    curveSize: "MPA",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Inferior/horizontal RCA take-off, some bypass grafts, straight-down engagement.",
    usualTarget: "RCA (downgoing), grafts",
    bestAnatomy: "Downward-pointing RCA ostium.",
    badAnatomy: "Superiorly directed take-offs.",
    commonMistakes: ["Advancing the straight tip into the LV when the ostium is high."],
    teachingTips: ["Engages by advancing gently when the ostium points downward."],
    behaviour: {
      reach: 17,
      naturalAzimuth: RCA_AZ,
      seatHeight: 10,
      torqueResponse: 0.5,
      pushResponse: 0.6,
      prolapseTendency: 0.4,
      deepEngagementRisk: 0.4,
      shapedFor: "right",
      idealRootSize: "normal"
    }
  },
  {
    id: "EBU3.0",
    name: "EBU / XB 3.0 (guide)",
    category: "guide",
    target: "left",
    curveSize: "3.0",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a small/normal root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Small\u2013normal root for PCI backup.",
    badAnatomy: "Dilated root (poor backup); diagnostic-only cases (over-kill).",
    commonMistakes: ["Deep guide engagement and damping while chasing support."],
    teachingTips: [
      "Extra-backup shapes rest on the opposite wall for support and engage deeper \u2014 watch pressure."
    ],
    behaviour: {
      reach: 16.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.6,
      shapedFor: "left",
      idealRootSize: "small"
    }
  },
  {
    id: "EBU3.5",
    name: "EBU / XB 3.5 (guide)",
    category: "guide",
    target: "left",
    curveSize: "3.5",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a normal root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Normal root PCI.",
    badAnatomy: "Diagnostic study where a Judkins is gentler.",
    commonMistakes: ["Deep seating; damping the LM while seeking backup."],
    teachingTips: ["The workhorse left guide \u2014 supportive and prone to deep engagement."],
    behaviour: {
      reach: 18.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "normal"
    }
  },
  {
    id: "EBU4.0",
    name: "EBU / XB 4.0 (guide)",
    category: "guide",
    target: "left",
    curveSize: "4.0",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a larger root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Larger root PCI.",
    badAnatomy: "Small root \u2014 very deep, unstable seating.",
    commonMistakes: ["Using 4.0 in a small root, causing deep engagement and damping."],
    teachingTips: ["Sized like the ascending aorta width; too big and it dives into the LM."],
    behaviour: {
      reach: 20.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "dilated"
    }
  },
  {
    id: "IKL",
    name: "Ikari Left",
    category: "universal",
    target: "left",
    curveSize: "IL",
    support: "high",
    aggressiveness: "moderate",
    bestUse: "Radial left coronary with extra backup; can behave as diagnostic or guide.",
    usualTarget: "Left main",
    bestAnatomy: "Radial access, normal root.",
    badAnatomy: "Dilated root.",
    commonMistakes: ["Treating it exactly like a JL \u2014 the seating manoeuvre differs on radial."],
    teachingTips: ["A radial-friendly left shape offering more support than a JL4."],
    behaviour: {
      reach: 17.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.6,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.45,
      shapedFor: "left",
      idealRootSize: "normal"
    }
  },
  {
    id: "IKR",
    name: "Ikari Right",
    category: "universal",
    target: "right",
    curveSize: "IR",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Radial RCA engagement with backup.",
    usualTarget: "RCA",
    bestAnatomy: "Radial access, normal RCA.",
    badAnatomy: "Very high anterior take-off.",
    commonMistakes: ["Pushing rather than torquing to seat."],
    teachingTips: ["A radial right shape \u2014 torque and gentle withdrawal, as with a JR."],
    behaviour: {
      reach: 17,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.6,
      pushResponse: 0.55,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.4,
      shapedFor: "right",
      idealRootSize: "normal"
    }
  },
  {
    id: "PIG",
    name: "Pigtail",
    category: "pigtail",
    target: "lv",
    curveSize: "pigtail",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "Aortic root angiography and LV pressure/ventriculography \u2014 NOT selective coronary work.",
    usualTarget: "Aortic root / left ventricle",
    bestAnatomy: "Any \u2014 for root shots and pressures.",
    badAnatomy: "You cannot selectively engage a coronary with a pigtail.",
    commonMistakes: ["Trying to engage a coronary ostium selectively with a pigtail."],
    teachingTips: [
      "Use the pigtail to learn root anatomy and pressure \u2014 its looped tip cannot cannulate an ostium.",
      "Cross the valve carefully; the loop resists dropping into the LV unless you push it."
    ],
    behaviour: {
      reach: 6,
      naturalAzimuth: NEUTRAL_AZ,
      seatHeight: 4,
      torqueResponse: 0.2,
      pushResponse: 0.5,
      prolapseTendency: 0.15,
      deepEngagementRisk: 0.05,
      shapedFor: "root",
      idealRootSize: "normal"
    }
  }
];
var catheterById = (id) => CATHETERS.find((c2) => c2.id === id);

// entry.ts
var RES = 768;
var canvas = document.createElement("canvas");
canvas.width = RES;
canvas.height = RES;
document.body.appendChild(canvas);
var xr = XrayRenderer.create(canvas);
xr.resize(RES);
var gl = xr.gl;
var c = CASE_LIBRARY[0];
var model = buildAnatomy(c);
var tree = buildCoronaryTree(model, c);
var left = [...new Set(tree.vessels.filter((v3) => v3.side === "left").map((v3) => v3.fillId))];
var right = [...new Set(tree.vessels.filter((v3) => v3.side === "right").map((v3) => v3.fillId))];
var lastScene = null;
function sceneFor(o) {
  const side = o.side ?? "left";
  const cath = catheterById(side === "left" ? "JL4" : "JR4");
  const os = side === "left" ? model.lm : model.rca;
  const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
  const root = catheterPath(model, tip, cath);
  const bt = o.bt ?? null;
  const r = buildXrayScene({
    model,
    caseData: c,
    tree,
    catheterRoot: root,
    french: 6,
    wire: null,
    bolus: bt !== null ? { filled: side === "left" ? left : right, plume: "none", side, t: bt, injectDur: 1.8, peak: 1 } : null,
    t: o.t ?? 0,
    cArm: { laoRao: o.lao, cranialCaudal: o.cran },
    field: o.field ?? 230,
    centreOn: side,
    mode: o.mode ?? "cine",
    breathHold: o.hold === void 0 ? 0.7 : o.hold,
    frame: o.frame ?? 1
  });
  if (o.tune) Object.assign(r.params, o.tune);
  lastScene = r.scene;
  return r;
}
function render(o) {
  const { scene, params } = sceneFor(o);
  xr.render(scene, params);
  const px = new Uint8Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const g = new Uint8Array(RES * RES);
  for (let y = 0; y < RES; y++) for (let x = 0; x < RES; x++) g[y * RES + x] = px[((RES - 1 - y) * RES + x) * 4];
  return g;
}
function resample2(src, n, m) {
  const out = new Float32Array(m * m);
  const s = n / m;
  for (let y = 0; y < m; y++)
    for (let x = 0; x < m; x++) {
      let acc = 0, w = 0;
      const x0 = x * s, x1 = (x + 1) * s, y0 = y * s, y1 = (y + 1) * s;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++)
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          const wx = Math.min(x1, xx + 1) - Math.max(x0, xx);
          const wy = Math.min(y1, yy + 1) - Math.max(y0, yy);
          const ww = wx * wy;
          acc += src[yy * n + xx] * ww;
          w += ww;
        }
      out[y * m + x] = acc / w;
    }
  return out;
}
async function jpegRoundTrip(img, n, q = 0.72) {
  const cv = document.createElement("canvas");
  cv.width = n;
  cv.height = n;
  const ctx = cv.getContext("2d");
  const id = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v3 = Math.max(0, Math.min(255, Math.round(img[i])));
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v3;
    id.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  const blob = await new Promise((res) => cv.toBlob((b) => res(b), "image/jpeg", q));
  const bmp = await createImageBitmap(blob);
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, n, n).data;
  const out = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) out[i] = d[i * 4];
  return out;
}
async function simLib(o) {
  const g = render(o);
  return jpegRoundTrip(resample2(g, RES, 512), 512);
}
async function loadGray(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("fetch " + url + " " + r.status);
  const bmp = await createImageBitmap(await r.blob());
  const cv = document.createElement("canvas");
  cv.width = bmp.width;
  cv.height = bmp.height;
  const ctx = cv.getContext("2d");
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  const out = new Float32Array(bmp.width * bmp.height);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4];
  return { w: bmp.width, h: bmp.height, d: out };
}
function fft1(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len2 = 2; len2 <= n; len2 <<= 1) {
    const ang = -2 * Math.PI / len2;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len2) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len2 / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len2 / 2] * cr - im[i + k + len2 / 2] * ci;
        const bi = re[i + k + len2 / 2] * ci + im[i + k + len2 / 2] * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + len2 / 2] = ar - br;
        im[i + k + len2 / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}
function power2(block2, N) {
  const re = new Float64Array(block2), im = new Float64Array(N * N);
  const rr = new Float64Array(N), ri = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      rr[x] = re[y * N + x];
      ri[x] = im[y * N + x];
    }
    fft1(rr, ri);
    for (let x = 0; x < N; x++) {
      re[y * N + x] = rr[x];
      im[y * N + x] = ri[x];
    }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      rr[y] = re[y * N + x];
      ri[y] = im[y * N + x];
    }
    fft1(rr, ri);
    for (let y = 0; y < N; y++) {
      re[y * N + x] = rr[y];
      im[y * N + x] = ri[y];
    }
  }
  const p = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) p[i] = (re[i] * re[i] + im[i] * im[i]) / (N * N);
  return p;
}
function radial2(p, N, nb = 16, excludeAxes = false) {
  const acc = new Float64Array(nb), cnt = new Float64Array(nb);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const fx = (x < N / 2 ? x : x - N) / N, fy = (y < N / 2 ? y : y - N) / N;
      if (excludeAxes && (fx === 0 || fy === 0)) continue;
      const f2 = Math.hypot(fx, fy);
      if (f2 === 0 || f2 > 0.5) continue;
      const b = Math.min(nb - 1, Math.floor(f2 / 0.5 * nb));
      acc[b] += p[y * N + x];
      cnt[b]++;
    }
  const f = [], v3 = [];
  for (let b = 0; b < nb; b++) {
    f.push((b + 0.5) / nb * 0.5);
    v3.push(cnt[b] ? acc[b] / cnt[b] : 0);
  }
  return { f, v: v3 };
}
function block(img, W, x0, y0, N, detrend = true, hann = false) {
  const b = new Float64Array(N * N);
  let sx = 0, sy = 0, s = 0, sxx = 0, syy = 0, sxv = 0, syv = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v3 = img[(y0 + y) * W + x0 + x];
      b[y * N + x] = v3;
      s += v3;
    }
  const mean = s / (N * N);
  const c2 = (N - 1) / 2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v3 = b[y * N + x] - mean;
      sxv += (x - c2) * v3;
      syv += (y - c2) * v3;
      sxx += (x - c2) * (x - c2);
      syy += (y - c2) * (y - c2);
    }
  const ax = detrend ? sxv / sxx : 0, ay = detrend ? syv / syy : 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v3 = b[y * N + x] - mean - ax * (x - c2) - ay * (y - c2);
      if (hann) v3 *= (0.5 - 0.5 * Math.cos(2 * Math.PI * (x + 0.5) / N)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (y + 0.5) / N));
      b[y * N + x] = v3;
    }
  return b;
}
var variance = (b) => {
  let s = 0;
  for (const v3 of b) s += v3 * v3;
  return s / b.length;
};
function stats(a) {
  const s = Array.from(a).sort((x, y) => x - y);
  const q = (p) => s[Math.floor(p * (s.length - 1))];
  let m = 0;
  for (const v3 of a) m += v3;
  return { mean: m / a.length, p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) };
}
function noiseAnalysis(f1, f2, f3, W, N = 32, frac = 0.15, margin = 24) {
  const blocks = [];
  const mean = new Float32Array(W * W);
  for (let i = 0; i < W * W; i++) mean[i] = (f1[i] + f2[i] + f3[i]) / 3;
  for (let y = margin; y + N <= W - margin; y += N / 2)
    for (let x = margin; x + N <= W - margin; x += N / 2) {
      const b = block(mean, W, x, y, N, true);
      let m = 0;
      for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) m += mean[(y + yy) * W + x + xx];
      m /= N * N;
      if (m < 25 || m > 230) continue;
      blocks.push({ x, y, struct: variance(b), mean: m });
    }
  blocks.sort((a, b) => a.struct - b.struct);
  const sel = blocks.slice(0, Math.max(4, Math.floor(blocks.length * frac)));
  const d1 = new Float32Array(W * W), d2 = new Float32Array(W * W);
  for (let i = 0; i < W * W; i++) {
    d1[i] = f2[i] - f1[i];
    d2[i] = f3[i] - f2[i];
  }
  let sig = 0, c12 = 0, v1 = 0, v22 = 0, ax1 = 0, ay1 = 0, ax2 = 0, ay2 = 0, vv = 0;
  const npsAcc = new Float64Array(16);
  const perMean = [];
  for (const s of sel) {
    const b1 = block(d1, W, s.x, s.y, N, true), b2 = block(d2, W, s.x, s.y, N, true);
    const var1 = variance(b1);
    sig += var1 / 2;
    perMean.push([s.mean, Math.sqrt(var1 / 2)]);
    for (let i = 0; i < N * N; i++) {
      c12 += b1[i] * b2[i];
      v1 += b1[i] * b1[i];
      v22 += b2[i] * b2[i];
    }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v3 = b1[y * N + x];
        vv += v3 * v3;
        if (x + 1 < N) ax1 += v3 * b1[y * N + x + 1];
        if (y + 1 < N) ay1 += v3 * b1[(y + 1) * N + x];
        if (x + 2 < N) ax2 += v3 * b1[y * N + x + 2];
        if (y + 2 < N) ay2 += v3 * b1[(y + 2) * N + x];
      }
    const r = radial2(power2(b1, N), N, 16);
    for (let k = 0; k < 16; k++) npsAcc[k] += r.v[k] / 2 / sel.length;
  }
  const n = sel.length;
  const nf = (N - 1) / N, nf2 = (N - 2) / N;
  const tot = npsAcc.reduce((a, b) => a + b, 0);
  return {
    blocks: n,
    meanGrey: sel.reduce((a, s) => a + s.mean, 0) / n,
    sigma: Math.sqrt(sig / n),
    tempCorrD: c12 / Math.sqrt(v1 * v22),
    recursionEstimate: 1 + 2 * (c12 / Math.sqrt(v1 * v22)),
    rho_x1: ax1 / vv / nf,
    rho_y1: ay1 / vv / nf,
    rho_x2: ax2 / vv / nf2,
    rho_y2: ay2 / vv / nf2,
    npsShape: Array.from(npsAcc).map((v3) => +(v3 / (tot / 16)).toFixed(3)),
    hiLoRatio: (npsAcc[13] + npsAcc[14] + npsAcc[15]) / (npsAcc[1] + npsAcc[2] + npsAcc[3]),
    perMean
  };
}
function anatSpectrum(img, W, N = 256, f0 = 8e-3, f1 = 0.08) {
  const x0 = Math.floor((W - N) / 2);
  const b = block(img, W, x0, x0, N, true, true);
  const r = radial2(power2(b, N), N, 64, true);
  const xs = [], ys = [];
  for (let k = 0; k < r.f.length; k++)
    if (r.f[k] >= f0 && r.f[k] <= f1 && r.v[k] > 0) {
      xs.push(Math.log(r.f[k]));
      ys.push(Math.log(r.v[k]));
    }
  const mx = xs.reduce((a, b2) => a + b2, 0) / xs.length, my = ys.reduce((a, b2) => a + b2, 0) / ys.length;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  return { beta: -sxy / sxx, f: r.f, v: r.v };
}
function bilinear(img, W, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const g = (xx, yy) => img[Math.max(0, Math.min(W - 1, yy)) * W + Math.max(0, Math.min(W - 1, xx))];
  return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
}
function lineProfile(img, W, ax, ay, bx, by, half = 14, step = 0.25) {
  const L = Math.hypot(bx - ax, by - ay);
  const tx = (bx - ax) / L, ty = (by - ay) / L;
  const nx = -ty, ny = tx;
  const K = Math.round(2 * half / step) + 1;
  const acc = new Float64Array(K);
  let cnt = 0;
  for (let s = 0; s <= L; s += 1) {
    const cx = ax + tx * s, cy = ay + ty * s;
    let best = 1e9, bo = 0;
    for (let o = -4; o <= 4; o += 0.25) {
      const v3 = bilinear(img, W, cx + nx * o, cy + ny * o);
      if (v3 < best) {
        best = v3;
        bo = o;
      }
    }
    for (let k = 0; k < K; k++) {
      const o = -half + k * step + bo;
      acc[k] += bilinear(img, W, cx + nx * o, cy + ny * o);
    }
    cnt++;
  }
  const prof = Array.from(acc).map((v3) => v3 / cnt);
  const xs = prof.map((_, k) => -half + k * step);
  const outer = prof.filter((_, k) => Math.abs(xs[k]) >= half - 3);
  const bg = outer.reduce((a, b) => a + b, 0) / outer.length;
  const mn = Math.min(...prof);
  const halfLvl = (bg + mn) / 2;
  let l = 0, r = 0;
  const ci = prof.indexOf(mn);
  for (let k = ci; k >= 0; k--)
    if (prof[k] >= halfLvl) {
      l = xs[k];
      break;
    }
  for (let k = ci; k < K; k++)
    if (prof[k] >= halfLvl) {
      r = xs[k];
      break;
    }
  let ov = -1e9;
  for (let k = 0; k < K; k++) if (xs[k] < l - 0.5 && xs[k] > l - 8 || xs[k] > r + 0.5 && xs[k] < r + 8) ov = Math.max(ov, prof[k]);
  const lv10 = mn + 0.1 * (bg - mn), lv90 = mn + 0.9 * (bg - mn);
  let e10 = 0, e90 = 0;
  for (let k = ci; k >= 0; k--) {
    if (!e10 && prof[k] >= lv10) e10 = xs[k];
    if (prof[k] >= lv90) {
      e90 = xs[k];
      break;
    }
  }
  return { fwhm: r - l, depth: bg - mn, bg, overshootFrac: (ov - bg) / (bg - mn), edge10_90: e10 - e90, samples: cnt, prof: prof.filter((_, k) => k % 4 === 0).map((v3) => +v3.toFixed(1)) };
}
function motion(fa, fb, W, N = 24, search = 14, top = 12, margin = 40) {
  const cands = [];
  for (let y = margin; y + N <= W - margin; y += N)
    for (let x = margin; x + N <= W - margin; x += N) {
      const b = block(fa, W, x, y, N, true);
      cands.push({ x, y, v: variance(b) });
    }
  cands.sort((a, b) => b.v - a.v);
  const out = [];
  for (const c2 of cands.slice(0, top)) {
    let best = 1e18, bd = [0, 0];
    for (let dy = -search; dy <= search; dy++)
      for (let dx = -search; dx <= search; dx++) {
        let s = 0;
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            const d = fa[(c2.y + y) * W + c2.x + x] - fb[(c2.y + y + dy) * W + c2.x + x + dx];
            s += d * d;
          }
        if (s < best) {
          best = s;
          bd = [dx, dy];
        }
      }
    out.push(Math.hypot(bd[0], bd[1]));
  }
  out.sort((a, b) => a - b);
  return { median: out[Math.floor(out.length / 2)], max: out[out.length - 1], all: out };
}
function timing(o, n = 30) {
  render(o);
  const tScene = [], tAll = [];
  for (let i = 0; i < n; i++) {
    const a = performance.now();
    const { scene, params } = sceneFor({ ...o, frame: i + 2, t: i / 15 });
    const b = performance.now();
    xr.render(scene, params);
    const px = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const e = performance.now();
    tScene.push(b - a);
    tAll.push(e - a);
  }
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const tubes = lastScene.tubes.length;
  let pts = 0;
  for (const t of lastScene.tubes) pts += t.pts.length;
  return { sceneMs: med(tScene), totalMs: med(tAll), tubes, tubePts: pts, bones: lastScene.bones.length, renderer: gl.getParameter(gl.RENDERER), ext: !!gl.getExtension("EXT_disjoint_timer_query_webgl2") };
}
function gpuTiming(o, n = 20) {
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  if (!ext) return null;
  return new Promise((res) => {
    const qs = [];
    for (let i = 0; i < n; i++) {
      const { scene, params } = sceneFor({ ...o, frame: i + 2, t: i / 15 });
      const q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      xr.render(scene, params);
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      qs.push(q);
    }
    const poll = () => {
      const last = qs[qs.length - 1];
      if (!gl.getQueryParameter(last, gl.QUERY_RESULT_AVAILABLE)) return setTimeout(poll, 50);
      const ms = qs.map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
      res({ medianMs: ms[Math.floor(ms.length / 2)], minMs: ms[0], maxMs: ms[ms.length - 1] });
    };
    poll();
  });
}
function project(p) {
  return XrayRenderer.project(lastScene.cam, p);
}
window.H = {
  render,
  renderScene: (scene, params) => xr.render(scene, params),
  xr,
  sceneFor,
  simLib,
  resample: resample2,
  jpegRoundTrip,
  loadGray,
  noiseAnalysis,
  anatSpectrum,
  lineProfile,
  motion,
  stats,
  timing,
  gpuTiming,
  project,
  get scene() {
    return lastScene;
  },
  model,
  tree,
  canvas
};
document.title = "harness ready";
