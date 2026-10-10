import { describe, expect, it } from "vitest";
import { useSimulatorStore } from "../state/useSimulatorStore";
import { attachSimulatorStore } from "./bridge/simulatorStore";
import { ProcedureRecorder } from "./telemetry";
import { computeMetrics } from "./metrics";
import type { DiagnosticMetrics } from "./metrics";
import { findStartControls } from "./skillCards";
import { CASE_LIBRARY } from "../simulation/caseGenerator";

// With the lab shell's pedal imaging, the cine run is the cine pedal interval and the injection is timed
// inside it: pre-contrast filming becomes measurable (it was "not measurable" in the legacy coupling).
describe("store bridge with pedal imaging", () => {
  it("times the injection inside the cine run and grades pre-contrast filming", () => {
    const g = () => useSimulatorStore.getState();
    const c = CASE_LIBRARY[0];
    g().loadCase(c, "free");
    g().setPedalImaging(true);
    const start = findStartControls(c, g().catheterId, "selective-lm")!;
    g().commandInsertion(start.insertion - g().controls.cmdInsertion);
    g().commandTorque(start.torque - g().controls.cmdTorque);
    for (let i = 0; i < 120; i++) g().tick(0.033);
    const rec = new ProcedureRecorder({ id: "p", startedAt: 0, caseId: c.id, lab: "diagnostic", mode: "supervised", entrustment: 2, seed: c.id });
    let t = 0;
    const bridge = attachSimulatorStore(useSimulatorStore, rec, { wall: () => t });
    const run = (s: number) => {
      for (let i = 0; i < Math.round(s / 0.033); i++) {
        t += 0.033;
        g().tick(0.033);
        bridge.sample();
      }
    };
    // run 1: cine first, inject 0.6 s later, film the wash-out
    g().setPedal({ fluoro: false, cine: true });
    run(0.6);
    g().aspirate();
    g().inject();
    run(4);
    g().setPedal({ fluoro: false, cine: false });
    g().endBolus();
    run(1);
    // run 2: inject first, cine after (no pre-contrast frames)
    g().aspirate();
    g().inject();
    run(0.3);
    g().setPedal({ fluoro: false, cine: true });
    run(4);
    g().setPedal({ fluoro: false, cine: false });
    g().endBolus();
    bridge.detach();
    const r = rec.toRecord();
    const kinds = r.events.map((e) => e.kind);
    expect(kinds.filter((k) => k === "cine-start").length).toBe(2);
    expect(kinds.filter((k) => k === "cine-end").length).toBe(2);
    expect(kinds.filter((k) => k === "inject").length).toBe(2);
    const m = computeMetrics(r).metrics as DiagnosticMetrics;
    expect(m.cineRuns).toBe(2);
    const q = m.injectionQuality;
    expect(q[0].preContrastS).toBeGreaterThan(0.5);
    expect(q[0].preContrastOk).toBe(true);
    expect(q[1].preContrastOk).toBe(false);
    g().setPedalImaging(false);
  });
});
