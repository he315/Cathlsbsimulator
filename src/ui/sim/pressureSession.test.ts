// One pressure system in the diagnostic lab (diag-pressure-transducer): the store's pressure class
// and its scoring from the engine's tip state, side holes and ostial lesions in the tip input,
// aspiration outcomes and plugs, transducer faults, true hypotension, the aortic stenosis
// scenario, the physiologist's call-out, the tips the scenarios make appear, the practice index
// and the reachability of the waiting.ts entries naming this package.
//   npx vitest run src/ui/sim/pressureSession.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { scenarioCase } from "../../simulation/caseGenerator";
import { LAB_EVENTS, tipsFor } from "../../content/lab/tips";
import { WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { practiceForLesson } from "../content/practiceIndex";
import { diagScenarioById } from "../../simulation/diagnosticScenarios";
import { launch } from "../../simulation/diagnosticScenarios/pressure.launch";
import { pressureSetups, scenarios } from "../../simulation/diagnosticScenarios/pressure";
import { PatientEngine } from "../../simulation/patient/engine";
import type { EngagementState } from "../../types";
import { LabTeam, MP_CALLOUT_SYSTOLIC_MMHG } from "../lab/labTeam";
import { defaultSettings } from "../../input/settings";
import { DiagnosticLabSession, MP_FLUSH_HOLD_BEATS, MP_HARD_PULL, MP_SEVERE_AS_AVA_CM2, PRESSURE_SESSION_EVENTS, aspirationOutcome, engineOptionsForCase, ostialGapFactor } from "./labSession";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(id: string): DiagnosticLabSession {
  g().loadCase(scenarioCase(id)!, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
}
const run = (s: DiagnosticLabSession, seconds: number) => {
  for (let t = 0; t < seconds; t += 0.05) s.step(0.05);
};
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

/** Seat the catheter in the legacy classifier's terms (what the hands would give). */
function seat(kind: "selective-rca" | "deep-rca" | "selective-lm" | "sinus-level") {
  const right = kind.endsWith("rca");
  const e: Partial<EngagementState> = {
    kind,
    target: kind === "sinus-level" ? null : right ? "right" : "left",
    isSelective: kind !== "sinus-level",
    isDeep: kind === "deep-rca",
    conus: false,
    depth: kind === "deep-rca" ? 3 : 0,
    quality: 0.8,
  };
  useSimulatorStore.setState({ engagement: { ...g().engagement, ...e } as EngagementState });
}

describe("the store's pressure follows the engine's tip state", () => {
  it("diag-damping-causes: the JL4 seated on the ostial left main lesion damps the trace; the store's class, its deep-damping event and score follow the engine", () => {
    const s = session("diag-damping-causes");
    expect(g().catheterId).toBe("JL4");
    expect(g().score.catheterChanges).toBe(0);
    run(s, 2);
    expect(s.tipState).toBe("aortic");
    expect(g().pressure.kind).toBe("aortic");
    const damped0 = g().score.dampedEvents;
    seat("selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    expect(g().pressure.kind).toBe(s.tipState);
    expect(g().score.dampedEvents).toBe(damped0 + 1);
    expect(g().events.some((e) => e.code === "deep-engagement")).toBe(true);
    // backing out of the ostium frees the trace
    seat("sinus-level");
    run(s, 3);
    expect(s.tipState).toBe("aortic");
    expect(g().pressure.kind).toBe("aortic");
    s.dispose();
  });

  it("an injection while tipState is damped counts dangerousInjections, even after an aspiration that was judged clean", () => {
    const s = session("diag-damping-causes");
    seat("selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(g().pressure.kind);
    useSimulatorStore.setState({ aspirated: "clean" });
    const d0 = g().score.dangerousInjections;
    expect(s.startInjection()).toBe(true);
    s.releaseInjection();
    expect(g().score.dangerousInjections).toBeGreaterThan(d0);
    expect(g().events.some((e) => e.code === "damped-injection")).toBe(true);
    s.dispose();
  });

  it("without the ostial lesion the same seat gives a free trace (the lesion narrows the gap); outside the session the legacy classes stay", () => {
    expect(ostialGapFactor([{ vessel: "LM", position: 0.02, severity: 75 }], "left")).toBeCloseTo(0.0625, 6);
    expect(ostialGapFactor([{ vessel: "RCA", position: 0.02, severity: 70 }], "right")).toBeCloseTo(0.09, 6);
    expect(ostialGapFactor([{ vessel: "RCA", position: 0.4, severity: 90 }], "right")).toBe(1);
    expect(ostialGapFactor([{ vessel: "RCA", position: 0.02, severity: 70 }], "left")).toBe(1);
    const s = session("diag-aspiration-failures");
    s.setPlugged(false);
    s.sheathThrombus = false;
    seat("selective-rca");
    run(s, 3);
    expect(s.tipState).toBe("aortic");
    s.dispose();
    // a store without a session: computePressure as before
    g().loadCase(scenarioCase("diag-damping-causes")!, "free");
    expect(g()._enginePressure).toBeNull();
  });

  it("a side-hole JR4 keeps the trace aortic in the deep seat where the JR4 does not", () => {
    const s = session("diag-aspiration-failures");
    s.setPlugged(false);
    s.sheathThrombus = false;
    seat("deep-rca");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    g().setCatheter("JR4-SH");
    seat("deep-rca");
    run(s, 3);
    expect(s.engine.tipInput.sideHoles).toBe(true);
    expect(s.tipState).toBe("aortic");
    expect(g().pressure.kind).toBe("aortic");
    s.dispose();
  });
});

describe("aspiration outcomes and a plugged catheter", () => {
  it("aspirate with a plug returns 'no-return' and raises catheter-plugged, and a saline flush then sets an occlusion", () => {
    const s = session("diag-aspiration-failures");
    expect(s.plugged).toBe(true);
    expect(s.sheathThrombus).toBe(true);
    run(s, 1);
    seat("selective-rca");
    run(s, 2);
    const r = s.aspirate();
    expect(r?.outcome).toBe("plug");
    expect(g().aspirated).toBe("no-return");
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["catheter-plugged", "aspiration-failed"]));
    // the plugged catheter damps the trace the operator sees; the tip itself is free
    expect(s.activeEvents()).toContain("pressure-damped");
    expect(tipIds(s)).toContain("diag-damped-stepwise");
    expect(s.engine.snapshot().occlusions["plug-embolus"]).toBeUndefined();
    const d0 = g().score.dangerousInjections;
    // the saline flush at the manifold
    s.onSyringe({ port: "saline", force: 1 });
    s.onSyringe({ port: "saline", force: 0 });
    expect(s.plugged).toBe(false);
    expect(s.engine.snapshot().occlusions["plug-embolus"]).toMatchObject({ vessel: "RCA", fraction: 1 });
    expect(g().score.dangerousInjections).toBe(d0 + 1);
    s.dispose();
  });

  it("flushed with the tip in the aorta the plug causes a neurological deficit; a wire passed through it embolises it too", () => {
    const a = session("diag-aspiration-failures");
    a.flushCatheter();
    expect(a.activeEvents()).toContain("neuro-deficit");
    expect(a.engine.snapshot().occlusions["plug-embolus"]).toBeUndefined();
    a.dispose();
    const b = session("diag-aspiration-failures");
    run(b, 0.5);
    g().commandWire(5);
    run(b, 0.2);
    expect(b.plugged).toBe(false);
    expect(b.activeEvents()).toContain("neuro-deficit");
    b.dispose();
  });

  it("the remedy: remove under suction, aspirate the sheath, then the next catheter aspirates freely; skipping the sheath plugs it again", () => {
    const s = session("diag-aspiration-failures");
    s.removeUnderSuction();
    // the thrombus is still in the sheath: the fresh catheter picked it up
    expect(s.plugged).toBe(true);
    expect(s.aspirateView()).toMatchObject({ material: "thrombus", from: "catheter" });
    s.removeUnderSuction();
    expect(s.aspirateSheath()).toMatchObject({ material: "thrombus", from: "sheath" });
    expect(s.sheathThrombus).toBe(false);
    s.removeUnderSuction();
    expect(s.plugged).toBe(false);
    run(s, 2);
    expect(s.aspirate()?.outcome).toBe("free");
    expect(g().aspirated).toBe("clean");
    expect(s.aspirateView()).toMatchObject({ material: "blood" });
    // a sheath aspirated a second time gives blood only
    expect(s.aspirateSheath()?.material).toBe("blood");
    s.dispose();
  });

  it("against the wall: no return, freed by easing back; a hard pull draws air that raises 'air' and goes down with the next push", () => {
    expect(aspirationOutcome({ plugged: false, tipState: "damped", engagement: null, cram: 0, pull: 0.3 })).toBe("wall");
    expect(aspirationOutcome({ plugged: false, tipState: "aortic", engagement: null, cram: 0, pull: 1 })).toBe("free");
    expect(aspirationOutcome({ plugged: false, tipState: "lv", engagement: { kind: "in-lv", isDeep: false, conus: false }, cram: 0, pull: 1 })).toBe("free");
    expect(aspirationOutcome({ plugged: true, tipState: "aortic", engagement: null, cram: 0, pull: 0.2 })).toBe("plug");
    const s = session("diag-damping-causes");
    seat("selective-lm");
    run(s, 3);
    expect(s.aspirate(0.3)?.outcome).toBe("wall");
    expect(s.aspirateView()?.material).toBe("none");
    expect(s.activeEvents()).toContain("aspiration-failed");
    expect(s.activeEvents()).not.toContain("catheter-plugged");
    // the hand on the syringe: a gentle draw gives nothing, pulling harder draws air in
    s.onSyringe({ port: "aspirate", force: -0.2 });
    expect(g().lastAspiration?.outcome).toBe("wall");
    expect(s.activeEvents()).not.toContain("air");
    s.onSyringe({ port: "aspirate", force: -0.9 });
    expect(g().lastAspiration?.outcome).toBe("air");
    expect(s.activeEvents()).toContain("air");
    s.onSyringe({ port: "aspirate", force: 0 });
    seat("sinus-level");
    run(s, 3);
    expect(s.aspirate()?.outcome).toBe("free");
    // the air drawn in goes with the next push into an engaged coronary
    seat("selective-lm");
    run(s, 2);
    const a0 = g().score.airEmbolisms;
    s.startInjection();
    s.releaseInjection();
    expect(g().score.airEmbolisms).toBeGreaterThan(a0);
    s.dispose();
  });
});

describe("review fixes: the keyboard's pull, held contrast, the suction log and dispose", () => {
  it("holding the aspirate key (a ramp to the keyboard's full pull) against a blocked catheter gives no return, not air", () => {
    expect(MP_HARD_PULL).toBeGreaterThan(defaultSettings().keyboard.plungerForce);
    const s = session("diag-damping-causes");
    seat("selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    const full = defaultSettings().keyboard.plungerForce;
    for (let i = 1; i <= 10; i++) {
      s.onSyringe({ port: "aspirate", force: -(full * i) / 10 });
      s.step(0.05);
    }
    expect(g().lastAspiration?.outcome).toBe("wall");
    expect(s.activeEvents()).not.toContain("air");
    s.onSyringe({ port: "aspirate", force: 0 });
    s.dispose();
  });

  it("two pushes 2 s apart into a damped trace (the JL4 on the ostial left main lesion) book the contrast of both", () => {
    g().setPedalImaging(true); // the syringe books what it delivers
    const s = session("diag-damping-causes");
    expect(g().contrastSource).toBe("syringe");
    seat("selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    useSimulatorStore.setState({ aspirated: "clean" });
    const v0 = g().score.contrastVolume;
    const ml0 = s.injector.stats.totalMl;
    s.startInjection();
    run(s, 0.6);
    s.releaseInjection();
    run(s, 1.4);
    s.startInjection();
    run(s, 0.6);
    s.releaseInjection();
    // the second push is held too; easing back frees the tip and the contrast clears
    seat("sinus-level");
    run(s, 8);
    expect(s.injector.active).toBe(false);
    const delivered = s.injector.stats.totalMl - ml0;
    expect(s.injector.stats.injections).toBeGreaterThanOrEqual(2);
    expect(delivered).toBeGreaterThan(0);
    expect(g().score.contrastVolume - v0).toBeCloseTo(delivered, 6);
    s.dispose();
  });

  it("a push held by an obstructing tip is booked when the catheter is flushed or removed under suction", () => {
    g().setPedalImaging(true);
    for (const how of ["flush", "suction"] as const) {
      const s = session("diag-damping-causes");
      seat("selective-lm");
      run(s, 3);
      useSimulatorStore.setState({ aspirated: "clean" });
      const v0 = g().score.contrastVolume;
      const ml0 = s.injector.stats.totalMl;
      s.startInjection();
      run(s, 0.6);
      s.releaseInjection();
      run(s, 5);
      expect(s.contrast, how).not.toBeNull();
      if (how === "flush") s.flushCatheter();
      else s.removeUnderSuction();
      const delivered = s.injector.stats.totalMl - ml0;
      expect(delivered, how).toBeGreaterThan(0);
      expect(g().score.contrastVolume - v0, how).toBeCloseTo(delivered, 6);
      s.dispose();
    }
  });

  it("removal under suction is logged as a removal, not as an aspiration", () => {
    const s = session("diag-aspiration-failures");
    s.removeUnderSuction();
    const msgs = g().events.map((e) => e.message);
    expect(msgs).toContain("Catheter removed under suction: thrombus on the gauze.");
    expect(msgs).not.toContain("Aspiration: no blood return.");
    expect(g().lastAspiration).toMatchObject({ via: "suction-removal", material: "thrombus" });
    s.dispose();
  });

  it("dispose hands the store back to its legacy pressure classes", () => {
    const s = session("diag-damping-causes");
    run(s, 1);
    expect(g()._enginePressure).not.toBeNull();
    const e0 = g().events.length;
    s.dispose();
    expect(g()._enginePressure).toBeNull();
    expect(g().events.length).toBe(e0);
  });
});

describe("transducer faults, true hypotension and aortic stenosis", () => {
  it("diag-transducer-faults: air in the line from the start raises transducer-fault and a damped trace with the tip free; the drawer shows the damping steps (check the transducer)", () => {
    const s = session("diag-transducer-faults");
    run(s, 2);
    expect(s.engine.transducer.faults()).toEqual(["air-bubble"]);
    expect(s.tipState).toBe("aortic");
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["transducer-fault", "pressure-damped"]));
    expect(tipIds(s)).toContain("diag-damped-stepwise");
    // the monitor's remedy: re-prime, and the line is clean again
    s.engine.transducer.reprime();
    run(s, 1);
    expect(s.engine.transducer.faults()).toEqual([]);
    s.dispose();
  });

  it("true hypotension with the tip free raises hypotension; the physiologist calls out a displayed systolic below 90 once per episode", () => {
    const s = session("diag-damping-causes");
    run(s, 1);
    expect(s.activeEvents()).not.toContain("hypotension");
    s.engine.setVasodilation(0.85);
    run(s, 25);
    expect(s.engine.vitals().aortaTrue.sys).toBeLessThan(90);
    expect(s.tipState).toBe("aortic");
    expect(s.activeEvents()).toContain("hypotension");
    s.dispose();

    const e = new PatientEngine({ seed: "callout" });
    e.setTip({ location: "aorta" });
    const crew = new LabTeam({ seed: "callout", patient: e, imaging: () => ({ fluoroPps: 15, cinePps: 15, fieldCm: 25, fluoroLevel: "normal", fluoroMin: 0 }), catheterSide: () => null, audioEngine: null, systolicCallout: true });
    const said = () => crew.team.st.utterances.filter((u) => u.speaker === "physiologist" && /^Systolic's down to/.test(u.text));
    for (let i = 0; i < 40; i++) {
      e.advance(0.1);
      crew.step(0.1);
    }
    expect(said()).toHaveLength(0);
    e.setVasodilation(0.85);
    for (let i = 0; i < 400; i++) {
      e.advance(0.1);
      crew.step(0.1);
    }
    expect(e.vitals().art!.sys).toBeLessThan(MP_CALLOUT_SYSTOLIC_MMHG);
    expect(said()).toHaveLength(1);
    crew.dispose();
    // off by default: the other labs are unchanged
    const quiet = new LabTeam({ seed: "callout", patient: e, imaging: () => ({ fluoroPps: 15, cinePps: 15, fieldCm: 25, fluoroLevel: "normal", fluoroMin: 0 }), catheterSide: () => null, audioEngine: null });
    for (let i = 0; i < 60; i++) {
      e.advance(0.1);
      quiet.step(0.1);
    }
    expect(quiet.team.st.utterances.some((u) => /^Systolic's down to/.test(u.text))).toBe(false);
    quiet.dispose();
  });

  it("diag-as-pulse-not-damping: the engine's valve is narrowed, the case holds aortic-stenosis, and an engaged trace stays 'aortic'; a chart's severe AS narrows the valve too", () => {
    const s = session("diag-as-pulse-not-damping");
    expect(s.engine.aorticValveAreaCm2).toBe(pressureSetups["diag-as-pulse-not-damping"].aorticValveAreaCm2);
    expect(s.tipContext().events).toContain("aortic-stenosis");
    seat("selective-lm");
    run(s, 3);
    expect(s.tipState).toBe("aortic");
    expect(g().pressure.kind).toBe("aortic");
    expect(s.activeEvents()).not.toContain("pressure-damped");
    s.dispose();
    const opts = engineOptionsForCase(scenarioCase("diag-contrast-sensitive")!) as { profile: { aorticValveAreaCm2?: number } };
    expect(opts.profile.aorticValveAreaCm2).toBe(MP_SEVERE_AS_AVA_CM2);
    const none = engineOptionsForCase(scenarioCase("diag-damping-causes")!) as { profile: { aorticValveAreaCm2?: number } };
    expect(none.profile.aorticValveAreaCm2).toBeUndefined();
  });

  it("contrast held in the vessel by an obstructing tip raises contrast-hold-up after 4 s and clears once the tip is free", () => {
    const s = session("diag-damping-causes");
    seat("selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    useSimulatorStore.setState({ aspirated: "clean" });
    s.startInjection();
    run(s, 0.6);
    s.releaseInjection();
    run(s, 6);
    // the push refluxed against the obstructing tip and the contrast is still in the vessel
    expect(s.contrast).not.toBeNull();
    expect(s.activeEvents()).toContain("contrast-hold-up");
    seat("sinus-level");
    run(s, 3);
    expect(s.contrast).toBeNull();
    s.dispose();
  });
});

describe("in-app verification fixes: the start seat, the resting rate and the flush artefact", () => {
  it("diag-transducer-faults and diag-as-pulse-not-damping open with the JL4 free in the root, parked as diag-damping-causes is", () => {
    const parked = (id: string) => {
      const s = session(id);
      run(s, 1);
      const kind = g().engagement?.kind;
      const insertion = g().controls.insertion;
      s.dispose();
      return { kind, insertion };
    };
    const ref = parked("diag-damping-causes");
    for (const id of ["diag-transducer-faults", "diag-as-pulse-not-damping"]) {
      expect(pressureSetups[id].parkedInsertion).toBe(pressureSetups["diag-damping-causes"].parkedInsertion);
      const p = parked(id);
      expect(p.kind).not.toBe("coaxial-lm");
      expect(p.kind).toBe(ref.kind);
      expect(p.insertion).toBeCloseTo(ref.insertion, 6);
    }
  });

  it("diag-transducer-faults: the patient's resting rate is the setup's, and no bradycardia is raised before any injection", () => {
    const opts = engineOptionsForCase(scenarioCase("diag-transducer-faults")!) as { profile: { baseline: { hr: number } } };
    expect(opts.profile.baseline.hr).toBe(pressureSetups["diag-transducer-faults"].heartRateBpm);
    const s = session("diag-transducer-faults");
    run(s, 20);
    expect(s.engine.vitals().hr!).toBeGreaterThanOrEqual(50);
    expect(s.activeEvents()).not.toContain("bradycardia");
    s.dispose();
  });

  it("a fast flush: the monitor shows the square wave, but the store's numbers hold their last values until the beat window has cleared", () => {
    const s = session("diag-damping-causes");
    run(s, 6);
    const before = g().pressure.systolic;
    expect(before).toBeGreaterThan(0);
    s.engine.transducer.fastFlush();
    let storeMax = 0;
    let engineMax = 0;
    for (let t = 0; t < 2.5; t += 0.05) {
      s.step(0.05);
      storeMax = Math.max(storeMax, g().pressure.systolic);
      engineMax = Math.max(engineMax, s.engine.vitals().art?.sys ?? 0);
    }
    // the artefact is in the engine's numerics (the monitor) but not in the store's
    expect(engineMax).toBeGreaterThan(before + 30);
    expect(storeMax).toBe(before);
    // once the hold has passed the store follows the engine again
    const hr = s.engine.vitals().hr ?? 60;
    run(s, (MP_FLUSH_HOLD_BEATS + 2) * (60 / hr));
    expect(Math.abs(g().pressure.systolic - Math.round(s.engine.vitals().art!.sys))).toBeLessThanOrEqual(1);
    expect(g().pressure.systolic).toBeLessThan(before + 30);
    s.dispose();
  });
});

describe("tips, the practice index and reachability", () => {
  it("in scenario diag-damping-causes, after the action that raises 'pressure-damped', tipsFor(ctx, 20) includes diag-damped-stepwise, and after the action that raises 'pressure-ventricularised' it includes diag-ventricularised-stay-out", () => {
    const s = session("diag-damping-causes");
    run(s, 2);
    expect(s.tipContext().events).not.toContain("pressure-damped");
    expect(tipIds(s)).not.toContain("diag-damped-stepwise");
    // the JL4 enters the ostium across the ostial left main lesion: the trace damps
    seat("selective-lm");
    run(s, 3);
    expect(s.tipContext().events).toContain("pressure-damped");
    expect(tipIds(s)).toContain("diag-damped-stepwise");
    // eased back to the sinus, the trace is free again
    seat("sinus-level");
    run(s, 3);
    expect(s.tipContext().events).not.toContain("pressure-damped");
    expect(s.tipContext().events).not.toContain("pressure-ventricularised");
    // a JR4 for the right: it dives deep into the RCA, and the trace ventricularises
    g().setCatheter("JR4");
    run(s, 0.5);
    seat("deep-rca");
    run(s, 3);
    expect(s.tipState).toBe("ventricularised");
    expect(s.tipContext().events).toContain("pressure-ventricularised");
    expect(tipIds(s)).toContain("diag-ventricularised-stay-out");
    s.dispose();
  });

  it("practiceIndex lists diag-damping-causes, diag-aspiration-failures, diag-transducer-faults under pm-engaging-trace, pm-engaging-damping, pm-to-the-root-advance (from pressure.launch.ts)", () => {
    const cathlab = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(cathlab("pm-engaging-trace")).toEqual(expect.arrayContaining(["diag-damping-causes", "diag-transducer-faults", "diag-as-pulse-not-damping"]));
    expect(cathlab("pm-engaging-damping")).toEqual(expect.arrayContaining(["diag-damping-causes", "diag-aspiration-failures"]));
    expect(cathlab("pm-to-the-root-advance")).toContain("diag-aspiration-failures");
    expect(cathlab("hb-specific-conditions-as")).toContain("diag-as-pulse-not-damping");
    for (const sc of launch.scenarios ?? []) for (const l of sc.lessonIds) expect(cathlab(l), `${sc.id} under ${l}`).toContain(sc.id);
    // the pack and its launch file agree, and the registry holds the pack
    expect(scenarios.map((x) => x.id)).toEqual((launch.scenarios ?? []).map((x) => x.id));
    for (const sc of scenarios) expect(diagScenarioById(sc.id)).toBe(sc);
    for (const id of Object.keys(pressureSetups)) expect(diagScenarioById(id), id).toBeDefined();
  });

  it("every event the session raises is in the shared vocabulary; every waiting.ts entry naming diag-pressure-transducer is satisfiable (there are none)", () => {
    for (const e of PRESSURE_SESSION_EVENTS) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-pressure-transducer").flatMap((w) => w.tips);
    expect(mine).toEqual([]);
  });
});
