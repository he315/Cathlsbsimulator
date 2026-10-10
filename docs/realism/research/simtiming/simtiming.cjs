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
var LEFT_VESSELS = [
  "LM",
  "LAD",
  "LCx",
  "D1",
  "D2",
  "OM1",
  "OM2",
  "RAMUS",
  "SEPTAL"
];
var RIGHT_VESSELS = ["RCA", "CONUS", "AM", "PDA", "PLV"];

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
  const radial2 = access !== "femoral";
  if (variants.includes("horizontal-aorta")) return ["AL1", "JL4"];
  if (rootSize === "small") return radial2 ? ["JL3.5", "TIG"] : ["JL3.5"];
  if (rootSize === "dilated") return ["JL4.5", "JL5"];
  return radial2 ? ["JL4", "TIG"] : ["JL4"];
}
function recommendedRight(variants, access) {
  const radial2 = access !== "femoral";
  if (variants.includes("high-rca") || variants.includes("superior-rca") || variants.includes("shepherds-crook-rca") || variants.includes("anterior-rca"))
    return ["AR", "JR4"];
  return radial2 ? ["JR4", "IKR", "TIG"] : ["JR4"];
}
function requiredViewsFor(focus) {
  const left = ["spider", "raocranial", "laocranial", "raocaudal"];
  const right = ["rcalao", "rcarao"];
  if (focus === "left") return left;
  if (focus === "right") return right;
  return [...left.slice(0, 3), ...right];
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
  const grow = (start, dir, len, rad, depth, side) => {
    const pts = [start];
    const radii = [rad];
    let p = start;
    let d = nrm2(dir);
    const steps = Math.max(3, Math.round(len / 6));
    for (let i = 1; i <= steps; i++) {
      d = nrm2(add3(d, v2((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25 - 0.04, (rnd() - 0.5) * 0.25)));
      p = add3(p, sc2(d, len / steps));
      const lc = side < 0 ? v2(-80, 20 - 15 * resp, -42) : v2(84, 10 - 15 * resp, -46);
      const q = v2((p.x - lc.x) / 62, (p.y - lc.y) / 130, (p.z - lc.z) / 82);
      if (q.x * q.x + q.y * q.y + q.z * q.z > 0.85) d = nrm2(add3(d, sc2(nrm2(add3(lc, sc2(p, -1))), 0.6)));
      pts.push(p);
      radii.push(rad * (1 - 0.35 * (i / steps)));
    }
    out.push({ pts, r: radii, mu: [LUNG_VESSEL_MU, 0, 0] });
    if (depth <= 0 || rad < 0.45) return;
    const nChild = depth > 3 ? 2 : rnd() < 0.7 ? 2 : 3;
    for (let c = 0; c < nChild; c++) {
      const spread = 0.45 + rnd() * 0.5;
      const nd = nrm2(add3(d, v2((rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 1.4)));
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
    const a = get(i - 1), b = get(i), c = get(i + 1), d = get(i + 2);
    const seg = Math.hypot(c.x - b.x, c.y - b.y, c.z - b.z);
    const n = Math.max(1, Math.ceil(seg / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (p, q, r, s) => 0.5 * (2 * q + (-p + r) * t + (2 * p - 5 * q + 4 * r - s) * t2 + (-p + 3 * q - 3 * r + s) * t3);
      out.push({ x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y), z: f(a.z, b.z, c.z, d.z) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
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
      const left = b.side === "left";
      let c = V3.add(H.base, V3.sc(H.L, H.len * 0.45));
      if (!left) c = V3.add(c, V3.add(V3.sc(H.S, -18), V3.sc(H.A, 12)));
      const k = 1 - 0.12 * e;
      bones.push({
        type: 0,
        c: moveWorld(c, 1),
        ax: [H.L, H.A, H.S],
        half: [H.len * 0.52 * k, (left ? 46 : 36) * k, (left ? 50 : 38) * k],
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

// simtiming.ts
function signal(scene, iodineOnlyCoronary) {
  let s = 0;
  for (const t of scene.tubes) {
    if (!Array.isArray(t.mu[0])) continue;
    for (let i = 1; i < t.pts.length; i++) {
      const a = t.pts[i - 1], b = t.pts[i];
      const ds = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      const mu = t.mu[i][1];
      s += mu * Math.PI * t.r[i] * t.r[i] * ds;
    }
  }
  return s;
}
function run(label, side, duration, injectFrac, peak, cineLen) {
  const c = CASE_LIBRARY[0];
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const filled = side === "left" ? LEFT_VESSELS : RIGHT_VESSELS;
  const root = [{ x: 0, y: 60, z: 0 }, { x: 0, y: 20, z: 0 }];
  const vals = [];
  const n = Math.round(cineLen * 15);
  for (let f = 0; f < n; f++) {
    const t = f / 15;
    const { scene } = buildXrayScene({
      model,
      caseData: c,
      tree,
      catheterRoot: root,
      french: 5,
      wire: null,
      bolus: { filled, plume: "none", side, t, injectDur: duration * injectFrac, peak, lv: false },
      t: 10 + t,
      cArm: { laoRao: -30, cranialCaudal: -20 },
      field: 250,
      centreOn: side,
      pan: { x: 0, y: 0, z: 0 },
      mode: "cine",
      breathHold: 0.7,
      frame: f
    });
    vals.push(signal(scene, true));
  }
  const v0 = vals[0], vmax = Math.max(...vals);
  const rise = vmax - v0;
  const arr = vals.findIndex((x) => x >= v0 + 0.3 * rise);
  const above = vals.filter((x) => x >= v0 + 0.5 * rise).length;
  const pk = vals.indexOf(vmax);
  const endFrac = (vals[vals.length - 1] - v0) / rise;
  console.log(JSON.stringify({ label, frames: n, arrival_s: arr / 15, peak_s: pk / 15, above50_s: above / 15, end_fraction_of_peak: +endFrac.toFixed(2), curve: vals.map((x) => +(x / vmax).toFixed(2)) }));
}
run("diagnostic-left", "left", 4.8, 0.52, 0.95, 4.8);
run("diagnostic-right", "right", 4.8, 0.52, 0.95, 4.8);
run("pci-left", "left", 1.8 / 1, 1, 1, 4.2);
