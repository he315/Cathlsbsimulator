// diag-injection-run-quality through the diagnostic lab session, its event source: the syringe pushes through the
// lumen of the catheter in use with the hand's force, every push is judged when its flow stops (contrast-streaming,
// non-diagnostic-run, a test puff into a branch of the left main raising engage-fail), the classifier names the LAD of
// a short left main, every stored cine run carries its quality, the practice index lists the scenarios under their
// lessons, and every waiting.ts entry naming this package is satisfiable once the lab declares what the session raises.
//   npx vitest run src/ui/sim/runQuality.session.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { EngagementState } from "../../types";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore, declaredNonDiagnosticRuns, type StoredSeries } from "../../state/useSeriesStore";
import { CASE_LIBRARY, scenarioCase } from "../../simulation/caseGenerator";
import { LAB_EVENTS, LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../lab/diagnosticContext";
import { DIAG_SCENARIOS, scenariosEvents } from "../../simulation/diagnosticScenarios";
import { launch as runsLaunch } from "../../simulation/diagnosticScenarios/runs.launch";
import { MP_AS_FLOW_SCALE, RUN_SETUPS } from "../../simulation/diagnosticScenarios/runs";
import { practiceForLesson } from "../content/practiceIndex";
import { raises as scriptRaises } from "./modules/script";
import { LUMENS } from "../../simulation/injection";
import { RUN_QUALITY, assessRun, type InjectionQuality } from "../../simulation/imaging/runQuality";
import { DiagnosticLabSession, RUN_QUALITY_SESSION_EVENTS, RUN_QUALITY_SESSION_PHASES, type LabStart } from "./labSession";

const PACKAGE = "diag-injection-run-quality";
const g = () => useSimulatorStore.getState();
afterEach(() => {
  g().loadCase(CASE_LIBRARY[0], "free");
  useSeriesStore.getState().clear();
});

function session(id: string, seed = "1"): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, seed)!, "free");
  useSeriesStore.getState().clear();
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
  s.setTimeOutDone(true);
  // the catheter is at the root (the case opens there)
  s.rootReached = true;
  return s;
}
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);
/** The newest stored run. */
const lastRun = () => {
  const all = useSeriesStore.getState().series;
  return all[all.length - 1];
};

/** Put a catheter at a place in the legacy classifier's terms, as the other tips tests do. */
function seat(cath: string, kind: EngagementState["kind"], extra: Partial<EngagementState> = {}) {
  if (g().catheterId !== cath) g().setCatheter(cath);
  const left = kind.endsWith("-lm");
  const right = kind.endsWith("-rca");
  const e: Partial<EngagementState> = { kind, target: left ? "left" : right ? "right" : null, isSelective: kind.startsWith("selective-"), isDeep: kind.startsWith("deep-"), conus: false, depth: 0, quality: 0.8, ...extra };
  useSimulatorStore.setState({ engagement: { ...g().engagement, ...e } as EngagementState, aspirated: "clean" });
}

/** Step the session for `seconds` of lab time, handing it a frame each step while cine runs. */
function run(s: DiagnosticLabSession, seconds: number, dt = 0.05) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    s.step(dt);
    if (g().pedal.cine) s.onExposedFrame(new Uint8Array(4), "cine");
  }
}

/** A hand push: the plunger at `force` for `holdS`, then released and the flow left to stop. */
function push(s: DiagnosticLabSession, force: number, holdS: number) {
  s.onSyringe({ port: "contrast", force });
  run(s, holdS);
  s.onSyringe({ port: "contrast", force: 0 });
  run(s, 0.6);
  return s.pushes[s.pushes.length - 1];
}

describe("the syringe and the catheter's lumen", () => {
  it("the lumen follows the catheter in use: the 6 Fr diagnostic, the 5 Fr version and a guide", () => {
    const s = session("diag-streaming-weak-injection");
    try {
      expect(g().catheterId).toBe("JL4");
      s.step(0.05);
      expect(s.injector.catheter).toBe(LUMENS["diag-6"]);
      g().setCatheter("JL4-5F");
      s.step(0.05);
      expect(s.injector.catheter).toBe(LUMENS["diag-5"]);
      g().setCatheter("EBU3.5");
      s.step(0.05);
      expect(s.injector.catheter).toBe(LUMENS["guide-6"]);
    } finally {
      s.dispose();
    }
  });

  it("the hand's force sets the aimed flow: a light push delivers less per second than the keyboard's standard push, and pushing harder mid-push raises the flow", () => {
    const s = session("diag-streaming-weak-injection");
    try {
      seat("JL4", "selective-lm");
      const light = push(s, 0.2, 2);
      run(s, 4);
      seat("JL4", "selective-lm");
      const std = push(s, 0.7, 2);
      expect(light.quality!.meanFlowMlS).toBeLessThan(0.5 * std.quality!.meanFlowMlS);
      run(s, 4);
      seat("JL4", "selective-lm");
      s.onSyringe({ port: "contrast", force: 0.2 });
      run(s, 1);
      const early = s.injector.trace!.q[s.injector.trace!.q.length - 1];
      s.onSyringe({ port: "contrast", force: 0.7 });
      run(s, 1);
      const late = s.injector.trace!.q[s.injector.trace!.q.length - 1];
      expect(late).toBeGreaterThan(2 * early);
      s.onSyringe({ port: "contrast", force: 0 });
    } finally {
      s.dispose();
    }
  });
});

describe("diag-streaming-weak-injection raises what its tips need", () => {
  it("after the action that raises 'contrast-streaming' (a light, slow push into the left coronary) tipsFor(ctx, 20) includes diag-interp-fill-or-call-nondiagnostic; after the action that raises 'conus-selective' it includes diag-conus-withdraw", () => {
    const s = session("diag-streaming-weak-injection");
    try {
      seat("JL4", "selective-lm");
      expect(s.activeEvents()).not.toContain("contrast-streaming");
      expect(tipIds(s)).not.toContain("diag-interp-fill-or-call-nondiagnostic");
      // the action: a light push of a few millilitres, held 4 s
      const p = push(s, 0.2, 4);
      expect(p.quality).not.toBeNull();
      expect(p.quality!.testPuff).toBe(false);
      expect(p.quality!.streaming).toBe(true);
      expect(s.activeEvents()).toContain("contrast-streaming");
      const ctx = s.tipContext();
      expect(ctx.phase).toBe("inject");
      expect(tipIds(s)).toContain("diag-interp-fill-or-call-nondiagnostic");
      expect(tipIds(s)).toContain("diag-acq-streaming-fill");
      expect(tipIds(s)).toContain("diag-post-nondiagnostic");
      // a firm push that fills the artery clears it
      run(s, 4);
      seat("JL4", "selective-lm");
      const f = push(s, 0.7, 4);
      expect(f.quality!.streaming).toBe(false);
      expect(f.quality!.reflux).toBe(true);
      expect(f.quality!.underfilled).toBe(false);
      expect(s.activeEvents()).not.toContain("contrast-streaming");

      // the action that raises 'conus-selective': the JR4 rides up into the conus
      run(s, 4);
      seat("JR4", "selective-rca", { conus: true });
      s.step(0.05);
      expect(s.tipContext().events).toContain("conus-selective");
      expect(tipIds(s)).toContain("diag-conus-withdraw");
    } finally {
      s.dispose();
    }
  });

  it("a filmed run that streams is stored as non-diagnostic and raises non-diagnostic-run; the learner can declare it and the study report starts from the declaration", () => {
    const s = session("diag-streaming-weak-injection");
    try {
      seat("JL4", "selective-lm");
      s.holdBreath(true);
      s.setPedal({ fluoro: false, cine: true });
      run(s, 1.5);
      push(s, 0.2, 4);
      run(s, 2);
      s.setPedal({ fluoro: false, cine: false });
      const st = useSeriesStore.getState();
      const r = st.series[st.series.length - 1];
      expect(r.kind).toBe("cine");
      expect(r.quality).toBeDefined();
      expect(r.quality!.nonDiagnostic).toBe(true);
      expect(r.quality!.tags).toEqual(expect.arrayContaining(["streaming", "non-diagnostic"]));
      expect(r.quality!.pushDelayS!).toBeGreaterThanOrEqual(RUN_QUALITY.pushDelayS.min);
      expect(r.quality!.tags).not.toContain("early-injection");
      expect(r.quality!.tags).not.toContain("free-breathing");
      expect(s.activeEvents()).toContain("non-diagnostic-run");
      expect(s.lastRunQuality).toBe(r.quality);
      st.declareNonDiagnostic(r.id, true);
      expect(declaredNonDiagnosticRuns(useSeriesStore.getState(), g().caseData.id)).toEqual([r.number]);
      useSeriesStore.getState().declareNonDiagnostic(r.id, false);
      expect(declaredNonDiagnosticRuns(useSeriesStore.getState(), g().caseData.id)).toEqual([]);
    } finally {
      s.dispose();
    }
  });
});

describe("diag-high-flow-as-streaming: the 5 Fr catheter streams in high flow; a larger lumen and a firm push clear it", () => {
  it("opens with the 5 Fr JL4 and the high resting flow; a firm 5 Fr push raises contrast-streaming, and the 6 Fr JL4 with a firm push clears it", () => {
    const s = session("diag-high-flow-as-streaming");
    try {
      expect(g().catheterId).toBe("JL4-5F");
      expect(RUN_SETUPS["diag-high-flow-as-streaming"].flowScale!.left).toBe(MP_AS_FLOW_SCALE);
      run(s, 1);
      expect(s.flowScaleFor("left")).toBeGreaterThan(1.3);
      seat("JL4-5F", "selective-lm");
      const small = filmedPush(s, 1, 4).push;
      expect(small.quality!.peakFlowMlS).toBeLessThan(1.6);
      expect(small.quality!.streaming).toBe(true);
      expect(s.activeEvents()).toContain("contrast-streaming");
      expect(s.activeEvents()).toContain("non-diagnostic-run");
      expect(tipIds(s)).toEqual(expect.arrayContaining(["diag-as-high-flow-fill", "diag-interp-fill-or-call-nondiagnostic"]));
      // upsize to the 6 Fr JL4 and push firmly
      run(s, 4);
      g().setCatheter("JL4");
      run(s, 0.2);
      seat("JL4", "selective-lm");
      const { push: big, stored } = filmedPush(s, 1, 4);
      expect(big.quality!.peakFlowMlS).toBeGreaterThan(1.8 * small.quality!.peakFlowMlS);
      expect(big.quality!.streamingIndex).toBeLessThan(small.quality!.streamingIndex);
      expect(big.quality!.streaming).toBe(false);
      expect(s.activeEvents()).not.toContain("contrast-streaming");
      // the repeated run is readable, so the earlier run's non-diagnostic-run is cleared
      expect(stored.quality!.nonDiagnostic).toBe(false);
      expect(s.activeEvents()).not.toContain("non-diagnostic-run");
    } finally {
      s.dispose();
    }
  });
});

describe("diag-4fr-ectatic carries the large vessel", () => {
  it("the large ectatic RCA is a case property, so the large-vessel tip shows on a streaming push through the small catheter", () => {
    const s = session("diag-4fr-ectatic");
    try {
      expect(g().catheterId).toBe("JR4-5F");
      expect(s.activeEvents()).toContain("large-vessel");
      seat("JR4-5F", "selective-rca");
      const p = push(s, 1, 4);
      expect(p.quality!.streaming).toBe(true);
      expect(tipIds(s)).toContain("diag-ocx-large-vessel-fill");
    } finally {
      s.dispose();
    }
  });
});

describe("diag-short-lm-superselective: the classifier names the branch", () => {
  it("a JL4 seated in the short left main is in the LAD: the push fills the LAD alone, the context names the LAD, and a test puff there raises engage-fail; one size larger is at the circumflex", () => {
    const s = session("diag-short-lm-superselective");
    try {
      seat("JL4", "selective-lm");
      expect(s.classifierVessel()).toBe("LAD");
      expect(s.tipContext().vessel).toBe("LAD");
      // a test puff: a short push of under 3 mL
      s.onSyringe({ port: "contrast", force: 0.7 });
      run(s, 0.1);
      expect(s.bolusFor()?.vessel).toBe("LAD");
      run(s, 0.4);
      s.onSyringe({ port: "contrast", force: 0 });
      run(s, 1);
      const puff = s.testPuffs[s.testPuffs.length - 1];
      expect(puff).toBeDefined();
      expect(puff.volumeMl).toBeLessThan(RUN_QUALITY.testPuffMl);
      expect(puff.tip).toEqual({ kind: "selective-lm", vessel: "LAD" });
      expect(s.activeEvents()).toContain("engage-fail");
      expect(s.tipContext().vessel).toBe("LAD");
      expect(tipIds(s)).toContain("diag-engage-fail-ladder");
      run(s, 4);
      seat("JL4.5", "selective-lm");
      expect(s.classifierVessel()).toBe("LCx");
    } finally {
      s.dispose();
    }
  });

  it("outside the scenario the classifier names nothing and the left main fills as before", () => {
    const s = session("diag-streaming-weak-injection");
    try {
      seat("JL4", "selective-lm");
      expect(s.classifierVessel()).toBeNull();
      expect(s.tipContext().vessel).toBe("LM");
    } finally {
      s.dispose();
    }
  });
});

describe("diag-run-mechanics: a stored run records how it was acquired", () => {
  it("a run panned during cine is tagged panned; a still run with the breath held and the push after 1.5 s is not", () => {
    const s = session("diag-run-mechanics");
    try {
      seat("JL4", "selective-lm");
      s.holdBreath(true);
      s.setPedal({ fluoro: false, cine: true });
      run(s, 1.5);
      push(s, 0.7, 3.5);
      run(s, 2.5);
      s.setPedal({ fluoro: false, cine: false });
      const still = lastRun();
      expect(still.quality!.tags).not.toContain("panned");
      expect(still.quality!.nonDiagnostic).toBe(false);
      run(s, 4);
      seat("JL4", "selective-lm");
      s.holdBreath(true);
      s.setPedal({ fluoro: false, cine: true });
      run(s, 1.5);
      s.table.setCommandedVelocity(40, 0);
      push(s, 0.7, 3.5);
      s.table.setCommandedVelocity(0, 0);
      run(s, 2.5);
      s.setPedal({ fluoro: false, cine: false });
      const panned = lastRun();
      expect(panned.quality!.table.maxSpeedMmS).toBeGreaterThan(RUN_QUALITY.panSpeedMmS);
      expect(panned.quality!.tags).toContain("panned");
    } finally {
      s.dispose();
    }
  });

  it("diag-qfr-acquisition: a run of the intermediate LAD lesion carries the QFR check; nitrate is missing before any is given", () => {
    const s = session("diag-qfr-acquisition");
    try {
      seat("JL4", "selective-lm");
      s.holdBreath(true);
      s.setPedal({ fluoro: false, cine: true });
      run(s, 1.5);
      push(s, 0.7, 3.5);
      run(s, 2.5);
      s.setPedal({ fluoro: false, cine: false });
      const r = lastRun();
      expect(r.quality!.qfr.applicable).toBe(true);
      expect(r.quality!.lesion!.vessel).toBe("LAD");
      expect(r.quality!.qfr.criteria.find((x) => x.id === "nitrate")!.ok).toBe(false);
      expect(r.quality!.qfr.criteria.find((x) => x.id === "second-projection")!.ok).toBe(false);
      expect(r.quality!.qfr.ok).toBe(false);
    } finally {
      s.dispose();
    }
  });
});

/**
 * Seat the catheter and let the pressure trace settle on the seated tip (the operator checks the pressure before
 * injecting): a damped or ventricularised trace is a wedged tip, which overdrives the artery and does not reflux.
 */
function seatSettled(s: DiagnosticLabSession, cath: string, kind: EngagementState["kind"]) {
  seat(cath, kind);
  run(s, 4);
  seat(cath, kind);
  expect(g().pressure.kind).toBe("aortic");
}

/** Film one push: pedal, breath held, push at `force` after 1.5 s for `holdS`, then 2.5 s more of cine. */
function filmedPush(s: DiagnosticLabSession, force: number, holdS: number) {
  s.holdBreath(true);
  s.setPedal({ fluoro: false, cine: true });
  run(s, 1.5);
  const p = push(s, force, holdS);
  run(s, 2.5);
  s.setPedal({ fluoro: false, cine: false });
  return { push: p, stored: lastRun() };
}

describe("Oxford's standard volumes at the keyboard's standard push are read as diagnostic runs", () => {
  for (const scenario of ["diag-run-mechanics", null] as const) {
    it(`${scenario ?? "a library case"}: a filmed RCA push of about 4 mL and a filmed left push of about 7 mL through the 6 Fr diagnostic at force 0.7 fill for 3 beats with reflux and raise no non-diagnostic-run`, () => {
      g().loadCase(scenario ? scenarioCase(scenario, "1")! : CASE_LIBRARY[0], "free");
      useSeriesStore.getState().clear();
      const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
      s.setTimeOutDone(true);
      s.rootReached = true;
      try {
        for (const [cath, kind, holdS, lo, hi] of [
          ["JR4", "selective-rca", 1.8, 3.5, 5],
          ["JL4", "selective-lm", 2.7, 6, 8],
        ] as const) {
          seatSettled(s, cath, kind);
          const { push: p, stored } = filmedPush(s, 0.7, holdS);
          const q = p.quality!;
          expect(q.volumeMl, cath).toBeGreaterThan(lo);
          expect(q.volumeMl, cath).toBeLessThan(hi);
          expect(q.streaming, cath).toBe(false);
          expect(q.reflux, cath).toBe(true);
          expect(q.beatsOpacified, cath).toBeGreaterThanOrEqual(RUN_QUALITY.beatsMin);
          expect(stored.quality!.nonDiagnostic, cath).toBe(false);
          expect(stored.quality!.tags, cath).not.toEqual(expect.arrayContaining(["non-diagnostic"]));
          expect(s.activeEvents(), cath).not.toContain("non-diagnostic-run");
          run(s, 4);
        }
      } finally {
        s.dispose();
      }
    });
  }
});

describe("the QFR pair is a run QFR could use", () => {
  const good: InjectionQuality = { volumeMl: 8, peakFlowMlS: 2.6, meanFlowMlS: 2.5, pushS: 3, testPuff: false, streamingIndex: 0.1, refluxMl: 1, reflux: true, missedMl: 0, opacifiedS: 4, beatsOpacified: 5, streaming: false, underfilled: false };
  /** A stored run of the LAD lesion at a view, judged as the session would judge it (panned or still). */
  function partner(caseId: string, panned: boolean): StoredSeries {
    const quality = assessRun({
      injection: good,
      selective: true,
      tip: { kind: "selective-lm", vessel: null },
      pushDelayS: 1.5,
      tailS: 3,
      distalArrivalS: 1.9,
      fps: 15,
      table: panned ? { maxSpeedMmS: 40, travelMm: 30 } : { maxSpeedMmS: 0, travelMm: 0 },
      fieldChanged: false,
      breathHeldShare: 1,
      lesion: { vessel: "LAD", severityPct: 60, view: { foreshortening: 0.95, overlap: false, axis: { x: 0, y: 0, z: -1 } }, nitrate: true, pairSeparationDeg: null },
    });
    const cArm = { laoRao: -30, cranialCaudal: -25 };
    return { id: `partner-${panned ? "panned" : "still"}`, number: 1, kind: "cine", caseId, startedAt: 0, fps: 15, w: 4, h: 4, frames: [new Uint8Array(16)], cArm, cArmEnd: cArm, fieldCm: 20, mmPerPxIso: 0.3, durationS: 4, karMGy: 0, kapGyCm2: 0, contrastMl: 8, injected: true, catheterId: "JL4", quality };
  }

  for (const panned of [false, true]) {
    it(`diag-qfr-acquisition: a ${panned ? "panned" : "still"} first projection ${panned ? "does not give" : "gives"} the second run its pair`, () => {
      const s = session("diag-qfr-acquisition");
      try {
        useSeriesStore.getState().add(partner(s.caseId, panned));
        g().setCArm({ laoRao: 0, cranialCaudal: 35 });
        seatSettled(s, "JL4", "selective-lm");
        const { stored } = filmedPush(s, 0.7, 3);
        const pair = stored.quality!.qfr.criteria.find((x) => x.id === "second-projection")!;
        expect(stored.quality!.lesion!.vessel).toBe("LAD");
        if (panned) {
          expect(stored.quality!.lesion!.pairSeparationDeg).toBeNull();
          expect(pair.ok).toBe(false);
        } else {
          expect(stored.quality!.lesion!.pairSeparationDeg!).toBeGreaterThanOrEqual(RUN_QUALITY.qfrPairDeg);
          expect(pair.ok).toBe(true);
        }
      } finally {
        s.dispose();
      }
    });
  }
});

describe("a session handed over from the access stage keeps the scenario's physiology", () => {
  it("diag-high-flow-as-streaming started from a hand-over keeps its catheter but still has the high resting flow", () => {
    g().loadCase(scenarioCase("diag-high-flow-as-streaming", "1")!, "free");
    useSeriesStore.getState().clear();
    g().setCatheter("JL4");
    const plain = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
    const engine = plain.engine;
    let s: DiagnosticLabSession | null = null;
    try {
      const start: LabStart = { engine, catheterId: "JL4" };
      s = new DiagnosticLabSession(useSimulatorStore, null, start, { team: false });
      // the hand-over's catheter, not the scenario's 5 Fr start catheter
      expect(g().catheterId).toBe("JL4");
      expect(s.runSetup?.flowScale?.left).toBe(MP_AS_FLOW_SCALE);
      s.step(0.05);
      expect(s.flowScaleFor("left")).toBeGreaterThan(1.3);
    } finally {
      s?.dispose();
      plain.dispose();
    }
  });
});

describe("links and reachability", () => {
  it("practiceIndex lists the scenarios diag-streaming-weak-injection, diag-high-flow-as-streaming, diag-4fr-ectatic under lessons pm-interpreting-pitfalls, pm-interpreting-anomalies, pm-acquiring-cine (from runs.launch.ts)", () => {
    const ids = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab" && e.source.endsWith("diagnosticScenarios/runs.launch.ts")).map((e) => e.scenario);
    expect(ids("pm-interpreting-pitfalls")).toEqual(expect.arrayContaining(["diag-streaming-weak-injection", "diag-high-flow-as-streaming"]));
    expect(ids("pm-interpreting-anomalies")).toContain("diag-streaming-weak-injection");
    expect(ids("pm-acquiring-cine")).toEqual(expect.arrayContaining(["diag-streaming-weak-injection", "diag-high-flow-as-streaming", "diag-4fr-ectatic"]));
    for (const sc of runsLaunch.scenarios ?? []) for (const lessonId of sc.lessonIds) expect(ids(lessonId), `${sc.id} under ${lessonId}`).toContain(sc.id);
  });

  it("every waiting.ts entry naming diag-injection-run-quality is satisfiable once the lab declares what the session raises, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    expect(mine.length).toBeGreaterThanOrEqual(5);
    const session: LabRaises = { lab: "diagnostic", phases: RUN_QUALITY_SESSION_PHASES, events: RUN_QUALITY_SESSION_EVENTS };
    const after: LabRaises[] = [diagnosticRaises, scriptRaises, session];
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    for (const d of deferred) expect(satisfiableIn(d.when, d.when.phase, after), d.tipId).toBe(true);
    const IDS = new Set((runsLaunch.scenarios ?? []).map((x) => x.id));
    const before: LabRaises[] = [diagnosticRaises, { lab: "diagnostic", phases: [], events: scenariosEvents(DIAG_SCENARIOS.filter((x) => !IDS.has(x.id))) }];
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    expect(stillWaiting(before) - stillWaiting(after)).toBeGreaterThanOrEqual(mine.length);
    // the session declares what it raises (RUN_QUALITY_SESSION_EVENTS at RUN_QUALITY_SESSION_PHASES); the reachability
    // report reads the lab's raises from src/ui/lab/diagnosticContext.ts, outside this package, which should add them
    // as it does PRESSURE_SESSION_EVENTS
    for (const e of RUN_QUALITY_SESSION_EVENTS) expect(LAB_EVENTS, e).toContain(e);
  });
});

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));
