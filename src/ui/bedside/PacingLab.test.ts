// The pacing tab's launch handling, what its screens show by mode, and a server-side render of every
// scenario and variant (pacing-in-lab-scenarios-and-tips).
//   npx vitest run src/ui/bedside/PacingLab.test.ts
import { describe, expect, it } from "vitest";
import { PACING_SCENARIOS, PACING_VARIANTS, type PacingScenarioId } from "../../simulation/pacing";

describe("pacing launches", () => {
  it("a link names a scenario, a variant and a mode; unknown names are dropped; a held-out variant always runs as an exam", async () => {
    const { resolvePacingLaunch } = await import("./PacingLab");
    expect(resolvePacingLaunch({ scenario: "inlab-adenosine-avb", variant: "transient", mode: "supervised" }, 2)).toEqual({ scenario: "inlab-adenosine-avb", variant: "transient", mode: "supervised", seq: 2 });
    expect(resolvePacingLaunch({ scenario: "inlab-rca-chb-rbbb", variant: "exam", mode: "guided" }, 3)).toEqual({ scenario: "inlab-rca-chb-rbbb", variant: "exam", mode: "exam", seq: 3 });
    expect(resolvePacingLaunch({ scenario: "inlab-rca-chb-rbbb", variant: "nope" }, 4)).toEqual({ scenario: "inlab-rca-chb-rbbb", variant: null, mode: null, seq: 4 });
    expect(resolvePacingLaunch({ scenario: "nope", mode: "loud" }, 5)).toEqual({ scenario: null, variant: null, mode: null, seq: 5 });
    expect(resolvePacingLaunch({ preset: "tavi-chb", mode: "exam" }, 6)).toEqual({ scenario: "tavi-chb", variant: null, mode: "exam", seq: 6 });
  });

  it("outside guided practice a lead message keeps what the operator feels and drops where the tip is", async () => {
    const { perceivedLeadMessage } = await import("./PacingLab");
    expect(perceivedLeadMessage("The lead has entered the coronary sinus: it runs up and leftward on AP but POSTERIORLY on the lateral view. Withdraw and redirect anteriorly.")).toBeNull();
    expect(perceivedLeadMessage("The tip is in the right atrium: large atrial deflections on the tip electrogram.")).toBeNull();
    expect(perceivedLeadMessage("Firm resistance: the tip is wedged against the myocardium. Do not push further.")?.text).toBe("Firm resistance at the tip.");
    expect(perceivedLeadMessage("The lead has crossed the tricuspid valve: the ventricular deflection on the tip electrogram becomes large. It is still free in the cavity.")?.text).toMatch(/ectopics/);
    expect(perceivedLeadMessage("Perforation: the lead has been pushed through the RV wall.")?.text).not.toMatch(/perforat/i);
  });
});

describe("rendering", () => {
  const all: { id: PacingScenarioId; variant: string | null }[] = PACING_SCENARIOS.flatMap((s) => [
    { id: s.id, variant: null },
    ...(PACING_VARIANTS[s.id] ?? []).map((v) => ({ id: s.id, variant: v.id })),
  ]);

  it("every scenario and variant renders in guided practice and in an exam", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { default: PacingLab } = await import("./PacingLab");
    for (const { id, variant } of all)
      for (const mode of ["guided", "exam"] as const) {
        const html = renderToString(createElement(PacingLab, { initial: { scenario: id, variant, mode, seq: 1 } }));
        expect(html.length, `${id}~${variant} ${mode}`).toBeGreaterThan(1000);
      }
  });

  it("an in-lab run opens on the initial management; an exam shows no tips panel, tip location or rhythm label", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { default: PacingLab } = await import("./PacingLab");
    const guided = renderToString(createElement(PacingLab, { initial: { scenario: "inlab-amiodarone-avb", variant: null, mode: "guided", seq: 1 } }));
    expect(guided).toContain("Initial management");
    expect(guided).toContain("Stop the amiodarone infusion");
    expect(guided).toContain("Femoral venous wire");
    expect(guided).toContain('aria-label="Technique"');
    expect(guided).toContain("Guided practice");
    // the box opens reading volts in the in-lab scenarios
    expect(guided).toMatch(/Output reads in <!-- -->volts|Output reads in volts/);

    const exam = renderToString(createElement(PacingLab, { initial: { scenario: "inlab-amiodarone-avb", variant: "exam", mode: "guided", seq: 1 } }));
    expect(exam).toContain("Exam");
    // the tips panel (LabTipsPanel, aria-label = its title "Technique") renders nothing in an exam
    expect(exam).not.toContain('aria-label="Technique"');
    expect(exam).not.toContain("Ask for a tip");
    expect(exam).not.toContain("instructor view");
    expect(exam).not.toContain("Complete heart block");
    expect(exam).toContain("Initial management");

    // the adenosine scenario offers a cough but no infusion to stop
    const aden = renderToString(createElement(PacingLab, { initial: { scenario: "inlab-adenosine-avb", variant: "persistent", mode: "independent", seq: 1 } }));
    expect(aden).toContain("Ask the patient to cough");
    expect(aden).not.toContain("Stop the amiodarone infusion");
  });

  it("a ward scenario opens as before, on a box reading milliamps", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { default: PacingLab } = await import("./PacingLab");
    const html = renderToString(createElement(PacingLab));
    expect(html).toContain("Prepare for transvenous pacing");
    expect(html).not.toContain("Initial management");
    expect(html).toMatch(/Output reads in <!-- -->milliamps|Output reads in milliamps/);
  });
});

describe("live screens outside guided practice", () => {
  const checklistProps = {
    units: "V" as const,
    margin: 3,
    box: { mode: "VVI" as const, rate: 70, output: 3, sensitivity: 2, connected: true },
    intrinsic: 0,
    thresholdMeasured: 0.6,
    sensingSkipped: false,
    thrNow: 0.6,
    r: 8,
    tPaced: 1,
    pacedPct: 100,
    onSkipSensing: () => {},
    onHandover: () => {},
  };

  it("the test checklist names pacing dependence only in guided practice; otherwise the learner makes the call", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { TestChecklist } = await import("./PacingLab");
    const { getPacingScenario, sensingTestable } = await import("../../simulation/pacing");
    // the adenosine block has no escape rhythm: the patient is pacing dependent
    expect(sensingTestable(getPacingScenario("inlab-adenosine-avb", "exam"))).toBe(false);
    const guided = renderToString(createElement(TestChecklist, { ...checklistProps, guided: true, scenarioDependent: true, sensingMeasured: null }));
    expect(guided).toContain("Pacing dependent: do not turn the rate down");
    for (const scenarioDependent of [true, false]) {
      const live = renderToString(createElement(TestChecklist, { ...checklistProps, guided: false, scenarioDependent, sensingMeasured: null }));
      expect(live).not.toContain("Pacing dependent: do not turn");
      expect(live).toContain("if the patient is pacing dependent, do not turn the rate down");
      expect(live).toContain("Pacing dependent: sensing not tested");
    }
    // the computed sensitivity advice is a guided aid
    const measured = renderToString(createElement(TestChecklist, { ...checklistProps, guided: false, scenarioDependent: false, sensingMeasured: 8 }));
    expect(measured).not.toContain("mV or lower");
    expect(measured).not.toContain("Pacing dependent: sensing not tested");
    expect(renderToString(createElement(TestChecklist, { ...checklistProps, guided: true, scenarioDependent: false, sensingMeasured: 8 }))).toContain("mV or lower");
  });

  it("the in-lab actions stay open after the wire is started: the infusion can still be stopped", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { InLabChoices } = await import("./PacingLab");
    const { applyInitialAction, getPacingScenario, initialInLabState } = await import("../../simulation/pacing");
    const sc = getPacingScenario("inlab-amiodarone-avb");
    const st = applyInitialAction(sc, initialInLabState(10), "femoral-wire", 12);
    const html = renderToString(
      createElement(InLabChoices, { sc, st, now: 20, waitUntil: null, guided: false, supportedAt: null, compact: true, onAction: () => {}, onFinish: () => {} })
    );
    expect(html).toContain("Stop the amiodarone infusion");
    expect(html).toContain("External pacing");
    expect(html).not.toContain("Femoral venous wire");
    expect(html).not.toMatch(/Wait and watch|\(30 s\)/);
  });

  it("a patient who no longer responds cannot be asked to cough", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { InLabChoices } = await import("./PacingLab");
    const { getPacingScenario, initialInLabState } = await import("../../simulation/pacing");
    const sc = getPacingScenario("inlab-adenosine-avb", "persistent");
    const props = { sc, st: initialInLabState(10), now: 40, waitUntil: null, guided: false, supportedAt: null, onAction: () => {}, onFinish: () => {} };
    const awake = renderToString(createElement(InLabChoices, props));
    expect(awake).not.toContain("(no response)");
    const out = renderToString(createElement(InLabChoices, { ...props, responsive: false }));
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>Ask the patient to cough(<!-- -->)? \(no response\)/);
  });
});
