// Brilakis's stable revascularisation algorithm and the heart-team rule (angio-decision-drills).
//   npx vitest run src/content/decisions/revascStable.test.ts
import { describe, expect, it } from "vitest";
import { TRACKS } from "../index";
import { TIP_BY_ID, tipsFor } from "../lab/tips";
import {
  REVASC_TIP_IDS,
  STABLE_FACTS,
  STABLE_STEPS,
  STABLE_STEP_SOURCE,
  STEP_OPTIONS,
  decideStable,
  prognosticCriteria,
  revascRevealTips,
  scoreStable,
  vignetteRows,
  type StableInputs,
} from "./revascStable";

const base: StableInputs = {
  symptoms: "angina",
  extent: { vessels: 3, leftMain: false, proximalLad: false },
  ischaemiaPct: null,
  lvef: 55,
  priorCabg: false,
  diabetes: false,
  surgicalCandidate: "good",
  complexity: "less-complex",
};
const v = (p: Partial<StableInputs>): StableInputs => ({ ...base, ...p, extent: { ...base.extent, ...(p.extent ?? {}) } });

describe("the acceptance cases", () => {
  it("an asymptomatic single-vessel patient without proximal LAD disease or > 10% ischaemia returns 'no revascularisation'", () => {
    const d = decideStable(v({ symptoms: "none", extent: { vessels: 1, leftMain: false, proximalLad: false }, ischaemiaPct: 5 }));
    expect(d.outcome).toBe("none");
    expect(d.branch).toBe("none");
    expect(d.path.map((s) => s.step)).toEqual(["symptoms", "extent", "benefit-risk", "preference"]);
    expect(d.path.find((s) => s.step === "benefit-risk")?.answer).toBe("not-reached");
    // exactly at 10% is not over 10%
    expect(decideStable(v({ symptoms: "none", extent: { vessels: 1, leftMain: false, proximalLad: false }, ischaemiaPct: 10 })).outcome).toBe("none");
    // either criterion moves it to the benefit–risk question, and PCI
    expect(decideStable(v({ symptoms: "none", extent: { vessels: 1, leftMain: false, proximalLad: false }, ischaemiaPct: 12 })).outcome).toBe("pci");
    expect(decideStable(v({ symptoms: "none", extent: { vessels: 1, leftMain: false, proximalLad: true }, ischaemiaPct: 5 })).outcome).toBe("pci");
  });

  it("diabetes with multivessel disease and a good surgical candidate returns 'CABG'", () => {
    const d = decideStable(v({ diabetes: true, surgicalCandidate: "good", complexity: "less-complex" }));
    expect(d.outcome).toBe("cabg");
    expect(d.branch).toBe("cabg");
    expect(d.noAdHocPci).toBe(true);
    // complexity is asked only without diabetes
    expect(d.path.map((s) => s.step)).toEqual(["symptoms", "extent", "prior-cabg", "diabetes", "surgical-candidate", "benefit-risk", "preference"]);
    // two-vessel disease and left main disease too
    expect(decideStable(v({ diabetes: true, extent: { vessels: 2, leftMain: false, proximalLad: false } })).outcome).toBe("cabg");
    expect(decideStable(v({ diabetes: true, extent: { vessels: 0, leftMain: true, proximalLad: false } })).outcome).toBe("cabg");
  });
});

describe("the rest of the algorithm, in Brilakis's order", () => {
  it("previous CABG favours PCI before diabetes is asked", () => {
    const d = decideStable(v({ priorCabg: true, diabetes: true }));
    expect(d.outcome).toBe("pci");
    expect(d.path.map((s) => s.step)).not.toContain("diabetes");
    expect(decideStable(v({ priorCabg: true, benefitOutweighsRisk: false })).outcome).toBe("none");
  });

  it("diabetes in a poor surgical candidate goes to PCI; complex disease without diabetes to CABG or PCI by candidacy", () => {
    expect(decideStable(v({ diabetes: true, surgicalCandidate: "poor" })).outcome).toBe("pci");
    expect(decideStable(v({ complexity: "complex", surgicalCandidate: "good" })).outcome).toBe("cabg");
    expect(decideStable(v({ complexity: "complex", surgicalCandidate: "poor" })).outcome).toBe("pci");
    const complex = decideStable(v({ complexity: "complex" })).path.map((s) => s.step);
    expect(complex.indexOf("complexity")).toBeLessThan(complex.indexOf("surgical-candidate"));
  });

  it("the heart-team rule: less complex multivessel disease without diabetes in a good surgical candidate keeps PCI and CABG, so the heart team", () => {
    const d = decideStable(v({}));
    expect(d.branch).toBe("pci");
    expect(d.outcome).toBe("heart-team");
    expect(d.noAdHocPci).toBe(true);
    expect(d.explanation).toMatch(/heart-team discussion is needed and ad hoc PCI should not be performed/);
    // a poor surgical candidate has no equal surgical option
    expect(decideStable(v({ surgicalCandidate: "poor" })).outcome).toBe("pci");
    // the 2024 ESC statement is quoted for three-vessel disease only
    expect(d.explanation).toMatch(/2024 ESC/);
    // less complex disease skips the surgical-candidate question in the figure
    expect(d.path.map((s) => s.step)).toEqual(["symptoms", "extent", "prior-cabg", "diabetes", "complexity", "benefit-risk", "preference"]);
  });

  it("the heart-team explanation follows the anatomy: two-vessel and left main disease do not cite the 2024 ESC three-vessel statement", () => {
    const two = decideStable(v({ extent: { vessels: 2, leftMain: false, proximalLad: false } }));
    expect(two.outcome).toBe("heart-team");
    expect(two.explanation).toMatch(/no threshold for two-vessel disease, so PCI or CABG/);
    expect(two.explanation).toMatch(/reasons to defer ad hoc PCI/);
    expect(two.explanation).not.toMatch(/2024 ESC|class I/);
    const lm = decideStable(v({ extent: { vessels: 1, leftMain: true, proximalLad: false } }));
    expect(lm.outcome).toBe("heart-team");
    expect(lm.explanation).toMatch(/left main disease \(SYNTAX 0–32\)/);
    expect(lm.explanation).toMatch(/similar benefit/);
    expect(lm.explanation).not.toMatch(/2024 ESC|class I/);
  });

  it("asymptomatic multivessel disease goes on only with ischaemia over 10%, LVEF below 35% or left main disease", () => {
    const quiet = v({ symptoms: "none", ischaemiaPct: 5, lvef: 55 });
    expect(decideStable(quiet).outcome).toBe("none");
    expect(prognosticCriteria(quiet)).toEqual([]);
    expect(decideStable({ ...quiet, lvef: 30 }).outcome).toBe("heart-team");
    expect(decideStable({ ...quiet, lvef: 35 }).outcome).toBe("none");
    expect(decideStable({ ...quiet, ischaemiaPct: 15, diabetes: true }).outcome).toBe("cabg");
    expect(decideStable({ ...quiet, extent: { vessels: 2, leftMain: true, proximalLad: false } }).outcome).toBe("heart-team");
    // proximal LAD is a single-vessel criterion only
    expect(prognosticCriteria({ ...quiet, extent: { vessels: 3, leftMain: false, proximalLad: true } })).toEqual([]);
  });

  it("single-vessel symptomatic disease is PCI, and no disease is no revascularisation; single-vessel disease allows ad hoc PCI", () => {
    const one = decideStable(v({ extent: { vessels: 1, leftMain: false, proximalLad: true } }));
    expect(one.outcome).toBe("pci");
    expect(one.noAdHocPci).toBe(false);
    expect(decideStable(v({ extent: { vessels: 0, leftMain: false, proximalLad: false } })).outcome).toBe("none");
  });

  it("the patient's preference closes every path and every step offers its expected answer", () => {
    const cases: StableInputs[] = [v({}), v({ diabetes: true }), v({ symptoms: "none", extent: { vessels: 1, leftMain: false, proximalLad: false } }), v({ priorCabg: true })];
    for (const c of cases) {
      const d = decideStable(c);
      expect(d.path[d.path.length - 1].step).toBe("preference");
      const order = d.path.map((s) => STABLE_STEPS.indexOf(s.step));
      // steps appear in Brilakis's order, apart from candidacy, which follows complexity in the figure
      expect(order.filter((x) => x !== STABLE_STEPS.indexOf("surgical-candidate"))).toEqual([...order.filter((x) => x !== STABLE_STEPS.indexOf("surgical-candidate"))].sort((a, b) => a - b));
      for (const s of d.path) expect(STEP_OPTIONS[s.step].map((o) => o.id), s.step).toContain(s.answer);
    }
  });
});

describe("sources and scoring", () => {
  it("every step cites a lesson of the curriculum and a Brilakis location", () => {
    const lessons = new Set<string>();
    for (const t of TRACKS) for (const m of t.modules) for (const l of m.lessons) lessons.add(l.id);
    for (const s of STABLE_STEPS) {
      expect(lessons.has(STABLE_STEP_SOURCE[s].lessonId), s).toBe(true);
      expect(STABLE_STEP_SOURCE[s].sources.some((x) => x.book === "brilakis-pci"), s).toBe(true);
    }
    for (const f of STABLE_FACTS) expect(STABLE_STEPS).toContain(f.step);
  });

  it("scoreStable: the outcome and each step the algorithm reached", () => {
    const inputs = v({ diabetes: true });
    const right = scoreStable(inputs, { steps: { symptoms: "yes", extent: "multi", "prior-cabg": "no", diabetes: "yes", "surgical-candidate": "good", "benefit-risk": "yes" }, outcome: "cabg" });
    expect(right.outcomeCorrect).toBe(true);
    expect(right.stepsCorrect).toBe(right.steps.length);
    const wrong = scoreStable(inputs, { steps: { symptoms: "yes", extent: "multi", diabetes: "no" }, outcome: "pci" });
    expect(wrong.outcomeCorrect).toBe(false);
    expect(wrong.steps.find((s) => s.step === "diabetes")).toMatchObject({ expected: "yes", given: "no", correct: false });
    expect(wrong.steps.find((s) => s.step === "prior-cabg")).toMatchObject({ given: null, correct: false });
  });

  it("the reveal shows pci-plan-name-the-goal and diag-stop-for-heart-team, selected by their own triggers", () => {
    const reg = { tipsFor, byId: TIP_BY_ID };
    expect(revascRevealTips(reg).map((t) => t.id)).toEqual([...REVASC_TIP_IDS]);
    expect(revascRevealTips(reg, { multivessel: true }).map((t) => t.id)).toEqual([...REVASC_TIP_IDS]);
    // single-vessel or no disease: the heart-team stop tip would be out of place
    expect(revascRevealTips(reg, { multivessel: false }).map((t) => t.id)).toEqual(["pci-plan-name-the-goal"]);
  });

  it("vignette rows show the chart's decision facts and never the extent or complexity", () => {
    const rows = vignetteRows({ inputs: v({ diabetes: true, lvef: null }), symptoms: "s", ischaemia: "i", surgicalRisk: "fit", surgicalRiskBand: "low", preference: "p" });
    expect(rows.map((r) => r.id)).toEqual(["symptoms", "diabetes", "prior-cabg", "lvef", "surgical-risk", "ischaemia", "preference"]);
    expect(rows.find((r) => r.id === "lvef")?.value).toBe("Not known");
    expect(rows.find((r) => r.id === "surgical-risk")?.value).toBe("Low: fit");
  });
});
