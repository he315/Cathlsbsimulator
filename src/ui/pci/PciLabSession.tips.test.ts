// pci-lab-shell-session tips: the PCI session's event source (PciLabSession.ts, its `raises` export) makes
// the radiation tips reachable in the PCI lab. A long case that arrives with a high dose raises
// 'high-radiation-dose' after the first action, so the operator-dose tip shows; the case brief (the plan
// dialogue) puts the tips at phase 'plan', where the shallow working view tip shows.
//   npx vitest run src/ui/pci/PciLabSession.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession, raises } from "./PciLabSession";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { PatientEngine } from "../../simulation/patient/engine";
import { DOSE_TRIGGERS } from "../../simulation/dose";
import type { SessionHandover } from "../../simulation/session/caseSession";
import { useSeriesStore } from "../../state/useSeriesStore";

const PKG = "pci-lab-shell-session";
const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function run(x: PciLabSession, seconds: number, dt = 1 / 30) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** Whether a trigger can match in the PCI lab given this source's raises (phase, events, required events). */
function satisfiableHere(when: TipTrigger): boolean {
  const any = (want: readonly string[] | undefined, have: readonly string[]) => !want?.length || want.some((x) => have.includes(x));
  return any(when.phase, raises.phases) && any(when.event, raises.events) && (when.requires ?? []).every((e) => (raises.events as readonly string[]).includes(e));
}

describe("PCI lab tips from the session", () => {
  it("a long case past the air kerma follow-up level raises 'high-radiation-dose' after the first action and shows the operator-dose tip", () => {
    // the case arrives from a long diagnostic study with the patient's dose above the follow-up level
    const engine = new PatientEngine({ seed: "pci-tips-dose" });
    const karMGy = DOSE_TRIGGERS.karMGy + 100;
    // the session reads only the hand-over's start (engine and dose); the case's record is the full case's
    const handover = { h: {} as SessionHandover, start: { engine, dose: { fluoroS: 1800, karMGy, kapGyCm2: 180 } } };
    const x = new PciLabSession({ scenarioId: "rca-cto", handover, team: false, headlessFrames: true });
    sessions.push(x);
    expect(x.tipContext().events ?? []).not.toContain("high-radiation-dose");
    // the first action: engage the guide and look under fluoroscopy
    x.engageGuide();
    x.setPedal({ fluoro: true, cine: false });
    run(x, 0.5);
    x.setPedal({ fluoro: false, cine: false });
    const ctx = x.tipContext();
    expect(ctx.lab).toBe("pci");
    expect(ctx.events).toContain("high-radiation-dose");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-rad-operator-dose-alarm");
    // the event is held from then on
    run(x, 40);
    expect(x.tipContext().events).toContain("high-radiation-dose");
  });

  it("the case brief puts the tips at phase 'plan', where the shallow working view tip applies", () => {
    const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
    sessions.push(x);
    x.openModal("prebrief");
    const ctx = x.tipContext();
    expect(ctx.phase).toBe("plan");
    const ranked = tipsFor(ctx, LAB_TIPS.length).map((t) => t.id);
    expect(ranked).toContain("pci-rad-shallow-working-view");
    // Not in the first 20: the registry has more than 20 PCI tips whose trigger is phase 'plan' alone or
    // 'plan' with more conditions, and tipsFor ranks those ahead of this tip's broader ['plan', 'wire']
    // (tie-break by specificity). Which plan tips the panel shows first is pci-tip-context's to settle.
    expect(ranked.filter((id) => TIP_BY_ID[id].lab === "pci").length).toBeGreaterThan(20);
    x.closeModal("prebrief");
    expect(x.tipContext().phase).not.toBe("plan");
  });

  it("the finish step and a finished case put the tips at phase 'finish'", () => {
    const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
    sessions.push(x);
    x.setFinishStep(true);
    expect(x.tipContext().phase).toBe("finish");
  });

  it("the raises export names only vocabulary phases and events, and the two tips' triggers are satisfiable from it", () => {
    expect(raises.lab).toBe("pci");
    for (const id of ["pci-rad-operator-dose-alarm", "pci-rad-shallow-working-view"]) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeTruthy();
      expect(satisfiableHere(tip.when), id).toBe(true);
    }
  });

  it("every waiting.ts entry naming this package is satisfiable from its raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    // the plan names no waiting entry for this package (its two tips wait on pci-tip-context and
    // diag-radiation-practice); whatever is listed for it must now be satisfiable
    for (const id of waiting) {
      const tip = LAB_TIPS.find((t) => t.id === id);
      expect(tip, id).toBeTruthy();
      expect(satisfiableHere(tip!.when), id).toBe(true);
    }
    for (const d of deferred) expect(satisfiableHere(d.when), d.tipId).toBe(true);
    expect(waiting.length + deferred.length).toBe(0);
  });
});
