// The left heart task after the in-app verification (diag-lv-aorta-task): a transit across the leaflets makes
// no regurgitation and no oedema, chronic AR is compensated at rest, the stenotic valve's unanswered question
// is not a failed pass, the intended pigtail crossing is not an LV entry error, the oedema onset is the
// patient's step, and the reader opens on the newest run.
//   npx vitest run src/ui/sim/modules/leftHeart.fixes.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { EXCHANGE_LOAD_S } from "../../lab/diagnosticContext";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import LvGramReader from "../../lab/LvGramReader";
import { leftHeartOf, MP_LEFT_HEART_TASK, type LeftHeartControl, type LeftHeartRun } from "./leftHeart";

const g = () => useSimulatorStore.getState();
let open: DiagnosticLabSession | null = null;
afterEach(() => {
  g().setPedalImaging(false);
  open?.dispose();
  open = null;
});

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
  s.setTimeOutDone(true);
  open = s;
  return s;
}
const lhOf = (s: DiagnosticLabSession) => leftHeartOf(s) as LeftHeartControl;
function run(s: DiagnosticLabSession, seconds: number, dt = 0.1, each?: () => void) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    s.step(dt);
    each?.();
  }
}
/** The simple model's catheter at a depth below the valve plane (mm; negative: above it). */
function placeTip(depthMm: number) {
  const st = g();
  const seat = st.tip.height + st.controls.insertion;
  const insertion = seat + depthMm - st.model.valvePlaneY;
  const c = st.controls;
  useSimulatorStore.setState({ controls: { ...c, insertion, cmdInsertion: insertion, vInsertion: 0 } });
  const s2 = g();
  s2.setDifficulty(s2.difficulty);
}
const inLv = () => g().engagement.kind === "in-lv" || g().engagement.kind === "below-valve";

describe("catheter-induced and chronic aortic regurgitation", () => {
  it("one transit across a normal valve (LVEDP 16) makes no regurgitation, no oedema and no desaturation", () => {
    const s = session(scenarioCase("diag-lv-stain-tamponade")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    lh.setTask("ventriculogram");
    placeTip(-6);
    run(s, 0.5);
    // through the leaflets in about 1.5 s, then into the cavity
    placeTip(-1);
    run(s, 1.5);
    placeTip(30);
    let worst = 0;
    const seen = new Set<string>();
    run(s, 10, 0.1, () => {
      worst = Math.max(worst, s.engine.vitals().lvedp);
      for (const e of s.tipContext().events ?? []) seen.add(e);
    });
    expect(inLv()).toBe(true);
    expect(worst).toBeLessThan(20);
    expect(lh.score().aortogramOnLeaflets).toBe(0);
    expect(seen.has("catheter-induced-regurgitation")).toBe(false);
    expect(seen.has("pulmonary-oedema")).toBe(false);
    expect(seen.has("desaturation")).toBe(false);
    expect(s.engine.aorticRegurgitation).toBe(0);
  });

  it("diag-aortogram-ar-grading grade III at rest: LVEDP below 25 and SpO2 at 94% or above over 60 s", () => {
    let seed = "";
    for (let i = 1; i <= 12 && !seed; i++) {
      g().loadCase(scenarioCase("diag-aortogram-ar-grading", String(i))!, "free");
      const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
      if (lhOf(s).findings?.ar === 3) seed = String(i);
      s.dispose();
    }
    expect(seed).not.toBe("");
    const s = session(scenarioCase("diag-aortogram-ar-grading", seed)!);
    expect(s.engine.aorticRegurgitation).toBeCloseTo(3 * MP_LEFT_HEART_TASK.arSeverityPerGrade, 6);
    let maxLvedp = 0;
    let minSpo2 = 100;
    run(s, 60, 0.1, () => {
      const v = s.engine.vitals();
      maxLvedp = Math.max(maxLvedp, v.lvedp);
      if (v.spo2 !== null) minSpo2 = Math.min(minSpo2, v.spo2);
    });
    expect(maxLvedp).toBeLessThan(25);
    expect(minSpo2).toBeGreaterThanOrEqual(94);
  }, 30_000);
});

describe("the stenotic valve's question", () => {
  it("pushes while the question is unanswered are held at the valve without failed passes or engage-fail; the question is logged once and the time at the valve counts", () => {
    const s = session(scenarioCase("diag-as-cross-or-not")!);
    const lh = lhOf(s);
    useSimulatorStore.setState({ policy: { ...g().policy, mode: "guided" } });
    run(s, EXCHANGE_LOAD_S + 1);
    for (let i = 0; i < 9; i++) {
      placeTip(-2);
      run(s, 0.6);
      placeTip(10);
      run(s, 0.3);
      expect(inLv(), `push ${i}`).toBe(false);
    }
    expect(lh.crossQuestion.asked).toBe(true);
    const sc = lh.score();
    expect(sc.crossing.failedPasses).toBe(0);
    expect(sc.crossing.valveTimeS).toBeGreaterThan(1);
    expect(s.tipContext().events ?? []).not.toContain("engage-fail");
    expect(lh.steps.filter((x) => x.step === "crossing-question")).toHaveLength(1);
    expect(lh.steps.some((x) => x.step === "cross-failed")).toBe(false);
  });
});

describe("the intended crossing", () => {
  it("a pigtail crossing for the planned ventriculogram is logged neutrally and is not an LV entry; without the task it still is", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    const lh = lhOf(s);
    run(s, EXCHANGE_LOAD_S + 1);
    lh.setTask("ventriculogram");
    const entries = g().score.lvEntries;
    const n = g().events.length;
    placeTip(30);
    run(s, 0.5);
    expect(g().engagement.kind).toBe("in-lv");
    expect(g().score.lvEntries).toBe(entries);
    const added = g().events.slice(n);
    expect(added.some((e) => e.code === "lv-entry")).toBe(false);
    expect(added.some((e) => e.code === "info" && /Pigtail across the aortic valve/.test(e.message))).toBe(true);
    expect(added.some((e) => /Do not inject/.test(e.message))).toBe(false);
    // without the task the crossing is an LV entry as before
    placeTip(-10);
    run(s, 0.5);
    lh.setTask(null);
    placeTip(30);
    run(s, 0.5);
    expect(g().score.lvEntries).toBe(entries + 1);
  });
});

describe("the reader", () => {
  it("opens on the newest filmed run", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    const lh = lhOf(s);
    const spec = lh.sceneSpec();
    const base: Omit<LeftHeartRun, "id" | "view" | "cArm"> = { kind: "lv", via: "power", t: 1, position: "mid-cavity", settings: null, volumeMl: 30, filmed: true, beats: 3, ectopicBeats: 0, catheterMr: false, catheterAr: false, stainMl: 0, truth: lh.truthNow(), spec };
    lh.runs.push({ ...base, id: 1, view: "other", cArm: { laoRao: 0, cranialCaudal: 0 } });
    lh.runs.push({ ...base, id: 2, view: "rao", cArm: { laoRao: -30, cranialCaudal: 0 } });
    const html = renderToString(createElement(LvGramReader, { lh, heart: s.tree.heart }));
    // the RAO run's segments are on the form, not the other view's notice
    expect(html).toContain(`data-segment="anterior"`);
    expect(html).not.toContain("This view profiles no wall cleanly");
    expect(html).toMatch(/<option value="2" selected="">/);
  });
});
