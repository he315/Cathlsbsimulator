// ---------------------------------------------------------------------------
// Vessel lumens for the device physics, in the aortic frame (mm): origin at
// the aortic valve, +x patient left, +y superior, +z anterior (the same frame
// as anatomy.ts and thorax.ts, before the render-only aortic tilt).
//
// The allowed space for a device is the UNION of:
//   - swept tubes (centre line + radius): the access route from outside the
//     skin through the sheath and the femoral/iliac or radial/brachial/
//     subclavian arteries, the whole aorta (descending, arch, ascending) built
//     from thorax.aorticCourse, both arm routes up to the innominate and left
//     subclavian, and the proximal coronary arteries;
//   - an analytic aortic root: three sinus lobes centred on the cusps, joined
//     at the commissures, with a closed-valve floor shaped as three pockets
//     (lowest at each cusp nadir, rising to the coaptation centre);
//   - the valve orifice and the left ventricular cavity, reachable only by a
//     rod that has crossed the valve (a firm push near the coaptation centre).
//
// A device segment of radius r at point p is inside a lumen when its distance
// to the wall exceeds r ("slack" ≥ 0). The query returns the lumen with the
// largest slack; if none is positive the segment is outside and is pushed
// back along that lumen's wall normal.
//
// Dimensions: see docs/realism/facts/S7.md. Values with a source are quoted
// there; every other dimension below is marked "model parameter".
// ---------------------------------------------------------------------------

import type { AccessRoute, Vec3 } from "../types";
import type { AnatomyModel, Ostium } from "../simulation/anatomy";
import { aorticCourse } from "../render/xray/thorax";

export const Region = {
  External: 0,
  Sheath: 1,
  Femoral: 2,
  Iliac: 3,
  AbdominalAorta: 4,
  DescendingAorta: 5,
  Arch: 6,
  Ascending: 7,
  Root: 8,
  LV: 9,
  Radial: 10,
  Brachial: 11,
  Subclavian: 12,
  Innominate: 13,
  Coronary: 14,
  Orifice: 15,
  /** the turn of a radial loop (variant "radial-loop", diag-route-wire-led-radial): radial artery with its own wall friction */
  RadialLoop: 16,
  /**
   * the same turn as met by a fine device (a 0.014 in wire: radius under RADIAL_LOOP.fineMaxR). Only the
   * lumen query reports it, for the contact's friction; the tube samples are RadialLoop.
   */
  RadialLoopFine: 17,
  /**
   * the radial artery gripping a catheter in spasm (diag-spasm-states): only the lumen query reports it,
   * for a catheter-sized device in the radial artery or its loop while the spasm is at or above
   * RADIAL_SPASM_LUMEN.gripAt; the tube samples keep their own region
   */
  RadialSpasm: 18,
} as const;
export type Region = (typeof Region)[keyof typeof Region];

export const REGION_NAMES: Record<number, string> = {
  0: "external",
  1: "sheath",
  2: "femoral",
  3: "iliac",
  4: "abdominal aorta",
  5: "descending aorta",
  6: "arch",
  7: "ascending aorta",
  8: "root",
  9: "left ventricle",
  10: "radial",
  11: "brachial",
  12: "subclavian",
  13: "innominate",
  14: "coronary",
  15: "valve orifice",
  16: "radial loop",
  17: "radial loop",
  18: "radial (spasm)",
};

/** Wall-friction scale per region (devices outside the skin are held by hands and the table: no wall). */
export function regionFrictionScale(r: number): number {
  if (r === Region.External) return 0;
  if (r === Region.Sheath) return 0.5; // model parameter: lubricated sheath valve and lumen
  if (r === Region.RadialLoop) return RADIAL_LOOP.friction; // model parameter: the tight turn of a small artery grips what is pushed round it
  if (r === Region.RadialLoopFine) return RADIAL_LOOP.frictionFine; // model parameter: a 0.014 in wire, a small part of the loop's lumen, meets far less of that grip
  if (r === Region.RadialSpasm) return RADIAL_SPASM_LUMEN.friction; // model parameter: the relaxed artery's friction; the grip is the shared model's, added at the hub (diag-spasm-states)
  return 1;
}

export interface Tube {
  name: string;
  n: number;
  pts: Float64Array;
  rad: Float64Array;
  region: Int16Array;
  cum: Float64Array;
  bbMin: [number, number, number];
  bbMax: [number, number, number];
  /** coronary vessel name and side, when this is a coronary lumen */
  vessel?: string;
  side?: "left" | "right";
  /** path distance from the coronary ostium to the vessel's first sample (mm) */
  offsetMm?: number;
}

export interface LumenHit {
  /** distance to the wall minus the rod radius (mm); ≥ 0 inside */
  slack: number;
  /** outward wall normal (unit) */
  nx: number;
  ny: number;
  nz: number;
  region: number;
  /** index of the lumen: tube index, or -1 root, -2 orifice, -3 LV */
  lumen: number;
  /** arclength along the tube at the closest point (mm) */
  s: number;
  /** the root floor (closed valve) is the active wall */
  floor: boolean;
}

export const LUMEN_ROOT = -1;
export const LUMEN_ORIFICE = -2;
export const LUMEN_LV = -3;

// ---------------------------------------------------------------------------
// Route control points (aortic frame, mm) and radii.
// ---------------------------------------------------------------------------

interface CtrlPt {
  p: Vec3;
  r: number;
  region: Region;
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** Sinus geometry derived from the anatomy model (radius R in anatomy.ts). */
export interface RootGeom {
  R: number;
  /** cusp centre azimuths (rad): left, right, non-coronary */
  cusps: [number, number, number];
  /** ascending-aorta radius (mm) */
  ascR: number;
  /** height of the sinotubular junction (top of the root lumen) */
  yTop: number;
  /** valve coaptation height above the cusp nadir (model parameter) */
  hCoapt: number;
  /** extra floor rise towards the commissures (model parameter) */
  hComm: number;
  /** valve orifice radius once crossed (mm) */
  rOrifice: number;
}

export interface LVGeom {
  c: Vec3;
  u1: Vec3;
  u2: Vec3;
  u3: Vec3;
  a: number;
  b: number;
}

export interface LumenOptions {
  route: AccessRoute;
  model: AnatomyModel;
  /** 0 end-expiration … 1 deep inspiration (straightens subclavian tortuosity) */
  resp?: number;
  /** sheath inner radius (mm); default fits a 6 F catheter */
  sheathRadius?: number;
  /** extra subclavian tortuosity (variant "tortuous-subclavian") */
  tortuousSubclavian?: boolean;
  /** extra iliac tortuosity (variant "tortuous-iliac") */
  tortuousIliac?: boolean;
  coronaries?: CoronaryInput[];
  /** aortic course provider (default thorax.aorticCourse) */
  aorticCourse?: CourseFn;
  /** include the arch branches (innominate/right arm, left subclavian/left arm) that are not the access route (default true) */
  archBranches?: boolean;
  /**
   * A radial loop at the radial-brachial junction of an arm route (variant "radial-loop"; RADIAL_LOOP).
   * Absent: taken from the model (withRouteVariants), so an engine that passes only the model gets it.
   */
  radialLoop?: boolean;
}

// ---------------------------------------------------------------------------
// Tortuous segments of the access route (diag-catheter-kink)
// ---------------------------------------------------------------------------

/**
 * The regions of the access route that a tortuosity variant makes tortuous, where a turning shaft
 * meets the wall at every bend and loses rotation to it (the catheter's torque loss and kinking in
 * src/physics/engine.ts): with "tortuous-iliac" the femoral and iliac part of the femoral route, with
 * "tortuous-subclavian" the axillary, subclavian and innominate part of an arm route (the same
 * stretches whose control points the variants displace, femoralCtrl and armCtrl). A route without
 * the variant has no tortuous segment. MODEL PARAMETER: which samples count, and that they count
 * fully (weight 1); the module text names the tortuous iliac and subclavian arteries as where
 * catheters lose torque and kink (pm-engaging-torque, Brilakis 5.4) and gives no measure of how much.
 */
export const TORTUOUS_REGIONS = {
  iliac: [Region.Femoral, Region.Iliac] as readonly number[],
  subclavian: [Region.Subclavian, Region.Innominate] as readonly number[],
};

/** Per-sample tortuosity weight (0..1) of a route tube for these lumen options (see TORTUOUS_REGIONS). */
export function routeTortuosity(t: Tube, o: Pick<LumenOptions, "route" | "tortuousIliac" | "tortuousSubclavian">): Float64Array {
  const out = new Float64Array(t.n);
  const regions = o.route === "femoral" ? (o.tortuousIliac ? TORTUOUS_REGIONS.iliac : null) : o.tortuousSubclavian ? TORTUOUS_REGIONS.subclavian : null;
  if (!regions) return out;
  for (let i = 0; i < t.n; i++) if (regions.includes(t.region[i])) out[i] = 1;
  return out;
}

// ---------------------------------------------------------------------------
// The radial loop (diag-route-wire-led-radial)
// ---------------------------------------------------------------------------

/**
 * The radial loop of the 'radial-loop' variant: a full turn of the artery at the radial-brachial
 * junction. The access route (src/simulation/access/route.ts, the procedure lab's wire model and the
 * drawing) and the device physics share this circle: MP_ROUTE.loopR there is RADIAL_LOOP.loopR, and both
 * place their samples with radialLoopPoints. MODEL PARAMETERS (the module text names the loop and what
 * it does to wires and catheters, pm-to-the-root-radial, and gives no dimension):
 *   loopR        radius of the loop's centre line (mm)
 *   n            samples per turn
 *   advanceMm    how far the artery moves on along its course over the turn (mm)
 *   drawLumenR   the lumen radius the route draws in the loop (mm)
 *   lumenR       the lumen radius the device physics gives the loop (mm): the radial artery's here
 *   liftMm       the physics loop rises this much out of its plane over the turn, so that the artery
 *                leaving the loop passes over the artery entering it instead of running into it (a
 *                planar loop's two crossings would be one lumen, and a device would cut across)
 *   settleMm     length of artery beyond the loop over which the physics loop comes back into the plane (mm)
 *   friction     wall-friction scale of the loop's samples (Region.RadialLoop; 1 elsewhere in the artery)
 *   fineMaxR, frictionFine   a device of radius above 0 and under fineMaxR (mm; the 0.014 in coronary wire's
 *                0.18 mm, not a 0.035 in wire's 0.44 mm) meets the loop with wall-friction scale
 *                frictionFine instead (Region.RadialLoopFine): the module text gives the 0.014 in wire
 *                "to negotiate loops" (06-to-the-root.ts:696) and shows loops crossed with it (:743), so
 *                it crosses where a J wire stalls
 */
export const RADIAL_LOOP = { loopR: 5, n: 24, advanceMm: 1.5, drawLumenR: 1.0, lumenR: 1.18, liftMm: 3.6, settleMm: 14, friction: 8, fineMaxR: 0.3, frictionFine: 2 } as const;

/**
 * The samples of a radial loop that starts at c0 on an artery running along `tan` (unit), bulging
 * towards `side` (unit, perpendicular to tan): k = 1 .. n-1 of a circle tangent to the artery at c0 that
 * advances by advanceMm over the turn. With `lift` (a unit vector perpendicular to both, and a height in
 * mm) the turn rises linearly out of its plane (the physics loop); without it the loop is planar (the
 * route's drawing), point for point the circle the route always drew.
 */
export function radialLoopPoints(c0: Vec3, tan: Vec3, side: Vec3, lift?: { dir: Vec3; mm: number }, o: { loopR?: number; n?: number; advanceMm?: number } = {}): Vec3[] {
  const R = o.loopR ?? RADIAL_LOOP.loopR;
  const N = o.n ?? RADIAL_LOOP.n;
  const adv = o.advanceMm ?? RADIAL_LOOP.advanceMm;
  const out: Vec3[] = [];
  for (let k = 1; k < N; k++) {
    const a = (2 * Math.PI * k) / N;
    const s1 = R * (1 - Math.cos(a));
    const t1 = R * Math.sin(a) + adv * (k / N);
    const h = lift ? lift.mm * (k / N) : 0;
    const lx = lift ? lift.dir.x * h : 0, ly = lift ? lift.dir.y * h : 0, lz = lift ? lift.dir.z * h : 0;
    // summed as the route always summed its loop: c0 + (side s1 + tan t1)
    out.push(v(c0.x + (side.x * s1 + tan.x * t1 + lx), c0.y + (side.y * s1 + tan.y * t1 + ly), c0.z + (side.z * s1 + tan.z * t1 + lz)));
  }
  return out;
}

/** The loop's side and lift directions for an artery running along `tan` (the route's convention: side = tan × z). */
export function radialLoopFrame(tan: Vec3): { side: Vec3; up: Vec3 } {
  const side = norm(cross(tan, v(0, 0, 1)));
  const up = norm(cross(side, tan));
  return { side, up };
}

/**
 * The route variants the lumen builds, carried on the anatomy model. The physics engine
 * (src/physics/engine.ts) builds its LumenSet from the model and its own tortuosity flags only, so the
 * radial loop reaches the solver's lumen (in the worker too: the model is posted with the scene) on the
 * model it already receives: withRouteVariants copies the model with the variants; LumenSet reads them
 * when its options do not say. The diagnostic lab's physics (src/ui/physics/physicsDevices.ts) uses it.
 */
const ROUTE_VARIANTS_KEY = "lumenRouteVariants";
export const LUMEN_ROUTE_VARIANTS = ["radial-loop"] as const;
export type LumenRouteVariant = (typeof LUMEN_ROUTE_VARIANTS)[number];

export function withRouteVariants<M extends AnatomyModel>(model: M, variants: readonly string[] | undefined): M {
  const keep = (variants ?? []).filter((x): x is LumenRouteVariant => (LUMEN_ROUTE_VARIANTS as readonly string[]).includes(x));
  if (!keep.length) return model;
  return { ...model, [ROUTE_VARIANTS_KEY]: keep };
}

/** The route variants a model carries for the lumen (withRouteVariants); none for an ordinary model. */
export function routeVariantsOf(model: AnatomyModel): readonly LumenRouteVariant[] {
  const x = (model as unknown as Record<string, unknown>)[ROUTE_VARIANTS_KEY];
  return Array.isArray(x) ? (x as LumenRouteVariant[]) : [];
}

/**
 * The radial loop's straightening as an entry of the coronary motion list (LumenSet.moveCoronaries
 * reads it and moves no coronary). The engine has no lumen command, and the coronary motion is the one
 * message the lab sends the solver's lumen every frame (in the worker too); the diagnostic lab's physics
 * sends this entry with every step while the loop is straightened, so a step the worker drops loses
 * nothing.
 */
export const LOOP_CONTROL = "@radial-loop";
export function loopControlInput(straighten: number): CoronaryInput {
  return { name: LOOP_CONTROL, side: "right", pts: [], radii: [Math.max(0, Math.min(1, straighten))] };
}

/**
 * Radial spasm in the lumen (diag-spasm-states), MODEL PARAMETERS: while the radial artery is in spasm
 * its lumen narrows by the shared model's radialLumenScale (radialSpasm.ts, passed in as `lumenScale`)
 * but never below a device's radius plus clearanceMm (the artery closes on the shaft, it does not cut
 * it), and from a tone of gripAt a catheter-sized device (radius at least RADIAL_LOOP.fineMaxR) is
 * reported in Region.RadialSpasm. Its wall-friction scale `friction` is the relaxed artery's 1: the
 * grip has one source, the shared model's (radialSpasm.ts gripForceN), which the diagnostic lab adds
 * to the hub reaction (DiagnosticPhysics.reaction) and to the hub force of a pull, so a rod-mode
 * withdrawal meets the same grip as the simple catheter model's.
 */
export const RADIAL_SPASM_LUMEN = { clearanceMm: 0.03, gripAt: 0.35, friction: 1 } as const;

/**
 * The radial artery's spasm as an entry of the coronary motion list, as the radial loop's
 * straightening is (loopControlInput): LumenSet.moveCoronaries reads it and moves no coronary. The
 * diagnostic lab's physics sends it with every step while the artery is in spasm.
 */
export const SPASM_CONTROL = "@radial-spasm";
export function spasmControlInput(level: number, lumenScale: number): CoronaryInput {
  const c = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  return { name: SPASM_CONTROL, side: "right", pts: [], radii: [c(level), Math.max(0.05, Math.min(1, Number.isFinite(lumenScale) ? lumenScale : 1))] };
}

/**
 * The aortic valve's opening in the rod model (diag-lv-aorta-task). Off by default: with no valve setting the
 * valve is the closed floor it always was, crossed only by a tip pressed firmly at its centre (contact.ts).
 * With one, the leaflets open in systole: an orifice through the floor, open by the share `open` (0..1, the
 * patient engine's aortic valve flow, PatientEngine.aorticValveOpening), whose full radius follows the valve
 * area. A rod segment that fits through it (its centre inside the open radius less its own radius) is in the
 * orifice; one that has dropped crossBelowMm below the valve plane inside it has crossed (engine.ts), and
 * the floor closes behind the rest in diastole. MODEL PARAMETERS, none from the module text:
 *   normalAreaCm2          the area of a normal valve's opening (its full radius is that of a disc of the area)
 *   maxRadiusShare         the full opening never exceeds this share of the annulus radius
 *   crossBelowMm           depth below the valve plane at which a segment in the opening has crossed
 *   difficultRadiusShare   a difficult valve opens to this share of the normal radius, offset from the axis
 *   eccentricShare         the offset of a difficult or stenotic opening from the axis, share of the annulus radius
 *   minRadiusMm            the smallest radius an opening is given
 * The difficult valve stands for the valve a pigtail will not cross (hb-cardiac-catheterisation#4): its small
 * eccentric opening admits a straight or hydrophilic wire but not the curve of a J or the loop of a pigtail.
 */
export const VALVE_OPENING = {
  normalAreaCm2: 3,
  maxRadiusShare: 0.75,
  crossBelowMm: 2,
  difficultRadiusShare: 0.16,
  eccentricShare: 0.18,
  minRadiusMm: 0.8,
};

/** The valve as the lab sets it: how open it is now, its area (null: normal) and whether it is the difficult valve. */
export interface ValveSetting {
  open: number;
  areaCm2?: number | null;
  difficult?: boolean;
}

/**
 * The valve setting as an entry of the coronary motion list, as the radial loop's straightening is
 * (loopControlInput): LumenSet.moveCoronaries reads it and moves no coronary. The diagnostic lab's physics
 * would send it with every step from the patient engine's valve (open, area) and the case (difficult).
 */
export const VALVE_CONTROL = "@aortic-valve";
export function valveControlInput(v: ValveSetting): CoronaryInput {
  const open = Math.max(0, Math.min(1, Number.isFinite(v.open) ? v.open : 0));
  const area = v.areaCm2 && v.areaCm2 > 0 ? v.areaCm2 : 0;
  return { name: VALVE_CONTROL, side: "left", pts: [], radii: [open, area, v.difficult ? 1 : 0] };
}

export type CourseFn = (route: "femoral" | "radial-right" | "radial-left", yTop: number) => Vec3[];

/** A coronary centre line for a lumen (positions in the physics frame, radii in mm). */
export interface CoronaryInput {
  name: string;
  side: "left" | "right";
  pts: Vec3[];
  radii: number[];
  /** path distance from the ostium to pts[0] (mm); 0 for vessels that start at an ostium */
  offsetMm?: number;
}

/** Ostium funnel: radius factor where a coronary opens onto the sinus (model parameter). */
export const OSTIUM_FUNNEL = 1.9;

/**
 * Lumen radii of a coronary tube (one more than the samples: the tube starts 3 mm inside the root).
 * The ostium is a funnel opening onto the sinus (model parameter: 1.9× the vessel radius inside the
 * root wall, tapering to the vessel radius 4 mm beyond the ostium).
 */
export function coronaryRadii(c: CoronaryInput): Float64Array {
  const rad = new Float64Array(c.pts.length + 1);
  rad[0] = c.radii[0] * OSTIUM_FUNNEL;
  let acc = 0;
  for (let i = 0; i < c.pts.length; i++) {
    if (i > 0) acc += Math.hypot(c.pts[i].x - c.pts[i - 1].x, c.pts[i].y - c.pts[i - 1].y, c.pts[i].z - c.pts[i - 1].z);
    const r = c.radii[Math.min(i, c.radii.length - 1)];
    const f = 1 + (OSTIUM_FUNNEL - 1) * 0.55 * Math.max(0, 1 - acc / 4);
    rad[i + 1] = r * f;
  }
  return rad;
}

/** Ascending aorta radius relative to the anatomy's sinus radius (model parameter, see facts: Wolak 2008 mean 33 mm vs sinus 36 mm). */
export const ASC_RADIUS_RATIO = 0.9;

function rootGeom(model: AnatomyModel): RootGeom {
  const R = model.sinusRadius;
  const lAz = model.lm.az;
  const rAz = model.rca.az;
  // non-coronary cusp: opposite the bisector of the two coronary cusps, on the posterior side
  let nx = -(Math.cos(lAz) + Math.cos(rAz));
  let nz = -(Math.sin(lAz) + Math.sin(rAz));
  if (Math.hypot(nx, nz) < 0.2) {
    nx = 0;
    nz = -1;
  }
  if (nz > 0) {
    nx = -nx;
    nz = -nz;
  }
  const nAz = Math.atan2(nz, nx);
  return {
    R,
    cusps: [lAz, rAz, nAz],
    ascR: R * ASC_RADIUS_RATIO,
    yTop: model.sinusTopY,
    hCoapt: 8, // model parameter
    hComm: 10, // model parameter
    rOrifice: 0.32 * R, // model parameter
  };
}

/** The LV cavity the rod model uses (an ellipsoid along the heart's long axis), also read by the left heart task's position classes. */
export function lvGeom(): LVGeom {
  // long axis along the heart's base-to-apex direction (heart.ts makeHeart: apex − base ∝ (62, −80, 62))
  const L = norm(v(62, -80, 62));
  let s = norm(sub(v(1, 0, 0), scale(L, L.x)));
  const a3 = norm(cross(L, s));
  s = norm(cross(a3, L));
  const a = 40; // model parameter: LV cavity semi-axis along the long axis (mm)
  const b = 22; // model parameter: short-axis cavity radius (mm)
  const c = add(v(0, -3, 0), scale(L, a));
  return { c, u1: L, u2: s, u3: a3, a, b };
}

function femoralCtrl(o: LumenOptions, sheathR: number): CtrlPt[] {
  const tort = o.tortuousIliac ? 1 : 0;
  // model parameters: right common femoral access, sheath 100 mm inside the body
  const pts: CtrlPt[] = [
    { p: v(-82, -500, 18), r: sheathR, region: Region.Sheath }, // skin
    { p: v(-80, -478, -5), r: sheathR, region: Region.Sheath },
    { p: v(-76, -452, -36), r: sheathR, region: Region.Sheath }, // arteriotomy, common femoral
    { p: v(-66 - 6 * tort, -430, -58), r: 4.05, region: Region.Femoral }, // sheath tip in the external iliac
    { p: v(-54 + 8 * tort, -410, -72), r: 4.05, region: Region.Iliac },
    { p: v(-40 - 6 * tort, -392, -85), r: 4.05, region: Region.Iliac },
    { p: v(-16, -365, -94), r: 4.85, region: Region.Iliac }, // common iliac
  ];
  return pts;
}

function aortaCtrl(geomRoot: RootGeom, courseFn: CourseFn): CtrlPt[] {
  const course = courseFn("femoral", geomRoot.yTop - 2);
  const out: CtrlPt[] = [];
  for (const p of course) {
    let r: number;
    let region: Region;
    if (p.y < -150) {
      r = 8.5; // model parameter: infrarenal abdominal aorta
      region = Region.AbdominalAorta;
    } else if (p.y < 60 && p.z < -60) {
      r = 12; // Wolak 2008: descending thoracic aorta mean 24 mm
      region = Region.DescendingAorta;
    } else if (p.y >= 60 && p.z < -8) {
      r = 14.5; // model parameter: arch, between descending and ascending
      region = Region.Arch;
    } else {
      r = geomRoot.ascR;
      region = Region.Ascending;
    }
    out.push({ p, r, region });
  }
  // descending aorta: thoracic radius above the diaphragm, abdominal taper below
  return out;
}

function armCtrl(side: 1 | -1, o: LumenOptions, sheathR: number, fromWrist: boolean, geomRoot: RootGeom): CtrlPt[] {
  const courseFn = o.aorticCourse ?? aorticCourse;
  const resp = o.resp ?? 0;
  // tortuosity of the subclavian/axillary segment straightens on deep inspiration (model parameter)
  const amp = (o.tortuousSubclavian ? 9 : 4) * (1 - 0.7 * resp);
  const s = side; // +1 left arm, −1 right arm
  const pts: CtrlPt[] = [];
  if (fromWrist) {
    pts.push(
      { p: v(239 * s, -345, 14), r: sheathR, region: Region.Sheath }, // skin at the wrist (sheath nearly coaxial with the artery)
      { p: v(238 * s, -322, 10), r: sheathR, region: Region.Sheath },
      { p: v(236 * s, -262, 4), r: 1.18, region: Region.Radial }, // Hasan 2025: radial artery 2.35 mm
      { p: v(232 * s, -180, -8), r: 1.18, region: Region.Radial },
      { p: v(226 * s, -100, -22), r: 1.6, region: Region.Brachial } // model parameter: brachial at the elbow
    );
  }
  pts.push(
    { p: v(220 * s, -20, -32), r: 2.0, region: Region.Brachial }, // model parameter
    { p: v(210 * s, 60, -38), r: 2.2, region: Region.Brachial },
    { p: v(192 * s, 112 + amp * 0.5, -38), r: 2.8, region: Region.Subclavian } // model parameter: axillary
  );
  const course = courseFn(s < 0 ? "radial-right" : "radial-left", geomRoot.yTop - 2);
  course.forEach((p, i) => {
    const t = i / Math.max(1, course.length - 1);
    const wig = i > 0 && i < course.length - 2 ? amp * Math.sin(i * 1.7) : 0;
    const inAsc = p.y < 84 && Math.abs(p.x) < 8;
    pts.push({
      p: v(p.x, p.y + wig, p.z + 0.6 * wig),
      r: inAsc ? geomRoot.ascR : t < 0.3 ? 3.6 : 5.5, // model parameters: subclavian 3.6, innominate 5.5
      region: inAsc ? Region.Ascending : t < 0.3 ? Region.Subclavian : Region.Innominate,
    });
  });
  return pts;
}

/** Catmull–Rom resampling of control points at ~step mm into a Tube. */
function makeTube(name: string, ctrl: CtrlPt[], step: number, prefixExternal?: { dir: Vec3; length: number; r: number }): Tube {
  const P: CtrlPt[] = [];
  if (prefixExternal) {
    const s0 = ctrl[0].p;
    const far = add(s0, scale(prefixExternal.dir, prefixExternal.length));
    P.push({ p: far, r: prefixExternal.r, region: Region.External });
    P.push({ p: add(s0, scale(prefixExternal.dir, 30)), r: prefixExternal.r, region: Region.External });
  }
  P.push(...ctrl);
  const xs: number[] = [];
  const rs: number[] = [];
  const regs: number[] = [];
  const get = (i: number) => P[Math.max(0, Math.min(P.length - 1, i))];
  for (let i = 0; i < P.length - 1; i++) {
    const a = get(i - 1), b = get(i), c = get(i + 1), d = get(i + 2);
    const segLen = Math.hypot(c.p.x - b.p.x, c.p.y - b.p.y, c.p.z - b.p.z);
    // straight external line and long segments: linear; elsewhere Catmull–Rom
    const linear = b.region === Region.External || segLen > 200;
    const m = Math.max(1, Math.ceil(segLen / step));
    for (let k = 0; k < m; k++) {
      const t = k / m;
      let x: number, y: number, z: number;
      if (linear) {
        x = b.p.x + (c.p.x - b.p.x) * t;
        y = b.p.y + (c.p.y - b.p.y) * t;
        z = b.p.z + (c.p.z - b.p.z) * t;
      } else {
        x = catmull(a.p.x, b.p.x, c.p.x, d.p.x, t);
        y = catmull(a.p.y, b.p.y, c.p.y, d.p.y, t);
        z = catmull(a.p.z, b.p.z, c.p.z, d.p.z, t);
      }
      xs.push(x, y, z);
      rs.push(b.r + (c.r - b.r) * t);
      regs.push(t < 0.5 ? b.region : c.region);
    }
  }
  const last = P[P.length - 1];
  xs.push(last.p.x, last.p.y, last.p.z);
  rs.push(last.r);
  regs.push(last.region);
  return tubeFromArrays(name, Float64Array.from(xs), Float64Array.from(rs), Int16Array.from(regs));
}

/**
 * The arm route with a radial loop inserted at its radial-brachial junction (RADIAL_LOOP): the same
 * circle the access route draws (radialLoopPoints at the first brachial sample, bulging towards
 * tan × z), rising liftMm out of its plane over the turn, with the artery beyond it brought back into
 * the plane over settleMm. The loop's samples are Region.RadialLoop (radial artery with the loop's wall
 * friction) of radius lumenR.
 * Returns the tube and the loop's span of route arclength, or null when the tube has no junction.
 */
function withRadialLoop(t: Tube, straighten = 0): { tube: Tube; span: [number, number] } | null {
  let j = -1;
  for (let i = 0; i < t.n; i++)
    if (t.region[i] === Region.Brachial) {
      j = i;
      break;
    }
  if (j < 3 || j > t.n - 3) return null;
  const P = (i: number) => v(t.pts[3 * i], t.pts[3 * i + 1], t.pts[3 * i + 2]);
  const c0 = P(j);
  const tan = norm(sub(P(j + 1), P(j - 1)));
  const { side, up } = radialLoopFrame(tan);
  // a straightened loop (balloon-assisted tracking): each sample moves towards the artery's own course
  // (c0 on along tan), the lift going with the turn, so the turn opens and the route shortens; f = 1 is
  // the artery pulled straight (the redundant length folds into the accordion the drawing shows)
  const f = Math.max(0, Math.min(1, straighten));
  const lift = RADIAL_LOOP.liftMm * (1 - f);
  const turn = radialLoopPoints(c0, tan, side, { dir: up, mm: lift });
  const loop =
    f > 0
      ? turn.map((p, i) => {
          const q = (i + 1) / RADIAL_LOOP.n;
          const cx = c0.x + tan.x * RADIAL_LOOP.advanceMm * q + up.x * lift * q;
          const cy = c0.y + tan.y * RADIAL_LOOP.advanceMm * q + up.y * lift * q;
          const cz = c0.z + tan.z * RADIAL_LOOP.advanceMm * q + up.z * lift * q;
          return v(p.x + (cx - p.x) * f, p.y + (cy - p.y) * f, p.z + (cz - p.z) * f);
        })
      : turn;
  const xs: number[] = [];
  const rs: number[] = [];
  const regs: number[] = [];
  for (let i = 0; i < j; i++) {
    xs.push(t.pts[3 * i], t.pts[3 * i + 1], t.pts[3 * i + 2]);
    rs.push(t.rad[i]);
    regs.push(t.region[i]);
  }
  for (const p of loop) {
    xs.push(p.x, p.y, p.z);
    rs.push(RADIAL_LOOP.lumenR);
    regs.push(Region.RadialLoop);
  }
  // beyond the loop the artery comes back down into its plane (a smooth step over settleMm)
  let acc = 0;
  for (let i = j; i < t.n; i++) {
    if (i > j) acc += Math.hypot(t.pts[3 * i] - t.pts[3 * i - 3], t.pts[3 * i + 1] - t.pts[3 * i - 2], t.pts[3 * i + 2] - t.pts[3 * i - 1]);
    const u = Math.min(1, acc / RADIAL_LOOP.settleMm);
    const h = lift * (1 - u * u * (3 - 2 * u));
    xs.push(t.pts[3 * i] + up.x * h, t.pts[3 * i + 1] + up.y * h, t.pts[3 * i + 2] + up.z * h);
    rs.push(i === j ? RADIAL_LOOP.lumenR : t.rad[i]);
    regs.push(t.region[i]);
  }
  const tube = tubeFromArrays(t.name, Float64Array.from(xs), Float64Array.from(rs), Int16Array.from(regs));
  const a = tube.cum[j - 1];
  const b = tube.cum[j + loop.length];
  return { tube, span: [a, b] };
}

export function tubeFromArrays(name: string, pts: Float64Array, rad: Float64Array, region: Int16Array): Tube {
  const n = rad.length;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[3 * i] - pts[3 * i - 3], pts[3 * i + 1] - pts[3 * i - 2], pts[3 * i + 2] - pts[3 * i - 1]);
  }
  const t: Tube = { name, n, pts, rad, region, cum, bbMin: [0, 0, 0], bbMax: [0, 0, 0] };
  updateBounds(t);
  return t;
}

export function updateBounds(t: Tube): void {
  let maxR = 0;
  const mn: [number, number, number] = [Infinity, Infinity, Infinity];
  const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < t.n; i++) {
    for (let k = 0; k < 3; k++) {
      const c = t.pts[3 * i + k];
      if (c < mn[k]) mn[k] = c;
      if (c > mx[k]) mx[k] = c;
    }
    if (t.rad[i] > maxR) maxR = t.rad[i];
  }
  for (let k = 0; k < 3; k++) {
    mn[k] -= maxR + 2;
    mx[k] += maxR + 2;
  }
  t.bbMin = mn;
  t.bbMax = mx;
  for (let i = 1; i < t.n; i++) {
    t.cum[i] = t.cum[i - 1] + Math.hypot(t.pts[3 * i] - t.pts[3 * i - 3], t.pts[3 * i + 1] - t.pts[3 * i - 2], t.pts[3 * i + 2] - t.pts[3 * i - 1]);
  }
}

// ---------------------------------------------------------------------------
// LumenSet
// ---------------------------------------------------------------------------

export interface RodLumenFlags {
  /** the rod has crossed the aortic valve into the left ventricle */
  crossedValve: boolean;
}

export class LumenSet {
  readonly route: AccessRoute;
  readonly model: AnatomyModel;
  readonly root: RootGeom;
  readonly lv: LVGeom;
  /** tube 0 is the access route (hub path) */
  tubes: Tube[];
  /** number of non-coronary tubes (coronaries follow) */
  nFixedTubes: number;
  private opts: LumenOptions;
  private respBuilt = -1;

  constructor(o: LumenOptions) {
    this.route = o.route;
    this.model = o.model;
    this.opts = o;
    this.root = rootGeom(o.model);
    this.lv = lvGeom();
    this.tubes = [];
    this.nFixedTubes = 0;
    this.build(o.resp ?? 0);
    this.setCoronaries(o.coronaries ?? defaultCoronaries(o.model));
  }

  /** Rebuild the vascular tubes (breathing changes the arm routes). */
  build(resp: number): void {
    const o = { ...this.opts, resp };
    const sheathR = o.sheathRadius ?? 1.15; // model parameter: 6 F sheath lumen for a 6 F (2.0 mm) catheter
    const aorta = aortaCtrl(this.root, o.aorticCourse ?? aorticCourse);
    const tubes: Tube[] = [];
    this.radialLoopSpan = null;
    if (o.route === "femoral") {
      const access = [...femoralCtrl(o, sheathR), ...aorta];
      const dirOut = norm(sub(access[0].p, access[2].p));
      tubes.push(makeTube("access", access, 4, { dir: dirOut, length: 1800, r: 1.2 }));
      if (o.archBranches !== false) {
        tubes.push(makeTube("right arm", armCtrl(-1, o, sheathR, false, this.root), 4));
        tubes.push(makeTube("left arm", armCtrl(1, o, sheathR, false, this.root), 4));
      }
    } else {
      const side: 1 | -1 = o.route === "radial-left" ? 1 : -1;
      const access = armCtrl(side, o, sheathR, true, this.root);
      const dirOut = norm(sub(access[0].p, access[2].p));
      const arm = makeTube("access", access, 4, { dir: dirOut, length: 1800, r: 1.2 });
      const loop = (o.radialLoop ?? routeVariantsOf(o.model).includes("radial-loop")) ? withRadialLoop(arm, this.loopStraighten) : null;
      tubes.push(loop ? loop.tube : arm);
      this.radialLoopSpan = loop ? loop.span : null;
      tubes.push(makeTube("aorta", aorta, 4));
      if (o.archBranches !== false) tubes.push(makeTube(side < 0 ? "left arm" : "right arm", armCtrl(side < 0 ? 1 : -1, o, sheathR, false, this.root), 4));
    }
    const coronaries = this.tubes.slice(this.nFixedTubes);
    this.tubes = [...tubes, ...coronaries];
    this.nFixedTubes = tubes.length;
    this.respBuilt = resp;
    this.tortuosity = routeTortuosity(tubes[0], o);
  }

  /** Tortuosity weight per sample of the access route (routeTortuosity; all zero without a tortuosity variant). */
  tortuosity: Float64Array = new Float64Array(0);

  /** The radial loop on the access route (route arclengths of its first and last samples, mm), or null. */
  radialLoopSpan: [number, number] | null = null;

  /** How far the radial loop has been straightened, 0 (the turn) … 1 (pulled straight). */
  loopStraighten = 0;

  /** The radial artery's spasm (diag-spasm-states): its tone and the lumen scale at that tone; level 0 changes nothing. */
  radialSpasm = { level: 0, lumenScale: 1 };

  /**
   * The aortic valve's opening (diag-lv-aorta-task, VALVE_OPENING): null until a lab sets it (the closed floor
   * as before). fullR is the radius of the full opening (mm), cx and cz its centre, open the share open now.
   */
  valve: { open: number; fullR: number; cx: number; cz: number; areaCm2: number | null; difficult: boolean } | null = null;

  /** Set the aortic valve's opening; null returns to the closed floor of the earlier model. */
  setValve(v: ValveSetting | null): void {
    if (!v) {
      this.valve = null;
      return;
    }
    const g = this.root;
    const Ra = g.R * 0.88;
    const V = VALVE_OPENING;
    const area = v.areaCm2 && v.areaCm2 > 0 ? v.areaCm2 : null;
    const discR = (a: number) => Math.sqrt((a * 100) / Math.PI); // mm, from cm²
    let fullR = Math.min(V.maxRadiusShare * Ra, discR(V.normalAreaCm2));
    if (area !== null) fullR = Math.min(fullR, discR(area));
    if (v.difficult) fullR *= V.difficultRadiusShare;
    fullR = Math.max(V.minRadiusMm, fullR);
    // a difficult or stenotic opening lies off the axis, towards the non-coronary cusp (the eccentric jet)
    const ecc = v.difficult || (area !== null && area < V.normalAreaCm2) ? V.eccentricShare * Ra : 0;
    const az = g.cusps[2];
    const open = Math.max(0, Math.min(1, Number.isFinite(v.open) ? v.open : 0));
    const cur = this.valve;
    if (cur && cur.fullR === fullR && cur.areaCm2 === area && cur.difficult === !!v.difficult) {
      // in place: the motion sends it with every step
      cur.open = open;
      return;
    }
    this.valve = { open, fullR, cx: ecc * Math.cos(az), cz: ecc * Math.sin(az), areaCm2: area, difficult: !!v.difficult };
  }

  /** Radius (mm) the valve is open to now; 0 when closed or not set. */
  valveOpenRadius(): number {
    const v = this.valve;
    return v && v.open > 0 ? v.open * v.fullR : 0;
  }

  /** Whether a segment centre (x, z) of radius r fits through the valve's opening now. */
  inValveOpening(x: number, z: number, r: number): boolean {
    const v = this.valve;
    if (!v || !(v.open > 0)) return false;
    return Math.hypot(x - v.cx, z - v.cz) < v.open * v.fullR - r;
  }

  /**
   * Whether a rod has dropped through the valve's opening now: one of its distal bodies (from index `from`)
   * VALVE_OPENING.crossBelowMm below the valve plane inside the opening (positions xyz per body). The engine
   * then marks the rod as having crossed (diag-lv-aorta-task).
   */
  rodThroughOpening(pos: ArrayLike<number>, n: number, from: number): boolean {
    if (!(this.valveOpenRadius() > 0)) return false;
    for (let i = Math.max(0, from); i < n; i++) {
      if (pos[3 * i + 1] < -VALVE_OPENING.crossBelowMm && this.inValveOpening(pos[3 * i], pos[3 * i + 2], 0)) return true;
    }
    return false;
  }

  /** Radius (mm) of the orifice round a rod that has crossed: the model's orifice, no wider than the valve's full opening when one is set. */
  crossedOrificeRadius(): number {
    const v = this.valve;
    return v ? Math.min(this.root.rOrifice, Math.max(VALVE_OPENING.minRadiusMm, v.fullR)) : this.root.rOrifice;
  }

  /** Set the radial artery's spasm (spasmControlInput carries it to the solver's copy). */
  setRadialSpasm(level: number, lumenScale: number): void {
    const l = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
    const k = Math.max(0.05, Math.min(1, Number.isFinite(lumenScale) ? lumenScale : 1));
    // in place: the coronary motion sends it with every step during a spasm
    this.radialSpasm.level = l > 0 ? l : 0;
    this.radialSpasm.lumenScale = l > 0 ? k : 1;
  }

  /**
   * Straighten the radial loop to f (0..1) and rebuild the access route; false when nothing changed (no
   * loop, or the same value). The diagnostic lab sends it with the coronary motion (loopControlInput).
   */
  setLoopStraighten(f: number): boolean {
    const x = Math.max(0, Math.min(1, Number.isFinite(f) ? f : 0));
    if (Math.abs(x - this.loopStraighten) < 1e-4) return false;
    this.loopStraighten = x;
    if (!this.radialLoopSpan) return false;
    this.build(this.respBuilt < 0 ? 0 : this.respBuilt);
    return true;
  }

  /** The access route's tortuosity weight (0..1) at arclength s, interpolated; 0 beyond either end. */
  tortuosityAt(s: number): number {
    const t = this.tubes[0];
    const w = this.tortuosity;
    if (!t || w.length !== t.n || !(s >= 0) || s > t.cum[t.n - 1]) return 0;
    let lo = 0, hi = t.n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (t.cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const span = t.cum[hi] - t.cum[lo];
    const f = span > 1e-9 ? (s - t.cum[lo]) / span : 0;
    return w[lo] + (w[hi] - w[lo]) * f;
  }

  /** Whether the access route has any tortuous segment. */
  get hasTortuousSegment(): boolean {
    for (let i = 0; i < this.tortuosity.length; i++) if (this.tortuosity[i] > 0) return true;
    return false;
  }

  /** Rebuild the breathing-dependent tubes when respiration has changed enough. */
  updateResp(resp: number): boolean {
    if (Math.abs(resp - this.respBuilt) < 0.03) return false;
    this.build(resp);
    return true;
  }

  /** Replace the coronary lumens (called once, or each frame as the heart moves). */
  setCoronaries(list: CoronaryInput[]): void {
    const fixed = this.tubes.slice(0, this.nFixedTubes);
    const cor: Tube[] = [];
    for (const c of list) {
      if (c.pts.length < 2) continue;
      // start the tube a few mm inside the root so the ostium joins the sinus without a gap
      const d = norm(sub(c.pts[1], c.pts[0]));
      const pre = sub(c.pts[0], scale(d, 3));
      const pts: number[] = [pre.x, pre.y, pre.z];
      for (const p of c.pts) pts.push(p.x, p.y, p.z);
      const rad = coronaryRadii(c);
      const t = tubeFromArrays(c.name, Float64Array.from(pts), rad, new Int16Array(rad.length).fill(Region.Coronary));
      t.vessel = c.name;
      t.side = c.side;
      t.offsetMm = c.offsetMm ?? 0;
      cor.push(t);
    }
    this.tubes = [...fixed, ...cor];
  }

  /**
   * Move existing coronary lumens in place (same names and sample counts). Positions, radii, the
   * cumulative arclengths (depth along the vessel) and the bounds are all refreshed.
   */
  moveCoronaries(list: CoronaryInput[]): void {
    for (const c of list) {
      if (c.name === LOOP_CONTROL) {
        // not a coronary: the radial loop's straightening, carried with the coronary motion (loopControlInput)
        this.setLoopStraighten(c.radii[0] ?? 0);
        continue;
      }
      if (c.name === SPASM_CONTROL) {
        // not a coronary: the radial artery's spasm (spasmControlInput)
        this.setRadialSpasm(c.radii[0] ?? 0, c.radii[1] ?? 1);
        continue;
      }
      if (c.name === VALVE_CONTROL) {
        // not a coronary: the aortic valve's opening (valveControlInput)
        this.setValve({ open: c.radii[0] ?? 0, areaCm2: c.radii[1] || null, difficult: (c.radii[2] ?? 0) > 0.5 });
        continue;
      }
      const t = this.tubes.find((x, i) => i >= this.nFixedTubes && x.vessel === c.name);
      if (!t || t.n !== c.pts.length + 1) continue;
      const d = norm(sub(c.pts[1], c.pts[0]));
      const pre = sub(c.pts[0], scale(d, 3));
      t.pts[0] = pre.x; t.pts[1] = pre.y; t.pts[2] = pre.z;
      for (let i = 0; i < c.pts.length; i++) {
        t.pts[3 * (i + 1)] = c.pts[i].x;
        t.pts[3 * (i + 1) + 1] = c.pts[i].y;
        t.pts[3 * (i + 1) + 2] = c.pts[i].z;
      }
      t.rad.set(coronaryRadii(c));
      updateBounds(t); // also recomputes t.cum
      t.offsetMm = c.offsetMm ?? t.offsetMm;
    }
  }

  /** Copy of the coronary lumens' moving state (for engine snapshots). */
  coronaryState(): { vessel: string; pts: Float64Array; rad: Float64Array; offsetMm: number }[] {
    const out = this.tubes.slice(this.nFixedTubes).map((t) => ({ vessel: t.vessel ?? t.name, pts: t.pts.slice(), rad: t.rad.slice(), offsetMm: t.offsetMm ?? 0 }));
    // the radial loop's straightening travels with the snapshot (restoreCoronaryState puts it back)
    if (this.loopStraighten > 0) out.push({ vessel: LOOP_CONTROL, pts: new Float64Array(0), rad: Float64Array.of(this.loopStraighten), offsetMm: 0 });
    if (this.radialSpasm.level > 0) out.push({ vessel: SPASM_CONTROL, pts: new Float64Array(0), rad: Float64Array.of(this.radialSpasm.level, this.radialSpasm.lumenScale), offsetMm: 0 });
    return out;
  }

  /** Restore coronary lumens saved by coronaryState() (tubes with the same names and sizes). */
  restoreCoronaryState(st: { vessel: string; pts: Float64Array; rad: Float64Array; offsetMm: number }[]): void {
    this.setLoopStraighten(st.find((c) => c.vessel === LOOP_CONTROL)?.rad[0] ?? 0);
    const sp = st.find((c) => c.vessel === SPASM_CONTROL);
    this.setRadialSpasm(sp?.rad[0] ?? 0, sp?.rad[1] ?? 1);
    for (const c of st) {
      if (c.vessel === LOOP_CONTROL || c.vessel === SPASM_CONTROL) continue;
      const t = this.tubes.find((x, i) => i >= this.nFixedTubes && (x.vessel ?? x.name) === c.vessel);
      if (!t || t.pts.length !== c.pts.length) continue;
      t.pts.set(c.pts);
      t.rad.set(c.rad);
      t.offsetMm = c.offsetMm;
      updateBounds(t);
    }
  }

  get access(): Tube {
    return this.tubes[0];
  }

  /** Point and unit tangent on the access route at arclength s (extrapolated beyond the ends). */
  routePoint(s: number, out: Float64Array): void {
    tubePoint(this.tubes[0], s, out);
  }

  /** Arclength of the access route at the root top (where the ascending aorta meets the root). */
  get routeLength(): number {
    const t = this.tubes[0];
    return t.cum[t.n - 1];
  }

  /** Arclength along the access route where the device enters the skin. */
  get skinS(): number {
    const t = this.tubes[0];
    for (let i = 0; i < t.n; i++) if (t.region[i] !== Region.External) return t.cum[i];
    return 0;
  }

  /**
   * Query the union of lumens for a segment centre (x, y, z) with radius r.
   * `hints` holds the last closest segment index per tube for this body (−1 unknown).
   */
  query(x: number, y: number, z: number, r: number, flags: RodLumenFlags, hints: Int32Array | null, ho: number, out: LumenHit): void {
    out.slack = -Infinity;
    out.lumen = -999;
    out.floor = false;
    const tmp = scratchHit;
    const rho2 = x * x + z * z;
    const Rr = this.root.R + 12;
    // analytic root (skipped well outside it)
    if (y < this.root.yTop + 10 && rho2 < Rr * Rr) {
      this.queryRoot(x, y, z, r, flags, tmp);
      if (tmp.slack > out.slack) copyHit(tmp, out);
    }
    // orifice and LV
    if (y < this.root.hCoapt + 6 && rho2 < Rr * Rr) {
      this.queryOrifice(x, y, z, r, flags, tmp);
      if (tmp.slack > out.slack) copyHit(tmp, out);
    }
    if (y < 2 && y > -120) {
      this.queryLV(x, y, z, r, tmp);
      if (tmp.slack > out.slack) copyHit(tmp, out);
    }
    // tubes
    const tubes = this.tubes;
    for (let ti = 0; ti < tubes.length; ti++) {
      const t = tubes[ti];
      if (x < t.bbMin[0] || x > t.bbMax[0] || y < t.bbMin[1] || y > t.bbMax[1] || z < t.bbMin[2] || z > t.bbMax[2]) continue;
      const hint = hints ? hints[ho + ti] : -1;
      const seg = queryTube(t, x, y, z, r, hint, tmp);
      if (hints) hints[ho + ti] = seg;
      tmp.lumen = ti;
      if (tmp.slack > out.slack) copyHit(tmp, out);
      if (out.slack > 6) break; // comfortably inside: no need to look further
    }
    // the radial artery in spasm (diag-spasm-states): a narrower lumen, and a grip on a catheter
    if (this.radialSpasm.level > 0 && out.lumen === 0 && (out.region === Region.Radial || out.region === Region.RadialLoop)) this.spasmHit(r, out);
    // a fine device in the radial loop meets it with its own friction (RADIAL_LOOP.fineMaxR)
    if (out.region === Region.RadialLoop && r > 0 && r < RADIAL_LOOP.fineMaxR) out.region = Region.RadialLoopFine;
  }

  /** The access route's lumen radius at arclength s (mm), interpolated between its samples. */
  accessRadiusAt(s: number): number {
    const t = this.tubes[0];
    if (!t || t.n < 1) return 0;
    if (!(s > t.cum[0])) return t.rad[0];
    if (s >= t.cum[t.n - 1]) return t.rad[t.n - 1];
    let lo = 0, hi = t.n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (t.cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const span = t.cum[hi] - t.cum[lo];
    const f = span > 1e-9 ? (s - t.cum[lo]) / span : 0;
    return t.rad[lo] + (t.rad[hi] - t.rad[lo]) * f;
  }

  /** A hit in the radial artery while it is in spasm: the lumen narrowed (not below the device), and the grip region for a catheter. */
  private spasmHit(r: number, out: LumenHit): void {
    const R = this.accessRadiusAt(out.s);
    const narrowed = Math.max(R * this.radialSpasm.lumenScale, r + RADIAL_SPASM_LUMEN.clearanceMm);
    if (narrowed < R) out.slack -= R - narrowed;
    if (this.radialSpasm.level >= RADIAL_SPASM_LUMEN.gripAt && r >= RADIAL_LOOP.fineMaxR) out.region = Region.RadialSpasm;
  }

  /** Radius of the root lumen at azimuth phi and height y (mm), with derivatives. */
  rootRadius(phi: number, y: number): { R: number; dPhi: number; dY: number } {
    const g = this.root;
    let lobe = 0, dl = 0;
    for (let k = 0; k < 3; k++) {
      let d = phi - g.cusps[k];
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const w = 1.1; // model parameter: lobe half-width (rad) ~63°
      if (Math.abs(d) < w) {
        const c = Math.cos((Math.PI / 2) * (d / w));
        const val = c * c;
        if (val > lobe) {
          lobe = val;
          dl = -2 * c * Math.sin((Math.PI / 2) * (d / w)) * (Math.PI / 2) / w;
        }
      }
    }
    const yy = Math.max(0, Math.min(g.yTop, y));
    const sv = Math.sin((Math.PI * yy) / g.yTop);
    const dsv = y > 0 && y < g.yTop ? (Math.PI / g.yTop) * Math.cos((Math.PI * yy) / g.yTop) : 0;
    // model parameters: annulus/STJ at 0.88 R, sinus bulge to R at the cusp centres
    const L = 0.35 + 0.65 * lobe;
    const R = g.R * (0.88 + 0.12 * sv * L);
    return { R, dPhi: g.R * 0.12 * sv * 0.65 * dl, dY: g.R * 0.12 * dsv * L };
  }

  /** Closed-valve floor height at radius fraction q = ρ/R_annulus and azimuth phi. */
  floorHeight(q: number, phi: number): { y: number; dq: number } {
    const g = this.root;
    let lobe = 0;
    for (let k = 0; k < 3; k++) {
      let d = phi - g.cusps[k];
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const c = Math.cos(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, (Math.PI / 2) * (d / 1.05))));
      lobe = Math.max(lobe, c * c);
    }
    const qq = Math.max(0, Math.min(1, q));
    const y = g.hCoapt * (1 - qq) + g.hComm * (1 - lobe) * qq * qq;
    const dq = -g.hCoapt + 2 * g.hComm * (1 - lobe) * qq;
    return { y, dq };
  }

  private queryRoot(x: number, y: number, z: number, r: number, flags: RodLumenFlags, out: LumenHit): void {
    const g = this.root;
    const rho = Math.hypot(x, z);
    const phi = Math.atan2(z, x);
    const rr = this.rootRadius(phi, y);
    const ex = rho > 1e-6 ? x / rho : 1, ez = rho > 1e-6 ? z / rho : 0;
    // side wall
    const side = rr.R - r - rho;
    // gradient of f = rho − R(phi, y): outward normal
    let nx = ex + (rr.dPhi / Math.max(rho, 1)) * ez;
    let nz = ez - (rr.dPhi / Math.max(rho, 1)) * ex;
    let ny = -rr.dY;
    let l = Math.hypot(nx, ny, nz) || 1;
    out.slack = side;
    out.nx = nx / l; out.ny = ny / l; out.nz = nz / l;
    out.region = Region.Root;
    out.lumen = LUMEN_ROOT;
    out.s = 0;
    out.floor = false;
    // top: the root lumen ends at the sinotubular junction (the ascending tube continues)
    const top = g.yTop + 4 - y;
    if (top < out.slack) {
      out.slack = top;
      out.nx = 0; out.ny = 1; out.nz = 0;
    }
    // floor (closed valve)
    const Ra = g.R * 0.88;
    const q = rho / Ra;
    // through the orifice: round a rod that has crossed, or through the valve's systolic opening (diag-lv-aorta-task)
    const inOrifice = (flags.crossedValve && rho < this.crossedOrificeRadius()) || this.inValveOpening(x, z, r);
    if (!inOrifice) {
      const f = this.floorHeight(q, phi);
      // surface y = f(q): normal of (f(q) − y) outward (pointing down out of the lumen)
      let fnx = (f.dq / Ra) * ex, fny = -1, fnz = (f.dq / Ra) * ez;
      l = Math.hypot(fnx, fny, fnz);
      fnx /= l; fny /= l; fnz /= l;
      const fl = (y - f.y) * (-fny) - r; // vertical gap projected onto the normal
      if (fl < out.slack) {
        out.slack = fl;
        out.nx = fnx; out.ny = fny; out.nz = fnz;
        out.floor = true;
      }
    }
  }

  private queryOrifice(x: number, y: number, z: number, r: number, flags: RodLumenFlags, out: LumenHit): void {
    const g = this.root;
    // the valve's systolic opening (diag-lv-aorta-task) for a rod that has not crossed: the orifice runs up
    // through the floor at the opening's centre and radius
    const v = this.valve;
    const opening = !flags.crossedValve && !!v && v.open > 0;
    const ox = opening ? v!.cx : 0, oz = opening ? v!.cz : 0;
    const rho = Math.hypot(x - ox, z - oz);
    const yTop = flags.crossedValve || opening ? g.hCoapt + 3 : -1.5;
    const yBot = -10;
    const rOr = opening ? v!.open * v!.fullR : flags.crossedValve ? this.crossedOrificeRadius() : g.rOrifice;
    const side = rOr - r - rho;
    const top = yTop - y;
    const bot = y - yBot;
    out.region = Region.Orifice;
    out.lumen = LUMEN_ORIFICE;
    out.s = 0;
    out.floor = false;
    const ex = rho > 1e-6 ? (x - ox) / rho : 1, ez = rho > 1e-6 ? (z - oz) / rho : 0;
    out.slack = side;
    out.nx = ex; out.ny = 0; out.nz = ez;
    if (top < out.slack) {
      out.slack = top;
      out.nx = 0; out.ny = 1; out.nz = 0;
    }
    if (bot < out.slack) {
      out.slack = bot;
      out.nx = 0; out.ny = -1; out.nz = 0;
    }
  }

  private queryLV(x: number, y: number, z: number, r: number, out: LumenHit): void {
    const L = this.lv;
    const dx = x - L.c.x, dy = y - L.c.y, dz = z - L.c.z;
    const p1 = (dx * L.u1.x + dy * L.u1.y + dz * L.u1.z) / L.a;
    const p2 = (dx * L.u2.x + dy * L.u2.y + dz * L.u2.z) / L.b;
    const p3 = (dx * L.u3.x + dy * L.u3.y + dz * L.u3.z) / L.b;
    const q = Math.hypot(p1, p2, p3);
    out.slack = (1 - q) * L.b - r;
    // gradient of q
    const g1 = p1 / L.a, g2 = p2 / L.b, g3 = p3 / L.b;
    let nx = g1 * L.u1.x + g2 * L.u2.x + g3 * L.u3.x;
    let ny = g1 * L.u1.y + g2 * L.u2.y + g3 * L.u3.y;
    let nz = g1 * L.u1.z + g2 * L.u2.z + g3 * L.u3.z;
    const l = Math.hypot(nx, ny, nz) || 1;
    out.nx = nx / l; out.ny = ny / l; out.nz = nz / l;
    out.region = Region.LV;
    out.lumen = LUMEN_LV;
    out.s = 0;
    out.floor = false;
    // the cavity ends below the valve plane (the orifice connects it to the root)
    const top = -2 - y;
    if (top < out.slack) {
      out.slack = top;
      out.nx = 0; out.ny = 1; out.nz = 0;
    }
  }
}

const scratchHit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };

function copyHit(a: LumenHit, b: LumenHit): void {
  b.slack = a.slack;
  b.nx = a.nx;
  b.ny = a.ny;
  b.nz = a.nz;
  b.region = a.region;
  b.lumen = a.lumen;
  b.s = a.s;
  b.floor = a.floor;
}

// scratch state of the closest-segment search (module level: no closure or allocation per query)
let qBest = -1;
let qBestD2 = Infinity;
let qBestT = 0;

function testSeg(t: Tube, i: number, x: number, y: number, z: number): void {
  const o = 3 * i;
  const ax = t.pts[o], ay = t.pts[o + 1], az = t.pts[o + 2];
  const bx = t.pts[o + 3] - ax, by = t.pts[o + 4] - ay, bz = t.pts[o + 5] - az;
  const ll = bx * bx + by * by + bz * bz;
  let u = ll > 1e-12 ? ((x - ax) * bx + (y - ay) * by + (z - az) * bz) / ll : 0;
  if (u < 0) u = 0;
  else if (u > 1) u = 1;
  const px = ax + bx * u - x, py = ay + by * u - y, pz = az + bz * u - z;
  const d2 = px * px + py * py + pz * pz;
  if (d2 < qBestD2) {
    qBestD2 = d2;
    qBest = i;
    qBestT = u;
  }
}

/** Closest point on a tube; returns the segment index used (for hints). */
export function queryTube(t: Tube, x: number, y: number, z: number, r: number, hint: number, out: LumenHit): number {
  const nseg = t.n - 1;
  qBest = -1;
  qBestD2 = Infinity;
  qBestT = 0;
  if (hint >= 0 && hint < nseg) {
    const W = 4;
    let lo = Math.max(0, hint - W), hi = Math.min(nseg - 1, hint + W);
    for (let i = lo; i <= hi; i++) testSeg(t, i, x, y, z);
    // walk if the best is at the window edge
    while (qBest === lo && lo > 0) {
      lo--;
      testSeg(t, lo, x, y, z);
      if (qBest !== lo) break;
    }
    while (qBest === hi && hi < nseg - 1) {
      hi++;
      testSeg(t, hi, x, y, z);
      if (qBest !== hi) break;
    }
    // sanity: if far from the tube, do a full search
    const rr = t.rad[qBest] + (t.rad[qBest + 1] - t.rad[qBest]) * qBestT;
    if (qBestD2 > (rr + 25) * (rr + 25)) {
      for (let i = 0; i < nseg; i++) testSeg(t, i, x, y, z);
    }
  } else {
    for (let i = 0; i < nseg; i++) testSeg(t, i, x, y, z);
  }
  const best = qBest, bestD2 = qBestD2, bestT = qBestT;
  const o = 3 * best;
  const cx = t.pts[o] + (t.pts[o + 3] - t.pts[o]) * bestT;
  const cy = t.pts[o + 1] + (t.pts[o + 4] - t.pts[o + 1]) * bestT;
  const cz = t.pts[o + 2] + (t.pts[o + 5] - t.pts[o + 2]) * bestT;
  const rad = t.rad[best] + (t.rad[best + 1] - t.rad[best]) * bestT;
  const d = Math.sqrt(bestD2);
  out.slack = rad - r - d;
  let nx = x - cx, ny = y - cy, nz = z - cz;
  if (d > 1e-9) {
    nx /= d; ny /= d; nz /= d;
  } else {
    // on the centre line: any perpendicular
    const tx = t.pts[o + 3] - t.pts[o], ty = t.pts[o + 4] - t.pts[o + 1], tz = t.pts[o + 5] - t.pts[o + 2];
    const p = Math.abs(tx) < 0.9 * Math.hypot(tx, ty, tz) ? [1, 0, 0] : [0, 1, 0];
    nx = ty * p[2] - tz * p[1]; ny = tz * p[0] - tx * p[2]; nz = tx * p[1] - ty * p[0];
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
  }
  out.nx = nx; out.ny = ny; out.nz = nz;
  // open ends: beyond the first or last cross-section the tube does not contain the point
  if ((best === 0 && bestT <= 0) || (best === nseg - 1 && bestT >= 1)) {
    const end = best === 0 ? 0 : 1;
    let ax = t.pts[o + 3] - t.pts[o], ay = t.pts[o + 4] - t.pts[o + 1], az = t.pts[o + 5] - t.pts[o + 2];
    const al = Math.hypot(ax, ay, az) || 1;
    ax /= al; ay /= al; az /= al;
    if (end === 0) {
      ax = -ax; ay = -ay; az = -az;
    }
    const beyond = (x - cx) * ax + (y - cy) * ay + (z - cz) * az;
    if (beyond > 0) {
      const radial = Math.sqrt(Math.max(0, bestD2 - beyond * beyond));
      out.slack = Math.min(rad - r - radial, -beyond);
      if (-beyond <= rad - r - radial) {
        out.nx = ax; out.ny = ay; out.nz = az;
      }
    }
  }
  out.region = bestT < 0.5 ? t.region[best] : t.region[best + 1];
  out.s = t.cum[best] + (t.cum[best + 1] - t.cum[best]) * bestT;
  out.floor = false;
  return best;
}

/** Point and tangent on a tube at arclength s (linear extrapolation beyond the ends). */
export function tubePoint(t: Tube, s: number, out: Float64Array): void {
  const n = t.n;
  let i = 0;
  if (s <= 0) i = 0;
  else if (s >= t.cum[n - 1]) i = n - 2;
  else {
    // binary search
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (t.cum[m] <= s) lo = m;
      else hi = m;
    }
    i = lo;
  }
  const o = 3 * i;
  const dx = t.pts[o + 3] - t.pts[o], dy = t.pts[o + 4] - t.pts[o + 1], dz = t.pts[o + 5] - t.pts[o + 2];
  const l = Math.hypot(dx, dy, dz) || 1;
  const u = (s - t.cum[i]) / l;
  out[0] = t.pts[o] + dx * u;
  out[1] = t.pts[o + 1] + dy * u;
  out[2] = t.pts[o + 2] + dz * u;
  out[3] = dx / l;
  out[4] = dy / l;
  out[5] = dz / l;
}

/** Proximal coronary lumens from the anatomy model's ostia and vessel polylines (fallback when no render tree is supplied). */
export function defaultCoronaries(model: AnatomyModel): CoronaryInput[] {
  // radii: model parameters consistent with coronaryTree.ts (LM 4–4.5 mm, proximal LAD ~3.5 mm, RCA 3.5–4 mm)
  const R: Record<string, number> = { LM: 2.2, LAD: 1.75, LCx: 1.6, RCA: 1.9, CONUS: 0.75, RAMUS: 1.2 };
  const out: CoronaryInput[] = [];
  const lmV = model.vessels.find((x) => x.id === "LM");
  const lmLen = lmV ? Math.hypot(lmV.points[1].x - lmV.points[0].x, lmV.points[1].y - lmV.points[0].y, lmV.points[1].z - lmV.points[0].z) : 0;
  for (const ves of model.vessels) {
    if (!(ves.id in R)) continue;
    // vessels that start at the left main bifurcation sit lmLen beyond the ostium
    const offsetMm = ves.id === "LAD" || ves.id === "LCx" || ves.id === "RAMUS" ? (model.leftOstium2 ? 0 : lmLen) : 0;
    const pts = smooth(ves.points, 1.5);
    // keep the proximal 70 mm: the part a catheter tip or a short wire can reach
    const keep: Vec3[] = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length && acc < 70; i++) {
      acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
      keep.push(pts[i]);
    }
    const r0 = R[ves.id];
    out.push({
      name: ves.id,
      side: ves.id === "RCA" || ves.id === "CONUS" ? "right" : "left",
      pts: keep,
      radii: keep.map((_, i) => r0 * (1 - 0.15 * (i / Math.max(1, keep.length - 1)))),
      offsetMm,
    });
  }
  // the LAD and LCx start at the LM bifurcation; with separate ostia they start at the root
  return out;
}

/** Ostium descriptors for the classifier. */
export interface OstiumInfo {
  name: "lm" | "rca" | "conus" | "left2";
  vessel: string;
  pos: Vec3;
  dir: Vec3;
}

export function ostiaOf(model: AnatomyModel): OstiumInfo[] {
  const o: OstiumInfo[] = [];
  const add1 = (name: OstiumInfo["name"], vessel: string, os: Ostium) => o.push({ name, vessel, pos: os.pos, dir: os.dir });
  add1("lm", model.leftOstium2 ? "LAD" : "LM", model.lm);
  add1("rca", "RCA", model.rca);
  add1("conus", "CONUS", model.conus);
  if (model.leftOstium2) add1("left2", "LCx", model.leftOstium2);
  return o;
}

// ---------------------------------------------------------------------------
// small vector helpers
// ---------------------------------------------------------------------------

function add(a: Vec3, b: Vec3): Vec3 {
  return v(a.x + b.x, a.y + b.y, a.z + b.z);
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return v(a.x - b.x, a.y - b.y, a.z - b.z);
}
function scale(a: Vec3, k: number): Vec3 {
  return v(a.x * k, a.y * k, a.z * k);
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}
function norm(a: Vec3): Vec3 {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v(a.x / l, a.y / l, a.z / l);
}
function catmull(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}
function smooth(points: Vec3[], step: number): Vec3[] {
  if (points.length < 2) return points.slice();
  const out: Vec3[] = [];
  const get = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const a = get(i - 1), b = get(i), c = get(i + 1), d = get(i + 2);
    const L = Math.hypot(c.x - b.x, c.y - b.y, c.z - b.z);
    const m = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < m; k++) {
      const t = k / m;
      out.push(v(catmull(a.x, b.x, c.x, d.x, t), catmull(a.y, b.y, c.y, d.y, t), catmull(a.z, b.z, c.z, d.z, t)));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
