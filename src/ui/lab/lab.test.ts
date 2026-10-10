import { describe, expect, it, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useProgressStore } from "../../state/useProgressStore";
import { useSeriesStore, RunRecorder, FluoroLoop, SERIES_BUDGET_BYTES, STORE_PX, type StoredSeries } from "../../state/useSeriesStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { findStartControls } from "../../mentor/skillCards";
import { resolveLabPolicy, labScreens, pciSimMode, type ProgressLike } from "./visibility";
import { resolveRunPolicy } from "./labRun";
import { visibilityFor } from "../../mentor/visibility";
import { DiagnosticLabSession } from "../sim/labSession";
import { LabScreen } from "../sim/Simulator";
import type { AssessmentMode } from "../../mentor/types";

const g = () => useSimulatorStore.getState();
// server rendering reads a store's initial state unless it has getServerState: render the live state instead
for (const st of [useSimulatorStore, useSeriesStore, useProgressStore]) (st as unknown as { getServerState: () => unknown }).getServerState = () => st.getState();
const routine = CASE_LIBRARY[0];

/** Seat the catheter selectively on the left main (the ground truth the screens must not show). */
function seat() {
  const t = findStartControls(routine, g().catheterId, "selective-lm") ?? findStartControls(routine, g().catheterId, "selective-rca");
  if (!t) throw new Error("no start state");
  g().commandInsertion(t.insertion - g().controls.cmdInsertion);
  g().commandTorque(t.torque - g().controls.cmdTorque);
  for (let i = 0; i < 120; i++) g().tick(0.033);
}

function loadAs(mode: AssessmentMode) {
  if (mode === "exam") {
    useProgressStore.setState({ activePolicy: null });
    g().loadCase(routine, "exam");
  } else {
    useProgressStore.setState({ activePolicy: { epa: "lca-engage", caseId: routine.id, mode, entrustment: 2, visibility: visibilityFor(mode, 2) } });
    g().loadCase(routine, "case");
  }
}

describe("lab policy", () => {
  beforeEach(() => useProgressStore.setState({ activePolicy: null }));

  it("exam mode, a launch's active policy, the level in force and tutorials", () => {
    const exam = resolveLabPolicy("exam", routine.id, { activePolicy: null, profile: { entrustment: {} } });
    expect(exam.mode).toBe("exam");
    expect(exam.visibility.overlays.toggleable).toBe(false);
    expect(exam.visibility.hints).toBe("off");
    const active = resolveLabPolicy("case", "x1", { activePolicy: { epa: "rca-engage", caseId: "x1", mode: "supervised", entrustment: 3, visibility: visibilityFor("supervised", 3) }, profile: { entrustment: {} } });
    expect(active.source).toBe("active");
    expect(active.mode).toBe("supervised");
    // another case: the level in force for the case's EPA (none yet: guided)
    const lvl = resolveLabPolicy("free", "random-xyz", { activePolicy: { epa: "rca-engage", caseId: "x1", mode: "supervised", entrustment: 3, visibility: visibilityFor("supervised", 3) }, profile: { entrustment: {} } });
    expect(lvl.source).toBe("level");
    expect(lvl.mode).toBe("guided");
    expect(lvl.epa).toBe("diag-study");
    const lv3 = resolveLabPolicy("free", "random-xyz", { activePolicy: null, profile: { entrustment: { "diag-study": { effective: 3 } as never } } });
    expect(lv3.mode).toBe("supervised");
    const tut = resolveLabPolicy("tutorial-lm", "t", null);
    expect(tut.mode).toBe("guided");
    expect(tut.entrustment).toBe(1);
  });

  it("the lab screens never show state chips, a coach line, live scores or traps; the drawer is guided only", () => {
    for (const m of ["guided", "supervised", "independent", "exam"] as const) {
      const s = labScreens({ mode: m, entrustment: 1, visibility: visibilityFor(m, 1), source: "level" });
      expect(s.stateChips || s.coachLine || s.liveScores || s.traps).toBe(false);
      expect(s.attendingDrawer).toBe(m === "guided");
      expect(s.teachingAids).toBe(m === "guided");
    }
  });

  it("exam mode loads with overlays off and they cannot be switched on", () => {
    loadAs("exam");
    const o = g().overlays;
    expect(o.labels || o.ostia || o.valvePlane || o.transparent).toBe(false);
    g().toggleOverlay("labels");
    g().toggleOverlay("transparent");
    expect(g().overlays.labels).toBe(false);
    expect(g().overlays.transparent).toBe(false);
    // hints are off in exams
    g().hint();
    expect(g().hintsUsed).toBe(0);
  });
});

describe("lab render: no ground truth on the screens", () => {
  it("renders the full lab in every mode without the engagement state, coach text, scores or meters", () => {
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      loadAs(mode);
      g().setPedalImaging(true);
      seat();
      const eng = g().engagement;
      expect(eng.isSelective).toBe(true);
      const session = new DiagnosticLabSession(useSimulatorStore, null);
      const html = renderToString(createElement(LabScreen, { session, input: null, title: "Cath lab" }));
      session.dispose();
      // the lab is there: monitors, haemodynamic monitor, dose, table, controls
      for (const k of ["Live monitor", "Reference monitor", "Table-side controls", "Fluoro", "Cine"]) expect(html).toContain(k);
      // nothing that names the tip's state or scores the operator
      expect(html).not.toContain(eng.kind);
      expect(html).not.toContain(eng.message);
      for (const banned of ["Engaged", "Pressure clean", "RESISTANCE", "TORQUE WHIP", "TIP IN LV", "Overall", "Efficiency", "Watch out for", "Coach"]) expect(html).not.toContain(banned);
      for (const t of routine.traps) expect(html).not.toContain(t);
      // the attending drawer (collapsed until opened) only in guided practice; the exam chip in exams
      expect(html.includes(">Attending</button>"), mode).toBe(mode === "guided");
      expect(html.includes('aria-label="Attending"'), mode).toBe(false);
      // hints: none in exams
      expect(html.includes("Ask the attending"), mode).toBe(mode === "supervised" || mode === "independent");
      if (mode === "exam") expect(html).toContain("Exam");
    }
    g().setPedalImaging(false);
  });
});

describe("pedal imaging in the store", () => {
  beforeEach(() => {
    useProgressStore.setState({ activePolicy: null });
    g().loadCase(routine, "free");
    g().setPedalImaging(true);
  });

  it("fluoroscopy time counts the fluoroscopy pedal only; cine is counted apart", () => {
    g().setPedal({ fluoro: true, cine: false });
    for (let i = 0; i < 30; i++) g().tick(0.1);
    g().setPedal({ fluoro: false, cine: true });
    for (let i = 0; i < 20; i++) g().tick(0.1);
    g().setPedal({ fluoro: false, cine: false });
    for (let i = 0; i < 20; i++) g().tick(0.1);
    expect(g().fluoroTime).toBeCloseTo(3, 6);
    expect(g().cineTime).toBeCloseTo(2, 6);
    expect(g().cineRuns).toBe(1);
  });

  it("an injection without cine is not a diagnostic run (and is noted); filming it counts", () => {
    seat();
    g().aspirate();
    g().inject();
    expect(g().score.diagnosticInjections).toBe(0);
    expect(g().bolus?.filmed).toBe(false);
    // the store holds the bolus until the lab ends it
    for (let i = 0; i < 100; i++) g().tick(0.1);
    expect(g().bolus).not.toBeNull();
    g().endBolus();
    expect(g().unfilmedInjections).toBe(1);
    expect(g().events.some((e) => /no cine running/.test(e.message))).toBe(true);
    // second injection, cine pedal pressed while the contrast is in: counted
    g().aspirate();
    g().inject();
    g().setPedal({ fluoro: false, cine: true });
    expect(g().score.diagnosticInjections).toBe(1);
    g().setPedal({ fluoro: false, cine: false });
    g().endBolus();
    expect(g().unfilmedInjections).toBe(1);
  });

  it("contrast comes from the syringe, not a fixed estimate", () => {
    seat();
    g().aspirate();
    g().inject();
    expect(g().score.contrastVolume).toBe(0);
    g().bookContrast(6.1);
    expect(g().score.contrastVolume).toBeCloseTo(6.1, 9);
  });
});

describe("the rhythm belongs to the patient engine (diag-rhythm-haemodynamic-events)", () => {
  /** Ride the tip up into the conus in the legacy classifier's terms. */
  const conus = () => useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true, isDeep: false, conus: true }, aspirated: "clean" });

  beforeEach(() => {
    useProgressStore.setState({ activePolicy: null });
    g().loadCase(routine, "free");
  });

  it("a headless store keeps its legacy rule: a conus injection fibrillates at once", () => {
    expect(g()._rhythmOwner).toBeNull();
    conus();
    g().inject();
    expect(g().arrhythmia).toBe("vf");
    expect(g().events.some((e) => e.code === "vf-arrest")).toBe(true);
  });

  it("with a lab session attached, a conus injection is a dangerous injection and the store does not fibrillate by itself; the engine's VF reaches it through engineArrhythmia", () => {
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
    expect(g()._rhythmOwner).not.toBeNull();
    conus();
    const dangerous0 = g().score.dangerousInjections;
    g().inject();
    expect(g().arrhythmia).toBe("none");
    expect(g().score.dangerousInjections).toBe(dangerous0 + 1);
    expect(g().events.some((e) => e.code === "damped-injection" && /conus/.test(e.message))).toBe(true);
    expect(g().events.some((e) => e.code === "vf-arrest")).toBe(false);
    // the engine fibrillates: the store follows with the vf-arrest event and the arrhythmia count
    const arr0 = g().score.arrhythmias;
    s.engine.forceRhythm("vf", "test");
    for (let i = 0; i < 10; i++) s.step(0.05);
    expect(g().arrhythmia).toBe("vf");
    expect(g().score.arrhythmias).toBe(arr0 + 1);
    expect(g().events.filter((e) => e.code === "vf-arrest")).toHaveLength(1);
    // the hub's legacy button clears the store, but the patient is still in VF: the store follows the patient
    g().defibrillate();
    for (let i = 0; i < 10; i++) s.step(0.05);
    expect(g().arrhythmia).toBe("vf");
    s.dispose();
    // released on dispose: the headless rule is back
    expect(g()._rhythmOwner).toBeNull();
  });

  it("a later session's claim is not released by an earlier session's dispose", () => {
    const a = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
    const owner = g()._rhythmOwner;
    const b = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
    expect(g()._rhythmOwner).not.toBe(owner);
    a.dispose();
    expect(g()._rhythmOwner).not.toBeNull();
    b.dispose();
    expect(g()._rhythmOwner).toBeNull();
  });
});

describe("lab session: pedals, runs, store fluoro, injection", () => {
  it("records a cine run as a series with frames, dose and contrast; no pedal, no frames", () => {
    useProgressStore.setState({ activePolicy: null });
    g().loadCase(routine, "free");
    g().setPedalImaging(true);
    useSeriesStore.getState().clear();
    seat();
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    const frame = () => new Uint8Array(STORE_PX * STORE_PX).fill(128);
    // pedal up: the lab exposes nothing (FluoroView only calls onExposedFrame with a pedal down)
    for (let i = 0; i < 30; i++) s.step(1 / 30);
    expect(s.run).toBeNull();
    // cine: run open, frames in, inject during the run
    s.setPedal({ fluoro: false, cine: true });
    expect(s.run).not.toBeNull();
    for (let i = 0; i < 10; i++) {
      s.onExposedFrame(frame(), "cine");
      s.step(1 / 15);
    }
    g().aspirate();
    expect(s.startInjection()).toBe(true);
    for (let i = 0; i < 20; i++) {
      s.onExposedFrame(frame(), "cine");
      s.step(1 / 15);
    }
    s.releaseInjection();
    for (let i = 0; i < 30; i++) {
      s.onExposedFrame(frame(), "cine");
      s.step(1 / 15);
    }
    s.setPedal({ fluoro: false, cine: false });
    const runs = useSeriesStore.getState().series;
    expect(runs.length).toBe(1);
    expect(runs[0].kind).toBe("cine");
    expect(runs[0].frames.length).toBe(60);
    expect(runs[0].durationS).toBeCloseTo(60 / 15, 9);
    expect(runs[0].injected).toBe(true);
    expect(runs[0].contrastMl).toBeGreaterThan(0.5);
    // the reference monitor shows the newest run
    expect(useSeriesStore.getState().selectedId).toBe(runs[0].id);
    // the run was filmed while the contrast was in: one diagnostic run
    expect(g().score.diagnosticInjections).toBe(1);
    // the syringe's volume reaches the store once the contrast has cleared
    for (let i = 0; i < 120; i++) s.step(1 / 15);
    expect(g().bolus).toBeNull();
    expect(g().score.contrastVolume).toBeGreaterThan(0.5);
    // fluoroscopy frames go to the loop; store fluoro makes a run
    s.setPedal({ fluoro: true, cine: false });
    for (let i = 0; i < 15; i++) {
      s.onExposedFrame(frame(), "fluoro");
      s.step(1 / 15);
    }
    s.setPedal({ fluoro: false, cine: false });
    const f = s.storeFluoro();
    expect(f?.kind).toBe("fluoro");
    expect(f?.frames.length).toBe(15);
    expect(useSeriesStore.getState().series.length).toBe(2);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("the beam waits for the time-out when the policy requires one", () => {
    g().loadCase(routine, "free");
    g().setPedalImaging(true);
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    let done = false;
    s.beamGate = () => done;
    s.setPedal({ fluoro: true, cine: false });
    expect(g().pedal.fluoro).toBe(false);
    done = true;
    s.setPedal({ fluoro: true, cine: false });
    expect(g().pedal.fluoro).toBe(true);
    s.dispose();
    g().setPedalImaging(false);
  });

  it("C-arm memories drive the store's angles over physical time", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null);
    s.driveMemory(1); // LAO 40
    s.step(0.5);
    expect(g().cArm.laoRao).toBeGreaterThan(0);
    expect(g().cArm.laoRao).toBeLessThan(10);
    for (let i = 0; i < 300; i++) s.step(1 / 60);
    expect(g().cArm.laoRao).toBeCloseTo(40, 6);
    s.dispose();
  });
});

describe("series store", () => {
  it("releases the oldest runs' frames beyond the memory budget", () => {
    useSeriesStore.getState().clear();
    const per = STORE_PX * STORE_PX;
    const framesPerRun = Math.ceil(SERIES_BUDGET_BYTES / per / 2) + 10;
    const mk = (n: number): StoredSeries => {
      const r = new RunRecorder({ id: `r${n}`, number: n, kind: "cine", caseId: "c", startedAt: n, fps: 15, cArm: { laoRao: 0, cranialCaudal: 0 }, fieldCm: 25, mmPerPxIso: 0.35, catheterId: "JL4", karMGy0: 0, kapGyCm20: 0, contrastMl0: 0 });
      for (let i = 0; i < framesPerRun; i++) r.push(new Uint8Array(per));
      return r.finish({ cArm: { laoRao: 0, cranialCaudal: 0 }, karMGy: 1, kapGyCm2: 0.1, contrastMl: 0 })!;
    };
    useSeriesStore.getState().add(mk(1));
    useSeriesStore.getState().add(mk(2));
    const st = useSeriesStore.getState();
    expect(st.series[0].released).toBe(true);
    expect(st.series[0].frames.length).toBe(0);
    expect(st.series[1].frames.length).toBe(framesPerRun);
    expect(st.bytes).toBeLessThanOrEqual(SERIES_BUDGET_BYTES);
    useSeriesStore.getState().clear();
  });

  it("the fluoroscopy loop keeps the last seconds and the latest contiguous sequence", () => {
    const L = new FluoroLoop(2);
    for (let i = 0; i < 30; i++) L.push(new Uint8Array(1), i / 15, { laoRao: 0, cranialCaudal: 0 });
    for (let i = 0; i < 10; i++) L.push(new Uint8Array(1), 5 + i / 15, { laoRao: 10, cranialCaudal: 0 });
    const s = L.last()!;
    expect(s.frames.length).toBe(10);
    expect(s.cArm.laoRao).toBe(10);
  });
});

// pci-assessment-policy-qca: the PCI lab reads the diagnostic lab's LabPolicy and labScreens rules
describe("PCI lab policy (pci-assessment-policy-qca)", () => {
  const PCI_RUN = "angio-pci:lad-focal";
  const PCI_KEY = "pci-lad-focal";
  const none = { activePolicy: null, profile: { entrustment: {} } };

  it("labScreens for a PCI exam policy has teachingAids false and hints 'off'; guided entrustment 1 has teachingAids true", () => {
    const exam = resolveLabPolicy("exam", PCI_RUN, none, { lab: "pci", epa: "pci-simple" });
    expect(exam.mode).toBe("exam");
    expect(exam.epa).toBe("pci-simple");
    const ex = labScreens(exam);
    expect(ex.teachingAids).toBe(false);
    expect(ex.hints).toBe("off");
    expect(ex.coachReadouts).toBe(false);
    expect(ex.attendingDrawer).toBe(false);
    expect(ex.objectives).toBe(false);
    const guided = resolveLabPolicy("free", PCI_RUN, none, { lab: "pci", epa: "pci-simple" });
    expect(guided.mode).toBe("guided");
    expect(guided.entrustment).toBe(1);
    expect(guided.source).toBe("level");
    const gs = labScreens(guided);
    expect(gs.teachingAids).toBe(true);
    expect(gs.coachReadouts).toBe(true);
    // supervised and independent: no teaching aids, no coach read-outs
    for (const m of ["supervised", "independent"] as const) {
      const s = labScreens({ mode: m, entrustment: 3, visibility: visibilityFor(m, 3), source: "level" });
      expect(s.teachingAids || s.coachReadouts).toBe(false);
    }
  });

  it("the EPA is the scenario's own; the level in force on it sets the mode; an active policy of this case wins; an active exam of this case is an exam", () => {
    const lv3 = resolveLabPolicy("free", PCI_RUN, { activePolicy: null, profile: { entrustment: { "pci-simple": { effective: 3 } as never } } }, { lab: "pci", epa: "pci-simple" });
    expect(lv3.mode).toBe("supervised");
    expect(lv3.epa).toBe("pci-simple");
    const active = { epa: "pci-simple" as const, caseId: PCI_KEY, mode: "independent" as const, entrustment: 4 as const, visibility: visibilityFor("independent", 4) };
    const a = resolveLabPolicy("free", PCI_RUN, { activePolicy: active, profile: { entrustment: {} } }, { lab: "pci", epa: "pci-simple", aliases: [PCI_KEY] });
    expect(a.source).toBe("active");
    expect(a.mode).toBe("independent");
    // an active policy for another case is not this case's
    const other = resolveLabPolicy("free", PCI_RUN, { activePolicy: { ...active, caseId: "pci-rca-cto" }, profile: { entrustment: {} } }, { lab: "pci", epa: "pci-simple", aliases: [PCI_KEY] });
    expect(other.source).toBe("level");
    // the progression's active exam of this case: the lab's SimMode is "exam", and the policy is the exam's
    const examActive = { ...active, mode: "exam" as const, entrustment: 3 as const, visibility: visibilityFor("exam") };
    const progress = { activePolicy: examActive, profile: { entrustment: {} } };
    expect(pciSimMode([PCI_RUN, PCI_KEY], progress)).toBe("exam");
    expect(pciSimMode([PCI_RUN, PCI_KEY], { ...progress, activePolicy: { ...examActive, caseId: "pci-rca-cto" } })).toBe("free");
    expect(pciSimMode([PCI_RUN, PCI_KEY], none)).toBe("free");
    const e = resolveLabPolicy("free", PCI_RUN, progress, { lab: "pci", epa: "pci-simple", aliases: [PCI_KEY] });
    expect(e.mode).toBe("exam");
    expect(e.entrustment).toBe(3);
    expect(labScreens(e).hints).toBe("off");
  });

  it("the run's policy (useLabRun with the scenario's EPA and pciSimMode) agrees with resolveLabPolicy for the PCI lab, and a launch mode overrides it", () => {
    const cases: { progress: ProgressLike; launch?: "guided" | "supervised" | "independent" | "exam" }[] = [
      { progress: none },
      { progress: { activePolicy: null, profile: { entrustment: { "pci-simple": { effective: 4 } as never } } } },
      { progress: { activePolicy: { epa: "pci-simple", caseId: PCI_KEY, mode: "exam", entrustment: 2, visibility: visibilityFor("exam") }, profile: { entrustment: {} } } },
      { progress: { activePolicy: { epa: "pci-simple", caseId: PCI_RUN, mode: "supervised", entrustment: 3, visibility: visibilityFor("supervised", 3) }, profile: { entrustment: {} } } },
    ];
    for (const c of cases) {
      const simMode = pciSimMode([PCI_RUN, PCI_KEY], c.progress);
      const lab = resolveLabPolicy(simMode, PCI_RUN, c.progress, { lab: "pci", epa: "pci-simple", aliases: [PCI_KEY] });
      const run = resolveRunPolicy({ sim: "angio-pci", caseId: PCI_RUN, simMode, epa: "pci-simple", progress: c.progress });
      expect({ mode: run.mode, entrustment: run.entrustment, source: run.source, epa: run.epa }).toEqual({ mode: lab.mode, entrustment: lab.entrustment, source: lab.source, epa: lab.epa });
    }
    // the launch params' mode overrides the level-derived policy
    const ex = resolveRunPolicy({ sim: "angio-pci", caseId: PCI_RUN, launchMode: "exam", epa: "pci-simple", progress: none });
    expect(ex.mode).toBe("exam");
    expect(labScreens(ex).teachingAids).toBe(false);
    const sup = resolveRunPolicy({ sim: "angio-pci", caseId: PCI_RUN, launchMode: "supervised", epa: "pci-simple", progress: none });
    expect(sup.mode).toBe("supervised");
    expect(labScreens(sup).coachReadouts).toBe(false);
  });

  it("the diagnostic lab's policy is unchanged by the PCI option", () => {
    const a = resolveLabPolicy("free", "random-xyz", null);
    const b = resolveLabPolicy("free", "random-xyz", null, { lab: "diagnostic" });
    expect(b).toEqual(a);
    expect(a.epa).toBe("diag-study");
  });
});
