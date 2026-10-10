// ---------------------------------------------------------------------------
// Full-case session module 'bleeding' (access-cx-bleeding-retroperitoneal).
//
// The retroperitoneal bleed after femoral access: when it presents, the
// learner suspects it, starts the general measures, chooses the diagnostic
// route for where the patient is and how stable (on the table: screen the
// bladder and image the iliofemoral arteries from the other groin; in recovery:
// unstable straight back to the laboratory, stable to CT), reverses the
// anticoagulation once the diagnosis is made, treats the source by what the
// angiogram or the CT shows, transfuses, and plans the antiplatelet therapy.
// The rules, results and grading are pure functions in
// src/simulation/access/bleeding.ts with their sources; the orders are
// src/ui/access/orders/Bleeding.tsx over src/ui/access/BleedingPanel.tsx; the
// bladder is drawn on the pelvic screen of src/ui/access/AccessFluoroView.tsx
// (route.ts bladderTubes), which tells this module when it was screened.
//
// Where an episode comes from:
//   - a scenario (scenarios/bleeding.ts) configures the bleed (its source, rate,
//     drugs on board, the contrast the team's study gave) and its onset a few
//     minutes after the learner takes over; this module bleeds the patient
//     itself (the stressed share of the loss into the engine, as the session
//     does for its own bleeds), so a balloon, a covered stent or coils stop it;
//   - a retroperitoneal bleed the closure's risk model drew in any femoral case
//     (src/simulation/access/closure.ts scheduleDelayed): once the session has
//     presented it, this module follows it (the session bleeds the patient; the
//     module tracks the volume for the haemoglobin and the bladder, and grades
//     the learner's management, but cannot stop the session's bleed: it holds
//     no time-lapse, a covered stent, coils or surgery are graded but do not
//     seal it, and the episode closes when the session's bleed has drained).
// A pelvis screen counts only while an episode is in hand (the wire passes the
// pelvis station in every femoral case). The general-measures verdict is
// written at the end of the first minute, or sooner once every measure is in.
// With a P2Y12 inhibitor on board, no antiplatelet plan by PLAN_VERDICT_AFTER_S
// after the bleeding is controlled is scored wrong.
// A case without a bleed is unchanged: no episode, nothing attached to the
// engine, no decision; the orders still work (a CT finds nothing).
//
// Nothing on the live screen names the bleed. The nurse reports signs; the
// haemoglobin, the bladder screen, the angiogram and the CT are results to be
// read; the learner says 'suspected retroperitoneal bleed' (which raises
// 'bleeding' for the tips). The verdicts are in the ledger and the debrief:
// the general measures in the first minute, no reflex litres of crystalloid,
// the route, the bladder reading, reversal after the diagnosis, protamine
// capped and slow, the IV antiplatelet stopped, the DOAC agent, platelets for
// ticagrelor, transfusion, the treatment for the source, and the antiplatelet
// plan (the oral P2Y12 plan after cangrelor; de-escalation, not stopping).
//
// Tips: once the learner suspects the bleed, the module reports 'bleeding'
// (events), which opens the case's access complication context
// (src/ui/access/caseTips.ts: access-cx-rp-in-lab, access-closure-hypotension-
// retroperitoneal, access-bleed-endovascular-control), and a PCI complication
// context with bleeding and, while the pressure is low, hypotension
// (tipContexts: pci-bleed-general-measures, pci-bleed-bladder-screen,
// pci-bleed-antiplatelet-platelets, pci-protamine-only-after-equipment-out,
// pci-post-bleeding-dapt). `raises` declares both for the reachability report.
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { DoacAgent, DrugId, InfusionDrug, Route } from "../../patient/pharmacology";
import type { CaseSession } from "../caseSession";
import type { CaseSessionModule } from "./index";
import {
  ANTIPLATELET_PLAN_LABEL,
  BLADDER_READING_LABEL,
  DOAC_REVERSAL_LABEL,
  MP_RP,
  RP_ROUTE_LABEL,
  RP_SOURCED,
  RP_TREATMENT_LABEL,
  angioFinding,
  bladderDentMm,
  bladderTruth,
  ctFinding,
  gradeAntiplateletPlan,
  gradeDoacReversal,
  gradePlatelets,
  gradeRoute,
  gradeTreatment,
  hasHaematoma,
  hbGl,
  hbNow,
  isActiveSource,
  isUnstable,
  newHbModel,
  protamineOrderCheck,
  stepHb,
  type AntiplateletPlan,
  type BladderReading,
  type DoacReversal,
  type HbModel,
  type P2y12Agent,
  type RpRoute,
  type RpSource,
  type RpTreatment,
  type RpWhere,
} from "../../access/bleeding";
import { cycleCuff } from "../emergencies";
import { hypotensionOf } from "./hypotension";

export const BLEEDING_MODULE_ID = "bleeding";

/** The events this module reports: 'bleeding', once the learner suspects the bleed. */
export const BLEEDING_EVENTS = ["bleeding"] as const satisfies readonly LabEvent[];

/**
 * What this module can report (the reachability report reads it): 'bleeding' into the case's access contexts,
 * where it opens the femoral 'complication' context, and its own PCI complication context with bleeding and the
 * patient's hypotension.
 */
export const raises: readonly LabRaises[] = [
  { lab: "access", phases: ["complication"], events: BLEEDING_EVENTS, routes: ["femoral"] },
  { lab: "pci", phases: ["complication"], events: ["bleeding", "hypotension"] },
];

const LESSON_ACCESS = "cm-access-complications-femoral-bleeding";
const LESSON_BLEED = "cm-patient-complications-bleeding";
const T_RP_LAB = ["access-cx-rp-in-lab", "pci-bleed-bladder-screen"];
const T_MEASURES = ["pci-bleed-general-measures", "access-closure-hypotension-retroperitoneal"];
const T_CONTROL = ["access-bleed-endovascular-control", "access-cx-iliofemoral-balloon-first", "access-cx-small-branch-embolise"];
const T_PROTAMINE = ["pci-protamine-only-after-equipment-out", "pci-bleed-general-measures"];
const T_PLATELETS = ["pci-bleed-antiplatelet-platelets", "pci-post-bleeding-dapt"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A scenario's bleed (scenario settings: MODEL PARAMETERS of the scenario unless cited there). */
export interface BleedConfig {
  source: RpSource;
  /** whole-blood loss while it bleeds (mL/min) and what it reaches untreated (mL) */
  rateMlMin: number;
  totalMl: number;
  /** blood already behind the peritoneum when it presents (mL) */
  initialMl?: number;
  /** minutes after the learner takes over that it presents */
  onsetAfterMin: number;
  /** the side of the bleeding groin (default: the planned femoral site's) */
  side?: "right" | "left";
  /** the P2Y12 inhibitor and aspirin on board, as the chart says (the scenario gives the drugs) */
  p2y12?: P2y12Agent | null;
  aspirin?: boolean;
  /** contrast the team's study gave (mL): it has reached the bladder by now */
  teamContrastMl?: number;
  /** a slow pulse with it (the lesson: often bradycardic): the engine's vagal level and how long it holds (s) */
  vagal?: { level: number; holdS: number };
  /** what the nurse or the patient says when it presents */
  report?: string;
}

export interface BleedEpisode {
  onsetT: number;
  where: RpWhere;
  source: RpSource;
  side: "right" | "left";
  rateMlMin: number;
  /** blood still to come untreated, blood lost since onset, and the haematoma (mL) */
  leftMl: number;
  lostMl: number;
  haematomaMl: number;
  /** a bleed the closure's risk model drew: the session bleeds the patient, this module follows */
  adopted: boolean;
  /** the session time the adopted event presented (its loss is counted from then) */
  adoptedAtS: number | null;
  /** a balloon holds the flow until then (s) */
  balloonUntil: number | null;
  sealed: { t: number; by: RpTreatment } | null;
  /** a conservative or another-cause decision closed the episode */
  resolved: { t: number; by: RpTreatment } | null;
  /** the pressure was ever unstable during the episode */
  everUnstable: boolean;
}

export type BleedOrderId =
  | "large-bore"
  | "central-line"
  | "crystalloid"
  | "crossmatch"
  | "red-cells"
  | "platelets"
  | "vasopressor"
  | "hb"
  | "site-pressure"
  | "stop-iv-antiplatelet";

export interface BleedOrderSpec {
  id: BleedOrderId;
  label: string;
  group: "measures" | "blood" | "reverse";
}

export const BLEED_ORDERS: readonly BleedOrderSpec[] = [
  { id: "large-bore", label: "Large-bore IV access", group: "measures" },
  { id: "central-line", label: "Central venous line", group: "measures" },
  { id: "crystalloid", label: `Crystalloid ${MP_RP.crystalloidBolusMl} mL`, group: "measures" },
  { id: "vasopressor", label: "Vasopressor infusion", group: "measures" },
  { id: "site-pressure", label: "Firm pressure over the groin", group: "measures" },
  { id: "hb", label: "Haemoglobin now", group: "measures" },
  { id: "crossmatch", label: "Type and crossmatch", group: "blood" },
  { id: "red-cells", label: "Red cells, one unit", group: "blood" },
  { id: "platelets", label: "Platelets, one pool", group: "blood" },
  { id: "stop-iv-antiplatelet", label: "Stop the GP IIb/IIIa or cangrelor infusion", group: "reverse" },
];

const GENERAL_MEASURES: readonly BleedOrderId[] = ["large-bore", "central-line", "crystalloid", "crossmatch", "red-cells", "vasopressor", "site-pressure", "hb"];

export interface BleedResult {
  ok: boolean;
  text: string;
}

export interface BleedState {
  config: BleedConfig | null;
  episode: BleedEpisode | null;
  pendingOnsetT: number | null;
  learnerFromT: number | null;
  /** when the module first took the bleed as suspected: said aloud, or acted on by a diagnostic step */
  suspectedT: number | null;
  /** when the learner said it aloud (the 'Say it' order); the implicit suspicion of a diagnostic step does not set it */
  saidT: number | null;
  /** the first time of each order */
  ordered: Partial<Record<BleedOrderId, number>>;
  crystalloidMl: number;
  /** crystalloid before the first red cells (mL) */
  crystalloidBeforeBloodMl: number;
  redCellUnits: number;
  /** haemoglobin samples: when drawn, the value (g/dL), and when reported */
  hb: { t: number; gdl: number; reportT: number; reported: boolean }[];
  bladder: { screenedT: number | null; view: string | null; reading: BladderReading | null; truth: BladderReading | null };
  angio: { t: number; text: string } | null;
  ct: { t: number; text: string } | null;
  backToLabT: number | null;
  teamContralateralT: number | null;
  retrogradeT: number | null;
  treatments: { t: number; what: RpTreatment }[];
  reversals: { t: number; what: string }[];
  ivStoppedT: number | null;
  plan: { t: number; plan: AntiplateletPlan } | null;
  /** what is under way, and when it is done */
  inProgress: { what: "hb" | "ct" | "back-to-lab" | "angio" | "retrograde" | RpTreatment; at: number; label: string }[];
  actions: { id: string; t: number; text: string }[];
  note: string | null;
  /** results to show in the panel, newest last (investigation reports: what an image or a test shows) */
  results: { t: number; title: string; text: string }[];
  decided: string[];
}

export interface BleedingModule extends CaseSessionModule {
  id: typeof BLEEDING_MODULE_ID;
  readonly state: BleedState;
  actions: {
    /** a scenario's bleed (its start state) */
    configure: (cfg: BleedConfig) => void;
    /** the learner has the case from now (a scenario's start state calls it) */
    learnerControl: () => void;
    /** the learner says it out loud: a suspected retroperitoneal bleed */
    suspect: () => BleedResult;
    order: (id: BleedOrderId) => BleedResult;
    protamine: (mg: number, rate: "slow" | "fast") => BleedResult;
    doacReversal: (agent: DoacReversal) => BleedResult;
    /** the pelvis screened on fluoroscopy (AccessFluoroView calls it with each exposed frame at the pelvis) */
    noteBladderScreen: (view?: string) => boolean;
    readBladder: (reading: BladderReading) => BleedResult;
    contralateralAngiogram: () => BleedResult;
    checkRetrograde: () => BleedResult;
    ct: () => BleedResult;
    backToLab: () => BleedResult;
    treat: (t: RpTreatment) => BleedResult;
    antiplateletPlan: (plan: AntiplateletPlan) => BleedResult;
    /** what the pelvic screen draws: how opacified the bladder is (0..1), the dent (mm) and the side of the push */
    bladder: () => { opacity: number; dentMm: number; side: "right" | "left" };
    /** the measured haemoglobin values reported so far (g/L), newest last */
    hbReported: () => { t: number; gl: number }[];
    /** where the patient is for the bleeding work-up now */
    where: () => RpWhere;
    /** whether a femoral sheath is in the other groin (on the table, the route to the iliofemoral angiogram) */
    contralateralSheath: () => boolean;
    /** the drugs the scenario put on board (the panel offers the matching reversal and plan rows) */
    onBoard: () => { p2y12: P2y12Agent | null; aspirin: boolean; doac: DoacAgent | null; heparin: boolean };
  };
}

/** The bleeding module of a session, if attached. */
export function bleedingOf(s: Pick<CaseSession, "mod">): BleedingModule | undefined {
  return s.mod<BleedingModule>(BLEEDING_MODULE_ID);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmtMin = (sec: number) => `${Math.round(sec / 6) / 10} min`;
/** How much contrast fully opacifies the bladder on the drawing (mL; MODEL PARAMETER of the drawing). */
const BLADDER_FULL_CONTRAST_ML = 60;
/**
 * With a P2Y12 inhibitor on board, a missing antiplatelet plan is scored wrong this long after the bleeding is
 * controlled (s; scoring setting): the team asks for it at the seal, and a plan not given by then was not made.
 */
export const PLAN_VERDICT_AFTER_S = 600;
/** What the recognition verdict expects (the lesson's 'Suspecting it'). */
const SUSPECT_EXPECTED = "Suspect it in every patient who becomes hypotensive during or after femoral access";

type EnginePort = {
  fluid?(ml: number, overS?: number): void;
  give?(o: { drug: DrugId; dose: number; route: Route }): void;
  stopInfusion?(drug: InfusionDrug): void;
  forceVagal?(level?: number, holdS?: number): void;
};

// ---------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------

export function createSessionModule(): BleedingModule {
  let s: CaseSession = null as unknown as CaseSession;
  let hbModel: HbModel | null = null;
  let lastSeenCrystalloid = 0;
  let lastSeenRedCellMl = 0;
  const adoptedEvents = new Set<unknown>();
  /** an adopted bleed has drained in full (the session's bleed stops on its own then) */
  let adoptedDrained = false;
  /** red cells running in: mL and haemoglobin still to give, and the rate (mL/s) */
  const redCellsRunning: { ml: number; hbG: number; rate: number }[] = [];
  /** the true pressure over the stability window */
  const pressures: { t: number; map: number; sys: number }[] = [];
  /**
   * A route chosen in recovery while the patient was still stable: the presentation is judged over its first
   * MP_RP.stabilityWindowS (the bleed's effect on the pressure lags its signs), so a fall below the line in that
   * window, before control, regrades the route as for an unstable patient.
   */
  let routeReview: { chosen: RpRoute; where: RpWhere } | null = null;

  const st: BleedState = {
    config: null,
    episode: null,
    pendingOnsetT: null,
    learnerFromT: null,
    suspectedT: null,
    saidT: null,
    ordered: {},
    crystalloidMl: 0,
    crystalloidBeforeBloodMl: 0,
    redCellUnits: 0,
    hb: [],
    bladder: { screenedT: null, view: null, reading: null, truth: null },
    angio: null,
    ct: null,
    backToLabT: null,
    teamContralateralT: null,
    retrogradeT: null,
    treatments: [],
    reversals: [],
    ivStoppedT: null,
    plan: null,
    inProgress: [],
    actions: [],
    note: null,
    results: [],
    decided: [],
  };

  const eng = () => s.patient as unknown as EnginePort;
  const now = () => round1(s.tS);
  const log = (kind: "action" | "nurse" | "result" | "patient", text: string) => s.logEntry(kind, text);
  const tel = (kind: string, data: Record<string, unknown>) => s.telemetry.push({ tWall: now(), tPatient: s.patient.clockState().t, kind: `bleeding.${kind}`, data });
  const ep = () => st.episode;
  const learner = () => st.learnerFromT !== null && !s.teamSetup;
  /** Learner actions are the learner's: a case without a scenario call is the learner's from the first one. */
  const touch = () => {
    if (st.learnerFromT === null && !s.teamSetup) st.learnerFromT = now();
  };
  /** A verdict is written once, and only while the learner has a bleed in hand (so an early order does not use it up). */
  const once = (id: string) => {
    if (!learner() || !st.episode || st.decided.includes(id)) return false;
    st.decided.push(id);
    return true;
  };
  const decide = (id: string, label: string, correct: boolean, expected: string, given: string, lessonId: string, tipIds: string[]) => {
    if (!learner() || !ep()) return;
    const prev = s.decisions().find((d) => d.id === id);
    if (prev && !prev.correct) return;
    s.decide({ id, stage: "bleeding", label, correct, expected, given, lessonId, tipIds });
  };
  const record = (id: string, text: string) => {
    st.actions.push({ id, t: now(), text });
    log("action", text);
    tel("order", { id });
  };
  const refuse = (text: string): BleedResult => {
    st.note = text;
    return { ok: false, text };
  };
  const done = (text: string): BleedResult => {
    st.note = text;
    return { ok: true, text };
  };
  const later = (what: BleedState["inProgress"][number]["what"], afterS: number, label: string) => st.inProgress.push({ what, at: s.tS + afterS, label });
  const underway = (what: BleedState["inProgress"][number]["what"]) => st.inProgress.some((p) => p.what === what);
  const result = (title: string, text: string) => {
    st.results.push({ t: now(), title, text });
    log("result", `${title}: ${text}`);
  };

  /** The planned femoral site's side (the groin a bleed comes from). */
  const bleedSide = (): "right" | "left" => st.config?.side ?? s.sites.find((x) => x.route === "femoral" && x.siteKind === "femoral")?.side ?? "right";
  const where = (): RpWhere => {
    if (st.backToLabT !== null && !underway("back-to-lab")) return "lab";
    return s.closureDone() ? "recovery" : "table";
  };
  const contralateralSheath = () => {
    const side = ep()?.side ?? bleedSide();
    return s.sites.some((x) => x.route === "femoral" && x.siteKind === "femoral" && x.side !== side && !!x.sheath);
  };
  const source = (): RpSource => ep()?.source ?? "no-haematoma";

  const diagnosed = () => {
    const e = ep();
    if (!e) return false;
    const bladderShows = st.bladder.screenedT !== null && st.bladder.truth === "dented";
    return bladderShows || st.angio !== null || st.ct !== null;
  };
  const ivAntiplateletRunning = () => st.ivStoppedT === null && (st.config?.p2y12 === "cangrelor" || (s.patient.vitals().antithrombotic?.gpi ?? 0) > 0.05);
  const doacOnBoard = (): DoacAgent | null => (s.profile.anticoagulation === "doac" ? (s.profile.doac?.agent ?? null) : null);

  const unstableNow = () => {
    const v = s.patient.vitals();
    const minMap = pressures.length ? Math.min(...pressures.map((p) => p.map)) : v.aortaTrue.mean;
    return isUnstable(minMap, v.aortaTrue.sys);
  };

  // -------------------------------------------------------------------------
  // onset and the bleed
  // -------------------------------------------------------------------------

  const startEpisode = (o: { source: RpSource; rateMlMin: number; totalMl: number; initialMl: number; adopted: boolean; adoptedAtS?: number; report?: string }) => {
    if (st.episode) return;
    const e: BleedEpisode = {
      onsetT: now(),
      where: where(),
      source: o.source,
      side: bleedSide(),
      rateMlMin: o.rateMlMin,
      leftMl: Math.max(0, o.totalMl),
      lostMl: 0,
      haematomaMl: 0,
      adopted: o.adopted,
      adoptedAtS: o.adoptedAtS ?? null,
      balloonUntil: null,
      sealed: null,
      resolved: null,
      everUnstable: false,
    };
    st.episode = e;
    hbModel ??= newHbModel(s.profile.sex, s.profile.weightKg);
    if (o.initialMl > 0) {
      e.lostMl += o.initialMl;
      e.haematomaMl += o.initialMl;
      if (!o.adopted) eng().fluid?.(-o.initialMl * MP_RP.stressedShare, 60);
      stepHb(hbModel, 0, { lostMl: o.initialMl });
    }
    if (!o.adopted) {
      if (o.report) log("nurse", o.report);
      // the nurse cycles the cuff every minute once the patient is unwell
      cycleCuff(s, 1);
      const vg = st.config?.vagal;
      if (vg) eng().forceVagal?.(vg.level, vg.holdS);
    }
    // an adopted bleed is the session's: it drains on its own and this module cannot stop it, so it holds no lapse
    if (!o.adopted) s.holdLapse(BLEEDING_MODULE_ID);
    tel("onset", { source: e.source, where: e.where, adopted: e.adopted });
    // said aloud before the signs were reported: the recognition stands
    if (st.saidT !== null) decide("rp-suspected", "Suspected a retroperitoneal bleed", true, SUSPECT_EXPECTED, "Before the first report", LESSON_ACCESS, T_MEASURES);
  };

  /** The bleed this step (mL of whole blood), into the haematoma; the module's own bleed also into the engine. */
  const bleedStep = (h: number) => {
    const e = ep();
    if (!e) return 0;
    if (e.adopted) {
      // the session drains the delayed event; follow it from when it presented
      const ev = [...adoptedEvents][0] as { bleedMlMin: number; totalMl: number } | undefined;
      if (!ev || e.adoptedAtS === null) return 0;
      const shouldBe = Math.min(ev.totalMl, (ev.bleedMlMin * Math.max(0, s.tS - e.adoptedAtS)) / 60);
      const d = Math.max(0, shouldBe - e.lostMl);
      e.lostMl += d;
      e.haematomaMl += d;
      // the session's bleed has run its course: the episode's end verdicts are written
      if (!adoptedDrained && e.lostMl >= ev.totalMl - 1e-6) {
        adoptedDrained = true;
        closeEpisode();
      }
      return d;
    }
    if (e.sealed || e.leftMl <= 0) return 0;
    if (e.balloonUntil !== null && s.tS < e.balloonUntil) return 0;
    const ml = Math.min(e.leftMl, (e.rateMlMin * h) / 60);
    if (ml <= 0) return 0;
    e.leftMl -= ml;
    e.lostMl += ml;
    e.haematomaMl += ml;
    eng().fluid?.(-ml * MP_RP.stressedShare, 1);
    return ml;
  };

  /** Crystalloid and red cells given by this module and by the hypotension module's orders since the last step (mL). */
  const fluidsStep = (h: number) => {
    const hm = hypotensionOf(s);
    const salineFromOrders = hm ? hm.state.actions.filter((a) => typeof a.id === "string" && a.id.startsWith("saline-")).reduce((sum, a) => sum + Number(String(a.id).slice(7)), 0) : 0;
    const hypoUnits = hm ? hm.state.actions.filter((a) => a.id === "blood-unit").length : 0;
    const totalCrystalloid = st.crystalloidMl + salineFromOrders;
    const dC = Math.max(0, totalCrystalloid - lastSeenCrystalloid);
    lastSeenCrystalloid = totalCrystalloid;
    if (dC > 0 && st.redCellUnits + hypoUnits === 0) st.crystalloidBeforeBloodMl += dC;
    // the hypotension module's units count as red cells for the haemoglobin (its own volume goes into the engine)
    const hypoMl = hypoUnits * MP_RP.redCellUnitMl;
    if (hypoMl > lastSeenRedCellMl) {
      const add = hypoMl - lastSeenRedCellMl;
      lastSeenRedCellMl = hypoMl;
      redCellsRunning.push({ ml: add, hbG: (add / MP_RP.redCellUnitMl) * MP_RP.redCellUnitHbG, rate: MP_RP.redCellUnitMl / MP_RP.redCellUnitS });
    }
    let rcMl = 0;
    let rcHb = 0;
    for (let i = redCellsRunning.length - 1; i >= 0; i--) {
      const r = redCellsRunning[i];
      const ml = Math.min(r.ml, r.rate * h);
      const g = r.ml > 0 ? (r.hbG * ml) / r.ml : 0;
      r.ml -= ml;
      r.hbG -= g;
      rcMl += ml;
      rcHb += g;
      if (r.ml <= 1e-6) redCellsRunning.splice(i, 1);
    }
    return { crystalloidMl: dC, redCellMl: rcMl, redCellHbG: rcHb };
  };

  const finishDue = () => {
    for (let i = st.inProgress.length - 1; i >= 0; i--) {
      const p = st.inProgress[i];
      if (s.tS < p.at) continue;
      st.inProgress.splice(i, 1);
      switch (p.what) {
        case "hb":
          for (const x of st.hb) if (!x.reported && s.tS >= x.reportT) {
            x.reported = true;
            {
              const e = ep();
              result("Haemoglobin", e ? `${hbGl(x.gdl)} g/L (sample at ${fmtMin(x.t - e.onsetT)} after the first report).` : `${hbGl(x.gdl)} g/L.`);
            }
          }
          break;
        case "ct":
          st.ct = { t: now(), text: ctFinding(source(), ep()?.side ?? bleedSide()) };
          result("CT abdomen and pelvis", st.ct.text);
          break;
        case "back-to-lab":
          log("nurse", "Back on the table in the catheter laboratory, monitored.");
          break;
        case "angio":
          st.angio = { t: now(), text: angioFinding(source(), ep()?.side ?? bleedSide()) };
          result("Iliofemoral angiogram", st.angio.text);
          break;
        case "retrograde":
          st.retrogradeT = now();
          result("Selective injection", source() === "small-branch" ? "The branch fills from its origin only; no filling from the other side." : "Nothing fills backwards.");
          break;
        default:
          sealBy(p.what);
      }
    }
  };

  const sealBy = (t: RpTreatment) => {
    const e = ep();
    if (!e || e.sealed) return;
    e.sealed = { t: now(), by: t };
    e.balloonUntil = null;
    log("result", t === "surgery" ? "Back from theatre: the bleeding point has been repaired." : "Check angiogram: no contrast leaves the artery.");
    // the team asks for the antiplatelet plan once the bleeding is controlled (the lesson's 'after the bleeding stops')
    if (st.config?.p2y12 && !st.plan) s.say("The bleeding is controlled: what is the antiplatelet plan?", "technique");
    closeEpisode();
  };

  /** The episode is over (sealed or resolved): the verdicts written at its end. */
  const closeEpisode = () => {
    const e = ep();
    if (!e) return;
    s.releaseLapse(BLEEDING_MODULE_ID);
    if (once("crystalloid")) {
      const ml = st.crystalloidBeforeBloodMl;
      decide("rp-crystalloid", "Crystalloid without reflex litres", ml <= MP_RP.reflexCrystalloidMl, `Crystalloid to restore perfusion while blood is obtained, not reflex litres (no more than ${MP_RP.reflexCrystalloidMl} mL before blood in this model)`, `${Math.round(ml)} mL before the first red cells`, LESSON_ACCESS, T_MEASURES);
    }
    if (once("transfusion")) {
      const units = st.redCellUnits + (hypotensionOf(s)?.state.actions.filter((a) => a.id === "blood-unit").length ?? 0);
      const need = e.everUnstable;
      decide("rp-transfusion", "Early transfusion for the blood lost", !need || units > 0, "Type and crossmatch, and red cells early by the loss and the haemodynamics", `${units} unit${units === 1 ? "" : "s"} of red cells${need ? " in an unstable patient" : ""}`, LESSON_BLEED, T_MEASURES);
    }
    if (once("iv-antiplatelet-end") && (st.config?.p2y12 === "cangrelor" || st.ivStoppedT !== null) && st.ivStoppedT === null)
      decide("rp-stop-iv-antiplatelet", "Stopped the IV antiplatelet infusion", false, "Stop any GP IIb/IIIa inhibitor or cangrelor infusion (no antidote)", "Still running when the bleeding was controlled", LESSON_BLEED, T_PROTAMINE);
  };

  /** The general measures that the verdict needs: access, type and crossmatch, and a haemoglobin. */
  const measuresAllOrdered = () => (st.ordered["large-bore"] !== undefined || st.ordered["central-line"] !== undefined) && st.ordered.crossmatch !== undefined && st.ordered.hb !== undefined;

  /**
   * The general-measures verdict judges the first minute, so it is written at the minute's end (slowTick) or as
   * soon as every measure is in, never earlier: a bladder screen at onset plus 5 s does not close it.
   */
  const generalMeasuresVerdict = () => {
    const e = ep();
    if (!e) return;
    if (now() - e.onsetT < RP_SOURCED.generalMeasuresWithinS && !measuresAllOrdered()) return;
    if (!once("general-measures")) return;
    const times = GENERAL_MEASURES.map((id) => st.ordered[id]).filter((x): x is number => x !== undefined);
    const first = times.length ? Math.min(...times) : null;
    const within = (id: BleedOrderId) => st.ordered[id] !== undefined && st.ordered[id]! - e.onsetT <= RP_SOURCED.generalMeasuresWithinS;
    const prompt = first !== null && first - e.onsetT <= RP_SOURCED.generalMeasuresWithinS;
    const access = within("large-bore") || within("central-line");
    const xm = within("crossmatch");
    const missing = [!access && "large-bore access", !xm && "type and crossmatch", !within("hb") && "haemoglobin"].filter(Boolean) as string[];
    decide(
      "rp-general-measures",
      "General measures at once",
      prompt && access && xm,
      "In the first minute: large-bore IV or central access, crystalloid without reflex litres, type and crossmatch, haemoglobin, pressure at the site",
      `${first === null ? "None started" : `First at ${fmtMin(first - e.onsetT)}`}${missing.length ? `; not done: ${missing.join(", ")}` : ""}`,
      LESSON_ACCESS,
      T_MEASURES,
    );
  };

  /** The first diagnostic step is graded against where the patient is and how stable. */
  const routeVerdict = (chosen: RpRoute) => {
    const e = ep();
    if (!e || !once("route")) return;
    generalMeasuresVerdict();
    const unstable = unstableNow();
    const w = where();
    writeRoute(chosen, w, unstable);
    routeReview = w === "recovery" && !unstable ? { chosen, where: w } : null;
  };

  /** The route verdict; a regrade (the presentation proved unstable) replaces the earlier verdict either way. */
  const writeRoute = (chosen: RpRoute, w: RpWhere, unstable: boolean, regrade = false) => {
    if (!learner() || !ep()) return;
    const g = gradeRoute(w, unstable, chosen);
    const given = `${RP_ROUTE_LABEL[chosen]} (${w === "recovery" ? (unstable ? (regrade ? "in recovery; the pressure fell below the line within minutes of the first signs" : "in recovery, unstable") : "in recovery, stable") : "in the laboratory"})`;
    const rec = { id: "rp-route", label: "The diagnostic route for where the patient is", correct: g.correct, expected: g.expected, given, lessonId: LESSON_ACCESS, tipIds: T_RP_LAB };
    if (regrade) s.decide({ ...rec, stage: "bleeding" });
    else decide(rec.id, rec.label, rec.correct, rec.expected, rec.given, rec.lessonId, rec.tipIds);
  };

  /** The bleed taken as suspected; a diagnostic step taken for it (`actedOn`) earns the recognition verdict too. */
  const markSuspected = (actedOn?: string) => {
    if (st.suspectedT === null) st.suspectedT = now();
    const e = ep();
    if (actedOn && e && !s.decisions().some((d) => d.id === "rp-suspected"))
      decide("rp-suspected", "Suspected a retroperitoneal bleed", true, SUSPECT_EXPECTED, `Acted on it: ${actedOn.toLowerCase()}, at ${fmtMin(now() - e.onsetT)} after the first report`, LESSON_ACCESS, T_MEASURES);
  };

  // -------------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------------

  const configure = (cfg: BleedConfig) => {
    st.config = { ...cfg };
    st.pendingOnsetT = s.tS + Math.max(0, cfg.onsetAfterMin) * 60;
  };

  const learnerControl = () => {
    st.learnerFromT = now();
    if (st.config) st.pendingOnsetT = s.tS + Math.max(0, st.config.onsetAfterMin) * 60;
  };

  const suspect = (): BleedResult => {
    touch();
    if (st.saidT !== null) return refuse("Already said.");
    st.saidT = now();
    markSuspected();
    record("suspect", "Said aloud: a suspected retroperitoneal bleed.");
    const e = ep();
    if (e && !s.decisions().some((d) => d.id === "rp-suspected")) decide("rp-suspected", "Suspected a retroperitoneal bleed", true, SUSPECT_EXPECTED, `At ${fmtMin(now() - e.onsetT)} after the first report`, LESSON_ACCESS, T_MEASURES);
    return done("Noted.");
  };

  const order = (id: BleedOrderId): BleedResult => {
    touch();
    const first = st.ordered[id] === undefined;
    const e = eng();
    switch (id) {
      case "large-bore":
      case "central-line":
      case "crossmatch":
      case "site-pressure": {
        if (!first) return refuse("Already done.");
        st.ordered[id] = now();
        const text = {
          "large-bore": "Two large-bore IV cannulas in.",
          "central-line": "Central venous line in, for pressors and volume.",
          crossmatch: "Blood sent for type and crossmatch.",
          "site-pressure": "Firm pressure over the groin.",
        }[id];
        record(id, text);
        return done("Done.");
      }
      case "crystalloid": {
        st.ordered.crystalloid ??= now();
        e.fluid?.(MP_RP.crystalloidBolusMl, MP_RP.crystalloidOverS);
        st.crystalloidMl += MP_RP.crystalloidBolusMl;
        record(id, `Crystalloid ${MP_RP.crystalloidBolusMl} mL IV.`);
        return done(`${MP_RP.crystalloidBolusMl} mL running in.`);
      }
      case "red-cells": {
        st.ordered["red-cells"] ??= now();
        st.redCellUnits += 1;
        e.fluid?.(MP_RP.redCellUnitMl, MP_RP.redCellUnitS);
        redCellsRunning.push({ ml: MP_RP.redCellUnitMl, hbG: MP_RP.redCellUnitHbG, rate: MP_RP.redCellUnitMl / MP_RP.redCellUnitS });
        record(id, `One unit of red cells running${st.ordered.crossmatch === undefined ? " (uncrossmatched, group O)" : ""}.`);
        return done("Blood running.");
      }
      case "platelets": {
        st.ordered.platelets ??= now();
        record(id, "One pool of platelets running.");
        const g = gradePlatelets({ p2y12: st.config?.p2y12 ?? null, aspirin: !!st.config?.aspirin });
        if (once("platelets")) decide("rp-platelets", "Platelets to reverse the antiplatelet effect", g.correct, g.expected, "Platelets transfused", LESSON_BLEED, T_PLATELETS);
        return done("Platelets running.");
      }
      case "vasopressor": {
        st.ordered.vasopressor ??= now();
        const hm = hypotensionOf(s);
        const r = hm?.actions.setPump("noradrenaline", 0.1);
        record(id, r?.ok === false ? `Vasopressor asked for: ${r.text}` : "Noradrenaline infusion started at the low end of its range.");
        return done(r?.ok === false ? r.text : "Infusion running.");
      }
      case "hb": {
        st.ordered.hb ??= now();
        hbModel ??= newHbModel(s.profile.sex, s.profile.weightKg);
        st.hb.push({ t: now(), gdl: round1(hbNow(hbModel)), reportT: s.tS + MP_RP.hbTurnaroundS, reported: false });
        record(id, "Blood gas for haemoglobin.");
        later("hb", MP_RP.hbTurnaroundS, "Haemoglobin");
        return done("Sample sent.");
      }
      case "stop-iv-antiplatelet": {
        if (st.ivStoppedT !== null) return refuse("Already stopped.");
        const running = ivAntiplateletRunning();
        for (const d of ["cangrelor", "eptifibatide", "tirofiban"] as InfusionDrug[]) e.stopInfusion?.(d);
        st.ivStoppedT = now();
        record(id, running ? "The IV antiplatelet infusion stopped." : "No IV antiplatelet infusion was running.");
        if (running && once("iv-antiplatelet")) decide("rp-stop-iv-antiplatelet", "Stopped the IV antiplatelet infusion", true, "Stop any GP IIb/IIIa inhibitor or cangrelor infusion (no antidote)", `Stopped at ${fmtMin(now() - (ep()?.onsetT ?? now()))}`, LESSON_BLEED, T_PROTAMINE);
        return done(running ? "Stopped." : "Nothing running.");
      }
    }
    return refuse("Unknown order.");
  };

  const reversalTiming = (what: string) => {
    st.reversals.push({ t: now(), what });
    if (!ep() || !once("reversal-timing")) return;
    const ok = diagnosed();
    decide("rp-reversal-timing", "Anticoagulation reversed once the diagnosis was made", ok, "Reverse the anticoagulation once the diagnosis is established (bladder, angiogram or CT)", ok ? `${what}, after the diagnosis` : `${what}, before any finding`, LESSON_ACCESS, T_PROTAMINE);
  };

  const protamine = (mg: number, rate: "slow" | "fast"): BleedResult => {
    touch();
    const chk = protamineOrderCheck(mg);
    if (chk.refused) {
      record("protamine", `Protamine ${mg} mg ${rate === "fast" ? "as a bolus" : "slowly"} asked for: not drawn up.`);
      if (ep()) decide("rp-protamine", "Protamine: capped and slow", false, `No more than ${RP_SOURCED.protamineMaxMg} mg, no faster than ${RP_SOURCED.protamineMaxMgPerMin} mg/min`, `${mg} mg ${rate === "fast" ? "fast" : "slowly"} (refused)`, LESSON_BLEED, T_PROTAMINE);
      return refuse(chk.reason ?? "Refused.");
    }
    const g = s.giveProtamine(mg, rate);
    if (!g) return refuse("Wait for the step in hand to finish.");
    if (g.refused) return refuse("Not while a catheter or wire is in: all equipment out first.");
    st.actions.push({ id: "protamine", t: now(), text: `Protamine ${g.givenMg} mg ${rate === "slow" ? "slowly" : "fast"}.` });
    if (ep()) decide("rp-protamine", "Protamine: capped and slow", rate === "slow", `No more than ${RP_SOURCED.protamineMaxMg} mg, no faster than ${RP_SOURCED.protamineMaxMgPerMin} mg/min; a reaction can follow 5-10 minutes later`, `${g.givenMg} mg ${rate === "slow" ? "slowly" : "fast"}`, LESSON_BLEED, T_PROTAMINE);
    reversalTiming("Protamine");
    return done("Given.");
  };

  const doacReversal = (agent: DoacReversal): BleedResult => {
    touch();
    const e = eng();
    if (agent === "idarucizumab") {
      e.give?.({ drug: "idarucizumab", dose: RP_SOURCED.idarucizumabDoseG * 1000, route: "iv" });
      e.give?.({ drug: "idarucizumab", dose: RP_SOURCED.idarucizumabDoseG * 1000, route: "iv" });
    } else if (agent === "andexanet") e.give?.({ drug: "andexanet", dose: MP_RP.andexanetEngineMg, route: "iv" });
    else e.give?.({ drug: "pcc", dose: MP_RP.pccEngineU, route: "iv" });
    record(agent, `${DOAC_REVERSAL_LABEL[agent]} given.`);
    const ev = ep();
    // reversal is for bleeding that threatens life: an active bleeding point, or a pressure that has been unstable
    const g = gradeDoacReversal(doacOnBoard(), agent, ev ? isActiveSource(ev.source) || ev.everUnstable : false);
    if (once("doac-reversal")) decide("rp-doac-reversal", "The DOAC reversal agent", g.correct, g.expected, DOAC_REVERSAL_LABEL[agent], LESSON_BLEED, ["pci-bleed-general-measures"]);
    reversalTiming(DOAC_REVERSAL_LABEL[agent].split(" (")[0]);
    return done("Given.");
  };

  const bladder = () => {
    const contrast = (st.config?.teamContrastMl ?? 0) + (s.totals?.contrastMl ?? 0);
    const opacity = Math.max(0, Math.min(1, contrast / BLADDER_FULL_CONTRAST_ML));
    const e = ep();
    const dentMm = e && hasHaematoma(e.source) ? bladderDentMm(e.haematomaMl) : 0;
    return { opacity, dentMm, side: e?.side ?? bleedSide() };
  };

  /**
   * The pelvis screened. Only while a bleed is in hand: the pelvis station is the one the wire passes in any femoral
   * case, so a screen without an episode (or before its onset, or during the team's setup) records nothing, raises
   * no suspicion and writes no route verdict.
   */
  const noteBladderScreen = (view = "ap"): boolean => {
    if (where() === "recovery" || s.teamSetup || !st.episode) return false;
    const first = st.bladder.screenedT === null;
    const b = bladder();
    st.bladder.truth = bladderTruth(b.opacity, b.dentMm);
    st.bladder.view = view;
    if (!first) return true;
    touch();
    st.bladder.screenedT = now();
    markSuspected(RP_ROUTE_LABEL.bladder);
    record("bladder-screen", "Pelvis screened on fluoroscopy.");
    routeVerdict("bladder");
    return true;
  };

  const readBladder = (reading: BladderReading): BleedResult => {
    touch();
    if (st.bladder.screenedT === null) return refuse("Screen the pelvis first.");
    st.bladder.reading = reading;
    record("bladder-read", `Bladder read as: ${BLADDER_READING_LABEL[reading].toLowerCase()}.`);
    const truth = st.bladder.truth ?? "not-opacified";
    if (once("bladder-read")) decide("rp-bladder-read", "Read the bladder screen", reading === truth, BLADDER_READING_LABEL[truth], BLADDER_READING_LABEL[reading], LESSON_BLEED, ["pci-bleed-bladder-screen"]);
    return done("Noted.");
  };

  const inLab = () => where() !== "recovery" && !underway("back-to-lab") && !underway("ct");

  const contralateralAngiogram = (): BleedResult => {
    touch();
    if (!inLab()) return refuse(where() === "recovery" ? "The patient is in recovery: decide where they go first." : "Not until the patient is back on the table.");
    if (underway("angio")) return refuse("Already under way.");
    let delay = MP_RP.angioS;
    if (where() === "table") {
      if (!contralateralSheath()) return refuse("Get access in the other groin first: open the other femoral artery as another access site.");
    } else if (st.teamContralateralT === null) {
      st.teamContralateralT = now();
      delay += MP_RP.teamContralateralS;
      record("contralateral-access", "Access in the other groin.");
    }
    markSuspected(RP_ROUTE_LABEL["contralateral-angio"]);
    record("contralateral-angio", "Iliofemoral angiography from the other groin, over the bifurcation.");
    later("angio", delay, "Iliofemoral angiogram");
    routeVerdict("contralateral-angio");
    if (ep() && once("in-lab-workup"))
      decide("rp-in-lab-workup", "In the laboratory: bladder, then the other groin", st.bladder.screenedT !== null, "Screen the bladder with fluoroscopy, then angiography from the other groin", st.bladder.screenedT !== null ? "Bladder screened, then iliofemoral angiography" : "Angiography without a look at the bladder", LESSON_ACCESS, T_RP_LAB);
    return done("Under way.");
  };

  const checkRetrograde = (): BleedResult => {
    touch();
    if (!st.angio) return refuse("Image the arteries first.");
    if (underway("retrograde")) return refuse("Already under way.");
    record("retrograde", "Selective injection to see whether the branch fills backwards.");
    later("retrograde", MP_RP.retrogradeCheckS, "Selective injection");
    return done("Under way.");
  };

  const ct = (): BleedResult => {
    touch();
    if (underway("ct")) return refuse("Already under way.");
    if (where() !== "recovery") {
      // allowed, as the team would go, and graded as the route
    }
    markSuspected(RP_ROUTE_LABEL.ct);
    record("ct", "To CT for the abdomen and pelvis.");
    later("ct", MP_RP.ctS, "CT abdomen and pelvis");
    routeVerdict("ct");
    return done("On the way to CT.");
  };

  const backToLab = (): BleedResult => {
    touch();
    if (where() !== "recovery") return refuse("The patient is in the laboratory.");
    if (underway("back-to-lab") || underway("ct")) return refuse("Already on the move.");
    markSuspected(RP_ROUTE_LABEL["back-to-lab"]);
    st.backToLabT = now();
    record("back-to-lab", "Straight back to the catheter laboratory.");
    later("back-to-lab", MP_RP.backToLabS, "Back to the laboratory");
    routeVerdict("back-to-lab");
    return done("On the way.");
  };

  const treat = (t: RpTreatment): BleedResult => {
    touch();
    const e = ep();
    const endo = t === "balloon" || t === "covered-stent" || t === "coils";
    if (endo) {
      if (!inLab()) return refuse("Not until the patient is on the table.");
      if (!st.angio) return refuse("Image the iliofemoral arteries first.");
      if (where() === "table" && !contralateralSheath()) return refuse("Get access in the other groin first.");
    }
    if ((t === "conservative" || t === "other-cause") && !st.angio && !st.ct && st.bladder.screenedT === null) return refuse("Look first: the bladder, the angiogram or the CT.");
    if (st.inProgress.some((p) => p.what === t)) return refuse("Already under way.");
    st.treatments.push({ t: now(), what: t });
    record(t, `${RP_TREATMENT_LABEL[t]}.`);
    if (!e) return done(endo ? "Done." : "Noted.");
    const balloonFirst = st.treatments.some((x) => x.what === "balloon" && x.t <= now()) && t !== "balloon";
    const v = gradeTreatment(e.source, t, { balloonFirst, retrogradeChecked: st.retrogradeT !== null });
    if (t === "balloon" && isActiveSource(e.source)) {
      e.balloonUntil = s.tS + MP_RP.balloonS + MP_RP.balloonHoldS;
      if (once("balloon")) decide("rp-balloon", "A low-pressure balloon across the bleeding point first", true, "Inflate a balloon at low pressure across the bleeding point before any definitive treatment", "Balloon up across the hole", LESSON_ACCESS, T_CONTROL);
      return done("The balloon is up.");
    }
    if (once("treatment")) decide("rp-treatment", "Treatment for what the imaging shows", v.correct, v.expected, `${RP_TREATMENT_LABEL[t]}${v.reasons.length ? ` (${v.reasons.join(" ")})` : ""}`, LESSON_BLEED, T_CONTROL);
    if (v.effect === "seals" && e.adopted) {
      // a bleed the closure's risk model drew is the session's own, which has no public stop: graded, not sealed
      return done("Placed. This simulator does not model this bleed stopping: keep watching the pressure and the haemoglobin.");
    }
    if (v.effect === "seals") {
      const sec = t === "covered-stent" ? MP_RP.stentS : t === "coils" ? MP_RP.coilS : MP_RP.surgeryS;
      // the balloon (if up) holds the flow while the definitive step goes in
      if (e.balloonUntil !== null) e.balloonUntil = Math.max(e.balloonUntil, s.tS + sec);
      later(t, sec, RP_TREATMENT_LABEL[t]);
      return done("Under way.");
    }
    if (t === "conservative" || t === "other-cause") {
      if (!e.resolved && !isActiveSource(e.source)) {
        e.resolved = { t: now(), by: t };
        closeEpisode();
      }
      return done("Noted.");
    }
    return done("Done.");
  };

  const antiplateletPlan = (plan: AntiplateletPlan): BleedResult => {
    touch();
    st.plan = { t: now(), plan };
    record("antiplatelet-plan", `Antiplatelet plan: ${ANTIPLATELET_PLAN_LABEL[plan].toLowerCase()}.`);
    const g = gradeAntiplateletPlan(st.config?.p2y12 ?? null, plan);
    if (once("antiplatelet-plan")) decide("rp-antiplatelet-plan", "The antiplatelet plan after the bleed", g.correct, g.expected, ANTIPLATELET_PLAN_LABEL[plan], LESSON_BLEED, T_PLATELETS);
    return done("Noted.");
  };

  // -------------------------------------------------------------------------
  // clock
  // -------------------------------------------------------------------------

  const slowTick = (h: number) => {
    // a scenario's bleed presents
    if (st.pendingOnsetT !== null && st.config && s.tS >= st.pendingOnsetT && !st.episode && !s.teamSetup) {
      const c = st.config;
      st.pendingOnsetT = null;
      startEpisode({ source: c.source, rateMlMin: c.rateMlMin, totalMl: c.totalMl, initialMl: c.initialMl ?? 0, adopted: false, report: c.report });
    }
    // a bleed the closure's risk model drew, once the session has presented it
    if (!st.episode && s.presented.length) {
      const ev = s.presented.find((x) => x.kind === "retroperitoneal-bleed" && !adoptedEvents.has(x));
      if (ev) {
        adoptedEvents.add(ev);
        startEpisode({ source: "large-vessel", rateMlMin: ev.bleedMlMin, totalMl: ev.totalMl, initialMl: 0, adopted: true, adoptedAtS: Math.min(s.tS, ev.atS) });
      }
    }
    const e = st.episode;
    if (!e) {
      // the orders work without a bleed (a CT finds nothing)
      finishDue();
      return;
    }
    const lost = bleedStep(h);
    const f = fluidsStep(h);
    if (hbModel) stepHb(hbModel, h, { lostMl: lost, crystalloidMl: f.crystalloidMl, redCellMl: f.redCellMl, redCellHbG: f.redCellHbG });
    const v = s.patient.vitals();
    pressures.push({ t: s.tS, map: v.aortaTrue.mean, sys: v.aortaTrue.sys });
    while (pressures.length && pressures[0].t < s.tS - MP_RP.stabilityWindowS) pressures.shift();
    if (!e.sealed && !e.resolved && unstableNow()) e.everUnstable = true;
    if (routeReview) {
      if (e.sealed || e.resolved || s.tS - e.onsetT > MP_RP.stabilityWindowS) routeReview = null;
      else if (unstableNow()) {
        writeRoute(routeReview.chosen, routeReview.where, true, true);
        routeReview = null;
      }
    }
    // a balloon let down without a definitive step: the hole bleeds again
    if (e.balloonUntil !== null && s.tS >= e.balloonUntil && !e.sealed) e.balloonUntil = null;
    finishDue();
    if (learner() && s.tS - e.onsetT >= RP_SOURCED.generalMeasuresWithinS) generalMeasuresVerdict();
    // with a P2Y12 inhibitor on board, no plan by PLAN_VERDICT_AFTER_S after the bleeding was controlled is scored
    const closedT = e.sealed?.t ?? e.resolved?.t ?? null;
    const p2y12 = st.config?.p2y12 ?? null;
    if (closedT !== null && p2y12 && !st.plan && s.tS - closedT >= PLAN_VERDICT_AFTER_S && once("antiplatelet-plan"))
      decide("rp-antiplatelet-plan", "The antiplatelet plan after the bleed", false, gradeAntiplateletPlan(p2y12, p2y12 === "cangrelor" ? "oral-after-cangrelor" : "de-escalate").expected, "No plan recorded", LESSON_BLEED, T_PLATELETS);
    // the crystalloid verdict is wrong the moment the reflex litres are given
    if (st.crystalloidBeforeBloodMl > MP_RP.reflexCrystalloidMl && once("crystalloid"))
      decide("rp-crystalloid", "Crystalloid without reflex litres", false, `Crystalloid to restore perfusion while blood is obtained, not reflex litres (no more than ${MP_RP.reflexCrystalloidMl} mL before blood in this model)`, `${Math.round(st.crystalloidBeforeBloodMl)} mL before the first red cells`, LESSON_ACCESS, T_MEASURES);
  };

  const events = (): readonly LabEvent[] => (st.suspectedT !== null ? BLEEDING_EVENTS : []);

  const tipContexts = (): readonly LabContext[] => {
    if (st.suspectedT === null) return [];
    const evs: LabEvent[] = ["bleeding"];
    if (s.activeEvents().includes("hypotension")) evs.push("hypotension");
    return [{ lab: "pci", phase: "complication", events: evs }];
  };

  const mod: BleedingModule = {
    id: BLEEDING_MODULE_ID,
    state: st,
    attach(session) {
      s = session;
      return () => {
        s.releaseLapse(BLEEDING_MODULE_ID);
      };
    },
    slowTick,
    events,
    tipContexts,
    actions: {
      configure,
      learnerControl,
      suspect,
      order,
      protamine,
      doacReversal,
      noteBladderScreen,
      readBladder,
      contralateralAngiogram,
      checkRetrograde,
      ct,
      backToLab,
      treat,
      antiplateletPlan,
      bladder,
      hbReported: () => st.hb.filter((x) => x.reported).map((x) => ({ t: x.t, gl: hbGl(x.gdl) })),
      where,
      contralateralSheath,
      onBoard: () => ({ p2y12: st.config?.p2y12 ?? null, aspirin: !!st.config?.aspirin, doac: doacOnBoard(), heparin: s.heparinU > 0 }),
    },
  };
  return mod;
}
