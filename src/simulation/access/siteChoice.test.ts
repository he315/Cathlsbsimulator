// access-route-decision: the five-step scorer on the route scenarios' cards, the plan driving the
// case, and the spasm the plan's sheath and prevention leave at the subclavian.
//   npx vitest run src/simulation/access/siteChoice.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { exchange, gainAccess, navigate, prepare } from "../session/autopilot";
import { scenarioById } from "../session/scenarios/index";
import { segmentAt } from "../procedure";
import { LEFT_GROIN_PLANNABLE, labSheathFor, routePlanOf, type RoutePlanModule } from "../session/modules/routePlan";
import { planningOf } from "../session/modules/planning";
import { problemsPresent } from "../session/planning";
import {
  MP_SHEATH_SPASM,
  PLAN_SITES,
  SHEATH_OD_MM,
  VERY_SMALL_RADIAL_MM,
  blankCard,
  decideRoute,
  frsFor,
  sheathSpasmDrivePerS,
  defaultPlan,
  scoreRoutePlan,
  sheathOdMm,
  type PlanSiteId,
  type RoutePlan,
} from "./siteChoice";
import type { SheathId } from "./closure";

const open = (scenario: string): { s: CaseSession; m: RoutePlanModule } => {
  const { session: s } = newCaseSession({ scenario });
  const m = routePlanOf(s);
  if (!m) throw new Error("no route-plan module");
  return { s, m };
};

/** A plan for a site with a usable fallback and the full spasm plan, unless the test says otherwise. */
const plan = (site: PlanSiteId, o: Partial<RoutePlan> = {}): RoutePlan => ({
  ...defaultPlan(site),
  sheathFr: 6,
  sheathType: "thin",
  fallback: site === "radial-left" ? "femoral-left" : "radial-left",
  spasm: { sedation: true, local: true, verapamil: true, gtn: false },
  ...o,
});

describe("the five steps on the route scenarios", () => {
  it("'lima-graft' scores left radial correct and right radial wrong (step 2), femoral correct", () => {
    const { m } = open("lima-graft");
    const c = m.state.card;
    expect(c.cabg?.lima).toBe(true);
    expect(scoreRoutePlan(c, plan("radial-left")).site.correct).toBe(true);
    expect(scoreRoutePlan(c, plan("radial-right")).site.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathType: "standard" })).site.correct).toBe(true);
    expect(decideRoute(c).step).toBe(2);
  });

  it("'complex-pci-8fr' accepts 7-8 Fr 45 cm femoral, and not a shorter or smaller sheath or the wrist", () => {
    const { m } = open("complex-pci-8fr");
    const c = m.state.card;
    for (const fr of [7, 8] as const)
      for (const side of ["right", "left"] as const) {
        const sc = scoreRoutePlan(c, plan(`femoral-${side}`, { sheathFr: fr, sheathType: "standard", lengthCm: 45 }));
        expect(sc.site.correct, `${fr} ${side}`).toBe(true);
        expect(sc.sheath.correct, `${fr} ${side}`).toBe(true);
        expect(sc.spasm).toBeNull();
      }
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathFr: 6, sheathType: "standard", lengthCm: 45 })).sheath.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathFr: 7, sheathType: "standard", lengthCm: 10 })).sheath.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathFr: 8, sheathType: "standard", lengthCm: 25 })).sheath.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("radial-right")).site.correct).toBe(false);
    expect(decideRoute(c).step).toBe(4);
  });

  it("'impalpable-femorals', 'axillofemoral-graft' and 'aaa-mural-thrombus' score any femoral choice wrong (step 1)", () => {
    for (const id of ["impalpable-femorals", "axillofemoral-graft", "aaa-mural-thrombus"]) {
      const { m } = open(id);
      const c = m.state.card;
      for (const fem of ["femoral-right", "femoral-left"] as const) {
        const sc = scoreRoutePlan(c, plan(fem, { sheathFr: 5, sheathType: "standard" }));
        expect(sc.site.correct, `${id} ${fem}`).toBe(false);
        expect(sc.site.given, `${id} ${fem}`).toMatch(/excluded/);
      }
      expect(scoreRoutePlan(c, plan("radial-right")).site.correct, id).toBe(true);
      expect(decideRoute(c).step, id).toBe(1);
      // a femoral fallback is no fallback here
      expect(scoreRoutePlan(c, plan("radial-right", { fallback: "femoral-left" })).fallback.correct, id).toBe(false);
    }
  });

  it("a plan without a fallback fails that item, whatever else is right", () => {
    const { m } = open("lima-graft");
    const good = scoreRoutePlan(m.state.card, plan("radial-left", { fallback: "femoral-right" }));
    expect(good.fallback.correct).toBe(true);
    const none = scoreRoutePlan(m.state.card, plan("radial-left", { fallback: null }));
    expect(none.site.correct).toBe(true);
    expect(none.fallback.correct).toBe(false);
    expect(none.fallback.given).toBe("No fallback");
    expect(none.correct).toBe(false);
    // the same site as the first is not a fallback either
    expect(scoreRoutePlan(m.state.card, plan("radial-left", { fallback: "radial-left" })).fallback.correct).toBe(false);
  });

  it("the fallback must be a site the deciding step allows: with a LIMA a right radial fallback fails; at the default step femoral is a fallback", () => {
    const { m } = open("lima-graft");
    const wrong = scoreRoutePlan(m.state.card, plan("femoral-right", { sheathType: "standard", fallback: "radial-right" }));
    expect(wrong.fallback.correct).toBe(false);
    expect(wrong.fallback.expected).toMatch(/Step 2/);
    expect(scoreRoutePlan(m.state.card, plan("femoral-right", { sheathType: "standard", fallback: "radial-left" })).fallback.correct).toBe(true);
    // complex PCI keeps a femoral access: the other groin, not the wrist
    const cto = open("complex-pci-8fr").m.state.card;
    const fem = (fallback: PlanSiteId) => scoreRoutePlan(cto, plan("femoral-right", { sheathFr: 8, sheathType: "standard", lengthCm: 45, fallback })).fallback.correct;
    expect(fem("femoral-left")).toBe(true);
    expect(fem("radial-right")).toBe(false);
    // the default step only prefers the radial: a femoral fallback is fine
    const plain = blankCard(2.6, "M");
    expect(decideRoute(plain).step).toBe(5);
    expect(scoreRoutePlan(plain, plan("radial-right", { fallback: "femoral-right" })).fallback.correct).toBe(true);
  });

  it("a standard 6 Fr sheath fits a radial that is not small; the wrist offers 5 to 8 Fr", () => {
    expect(scoreRoutePlan(blankCard(2.35, "F"), plan("radial-right", { sheathType: "standard" })).sheath.correct).toBe(true);
    expect(scoreRoutePlan(blankCard(2.1, "F"), plan("radial-right", { sheathType: "standard" })).sheath.correct).toBe(false);
    expect(frsFor("radial-right")).not.toContain(4);
    expect(frsFor("femoral-right")).toContain(4);
    const { m } = open("lima-graft");
    expect(m.actions.setPlan({ site: "femoral-right", sheathFr: 4 })).toBe(true);
    expect(m.state.plan.sheathFr).toBe(4);
    // moving the plan to the wrist takes the smallest wrist sheath, the one the lab opens
    expect(m.actions.setPlan({ site: "radial-left" })).toBe(true);
    expect(m.state.plan.sheathFr).toBe(5);
    expect(labSheathFor(m.state.plan).id).toBe("5");
  });

  it("'arteria-lusoria' excludes the right arm; the left radial or a femoral artery are accepted", () => {
    const c = open("arteria-lusoria").m.state.card;
    expect(scoreRoutePlan(c, plan("radial-right")).site.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("ulnar-right")).site.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("radial-left", { fallback: "femoral-right" })).site.correct).toBe(true);
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathType: "standard" })).site.correct).toBe(true);
  });

  it("'right-groin-plug-60d' accepts the other groin or the left radial, not the right groin; the record holds the plug as its one problem", () => {
    const { s, m } = open("right-groin-plug-60d");
    const c = m.state.card;
    expect(c.recentPlug).toEqual({ side: "right", daysAgo: 60 });
    expect(scoreRoutePlan(c, plan("femoral-right", { sheathType: "standard" })).site.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("femoral-left", { sheathType: "standard" })).site.correct).toBe(true);
    expect(scoreRoutePlan(c, plan("radial-left", { fallback: "femoral-left" })).site.correct).toBe(true);
    expect(scoreRoutePlan(c, plan("radial-right")).site.correct).toBe(false);
    const rec = planningOf(s)!.state.record;
    expect(rec.planted).toBe("closure-device-90d");
    expect(rec.facts.closureDevice).toEqual({ side: "right", daysAgo: 60 });
    expect(problemsPresent(rec.facts, "femoral")).toEqual(["closure-device-90d"]);
    // the ultrasound of the right groin shows the plug
    expect(planningOf(s)!.actions.priorPlug()).not.toBeNull();
  });

  it("'very-small-radial' sends the case to the ulnar or femoral artery; 'dialysis-fistula' away from the fistula arm", () => {
    const tiny = open("very-small-radial").m.state.card;
    expect(tiny.radialDiamMm).toBeLessThan(VERY_SMALL_RADIAL_MM);
    for (const id of ["radial-right", "radial-left", "distal-radial-right"] as const) expect(scoreRoutePlan(tiny, plan(id)).site.correct, id).toBe(false);
    expect(scoreRoutePlan(tiny, plan("ulnar-right", { sheathFr: 5 })).site.correct).toBe(true);
    expect(scoreRoutePlan(tiny, plan("femoral-right", { sheathType: "standard" })).site.correct).toBe(true);
    // the radial arteries are ruled out at step 1, so step 1 decides and its reason is the artery size, not 'radial'
    expect(decideRoute(tiny).step).toBe(1);
    const expected = scoreRoutePlan(tiny, plan("radial-right")).site.expected;
    expect(expected).toContain("a very small radial artery");
    expect(expected).toContain("the ulnar or femoral artery");
    expect(expected).not.toMatch(/Default: radial|not complex: radial/);
    const fistula = open("dialysis-fistula").m.state.card;
    expect(fistula.fistulaArm).toBe("right");
    expect(scoreRoutePlan(fistula, plan("radial-right")).site.correct).toBe(false);
    expect(scoreRoutePlan(fistula, plan("radial-left", { fallback: "femoral-right" })).site.correct).toBe(true);
  });

  it("the sheath must fit the radial artery: in 'spasm-high-risk' a 5 Fr thin-walled sheath fits, a 7 Fr standard one does not", () => {
    const c = open("spasm-high-risk").m.state.card;
    expect(scoreRoutePlan(c, plan("radial-right", { sheathFr: 5, sheathType: "thin" })).sheath.correct).toBe(true);
    expect(scoreRoutePlan(c, plan("radial-right", { sheathFr: 7, sheathType: "standard" })).sheath.correct).toBe(false);
    expect(scoreRoutePlan(c, plan("radial-right", { sheathFr: 6, sheathType: "standard" })).sheath.correct).toBe(false);
    // the spasm plan needs sedation, local and a vasodilator
    expect(scoreRoutePlan(c, plan("radial-right", { sheathFr: 5 })).spasm!.correct).toBe(true);
    const bare = scoreRoutePlan(c, plan("radial-right", { sheathFr: 5, spasm: { sedation: false, local: true, verapamil: false, gtn: false } })).spasm!;
    expect(bare.correct).toBe(false);
    expect(bare.given).toMatch(/woman/);
  });

  it("outer diameters are Brilakis Table 30.2's, extrapolated by 0.33 mm per French at 4 and 8 Fr", () => {
    expect(sheathOdMm(6, "standard")).toBe(SHEATH_OD_MM.standard[6]);
    expect(sheathOdMm(5, "thin")).toBe(2.14);
    expect(sheathOdMm(8, "standard")).toBeCloseTo(2.95 + 0.33, 5);
    expect(sheathOdMm(4, "thin")).toBeCloseTo(2.14 - 0.33, 5);
    expect(PLAN_SITES).toHaveLength(8);
  });
});

describe("the plan drives the case", () => {
  it("choosing a site moves the planned access; the plan locks at the first puncture", () => {
    const { s, m } = open("lima-graft");
    expect(s.access).toBe("radial-right");
    expect(m.actions.setPlan({ site: "radial-left" })).toBe(true);
    expect(s.access).toBe("radial-left");
    expect(m.actions.setPlan({ site: "femoral-right" })).toBe(true);
    expect(s.access).toBe("femoral");
    // the ulnar artery runs through its arm's radial route in this lab
    m.actions.setPlan({ site: "ulnar-left" });
    expect(s.access).toBe("radial-left");
    expect(m.state.plan.site).toBe("ulnar-left");
    m.actions.setPlan({ site: "radial-left", fallback: "femoral-right", sheathType: "thin", spasm: { sedation: true, local: true, verapamil: true, gtn: false } });
    m.actions.palpateAll();
    s.runPending();
    expect(m.actions.confirm()).not.toBeNull();
    s.runPending();
    const d = Object.fromEntries(s.decisions().map((x) => [x.id, x]));
    expect(d["route-plan-site"].correct).toBe(true);
    expect(d["route-plan-fallback"].correct).toBe(true);
    expect(d["route-pulses-before"].correct).toBe(true);
    prepare(s);
    gainAccess(s);
    expect(m.state.locked).toBe(true);
    expect(m.actions.setPlan({ site: "femoral-left" })).toBe(false);
    expect(s.access).toBe("radial-left");
    // the pulses felt before the choice are the start pulses
    expect(m.actions.startPulses().map((p) => p.id)).toHaveLength(8);
  });

  it("the left groin is a planned site only when the session can start a case there; it stays a fallback", () => {
    const { s, m } = open("right-groin-plug-60d");
    const raw = newCaseSession({ scenario: "right-groin-plug-60d" }).session;
    (raw.setAccess as (a: "femoral", side?: "left") => boolean).call(raw, "femoral", "left");
    // LEFT_GROIN_PLANNABLE is pinned to what CaseSession.setAccess does with a side
    expect(raw.sites[0].side === "left").toBe(LEFT_GROIN_PLANNABLE);
    expect(m.actions.setPlan({ site: "femoral-left" })).toBe(LEFT_GROIN_PLANNABLE);
    if (!LEFT_GROIN_PLANNABLE) {
      expect(m.state.plan.site).not.toBe("femoral-left");
      expect(s.sites[0].side).toBe("right");
    }
    // the correct plan the lab can run: the left radial first, the left groin if it fails
    expect(m.actions.setPlan({ site: "radial-left", fallback: "femoral-left" })).toBe(true);
    const sc = m.actions.score();
    expect(sc.site.correct).toBe(true);
    expect(sc.fallback.correct).toBe(true);
    expect(s.access).toBe("radial-left");
  });

  it("a case opened at the access stage keeps the team's plan in step with the route until the puncture", () => {
    const { session: s } = newCaseSession({ scenario: "lima-graft", start: "access" });
    const m = routePlanOf(s)!;
    expect(m.state.planByTeam).toBe(true);
    expect(s.hookAt.puncture).toBeUndefined();
    expect(s.setAccess("femoral")).toBe(true);
    expect(m.state.plan.site).toBe("femoral-right");
    expect(m.actions.plannedSheath().lengthCm).toBe(10);
    expect(s.setAccess("radial-left")).toBe(true);
    expect(m.state.plan.site).toBe("radial-left");
    expect(s.decisions().filter((x) => x.id.startsWith("route-"))).toEqual([]);
  });

  it("inspecting the site reports ooze the session holds", () => {
    const { session: s } = newCaseSession({ scenario: "lima-graft", start: "sheath-in" });
    const m = routePlanOf(s)!;
    s.runPending();
    expect(m.actions.inspectSite()).toMatch(/no ooze/);
    s.runPending();
    s.closureContext.oozeAroundSheath = true;
    expect(m.actions.inspectSite()).toMatch(/oozing around the sheath/);
  });

  it("a puncture without a confirmed plan is scored as such; a case opened past the chart scores nothing", () => {
    const { s } = open("complex-pci-8fr");
    prepare(s);
    gainAccess(s);
    const site = s.decisions().find((x) => x.id === "route-plan-site")!;
    expect(site.correct).toBe(false);
    expect(site.given).toMatch(/Not confirmed before the needle/);
    const late = newCaseSession({ scenario: "lima-graft", start: "sheath-in" }).session;
    expect(late.decisions().filter((x) => x.id.startsWith("route-"))).toEqual([]);
    expect(routePlanOf(late)!.state.planByTeam).toBe(true);
  });
});

describe("spasm from the plan's sheath and prevention", () => {
  /**
   * The spasm-high-risk patient: the plan, the sheath it opens, then the wire driven up the arm with the
   * beam on until its tip reaches the subclavian artery; the spasm level there. Sedation is midazolam
   * 1 mg (a test input inside Brilakis's 0.5-1 mg, pm-lab-drugs), the cocktail the lab's one-touch
   * verapamil and nitroglycerin (SOURCED_DOSES).
   */
  function spasmAtSubclavian(o: { sheath: SheathId; fr: 5 | 7; type: "thin" | "standard"; sedation: boolean; cocktail: boolean }): number {
    const { s, m } = open("spasm-high-risk");
    m.actions.setPlan({ site: "radial-right", sheathFr: o.fr, sheathType: o.type, fallback: "ulnar-left", spasm: { sedation: o.sedation, local: true, verapamil: o.cocktail, gtn: o.cocktail } });
    m.actions.confirm();
    s.runPending();
    prepare(s);
    if (o.sedation) {
      s.order("midazolam", 1);
      s.runPending();
    }
    gainAccess(s, o.sheath);
    s.order("heparin-radial");
    s.runPending();
    if (o.cocktail) {
      s.order("verapamil");
      s.runPending();
      s.order("gtn-low");
      s.runPending();
    }
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    s.beamOn = true;
    s.tipImaged = true;
    for (let i = 0; i < 4000; i++) {
      if (segmentAt(s.route, s.wire.pos).id === "subclavian") break;
      s.commandWire(1, 0);
      s.commandCatheter(1);
      s.tick(0.033);
    }
    expect(segmentAt(s.route, s.wire.pos).id).toBe("subclavian");
    return s.wire.spasm;
  }

  it("in 'spasm-high-risk' a 7 Fr standard sheath without sedation or cocktail gives more spasm at the subclavian than a 5 Fr thin sheath with both", () => {
    const bad = spasmAtSubclavian({ sheath: "7", fr: 7, type: "standard", sedation: false, cocktail: false });
    const good = spasmAtSubclavian({ sheath: "5", fr: 5, type: "thin", sedation: true, cocktail: true });
    expect(bad).toBeGreaterThan(good);
    expect(bad - good).toBeGreaterThan(0.05);
  });

  /**
   * An ordinary radial case (the default scenario, a woman with a 2.09 mm radial and a standard 6 Fr
   * sheath): catheter to the root, wire out, spasm set to 0, then 600 s with the catheter in. The spasm
   * level at the end.
   */
  function spasmWireOut(drivePerS: number): number {
    const saved = MP_SHEATH_SPASM.drivePerS;
    MP_SHEATH_SPASM.drivePerS = drivePerS;
    try {
      const def = scenarioById("default")!;
      const { session: s } = newCaseSession({ seed: "route-wire-out", scenario: { ...def, profile: { ...(def.profile ?? {}), sex: "F", radialDiamMm: 2.09 } }, start: "sheath-in" });
      expect(s.activeSite.siteKind).toBe("radial");
      expect(s.sheath?.id).toBe("6");
      s.prepCatheter("TIG");
      s.runPending();
      expect(s.loadCatheter("TIG")).toBe(true);
      navigate(s);
      exchange(s);
      expect(s.wireInBody).toBe(false);
      expect(s.catheter?.inBody).toBe(true);
      s.wire = { ...s.wire, spasm: 0 };
      for (let i = 0; i < 600; i++) s.tick(1);
      return s.wire.spasm;
    } finally {
      MP_SHEATH_SPASM.drivePerS = saved;
    }
  }

  it("with the wire out the sheath's drive does not build spasm in an ordinary radial case", () => {
    // the sheath is large for this artery, so the drive is not zero while the wire is in
    expect(sheathSpasmDrivePerS(SHEATH_OD_MM.standard[6], 2.09)).toBeGreaterThan(0);
    const withDrive = spasmWireOut(MP_SHEATH_SPASM.drivePerS);
    const without = spasmWireOut(0);
    expect(withDrive).toBe(without);
  });

  it("the prevention done is scored at the first catheter up the arm", () => {
    const { s, m } = open("spasm-high-risk");
    m.actions.setPlan({ site: "radial-right", sheathFr: 5, sheathType: "thin", fallback: "ulnar-left", spasm: { sedation: true, local: true, verapamil: true, gtn: false } });
    m.actions.confirm();
    s.runPending();
    prepare(s);
    gainAccess(s, "5");
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    const d = s.decisions().find((x) => x.id === "route-spasm-prevention")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/local/);
    expect(d.given).not.toMatch(/sedation/);
  });
});
