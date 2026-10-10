// access-femoral-upsizing-angiogram: tip integration. The events the upsizing raises are the session's own
// (CASE_SESSION_EVENTS in caseSession.ts: dilator-resistance, pressure-damped, wire-resistance), declared for the
// reachability report through the full case's `raises` (src/ui/access/caseTips.ts reads CASE_SESSION_EVENTS).
import { describe, it, expect } from "vitest";
import { newCaseSession, CASE_SESSION_EVENTS, type CaseSession } from "./caseSession";
import { exchange, navigate } from "./autopilot";
import { TIP_BY_ID, tipsFor, tipScore, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts, raises as caseRaises } from "../../ui/access/caseTips";

const PACKAGE = "access-femoral-upsizing-angiogram";
const TIPS = [
  "access-root-no-hydrophilic-through-needle",
  "access-sheath-two-syringes",
  "access-root-sheath-aspirate-flush",
  "access-femoral-sheath-angiogram",
  "access-dilator-will-not-pass",
  "access-no-waveform-sheath",
  "access-wire-never-push",
  "access-cx-iliac-wire-fluoro",
];

const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);
/** Does any of the case's access contexts at this workspace bring up the tip? */
const shownAt = (s: CaseSession, ws: Parameters<typeof caseTipContexts>[1], id: string) => caseTipContexts(s, ws).filter((c) => c.lab === "access").some((c) => tipScore(TIP_BY_ID[id], c) !== null);

/** The upsizing done the sourced way from the scenario's micro-wire. */
function upsize(s: CaseSession): void {
  for (const step of [() => s.skinNick(), () => s.removeNeedle(), () => s.insertMicroDilator(), () => s.removeInnerDilator(), () => s.insertWire035("standard"), () => s.removeDilator()]) {
    expect(step()).toBe(true);
    s.runPending();
  }
}

describe("upsizing tips in the full case", () => {
  it("in scenario fem-upsizing, after the action that raises 'pressure-damped', tipsFor(ctx, 20) includes access-no-waveform-sheath, and at phase 'sheath' it includes access-sheath-two-syringes", () => {
    const s = newCaseSession({ scenario: "fem-upsizing" }).session;
    upsize(s);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    // at the sheath step, before the sheath is cleared
    expect(s.accessStep()).toEqual({ step: "sheath", site: "femoral", route: "femoral" });
    const atSheath: LabContext = { lab: "access", phase: "sheath", route: "femoral", events: s.activeEvents() };
    expect(ids(atSheath)).toContain("access-sheath-two-syringes");
    expect(ids(atSheath)).toContain("access-root-sheath-aspirate-flush");
    expect(ids(atSheath)).not.toContain("access-no-waveform-sheath");
    // the case's own context at the access workspace says the same
    const own = caseTipContexts(s, "access").find((c) => c.lab === "access")!;
    expect(own.phase).toBe("sheath");
    expect(ids(own)).toContain("access-sheath-two-syringes");
    // the action that raises 'pressure-damped' in this case: the catheter connected to an unflushed line
    s.aspirateSheath();
    s.runPending();
    s.flushSheathSide("fresh");
    s.runPending();
    s.order("heparin-weight");
    s.runPending();
    s.prepCatheter("JR4");
    s.runPending();
    expect(s.loadCatheter("JR4")).toBe(true);
    navigate(s);
    exchange(s, { flushLine: false });
    s.tick(2);
    expect(s.activeEvents()).toContain("pressure-damped");
    const ctx: LabContext = { lab: "access", phase: "sheath", route: "femoral", events: s.activeEvents() };
    expect(ids(ctx)).toContain("access-no-waveform-sheath");
    expect(shownAt(s, "table", "access-no-waveform-sheath")).toBe(true);
  });

  it("a subintimal sheath's damped side arm brings up the no-waveform tip at once", () => {
    const s = newCaseSession({ scenario: "fem-subintimal-sheath" }).session;
    upsize(s);
    s.insertSheath("6");
    s.runPending();
    expect(shownAt(s, "access", "access-no-waveform-sheath")).toBe(false);
    s.transduceSheath();
    expect(s.activeEvents()).toContain("pressure-damped");
    expect(shownAt(s, "access", "access-no-waveform-sheath")).toBe(true);
    expect(ids({ lab: "access", phase: "sheath", route: "femoral", events: s.activeEvents() })).toContain("access-no-waveform-sheath");
  });

  it("each request tip is brought up by the case at the step it belongs to", () => {
    // the wire at the needle: no hydrophilic wire through it, never push
    const w = newCaseSession({ scenario: "fem-upsizing" }).session;
    expect(w.accessStep().step).toBe("wire");
    expect(shownAt(w, "access", "access-root-no-hydrophilic-through-needle")).toBe(true);
    expect(shownAt(w, "access", "access-wire-never-push")).toBe(true);
    // the wire up the iliac on fluoroscopy
    expect(shownAt(w, "fluoro", "access-cx-iliac-wire-fluoro")).toBe(true);
    // the femoral sheath and its angiogram, the dilator that will not pass
    const d = newCaseSession({ scenario: "fem-obese-scar" }).session;
    d.skinNick();
    d.runPending();
    d.removeNeedle();
    expect(d.insertMicroDilator()).toBe(false);
    expect(d.activeEvents()).toContain("dilator-resistance");
    expect(d.accessStep().step).toBe("sheath");
    for (const id of ["access-dilator-will-not-pass", "access-sheath-two-syringes", "access-femoral-sheath-angiogram"]) expect(shownAt(d, "access", id), id).toBe(true);
  });

  it("the upsizing itself raises wire-resistance: the 0.035 inch wire kinking at the skin, and the wire stopping at a subintimal sheath's tip", () => {
    const w = newCaseSession({ scenario: "fem-wire-kinks" }).session;
    upsize(w);
    expect(w.insertSheath("6")).toBe(false);
    expect(w.activeEvents()).toContain("wire-resistance");
    const s = newCaseSession({ scenario: "fem-subintimal-sheath" }).session;
    upsize(s);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    expect(s.activeEvents()).not.toContain("wire-resistance");
    expect(s.loadCatheter("JR4")).toBe(false);
    expect(s.activeEvents()).toContain("wire-resistance");
  });

  it("the case declares the events the upsizing raises, with the sheath and femoral phases and the femoral route", () => {
    for (const e of ["dilator-resistance", "pressure-damped", "wire-resistance"] as const) expect(CASE_SESSION_EVENTS as readonly string[]).toContain(e);
    const access = caseRaises.find((r) => r.lab === "access")!;
    for (const e of ["dilator-resistance", "pressure-damped", "wire-resistance"]) expect(access.events, e).toContain(e);
    for (const p of ["wire", "sheath", "femoral"]) expect(access.phases, p).toContain(p);
    expect(access.routes).toContain("femoral");
  });

  it("every waiting.ts entry naming access-femoral-upsizing-angiogram becomes satisfiable (there are none), and the package's tips are satisfiable by the case's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the access lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    const access = caseRaises.find((r) => r.lab === "access")!;
    const satisfiable = (r: LabRaises, id: string) => {
      const w = TIP_BY_ID[id].when;
      if (w.phase?.length && !w.phase.some((p) => r.phases.includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    for (const id of TIPS) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(access, id), id).toBe(true);
    }
  });
});
