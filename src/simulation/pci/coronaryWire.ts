// ---------------------------------------------------------------------------
// The 0.014 in coronary wire as a reduced rod on the route.
//
// Why not the full S7 XPBD solve. S7 put wires and catheters on a Cosserat
// rod in the aorta and proximal coronaries; its own notes report that a
// 0.014 in wire led out of the guide could not be torque-steered into the LAD
// and buckled at the closed end of its 70-80 mm coronary lumens. The PCI wire
// therefore keeps the S7 mechanics in reduced form where they decide the
// outcome, on the full rendered tree:
//
// 1. Shaft. Inextensible and constrained to the lumen centre line (a 0.36 mm
//    wire in a 2-4 mm lumen), so its position is one number: tipMm along the
//    route. Push and pull move it; resistance at the tip stores compression in
//    the shaft (stallMm) and loads the tip.
// 2. Torque. Hub and tip are joined by a torsion spring kT = GJ / L (L the
//    wire length from torquer to tip). Wall friction resists tip rotation with
//    a static and a kinetic torque, μ·r·N, where the wall load N comes from the
//    guide's curves, the coronary bends (EI·∫κ² ds over a contact length) and
//    any axial load on the curves (capstan term). The tip stays put until the
//    stored torque exceeds the static threshold, then jumps to the kinetic
//    level: lag, and whip in tortuous vessels. Moving the wire axially breaks
//    static friction, so the stored torque is released (operators rotate while
//    advancing).
// 3. Tip. The shaped tip (primary and secondary bend) points in 3D: tangent
//    rotated by the effective bend towards the tip azimuth in the local
//    vessel frame. The bend is limited by the lumen: a tip whose lateral reach
//    exceeds the lumen is straightened against the wall.
// 4. Branches. Passing an origin, the tip enters the branch when its azimuth
//    falls within the ostium's angular window and its 3D direction is within
//    a capture cone of the branch's take-off direction. Close misses catch the
//    ostium edge; pushing on then folds the tip (prolapse) and the loop
//    advances past. At a terminal bifurcation the tip takes the branch its 3D
//    direction is closest to.
// 5. Lesions. A resistance field (gf): the residual channel of a stenosis
//    (friction-weighted) or the cap of an occlusion. The tip delivers at most
//    its tip load times a taper factor before buckling; below the resistance it
//    stalls, then folds (knuckles). Inside an occlusion each millimetre carries
//    a seeded chance of leaving the true lumen that rises with tip load and the
//    off-axis bend.
// 6. Distal safety. Small calibre (< 1.5 mm) or the last 5 mm of a vessel is a
//    danger zone; pushes there are reported as exposures (gf·mm) for the
//    complication engine, and the deepest excursion is recorded.
// 7. Microcatheter (pci-wire-microcatheter). An over-the-wire catheter riding
//    the wire: its tip position (route mm), net turns and damage. The tip load
//    the wire delivers at a lesion rises the closer the microcatheter tip sits
//    behind the wire tip (support), an angulated, deflectable or dual-lumen
//    microcatheter at a branch origin widens the capture cone and every
//    microcatheter there cuts prolapse. It is removed over a short wire by
//    trapping (balloon against the guide wall), hydraulic exchange, an
//    extension wire, or not at all (the wire comes out with it).
// 8. Tortuosity (pci-wire-microcatheter). A wire that has entered a large,
//    acutely angled branch can prolapse back into the main vessel while its
//    tip is in the first millimetres of the branch; slippery coatings, a
//    larger bend, a microcatheter and a deflection balloon make it less
//    likely. A primary bend longer than the lumen is wide catches the wall;
//    forcing a caught stiff tip takes it under the intima, a soft one folds.
//    A reversed (hairpin) wire passes branches on the way in and hooks an
//    acute one on the pull-back. A support wire straightens the bends its
//    stiff segment lies in: pseudolesions.
// 9. The guide's aim (pci-guide-engagement). A guide can point the wire as it
//    leaves the guide tip (WireState.aim, set by the guide actions from
//    guideWireAim in guide.ts): with chance MP_AIM_FOLLOW at each first exit
//    a large left curve sends it into the circumflex at the end of the left
//    main, and a shallow Judkins right into a separate conus ostium; a guide
//    sitting against the wall stops it at the guide tip (exitBlocked). With
//    no aim nothing is drawn from the wire's generator, so seeded runs are
//    unchanged.
//
// Every constant here is a MODEL PARAMETER (MP_*) unless the facts file cites
// it; wire specifications come from equipment.ts.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import type { TreeVessel } from "../../render/xray/coronaryTree";
import { DEVICE_BY_ID, GUIDE_ID_IN, IN_MM, WIRE_SPEC, chartDiameter, type GuideFrench, type WireKind } from "./equipment";
import {
  bendIntegrals,
  branchesOf,
  curvatureAtMm,
  dot,
  frameAt,
  norm,
  radiusAtMm,
  routeEndMm,
  sampleAtMm,
  scale,
  add,
  takeOff,
  wrap,
  type PciGeom,
} from "./geometry";
import { rnd, rngFrom, type RngState } from "./rng";

export type { WireKind } from "./equipment";

export interface TipShape {
  /** distal bend angle (deg) and the length of tip beyond it (mm) */
  primaryDeg: number;
  primaryMm: number;
  /** a second, wider bend further back (deg) at this distance from the tip (mm); 0 = none */
  secondaryDeg: number;
  secondaryMm: number;
  /**
   * a reversed (hairpin) tip: bent back on itself about 3 cm from the tip and loaded bend first
   * (pm-wiring-tortuosity, 'Hairpin: polymer-jacketed wire bent 180 degrees about 3 cm from the tip')
   */
  reversed?: boolean;
}

/** The microcatheter categories of the catalogue (equipment.ts, Brilakis 30.6 table). */
export type MicroId = "mc-large" | "mc-small" | "mc-angulated" | "mc-deflectable" | "mc-dual" | "mc-plaque";
export const MICRO_IDS: readonly MicroId[] = ["mc-large", "mc-small", "mc-angulated", "mc-deflectable", "mc-dual", "mc-plaque"];

/** A microcatheter riding the wire. */
export interface MicroState {
  id: MicroId;
  /** tip position along the wire route (mm from the ostium; negative inside the guide) */
  tipMm: number;
  /** net turns of the hub since it was loaded (+ clockwise seen from the operator) */
  turns: number;
  /** deformed or kinked by over-rotation: it binds the wire and should be replaced */
  damaged: boolean;
  /** procedure time of the last backflow check at this position (null once it has moved) */
  backflowAt: number | null;
}

/** Default shape: a small distal bend — MODEL PARAMETER (a common workhorse shape). */
export const DEFAULT_SHAPE: TipShape = { primaryDeg: 40, primaryMm: 1.5, secondaryDeg: 0, secondaryMm: 0 };

export interface DistalRecord {
  /** deepest the tip has gone into the danger zone (mm past its entry) */
  maxDangerMm: number;
  /** times the tip entered the danger zone */
  entries: number;
  /** ∑ tip capability × push distance in the zone (gf·mm) */
  exposureGfMm: number;
  inDanger: boolean;
  /** where the current excursion entered the zone (route mm) */
  enteredAt: number;
  /** pushes against the closed end of a vessel */
  pushesAtEnd: number;
}

export interface WireState {
  kind: WireKind;
  shape: TipShape;
  route: string[];
  tipMm: number;
  /** operator's cumulative rotation of the torque device (rad) */
  hub: number;
  /** tip bend azimuth in the local vessel frame (rad, 0 = epicardial side) */
  tip: number;
  /** hub minus tip with no stored torque (rad) */
  offset: number;
  /** torsional stiffness hub to tip (N·mm/rad) and the static / kinetic friction torques (N·mm) */
  kT: number;
  mS: number;
  mK: number;
  /** last whip jump (rad); 0 when the last rotation was smooth */
  lastJump: number;
  /** extra static torque from a tip gripped inside a lesion (N·mm); it lets go to 30% once the tip turns */
  grip: number;
  /** the operator holds the wire still ("I have the wire") */
  pinned: boolean;
  /** tip folded back on itself (prolapsed or knuckled) */
  fold: null | { atMm: number; reason: FoldReason; loopMm: number; pulledMm?: number };
  /** tip hung on the edge of a branch origin */
  caught: null | { vessel: string; atMm: number };
  /** wire tracking in the subintimal space from this position */
  subintimal: null | { fromMm: number };
  /** shaft compression stored against a resistance (mm) and the force at the tip (gf) */
  stallMm: number;
  tipForceGf: number;
  /** axial load on the shaft (N), for the capstan term of friction */
  axialN: number;
  distal: DistalRecord;
  /** the lesion has been crossed in the true lumen */
  crossed: boolean;
  /** the guide is engaged (the wire can leave it into the coronary) */
  guideEngaged: boolean;
  /** total turning of the guide curves the wire passes (rad) */
  guideTurning: number;
  rng: RngState;
  /** wire length (cm): short wires are 180-190 cm, exchange length 300 cm (pm-wiring-wire-choice) */
  lengthCm: number;
  /** the microcatheter on the wire, if any */
  micro: MicroState | null;
  /** a deflection balloon inflated in the main vessel just beyond a branch origin */
  deflector: null | { vessel: string; atMm: number; branch: string };
  /** tip held against the wall by a primary bend longer than the lumen is wide */
  wallCaught: null | { atMm: number };
  /**
   * Where the guide points the wire as it leaves the guide tip (pci-guide-engagement): a vessel the
   * first advance tends to enter whatever the tip's own direction (a terminal branch of the first
   * vessel, or another root vessel such as a separate conus), until the guide is re-seated. Absent or
   * null: the tip's own direction decides.
   */
  aim?: string | null;
  /** the coronary the guide is seated in (the first vessel of the route when the wire leaves the guide) */
  home?: string;
  /** the guide sits non-coaxially against the wall: the wire cannot leave its tip (pci-guide-engagement) */
  exitBlocked?: boolean;
  /**
   * The tip was damaged at the table (pci-equipment-tray): loaded without the introducer, with the tip not
   * hidden in it, or with the introducer short of the valve so the tip caught in the side arm
   * (pm-wiring-shape-load: "Neither shows until the wire refuses to steer in the artery"). A damaged tip
   * holds more torque before it turns (torqueLag, MP_TIP_DAMAGE_TORQUE). Absent or null: intact.
   */
  tipDamaged?: { cause: TipDamageCause; t: number } | null;
}

/** How a wire tip was damaged at the table (pci-equipment-tray). */
export type TipDamageCause = "no-introducer" | "tip-not-hidden" | "introducer-short" | "forced-past-device";

/**
 * A damaged tip's friction torque, as a multiple of an intact tip's (static and kinetic): it lags and
 * whips more, so it steers worse. MODEL PARAMETER (docs/realism/facts/pkg-pci-equipment-tray.md); the module
 * gives the effect (the wire "refuses to steer"), not its size.
 */
export const MP_TIP_DAMAGE_TORQUE = 1.6;

/** The friction-torque factor of a wire's tip (1 intact, MP_TIP_DAMAGE_TORQUE damaged). */
export function tipDamageFactor(w: Pick<WireState, "tipDamaged">): number {
  return w.tipDamaged ? MP_TIP_DAMAGE_TORQUE : 1;
}

export type FoldReason = "cap" | "branch" | "end" | "lesion" | "wall";

export type WireEvent =
  | { kind: "branch"; vessel: string; terminal: boolean }
  | { kind: "catch"; vessel: string }
  | { kind: "fold"; reason: FoldReason; atMm: number }
  | { kind: "prolapse"; vessel: string; atMm: number }
  | { kind: "wall-catch"; atMm: number }
  | { kind: "hairpin-entry"; vessel: string; dissected: boolean }
  | { kind: "deflected"; vessel: string }
  | { kind: "unfold" }
  | { kind: "stall"; needGf: number; haveGf: number }
  | { kind: "crossed" }
  | { kind: "subintimal"; atMm: number }
  | { kind: "true-lumen" }
  | { kind: "danger-zone"; entered: boolean; atMm: number }
  | { kind: "distal-push"; mm: number; gfMm: number; atEnd: boolean; radiusMm: number; atMm: number }
  | { kind: "guide-blocked" }
  | { kind: "guide-tip-blocked" }
  | { kind: "aimed"; vessel: string }
  | { kind: "whip"; rad: number };

/** The target lesion as the wire meets it now. */
export interface LesionNow {
  vessel: string;
  startMm: number;
  endMm: number;
  /** minimal lumen diameter (mm) */
  mldMm: number;
  /** occlusion with a cap (CTO) or fresh thrombotic occlusion */
  occlusion: "none" | "cto" | "thrombotic";
  calcium: 0 | 1 | 2;
}

// --- model parameters -----------------------------------------------------------------
/** wire contact radius (mm): 0.014 in / 2 */
export const WIRE_R = 0.1778;
/** wall load per radian of guide curve the wire passes (N/rad) */
export const MP_GUIDE_N_PER_RAD = 0.04;
/** contact length over which a bend's elastic load is carried (mm) */
export const MP_CONTACT_LEN = 25;
/** share of an axial load that presses the wire on the curves it passes (capstan term) */
export const MP_CAPSTAN = 0.1;
/** largest axial load a stalled wire carries before it buckles in the guide (N) */
export const MP_MAX_AXIAL_N = 0.15;
/** torque gripping a tip inside a lesion per gf of the lesion's resistance (N·mm/gf), and the share left once it slips */
export const MP_GRIP_NMM_PER_GF = 0.01;
export const MP_GRIP_SLIP = 0.3;
/** wire length from torque device to the guide tip (mm) */
export const MP_WIRE_TO_GUIDE_TIP = 1100;
/** shaft stiffness against stall compression (gf per mm stored) */
export const MP_STALL_GF_PER_MM = 1.2;
/** stall compression at which a tip that cannot penetrate folds (mm) */
export const MP_FOLD_STALL_MM = 2;
/** capture cone for branch entry: at most this (rad), and at most the bend plus the margin */
export const MP_CAPTURE_MAX = 1.0;
export const MP_CAPTURE_MARGIN = 0.35;
/** extra cone beyond capture in which the tip catches the ostium edge instead (rad) */
export const MP_CATCH_EXTRA = 0.45;
/** azimuth tolerance added to the geometric ostium window (rad) */
export const MP_AZ_TOL = 0.12;
/** smallest branch a tip can enter (diameter mm; slippery tips: minus 0.2) */
export const MP_MIN_BRANCH_D = 0.8;
/** danger zone: lumen diameter below this (mm) or within this distance of a vessel's end (mm) */
export const MP_DANGER_D = 1.5;
export const MP_DANGER_END_MM = 5;
/** channel resistance of a stenosis to a 0.014 in tip (gf) at MLD = wire diameter */
export const MP_CHANNEL_GF = 0.4;
/** cap strength of a chronic occlusion (gf), raised by calcium; fresh thrombus */
export const MP_CTO_CAP_GF = 4;
export const MP_THROMBUS_GF = 0.3;
/** subintimal chance per mm inside an occlusion at 1 gf effective capability, straight tip */
export const MP_SUBINTIMAL_PER_MM = 0.004;
/** chance per lesion end that a tapered stiff tip re-enters the true lumen */
export const MP_REENTRY_TAPERED = 0.25;
/** reference coating friction for the channel term (workhorse static μ) */
const MU_REF = 0.12;

// --- microcatheter, tortuosity and trapping (pci-wire-microcatheter; docs/realism/facts/pkg-pci-wire-microcatheter.md) ---
/** tip load gain from a microcatheter right behind the wire tip, and the distance over which it fades (mm) — MODEL PARAMETERS */
export const MP_MC_SUPPORT_GAIN = 0.6;
export const MP_MC_SUPPORT_DECAY_MM = 5;
/** the microcatheter tip stops this far behind the wire tip (mm) — MODEL PARAMETER */
export const MP_MC_MIN_GAP_MM = 1;
/**
 * a wire exchanged or reshaped through the microcatheter keeps its position only when its tip is at most this
 * far beyond the microcatheter tip (mm); further out, the new wire comes out of the microcatheter tip and the
 * course beyond it must be navigated again (the microcatheter keeps the course only as far as its own tip) —
 * MODEL PARAMETER
 */
export const MP_MC_EXCHANGE_KEEP_MM = 10;
/** a withdrawn microcatheter parks this far inside the guide (mm) — MODEL PARAMETER */
export const MP_MC_PARK_MM = -30;
/** share of a microcatheter withdrawal that drags an unpinned wire back — MODEL PARAMETER */
export const MP_MC_DRAG_COUPLING = 0.25;
/** net turns in one direction before over-rotation damages a microcatheter: 20 for the plaque modification type (pm-wiring-microcatheters), MODEL PARAMETER for the others */
export const MP_MC_MAX_TURNS = 10;
export const MC_PLAQUE_MAX_TURNS = 20;
/** a microcatheter tip within this distance proximal to a branch origin acts on the wire entering it (mm) — MODEL PARAMETER */
export const MP_MC_BRANCH_REACH_MM = 5;
/** extra capture cone of an angulated or deflectable (and a dual-lumen) microcatheter at a branch (rad) — MODEL PARAMETERS */
export const MP_MC_ANGULATED_CAPTURE = 0.6;
export const MP_MC_DUAL_CAPTURE = 0.3;
/** prolapse multiplier with a microcatheter at the branch origin, by category — MODEL PARAMETERS */
export const MP_MC_PROLAPSE: Record<MicroId, number> = { "mc-large": 0.5, "mc-small": 0.55, "mc-angulated": 0.25, "mc-deflectable": 0.25, "mc-dual": 0.3, "mc-plaque": 0.5 };
/** prolapse model: branches at least this wide (mm) leaving at a polar angle of at least this (rad) — MODEL PARAMETERS */
export const MP_PROLAPSE_MIN_D = 1.6;
export const MP_PROLAPSE_POLAR = 1.4;
/** prolapse chance per mm pushed while the tip is within the first MP_PROLAPSE_ZONE_MM of such a branch (workhorse, 40 degree bend) — MODEL PARAMETERS */
export const MP_PROLAPSE_PER_MM = 0.09;
export const MP_PROLAPSE_ZONE_MM = 8;
/** a deflection balloon cuts prolapse to this share — MODEL PARAMETER */
export const MP_DEFLECT_PROLAPSE = 0.2;
/** wall catch chance per mm for each unit by which the primary bend length exceeds the lumen diameter (capped) — MODEL PARAMETERS */
export const MP_WALL_CATCH_PER_MM = 0.25;
export const MP_WALL_CATCH_MAX = 0.6;
/** a caught tip forced with at least this capability (gf) goes under the intima instead of folding — MODEL PARAMETER */
export const MP_FORCE_DISSECT_GF = 2;
/** hairpin: hook chance at an acute branch on the pull-back, extra azimuth window (rad) and dissection chance — MODEL PARAMETERS */
export const MP_HAIRPIN_HOOK = 0.8;
export const MP_HAIRPIN_AZ_EXTRA = 0.8;
export const MP_HAIRPIN_DISSECT = 0.15;
/** soft distal segment of a support wire (mm) and the curvature (1/mm) its stiff shaft straightens into a pseudolesion — MODEL PARAMETERS */
export const MP_SOFT_SEGMENT_MM = 30;
export const MP_PSEUDO_KAPPA = 0.15;
/** trapping: oversize (balloon diameter at pressure over the guide's inner diameter, minus 1) for full contact — MODEL PARAMETER */
export const MP_TRAP_OVERSIZE_FULL = 0.25;
/** trapping hold per atm of contact pressure over a 20 mm balloon, as a share of the drag of a microcatheter withdrawal — MODEL PARAMETER */
export const MP_TRAP_HOLD_PER_ATM = 1 / 12;
/** trapping: the shortest balloon at full grip (mm): 20 mm or more (pm-wiring-microcatheters 'Size, length and place') */
export const TRAP_MIN_LENGTH_MM = 20;
/** trapping: hold share left for a polymer-jacketed wire — MODEL PARAMETER (slippery wires slip: pm-wiring-microcatheters) */
export const MP_TRAP_SLIPPERY = 0.8;
/** trapping: wire slip at zero hold (mm), and the elastic give of a held wire (mm) — MODEL PARAMETERS */
export const MP_TRAP_SLIP_MM = 40;
export const MP_TRAP_ELASTIC_MM = 0.3;
/** hydraulic exchange pressure range (atm): 14-20 atm (pm-wiring-microcatheters, 'Pressurise to 14-20 atm') */
export const HYDRAULIC_ATM: readonly [number, number] = [14, 20];
/** hydraulic exchange: migration when held in range, when the pressure is too low, and the forward jump of a slippery or stiff wire (mm) — MODEL PARAMETERS */
export const MP_HYDRAULIC_MM = 0.5;
export const MP_HYDRAULIC_LOW_MM = 12;
export const MP_HYDRAULIC_ADVANCE_MM = 10;
/** exchange length (cm): 300 cm (pm-wiring-wire-choice) */
export const EXCHANGE_LENGTH_CM = 300;
/** short wire length (cm): about 180-190 cm (pm-wiring-wire-choice) */
export const SHORT_WIRE_CM = 190;
/**
 * Chance that a wire leaving the guide follows the guide's aim (WireState.aim) instead of its tip's own
 * direction, at each first exit (pci-guide-engagement). MODEL PARAMETER.
 */
export const MP_AIM_FOLLOW = 0.8;
/** How far the wire gets beyond the tip of a guide that blocks its exit (mm). MODEL PARAMETER. */
export const MP_BLOCKED_EXIT_MM = 1;

// ---------------------------------------------------------------------------
// Construction and shape
// ---------------------------------------------------------------------------
export function initialWire(
  kind: WireKind,
  side: "left" | "right",
  opts: { seed?: string | number; guideEngaged?: boolean; guideTurning?: number; shape?: TipShape; lengthCm?: number; aimVessel?: string | null } = {}
): WireState {
  const spec = WIRE_SPEC[kind];
  const L = MP_WIRE_TO_GUIDE_TIP;
  const w: WireState = {
    kind,
    shape: opts.shape ?? { ...DEFAULT_SHAPE },
    route: [side === "left" ? "LM" : "RCA"],
    tipMm: -25,
    hub: 0,
    tip: 0,
    offset: 0,
    kT: spec.GJ / L,
    mS: 0,
    mK: 0,
    lastJump: 0,
    grip: 0,
    pinned: false,
    fold: null,
    caught: null,
    subintimal: null,
    stallMm: 0,
    tipForceGf: 0,
    axialN: 0,
    distal: { maxDangerMm: 0, entries: 0, exposureGfMm: 0, inDanger: false, enteredAt: 0, pushesAtEnd: 0 },
    crossed: false,
    guideEngaged: opts.guideEngaged ?? true,
    guideTurning: opts.guideTurning ?? 3.6,
    rng: rngFrom(opts.seed ?? "wire"),
    lengthCm: opts.lengthCm ?? SHORT_WIRE_CM,
    micro: null,
    deflector: null,
    wallCaught: null,
  };
  if (opts.aimVessel) {
    w.aim = opts.aimVessel;
    w.home = w.route[0];
  }
  return w;
}

/** A root vessel of the geometry (its own ostium), other than the route's first. */
function rootAim(g: PciGeom, w: WireState): string | null {
  if (!w.aim || w.aim === w.route[0]) return null;
  const v = g.byName.get(w.aim);
  return v && !v.parent ? w.aim : null;
}

/** Copy for a pure update (nested records copied). */
export function cloneWire(w: WireState): WireState {
  return {
    ...w,
    shape: { ...w.shape },
    route: w.route.slice(),
    fold: w.fold ? { ...w.fold } : null,
    caught: w.caught ? { ...w.caught } : null,
    subintimal: w.subintimal ? { ...w.subintimal } : null,
    distal: { ...w.distal },
    rng: { ...w.rng },
    lengthCm: w.lengthCm ?? SHORT_WIRE_CM,
    micro: w.micro ? { ...w.micro } : null,
    deflector: w.deflector ? { ...w.deflector } : null,
    wallCaught: w.wallCaught ? { ...w.wallCaught } : null,
    ...(w.tipDamaged ? { tipDamaged: { ...w.tipDamaged } } : {}),
  };
}

/** Effective tip capability (gf): tip load times the taper factor (a smaller tip concentrates the force). */
export function tipCapability(kind: WireKind): number {
  const s = WIRE_SPEC[kind];
  return s.tipLoadGf * Math.pow(0.014 / s.tipIn, 2);
}

/** Effective bend (rad) of the shaped tip in a lumen of the given diameter. */
export function effectiveBend(shape: TipShape, lumenD: number): number {
  const avail = Math.max(0.05, lumenD - 2 * WIRE_R);
  let a1 = (shape.primaryDeg * Math.PI) / 180;
  const reach = shape.primaryMm * Math.sin(a1);
  if (reach > avail) a1 = Math.asin(Math.min(1, avail / Math.max(0.1, shape.primaryMm)));
  // a secondary bend tilts the whole tip further towards the wall it points at (half its angle when constrained)
  const a2 = (shape.secondaryDeg * Math.PI) / 180;
  const reach2 = shape.secondaryMm * Math.sin(a2);
  const a2eff = reach2 > avail ? Math.asin(Math.min(1, avail / Math.max(0.1, shape.secondaryMm))) : a2;
  return Math.min(Math.PI / 2, a1 + 0.6 * a2eff);
}

/** A microcatheter whose tip is in the coronary, over the wire (the wire can be exchanged or reshaped through it). */
export function microInVessel(w: WireState): boolean {
  return !!w.micro && w.micro.tipMm > 0 && w.tipMm >= w.micro.tipMm;
}

/** The wire tip lies further beyond the microcatheter tip than an exchange or reshape through it keeps (MP_MC_EXCHANGE_KEEP_MM). */
export function microFarBehindTip(w: WireState): boolean {
  return !!w.micro && w.tipMm - w.micro.tipMm > MP_MC_EXCHANGE_KEEP_MM;
}

/**
 * A wire put back through the microcatheter after an exchange or reshape, when the old tip was further beyond
 * the microcatheter than MP_MC_EXCHANGE_KEEP_MM: it comes out of the microcatheter tip (MP_MC_MIN_GAP_MM beyond
 * it), the route is cut back to the vessel that holds that point, and a crossing or subintimal course beyond it
 * is lost (as a pull-back would lose them). Mutates w.
 */
function readvanceFromMicro(g: PciGeom, w: WireState): void {
  const mm = w.micro!.tipMm + MP_MC_MIN_GAP_MM;
  w.tipMm = mm;
  while (w.route.length > 1) {
    const v = g.byName.get(w.route[w.route.length - 1]);
    if (v && mm < v.pathMm[0]) w.route.pop();
    else break;
  }
  if (w.subintimal && mm < w.subintimal.fromMm - 0.5) w.subintimal = null;
  if (w.crossed && (!w.route.includes(g.lesion.vessel) || mm < g.lesion.startMm)) w.crossed = false;
  trackDanger(g, w, []);
  w.kT = WIRE_SPEC[w.kind].GJ / (MP_WIRE_TO_GUIDE_TIP + Math.max(0, w.tipMm));
}

/**
 * Reshape the tip: with the wire out of the coronary (pulled back into the guide and out), or through a
 * microcatheter in the vessel, which keeps the position: the wire is withdrawn through it, reshaped and
 * readvanced to where it was (pm-wiring-shape-load: reshaping through a microcatheter without losing position).
 */
export function shapeTip(w: WireState, shape: TipShape, g?: PciGeom): { w: WireState; ok: boolean; reason?: "in-coronary" | "micro-far" } {
  if (w.tipMm > 0 && !microInVessel(w)) return { w, ok: false, reason: "in-coronary" };
  // through a microcatheter far behind the tip the position is not kept: re-advanced from its tip (needs the geometry)
  const far = w.tipMm > 0 && microFarBehindTip(w);
  if (far && !g) return { w, ok: false, reason: "micro-far" };
  const n = cloneWire(w);
  if (far && g) readvanceFromMicro(g, n);
  n.shape = { ...shape };
  n.fold = null;
  n.wallCaught = null;
  n.caught = null;
  n.stallMm = 0;
  n.tipForceGf = 0;
  return { w: n, ok: true };
}

/** Support factor (>= 1) a microcatheter gives the wire tip: largest with its tip right behind the wire tip. */
export function microSupport(w: WireState): number {
  const m = w.micro;
  if (!m || m.tipMm <= 0 || w.tipMm <= 0) return 1;
  const gap = Math.max(0, w.tipMm - m.tipMm);
  return 1 + MP_MC_SUPPORT_GAIN * Math.exp(-gap / MP_MC_SUPPORT_DECAY_MM);
}

// ---------------------------------------------------------------------------
// Friction and torque
// ---------------------------------------------------------------------------
/** Recompute torsional stiffness and friction torques for the wire's current extent. */
export function updateFriction(g: PciGeom, w: WireState): void {
  const spec = WIRE_SPEC[w.kind];
  const L = MP_WIRE_TO_GUIDE_TIP + Math.max(0, w.tipMm);
  w.kT = spec.GJ / L;
  const b = w.tipMm > 0 ? bendIntegrals(g, w.route, 0, w.tipMm) : { turning: 0, k2: 0, kMax: 0 };
  const N = MP_GUIDE_N_PER_RAD * w.guideTurning + (spec.EItip * b.k2) / MP_CONTACT_LEN + MP_CAPSTAN * Math.abs(w.axialN) * (b.turning + w.guideTurning * 0.5);
  w.mS = spec.muStatic * WIRE_R * N;
  w.mK = spec.muKinetic * WIRE_R * N;
}

/** Torque lag now (rad): how far the hub leads the tip before the tip moves. */
export function torqueLag(w: WireState): number {
  return (w.mS * tipDamageFactor(w) + w.grip) / Math.max(1e-9, w.kT);
}

function settle(w: WireState, statically: boolean): number {
  const e = w.hub - w.offset - w.tip;
  const M = w.kT * e;
  const f = tipDamageFactor(w);
  const thr = statically ? w.mS * f + w.grip : w.mK * f + MP_GRIP_SLIP * w.grip;
  if (Math.abs(M) <= thr) return 0;
  const target = w.hub - w.offset - Math.sign(e) * ((w.mK * f + MP_GRIP_SLIP * w.grip) / w.kT);
  const jump = target - w.tip;
  w.tip = target;
  return jump;
}

/** Rotate the torque device by dRad (clockwise positive as seen from the operator). */
export function rotateHub(w0: WireState, dRad: number): { w: WireState; events: WireEvent[] } {
  const w = cloneWire(w0);
  const events: WireEvent[] = [];
  // rotate in small increments so a large turn shows the same stick-slip as several small ones
  const n = Math.max(1, Math.ceil(Math.abs(dRad) / 0.05));
  let biggest = 0;
  for (let i = 0; i < n; i++) {
    w.hub += dRad / n;
    const j = settle(w, true);
    if (Math.abs(j) > Math.abs(biggest)) biggest = j;
  }
  // a jump larger than the increment is a whip release
  w.lastJump = Math.abs(biggest) > 0.25 ? biggest : 0;
  // turning the tip frees one held against the wall
  if (w.wallCaught && Math.abs(dRad) >= 0.1) w.wallCaught = null;
  if (w.lastJump) events.push({ kind: "whip", rad: w.lastJump });
  return { w, events };
}

// ---------------------------------------------------------------------------
// Tip direction
// ---------------------------------------------------------------------------
/** World-space (rest geometry) tangent and tip direction at the tip, or null inside the guide. */
export function tipDirection(g: PciGeom, w: WireState): { p: Vec3; T: Vec3; N: Vec3; B: Vec3; d: Vec3; bend: number; lumenD: number } | null {
  const at = sampleAtMm(g, w.route, Math.max(0, w.tipMm));
  if (!at || w.tipMm <= 0) return null;
  const { p, T, N, B } = frameAt(g, at.v, at.idx);
  const lumenD = 2 * radiusAtMm(g, w.route, w.tipMm);
  const bend = effectiveBend(w.shape, lumenD);
  const lateral = add(scale(N, Math.cos(w.tip)), scale(B, Math.sin(w.tip)));
  const d = norm(add(scale(T, Math.cos(bend)), scale(lateral, Math.sin(bend))));
  return { p, T, N, B, d, bend, lumenD };
}

type BranchDecision = "enter" | "catch" | "pass";

function branchDecision(g: PciGeom, w: WireState, child: TreeVessel): BranchDecision {
  // a folded loop or a reversed (hairpin) tip leads with its bend: it passes branches on the way in
  if (w.fold || w.shape.reversed) return "pass";
  const spec = WIRE_SPEC[w.kind];
  const to = takeOff(g, child);
  const minD = MP_MIN_BRANCH_D - (spec.branchSeek > 0.05 ? 0.2 : 0);
  if (2 * to.childRadius < minD) return "pass";
  // a deflection balloon just beyond the origin closes the main vessel: the wire goes into the branch
  if (w.deflector && w.deflector.branch === child.name) return "enter";
  const parent = g.byName.get(child.parent!.name)!;
  const fr = frameAt(g, parent, Math.min(parent.samples.length - 2, child.parent!.index));
  const lumenD = 2 * to.parentRadius;
  const bend = effectiveBend(w.shape, lumenD);
  const lateral = add(scale(fr.N, Math.cos(w.tip)), scale(fr.B, Math.sin(w.tip)));
  const d = norm(add(scale(fr.T, Math.cos(bend)), scale(lateral, Math.sin(bend))));
  const dphi = Math.abs(wrap(w.tip - to.azimuth));
  const win = Math.asin(Math.min(1, to.childRadius / Math.max(0.3, to.parentRadius))) + MP_AZ_TOL + spec.branchSeek;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(d, to.dir))));
  const cap = Math.min(MP_CAPTURE_MAX, bend + MP_CAPTURE_MARGIN) + Math.max(0, spec.branchSeek) + microCapture(g, w, child);
  if (dphi < win && angle < cap) return "enter";
  if (dphi < win && angle < cap + MP_CATCH_EXTRA) return "catch";
  return "pass";
}

/** Origin of a branch on its parent (route mm). */
function originMm(g: PciGeom, child: TreeVessel): number {
  const parent = g.byName.get(child.parent!.name)!;
  return parent.pathMm[child.parent!.index];
}

/** The microcatheter tip is at a branch origin: within MP_MC_BRANCH_REACH_MM proximal to it, or in the branch. */
function microAtBranch(g: PciGeom, w: WireState, child: TreeVessel): boolean {
  const m = w.micro;
  if (!m || m.tipMm <= 0) return false;
  const at = originMm(g, child);
  return m.tipMm >= at - MP_MC_BRANCH_REACH_MM && m.tipMm <= at + MP_PROLAPSE_ZONE_MM;
}

/** Extra capture cone (rad) an angulated, deflectable or dual-lumen microcatheter at the origin gives. */
function microCapture(g: PciGeom, w: WireState, child: TreeVessel): number {
  if (!w.micro || !microAtBranch(g, w, child)) return 0;
  const id = w.micro.id;
  if (id === "mc-angulated" || id === "mc-deflectable") return MP_MC_ANGULATED_CAPTURE;
  if (id === "mc-dual") return MP_MC_DUAL_CAPTURE;
  return 0;
}

/** A branch the prolapse model applies to: wide and leaving at an acute angle. */
export function prolapseBranch(g: PciGeom, child: TreeVessel): boolean {
  const to = takeOff(g, child);
  return to.polar >= MP_PROLAPSE_POLAR && 2 * to.childRadius >= MP_PROLAPSE_MIN_D;
}

/**
 * Chance per mm pushed that a wire whose tip is in the first MP_PROLAPSE_ZONE_MM of an acutely angled
 * branch prolapses back into the main vessel: lower for a slippery coating, a larger bend, a
 * microcatheter at the origin (by category) and a deflection balloon; higher for a more acute branch.
 */
export function prolapseChancePerMm(g: PciGeom, w: WireState, child: TreeVessel): number {
  if (!prolapseBranch(g, child)) return 0;
  const spec = WIRE_SPEC[w.kind];
  const to = takeOff(g, child);
  const bend = effectiveBend(w.shape, 2 * to.childRadius);
  const bendF = Math.max(0.3, Math.min(1.5, 1.5 - bend));
  const fric = spec.muStatic / MU_REF;
  const acute = 1 + (to.polar - MP_PROLAPSE_POLAR);
  const micro = w.micro && microAtBranch(g, w, child) ? MP_MC_PROLAPSE[w.micro.id] : 1;
  const defl = w.deflector && w.deflector.branch === child.name ? MP_DEFLECT_PROLAPSE : 1;
  return Math.min(0.9, MP_PROLAPSE_PER_MM * bendF * fric * acute * micro * defl);
}

/** Wall catch chance per mm for the shaped tip in a lumen of this diameter (0 when the bend fits). */
export function wallCatchPerMm(shape: TipShape, lumenD: number): number {
  if (shape.reversed || lumenD < MP_DANGER_D) return 0;
  const excess = shape.primaryMm / Math.max(0.3, lumenD) - 1;
  return excess > 0 ? Math.min(MP_WALL_CATCH_MAX, MP_WALL_CATCH_PER_MM * excess) : 0;
}

/** Best-aligned terminal branch by 3D tip direction (largest cos to the take-off). */
function terminalChoice(g: PciGeom, w: WireState, kids: TreeVessel[]): TreeVessel {
  if (kids.length === 1) return kids[0];
  const parent = g.byName.get(kids[0].parent!.name)!;
  const fr = frameAt(g, parent, parent.samples.length - 2);
  const lumenD = 2 * (parent.radii[parent.radii.length - 1] ?? 1.5);
  const bend = w.fold ? 0 : effectiveBend(w.shape, lumenD);
  const lateral = add(scale(fr.N, Math.cos(w.tip)), scale(fr.B, Math.sin(w.tip)));
  const d = norm(add(scale(fr.T, Math.cos(bend)), scale(lateral, Math.sin(bend))));
  let best = kids[0],
    bestScore = -Infinity;
  for (const c of kids) {
    const to = takeOff(g, c);
    // a folded loop follows the larger lumen; a shaped tip (a reversed one too) follows its direction
    const score = w.fold ? to.childRadius : dot(d, to.dir) + 0.05 * to.childRadius;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Lesion resistance
// ---------------------------------------------------------------------------
/** Resistance (gf) the lesion offers the tip at route position mm on its vessel. */
export function lesionResistance(les: LesionNow, mm: number, kind: WireKind): number {
  if (mm < les.startMm || mm > les.endMm) return 0;
  const spec = WIRE_SPEC[kind];
  if (les.occlusion === "thrombotic") return MP_THROMBUS_GF;
  if (les.occlusion === "cto") {
    const cap = MP_CTO_CAP_GF * (1 + 0.5 * les.calcium);
    // the proximal cap is the hardest part; the body is about half as resistant
    return mm - les.startMm < 2 ? cap : 0.5 * cap;
  }
  // residual channel: friction-weighted, falls steeply as the channel opens
  const tipD = spec.tipIn * 25.4;
  const ratio = (2 * WIRE_R) / Math.max(0.03, les.mldMm);
  const depth = Math.sin((Math.PI * (mm - les.startMm)) / Math.max(1, les.endMm - les.startMm));
  return MP_CHANNEL_GF * ratio * ratio * depth * (spec.muStatic / MU_REF) * (tipD / 0.3556);
}

// ---------------------------------------------------------------------------
// Push and pull
// ---------------------------------------------------------------------------
/** Danger zone test; `exit` widens the thresholds (hysteresis) so the tip must clearly leave the zone. */
function isDanger(g: PciGeom, w: WireState, mm: number, exit = false): boolean {
  const end = routeEndMm(g, w.route);
  const v = g.byName.get(w.route[w.route.length - 1]);
  const terminal = v ? !(g.children.get(v.name) ?? []).some((c) => c.parent!.index >= v.samples.length - 2) : true;
  if (terminal && end - mm < MP_DANGER_END_MM + (exit ? 3 : 0)) return true;
  // the reference (unstenosed) lumen: a tight lesion is not a small distal vessel
  return 2 * radiusAtMm(g, w.route, mm, true) < MP_DANGER_D + (exit ? 0.3 : 0);
}

function trackDanger(g: PciGeom, w: WireState, events: WireEvent[]): void {
  if (w.tipMm <= 0) return;
  const inD = isDanger(g, w, w.tipMm, w.distal.inDanger);
  if (inD && !w.distal.inDanger) {
    w.distal.inDanger = true;
    w.distal.entries++;
    w.distal.enteredAt = w.tipMm;
    events.push({ kind: "danger-zone", entered: true, atMm: w.tipMm });
  } else if (!inD && w.distal.inDanger) {
    w.distal.inDanger = false;
    events.push({ kind: "danger-zone", entered: false, atMm: w.tipMm });
  }
  if (w.distal.inDanger) w.distal.maxDangerMm = Math.max(w.distal.maxDangerMm, w.tipMm - w.distal.enteredAt);
}

/**
 * Advance the wire by d mm (d > 0). `les` is the target lesion as it is now. Returns the new state and what
 * happened (branch entries, folds, stalls, crossing, danger-zone exposure). The push is followed event by
 * event along the current vessel: the next branch origin, the lesion, the target or the vessel's end.
 */
export function pushWire(g: PciGeom, w0: WireState, d: number, les: LesionNow): { w: WireState; events: WireEvent[] } {
  const w = cloneWire(w0);
  const events: WireEvent[] = [];
  const spec = WIRE_SPEC[w.kind];
  let remaining = d;
  // moving the wire breaks static friction: stored torque is released
  updateFriction(g, w);
  const j = settle(w, false);
  if (Math.abs(j) > 0.25) events.push({ kind: "whip", rad: j });

  // inside the guide
  if (w.tipMm < 0) {
    const toExit = -w.tipMm;
    if (!w.guideEngaged && w.tipMm + remaining > 3) {
      w.tipMm = 3;
      events.push({ kind: "guide-blocked" });
      return { w, events };
    }
    if (remaining <= toExit) {
      w.tipMm += remaining;
      return { w, events };
    }
    w.tipMm = 0;
    remaining -= toExit;
  }
  // leaving the guide tip (pci-guide-engagement): the guide's aim may send it to another ostium (a
  // separate conus); with no aim it goes into the coronary the guide is seated in
  if (w.tipMm <= 1e-9 && remaining > 1e-9 && w.route.length === 1 && (w.aim || w.home)) {
    const aimed = rootAim(g, w);
    if (aimed && rnd(w.rng) < MP_AIM_FOLLOW) {
      w.route = [aimed];
      events.push({ kind: "aimed", vessel: aimed }, { kind: "branch", vessel: aimed, terminal: false });
    } else if (w.home && w.route[0] !== w.home && g.byName.has(w.home)) w.route = [w.home];
  }
  // a guide against the wall: the tip buckles at the guide tip
  if (w.exitBlocked && w.route.length === 1 && w.tipMm < MP_BLOCKED_EXIT_MM && w.tipMm + remaining > MP_BLOCKED_EXIT_MM) {
    w.tipMm = Math.max(w.tipMm, MP_BLOCKED_EXIT_MM);
    events.push({ kind: "guide-tip-blocked" });
    return { w, events };
  }
  if (!w.guideEngaged && w.route.length === 1 && w.tipMm + remaining > 3) {
    w.tipMm = Math.max(w.tipMm, 3);
    events.push({ kind: "guide-blocked" });
    return { w, events };
  }

  // a tip hung on a branch origin: it turns in, keeps catching (and folds once the shaft has stored enough
  // compression) or, turned away, lets go
  if (w.caught && Math.abs(w.tipMm - w.caught.atMm) < 1e-6) {
    const child = g.byName.get(w.caught.vessel);
    const dec = child ? branchDecision(g, w, child) : "pass";
    if (dec === "enter" && child) {
      w.route.push(child.name);
      w.caught = null;
      w.stallMm = 0;
      events.push({ kind: "branch", vessel: child.name, terminal: false });
    } else if (dec === "catch") {
      w.stallMm += remaining;
      w.tipForceGf = Math.min(spec.tipLoadGf, MP_STALL_GF_PER_MM * w.stallMm);
      if (w.stallMm <= MP_FOLD_STALL_MM) {
        updateFriction(g, w);
        return { w, events };
      }
      w.fold = { atMm: w.tipMm, reason: "branch", loopMm: Math.max(2, w.shape.primaryMm * 2) };
      events.push({ kind: "fold", reason: "branch", atMm: w.tipMm });
      remaining = w.stallMm - MP_FOLD_STALL_MM;
      w.caught = null;
      w.stallMm = 0;
    } else w.caught = null;
  }

  let guard = 0;
  while (remaining > 1e-6 && guard++ < 200) {
    // a tip held against the wall: the push is stored in the shaft; forced on, a stiff tip goes under the
    // intima and a soft one folds (pm-wiring-navigate: a restrained tip; forcing it dissects)
    if (w.wallCaught && Math.abs(w.tipMm - w.wallCaught.atMm) < 1e-6) {
      w.stallMm += remaining;
      w.tipForceGf = Math.min(spec.tipLoadGf, MP_STALL_GF_PER_MM * w.stallMm);
      if (w.stallMm <= MP_FOLD_STALL_MM) {
        remaining = 0;
        break;
      }
      const over = w.stallMm - MP_FOLD_STALL_MM;
      if (tipCapability(w.kind) * microSupport(w) >= MP_FORCE_DISSECT_GF) {
        w.subintimal = { fromMm: w.tipMm };
        events.push({ kind: "subintimal", atMm: w.tipMm });
      } else {
        w.fold = { atMm: w.tipMm, reason: "wall", loopMm: Math.max(2, w.shape.primaryMm * 2) };
        events.push({ kind: "fold", reason: "wall", atMm: w.tipMm });
      }
      w.wallCaught = null;
      w.stallMm = 0;
      w.tipForceGf = 0;
      remaining = over;
      continue;
    }
    const cur = g.byName.get(w.route[w.route.length - 1]);
    if (!cur) break;
    const start = w.tipMm;
    const target = start + remaining;
    const end = cur.pathMm[cur.pathMm.length - 1];
    const onLesionVessel = cur.name === les.vessel;
    const inLesion = onLesionVessel && start >= les.startMm - 1e-9 && start < les.endMm - 1e-9;

    // ---- inside the target lesion: resistance step by step ----
    if (inLesion) {
      const stop = Math.min(target, les.endMm);
      // a microcatheter close behind the tip lets it deliver more load before it buckles
      const cap = tipCapability(w.kind) * (w.fold ? 0.25 : 1) * microSupport(w);
      // in an occlusion there is no lumen to straighten the tip: its shaped angle points it off the axis
      const offAxis = w.fold ? 1 : Math.sin(Math.min(Math.PI / 2, ((w.shape.primaryDeg + 0.6 * w.shape.secondaryDeg) * Math.PI) / 180));
      const knuckleOk = !!w.fold && les.occlusion === "cto" && (w.kind === "polymer" || w.kind === "cto");
      let mm = start;
      let stalled = false;
      while (mm < stop - 1e-9) {
        const step = Math.min(0.5, stop - mm);
        const R = lesionResistance(les, mm + step / 2, w.kind);
        if (R > cap && !knuckleOk && !w.subintimal) {
          stalled = true;
          break;
        }
        if (les.occlusion !== "none" && !w.subintimal) {
          const p = knuckleOk
            ? 1
            : MP_SUBINTIMAL_PER_MM * Math.sqrt(Math.max(1, tipCapability(w.kind))) * (1 + 1.5 * offAxis) * (1 + 0.5 * les.calcium) * (les.occlusion === "thrombotic" ? 0.2 : 1) * step;
          if (rnd(w.rng) < p) {
            w.subintimal = { fromMm: mm };
            events.push({ kind: "subintimal", atMm: mm });
          }
        }
        mm += step;
      }
      if (stalled) {
        w.tipMm = mm;
        const over = target - mm;
        w.stallMm += over;
        w.tipForceGf = Math.min(spec.tipLoadGf, MP_STALL_GF_PER_MM * w.stallMm);
        w.axialN = Math.min(MP_MAX_AXIAL_N, 0.02 * w.stallMm);
        events.push({ kind: "stall", needGf: lesionResistance(les, mm + 0.25, w.kind), haveGf: cap });
        if (w.stallMm > MP_FOLD_STALL_MM && !w.fold) {
          w.fold = { atMm: mm, reason: les.occlusion === "cto" ? "cap" : "lesion", loopMm: Math.max(2, w.shape.primaryMm * 2) };
          events.push({ kind: "fold", reason: w.fold.reason, atMm: mm });
        }
        remaining = 0;
        break;
      }
      w.tipMm = stop;
      remaining = target - stop;
      w.stallMm = 0;
      w.tipForceGf = 0;
      w.axialN = 0;
      if (stop >= les.endMm - 1e-9) {
        if (w.subintimal && w.kind === "cto" && rnd(w.rng) < MP_REENTRY_TAPERED) {
          w.subintimal = null;
          events.push({ kind: "true-lumen" });
        }
        if (!w.subintimal && !w.crossed) {
          w.crossed = true;
          events.push({ kind: "crossed" });
        }
      }
      continue;
    }

    // ---- next stop along this vessel ----
    const nextBranch = w.subintimal ? undefined : branchesOf(g, cur.name).find((b) => !b.terminal && b.atMm > start + 1e-6 && b.atMm <= Math.min(target, end));
    const lesStart = onLesionVessel && les.startMm > start + 1e-9 && les.startMm <= target ? les.startMm : Infinity;
    let stop = Math.min(nextBranch ? nextBranch.atMm : Infinity, lesStart, target, end);
    // a deflection balloon ahead in this vessel: the wire cannot pass it
    const deflAt = w.deflector && w.deflector.vessel === cur.name && w.deflector.atMm - 0.5 > start + 1e-9 ? w.deflector.atMm - 0.5 : Infinity;
    const blocked = deflAt < stop;
    if (blocked) stop = deflAt;
    // prolapse: the tip is in the first millimetres of a wide, acutely angled branch
    let prolapsedAt = -1;
    if (!w.fold && !w.subintimal && cur.parent && w.route.length >= 2 && w.route[w.route.length - 2] === cur.parent.name) {
      const o = cur.pathMm[0];
      const p = start < o + MP_PROLAPSE_ZONE_MM ? prolapseChancePerMm(g, w, cur) : 0;
      if (p > 0) {
        const zEnd = Math.min(stop, o + MP_PROLAPSE_ZONE_MM);
        for (let mm = start; mm < zEnd - 1e-9; mm += 1) {
          const step = Math.min(1, zEnd - mm);
          if (rnd(w.rng) < p * step) {
            prolapsedAt = mm + step;
            break;
          }
        }
      }
    }
    if (prolapsedAt >= 0 && cur.parent) {
      // the shaft bows into the main vessel and pulls the tip out of the branch: the loop runs on distally
      dangerPush(g, w, start, prolapsedAt, false, events);
      const o = cur.pathMm[0];
      w.route.pop();
      w.tipMm = o;
      w.fold = { atMm: o, reason: "branch", loopMm: Math.max(2, w.shape.primaryMm * 2) };
      events.push({ kind: "prolapse", vessel: cur.name, atMm: o });
      events.push({ kind: "fold", reason: "branch", atMm: o });
      remaining = Math.max(0, target - prolapsedAt);
      continue;
    }
    // a primary bend longer than the lumen is wide catches the wall
    let caughtAt = -1;
    if (!w.fold && !w.subintimal) {
      for (let mm = start; mm < stop - 1e-9; mm += 0.5) {
        const step = Math.min(0.5, stop - mm);
        const pc = wallCatchPerMm(w.shape, 2 * radiusAtMm(g, w.route, mm + step / 2));
        if (pc > 0 && rnd(w.rng) < pc * step) {
          caughtAt = mm + step;
          break;
        }
      }
    }
    if (caughtAt >= 0) {
      dangerPush(g, w, start, caughtAt, false, events);
      w.tipMm = caughtAt;
      w.wallCaught = { atMm: caughtAt };
      events.push({ kind: "wall-catch", atMm: caughtAt });
      remaining = Math.max(0, target - caughtAt);
      continue;
    }
    dangerPush(g, w, start, stop, false, events);
    w.tipMm = stop;
    remaining = Math.max(0, target - stop);
    if (blocked && stop >= deflAt - 1e-9) {
      w.stallMm += remaining;
      remaining = 0;
      break;
    }

    if (nextBranch && stop === nextBranch.atMm) {
      const dec = branchDecision(g, w, nextBranch.c);
      if (dec === "enter") {
        w.route.push(nextBranch.c.name);
        events.push({ kind: "branch", vessel: nextBranch.c.name, terminal: false });
        if (w.deflector && w.deflector.branch === nextBranch.c.name) events.push({ kind: "deflected", vessel: nextBranch.c.name });
      } else if (dec === "catch") {
        events.push({ kind: "catch", vessel: nextBranch.c.name });
        // the tip hangs on the ostium edge; pushing more than the slack folds it, and the loop passes on
        if (remaining > MP_FOLD_STALL_MM) {
          w.fold = { atMm: stop, reason: "branch", loopMm: Math.max(2, w.shape.primaryMm * 2) };
          events.push({ kind: "fold", reason: "branch", atMm: stop });
          remaining -= MP_FOLD_STALL_MM;
        } else {
          w.caught = { vessel: nextBranch.c.name, atMm: stop };
          w.stallMm = remaining;
          w.tipForceGf = Math.min(spec.tipLoadGf, MP_STALL_GF_PER_MM * w.stallMm);
          remaining = 0;
        }
      }
      continue;
    }
    if (remaining <= 1e-6) break;
    if (stop === lesStart) continue;
    if (stop < end - 1e-9) continue;

    // ---- end of this vessel: continue into a terminal branch, if any ----
    const terminal = branchesOf(g, cur.name).filter((b) => b.terminal);
    if (terminal.length && !w.subintimal) {
      // the guide's aim at the end of the first vessel (a large left curve at the circumflex)
      const aimed = w.aim && cur.name === w.route[0] ? terminal.find((t) => t.c.name === w.aim) : undefined;
      const best = aimed && rnd(w.rng) < MP_AIM_FOLLOW ? aimed.c : terminalChoice(g, w, terminal.map((t) => t.c));
      if (aimed && best === aimed.c) events.push({ kind: "aimed", vessel: best.name });
      w.route.push(best.name);
      events.push({ kind: "branch", vessel: best.name, terminal: true });
      continue;
    }
    // the closed end of a terminal vessel: the tip presses on the end
    if (w.fold) {
      remaining = 0; // a loop at the end is atraumatic: it stops
      break;
    }
    w.distal.pushesAtEnd++;
    const capEnd = tipCapability(w.kind);
    const gfMm = capEnd * spec.injuryFactor * remaining;
    w.distal.exposureGfMm += gfMm;
    events.push({ kind: "distal-push", mm: remaining, gfMm, atEnd: true, radiusMm: radiusAtMm(g, w.route, end), atMm: end });
    w.stallMm += remaining;
    // a soft tip buckles against the end (folds); a stiff one does not
    if (capEnd < 3 && w.stallMm > MP_FOLD_STALL_MM) {
      w.fold = { atMm: end, reason: "end", loopMm: Math.max(2, w.shape.primaryMm * 2) };
      events.push({ kind: "fold", reason: "end", atMm: end });
    }
    remaining = 0;
  }
  trackDanger(g, w, events);
  updateFriction(g, w);
  setGrip(w, les);
  return { w, events };
}

/** A tip inside the lesion is gripped by it. */
function setGrip(w: WireState, les: LesionNow): void {
  const inLes = w.route[w.route.length - 1] === les.vessel && w.tipMm > les.startMm && w.tipMm < les.endMm;
  w.grip = inLes && !w.fold ? MP_GRIP_NMM_PER_GF * lesionResistance(les, w.tipMm, w.kind) * (w.subintimal ? 0.5 : 1) : 0;
}

function dangerPush(g: PciGeom, w: WireState, from: number, to: number, atEnd: boolean, events: WireEvent[]): void {
  if (to <= from) return;
  const spec = WIRE_SPEC[w.kind];
  // the part of the push that happens inside the danger zone (1 mm resolution)
  let inMm = 0;
  for (let mm = from; mm < to; mm += 1) if (isDanger(g, w, Math.min(to, mm + 0.5))) inMm += Math.min(1, to - mm);
  if (inMm <= 0 || w.fold) return;
  const gfMm = tipCapability(w.kind) * spec.injuryFactor * inMm;
  w.distal.exposureGfMm += gfMm;
  events.push({ kind: "distal-push", mm: inMm, gfMm, atEnd, radiusMm: radiusAtMm(g, w.route, to), atMm: to });
}

/** Withdraw the wire by d mm (d > 0). */
export function pullWire(g: PciGeom, w0: WireState, d: number, les: LesionNow): { w: WireState; events: WireEvent[] } {
  const w = cloneWire(w0);
  const events: WireEvent[] = [];
  updateFriction(g, w);
  const j = settle(w, false);
  if (Math.abs(j) > 0.25) events.push({ kind: "whip", rad: j });
  const mm = Math.max(-40, w.tipMm - d);
  // a fold reforms once the loop has been drawn back by about its own length
  if (w.fold) {
    w.fold.pulledMm = (w.fold.pulledMm ?? 0) + (w.tipMm - mm);
    if (w.fold.pulledMm >= Math.min(w.fold.loopMm, 3)) {
      w.fold = null;
      events.push({ kind: "unfold" });
    }
  }
  while (w.route.length > 1) {
    const v = g.byName.get(w.route[w.route.length - 1])!;
    if (mm < v.pathMm[0]) w.route.pop();
    else break;
  }
  // a reversed (hairpin) tip pulled back past a wide, acutely angled branch hooks into it
  const hooked = w.shape.reversed && !w.fold ? hairpinHook(g, w, mm, events) : false;
  if (hooked) {
    w.stallMm = 0;
    w.tipForceGf = 0;
    w.axialN = 0;
    w.caught = null;
    w.wallCaught = null;
    trackDanger(g, w, events);
    updateFriction(g, w);
    setGrip(w, les);
    return { w, events };
  }
  w.tipMm = mm;
  w.stallMm = 0;
  w.tipForceGf = 0;
  w.axialN = 0;
  w.caught = null;
  w.wallCaught = null;
  if (w.subintimal && mm < w.subintimal.fromMm - 0.5) {
    w.subintimal = null;
    events.push({ kind: "true-lumen" });
  }
  if (w.crossed && (!w.route.includes(les.vessel) || mm < les.startMm)) w.crossed = false;
  trackDanger(g, w, events);
  updateFriction(g, w);
  setGrip(w, les);
  return { w, events };
}

/**
 * The hairpin's hook on a pull-back from w.tipMm to mm: the first wide, acutely angled branch of the tip's
 * vessel whose origin the bend passes, with the free end facing it (a wide azimuth window), catches the
 * reversed tip; the wire then lies in the branch as far as it was pulled past the origin, the shape is
 * spent (the operator now steers it as an ordinary tip), and a share of hooks dissect. True when it hooked.
 */
function hairpinHook(g: PciGeom, w: WireState, mm: number, events: WireEvent[]): boolean {
  const cur = w.route[w.route.length - 1];
  const passed = branchesOf(g, cur)
    .filter((b) => !b.terminal && b.atMm <= w.tipMm && b.atMm > mm && prolapseBranch(g, b.c))
    .sort((a, b) => b.atMm - a.atMm);
  for (const b of passed) {
    const to = takeOff(g, b.c);
    const win = Math.asin(Math.min(1, to.childRadius / Math.max(0.3, to.parentRadius))) + MP_AZ_TOL + MP_HAIRPIN_AZ_EXTRA;
    if (Math.abs(wrap(w.tip - to.azimuth)) > win) continue;
    if (rnd(w.rng) >= MP_HAIRPIN_HOOK) continue;
    const pulled = b.atMm - mm;
    w.route.push(b.c.name);
    w.tipMm = b.atMm + Math.max(1, pulled);
    w.shape = { ...w.shape, reversed: false };
    const dissected = rnd(w.rng) < MP_HAIRPIN_DISSECT;
    if (dissected) {
      w.subintimal = { fromMm: b.atMm + 0.5 };
      events.push({ kind: "subintimal", atMm: b.atMm + 0.5 });
    }
    events.push({ kind: "hairpin-entry", vessel: b.c.name, dissected });
    events.push({ kind: "branch", vessel: b.c.name, terminal: false });
    return true;
  }
  return false;
}

/** Move the wire by a signed distance. */
export function moveWireBy(g: PciGeom, w: WireState, d: number, les: LesionNow): { w: WireState; events: WireEvent[] } {
  if (d > 0) return pushWire(g, w, d, les);
  if (d < 0) return pullWire(g, w, -d, les);
  return { w, events: [] };
}

/**
 * A device advancing over the wire drags an unpinned wire with it by `coupling` × the device's advance
 * (pulled back the same way when the device is withdrawn). A pinned wire stays.
 */
export function dragWire(g: PciGeom, w: WireState, deviceMoveMm: number, coupling: number, les: LesionNow): { w: WireState; events: WireEvent[]; migratedMm: number } {
  if (w.pinned || w.tipMm <= 0 || Math.abs(deviceMoveMm) < 1e-9) return { w, events: [], migratedMm: 0 };
  const d = deviceMoveMm * coupling;
  const r = moveWireBy(g, w, d, les);
  return { ...r, migratedMm: r.w.tipMm - w.tipMm };
}

/** Lumen diameter at the tip (mm). */
export function lumenAtTip(g: PciGeom, w: WireState): number {
  return 2 * radiusAtMm(g, w.route, Math.max(0, w.tipMm));
}

/** Sensor position (route mm) of a pressure wire, or null for other wires. */
export function sensorMm(w: WireState): number | null {
  const s = WIRE_SPEC[w.kind].sensorMm;
  return s === undefined ? null : w.tipMm - s;
}

// ---------------------------------------------------------------------------
// Microcatheter (pci-wire-microcatheter)
// ---------------------------------------------------------------------------
/** Put a microcatheter on the wire, parked inside the guide (the wire's own position is unchanged). */
export function loadMicro(w0: WireState, id: MicroId): WireState {
  const w = cloneWire(w0);
  w.micro = { id, tipMm: Math.min(-5, w.tipMm - MP_MC_MIN_GAP_MM, MP_MC_PARK_MM + 10), turns: 0, damaged: false, backflowAt: null };
  return w;
}

export type MicroEvent =
  | { kind: "micro-at-tip" }
  | { kind: "micro-guide-blocked" }
  | { kind: "micro-damage"; turns: number }
  | { kind: "micro-left-guide" };

/**
 * Advance (+) or withdraw (−) the microcatheter by d mm over the wire. It cannot pass the wire tip (it stops
 * MP_MC_MIN_GAP_MM behind it) or leave a guide that is not seated; withdrawn, it parks inside the guide and
 * drags an unpinned wire back by MP_MC_DRAG_COUPLING of its travel in the vessel.
 */
export function moveMicro(g: PciGeom, w0: WireState, d: number, les: LesionNow): { w: WireState; events: (WireEvent | MicroEvent)[]; migratedMm: number } {
  const events: (WireEvent | MicroEvent)[] = [];
  if (!w0.micro || Math.abs(d) < 1e-9) return { w: w0, events, migratedMm: 0 };
  let w = cloneWire(w0);
  const m = w.micro!;
  const from = m.tipMm;
  let to = from + d;
  if (d > 0) {
    const limit = w.tipMm - MP_MC_MIN_GAP_MM;
    if (to > limit) {
      to = Math.max(from, limit);
      events.push({ kind: "micro-at-tip" });
    }
    if (from <= 0 && to > 0 && !w.guideEngaged) {
      to = Math.min(to, 0);
      events.push({ kind: "micro-guide-blocked" });
    }
    if (from <= 0 && to > 0) events.push({ kind: "micro-left-guide" });
  } else to = Math.max(MP_MC_PARK_MM, to);
  m.tipMm = to;
  m.backflowAt = null;
  let migratedMm = 0;
  // withdrawing in the vessel drags an unpinned wire back with it
  const inVessel = Math.max(0, from) - Math.max(0, to);
  if (d < 0 && inVessel > 0 && !w.pinned && w.tipMm > 0) {
    const r = dragWire(g, w, -inVessel, MP_MC_DRAG_COUPLING, les);
    r.w.micro = { ...m };
    w = r.w;
    migratedMm = r.migratedMm;
    events.push(...r.events);
  }
  return { w, events, migratedMm };
}

/** Rotate the microcatheter hub by dRad: net turns past its limit deform it (it then binds the wire). */
export function rotateMicro(w0: WireState, dRad: number): { w: WireState; events: MicroEvent[] } {
  if (!w0.micro) return { w: w0, events: [] };
  const w = cloneWire(w0);
  const m = w.micro!;
  m.turns += dRad / (2 * Math.PI);
  const max = m.id === "mc-plaque" ? MC_PLAQUE_MAX_TURNS : MP_MC_MAX_TURNS;
  const events: MicroEvent[] = [];
  if (!m.damaged && Math.abs(m.turns) > max) {
    m.damaged = true;
    events.push({ kind: "micro-damage", turns: m.turns });
  }
  return { w, events };
}

/**
 * Exchange the wire for another kind through a microcatheter in the vessel: the old wire is withdrawn
 * through it and the new one advanced to the same position, so the route, the tip position, the crossing
 * and any subintimal course are kept; torque and stored compression start afresh. When the old tip was
 * further beyond the microcatheter than MP_MC_EXCHANGE_KEEP_MM (and the geometry is given), the new wire
 * comes out of the microcatheter tip instead (readvanceFromMicro); callers without the geometry refuse
 * that case (actions/wire.ts setWireKind).
 */
export function exchangeThroughMicro(w0: WireState, kind: WireKind, opts: { lengthCm?: number; g?: PciGeom } = {}): WireState {
  const w = cloneWire(w0);
  // a tip further beyond the microcatheter than it keeps: the new wire comes out of the microcatheter tip
  if (opts.g && microFarBehindTip(w)) readvanceFromMicro(opts.g, w);
  const spec = WIRE_SPEC[kind];
  w.kind = kind;
  w.lengthCm = opts.lengthCm ?? w.lengthCm;
  w.kT = spec.GJ / (MP_WIRE_TO_GUIDE_TIP + Math.max(0, w.tipMm));
  w.hub = w.tip + w.offset;
  w.lastJump = 0;
  w.grip = 0;
  w.fold = null;
  w.caught = null;
  w.wallCaught = null;
  w.stallMm = 0;
  w.tipForceGf = 0;
  w.axialN = 0;
  return w;
}

// ---------------------------------------------------------------------------
// Removing the microcatheter over the wire
// ---------------------------------------------------------------------------
export type MicroRemoval = "trap" | "hydraulic" | "extension" | "pull";

export interface TrapBalloon {
  /** nominal diameter (mm) and length (mm) */
  diameterMm: number;
  lengthMm: number;
  /** inflation pressure (atm) */
  atm: number;
  /** placed beyond the microcatheter's distal marker (default true); proximal to it, it traps the microcatheter too */
  beyondMarker?: boolean;
}

export interface TrapHold {
  /** balloon diameter at the pressure (mm) and the guide's inner diameter (mm) */
  balloonMm: number;
  guideIdMm: number;
  /** the hold as a share of the drag of the withdrawal (>= 1 holds) */
  hold: number;
  /** how far the wire comes back with the microcatheter (mm) */
  migratedMm: number;
}

/**
 * The trapping balloon's grip on the wire against the guide wall. The balloon's diameter at the pressure
 * (its catalogue compliance chart: the trapping balloon for its own sizes, else the semi-compliant balloon)
 * against the guide's inner diameter gives the contact; the pressure, the length (full grip from 20 mm) and
 * the wire's coating give the hold. A hold below the drag lets the wire slip back.
 */
export function trapHold(b: TrapBalloon, french: GuideFrench, kind: WireKind): TrapHold {
  const trap = DEVICE_BY_ID.trap;
  const spec = trap && trap.diameters.includes(b.diameterMm) ? trap : DEVICE_BY_ID.sc;
  const balloonMm = spec ? chartDiameter(spec, b.diameterMm, b.atm) : b.diameterMm;
  const guideIdMm = GUIDE_ID_IN[french] * IN_MM;
  const contact = Math.max(0, Math.min(1, (balloonMm / guideIdMm - 1) / MP_TRAP_OVERSIZE_FULL));
  const lengthF = Math.min(1, b.lengthMm / TRAP_MIN_LENGTH_MM);
  const slip = WIRE_SPEC[kind].coating === "polymer-jacket" ? MP_TRAP_SLIPPERY : 1;
  const hold = MP_TRAP_HOLD_PER_ATM * b.atm * contact * lengthF * slip;
  const migratedMm = hold >= 1 ? MP_TRAP_ELASTIC_MM : (1 - hold) * MP_TRAP_SLIP_MM;
  return { balloonMm, guideIdMm, hold, migratedMm };
}

export interface MicroRemovalResult {
  w: WireState;
  events: WireEvent[];
  outcome: "removed" | "wire-lost" | "cannot-trap" | "trapped-device" | "not-in-guide" | "no-microcatheter" | "pressure-high";
  /** how far the wire tip came back (mm; negative when it was driven forward) */
  migratedMm: number;
  trap?: TrapHold;
}

/**
 * Remove the microcatheter over the wire. With an exchange-length wire it simply comes off. Over a short wire:
 *  - trap: the microcatheter is first withdrawn into the guide; the balloon (beyond its distal marker) pins
 *    the wire against the guide wall while it comes out (trapHold); a guide smaller than the device's
 *    trapping minimum (equipment.ts trapMinFrench) cannot take balloon and microcatheter together;
 *  - hydraulic: an indeflator on the hub at 14-20 atm pushes the wire out of the withdrawing catheter;
 *    below the range the wire comes back; above it the exchange is refused (nothing moves); a
 *    polymer-jacketed or stiff-tip wire is driven forward (pm-wiring-microcatheters: never with those wires);
 *  - extension: an extension wire makes the wire exchange length;
 *  - pull: the wire comes out with it.
 */
export function removeMicro(
  g: PciGeom,
  w0: WireState,
  les: LesionNow,
  o: { technique: MicroRemoval; french: GuideFrench; balloon?: TrapBalloon; hydraulicAtm?: number }
): MicroRemovalResult {
  if (!w0.micro) return { w: w0, events: [], outcome: "no-microcatheter", migratedMm: 0 };
  const off = (w: WireState) => {
    const n = cloneWire(w);
    n.micro = null;
    return n;
  };
  const tip0 = w0.tipMm;
  const pullBy = (w: WireState, mm: number) => (mm > 1e-6 && w.tipMm > 0 ? pullWire(g, w, mm, les) : { w, events: [] as WireEvent[] });
  if (w0.lengthCm >= EXCHANGE_LENGTH_CM || o.technique === "extension") {
    const w = off(w0);
    if (o.technique === "extension") w.lengthCm = Math.max(w.lengthCm, EXCHANGE_LENGTH_CM);
    return { w, events: [], outcome: "removed", migratedMm: 0 };
  }
  if (o.technique === "pull") {
    // over a short wire the wire comes out with the microcatheter
    const r = pullWire(g, off(w0), Math.max(0, w0.tipMm + 25), les);
    return { w: r.w, events: r.events, outcome: "wire-lost", migratedMm: tip0 - r.w.tipMm };
  }
  if (o.technique === "hydraulic") {
    const atm = o.hydraulicAtm ?? 0;
    if (atm > HYDRAULIC_ATM[1]) return { w: w0, events: [], outcome: "pressure-high", migratedMm: 0 };
    const cat = WIRE_SPEC[w0.kind].category;
    if (cat === "polymer-jacketed" || cat === "stiff-tip") {
      const r = pushWire(g, off(w0), MP_HYDRAULIC_ADVANCE_MM, les);
      return { w: r.w, events: r.events, outcome: "removed", migratedMm: tip0 - r.w.tipMm };
    }
    // in range the wire stays (within MP_HYDRAULIC_MM); below it the wire comes back
    const back = atm >= HYDRAULIC_ATM[0] ? MP_HYDRAULIC_MM : MP_HYDRAULIC_LOW_MM;
    const r = pullBy(off(w0), back);
    return { w: r.w, events: r.events, outcome: "removed", migratedMm: tip0 - r.w.tipMm };
  }
  // trapping
  if (w0.micro.tipMm > 0) return { w: w0, events: [], outcome: "not-in-guide", migratedMm: 0 };
  const min = DEVICE_BY_ID[w0.micro.id]?.trapMinFrench ?? 6;
  if (o.french < min) return { w: w0, events: [], outcome: "cannot-trap", migratedMm: 0 };
  const b = o.balloon ?? { diameterMm: o.french >= 7 ? 3.0 : 2.5, lengthMm: TRAP_MIN_LENGTH_MM, atm: 15 };
  if (b.beyondMarker === false) return { w: w0, events: [], outcome: "trapped-device", migratedMm: 0 };
  const trap = trapHold(b, o.french, w0.kind);
  const r = pullBy(off(w0), trap.migratedMm);
  return { w: r.w, events: r.events, outcome: "removed", migratedMm: tip0 - r.w.tipMm, trap };
}

// ---------------------------------------------------------------------------
// Pseudolesions (pci-wire-microcatheter)
// ---------------------------------------------------------------------------
/**
 * Where a support wire's stiff shaft straightens a bend into a pseudolesion: the sharp bends (curvature at
 * least MP_PSEUDO_KAPPA) of the coronary route proximal to its soft distal segment (MP_SOFT_SEGMENT_MM).
 * Partly withdrawing the wire, so that the soft segment lies in the bends, makes them resolve
 * (pm-wiring-tortuosity). Empty for other wires.
 */
export function pseudolesionSites(g: PciGeom, w: WireState): { vessel: string; atMm: number }[] {
  if (WIRE_SPEC[w.kind].category !== "support" || w.tipMm <= 0) return [];
  const stiffEnd = w.tipMm - MP_SOFT_SEGMENT_MM;
  const out: { vessel: string; atMm: number }[] = [];
  let last = -Infinity;
  // the left main is not straightened into a pseudolesion: start beyond it
  const lm = w.route[0] === "LM" ? g.byName.get("LM") : undefined;
  const start = lm ? lm.pathMm[lm.pathMm.length - 1] : 5;
  for (let mm = Math.max(5, start); mm < stiffEnd; mm += 1) {
    if (curvatureAtMm(g, w.route, mm) < MP_PSEUDO_KAPPA || mm - last < 6) continue;
    const at = sampleAtMm(g, w.route, mm);
    out.push({ vessel: at?.v.name ?? w.route[w.route.length - 1], atMm: mm });
    last = mm;
  }
  return out;
}
