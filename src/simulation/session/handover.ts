// ---------------------------------------------------------------------------
// Hand-over contract between labs (found-handover-contract).
//
// One set of types for what passes from one lab to another:
//   - HandoverExtensions: the fields the full case's SessionHandover gains
//     (PCI target, anticoagulation, antithrombotics, contrast, consent limit,
//     sheath state). Every field is optional and additive: caseSession.ts
//     adopts them in proc-foundation-scenarios-ledger and later packages, and
//     a lab that does not read a field behaves as before.
//   - LabReport: what a lab returns when the case comes back from it (stents,
//     final TIMI flow, complications, contrast, dose, duration, residual).
//   - PatientHandover: a PatientEngine snapshot with the profile (and the
//     rendered coronary tree, when the snapshot was taken on one) that a
//     receiving lab needs to rebuild the same patient. Stand-alone transfers
//     (perforation to pericardiocentesis, stenting to post-PCI physiology,
//     biopsy perforation to drainage) carry one through useLabHandoverStore.
//
// Names of events come from the tip vocabulary (src/content/lab/tips.ts);
// this file imports only its types, so it stays engine-side and DOM-free.
// No clinical number is defined here: doses, ACT targets and contrast
// ceilings come from the modules that already cite them (SOURCED_DOSES in
// caseSession.ts, pharmacology.ts, contrastBudget.ts).
// ---------------------------------------------------------------------------

import type { Lesion, VesselId } from "../../types";
import type { LabEvent } from "../../content/lab/tips";
import type { LaunchSim } from "../../content/schema";
import type { AngioCadSegment } from "../patient/angiocadPriors";
import type { PatientProfile } from "../patient/patient";
import type { DoacAgent, DrugId, InfusionDrug, Route } from "../patient/pharmacology";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import { PatientEngine, type EngineOptions, type EngineSnapshot } from "../patient/engine";

// ---------------------------------------------------------------------------
// The full case's hand-over extensions
// ---------------------------------------------------------------------------

/** What the operator decided to do with the lesion chosen in the study report. */
export type PciStrategy = "adhoc" | "defer" | "staged";
export const PCI_STRATEGIES: readonly PciStrategy[] = ["adhoc", "defer", "staged"];

/** The lesion chosen for PCI in the diagnostic study report (diag-study-report chooses it; nothing else does). */
export interface PciTarget {
  vessel: VesselId;
  /** AngioCAD segment of the lesion, when the report names one */
  segment: AngioCadSegment | null;
  /** percent diameter stenosis the learner measured by QCA (null when not measured) */
  qcaPct: number | null;
  /** lesion length the learner measured (mm; null when not measured) */
  lengthMm: number | null;
  /** the case lesion this target refers to (lesionIdOf), so the debrief can compare it with the case truth */
  lesionId: string;
  strategy: PciStrategy;
}

/** Routes by which heparin reaches the patient in the lab: IV cannula or the sheath side arm (pharmacology.ts owns the routes). */
export type AnticoagRoute = Extract<Route, "iv" | "ia">;

/** One heparin bolus. `delivered` is false when the line was tissued and the dose never reached the circulation. */
export interface HeparinDose {
  /** units */
  u: number;
  /** session time of the dose (s) */
  t: number;
  route: AnticoagRoute;
  delivered: boolean;
}

/** An anticoagulant or antiplatelet infusion running at the hand-over. */
export interface InfusionRecord {
  drug: InfusionDrug;
  /** rate in the formulary's unit for the drug (INFUSIONS[drug].unit) */
  rate: number;
  /** session time the infusion started (s) */
  startedS: number;
}

/** An ACT measurement. */
export interface ActReading {
  /** session time (s) */
  t: number;
  /** seconds */
  act: number;
}

export interface AnticoagState {
  doses: HeparinDose[];
  /** heparin or bivalirudin infusions */
  infusions: InfusionRecord[];
  lastAct: ActReading | null;
  /** the ACT range the next procedure requires (s), from SOURCED_DOSES; null when none applies */
  targetS: [number, number] | null;
}

/** Oral anticoagulant the patient takes (from the profile). */
export interface OralAnticoagulant {
  kind: "warfarin" | "doac";
  agent?: DoacAgent;
  hoursSinceDose?: number;
}

/** One oral antiplatelet dose. */
export interface OralDose<D extends string> {
  drug: D;
  /** mg */
  dose: number;
  /** session time the dose was given (s); negative for a dose taken before the case started */
  at: number;
}

/** The oral P2Y12 inhibitors, as the formulary (pharmacology.ts DrugId) names them. */
export type P2y12Drug = Extract<DrugId, "clopidogrel" | "prasugrel" | "ticagrelor">;

export interface AntithromboticState {
  oac: OralAnticoagulant | null;
  aspirin: OralDose<Extract<DrugId, "aspirin">> | null;
  p2y12: OralDose<P2y12Drug> | null;
  /** IV antiplatelet infusions (cangrelor, eptifibatide, tirofiban) */
  infusions: InfusionRecord[];
}

export interface ContrastState {
  usedMl: number;
  /** the case's contrast budget (contrastBudget.ts); null when no budget applies */
  budgetMl: number | null;
  /** budget minus used, never below zero; null without a budget */
  remainingMl: number | null;
}

/**
 * What the consent covers beyond the diagnostic study: nothing ('diagnostic-only'), ad hoc PCI of the
 * lesion found ('target-only') or any ad hoc PCI the operator judges necessary ('any').
 */
export type AdHocConsent = "diagnostic-only" | "target-only" | "any";
export const AD_HOC_CONSENTS: readonly AdHocConsent[] = ["diagnostic-only", "target-only", "any"];

export interface ConsentState {
  adHocLimit: AdHocConsent;
}

export interface SheathState {
  /** a clot in the sheath (not aspirated before flushing): the next flush embolises it unless it is aspirated */
  clot: boolean;
  /** the sheath was aspirated and flushed since the last exchange */
  aspirated?: boolean;
}

/**
 * The optional fields the full case's SessionHandover gains. caseSession.ts adopts them as
 * `SessionHandover & HandoverExtensions`; a lab that does not read them is unchanged.
 */
export interface HandoverExtensions {
  pciTarget?: PciTarget;
  anticoag?: AnticoagState;
  antithrombotic?: AntithromboticState;
  contrast?: ContrastState;
  consent?: ConsentState;
  sheathState?: SheathState;
}

/** A hand-over with the extensions: `WithHandover<SessionHandover>`. */
export type WithHandover<T> = T & HandoverExtensions;

// ---------------------------------------------------------------------------
// What a lab returns
// ---------------------------------------------------------------------------

export type TimiFlow = 0 | 1 | 2 | 3;

/** A stent the lab placed. Device names are generic (HANDOVER 6.5). */
export interface ReportedStent {
  vessel: VesselId;
  segment: AngioCadSegment | null;
  /** nominal diameter and length from the device catalogue (mm) */
  diameterMm: number;
  lengthMm: number;
  /** generic platform name, as the catalogue labels it */
  platform?: string;
  /** highest pressure used on the stent or a post-dilation balloon inside it (atm) */
  maxAtm?: number;
  postDilated?: boolean;
}

/** A complication as the lab recorded it. */
export interface ReportedComplication {
  /** the lab's complication id */
  id: string;
  label: string;
  /** session time it was recognised (s) */
  t: number;
  severity: "minor" | "major";
  /** vocabulary events it raises in the receiving lab (for example 'perforation', 'tamponade') */
  events?: LabEvent[];
  /** treated and controlled by the end of the lab */
  resolved?: boolean;
}

/** Residual narrowing of a treated (or deliberately untreated) lesion at the end of the lab. */
export interface ReportedResidual {
  vessel: VesselId;
  lesionId?: string;
  /** percent diameter stenosis */
  pct: number;
}

/** Radiation dose of the lab's run, in the units of the session totals. */
export interface ReportedDose {
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
}

/** What each lab returns to the case (and to the next lab). */
export interface LabReport {
  /** the lab that produced it */
  lab: LaunchSim;
  stents: ReportedStent[];
  /** final TIMI flow in the treated vessel; null when no vessel was treated */
  finalTimi: TimiFlow | null;
  complications: ReportedComplication[];
  /** contrast this lab used (mL) */
  contrastMl: number;
  dose: ReportedDose;
  durationS: number;
  residual: ReportedResidual[];
  /** catheter exchanges made without a wire in a diseased aorta (diagnostic lab; recovery-ward cholesterol embolisation) */
  wirelessExchanges?: number;
  /** events the case keeps active afterwards (finish-phase complication, dose and contrast flags) */
  events?: LabEvent[];
}

/** An empty report for a lab that ran nothing. */
export function emptyLabReport(lab: LaunchSim): LabReport {
  return { lab, stents: [], finalTimi: null, complications: [], contrastMl: 0, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 }, durationS: 0, residual: [] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A stable id for a case lesion: its vessel and its position along the vessel to three decimals. */
export function lesionIdOf(l: Pick<Lesion, "vessel" | "position">): string {
  return `${l.vessel}@${l.position.toFixed(3)}`;
}

/** Contrast state from what was used and the budget (remaining is clamped at zero). */
export function contrastState(usedMl: number, budgetMl: number | null): ContrastState {
  const used = Math.max(0, usedMl);
  return { usedMl: used, budgetMl, remainingMl: budgetMl === null ? null : Math.max(0, budgetMl - used) };
}

/** Heparin that actually reached the circulation (tissued doses excluded), units. */
export function deliveredHeparinU(a: Pick<AnticoagState, "doses">): number {
  return a.doses.reduce((s, d) => s + (d.delivered ? d.u : 0), 0);
}

// ---------------------------------------------------------------------------
// Patient transfer
// ---------------------------------------------------------------------------

/**
 * A patient in transit between labs: the engine snapshot, the profile the engine was built from
 * (the snapshot holds only its seed) and, when the snapshot was taken on a rendered coronary tree,
 * that tree, without which restore() cannot rebuild the coronary network.
 */
export interface PatientHandover {
  snapshot: EngineSnapshot;
  profile: PatientProfile;
  tree?: CoronaryTree | null;
}

/** Deep copy of plain data (structuredClone where available). */
export function cloneData<T>(x: T): T {
  const sc = (globalThis as { structuredClone?: <U>(v: U) => U }).structuredClone;
  return sc ? sc(x) : (JSON.parse(JSON.stringify(x)) as T);
}

/**
 * Check that a patient hand-over can be restored: the profile is the snapshot's patient, and a
 * snapshot taken on a rendered tree comes with that tree. Returns the problem, or null.
 */
export function patientHandoverProblem(p: PatientHandover): string | null {
  if (p.profile.seed !== p.snapshot.profileSeed) return `snapshot belongs to patient ${p.snapshot.profileSeed}, the profile is ${p.profile.seed}`;
  const key = p.snapshot.network?.treeKey ?? null;
  if (key) {
    if (!p.tree) return `snapshot was taken on coronary tree ${key}; the hand-over must carry that tree`;
    if (PatientEngine.treeKey(p.tree) !== key) return `the hand-over's coronary tree is not the one the snapshot was taken on (${key})`;
  }
  return null;
}

/** A copy of an engine's current state for a hand-over (the tree is the one the engine was given, if any). */
export function patientHandoverFrom(engine: PatientEngine, tree: CoronaryTree | null = null): PatientHandover {
  return { snapshot: engine.snapshot(), profile: cloneData(engine.profile), tree };
}

/**
 * Build the receiving lab's own engine from a hand-over: a new PatientEngine on the same profile,
 * coronary network and tree, restored to the snapshot. The receiving lab owns this engine; the
 * sending lab's engine is not touched (and should stop, since the patient has left). Options such as
 * the session clock or the transducer line may be passed; profile, tree and lesions come from the
 * hand-over. The circulation fit is skipped by default (calibrate: false) because restore() replaces
 * everything it would produce: the snapshot carries the sender's fitted circulation; a caller may
 * still pass calibrate: true.
 */
export function engineFromHandover(p: PatientHandover, opts: Omit<EngineOptions, "profile" | "seed" | "tree" | "lesions"> = {}): PatientEngine {
  const problem = patientHandoverProblem(p);
  if (problem) throw new Error(problem);
  const net = p.snapshot.network;
  const tree = p.tree ?? undefined;
  const e = new PatientEngine({ calibrate: false, ...opts, profile: cloneData(p.profile), tree, lesions: net ? cloneData(net.lesions) : undefined });
  e.restore(cloneData(p.snapshot), { tree: p.tree ?? null });
  return e;
}
