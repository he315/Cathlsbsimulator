// The aortic valve study of the haemodynamics lab (haemo-aortic-stenosis-studies): the cross-or-not
// decision and its shared scoring rule, the crossing manoeuvre and its monitor, the gradient by
// method, the staged dobutamine study and its results table, and the launch metadata.
//   npx vitest run src/simulation/haemo/avCrossing.test.ts
import { describe, expect, it } from "vitest";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID, aorticGradient, gorlinLive, measure } from "../haemo";
import { gorlinAVA } from "../calc";
import { launch as asLaunch } from "../../content/lab/presets/haemo/aorticStenosis.launch";
import { launch as coreLaunch } from "../../content/lab/presets/haemo/core.launch";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import {
  CROSS_CATHETERS,
  CROSS_WIRES,
  LFLG,
  attemptDraw,
  avDecisions,
  avStudyEvents,
  avStudyReducer,
  canAttempt,
  currentStageLive,
  crossingProbability,
  ctCalciumReading,
  embolicRisk,
  expectedAttempts,
  femoralGradient,
  gradientReading,
  initialAvStudy,
  isAvStudy,
  isUnnecessaryCrossing,
  lflgResponse,
  manipulationQuality,
  peakStageIndex,
  stageEntryOk,
  stageReference,
  stopCriteria,
  unnecessaryCrossing,
  type AvAction,
  type AvStudyState,
  type CrossCatheter,
  type CrossWire,
} from "./avCrossing";

const play = (st: AvStudyState, ...as: AvAction[]) => as.reduce(avStudyReducer, st);
const ATTEMPT: AvAction = { type: "attempt", style: "controlled", inRoot: true };

/** Decide to cross, choose the kit and attempt (controlled) until the wire is across. */
function cross(id: string, catheter: CrossCatheter = "AL1", wire: CrossWire = "straight-hydrophilic", seed?: number, aortogram = false): AvStudyState {
  let st = play(initialAvStudy(id, seed), { type: "decide", decision: "cross" }, { type: "catheter", catheter }, { type: "wire", wire });
  if (aortogram) st = play(st, { type: "aortogram", inRoot: true });
  while (!st.wireAcross && st.attempts < 1000) st = avStudyReducer(st, ATTEMPT);
  return st;
}

/** Crossed into the LV with the AL1, exchanged for a pigtail, second arterial catheter in. */
const inLv = (id: string) => play(cross(id), { type: "advance" }, { type: "exchange" }, { type: "second-arterial", on: true });

describe("cross or not", () => {
  it("crossing in 'as-concordant-echo' is an unnecessary crossing; in 'as-discordant-cross' it is not", () => {
    const st = play(cross("as-concordant-echo"), { type: "advance" });
    expect(st.passages).toBe(1);
    expect(unnecessaryCrossing(st)).toBe(true);
    const d = avDecisions(st);
    expect(d.find((x) => x.id === "av-cross-decision")).toMatchObject({ correct: false, expected: "Do not cross: coronary angiography only" });
    expect(d.find((x) => x.id === "av-unnecessary-crossing")?.correct).toBe(false);

    const ok = play(cross("as-discordant-cross"), { type: "advance" });
    expect(unnecessaryCrossing(ok)).toBe(false);
    expect(avDecisions(ok).find((x) => x.id === "av-cross-decision")?.correct).toBe(true);
  });

  it("the shared rule: unnecessary only when the valve was passed without an indication", () => {
    expect(isUnnecessaryCrossing(false, true)).toBe(true);
    expect(isUnnecessaryCrossing(false, false)).toBe(false);
    expect(isUnnecessaryCrossing(true, true)).toBe(false);
    expect(isUnnecessaryCrossing(true, false)).toBe(false);
    // the wire across already counts as valve passage
    const wire = cross("as-concordant-echo");
    expect(wire.wireAcross).toBe(true);
    expect(unnecessaryCrossing(wire)).toBe(true);
  });

  it("declining to cross in the concordant scenario is right, and nothing can then be tried at the valve", () => {
    const st = play(initialAvStudy("as-concordant-echo"), { type: "decide", decision: "no-cross" }, { type: "catheter", catheter: "AL1" }, { type: "wire", wire: "straight-hydrophilic" }, ATTEMPT, { type: "aortogram", inRoot: true });
    expect(st.attempts).toBe(0);
    expect(st.aortogram).toBe(false);
    expect(unnecessaryCrossing(st)).toBe(false);
    expect(avDecisions(st)).toEqual([expect.objectContaining({ id: "av-cross-decision", correct: true })]);
  });

  it("the decision stands once the valve has been worked on", () => {
    const st = play(initialAvStudy("as-discordant-cross"), { type: "decide", decision: "cross" }, { type: "catheter", catheter: "AL1" }, { type: "wire", wire: "straight-hydrophilic" }, ATTEMPT);
    expect(play(st, { type: "decide", decision: "no-cross" }).decision).toBe("cross");
  });

  it("every valve-study scenario carries a report and an indication; the others none", () => {
    for (const s of HAEMO_SCENARIOS) {
      if (!isAvStudy(s)) continue;
      expect(s.avStudy!.report.length, s.id).toBeGreaterThan(1);
      expect(s.avStudy!.why.length, s.id).toBeGreaterThan(20);
      expect(s.events, s.id).toContain("aortic-stenosis");
    }
    expect(HAEMO_SCENARIOS.filter(isAvStudy).map((s) => s.id).sort()).toEqual(["as-concordant-echo", "as-discordant-cross", "lflg-no-reserve", "lflg-pseudo", "lflg-true"]);
    expect(SCENARIO_BY_ID["as-concordant-echo"].avStudy!.crossingIndicated).toBe(false);
    for (const id of ["as-discordant-cross", "lflg-true", "lflg-pseudo", "lflg-no-reserve"]) expect(SCENARIO_BY_ID[id].avStudy!.crossingIndicated, id).toBe(true);
    // a scenario without a valve study is left alone by the reducer
    const plain = initialAvStudy("aortic-stenosis");
    expect(play(plain, { type: "decide", decision: "cross" })).toBe(plain);
  });
});

describe("the crossing", () => {
  it("AL1 with a straight hydrophilic wire crosses in fewer attempts than a pigtail with a J wire", () => {
    expect(expectedAttempts("AL1", "straight-hydrophilic")).toBeLessThan(expectedAttempts("pigtail", "standard-j"));
    const mean = (c: CrossCatheter, w: CrossWire) => {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) n += cross("as-discordant-cross", c, w, seed).attempts;
      return n / 200;
    };
    const al1 = mean("AL1", "straight-hydrophilic");
    const pig = mean("pigtail", "standard-j");
    expect(al1).toBeLessThan(pig);
    expect(al1).toBeLessThan(5);
    // the same seed: the recommended kit never needs more attempts than the pigtail and J wire
    for (let seed = 1; seed <= 50; seed++) expect(cross("as-discordant-cross", "AL1", "straight-hydrophilic", seed).attempts).toBeLessThanOrEqual(cross("as-discordant-cross", "pigtail", "standard-j", seed).attempts);
  });

  it("the probabilities keep the lesson's order and are model parameters inside (0, 1)", () => {
    for (const c of CROSS_CATHETERS) for (const w of CROSS_WIRES) {
      const p = crossingProbability(c.id, w.id, false);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
      expect(crossingProbability(c.id, w.id, true)).toBeGreaterThanOrEqual(p);
    }
    expect(crossingProbability("AL1", "straight-hydrophilic", false)).toBeGreaterThan(crossingProbability("JR4", "straight-hydrophilic", false));
    expect(crossingProbability("JR4", "straight-hydrophilic", false)).toBeGreaterThan(crossingProbability("pigtail", "straight-hydrophilic", false));
    expect(crossingProbability("AL1", "straight-hydrophilic", false)).toBeGreaterThan(crossingProbability("AL1", "standard-j", false));
    // forceful pushing does not cross more often
    expect(crossingProbability("AL1", "straight-hydrophilic", false, "forceful")).toBe(crossingProbability("AL1", "straight-hydrophilic", false));
    // the draw is deterministic
    expect(attemptDraw(7, 3)).toBe(attemptDraw(7, 3));
  });

  it("an attempt needs the decision, the kit and the catheter in the aortic root", () => {
    const st = initialAvStudy("as-discordant-cross");
    expect(play(st, ATTEMPT).attempts).toBe(0);
    const kit = play(st, { type: "decide", decision: "cross" }, { type: "catheter", catheter: "AL1" });
    expect(canAttempt(kit)).toBe(false);
    const ready = play(kit, { type: "wire", wire: "straight-hydrophilic" });
    expect(canAttempt(ready)).toBe(true);
    expect(play(ready, { type: "attempt", style: "controlled", inRoot: false }).attempts).toBe(0);
    expect(play(ready, ATTEMPT).attempts).toBe(1);
  });

  it("the monitor flags forceful pushes; quality falls and embolic risk rises with force and time at the valve", () => {
    const ready = play(initialAvStudy("as-discordant-cross", 12345), { type: "decide", decision: "cross" }, { type: "catheter", catheter: "pigtail" }, { type: "wire", wire: "standard-j" });
    const pushed = play(ready, { type: "attempt", style: "forceful", inRoot: true });
    expect(pushed.forceful).toBe(1);
    expect(pushed.flag).toMatch(/Forceful/);
    expect(manipulationQuality(pushed)).toBeLessThan(manipulationQuality(play(ready, ATTEMPT)));
    expect(embolicRisk({ valveTimeS: 0, forceful: 0, passages: 1 })).toBe("low");
    expect(embolicRisk({ valveTimeS: 150, forceful: 0, passages: 1 })).toBe("rising");
    expect(embolicRisk({ valveTimeS: 300, forceful: 0, passages: 1 })).toBe("high");
    expect(embolicRisk({ valveTimeS: 30, forceful: 3, passages: 1 })).toBe("high");
    const controlled = play(cross("as-discordant-cross"), { type: "advance" });
    expect(controlled.forceful).toBe(0);
    expect(avDecisions(controlled).find((d) => d.id === "av-manipulation")?.correct).toBe(true);
    expect(avDecisions(controlled).find((d) => d.id === "av-crossing-kit")?.correct).toBe(true);
  });

  it("after a high-risk crossing a neurological event waits for the answer: stop and call the stroke team", () => {
    const long = play(cross("as-discordant-cross", "pigtail", "standard-j", 3), { type: "advance" });
    expect(embolicRisk(long)).toBe("high");
    expect(long.neuro).toBe("pending");
    // nothing else happens at the valve until it is answered
    expect(play(long, { type: "record-gradient", method: "pullback", artLine: false })).toBe(long);
    const stopped = play(long, { type: "neuro", response: "stop" });
    expect(stopped.neuro).toBe("stopped");
    expect(avDecisions(stopped).find((d) => d.id === "av-neuro-event")?.correct).toBe(true);
    expect(avDecisions(play(long, { type: "neuro", response: "continue" })).find((d) => d.id === "av-neuro-event")?.correct).toBe(false);
    // a clean crossing has none
    expect(play(cross("as-discordant-cross"), { type: "advance" }).neuro).toBe("none");
  });

  it("the AL1 goes into the LV and is exchanged for a pigtail; a pigtail that crossed needs no exchange", () => {
    const al1 = play(cross("as-discordant-cross"), { type: "advance" });
    expect(al1.inLv).toBe(true);
    expect(al1.pigtailInLv).toBe(false);
    const ex = play(al1, { type: "exchange" });
    expect(ex.pigtailInLv).toBe(true);
    expect(ex.exchanged).toBe(true);
    const pig = play(cross("as-discordant-cross", "pigtail", "straight-hydrophilic", 9), { type: "advance" });
    expect(pig.pigtailInLv).toBe(true);
  });
});

describe("the gradient by method", () => {
  it("the simultaneous mean gradient, the pullback peak-to-peak and the femoral gradient are different numbers", () => {
    const s = SCENARIO_BY_ID["as-discordant-cross"];
    const sim = gradientReading(s, "simultaneous");
    const pull = gradientReading(s, "pullback");
    const fem = gradientReading(s, "femoral");
    expect(sim.mean).toBe(Math.round(aorticGradient(s).mean));
    expect(pull.peakToPeak).toBe(measure(s, "LV").sys - measure(s, "Ao").sys);
    expect(sim.mean).toBeGreaterThan(40);
    expect(pull.peakToPeak).not.toBe(sim.mean);
    expect(Math.abs(femoralGradient(s) - aorticGradient(s).mean)).toBeGreaterThan(2);
  });

  it("simultaneous needs the second arterial catheter, femoral the side-arm; a pullback takes the catheter out of the LV", () => {
    const lv = play(cross("as-discordant-cross"), { type: "advance" }, { type: "exchange" });
    expect(play(lv, { type: "record-gradient", method: "simultaneous", artLine: false }).gradients).toHaveLength(0);
    expect(play(lv, { type: "record-gradient", method: "femoral", artLine: false }).gradients).toHaveLength(0);
    expect(play(lv, { type: "record-gradient", method: "femoral", artLine: true }).gradients).toHaveLength(1);
    const both = play(lv, { type: "second-arterial", on: true }, { type: "record-gradient", method: "simultaneous", artLine: false }, { type: "record-gradient", method: "pullback", artLine: false });
    expect(both.gradients.map((g) => g.method)).toEqual(["simultaneous", "pullback"]);
    expect(both.inLv).toBe(false);
    expect(avDecisions(both).find((d) => d.id === "av-gradient-method")?.correct).toBe(true);
    // pullback first is the wrong order, and the valve must be crossed again for the simultaneous one
    const pullFirst = play(lv, { type: "record-gradient", method: "pullback", artLine: false });
    expect(avDecisions(pullFirst).find((d) => d.id === "av-gradient-method")?.correct).toBe(false);
    expect(play(pullFirst, { type: "second-arterial", on: true }, { type: "record-gradient", method: "simultaneous", artLine: false }).gradients).toHaveLength(1);
  });
});

describe("low-flow low-gradient stenosis under dobutamine", () => {
  it("each variant responds as its diagnosis says", () => {
    expect(lflgResponse(SCENARIO_BY_ID["lflg-true"])).toBe("true-severe");
    expect(lflgResponse(SCENARIO_BY_ID["lflg-pseudo"])).toBe("pseudo-severe");
    expect(lflgResponse(SCENARIO_BY_ID["lflg-no-reserve"])).toBe("no-flow-reserve");
    expect(SCENARIO_BY_ID["lflg-true"].diagnosis).toMatch(/True severe/);
    expect(SCENARIO_BY_ID["lflg-pseudo"].diagnosis).toMatch(/Pseudo-severe/);
    expect(SCENARIO_BY_ID["lflg-no-reserve"].diagnosis).toMatch(/without flow reserve/);
    expect(lflgResponse(SCENARIO_BY_ID["as-discordant-cross"])).toBeNull();
  });

  it("the stop criteria: a mean gradient of 40 mmHg in lflg-true and hypotension in lflg-no-reserve below the top dose", () => {
    const t = SCENARIO_BY_ID["lflg-true"];
    const n = SCENARIO_BY_ID["lflg-no-reserve"];
    const p = SCENARIO_BY_ID["lflg-pseudo"];
    // a criterion is met before the top dose, so raising the dose past it is a real mistake to make
    expect(peakStageIndex(t)).toBeLessThan(t.modifiers!.length - 1);
    expect(peakStageIndex(n)).toBeLessThan(n.modifiers!.length - 1);
    // the pseudo-severe valve meets none and the study runs to the top dose
    expect(peakStageIndex(p)).toBe(p.modifiers!.length - 1);
    expect(stopCriteria(gorlinLive(t, t.modifiers![peakStageIndex(t)]))).toContain("mean gradient 40 mmHg or more");
    expect(stopCriteria(gorlinLive(n, n.modifiers![peakStageIndex(n)]))).toContain("hypotension");
    expect(stopCriteria(gorlinLive(t, t.modifiers![0]))).toEqual([]);
  });

  it("the study walks the stages; a stage is recorded only with LV, aortic and output measurements; the learner's entries are graded from the recorded numbers", () => {
    let st = inLv("lflg-true");
    st = play(st, { type: "dobutamine", step: "increase" });
    expect(st.stage).toBeNull();
    st = play(st, { type: "dobutamine", step: "baseline" });
    expect(st.stage).toBe(0);
    expect(play(st, { type: "record-stage", artLine: false, outputReady: false }).stages[0]).toBeUndefined();
    st = play(st, { type: "record-stage", artLine: false, outputReady: true });
    const r = st.stages[0]!;
    expect(r.method).toBe("simultaneous");
    expect(r.dose).toBe(0);
    const g = gorlinLive(SCENARIO_BY_ID["lflg-true"], "baseline");
    expect(r.co).toBeCloseTo(g.co, 2);
    expect(r.meanGradient).toBe(Math.round(g.meanGradient));
    // the learner works out SV and AVA from the recorded row
    const sv = Math.round((r.co * 1000) / r.hr);
    const ava = Number(gorlinAVA(r.co, r.hr, r.sep, r.meanGradient).toFixed(2));
    st = play(st, { type: "stage-entry", stage: 0, field: "sv", value: sv }, { type: "stage-entry", stage: 0, field: "ava", value: ava });
    expect(st.stages[0]!.sv?.firstAccepted).toBe(true);
    expect(st.stages[0]!.ava?.firstAccepted).toBe(true);
    expect(stageEntryOk(r, "ava", ava + 0.3)).toBe(false);
    expect(stageReference(r, "sv")).toBeCloseTo((r.co * 1000) / r.hr, 6);
    // up to the stage that meets a stop criterion, every stage recorded and filled
    const peak = peakStageIndex(SCENARIO_BY_ID["lflg-true"]);
    for (let i = 1; i <= peak; i++) {
      st = play(st, { type: "dobutamine", step: "increase" }, { type: "record-stage", artLine: false, outputReady: true });
      const row = st.stages[i]!;
      st = play(st, { type: "stage-entry", stage: i, field: "sv", value: stageReference(row, "sv") }, { type: "stage-entry", stage: i, field: "ava", value: stageReference(row, "ava") });
    }
    expect(st.stage).toBe(peak);
    expect(st.stages[peak]!.meanGradient).toBeGreaterThanOrEqual(LFLG.severeMeanGradient);
    const atPeak = st;
    st = play(st, { type: "dobutamine", step: "stop" });
    const d = avDecisions(st);
    expect(d.find((x) => x.id === "av-stage-table")?.correct).toBe(true);
    expect(d.find((x) => x.id === "av-dobutamine-stop")?.correct).toBe(true);
    // one more increase after the criterion is met is scored as a late stop
    const late = play(atPeak, { type: "dobutamine", step: "increase" }, { type: "dobutamine", step: "stop" });
    expect(late.pastStop).toBe(true);
    expect(avDecisions(late).find((x) => x.id === "av-dobutamine-stop")?.correct).toBe(false);
  });

  it("once the infusion is stopped the traces return to the baseline and no further stage is recorded", () => {
    const n = SCENARIO_BY_ID["lflg-no-reserve"];
    let st = play(inLv("lflg-no-reserve"), { type: "dobutamine", step: "baseline" });
    for (let i = 0; i < peakStageIndex(n); i++) st = play(st, { type: "dobutamine", step: "increase" });
    expect(currentStageLive(st)!.map).toBeLessThan(65);
    const stopped = play(st, { type: "dobutamine", step: "stop" });
    expect(currentStageLive(stopped)!.map).toBeCloseTo(gorlinLive(n, n.modifiers![0]).map, 6);
    expect(play(stopped, { type: "record-stage", artLine: false, outputReady: true })).toBe(stopped);
    // a gradient recorded after the stop is a baseline one
    const g = play(stopped, { type: "record-gradient", method: "simultaneous", artLine: false }).gradients.slice(-1)[0];
    expect(g.stage).toBe(0);
    expect(g.mean).toBe(Math.round(gorlinLive(n, n.modifiers![0]).meanGradient));
  });

  it("hypotension during dobutamine is raised at 15 micrograms/kg/min in lflg-no-reserve and cleared when the infusion stops", () => {
    let st = play(inLv("lflg-no-reserve"), { type: "dobutamine", step: "baseline" });
    expect(avStudyEvents(st)).toEqual([]);
    for (let i = 0; i < 2; i++) st = play(st, { type: "dobutamine", step: "increase" });
    expect(avStudyEvents(st)).toEqual([]);
    st = play(st, { type: "dobutamine", step: "increase" });
    expect(avStudyEvents(st)).toEqual(["hypotension"]);
    expect(avStudyEvents(play(st, { type: "dobutamine", step: "stop" }))).toEqual([]);
  });

  it("the CT calcium score comes after the dobutamine study and reads against the sex-specific thresholds", () => {
    let st = play(inLv("lflg-no-reserve"), { type: "dobutamine", step: "baseline" }, { type: "show-ct" });
    expect(st.ctShown).toBe(false);
    st = play(st, { type: "dobutamine", step: "increase" }, { type: "dobutamine", step: "stop" }, { type: "show-ct" });
    expect(st.ctShown).toBe(true);
    expect(ctCalciumReading(SCENARIO_BY_ID["lflg-no-reserve"].avStudy!.ctCalcium!)).toBe("very-specific");
    expect(ctCalciumReading(SCENARIO_BY_ID["lflg-true"].avStudy!.ctCalcium!)).toBe("severe");
    expect(ctCalciumReading(SCENARIO_BY_ID["lflg-pseudo"].avStudy!.ctCalcium!)).toBe("unlikely");
    expect(ctCalciumReading(SCENARIO_BY_ID["as-discordant-cross"].avStudy!.ctCalcium!)).toBe("inconclusive");
  });
});

describe("launch metadata and the practice index", () => {
  it("aorticStenosis.launch.ts declares every valve-study scenario and no other, with the scenarios' own titles", () => {
    expect(asLaunch.sim).toBe("haemo");
    const ids = asLaunch.scenarios!.map((s) => s.id);
    expect([...ids].sort()).toEqual(HAEMO_SCENARIOS.filter(isAvStudy).map((s) => s.id).sort());
    for (const decl of asLaunch.scenarios!) expect(decl.title, decl.id).toBe(SCENARIO_BY_ID[decl.id].title);
  });

  it("the haemo launch files together declare every scenario of the library exactly once", () => {
    const all = [...coreLaunch.scenarios!.map((s) => s.id), ...asLaunch.scenarios!.map((s) => s.id)];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(HAEMO_SCENARIOS.map((s) => s.id).sort());
    expect(PRACTICE_INDEX.known.scenarios.get("haemo")?.size).toBe(HAEMO_SCENARIOS.length);
  });

  it("practiceIndex lists every scenario in aorticStenosis.launch.ts under lesson hb-specific-conditions-as", () => {
    const under = practiceForLesson("hb-specific-conditions-as").filter((e) => e.sim === "haemo");
    for (const s of asLaunch.scenarios!) {
      expect(s.lessonIds).toContain("hb-specific-conditions-as");
      expect(under.some((e) => e.scenario === s.id && e.source.endsWith("aorticStenosis.launch.ts")), s.id).toBe(true);
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("aorticStenosis.launch"))).toEqual([]);
  });
});
