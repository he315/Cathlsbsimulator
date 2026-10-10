// ---------------------------------------------------------------------------
// Legacy bridge: turns a physics frame into the values the simulator store and
// renderers use today (engagement.ts TipState / EngagementState / ControlState
// read-outs, the catheterRoot and wire polylines of sceneBuilder), so the
// integration can switch between the analytic model and the rod physics with
// one flag. Read-only: nothing here feeds back into the physics.
//
// Mapping notes (model parameters, not measurements):
// - "cram" (legacy: how hard the preformed curve crams the cusp, roughly 0–6)
//   is the distal wall load in newtons × 20, counted only where the legacy
//   meaning holds: the tip bare (no wire leading it) in the root, the orifice or
//   a coronary. A catheter riding its wire up the aorta presses on the aortic
//   wall but does not cram a cusp (diag-rod-physics: the store's trauma model
//   reads cram).
// - "forwardPressure" (legacy: stored push, 0–~4.5) is the hub axial
//   resistance in newtons × 3; "resistance" combines axial load, torsion and
//   whip on a 0–1 scale.
// - Messages are plain descriptions of the geometry; they do not coach.
// - Selective (diag-rod-physics): a tip that lies inside a coronary lumen,
//   at least IN_VESSEL_MM beyond the ostium and short of the deep threshold,
//   is selectively engaged in the labs' vocabulary even when the classifier
//   does not find it coaxial. The classifier's coaxiality is measured against
//   the render tree's left main take-off, which a free seat of the rod model
//   does not reach (0.26 to 0.34 at the best seats), so it cannot yet tell a
//   coaxial seat from a non-coaxial one; such a seat's quality is its open
//   fraction (the ostial gap), so a free seat does not read as "non-coaxial"
//   (diagnosticContext NON_COAXIAL_QUALITY) and a seat that closes the ostium
//   does. A seat the classifier calls selective keeps coaxiality times the
//   open fraction. The classifier's own reading (kind, coaxiality) is unchanged.
// - Kink (diag-catheter-kink): the engine's kink and torque loss pass through
//   (LegacyView.kink, torqueLoss); a kinked shaft reads as full resistance at
//   the hub. The drawn catheter (catheterInBody) carries the fold: the rod's
//   shaft segments are 30 mm or longer, so the sharp fold of a kinked tube is
//   drawn as a short hairpin at the kink's node (KINK_FOLD_MM, MODEL
//   PARAMETER), which is what fluoroscopy of the whole catheter shows.
// ---------------------------------------------------------------------------

import type { EngagementState, Vec3, CoronaryTarget } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";
import type { TipState } from "../simulation/engagement";
import type { PhysicsFrame } from "./protocol";
import type { EngagementReading } from "./engagementClassifier";
import type { KinkReadout } from "./engine";
import { Region } from "./lumen";

export interface LegacyControls {
  windup: number;
  forwardPressure: number;
  resistance: number;
  whip: number;
}

export interface LegacyView {
  tip: TipState;
  engagement: EngagementState;
  controls: LegacyControls;
  /** catheter centre line inside the patient, aortic frame, hub side first */
  catheterInBody: Vec3[];
  /**
   * The root portion in sceneBuilder's catheterRoot contract: from where the catheter last comes
   * down the ascending aorta (above the sinuses) to the tip. With physics nodes sceneBuilder should
   * draw catheterInBody instead of prepending thorax.aorticCourse (see S7.md).
   */
  catheterRoot: Vec3[];
  /** guidewire polyline beyond (and inside) the catheter, aortic frame */
  wire: { pts: Vec3[]; kind: "035" | "014" } | null;
  /** the same wire from the skin to its tip (what the image shows), or null */
  wireInBody: Vec3[] | null;
  /** catheter length inside the patient (mm) and the wire's lead beyond the catheter tip (mm, negative inside it) */
  insertedMm: number;
  wireLeadMm: number;
  /** inputs for pressure damping (S9) and contrast transport (S5) */
  openFraction: number;
  dampingRisk: number;
  /** the catheter's kink, or null (diag-catheter-kink) */
  kink: KinkReadout | null;
  /** the hub has turned with little rotation of the tip over the engine's window */
  torqueLoss: boolean;
}

/**
 * The drawn fold of a kinked catheter (MODEL PARAMETERS): the hairpin's height at severity 1 and its
 * length along the shaft (mm). The rod's own shaft segments are too long to show a fold of a few
 * millimetres, so the drawn centre line takes it.
 */
export const KINK_FOLD_MM = { height: 3.5, length: 4 };

/**
 * The drawn centre line with the fold of a kink at index `at`: the shaft comes to the kink, folds out
 * to the side of its bend by up to KINK_FOLD_MM.height and back, and goes on.
 */
export function withKinkFold(pts: Vec3[], at: number, severity: number): Vec3[] {
  if (at <= 0 || at >= pts.length - 1 || !(severity > 0)) return pts;
  const a = pts[at - 1], p = pts[at], b = pts[at + 1];
  const t1 = norm3({ x: p.x - a.x, y: p.y - a.y, z: p.z - a.z });
  const t2 = norm3({ x: b.x - p.x, y: b.y - p.y, z: b.z - p.z });
  if (!t1 || !t2) return pts;
  // the side the shaft bends towards (the change of direction), else any normal to the shaft
  let n = norm3({ x: t2.x - t1.x, y: t2.y - t1.y, z: t2.z - t1.z });
  if (!n) n = norm3({ x: -t1.z, y: 0, z: t1.x }) ?? { x: 1, y: 0, z: 0 };
  const h = KINK_FOLD_MM.height * Math.min(1, severity);
  const l = KINK_FOLD_MM.length / 2;
  const fold: Vec3[] = [
    { x: p.x - t1.x * l, y: p.y - t1.y * l, z: p.z - t1.z * l },
    { x: p.x + n.x * h, y: p.y + n.y * h, z: p.z + n.z * h },
    { x: p.x - t1.x * l * 0.3 + n.x * h * 0.2, y: p.y - t1.y * l * 0.3 + n.y * h * 0.2, z: p.z - t1.z * l * 0.3 + n.z * h * 0.2 },
    { x: p.x + t2.x * l, y: p.y + t2.y * l, z: p.z + t2.z * l },
  ];
  return [...pts.slice(0, at), ...fold, ...pts.slice(at + 1)];
}

function norm3(v: Vec3): Vec3 | null {
  const l = Math.hypot(v.x, v.y, v.z);
  return l > 1e-9 ? { x: v.x / l, y: v.y / l, z: v.z / l } : null;
}

const toV = (a: ArrayLike<number>, i: number): Vec3 => ({ x: a[3 * i], y: a[3 * i + 1], z: a[3 * i + 2] });

/**
 * Depth beyond the ostium (mm) from which a tip inside a coronary lumen counts as selectively engaged
 * in the labs' vocabulary, whatever its coaxiality. MODEL PARAMETER (diag-rod-physics): half a
 * millimetre, so that a tip resting on the ostial rim (the classifier's funnel, depth -0.5 to 0) is
 * still "near".
 */
export const IN_VESSEL_MM = 0.5;
/**
 * The classifier's deep threshold (engagementClassifier.ts DEEP_MM): past the ostial funnel plus one
 * catheter diameter. A copy: the classifier does not export it yet, and the two must agree.
 */
export const DEEP_MM = 6.5;

export function legacyView(frame: PhysicsFrame, model: AnatomyModel): LegacyView | null {
  const c = frame.catheter;
  if (!c) return null;
  const e = frame.engagement;
  const [x, y, z] = c.tip;
  const radius = Math.hypot(x, z);
  const lead = wireLeadMm(frame);
  const atCusp = !!e && lead <= 1 && (e.vessel !== null || e.regionCode === Region.Root || e.regionCode === Region.Orifice || e.regionCode === Region.Coronary);
  const wall = atCusp ? e!.wallForce : 0;
  const tip: TipState = {
    pos: { x, y, z },
    dir: { x: c.tipDir[0], y: c.tipDir[1], z: c.tipDir[2] },
    height: y,
    az: Math.atan2(z, x),
    radius,
    cram: wall * 20,
    gap: Math.max(0, model.sinusRadius - radius - c.radius),
  };
  const engagement = e ? legacyEngagement(e) : neutralEngagement(tip.height);
  const axial = c.reaction.axial;
  const kink = c.kink ?? null;
  const controls: LegacyControls = {
    windup: c.windup,
    forwardPressure: Math.max(0, axial) * 3,
    resistance: kink ? 1 : Math.max(0, Math.min(1, Math.max(Math.abs(axial) / 1.5, Math.abs(c.reaction.torsion) / 3, c.reaction.snap ? 1 : 0))),
    whip: c.reaction.snap ? 1 : 0,
  };
  const from0 = Math.max(0, c.insideFrom - 1);
  let inBody: Vec3[] = [];
  for (let i = from0; i < c.count; i++) inBody.push(toV(c.nodes, i));
  if (kink) inBody = withKinkFold(inBody, kink.node - from0, kink.severity);
  // root portion: the last stretch of the catheter that comes down into the root from above
  let from = 0;
  for (let i = inBody.length - 1; i >= 0; i--) {
    if (inBody[i].y > model.sinusTopY + 40) {
      from = i;
      break;
    }
  }
  // a tip still above the root: keep at least the distal 20 mm so the contract stays a polyline
  let acc = 0;
  let minFrom = inBody.length - 1;
  while (minFrom > 0 && acc < 20) {
    acc += Math.hypot(inBody[minFrom].x - inBody[minFrom - 1].x, inBody[minFrom].y - inBody[minFrom - 1].y, inBody[minFrom].z - inBody[minFrom - 1].z);
    minFrom--;
  }
  const catheterRoot = inBody.slice(Math.min(from, minFrom));
  let wire: LegacyView["wire"] = null;
  if (frame.wire) {
    const pts: Vec3[] = [];
    for (let i = 0; i < frame.wire.count; i++) pts.push(toV(frame.wire.nodes, i));
    wire = { pts, kind: frame.wire.slot === "wire014" ? "014" : "035" };
  }
  return {
    tip,
    engagement,
    controls,
    catheterInBody: inBody,
    catheterRoot,
    wire,
    wireInBody: wireInBody(frame),
    insertedMm: insertedLengthMm(frame),
    wireLeadMm: lead,
    openFraction: e?.openFraction ?? 1,
    dampingRisk: e?.dampingRisk ?? 0,
    kink,
    torqueLoss: !!c.torqueLoss,
  };
}

/**
 * The engagement kind in the labs' vocabulary: the classifier's kind, except that a non-coaxial tip
 * inside a coronary lumen (IN_VESSEL_MM to the deep threshold, not the conus) is selective.
 */
export function bridgedKind(e: EngagementReading): EngagementState["kind"] {
  if (!e.selective && !e.deep && !e.conus && !e.inLV && e.vessel !== null && e.depthMm >= IN_VESSEL_MM && e.depthMm <= DEEP_MM && (e.kind === "near-lm" || e.kind === "near-rca")) {
    return e.side === "right" ? "selective-rca" : "selective-lm";
  }
  return e.kind;
}

/**
 * The tip is in the conus branch: the classifier finds it in the conus lumen and past its mouth (depth
 * above -0.5 mm, the classifier's own in-vessel test for the engagement kind). A tip resting on the
 * conus mouth from the sinus is not yet in it.
 */
export function inConus(e: Pick<EngagementReading, "conus" | "depthMm">): boolean {
  return e.conus && e.depthMm > -0.5;
}

export function legacyEngagement(e: EngagementReading): EngagementState {
  const target: CoronaryTarget | null = e.side ?? (e.kind.endsWith("lm") ? "left" : e.kind.endsWith("rca") ? "right" : null);
  const kind = bridgedKind(e);
  const bridged = kind !== e.kind;
  const selective = e.selective || bridged;
  const open = Math.max(0, Math.min(1, Number.isFinite(e.openFraction) ? e.openFraction : 1));
  // a bridged seat: the open fraction (the classifier's coaxiality cannot judge it yet, header note)
  const quality = bridged ? open : selective ? Math.max(0, Math.min(1, e.coaxiality)) * open : e.deep ? 0.4 : e.vessel ? 0.3 : 0.1;
  return {
    kind,
    target,
    distanceToLm: e.distanceToLm,
    distanceToRca: e.distanceToRca,
    alignmentLm: e.alignmentLm,
    alignmentRca: e.alignmentRca,
    tipHeight: e.tipHeight,
    depth: e.depthMm,
    isSelective: selective,
    isDeep: e.deep,
    // as the analytic engagement (src/simulation/engagement.ts): the ventricle, a deep seat and the
    // conus. A damping seat is not flagged here: the open fraction drives the tip trace through
    // tipFromPhysics, and the trace's own warning says when it damps (dampingRisk, which adds the
    // wall force, flagged seats whose trace stayed aortic)
    isDangerous: e.inLV || e.deep || inConus(e),
    conus: inConus(e),
    quality,
    message: describe(e),
  };
}

/** No engagement: the tip is not in the root, or no catheter is in the patient (the exchange). */
export function neutralEngagement(tipHeight: number): EngagementState {
  return {
    kind: "not-in-root",
    target: null,
    distanceToLm: Infinity,
    distanceToRca: Infinity,
    alignmentLm: 0,
    alignmentRca: 0,
    tipHeight,
    depth: 0,
    isSelective: false,
    isDeep: false,
    isDangerous: false,
    conus: false,
    quality: 0,
    message: "",
  };
}

/** A neutral description of where the tip is (no coaching, no answers). */
function describe(e: EngagementReading): string {
  if (e.inLV) return "Tip below the valve.";
  if (e.prolapsed) return "Catheter looped down onto the valve.";
  if (e.vessel) return `Tip ${e.depthMm.toFixed(0)} mm into the ${e.vessel === "LM" ? "left main" : e.vessel}.`;
  return `Tip in the ${e.region}.`;
}

// ---------------------------------------------------------------------------
// Read-outs the diagnostic lab needs beyond the store's (diag-rod-physics)
// ---------------------------------------------------------------------------

const dist3 = (a: ArrayLike<number>, i: number, b: ArrayLike<number>, j: number) =>
  Math.hypot(a[3 * i] - b[3 * j], a[3 * i + 1] - b[3 * j + 1], a[3 * i + 2] - b[3 * j + 2]);

/** Length of the catheter inside the patient (mm): its centre line from the skin to the tip. */
export function insertedLengthMm(frame: PhysicsFrame): number {
  const c = frame.catheter;
  if (!c) return 0;
  let len = 0;
  for (let i = Math.max(1, c.insideFrom); i < c.count; i++) len += dist3(c.nodes, i, c.nodes, i - 1);
  return len;
}

/**
 * How far the wire tip leads the catheter tip (mm, along the wire): positive beyond the tip, negative
 * inside the catheter (measured back along the catheter from its tip), 0 without a wire. With no
 * catheter, the wire length inside the patient. The solver reports the wire inside the catheter on the
 * catheter's own centre line (engine.ts readWire), so the wire tip inside it lies on a catheter node,
 * and a wire that has left the tip passes through the catheter tip first.
 */
export function wireLeadMm(frame: PhysicsFrame): number {
  const w = frame.wire;
  if (!w || w.count < 2) return 0;
  const c = frame.catheter;
  if (!c) {
    let len = 0;
    for (let i = 1; i < w.count; i++) len += dist3(w.nodes, i, w.nodes, i - 1);
    return len;
  }
  const ti = c.count - 1;
  const wt = w.count - 1;
  // the wire tip on the catheter's centre line, short of its tip: inside the catheter
  let bestC = Infinity, kc = ti;
  for (let i = 0; i < c.count; i++) {
    const d = dist3(c.nodes, i, w.nodes, wt);
    if (d < bestC) {
      bestC = d;
      kc = i;
    }
  }
  if (bestC < 0.6 && kc < ti) {
    let back = 0;
    for (let i = kc + 1; i < c.count; i++) back += dist3(c.nodes, i, c.nodes, i - 1);
    return -back;
  }
  // out of the catheter: the first wire node at the catheter tip is the exit
  let k = -1;
  for (let i = 0; i < w.count; i++) {
    if (dist3(w.nodes, i, c.nodes, ti) < 1.5) {
      k = i;
      break;
    }
  }
  if (k < 0) {
    let best = Infinity;
    for (let i = 0; i < w.count; i++) {
      const d = dist3(w.nodes, i, c.nodes, ti);
      if (d < best) {
        best = d;
        k = i;
      }
    }
  }
  let lead = 0;
  for (let i = k + 1; i < w.count; i++) lead += dist3(w.nodes, i, w.nodes, i - 1);
  return lead;
}

/**
 * The wire polyline as the image shows it: from where the catheter enters the skin (or the wire's own
 * first node inside the patient) to the wire tip, so the part of the wire outside the patient is not
 * drawn. Null without a wire.
 */
export function wireInBody(frame: PhysicsFrame): Vec3[] | null {
  const w = frame.wire;
  if (!w || w.count < 2) return null;
  const c = frame.catheter;
  let from = 0;
  if (c) {
    const skin = Math.max(0, c.insideFrom - 1);
    let best = Infinity;
    for (let i = 0; i < w.count; i++) {
      const d = dist3(w.nodes, i, c.nodes, skin);
      if (d < best) {
        best = d;
        from = i;
      }
    }
  } else from = Math.max(0, w.insideFrom - 1);
  const pts: Vec3[] = [];
  for (let i = from; i < w.count; i++) pts.push(toV(w.nodes, i));
  return pts.length >= 2 ? pts : null;
}
