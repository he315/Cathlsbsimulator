// The left heart module's tasks beyond the tips (diag-lv-aorta-task): the difficult valve and the
// stenotic valve in the simple model (the escalation, the attending's question, the unnecessary crossing),
// the papillary entrapment, pulmonary oedema after a standard run with a raised LVEDP, the clean cycle,
// the pullback and the removal over the wire, the aortogram on the leaflets, the reader's comparison,
// and the scene's left heart and bolus.
//   npx vitest run src/ui/sim/modules/leftHeart.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { leftHeartSetups, READING_SET } from "../../../simulation/diagnosticScenarios/leftHeart";
import { EXCHANGE_LOAD_S } from "../../lab/diagnosticContext";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import { tipFromEngagement } from "../../../simulation/patient/transducer";
import { leftHeartBolus, pigtailRootBolus } from "../FluoroView";
import { findingsFor, globalFunctionOf, leftHeartOf, lvPositionOf, MP_LEFT_HEART_TASK, runViewOf, type LeftHeartControl } from "./leftHeart";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
  s.setTimeOutDone(true);
  return s;
}
const lhOf = (s: DiagnosticLabSession) => leftHeartOf(s) as LeftHeartControl;
function run(s: DiagnosticLabSession, seconds: number, dt = 0.1, until?: () => boolean): number {
  let t = 0;
  while (t < seconds) {
    s.step(dt);
    t += dt;
    if (until?.()) break;
  }
  return t;
}
/** The simple model's catheter at a depth below the valve plane (mm; negative: above it), optionally turned (torque, rad). */
function placeTip(depthMm: number, torque?: number) {
  const st = g();
  const seat = st.tip.height + st.controls.insertion;
  const insertion = seat + depthMm - st.model.valvePlaneY;
  const c = st.controls;
  useSimulatorStore.setState({ controls: { ...c, insertion, cmdInsertion: insertion, vInsertion: 0, ...(torque !== undefined ? { torque, cmdTorque: torque, vTorque: 0 } : {}) } });
  const s2 = g();
  s2.setDifficulty(s2.difficulty);
}
const inLv = () => g().engagement.kind === "in-lv" || g().engagement.kind === "below-valve";
/** Advance the wire to a lead, let the lab see it, then change the catheter over it (an exchange over the wire). */
function exchange(s: DiagnosticLabSession, id: string, wireLead: number) {
  const c = g().controls;
  useSimulatorStore.setState({ controls: { ...c, wireInsertion: wireLead } });
  s.step(0.1);
  g().setCatheter(id);
}

describe("position classes", () => {
  it("lvPositionOf: mid-cavity, outflow, mitral, papillary, apex and wall in the ventricle; leaflets, root and ascending above the valve", () => {
    const B = MP_LEFT_HEART_TASK.bands;
    const lv = (f: number, posterior = false, againstWall = false) => lvPositionOf({ inLv: true, f, posterior, againstWall, heightAboveValve: -10, sinusTop: 20 });
    expect(lv(0.45)).toBe("mid-cavity");
    expect(lv(B.outflow - 0.05)).toBe("outflow");
    expect(lv(B.outflow - 0.05, true)).toBe("mitral");
    expect(lv(B.papillaryFrom + 0.05, true)).toBe("papillary");
    expect(lv(B.apex + 0.05)).toBe("apex");
    expect(lv(B.wall + 0.01)).toBe("wall");
    expect(lv(0.45, false, true)).toBe("wall");
    const ao = (h: number) => lvPositionOf({ inLv: false, f: 0, posterior: false, againstWall: false, heightAboveValve: h, sinusTop: 20 });
    expect(ao(MP_LEFT_HEART_TASK.leafletMm - 1)).toBe("leaflets");
    expect(ao(10)).toBe("root");
    expect(ao(30)).toBe("ascending");
  });

  it("views and global function bands", () => {
    expect(runViewOf({ laoRao: -30, cranialCaudal: 0 })).toBe("rao");
    expect(runViewOf({ laoRao: 60, cranialCaudal: 20 })).toBe("lao-cranial");
    expect(globalFunctionOf(60)).toBe("normal");
    expect(globalFunctionOf(30)).toBe("severe");
  });

  it("the reading set picks its pattern from the case seed, deterministically", () => {
    const s = leftHeartSetups["diag-lv-gram-reading-set"];
    const a = findingsFor(s, scenarioCase("diag-lv-gram-reading-set", "1")!.id);
    expect(findingsFor(s, scenarioCase("diag-lv-gram-reading-set", "1")!.id)).toBe(a);
    const seen = new Set<string>();
    for (let i = 1; i <= 40; i++) seen.add(findingsFor(s, scenarioCase("diag-lv-gram-reading-set", String(i))!.id).label);
    expect(seen.size).toBeGreaterThan(READING_SET.length / 2);
  });
});

describe("the difficult valve (simple model)", () => {
  it("the pigtail over the J wire does not cross and repeated passes raise engage-fail; an Amplatz with a straight wire crosses, and the pigtail follows over a wire left across", () => {
    const s = session(scenarioCase("diag-difficult-valve-crossing")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    for (let i = 0; i < 4; i++) {
      placeTip(10);
      run(s, 0.3);
      expect(inLv(), `pass ${i}`).toBe(false);
      placeTip(-8);
      run(s, 0.3);
    }
    expect(lh.score().crossing.failedPasses).toBeGreaterThanOrEqual(3);
    expect(s.tipContext().events).toContain("engage-fail");
    // the escalation: an Amplatz with a straight wire leading, a few attempts
    exchange(s, "AL1", 15);
    g().setWire("STRAIGHT");
    run(s, 1);
    let crossed = false;
    for (let i = 0; i < 30 && !crossed; i++) {
      const c = g().controls;
      useSimulatorStore.setState({ controls: { ...c, wireInsertion: 15 } });
      placeTip(10);
      run(s, 0.3);
      crossed = inLv();
      if (!crossed) {
        placeTip(-8);
        run(s, 0.2);
      }
    }
    expect(crossed).toBe(true);
    expect(lh.steps.some((x) => x.step === "cross")).toBe(true);
    // the exchange to the pigtail over a long J wire left across: the pigtail now enters
    g().setWire("J");
    exchange(s, "PIG", 40);
    run(s, 0.5);
    placeTip(30);
    run(s, 0.5);
    expect(inLv()).toBe(true);
    const sc = lh.score();
    expect(sc.crossing.escalation.some((e) => /AL1/.test(e))).toBe(true);
    s.dispose();
  });
});

describe("severe aortic stenosis (simple model)", () => {
  it("the lab asks first whether crossing is indicated; crossing with concordant echo is an unnecessary crossing with embolic risk", () => {
    const s = session(scenarioCase("diag-as-cross-or-not")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    expect(lh.severeAs()).toBe(true);
    expect(lh.inPlay()).toBe(true);
    // the first approach to the valve: the question
    placeTip(10);
    run(s, 0.3);
    expect(lh.crossQuestion.asked).toBe(true);
    expect(inLv()).toBe(false);
    lh.answerCrossing(true);
    // an Amplatz and a straight wire, in the valve zone for a while, then across
    exchange(s, "AL1", 15);
    g().setWire("STRAIGHT");
    let crossed = false;
    for (let i = 0; i < 40 && !crossed; i++) {
      const c = g().controls;
      useSimulatorStore.setState({ controls: { ...c, wireInsertion: 15 } });
      placeTip(-2);
      run(s, 1);
      placeTip(10);
      run(s, 0.3);
      crossed = inLv();
    }
    expect(crossed).toBe(true);
    const sc = lh.score();
    expect(sc.crossing.askedIndicated).toBe(true);
    expect(sc.crossing.unnecessary).toBe(true);
    expect(sc.crossing.valveTimeS).toBeGreaterThan(1);
    expect(sc.crossing.riskScore).toBeGreaterThan(0);
    s.dispose();
  });
});

describe("the pigtail in the ventricle", () => {
  it("the papillary region catches the pigtail: a push or a pull alone does not move it; rotate and withdraw frees it", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    const st = g();
    const az0 = st.tip.az - st.controls.torque * 0.64;
    const torque = (-Math.PI / 2 - az0) / 0.64;
    placeTip(MP_LEFT_HEART_TASK.simpleCavityMm * 0.5, torque);
    run(s, MP_LEFT_HEART_TASK.entrapAfterS + 1);
    expect(lh.lvAction().position).toBe("papillary");
    expect(s.tipContext().events).toContain("papillary-entrapment");
    const caught = g().controls.insertion;
    g().commandInsertion(-6);
    run(s, 0.5);
    expect(Math.abs(g().controls.insertion - caught)).toBeLessThanOrEqual(MP_LEFT_HEART_TASK.holdInsertionMm + 1e-6);
    lh.rotateAndWithdraw();
    run(s, 1.5);
    expect(s.tipContext().events).not.toContain("papillary-entrapment");
    expect(lh.score().entrapments).toBe(1);
    s.dispose();
  });

  it("a standard run with an LVEDP above 25 brings pulmonary oedema; the first actions are recorded; a clean cycle, the pullback and the removal over the wire are scored", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    lh.setTask("ventriculogram");
    placeTip(30);
    run(s, 4);
    expect(lh.lvAction().position).toBe("mid-cavity");
    const lvedp = lh.recordLvedp()!;
    expect(lvedp).toBeGreaterThan(25);
    expect(s.tipContext().events).toContain("high-lvedp");
    // the standard settings (the attending's technique question is left to the debrief in independent mode)
    useSimulatorStore.setState({ policy: { ...g().policy, mode: "independent" } });
    g().setCArm({ laoRao: -30, cranialCaudal: 0 });
    lh.setInjector({ volumeMl: 35, rateMlS: 15, riseS: 0.2 });
    lh.purge();
    expect(lh.arm()).toBe(true);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 6);
    s.setPedal({ fluoro: false, cine: false });
    const r = lh.runs.find((x) => x.via === "power")!;
    expect(r).toBeDefined();
    expect(r.view).toBe("rao");
    expect(r.beats).toBeGreaterThan(1);
    expect(lh.deferred.map((d) => d.ruleId)).toContain("lv-gram-settings-for-lvedp");
    // an allowed run is not a stop
    expect(lh.stops).toEqual([]);
    const t = run(s, MP_LEFT_HEART_TASK.oedemaWatchS, 0.1, () => s.tipContext().events?.includes("pulmonary-oedema") ?? false);
    expect(t).toBeLessThan(MP_LEFT_HEART_TASK.oedemaWatchS);
    // the onset is the patient's step in the log, not the injector's
    expect(lh.steps.find((x) => /coughs/.test(x.observed))?.step).toBe("patient");
    lh.oxygen();
    lh.sitUp();
    lh.diuretic();
    // the pullback, then out over the wire
    lh.startPullback();
    placeTip(30);
    run(s, 2);
    placeTip(-10);
    run(s, 3);
    exchange(s, "JL4", 30);
    run(s, 0.3);
    const sc = lh.score();
    expect(sc.lvedpRecordedBeforeInjection).toBe(true);
    expect(sc.settingsForLvedp).toBe(false);
    expect(sc.airCheckBeforeArming).toBe(true);
    expect(sc.cleanCycleRecorded).toBe(true);
    expect(sc.oedema?.firstActions).toEqual(["oxygen", "sit-up", "diuretic"]);
    expect(sc.pullbackRecorded).toBe(true);
    expect(lh.steps.find((x) => x.step === "pullback")?.observed).toMatch(/LV \d+ mmHg, aorta \d+ mmHg/);
    expect(sc.removedOverWire).toBe(true);
    // the reader: a reading within one grade of the case's anterior hypokinesis
    const runId = r.id;
    lh.submitReading({ runId, ungradable: false, global: "mild", segments: { anterior: "hypokinetic", apical: "akinetic", inferior: "normal" }, mr: 0, territory: "LAD" });
    const cmp = lh.score().readings[0];
    expect(cmp.segments.map((x) => x.segment)).toEqual(["anterior", "apical", "inferior"]);
    expect(cmp.segments.every((x) => x.withinOne)).toBe(true);
    expect(cmp.territory?.correct).toBe(true);
    // the comparison is not shown during the case outside guided mode
    expect(lh.comparisonShown()).toBe(false);
    s.dispose();
  }, 60_000);
});

describe("the aortogram", () => {
  it("a pigtail on the leaflets makes catheter-induced AR; the attending stops the run there; in the ascending aorta it fires and the scene gets an aortogram bolus", () => {
    const s = session(scenarioCase("diag-aortogram-ar-grading", "2")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    lh.setTask("aortogram");
    placeTip(-1);
    run(s, 1);
    expect(lh.lvAction().position).toBe("leaflets");
    // a moment on the leaflets is a transit: no regurgitation yet; resting there, the pigtail makes it
    expect(lh.sceneSpec().catheterAr).toBeUndefined();
    run(s, MP_LEFT_HEART_TASK.leafletDwellS);
    expect(s.engine.aorticRegurgitation).toBeGreaterThan((lh.findings?.ar ?? 0) * MP_LEFT_HEART_TASK.arSeverityPerGrade);
    expect(lh.sceneSpec().catheterAr).toBe(true);
    lh.setInjector({ volumeMl: 50, rateMlS: 20, riseS: 0.1 });
    lh.purge();
    lh.arm();
    s.setPedal({ fluoro: false, cine: true });
    run(s, 0.3);
    expect(lh.stops.map((u) => u.ruleId)).toContain("aortogram-on-leaflets");
    s.setPedal({ fluoro: false, cine: false });
    placeTip(-30);
    run(s, 0.5);
    expect(lh.lvAction().position).toBe("ascending");
    // off the leaflets the engine returns to the scenario's own AR (its grade), not to none
    expect(s.engine.aorticRegurgitation).toBeCloseTo((lh.findings?.ar ?? 0) * MP_LEFT_HEART_TASK.arSeverityPerGrade, 6);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 1);
    const b = leftHeartBolus(lh);
    expect(b?.aortogram).toBe(true);
    expect(b?.trace).toBeDefined();
    run(s, 4);
    s.setPedal({ fluoro: false, cine: false });
    const sc = lh.score();
    expect(sc.aortogramOnLeaflets).toBe(0);
    expect(lh.runs.find((x) => x.kind === "root")?.truth.ar).toBe(lh.findings?.ar);
    // a pigtail's hand root injection is an aortogram too; other catheters' are not
    const hand: { plume: "root"; lv: boolean; aortogram?: boolean } = { plume: "root", lv: false };
    expect(pigtailRootBolus(hand, "PIG").aortogram).toBe(true);
    expect(pigtailRootBolus(hand, "JL4").aortogram).toBeUndefined();
    s.dispose();
  });
});

describe("the TAVI work-up", () => {
  it("the pigtail pulled back above the bifurcation gives an iliofemoral run (20 mL at 20 mL/s) for the scene; the slow aortic pulse and the AS are on the scene's left heart", () => {
    const s = session(scenarioCase("diag-tavi-workup")!);
    const lh = lhOf(s);
    run(s, 1);
    expect(g().catheterId).toBe("JL4");
    expect(lh.inPlay()).toBe(true);
    expect(lh.sceneSpec().aorticStenosis).toBe(true);
    exchange(s, "PIG", 30);
    run(s, EXCHANGE_LOAD_S + 1);
    lh.setTask("aortogram");
    lh.setIliacStation(true);
    expect(lh.iliacStation).toBe(true);
    const iliac = lh.presets().find((p) => p.id === "iliac")!;
    lh.setInjector(iliac.settings);
    lh.purge();
    expect(lh.arm()).toBe(true);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 1);
    const b = leftHeartBolus(lh);
    expect(b?.iliac).toBe(true);
    expect(b?.aortogram).toBeUndefined();
    run(s, 2);
    s.setPedal({ fluoro: false, cine: false });
    expect(lh.runs.find((r) => r.kind === "iliac")?.volumeMl).toBeCloseTo(20, 0);
    // no crossing in this work-up: nothing unnecessary
    expect(lh.score().crossing.unnecessary).toBe(false);
    s.dispose();
  });
});

describe("the scenario's regurgitation and the power run's scoring", () => {
  it("applySetup puts the findings' AR and MR grade on the engine; the difficult-valve case has the chart's severe MR", () => {
    const a = session(scenarioCase("diag-aortogram-ar-grading", "3")!);
    const la = lhOf(a);
    run(a, 1);
    expect(la.findings?.ar).toBeGreaterThan(0);
    expect(a.engine.aorticRegurgitation).toBeCloseTo(la.findings!.ar! * MP_LEFT_HEART_TASK.arSeverityPerGrade, 6);
    a.dispose();
    const d = session(scenarioCase("diag-difficult-valve-crossing")!);
    const ld = lhOf(d);
    run(d, 1);
    expect(ld.findings?.mr).toBe(3);
    expect(d.engine.mitralRegurgitation).toBeCloseTo(3 * MP_LEFT_HEART_TASK.severityPerGrade, 6);
    d.dispose();
  });

  it("a power ventriculogram fired without choosing the task is not a dangerous injection", () => {
    const s = session(scenarioCase("diag-lv-gram-reading-set", "1")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    expect(g().leftHeartTask).toBeNull();
    placeTip(30);
    run(s, 4);
    expect(lh.lvAction().position).toBe("mid-cavity");
    lh.recordLvedp();
    useSimulatorStore.setState({ policy: { ...g().policy, mode: "independent" }, aspirated: "unknown" });
    lh.purge();
    expect(lh.arm()).toBe(true);
    const before = g().score.dangerousInjections;
    s.setPedal({ fluoro: false, cine: true });
    run(s, 2);
    s.setPedal({ fluoro: false, cine: false });
    expect(lh.runs.some((x) => x.via === "power" && x.kind === "lv")).toBe(true);
    expect(g().leftHeartTask).toBe("ventriculogram");
    expect(g().score.dangerousInjections).toBe(before);
    expect(g().score.airEmbolisms).toBe(0);
    s.dispose();
  }, 30_000);
});

describe("defaults", () => {
  it("a coronary case with a JR4 slipped into the LV: no atrial contraction switched on, the transducer's lvContact kept", () => {
    const s = session(scenarioCase("diag-damping-causes")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    g().setCatheter("JR4");
    run(s, EXCHANGE_LOAD_S + 1);
    placeTip(30);
    run(s, 2);
    expect(inLv()).toBe(true);
    expect(lh.setup).toBeNull();
    expect(s.engine.atrialContraction).toBe(false);
    expect(s.engine.tipInput.lvContact).toBe(tipFromEngagement(g().engagement).lvContact);
    expect(s.engine.mitralRegurgitation).toBe(0);
    s.dispose();
  });

  it("a coronary case without a left heart scenario: the tab is not in play, the engine has no MR and the store scores as before", () => {
    const s = session(scenarioCase("diag-damping-causes")!);
    const lh = lhOf(s);
    run(s, 1);
    expect(lh.setup).toBeNull();
    expect(lh.inPlay()).toBe(false);
    expect(s.engine.mitralRegurgitation).toBe(0);
    expect(g().leftHeartTask).toBeNull();
    expect(leftHeartBolus(lh)).toBeNull();
    s.dispose();
  });
});
