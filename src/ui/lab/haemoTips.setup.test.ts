// The transducer set-up's tips and links (haemo-transducer-and-setup): a set-up preset keeps the
// phase at 'setup' so the zero-and-level and manifold tips show, an overdamped line and injected air
// are reported to the tips, the lab's raises carry them, and the practice index lists every preset of
// setup.launch.ts under the two set-up lessons.
//   npx vitest run src/ui/lab/haemoTips.setup.test.ts
import { describe, expect, it } from "vitest";
import { TIP_BY_ID, tipsFor, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch } from "../../content/validateLaunch";
import { launch as coreLaunch } from "../../content/lab/presets/haemo/core.launch";
import { launch as setupLaunch } from "../../content/lab/presets/haemo/setup.launch";
import { HAEMO_SCENARIOS } from "../../simulation/haemo";
import { MANIFOLD_PORTS, SETUP_PRESETS, haemoStudyReducer, initialStudy, studySetup, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import { practiceForLesson } from "../content/practiceIndex";
import { haemoTipContext, raises } from "./haemoTips";

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const SET_UP: HaemoAction[] = [
  { type: "setup-level", landmark: "mid-thoracic" },
  { type: "setup-stopcock", to: "air" },
  { type: "setup-zero" },
  { type: "setup-stopcock", to: "patient" },
];
const LESSONS = ["pm-monitoring-transducers", "hb-cardiac-catheterisation-setup"];
const links = setupLaunch.links ?? [];

describe("set-up presets in the lab's tips", () => {
  it("in every preset of setup.launch.ts, at phase 'setup', tipsFor(ctx, 20) includes haemo-mon-zero-level and haemo-setup-manifold-check", () => {
    expect(links.length).toBe(SETUP_PRESETS.length);
    for (const l of links) {
      const ctx = haemoTipContext(initialStudy(l.scenario!, l.start));
      expect(ctx.phase, l.start).toBe("setup");
      expect(ids(ctx), l.start).toEqual(expect.arrayContaining(["haemo-mon-zero-level", "haemo-setup-manifold-check"]));
      // with the catheter in before the set-up is done, still 'setup', with the right heart alongside
      const inRA = haemoTipContext(play(initialStudy(l.scenario!, l.start), { type: "rhc-advance" }));
      expect(inRA.phase, l.start).toBe("setup");
      expect(inRA.phases, l.start).toEqual(["right-heart"]);
      expect(ids(inRA), l.start).toContain("haemo-mon-zero-level");
    }
  });

  it("once zeroed and level the study moves on to the catheter's phase, and the setup tips go", () => {
    const st = play(initialStudy("normal", "setup-hidden-bubble"), ...SET_UP, { type: "rhc-advance" });
    const ctx = haemoTipContext(st);
    expect(ctx.phase).toBe("right-heart");
    expect(ids(ctx)).not.toContain("haemo-setup-manifold-check");
  });

  it("an overdamped line raises pressure-damped and injected air raises air; the lab's raises carry both", () => {
    const damped = play(initialStudy("normal", "setup-overdamped-air"), ...SET_UP, { type: "rhc-advance" });
    expect(haemoTipContext(damped).events).toContain("pressure-damped");
    expect(haemoTipContext(play(damped, { type: "setup-fix", fix: "reprime" })).events).not.toContain("pressure-damped");
    const air = play(initialStudy("normal", "setup-hidden-bubble"), { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(haemoTipContext(air).events).toContain("air");
    expect(raises.events).toEqual(expect.arrayContaining(["pressure-damped", "air"]));
    expect(raises.phases).toContain("setup");
  });

  it("every waiting.ts entry naming haemo-transducer-and-setup becomes satisfiable from the lab's raises (there are none listed today)", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "haemo-transducer-and-setup").flatMap((w) => w.tips);
    const has = (rs: LabRaises, key: "phases" | "events", x: string) => ((rs[key] ?? []) as readonly string[]).includes(x);
    for (const id of mine) {
      const t = TIP_BY_ID[id];
      if (!t) continue;
      const ph = t.when.phase ?? [];
      expect(!ph.length || ph.some((p) => has(raises, "phases", p)), id).toBe(true);
      expect(!t.when.event?.length || t.when.event.some((e) => has(raises, "events", e)), id).toBe(true);
      expect((t.when.requires ?? []).every((e) => has(raises, "events", e)), id).toBe(true);
    }
    // the set-up tips this package makes reachable are haemo tips at the setup phase
    for (const id of ["haemo-mon-zero-level", "haemo-setup-manifold-check", "haemo-mon-fast-flush"]) expect(TIP_BY_ID[id]?.when.phase, id).toContain("setup");
  });
});

describe("setup.launch.ts and the practice index", () => {
  it("declares each set-up preset once, as a start of a scenario core.launch.ts declares, and nothing else", () => {
    expect(setupLaunch.sim).toBe("haemo");
    expect(setupLaunch.scenarios ?? []).toEqual([]);
    expect(links.map((l) => l.start).sort()).toEqual([...SETUP_PRESETS].sort());
    const known = buildKnownLaunch({ "presets/haemo/core.launch.ts": { launch: coreLaunch }, "presets/haemo/setup.launch.ts": { launch: setupLaunch } });
    expect(known.problems).toEqual([]);
    for (const l of links) {
      expect(HAEMO_SCENARIOS.some((s) => s.id === l.scenario), l.scenario).toBe(true);
      expect(known.scenarios.get("haemo")?.get(l.scenario!)?.starts.has(l.start!), l.start).toBe(true);
      // the lab opens the start as the preset
      expect(studySetup(initialStudy(l.scenario!, l.start)).preset).toBe(l.start);
      // titles say what to do, not what is wrong
      expect(l.title ?? "", l.start).not.toMatch(/air|damp|bubble|V4|long line|wrong/i);
    }
    expect(MANIFOLD_PORTS.length).toBeGreaterThanOrEqual(3);
    expect(MANIFOLD_PORTS.length).toBeLessThanOrEqual(5);
  });

  it("practiceIndex lists every preset in setup.launch.ts under pm-monitoring-transducers and hb-cardiac-catheterisation-setup", () => {
    for (const lesson of LESSONS) {
      const listed = practiceForLesson(lesson).filter((e) => e.sim === "haemo");
      for (const l of links) expect(listed.some((e) => e.scenario === l.scenario && e.start === l.start), `${l.start} under ${lesson}`).toBe(true);
    }
  });
});
