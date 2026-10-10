// proc-tip-context: the full case's tip context (caseTips.ts) and the session's access step and tip
// events (caseSession.ts accessStep, activeEvents, noteTipsShown).
//   npx vitest run src/ui/access/caseTips.test.ts
import { describe, expect, it } from "vitest";
import * as TIPS from "../../content/lab/tips";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../content/lab/tips";
import { MP_TIPS, newCaseSession, type CaseSession, type Workspace } from "../../simulation/session/caseSession";
import type { ProcedureScenario } from "../../simulation/session/scenarios/index";
import { aimedPose, advanceToFlash, exchange, gainAccess, navigate, prepare } from "../../simulation/session/autopilot";
import { tubeAt } from "../../simulation/access/site";
import { tipsVisible } from "../lab/useLabTips";
import { CASE_TIP_LIMITS, caseTipContexts, caseTipLimits, caseTipScore, fitsSite, fitsStep, raises, selectCaseTips } from "./caseTips";

const WORKSPACES: Workspace[] = ["chart", "access", "fluoro", "table", "closure", "recovery", "handover"];

/** The tips the panel shows in guided practice for this session and workspace. */
const shown = (s: CaseSession, w: Workspace): LabTip[] => selectCaseTips(TIPS, caseTipContexts(s, w), true, caseTipLimits(w));
const ids = (t: readonly LabTip[]) => t.map((x) => x.id);

/** A tip written for the femoral route only: its trigger names routes, none of them radial, or names the femoral site phase and not the radial one. */
const femoralOnly = (t: LabTip) =>
  (!!t.when.route?.length && !t.when.route.some((r) => r === "radial" || r === "distal-radial")) || (!!t.when.phase?.includes("femoral") && !t.when.phase.includes("radial"));

/** A tip written for the radial site only (the mirror of femoralOnly). */
const radialOnly = (t: LabTip) => (!!t.when.route?.length && !t.when.route.includes("femoral")) || (!!t.when.phase?.includes("radial") && !t.when.phase.includes("femoral"));

/** Every tip any context of the case could match now with the panel's own scoring (caseTipScore), beyond the panel's caps. */
const everyMatch = (s: CaseSession, w: Workspace): LabTip[] => caseTipContexts(s, w).flatMap((c) => TIPS.LAB_TIPS.filter((t) => caseTipScore(TIPS, t, c) !== null));

describe("access step, site and route", () => {
  it("a femoral session reports puncture, wire and sheath in turn, with route femoral; the step ends once the sheath is flushed", () => {
    const { session: s } = newCaseSession({ seed: "tips-fem-step", access: "femoral" });
    prepare(s);
    expect(s.accessStep()).toEqual({ step: "puncture", site: "femoral", route: "femoral" });
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    // a wire that has not yet run free is still the puncture
    expect(s.accessStep().step).toBe("puncture");
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.pm.st.wire?.state).toBe("intraluminal");
    expect(s.accessStep().step).toBe("wire");
    expect(s.removeNeedle()).toBe(true);
    expect(s.accessStep().step).toBe("sheath");
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    expect(s.accessStep()).toEqual({ step: "sheath", site: "femoral", route: "femoral" });
    const [ctx] = caseTipContexts(s, "access");
    expect(ctx).toMatchObject({ lab: "access", phase: "sheath", phases: ["femoral"], route: "femoral" });
    expect(ids(shown(s, "access"))).toContain("access-sheath-two-syringes");
    expect(ids(everyMatch(s, "access"))).toContain("access-root-sheath-aspirate-flush");
    // the femoral puncture tips have gone with the step
    expect(ids(shown(s, "access"))).not.toContain("access-needle-flashback-check");
    s.flushSheath();
    s.runPending();
    expect(s.accessStep().step).toBeNull();
    // the access workspace then reports the sheath in place at the site, as the table does
    expect(caseTipContexts(s, "access")[0]).toMatchObject({ lab: "access", phase: "sheath", phases: ["femoral"], route: "femoral" });
    expect(caseTipContexts(s, "table")[0]).toMatchObject({ lab: "access", phase: "sheath", route: "femoral" });
    // so the planning, puncture and wire tips of the groin do not return
    const after = ids(everyMatch(s, "access"));
    for (const id of ["access-planning-hostile-groin", "access-needle-flashback-check", "access-cx-iliac-wire-fluoro"]) expect(after, id).not.toContain(id);
  });

  it("after closure the access workspace reports the closure at the site", () => {
    const { session: s } = newCaseSession({ seed: "tips-rad-closed", access: "radial-right", start: "closure" });
    s.applyBand(10);
    s.runPending();
    s.pullRadialSheath();
    expect(s.closureDone()).toBe(true);
    expect(s.accessStep().step).toBeNull();
    expect(caseTipContexts(s, "access")[0]).toMatchObject({ lab: "access", phase: "closure", phases: ["radial"], route: "radial" });
    expect(ids(shown(s, "access"))).toEqual(expect.arrayContaining(["access-radial-patency-check"]));
  });

  it("in guided practice at the femoral puncture the panel lists access-femoral-scan-bifurcation and access-needle-flashback-check", () => {
    const { session: s } = newCaseSession({ seed: "tips-fem-scan", access: "femoral" });
    prepare(s);
    expect(s.mode).toBe("guided");
    const list = ids(shown(s, "access"));
    expect(list).toEqual(expect.arrayContaining(["access-femoral-scan-bifurcation", "access-needle-flashback-check"]));
    expect(list.length).toBeLessThanOrEqual(caseTipLimits("access").total);
    // the femoral wire and sheath tips wait for their step
    expect(list).not.toContain("access-cx-iliac-wire-fluoro");
    expect(list).not.toContain("access-root-iliac-long-sheath");
    expect(TIP_BY_ID["access-cx-iliac-wire-fluoro"].when.phase).toEqual(["wire", "femoral"]);
  });

  it("a radial session never yields a femoral-only tip, at any step or workspace", () => {
    const { session: s } = newCaseSession({ seed: "tips-rad-wrist", access: "radial-right" });
    const seen = new Set<string>();
    const check = () => {
      for (const w of WORKSPACES) {
        for (const t of everyMatch(s, w)) {
          seen.add(t.id);
          expect(femoralOnly(t), `${t.id} at ${w}, step ${s.accessStep().step}`).toBe(false);
        }
        for (const t of shown(s, w)) expect(femoralOnly(t), t.id).toBe(false);
      }
    };
    check();
    prepare(s);
    expect(s.accessStep()).toEqual({ step: "puncture", site: "radial", route: "radial" });
    check();
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.accessStep().step).toBe("wire");
    check();
    s.removeNeedle();
    s.insertSheath("6");
    s.runPending();
    expect(s.accessStep().step).toBe("sheath");
    check();
    s.flushSheath();
    s.runPending();
    s.order("heparin-radial");
    s.runPending();
    check();
    // the radial puncture tips were reachable on the way
    expect(seen.has("access-radial-one-ml-local")).toBe(true);
    expect(seen.has("access-needle-flashback-check")).toBe(true);
  });

  it("a radial case with an arm perforation shows no femoral sheath or groin tip at the table or chart", () => {
    const { session: s } = newCaseSession({ seed: "tips-perf", access: "radial-right", start: "sheath-in" });
    s.wire = { ...s.wire, perforation: true };
    s.wait(5);
    s.runPending();
    expect(s.activeEvents()).toContain("bleeding");
    // tipScore alone would match it: its phases [sheath, femoral] meet the table's sheath context
    expect(TIP_BY_ID["access-sheath-ooze-upsize"].when.phase).toEqual(["sheath", "femoral"]);
    expect(ids(tipsFor(caseTipContexts(s, "table")[0], 1000))).toContain("access-sheath-ooze-upsize");
    expect(ids(shown(s, "table"))).not.toContain("access-sheath-ooze-upsize");
    expect(ids(everyMatch(s, "table"))).not.toContain("access-sheath-ooze-upsize");
    expect(ids(everyMatch(s, "chart"))).not.toContain("access-planning-hostile-groin");
    for (const w of WORKSPACES) {
      for (const t of shown(s, w)) expect(femoralOnly(t), `${t.id} at ${w}`).toBe(false);
      for (const t of everyMatch(s, w)) expect(femoralOnly(t), `${t.id} at ${w}`).toBe(false);
    }
  });

  it("the site filter drops tips written for the other site in every access context with a route, and passes the rest", () => {
    const ooze = TIP_BY_ID["access-sheath-ooze-upsize"];
    expect(fitsSite(ooze, { lab: "access", phase: "sheath", route: "radial" })).toBe(false);
    expect(fitsSite(ooze, { lab: "access", phase: "sheath", route: "femoral" })).toBe(true);
    expect(fitsSite(TIP_BY_ID["access-planning-hostile-groin"], { lab: "access", phase: "plan", route: "radial" })).toBe(false);
    // the other way: a radial tip in a femoral complication or closure context
    const noTraction = TIP_BY_ID["access-radial-spasm-no-traction"];
    expect(radialOnly(noTraction)).toBe(true);
    for (const phase of ["complication", "closure"] as const) {
      const ctx: LabContext = { lab: "access", phase, route: "femoral", events: ["radial-spasm"] };
      expect(fitsSite(noTraction, ctx)).toBe(false);
      expect(caseTipScore(TIPS, noTraction, ctx)).toBeNull();
    }
    // a tip naming no site phase, or a context without a route or of another lab, is not filtered
    expect(fitsSite(TIP_BY_ID["access-needle-flashback-check"], { lab: "access", phase: "puncture", route: "radial" })).toBe(true);
    expect(fitsSite(ooze, { lab: "access", phase: "sheath" })).toBe(true);
    expect(fitsSite(ooze, { lab: "diagnostic", phase: "setup", route: "radial" })).toBe(true);
  });

  it("at the femoral puncture of an acute coronary syndrome with a patient event, access-femoral-scan-bifurcation keeps its place", () => {
    const { session: s, engine } = newCaseSession({ seed: "tips-fem-acs", access: "femoral", indication: "STEMI" });
    prepare(s);
    expect(s.accessStep().step).toBe("puncture");
    // a cuff reading of 70/40 (50) held past the adapter's hold: hypotension joins the presentation's events
    const real = engine.vitals.bind(engine);
    engine.vitals = () => {
      const v = real();
      return { ...v, nibp: { sys: 70, dia: 40, mean: 50, at: v.t } };
    };
    s.wait(20);
    s.runPending();
    expect(s.activeEvents()).toContain("hypotension");
    const ctxs = caseTipContexts(s, "access");
    expect(ctxs.filter((c) => !c.phase).map((c) => c.lab)).toEqual(["diagnostic", "pci", "haemo"]);
    const list = ids(shown(s, "access"));
    expect(list).toEqual(expect.arrayContaining(["access-femoral-scan-bifurcation", "access-needle-flashback-check"]));
    expect(list.length).toBeLessThanOrEqual(caseTipLimits("access").total);
    // without an event, the tips of the step rank before the site-only ones
    const access = selectCaseTips(TIPS, ctxs.filter((c) => c.lab === "access"), true, caseTipLimits("access"));
    const fromEvent = (t: LabTip) => !!t.when.event?.length;
    const quiet = access.filter((t) => !fromEvent(t));
    const firstSiteOnly = quiet.findIndex((t) => !t.when.phase?.includes("puncture"));
    const lastStep = quiet.map((t) => !!t.when.phase?.includes("puncture")).lastIndexOf(true);
    if (firstSiteOnly >= 0 && lastStep >= 0) expect(lastStep).toBeLessThan(firstSiteOnly);
  });
});

describe("closure by route", () => {
  it("{ lab:'access', phase:'closure', route:'radial' } returns the three radial technique tips within the default limit, and no femoral tip", () => {
    const ctx: LabContext = { lab: "access", phase: "closure", route: "radial" };
    const list = tipsFor(ctx);
    expect(ids(list)).toEqual(expect.arrayContaining(["access-radial-remove-now", "access-radial-band-inflation", "access-radial-patency-check"]));
    expect(list.some(femoralOnly)).toBe(false);
    // and a femoral closure shows no radial-only tip
    const fem = tipsFor({ lab: "access", phase: "closure", route: "femoral" }, 100);
    expect(fem.some((t) => !!t.when.route?.length && !t.when.route.includes("femoral"))).toBe(false);
    expect(ids(fem)).toEqual(expect.arrayContaining(["access-closure-high-stick", "access-plug-size-to-sheath", "access-compression-hands-above"]));
  });

  it("at a radial closure in the case the panel shows the three radial technique tips", () => {
    const { session: s } = newCaseSession({ seed: "tips-rad-close", access: "radial-right", start: "closure" });
    expect(s.sheath).not.toBeNull();
    const ctxs = caseTipContexts(s, "closure");
    expect(ctxs[0]).toMatchObject({ lab: "access", phase: "closure", route: "radial" });
    expect(ctxs.some((c) => c.lab === "diagnostic" && c.phase === "finish")).toBe(true);
    const list = shown(s, "closure");
    expect(ids(list)).toEqual(expect.arrayContaining(["access-radial-remove-now", "access-radial-band-inflation", "access-radial-patency-check"]));
    expect(list.some(femoralOnly)).toBe(false);
    expect(list.length).toBeLessThanOrEqual(CASE_TIP_LIMITS.total);
  });
});

describe("events", () => {
  const coldLeg: ProcedureScenario = {
    id: "test-cold-leg",
    title: "Test: a cold leg after the sheath",
    lessonIds: [],
    access: "femoral",
    script: [{ at: "sheath-in", events: ["limb-ischaemia"] }],
  };

  it("mcs-largebore-limb-check is not returned unless limb-ischaemia is active; the access limb-ischaemia tips follow the event", () => {
    // no limb ischaemia: neither the large-bore bailout nor the access cold-leg tips
    const { session: plain } = newCaseSession({ seed: "tips-limb-0", access: "femoral", start: "sheath-in" });
    expect(plain.activeEvents()).not.toContain("limb-ischaemia");
    for (const w of WORKSPACES) {
      expect(ids(everyMatch(plain, w))).not.toContain("mcs-largebore-limb-check");
      expect(ids(everyMatch(plain, w))).not.toContain("access-closure-cold-leg");
    }
    // a scenario that raises it: the access bailouts appear at closure; the large-bore tip needs a large-bore procedure, which the full case does not do
    const { session: s } = newCaseSession({ seed: "tips-limb-1", scenario: coldLeg, start: "sheath-in" });
    expect(s.activeEvents()).toContain("limb-ischaemia");
    const ctxs = caseTipContexts(s, "closure");
    expect(ctxs.some((c) => c.lab === "access" && c.phase === "complication")).toBe(true);
    expect(ids(shown(s, "closure"))).toEqual(expect.arrayContaining(["access-closure-cold-leg"]));
    expect(ids(everyMatch(s, "closure"))).toContain("access-cx-cold-leg-six-ps");
    for (const w of WORKSPACES) expect(ids(everyMatch(s, w))).not.toContain("mcs-largebore-limb-check");
    // the same tip in a large-bore context needs the event too (its own trigger)
    const mcs: LabContext = { lab: "mcs", phase: "insert", procedures: ["large-bore"] };
    expect(ids(tipsFor(mcs, 100))).not.toContain("mcs-largebore-limb-check");
    expect(ids(tipsFor({ ...mcs, events: s.activeEvents() }, 100))).toContain("mcs-largebore-limb-check");
  });

  it("a flashback that stops (the needle through the back wall) raises no-flashback, which lapses with the hold; a needle short of the artery raises nothing", () => {
    const { session: s } = newCaseSession({ seed: "c5-back", access: "radial-right" });
    prepare(s);
    s.placeNeedle(aimedPose(s));
    // no blood yet: short of the artery, which the operator cannot tell from through it, so no event
    s.advanceNeedle(0.5);
    expect(s.flashback().kind).toBe("none");
    expect(s.activeEvents()).not.toContain("no-flashback");
    expect(advanceToFlash(s)).toBe(true);
    expect(s.activeEvents()).not.toContain("no-flashback");
    let through = false;
    for (let i = 0; i < 60 && !through; i++) through = s.advanceNeedle(0.2).some((e) => e.kind === "back-wall");
    expect(through).toBe(true);
    s.advanceNeedle(1.5);
    expect(s.flashback().kind).toBe("none");
    expect(s.activeEvents()).toContain("no-flashback");
    const ctx = caseTipContexts(s, "access")[0];
    expect(ctx).toMatchObject({ phase: "puncture", phases: ["radial"] });
    expect(ctx.events).toContain("no-flashback");
    s.wait(120);
    s.runPending();
    expect(s.activeEvents()).not.toContain("no-flashback");
  });

  it("a needle in the femoral vein raises venous-flashback, which brings up access-femoral-vein-redirect at the femoral puncture", () => {
    const { session: s } = newCaseSession({ seed: "tips-vein", access: "femoral" });
    prepare(s);
    const vein = s.site.tubes.find((t) => t.kind === "vein")!;
    expect(vein).toBeDefined();
    // aim at the middle of the vein in the target window, as aimedPose does for the artery
    const x = (s.site.landmarks.targetFrom + s.site.landmarks.targetTo) / 2;
    const c = tubeAt(vein, x);
    const th = (s.site.typicalAngleDeg * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    expect(s.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: s.site.typicalAngleDeg, yawDeg: 0 })).toBe(true);
    let venous = false;
    for (let i = 0; i < 300 && !venous; i++) {
      s.advanceNeedle(0.2);
      venous = s.flashback().kind === "venous";
    }
    expect(venous).toBe(true);
    expect(s.activeEvents()).toContain("venous-flashback");
    expect(ids(shown(s, "access"))).toContain("access-femoral-vein-redirect");
  });

  it("a sheath placed in the femoral vein raises venous-flashback when its side arm is aspirated", () => {
    const { session: s } = newCaseSession({ seed: "tips-vein", access: "femoral" });
    prepare(s);
    const vein = s.site.tubes.find((t) => t.kind === "vein")!;
    const x = (s.site.landmarks.targetFrom + s.site.landmarks.targetTo) / 2;
    const c = tubeAt(vein, x);
    const th = (s.site.typicalAngleDeg * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    expect(s.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: s.site.typicalAngleDeg, yawDeg: 0 })).toBe(true);
    let venous = false;
    for (let i = 0; i < 300 && !venous; i++) {
      s.advanceNeedle(0.2);
      venous = s.flashback().kind === "venous";
    }
    expect(venous).toBe(true);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.removeNeedle()).toBe(true);
    // the hub event from the needle lapses before the sheath goes in
    s.wait(120);
    s.runPending();
    expect(s.activeEvents()).not.toContain("venous-flashback");
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    expect(s.sheath?.venous).toBe(true);
    s.flushSheath();
    s.runPending();
    expect(s.activeEvents()).toContain("venous-flashback");
  });

  it("radial spasm raises radial-spasm only when felt on a move, not from the model level while the wire is still", () => {
    const { session: s, engine } = newCaseSession({ seed: "tips-spasm", access: "radial-right", start: "sheath-in" });
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    // a very anxious patient: the hidden spasm level builds while nothing moves
    const real = engine.vitals.bind(engine);
    engine.vitals = () => {
      const v = real();
      return { ...v, symptoms: { ...v.symptoms, anxiety: 1 } };
    };
    s.wait(30);
    s.runPending();
    // the hidden model level above the spasm level (as the model reaches it with time); nothing is felt while still
    s.wire = { ...s.wire, spasm: 0.95 };
    s.wait(2);
    s.runPending();
    expect(s.wire.spasm).toBeGreaterThanOrEqual(MP_TIPS.spasmLevel);
    expect(s.activeEvents()).not.toContain("radial-spasm");
    // a wire move feels it
    s.beamOn = true;
    s.tipImaged = true;
    s.commandWire(1, 0);
    expect(s.activeEvents()).toContain("radial-spasm");
  });

  it("contrast reported by the diagnostic lab on return counts towards high-contrast-volume", () => {
    const { session: s } = newCaseSession({ seed: "tips-contrast", access: "radial-right", start: "sheath-in" });
    s.wait(2);
    s.runPending();
    expect(s.activeEvents()).not.toContain("high-contrast-volume");
    s.returnFromLab("diagnostic", { contrastMl: 0.9 * s.profile.renal.macdMl, fluoroS: 100 });
    s.wait(2);
    s.runPending();
    expect(s.activeEvents()).toContain("high-contrast-volume");
  });

  it("a forced hydrophilic wire in the arm raises perforation and bleeding and opens the complication context", () => {
    // the arm branch perforation is a wire state the session reads; set it as the wire model would
    const { session: s } = newCaseSession({ seed: "tips-perf", access: "radial-right", start: "sheath-in" });
    s.wire = { ...s.wire, perforation: true };
    s.wait(5);
    s.runPending();
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["perforation", "bleeding"]));
    const ctxs = caseTipContexts(s, "fluoro");
    expect(ctxs.some((c) => c.lab === "access" && c.phase === "complication")).toBe(true);
    // the coronary perforation tips of the PCI lab never see an arm perforation
    for (const c of ctxs.filter((c) => c.lab === "pci" || c.lab === "haemo")) expect(c.events ?? []).not.toContain("perforation");
    expect(ids(everyMatch(s, "fluoro"))).toContain("access-cx-radial-perforation-cover");
    expect(ids(everyMatch(s, "fluoro"))).not.toContain("pci-mon-pulsus-paradoxus");
  });

  it("patient events reach the phase-less contexts: hypotension held for the adapter's hold brings up pci-mon-false-hypotension", () => {
    const { session: s, engine } = newCaseSession({ seed: "tips-hypo", access: "radial-right", start: "sheath-in" });
    expect(s.activeEvents()).not.toContain("hypotension");
    // before a catheter is connected the operator reads the cuff: a cuff reading of 70/40 (50) from now on
    const real = engine.vitals.bind(engine);
    engine.vitals = () => {
      const v = real();
      return { ...v, nibp: { sys: 70, dia: 40, mean: 50, at: v.t } };
    };
    s.wait(5);
    s.runPending();
    // the adapter's hold (10 s below the threshold) has not passed yet
    expect(s.activeEvents()).not.toContain("hypotension");
    s.wait(15);
    s.runPending();
    expect(s.activeEvents()).toContain("hypotension");
    const ctxs = caseTipContexts(s, "table");
    expect(ctxs.filter((c) => !c.phase && !c.phases).map((c) => c.lab)).toEqual(["diagnostic", "pci", "haemo"]);
    expect(ids(everyMatch(s, "table"))).toContain("pci-mon-false-hypotension");
  });
});

describe("visibility, recording and raises", () => {
  it("guided shows tips at once; supervised after asking the attending; exam never; the tips shown are recorded for the debrief", () => {
    const policy = (x: CaseSession) => tipsVisible({ mode: x.mode, helpAskedAt: x.helpAskedAt });
    const { session: sup } = newCaseSession({ seed: "tips-vis", access: "femoral", mode: "supervised" });
    expect(policy(sup)).toBe(false);
    sup.askHelp();
    expect(policy(sup)).toBe(true);
    const { session: exam } = newCaseSession({ seed: "tips-vis", access: "femoral", mode: "exam" });
    exam.askHelp();
    expect(policy(exam)).toBe(false);
    expect(selectCaseTips(TIPS, caseTipContexts(exam, "access"), policy(exam))).toEqual([]);
    const { session: s } = newCaseSession({ seed: "tips-vis", access: "femoral" });
    expect(policy(s)).toBe(true);
    prepare(s);
    expect(selectCaseTips(TIPS, caseTipContexts(s, "access"), true, caseTipLimits("access")).length).toBeGreaterThan(0);
    expect(selectCaseTips(TIPS, caseTipContexts(s, "access"), false)).toEqual([]);
    expect(selectCaseTips(null, caseTipContexts(s, "access"), true)).toEqual([]);
    s.noteTipsShown(["access-femoral-scan-bifurcation", "access-needle-flashback-check"]);
    s.noteTipsShown(["access-femoral-scan-bifurcation"]);
    expect(s.tipsShown.map((x) => x.id)).toEqual(["access-femoral-scan-bifurcation", "access-needle-flashback-check"]);
    // handed to the diagnostic or PCI lab, the case reports nothing (that lab shows its own tips)
    expect(caseTipContexts(s, "access", "diagnostic")).toEqual([]);
  });

  it("the tips shown are in the case summary", () => {
    const { session: s } = newCaseSession({ seed: "c5-close", access: "radial-right" });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    exchange(s);
    s.handover("diagnostic");
    s.returnFromLab("diagnostic", { contrastMl: 40, fluoroS: 150 });
    s.removeCatheter();
    s.runPending();
    s.noteTipsShown(ids(shown(s, "closure")));
    s.applyBand(10);
    s.runPending();
    s.pullRadialSheath();
    s.finishRadialClosure(2);
    const sum = s.finish();
    expect(sum).not.toBeNull();
    expect(sum!.tipsShown).toEqual(expect.arrayContaining(["access-radial-remove-now"]));
  });

  it("tips of a context with a phase are listed before those of the phase-less patient contexts; the members are those the scores select", () => {
    const { session: s, engine } = newCaseSession({ seed: "tips-order", access: "femoral", indication: "STEMI" });
    prepare(s);
    const real = engine.vitals.bind(engine);
    engine.vitals = () => {
      const v = real();
      return { ...v, nibp: { sys: 70, dia: 40, mean: 50, at: v.t } };
    };
    s.wait(20);
    s.runPending();
    const ctxs = caseTipContexts(s, "access");
    expect(ctxs.some((c) => !c.phase)).toBe(true);
    const list = selectCaseTips(TIPS, ctxs, true, caseTipLimits("access"));
    const phaseless = ctxs.filter((c) => !c.phase);
    const phased = ctxs.filter((c) => !!c.phase);
    const fromPhased = (t: LabTip) => phased.some((c) => caseTipScore(TIPS, t, c) !== null);
    const firstOther = list.findIndex((t) => !fromPhased(t));
    expect(firstOther).toBeGreaterThan(0);
    expect(list.slice(firstOther).every((t) => !fromPhased(t) && phaseless.some((c) => caseTipScore(TIPS, t, c) !== null))).toBe(true);
    expect(list[0].lab).toBe("access");
  });

  it("the step filter keeps a site-only tip and a tip of the current step, and drops a tip written for another step", () => {
    const ctx: LabContext = { lab: "access", phase: "puncture", phases: ["femoral"], route: "femoral" };
    expect(fitsStep(TIP_BY_ID["access-femoral-scan-bifurcation"], ctx)).toBe(true);
    expect(fitsStep(TIP_BY_ID["access-needle-flashback-check"], ctx)).toBe(true);
    expect(fitsStep(TIP_BY_ID["access-cx-iliac-wire-fluoro"], ctx)).toBe(false);
    expect(fitsStep(TIP_BY_ID["access-cx-iliac-wire-fluoro"], { ...ctx, phase: "wire" })).toBe(true);
    // a context without a site, or of another lab, is not filtered
    expect(fitsStep(TIP_BY_ID["access-cx-iliac-wire-fluoro"], { lab: "access", phase: "femoral", route: "femoral" })).toBe(true);
  });

  it("raises declares every event, phase and route the contexts can report", () => {
    const byLab = new Map(raises.map((r) => [r.lab, r]));
    const perforated = newCaseSession({ seed: "tips-raise-p", access: "radial-right", start: "sheath-in" }).session;
    perforated.wire = { ...perforated.wire, perforation: true };
    perforated.wait(5);
    perforated.runPending();
    const sessions = [
      newCaseSession({ seed: "tips-raise-r", access: "radial-right", start: "closure" }).session,
      newCaseSession({ seed: "tips-raise-f", access: "femoral", start: "closure" }).session,
      newCaseSession({ seed: "tips-raise-s", access: "femoral", indication: "STEMI" }).session,
      perforated,
    ];
    expect(sessions.some((s) => s.activeEvents().length > 0)).toBe(true);
    for (const s of sessions)
      for (const w of WORKSPACES)
        for (const c of caseTipContexts(s, w)) {
          const r = byLab.get(c.lab)!;
          expect(r, c.lab).toBeDefined();
          for (const p of [c.phase, ...(c.phases ?? [])].filter(Boolean)) expect(r.phases, `${c.lab} ${p}`).toContain(p);
          if (c.route) expect(r.routes).toContain(c.route);
          // no scenario here, so every event is the session's or the patient's, which raises must declare
          for (const e of c.events ?? []) expect(r.events, `${c.lab} ${e}`).toContain(e);
        }
  });
});
