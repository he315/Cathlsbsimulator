// ---------------------------------------------------------------------------
// Device catalogue for the rod physics: preformed shapes as curvature
// profiles, stiffness profiles along the device, sizes and wall friction.
//
// Shapes are written from the tip back as a list of arcs. Each arc turns the
// tangent by `turn` degrees over `len` mm, bending towards the material
// director d1 rotated by `roll` degrees about the tangent. Going from the hub
// to the tip the frame rotates by +κ·ds about the bending axis, so the free
// (unconstrained) device takes exactly this shape.
//
// Sources (docs/realism/facts/S7.md):
// - Judkins left: a 90° primary curve, a ~180° secondary curve and a straight
//   arm between them parallel to the shaft (US 5,445,625, Voda 1995, prior-art
//   description); the size number is the distance between the primary and
//   secondary curves in cm (Johnson Francis; TCMJ 2025; Cureus 2024), the primary curve engages the ostium and the secondary curve
//   rests on the contralateral aortic wall (TCMJ 2025; Medmastery handbook).
// - Extra-backup guides use one long smooth curve instead of two separate
//   curves (Medmastery PCI Essentials handbook).
// - French size: 1 Fr = 1/3 mm (Medmastery: "1 French (Fr) = 0.33 mm").
// - 0.035 in and 0.014 in wire diameters are definitions (1 in = 25.4 mm).
// - Flexural rigidity ranges: guidewire main shafts ~1–13 N·cm², 6 F
//   intermediate guide shafts ~5–10 N·cm² (Qiu et al. 2023); stiff 0.035 in
//   wires 9.5–158 GPa flexural modulus (Harrison et al. 2011).
// - Catheter on aorta friction coefficient 0.05–0.25 (Wagner et al. 2021
//   review, citing Dellimore et al.).
// Everything else (arc radii, transition lengths, tip softness, exact
// stiffness within the sourced ranges) is a model parameter, calibrated in
// the manoeuvre tests and marked as such.
// ---------------------------------------------------------------------------

import type { RodSpec } from "./rod";

export interface Arc {
  /** arc length (mm) */
  len: number;
  /** tangent turn over the arc (degrees); 0 for a straight piece */
  turn: number;
  /** bending-plane roll about the tangent (degrees), default 0 */
  roll?: number;
}

export type DeviceKind = "catheter" | "wire";

export interface DeviceSpec extends RodSpec {
  kind: DeviceKind;
  /** human name (neutral, no vendor names) */
  name: string;
  /** arcs from the tip back (for drawing and tests) */
  arcs: Arc[];
  /** French size for catheters, 0 for wires */
  french: number;
  /** wire diameter in inches for wires, 0 for catheters */
  inches: number;
  /** hydrophilic coating */
  hydrophilic: boolean;
}

export const FR_MM = 1 / 3;
export const INCH_MM = 25.4;

// Isotropic polymer tube: GJ = EI/(1+ν) with ν ≈ 0.4 (model parameter); metal wire ν ≈ 0.3.
const NU_POLY = 0.4;
const NU_METAL = 0.3;
/** braided catheter shaft: GJ as a fraction of the shaft EI (model parameter) */
const BRAID_GJ = 4.0;

/** Friction coefficients (static, kinetic) against the vessel wall — model parameters within the sourced 0.05–0.25 range. */
export const FRICTION = {
  catheter: { s: 0.1, k: 0.06 },
  hydrophilic: { s: 0.06, k: 0.04 },
  wire: { s: 0.12, k: 0.08 },
};

function curvatureFromArcs(arcs: Arc[]): (u: number, out: Float64Array) => void {
  const starts: number[] = [];
  let acc = 0;
  for (const a of arcs) {
    starts.push(acc);
    acc += a.len;
  }
  return (u, out) => {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      if (u >= starts[i] && u < starts[i] + a.len) {
        if (a.turn === 0) return;
        const k = ((a.turn * Math.PI) / 180) / a.len;
        const psi = ((a.roll ?? 0) * Math.PI) / 180;
        // bending towards cos ψ d1 + sin ψ d2: rotation axis d3 × n = (−sin ψ, cos ψ, 0)
        out[0] = -Math.sin(psi) * k;
        out[1] = Math.cos(psi) * k;
        return;
      }
    }
  };
}

/** Smooth step from a (u ≤ u0) to b (u ≥ u1). */
function ramp(u: number, u0: number, u1: number, a: number, b: number): number {
  if (u <= u0) return a;
  if (u >= u1) return b;
  const t = (u - u0) / (u1 - u0);
  return a + (b - a) * t * t * (3 - 2 * t);
}

interface CathOpts {
  id: string;
  name: string;
  arcs: Arc[];
  french?: number;
  guide?: boolean;
  /** shaft EI (N·mm²) — model parameter within the sourced range */
  EIshaft?: number;
  length?: number;
}

/**
 * A catheter: shaft stiffness EI (6 F diagnostic 500 N·mm², 6 F guide 750 N·mm²; Qiu 2023 gives
 * 5–10 N·cm² = 500–1000 N·mm² for 6 F intermediate guides), scaled by (OD/2 mm)^4 for other sizes
 * (Qiu 2023: self-similar catheters scale with OD⁴). The distal curve region is softer and the last
 * 2.5 mm is a soft tip (model parameters).
 */
export function makeCatheter(o: CathOpts): DeviceSpec {
  const fr = o.french ?? 6;
  const od = fr * FR_MM;
  const sizeScale = Math.pow(od / 2, 4);
  const EIs = (o.EIshaft ?? (o.guide ? 750 : 500)) * sizeScale;
  const curveLen = o.arcs.reduce((s, a) => s + a.len, 0);
  const EI = (u: number) => {
    // soft tip (model parameter: 8% of the shaft over the last 2.5 mm); preformed curve region 25% of the
    // shaft for diagnostic catheters, 35% for guides (model parameters)
    const cf = o.guide ? 0.35 : 0.25;
    const tip = ramp(u, 2.5, 5, 0.08, cf);
    const body = ramp(u, curveLen + 10, curveLen + 60, cf, 1);
    return EIs * (u < 5 ? tip : body);
  };
  // braided shaft: torsional stiffness not below the bending stiffness of the shaft (model parameter;
  // an unbraided isotropic tube would have GJ = EI/(1+ν))
  const GJ = (u: number) => Math.max(EI(u) / (1 + NU_POLY), EIs * BRAID_GJ * ramp(u, 2.5, 20, 0.2, 1));
  const f = FRICTION.catheter;
  return {
    kind: "catheter",
    id: o.id,
    name: o.name,
    arcs: o.arcs,
    french: fr,
    inches: 0,
    hydrophilic: false,
    length: o.length ?? 1000,
    radius: od / 2,
    innerRadius: o.guide ? od / 2 - 0.1 : od / 2 - 0.3, // model parameters: guide wall 0.1 mm, diagnostic 0.3 mm
    EI,
    GJ,
    EA: 450 * sizeScale, // model parameter (polymer tube, E·A ≈ 300 MPa × 1.5 mm²)
    rest: curvatureFromArcs(o.arcs),
    muStatic: f.s,
    muKinetic: f.k,
    // segmentation (model parameter): 3 mm through the preformed curve, 30 mm along the shaft
    segFine: 3,
    segFineZone: Math.max(120, curveLen + 40),
    segCoarse: 30,
  };
}

interface WireOpts {
  id: string;
  name: string;
  inches: number;
  /** core flexural modulus (MPa = N/mm²) — model parameter or sourced (Harrison 2011) */
  Ecore: number;
  /** floppy distal length (mm) and its stiffness fraction */
  floppy: number;
  floppyFrac: number;
  transition: number;
  arcs: Arc[];
  hydrophilic?: boolean;
  length?: number;
}

export function makeWire(o: WireOpts): DeviceSpec {
  const d = o.inches * INCH_MM;
  const I = (Math.PI * Math.pow(d, 4)) / 64;
  const EIcore = o.Ecore * I;
  const EI = (u: number) => EIcore * ramp(u, o.floppy, o.floppy + o.transition, o.floppyFrac, 1);
  const GJ = (u: number) => EI(u) / (1 + NU_METAL);
  const f = o.hydrophilic ? FRICTION.hydrophilic : FRICTION.wire;
  return {
    kind: "wire",
    id: o.id,
    name: o.name,
    arcs: o.arcs,
    french: 0,
    inches: o.inches,
    hydrophilic: !!o.hydrophilic,
    length: o.length ?? 1500,
    radius: d / 2,
    innerRadius: 0,
    EI,
    GJ,
    EA: o.Ecore * (Math.PI * d * d) / 4,
    rest: curvatureFromArcs(o.arcs),
    muStatic: f.s,
    muKinetic: f.k,
    segFine: 2.5,
    segFineZone: 130,
    segCoarse: 12,
  };
}

// ---------------------------------------------------------------------------
// Shapes (model parameters unless stated; see header for the sourced features)
// ---------------------------------------------------------------------------

/**
 * Shape parameters of the Judkins families (mm and degrees). Mutable so the calibration
 * (calibration/calibrate.ts) can search them; the catalogue builds each device from the current values.
 */
export const SHAPE_PARAMS = {
  /** Judkins left: tip straight, primary curve (length, turn), arm = 10·n + armOffset + armSlope·(n − 4), secondary curve of radius 4·secRadius + secSlope·(n − 4) turning secTurn */
  jl: { tip: 3, primaryLen: 9, primaryTurn: 90, armOffset: -6, armSlope: 0, secRadius: 5.5, secSlope: 5.5, secTurn: 180 },
  /** per-size overrides of the Judkins left curve (secondary radius in mm, secondary and primary turns in degrees) */
  jlBySize: {
    // JL5: a 22 mm secondary curve turning 185° and a 95° primary curve (instead of 27.5 mm, 180°, 90°). With
    // the wave-1 curve the JL5 engaged the dilated root in only 0-2 starts of 5; this curve, chosen by a scan
    // of secondary radius, secondary turn and primary turn over all validated configurations (docs/realism/
    // wave2/I3.md), engages it in 12 of 12 on the live anatomy and still engages a normal root less often
    // than the JL4 does.
    "5": { secRadiusMm: 22, secTurn: 185, primaryTurn: 95 },
    // JL6 (diag-engagement-technique-set): the JL5's curve opened by 3 mm (MODEL PARAMETER, not calibrated on a
    // root; the general formula would give a 33 mm secondary curve, larger than the JL5's by 11 mm)
    "6": { secRadiusMm: 25, secTurn: 185, primaryTurn: 95 },
  } as Record<string, { secRadiusMm?: number; secTurn?: number; primaryTurn?: number }>,
  /** Judkins right: tip straight, primary curve (length, turn), arm = 10·n + armOffset, secondary curve (length, turn) */
  jr: { tip: 3, primaryLen: 10, primaryTurn: 60, armOffset: -12, secLen: 22, secTurn: 30 },
  /** Amplatz left: tip straight, a reverse tip bend (length, turn), then the hook of radius hookBase + hookPerSize·size turning hookTurn */
  al: { tip: 4, bendLen: 6, bendTurn: -50, hookBase: 12, hookPerSize: 6, hookTurn: 130 },
};

/** Judkins left n (cm): 90° primary curve, a straight arm parallel to the shaft and a ~180° secondary
 *  curve (US 5,445,625). The size is the distance between the primary and secondary curves, which in
 *  the root spans the aorta from the contralateral wall (secondary curve) to the ostium (primary curve):
 *  JL4 for an ascending aorta up to ~38 mm (Cureus 2024; TCMJ 2025). Model parameters (SHAPE_PARAMS.jl):
 *  arm = n cm − 6 mm, secondary-curve radius 5.5·n mm (wider than the aorta, so the curve stays open across the root). */
export function judkinsLeft(n: number): Arc[] {
  const p = SHAPE_PARAMS.jl;
  const o = SHAPE_PARAMS.jlBySize[String(n)] ?? {};
  const Rs = o.secRadiusMm ?? 4 * p.secRadius + p.secSlope * (n - 4);
  const secTurn = o.secTurn ?? p.secTurn;
  return [
    { len: p.tip, turn: 0 },
    { len: p.primaryLen, turn: o.primaryTurn ?? p.primaryTurn },
    { len: 10 * n + p.armOffset + p.armSlope * (n - 4), turn: 0 },
    { len: (secTurn / 180) * Math.PI * Rs, turn: secTurn },
  ];
}

/** Judkins right n: a ~30° secondary bend, an arm of about n cm, then a primary curve that brings the
 *  tip to about 90° from the shaft so it meets the RCA ostium side-on (model parameters, SHAPE_PARAMS.jr). */
export function judkinsRight(n: number): Arc[] {
  const p = SHAPE_PARAMS.jr;
  return [
    { len: p.tip, turn: 0 },
    { len: p.primaryLen, turn: p.primaryTurn },
    { len: 10 * n + p.armOffset, turn: 0 },
    { len: p.secLen, turn: p.secTurn },
  ];
}

/** Amplatz left: a broad hooked curve with the tip angled back (model parameters, SHAPE_PARAMS.al; size → hook radius).
 *  The hook (radius 12 + 6·size mm, 130°: AL1 18 mm, AL2 24 mm, the sinus radius of the normal and the dilated model root) spans the root so that, seated in the left sinus, the tip reaches the
 *  ostial height and enters the left main from below with the Amplatz technique (manoeuvres.amplatzLeftTechnique);
 *  chosen by a scan of hook radius, turn and tip bend (docs/realism/wave2/I3.md). The wave-1 hook (7 + 3·size mm,
 *  200°) stood 25-30 mm tall in the sinus and never reached the ostium. */
export function amplatzLeft(size: number): Arc[] {
  const p = SHAPE_PARAMS.al;
  const Rb = p.hookBase + p.hookPerSize * size;
  return [
    { len: p.tip, turn: 0 },
    { len: p.bendLen, turn: p.bendTurn },
    { len: (p.hookTurn / 180) * Math.PI * Rb, turn: p.hookTurn },
  ];
}

export function amplatzRight(): Arc[] {
  return [
    { len: 4, turn: 0 },
    { len: 6, turn: -25 },
    { len: 26, turn: 120 },
  ];
}

export function multipurpose(): Arc[] {
  return [
    { len: 4, turn: 0 },
    { len: 16, turn: 35 },
  ];
}

/**
 * Left coronary bypass (diag-grafts-svg): a Judkins-right-like primary curve opened to about 75° on a longer arm and a
 * broader secondary curve, so that from the ascending aorta the tip reaches the anterior wall above the left coronary
 * ostium where left-sided vein grafts arise. MODEL PARAMETERS (the module text names the shape, not its geometry).
 */
export function leftCoronaryBypass(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 10, turn: 75 },
    { len: 36, turn: 0 },
    { len: 28, turn: 45 },
  ];
}

/**
 * Right coronary bypass (diag-grafts-svg): a Judkins right whose primary curve is tighter and hooks the tip downwards,
 * for right-sided vein grafts that angle down from the anterior aorta. MODEL PARAMETERS.
 */
export function rightCoronaryBypass(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 8, turn: 95 },
    { len: 30, turn: 0 },
    { len: 22, turn: 30 },
  ];
}

/**
 * Amplatz right of a size (diag-engagement-technique-set): the modified Amplatz right's reverse tip bend and hook,
 * with the hook radius growing with size (AR1 12 mm, AR2 15 mm). MODEL PARAMETERS (the module text names the shapes
 * and their use for an anterior RCA in a dilated root, Brilakis, 07-engaging.ts:674, :714; not their geometry).
 */
export function amplatzRightSized(size: number): Arc[] {
  const R = 9 + 3 * size;
  return [
    { len: 4, turn: 0 },
    { len: 6, turn: -25 },
    { len: (120 / 180) * Math.PI * R, turn: 120 },
  ];
}

/**
 * Hockey stick (diag-engagement-technique-set): a long straight tip limb set at about 60 degrees to the shaft by one
 * bend, so that from below the tip meets a steep upward take-off. MODEL PARAMETERS (Brilakis lists the shape for a
 * shepherd's crook RCA, 07-engaging.ts:677, :715; no geometry is given).
 */
export function hockeyStick(): Arc[] {
  return [
    { len: 18, turn: 0 },
    { len: 12, turn: 60 },
  ];
}

/**
 * Williams right (3DRC, diag-engagement-technique-set): a Judkins-right-like primary curve turned out of the plane of
 * a broad secondary curve, so the tip points towards the RCA ostium with little rotation. MODEL PARAMETERS (Oxford
 * names it as an alternative to the JR4 and for a shepherd's crook, 07-engaging.ts:673, :715).
 */
export function williamsRight(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 10, turn: 75, roll: 30 },
    { len: 24, turn: 0 },
    { len: 26, turn: 45 },
  ];
}

/** Extra-backup guide: one long smooth curve (Medmastery), a short primary bend (model parameters). */
export function extraBackup(n: number): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 8, turn: 45 },
    { len: 10 * n - 18, turn: 0 },
    { len: 55, turn: 120 },
  ];
}

/** Radial universal (tiger-type): a broad secondary curve and a primary curve in a slightly rotated plane (model). */
export function universalRadial(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 10, turn: 70, roll: 15 },
    { len: 22, turn: 0 },
    { len: 30, turn: 60 },
  ];
}

/** Ikari-type left: model parameters. */
export function ikariLeft(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 9, turn: 60 },
    { len: 24, turn: 0 },
    { len: 30, turn: 80 },
    { len: 20, turn: 0 },
    { len: 20, turn: -40 },
  ];
}

export function ikariRight(): Arc[] {
  return [
    { len: 3, turn: 0 },
    { len: 10, turn: 80 },
    { len: 26, turn: 0 },
    { len: 25, turn: 40 },
  ];
}

/** Pigtail: a ~1.1-turn loop of 8 mm diameter at the tip (model parameters). */
export function pigtail(): Arc[] {
  return [
    { len: 4 * Math.PI * 1.1 * 2, turn: 396 },
    { len: 6, turn: 0 },
  ];
}

const CATHETER_DEFS: Record<string, () => DeviceSpec> = {
  "JL3.5": () => makeCatheter({ id: "JL3.5", name: "Judkins left 3.5", arcs: judkinsLeft(3.5) }),
  JL4: () => makeCatheter({ id: "JL4", name: "Judkins left 4", arcs: judkinsLeft(4) }),
  "JL4.5": () => makeCatheter({ id: "JL4.5", name: "Judkins left 4.5", arcs: judkinsLeft(4.5) }),
  JL5: () => makeCatheter({ id: "JL5", name: "Judkins left 5", arcs: judkinsLeft(5) }),
  JL6: () => makeCatheter({ id: "JL6", name: "Judkins left 6", arcs: judkinsLeft(6) }),
  JR4: () => makeCatheter({ id: "JR4", name: "Judkins right 4", arcs: judkinsRight(4) }),
  "JR3.5": () => makeCatheter({ id: "JR3.5", name: "Judkins right 3.5", arcs: judkinsRight(3.5) }),
  "JR4.5": () => makeCatheter({ id: "JR4.5", name: "Judkins right 4.5", arcs: judkinsRight(4.5) }),
  JR5: () => makeCatheter({ id: "JR5", name: "Judkins right 5", arcs: judkinsRight(5) }),
  AL1: () => makeCatheter({ id: "AL1", name: "Amplatz left 1", arcs: amplatzLeft(1) }),
  AL2: () => makeCatheter({ id: "AL2", name: "Amplatz left 2", arcs: amplatzLeft(2) }),
  // diag-engagement-technique-set: the AL3 is a guide (Brilakis telescopes a 4 Fr catheter through a 6 Fr AL3)
  AL3: () => makeCatheter({ id: "AL3", name: "Amplatz left 3 guide", arcs: amplatzLeft(3), guide: true }),
  AR: () => makeCatheter({ id: "AR", name: "Amplatz right (modified)", arcs: amplatzRight() }),
  AR1: () => makeCatheter({ id: "AR1", name: "Amplatz right 1", arcs: amplatzRightSized(1) }),
  AR2: () => makeCatheter({ id: "AR2", name: "Amplatz right 2", arcs: amplatzRightSized(2) }),
  HS: () => makeCatheter({ id: "HS", name: "Hockey stick", arcs: hockeyStick() }),
  "3DRC": () => makeCatheter({ id: "3DRC", name: "Williams right", arcs: williamsRight() }),
  MP: () => makeCatheter({ id: "MP", name: "Multipurpose", arcs: multipurpose() }),
  LCB: () => makeCatheter({ id: "LCB", name: "Left coronary bypass", arcs: leftCoronaryBypass() }),
  RCB: () => makeCatheter({ id: "RCB", name: "Right coronary bypass", arcs: rightCoronaryBypass() }),
  TIG: () => makeCatheter({ id: "TIG", name: "Radial universal", arcs: universalRadial() }),
  "EBU3.0": () => makeCatheter({ id: "EBU3.0", name: "Extra-backup 3.0 guide", arcs: extraBackup(3), guide: true }),
  "EBU3.5": () => makeCatheter({ id: "EBU3.5", name: "Extra-backup 3.5 guide", arcs: extraBackup(3.5), guide: true }),
  "EBU3.75": () => makeCatheter({ id: "EBU3.75", name: "Extra-backup 3.75 guide", arcs: extraBackup(3.75), guide: true }),
  "EBU4.0": () => makeCatheter({ id: "EBU4.0", name: "Extra-backup 4.0 guide", arcs: extraBackup(4), guide: true }),
  "JL4G": () => makeCatheter({ id: "JL4G", name: "Judkins left 4 guide", arcs: judkinsLeft(4), guide: true }),
  "JR4G": () => makeCatheter({ id: "JR4G", name: "Judkins right 4 guide", arcs: judkinsRight(4), guide: true }),
  IKL: () => makeCatheter({ id: "IKL", name: "Radial left backup", arcs: ikariLeft() }),
  IKR: () => makeCatheter({ id: "IKR", name: "Radial right backup", arcs: ikariRight() }),
  PIG: () => makeCatheter({ id: "PIG", name: "Pigtail", arcs: pigtail(), EIshaft: 400 }),
};

/** Wires. 0.035 in J: core flexural modulus 13 GPa, EI ≈ 400 N·mm² = 4 N·cm² (model parameter inside Qiu 2023's 1–13 N·cm² guidewire range; Harrison 2011 measured 9.5–158 GPa for 'stiff' wires);
 *  J radius 3 mm (model). Extra-support: 29.2 GPa (Harrison 2011, "extra stiff" Amplatz). */
const WIRE_DEFS: Record<string, () => DeviceSpec> = {
  J: () =>
    makeWire({
      id: "J",
      name: "0.035 in J wire",
      inches: 0.035,
      Ecore: 13000,
      floppy: 30,
      floppyFrac: 0.03,
      transition: 40,
      arcs: [{ len: Math.PI * 3, turn: 180 }],
    }),
  J260: () => ({
    ...makeWire({
      id: "J260",
      name: "0.035 in J wire, exchange length",
      inches: 0.035,
      Ecore: 13000,
      floppy: 30,
      floppyFrac: 0.03,
      transition: 40,
      arcs: [{ len: Math.PI * 3, turn: 180 }],
      length: 2600, // model parameter: exchange-length wire, long enough to keep its place while a catheter comes off
    }),
  }),
  // diag-route-wire-led-radial: the exchange-length wire for radial exchanges ("Exchange-length wires
  // (250–300 cm, Oxford)", "a 0.035 or 0.038 inch wire 300 cm long, keeping its tip in the root",
  // src/content/manual/pci-manual/06-to-the-root.ts:121, :782); the J and the core as the standard J wire
  J300: () =>
    makeWire({
      id: "J300",
      name: "0.035 in J wire, 300 cm",
      inches: 0.035,
      Ecore: 13000,
      floppy: 30,
      floppyFrac: 0.03,
      transition: 40,
      arcs: [{ len: Math.PI * 3, turn: 180 }],
      length: 3000,
    }),
  // diag-route-wire-led-radial: the narrow-J radial wire, "Its J has a 1.5 mm radius instead of the
  // standard 3 mm, and it is designed for the radial route (Brilakis)" (06-to-the-root.ts:122); core and
  // floppy tip as the standard J wire (MODEL PARAMETERS)
  NARROWJ: () =>
    makeWire({
      id: "NARROWJ",
      name: "0.035 in narrow-J radial wire",
      inches: 0.035,
      Ecore: 13000,
      floppy: 30,
      floppyFrac: 0.03,
      transition: 40,
      arcs: [{ len: Math.PI * 1.5, turn: 180 }],
    }),
  STRAIGHT: () =>
    makeWire({ id: "STRAIGHT", name: "0.035 in straight wire", inches: 0.035, Ecore: 13000, floppy: 30, floppyFrac: 0.03, transition: 40, arcs: [] }),
  HYDRO: () =>
    makeWire({
      id: "HYDRO",
      name: "0.035 in hydrophilic angled wire",
      inches: 0.035,
      Ecore: 4000,
      floppy: 30,
      floppyFrac: 0.06,
      transition: 50,
      arcs: [{ len: 2, turn: 0 }, { len: 4, turn: 45 }],
      hydrophilic: true,
    }),
  SUPPORT: () =>
    makeWire({
      id: "SUPPORT",
      name: "0.035 in extra-support J wire",
      inches: 0.035,
      Ecore: 29200,
      floppy: 50,
      floppyFrac: 0.02,
      transition: 50,
      arcs: [{ len: Math.PI * 3, turn: 180 }],
    }),
  WORKHORSE: () =>
    makeWire({
      id: "WORKHORSE",
      name: "0.014 in workhorse coronary wire",
      inches: 0.014,
      Ecore: 60000, // model parameter (core taper, effective modulus)
      floppy: 30,
      floppyFrac: 0.03,
      transition: 120,
      arcs: [{ len: 1.5, turn: 0 }, { len: 2.5, turn: 40 }],
      length: 1900,
    }),
};

/** A stiff inner device shaft (balloon or stent delivery system) for backup tests — model parameters. */
export function innerDeviceSpec(): DeviceSpec {
  return makeWire({
    id: "DEVICE",
    name: "rapid-exchange device shaft",
    inches: 0.035,
    Ecore: 6000,
    floppy: 20,
    floppyFrac: 0.3,
    transition: 40,
    arcs: [],
    length: 1450,
  });
}

export function catheterSpec(id: string): DeviceSpec {
  const f = CATHETER_DEFS[id];
  if (!f) throw new Error(`no physics shape for catheter ${id}`);
  return f();
}

export function wireSpec(id: string): DeviceSpec {
  const f = WIRE_DEFS[id];
  if (!f) throw new Error(`no physics spec for wire ${id}`);
  return f();
}

export const CATHETER_IDS = Object.keys(CATHETER_DEFS);
export const WIRE_IDS = Object.keys(WIRE_DEFS);

/** The free (unconstrained) centre line of a device's distal arcs, in its own bending plane (x across, y along the shaft), for tests and drawing. */
export function freeShape(arcs: Arc[], step = 1): { x: number; y: number; z: number }[] {
  // integrate from the shaft towards the tip: walk arcs in reverse
  const pts: { x: number; y: number; z: number }[] = [];
  let px = 0, py = 0, pz = 0;
  // frame: tangent t (shaft points −y), d1 = +x, d2 = +z
  let t = [0, -1, 0];
  let d1 = [1, 0, 0];
  let d2 = [0, 0, -1];
  pts.push({ x: px, y: py, z: pz });
  for (let i = arcs.length - 1; i >= 0; i--) {
    const a = arcs[i];
    const steps = Math.max(1, Math.ceil(a.len / step));
    const ds = a.len / steps;
    const k = a.turn ? ((a.turn * Math.PI) / 180) / a.len : 0;
    const psi = ((a.roll ?? 0) * Math.PI) / 180;
    for (let s = 0; s < steps; s++) {
      px += t[0] * ds;
      py += t[1] * ds;
      pz += t[2] * ds;
      if (k) {
        // rotate the frame about axis b = −sin ψ d1 + cos ψ d2 by k·ds
        const ang = k * ds;
        const b = [0, 1, 2].map((j) => -Math.sin(psi) * d1[j] + Math.cos(psi) * d2[j]);
        const rot = (vv: number[]) => rotateAbout(vv, b, ang);
        t = rot(t);
        d1 = rot(d1);
        d2 = rot(d2);
      }
      pts.push({ x: px, y: py, z: pz });
    }
  }
  return pts;
}

function rotateAbout(v: number[], k: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const cx = k[1] * v[2] - k[2] * v[1], cy = k[2] * v[0] - k[0] * v[2], cz = k[0] * v[1] - k[1] * v[0];
  return [v[0] * c + cx * s + k[0] * kv * (1 - c), v[1] * c + cy * s + k[1] * kv * (1 - c), v[2] * c + cz * s + k[2] * kv * (1 - c)];
}
