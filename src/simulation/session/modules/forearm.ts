// ---------------------------------------------------------------------------
// Full-case session module 'forearm' (access-cx-forearm).
//
// A forearm haematoma after radial access, graded and managed by its grade,
// and compartment syndrome escalated at once (lessons cm-access-complications-
// radial-bleeding and pm-engaging-spasm). The model and the grading rules are
// pure functions in src/simulation/access/forearm.ts with their sources; the
// bedside card is in src/ui/access/panels/RecoveryPanel.tsx.
//
// Where an episode comes from: a scenario (scenarios/forearm.ts) configures the
// source (the blood already in the forearm, its rate, an infusion running, the
// nurse's call, and in one case the time the compartment signs appear) and its
// onset after the learner takes over. The module bleeds the patient itself (the
// stressed share of the loss into the engine, as the session does for its own
// bleeds), so the measures the learner takes change the growth. A case whose
// scenario configures nothing is unchanged: no episode, nothing attached to the
// engine, no decision, no event; the forearm haematomas the session's own risk
// model draws are the ward's (proc-recovery-ward), as before.
//
// How it is found: the learner looks at the forearm or measures it; the nurse's
// site check on the ward's schedule (a set with the site in it, taken while the
// swelling is palpable: the module notes what the nurse felt beside that set, so
// skipped checks let it grow unseen); the patient complains once it is large;
// or the nurse calls at onset when the scenario says so. Compartment signs are
// reported by the patient (severe pain, numb fingers) when they appear.
//
// What the learner does: looks (the extent, the feel, the hand's colour,
// pulses, movement and sensation, passive finger extension), measures the
// circumference at fixed marks against the other arm, names the grade, and
// treats: the band moved over the hole or a second band, ice, a sling,
// analgesia, blood pressure control, stopping an antiplatelet infusion, heparin
// reversal (the session's protamine order, dosed by the learner), a light
// compressive bandage, an arm cuff (pressure, a plan to let it down and a finger
// saturation probe), the operator told, and the vascular surgeons called. The
// cuff's two accepted schemes are cycled as set (Bertrand's is let down every
// 15 minutes); a cuff at or above systolic shuts off the hand (the finger trace
// is lost). Taking the band off while the haematoma grows takes the pressure off
// the hole.
//
// The decisions (ledger, stage 'recovery'; written only once the learner has
// the case): the grade named against the truth at the time; the cuff against
// the two schemes; the chart's treatment for the highest grade reached (I-IV),
// written when the haematoma stops growing (or when it goes on to compartment
// syndrome through continued growth, or MP_FOREARM.treatmentVerdictAfterS after
// it was found if neither has happened, or it had stopped before it was found);
// the circumference measured more than once (right at the second set, wrong only
// at that deadline or at compartment signs from growth); the band kept on while
// it grew; and, once the compartment signs are reported, the surgeons called at
// once (within MP_FOREARM.callWithinS, or already called before the signs) and
// no further compression (right at the call or in theatre if nothing pressed on
// the forearm after the signs). Once the signs are there the measures no longer
// slow the growth. The surgeons arrive after MP_FOREARM.surgeonsArriveS and take the
// arm to theatre for fasciotomy.
//
// Nothing on the live screen names the grade or the problem: the card shows
// what is seen, felt and measured; the truth is in the ledger and the debrief.
//
// Tips: once found the module reports 'haematoma' (events), which opens the
// case's access contexts at the radial site (closure in the recovery workspace,
// and complication: access-cx-forearm-haematoma-grade, access-radial-band-
// bleeding), and its own access complication context (tipContexts) with
// 'haematoma', and 'limb-ischaemia' while the compartment signs are present
// (access-cx-compartment-call), so the call tip is among the first the panel
// shows. `raises` declares both for the reachability report.
//
// While a recovery time-lapse runs, a finding (and the compartment signs) holds
// it (session.holdLapse; the clock runs at the wall clock) until the learner
// treats or calls, or the haematoma stops growing, or the arm is in theatre. A
// swelling found after it has stopped growing, and signs that appear after the
// surgeons were called, do not hold it.
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { InfusionDrug } from "../../patient/pharmacology";
import type { CaseSession } from "../caseSession";
import type { CaseSessionModule } from "./index";
import {
  BERTRAND_CHART,
  COMPRESSION_MEASURES,
  CUFF_EXPECTED,
  GRADE_LABEL,
  MEASURE_LABEL,
  MP_FOREARM,
  chartTreatmentText,
  circumferences,
  forearmExamText,
  forearmExtentCm,
  forearmGrade,
  forearmGrowthMlMin,
  gradeCompartmentResponse,
  gradeForearmCuff,
  gradeForearmTreatment,
  stepForearmSource,
  type CircMark,
  type CuffGrade,
  type CuffSetting,
  type ForearmGrade,
  type ForearmMeasure,
  type ForearmSource,
} from "../../access/forearm";
import type { EasyGrade } from "../../access/closure";
import { MP_WARD } from "../ward";

export const FOREARM_MODULE_ID = "forearm";

/** What this module reports: 'haematoma' once found; 'limb-ischaemia' (its own context) with the compartment signs. */
export const FOREARM_EVENTS = ["haematoma", "limb-ischaemia"] as const satisfies readonly LabEvent[];

/** What this module can report (the reachability report reads it): the radial closure and complication contexts. */
export const raises: readonly LabRaises[] = [{ lab: "access", phases: ["closure", "complication"], events: FOREARM_EVENTS, routes: ["radial"] }];

const LESSON = "cm-access-complications-radial-bleeding";
const T_GRADE = ["access-cx-forearm-haematoma-grade", "access-radial-band-bleeding"];
const T_CALL = ["access-cx-compartment-call"];
const MEASURED_EXPECTED = "Measure the forearm and arm circumference repeatedly, against the other arm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A scenario's forearm haematoma (scenario settings: MODEL PARAMETERS of the scenario unless cited there). */
export interface ForearmConfig {
  /** blood already in the forearm when it presents (mL) */
  initialMl: number;
  /** the source's own rate (mL/min) */
  sourceMlMin: number;
  /** the source stops on its own at this volume (mL), if set */
  capMl?: number;
  /** minutes after the learner takes over that it begins */
  onsetAfterMin: number;
  /** what the nurse says when it begins (a call): without it the learner or the ward's site check finds it */
  report?: string;
  /** the compartment signs appear this long after onset (min), whatever the volume */
  compartmentAfterMin?: number;
  /** an intravenous antiplatelet infusion running at onset (the scenario starts it) */
  infusion?: Extract<InfusionDrug, "cangrelor" | "eptifibatide" | "tirofiban">;
}

export type ForearmFoundBy = "look" | "site-check" | "report" | "call";

export interface ForearmAction {
  id: ForearmMeasure | "look" | "measure" | "grade" | "cuff-off" | "bp" | "finger-sat";
  t: number;
  text: string;
}

export interface ForearmCuffState {
  setting: CuffSetting;
  sysAtSetMmHg: number;
  grade: CuffGrade;
  appliedT: number;
  /** inflated now (Bertrand's cuff is let down for MP_FOREARM.cuffDeflatedS every 15 minutes) */
  inflated: boolean;
  /** when the inflated or deflated phase ends (s), or null for a cuff that stays up */
  phaseUntil: number | null;
}

export interface ForearmEpisode {
  onsetT: number;
  source: ForearmSource;
  /** the source's rate now, after the measures (mL/min; truth, for the debrief) */
  rateMlMin: number;
  foundT: number | null;
  foundBy: ForearmFoundBy | null;
  /** the highest grade reached (truth) */
  maxGrade: EasyGrade;
  /** the compartment signs appeared (s), and how: from continued growth or the scenario's time */
  compartmentT: number | null;
  compartmentBy: "growth" | "scripted" | null;
  surgeonsCalledT: number | null;
  fasciotomyT: number | null;
  /** the measures in place now (a cuff only while it is on) */
  inPlace: ForearmMeasure[];
  /** every learner action, in order */
  actions: ForearmAction[];
  measurements: { t: number; marks: CircMark[] }[];
  graded: { t: number; grade: ForearmGrade; truth: EasyGrade }[];
  cuff: ForearmCuffState | null;
  /** the radial band came off while the haematoma was still growing */
  bandOffWhileGrowing: boolean;
  /** what the nurse felt at each ward set with the site in it (index into session.ward.sets) */
  siteNotes: Record<number, string>;
  /** what the nurse and the patient said about the arm, in order (the card shows them) */
  calls: { t: number; text: string }[];
}

export interface ForearmState {
  config: ForearmConfig | null;
  episode: ForearmEpisode | null;
  pendingOnsetT: number | null;
  learnerFromT: number | null;
  infusionRunning: ForearmConfig["infusion"] | null;
  decided: string[];
  note: string | null;
}

export interface ForearmResult {
  ok: boolean;
  text: string;
}

export interface ForearmModule extends CaseSessionModule {
  id: typeof FOREARM_MODULE_ID;
  readonly state: ForearmState;
  actions: {
    /** a scenario's haematoma (its start state) */
    configure: (cfg: ForearmConfig) => void;
    /** the learner has the case from now (a scenario's start state calls it) */
    learnerControl: () => void;
    /** look at the forearm and hand */
    look: () => ForearmResult;
    /** measure the circumference at the marks, with the other arm */
    measure: () => ForearmResult;
    /** the learner names the grade */
    nameGrade: (g: ForearmGrade) => ForearmResult;
    /** a measure (not the cuff or heparin reversal, which have their own actions) */
    apply: (m: Exclude<ForearmMeasure, "cuff" | "reverse-heparin">) => ForearmResult;
    reverseHeparin: (protamineMg: number) => ForearmResult;
    cuff: (c: CuffSetting) => ForearmResult;
    cuffOff: () => ForearmResult;
    /** the cuff pressure on the other arm, and the finger saturation of this hand */
    bloodPressure: () => ForearmResult;
    fingerSat: () => ForearmResult;
    /** the swelling's volume now (truth, for tests and the debrief; the card never shows it) */
    volumeMl: () => number;
    /** the grade now (truth, for tests and the debrief) */
    gradeNow: () => EasyGrade;
    /** the compartment signs are present now (before fasciotomy) */
    compartmentSigns: () => boolean;
  };
}

/** The forearm module of a session, if attached. */
export function forearmOf(s: Pick<CaseSession, "mod">): ForearmModule | undefined {
  return s.mod<ForearmModule>(FOREARM_MODULE_ID);
}

type EnginePort = {
  fluid?(ml: number, overS?: number): void;
  stopInfusion?(drug: InfusionDrug): void;
};

const round1 = (x: number) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------

export function createSessionModule(): ForearmModule {
  let s: CaseSession = null as unknown as CaseSession;
  let held = false;
  let setsSeen = 0;
  /** a cuff was put up by an accepted scheme during the episode */
  let cuffAccepted = false;

  const st: ForearmState = { config: null, episode: null, pendingOnsetT: null, learnerFromT: null, infusionRunning: null, decided: [], note: null };

  const now = () => round1(s.tS);
  const eng = () => s.patient as unknown as EnginePort;
  const log = (kind: "action" | "nurse" | "result" | "patient", text: string) => s.logEntry(kind, text);
  const learner = () => st.learnerFromT !== null && !s.teamSetup;
  const ep = () => st.episode;
  const touch = () => {
    if (st.learnerFromT === null && !s.teamSetup) st.learnerFromT = now();
  };
  const sys = () => s.patient.vitals().aortaTrue.sys;
  const truthGrade = (): EasyGrade => {
    const e = ep();
    if (!e) return 0;
    return forearmGrade(e.source.ml, signsNow());
  };
  const signsNow = () => {
    const e = ep();
    return !!e && e.compartmentT !== null && e.fasciotomyT === null;
  };

  /** A decision written once (a wrong one stays), only while the learner has a haematoma in hand. */
  const decide = (id: string, label: string, correct: boolean, expected: string, given: string, tipIds: string[] = T_GRADE) => {
    if (!learner() || !ep()) return;
    const prev = s.decisions().find((d) => d.id === id);
    if (prev && !prev.correct) return;
    s.decide({ id, stage: "recovery", label, correct, expected, given, lessonId: LESSON, tipIds });
    if (!st.decided.includes(id)) st.decided.push(id);
  };
  const decidedYet = (id: string) => st.decided.includes(id);

  const done = (text: string): ForearmResult => {
    st.note = text;
    return { ok: true, text };
  };
  const refuse = (text: string): ForearmResult => {
    st.note = text;
    return { ok: false, text };
  };
  const record = (id: ForearmAction["id"], text: string) => {
    const e = ep();
    if (e) e.actions.push({ id, t: now(), text });
  };
  /** A line from the nurse or the patient about the arm: in the case log and on the card. */
  const bedside = (kind: "nurse" | "patient", text: string) => {
    log(kind, text);
    ep()?.calls.push({ t: now(), text });
  };
  const holdOn = () => {
    if (!held && s.holdLapse(FOREARM_MODULE_ID)) held = true;
  };
  const letGo = () => {
    if (held) {
      held = false;
      s.releaseLapse(FOREARM_MODULE_ID);
    }
  };

  /** The radial band of the working radial site, if any. */
  const band = () => s.sites.find((x) => !!x.closure.radial && x.closure.radial.sheathOut)?.closure.radial ?? null;
  const antiplatelet = () => st.infusionRunning != null || (s.patient.vitals().antithrombotic?.gpi ?? 0) > 0.05;

  // -------------------------------------------------------------------------
  // onset, growth and the findings
  // -------------------------------------------------------------------------

  const startEpisode = () => {
    const cfg = st.config;
    if (!cfg || st.episode) return;
    // a note from before the onset ('soft and not swollen') does not survive into the episode
    st.note = null;
    const e: ForearmEpisode = {
      onsetT: now(),
      source: { ml: Math.max(0, cfg.initialMl), capMl: cfg.capMl ?? null, sealedAt: null, lowSince: null },
      rateMlMin: cfg.sourceMlMin,
      foundT: null,
      foundBy: null,
      maxGrade: 0,
      compartmentT: null,
      compartmentBy: null,
      surgeonsCalledT: null,
      fasciotomyT: null,
      inPlace: [],
      actions: [],
      measurements: [],
      graded: [],
      cuff: null,
      bandOffWhileGrowing: false,
      siteNotes: {},
      calls: [],
    };
    st.episode = e;
    e.maxGrade = forearmGrade(e.source.ml);
    if (e.source.ml > 0) eng().fluid?.(-e.source.ml * MP_FOREARM.stressedShare, 60);
    setsSeen = s.ward.sets.length;
    if (cfg.report) {
      bedside("nurse", cfg.report);
      find("call");
    }
  };

  const find = (by: ForearmFoundBy) => {
    const e = ep();
    if (!e || e.foundT !== null) return;
    e.foundT = now();
    e.foundBy = by;
    // a swelling that has already stopped growing has nothing to hold the lapse for
    if (by !== "look" && e.source.sealedAt === null) holdOn();
  };

  const siteText = (ml: number) => {
    const cm = Math.round(forearmExtentCm(ml));
    return signsNow()
      ? `Tense swelling of the forearm about ${cm} cm from the puncture; the hand is pale and the patient is in severe pain.`
      : `Swelling of the wrist and forearm, about ${cm} cm from the puncture.`;
  };

  /** The ward's sets taken since the last step: a site check finds a palpable swelling (and notes what it felt). */
  const readWardSets = () => {
    const e = ep();
    const sets = s.ward.sets;
    for (; setsSeen < sets.length; setsSeen++) {
      const set = sets[setsSeen];
      if (!e || !set.kinds.includes("site") || set.atS < e.onsetT - 0.05 || e.source.ml < MP_WARD.palpableMl) continue;
      const text = siteText(e.source.ml);
      e.siteNotes[setsSeen] = text;
      if (e.foundT === null) {
        bedside("nurse", `Site check: ${text}`);
        find("site-check");
      }
    }
  };

  /** The cuff's phase: Bertrand's cycle (up for its interval, down for MP_FOREARM.cuffDeflatedS). */
  const stepCuff = () => {
    const c = ep()?.cuff;
    if (!c || c.phaseUntil === null || s.tS < c.phaseUntil) return;
    const every = c.setting.deflateEveryMin;
    if (every === null) return;
    c.inflated = !c.inflated;
    c.phaseUntil = s.tS + (c.inflated ? every * 60 : MP_FOREARM.cuffDeflatedS);
  };

  const cuffNow = (): "below" | "above" | null => {
    const c = ep()?.cuff;
    if (!c || !c.inflated) return null;
    return c.setting.mmHg >= sys() ? "above" : "below";
  };

  const slowTick = (h: number) => {
    if (st.config && st.pendingOnsetT !== null && s.tS >= st.pendingOnsetT) {
      st.pendingOnsetT = null;
      startEpisode();
    }
    const e = ep();
    if (!e) return;
    stepCuff();
    const b = band();
    if (b && b.bandOffAt !== null && e.source.sealedAt === null && e.fasciotomyT === null && !e.bandOffWhileGrowing) {
      e.bandOffWhileGrowing = true;
      if (e.foundT !== null)
        decide("forearm-band-kept", "The band kept on while the forearm haematoma was growing", false, "Keep the band on (move it or add a second) while the haematoma grows; it comes off once the bleeding has stopped", "The band was taken off while it was still growing");
    }
    // once the compartment signs are there, compression, pain relief and pressure control no longer stop it
    // (forearm.ts): only the fasciotomy does
    const signs = signsNow();
    const measures = new Set<ForearmMeasure>(signs ? [] : e.inPlace);
    const rate =
      e.fasciotomyT !== null
        ? 0
        : forearmGrowthMlMin({ sourceMlMin: st.config!.sourceMlMin, actS: s.patient.vitals().actTrue, antiplatelet: antiplatelet(), sysMmHg: sys(), measures, cuff: signs ? null : cuffNow(), bandOff: !!b && b.bandOffAt !== null });
    e.rateMlMin = e.source.sealedAt !== null ? 0 : round1(rate);
    const wasSealed = e.source.sealedAt !== null;
    const add = e.fasciotomyT !== null ? 0 : stepForearmSource(e.source, h, s.tS, rate);
    if (add > 0) eng().fluid?.(-add * MP_FOREARM.stressedShare, 1);
    const g = forearmGrade(e.source.ml, signsNow());
    if (g > e.maxGrade) e.maxGrade = g;
    // the compartment signs: continued growth past the compartment volume, or the scenario's time
    if (e.compartmentT === null && e.fasciotomyT === null) {
      const byGrowth = e.source.sealedAt === null && e.source.ml >= MP_FOREARM.compartmentMl;
      const cfgAfter = st.config!.compartmentAfterMin;
      const scripted = cfgAfter !== undefined && s.tS - e.onsetT >= cfgAfter * 60;
      if (byGrowth || scripted) {
        e.compartmentT = now();
        e.compartmentBy = byGrowth ? "growth" : "scripted";
        e.maxGrade = 5;
        bedside("patient", "The patient cries out with pain in the forearm; the fingers feel numb and tingling, and the hand looks pale.");
        find("report");
        if (e.surgeonsCalledT !== null) {
          // the surgeons were already called (on the swelling and the pain before the full signs): the call stands
          decide("forearm-compartment-call", "Compartment syndrome signs: the vascular surgeons called at once", true, "Call the vascular surgeons at once for emergency fasciotomy", "Already called before the signs", T_CALL);
        } else holdOn();
        if (byGrowth && e.foundT !== null) {
          treatmentVerdict("went on growing");
          measuredVerdict();
        }
      }
    }
    // the patient complains of a large swelling
    if (e.foundT === null && e.source.ml >= MP_WARD.reportMl) {
      bedside("patient", `The patient complains of a painful, tight swelling of the forearm. ${siteText(e.source.ml)}`);
      find("report");
    }
    readWardSets();
    // the haematoma stops growing: the chart's treatment is scored
    if (!wasSealed && e.source.sealedAt !== null && e.compartmentT === null) {
      // only guided mode says so: otherwise the learner finds it out by looking or measuring again
      if (s.mode === "guided") log("result", "The swelling has stopped getting bigger.");
      treatmentVerdict("stopped");
      letGo();
    }
    // long after it was found: a haematoma still growing has its treatment scored as it stands, and one that had
    // stopped before it was found (sealing found nobody to score) is scored now
    if (e.foundT !== null && e.compartmentT === null && s.tS - e.foundT >= MP_FOREARM.treatmentVerdictAfterS) treatmentVerdict(e.source.sealedAt !== null ? "stopped" : "still growing");
    // measured only once (or never) long after it was found, or after it stopped if that came later
    if (e.foundT !== null && e.compartmentT === null && !decidedYet("forearm-measured") && s.tS - Math.max(e.foundT, e.source.sealedAt ?? e.foundT) >= MP_FOREARM.treatmentVerdictAfterS) measuredVerdict();
    // the call window after the signs
    if (e.compartmentT !== null && e.surgeonsCalledT === null && s.tS - e.compartmentT > MP_FOREARM.callWithinS && !decidedYet("forearm-compartment-call"))
      decide("forearm-compartment-call", "Compartment syndrome signs: the vascular surgeons called at once", false, "Call the vascular surgeons at once for emergency fasciotomy", `Not called within ${Math.round(MP_FOREARM.callWithinS / 60)} min of the signs`, T_CALL);
    // the surgeons arrive
    if (e.surgeonsCalledT !== null && e.fasciotomyT === null && s.tS - e.surgeonsCalledT >= MP_FOREARM.surgeonsArriveS) {
      if (e.compartmentT !== null) {
        e.fasciotomyT = now();
        e.source.sealedAt ??= now();
        // nothing pressed on the forearm between the signs and theatre (a compression is scored wrong when given)
        if (!decidedYet("forearm-no-compression-after-signs") && !gradeCompartmentResponse(compartmentActions(), e.compartmentT, now()).compressedAfter)
          decide("forearm-no-compression-after-signs", "Compartment syndrome signs: no further compression", true, "Once the signs are there, compression no longer helps: call the vascular surgeons at once", "No further compression", T_CALL);
        e.inPlace = [];
        if (e.cuff) e.cuff = null;
        st.note = "The vascular surgeons examine the arm and take the patient to theatre for fasciotomy.";
        log("result", st.note);
        letGo();
      } else if (!e.actions.some((a) => a.id === "call-surgeons" && a.text.startsWith("Reviewed"))) {
        st.note = "The vascular surgeons review the arm: no sign of compartment syndrome now; they ask to be called again if it changes.";
        log("result", st.note);
        e.actions.push({ id: "call-surgeons", t: now(), text: "Reviewed by the vascular surgeons" });
        e.surgeonsCalledT = null;
      }
    }
  };

  /** The chart's treatment for the highest grade reached before any compartment signs (I-IV), and the measurements. */
  const treatmentVerdict = (how: "stopped" | "still growing" | "went on growing") => {
    const e = ep();
    if (!e || e.foundT === null || decidedYet("forearm-treatment")) return;
    const g = Math.min(4, Math.max(1, e.maxGrade === 5 ? forearmGrade(e.source.ml) : e.maxGrade)) as ForearmGrade;
    const doneSet = new Set<ForearmMeasure>(e.actions.filter((a) => typeof a.id === "string" && a.id in MEASURE_LABEL).map((a) => a.id as ForearmMeasure));
    const tg = gradeForearmTreatment(g, doneSet, cuffAccepted);
    const missing = tg.missing.length ? `missing: ${tg.missing.join(", ")}` : "";
    const given =
      how === "went on growing"
        ? `It went on growing to compartment signs${missing ? `; ${missing}` : ""}`
        : how === "still growing"
          ? `Still growing ${Math.round(MP_FOREARM.treatmentVerdictAfterS / 60)} min after it was found${missing ? `; ${missing}` : ""}`
          : missing
            ? missing[0].toUpperCase() + missing.slice(1)
            : "The chart's treatment for the grade";
    // the chart's treatment given counts, whether or not this haematoma has stopped yet; one that went on to
    // compartment syndrome was not stopped in time
    decide("forearm-treatment", "Forearm haematoma: treated by its grade", tg.correct && how !== "went on growing", tg.expected, given);
  };

  /**
   * The circumference measured repeatedly: right at the second set (measure); wrong only at its deadline (slowTick)
   * or when the haematoma goes on to compartment signs, so a set taken after treatment to confirm it has stopped counts.
   */
  const measuredVerdict = () => {
    const e = ep();
    if (!e || e.foundT === null || decidedYet("forearm-measured")) return;
    const n = e.measurements.length;
    decide("forearm-measured", "Forearm haematoma: the circumference measured repeatedly", n >= 2, MEASURED_EXPECTED, n ? `Measured ${n} time${n > 1 ? "s" : ""}` : "Not measured");
  };

  /** The learner's measures so far, for gradeCompartmentResponse. */
  const compartmentActions = () => (ep()?.actions ?? []).filter((a): a is ForearmAction & { id: ForearmMeasure } => a.id in MEASURE_LABEL);
  // -------------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------------

  /** A measure that presses on the forearm after the compartment signs: wrong. */
  const checkCompressionAfterSigns = (m: ForearmMeasure) => {
    const e = ep();
    if (!e || !signsNow() || e.compartmentT === null || !COMPRESSION_MEASURES.includes(m)) return;
    decide(
      "forearm-no-compression-after-signs",
      "Compartment syndrome signs: no further compression",
      false,
      "Once the signs are there, compression no longer helps: call the vascular surgeons at once",
      `${MEASURE_LABEL[m]} after the signs`,
      T_CALL
    );
  };

  const look = (): ForearmResult => {
    touch();
    const e = ep();
    const text = forearmExamText(e ? e.source.ml : 0, signsNow());
    log("action", "Looked at the forearm and hand.");
    log("result", text);
    if (e) {
      record("look", text);
      find("look");
    }
    return done(text);
  };

  const measure = (): ForearmResult => {
    touch();
    const e = ep();
    const marks = circumferences(e ? e.source.ml : 0, s.profile.bmi);
    const text = marks.map((m) => `${m.label}: ${m.cm.toFixed(1)} cm (other arm ${m.otherCm.toFixed(1)} cm)`).join("; ");
    log("action", "Measured the forearm and arm circumference at the marks, against the other arm.");
    log("result", `${text}.`);
    if (e) {
      e.measurements.push({ t: now(), marks });
      record("measure", text);
      find("look");
      if (e.measurements.length >= 2) measuredVerdict();
    }
    return done(text);
  };

  const nameGrade = (g: ForearmGrade): ForearmResult => {
    touch();
    const e = ep();
    if (!e || e.foundT === null) return refuse("Look at the forearm first.");
    const truth = truthGrade();
    e.graded.push({ t: now(), grade: g, truth });
    record("grade", `Grade ${GRADE_LABEL[g]}`);
    log("action", `Forearm haematoma graded ${GRADE_LABEL[g]} in the notes.`);
    const t = truth === 0 ? 1 : (truth as ForearmGrade);
    decide("forearm-grade", "Forearm haematoma: the grade named", g === truth, `Grade ${GRADE_LABEL[t]}: ${BERTRAND_CHART[t].extent.toLowerCase()} (${chartTreatmentText(t).replace(/^Grade [IV]+: /, "")})`, `Grade ${GRADE_LABEL[g]}`);
    return done(`Graded ${GRADE_LABEL[g]}.`);
  };

  const RESULT: Partial<Record<ForearmMeasure, string>> = {
    "reposition-band": "The band is moved up over the arterial hole and re-inflated.",
    "second-band": "A second band is placed hard against the proximal edge of the first and inflated.",
    ice: "Ice in a bag, wrapped in a washcloth, on the swelling.",
    sling: "The arm is raised in a sling.",
    analgesia: "Analgesia given as charted.",
    "bp-control": "The blood pressure is brought down as charted.",
    bandage: "A light compressive bandage is wrapped around the forearm and arm.",
    inform: "The operator is told and comes to see the arm.",
  };

  const apply = (m: Exclude<ForearmMeasure, "cuff" | "reverse-heparin">): ForearmResult => {
    touch();
    const e = ep();
    if (!e || e.foundT === null) return refuse("Look at the forearm first.");
    if (e.fasciotomyT !== null) return refuse("The arm is in theatre.");
    if (m === "call-surgeons") return callSurgeons();
    if (m === "stop-infusion") {
      const d = st.infusionRunning;
      if (!d) {
        record(m, "No infusion running");
        log("action", "Asked to stop any antiplatelet or anticoagulant infusion.");
        log("result", "No infusion is running.");
        return done("No infusion is running.");
      }
      eng().stopInfusion?.(d);
      st.infusionRunning = null;
      if (!e.inPlace.includes(m)) e.inPlace.push(m);
      record(m, MEASURE_LABEL[m]);
      log("action", `${MEASURE_LABEL[m]}.`);
      letGo();
      return done("The infusion is stopped.");
    }
    // a band that is off cannot be moved or doubled: refused, and nothing pressed on the forearm
    if ((m === "reposition-band" || m === "second-band") && band()?.bandOffAt != null) return refuse("The band is off.");
    checkCompressionAfterSigns(m);
    if (!e.inPlace.includes(m) && m !== "inform") e.inPlace.push(m);
    record(m, MEASURE_LABEL[m]);
    log("action", `${MEASURE_LABEL[m]}.`);
    // the learner is acting on it: a held recovery lapse goes back on the clock
    letGo();
    const r = RESULT[m];
    if (r) log("result", r);
    return done(r ?? MEASURE_LABEL[m]);
  };

  const callSurgeons = (): ForearmResult => {
    const e = ep()!;
    const t = now();
    record("call-surgeons", MEASURE_LABEL["call-surgeons"]);
    log("action", "Called the vascular surgeons to see the arm now.");
    if (e.surgeonsCalledT === null) e.surgeonsCalledT = t;
    if (e.compartmentT !== null && e.fasciotomyT === null) {
      const r = gradeCompartmentResponse(compartmentActions(), e.compartmentT, t);
      decide(
        "forearm-compartment-call",
        "Compartment syndrome signs: the vascular surgeons called at once",
        r.callCorrect === true,
        "Call the vascular surgeons at once for emergency fasciotomy",
        `Called ${Math.round((t - e.compartmentT) / 6) / 10} min after the signs`,
        T_CALL
      );
      if (!r.compressedAfter) decide("forearm-no-compression-after-signs", "Compartment syndrome signs: no further compression", true, "Once the signs are there, compression no longer helps: call the vascular surgeons at once", "No further compression", T_CALL);
    }
    letGo();
    log("result", "The vascular surgeons are on their way.");
    return done("The vascular surgeons are on their way.");
  };

  const reverseHeparin = (mg: number): ForearmResult => {
    touch();
    const e = ep();
    if (!e || e.foundT === null) return refuse("Look at the forearm first.");
    const g = s.giveProtamine(mg, "slow");
    if (!g || g.refused) return refuse("Protamine not given.");
    if (!e.inPlace.includes("reverse-heparin")) e.inPlace.push("reverse-heparin");
    record("reverse-heparin", `Protamine ${g.givenMg} mg slowly`);
    letGo();
    return done(`Protamine ${g.givenMg} mg given slowly.`);
  };

  const cuff = (c: CuffSetting): ForearmResult => {
    touch();
    const e = ep();
    if (!e || e.foundT === null) return refuse("Look at the forearm first.");
    if (e.fasciotomyT !== null) return refuse("The arm is in theatre.");
    if (!(c.mmHg > 0)) return refuse("Set the cuff pressure.");
    checkCompressionAfterSigns("cuff");
    const sysNow = Math.round(sys());
    const grade = gradeForearmCuff(c, sysNow);
    if (grade.correct) cuffAccepted = true;
    const every = c.deflateEveryMin;
    e.cuff = { setting: { ...c }, sysAtSetMmHg: sysNow, grade, appliedT: now(), inflated: true, phaseUntil: every === null ? null : s.tS + every * 60 };
    if (!e.inPlace.includes("cuff")) e.inPlace.push("cuff");
    const plan = every === null ? "no plan to let it down" : `let down every ${every} min`;
    record("cuff", `Arm cuff at ${Math.round(c.mmHg)} mmHg, ${plan}${c.fingerSat ? ", finger saturation watched" : ""}`);
    log("action", `Arm cuff inflated to ${Math.round(c.mmHg)} mmHg, ${plan}${c.fingerSat ? ", a saturation probe on a finger" : ""}.`);
    letGo();
    if (!signsNow())
      decide(
        "forearm-cuff",
        "Arm cuff for the forearm haematoma: pressure and plan",
        grade.correct,
        CUFF_EXPECTED,
        `${Math.round(c.mmHg)} mmHg with a systolic of ${sysNow} mmHg, ${plan}${c.fingerSat ? ", finger saturation watched" : ", no finger saturation"}${grade.reasons.length ? ` (${grade.reasons.join(" ")})` : ""}`,
        ["access-cx-forearm-haematoma-grade", "access-cx-compartment-call"]
      );
    return done(`Cuff up at ${Math.round(c.mmHg)} mmHg.`);
  };

  const cuffOff = (): ForearmResult => {
    const e = ep();
    if (!e?.cuff) return refuse("No cuff is on.");
    e.cuff = null;
    e.inPlace = e.inPlace.filter((m) => m !== "cuff");
    record("cuff-off", "Cuff let down and taken off");
    log("action", "Arm cuff let down and taken off.");
    return done("Cuff off.");
  };

  const bloodPressure = (): ForearmResult => {
    touch();
    const v = s.patient.vitals();
    const text = `Cuff pressure on the other arm ${Math.round(v.aortaTrue.sys)}/${Math.round(v.aortaTrue.dia)} mmHg, pulse ${v.hr === null ? "-" : Math.round(v.hr)}.`;
    record("bp", text);
    log("result", text);
    return done(text);
  };

  const fingerSat = (): ForearmResult => {
    touch();
    const e = ep();
    const v = s.patient.vitals();
    let text: string;
    if (cuffNow() === "above") text = "No trace from the finger probe on this hand while the cuff is up.";
    else if (signsNow()) text = `A weak, flattened trace from the finger probe; saturation ${v.spo2 === null ? "unreadable" : `${Math.round(v.spo2)}%`}.`;
    else text = `A good trace from the finger probe; saturation ${v.spo2 === null ? "unreadable" : `${Math.round(v.spo2)}%`}.`;
    if (e) record("finger-sat", text);
    log("result", text);
    return done(text);
  };

  // -------------------------------------------------------------------------
  // events and tip contexts
  // -------------------------------------------------------------------------

  const events = (): readonly LabEvent[] => (ep()?.foundT != null ? ["haematoma"] : []);

  const tipContexts = (): readonly LabContext[] => {
    const e = ep();
    if (!e || e.foundT === null) return [];
    return [{ lab: "access", phase: "complication", route: "radial", events: signsNow() ? ["haematoma", "limb-ischaemia"] : ["haematoma"] }];
  };

  const mod: ForearmModule = {
    id: FOREARM_MODULE_ID,
    state: st,
    attach(session) {
      s = session;
      return () => {
        letGo();
      };
    },
    slowTick,
    events,
    tipContexts,
    actions: {
      configure: (cfg) => {
        st.config = { ...cfg };
        st.infusionRunning = cfg.infusion ?? null;
        st.pendingOnsetT = s.tS + Math.max(0, cfg.onsetAfterMin) * 60;
        if (cfg.onsetAfterMin <= 0) {
          st.pendingOnsetT = null;
          startEpisode();
        }
      },
      learnerControl: () => {
        st.learnerFromT = now();
      },
      look,
      measure,
      nameGrade,
      apply,
      reverseHeparin,
      cuff,
      cuffOff,
      bloodPressure,
      fingerSat,
      volumeMl: () => ep()?.source.ml ?? 0,
      gradeNow: truthGrade,
      compartmentSigns: signsNow,
    },
  };
  return mod;
}
