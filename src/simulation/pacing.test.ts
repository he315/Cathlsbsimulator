import { describe, it, expect } from "vitest";
import {
  PACING_SCENARIOS,
  getPacingScenario,
  initialLead,
  moveLead,
  rotateLead,
  leadInfo,
  captureThreshold,
  consistentThreshold,
  captures,
  OUTPUT_MARGIN,
  ACCEPTABLE_THRESHOLD,
  sensedSignals,
  assessSensing,
  recommendedOutput,
  recommendedSensitivity,
  createRhythm,
  advanceRhythm,
  arterialAt,
  nowOf,
  pacingNumerics,
  applyFault,
  faultStatus,
  stepOutput,
  stepSensitivity,
  scorePacing,
  sensingTestable,
  NO_FAULTS,
  DEFAULT_TCP,
  ZONE_LEN,
  type LeadState,
  type PacingContext,
  type BoxSettings,
  type PacingScenario,
  type Faults,
  type RhythmState,
} from "./pacing";

const inferior = getPacingScenario("inferior-chb");
const sinusArrest = getPacingScenario("sinus-arrest");
const tavi = getPacingScenario("tavi-chb");

/** RIJ lead driven to a well-seated RV apex. */
function apexLead(): LeadState {
  let l = initialLead("rij");
  l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra + ZONE_LEN["rv-inflow"] + ZONE_LEN["rv-apex"]).lead;
  return l;
}

function ctx(sc: PacingScenario, lead: LeadState, box: Partial<BoxSettings> = {}, faults: Faults = NO_FAULTS): PacingContext {
  return {
    scenario: sc,
    lead,
    box: { mode: "VVI", rate: 70, output: 5, sensitivity: 4, connected: true, ...box },
    tcp: { ...DEFAULT_TCP },
    faults,
  };
}

function eventsSince(s: RhythmState, t0: number) {
  return s.events.filter((e) => e.t >= t0);
}

describe("lead navigation", () => {
  it("RIJ: advancing with the tip toward the tricuspid valve reaches the RV apex with good contact", () => {
    const l = apexLead();
    expect(l.zone).toBe("rv-apex");
    const info = leadInfo(l);
    expect(info.stable).toBe(true);
    expect(info.contact).toBeCloseTo(1, 5);
    expect(info.injury).toBeGreaterThan(0.9); // current of injury when wedged
    expect(info.lateralCourse).toBe("anterior");
  });

  it("RIJ: a posterior-medial tip direction in the RA enters the coronary sinus, which runs posteriorly on the lateral view", () => {
    let l = initialLead("rij");
    l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra - 0.5).lead;
    l = rotateLead(l, 90);
    l = moveLead(l, 3).lead;
    expect(l.zone).toBe("cs");
    const info = leadInfo(l);
    expect(info.lateralCourse).toBe("posterior");
    expect(info.malposition).toMatch(/coronary sinus/i);
  });

  it("RIJ: a superior tip direction in the RV inflow flicks into the RVOT and then the PA", () => {
    let l = initialLead("rij");
    l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra + 1).lead;
    expect(l.zone).toBe("rv-inflow");
    l = rotateLead(l, 270);
    l = moveLead(l, 3).lead;
    expect(l.zone).toBe("rvot");
    l = moveLead(l, 4).lead;
    expect(l.zone).toBe("pa");
  });

  it("RIJ: a lateral tip direction in the RA goes down the IVC into a hepatic vein", () => {
    let l = initialLead("rij");
    l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra - 0.5).lead;
    l = rotateLead(l, 180);
    l = moveLead(l, ZONE_LEN.ivc + 2).lead;
    expect(l.zone).toBe("hepatic");
    expect(captureThreshold(l, inferior)).toBeNull();
  });

  it("femoral: the lead goes up into the SVC unless a loop is formed first", () => {
    let l = initialLead("femoral");
    l = moveLead(l, ZONE_LEN.ivc + ZONE_LEN.ra + 1).lead;
    expect(l.zone).toBe("svc");
    l = moveLead(l, -2).lead;
    expect(l.zone).toBe("ra");
    l = rotateLead(l, 180); // lateral: buckle against the free wall
    l = moveLead(l, 2).lead;
    expect(l.loop).toBe(true);
    expect(l.zone).toBe("ra");
    l = rotateLead(l, 180); // back toward the tricuspid valve
    l = moveLead(l, 1).lead;
    expect(l.zone).toBe("rv-inflow");
  });

  it("pushing hard against the apex perforates the RV and changes capture to an RBBB pattern", () => {
    let l = apexLead();
    const m = moveLead(l, 3);
    l = m.lead;
    expect(l.zone).toBe("perforated");
    expect(l.perforated).toBe(true);
    expect(m.messages.join(" ")).toMatch(/perforat/i);
    // withdrawing returns to the cavity but the flag persists
    const back = moveLead(l, -1).lead;
    expect(back.zone).toBe("rv-apex");
    expect(back.perforated).toBe(true);
  });

  it("withdrawing never goes past the sheath", () => {
    const l = moveLead(initialLead("rij"), -10).lead;
    expect(l.zone).toBe("svc");
    expect(l.pos).toBe(0);
  });
});

describe("capture threshold", () => {
  it("a wedged RV apex lead has an acceptable threshold (below 1 mA), even allowing for beat-to-beat variation", () => {
    for (const sc of [inferior, tavi, sinusArrest]) {
      const thr = captureThreshold(apexLead(), sc)!;
      expect(thr).toBeGreaterThan(0);
      expect(thr).toBeLessThan(ACCEPTABLE_THRESHOLD);
      expect(consistentThreshold(apexLead(), sc)!).toBeLessThan(ACCEPTABLE_THRESHOLD);
    }
  });

  it("threshold rises as tip contact falls, and is high when free in the cavity", () => {
    const wedged = apexLead();
    const light = moveLead(wedged, -1.2).lead; // still in the apex zone, less contact
    expect(light.zone).toBe("rv-apex");
    const free = moveLead(wedged, -2.5).lead; // back in the inflow
    expect(free.zone).toBe("rv-inflow");
    const t1 = captureThreshold(wedged, inferior)!;
    const t2 = captureThreshold(light, inferior)!;
    const t3 = captureThreshold(free, inferior)!;
    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });

  it("captures only when output is at or above threshold", () => {
    expect(captures(1.0, 0.5)).toBe(true);
    expect(captures(0.5, 0.5)).toBe(true);
    expect(captures(0.4, 0.5)).toBe(false);
    expect(captures(20, null)).toBe(false);
  });

  it("the default output is about 2.5 times the threshold, within the 2 to 3 times range", () => {
    expect(recommendedOutput(0.4)).toBeCloseTo(1.0, 5);
    expect(recommendedOutput(0.8)).toBeCloseTo(2.0, 5);
    for (const thr of [0.3, 0.5, 0.6, 0.9, 1.4]) {
      const out = recommendedOutput(thr);
      expect(out / thr).toBeGreaterThanOrEqual(OUTPUT_MARGIN.min);
      expect(out / thr).toBeLessThanOrEqual(OUTPUT_MARGIN.max);
    }
  });

  it("dial steps allow 0.1 mA threshold testing at low outputs", () => {
    expect(stepOutput(1.0, -1)).toBeCloseTo(0.9, 5);
    expect(stepOutput(2.0, 1)).toBeCloseTo(2.5, 5);
    expect(stepOutput(0.1, -1)).toBeCloseTo(0.1, 5);
    expect(stepSensitivity(2, 1)).toBe(2.5);
    expect(stepSensitivity(0.5, -1)).toBe(0.5);
  });
});

describe("rhythm engine: capture", () => {
  it("VVI above threshold paces the heart in CHB at the set rate with every spike capturing", () => {
    const s = createRhythm(inferior, 10);
    const c = ctx(inferior, apexLead(), { rate: 70, output: 3 });
    advanceRhythm(s, c, 3); // settle
    const t0 = nowOf(s);
    advanceRhythm(s, c, 12);
    const ev = eventsSince(s, t0);
    const spikes = ev.filter((e) => e.kind === "spike");
    const paced = ev.filter((e) => e.kind === "qrs" && e.origin === "paced");
    expect(spikes.length).toBeGreaterThanOrEqual(13);
    expect(spikes.every((e) => e.captured)).toBe(true);
    expect(paced.length).toBe(spikes.length);
    const n = pacingNumerics(s, c);
    expect(n.hr).toBeGreaterThanOrEqual(68);
    expect(n.hr).toBeLessThanOrEqual(72);
    expect(n.lossOfCapture).toBe(false);
  });

  it("output below threshold gives spikes without capture and the escape rhythm continues", () => {
    const lead = apexLead();
    const thr = captureThreshold(lead, inferior)!;
    const s = createRhythm(inferior, 10);
    const c = ctx(inferior, lead, { rate: 70, output: Math.max(0.1, thr - 0.2) });
    advanceRhythm(s, c, 3);
    const t0 = nowOf(s);
    advanceRhythm(s, c, 10);
    const ev = eventsSince(s, t0);
    const spikes = ev.filter((e) => e.kind === "spike");
    expect(spikes.length).toBeGreaterThan(5);
    expect(spikes.some((e) => e.captured)).toBe(false);
    expect(ev.some((e) => e.kind === "qrs" && e.origin === "escape")).toBe(true);
    expect(pacingNumerics(s, c).lossOfCapture).toBe(true);
  });

  it("captured beats raise the blood pressure compared with the slow escape", () => {
    const s1 = createRhythm(inferior, 10);
    const c1 = ctx(inferior, apexLead(), { connected: false });
    advanceRhythm(s1, c1, 10);
    const s2 = createRhythm(inferior, 10);
    const c2 = ctx(inferior, apexLead(), { output: 3 });
    advanceRhythm(s2, c2, 10);
    expect(pacingNumerics(s2, c2).map).toBeGreaterThan(pacingNumerics(s1, c1).map);
  });

  it("a lead in the coronary sinus captures the LV with an RBBB-pattern complex", () => {
    let l = initialLead("rij");
    l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra - 0.5).lead;
    l = rotateLead(l, 90);
    l = moveLead(l, 6.5).lead;
    expect(l.zone).toBe("cs");
    const s = createRhythm(inferior, 10);
    const c = ctx(inferior, l, { output: 10 });
    advanceRhythm(s, c, 6);
    const paced = s.events.filter((e) => e.kind === "qrs" && e.origin === "paced");
    expect(paced.length).toBeGreaterThan(0);
    expect(paced.every((e) => e.morph === "paced-lv")).toBe(true);
  });

  it("is deterministic", () => {
    const run = () => {
      const s = createRhythm(tavi, 10, 7);
      const c = ctx(tavi, apexLead(), { sensitivity: 1 }, { ...NO_FAULTS, noise: true });
      advanceRhythm(s, c, 8);
      return JSON.stringify(s.events.slice(-60));
    };
    expect(run()).toBe(run());
  });
});

describe("rhythm engine: sensing", () => {
  it("appropriate sensing inhibits the box while the intrinsic rhythm is faster than the back-up rate", () => {
    const s = createRhythm(sinusArrest, 10);
    const c = ctx(sinusArrest, apexLead(), { rate: 50, output: 3, sensitivity: 4 });
    advanceRhythm(s, c, 1);
    const t0 = nowOf(s);
    advanceRhythm(s, c, 5); // within a run of sinus rhythm the box should stay quiet
    const ev = eventsSince(s, t0);
    const sinusBeats = ev.filter((e) => e.kind === "qrs" && e.origin === "conducted");
    const spikes = ev.filter((e) => e.kind === "spike");
    const senses = ev.filter((e) => e.kind === "sense");
    expect(sinusBeats.length).toBeGreaterThan(2);
    // Only pauses can be paced; no spike should land on a T wave
    expect(spikes.every((e) => !e.onT)).toBe(true);
    expect(senses.length).toBeGreaterThanOrEqual(sinusBeats.length - 1);
  });

  it("undersensing (sensitivity number above the R wave) causes competitive pacing with spikes on T waves", () => {
    const lead = apexLead();
    const r = sensedSignals(lead, sinusArrest).r;
    const s = createRhythm(sinusArrest, 10);
    const c = ctx(sinusArrest, lead, { rate: 60, output: 3, sensitivity: Math.min(20, r + 2) });
    expect(assessSensing(c.box.sensitivity, sensedSignals(lead, sinusArrest)).undersensing).toBe(true);
    advanceRhythm(s, c, 30);
    const spikes = s.events.filter((e) => e.kind === "spike" && e.t > nowOf(s) - 15);
    expect(spikes.length).toBeGreaterThan(5);
    expect(spikes.some((e) => e.onT)).toBe(true);
    expect(s.events.some((e) => e.kind === "sense")).toBe(false);
  });

  it("noise oversensing inhibits pacing and produces a long pause; VOO keeps pacing through it", () => {
    const lead = apexLead();
    const faults: Faults = { ...NO_FAULTS, noise: true };
    const sVvi = createRhythm(tavi, 10);
    const cVvi = ctx(tavi, lead, { rate: 70, output: 3, sensitivity: 2 }, faults);
    advanceRhythm(sVvi, cVvi, 14);
    const n = pacingNumerics(sVvi, cVvi, 8);
    expect(n.longestPause).toBeGreaterThan(2.5);
    expect(sVvi.events.some((e) => e.kind === "sense")).toBe(true);

    const sVoo = createRhythm(tavi, 10);
    const cVoo = ctx(tavi, lead, { mode: "VOO", rate: 70, output: 3, sensitivity: 2 }, faults);
    advanceRhythm(sVoo, cVoo, 14);
    const nVoo = pacingNumerics(sVoo, cVoo, 8);
    expect(nVoo.longestPause).toBeLessThan(1.0);
  });

  it("raising the sensitivity number above the noise (but below the R wave) stops the inhibition", () => {
    const lead = apexLead();
    const faults: Faults = { ...NO_FAULTS, noise: true };
    const s = createRhythm(tavi, 10);
    const c = ctx(tavi, lead, { rate: 70, output: 3, sensitivity: 4 }, faults);
    advanceRhythm(s, c, 14);
    expect(pacingNumerics(s, c, 8).longestPause).toBeLessThan(1.0);
  });

  it("T-wave oversensing (sensitivity too low) slows the effective paced rate", () => {
    const lead = apexLead();
    const sig = sensedSignals(lead, tavi);
    const s = createRhythm(tavi, 10);
    const c = ctx(tavi, lead, { rate: 70, output: 3, sensitivity: 0.5 });
    expect(sig.tPaced).toBeGreaterThanOrEqual(0.5);
    advanceRhythm(s, c, 12);
    const n = pacingNumerics(s, c);
    expect(n.hr).toBeLessThan(65);
  });

  it("classifies sensing settings", () => {
    const sig = { r: 8, t: 1.4, tPaced: 1.8, p: 0.2, noise: 0 };
    expect(assessSensing(10, sig).status).toBe("undersensing");
    expect(assessSensing(1, sig).status).toBe("oversensing");
    const ok = assessSensing(4, sig);
    expect(ok.status).toBe("appropriate");
    expect(ok.margin).toBe(true);
    expect(assessSensing(6, sig).margin).toBe(false);
    expect(recommendedSensitivity(8)).toBe(4);
    expect(recommendedSensitivity(9)).toBe(4.5);
  });

  it("sensing cannot be tested safely in a pacing-dependent patient", () => {
    expect(sensingTestable(tavi)).toBe(false);
    expect(sensingTestable(sinusArrest)).toBe(true);
  });
});

describe("transcutaneous pacing", () => {
  it("below threshold produces artefact without capture and no arterial pulses from the spikes", () => {
    const s = createRhythm(tavi, 10);
    const c: PacingContext = {
      scenario: tavi,
      lead: initialLead("rij"),
      box: { mode: "OFF", rate: 70, output: 5, sensitivity: 2, connected: false },
      tcp: { on: true, rate: 70, current: tavi.tcpThreshold - 20, demand: true },
      faults: NO_FAULTS,
    };
    advanceRhythm(s, c, 10);
    const n = pacingNumerics(s, c);
    expect(n.tcpArtefactOnly).toBe(true);
    expect(n.hr).toBeLessThan(40);
  });

  it("at or above threshold captures and raises the rate", () => {
    const s = createRhythm(tavi, 10);
    const c: PacingContext = {
      scenario: tavi,
      lead: initialLead("rij"),
      box: { mode: "OFF", rate: 70, output: 5, sensitivity: 2, connected: false },
      tcp: { on: true, rate: 70, current: tavi.tcpThreshold + 10, demand: true },
      faults: NO_FAULTS,
    };
    advanceRhythm(s, c, 10);
    const n = pacingNumerics(s, c);
    expect(n.tcpCapture).toBe(true);
    expect(n.hr).toBeGreaterThan(60);
  });
});

describe("arterial line", () => {
  it("pressure decays during a long pause", () => {
    const s = createRhythm(sinusArrest, 10);
    const c = ctx(sinusArrest, apexLead(), { connected: false });
    // run until we are inside a pause (no QRS for > 3 s)
    let found = false;
    for (let i = 0; i < 400 && !found; i++) {
      advanceRhythm(s, c, 0.05);
      const last = [...s.events].reverse().find((e) => e.kind === "qrs");
      if (last && nowOf(s) - last.t > 3.5) found = true;
    }
    expect(found).toBe(true);
    const t = nowOf(s);
    expect(arterialAt(s, sinusArrest, t)).toBeLessThan(arterialAt(s, sinusArrest, t - 3));
  });
});

describe("troubleshooting faults", () => {
  it("displacement causes loss of capture until the lead is repositioned", () => {
    const lead = apexLead();
    const box: BoxSettings = { mode: "VVI", rate: 70, output: 2, sensitivity: 4, connected: true };
    const f = applyFault("displacement", inferior, lead, NO_FAULTS, box);
    expect(f.lead.zone).toBe("rv-inflow");
    expect(faultStatus("displacement", inferior, f.lead, f.faults, box).resolved).toBe(false);
    const fixed = moveLead(f.lead, 3).lead;
    expect(faultStatus("displacement", inferior, fixed, f.faults, box).resolved).toBe(true);
  });

  it("a threshold rise puts the threshold above the current output", () => {
    const lead = apexLead();
    const box: BoxSettings = { mode: "VVI", rate: 70, output: 2, sensitivity: 4, connected: true };
    const f = applyFault("threshold-rise", tavi, lead, NO_FAULTS, box);
    const thr = captureThreshold(lead, tavi, f.faults)!;
    expect(thr).toBeGreaterThan(box.output);
    const consistent = consistentThreshold(lead, tavi, f.faults)!;
    expect(faultStatus("threshold-rise", tavi, lead, f.faults, { ...box, output: Math.min(20, consistent * 2) }).resolved).toBe(true);
    expect(faultStatus("threshold-rise", tavi, lead, f.faults, { ...box, output: consistent }).resolved).toBe(false);
  });

  it("undersensing is fixed by lowering the sensitivity number below the new R wave", () => {
    const lead = apexLead();
    const box: BoxSettings = { mode: "VVI", rate: 60, output: 2, sensitivity: 4, connected: true };
    const f = applyFault("undersensing", inferior, lead, NO_FAULTS, box);
    const sig = sensedSignals(lead, inferior, f.faults);
    expect(sig.r).toBeLessThan(box.sensitivity);
    expect(faultStatus("undersensing", inferior, lead, f.faults, box).resolved).toBe(false);
    const fixedSens = Math.max(0.5, Math.floor(sig.r * 2) / 2 - 0.5);
    expect(faultStatus("undersensing", inferior, lead, f.faults, { ...box, sensitivity: fixedSens }).resolved).toBe(true);
  });

  it("the noise fault is always visible: it is sized to be sensed at the learner's current setting", () => {
    const lead = apexLead();
    for (const sens of [1, 2, 4, 6]) {
      const box: BoxSettings = { mode: "VVI", rate: 70, output: 2, sensitivity: sens, connected: true };
      const f = applyFault("noise-oversensing", tavi, lead, NO_FAULTS, box);
      const a = assessSensing(sens, sensedSignals(lead, tavi, f.faults));
      expect(a.noiseOversensing).toBe(true);
      expect(faultStatus("noise-oversensing", tavi, lead, f.faults, box).resolved).toBe(false);
    }
  });

  it("noise oversensing is fixed by reseating the connection", () => {
    const lead = apexLead();
    const box: BoxSettings = { mode: "VVI", rate: 70, output: 2, sensitivity: 2, connected: true };
    const f = applyFault("noise-oversensing", tavi, lead, NO_FAULTS, box);
    expect(faultStatus("noise-oversensing", tavi, lead, f.faults, box).resolved).toBe(false);
    expect(faultStatus("noise-oversensing", tavi, lead, { ...f.faults, noise: false }, box).resolved).toBe(true);
  });
});

describe("scoring", () => {
  it("a textbook run scores highly and a poor run scores low", () => {
    // the in-lab scenarios have their own scoring (in-lab tests below)
    for (const sc of PACING_SCENARIOS.filter((s) => !s.inLab)) {
      const lead = sc.fixedRoute ? initialLead(sc.fixedRoute) : apexLead();
      const thr = captureThreshold(lead, sc)!;
      const sig = sensedSignals(lead, sc);
      const good = scorePacing({
        scenarioId: sc.id,
        tcpUsed: true,
        tcpMechanicalChecked: true,
        access: sc.fixedRoute ?? "rij",
        finalZone: lead.zone,
        finalContact: leadInfo(lead).contact,
        lateralChecked: true,
        perforation: false,
        thresholdMeasured: thr,
        trueThreshold: thr,
        finalOutput: recommendedOutput(thr),
        finalRate: 70,
        finalSensitivity: recommendedSensitivity(sig.r),
        finalMode: "VVI",
        sensingMeasured: sig.r,
        sensingSkippedDependent: false,
        rWave: sig.r,
        tWave: sig.t,
        onTSpikes: 0,
        events: sc.events.map((k) => ({ kind: k, diagnosis: k === "undersensing" ? "undersensing" : k === "noise-oversensing" ? "oversensing" : "loss-of-capture", resolved: true, partial: false })),
      });
      expect(good.score).toBeGreaterThanOrEqual(90);

      const bad = scorePacing({
        scenarioId: sc.id,
        tcpUsed: false,
        tcpMechanicalChecked: false,
        access: "left-subclavian",
        finalZone: "rvot",
        finalContact: 0,
        lateralChecked: false,
        perforation: true,
        thresholdMeasured: null,
        trueThreshold: 3,
        finalOutput: 3,
        finalRate: 40,
        finalSensitivity: 20,
        finalMode: "VOO",
        sensingMeasured: null,
        sensingSkippedDependent: false,
        rWave: 5,
        tWave: 1,
        onTSpikes: 4,
        events: sc.events.map((k) => ({ kind: k, diagnosis: "normal", resolved: false, partial: false })),
      });
      expect(bad.score).toBeLessThan(30);
    }
  });
});
