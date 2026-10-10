// proc-discharge-prescription: the discharge module's tips. While the prescription is open the module reports the
// PCI finish (pci-post-dapt-plan, pci-post-oac-clopidogrel), with 'bleeding' once a bleed has occurred
// (pci-post-bleeding-dapt); the case panel takes the module's context through session.moduleTipContexts()
// (src/ui/access/caseTips.ts).
//   npx vitest run src/simulation/session/modules/discharge.tips.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession } from "../caseSession";
import { caseTipContexts, isModuleTipContext } from "../../../ui/access/caseTips";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, tipScore, tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import { referencePlan, dischargePatient } from "../discharge";
import { DISCHARGE_EVENTS, dischargeOf, raises } from "./discharge";

const PKG = "proc-discharge-prescription";
const ids = (ctx: LabContext | undefined) => (ctx ? tipsFor(ctx, 20).map((t) => t.id) : []);
const TIPS = ["pci-post-dapt-plan", "pci-post-oac-clopidogrel", "pci-post-bleeding-dapt"];

describe("discharge prescription tips", () => {
  it("in scenario dapt-stable, after the action that raises 'bleeding', tipsFor(ctx, 20) includes pci-post-bleeding-dapt, and at phase 'finish' it includes pci-post-dapt-plan", () => {
    const s = newCaseSession({ scenario: "dapt-stable" }).session;
    const m = dischargeOf(s)!;
    expect(m).toBeDefined();
    // closed: no module context
    expect(s.moduleTipContexts()).toEqual([]);
    m.actions.setOpen(true);
    const ctx0 = s.moduleTipContexts()[0];
    expect(ctx0).toMatchObject({ lab: "pci", phase: "finish" });
    expect(ids(ctx0)).toContain("pci-post-dapt-plan");
    expect(ids(ctx0)).toContain("pci-post-oac-clopidogrel");
    expect(ids(ctx0)).not.toContain("pci-post-bleeding-dapt");
    // the case panel carries it as the module's context
    const fromPanel = caseTipContexts(s, "handover").find(isModuleTipContext);
    expect(fromPanel).toMatchObject({ lab: "pci", phase: "finish" });
    // sign, then the follow-up visit: the nosebleeds raise 'bleeding' in the module's context
    expect(m.actions.sign(referencePlan(m.state!.case, dischargePatient(s.profile)))).toBe(true);
    s.runPending();
    expect(m.actions.followUp()).toMatch(/nosebleeds/);
    s.runPending();
    const ctx1 = s.moduleTipContexts()[0];
    expect(ctx1.events).toContain("bleeding");
    expect(ids(ctx1)).toContain("pci-post-bleeding-dapt");
    expect(ids(ctx1)).toContain("pci-post-dapt-plan");
    // the bleed is the module's context only: the access complication context does not open for it
    expect(s.activeEvents()).not.toContain("bleeding");
    expect(caseTipContexts(s, "handover").some((c) => c.lab === "access" && c.phase === "complication")).toBe(false);
    // answered and scored: on clopidogrel, the site controlled and the antiplatelets kept
    expect(m.actions.answerBleed("local-continue")).toBe(true);
    expect(s.decisions().find((d) => d.id === "discharge-bleed-response")!.correct).toBe(true);
    // closed again: nothing
    m.actions.setOpen(false);
    expect(s.moduleTipContexts()).toEqual([]);
  });

  it("raises names only registered events and phases, its tips are satisfiable from it, and every waiting.ts entry naming this package is satisfiable", () => {
    for (const e of DISCHARGE_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) {
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const ph of r.phases) expect((LAB_PHASES as Record<string, readonly string[]>)[r.lab]).toContain(ph);
    }
    // each tip the request names is satisfied by a context this module's raises allow
    const full: LabContext = { lab: "pci", phase: "finish", events: [...DISCHARGE_EVENTS] };
    for (const id of TIPS) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(tipScore(TIP_BY_ID[id], full), id).not.toBeNull();
    }
    // waiting.ts names no tip or retarget for this package (the three tips wait on pci-tip-context), so the
    // count of entries naming it, and with it the pci lab's waiting count from them, falls to zero
    // (should one be added, the check above, each tip satisfiable from this module's raises, is the one to extend to it)
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
  });
});
