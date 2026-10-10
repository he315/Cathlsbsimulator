// ---------------------------------------------------------------------------
// Real-scale coronary tree for the X-ray renderer.
//
// The anatomy comes from a per-case genome (coronaryAtlas.ts: dominance and
// variants from the case, everything else from cited population priors),
// grown on the heart surface by coronaryGrowth.ts (named vessels in their
// grooves and territories, band-limited tortuosity, space-filling small
// branches, Huo-Kassab calibres, SYNTAX segment labels). The grown topology is
// cached per genome; this module applies the case's lesions (stenosis,
// occlusion, calcium, thrombus), deployed stents and collaterals on top, which
// is cheap enough to redo on every lumen change. Every point is stored in
// heart-surface coordinates so the motion field (heartMotion.ts) moves it each
// frame, and the proximal course is anchored to the anatomy model's ostia so
// catheter engagement and the image agree.
//
// Lesion morphology (diag-lesion-morphologies, on the Lesion fields of
// found-case-model-types; a lesion without them renders exactly as before):
// - eccentric lumens: an ellipse whose minor axis lies along the plaque
//   direction (orientationDeg about the vessel axis from the outward surface
//   normal), so the projected diameter, and the %DS a view shows, depend on
//   the camera; projectedStenosis() computes that %DS the way the renderer
//   draws the ellipse and is exported for QCA and the debrief only;
// - tapering references (taperMm), lesions placed at a side branch (branchAt,
//   sideBranch, medina), focal spasm that relaxes with the engine's
//   epicardial dilation, thrombus with a TIMI thrombus grade as an
//   intraluminal filling defect with haze or a convex meniscus at an
//   occlusion (without a grade it keeps the earlier stippled look), SCAD types 1,
//   2A, 2B and 3, and chronic total occlusions with a stump shape, an
//   occluded length and explicit collateral channels (CollateralChannel:
//   donor, recipient, septal or epicardial, Werner grade, Rentrop grade and
//   tortuosity). The channels and the recipient bed they fill are what
//   contrastTransport.ts times; the PCI CTO packages use the same model.
// ---------------------------------------------------------------------------

import type { AnatomyCase, CArm, CollateralChannel, Graft, GraftConduit, GraftProximalSite, GraftStatus, Lesion, RentropGrade, Vec3, VesselId, WernerGrade } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import { toWorld } from "../../simulation/anatomy";
import { cameraBasis } from "../../simulation/projection";
import { Rng } from "../../utils/random";
import { restPoint, V3, type HeartFrame, type Motion } from "./heart";
import { displace, rootDisplacement, bridgeCompression } from "./heartMotion";
import { genomeForCase, describeGenome, type AnatomyGenome } from "./coronaryAtlas";
import { growGrafts, growTopology, type GraftCourse, type GrownVessel, type Sample, type Territory, type Topology, type VesselKind } from "./coronaryGrowth";

export type { Sample } from "./coronaryGrowth";

/**
 * The lumen beyond its scalar radius, per sample, on a vessel that has lesions. `radii` stays the
 * equal-area radius (what flow and transport read); these arrays are what the renderer and the
 * view-dependent truth read.
 */
export interface LumenShape {
  /** healthy lumen radius (mm): the reference, with the taper and the luminal irregularity, without narrowing */
  ref: number[];
  /** eccentric lumen: minor and major semi-axes (mm); equal where the lumen is round */
  minor?: number[];
  major?: number[];
  /** angle of the minor axis about the vessel axis from the outward surface normal (radians) */
  orient?: number[];
  /** thrombus: radius of the intraluminal filling defect as a share of the lumen radius (0 none) */
  defect?: number[];
  /** thrombus: haze around the lumen (0..1) */
  haze?: number[];
  /** SCAD type 1: radius of the false lumen beside the true lumen (mm, 0 none) */
  falseR?: number[];
  /** spasm: the narrowing fraction of the spasm lesion (severity x profile) and the radius the other lesions leave */
  spasmF?: number[];
  other?: number[];
}

/** A collateral channel drawn in the tree: the case's CollateralChannel and the speed contrast moves along it. */
export interface TreeChannel extends CollateralChannel {
  /** contrast speed along the channel (mm/s) */
  speedMmS: number;
}

/** Retrograde filling of a recipient vessel beyond a chronic occlusion (timed by contrastTransport.ts). */
export interface RetroFill {
  /** the donor side whose injection fills it */
  side: "left" | "right";
  /** first sample that can fill */
  from: number;
  /** path coordinate (mm) of the first channel entry on this vessel, or of `from` when none enters it */
  entryMm: number;
  /** extra delay at each entry beyond the channel's own transit (s, flow time) */
  delayS: number;
  /** peak strength of the filling as a share of the donor's ostial strength (the best channel's Werner grade) */
  gain: number;
  /** channels entering this vessel: the channel's tree name and this vessel's path coordinate there */
  entries: { channel: string; entryMm: number }[];
  /** Rentrop grade of the recipient artery */
  rentrop: RentropGrade;
}

export interface TreeVessel {
  name: string;
  /** contrast follows this named vessel's fill */
  fillId: VesselId;
  /** named vessel for lesion mapping (twigs map to their parent) */
  lesionId: VesselId | null;
  samples: Sample[];
  radii: number[];
  /** distance from the coronary ostium along the flow path (mm) at each sample */
  pathMm: number[];
  /** 0..1 along the named vessel (for lesion positions), per sample */
  param: number[];
  /** occluded beyond this sample index (CTO); -1 if patent */
  occludedFrom: number;
  /** calcified segments: [startIdx, endIdx] */
  calcium: [number, number][];
  /** thrombus: sample indices with a filling defect */
  thrombus: [number, number][];
  side: "left" | "right";
  /** parent vessel and the sample index of this vessel's origin on it */
  parent?: { name: string; index: number };
  /**
   * Beyond a chronic occlusion: filled late and faintly, backwards through collaterals, when
   * the `side` coronary is injected. Samples from `from` on; contrast enters through the
   * channels in `entries` and spreads from there (contrastTransport.ts times it).
   */
  retro?: RetroFill;
  /** named trunk, named branch, small (space-filling) branch, collateral channel, or bypass graft (CoronaryTree.grafts only) */
  kind?: VesselKind | "collateral" | "graft";
  /** myocardial territory of a grown vessel */
  territory?: Territory;
  /** collateral channels: the channel this vessel draws */
  channel?: TreeChannel;
  /** the lumen beyond its radius (vessels with lesions only) */
  shape?: LumenShape;
  /** branching generation: 0 trunks, 1 named branches, 2+ small branches */
  generation?: number;
  /** SYNTAX segment label per sample ("1"…"16c"), null where SYNTAX does not score the vessel */
  segment?: (string | null)[];
  /** healthy (reference) radius per sample from the flow law, before lesions and stents */
  refRadii?: number[];
  /** myocardial bridge: samples [i0, i1] are compressed in systole by up to `depth` of the radius */
  bridge?: { i0: number; i1: number; depth: number };
  /**
   * Densely resampled copy (spacing ≤ 0.25 mm) around lesions and stent edges, with the stenosis
   * profile evaluated exactly, for rendering. Base arrays keep their indices (lesion-independent).
   */
  fine?: { samples: Sample[]; radii: number[]; pathMm: number[]; param: number[]; baseIndex: number[]; shape?: LumenShape };
  /** iodine visibility per sample (fades over the last millimetres of a terminal branch) */
  fade?: number[];
}

/** A deployed stent: the lumen is held open to its radius between two positions on a named vessel. */
export interface Scaffold {
  vessel: VesselId;
  /** 0..1 along the named vessel */
  from: number;
  to: number;
  /** expanded radius (mm) */
  radius: number;
}

export interface CoronaryTree {
  heart: HeartFrame;
  vessels: TreeVessel[];
  /** the patient's anatomy genome (for teaching text: "ramus present, wrap-around LAD") */
  genome?: AnatomyGenome;
  /** short description of the genome */
  description?: string[];
  /** growth statistics of the cached topology */
  stats?: Topology["stats"] & { growMs: number };
  /**
   * Where each of the case's lesions was drawn (index-aligned with the case's lesions): the tree
   * vessel and the position after placing a branch lesion at its side branch, and that branch.
   */
  lesionSites?: { vessel: string | null; position: number; branch?: string; lo?: number; hi?: number }[];
  /**
   * The case's vein and radial grafts on the ascending aorta (diag-grafts-svg), in the case's graft order; absent on a
   * case without them. They are vessels in every respect the image and the physics need (samples, radii, path), kept
   * apart from `vessels` so that the native flow model, the native transport and every consumer of the native tree are
   * unchanged. The PCI geometry reads them from here as well.
   */
  grafts?: TreeGraft[];
}

/** What a graft carries beyond a vessel's fields. */
export interface TreeGraftInfo {
  /** the graft's id within the case (anatomy.ts graftIdOf) */
  id: string;
  /** index in AnatomyCase.grafts */
  index: number;
  conduit: GraftConduit;
  status: GraftStatus;
  site: GraftProximalSite;
  target: VesselId;
  ringMarker: boolean;
  /** the native tree vessel and its sample index where the graft is anastomosed */
  anastomosis: { vessel: string; index: number };
  /** aortic ostium (aortic frame, rest) and the graft's take-off direction */
  ostium: Vec3;
  ostiumDir: Vec3;
  /** with status 'diseased': the stenosis (path coordinate of its centre from the ostium, mm, and % diameter) */
  stenosis?: { atMm: number; severity: number; lengthMm: number };
}

/** A bypass graft in the tree. `side` is the coronary system of its target, `fillId` its target vessel. */
export interface TreeGraft extends TreeVessel {
  kind: "graft";
  graft: TreeGraftInfo;
}

/**
 * Graft disease and occlusion as drawn. MODEL PARAMETERS: the module text (Oxford ch 7, complex-pci/05-prior-cabg.ts)
 * describes vein graft failure and the occluded graft seen as a stump on the aorta, not their dimensions. A diseased
 * graft carries one stenosis just inside its ostium (lab request cp-prior-cabg#0: pressure-damped at a stenosed graft
 * ostium), drawn in the image and in the rod's graft lumen; the damped trace there needs the session to narrow the
 * tip's gap for it as it does for a native ostial lesion (labSession.ts, not this package's file). An occluded graft
 * is a short stump that tapers shut.
 */
export const GRAFT_LESION = {
  diseased: { atMm: 6, severity: 75, lengthMm: 8 },
  /** length of an occluded graft's stump from the aortic wall (mm), and its end radius as a share of the lumen */
  stumpMm: 6,
  stumpEndShare: 0.35,
};

export interface BuildOptions {
  /** use this genome instead of the one derived from the case */
  genome?: AnatomyGenome;
}

// ---------------------------------------------------------------------------
// positions
// ---------------------------------------------------------------------------

const restCache = new WeakMap<Sample, { H: HeartFrame; p: Vec3 }>();

/** Rest position of the surface part of a sample (cached per sample object). */
function surfaceRest(H: HeartFrame, s: Sample): Vec3 {
  const c = restCache.get(s);
  if (c && c.H === H) return c.p;
  const p = restPoint(H, s.ell, s.phi, s.h);
  restCache.set(s, { H, p });
  return p;
}

function moveFixed(H: HeartFrame, p: Vec3, m?: Motion): Vec3 {
  if (!m || !m.rootMoves) return p;
  return V3.add(p, rootDisplacement(m, p.y, H));
}

/** Position of a sample for the given motion (rest geometry when m is omitted). */
export function samplePos(H: HeartFrame, s: Sample, m?: Motion): Vec3 {
  if (s.fixed && s.w <= 0) return moveFixed(H, s.fixed, m);
  const p0 = surfaceRest(H, s);
  const surf = m && (m.contraction || m.env) ? V3.add(p0, displace(H, s.ell, s.phi, s.h, p0, m)) : p0;
  if (!s.fixed || s.w >= 1) return surf;
  const f = moveFixed(H, s.fixed, m);
  return V3.add(V3.sc(f, 1 - s.w), V3.sc(surf, s.w));
}

/** Rest position of a sample (alias of samplePos without motion). */
export function restPosition(H: HeartFrame, s: Sample): Vec3 {
  return samplePos(H, s);
}

// ---------------------------------------------------------------------------
// lesions
// ---------------------------------------------------------------------------

function lesionWidth(l: Lesion, totalMm: number): number {
  return l.lengthMm ? l.lengthMm / 2 / Math.max(1, totalMm) : l.kind === "diffuse" ? 0.22 : l.kind === "cto" ? 0.04 : 0.055;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth01 = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/**
 * Model parameters of the lesion morphologies (diag-lesion-morphologies). MODEL PARAMETER unless a
 * source is named: values chosen to draw the appearance the module text describes, not measured.
 */
export const MORPHOLOGY = {
  /** SCAD (Saw classification as Brilakis gives it, src/content/manual/complex-pci/12-other-complex.ts,
   *  "Angiographic types of SCAD"): default lengths (mm) when the lesion gives none. 2A is usually
   *  longer than 20 mm and 3 usually shorter, per that table; the values themselves are model choices. */
  scadLengthMm: { "1": 20, "2A": 30, "2B": 0, "3": 12 } as Record<"1" | "2A" | "2B" | "3", number>,
  /** SCAD shoulder length (mm) from normal calibre to the narrowing: smooth for type 2, sharper for 3 */
  scadShoulderMm: { "1": 3, "2A": 5, "2B": 5, "3": 2.5 } as Record<"1" | "2A" | "2B" | "3", number>,
  /** SCAD type 1: false-lumen radius as a share of the reference radius at the plateau */
  falseLumenShare: 0.6,
  /** SCAD type 1: lucent flap between the true and false lumens (mm) */
  flapMm: 0.15,
  /** CTO stump: length (mm) over which a tapered stump narrows to the proximal cap; a blunt one in 1 mm */
  stumpTaperMm: 6,
  stumpBluntMm: 1,
  /** CTO distal cap: length (mm) over which the vessel returns to normal calibre beyond the occluded segment */
  distalCapMm: 2,
  /** CTO occluded length (mm) when the lesion's cto gives none */
  ctoLengthMm: 15,
  /**
   * Thrombus filling defect: half-length as a share of the reference diameter by TIMI thrombus grade.
   * The grades are Brilakis's (src/content/manual/pci-manual/09-interpreting.ts, "TIMI thrombus grade":
   * 2 at most half a diameter, 3 half to two diameters, 4 two or more); the half-lengths that fall
   * inside each band are model choices. Grade 1 is haze only.
   */
  defectHalfLenD: { 1: 0, 2: 0.2, 3: 0.6, 4: 1.25, 5: 1.25 } as Record<number, number>,
  /** largest filling-defect radius as a share of the lumen radius */
  defectShare: 0.55,
  /** haze extends this far (mm) beyond the defect, or before an occlusion's meniscus */
  hazeMm: 2,
  /** length (mm) of the occluded column after a thrombotic meniscus before the vessel returns to calibre (antegrade it never fills) */
  meniscusTailMm: 3,
  /** side-branch ostium involved (Medina third digit 1): severity share and length (mm) of the ostial narrowing drawn on the branch */
  branchOstialShare: 0.8,
  branchOstialMm: 4,
  /** a branch lesion is moved to its side branch only when the branch arises within this share of the vessel of the given position */
  branchSnap: 0.15,
} as const;

type ProfileKind = "bump" | "plateau" | "to-end" | "cto" | "meniscus";
type ScadT = "1" | "2A" | "2B" | "3";

/** One lesion's geometry on one vessel (positions in the vessel's 0..1 parameter). */
interface LesionGeom {
  pos: number;
  /** bump half-width (old lesionWidth) */
  width: number;
  kind: ProfileKind;
  total: number;
  /** plateau half-length, mm */
  halfMm: number;
  shoulderMm: number;
  sev: number;
  ecc: number;
  orient: number;
  spasm: boolean;
  falseLumen: boolean;
  /** cto: occluded length and stump */
  ctoLenMm: number;
  stumpMm: number;
  /** meniscus radius, mm */
  capR: number;
  taper: { t0: number; t1: number; kd: number } | null;
  thrombus: { halfMm: number; hazeHalfMm: number; centre: number } | null;
  /** window in which the lesion changes the lumen (param) */
  lo: number;
  hi: number;
}

/** Healthy radius of a grown vessel at a parameter (linear between samples). */
function baseAt(gv: GrownVessel, param: number[], t: number): number {
  const n = param.length;
  if (t <= param[0]) return gv.radius[0];
  if (t >= param[n - 1]) return gv.radius[n - 1];
  let lo = 0,
    hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (param[mid] <= t) lo = mid;
    else hi = mid;
  }
  const f = (t - param[lo]) / Math.max(1e-9, param[hi] - param[lo]);
  return gv.radius[lo] + (gv.radius[hi] - gv.radius[lo]) * f;
}

function lesionGeom(l: Lesion, gv: GrownVessel, param: number[], total: number): LesionGeom {
  const mm = 1 / Math.max(1, total);
  const sev = Math.min(0.99, l.severity / 100);
  const width = lesionWidth(l, total);
  const g: LesionGeom = {
    pos: l.position,
    width,
    kind: "bump",
    total,
    halfMm: 0,
    shoulderMm: 0,
    sev,
    ecc: clamp01(l.eccentricity ?? 0),
    orient: ((l.orientationDeg ?? 0) * Math.PI) / 180,
    spasm: l.morphology === "spasm" && l.nitrateResponsive !== false,
    falseLumen: false,
    ctoLenMm: 0,
    stumpMm: 0,
    capR: 0,
    taper: null,
    thrombus: null,
    lo: l.position - width,
    hi: l.position + width,
  };
  if (l.morphology === "scad") {
    const type: ScadT = l.scadType ?? "2A";
    g.shoulderMm = MORPHOLOGY.scadShoulderMm[type];
    if (type === "2B") {
      g.kind = "to-end";
      g.lo = l.position;
      g.hi = 1;
    } else {
      g.kind = "plateau";
      g.halfMm = (l.lengthMm ?? MORPHOLOGY.scadLengthMm[type]) / 2;
      g.lo = l.position - g.halfMm * mm;
      g.hi = l.position + g.halfMm * mm;
      g.falseLumen = type === "1";
    }
    g.ecc = 0;
  } else if (l.morphology === "cto" && l.cto) {
    g.kind = "cto";
    g.sev = 0.99;
    g.ctoLenMm = Math.max(1, l.cto.lengthMm || MORPHOLOGY.ctoLengthMm);
    g.stumpMm = l.cto.stump === "blunt" ? MORPHOLOGY.stumpBluntMm : MORPHOLOGY.stumpTaperMm;
    g.lo = l.position - g.stumpMm * mm;
    g.hi = l.position + (g.ctoLenMm + MORPHOLOGY.distalCapMm) * mm;
    g.ecc = 0;
  } else if (l.morphology === "thrombus" && (l.thrombusGrade ?? 0) > 0) {
    // drawn from its TIMI thrombus grade; a thrombus lesion without a grade keeps the earlier stippled look,
    // and grade 0 (no thrombus) draws neither the defect nor the haze
    const D = 2 * baseAt(gv, param, l.position);
    if (sev >= 0.99) {
      g.kind = "meniscus";
      g.capR = D / 2;
      g.lo = l.position - (g.capR + MORPHOLOGY.hazeMm) * mm;
      g.hi = l.position + (MORPHOLOGY.meniscusTailMm + 2) * mm;
      g.thrombus = { halfMm: 0, hazeHalfMm: 0, centre: l.position };
      g.ecc = 0;
    } else {
      const halfMm = (MORPHOLOGY.defectHalfLenD[l.thrombusGrade!] ?? 0) * D;
      const hazeHalfMm = Math.max(halfMm, (width * total) / 2) + MORPHOLOGY.hazeMm;
      g.thrombus = { halfMm, hazeHalfMm, centre: l.position };
      g.lo = Math.min(g.lo, l.position - hazeHalfMm * mm);
      g.hi = Math.max(g.hi, l.position + hazeHalfMm * mm);
    }
  }
  if (l.taperMm && l.taperMm > 0) {
    // the reference falls by taperMm (diameter) from the proximal to the distal shoulder; the distal vessel keeps the fall
    const t0 = Math.max(0, Math.min(l.position, g.lo)),
      t1 = Math.min(1, Math.max(l.position, g.kind === "to-end" ? l.position + width : g.hi));
    const bp = baseAt(gv, param, t0),
      bd = baseAt(gv, param, t1);
    const kd = Math.max(0.3, Math.min(1, (2 * bp - l.taperMm) / Math.max(1e-6, 2 * bd)));
    if (t1 > t0) g.taper = { t0, t1, kd };
  }
  return g;
}

/** Narrowing profile of a lesion at a parameter (0 none … 1 full severity). */
function profileAt(g: LesionGeom, t: number): number {
  switch (g.kind) {
    case "bump": {
      // diameter stenosis profile: smooth shoulders, sharpest at the centre (the original lesion shape)
      const d = (t - g.pos) / g.width;
      return Math.abs(d) < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * d) : 0;
    }
    case "plateau": {
      const x = Math.abs(t - g.pos) * g.total;
      return x >= g.halfMm ? 0 : smooth01((g.halfMm - x) / g.shoulderMm);
    }
    case "to-end": {
      const x = (t - g.pos) * g.total;
      return x <= 0 ? 0 : smooth01(x / g.shoulderMm);
    }
    case "cto": {
      const x = (t - g.pos) * g.total;
      if (x < 0) return smooth01((x + g.stumpMm) / g.stumpMm);
      if (x <= g.ctoLenMm) return 1;
      return smooth01((g.ctoLenMm + MORPHOLOGY.distalCapMm - x) / MORPHOLOGY.distalCapMm);
    }
    case "meniscus": {
      // the contrast column ends in a smooth convex dome at an acute thrombotic occlusion
      const x = (t - g.pos) * g.total;
      const R = Math.max(0.3, g.capR);
      if (x < -R) return 0;
      if (x <= 0) return 1 - Math.sqrt(Math.max(0, 1 - ((x + R) / R) ** 2));
      if (x <= MORPHOLOGY.meniscusTailMm) return 1;
      return smooth01((MORPHOLOGY.meniscusTailMm + 2 - x) / 2);
    }
  }
}

function taperK(tp: NonNullable<LesionGeom["taper"]>, t: number): number {
  if (t <= tp.t0) return 1;
  if (t >= tp.t1) return tp.kd;
  return 1 + (tp.kd - 1) * smooth01((t - tp.t0) / (tp.t1 - tp.t0));
}

/** The lumen at one point. */
interface LumenSample {
  r: number;
  ref: number;
  minor: number;
  major: number;
  orient: number;
  defect: number;
  haze: number;
  falseR: number;
  spasmF: number;
  other: number;
}

/**
 * The lumen at parameter t for a base radius b (luminal irregularity included). With no morphology
 * field set this is the original concentric profile, value for value.
 */
function lumenSample(b: number, t: number, G: LesionGeom[]): LumenSample {
  let ref = b;
  for (const g of G) if (g.taper) ref *= taperK(g.taper, t);
  let minor = ref,
    major = ref,
    orient = 0,
    defect = 0,
    haze = 0,
    falseR = 0,
    spasmF = 0,
    other = ref,
    best = Infinity;
  for (const g of G) {
    if (g.thrombus) {
      const x = Math.abs(t - g.thrombus.centre) * g.total;
      if (g.thrombus.halfMm > 0 && x < g.thrombus.halfMm) defect = Math.max(defect, MORPHOLOGY.defectShare * Math.sqrt(1 - (x / g.thrombus.halfMm) ** 2));
      if (g.kind === "meniscus") {
        const xs = (t - g.pos) * g.total;
        if (xs > -(g.capR + MORPHOLOGY.hazeMm) && xs < 0.5) haze = Math.max(haze, smooth01((xs + g.capR + MORPHOLOGY.hazeMm) / MORPHOLOGY.hazeMm));
      } else if (x < g.thrombus.hazeHalfMm) haze = Math.max(haze, smooth01((g.thrombus.hazeHalfMm - x) / MORPHOLOGY.hazeMm));
    }
    const f = profileAt(g, t);
    if (f <= 0) continue;
    const mi = ref * (1 - g.sev * f);
    const ma = g.ecc > 0 ? ref * (1 - g.sev * f * (1 - g.ecc)) : mi;
    if (g.spasm) spasmF = Math.max(spasmF, g.sev * f);
    else other = Math.min(other, ma > mi ? Math.sqrt(mi * ma) : mi);
    if (mi < best) {
      best = mi;
      orient = g.orient;
    }
    minor = Math.min(minor, mi);
    major = Math.min(major, ma);
    if (g.falseLumen) falseR = Math.max(falseR, MORPHOLOGY.falseLumenShare * ref * f);
  }
  if (major < minor) major = minor;
  return { r: major > minor ? Math.sqrt(minor * major) : minor, ref, minor, major, orient, defect, haze, falseR, spasmF, other };
}

// per-topology derived arrays (path coordinates do not depend on lesions)
const pathCache = new WeakMap<Topology, Map<string, { pathMm: number[]; param: number[]; drift: number[] }>>();

function derived(topo: Topology, seed: string): Map<string, { pathMm: number[]; param: number[]; drift: number[] }> {
  let m = pathCache.get(topo);
  if (m) return m;
  m = new Map();
  for (const gv of topo.vessels) {
    const off = gv.parent ? m.get(gv.parent.name)?.pathMm[gv.parent.index] ?? 0 : 0;
    const total = gv.lenMm[gv.lenMm.length - 1] || 1;
    // mild luminal irregularity: real lumens are never perfectly smooth tubes
    const irr = new Rng("irr:" + seed + gv.name);
    let d = 0;
    const drift = gv.lenMm.map(() => {
      d = d * 0.85 + (irr.next() - 0.5) * 0.06;
      return d;
    });
    m.set(gv.name, { pathMm: gv.lenMm.map((x) => x + off), param: gv.lenMm.map((x) => x / total), drift });
  }
  pathCache.set(topo, m);
  return m;
}

/**
 * Where the case's lesions are drawn. A lesion with branchAt is moved so that its side branch (the
 * branch named by sideBranch, else the largest named branch near it) leaves at that fraction of the
 * lesion, proximal to distal shoulder; with Medina's third digit 1 the branch ostium is narrowed too.
 */
function resolveLesions(topo: Topology, lesions: Lesion[], D: Map<string, { param: number[] }>) {
  const resolved: Lesion[] = [];
  const sites: NonNullable<CoronaryTree["lesionSites"]> = [];
  const extra = new Map<string, Lesion[]>();
  for (const l of lesions) {
    const gv = topo.vessels.find((v) => v.lesionId === l.vessel);
    if (!gv) {
      resolved.push(l);
      sites.push({ vessel: null, position: l.position });
      continue;
    }
    if (l.branchAt === undefined) {
      resolved.push(l);
      sites.push({ vessel: gv.name, position: l.position });
      continue;
    }
    const P = D.get(gv.name)!.param;
    const total = gv.lenMm[gv.lenMm.length - 1] || 1;
    const w = lesionWidth(l, total);
    const kids = topo.vessels.filter((v) => v.parent?.name === gv.name && v.kind !== "twig" && v.territory !== "atrial");
    const named = l.sideBranch ? kids.filter((v) => v.lesionId === l.sideBranch!.vessel || v.fillId === l.sideBranch!.vessel) : [];
    const near = (named.length ? named : kids).filter((v) => Math.abs(P[v.parent!.index] - l.position) <= MORPHOLOGY.branchSnap);
    const br = near.sort((a, b) => (named.length ? Math.abs(P[a.parent!.index] - l.position) - Math.abs(P[b.parent!.index] - l.position) : b.radius[0] - a.radius[0]))[0];
    if (!br) {
      resolved.push(l);
      sites.push({ vessel: gv.name, position: l.position });
      continue;
    }
    const tb = P[br.parent!.index];
    const pos = Math.max(0, Math.min(1, tb + w - clamp01(l.branchAt) * 2 * w));
    const r: Lesion = { ...l, position: pos };
    resolved.push(r);
    sites.push({ vessel: gv.name, position: pos, branch: br.name });
    if (l.medina?.[2] === 1) {
      const bt = br.lenMm[br.lenMm.length - 1] || 1;
      const ost: Lesion = { vessel: (br.lesionId ?? l.vessel) as VesselId, position: Math.min(0.5, MORPHOLOGY.branchOstialMm / 2 / bt), severity: l.severity * MORPHOLOGY.branchOstialShare, kind: l.kind, lengthMm: MORPHOLOGY.branchOstialMm };
      extra.set(br.name, [...(extra.get(br.name) ?? []), ost]);
    }
  }
  return { resolved, sites, extra };
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

export function buildCoronaryTree(
  model: AnatomyModel,
  c: Pick<AnatomyCase, "dominance" | "variants" | "lesions" | "id"> & Partial<Pick<AnatomyCase, "grafts">>,
  scaffolds: Scaffold[] = [],
  opts: BuildOptions = {}
): CoronaryTree {
  const genome = opts.genome ?? genomeForCase(c);
  const topo = growTopology(model, genome);
  const H = topo.heart;
  const D = derived(topo, genome.seed);
  const built = new Map<string, TreeVessel>();
  const out: TreeVessel[] = [];
  const { resolved, sites, extra } = resolveLesions(topo, c.lesions, D);

  for (const gv of topo.vessels) {
    const dd = D.get(gv.name)!;
    const { pathMm, param, drift } = dd;
    const total = gv.lenMm[gv.lenMm.length - 1] || 1;
    const lesions = [...(gv.lesionId ? resolved.filter((l) => l.vessel === gv.lesionId) : []), ...(extra.get(gv.name) ?? [])];
    const stents = gv.lesionId ? scaffolds.filter((x) => x.vessel === gv.lesionId) : [];
    const G = lesions.map((l) => lesionGeom(l, gv, param, total));
    // the window each of the case's lesions narrows on this vessel (for the per-view truth)
    if (gv.lesionId)
      resolved.forEach((l, k) => {
        if (l.vessel !== gv.lesionId) return;
        const g = G[lesions.indexOf(l)];
        if (g) Object.assign(sites[k], { lo: g.lo, hi: g.hi });
      });
    const lumenAt = (t: number, base: number, dr: number): LumenSample => {
      const b = base * (1 + dr);
      const s = lumenSample(b, t, G);
      // inside a stent the lumen takes the stent's radius, still narrowed where it is under-expanded (and round)
      const st = stents.find((x) => t >= x.from && t <= x.to);
      if (st) {
        const r = st.radius * (1 + dr * 0.3) * (s.r / b);
        return { ...s, r, minor: r, major: r, defect: 0, falseR: 0, spasmF: 0, other: r };
      }
      return s;
    };
    const has = lesions.length > 0 || stents.length > 0;
    const samplesL = has ? param.map((t, i) => lumenAt(t, gv.radius[i], drift[i])) : null;
    const radii = samplesL ? samplesL.map((s) => s.r) : gv.radius.map((r, i) => r * (1 + drift[i]));
    const cto = lesions.find((l) => l.kind === "cto" || l.severity >= 99);
    let occludedFrom = cto ? param.findIndex((t) => t >= cto.position) : -1;
    // branches arising beyond an occlusion get no antegrade contrast either
    if (occludedFrom < 0 && gv.parent) {
      const p = built.get(gv.parent.name);
      if (p && p.occludedFrom >= 0 && gv.parent.index >= p.occludedFrom) occludedFrom = 0;
    }
    const calcium: [number, number][] = [];
    const thrombus: [number, number][] = [];
    for (const l of lesions) {
      const i0 = param.findIndex((t) => t >= l.position - 0.08);
      const i1 = param.findIndex((t) => t >= l.position + 0.08);
      const span: [number, number] = [Math.max(0, i0), i1 < 0 ? gv.samples.length - 1 : i1];
      if (l.kind === "calcified" || l.kind === "left-main" || l.kind === "ostial-rca") calcium.push(span);
      // the original stippled filling defect; a lesion with morphology 'thrombus' and a TIMI thrombus grade draws a defect and haze instead
      if (l.kind === "thrombotic" && !(l.morphology === "thrombus" && l.thrombusGrade !== undefined)) thrombus.push([Math.max(0, param.findIndex((t) => t >= l.position - 0.03)), Math.max(0, param.findIndex((t) => t >= l.position + 0.03))]);
    }
    const tv: TreeVessel = {
      name: gv.name,
      fillId: gv.fillId,
      lesionId: gv.lesionId,
      samples: gv.samples,
      radii,
      pathMm,
      param,
      occludedFrom,
      calcium,
      thrombus,
      side: gv.side,
      parent: gv.parent ? { ...gv.parent } : undefined,
      kind: gv.kind,
      generation: gv.generation,
      segment: gv.segment,
      refRadii: gv.radius,
      bridge: gv.bridge,
      fade: tipFade(gv),
      territory: gv.territory,
    };
    if (samplesL) tv.shape = shapeOf(samplesL, G);
    if (has) tv.fine = refine(gv, tv, G, stents, total, lumenAt, drift);
    built.set(gv.name, tv);
    out.push(tv);
  }

  // only chronic occlusions have developed collaterals; an acute occlusion has none to speak of. A CTO with its
  // own collateral description (morphology 'cto' with cto) draws those channels; any other CTO the automatic ones.
  const explicit = resolved.filter((l) => l.morphology === "cto" && l.cto);
  if (explicit.length) for (const l of explicit) addChannels(H, out, l, c.id);
  else if (c.lesions.some((l) => l.kind === "cto")) addCollaterals(H, out, c.id, graftFedOf(out, c.grafts));

  const tree: CoronaryTree = {
    heart: H,
    vessels: out,
    genome,
    description: describeGenome(genome),
    stats: { ...topo.stats, growMs: topo.buildMs },
    lesionSites: sites,
  };
  // bypass grafts (diag-grafts-svg): only a case with an aortic vein or radial graft has them
  if (model.grafts?.length) {
    const grafts = growGrafts(topo, model).map(graftVessel);
    if (grafts.length) tree.grafts = grafts;
  }
  return tree;
}

/**
 * A native vessel is graft-fed when a graft that is not occluded (any conduit, from the case's grafts) is anastomosed
 * to it, or to a vessel arising from it, beyond its occlusion. Such a bed does not develop the automatic collaterals of
 * a chronic occlusion: Oxford's rule that an occluded native artery without collaterals suggests its graft may still
 * be open (complex-pci/05-prior-cabg.ts, tip diag-graft-not-found).
 */
function graftFedOf(out: TreeVessel[], grafts: readonly Graft[] | undefined): (v: TreeVessel) => boolean {
  const open = (grafts ?? []).filter((g) => g.status !== "occluded");
  if (!open.length) return () => false;
  const byName = new Map(out.map((v) => [v.name, v]));
  return (v: TreeVessel) => {
    if (v.occludedFrom < 0) return false;
    for (const g of open) {
      const tv = out.find((x) => x.lesionId === g.target && x.kind !== "twig" && x.kind !== "collateral");
      if (!tv) continue;
      if (tv === v) {
        if (v.param.findIndex((t) => t >= g.position) >= v.occludedFrom) return true;
        continue;
      }
      for (let u: TreeVessel | undefined = tv; u?.parent; u = byName.get(u.parent.name)) if (u.parent.name === v.name && u.parent.index >= v.occludedFrom) return true;
    }
    return false;
  };
}

/** A grown graft course as a tree vessel, with its status drawn (a proximal stenosis, or an occluded stump). */
function graftVessel(gc: GraftCourse): TreeGraft {
  const g = gc.site.graft;
  const n = gc.samples.length;
  const total = gc.lenMm[n - 1] || 1;
  let radii = gc.radius.slice();
  let occludedFrom = -1;
  let stenosis: TreeGraftInfo["stenosis"];
  if (g.status === "diseased") {
    const d = GRAFT_LESION.diseased;
    stenosis = { atMm: d.atMm, severity: d.severity, lengthMm: d.lengthMm };
    radii = radii.map((r, i) => {
      const x = (gc.lenMm[i] - d.atMm) / (d.lengthMm / 2);
      const bump = Math.abs(x) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * x);
      return r * (1 - (d.severity / 100) * bump);
    });
  } else if (g.status === "occluded") {
    const L = GRAFT_LESION.stumpMm;
    occludedFrom = gc.lenMm.findIndex((x) => x > L);
    if (occludedFrom < 0) occludedFrom = n - 1;
    radii = radii.map((r, i) => (gc.lenMm[i] > L ? r * GRAFT_LESION.stumpEndShare : r * (1 - (1 - GRAFT_LESION.stumpEndShare) * smooth01(gc.lenMm[i] / L - 0.3))));
  }
  return {
    name: gc.site.treeName,
    fillId: g.target,
    lesionId: null,
    samples: gc.samples,
    radii,
    pathMm: gc.lenMm.slice(),
    param: gc.lenMm.map((x) => x / total),
    occludedFrom,
    calcium: [],
    thrombus: [],
    side: gc.site.side,
    kind: "graft",
    generation: 0,
    refRadii: gc.radius,
    graft: {
      id: gc.site.id,
      index: gc.site.index,
      conduit: g.conduit,
      status: g.status,
      site: g.proximalSite,
      target: g.target,
      ringMarker: g.ringMarker,
      anastomosis: { vessel: gc.target.name, index: gc.target.index },
      ostium: gc.site.ostium.pos,
      ostiumDir: gc.site.ostium.dir,
      ...(stenosis ? { stenosis } : {}),
    },
  };
}

/** The shape arrays a vessel needs (only those its lesions use). */
function shapeOf(S: LumenSample[], G: LesionGeom[]): LumenShape {
  const sh: LumenShape = { ref: S.map((s) => s.ref) };
  if (G.some((g) => g.ecc > 0)) {
    sh.minor = S.map((s) => s.minor);
    sh.major = S.map((s) => s.major);
    sh.orient = S.map((s) => s.orient);
  }
  if (G.some((g) => g.thrombus)) {
    sh.defect = S.map((s) => s.defect);
    sh.haze = S.map((s) => s.haze);
  }
  if (G.some((g) => g.falseLumen)) sh.falseR = S.map((s) => s.falseR);
  if (G.some((g) => g.spasm)) {
    sh.spasmF = S.map((s) => s.spasmF);
    sh.other = S.map((s) => s.other);
  }
  return sh;
}

/** Iodine visibility: terminal small branches fade over their last 3 mm (the column thins out). */
function tipFade(gv: GrownVessel): number[] | undefined {
  if (gv.kind === "main") return undefined;
  const total = gv.lenMm[gv.lenMm.length - 1];
  return gv.lenMm.map((x) => Math.min(1, Math.max(0.25, (total - x) / 3)));
}

/** Dense render path around lesions and stent edges (≤ 0.25 mm spacing, exact sample at each lesion centre). */
function refine(
  gv: GrownVessel,
  tv: TreeVessel,
  G: LesionGeom[],
  stents: Scaffold[],
  total: number,
  lumenAt: (t: number, base: number, dr: number) => LumenSample,
  drift: number[]
): TreeVessel["fine"] {
  const windows: [number, number][] = [];
  for (const g of G) windows.push([g.lo - 1 / total, g.hi + 1 / total]);
  for (const s of stents) {
    for (const e of [s.from, s.to]) windows.push([e - 1.5 / total, e + 1.5 / total]);
  }
  const centres = G.map((g) => g.pos);
  const P = tv.param;
  const samples: Sample[] = [];
  const radii: number[] = [];
  const pathMm: number[] = [];
  const param: number[] = [];
  const baseIndex: number[] = [];
  const lum: LumenSample[] = [];
  const base0 = tv.shape;
  const push = (i: number, f: number) => {
    const a = gv.samples[i],
      b = gv.samples[Math.min(gv.samples.length - 1, i + 1)];
    const s: Sample = { ell: a.ell + (b.ell - a.ell) * f, phi: a.phi + (b.phi - a.phi) * f, h: a.h + (b.h - a.h) * f, w: a.w + (b.w - a.w) * f };
    if (a.fixed && b.fixed) s.fixed = V3.add(V3.sc(a.fixed, 1 - f), V3.sc(b.fixed, f));
    else if (a.fixed || b.fixed) s.fixed = a.fixed ?? b.fixed;
    const j = Math.min(gv.samples.length - 1, i + 1);
    const t = P[i] + (P[j] - P[i]) * f;
    const base = gv.radius[i] + (gv.radius[j] - gv.radius[i]) * f;
    const dr = drift[i] + (drift[j] - drift[i]) * f;
    samples.push(f === 0 ? a : s);
    const L = f === 0 && base0 ? baseLumen(base0, tv.radii, i) : lumenAt(t, base, dr);
    radii.push(f === 0 ? tv.radii[i] : L.r);
    lum.push(L);
    pathMm.push(tv.pathMm[i] + (tv.pathMm[j] - tv.pathMm[i]) * f);
    param.push(t);
    baseIndex.push(i + f);
  };
  for (let i = 0; i < gv.samples.length; i++) {
    push(i, 0);
    if (i === gv.samples.length - 1) break;
    const t0 = P[i],
      t1 = P[i + 1];
    const inWin = windows.some(([a, b]) => t1 >= a && t0 <= b);
    const cuts: number[] = [];
    if (inWin) {
      const mm = (t1 - t0) * total;
      const n = Math.ceil(mm / 0.25);
      for (let k = 1; k < n; k++) cuts.push(k / n);
    }
    for (const c of centres) if (c > t0 && c < t1) cuts.push((c - t0) / (t1 - t0));
    cuts.sort((a, b) => a - b);
    let last = 0;
    for (const f of cuts) {
      if (f - last < 1e-4 || 1 - f < 1e-4) continue;
      push(i, f);
      last = f;
    }
  }
  const fine: NonNullable<TreeVessel["fine"]> = { samples, radii, pathMm, param, baseIndex };
  if (base0) fine.shape = shapeOf(lum, G);
  return fine;
}

/** The lumen sample of base sample i, read back from the base shape arrays (so dense and base paths agree exactly). */
function baseLumen(sh: LumenShape, radii: number[], i: number): LumenSample {
  const r = radii[i];
  return {
    r,
    ref: sh.ref[i],
    minor: sh.minor?.[i] ?? r,
    major: sh.major?.[i] ?? r,
    orient: sh.orient?.[i] ?? 0,
    defect: sh.defect?.[i] ?? 0,
    haze: sh.haze?.[i] ?? 0,
    falseR: sh.falseR?.[i] ?? 0,
    spasmF: sh.spasmF?.[i] ?? 0,
    other: sh.other?.[i] ?? r,
  };
}

// ---------------------------------------------------------------------------
// collaterals
// ---------------------------------------------------------------------------

/**
 * Collateral channel model parameters (MODEL PARAMETER). The Werner grades are Brilakis's
 * (src/content/manual/pci-manual/09-interpreting.ts, "Werner collateral connection grade": CC0 no
 * continuous connection, CC1 thread-like, CC2 the size of a side branch) and the Rentrop grades his
 * too (same file, "Rentrop grade": 0 none, 1 side branches only, 2 partial filling of the epicardial
 * vessel, 3 complete); the radii, speeds and strengths that draw them are model choices.
 */
export const COLLATERAL = {
  /** channel radius (mm) by Werner grade; CC0 is drawn interrupted */
  radiusMm: [0.1, 0.16, 0.3] as Record<WernerGrade, number>,
  /** contrast speed along the channel (mm/s) by Werner grade: thin channels carry little flow */
  speedMmS: [30, 45, 60] as Record<WernerGrade, number>,
  /** peak strength of the recipient's filling as a share of the donor's ostial strength, by Werner grade */
  gain: [0.25, 0.4, 0.5] as Record<WernerGrade, number>,
  /** turns and amplitude (degrees of phi) of the channel's meander by tortuosity grade */
  turns: [[1, 2], [3, 5], [7, 10]] as [number, number][],
  ampDeg: [1, 3, 5] as number[],
  /** septal channels run this deep below the epicardium (mm); epicardial ones close to it */
  septalDepthMm: 14,
  epicardialDepthMm: 3,
  /** Rentrop 2: the occluded vessel fills only over its distal share beyond the distal cap */
  rentrop2DistalShare: 0.5,
  /** the automatic channels of a CTO without its own description: the earlier model's look and strength */
  autoGain: 0.3,
};

/** Every vessel beyond an occlusion (the occluded vessel itself from `from`), with its descendants. */
function recipientsOf(out: TreeVessel[], occluded: TreeVessel, from: number): Map<string, number> {
  const recipients = new Map<string, number>([[occluded.name, from]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v of out) {
      if (recipients.has(v.name) || !v.parent || v.kind === "collateral") continue;
      const pf = recipients.get(v.parent.name);
      const lim = v.parent.name === occluded.name ? Math.min(from, Math.max(0, occluded.occludedFrom)) : pf;
      if (pf !== undefined && lim !== undefined && v.parent.index >= lim) {
        recipients.set(v.name, 0);
        grew = true;
      }
    }
  }
  return recipients;
}

/** A channel's samples from a donor sample to a recipient sample on the heart surface. */
function channelSamples(H: HeartFrame, s0: Sample, s1: Sample, distMm: number, depth: number, turns: number, amp: number, ph: number): Sample[] {
  let dphi = s1.phi - s0.phi;
  while (dphi > 180) dphi -= 360;
  while (dphi < -180) dphi += 360;
  const steps = Math.max(8, Math.round(distMm / 1.1));
  const samples: Sample[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const env = Math.sin(Math.PI * t);
    samples.push({
      ell: s0.ell + (s1.ell - s0.ell) * t + env * 0.02 * Math.sin(turns * 2 * Math.PI * t + ph),
      phi: s0.phi + dphi * t + env * amp * Math.sin(turns * 2 * Math.PI * t),
      h: s0.h + (s1.h - s0.h) * t - depth * env,
      w: 1,
    });
  }
  return samples;
}

function arcLengths(H: HeartFrame, samples: Sample[]): number[] {
  const len = [0];
  for (let i = 1; i < samples.length; i++) {
    const p = samplePos(H, samples[i]),
      q = samplePos(H, samples[i - 1]);
    len.push(len[i - 1] + Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
  }
  return len;
}

/**
 * The collateral channels a CTO lesion describes (Lesion.cto.collaterals), and the retrograde filling
 * of the recipient bed they feed. Each channel runs from the donor vessel's sample nearest its
 * recipient anchor (through the septum for a septal channel, on the surface for an epicardial one);
 * its calibre and speed follow the Werner grade, its meander the tortuosity, and how much of the
 * recipient fills follows the Rentrop grade.
 */
function addChannels(H: HeartFrame, out: TreeVessel[], l: Lesion, id: string): void {
  const cto = l.cto!;
  const occluded = out.find((v) => v.lesionId === l.vessel && v.occludedFrom >= 0);
  if (!occluded || !cto.collaterals.length) return;
  const byName = new Map(out.map((v) => [v.name, v]));
  const n = occluded.samples.length;
  const capT = l.position + Math.max(1, cto.lengthMm || MORPHOLOGY.ctoLengthMm) / Math.max(1, occluded.pathMm[n - 1] - occluded.pathMm[0]);
  let distal = occluded.param.findIndex((t) => t >= capT);
  if (distal < 0) distal = n - 1;
  distal = Math.max(distal, occluded.occludedFrom + 1);
  if (distal > n - 1) return;
  const recipients = recipientsOf(out, occluded, distal);
  const rentrop = Math.max(...cto.collaterals.map((c) => c.rentrop)) as RentropGrade;
  const rng = new Rng("channels:" + id + ":" + l.vessel + ":" + l.position);
  // ancestry: a vessel descends from the donor when it or an ancestor carries the donor's id
  const descends = (v: TreeVessel, donor: VesselId): boolean => {
    for (let u: TreeVessel | undefined = v; u; u = u.parent ? byName.get(u.parent.name) : undefined) if (u.lesionId === donor || u.fillId === donor) return true;
    return false;
  };
  const entries = new Map<string, { channel: string; entryMm: number }[]>();
  const sideOf: ("left" | "right")[] = [];
  let gain = 0;
  let k = 0;
  for (const ch of cto.collaterals) {
    if (ch.rentrop === 0 && ch.wernerCC === 0) continue;
    // the recipient vessel and the anchor on it
    let rv: TreeVessel = [...recipients.keys()].map((nm) => byName.get(nm)!).find((v) => v.lesionId === ch.recipient && v.kind !== "twig") ?? occluded;
    if (ch.rentrop === 1 && rv === occluded) {
      // side branches only: the channel enters the largest branch beyond the occlusion
      const br = [...recipients.keys()].map((nm) => byName.get(nm)!).filter((v) => v !== occluded && v.kind !== "twig").sort((a, b) => b.radii[0] - a.radii[0])[0];
      if (br) rv = br;
    }
    const rn = rv.samples.length;
    const rFrom = rv === occluded ? distal : 0;
    const ai = rv === occluded ? Math.round(rFrom + (rn - 1 - rFrom) * 0.6) : Math.round((rn - 1) * 0.5);
    const pa = samplePos(H, rv.samples[ai]);
    // the donor: vessels descending from the donor id, outside the recipient bed; septal channels from septal branches
    const all = out.filter((v) => !recipients.has(v.name) && v.kind !== "collateral" && v.name !== "CONUS" && v.territory !== "atrial" && descends(v, ch.donor));
    const septal = all.filter((v) => v.territory === "septal");
    const cand = ch.type === "septal" ? (septal.length ? septal : all) : all.filter((v) => v.territory !== "septal");
    let best: { v: TreeVessel; i: number; d: number } | null = null;
    for (const d of cand.length ? cand : all) {
      for (let i = 0; i < d.samples.length; i += 2) {
        if (d.samples[i].fixed || (d.occludedFrom >= 0 && i >= d.occludedFrom)) continue;
        const q = samplePos(H, d.samples[i]);
        const dist = Math.hypot(q.x - pa.x, q.y - pa.y, q.z - pa.z);
        if (!best || dist < best.d) best = { v: d, i, d: dist };
      }
    }
    if (!best) continue;
    const tg = Math.max(0, Math.min(2, ch.tortuosity)) as 0 | 1 | 2;
    const [t0, t1] = COLLATERAL.turns[tg];
    const turns = t0 + Math.floor(rng.next() * (t1 - t0 + 1));
    const amp = COLLATERAL.ampDeg[tg] * (0.7 + 0.6 * rng.next());
    const samples = channelSamples(H, best.v.samples[best.i], rv.samples[ai], best.d, ch.type === "septal" ? COLLATERAL.septalDepthMm : COLLATERAL.epicardialDepthMm, turns, amp, rng.next() * 6.28);
    const len = arcLengths(H, samples);
    const total = len[len.length - 1] || 1;
    const cc = Math.max(0, Math.min(2, ch.wernerCC)) as WernerGrade;
    const r0 = COLLATERAL.radiusMm[cc];
    const name = `collateral${k++}`;
    out.push({
      name,
      fillId: best.v.fillId,
      lesionId: null,
      samples,
      radii: len.map((x) => r0 * (0.85 + 0.3 * Math.sin((Math.PI * x) / total))),
      pathMm: len.map((x) => x + best!.v.pathMm[best!.i]),
      param: len.map((x) => x / total),
      occludedFrom: -1,
      calcium: [],
      thrombus: [],
      side: best.v.side,
      parent: { name: best.v.name, index: best.i },
      kind: "collateral",
      generation: 3,
      channel: { ...ch, speedMmS: COLLATERAL.speedMmS[cc] },
      // CC0: no continuous connection: the channel is seen only in pieces
      fade: cc === 0 ? len.map((x) => (Math.sin(x * 0.9) > 0.2 ? 1 : 0)) : undefined,
    });
    entries.set(rv.name, [...(entries.get(rv.name) ?? []), { channel: name, entryMm: rv.pathMm[ai] }]);
    sideOf.push(best.v.side);
    gain = Math.max(gain, COLLATERAL.gain[cc]);
  }
  if (!sideOf.length || rentrop === 0) return;
  const side = sideOf[0];
  for (const [name, from0] of recipients) {
    const v = byName.get(name)!;
    let from = from0;
    if (v === occluded) {
      // Rentrop: 3 fills back to the distal cap, 2 only the distal epicardial vessel, 1 not the occluded vessel at all
      if (rentrop === 2) from = Math.round(from0 + (v.samples.length - 1 - from0) * COLLATERAL.rentrop2DistalShare);
      if (rentrop === 1) continue;
    }
    const e = entries.get(name) ?? [];
    v.retro = { side, from, entryMm: e[0]?.entryMm ?? v.pathMm[from], delayS: 0, gain, entries: e, rentrop };
  }
}

/**
 * Collateral circulation to the bed beyond a chronic total occlusion without its own collateral
 * description: a few tortuous channels from the nearest arteries of the other coronary (septal or
 * epicardial), and late, faint, retrograde filling of the occluded vessel and its branches.
 */
function addCollaterals(H: HeartFrame, out: TreeVessel[], id: string, graftFed: (v: TreeVessel) => boolean = () => false): void {
  const occluded = out.find((v) => v.occludedFrom > 0 && v.lesionId && !graftFed(v));
  if (!occluded) return;
  const donorSide = occluded.side === "left" ? "right" : "left";
  const byName = new Map(out.map((v) => [v.name, v]));
  // the occluded vessel beyond the cap and every branch arising beyond it
  const recipients = new Map<string, number>([[occluded.name, Math.min(occluded.samples.length - 1, occluded.occludedFrom + 3)]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v of out) {
      if (recipients.has(v.name) || !v.parent) continue;
      const from = recipients.get(v.parent.name);
      if (from !== undefined && v.parent.index >= from) {
        recipients.set(v.name, 0);
        grew = true;
      }
    }
  }
  const donors = out.filter((v) => v.side === donorSide && v.name !== "CONUS" && v.kind !== "twig" && !recipients.has(v.name));
  if (!donors.length) return;
  const rng = new Rng("collat:" + id);
  const P = (v: TreeVessel, i: number) => samplePos(H, v.samples[i]);
  // recipient anchors: spaced along the distal bed of the occluded vessel and its largest branch
  const anchors: { v: TreeVessel; i: number }[] = [];
  const oFrom = recipients.get(occluded.name)!;
  for (const f of [0.3, 0.6, 0.85]) anchors.push({ v: occluded, i: Math.round(oFrom + (occluded.samples.length - 1 - oFrom) * f) });
  const branch = [...recipients.keys()]
    .map((n) => byName.get(n)!)
    .filter((v) => v !== occluded && v.kind !== "twig")
    .sort((a, b) => b.radii[0] - a.radii[0])[0];
  if (branch) anchors.push({ v: branch, i: Math.round((branch.samples.length - 1) * 0.6) });

  const entries = new Map<string, { channel: string; entryMm: number }[]>();
  let n = 0;
  for (const a of anchors) {
    const pa = P(a.v, a.i);
    // nearest donor sample (rest geometry)
    let best: { v: TreeVessel; i: number; d: number } | null = null;
    for (const d of donors) {
      for (let i = 0; i < d.samples.length; i += 2) {
        if (d.samples[i].fixed) continue;
        const q = P(d, i);
        const dist = Math.hypot(q.x - pa.x, q.y - pa.y, q.z - pa.z);
        if (!best || dist < best.d) best = { v: d, i, d: dist };
      }
    }
    if (!best || best.d > 90) continue;
    const depth = best.d > 35 ? 14 : 5; // longer channels run through the septum, short ones on the surface
    const turns = 3 + Math.floor(rng.next() * 4);
    const amp = 2 + rng.next() * 3;
    const ph = rng.next() * 6.28;
    const samples = channelSamples(H, best.v.samples[best.i], a.v.samples[a.i], best.d, depth, turns, amp, ph);
    const len = arcLengths(H, samples);
    const total = len[len.length - 1] || 1;
    const name = `collateral${n++}`;
    out.push({
      name,
      fillId: best.v.fillId,
      lesionId: null,
      samples,
      radii: len.map((x) => 0.24 + 0.08 * Math.sin((Math.PI * x) / total)),
      pathMm: len.map((x) => x + best!.v.pathMm[best!.i]),
      param: len.map((x) => x / total),
      occludedFrom: -1,
      calcium: [],
      thrombus: [],
      side: best.v.side,
      parent: { name: best.v.name, index: best.i },
      kind: "collateral",
      generation: 3,
      // the earlier model's contrast speed along the channel (contrastTransport COLLATERAL_SPEED_MM_S)
      channel: { donor: best.v.fillId, recipient: (a.v.lesionId ?? a.v.fillId) as VesselId, type: depth > 5 ? "septal" : "epicardial", wernerCC: 1, rentrop: 3, tortuosity: 1, speedMmS: 30 },
    });
    entries.set(a.v.name, [...(entries.get(a.v.name) ?? []), { channel: name, entryMm: a.v.pathMm[a.i] }]);
  }
  if (!n) return;
  // retrograde filling: begins where the channels enter each vessel, spreads from there
  for (const [name, from] of recipients) {
    const v = byName.get(name)!;
    const e = entries.get(name) ?? [];
    v.retro = { side: donorSide, from, entryMm: e[0]?.entryMm ?? v.pathMm[from], delayS: 0, gain: COLLATERAL.autoGain, entries: e, rentrop: 3 };
  }
}

// ---------------------------------------------------------------------------
// view-dependent lumen (the renderer's ellipse) and the true %DS per view
// ---------------------------------------------------------------------------

/** Smallest semi-axis the ribbon renderer draws for a flattened cross-section (mm; XrayRenderer's floor). */
export const ELLIPSE_MIN_SEMI_MM = 0.2;

const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const len3 = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/**
 * Projected half-width and central chord of an elliptical lumen (semi-axes `major` and `minor`, the
 * minor axis along `dir`) on a vessel with tangent T seen along the ray R. The same geometry as the
 * ribbon renderer's flattened tubes (XrayRenderer, TubeSpec.thin): the minor semi-axis is floored at
 * ELLIPSE_MIN_SEMI_MM and the ellipse blends to the equal-area circle as the vessel turns end-on.
 */
export function ellipseProjection(major: number, minor: number, dir: Vec3, T: Vec3, R: Vec3): { halfWidth: number; chord: number; sinA: number } {
  const lt = len3(T) || 1,
    lr = len3(R) || 1;
  const cosA = Math.abs(dot3(T, R)) / (lt * lr);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const b = Math.max(ELLIPSE_MIN_SEMI_MM, minor);
  const req = Math.sqrt(major * b);
  const wEll = Math.min(1, Math.max(0, (sinA - 0.12) / 0.25));
  let r = req,
    c0 = 2 * req;
  if (wEll > 0) {
    const Tn = V3.sc(T, 1 / lt),
      Rn = V3.sc(R, 1 / lr);
    const nn = V3.cross(Tn, Rn);
    const nl = len3(nn);
    const dd = dot3(dir, Tn);
    const e2r = V3.sub(dir, V3.sc(Tn, dd));
    const el = len3(e2r);
    if (nl > 1e-6 && el > 1e-6) {
      const n = V3.sc(nn, 1 / nl);
      const e2 = V3.sc(e2r, 1 / el);
      const e1 = V3.cross(Tn, e2);
      const u = V3.cross(n, Tn);
      const rE = Math.sqrt(major * major * dot3(n, e1) ** 2 + b * b * dot3(n, e2) ** 2);
      const cE = 2 / Math.sqrt(dot3(u, e1) ** 2 / (major * major) + dot3(u, e2) ** 2 / (b * b));
      r = req + (rE - req) * wEll;
      c0 = 2 * req + (cE - 2 * req) * wEll;
    }
  }
  return { halfWidth: r, chord: c0, sinA };
}

/**
 * Direction of an eccentric lumen's minor axis at a sample: the outward surface normal (from the
 * sample to the same sample 1 mm further out, both through `place`), made perpendicular to the
 * tangent T and turned by `orient` about it. Falls back to a fixed perpendicular where the sample
 * does not lie on the moving surface.
 */
export function minorAxisDir(place: (s: Sample) => Vec3, s: Sample, p: Vec3, T: Vec3, orient: number): Vec3 {
  const t = V3.nrm(T);
  let n = V3.sub(place({ ...s, h: s.h + 1 }), p);
  n = V3.sub(n, V3.sc(t, dot3(n, t)));
  if (len3(n) < 1e-3) {
    n = V3.cross(t, V3.v(0, 1, 0));
    if (len3(n) < 1e-3) n = V3.cross(t, V3.v(1, 0, 0));
  }
  n = V3.nrm(n);
  const b = V3.cross(t, n);
  return V3.add(V3.sc(n, Math.cos(orient)), V3.sc(b, Math.sin(orient)));
}

/** A lesion's %DS as one view shows it. */
export interface ViewStenosis {
  /** percent diameter stenosis in this view: 1 - projected MLD / reference at the MLD */
  pctDS: number;
  /** projected minimal lumen diameter and the reference there (mm) */
  mldMm: number;
  refMm: number;
  /** where the MLD lies (0..1 along the tree vessel) */
  param: number;
  /** sine of the angle between the vessel and the ray at the MLD (1 broadside, 0 end-on) */
  sinA: number;
}

/**
 * The true %DS of one of the case's lesions in one view, computed the way the renderer draws the
 * lumen (ellipseProjection on the dense render path, rest geometry, the C-arm's central ray). For
 * QCA scoring and the debrief only: never shown on a live lab screen. `dilation` (0..1, the engine's
 * epicardial dilation) relaxes a spasm lesion as the scene builder does. Null when the lesion is not
 * drawn on the tree.
 */
export function projectedStenosis(tree: CoronaryTree, model: AnatomyModel, lesionIndex: number, cArm: CArm, opts: { dilation?: number } = {}): ViewStenosis | null {
  const site = tree.lesionSites?.[lesionIndex];
  if (!site?.vessel) return null;
  const v = tree.vessels.find((x) => x.name === site.vessel);
  if (!v) return null;
  const rp = v.fine ?? { samples: v.samples, radii: v.radii, param: v.param, shape: v.shape };
  const sh = rp.shape;
  if (!sh) return null;
  const R = cameraBasis(cArm).forward;
  const place = (s: Sample) => toWorld(model, samplePos(tree.heart, s));
  const pts = rp.samples.map(place);
  const total = Math.max(1, v.pathMm[v.pathMm.length - 1] - v.pathMm[0]);
  // the lesion's window: where its narrowing lies (generous; the MLD decides)
  const lo = site.lo ?? site.position - 40 / total,
    hi = site.hi ?? site.position + 40 / total;
  const D = Math.max(0, Math.min(1, opts.dilation ?? 0));
  let best: ViewStenosis | null = null;
  for (let i = 0; i < pts.length; i++) {
    const t = rp.param[i];
    if (t < lo || t > hi) continue;
    const T = V3.sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]);
    let r = rp.radii[i];
    if (sh.spasmF && sh.other && D > 0) r = Math.min(sh.other[i], Math.max(r, sh.ref[i] * (1 - sh.spasmF[i] * (1 - D))));
    let w = r;
    let sinA = Math.sqrt(Math.max(0, 1 - (Math.abs(dot3(T, R)) / ((len3(T) || 1) * (len3(R) || 1))) ** 2));
    if (sh.minor && sh.major && sh.major[i] > sh.minor[i] + 1e-9) {
      const dir = minorAxisDir(place, rp.samples[i], pts[i], T, sh.orient?.[i] ?? 0);
      const e = ellipseProjection(sh.major[i], sh.minor[i], dir, T, R);
      w = e.halfWidth;
      sinA = e.sinA;
    }
    const ref = sh.ref[i];
    const pct = 100 * (1 - w / ref);
    if (!best || pct > best.pctDS) best = { pctDS: pct, mldMm: 2 * w, refMm: 2 * ref, param: t, sinA };
  }
  return best;
}

/** The true %DS of a lesion in each of several views (for QCA and the debrief only). */
export function stenosisByView(tree: CoronaryTree, model: AnatomyModel, lesionIndex: number, views: CArm[], opts: { dilation?: number } = {}): (ViewStenosis | null)[] {
  return views.map((c) => projectedStenosis(tree, model, lesionIndex, c, opts));
}

/**
 * The lumen radius of a spasm lesion's samples with the engine's epicardial dilation D (0..1): the
 * spasm narrowing scales by (1 - D) and the other lesions keep theirs. Returns `radii` unchanged
 * when the vessel has no spasm lesion or D is 0.
 */
export function relaxSpasm(radii: number[], sh: LumenShape | undefined, D: number): number[] {
  if (!sh?.spasmF || !sh.other || !(D > 0)) return radii;
  const k = 1 - Math.min(1, D);
  return radii.map((r, i) => (sh.spasmF![i] > 0 ? Math.min(sh.other![i], Math.max(r, sh.ref[i] * (1 - sh.spasmF![i] * k))) : r));
}

/**
 * Catheter-tip spasm in the image (diag-spasm-states): the artery narrows smoothly around the catheter
 * tip, centred `atMm` along the flow path from the ostium, with the engine's spasm `severity` (0..1,
 * responses.ts) as the share of the diameter lost at the centre times MP_TIP_SPASM_RENDER.gain, tapering
 * to nothing over halfLengthMm on either side (a raised cosine: a smooth, concentric narrowing, not a
 * plaque). MODEL PARAMETERS.
 */
export const MP_TIP_SPASM_RENDER = {
  /** diameter share lost at the centre per unit of the engine's spasm */
  gain: 1.4,
  /** the narrowest the spasm draws the lumen, as a share of its radius */
  minShare: 0.2,
  /** half-length of the narrowed segment, mm */
  halfLengthMm: 4,
};

/**
 * The radii of a vessel's samples with a catheter-tip spasm centred `atMm` along the flow path
 * (`pathMm`, mm from the ostium). Returns `radii` unchanged when the severity is 0 or no sample lies in
 * the narrowed segment.
 */
export function tipSpasmRadii(radii: number[], pathMm: number[], atMm: number, severity: number): number[] {
  const M = MP_TIP_SPASM_RENDER;
  const sev = Math.max(0, Math.min(1, Number.isFinite(severity) ? severity : 0));
  if (!(sev > 0) || !radii.length) return radii;
  const at = Math.max(0, Number.isFinite(atMm) ? atMm : 0);
  const peak = Math.min(1 - M.minShare, M.gain * sev);
  let out: number[] | null = null;
  for (let i = 0; i < radii.length; i++) {
    const d = Math.abs((pathMm[i] ?? 0) - at);
    if (d >= M.halfLengthMm) continue;
    const w = 0.5 * (1 + Math.cos((Math.PI * d) / M.halfLengthMm));
    out ??= radii.slice();
    out[i] = radii[i] * (1 - peak * w);
  }
  return out ?? radii;
}

// ---------------------------------------------------------------------------
// queries
// ---------------------------------------------------------------------------

/** Total length of a named vessel (rest geometry), mm. */
export function vesselLength(t: CoronaryTree, name: string): number {
  const v = t.vessels.find((x) => x.name === name);
  if (!v) return 0;
  return v.pathMm[v.pathMm.length - 1] - v.pathMm[0];
}

/** World positions of a vessel's samples for the given motion. */
export function vesselPoints(t: CoronaryTree, v: TreeVessel, m?: Motion): Vec3[] {
  return v.samples.map((s) => samplePos(t.heart, s, m));
}

/**
 * Radii for this frame: the myocardial bridge narrows in systole (radius × (1 - depth × compression)).
 * Returns the stored array when nothing changes.
 */
export function vesselRadiiAt(v: TreeVessel, m?: Motion, radii: number[] = v.radii, baseIndex?: number[]): number[] {
  if (!v.bridge || !m) return radii;
  const k = m.bridge ?? bridgeCompression(m);
  if (k <= 0) return radii;
  const { i0, i1, depth } = v.bridge;
  return radii.map((r, j) => {
    const i = baseIndex ? baseIndex[j] : j;
    if (i < i0 - 2 || i > i1 + 2) return r;
    // smooth shoulders over two samples at each end
    const e = Math.min(1, Math.max(0, Math.min((i - (i0 - 2)) / 3, (i1 + 2 - i) / 3)));
    return r * (1 - depth * k * e * e * (3 - 2 * e));
  });
}

/** What to draw for a vessel this frame: the dense path when there is one, with bridge compression applied (`storedRadii` before it, `shape` the lumen beyond its radius). */
export function renderPath(v: TreeVessel, m?: Motion): { samples: Sample[]; radii: number[]; pathMm: number[]; param: number[]; baseIndex?: number[]; shape?: LumenShape; storedRadii: number[] } {
  if (v.fine) return { samples: v.fine.samples, radii: vesselRadiiAt(v, m, v.fine.radii, v.fine.baseIndex), pathMm: v.fine.pathMm, param: v.fine.param, baseIndex: v.fine.baseIndex, shape: v.fine.shape, storedRadii: v.fine.radii };
  return { samples: v.samples, radii: vesselRadiiAt(v, m), pathMm: v.pathMm, param: v.param, shape: v.shape, storedRadii: v.radii };
}

/** SYNTAX segment at a position (0..1) along a named vessel, or null. */
export function segmentAt(t: CoronaryTree, name: string, param: number): string | null {
  const v = t.vessels.find((x) => x.name === name);
  if (!v || !v.segment) return null;
  let best = 0;
  for (let i = 0; i < v.param.length; i++) if (Math.abs(v.param[i] - param) < Math.abs(v.param[best] - param)) best = i;
  return v.segment[best] ?? null;
}

/** Vessels (with sample index ranges) that make up a SYNTAX segment. */
export function segmentSpans(t: CoronaryTree, label: string): { vessel: string; from: number; to: number }[] {
  const out: { vessel: string; from: number; to: number }[] = [];
  for (const v of t.vessels) {
    if (!v.segment) continue;
    let start = -1;
    for (let i = 0; i <= v.segment.length; i++) {
      const on = i < v.segment.length && v.segment[i] === label;
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        out.push({ vessel: v.name, from: start, to: i - 1 });
        start = -1;
      }
    }
  }
  return out;
}
