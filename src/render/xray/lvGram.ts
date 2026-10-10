// ---------------------------------------------------------------------------
// Ventriculogram and aortogram imaging (diag-lv-aorta-render).
//
// Replaces the uniformly filling ventriculogram ellipsoid of the scene builder with:
// - an LV cavity: the LV of heartShape (the fitted ventricle, so it moves with the drawn heart) shrunk
//   to the endocardium and drawn as a stack of elliptical cross-sections (one ribbon tube along the long
//   axis). Each cross-section has four walls, profiled by the standard views as the module text says
//   (hb-cardiac-catheterisation, "Ventriculography": RAO 30 shows the anterior, apical and inferior
//   walls; LAO 60 cranial 20 the septal and posterolateral walls). Each wall moves inwards in systole by
//   its segment's excursion (heartMotion.WALL_MOTION_SCALE: normal, hypokinetic, akinetic, dyskinetic)
//   on the patient clock's contraction envelope. Segment state comes from the case (LvGramSpec.segments)
//   or from the engine's regional ischaemia and necrosis (segmentsFromEngine, PatientEngine.lvWallState).
// - opacification from the injection trace through a beat-by-beat compartment model (LV, LA, aorta,
//   RV): contrast mixes into the LV over beats, is ejected into the aorta, regurgitates into the LA by
//   the MR grade, returns from the aorta into the LV by the AR grade, and shunts into the RV through a
//   VSD. The grades follow Oxford's density definitions as the module text gives them: MR by LA density
//   relative to the LV (I minimal, clearing each beat; II moderate, clearing over the following beats;
//   III as dense as the LV; IV denser than the LV, often persisting), AR by LV density relative to the
//   aorta (I clears each beat; II less dense than the aorta; III equal; IV denser and persisting). The
//   regurgitant fractions and chamber dilatation that produce those densities are MODEL PARAMETERS.
// - a myocardial stain with an optional pericardial crescent, an apical filling defect (thrombus),
//   takotsubo apical ballooning, a VSD jet into the RV, the anomalous circumflex "dot" sign, and for an
//   aortogram the root, ascending aorta, arch and its branches with graft stumps and a domed AS valve
//   with its jet; and an iliofemoral run (iliofemoralExtras, for SceneInput.extras).
//
// Every number below that is not a module-text definition is a MODEL PARAMETER. No real ventriculogram
// or aortogram targets exist in the realism scorecard: the look must be checked against licensed
// reference images or by expert review.
//
// Open for that review (in-app verification): with 30 mL at 12 mL/s the mixed cavity darkened the image about
// as much as a proximal left coronary in the same view (99th centile 31 grey levels; the coronary's 99.5th 32), where real
// ventriculograms usually show the cavity denser than the coronaries. Left as a MODEL PARAMETER. If the
// reviewer judges it under-dense, raise the iodine scaling of the cavity tube (a factor on `full` in
// lvGramFrame), not the mixing volumes, so that the compartment model and its MR and AR density tests are
// unchanged.
// ---------------------------------------------------------------------------

import type { CArm, Vec3 } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import { toWorld } from "../../simulation/anatomy";
import { cameraBasis } from "../../simulation/projection";
import type { ClockState } from "../../simulation/clock/cardiacClock";
import { traceAt, type InjectionTrace } from "../../simulation/injection";
import type { LvWallState } from "../../simulation/patient/engine";
import { V3, radialDir, surfacePoint, surfaceNormal, type Ellipsoid, type HeartFrame, type Motion } from "./heart";
import { LV_ENDOCARDIUM, endocardialRadius, longEnvelope, wallMotionScale, wallMotionClassOf, type WallMotionClass } from "./heartMotion";
import { applyAffine, applyLinear, heartChambers, ventricleAffine } from "./heartShape";
import { MU, type BonePrim, type TubeSpec } from "./thorax";
import type { SceneInput } from "./sceneBuilder";

const { v, add, sub, sc, dot, cross, nrm } = V3;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const D2R = Math.PI / 180;

// ---- segments ------------------------------------------------------------------------------------

/** Ventriculogram wall segments (module text: RAO profiles anterior, apical, inferior; LAO cranial septal, posterolateral). */
export type LvSegment = "anterior" | "apical" | "inferior" | "septal" | "posterolateral";
export const LV_SEGMENTS: readonly LvSegment[] = ["anterior", "apical", "inferior", "septal", "posterolateral"];
export type LvWall = Exclude<LvSegment, "apical">;

/**
 * Angle round the long axis (heart.ts phi: 0 anterior, +90 the obtuse margin, -90 the acute margin) of
 * each wall's direction in the cavity's cross-section. MODEL PARAMETER: the frame is turned 45 degrees from
 * the heart's anterior axis so that the anterior wall lies between the anterior interventricular groove and
 * the obtuse margin; with the nominal heart axis RAO 30 then profiles the anterior and inferior walls and
 * LAO 60 cranial 20 the septal and posterolateral walls (lvGram.test.ts checks both).
 */
export const WALL_PHI: Record<LvWall, number> = { anterior: 45, posterolateral: 135, inferior: -135, septal: -45 };

/**
 * Narrowing of the cavity at the base plane, as a share of the mid-cavity radius (MODEL PARAMETER): the
 * opacified cavity meets the mitral annulus, narrower than the ventricle, so its base is rounded rather than
 * a cut across the widest part; it blends out over the basal 30% of the length.
 */
export const BASE_NARROWING = 0.38;

/** Share of the cavity length (from the base) beyond which the walls belong to the apical segment (blend width 0.2). MODEL PARAMETER. */
export const APICAL_FROM = 0.62;

export type RegurgGrade = 0 | 1 | 2 | 3 | 4;

/** What the case (or the engine, through segmentsFromEngine) says about the left heart and aorta. */
export interface LvGramSpec {
  /** wall motion per segment (class or excursion scale); default normal */
  segments?: Partial<Record<LvSegment, WallMotionClass | number>>;
  /** LVEF (%) setting the global excursion (60 gives a scale of 1); default 60 */
  ef?: number;
  /** mitral and aortic regurgitation grade (Oxford I-IV); default none */
  mr?: RegurgGrade;
  /**
   * The MR grading scheme (module text: "Say which scheme you used"). Oxford's grades are by LA density
   * alone; the Academy's grading after Sellers adds timing, and only its grade 4 shows contrast refluxing
   * into the pulmonary veins. Default "oxford".
   */
  mrScheme?: "oxford" | "sellers";
  ar?: RegurgGrade;
  /** catheter-induced regurgitation (pigtail on the mitral apparatus, or on the aortic leaflets): one grade more */
  catheterMr?: boolean;
  catheterAr?: boolean;
  /** the beat now under way is an ectopic one: its regurgitation is doubled (MODEL PARAMETER) */
  ectopic?: boolean;
  /** takotsubo: apical ballooning with a hyperkinetic base, whatever the segments say */
  takotsubo?: boolean;
  /** apical filling defect (thrombus), length in mm (default 16) */
  thrombus?: boolean | { lengthMm?: number };
  /**
   * contrast injected into the wall: a stain in that segment, with contrast tracking into the pericardium.
   * During the run the stain builds from the run's own trace. After the run (no bolus), the scene draws it
   * only when `sinceS` (seconds since the staining push) is given, at strength x exp(-sinceS / stainTauS).
   */
  stain?: { segment: LvSegment; pericardial?: boolean; strength?: number; sinceS?: number } | null;
  /** ventricular septal defect: systolic jet into the RV (shunt: share of LV ejection, default 0.25) */
  vsd?: { site?: "muscular" | "perimembranous"; shunt?: number } | null;
  /** circumflex from the right sinus behind the aorta: the "dot" sign */
  anomalousCx?: boolean;
  /** aortic stenosis: domed valve and a systolic jet on the aortogram */
  aorticStenosis?: boolean;
  /** bypass graft stumps on the ascending aorta (0-3) */
  graftStumps?: number;
}

// ---- model parameters ------------------------------------------------------------------------------

/**
 * Cavity geometry and mixing (MODEL PARAMETERS, diag-lv-aorta-render):
 * - radiusShare: endocardial radius as a share of the epicardial LV radius (the heart frame's LV
 *   ellipsoid includes the septum the RV wraps), giving the nominal heart an end-diastolic cavity of
 *   about 52 x 54 mm across.
 * - apexWallMm: apical wall between the epicardial and endocardial apex.
 * - slices: cross-sections along the long axis (denser towards the apex, which they round).
 * - lvotRadiusMm: outflow tract from the base to the aortic valve.
 * - mixTauS: time constant with which injected contrast mixes through the cavity (until then it is
 *   denser in the mid-cavity, where a pigtail sits).
 * - laWallMm, laaShare: left atrial wall; appendage cavity as a share of the appendage outline.
 */
export const LV_CAVITY = { radiusShare: 0.6, apexWallMm: 8, slices: 28, lvotRadiusMm: 10, mixTauS: 0.3, laWallMm: 2, laaShare: 0.7 };

/**
 * The injection puff (MODEL PARAMETERS): contrast pushed into the LV and not yet mixed through the cavity (the
 * compartment model's pool, which mixes with LV_CAVITY.mixTauS) is drawn as a dense cloud at the injection
 * site, the catheter tip when the frame is given one (else the mid-cavity, where a pigtail sits). The cloud
 * holds the pool's iodine at `conc` of full strength (the jet entrains blood), elongated along the long axis
 * by `elong` (same volume), no smaller than `minMl` (so it fades as it mixes rather than shrinking to a dot)
 * and at most `maxCavityShare` of the cavity's volume, kept inside the cavity between `minU` and `maxU` of its
 * length; below `drawMl` of unmixed contrast it is not drawn. It is drawn as nested ellipsoids (`shells`: size
 * scale and share of the iodine), so that its edge fades rather than ending in a hard outline. A hand injection
 * into the LV through a coronary catheter thus shows as a puff at the tip that washes out over the following
 * beats, as the safety case needs the learner to see.
 */
export const LV_PUFF = {
  conc: 0.5,
  elong: 1.6,
  minMl: 2,
  maxCavityShare: 0.3,
  minU: 0.12,
  maxU: 0.8,
  midU: 0.45,
  drawMl: 0.01,
  shells: [
    [1, 0.5],
    [1.4, 0.3],
    [1.9, 0.2],
  ] as readonly (readonly [number, number])[],
};

/**
 * Regurgitation by grade (MODEL PARAMETERS): regurgitant share of the LV stroke (rf), and chamber
 * enlargement (LA for MR, LV for both; radius scale). Chosen so that the compartment model gives the
 * module text's densities in RAO 30 (MR) and LAO (AR): lvGram.test.ts checks grade I clearing each beat
 * and grade III reaching the reference chamber's density.
 */
export const MR_GRADES: Record<1 | 2 | 3 | 4, { rf: number; laScale: number; lvScale: number }> = {
  1: { rf: 0.06, laScale: 1, lvScale: 1 },
  2: { rf: 0.25, laScale: 1, lvScale: 1.04 },
  3: { rf: 0.42, laScale: 1.05, lvScale: 1.1 },
  4: { rf: 0.55, laScale: 1.08, lvScale: 1.16 },
};
export const AR_GRADES: Record<1 | 2 | 3 | 4, { rf: number; lvScale: number }> = {
  1: { rf: 0.08, lvScale: 1 },
  2: { rf: 0.25, lvScale: 1.05 },
  3: { rf: 0.45, lvScale: 1.12 },
  4: { rf: 0.6, lvScale: 1.2 },
};

/**
 * Circulation of the compartment model (MODEL PARAMETERS): mixing volumes of the ascending aorta and
 * arch and of the RV (mL), the share of diastolic LV filling that passes from the pulmonary veins without
 * mixing with the atrium's contents (conduit flow), the ectopic beat's regurgitation multiplier, the stain's build-up per mL of
 * contrast pushed into the wall and its clearance time constant (s), and the takotsubo excursion of the
 * base and of the ballooning apex.
 */
export const LV_CIRCULATION = { aortaMl: 110, rvMl: 120, laConduit: 0.3, ectopicRegurg: 2, stainPerMl: 0.08, stainTauS: 240, takoBase: 1.25, takoApex: -0.3 };

/** Integration step of the compartment model (s): a fixed grid from the start of the push. */
const DT = 0.01;
/** Samples of the cavity's volume curve over the contraction envelope (0 … 1). */
const VOL_SAMPLES = 64;

// ---- geometry --------------------------------------------------------------------------------------

/** Ellipsoid radius of the LV's (A, S) cross-section in the direction phi (deg). */
function ellRadius(e: Ellipsoid, phiDeg: number): number {
  const c = Math.cos(phiDeg * D2R) / e.half[1],
    s = Math.sin(phiDeg * D2R) / e.half[2];
  return 1 / Math.sqrt(c * c + s * s);
}

/** Excursion scale of each wall at a cavity position u (0 base … 1 apex) for a spec. */
export function wallScales(spec: LvGramSpec, u: number): Record<LvWall, number> {
  if (spec.takotsubo) {
    const k = LV_CIRCULATION.takoBase + (LV_CIRCULATION.takoApex - LV_CIRCULATION.takoBase) * smooth(0.3, 0.6, u);
    return { anterior: k, posterolateral: k, inferior: k, septal: k };
  }
  const seg = (s: LvSegment) => wallMotionScale(spec.segments?.[s] ?? "normal");
  const wA = smooth(APICAL_FROM - 0.1, APICAL_FROM + 0.1, u);
  const kA = seg("apical");
  const out = {} as Record<LvWall, number>;
  for (const w of ["anterior", "posterolateral", "inferior", "septal"] as LvWall[]) out[w] = seg(w) * (1 - wA) + kA * wA;
  return out;
}

/** Apical excursion scale of a spec. */
function apexScale(spec: LvGramSpec): number {
  return spec.takotsubo ? LV_CIRCULATION.takoApex : wallMotionScale(spec.segments?.apical ?? "normal");
}

/** Global excursion from the LVEF (1 at 60%). MODEL PARAMETER (the cavity's own EF at scale 1 is about 60%). */
export function globalScale(spec: LvGramSpec): number {
  return clamp((spec.ef ?? 60) / 60, 0.15, 1.3);
}

function mrGrade(spec: LvGramSpec): number {
  return clamp((spec.mr ?? 0) + (spec.catheterMr ? 1 : 0), 0, 4);
}
function arGrade(spec: LvGramSpec): number {
  return clamp((spec.ar ?? 0) + (spec.catheterAr ? 1 : 0), 0, 4);
}

/** The cavity's rest profile: what does not change within a run. */
export interface CavityProfile {
  /** cross-section positions (0 base … 1 apex) and rest radii along the anterior (e1) and lateral (e2) directions */
  u: number[];
  r1: number[];
  r2: number[];
  k: Record<LvWall, number>[];
  /** rest cavity length (mm) and the axial excursions at end-systole (mm, positive inwards) */
  lengthMm: number;
  longShortenMm: number;
  apexInMm: number;
  g: number;
  /** cavity volume (mL) at envelopes k / VOL_SAMPLES, k = 0 … VOL_SAMPLES (profileVolume interpolates it) */
  vol: Float64Array;
}

/** The spec fields cavityProfile reads, as a key. */
function profileKey(spec: LvGramSpec): string {
  return JSON.stringify([spec.segments ?? null, spec.ef ?? null, mrGrade(spec), arGrade(spec), !!spec.takotsubo]);
}
const profiles = new WeakMap<HeartFrame, Map<string, CavityProfile>>();

/** The cavity's rest profile for a heart and spec (memoised per heart frame; treat it as read-only). */
export function cavityProfile(H: HeartFrame, spec: LvGramSpec = {}): CavityProfile {
  let byKey = profiles.get(H);
  if (!byKey) profiles.set(H, (byKey = new Map()));
  const key = profileKey(spec);
  const hit = byKey.get(key);
  if (hit) return hit;
  const p = buildProfile(H, spec);
  if (byKey.size >= 32) byKey.clear();
  byKey.set(key, p);
  return p;
}

function buildProfile(H: HeartFrame, spec: LvGramSpec): CavityProfile {
  if (!H.lv) throw new Error("lvGram needs a heart frame with ventricular ellipsoids (makeHeart)");
  const lv = H.lv;
  const lc = dot(sub(lv.c, H.base), H.L);
  const apexL = lc + lv.half[0] - LV_CAVITY.apexWallMm;
  const half = apexL - lc;
  const mr = mrGrade(spec),
    ar = arGrade(spec);
  const lvScale = Math.max(mr ? MR_GRADES[mr as 1].lvScale : 1, ar ? AR_GRADES[ar as 1].lvScale : 1);
  const R1 = ellRadius(lv, WALL_PHI.anterior) * LV_CAVITY.radiusShare * lvScale;
  const R2 = ellRadius(lv, WALL_PHI.posterolateral) * LV_CAVITY.radiusShare * lvScale;
  const n = LV_CAVITY.slices;
  const u: number[] = [],
    r1: number[] = [],
    r2: number[] = [],
    k: Record<LvWall, number>[] = [];
  for (let i = 0; i < n; i++) {
    const ui = Math.sin((0.5 * Math.PI * i) / (n - 1)); // denser towards the apex
    const l = ui * apexL;
    // the cavity narrows towards the mitral annulus at the base (MODEL PARAMETER: BASE_NARROWING)
    const f = Math.sqrt(Math.max(0, 1 - ((l - lc) / half) ** 2)) * (1 - BASE_NARROWING * (1 - smooth(0, 0.3, ui)));
    u.push(ui);
    r1.push(R1 * f);
    r2.push(R2 * f);
    k.push(wallScales(spec, ui));
  }
  const g = globalScale(spec);
  const walls = k[Math.floor(n * 0.3)];
  const kLong = clamp((walls.anterior + walls.inferior + walls.septal + walls.posterolateral) / 4, -0.2, 1.3);
  const p: CavityProfile = { u, r1, r2, k, lengthMm: apexL, longShortenMm: LV_ENDOCARDIUM.longShortenMm * g * kLong, apexInMm: LV_ENDOCARDIUM.apexExcursionMm * g * apexScale(spec), g, vol: new Float64Array(VOL_SAMPLES + 1) };
  for (let i = 0; i <= VOL_SAMPLES; i++) p.vol[i] = cavityVolumeMl(p, i / VOL_SAMPLES);
  return p;
}

/** Cavity volume (mL) at a contraction envelope, interpolated from the profile's volume curve (no allocation). */
export function profileVolume(p: CavityProfile, env: number): number {
  const x = clamp(env, 0, 1) * VOL_SAMPLES;
  const i = Math.min(VOL_SAMPLES - 1, Math.floor(x));
  const f = x - i;
  return p.vol[i] * (1 - f) + p.vol[i + 1] * f;
}

/** The four wall radii of cross-section i at a contraction envelope. */
export function sliceRadii(p: CavityProfile, i: number, env: number): Record<LvWall, number> {
  const k = p.k[i];
  return {
    anterior: endocardialRadius(p.r1[i], k.anterior, env, p.g),
    inferior: endocardialRadius(p.r1[i], k.inferior, env, p.g),
    posterolateral: endocardialRadius(p.r2[i], k.posterolateral, env, p.g),
    septal: endocardialRadius(p.r2[i], k.septal, env, p.g),
  };
}

/** Cavity length (mm) at a contraction envelope. */
export function cavityLength(p: CavityProfile, env: number): number {
  const e = clamp(env, 0, 1);
  return Math.max(10, p.lengthMm - (p.longShortenMm + p.apexInMm) * e);
}

/** Cavity volume (mL) at a contraction envelope: the cross-sections' areas integrated along the axis. */
export function cavityVolumeMl(p: CavityProfile, env: number): number {
  const len = cavityLength(p, env);
  let vol = 0;
  let prev = 0;
  for (let i = 0; i < p.u.length; i++) {
    const r = sliceRadii(p, i, env);
    const area = (Math.PI * (r.anterior + r.inferior) * (r.posterolateral + r.septal)) / 4;
    if (i > 0) vol += 0.5 * (area + prev) * (p.u[i] - p.u[i - 1]) * len;
    prev = area;
  }
  return vol / 1000;
}

/** One drawn cross-section of the cavity (aortic frame). */
export interface CavitySlice {
  u: number;
  /** centre of the cross-section (the walls' midpoint) */
  c: Vec3;
  /** point on the long axis the walls are measured from */
  axisPt: Vec3;
  radii: Record<LvWall, number>;
}

export interface LvCavity {
  slices: CavitySlice[];
  base: Vec3;
  apex: Vec3;
  /** long axis (base to apex) and the anterior (e1) and posterolateral (e2) wall directions */
  L: Vec3;
  e1: Vec3;
  e2: Vec3;
  env: number;
  lengthMm: number;
  profile: CavityProfile;
}

/**
 * The LV cavity at a motion state, in the aortic frame: the rest endocardium carried by the LV's
 * least-squares affine motion (heartShape.ventricleAffine: the same fit as the drawn wall), each wall
 * moved by its segment's excursion.
 */
export function lvCavity(H: HeartFrame, m: Motion | undefined, spec: LvGramSpec = {}, profile?: CavityProfile): LvCavity {
  const p = profile ?? cavityProfile(H, spec);
  const env = m ? m.env?.radial ?? m.contraction : 0;
  const T = ventricleAffine(H, m, "lv");
  const e1r = radialDir(H, WALL_PHI.anterior);
  const apex0 = add(H.base, sc(H.L, p.lengthMm));
  const L = nrm(applyLinear(T, H.L));
  let e1 = applyLinear(T, e1r);
  e1 = nrm(sub(e1, sc(L, dot(e1, L))));
  const e2 = cross(e1, L);
  const apexBulk = applyAffine(T, apex0);
  const e = clamp(env, 0, 1);
  const apex = sub(apexBulk, sc(L, p.apexInMm * e));
  const len = cavityLength(p, env);
  const base = sub(apex, sc(L, len));
  const slices: CavitySlice[] = p.u.map((u, i) => {
    const radii = sliceRadii(p, i, env);
    const axisPt = add(base, sc(L, u * len));
    const off = add(sc(e1, (radii.anterior - radii.inferior) / 2), sc(e2, (radii.posterolateral - radii.septal) / 2));
    return { u, c: add(axisPt, off), axisPt, radii };
  });
  return { slices, base, apex, L, e1, e2, env, lengthMm: len, profile: p };
}

/** The cavity as one ribbon tube (elliptical cross-sections), iodine per cross-section from `iodine(u)`. */
export function cavityTube(cav: LvCavity, toWorld: (p: Vec3) => Vec3, iodine: (u: number) => number, dirToWorld: (d: Vec3) => Vec3 = (d) => d): TubeSpec {
  const e1 = dirToWorld(cav.e1),
    e2 = dirToWorld(cav.e2);
  const pts: Vec3[] = [],
    r: number[] = [],
    thinDir: Vec3[] = [],
    thinR: number[] = [],
    mu: [number, number, number][] = [];
  for (const s of cav.slices) {
    const a = Math.max(0.3, (s.radii.anterior + s.radii.inferior) / 2);
    const b = Math.max(0.3, (s.radii.posterolateral + s.radii.septal) / 2);
    pts.push(toWorld(s.c));
    r.push(Math.max(a, b));
    thinDir.push(a <= b ? e1 : e2);
    thinR.push(Math.min(a, b));
    mu.push([0, iodine(s.u), 0]);
  }
  return { pts, r, mu, thin: { dir: thinDir, r: thinR } };
}

/**
 * A cross-section at any position u along the cavity, interpolated between the model's cross-sections. The
 * profile's cross-sections are evenly spaced in theta = asin(u) (buildProfile), where the radii vary smoothly
 * up to the apex, so the radii are interpolated there by a Catmull-Rom spline (clamped at zero) rather than
 * linearly: the drawn outline has no corners at the cross-sections. The axis point is exact (the axis is
 * straight) and the centre follows from the radii as in lvCavity.
 */
export function sliceAt(cav: LvCavity, u: number): CavitySlice {
  const sl = cav.slices;
  const n = sl.length;
  const uu = clamp(u, 0, 1);
  const x = clamp((Math.asin(uu) / (0.5 * Math.PI)) * (n - 1), 0, n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const f = x - i;
  const radii = {} as Record<LvWall, number>;
  for (const w of ["anterior", "inferior", "posterolateral", "septal"] as LvWall[]) {
    const p1 = sl[i].radii[w],
      p2 = sl[i + 1].radii[w];
    const p0 = i > 0 ? sl[i - 1].radii[w] : 2 * p1 - p2;
    const p3 = i + 2 < n ? sl[i + 2].radii[w] : 2 * p2 - p1;
    const r = 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
    radii[w] = Math.max(0, r);
  }
  const axisPt = add(cav.base, sc(cav.L, uu * cav.lengthMm));
  const off = add(sc(cav.e1, (radii.anterior - radii.inferior) / 2), sc(cav.e2, (radii.posterolateral - radii.septal) / 2));
  return { u: uu, c: add(axisPt, off), axisPt, radii };
}

/**
 * How the cavity is sampled for drawing (MODEL PARAMETERS): the longest spacing of its cross-sections along
 * the axis (mm; denser towards the apex, evenly in theta like the profile), and the sine of the angle between
 * the long axis and the ray below which the cavity is treated as end-on and drawn with the sparse spacing.
 */
export const CAVITY_DRAW = { sampleMm: 1.25, endOnSin: 0.5, minSamples: 24, maxSamples: 160 };

/**
 * The cavity as the renderer draws it: one ribbon tube of elliptical cross-sections every CAVITY_DRAW.sampleMm
 * at most, so its silhouette is a smooth curve and the junction of a still segment with a moving one is
 * rounded, not a corner between a few straight edges.
 *
 * The ribbon path (XrayRenderer.buildTubes, tuned for vessels) drops samples closer together than half a tube's
 * projected width, which on a 50 mm wide cavity would leave six to eight samples and a polygonal outline. Its
 * documented rule for shells is that the first tube drawn on a points array decides the samples for every tube
 * sharing that array; so a zero-iodine guide tube of negligible radius shares the cavity's points and is listed
 * first, and every sample is kept. (A renderer opt-out on TubeSpec would replace the guide; it is outside this
 * package.) The drop rule exists for tubes that run end-on, where dense samples fold the ribbon into spikes:
 * when `viewW` (the world viewing direction) shows the long axis within asin(CAVITY_DRAW.endOnSin) of the ray,
 * the cavity is drawn as before, with cross-sections spaced by 0.6 of the local radius and no guide.
 */
export function cavityTubes(cav: LvCavity, toWorld: (p: Vec3) => Vec3, iodine: (u: number) => number, dirToWorld?: (d: Vec3) => Vec3, viewW?: Vec3): TubeSpec[] {
  const Lw = nrm(dirToWorld ? dirToWorld(cav.L) : cav.L);
  const cr = viewW ? cross(Lw, nrm(viewW)) : null;
  const endOn = !!cr && Math.hypot(cr.x, cr.y, cr.z) < CAVITY_DRAW.endOnSin;
  if (!endOn) {
    const nSeg = Math.round(clamp(Math.ceil((0.5 * Math.PI * cav.lengthMm) / CAVITY_DRAW.sampleMm), CAVITY_DRAW.minSamples, CAVITY_DRAW.maxSamples));
    const us = Array.from({ length: nSeg + 1 }, (_, j) => (j === nSeg ? 1 : Math.sin((0.5 * Math.PI * j) / nSeg)));
    const tube = cavityTube({ ...cav, slices: us.map((x) => sliceAt(cav, x)) }, toWorld, iodine, dirToWorld);
    const guide: TubeSpec = { pts: tube.pts, r: tube.pts.map(() => CAVITY_GUIDE_R), mu: [0, 0, 0] };
    return [guide, tube];
  }
  const us: number[] = [];
  let u = 0;
  while (u < 1) {
    us.push(u);
    const s = sliceAt(cav, u);
    const r = Math.max((s.radii.anterior + s.radii.inferior) / 2, (s.radii.posterolateral + s.radii.septal) / 2);
    u += Math.max(0.015, (0.6 * r) / Math.max(1, cav.lengthMm));
  }
  us.push(1);
  return [cavityTube({ ...cav, slices: us.map((x) => sliceAt(cav, x)) }, toWorld, iodine, dirToWorld)];
}

/** Radius (mm) of the cavity's zero-iodine sampling guide (cavityTubes): small enough that the ribbon path keeps every sample. */
export const CAVITY_GUIDE_R = 0.05;

/** The cavity's drawn tube among a frame's tubes (the guide, when present, carries no iodine and no thin axis). */
export function isCavityGuide(t: TubeSpec): boolean {
  return !t.thin && t.r.length > 0 && t.r.every((r) => r === CAVITY_GUIDE_R) && !Array.isArray(t.mu[0]) && (t.mu as number[]).every((x) => x === 0);
}

// ---- projection (tests and the reader) --------------------------------------------------------------

/** Unit viewing direction (source towards detector) for a C-arm angulation. */
export function viewDirection(cArm: CArm): Vec3 {
  const b = cameraBasis(cArm);
  return sc(b.forward, -1);
}

/** Which wall a projected silhouette edge belongs to: the wall direction closest to the edge's outward direction. */
function wallOf(cav: LvCavity, out3: Vec3): LvWall {
  const c: [LvWall, number][] = [
    ["anterior", dot(out3, cav.e1)],
    ["inferior", -dot(out3, cav.e1)],
    ["posterolateral", dot(out3, cav.e2)],
    ["septal", -dot(out3, cav.e2)],
  ];
  c.sort((x, y) => y[1] - x[1]);
  return c[0][0];
}

/** The two silhouette edges of each cross-section in a view: outward distance from the long axis (mm) and the wall it belongs to. */
export function silhouetteEdges(cav: LvCavity, cArm: CArm): { u: number; edges: { wall: LvWall; d: number }[] }[] {
  const d = viewDirection(cArm);
  // image-plane normal to the projected long axis
  const Lp = nrm(sub(cav.L, sc(d, dot(cav.L, d))));
  const n3 = nrm(cross(d, Lp));
  return cav.slices.map((s) => {
    const a = (s.radii.anterior + s.radii.inferior) / 2;
    const b = (s.radii.posterolateral + s.radii.septal) / 2;
    const h = Math.hypot(a * dot(cav.e1, n3), b * dot(cav.e2, n3));
    const off = dot(sub(s.c, s.axisPt), n3);
    return {
      u: s.u,
      edges: [
        { wall: wallOf(cav, n3), d: off + h },
        { wall: wallOf(cav, sc(n3, -1)), d: h - off },
      ],
    };
  });
}

/**
 * Projected area change of each segment between two cavities (end-diastole minus end-systole, mm2) in a
 * view, by the chord method: at the same fractional positions along each frame's own long axis, the
 * area between the long axis and the silhouette edge, summed over the segment's chords (the walls'
 * transverse motion, as wall-motion analysis of ventriculograms reads it). Cross-sections beyond
 * APICAL_FROM count for the apical segment. Positive for inward motion, negative for outward.
 */
export function segmentAreaChange(ed: LvCavity, es: LvCavity, cArm: CArm): Partial<Record<LvSegment, number>> {
  const d = viewDirection(cArm);
  const projLen = (c: LvCavity) => c.lengthMm * Math.hypot(...(["x", "y", "z"] as const).map((k) => c.L[k] - d[k] * dot(c.L, d)));
  const a = silhouetteEdges(ed, cArm),
    b = silhouetteEdges(es, cArm);
  const lenEd = projLen(ed);
  const out: Partial<Record<LvSegment, number>> = {};
  for (let i = 1; i < a.length; i++) {
    const du = (a[i].u - a[i - 1].u) * lenEd;
    for (let j = 0; j < 2; j++) {
      const seg: LvSegment = a[i].u > APICAL_FROM ? "apical" : a[i].edges[j].wall;
      const dA = 0.5 * (a[i].edges[j].d + a[i - 1].edges[j].d - b[i].edges[j].d - b[i - 1].edges[j].d) * du;
      out[seg] = (out[seg] ?? 0) + dA;
    }
  }
  return out;
}

/** Mean projected chord (mm) of the cavity in a view: its volume over its projected area. */
export function cavityMeanChord(cav: LvCavity, cArm: CArm): number {
  const d = viewDirection(cArm);
  const Lp = sub(cav.L, sc(d, dot(cav.L, d)));
  const n3 = nrm(cross(d, nrm(Lp)));
  const lenProj = cav.lengthMm * Math.hypot(Lp.x, Lp.y, Lp.z);
  let area = 0,
    vol = 0;
  for (let i = 1; i < cav.slices.length; i++) {
    const w = (s: CavitySlice) => 2 * Math.hypot(((s.radii.anterior + s.radii.inferior) / 2) * dot(cav.e1, n3), ((s.radii.posterolateral + s.radii.septal) / 2) * dot(cav.e2, n3));
    const ar = (s: CavitySlice) => (Math.PI * (s.radii.anterior + s.radii.inferior) * (s.radii.posterolateral + s.radii.septal)) / 4;
    const du = cav.slices[i].u - cav.slices[i - 1].u;
    area += 0.5 * (w(cav.slices[i]) + w(cav.slices[i - 1])) * du * lenProj;
    vol += 0.5 * (ar(cav.slices[i]) + ar(cav.slices[i - 1])) * du * cav.lengthMm;
  }
  return area > 0 ? vol / area : 0;
}

/** Mean projected chord (mm) of an ellipsoid along a viewing direction: volume over projected area. */
export function ellipsoidMeanChord(e: Ellipsoid, d: Vec3): number {
  // projected area = pi a b c sqrt(d' Q d), Q = sum a_i a_i' / h_i^2
  let q = 0;
  for (let i = 0; i < 3; i++) q += (dot(d, e.ax[i]) / e.half[i]) ** 2;
  return (4 / 3) / Math.sqrt(q);
}

// ---- left atrium, RV cavity --------------------------------------------------------------------------

/** The opacifiable LA cavity at a motion state: the drawn atrium less its wall, enlarged by the MR grade about its centre. */
export function laCavity(H: HeartFrame, m: Motion | undefined, spec: LvGramSpec = {}): { la: Ellipsoid; laa: Ellipsoid } {
  const ch = heartChambers(H, m);
  const g = mrGrade(spec);
  const k = g ? MR_GRADES[g as 1].laScale : 1;
  const w = LV_CAVITY.laWallMm;
  const la: Ellipsoid = { c: ch.la.c, ax: ch.la.ax, half: ch.la.half.map((h) => Math.max(2, (h - w) * k)) as [number, number, number] };
  const laa: Ellipsoid = { c: ch.laa.c, ax: ch.laa.ax, half: ch.laa.half.map((h) => h * LV_CAVITY.laaShare) as [number, number, number] };
  return { la, laa };
}

const ellVolumeMl = (e: Ellipsoid) => ((4 / 3) * Math.PI * e.half[0] * e.half[1] * e.half[2]) / 1000;

/**
 * The RV cavity (for a VSD shunt): the RV beyond the septum. MODEL PARAMETERS: centre 30 mm further to the
 * right of the RV ellipsoid's centre and 2 mm posterior, half sizes 0.45 of the heart length, 30 and 12 mm,
 * so that about 10 mm of septum separates it from the LV cavity; free wall moves in by 25% at end-systole.
 */
export function rvCavity(H: HeartFrame, m: Motion | undefined): Ellipsoid {
  if (!H.rv) throw new Error("lvGram needs a heart frame with ventricular ellipsoids (makeHeart)");
  const k = H.scale ?? 1;
  const T = ventricleAffine(H, m, "rv");
  const c0 = add(H.rv.c, add(sc(H.S, -30 * k), sc(H.A, -2 * k)));
  const env = m ? m.env?.longRv ?? m.contraction : 0;
  const L = nrm(applyLinear(T, H.L));
  let A = applyLinear(T, H.A);
  A = nrm(sub(A, sc(L, dot(A, L))));
  return { c: applyAffine(T, c0), ax: [L, A, cross(L, A)], half: [0.45 * H.len, 30 * k * (1 - 0.25 * clamp(env, 0, 1)), 12 * k] };
}

// ---- compartment model ---------------------------------------------------------------------------------

/** Contrast concentrations now (fraction of full-strength contrast), and the flows of this instant. */
export interface LvGramContrast {
  lv: number;
  /** contrast injected but not yet mixed through the cavity (drawn as the injection puff), as a concentration */
  pool: number;
  /** the same unmixed contrast as full-strength mL */
  poolMl: number;
  la: number;
  aorta: number;
  rv: number;
  /** wall stain strength (0..1) */
  stain: number;
  /** LV ejecting now, and the VSD shunt flow now (mL/s) */
  ejecting: boolean;
  vsdFlow: number;
  /** end-diastolic and end-systolic volumes of the cavity (mL) */
  edv: number;
  esv: number;
}

export interface LvGramFlowInput {
  profile: CavityProfile;
  spec: LvGramSpec;
  trace: InjectionTrace;
  /** where the contrast goes: the LV (ventriculogram) or the aortic root (aortogram) */
  site: "lv" | "root";
  /** seconds since the press (BolusView.t) */
  t: number;
  clock: Pick<ClockState, "tInBeat" | "rr" | "endSystole">;
  /** LA mixing volume (mL); default the nominal LA cavity's */
  laMl: number;
}

/** The compartment model's state at a grid time (pushStart + k DT). */
interface FlowState {
  k: number;
  vPrev: number;
  nLv: number;
  nPool: number;
  nLa: number;
  nAo: number;
  nRv: number;
  /** contrast (full-strength mL) pushed into the LV so far: what a stain is built from */
  wallMl: number;
  ejecting: boolean;
  vsdFlow: number;
}

/**
 * Saved states per trace and per flow key, so that each frame advances the model from the previous frame's
 * grid time rather than from the start of the push (the integration is otherwise the same as a fresh one).
 */
const flowStates = new WeakMap<InjectionTrace, Map<string, FlowState>>();

// traceAt without the object return, for the integration loop (same interpolation and end rules)
let trQ = 0,
  trC = 1;
function sampleTrace(tr: InjectionTrace, t: number): void {
  const x = t / tr.dt;
  const i = Math.floor(x);
  const n = tr.q.length - 1;
  if (i < 0) {
    trQ = 0;
    trC = tr.c[0] ?? 1;
  } else if (i >= n) {
    trQ = n >= 0 && tr.pushEnd === null ? tr.q[n] : 0;
    trC = n >= 0 ? tr.c[n] : 1;
  } else {
    const f = x - i;
    trQ = tr.q[i] * (1 - f) + tr.q[i + 1] * f;
    trC = tr.c[i] * (1 - f) + tr.c[i + 1] * f;
  }
}

/**
 * Integrates the compartment model from the start of the push to now on a fixed grid (DT). The beats before
 * now are taken at the current RR (the clock's history is not kept); the current beat may be ectopic
 * (spec.ectopic). Flows come from the cavity's own volume curve: systolic outflow is split between the
 * aorta, the LA (MR) and the RV (VSD); diastolic inflow between the LA and the aorta (AR). Each compartment
 * is well mixed. The state is kept per trace and per flow-relevant spec, so successive frames only advance
 * it; it restarts when time goes back. Grid steps beyond the trace's recorded samples (a push still under
 * way) are recomputed each frame and not kept.
 */
export function lvGramContrast(o: LvGramFlowInput): LvGramContrast {
  const { profile: p, spec, trace, clock } = o;
  const mr = mrGrade(spec),
    ar = arGrade(spec);
  const rfM0 = mr ? MR_GRADES[mr as 1].rf : 0;
  const rfA = ar ? AR_GRADES[ar as 1].rf : 0;
  const shunt = spec.vsd ? clamp(spec.vsd.shunt ?? 0.25, 0, 0.6) : 0;
  const rr = Math.max(0.25, clock.rr);
  const es = clock.endSystole;
  const edv = p.vol[0];
  const esv = p.vol[VOL_SAMPLES];
  const sv = Math.max(1, edv - esv);
  if (o.t <= trace.pushStart) return { lv: 0, pool: 0, poolMl: 0, la: 0, aorta: 0, rv: 0, stain: 0, ejecting: false, vsdFlow: 0, edv, esv };
  // mean flows (mL/s): forward runoff from the aorta, pulmonary flow out of the RV
  const fwdNet = Math.max(1, sv * (1 - rfM0 - shunt) * (1 - rfA));
  const qRun = fwdNet / rr;
  const qPulm = (fwdNet + sv * shunt) / rr;
  const vAo = LV_CIRCULATION.aortaMl,
    vRv = LV_CIRCULATION.rvMl,
    vLa = Math.max(10, o.laMl);
  const t0 = trace.pushStart;
  const volAt = (tau: number) => {
    const back = o.t - tau;
    const tb = (((clock.tInBeat - back) % rr) + rr) % rr;
    return profileVolume(p, longEnvelope(tb, rr, es));
  };
  const step = (st: FlowState, tau: number, dt: number) => {
    const vNow = volAt(tau);
    const dV = vNow - st.vPrev;
    st.vPrev = vNow;
    const cLv = st.nLv / Math.max(1, vNow);
    const current = o.t - tau < clock.tInBeat;
    const rfM = Math.min(0.8, rfM0 * (current && spec.ectopic ? LV_CIRCULATION.ectopicRegurg : 1));
    st.ejecting = dV < 0;
    st.vsdFlow = 0;
    if (dV < 0) {
      const qOut = -dV / dt;
      const qMr = qOut * rfM,
        qVsd = qOut * shunt,
        qFwd = qOut - qMr - qVsd;
      st.vsdFlow = qVsd;
      st.nLv = Math.max(0, st.nLv - qOut * cLv * dt);
      st.nLa += qMr * cLv * dt;
      st.nAo += qFwd * cLv * dt;
      st.nRv += qVsd * cLv * dt;
    } else if (dV > 0) {
      const qIn = dV / dt;
      const fromLa = st.nLa * (1 - Math.exp((-qIn * (1 - rfA) * (1 - LV_CIRCULATION.laConduit) * dt) / vLa));
      const fromAo = st.nAo * (1 - Math.exp((-qIn * rfA * dt) / vAo));
      st.nLa -= fromLa;
      st.nAo -= fromAo;
      st.nLv += fromLa + fromAo;
    }
    // injection
    sampleTrace(trace, tau);
    const qc = trQ * trC;
    if (o.site === "lv") {
      st.nPool += qc * dt;
      st.wallMl += qc * dt;
    } else st.nAo += qc * dt;
    const mixed = st.nPool * (1 - Math.exp(-dt / LV_CAVITY.mixTauS));
    st.nPool -= mixed;
    st.nLv += mixed;
    // runoff of the aorta (and of the injectate's own volume at the root), pulmonary outflow of the RV
    st.nAo *= Math.exp((-(qRun + (o.site === "root" ? trQ : 0)) * dt) / vAo);
    st.nRv *= Math.exp((-qPulm * dt) / vRv);
  };
  const advance = (st: FlowState, kTo: number) => {
    for (let k = st.k + 1; k <= kTo; k++) step(st, t0 + k * DT, DT);
    if (kTo > st.k) st.k = kTo;
  };
  // the saved state for this trace and flow key
  const key = `${o.site}|${profileKey(spec)}|${rfM0}|${rfA}|${shunt}|${spec.ectopic ? 1 : 0}`;
  let byKey = flowStates.get(trace);
  if (!byKey) flowStates.set(trace, (byKey = new Map()));
  const kNow = Math.floor((o.t - t0) / DT + 1e-9);
  let st = byKey.get(key);
  if (!st || st.k > kNow) {
    st = { k: 0, vPrev: volAt(t0), nLv: 0, nPool: 0, nLa: 0, nAo: 0, nRv: 0, wallMl: 0, ejecting: false, vsdFlow: 0 };
    if (byKey.size >= 8) byKey.clear();
    byKey.set(key, st);
  }
  // keep the grid steps whose trace samples are recorded; recompute the rest (and the step to now) each frame
  const kSettled = trace.pushEnd !== null ? kNow : Math.floor((((trace.q.length - 1) * trace.dt - t0) / DT) + 1e-9);
  advance(st, Math.min(kNow, Math.max(st.k, kSettled)));
  const cur: FlowState = { ...st };
  advance(cur, kNow);
  const tLast = t0 + cur.k * DT;
  if (o.t - tLast > 1e-6) step(cur, o.t, o.t - tLast);
  const vNow = Math.max(1, cur.vPrev);
  const pushEnd = trace.pushEnd ?? o.t;
  // the stain is built by the whole run's push (not a window of it) and clears slowly after it
  const stain = spec.stain ? clamp((spec.stain.strength ?? 1) * cur.wallMl * LV_CIRCULATION.stainPerMl, 0, 1) * Math.exp(-Math.max(0, o.t - pushEnd) / LV_CIRCULATION.stainTauS) : 0;
  return {
    lv: clamp(cur.nLv / vNow, 0, 1),
    pool: clamp(cur.nPool / vNow, 0, 1),
    poolMl: Math.max(0, cur.nPool),
    la: clamp(cur.nLa / vLa, 0, 1),
    aorta: clamp(cur.nAo / vAo, 0, 1),
    rv: clamp(cur.nRv / vRv, 0, 1),
    stain,
    ejecting: cur.ejecting,
    vsdFlow: cur.vsdFlow,
    edv,
    esv,
  };
}

// ---- engine coupling --------------------------------------------------------------------------------------

/** Excursion scale from a region's ischaemia and necrosis (MODEL PARAMETERS: ischaemic myocardium stops contracting; transmural necrosis bulges). */
export function regionScale(ischaemia: number, necrosis: number): number {
  const loss = clamp(Math.max(ischaemia, necrosis), 0, 1);
  const k = 1 - 1.15 * loss;
  return necrosis > 0.85 ? Math.min(k, -0.3 * smooth(0.85, 1, necrosis)) : Math.max(0, k);
}

/**
 * Segment wall motion from the engine's regional ischaemia and necrosis (PatientEngine.lvWallState):
 * each LV region of the coronary flow map counts, by its resting demand, for the segment its direction
 * points to (the apical segment as it points towards the apex, otherwise the nearest wall direction), so
 * a wrapping LAD gives an apical defect and a left-dominant circumflex an inferior one. A segment with no
 * region keeps its spec value. The LVEF of the spec becomes the profile's (the regional loss already
 * reduces the ejection).
 */
export function segmentsFromEngine(H: HeartFrame, w: LvWallState, base: LvGramSpec = {}): LvGramSpec {
  const acc: Partial<Record<LvSegment, { k: number; wt: number }>> = {};
  for (const r of w.regions) {
    // Frank (x left, y inferior, z posterior) to the aortic frame (x left, y superior, z anterior)
    const d = v(r.dir[0], -r.dir[1], -r.dir[2]);
    const l = dot(d, H.L);
    const a = dot(d, H.A),
      s = dot(d, H.S);
    // a region whose direction from the heart centre (0.45 of the length from the base) points towards the apex
    // counts for the apical segment, the rest of it for the nearest wall direction (MODEL PARAMETERS: blend 0.6-0.9)
    const wApex = smooth(0.6, 0.9, l);
    const phi = Math.atan2(s, a) / D2R;
    let best: LvWall = "anterior",
      bd = Infinity;
    for (const wl of ["anterior", "posterolateral", "inferior", "septal"] as LvWall[]) {
      const dd = Math.abs(((((phi - WALL_PHI[wl]) % 360) + 540) % 360) - 180);
      if (dd < bd) {
        bd = dd;
        best = wl;
      }
    }
    const k = regionScale(r.ischaemia, r.necrosis);
    for (const [seg, wt] of [
      ["apical", wApex],
      [best, 1 - wApex],
    ] as [LvSegment, number][]) {
      if (wt <= 0) continue;
      const e = (acc[seg] ??= { k: 0, wt: 0 });
      e.k += r.demand * wt * k;
      e.wt += r.demand * wt;
    }
  }
  const segments: Partial<Record<LvSegment, WallMotionClass | number>> = { ...(base.segments ?? {}) };
  for (const sgm of LV_SEGMENTS) {
    const e = acc[sgm];
    // rounded to 0.01 so that a slowly evolving ischaemia does not change the cavity profile every frame
    if (e && e.wt > 0) segments[sgm] = Math.round((100 * e.k) / e.wt) / 100;
  }
  return { ...base, segments, ef: base.ef ?? w.baselineEf, ectopic: base.ectopic ?? w.ectopic };
}

/** The class of each segment of a spec (for the reader's answer key and the debrief). */
export function segmentClasses(spec: LvGramSpec): Record<LvSegment, WallMotionClass> {
  const out = {} as Record<LvSegment, WallMotionClass>;
  for (const s of LV_SEGMENTS) {
    if (spec.takotsubo) out[s] = s === "apical" ? "dyskinetic" : "normal";
    else out[s] = wallMotionClassOf(wallMotionScale(spec.segments?.[s] ?? "normal"));
  }
  return out;
}

// ---- drawing ------------------------------------------------------------------------------------------------

/** Aortic lumen centre line (aortic frame, mm) from the sinus top to the descending aorta, with radii. MODEL PARAMETERS following the thorax's aorta. */
export const AORTA_PATH: { p: Vec3; r: number }[] = [
  { p: v(0, 20, 0), r: 15 },
  { p: v(1, 40, -2), r: 15 },
  { p: v(2, 62, -6), r: 14.5 },
  { p: v(3, 84, -12), r: 14 },
  { p: v(7, 95, -24), r: 13 },
  { p: v(13, 99, -38), r: 12.5 },
  { p: v(19, 94, -52), r: 12 },
  { p: v(22, 82, -64), r: 11.5 },
  { p: v(22, 64, -70), r: 11.5 },
  { p: v(23, 20, -76), r: 11.5 },
  { p: v(24, -60, -80), r: 11 },
];
/** Arch branches (brachiocephalic, left common carotid, left subclavian). MODEL PARAMETERS. */
export const ARCH_BRANCHES: { pts: Vec3[]; r: number }[] = [
  { pts: [v(5, 96, -20), v(-6, 120, -16), v(-16, 150, -12), v(-22, 175, -10)], r: 6 },
  { pts: [v(11, 99, -32), v(14, 125, -30), v(17, 160, -28)], r: 3.8 },
  { pts: [v(17, 96, -46), v(26, 118, -47), v(42, 138, -45), v(65, 148, -40)], r: 5 },
];
/** Retro-aortic course of an anomalous circumflex (right sinus, behind the root, to the left AV groove). MODEL PARAMETERS: its middle part runs along the RAO 30 viewing direction, so it is seen end-on there. */
export const ANOMALOUS_CX: Vec3[] = [v(-12, 6, 2), v(-16, 8, -14), v(-6, 8, -27), v(4, 8, -40), v(20, 4, -42), v(36, -4, -34)];

export interface LvGramDrawInput {
  H: HeartFrame;
  m: Motion;
  spec: LvGramSpec;
  trace: InjectionTrace;
  site: "lv" | "root";
  /** seconds since the press */
  t: number;
  clock: Pick<ClockState, "tInBeat" | "rr" | "endSystole">;
  /** iodine attenuation per mm of full-strength contrast */
  full: number;
  sinusRadius: number;
  /** a heart point (aortic frame, moving with the ventricles) to world */
  toHeart: (p: Vec3) => Vec3;
  /** a point of the aortic root or aorta (aortic frame, at rest) to world, with the root's motion at its height */
  toAortic: (p: Vec3) => Vec3;
  /** the injecting catheter's tip (aortic frame): where an LV injection's puff starts; default the mid-cavity */
  tip?: Vec3 | null;
  /** the world viewing direction (source to detector), for the cavity's sampling (cavityTubes) */
  view?: Vec3;
}

export interface LvGramFrame {
  tubes: TubeSpec[];
  bones: BonePrim[];
  contrast: LvGramContrast;
  cavity: LvCavity;
}

/** An ellipsoid of the aortic frame as a bone: its centre through toW, its axes through dirW (the same rotation). */
const ellBone = (e: Ellipsoid, toW: (p: Vec3) => Vec3, dirW: (d: Vec3) => Vec3, muI: number): BonePrim => ({ type: 0, c: toW(e.c), ax: e.ax.map(dirW) as [Vec3, Vec3, Vec3], half: e.half, mu: 0, muI });

/**
 * The linear part of an aortic-frame-to-world map (toWorld's rotation by the aortic tilt; the breathing
 * shift cancels): directions (ellipsoid axes, a ribbon's thin axis) must turn with the positions.
 */
export function directionMap(toW: (p: Vec3) => Vec3): (d: Vec3) => Vec3 {
  const z = toW(v(0, 0, 0));
  return (d) => sub(toW(d), z);
}

/** What stainPrims needs: the heart and its motion, the stain's spec, iodine per mm, and the heart-to-world map. */
export interface StainInput {
  H: HeartFrame;
  m: Motion | undefined;
  spec: LvGramSpec;
  full: number;
  toHeart: (p: Vec3) => Vec3;
}

/**
 * The myocardial stain (a bone in the stained segment's wall) and its pericardial crescent, at a strength
 * (0..1). lvGramFrame draws it during a run; the scene builder draws it after the run, while it clears.
 */
export function stainPrims(o: StainInput, strength: number): { tubes: TubeSpec[]; bones: BonePrim[] } {
  const tubes: TubeSpec[] = [],
    bones: BonePrim[] = [];
  const st = o.spec.stain;
  if (!st || !(strength > 0)) return { tubes, bones };
  const { H, m, full } = o;
  const dirW = directionMap(o.toHeart);
  const seg = st.segment;
  const phi = seg === "apical" ? WALL_PHI.inferior : WALL_PHI[seg as LvWall];
  const u = seg === "apical" ? 0.86 : 0.5;
  const ell = 2 * u - 1;
  const p = surfacePoint(H, ell, phi, -5, m);
  const nr = surfaceNormal(H, ell, phi);
  const t1 = nrm(sub(H.L, sc(nr, dot(H.L, nr))));
  bones.push({ type: 0, c: o.toHeart(p), ax: [dirW(t1), dirW(nr), dirW(cross(t1, nr))], half: [11, 3.5, 9], mu: 0, muI: full * strength * 0.9 });
  if (st.pericardial) {
    const pts: Vec3[] = [],
      dirs: Vec3[] = [];
    for (let k = 0; k <= 10; k++) {
      const e = clamp(ell - 0.5 + k * 0.1, -0.95, 0.98);
      pts.push(o.toHeart(surfacePoint(H, e, phi + (k - 5) * 4, 3.5, m)));
      dirs.push(dirW(surfaceNormal(H, e, phi)));
    }
    tubes.push({ pts, r: pts.map((_, k) => 6 + 3 * Math.sin((Math.PI * k) / 10)), thin: { dir: dirs, r: pts.map(() => 1.3) }, mu: [0, full * strength * 0.45, 0] });
  }
  return { tubes, bones };
}

/** Stain strength after the run: the spec's strength clearing with stainTauS from `sinceS` (0 without it). */
export function stainAfterRun(spec: LvGramSpec | null | undefined): number {
  const st = spec?.stain;
  if (!st || typeof st.sinceS !== "number" || !(st.sinceS >= 0)) return 0;
  return clamp(st.strength ?? 1, 0, 1) * Math.exp(-st.sinceS / LV_CIRCULATION.stainTauS);
}

/** One shell of the injection puff: an ellipsoid of the aortic frame and its concentration (share of full strength). */
export interface PuffShell {
  c: Vec3;
  ax: [Vec3, Vec3, Vec3];
  half: [number, number, number];
  conc: number;
}

/**
 * The injection puff of an LV injection (LV_PUFF): nested ellipsoids along the cavity's long axis holding
 * `poolMl` of full-strength contrast between them, at the catheter tip (its position along the axis and across
 * it clamped inside the cavity) or, without a tip, on the axis at the mid-cavity.
 */
export function injectionPuff(cav: LvCavity, poolMl: number, tip?: Vec3 | null): PuffShell[] {
  if (!(poolMl > 0)) return [];
  const len = cav.lengthMm;
  let u = LV_PUFF.midU;
  let off = v(0, 0, 0);
  if (tip) {
    const rel = sub(tip, cav.base);
    u = clamp(dot(rel, cav.L) / Math.max(1, len), LV_PUFF.minU, LV_PUFF.maxU);
    off = sub(rel, sc(cav.L, dot(rel, cav.L)));
  }
  const s = sliceAt(cav, u);
  const rMin = Math.min(s.radii.anterior, s.radii.inferior, s.radii.posterolateral, s.radii.septal);
  const volMl = Math.min(Math.max(poolMl / LV_PUFF.conc, LV_PUFF.minMl), LV_PUFF.maxCavityShare * profileVolume(cav.profile, cav.env));
  const r = Math.cbrt((3 * volMl * 1000) / (4 * Math.PI));
  const a = Math.min(r * LV_PUFF.elong ** (2 / 3), 0.3 * len);
  const b = Math.max(0.5, Math.min(r / LV_PUFF.elong ** (1 / 3), 0.85 * rMin));
  // the core stays inside the cross-section: the tip's offset from the axis is shortened as needed
  const offLen = Math.hypot(off.x, off.y, off.z);
  const maxOff = Math.max(0, 0.9 * rMin - b);
  if (offLen > maxOff) off = offLen > 1e-9 ? sc(off, maxOff / offLen) : v(0, 0, 0);
  const c = add(s.axisPt, off);
  return LV_PUFF.shells.map(([k, share]) => {
    const ha = Math.min(a * k, 0.4 * len),
      hb = Math.max(0.5, Math.min(b * k, rMin));
    const vol = ((4 / 3) * Math.PI * ha * hb * hb) / 1000;
    return { c, ax: [cav.L, cav.e1, cav.e2] as [Vec3, Vec3, Vec3], half: [ha, hb, hb] as [number, number, number], conc: clamp((share * poolMl) / Math.max(1e-6, vol), 0, 1) };
  });
}

/** The primitives of a ventriculogram or aortogram frame. */
export function lvGramFrame(o: LvGramDrawInput): LvGramFrame {
  const { H, m, spec, full } = o;
  const tubes: TubeSpec[] = [],
    bones: BonePrim[] = [];
  const dirW = directionMap(o.toHeart);
  const profile = cavityProfile(H, spec);
  const cav = lvCavity(H, m, spec, profile);
  const { la, laa } = laCavity(H, m, spec);
  const c = lvGramContrast({ profile, spec, trace: o.trace, site: o.site, t: o.t, clock: o.clock, laMl: ellVolumeMl(la) });
  const min = 0.002;
  const lvC = c.lv + c.pool;
  // ---- LV cavity (its sampling guide and the cavity first in the tube list), the injection puff, the outflow tract
  // the unmixed share of an LV injection is the puff at the injection site (from the start of the push)
  if (o.site === "lv" && c.poolMl > LV_PUFF.drawMl)
    for (const sh of injectionPuff(cav, c.poolMl, o.tip)) bones.push({ type: 0, c: o.toHeart(sh.c), ax: sh.ax.map(dirW) as [Vec3, Vec3, Vec3], half: sh.half, mu: 0, muI: full * sh.conc });
  if (lvC > min) {
    // the mixed contrast fills the cavity
    tubes.push(...cavityTubes(cav, o.toHeart, () => full * c.lv, dirW, o.view));
    // the outflow tract, from beyond the cavity's basal surface to the valve, as an ellipsoid: it tapers at
    // both ends, so where it meets the cavity's base the iodine is not counted twice, and it has no flat end
    // caps (a short, wide ribbon tube seen partly end-on drew an angular block)
    const s0 = cav.slices[0];
    const from = o.toHeart(add(s0.axisPt, add(sc(cav.e1, 0.35 * s0.radii.anterior), sc(cav.L, -2))));
    const valve = o.toAortic(v(0, 0, 0));
    const span = sub(valve, from);
    const len = Math.hypot(span.x, span.y, span.z);
    if (len > 1) {
      const ax0 = sc(span, 1 / len);
      const ref = Math.abs(ax0.z) < 0.9 ? v(0, 0, 1) : v(1, 0, 0);
      const ax1 = nrm(cross(ax0, ref));
      const rr = LV_CAVITY.lvotRadiusMm;
      bones.push({ type: 0, c: add(from, sc(span, 0.5)), ax: [ax0, ax1, cross(ax0, ax1)], half: [len / 2 + 2, rr, rr], mu: 0, muI: full * c.lv });
    }
  }
  // ---- thrombus: an apical filling defect inside the cavity
  if (spec.thrombus && lvC > min) {
    const lenMm = typeof spec.thrombus === "object" ? spec.thrombus.lengthMm ?? 16 : 16;
    const halfL = Math.min(lenMm / 2, 0.12 * cav.lengthMm);
    const uc = 1 - (1.15 * halfL) / cav.lengthMm;
    const i = cav.slices.findIndex((s) => s.u >= uc + halfL / cav.lengthMm);
    const sN = cav.slices[Math.max(0, i)];
    const rN = Math.min(sN.radii.anterior, sN.radii.inferior, sN.radii.septal, sN.radii.posterolateral);
    const cc = add(cav.base, sc(cav.L, uc * cav.lengthMm));
    const rad = Math.max(1.5, 0.75 * rN);
    bones.push({ type: 0, c: o.toHeart(cc), ax: [dirW(cav.L), dirW(cav.e1), dirW(cav.e2)], half: [halfL, rad, rad], mu: 0, muI: -full * c.lv });
  }
  // ---- left atrium (MR), with pulmonary-vein reflux in the Sellers scheme's grade 4
  if (c.la > min) {
    bones.push(ellBone(la, o.toHeart, dirW, full * c.la));
    bones.push(ellBone(laa, o.toHeart, dirW, full * c.la * 0.85));
    if (spec.mrScheme === "sellers" && mrGrade(spec) >= 4) {
      // the Academy's grading after Sellers (module text): its grade 4 refluxes into the pulmonary veins.
      // Oxford's grade IV is defined by LA density alone, so it draws no reflux.
      for (const [sx, sy] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const p0 = add(la.c, add(sc(la.ax[2], sx * la.half[2] * 0.75), add(sc(la.ax[1], -la.half[1] * 0.5), sc(la.ax[0], sy * la.half[0] * 0.3 - la.half[0] * 0.3))));
        const dir = nrm(add(sc(la.ax[2], sx), add(sc(la.ax[1], -0.6), sc(la.ax[0], -0.4 + 0.3 * sy))));
        const pts = [p0, add(p0, sc(dir, 14)), add(p0, sc(dir, 26))].map(o.toHeart);
        tubes.push({ pts, r: [6, 5.5, 4.5], mu: [0, full * c.la * 0.7, 0] });
      }
    }
  }
  // ---- VSD: RV opacification and the systolic jet
  if (spec.vsd && (c.rv > min || c.vsdFlow > 0)) {
    const rv = rvCavity(H, m);
    if (c.rv > min) bones.push(ellBone(rv, o.toHeart, dirW, full * c.rv));
    if (c.vsdFlow > 0 && c.lv > min) {
      const u = spec.vsd.site === "perimembranous" ? 0.08 : 0.5;
      const i = cav.slices.findIndex((s) => s.u >= u);
      const s = cav.slices[Math.max(0, i)];
      const from = sub(s.axisPt, sc(cav.e2, s.radii.septal * 0.9));
      const to = add(from, sc(nrm(sub(rv.c, from)), 30));
      const k = clamp(c.vsdFlow / 150, 0.3, 1);
      tubes.push({ pts: [from, add(from, sc(sub(to, from), 0.5)), to].map(o.toHeart), r: [2.2, 4 * k + 1, 6 * k + 1], mu: [0, full * c.lv * 0.8, 0] });
    }
  }
  // ---- myocardial stain, with a pericardial crescent
  if (spec.stain && c.stain > min) {
    const sp = stainPrims({ H, m, spec, full, toHeart: o.toHeart }, c.stain);
    tubes.push(...sp.tubes);
    bones.push(...sp.bones);
  }
  // ---- aorta: root, ascending aorta, arch and branches (LV ejection, or the aortogram itself)
  if (c.aorta > min) {
    const cA = c.aorta;
    const R = o.sinusRadius;
    const root = v(0, R * 0.55, 0);
    const axes: [Vec3, Vec3, Vec3] = [dirW(v(1, 0, 0)), dirW(v(0, 1, 0)), dirW(v(0, 0, 1))];
    bones.push({ type: 0, c: o.toAortic(root), ax: axes, half: [R * 1.05, R * 0.85, R * 1.05], mu: 0, muI: full * cA });
    const n = AORTA_PATH.length;
    tubes.push({
      pts: AORTA_PATH.map((q) => o.toAortic(q.p)),
      r: AORTA_PATH.map((q) => q.r),
      // the descending aorta is reached later and is diluted further (MODEL PARAMETER)
      mu: AORTA_PATH.map((_, i) => [0, full * cA * (1 - 0.35 * smooth(4, n - 1, i)), 0] as [number, number, number]),
    });
    for (const br of ARCH_BRANCHES) tubes.push({ pts: br.pts.map(o.toAortic), r: br.pts.map((_, i) => br.r * (1 - 0.1 * i)), mu: [0, full * cA * 0.85, 0] });
    const stumps = clamp(Math.round(spec.graftStumps ?? 0), 0, 3);
    for (let i = 0; i < stumps; i++) {
      // stumps on the anterior ascending aorta with a radiopaque marker ring at each (MODEL PARAMETERS)
      const y = 42 + 11 * i,
        x = -5 + 6 * i;
      const p0 = v(x, y, 13.5),
        p1 = v(x - 1, y + 3, 22);
      tubes.push({ pts: [p0, p1].map(o.toAortic), r: [2.2, 1.6], mu: [0, full * cA * 0.8, 0] });
      const r0 = v(x, y, 14.2),
        r1 = v(x - 0.2, y + 0.5, 15.6);
      const ring = [r0, r1].map(o.toAortic);
      tubes.push({ pts: ring, r: [3.1, 3.1], mu: [0, 0, 0.6] });
      tubes.push({ pts: ring, r: [2.5, 2.5], mu: [0, 0, -0.6] });
    }
    if (spec.anomalousCx) tubes.push({ pts: ANOMALOUS_CX.map(o.toAortic), r: ANOMALOUS_CX.map(() => 1.7), mu: [0, full * cA * 0.9, 0] });
    if (spec.aorticStenosis && o.site === "root") {
      // domed leaflets (unopacified tissue against the contrast) and, in systole, the jet of unopacified LV blood
      const domeH = c.ejecting ? 9 : 4;
      bones.push({ type: 0, c: o.toAortic(v(0, 3, 0)), ax: axes, half: [R * 0.75, domeH, R * 0.75], mu: 0, muI: -full * cA * 0.6 });
      if (c.ejecting) {
        const jet = [v(0, 6, 0), v(0.5, 22, -1), v(1, 40, -2)].map(o.toAortic);
        tubes.push({ pts: jet, r: [3, 5, 7.5], mu: [0, -full * cA * 0.75, 0] });
      }
    }
  }
  return { tubes, bones, contrast: c, cavity: cav };
}

// ---- iliofemoral run (SceneInput.extras) ----------------------------------------------------------------------

/**
 * Iliofemoral geometry (aortic frame, mm; MODEL PARAMETERS, not a measured pelvis): the distal aorta from
 * the pigtail's level to the bifurcation, the common and external iliac arteries and the common femoral
 * arteries over the femoral heads, symmetric about the midline. A pelvis block of soft tissue extends the
 * body (thorax.ts ends at y -360) so the run has a patient around it.
 */
export const ILIOFEMORAL = {
  pigtail: v(22, -290, -84),
  bifurcation: v(8, -335, -80),
  side: [v(30, -390, -76), v(58, -450, -56), v(80, -505, -36), v(83, -565, -30)],
  radii: { aorta: 9, cia: 5, eia: 4, cfa: 4 },
  femoralHead: { c: v(95, -505, -62), r: 24 },
  pelvis: { c: v(0, -470, -50), half: [165, 112, 118] as [number, number, number] },
  /** infrarenal aortic flow (mL/s) and transit speed of the bolus front (mm/s) */
  flowMlS: 25,
  speedMmS: 250,
};

/**
 * SceneInput.extras for an iliofemoral run: a pigtail injection above the aortic bifurcation (`trace`) fills
 * the distal aorta, both iliac axes and the common femoral arteries, the front advancing with the flow.
 */
export function iliofemoralExtras(model: AnatomyModel, trace: InjectionTrace, full: number): NonNullable<SceneInput["extras"]> {
  const F = ILIOFEMORAL;
  const w = (p: Vec3) => toWorld(model, p);
  const conc = (tau: number) => {
    const tr = traceAt(trace, tau);
    return tr.q > 0 ? (tr.q * tr.c) / (tr.q + F.flowMlS) : 0;
  };
  // the patient's right axis (x < 0) mirrors the left one about the midline
  const sides = [F.side.map((p) => v(-p.x, p.y, p.z)), F.side];
  return (_place, ctx) => {
    const tubes: TubeSpec[] = [];
    const bones: BonePrim[] = [];
    const dirW = directionMap(w);
    bones.push({ type: 2, c: w(F.pelvis.c), ax: [dirW(v(1, 0, 0)), dirW(v(0, 1, 0)), dirW(v(0, 0, 1))], half: F.pelvis.half, mu: MU.soft });
    for (const sx of [-1, 1]) {
      const h = F.femoralHead;
      bones.push({ type: 0, c: w(v(sx * h.c.x, h.c.y, h.c.z)), ax: [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)], half: [h.r, h.r, h.r], mu: MU.cortical * 0.55 });
    }
    const t = ctx.bolusT;
    if (t === null) return { tubes, bones };
    const along = (pts: Vec3[], s0: number) => {
      let s = s0;
      return pts.map((p, i) => {
        if (i > 0) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y, p.z - pts[i - 1].z);
        return s;
      });
    };
    const aorta = [F.pigtail, v(16, -312, -82), F.bifurcation];
    const sA = along(aorta, 0);
    tubes.push({ pts: aorta.map(w), r: aorta.map(() => F.radii.aorta), mu: sA.map((s) => [0, full * conc(t - s / F.speedMmS), 0] as [number, number, number]) });
    for (const sd of sides) {
      const pts = [F.bifurcation, ...sd];
      const s = along(pts, sA[sA.length - 1]);
      const r = [F.radii.cia, F.radii.cia, F.radii.eia, F.radii.cfa, F.radii.cfa];
      tubes.push({ pts: pts.map(w), r, mu: s.map((x) => [0, full * conc(t - x / F.speedMmS), 0] as [number, number, number]) });
    }
    return { tubes, bones };
  };
}
