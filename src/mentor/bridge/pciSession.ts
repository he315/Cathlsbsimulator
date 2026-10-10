// ---------------------------------------------------------------------------
// Bridge from the PCI lab session (src/ui/pci/PciLabSession.ts) to the mentor
// (pci-attending): what the attending reads each frame (MentorInput, lab
// 'pci'), what the recorder stores (FrameSample at 10 Hz) and the events the
// debrief's analysis needs (the engine's telemetry st.log, the beam's cine
// runs and fluoroscopy, heparin and ACT), all from one snapshot of the lab.
//
// It reads the session through structural types (PciBridgeSource), so a test
// can hand it a snapshot of its own and this file does not import the
// session module (which imports the mentor).
//
// What the PCI input carries (src/mentor/context.ts PciInput):
//   wireBranch, wireInSeptal   the vessel the wire tip is in; a septal is S1, S2...
//   wireOffRoute               a branch that is not on the path to the target
//                              (nor the declared side branch of a bifurcation)
//   wireTipDistal              the tip in a small distal vessel (the wire's
//                              danger zone)
//   deviceBeyondWire           the device's distal end within the engine's
//                              margin of the wire tip (distal >= tipMm - 6,
//                              actions/devices.ts)
//   deviceKind, diameter, localRefMm, deviceInLesion, deviceInStent
//                              the engine's own criteria (state.ts lesionCover
//                              above 0.05 for the lesion, any overlap for a stent)
//   injectedSinceDeviceMove, actOk (actGate), the guide pressure class, the
//   beam, the C-arm, contrast and the agreed ceiling (contrastBudget.ts) and
//   air kerma (frames)
// and, for the rules of src/mentor/rules/pci.ts, deviceAtGuideTip,
// deviceMoving, balloonInflated, pulledBeforeDeflation, guideBackedOut and
// actRequired (supervised practice).
//
// Its thresholds are MODEL PARAMETERS (PCI_BRIDGE_PARAMS,
// docs/realism/facts/pkg-pci-attending.md) except the wire margin, which is
// the engine's.
// ---------------------------------------------------------------------------

import type { CArm, EngagementKind, PressureKind } from "../../types";
import type { MentorInput, PciInput, PreAction } from "../context";
import type { CaseFacts } from "../analysis";
import type { RecordedEvent } from "../types";
import { ENGAGEMENT_KINDS, PRESSURE_KINDS, type BeamCode, type FrameSample } from "../types";
import type { PciGeom, PciScenario, PciState } from "../../simulation/pci/state";
import { lesionCover } from "../../simulation/pci/state";
import { pathTo, radiusAtMm } from "../../simulation/pci/geometry";
import { actGate } from "../../simulation/pci/lesionAssessment";
import { contrastBudgetForProfile, type ContrastBudget } from "../../simulation/patient/contrastBudget";
import type { PatientProfile } from "../../simulation/patient/patient";
import type { DoseTotals } from "../../simulation/dose";
import type { LabRaises } from "../../content/lab/raisable/waiting";

/** The bridge's thresholds (MODEL PARAMETERS unless the comment names the engine). */
export const PCI_BRIDGE_PARAMS = {
  /** a device whose distal end is within this distance (mm) of the guide tip, with its proximal end still inside, is leaving the guide (MODEL PARAMETER) */
  guideExitZoneMm: 10,
  /** the device moved along the wire by more than this between frames (mm) (MODEL PARAMETER) */
  deviceMovingMm: 0.05,
  /** the engine's margin of wire beyond a device (mm; actions/devices.ts beyondWire, moveDevice's limit) */
  beyondWireMarginMm: 6,
  /** a guide back-out is 'recent' for this long after the engine logged it (procedure s) (MODEL PARAMETER) */
  backoutWindowS: 5,
  /** a pull before deflation is 'recent' for this long after the engine logged it (procedure s) (MODEL PARAMETER) */
  pullWindowS: 3,
  /** the balloon counts as holding pressure above this fill (0..1; the engine's own 'empty' level, moveDevice) */
  inflatedFill: 0.05,
  /** a log entry's recorder time is the frame time plus this per entry (s), so the order of entries in one frame is kept (MODEL PARAMETER) */
  eventOrderS: 1e-4,
} as const;

// --- what the bridge reads -------------------------------------------------------------

/** The parts of PciLabSession.snapshot() the bridge reads. */
export interface PciBridgeSnapshot {
  t: number;
  state: PciState;
  lesion: { vessel: string; startMm: number; endMm: number; centreMm: number; refDiameter: number };
  vitals?: { hr: number | null; art: { sys: number; dia: number } | null } | null;
  guidePressure?: string;
  dose?: Pick<DoseTotals, "fluoroTimeS" | "cineTimeS" | "karMGy" | "kapGyCm2">;
  contrastMl?: number;
  policy?: { mode: string };
  workflow?: { beam: "fluoro" | "cine" | null };
}

/** One frame of the lab as the bridge sees it. */
export interface PciBridgeSource {
  snap: PciBridgeSnapshot;
  g: PciGeom;
  scenario: Pick<PciScenario, "id" | "side" | "guide"> & { target: { kind: string }; lesions?: { sideBranch?: { vessel: string } }[]; targetIdx?: number };
  cArm?: CArm;
  /** the patient (for the contrast ceiling); absent: no ceiling */
  profile?: PatientProfile | null;
  /** the ceiling the plan agreed (mL), used when lower than the stricter rule */
  planContrastMl?: number;
  /** patient seconds (for the frames); default the snapshot's lab time */
  tPatient?: number;
  /** the detector field (cm) and the pulse rate in force (p/s), for the frames */
  field?: number;
  pps?: number;
}

/** What the bridge keeps between frames. */
export interface PciBridgeMemory {
  lastDistal: number | null;
  lastSpec: string | null;
  /** the route to the target vessel (pathTo), kept while the geometry and the vessel are the same */
  path?: { g: PciGeom; vessel: string; ids: readonly string[] };
  /** the contrast budget, kept while the patient, the contrast used and the agreed ceiling are the same */
  budget?: { profile: PatientProfile; key: string; value: ContrastBudget | null };
}

export const newPciBridgeMemory = (): PciBridgeMemory => ({ lastDistal: null, lastSpec: null });

// --- pure helpers --------------------------------------------------------------------------------

const beamCode = (b: "fluoro" | "cine" | null | undefined): BeamCode => (b === "cine" ? 2 : b === "fluoro" ? 1 : 0);

/** The latest telemetry record of a kind, or null. */
function lastLog(st: PciState, kind: string): { t: number; data: Record<string, unknown> } | null {
  for (let i = st.log.length - 1; i >= 0; i--) if (st.log[i].kind === kind) return st.log[i];
  return null;
}

const recent = (st: PciState, kind: string, windowS: number) => {
  const r = lastLog(st, kind);
  return !!r && st.t - r.t <= windowS + 1e-9;
};

/** The device's span along the route (mm): proximal and distal ends. */
export function deviceSpan(st: PciState): { from: number; to: number } | null {
  const d = st.device;
  if (!d) return null;
  return { from: d.centreMm - d.lengthMm / 2, to: d.centreMm + d.lengthMm / 2 };
}

/** The side branch the active target declares (a bifurcation), as actions/wire.ts reads it. */
function sideBranchOf(s: PciBridgeSource["scenario"]): string | null {
  return s.lesions?.[s.targetIdx ?? 0]?.sideBranch?.vessel ?? null;
}

/** The contrast ceiling for this frame (contrastBudget.ts), or null without a patient. With a memory it is worked out once per contrast volume. */
export function pciContrastBudget(src: PciBridgeSource, mem?: PciBridgeMemory): ContrastBudget | null {
  if (!src.profile) return null;
  const used = src.snap.contrastMl ?? src.snap.state.contrastMl;
  const cto = src.scenario.target.kind === "cto";
  const planMl = src.planContrastMl && src.planContrastMl > 0 ? src.planContrastMl : undefined;
  const key = `${cto}:${used}:${planMl ?? ""}`;
  if (mem?.budget && mem.budget.profile === src.profile && mem.budget.key === key) return mem.budget.value;
  const value = contrastBudgetForProfile(src.profile, { cto, usedMl: used, planMl });
  if (mem) mem.budget = { profile: src.profile, key, value };
  return value;
}

/** The route to the target vessel, from the memory while the geometry and the vessel are unchanged. */
function routeToTarget(g: PciGeom, vessel: string, mem: PciBridgeMemory): readonly string[] {
  if (mem.path && mem.path.g === g && mem.path.vessel === vessel) return mem.path.ids;
  const ids = pathTo(g, vessel);
  mem.path = { g, vessel, ids };
  return ids;
}

/** The PCI part of the attending's input (see the header). */
export function pciInputOf(src: PciBridgeSource, mem: PciBridgeMemory = newPciBridgeMemory()): PciInput {
  const { snap, g } = src;
  const st = snap.state;
  const P = PCI_BRIDGE_PARAMS;
  const inCoronary = st.tipMm > 0;
  const branch = inCoronary ? (st.route[st.route.length - 1] ?? null) : null;
  const path = routeToTarget(g, snap.lesion.vessel, mem);
  const side = sideBranchOf(src.scenario);
  const dev = st.device;
  const span = deviceSpan(st);
  const kind: PciInput["deviceKind"] = dev ? (dev.kind === "stent" || dev.kind === "covered-stent" ? "stent" : dev.kind === "balloon" ? "balloon" : null) : null;
  // the device moved since the last frame (a new device is not a move)
  const specKey = dev ? `${dev.specId}:${dev.diameter}:${dev.lengthMm}` : null;
  const moving = !!span && mem.lastDistal !== null && mem.lastSpec === specKey && Math.abs(span.to - mem.lastDistal) > P.deviceMovingMm;
  mem.lastDistal = span ? span.to : null;
  mem.lastSpec = specKey;
  const inside = !!span && span.to > 0;
  const localRefMm = dev && dev.centreMm > 0 ? 2 * radiusAtMm(g, st.route, dev.centreMm, true) : undefined;
  const inLesion = !!span && inside && lesionCover(g, st.route, span.from, span.to) > 0.05;
  const inStent = !!span && inside && st.stents.some((p) => Math.max(0, Math.min(span.to, p.toMm) - Math.max(span.from, p.fromMm)) > 0);
  const budget = pciContrastBudget(src, mem);
  return {
    wireBranch: branch,
    wireInSeptal: !!branch && /^S\d/.test(branch),
    wireOffRoute: !!branch && !path.includes(branch) && branch !== side,
    wireTipDistal: !!st.wire.distal?.inDanger,
    deviceBeyondWire: !!span && span.to > 0 && span.to >= st.tipMm - P.beyondWireMarginMm - 1e-6,
    deviceKind: kind,
    deviceDiameter: dev?.diameter,
    localRefMm,
    deviceInLesion: inLesion,
    deviceInStent: inStent,
    injectedSinceDeviceMove: st.injectedSinceDeviceMove,
    actOk: actGate(st.act?.value ?? null, st.heparinGiven).ok,
    deviceAtGuideTip: !!span && span.to >= -P.guideExitZoneMm && span.from < 0,
    deviceMoving: moving,
    balloonInflated: !!dev && (dev.inflated || st.ind.fill > P.inflatedFill),
    pulledBeforeDeflation: recent(st, "pull-before-deflation", P.pullWindowS),
    // only the engine's push-induced back-out (its 'guide-backout' telemetry): a guide disengaged on
    // purpose (an aorto-ostial stent positioned with the guide backed off, complex-pci/01-ostial.ts) is not one
    guideBackedOut: !!dev && recent(st, "guide-backout", P.backoutWindowS),
    actRequired: snap.policy?.mode === "supervised",
    contrastMl: snap.contrastMl ?? st.contrastMl,
    contrastCeilingMl: budget ? budget.ceilingMl : undefined,
    contrastWarnMl: budget ? budget.warnAtMl : undefined,
  };
}

/** The engagement class the PCI lab gives the attending: seated in its coronary, or in the root. */
function engagementOf(src: PciBridgeSource): EngagementKind {
  if (!src.snap.state.guide.engaged) return "ascending-aorta";
  return src.scenario.side === "right" ? "selective-rca" : "selective-lm";
}

function pressureOf(src: PciBridgeSource): PressureKind {
  const p = src.snap.guidePressure;
  return (PRESSURE_KINDS as readonly string[]).includes(p ?? "") ? (p as PressureKind) : "aortic";
}

/** The attending's input for one frame of the PCI lab (MentorInput, lab 'pci'). */
export function pciMentorInput(src: PciBridgeSource, mem: PciBridgeMemory = newPciBridgeMemory(), tWall: number = src.snap.t): MentorInput {
  const st = src.snap.state;
  const art = src.snap.vitals?.art;
  return {
    tWall,
    lab: "pci",
    engagement: engagementOf(src),
    pressure: pressureOf(src),
    sys: art?.sys ?? 0,
    dia: art?.dia ?? 0,
    // the PCI hands' resistance reaches the attending through the guide back-out, not the catheter rule
    resistance: 0,
    advancing: false,
    insertion: st.tipMm,
    aspirated: st.aspirated ? "clean" : "unknown",
    beam: beamCode(src.snap.workflow?.beam),
    cArm: src.cArm ?? { laoRao: 0, cranialCaudal: 0 },
    catheterId: st.guide.id,
    targetSide: src.scenario.side,
    pci: pciInputOf(src, mem),
  };
}

/** The pending action the attending is asked about for a session action, or null when it asks nothing. */
export function pciPreActionFor(action: string, st: PciState): PreAction | null {
  switch (action) {
    case "advance-wire":
      return "advance-wire";
    case "advance-device":
      return "advance-device";
    case "inject":
      return "inject";
    case "inflate": {
      const d = st.device;
      // an undeployed stent's inflation deploys it
      return d && (d.kind === "stent" || d.kind === "covered-stent") && !d.deployed ? "deploy" : "inflate";
    }
    default:
      return null;
  }
}

/** The facts the debrief's PCI metrics compare against (the active target lesion). */
export function pciCaseFacts(snap: Pick<PciBridgeSnapshot, "lesion" | "state">): CaseFacts {
  const L = snap.lesion;
  return { lesion: { startMm: L.startMm, endMm: L.endMm, refDiameterMm: L.refDiameter, lengthMm: L.endMm - L.startMm } };
}

/** One recorder frame (10 Hz) of the PCI lab. */
export function pciFrameSample(src: PciBridgeSource, tWall: number, step: number): FrameSample {
  const { snap } = src;
  const st = snap.state;
  const dose = snap.dose;
  const art = snap.vitals?.art;
  const cArm = src.cArm ?? { laoRao: 0, cranialCaudal: 0 };
  return {
    tWall,
    tPatient: src.tPatient ?? snap.t,
    tFluoro: dose ? dose.fluoroTimeS + dose.cineTimeS : st.fluoroS,
    step,
    cmdInsertion: st.tipMm,
    insertion: st.tipMm,
    cmdTorque: st.wire.hub,
    torque: st.wire.tip,
    wireInsertion: st.tipMm,
    tipX: 0,
    tipY: 0,
    tipZ: 0,
    tipHeight: 0,
    tipAz: st.wire.tip,
    depth: st.guide.depthMm ?? 0,
    eng: Math.max(0, ENGAGEMENT_KINDS.indexOf(engagementOf(src))),
    press: Math.max(0, PRESSURE_KINDS.indexOf(pressureOf(src))),
    sys: art?.sys ?? 0,
    dia: art?.dia ?? 0,
    resistance: st.resistance,
    laoRao: cArm.laoRao,
    cranCaud: cArm.cranialCaudal,
    field: src.field ?? 0,
    pps: src.pps ?? 0,
    beam: beamCode(snap.workflow?.beam),
    syringe: 0,
    contrastMl: snap.contrastMl ?? st.contrastMl,
    karMGy: dose?.karMGy.total ?? 0,
    kapGyCm2: dose?.kapGyCm2.total ?? 0,
    hr: snap.vitals?.hr ?? 0,
    wireTipMm: st.tipMm,
    deviceMm: st.device ? st.device.centreMm : NaN,
  };
}

// --- events for the recorder -------------------------------------------------------------------

/** What the forwarder needs of a recorder (ProcedureRecorder fits). */
export interface PciEventSink {
  event(e: RecordedEvent): RecordedEvent;
}

/**
 * Engine telemetry kinds the forwarder leaves out: the session records its own case start and case end
 * (PciLabSession.finish; the attending's assessment adds the residual stenosis to it), so the record holds one of each.
 */
const SKIP_KINDS = new Set(["case-start", "case-end"]);

/**
 * Turns the engine's telemetry (st.log, appended to by every action) and the beam into recorder
 * events, once each: cine-start and cine-end around each cine run (with the C-arm), fluoro-on and
 * fluoro-off, every new st.log record under its own kind with its data (a device 'move' from the
 * assisted path, which logs no beyondWire, gets the engine's beyond-wire flag from the state), a
 * 'heparin' event when the patient is heparinised and an 'act' event for each new ACT. The engine logs an
 * injection with ml 0 at the press and the session books the syringes' volume as the run goes, so a
 * forwarded 'inject' gets its volume: the rise of the case's contrast total after it, up to the next injection.
 */
export class PciRecordForwarder {
  private seen = 0;
  private beam: BeamCode = 0;
  private cineStart: number | null = null;
  private heparin = false;
  private actKey = "";
  /** the last forwarded injection still waiting for its booked volume, with the contrast total at the press */
  private pendingInject: { e: RecordedEvent; mlAtPress: number } | null = null;
  constructor(private readonly sink: PciEventSink) {}

  /** Forward what is new in this frame. Returns the events added. */
  sync(src: PciBridgeSource, tWall: number, tPatient: number = src.tPatient ?? src.snap.t): RecordedEvent[] {
    const st = src.snap.state;
    const out: RecordedEvent[] = [];
    let k = 0;
    const at = () => tWall + PCI_BRIDGE_PARAMS.eventOrderS * k++;
    const push = (kind: string, data?: Record<string, unknown>) => {
      const e: RecordedEvent = { kind, data, tWall: at(), tPatient, step: 0, cmd: 0, ext: true };
      out.push(this.sink.event(e));
    };
    const cArm = src.cArm ?? { laoRao: 0, cranialCaudal: 0 };
    const beam = beamCode(src.snap.workflow?.beam);
    // beams switching on come before what happened under them
    if (beam !== this.beam) {
      if (this.beam === 2) {
        push("cine-end", { laoRao: cArm.laoRao, cranCaud: cArm.cranialCaudal, durationS: this.cineStart === null ? 0 : tWall - this.cineStart });
        this.cineStart = null;
      }
      if (this.beam === 1) push("fluoro-off", {});
      if (beam === 1) push("fluoro-on", {});
      if (beam === 2) {
        this.cineStart = tWall;
        push("cine-start", { laoRao: cArm.laoRao, cranCaud: cArm.cranialCaudal });
      }
      this.beam = beam;
    }
    // the volume of the last injection: the case's contrast total since its press, followed as its run
    // is pushed and booked, until the next injection (only an injection adds contrast)
    const ml = src.snap.contrastMl ?? st.contrastMl;
    const pend = this.pendingInject;
    if (pend && ml > pend.mlAtPress + 1e-9 && pend.e.data) pend.e.data.ml = Math.round((ml - pend.mlAtPress) * 10) / 10;
    if (!this.heparin && st.heparinGiven) {
      this.heparin = true;
      push("heparin", { given: true });
    }
    const actKey = st.act ? `${st.act.value}:${st.act.t}` : "";
    if (actKey && actKey !== this.actKey) {
      this.actKey = actKey;
      push("act", { seconds: st.act!.value });
    }
    // the log is append-only; a shorter log (a new session) starts again
    if (st.log.length < this.seen) this.seen = 0;
    for (let i = this.seen; i < st.log.length; i++) {
      const r = st.log[i];
      if (SKIP_KINDS.has(r.kind)) continue;
      let data: Record<string, unknown> = { ...r.data, t: r.t };
      if (r.kind === "device" && r.data.action === "move" && r.data.beyondWire === undefined) {
        const len = typeof r.data.lengthMm === "number" ? r.data.lengthMm : (st.device?.lengthMm ?? 0);
        const centre = typeof r.data.centreMm === "number" ? r.data.centreMm : (st.device?.centreMm ?? -Infinity);
        const distal = centre + len / 2;
        data = { ...data, lengthMm: len, diameter: r.data.diameter ?? st.device?.diameter, beyondWire: distal > 0 && distal >= st.tipMm - PCI_BRIDGE_PARAMS.beyondWireMarginMm - 1e-6 };
      }
      push(r.kind, data);
      if (r.kind === "inject") this.pendingInject = !(typeof data.ml === "number" && data.ml > 0) ? { e: out[out.length - 1], mlAtPress: ml } : null;
    }
    this.seen = st.log.length;
    return out;
  }

  /** Close an open cine run (the case ends with the pedal down). */
  close(tWall: number, cArm: CArm = { laoRao: 0, cranialCaudal: 0 }): void {
    if (this.beam === 2) this.sink.event({ kind: "cine-end", data: { laoRao: cArm.laoRao, cranCaud: cArm.cranialCaudal, durationS: this.cineStart === null ? 0 : tWall - this.cineStart }, tWall, tPatient: tWall, step: 0, cmd: 0, ext: true });
    if (this.beam === 1) this.sink.event({ kind: "fluoro-off", data: {}, tWall, tPatient: tWall, step: 0, cmd: 0, ext: true });
    this.beam = 0;
    this.cineStart = null;
  }
}

/**
 * What the PCI attending reports to the lab tips: the pre-brief and the plan put the tips at phase
 * 'plan', the sign-out and the debrief at 'finish' (with the finish-phase events kept by the tip
 * context). The session raises both phases itself (PciLabSession raises); this declaration is the
 * attending's, for its tests and the plan's 'its event source exports raises'.
 */
export const raises: LabRaises = { lab: "pci", phases: ["plan", "finish"], events: [] };
