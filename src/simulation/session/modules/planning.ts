// ---------------------------------------------------------------------------
// Full-case session module 'planning' (proc-chart-planted-problems).
//
// Holds the case's pre-procedure record (src/simulation/session/planning.ts),
// with its one planted problem, and what the learner does with it:
//   - readItem(id) reads an item of the record (it takes chart time);
//   - act(action) does something about the chart (hold and delay, plan another
//     access site, premedicate, no nitroglycerin, check the INR, hold
//     metformin, repeat the bloods, rethink stenting, clarify resuscitation
//     status, a pregnancy test, or proceed). Each action writes a decision to
//     the ledger; the first action that fits the planted problem before the
//     time-out scores the problem found. Hold and delay ends the case: the
//     needle is refused from then on. An acute case is never postponed for
//     the chart; a record without a planted problem (only one a caller
//     builds: every generated record has one) scores no chart problem;
//   - confirmCheck(id) confirms an item of Oxford's pre-puncture checklist.
//     SpO2 is read from the monitor and refused at 96% or less; the manifold
//     and transducer items are backed by the table state (a confirmation
//     without it is recorded, as the time-out's are). Where the visibility
//     policy requires the time-out (supervised and exam), placeNeedle is
//     refused until the checklist is complete; in every mode the first skin
//     puncture scores it. The refusals (the needle after a postponement or
//     before the checklist, a closure device in the plug groin) go through
//     the session's gate hook (gate(), modules/index.ts), which says them as
//     stop lines; the module's own lines go through session.say() and
//     session.logEntry(). A postponed case (postponed()) can be finished
//     before any puncture (CaseSession.finish()).
//
// Consequences of a missed problem come from the patient and the case, not a
// fixed rule: a DOAC inside its hold, or warfarin at today's INR, raises the
// baseline ACT whatever the planted problem (the anticoagulant is in the
// patient whether or not the learner reads the chart; residualAnticoagActRiseS,
// MODEL PARAMETER) and the
// femoral risk already counts oral anticoagulation; a PDE-5 inhibitor makes the
// engine's nitroglycerin response larger (the formulary's interaction table);
// a previous contrast reaction keeps the engine's previous-reaction risk, which
// premedication meets with its anti-allergic effect; a puncture in the groin
// with the plug or the fistula arm is scored, and no closure device is used in
// that groin; PCI after a missed planned operation, contrast and radiation
// before a pregnancy test are scored when they happen.
//
// A case that opens past the chart (the autopilot played it) had its planning
// done by the team: no planning decisions are scored, and past 'access' the
// checklist is taken as done (the autopilot placed the needle). So is a
// scenario's start state that punctures for the team (session.teamSetup while
// it runs: fem-entry-below-head opens with the team's needle and wire in), in
// every mode. A drawn site
// problem (a random acute case's plug or fistula on the planned route) was
// planned around by the team: the record has it on the other side, so the
// case the team opened is not refused its own groin. The chart's 'Previous
// access' line is made to agree with a drawn site problem.
//
// A recent plug is seen on ultrasound of its groin: priorPlug() gives the
// active site's plug (or null), which the ultrasound view draws (ultrasound.ts,
// BModeExtras.priorPlug) as an echogenic plug on the anterior wall of the
// common femoral artery with the anchor inside it. Nothing labels it.
//
// The chart section src/ui/access/chart/PlantedProblems.tsx shows the record,
// the actions and the checklist; nothing on it says which item is the problem.
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PriorClosurePlug } from "../../access/ultrasound";
import type { CaseSession } from "../caseSession";
import type { SessionHook } from "../scenarios/index";
import type { CaseSessionModule } from "./index";
import {
  PLANNING_ACTION_BY_ID,
  PLANTED_PROBLEMS,
  planningActionLabel,
  PRE_PUNCTURE_CHECKLIST,
  PLANNING_RULES,
  actionFits,
  buildPlanningRecord,
  isPlantedProblemId,
  problemsPresent,
  recordItems,
  type ChecklistItemId,
  type PlanningActionId,
  type PlanningRecord,
  type PlantedProblemId,
  type RecordItemId,
} from "../planning";
import { residualAnticoagActRiseS } from "../../patient/patient";

export const PLANNING_MODULE_ID = "planning";

/**
 * MODEL PARAMETERS (session settings, not clinical values): how long each step takes, s.
 * Reading an item is the session's chart-item time; the INR is a point-of-care test; the bloods go
 * to the laboratory; premedication is given an hour ahead (Oxford, pm-planning-preparation).
 */
export const MP_PLANNING_TIME = {
  readItemS: 15,
  inrS: 300,
  bloodsS: 3600,
  pregnancyTestS: 600,
  resuscitationTalkS: 300,
  premedicationLeadS: 3600,
  noteS: 20,
  /** the same stop line is not repeated within this time */
  repeatStopS: 5,
};

/** Oxygen flow the checklist's oxygen button starts, L/min (MODEL PARAMETER, a session setting). */
export const MP_OXYGEN_LPM = 2;

/** Oxford's premedication regimen, IV an hour ahead (pm-planning-preparation, 01-planning.ts, allergies). */
export const PREMEDICATION = { hydrocortisoneMg: 100, chlorphenamineMg: 10 } as const;

/** The case events the record raises once the item that states them has been read (case properties for the tips). */
export const PLANNING_EVENTS = ["pde5-recent", "contrast-sensitive", "pregnancy-possible"] as const satisfies readonly LabEvent[];

/** What this module can report, for every lab the case shows tips for (the reachability report reads it). */
export const raises: readonly LabRaises[] = (["access", "diagnostic", "pci"] as const).map((lab) => ({ lab, phases: [], events: PLANNING_EVENTS }));

export interface PlanningActionRecord {
  id: PlanningActionId;
  t: number;
  beforeTimeOut: boolean;
  correct: boolean;
  /** what the action returned (a result the operator would see) */
  result: string | null;
}

export interface PlanningState {
  record: PlanningRecord;
  /** session time each item was read */
  reviewed: Partial<Record<RecordItemId, number>>;
  actions: PlanningActionRecord[];
  /** the first action that fitted the planted problem */
  found: PlanningActionRecord | null;
  /** the time-out came without an action that fitted it */
  missed: boolean;
  /** hold and delay: the case ends here */
  postponed: { t: number; text: string } | null;
  /** the case opened past the chart: the team did the planning (nothing is scored) */
  planningByTeam: boolean;
  /** the case opened past 'access': the checklist was done before the needle the autopilot placed */
  checklistByTeam: boolean;
  avoidNitrate: boolean;
  otherAccess: boolean;
  noStent: boolean;
  /** checklist: session time each item was confirmed */
  checklist: Partial<Record<ChecklistItemId, number>>;
  /** items confirmed without the state that backs them */
  checklistFalse: ChecklistItemId[];
  /** the last line the checklist or an action returned (shown under it) */
  note: string | null;
  /** the groin site key with the plug ('femoral:right'), once it is known to the case */
  plugSite: string | null;
  /** what the missed problem did in the case (truth, for the debrief; no debrief shows it yet, the decisions carry the same) */
  consequences: string[];
  /** the baseline ACT rise applied for an oral anticoagulant still acting, s */
  actRiseS: number;
}

export interface PlanningModule extends CaseSessionModule {
  id: typeof PLANNING_MODULE_ID;
  readonly state: PlanningState;
  actions: {
    readItem: (id: RecordItemId) => boolean;
    act: (id: PlanningActionId) => PlanningActionRecord | null;
    confirmCheck: (id: ChecklistItemId) => boolean;
    giveOxygen: () => boolean;
    checklistDone: () => boolean;
    /** why the needle is refused now, or null */
    needleBlock: () => string | null;
    /** the recent collagen plug in the active site's groin, as ultrasound shows it, or null */
    priorPlug: () => PriorClosurePlug | null;
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
/** Lower-case the first letter for use mid-sentence; acronyms (INR, DOAC, ECG, SpO2) keep their case. */
const lc = (t: string) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);

/** The planning module of a session, if attached. */
export function planningOf(s: Pick<CaseSession, "mod">): PlanningModule | undefined {
  return s.mod<PlanningModule>(PLANNING_MODULE_ID);
}

/** The planted problems that rule out the planned site. */
const SITE_PROBLEMS: readonly PlantedProblemId[] = ["closure-device-90d", "dialysis-fistula"];

/** The chart's generated 'Previous access' lines a drawn site problem would contradict (caseSession.ts buildChart). */
const NO_ACCESS_LINE = /^No previous arterial access\.$/;
const RIGHT_RADIAL_LINE = /right radial artery/;
const GROIN_HAEMATOMA_LINE = /groin haematoma/;

/** The problem a planning scenario forces: its id when the scenario id is a problem id. */
export function forcedProblem(scenarioId: string): PlantedProblemId | undefined {
  return isPlantedProblemId(scenarioId) ? scenarioId : undefined;
}

export function createSessionModule(): PlanningModule {
  let s: CaseSession;
  let st: PlanningState;
  let puncturedChecked = new Set<string>();
  let nitrateScored = false;

  const problem = () => (st.record.planted ? PLANTED_PROBLEMS[st.record.planted] : null);
  const label = (id: PlanningActionId) => planningActionLabel(id, st.record.facts.setting);
  /** What fits the chart, for the ledger's 'expected'. */
  const expected = () => {
    const pp = problem();
    return pp
      ? `${pp.title}: ${pp.correct
          .filter((a) => !(a === "hold-and-delay" && st.record.facts.setting === "acute"))
          .map((a) => lc(label(a)))
          .join(", or ")}`
      : `Nothing in this acute case's chart stops it: ${lc(PLANNING_ACTION_BY_ID.proceed.label)}`;
  };
  const now = () => round1(s.tS);
  const refresh = () => {
    st.record.items = recordItems(s.profile, st.record.facts);
  };

  /**
   * A stop line from the attending (session.say: always spoken, critical in exam). The same line again
   * within MP_PLANNING_TIME.repeatStopS is not repeated.
   */
  const stop = (text: string) => {
    s.say(text, "safety", { stop: true, repeatAfterS: MP_PLANNING_TIME.repeatStopS });
  };
  const logAction = (text: string) => s.logEntry("action", text);

  const missingChecks = () => PRE_PUNCTURE_CHECKLIST.filter((c) => st.checklist[c.id] === undefined);
  const checklistDone = () => st.checklistByTeam || missingChecks().length === 0;

  const needleBlock = (): string | null => {
    if (st.postponed) return "The case has been postponed: no puncture today.";
    // the session's own time-out stop comes first
    if (!s.policy.timeOutRequired || !s.timeOutDone) return null;
    if (!checklistDone()) return `Stop. Before the needle: ${missingChecks().map((c) => lc(c.text)).join("; ")}.`;
    return null;
  };

  /** Score the planted problem: found (an action that fits it, before the time-out) or missed. */
  const scoreProblem = (correct: boolean, given: string, note?: string) => {
    const pp = problem();
    if (!pp) return; // nothing planted (an acute case): no chart problem to score
    s.decide({
      id: "planning-problem",
      stage: "chart",
      label: "The chart's problem found and acted on before the time-out",
      correct,
      expected: expected(),
      given: note ? `${given} (${note})` : given,
      // the missed problem links the lesson on reading the chart; the found one the lesson on the problem
      lessonId: correct ? pp.lessonId : "pm-planning-assessment",
      tipIds: [...pp.tipIds],
    });
  };

  const actionResult = (id: PlanningActionId): string | null => {
    const f = st.record.facts;
    switch (id) {
      case "hold-and-delay":
        return "Today's case is postponed and rebooked.";
      case "other-access":
        st.otherAccess = true;
        return "Choose the new route under Planned access before the first puncture.";
      case "premedicate": {
        if (f.setting === "acute") {
          // Brilakis, for an emergency: IV hydrocortisone as soon as possible; the case does not wait the hour
          s.order("hydrocortisone", PREMEDICATION.hydrocortisoneMg);
          s.runPending();
          if (f.contrastAllergy !== "none") f.premedicated = true;
          refresh();
          return `Hydrocortisone ${PREMEDICATION.hydrocortisoneMg} mg IV given now; the emergency case goes ahead.`;
        }
        // Oxford's regimen, then the hour it needs
        s.order("hydrocortisone", PREMEDICATION.hydrocortisoneMg);
        s.runPending();
        s.order("chlorphenamine", PREMEDICATION.chlorphenamineMg);
        s.runPending();
        if (f.contrastAllergy !== "none") f.premedicated = true;
        refresh();
        s.wait(MP_PLANNING_TIME.premedicationLeadS, "Premedication: waiting an hour before contrast");
        return `Hydrocortisone ${PREMEDICATION.hydrocortisoneMg} mg and chlorphenamine ${PREMEDICATION.chlorphenamineMg} mg IV given; contrast after an hour.`;
      }
      case "avoid-nitrate":
        st.avoidNitrate = true;
        return "The team knows: no nitroglycerin will be given in this case.";
      case "check-inr": {
        s.wait(MP_PLANNING_TIME.inrS, "Point-of-care INR");
        if (!f.warfarin) return "INR within the normal range.";
        f.warfarin.inrLast = f.warfarin.inrToday;
        f.warfarin.inrAgeH = 0;
        refresh();
        return `INR ${f.warfarin.inrToday} now.`;
      }
      case "hold-metformin":
        if (!f.metformin) return "The patient does not take metformin.";
        f.metformin.heldSinceH = 0;
        refresh();
        return "Metformin held today and for at least 48 hours after; renal function to be checked before restarting.";
      case "repeat-bloods":
        s.wait(MP_PLANNING_TIME.bloodsS, "Waiting for the repeat bloods");
        f.bloodsDaysAgo = 0;
        refresh();
        return "Repeat full blood count, electrolytes and creatinine: no change from the pre-assessment results.";
      case "rethink-stenting":
        st.noStent = true;
        return "Diagnostic study only today; any stent to be agreed with the surgeon and anaesthetist first.";
      case "clarify-resuscitation":
        s.wait(MP_PLANNING_TIME.resuscitationTalkS, "Discussing resuscitation status");
        if (!f.dnacpr.present) return "Confirmed with the patient: for full resuscitation.";
        f.dnacpr.suspended = true;
        refresh();
        return "Discussed with the patient: the order is suspended for the procedure and recovery, and documented.";
      case "pregnancy-test":
        if (!f.pregnancy.applicable) return "Not indicated for this patient.";
        s.wait(MP_PLANNING_TIME.pregnancyTestS, "Pregnancy test");
        f.pregnancy.done = true;
        refresh();
        return "Urine pregnancy test: negative.";
      case "proceed":
        return null;
    }
  };

  const act = (id: PlanningActionId): PlanningActionRecord | null => {
    if (s.busy || st.postponed) return null;
    const before = !s.timeOutDone;
    const fit = actionFits(st.record.planted, id, st.record.facts);
    const result = actionResult(id);
    const rec: PlanningActionRecord = { id, t: now(), beforeTimeOut: before, correct: fit.correct, result };
    st.actions.push(rec);
    st.note = result;
    logAction(`Chart: ${label(id)}.`);
    if (!st.planningByTeam) {
      const pp = problem();
      s.decide({
        id: `planning-action-${id}`,
        stage: "chart",
        label: `Chart action: ${label(id)}`,
        correct: fit.correct,
        expected: pp ? `For ${lc(expected())}` : expected(),
        given: `${label(id)}${before ? "" : " (after the time-out)"}${fit.note ? `; ${fit.note}` : ""}`,
        lessonId: pp?.lessonId ?? "pm-planning-assessment",
        tipIds: pp ? [...pp.tipIds] : [],
      });
      if (fit.correct && !st.found) {
        st.found = rec;
        if (before) scoreProblem(true, label(id), fit.note);
      }
    }
    if (id === "hold-and-delay") {
      st.postponed = { t: now(), text: "Case postponed and rebooked after the chart review." };
      // postponing for anything else is still the end of the case, and the problem was not the reason
      if (!st.planningByTeam && !fit.correct && !st.found) scoreProblem(false, "The case was postponed for another reason");
      stop("Understood: the case is stopped and rebooked. Nothing more is done today.");
    }
    return rec;
  };

  const readItem = (id: RecordItemId): boolean => {
    if (s.busy || st.reviewed[id] !== undefined || !st.record.items.some((i) => i.id === id)) return false;
    st.reviewed[id] = now();
    s.wait(MP_PLANNING_TIME.readItemS, `Reading: ${lc(st.record.items.find((i) => i.id === id)!.label)}`);
    logAction(`Chart: ${lc(st.record.items.find((i) => i.id === id)!.label)} reviewed.`);
    return true;
  };

  const confirmCheck = (id: ChecklistItemId): boolean => {
    if (st.checklist[id] !== undefined) return true;
    if (s.busy) return false;
    const item = PRE_PUNCTURE_CHECKLIST.find((c) => c.id === id);
    if (!item) return false;
    if (id === "spo2") {
      const v = s.patient.vitals();
      const spo2 = v.spo2;
      if (spo2 === null || !(spo2 > PLANNING_RULES.spo2AbovePct)) {
        const onAir = !((v.respiratory?.oxygenLpm ?? 0) > 0);
        st.note = spo2 === null ? "There is no oximetry trace: put the probe on before confirming." : `SpO2 reads ${Math.round(spo2)}%${onAir ? " on air" : " on oxygen"}: not above ${PLANNING_RULES.spo2AbovePct}%.${onAir ? " Give oxygen first." : ""}`;
        return false;
      }
    }
    if (id === "ecg") {
      // VF, asystole or a rate the monitor cannot count is not 'continuous ECG of good quality'
      const v = s.patient.vitals();
      if (v.hr === null || v.rhythmKind === "vf" || v.rhythmKind === "asystole") {
        st.note = "The monitor shows no organised rhythm.";
        return false;
      }
    }
    st.checklist[id] = now();
    const backed = id === "manifold" ? s.ex.lineFlushed : id === "transducer" ? s.ex.zeroed : true;
    if (!backed) {
      st.checklistFalse.push(id);
      st.note = id === "manifold" ? "Confirmed, but the manifold and line have not been flushed on the table." : "Confirmed, but the transducer has not been zeroed on the table.";
    } else st.note = null;
    s.wait(MP_PLANNING_TIME.noteS, "Pre-puncture checklist");
    return true;
  };

  /**
   * The active site's recent collagen plug, as ultrasound of that groin shows it: on the common femoral
   * artery (a femoral artery or vein site of the plug's side), at the old arteriotomy, taken to be the
   * middle of the site's puncture window (a MODEL choice).
   */
  const priorPlug = (): PriorClosurePlug | null => {
    const cd = st.record.facts.closureDevice;
    const a = s.activeSite;
    if (!cd || !(cd.daysAgo < PLANNING_RULES.closureDeviceDays) || a.side !== cd.side || (a.siteKind !== "femoral" && a.siteKind !== "femoral-vein")) return null;
    const site = a.site;
    // a femoral vein site keeps the groin's anatomy with the vein as its target: the plug is on the artery
    const arteryId = a.siteKind === "femoral" ? site.arteryId : "cfa";
    const artery = site.tubes.find((t) => t.id === arteryId);
    if (!artery) return null;
    return { vessel: artery.id, x: (site.landmarks.targetFrom + site.landmarks.targetTo) / 2, daysAgo: cd.daysAgo };
  };

  /** Supplemental oxygen at the MODEL setting (2 L/min), when the patient port has it (the engine does). */
  const giveOxygen = (): boolean => {
    const p = s.patient as unknown as { setOxygen?: (lpm: number) => void };
    if (typeof p.setOxygen !== "function") return false;
    p.setOxygen(MP_OXYGEN_LPM);
    logAction("Oxygen by nasal cannula started.");
    st.note = "Oxygen on; recheck the SpO2.";
    return true;
  };

  /** The first skin pass: the checklist is scored, and the site checked against the record. */
  const onPuncture = () => {
    // a puncture a scenario's start state makes is the team's, with the team's checklist
    if (s.teamSetup) st.checklistByTeam = true;
    if (!st.checklistByTeam) {
      const missing = missingChecks();
      const ok = missing.length === 0 && st.checklistFalse.length === 0;
      s.decide({
        id: "pre-puncture-checklist",
        stage: "access",
        label: "Pre-puncture checklist complete before the needle",
        correct: ok,
        expected: "Every item confirmed, and backed by the table and the monitor, before the first puncture",
        given: ok
          ? "Every item confirmed first"
          : [
              // the false confirmation first: the ledger cuts text at DECISION_TEXT_MAX
              st.checklistFalse.length ? `Confirmed without it being so: ${st.checklistFalse.map((id) => lc(PRE_PUNCTURE_CHECKLIST.find((c) => c.id === id)!.text)).join("; ")}` : "",
              missing.length > 2
                ? `Not confirmed: ${missing.length} of ${PRE_PUNCTURE_CHECKLIST.length} items, from ${lc(missing[0].text)}`
                : missing.length
                  ? `Not confirmed: ${missing.map((c) => lc(c.text)).join("; ")}`
                  : "",
            ].filter(Boolean).join(". "),
        lessonId: "pm-to-the-root-table",
        tipIds: ["diag-root-manifold-ready"],
      });
    }
    checkSites();
  };

  /** Every punctured site, once each, against the plug and the fistula. */
  const checkSites = () => {
    const f = st.record.facts;
    for (const site of s.sites) {
      if (site.firstPassAt === null || puncturedChecked.has(site.id)) continue;
      puncturedChecked.add(site.id);
      const key = `${site.siteKind}:${site.side}`;
      if (f.closureDevice && f.closureDevice.daysAgo < PLANNING_RULES.closureDeviceDays && key === `femoral:${f.closureDevice.side}`) {
        // the plug is there whoever punctured; only the trainee's own choice of groin is scored
        st.plugSite = key;
        if (st.planningByTeam) continue;
        st.consequences.push(`The ${f.closureDevice.side} groin was punctured ${f.closureDevice.daysAgo} days after an anchor-and-collagen-plug closure device; no closure device can be used there.`);
        s.decide({
          id: "planning-plug-groin",
          stage: "access",
          label: "The groin with a recent collagen-plug closure device avoided",
          correct: false,
          expected: "The other femoral artery or a radial artery",
          given: `The ${f.closureDevice.side} femoral artery`,
          lessonId: PLANTED_PROBLEMS["closure-device-90d"].lessonId,
          tipIds: ["access-planning-site-history"],
        });
      }
      if (!st.planningByTeam && f.fistulaArm && key === `radial:${f.fistulaArm}`) {
        st.consequences.push(`The ${f.fistulaArm} radial artery, in the dialysis fistula arm, was punctured.`);
        s.decide({
          id: "planning-fistula-arm",
          stage: "access",
          label: "The dialysis fistula arm avoided",
          correct: false,
          expected: "The other arm or a femoral artery",
          given: `The ${f.fistulaArm} radial artery`,
          lessonId: PLANTED_PROBLEMS["dialysis-fistula"].lessonId,
          tipIds: ["access-planning-site-history"],
        });
      }
    }
  };

  /** The time-out came: a problem not yet acted on is missed. */
  const onTimeOut = () => {
    const pp = problem();
    if (!pp || st.planningByTeam || st.found || st.postponed) return;
    st.missed = true;
    st.consequences.push(`Missed before the time-out: ${lc(pp.title)}. ${pp.consequence}`);
    scoreProblem(false, "Not acted on before the time-out");
  };

  /** Nitroglycerin given inside a PDE-5 window, or after the team was told not to: scored once. */
  const checkNitrate = () => {
    if (nitrateScored || st.planningByTeam) return;
    const f = st.record.facts;
    const gtn = s.orders.find((o) => o.id === "gtn" || o.id === "gtn-low");
    if (!gtn) return;
    const inWindow = !!f.pde5 && f.pde5.hoursAgo + gtn.t / 3600 < f.pde5.windowH;
    if (!inWindow && !st.avoidNitrate) return;
    nitrateScored = true;
    if (inWindow) st.consequences.push(`Nitroglycerin was given ${round1(f.pde5!.hoursAgo + gtn.t / 3600)} h after ${f.pde5!.agent} (window ${f.pde5!.windowH} h).`);
    s.decide({
      id: "planning-nitrate",
      stage: "access",
      label: "No nitroglycerin inside a PDE-5 inhibitor's window",
      correct: false,
      expected: "No nitrate: verapamil alone for spasm, saline and a vasopressor if the pressure falls",
      given: st.avoidNitrate ? "Given after the team was told not to" : "Given",
      lessonId: PLANTED_PROBLEMS["pde5-24h"].lessonId,
      tipIds: ["diag-planning-pde5-nitrate"],
    });
  };

  /** Handed to PCI with a planned operation the stent plan did not allow for. */
  const onHandover = () => {
    if (st.planningByTeam || s.handedOver !== "pci" || st.record.planted !== "surgery-planned" || st.noStent) return;
    st.consequences.push("The case went to PCI although non-cardiac surgery is planned within months.");
    s.decide({
      id: "planning-stent-candidacy",
      stage: "table",
      label: "Stenting rethought for a patient with surgery planned",
      correct: false,
      expected: "Diagnostic study only; any PCI agreed with the surgeon and anaesthetist",
      given: "Handed to PCI",
      lessonId: PLANTED_PROBLEMS["surgery-planned"].lessonId,
      tipIds: ["pci-planning-stent-candidacy"],
    });
  };

  /** Radiation before a pregnancy test that the record asked for. */
  let pregnancyScored = false;
  const checkPregnancy = () => {
    if (pregnancyScored || st.planningByTeam) return;
    const f = st.record.facts;
    if (!f.pregnancy.applicable || f.pregnancy.done || !(s.totals.fluoroS > 0 || s.beamOn)) return;
    pregnancyScored = true;
    st.consequences.push("Fluoroscopy was used before a pregnancy test.");
    s.decide({
      id: "planning-pregnancy-before-radiation",
      stage: "fluoro",
      label: "Pregnancy test before radiation",
      correct: false,
      expected: "A negative pregnancy test before the beam is used",
      given: "Radiation without a test",
      lessonId: PLANTED_PROBLEMS["pregnancy-test"].lessonId,
      tipIds: ["diag-planning-check-in"],
    });
  };

  const events = (): LabEvent[] => {
    const out: LabEvent[] = [];
    const f = st.record.facts;
    const read = (id: RecordItemId) => st.reviewed[id] !== undefined;
    if (f.pde5 && f.pde5.hoursAgo < f.pde5.windowH && read("medications")) out.push("pde5-recent");
    if ((f.contrastAllergy !== "none" && (read("medications") || s.chart.allergies.reviewed)) || (st.record.planted === "metformin-ckd" && read("medications"))) out.push("contrast-sensitive");
    if (f.pregnancy.applicable && !f.pregnancy.done && read("pregnancy")) out.push("pregnancy-possible");
    return out;
  };

  const mod: PlanningModule = {
    id: PLANNING_MODULE_ID,
    get state() {
      return st;
    },
    attach(session) {
      s = session;
      puncturedChecked = new Set();
      nitrateScored = false;
      pregnancyScored = false;
      const forced = forcedProblem(s.scenario.id);
      const record = buildPlanningRecord({ seed: s.seed, profile: s.profile, access: s.access, anticoagText: s.chart.anticoag?.text, force: forced });
      const late = s.startStage !== "chart";
      if (!forced && record.planted && SITE_PROBLEMS.includes(record.planted)) {
        const rf = record.facts;
        // the team opened the case on the route it planned around the problem: the problem is on the other side
        if (late) {
          if (rf.closureDevice) rf.closureDevice.side = rf.closureDevice.side === "right" ? "left" : "right";
          if (rf.fistulaArm) rf.fistulaArm = rf.fistulaArm === "right" ? "left" : "right";
          record.items = recordItems(s.profile, rf);
        }
        // the chart's previous-access line agrees with the record
        const h = s.chart.history;
        // (an earlier groin haematoma would be a second access complication: the plug replaces it)
        if (h && rf.closureDevice) {
          const cd = rf.closureDevice;
          if (NO_ACCESS_LINE.test(h.text) || GROIN_HAEMATOMA_LINE.test(h.text))
            h.text = `Previous ${cd.side} femoral angiography, closed with a closure device (details in the pre-procedure record).`;
          else h.text = `${h.text} Previous ${cd.side} femoral angiography ${cd.daysAgo} days ago, closed with a closure device (details in the pre-procedure record).`;
        }
        if (h && rf.fistulaArm === "right" && RIGHT_RADIAL_LINE.test(h.text)) h.text = "No previous arterial access.";
      }
      st = {
        record,
        reviewed: {},
        actions: [],
        found: null,
        missed: false,
        postponed: null,
        planningByTeam: late,
        checklistByTeam: late && s.startStage !== "access",
        avoidNitrate: false,
        otherAccess: false,
        noStent: false,
        checklist: {},
        checklistFalse: [],
        note: null,
        plugSite: null,
        consequences: [],
        actRiseS: 0,
      };
      // an oral anticoagulant still acting raises the baseline ACT (the engine reads profile.act), from
      // the facts and not the planted problem: a DOAC inside its hold, or warfarin at today's INR
      const f = record.facts;
      const rise =
        f.doac && f.doac.hoursSinceDose < f.doac.brilakisHoldH
          ? residualAnticoagActRiseS({ doac: { agent: f.doac.agent, effect: s.profile.doac?.effect } })
          : f.warfarin
          ? residualAnticoagActRiseS({ inr: f.warfarin.inrToday })
          : 0;
      if (rise > 0) {
        s.profile.act = { ...s.profile.act, baseline: s.profile.act.baseline + rise };
        st.actRiseS = rise;
      }
      // premedication already taken (a reaction that is not the planted problem): its effect on board
      if (f.premedicated) {
        s.patient.give({ drug: "hydrocortisone", dose: PREMEDICATION.hydrocortisoneMg, route: "iv" });
        // an acute case had Brilakis's emergency hydrocortisone only
        if (f.setting === "elective") s.patient.give({ drug: "chlorphenamine", dose: PREMEDICATION.chlorphenamineMg, route: "iv" });
      }
    },
    /**
     * The needle and the femoral closure device: the session asks here first and says the refusal as a
     * stop line. A needle a scenario's start state places is the team's, with the team's checklist.
     */
    gate(action) {
      if (action === "placeNeedle") {
        // the team's needle (a start state) waits for no checklist; its puncture marks the checklist the team's (onPuncture)
        if (s.teamSetup && !st.postponed) return null;
        return needleBlock();
      }
      if (action === "femoralDevice") {
        const key = `${s.activeSite.siteKind}:${s.activeSite.side}`;
        const cd = st.record.facts.closureDevice;
        const plugKey = cd && cd.daysAgo < PLANNING_RULES.closureDeviceDays ? `femoral:${cd.side}` : st.plugSite;
        if (plugKey && key === plugKey) return "Not here: there is a collagen plug in this groin from a recent closure device. Compress manually.";
      }
      return null;
    },
    postponed() {
      return st?.postponed ? { t: st.postponed.t, text: st.postponed.text } : null;
    },
    onHook(hook: SessionHook) {
      if (hook === "time-out") onTimeOut();
      else if (hook === "puncture") onPuncture();
      else if (hook === "handover") onHandover();
    },
    slowTick() {
      checkNitrate();
      checkSites();
      checkPregnancy();
    },
    events,
    actions: {
      readItem,
      act,
      confirmCheck,
      giveOxygen,
      checklistDone,
      needleBlock,
      priorPlug,
    },
  };
  return mod;
}

/** For tests and the dev hook: the problems the record holds now (exactly the planted one until it is acted on). */
export function problemsNow(m: PlanningModule, access: Parameters<typeof problemsPresent>[1]): PlantedProblemId[] {
  return problemsPresent(m.state.record.facts, access);
}
