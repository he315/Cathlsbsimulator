// ---------------------------------------------------------------------------
// Rolling context for the attending: what the learner is doing now and for
// how long. The integrator feeds one MentorInput per frame (from the stores or
// the physics client); the tracker adds durations, progress and re-approach
// counts that the rules read.
// ---------------------------------------------------------------------------

import type { CArm, EngagementKind, PressureKind } from "../types";
import { DAMPED_KINDS, type BeamCode, type Lab } from "./types";

export interface PciInput {
  /** branch the wire tip is in (tree vessel name), null when in the guide */
  wireBranch: string | null;
  /** the wire is in a septal perforator */
  wireInSeptal: boolean;
  /** the wire is off the route to the lesion */
  wireOffRoute: boolean;
  /** wire tip near the distal end of a terminal vessel */
  wireTipDistal: boolean;
  /** a device is being pushed beyond the end of the wire (or within its last few mm) */
  deviceBeyondWire: boolean;
  deviceKind: "balloon" | "stent" | null;
  deviceDiameter?: number;
  /** reference diameter at the device position (mm) */
  localRefMm?: number;
  deviceInLesion?: boolean;
  deviceInStent?: boolean;
  /** a cine injection was made since the device last moved */
  injectedSinceDeviceMove: boolean;
  /** ACT measured and adequate (for PCI with heparin) */
  actOk?: boolean;
  // --- pci-attending (src/mentor/bridge/pciSession.ts fills these; absent reads as false or unknown) ---
  /**
   * the device is crossing the guide tip: its distal end within the bridge's guide-exit zone of the tip
   * (or beyond it) while its proximal end is still inside the guide
   */
  deviceAtGuideTip?: boolean;
  /** the device moved along the wire since the previous frame */
  deviceMoving?: boolean;
  /** the balloon (or the stent's delivery balloon) still holds pressure: not yet emptied */
  balloonInflated?: boolean;
  /** a device was pulled back with its balloon not yet empty (the engine's 'pull-before-deflation', recently) */
  pulledBeforeDeflation?: boolean;
  /** the guide was pushed back out of the ostium by a device push recently (the engine's 'guide-backout'); a guide disengaged on purpose is not */
  guideBackedOut?: boolean;
  /** an ACT is required before a device leaves the guide (supervised practice, the engine's ACT gate) */
  actRequired?: boolean;
  /** contrast pushed so far (mL) */
  contrastMl?: number;
  /** the contrast ceiling agreed for today (mL; the stricter rule of contrastBudget.ts, or the plan's if lower) */
  contrastCeilingMl?: number;
  /** the warning level of that ceiling (mL) */
  contrastWarnMl?: number;
  // --- pci-two-rail-engine (pciRailInput fills these from the engine state; absent reads as one wire) ---
  /** the rail the hands work on: 0 the first wire, 1 the second */
  activeRail?: 0 | 1;
  /** coronary wires in the guide (1 or 2) */
  wireCount?: number;
  /** a wire is jailed under a stent */
  jailedWire?: boolean;
  /** both rails' balloons are up together (a kiss) */
  kissing?: boolean;
}

/** What pciRailInput reads of the PCI engine state (a structural subset of src/simulation/pci/state.ts PciState). */
export interface PciRailSource {
  activeRail?: 0 | 1;
  device?: { inflated: boolean } | null;
  rails?: readonly { wire: unknown | null; device: { inflated: boolean } | null; jailed: unknown | null }[];
}

/**
 * The attending's two-rail fields of PciInput from the engine state (pci-two-rail-engine): the active rail,
 * how many wires are in the guide, whether one is jailed, and a kiss in progress. The active rail's device is
 * the state's own (the rail record of the active rail may lag it until the next rail action). With one wire:
 * rail 0, one wire, none jailed, no kiss.
 */
export function pciRailInput(st: PciRailSource): Pick<PciInput, "activeRail" | "wireCount" | "jailedWire" | "kissing"> {
  const active: 0 | 1 = st.activeRail === 1 ? 1 : 0;
  const rails = st.rails;
  if (!rails || rails.length < 2) return { activeRail: 0, wireCount: 1, jailedWire: false, kissing: false };
  const dev = (i: number) => (i === active ? (st.device ?? null) : rails[i].device);
  return {
    activeRail: active,
    wireCount: rails.filter((r) => r.wire !== null).length,
    jailedWire: rails.some((r) => r.wire !== null && r.jailed !== null),
    kissing: [0, 1].every((i) => !!dev(i)?.inflated),
  };
}

export interface MentorInput {
  tWall: number;
  lab: Lab;
  engagement: EngagementKind;
  conus?: boolean;
  pressure: PressureKind;
  sys: number;
  dia: number;
  /** felt resistance 0..1 */
  resistance: number;
  /** the hub is being advanced right now */
  advancing: boolean;
  /** actual insertion (mm), used to see withdrawals */
  insertion: number;
  aspirated: "unknown" | "clean" | "no-return";
  beam: BeamCode;
  cArm: CArm;
  catheterId?: string;
  /** coronary being worked on */
  targetSide?: "left" | "right";
  /** foreshortening (0..1) of the target segment in the current view, from coverage.ts */
  targetForeshortening?: number;
  targetSegment?: string;
  pci?: PciInput;
}

export type PreAction = "inject" | "advance-device" | "inflate" | "deploy" | "advance-catheter" | "advance-wire";

export interface MentorCtx extends MentorInput {
  /** seconds in the current engagement class */
  engS: number;
  /** seconds in the current pressure class */
  pressS: number;
  /** seconds of continuous pushing against resistance */
  pushS: number;
  /** seconds since the last withdrawal of at least 0.5 mm */
  sinceWithdrawS: number;
  /** seconds since the last progress */
  noProgressS: number;
  /** re-approaches to an ostium since the last progress */
  reapproaches: number;
  /** seconds the wire has been in a septal branch */
  septalS: number;
  damped: boolean;
  /** an action the learner is about to take (set only during preAction) */
  pending?: PreAction;
}

const RANK: Partial<Record<EngagementKind, number>> = {
  "not-in-root": 0,
  "ascending-aorta": 1,
  "sinus-level": 2,
  "non-selective": 2,
  "near-lm": 3,
  "near-rca": 3,
  "coaxial-lm": 4,
  "coaxial-rca": 4,
  "selective-lm": 5,
  "selective-rca": 5,
};

const WITHDRAW_MM = 0.5; // model parameter (matches analysis.ts)

export class ContextTracker {
  private engSince = 0;
  private pressSince = 0;
  private pushSince = -1;
  private lastWithdrawT = 0;
  private refIns = 0;
  private lastProgressT = 0;
  private bestRank = 0;
  private wasNear = false;
  private retreatedSinceNear = false;
  private reapproaches = 0;
  private septalSince = -1;
  private prev: MentorInput | null = null;
  private lastBeam: BeamCode = 0;
  ctx: MentorCtx | null = null;

  reset(t = 0) {
    this.engSince = t;
    this.pressSince = t;
    this.pushSince = -1;
    this.lastWithdrawT = t;
    this.lastProgressT = t;
    this.bestRank = 0;
    this.wasNear = false;
    this.retreatedSinceNear = false;
    this.reapproaches = 0;
    this.septalSince = -1;
    this.prev = null;
  }

  /** Mark progress from outside (a diagnostic run completed, a device step). */
  noteProgress(t: number) {
    this.lastProgressT = t;
    this.reapproaches = 0;
  }

  update(i: MentorInput): MentorCtx {
    const p = this.prev;
    const t = i.tWall;
    if (!p) {
      this.reset(t);
      this.refIns = i.insertion;
    } else {
      if (i.engagement !== p.engagement) this.engSince = t;
      if (i.pressure !== p.pressure) this.pressSince = t;
      // a new catheter or a new target starts a fresh task
      if (i.catheterId !== p.catheterId || i.targetSide !== p.targetSide) {
        this.bestRank = 0;
        this.wasNear = false;
        this.retreatedSinceNear = false;
        this.noteProgress(t);
      }
    }
    // pushing against resistance
    if (i.advancing && i.resistance >= 0.6) {
      if (this.pushSince < 0) this.pushSince = t;
    } else this.pushSince = -1;
    // withdrawals: insertion falling by >= WITHDRAW_MM from its recent maximum
    if (i.insertion > this.refIns) this.refIns = i.insertion;
    if (this.refIns - i.insertion >= WITHDRAW_MM) {
      this.lastWithdrawT = t;
      this.refIns = i.insertion;
    }
    // progress: a better engagement class than before, or a cine run that ends
    const r = RANK[i.engagement] ?? 0;
    if (r > this.bestRank) {
      this.bestRank = r;
      this.noteProgress(t);
    }
    if (this.lastBeam === 2 && i.beam !== 2) this.noteProgress(t);
    this.lastBeam = i.beam;
    // re-approaches: near an ostium again after falling back to the sinus or above
    const near = i.engagement.startsWith("near-") || i.engagement.startsWith("coaxial-");
    if (near && !this.wasNear && this.retreatedSinceNear) this.reapproaches++;
    if (near) {
      this.wasNear = true;
      this.retreatedSinceNear = false;
    } else if (["sinus-level", "non-selective", "ascending-aorta", "not-in-root", "below-valve"].includes(i.engagement)) {
      if (this.wasNear) this.retreatedSinceNear = true;
      this.wasNear = false;
    }
    if (i.engagement.startsWith("selective-")) this.bestRank = Math.max(this.bestRank, 5);
    // PCI septal dwell
    if (i.pci?.wireInSeptal) {
      if (this.septalSince < 0) this.septalSince = t;
    } else this.septalSince = -1;
    this.prev = i;
    this.ctx = {
      ...i,
      engS: t - this.engSince,
      pressS: t - this.pressSince,
      pushS: this.pushSince < 0 ? 0 : t - this.pushSince,
      sinceWithdrawS: t - this.lastWithdrawT,
      noProgressS: t - this.lastProgressT,
      reapproaches: this.reapproaches,
      septalS: this.septalSince < 0 ? 0 : t - this.septalSince,
      damped: DAMPED_KINDS.includes(i.pressure),
    };
    return this.ctx;
  }
}
