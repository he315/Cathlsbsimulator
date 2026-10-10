// ---------------------------------------------------------------------------
// Full-case session module 'hypotension' (proc-hypotension-pressors).
//
// A low pressure by mechanism, from the shared cause model
// (src/simulation/patient/hypotensionCauses.ts), treated through orders and
// infusions (src/ui/access/orders/Infusions.tsx, src/ui/access/InfusionPanel.tsx),
// and pulmonary oedema from a fluid and contrast load. The doses, regimens and
// rules are in ../hypotension.ts with their sources. What this module adds is
// the case: it runs the scenario's cause on the patient, watches the pressure,
// keeps the record of what was done and when, applies each order to the engine
// (whose physiology gives the consequences) and writes the decisions to the
// ledger.
//
// Consequences come from the patient, not fixed rules:
//   - a vasopressor lifts the pressure of a bleeding patient only while
//     volume lasts, and does nothing for an empty or compressed heart for long;
//     fluid, blood and control of the site (or a drain) fix the cause;
//   - an inotrope in obstructive hypertrophic cardiomyopathy worsens the
//     outflow obstruction (the engine's LVOT model), a pure pressor does not;
//   - a fluid bolus into a ventricle with a raised filling pressure raises the
//     LVEDP further, and the saturation falls with it (the engine's
//     oxygenation shunt): breathlessness, crackles and a falling SpO2 follow;
//   - a vasoactive drug above its range for a while gives non-sustained runs
//     of broad-complex tachycardia (MP_HYPOTENSION.arrhythmiaPerMin, a seeded
//     draw; dopamine more), recurring while the dose stays high and stopping
//     once the doses are back in range; a pressor left running after
//     the cause is fixed gives rebound hypertension (the physiology), which
//     the nurse reports as numbers;
//   - escalating doses bring the attending's question; the learner chooses
//     mechanical support (the panel hands the patient to the MCS lab through
//     useLabHandoverStore) or more drug.
// The decisions (confirm it is real; the drug against the mechanism; the cause
// treated; dobutamine started low; the line; the mechanism named; escalation;
// weaning; the oedema regimen) are recorded only once the learner has the
// case. Nothing on the live screen names the cause: the record shows what was
// ordered and the numbers measured; the truth is in the ledger and the
// debrief.
//
// A random case's patient is unchanged: the module starts no cause unless a
// scenario asks (startCause), attaches nothing to the engine, and draws its
// arrhythmia from its own generator only while a drug runs above its range.
// Its scoring is not limited to the scenarios: in every full case the learner
// has, a low pressure opens an episode (confirm it is real, the drug, the
// line), and a patient at risk of oedema (LVEF below MP_HYPOTENSION.
// oedemaRiskLvef, or a raised LVEDP) is scored on a fluid bolus and on the
// oedema regimen, with the nurse's signs in the log.
//
// While the right heart numbers are open the module reports the haemodynamic
// 'right-heart' context through tipContexts() (rhcTipContext), which the case
// tips panel merges (src/ui/access/caseTips.ts), so haemo-wedge-oedema-risk
// appears beside the numbers. Its lines go through session.say() and
// session.logEntry().
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { Vitals } from "../../patient/engine";
import type { CaseSession } from "../caseSession";
import type { SessionHook } from "../scenarios/index";
import type { CaseSessionModule } from "./index";
import { SeededRng } from "../../patient/rng";
import {
  bridgeVerdict,
  cardiacIndex,
  classifyRightHeart,
  hypotensionCause,
  MECHANISM_WORDS,
  MP_CAUSES,
  type CauseRun,
  type CauseTreatment,
  type HypotensionEnginePort,
  type HypotensionMechanism,
  type RightHeartPattern,
} from "../../patient/hypotensionCauses";
import {
  ATROPINE_BLOCK_MG,
  HYPO_ORDER_BY_ID,
  MP_HYPOTENSION,
  OEDEMA,
  PRESSOR_DOSES,
  PUMP_BY_DRUG,
  aboveRange,
  dobutamineStartVerdict,
  engineRate,
  isVasoactive,
  lineVerdict,
  nitrateVerdict,
  pumpMlPerHour,
  type HypoOrderId,
  type PumpDrug,
  type SupportDevice,
} from "../hypotension";
import { emergenciesOf } from "./emergencies";

export const HYPOTENSION_MODULE_ID = "hypotension";

/** The events this module reports: the low pressure of an episode, and the oedema and load of an at-risk patient. */
export const HYPOTENSION_EVENTS = ["hypotension", "pulmonary-oedema", "high-contrast-volume"] as const satisfies readonly LabEvent[];

/**
 * What this module can report (the reachability report reads it). The case's phase-less PCI and
 * haemodynamic contexts carry the patient events only (src/ui/access/caseTips.ts), so the PCI lab
 * gets 'hypotension' and the diagnostic and access contexts, which carry the module's events, get all
 * three.
 */
export const raises: readonly LabRaises[] = [
  { lab: "pci", phases: [], events: ["hypotension"] },
  { lab: "haemo", phases: [], events: ["hypotension"] },
  { lab: "diagnostic", phases: [], events: HYPOTENSION_EVENTS },
  { lab: "access", phases: [], events: HYPOTENSION_EVENTS },
];

const PRESSORS_LESSON = "pm-lab-drugs-pressors";
const OEDEMA_LESSON = "cm-flow-embolism-oedema-cholesterol";
const MATCH_TIPS = ["pci-hypotension-match-pressor"];
const REAL_TIPS = ["pci-mon-false-hypotension"];
const ESCALATE_TIPS = ["mcs-pressor-escalation-limit", "pci-hypotension-match-pressor"];
const HCM_TIPS = ["haemo-hocm-hypotension-phenylephrine", "pci-hypotension-match-pressor"];
const PATTERN_TIPS = ["haemo-hypotension-pattern"];
const OEDEMA_TIPS = ["diag-oedema-on-table", "haemo-wedge-oedema-risk"];

type ConfirmId = (typeof MP_HYPOTENSION.confirmChecks)[number];

export interface HypoAction {
  id: HypoOrderId | `pump-${string}` | "name-mechanism" | "escalate";
  t: number;
  text: string;
}

export interface PumpState {
  drug: PumpDrug;
  /** dose rate in the panel's unit (PUMP_BY_DRUG[drug].unit) */
  rate: number;
  /** syringe strength (µg/mL or U/mL) and the pump rate it gives */
  strength: number;
  mlPerHour: number;
  line: "central" | "peripheral";
  startedT: number;
  /** the highest rate so far, and when the rate last fell (the weaning) */
  maxRate: number;
  reducedT: number | null;
}

export interface HypoEpisode {
  onsetT: number;
  /** the scenario's cause while it runs (null: the cause is not the module's) */
  causeId: string | null;
  confirm: Partial<Record<ConfirmId, number>>;
  firstVasoactive: { drug: string; t: number } | null;
  /** the first treatment of the cause in this episode, and when */
  causeTreated: { what: CauseTreatment; t: number } | null;
  /** the mean has stood at or above the threshold since (null: not now) */
  okSince: number | null;
  done: boolean;
}

export interface RhcReadout {
  t: number;
  raMmHg: number;
  paMeanMmHg: number;
  pcwpMmHg: number;
  coLMin: number;
  ci: number;
  svrWood: number;
  hr: number | null;
  /** measured through a venous sheath (true) or a modelled reading offered without one */
  measured: boolean;
  note: string;
  /** the pattern (truth, for the debrief and tests; never shown on the live screen) */
  pattern: RightHeartPattern;
}

export interface HypotensionState {
  actions: HypoAction[];
  /** the last result line (shown under the orders) */
  note: string | null;
  cause: { id: string; startedT: number; stoppedT: number | null } | null;
  /** the first treatment of the scenario's cause in the case, and when (any episode, or before one) */
  causeTreated: { what: CauseTreatment; t: number } | null;
  episodes: HypoEpisode[];
  pumps: PumpState[];
  boluses: { drug: string; dose: number; t: number }[];
  /** IV fluid this module gave (mL); the case total adds the session's and the emergency orders' */
  fluidMl: number;
  rhc: RhcReadout | null;
  /** treatments the team is carrying out (control, drain, pacing, a cuff, a right heart run), due at `at` */
  inProgress: { what: CauseTreatment | "cuff" | "rhc"; at: number; label: string }[];
  mechanismNamed: { m: HypotensionMechanism; t: number } | null;
  escalation: { offeredT: number; reason: string; choice: "support" | "drugs" | null; device: SupportDevice | null; choiceT: number | null } | null;
  /**
   * the high-dose tachyarrhythmia (non-sustained runs of VT): when it began, since when the doses have been
   * back in range, the runs so far, the end of the current run and the start of the next, and whether
   * a complete heart block was present before the run (restored after it)
   */
  arrhythmia: { t: number; settleSinceT: number | null; runs: number; runEndT: number | null; nextRunT: number | null; blockBefore: boolean } | null;
  rebound: { highSince: number | null; reportedT: number | null; decided: boolean };
  oedema: {
    atRisk: boolean;
    onsetT: number | null;
    resolvedT: number | null;
    oxygenT: number | null;
    sitUpT: number | null;
    furosemideT: number | null;
    nitrateT: number | null;
    cpapT: number | null;
    /** fluid at the last look (mL), to see a bolus from any source */
    fluidSeenMl: number;
  };
  /** session time the learner took the case over (null: the autopilot still has it) */
  learnerFromT: number | null;
  signs: string[];
  decided: string[];
}

export interface HypoResult {
  ok: boolean;
  text: string;
}

export interface HypotensionModule extends CaseSessionModule {
  id: typeof HYPOTENSION_MODULE_ID;
  readonly state: HypotensionState;
  actions: {
    order: (id: HypoOrderId) => HypoResult;
    /** start an infusion or change its rate (rate in the panel unit); line and strength from the panel */
    setPump: (drug: PumpDrug, rate: number, opts?: { line?: "central" | "peripheral"; strength?: number }) => HypoResult;
    stopPump: (drug: PumpDrug) => HypoResult;
    /** the learner names the mechanism (the pearl: empty, failing or dilated; or not real) */
    nameMechanism: (m: HypotensionMechanism) => HypoResult;
    /** the answer to the escalation question: mechanical support (with a device) or more drug */
    escalate: (choice: "support" | "drugs", device?: SupportDevice) => HypoResult;
    /** a scenario starts its cause (the learner has the case from now) */
    startCause: (id: string) => boolean;
    /** the learner takes the case over (a scenario without a cause calls this from its start state) */
    learnerControl: () => void;
    /** the context the haemodynamic tips are written for while the right heart numbers are open (null: none) */
    rhcTipContext: () => LabContext | null;
    /** whether a venous sheath is in (a central line for the pumps and a right heart catheter) */
    centralAvailable: () => boolean;
  };
}

/** The hypotension module of a session, if attached. */
export function hypotensionOf(s: Pick<CaseSession, "mod">): HypotensionModule | undefined {
  return s.mod<HypotensionModule>(HYPOTENSION_MODULE_ID);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmtMin = (s: number) => `${Math.round(s / 6) / 10} min`;

/** How long the right heart numbers stay open for the haemodynamic tips (s; panel setting). */
const RHC_OPEN_S = 600;
/** A check of the line counts for an episode that opens within this long after it (s; panel setting). */
const CONFIRM_WINDOW_S = 300;
/**
 * The treatments this lab offers as orders (Infusions.tsx). A cause none of whose treatments is among
 * them (revascularisation, stopping a drug) is not scored as untreated on the clock; mechanical
 * support is not here because it is offered only as the answer to the escalation question.
 */
const ORDERABLE: readonly CauseTreatment[] = ["fluid", "blood", "control-bleeding", "drain-pericardium", "pace", "atropine", "level-transducer", "zero-transducer", "flush-line"];

export function createSessionModule(): HypotensionModule {
  let s: CaseSession;
  let runCause: CauseRun | null = null;
  let rng: SeededRng | null = null;
  let lastVitals: Vitals | null = null;
  let lowSince: number | null = null;
  let lowOnPressorSince: number | null = null;
  let settledSince: number | null = null;
  /** the last time of each check that the low pressure is real (s), whether or not an episode was open */
  const checksAt: Partial<Record<ConfirmId, number>> = {};
  /** volume moved out of the central circulation a share at a time (the engine's fluid() takes a negative volume within one step) */
  const preloadOuts: { left: number; rate: number }[] = [];
  const preloadOut = (ml: number, overS: number) => preloadOuts.push({ left: ml, rate: ml / Math.max(1, overS) });
  const drainPreload = (h: number) => {
    for (let i = preloadOuts.length - 1; i >= 0; i--) {
      const p = preloadOuts[i];
      const ml = Math.min(p.left, p.rate * h);
      p.left -= ml;
      if (ml > 0) eng().fluid?.(-ml, 1);
      if (p.left <= 1e-6) preloadOuts.splice(i, 1);
    }
  };
  const st: HypotensionState = {
    actions: [],
    note: null,
    cause: null,
    causeTreated: null,
    episodes: [],
    pumps: [],
    boluses: [],
    fluidMl: 0,
    rhc: null,
    inProgress: [],
    mechanismNamed: null,
    escalation: null,
    arrhythmia: null,
    rebound: { highSince: null, reportedT: null, decided: false },
    oedema: { atRisk: false, onsetT: null, resolvedT: null, oxygenT: null, sitUpT: null, furosemideT: null, nitrateT: null, cpapT: null, fluidSeenMl: 0 },
    learnerFromT: null,
    signs: [],
    decided: [],
  };

  const eng = () => s.patient as unknown as HypotensionEnginePort & {
    startNibp?(): void;
    setNibpInterval?(m: number | null): void;
    setOxygen?(lpm: number): void;
    giveDrug?: HypotensionEnginePort["giveDrug"];
  };
  const now = () => round1(s.tS);
  const vitals = (): Vitals => {
    lastVitals = s.patient.vitals();
    return lastVitals;
  };
  const log = (kind: "action" | "nurse" | "attending" | "result" | "patient", text: string) => s.logEntry(kind, text);
  const tel = (kind: string, data: Record<string, unknown>) => s.telemetry.push({ tWall: now(), tPatient: s.patient.clockState().t, kind: `hypotension.${kind}`, data });
  const once = (id: string) => {
    if (st.decided.includes(id)) return false;
    st.decided.push(id);
    return true;
  };
  const decide = (id: string, label: string, correct: boolean, expected: string, given: string, lessonId: string, tipIds: string[], stage = "table") => {
    if (st.learnerFromT === null) return;
    // a verdict scored again in a later episode (the confirm and the drug) stays wrong once wrong, as
    // caseSession.decideOnce: the ledger replaces a record with the same id
    const prev = s.decisions().find((d) => d.id === id);
    if (prev && !prev.correct) return;
    s.decide({ id, stage, label, correct, expected, given, lessonId, tipIds });
  };
  const cause = () => hypotensionCause(st.cause?.id);
  const weight = () => s.profile.weightKg;

  // -------------------------------------------------------------------------
  // who has the case (as modules/emergencies.ts: the autopilot plays a scenario to its start first)
  // -------------------------------------------------------------------------

  const STARTS = ["chart", "access", "sheath-in", "post-diagnostic", "closure", "recovery"] as const;
  const stageNow = (): (typeof STARTS)[number] => {
    if (s.closureDone()) return "recovery";
    if (s.sheath && s.labsDone.length > 0) return s.catheter?.inBody ? "post-diagnostic" : "closure";
    if (s.sheath) return "sheath-in";
    if (s.timeOutDone && s.local.given) return "access";
    return "chart";
  };
  const learnerHasCase = (): boolean => {
    if (st.learnerFromT !== null) return true;
    const start = s.startStage ?? "chart";
    if (start === "chart" || STARTS.indexOf(stageNow()) >= STARTS.indexOf(start)) st.learnerFromT = now();
    return st.learnerFromT !== null;
  };

  // -------------------------------------------------------------------------
  // what the operator sees
  // -------------------------------------------------------------------------

  /** The mean on the monitor: the line in the aorta, else the last cuff (null: none). */
  const shownMean = (v: Vitals): number | null => (v.tipState === "aortic" && v.art ? v.art.mean : v.nibp ? v.nibp.mean : null);
  /** The systolic the team reads: the line in the aorta, else the cuff, else the cuff it would read. */
  const shownSys = (v: Vitals): number => (v.tipState === "aortic" && v.art ? v.art.sys : v.nibp ? v.nibp.sys : v.aortaTrue.sys);

  const centralAvailable = (): boolean => s.sites.some((x) => x.siteKind === "femoral-vein" && !!x.sheath && !s.siteClosed(x));

  const episode = (): HypoEpisode | undefined => {
    const e = st.episodes[st.episodes.length - 1];
    return e && !e.done ? e : undefined;
  };
  const openEpisode = (): HypoEpisode => {
    // the cause only while it runs: a later low pressure after it has stopped is not credited to it
    const e: HypoEpisode = { onsetT: now(), causeId: st.cause && st.cause.stoppedT === null ? st.cause.id : null, confirm: {}, firstVasoactive: null, causeTreated: null, okSince: null, done: false };
    // the checks made shortly before the episode opened count for it (the learner may check first)
    for (const [k, t] of Object.entries(checksAt) as [ConfirmId, number][]) if (s.tS - t <= CONFIRM_WINDOW_S) e.confirm[k] = round1(t);
    st.episodes.push(e);
    tel("episode", { cause: e.causeId });
    return e;
  };

  // -------------------------------------------------------------------------
  // scoring
  // -------------------------------------------------------------------------

  /** The debrief's phrase for the first drug, from its action in the pump table (a bolus id is its drug). */
  const drugPhrase = (drug: string): string => {
    const action = PUMP_BY_DRUG[drug as PumpDrug]?.action;
    if (action === "vasopressor" || action === "vasopressor-inotrope" || drug === "metaraminol") return "A vasopressor";
    if (action === "inotrope") return "An inotrope";
    return "A vasoactive drug";
  };

  /** The first vasoactive drug of an episode: confirmed first, matched to the cause. */
  const firstVasoactive = (drug: string) => {
    if (st.learnerFromT === null) return;
    const v = lastVitals ?? vitals();
    const mean = shownMean(v);
    const ep = episode() ?? (mean !== null && mean < MP_HYPOTENSION.episodeMapMmHg ? openEpisode() : undefined);
    if (!ep || ep.firstVasoactive) return;
    ep.firstVasoactive = { drug, t: now() };
    const c = hypotensionCause(ep.causeId);
    const checks = Object.keys(ep.confirm) as ConfirmId[];
    if (c?.mechanism === "false-reading") {
      const fix = c.id === "damped-line" ? "flush-line" : "level";
      const fixed = ep.confirm[fix] !== undefined;
      decide(
        "hypotension-confirmed",
        "Confirmed the low pressure was real before a vasoactive drug",
        fixed,
        "Check the line first: zero and level the transducer, flush it, look at the trace, and compare a cuff",
        fixed ? "The line was checked first" : fix === "level" ? `${drugPhrase(drug)} before levelling the transducer` : `${drugPhrase(drug)} before flushing the line`,
        "pm-monitoring-pressure",
        REAL_TIPS
      );
      decide("hypotension-bridge-drug", "Drug for the low pressure", false, c.bridge.expected, `${PUMP_BY_DRUG[drug as PumpDrug]?.label ?? drug} for a false reading`, "pm-monitoring-pressure", REAL_TIPS);
      return;
    }
    decide(
      "hypotension-confirmed",
      "Confirmed the low pressure was real before a vasoactive drug",
      checks.length > 0,
      "Check the line first: zero and level the transducer, flush it, look at the trace, and compare a cuff",
      checks.length ? `Checked first (${checks.join(", ")})` : `${drugPhrase(drug)} with no check of the line`,
      "pm-monitoring-pressure",
      REAL_TIPS
    );
    if (!c) return;
    const label = PUMP_BY_DRUG[drug as PumpDrug]?.label ?? drug;
    if (c.bridge.causeFirst && !ep.causeTreated && !st.causeTreated) {
      decide("hypotension-bridge-drug", "Drug for the low pressure", false, c.bridge.expected, `${label} before the cause was treated`, c.lessonId, MATCH_TIPS);
      return;
    }
    const verdict = isVasoactive(drug) || drug === "metaraminol" ? bridgeVerdict(c, drug as never) : { verdict: "wrong" as const, why: c.bridge.otherwise };
    decide("hypotension-bridge-drug", "Drug for the low pressure", verdict.verdict !== "wrong", c.bridge.expected, verdict.verdict === "wrong" ? `${label}: ${verdict.why}` : label, c.lessonId, c.id === "hcm-vasodilator" ? HCM_TIPS : MATCH_TIPS);
  };

  /** Credit a treatment of the scenario's cause: on the open episode, and once for the case. */
  const creditCause = (what: CauseTreatment, label = what.replace(/-/g, " ")) => {
    const c = cause();
    if (!c || !st.cause || !c.treatments.includes(what)) return;
    const ep = episode();
    if (ep && !ep.causeTreated) ep.causeTreated = { what, t: now() };
    if (st.causeTreated) return;
    st.causeTreated = { what, t: now() };
    const from = ep?.onsetT ?? st.cause.startedT;
    if (once("cause-treated")) decide("hypotension-cause-treated", "Treated the cause of the low pressure", true, c.treatment, `${label} at ${fmtMin(now() - from)}`, c.lessonId, MATCH_TIPS);
  };

  /** A treatment applied to the patient: the cause's script answers it, and it is credited if it treats the cause. */
  const causeTreatment = (what: CauseTreatment) => {
    const answers = runCause?.treat(eng(), what) ?? false;
    creditCause(what);
    return answers;
  };

  // -------------------------------------------------------------------------
  // orders
  // -------------------------------------------------------------------------

  const record = (id: HypoAction["id"], text: string) => {
    st.actions.push({ id, t: now(), text });
    log("action", text);
    tel("order", { id });
  };
  const refuse = (text: string): HypoResult => {
    st.note = text;
    return { ok: false, text };
  };
  const done = (text: string): HypoResult => {
    st.note = text;
    return { ok: true, text };
  };
  const later = (what: HypotensionState["inProgress"][number]["what"], afterS: number, label: string) => {
    st.inProgress.push({ what, at: s.tS + afterS, label });
  };
  const confirmCheck = (id: ConfirmId) => {
    checksAt[id] = s.tS;
    const ep = episode();
    if (ep && ep.confirm[id] === undefined) ep.confirm[id] = now();
  };

  const saline = (ml: number) => {
    eng().fluid?.(ml, MP_HYPOTENSION.salineOverS);
    st.fluidMl += ml;
    record(`saline-${ml}` as HypoOrderId, `Saline ${ml} mL IV, fast.`);
    causeTreatment("fluid");
    return done(`${ml} mL running in.`);
  };

  const order = (id: HypoOrderId): HypoResult => {
    if (!s) return refuse("No case.");
    const e = eng();
    switch (id) {
      case "cuff": {
        e.startNibp?.();
        e.setNibpInterval?.(1);
        confirmCheck("cuff");
        record(id, "Cuff pressure now, then every minute.");
        later("cuff", MP_HYPOTENSION.orderS.cuff, "Cuff measuring");
        return done("Cuff measuring.");
      }
      case "zero":
      case "level":
      case "flush-line": {
        if (s.busy) return refuse("Wait for the step in hand to finish.");
        if (id === "zero") s.zero();
        else if (id === "level") s.level();
        else s.flushLine();
        confirmCheck(id);
        record(id, HYPO_ORDER_BY_ID[id].label + ".");
        causeTreatment(id === "zero" ? "zero-transducer" : id === "level" ? "level-transducer" : "flush-line");
        return done("Done.");
      }
      case "check-trace": {
        const r = s.checkTrace();
        if (!r) return refuse("No catheter is connected to the manifold.");
        confirmCheck("check-trace");
        st.actions.push({ id, t: now(), text: "Looked at the trace." });
        return done(`Aortic pressure ${r.displayed} mmHg.`);
      }
      case "rhc": {
        const central = centralAvailable();
        record(id, central ? "Right heart catheter through the venous sheath." : "Right heart numbers asked for (no venous sheath).");
        if (central) {
          later("rhc", MP_HYPOTENSION.orderS.rhc, "Right heart catheter");
          return done("Right heart catheter going in.");
        }
        readRhc(false);
        return done(st.rhc!.note);
      }
      case "saline-250":
        return saline(250);
      case "saline-500":
        return saline(500);
      case "saline-1000":
        return saline(1000);
      case "blood-unit": {
        e.fluid?.(MP_HYPOTENSION.bloodUnitMl, MP_HYPOTENSION.bloodUnitS);
        st.fluidMl += MP_HYPOTENSION.bloodUnitMl;
        record(id, "One unit of red cells running.");
        causeTreatment("blood");
        return done("Blood running.");
      }
      case "control-bleeding":
      case "drain-pericardium":
      case "pace": {
        if (st.inProgress.some((p) => p.what === id)) return refuse("Already under way.");
        const sec = id === "control-bleeding" ? MP_CAUSES.controlS : id === "drain-pericardium" ? MP_CAUSES.drainS : MP_CAUSES.paceS;
        record(id, id === "control-bleeding" ? "Compression above the puncture; the vascular team called." : id === "drain-pericardium" ? "Pericardiocentesis set up under echo." : "Temporary pacing wire through a femoral vein.");
        later(id, sec, HYPO_ORDER_BY_ID[id].label);
        // timed from the order: the team has started on the cause
        creditCause(id, HYPO_ORDER_BY_ID[id].label);
        return done("Under way.");
      }
      case "atropine": {
        if (!e.giveDrug?.("atropine", ATROPINE_BLOCK_MG, "iv").ok) return refuse("Atropine could not be given.");
        record(id, `Atropine ${ATROPINE_BLOCK_MG} mg IV.`);
        causeTreatment("atropine");
        return done("Atropine given.");
      }
      case "phenylephrine-50":
      case "phenylephrine-100": {
        const ug = id === "phenylephrine-50" ? PRESSOR_DOSES.phenylephrineBolusUg[0] : PRESSOR_DOSES.phenylephrineBolusUg[1];
        if (!e.giveDrug?.("phenylephrine", ug, "iv").ok) return refuse("Phenylephrine could not be given.");
        st.boluses.push({ drug: "phenylephrine", dose: ug, t: now() });
        record(id, `Phenylephrine ${ug} µg IV.`);
        firstVasoactive("phenylephrine");
        return done("Given.");
      }
      case "oxygen": {
        e.setOxygen?.(MP_HYPOTENSION.oxygenLpm);
        st.oedema.oxygenT = st.oedema.oxygenT ?? now();
        record(id, `Oxygen ${MP_HYPOTENSION.oxygenLpm} L/min by mask.`);
        return done("Oxygen on.");
      }
      case "sit-up": {
        if (st.oedema.sitUpT !== null) return refuse("The patient is already sitting up.");
        st.oedema.sitUpT = now();
        preloadOut(MP_HYPOTENSION.sitUpMl, MP_HYPOTENSION.sitUpS);
        record(id, "Sat up as far as the table allows.");
        return done("Sitting up.");
      }
      case "furosemide-80":
      case "furosemide-100": {
        const mg = id === "furosemide-80" ? OEDEMA.furosemideMg[0] : OEDEMA.furosemideMg[1];
        if (!e.giveDrug?.("furosemide", mg, "iv").ok) return refuse("Furosemide could not be given.");
        st.oedema.furosemideT = st.oedema.furosemideT ?? now();
        record(id, `Furosemide ${mg} mg IV.`);
        return done("Given.");
      }
      case "cpap": {
        if (st.oedema.cpapT !== null) return refuse("CPAP is already on.");
        st.oedema.cpapT = now();
        e.setOxygen?.(MP_HYPOTENSION.oxygenLpm);
        preloadOut(MP_HYPOTENSION.cpapPreloadMl, MP_HYPOTENSION.cpapOverS);
        record(id, "CPAP by mask.");
        return done("CPAP on.");
      }
    }
    return refuse("Unknown order.");
  };

  /** The right heart numbers now (through a venous sheath, or a modelled reading with its note). */
  const readRhc = (measured: boolean) => {
    const e = eng();
    const rh = e.rightHeart?.();
    if (!rh) return;
    const v = vitals();
    const ci = cardiacIndex(rh.coLMin, s.profile.heightCm, s.profile.weightKg);
    const note = measured
      ? "Right heart catheter numbers."
      : "No venous sheath is in: these are the numbers a right heart catheter would give now (a modelled reading; in the lab a venous sheath comes first).";
    st.rhc = { t: now(), raMmHg: round1(rh.raMmHg), paMeanMmHg: round1(rh.paMeanMmHg), pcwpMmHg: round1(rh.pcwpMmHg), coLMin: Math.round(rh.coLMin * 100) / 100, ci: Math.round(ci * 100) / 100, svrWood: round1(rh.svrWood), hr: v.hr ?? null, measured, note, pattern: classifyRightHeart(rh, s.profile, v.hr ?? null) };
    log("result", `RA ${Math.round(rh.raMmHg)}, PA mean ${Math.round(rh.paMeanMmHg)}, wedge ${Math.round(rh.pcwpMmHg)} mmHg; cardiac output ${st.rhc.coLMin} L/min (index ${st.rhc.ci}); SVR ${st.rhc.svrWood} Wood units.`);
    tel("rhc", { measured, mechanism: st.rhc.pattern.mechanism });
  };

  // -------------------------------------------------------------------------
  // infusions
  // -------------------------------------------------------------------------

  const setPump = (drug: PumpDrug, rate: number, opts: { line?: "central" | "peripheral"; strength?: number } = {}): HypoResult => {
    if (!s) return refuse("No case.");
    const spec = PUMP_BY_DRUG[drug];
    if (!spec) return refuse("Not on this pump list.");
    if (!(rate > 0)) return refuse("No rate.");
    const e = eng();
    if (!e.startInfusion) return refuse("No infusion pump.");
    const prev = st.pumps.find((p) => p.drug === drug);
    const line = opts.line ?? prev?.line ?? (centralAvailable() ? "central" : "peripheral");
    const strength = opts.strength ?? prev?.strength ?? spec.strengths[0];
    const v = vitals();
    e.startInfusion({ drug, rate: engineRate(spec, rate, weight()), site: line });
    const mlPerHour = pumpMlPerHour(spec, rate, strength, weight());
    if (prev) {
      if (rate < prev.rate) prev.reducedT = now();
      prev.rate = rate;
      prev.maxRate = Math.max(prev.maxRate, rate);
      prev.line = line;
      prev.strength = strength;
      prev.mlPerHour = mlPerHour;
      record(`pump-${drug}`, `${spec.label} ${rate} ${spec.unit} (${mlPerHour} mL/h).`);
    } else {
      st.pumps.push({ drug, rate, strength, mlPerHour, line, startedT: now(), maxRate: rate, reducedT: null });
      record(`pump-${drug}`, `${spec.label} infusion started at ${rate} ${spec.unit} (${strength} ${spec.strengthUnit}, ${mlPerHour} mL/h), ${line}.`);
      if (drug === "dobutamine" && once("dobutamine-start")) {
        const d = dobutamineStartVerdict(rate);
        decide("dobutamine-start", "Dobutamine starting dose", d.correct, "Start low within the ESC 2021 range of 2-20 µg/kg/min and uptitrate under monitoring", d.given, PRESSORS_LESSON, MATCH_TIPS);
      }
      if (isVasoactive(drug)) {
        if (once("pressor-line")) {
          const l = lineVerdict(line, centralAvailable());
          decide("pressor-line", "Line for the vasoactive infusion", l.correct, "A central line if possible (Brilakis 3.6)", l.given, PRESSORS_LESSON, MATCH_TIPS);
        }
        firstVasoactive(drug);
      }
      // scored as the oedema nitrate only while oedema is present (a nitrate for ischaemia in an at-risk patient is not)
      if (drug === "gtn" && st.oedema.onsetT !== null && st.oedema.resolvedT === null) {
        st.oedema.nitrateT = st.oedema.nitrateT ?? now();
        if (once("oedema-nitrate")) {
          const n = nitrateVerdict(shownSys(v));
          decide("oedema-nitrate", "IV nitrate for pulmonary oedema", n.correct, "IV nitrate only if the systolic is above 100 mmHg", n.given, OEDEMA_LESSON, OEDEMA_TIPS);
        }
      }
    }
    return done(`${spec.label} at ${rate} ${spec.unit}.`);
  };

  const stopPump = (drug: PumpDrug): HypoResult => {
    const i = st.pumps.findIndex((p) => p.drug === drug);
    if (i < 0) return refuse("That pump is not running.");
    eng().stopInfusion?.(drug);
    st.pumps.splice(i, 1);
    record(`pump-${drug}`, `${PUMP_BY_DRUG[drug].label} infusion stopped.`);
    return done("Stopped.");
  };

  const nameMechanism = (m: HypotensionMechanism): HypoResult => {
    const c = cause();
    st.mechanismNamed = { m, t: now() };
    st.actions.push({ id: "name-mechanism", t: now(), text: `Said: ${MECHANISM_WORDS[m].toLowerCase()}.` });
    log("action", `The operator says the mechanism: ${MECHANISM_WORDS[m].toLowerCase()}.`);
    if (c && once("mechanism")) decide("hypotension-mechanism", "Named the mechanism of the low pressure", m === c.mechanism, MECHANISM_WORDS[c.mechanism], MECHANISM_WORDS[m], c.lessonId, PATTERN_TIPS);
    return done("Noted.");
  };

  const escalate = (choice: "support" | "drugs", device?: SupportDevice): HypoResult => {
    const x = st.escalation;
    if (!x) return refuse("Nothing to decide yet.");
    if (x.choice) return refuse("Already decided.");
    x.choice = choice;
    x.device = choice === "support" ? device ?? "impella" : null;
    x.choiceT = now();
    const c = cause();
    st.actions.push({ id: "escalate", t: now(), text: choice === "support" ? "Mechanical support asked for." : "More drug." });
    log("action", choice === "support" ? "Mechanical support asked for; the support team called." : "The doses go up again.");
    // support is the answer only where it treats the cause (ischaemic failure; a case with no scenario
    // cause); tamponade and heart block are drained or paced (the pressors lesson's first step)
    const supportFits = !c || c.treatments.includes("support");
    const right = supportFits ? choice === "support" : false;
    if (choice === "support") causeTreatment("support");
    decide(
      "pressor-escalation",
      "Rising doses: mechanical support or more drug",
      right,
      supportFits ? "Mechanical support rather than ever-higher doses (Brilakis 24.2)" : `Treat the cause: ${c!.treatment.toLowerCase()}`,
      choice === "support" ? "Mechanical support" : "More drug",
      PRESSORS_LESSON,
      ESCALATE_TIPS
    );
    return done(choice === "support" ? "Support asked for." : "Noted.");
  };

  // -------------------------------------------------------------------------
  // watching the patient
  // -------------------------------------------------------------------------

  /** IV fluid in the case so far: this module's, the session orders' and the emergency orders'. */
  const caseFluidMl = (): number => {
    const em = emergenciesOf(s);
    const sessionAndEmergency = em ? em.state.fluidTotalMl : s.orders.filter((o) => o.id === "fluid").reduce((a, o) => a + o.dose, 0);
    return st.fluidMl + sessionAndEmergency;
  };

  const sign = (key: string, kind: "patient" | "nurse", text: string) => {
    if (st.signs.includes(key)) return;
    st.signs.push(key);
    log(kind, text);
  };

  const finishInProgress = () => {
    for (let i = st.inProgress.length - 1; i >= 0; i--) {
      const p = st.inProgress[i];
      if (s.tS < p.at) continue;
      st.inProgress.splice(i, 1);
      if (p.what === "cuff") {
        const v = vitals();
        const c = v.nibp;
        log("result", c ? `Cuff ${Math.round(c.sys)}/${Math.round(c.dia)} (${Math.round(c.mean)}) mmHg.` : "The cuff could not get a reading.");
      } else if (p.what === "rhc") readRhc(true);
      else {
        causeTreatment(p.what);
        log("result", p.what === "control-bleeding" ? "The vascular team has the bleeding site controlled." : p.what === "drain-pericardium" ? "The pericardial drain is in; blood drained." : "The pacing wire captures.");
      }
    }
  };

  const watchEpisode = (v: Vitals) => {
    const t = s.tS;
    const mean = shownMean(v);
    const low = mean !== null && mean < MP_HYPOTENSION.episodeMapMmHg;
    lowSince = low ? lowSince ?? t : null;
    const ep = episode();
    if (!ep && lowSince !== null && t - lowSince >= MP_HYPOTENSION.episodeHoldS && st.learnerFromT !== null) openEpisode();
    const e = episode();
    if (e) {
      const ok = !low && v.aortaTrue.mean >= MP_HYPOTENSION.episodeMapMmHg;
      e.okSince = ok ? e.okSince ?? t : null;
      if (e.okSince !== null && t - e.okSince >= MP_HYPOTENSION.episodeCloseS) {
        e.done = true;
        tel("episode-closed", {});
      }
    }
    // a cause with no treatment for long: scored once, timed from the latest episode's onset, while the
    // episode is open or a vasoactive drug holds the pressure up (the bridge is not the treatment); not
    // once the cause has stopped or been treated in the case, nor for a cause this lab has no order for
    const last = st.episodes[st.episodes.length - 1];
    if (!last) return;
    const c = hypotensionCause(last.causeId);
    const orderable = !!c && c.treatments.some((x) => ORDERABLE.includes(x));
    const held = !last.done || st.pumps.some((p) => isVasoactive(p.drug));
    const running = st.cause !== null && st.cause.id === last.causeId && st.cause.stoppedT === null;
    if (c && orderable && held && running && c.mechanism !== "false-reading" && !last.causeTreated && !st.causeTreated && t - last.onsetT > MP_HYPOTENSION.causeTreatWithinS && once("cause-treated"))
      decide("hypotension-cause-treated", "Treated the cause of the low pressure", false, c.treatment, `Not within ${MP_HYPOTENSION.causeTreatWithinS / 60} minutes of the low pressure`, c.lessonId, MATCH_TIPS);
  };

  const watchPumps = (v: Vitals, h: number) => {
    const t = s.tS;
    const vaso = st.pumps.filter((p) => isVasoactive(p.drug));
    const high = vaso.filter((p) => aboveRange(p.drug, p.rate));
    // escalation: doses above range, two vasoactive drugs, or a low mean that will not lift on a pressor
    lowOnPressorSince = vaso.length && v.aortaTrue.mean < PRESSOR_DOSES.vasopressorMapMmHg ? lowOnPressorSince ?? t : null;
    if (!st.escalation && st.learnerFromT !== null && (high.length || vaso.length >= 2 || (lowOnPressorSince !== null && t - lowOnPressorSince >= MP_HYPOTENSION.escalateLowOnPressorS))) {
      const reason = high.length ? `${PUMP_BY_DRUG[high[0].drug].label} above its range` : vaso.length >= 2 ? "two vasoactive drugs running" : "the pressure will not lift on the pressor";
      st.escalation = { offeredT: now(), reason, choice: null, device: null, choiceT: null };
      log("nurse", `${vaso.map((p) => `${PUMP_BY_DRUG[p.drug].label} ${p.rate} ${PUMP_BY_DRUG[p.drug].unit}`).join(", ")}; the pressure is ${Math.round(shownMean(v) ?? v.aortaTrue.mean)} mean.`);
      const q = "The doses keep going up. What now: more drug, or support?";
      // the attending asks it aloud at the full mentor level (session.say logs it); otherwise it is only logged
      if (!(s.policy.mentor === "full" && s.say(q, "safety"))) log("attending", q);
      tel("escalation-offered", { reason });
    }
    // the high-dose tachyarrhythmia (seeded): non-sustained runs of VT, each MP_HYPOTENSION.arrhythmiaRunS
    // long and recurring every arrhythmiaRunGapS while a drug stays above its range; no further runs once
    // every drug is back in range. A heart block present before a run is restored after it (forcing
    // sinus clears the AV block in the engine).
    const dop = vaso.some((p) => p.drug === "dopamine" && p.rate > PUMP_BY_DRUG.dopamine.range[0] * 2);
    const provoking = high.length > 0 || dop;
    const startRun = (a: NonNullable<HypotensionState["arrhythmia"]>) => {
      a.blockBefore = s.patient.vitals().av === 3;
      a.runEndT = t + MP_HYPOTENSION.arrhythmiaRunS;
      a.nextRunT = null;
      a.runs += 1;
      eng().forceRhythm?.("vt", "high-dose vasoactive infusion");
    };
    const endRun = (a: NonNullable<HypotensionState["arrhythmia"]>) => {
      a.runEndT = null;
      eng().forceRhythm?.("sinus", "run of VT ended");
      if (a.blockBefore) eng().forceRhythm?.("chb", "underlying heart block");
    };
    if (!st.arrhythmia && provoking) {
      rng = rng ?? new SeededRng(`hypotension:${s.seed}`);
      const p = 1 - Math.pow(1 - MP_HYPOTENSION.arrhythmiaPerMin * (dop ? MP_HYPOTENSION.arrhythmiaDopamineFactor : 1), h / 60);
      if (rng.next() < p) {
        const a: NonNullable<HypotensionState["arrhythmia"]> = { t: now(), settleSinceT: null, runs: 0, runEndT: null, nextRunT: null, blockBefore: false };
        st.arrhythmia = a;
        startRun(a);
        log("nurse", "Runs of broad-complex tachycardia on the monitor.");
        tel("arrhythmia", {});
      }
    }
    const a = st.arrhythmia;
    if (a) {
      if (a.runEndT !== null && t >= a.runEndT) {
        endRun(a);
        if (provoking) a.nextRunT = t + MP_HYPOTENSION.arrhythmiaRunGapS;
      }
      if (provoking && a.runEndT === null && a.nextRunT !== null && t >= a.nextRunT) startRun(a);
      if (provoking) a.settleSinceT = null;
      else {
        a.nextRunT = null;
        if (a.settleSinceT === null) a.settleSinceT = t;
      }
      if (a.settleSinceT !== null && t - a.settleSinceT >= MP_HYPOTENSION.arrhythmiaSettleS) {
        if (a.runEndT !== null) endRun(a);
        st.arrhythmia = null;
        log("nurse", "No further runs of broad-complex tachycardia since the doses came down.");
        tel("arrhythmia-settled", { runs: a.runs });
      }
    }
    // rebound: the cause fixed, a pressor still up, the pressure high
    const fixed = st.cause !== null && st.cause.stoppedT !== null;
    const pressorUp = vaso.length > 0;
    const hi = pressorUp && fixed && v.aortaTrue.mean > MP_HYPOTENSION.reboundMapMmHg;
    const r = st.rebound;
    r.highSince = hi ? r.highSince ?? t : null;
    if (hi && r.reportedT === null && r.highSince !== null && t - r.highSince >= MP_HYPOTENSION.reboundHoldS) {
      r.reportedT = now();
      log("nurse", `Pressure ${Math.round(shownSys(v))} systolic, mean ${Math.round(shownMean(v) ?? v.aortaTrue.mean)}, with the infusion running.`);
    }
    if (r.reportedT !== null && !r.decided) {
      const reduced = !pressorUp || vaso.some((p) => p.reducedT !== null && p.reducedT >= r.reportedT!);
      if (reduced || t - r.reportedT > MP_HYPOTENSION.reboundReduceWithinS) {
        r.decided = true;
        decide("pressor-weaned", "Infusions reduced once the cause was fixed", reduced, "Reduce or stop the infusion once the cause is fixed: catecholamines wear off in minutes", reduced ? "Reduced" : "Left running at the dose: rebound hypertension", PRESSORS_LESSON, MATCH_TIPS);
      }
    }
  };

  const watchOedema = (v: Vitals) => {
    const o = st.oedema;
    const t = s.tS;
    o.atRisk = o.atRisk || s.profile.lvef < MP_HYPOTENSION.oedemaRiskLvef || v.lvedp > OEDEMA.lvedpLikelyMmHg;
    const fluid = caseFluidMl();
    const bolus = fluid - o.fluidSeenMl;
    o.fluidSeenMl = fluid;
    // a bolus into a raised filling pressure (the wrong option of the oedema regimen)
    if (st.learnerFromT !== null && o.atRisk && bolus >= MP_HYPOTENSION.bolusMl && v.lvedp > OEDEMA.lvedpLikelyMmHg - 5 && once("oedema-fluid"))
      decide("oedema-fluid", "Fluid in a patient at risk of pulmonary oedema", false, "No fluid bolus with a raised LVEDP: limit contrast and fluid", `A ${Math.round(bolus)} mL bolus with an LVEDP around ${Math.round(v.lvedp)} mmHg`, OEDEMA_LESSON, OEDEMA_TIPS);
    const spo2 = v.spo2 ?? 100;
    // a first onset, or a return after it had settled
    if ((o.onsetT === null || o.resolvedT !== null) && o.atRisk && spo2 < MP_HYPOTENSION.oedemaSpo2 && v.lvedp > OEDEMA.lvedpLikelyMmHg) {
      o.onsetT = now();
      o.resolvedT = null;
      tel("oedema", { lvedp: Math.round(v.lvedp) });
      sign("crackles", "nurse", `Crackles at both lung bases; saturation ${Math.round(spo2)}%.`);
    }
    if (o.onsetT !== null && o.resolvedT === null) {
      if (v.symptoms.dyspnoea >= MP_HYPOTENSION.speakLevel) sign("breathless", "patient", "I can't get my breath lying flat.");
      const settled = spo2 >= MP_HYPOTENSION.oedemaResolvedSpo2 && v.lvedp < MP_HYPOTENSION.oedemaResolvedLvedp;
      settledSince = settled ? settledSince ?? t : null;
      if (settledSince !== null && t - settledSince >= MP_HYPOTENSION.oedemaResolvedHoldS) {
        o.resolvedT = now();
        settledSince = null;
        tel("oedema-resolved", {});
      }
      // the first steps, scored once at five minutes: oxygen, sitting up and a loop diuretic
      if (t - o.onsetT >= 300 && once("oedema-first-steps")) {
        const em = emergenciesOf(s)?.state;
        const oxygen = o.oxygenT !== null || o.cpapT !== null || (em?.oxygenT ?? null) !== null;
        const up = o.sitUpT !== null || !!em?.actions.some((x) => x.id === "sit-up");
        const diuretic = o.furosemideT !== null;
        const missing = [!oxygen && "oxygen", !up && "sitting up", !diuretic && "a loop diuretic"].filter(Boolean) as string[];
        decide("oedema-first-steps", "First steps for pulmonary oedema", missing.length === 0, "High-flow oxygen, sit up and IV furosemide 80-100 mg; nitrate only if the systolic is above 100 mmHg; CPAP", missing.length ? `Missing within 5 min: ${missing.join(", ")}` : "Oxygen, sitting up and furosemide", OEDEMA_LESSON, OEDEMA_TIPS);
      }
    }
  };

  const watch = (h: number) => {
    const v = vitals();
    learnerHasCase();
    if (runCause) {
      runCause.tick(eng(), h);
      if (st.cause && st.cause.stoppedT === null && runCause.stopped()) {
        st.cause.stoppedT = now();
        tel("cause-stopped", { id: st.cause.id });
      }
    }
    drainPreload(h);
    finishInProgress();
    watchEpisode(v);
    watchPumps(v, h);
    watchOedema(v);
  };

  const startCause = (id: string): boolean => {
    const c = hypotensionCause(id);
    if (!s || !c) return false;
    const r = c.start(eng());
    if (!r) return false;
    runCause = r;
    st.cause = { id, startedT: now(), stoppedT: null };
    if (st.learnerFromT === null) st.learnerFromT = now();
    tel("cause", { id, mechanism: c.mechanism });
    return true;
  };

  /** The context the haemodynamic tips are written for while the right heart numbers are open (null: none). */
  const rhcTipContext = (): LabContext | null => {
    if (!s || !st.rhc || s.tS - st.rhc.t > RHC_OPEN_S) return null;
    const ev: LabEvent[] = [];
    if (episode()) ev.push("hypotension");
    if (st.oedema.onsetT !== null && st.oedema.resolvedT === null) ev.push("pulmonary-oedema");
    return { lab: "haemo", phase: "right-heart", events: ev };
  };

  const mod: HypotensionModule = {
    id: HYPOTENSION_MODULE_ID,
    state: st,
    attach(session) {
      s = session;
    },
    slowTick(h) {
      if (!s) return;
      watch(h);
    },
    onHook(hook: SessionHook) {
      void hook;
    },
    /** the right heart numbers' haemodynamic context while they are open (the case tips panel merges it) */
    tipContexts() {
      const c = rhcTipContext();
      return c ? [c] : [];
    },
    events() {
      if (!s) return [];
      const out: LabEvent[] = [];
      const v = lastVitals;
      const mean = v ? shownMean(v) : null;
      if (episode() && mean !== null && mean < MP_HYPOTENSION.episodeMapMmHg) out.push("hypotension");
      const o = st.oedema;
      if (o.onsetT !== null && o.resolvedT === null) out.push("pulmonary-oedema");
      if (o.atRisk && st.learnerFromT !== null && caseFluidMl() + (v?.contrast.totalMl ?? 0) >= MP_HYPOTENSION.atRiskLoadMl) out.push("high-contrast-volume");
      return out;
    },
    actions: {
      order,
      setPump,
      stopPump,
      nameMechanism,
      escalate,
      startCause,
      learnerControl: () => {
        if (s && st.learnerFromT === null) st.learnerFromT = now();
      },
      rhcTipContext,
      centralAvailable: () => (s ? centralAvailable() : false),
    },
  };
  return mod;
}
