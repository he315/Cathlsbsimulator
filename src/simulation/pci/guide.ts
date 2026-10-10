// ---------------------------------------------------------------------------
// Guide catheter support and device delivery.
//
// A device advanced over the wire meets resistance: friction against the rail
// in every bend it crosses (stiffness × ∫κ² over a contact length, plus the
// guide's own curves) and, at the lesion, a crossing load that rises as its
// profile exceeds the minimal lumen and with untreated calcium. The operator's
// push is reacted at the guide. If the reaction exceeds the guide's back-up,
// the guide is pushed back out of the ostium instead of the device going in.
//
// Back-up depends on the guide family (extra-backup and Amplatz curves lean on
// the opposite aortic wall), French size, how coaxial and how deep the guide
// sits, and adjuncts: a guide extension in the vessel, a buddy wire. The
// ordering (larger French, extra-backup and deep-seated curves hold more) is
// from pm-wiring-guide-choice (Brilakis 9.7 and Oxford's support grading) and
// Ikari 2005 (docs/realism/facts/S7.md #15); docs/realism/facts/pci-equipment.md
// lists them. Every force here is a MODEL PARAMETER.
// ---------------------------------------------------------------------------

import {
  GUIDE_BY_ID,
  GUIDE_LUMEN,
  MP_BUDDY_BACKUP,
  MP_BUDDY_FRICTION,
  MP_EXTENSION_BACKUP_N,
  MP_FRENCH_BACKUP_EXP,
  type DeviceSpec,
  type GuideFrench,
  type GuideLengthCm,
  type GuideSpec,
} from "./equipment";
import { bendIntegrals, curvatureAtMm, radiusAtMm, takeOff, type PciGeom } from "./geometry";
import { rngFrom, rnd, type RngState } from "./rng";
import { catheterById } from "../../data/catheters";
import { computeEngagement, initialControls, type ControlState } from "../engagement";
import type { AnatomyModel } from "../anatomy";
import type { CatheterType, EngagementState } from "../../types";

export interface GuideState {
  id: string;
  french: GuideFrench;
  /** the coronary side the guide is working on, when the guide's back-up differs by side (absent: the guide's default back-up) */
  side?: "left" | "right";
  /** guide length (cm); absent means the usual 100 cm */
  lengthCm?: GuideLengthCm;
  /** a guide with side holes */
  sideHoles?: boolean;
  /** seated in the ostium */
  engaged: boolean;
  /** depth beyond the ostium (mm): 0 at the ostium, positive deep-seated, negative backed out */
  depthMm: number;
  /** coaxiality with the ostium (0 poor … 1 coaxial) */
  coaxial: number;
  /** guide extension advanced this far into the vessel (mm), or null */
  extensionMm: number | null;
  /** a second wire in the vessel alongside the working wire */
  buddy: boolean;
  // ---- engagement (pci-guide-engagement); every field below is optional, absent on the default state ----
  /** the hub's insertion and rotation in the aortic root, for the analytic engagement model (absent until the hands move a guide that is out of the ostium) */
  root?: GuideRoot;
  /** where the tip of a guide that is out of the ostium is (the classifier's zone) */
  zone?: GuideZone;
  /** procedure time (state.t, s) the tip came near the ostium without engaging, or null */
  nearSince?: number | null;
  /** rotation of an engaged guide away from its coaxial position (rad) */
  offAxisRad?: number;
  /** lumen diameter of the ostium the guide engages (mm), from the geometry */
  ostiumMm?: number;
  /** diameter stenosis of an aorto-ostial lesion at that ostium (0..1) */
  ostialStenosis?: number;
  /** open fraction of the ostium around the tip as the rod physics measures it (overrides the analytic wedge) */
  openFraction?: number;
  /** twist stored in the shaft that has not reached the tip (rad) */
  twistRad?: number;
  /** the shaft has kinked from over-rotation */
  kinked?: boolean;
  /** engagements so far (seeds the settle of the next one) */
  engagements?: number;
  // ---- delivery and support (pci-device-delivery); every field below is optional, absent on the default state ----
  /** the left hand holds the guide at the Y-connector and pushes it gently (the independent-hand technique) */
  pinned?: boolean;
  /** a guide extension catheter in the guide or the vessel (extensionMm mirrors its depth beyond the guide tip) */
  ext?: GuideExtension | null;
  /** a side-branch anchor balloon inflated beside the working wire (a back-up multiplier until pci-two-rail-engine gives it a rail) */
  anchor?: { diameter: number; atm: number; branch: string } | null;
  /** a support catheter anchored in the proximal vessel */
  supportCatheter?: SupportCatheterKind | null;
  /** the patient holds a deep breath until this procedure time (state.t, s) */
  breathUntil?: number | null;
}

/** The support catheters of eq-sheaths-guides-extension-device (Brilakis 30.4): scaffold, strut, and the low-pressure anchoring balloon catheter. */
export type SupportCatheterKind = "scaffold" | "strut" | "anchoring-balloon";

/**
 * A guide extension (eq-sheaths-guides-extension-device): a cylinder on a push rod run through the
 * guide. Its tip is a route position like a device's (mm from the ostium; negative inside the guide);
 * the proximal collar sits a cylinder length behind the tip and should stay inside the guide.
 */
export interface GuideExtension {
  /** catalogue id (equipment.ts: extension, extension-trap, extension-5in6) */
  specId: string;
  /** size (Fr) */
  french: number;
  /** cylinder length (mm) */
  cylinderMm: number;
  /** tip position along the route (mm; negative inside the guide) */
  tipMm: number;
  /** the push rod lies under a towel beside the Y-connector (else the wire can wrap round it) */
  rodParked: boolean;
  /** the coronary wire has wrapped round the push rod: devices stop at the collar until the extension is taken out and reinserted */
  wrapped: boolean;
}

/** The extension's proximal collar (route mm): a cylinder length behind its tip. */
export function extensionCollarMm(ext: GuideExtension): number {
  return ext.tipMm - ext.cylinderMm;
}

/** The guide with extensionMm kept in step with its extension: the depth of the extension's tip beyond the guide tip, null while it is inside the guide. */
export function withExtension(gs: GuideState, ext: GuideExtension | null): GuideState {
  return { ...gs, ext, extensionMm: ext && ext.tipMm > 0 ? ext.tipMm : null };
}

/** The hub of a guide that is out of the ostium, as the analytic engagement model reads it. */
export interface GuideRoot {
  /** advance from the curve's natural seat (mm; + advanced, the tip lower) */
  insertion: number;
  /** rotation delivered to the tip (rad, clockwise +) */
  torque: number;
}

/** Where a guide that is out of the ostium sits, as the classifier reports it. */
export type GuideZone = "ascending" | "root" | "near" | "other-side" | "conus" | "lv";

export function initialGuide(id: string, engaged = true, french: GuideFrench = 6, opts: { side?: "left" | "right"; lengthCm?: GuideLengthCm; sideHoles?: boolean } = {}): GuideState {
  const gs: GuideState = { id, french, engaged, depthMm: engaged ? 0 : -15, coaxial: engaged ? 0.85 : 0, extensionMm: null, buddy: false };
  if (opts.side) gs.side = opts.side;
  if (opts.lengthCm) gs.lengthCm = opts.lengthCm;
  if (opts.sideHoles) gs.sideHoles = true;
  return gs;
}

export function guideSpec(gs: GuideState): GuideSpec {
  return GUIDE_BY_ID[gs.id] ?? GUIDE_BY_ID.JL4;
}

/** Back-up force (N) the guide can react before it moves. */
export function backupForce(gs: GuideState): number {
  if (!gs.engaged) return 0.02;
  const spec = guideSpec(gs);
  const base = (gs.side && spec.backupBySide?.[gs.side]) ?? spec.backupN;
  let b = base * Math.pow(gs.french / 6, MP_FRENCH_BACKUP_EXP);
  // a poorly coaxial guide loses much of its back-up; deep seating adds to it
  b *= 0.35 + 0.65 * gs.coaxial;
  b *= 1 + 0.18 * Math.max(0, Math.min(6, gs.depthMm));
  if (gs.extensionMm !== null) b += MP_EXTENSION_BACKUP_N * (0.4 + 0.6 * Math.min(1, gs.extensionMm / 25));
  if (gs.buddy) b *= MP_BUDDY_BACKUP;
  // pci-device-delivery: the left hand on the guide, an anchor balloon, a support catheter (absent on the default state)
  if (gs.pinned) b += MP_GUIDE_HAND_N;
  if (gs.anchor) b *= MP_ANCHOR_BACKUP;
  if (gs.supportCatheter) b *= MP_SUPPORT_CATHETER_BACKUP[gs.supportCatheter];
  return b;
}

// --- delivery and support (pci-device-delivery): MODEL PARAMETERS, docs/realism/facts/pkg-pci-device-delivery.md ---

/** Back-up the left hand adds when it holds and gently pushes the guide (the independent-hand technique), N. MODEL PARAMETER. */
export const MP_GUIDE_HAND_N = 0.08;
/** Share of a stalled push's back-out the left hand holding the guide takes off. MODEL PARAMETER. */
export const MP_HELD_BACK_SHARE = 0.5;
/** Back-up multiplier of a side-branch anchor balloon kept inflated. MODEL PARAMETER. */
export const MP_ANCHOR_BACKUP = 1.6;
/** Back-up multipliers of the support catheters (scaffold, strut, anchoring balloon). MODEL PARAMETERS. */
export const MP_SUPPORT_CATHETER_BACKUP: Record<SupportCatheterKind, number> = { scaffold: 1.8, strut: 1.6, "anchoring-balloon": 1.5 };
/** A deep breath held by the patient straightens the bends: the bend load is scaled by this. MODEL PARAMETER. */
export const MP_BREATH_BEND_SCALE = 0.75;
/** A guide pushed back out of the ostium ends in the root this far from it at most (mm): the out-of-ostium depth of initialGuide. MODEL PARAMETER. */
export const MP_BACKED_OUT_FLOOR_MM = -15;
/** The first millimetres beyond the ostium, where the guide's seat lines an extension's tip up with the vessel (no edge catch), mm. MODEL PARAMETER. */
export const MP_EDGE_FREE_MM = 6;
/** Friction of a device running inside a guide extension in the vessel (N, beside the guide curves' share). MODEL PARAMETER. */
export const MP_IN_EXTENSION_N = 0.01;

/** Device context on the rail. */
export interface DeliveryInput {
  spec: DeviceSpec;
  /** device diameter (mm) and length (mm) */
  diameter: number;
  lengthMm: number;
  /** device distal end (route mm) now and after the requested advance */
  fromMm: number;
  toMm: number;
  route: string[];
  /** target lesion and its state */
  lesion: { vessel: string; startMm: number; endMm: number; mldMm: number; calcium: 0 | 1 | 2; resistance: number };
  /** the wire's shaft support (1 workhorse) */
  wireSupport: number;
  /** a guide extension's tip in the vessel (route mm): the device runs inside it up to there (pci-device-delivery; absent: none) */
  extensionTipMm?: number | null;
  /** scale of the bend load (a held deep breath straightens the bends; absent: 1) */
  bendScale?: number;
  /** scale of the whole rail friction (a guide extension's own delivery mode; absent: 1) */
  loadScale?: number;
  /** the left hand holds the guide: a stalled push backs it out less */
  guideHeld?: boolean;
  /** a guide extension's edge riding the bare wire catches at the bends: this load (N) per unit of the curvature (1/mm) at its tip */
  edgeCatchN?: number;
  /**
   * the slack a stalled push can release into the guide beyond the hub travel the device did not take up (mm):
   * set for the lab's hands (MP_SHAFT_SLACK_MM), so small bites back the guide out progressively. Absent: the
   * back-out is not bounded by the travel (the engine's default, unchanged for headless scripts).
   */
  slackMm?: number;
}

export interface DeliveryResult {
  /** force needed to advance (N) and its parts */
  requiredN: number;
  frictionN: number;
  lesionN: number;
  backupN: number;
  /** distance the device actually advanced (mm) */
  advancedMm: number;
  /** distance the guide was pushed back (mm) */
  guideBackMm: number;
  /** the guide fell out of the ostium */
  disengaged: boolean;
}

/** Friction on the rail per unit wall load — MODEL PARAMETER. */
export const MP_RAIL_MU = 0.25;
/** contact length for the bend load of a device (mm) — MODEL PARAMETER */
export const MP_DEVICE_CONTACT_MM = 30;
/** extra load of a rigid segment at the sharpest bend (N per N·mm² per 1/mm) — MODEL PARAMETER */
export const MP_KINK_LOAD = 0.02;
/** friction of a stiff device dragged through a calcified segment (N per 10 mm, per unit calcium × resistance, per 10 N·mm² of stiffness) — MODEL PARAMETER */
export const MP_CALCIUM_DRAG_N = 0.06;
/** lesion crossing load per unit of (profile / MLD − 1), and its calcium multiplier — MODEL PARAMETERS */
export const MP_LESION_N = 0.18;
export const MP_CALCIUM_LESION = 2.2;
/** guide stiffness against back-out (N per mm) — MODEL PARAMETER */
export const MP_GUIDE_K_N_PER_MM = 0.05;
/** the guide leaves the ostium when it is pushed this far back (mm) — MODEL PARAMETER */
export const MP_DISENGAGE_MM = -2;
/**
 * Slack stored in the device shaft and guide that a stalled push by hand can release into the guide on top of the
 * hub travel the device did not take up (mm): such a push backs the guide out by at most the untaken travel plus
 * this, so a series of small bites backs it out progressively (pci-device-delivery; DeliveryInput.slackMm, set
 * by the lab's hands only). MODEL PARAMETER.
 */
export const MP_SHAFT_SLACK_MM = 1;

/** Rail friction for a device spanning [fromMm − length, fromMm] after the guide curves. */
export function railFriction(
  g: PciGeom,
  gs: GuideState,
  inp: Pick<DeliveryInput, "spec" | "lengthMm" | "fromMm" | "route" | "wireSupport" | "extensionTipMm" | "bendScale" | "loadScale" | "edgeCatchN">
): number {
  const spec = guideSpec(gs);
  const tip = Math.max(0, inp.fromMm);
  // the shaft runs through the guide's curves
  const guideLoad = 0.02 * spec.curveTurning;
  // inside a guide extension in the vessel the device does not touch the vessel wall: only the extension's tip segment onwards does
  const E = inp.extensionTipMm ?? null;
  if (E !== null && E > 0 && tip <= E) return MP_RAIL_MU * guideLoad * (inp.loadScale ?? 1) + MP_IN_EXTENSION_N;
  const lo = Math.max(0, tip - Math.max(inp.lengthMm, 10), E !== null && E > 0 ? E : 0);
  const b = tip > 0 ? bendIntegrals(g, inp.route, lo, tip) : { turning: 0, k2: 0, kMax: 0 };
  // the rigid segment (balloon or crimped stent) must bend to the rail: EI ∫κ² over the contact length
  const bendLoad = ((inp.spec.EI * b.k2) / MP_DEVICE_CONTACT_MM + inp.spec.EI * b.kMax * Math.min(1, inp.lengthMm / 20) * MP_KINK_LOAD) * (inp.bendScale ?? 1);
  // a stiffer wire straightens the bends and lowers the load
  const straighten = 1 / Math.max(0.6, inp.wireSupport);
  let f = MP_RAIL_MU * (bendLoad * straighten + guideLoad) * (inp.loadScale ?? 1);
  // the edge of a guide extension on the bare wire catches where the vessel bends at its tip (beyond the first millimetres, which the guide's seat lines up)
  if (inp.edgeCatchN && tip > MP_EDGE_FREE_MM) f += inp.edgeCatchN * curvatureAtMm(g, inp.route, tip) * (inp.bendScale ?? 1);
  if (gs.buddy) f *= MP_BUDDY_FRICTION;
  return f;
}

/** Crossing load of the lesion for a device whose distal end is at `tipMm` (N). */
export function lesionLoad(inp: DeliveryInput, tipMm: number): number {
  const L = inp.lesion;
  if (!inp.route.includes(L.vessel)) return 0;
  const devFrom = tipMm - inp.lengthMm;
  if (tipMm < L.startMm || devFrom > L.endMm) return 0;
  const profile = inp.spec.profileMm(inp.diameter);
  const tight = Math.max(0, profile / Math.max(0.05, L.mldMm) - 1);
  // a narrow channel must be pushed open; a calcified segment drags on a stiff device even when the lumen is adequate
  const inContact = Math.max(0, Math.min(tipMm, L.endMm) - Math.max(devFrom, L.startMm));
  const calciumDrag = MP_CALCIUM_DRAG_N * L.calcium * L.resistance * (inContact / 10) * (inp.spec.EI / 10);
  return MP_LESION_N * tight * (1 + MP_CALCIUM_LESION * L.calcium * L.resistance) + calciumDrag;
}

/**
 * Advance a device by `d` mm (d > 0) against the guide's back-up. The device goes forward while the
 * required force stays within the back-up; beyond that the guide backs out by the excess over its
 * stiffness and the device stops.
 */
export function deliver(g: PciGeom, gs0: GuideState, inp: DeliveryInput): { gs: GuideState; r: DeliveryResult } {
  const gs: GuideState = { ...gs0 };
  const d = inp.toMm - inp.fromMm;
  const backup = backupForce(gs);
  let advanced = 0;
  let req = 0,
    fric = 0,
    les = 0;
  const step = 0.5;
  while (advanced < d - 1e-9) {
    const s = Math.min(step, d - advanced);
    const tip = inp.fromMm + advanced + s;
    fric = railFriction(g, gs, { ...inp, fromMm: tip });
    les = lesionLoad(inp, tip);
    req = fric + les;
    if (req > backup) break;
    advanced += s;
  }
  let back = 0;
  let disengaged = false;
  if (advanced < d - 1e-9) {
    // the operator keeps pushing the remainder: the guide takes it
    const untaken = d - advanced;
    back = Math.min(8, (req - backup) / MP_GUIDE_K_N_PER_MM + untaken * 0.6);
    // by hand, no more than the hub travel the device did not take up plus the slack the shaft had stored
    // (pci-device-delivery), so small bites back the guide out progressively
    if (inp.slackMm !== undefined) back = Math.min(back, untaken + Math.max(0, inp.slackMm));
    // the left hand holding the guide takes part of it (pci-device-delivery)
    if (inp.guideHeld) back *= MP_HELD_BACK_SHARE;
    // a guide already out of the ostium falls back into the root, no further (pci-device-delivery)
    back = Math.max(0, Math.min(back, gs.depthMm - MP_BACKED_OUT_FLOOR_MM));
    gs.depthMm -= back;
    gs.coaxial = Math.max(0, gs.coaxial - 0.04 * back);
    if (gs.depthMm < MP_DISENGAGE_MM) {
      gs.engaged = false;
      disengaged = true;
    }
  }
  return { gs, r: { requiredN: req, frictionN: fric, lesionN: les, backupN: backup, advancedMm: advanced, guideBackMm: back, disengaged } };
}

/** Engage (or re-engage) the guide over the wire: coaxial at the ostium. */
export function engage(gs: GuideState, coaxial = 0.85): GuideState {
  return { ...gs, engaged: true, depthMm: Math.max(0, gs.depthMm), coaxial };
}

/** Deep-seat (+) or withdraw (−) an engaged guide by `mm`. */
export function seat(gs: GuideState, mm: number): GuideState {
  if (!gs.engaged) return gs;
  const spec = guideSpec(gs);
  const depth = Math.max(-6, Math.min(8, gs.depthMm + mm * (0.5 + spec.deepSeatEase)));
  const n: GuideState = { ...gs, depthMm: depth };
  if (depth < MP_DISENGAGE_MM) n.engaged = false;
  return n;
}

// ===========================================================================
// Engagement, seating and the guide's effect on the pressure and the wire
// (pci-guide-engagement).
//
// A case can start with the guide in the aortic root. While it is out of the
// ostium the hands move it with the difficulty-independent analytic model of
// the diagnostic lab (computeEngagement in src/simulation/engagement.ts, its
// fixed thresholds), on a stand-in catheter from the catalogue of diagnostic
// shapes with the guide's poorer torque transmission (thinner wall, softer
// tip: lab request pm-wiring#1). The rod physics replaces it through the
// PhysicsDevices interface when it is on (src/ui/pci/useGuidePhysics.ts).
// Engaging settles the tip at a seeded depth and coaxiality (an Amplatz
// dives further than a Judkins); the guide's outer diameter against the
// ostial lumen, its depth and its coaxiality set how much of the ostium it
// blocks (guideWedgeFraction), which the transducer reads as the trace
// (patientBridge.tipFromGuide); side holes keep the trace looking normal. A
// large left curve in a wide-angled left main points the wire at the
// circumflex, and a shallow Judkins right at a separate conus ostium sends it
// to the conus (guideWireAim), until the guide is re-seated. Rotating an
// engaged guide turns it off the ostium (the wire stays); rotation that does
// not reach the tip is stored as twist and, past a limit, kinks the shaft.
// Every number in this section is a MODEL PARAMETER (docs/realism/facts/
// pkg-pci-guide-engagement.md) unless it cites the module text.
// ===========================================================================

/**
 * Fraction of hub rotation that reaches the tip of a guide; the rest is stored in the shaft as twist
 * (twistGuide). Applied once, in twistGuide: out of the ostium the analytic model then turns that share
 * with the stand-in diagnostic catheter's own torque response (guideCatheterType keeps it unchanged), so
 * a guide follows the hub less than a diagnostic catheter. Lab request pm-wiring#1 asks for less torque
 * fidelity than a diagnostic catheter; the value is a MODEL PARAMETER.
 */
export const MP_GUIDE_TORQUE_FIDELITY = 0.75;
/** The engagement tips' thresholds: depth beyond the ostium that counts as too deep (mm), and the coaxiality below which the guide is non-coaxial. The plan's design values (lab-build-plan.json, pci-guide-engagement); 2-3 mm is the optimal depth in pm-wiring-guide-seat. MODEL PARAMETERS. */
export const GUIDE_TOO_DEEP_MM = 3;
export const GUIDE_NON_COAXIAL = 0.5;
/** Time near the ostium without engaging that counts as a failed engagement (s). The plan's design value. MODEL PARAMETER. */
export const GUIDE_ENGAGE_FAIL_S = 45;
/** Height above the top of the sinuses at which a guide brought up to the root starts (mm). MODEL PARAMETER. */
export const MP_ROOT_START_ABOVE_MM = 8;
/** Ostial lumen diameter assumed when the geometry has not given one (mm). MODEL PARAMETER. */
export const MP_OSTIUM_DEFAULT_MM = 4;
/** Wedge model: the share of the ostium the tip blocks is (outer diameter / ostial lumen) x seal, seal = base + per mm of depth + for poor coaxiality. MODEL PARAMETERS. */
export const MP_SEAL_BASE = 0.55;
export const MP_SEAL_PER_MM = 0.25;
export const MP_SEAL_NONCOAX = 0.3;
/**
 * The open fraction (gap) at or below which the patient engine's transducer shows an abnormal guide
 * trace without side holes: probed on the engine (an ostium or coronary tip input, left and right, the
 * trace class after 5 s: damped or ventricularised at a gap of 0.15 or less, aortic from 0.2). MODEL
 * PARAMETER, a calibration against src/simulation/patient/transducer.ts, not a clinical value.
 */
export const MP_DAMPING_GAP = 0.16;
/** Engaging settles the tip up to this depth times the curve's deep-seat ease (mm). MODEL PARAMETER. */
export const MP_DIVE_MM = 3;
/** Engaging settles the coaxiality up to this much below the classifier's (0..1). MODEL PARAMETER. */
export const MP_SETTLE_COAX_SPREAD = 0.3;
/** Rotation of an engaged guide (rad at the tip) that turns it off the ostium. MODEL PARAMETER. */
export const MP_TURN_OFF_RAD = 0.6;
/** Coaxiality lost per radian of rotation off the coaxial position. MODEL PARAMETER. */
export const MP_COAX_PER_RAD = 1;
/** Stored twist above which rotation is not transmitted to the tip (rad), and above which the shaft kinks (rad). MODEL PARAMETERS. */
export const MP_TWIST_NOT_TRANSMITTED_RAD = Math.PI / 2;
export const MP_KINK_TWIST_RAD = 3 * Math.PI;
/** Stored twist released into the tip per millimetre the guide is moved axially (rad/mm). MODEL PARAMETER. */
export const MP_TWIST_RELEASE_PER_MM = 0.15;
/** Depth of a large left curve beyond which it points the wire at the circumflex (mm), and the left main bifurcation angle that counts as wide (degrees). MODEL PARAMETERS. */
export const MP_AIM_DEPTH_MM = 0.5;
export const MP_WIDE_LM_DEG = 80;
/** A Judkins right shallower than this (mm) sends the wire to a separate conus ostium. MODEL PARAMETER. */
export const MP_SHALLOW_JR_MM = 0.5;
/** A guide pulled back out of the ostium drags an unpinned wire back by this share of the pull beyond the ostium. MODEL PARAMETER. */
export const MP_WIRE_DRAG_ON_PULL = 0.6;

/** Left curves large enough to aim the wire at the circumflex in a wide-angled left main (pm-wiring-guide-seat: 'with a large left curve sends it repeatedly into the circumflex'). The list is a MODEL PARAMETER. */
export const LARGE_LEFT_CURVES: readonly string[] = ["EBU3.75", "EBU4.0", "EBU4.5", "JL5", "AL1", "AL2"];

/** The rod solver's shape for a catalogue guide (src/physics/catheterShapes.ts ids). Nearest shape where the solver has none of its own (EBU4.5, WR, HS, AR1, AR2). */
const PHYSICS_SHAPE: Record<string, string> = {
  "JL3.5": "JL3.5",
  JL4: "JL4G",
  JL5: "JL5",
  "EBU3.0": "EBU3.0",
  "EBU3.5": "EBU3.5",
  "EBU3.75": "EBU3.75",
  "EBU4.0": "EBU4.0",
  "EBU4.5": "EBU4.0",
  IKL: "IKL",
  JR4: "JR4G",
  AR1: "AR",
  AR2: "AR",
  AL1: "AL1",
  AL2: "AL2",
  IKR: "IKR",
  WR: "JR4G",
  HS: "AR",
  MP: "MP",
};

/** The physics shape id of a catalogue guide (JL4 is the solver's JL4G). */
export function guideShapeId(id: string): string {
  return PHYSICS_SHAPE[id] ?? PHYSICS_SHAPE[guideSpecId(id)] ?? "JL4G";
}

/** A catalogue guide id from a catalogue or physics id (JL4G is the catalogue's JL4). */
export function guideSpecId(id: string): string {
  if (GUIDE_BY_ID[id]) return id;
  const back = Object.entries(PHYSICS_SHAPE).find(([, shape]) => shape === id);
  return back ? back[0] : "JL4";
}

/**
 * The analytic model's stand-in for a guide: the catalogue's diagnostic or guide shape of the same
 * curve, with its own torque response (the guide's poorer fidelity, MP_GUIDE_TORQUE_FIDELITY, is applied
 * once, to the hub rotation in twistGuide). Curves the catalogue lacks
 * take the nearest one, with the reach between its neighbours (EBU3.75) or beyond (EBU4.5). MODEL
 * PARAMETERS: the mapping and the reach adjustments.
 */
export function guideCatheterType(id: string): CatheterType {
  const sid = guideSpecId(id);
  const base: Record<string, [string, number?, number?]> = {
    "EBU3.75": ["EBU3.5", 19.5, 14.5],
    "EBU4.5": ["EBU4.0", 22.5, 15.5],
    AR1: ["AR"],
    AR2: ["AR", 19],
    HS: ["AR", 19],
    WR: ["JR4"],
  };
  const [from, reach, seat] = base[sid] ?? [sid];
  const c = catheterById(from) ?? catheterById("JL4")!;
  const b = c.behaviour;
  return {
    ...c,
    id: sid,
    behaviour: { ...b, reach: reach ?? b.reach, seatHeight: seat ?? b.seatHeight },
  };
}

/** The hub of a guide just brought up to the aortic root: the tip MP_ROOT_START_ABOVE_MM above the sinuses. */
export function rootStart(model: AnatomyModel, cath: CatheterType): GuideRoot {
  return { insertion: cath.behaviour.seatHeight - (model.sinusTopY + MP_ROOT_START_ABOVE_MM), torque: 0 };
}

/** The analytic model's controls for a root position. */
function controlsOf(r: GuideRoot): ControlState {
  return { ...initialControls(), insertion: r.insertion, cmdInsertion: r.insertion, torque: r.torque, cmdTorque: r.torque };
}

/** The classifier's reading of a guide out of the ostium (computeEngagement, fixed thresholds). */
export function classifyGuide(model: AnatomyModel, gs: GuideState): EngagementState {
  const cath = guideCatheterType(gs.id);
  return computeEngagement(model, cath, controlsOf(gs.root ?? rootStart(model, cath)), "advanced");
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Coaxiality (0..1) from the classifier's alignment with the ostium (the capture alignment maps to about 0.87). */
export function coaxialFromAlignment(alignment: number): number {
  return clamp01((alignment - 0.55) / 0.45);
}

/** The zone of a guide out of the ostium from the classifier, given the side the case works on. */
export function zoneOf(e: EngagementState, side: "left" | "right"): GuideZone {
  if (e.kind === "in-lv" || e.kind === "below-valve") return "lv";
  if (e.conus) return "conus";
  if (e.kind === "ascending-aorta") return "ascending";
  if (e.target && e.target !== side) return "other-side";
  if (e.target === side) return "near";
  return "root";
}

/** A selective (or deep) engagement of the case's coronary. */
export function engagesSide(e: EngagementState, side: "left" | "right"): boolean {
  return !e.conus && e.target === side && (e.isSelective || e.isDeep);
}

/** The seeded draw of an engagement: one per engagement, from the guide, its size and the count so far. */
export function engageRng(gs: GuideState, salt: string | number = ""): RngState {
  return rngFrom(`guide:${gs.id}:${gs.french}:${gs.engagements ?? 0}:${salt}`);
}

/**
 * Engage at the classifier's depth and coaxiality: the tip settles a seeded distance further in (up to
 * MP_DIVE_MM times the curve's deep-seat ease, more for a larger French size) and a seeded amount less
 * coaxial (up to MP_SETTLE_COAX_SPREAD).
 */
export function settleOnEngage(gs: GuideState, o: { depthMm?: number; coaxial?: number }, r: RngState): GuideState {
  const spec = guideSpec(gs);
  const dive = rnd(r) * MP_DIVE_MM * spec.deepSeatEase * (gs.french / 6);
  const depth = Math.max(0, o.depthMm ?? 0) + dive;
  const coax = clamp01((o.coaxial ?? 0.9) - rnd(r) * MP_SETTLE_COAX_SPREAD);
  return { ...gs, engaged: true, depthMm: Math.min(6, depth), coaxial: coax, zone: undefined, nearSince: null, offAxisRad: 0, engagements: (gs.engagements ?? 0) + 1 };
}

/**
 * Share of the ostium the guide's tip blocks (0 open … 1 sealed): its outer diameter (Brilakis Table
 * 30.4, GUIDE_LUMEN) against the ostial lumen, narrowed by an aorto-ostial lesion, times a seal that
 * rises with depth and poor coaxiality. 0 for a guide out of the ostium.
 */
export function guideWedgeFraction(gs: GuideState): number {
  if (!gs.engaged) return 0;
  const od = GUIDE_LUMEN[gs.french].odMm;
  const lumen = Math.max(0.5, (gs.ostiumMm ?? MP_OSTIUM_DEFAULT_MM) * (1 - clamp01(gs.ostialStenosis ?? 0)));
  const seal = MP_SEAL_BASE + MP_SEAL_PER_MM * Math.max(0, Math.min(6, gs.depthMm)) + MP_SEAL_NONCOAX * (1 - clamp01(gs.coaxial));
  return clamp01((od / lumen) * seal);
}

/** The open fraction of the ostium around the tip (the transducer's gap): the rod physics' when it measured one, else 1 minus the wedge. */
export function guideGap(gs: GuideState): number {
  if (!gs.engaged) return 1;
  return gs.openFraction !== undefined ? clamp01(gs.openFraction) : 1 - guideWedgeFraction(gs);
}

/** Whether the trace damps (or ventricularises) at this seat: a gap at or below MP_DAMPING_GAP without side holes. */
export function guideDamps(gs: GuideState): boolean {
  return gs.engaged && !gs.sideHoles && guideGap(gs) <= MP_DAMPING_GAP;
}

/** What the geometry says about where the guide sits: the ostial lumen, the left main bifurcation angle, a separate conus ostium. */
export interface GuideSite {
  ostiumMm: number;
  /** angle between the take-offs of the LAD and the LCx (degrees), when both exist */
  lmBifurcationDeg?: number;
  /** a conus artery with its own ostium in the right sinus */
  separateConus: boolean;
}

/** The guide's site in this geometry for a case on `side`. */
export function guideSite(g: PciGeom, side: "left" | "right"): GuideSite {
  const root = side === "left" ? "LM" : "RCA";
  const ostiumMm = g.byName.has(root) ? 2 * radiusAtMm(g, [root], 0, true) : MP_OSTIUM_DEFAULT_MM;
  const lad = g.byName.get("LAD");
  const lcx = g.byName.get("LCx");
  let lmBifurcationDeg: number | undefined;
  if (lad?.parent?.name === "LM" && lcx?.parent?.name === "LM") {
    const a = takeOff(g, lad).dir;
    const b = takeOff(g, lcx).dir;
    lmBifurcationDeg = (Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) * 180) / Math.PI;
  }
  const conus = g.byName.get("CONUS");
  return { ostiumMm, lmBifurcationDeg, separateConus: !!conus && !conus.parent };
}

/**
 * Where the guide sends the wire on its first advance out of the tip, or null for the wire's own
 * choice: a large left curve seated in a wide-angled left main points at the circumflex; a shallow
 * Judkins right at a separate conus ostium points at the conus (pm-wiring-guide-seat, Brilakis 8.6 in
 * pci-guide-wire-direction). Re-seating the guide (shallower on the left, deeper on the right) clears it.
 */
export function guideWireAim(gs: GuideState, side: "left" | "right", site: Pick<GuideSite, "lmBifurcationDeg" | "separateConus">): string | null {
  if (!gs.engaged) return null;
  const spec = guideSpec(gs);
  if (side === "left" && LARGE_LEFT_CURVES.includes(spec.id) && (site.lmBifurcationDeg ?? 0) >= MP_WIDE_LM_DEG && gs.depthMm >= MP_AIM_DEPTH_MM) return "LCx";
  if (side === "right" && spec.family === "JR" && site.separateConus && gs.depthMm < MP_SHALLOW_JR_MM) return "CONUS";
  return null;
}

/** The wire cannot leave a guide that sits non-coaxially against the wall (pm-wiring-guide-seat). */
export function guideBlocksWire(gs: GuideState): boolean {
  return gs.engaged && gs.coaxial < GUIDE_NON_COAXIAL;
}

/**
 * Rotate the guide's hub by dRad: the tip takes MP_GUIDE_TORQUE_FIDELITY of it, the rest is stored as
 * twist; twist beyond MP_KINK_TWIST_RAD kinks the shaft, and untwisting below half of it frees the kink.
 * A kinked shaft passes no rotation. Returns the guide and the rotation that reached the tip.
 */
export function twistGuide(gs: GuideState, dRad: number): { gs: GuideState; tipRad: number } {
  const twist0 = gs.twistRad ?? 0;
  if (gs.kinked) {
    const twist = twist0 + dRad;
    const freed = Math.abs(twist) < MP_KINK_TWIST_RAD / 2;
    return { gs: { ...gs, twistRad: twist, kinked: !freed }, tipRad: 0 };
  }
  // the share that does not reach the tip adds to the stored twist (a turn the other way takes the same share off it)
  const tipRad = dRad * MP_GUIDE_TORQUE_FIDELITY;
  const twist = twist0 + dRad - tipRad;
  return { gs: { ...gs, twistRad: twist, kinked: Math.abs(twist) > MP_KINK_TWIST_RAD }, tipRad };
}

/** Axial movement releases stored twist into the tip (MP_TWIST_RELEASE_PER_MM). Returns the guide and the released rotation. */
export function releaseTwist(gs: GuideState, mm: number): { gs: GuideState; tipRad: number } {
  const twist = gs.twistRad ?? 0;
  if (!twist || gs.kinked) return { gs, tipRad: 0 };
  const rel = Math.sign(twist) * Math.min(Math.abs(twist), MP_TWIST_RELEASE_PER_MM * Math.abs(mm));
  return { gs: { ...gs, twistRad: twist - rel }, tipRad: rel };
}

/** Rotation is not reaching the tip: enough twist stored in the shaft. */
export function torqueNotTransmitted(gs: GuideState): boolean {
  return !!gs.kinked || Math.abs(gs.twistRad ?? 0) > MP_TWIST_NOT_TRANSMITTED_RAD;
}
