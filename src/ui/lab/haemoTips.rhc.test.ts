// The right heart passage's tips and links (haemo-rhc-manoeuvre): in a preset of rhc.launch.ts the
// catheter that has made no progress for 45 s raises engage-fail through the study, so the side-branch
// and RA-loop tips show; the knot reaches the context as catheter-knot (with catheter-kink, the knot
// tip's trigger); the lab's raises carry the catheter's events, so every waiting.ts entry naming this
// package is satisfiable; and the practice index lists every preset under the three lessons.
//   npx vitest run src/ui/lab/haemoTips.rhc.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch } from "../../content/validateLaunch";
import { launch as coreLaunch } from "../../content/lab/presets/haemo/core.launch";
import { launch as rhcLaunch } from "../../content/lab/presets/haemo/rhc.launch";
import { HAEMO_SCENARIOS } from "../../simulation/haemo";
import { HAEMO_DYNAMIC_EVENTS, haemoStudyReducer, initialStudy, type HaemoStudyState } from "../../simulation/haemoStudy";
import { RHC_ENGAGE_FAIL_S, RHC_EVENTS, RHC_PRESETS, RHC_STEP, initialRhc, rhcStep, rhcSyncActions, type RhcAction, type RhcState } from "../../simulation/rightHeartCatheter";
import { practiceForLesson } from "../content/practiceIndex";
import { HAEMO_SCENARIO_EVENTS, haemoTipContext, raises } from "./haemoTips";

const PKG = "haemo-rhc-manoeuvre";
const LESSONS = ["hb-cardiac-catheterisation-rhc", "hb-background-silhouette", "hb-background-general"];
const links = rhcLaunch.links ?? [];
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const ENV = { resp: false, hr: 70 };

/** A study and its catheter driven together, as CatheterPanel does. */
class Lab {
  study: HaemoStudyState;
  rhc: RhcState;
  owned: LabEvent[] = [];
  t = 0;
  constructor(scenario: string, start: string, seed: number) {
    this.study = initialStudy(scenario, start);
    this.rhc = initialRhc(start as (typeof RHC_PRESETS)[number], seed);
    this.sync();
  }
  sync() {
    const s = rhcSyncActions(this.study, this.rhc, this.owned);
    this.study = s.actions.reduce(haemoStudyReducer, this.study);
    this.owned = s.owned;
  }
  do(...as: RhcAction[]) {
    for (const a of as) {
      this.t += 1;
      this.rhc = rhcStep(this.rhc, a, this.t, ENV);
      this.sync();
    }
    return this;
  }
  at(t: number) {
    this.t = t;
    this.rhc = rhcStep(this.rhc, { type: "tick" }, t, ENV);
    this.sync();
    return this;
  }
  get ctx() {
    return haemoTipContext(this.study);
  }
}

describe("the right heart passage in the lab's tips", () => {
  it("in rhc-femoral-mp, after the catheter caught in a side branch makes no progress for 45 s (engage-fail), tipsFor(ctx, 20) includes haemo-rhc-femoral-side-branch and haemo-rhc-ra-loop", () => {
    const link = links.find((l) => l.start === "rhc-femoral-mp")!;
    const lab = new Lab(link.scenario!, link.start!, 3).do({ type: "insert" });
    for (let i = 0; i < 8; i++) lab.do({ type: "advance", cm: RHC_STEP.firm });
    expect(lab.ctx.phase).toBe("right-heart");
    expect(lab.ctx.events).not.toContain("engage-fail");
    expect(ids(lab.ctx)).not.toContain("haemo-rhc-femoral-side-branch");
    // the action that raises engage-fail: 45 s pass without progress
    lab.at(lab.rhc.progressAt + RHC_ENGAGE_FAIL_S + 1);
    expect(lab.ctx.events).toContain("engage-fail");
    expect(ids(lab.ctx, 20)).toEqual(expect.arrayContaining(["haemo-rhc-femoral-side-branch", "haemo-rhc-ra-loop"]));
    // freed and moving again, engage-fail goes and the two tips with it
    lab.do({ type: "withdraw", cm: 5 });
    for (let i = 0; i < 4; i++) lab.do({ type: "rotate", deg: -30 }); // turned to point cranially, away from the branch
    for (let i = 0; i < 6 && lab.rhc.furthest < 1; i++) lab.do({ type: "advance", cm: RHC_STEP.firm });
    expect(lab.ctx.events).not.toContain("engage-fail");
    expect(ids(lab.ctx)).not.toContain("haemo-rhc-femoral-side-branch");
  });

  it("in rhc-knot-risk the knot reaches the context as catheter-knot and catheter-kink, and the knot tip shows (what __lab.haemo.context() reports in the browser)", () => {
    const lab = new Lab("normal", "rhc-knot-risk", 11);
    expect(lab.ctx.phase).toBe("right-heart");
    for (let i = 0; i < 60 && !lab.rhc.knot; i++) lab.do({ type: "rotate", deg: i % 2 ? 90 : -90 });
    expect(lab.ctx.events).toEqual(expect.arrayContaining(["catheter-knot", "catheter-kink"]));
    expect(ids(lab.ctx)).toContain("haemo-rhc-knot");
  });

  it("the AF and outflow tract presets start in the right heart with the AF tip on hand, and AF and VT reach the context when they start", () => {
    const af = new Lab("normal", "rhc-af", 2);
    expect(af.ctx.phase).toBe("right-heart");
    expect(ids(af.ctx, 30)).toContain("haemo-bg-af-in-lab");
    for (let i = 0; i < 30 && !af.rhc.af; i++) af.do({ type: "rotate", deg: 30 });
    expect(af.ctx.events).toContain("atrial-fibrillation");
    let vt = false;
    for (let seed = 1; seed < 40 && !vt; seed++) {
      const lab = new Lab("normal", "rhc-rvot-irritable", seed).do({ type: "advance", cm: RHC_STEP.firm });
      vt = lab.ctx.events!.includes("vt");
    }
    expect(vt).toBe(true);
  });
});

// --- reachability from the lab's own raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInHaemo = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "haemo" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "haemo" && satisfiableIn(tip.when, a.phase, rs));

describe("what the lab raises", () => {
  it("the haemo lab's raises carry the catheter's events, all in the shared vocabulary", () => {
    for (const e of RHC_EVENTS) expect(raises.events, e).toContain(e);
    for (const e of raises.events) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    expect(raises.phases).toContain("right-heart");
  });

  it("every waiting.ts entry naming haemo-rhc-manoeuvre becomes satisfiable, so the reachability waiting count for the haemo lab falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    expect(mine.length).toBeGreaterThanOrEqual(4);
    expect(mine.filter((id) => !TIP_BY_ID[id])).toEqual([]);
    expect(mine.filter((id) => !satisfiableInHaemo(TIP_BY_ID[id], [raises]))).toEqual([]);
    // the lab's raises as they were before this package (its scenario and study events, without the catheter's)
    const before: LabRaises = { ...raises, events: raises.events.filter((e) => !(RHC_EVENTS as readonly string[]).includes(e) || HAEMO_SCENARIO_EVENTS.includes(e) || (HAEMO_DYNAMIC_EVENTS as readonly string[]).includes(e)) };
    expect(mine.filter((id) => satisfiableInHaemo(TIP_BY_ID[id], [before]))).toEqual([]);
    const haemoWaiting = WAITING_TIPS.filter((w) => w.lab === "haemo").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => haemoWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInHaemo(TIP_BY_ID[id], rs)).length;
    expect(stillWaiting([before]) - stillWaiting([raises])).toBeGreaterThanOrEqual(mine.length);
    // the haemo tips left unsatisfiable belong to later packages
    const later = new Set(WAITING_TIPS.filter((w) => w.lab === "haemo" && w.raisedBy !== PKG).flatMap((w) => w.tips));
    expect(LAB_TIPS.filter((t) => t.lab === "haemo" && !satisfiableInHaemo(t, [raises]) && !later.has(t.id)).map((t) => t.id)).toEqual([]);
  });
});

describe("rhc.launch.ts and the practice index", () => {
  it("declares each preset once, as a start of a scenario core.launch.ts declares, and nothing else", () => {
    expect(rhcLaunch.sim).toBe("haemo");
    expect(rhcLaunch.scenarios ?? []).toEqual([]);
    expect(links.map((l) => l.start).sort()).toEqual([...RHC_PRESETS].sort());
    const known = buildKnownLaunch({ "presets/haemo/core.launch.ts": { launch: coreLaunch }, "presets/haemo/rhc.launch.ts": { launch: rhcLaunch } });
    expect(known.problems).toEqual([]);
    for (const l of links) {
      expect(HAEMO_SCENARIOS.some((s) => s.id === l.scenario), l.scenario).toBe(true);
      expect(known.scenarios.get("haemo")?.get(l.scenario!)?.starts.has(l.start!), l.start).toBe(true);
      // the catheter opens the start as its preset; the study opens normally (set-up done)
      expect(initialRhc(l.start as (typeof RHC_PRESETS)[number]).preset).toBe(l.start);
      expect(haemoTipContext(initialStudy(l.scenario!, l.start)).phase).toBe("setup");
      // titles say where the study starts, not what will go wrong
      expect(l.title ?? "", l.start).not.toMatch(/knot|AF|fibrillation|VT|tachycardia|irritable|side branch/i);
      expect(l.mode).toBe("guided");
    }
  });

  it("practiceIndex lists every scenario in rhc.launch.ts under hb-cardiac-catheterisation-rhc, hb-background-silhouette and hb-background-general", () => {
    for (const lesson of LESSONS) {
      const listed = practiceForLesson(lesson).filter((e) => e.sim === "haemo");
      for (const l of links) expect(listed.some((e) => e.scenario === l.scenario && e.start === l.start), `${l.start} under ${lesson}`).toBe(true);
    }
  });
});
