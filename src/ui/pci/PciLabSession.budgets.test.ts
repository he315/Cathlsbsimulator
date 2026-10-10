// pci-budgets-stop-rules in the PCI lab session: the patient's ceiling from the scenario's facts, the
// contrast and radiation events held once and kept at finish, the team's announcements, the checkpoint
// that holds the beam until it is answered, the engine's own injections counted, and the 'long-case' carry.
//   npx vitest run src/ui/pci/PciLabSession.budgets.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { tipsFor } from "../../content/lab/tips";
import { contrastBudgetForProfile } from "../../simulation/patient/contrastBudget";
import { ckdEpi2021 } from "../../simulation/patient/patient";
import { useSeriesStore } from "../../state/useSeriesStore";
import { seedDose } from "../sim/labSession";
import { pciTipContext } from "../lab/pciTips";
import { applyImagingAction, octFlushThroughGuide, setFlushSettings } from "./inputBindings/imaging";
import { applyWireAction } from "./inputBindings/wire";
import { MP_MC_INJECTION_ML, injectMicrocatheter, loadMicrocatheter, moveMicrocatheter } from "../../simulation/pci/actions/wire";
import { deflate, inflate, loadDevice, moveDevice, removeDevice } from "../../simulation/angioPci";
import { advanceImaging, armOct, calibrateImaging, holdImaging, loadImaging, purgeImaging } from "../../simulation/pci/actions/imaging";
import { PatientEngine } from "../../simulation/patient/engine";
import type { SessionHandover } from "../../simulation/session/caseSession";
import { resolvePciLaunch } from "./launch";
import { PciLabSession, creatinineForEgfr, policyForMode } from "./PciLabSession";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function open(o: { scenario?: string; start?: string; variant?: string; seed?: string; mode?: "guided" | "supervised" | "independent" | "exam"; team?: boolean } = {}) {
  const r = resolvePciLaunch({ scenario: o.scenario ?? "multivessel-stable", start: o.start ?? "guide-engaged", ...(o.variant ? { variant: o.variant } : {}), ...(o.seed ? { seed: o.seed } : {}), mode: o.mode ?? "guided" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: !!o.team, headlessFrames: true, ...(o.mode ? { policy: policyForMode(o.mode) } : {}) });
  sessions.push(x);
  return x;
}

const run = (x: PciLabSession, s: number, dt = 0.1) => {
  for (let t = 0; t < s - 1e-9; t += dt) x.step(dt);
};

/** One standard injection through the guide, then a pause for the patient. */
function injectOnce(x: PciLabSession) {
  expect(x.inject({ kind: "standard" })).toBe(true);
  for (let k = 0; k < 100 && x.bolusInfo(); k++) x.step(0.1);
  run(x, 20);
}

const onsets = (x: PciLabSession, e: string) => x.events.history().filter((o) => o.event === e).length;
const announcements = (x: PciLabSession) => x.uiEvents().filter((e) => (e.data as { action?: string }).action === "budget-announcement").map((e) => e.data as { kind: string; text: string });

describe("budgets in the PCI lab session (pci-budgets-stop-rules)", () => {
  it("multivessel-stable: the ceiling is 3.7 × eGFR 45 less the 60 mL given this morning, and the engine's profile agrees", () => {
    const x = open();
    const b = x.budgetReadout();
    expect(b.contrast).toMatchObject({ ceilingMl: 106.5, source: "brilakis-gfr", warnAtMl: 85.2, totalMl: 0, warned: false });
    // the attending reads the same ceiling from the engine's profile (eGFR, recent contrast); the creatinine gives that eGFR
    const p = x.engine.profile;
    expect(p.renal.egfr).toBe(45);
    expect(Math.abs(ckdEpi2021(p.ageY, p.renal.creatinineMgDl, p.sex) - 45)).toBeLessThan(0.5);
    expect(contrastBudgetForProfile(p).stricter.availableMl).toBe(106.5);
    expect(creatinineForEgfr(45, p.ageY, p.sex)).toBe(p.renal.creatinineMgDl);
    // a scenario without patient facts keeps the seed's own patient
    const y = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
    sessions.push(y);
    expect(y.engine.profile.recentContrast ?? []).toEqual([]);
  });

  it("crossing the warning threshold raises high-contrast-volume once and keeps it; 5 Gy raises high-radiation-dose; both appear in the finish context", () => {
    const x = open({ mode: "independent" });
    for (let i = 0; i < 20 && !x.budgetReadout().contrast.warned; i++) {
      injectOnce(x);
      if (!x.budgetReadout().contrast.warned) expect(x.activeEvents()).not.toContain("high-contrast-volume");
    }
    expect(x.budgetReadout().contrast.totalMl).toBeGreaterThanOrEqual(85.2);
    expect(x.activeEvents()).toContain("high-contrast-volume");
    expect(x.snapshot().budget.contrast.warned).toBe(true);
    // the 50% call came before it; without the teaching aids (independent practice, no plan) it gives the volume only
    expect(announcements(x).filter((a) => a.kind === "contrast")[0].text).toMatch(/^Contrast \d+ millilitres\.$/);
    expect(x.pendingCheckpoint()!.text).not.toMatch(/ceiling/);
    // more contrast: still active, still one onset
    injectOnce(x);
    injectOnce(x);
    expect(x.activeEvents()).toContain("high-contrast-volume");
    expect(onsets(x, "high-contrast-volume")).toBe(1);
    // the air kerma reaches 5 Gy
    expect(x.activeEvents()).not.toContain("high-radiation-dose");
    seedDose(x.lab.dose, { fluoroS: 0, karMGy: 5000 - x.lab.dose.totals.karMGy.total, kapGyCm2: 1 });
    run(x, 0.5);
    expect(x.activeEvents()).toContain("high-radiation-dose");
    expect(x.budgetReadout().radiation.high).toBe(true);
    expect(onsets(x, "high-radiation-dose")).toBe(1);
    // both in the finish context, where the follow-up tips apply
    x.setFinishStep(true);
    const fin = pciTipContext(x.snapshot());
    expect(fin.phase).toBe("finish");
    expect(fin.events).toEqual(expect.arrayContaining(["high-contrast-volume", "high-radiation-dose"]));
    const ids = tipsFor(fin, 40).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["pci-caki-after-case", "pci-rad-skin-follow-up"]));
  });

  it("a KAR of 1 Gy emits an announcement with the time and the contrast", () => {
    const x = open({ mode: "independent" });
    run(x, 1);
    expect(announcements(x)).toEqual([]);
    seedDose(x.lab.dose, { fluoroS: 120, karMGy: 1000, kapGyCm2: 10 });
    run(x, 0.5);
    const a = announcements(x);
    expect(a.map((e) => e.kind)).toEqual(["air-kerma"]);
    expect(a[0].text).toMatch(/^Air kerma 1 gray, \d+ minutes, contrast \d+ millilitres\.$/);
    expect(x.budgets.announcements[0].source.book).toMatch(/28\.2\.2\.4\.8/);
  });

  it("the checkpoint holds the beam until it is answered (guided practice); in independent practice it waits without holding it", () => {
    const x = open({ mode: "guided" });
    for (let i = 0; i < 20 && !x.pendingCheckpoint(); i++) injectOnce(x);
    const cp = x.pendingCheckpoint()!;
    expect(cp.reason).toBe("contrast-warning");
    // guided practice (the teaching aids on): the calls name the ceiling
    expect(announcements(x).filter((a) => a.kind === "contrast")[0].text).toMatch(/50 per cent of the ceiling\.$/);
    expect(cp.text).toMatch(/close to the ceiling/);
    expect(x.openModals()).toContain("checkpoint");
    expect(x.checkpointHoldsBeam()).toBe(true);
    x.setPedal({ fluoro: true, cine: false });
    run(x, 1);
    expect(x.beamMode()).toBeNull();
    const fluoro0 = x.lab.dose.totals.fluoroTimeS;
    run(x, 2);
    expect(x.lab.dose.totals.fluoroTimeS).toBe(fluoro0);
    // answered: the beam comes back with the pedal still down, the decision is recorded with its numbers
    const done = x.answerCheckpoint({ decision: "continue", progress: "progress", nextStep: "finish the distal RCA" })!;
    expect(done.answer).toMatchObject({ decision: "continue", correct: true });
    expect(done.at.contrastMl).toBeGreaterThanOrEqual(85.2);
    expect(x.openModals()).not.toContain("checkpoint");
    expect(x.beamMode()).toBe("fluoro");
    run(x, 1);
    expect(x.lab.dose.totals.fluoroTimeS).toBeGreaterThan(fluoro0);
    x.setPedal({ fluoro: false, cine: false });
    expect(x.uiEvents().some((e) => (e.data as { action?: string }).action === "checkpoint-answer")).toBe(true);

    const y = open({ mode: "independent" });
    for (let i = 0; i < 20 && !y.pendingCheckpoint(); i++) injectOnce(y);
    expect(y.pendingCheckpoint()?.reason).toBe("contrast-warning");
    expect(y.checkpointHoldsBeam()).toBe(false);
    y.setPedal({ fluoro: true, cine: false });
    run(y, 0.5);
    expect(y.beamMode()).toBe("fluoro");
    y.setPedal({ fluoro: false, cine: false });
  });

  it("contrast the engine's own actions give (a microcatheter injection) counts in the total and reaches the patient", () => {
    const x = open({ mode: "independent" });
    const engine0 = x.engine.vitals().contrast?.totalMl ?? 0;
    expect(applyImagingAction(x, "inject", (st) => ({ ...st, contrastMl: st.contrastMl + 2 }))).toBe(true);
    expect(x.contrastTotal()).toBeCloseTo(2, 6);
    run(x, 0.5);
    expect(x.budgetReadout().contrast.labMl).toBe(2);
    expect((x.engine.vitals().contrast?.totalMl ?? 0) - engine0).toBeCloseTo(2, 6);
    // a run then books the syringes on top of it
    injectOnce(x);
    expect(x.st.contrastMl).toBe(Math.round(x.contrastPushed() + 2));
    expect(x.snapshot().contrastMl).toBe(Math.round(x.contrastTotal() * 10) / 10);
  });

  it("rca-cto 'long-case' opens 100 minutes into the attempt at 4.5 Gy; reaching 5 Gy opens the radiation checkpoint, where bailing out without progress is right", () => {
    const x = open({ scenario: "rca-cto", start: "guide-in-root", variant: "long-case", mode: "guided" });
    expect(x.carry?.id).toBe("long-case");
    expect(x.lab.dose.totals.karMGy.total).toBeCloseTo(4500, 0);
    const b0 = x.budgetReadout();
    expect(b0.contrast.totalMl).toBe(150);
    expect(b0.elapsedS).toBe(6000);
    expect(b0.progress).toEqual({ cto: true, crossed: false });
    // the CTO rule: 3.7 × the profile's creatinine clearance
    expect(b0.contrast.source === "brilakis-crcl-cto" || b0.contrast.source === "oxford-weight").toBe(true);
    run(x, 1);
    expect(announcements(x)).toEqual([]);
    expect(x.activeEvents()).not.toContain("high-radiation-dose");
    seedDose(x.lab.dose, { fluoroS: 60, karMGy: 520, kapGyCm2: 5 });
    run(x, 0.5);
    expect(announcements(x).map((a) => a.kind)).toEqual(["air-kerma"]);
    expect(x.activeEvents()).toContain("high-radiation-dose");
    const cp = x.pendingCheckpoint()!;
    expect(cp.reason).toBe("radiation-limit");
    expect(cp.at.crossed).toBe(false);
    expect(x.checkpointHoldsBeam()).toBe(true);
    const done = x.answerCheckpoint({ decision: "bail-out", progress: "no-progress" })!;
    expect(done.answer?.correct).toBe(true);
    expect(x.checkpointHoldsBeam()).toBe(false);
  });

  it("a blocking checkpoint that opens during a cine injection waits for the run to end: the run is filmed, then the beam is held", () => {
    const x = open({ mode: "guided" });
    let during = false;
    for (let i = 0; i < 30 && !x.pendingCheckpoint(); i++) {
      expect(x.inject({ kind: "standard", autoCine: true })).toBe(true);
      for (let k = 0; k < 200 && x.bolusInfo(); k++) {
        x.step(0.1);
        if (x.bolusInfo()) {
          // for as long as the run lasts the beam is on cine and nothing holds it
          expect(x.beamMode()).toBe("cine");
          expect(x.checkpointHoldsBeam()).toBe(false);
          if (x.pendingCheckpoint()) {
            during = true;
            expect(x.checkpointDue()).toBeNull();
            expect(x.openModals()).not.toContain("checkpoint");
          }
        }
      }
      if (!x.pendingCheckpoint()) run(x, 20);
    }
    // the threshold was crossed during a push (the run in progress counts)
    expect(during).toBe(true);
    const cp = x.pendingCheckpoint()!;
    expect(cp.reason).toBe("contrast-warning");
    // the run has ended: now the checkpoint is shown and holds the beam
    expect(x.bolusInfo()).toBeNull();
    expect(x.checkpointDue()).toBe(cp);
    expect(x.openModals()).toContain("checkpoint");
    expect(x.checkpointHoldsBeam()).toBe(true);
    x.setPedal({ fluoro: true, cine: false });
    run(x, 0.5);
    expect(x.beamMode()).toBeNull();
    x.answerCheckpoint({ decision: "stage", progress: "progress" });
    expect(x.beamMode()).toBe("fluoro");
    x.setPedal({ fluoro: false, cine: false });
  });

  it("at 5 Gy the radiographer says one line, the checkpoint's, with the totals", () => {
    const x = open({ scenario: "rca-cto", start: "guide-in-root", variant: "long-case", mode: "independent", team: true });
    const say = vi.spyOn(x.crew!.team, "say");
    run(x, 1);
    say.mockClear();
    seedDose(x.lab.dose, { fluoroS: 60, karMGy: 520, kapGyCm2: 5 });
    run(x, 0.5);
    const lines = say.mock.calls.filter((c) => c[0] === "radiographer").map((c) => String(c[1]));
    const budgetLines = lines.filter((t) => /^Air kerma \d/.test(t));
    expect(budgetLines).toHaveLength(1);
    expect(budgetLines[0]).toMatch(/^Air kerma 5(\.\d)? gray, \d+ minutes, contrast \d+ millilitres: we are at the radiation limit\./);
    // the air kerma call is still recorded
    expect(announcements(x).map((a) => a.kind)).toEqual(["air-kerma"]);
  });

  it("the long-case carry follows the variant: kept with an explicit seed, and a seed of that name elsewhere carries nothing", () => {
    const x = open({ scenario: "rca-cto", start: "guide-in-root", variant: "long-case", seed: "pci-run-7", mode: "independent" });
    expect(x.carry?.id).toBe("long-case");
    expect(x.lab.dose.totals.karMGy.total).toBeCloseTo(4500, 0);
    expect(x.budgetReadout().contrast.handedOverMl).toBe(150);
    const y = open({ scenario: "lad-focal", start: "guide-engaged", seed: "long-case", mode: "independent" });
    expect(y.carry).toBeNull();
    expect(y.lab.dose.totals.karMGy.total).toBe(0);
    expect(y.budgetReadout().contrast.handedOverMl).toBe(0);
    expect(y.budgetReadout().elapsedS).toBe(0);
  });

  it("a real microcatheter injection counts once in the lab's total and reaches the patient engine", () => {
    const x = open({ scenario: "lad-focal", start: "wire-across", mode: "independent" });
    expect(applyWireAction(x, "load-device", (st) => loadMicrocatheter(st, "mc-large"))).toBe(true);
    for (let i = 0; i < 20; i++) applyWireAction(x, "advance-wire", (st) => moveMicrocatheter(x.s, x.g, st, 5));
    expect(x.st.wire.micro!.tipMm).toBeGreaterThan(0);
    const lab0 = x.contrastTotal();
    const state0 = x.st.contrastMl;
    const engine0 = x.engine.vitals().contrast?.totalMl ?? 0;
    // the binding's own path (inputBindings/wire.ts inject)
    expect(applyWireAction(x, "inject", (st) => injectMicrocatheter(x.s, x.g, st))).toBe(true);
    expect(x.st.contrastMl - state0).toBeCloseTo(MP_MC_INJECTION_ML, 6);
    expect(x.contrastTotal() - lab0).toBeCloseTo(MP_MC_INJECTION_ML, 6);
    run(x, 0.5);
    expect((x.engine.vitals().contrast?.totalMl ?? 0) - engine0).toBeCloseTo(MP_MC_INJECTION_ML, 6);
    expect(x.budgetReadout().contrast.labMl).toBeCloseTo(lab0 + MP_MC_INJECTION_ML, 1);
  });

  it("an OCT flush through the guide counts once in the lab's total (booked on the guide's syringe, not again as the engine's own contrast)", () => {
    const x = open({ scenario: "lad-focal", start: "wire-across", mode: "independent" });
    const L = x.g.lesion;
    // predilate so the imaging catheter crosses, then the OCT catheter beyond the lesion, armed
    expect(
      applyImagingAction(x, "load-device", (st) => {
        let s = loadDevice(st, "balloon", "semi-compliant", 2.5, 12);
        s = moveDevice(s, L.centreMm - s.device!.centreMm);
        return removeDevice(deflate(inflate(x.s, x.g, s, 10)));
      })
    ).toBe(true);
    expect(applyImagingAction(x, "load-device", (st) => calibrateImaging(purgeImaging(purgeImaging(loadImaging(st, "oct"), "start"), "end")))).toBe(true);
    for (let i = 0; i < 80 && x.st.device!.centreMm < L.endMm + 30; i++) applyImagingAction(x, "advance-device", (st) => advanceImaging(x.s, x.g, st, 2));
    applyImagingAction(x, "advance-device", (st) => holdImaging(st, true));
    setFlushSettings(x, { injector: false, rateMlS: 4, durationS: 4 });
    applyImagingAction(x, "load-device", (st) => armOct(st));
    const lab0 = x.contrastTotal();
    const extra0 = x.budgetReadout().contrast.labMl;
    expect(octFlushThroughGuide(x)).toBe(true);
    expect(x.st.log.filter((r) => r.kind === "imaging-flush")).toHaveLength(1);
    // 4 mL/s for 4 s: 16 mL, once
    expect(x.contrastTotal() - lab0).toBeCloseTo(16, 6);
    run(x, 0.5);
    expect(x.budgetReadout().contrast.labMl - extra0).toBeCloseTo(16, 1);
  });

  it("a hand-over: its contrast counts as used, its agreed ceiling is the plan, and the points already passed are not called", () => {
    const engine = new PatientEngine({ seed: "pci-budgets-handover" });
    const mk = (contrastMl: number) => {
      const h = { contrastMl, contrastBudgetMl: 90 } as unknown as SessionHandover;
      const x = new PciLabSession({ scenarioId: "lad-focal", handover: { h, start: { engine, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 } } }, team: false, headlessFrames: true, policy: policyForMode("independent") });
      sessions.push(x);
      return x;
    };
    const x = mk(40);
    expect(x.budgetReadout().contrast).toMatchObject({ handedOverMl: 40, ceilingMl: 90, source: "plan", planMl: 90, agreed: true, totalMl: 40 });
    const y = mk(60);
    run(y, 1);
    expect(announcements(y)).toEqual([]);
    expect(y.pendingCheckpoint()).toBeNull();
    // the warning point is still ahead: the next run that crosses it opens the checkpoint
    for (let i = 0; i < 20 && !y.pendingCheckpoint(); i++) injectOnce(y);
    expect(y.pendingCheckpoint()?.reason).toBe("contrast-warning");
    expect(y.pendingCheckpoint()!.at.contrastMl).toBeGreaterThanOrEqual(72);
  });
});
