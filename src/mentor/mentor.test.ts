import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AnatomyCase, MistakeCode } from "../types";
import { CASE_LIBRARY, PRESET_ORDER, caseById, generateBatch } from "../simulation/caseGenerator";
import { PCI_SCENARIOS } from "../simulation/angioPci";
import { VIEW_PRESETS } from "../data/viewPresets";
import { MISTAKE_INFO } from "../data/teachingText";
import { buildAnatomy } from "../simulation/anatomy";
import { buildCoronaryTree } from "../render/xray/coronaryTree";
import { Rng } from "../utils/random";
import { __resetIdbForTests, idbStore } from "../utils/idb";
import { LegacyDiagnosticHost } from "./hosts/legacyDiagnostic";
import { BYTES_PER_FRAME, FrameTable, ProcedureRecorder, RecordedSession, StepLog, emptyFrame, listRecordings, loadRecording, MAX_STORED, recordBytes, saveRecording, saveTakeHome, lastTakeHome, deleteRecording, type ProcedureRecord } from "./telemetry";
import { ReplayController, firstEventMismatch, hostEvents } from "./replay";
import { analyse, ANALYSIS_PARAMS, type CaseFacts } from "./analysis";
import { computeMetrics, type DiagnosticMetrics, type PciMetrics } from "./metrics";
import { ALL_MISTAKES, detectMistakes } from "./mistakes";
import { computeCoverage, foreshortening, requiredSegments, segmentForeshortening, DEFAULT_COVERAGE, resample, standardisedLoops, viewFamily, type SegmentGeometry } from "./coverage";
import { segmentLabelAt, treeSegmentGeometry, treeLabels } from "./treeSegments";
import { DIAGNOSTIC_FULL_STUDY, buildBenchmark, evaluateStandards, exportBenchmark, importBenchmark, standardsFromBenchmark, SOURCES } from "./standards";
import { MentorEngine } from "./mentor";
import { ALL_RULES, MENTOR_PARAMS, RULE_FILES, RULES, ruleById } from "./rules";
import type { MentorInput, PciInput } from "./context";
import { beamAllowed, visibilityFor } from "./visibility";
import { gradeAnswers, planVsExecution, shuffleOptions, timeOutComplete, timeOutItems, type ProcedurePlan } from "./prebrief";
import { allPrebriefQuestions, prebriefForCase, prebriefForScenario, TEMPLATE_PREBRIEFS } from "../content/mentor/prebriefs";
import { buildDebrief, findDecisionPoints, narrate } from "./debrief";
import { PCI_CARD_TEMPLATES, SKILL_CARD_TEMPLATES, findStartControls, approxRecordWeight, cardForCode, decayedWeight, dueCardIds, gradeCard, resolveDiagnosticStart, reviewCard } from "./skillCards";
import { compareToExpert, deferredDemonstrator, dtwDistance } from "./demonstrator";
import { bandOf, compareReport } from "./report";
import { assessAttempt, utteranceData } from "./index";
import { timelineLanes } from "./timeline";
import type { AssessmentMode, EntrustmentLevel, MentorUtterance, RecordingMeta } from "./types";
import { newPciBridgeMemory, pciMentorInput, pciPreActionFor, type PciBridgeSource } from "./bridge/pciSession";
import { PciLabSession } from "../ui/pci/PciLabSession";
import { resolvePciLaunch } from "../ui/pci/launch";
import { pathTo } from "../simulation/pci/geometry";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const meta = (over: Partial<RecordingMeta> = {}): RecordingMeta => ({ id: "rec", startedAt: 0, caseId: "easy-left-0", lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1", ...over });

const DT = 1 / 60;

/** A scripted diagnostic session on the legacy engine. */
function scriptedSession(c: AnatomyCase = caseById("easy-left-0")!) {
  const mk = () => new LegacyDiagnosticHost({ caseData: c, seed: 7 });
  const s = new RecordedSession(mk(), meta({ caseId: c.id, context: { catheterId: c.recommendedCatheters[0] } }));
  let t = 0;
  const run = (secs: number) => {
    const n = Math.round(secs / DT);
    for (let i = 0; i < n; i++) {
      t += DT;
      s.step(DT, t);
    }
  };
  s.event("case-start", { caseId: c.id }, 0);
  run(0.5);
  // push into the ventricle in small hand movements, then recover
  for (let k = 0; k < 7; k++) {
    s.apply({ kind: "push", device: "catheter", mm: 2.5 }, t);
    run(0.4);
  }
  run(1.5);
  s.apply({ kind: "push", device: "catheter", mm: -17.5 }, t);
  run(2.5);
  // a cine run with an injection but no aspirate
  s.apply({ kind: "carm", cArm: { laoRao: -22, cranialCaudal: -22 } }, t);
  s.apply({ kind: "pedal", pedal: { fluoro: false, cine: true } }, t);
  run(0.6);
  s.apply({ kind: "syringe", syringe: { port: "contrast", force: 0.8 }, ml: 7 }, t);
  run(3.2);
  s.apply({ kind: "pedal", pedal: { fluoro: false, cine: false } }, t);
  run(1);
  // aspirate, new view, clean run
  s.apply({ kind: "syringe", syringe: { port: "aspirate", force: -0.5 } }, t);
  s.apply({ kind: "carm", cArm: { laoRao: -20, cranialCaudal: 24 } }, t);
  s.apply({ kind: "pedal", pedal: { fluoro: false, cine: true } }, t);
  run(0.5);
  s.apply({ kind: "syringe", syringe: { port: "contrast", force: 0.8 }, ml: 7 }, t);
  run(3.5);
  s.apply({ kind: "pedal", pedal: { fluoro: false, cine: false } }, t);
  run(0.5);
  // change to a right catheter, ride up into the conus and inject there
  s.apply({ kind: "device", slot: "catheter", id: "JR4" }, t);
  run(1);
  const conus = findStartControls(c, "JR4", "selective-rca", { conus: true });
  if (!conus) throw new Error("no conus position for this case");
  s.apply({ kind: "push", device: "catheter", mm: conus.insertion }, t);
  s.apply({ kind: "torque", device: "catheter", rad: conus.torque }, t);
  run(2.5);
  s.apply({ kind: "pedal", pedal: { fluoro: true, cine: false } }, t);
  run(1);
  s.apply({ kind: "syringe", syringe: { port: "contrast", force: 0.6 }, ml: 5 }, t);
  run(1);
  s.apply({ kind: "action", name: "defibrillate" }, t);
  s.apply({ kind: "pedal", pedal: { fluoro: false, cine: false } }, t);
  run(1);
  s.event("case-end", { reason: "finished" }, t);
  return { session: s, record: s.finish(1), mk, case: c };
}

/** Write frames and events directly (synthetic scenarios for metrics and mistakes). */
class SyntheticLog {
  rec: ProcedureRecorder;
  t = 0;
  private step = 0;
  private last = emptyFrame();
  constructor(m: Partial<RecordingMeta> = {}) {
    this.rec = new ProcedureRecorder(meta(m));
  }
  frame(over: Partial<ReturnType<typeof emptyFrame>>, dt = 0.1) {
    this.t += dt;
    this.step++;
    this.last = { ...this.last, ...over, tWall: this.t, step: this.step };
    this.rec.sample(this.last, true);
    return this;
  }
  hold(secs: number, over: Partial<ReturnType<typeof emptyFrame>> = {}) {
    for (let i = 0; i < Math.round(secs / 0.1); i++) this.frame(over);
    return this;
  }
  event(kind: string, data?: Record<string, unknown>) {
    this.rec.event({ kind, data, tWall: this.t, tPatient: this.t, step: this.step, cmd: 0 });
    return this;
  }
  record(): ProcedureRecord {
    return this.rec.toRecord();
  }
}

const ENG = (k: string) => ["not-in-root", "ascending-aorta", "sinus-level", "below-valve", "in-lv", "near-lm", "coaxial-lm", "selective-lm", "deep-lm", "near-rca", "coaxial-rca", "selective-rca", "deep-rca", "non-selective", "dangerous"].indexOf(k);
const PRESS = (k: string) => ["aortic", "lv", "damped", "ventricularised", "wedged", "noisy", "dissected"].indexOf(k);

function mistakesOf(r: ProcedureRecord, facts: CaseFacts = {}, opts: Parameters<typeof detectMistakes>[2] = {}) {
  const { analysis, metrics } = computeMetrics(r, facts, opts?.budgets ? {} : {});
  return detectMistakes(analysis, metrics, { facts, ...opts }).tally;
}

beforeEach(() => __resetIdbForTests());

// ---------------------------------------------------------------------------
// telemetry
// ---------------------------------------------------------------------------

describe("telemetry recorder", () => {
  it("quantises tip pose to within 0.005 mm and keeps NaN for absent PCI fields", () => {
    const t = new FrameTable(4);
    const rng = new Rng("q");
    let worst = 0;
    for (let i = 0; i < 500; i++) {
      const f = { ...emptyFrame(), tWall: i * 0.1, tipX: rng.range(-200, 200), tipY: rng.range(-200, 200), tipZ: rng.range(-200, 200) };
      t.push(f);
      const g = t.get(i);
      worst = Math.max(worst, Math.abs(g.tipX - f.tipX), Math.abs(g.tipY - f.tipY), Math.abs(g.tipZ - f.tipZ));
      expect(Number.isNaN(g.deviceMm)).toBe(true);
    }
    expect(worst).toBeLessThanOrEqual(0.005 + 1e-9);
    expect(t.length).toBe(500);
    const back = FrameTable.from(t.serialize());
    expect(back.get(123)).toEqual(t.get(123));
  });

  it("stores 73 bytes per frame: about 440 kB of frames for a 10-minute case at 10 Hz", () => {
    expect(BYTES_PER_FRAME).toBe(73);
    expect(BYTES_PER_FRAME * 6000).toBeLessThan(450_000);
  });

  it("run-length encodes the dt sequence with random access", () => {
    const l = new StepLog();
    for (let i = 0; i < 1000; i++) l.push(DT);
    l.push(0.02);
    for (let i = 0; i < 10; i++) l.push(DT);
    expect(l.length).toBe(1011);
    expect(l.runs()).toBe(3);
    expect(l.at(999)).toBe(DT);
    expect(l.at(1000)).toBe(0.02);
    expect([...l.range(998, 1003)]).toEqual([DT, DT, 0.02, DT, DT]);
    const back = StepLog.from(l.serialize());
    expect(back.at(1000)).toBe(0.02);
    expect(back.length).toBe(1011);
  });

  it("decimates samples to 10 Hz", () => {
    const r = new ProcedureRecorder(meta());
    for (let i = 0; i <= 600; i++) r.sample({ ...emptyFrame(), tWall: i / 60 });
    expect(r.frames.length).toBeGreaterThanOrEqual(99);
    expect(r.frames.length).toBeLessThanOrEqual(102);
  });

  it("persists the newest 50 attempts (memory fallback when IndexedDB is absent)", async () => {
    for (let i = 0; i < MAX_STORED + 5; i++) {
      const r = new ProcedureRecorder(meta({ id: `a${i}`, startedAt: 1000 + i }));
      r.sample({ ...emptyFrame(), tWall: i });
      await saveRecording(r.toRecord());
    }
    const list = await listRecordings();
    expect(list.length).toBe(MAX_STORED);
    expect(list[0].id).toBe(`a${MAX_STORED + 4}`);
    expect(await loadRecording("a0")).toBeUndefined();
    expect((await loadRecording(`a${MAX_STORED + 4}`))?.meta.id).toBe(`a${MAX_STORED + 4}`);
    await saveTakeHome({ caseId: "x", at: 5, takeHome: "Next time I will aspirate." });
    await saveTakeHome({ caseId: "y", at: 9, takeHome: "Next time I will look at the trace." });
    expect((await lastTakeHome())?.takeHome).toBe("Next time I will look at the trace.");
  });
});

// ---------------------------------------------------------------------------
// deterministic replay
// ---------------------------------------------------------------------------

describe("deterministic replay", () => {
  it("replays a scripted case with an identical event sequence and the tip pose within 0.1 mm", () => {
    const { record, mk } = scriptedSession();
    const host = hostEvents(record);
    const kinds = new Set(host.map((e) => e.kind));
    // the script exercised the interesting paths
    for (const k of ["engagement", "pressure", "inject", "aspirate", "cine-start", "cine-end", "catheter", "complication", "view"]) expect(kinds.has(k)).toBe(true);
    const rc = new ReplayController(record, mk);
    const out = rc.replayAll();
    expect(firstEventMismatch(out.events, host)).toBe(-1);
    const f = FrameTable.from(record.frames);
    expect(out.samples.length).toBe(f.length);
    let worst = 0;
    for (let i = 0; i < f.length; i++) {
      const s = out.samples[i];
      worst = Math.max(worst, Math.hypot(s.tipX - f.value(i, "tipX"), s.tipY - f.value(i, "tipY"), s.tipZ - f.value(i, "tipZ")));
    }
    expect(worst).toBeLessThan(0.1);
    console.info(`[S11] scripted replay: ${host.length} host events identical, worst tip error ${worst.toExponential(1)} mm over ${f.length} frames`);
  });

  it("seeks to any time and reproduces the recorded state; seek cost on a 10-minute case is bounded", () => {
    const c = caseById("easy-rca-0")!;
    const mk = () => new LegacyDiagnosticHost({ caseData: c, catheterId: "JR4", seed: 3 });
    const s = new RecordedSession(mk(), meta({ caseId: c.id }));
    const rng = new Rng("long");
    let t = 0;
    const steps = 600 * 60;
    for (let i = 0; i < steps; i++) {
      if (i % 90 === 0) s.apply({ kind: "push", device: "catheter", mm: rng.range(-1.2, 1.2) }, t);
      if (i % 70 === 0) s.apply({ kind: "torque", device: "catheter", rad: rng.range(-0.15, 0.15) }, t);
      if (i % 600 === 0) s.apply({ kind: "pedal", pedal: { fluoro: rng.next() < 0.5, cine: false } }, t);
      t += DT;
      s.step(DT, t);
    }
    const record = s.finish(1);
    const bytes = recordBytes(record);
    const rc = new ReplayController(record, mk);
    const f = FrameTable.from(record.frames);
    let worstMs = 0;
    let worstErr = 0;
    let maxSteps = 0;
    for (let k = 0; k < 40; k++) {
      const i = Math.floor(rng.next() * f.length);
      const t0 = performance.now();
      const r = rc.seekStep(f.value(i, "step"));
      worstMs = Math.max(worstMs, performance.now() - t0);
      maxSteps = Math.max(maxSteps, r.stepsRun);
      worstErr = Math.max(worstErr, Math.hypot(r.sample.tipX - f.value(i, "tipX"), r.sample.tipY - f.value(i, "tipY"), r.sample.tipZ - f.value(i, "tipZ")));
    }
    // keyframes every 10 s bound a seek to about 600 host steps
    expect(maxSteps).toBeLessThanOrEqual(601);
    expect(worstErr).toBeLessThan(0.1);
    expect(worstMs).toBeLessThan(100);
    console.info(`[S11] 10-min record: ${f.length} frames, ${record.snapshots.length} snapshots, ${(bytes / 1024).toFixed(0)} kB; worst seek ${worstMs.toFixed(1)} ms (${maxSteps} steps), worst tip error ${worstErr.toExponential(1)} mm`);
  });

  it("rewinds to a decision point and branches deterministically", () => {
    const { record, mk } = scriptedSession();
    const rc = new ReplayController(record, mk);
    const dps = rc.decisionPoints();
    const inj = dps.find((d) => d.reason === "inject");
    expect(inj).toBeDefined();
    const runBranch = () => {
      const b = rc.branch(inj!, mk, { id: "branch" });
      let t = b.wallTime;
      // the learner aspirates first this time, then injects
      b.apply({ kind: "syringe", syringe: { port: "aspirate", force: -0.5 } }, t);
      b.apply({ kind: "syringe", syringe: { port: "contrast", force: 0.8 }, ml: 7 }, t);
      for (let i = 0; i < 120; i++) {
        t += DT;
        b.step(DT, t);
      }
      return b.finish(2);
    };
    const a = runBranch();
    const b = runBranch();
    expect(firstEventMismatch(hostEvents(a), hostEvents(b))).toBe(-1);
    // the branch's injection now has a clean aspirate
    const lastInj = a.events.filter((e) => e.kind === "inject").pop()!;
    expect(lastInj.data?.aspirated).toBe("clean");
    // and the branch record replays from its own start
    const rb = new ReplayController(a, mk).replayAll();
    expect(firstEventMismatch(rb.events, hostEvents(a))).toBe(-1);
    expect(a.meta.context?.branchOf).toBe("rec");
  });
});

// ---------------------------------------------------------------------------
// coverage
// ---------------------------------------------------------------------------

describe("view coverage", () => {
  // segment "A" runs along z (towards an AP detector); "B" runs along x
  const geo: SegmentGeometry = {
    segments: [
      { label: "A", side: "left", points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 30 }] },
      { label: "B", side: "left", points: [{ x: -15, y: 20, z: 0 }, { x: 15, y: 20, z: 0 }] },
    ],
  };

  it("measures foreshortening from the projection", () => {
    const pts = resample(geo.segments[0].points, 1);
    expect(pts.length).toBeGreaterThan(25);
    const apF = foreshortening([pts], { forward: { x: 0, y: 0, z: -1 }, right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } });
    expect(apF).toBeLessThan(0.1);
  });

  it("flags a segment seen only in a foreshortened view", () => {
    const res = computeCoverage(geo, [
      { id: "r1", cArm: { laoRao: 0, cranialCaudal: 0 }, side: "left" },
      { id: "r2", cArm: { laoRao: 0, cranialCaudal: 25 }, side: "left" },
    ]);
    const A = res.segments.find((s) => s.label === "A")!;
    const B = res.segments.find((s) => s.label === "B")!;
    expect(A.imaged).toBe(true);
    expect(A.seen).toBe(false);
    expect(A.foreshortenedOnly).toBe(true);
    expect(res.foreshortenedOnly).toContain("A");
    expect(B.seen).toBe(true);
    // a lateral and a steep oblique open segment A out in two distinct views
    const res2 = computeCoverage(geo, [
      { id: "r3", cArm: { laoRao: 90, cranialCaudal: 0 }, side: "left" },
      { id: "r4", cArm: { laoRao: -60, cranialCaudal: 0 }, side: "left" },
    ]);
    expect(res2.segments.find((s) => s.label === "A")!.seen).toBe(true);
  });

  it("detects overlap with another opacified segment that is far away in depth", () => {
    const g2: SegmentGeometry = {
      segments: [
        { label: "front", side: "left", points: [{ x: -20, y: 0, z: 30 }, { x: 20, y: 0, z: 30 }] },
        { label: "back", side: "left", points: [{ x: -20, y: 0, z: -30 }, { x: 20, y: 0, z: -30 }] },
      ],
    };
    const ap = computeCoverage(g2, [{ id: "ap", cArm: { laoRao: 0, cranialCaudal: 0 }, side: "left" }]);
    expect(ap.segments[0].views[0].overlap).toBeGreaterThan(0.9);
    expect(ap.segments[0].views[0].adequate).toBe(false);
    const cran = computeCoverage(g2, [{ id: "c", cArm: { laoRao: 0, cranialCaudal: 30 }, side: "left" }]);
    expect(cran.segments[0].views[0].overlap).toBe(0);
  });

  it("works on the real coronary tree with SYNTAX labels", () => {
    const c = caseById("complete-normal-0")!;
    const tree = buildCoronaryTree(buildAnatomy(c), c);
    const labels = treeLabels(tree);
    expect(labels).toEqual(expect.arrayContaining(["1", "2", "3", "5", "6", "7", "11"]));
    const g = treeSegmentGeometry(tree);
    const runs = VIEW_PRESETS.filter((v) => v.side === "left").map((v) => ({ id: v.id, cArm: v.cArm, side: "left" as const }));
    const t0 = performance.now();
    const res = computeCoverage(g, runs, requiredSegments("left", c.dominance, labels));
    const ms = performance.now() - t0;
    for (const s of res.segments) for (const v of s.views) {
      expect(v.foreshortening).toBeGreaterThanOrEqual(0);
      expect(v.foreshortening).toBeLessThanOrEqual(1 + 1e-9);
    }
    // the left main is short and is seen in the standard left views
    expect(res.segments.find((s) => s.label === "6")!.views.length).toBe(runs.length);
    console.info(`[S11] coverage on the real tree: ${res.segments.length} segments x ${runs.length} views in ${ms.toFixed(1)} ms; seen ${res.segments.filter((s) => s.seen).map((s) => s.label).join(",")}`);
  });

  it("counts standardised loops by side and view family", () => {
    expect(viewFamily({ laoRao: 42, cranialCaudal: -28 })).toBe("LAO caudal");
    expect(viewFamily({ laoRao: 0, cranialCaudal: 30 })).toBe("AP cranial");
    const l = standardisedLoops([
      { id: "1", cArm: { laoRao: -22, cranialCaudal: -22 }, side: "left" },
      { id: "2", cArm: { laoRao: -25, cranialCaudal: -18 }, side: "left" },
      { id: "3", cArm: { laoRao: 40, cranialCaudal: 0 }, side: "right" },
      { id: "4", cArm: { laoRao: 40, cranialCaudal: 0 }, side: "left", diagnostic: false },
    ]);
    expect(l.count).toBe(2);
    expect(l.redundant.map((r) => r.id)).toEqual(["2"]);
  });
});

// ---------------------------------------------------------------------------
// metrics and mistakes
// ---------------------------------------------------------------------------

describe("metrics", () => {
  it("computes diagnostic metrics from the scripted case", () => {
    const { record } = scriptedSession();
    const { metrics, analysis } = computeMetrics(record, { acceptableCatheters: ["JL4", "JR4"] });
    const m = metrics as DiagnosticMetrics;
    expect(m.lab).toBe("diagnostic");
    expect(m.injections).toBe(3);
    expect(m.contrastMl).toBeCloseTo(19, 5);
    expect(m.cineRuns).toBe(2);
    expect(m.lvEntries).toBeGreaterThanOrEqual(1);
    expect(m.catheterChanges.total).toBe(1);
    expect(m.aspirateCompliance).toBeCloseTo(1 / 3, 5);
    expect(m.injectionQuality.every((q) => q.preContrastOk)).toBe(true);
    expect(m.complications).toContain("vf");
    expect(m.criticalErrors).toContain("vf");
    expect(m.fluoroS).toBeGreaterThan(8);
    expect(m.procTimeS).toBeGreaterThan(20);
    expect(analysis.runs[1].cArm).toEqual({ laoRao: -20, cranialCaudal: 24 });
  });

  it("computes PCI metrics from device, inflation and deployment events", () => {
    const L = new SyntheticLog({ lab: "pci" });
    L.event("case-start").hold(2, { wireTipMm: -20 });
    L.event("wire-branch", { branch: "S1", onRoute: false, septal: true }).hold(1, { wireTipMm: 30 });
    L.event("wire-branch", { branch: "D1", onRoute: false, septal: false }).hold(1, { wireTipMm: 60 });
    L.event("lesion-estimate", { refMm: 3.0, mldMm: 0.6, lengthMm: 14, truth: { refMm: 3.2, mldMm: 0.5, lengthMm: 12 } });
    L.event("inflate", { kind: "semi-compliant", diameter: 2.5, atm: 10, localRefMm: 3.2, inLesion: true, inStent: false });
    L.event("device", { action: "load", kind: "stent", diameter: 3.25, lengthMm: 18, centreMm: 40 }).hold(1);
    L.event("device", { action: "move", kind: "stent", centreMm: 42 }).hold(1);
    L.event("cine-start", { laoRao: -20, cranCaud: 24 }).hold(0.5);
    L.event("inject", { ml: 6, outcome: "selective-lca", diagnostic: true, aspirated: "clean", pressure: "aortic" }).hold(3);
    L.event("cine-end", { laoRao: -20, cranCaud: 24, durationS: 3.5 });
    L.event("deploy", { diameter: 3.25, lengthMm: 18, fromMm: 33, toMm: 51 }).hold(1);
    L.event("inflate", { kind: "non-compliant", diameter: 4.0, atm: 18, localRefMm: 3.2, inLesion: false, inStent: false });
    L.event("inflate", { kind: "non-compliant", diameter: 3.5, atm: 18, localRefMm: 3.2, inLesion: false, inStent: true });
    L.event("complication", { kind: "perforation", grade: 1 }).hold(4);
    L.event("bailout", { action: "balloon-tamponade" });
    L.event("heparin", { unitsPerKg: 70 }).event("case-end", { residualDS: 8 });
    const { metrics } = computeMetrics(L.record(), { lesion: { startMm: 36, endMm: 48, refDiameterMm: 3.2 } });
    const m = metrics as PciMetrics;
    expect(m.lab).toBe("pci");
    expect(m.sideBranchEntries).toBe(2);
    expect(m.septalEntries).toBe(1);
    expect(m.lesionEstimateErrorMm!.ref).toBeCloseTo(0.2, 5);
    expect(m.lesionEstimateErrorMm!.length).toBeCloseTo(2, 5);
    expect(m.sizingRatio!).toBeCloseTo(3.25 / 3.2, 5);
    expect(m.landingMarginMm).toEqual({ prox: 3, dist: 3 });
    expect(m.predilated).toBe(true);
    expect(m.postdilatedInStent).toBe(true);
    expect(m.oversizedOutsideLesion).toBe(1);
    expect(m.deployWithoutPositioningRun).toBe(0);
    expect(m.timeToRecogniseComplicationS).toBeCloseTo(4, 1);
    expect(m.correctBailout).toBe(true);
    expect(m.residualDS).toBe(8);
    expect(m.heparinGiven).toBe(true);
    expect(m.actChecked).toBe(false);
  });
});

describe("mistake detection: every MistakeCode fires in a scripted scenario", () => {
  const fired = new Set<MistakeCode>();
  const expectCode = (code: MistakeCode, tally: Partial<Record<MistakeCode, number>>) => {
    expect(tally[code] ?? 0, `${code} should fire`).toBeGreaterThan(0);
    fired.add(code);
  };

  it("position and torque errors", () => {
    expectCode("too-high", mistakesOf(new SyntheticLog().hold(1, { eng: ENG("ascending-aorta") }).hold(1.5, { eng: ENG("ascending-aorta"), cmdTorque: 1.5 }).record()));
    expectCode("too-low", mistakesOf(new SyntheticLog().hold(1).event("engagement", { from: "non-selective", to: "below-valve" }).hold(1).record()));
    expectCode("lv-entry", mistakesOf(new SyntheticLog().hold(1).event("engagement", { from: "non-selective", to: "in-lv" }).hold(1).record()));
    expectCode("deep-engagement", mistakesOf(new SyntheticLog().hold(1).event("engagement", { from: "selective-rca", to: "deep-rca" }).hold(1).record()));
    const push = new SyntheticLog().hold(0.5, { resistance: 0.8 });
    for (let i = 0; i < 25; i++) push.frame({ resistance: 0.8, cmdInsertion: i * 0.2 });
    expectCode("too-much-pushing", mistakesOf(push.hold(0.5, { resistance: 0 }).record()));
    const iw = new SyntheticLog().hold(0.5, { eng: ENG("in-lv") });
    for (let i = 0; i < 20; i++) iw.frame({ eng: ENG("in-lv"), cmdInsertion: i * 0.2 });
    expectCode("insufficient-withdrawal", mistakesOf(iw.record()));
    const wr = new SyntheticLog().hold(1, { eng: ENG("near-lm"), tipAz: 0.2 });
    for (let i = 1; i <= 10; i++) wr.frame({ eng: ENG("near-lm"), tipAz: 0.2 + i * 0.06, cmdTorque: i * 0.06 });
    expectCode("wrong-rotation", mistakesOf(wr.hold(0.5, { eng: ENG("near-lm") }).record(), { targetAz: { left: 0 } }));
    const ov = new SyntheticLog().hold(1, { eng: ENG("near-lm"), tipAz: -0.3 });
    for (let i = 1; i <= 10; i++) ov.frame({ eng: ENG("near-lm"), tipAz: -0.3 + i * 0.1, cmdTorque: i * 0.1 });
    expectCode("over-rotation", mistakesOf(ov.record(), { targetAz: { left: 0 } }));
  });

  it("injection errors", () => {
    const inj = (data: Record<string, unknown>) => new SyntheticLog().hold(1).event("inject", { ml: 7, aspirated: "clean", pressure: "aortic", outcome: "selective-lca", engagement: "selective-lm", ...data }).hold(1).record();
    expectCode("non-coaxial", mistakesOf(inj({ engagement: "near-lm" })));
    expectCode("damped-injection", mistakesOf(inj({ pressure: "ventricularised" })));
    expectCode("non-selective-injection", mistakesOf(inj({ outcome: "root-puff" })));
    expectCode("lv-injection", mistakesOf(inj({ outcome: "lv-injection", pressure: "lv" })));
    expectCode("no-aspirate", mistakesOf(inj({ aspirated: "unknown" })));
    expectCode("ignored-pressure-warning", mistakesOf(new SyntheticLog().hold(1).hold(8, { press: PRESS("damped") }).hold(1, { press: PRESS("aortic") }).record()));
    // a damped trace that was corrected promptly is not an ignored warning
    const ok = mistakesOf(new SyntheticLog().hold(1).hold(2, { press: PRESS("damped") }).hold(1, { press: PRESS("aortic") }).record());
    expect(ok["ignored-pressure-warning"] ?? 0).toBe(0);
  });

  it("catheter choice and exchanges", () => {
    expectCode("wrong-catheter", mistakesOf(new SyntheticLog().hold(1).event("catheter", { id: "AL2" }).hold(1).record(), { acceptableCatheters: ["JL4", "JR4"] }));
    expectCode("catheter-changed-early", mistakesOf(new SyntheticLog({ context: { catheterId: "JL4" } }).hold(2).event("catheter", { id: "JL4.5" }).hold(1).record(), { acceptableCatheters: ["JL4", "JL4.5"] }));
    const late = new SyntheticLog({ context: { catheterId: "JR4" } }).hold(1);
    for (let i = 0; i < 6; i++) late.event("engagement", { from: "non-selective", to: "near-rca" }).hold(1).event("engagement", { from: "near-rca", to: "non-selective" }).hold(1);
    expectCode("catheter-changed-late", mistakesOf(late.event("catheter", { id: "AR" }).hold(1).record()));
  });

  it("complications, views, identification and budgets", () => {
    for (const [kind, code] of [["dissection", "dissection"], ["air-embolism", "air-embolism"], ["vf", "vf-arrest"]] as const) expectCode(code, mistakesOf(new SyntheticLog().hold(1).event("complication", { kind }).hold(1).record()));
    expectCode("vessel-misid", mistakesOf(new SyntheticLog().hold(1).event("id-answer", { correct: false }).hold(1).record()));
    // poor view: a required segment seen only foreshortened
    const geo: SegmentGeometry = { segments: [{ label: "6", side: "left", points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 30 }] }] };
    const L = new SyntheticLog().hold(0.5).event("cine-start", { laoRao: 0, cranCaud: 0 }).hold(0.5).event("inject", { ml: 7, diagnostic: true, side: "left", aspirated: "clean", pressure: "aortic", outcome: "selective-lca", engagement: "selective-lm" }).hold(3).event("cine-end", { laoRao: 0, cranCaud: 0 }).hold(0.5);
    const r = L.record();
    const a = analyse(r);
    const cov = computeCoverage(geo, a.runs.map((x) => ({ id: x.id, cArm: x.cArm, side: "left" as const, diagnostic: x.diagnostic })), ["6"]);
    const { analysis, metrics } = computeMetrics(r, {}, { coverage: cov });
    expectCode("poor-view", detectMistakes(analysis, metrics).tally);
    // budgets
    const fl = new SyntheticLog();
    for (let i = 0; i < 30; i++) fl.frame({ tFluoro: i * 7 }, 1);
    const flr = fl.record();
    const fm = computeMetrics(flr);
    expectCode("excess-fluoro", detectMistakes(fm.analysis, fm.metrics, { budgets: { fluoroS: 180 } }).tally);
    const ct = new SyntheticLog();
    for (let i = 0; i < 9; i++) ct.hold(1).event("inject", { ml: 7, aspirated: "clean", pressure: "aortic", outcome: "selective-lca", engagement: "selective-lm" });
    const cm = computeMetrics(ct.record());
    expectCode("excess-contrast", detectMistakes(cm.analysis, cm.metrics, { budgets: { contrastMl: 50 } }).tally);
  });

  it("all 24 codes were raised", () => {
    expect(ALL_MISTAKES.length).toBe(24);
    expect(ALL_MISTAKES.filter((c) => !fired.has(c))).toEqual([]);
  });

  it("the legacy scripted case raises its live errors with times for rewind", () => {
    const { record } = scriptedSession();
    const { analysis, metrics } = computeMetrics(record, { acceptableCatheters: ["JL4", "JR4"] });
    const { tally, evidence } = detectMistakes(analysis, metrics);
    expect(tally["lv-entry"]).toBeGreaterThanOrEqual(1);
    expect(tally["no-aspirate"]).toBeGreaterThanOrEqual(1);
    expect(tally["vf-arrest"]).toBe(1);
    expect(evidence.every((e) => Number.isFinite(e.tWall))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// standards
// ---------------------------------------------------------------------------

describe("passing standards", () => {
  const diag = (over: Partial<DiagnosticMetrics>): DiagnosticMetrics => ({
    lab: "diagnostic",
    procTimeS: 540,
    fluoroS: 150,
    cineRuns: 8,
    standardisedLoops: 8,
    redundantRuns: 0,
    contrastMl: 45,
    karMGy: 0,
    kapGyCm2: 0,
    injections: 8,
    injectionsOutsideCine: 0,
    engageAttempts: { left: 1, right: 1 },
    failedAttempts: { left: 0, right: 0 },
    timeToSelectiveS: {},
    lvEntries: 0,
    dampedEvents: 0,
    injectWhileDamped: 0,
    nonSelectiveInjections: 0,
    lvInjections: 0,
    aspirateCompliance: 1,
    pressureCheckCompliance: 1,
    catheterChanges: { total: 1, early: 0, late: 0 },
    injectionQuality: [],
    viewCoverage: { seen: ["5"], missing: [], foreshortenedOnly: [] },
    economy: { insertionTravelMm: 0, torqueTravelRad: 0, torqueReversals: 0 },
    pushingEpisodes: 0,
    hintsUsed: 0,
    mentorPrompts: 0,
    complications: [],
    criticalErrors: [],
    ...over,
  });

  it("evaluates the Jensen 2016 full-study criterion with strict inequalities", () => {
    expect(evaluateStandards(diag({}), DIAGNOSTIC_FULL_STUDY).passed).toBe(true);
    expect(evaluateStandards(diag({ contrastMl: 50 }), DIAGNOSTIC_FULL_STUDY).passed).toBe(false);
    expect(evaluateStandards(diag({ procTimeS: 600 }), DIAGNOSTIC_FULL_STUDY).passed).toBe(false);
    expect(evaluateStandards(diag({ standardisedLoops: 7 }), DIAGNOSTIC_FULL_STUDY).passed).toBe(false);
    const crit = evaluateStandards(diag({ criticalErrors: ["vf"] }), DIAGNOSTIC_FULL_STUDY);
    expect(crit.criticalFailed).toBe(true);
    const sources = DIAGNOSTIC_FULL_STUDY.map((s) => s.source.id);
    expect(sources.filter((s) => s === "jensen-2016").length).toBe(4);
    expect(SOURCES.jensen2016.citation).toContain("10.4244/EIJY15M06_05");
  });

  it("builds, exports and imports an expert benchmark, which becomes the local standard", () => {
    const runs = [diag({ contrastMl: 30, fluoroS: 100 }), diag({ contrastMl: 40, fluoroS: 140 })].map((m, i) => ({ caseId: `c${i}`, metrics: m }));
    const b = buildBenchmark("diag-study", runs, ["contrastMl", "fluoroS", "standardisedLoops"], "mean", "trainer", 1234);
    const back = importBenchmark(exportBenchmark(b));
    expect(back).toEqual(b);
    const st = standardsFromBenchmark(back);
    const contrast = st.find((s) => s.metric === "contrastMl")!;
    expect(contrast.value).toBe(35);
    expect(contrast.op).toBe("<=");
    expect(contrast.source.kind).toBe("expert-calibration");
    expect(st.find((s) => s.metric === "standardisedLoops")!.op).toBe(">=");
    expect(() => importBenchmark("{}")).toThrow(/not a benchmark/);
    expect(() => importBenchmark("nope")).toThrow(/not valid JSON/);
  });
});

// ---------------------------------------------------------------------------
// attending engine
// ---------------------------------------------------------------------------

const baseInput = (t: number, over: Partial<MentorInput> = {}): MentorInput => ({
  tWall: t,
  lab: "diagnostic",
  engagement: "selective-lm",
  pressure: "aortic",
  sys: 122,
  dia: 76,
  resistance: 0,
  advancing: false,
  insertion: 0,
  aspirated: "clean",
  beam: 0,
  cArm: { laoRao: 0, cranialCaudal: 0 },
  catheterId: "JL4",
  targetSide: "left",
  ...over,
});

const pciBase: PciInput = { wireBranch: "LAD", wireInSeptal: false, wireOffRoute: false, wireTipDistal: false, deviceBeyondWire: false, deviceKind: null, injectedSinceDeviceMove: true };

/** Scenario per rule: the situation, and the pre-action that should be stopped. */
const SCENARIOS: Record<string, { over: Partial<MentorInput>; action?: Parameters<MentorEngine["preAction"]>[0]; secs?: number }> = {
  "damped-before-inject": { over: { pressure: "ventricularised", dia: 14 }, action: "inject" },
  conus: { over: { engagement: "selective-rca", conus: true, targetSide: "right", catheterId: "JR4" }, action: "inject" },
  "lv-entry": { over: { engagement: "in-lv", pressure: "lv", dia: 7 }, action: "inject" },
  "push-resistance": { over: { engagement: "near-lm", advancing: true, resistance: 0.85 }, action: "advance-catheter" },
  "no-aspirate": { over: { aspirated: "no-return" }, action: "inject" },
  "foreshortened-view": { over: { beam: 2, targetForeshortening: 0.5, targetSegment: "7" } },
  "wire-septal": { over: { lab: "pci", pci: { ...pciBase, wireBranch: "S1", wireInSeptal: true } }, action: "advance-wire" },
  "device-beyond-wire": { over: { lab: "pci", pci: { ...pciBase, deviceKind: "balloon", deviceBeyondWire: true } }, action: "advance-device" },
  "oversized-balloon": { over: { lab: "pci", pci: { ...pciBase, deviceKind: "balloon", deviceDiameter: 4, localRefMm: 3, deviceInLesion: false, deviceInStent: false } }, action: "inflate" },
  "deploy-without-run": { over: { lab: "pci", pci: { ...pciBase, deviceKind: "stent", deviceDiameter: 3, localRefMm: 3, injectedSinceDeviceMove: false } }, action: "deploy" },
  // pci-attending (rules/pci.ts)
  "unscreened-device-advance": { over: { lab: "pci", beam: 0, pci: { ...pciBase, deviceKind: "balloon", deviceAtGuideTip: true, deviceMoving: true } }, action: "advance-device" },
  "act-not-checked": { over: { lab: "pci", beam: 1, pci: { ...pciBase, deviceKind: "balloon", deviceAtGuideTip: true, actRequired: true, actOk: false } }, action: "advance-device" },
  "withdraw-before-deflate": { over: { lab: "pci", beam: 1, pci: { ...pciBase, deviceKind: "balloon", balloonInflated: true, pulledBeforeDeflation: true } }, action: "advance-device" },
  "guide-backout-ignored": { over: { lab: "pci", beam: 1, pci: { ...pciBase, deviceKind: "stent", guideBackedOut: true, deviceMoving: true } }, action: "advance-device" },
  "contrast-ceiling": { over: { lab: "pci", beam: 1, pci: { ...pciBase, contrastMl: 260, contrastCeilingMl: 250, contrastWarnMl: 200 } }, action: "inject" },
  // no progress for longer than PCI_STUCK_NO_PROGRESS_S (120 s): the scenario runs long enough to reach it
  "pci-stuck": { over: { lab: "pci", beam: 1, pci: pciBase }, secs: 150 },
  // pci-equipment-tray (rules/pciTray.ts; the tray's fields are PciTrayInput, not yet in PciInput)
  "device-wire-in-branch": { over: { lab: "pci", beam: 1, pci: { ...pciBase, deviceKind: "balloon", deviceAtGuideTip: true, wireTipDistal: true } }, action: "advance-device" },
  "inject-guide-not-cleared": { over: { lab: "pci", beam: 1, pci: { ...pciBase, guideNotCleared: true } as PciInput }, action: "inject" },
  "expired-device": { over: { lab: "pci", beam: 1, pci: { ...pciBase, deviceKind: "balloon", expiredDevice: true } as PciInput }, action: "advance-device" },
  // diag-engagement-technique-set (rules/diagEngagement.ts): deep in the left main with a free trace
  "deep-free-trace-inject": { over: { engagement: "deep-lm", pressure: "aortic" }, action: "inject" },
};

function runScenario(ruleId: string, mode: AssessmentMode, entrustment: EntrustmentLevel = 2, secs = SCENARIOS[ruleId].secs ?? 30) {
  const eng = new MentorEngine({ mode, entrustment });
  const sc = SCENARIOS[ruleId];
  const said: MentorUtterance[] = [];
  // 2 s of normal work first, so the situation has a clear onset
  for (let t = 0; t < 2; t += 0.1) said.push(...eng.step(baseInput(t, sc.over.lab === "pci" ? { lab: "pci", pci: pciBase } : {})));
  for (let t = 2; t < 2 + secs; t += 0.1) said.push(...eng.step(baseInput(t, sc.over)));
  const stop = sc.action ? eng.preAction(sc.action, baseInput(2 + secs, sc.over)) : undefined;
  return { eng, said: said.filter((u) => u.ruleId === ruleId), all: said, stop };
}

describe("attending engine", () => {
  it("RULES keeps its ids and order now that the rules live in registry files (found-mentor-registries)", () => {
    const legacy = ["damped-before-inject", "conus", "lv-entry", "push-resistance", "no-aspirate", "foreshortened-view", "wire-septal", "device-beyond-wire", "oversized-balloon", "deploy-without-run"];
    // the rules split out of rules.ts keep their ids and relative order whatever later rule files add;
    // at the split RULES is exactly these (rules/diagnostic.ts and rules/pciLegacy.ts only)
    expect(RULES.map((r) => r.id).filter((id) => legacy.includes(id))).toEqual(legacy);
    if (Object.keys(RULE_FILES).length === 2) expect(RULES.map((r) => r.id)).toEqual(legacy);
    expect(ALL_RULES.map((r) => r.id)).toEqual([...RULES.map((r) => r.id), "time-out"]);
    expect(new MentorEngine().rules).toBe(ALL_RULES);
  });

  it("every starter rule fires in its scenario at the expected first level in supervised mode", () => {
    for (const r of RULES) {
      const { said, stop } = runScenario(r.id, "supervised");
      expect(said.length, r.id).toBeGreaterThan(0);
      expect(said[0].level, r.id).toBe(1);
      // escalates while the situation persists, never past instruction without a pending action
      expect(Math.max(...said.map((u) => u.level)), r.id).toBeLessThanOrEqual(r.severity === "safety" ? 4 : 3);
      expect(said.map((u) => u.level)).toEqual([...said.map((u) => u.level)].sort((a, b) => a - b));
      if (SCENARIOS[r.id].action) {
        expect(stop?.allow, r.id).toBe(false);
        expect(stop?.utterance?.level, r.id).toBe(5);
        expect(stop?.utterance?.critical, r.id).toBe(false);
      }
    }
  });

  it("guided mode starts firmer for safety; independent waits in silence and leaves technique to the debrief", () => {
    const g = runScenario("damped-before-inject", "guided");
    expect(g.said[0].level).toBe(2);
    expect(g.said.some((u) => u.level === 5)).toBe(true); // a guided attending takes over if it persists
    const ind = runScenario("damped-before-inject", "independent", 3, 4);
    expect(ind.said.length).toBe(0); // persistence x1.5 then a silent observation period
    const ind2 = runScenario("damped-before-inject", "independent", 3, 30);
    expect(ind2.said[0].level).toBe(1);
    const tech = runScenario("foreshortened-view", "independent", 3, 30);
    expect(tech.said.length).toBe(0);
    expect(tech.eng.deferred.some((d) => d.ruleId === "foreshortened-view")).toBe(true);
  });

  it("fades with entrustment: at level 5 technique prompts are deferred and safety starts silent", () => {
    const e1 = runScenario("foreshortened-view", "supervised", 1);
    const e5 = runScenario("foreshortened-view", "supervised", 5);
    expect(e1.said[0].level).toBe(2);
    expect(e5.said.length).toBe(0);
    expect(e5.eng.deferred.length).toBeGreaterThan(0);
    const s5 = runScenario("lv-entry", "supervised", 5, 3);
    expect(s5.said.length).toBe(0);
  });

  it("in exam mode the only utterances are safety stops, logged as critical errors", () => {
    const all: MentorUtterance[] = [];
    for (const r of RULES) {
      const { all: said, stop, eng } = runScenario(r.id, "exam", 3);
      all.push(...said);
      if (stop?.utterance) all.push(stop.utterance);
      if (r.severity !== "safety" && SCENARIOS[r.id].action) {
        expect(stop?.allow, r.id).toBe(true);
        expect(eng.deferred.length).toBeGreaterThan(0);
      }
    }
    expect(all.length).toBeGreaterThan(0);
    for (const u of all) {
      expect(u.level).toBe(5);
      expect(u.critical).toBe(true);
      expect(u.severity).toBe("safety");
    }
    expect(new MentorEngine({ mode: "exam" }).requestHint(baseInput(0))).toBeNull();
  });

  it("calls a time-out when the learner is stuck and offers plan frames", () => {
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const said: MentorUtterance[] = [];
    // bounce between the sinus and near the left main without progress
    for (let t = 0; t < 70; t += 0.1) {
      const phase = Math.floor(t / 3) % 2;
      said.push(...eng.step(baseInput(t, { engagement: phase ? "near-lm" : "non-selective" })));
    }
    const to = said.find((u) => u.ruleId === "time-out");
    expect(to).toBeDefined();
    expect(to!.text).toBe("Pause. Talk me through your plan.");
    expect(to!.frames!.length).toBeGreaterThanOrEqual(2);
  });

  it("phrases from the live state and never mentions a score", () => {
    const { said } = runScenario("damped-before-inject", "guided", 2);
    expect(said.some((u) => u.text.includes("14"))).toBe(true); // "It's down at 14."
    const texts: string[] = [];
    for (const r of ALL_RULES) for (const l of Object.values(r.lines)) texts.push(l!(new MentorEngine().tracker.update(baseInput(0, { pci: { ...pciBase, deviceDiameter: 3.5 } }))));
    for (const r of RULES) for (const f of r.frames ?? []) texts.push(f.text, f.teaching);
    for (const t of texts) {
      expect(t).not.toMatch(/score|points|%|percent|grade/i);
      expect(t).not.toMatch(/—/);
    }
  });

  it("answers a hint request with the next line of the most urgent situation", () => {
    const eng = new MentorEngine({ mode: "supervised", entrustment: 3 });
    eng.step(baseInput(0, { pressure: "damped", dia: 63 }));
    const h = eng.requestHint(baseInput(0.1, { pressure: "damped", dia: 63 }));
    expect(h?.ruleId).toBe("damped-before-inject");
    expect(h!.level).toBeGreaterThanOrEqual(2);
    const quiet = new MentorEngine({ mode: "supervised" });
    expect(quiet.requestHint(baseInput(0, { engagement: "non-selective" }))?.ruleId).toBe("hint");
    expect(eng.requestDemonstration().status).toBe("deferred");
    expect(utteranceData(h!)).toMatchObject({ ruleId: "damped-before-inject" });
  });

  it("does not repeat itself when a situation flickers", () => {
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const said: MentorUtterance[] = [];
    for (let t = 0; t < 20; t += 0.1) {
      const on = Math.floor(t / 2.5) % 2 === 0;
      said.push(...eng.step(baseInput(t, on ? { pressure: "damped", dia: 63 } : {})));
    }
    const lines = said.filter((u) => u.ruleId === "damped-before-inject");
    const texts = lines.map((u) => u.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});

// ---------------------------------------------------------------------------
// pre-brief and time-out
// ---------------------------------------------------------------------------

describe("pre-brief and time-out", () => {
  it("every preset, library template and PCI scenario has 2-4 questions with valid answers", () => {
    const cases = [...PRESET_ORDER.map((p) => generateBatch(p, 1, "pb")[0]), ...CASE_LIBRARY];
    for (const c of cases) {
      const pb = prebriefForCase(c);
      expect(pb.questions.length, c.id).toBeGreaterThanOrEqual(2);
      expect(pb.questions.length, c.id).toBeLessThanOrEqual(4);
      for (const q of pb.questions) for (const id of q.correct) expect(q.options.some((o) => o.id === id), q.id).toBe(true);
    }
    for (const s of PCI_SCENARIOS) {
      const pb = prebriefForScenario(s);
      expect(pb.questions.length).toBeGreaterThanOrEqual(2);
      expect(pb.presentation).toBe(s.brief);
    }
    // every library template key is covered by its own set
    const keys = new Set(CASE_LIBRARY.map((c) => c.id.replace(/-\d+$/, "")));
    for (const k of keys) expect(TEMPLATE_PREBRIEFS[k], k).toBeDefined();
  });

  it("the right answer cannot be found by picking the longest option", () => {
    const qs = allPrebriefQuestions();
    let longest = 0;
    for (const q of qs) {
      const lens = q.options.map((o) => o.text.length);
      const max = Math.max(...lens);
      const correctLong = q.options.filter((o) => o.text.length === max);
      if (correctLong.length === 1 && q.correct.includes(correctLong[0].id)) longest++;
    }
    expect(longest / qs.length).toBeLessThanOrEqual(0.35);
  });

  it("shuffles options deterministically so the answer is not always first", () => {
    const pb = prebriefForCase(caseById("high-rca-0")!);
    const again = prebriefForCase(caseById("high-rca-0")!);
    expect(pb.questions.map((q) => q.options.map((o) => o.id))).toEqual(again.questions.map((q) => q.options.map((o) => o.id)));
    const firstIsCorrect = allPrebriefQuestions().map((q) => shuffleOptions(q, "x")).filter((q) => q.correct.includes(q.options[0].id)).length;
    expect(firstIsCorrect / allPrebriefQuestions().length).toBeLessThan(0.5);
    const g = gradeAnswers(pb.questions, { [pb.questions[0].id]: pb.questions[0].correct[0] });
    expect(g[0].correct).toBe(true);
    expect(g[1].correct).toBe(false);
  });

  it("blocks the beam until the time-out is complete in supervised and exam modes", () => {
    const items = timeOutItems("diagnostic");
    const half = { checked: Object.fromEntries(items.slice(0, 3).map((i) => [i.id, true])) };
    const all = { checked: Object.fromEntries(items.map((i) => [i.id, true])) };
    expect(timeOutComplete(half, "diagnostic")).toBe(false);
    expect(timeOutComplete(all, "diagnostic")).toBe(true);
    expect(timeOutComplete(all, "pci")).toBe(false); // PCI adds the heparin item
    for (const m of ["supervised", "exam"] as const) {
      expect(beamAllowed(m, timeOutComplete(half, "diagnostic"))).toBe(false);
      expect(beamAllowed(m, timeOutComplete(all, "diagnostic"))).toBe(true);
    }
    expect(beamAllowed("guided", false)).toBe(true);
    expect(visibilityFor("exam").hints).toBe("off");
    expect(visibilityFor("exam").overlays.toggleable).toBe(false);
    expect(visibilityFor("supervised").stateChips).toBe(false);
  });

  it("compares the plan with what happened (a planned view never acquired)", () => {
    const { record } = scriptedSession();
    const a = analyse(record);
    const plan: ProcedurePlan = { access: "femoral", catheters: { left: "JL4", right: "JR4", backup: ["AR"] }, plannedViews: ["raocaudal", "raocranial", "spider"], contrastBudgetMl: 15, anticipated: ["LV entry in a small root"] };
    const items = planVsExecution(plan, a, VIEW_PRESETS);
    const views = items.find((i) => i.id === "views")!;
    expect(views.kept).toBe(false);
    expect(views.planned).toContain("LAO caudal");
    expect(items.find((i) => i.id === "contrast")!.kept).toBe(false);
    expect(items.find((i) => i.id === "catheters")!.kept).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// debrief
// ---------------------------------------------------------------------------

describe("PEARLS debrief", () => {
  it("builds reactions, a narrative, up to 3 ranked gaps with the right strategy, and a sourced summary", () => {
    const { record } = scriptedSession();
    const plan: ProcedurePlan = { access: "femoral", catheters: { left: "JL4", backup: [] }, plannedViews: ["raocaudal"], contrastBudgetMl: 40, anticipated: [] };
    const as = assessAttempt(record, { facts: { acceptableCatheters: ["JL4", "JR4"] }, focus: "both", plan, selfRatings: { safety: 5, catheter: 3, engage: 3, inject: 3, views: 3, economy: 4 } });
    const d = as.debrief;
    expect(d.reactions.subSkills.length).toBe(6);
    expect(d.description.narrative[0]).toMatch(/^00:00 {2}Case started in supervised mode/);
    expect(d.description.narrative.some((l) => l.includes("Cine in RAO 22 caudal 22"))).toBe(true);
    expect(d.analysis.gaps.length).toBeLessThanOrEqual(3);
    expect(d.analysis.gaps.length).toBeGreaterThan(0);
    for (let i = 1; i < d.analysis.gaps.length; i++) expect(d.analysis.gaps[i - 1].priority).toBeGreaterThanOrEqual(d.analysis.gaps[i].priority);
    for (const g of d.analysis.gaps) {
      if (g.strategy === "advocacy-inquiry") {
        expect(g.advocacy).toMatch(/I noticed/);
        expect(g.advocacy).toMatch(/\d\d:\d\d/);
        expect(g.inquiry).toBe("What were you seeing at that point?");
        expect(g.frames!.length).toBeGreaterThanOrEqual(2);
      } else expect(g.directive!.length).toBeGreaterThan(20);
      expect(g.rewind).toBeDefined();
      expect(record.snapshots[g.rewind!.index].tWall).toBeLessThanOrEqual(g.tWall + 1e-6);
    }
    // the safety sub-skill was over-rated against a case with VF and an LV entry
    expect(d.calibration.find((c) => c.subSkill === "safety")!.flag).toBe("over-confident");
    // every threshold carries its source label
    for (const r of d.summary.standards) expect(r.standard.source.label.length).toBeGreaterThan(5);
    expect(d.summary.standards.some((r) => r.standard.source.label.startsWith("Jensen 2016"))).toBe(true);
    expect(d.summary.passed).toBe(false);
    expect(d.summary.cardsToSchedule.length).toBe(d.analysis.gaps.length);
    expect(d.planVsExecution.length).toBeGreaterThan(0);
    expect(d.decisionPoints.length).toBeGreaterThan(0);
    // timeline lanes for the replay
    expect(as.lanes.beam.some((b) => b.kind === "cine")).toBe(true);
    expect(as.lanes.injections.length).toBe(3);
    expect(as.lanes.errors.length).toBe(as.mistakes.evidence.length);
  });

  it("decision points point at snapshots at or before them", () => {
    const { record } = scriptedSession();
    const { analysis, metrics } = computeMetrics(record);
    const m = detectMistakes(analysis, metrics);
    const dps = findDecisionPoints(record, m.evidence);
    for (const d of dps) expect(record.snapshots[d.snapshot].tWall).toBeLessThanOrEqual(d.tWall + 1e-6);
    expect(narrate(analysis, record).slice(-1)[0]).toMatch(/Case ended\.$/);
    expect(timelineLanes(analysis).engagement.length).toBeGreaterThan(2);
  });

  it("compares the structured report with ground truth", () => {
    expect(bandOf(0)).toBe("NL");
    expect(bandOf(85)).toBe("76-90");
    expect(bandOf(100)).toBe("100");
    const cmp = compareReport(
      { dominance: "right", lesions: [{ segment: "7", band: "51-75" }, { segment: "2", band: "26-50" }], timi: 3 },
      { dominance: "right", lesions: [{ segment: "7", severityPct: 85 }, { segment: "13", severityPct: 80 }], timi: 3 }
    );
    expect(cmp.dominanceCorrect).toBe(true);
    expect(cmp.items.find((i) => i.segment === "7")!.adjacent).toBe(true);
    expect(cmp.missed).toEqual(["13"]);
    expect(cmp.falsePositives).toEqual(["2"]);
    expect(cmp.meanBias).toBeLessThan(0);
    const d = buildDebrief({ ...assessAttempt(scriptedSession().record), record: scriptedSession().record, standards: { results: [], passed: true }, report: cmp });
    expect(d.report?.missed).toEqual(["13"]);
  });
});

// ---------------------------------------------------------------------------
// skill cards
// ---------------------------------------------------------------------------

describe("procedural skill cards", () => {
  it("every MISTAKE_INFO drill has a template that names it", () => {
    for (const code of Object.keys(MISTAKE_INFO) as MistakeCode[]) {
      const t = SKILL_CARD_TEMPLATES[code];
      expect(t, code).toBeDefined();
      expect(t.title).toBe(MISTAKE_INFO[code].drill);
      expect(t.durationS).toBeGreaterThanOrEqual(60);
      expect(t.durationS).toBeLessThanOrEqual(180);
    }
    expect(PCI_CARD_TEMPLATES.map((c) => c.start.kind)).toEqual(["pci", "pci", "pci", "pci"]);
  });

  it("each diagnostic card resolves to a start state at the moment of the error", () => {
    for (const t of Object.values(SKILL_CARD_TEMPLATES)) {
      if (t.start.kind !== "diagnostic") continue;
      const c = t.start.caseId ? caseById(t.start.caseId)! : generateBatch(t.start.preset, 1, `card:${t.code}`)[0];
      const r = resolveDiagnosticStart(t.start, c);
      expect(r, t.code).not.toBeNull();
      if (t.start.engagement) {
        const host = new LegacyDiagnosticHost({ caseData: c, catheterId: r!.catheterId });
        host.restore({ ...host.snapshot(), controls: r!.controls });
        expect(host.engagement.kind, t.code).toBe(t.start.engagement);
        if (t.start.conus) expect(host.engagement.conus).toBe(true);
        if (t.start.pressure) expect(host.pressure.kind).toBe(t.start.pressure);
      }
    }
  });

  it("the over-rotation card starts a JR4 coaxial with the RCA ostium on a case it can seat, at every difficulty", () => {
    const { template } = cardForCode("over-rotation");
    const start = template.start;
    expect(start.kind).toBe("diagnostic");
    if (start.kind !== "diagnostic") return;
    expect(start.preset).toBe("torque");
    expect(start.catheterId).toBe("JR4");
    expect(start.engagement).toBe("coaxial-rca");
    // Review.launchCard uses the pinned case ahead of the preset, so every launch is on this root
    expect(start.caseId).toBe("easy-rca-0");
    const c = caseById(start.caseId!)!;
    expect(c).toBeDefined();
    const r = resolveDiagnosticStart(start, c);
    expect(r).not.toBeNull();
    expect(r!.catheterId).toBe("JR4");
    // the brief asks the learner to seat it: the JR4 can reach a selective RCA position on this case
    expect(findStartControls(c, "JR4", "selective-rca")).not.toBeNull();
    const at = (difficulty: "beginner" | "intermediate" | "advanced", dTorque = 0) => {
      const host = new LegacyDiagnosticHost({ caseData: c, catheterId: r!.catheterId, difficulty });
      const tq = r!.controls.torque + dTorque;
      host.restore({ ...host.snapshot(), controls: { ...r!.controls, torque: tq, cmdTorque: tq } });
      return host.engagement;
    };
    const kinds = (["beginner", "intermediate", "advanced"] as const).map((difficulty) => {
      const e = at(difficulty);
      // next to the RCA ostium (closer to it than to the left), not yet seated
      expect(e.target, difficulty).toBe("right");
      expect(e.isSelective).toBe(false);
      expect(e.conus).toBe(false);
      expect(e.distanceToRca).toBeLessThan(e.distanceToLm);
      // not on the edge of the class: one small torque step either way keeps it coaxial
      expect(at(difficulty, -0.05).kind, `${difficulty} -0.05`).toBe("coaxial-rca");
      expect(at(difficulty, 0.05).kind, `${difficulty} +0.05`).toBe("coaxial-rca");
      return e.kind;
    });
    // the fixed engagement thresholds: difficulty does not move the start state
    expect(kinds).toEqual(["coaxial-rca", "coaxial-rca", "coaxial-rca"]);
    // torquing on past the seated position leaves it again: the moment the card teaches
    const sweep: string[] = [];
    for (let d = 0; d <= 1.2; d += 0.05) sweep.push(at("intermediate", d).kind);
    const firstSeat = sweep.indexOf("selective-rca");
    expect(firstSeat).toBeGreaterThan(0);
    expect(sweep.slice(firstSeat).some((k) => k !== "selective-rca")).toBe(true);
  });

  it("every diagnostic card with a start class resolves on the case Review launches it on, for any seed", () => {
    // Review.launchCard uses the pinned caseId when there is one, else a freshly generated case
    for (const code of Object.keys(SKILL_CARD_TEMPLATES) as (keyof typeof SKILL_CARD_TEMPLATES)[]) {
      const start = SKILL_CARD_TEMPLATES[code].start;
      if (start.kind !== "diagnostic" || !start.engagement) continue;
      if (start.caseId) {
        const c = caseById(start.caseId);
        expect(c, `${code}: pinned case`).toBeDefined();
        expect(resolveDiagnosticStart(start, c!), `${code} on ${start.caseId}`).not.toBeNull();
        continue;
      }
      for (let i = 0; i < 12; i++) {
        const c = generateBatch(start.preset, 1, `card:${code}:${i}`)[0];
        expect(resolveDiagnosticStart(start, c), `${code} seed ${i}`).not.toBeNull();
      }
    }
  });

  it("swinging past the RCA from the over-rotation card's start class is detected as over-rotation", () => {
    const log = new SyntheticLog().hold(1, { eng: ENG("coaxial-rca"), tipAz: -0.3 });
    for (let i = 1; i <= 10; i++) log.frame({ eng: ENG("coaxial-rca"), tipAz: -0.3 + i * 0.1, cmdTorque: i * 0.1 });
    const tally = mistakesOf(log.record(), { targetAz: { right: 0 } });
    expect(tally["over-rotation"] ?? 0).toBeGreaterThan(0);
  });

  it("grades on measured outcome and updates the spaced-repetition memory", () => {
    const { id, template } = cardForCode("damped-injection");
    const good = new SyntheticLog().hold(1).event("cine-start", { laoRao: 40, cranCaud: 0 }).hold(0.5).event("inject", { ml: 6, diagnostic: true, side: "right", aspirated: "clean", pressure: "aortic", outcome: "selective-rca", engagement: "selective-rca" }).hold(3).event("cine-end", { laoRao: 40, cranCaud: 0 }).record();
    const ga = computeMetrics(good);
    const pass = gradeCard(template, ga.metrics, detectMistakes(ga.analysis, ga.metrics).tally);
    expect(pass.pass).toBe(true);
    const bad = new SyntheticLog().hold(1).event("inject", { ml: 6, aspirated: "clean", pressure: "damped", outcome: "deep-reflux", engagement: "deep-rca" }).hold(1).record();
    const gb = computeMetrics(bad);
    const fail = gradeCard(template, gb.metrics, detectMistakes(gb.analysis, gb.metrics).tally);
    expect(fail.pass).toBe(false);
    expect(fail.reasons.length).toBeGreaterThan(0);
    const m1 = reviewCard(undefined, true, "2026-10-05", 1);
    expect(m1.due).toBe("2026-10-06");
    const m2 = reviewCard(m1, false, "2026-10-06", 2);
    expect(m2.lapses).toBe(1);
    expect(dueCardIds({ [id]: m2, "quiz-1": m2 }, "2026-10-07")).toEqual([id]);
  });

  it("decays the mistake ledger with a 14-day time constant", () => {
    const now = Date.UTC(2026, 9, 5);
    const day = 86400000;
    expect(decayedWeight([now], now)).toBeCloseTo(1, 9);
    expect(decayedWeight([now - 14 * day], now)).toBeCloseTo(Math.exp(-1), 9);
    expect(approxRecordWeight({ code: "lv-entry", count: 3, lastSeen: now - 28 * day, contexts: [] }, now)).toBeCloseTo(3 * Math.exp(-2), 9);
  });
});

// ---------------------------------------------------------------------------
// demonstrator and expert comparison
// ---------------------------------------------------------------------------

describe("demonstrator interface and expert comparison", () => {
  it("is deferred and says so", () => {
    const c = caseById("easy-left-0")!;
    expect(deferredDemonstrator.plan(new LegacyDiagnosticHost({ caseData: c }), { target: "selective-lm", horizonS: 20 }).status).toBe("deferred");
  });

  it("computes DTW and economy of motion against an expert run", () => {
    expect(dtwDistance([[0], [1], [2]], [[0], [1], [2]])).toBe(0);
    expect(dtwDistance([[0], [1], [2]], [[0], [0], [1], [1], [2]])).toBe(0);
    expect(dtwDistance([[0], [0]], [[1], [1]])).toBeCloseTo(1, 9);
    const a = scriptedSession().record;
    const cmp = compareToExpert(a, a);
    expect(cmp.dtw).toBe(0);
    expect(cmp.insertionRatio).toBeCloseTo(1, 9);
    expect(cmp.learner.insertionTravelMm).toBeGreaterThan(30);
  });
});

// ---------------------------------------------------------------------------
// bridge to the existing simulator store (runs the real Zustand store)
// ---------------------------------------------------------------------------

describe("simulator store bridge", () => {
  it("records a timeline from store changes and feeds the attending", async () => {
    const { useSimulatorStore } = await import("../state/useSimulatorStore");
    const { attachSimulatorStore } = await import("./bridge/simulatorStore");
    const g = () => useSimulatorStore.getState();
    g().loadCase(CASE_LIBRARY[0], "free");
    const rec = new ProcedureRecorder(meta({ context: { catheterId: g().catheterId } }));
    let t = 0;
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const said: MentorUtterance[] = [];
    const bridge = attachSimulatorStore(useSimulatorStore, rec, { wall: () => t }, { onInput: (i) => said.push(...eng.step(i)) });
    const tick = (n: number) => {
      for (let i = 0; i < n; i++) {
        t += 0.033;
        g().tick(0.033);
        bridge.sample();
      }
    };
    g().setFluoroLive(true);
    tick(15);
    g().inject(); // no aspirate first
    tick(160);
    g().aspirate();
    g().setCArm({ laoRao: -20, cranialCaudal: 24 });
    tick(20);
    g().inject();
    tick(160);
    for (let i = 0; i < 250 && g().engagement.kind !== "in-lv"; i++) {
      g().commandInsertion(0.4);
      tick(1);
    }
    tick(40);
    bridge.detach();
    const r = rec.toRecord();
    const kinds = r.events.map((e) => e.kind);
    expect(kinds.filter((k) => k === "inject").length).toBe(2);
    expect(kinds).toContain("cine-start");
    expect(kinds).toContain("cine-end");
    expect(kinds).toContain("aspirate");
    expect(kinds).toContain("view");
    const { analysis, metrics } = computeMetrics(r);
    const m = metrics as DiagnosticMetrics;
    expect(m.injections).toBe(2);
    expect(m.cineRuns).toBe(2);
    expect(m.lvEntries).toBe(1);
    expect(m.aspirateCompliance).toBeCloseTo(0.5, 5);
    const tally = detectMistakes(analysis, metrics).tally;
    expect(tally["no-aspirate"]).toBe(1);
    expect(tally["lv-entry"]).toBe(1);
    expect(said.some((u) => u.ruleId === "lv-entry")).toBe(true);
  });
});

describe("simulator store bridge: injection quality", () => {
  it("does not penalise pre-contrast filming the legacy lab cannot do, and takes the peak from the store's opacity", async () => {
    const { useSimulatorStore } = await import("../state/useSimulatorStore");
    const { attachSimulatorStore } = await import("./bridge/simulatorStore");
    const g = () => useSimulatorStore.getState();
    const c = CASE_LIBRARY[0];
    g().loadCase(c, "free");
    const target = findStartControls(c, g().catheterId, "selective-lm") ?? findStartControls(c, g().catheterId, "selective-rca");
    expect(target).not.toBeNull();
    const rec = new ProcedureRecorder(meta({ caseId: c.id, context: { catheterId: g().catheterId } }));
    let t = 0;
    const bridge = attachSimulatorStore(useSimulatorStore, rec, { wall: () => t });
    const tick = (n: number) => {
      for (let i = 0; i < n; i++) {
        t += 0.033;
        g().tick(0.033);
        bridge.sample();
      }
    };
    g().commandInsertion(target!.insertion - g().controls.cmdInsertion);
    g().commandTorque(target!.torque - g().controls.cmdTorque);
    tick(120);
    expect(g().engagement.kind.startsWith("selective-")).toBe(true);
    for (const arm of [{ laoRao: 45, cranialCaudal: -25 }, { laoRao: -30, cranialCaudal: 25 }]) {
      g().setCArm(arm);
      tick(20);
      g().aspirate();
      g().inject();
      tick(200);
    }
    bridge.detach();
    const r = rec.toRecord();
    const ends = r.events.filter((e) => e.kind === "cine-end");
    expect(ends.length).toBe(2);
    for (const e of ends) {
      expect(e.data?.injectStartS).toBeNull();
      // the store's envelope peaks at the end of wash-in (phase 0.3); tracked to one store tick
      const dur = Number(e.data?.durationS);
      expect(Math.abs(Number(e.data?.peakS) / dur - 0.3)).toBeLessThan(0.033 / dur + 1e-6);
    }
    const a = assessAttempt(r, { focus: "left", selfRatings: { inject: 5 } });
    const m = a.metrics as DiagnosticMetrics;
    expect(m.injectionQuality.length).toBe(2);
    expect(m.injectionQuality.every((q) => q.preContrastOk === null && q.preContrastS === null)).toBe(true);
    expect(m.injectionQuality.every((q) => q.washoutOk && q.adequateFill)).toBe(true);
    const cal = a.debrief.calibration.find((x) => x.subSkill === "inject")!;
    expect(cal.measured).toBe(5);
    expect(cal.flag).toBeUndefined();
  });

  it("diffEvents falls back to the named store envelope when opacity is not exposed", async () => {
    const { diffEvents, LEGACY_BOLUS_MODEL } = await import("./bridge/simulatorStore");
    type S = Parameters<typeof diffEvents>[0];
    const base = {
      engagement: { kind: "selective-lm", target: "left", conus: false, depth: 0 },
      pressure: { kind: "aortic", systolic: 120, diastolic: 70 },
      controls: { cmdInsertion: 0, insertion: 0, cmdTorque: 0, torque: 0, wireInsertion: 0, resistance: 0 },
      tip: { pos: { x: 0, y: 0, z: 0 }, height: 5, az: 0 },
      cArm: { laoRao: 0, cranialCaudal: 0 },
      imaging: { field: 20, pulseRate: 15 },
      fluoroLive: false,
      catheterId: "JL4",
      fluoroTime: 0,
      score: { contrastVolume: 0 },
      aspirated: "clean",
      events: [],
      lastInjection: null,
      finished: false,
    } as unknown as S;
    const p = { ...base, bolus: { phase: 0.99, duration: 4.8, filled: [] } } as S;
    const sNow = { ...base, bolus: null } as S;
    const end = diffEvents(sNow, p).find((e) => e.kind === "cine-end")!;
    expect(end.data?.peakS).toBeCloseTo(4.8 * LEGACY_BOLUS_MODEL.peakPhase, 9);
    expect(end.data?.injectStartS).toBeNull();
    const tracked = diffEvents(sNow, p, { peakPhase: 0.25 }).find((e) => e.kind === "cine-end")!;
    expect(tracked.data?.peakS).toBeCloseTo(1.2, 9);
  });

  it("an explicit injectStartS still grades pre-contrast filming (hosts that can film first)", () => {
    const L = new SyntheticLog();
    L.hold(1).event("cine-start", { laoRao: 30, cranCaud: 0 }).hold(4).event("cine-end", { durationS: 4, injectStartS: 0.1, peakS: 1.6 });
    L.hold(1).event("cine-start", { laoRao: -30, cranCaud: 0 }).hold(4).event("cine-end", { durationS: 4, injectStartS: 0.6, peakS: 2.1 });
    L.hold(1).event("cine-start", { laoRao: 0, cranCaud: 30 }).hold(4).event("cine-end", { durationS: 4, injectStartS: null, peakS: 1.5 });
    const runs = analyse(L.record()).runs;
    expect(runs.map((r) => r.preContrastOk)).toEqual([false, true, null]);
    expect(runs[2].postPeakS).toBeCloseTo(2.5, 9);
  });
});

describe("review fixes: shared parameters, live foreshortening, benchmarks, recording index", () => {
  it("segmentForeshortening gives the live value the foreshortened-view rule reads", () => {
    const g: SegmentGeometry = { segments: [{ label: "7", side: "left", points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 40 }] }] };
    // a segment along the beam is fully foreshortened in some view and full length in another
    const views = [{ laoRao: 0, cranialCaudal: 0 }, { laoRao: 90, cranialCaudal: 0 }, { laoRao: 45, cranialCaudal: 30 }];
    const vals = views.map((v) => segmentForeshortening(g, "7", v)!);
    expect(Math.min(...vals)).toBeLessThan(MENTOR_PARAMS.foreshortenedTrigger);
    expect(Math.max(...vals)).toBeGreaterThan(DEFAULT_COVERAGE.minForeshortening);
    expect(segmentForeshortening(g, "13", views[0])).toBeUndefined();
    // the trigger is deliberately below the coverage adequacy threshold
    expect(MENTOR_PARAMS.foreshortenedTrigger).toBeLessThan(DEFAULT_COVERAGE.minForeshortening);
    // cost on the real tree (the lab calls it on a cine start or view change)
    const c = caseById("complete-normal-0")!;
    const tg = treeSegmentGeometry(buildCoronaryTree(buildAnatomy(c), c));
    const N = 2000;
    const t0 = performance.now();
    let acc = 0;
    for (let i = 0; i < N; i++) acc += segmentForeshortening(tg, "7", { laoRao: -30 + (i % 60), cranialCaudal: 20 }) ?? 0;
    const us = ((performance.now() - t0) / N) * 1000;
    console.log(`[S11] segmentForeshortening on the real tree (segment 7): ${us.toFixed(1)} µs per call`);
    // the target label for a PCI scenario lesion comes from the tree
    const tree = buildCoronaryTree(buildAnatomy(c), c);
    for (const sc of PCI_SCENARIOS) {
      const l = segmentLabelAt(tree, sc.target.vessel, sc.target.position);
      const lad = ["6", "7", "8"], rca = ["1", "2", "3", "4"], lcx = ["11", "12", "12a", "12b", "13", "14", "14a", "14b", "15"];
      const want = sc.target.vessel === "LAD" ? lad : sc.target.vessel === "RCA" ? rca : sc.target.vessel === "LCx" ? lcx : [];
      expect(want).toContain(l);
      expect(segmentForeshortening(tg, l!, { laoRao: 30, cranialCaudal: 20 })).toBeGreaterThan(0);
    }
    expect(acc).toBeGreaterThan(0);
    expect(us).toBeLessThan(500);
  });

  it("the oversized-balloon rule and the debrief metric share one ratio", () => {
    expect(MENTOR_PARAMS.oversizeRatio).toBe(ANALYSIS_PARAMS.oversizeRatio);
    const rule = ruleById("oversized-balloon")!;
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const just = (ratio: number) => baseInput(1, { lab: "pci", pci: { ...pciBase, deviceKind: "balloon", deviceDiameter: 3 * ratio, localRefMm: 3, deviceInLesion: false, deviceInStent: false } });
    expect(rule.stopOn).toBeDefined();
    const over = eng.preAction("inflate", just(ANALYSIS_PARAMS.oversizeRatio + 0.02));
    expect(over.allow).toBe(false);
    expect(over.utterance?.ruleId).toBe("oversized-balloon");
    const fine = new MentorEngine({ mode: "supervised", entrustment: 2 }).preAction("inflate", just(ANALYSIS_PARAMS.oversizeRatio - 0.02));
    expect(fine.allow).toBe(true);
  });

  it("importBenchmark rejects entries the chosen rule cannot use, and critical errors stay a standard", () => {
    const good = buildBenchmark("diag-study", [{ caseId: "a", metrics: { contrastMl: 30 } as unknown as DiagnosticMetrics }, { caseId: "b", metrics: { contrastMl: 40 } as unknown as DiagnosticMetrics }], ["contrastMl", "fluoroS"], "mean+sd", "t", 1);
    const j = JSON.parse(exportBenchmark(good));
    const noSd = { ...j, metrics: j.metrics.map((m: Record<string, unknown>) => (m.metric === "contrastMl" ? { ...m, sd: undefined } : m)) };
    expect(() => importBenchmark(JSON.stringify(noSd))).toThrow(/sd/);
    const noMax = { ...j, rule: "max", metrics: j.metrics.map((m: Record<string, unknown>) => (m.metric === "contrastMl" ? { ...m, max: "x" } : m)) };
    expect(() => importBenchmark(JSON.stringify(noMax))).toThrow(/min and max/);
    const back = importBenchmark(exportBenchmark(good));
    const st = standardsFromBenchmark(back);
    // fluoroS had no values (n = 0): dropped, and the label counts kept metrics only
    expect(st.some((s) => s.metric === "fluoroS")).toBe(false);
    expect(st[0].source.label).toContain("n = 2");
    const crit = st.find((s) => s.metric === "criticalErrors")!;
    expect(crit.critical).toBe(true);
    expect(crit.source.kind).toBe("simulator-default");
    expect(st.every((s) => Number.isFinite(s.value))).toBe(true);
  });

  it("lists and trims recordings from the index, and indexes records saved before the index existed", async () => {
    // a record written by schema v1 (no index entry)
    const old = new ProcedureRecorder(meta({ id: "legacy", startedAt: 1 }));
    old.sample({ ...emptyFrame(), tWall: 12 });
    await idbStore<ProcedureRecord>("recordings").put("legacy", old.toRecord());
    const fresh = new ProcedureRecorder(meta({ id: "new", startedAt: 2 }));
    fresh.sample({ ...emptyFrame(), tWall: 3 });
    await saveRecording(fresh.toRecord());
    const list = await listRecordings();
    expect(list.map((x) => x.id)).toEqual(["new", "legacy"]);
    expect(list[1].durationS).toBe(12);
    expect((await idbStore("recording-index").keys()).sort()).toEqual(["legacy", "new"]);
    await deleteRecording("legacy");
    expect((await listRecordings()).map((x) => x.id)).toEqual(["new"]);
    expect(await idbStore("recording-index").keys()).toEqual(["new"]);
  });
});

// ---------------------------------------------------------------------------
// UI components render (server-side, no DOM)
// ---------------------------------------------------------------------------

describe("mentor UI components", () => {
  it("render with real data and never show a score during the case", async () => {
    const { createElement: h } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: PreBrief } = await import("../ui/mentor/PreBrief");
    const { default: AttendingDrawer } = await import("../ui/mentor/AttendingDrawer");
    const { default: MentorVoice } = await import("../ui/mentor/MentorVoice");
    const { default: ReplayTimeline } = await import("../ui/mentor/ReplayTimeline");
    const { default: Debrief } = await import("../ui/mentor/Debrief");
    const pb = prebriefForCase(caseById("high-rca-0")!);
    const pre = renderToStaticMarkup(h(PreBrief, { prebrief: pb, lab: "diagnostic", mode: "supervised", previousTakeHome: "Next time I will aspirate.", catheters: ["JR4", "AR"], views: VIEW_PRESETS.map((v) => ({ id: v.id, name: v.name })), onComplete: () => undefined }));
    expect(pre).toContain("Pre-brief");
    expect(pre).toContain("Next time I will aspirate.");
    const { said, stop } = runScenario("damped-before-inject", "supervised");
    const utts = [...said, stop!.utterance!];
    const drawer = renderToStaticMarkup(h(AttendingDrawer, { open: true, onClose: () => undefined, mode: "supervised", utterances: utts, onAskHelp: () => undefined }));
    expect(drawer).toContain("Stop. Don&#x27;t inject.");
    expect(drawer).not.toMatch(/score|%/i);
    const exam = renderToStaticMarkup(h(AttendingDrawer, { open: true, onClose: () => undefined, mode: "exam", utterances: [] }));
    expect(exam).toContain("Assessment in progress");
    expect(exam).not.toContain("Ask for help");
    const voice = renderToStaticMarkup(h(MentorVoice, { utterance: utts[0], mode: "supervised" }));
    expect(voice).toContain("Captions only");
    const { record } = scriptedSession();
    const as = assessAttempt(record, { focus: "both" });
    const tl = renderToStaticMarkup(h(ReplayTimeline, { lanes: as.lanes, decisionPoints: as.debrief.decisionPoints, current: as.lanes.t0 + 5, onSeek: () => undefined, onBranch: () => undefined }));
    expect(tl).toContain("Decision points");
    expect(tl).toContain("Try again from here");
    const db = renderToStaticMarkup(h(Debrief, { model: as.debrief, onFinish: () => undefined }));
    expect(db).toContain("Reactions");
    // results stay hidden until the learner has rated themselves
    expect(db).not.toContain("Against the standard");
  }, 240_000);
});

describe("per-frame cost", () => {
  it("attending step and recorder sampling are cheap enough for every frame", async () => {
    const { replayFrameState } = await import("./timeline");
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const n = 20000;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) eng.step(baseInput(i / 60, i % 600 < 300 ? { pressure: "damped", dia: 63 } : {}));
    const perStep = (performance.now() - t0) / n;
    const rec = new ProcedureRecorder(meta());
    const f = emptyFrame();
    const t1 = performance.now();
    for (let i = 0; i < n; i++) rec.sample({ ...f, tWall: i / 60 });
    const perSample = (performance.now() - t1) / n;
    expect(perStep).toBeLessThan(0.05); // ms
    expect(perSample).toBeLessThan(0.02);
    const { record } = scriptedSession();
    const a = analyse(record);
    const st = replayFrameState(a, a.runs[0].startT + 1.2);
    expect(st.beam).toBe("cine");
    expect(st.run!.tSinceInjection).toBeCloseTo(0.6, 1);
    expect(st.cArm).toEqual({ laoRao: -22, cranialCaudal: -22 });
    console.info(`[S11] attending step ${(perStep * 1000).toFixed(1)} µs, recorder sample ${(perSample * 1000).toFixed(2)} µs`);
  });
});

// ---------------------------------------------------------------------------
// the PCI bridge (pci-attending): MentorInput from the PCI lab session
// ---------------------------------------------------------------------------

describe("PCI bridge (pci-attending)", () => {
  const sessions: PciLabSession[] = [];
  afterEach(() => {
    for (const x of sessions.splice(0)) x.dispose();
  });
  /** lad-focal with the wire across the lesion (the 'wire-across' start), headless. */
  function across(mode: AssessmentMode = "supervised") {
    const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode });
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    return x;
  }
  const src = (x: PciLabSession, over: Partial<PciBridgeSource> = {}): PciBridgeSource => ({ snap: x.snapshot(), g: x.g, scenario: x.s, cArm: x.cArmAngles(), profile: x.engine.profile, ...over });
  const withState = (x: PciLabSession, f: (st: PciLabSession["st"]) => PciLabSession["st"]): PciBridgeSource => {
    const snap = x.snapshot();
    return src(x, { snap: { ...snap, state: f(snap.state) } });
  };

  it("a guide disengaged on purpose with a device in the coronary is not a back-out: advancing is allowed without a recent 'guide-backout'", () => {
    const x = across();
    expect(x.loadDevice("stent", "semi-compliant", 3.0, 12)).toBe(true);
    // the device in the coronary, the guide off the ostium (as for an aorto-ostial stent), no engine back-out
    const off = withState(x, (st) => ({ ...st, guide: { ...st.guide, engaged: false }, device: { ...st.device!, centreMm: 20 }, log: st.log.filter((r) => r.kind !== "guide-backout") }));
    const input = pciMentorInput(off, newPciBridgeMemory(), 1);
    expect(input.pci!.guideBackedOut).toBe(false);
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    for (let t = 0; t < 3; t += 0.1) eng.step({ ...input, beam: 1, tWall: t });
    const r = eng.preAction("advance-device", { ...input, beam: 1, tWall: 3 });
    expect(r.utterance?.ruleId).not.toBe("guide-backout-ignored");
    // the engine's own push-induced back-out, recently, is one
    const pushed = withState(x, (st) => ({ ...st, device: { ...st.device!, centreMm: 20 }, log: [...st.log, { t: st.t, kind: "guide-backout", data: {} }] }));
    expect(pciMentorInput(pushed, newPciBridgeMemory(), 1).pci!.guideBackedOut).toBe(true);
  });

  it("a bridge input with the wire in a septal fires wire-septal, and advancing in it is stopped", () => {
    const x = across();
    const septal = (st: PciLabSession["st"]) => ({ ...st, route: [...pathTo(x.g, "LAD"), "S1"], tipMm: st.tipMm });
    const input0 = pciMentorInput(withState(x, septal), newPciBridgeMemory(), 0);
    expect(input0.lab).toBe("pci");
    expect(input0.pci!.wireBranch).toBe("S1");
    expect(input0.pci!.wireInSeptal).toBe(true);
    expect(input0.pci!.wireOffRoute).toBe(true);
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const said: MentorUtterance[] = [];
    for (let t = 0; t < 4; t += 0.1) said.push(...eng.step({ ...input0, tWall: t }));
    expect(said.some((u) => u.ruleId === "wire-septal")).toBe(true);
    expect(eng.preAction("advance-wire", { ...input0, tWall: 4 }).allow).toBe(false);
    // the real route (LAD to the distal vessel) is on the route and not a septal
    const real = pciMentorInput(src(x), newPciBridgeMemory(), 0);
    expect(real.pci!.wireInSeptal).toBe(false);
    expect(real.pci!.wireOffRoute).toBe(false);
  });

  it("preAction('inflate') with an oversized balloon outside the lesion returns allow=false at entrustment 1", () => {
    const x = across("guided");
    const L = x.g.lesion;
    // take the wire well into the distal vessel, then a 4 mm balloon beyond the lesion (the assisted console's path)
    for (let i = 0; i < 40 && x.st.tipMm < L.endMm + 26; i++) {
      x.moveWire(1.5);
      x.step(1 / 15);
    }
    expect(x.st.tipMm).toBeGreaterThan(L.endMm + 20);
    expect(x.st.route[x.st.route.length - 1]).toBe("LAD");
    expect(x.loadDevice("balloon", "non-compliant", 4.0, 12)).toBe(true);
    x.advanceDevice(L.endMm + 8 - x.st.device!.centreMm);
    const input = pciMentorInput(src(x), newPciBridgeMemory(), 1);
    const p = input.pci!;
    expect(p.deviceKind).toBe("balloon");
    expect(p.deviceInLesion).toBe(false);
    expect(p.deviceInStent).toBe(false);
    expect(p.deviceDiameter! / p.localRefMm!).toBeGreaterThan(MENTOR_PARAMS.oversizeRatio);
    const eng = new MentorEngine({ mode: "guided", entrustment: 1 });
    eng.step(input);
    const r = eng.preAction("inflate", input);
    expect(r.allow).toBe(false);
    expect(r.utterance?.ruleId).toBe("oversized-balloon");
    // the same balloon in the lesion is allowed
    x.advanceDevice(L.centreMm - x.st.device!.centreMm);
    const inLesion = pciMentorInput(src(x), newPciBridgeMemory(), 2);
    expect(inLesion.pci!.deviceInLesion).toBe(true);
    expect(new MentorEngine({ mode: "guided", entrustment: 1 }).preAction("inflate", inLesion).allow).toBe(true);
  });

  it("preAction('advance-device') with the beam off as the device leaves the guide returns allow=false; screened, it is allowed", () => {
    const x = across("independent");
    expect(x.loadDevice("balloon", "semi-compliant", 2.5, 12)).toBe(true);
    // the assisted load leaves the device just inside the guide tip
    const mem = newPciBridgeMemory();
    const off = pciMentorInput(src(x), mem, 1);
    expect(off.beam).toBe(0);
    expect(off.pci!.deviceAtGuideTip).toBe(true);
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      const eng = new MentorEngine({ mode, entrustment: 3 });
      const r = eng.preAction("advance-device", off);
      expect(r.allow, mode).toBe(false);
      expect(r.utterance?.ruleId, mode).toBe("unscreened-device-advance");
    }
    x.setPedal({ fluoro: true, cine: false });
    const on = pciMentorInput(src(x), newPciBridgeMemory(), 1);
    expect(on.beam).toBe(1);
    expect(new MentorEngine({ mode: "independent", entrustment: 3 }).preAction("advance-device", on).allow).toBe(true);
    // once the device is well out in the vessel the guide tip no longer matters
    x.advanceDevice(30);
    x.setPedal({ fluoro: false, cine: false });
    expect(pciMentorInput(src(x), newPciBridgeMemory(), 2).pci!.deviceAtGuideTip).toBe(false);
  });

  it("preAction('deploy') without a positioning run triggers deploy-without-run; after a run it is allowed", () => {
    const x = across("supervised");
    expect(x.loadDevice("stent", "semi-compliant", 3.0, 18)).toBe(true);
    x.setPedal({ fluoro: true, cine: false });
    x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm);
    x.setPedal({ fluoro: false, cine: false });
    expect(pciPreActionFor("inflate", x.st)).toBe("deploy");
    const input = pciMentorInput(src(x), newPciBridgeMemory(), 3);
    expect(input.pci!.deviceKind).toBe("stent");
    expect(input.pci!.injectedSinceDeviceMove).toBe(false);
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 });
    const r = eng.preAction("deploy", input);
    expect(r.utterance?.ruleId).toBe("deploy-without-run");
    expect(r.allow).toBe(false);
    // a positioning run, then the deployment goes ahead
    expect(x.inject({ autoCine: true })).toBe(true);
    for (let t = 0; t < 0.4; t += 1 / 30) x.step(1 / 30);
    x.releaseInjection();
    for (let t = 0; t < 4; t += 1 / 30) x.step(1 / 30);
    const after = pciMentorInput(src(x), newPciBridgeMemory(), 9);
    expect(after.pci!.injectedSinceDeviceMove).toBe(true);
    expect(new MentorEngine({ mode: "supervised", entrustment: 2 }).preAction("deploy", after).allow).toBe(true);
  });

  it("the guide pressure class reaches the damped-injection rule (lab 'any') from the PCI lab", () => {
    const x = across("supervised");
    const snap = x.snapshot();
    const damped = pciMentorInput(src(x, { snap: { ...snap, guidePressure: "ventricularised" } }), newPciBridgeMemory(), 1);
    expect(damped.pressure).toBe("ventricularised");
    const r = new MentorEngine({ mode: "supervised" }).preAction("inject", damped);
    expect(r.allow).toBe(false);
    expect(r.utterance?.ruleId).toBe("damped-before-inject");
  });

  it("the contrast ceiling comes from contrastBudget.ts for the session's patient, or the plan's when lower", () => {
    const x = across("supervised");
    const a = pciMentorInput(src(x), newPciBridgeMemory(), 1).pci!;
    expect(a.contrastCeilingMl).toBeGreaterThan(0);
    expect(a.contrastWarnMl).toBeLessThan(a.contrastCeilingMl!);
    const b = pciMentorInput(src(x, { planContrastMl: 40 }), newPciBridgeMemory(), 1).pci!;
    expect(b.contrastCeilingMl).toBe(Math.min(40, a.contrastCeilingMl!));
    // past the plan's ceiling an injection is stopped in supervised practice and left to the debrief in independent
    const over = { ...pciMentorInput(src(x, { planContrastMl: 40 }), newPciBridgeMemory(), 1), pci: { ...b, contrastMl: 45 } };
    expect(new MentorEngine({ mode: "supervised" }).preAction("inject", over).utterance?.ruleId).toBe("contrast-ceiling");
    expect(new MentorEngine({ mode: "independent" }).preAction("inject", over).allow).toBe(true);
  });
});
