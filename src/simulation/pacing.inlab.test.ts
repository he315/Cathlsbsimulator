// In-lab bradycardia scenarios, box units and sheath fit (pacing-in-lab-scenarios-and-tips).
//   npx vitest run src/simulation/pacing.inlab.test.ts
import { describe, expect, it } from "vitest";
import {
  ACCEPTABLE_THRESHOLD,
  ACCESS_INFO,
  BOX_LIMITS,
  DEFAULT_TCP,
  IN_LAB_MODEL,
  LEAD_IMPEDANCE_OHM,
  NO_FAULTS,
  OUTPUT_MARGIN,
  OXFORD_OUTPUT_MARGIN,
  PACING_SCENARIOS,
  PACING_VARIANTS,
  TIGHT_SHEATH_TORQUE,
  ZONE_LABEL,
  ZONE_LEN,
  accessInfoFor,
  actionAt,
  advanceRhythm,
  applyInitialAction,
  asynchronousWithIntrinsic,
  consistentThreshold,
  createRhythm,
  directionOf,
  effectiveScenario,
  formatOutput,
  getPacingScenario,
  inLabCriteria,
  inLabPassed,
  inLabTick,
  initialActionsFor,
  initialInLabState,
  initialLead,
  leadInfo,
  moveLead,
  nowOf,
  outputFrom,
  outputIn,
  outputLimits,
  pacingNumerics,
  patientResponsive,
  pacingVariant,
  recommendedOutput,
  recommendedSensitivity,
  requiredMargin,
  rhythmSupported,
  rotateLead,
  rotateThroughSheath,
  scorePacing,
  sensedSignals,
  stepOutputIn,
  withInLabConduction,
  type BoxSettings,
  type BoxUnits,
  type InLabState,
  type LeadState,
  type PacingContext,
  type PacingRunLog,
  type PacingScenario,
  type RhythmState,
} from "./pacing";

const IN_LAB = ["inlab-rca-chb-rbbb", "inlab-adenosine-avb", "inlab-amiodarone-avb"] as const;

/** A femoral lead taken to the RV apex: up the IVC, a loop on the lateral RA wall, across the valve. */
function femoralApex(): LeadState {
  let l = initialLead("femoral");
  l = moveLead(l, ZONE_LEN.ivc + ZONE_LEN.ra).lead;
  l = rotateLead(l, 180); // lateral: buckles into a loop
  l = moveLead(l, 1).lead;
  l = rotateLead(l, 180); // back toward the tricuspid valve
  l = moveLead(l, ZONE_LEN["rv-inflow"] + ZONE_LEN["rv-apex"] + 0.01).lead;
  return { ...l, push: 0 };
}

/** A femoral lead in the coronary sinus. */
function femoralCs(): LeadState {
  let l = initialLead("femoral");
  l = moveLead(l, ZONE_LEN.ivc + ZONE_LEN.ra).lead;
  l = rotateLead(l, 90); // posterior
  l = moveLead(l, ZONE_LEN.cs).lead;
  return l;
}

function context(sc: PacingScenario, lead: LeadState, box: Partial<BoxSettings>, st: InLabState | null): PacingContext {
  return {
    scenario: sc,
    lead,
    box: { mode: "VVI", rate: 70, output: 5, sensitivity: 2, connected: true, ...box },
    tcp: { ...DEFAULT_TCP },
    faults: withInLabConduction(NO_FAULTS, st),
  };
}

const qrsSince = (r: RhythmState, t0: number) => r.events.filter((e) => e.kind === "qrs" && e.t > t0);

/** A run log for an in-lab scenario, with the wire placed and the box set as given. */
function inLabLog(sc: PacingScenario, variant: string | null, o: Partial<PacingRunLog> & { st: InLabState; supportedAt: number | null; wirePlaced?: boolean; asyncWithIntrinsic?: boolean }): PacingRunLog {
  const lead = o.finalZone === "cs" ? femoralCs() : femoralApex();
  const thr = consistentThreshold(lead, sc)!;
  const sig = sensedSignals(lead, sc);
  const { st, supportedAt, wirePlaced = true, asyncWithIntrinsic = false, ...rest } = o;
  return {
    scenarioId: sc.id,
    variant,
    units: "V",
    sheath: "larger",
    tcpUsed: true,
    tcpMechanicalChecked: true,
    access: "femoral",
    finalZone: lead.zone,
    finalContact: leadInfo(lead).contact,
    lateralChecked: true,
    perforation: false,
    thresholdMeasured: thr,
    trueThreshold: thr,
    finalOutput: thr * OXFORD_OUTPUT_MARGIN,
    finalRate: 70,
    finalSensitivity: recommendedSensitivity(sig.r),
    finalMode: "VVI",
    sensingMeasured: sc.dependent ? null : sig.r,
    sensingSkippedDependent: sc.dependent,
    rWave: sig.r,
    tWave: sig.t,
    onTSpikes: 0,
    events: [],
    inLab: { onsetT: st.onsetT, actions: st.actions, supportedAt, restoredAt: st.restoredAt, asyncWithIntrinsic, wirePlaced },
    ...rest,
  };
}

describe("in-lab scenarios", () => {
  it("are registered with an initial-management course, Oxford's threefold margin and a box that reads volts", () => {
    for (const id of IN_LAB) {
      const sc = getPacingScenario(id);
      expect(PACING_SCENARIOS).toContain(sc);
      expect(sc.inLab).toBeDefined();
      expect(sc.events).toEqual([]);
      expect(requiredMargin(sc)).toBe(OXFORD_OUTPUT_MARGIN);
      expect(sc.boxUnits).toBe("V");
      expect(initialActionsFor(sc)).toEqual(expect.arrayContaining(["wait", "atropine", "external-pacing", "femoral-wire"]));
      // a femoral wire is the in-lab default; the ward scenarios keep the jugular preference
      expect(accessInfoFor(sc, "femoral").verdict).toBe("preferred");
      expect(accessInfoFor(sc, "left-subclavian").verdict).toBe("discouraged");
    }
    expect(initialActionsFor(getPacingScenario("inlab-amiodarone-avb"))).toContain("stop-infusion");
    expect(initialActionsFor(getPacingScenario("inlab-rca-chb-rbbb"))).not.toContain("stop-infusion");
    const ward = getPacingScenario("inferior-chb");
    expect(initialActionsFor(ward)).toEqual([]);
    expect(requiredMargin(ward)).toBe(OUTPUT_MARGIN.min);
    expect(accessInfoFor(ward, "femoral")).toEqual(ACCESS_INFO.femoral);
  });

  it("each has a held-out exam variant with a different patient; the adenosine block has a persistent and a transient practice pair", () => {
    for (const id of IN_LAB) {
      const exam = pacingVariant(id, "exam");
      expect(exam?.heldOut).toBe(true);
      const base = getPacingScenario(id);
      const ex = getPacingScenario(id, "exam");
      expect(ex.vignette).not.toBe(base.vignette);
      expect(ex.inLab).toEqual(base.inLab);
      expect(ex.id).toBe(base.id);
    }
    expect((PACING_VARIANTS["inlab-adenosine-avb"] ?? []).map((v) => v.id)).toEqual(["persistent", "transient", "exam"]);
    expect(getPacingScenario("inlab-adenosine-avb", "persistent").inLab).toEqual(getPacingScenario("inlab-adenosine-avb").inLab);
    expect(getPacingScenario("inlab-adenosine-avb", "transient").inLab?.coughResolves).toBe(true);
    // an unknown variant is ignored
    expect(getPacingScenario("inlab-rca-chb-rbbb", "nope")).toBe(getPacingScenario("inlab-rca-chb-rbbb"));
  });

  it("acceptance: in the persistent 'inlab-adenosine-avb' variant waiting 30 s and a cough do not restore conduction; transvenous pacing at 3x threshold in demand mode passes", () => {
    const sc = getPacingScenario("inlab-adenosine-avb", "persistent");
    expect(sc.escapeRate).toBeNull();
    const r = createRhythm(sc, 10);
    let st = initialInLabState(nowOf(r));
    const idle = (s: InLabState) => context(sc, initialLead("femoral"), { connected: false, mode: "OFF" }, s);

    // wait 30 s
    st = applyInitialAction(sc, st, "wait", nowOf(r));
    advanceRhythm(r, idle(st), IN_LAB_MODEL.waitS);
    st = inLabTick(sc, st, nowOf(r));
    expect(IN_LAB_MODEL.waitS).toBe(30);
    expect(st.restoredAt).toBeNull();
    // then a cough
    const tCough = nowOf(r);
    st = applyInitialAction(sc, st, "cough", tCough);
    advanceRhythm(r, idle(st), 10);
    st = inLabTick(sc, st, nowOf(r));
    expect(st.restoredAt).toBeNull();
    expect(withInLabConduction(NO_FAULTS, st).conductionReturned).toBe(false);
    // no ventricular beat in all that time: block without an escape
    expect(qrsSince(r, st.onsetT)).toHaveLength(0);
    expect(pacingNumerics(r, idle(st)).hr).toBe(0);
    expect(rhythmSupported(pacingNumerics(r, idle(st)), idle(st))).toBe(false);

    // a femoral wire at the apex, the threshold measured, the output at three times it, demand mode
    const lead = femoralApex();
    expect(lead.zone).toBe("rv-apex");
    const thr = consistentThreshold(lead, sc)!;
    const c = context(sc, lead, { mode: "VVI", rate: 70, output: thr * 3, connected: true }, st);
    const tPace = nowOf(r);
    // supportedAt as the lab finds it: the first moment rhythmSupported holds over the run
    let supportedAt: number | null = null;
    for (let i = 0; i < 40 && supportedAt === null; i++) {
      advanceRhythm(r, c, 0.25);
      if (rhythmSupported(pacingNumerics(r, c), c)) supportedAt = nowOf(r);
    }
    expect(supportedAt).not.toBeNull();
    advanceRhythm(r, c, 10 - (nowOf(r) - tPace));
    const n = pacingNumerics(r, c);
    expect(qrsSince(r, tPace).length).toBeGreaterThan(8);
    expect(rhythmSupported(n, c)).toBe(true);
    expect(supportedAt! - st.onsetT).toBeLessThanOrEqual(sc.inLab!.timeLimitS);

    const log = inLabLog(sc, "persistent", { st, supportedAt, thresholdMeasured: thr, finalOutput: thr * 3, finalMode: "VVI" });
    const crit = inLabCriteria(log);
    expect(crit.map((x) => x.id)).toEqual(["supported-in-time", "no-cs-accepted", "output-margin", "demand-mode", "no-async-with-intrinsic"]);
    expect(crit.filter((x) => !x.met)).toEqual([]);
    expect(inLabPassed(log)).toBe(true);
  });

  it("in prolonged standstill the patient stops responding (and cannot cough); a beat of any origin restores it", () => {
    const sc = getPacingScenario("inlab-adenosine-avb", "persistent");
    const r = createRhythm(sc, 10);
    const st = initialInLabState(nowOf(r));
    const idle = context(sc, initialLead("femoral"), { connected: false, mode: "OFF" }, st);
    expect(patientResponsive(r, st)).toBe(true);
    advanceRhythm(r, idle, IN_LAB_MODEL.unresponsiveAfterS - 1);
    expect(patientResponsive(r, st)).toBe(true);
    advanceRhythm(r, idle, 2);
    expect(patientResponsive(r, st)).toBe(false);
    // the Wait choice outlasts consciousness in standstill: waiting passively is not an option here
    expect(IN_LAB_MODEL.unresponsiveAfterS).toBeLessThan(IN_LAB_MODEL.waitS);
    // pacing with capture restores perfusion and the patient responds again
    const lead = femoralApex();
    const c = context(sc, lead, { mode: "VVI", rate: 70, output: consistentThreshold(lead, sc)! * 3, connected: true }, st);
    advanceRhythm(r, c, 3);
    expect(patientResponsive(r, st)).toBe(true);
    // a scenario with an escape rhythm never loses the patient this way, nor does a ward scenario
    const rca = getPacingScenario("inlab-rca-chb-rbbb");
    const r2 = createRhythm(rca, 10);
    const st2 = initialInLabState(nowOf(r2));
    advanceRhythm(r2, context(rca, initialLead("femoral"), { connected: false, mode: "OFF" }, st2), 60);
    expect(patientResponsive(r2, st2)).toBe(true);
    expect(patientResponsive(r2, null)).toBe(true);
  });

  it("the coronary sinus criterion names the final position with its own capitals", () => {
    const sc = getPacingScenario("inlab-rca-chb-rbbb");
    const st = applyInitialAction(sc, initialInLabState(10), "femoral-wire", 12);
    const crit = inLabCriteria(inLabLog(sc, null, { st, supportedAt: 40, finalZone: "rv-apex" })).find((x) => x.id === "no-cs-accepted")!;
    expect(crit.detail).toContain(ZONE_LABEL["rv-apex"]);
    expect(crit.detail).not.toMatch(/rv apex/);
  });

  it("in the transient variant a cough restores conduction within seconds, and no wire is then needed", () => {
    const sc = getPacingScenario("inlab-adenosine-avb", "transient");
    const r = createRhythm(sc, 10);
    let st = initialInLabState(nowOf(r));
    st = applyInitialAction(sc, st, "cough", nowOf(r) + 1);
    st = inLabTick(sc, st, nowOf(r) + 1 + IN_LAB_MODEL.coughEffectS);
    expect(st.restoredAt).not.toBeNull();
    const c = context(sc, initialLead("femoral"), { connected: false, mode: "OFF" }, st);
    advanceRhythm(r, c, 8);
    expect(qrsSince(r, st.restoredAt!).length).toBeGreaterThan(5);
    const n = pacingNumerics(r, c);
    expect(rhythmSupported(n, c)).toBe(true);
    // finished without a wire: the wire criteria do not apply
    const log = inLabLog(sc, "transient", { st, supportedAt: st.restoredAt! + 1, wirePlaced: false, access: null, thresholdMeasured: null, finalZone: "ivc" });
    expect(inLabPassed(log)).toBe(true);
    expect(scorePacing(log).items.find((i) => i.label === "Lead position")?.detail).toMatch(/no wire was needed/);
    // and the block also clears by itself
    const later = inLabTick(sc, initialInLabState(0), 12);
    expect(later.restoredAt).toBe(12);
  });

  it("atropine speeds the atrial rate after its onset but does not restore conduction after an RCA injection", () => {
    const sc = getPacingScenario("inlab-rca-chb-rbbb");
    let st = initialInLabState(10);
    st = applyInitialAction(sc, st, "atropine", 12);
    expect(actionAt(st, "atropine")).toBe(12);
    // recorded once
    expect(applyInitialAction(sc, st, "atropine", 20)).toBe(st);
    expect(effectiveScenario(sc, st, 12 + IN_LAB_MODEL.atropineOnsetS - 1).atrialRate).toBe(sc.atrialRate);
    expect(effectiveScenario(sc, st, 12 + IN_LAB_MODEL.atropineOnsetS).atrialRate).toBe(Math.round(sc.atrialRate! * sc.inLab!.atropineAtrialFactor));
    expect(inLabTick(sc, st, 400).restoredAt).toBeNull();
    // stopping an infusion is offered only where one runs
    expect(applyInitialAction(sc, st, "stop-infusion", 30)).toBe(st);
    const amio = getPacingScenario("inlab-amiodarone-avb");
    expect(actionAt(applyInitialAction(amio, initialInLabState(10), "stop-infusion", 15), "stop-infusion")).toBe(15);
  });

  it("fails the run for a coronary sinus wire, an output under three times the measured threshold, VOO, or asynchronous pacing over an escape rhythm", () => {
    const sc = getPacingScenario("inlab-amiodarone-avb");
    const st = initialInLabState(10);
    const supportedAt = 60;
    const pass = inLabLog(sc, null, { st, supportedAt });
    expect(inLabPassed(pass)).toBe(true);
    const failed = (log: PacingRunLog) => inLabCriteria(log).filter((c) => !c.met).map((c) => c.id);

    expect(failed(inLabLog(sc, null, { st, supportedAt, finalZone: "cs" }))).toEqual(["no-cs-accepted"]);
    // 2.5 times (the ward scenarios' default) is not enough here
    const thr = consistentThreshold(femoralApex(), sc)!;
    expect(failed(inLabLog(sc, null, { st, supportedAt, finalOutput: recommendedOutput(thr) }))).toEqual(["output-margin"]);
    expect(failed(inLabLog(sc, null, { st, supportedAt, thresholdMeasured: null }))).toEqual(["output-margin"]);
    expect(failed(inLabLog(sc, null, { st, supportedAt, finalMode: "VOO" }))).toEqual(["demand-mode"]);
    expect(failed(inLabLog(sc, null, { st, supportedAt, asyncWithIntrinsic: true }))).toEqual(["no-async-with-intrinsic"]);
    expect(failed(inLabLog(sc, null, { st, supportedAt: st.onsetT + sc.inLab!.timeLimitS + 1 }))).toEqual(["supported-in-time"]);
    expect(failed(inLabLog(sc, null, { st, supportedAt: null }))).toEqual(["supported-in-time"]);
    // no wire and no recovery: every wire criterion fails
    expect(failed(inLabLog(sc, null, { st, supportedAt, wirePlaced: false }))).toEqual(["no-cs-accepted", "output-margin", "demand-mode"]);

    // the asynchronous rule sees an intrinsic rhythm: the junctional escape here, none after adenosine
    const box: BoxSettings = { mode: "VOO", rate: 70, output: 5, sensitivity: 2, connected: true };
    expect(asynchronousWithIntrinsic(sc, NO_FAULTS, box)).toBe(true);
    expect(asynchronousWithIntrinsic(sc, NO_FAULTS, { ...box, mode: "VVI" })).toBe(false);
    expect(asynchronousWithIntrinsic(getPacingScenario("inlab-adenosine-avb"), NO_FAULTS, box)).toBe(false);
  });

  it("scores initial management from the expected actions, and penalises waiting instead of preparing", () => {
    const sc = getPacingScenario("inlab-rca-chb-rbbb");
    let good = initialInLabState(10);
    for (const a of ["atropine", "external-pacing", "femoral-wire"] as const) good = applyInitialAction(sc, good, a, 15);
    const g = scorePacing(inLabLog(sc, null, { st: good, supportedAt: 40 }));
    expect(g.items.find((i) => i.label === "Initial management")?.points).toBe(20);
    expect(g.items.reduce((a, b) => a + b.max, 0)).toBe(100);
    expect(g.score).toBeGreaterThanOrEqual(90);

    const waitOnly = applyInitialAction(sc, initialInLabState(10), "wait", 11);
    const w = scorePacing(inLabLog(sc, null, { st: waitOnly, supportedAt: 300 }));
    expect(w.items.find((i) => i.label === "Initial management")?.points).toBe(0);
    expect(w.items.find((i) => i.label === "Initial management")?.detail).toMatch(/Waited without preparing/);
    expect(w.items.find((i) => i.label === "Rhythm supported in time")?.points).toBe(5);
    expect(w.score).toBeLessThan(g.score);
    // the wire started first, then the infusion stopped: both expected actions still count
    const amio = getPacingScenario("inlab-amiodarone-avb");
    expect(amio.inLab!.expected).toEqual(["stop-infusion", "femoral-wire"]);
    let late = applyInitialAction(amio, initialInLabState(10), "femoral-wire", 12);
    late = applyInitialAction(amio, late, "stop-infusion", 20);
    expect(scorePacing(inLabLog(amio, null, { st: late, supportedAt: 60 })).items.find((i) => i.label === "Initial management")?.points).toBe(20);

    // external pacing earns its share only if it captured: pads on (or pacing that never captured) earn nothing
    const noCapture = scorePacing(inLabLog(sc, null, { st: good, supportedAt: 40, tcpUsed: false }));
    expect(noCapture.items.find((i) => i.label === "Initial management")?.points).toBe(Math.round(20 - 20 / sc.inLab!.expected.length));
    // a same-size sheath costs access points
    const tight = scorePacing(inLabLog(sc, null, { st: good, supportedAt: 40, sheath: "same" }));
    expect(tight.items.find((i) => i.label === "Access")!.points).toBe(7);
  });
});

describe("box units: volts or milliamps", () => {
  it("converts through the lead impedance (a model parameter) both ways, at the default and at other impedances", () => {
    expect(LEAD_IMPEDANCE_OHM).toBe(500);
    for (const ohm of [LEAD_IMPEDANCE_OHM, 500, 750]) {
      for (const mA of [0.4, 1, 2.5, 7]) {
        expect(outputFrom(outputIn(mA, "V", ohm), "V", ohm)).toBeCloseTo(mA, 10);
        expect(outputIn(mA, "mA", ohm)).toBe(mA);
      }
      expect(outputIn(2, "V", ohm)).toBeCloseTo((2 * ohm) / 1000, 10);
    }
    expect(formatOutput(2.5, "mA")).toBe("2.5 mA");
    expect(formatOutput(5, "V")).toBe("2.5 V");
    expect(formatOutput(2, "V", 500)).toBe("1 V");
    expect(outputLimits("mA")).toEqual([...BOX_LIMITS.output]);
  });

  it("the two dials read different numbers for the same output, and the lesson's volt anchors still hold", () => {
    // the units lesson: the same output and threshold read differently on a box in volts
    for (const mA of [0.6, 1.6, 2, 5]) expect(formatOutput(mA, "V").replace(" V", "")).not.toBe(formatOutput(mA, "mA").replace(" mA", ""));
    expect(formatOutput(1.6, "mA")).toBe("1.6 mA");
    expect(formatOutput(1.6, "V")).toBe("0.8 V");
    // Oxford ch 9: threshold ideally 1 V or less; the model's acceptable threshold (below 1 mA) stays inside it
    expect(outputIn(ACCEPTABLE_THRESHOLD, "V")).toBeLessThanOrEqual(1);
    // Oxford ch 9: the threshold test starts at 3 V, which the volt dial can reach
    expect(outputLimits("V")[0]).toBeLessThan(3);
    expect(outputLimits("V")[1]).toBeGreaterThanOrEqual(3);
    // every in-lab scenario's apex threshold reads below 1 V
    for (const id of IN_LAB) expect(outputIn(consistentThreshold(femoralApex(), getPacingScenario(id))!, "V")).toBeLessThanOrEqual(1);
  });

  it("the volt dial steps like the milliamp dial, within the box's limits", () => {
    expect(stepOutputIn(1.0, 1, "V")).toBeCloseTo(1.1, 10);
    expect(stepOutputIn(3.0, -1, "V")).toBeCloseTo(2.5, 10);
    expect(stepOutputIn(6, 1, "V")).toBe(7);
    expect(stepOutputIn(outputLimits("V")[1], 1, "V")).toBe(outputLimits("V")[1]);
    expect(stepOutputIn(outputLimits("V")[0], -1, "V")).toBe(outputLimits("V")[0]);
    expect(stepOutputIn(2, 1, "mA")).toBe(2.5);
  });

  it("acceptance: output entered in volts at 3x threshold passes in both unit displays", () => {
    const sc = getPacingScenario("inlab-rca-chb-rbbb");
    const st = applyInitialAction(sc, initialInLabState(10), "femoral-wire", 12);
    for (const ohm of [LEAD_IMPEDANCE_OHM, 500]) {
      const lead = femoralApex();
      const thrMa = consistentThreshold(lead, sc)!;
      // the learner reads the threshold in volts, works out three times it and turns the volt dial there
      const thrV = outputIn(thrMa, "V", ohm);
      const enteredV = 3 * thrV;
      const outMa = outputFrom(enteredV, "V", ohm);
      for (const units of ["V", "mA"] as BoxUnits[]) {
        const log = inLabLog(sc, null, { st, supportedAt: 40, units, thresholdMeasured: thrMa, finalOutput: outMa });
        const m = inLabCriteria(log).find((c) => c.id === "output-margin")!;
        expect(m.met, `${units} at ${ohm} ohm`).toBe(true);
        expect(m.detail).toContain("3.0 times");
        expect(m.detail).toContain(` ${units}`);
        expect(inLabPassed(log)).toBe(true);
        // the same ratio in the box's own units
        expect(outputIn(outMa, units, ohm) / outputIn(thrMa, units, ohm)).toBeCloseTo(3, 9);
      }
      // and just under three times fails in both
      const under = outputFrom(2.9 * thrV, "V", ohm);
      for (const units of ["V", "mA"] as BoxUnits[])
        expect(inLabCriteria(inLabLog(sc, null, { st, supportedAt: 40, units, thresholdMeasured: thrMa, finalOutput: under })).find((c) => c.id === "output-margin")!.met).toBe(false);
    }
  });
});

describe("box units: the threshold found on the dial", () => {
  /** Box spikes after t0 outside the refractory period (a spike in it cannot capture at any output). */
  const boxSpikes = (r: RhythmState, t0: number) => r.events.filter((e) => e.kind === "spike" && e.source === "box" && e.t > t0 && !e.refractory);

  it("acceptance: turning the dial down from 3 finds the threshold as the lab does; three times it on the same dial captures and passes", () => {
    const sc = getPacingScenario("inlab-rca-chb-rbbb");
    const st = applyInitialAction(sc, initialInLabState(10), "femoral-wire", 12);
    const lead = femoralApex();
    const thrTrue = consistentThreshold(lead, sc)!;
    for (const [units, ohm] of [["V", LEAD_IMPEDANCE_OHM], ["mA", LEAD_IMPEDANCE_OHM], ["V", 500]] as [BoxUnits, number][]) {
      const label = `${units} at ${ohm} ohm`;
      const r = createRhythm(sc, 10);
      // from a high output (Oxford starts at 3 V), step the dial down until capture is lost
      let dial = 3;
      let prevMa: number | null = null;
      let thresholdMeasured: number | null = null;
      for (let i = 0; i < 60 && thresholdMeasured === null; i++) {
        const mA = outputFrom(dial, units, ohm);
        const c = context(sc, lead, { mode: "VVI", rate: 80, output: mA }, st);
        const t0 = nowOf(r);
        advanceRhythm(r, c, 4);
        const spikes = boxSpikes(r, t0);
        expect(spikes.length, label).toBeGreaterThan(3);
        // changeOutput's rule: capture lost on the step from prev (at or above the threshold) to below it
        if (prevMa !== null && prevMa >= thrTrue && mA < thrTrue) thresholdMeasured = prevMa;
        else {
          if (mA >= thrTrue) expect(spikes.every((e) => e.captured), `${label} at ${dial}`).toBe(true);
          prevMa = mA;
          const next = stepOutputIn(dial, -1, units, ohm);
          expect(next, label).toBeLessThan(dial);
          dial = next;
        }
      }
      expect(thresholdMeasured, label).toBe(prevMa);
      expect(thresholdMeasured!, label).toBeGreaterThanOrEqual(thrTrue);
      // the dial reading at the threshold, in the box's units, is a dial value one step above the loss
      expect(stepOutputIn(dial, 1, units, ohm), label).toBeCloseTo(outputIn(thresholdMeasured!, units, ohm), 9);

      // turn the same dial up to three times the threshold as it reads
      const target = OXFORD_OUTPUT_MARGIN * outputIn(thresholdMeasured!, units, ohm);
      while (dial < target - 1e-9) dial = stepOutputIn(dial, 1, units, ohm);
      const finalOutput = outputFrom(dial, units, ohm);
      expect(finalOutput / thresholdMeasured!, label).toBeGreaterThanOrEqual(OXFORD_OUTPUT_MARGIN - 1e-9);
      const c = context(sc, lead, { mode: "VVI", rate: 80, output: finalOutput }, st);
      const t1 = nowOf(r);
      advanceRhythm(r, c, 10);
      expect(boxSpikes(r, t1).every((e) => e.captured), label).toBe(true);
      expect(rhythmSupported(pacingNumerics(r, c), c), label).toBe(true);
      const log = inLabLog(sc, null, { st, supportedAt: 40, units, thresholdMeasured, finalOutput });
      expect(inLabCriteria(log).find((x) => x.id === "output-margin")!.met, label).toBe(true);
      // one dial step short of the target fails
      const short = outputFrom(stepOutputIn(dial, -1, units, ohm), units, ohm);
      if (short < OXFORD_OUTPUT_MARGIN * thresholdMeasured! - 1e-9)
        expect(inLabCriteria(inLabLog(sc, null, { st, supportedAt: 40, units, thresholdMeasured, finalOutput: short })).find((x) => x.id === "output-margin")!.met, label).toBe(false);
    }
  });
});

describe("sheath fit", () => {
  it("a sheath the same size as the wire passes only part of each turn to the tip", () => {
    const l = initialLead("femoral");
    expect(rotateThroughSheath(l, 90, "larger").rot).toBe(90);
    expect(rotateThroughSheath(l, 90, null).rot).toBe(90);
    expect(rotateThroughSheath(l, 90, "same").rot).toBeCloseTo(90 * TIGHT_SHEATH_TORQUE, 10);
    // it still turns, with more effort
    let t = l;
    for (let i = 0; i < 6; i++) t = rotateThroughSheath(t, 30, "same");
    expect(directionOf(t.rot)).toBe("posterior");
  });
});
