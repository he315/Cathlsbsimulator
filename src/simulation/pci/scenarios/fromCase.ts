// ---------------------------------------------------------------------------
// Ad hoc PCI on the lesion the full case diagnosed (pci-adhoc-handover).
//
// After the diagnostic study and the ad hoc gate the PCI lab opens on the
// same patient: scenarioFromCase(caseData, target, profile) builds the PCI
// scenario definition from the case's own AnatomyCase, not from a pack:
//   - the same anatomy (dominance, root size, variants, grafts) and every
//     lesion of the case with its position, severity, kind and morphology;
//     the lesion the study report chose (PciTarget, diag-study-report: the
//     report is the only place a target is chosen) is the target, the others
//     are bystanders, or non-culprit lesions when the case has an acute
//     culprit elsewhere;
//   - the case identity (its id, which seeds the coronary genome, the root
//     rotation and the aortic tilt), carried as `caseIdentity`; caseAnatomyOf
//     turns it into an anatomy case that grows the diagnostic lab's coronary
//     tree. The PCI session does not use it yet: PciLabSession takes its
//     anatomy from scenarioCase (actions/scenario.ts), which gives the id
//     'pci-<def.id>' and a root rotation and aortic tilt of 0, so the live
//     lab's tree differs from the diagnostic one until that reader honours
//     caseIdentity (outside this package; PciLab.adhocHandover.test.ts holds
//     the expected-to-fail check);
//   - the patient from the profile (weight, eGFR), the access route, the
//     contrast used so far and the case's contrast budget;
//   - the table as the diagnostic study left it: the diagnostic catheter in
//     the aortic root (the default start, phase 'guide'), to be exchanged for
//     a guide; heparin from the case (heparinised when any reached the
//     circulation).
// targetCheck compares the choice with the case truth (the debrief's line:
// a target that is not the culprit is treated all the same, and the case
// continues). pciLabReport turns what the PCI lab did into the hand-over
// contract's LabReport (stents, final TIMI, complications, residual,
// contrast, dose, duration, the finish-phase flags) for returnFromLab.
//
// Model parameters (docs/realism/facts/pkg-pci-adhoc-handover.md): the lesion
// length when a case lesion gives none, the tortuosity grade from the case's
// variants, the minor or major grading of a reported complication and the
// final TIMI grade from the engine state. The default guides and working
// views are the core pack's (packs/core.ts), read from the registry.
// ---------------------------------------------------------------------------

import type { AnatomyCase, Dominance, Lesion, VesselId } from "../../../types";
import type { LabEvent } from "../../../content/lab/tips";
import type { PatientProfile } from "../../patient/patient";
import { segmentMap } from "../../patient/patient";
import { ANGIOCAD_SEGMENTS } from "../../patient/angiocadPriors";
import type { LabReport, PciTarget, ReportedComplication, ReportedStent, TimiFlow } from "../../session/handover";
import { lesionIdOf } from "../../session/handover";
import type { EpaId } from "../../../progress/types";
import type { PciState } from "../state";
import { GUIDES, DEVICE_BY_ID } from "../equipment";
import { catheterById } from "../../../data/catheters";
import { timiFor } from "../../complications/noReflow";
import { STANDARD_PCI_STARTS } from "./packs/core";
import { pciScenarioDef, scenarioEvents, targetIndex, type RegisteredPciScenario } from "./registry";
import { toPciScenario, type PciRuntimeScenario } from "./legacy";
import type { ResolvedPciScenario } from "./generate";
import type { PciLesion, PciScenarioDef, PciStartDef } from "./types";

// --- model parameters ------------------------------------------------------------------------------

/**
 * MODEL PARAMETERS of the case-to-PCI hand-over (docs/realism/facts/pkg-pci-adhoc-handover.md).
 *  - defaultLengthMm: a case lesion without a length is given the median length lesionsFromProfile draws
 *    (src/simulation/patient/patient.ts: log-normal median 18 mm for an occlusion, 12 mm otherwise), so
 *    the devices can be sized to it.
 *  - tortuousVariants: the coronary variants of the case that make the device route moderately tortuous (grade 1).
 *  - minorWhenTreated: complication kinds reported as minor when treated or resolved by the end of the
 *    lab; every other complication, and any left untreated, is major.
 */
export const MP_FROM_CASE = {
  defaultLengthMm: { occlusion: 18, other: 12 },
  tortuousVariants: ["tortuous-rca", "shepherds-crook-rca"] as readonly string[],
  minorWhenTreated: ["dissection", "side-branch", "air"] as readonly string[],
} as const;

/** The core pack scenario whose guide and working views a target vessel borrows (packs/core.ts). */
const CORE_BY_VESSEL: Partial<Record<VesselId, string>> = { LM: "lad-focal", LAD: "lad-focal", D1: "lad-focal", D2: "lad-focal", SEPTAL: "lad-focal", RAMUS: "lad-focal", LCx: "lcx-stemi", OM1: "lcx-stemi", OM2: "lcx-stemi", RCA: "rca-calcified", CONUS: "rca-calcified", AM: "rca-calcified" };

// --- types -------------------------------------------------------------------------------------------

/** What makes the anatomy the case's own: the id seeds the coronary genome; the root and aorta orientation. */
export interface CaseIdentity {
  id: string;
  name: string;
  rootRotationDeg: number;
  aortaTiltDeg: number;
}

/**
 * How the target was found among the case's lesions: by its lesion id, by its vessel, not at all ('fallback': the
 * report named no lesion of the case, or none was handed over), or found but on a vessel the PCI lab's coronary
 * tree cannot place ('unplaced': the lab treats another lesion instead).
 */
export type TargetMatch = "lesion" | "vessel" | "fallback" | "unplaced";

/** The choice against the case truth (shown in the debrief only). */
export interface TargetCheck {
  /** the case lesion treated as the target */
  lesionId: string;
  /** the report's target named this lesion ('lesion'), only its vessel ('vessel'), nothing in the case ('fallback'), or a lesion the lab cannot place ('unplaced') */
  match: TargetMatch;
  /** the culprit lesion of an acute presentation, when the case has one */
  culpritId: string | null;
  /** the culprit's vessel and AngioCAD segment (null without a culprit) */
  culpritVessel: VesselId | null;
  culpritSegment: string | null;
  /** the target is the culprit (null without a culprit) */
  isCulprit: boolean | null;
}

/** A PCI scenario definition built from a full case. */
export interface CasePciScenarioDef extends PciScenarioDef {
  caseIdentity: CaseIdentity;
  /** the report's target as handed over (null: none was chosen, the most severe lesion is treated) */
  chosen: PciTarget | null;
  targetCheck: TargetCheck;
  /** contrast so far and the case's budget (mL; null without one) */
  contrast: { usedMl: number; budgetMl: number | null };
  /** the diagnostic catheter left in the aortic root (null when none) */
  catheterInRoot: string | null;
}

export interface FromCaseOptions {
  /** contrast the case has used so far (mL) */
  contrastMl?: number;
  /** the case's contrast budget (mL) */
  contrastBudgetMl?: number | null;
  /** the diagnostic catheter in the aorta */
  catheterId?: string | null;
  /** heparin reached the circulation before the hand-over (default true) */
  heparinised?: boolean;
  /** the sheath's French size (the guide matches it; the engine models 6 and 7) */
  french?: 6 | 7;
  /**
   * the vessels the PCI lab's coronary tree has: a target on any other vessel is 'unplaced', and the most severe
   * lesion the lab can place is treated instead (absent: every vessel can be placed)
   */
  placeable?: (v: VesselId) => boolean;
}

// --- helpers -------------------------------------------------------------------------------------------

/** The coronary ostium a vessel is reached from. */
export function sideOfVessel(v: VesselId, dominance: Dominance): "left" | "right" {
  if (v === "RCA" || v === "CONUS" || v === "AM") return "right";
  if (v === "PDA" || v === "PLV") return dominance === "left" ? "left" : "right";
  return "left";
}

const occlusion = (l: Lesion) => l.severity >= 100 || l.kind === "cto" || l.morphology === "cto";

/** A case lesion as a PCI lesion: the same lesion, with a length the devices can be sized to. */
function pciLesionOf(l: Lesion): PciLesion {
  const lengthMm = l.lengthMm && l.lengthMm > 0 ? l.lengthMm : occlusion(l) ? MP_FROM_CASE.defaultLengthMm.occlusion : MP_FROM_CASE.defaultLengthMm.other;
  return { ...l, ...(l.sites ? { sites: [...l.sites] } : {}), lengthMm };
}

/**
 * The case lesion the target refers to: by its lesion id, else the most severe on its vessel, else the most
 * severe of the case. Null only for a case without lesions.
 */
export function targetLesionIndex(lesions: readonly Lesion[], target: PciTarget | null): { idx: number; match: TargetMatch } | null {
  if (!lesions.length) return null;
  const worst = (pool: number[]) => pool.sort((a, b) => lesions[b].severity - lesions[a].severity || lesions[a].position - lesions[b].position)[0];
  if (target) {
    const exact = lesions.findIndex((l) => lesionIdOf(l) === target.lesionId);
    if (exact >= 0) return { idx: exact, match: "lesion" };
    const on = lesions.map((_, i) => i).filter((i) => lesions[i].vessel === target.vessel);
    if (on.length) return { idx: worst(on), match: "vessel" };
  }
  return { idx: worst(lesions.map((_, i) => i)), match: "fallback" };
}

/**
 * The culprit lesion of an acute presentation: the profile names its AngioCAD segment, and the case's lesions
 * are the profile's (lesionsFromProfile writes one per graded segment, in segment order). Null when the
 * profile has no culprit or the case's lesions are not the profile's.
 */
export function culpritLesionIndex(c: Pick<AnatomyCase, "lesions" | "dominance">, profile: Pick<PatientProfile, "culprit" | "angiocad">): number | null {
  if (!profile.culprit) return null;
  const segs = ANGIOCAD_SEGMENTS.filter((s) => profile.angiocad.grades[s] !== 0);
  if (segs.length !== c.lesions.length) return null;
  if (segs.some((s, i) => segmentMap(s, c.dominance).vessel !== c.lesions[i].vessel)) return null;
  const i = segs.indexOf(profile.culprit.segment);
  return i >= 0 ? i : null;
}

function epaFor(l: PciLesion, profile: Pick<PatientProfile, "indication">): EpaId {
  if (profile.indication === "STEMI") return "pci-stemi";
  if (l.kind === "cto" || l.morphology === "cto") return "pci-cto";
  if (l.calcium === 2) return "pci-calcium";
  return "pci-simple";
}

const VESSEL_NAME: Record<VesselId, string> = {
  LM: "left main",
  LAD: "LAD",
  LCx: "circumflex",
  RCA: "RCA",
  D1: "first diagonal",
  D2: "second diagonal",
  OM1: "first obtuse marginal",
  OM2: "second obtuse marginal",
  RAMUS: "ramus",
  SEPTAL: "septal",
  PDA: "posterior descending",
  PLV: "posterolateral",
  CONUS: "conus",
  AM: "acute marginal",
};

/** The vessel's name in the lab's text. */
export const vesselName = (v: VesselId): string => VESSEL_NAME[v] ?? v;

/** A catalogue catheter's display name (src/data/catheters.ts), else its id. */
export const catheterName = (id: string): string => catheterById(id)?.name ?? id;

// --- the definition ----------------------------------------------------------------------------------

/**
 * The PCI scenario of a full case: its anatomy and lesions, the report's target as the target, the patient
 * from the profile, the table as the diagnostic study left it. Throws for a case without lesions (the ad hoc
 * gate never hands one over).
 */
export function scenarioFromCase(caseData: AnatomyCase, target: PciTarget | null, profile: PatientProfile, o: FromCaseOptions = {}): CasePciScenarioDef {
  const named = targetLesionIndex(caseData.lesions, target);
  if (!named) throw new Error(`scenarioFromCase: case ${caseData.id} has no lesion to treat`);
  let found = named;
  if (o.placeable && !o.placeable(caseData.lesions[named.idx].vessel)) {
    // the lab cannot place the lesion the report named: the most severe lesion it can place
    const pool = caseData.lesions.map((_, i) => i).filter((i) => o.placeable!(caseData.lesions[i].vessel));
    const alt = targetLesionIndex(pool.map((i) => caseData.lesions[i]), null);
    if (!alt) throw new Error(`scenarioFromCase: case ${caseData.id} has no lesion the lab can place`);
    found = { idx: pool[alt.idx], match: named.match === "lesion" || named.match === "vessel" ? "unplaced" : "fallback" };
  }
  const culprit = culpritLesionIndex(caseData, profile);
  const lesions: PciLesion[] = caseData.lesions.map((l, i) => ({ ...pciLesionOf(l), role: i === found.idx ? "target" : culprit !== null && i !== culprit ? "non-culprit" : "bystander" }));
  const t = lesions[found.idx];
  const side = sideOfVessel(t.vessel, caseData.dominance);
  const core = pciScenarioDef(CORE_BY_VESSEL[t.vessel] ?? (side === "right" ? "rca-calcified" : "lad-focal"));
  const guideDefault = core?.setup.guideDefault ?? GUIDES.find((g) => g.side === side)!.id;
  const guidesAcceptable = GUIDES.filter((g) => g.id !== guideDefault && (g.side === side || g.side === "both")).map((g) => g.id);
  const usedMl = Math.max(0, Number(o.contrastMl) || 0);
  const budgetMl = o.contrastBudgetMl !== undefined && o.contrastBudgetMl !== null && Number(o.contrastBudgetMl) > 0 ? Number(o.contrastBudgetMl) : null;
  const catheter = o.catheterId ?? null;
  const events: LabEvent[] = [...(caseData.events ?? [])];
  if (profile.indication === "STEMI") events.push("stemi");
  else if (profile.indication === "NSTEMI" || profile.indication === "UA") events.push("nste-acs");
  const tortuous = caseData.variants.some((v) => MP_FROM_CASE.tortuousVariants.includes(v));
  const chosenWhere = target ? `${vesselName(target.vessel)}${target.segment ? ` (${target.segment})` : ""}` : "";
  const where = found.match === "lesion" || found.match === "vessel" ? chosenWhere : vesselName(t.vessel);
  const choice =
    found.match === "lesion" || found.match === "vessel"
      ? `The study report chose the ${where} lesion for ad hoc PCI.`
      : found.match === "unplaced"
        ? `The study report chose the ${chosenWhere} lesion; this lab cannot place that vessel and treats the ${where} lesion instead.`
        : target
          ? `The study report named no lesion of this case; this lab treats the ${where} lesion.`
          : `No target was handed over from the study report; this lab treats the ${where} lesion.`;
  const starts: PciStartDef[] = STANDARD_PCI_STARTS.map((s) => (s.id === "guide-in-root" ? { ...s, title: catheter ? "Diagnostic catheter in the aortic root" : s.title } : { ...s }));
  const lesionId = lesionIdOf(t);
  // the id seeds the PCI lab's coronary tree: keyed on the lesion the report named, so a rebuild that treats
  // another lesion (an unplaced target) keeps the same tree
  const idKey = lesionIdOf(caseData.lesions[named.idx]);
  return {
    id: `adhoc-${idKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: `Ad hoc PCI: the ${where} lesion from the diagnostic study`,
    brief:
      `Synthetic case, continued from the diagnostic study on the same patient. ${profile.sex === "F" ? "Woman" : "Man"} of ${profile.ageY}. ` +
      choice +
      (catheter ? ` The diagnostic catheter (${catheterName(catheter)}) is still in the ascending aorta: exchange it for a guide (choose the guide in the root).` : " Choose and introduce the guide.") +
      " Bring the heparin to the PCI dose and check the ACT before a device leaves the guide.",
    epa: epaFor(t, profile),
    difficulty: caseData.difficulty,
    side,
    anatomy: { dominance: caseData.dominance, rootSize: caseData.rootSize, tortuosity: tortuous ? 1 : 0, variants: [...caseData.variants], ...(caseData.grafts?.length ? { grafts: caseData.grafts.map((g) => ({ ...g })) } : {}) },
    lesions,
    target: found.idx,
    ...(events.length ? { events: [...new Set(events)] } : {}),
    patient: { weightKg: profile.weightKg, eGfr: profile.renal.egfr, priorContrastMl: usedMl, accessRoute: caseData.accessRoute },
    setup: { guideDefault, guidesAcceptable, french: o.french === 7 ? 7 : 6, heparinised: o.heparinised ?? true, guideInRoot: true },
    starts,
    start: "guide-in-root",
    views: [...(core?.views ?? [])],
    points: [
      "Ad hoc PCI continues the diagnostic study: the same patient, sheath, heparin and contrast budget.",
      "The diagnostic catheter is exchanged for a guide over a 0.035 inch wire; this lab does not model the exchange, and the guide is chosen in the root.",
      "Top up the heparin to the PCI dose and check the ACT before a device leaves the guide.",
      "Treat the lesion the report chose; the debrief compares it with the case.",
    ],
    caseIdentity: { id: caseData.id, name: caseData.name, rootRotationDeg: caseData.rootRotationDeg, aortaTiltDeg: caseData.aortaTiltDeg },
    chosen: target ? { ...target } : null,
    targetCheck: {
      lesionId,
      match: found.match,
      culpritId: culprit !== null ? lesionIdOf(caseData.lesions[culprit]) : null,
      culpritVessel: culprit !== null ? caseData.lesions[culprit].vessel : null,
      culpritSegment: culprit !== null && profile.culprit ? profile.culprit.segment : null,
      isCulprit: culprit !== null ? culprit === found.idx : null,
    },
    contrast: { usedMl, budgetMl },
    catheterInRoot: catheter,
  };
}

/**
 * The anatomy case a case definition describes: the case's own identity (so the genome, the root and the
 * aorta are the diagnostic lab's) with the definition's lesions and anatomy. Building the coronary tree from it
 * gives the diagnostic lab's tree.
 */
export function caseAnatomyOf(def: CasePciScenarioDef, accessRoute: AnatomyCase["accessRoute"] = def.patient?.accessRoute ?? "radial-right"): AnatomyCase {
  const t = def.lesions[targetIndex(def)];
  const c: AnatomyCase = {
    id: def.caseIdentity.id,
    name: def.caseIdentity.name,
    difficulty: def.difficulty,
    accessRoute,
    rootSize: def.anatomy.rootSize,
    rootRotationDeg: def.caseIdentity.rootRotationDeg,
    aortaTiltDeg: def.caseIdentity.aortaTiltDeg,
    dominance: def.anatomy.dominance,
    variants: [...def.anatomy.variants],
    pathology: t.kind,
    lesions: def.lesions.map((l) => ({ ...l })),
    recommendedCatheters: [def.setup.guideDefault],
    acceptableCatheters: [def.setup.guideDefault, ...(def.setup.guidesAcceptable ?? [])],
    requiredViews: [...def.views],
    traps: [],
    objectives: [],
    teachingSummary: def.points.join(" "),
    scenarioId: def.id,
  };
  if (def.anatomy.grafts?.length) c.grafts = def.anatomy.grafts.map((g) => ({ ...g }));
  if (def.events?.length) c.events = [...def.events];
  return c;
}

/** The definition without the lesions whose vessel the PCI lab's tree lacks (the target is always kept). */
export function withPlaceableLesions(def: CasePciScenarioDef, hasVessel: (v: VesselId) => boolean): CasePciScenarioDef {
  const idx = targetIndex(def);
  const keep = def.lesions.map((l, i) => i === idx || hasVessel(l.vessel));
  if (keep.every(Boolean)) return def;
  const lesions = def.lesions.filter((_, i) => keep[i]);
  return { ...def, lesions, target: keep.slice(0, idx).filter(Boolean).length };
}

/**
 * The resolved scenario the PCI lab opens (what resolveScenario gives for a registry id): the definition,
 * the engine scenario (carrying the case identity), no hidden mechanism, and a seed from the case's id.
 */
export function resolvedFromCase(def: CasePciScenarioDef): ResolvedPciScenario {
  const idx = targetIndex(def);
  const registered: RegisteredPciScenario & CasePciScenarioDef = { ...def, lessonIds: [], caseIds: [], heldOut: false, pack: "fromCase" };
  const scenario: PciRuntimeScenario & { caseIdentity: CaseIdentity } = { ...toPciScenario(def, idx), caseIdentity: { ...def.caseIdentity } };
  return { def: registered, scenario, variant: null, seed: `${def.caseIdentity.id}:pci`, hidden: {}, targetIdx: idx, events: scenarioEvents(def, idx) };
}

/** Is the measured ACT at the PCI target (seconds, the low end of the target range)? */
export function actAtTarget(act: { value: number } | null | undefined, targetS: number): boolean {
  return !!act && Number.isFinite(act.value) && act.value >= targetS;
}

// --- what the PCI lab returns ------------------------------------------------------------------------

/** The engine's complication kinds and the tip events they raise (the PCI event sources' mapping). */
const COMPLICATION_EVENT: Record<string, LabEvent> = { dissection: "dissection", perforation: "perforation", "no-reflow": "no-reflow", thrombus: "thrombus", air: "air", "side-branch": "side-branch-compromise" };

/** The finish-phase flags a PCI returns to the case (hb-after-the-procedure#5): complications, dose, contrast, complex lesions. */
export const PCI_FINISH_FLAGS: readonly LabEvent[] = [
  "perforation",
  "dissection",
  "no-reflow",
  "acute-closure",
  "stent-loss",
  "equipment-entrapment",
  "thrombus",
  "air",
  "side-branch-compromise",
  "high-radiation-dose",
  "high-contrast-volume",
  "cto",
  "bifurcation",
];

/**
 * The final TIMI grade in the treated vessel from the engine state (MODEL PARAMETER rule, facts file): an
 * occluded lesion 0, a live no-reflow by the engine's own grade, slow flow 2, else 3.
 */
export function finalTimiOf(st: Pick<PciState, "severity" | "slowFlow" | "cx">): TimiFlow {
  if (st.severity >= 100) return 0;
  const live = st.cx.list.filter((c) => c.kind === "no-reflow" && (c.stage === "overt" || c.stage === "prodrome"));
  if (live.length) {
    // the engine's own grade for the worst live no-reflow (complications/noReflow.ts timiFor)
    const g = Number(/TIMI (\d)/.exec(timiFor(Math.max(...live.map((c) => c.severity))))?.[1] ?? 3);
    return Math.max(0, Math.min(3, g)) as TimiFlow;
  }
  if (st.slowFlow) return 2;
  return 3;
}

export interface PciReportInput {
  st: PciState;
  /** the treated target lesion's id (case lesion id) and its vessel */
  target: { lesionId: string; vessel: VesselId; segment: PciTarget["segment"] };
  contrastMl: number;
  dose: { fluoroS: number; karMGy: number; kapGyCm2: number };
  durationS: number;
  /** the lab's finish-phase tip events (its tip context at phase 'finish') */
  finishEvents: readonly LabEvent[];
  /** a label for a complication (the engine's own, complicationLabel) */
  labelOf?: (c: PciState["cx"]["list"][number]) => string;
  /**
   * every lesion of the case (the case's AnatomyCase lesions): each is reported in the residual, the target at the
   * lab's final severity and the others, which this lab does not treat, at their own. Absent: the target only.
   */
  lesions?: readonly Pick<Lesion, "vessel" | "position" | "severity">[];
}

/**
 * Was a vessel treated in the lab: a stent placed here (a restenosed stent came with the case), a balloon
 * inflated (predilatation, a completed inflation, post-dilatation). A wire alone is not.
 */
export function vesselTreated(st: Pick<PciState, "stents" | "predilated" | "inflation" | "ind" | "counters">): boolean {
  return st.stents.some((p) => !p.restenosed) || st.predilated || !!st.inflation?.predil || st.ind.count > 0 || st.counters.postdilatedInStent;
}

/** The residual of every case lesion: the target at the lab's final severity, the others at their own (case order). */
function residualOf(i: PciReportInput): LabReport["residual"] {
  const target = { vessel: i.target.vessel, lesionId: i.target.lesionId, pct: Math.round(i.st.severity) };
  if (!i.lesions?.length) return [target];
  const out = i.lesions.map((l) => {
    const id = lesionIdOf(l);
    return id === i.target.lesionId ? target : { vessel: l.vessel, lesionId: id, pct: Math.round(l.severity) };
  });
  return out.some((r) => r.lesionId === i.target.lesionId) ? out : [target, ...out];
}

/** What the PCI lab returns to the case (found-handover-contract LabReport). */
export function pciLabReport(i: PciReportInput): LabReport {
  const st = i.st;
  const des = DEVICE_BY_ID["des"]?.label;
  const covered = DEVICE_BY_ID["covered"]?.label;
  // the engine records post-dilatation for the lab, not per stent: with no post-dilatation every stent is reported
  // as not post-dilated; with one and a single stent, that stent; with several stents it is not known which (left out)
  const placed = st.stents.filter((p) => !p.restenosed);
  const postDilated: boolean | null = !st.counters.postdilatedInStent ? false : placed.length === 1 ? true : null;
  const stents: ReportedStent[] = placed
    .map((p) => ({
      vessel: p.vessel,
      segment: p.vessel === i.target.vessel ? i.target.segment : null,
      diameterMm: p.nominal,
      lengthMm: p.labelLengthMm,
      ...((p.covered ? covered : des) ? { platform: (p.covered ? covered : des)! } : {}),
      ...(postDilated !== null ? { postDilated } : {}),
    }));
  const complications: ReportedComplication[] = st.cx.list
    .filter((c) => c.tOvert !== null)
    .map((c) => {
      const resolved = c.stage === "treated" || c.stage === "resolved";
      const ev = COMPLICATION_EVENT[c.kind];
      return {
        id: c.id,
        label: i.labelOf ? i.labelOf(c) : `${c.kind.replace("-", " ")} (${c.grade})`,
        t: c.tOvert!,
        severity: resolved && MP_FROM_CASE.minorWhenTreated.includes(c.kind) ? "minor" : "major",
        ...(ev ? { events: [ev] } : {}),
        resolved,
      };
    });
  const events = [...new Set([...i.finishEvents.filter((e) => PCI_FINISH_FLAGS.includes(e)), ...complications.flatMap((c) => c.events ?? [])])];
  return {
    lab: "angio-pci",
    stents,
    // the contract: null when no vessel was treated
    finalTimi: vesselTreated(st) ? finalTimiOf(st) : null,
    complications,
    contrastMl: Math.max(0, i.contrastMl),
    dose: { fluoroS: Math.max(0, i.dose.fluoroS), karMGy: Math.max(0, i.dose.karMGy), kapGyCm2: Math.max(0, i.dose.kapGyCm2) },
    durationS: Math.max(0, i.durationS),
    residual: residualOf(i),
    ...(events.length ? { events } : {}),
  };
}

/** The debrief's line on the choice of target (case truth: shown once the case is over). */
export function targetCheckText(def: Pick<CasePciScenarioDef, "targetCheck" | "lesions" | "target"> & Partial<Pick<CasePciScenarioDef, "chosen">>): string {
  const c = def.targetCheck;
  const t = def.lesions[targetIndex(def)];
  const what = `the ${vesselName(t.vessel)} lesion`;
  const named = def.chosen ? `the ${vesselName(def.chosen.vessel)}${def.chosen.segment ? ` (${def.chosen.segment})` : ""} lesion` : "a lesion";
  const chose =
    c.match === "lesion"
      ? `The report chose ${what}`
      : c.match === "vessel"
        ? `The report named the ${vesselName(t.vessel)}; the lesion treated was its most severe`
        : c.match === "unplaced"
          ? `The report chose ${named}, which this lab could not place; the lesion treated was ${what}`
          : def.chosen
            ? `The report named no lesion of the case; the lesion treated was ${what}`
            : `No target was handed over; the lesion treated was ${what}`;
  if (c.isCulprit === null) return `${chose}. The case has no acute culprit lesion.`;
  const culprit = c.culpritVessel ? `the ${vesselName(c.culpritVessel)} lesion${c.culpritSegment ? ` (${c.culpritSegment})` : ""}` : "another lesion";
  return c.isCulprit ? `${chose}: the culprit lesion of this presentation.` : `${chose}: not the culprit of this presentation (the culprit was ${culprit}).`;
}
