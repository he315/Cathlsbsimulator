// access-route-decision: the access plan section, the locked planned-access picker and the ultrasound
// view's calipers and site check, rendered to static markup in Node (no DOM; effects do not run). The
// procedure store is replaced by a plain selector hook over a test state holding the session under test.
//   npx vitest run src/ui/access/chart/PlanAccess.test.ts
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../../simulation/session/caseSession";
import { fastForward, gainAccess, prepare } from "../../../simulation/session/autopilot";
import { routePlanOf } from "../../../simulation/session/modules/routePlan";
import { CHART_SECTIONS } from "./index";
import { labSheathNote } from "./PlanAccess";
import { AccessPicker } from "../panels/AccessPicker";
import UltrasoundView from "../UltrasoundView";

const store = vi.hoisted(() => {
  const state: { session: unknown; version: number; summary: null; [k: string]: unknown } = { session: null, version: 0, summary: null };
  state.act = (fn: (s: unknown) => unknown) => fn(state.session);
  for (const k of ["setWorkspace", "setAccess", "finish"]) state[k] = () => undefined;
  const hook = Object.assign((sel: (s: typeof state) => unknown) => sel(state), { getState: () => state });
  return { state, hook };
});
vi.mock("../../../state/useProcedureStore", () => ({ useProcedureStore: store.hook }));

function use(session: CaseSession): CaseSession {
  store.state.session = session;
  store.state.version++;
  return session;
}
const section = CHART_SECTIONS.find((s) => s.id === "plan-access")!;
const render = (s: CaseSession) => renderToStaticMarkup(createElement(section.Component, { session: s, act: <T,>(fn: (x: CaseSession) => T) => fn(s) }));

describe("the access plan section", () => {
  it("is registered and shows the card, the pulses to feel and the plan, and nothing that scores it", () => {
    expect(section).toBeDefined();
    const s = use(newCaseSession({ scenario: "lima-graft" }).session);
    expect(section.applies!(s)).toBe(true);
    const html = render(s);
    expect(html).toContain("Previous CABG: left internal mammary artery, vein grafts.");
    expect(html).toContain('data-pulse="femoral-left"');
    expect(html).toContain("Feel all");
    expect(html).toContain("Radial spasm plan");
    expect(html).toContain("State the plan");
    // the answer is the debrief's: no step, no verdict, no exclusion on the live screen
    for (const word of ["Step 2", "correct", "wrong", "excluded", "preferred"]) expect(html).not.toContain(word);
  });

  it("felt pulses show their finding; a femoral plan has no spasm plan; the plan is fixed after the puncture", () => {
    const s = use(newCaseSession({ scenario: "impalpable-femorals" }).session);
    const m = routePlanOf(s)!;
    m.actions.palpate("femoral-right");
    s.runPending();
    expect(render(s)).toMatch(/Right femoral<\/span><span[^>]*>not palpable/);
    expect(render(s)).not.toContain("Radial spasm plan");
    m.actions.setPlan({ site: "radial-right", fallback: "radial-left" });
    expect(render(s)).toContain("Radial spasm plan");
    prepare(s);
    gainAccess(s);
    const html = render(s);
    expect(html).toContain("The plan is fixed");
    expect(html).toContain("<fieldset");
    expect(html).toMatch(/<fieldset[^>]*disabled/);
  });
});

describe("the pulses at the start beside the end-of-case recheck", () => {
  it("after closure the section shows the pulses felt before access next to the end pulses", () => {
    const s = use(newCaseSession({ scenario: "lima-graft" }).session);
    const m = routePlanOf(s)!;
    m.actions.palpateAll();
    s.runPending();
    m.actions.confirm();
    expect(render(s)).not.toContain("Pulses at the start");
    fastForward(s, "recovery");
    expect(s.closureDone()).toBe(true);
    const start = m.actions.startPulses();
    expect(start.length).toBeGreaterThan(0);
    const html = render(s);
    expect(html).toContain("Pulses at the start (before access)");
    expect(html).toContain("Pulses at the end");
    expect(html.indexOf("Pulses at the start")).toBeLessThan(html.indexOf("Pulses at the end"));
    const block = html.slice(html.indexOf("data-start-pulses"), html.indexOf("Pulses at the end"));
    expect(block).toMatch(/data-pulse="femoral-left"[^]*?normal/);
    // the start grid is a record: nothing in it can be felt again
    expect(block).not.toContain(">Feel<");
  });
});

describe("the planned-access picker", () => {
  it("shows the plan's site before the puncture and does not offer the route buttons", () => {
    const s = use(newCaseSession({ scenario: "lima-graft" }).session);
    let html = renderToStaticMarkup(createElement(AccessPicker));
    expect(html).toContain('data-planned-site="radial-right"');
    expect(html).not.toContain("seg-btn");
    routePlanOf(s)!.actions.setPlan({ site: "ulnar-left" });
    html = renderToStaticMarkup(createElement(AccessPicker));
    expect(html).toContain("Left ulnar");
    expect(html).toContain("radial route in this lab");
  });
});

describe("the plan as the lab runs it", () => {
  it("the plan fieldset can shrink to its card (a long site option does not widen it)", () => {
    const s = use(newCaseSession({ scenario: "lima-graft" }).session);
    expect(render(s)).toMatch(/<fieldset class="[^"]*\bmin-w-0\b/);
  });

  it("says when the lab runs a different sheath from the plan, and only then", () => {
    expect(labSheathNote({ site: "radial-right", sheathFr: 6, sheathType: "standard", lengthCm: 10 })).toBeNull();
    expect(labSheathNote({ site: "radial-right", sheathFr: 6, sheathType: "thin", lengthCm: 10 })).toBeNull();
    expect(labSheathNote({ site: "femoral-right", sheathFr: 7, sheathType: "standard", lengthCm: 45 })).toBeNull();
    expect(labSheathNote({ site: "radial-right", sheathFr: 6, sheathType: "standard", lengthCm: 24 })).toMatch(/6 Fr, 10 cm sheath .*wrist sheaths are 10 cm/);
    expect(labSheathNote({ site: "femoral-right", sheathFr: 8, sheathType: "standard", lengthCm: 10 })).toMatch(/7 Fr, 10 cm sheath \(the lab stocks/);
    expect(labSheathNote({ site: "radial-right", sheathFr: 5, sheathType: "thin", lengthCm: 10 })).toMatch(/as a 5 Fr, 10 cm sheath/);
    const s = use(newCaseSession({ scenario: "spasm-high-risk" }).session);
    expect(render(s)).not.toContain("The case runs this as");
    routePlanOf(s)!.actions.setPlan({ lengthCm: 24 });
    expect(render(s)).toContain("The case runs this as");
  });
});

describe("the ultrasound view", () => {
  it("offers calipers, starts the sheath picker at the plan's sheath and offers the site check once the sheath is in", () => {
    const s = use(newCaseSession({ scenario: "spasm-high-risk" }).session);
    routePlanOf(s)!.actions.setPlan({ sheathFr: 6, sheathType: "thin" });
    let html = renderToStaticMarkup(createElement(UltrasoundView, { session: s, guided: false }));
    expect(html).toContain("Calipers");
    expect(html).toMatch(/<option value="6-thin" selected="">/);
    expect(html).not.toContain("Look at and feel the site");
    prepare(s);
    gainAccess(s, "6-thin");
    html = renderToStaticMarkup(createElement(UltrasoundView, { session: s, guided: false }));
    expect(html).toContain("Look at and feel the site");
    routePlanOf(s)!.actions.inspectSite();
    s.runPending();
    html = renderToStaticMarkup(createElement(UltrasoundView, { session: s, guided: false }));
    expect(html).toContain("no swelling");
  });

  it("a caliper measurement at the wrist is the access plan's radial diameter", () => {
    const s = use(newCaseSession({ scenario: "spasm-high-risk" }).session);
    expect(routePlanOf(s)!.actions.measureRadial("right", 2.04)).toBe(true);
    expect(routePlanOf(s)!.state.radialUs.right).toBe(2.04);
    expect(render(s)).toContain("Right radial on ultrasound: 2.0 mm");
  });
});
