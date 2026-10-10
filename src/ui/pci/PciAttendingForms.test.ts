// pci-attending: the pre-brief, plan, time-out and sign-out dialogues render from a live attending (server-side,
// no DOM), the plan form shows a field per step of the fourteen-step plan with its lesson link, the live
// dialogues show no score, and the teaching aid with this patient's contrast rules shows only in guided practice.
//   npx vitest run src/ui/pci/PciAttendingForms.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession, policyForMode } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { PciAttending } from "./usePciAttending";
import PciPrebrief from "./PciPrebrief";
import PciSignOut from "./PciSignOut";
import { PCI_PLAN_FIELDS } from "../../content/mentor/prebriefs";
import { useSeriesStore } from "../../state/useSeriesStore";
import type { LaunchMode } from "../../content/schema";
import { applyIndeflatorAction } from "./inputBindings/indeflator";
import { pathTo } from "../../simulation/pci/geometry";
import type { Complication, Recognition } from "../../simulation/complications/types";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function rig(mode: LaunchMode, scenario = "rca-cto") {
  const r = resolvePciLaunch({ scenario, mode });
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, policy: policyForMode(mode) });
  sessions.push(x);
  return { x, a: new PciAttending(x, { damagedWire: true, absentMember: "physiologist" }) };
}

describe("the attending's dialogues (pci-attending)", () => {
  it("brief, plan, time-out and sign-out render; the plan has the thirteen step fields with lessons and the CTO stopping rules", () => {
    const { a } = rig("guided");
    const brief = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: true, facts: ["guide JR4"] }));
    expect(brief).toContain("Case brief");
    expect(brief).toContain(a.prebrief.presentation.slice(0, 40));
    a.toPlan();
    const plan = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: true, facts: [] }));
    expect(PCI_PLAN_FIELDS).toHaveLength(13);
    expect(PCI_PLAN_FIELDS.map((f) => f.step)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    for (const f of PCI_PLAN_FIELDS) expect(plan).toContain(f.label);
    expect((plan.match(/>Lesson</g) ?? []).length).toBeGreaterThanOrEqual(PCI_PLAN_FIELDS.length);
    expect(plan).toContain("Stopping rules for the CTO attempt");
    expect(plan).toContain("Teaching aid");
    a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "aorto-coronary-dissection", firstMove: "stop-seal-ostium" }, { complication: "perforation", firstMove: "balloon-at-hole" }], support: "standby", operatorState: "rested", stopRules: { karGy: 5 } });
    a.submitPlan();
    const to = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: true, facts: [] }));
    expect(to).toContain("Run the time-out");
    expect(to).toContain("physiologist: out of the room");
    a.startCase();
    a.openSignOut();
    const so = renderToStaticMarkup(h(PciSignOut, { attending: a, variant: "modal", onFinish: () => undefined, onCancel: () => undefined }));
    expect(so).toContain("Sign-out");
    expect(so).toContain("Inspect the wire");
    for (const html of [brief, plan, to, so]) expect(html).not.toMatch(/score|points|percent/i);
  });

  it("outside guided practice the plan form shows no teaching aid", () => {
    for (const mode of ["supervised", "independent", "exam"] as const) {
      const { a } = rig(mode, "lad-focal");
      a.toPlan();
      const html = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: mode === "exam" ? "modal" : "drawer", teachingAids: false, facts: [] }));
      expect(html, mode).not.toContain("Teaching aid");
      expect(html).not.toContain("Stopping rules");
    }
  });
});

/** An overt NHLBI type C dissection at the target, put in by a scripted engine change; recognised or not. */
function dissection(x: PciLabSession, recognised: Recognition | null = null) {
  const L = x.g.lesion;
  const c: Complication = { id: "dissection-1", kind: "dissection", stage: "overt", t0: 1, tOvert: 1, tTreated: null, route: pathTo(x.g, L.vessel), vessel: L.vessel, atMm: L.centreMm, lengthMm: 6, severity: 0.5, grade: "C", cause: "balloon", data: {}, bailouts: [], recognised };
  expect(applyIndeflatorAction(x, "deflate", (st) => ({ ...st, cx: { ...st.cx, list: [c] } }))).toBe(true);
}

const signOutHtml = (a: PciAttending) => renderToStaticMarkup(h(PciSignOut, { attending: a, variant: "drawer", onFinish: () => undefined, onCancel: () => undefined }));

describe("the attending's dialogues after review (pci-attending)", () => {
  it("the sign-out (still the live case) names no complication the learner has not recognised; a recognised one is listed in the learner's words", () => {
    for (const mode of ["supervised", "guided"] as const) {
      const { x, a } = rig(mode, "lad-focal");
      a.startCase();
      dissection(x);
      a.openSignOut();
      expect(a.signOutComplications()).toEqual([]);
      expect(a.pmiAsked()).toBe(false);
      const html = signOutHtml(a);
      expect(html, mode).not.toMatch(/NHLBI|dissection|Ellis/i);
      // guided practice: an unnamed count, as its assessment prompts are; supervised: nothing
      if (mode === "guided") expect(html).toContain("1 change not yet assessed");
      else expect(html).not.toContain("not yet assessed");
      expect(a.signOutBlockers().some((b) => /complication/.test(b))).toBe(false);
    }
    const { x, a } = rig("supervised", "lad-focal");
    a.startCase();
    const rec: Recognition = { t: 2, answer: { cause: "dissection", nhlbi: "B" }, score: { cause: true, grade: false, site: null, timi: null, correct: false, truth: { cause: "dissection", grade: "C", timi: 3 } }, delayS: 1 };
    dissection(x, rec);
    a.openSignOut();
    expect(a.signOutComplications().map((c) => c.label)).toEqual(["Dissection, NHLBI type B (your assessment)"]);
    expect(a.pmiAsked()).toBe(true);
    const html = signOutHtml(a);
    expect(html).toContain("Dissection, NHLBI type B (your assessment)");
    // the engine's grade (type C) is not on the live screen
    expect(html).not.toContain("NHLBI type C");
    expect(a.signOutBlockers()).toContain("Record each complication and how it ended.");
  });

  it("in exams the forms have no lesson links; in supervised practice they do", () => {
    for (const [mode, links] of [["exam", false], ["supervised", true]] as const) {
      const { a } = rig(mode, "lad-focal");
      a.toPlan();
      const plan = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: false, facts: [] }));
      a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "dissection", firstMove: "stent" }, { complication: "perforation", firstMove: "balloon-at-hole" }], support: "none", operatorState: "rested" });
      a.submitPlan();
      const to = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: false, facts: [] }));
      a.startCase();
      a.openSignOut();
      const so = signOutHtml(a);
      for (const html of [plan, to, so]) expect(/>Lesson</.test(html), mode).toBe(links);
    }
  });

  it("the agreed plan reopens read-only and cannot be agreed again; the damaged wire's chosen action shows as chosen", () => {
    const { x, a } = rig("supervised", "lad-focal");
    a.toPlan();
    a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "dissection", firstMove: "stent" }, { complication: "perforation", firstMove: "balloon-at-hole" }], support: "none", operatorState: "rested" });
    a.submitPlan();
    const opened = a.timeOut.openedAt;
    a.startCase();
    a.reopen("plan");
    const html = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "drawer", teachingAids: false, facts: [] }));
    expect(html).toContain("The plan as agreed at the brief");
    expect(html).toMatch(/<fieldset disabled=""/);
    expect(html).not.toContain("Agree the plan");
    expect(html).toContain("Next: the time-out");
    // an edit after agreement is refused; agreeing again moves on without a second 'plan' event or a new time-out clock
    a.setPlan({ contrastCeilingMl: 900 });
    expect(a.plan.contrastCeilingMl).toBe(150);
    a.submitPlan();
    expect(a.stage).toBe("timeout");
    expect(a.timeOut.openedAt).toBe(opened);
    expect(x.recorder.events.filter((e) => e.kind === "plan")).toHaveLength(1);
    // the damaged wire (this rig's variant): 'discard' is shown as the choice made
    a.startCase();
    a.openSignOut();
    a.inspectWire(a.damagedWireKind!);
    a.recordDamagedWire("discard");
    const so = signOutHtml(a);
    expect(so).toMatch(/<input type="radio" name="pci-damaged-wire" checked=""/);
    expect(a.signOut.damagedWireAction).toBe("discard");
  });
});

describe("the plan form's labels (pci-attending fixes)", () => {
  it("no label holds a button (a click on a step's heading must not open its lesson), each step's select is named by its heading, acronyms keep their case", async () => {
    const { lowerFirst } = await import("./PciPrebrief");
    const { a } = rig("supervised");
    a.toPlan();
    const plan = renderToStaticMarkup(h(PciPrebrief, { attending: a, variant: "modal", teachingAids: false, facts: [] }));
    const labels = plan.match(/<label\b[\s\S]*?<\/label>/g) ?? [];
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(l).not.toContain("<button");
    // the support plan is its own set of radio buttons
    for (const f of PCI_PLAN_FIELDS.filter((x) => x.id !== "support")) {
      const m = plan.match(new RegExp(`<label for="([^"]+-${f.id})">`));
      expect(m, f.id).not.toBeNull();
      expect(plan).toContain(`<select id="${m![1]}"`);
    }
    expect(plan).toContain("Target lesion: ACC/AHA class of the target");
    expect(lowerFirst("Coronary dissection")).toBe("coronary dissection");
    expect(lowerFirst("ACC/AHA class")).toBe("ACC/AHA class");
  });
});
