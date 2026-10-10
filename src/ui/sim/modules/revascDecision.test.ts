// The revascularisation decision step (angio-decision-drills) in the stable multi-vessel scenarios: it opens
// only after the study report, its contexts show the two tips the lab requests name, the learner's walk through
// Brilakis's algorithm is scored, and the waiting.ts entries naming this package become satisfiable from its
// raises export.
//   npx vitest run src/ui/sim/modules/revascDecision.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore, type SubmittedStudyReport } from "../../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../../../simulation/caseGenerator";
import { tipsFor } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { TIP_BY_ID, type TipTrigger } from "../../../content/lab/tips";
import { launch as multivesselLaunch } from "../../../simulation/diagnosticScenarios/multivessel.launch";
import { vignettes } from "../../../simulation/diagnosticScenarios/multivessel";
import { decideStable } from "../../../content/decisions/revascStable";
import { emptyStudyReport } from "../../../mentor/report";
import { DiagnosticLabSession } from "../labSession";
import { DECISION_QUESTIONS, REVASC_MODULE_ID, raises, revascDecisionOf } from "./revascDecision";

const g = () => useSimulatorStore.getState();
afterEach(() => g().loadCase(CASE_LIBRARY[0], "free"));

const IDS = multivesselLaunch.scenarios!.map((s) => s.id);

function session(id: string, seed = "1"): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, seed)!, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}

/** Submit a (blank) study report, as the finish step's submit button does. */
function submitReport() {
  const r: SubmittedStudyReport = { report: emptyStudyReport(), comparison: {} as SubmittedStudyReport["comparison"], pciTarget: null, submittedAt: 60 };
  g().submitStudyReport(r);
}

describe("the decision step in the multi-vessel scenarios", () => {
  it("diag-mvd-diabetes-fit: at phase 'plan' pci-plan-name-the-goal applies (tipsFor(ctx, 50); see the note on the limit of 20), and at phase 'finish' tipsFor(ctx, 20) includes diag-stop-for-heart-team", () => {
    const s = session("diag-mvd-diabetes-fit");
    try {
      const m = revascDecisionOf(s)!;
      expect(m).not.toBeNull();
      expect(m.applies()).toBe(true);
      // the PCI plan context
      const plan = m.contexts().plan;
      expect(plan).toMatchObject({ lab: "pci", phase: "plan" });
      // The tip applies in the plan context. With a limit of 20 it is not in the list: 41 PCI tips match a bare
      // 'plan' phase, ten cautions score higher, and the do-tips that tie with it are ordered by registry, which puts
      // it 29th. The reveal therefore selects it by id from the tips that apply (revascRevealTips, limit 50); moving
      // it up needs a trigger edit in its module file, which this package does not own (see the package report).
      const planIds = tipsFor(plan, 50).map((t) => t.id);
      expect(planIds).toContain("pci-plan-name-the-goal");
      // before the finish step the diagnostic lab is not at 'finish', and the heart-team tip is not shown in its context
      expect(s.tipContext().phase).not.toBe("finish");
      expect(tipsFor(s.tipContext(), 20).map((t) => t.id)).not.toContain("diag-stop-for-heart-team");
      // the action: open the finish step (the study report)
      s.setFinishStep(true);
      const finish = m.contexts().finish;
      expect(finish).toMatchObject({ lab: "diagnostic", phase: "finish" });
      expect(finish).toEqual(s.tipContext());
      expect(tipsFor(finish, 20).map((t) => t.id)).toContain("diag-stop-for-heart-team");
    } finally {
      s.dispose();
    }
  });

  it("opens only after the study report is submitted, and scores the learner's walk through the algorithm", () => {
    const s = session("diag-mvd-diabetes-fit");
    try {
      const m = revascDecisionOf(s)!;
      expect(m.isOpen()).toBe(false);
      // the chart and its decision facts are drawn with the step, so not before the report
      expect(m.chart()).toEqual([]);
      // nothing can be answered, and no truth is available, before the report
      m.choose("cabg");
      expect(m.answers().outcome).toBeNull();
      expect(m.submit()).toBeNull();
      expect(m.revealTips()).toEqual([]);
      submitReport();
      expect(m.isOpen()).toBe(true);
      // the chart is shown with the step: the patient chart's rows, then the decision facts
      const chart = m.chart().map((r) => r.id);
      expect(chart).toContain("patient");
      expect(chart.slice(-7)).toEqual(["symptoms", "diabetes", "prior-cabg", "lvef", "surgical-risk", "ischaemia", "preference"]);
      expect(m.chart().find((r) => r.id === "diabetes")?.value).toBe("Yes");
      // every question of the algorithm, in Brilakis's order
      expect(DECISION_QUESTIONS.map((q) => q.step)).toEqual(["symptoms", "extent", "prior-cabg", "diabetes", "surgical-candidate", "complexity", "benefit-risk", "preference"]);
      // the score is not available until the learner submits
      expect(m.score()).toBeNull();
      m.setStep("symptoms", "yes");
      m.setStep("extent", "multi");
      m.setStep("prior-cabg", "no");
      m.setStep("diabetes", "yes");
      m.setStep("surgical-candidate", "good");
      m.setStep("benefit-risk", "yes");
      m.setStep("symptoms", "not-an-option");
      expect(m.answers().steps.symptoms).toBe("yes");
      m.choose("cabg");
      const sc = m.submit()!;
      expect(sc.outcomeCorrect).toBe(true);
      expect(sc.decision.outcome).toBe("cabg");
      expect(sc.stepsCorrect).toBe(sc.steps.length);
      // submitted: the answer is fixed
      m.choose("pci");
      expect(m.answers().outcome).toBe("cabg");
      expect(m.revealTips().map((t) => t.id)).toEqual(["pci-plan-name-the-goal", "diag-stop-for-heart-team"]);
    } finally {
      s.dispose();
    }
  });

  it("each scenario's decision is the one its checks teach; a case without a vignette has no step", () => {
    const want: Record<string, string> = {
      "diag-mvd-diabetes-fit": "cabg",
      "diag-mvd-two-vessel-heart-team": "heart-team",
      "diag-mvd-diabetes-frail": "pci",
      "diag-svd-asymptomatic-small-territory": "none",
    };
    expect(IDS.sort()).toEqual(Object.keys(want).sort());
    for (const id of IDS) expect(decideStable(vignettes[id].inputs).outcome, id).toBe(want[id]);
    const s = session("diag-beyond-consent-lm");
    try {
      const m = revascDecisionOf(s)!;
      expect(m.id).toBe(REVASC_MODULE_ID);
      expect(m.applies()).toBe(false);
      submitReport();
      expect(m.isOpen()).toBe(false);
      expect(m.chart()).toEqual([]);
    } finally {
      s.dispose();
    }
  });
});

describe("reachability", () => {
  const list: readonly LabRaises[] = raises;
  const can = (lab: string, when: TipTrigger, phases: readonly string[] | undefined) =>
    list.some(
      (r) =>
        r.lab === lab &&
        (!phases?.length || phases.some((p) => r.phases.includes(p as never))) &&
        (!when.event?.length || when.event.some((e) => r.events.includes(e))) &&
        (when.requires ?? []).every((e) => r.events.includes(e))
    );

  it("raises declares only the diagnostic finish phase (the live context), so diag-stop-for-heart-team is satisfiable from it", () => {
    expect(list).toEqual([{ lab: "diagnostic", phases: ["finish"], events: [] }]);
    const t = TIP_BY_ID["diag-stop-for-heart-team"];
    expect(can(t.lab, t.when, t.when.phase)).toBe(true);
    // pci-plan-name-the-goal is a PCI tip: a diagnostic session never raises a PCI phase, so it is not declared here
    // (the reveal reads it from a synthetic PCI plan context; pciEvents/base.ts raises the PCI phases)
    const p = TIP_BY_ID["pci-plan-name-the-goal"];
    expect(can(p.lab, p.when, p.when.phase)).toBe(false);
  });

  it("every waiting.ts entry naming angio-decision-drills becomes satisfiable from this module's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === "angio-decision-drills").flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "angio-decision-drills");
    for (const id of waiting) {
      const t = TIP_BY_ID[id];
      expect(can(t.lab, t.when, t.when.phase), id).toBe(true);
    }
    for (const d of deferred) expect(can(TIP_BY_ID[d.tipId].lab, d.when, d.when.phase), d.tipId).toBe(true);
    // waiting.ts names this package in no entry today (the two tips wait on diag-tip-context and pci-tip-context,
    // which raise the same phases), so the pci lab's waiting count falls by the number above, zero at present
    console.info(`waiting.ts entries naming angio-decision-drills: ${waiting.length + deferred.length}`);
  });
});
