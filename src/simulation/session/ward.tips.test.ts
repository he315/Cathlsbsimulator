// proc-recovery-ward: tip integration and practice links. The ward's events reach the case panel through the
// session's own event log (activeEvents): chest-pain while a chest pain on the ward is unanswered, neuro-deficit once
// a stroke is found (on the ward or on the table), haematoma for a haematoma a site check finds, high-contrast-volume
// when a lab's report takes the contrast over the budget. The recovery workspace reports the access closure with the
// route, the diagnostic finish and, when the case went to PCI, the PCI finish (src/ui/access/caseTips.ts). ward.ts
// exports `raises` for these.
//   npx vitest run src/simulation/session/ward.tips.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { oxfordMobilisation, oxfordSchedule, raises as wardRaises } from "./ward";
import { TIP_BY_ID, tipsFor, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts } from "../../ui/access/caseTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { emptyLabReport } from "./handover";

const PACKAGE = "proc-recovery-ward";
const ids = (ctx: LabContext | undefined) => (ctx ? tipsFor(ctx, 20).map((t) => t.id) : []);
const at = (s: CaseSession, lab: string, phase: string) => caseTipContexts(s, "recovery").find((c) => c.lab === lab && c.phase === phase);

function runWard(s: CaseSession, maxMin: number, done: () => boolean): void {
  const end = s.tS + maxMin * 60;
  while (s.tS < end - 1 && !done()) {
    s.observe(15);
    s.runPending();
  }
}

describe("recovery ward tips in the full case", () => {
  it("in scenario ward-radial, after the action that raises 'chest-pain', tipsFor(ctx, 20) includes pci-post-chest-pain-ward, and after the action that raises 'high-contrast-volume' it includes pci-post-contrast-kidney", () => {
    const s = newCaseSession({ scenario: "ward-radial" }).session;
    // the team's PCI report (the start state's action) took the contrast over the budget: high-contrast-volume
    expect(s.activeEvents()).toContain("high-contrast-volume");
    const pci0 = at(s, "pci", "finish");
    expect(pci0).toBeDefined();
    expect(ids(pci0)).toContain("pci-post-contrast-kidney");
    expect(ids(pci0)).not.toContain("pci-post-chest-pain-ward");
    // the ward runs; the chest pain is reported 50 minutes in and raises chest-pain
    s.setWardPlan(oxfordSchedule("radial", true), oxfordMobilisation("radial-band"));
    runWard(s, 90, () => s.ward.openEvents().length > 0);
    expect(s.ward.openEvents()[0].kind).toBe("chest-pain-post-pci");
    expect(s.activeEvents()).toContain("chest-pain");
    const pci1 = at(s, "pci", "finish");
    expect(ids(pci1)).toContain("pci-post-chest-pain-ward");
    expect(ids(pci1)).toContain("pci-post-contrast-kidney");
    // the access closure tips for the radial route, and the diagnostic finish's neurological check
    const access = at(s, "access", "closure");
    expect(access).toMatchObject({ route: "radial" });
    for (const id of ["access-post-radial-obs", "access-post-pulses-start-end"]) expect(ids(access), id).toContain(id);
    expect(ids(access)).not.toContain("access-post-femoral-mobilise");
    expect(ids(at(s, "diagnostic", "finish"))).toContain("diag-finish-neuro-check");
    // answered: the ECG, then the operator; chest-pain clears with the event (no engine pain in this scenario)
    const e = s.ward.openEvents()[0];
    s.wardAct(e.id, "ecg-12");
    s.runPending();
    s.wardAct(e.id, "call-operator");
    s.runPending();
    s.tick(5);
    expect(s.activeEvents()).not.toContain("chest-pain");
  });

  it("a lab report over the contrast budget is the action that raises high-contrast-volume (a plain case before and after)", () => {
    const s = newCaseSession({ seed: "ward-contrast", access: "radial-right", start: "recovery" }).session;
    expect(s.activeEvents()).not.toContain("high-contrast-volume");
    s.teamLabReport({ ...emptyLabReport("angio-pci"), contrastMl: 400 });
    expect(s.activeEvents()).toContain("high-contrast-volume");
    expect(ids(at(s, "pci", "finish"))).toContain("pci-post-contrast-kidney");
  });

  it("the femoral ward shows the femoral mobilisation tip, and a stroke on the table carries neuro-deficit to the diagnostic contexts", () => {
    const f = newCaseSession({ scenario: "ward-femoral-6f" }).session;
    const access = at(f, "access", "closure");
    expect(access).toMatchObject({ route: "femoral" });
    for (const id of ["access-post-femoral-mobilise", "access-post-pulses-start-end"]) expect(ids(access), id).toContain(id);
    expect(ids(access)).not.toContain("access-post-radial-obs");
    const t = newCaseSession({ scenario: "table-embolic-stroke" }).session;
    t.flush();
    t.runPending();
    const diag = caseTipContexts(t, "closure").filter((c) => c.lab === "diagnostic");
    expect(diag.some((c) => c.events?.includes("neuro-deficit"))).toBe(true);
    expect(ids(diag.find((c) => c.phase === "finish"))).toContain("diag-finish-neuro-check");
  });

  it("every waiting.ts entry naming proc-recovery-ward becomes satisfiable (there are none), and the package's tips are satisfiable by the ward's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the pci lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    const satisfiable = (r: LabRaises, id: string) => {
      const w = TIP_BY_ID[id].when;
      if (w.phase?.length && !w.phase.some((p) => (r.phases as readonly string[]).includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    const of = (lab: string) => wardRaises.find((r) => r.lab === lab)!;
    for (const id of ["access-post-pulses-start-end", "access-post-radial-obs", "access-post-femoral-mobilise"]) expect(satisfiable(of("access"), id), id).toBe(true);
    for (const id of ["pci-post-chest-pain-ward", "pci-post-contrast-kidney"]) expect(satisfiable(of("pci"), id), id).toBe(true);
    expect(satisfiable(of("diagnostic"), "diag-finish-neuro-check")).toBe(true);
    expect(of("diagnostic").events).toContain("neuro-deficit");
  });

  it("practiceIndex lists the scenarios ward-radial, ward-femoral-6f, ward-forearm-haematoma under lessons hb-after-the-procedure-monitoring, pm-monitoring-watch, cm-flow-embolism-stroke (from src/simulation/session/scenarios/ward.launch.ts)", () => {
    for (const lesson of ["hb-after-the-procedure-monitoring", "pm-monitoring-watch", "cm-flow-embolism-stroke"]) {
      const listed = practiceForLesson(lesson).filter((e) => e.sim === "procedure").map((e) => e.scenario);
      for (const id of ["ward-radial", "ward-femoral-6f", "ward-forearm-haematoma"]) expect(listed, `${lesson}:${id}`).toContain(id);
    }
    const known = PRACTICE_INDEX.known.scenarios.get("procedure")!;
    for (const id of ["ward-radial", "ward-femoral-6f", "ward-forearm-haematoma", "ward-chest-pain-post-pci", "ward-tamponade-after-perforation", "ward-stroke-late", "ward-creatinine-rise", "table-embolic-stroke", "followup-cholesterol-emboli"]) {
      expect(known.has(id), id).toBe(true);
      expect(known.get(id)!.file).toMatch(/scenarios\/ward\.launch\.ts$/);
    }
    expect(known.get("table-embolic-stroke")!.starts.has("post-diagnostic")).toBe(true);
    expect(practiceForLesson("cm-flow-embolism-oedema-cholesterol").some((e) => e.scenario === "followup-cholesterol-emboli")).toBe(true);
    expect(practiceForLesson("pm-to-the-root-advance").some((e) => e.scenario === "table-embolic-stroke")).toBe(true);
  });
});
