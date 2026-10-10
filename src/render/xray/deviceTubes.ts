// ---------------------------------------------------------------------------
// Non-coronary devices on the X-ray renderer (work package
// xray-device-fluoro-views): the intra-aortic balloon pump with its tip
// marker, the microaxial pump across the aortic valve, ECMO cannulae, a
// temporary pacing lead, a balloon-tipped right heart catheter, the
// pericardial needle and J wire with the contrast-outlined sac, and the
// transseptal sheath, dilator and needle.
//
// Each device is a polyline anchored to thorax landmarks (carina, aortic arch
// and left subclavian origin, aortic valve, venae cavae, right atrium, right
// ventricle, pulmonary artery, left atrium, pericardium) and is returned as
// renderer TubeSpecs (R soft/bone excess, G iodine-like, B metal) and
// BonePrims, for buildXrayScene's public `extras` hook. No renderer file is
// changed.
//
// Frames. Everything here is in the thorax frame the anatomy shapes are built
// in (thorax.ts thoraxShapes, hardware.ts): the heart frame plus the breathing
// shift, without the aortic tilt that toWorld applies to the coronaries and
// the diagnostic catheter. The cardiac primitives (right and left atrium,
// ventricles, outflow tract) are taken from heartShape.heartShapes at the
// frame's motion, the same call the scene builder makes, so the devices sit in
// the silhouette the trainee sees. Thorax-fixed landmarks (carina, venae
// cavae, great vessels) mirror the constants of thorax.ts; the tests check
// that they stay inside the matching anatomy shapes.
//
// Sources. Positions and sizes that the module text gives are cited to it
// (src/content/manual/pci-manual/17-support-devices.ts: IABP tip level with the
// carina, Brilakis; just beyond the left subclavian origin, Oxford; IABP
// catheter 7.5 F; 40 mL balloon for most adults; microaxial pump inlet about
// 3.5 cm below the aortic valve and 9 Fr shaft; ECMO venous cannula 25 Fr with
// its tip at the SVC-RA junction, arterial 15 Fr for most women and 17 Fr for
// most men; src/content/manual/cath-handbook/04-cardiac-catheterisation.ts:
// 0.035 inch J wire). Attenuation comes from the NIST-derived values already in
// the renderer (hardware.ts METAL and PLASTIC, thorax.ts MU, the iodine
// concentration of injection.ts). Every other number is labelled MODEL
// PARAMETER: generic device shapes, not any manufacturer's design.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import { surfacePoint, type HeartFrame, type Motion } from "./heart";
import { heartShapes, HEART_SHAPE_NAMES } from "./heartShape";
import { ANATOMY_TUNE, DIAPHRAGM_DESCENT, MU, REFERENCE_GENOME, aorticCourse, thoraxGenome, type BonePrim, type TubeSpec } from "./thorax";
import { METAL, PLASTIC } from "./hardware";
import { CATHETER_WALL } from "./sceneBuilder";
import { IODINE_MG_PER_ML } from "../../simulation/injection";

// ---- vector helpers ---------------------------------------------------------

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const add = (a: Vec3, b: Vec3): Vec3 => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Vec3, b: Vec3): Vec3 => v(a.x - b.x, a.y - b.y, a.z - b.z);
const sc = (a: Vec3, k: number): Vec3 => v(a.x * k, a.y * k, a.z * k);
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const nrm = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};
const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, sc(sub(b, a), t));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ---- materials --------------------------------------------------------------

/**
 * Helium attenuation, absolute, per mm. MODEL PARAMETER: taken as 0, because the gas density is
 * about four orders of magnitude below that of soft tissue. A helium column displaces blood, so in
 * the renderer's excess-over-soft-tissue channel it is HELIUM_MU - MU.soft (negative: brighter).
 */
export const HELIUM_MU = 0;

/** Attenuation of the device materials in the renderer's channels (per mm). */
export const DEVICE_MU = {
  /** the soft-tissue baseline the body carries (thorax.ts MU.soft) */
  soft: MU.soft,
  /** helium (or air) column inside a balloon, excess over soft tissue (R channel) */
  gasExcess: HELIUM_MU - MU.soft,
  /**
   * catheter polymer, excess over the blood it displaces (R channel). MODEL PARAMETER: the device
   * polymers attenuate as PVC (hardware.ts PLASTIC.pvc, NIST at 60 keV, facts/S4.md).
   */
  polymerExcess: PLASTIC.pvc - MU.soft,
  /**
   * radio-opaque filler of catheter jackets, iodine-like channel. MODEL PARAMETER: the scene builder's
   * diagnostic catheter jacket (sceneBuilder CATHETER_WALL.jacket).
   */
  jacket: CATHETER_WALL.jacket,
  steel: METAL.steel,
  platinum: METAL.platinum,
  nitinol: METAL.nitinol,
  /** full-strength contrast in the iodine channel (thorax.ts MU.iodinePerMg x injection.ts IODINE_MG_PER_ML) */
  iodineFull: MU.iodinePerMg * IODINE_MG_PER_ML,
};

/** French size to outer radius (mm): 1 Fr = 1/3 mm of diameter (as sceneBuilder CATHETER_OD_MM). */
export const frToRadiusMm = (fr: number) => fr / 6;

/** Device sizes and placements. Cited values name their module location; the rest are model parameters. */
export const DEVICE_MODEL = {
  iabp: {
    /** catheter 7.5 F (Oxford, "usually 7.5 F or larger"; Brilakis 7-8 Fr): pci-manual/17-support-devices.ts, IABP lesson */
    fr: 7.5,
    /** 40 mL for most adults of average height (both charts): pci-manual/17-support-devices.ts, balloon sizing table */
    balloonMl: 40,
    /** MODEL PARAMETER: inflated length of the 40 mL balloon; other volumes scale it by the cube root of the volume ratio */
    balloonLengthMm40: 220,
    /** MODEL PARAMETER: taper at each end of the inflated balloon */
    taperMm: 12,
    /** MODEL PARAMETER: radius of the deflated balloon wrapped on the catheter */
    foldedRadiusMm: 1.9,
    /** MODEL PARAMETER: radio-opaque tip marker, length and metal attenuation (platinum-iridium-like band) */
    tipMarkerMm: 4,
    tipMarkerMu: METAL.platinum * 0.5,
    /** MODEL PARAMETER: gap between the distal end of the balloon and the tip */
    tipGapMm: 6,
    /** MODEL PARAMETER: tip marker radius as a share of the catheter radius */
    tipMarkerRadiusShare: 0.95,
    /** MODEL PARAMETER: radio-opaque jacket filler of the catheter as a share of DEVICE_MU.jacket */
    jacketShare: 0.6,
    /** MODEL PARAMETER: membrane polymer as a share of solid polymer, deflated (folded) and fully inflated (a thin skin) */
    membraneFolded: 0.35,
    membraneInflated: 0.05,
    /** MODEL PARAMETER: inflation and deflation ramp of 1:1 counterpulsation (s) */
    rampS: 0.06,
  },
  pump: {
    /** shaft 9 Fr inside a 14 Fr sheath: pci-manual/17-support-devices.ts, microaxial pump access */
    shaftFr: 9,
    /** inlet about 3.5 cm below the aortic valve (Brilakis): pci-manual/17-support-devices.ts, positioning step */
    inletBelowValveMm: 35,
    /** MODEL PARAMETER: cannula outer radius, length from the inlet to the outlet, motor housing */
    cannulaRadiusMm: 2.0,
    cannulaMm: 65,
    motorMm: 14,
    motorRadiusMm: 2.1,
    motorMu: METAL.steel * 0.45,
    /** MODEL PARAMETER: nitinol reinforcement of the cannula as a share of solid nitinol */
    cannulaBraid: 0.12,
    /** MODEL PARAMETER: pigtail beyond the inlet (straight run, curl radius, turns, tube radius, jacket share) */
    pigtailStraightMm: 10,
    pigtailRadiusMm: 4.5,
    pigtailTurns: 1.25,
    pigtailTubeRadiusMm: 1.0,
    pigtailJacketShare: 0.8,
    /** MODEL PARAMETER: cannula wall thickness and jacket filler share */
    cannulaWallMm: 0.35,
    cannulaJacketShare: 0.5,
    /**
     * MODEL PARAMETER: thickness of the left ventricular wall taken off each semi-axis of the myocardial
     * ellipsoid to give the cavity (positions.pump.inletInLv)
     */
    lvWallMm: 10,
  },
  ecmo: {
    /** venous cannula 25 Fr in most patients, tip at the SVC-RA junction: pci-manual/17-support-devices.ts, VA-ECMO cannulation */
    venousFr: 25,
    /** arterial cannula 17 Fr for most men (15 Fr for most women): pci-manual/17-support-devices.ts, VA-ECMO cannulation */
    arterialFr: 17,
    /** MODEL PARAMETER: wire reinforcement of the cannula walls as a share of solid steel */
    coil: 0.2,
    /** MODEL PARAMETER: wall thickness of the cannulae */
    wallMm: 0.7,
    /**
     * MODEL PARAMETER: height of the arterial cannula tip (thorax frame y, mm): in the common iliac artery, below
     * the aortic bifurcation (where the femoral course joins thorax.ts aorticCourse, y = -330)
     */
    arterialTipY: -360,
    /** MODEL PARAMETER: jacket filler share of the cannulae */
    jacketShare: 0.3,
    /** MODEL PARAMETER: radio-opaque marker at the venous cannula tip, length and metal attenuation */
    tipMarkerMm: 3,
    tipMarkerMu: METAL.steel * 0.25,
  },
  lead: {
    /** MODEL PARAMETER: temporary bipolar pacing lead outer size */
    fr: 5,
    /**
     * MODEL PARAMETER: coiled conductor seen as a hollow metal tube (as hardware.ts permanent leads: inner radius
     * 0.55 of the outer, empty core), drawn as a metal tube with a negative inner tube on the same points
     */
    conductorRadiusMm: 0.55,
    conductorInner: 0.55,
    conductorMu: METAL.steel * 0.55,
    /** MODEL PARAMETER: tip electrode 2 mm and ring electrode 9-11 mm from the tip (as hardware.ts) */
    tipElectrodeMm: 2,
    ringFromTipMm: [9, 11] as [number, number],
    tipMu: METAL.platinum * 0.6,
    ringMu: METAL.platinum * 0.5,
  },
  rhc: {
    /** MODEL PARAMETER: balloon-tipped catheter outer size and the inflated balloon radius */
    fr: 7,
    balloonRadiusMm: 5.5,
    /** MODEL PARAMETER: the balloon spans from this far behind the tip to this far behind it (mm) */
    balloonFromTipMm: [7, 0.5] as [number, number],
    /** MODEL PARAMETER: balloon membrane polymer as a share of solid polymer */
    membraneShare: 0.05,
  },
  pericardial: {
    /** MODEL PARAMETER: needle outer and inner radius */
    needleRadiusMm: 0.65,
    needleInnerMm: 0.42,
    /** 0.035 inch J wire (cath-handbook/04-cardiac-catheterisation.ts, wires): radius 0.445 mm as sceneBuilder "035" */
    wireRadiusMm: 0.445,
    wireMu: METAL.steel,
    /** MODEL PARAMETER: J curl radius at the wire tip */
    jRadiusMm: 3,
    /** MODEL PARAMETER: needle and hub length drawn outside the skin */
    hubOutsideMm: 60,
    /** MODEL PARAMETER: default effusion thickness around the heart */
    effusionMm: 10,
    /**
     * MODEL PARAMETER: contrast in the sac after a test injection, share of full-strength (contrast mixed with
     * the effusion). Tuned on the rendered AP image with a 15 mm effusion: at 0.06 the shell reads as a dark rim
     * where the beam runs along it (8-frame average against no contrast: about 20-25 grey levels at the lateral
     * heart border and 30-40 at the inferior border) and as a faint haze where it crosses it. The first value,
     * 0.015, gave 9 or fewer grey levels, not separable from beat and breathing differences.
     */
    sacContrastShare: 0.06,
    /** MODEL PARAMETER: needle direction (towards the left shoulder, posterior) and the skin entry below the sac */
    aim: nrm(v(0.3, 0.5, -0.81)),
    /** MODEL PARAMETER: where on the sac the track is aimed from its centre (anterior and inferior) */
    targetDir: nrm(v(-0.1, -0.55, 0.83)),
  },
  transseptal: {
    /** MODEL PARAMETER: sheath and dilator outer sizes, dilator beyond the sheath, needle radius */
    sheathFr: 8,
    dilatorFr: 6,
    dilatorOutMm: 18,
    needleRadiusMm: 0.6,
    /** MODEL PARAMETER: tenting depth of the fossa and how far the crossed dilator lies in the left atrium */
    tentMm: 5,
    crossMm: 16,
    /** MODEL PARAMETER: high starting position in the SVC above the junction */
    svcHighMm: 30,
    /** MODEL PARAMETER: needle beyond the dilator tip when crossed, unless the spec says otherwise */
    crossedNeedleOutMm: 6,
    /** MODEL PARAMETER: the curve's approach point, this far back from the tip along the septal normal */
    approachMm: 14,
    /** MODEL PARAMETER: the pull-down runs this far left of the line from the SVC-RA junction to the fossa */
    septalOffsetMm: 2,
    /** MODEL PARAMETER: the course bends round through a point this far back from the RA centre along the septal normal */
    raBendMm: 8,
    /** MODEL PARAMETER: dilator taper: full radius from this far behind its tip, tip radius share and minimum radius */
    dilatorTaperMm: 8,
    dilatorTipShare: 0.35,
    dilatorMinRadiusMm: 0.7,
    /** MODEL PARAMETER: dilator overlap inside the sheath, needle tip behind the dilator tip when not out */
    dilatorInSheathMm: 4,
    needleBehindMm: 0.5,
    /** MODEL PARAMETER: sheath marker band, jacket shares of sheath and dilator, needle metal share */
    sheathMarkerMm: 2,
    sheathMarkerMu: METAL.platinum * 0.25,
    sheathJacketShare: 0.7,
    dilatorJacketShare: 0.5,
    needleMu: METAL.steel * 0.8,
  },
};

// ---- context and landmarks ------------------------------------------------------

export interface DeviceContext {
  /** the patient's heart frame (CoronaryTree.heart) */
  heart: HeartFrame;
  /** breathing level of the frame, 0 end-expiration … 1 deep inspiration (breathHold ?? clock.resp) */
  resp: number;
  /** heart motion of the frame (heartMotion.motionAt); omitted = rest geometry */
  motion?: Motion;
  /** patient seed: the thorax genome (habitus, diaphragm) as the scene builder selects it */
  seed?: string | number;
}

/** The scene builder's breathing shift of the heart (sceneBuilder.buildXrayScene heartShift, mirrored). */
export function heartShiftFor(resp: number): Vec3 {
  return v(0, -0.85 * DIAPHRAGM_DESCENT * resp, 3 * resp);
}

export interface Ellipsoid3 {
  c: Vec3;
  ax: [Vec3, Vec3, Vec3];
  half: [number, number, number];
}

/** Point inside an ellipsoid (normalised radius below 1). */
export function ellipsoidRadius(e: Ellipsoid3, p: Vec3): number {
  const d = sub(p, e.c);
  return Math.hypot(dot(d, e.ax[0]) / e.half[0], dot(d, e.ax[1]) / e.half[1], dot(d, e.ax[2]) / e.half[2]);
}

/** Ray o + t d (unit d): entry and exit t through an ellipsoid, or null. */
export function ellipsoidHits(e: Ellipsoid3, o: Vec3, d: Vec3): [number, number] | null {
  const r = sub(o, e.c);
  const lo = [0, 1, 2].map((i) => dot(r, e.ax[i]) / e.half[i]);
  const ld = [0, 1, 2].map((i) => dot(d, e.ax[i]) / e.half[i]);
  const a = ld[0] ** 2 + ld[1] ** 2 + ld[2] ** 2;
  const b = 2 * (lo[0] * ld[0] + lo[1] * ld[1] + lo[2] * ld[2]);
  const c = lo[0] ** 2 + lo[1] ** 2 + lo[2] ** 2 - 1;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a === 0) return null;
  const s = Math.sqrt(disc);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
}

/** Nearest point on the surface of an ellipsoid along the ray from its centre through p. */
function onSurface(e: Ellipsoid3, p: Vec3): Vec3 {
  const r = ellipsoidRadius(e, p) || 1;
  return add(e.c, sc(sub(p, e.c), 1 / r));
}

const grow = (e: Ellipsoid3, mm: number): Ellipsoid3 => ({ c: e.c, ax: e.ax, half: [e.half[0] + mm, e.half[1] + mm, e.half[2] + mm] });

export interface DeviceLandmarks {
  /** tracheal bifurcation (thorax.ts carina) */
  carina: Vec3;
  /** MODEL PARAMETER: origin of the left subclavian artery on the arch */
  leftSubclavian: Vec3;
  /** centre of the aortic valve (aortic frame origin, valve plane y = 0) */
  aorticValve: Vec3;
  /** unit direction from the valve into the left ventricular cavity */
  lvAxis: Vec3;
  /** arterial course from the femoral artery to the aortic valve (smoothed, about 2 mm steps) */
  aorta: (side: Side) => Vec3[];
  svcTop: Vec3;
  /** where the SVC axis enters the right atrium */
  svcRaJunction: Vec3;
  ivcRaJunction: Vec3;
  /** lower end of the intrathoracic IVC (thorax.ts venaeCavae) */
  ivcLow: Vec3;
  /** the fossa ovalis: where the line from the right to the left atrial centre leaves the right atrium */
  fossa: Vec3;
  /** unit normal of the septum at the fossa, towards the left atrium */
  septalNormal: Vec3;
  /** right atrium, left atrium, ventricles (myocardium) and outflow tract at this frame */
  ra: Ellipsoid3;
  la: Ellipsoid3;
  lv: Ellipsoid3;
  rv: Ellipsoid3;
  rvot: Ellipsoid3;
  /** an ellipsoid hugging both ventricles (the pericardium without effusion) */
  pericardium: Ellipsoid3;
  /** anterior skin surface (z, mm) */
  bodyFront: number;
  /** venous stations (see VenousStation) */
  stations: Record<VenousStation, Vec3>;
}

export type Side = "right" | "left";

/** Stations of the venous and right-heart course (names as the pacing lab's lead zones where they exist). */
export type VenousStation =
  | "femoral"
  | "iliac"
  | "ivc-low"
  | "hepatic"
  | "ivc"
  | "ra"
  | "raa"
  | "svc"
  | "svc-high"
  | "neck"
  | "subclavian"
  | "innominate"
  | "cs"
  | "rv-inflow"
  | "rv-mid"
  | "rv-apex"
  | "rv-septum"
  | "rvot"
  | "pa"
  | "rpa"
  | "wedge"
  | "lpa"
  | "fossa"
  | "la"
  | "perforated";

/** Venous access routes (as the pacing lab's routes). */
export type VenousRoute = "femoral" | "rij" | "left-subclavian";

const ROUTE_ENTRY: Record<VenousRoute, VenousStation> = { femoral: "femoral", rij: "neck", "left-subclavian": "subclavian" };

/** Undirected adjacency of the venous stations (the course a catheter can take). */
const VENOUS_EDGES: [VenousStation, VenousStation][] = [
  ["femoral", "iliac"],
  ["iliac", "ivc-low"],
  ["ivc-low", "hepatic"],
  ["ivc-low", "ivc"],
  ["ivc", "ra"],
  ["ra", "svc"],
  ["svc", "svc-high"],
  ["svc-high", "neck"],
  ["svc-high", "innominate"],
  ["innominate", "subclavian"],
  ["ra", "raa"],
  ["ra", "cs"],
  ["ra", "rv-inflow"],
  ["rv-inflow", "rv-mid"],
  ["rv-mid", "rv-apex"],
  ["rv-mid", "rv-septum"],
  ["rv-apex", "perforated"],
  ["rv-inflow", "rvot"],
  ["rvot", "pa"],
  ["pa", "rpa"],
  ["rpa", "wedge"],
  ["pa", "lpa"],
  ["ra", "fossa"],
  ["fossa", "la"],
];

/** Stations from a route's entry to `to` (breadth-first over VENOUS_EDGES). */
export function venousCourse(route: VenousRoute, to: VenousStation): VenousStation[] {
  const from = ROUTE_ENTRY[route];
  const prev = new Map<VenousStation, VenousStation | null>([[from, null]]);
  const queue: VenousStation[] = [from];
  while (queue.length) {
    const s = queue.shift()!;
    if (s === to) break;
    for (const [a, b] of VENOUS_EDGES) {
      const n = a === s ? b : b === s ? a : null;
      if (n && !prev.has(n)) {
        prev.set(n, s);
        queue.push(n);
      }
    }
  }
  if (!prev.has(to)) return [from];
  const out: VenousStation[] = [];
  for (let s: VenousStation | null = to; s; s = prev.get(s) ?? null) out.unshift(s);
  return out;
}

function shapeByName(shapes: ReturnType<typeof heartShapes>, name: (typeof HEART_SHAPE_NAMES)[number], hs: Vec3): Ellipsoid3 {
  const s = shapes.find((x) => x.name === name)!;
  return { c: add(s.c, hs), ax: s.ax, half: s.half };
}

/** Exit point of the ray from inside `e` at `o` along `d`. */
function exitPoint(e: Ellipsoid3, o: Vec3, d: Vec3): Vec3 {
  const h = ellipsoidHits(e, o, nrm(d));
  return h ? add(o, sc(nrm(d), h[1])) : o;
}

/** Landmarks of the thorax and heart for one frame. */
export function deviceLandmarks(ctx: DeviceContext): DeviceLandmarks {
  const H = ctx.heart;
  const r = ctx.resp;
  const hs = heartShiftFor(r);
  const g = ctx.seed !== undefined ? thoraxGenome(ctx.seed) : REFERENCE_GENOME;
  const k = g.habitus;
  const shapes = heartShapes(H, ctx.motion);
  const ra = shapeByName(shapes, "right atrium", hs);
  const la = shapeByName(shapes, "left atrium", hs);
  const lv = shapeByName(shapes, "lv myocardium", hs);
  const rv = shapeByName(shapes, "rv myocardium", hs);
  const rvot = shapeByName(shapes, "right ventricular outflow", hs);
  const heartPt = (ell: number, phi: number, h: number) => add(surfacePoint(H, ell, phi, h, ctx.motion), hs);

  // thorax-fixed landmarks (mirrors of thorax.ts thoraxShapes and venaeCavae)
  const carina = v(-4, 78, -44);
  const svcTop = add(v(-30, 108, -10), sc(hs, 0.2));
  const extY = Math.hypot(ra.ax[0].y * ra.half[0], ra.ax[1].y * ra.half[1], ra.ax[2].y * ra.half[2]);
  const svcBot = add(ra.c, v(4, extY * 0.25, 0));
  const svcRaJunction = exitPoint(ra, svcBot, sub(svcTop, svcBot));
  const dd = DIAPHRAGM_DESCENT * r - g.diaphragm;
  const ivcTop = add(ra.c, v(4, -extY * 0.25, -6));
  const ivcLow = v(-26 * k, ANATOMY_TUNE.dome.apexR - 70 - dd, -24);
  const ivcRaJunction = exitPoint(ra, ivcTop, sub(ivcLow, ivcTop));
  // the arch: the femoral course every catheter follows (thorax.ts aorticCourse) down to the valve plane.
  // Breathing moves the root with the heart (sceneBuilder rootW 0.45) and the abdominal aorta not at all;
  // MODEL PARAMETER: the share rises linearly from y = -100 to the top of the root (y = 26).
  const aorticValve = sc(hs, 0.45);
  const leftSubclavian = add(v(14, 104, -42), sc(hs, 0.2));
  const lvAxis = nrm(sub(lv.c, aorticValve));
  const aorta = (side: Side): Vec3[] => {
    const s = side === "right" ? -1 : 1;
    const course = aorticCourse("femoral", 26).map((p) => add(p, sc(hs, 0.45 * clamp01((p.y + 100) / 126))));
    return smoothPath([v(s * 70 * k, -470, -40), v(s * 45 * k, -390, -72), ...course, aorticValve], 2);
  };
  // the fossa: where the right-to-left atrial line leaves the right atrium
  const septalNormal = nrm(sub(la.c, ra.c));
  const fossa = exitPoint(ra, ra.c, septalNormal);
  // pericardium hugging both ventricles: the heart frame's axes, sized to enclose sampled points
  const pericardium = hugging([lv, rv], H);
  const extZ = Math.hypot(ra.ax[0].z * ra.half[0], ra.ax[1].z * ra.half[1], ra.ax[2].z * ra.half[2]);
  const extX = Math.hypot(ra.ax[0].x * ra.half[0], ra.ax[1].x * ra.half[1], ra.ax[2].x * ra.half[2]);
  const front = -46 + 126 * k * g.depth; // thorax.ts bodyFrame: bodyC.z + bodyHalf.z

  // MODEL PARAMETERS: venous course outside the heart and the stations inside it
  const stations: Record<VenousStation, Vec3> = {
    femoral: v(-55 * k, -460, -35),
    iliac: v(-34 * k, -330, -52),
    "ivc-low": ivcLow,
    hepatic: add(ivcLow, v(-34, -8, 12)),
    ivc: ivcRaJunction,
    ra: add(ra.c, v(-extX * 0.25, 0, 0)),
    raa: add(ra.c, v(extX * 0.45, extY * 0.8, extZ * 0.9)),
    svc: svcRaJunction,
    "svc-high": lerp(svcRaJunction, svcTop, 0.85),
    neck: v(-44, 250, -18),
    innominate: v(-18, 128, -24),
    subclavian: v(54 * k, 176, front - 30),
    cs: add(ra.c, v(extX * 0.35, -extY * 0.5, -extZ * 0.6)),
    "rv-inflow": heartPt(-0.85, -110, -18),
    "rv-mid": heartPt(0, -60, -14),
    "rv-apex": heartPt(0.72, -20, -9),
    "rv-septum": heartPt(0.1, -15, -16),
    rvot: add(rvot.c, v(0, rvot.half[1] * 0.4, 0)),
    pa: add(v(24, 30, 14), sc(hs, 0.4)),
    rpa: add(v(-24, 42, -26), sc(hs, 0.3)),
    wedge: add(v(-72, -18, -38), sc(hs, 0.6)),
    lpa: add(v(52, 44, -30), sc(hs, 0.3)),
    fossa,
    la: la.c,
    perforated: heartPt(0.76, -20, 7),
  };
  return {
    carina,
    leftSubclavian,
    aorticValve,
    lvAxis,
    aorta,
    svcTop,
    svcRaJunction,
    ivcRaJunction,
    ivcLow,
    fossa,
    septalNormal,
    ra,
    la,
    lv,
    rv,
    rvot,
    pericardium,
    bodyFront: front,
    stations,
  };
}

/**
 * An ellipsoid on the heart frame's axes hugging both ventricular ellipsoids: fitted to the second moments
 * of points sampled on their surfaces (a uniform surface sample of an ellipsoid has variance h^2 / 3 along
 * each axis), then scaled so that 90% of the points lie inside. MODEL PARAMETER: the visible silhouette is
 * the union of the two ventricles and the fat around them; a single ellipsoid follows it within a few
 * millimetres except at the apex and the acute margin.
 */
function hugging(es: Ellipsoid3[], H: HeartFrame): Ellipsoid3 {
  const pts: Vec3[] = [];
  for (const e of es)
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 24; j++) {
        // equal-area bands (uniform in cos theta)
        const ct = 1 - (2 * (i + 0.5)) / 12;
        const stt = Math.sqrt(1 - ct * ct);
        const ph = (2 * Math.PI * (j + 0.5 * (i % 2))) / 24;
        const l = [stt * Math.cos(ph), stt * Math.sin(ph), ct];
        const p = add(e.c, add(sc(e.ax[0], l[0] * e.half[0]), add(sc(e.ax[1], l[1] * e.half[1]), sc(e.ax[2], l[2] * e.half[2]))));
        // only the outer surface of the pair counts (points buried in the other ventricle are not on the silhouette)
        if (es.every((o) => o === e || ellipsoidRadius(o, p) > 1)) pts.push(p);
      }
  const ax: [Vec3, Vec3, Vec3] = [nrm(H.L), nrm(H.A), nrm(H.S)];
  const n = pts.length;
  const c = sc(pts.reduce((a, p) => add(a, p), v(0, 0, 0)), 1 / n);
  const half = ax.map((a) => Math.sqrt((3 * pts.reduce((acc, p) => acc + dot(sub(p, c), a) ** 2, 0)) / n)) as [number, number, number];
  const e: Ellipsoid3 = { c, ax, half };
  const rs = pts.map((p) => ellipsoidRadius(e, p)).sort((a, b) => a - b);
  const m = rs[Math.floor(0.9 * (rs.length - 1))];
  return { c, ax, half: [half[0] * m, half[1] * m, half[2] * m] };
}

// ---- polylines ------------------------------------------------------------------

/** Catmull-Rom through the control points, resampled at about `step` mm. */
export function smoothPath(ctrl: Vec3[], step = 2): Vec3[] {
  const c = ctrl.filter((p, i) => i === 0 || len(sub(p, ctrl[i - 1])) > 1e-6);
  if (c.length < 2) return c.slice();
  const dense: Vec3[] = [];
  for (let i = 0; i < c.length - 1; i++) {
    const p0 = c[Math.max(0, i - 1)],
      p1 = c[i],
      p2 = c[i + 1],
      p3 = c[Math.min(c.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(len(sub(p2, p1)) / Math.max(0.5, step / 2)));
    for (let j = 0; j < n; j++) {
      const t = j / n,
        t2 = t * t,
        t3 = t2 * t;
      const q = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      dense.push(v(q(p0.x, p1.x, p2.x, p3.x), q(p0.y, p1.y, p2.y, p3.y), q(p0.z, p1.z, p2.z, p3.z)));
    }
  }
  dense.push(c[c.length - 1]);
  return resample(dense, step);
}

/** Cumulative arc length at each point. */
export function arcLengths(pts: Vec3[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + len(sub(pts[i], pts[i - 1])));
  return out;
}

/** Resample a polyline at a uniform step (keeps both ends). */
export function resample(pts: Vec3[], step: number): Vec3[] {
  if (pts.length < 2) return pts.slice();
  const s = arcLengths(pts);
  const total = s[s.length - 1];
  const n = Math.max(1, Math.round(total / step));
  const out: Vec3[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = (total * i) / n;
    while (j < s.length - 2 && s[j + 1] < t) j++;
    const seg = s[j + 1] - s[j] || 1;
    out.push(lerp(pts[j], pts[j + 1], (t - s[j]) / seg));
  }
  return out;
}

/** Point at arc length t (clamped). */
export function pointAt(pts: Vec3[], t: number, s = arcLengths(pts)): Vec3 {
  if (pts.length === 1) return pts[0];
  const tt = Math.max(0, Math.min(s[s.length - 1], t));
  let j = 0;
  while (j < s.length - 2 && s[j + 1] < tt) j++;
  const seg = s[j + 1] - s[j] || 1;
  return lerp(pts[j], pts[j + 1], (tt - s[j]) / seg);
}

/** The part of a polyline between arc lengths a and b. */
export function cutPath(pts: Vec3[], a: number, b: number, s = arcLengths(pts)): Vec3[] {
  const total = s[s.length - 1];
  const lo = Math.max(0, Math.min(total, Math.min(a, b)));
  const hi = Math.max(0, Math.min(total, Math.max(a, b)));
  const out: Vec3[] = [pointAt(pts, lo, s)];
  for (let i = 0; i < pts.length; i++) if (s[i] > lo + 1e-6 && s[i] < hi - 1e-6) out.push(pts[i]);
  out.push(pointAt(pts, hi, s));
  return out;
}

// ---- device specifications ------------------------------------------------------------

export interface IabpSpec {
  kind: "iabp";
  /**
   * tip below the carina (mm; negative = above it). The module's target is level with the carina (0). The tip
   * follows the arterial course, which tops out at the apex of the arch (about 22 mm above the carina): a request
   * above the apex advances the tip past the apex along the arch towards the ascending aorta by the excess (the
   * too-high position), so positions.iabp then reports the tip's real height, not the request. Requests below
   * the start of the course, or beyond its end at the valve, are clamped (positions.iabp.clamped).
   */
  tipBelowCarinaMm: number;
  /** balloon volume (mL); default 40 */
  balloonMl?: number;
  /** 0 deflated … 1 fully inflated with helium; default: from `pumping` and the clock, else 0 */
  inflation?: number;
  /** femoral access side (default right) */
  side?: Side;
}

export interface PumpSpec {
  kind: "microaxial-pump";
  /** inlet depth below the aortic valve (mm, default 35) */
  inletBelowValveMm?: number;
  side?: Side;
}

export interface EcmoSpec {
  kind: "ecmo";
  /** venous tip relative to the SVC-RA junction along the cannula (mm; positive into the SVC, negative into the RA); default 0 */
  venousTipMm?: number;
  venousFr?: number;
  arterialFr?: number;
  /** drawn cannulae (default both) */
  venous?: boolean;
  arterial?: boolean;
  /** venous cannula side (default right); the arterial cannula goes in the other groin */
  side?: Side;
}

export interface LeadSpec {
  kind: "pacing-lead";
  route: VenousRoute;
  /** the station the tip is at or heading for */
  to: VenousStation;
  /** 0 … 1 along the last leg of the course (default 1: at `to`) */
  advance?: number;
}

export interface RhcSpec {
  kind: "rhc-catheter";
  route: VenousRoute;
  to: VenousStation;
  advance?: number;
  /** balloon inflated (default true) */
  balloon?: boolean;
}

export interface PericardialSpec {
  kind: "pericardial";
  /** needle depth along the track from the skin (mm); 0 = not in */
  needleDepthMm: number;
  /** J wire advanced beyond the needle tip (mm) */
  wireMm?: number;
  /** effusion thickness around the heart (mm, default 10) */
  effusionMm?: number;
  /** contrast in the sac, 0 none … 1 (default 0; 1 = DEVICE_MODEL.pericardial.sacContrastShare of full strength) */
  sacContrast?: number;
  /** needle direction (thorax frame; default DEVICE_MODEL.pericardial.aim, towards the left shoulder) */
  aim?: Vec3;
  /**
   * the J wire has been passed into the sac (a host latches this when the wire is first advanced with the tip in
   * the sac). Default: decided on the rest geometry (end-expiration, diastole), so the wire's course does not
   * change from frame to frame as the heart moves under the needle.
   */
  wireInSac?: boolean;
}

export interface TransseptalSpec {
  kind: "transseptal";
  stage: "svc" | "descent" | "fossa" | "tenting" | "crossed";
  /** 0 … 1 of the pull-down from the SVC to the fossa (stage "descent") */
  descent?: number;
  /** needle beyond the dilator tip (mm, default 0; stage "crossed" defaults to DEVICE_MODEL.transseptal.crossedNeedleOutMm) */
  needleOutMm?: number;
}

export type DeviceSpec = IabpSpec | PumpSpec | EcmoSpec | LeadSpec | RhcSpec | PericardialSpec | TransseptalSpec;
export type DeviceKind = DeviceSpec["kind"];

/** A tube with the device and part it belongs to (extra fields are ignored by the renderer). */
export type DeviceTube = TubeSpec & { device: DeviceKind; part: string };
export type DeviceBone = BonePrim & { device: DeviceKind; part: string };

/**
 * Device positions for host checks (never shown on a live lab screen outside guided aids). One entry per
 * device kind: with two devices of a kind, the last one is reported.
 */
export interface DevicePositions {
  iabp?: {
    tip: Vec3;
    /** height of the tip below the carina (mm, negative above) */
    tipBelowCarinaMm: number;
    /** height of the tip below the left subclavian origin (mm); the arch apex is about 4 mm below that origin */
    tipBelowLeftSubclavianMm: number;
    /**
     * arc length of the tip along the arterial course beyond the course point nearest the left subclavian origin
     * (mm; positive = the tip has passed the origin, the too-high position; negative = below it)
     */
    tipPastLeftSubclavianMm: number;
    /** arc length of the tip beyond the apex of the arch (mm; 0 when it has not reached the apex) */
    pastArchApexMm: number;
    /** the request could not be met (beyond either end of the course) and the tip was clamped */
    clamped: boolean;
    balloonTop: Vec3;
    balloonBottom: Vec3;
    inflation: number;
    balloonMl: number;
  };
  /**
   * inletInLv: the inlet lies below the valve plane and inside the left ventricular cavity (the myocardial
   * ellipsoid less DEVICE_MODEL.pump.lvWallMm on each semi-axis)
   */
  pump?: { inlet: Vec3; outlet: Vec3; inletBelowValveMm: number; outletAboveValveMm: number; inletInLv: boolean };
  ecmo?: { venousTip: Vec3 | null; venousTipToJunctionMm: number | null; arterialTip: Vec3 | null };
  pacing?: { tip: Vec3; course: VenousStation[]; at: VenousStation; advance: number };
  rhc?: { tip: Vec3; course: VenousStation[]; at: VenousStation; balloon: boolean };
  pericardial?: { needleTip: Vec3; skinToSacMm: number | null; skinToEpicardiumMm: number | null; tipInSac: boolean; tipBeyondEpicardium: boolean; wireInSacMm: number };
  transseptal?: { tip: Vec3; needleTip: Vec3; tipToFossaMm: number; crossed: boolean; stage: TransseptalSpec["stage"] };
}

export interface DeviceDrawing {
  tubes: DeviceTube[];
  bones: DeviceBone[];
  positions: DevicePositions;
  landmarks: DeviceLandmarks;
}

// ---- tube builders ------------------------------------------------------------------

type Mu3 = [number, number, number];

function tube(out: DeviceTube[], device: DeviceKind, part: string, pts: Vec3[], r: number | number[], mu: Mu3) {
  if (pts.length < 2) return;
  const rr = typeof r === "number" ? pts.map(() => r) : r;
  out.push({ pts, r: rr, mu, device, part });
}

/** A hollow polymer shaft (outer wall with jacket filler, lumen of blood or saline) with an optional metal share in the wall. */
function shaft(out: DeviceTube[], device: DeviceKind, part: string, pts: Vec3[], rOut: number, o: { wallMm?: number; jacket?: number; metal?: number } = {}) {
  const jacket = o.jacket ?? DEVICE_MU.jacket;
  const metal = o.metal ?? 0;
  tube(out, device, part, pts, rOut, [DEVICE_MU.polymerExcess, jacket, metal]);
  const rIn = Math.max(0.05, rOut - (o.wallMm ?? Math.max(0.25, rOut * 0.3)));
  tube(out, device, part + " lumen", pts, rIn, [-DEVICE_MU.polymerExcess, -jacket, -metal]);
}

// ---- devices --------------------------------------------------------------------------

function iabp(L: DeviceLandmarks, spec: IabpSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.iabp;
  const path = L.aorta(spec.side ?? "right");
  const s = arcLengths(path);
  // the tip on the ascending part of the course (descending aorta, then the arch to its apex); a request above
  // the apex goes on past it along the arch by the excess height
  let apex = 0;
  for (let i = 1; i < path.length; i++) if (path[i].y > path[apex].y) apex = i;
  const sEnd = s[s.length - 1];
  const targetY = L.carina.y - spec.tipBelowCarinaMm;
  let sTip = s[apex];
  let clamped = false;
  if (targetY < path[0].y) {
    sTip = 0;
    clamped = true;
  } else if (targetY > path[apex].y) {
    sTip = s[apex] + (targetY - path[apex].y);
    if (sTip > sEnd) {
      sTip = sEnd;
      clamped = true;
    }
  } else
    for (let i = 1; i <= apex; i++)
      if (path[i - 1].y <= targetY && path[i].y >= targetY) {
        const f = (targetY - path[i - 1].y) / (path[i].y - path[i - 1].y || 1);
        sTip = s[i - 1] + f * (s[i] - s[i - 1]);
        break;
      }
  // the course point nearest the left subclavian origin
  let lsa = 0;
  for (let i = 1; i < path.length; i++) if (len(sub(path[i], L.leftSubclavian)) < len(sub(path[lsa], L.leftSubclavian))) lsa = i;
  const ml = spec.balloonMl ?? M.balloonMl;
  const inflation = clamp01(spec.inflation ?? 0);
  const k = Math.cbrt(ml / 40);
  const lenMm = M.balloonLengthMm40 * k;
  // radius that holds the volume over the length with its tapered ends (MODEL PARAMETER shape)
  const rFull = Math.sqrt((ml * 1000) / (Math.PI * lenMm * (1 - (2 * M.taperMm) / (3 * lenMm))));
  const rOut = frToRadiusMm(M.fr);
  const tipPts = cutPath(path, 0, sTip, s);
  const sb = arcLengths(tipPts);
  const total = sb[sb.length - 1];
  const bTop = total - M.tipMarkerMm - M.tipGapMm;
  const bBot = bTop - lenMm;
  // catheter shaft to the tip (central lumen)
  shaft(out.tubes, "iabp", "shaft", tipPts, rOut, { jacket: DEVICE_MU.jacket * M.jacketShare });
  // balloon: helium between the shaft and the membrane, tapered at both ends
  const bal = resample(cutPath(tipPts, bBot, bTop, sb), 2);
  const bs = arcLengths(bal);
  const bl = bs[bs.length - 1] || 1;
  const rAt = (t: number) => {
    const taper = Math.min(1, Math.min(t, bl - t) / M.taperMm);
    const rf = rOut + (rFull - rOut) * Math.sqrt(Math.max(0, taper));
    return M.foldedRadiusMm + (rf - M.foldedRadiusMm) * inflation;
  };
  const radii = bs.map(rAt);
  if (inflation > 0.01) {
    tube(out.tubes, "iabp", "balloon gas", bal, radii, [DEVICE_MU.gasExcess * inflation, 0, 0]);
    // the shaft inside the balloon displaces gas, not blood
    tube(out.tubes, "iabp", "balloon core", bal, rOut, [-DEVICE_MU.gasExcess * inflation, 0, 0]);
  }
  // membrane: thin polymer (folded on the shaft when deflated, a skin when inflated)
  tube(out.tubes, "iabp", "membrane", bal, radii, [DEVICE_MU.polymerExcess * (M.membraneFolded + (M.membraneInflated - M.membraneFolded) * inflation), 0, 0]);
  // radio-opaque tip marker
  const marker = cutPath(tipPts, total - M.tipMarkerMm, total, sb);
  tube(out.tubes, "iabp", "tip marker", marker, rOut * M.tipMarkerRadiusShare, [0, 0, M.tipMarkerMu]);
  const tip = tipPts[tipPts.length - 1];
  out.positions.iabp = {
    tip,
    tipBelowCarinaMm: L.carina.y - tip.y,
    tipBelowLeftSubclavianMm: L.leftSubclavian.y - tip.y,
    tipPastLeftSubclavianMm: sTip - s[lsa],
    pastArchApexMm: Math.max(0, sTip - s[apex]),
    clamped,
    balloonTop: pointAt(tipPts, bTop, sb),
    balloonBottom: pointAt(tipPts, Math.max(0, bBot), sb),
    inflation,
    balloonMl: ml,
  };
}

function pump(L: DeviceLandmarks, spec: PumpSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.pump;
  const depth = spec.inletBelowValveMm ?? M.inletBelowValveMm;
  const aorta = L.aorta(spec.side ?? "right");
  const inlet = add(L.aorticValve, sc(L.lvAxis, depth));
  const path = smoothPath([...aorta.slice(0, -1).filter((_, i) => i % 6 === 0), L.aorticValve, inlet], 2);
  const s = arcLengths(path);
  const sIn = s[s.length - 1];
  const sOut = Math.max(0, sIn - M.cannulaMm);
  const sMot = Math.max(0, sOut - M.motorMm);
  shaft(out.tubes, "microaxial-pump", "shaft", cutPath(path, 0, sMot, s), frToRadiusMm(M.shaftFr));
  tube(out.tubes, "microaxial-pump", "motor", cutPath(path, sMot, sOut, s), M.motorRadiusMm, [DEVICE_MU.polymerExcess, 0, M.motorMu]);
  shaft(out.tubes, "microaxial-pump", "cannula", cutPath(path, sOut, sIn, s), M.cannulaRadiusMm, { wallMm: M.cannulaWallMm, jacket: DEVICE_MU.jacket * M.cannulaJacketShare, metal: DEVICE_MU.nitinol * M.cannulaBraid });
  // pigtail: a straight run beyond the inlet, then a curl in the cavity
  const d = L.lvAxis;
  const up = Math.abs(d.y) < 0.9 ? v(0, 1, 0) : v(1, 0, 0);
  const n1 = nrm(cross(d, up));
  const st = add(inlet, sc(d, M.pigtailStraightMm));
  const centre = add(st, sc(n1, M.pigtailRadiusMm));
  const curl: Vec3[] = [inlet, st];
  for (let i = 1; i <= 30; i++) {
    const a = (i / 30) * 2 * M.pigtailTurns * Math.PI;
    curl.push(add(centre, add(sc(n1, -Math.cos(a) * M.pigtailRadiusMm), sc(d, Math.sin(a) * M.pigtailRadiusMm))));
  }
  shaft(out.tubes, "microaxial-pump", "pigtail", resample(curl, 1), M.pigtailTubeRadiusMm, { jacket: DEVICE_MU.jacket * M.pigtailJacketShare });
  const outlet = pointAt(path, sOut, s);
  const below = dot(sub(inlet, L.aorticValve), L.lvAxis);
  out.positions.pump = {
    inlet,
    outlet,
    inletBelowValveMm: below,
    outletAboveValveMm: outlet.y - L.aorticValve.y,
    inletInLv: below > 0 && ellipsoidRadius(grow(L.lv, -M.lvWallMm), inlet) < 1,
  };
}

/** MODEL PARAMETER: the venous course from the IVC to the SVC passes this far right of the RA centre (mm). */
const RA_PASS_RIGHT_MM = 4;

/** The femoral and iliac veins of one side (the stations are the right side; the left mirrors them across the midline). */
function groinVeins(L: DeviceLandmarks, side: Side): [Vec3, Vec3] {
  const m = (p: Vec3) => (side === "left" ? v(-p.x, p.y, p.z) : p);
  return [m(L.stations.femoral), m(L.stations.iliac)];
}

/** Femoral venous course to the SVC-RA junction and on up the SVC (for drainage cannulae and the transseptal sheath). */
function venousToSvc(L: DeviceLandmarks, side: Side): Vec3[] {
  const st = L.stations;
  return smoothPath([...groinVeins(L, side), st["ivc-low"], L.ivcRaJunction, add(L.ra.c, v(-RA_PASS_RIGHT_MM, 0, 0)), L.svcRaJunction, st["svc-high"], L.svcTop], 2);
}

function ecmo(L: DeviceLandmarks, spec: EcmoSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.ecmo;
  const side = spec.side ?? "right";
  let venousTip: Vec3 | null = null;
  let venousTipToJunctionMm: number | null = null;
  let arterialTip: Vec3 | null = null;
  if (spec.venous ?? true) {
    const p = venousToSvc(L, side);
    const s = arcLengths(p);
    let jIdx = 0;
    for (let i = 0; i < p.length; i++) if (len(sub(p[i], L.svcRaJunction)) < len(sub(p[jIdx], L.svcRaJunction))) jIdx = i;
    const sTip = s[jIdx] + (spec.venousTipMm ?? 0);
    const pts = cutPath(p, 0, sTip, s);
    const r = frToRadiusMm(spec.venousFr ?? M.venousFr);
    shaft(out.tubes, "ecmo", "venous cannula", pts, r, { wallMm: M.wallMm, jacket: DEVICE_MU.jacket * M.jacketShare, metal: DEVICE_MU.steel * M.coil });
    const ps = arcLengths(pts);
    tube(out.tubes, "ecmo", "venous tip marker", cutPath(pts, ps[ps.length - 1] - M.tipMarkerMm, ps[ps.length - 1], ps), r, [0, 0, M.tipMarkerMu]);
    venousTip = pts[pts.length - 1];
    venousTipToJunctionMm = sTip - s[jIdx];
  }
  if (spec.arterial ?? true) {
    const a = L.aorta(side === "right" ? "left" : "right");
    const s = arcLengths(a);
    let iTip = 0;
    while (iTip < a.length - 1 && a[iTip].y < M.arterialTipY) iTip++;
    const pts = cutPath(a, 0, s[iTip], s);
    const r = frToRadiusMm(spec.arterialFr ?? M.arterialFr);
    shaft(out.tubes, "ecmo", "arterial cannula", pts, r, { wallMm: M.wallMm, jacket: DEVICE_MU.jacket * M.jacketShare, metal: DEVICE_MU.steel * M.coil });
    arterialTip = pts[pts.length - 1];
  }
  out.positions.ecmo = { venousTip, venousTipToJunctionMm, arterialTip };
}

/** A course through venous stations with the tip `advance` of the way along the last leg. */
function venousPath(L: DeviceLandmarks, route: VenousRoute, to: VenousStation, advance: number): { pts: Vec3[]; course: VenousStation[] } {
  const course = venousCourse(route, to);
  const ctrl = course.map((c) => L.stations[c]);
  if (ctrl.length >= 2 && advance < 1) ctrl[ctrl.length - 1] = lerp(ctrl[ctrl.length - 2], ctrl[ctrl.length - 1], clamp01(advance));
  return { pts: smoothPath(ctrl, 1.5), course };
}

function pacingLead(L: DeviceLandmarks, spec: LeadSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.lead;
  const adv = clamp01(spec.advance ?? 1);
  const { pts, course } = venousPath(L, spec.route, spec.to, adv);
  const r = frToRadiusMm(M.fr);
  tube(out.tubes, "pacing-lead", "insulation", pts, r, [DEVICE_MU.polymerExcess, 0, 0]);
  // hollow coil: the metal tube and its empty core on the same points array (sampled identically by the renderer)
  tube(out.tubes, "pacing-lead", "conductor", pts, M.conductorRadiusMm, [0, 0, M.conductorMu]);
  tube(out.tubes, "pacing-lead", "conductor core", pts, M.conductorRadiusMm * M.conductorInner, [0, 0, -M.conductorMu]);
  const s = arcLengths(pts);
  const total = s[s.length - 1];
  tube(out.tubes, "pacing-lead", "tip electrode", cutPath(pts, total - M.tipElectrodeMm, total, s), r * 0.9, [0, 0, M.tipMu]);
  tube(out.tubes, "pacing-lead", "ring electrode", cutPath(pts, total - M.ringFromTipMm[1], total - M.ringFromTipMm[0], s), r * 0.95, [0, 0, M.ringMu]);
  out.positions.pacing = { tip: pts[pts.length - 1], course, at: spec.to, advance: adv };
}

function rhc(L: DeviceLandmarks, spec: RhcSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.rhc;
  const { pts, course } = venousPath(L, spec.route, spec.to, clamp01(spec.advance ?? 1));
  const r = frToRadiusMm(M.fr);
  shaft(out.tubes, "rhc-catheter", "catheter", pts, r);
  const balloon = spec.balloon ?? true;
  const s = arcLengths(pts);
  const total = s[s.length - 1];
  const bal = cutPath(pts, total - M.balloonFromTipMm[0], total - M.balloonFromTipMm[1], s);
  if (balloon) {
    const bs = arcLengths(bal);
    const bl = bs[bs.length - 1] || 1;
    const radii = bs.map((t) => Math.max(r, M.balloonRadiusMm * Math.sqrt(Math.max(0, 1 - ((2 * t) / bl - 1) ** 2))));
    tube(out.tubes, "rhc-catheter", "balloon gas", bal, radii, [DEVICE_MU.gasExcess, 0, 0]);
    tube(out.tubes, "rhc-catheter", "balloon core", bal, r, [-DEVICE_MU.gasExcess, 0, 0]);
    tube(out.tubes, "rhc-catheter", "balloon membrane", bal, radii, [DEVICE_MU.polymerExcess * M.membraneShare, 0, 0]);
  }
  out.positions.rhc = { tip: pts[pts.length - 1], course, at: spec.to, balloon };
}

function pericardial(L: DeviceLandmarks, rest: DeviceLandmarks, spec: PericardialSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.pericardial;
  const effusion = Math.max(0, spec.effusionMm ?? M.effusionMm);
  const inner = L.pericardium;
  const outer = grow(inner, effusion);
  // contrast-outlined sac: a thin iodine shell between the epicardium and the parietal pericardium
  const sac = clamp01(spec.sacContrast ?? 0);
  if (sac > 0 && effusion > 0.5) {
    const muI = DEVICE_MU.iodineFull * M.sacContrastShare * sac;
    out.bones.push({ type: 0, c: outer.c, ax: outer.ax, half: outer.half, mu: 0, muI, device: "pericardial", part: "sac contrast" });
    out.bones.push({ type: 0, c: inner.c, ax: inner.ax, half: inner.half, mu: 0, muI: -muI, device: "pericardial", part: "sac contrast inner" });
  }
  // the track: aimed at the anterior-inferior sac towards the left shoulder, from the anterior skin. The
  // skin entry and the direction are fixed in the body (set on the rest geometry: end-expiration, diastole);
  // the heart moves under the needle with breathing and the beat
  const restOuter = grow(rest.pericardium, effusion);
  const target = exitPoint(restOuter, restOuter.c, M.targetDir);
  const d = spec.aim ? nrm(spec.aim) : M.aim;
  const toSkin = (rest.bodyFront - target.z) / -d.z;
  const skin = sub(target, sc(d, Math.max(0, toSkin)));
  const hitO = ellipsoidHits(outer, skin, d);
  const hitI = ellipsoidHits(inner, skin, d);
  const skinToSac = hitO && hitO[0] > 0 ? hitO[0] : null;
  const skinToEpi = hitI && hitI[0] > 0 ? hitI[0] : null;
  const depth = Math.max(0, spec.needleDepthMm);
  const tipInSac = skinToSac !== null && depth >= skinToSac && (skinToEpi === null || depth < skinToEpi);
  const tipBeyondEpicardium = skinToEpi !== null && depth >= skinToEpi;
  // the wire's course is stateful, not per frame: a wire passed into the sac stays in it while the patient
  // breathes and the heart beats under the needle. Without a latched host flag it is decided on the rest
  // geometry, the same geometry that fixes the track (tipInSac above stays instantaneous for host checks)
  const restHitO = ellipsoidHits(restOuter, skin, d);
  const restHitI = ellipsoidHits(rest.pericardium, skin, d);
  const restToSac = restHitO && restHitO[0] > 0 ? restHitO[0] : null;
  const restToEpi = restHitI && restHitI[0] > 0 ? restHitI[0] : null;
  const wireFollowsSac = spec.wireInSac ?? (restToSac !== null && depth >= restToSac && (restToEpi === null || depth < restToEpi));
  const outside = sub(skin, sc(d, M.hubOutsideMm)); // the hub and the syringe end lie outside the body
  const tip = add(skin, sc(d, depth));
  if (depth > 0) {
    const needle = resample([outside, tip], 2);
    tube(out.tubes, "pericardial", "needle", needle, M.needleRadiusMm, [0, 0, DEVICE_MU.steel]);
    tube(out.tubes, "pericardial", "needle lumen", needle, M.needleInnerMm, [0, 0, -DEVICE_MU.steel]);
  }
  // J wire: in the sac it follows the space around the heart; elsewhere it runs on along the track
  const wireMm = Math.max(0, spec.wireMm ?? 0);
  let wireInSacMm = 0;
  if (wireMm > 0 && depth > 0) {
    const pts: Vec3[] = [tip];
    if (wireFollowsSac) {
      // the wire enters the current frame's sac (mid shell) from the tip, even when breathing has moved the sac
      // a few millimetres off the needle tip
      const mid = grow(inner, effusion / 2);
      let p = onSurface(mid, tip);
      pts.push(p);
      let dir = d;
      let run = len(sub(p, tip));
      const body = Math.max(0, wireMm - Math.PI * M.jRadiusMm);
      while (run < body) {
        const nN = nrm(sub(p, mid.c));
        dir = nrm(sub(dir, sc(nN, dot(dir, nN))));
        const q = onSurface(mid, add(p, sc(dir, 2)));
        dir = nrm(sub(q, p));
        run += len(sub(q, p));
        p = q;
        pts.push(p);
      }
      wireInSacMm = run;
      // the J: a half turn at the tip
      const nN = nrm(sub(p, mid.c));
      const side = nrm(cross(dir, nN));
      const c = add(p, sc(side, M.jRadiusMm));
      for (let i = 1; i <= 8; i++) {
        const a = (i / 8) * Math.PI;
        pts.push(add(c, add(sc(side, -Math.cos(a) * M.jRadiusMm), sc(dir, Math.sin(a) * M.jRadiusMm))));
      }
    } else {
      pts.push(add(tip, sc(d, wireMm)));
    }
    tube(out.tubes, "pericardial", "j wire", resample([outside, ...pts], 1), M.wireRadiusMm, [0, 0, M.wireMu]);
  }
  out.positions.pericardial = { needleTip: tip, skinToSacMm: skinToSac, skinToEpicardiumMm: skinToEpi, tipInSac, tipBeyondEpicardium, wireInSacMm };
}

function transseptal(L: DeviceLandmarks, spec: TransseptalSpec, out: DeviceDrawing) {
  const M = DEVICE_MODEL.transseptal;
  const n = L.septalNormal;
  const svcHigh = add(L.svcRaJunction, sc(nrm(sub(L.svcTop, L.svcRaJunction)), M.svcHighMm));
  // the pull-down: from high in the SVC, along the septal side of the atrium, to the fossa
  const septalWall = add(lerp(L.svcRaJunction, L.fossa, 0.5), sc(n, M.septalOffsetMm));
  const drop = smoothPath([svcHigh, L.svcRaJunction, septalWall, L.fossa], 1);
  const ds = arcLengths(drop);
  let tip: Vec3;
  if (spec.stage === "svc") tip = svcHigh;
  else if (spec.stage === "descent") tip = pointAt(drop, clamp01(spec.descent ?? 0) * ds[ds.length - 1], ds);
  else if (spec.stage === "fossa") tip = L.fossa;
  else if (spec.stage === "tenting") tip = add(L.fossa, sc(n, M.tentMm));
  else tip = add(L.fossa, sc(n, M.crossMm));
  const st = L.stations;
  // the sheath and dilator come up the IVC; the curve faces the septum (posterior and to the left)
  const approach = add(tip, sc(n, -M.approachMm));
  const ctrl = [...groinVeins(L, "right"), st["ivc-low"], L.ivcRaJunction];
  // MODEL PARAMETER: a tip within 4 mm of the junction height or above it is still in the SVC
  const above = tip.y > L.svcRaJunction.y - 4;
  if (above) ctrl.push(add(L.ra.c, v(-RA_PASS_RIGHT_MM, 0, 0)), L.svcRaJunction, tip);
  else ctrl.push(add(L.ra.c, sc(n, -M.raBendMm)), approach, tip);
  const path = smoothPath(ctrl, 1.5);
  const s = arcLengths(path);
  const total = s[s.length - 1];
  const sheathEnd = total - M.dilatorOutMm;
  shaft(out.tubes, "transseptal", "sheath", cutPath(path, 0, sheathEnd, s), frToRadiusMm(M.sheathFr), { jacket: DEVICE_MU.jacket * M.sheathJacketShare });
  tube(out.tubes, "transseptal", "sheath marker", cutPath(path, sheathEnd - M.sheathMarkerMm, sheathEnd, s), frToRadiusMm(M.sheathFr), [0, 0, M.sheathMarkerMu]);
  const dil = cutPath(path, sheathEnd - M.dilatorInSheathMm, total, s);
  const dils = arcLengths(dil);
  const dl = dils[dils.length - 1] || 1;
  const rDil = frToRadiusMm(M.dilatorFr);
  const taper = (t: number) => Math.max(M.dilatorMinRadiusMm, rDil * Math.min(1, (dl - t) / M.dilatorTaperMm + M.dilatorTipShare));
  tube(out.tubes, "transseptal", "dilator", dil, dils.map(taper), [DEVICE_MU.polymerExcess, DEVICE_MU.jacket * M.dilatorJacketShare, 0]);
  // the needle inside, its tip at or beyond the dilator tip
  const needleOut = Math.max(0, spec.needleOutMm ?? (spec.stage === "crossed" ? M.crossedNeedleOutMm : 0));
  const dir = nrm(sub(path[path.length - 1], path[Math.max(0, path.length - 3)]));
  const needleTip = add(tip, sc(dir, needleOut));
  const needlePts = [...cutPath(path, 0, total - M.needleBehindMm, s), needleTip];
  tube(out.tubes, "transseptal", "needle", needlePts, M.needleRadiusMm, [0, 0, M.needleMu]);
  out.positions.transseptal = {
    tip,
    needleTip,
    tipToFossaMm: dot(sub(tip, L.fossa), n),
    crossed: ellipsoidRadius(L.la, tip) < 1 && dot(sub(tip, L.fossa), n) > M.tentMm + 1,
    stage: spec.stage,
  };
}

/**
 * The device tubes, bones, landmarks and positions for one frame. Pass the tubes and bones through
 * buildXrayScene's `extras` (the result's tubes and bones are plain TubeSpecs and BonePrims).
 */
export function deviceTubes(ctx: DeviceContext, devices: readonly DeviceSpec[]): DeviceDrawing {
  const landmarks = deviceLandmarks(ctx);
  const out: DeviceDrawing = { tubes: [], bones: [], positions: {}, landmarks };
  let rest: DeviceLandmarks | undefined;
  for (const d of devices) {
    if (d.kind === "iabp") iabp(landmarks, d, out);
    else if (d.kind === "microaxial-pump") pump(landmarks, d, out);
    else if (d.kind === "ecmo") ecmo(landmarks, d, out);
    else if (d.kind === "pacing-lead") pacingLead(landmarks, d, out);
    else if (d.kind === "rhc-catheter") rhc(landmarks, d, out);
    else if (d.kind === "pericardial") pericardial(landmarks, (rest ??= ctx.resp === 0 && !ctx.motion ? landmarks : deviceLandmarks({ heart: ctx.heart, resp: 0, seed: ctx.seed })), d, out);
    else if (d.kind === "transseptal") transseptal(landmarks, d, out);
  }
  return out;
}

/** The tip of each drawn device (for centring the table on the devices). */
export function deviceTips(d: DeviceDrawing): Vec3[] {
  const p = d.positions;
  const out: Vec3[] = [];
  if (p.iabp) out.push(p.iabp.tip);
  if (p.pump) out.push(p.pump.inlet);
  if (p.ecmo?.venousTip) out.push(p.ecmo.venousTip);
  if (p.pacing) out.push(p.pacing.tip);
  if (p.rhc) out.push(p.rhc.tip);
  if (p.pericardial) out.push(p.pericardial.needleTip);
  if (p.transseptal) out.push(p.transseptal.tip);
  return out;
}

/** IABP inflation for counterpulsation at 1:1 from the clock: deflated from the R wave to end-systole, inflated in diastole. */
export function iabpInflationAt(clock: { tInBeat: number; endSystole: number; rr: number }, ramp = DEVICE_MODEL.iabp.rampS): number {
  const t = clock.tInBeat;
  if (t < clock.endSystole) return 0;
  const up = clamp01((t - clock.endSystole) / ramp);
  const down = clamp01((clock.rr - t) / ramp);
  return Math.min(up, down);
}
