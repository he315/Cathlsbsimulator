// Tips of the ad hoc PCI from the full case (pci-adhoc-handover), driven in the case's own scenario: the adhoc-heparin
// case handed straight to the PCI lab with the study report's target. The context takes the lesion events from the
// generated definition; the phase is 'guide' until the guide is engaged and 'low-act' is held until an ACT at the
// case's PCI target; at phase 'finish', after a complication that became overt and an air kerma over the follow-up
// level, the post-procedure tips pci-post-complication-candour and pci-post-radiation-follow-up are shown; a dissection
// the engine draws from an oversized balloon inflated through the session reaches the finish context and the report. The
// events come from the PCI lab's event sources (base.ts declares them in `raises`); waiting.ts names no entry for
// this package, so none is left waiting on it.
//   npx vitest run src/ui/lab/pciEvents/adhocHandover.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { newCaseSession, type CaseSession } from "../../../simulation/session/caseSession";
import { lesionIdOf } from "../../../simulation/session/handover";
import { seedDose } from "../../sim/labSession";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pathTo } from "../../../simulation/pci/geometry";
import { PCI_FINISH_FLAGS } from "../../../simulation/pci/scenarios/fromCase";
import { PciLabSession, policyForMode, type PciHandover } from "../../pci/PciLabSession";
import { caseLaunchFor, caseReportOf, prepareHandedOver } from "../../pci/PciLab";
import { pciTipContext } from "../pciTips";
import { withRecognition } from "./recognition";
import { recordAct } from "../../../simulation/angioPci";
import { applyDeliveryAction } from "../../pci/inputBindings/support";

const PKG = "pci-adhoc-handover";
const TIPS = ["pci-post-complication-candour", "pci-post-radiation-follow-up"];

/** Every raises export the reachability report reads (the same globs as src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../pciEvents/*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
const declared = (): LabRaises[] =>
  Object.values(RAISE_MODULES)
    .filter((exp) => !!exp)
    .flatMap((exp) => (Array.isArray(exp) ? exp : [exp as LabRaises]))
    .filter((r) => r.lab === "pci");

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(when: LabTip["when"], list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  return any(when.phase, u("phases")) && any(when.event, u("events")) && (when.requires ?? []).every((e) => u("events").has(e)) && any(when.imaging, u("imaging"));
}

const sessions: PciLabSession[] = [];
const cases: CaseSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  for (const s of cases.splice(0)) s.dispose();
  useSeriesStore.getState().clear();
});

/** The adhoc-heparin case handed straight to the PCI lab with its most severe lesion as the report's target. */
function rig(start = "guide-in-root") {
  const { session: s, engine } = newCaseSession({ scenario: "adhoc-heparin", mode: "independent" });
  cases.push(s);
  const l = [...s.caseData.lesions].sort((a, b) => b.severity - a.severity)[0];
  s.closePciGate();
  const h = s.toPci({ target: { vessel: l.vessel, segment: null, qcaPct: null, lengthMm: null, lesionId: lesionIdOf(l), strategy: "adhoc" } })!;
  const handover: PciHandover = { h, start: { engine, dose: { fluoroS: h.fluoroS, karMGy: h.karMGy, kapGyCm2: h.kapGyCm2 }, catheterId: h.catheterId } };
  const launch = caseLaunchFor(handover, { start })!;
  const x = new PciLabSession({ launch, handover, team: false, headlessFrames: true, policy: policyForMode(launch.mode) });
  sessions.push(x);
  prepareHandedOver(x, handover);
  return { s, x, handover };
}

const run = (x: PciLabSession, sec: number, dt = 0.1) => {
  for (let t = 0; t < sec - 1e-9; t += dt) x.step(dt);
};

describe("ad hoc PCI from the full case: tips (pci-adhoc-handover)", () => {
  it("the lesion events come from the generated definition; phase 'guide' until engaged; 'low-act' until the ACT target", () => {
    const { x } = rig();
    const ctx = pciTipContext(withRecognition(x.snapshot()));
    expect(ctx.phase).toBe("guide");
    expect(ctx.events).toContain("low-act");
    // the run's held events are the definition's scenario events (the target lesion's sites and the case's events)
    for (const e of x.resolved.events) expect(x.activeEvents()).toContain(e);
    // the guide engaged through the session's own action: phase 'guide' gives way
    expect(x.engageGuide()).toBe(true);
    run(x, 0.5);
    expect(x.st.guide.engaged).toBe(true);
    expect(x.tipContext().phase).not.toBe("guide");
    expect(pciTipContext(withRecognition(x.snapshot())).phase).not.toBe("guide");
  });

  it("a dissection raised by the engine (an oversized balloon inflated through the session) reaches the finish context and the lab's report", () => {
    const { x, handover } = rig("wire-across");
    // the ACT at target first (the lab's ACT gate), then an oversized balloon at high pressure, until the engine draws a dissection
    x.engine.give({ drug: "heparin", dose: handover.h.pciReady!.heparinTopUpU + 2000, route: "iv" });
    run(x, 30, 0.5);
    applyDeliveryAction(x, "drug", (st) => recordAct(st, x.engine.measureAct()));
    const ref = x.g.lesion.refDiameter;
    for (let k = 0; k < 8 && !x.st.cx.list.some((c) => c.kind === "dissection"); k++) {
      expect(x.loadDevice("balloon", "non-compliant", Math.round(ref * 1.4 * 4) / 4, 15)).toBe(true);
      x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm);
      x.inflate(20);
      run(x, 1);
      x.deflate();
      x.removeDevice();
      run(x, 1);
    }
    const d = x.st.cx.list.find((c) => c.kind === "dissection");
    expect(d, "the engine drew a dissection").toBeDefined();
    // the dissection shows on a run (it becomes overt), then the finish
    for (let k = 0; k < 60 && x.st.cx.list.find((c) => c.id === d!.id)!.tOvert === null; k++) run(x, 1);
    x.setFinishStep(true);
    const ctx = pciTipContext(withRecognition(x.snapshot()));
    expect(ctx.phase).toBe("finish");
    const rep = caseReportOf(x);
    // the case's seed and these actions draw it deterministically, and it is overt
    expect(x.st.cx.list.find((c) => c.id === d!.id)!.tOvert).not.toBeNull();
    expect(ctx.events).toContain("dissection");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-post-complication-candour");
    expect(rep.complications.map((c) => c.id)).toContain(d!.id);
    expect(rep.events).toContain("dissection");
  });

  it("at phase 'finish', after a complication and an air kerma over 5 Gy, tipsFor(ctx, 20) includes pci-post-complication-candour and pci-post-radiation-follow-up", () => {
    const { x } = rig("wire-across");
    run(x, 1);
    // before: neither tip at finish
    x.setFinishStep(true);
    const before = tipsFor(pciTipContext(withRecognition(x.snapshot())), 20).map((t) => t.id);
    for (const id of TIPS) expect(before).not.toContain(id);
    x.setFinishStep(false);
    // the air kerma passes the follow-up level (the lab's own dose event)
    seedDose(x.lab.dose, { fluoroS: 0, karMGy: 5000 - x.lab.dose.totals.karMGy.total + 200, kapGyCm2: 1 });
    run(x, 0.5);
    expect(x.activeEvents()).toContain("high-radiation-dose");
    // a dissection that became overt during the case (the engine's complication record)
    const L = x.g.lesion;
    const st = { ...x.st, cx: { ...x.st.cx, list: [{ id: "dissection-1", kind: "dissection" as const, stage: "treated" as const, t0: 10, tOvert: 12, tTreated: 30, route: pathTo(x.g, L.vessel), vessel: L.vessel, atMm: L.centreMm, lengthMm: 6, severity: 0.5, grade: "C", cause: "balloon", data: {}, bailouts: [] }] } };
    x.setFinishStep(true);
    const ctx = pciTipContext(withRecognition({ ...x.snapshot(), state: st }));
    expect(ctx.phase).toBe("finish");
    expect(ctx.events).toEqual(expect.arrayContaining(["dissection", "high-radiation-dose"]));
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(TIPS));
    // the report the lab returns carries the dose flag (and the complication's event once the engine has one)
    expect(caseReportOf(x).events).toContain("high-radiation-dose");
  });

  it("every waiting.ts entry naming pci-adhoc-handover is satisfiable (there are none); the two tips are reachable from the PCI lab's raises", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
    const list = declared();
    for (const id of TIPS) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(TIP_BY_ID[id].when, list), id).toBe(true);
    }
    // the finish flags the case keeps are vocabulary names
    for (const e of PCI_FINISH_FLAGS) expect(LAB_EVENTS as readonly string[]).toContain(e);
  });
});
