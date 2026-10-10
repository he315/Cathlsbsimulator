// The left heart tasks through the session module (diag-lv-aorta-task): the lv-aorta tips at the
// pigtail, a stain from an injection against the wall followed by tamponade and hypotension (and
// diag-lv-gram-tamponade), the attending's stop of a ventriculogram with an LVEDP of 36, catheter-induced
// MR giving a regurgitant volume and LA opacity in the render input, the store no longer scoring the
// intended ventriculogram as an error, the practice index, and reachability.
//   npx vitest run src/ui/sim/modules/leftHeart.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { EXCHANGE_LOAD_S, raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { practiceForLesson } from "../../content/practiceIndex";
import { launch as leftHeartLaunch } from "../../../simulation/diagnosticScenarios/leftHeart.launch";
import { LV_RULES } from "../../../mentor/rules/diagLv";
import { MentorEngine } from "../../../mentor/mentor";
import { mentorInputFromSim } from "../../../mentor/bridge/simulatorStore";
import type { PreAction } from "../../../mentor/context";
import { cavityProfile, lvGramContrast } from "../../../render/xray/lvGram";
import { clockStateAt } from "../../../render/xray/heartMotion";
import { plannedTrace } from "../../../simulation/powerInjector";
import { LUMENS } from "../../../simulation/injection";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import { LEFT_HEART_MODULE_ID, leftHeartOf, MP_LEFT_HEART_TASK, raises as leftHeartRaises, type LeftHeartControl } from "./leftHeart";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const lhOf = (s: DiagnosticLabSession) => leftHeartOf(s) as LeftHeartControl;
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);
/**
 * The scenario opens with the pigtail: the module loads it at attach, which the session counts as a catheter
 * change, so the exchange phase holds for EXCHANGE_LOAD_S first (the session has no left heart start state;
 * reported out of scope).
 */
const PAST_LOAD_S = EXCHANGE_LOAD_S + 1;

/** Put the simple model's pigtail at a depth below the valve plane (mm) and an azimuth offset (torque, rad). */
function placeTip(depthMm: number, torque?: number) {
  const st = g();
  const seat = st.tip.height + st.controls.insertion; // seatHeight
  const insertion = seat + depthMm - st.model.valvePlaneY;
  const c = st.controls;
  useSimulatorStore.setState({ controls: { ...c, insertion, cmdInsertion: insertion, vInsertion: 0, ...(torque !== undefined ? { torque, cmdTorque: torque, vTorque: 0 } : {}) } });
  const s2 = g();
  s2.setDifficulty(s2.difficulty);
}

function run(s: DiagnosticLabSession, seconds: number, dt = 0.1, until?: () => boolean): number {
  let t = 0;
  while (t < seconds) {
    s.step(dt);
    t += dt;
    if (until?.()) break;
  }
  return t;
}

describe("diag-lv-gram-task", () => {
  it("opens with the pigtail; at phase 'lv-aorta' tipsFor(ctx, 20) includes diag-lv-gram-mid-cavity", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    expect(s.modules.some((m) => m.id === LEFT_HEART_MODULE_ID)).toBe(true);
    expect(g().catheterId).toBe("PIG");
    s.setTimeOutDone(true);
    g().commandInsertion(1);
    run(s, PAST_LOAD_S);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("lv-aorta");
    expect(ctx.catheter).toBe("PIG");
    const ids = tipIds(s);
    expect(ids).toContain("diag-lv-gram-mid-cavity");
    expect(ids).toContain("diag-lv-gram-injector");
    s.dispose();
  });

  it("after the injection against the wall that raises 'hypotension' (a stain, then tamponade), tipsFor(ctx, 20) includes diag-lv-gram-tamponade", () => {
    const s = session(scenarioCase("diag-lv-gram-task")!);
    const lh = lhOf(s);
    s.setTimeOutDone(true);
    run(s, PAST_LOAD_S);
    lh.setTask("ventriculogram");
    // into the ventricle, mid-cavity first: the LV trace and the LVEDP (27 mmHg, the scenario's start state)
    placeTip(30);
    run(s, 4);
    expect(lh.lvTraceShown()).toBe(true);
    const lvedp = lh.recordLvedp();
    expect(lvedp).not.toBeNull();
    expect(lvedp!).toBeGreaterThan(22);
    // the pigtail pushed on against the wall: the attending stops an untested power injection there
    placeTip(MP_LEFT_HEART_TASK.simpleCavityMm * 0.97);
    run(s, 0.5);
    expect(lh.positionAid() ?? lh.lvAction().position).toBe("wall");
    expect(s.tipContext().events).toContain("catheter-too-deep");
    expect(tipIds(s)).toContain("diag-lv-gram-test-injection");
    lh.setInjector({ volumeMl: 30, rateMlS: 10, riseS: 0.1 });
    lh.purge();
    expect(lh.arm()).toBe(true);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 0.3);
    expect(lh.steps.some((x) => x.step === "stopped-by-attending")).toBe(true);
    expect(lh.runs.filter((r) => r.via === "power")).toHaveLength(0);
    s.setPedal({ fluoro: false, cine: false });
    run(s, 0.2);
    // the hand test injection there shows the contrast staying in the wall; the operator fires anyway
    expect(lh.testInjection()).toBe(true);
    run(s, 4);
    expect(lh.steps.some((x) => x.step === "test-injection" && /wall/.test(x.observed))).toBe(true);
    expect(lh.arm()).toBe(true);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 5);
    s.setPedal({ fluoro: false, cine: false });
    expect(lh.runs.filter((r) => r.via === "power")).toHaveLength(1);
    expect(s.tipContext().events).toContain("myocardial-stain");
    // later: the pericardium fills, the pressure falls and the heart rate rises
    expect(s.tipContext().events).not.toContain("hypotension");
    const hr0 = s.engine.vitals().hr!;
    const tHypo = run(s, 600, 0.1, () => s.tipContext().events?.includes("hypotension") ?? false);
    const ctx = s.tipContext();
    // later, not at once: the leak starts after the run and fills the pericardium over minutes
    expect(tHypo).toBeGreaterThan(MP_LEFT_HEART_TASK.stain.delayS);
    expect(s.engine.vitals().pericardialMl).toBeGreaterThan(MP_LEFT_HEART_TASK.tamponadeMl);
    expect(ctx.events).toContain("hypotension");
    expect(ctx.events).toContain("tamponade");
    expect(ctx.phase).toBe("lv-aorta");
    expect(s.engine.vitals().hr!).toBeGreaterThan(hr0);
    expect(tipIds(s)).toContain("diag-lv-gram-tamponade");
    // the management: echo, pericardiocentesis, a drain, the anticoagulation reviewed
    lh.echo();
    lh.pericardiocentesis();
    lh.leaveDrain();
    lh.reviewHeparin();
    const sc = lh.score();
    expect(sc.stain).toBe(true);
    expect(sc.tamponade?.echoT).not.toBeNull();
    expect(sc.tamponade?.pericardiocentesisT).not.toBeNull();
    expect(sc.tamponade?.drain).toBe(true);
    expect(sc.tamponade?.heparinReviewed).toBe(true);
    // drained, and the drain keeps it down while the stained wall still oozes
    run(s, 10);
    expect(s.engine.vitals().pericardialMl).toBeLessThan(MP_LEFT_HEART_TASK.tamponadeMl / 2);
    s.dispose();
  }, 120_000);

  it("the intended ventriculogram through the pigtail is not scored as a dangerous injection; without the task it is", () => {
    const c = scenarioCase("diag-lv-gram-task")!;
    const s = session(c);
    s.setTimeOutDone(true);
    placeTip(30);
    run(s, 0.5);
    const before = g().score.dangerousInjections;
    expect(s.startInjection()).toBe(true);
    run(s, 4);
    expect(g().score.dangerousInjections).toBe(before + 1);
    lhOf(s).setTask("ventriculogram");
    expect(s.startInjection()).toBe(true);
    run(s, 4);
    expect(g().score.dangerousInjections).toBe(before + 1);
    expect(g().events.some((e) => /Left ventriculogram/.test(e.message))).toBe(true);
    s.dispose();
  });
});

describe("the attending's left heart rules", () => {
  it("power-inject with LVEDP 36 is stopped (and 30 mL at 10 mL/s with LVEDP 22 from the mid-cavity is not)", () => {
    const c = scenarioCase("diag-lv-gram-task")!;
    g().loadCase(c, "free");
    const input = mentorInputFromSim(g(), null, 10);
    const ask = (lvedp: number | null, position = "mid-cavity" as const) => {
      const e = new MentorEngine({ mode: "independent", entrustment: 3 }, LV_RULES);
      return e.preAction("power-inject" as unknown as PreAction, { ...input, lvAction: { task: "ventriculogram", position, lvedp, testedHere: false, settings: { volumeMl: 30, rateMlS: 10, riseS: 0.1 } } } as typeof input);
    };
    const stop = ask(36);
    expect(stop.allow).toBe(false);
    expect(stop.utterance?.ruleId).toBe("lv-gram-lvedp-contraindication");
    expect(ask(22).allow).toBe(true);
    // through the lab: the recorded LVEDP of 36 stops the armed injector at the cine pedal
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
    const lh = lhOf(s);
    s.setTimeOutDone(true);
    lh.setTask("ventriculogram");
    placeTip(30);
    run(s, 2);
    lh.lvedp = 36;
    lh.purge();
    expect(lh.arm()).toBe(true);
    s.setPedal({ fluoro: false, cine: true });
    run(s, 0.5);
    expect(lh.runs.filter((r) => r.via === "power")).toHaveLength(0);
    expect(lh.stops.map((u) => u.ruleId)).toContain("lv-gram-lvedp-contraindication");
    s.setPedal({ fluoro: false, cine: false });
    s.dispose();
  });

  it("an aortogram with the pigtail on the leaflets is stopped; the rules are action-only (not in RULES)", async () => {
    const { RULES } = await import("../../../mentor/rules");
    for (const r of LV_RULES) expect(RULES.map((x) => x.id)).not.toContain(r.id);
    const input = mentorInputFromSim(g(), null, 10);
    const e = new MentorEngine({ mode: "supervised", entrustment: 2 }, LV_RULES);
    const r = e.preAction("power-inject" as unknown as PreAction, { ...input, lvAction: { task: "aortogram", position: "leaflets", lvedp: null, testedHere: false } } as typeof input);
    expect(r.allow).toBe(false);
    expect(r.utterance?.ruleId).toBe("aortogram-on-leaflets");
  });
});

describe("catheter-induced MR", () => {
  it("the pigtail on the mitral apparatus gives a regurgitant volume in the engine and LA opacity in the render input", () => {
    const s = session(scenarioCase("diag-lv-gram-reading-set", "1")!);
    const lh = lhOf(s);
    s.setTimeOutDone(true);
    // just below the valve, the curve turned to face posteriorly (towards the mitral apparatus)
    const cath = g();
    const az0 = cath.tip.az - cath.controls.torque * 0.64;
    const want = -Math.PI / 2;
    placeTip(8, (want - az0) / 0.64);
    run(s, 6);
    expect(lh.lvAction().position).toBe("mitral");
    expect(s.engine.mitralRegurgitation).toBeGreaterThan(0);
    const beat = s.engine.leftHeartBeat();
    expect(beat).not.toBeNull();
    expect(beat!.mrMl).toBeGreaterThan(3);
    expect(s.tipContext().events).toContain("catheter-induced-regurgitation");
    const spec = lh.sceneSpec();
    expect(spec.catheterMr).toBe(true);
    // the render input: LA opacity with the catheter on the mitral apparatus, against the same run without it
    const H = s.tree.heart;
    const tr = plannedTrace({ volumeMl: 30, rateMlS: 10, riseS: 0.1, pressureLimitPsi: 600 }, LUMENS["diag-6"]).trace;
    const la = (sp: typeof spec) => {
      const t = 5;
      return lvGramContrast({ profile: cavityProfile(H, sp), spec: sp, trace: tr, site: "lv", t, clock: clockStateAt(t, 70), laMl: 60 }).la;
    };
    const withMr = la(spec);
    const without = la({ ...spec, catheterMr: false });
    expect(withMr).toBeGreaterThan(0);
    expect(withMr).toBeGreaterThan(without);
    // pulled back into the mid-cavity, the regurgitation stops
    placeTip(30);
    run(s, 1);
    expect(s.engine.mitralRegurgitation).toBe(0);
    expect(lh.sceneSpec().catheterMr).toBeUndefined();
    s.dispose();
  });
});

describe("the practice index and reachability", () => {
  it("practiceIndex lists diag-lv-gram-task, diag-lv-gram-reading-set and diag-aortogram-ar-grading under hb-cardiac-catheterisation-lv-gram, -lhc and -aortography (from leftHeart.launch.ts)", () => {
    const listed = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(listed("hb-cardiac-catheterisation-lv-gram")).toEqual(expect.arrayContaining(["diag-lv-gram-task", "diag-lv-gram-reading-set", "diag-lv-stain-tamponade"]));
    expect(listed("hb-cardiac-catheterisation-lhc")).toEqual(expect.arrayContaining(["diag-lv-gram-task", "diag-difficult-valve-crossing", "diag-as-cross-or-not"]));
    expect(listed("hb-cardiac-catheterisation-aortography")).toContain("diag-aortogram-ar-grading");
    for (const sc of leftHeartLaunch.scenarios ?? []) for (const l of sc.lessonIds ?? []) expect(listed(l), `${sc.id} under ${l}`).toContain(sc.id);
  });

  function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
    const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
    const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
    return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
  }
  const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));

  it("every waiting.ts entry naming diag-lv-aorta-task is satisfiable (there are none: the lv-aorta tips wait under diag-tip-context), and the package's tips are", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-lv-aorta-task");
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "diag-lv-aorta-task");
    const rs = [...(Array.isArray(diagnosticRaises) ? diagnosticRaises : [diagnosticRaises]), leftHeartRaises] as LabRaises[];
    for (const id of mine.flatMap((w) => w.tips)) expect(satisfiable(TIP_BY_ID[id], rs), id).toBe(true);
    for (const d of deferred) expect(satisfiableIn(d.when, d.when.phase, rs), d.tipId).toBe(true);
    expect(mine.length + deferred.length).toBe(0);
    // the tips this package is for (the lab requests' lists); diag-lv-gram-papillary also needs catheter-kink (diag-catheter-kink)
    for (const id of [
      "diag-lv-gram-mid-cavity",
      "diag-lv-gram-injector",
      "diag-lv-gram-test-injection",
      "diag-lv-gram-clean-cycle",
      "diag-lv-gram-views",
      "diag-lv-pullback-over-wire",
      "diag-lvedp-before-lv-gram",
      "diag-lv-gram-tamponade",
      "diag-aortogram-setup",
      "diag-lvgram-catheter-induced-mr",
      "diag-aortogram-ar-grading",
      "diag-bg-wall-to-territory",
      "haemo-lhc-u-loop",
      "haemo-lhc-difficult-valve",
      "haemo-lhc-stenotic-valve",
    ]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(TIP_BY_ID[id], rs), id).toBe(true);
    }
  });
});
