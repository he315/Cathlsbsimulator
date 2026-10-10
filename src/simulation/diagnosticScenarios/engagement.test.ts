// The engagement technique scenarios (diag-engagement-technique-set): the pack against its .launch.ts, the cases its
// seeds draw, the engine's patient against each chart (the registry-wide check in scenarios.test.ts stops at the
// first failing pack, so this pack is checked here on its own), and the short left main of diag-lm-damping-causes in
// the analytic model.
//   npx vitest run src/simulation/diagnosticScenarios/engagement.test.ts
import { describe, expect, it } from "vitest";
import { scenarioCase } from "../caseGenerator";
import { buildAnatomy } from "../anatomy";
import { shortLmBranch } from "../engagement";
import { DIAG_SCENARIOS, DIAG_SCENARIO_ERRORS, diagScenarioById, scenarioEvents } from "./index";
import { ENGAGEMENT_CATHETER_LISTS, ENGAGEMENT_SCENARIO_IDS, scenarios } from "./engagement";
import { choiceCaseFor, expectedCatheters } from "../../mentor/rules/diagEngagement";
import { launch } from "./engagement.launch";
import { LAB_EVENTS } from "../../content/lab/tips";
import { TRACKS } from "../../content";
import { engineOptionsForCase, profileFromChart } from "../../ui/sim/labSession";
import { catheterById } from "../../data/catheters";

const lessons = new Set<string>();
for (const t of TRACKS) for (const m of t.modules) for (const l of m.lessons) lessons.add(l.id);

describe("the engagement pack", () => {
  it("registers its six scenarios, matching engagement.launch.ts (ids, titles and lessons)", () => {
    expect(DIAG_SCENARIO_ERRORS).toEqual([]);
    expect(scenarios.map((s) => s.id)).toEqual([...ENGAGEMENT_SCENARIO_IDS]);
    for (const id of ENGAGEMENT_SCENARIO_IDS) expect(diagScenarioById(id), id).toBeDefined();
    expect(launch.sim).toBe("cathlab");
    expect(launch.scenarios!.map((s) => ({ id: s.id, title: s.title, lessonIds: s.lessonIds }))).toEqual(scenarios.map((s) => ({ id: s.id, title: s.title, lessonIds: s.lessonIds })));
    const vocab = new Set<string>(LAB_EVENTS);
    for (const s of scenarios) {
      for (const e of scenarioEvents(s)) expect(vocab.has(e), `${s.id}: ${e}`).toBe(true);
      for (const l of s.lessonIds) expect(lessons.has(l), `${s.id}: ${l}`).toBe(true);
      for (const ch of s.checks) if (ch.lessonId) expect(lessons.has(ch.lessonId), `${s.id}/${ch.id}`).toBe(true);
      expect(s.startAt).toBe("root");
    }
  });

  it("the case's name in the lab states the presentation only", () => {
    const giveaway = /spasm|scad|dissect|thromb|cto\b|occlu|vasospas|pde|sildenafil|tadalafil|nitrate|pregnan|egfr|ceiling|contrast|skin|radiation|burn|erythema|operation note|graft|trace|damp|left main|conus|root|wire|fold|anomal|ostium|ostia/i;
    for (const s of scenarios) {
      expect(s.caseName, s.id).not.toMatch(giveaway);
      expect(scenarioCase(s.id, "3")!.name, s.id).toBe(s.caseName);
    }
  });

  it("over seeds 1 to 10 the engine's patient is the chart's: elective, no culprit, no anticoagulant, sinus rhythm, the chart's LVEF", () => {
    for (const s of scenarios) {
      for (let i = 1; i <= 10; i++) {
        const c = scenarioCase(s.id, String(i))!;
        const opts = engineOptionsForCase(c) as { profile: ReturnType<typeof profileFromChart> };
        const p = opts.profile;
        const at = `${s.id} seed ${i}`;
        expect(p.seed, at).toBe(c.id);
        expect(s.indication, at).toBe("SA");
        expect(p.indication, at).toBe("SA");
        expect(p.culprit, at).toBeNull();
        expect(p.anticoagulation, at).toBe("none");
        expect(p.baseline.rhythm, at).toBe("sinus");
        expect(p.lvef, at).toBe(s.chart.echo!.lvef);
        expect(p.allergies.other, at).toEqual([]);
      }
    }
  });

  it("the cases the seeds draw: the forced anatomy every time, and the pools' variants in some seeds and not others", () => {
    const seeds = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const variantsOf = (id: string) => seeds.map((x) => scenarioCase(id, x)!.variants);
    for (const v of variantsOf("diag-lm-fold-small-root")) expect(v).toEqual(expect.arrayContaining(["small-root", "high-ostia"]));
    for (const v of variantsOf("diag-rca-set")) expect(v).toEqual(["conus-separate-ostium"]);
    for (const v of variantsOf("diag-engage-fail-ladder")) expect(v).toEqual(expect.arrayContaining(["high-ostia", "tortuous-iliac"]));
    for (const v of variantsOf("diag-catheter-choice-by-root")) expect(v).toEqual(expect.arrayContaining(["dilated-root", "anterior-rca"]));
    const radial = variantsOf("diag-radial-left-set");
    expect(radial.some((v) => v.includes("separate-ostia"))).toBe(true);
    expect(radial.some((v) => !v.includes("separate-ostia"))).toBe(true);
    const lm = variantsOf("diag-lm-damping-causes");
    expect(lm.some((v) => v.includes("short-lm"))).toBe(true);
    expect(lm.some((v) => !v.includes("short-lm"))).toBe(true);
    const dom = seeds.map((x) => scenarioCase("diag-lm-damping-causes", x)!.dominance);
    expect(new Set(dom)).toEqual(new Set(["right", "left"]));
    // the routes and roots
    expect(scenarioCase("diag-radial-left-set")!.accessRoute).toBe("radial-right");
    expect(scenarioCase("diag-lm-fold-small-root")!.rootSize).toBe("small");
    expect(scenarioCase("diag-catheter-choice-by-root")!.rootSize).toBe("dilated");
    // the lesions: the hidden ostial RCA narrowing and the left main stenosis
    expect(scenarioCase("diag-rca-set")!.lesions.map((l) => [l.vessel, l.kind])).toEqual([["RCA", "ostial-rca"]]);
    expect(scenarioCase("diag-lm-damping-causes")!.lesions.map((l) => [l.vessel, l.kind])).toEqual([["LM", "left-main"]]);
  });

  it("diag-lm-damping-causes with a short left main: the JL4 enters the LAD and the JL4.5 reaches the circumflex in the analytic model", () => {
    const seed = Array.from({ length: 20 }, (_, i) => String(i + 1)).find((x) => scenarioCase("diag-lm-damping-causes", x)!.variants.includes("short-lm"))!;
    const m = buildAnatomy(scenarioCase("diag-lm-damping-causes", seed)!);
    expect(shortLmBranch(m, catheterById("JL4")!)).toBe("LAD");
    expect(shortLmBranch(m, catheterById("JL4.5")!)).toBe("LCx");
  });

  it("the catheter lists the cases should carry hold every catheter the set teaches and scores, and every catheter the generated case already accepts (seeds 1-10)", () => {
    for (const id of ENGAGEMENT_SCENARIO_IDS) {
      const lists = ENGAGEMENT_CATHETER_LISTS[id];
      for (const x of [...lists.acceptable, ...(lists.recommended ?? [])]) expect(catheterById(x), `${id}: ${x}`).toBeDefined();
      for (const x of lists.recommended ?? []) expect(lists.acceptable, `${id}: recommended ${x}`).toContain(x);
      for (let i = 1; i <= 10; i++) {
        const c = scenarioCase(id, String(i))!;
        const e = expectedCatheters(choiceCaseFor(c));
        for (const x of [...e.left.accept, ...e.right.accept]) expect(lists.acceptable, `${id} seed ${i}: expected ${x}`).toContain(x);
        for (const x of c.acceptableCatheters) expect(lists.acceptable, `${id} seed ${i}: generated ${x}`).toContain(x);
        // the case opens on the same catheter as the generated one
        expect((lists.recommended ?? c.recommendedCatheters)[0], `${id} seed ${i}`).toBe(c.recommendedCatheters[0]);
      }
    }
    // the short left main also takes the JL one size larger
    const shortSeed = Array.from({ length: 20 }, (_, i) => String(i + 1)).find((x) => scenarioCase("diag-lm-damping-causes", x)!.variants.includes("short-lm"))!;
    expect(expectedCatheters(choiceCaseFor(scenarioCase("diag-lm-damping-causes", shortSeed)!)).left.accept).toEqual(["JL4", "JL4.5"]);
  });

  it("every scenario is in the registry once", () => {
    for (const id of ENGAGEMENT_SCENARIO_IDS) expect(DIAG_SCENARIOS.filter((s) => s.id === id)).toHaveLength(1);
  });
});
