// pci-attending: the attending in the PCI lab, headless (a PciLabSession with no renderer and no React).
// The sign-out's wire-integrity gate, the PCI metrics of a recorded run against the engine's own counters,
// the phases the pre-brief and the sign-out give the tips (with a perforation kept at finish), the
// dialogues that hold the hands only in guided practice and exams, the team time-out that waits for an
// absent member, and the logbook measures.
//   npx vitest run src/ui/pci/usePciAttending.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession, policyForMode } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { PciAttending, type PciAttendingOptions } from "./usePciAttending";
import { applyIndeflatorAction } from "./inputBindings/indeflator";
import { useSeriesStore } from "../../state/useSeriesStore";
import { inflate, pullIndeflatorNegative, setIndeflator } from "../../simulation/angioPci";
import { pathTo } from "../../simulation/pci/geometry";
import type { Complication } from "../../simulation/complications/types";
import { pciTipContext } from "../lab/pciTips";
import { awaitingAssessment, withRecognition } from "../lab/pciEvents/recognition";
import { LabRun } from "../lab/labRun";
import type { LaunchMode } from "../../content/schema";
import type { LogSessionInput } from "../../progress/types";

const sessions: PciLabSession[] = [];
const attendings: PciAttending[] = [];
afterEach(() => {
  for (const a of attendings.splice(0)) a.detach();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** lad-focal at a start, headless, with an attending attached. */
function rig(mode: LaunchMode, o: PciAttendingOptions & { start?: string; scenario?: string } = {}) {
  const r = resolvePciLaunch({ scenario: o.scenario ?? "lad-focal", start: o.start ?? "wire-across", mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, policy: policyForMode(mode) });
  sessions.push(x);
  const a = new PciAttending(x, { damagedWire: false, absentMember: null, ...o });
  attendings.push(a);
  a.attach();
  return { x, a };
}

function run(x: PciLabSession, seconds: number, dt = 1 / 30) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** The case's whole sign-out, filled as an operator would (the damaged wire recorded, if any). */
function fillSignOut(a: PciAttending) {
  for (const w of a.wiresUsed()) a.inspectWire(w);
  if (a.damagedWireKind) a.recordDamagedWire("record-image");
  a.setSignOut({ equipmentCounted: true, sharpsCounted: true, antiplatelet: { regimen: "aspirin-clopidogrel", durationMonths: 6, loading: "already-loaded" }, logbook: { role: "first-operator", presentation: "stable angina", complexity: "simple", techniques: "single stent" } });
  for (const c of a.complications()) a.setSignOut({ complications: { ...a.signOut.complications, [c.id]: "resolved" } });
  if (a.pmiAsked()) {
    a.order({ ecg: true, troponin: true, imaging: true });
    a.setSignOut({ pmiClass: a.pmiTruth(), disclosure: "now-awake", incidentReport: true });
  }
}

/** A complication of the engine at the target (the shape src/ui/lab/pciTips.test.ts builds). */
function complication(x: PciLabSession, kind: Complication["kind"], o: Partial<Complication> = {}): Complication {
  const L = x.g.lesion;
  return { id: `${kind}-1`, kind, stage: "overt", t0: 10, tOvert: 10, tTreated: null, route: pathTo(x.g, L.vessel), vessel: L.vessel, atMm: L.centreMm, lengthMm: 6, severity: 0.5, grade: "II", cause: "wire", data: {}, bailouts: [], ...o };
}

describe("the sign-out (pci-attending)", () => {
  it("blocks finish in the wire-integrity variant until the damaged wire is recorded, in every mode", () => {
    for (const mode of ["independent", "supervised", "guided"] as const) {
      const { x, a } = rig(mode, { damagedWire: true });
      a.startCase();
      expect(a.damagedWireKind).toBe(x.st.wireKind);
      a.openSignOut();
      expect(x.tipContext().phase).toBe("finish");
      // not yet inspected: the session refuses to finish and the attending says why
      expect(x.finish(), mode).toBeNull();
      expect(a.finishCase()).toBeNull();
      expect(x.finished).toBe(false);
      expect(a.utterances.some((u) => u.ruleId === "sign-out-wire" && u.blocking)).toBe(true);
      // inspected: the coil is missing; discarding it is not recording it
      expect(a.inspectWire(a.damagedWireKind!)).toBe("damaged");
      a.recordDamagedWire("discard");
      expect(a.finishAllowed()).toBe(false);
      expect(x.finish()).toBeNull();
      a.recordDamagedWire("record-image");
      if (mode === "independent") {
        // the rest of the sign-out is optional in independent practice: the case may end now
        expect(a.finishAllowed()).toBe(true);
      } else {
        // supervised and guided: the whole sign-out is required
        expect(a.finishAllowed()).toBe(false);
        expect(a.completeSignOut().length).toBeGreaterThan(0);
        fillSignOut(a);
        expect(a.completeSignOut()).toEqual([]);
      }
      const res = a.finishCase();
      expect(x.finished, mode).toBe(true);
      expect(res?.metrics.lab).toBe("pci");
      const d = a.decisions.find((r) => r.id === "signout-wire-integrity");
      expect(d?.correct).toBe(true);
      expect(a.decisions.some((r) => r.id === "signout-wire-integrity" && r.tipIds?.includes("pci-mon-sign-out"))).toBe(true);
    }
  });

  it("without the variant the wires are intact; the case and the seed decide the variants", () => {
    const { a } = rig("independent", { damagedWire: false });
    for (const w of a.wiresUsed()) expect(a.inspectWire(w)).toBe("intact");
    const one = rig("supervised", { damagedWire: undefined, absentMember: undefined }).a;
    const two = rig("supervised", { damagedWire: undefined, absentMember: undefined }).a;
    expect(two.damagedWireKind).toBe(one.damagedWireKind);
    expect(two.absent).toEqual(one.absent);
  });
});

describe("PCI metrics of a recorded run (pci-attending)", () => {
  it("deployWithoutPositioningRun, oversizedOutsideLesion and deviceBeyondWire agree with the engine's st.counters and st.log", () => {
    const { x, a } = rig("independent");
    a.startCase();
    const L = x.g.lesion;
    x.setPedal({ fluoro: true, cine: false });
    run(x, 0.3);
    for (let i = 0; i < 40 && x.st.tipMm < L.endMm + 26; i++) {
      x.moveWire(1.5);
      x.step(1 / 15);
    }
    expect(x.st.tipMm).toBeGreaterThan(L.endMm + 20);
    // 1) an oversized non-compliant balloon inflated beyond the lesion (a scripted engine change, as a
    //    headless script inflates; the attending would stop it at the table)
    expect(x.loadDevice("balloon", "non-compliant", 4.0, 12)).toBe(true);
    run(x, 0.2);
    expect(x.advanceDevice(L.endMm + 8 - x.st.device!.centreMm)).toBe(true);
    run(x, 0.2);
    expect(applyIndeflatorAction(x, "deflate", (st) => inflate(x.s, x.g, st, 12))).toBe(true);
    run(x, 0.5);
    expect(x.deflate()).toBe(true);
    expect(x.removeDevice()).toBe(true);
    run(x, 0.2);
    // 2) a stent taken to the lesion and deployed on the indeflator with no positioning run since it moved
    expect(x.loadDevice("stent", "semi-compliant", 3.0, 18)).toBe(true);
    run(x, 0.2);
    expect(x.advanceDevice(L.centreMm - x.st.device!.centreMm)).toBe(true);
    run(x, 0.2);
    expect(applyIndeflatorAction(x, "inflate", (st) => setIndeflator(st, 14, 3))).toBe(true);
    run(x, 6);
    expect(applyIndeflatorAction(x, "deflate", (st) => pullIndeflatorNegative(x.s, x.g, st))).toBe(true);
    run(x, 5);
    expect(x.st.stents.length).toBe(1);
    x.deflate();
    x.removeDevice();
    // 3) a balloon pushed to the end of the wire
    expect(x.loadDevice("balloon", "semi-compliant", 2.5, 12)).toBe(true);
    run(x, 0.2);
    expect(x.advanceDevice(400)).toBe(true);
    run(x, 0.5);
    x.setPedal({ fluoro: false, cine: false });
    run(x, 0.3);
    const st = x.st;
    const res = a.finishCase();
    expect(res).not.toBeNull();
    const m = a.metrics!;
    expect(m.lab).toBe("pci");
    expect(st.counters.oversizedOutsideLesion).toBe(1);
    expect(st.counters.deployWithoutRun).toBe(1);
    expect(m.oversizedOutsideLesion).toBe(st.counters.oversizedOutsideLesion);
    expect(m.deployWithoutPositioningRun).toBe(st.counters.deployWithoutRun);
    // the engine keeps no beyond-wire counter: its moves' own flag (devices.ts), or the same rule on the
    // assisted move (distal end within 6 mm of the wire tip)
    const beyond = st.log.filter((r) => {
      if (r.kind !== "device" || r.data.action !== "move") return false;
      if (typeof r.data.beyondWire === "boolean") return r.data.beyondWire;
      const len = typeof r.data.lengthMm === "number" ? r.data.lengthMm : 12;
      return Number(r.data.centreMm) + len / 2 >= st.tipMm - 6 - 1e-6;
    }).length;
    expect(beyond).toBeGreaterThanOrEqual(1);
    expect(m.deviceBeyondWire).toBe(beyond);
    // the record carries the rest of the case: inflations, the deployment, fluoroscopy
    expect(m.fluoroS).toBeGreaterThan(0);
    expect(res!.analysis.events.some((e) => e.kind === "deploy")).toBe(true);
    // the standards read the same metrics: this run fails on the positioning and the oversized balloon
    const failed = res!.debrief.summary.standards.filter((r) => !r.pass).map((r) => r.standard.id);
    expect(failed).toEqual(expect.arrayContaining(["pci-positioning", "pci-oversize", "pci-beyond-wire"]));
    // the logbook measures are the metrics (numbers only, no 100 or 0 score)
    const nums = a.metricNumbers();
    expect(nums.deployWithoutPositioningRun).toBe(1);
    expect(nums.oversizedOutsideLesion).toBe(1);
    expect(nums.deviceBeyondWire).toBe(beyond);
    for (const v of Object.values(nums)) expect(Number.isFinite(v)).toBe(true);
  });

  it("the logbook row carries the measured metrics and no score", () => {
    const { x, a } = rig("independent");
    a.startCase();
    x.setPedal({ fluoro: true, cine: false });
    run(x, 1);
    x.setPedal({ fluoro: false, cine: false });
    a.finishCase();
    let logged: LogSessionInput | null = null;
    const labRun = new LabRun({ sim: "angio-pci", caseId: "angio-pci:lad-focal", launchMode: "independent", log: (s) => ((logged = s), { ...s, id: "row", t: 0, epas: [], complications: [], criticalErrors: 0 } as never) });
    labRun.finish({ passed: false, metrics: a.metricNumbers(), criticalErrors: a.metrics!.criticalErrors.length });
    expect(logged).not.toBeNull();
    const row = logged as unknown as LogSessionInput;
    expect(row.score).toBeUndefined();
    expect(row.metrics?.fluoroS).toBeGreaterThan(0.5);
    expect(Object.keys(row.metrics ?? {})).toEqual(expect.arrayContaining(["deployWithoutPositioningRun", "oversizedOutsideLesion", "deviceBeyondWire", "contrastMl", "procTimeS"]));
  });
});

describe("the attending and the tips' phases, end to end (pci-attending)", () => {
  it("opening the pre-brief gives phase 'plan'; signing out after a perforation keeps 'perforation' in the finish context", () => {
    const { x, a } = rig("supervised");
    // the attending opens the case brief on attach
    expect(x.openModals()).toContain("prebrief");
    expect(x.tipContext().phase).toBe("plan");
    expect(pciTipContext(withRecognition(x.snapshot())).phase).toBe("plan");
    // brief, plan, time-out (all present), case
    for (const q of a.prebrief.questions) a.answer(q.id, q.correct[0]);
    a.toPlan();
    expect(x.tipContext().phase).toBe("plan");
    a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "dissection", firstMove: "stent" }, { complication: "perforation", firstMove: "balloon-at-hole" }], support: "none", operatorState: "rested" });
    a.submitPlan();
    expect(a.stage).toBe("timeout");
    expect(x.tipContext().phase).toBe("plan");
    for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
    expect(a.runTimeOut()).toBe(true);
    expect(a.stage).toBe("case");
    expect(x.openModals()).not.toContain("prebrief");
    expect(x.tipContext().phase).not.toBe("plan");
    // a perforation during the case (the engine's complication, put in by a scripted change)
    expect(applyIndeflatorAction(x, "deflate", (st) => ({ ...st, cx: { ...st.cx, list: [complication(x, "perforation", { stage: "treated", tTreated: 40 })] } }))).toBe(true);
    run(x, 0.2);
    a.openSignOut();
    // the lab's tip context (PciLab.tsx labTipContext: the snapshot with the learner's recognitions)
    const ctx = pciTipContext(withRecognition(x.snapshot()));
    expect(ctx.phase).toBe("finish");
    expect(ctx.events).toContain("perforation");
    expect(x.tipContext().phase).toBe("finish");
    fillSignOut(a);
    expect(a.completeSignOut()).toEqual([]);
    expect(a.finishCase()).not.toBeNull();
    const fin = pciTipContext(withRecognition(x.snapshot()));
    expect(fin.phase).toBe("finish");
    expect(fin.events).toContain("perforation");
    // the plan named the perforation: the forecast matched what the engine produced
    expect(a.decisions.find((d) => d.id === "plan-forecast-matched")?.correct).toBe(true);
    expect(a.planItems.find((i) => i.id === "forecast")?.kept).toBe(true);
    // the plan, the time-out and the sign-out are in the record
    const kinds = x.recorder.events.map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(["plan", "timeout", "report", "case-end"]));
    expect(a.assessment?.debrief.planVsExecution.some((p) => p.id === "contrast-ceiling")).toBe(true);
  });

  it("in supervised and independent practice the plan, time-out and sign-out do not block hand input; in guided practice and exams they do", () => {
    for (const mode of ["supervised", "independent"] as const) {
      const { x, a } = rig(mode);
      expect(a.stage).toBe("brief");
      expect(a.handsEnabled()).toBe(true);
      expect(x.moveWire(1), mode).toBe(true);
      a.toPlan();
      expect(x.moveWire(1)).toBe(true);
      a.openSignOut();
      expect(x.moveWire(-1)).toBe(true);
    }
    for (const mode of ["guided", "exam"] as const) {
      const { x, a } = rig(mode);
      expect(a.handsEnabled()).toBe(false);
      const tip = x.st.tipMm;
      expect(x.moveWire(1), mode).toBe(false);
      expect(x.st.tipMm).toBe(tip);
      a.toPlan();
      expect(x.moveWire(1)).toBe(false);
      a.startCase();
      expect(a.handsEnabled()).toBe(true);
      expect(x.moveWire(1)).toBe(true);
      a.openSignOut();
      expect(x.moveWire(-1), mode).toBe(false);
      a.closeSignOut();
      expect(x.moveWire(-1)).toBe(true);
    }
  });

  it("the beam waits for the time-out in supervised practice and exams, not in guided or independent practice", () => {
    for (const [mode, gated] of [["supervised", true], ["exam", true], ["guided", false], ["independent", false]] as const) {
      const { x, a } = rig(mode);
      a.startCase();
      x.setPedal({ fluoro: true, cine: false });
      run(x, 0.5);
      expect(x.beamMode() === null, mode).toBe(gated);
      x.setPedal({ fluoro: false, cine: false });
      if (gated) {
        a.reopen("timeout");
        for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
        expect(a.runTimeOut()).toBe(true);
        x.setPedal({ fluoro: true, cine: false });
        run(x, 0.3);
        expect(x.beamMode()).toBe("fluoro");
        x.setPedal({ fluoro: false, cine: false });
      }
    }
  });
});

describe("the team time-out (pci-attending)", () => {
  it("waits for an absent team member: refused while they are out, recorded, run once they are back", () => {
    const { x, a } = rig("supervised", { absentMember: "radiographer" });
    a.reopen("timeout");
    for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
    expect(a.missingMember()).toBe("radiographer");
    expect(a.presentMembers()).not.toContain("radiographer");
    expect(a.runTimeOut()).toBe(false);
    expect(a.utterances.some((u) => u.ruleId === "time-out-team" && /radiographer/.test(u.text))).toBe(true);
    expect(a.timeOutDone).toBe(false);
    run(x, 21);
    expect(a.missingMember()).toBeNull();
    expect(a.runTimeOut()).toBe(true);
    const d = a.decisions.find((r) => r.id === "timeout-team-present");
    expect(d?.correct).toBe(false);
    expect(d?.lessonId).toBe("pm-monitoring-checklist");
    // the PCI items of the module text are on the list, with the heparin item of every PCI time-out
    const ids = a.timeOutItems().map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(["heparin", "irmer", "defib", "plan-aloud", "equipment-ready"]));
  });

  it("the absent-member refusal leaves the live caption once the member is back, and stays in the conversation", () => {
    const { x, a } = rig("supervised", { absentMember: "sedation" });
    a.reopen("timeout");
    for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
    expect(a.runTimeOut()).toBe(false);
    expect(a.last?.ruleId).toBe("time-out-team");
    run(x, 21);
    expect(a.missingMember()).toBeNull();
    expect(a.last).toBeNull();
    expect(a.runTimeOut()).toBe(true);
    expect(a.stage).toBe("case");
    expect(a.last?.ruleId === "time-out-team" || a.last?.ruleId === "time-out-items").toBe(false);
    expect(a.utterances.some((u) => u.ruleId === "time-out-team")).toBe(true);
  });

  it("an unchecked-item refusal leaves the live caption when the time-out runs", () => {
    const { a } = rig("supervised", { absentMember: null });
    a.reopen("timeout");
    expect(a.runTimeOut()).toBe(false);
    expect(a.last?.ruleId).toBe("time-out-items");
    for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
    expect(a.runTimeOut()).toBe(true);
    expect(a.last).toBeNull();
    expect(a.utterances.some((u) => u.ruleId === "time-out-items")).toBe(true);
  });

  it("an unchecked item holds the time-out", () => {
    const { a } = rig("exam");
    a.reopen("timeout");
    expect(a.runTimeOut()).toBe(false);
    expect(a.timeOutDone).toBe(false);
  });
});

describe("the safety stops through the session (pci-attending)", () => {
  it("advancing a device out of the guide with the beam off is stopped; screened it goes", () => {
    const { x, a } = rig("independent");
    a.startCase();
    expect(x.loadDevice("balloon", "semi-compliant", 2.5, 12)).toBe(true);
    run(x, 0.3);
    const c0 = x.st.device!.centreMm;
    expect(x.advanceDevice(10)).toBe(false);
    expect(x.st.device!.centreMm).toBe(c0);
    expect(a.utterances.some((u) => u.ruleId === "unscreened-device-advance" && u.blocking)).toBe(true);
    x.setPedal({ fluoro: true, cine: false });
    run(x, 0.2);
    expect(x.advanceDevice(10)).toBe(true);
    expect(x.st.device!.centreMm).toBeGreaterThan(c0);
  });

  it("deploying a stent with no positioning run is stopped in supervised practice; after a run it deploys", () => {
    const { x, a } = rig("supervised");
    a.reopen("timeout");
    for (const i of a.timeOutItems()) a.checkTimeOut(i.id, true);
    a.runTimeOut();
    // the ACT the supervised gate asks for (the team's measurement)
    x.setPedal({ fluoro: true, cine: false });
    expect(x.loadDevice("stent", "semi-compliant", 3.0, 18)).toBe(true);
    run(x, 0.2);
    expect(x.advanceDevice(5)).toBe(false); // no ACT yet in supervised practice
    expect(a.utterances.some((u) => u.ruleId === "act-not-checked")).toBe(true);
    applyIndeflatorAction(x, "deflate", (st) => ({ ...st, act: { value: 300, t: st.t } }));
    run(x, 0.2);
    expect(x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm)).toBe(true);
    x.setPedal({ fluoro: false, cine: false });
    run(x, 0.2);
    expect(x.inflate(14)).toBe(false);
    expect(x.st.stents.length).toBe(0);
    expect(a.utterances.some((u) => u.ruleId === "deploy-without-run" && u.blocking)).toBe(true);
    expect(x.inject({ autoCine: true })).toBe(true);
    run(x, 0.4);
    x.releaseInjection();
    run(x, 4);
    expect(x.inflate(14)).toBe(true);
    expect(x.st.stents.length).toBe(1);
  });
});

describe("after review (pci-attending)", () => {
  it("in independent and supervised practice the first hand action takes the brief off the lab: the tips see the case and a change awaits its assessment; the form stays by its stage", () => {
    for (const mode of ["independent", "supervised"] as const) {
      const { x, a } = rig(mode);
      expect(x.openModals()).toContain("prebrief");
      expect(pciTipContext(withRecognition(x.snapshot())).phase).toBe("plan");
      expect(x.moveWire(1), mode).toBe(true);
      expect(x.openModals()).not.toContain("prebrief");
      expect(a.stage).toBe("brief");
      expect(a.formOpen()).toBe(true);
      expect(pciTipContext(withRecognition(x.snapshot())).phase, mode).not.toBe("plan");
      expect(applyIndeflatorAction(x, "deflate", (st) => ({ ...st, cx: { ...st.cx, list: [complication(x, "dissection")] } }))).toBe(true);
      expect(awaitingAssessment(x.st).map((c) => c.id)).toEqual(["dissection-1"]);
    }
    // guided practice and exams: the brief holds the hands, and stays over the lab
    const { x } = rig("guided");
    expect(x.moveWire(1)).toBe(false);
    expect(x.openModals()).toContain("prebrief");
  });

  it("the PCI attending runs without the diagnostic 'time-out' rule: 90 s on the plan form is not 'stuck'; a stalled case gets the PCI-worded prompt", () => {
    const { x, a } = rig("guided");
    expect(a.engine.rules.some((r) => r.id === "time-out")).toBe(false);
    expect(a.engine.rules.some((r) => r.id === "pci-stuck")).toBe(true);
    a.toPlan();
    run(x, 90, 1 / 10);
    expect(a.utterances.some((u) => u.ruleId === "time-out" || u.ruleId === "pci-stuck")).toBe(false);
    // the case, then nothing done for longer than the PCI stuck time
    const s2 = rig("supervised");
    s2.a.startCase();
    run(s2.x, 130, 1 / 10);
    expect(s2.a.utterances.some((u) => u.ruleId === "time-out")).toBe(false);
    const stuck = s2.a.utterances.find((u) => u.ruleId === "pci-stuck");
    expect(stuck).toBeDefined();
    expect(stuck!.text).not.toMatch(/catheter|root|sinus|LAO/);
  });

  it("the debrief names the first CTO stopping rule the case passed", () => {
    const { x, a } = rig("independent");
    a.toPlan();
    a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "dissection", firstMove: "stent" }, { complication: "perforation", firstMove: "balloon-at-hole" }], support: "none", operatorState: "rested", stopRules: { karGy: 50, minutes: 0.5 } });
    a.submitPlan();
    a.startCase();
    expect(a.stopReached()).toBeNull();
    run(x, 40, 1 / 10);
    expect(a.stopReached()).toMatch(/^time 1 min \(limit 0.5 min\)$/);
  });
});

describe("what the attending says reaches the screen (pci-attending fixes)", () => {
  it("each new line replaces the utterances list (a memoised drawer sees it) and is the live view's caption", () => {
    const { x, a } = rig("independent");
    a.startCase();
    expect(x.loadDevice("balloon", "semi-compliant", 2.5, 12)).toBe(true);
    run(x, 0.3);
    const before = a.utterances;
    expect(x.advanceDevice(10)).toBe(false);
    expect(a.utterances).not.toBe(before);
    expect(a.utterances.length).toBe(before.length + 1);
    expect(a.last?.ruleId).toBe("unscreened-device-advance");
    expect(a.last).toBe(a.utterances[a.utterances.length - 1]);
  });

  it("the pedal before the time-out is answered once, in the modes that gate the beam", () => {
    for (const mode of ["supervised", "exam", "independent"] as const) {
      const { x, a } = rig(mode);
      a.startCase();
      x.setPedal({ fluoro: true, cine: false });
      run(x, 0.2);
      x.setPedal({ fluoro: false, cine: false });
      x.pressPedal("cine", true);
      run(x, 0.2);
      x.pressPedal("cine", false);
      const said = a.utterances.filter((u) => u.ruleId === "time-out-beam");
      expect(said.length, mode).toBe(mode === "independent" ? 0 : 1);
      if (said.length) expect(said[0].blocking).toBe(true);
    }
  });
});

describe("the record the debrief reads (pci-attending fixes)", () => {
  it("a recorded injection carries the volume booked at the end of its run, and the record has one case-end", () => {
    const { x, a } = rig("independent");
    a.startCase();
    x.setPedal({ fluoro: true, cine: false });
    run(x, 0.2);
    x.setPedal({ fluoro: false, cine: false });
    const ml0 = x.contrastPushed();
    expect(x.inject({ autoCine: true })).toBe(true);
    run(x, 0.4);
    x.releaseInjection();
    run(x, 5);
    const booked = x.contrastPushed() - ml0;
    expect(booked).toBeGreaterThan(0);
    const inj = x.recorder.events.filter((e) => e.kind === "inject");
    expect(inj.length).toBe(1);
    expect(inj[0].data?.ml).toBeCloseTo(booked, 0);
    a.openSignOut();
    fillSignOut(a);
    expect(a.finishCase()).not.toBeNull();
    expect(x.recorder.events.filter((e) => e.kind === "case-end").length).toBe(1);
  });
});
