// QA integration: the team and the sound (C4) and the continuous hand-over from the full case (C5)
// in the diagnostic lab session, the PCI lab's imaging clock, and the case session's return.
import { describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useProgressStore } from "../../state/useProgressStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { findStartControls } from "../../mentor/skillCards";
import { newCaseSession } from "../../simulation/session/caseSession";
import { LabImaging } from "../../render/xray/sceneBuilder";
import { FLUORO_SIGNAL_INTERVAL_S } from "../../simulation/dose";
import { DiagnosticLabSession, doseSince, seedDose, type LabStart } from "../sim/labSession";
import { LabTeam } from "./labTeam";

const g = () => useSimulatorStore.getState();
const routine = CASE_LIBRARY[0];

function seat() {
  const t = findStartControls(routine, g().catheterId, "selective-lm") ?? findStartControls(routine, g().catheterId, "selective-rca");
  if (!t) throw new Error("no start state");
  g().commandInsertion(t.insertion - g().controls.cmdInsertion);
  g().commandTorque(t.torque - g().controls.cmdTorque);
  for (let i = 0; i < 120; i++) g().tick(0.033);
}

function freeCase() {
  useProgressStore.setState({ activePolicy: null });
  g().loadCase(routine, "free");
  g().setPedalImaging(true);
}

/** Step the lab, the team answering and acting on the lab's own clock. */
function run(s: DiagnosticLabSession, seconds: number, dt = 1 / 30) {
  for (let t = 0; t < seconds - 1e-9; t += dt) s.step(dt);
}

describe("team and sound in the diagnostic lab (C4)", () => {
  it("every lab session has a team on the same patient engine, silent until a gesture unlocks the sound", () => {
    freeCase();
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    expect(s.crew).not.toBeNull();
    expect(s.crew!.patient).toBe(s.engine);
    // no audio context is created before a user gesture
    expect(s.crew!.audioEngine?.ctx ?? null).toBeNull();
    run(s, 1);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("a drug order is read back, confirmed, given to the lab's patient and recorded", () => {
    freeCase();
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    const seen: string[] = [];
    s.crew!.onEvents((ev) => ev.forEach((e) => seen.push(e.kind)));
    const act0 = s.engine.vitals().actTrue;
    s.crew!.team.command("Nurse, heparin 5,000 units IV");
    run(s, 4);
    const lines = s.crew!.team.st.utterances.map((u) => u.text.toLowerCase());
    expect(lines.some((l) => l.includes("heparin") && l !== "nurse, heparin 5,000 units iv")).toBe(true);
    s.crew!.team.command("correct");
    run(s, 40);
    expect(seen).toContain("team.drug-given");
    expect(s.engine.vitals().actTrue).toBeGreaterThan(act0 + 50);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("the radiographer's C-arm order drives the lab's C-arm and the store follows", () => {
    freeCase();
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    s.crew!.team.command("LAO 30 cranial 20");
    run(s, 2);
    s.crew!.team.command("correct");
    run(s, 25);
    expect(g().cArm.laoRao).toBeCloseTo(30, 0);
    expect(g().cArm.cranialCaudal).toBeCloseTo(20, 0);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("the team's report reaches the debrief and a silent lab (no audio engine) still runs", () => {
    freeCase();
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    const silent = new LabTeam({ seed: "qa", patient: s.engine, imaging: () => ({}), catheterSide: () => null, audioEngine: null });
    expect(silent.audio).toBeNull();
    silent.team.command("heparin 5000 units IV");
    for (let i = 0; i < 60; i++) silent.step(1 / 30);
    const r = silent.team.report();
    expect(r.orders).toBe(1);
    expect(r.lines.length).toBeGreaterThan(0);
    silent.dispose();
    s.dispose();
    g().setPedalImaging(false);
  });
});

describe("continuous hand-over from the full case (C5)", () => {
  it("the lab runs the case's own patient engine, carries the dose on and starts with the case's catheter", () => {
    freeCase();
    const { engine } = newCaseSession({ seed: "qa-handover", access: "radial-right" });
    const changes = g().score.catheterChanges;
    const start: LabStart = { engine, dose: { fluoroS: 310, karMGy: 40, kapGyCm2: 5 }, catheterId: "pigtail", air: { line: false, lumen: false } };
    const s = new DiagnosticLabSession(useSimulatorStore, null, start);
    expect(s.engine).toBe(engine);
    expect(g().catheterId).toBe("PIG");
    expect(g().score.catheterChanges).toBe(changes);
    // the dose display carries on (and the five-minute signal is not repeated for screening already done)
    expect(s.exposure.dose.totals.fluoroTimeS).toBeCloseTo(310, 6);
    expect(s.exposure.dose.totals.karMGy.total).toBeCloseTo(40, 6);
    expect(doseSince(s.exposure.dose, start.dose)).toEqual({ fluoroS: 0, karMGy: 0, kapGyCm2: 0 });
    // one clock: the lab advances the case's engine
    const t0 = engine.time;
    run(s, 2);
    expect(engine.time - t0).toBeCloseTo(2, 1);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("air left in the line goes down the coronary with the first selective injection, then clears", () => {
    freeCase();
    seat();
    const { engine } = newCaseSession({ seed: "qa-air", access: "radial-right" });
    const s = new DiagnosticLabSession(useSimulatorStore, null, { engine, air: { line: true, lumen: false } });
    const air0 = g().score.airEmbolisms;
    g().aspirate();
    expect(s.startInjection()).toBe(true);
    const selective = s.contrast !== null && s.contrast.plume !== "root" && !s.contrast.lv;
    s.releaseInjection();
    expect(selective).toBe(true);
    expect(g().score.airEmbolisms).toBe(air0 + 1);
    expect(g().events.some((e) => e.code === "air-embolism")).toBe(true);
    // the territory is ischaemic while the air clears
    run(s, 3);
    expect(Math.max(...Object.values(engine.vitals().ischaemia))).toBeGreaterThan(0);
    // a second injection carries no more air
    run(s, 8);
    const air1 = g().score.airEmbolisms;
    g().aspirate();
    s.startInjection();
    s.releaseInjection();
    expect(g().score.airEmbolisms).toBe(air1);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("the case clock catches up on return without living the lab time twice, and contrast is not counted twice", () => {
    const { session, engine } = newCaseSession({ seed: "qa-return", access: "radial-right" });
    const tS0 = session.tS;
    const tP0 = engine.time;
    // the lab ran 60 s on the same engine and gave 20 mL
    for (let i = 0; i < 600; i++) engine.advance(0.1);
    engine.contrast(20, "left");
    session.returnFromLab("diagnostic", { contrastMl: 0, fluoroS: 45, karMGy: 30, kapGyCm2: 3, durationS: engine.time - tP0, patientAdvanced: true });
    expect(engine.time - tP0).toBeCloseTo(60, 3);
    expect(session.tS - tS0).toBeCloseTo(60, 3);
    expect(session.pending).toBe(0);
    expect(session.totals.contrastMl).toBeCloseTo(engine.vitals().contrast.totalMl, 1);
    expect(session.totals.fluoroS).toBeCloseTo(45, 6);
  });

  it("seeded dose: the lab's own share is what it adds, and five-minute signals follow the total", () => {
    const L = new LabImaging({ seed: "qa" });
    seedDose(L.dose, { fluoroS: 2 * FLUORO_SIGNAL_INTERVAL_S + 10, karMGy: 12, kapGyCm2: 1.5 });
    expect(L.dose.totals.fluoroTimeS).toBeCloseTo(610, 6);
    expect(L.dose.snapshot().fluoroSignals).toBe(2);
    expect(doseSince(L.dose, { fluoroS: 610, karMGy: 12, kapGyCm2: 1.5 }).fluoroS).toBe(0);
  });
});

describe("PCI lab imaging on the patient engine's clock", () => {
  it("an engine-owned clock is advanced by the engine only (the image beats with the monitor)", () => {
    const { engine } = newCaseSession({ seed: "qa-clock", access: "radial-right" });
    const L = new LabImaging({ clock: engine.clock });
    const t0 = engine.clock.state().t;
    L.tick(1000);
    L.tick(2000);
    expect(engine.clock.state().t).toBe(t0);
    engine.advance(0.5);
    expect(engine.clock.state().t).toBeCloseTo(t0 + 0.5, 6);
    // a lab with its own clock keeps advancing it from wall time
    const own = new LabImaging({ seed: "qa" });
    const o0 = own.clock.state().t;
    own.tick(1000);
    own.tick(1500);
    expect(own.clock.state().t).toBeCloseTo(o0 + 0.5, 6);
  });
});
