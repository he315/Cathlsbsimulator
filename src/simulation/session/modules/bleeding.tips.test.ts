// access-cx-bleeding-retroperitoneal: the bleeding module's tips. Once the learner says the suspicion, the module
// reports 'bleeding', which opens the case's access complication context (src/ui/access/caseTips.ts), and its own
// PCI complication context with the patient's hypotension.
//   npx vitest run src/simulation/session/modules/bleeding.tips.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { caseTipContexts, raises as caseRaises } from "../../../ui/access/caseTips";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, tipsFor, type LabContext, type LabEvent } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { BLEEDING_EVENTS, bleedingOf, raises } from "./bleeding";

const PKG = "access-cx-bleeding-retroperitoneal";
const ACCESS_TIPS = ["access-cx-rp-in-lab", "access-closure-hypotension-retroperitoneal", "access-bleed-endovascular-control"];
const PCI_TIPS = ["pci-bleed-general-measures", "pci-bleed-bladder-screen", "pci-bleed-antiplatelet-platelets", "pci-protamine-only-after-equipment-out", "pci-post-bleeding-dapt"];

const ids = (ctx: LabContext | undefined | null, n = 20) => (ctx ? tipsFor(ctx, n).map((t) => t.id) : []);
const complication = (s: CaseSession) => caseTipContexts(s, "table").find((c) => c.lab === "access" && c.phase === "complication");
const pciModule = (s: CaseSession) => caseTipContexts(s, "table").find((c) => c.lab === "pci" && c.phase === "complication");

function untilEvent(s: CaseSession, e: LabEvent, maxS: number): boolean {
  for (let t = 0; t <= maxS; t += 5) {
    if (s.activeEvents().includes(e)) return true;
    s.wait(5);
    s.runPending();
  }
  return s.activeEvents().includes(e);
}

describe("retroperitoneal bleed tips", () => {
  it("in scenario rp-on-table, after the action that raises 'bleeding', tipsFor(ctx, 20) includes access-cx-rp-in-lab, and after the action that raises 'hypotension' it includes access-closure-hypotension-retroperitoneal", () => {
    const { session: s } = newCaseSession({ scenario: "rp-on-table" });
    const m = bleedingOf(s)!;
    for (let t = 0; t < 240 && !m.state.episode; t += 5) {
      s.wait(5);
      s.runPending();
    }
    expect(m.state.episode).not.toBeNull();
    // the bleed alone raises nothing: the signs are in the log, the name is the learner's
    expect(s.activeEvents()).not.toContain("bleeding");
    expect(complication(s)).toBeUndefined();
    // the action: the learner says the suspicion out loud, at most 5 s after the onset
    expect(s.tS - m.state.episode!.onsetT).toBeLessThanOrEqual(5);
    m.actions.suspect();
    expect(s.activeEvents()).toContain("bleeding");
    const ctx = complication(s)!;
    expect(ctx).toEqual(expect.objectContaining({ lab: "access", phase: "complication", route: "femoral" }));
    expect(ids(ctx)).toContain("access-cx-rp-in-lab");
    expect(ids(ctx)).toContain("access-bleed-endovascular-control");
    // the PCI context of the module: bleeding first, then the general measures once the pressure is low
    expect(ids(pciModule(s))).toContain("pci-protamine-only-after-equipment-out");
    // the pressure has not fallen yet: no hypotension tips
    expect(s.activeEvents()).not.toContain("hypotension");
    expect(ids(complication(s))).not.toContain("access-closure-hypotension-retroperitoneal");
    expect(ids(pciModule(s))).not.toContain("pci-bleed-general-measures");
    // the bleed goes on until the patient's pressure falls ('hypotension' through the shared adapter)
    expect(untilEvent(s, "hypotension", 900)).toBe(true);
    expect(ids(complication(s))).toContain("access-closure-hypotension-retroperitoneal");
    const pci = ids(pciModule(s));
    expect(pci).toContain("pci-bleed-general-measures");
    expect(pci).toContain("pci-bleed-bladder-screen");
    expect(pci).toContain("pci-bleed-antiplatelet-platelets");
  });

  it("a femoral case without the learner's suspicion reports no bleeding context", () => {
    const { session: s } = newCaseSession({ seed: "rp-tips-none", access: "femoral", start: "closure" });
    const m = bleedingOf(s)!;
    expect(m.events!()).toEqual([]);
    expect(m.tipContexts!()).toEqual([]);
  });

  it("raises names only registered events and phases, and every waiting.ts entry naming this package becomes satisfiable", () => {
    for (const e of BLEEDING_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) {
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const p of r.phases) expect(LAB_PHASES[r.lab] as readonly string[]).toContain(p);
    }
    const declared: LabRaises[] = [...raises, ...caseRaises];
    const satisfiable = (tipId: string): boolean => {
      const tip = TIP_BY_ID[tipId];
      if (!tip) return false;
      const lab = declared.filter((r) => r.lab === tip.lab);
      const events = [...new Set(lab.flatMap((r) => [...r.events]))];
      const routes: (LabContext["route"] | undefined)[] = [undefined, ...new Set(lab.flatMap((r) => [...(r.routes ?? [])]))];
      const phases: (string | undefined)[] = [undefined, ...new Set(lab.flatMap((r) => [...r.phases]))];
      return phases.some((phase) => routes.some((route) => tipsFor({ lab: tip.lab, ...(phase ? { phase: phase as LabContext["phase"] } : {}), ...(route ? { route } : {}), events }, 1000).some((t) => t.id === tipId)));
    };
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    for (const id of waiting) expect(satisfiable(id), id).toBe(true);
    // waiting.ts names no tip or retarget for this package (its tips wait on proc-tip-context), so the access
    // lab's waiting count falls by at least their number (none) ...
    expect(waiting.length + deferred.length).toBe(0);
    // ... and the request's tips are all satisfiable from what the case and this module declare
    for (const id of [...ACCESS_TIPS, ...PCI_TIPS]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(id), id).toBe(true);
    }
  });

  it("every ledger record this module writes names tips that exist", () => {
    const { session: s } = newCaseSession({ scenario: "rp-recovery-stable" });
    const m = bleedingOf(s)!;
    for (let t = 0; t < 240 && !m.state.episode; t += 5) {
      s.wait(5);
      s.runPending();
    }
    m.actions.suspect();
    for (const id of ["large-bore", "crossmatch", "hb", "crystalloid", "platelets"] as const) m.actions.order(id);
    m.actions.ct();
    m.actions.protamine(30, "slow");
    const mine = s.decisions().filter((d) => d.id.startsWith("rp-"));
    expect(mine.length).toBeGreaterThanOrEqual(4);
    for (const d of mine) for (const id of d.tipIds ?? []) expect(TIP_BY_ID[id], `${d.id}: ${id}`).toBeDefined();
  });
});
