// ---------------------------------------------------------------------------
// The learner's structured angiography report against the case ground truth:
// dominance, lesions by SYNTAX segment with a severity band, and TIMI flow.
// Severity bands follow the AngioCAD dataset's segment labels (NL, 1-25,
// 26-50, 51-75, 76-90, 91-99, 100), the categories real reports in the
// library use (datasets/library/angiocad/index.json).
// ---------------------------------------------------------------------------

import type { AnatomyCase, ChartConsentScope, Dominance, GraftStatus, Lesion, VesselId } from "../types";
import type { LabContext, LabEvent, TipVessel } from "../content/lab/tips";
import type { PciStrategy, PciTarget } from "../simulation/session/handover";
import type { AngioCadSegment } from "../simulation/patient/angiocadPriors";
import type { CheckGap } from "./debrief";
import { segmentName } from "./coverage";

export const SEVERITY_BANDS = ["NL", "1-25", "26-50", "51-75", "76-90", "91-99", "100"] as const;
export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export function bandOf(pct: number): SeverityBand {
  if (pct <= 0) return "NL";
  if (pct <= 25) return "1-25";
  if (pct <= 50) return "26-50";
  if (pct <= 75) return "51-75";
  if (pct <= 90) return "76-90";
  if (pct < 100) return "91-99";
  return "100";
}

export interface StructuredReport {
  dominance?: Dominance;
  lesions: { segment: string; band: SeverityBand }[];
  timi?: 0 | 1 | 2 | 3;
}

export interface TruthReport {
  dominance: Dominance;
  lesions: { segment: string; severityPct: number }[];
  timi?: 0 | 1 | 2 | 3;
}

export interface ReportItem {
  segment: string;
  name: string;
  learner: SeverityBand;
  truth: SeverityBand;
  correct: boolean;
  /** one band away */
  adjacent: boolean;
  /** signed band error (positive = over-called) */
  bias: number;
}

export interface ReportComparison {
  /** the finish step's study report against the case truth (diag-study-report), when the learner submitted one */
  study?: StudyComparison;
  dominanceCorrect: boolean | null;
  timiCorrect: boolean | null;
  items: ReportItem[];
  /** significant lesions (>= 51%) the learner did not report */
  missed: string[];
  /** lesions reported where the truth is normal */
  falsePositives: string[];
  /** mean signed band error over reported significant lesions */
  meanBias: number;
}

export function compareReport(learner: StructuredReport, truth: TruthReport): ReportComparison {
  const idx = (b: SeverityBand) => SEVERITY_BANDS.indexOf(b);
  const truthBy = new Map(truth.lesions.map((l) => [l.segment, bandOf(l.severityPct)]));
  const learnBy = new Map(learner.lesions.map((l) => [l.segment, l.band]));
  const segs = new Set([...truthBy.keys(), ...learnBy.keys()]);
  const items: ReportItem[] = [];
  for (const s of segs) {
    const t = truthBy.get(s) ?? "NL";
    const l = learnBy.get(s) ?? "NL";
    const bias = idx(l) - idx(t);
    items.push({ segment: s, name: segmentName(s), learner: l, truth: t, correct: bias === 0, adjacent: Math.abs(bias) === 1, bias });
  }
  const significant = (b: SeverityBand) => idx(b) >= idx("51-75");
  const missed = items.filter((i) => significant(i.truth) && !significant(i.learner)).map((i) => i.segment);
  const fp = items.filter((i) => i.truth === "NL" && i.learner !== "NL").map((i) => i.segment);
  const rep = items.filter((i) => significant(i.truth) || significant(i.learner));
  return {
    dominanceCorrect: learner.dominance ? learner.dominance === truth.dominance : null,
    timiCorrect: learner.timi !== undefined && truth.timi !== undefined ? learner.timi === truth.timi : null,
    items,
    missed,
    falsePositives: fp,
    meanBias: rep.length ? rep.reduce((a, i) => a + i.bias, 0) / rep.length : 0,
  };
}

// ===========================================================================
// The study report (diag-study-report)
//
// The finish step of the diagnostic study: the learner accounts for every
// left-ventricular wall (to the artery that supplies it and the injection that
// showed it, a graft, or 'none seen'), states the findings per vessel and
// graft, declares the runs that were non-diagnostic, grades the LV and valves
// when done, classifies a myocardial infarction when the patient presented
// with one, and decides between no PCI, ad hoc PCI, stopping for the heart
// team and a staged procedure. For ad hoc or staged PCI the learner names the
// target (vessel, segment, own QCA and length), which is written as the
// hand-over's PciTarget (src/simulation/session/handover.ts): this is the only
// step in the app where the PCI target is chosen.
//
// Nothing here is shown on a live screen. The lab builds StudyTruth from the
// case, the patient engine's coronary regions and the stored runs only when
// the learner submits; compareStudyReport sets it against the report, and the
// debrief check (src/mentor/debriefChecks/report.ts) and the debrief's report
// tab (src/ui/mentor/debrief/ReportSection.tsx) read the comparison.
//
// Sources (module text, cited where each rule is used):
//   every territory                         pm-interpreting-pitfalls (Oxford ch 6, Brilakis 5.7)
//   anomalous circumflex                    pm-interpreting-anomalies (Oxford ch 6, Brilakis 5.7)
//   spasm reported as fixed disease         pm-interpreting-spasm (Oxford)
//   non-diagnostic runs                     pm-acquiring-cine (Brilakis 6.5-6.7)
//   reasons to defer ad hoc PCI             pm-target-timing (Brilakis 7.3, after the SCAI consensus)
//   MI settings, non-obstructive under 50%  hb-background-mi (fifth universal definition)
// ===========================================================================


// --- vocabulary ------------------------------------------------------------------------------

/** The left-ventricular walls the report accounts for (lateral includes the posterolateral wall). */
export const LV_WALLS = ["anterior", "septal", "apical", "inferior", "lateral"] as const;
export type LvWall = (typeof LV_WALLS)[number];
export const LV_WALL_LABEL: Record<LvWall, string> = {
  anterior: "Anterior",
  septal: "Septal",
  apical: "Apical",
  inferior: "Inferior",
  lateral: "Lateral or posterolateral",
};

/** The three coronary arteries a wall is assigned to. */
export const ARTERIES = ["LAD", "LCx", "RCA"] as const;
export type Artery = (typeof ARTERIES)[number];
export type InjectionSide = "left" | "right";

/** What supplies a wall, as the learner reports it. */
export type WallSupply =
  | { kind: "native"; artery: Artery; injection: InjectionSide }
  | { kind: "graft"; graftId: string }
  | { kind: "none" };

export function wallSupplyLabel(s: WallSupply | undefined, graftLabel: (id: string) => string = (id) => id): string {
  if (!s) return "Not assigned";
  if (s.kind === "none") return "None seen";
  if (s.kind === "graft") return graftLabel(s.graftId);
  return `${s.artery} from the ${s.injection} injection`;
}

/** A finding row: a native artery (or the left main) or a graft of the operation note. */
export type FindingVessel = Artery | "LM" | `graft:${string}`;
export type Patency = "patent" | "occluded" | "not-seen";

export interface VesselFinding {
  vessel: FindingVessel;
  /** undefined until the learner states it */
  patency?: Patency;
  /** worst percent diameter stenosis, by eye or by the learner's own QCA; null when none is reported */
  worstPct: number | null;
  method: "visual" | "qca";
  /** SYNTAX segment of the worst stenosis (src/mentor/coverage.ts SEGMENT_NAMES) */
  segment: string | null;
  /** the stored run (series number) it shows best on */
  run: number | null;
  /** the narrowing resolved with intracoronary nitrate: spasm, not fixed disease */
  spasm: boolean;
}

export const STUDY_DECISIONS = ["no-pci", "adhoc", "heart-team", "staged"] as const;
export type StudyDecision = (typeof STUDY_DECISIONS)[number];
export const STUDY_DECISION_LABEL: Record<StudyDecision, string> = {
  "no-pci": "No PCI",
  adhoc: "Ad hoc PCI now",
  "heart-team": "Stop for the heart team",
  staged: "Staged PCI (stop and come back)",
};

/** The PCI strategy a decision hands over (null: no PCI target is written). */
export function strategyOf(d: StudyDecision | undefined): PciStrategy | null {
  return d === "adhoc" ? "adhoc" : d === "staged" ? "staged" : d === "heart-team" ? "defer" : null;
}

/** Brilakis's reasons to defer ad hoc PCI, as pm-target-timing lists them (Brilakis 7.3, after the SCAI consensus). */
export const DEFERRAL_REASONS = [
  { id: "anatomy", title: "Anatomy", detail: "Complex or high-risk disease: unprotected left main, chronic total occlusion, multivessel disease, bifurcations." },
  { id: "dose", title: "Dose", detail: "Too much contrast or radiation already used, or expected to be needed for the PCI." },
  { id: "place", title: "Place", detail: "No on-site surgery when patient or lesion risk is high, or not the equipment the lesion needs." },
  { id: "consent", title: "Consent", detail: "The anatomy carries a much higher PCI risk than was discussed before the study." },
  { id: "symptoms", title: "Symptoms and ischaemia", detail: "Uncertain symptoms in a stable patient; no evidence of ischaemia when FFR or IVUS is unavailable." },
  { id: "complication", title: "Complication", detail: "Anything that went wrong during the diagnostic study." },
  { id: "people", title: "People", detail: "Operator or patient fatigue; a scheduling clash." },
  { id: "preparation", title: "Preparation", detail: "No aspirin before the study, an inadequate trial of antianginal therapy, inadequate hydration." },
  { id: "choice", title: "Choice", detail: "The patient prefers to wait." },
] as const;
export type DeferralReason = (typeof DEFERRAL_REASONS)[number]["id"];
export const DEFERRAL_SOURCE = { lessonId: "pm-target-timing", book: "brilakis-pci", loc: "7.3" } as const;

/** The settings of the fifth universal definition of MI (hb-background-mi), and its non-obstructive working diagnosis. */
export const MI_CLASSES = ["primary", "secondary", "procedure-related", "injury-non-obstructive"] as const;
export type MiClass = (typeof MI_CLASSES)[number];
export const MI_CLASS_LABEL: Record<MiClass, string> = {
  primary: "Primary MI (acute coronary pathology)",
  secondary: "Secondary MI (supply-demand imbalance)",
  "procedure-related": "Procedure-related MI",
  "injury-non-obstructive": "Myocardial injury with non-obstructive coronary arteries (working diagnosis)",
};

export const LV_GRADES = ["not-assessed", "normal", "mild", "moderate", "severe"] as const;
export type LvGrade = (typeof LV_GRADES)[number];
export const VALVE_GRADES = ["not-assessed", "normal", "abnormal"] as const;
export type ValveGrade = (typeof VALVE_GRADES)[number];

/** The AngioCAD segments a PCI target may name (the same list as ANGIOCAD_SEGMENTS; report.test.ts checks). */
export const TARGET_SEGMENTS = ["LM", "Prox LAD", "Mid LAD", "Dist LAD", "D1", "D2", "Prox LCx", "Mid LCx", "Dist LCx", "OM", "Prox RCA", "Mid RCA", "Dist RCA", "PDA", "PLB"] as const satisfies readonly AngioCadSegment[];

/** The tree vessels a PCI target may name. */
export const TARGET_VESSELS = ["LM", "LAD", "D1", "D2", "LCx", "OM1", "OM2", "RAMUS", "RCA", "PDA", "PLV"] as const satisfies readonly VesselId[];

/** The PCI target as the learner states it. */
export interface TargetChoice {
  vessel: VesselId;
  segment: AngioCadSegment | null;
  /** the learner's own QCA, percent diameter stenosis */
  qcaPct: number | null;
  /** the learner's measured lesion length, mm */
  lengthMm: number | null;
}

/** The learner's study report. */
export interface StudyReport {
  dominance?: Dominance;
  territories: Partial<Record<LvWall, WallSupply>>;
  findings: VesselFinding[];
  /** stored runs (series numbers) the learner declares non-diagnostic */
  nonDiagnosticRuns: number[];
  lv: LvGrade;
  valves: ValveGrade;
  mi?: MiClass;
  decision?: StudyDecision;
  /** the reasons to defer the learner says apply */
  reasons: DeferralReason[];
  target: TargetChoice | null;
}

/** The finding rows a report starts with: the left main, the three arteries and each graft of the operation note, nothing stated. */
export function findingRows(grafts: readonly { id: string }[] = []): VesselFinding[] {
  const vessels: FindingVessel[] = ["LM", ...ARTERIES, ...grafts.map((g) => `graft:${g.id}` as const)];
  return vessels.map((vessel) => ({ vessel, worstPct: null, method: "visual", segment: null, run: null, spasm: false }));
}

/** A blank report (nothing pre-filled: every answer is the learner's). */
export function emptyStudyReport(grafts: readonly { id: string }[] = []): StudyReport {
  return { territories: {}, findings: findingRows(grafts), nonDiagnosticRuns: [], lv: "not-assessed", valves: "not-assessed", reasons: [], target: null };
}

/** Whether the report asks for an MI classification: the patient presented with an acute coronary syndrome (troponin positive). */
export function asksMiClass(events: readonly LabEvent[] | undefined): boolean {
  return !!events?.some((e) => e === "stemi" || e === "nste-acs");
}

/** What still has to be filled in before the report can be submitted (empty: ready). */
export function studyReportProblems(r: StudyReport, o: { miAsked: boolean }): string[] {
  const out: string[] = [];
  const open = LV_WALLS.filter((w) => !r.territories[w]);
  if (open.length) out.push(`Assign every wall: ${open.map((w) => LV_WALL_LABEL[w].toLowerCase()).join(", ")}`);
  if (!r.dominance) out.push("State the dominance");
  if (o.miAsked && !r.mi) out.push("Classify the myocardial infarction");
  if (!r.decision) out.push("Choose a decision");
  if ((r.decision === "adhoc" || r.decision === "staged") && !r.target) out.push("Name the PCI target");
  for (const f of r.findings) {
    if (f.worstPct !== null && (!Number.isFinite(f.worstPct) || f.worstPct < 0 || f.worstPct > 100)) out.push(`${findingLabel(f.vessel)}: stenosis must be 0 to 100%`);
  }
  const t = r.target;
  if (t) {
    if (t.qcaPct !== null && (!Number.isFinite(t.qcaPct) || t.qcaPct < 0 || t.qcaPct > 100)) out.push("Target QCA must be 0 to 100%");
    if (t.lengthMm !== null && (!Number.isFinite(t.lengthMm) || t.lengthMm <= 0)) out.push("Target length must be more than 0 mm");
  }
  return out;
}

export function findingLabel(v: FindingVessel, graftLabel: (id: string) => string = (id) => id): string {
  if (v === "LM") return "Left main";
  if (v.startsWith("graft:")) return graftLabel(v.slice(6));
  return v;
}

// --- the case truth ----------------------------------------------------------------------------

/**
 * Percent diameter stenosis from which a lesion counts as significant for the decision rules: the
 * '51-75' band and above, the same line compareReport draws for missed lesions. MODEL PARAMETER
 * (an app convention, not a guideline threshold).
 */
export const SIGNIFICANT_PCT = 51;

/**
 * Below this percent stenosis everywhere, an MI presentation is non-obstructive: the fifth universal
 * definition's 'no stenosis of 50% or more' (hb-background-mi).
 */
export const OBSTRUCTIVE_PCT = 50;

/** The artery a tree vessel belongs to, by name (null: the left main, the right ventricular branches handled by the caller, or unknown). */
export function arteryOfVessel(v: string): Artery | null {
  // the tree names septal perforators S1..S12 and diagonals D1..Dn
  if (v === "LAD" || /^D\d+$/.test(v) || /^S\d+$/.test(v) || /^SEPT/i.test(v)) return "LAD";
  if (v === "LCx" || v === "OM1" || v === "OM2" || v === "RAMUS" || /^OM/.test(v)) return "LCx";
  if (v === "RCA" || v === "AM" || v === "CONUS") return "RCA";
  return null;
}

/** One coronary region of the patient engine (FlowRegion in src/simulation/patient/coronaryFlow.ts), as the territory truth reads it. */
export interface TerritoryRegion {
  vessel: string;
  side: InjectionSide;
  demand: number;
  rv?: boolean;
  /** vessel param at the first sample of the region */
  p0?: number;
  /** the vessels from the ostium to the region */
  path?: readonly { vessel: string }[];
}

/** The artery a region's blood comes down: the nearest named artery on its path (a PDA from the circumflex is the circumflex's). */
export function regionArtery(r: TerritoryRegion): Artery | null {
  const own = arteryOfVessel(r.vessel);
  if (own) return own;
  const path = r.path ?? [];
  for (let i = path.length - 1; i >= 0; i--) {
    const a = arteryOfVessel(path[i].vessel);
    if (a) return a;
  }
  return null;
}

/** LAD regions from this param on are apical. MODEL PARAMETER (the distal third of the default network's LAD). */
export const APICAL_LAD_P0 = 0.66;

/**
 * The walls a region supplies (empty for right-ventricular regions). MODEL PARAMETER mapping: the LAD
 * and its proximal two thirds supply the anterior wall and septum, its distal third the apex, the
 * diagonals the anterior wall, septal branches the septum; the circumflex, marginals, ramus and the
 * posterolateral branches the lateral wall; the distal RCA and the PDA the inferior wall (the PDA the
 * inferior septum too); the conus, acute marginal, right-ventricular, sinus-node and AV-node branches
 * no LV wall. The tree names septal perforators S1..S12, diagonals D1..Dn, posterolateral branches PLV,
 * PL2, PL3, and the terminal twigs of a vessel '<vessel>-twigN' (a twig takes its vessel's wall; LAD
 * twigs the anterior wall, since a twig's own param says nothing about its place on the LAD).
 */
export function wallsOfRegion(r: TerritoryRegion): LvWall[] {
  if (r.rv) return [];
  const v = r.vessel;
  const base = v.replace(/-twig\d+.*$/, "");
  const twig = base !== v;
  if (/^SEPT/i.test(base) || /^S\d+$/.test(base)) return ["septal"];
  if (base === "LAD") return twig ? ["anterior"] : (r.p0 ?? 0) >= APICAL_LAD_P0 ? ["apical"] : ["anterior", "septal"];
  if (/^D\d+$/.test(base)) return ["anterior"];
  if (base === "PDA") return ["inferior", "septal"];
  if (/^PL(V|B|\d*)$/.test(base)) return ["lateral"];
  if (base === "RCA") return ["inferior"];
  if (base === "AM" || base === "CONUS" || base === "SAN" || base === "AVN" || /^RV\d*$/.test(base)) return [];
  const a = regionArtery(r);
  if (a === "LCx") return ["lateral"];
  if (a === "LAD") return ["anterior"];
  if (a === "RCA") return ["inferior"];
  return [];
}

/** What supplies a wall in the case: the artery and injection carrying most of its demand, and the grafts landing on that artery. */
export interface WallTruth {
  artery: Artery;
  injection: InjectionSide;
  /** grafts (ids) that are not occluded and land on this artery */
  graftIds: string[];
  /**
   * other answers that account for the wall: when its artery is chronically occluded, the arteries
   * that fill it through collaterals, from their own injection
   */
  via?: { artery: Artery; injection: InjectionSide }[];
}

export interface TruthLesion {
  vessel: VesselId;
  position: number;
  severityPct: number;
  /** SYNTAX segment at the lesion */
  segment: string;
  /** a narrowing that relieves with nitrate (spasm) */
  spasm: boolean;
  cto: boolean;
  /** the arteries whose collaterals fill the vessel beyond a chronic occlusion */
  collateralDonors?: Artery[];
}

export interface TruthGraft {
  id: string;
  label: string;
  target: VesselId;
  status: GraftStatus;
}

export interface StudyTruth {
  dominance: Dominance;
  territories: Partial<Record<LvWall, WallTruth>>;
  lesions: TruthLesion[];
  grafts: TruthGraft[];
  /** the case has an anomalous coronary origin */
  anomalous: boolean;
  /** the patient presented with an acute coronary syndrome */
  acs: boolean;
  consent?: ChartConsentScope;
  /** the stored runs of the case and whether contrast was given during each */
  runs: { number: number; injected: boolean }[];
  /**
   * The sides from which a filmed injection filled the coronaries (left, right), when the lab knows them:
   * a wall credited to a side not here was credited to an injection that was not made. Undefined: not
   * known, and the check is not made.
   */
  injectionsMade?: InjectionSide[];
  /** a complication happened during the study (dissection, air, VF) */
  complication: boolean;
}

const ANOMALOUS_VARIANTS = ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca", "anomalous-rca-left-sinus", "anomalous-lm-right-sinus"];

/** Whether a case has an anomalous coronary origin. */
export function hasAnomalousOrigin(c: Pick<AnatomyCase, "variants">): boolean {
  return c.variants.some((v) => ANOMALOUS_VARIANTS.includes(v));
}

/** Whether a case has a chronic total occlusion. */
export function hasCto(c: Pick<AnatomyCase, "lesions">): boolean {
  return c.lesions.some((l) => l.morphology === "cto" || !!l.cto);
}

const CONDUIT_LABEL = { svg: "Vein graft", radial: "Radial graft", lima: "LIMA", rima: "RIMA" } as const;

/** A graft's id within the case (its own, else its index). */
export function graftIdOf(g: { id?: string }, i: number): string {
  return g.id ?? `graft-${i + 1}`;
}

/** A graft as the report names it: conduit and target (history from the operation note, not a finding). */
export function graftLabelOf(g: Pick<NonNullable<AnatomyCase["grafts"]>[number], "conduit" | "target">): string {
  return `${CONDUIT_LABEL[g.conduit]} to ${g.target}`;
}

/** The case's grafts as the report lists them (id and label only: no status). */
export function reportGrafts(c: Pick<AnatomyCase, "grafts">): { id: string; label: string }[] {
  return (c.grafts ?? []).map((g, i) => ({ id: graftIdOf(g, i), label: graftLabelOf(g) }));
}

/** The walls' truth from the engine's coronary regions and the grafts. */
export function territoryTruth(regions: readonly TerritoryRegion[], grafts: readonly TruthGraft[] = []): Partial<Record<LvWall, WallTruth>> {
  const acc = new Map<LvWall, Map<string, number>>();
  for (const r of regions) {
    const a = regionArtery(r);
    if (!a || !(r.demand > 0)) continue;
    for (const w of wallsOfRegion(r)) {
      const m = acc.get(w) ?? new Map<string, number>();
      const k = `${a}|${r.side}`;
      m.set(k, (m.get(k) ?? 0) + r.demand);
      acc.set(w, m);
    }
  }
  const out: Partial<Record<LvWall, WallTruth>> = {};
  for (const w of LV_WALLS) {
    const m = acc.get(w);
    if (!m?.size) continue;
    const [best] = [...m.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
    const [artery, injection] = best[0].split("|") as [Artery, InjectionSide];
    const graftIds = grafts.filter((g) => g.status !== "occluded" && arteryOfVessel(g.target === "PDA" || g.target === "PLV" ? "RCA" : g.target) === artery).map((g) => g.id);
    out[w] = { artery, injection, graftIds };
  }
  return out;
}

/** The study's truth, built when the report is submitted. */
export function studyTruth(i: {
  caseData: Pick<AnatomyCase, "dominance" | "variants" | "lesions" | "grafts" | "events" | "chart">;
  regions: readonly TerritoryRegion[];
  /** SYNTAX segment at a point of a vessel (segmentLabelAt on the session's tree) */
  segmentOf: (vessel: VesselId, position: number) => string | undefined;
  runs?: readonly { number: number; injected: boolean }[];
  /** the sides of the filmed injections that filled the coronaries (the store's filmedInjectionSides) */
  injectionsMade?: readonly InjectionSide[];
  complication?: boolean;
}): StudyTruth {
  const c = i.caseData;
  const grafts: TruthGraft[] = (c.grafts ?? []).map((g, k) => ({ id: graftIdOf(g, k), label: graftLabelOf(g), target: g.target, status: g.status }));
  const lesions: TruthLesion[] = c.lesions.map((l) => ({
    vessel: l.vessel,
    position: l.position,
    severityPct: l.severity,
    segment: i.segmentOf(l.vessel, l.position) ?? fallbackSegment(l),
    spasm: l.morphology === "spasm" || !!l.nitrateResponsive,
    cto: l.morphology === "cto" || !!l.cto,
    collateralDonors: [...new Set((l.cto?.collaterals ?? []).map((x) => arteryOfVessel(x.donor)).filter((a): a is Artery => !!a))],
  }));
  const territories = territoryTruth(i.regions, grafts);
  // a wall beyond a chronic occlusion is accounted for by the collaterals that fill it, from the donor's injection
  for (const w of LV_WALLS) {
    const wt = territories[w];
    if (!wt) continue;
    const donors = lesions.filter((l) => l.cto && lesionArteries(l, c.dominance).includes(wt.artery)).flatMap((l) => l.collateralDonors ?? []);
    const via = [...new Set(donors)].filter((a) => a !== wt.artery).map((a) => ({ artery: a, injection: (a === "RCA" ? "right" : "left") as InjectionSide }));
    if (via.length) wt.via = via;
  }
  return {
    dominance: c.dominance,
    territories,
    lesions,
    grafts,
    anomalous: hasAnomalousOrigin(c),
    acs: asksMiClass(c.events),
    consent: c.chart?.consentScope,
    runs: [...(i.runs ?? [])],
    // a side counts only when a stored cine run recorded contrast (no stored contrast run: no side was shown)
    injectionsMade: i.injectionsMade === undefined ? undefined : (i.runs ?? []).some((x) => x.injected) ? [...new Set(i.injectionsMade)] : [],
    complication: !!i.complication,
  };
}

/** A SYNTAX segment for a lesion when the tree gives none (the proximal segment of its vessel). */
function fallbackSegment(l: Pick<Lesion, "vessel">): string {
  const by: Partial<Record<VesselId, string>> = { LM: "5", LAD: "6", D1: "9", D2: "10", LCx: "11", RAMUS: "12", OM1: "12a", OM2: "12b", RCA: "1", PDA: "4", PLV: "16" };
  return by[l.vessel] ?? l.vessel;
}

// --- comparison --------------------------------------------------------------------------------

export type TerritoryProblem = "unassigned" | "none-seen" | "wrong-injection" | "wrong-artery" | "graft-not-supplying" | "injection-not-made";

export interface TerritoryItem {
  wall: LvWall;
  learner?: WallSupply;
  /** null when the model gives the wall no supply to compare with */
  truth: WallTruth | null;
  correct: boolean;
  problem?: TerritoryProblem;
}

export interface StudyComparison {
  /** wall seconds when the report was submitted */
  tWall: number;
  territories: TerritoryItem[];
  graftPatency: { graftId: string; label: string; learner?: Patency; truth: GraftStatus; correct: boolean }[];
  /** narrowings that were spasm (relieved by nitrate) reported as fixed disease */
  spasmAsFixed: { vessel: FindingVessel; segment: string | null; pct: number }[];
  /** runs cited for a finding although no contrast was given during them */
  runsCitedWithoutContrast: number[];
  /** runs cited for a finding although the learner declared them non-diagnostic */
  runsCitedNonDiagnostic: number[];
  nonDiagnosticRuns: number[];
  lv: LvGrade;
  valves: ValveGrade;
  mi: { learner?: MiClass; truth: MiClass; correct: boolean } | null;
  decision: StudyDecision | null;
  stable: boolean;
  /** the reasons to defer that the case carries (as far as the lab knows them) */
  deferralApplies: DeferralReason[];
  /** the reasons the learner gave */
  deferralGiven: DeferralReason[];
  /** what in the anatomy makes it complex, for the deferral gap */
  anatomy: { unprotectedLm: boolean; cto: boolean; multivessel: boolean };
  /** ad hoc PCI in stable disease although a reason to defer applies */
  adhocAgainstReasons: boolean;
  /** ad hoc PCI of a chronic total occlusion */
  adhocCto: boolean;
  target: { target: PciTarget; matched: boolean; truthPct: number | null } | null;
  anomalous: boolean;
}

/** The structured (segment and band) part of a study report, for compareReport. Spasm rows are not fixed disease. */
export function structuredOf(r: StudyReport): StructuredReport {
  const lesions: StructuredReport["lesions"] = [];
  for (const f of r.findings) {
    if (f.spasm || !f.segment) continue;
    const pct = f.patency === "occluded" ? 100 : f.worstPct;
    if (pct === null || pct <= 0) continue;
    const band = bandOf(pct);
    const i = lesions.findIndex((l) => l.segment === f.segment);
    if (i < 0) lesions.push({ segment: f.segment, band });
    else if (SEVERITY_BANDS.indexOf(band) > SEVERITY_BANDS.indexOf(lesions[i].band)) lesions[i] = { segment: f.segment, band };
  }
  return { dominance: r.dominance, lesions };
}

/**
 * The finding row a case lesion belongs to: the left main; the LAD with its diagonals and septals; the
 * circumflex with its marginals and ramus (and the PDA and posterolateral branch when the circumflex is
 * dominant); the RCA with its branches. Null for a vessel the report has no row for.
 */
export function findingRowOf(l: Pick<TruthLesion, "vessel">, dominance: StudyTruth["dominance"]): "LM" | Artery | null {
  if (l.vessel === "LM") return "LM";
  return lesionArteries(l, dominance)[0] ?? null;
}

/**
 * The truth's fixed lesions (spasm is not), for compareReport, as the report's rows can state them: the
 * report gives one worst stenosis per row, so each row keeps its worst fixed lesion. When the learner
 * gives a row's worst at a segment where the case has another, lesser fixed lesion, that lesion is kept
 * too, so that the reported segment is compared with what is there rather than called normal.
 */
export function truthReportOf(t: StudyTruth, learner?: Pick<StudyReport, "findings">): TruthReport {
  const byRow = new Map<string, TruthLesion[]>();
  for (const l of fixed(t)) {
    const row = findingRowOf(l, t.dominance) ?? `vessel:${l.vessel}`;
    byRow.set(row, [...(byRow.get(row) ?? []), l]);
  }
  const keep = new Set<TruthLesion>();
  for (const [row, ls] of byRow) {
    keep.add([...ls].sort((a, b) => b.severityPct - a.severityPct || a.position - b.position)[0]);
    const f = learner?.findings.find((x) => x.vessel === row);
    if (f?.segment && !f.spasm) {
      const there = ls.filter((l) => l.segment === f.segment).sort((a, b) => b.severityPct - a.severityPct)[0];
      if (there) keep.add(there);
    }
  }
  return { dominance: t.dominance, lesions: fixed(t).filter((l) => keep.has(l)).map((l) => ({ segment: l.segment, severityPct: l.severityPct })) };
}

function wallItem(wall: LvWall, learner: WallSupply | undefined, truth: WallTruth | null, made?: readonly InjectionSide[]): TerritoryItem {
  if (!truth) return { wall, learner, truth, correct: true };
  if (!learner) return { wall, learner, truth, correct: false, problem: "unassigned" };
  if (learner.kind === "none") return { wall, learner, truth, correct: false, problem: "none-seen" };
  // a wall is accounted for by a vessel seen to fill: the injection the learner cites must have been made and filmed
  if (learner.kind === "native" && made && !made.includes(learner.injection)) return { wall, learner, truth, correct: false, problem: "injection-not-made" };
  if (learner.kind === "graft") return truth.graftIds.includes(learner.graftId) ? { wall, learner, truth, correct: true } : { wall, learner, truth, correct: false, problem: "graft-not-supplying" };
  if (truth.via?.some((v) => v.artery === learner.artery && v.injection === learner.injection)) return { wall, learner, truth, correct: true };
  if (learner.artery !== truth.artery) return { wall, learner, truth, correct: false, problem: "wrong-artery" };
  if (learner.injection !== truth.injection) return { wall, learner, truth, correct: false, problem: "wrong-injection" };
  return { wall, learner, truth, correct: true };
}

const fixed = (t: StudyTruth) => t.lesions.filter((l) => !l.spasm);

/** The artery of a truth lesion's vessel (the left main counts for both left arteries; PDA and PLV for the artery they arise from). */
function lesionArteries(l: Pick<TruthLesion, "vessel">, dominance: StudyTruth["dominance"]): Artery[] {
  if (l.vessel === "LM") return ["LAD", "LCx"];
  if (l.vessel === "PDA" || l.vessel === "PLV") return [dominance === "left" ? "LCx" : "RCA"];
  const a = arteryOfVessel(l.vessel);
  return a ? [a] : [];
}

/** What in the anatomy is complex (Brilakis's 'Anatomy' reason): unprotected left main, CTO, multivessel disease. */
export function complexAnatomy(t: StudyTruth): StudyComparison["anatomy"] {
  const sig = fixed(t).filter((l) => l.severityPct >= SIGNIFICANT_PCT);
  const lm = sig.some((l) => l.vessel === "LM");
  // protected: a graft that is not occluded lands on the LAD or the circumflex
  const protectedLm = t.grafts.some((g) => g.status !== "occluded" && (arteryOfVessel(g.target) === "LAD" || arteryOfVessel(g.target) === "LCx"));
  // multivessel disease counts the arteries with significant disease beyond the left main; left main
  // disease is judged on its own (unprotectedLm), so an isolated left main lesion is not multivessel
  const arteries = new Set<Artery>();
  for (const l of sig) if (l.vessel !== "LM") for (const a of lesionArteries(l, t.dominance)) arteries.add(a);
  return { unprotectedLm: lm && !protectedLm, cto: t.lesions.some((l) => l.cto), multivessel: arteries.size >= 2 };
}

/**
 * The reasons to defer that the case carries, as far as the lab knows: anatomy, consent and a complication.
 * Consent applies when the patient consented to the diagnostic study only, and also (a MODEL rule, see
 * docs/realism/facts/pkg-diag-study-report.md) when the patient consented to ad hoc PCI but the anatomy is
 * complex (unprotected left main, a chronic total occlusion or multivessel disease): the lab takes a consent
 * to ad hoc PCI as a discussion of a simple PCI, so complex anatomy is Brilakis's 'the anatomy carries a much
 * higher PCI risk than was discussed' (pm-planning-consent; DEFERRAL_REASONS 'consent').
 */
export function deferralReasonsFor(t: StudyTruth): DeferralReason[] {
  const out: DeferralReason[] = [];
  const a = complexAnatomy(t);
  const complex = a.unprotectedLm || a.cto || a.multivessel;
  if (complex) out.push("anatomy");
  if (t.consent === "diagnostic-only" || (t.consent === "diagnostic-and-ad-hoc-pci" && complex)) out.push("consent");
  if (t.complication) out.push("complication");
  return out;
}

/** The MI setting the case supports, for an ACS presentation: obstructive disease or an acute coronary pathology is primary; else non-obstructive. */
export function miTruth(t: StudyTruth): MiClass | null {
  if (!t.acs) return null;
  const acute = t.lesions.some((l) => l.spasm);
  const obstructive = fixed(t).some((l) => l.severityPct >= OBSTRUCTIVE_PCT);
  return obstructive || acute ? "primary" : "injury-non-obstructive";
}

/** The same rule as lesionIdOf in src/simulation/session/handover.ts (report.test.ts checks), kept here so the mentor does not load the engine. */
export function targetLesionId(l: Pick<Lesion, "vessel" | "position">): string {
  return `${l.vessel}@${l.position.toFixed(3)}`;
}

const TARGET_SEG_ARTERY: Record<AngioCadSegment, Artery | "LM"> = {
  LM: "LM",
  "Prox LAD": "LAD",
  "Mid LAD": "LAD",
  "Dist LAD": "LAD",
  D1: "LAD",
  D2: "LAD",
  "Prox LCx": "LCx",
  "Mid LCx": "LCx",
  "Dist LCx": "LCx",
  OM: "LCx",
  "Prox RCA": "RCA",
  "Mid RCA": "RCA",
  "Dist RCA": "RCA",
  PDA: "RCA",
  PLB: "RCA",
};

/** SYNTAX segments of an AngioCAD target segment (the same correspondence as segmentMap in src/simulation/patient/patient.ts). */
const TARGET_SEG_SYNTAX: Record<AngioCadSegment, string[]> = {
  LM: ["5"],
  "Prox LAD": ["6"],
  "Mid LAD": ["7"],
  "Dist LAD": ["8"],
  D1: ["9", "9a"],
  D2: ["10", "10a"],
  "Prox LCx": ["11"],
  "Mid LCx": ["13"],
  "Dist LCx": ["13"],
  OM: ["12a", "12b"],
  "Prox RCA": ["1"],
  "Mid RCA": ["2"],
  "Dist RCA": ["3"],
  PDA: ["4", "15"],
  PLB: ["16", "16a", "16b", "16c", "14", "14a", "14b"],
};

/** The AngioCAD segments that fit a target vessel. */
export function targetSegmentsFor(v: VesselId): AngioCadSegment[] {
  const a: Artery | "LM" | null = v === "LM" ? "LM" : v === "PDA" || v === "PLV" ? "RCA" : arteryOfVessel(v);
  if (v === "D1") return ["D1"];
  if (v === "D2") return ["D2"];
  if (v === "OM1" || v === "OM2") return ["OM"];
  if (v === "PDA") return ["PDA"];
  if (v === "PLV") return ["PLB"];
  return TARGET_SEGMENTS.filter((s) => TARGET_SEG_ARTERY[s] === a && !["D1", "D2", "OM", "PDA", "PLB"].includes(s));
}

/**
 * The case lesion a target refers to: a lesion on the target's own vessel, in the target's segment when
 * one is named (the most severe there), else the most severe on the vessel. Null when the vessel has no
 * lesion there: a target in the wrong segment, or on a branch whose parent carries the lesion, refers to
 * no case lesion (the hand-over then names `${vessel}@none`).
 */
export function matchTargetLesion(target: TargetChoice, t: StudyTruth): TruthLesion | null {
  const on = t.lesions.filter((l) => l.vessel === target.vessel);
  const segs = target.segment ? TARGET_SEG_SYNTAX[target.segment] : null;
  const pool = segs ? on.filter((l) => segs.includes(l.segment)) : on;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => b.severityPct - a.severityPct || a.position - b.position)[0];
}

/** The hand-over's PciTarget for a report (null without a target or for 'no PCI'). */
export function pciTargetFor(r: StudyReport, t: StudyTruth): PciTarget | null {
  const strategy = strategyOf(r.decision);
  if (!strategy || !r.target) return null;
  const tg = r.target;
  const l = matchTargetLesion(tg, t);
  return {
    vessel: tg.vessel,
    segment: tg.segment,
    qcaPct: tg.qcaPct,
    lengthMm: tg.lengthMm,
    lesionId: l ? targetLesionId(l) : `${tg.vessel}@none`,
    strategy,
  };
}

const VESSEL_SET = new Set<string>(["LM", "LAD", "LCx", "RCA", "D1", "D2", "OM1", "OM2", "RAMUS", "SEPTAL", "PDA", "PLV", "CONUS", "AM"] satisfies VesselId[]);
const STRATEGY_SET = new Set<string>(["adhoc", "defer", "staged"] satisfies PciStrategy[]);

/** Why a PciTarget would not be accepted by the hand-over contract (null: it is). */
export function pciTargetProblem(p: PciTarget): string | null {
  if (!VESSEL_SET.has(p.vessel)) return `unknown vessel ${p.vessel}`;
  if (p.segment !== null && !(TARGET_SEGMENTS as readonly string[]).includes(p.segment)) return `unknown segment ${p.segment}`;
  if (p.qcaPct !== null && !(Number.isFinite(p.qcaPct) && p.qcaPct >= 0 && p.qcaPct <= 100)) return "QCA must be 0 to 100%";
  if (p.lengthMm !== null && !(Number.isFinite(p.lengthMm) && p.lengthMm > 0)) return "length must be more than 0 mm";
  if (!/^[A-Za-z0-9]+@(\d+\.\d{3}|none)$/.test(p.lesionId)) return `lesion id ${p.lesionId} is not vessel@position`;
  if (!STRATEGY_SET.has(p.strategy)) return `unknown strategy ${p.strategy}`;
  return null;
}

/** Compare a submitted study report with the case truth (the debrief's report, with the study part). */
export function compareStudyReport(r: StudyReport, t: StudyTruth, tWall = 0): ReportComparison {
  const base = compareReport(structuredOf(r), truthReportOf(t, r));
  const territories = LV_WALLS.map((w) => wallItem(w, r.territories[w], t.territories[w] ?? null, t.injectionsMade));
  const graftPatency = t.grafts.map((g) => {
    const f = r.findings.find((x) => x.vessel === `graft:${g.id}`);
    const learner = f?.patency;
    const correct = learner === undefined ? false : g.status === "occluded" ? learner === "occluded" : learner === "patent";
    return { graftId: g.id, label: g.label, learner, truth: g.status, correct };
  });
  const spasmAsFixed: StudyComparison["spasmAsFixed"] = [];
  for (const f of r.findings) {
    if (f.spasm || f.worstPct === null || f.worstPct < SIGNIFICANT_PCT || f.vessel.startsWith("graft:")) continue;
    const arts: Artery[] = f.vessel === "LM" ? ["LAD", "LCx"] : [f.vessel as Artery];
    const spasm = t.lesions.filter((l) => l.spasm && lesionArteries(l, t.dominance).some((a) => arts.includes(a)));
    const fixedThere = fixed(t).some((l) => l.severityPct >= SIGNIFICANT_PCT && lesionArteries(l, t.dominance).some((a) => arts.includes(a)));
    if (spasm.length && !fixedThere) spasmAsFixed.push({ vessel: f.vessel, segment: f.segment, pct: f.worstPct });
  }
  const injected = new Map(t.runs.map((x) => [x.number, x.injected]));
  const cited = [...new Set(r.findings.map((f) => f.run).filter((n): n is number => n !== null))];
  const runsCitedWithoutContrast = cited.filter((n) => injected.get(n) === false).sort((a, b) => a - b);
  const runsCitedNonDiagnostic = cited.filter((n) => r.nonDiagnosticRuns.includes(n)).sort((a, b) => a - b);
  const mt = miTruth(t);
  const anatomy = complexAnatomy(t);
  const applies = deferralReasonsFor(t);
  const stable = !t.acs;
  const decision = r.decision ?? null;
  const pciTarget = pciTargetFor(r, t);
  const matched = r.target ? matchTargetLesion(r.target, t) : null;
  const study: StudyComparison = {
    tWall,
    territories,
    graftPatency,
    spasmAsFixed,
    runsCitedWithoutContrast,
    runsCitedNonDiagnostic,
    nonDiagnosticRuns: [...r.nonDiagnosticRuns].sort((a, b) => a - b),
    lv: r.lv,
    valves: r.valves,
    mi: mt ? { learner: r.mi, truth: mt, correct: r.mi === mt } : null,
    decision,
    stable,
    deferralApplies: applies,
    deferralGiven: [...r.reasons],
    anatomy,
    adhocAgainstReasons: decision === "adhoc" && stable && applies.length > 0,
    adhocCto: decision === "adhoc" && !!matched?.cto,
    target: pciTarget ? { target: pciTarget, matched: !!matched, truthPct: matched ? matched.severityPct : null } : null,
    anomalous: t.anomalous,
  };
  return { ...base, study };
}

// --- tips at the finish step ---------------------------------------------------------------------

/** The artery a wall is usually supplied by, for the tips' vessel when the wall is reported empty (the lateral wall: the circumflex). */
const WALL_VESSEL: Record<LvWall, TipVessel> = { anterior: "LAD", septal: "LAD", apical: "LAD", inferior: "RCA", lateral: "LCx" };

/** The walls the learner reports with no supplying vessel. */
export function unsuppliedWalls(r: Pick<StudyReport, "territories">): LvWall[] {
  return LV_WALLS.filter((w) => r.territories[w]?.kind === "none");
}

/** The events of the finish step that the report and the case raise, as the tipIntegration of diag-study-report describes them. */
export const FINISH_EVENTS = ["territory-unsupplied", "anomalous-origin", "cto"] as const satisfies readonly LabEvent[];

/**
 * Events the open report raises: a wall without a supplying vessel raises 'territory-unsupplied' (and
 * 'anomalous-origin' when the case has an anomalous origin); a case with a chronic total occlusion
 * raises 'cto' at the finish step.
 */
export function finishEvents(r: Pick<StudyReport, "territories">, c: Pick<AnatomyCase, "variants" | "lesions">): LabEvent[] {
  const out: LabEvent[] = [];
  if (unsuppliedWalls(r).length) {
    out.push("territory-unsupplied");
    if (hasAnomalousOrigin(c)) out.push("anomalous-origin");
  }
  if (hasCto(c)) out.push("cto");
  return out;
}

/**
 * The tip contexts while the report is open: the lab's own, and for each wall reported empty the same
 * context about the artery that usually supplies it (so 'search for the missing circumflex' reads the
 * circumflex).
 */
export function finishContexts(ctx: LabContext, r: Pick<StudyReport, "territories"> | null): LabContext[] {
  if (!r) return [ctx];
  const vessels = [...new Set(unsuppliedWalls(r).map((w) => WALL_VESSEL[w]))];
  return [ctx, ...vessels.filter((v) => v !== ctx.vessel).map((v) => ({ ...ctx, vessel: v }))];
}

// --- the debrief's gaps --------------------------------------------------------------------------

const PROBLEM_TEXT: Record<TerritoryProblem, string> = {
  unassigned: "was not assigned",
  "none-seen": "was reported with no supplying vessel",
  "wrong-injection": "was assigned to the wrong injection",
  "wrong-artery": "was assigned to the wrong artery",
  "graft-not-supplying": "was assigned to a graft that does not supply it",
  "injection-not-made": "was credited to an injection that was not made",
};

/** The gaps a study comparison gives the debrief (the check in src/mentor/debriefChecks/report.ts returns them). */
export function studyReportGaps(cmp: ReportComparison | undefined): CheckGap[] {
  const s = cmp?.study;
  if (!s) return [];
  const t = s.tWall;
  const gaps: CheckGap[] = [];
  const wrong = s.territories.filter((x) => !x.correct);
  if (wrong.length) {
    const list = wrong.map((x) => `the ${LV_WALL_LABEL[x.wall].toLowerCase()} wall ${PROBLEM_TEXT[x.problem ?? "unassigned"]}`).join("; ");
    const anomalousLateral = s.anomalous && wrong.some((x) => x.wall === "lateral");
    gaps.push({
      id: "report-territory",
      title: "Missed territory",
      severity: "safety",
      tWall: t,
      occurrences: wrong.length,
      strategy: "advocacy-inquiry",
      advocacy: `In your report ${list}.`,
      inquiry: "Which injection showed each wall filling?",
      teaching: anomalousLateral
        ? "When the left injection shows no vessel to the lateral wall, look for faint filling of a vessel from the proximal RCA on the right injection: an anomalous circumflex from the proximal RCA or the right sinus, running behind the aorta (Oxford ch 6; Brilakis 5.7)."
        : "Before finishing, check that the anterior wall and septum, the lateral wall and the inferior wall each have a vessel you have seen fill. An empty territory means an anomalous vessel, a flush ostial occlusion or an artery not yet injected (Oxford ch 6; Brilakis 5.7).",
      // the anomalous circumflex is the anomalies lesson's; putting the territories together is the pitfalls lesson's
      lessonId: anomalousLateral ? "pm-interpreting-anomalies" : "pm-interpreting-pitfalls",
      takeHome: "Next time I will account for every wall to the injection that showed it before I finish.",
    });
  }
  const graftsWrong = s.graftPatency.filter((g) => !g.correct);
  if (graftsWrong.length) {
    gaps.push({
      id: "report-graft-patency",
      title: "Graft not accounted for",
      severity: "technique",
      tWall: t,
      occurrences: graftsWrong.length,
      teaching: `Every graft in the operation note is engaged or shown occluded (a stump or the aortogram) before the study ends: ${graftsWrong.map((g) => g.label).join(", ")}.`,
      lessonId: "cp-prior-cabg-svg-find",
      takeHome: "Next time I will tick off every graft in the operation note before I finish.",
    });
  }
  if (s.spasmAsFixed.length) {
    gaps.push({
      id: "report-spasm-as-fixed",
      title: "Spasm reported as fixed disease",
      severity: "safety",
      tWall: t,
      occurrences: s.spasmAsFixed.length,
      teaching: "Spasm can look exactly like a severe stenosis (Oxford). A narrowing that is spasm and is reported as disease leads to an unnecessary stent: give intracoronary nitrate, wait and repeat the same run before calling it fixed.",
      lessonId: "pm-interpreting-spasm",
      takeHome: "Next time I will give nitrate and repeat the run before I report a smooth narrowing as fixed.",
    });
  }
  const badRuns = [...new Set([...s.runsCitedWithoutContrast, ...s.runsCitedNonDiagnostic])];
  if (badRuns.length) {
    gaps.push({
      id: "report-non-diagnostic-run",
      title: "Finding read from a non-diagnostic run",
      severity: "technique",
      tWall: t,
      occurrences: badRuns.length,
      teaching: `Run ${badRuns.join(", ")} ${badRuns.length > 1 ? "were" : "was"} cited for a finding, but ${badRuns.length > 1 ? "they were" : "it was"} recorded without contrast or declared non-diagnostic. Complete filling is critical to interpretation; if it cannot be achieved, declare the angiogram non-diagnostic rather than offer an interpretation that may be wrong (Brilakis).`,
      lessonId: "pm-acquiring-cine",
      takeHome: "Next time I will read each finding from a fully filled run.",
    });
  }
  if (s.mi && !s.mi.correct) {
    gaps.push({
      id: "report-mi-class",
      title: "MI classification",
      severity: "technique",
      tWall: t,
      teaching:
        s.mi.truth === "injury-non-obstructive"
          ? "With no stenosis of 50% or more, the fifth universal definition calls this myocardial injury with non-obstructive coronary arteries: a working diagnosis that needs a cause (cardiac MR, ideally within 2 weeks, imaging or functional testing)."
          : "Obstructive disease or an acute coronary pathology in a patient presenting with MI makes it a primary MI in the fifth universal definition.",
      lessonId: "hb-background-mi",
      takeHome: "Next time I will classify the infarction from what the angiogram showed.",
    });
  }
  if (s.adhocAgainstReasons) {
    const a = s.anatomy;
    const what = [a.unprotectedLm ? "unprotected left main disease" : "", a.cto ? "a chronic total occlusion" : "", a.multivessel ? "multivessel disease" : ""].filter(Boolean);
    const reasons = s.deferralApplies.map((id) => DEFERRAL_REASONS.find((x) => x.id === id)!.title.toLowerCase());
    gaps.push({
      id: "report-adhoc-deferral",
      title: "Ad hoc PCI despite reasons to defer",
      severity: "safety",
      tWall: t,
      strategy: "advocacy-inquiry",
      advocacy: `You chose ad hoc PCI in a stable patient${what.length ? ` with ${what.join(" and ")}` : ""}.`,
      inquiry: "Which of the reasons to defer did you weigh at the pause after the diagnostic run?",
      teaching: `Brilakis's reasons to defer ad hoc PCI (7.3, after the SCAI consensus) are anatomy, dose, place, consent, symptoms and ischaemia, complication, people, preparation and the patient's choice. Here ${reasons.join(" and ")} applied${a.unprotectedLm || a.multivessel ? "; unprotected left main and multivessel disease are on his list, and a heart-team discussion comes first" : ""}. In stable disease ad hoc PCI needs a reassessment of appropriateness after the diagnostic angiogram.`,
      lessonId: DEFERRAL_SOURCE.lessonId,
      takeHome: "Next time I will run the list of reasons to defer aloud before any ad hoc PCI.",
    });
  }
  if (s.adhocCto && !s.adhocAgainstReasons) {
    gaps.push({
      id: "report-adhoc-cto",
      title: "Ad hoc CTO PCI",
      severity: "technique",
      tWall: t,
      teaching: "Brilakis advises against ad hoc CTO PCI in most cases, to leave time for planning, preparation and counselling, to limit contrast, radiation and fatigue, and to allow tests such as viability.",
      lessonId: DEFERRAL_SOURCE.lessonId,
      takeHome: "Next time I will plan a CTO procedure rather than attempt it ad hoc.",
    });
  }
  return gaps;
}
