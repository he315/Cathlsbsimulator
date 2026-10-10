// ---------------------------------------------------------------------------
// Full-case session module 'emergencies' (proc-anaphylaxis-vagal).
//
// The anaphylaxis order set, the vasovagal reaction with its look-alikes, and
// vagal prevention at puncture, sheath insertion and sheath removal, all
// treated through orders (src/ui/access/orders/Emergency.tsx). The doses,
// windows and rules are in ../emergencies.ts with their sources; what this
// module adds is the case: it watches the patient, keeps the record of what
// was ordered and when, applies each order to the engine (whose physiology
// gives the consequences) and writes the decisions to the ledger.
//
// Consequences come from the patient, not fixed rules:
//   - IM adrenaline acts within minutes and wears off, so a reaction that
//     persists needs the repeat dose at 5 minutes; capillary leak empties the
//     circulation, so fluid matters; the airway component answers to
//     salbutamol only in part (responses.ts);
//   - antihistamine and steroid first leave the reaction to deepen until the
//     adrenaline comes (their rescue is small: pharmacology.ts antiAllergic);
//   - atropine in a tachycardic reaction adds to the tachycardia, and in the
//     pre-arrest presentation lifts the rate only in part;
//   - more contrast during the reaction raises its peak (the engine's
//     emergency course, turned on here for the full case only);
//   - IV adrenaline 1 mg with a pulse gives the formulary's severe
//     hypertension and VT drive (a critical error as well);
//   - an infusion above MP_EMERGENCIES.infusionExcessUgMin gives a
//     tachyarrhythmia after infusionTachyAfterS, which settles
//     infusionSettleS after the rate is brought down or the pump stopped
//     (a rate raised again stops it settling);
//   - vagal prevention scales the engine's vagal draws (local anaesthetic as a
//     dose with its timing at puncture and sheath insertion, in every case:
//     an adequate local that has had time to act leaves the draw as before);
//     atropine and fluid drawn up beforehand are given in seconds rather than
//     the time an order takes;
//   - the sheath-removal vagal draw (saline running lowers it) and its scored
//     preparation (saline running with atropine or fluid ready before a
//     femoral sheath comes out under manual compression) are armed by the
//     scenarios that teach them (armRemovalDrill, from a scenario script), so
//     a random case's sheath removal behaves as before;
//   - a vasovagal reaction that has not responded a few minutes after its
//     treatment is reported by the nurse as numbers (never as a diagnosis),
//     and a look for a mimic (echo, a bleeding check) is scored; so is a
//     fast-rate hypotension after the sheath has come out.
// Nothing on the live screen names the reaction: the record shows what was
// ordered; the truth is in the ledger and the debrief.
//
// The engine's emergency course is turned on at attach (contrast escalation
// and the vagal vasodilator lag); a random case's reaction incidence is
// unchanged (only scenarios force a reaction), and the sheath-removal draw
// uses its own generator in the engine. The local anaesthetic scaling at
// puncture and sheath insertion changes no draw by itself, but a vagal onset
// it adds takes the onset's further draws from the engine's generator, so a
// seed's later draws can shift in a case without an effective local.
//
// In the live lab (session.lapseHoldsOn) a faint, a reaction or a fast-rate
// hypotension that begins during a femoral compression, band or recovery
// time-lapse pauses it (session.holdLapse): the learner meets the emergency at
// the wall clock with the orders open, and the lapse runs on once the patient
// has been out of the low range for MP_EMERGENCY_LAPSE.resumeAfterRecoveredS
// (a reaction is held at least through its IM window, a faint from its onset
// for at least that long). A session built for a
// test or played by the autopilot keeps the lapse running through, so an
// episode that passes inside it is reported as numbers, as before. Its lines
// go through session.say() and session.logEntry().
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { Vitals } from "../../patient/engine";
import type { CaseSession } from "../caseSession";
import type { SessionHook } from "../scenarios/index";
import type { CaseSessionModule } from "./index";
import {
  ANAPHYLAXIS,
  EMERGENCY_ORDER_BY_ID,
  MP_EMERGENCIES,
  classifyTryptase,
  echoFinding,
  emergencyEngine,
  localAdequacy,
  localRange,
  reactionPersists,
  type EmergencyActionId,
  type TryptaseVerdict,
} from "../emergencies";

export const EMERGENCIES_MODULE_ID = "emergencies";

/**
 * MODEL PARAMETER (a session setting, not a clinical value): a time-lapse held for an emergency goes back
 * on the clock once the patient has been out of the low range (heart rate at or above
 * MP_EMERGENCIES.symptomaticHr and mean pressure at or above MP_EMERGENCIES.persistMapMmHg) for this long, s.
 */
export const MP_EMERGENCY_LAPSE = { resumeAfterRecoveredS: 60 };

/** The local anaesthetic's onset in the session (s): the session's MP_SESSION.localOnsetS (caseSession.ts), kept in step (a module imports the session as a type only). */
const LOCAL_ONSET_S = 45;

/** The events this module reports (the reaction's signs, the slowing and the low pressure of an episode it is following). */
export const EMERGENCY_EVENTS = ["contrast-reaction", "hypotension", "bradycardia"] as const satisfies readonly LabEvent[];

/** What this module can report, for every lab the case shows tips for (the reachability report reads it). */
export const raises: readonly LabRaises[] = (["access", "diagnostic", "pci"] as const).map((lab) => ({ lab, phases: [], events: EMERGENCY_EVENTS }));

const ANAPHYLAXIS_LESSON = "pm-lab-drugs-contrast-reactions";
const VAGAL_LESSON = "cm-patient-complications-vasovagal";
const TAMPONADE_LESSON = "cm-perforation-tamponade";
const ANA_TIPS = ["diag-anaphylaxis-im-adrenaline", "pci-anaphylaxis-im-adrenaline"];
const DISCRIMINATE_TIPS = ["diag-reaction-or-vagal"];
const VAGAL_TIPS = ["access-vasovagal-or-tamponade"];
const PREVENT_TIPS = ["access-vagal-prevention"];

/** One order as the record keeps it. */
export interface EmergencyAction {
  id: EmergencyActionId;
  t: number;
  text: string;
}

export interface VagalEpisode {
  /** session time of the onset */
  t: number;
  trigger: string;
  /** HR below MP_EMERGENCIES.symptomaticHr or MAP below 65 within MP_EMERGENCIES.vagalSymptomaticWithinS (null: not yet known) */
  symptomatic: boolean | null;
  /** the first treatment (atropine, fluid, legs raised) and when */
  firstAction: { id: EmergencyActionId; t: number } | null;
  /** the nurse's no-response line, when it was said */
  noResponseT: number | null;
  /** a look for a mimic (echo, bleeding check) after the line */
  lookT: number | null;
  done: boolean;
  /**
   * when the learner could first act on it at the wall clock (the onset, or the end of a time-lapse
   * it began in; null: not yet). The treatment window runs from here.
   */
  liveT: number | null;
  /** the lowest heart rate and MAP seen during it */
  lowHr: number | null;
  lowMap: number | null;
  /** closed without scoring: it began before the learner had the case, or passed within a time-lapse */
  unscored: boolean;
}

export interface EmergenciesState {
  actions: EmergencyAction[];
  /** the last result line (shown under the orders) */
  note: string | null;
  reaction: {
    /** session time of the first signs (null: none yet) */
    onsetT: number | null;
    resolvedT: number | null;
    preArrest: boolean;
    firstDrug: { id: EmergencyActionId; t: number } | null;
    imT: number[];
    ivBolusT: number[];
    atropineT: number[];
    fluidMl: number;
    stoppedT: number | null;
    contrastAfterOnsetMl: number;
    tryptase: (TryptaseVerdict & { t: number })[];
    referralT: number | null;
    agentT: number | null;
    /** the decisions already made for this reaction */
    decided: string[];
  };
  infusion: { rate: number; startedT: number; excessSinceT: number | null } | null;
  /**
   * The excessive infusion's tachyarrhythmia (kept apart from the pump, so stopping the infusion
   * settles it too): when it began, and since when the rate has been down or the pump off (null: not
   * yet, or the rate went back up).
   */
  infusionTachy: { t: number; settleSinceT: number | null } | null;
  /** crystalloid given through the emergency and session orders, mL */
  fluidTotalMl: number;
  /** the nurse has reported the total passing the lower end of 'up to 3-5 L' */
  fluidTotalReported: boolean;
  helpT: number | null;
  oxygenT: number | null;
  legsUpT: number | null;
  cpr: boolean;
  vagal: VagalEpisode[];
  /** a fast-rate hypotension after the sheath came out: onset, the first action and a look */
  fastHypotension: { t: number; firstAction: EmergencyActionId | null; lookT: number | null; done: boolean; liveT: number | null } | null;
  /** session time the learner took the case over (null: the autopilot still has it) */
  learnerFromT: number | null;
  /** a scripted bleed into the pericardium stops at this volume, mL (null: no cap) */
  pericardiumCapMl: number | null;
  /** the signs already said or seen (each once) */
  signs: string[];
  prevention: {
    /** the local anaesthetic volume given through this module at the working site, mL (null: none) */
    localMl: number | null;
    localT: number | null;
    localSite: "femoral" | "radial" | null;
    salineT: number | null;
    atropineReadyT: number | null;
    fluidReadyT: number | null;
    /** the sheath-removal vagal draw and its scoring are armed (a scenario that teaches them) */
    removalDrill: boolean;
  };
  looks: { id: "echo" | "bleeding-check"; t: number; text: string }[];
}

export interface EmergencyResult {
  ok: boolean;
  text: string;
}

export interface EmergenciesModule extends CaseSessionModule {
  id: typeof EMERGENCIES_MODULE_ID;
  readonly state: EmergenciesState;
  actions: {
    order: (id: EmergencyActionId) => EmergencyResult;
    /** local anaesthetic as a dose (mL) at the working site */
    giveLocal: (ml: number) => EmergencyResult;
    /** the adrenaline infusion at `rate` µg/min (starts it, or changes the rate) */
    setInfusion: (rate: number) => EmergencyResult;
    /** arm the sheath-removal vagal draw and its scoring (a scenario script calls this) */
    armRemovalDrill: () => void;
    /**
     * The learner takes the case over (a scenario's start state calls this once the autopilot has
     * played the case to its start): episodes still open from the autopilot's steps close unscored.
     */
    learnerControl: () => void;
    /** stop a scripted pericardial bleed once the effusion reaches `ml` (a scenario setting) */
    capPericardium: (ml: number) => void;
  };
}

/** The emergencies module of a session, if attached. */
export function emergenciesOf(s: Pick<CaseSession, "mod">): EmergenciesModule | undefined {
  return s.mod<EmergenciesModule>(EMERGENCIES_MODULE_ID);
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const fmtMin = (s: number) => `${Math.round(s / 6) / 10} min`;

export function createSessionModule(): EmergenciesModule {
  let s: CaseSession;
  const st: EmergenciesState = {
    actions: [],
    note: null,
    reaction: { onsetT: null, resolvedT: null, preArrest: false, firstDrug: null, imT: [], ivBolusT: [], atropineT: [], fluidMl: 0, stoppedT: null, contrastAfterOnsetMl: 0, tryptase: [], referralT: null, agentT: null, decided: [] },
    infusion: null,
    infusionTachy: null,
    fluidTotalMl: 0,
    fluidTotalReported: false,
    helpT: null,
    oxygenT: null,
    legsUpT: null,
    cpr: false,
    vagal: [],
    fastHypotension: null,
    prevention: { localMl: null, localT: null, localSite: null, salineT: null, atropineReadyT: null, fluidReadyT: null, removalDrill: false },
    looks: [],
    learnerFromT: null,
    pericardiumCapMl: null,
    signs: [],
  };
  /** session orders already read (s.orders is append-only) */
  let ordersSeen = 0;
  const seenTelemetry = new WeakSet<object>();
  let lowMapSince: number | null = null;
  let lastVitals: Vitals | null = null;
  /** the last session time the rate or the mean pressure was in the low range, and whether this module holds a lapse */
  let lastLowT: number | null = null;
  let holdingLapse = false;

  const eng = () => emergencyEngine(s);
  const now = () => round1(s.tS);
  const vitals = (): Vitals | null => {
    const v = eng().vitals?.() ?? null;
    lastVitals = v;
    return v;
  };
  const siteKind = (): "femoral" | "radial" => (s.access === "femoral" ? "femoral" : "radial");
  const log = (kind: "action" | "nurse" | "attending" | "result" | "patient", text: string) => s.logEntry(kind, text);
  const tel = (kind: string, data: Record<string, unknown>) => s.telemetry.push({ tWall: now(), tPatient: s.patient.clockState().t, kind: `emergency.${kind}`, data });
  const reactionActive = () => st.reaction.onsetT !== null && st.reaction.resolvedT === null;
  const decideOnceFor = (id: string) => {
    if (st.reaction.decided.includes(id)) return false;
    st.reaction.decided.push(id);
    return true;
  };

  // -------------------------------------------------------------------------
  // who has the case: the autopilot plays a scenario to its start stage first
  // -------------------------------------------------------------------------

  const STARTS = ["chart", "access", "sheath-in", "post-diagnostic", "closure", "recovery"] as const;
  /** the stage the case has reached (the autopilot's stageReached, read from the session's public state) */
  const stageNow = (): (typeof STARTS)[number] => {
    if (s.closureDone()) return "recovery";
    if (s.sheath && s.labsDone.length > 0) return s.catheter?.inBody ? "post-diagnostic" : "closure";
    if (s.sheath) return "sheath-in";
    if (s.timeOutDone && s.local.given) return "access";
    return "chart";
  };
  /**
   * The learner has the case: from the scenario's call (learnerControl), else once the case has reached
   * its start stage (a scenario without the call), else from arrival when it opens at the chart.
   */
  const learnerHasCase = (): boolean => {
    if (st.learnerFromT !== null) return true;
    const start = s.startStage ?? "chart";
    if (start === "chart" || STARTS.indexOf(stageNow()) >= STARTS.indexOf(start)) st.learnerFromT = now();
    return st.learnerFromT !== null;
  };
  /** The learner takes over: what the autopilot's steps left open closes unscored. */
  const learnerControl = () => {
    st.learnerFromT = now();
    for (const ep of st.vagal)
      if (!ep.done) {
        ep.done = true;
        ep.unscored = true;
      }
    if (st.fastHypotension && !st.fastHypotension.done) st.fastHypotension.done = true;
    lowMapSince = null;
    pushPrevention();
  };

  /** A sign said or seen once (the patient's words and the nurse's observation; never a diagnosis). */
  const sign = (key: string, kind: "patient" | "nurse", text: string) => {
    if (st.signs.includes(key)) return;
    st.signs.push(key);
    log(kind, text);
  };

  // -------------------------------------------------------------------------
  // vagal prevention
  // -------------------------------------------------------------------------

  /** The prevention the engine scales its vagal draws with, from the record now. */
  const prevention = () => {
    const p = st.prevention;
    const site = siteKind();
    // the autopilot's own steps keep the engine's draws as they were (an adequate local leaves them unscaled)
    if (!learnerHasCase()) return { local: 1, salineRunning: false };
    let local: number;
    if (p.localMl !== null && p.localSite === site) local = localAdequacy(site, p.localMl, p.localT, s.tS, LOCAL_ONSET_S);
    else local = s.local.given && s.tS - s.local.at > LOCAL_ONSET_S ? 1 : 0;
    return { local, salineRunning: p.salineT !== null };
  };
  const pushPrevention = () => eng().setEmergencyModel?.({ prevention: prevention() });

  // -------------------------------------------------------------------------
  // scoring
  // -------------------------------------------------------------------------

  const decide = (id: string, label: string, correct: boolean, expected: string, given: string, lessonId: string, tipIds: string[], stage = "table") => s.decide({ id, stage, label, correct, expected, given, lessonId, tipIds });

  const critical = (id: string, label: string) => {
    if (s.complications.some((c) => c.id === id && c.critical)) return;
    s.criticalErrors++;
    s.complications.push({ id, t: now(), label, severity: "major", critical: true });
    tel("critical", { id, label });
  };

  /** The first drug of the reaction (adrenaline IM is right; anything else is not). */
  const firstDrugOfReaction = (id: EmergencyActionId) => {
    const r = st.reaction;
    if (!reactionActive() || r.firstDrug) return;
    r.firstDrug = { id, t: now() };
    const label = EMERGENCY_ORDER_BY_ID[id]?.label ?? id;
    const why = id === "atropine-0.5" || id === "atropine-1" ? (r.preArrest ? "atropine for a slow rate with skin and airway signs" : "atropine with a tachycardia") : id === "chlorphenamine" || id === "hydrocortisone" ? "antihistamine or steroid before adrenaline" : id === "adrenaline-iv-1mg" ? "the arrest dose with a pulse" : label;
    decide("anaphylaxis-first-drug", "First drug for the reaction", id === "adrenaline-im", "Adrenaline 0.5 mg IM, before anything else", id === "adrenaline-im" ? "Adrenaline IM first" : `First: ${why}`, ANAPHYLAXIS_LESSON, [...ANA_TIPS, ...DISCRIMINATE_TIPS]);
  };

  const scoreImInTime = (givenAt: number | null) => {
    const r = st.reaction;
    if (r.onsetT === null || !decideOnceFor("im-in-time")) return;
    const ok = givenAt !== null && givenAt - r.onsetT <= MP_EMERGENCIES.imWithinS;
    decide(
      "anaphylaxis-adrenaline-in-time",
      "IM adrenaline soon after the reaction began",
      ok,
      `Adrenaline 0.5 mg IM within ${MP_EMERGENCIES.imWithinS / 60} min of the first signs`,
      givenAt === null ? `No IM adrenaline within ${MP_EMERGENCIES.imWithinS / 60} min` : `Given at ${fmtMin(givenAt - r.onsetT)}`,
      ANAPHYLAXIS_LESSON,
      ANA_TIPS
    );
  };

  /** A vagal episode's first treatment (atropine, fluid, legs raised are right; adrenaline is not). */
  const vagalAction = (id: EmergencyActionId) => {
    const ep = currentVagal();
    if (!ep || ep.firstAction || reactionActive()) return;
    ep.firstAction = { id, t: now() };
    const right = id === "atropine-0.5" || id === "atropine-1" || id === "fluid-500" || id === "fluid-1000" || id === "lie-flat-legs-up";
    if (ep.symptomatic !== false)
      decide("vagal-first-treatment", "First treatment of the faint", right, "Legs up, atropine 0.5-1.0 mg IV and fast saline", `First: ${EMERGENCY_ORDER_BY_ID[id]?.label ?? id}`, VAGAL_LESSON, [...VAGAL_TIPS, ...DISCRIMINATE_TIPS]);
  };

  const currentVagal = (): VagalEpisode | undefined => {
    const ep = st.vagal[st.vagal.length - 1];
    return ep && !ep.done ? ep : undefined;
  };

  /** A look for a mimic: an echo or a bleeding check. */
  const noteLook = () => {
    for (const ep of st.vagal) if (ep.noResponseT !== null && ep.lookT === null && !ep.done) {
      ep.lookT = now();
      // timed from the report, or from when the learner could act if the report came during a time-lapse
      const after = Math.max(0, now() - Math.max(ep.noResponseT, ep.liveT ?? now()));
      decide("vagal-reconsider", "Thought again when the faint did not respond", after <= MP_EMERGENCIES.reconsiderWithinS, "An echo or a bleeding check within minutes of no response", `Looked at ${fmtMin(after)} after the no-response report`, VAGAL_LESSON, VAGAL_TIPS);
    }
    const fh = st.fastHypotension;
    if (fh && fh.lookT === null && !fh.done) {
      fh.lookT = now();
      // timed from when the learner could act (a look during the time-lapse is immediate)
      const after = Math.max(0, now() - (fh.liveT ?? now()));
      decide("hypotension-fast-rate-look", "Looked for the cause of a fast-rate hypotension", after <= MP_EMERGENCIES.fastLookWithinS, "An immediate echo or a bleeding check", `Looked at ${fmtMin(after)}`, TAMPONADE_LESSON, VAGAL_TIPS, "closure");
    }
  };

  // -------------------------------------------------------------------------
  // orders
  // -------------------------------------------------------------------------

  const record = (id: EmergencyActionId, text: string) => {
    st.actions.push({ id, t: now(), text });
    log("action", text);
    tel("order", { id });
  };
  const refuse = (text: string): EmergencyResult => {
    st.note = text;
    return { ok: false, text };
  };
  const done = (text: string): EmergencyResult => {
    st.note = text;
    return { ok: true, text };
  };

  /** Give a dose through the engine (refusals come back as text). */
  const drug = (drugId: Parameters<NonNullable<ReturnType<typeof eng>["giveDrug"]>>[0], dose: number, route: "iv" | "im" | "neb"): boolean => {
    const e = eng();
    if (e.giveDrug) return e.giveDrug(drugId, dose, route).ok;
    if (e.give) {
      e.give({ drug: drugId, dose, route });
      return true;
    }
    return false;
  };

  /** Read the session's own orders (the orders panel's atropine, steroid, antihistamine and fluid count too). */
  const ingestOrders = () => {
    for (; ordersSeen < s.orders.length; ordersSeen++) {
      const o = s.orders[ordersSeen];
      // the record shows them with the emergency orders (the session has logged them already)
      const as: EmergencyActionId | null = o.id === "atropine" ? (o.dose >= 1 ? "atropine-1" : "atropine-0.5") : o.id === "chlorphenamine" || o.id === "hydrocortisone" ? o.id : o.id === "fluid" ? "fluid-500" : null;
      if (as) st.actions.push({ id: as, t: round1(o.t), text: `${o.label}.` });
      if (o.id === "atropine") afterAtropine();
      else if (o.id === "chlorphenamine") firstDrugOfReaction("chlorphenamine");
      else if (o.id === "hydrocortisone") firstDrugOfReaction("hydrocortisone");
      else if (o.id === "fluid") afterFluid(o.dose, "fluid-500");
    }
  };

  const afterAtropine = () => {
    if (reactionActive()) {
      st.reaction.atropineT.push(now());
      firstDrugOfReaction("atropine-0.5");
      if (!st.reaction.preArrest && decideOnceFor("atropine-tachycardia"))
        decide("anaphylaxis-no-atropine", "Atropine during a tachycardic reaction", false, "No atropine: it adds to the tachycardia; adrenaline treats the reaction", "Atropine given", ANAPHYLAXIS_LESSON, DISCRIMINATE_TIPS);
    }
    vagalAction("atropine-0.5");
    const fh = st.fastHypotension;
    if (fh && !fh.done && fh.firstAction === null) {
      fh.firstAction = "atropine-0.5";
      decide("hypotension-fast-rate-first", "First step for a fast-rate hypotension", false, "An immediate echo: a fast rate is not vagal", "Atropine first", TAMPONADE_LESSON, VAGAL_TIPS, "closure");
    }
  };

  const afterFluid = (ml: number, id: EmergencyActionId) => {
    if (reactionActive()) st.reaction.fluidMl += ml;
    st.fluidTotalMl += ml;
    // 'up to 3-5 litres in severe shock': the nurse reports the total once it reaches the lower end (no verdict)
    if (!st.fluidTotalReported && st.fluidTotalMl >= ANAPHYLAXIS.fluidUpToMl[0]) {
      st.fluidTotalReported = true;
      log("nurse", `${st.fluidTotalMl} mL of crystalloid given so far.`);
    }
    vagalAction(id);
  };

  /**
   * The time an order takes: added to the session clock when it is idle; during a time-lapse already
   * running (femoral compression, a band) the team gives it in parallel and the lapse absorbs it.
   */
  const wait = (sec: number, label: string) => {
    if (!s.busy) s.wait(sec, label);
  };

  /**
   * An IV drug the session's orders also offer (atropine, antihistamine, steroid): through the session's
   * order when it is idle (so its own record has it), else straight to the patient during a time-lapse.
   */
  const sessionDrug = (id: "atropine" | "chlorphenamine" | "hydrocortisone", mg: number, label: string): boolean => {
    if (!s.busy) {
      if (!s.order(id, mg)) return false;
      ingestOrders();
      return true;
    }
    if (!drug(id, mg, "iv")) return false;
    record(id === "atropine" ? (mg >= 1 ? "atropine-1" : "atropine-0.5") : id, `${label} (during the time-lapse).`);
    if (id === "atropine") afterAtropine();
    else firstDrugOfReaction(id);
    return true;
  };

  const order = (id: EmergencyActionId): EmergencyResult => {
    if (!s) return refuse("No case.");
    ingestOrders();
    ingestVagal(learnerHasCase());
    const e = eng();
    const T = MP_EMERGENCIES.orderS;
    const r = st.reaction;
    // fresh, so a pulse check (the IV arrest dose) sees a rhythm that changed since the last tick
    const v = vitals();
    switch (id) {
      case "stop-contrast": {
        record(id, "Contrast stopped; the injector and the manifold are closed.");
        if (reactionActive() && r.stoppedT === null) r.stoppedT = now();
        wait(T.call, "Stopping the contrast");
        return done("Contrast stopped.");
      }
      case "call-help": {
        if (st.helpT !== null) return refuse("Help is already on the way.");
        st.helpT = now();
        record(id, "Help called: the anaesthetist and the resuscitation team.");
        wait(T.call, "Calling for help");
        return done("The anaesthetist is on the way.");
      }
      case "adrenaline-im": {
        if (!drug("adrenaline", ANAPHYLAXIS.imAdrenalineUg, "im")) return refuse("Adrenaline could not be given.");
        record(id, `Adrenaline ${ANAPHYLAXIS.imAdrenalineUg / 1000} mg IM into the anterolateral thigh.`);
        wait(T.im, "Adrenaline IM");
        if (reactionActive()) {
          r.imT.push(now());
          firstDrugOfReaction(id);
          if (r.imT.length === 1) scoreImInTime(now());
          if (r.imT.length === 2 && decideOnceFor("repeat")) {
            const gap = r.imT[1] - r.imT[0];
            decide("anaphylaxis-repeat-im", "Repeat IM adrenaline when problems persisted", gap >= MP_EMERGENCIES.repeatFromS, "A second IM dose after 5 minutes if problems persist", `Second dose ${fmtMin(gap)} after the first`, ANAPHYLAXIS_LESSON, ANA_TIPS);
          }
        } else {
          const ep = currentVagal();
          if (ep && ep.firstAction === null) vagalAction(id);
        }
        return done("Adrenaline given IM.");
      }
      case "adrenaline-iv-1mg": {
        if (!drug("adrenaline", ANAPHYLAXIS.ivArrestDoseUg, "iv")) return refuse("Adrenaline could not be given.");
        record(id, `Adrenaline ${ANAPHYLAXIS.ivArrestDoseUg / 1000} mg IV bolus.`);
        wait(T.iv, "Adrenaline IV");
        const pulse = v ? v.rhythmKind !== "vf" && v.rhythmKind !== "asystole" : true;
        if (pulse) {
          if (reactionActive()) {
            r.ivBolusT.push(now());
            firstDrugOfReaction(id);
          }
          decide("anaphylaxis-no-iv-arrest-dose", "No IV arrest dose of adrenaline with a pulse", false, "IM adrenaline; IV boluses only in cardiac arrest", "Adrenaline 1 mg IV with a pulse", ANAPHYLAXIS_LESSON, ANA_TIPS);
          critical("adrenaline-iv-pulse", "Adrenaline 1 mg IV given with a pulse");
        }
        return done("Adrenaline given IV.");
      }
      case "chlorphenamine":
      case "hydrocortisone": {
        const mg = id === "chlorphenamine" ? ANAPHYLAXIS.chlorphenamineMg : ANAPHYLAXIS.hydrocortisoneMg;
        const name = id === "chlorphenamine" ? "Chlorphenamine" : "Hydrocortisone";
        if (!sessionDrug(id, mg, `${name} ${mg} mg IV`)) return refuse("The order could not be given now.");
        return done(`${id === "chlorphenamine" ? "Chlorphenamine" : "Hydrocortisone"} given IV.`);
      }
      case "salbutamol": {
        if (!drug("salbutamol", ANAPHYLAXIS.salbutamolMg, "neb")) return refuse("Salbutamol could not be given.");
        record(id, `Salbutamol ${ANAPHYLAXIS.salbutamolMg} mg nebulised.`);
        wait(T.neb, "Nebulised salbutamol");
        return done("Nebuliser running.");
      }
      case "more-contrast": {
        if (!s.catheterInAorta) return refuse("There is no catheter in the aorta to inject through.");
        e.contrast?.(MP_EMERGENCIES.injectionMl, "left");
        record(id, `A further ${MP_EMERGENCIES.injectionMl} mL contrast injection.`);
        wait(T.call, "Injecting");
        if (reactionActive()) {
          r.contrastAfterOnsetMl += MP_EMERGENCIES.injectionMl;
          if (decideOnceFor("contrast")) decide("anaphylaxis-contrast-stopped", "Contrast stopped once the reaction began", false, "Stop the contrast and any other suspect drug", "More contrast injected during the reaction", ANAPHYLAXIS_LESSON, ANA_TIPS);
        }
        return done("Injected.");
      }
      case "oxygen": {
        e.setOxygen?.(MP_EMERGENCIES.oxygenLpm);
        st.oxygenT = st.oxygenT ?? now();
        record(id, `Oxygen ${MP_EMERGENCIES.oxygenLpm} L/min by mask.`);
        wait(T.call, "Oxygen");
        return done("Oxygen on.");
      }
      case "fluid-500":
      case "fluid-1000": {
        const ml = id === "fluid-500" ? ANAPHYLAXIS.fluidBolusMl[0] : ANAPHYLAXIS.fluidBolusMl[1];
        e.fluid?.(ml, MP_EMERGENCIES.bolusOverS);
        const ready = st.prevention.fluidReadyT !== null;
        const total = st.fluidTotalMl + ml;
        record(id, `Crystalloid ${ml} mL as a rapid bolus${total > ml ? ` (${total} mL so far)` : ""}.`);
        wait(ready ? T.ready : T.iv, "Fluid bolus");
        if (ready) st.prevention.fluidReadyT = null;
        afterFluid(ml, id);
        return done(`${ml} mL running in fast.`);
      }
      case "lie-flat-legs-up": {
        if (st.legsUpT !== null) return refuse("The patient is already flat with the legs raised.");
        st.legsUpT = now();
        e.fluid?.(MP_EMERGENCIES.legsUpMl, MP_EMERGENCIES.legsUpS);
        record(id, "Lying flat with the legs raised.");
        wait(T.posture, "Positioning");
        vagalAction(id);
        return done("Flat, legs up.");
      }
      case "sit-up": {
        record(id, "Sat up.");
        st.legsUpT = null;
        wait(T.posture, "Positioning");
        const low = v ? v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg : false;
        if (low && (reactionActive() || currentVagal())) decide("posture-hypotension", "Posture for a hypotensive patient", false, "Lie flat, legs raised (semi-recumbent only if breathing is easier)", "Sat up while hypotensive", reactionActive() ? ANAPHYLAXIS_LESSON : VAGAL_LESSON, reactionActive() ? ANA_TIPS : VAGAL_TIPS);
        return done("Sitting up.");
      }
      case "cuff-cycle": {
        e.startNibp?.();
        e.setNibpInterval?.(1);
        record(id, "Cuff pressure every minute.");
        return done("Cuff cycling every minute.");
      }
      case "cpr-start":
      case "cpr-stop": {
        const on = id === "cpr-start";
        e.setCpr?.(on);
        st.cpr = on;
        record(id, on ? "Chest compressions started." : "Chest compressions stopped.");
        return done(on ? "CPR in progress." : "CPR stopped.");
      }
      case "atropine-0.5":
      case "atropine-1": {
        const mg = id === "atropine-0.5" ? 0.5 : 1;
        if (st.prevention.atropineReadyT !== null) {
          // drawn up beforehand: given in seconds
          if (!drug("atropine", mg, "iv")) return refuse("Atropine could not be given.");
          st.prevention.atropineReadyT = null;
          record(id, `Atropine ${mg} mg IV (drawn up).`);
          wait(T.ready, "Atropine");
          afterAtropine();
          return done("Atropine given.");
        }
        if (!sessionDrug("atropine", mg, `Atropine ${mg} mg IV`)) return refuse("The order could not be given now.");
        return done("Atropine given.");
      }
      case "echo": {
        const vv = vitals();
        const text = echoFinding(vv?.pericardialMl ?? 0, vv?.aortaTrue.mean ?? 90, vv?.losses.bloodMl ?? 0);
        st.looks.push({ id, t: now(), text });
        record(id, "Echo at the bedside.");
        wait(T.echo, "Echo");
        log("result", text);
        noteLook();
        return done(text);
      }
      case "bleeding-check": {
        const vv = vitals();
        const haem = s.activeSite.pm.st.haematomaMl;
        const lost = vv?.losses.bloodMl ?? 0;
        const B = MP_EMERGENCIES.bleedCheck;
        const groin = s.access === "femoral" ? (haem > B.haematomaMl ? "A swelling at the puncture site." : "The groin is soft.") : haem > B.haematomaMl ? "The forearm is swollen at the puncture." : "The forearm is soft.";
        const text = `${groin} ${lost > B.hbFallLossMl ? "The point-of-care haemoglobin has fallen." : "The point-of-care haemoglobin is unchanged."}`;
        st.looks.push({ id, t: now(), text });
        record(id, "Groin, abdomen and haemoglobin checked.");
        wait(T.bleedCheck, "Bleeding check");
        log("result", text);
        noteLook();
        return done(text);
      }
      case "saline-drip": {
        if (st.prevention.salineT !== null) return refuse("Saline is already running.");
        st.prevention.salineT = now();
        e.fluid?.(MP_EMERGENCIES.salineDripMl, MP_EMERGENCIES.salineDripS);
        record(id, `Saline drip running (${MP_EMERGENCIES.salineDripMl} mL).`);
        wait(T.call, "Saline drip");
        pushPrevention();
        return done("Saline running.");
      }
      case "atropine-ready":
      case "fluid-ready": {
        if (id === "atropine-ready") st.prevention.atropineReadyT = now();
        else st.prevention.fluidReadyT = now();
        record(id, id === "atropine-ready" ? "Atropine drawn up and ready." : "A fluid bolus prepared.");
        wait(T.call, "Preparing");
        return done("Ready.");
      }
      case "tryptase": {
        const firstAdr = [...r.imT, ...r.ivBolusT].sort((a, b) => a - b)[0] ?? null;
        const verdict = classifyTryptase(s.tS, r.onsetT, firstAdr, r.resolvedT, r.tryptase.map((x) => x.window));
        r.tryptase.push({ ...verdict, t: now() });
        record(id, "Tryptase sample sent.");
        wait(T.sample, "Tryptase sample");
        decide(`tryptase-${r.tryptase.length}`, "Tryptase sample timed to the reaction", verdict.correct, "First as soon as feasible after treatment; second 1-2 h after onset (no later than 4 h); third at follow-up", verdict.given, ANAPHYLAXIS_LESSON, ANA_TIPS, "recovery");
        return done("Sample sent.");
      }
      case "record-agent": {
        r.agentT = r.agentT ?? now();
        record(id, "Agent and reaction recorded in the notes and the allergy record.");
        wait(T.note, "Recording the reaction");
        if (r.onsetT !== null) decide("anaphylaxis-agent-recorded", "Agent and reaction recorded", true, "The agent and the reaction recorded", "Recorded", ANAPHYLAXIS_LESSON, ANA_TIPS, "recovery");
        return done("Recorded.");
      }
      case "allergy-referral": {
        r.referralT = r.referralT ?? now();
        record(id, "Referred to the allergy clinic (third tryptase at follow-up).");
        wait(T.note, "Allergy referral");
        if (r.onsetT !== null) decide("anaphylaxis-referral", "Allergy clinic referral", true, "Every patient referred to an allergy clinic", "Referred", ANAPHYLAXIS_LESSON, ANA_TIPS, "recovery");
        return done("Referral made.");
      }
      case "adrenaline-infusion":
        return setInfusion(MP_EMERGENCIES.infusionRatesUgMin[0]);
      case "infusion-rate":
        return refuse("Choose a rate.");
      case "infusion-stop": {
        if (!st.infusion) return refuse("No infusion is running.");
        e.stopInfusion?.("adrenaline");
        st.infusion = null;
        // stopping the pump settles its tachyarrhythmia as reducing the rate does
        if (st.infusionTachy && st.infusionTachy.settleSinceT === null) st.infusionTachy.settleSinceT = now();
        record(id, "Adrenaline infusion stopped.");
        return done("Infusion stopped.");
      }
      case "local":
        return giveLocal(localRange(siteKind())[0]);
    }
  };

  const giveLocal = (ml: number): EmergencyResult => {
    if (!s) return refuse("No case.");
    if (s.busy) return refuse("Wait for the step in hand to finish.");
    if (!(ml > 0)) return refuse("No volume.");
    const site = siteKind();
    const p = st.prevention;
    // the session's own record of the local anaesthetic (timing, the 'local-anaesthetic' decision)
    if (!s.local.given) s.order("local");
    p.localMl = (p.localSite === site ? p.localMl ?? 0 : 0) + ml;
    p.localT = p.localT !== null && p.localSite === site ? p.localT : now();
    p.localSite = site;
    record("local", `${ml} mL of local anaesthetic infiltrated at the ${site} site.`);
    pushPrevention();
    return done(`${ml} mL infiltrated.`);
  };

  const setInfusion = (rate: number): EmergencyResult => {
    if (!s) return refuse("No case.");
    if (!(rate > 0)) return refuse("No rate.");
    const e = eng();
    if (!e.startInfusion) return refuse("No infusion pump.");
    const first = !st.infusion;
    e.startInfusion({ drug: "adrenaline", rate });
    const excess = rate > MP_EMERGENCIES.infusionExcessUgMin;
    if (first) st.infusion = { rate, startedT: now(), excessSinceT: excess ? now() : null };
    else {
      const inf = st.infusion!;
      inf.rate = rate;
      if (excess && inf.excessSinceT === null) inf.excessSinceT = now();
      if (!excess) inf.excessSinceT = null;
    }
    // a tachyarrhythmia already running: a rate within range lets it settle, a rate above it again does not
    const tachy = st.infusionTachy;
    if (tachy) {
      if (excess) tachy.settleSinceT = null;
      else if (tachy.settleSinceT === null) tachy.settleSinceT = now();
    }
    record(first ? "adrenaline-infusion" : "infusion-rate", `Adrenaline infusion ${rate} µg/min.`);
    const r = st.reaction;
    if (first && r.onsetT !== null && decideOnceFor("infusion")) {
      const twoDoses = r.imT.length >= ANAPHYLAXIS.refractoryAfterDoses;
      const help = st.helpT !== null;
      decide("anaphylaxis-infusion", "Adrenaline infusion for refractory anaphylaxis", twoDoses && help, "A low-dose infusion with expert help after two failed IM doses", !twoDoses ? `Started after ${r.imT.length} IM dose${r.imT.length === 1 ? "" : "s"}` : help ? "After two doses, with the anaesthetist" : "Without calling for expert help", ANAPHYLAXIS_LESSON, ANA_TIPS);
    }
    if (excess && decideOnceFor("infusion-rate"))
      decide("anaphylaxis-infusion-rate", "Infusion rate", false, `A low-dose infusion (the module's range is 2-10 µg/min); reduce it if tachycardia or arrhythmia appear`, `${rate} µg/min`, ANAPHYLAXIS_LESSON, ANA_TIPS);
    return done(`Infusion at ${rate} µg/min.`);
  };

  // -------------------------------------------------------------------------
  // watching the patient
  // -------------------------------------------------------------------------

  /**
   * Vagal episodes, from the engine's own record of their onset (the session's telemetry). One that
   * began before the learner had the case is the autopilot's and is not kept; a scripted or
   * sheath-removal onset is the drill's own episode, so it closes whatever is still open.
   */
  const ingestVagal = (learner: boolean) => {
    for (let i = s.telemetry.length - 1; i >= 0 && i >= s.telemetry.length - 400; i--) {
      const e = s.telemetry[i];
      if (seenTelemetry.has(e)) break;
      seenTelemetry.add(e);
      if (e.kind !== "patient.vagal" || !learner) continue;
      const trigger = String((e.data as { trigger?: unknown } | undefined)?.trigger ?? "");
      const prev = st.vagal[st.vagal.length - 1];
      if (prev && !prev.done) {
        if (trigger !== "scenario" && trigger !== "sheath-removal") continue;
        prev.done = true;
        if (prev.firstAction === null) prev.unscored = true;
      }
      st.vagal.push({ t: now(), trigger, symptomatic: null, firstAction: null, noResponseT: null, lookT: null, done: false, liveT: s.busy ? null : now(), lowHr: null, lowMap: null, unscored: false });
    }
  };

  const watch = () => {
    ingestOrders();
    const v = vitals();
    if (!v) return;
    const r = st.reaction;
    const t = s.tS;
    // the reaction's first signs (the skin component: the itch and flushing the patient reports)
    if (r.onsetT === null && v.reaction.skin > 0) {
      r.onsetT = now();
      r.preArrest = !!eng().reactionPreArrest?.();
      tel("reaction", { preArrest: r.preArrest });
    }
    if (reactionActive()) {
      const since = t - r.onsetT!;
      if (r.imT.length === 0 && since > MP_EMERGENCIES.imWithinS) scoreImInTime(null);
      // a second dose when problems persist at 5 minutes
      if (r.imT.length === 1 && t - r.imT[0] > MP_EMERGENCIES.repeatByS && reactionPersists(v) && decideOnceFor("repeat"))
        decide("anaphylaxis-repeat-im", "Repeat IM adrenaline when problems persisted", false, "A second IM dose after 5 minutes if problems persist", "No second dose", ANAPHYLAXIS_LESSON, ANA_TIPS);
      // refractory after two doses: the infusion
      if (r.imT.length >= 2 && !st.infusion && t - r.imT[1] > MP_EMERGENCIES.infusionByS && reactionPersists(v) && decideOnceFor("infusion"))
        decide("anaphylaxis-infusion", "Adrenaline infusion for refractory anaphylaxis", false, "A low-dose infusion with expert help after two failed IM doses", "No infusion", ANAPHYLAXIS_LESSON, ANA_TIPS);
      if (v.reaction.circulation < MP_EMERGENCIES.resolvedLevel && v.reaction.skin < MP_EMERGENCIES.resolvedLevel && v.aortaTrue.mean >= MP_EMERGENCIES.persistMapMmHg && since > MP_EMERGENCIES.resolvedMinS) {
        r.resolvedT = now();
        tel("reaction-resolved", {});
      }
    }
    // the infusion's tachyarrhythmia and its settling
    const inf = st.infusion;
    if (inf && !st.infusionTachy && inf.excessSinceT !== null && t - inf.excessSinceT >= MP_EMERGENCIES.infusionTachyAfterS) {
      st.infusionTachy = { t: now(), settleSinceT: null };
      eng().forceRhythm?.("vt", "adrenaline infusion");
    }
    const tachy = st.infusionTachy;
    if (tachy && tachy.settleSinceT !== null && t - tachy.settleSinceT >= MP_EMERGENCIES.infusionSettleS) {
      st.infusionTachy = null;
      eng().forceRhythm?.("sinus", inf ? "infusion reduced" : "infusion stopped");
    }
    // the signs the patient reports and the nurse sees (each once; nothing names the reaction)
    const G = MP_EMERGENCIES.signs;
    if (v.reaction.skin > 0 || reactionActive()) {
      if (v.symptoms.itch >= G.itch) sign("itch", "patient", "I've come up all itchy.");
      if (v.reaction.skin >= G.skin) sign("rash", "nurse", "A blotchy red rash is coming up on the chest and arms.");
      if (v.symptoms.flushing >= G.speak) sign("flush", "patient", "I feel really hot and flushed.");
      if (v.reaction.airway >= G.airway) sign("wheeze", "nurse", "There is a wheeze, and the lips look swollen.");
      if (v.symptoms.dyspnoea >= G.speak) sign("breath", "patient", "I can't catch my breath.");
    }
    // a scripted pericardial bleed stops at its volume
    if (st.pericardiumCapMl !== null && v.pericardialMl >= st.pericardiumCapMl) {
      eng().setPericardialInflow?.(0);
      st.pericardiumCapMl = null;
      tel("pericardium-capped", { ml: round1(v.pericardialMl) });
    }
    const learner = learnerHasCase();
    ingestVagal(learner);
    const ep = currentVagal();
    holdLapseFor(v, learner, ep);
    if (ep) {
      const since = t - ep.t;
      if (v.hr !== null && v.hr !== undefined) ep.lowHr = Math.min(ep.lowHr ?? Infinity, v.hr);
      ep.lowMap = Math.min(ep.lowMap ?? Infinity, v.aortaTrue.mean);
      const low = (v.hr ?? 99) < MP_EMERGENCIES.symptomaticHr || v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg;
      if (ep.symptomatic !== true && since <= MP_EMERGENCIES.vagalSymptomaticWithinS && low) ep.symptomatic = true;
      if (ep.symptomatic === null && since > MP_EMERGENCIES.vagalSymptomaticWithinS) ep.symptomatic = false;
      if (v.symptoms.nausea >= G.speak) {
        sign(`sick-${st.vagal.length}`, "patient", "I feel sick and faint.");
        if (v.symptoms.flushing < G.speak && v.reaction.skin < G.skin) sign(`pale-${st.vagal.length}`, "nurse", "Pale and clammy.");
      }
      // the learner can act at the wall clock once no time-lapse is running (a femoral compression's
      // lapse runs many minutes a second); an untreated episode that has passed by then is reported
      // as numbers and not scored
      if (ep.liveT === null && !s.busy) {
        ep.liveT = now();
        if (ep.firstAction === null && ep.symptomatic && !low && t - ep.t > MP_EMERGENCIES.orderS.call) {
          ep.done = true;
          ep.unscored = true;
          const hr = ep.lowHr !== null ? `the heart rate fell to ${Math.round(ep.lowHr)}` : "the heart rate fell";
          log("nurse", `Over the last ${Math.max(1, Math.round((t - ep.t) / 60))} minutes ${hr} and the mean pressure to ${Math.round(ep.lowMap)}; both have come back up.`);
        }
      }
    }
    if (ep && !ep.done) {
      // no response a few minutes after the learner's treatment: the nurse reports the numbers
      if (ep.firstAction && ep.firstAction.t >= 0 && ep.noResponseT === null && t - ep.firstAction.t >= MP_EMERGENCIES.noResponseAfterS && v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg) {
        ep.noResponseT = now();
        const shown = v.nibp ?? v.art;
        log("nurse", `${Math.round((t - ep.firstAction.t) / 60)} minutes since the treatment: heart rate ${v.hr ?? "not counted"}${shown ? `, pressure ${Math.round(shown.sys)}/${Math.round(shown.dia)}` : ""}.`);
        if (s.policy.mentor === "full") s.say("It is not getting better. What else could this be?", "safety");
      }
    }
    // the windows the learner is scored on run from when they could act (liveT)
    if (ep && !ep.done && ep.liveT !== null) {
      const since = t - ep.liveT;
      if (ep.symptomatic && ep.firstAction === null && since > MP_EMERGENCIES.vagalTreatWithinS && !reactionActive()) {
        ep.firstAction = { id: "lie-flat-legs-up", t: -1 };
        decide("vagal-first-treatment", "First treatment of the faint", false, "Legs up, atropine 0.5-1.0 mg IV and fast saline", `Nothing within ${MP_EMERGENCIES.vagalTreatWithinS / 60} min`, VAGAL_LESSON, VAGAL_TIPS);
      }
      if (ep.noResponseT !== null && ep.lookT === null && t - Math.max(ep.noResponseT, ep.liveT) > MP_EMERGENCIES.reconsiderWithinS) {
        ep.lookT = -1;
        decide("vagal-reconsider", "Thought again when the faint did not respond", false, "An echo or a bleeding check within minutes of no response", "No look for another cause", VAGAL_LESSON, VAGAL_TIPS);
      }
      if (since > MP_EMERGENCIES.episodeS) ep.done = true;
    }
    // a fast-rate hypotension after the sheath has come out (not the reaction, not a vagal episode)
    const low = v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg;
    lowMapSince = low ? (lowMapSince ?? t) : null;
    if (learner && !st.fastHypotension && s.hookAt["sheath-pull"] !== undefined && !reactionActive() && !currentVagal() && lowMapSince !== null && t - lowMapSince >= MP_EMERGENCIES.fastHypotensionHoldS && (v.hr ?? 0) >= MP_EMERGENCIES.fastHr) {
      st.fastHypotension = { t: now(), firstAction: null, lookT: null, done: false, liveT: null };
      tel("fast-hypotension", {});
    }
    const fh = st.fastHypotension;
    // its look window runs from when the learner can act at the wall clock (after any time-lapse)
    if (fh && !fh.done && fh.liveT === null && !s.busy) fh.liveT = now();
    if (fh && !fh.done && fh.liveT !== null) {
      if (fh.lookT === null && t - fh.liveT > MP_EMERGENCIES.fastLookWithinS) {
        fh.lookT = -1;
        decide("hypotension-fast-rate-look", "Looked for the cause of a fast-rate hypotension", false, "An immediate echo or a bleeding check", "No look", TAMPONADE_LESSON, VAGAL_TIPS, "closure");
      }
      if (t - fh.liveT > MP_EMERGENCIES.episodeS) fh.done = true;
    }
  };

  /**
   * The live lab (session.lapseHoldsOn): an emergency under way pauses a femoral compression, band or
   * recovery time-lapse, so the learner meets it at the wall clock with the orders open; the lapse goes
   * back on the clock once the patient has been out of the low range for MP_EMERGENCY_LAPSE. A reaction
   * is held at least through its IM adrenaline window, and a faint from its onset for at least MP_EMERGENCY_LAPSE. The episodes' scoring windows then run from the
   * pause (liveT, set as soon as no lapse runs).
   */
  const holdLapseFor = (v: Vitals, learner: boolean, ep: VagalEpisode | undefined) => {
    const t = s.tS;
    if ((v.hr ?? 99) < MP_EMERGENCIES.symptomaticHr || v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg) lastLowT = t;
    const recentLow = lastLowT !== null && t - lastLowT < MP_EMERGENCY_LAPSE.resumeAfterRecoveredS;
    const fh = st.fastHypotension && !st.fastHypotension.done ? st.fastHypotension : null;
    const r = st.reaction;
    const reactionWindow = reactionActive() && r.onsetT !== null && t - r.onsetT < MP_EMERGENCIES.imWithinS + MP_EMERGENCY_LAPSE.resumeAfterRecoveredS;
    // a faint is held from its onset (not only once the numbers are low), at least MP_EMERGENCY_LAPSE from it
    const vagalWindow = !!ep && t - ep.t < MP_EMERGENCY_LAPSE.resumeAfterRecoveredS;
    const emergency = learner && (reactionWindow || vagalWindow || ((reactionActive() || !!ep || !!fh) && recentLow));
    if (emergency && !holdingLapse) {
      if (s.holdLapse(EMERGENCIES_MODULE_ID)) {
        holdingLapse = true;
        tel("lapse-held", {});
      }
    } else if (!emergency && holdingLapse) {
      holdingLapse = false;
      s.releaseLapse(EMERGENCIES_MODULE_ID);
      tel("lapse-released", {});
    }
  };

  const onHook = (hook: SessionHook) => {
    if (!s) return;
    pushPrevention();
    if (hook === "puncture") {
      const p = st.prevention;
      const site = siteKind();
      if (p.localMl !== null && p.localSite === site) {
        const [lo, hi] = localRange(site);
        const ok = p.localMl >= lo && p.localMl <= hi;
        decide("local-anaesthetic-dose", "Local anaesthetic volume for the site", ok, `${site === "femoral" ? "10-20 mL (Brilakis) or 10 mL of 1% (Oxford)" : "About 1 mL (Brilakis) or 1-2 mL of 1% (Oxford)"}`, `${p.localMl} mL`, site === "femoral" ? VAGAL_LESSON : "pm-access-radial-puncture", site === "femoral" ? PREVENT_TIPS : ["access-radial-one-ml-local"], "access");
      }
    }
    if (hook === "sheath-pull" && st.prevention.removalDrill) {
      const femoral = s.activeSite.siteKind === "femoral";
      eng().stimulus?.("sheath-removal", femoral ? MP_EMERGENCIES.removalMagnitude.femoral : MP_EMERGENCIES.removalMagnitude.radial);
      // the preparation Brilakis 11.1 asks for before a femoral sheath comes out for manual compression
      if (femoral && s.femoral?.method === "manual" && !s.femoral.deviceFailed) {
        const p = st.prevention;
        const saline = p.salineT !== null;
        const ready = p.atropineReadyT !== null || p.fluidReadyT !== null;
        decide("vagal-prevention-removal", "Ready for a vagal reaction before the femoral sheath came out", saline && ready, "Saline running, with atropine or fluid ready", [saline ? "saline running" : "no saline", ready ? "atropine or fluid ready" : "nothing drawn up"].join(", ").replace(/^./, (x) => x.toUpperCase()), VAGAL_LESSON, PREVENT_TIPS, "closure");
      }
    }
    if (hook === "recovery" && st.reaction.onsetT !== null) {
      const r = st.reaction;
      if (r.referralT === null) decide("anaphylaxis-referral", "Allergy clinic referral", false, "Every patient referred to an allergy clinic", "Not referred", ANAPHYLAXIS_LESSON, ANA_TIPS, "recovery");
      if (r.agentT === null) decide("anaphylaxis-agent-recorded", "Agent and reaction recorded", false, "The agent and the reaction recorded", "Not recorded", ANAPHYLAXIS_LESSON, ANA_TIPS, "recovery");
    }
  };

  const mod: EmergenciesModule = {
    id: EMERGENCIES_MODULE_ID,
    state: st,
    attach(session) {
      s = session;
      eng().setEmergencyModel?.({ reactionEscalation: true, vagalSvrLagS: MP_EMERGENCIES.vagalSvrLagS, prevention: prevention() });
      return () => eng().setEmergencyModel?.(null);
    },
    slowTick() {
      if (!s) return;
      pushPrevention();
      watch();
    },
    onHook,
    events() {
      if (!s) return [];
      const out: LabEvent[] = [];
      const v = lastVitals;
      if (reactionActive() && v && v.reaction.skin > 0) out.push("contrast-reaction");
      const ep = currentVagal();
      if (ep && v && (v.hr ?? 99) < MP_EMERGENCIES.symptomaticHr) out.push("bradycardia");
      const shown = v ? (v.tipState === "aortic" ? v.art?.mean : v.nibp?.mean) : undefined;
      if ((reactionActive() || ep || (st.fastHypotension && !st.fastHypotension.done)) && typeof shown === "number" && shown < MP_EMERGENCIES.persistMapMmHg) out.push("hypotension");
      return out;
    },
    actions: {
      order,
      giveLocal,
      setInfusion,
      armRemovalDrill: () => {
        st.prevention.removalDrill = true;
      },
      learnerControl: () => {
        if (s) learnerControl();
      },
      capPericardium: (ml: number) => {
        st.pericardiumCapMl = ml > 0 ? ml : null;
      },
    },
  };
  return mod;
}
