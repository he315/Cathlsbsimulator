// ---------------------------------------------------------------------------
// The access route in three dimensions, for wire navigation on the X-ray
// renderer.
//
// The centre line is the device-physics access lumen (src/physics/lumen.ts,
// S7): wrist → radial → brachial → axillary/subclavian → innominate →
// ascending aorta, or groin → femoral/iliac → abdominal and thoracic aorta →
// arch → ascending aorta, in the aortic frame (mm). Wire position s is
// measured from the sheath tip. The route carries:
//   - segments for the wire model (procedure.ts), named and bounded by the
//     lumen's anatomical regions;
//   - a radial loop when the case has that variant (a 360° loop at the
//     radial-brachial junction);
//   - the wrong turn at the junction with the aorta: the descending aorta
//     for an arm route, the left subclavian artery for the femoral route;
//   - table stations for panning along the limb;
//   - limb anatomy the thorax model does not draw (arm soft tissue, radius,
//     ulna, humerus; pelvis soft tissue, femoral head and neck, pubic ramus),
//     as additive primitives for the renderer's `extras`.
// The femoral route is the right groin unless `side` is 'left' (a second
// groin in the same case, access-multi-site): the left route is the right
// one's limb (sheath, external and common iliac samples) reflected across the
// sagittal plane through the aortic bifurcation, so every length along it is
// the same and the aorta beyond it is shared.
//
// The groin on fluoroscopy (access-femoral-puncture): siteToAortic() maps the
// ultrasound site frame (x along the limb from the inguinal crease, y lateral,
// z depth) into the aortic frame, anchored so that the route's start (the tip
// of a 10 cm sheath) lies at site x MP_LIMB.sheathTipSiteX on the artery's
// centre line. limbExtras() given the site places the femoral head from the
// site landmarks, and the arteriotomy, the sheath, the micropuncture needle
// and wire, the femoral angiogram and the skin marker are drawn at their own
// site x, so what the image shows against the femoral head is where the
// needle actually went in.
//
// Upsizing and the femoral angiogram (access-femoral-upsizing-angiogram): the
// dilator and the sheath are drawn from the skin along the needle track at
// their own length (10, 25 or 45 cm sheaths), the 0.035 inch wire up the
// artery and along the route to the abdominal aorta, and anterior-wall calcium
// as a faint radiopaque line. The angiogram fills the inferior epigastric
// artery above the entry, so the entry is read against its lowest point, and
// the profunda is drawn behind the superficial femoral artery for its first
// centimetres: in AP the two overlap, and the ipsilateral oblique (RAO for the
// right groin, LAO for the left; Brilakis 4.2, step 15, 'This ipsilateral
// oblique opens out the bifurcation') separates them. femoralBifurcationSpread
// measures that separation in any C-arm view.
//
// The forearm (access-radial-sequence): the arm route's first station is the
// forearm, centred along the radial artery so that a loop at the radial-
// brachial junction is in the field. The forearm angiogram (forearmAngioTubes)
// fills the artery from a catheter just below the wire tip, narrowed where the
// artery is in spasm and following a loop where there is one, and a
// perforation shows as extravasation: contrast leaving the artery as a small
// blush of short, irregular tracks around the hole (extravasationTubes; a
// drawing, MP_EXTRAVASATION). A puff through the sheath shows the same blush.
//
// The bladder (access-cx-bleeding-retroperitoneal): once contrast has been
// given it is excreted into the bladder, which then shows on a screen of the
// pelvis behind the symphysis (bladderTubes: one ribbon tube with a flattened
// cross-section, sampled densely behind a hairline guide, so it reads as a smooth
// rounded opacity). A retroperitoneal
// haematoma pushes it towards the other side and flattens the wall it presses
// on: the dented bladder (Brilakis 29.1.2.1 and 28.1, in the lesson
// cm-access-complications-femoral-bleeding). The pelvis station of a femoral
// route is framed between the common iliac artery and the bladder
// (pelvisFrameCentre), so both lie in the field. The sizes are a drawing
// (MP_BLADDER), not anatomy measured from patients.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyCase, CArm, Vec3 } from "../../types";
import type { AnatomyModel } from "../anatomy";
import { toWorld } from "../anatomy";
import { LumenSet, RADIAL_LOOP, Region, radialLoopPoints, type Tube } from "../../physics/lumen";
import { MU, type BonePrim, type TubeSpec } from "../../render/xray/thorax";
import { tubeAt, type AccessSite, type UsTube } from "./site";
import { courseTurnMm, needlePoint, type MicroWireCourse, type NeedleState } from "./ultrasound";
import { cameraBasis, projectPoint } from "../projection";

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const addV = (a: Vec3, b: Vec3): Vec3 => v(a.x + b.x, a.y + b.y, a.z + b.z);
const subV = (a: Vec3, b: Vec3): Vec3 => v(a.x - b.x, a.y - b.y, a.z - b.z);
const sc = (a: Vec3, k: number): Vec3 => v(a.x * k, a.y * k, a.z * k);
const dotV = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const crossV = (a: Vec3, b: Vec3): Vec3 => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const lenV = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const nrm = (a: Vec3): Vec3 => {
  const l = lenV(a) || 1;
  return sc(a, 1 / l);
};

export type SegmentId =
  | "radial"
  | "loop"
  | "brachial"
  | "subclavian"
  | "innom"
  | "femoral"
  | "iliac"
  | "abd"
  | "desc"
  | "arch"
  | "asc"
  | "root"
  // the crossover route over the aortic bifurcation (access-cx-endovascular-control)
  | "aortic-bif"
  | "cfa"
  | "sfa";

export interface Polyline {
  pts: Vec3[];
  cum: number[];
  /** lumen radius at each point (mm) */
  r: number[];
  region: number[];
}

export interface RouteSegmentGeom {
  id: SegmentId;
  name: string;
  start: number;
  end: number;
}

export interface Station {
  id: string;
  label: string;
  /** centre of the field (aortic frame) */
  c: Vec3;
}

export interface Route3D {
  access: AccessRoute;
  /** the limb the route starts in: a radial route's arm, or the groin of a femoral route */
  side: "right" | "left";
  path: Polyline;
  segments: RouteSegmentGeom[];
  /** s at which the wire enters the ascending aorta */
  aortaStart: number;
  /** the junction with the aorta and the wrong turn from it */
  wrong: { atS: number; label: string; path: Polyline } | null;
  stations: Station[];
  /** lateral unit vector of the access limb (away from the midline) */
  lateral: Vec3;
}

function polyFrom(pts: Vec3[], r: number[], region: number[]): Polyline {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + lenV(subV(pts[i], pts[i - 1])));
  return { pts, cum, r, region };
}

function tubePts(t: Tube, from: number, to: number, step = 1): { pts: Vec3[]; r: number[]; region: number[] } {
  const pts: Vec3[] = [],
    r: number[] = [],
    region: number[] = [];
  const dir = to >= from ? 1 : -1;
  for (let i = from; dir > 0 ? i <= to : i >= to; i += dir * step) {
    pts.push(v(t.pts[3 * i], t.pts[3 * i + 1], t.pts[3 * i + 2]));
    r.push(t.rad[i]);
    region.push(t.region[i]);
  }
  return { pts, r, region };
}

/** Point and unit tangent at arclength s (clamped). */
export function pointAt(p: Polyline, s: number): { p: Vec3; t: Vec3; i: number } {
  const n = p.pts.length;
  if (s <= 0) return { p: p.pts[0], t: nrm(subV(p.pts[1], p.pts[0])), i: 0 };
  if (s >= p.cum[n - 1]) return { p: p.pts[n - 1], t: nrm(subV(p.pts[n - 1], p.pts[n - 2])), i: n - 2 };
  let lo = 0,
    hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cum[m] <= s) lo = m;
    else hi = m;
  }
  const a = p.pts[lo],
    b = p.pts[lo + 1];
  const u = (s - p.cum[lo]) / Math.max(1e-9, p.cum[lo + 1] - p.cum[lo]);
  return { p: addV(a, sc(subV(b, a), u)), t: nrm(subV(b, a)), i: lo };
}

/** The polyline from s0 to s1 (inclusive ends), sampled at its own vertices. */
export function slice(p: Polyline, s0: number, s1: number): Vec3[] {
  const a = Math.max(0, Math.min(s0, s1)),
    b = Math.min(p.cum[p.cum.length - 1], Math.max(s0, s1));
  if (b - a < 0.01) return [];
  const out: Vec3[] = [pointAt(p, a).p];
  for (let i = 0; i < p.pts.length; i++) if (p.cum[i] > a && p.cum[i] < b) out.push(p.pts[i]);
  out.push(pointAt(p, b).p);
  return out;
}

const SEG_NAME: Record<SegmentId, string> = {
  radial: "Radial artery",
  loop: "Radial loop",
  brachial: "Brachial artery",
  subclavian: "Axillary and subclavian artery",
  innom: "Brachiocephalic artery",
  femoral: "External iliac artery",
  iliac: "Common iliac artery",
  abd: "Abdominal aorta",
  desc: "Descending thoracic aorta",
  arch: "Aortic arch",
  asc: "Ascending aorta",
  root: "Aortic root",
  "aortic-bif": "Aortic bifurcation",
  cfa: "Common femoral artery",
  sfa: "Superficial femoral artery",
};

function regionSeg(region: number, femoral: boolean): SegmentId {
  switch (region) {
    case Region.Radial:
      return "radial";
    case Region.Brachial:
      return "brachial";
    case Region.Subclavian:
      return "subclavian";
    case Region.Innominate:
      return "innom";
    case Region.Femoral:
      return "femoral";
    case Region.Iliac:
      return "iliac";
    case Region.AbdominalAorta:
      return "abd";
    case Region.DescendingAorta:
      return "desc";
    case Region.Arch:
      return "arch";
    case Region.Ascending:
      return "asc";
    case Region.Root:
      return "root";
    default:
      return femoral ? "femoral" : "radial";
  }
}

/** MODEL PARAMETERS of the route geometry. */
export const MP_ROUTE = {
  /** radial loop radius (mm): the physics lumen's loop (src/physics/lumen.ts RADIAL_LOOP), so the two share one circle */
  loopR: RADIAL_LOOP.loopR,
  /** how far the wire may go beyond the sinotubular junction into the root (mm) */
  rootMm: 14,
  /** length of the wrong turn drawn (mm) */
  wrongMm: 220,
  /** the forearm station's centre along the radial artery, as a share of its length from the sheath tip */
  forearmCentreShare: 0.7,
};

/** Lumen regions of the femoral limb: what a left femoral route reflects across the midline. */
const FEMORAL_LIMB: readonly number[] = [Region.Sheath, Region.Femoral, Region.Iliac];

/**
 * Reflect the limb samples of a right femoral route to the left groin, in place: x' = 2 x0 - x, with x0
 * the x of the first aortic sample (the plane through the bifurcation). The reflection keeps every
 * distance between limb samples and every distance to the first aortic sample, so segment lengths are
 * unchanged.
 */
function mirrorFemoralLimb(pts: Vec3[], region: number[]): void {
  const j = region.findIndex((r) => !FEMORAL_LIMB.includes(r));
  if (j <= 0) return;
  const x0 = pts[j].x;
  for (let i = 0; i < j; i++) pts[i] = v(2 * x0 - pts[i].x, pts[i].y, pts[i].z);
}

/**
 * Build the route for a case and patient model. `resp` (0..1) straightens the subclavian; the segment
 * bounds are taken at the given resp. `side` chooses the groin of a femoral route (default the right;
 * an arm route's side comes from its access).
 */
export function buildRoute3D(access: AccessRoute, caseData: Pick<AnatomyCase, "variants">, model: AnatomyModel, resp = 0, side?: "right" | "left"): Route3D {
  const has = (x: string) => caseData.variants.includes(x as never);
  const femoral = access === "femoral";
  const limbSide: "right" | "left" = femoral ? (side ?? "right") : access === "radial-left" ? "left" : "right";
  const lumen = new LumenSet({
    route: access,
    model,
    resp,
    tortuousIliac: has("tortuous-iliac"),
    tortuousSubclavian: has("tortuous-subclavian"),
    archBranches: true,
    // the route inserts its own (planar) loop below, from the same circle (radialLoopPoints)
    radialLoop: false,
  });
  const t0 = lumen.tubes[0];
  // the wire starts at the sheath tip: the last sheath sample
  let i0 = 0;
  for (let i = 0; i < t0.n; i++) if (t0.region[i] === Region.Sheath) i0 = i;
  const main = tubePts(t0, i0, t0.n - 1);
  if (femoral && limbSide === "left") mirrorFemoralLimb(main.pts, main.region);
  // into the root beyond the sinotubular junction
  const n = main.pts.length;
  const endDir = nrm(subV(main.pts[n - 1], main.pts[n - 3]));
  for (let k = 1; k <= 7; k++) {
    main.pts.push(addV(main.pts[n - 1], sc(endDir, (MP_ROUTE.rootMm * k) / 7)));
    main.r.push(main.r[n - 1]);
    main.region.push(Region.Root);
  }
  // the radial loop: a full turn inserted at the radial-brachial junction
  if (!femoral && has("radial-loop")) {
    const j = main.region.findIndex((r) => r === Region.Brachial);
    if (j > 2) {
      const c0 = main.pts[j];
      const tan = nrm(subV(main.pts[j + 1], main.pts[j - 1]));
      const side = nrm(crossV(tan, v(0, 0, 1)));
      // a circle tangent to the path at c0, advancing slightly so the loop does not close on itself (the
      // physics lumen's loop is the same circle, lifted out of its plane: src/physics/lumen.ts)
      const loop: Vec3[] = radialLoopPoints(c0, tan, side, undefined, { loopR: MP_ROUTE.loopR });
      main.pts.splice(j, 0, ...loop);
      main.r.splice(j, 0, ...loop.map(() => RADIAL_LOOP.drawLumenR));
      main.region.splice(j, 0, ...loop.map(() => -10)); // marker region for the loop
    }
  }
  const path = polyFrom(main.pts, main.r, main.region);
  // segments from runs of regions
  const segments: RouteSegmentGeom[] = [];
  for (let i = 0; i < path.pts.length; i++) {
    const id: SegmentId = path.region[i] === -10 ? "loop" : regionSeg(path.region[i], femoral);
    const last = segments[segments.length - 1];
    if (last && last.id === id) last.end = path.cum[i];
    else {
      if (last) last.end = path.cum[i];
      segments.push({ id, name: SEG_NAME[id], start: path.cum[i], end: path.cum[i] });
    }
  }
  // merge tiny runs (Catmull-Rom region flicker) into their neighbour
  const merged: RouteSegmentGeom[] = [];
  for (const sg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && (sg.end - sg.start < 4 || prev.id === sg.id) && sg.id !== "loop") prev.end = sg.end;
    else merged.push({ ...sg });
  }
  const asc = merged.find((s) => s.id === "asc");
  const aortaStart = asc ? asc.start : path.cum[path.cum.length - 1] - 30;

  // the wrong turn at the junction with the aorta
  let wrong: Route3D["wrong"] = null;
  if (!femoral) {
    const aorta = lumen.tubes.find((t) => t.name === "aorta");
    if (aorta) {
      const jp = pointAt(path, aortaStart).p;
      const k = nearestIndex(aorta, jp);
      // from the junction backwards along the aortic course: arch, then descending aorta
      const back = tubePts(aorta, k, Math.max(0, k - Math.round(MP_ROUTE.wrongMm / 4)), 1);
      const head = { pts: slice(path, 0, aortaStart), r: [] as number[], region: [] as number[] };
      const pts = [...head.pts, ...back.pts.slice(1)];
      wrong = { atS: aortaStart, label: "descending aorta", path: polyFrom(pts, pts.map(() => 10), pts.map(() => Region.DescendingAorta)) };
    }
  } else {
    const arm = lumen.tubes.find((t) => t.name === "left arm");
    const arch = merged.find((s) => s.id === "arch");
    if (arm && arch) {
      const jS = (arch.start + arch.end) / 2;
      const jp = pointAt(path, jS).p;
      const k = nearestIndex(arm, jp);
      const back = tubePts(arm, k, Math.max(0, k - Math.round(MP_ROUTE.wrongMm / 4)), 1);
      const pts = [...slice(path, 0, jS), ...back.pts.slice(1)];
      wrong = { atS: jS, label: "left subclavian artery", path: polyFrom(pts, pts.map(() => 3.5), pts.map(() => Region.Subclavian)) };
    }
  }

  // stations along the limb and chest
  const at = (s: number) => pointAt(path, s).p;
  const segMid = (id: SegmentId) => {
    const sg = merged.find((x) => x.id === id);
    return sg ? at((sg.start + sg.end) / 2) : null;
  };
  const stations: Station[] = [];
  const pushSt = (id: string, label: string, c: Vec3 | null) => c && stations.push({ id, label, c });
  if (femoral) {
    pushSt("groin", "Groin", at(0));
    pushSt("pelvis", "Pelvis", segMid("iliac"));
    pushSt("abdomen", "Abdomen", segMid("abd"));
    pushSt("thorax", "Descending aorta", segMid("desc"));
    pushSt("chest", "Arch and root", at(aortaStart));
  } else {
    // the forearm, centred along the radial artery so that a loop at the radial-brachial junction is in the field
    const radialEnd = merged.find((x) => x.id === "radial")?.end ?? 120;
    pushSt("forearm", "Forearm", at(Math.max(40, radialEnd * MP_ROUTE.forearmCentreShare)));
    const br = merged.find((x) => x.id === "brachial");
    if (br) {
      pushSt("elbow", "Elbow", at(br.start + 10));
      pushSt("arm", "Upper arm", at((br.start + br.end) / 2 + 40));
    }
    pushSt("shoulder", "Shoulder", segMid("subclavian"));
    pushSt("chest", "Arch and root", at(aortaStart));
  }
  // the patient's left is +x in the aortic frame
  const lat = limbSide === "left" ? 1 : -1;
  return { access, side: limbSide, path, segments: merged, aortaStart, wrong, stations, lateral: v(lat, 0, 0) };
}

function nearestIndex(t: Tube, p: Vec3): number {
  let best = 0,
    bd = Infinity;
  for (let i = 0; i < t.n; i++) {
    const d = (t.pts[3 * i] - p.x) ** 2 + (t.pts[3 * i + 1] - p.y) ** 2 + (t.pts[3 * i + 2] - p.z) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

/** The segment at s. */
export function segmentAtS(r: Route3D, s: number): RouteSegmentGeom {
  for (const sg of r.segments) if (s >= sg.start && s < sg.end) return sg;
  return r.segments[r.segments.length - 1];
}

/** The route arclength (mm from the sheath tip) of the centre-line point nearest p (aortic frame). */
export function nearestRouteS(r: Pick<Route3D, "path">, p: Vec3): number {
  const P = r.path;
  let best = Infinity;
  let bestS = 0;
  for (let i = 0; i < P.pts.length - 1; i++) {
    const a = P.pts[i], b = P.pts[i + 1];
    const d = subV(b, a);
    const ll = dotV(d, d);
    const u = ll > 1e-12 ? Math.max(0, Math.min(1, dotV(subV(p, a), d) / ll)) : 0;
    const q = addV(a, sc(d, u));
    const e = lenV(subV(p, q));
    if (e < best) {
      best = e;
      bestS = P.cum[i] + (P.cum[i + 1] - P.cum[i]) * u;
    }
  }
  return bestS;
}

/**
 * MODEL PARAMETERS (drawing, diag-route-wire-led-radial): a radial loop pulled straight by balloon-assisted
 * tracking leaves the redundant artery folded along the straightened stretch, which a puff shows as narrow
 * waists (pseudolesions, Brilakis as the module text gives it: "Straightening a loop can create
 * pseudolesions on the angiogram, which are artefacts of the straightened artery and not disease",
 * 06-to-the-root.ts:743). `waists` waists of `depth` (fraction of the lumen, at full straightening), each
 * `widthMm` long, spread over the stretch from `beforeMm` before the loop's place to `afterMm` beyond it.
 */
export const MP_PSEUDOLESION = { waists: 3, depth: 0.5, widthMm: 2.5, beforeMm: 6, afterMm: 30 };

/**
 * The route with its radial loop straightened by f (0 the loop as drawn … 1 straight): each loop sample
 * moves towards the artery's own course, as the physics lumen's loop does (src/physics/lumen.ts), and the
 * segments beyond move back by the length the loop loses. The route itself when there is no loop or f is 0.
 */
export function withStraightenedLoop(r: Route3D, f: number): Route3D {
  const k = Math.max(0, Math.min(1, f));
  const loop = r.segments.find((x) => x.id === "loop");
  if (!loop || k <= 0) return r;
  const P = r.path;
  const idx: number[] = [];
  for (let i = 0; i < P.pts.length; i++) if (P.region[i] === -10) idx.push(i);
  if (!idx.length) return r;
  const i0 = idx[0], i1 = idx[idx.length - 1];
  const before = P.pts[Math.max(0, i0 - 1)];
  const c0 = P.pts[Math.min(P.pts.length - 1, i1 + 1)];
  const n = idx.length + 1;
  const pts = P.pts.slice();
  for (let m = 0; m < idx.length; m++) {
    const q = (m + 1) / n;
    // the straight artery runs from the sample before the loop to c0
    const chord = addV(before, sc(subV(c0, before), q));
    const at = pts[idx[m]];
    pts[idx[m]] = addV(at, sc(subV(chord, at), k));
  }
  const path = polyFrom(pts, P.r.slice(), P.region.slice());
  const lost = P.cum[P.cum.length - 1] - path.cum[path.cum.length - 1];
  const loopStart = path.cum[i0];
  const loopEnd = path.cum[Math.min(path.cum.length - 1, i1 + 1)];
  const segments = r.segments.map((sg) => {
    if (sg.id === "loop") return { ...sg, start: loopStart, end: loopEnd };
    if (sg.start >= loop.end - 1e-6) return { ...sg, start: sg.start - lost, end: sg.end - lost };
    if (sg.end >= loop.start - 1e-6 && sg.end <= loop.end + 1e-6) return { ...sg, end: loopStart };
    return sg;
  });
  return { ...r, path, segments, aortaStart: r.aortaStart - lost, wrong: r.wrong ? { ...r.wrong, atS: r.wrong.atS - lost } : null };
}

/** The pseudolesions' narrowing factor (1 none) at s on a route whose loop is straightened by f. */
export function pseudolesionFactor(r: Route3D, s: number, f: number): number {
  const loop = r.segments.find((x) => x.id === "loop");
  if (!loop || f <= 0) return 1;
  const M = MP_PSEUDOLESION;
  const a = loop.start - M.beforeMm;
  const b = loop.end + M.afterMm;
  if (s < a || s > b) return 1;
  let out = 1;
  for (let w = 0; w < M.waists; w++) {
    const c = a + ((w + 0.5) / M.waists) * (b - a);
    const d = (s - c) / M.widthMm;
    out = Math.min(out, 1 - M.depth * Math.min(1, f) * Math.exp(-d * d));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Limb anatomy for the renderer (aortic frame in, world out)
// ---------------------------------------------------------------------------

function axesAlong(dir: Vec3): [Vec3, Vec3, Vec3] {
  const ay = nrm(dir);
  const ref = Math.abs(ay.z) < 0.9 ? v(0, 0, 1) : v(1, 0, 0);
  const ax = nrm(crossV(ay, ref));
  const az = nrm(crossV(ax, ay));
  return [ax, ay, az];
}

function cylinder(model: AnatomyModel, a: Vec3, b: Vec3, rx: number, rz: number, mu: number): BonePrim {
  const wa = toWorld(model, a),
    wb = toWorld(model, b);
  const d = subV(wb, wa);
  return { type: 1, c: sc(addV(wa, wb), 0.5), ax: axesAlong(d), half: [rx, lenV(d) / 2, rz], mu };
}

function sphere(model: AnatomyModel, c: Vec3, r: number, mu: number): BonePrim {
  return { type: 0, c: toWorld(model, c), ax: [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)], half: [r, r, r], mu };
}

/** A long bone: cortical shell over a marrow cavity. */
function longBone(model: AnatomyModel, a: Vec3, b: Vec3, r: number, shell: number): BonePrim[] {
  return [cylinder(model, a, b, r, r, MU.cortical * 1.4), cylinder(model, a, b, r - shell, r - shell, -MU.cortical * 1.4 + MU.cancellous * 0.3)];
}

/** MODEL PARAMETERS of the limb anatomy drawn on fluoroscopy (sizes in mm). */
export const MP_LIMB = {
  forearmR: [24, 36] as [number, number],
  upperArmR: 44,
  arteryDepthForearm: 7,
  radiusR: 7,
  ulnaR: 7.5,
  humerusR: 11,
  shell: 2.6,
  humeralHeadR: 24,
  thighR: [150, 110] as [number, number],
  femoralHeadR: 24,
  femoralNeckR: 15,
  femoralShaftR: 14,
  /** site x (mm from the inguinal crease) of the route's start, the tip of a 10 cm sheath after a typical puncture */
  sheathTipSiteX: 85,
};

/** MODEL PARAMETERS of the groin drawing on fluoroscopy (sizes of the drawing, not device dimensions). */
export const MP_GROIN_DRAW = {
  /** micropuncture needle drawing radius (mm) and its steel attenuation per mm (the scene builder's steel, 0.95 /mm) */
  needleR: 0.4,
  steelMu: 0.95,
  /** skin marker (a haemostat lying over the pulse): jaw length (mm), jaw spread (mm), drawing radius (mm) */
  markerLen: 70,
  markerSpread: 6,
  markerR: 1.2,
  /** sample spacing along the limb for drawn vessels and wires (mm) */
  stepMm: 2,
};

/** The limb axis below the route's start: the start tangent in the coronal plane, so lengths along the limb read true on an AP image. */
function limbAxis(r: Route3D): { p0: Vec3; t: Vec3 } {
  const p0 = r.path.pts[0];
  const t = subV(r.path.pts[1], p0);
  const tc = v(t.x, t.y, 0);
  return { p0, t: lenV(tc) > 1e-6 ? nrm(tc) : nrm(t) };
}

/** The point on the target artery's centre line at site x (aortic frame). */
function axisPoint(r: Route3D, x: number): Vec3 {
  const X0 = MP_LIMB.sheathTipSiteX;
  if (x >= X0) return pointAt(r.path, x - X0).p;
  const a = limbAxis(r);
  return addV(a.p0, sc(a.t, x - X0));
}

/**
 * A site-frame point (x along the limb, y lateral, z depth; site.ts) in the aortic frame. The target artery's
 * centre line is the route's centre line; offsets across and in depth from it map onto the limb's lateral
 * and anterior directions.
 */
export function siteToAortic(r: Route3D, site: Pick<AccessSite, "tubes" | "arteryId">, p: { x: number; y: number; z: number }): Vec3 {
  const art = site.tubes.find((t) => t.id === site.arteryId) ?? site.tubes[0];
  const c = tubeAt(art, p.x);
  return addV(addV(axisPoint(r, p.x), sc(r.lateral, p.y - c.y)), v(0, 0, c.z - p.z));
}

/** Centre of the femoral head in the aortic frame, from the site landmarks (the femoral-head bone of the site). */
export function femoralHeadCentre(r: Route3D, site: AccessSite): Vec3 | null {
  const head = site.bones.find((b) => b.kind === "femoral-head");
  return head ? siteToAortic(r, site, { x: head.xRef, y: head.yRef, z: head.zRef }) : null;
}

/**
 * Additive primitives for the parts of the route the thorax model does not include: the arm (soft tissue,
 * radius, ulna, humerus, humeral head) or the pelvis (soft tissue of the hip, femoral head, neck and shaft,
 * acetabular rim, pubic ramus). World coordinates.
 */
export function limbExtras(r: Route3D, model: AnatomyModel, site?: AccessSite): BonePrim[] {
  const out: BonePrim[] = [];
  const lat = r.lateral;
  const ant = v(0, 0, 1);
  if (r.access !== "femoral") {
    const br = r.segments.find((s) => s.id === "brachial");
    const sub = r.segments.find((s) => s.id === "subclavian");
    if (!br || !sub) return out;
    const W = pointAt(r.path, 0).p;
    const E = pointAt(r.path, br.start).p;
    const S = pointAt(r.path, sub.start + 10).p;
    const dF = MP_LIMB.forearmR;
    // forearm (palm up): the radial artery lies near the volar (anterior) skin
    const fa = addV(W, sc(ant, -(dF[0] - MP_LIMB.arteryDepthForearm)));
    const fb = addV(E, sc(ant, -(dF[1] - MP_LIMB.arteryDepthForearm - 6)));
    const fm = sc(addV(fa, fb), 0.5);
    out.push(cylinder(model, fa, fm, dF[0], dF[0] * 0.75, MU.soft));
    out.push(cylinder(model, fm, fb, dF[1], dF[1] * 0.8, MU.soft));
    out.push(...longBone(model, addV(W, addV(sc(lat, 6), sc(ant, -14))), addV(E, addV(sc(lat, 10), sc(ant, -20))), MP_LIMB.radiusR, MP_LIMB.shell));
    out.push(...longBone(model, addV(W, addV(sc(lat, -22), sc(ant, -16))), addV(E, addV(sc(lat, -14), sc(ant, -24))), MP_LIMB.ulnaR, MP_LIMB.shell));
    // upper arm and humerus
    const ua = addV(E, sc(ant, -24));
    const ub = addV(S, addV(sc(ant, -22), sc(lat, 10)));
    out.push(cylinder(model, ua, ub, MP_LIMB.upperArmR, MP_LIMB.upperArmR * 0.9, MU.soft));
    out.push(...longBone(model, addV(E, addV(sc(lat, 8), sc(ant, -22))), addV(S, addV(sc(lat, 18), sc(ant, -24))), MP_LIMB.humerusR, MP_LIMB.shell + 1));
    out.push(sphere(model, addV(S, addV(sc(lat, 24), sc(ant, -24))), MP_LIMB.humeralHeadR, MU.cancellous * 1.6));
    out.push(sphere(model, addV(S, addV(sc(lat, 24), sc(ant, -24))), MP_LIMB.humeralHeadR - 2.5, -MU.cancellous * 0.4));
    return out;
  }
  // femoral: the arteriotomy is near the sheath tip; the femoral head lies under the common femoral artery
  const A = pointAt(r.path, 0).p;
  const medial = sc(lat, -1);
  // with the site, the head lies where the site landmarks put it; without one, under the sheath tip as before
  const head = (site && site.kind === "femoral" && femoralHeadCentre(r, site)) || addV(A, v(0, -6, -42));
  // soft tissue of the hip and upper thigh below the thorax model's body (which ends near y = -360)
  out.push({ type: 1, c: toWorld(model, v(0, -470, -46)), ax: [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)], half: [MP_LIMB.thighR[0], 105, MP_LIMB.thighR[1]], mu: MU.soft });
  out.push(sphere(model, head, MP_LIMB.femoralHeadR, MU.cortical * 0.9));
  out.push(sphere(model, head, MP_LIMB.femoralHeadR - 2.2, -MU.cortical * 0.9 + MU.cancellous * 0.8));
  const neckEnd = addV(head, addV(sc(lat, 46), v(0, -30, 0)));
  out.push(...longBone(model, head, neckEnd, MP_LIMB.femoralNeckR, MP_LIMB.shell + 1));
  out.push(sphere(model, addV(neckEnd, sc(lat, 8)), 22, MU.cancellous * 1.4)); // greater trochanter
  out.push(...longBone(model, neckEnd, addV(neckEnd, v(-lat.x * 18, -190, 6)), MP_LIMB.femoralShaftR, MP_LIMB.shell + 2));
  // acetabular rim: a cortical cup over the head
  out.push(sphere(model, addV(head, v(0, 8, -2)), MP_LIMB.femoralHeadR + 4, MU.cortical * 0.55));
  out.push(sphere(model, addV(head, v(0, 8, -2)), MP_LIMB.femoralHeadR + 1.5, -MU.cortical * 0.55));
  // superior pubic ramus towards the symphysis
  const sym = v(0, head.y - 20, head.z + 30);
  out.push(...longBone(model, addV(head, addV(sc(medial, 22), v(0, 6, 8))), sym, 9, 2.4));
  return out;
}

/**
 * A contrast puff through the sheath side arm: iodine in the first `lengthMm` of the route, narrowed by spasm; an
 * unsealed perforation within it shows as extravasation (access-radial-sequence).
 */
export function puffTubes(
  r: Route3D,
  model: AnatomyModel,
  o: { strength: number; lengthMm: number; spasm: number; mgPerMl: number; perforationS?: number | null; loopStraighten?: number; dissectionS?: number | null },
): TubeSpec[] {
  const base = puffTubesOnly(r, model, o);
  const out = [...base];
  if (base.length && o.perforationS !== null && o.perforationS !== undefined && o.perforationS <= o.lengthMm + 5) out.push(...extravasationTubes(r, model, { atS: o.perforationS, strength: o.strength, mgPerMl: o.mgPerMl }));
  if (base.length && o.dissectionS !== null && o.dissectionS !== undefined && o.dissectionS <= o.lengthMm + 5) out.push(...dissectionTubes(r, model, { atS: o.dissectionS, strength: o.strength, mgPerMl: o.mgPerMl }));
  return out;
}

function puffTubesOnly(r0: Route3D, model: AnatomyModel, o: { strength: number; lengthMm: number; spasm: number; mgPerMl: number; loopStraighten?: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const f = o.loopStraighten ?? 0;
  const r = withStraightenedLoop(r0, f);
  const pts = slice(r.path, 0, o.lengthMm);
  if (pts.length < 2) return [];
  const radii = pts.map((p, i) => {
    const s = (i / Math.max(1, pts.length - 1)) * o.lengthMm;
    const rr = pointAt(r.path, s);
    const base = r.path.r[rr.i] ?? 1.2;
    const seg = segmentAtS(r, s);
    const narrowing = seg.id === "radial" || seg.id === "loop" ? 1 - 0.65 * o.spasm : 1;
    return Math.max(0.3, base * narrowing * pseudolesionFactor(r, s, f));
  });
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength;
  return [{ pts: pts.map((p) => toWorld(model, p)), r: radii, mu: [0, mu, 0] }];
}

/**
 * MODEL PARAMETERS (drawing, diag-route-wire-led-radial): a peripheral dissection on a puff: contrast held in the
 * wall beside the lumen as a thin stain `lenMm` long, `offsetMm` off the centre line, with `rMm` radius, at
 * `densityShare` of the lumen's iodine density.
 */
export const MP_DISSECTION_DRAW = { lenMm: 22, offsetMm: 1.6, rMm: 0.7, densityShare: 0.8 };

/** The stain of a dissection at route position atS: a thin track of contrast in the wall along the artery. */
export function dissectionTubes(r: Route3D, model: AnatomyModel, o: { atS: number; strength: number; mgPerMl: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const M = MP_DISSECTION_DRAW;
  const pts: Vec3[] = [];
  const N = 8;
  for (let i = 0; i <= N; i++) {
    const s = o.atS - M.lenMm / 2 + (M.lenMm * i) / N;
    const at = pointAt(r.path, s);
    const t = at.t;
    const across = nrm(crossV(t, Math.abs(t.z) < 0.9 ? v(0, 0, 1) : v(1, 0, 0)));
    // the flap spirals a little along the artery
    pts.push(addV(at.p, sc(across, M.offsetMm * (0.8 + 0.2 * Math.sin(i * 0.9)))));
  }
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength * M.densityShare;
  return [{ pts: pts.map((p) => toWorld(model, p)), r: pts.map(() => M.rMm), mu: [0, mu, 0] }];
}

/**
 * MODEL PARAMETERS (drawing, access-radial-sequence): the extravasation blush around a perforation. Each of `tracks`
 * short tracks leaves the artery at the hole, `lenMm` long (spread by ± `lenSpread`), its radius from `rMm`, fanned
 * within ± `fanRad` of square to the artery in the image plane and tilted out of it by at most `depthShare`; a
 * `puddleMm`-radius stain sits on the hole at `puddleShare` of the arterial density. The blush fades with the injection
 * like the contrast in the artery. The beam is taken along the patient's antero-posterior axis (z), the forearm views
 * being AP or within 30 degrees of it.
 */
export const MP_EXTRAVASATION = {
  tracks: 7,
  lenMm: 9,
  lenSpread: 0.45,
  rMm: 1.8,
  /** share of the arterial iodine density in the blush */
  densityShare: 1.0,
  /** the fan's half-angle either side of square to the artery (rad) */
  fanRad: 0.9,
  /** the largest out-of-plane (depth) component of a track's direction */
  depthShare: 0.3,
  /** the stain on the hole: radius (mm) and share of the arterial iodine density */
  puddleMm: 3,
  puddleShare: 0.5,
};

/** The extravasation blush at route position `atS`: short tracks leaving the artery in a fan (deterministic). */
export function extravasationTubes(r: Route3D, model: AnatomyModel, o: { atS: number; strength: number; mgPerMl: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const at = pointAt(r.path, o.atS);
  return extravasationAtPoint(model, at.p, at.t, o);
}

/**
 * The extravasation blush at a point `p` (aortic frame) of an artery running along the unit vector `t`: the same
 * drawing as extravasationTubes, for a hole that is not on a route's centre line (a branch of the external iliac
 * artery, the common femoral artery below a sheath; access-cx-endovascular-control).
 */
export function extravasationAtPoint(model: AnatomyModel, p: Vec3, t: Vec3, o: { strength: number; mgPerMl: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const M = MP_EXTRAVASATION;
  const at = { p };
  // a0: across the artery in the image plane (square to the beam, z); b0: across it along the beam (depth). The tracks
  // fan in the image plane so they spread on the image rather than stacking along the beam onto the artery.
  const beam = v(0, 0, 1);
  const a0 = nrm(crossV(t, Math.abs(t.z) < 0.9 ? beam : v(1, 0, 0)));
  const b0 = nrm(crossV(t, a0));
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength * M.densityShare;
  const out: TubeSpec[] = [];
  // the stain on the hole: a short fat tube centred on it
  out.push({
    pts: [addV(at.p, sc(t, -M.puddleMm * 0.5)), addV(at.p, sc(t, M.puddleMm * 0.5))].map((p) => toWorld(model, p)),
    r: [M.puddleMm, M.puddleMm],
    mu: [0, MU.iodinePerMg * o.mgPerMl * o.strength * M.puddleShare, 0],
  });
  for (let k = 0; k < M.tracks; k++) {
    const side = k % 2 === 0 ? 1 : -1;
    const phi = M.fanRad * (M.tracks > 1 ? (2 * k) / (M.tracks - 1) - 1 : 0) + 0.15 * Math.sin(k * 2.3);
    const len = M.lenMm * (1 + M.lenSpread * Math.sin(k * 1.7 + 0.5));
    const dir = nrm(addV(addV(sc(a0, side * Math.cos(phi)), sc(t, Math.sin(phi))), sc(b0, M.depthShare * Math.sin(k * 1.1))));
    const pts: Vec3[] = [];
    const N = 5;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      // a little curl so the tracks do not look ruled
      const bend = sc(t, 1.5 * Math.sin(f * Math.PI + k));
      pts.push(addV(at.p, addV(sc(dir, len * f), sc(bend, f))));
    }
    const rr = M.rMm * (0.7 + 0.3 * Math.cos(k * 1.3));
    out.push({ pts: pts.map((p) => toWorld(model, p)), r: pts.map((_, i) => rr * (1 - 0.5 * (i / N))), mu: [0, mu, 0] });
  }
  return out;
}

/**
 * The forearm angiogram (access-radial-sequence): contrast injected through a catheter whose tip is at route position
 * `fromS` fills the artery forward (`aheadMm`) and a little back (`backMm`), narrowed in the radial artery and the loop
 * by spasm; an unsealed perforation in the filled stretch shows as extravasation.
 */
export function forearmAngioTubes(
  r0: Route3D,
  model: AnatomyModel,
  o: { fromS: number; strength: number; mgPerMl: number; spasm: number; aheadMm: number; backMm: number; perforationS?: number | null; loopStraighten?: number; dissectionS?: number | null },
): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const f = o.loopStraighten ?? 0;
  const r = withStraightenedLoop(r0, f);
  const s0 = Math.max(0, o.fromS - o.backMm);
  const s1 = Math.min(r.path.cum[r.path.cum.length - 1], o.fromS + o.aheadMm);
  const pts = slice(r.path, s0, s1);
  if (pts.length < 2) return [];
  const radii = pts.map((_, i) => {
    const s = s0 + (i / Math.max(1, pts.length - 1)) * (s1 - s0);
    const rr = pointAt(r.path, s);
    const base = r.path.r[rr.i] ?? 1.2;
    const seg = segmentAtS(r, s);
    const narrowing = seg.id === "radial" || seg.id === "loop" ? 1 - 0.65 * o.spasm : 1;
    return Math.max(0.3, base * narrowing * pseudolesionFactor(r, s, f));
  });
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength;
  const out: TubeSpec[] = [{ pts: pts.map((p) => toWorld(model, p)), r: radii, mu: [0, mu, 0] }];
  if (o.perforationS !== null && o.perforationS !== undefined && o.perforationS >= s0 - 5 && o.perforationS <= s1 + 5) out.push(...extravasationTubes(r, model, { atS: o.perforationS, strength: o.strength, mgPerMl: o.mgPerMl }));
  if (o.dissectionS !== null && o.dissectionS !== undefined && o.dissectionS >= s0 - 5 && o.dissectionS <= s1 + 5) out.push(...dissectionTubes(r, model, { atS: o.dissectionS, strength: o.strength, mgPerMl: o.mgPerMl }));
  return out;
}

/** Root marker helper: the field centre for a station, as a pan from the coronary tree centre (world). */
export function panFor(c: Vec3, model: AnatomyModel, treeCentreWorld: Vec3): Vec3 {
  return subV(toWorld(model, c), treeCentreWorld);
}



/** Rotate v about the unit axis k by angle a (Rodrigues). */
function rotAbout(vv: Vec3, k: Vec3, a: number): Vec3 {
  const c = Math.cos(a),
    s = Math.sin(a);
  return addV(addV(sc(vv, c), sc(crossV(k, vv), s)), sc(k, dotV(k, vv) * (1 - c)));
}

/**
 * The wire in the aortic frame from the sheath tip to `s`, ending in its shaped tip: a J of 3 mm radius, or a
 * 45-degree angled tip for a hydrophilic wire. The tip's bend points along the lumen ahead when `heading` equals
 * `aimHeading`, and turns about the wire axis with the difference, so the operator sees where it points.
 */
export function wirePolyline(path: Polyline, s: number, heading: number, aimHeading: number, kind: "j" | "hydrophilic"): Vec3[] {
  const tipS = Math.max(4, s);
  const body = slice(path, 0, Math.max(0.5, tipS - 3));
  const at = pointAt(path, tipS - 3);
  const t = at.t;
  const ahead = pointAt(path, tipS + 12).p;
  let n = subV(ahead, at.p);
  n = subV(n, sc(t, dotV(n, t)));
  if (lenV(n) < 1e-3) n = Math.abs(t.z) < 0.9 ? crossV(t, v(0, 0, 1)) : crossV(t, v(1, 0, 0));
  n = rotAbout(nrm(n), t, heading - aimHeading);
  const tip: Vec3[] = [];
  if (kind === "j") {
    const R = 3;
    for (let k = 1; k <= 8; k++) {
      const a = (k / 8) * Math.PI * 0.95;
      tip.push(addV(at.p, addV(sc(t, R * Math.sin(a)), sc(n, R * (1 - Math.cos(a))))));
    }
  } else {
    const bend = nrm(addV(t, n));
    tip.push(addV(at.p, sc(t, 1.5)));
    tip.push(addV(addV(at.p, sc(t, 1.5)), sc(bend, 3)));
  }
  return [...body, ...tip];
}

/** The sheath in the aortic frame: from the skin to its tip (the start of the route), drawn back along the access. */
export function sheathPolyline(path: Polyline, lengthMm: number): Vec3[] {
  const p0 = path.pts[0];
  const t = nrm(subV(path.pts[1], path.pts[0]));
  return [addV(p0, sc(t, -lengthMm)), addV(p0, sc(t, -lengthMm * 0.5)), p0];
}

/**
 * A femoral angiogram through the sheath: the common femoral artery around the sheath, and its bifurcation into
 * the superficial and deep femoral arteries `bifBelowMm` below the arteriotomy (from the ultrasound site).
 */
export function femoralAngioTubes(r: Route3D, model: AnatomyModel, o: { strength: number; mgPerMl: number; bifBelowMm: number; sheathMm: number; site?: AccessSite; arteriotomyX?: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  if (o.site && o.site.kind === "femoral") return femoralAngioFromSite(r, model, o.site, o.arteriotomyX ?? null, o.strength, o.mgPerMl);
  const t = nrm(subV(r.path.pts[1], r.path.pts[0]));
  const tip = r.path.pts[0];
  const arteriotomy = addV(tip, sc(t, -o.sheathMm * 0.6));
  const up = slice(r.path, 0, 70);
  const cfa = [addV(arteriotomy, sc(t, -Math.max(5, o.bifBelowMm))), arteriotomy, ...up];
  const bif = cfa[0];
  const down = sc(t, -1);
  // the superficial femoral artery runs medially and the deep femoral laterally and back: medial is -lateral,
  // so a left groin (access-multi-site) mirrors the right one's offsets
  const m = -r.lateral.x || 1;
  const sfa = [bif, addV(bif, addV(sc(down, 60), v(6 * m, 0, 4))), addV(bif, addV(sc(down, 140), v(12 * m, 0, 8)))];
  const pfa = [bif, addV(bif, addV(sc(down, 30), v(-10 * m, 0, -14))), addV(bif, addV(sc(down, 90), v(-18 * m, 0, -26)))];
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength;
  const tube = (pts: Vec3[], rr: number): TubeSpec => ({ pts: pts.map((p) => toWorld(model, p)), r: pts.map(() => rr), mu: [0, mu, 0] });
  return [tube(cfa, 3.6), tube(sfa, 2.8), tube(pfa, 2.6)];
}


/**
 * A small branch of a groin (by its site tube id, 'iea' or 'lcia') filled from its origin out to site x `toX`, with
 * the main artery from the branch's origin up to the sheath tip (site x MP_LIMB.sheathTipSiteX) when the origin lies
 * below it, so a blush drawn at `toX` sits on a drawn branch joined to the column of a sheath puff
 * (access-cx-endovascular-control). The radii are the femoral angiogram's (the site tube's at 0.8, as
 * femoralAngioGeometry draws them).
 */
export function siteBranchTubes(r: Route3D, model: AnatomyModel, site: AccessSite, id: string, toX: number, o: { strength: number; mgPerMl: number }): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const b = site.branches.find((t) => t.id === id);
  if (!b) return [];
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength;
  const out: TubeSpec[] = [];
  const x1 = Math.max(b.xFrom, Math.min(b.xTo, toX));
  const bp = tubePath(r, site, b, b.xFrom, x1);
  if (bp.length >= 2 && x1 > b.xFrom) out.push({ pts: bp.map((q) => toWorld(model, q)), r: bp.map(() => b.r * 0.8), mu: [0, mu, 0] });
  const cfa = site.tubes.find((t) => t.id === site.arteryId);
  if (cfa && b.xFrom < MP_LIMB.sheathTipSiteX) {
    const ap = tubePath(r, site, cfa, b.xFrom, MP_LIMB.sheathTipSiteX);
    if (ap.length >= 2) out.push({ pts: ap.map((q) => toWorld(model, q)), r: ap.map(() => cfa.r * 0.8), mu: [0, mu, 0] });
  }
  return out;
}

/** Sample a site tube's centre line from x0 to x1 (site frame) into the aortic frame. */
function tubePath(r: Route3D, site: AccessSite, t: UsTube, x0: number, x1: number): Vec3[] {
  const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / MP_GROIN_DRAW.stepMm));
  const out: Vec3[] = [];
  for (let k = 0; k <= n; k++) {
    const x = x0 + ((x1 - x0) * k) / n;
    const c = tubeAt(t, x);
    out.push(siteToAortic(r, site, { x, y: c.y, z: c.z }));
  }
  return out;
}

/**
 * The femoral angiogram from the site anatomy: the CFA from its bifurcation up the route, the superficial and
 * deep femoral arteries from the site's own tubes, and the accessory profunda when the site has one, so the
 * bifurcation shows at its true height against the femoral head and the arteriotomy.
 */
function femoralAngioFromSite(r: Route3D, model: AnatomyModel, site: AccessSite, arteriotomyX: number | null, strength: number, mgPerMl: number): TubeSpec[] {
  const mu = MU.iodinePerMg * mgPerMl * strength;
  // only the attenuation changes while a puff fades: the world-frame centre lines are built once per anatomy
  return femoralAngioGeometry(r, model, site, arteriotomyX).map((g) => ({ pts: g.pts, r: g.r, mu: [0, mu, 0] }));
}

/** The femoral angiogram's world-frame centre lines and radii, cached on (route, model, site, arteriotomy). */
let angioGeomCache: { r: Route3D; model: AnatomyModel; site: AccessSite; ax: number | null; geo: { pts: Vec3[]; r: number[] }[] } | null = null;
function femoralAngioGeometry(r: Route3D, model: AnatomyModel, site: AccessSite, arteriotomyX: number | null): { pts: Vec3[]; r: number[] }[] {
  const c = angioGeomCache;
  if (c && c.r === r && c.model === model && c.site === site && c.ax === arteriotomyX) return c.geo;
  const lm = site.landmarks;
  const bif = lm.bifurcationX ?? 0;
  const cfa = site.tubes.find((t) => t.id === site.arteryId)!;
  const from = Math.min(bif, arteriotomyX ?? bif);
  const pts = [...tubePath(r, site, cfa, from, MP_LIMB.sheathTipSiteX), ...slice(r.path, 0, 70).slice(1)];
  const tube = (p: Vec3[], rr: number) => ({ pts: p.map((q) => toWorld(model, q)), r: p.map(() => rr) });
  const geo = [tube(pts, cfa.r * 0.8)];
  for (const b of femoralAngioBranches(r, site)) geo.push(tube(b.pts, b.r));
  // the inferior epigastric artery fills from the external iliac above the entry (Brilakis 4.2, step 15; pm-closure-plan)
  const iea = site.branches.find((b) => b.id === "iea");
  if (iea) geo.push(tube(tubePath(r, site, iea, iea.xFrom, iea.xTo), iea.r * 0.8));
  angioGeomCache = { r, model, site, ax: arteriotomyX, geo };
  return geo;
}

/**
 * MODEL PARAMETERS of the femoral angiogram's drawing (access-femoral-upsizing-angiogram), not population values:
 * the share of the ultrasound model's lateral offset between the profunda and the superficial femoral artery that
 * the angiogram keeps (the rest is taken to lie behind it, as the profunda runs posteriorly for its first
 * centimetres), the length of artery below the bifurcation drawn (mm), and the calcium line's drawing radius (mm)
 * and attenuation (a share of the renderer's thin cortical shell).
 */
export const MP_FEMORAL_ANGIO = {
  pfaLateralShare: 0.25,
  branchLenMm: 140,
  calciumR: 0.7,
  calciumMuShare: 0.6,
  /** the stretch below the bifurcation over which femoralBifurcationSpread judges whether the branches open out (mm) */
  spreadLenMm: 60,
};

/**
 * The superficial and deep femoral arteries (and an accessory profunda) as the angiogram draws them, in the
 * aortic frame, with their drawing radii. The profunda keeps its depth from the site model and only
 * MP_FEMORAL_ANGIO.pfaLateralShare of its lateral offset from the superficial femoral artery.
 */
export function femoralAngioBranches(r: Route3D, site: AccessSite): { id: string; pts: Vec3[]; r: number; xs: number[] }[] {
  const sfa = site.tubes.find((x) => x.id === "sfa");
  const out: { id: string; pts: Vec3[]; r: number; xs: number[] }[] = [];
  for (const id of ["sfa", "pfa", "accessory-profunda"]) {
    const t = site.tubes.find((x) => x.id === id);
    if (!t) continue;
    const x0 = t.xTo;
    const x1 = Math.max(t.xFrom, t.xTo - MP_FEMORAL_ANGIO.branchLenMm);
    const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / MP_GROIN_DRAW.stepMm));
    const pts: Vec3[] = [];
    const xs: number[] = [];
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const c = tubeAt(t, x);
      const y = id === "pfa" && sfa && x <= sfa.xTo ? tubeAt(sfa, x).y + MP_FEMORAL_ANGIO.pfaLateralShare * (c.y - tubeAt(sfa, x).y) : c.y;
      pts.push(siteToAortic(r, site, { x, y, z: c.z }));
      xs.push(x);
    }
    out.push({ id, pts, r: t.r * 0.8, xs });
  }
  return out;
}

/**
 * How far apart the superficial and deep femoral arteries project in a C-arm view (orthographic), over the first
 * MP_FEMORAL_ANGIO.spreadLenMm below the bifurcation: at each level the distance between their projected centre
 * lines less their two drawing radii (mm in the patient; negative where they overlap). `maxGapMm` above zero means
 * the bifurcation opens out somewhere in that stretch; `minGapMm` is the closest approach.
 */
export function femoralBifurcationSpread(r: Route3D, model: AnatomyModel, site: AccessSite, cArm: CArm, lengthMm = MP_FEMORAL_ANGIO.spreadLenMm): { maxGapMm: number; minGapMm: number } {
  const br = femoralAngioBranches(r, site);
  const s = br.find((b) => b.id === "sfa");
  const p = br.find((b) => b.id === "pfa");
  if (!s || !p) return { maxGapMm: NaN, minGapMm: NaN };
  const basis = cameraBasis(cArm);
  const bif = site.landmarks.bifurcationX ?? s.xs[0];
  let maxGap = -Infinity;
  let minGap = Infinity;
  for (let i = 1; i < s.pts.length && i < p.pts.length; i++) {
    if (bif - s.xs[i] > lengthMm) break;
    const a = projectPoint(toWorld(model, s.pts[i]), basis);
    const b = projectPoint(toWorld(model, p.pts[i]), basis);
    const gap = Math.hypot(a.x - b.x, a.y - b.y) - s.r - p.r;
    maxGap = Math.max(maxGap, gap);
    minGap = Math.min(minGap, gap);
  }
  return { maxGapMm: maxGap, minGapMm: minGap };
}

/** Anterior-wall calcium of the common femoral artery as faint radiopaque lines (seen with or without contrast). */
export function femoralCalciumTubes(r: Route3D, model: AnatomyModel, site: AccessSite): TubeSpec[] {
  if (site.kind !== "femoral" || !site.calcium.length) return [];
  const cfa = site.tubes.find((t) => t.id === site.arteryId)!;
  const mu = MU.corticalShell * MP_FEMORAL_ANGIO.calciumMuShare;
  return site.calcium.map((c) => {
    const pts: Vec3[] = [];
    const n = Math.max(1, Math.ceil((c.toX - c.fromX) / MP_GROIN_DRAW.stepMm));
    for (let k = 0; k <= n; k++) {
      const x = c.fromX + ((c.toX - c.fromX) * k) / n;
      const a = tubeAt(cfa, x);
      // on the anterior wall: the near wall lies a radius shallower than the centre line
      pts.push(siteToAortic(r, site, { x, y: a.y, z: a.z - cfa.r }));
    }
    return { pts: pts.map((q) => toWorld(model, q)), r: pts.map(() => MP_FEMORAL_ANGIO.calciumR), mu: [mu, 0, 0] as [number, number, number] };
  });
}

/**
 * The access wire after the exchange (the 0.035 inch wire): from the entry up the common femoral artery to the
 * route's start, then along the route, `beyondMm` past the entry in all. Aortic frame.
 */
export function accessWirePolyline(r: Route3D, site: AccessSite, entryX: number, beyondMm: number): Vec3[] {
  const cfa = site.tubes.find((t) => t.id === site.arteryId)!;
  if (beyondMm <= 0.5) return [];
  const toStart = Math.max(0, MP_LIMB.sheathTipSiteX - entryX);
  const up = tubePath(r, site, cfa, entryX, entryX + Math.min(beyondMm, toStart));
  if (beyondMm <= toStart) return up;
  return [...up, ...slice(r.path, 0, beyondMm - toStart).slice(1)];
}

/**
 * The femoral sheath at its site: from the skin along the needle track to the arteriotomy, then up the artery to
 * the route's start. With `lengthMm` (access-femoral-upsizing-angiogram) it is drawn at that length from the skin:
 * a 10 cm sheath ends near the route's start, a 25 or 45 cm one runs on along the route; a dilator is drawn the
 * same way at its own, shorter length.
 */
export function femoralSheathPolyline(r: Route3D, site: AccessSite, arteriotomyX: number, angleDeg = site.typicalAngleDeg, lengthMm?: number): Vec3[] {
  const cfa = site.tubes.find((t) => t.id === site.arteryId)!;
  const c = tubeAt(cfa, arteriotomyX);
  const th = (angleDeg * Math.PI) / 180;
  const run = c.z / Math.tan(th);
  const skin = siteToAortic(r, site, { x: arteriotomyX - run, y: c.y, z: 0 });
  if (lengthMm === undefined) return [skin, ...tubePath(r, site, cfa, arteriotomyX, Math.max(arteriotomyX + 1, MP_LIMB.sheathTipSiteX))];
  // the length left inside the artery after the track from the skin
  const inArtery = Math.max(1, lengthMm - Math.hypot(run, c.z));
  const toStart = Math.max(1, MP_LIMB.sheathTipSiteX - arteriotomyX);
  const up = tubePath(r, site, cfa, arteriotomyX, arteriotomyX + Math.min(inArtery, toStart));
  return inArtery <= toStart ? [skin, ...up] : [skin, ...up, ...slice(r.path, 0, inArtery - toStart).slice(1)];
}

/** The micropuncture needle in the aortic frame: from its skin entry to its tip. */
export function needlePolyline(r: Route3D, site: AccessSite, n: NeedleState): Vec3[] {
  if (n.inserted <= 0) return [];
  return [0, 0.5, 1].map((k) => siteToAortic(r, site, needlePoint(n, n.inserted * k)));
}

/**
 * The 0.018 inch micropuncture wire beyond the needle, in the aortic frame: up the artery from the entry,
 * turning into the inferior epigastric or lateral circumflex iliac artery or down the leg as its course says,
 * for `beyondMm` of wire.
 */
export function microWirePolyline(r: Route3D, site: AccessSite, entryX: number, beyondMm: number, course: MicroWireCourse | null): Vec3[] {
  const cfa = site.tubes.find((t) => t.id === site.arteryId)!;
  if (beyondMm <= 0.5) return [];
  if (course === "down-leg") {
    const bif = site.landmarks.bifurcationX ?? entryX;
    const sfa = site.tubes.find((t) => t.id === "sfa");
    const inCfa = Math.max(0, Math.min(beyondMm, entryX - bif));
    const head = tubePath(r, site, cfa, entryX, entryX - inCfa);
    if (!sfa || beyondMm <= inCfa) return head;
    return [...head, ...tubePath(r, site, sfa, Math.min(bif, sfa.xTo), Math.min(bif, sfa.xTo) - (beyondMm - inCfa)).slice(1)];
  }
  const turn = courseTurnMm(site, entryX, course);
  const main = Math.min(beyondMm, turn);
  const up = tubePath(r, site, cfa, entryX, entryX + main);
  const b = course === "iea" || course === "lcia" ? site.branches.find((t) => t.id === course) : undefined;
  if (!b || beyondMm <= turn) return up;
  // along the branch: its length per mm of x
  const k = Math.sqrt(1 + b.dy * b.dy + b.dz * b.dz);
  const runX = Math.min(b.xTo - b.xFrom, (beyondMm - turn) / k);
  return [...up, ...tubePath(r, site, b, b.xFrom, b.xFrom + runX).slice(1)];
}

/** The steel parts at the groin as tubes for the renderer's extras (world frame): each polyline with its drawing radius. */
export function steelTubes(model: AnatomyModel, lines: { pts: Vec3[]; r: number }[]): TubeSpec[] {
  return lines.filter((l) => l.pts.length >= 2).map((l) => ({ pts: l.pts.map((p) => toWorld(model, p)), r: l.pts.map(() => l.r), mu: [0, 0, MP_GROIN_DRAW.steelMu] }));
}

/**
 * A haemostat lying on the skin over the pulse with its tip at site x (the marker for the inferior border of the
 * femoral head, Brilakis 4.2, step 3): two jaws running distally and laterally from the tip.
 */
export function markerPolylines(r: Route3D, site: AccessSite, x: number): Vec3[][] {
  const L = MP_GROIN_DRAW.markerLen;
  const w = MP_GROIN_DRAW.markerSpread;
  const jaw = (dy: number) => [siteToAortic(r, site, { x, y: 0, z: 0 }), siteToAortic(r, site, { x: x - L * 0.5, y: dy * 0.5 + L * 0.15, z: 0 }), siteToAortic(r, site, { x: x - L, y: dy + L * 0.3, z: 0 })];
  return [jaw(w), jaw(-w)];
}

// ---------------------------------------------------------------------------
// The bladder on a pelvic screen (access-cx-bleeding-retroperitoneal)
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETERS (drawing): a moderately filled bladder as semi-axes across (x), along the body (y) and front
 * to back (z), mm; its centre above and behind the symphysis; the iodine in it at full opacification (mg/mL); and
 * the dent: the haematoma pushes the whole bladder across by `pushShare` of the dent and flattens the wall it
 * presses on by up to `dentFlattenShare` of the half-width, greatest at `dentLevel` of the bladder's height (-1
 * bottom, 1 top) and falling off over `dentSpread`; the dent is at most `maxDentMm`. The flattening moves the
 * ribbon's centre line by half its depth; its bend stays gentler than the ribbon is wide (the spread squared over
 * the flattening, about 55 mm, against a 34 mm half-width), so the ribbon's quads never fold over each other.
 * `samples` points along the centre line, spaced evenly in angle round the outline (denser towards the dome and
 * the base), so the drawn outline is a smooth ellipse rather than a polygon of straight ribbon quads (with the
 * hairline guide tube of bladderTubes, which keeps every sample through the renderer's decimation).
 */
export const MP_BLADDER = {
  halfWidthMm: 34,
  halfHeightMm: 26,
  halfDepthMm: 24,
  aboveSymphysisMm: 8,
  behindSymphysisMm: 22,
  mgPerMl: 22,
  samples: 49,
  dentLevel: -0.2,
  dentSpread: 0.9,
  pushShare: 0.7,
  dentFlattenShare: 0.3,
  maxDentMm: 22,
};

/** The symphysis pubis in the aortic frame, as limbExtras draws it (from the femoral head of the site, or the default head). */
function symphysisPoint(r: Route3D, site?: AccessSite): Vec3 {
  const A = pointAt(r.path, 0).p;
  const head = (site && site.kind === "femoral" && femoralHeadCentre(r, site)) || addV(A, v(0, -6, -42));
  return v(0, head.y - 20, head.z + 30);
}

/** Centre of the bladder in the aortic frame: midline, above and behind the symphysis. */
export function bladderCentre(r: Route3D, site?: AccessSite): Vec3 {
  const sym = symphysisPoint(r, site);
  return v(0, sym.y + MP_BLADDER.aboveSymphysisMm + MP_BLADDER.halfHeightMm, sym.z - MP_BLADDER.behindSymphysisMm);
}

/**
 * MODEL PARAMETER (framing): the share of the way from the middle of the common iliac artery (the pelvis
 * station's own centre) towards the bladder that the pelvis field is centred on a femoral route. Less than half,
 * so the aortic bifurcation and the proximal iliac course stay well inside the field during ordinary wire advance
 * while the bladder's centre is in the field too.
 */
export const MP_PELVIS_FRAME = { towardsBladder: 0.4 } as const;

/**
 * Field centre (aortic frame) of the pelvis station on a femoral route: `MP_PELVIS_FRAME.towardsBladder` of the
 * way from the middle of the common iliac artery towards the bladder, so the iliac artery and the bladder are
 * both in the field. Other routes keep the station's centre. The same in every femoral case (it gives nothing away).
 */
export function pelvisFrameCentre(r: Route3D, site?: AccessSite): Vec3 | null {
  const st = r.stations.find((x) => x.id === "pelvis");
  if (!st) return null;
  if (r.access !== "femoral") return st.c;
  const b = bladderCentre(r, site);
  const k = MP_PELVIS_FRAME.towardsBladder;
  return addV(sc(st.c, 1 - k), sc(b, k));
}

/**
 * The opacified bladder (world frame): `opacity` 0..1 is how much of the excreted contrast has reached it; `dentMm`
 * how far a haematoma on `side` (the patient's side) has pushed it across, 0 for a round, central bladder. Empty
 * below a trace of contrast.
 */
export function bladderTubes(r: Route3D, model: AnatomyModel, o: { opacity: number; dentMm: number; side: "right" | "left"; site?: AccessSite }): TubeSpec[] {
  if (!(o.opacity > 0.02)) return [];
  const M = MP_BLADDER;
  const c = bladderCentre(r, o.site);
  // the patient's left is +x: a right-sided haematoma pushes the bladder to +x
  const away = o.side === "right" ? 1 : -1;
  const dent = Math.max(0, Math.min(M.maxDentMm, o.dentMm));
  const cw = toWorld(model, c);
  const zw = toWorld(model, addV(c, v(0, 0, 1)));
  const thinDir = nrm(subV(zw, cw));
  const pts: Vec3[] = [];
  const wide: number[] = [];
  const thin: number[] = [];
  const dirs: Vec3[] = [];
  for (let i = 0; i < M.samples; i++) {
    // even steps in angle round the ellipse: u = -cos(theta), the half-width sin(theta)
    const th = (Math.PI * i) / (M.samples - 1);
    const u = -0.998 * Math.cos(th);
    const round = Math.sqrt(Math.max(0, 1 - u * u));
    const push = Math.exp(-(((u - M.dentLevel) / M.dentSpread) ** 2));
    // the far wall moves across with the whole bladder; the near wall also moves in by the flattening
    const flat = M.dentFlattenShare * M.halfWidthMm * (dent / M.maxDentMm) * push;
    const shift = away * (M.pushShare * dent + flat / 2);
    pts.push(toWorld(model, v(c.x + shift, c.y + u * M.halfHeightMm, c.z)));
    wide.push(Math.max(2, M.halfWidthMm * round - flat / 2));
    thin.push(Math.max(1.5, M.halfDepthMm * round));
    dirs.push(thinDir);
  }
  const mu = MU.iodinePerMg * M.mgPerMl * Math.min(1, o.opacity);
  // The renderer drops samples closer together on the screen than half the ribbon's half-width, which would
  // leave a 34 mm wide bladder only a handful of samples (a polygon). The first tube drawn on a points array
  // decides its samples for every tube on it (XrayRenderer, as for shells), so a hairline guide with no
  // attenuation goes first on the same points and keeps all of them.
  const guide: TubeSpec = { pts, r: pts.map(() => 0.05), mu: [0, 0, 0] };
  return [guide, { pts, r: wide, mu: [0, mu, 0], thin: { dir: dirs, r: thin } }];
}

// ---------------------------------------------------------------------------
// The crossover route over the aortic bifurcation (access-cx-endovascular-control)
// ---------------------------------------------------------------------------
//
// From the sheath in one groin up its external and common iliac arteries to the
// aortic bifurcation, over it and down the other side's common and external
// iliac arteries to the common femoral artery and below: the route for a
// shaped crossover catheter, its wire, an occlusion balloon and a stent
// brought to an iliofemoral injury from the opposite groin (Brilakis, in
// cm-access-complications-femoral-bleeding and -large-bore). It is built from
// the two femoral routes of the case (the access side's and the target
// side's), so it shares their centre lines: a site-frame point of the target
// groin (siteToAortic on the target route) lies on it, and a site x maps to a
// crossover s (crossoverSAtSiteX). Below the target route's start (its sheath
// tip, site x MP_LIMB.sheathTipSiteX) it follows the target limb's axis as
// siteToAortic does. The wrong turn at the bifurcation is straight up the
// abdominal aorta.

/** A crossover route: a Route3D whose limb is the access groin and whose far end is the other groin. */
export interface CrossoverRoute3D extends Route3D {
  crossover: true;
  /** the groin the route crosses to (the injury's side) */
  targetSide: "right" | "left";
  /** s of the aortic bifurcation */
  bifurcationS: number;
  /** s at the target route's start (its sheath tip, site x MP_LIMB.sheathTipSiteX) */
  targetTipS: number;
  /** the target site x at the route's far end */
  endSiteX: number;
  /** the target groin's own route: site-frame points of that groin map through it */
  target: Route3D;
}

/**
 * MODEL PARAMETERS of the crossover route's geometry (a drawing and a wire model, not anatomy measured from
 * patients): the target site x it runs down to (below a typical femoral bifurcation), the length of the wrong turn
 * up the aorta, the half-length of the bifurcation segment, and the default landmarks (the site model's default
 * ligament and bifurcation) when the target site gives none.
 */
export const MP_CROSSOVER = { endSiteX: -60, wrongMm: 150, bifHalfMm: 12, stepMm: 2, ligamentX: 66, bifurcationX: 0 } as const;

/** The index of a femoral route's first sample beyond its limb (the bifurcation). */
function limbEndIndex(p: Polyline): number {
  return p.region.findIndex((r) => !FEMORAL_LIMB.includes(r));
}

/** The crossover s of a target-groin site x. */
export function crossoverSAtSiteX(cr: Pick<CrossoverRoute3D, "targetTipS" | "bifurcationS" | "path">, x: number): number {
  const X0 = MP_LIMB.sheathTipSiteX;
  const s = x >= X0 ? cr.targetTipS - (x - X0) : cr.targetTipS + (X0 - x);
  return Math.max(cr.bifurcationS, Math.min(cr.path.cum[cr.path.cum.length - 1], s));
}

/**
 * Build the crossover route from the access groin's femoral route over the bifurcation to the other groin's.
 * `o` gives the target groin's landmarks (site x of the inguinal ligament and of the femoral bifurcation) for the
 * segment names. Throws unless both are femoral routes of opposite groins.
 */
export function buildCrossoverRoute3D(access: Route3D, target: Route3D, o: { ligamentX?: number; bifurcationX?: number; endSiteX?: number } = {}): CrossoverRoute3D {
  if (access.access !== "femoral" || target.access !== "femoral" || access.side === target.side) throw new Error("a crossover route joins the femoral routes of opposite groins");
  const ja = limbEndIndex(access.path);
  const jt = limbEndIndex(target.path);
  if (ja < 2 || jt < 2) throw new Error("a femoral route without its limb");
  const pts: Vec3[] = access.path.pts.slice(0, ja + 1);
  const r: number[] = access.path.r.slice(0, ja + 1);
  const region: number[] = access.path.region.slice(0, ja + 1);
  for (let i = jt - 1; i >= 0; i--) {
    pts.push(target.path.pts[i]);
    r.push(target.path.r[i]);
    region.push(target.path.region[i] === Region.Sheath ? Region.Femoral : target.path.region[i]);
  }
  const X0 = MP_LIMB.sheathTipSiteX;
  const endX = Math.min(X0 - MP_CROSSOVER.stepMm, o.endSiteX ?? MP_CROSSOVER.endSiteX);
  for (let x = X0 - MP_CROSSOVER.stepMm; x >= endX - 1e-9; x -= MP_CROSSOVER.stepMm) {
    pts.push(axisPoint(target, x));
    r.push(target.path.r[0]);
    region.push(Region.Femoral);
  }
  const path = polyFrom(pts, r, region);
  const total = path.cum[path.cum.length - 1];
  const bifurcationS = path.cum[ja];
  const targetTipS = path.cum[ja + jt];
  const sAtX = (x: number) => crossoverSAtSiteX({ targetTipS, bifurcationS, path }, x);
  // segment bounds along the route
  const accessIliac = (() => {
    const k = access.path.region.findIndex((x) => x === Region.Iliac);
    return k > 0 && k < ja ? path.cum[k] : bifurcationS * 0.5;
  })();
  const targetIliacEnd = (() => {
    // going down the target side: the last common iliac sample
    let k = -1;
    for (let i = 0; i < jt; i++) if (target.path.region[i] === Region.Iliac) k = i;
    const idx = k >= 0 ? ja + (jt - k) : ja + Math.round(jt / 2);
    return Math.max(bifurcationS + MP_CROSSOVER.bifHalfMm + 1, path.cum[Math.min(idx, path.cum.length - 1)]);
  })();
  const lig = sAtX(o.ligamentX ?? MP_CROSSOVER.ligamentX);
  const fbif = sAtX(o.bifurcationX ?? MP_CROSSOVER.bifurcationX);
  const other = access.side === "right" ? "left" : "right";
  const raw: RouteSegmentGeom[] = [
    { id: "femoral", name: `External iliac artery (${access.side})`, start: 0, end: accessIliac },
    { id: "iliac", name: `Common iliac artery (${access.side})`, start: accessIliac, end: bifurcationS - MP_CROSSOVER.bifHalfMm },
    { id: "aortic-bif", name: "Aortic bifurcation", start: bifurcationS - MP_CROSSOVER.bifHalfMm, end: bifurcationS + MP_CROSSOVER.bifHalfMm },
    { id: "iliac", name: `Common iliac artery (${other})`, start: bifurcationS + MP_CROSSOVER.bifHalfMm, end: targetIliacEnd },
    { id: "femoral", name: `External iliac artery (${other})`, start: targetIliacEnd, end: Math.max(targetIliacEnd + 1, lig) },
    { id: "cfa", name: `Common femoral artery (${other})`, start: Math.max(targetIliacEnd + 1, lig), end: Math.max(targetIliacEnd + 2, fbif) },
    { id: "sfa", name: `Superficial femoral artery (${other})`, start: Math.max(targetIliacEnd + 2, fbif), end: total },
  ];
  const segments = raw.filter((sg) => sg.end - sg.start > 0.5);
  // the wrong turn: straight on up the abdominal aorta
  const up = slice(access.path, bifurcationS, Math.min(access.path.cum[access.path.cum.length - 1], bifurcationS + MP_CROSSOVER.wrongMm));
  const wpts = [...access.path.pts.slice(0, ja + 1), ...up.slice(1)];
  const wrong = { atS: bifurcationS, label: "abdominal aorta", path: polyFrom(wpts, wpts.map(() => 8), wpts.map(() => Region.AbdominalAorta)) };
  const at = (s: number) => pointAt(path, s).p;
  const stations: Station[] = [
    { id: "groin", label: "Groin", c: at(0) },
    { id: "pelvis", label: "Pelvis", c: at(bifurcationS + 20) },
    { id: "target-iliac", label: `Iliac (${other})`, c: at((targetIliacEnd + lig) / 2) },
    { id: "target-groin", label: `Groin (${other})`, c: at((lig + fbif) / 2) },
  ];
  return {
    access: "femoral",
    side: access.side,
    path,
    segments,
    aortaStart: total + 100,
    wrong,
    stations,
    lateral: access.lateral,
    crossover: true,
    targetSide: target.side,
    bifurcationS,
    targetTipS,
    endSiteX: endX,
    target,
  };
}

/**
 * A point of the target groin's arteries (aortic frame) and the artery's direction there: the main artery at site
 * x, or a branch (by its site tube id, 'iea' or 'lcia') `alongMm` from its origin.
 */
export function targetLimbPoint(cr: CrossoverRoute3D, site: AccessSite | undefined, x: number, branch?: { id: string; alongMm: number }): { p: Vec3; t: Vec3 } {
  const b = branch && site ? site.branches.find((t) => t.id === branch.id) : undefined;
  if (b && site) {
    const bx = Math.min(b.xTo, b.xFrom + branch!.alongMm);
    const c0 = tubeAt(b, bx);
    const c1 = tubeAt(b, bx + 1);
    const p = siteToAortic(cr.target, site, { x: bx, y: c0.y, z: c0.z });
    const q = siteToAortic(cr.target, site, { x: bx + 1, y: c1.y, z: c1.z });
    return { p, t: nrm(subV(q, p)) };
  }
  const at = pointAt(cr.path, crossoverSAtSiteX(cr, x));
  return { p: at.p, t: at.t };
}

/** The crossover s of a branch's origin on the target side (its site tube's xFrom), or null without the branch. */
export function branchOriginS(cr: CrossoverRoute3D, site: AccessSite | undefined, id: string): number | null {
  const b = site?.branches.find((t) => t.id === id);
  return b ? crossoverSAtSiteX(cr, b.xFrom) : null;
}

/**
 * MODEL PARAMETERS (drawing) of the crossover angiogram: the radius share of the true lumen past a flap and over
 * what length (mm), and the share of the iodine density that slow flow beyond it carries.
 */
export const MP_CROSSOVER_ANGIO = { flapLumenShare: 0.35, flapLenMm: 25, slowShare: 0.35 } as const;

/**
 * The angiogram through the crossover catheter whose tip is at `fromS`: beyond the bifurcation, the target side's
 * iliac and femoral arteries fill downstream (with the inferior epigastric and lateral circumflex iliac branches and
 * the femoral bifurcation once the column reaches them); short of the bifurcation, the contrast runs back down the
 * access side. Nothing fills beyond `stopS` (an inflated balloon, an occlusion); past a flap at `flapS` the lumen
 * narrows and the flow beyond is slow and faint; `extravasation` draws the blush of an open hole, which the caller
 * passes only when the column reaches it. `profundaLost`: a stent across the femoral bifurcation has covered it.
 */
export function crossoverAngioTubes(
  cr: CrossoverRoute3D,
  model: AnatomyModel,
  site: AccessSite | undefined,
  o: { fromS: number; strength: number; mgPerMl: number; stopS?: number | null; flapS?: number | null; extravasation?: { p: Vec3; t: Vec3 } | null; profundaLost?: boolean },
): TubeSpec[] {
  if (o.strength <= 0.01) return [];
  const mu = MU.iodinePerMg * o.mgPerMl * o.strength;
  const total = cr.path.cum[cr.path.cum.length - 1];
  const out: TubeSpec[] = [];
  const tubeFrom = (s0: number, s1: number, share = 1, rScale = 1): void => {
    const pts = slice(cr.path, s0, s1);
    if (pts.length < 2) return;
    const radii = pts.map((_, i) => {
      const s = s0 + (i / Math.max(1, pts.length - 1)) * (s1 - s0);
      return Math.max(0.4, (cr.path.r[pointAt(cr.path, s).i] ?? 3) * rScale);
    });
    out.push({ pts: pts.map((p) => toWorld(model, p)), r: radii, mu: [0, mu * share, 0] });
  };
  if (o.fromS < cr.bifurcationS - 5) {
    tubeFrom(0, Math.max(5, o.fromS + 5));
    return out;
  }
  const s0 = Math.max(cr.bifurcationS - 10, o.fromS - 10);
  const s1 = Math.min(total, o.stopS ?? total);
  if (o.flapS !== null && o.flapS !== undefined && o.flapS < s1) {
    const f = Math.max(s0, o.flapS);
    tubeFrom(s0, f);
    tubeFrom(f, Math.min(s1, f + MP_CROSSOVER_ANGIO.flapLenMm), 1, MP_CROSSOVER_ANGIO.flapLumenShare);
    tubeFrom(Math.min(s1, f + MP_CROSSOVER_ANGIO.flapLenMm), s1, MP_CROSSOVER_ANGIO.slowShare);
    out.push(...dissectionTubes(cr, model, { atS: f + 6, strength: o.strength, mgPerMl: o.mgPerMl }));
  } else tubeFrom(s0, s1);
  if (site && site.kind === "femoral") {
    const share = o.flapS !== null && o.flapS !== undefined && o.flapS < s1 ? MP_CROSSOVER_ANGIO.slowShare : 1;
    // the small branches of the external iliac artery, once the column passes their origins
    for (const b of site.branches) {
      if (crossoverSAtSiteX(cr, b.xFrom) > s1) continue;
      const p = tubePath(cr.target, site, b, b.xFrom, b.xTo);
      out.push({ pts: p.map((q) => toWorld(model, q)), r: p.map(() => b.r * 0.8), mu: [0, mu * share, 0] });
    }
    // the femoral bifurcation, once the column reaches it
    const fb = crossoverSAtSiteX(cr, site.landmarks.bifurcationX ?? MP_CROSSOVER.bifurcationX);
    if (fb <= s1)
      for (const b of femoralAngioBranches(cr.target, site)) {
        if (o.profundaLost && b.id !== "sfa") continue;
        out.push({ pts: b.pts.map((q) => toWorld(model, q)), r: b.pts.map(() => b.r), mu: [0, mu * share, 0] });
      }
  }
  if (o.extravasation) out.push(...extravasationAtPoint(model, o.extravasation.p, o.extravasation.t, { strength: o.strength, mgPerMl: o.mgPerMl }));
  return out;
}

/** The route radius at the i-th of n samples of a slice from s0 to s1 (read from the slice's own s, as crossoverAngioTubes does). */
function routeRadiusAlong(cr: CrossoverRoute3D, s0: number, s1: number, i: number, n: number): number {
  const s = s0 + (i / Math.max(1, n - 1)) * (s1 - s0);
  return cr.path.r[pointAt(cr.path, s).i] ?? 3;
}

/**
 * MODEL PARAMETERS (drawing) of the devices on the crossover route: the balloon's marker bands (radius, mm, and
 * their share of the steel attenuation), the contrast mix share inside an inflated balloon, a stent's mesh as a
 * share of the steel attenuation, and a coil pack's radius (mm) and share.
 */
export const MP_CROSSOVER_DRAW = { markerR: 0.6, markerShare: 0.6, balloonMixShare: 0.5, stentMeshShare: 0.04, coilR: 1.6, coilShare: 0.5 } as const;

/**
 * The devices on the crossover route (world frame): the occlusion balloon at `balloon.s` (its two marker bands, and
 * diluted contrast filling it when inflated), stents laid along the route, and coil packs at points.
 */
export function crossoverDeviceTubes(
  cr: CrossoverRoute3D,
  model: AnatomyModel,
  o: { balloon?: { s: number; lenMm: number; inflated: boolean; mgPerMl: number } | null; stents?: { s: number; lenMm: number }[]; coils?: Vec3[] },
): TubeSpec[] {
  const D = MP_CROSSOVER_DRAW;
  const out: TubeSpec[] = [];
  const steel = MP_GROIN_DRAW.steelMu;
  const b = o.balloon;
  if (b) {
    for (const k of [-0.5, 0.5]) {
      const at = pointAt(cr.path, b.s + k * b.lenMm);
      const pts = [addV(at.p, sc(at.t, -0.6)), addV(at.p, sc(at.t, 0.6))];
      out.push({ pts: pts.map((p) => toWorld(model, p)), r: [D.markerR, D.markerR], mu: [0, 0, steel * D.markerShare] });
    }
    if (b.inflated) {
      const s0 = b.s - b.lenMm / 2;
      const s1 = b.s + b.lenMm / 2;
      const pts = slice(cr.path, s0, s1);
      if (pts.length >= 2) out.push({ pts: pts.map((p) => toWorld(model, p)), r: pts.map((_, i) => Math.max(1, routeRadiusAlong(cr, s0, s1, i, pts.length) * 0.95)), mu: [0, MU.iodinePerMg * b.mgPerMl * D.balloonMixShare, 0] });
    }
  }
  for (const st of o.stents ?? []) {
    const s0 = st.s - st.lenMm / 2;
    const s1 = st.s + st.lenMm / 2;
    const pts = slice(cr.path, s0, s1);
    if (pts.length >= 2) out.push({ pts: pts.map((p) => toWorld(model, p)), r: pts.map((_, i) => Math.max(1, routeRadiusAlong(cr, s0, s1, i, pts.length))), mu: [0, 0, steel * D.stentMeshShare] });
  }
  for (const c of o.coils ?? []) {
    const pts = [addV(c, v(-1.2, 0, 0)), addV(c, v(0, 1, 0.5)), addV(c, v(1.2, 0, 0))];
    out.push({ pts: pts.map((p) => toWorld(model, p)), r: pts.map(() => D.coilR), mu: [0, 0, steel * D.coilShare] });
  }
  return out;
}
