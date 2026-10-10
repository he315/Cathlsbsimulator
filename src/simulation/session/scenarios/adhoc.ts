// The full case's ad hoc or delayed PCI decision (proc-adhoc-gate). Each case opens with the
// diagnostic study done, the catheter in the aorta and the decision gate open (src/simulation/session/
// adhoc.ts, src/ui/access/AdHocGate.tsx): the learner reads the contrast and dose so far, the consent
// wording, the centre's capabilities, any complication, the time of day and the patient now, then
// chooses ad hoc PCI or deferral and ticks the reasons to defer that apply (Brilakis 7.3, lesson
// pm-target-timing).
//
//   adhoc-left-main-stable        stable angina, unprotected left main disease: defer (anatomy;
//                                 a consent for a simple PCI does not cover it), heart team
//   adhoc-cto-stable              stable angina, a chronic total occlusion of the LAD: defer
//   adhoc-mvd-stable              stable angina, three-vessel disease: defer, heart team
//   adhoc-acs-ongoing             anterior STEMI with ST elevation and chest pain on the table:
//                                 ad hoc PCI of the culprit
//   adhoc-consent-diagnostic-only stable angina, a single LAD lesion, consent for the diagnostic
//                                 study only: defer (consent)
//   adhoc-complication            stable angina, a single LAD lesion, ventricular fibrillation
//                                 during an injection of the diagnostic study: defer (complication)
//   adhoc-late-evening-stemi-call stable angina, a single LAD lesion, late in the evening; a STEMI
//                                 call comes in while the decision is pending: defer (people)
//
// The anatomy is the patient's own: each fixed seed was chosen so that the generated anatomy is the one
// the case needs (adhoc.test.ts checks each). The gate shows the team's report of the study
// (ADHOC_FINDINGS) until the learner files their own; 'Review the angiogram' takes the case to the
// diagnostic lab for that. The seeds, the diagnostic study's contrast and dose, the team's report, the
// consent wording, the clock and the call are MODEL PARAMETERS (docs/realism/facts/pkg-proc-adhoc-gate.md).
//
// `raises` is what the gate reports for the tips: the diagnostic finish with 'high-contrast-volume'
// and 'high-radiation-dose' when present (adhoc.ts). The reachability report
// (src/content/lab/reachability.test.ts) reads this file once its extra glob lists it.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import { STEMI_CALL_TEXT, type AdHocSetup } from "../adhoc";
import type { LabRaises } from "../../../content/lab/raisable/waiting";

const TIMING = "pm-target-timing";
const HEART_TEAM = "pm-target-heart-team";
const CONSENT = "pm-planning-consent";

const CLEAN = { allergies: { contrast: "none" as const }, anticoagulation: "none" as const, rhythm: "sinus" as const };
const NO_ACCESS_HISTORY = "No previous arterial access.";
const SIMPLE_CONSENT = "Signed for coronary angiography and possible angioplasty.";

/** The diagnostic study the cases open after (MODEL PARAMETERS: a routine study's contrast and dose). */
export const ADHOC_DIAGNOSTIC = { contrastMl: 70, fluoroS: 240, karMGy: 350, kapGyCm2: 25 };

/** The STEMI call of the late-evening case: seconds after the gate opens (it comes sooner if the learner decides first). */
export const LATE_CALL_AFTER_S = 20;
/** The late-evening case's start, minutes after midnight (19:10). */
export const LATE_START_MIN = 19 * 60 + 10;

/** The autopilot's return from its empty study (it films no runs); the team's study below replaces it in the log. */
const EMPTY_RETURN = /^Back from the angiography: contrast 0 mL so far\.$/;

/**
 * The diagnostic study's contrast and dose (the autopilot gives none), then the case is at the gate. The
 * contrast goes into the patient engine; the dose is booked as the diagnostic lab's return (the lab
 * totals), so the access stage's own fluoroscopy, which the Fluoroscopy workspace rewrites from its own
 * tracker, never overwrites it. The scripted events keyed to 'return' have already fired (once per hook).
 */
const afterStudy = (s: CaseSession) => {
  s.patient.contrast(ADHOC_DIAGNOSTIC.contrastMl, "root");
  // the engine books the contrast as it runs: a few seconds pass
  s.wait(2, "Reviewing the runs");
  s.runPending();
  const stale = s.log.findIndex((l) => l.kind === "event" && EMPTY_RETURN.test(l.text));
  if (stale >= 0) s.log.splice(stale, 1);
  s.returnFromLab("diagnostic", { contrastMl: 0, fluoroS: ADHOC_DIAGNOSTIC.fluoroS, karMGy: ADHOC_DIAGNOSTIC.karMGy, kapGyCm2: ADHOC_DIAGNOSTIC.kapGyCm2 });
};

/**
 * The team's report of the diagnostic study, shown on the gate until the learner files their own (MODEL
 * PARAMETERS: each is the seed's generated anatomy with the stenoses rounded to 5% as a visual estimate;
 * adhoc.test.ts checks that each names every significant lesion's vessel).
 */
export const ADHOC_FINDINGS: Record<string, string> = {
  "adhoc-left-main-stable":
    "Diagnostic study (reported by the attending, visual estimate): left main 70%; LAD 90%; first diagonal 65%; circumflex and right coronary minor irregularities. Right dominant.",
  "adhoc-cto-stable": "Diagnostic study (reported by the attending, visual estimate): LAD total occlusion, chronic; first diagonal 30%; right coronary 40%. Right dominant.",
  "adhoc-mvd-stable": "Diagnostic study (reported by the attending, visual estimate): LAD 85%; circumflex 90%; right coronary 80%. Left dominant.",
  "adhoc-acs-ongoing": "Diagnostic study (reported by the attending, visual estimate): LAD 95% with thrombus; circumflex and right coronary minor irregularities. Right dominant.",
  "adhoc-consent-diagnostic-only": "Diagnostic study (reported by the attending, visual estimate): LAD 85%; no other stenosis. Right dominant.",
  "adhoc-complication": "Diagnostic study (reported by the attending, visual estimate): LAD 85% over about 30 mm; no other stenosis. Left dominant.",
  "adhoc-late-evening-stemi-call": "Diagnostic study (reported by the attending, visual estimate): LAD 85%; no other stenosis. Left dominant.",
};

type AdHocScenario = ProcedureScenario & { adhoc: AdHocSetup };

const AT_GATE = { openAtStart: true } satisfies AdHocSetup;

export const scenarios: AdHocScenario[] = [
  {
    id: "adhoc-left-main-stable",
    title: "Ad hoc or delayed PCI: left main disease in stable angina",
    lessonIds: [TIMING, HEART_TEAM],
    seed: "adhoc-lm-40",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": SIMPLE_CONSENT },
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-left-main-stable"] },
  },
  {
    id: "adhoc-cto-stable",
    title: "Ad hoc or delayed PCI: a chronic total occlusion in stable angina",
    lessonIds: [TIMING],
    seed: "adhoc-cto-69",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": SIMPLE_CONSENT },
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-cto-stable"] },
  },
  {
    id: "adhoc-mvd-stable",
    title: "Ad hoc or delayed PCI: three-vessel disease in stable angina",
    lessonIds: [TIMING, HEART_TEAM],
    seed: "adhoc-mvd-4",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": SIMPLE_CONSENT },
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-mvd-stable"] },
  },
  {
    id: "adhoc-acs-ongoing",
    title: "Ad hoc or delayed PCI: anterior STEMI with ongoing pain",
    lessonIds: [TIMING],
    seed: "adhoc-acs-1",
    access: "radial-right",
    indication: "STEMI",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": "Signed for coronary angiography and primary PCI." },
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-acs-ongoing"] },
  },
  {
    id: "adhoc-consent-diagnostic-only",
    title: "Ad hoc or delayed PCI: consent for the diagnostic study only",
    lessonIds: [TIMING, CONSENT],
    seed: "adhoc-simple-7",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": "Signed for diagnostic coronary angiography only." },
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-consent-diagnostic-only"], consent: { limit: "diagnostic-only", wording: "Signed for diagnostic coronary angiography only." } },
  },
  {
    id: "adhoc-complication",
    title: "Ad hoc or delayed PCI: after a complication of the diagnostic study",
    lessonIds: [TIMING],
    seed: "adhoc-simple-14",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": SIMPLE_CONSENT },
    script: [
      {
        at: "return",
        complication: { id: "diagnostic-vf", label: "Ventricular fibrillation during a coronary injection: one shock, back in sinus rhythm", severity: "major" },
        log: { kind: "event", text: "During the diagnostic study: ventricular fibrillation on a coronary injection, one shock, sinus rhythm restored." },
      },
    ],
    state: afterStudy,
    adhoc: { ...AT_GATE, interruption: null, studyFindings: ADHOC_FINDINGS["adhoc-complication"] },
  },
  {
    id: "adhoc-late-evening-stemi-call",
    title: "Ad hoc or delayed PCI: late in the evening, a STEMI call",
    lessonIds: [TIMING],
    seed: "adhoc-simple-32",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": SIMPLE_CONSENT },
    state: afterStudy,
    adhoc: {
      ...AT_GATE,
      studyFindings: ADHOC_FINDINGS["adhoc-late-evening-stemi-call"],
      clockStartMin: LATE_START_MIN,
      interruption: { kind: "stemi-call", afterS: LATE_CALL_AFTER_S, text: STEMI_CALL_TEXT },
    },
  },
];

/** What the gate reports for the tips (see the header). */
export const raises: readonly LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: ["high-contrast-volume", "high-radiation-dose"] }];
