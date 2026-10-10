// ---------------------------------------------------------------------------
// The rod mechanics in the diagnostic lab (diag-rod-physics), in-thread (Node has no module Worker):
// the lab session drives the solver through its hands and reads it back through the store.
//   npx vitest run src/ui/physics/physicsDevices.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, reconstructCase, scenarioCase, scenarioCaseId } from "../../simulation/caseGenerator";
import type { Difficulty } from "../../types";
import { DiagnosticLabSession, caseForLaunch, labScenarioById, type SessionPhysicsOptions } from "../sim/labSession";
import { getPhysicsDevices } from "./types";
import {
  COST_RULE,
  DiagnosticPhysics,
  EXCHANGE,
  MEASURED_COST,
  ROD_DEFAULT_ON,
  ROD_SCENARIOS,
  RodPhysicsDevices,
  advanceToRootScript,
  conusScript,
  costMeetsRule,
  costUnderThresholds,
  defaultOffReason,
  engageScript,
  physicsStatusText,
  resolvePhysicsMode,
  withdrawWireScript,
} from "./physicsDevices";
import { MP_DEEP_RCA_RUNOFF, tipFromPhysics } from "../../simulation/patient/transducer";
import { bridgedKind, legacyEngagement } from "../../physics/legacyBridge";
import type { EngagementReading } from "../../physics/engagementClassifier";
import { practiceForLesson } from "../content/practiceIndex";
import { launch as practiceLaunch } from "../../content/practice/diag-rod-physics.launch";

const g = () => useSimulatorStore.getState();
const T = 110_000;
/** in-thread, the default solver configuration, no automatic fallback (Node is slower than the worker) */
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };
const STARTS = [50, 60, 70, 80, 90];
/** test tolerance: how far a J tip put back straight may settle as it curls (mm) */
const J_TIP_SETTLE_MM = 15;

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

function open(scenario: string, difficulty: Difficulty, physics: SessionPhysicsOptions = PHYS): DiagnosticLabSession {
  const c = scenarioCase(scenario, DEFAULT_SCENARIO_SEED, labScenarioById);
  if (!c) throw new Error(`no scenario ${scenario}`);
  g().loadCase(c, "free", difficulty);
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics });
  sessions.push(s);
  return s;
}

/** Step the lab, watching the store's engagement after every step. */
function stepWatching(s: DiagnosticLabSession, seconds: number, seen: Set<string>, dt = 1 / 60) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    s.step(dt);
    seen.add(g().engagement.kind);
  }
}

describe("rod mechanics: Judkins left from the femoral route", () => {
  for (const difficulty of ["beginner", "advanced"] as const) {
    it(`the JL4 procedure reaches selective-lm in at least 3 of 5 starts at ${difficulty} difficulty`, () => {
      let reached = 0;
      const detail: string[] = [];
      for (const back of STARTS) {
        const s = open("diag-lm-fold-over-j-wire", difficulty, { ...PHYS, start: { tipBackMm: back } });
        expect(s.physics?.active).toBe(true);
        expect(g().difficulty).toBe(difficulty);
        const seen = new Set<string>();
        s.physics!.runScript(engageScript(s.physics!, "left"), (sec) => stepWatching(s, sec, seen));
        stepWatching(s, 1, seen);
        // the store took the rod's engagement, not the analytic model's
        expect(g().physicsOn).toBe(true);
        if (seen.has("selective-lm")) reached++;
        detail.push(`${back}:${[...seen].join("/")}`);
        s.dispose();
      }
      expect(reached, detail.join(" ")).toBeGreaterThanOrEqual(3);
    }, T);
  }
});

describe("rod mechanics: a Judkins right driven into the conus", () => {
  it("JR4 driven into the conus gives a damped or ventricularised tip trace and engagement.conus (still heart)", () => {
    // the conus branch is narrower than the catheter; with the heart still the tip stays lodged in it
    // (with the heart moving it slips in and out of the mouth with each beat: package notes)
    let entered = 0;
    const detail: string[] = [];
    for (const back of STARTS) {
      const c = scenarioCase("diag-lm-fold-over-j-wire", DEFAULT_SCENARIO_SEED, labScenarioById)!;
      g().loadCase(c, "free", "beginner");
      g().setCatheter("JR4");
      const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { ...PHYS, moveCoronaries: false, start: { tipBackMm: back } } });
      sessions.push(s);
      const p = s.physics!;
      expect(p.catheterId).toBe("JR4");
      const adv = (sec: number) => {
        for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
      };
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      const inConus = p.runScript(conusScript(p, 40, 1.5), adv);
      if (!inConus) {
        detail.push(`${back}: not in the conus (${g().engagement.kind})`);
        s.dispose();
        continue;
      }
      entered++;
      // hold still for two seconds: every frame with the tip in the conus has a damped or ventricularised trace
      let conusFrames = 0;
      let obstructed = 0;
      for (let t = 0; t < 2; t += 1 / 60) {
        s.step(1 / 60);
        if (!g().engagement.conus) continue;
        conusFrames++;
        const st = s.engine.vitals().tipState;
        if (st === "damped" || st === "ventricularised") obstructed++;
      }
      detail.push(`${back}: ${obstructed}/${conusFrames} obstructed, store pressure ${g().pressure.kind}`);
      expect(conusFrames).toBeGreaterThan(60);
      expect(obstructed / conusFrames).toBeGreaterThanOrEqual(0.95);
      expect(["damped", "ventricularised"]).toContain(g().pressure.kind);
      s.dispose();
    }
    expect(entered, detail.join("; ")).toBeGreaterThanOrEqual(1);
  }, T);

  it("with the heart moving (the lab's default), the conus latch holds engagement.conus and the obstructed trace while the tip stays in the branch", () => {
    let entered = 0;
    const detail: string[] = [];
    for (const back of STARTS) {
      const c = scenarioCase("diag-lm-fold-over-j-wire", DEFAULT_SCENARIO_SEED, labScenarioById)!;
      g().loadCase(c, "free", "beginner");
      g().setCatheter("JR4");
      const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { ...PHYS, start: { tipBackMm: back } } });
      sessions.push(s);
      const p = s.physics!;
      const adv = (sec: number) => {
        for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
      };
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      if (!p.runScript(conusScript(p, 40, 1.5), adv)) {
        detail.push(`${back}: not in the conus (${g().engagement.kind})`);
        s.dispose();
        continue;
      }
      entered++;
      let frames = 0;
      let conus = 0;
      let obstructed = 0;
      for (let t = 0; t < 2; t += 1 / 60) {
        s.step(1 / 60);
        frames++;
        if (g().engagement.conus) conus++;
        const st = s.engine.vitals().tipState;
        if (st === "damped" || st === "ventricularised") obstructed++;
      }
      detail.push(`${back}: conus ${conus}/${frames}, obstructed ${obstructed}/${frames}`);
      expect(conus / frames, detail.join("; ")).toBeGreaterThanOrEqual(0.9);
      expect(obstructed / frames, detail.join("; ")).toBeGreaterThanOrEqual(0.9);
      s.dispose();
    }
    expect(entered, detail.join("; ")).toBeGreaterThanOrEqual(1);
  }, T);
});

describe("rod mechanics: exchange over the wire", () => {
  it("an exchange JL4 to JR4 over the J wire keeps the wire tip above the valve plane throughout and loads the JR4 over it", async () => {
    const s = open("diag-lm-fold-over-j-wire", "beginner", { ...PHYS, start: { tipBackMm: 60 } });
    s.setTimeOutDone(true);
    const p = s.physics!;
    const valve = s.model.valvePlaneY;
    p.runScript(engageScript(p, "left"), (sec) => {
      for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
    });
    g().setCatheter("JR4");
    let minWire = Infinity;
    let exchangeFrames = 0;
    let started = false;
    const phases = new Set<string>();
    for (let i = 0; i < 60 * 40; i++) {
      s.step(1 / 60);
      if (p.exchanging) {
        started = true;
        exchangeFrames++;
        phases.add(p.exchange!.phase);
        // the tip context is in the exchange phase while the crew exchanges the catheter
        if (i % 30 === 0) expect(s.tipContext().phase).toBe("exchange");
        // the store does not show the old catheter as seated, and nothing can be injected
        expect(g().engagement.isSelective).toBe(false);
        expect(s.startInjection()).toBe(false);
      }
      const w = p.frame()?.wire;
      if (started && w) minWire = Math.min(minWire, w.nodes[3 * (w.count - 1) + 1] - valve);
      if (started && !p.exchanging) break;
    }
    expect(started).toBe(true);
    expect(p.exchanging).toBe(false);
    expect([...phases]).toEqual(["pullback", "wire", "withdraw", "out", "in"]);
    expect(Number.isFinite(minWire)).toBe(true);
    expect(minWire).toBeGreaterThan(0);
    expect(p.lastExchangeMinWireTipHeight!).toBeGreaterThan(0);
    // the new catheter is the solver's, over the wire, its tip short of the wire tip
    const f = p.frame()!;
    expect(f.catheter!.id).toBe("JR4");
    expect(p.catheterId).toBe("JR4");
    expect(f.wire).not.toBeNull();
    expect(p.view()!.wireLeadMm).toBeGreaterThan(0);
    expect(f.catheter!.tip.every(Number.isFinite)).toBe(true);
    // the exchange took time: the hands are busy for several seconds
    expect(exchangeFrames / 60).toBeGreaterThan(5);
    // a decision point: the recorder kept the mechanics before the exchange (the snapshot resolves asynchronously)
    await new Promise((r) => setTimeout(r, 0));
    expect(s.physicsSnapshots.some((x) => x.reason === "catheter-change")).toBe(true);
  }, T);
});

describe("rod mechanics: exchange from the lab's default start after the scripted seat", () => {
  it("the J wire put back on its own never reaches the valve plane in the 'out' phase (default start, engage then settle and ease back)", async () => {
    const s = open("diag-lm-fold-over-j-wire", "beginner");
    s.setTimeOutDone(true);
    const p = s.physics!;
    const valve = s.model.valvePlaneY;
    // the browser's seat (seatPhysics: engageScript, then settleThenEaseBack), in-thread. The default
    // solver configuration in Node does not always seat from this start (the worker's "auto" one did in
    // the app); either way the catheter is deep in the root over the wire when the exchange begins
    await s.seatPhysics("left");
    expect(["selective-lm", "deep-lm", "near-lm", "coaxial-lm"]).toContain(g().engagement.kind);
    g().setCatheter("JR4");
    let started = false;
    let outFrames = 0;
    let minOut = Infinity;
    // the frame read in the step that ended the withdrawal is the old wire's; the wire put back on its
    // own answers from the next frame
    let lastWithdrawFrame: unknown = null;
    for (let i = 0; i < 60 * 40; i++) {
      s.step(1 / 60);
      if (p.exchanging) started = true;
      const f = p.frame();
      if (p.exchange?.phase === "withdraw") lastWithdrawFrame = f;
      if (p.exchange?.phase === "out" && f?.wire && f !== lastWithdrawFrame) {
        // no catheter: the wire is on its own
        if (f.catheter) continue;
        outFrames++;
        const h = f.wire.nodes[3 * (f.wire.count - 1) + 1] - valve;
        minOut = Math.min(minOut, h);
        expect(h).toBeGreaterThan(0);
      }
      if (started && !p.exchanging) break;
    }
    expect(started).toBe(true);
    expect(p.exchanging).toBe(false);
    expect(outFrames).toBeGreaterThan(30);
    // the wire is put back no deeper than EXCHANGE.clearMm above the valve plane and curls from there
    expect(minOut).toBeGreaterThan(EXCHANGE.clearMm - J_TIP_SETTLE_MM);
    expect(p.frame()!.catheter!.id).toBe("JR4");
  }, 2 * T);
});

describe("rod mechanics: the cost record", () => {
  it("counts every new frame past COST_KEEP, so a bench late in a session still sees its own frames", () => {
    const s = open("diag-lm-fold-over-j-wire", "beginner");
    const p = s.physics!;
    for (let i = 0; i < 30; i++) s.step(1 / 60);
    const n0 = p.costsTotal;
    expect(n0).toBe(p.costs.length);
    // a long session: the kept list is full and stays at COST_KEEP while the total runs on
    p.costs.push(...new Array(DiagnosticPhysics.COST_KEEP - p.costs.length).fill(-1));
    const before = p.costsTotal;
    for (let i = 0; i < 20; i++) s.step(1 / 60);
    expect(p.costs.length).toBe(DiagnosticPhysics.COST_KEEP);
    const ran = p.costsTotal - before;
    expect(ran).toBeGreaterThan(0);
    expect(p.costs.slice(-ran).every((x) => x !== -1)).toBe(true);
  }, T);
});

describe("rod mechanics: the default rule, the setting and the fallback", () => {
  it("defaults on only when the measured median step is under 4 ms and the 95th centile under 8 ms", () => {
    expect(COST_RULE).toEqual({ medianMs: 4, p95Ms: 8, sessionS: 60, rendererPx: 1024 });
    expect(costMeetsRule({ medianMs: 3.9, p95Ms: 7.9, rendererPx: 1024 })).toBe(true);
    expect(costMeetsRule({ medianMs: 4, p95Ms: 7, rendererPx: 1024 })).toBe(false);
    expect(costMeetsRule({ medianMs: 2, p95Ms: 8, rendererPx: 1024 })).toBe(false);
    expect(costMeetsRule(null)).toBe(false);
    // the rule's renderer size is part of it: a run with a smaller image does not count
    expect(costUnderThresholds({ medianMs: 1.6, p95Ms: 3.8 })).toBe(true);
    expect(costMeetsRule({ medianMs: 1.6, p95Ms: 3.8, rendererPx: 988 })).toBe(false);
    expect(ROD_DEFAULT_ON).toBe(costMeetsRule(MEASURED_COST));
    if (MEASURED_COST && MEASURED_COST.rendererPx < COST_RULE.rendererPx) {
      expect(ROD_DEFAULT_ON).toBe(false);
      const m0 = resolvePhysicsMode({ choice: null, hasWorker: true });
      expect(m0.on).toBe(false);
      expect(m0.reason).toMatch(/1024 px or more/);
    }
    // over the threshold: off by default, and the reason names the measured costs and the threshold
    const slow = { medianMs: 5.2, p95Ms: 11.4, frames: 3600, rendererPx: 1024, note: "test" };
    const m = resolvePhysicsMode({ choice: null, measured: slow, hasWorker: true });
    expect(m.on).toBe(false);
    expect(m.reason).toBe(defaultOffReason(slow));
    expect(m.reason).toMatch(/median 5\.2 ms, 95th centile 11\.4 ms/);
    expect(resolvePhysicsMode({ choice: null, measured: { ...slow, medianMs: 1.1, p95Ms: 2.5 }, hasWorker: true }).on).toBe(true);
    // the learner's choice wins; the rod mechanics never runs on the main thread in the browser
    expect(resolvePhysicsMode({ choice: "simple", measured: { ...slow, medianMs: 1, p95Ms: 2 }, hasWorker: true })).toEqual({ on: false, reason: null });
    expect(resolvePhysicsMode({ choice: "rod", measured: slow, hasWorker: true }).on).toBe(true);
    expect(resolvePhysicsMode({ choice: "rod", hasWorker: false }).reason).toMatch(/background worker/);
    expect(resolvePhysicsMode({ choice: "rod", hasWorker: false, inThread: true }).on).toBe(true);
    expect(resolvePhysicsMode({ choice: "rod", hasWorker: true, catheterId: "NO-SUCH" }).on).toBe(false);
    expect(physicsStatusText({ choice: "simple", fallback: null })).toMatch(/simple model/);
    expect(physicsStatusText({ choice: "rod", fallback: { reason: "Fell behind.", at: 0 } })).toMatch(/Fell behind/);
  });

  it("is registered as the device physics implementation (impl/rod.ts)", () => {
    const impl = getPhysicsDevices();
    expect(impl?.id).toBe("rod");
    const d = impl!.create({ useWorker: false });
    expect(d).toBeInstanceOf(RodPhysicsDevices);
    expect(d.latest()).toBeNull();
    d.dispose();
  });

  it("a session without a worker falls back to the simple model and says why; the store keeps the analytic tip", () => {
    g().loadCase(CASE_LIBRARY[0], "free", "beginner");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { force: true } });
    sessions.push(s);
    expect(s.physics).toBeNull();
    expect(s.physicsMode.on).toBe(false);
    expect(s.physicsMode.reason).toMatch(/background worker/);
    for (let i = 0; i < 10; i++) s.step(1 / 60);
    expect(g().physicsOn).toBe(false);
  });

  it("falls back with a banner when the solver fails, and the store returns to the analytic model at the catheter's natural seat", () => {
    const s = open("diag-lm-fold-over-j-wire", "beginner", { ...PHYS, start: { tipBackMm: 60 } });
    s.setTimeOutDone(true);
    // seated in the left main by the rod first, so the fallback starts from a real procedure state
    s.physics!.runScript(engageScript(s.physics!, "left"), (sec) => {
      for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
    });
    expect(g().physicsOn).toBe(true);
    // the rod's insertion read-out is the length inside the patient, far from the analytic model's advance
    expect(g().controls.insertion).toBeGreaterThan(200);
    s.physics!.failed = "a test failure";
    s.step(1 / 60);
    expect(s.physics).toBeNull();
    expect(s.physicsBanner).toMatch(/simple model: a test failure/);
    expect(g().physicsOn).toBe(false);
    for (let i = 0; i < 30; i++) s.step(1 / 60);
    expect(g().engagement.kind).not.toBe("in-lv");
    expect(g().tip.pos.y).toBeGreaterThan(s.model.valvePlaneY);
    expect(Math.abs(g().controls.insertion)).toBeLessThan(50);
    expect(s.engine.tipInput.location).not.toBe("lv");
    // the analytic model is the same at every difficulty, as before
    g().setDifficulty("advanced");
    expect(g().engagement).toBeTruthy();
  });

  it("a hand command reaches the solver and moves the catheter; difficulty does not reach it", () => {
    const tips: number[][] = [];
    for (const d of ["beginner", "advanced"] as const) {
      const s = open("diag-lm-fold-over-j-wire", d);
      const input = s.physics!;
      for (let i = 0; i < 3; i++) s.step(1 / 60);
      const y0 = input.frame()!.catheter!.tip[1];
      input.command({ kind: "push", device: "catheter", mm: 20 });
      for (let i = 0; i < 60; i++) s.step(1 / 60);
      const tip = input.frame()!.catheter!.tip;
      expect(tip[1]).not.toBeCloseTo(y0, 1);
      tips.push([...tip]);
      expect(input.tableState().hubRollRad.catheter).toBe(0);
      s.dispose();
    }
    expect(tips[0]).toEqual(tips[1]);
  }, T);
});

describe("rod mechanics: the tip input and the bridged engagement", () => {
  const reading = (o: Partial<EngagementReading>): EngagementReading =>
    ({ region: "coronary", regionCode: 14, vessel: "LM", ostium: "lm", side: "left", depthMm: 2, coaxiality: 0.4, distanceToLm: 1, distanceToRca: 30, alignmentLm: 0.5, alignmentRca: 0, tipHeight: 13, wallForce: 0.05, openFraction: 0.7, dampingRisk: 0.3, inLV: false, prolapsed: false, foldExcessDeg: NaN, kind: "near-lm", selective: false, deep: false, conus: false, ...o }) as EngagementReading;

  it("a tip inside the left main the classifier does not find coaxial is selective in the labs' vocabulary; its quality is the open fraction", () => {
    const e = reading({});
    expect(bridgedKind(e)).toBe("selective-lm");
    const s = legacyEngagement(e);
    expect(s.isSelective).toBe(true);
    // a free seat does not read as non-coaxial (NON_COAXIAL_QUALITY 0.5); a seat that closes the ostium does
    expect(s.quality).toBeCloseTo(0.7, 6);
    expect(legacyEngagement(reading({ openFraction: 0.3 })).quality).toBeLessThan(0.5);
    // a seat the classifier calls selective keeps coaxiality times the open fraction
    expect(legacyEngagement(reading({ kind: "coaxial-lm", selective: true, coaxiality: 0.9, openFraction: 0.8 })).quality).toBeCloseTo(0.72, 6);
    // on the rim of the ostium it is still near; deep stays deep; the conus mouth is not the conus
    expect(bridgedKind(reading({ depthMm: 0.2 }))).toBe("near-lm");
    expect(bridgedKind(reading({ depthMm: 7, kind: "deep-lm", deep: true }))).toBe("deep-lm");
    expect(legacyEngagement(reading({ vessel: "CONUS", ostium: "conus", side: "right", conus: true, depthMm: -1.2, kind: "coaxial-rca" })).conus).toBe(false);
    expect(legacyEngagement(reading({ vessel: "CONUS", ostium: "conus", side: "right", conus: true, depthMm: 3, kind: "near-rca" })).conus).toBe(true);
  });

  it("the danger flag follows the analytic engagement (ventricle, deep, conus), not the classifier's damping risk; the trace carries the damping", () => {
    // the browser's scripted left seat: open fraction 0.47 and a firm wall load give a damping risk near 1
    const seat = reading({ openFraction: 0.47, wallForce: 0.4, dampingRisk: 0.99 });
    expect(legacyEngagement(seat).isDangerous).toBe(false);
    expect(legacyEngagement(reading({ depthMm: 7, kind: "deep-lm", deep: true })).isDangerous).toBe(true);
    expect(legacyEngagement(reading({ vessel: "CONUS", ostium: "conus", side: "right", conus: true, depthMm: 3, kind: "near-rca" })).isDangerous).toBe(true);
    expect(legacyEngagement(reading({ vessel: null, side: null, inLV: true, kind: "in-lv" })).isDangerous).toBe(true);
  });

  it("tipFromPhysics: the open fraction is the gap; the conus and the ventricle are their own chambers", () => {
    const base = { kind: "selective-lm" as const, side: "left" as const, vessel: "LM", depthMm: 2, openFraction: 0.6, wallForce: 0.1, conus: false, prolapsed: false };
    expect(tipFromPhysics(base)).toMatchObject({ location: "ostium", side: "left", gap: 0.6 });
    expect(tipFromPhysics({ ...base, kind: "deep-lm", depthMm: 8, openFraction: 0 })).toMatchObject({ location: "coronary", gap: 0 });
    expect(tipFromPhysics({ ...base, kind: "deep-lm", depthMm: 8, openFraction: 0 }).runoff).toBeUndefined();
    // a deep right seat drains into its side branch as in tipFromEngagement
    expect(tipFromPhysics({ ...base, kind: "deep-rca", side: "right", vessel: "RCA", depthMm: 8, openFraction: 0.1 })).toMatchObject({ location: "coronary", side: "right", runoff: MP_DEEP_RCA_RUNOFF });
    expect(tipFromPhysics({ ...base, kind: "deep-rca", side: "right", vessel: "CONUS", conus: true, openFraction: 0 })).toMatchObject({ location: "coronary", conus: true, gap: 0.09 });
    expect(tipFromPhysics({ ...base, kind: "in-lv", vessel: null, side: null })).toEqual({ location: "lv", lvContact: true });
    expect(tipFromPhysics({ ...base, kind: "ascending-aorta", vessel: null, side: null })).toEqual({ location: "aorta" });
  });
});

describe("rod mechanics: practice links", () => {
  it("the practice index lists diag-lm-fold-over-j-wire and diag-rca-dive-and-conus under pm-engaging-left, pm-engaging-rca and pm-engaging-fail", () => {
    const has = (lesson: string, id: string) => practiceForLesson(lesson).some((e) => e.sim === "cathlab" && e.scenario === id && e.source.endsWith("content/practice/diag-rod-physics.launch.ts"));
    expect(has("pm-engaging-left", "diag-lm-fold-over-j-wire")).toBe(true);
    expect(has("pm-engaging-rca", "diag-rca-dive-and-conus")).toBe(true);
    expect(has("pm-engaging-fail", "diag-lm-fold-over-j-wire")).toBe(true);
    expect(has("pm-engaging-fail", "diag-rca-dive-and-conus")).toBe(true);
  });

  it("the launch file agrees with the scenario data, and a launch opens each scenario in the lab", () => {
    expect(practiceLaunch.sim).toBe("cathlab");
    const fromLaunch = (practiceLaunch.scenarios ?? []).map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds }));
    expect(fromLaunch).toEqual(ROD_SCENARIOS.map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds })));
    for (const sc of ROD_SCENARIOS) {
      const l = caseForLaunch({ scenario: sc.id, mode: "guided" }, CASE_LIBRARY[0]);
      expect(l?.c.scenarioId).toBe(sc.id);
      expect(l?.c.accessRoute).toBe("femoral");
      expect(l?.c.chart).toBeTruthy();
      expect(l?.mode).toBe("guided");
      // the lab name states the presentation only
      expect(l?.c.name).toBe(sc.caseName);
    }
  });

  it("known gap: the scenarios live outside the diagnostic registry, so reconstructCase cannot rebuild their case ids (logbook replay) until a registry pack holds them", () => {
    for (const sc of ROD_SCENARIOS) {
      const id = scenarioCaseId(sc.id, DEFAULT_SCENARIO_SEED);
      expect(scenarioCase(sc.id, DEFAULT_SCENARIO_SEED, labScenarioById)?.id).toBe(id);
      // when this starts to pass, delete ROD_SCENARIOS and the lab's own lookup (diag-rod-physics notes)
      expect(reconstructCase(id)).toBeUndefined();
    }
  });
});
