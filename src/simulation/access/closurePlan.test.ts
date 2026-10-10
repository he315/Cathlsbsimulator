// access-closure-femoral-manual: the femoral closure algorithm (pm-closure-plan; Brilakis 11.1) on its own and on
// the closure scenarios' anatomy.
import { describe, it, expect } from "vitest";
import {
  CLOSURE_ALGORITHM,
  closureAlgorithm,
  gradeClosureAnswers,
  gradeClosureChoice,
  keptSheathSwap,
  type ClosureAnatomy,
  type ClosureChoice,
  type ClosureEndState,
} from "./closurePlan";
import { newCaseSession, type CaseSession } from "../session/caseSession";

const CLEAN: ClosureAnatomy = { highStick: false, atOrBelowBifurcation: false, inBranch: false, over5mm: true, atheroma: false, heavyCalcium: false, oldPlug: false };
const END: ClosureEndState = { actS: 160, sysMmHg: 130, sheathFr: 6, sheathLengthCm: 10, stagedPciSoon: false, supportDeviceLikely: false, oozeAroundSheath: false };
const DEVICES: ClosureChoice[] = ["suture-device", "collagen-plug"];

/** The plan's inputs as a scenario opens. */
function opened(id: string): { s: CaseSession; st: ClosureEndState; a: ClosureAnatomy } {
  const s = newCaseSession({ scenario: id }).session;
  const a = s.closureAnatomy();
  expect(a, id).not.toBeNull();
  return { s, st: s.closureEndState(), a: a! };
}

describe("the femoral closure algorithm (pure)", () => {
  it("asks the four questions in order: the sheath stays for a staged PCI, a device needs a clean CFA above 5 mm entered above the bifurcation, a high stick excludes the plug, and without a device the ACT decides", () => {
    expect(closureAlgorithm({ ...END, stagedPciSoon: true }, CLEAN)).toMatchObject({ answers: { sheath: "stays" }, allowed: ["keep-suture"] });
    expect(closureAlgorithm({ ...END, supportDeviceLikely: true }, CLEAN).allowed).toEqual(["keep-suture"]);
    // ooze around the sheath takes it out even with a staged PCI
    expect(closureAlgorithm({ ...END, stagedPciSoon: true, oozeAroundSheath: true }, CLEAN).answers.sheath).toBe("out");
    expect(closureAlgorithm(END, CLEAN)).toMatchObject({ answers: { sheath: "out", deviceOk: true, highStick: false }, allowed: ["suture-device", "collagen-plug", "manual-compression"] });
    expect(closureAlgorithm(END, { ...CLEAN, highStick: true }).allowed).toEqual(["suture-device", "manual-compression"]);
    expect(closureAlgorithm({ ...END, actS: 240 }, { ...CLEAN, heavyCalcium: true }).allowed).toEqual(["collagen-plug", "wait-then-compress"]);
    for (const bad of [{ atOrBelowBifurcation: true }, { inBranch: true }, { over5mm: false }, { atheroma: true }]) {
      const v = closureAlgorithm({ ...END, actS: 240 }, { ...CLEAN, ...bad });
      expect(v.answers).toEqual({ sheath: "out", deviceOk: false, actBelow180: false });
      expect(v.allowed).toEqual(["wait-then-compress"]);
      expect(closureAlgorithm({ ...END, actS: 170 }, { ...CLEAN, ...bad }).allowed).toEqual(["manual-compression"]);
    }
  });

  it("grades a choice by the rules, with a device above an ACT of 300 s acceptable with a caution", () => {
    expect(gradeClosureChoice({ ...END, actS: 240 }, CLEAN, "manual-compression").verdict).toBe("wrong");
    expect(gradeClosureChoice({ ...END, actS: 170 }, CLEAN, "manual-compression").verdict).toBe("correct");
    expect(gradeClosureChoice({ ...END, actS: 170 }, CLEAN, "wait-then-compress").verdict).toBe("wrong");
    expect(gradeClosureChoice({ ...END, actS: 320 }, CLEAN, "suture-device")).toMatchObject({ verdict: "acceptable" });
    expect(gradeClosureChoice({ ...END, actS: CLOSURE_ALGORITHM.deviceDiscouragedActS }, CLEAN, "suture-device").verdict).toBe("correct");
    expect(gradeClosureChoice({ ...END, stagedPciSoon: true }, CLEAN, "suture-device").verdict).toBe("wrong");
    expect(gradeClosureChoice({ ...END, stagedPciSoon: true }, CLEAN, "keep-suture").verdict).toBe("correct");
    expect(gradeClosureChoice(END, CLEAN, "keep-suture").verdict).toBe("wrong");
    expect(gradeClosureChoice(END, { ...CLEAN, heavyCalcium: true }, "suture-device").verdict).toBe("wrong");
    expect(gradeClosureChoice(END, { ...CLEAN, heavyCalcium: true }, "collagen-plug").verdict).toBe("correct");
    expect(gradeClosureChoice(END, { ...CLEAN, oldPlug: true }, "collagen-plug").verdict).toBe("acceptable");
  });

  it("grades the answers question by question, only as far as the algorithm goes", () => {
    const v = closureAlgorithm({ ...END, actS: 240 }, { ...CLEAN, over5mm: false });
    expect(gradeClosureAnswers({ sheath: "out", deviceOk: false, actBelow180: false }, v).correct).toBe(true);
    const g = gradeClosureAnswers({ sheath: "out", deviceOk: true, highStick: false }, v);
    expect(g.correct).toBe(false);
    expect(g.items.map((i) => [i.key, i.correct])).toEqual([["sheath", true], ["deviceOk", false], ["actBelow180", false]]);
    // a sheath that stays ends the questions there
    const stays = closureAlgorithm({ ...END, stagedPciSoon: true }, CLEAN);
    expect(gradeClosureAnswers({ sheath: "stays" }, stays).items).toHaveLength(1);
  });

  it("a long sheath kept in is swapped for a 10-13 cm one", () => {
    expect(keptSheathSwap(25)).toBe(10);
    expect(keptSheathSwap(45)).toBe(10);
    expect(keptSheathSwap(10)).toBeNull();
  });
});

describe("the closure scenarios' anatomy", () => {
  it("closurePlan rejects a collagen plug for 'closure-fem-high-stick' and any device for 'closure-fem-below-bif' and 'closure-fem-small-artery'", () => {
    const high = opened("closure-fem-high-stick");
    expect(high.a.highStick).toBe(true);
    expect(gradeClosureChoice(high.st, high.a, "collagen-plug").verdict).toBe("wrong");
    expect(gradeClosureChoice(high.st, high.a, "collagen-plug").reasons.join(" ")).toMatch(/high stick/);
    // the suture device is preferred in a high stick (the ACT here is below 300 s)
    expect(high.st.actS).toBeLessThanOrEqual(CLOSURE_ALGORITHM.deviceDiscouragedActS);
    expect(gradeClosureChoice(high.st, high.a, "suture-device").verdict).toBe("correct");
    for (const id of ["closure-fem-below-bif", "closure-fem-small-artery"]) {
      const o = opened(id);
      for (const d of DEVICES) expect(gradeClosureChoice(o.st, o.a, d).verdict, `${id} ${d}`).toBe("wrong");
    }
    expect(opened("closure-fem-below-bif").a.atOrBelowBifurcation).toBe(true);
    expect(opened("closure-fem-small-artery").a.over5mm).toBe(false);
  });

  it("the other presets: a branch takes no device, heavy calcium no suture device, an old plug is a caution, a staged PCI keeps the sheath, the standard groin takes either", () => {
    const branch = opened("closure-fem-branch");
    expect(branch.a.inBranch).toBe(true);
    for (const d of DEVICES) expect(gradeClosureChoice(branch.st, branch.a, d).verdict).toBe("wrong");
    const calc = opened("closure-fem-calcified");
    expect(calc.a.heavyCalcium).toBe(true);
    expect(gradeClosureChoice(calc.st, calc.a, "suture-device").verdict).toBe("wrong");
    expect(gradeClosureChoice(calc.st, calc.a, "collagen-plug").verdict).not.toBe("wrong");
    const plug = opened("closure-fem-old-plug");
    expect(plug.a.oldPlug).toBe(true);
    expect(plug.s.chart.history.text).toMatch(/collagen-plug/);
    const staged = opened("closure-fem-staged-pci");
    expect(staged.st.stagedPciSoon).toBe(true);
    expect(closureAlgorithm(staged.st, staged.a).allowed).toEqual(["keep-suture"]);
    const std = opened("closure-fem-standard");
    expect(std.a).toEqual(CLEAN);
    for (const d of DEVICES) expect(gradeClosureChoice(std.st, std.a, d).verdict).toBe("correct");
  });

  it("in the session: the answers and the choice go to the ledger; a device below the bifurcation is recorded wrong; a sheath kept for a staged PCI closes the site with the sheath in", () => {
    const { s } = opened("closure-fem-below-bif");
    expect(s.answerClosureQuestions({ sheath: "out", deviceOk: false, actBelow180: s.closureEndState().actS < 180 })?.correct).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-closure-algorithm")?.correct).toBe(true);
    const g = s.chooseClosure("suture-device");
    expect(g?.verdict).toBe("wrong");
    s.runPending();
    const rec = s.decisions().find((d) => d.id === "femoral-closure-choice")!;
    expect(rec.correct).toBe(false);
    expect(rec.given).toMatch(/bifurcation/);
    expect(rec.lessonId).toBe("pm-closure-plan");
    expect(s.closureDone()).toBe(true);

    const k = opened("closure-fem-staged-pci").s;
    expect(k.chooseClosure("keep-suture")?.verdict).toBe("correct");
    k.runPending();
    expect(k.sheath).not.toBeNull();
    expect(k.activeSite.closure.kept).toBeTruthy();
    expect(k.closureDone()).toBe(true);
    expect(k.hookAt.recovery).toBeDefined();
  });
});
