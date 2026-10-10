// ---------------------------------------------------------------------------
// Full-case session module 'discharge' (proc-discharge-prescription).
//
// The discharge antithrombotic prescription (src/simulation/session/
// discharge.ts) in a case. Active in the discharge scenarios
// (scenarios/discharge.ts, whose case facts are DISCHARGE_CASES) and in any
// other case once it has been to PCI (the facts then come from the generated
// patient: derivedDischargeCase). The prescription is written once every
// access site is closed. What the learner does:
//   - update(plan) saves the prescription as the panel holds it;
//   - sign(plan?) writes it: each item is scored against the module text and
//     recorded in the ledger (stage 'discharge'); an incomplete prescription
//     is refused with what is missing (the stop dates are scored, not
//     required, so a plan without them fails that item);
//   - followUp() plays the follow-up visit after discharge; in a scenario that
//     sets one, the patient reports a bleed on the antiplatelets, and
//     answerBleed(response) answers it (scored);
//   - setOpen(open): the panel reports whether the prescription is on screen.
//
// Tips: while the prescription is open the module reports the PCI finish
// (pci-post-dapt-plan, pci-post-oac-clopidogrel), with 'bleeding' once a bleed
// has occurred, in the case or at the follow-up (pci-post-bleeding-dapt). The
// bleed is reported only in this context, not as a case event, so a nosebleed
// at follow-up does not bring up the access complication tips. `raises` says
// so for the reachability report.
//
// The stents the prescription is for are the ones the labs reported
// (LabReport through session.ward.reports: the live PCI's return, or the
// team's report in a scenario's start state).
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { CaseSession } from "../caseSession";
import type { ReportedStent } from "../handover";
import type { CaseSessionModule } from "./index";
import {
  MP_DISCHARGE,
  derivedDischargeCase,
  dischargeCase,
  dischargeChart,
  dischargePatient,
  emptyPlan,
  missingPlan,
  planSummary,
  scoreBleedResponse,
  scorePlan,
  type BleedResponse,
  type DischargeCase,
  type DischargePlan,
  type DischargeVerdict,
  type FollowUp,
} from "../discharge";

export const DISCHARGE_MODULE_ID = "discharge";

/** What the module reports: the PCI finish while the prescription is open, with 'bleeding' after a bleed. */
export const DISCHARGE_EVENTS = ["bleeding"] as const satisfies readonly LabEvent[];
export const raises: readonly LabRaises[] = [{ lab: "pci", phases: ["finish"], events: DISCHARGE_EVENTS }];

/** Session events that mean a bleed happened in the case (the access bleeds and haematomas). */
const CASE_BLEED_EVENTS: readonly LabEvent[] = ["bleeding", "haematoma"];

export interface DischargeFollowUp {
  t: number;
  text: string;
  bleed: FollowUp["bleed"];
  response: BleedResponse | null;
}

export interface DischargeState {
  case: DischargeCase;
  /** the prescription as the panel last saved it */
  draft: DischargePlan;
  signed: { t: number; plan: DischargePlan; verdicts: DischargeVerdict[] } | null;
  /** the prescription is on screen (the panel says so) */
  open: boolean;
  /** a bleed happened in the case before the prescription (an access bleed or haematoma) */
  bledInCase: boolean;
  followUp: DischargeFollowUp | null;
  /** the line the prescription last returned (shown under it) */
  note: string | null;
}

export interface DischargeModule extends CaseSessionModule {
  id: typeof DISCHARGE_MODULE_ID;
  /** null when the case has no discharge prescription (not a discharge scenario and no PCI yet) */
  readonly state: DischargeState | null;
  actions: {
    update: (o: DischargePlan) => void;
    /** sign the prescription (default: the saved draft); false when refused (the note says why) */
    sign: (o?: DischargePlan) => boolean;
    setOpen: (open: boolean) => void;
    /** the follow-up visit; returns what the patient reports, or null when it cannot happen yet */
    followUp: () => string | null;
    answerBleed: (r: BleedResponse) => boolean;
    /** the prescription can be written now (every access site is closed) */
    available: () => boolean;
    missing: () => string[];
    /** the chart lines the prescription is written from */
    chart: () => string[];
    /** the stents the labs reported */
    stents: () => ReportedStent[];
    /** a bleed has occurred (in the case or at follow-up) */
    bled: () => boolean;
  };
}

/** The discharge module of a session, when the case has a prescription to write. */
export function dischargeOf(s: Pick<CaseSession, "mod">): DischargeModule | undefined {
  const m = s.mod<DischargeModule>(DISCHARGE_MODULE_ID);
  return m?.state ? m : undefined;
}

/**
 * The lab's Discharge tab (ProcedureLab): shown whenever the case has a prescription to write; a discharge scenario
 * opens on it.
 */
export function dischargeTab(s: Pick<CaseSession, "mod">, scenarioId: string): { shown: boolean; opensOnIt: boolean } {
  const shown = !!dischargeOf(s);
  return { shown, opensOnIt: shown && !!dischargeCase(scenarioId) };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function createSessionModule(): DischargeModule {
  let s: CaseSession;
  let st: DischargeState | null = null;
  let scenarioCase: DischargeCase | undefined;
  /** a case bleed was seen (watched from attach, before the state exists in a derived case, until the prescription is signed) */
  let bledSeen = false;

  const fresh = (c: DischargeCase): DischargeState => ({ case: c, draft: emptyPlan(), signed: null, open: false, bledInCase: bledSeen, followUp: null, note: null });

  /** The state, built on first use in a case that has been to PCI without a discharge scenario. */
  const state = (): DischargeState | null => {
    if (st) return st;
    if (!s) return null;
    if (scenarioCase) st = fresh(scenarioCase);
    else if (s.labsDone.includes("pci")) st = fresh(derivedDischargeCase(s.profile));
    return st;
  };

  const stents = (): ReportedStent[] => s.ward.reports.filter((r) => r.lab === "angio-pci").flatMap((r) => r.stents);
  const available = () => !!state() && s.closureDone();
  const bled = () => {
    const x = state();
    return !!x && (x.bledInCase || bledSeen || !!x.followUp?.bleed);
  };
  const decide = (v: DischargeVerdict, then?: string) =>
    s.decide({ id: `discharge-${v.id}`, stage: "discharge", label: v.label, correct: v.correct, expected: v.expected, given: then ? `${v.given}. ${then}` : v.given, lessonId: v.lessonId, tipIds: v.tipIds });

  const mod: DischargeModule = {
    id: DISCHARGE_MODULE_ID,
    get state() {
      return state();
    },
    attach(session) {
      s = session;
      st = null;
      bledSeen = false;
      scenarioCase = dischargeCase(session.scenario.id);
      return () => {
        st = null;
      };
    },
    slowTick() {
      // watched whether or not the state exists yet (a derived case builds it only once PCI is done)
      const x = st;
      if (x?.signed) return;
      if (!bledSeen && s.activeEvents().some((e) => CASE_BLEED_EVENTS.includes(e))) bledSeen = true;
      if (x && bledSeen) x.bledInCase = true;
    },
    tipContexts(): readonly LabContext[] {
      const x = st;
      if (!x || !x.open || !available()) return [];
      return [{ lab: "pci", phase: "finish", events: bled() ? [...DISCHARGE_EVENTS] : [] }];
    },
    actions: {
      update(o) {
        const x = state();
        if (!x || x.signed) return;
        x.draft = JSON.parse(JSON.stringify(o));
      },
      sign(o) {
        const x = state();
        if (!x) return false;
        if (x.signed) {
          x.note = "The prescription is already signed.";
          return false;
        }
        if (!s.closureDone()) {
          x.note = "The discharge prescription is written once every access site is closed.";
          return false;
        }
        const plan: DischargePlan = JSON.parse(JSON.stringify(o ?? x.draft));
        x.draft = plan;
        const missing = missingPlan(x.case, plan);
        if (missing.length) {
          x.note = `Still to write: ${missing.join(", ")}.`;
          return false;
        }
        if (bledSeen) x.bledInCase = true;
        const verdicts = scorePlan(x.case, dischargePatient(s.profile), plan, { bled: x.bledInCase });
        for (const v of verdicts) decide(v);
        x.signed = { t: round1(s.tS), plan, verdicts };
        x.note = "Prescription signed.";
        s.logEntry("action", `Discharge prescription signed: ${planSummary(x.case, plan).join("; ")}.`);
        if (!s.busy) s.wait(MP_DISCHARGE.signS, "Writing the discharge prescription");
        return true;
      },
      setOpen(open) {
        const x = state();
        if (x) x.open = open;
      },
      followUp() {
        const x = state();
        if (!x?.signed) {
          if (x) x.note = "The follow-up comes after the prescription is signed.";
          return null;
        }
        if (x.followUp) return x.followUp.text;
        const f = x.case.followUp;
        const text = f?.text ?? "Seen at follow-up: taking the tablets as prescribed, no bleeding and no chest pain.";
        x.followUp = { t: round1(s.tS), text, bleed: f?.bleed ?? null, response: null };
        s.logEntry("patient", text);
        if (!s.busy) s.wait(MP_DISCHARGE.followUpS, "Follow-up visit");
        return text;
      },
      answerBleed(r) {
        const x = state();
        const f = x?.followUp;
        if (!x || !f?.bleed || f.response) return false;
        f.response = r;
        const p2y12 = x.signed?.plan.p2y12 ?? null;
        decide(scoreBleedResponse(r, p2y12, f.bleed.severity));
        const words: Record<BleedResponse, string> = {
          "local-continue": "Bleeding site controlled; antiplatelets unchanged.",
          "local-step-down": p2y12 && p2y12 !== "clopidogrel" ? `Bleeding site controlled; ${p2y12} stepped down to clopidogrel.` : "Bleeding site controlled; clopidogrel continued.",
          "stop-all": "All antiplatelet drugs stopped.",
          platelets: "Platelet transfusion given.",
        };
        s.logEntry("action", words[r]);
        return true;
      },
      available,
      missing() {
        const x = state();
        return x ? missingPlan(x.case, x.draft) : [];
      },
      chart() {
        const x = state();
        return x ? dischargeChart(x.case, dischargePatient(s.profile), stents()) : [];
      },
      stents,
      bled,
    },
  };
  return mod;
}
