// pci-adhoc-handover: the full case hands its patient to the PCI lab and takes the outcome back. The lab opens on
// the case's own scenario (the report's target, the case's lesions) on the case's PatientEngine, with the contrast
// carried on; in supervised practice a device stays in the guide until an ACT at the case's PCI target has been
// measured, and 'low-act' is held until then; on the return the case keeps the LabReport, its complications and
// its finish flags, which the recovery step's tips see.
//   npx vitest run src/ui/pci/PciLab.adhocHandover.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { newCaseSession, type CaseHandover, type CaseSession } from "../../simulation/session/caseSession";
import type { PatientEngine } from "../../simulation/patient/engine";
import { lesionIdOf, type LabReport, type PciTarget } from "../../simulation/session/handover";
import { caseTipContexts } from "../access/caseTips";
import { tipsFor } from "../../content/lab/tips";
import { useSeriesStore } from "../../state/useSeriesStore";
import { backloadDevice, checkLabel, prepareDevice, recordAct, requestDevice, setValve } from "../../simulation/angioPci";
import { pciLabReport } from "../../simulation/pci/scenarios/fromCase";
import { targetIndex } from "../../simulation/pci/scenarios/registry";
import { applyDeliveryAction, deliverByHand } from "./inputBindings/support";
import { PciLabSession, policyForMode, type PciHandover } from "./PciLabSession";
import { caseDefOf, caseLaunchFor, caseReportOf, prepareHandedOver } from "./PciLab";
import { fastForward } from "../../simulation/session/autopilot";
import { buildAnatomy } from "../../simulation/anatomy";
import { buildCoronaryTree, type CoronaryTree } from "../../render/xray/coronaryTree";
import { scenarioCase } from "../../simulation/pci/actions/scenario";

/** A PCI LabReport with the given complications (their events become the report's flags). */
function pciReport(complications: LabReport["complications"]): LabReport {
  const events = [...new Set(complications.flatMap((c) => c.events ?? []))];
  return { lab: "angio-pci", stents: [], finalTimi: 3, complications, contrastMl: 40, dose: { fluoroS: 300, karMGy: 800, kapGyCm2: 40 }, durationS: 1200, residual: [], ...(events.length ? { events } : {}) };
}

const sessions: PciLabSession[] = [];
const cases: CaseSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  for (const s of cases.splice(0)) s.dispose();
  useSeriesStore.getState().clear();
});

/** The adhoc-heparin case at the hand-over gate, put off, then handed straight to PCI with the report's target. */
function handedOver(mode: "guided" | "supervised" = "supervised"): { s: CaseSession; engine: PatientEngine; handover: PciHandover; target: PciTarget } {
  const { session: s, engine } = newCaseSession({ scenario: "adhoc-heparin", mode });
  cases.push(s);
  expect(s.caseData.lesions.length).toBeGreaterThan(0);
  const l = [...s.caseData.lesions].sort((a, b) => b.severity - a.severity)[0];
  const target: PciTarget = { vessel: l.vessel, segment: null, qcaPct: null, lengthMm: null, lesionId: lesionIdOf(l), strategy: "adhoc" };
  // no top-up and no ACT at the gate: the PCI lab has the heparin and the ACT to do
  s.closePciGate();
  const h = s.toPci({ target });
  expect(h).not.toBeNull();
  const handover: PciHandover = { h: h!, start: { engine, dose: { fluoroS: h!.fluoroS, karMGy: h!.karMGy, kapGyCm2: h!.kapGyCm2 }, catheterId: h!.catheterId, air: { line: false, lumen: false } } };
  return { s, engine, handover, target };
}

function open(handover: PciHandover, start = "wire-across", mode: "guided" | "supervised" = "supervised") {
  const launch = caseLaunchFor(handover, { start })!;
  expect(launch).not.toBeNull();
  const x = new PciLabSession({ launch, handover, team: false, headlessFrames: true, policy: policyForMode(launch.mode) });
  sessions.push(x);
  const off = prepareHandedOver(x, handover);
  expect(launch.mode).toBe(mode);
  return { x, launch, off };
}

const run = (x: PciLabSession, sec: number, dt = 0.1) => {
  for (let t = 0; t < sec - 1e-9; t += dt) x.step(dt);
};

/** A balloon taken, checked, prepared and backloaded with the valve open, then pushed by hand toward the lesion. */
function pushBalloon(x: PciLabSession, pushes = 300) {
  if (!x.st.device) expect(applyDeliveryAction(x, "load-device", (st) => setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "sc", 2.5, 15)))), true))).toBe(true);
  for (let i = 0; i < pushes; i++) deliverByHand(x, 5);
}
const distal = (x: PciLabSession) => x.st.device!.centreMm + x.st.device!.lengthMm / 2;

describe("ad hoc PCI from the full case (pci-adhoc-handover)", () => {
  it("the hand-over carries the target and the case's mode; the lab opens on the case's lesions with the target as the target", () => {
    const { s, handover, target } = handedOver();
    expect((handover.h as CaseHandover).pciTarget).toMatchObject({ lesionId: target.lesionId, strategy: "adhoc" });
    expect(handover.h.mode).toBe("supervised");
    expect(handover.h.pciReady!.heparinTopUpU).toBeGreaterThan(0);
    const { x, launch } = open(handover, "guide-in-root");
    const def = caseDefOf(x)!;
    expect(def).not.toBeNull();
    const t = def.lesions[targetIndex(def)];
    const caseLesion = s.caseData.lesions.find((l) => lesionIdOf(l) === target.lesionId)!;
    expect(t).toMatchObject({ vessel: caseLesion.vessel, position: caseLesion.position, severity: caseLesion.severity });
    expect(x.s.target).toMatchObject({ vessel: caseLesion.vessel, position: caseLesion.position, severity: caseLesion.severity });
    expect(def.caseIdentity.id).toBe(s.caseData.id);
    expect(launch.source).toBe("handover");
    // the diagnostic catheter is in the root: the guide is out, phase 'guide'
    expect(x.startDef.id).toBe("guide-in-root");
    expect(x.st.guide.engaged).toBe(false);
    expect(x.tipContext().phase).toBe("guide");
  });

  it("after hand-over the PCI session uses the same PatientEngine and the contrast total continues", () => {
    const { engine, handover } = handedOver();
    const { x } = open(handover, "guide-engaged");
    expect(x.engine).toBe(engine);
    const caseMl = handover.h.contrastMl;
    const e0 = engine.vitals().contrast.totalMl;
    expect(x.budgetReadout().contrast.totalMl).toBeCloseTo(caseMl, 5);
    expect(x.inject({ kind: "standard" })).toBe(true);
    for (let k = 0; k < 100 && x.bolusInfo(); k++) x.step(0.1);
    run(x, 5);
    const lab = x.contrastTotal();
    expect(lab).toBeGreaterThan(0);
    // the patient's own total and the budget both carry on from the case's
    expect(engine.vitals().contrast.totalMl).toBeCloseTo(e0 + lab, 3);
    expect(x.budgetReadout().contrast.totalMl).toBeCloseTo(caseMl + lab, 3);
  });

  it("supervised: a device cannot leave the guide before the ACT target; 'low-act' is held until it is met", () => {
    const { handover } = handedOver("supervised");
    const target = handover.h.pciReady!.actTargetS[0];
    const { x, off } = open(handover, "wire-across");
    // no ACT was measured after the last heparin dose: nothing carried in, 'low-act' held
    expect(x.st.act).toBeNull();
    expect(x.activeEvents()).toContain("low-act");
    expect(x.tipContext().events).toContain("low-act");
    pushBalloon(x);
    expect(distal(x)).toBeLessThanOrEqual(0.01);
    expect(x.st.counters.actSkipped).toBeGreaterThan(0);
    // an ACT below target (the diagnostic dose only) keeps it in the guide
    const low = x.engine.measureAct();
    expect(low).toBeLessThan(target);
    applyDeliveryAction(x, "drug", (st) => recordAct(st, low));
    pushBalloon(x, 50);
    expect(distal(x)).toBeLessThanOrEqual(0.01);
    expect(x.activeEvents()).toContain("low-act");
    // the top-up the hand-over names, then an ACT at target: the device goes on and 'low-act' clears
    x.engine.give({ drug: "heparin", dose: handover.h.pciReady!.heparinTopUpU + 2000, route: "iv" });
    run(x, 60, 0.5);
    const act = x.engine.measureAct();
    expect(act).toBeGreaterThanOrEqual(Math.max(target, 250));
    applyDeliveryAction(x, "drug", (st) => recordAct(st, act));
    expect(x.activeEvents()).not.toContain("low-act");
    pushBalloon(x, 300);
    expect(distal(x)).toBeGreaterThan(0);
    off();
  });

  it("an ACT at target measured at the hand-over gate after the last dose is carried in, and nothing is held", () => {
    const { session: s, engine } = newCaseSession({ scenario: "adhoc-heparin", mode: "supervised" });
    cases.push(s);
    s.givePciHeparin(100 * s.profile.weightKg - s.heparinU, "iv");
    s.runPending();
    const act = s.measureAct()!;
    s.runPending();
    expect(act).toBeGreaterThanOrEqual(s.pciActRange()[0]);
    const h = s.toPci()!;
    expect(h).not.toBeNull();
    const handover: PciHandover = { h, start: { engine, dose: { fluoroS: h.fluoroS, karMGy: h.karMGy, kapGyCm2: h.kapGyCm2 }, catheterId: h.catheterId } };
    const { x } = open(handover, "wire-across");
    expect(x.st.act?.value).toBe(h.anticoag!.lastAct!.act);
    expect(x.activeEvents()).not.toContain("low-act");
  });

  it("the outcome object is present in caseSession after returnFromLab and the recovery step sees the complication flags", () => {
    const { s, handover, target } = handedOver("guided");
    const { x } = open(handover, "wire-across", "guided");
    const def = caseDefOf(x)!;
    // the report the lab leaves: a dissection that became overt and was treated, and an air kerma over 5 Gy
    const L = x.g.lesion;
    const st = {
      ...x.st,
      cx: { ...x.st.cx, list: [{ id: "dissection-1", kind: "dissection" as const, stage: "treated" as const, t0: 10, tOvert: 12, tTreated: 40, route: [L.vessel], vessel: L.vessel, atMm: L.centreMm, lengthMm: 6, severity: 0.5, grade: "C", cause: "balloon", data: {}, bailouts: [] }] },
    };
    const report = pciLabReport({ st, target: { lesionId: def.targetCheck.lesionId, vessel: target.vessel, segment: null }, contrastMl: x.contrastTotal(), dose: { fluoroS: 900, karMGy: 5400, kapGyCm2: 120 }, durationS: 1800, finishEvents: ["high-radiation-dose"] });
    // the lab's own report from its state is well formed too
    // with the wire across and nothing dilated no vessel was treated: no final TIMI; every case lesion is in the residual
    const own = caseReportOf(x, s.caseData.lesions);
    expect(own).toMatchObject({ lab: "angio-pci", finalTimi: null });
    expect(own.residual).toContainEqual(expect.objectContaining({ vessel: target.vessel, lesionId: target.lesionId }));
    expect(own.residual.map((r) => r.lesionId)).toEqual(s.caseData.lesions.map((l) => lesionIdOf(l)));
    s.stageLabReport(report, { target: def.chosen, targetCheck: { lesionId: def.targetCheck.lesionId, culpritId: def.targetCheck.culpritId, isCulprit: def.targetCheck.isCulprit } });
    expect(s.pciOutcome).toBeNull();
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 900, karMGy: 5400, kapGyCm2: 120, durationS: 60, patientAdvanced: true });
    s.runPending();
    expect(s.pciOutcome).not.toBeNull();
    expect(s.pciOutcome!.report).toBe(report);
    expect(s.pciOutcome!.target).toMatchObject({ lesionId: target.lesionId });
    expect(s.pciOutcome!.targetCheck).toMatchObject({ lesionId: target.lesionId });
    expect(s.ward.reports).toContain(report);
    expect(s.complications.find((c) => c.id === "pci-1-dissection-1")).toMatchObject({ source: "pci", severity: "minor" });
    const fu = s.pciFollowUp()!;
    expect(fu.complications.map((c) => c.id)).toEqual(["dissection-1"]);
    expect(fu.events).toEqual(expect.arrayContaining(["dissection", "high-radiation-dose"]));
    expect(fu.highRadiationDose).toBe(true);
    // the flags stay for the rest of the case in the recovery workspace's PCI finish context and its tips, not as
    // case events (an access context would read the coronary dissection as an access one)
    expect(s.activeEvents()).not.toContain("dissection");
    const rec = caseTipContexts(s, "recovery").find((c) => c.lab === "pci" && c.phase === "finish" && (c.events ?? []).includes("dissection"))!;
    expect(rec).toBeDefined();
    expect(rec.events).toEqual(expect.arrayContaining(["dissection", "high-radiation-dose"]));
    const ids = tipsFor(rec, 20).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["pci-post-complication-candour", "pci-post-radiation-follow-up"]));
    // a second return without a report leaves the outcome as it was
    s.returnFromLab("diagnostic", { contrastMl: 0, fluoroS: 0 });
    expect(s.pciOutcome!.report).toBe(report);
  });

  it("a coronary perforation and dissection returned by the PCI reach the PCI finish context only, never an access complication context", () => {
    const { s } = handedOver("guided");
    const report = pciReport([
      { id: "perforation-1", label: "Coronary perforation (Ellis II)", t: 300, severity: "major", events: ["perforation"], resolved: true },
      { id: "dissection-1", label: "Coronary dissection (type C)", t: 200, severity: "minor", events: ["dissection"], resolved: true },
    ]);
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0, report });
    s.runPending();
    expect(s.activeEvents()).not.toContain("perforation");
    expect(s.activeEvents()).not.toContain("dissection");
    for (const ws of ["recovery", "closure", "handover"] as const) {
      const ctxs = caseTipContexts(s, ws);
      expect(ctxs.some((c) => c.lab === "access" && c.phase === "complication"), ws).toBe(false);
      // no access tip written for a perforation or a dissection (the radial perforation cover among them)
      const tips = ctxs.flatMap((c) => tipsFor(c, 20));
      expect(tips.filter((t) => t.lab === "access" && (t.when.event ?? []).some((e) => e === "perforation" || e === "dissection")).map((t) => t.id), ws).toEqual([]);
      expect(tips.map((t) => t.id), ws).not.toContain("access-cx-radial-perforation-cover");
      // the diagnostic finish context does not get the coronary dissection either
      expect(ctxs.filter((c) => c.lab === "diagnostic").some((c) => (c.events ?? []).includes("dissection")), ws).toBe(false);
      const pciFinish = ctxs.filter((c) => c.lab === "pci" && c.phase === "finish");
      expect(pciFinish.some((c) => (c.events ?? []).includes("perforation") && (c.events ?? []).includes("dissection")), ws).toBe(true);
    }
  });

  it("the case summary lists a returned PCI's complications (one id per return) and keeps them out of the case's pass rule; it carries the target check", () => {
    const { session: s } = newCaseSession({ seed: "led-1", access: "radial-right" });
    cases.push(s);
    fastForward(s, "recovery");
    const perf = { id: "perforation-1", label: "Coronary perforation (Ellis II)", t: 300, severity: "major" as const, events: ["perforation" as const], resolved: true };
    const check = { lesionId: "RCA@0.470", match: "lesion", culpritId: null, culpritVessel: null, isCulprit: null, text: "The report chose the RCA lesion. The case has no acute culprit lesion." };
    s.stageLabReport(pciReport([perf]), { target: null, targetCheck: check });
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0 });
    // a second PCI return with the engine's same complication id keeps its own entry
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0, report: pciReport([perf]) });
    s.runPending();
    const pci = s.complications.filter((c) => c.source === "pci");
    expect(pci.map((c) => c.id)).toEqual(["pci-1-perforation-1", "pci-2-perforation-1"]);
    expect(pci.every((c) => c.severity === "major")).toBe(true);
    s.submitHandover(s.truth());
    const sum = s.finish()!;
    expect(sum).not.toBeNull();
    expect(sum.complications.filter((c) => c.source === "pci")).toHaveLength(2);
    // the case's own technique is clean: a major PCI complication does not fail the case (the PCI lab grades it)
    expect(sum.complications.some((c) => c.severity === "major" && c.source !== "pci")).toBe(false);
    expect(sum.criticalErrors).toBe(0);
    expect(sum.passed).toBe(true);
    // the second return staged no target check: the summary has the last outcome's, which is none
    expect(sum.pci).toEqual({ targetCheck: null, text: null });
  });

  it("the case summary carries the PCI's target check and its debrief line", () => {
    const { session: s } = newCaseSession({ seed: "led-1", access: "radial-right" });
    cases.push(s);
    fastForward(s, "recovery");
    const check = { lesionId: "LAD@0.360", match: "lesion", culpritId: "RCA@0.470", culpritVessel: "RCA" as const, isCulprit: false, text: "The report chose the LAD lesion: not the culprit of this presentation (the culprit was the RCA lesion)." };
    s.stageLabReport(pciReport([]), { target: null, targetCheck: check });
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0 });
    s.submitHandover(s.truth());
    const sum = s.finish()!;
    expect(sum.pci).toEqual({ targetCheck: check, text: check.text });
  });

  // The tree the PCI session actually builds. The session takes its anatomy case from scenarioCase
  // (src/simulation/pci/actions/scenario.ts), which ignores the scenario's caseIdentity: the id becomes
  // 'pci-<def.id>' and the root rotation and aortic tilt 0, so the genome seed and the root differ from the
  // diagnostic lab's. Fixing that is outside this package (scenario.ts or the PciLabSession constructor).
  const shape = (t: CoronaryTree) =>
    t.vessels.map((v) => ({
      name: v.name,
      lesionId: v.lesionId,
      pathMm: v.pathMm.map((k) => Math.round(k * 1000) / 1000),
      radii: v.radii.map((k) => Math.round(k * 10000) / 10000),
      at: v.samples.map((p) => [p.ell, p.phi, p.h, p.w].map((k) => Math.round(k * 1000) / 1000)),
    }));

  it("the scenario carries the case identity, and placeability is checked on the tree the session builds", () => {
    const { s, handover } = handedOver();
    const { x } = open(handover, "guide-in-root");
    const def = caseDefOf(x)!;
    expect(def.caseIdentity).toEqual({ id: s.caseData.id, name: s.caseData.name, rootRotationDeg: s.caseData.rootRotationDeg, aortaTiltDeg: s.caseData.aortaTiltDeg });
    // caseLaunchFor's placeability check (labVessels) grows its tree from scenarioCase, as the session does
    const c = scenarioCase(x.s);
    expect(x.caseData).toEqual(c);
    expect(shape(x.baseTree)).toEqual(shape(buildCoronaryTree(buildAnatomy(c), c)));
    for (const l of x.caseData.lesions) expect(x.baseTree.vessels.some((v) => v.name === l.vessel)).toBe(true);
  });

  // KNOWN GAP (outOfScope of pci-adhoc-handover): expected to fail until scenarioCase or the PciLabSession
  // constructor honours caseIdentity. When that lands this test starts failing as '.fails'; drop the '.fails'.
  it.fails("the PCI session grows the diagnostic lab's coronary tree (same id, root rotation and aortic tilt)", () => {
    const { s, handover } = handedOver();
    const { x } = open(handover, "guide-in-root");
    expect({ id: x.caseData.id, rootRotationDeg: x.caseData.rootRotationDeg, aortaTiltDeg: x.caseData.aortaTiltDeg }).toEqual({ id: s.caseData.id, rootRotationDeg: s.caseData.rootRotationDeg, aortaTiltDeg: s.caseData.aortaTiltDeg });
    expect(shape(x.baseTree)).toEqual(shape(buildCoronaryTree(buildAnatomy(s.caseData), s.caseData)));
  });
});
