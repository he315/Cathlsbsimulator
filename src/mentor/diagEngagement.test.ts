// The engagement rule group and its scoring (diag-engagement-technique-set): shapes cycled before the ostium is
// located, an injection from a deep position with a free trace, an ostial lesion judged from inside the artery; the
// pre-case catheter choice against the route and the root; the stop decision on the contrast total; the five-view
// left main set.
//   npx vitest run src/mentor/diagEngagement.test.ts
import { describe, expect, it } from "vitest";
import {
  ENGAGEMENT_RULES,
  EngagementWorkTracker,
  LEFT_MAIN_OSTIUM_VIEWS,
  LEFT_MAIN_VIEW_SET,
  MP_ENGAGEMENT_RULES,
  aortaCmFromNote,
  brilakisJlSize,
  choiceCaseFor,
  engagementDecisions,
  expectedCatheters,
  hasAortoOstialLesion,
  order,
  rules,
  scoreCatheterChoice,
  scoreLeftMainViews,
  scoreStopDecision,
  type EngagementMentorCtx,
} from "./rules/diagEngagement";
import { RULES, collectRules, RULE_FILES } from "./rules/index";
import { MentorEngine } from "./mentor";
import type { MentorInput } from "./context";
import type { EngagementKind } from "../types";
import { catheterById } from "../data/catheters";
import { scenarioCase } from "../simulation/caseGenerator";
import { TRACKS } from "../content";
import { VIEW_PRESETS } from "../data/viewPresets";

const base = (t: number, over: Partial<MentorInput & Pick<EngagementMentorCtx, "engagementWork">> = {}): MentorInput => ({
  tWall: t,
  lab: "diagnostic",
  engagement: "sinus-level",
  pressure: "aortic",
  sys: 124,
  dia: 74,
  resistance: 0,
  advancing: false,
  insertion: 0,
  aspirated: "clean",
  beam: 1,
  cArm: { laoRao: 30, cranialCaudal: 0 },
  catheterId: "JR4",
  targetSide: "right",
  ...over,
});

/** Run a case of catheter changes and injections through the tracker and the attending, as the lab would feed them. */
function run(steps: { t: number; catheter?: string; inject?: EngagementKind }[], mode: "supervised" | "guided" = "supervised") {
  const tracker = new EngagementWorkTracker({ catheterId: "JR4" });
  const eng = new MentorEngine({ mode, entrustment: 2 }, ENGAGEMENT_RULES);
  const said: ReturnType<MentorEngine["step"]> = [];
  let cath = "JR4";
  let i = 0;
  for (let t = 0; t <= 60; t = Math.round((t + 0.1) * 10) / 10) {
    while (i < steps.length && steps[i].t <= t) {
      const s = steps[i++];
      if (s.catheter) {
        cath = s.catheter;
        tracker.noteCatheter(cath);
      }
      if (s.inject) tracker.noteInjection(s.inject);
    }
    said.push(...eng.step(base(t, { catheterId: cath, engagementWork: tracker.work } as Partial<MentorInput>)));
  }
  return { said, tracker };
}

describe("the engagement rules", () => {
  it("the group is registered at order 330: the deep free-trace rule is in RULES, the two that read engagementWork are not yet (the lab does not pass it)", () => {
    expect(order).toBe(330);
    expect(rules.map((r) => r.id)).toEqual(["deep-free-trace-inject"]);
    expect(Object.keys(RULE_FILES)).toContain("./diagEngagement.ts");
    // the rules are well formed for the registry and the reserved ids are free
    const reserved = ENGAGEMENT_RULES.filter((r) => !rules.includes(r));
    expect(reserved.map((r) => r.id)).toEqual(["shapes-cycled", "ostium-from-outside"]);
    expect(() => collectRules({ ...RULE_FILES, "./x-engagement.ts": { order: 331, rules: reserved } })).not.toThrow();
    for (const r of reserved) expect(RULES.some((x) => x.id === r.id)).toBe(false);
    expect(RULES.filter((x) => x.id === "deep-free-trace-inject").length).toBe(1);
  });

  it("three catheter changes without a sinus injection triggers the new rule; two do not, and a sinus injection resets the count", () => {
    expect(MP_ENGAGEMENT_RULES.shapeChangesAllowed).toBe(2);
    const three = run([{ t: 5, catheter: "AR" }, { t: 10, catheter: "AL1" }, { t: 15, catheter: "JR5" }]);
    expect(three.tracker.work.changesSinceRootLook).toBe(3);
    const fired = three.said.filter((u) => u.ruleId === "shapes-cycled");
    expect(fired.length).toBeGreaterThan(0);
    expect(fired[0].tWall).toBeGreaterThanOrEqual(15);
    expect(fired[0].level).toBe(1);
    expect(fired[0].text).toMatch(/where the ostium is/);

    const two = run([{ t: 5, catheter: "AR" }, { t: 10, catheter: "AL1" }]);
    expect(two.said.some((u) => u.ruleId === "shapes-cycled")).toBe(false);

    // a non-selective sinus injection after the second change: the third change is the first since
    const looked = run([{ t: 5, catheter: "AR" }, { t: 10, catheter: "AL1" }, { t: 12, inject: "sinus-level" }, { t: 15, catheter: "JR5" }]);
    expect(looked.tracker.work).toEqual({ changesSinceRootLook: 1, rootLooked: true, ostialLesion: false });
    expect(looked.said.some((u) => u.ruleId === "shapes-cycled")).toBe(false);
    // a selective injection does not count as locating the ostium from the root
    const selective = run([{ t: 5, catheter: "AR" }, { t: 10, catheter: "AL1" }, { t: 12, inject: "selective-rca" }, { t: 15, catheter: "JR5" }]);
    expect(selective.said.some((u) => u.ruleId === "shapes-cycled")).toBe(true);
    // the first catheter of the case is not a change, nor is the same catheter again
    const t = new EngagementWorkTracker();
    t.noteCatheter("JL4");
    t.noteCatheter("JL4");
    expect(t.work.changesSinceRootLook).toBe(0);
  });

  it("an injection from a deep position with a free trace is stopped; a damped one is left to damped-before-inject and the conus to the conus rule", () => {
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    for (let t = 0; t < 3; t += 0.1) eng.step(base(t, { engagement: "deep-rca" }));
    const stop = eng.preAction("inject", base(3, { engagement: "deep-rca" }));
    expect(stop.allow).toBe(false);
    expect(stop.utterance?.ruleId).toBe("deep-free-trace-inject");
    expect(stop.utterance?.level).toBe(5);
    const damped = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    expect(damped.preAction("inject", base(0, { engagement: "deep-rca", pressure: "damped" })).allow).toBe(true);
    const conus = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    expect(conus.preAction("inject", base(0, { engagement: "selective-rca", conus: true })).allow).toBe(true);
    const free = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    expect(free.preAction("inject", base(0, { engagement: "selective-rca" })).allow).toBe(true);
  });

  it("deep at an ostial lesion without a sinus injection: the attending asks, and stops the run; after a sinus injection it does not", () => {
    const tracker = new EngagementWorkTracker({ catheterId: "JR4", ostialLesion: true });
    const over = (w = tracker.work) => ({ engagement: "deep-rca" as const, pressure: "damped" as const, engagementWork: w }) as Partial<MentorInput>;
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    const said = [];
    for (let t = 0; t < 10; t += 0.1) said.push(...eng.step(base(t, over())));
    expect(said.some((u) => u.ruleId === "ostium-from-outside" && u.level === 1)).toBe(true);
    expect(eng.preAction("inject", base(10, over())).utterance?.ruleId).toBe("ostium-from-outside");
    tracker.noteInjection("non-selective");
    const after = new MentorEngine({ mode: "supervised", entrustment: 2 }, ENGAGEMENT_RULES);
    expect(after.preAction("inject", base(0, over())).allow).toBe(true);
    // a technique stop is left to the debrief in independent practice
    const ind = new MentorEngine({ mode: "independent", entrustment: 2 }, ENGAGEMENT_RULES);
    expect(ind.preAction("inject", base(0, over(new EngagementWorkTracker({ ostialLesion: true }).work))).allow).toBe(true);
    expect(ind.deferred.some((d) => d.ruleId === "ostium-from-outside")).toBe(true);
  });

  it("the lines never mention a score and use no em-dash; each rule's lesson material exists", () => {
    const eng = new MentorEngine();
    const ctx = eng.tracker.update(base(0));
    for (const r of ENGAGEMENT_RULES) {
      for (const l of Object.values(r.lines)) {
        const t = l!(ctx);
        expect(t).not.toMatch(/score|points|%|percent|grade/i);
        expect(t).not.toMatch(/—/);
      }
      for (const f of r.frames ?? []) expect(f.text + f.teaching).not.toMatch(/—|score|%/i);
    }
    const lessons = new Set<string>();
    for (const t of TRACKS) for (const m of t.modules) for (const l of m.lessons) lessons.add(l.id);
    for (const id of ["pm-engaging-fail", "pm-to-the-root-choice", "pm-engaging-rca", "cp-left-main-assess"]) expect(lessons.has(id), id).toBe(true);
  });
});

describe("the catheter choice against the route and the root", () => {
  it("the usual choices: JL4 and JR4 femorally, JL3.5 or a universal curve from the right radial, JL3.5 for a small root", () => {
    const fem = expectedCatheters({ route: "femoral", rootSize: "normal", variants: [] });
    expect(fem.left.accept[0]).toBe("JL4");
    expect(fem.right.accept[0]).toBe("JR4");
    const rad = expectedCatheters({ route: "radial-right", rootSize: "normal", variants: [] });
    expect(rad.left.accept).toEqual(expect.arrayContaining(["JL3.5", "TIG"]));
    expect(rad.guideRight.accept).not.toContain("JR4");
    expect(expectedCatheters({ route: "radial-left", rootSize: "normal", variants: [] }).left.accept).toEqual(["JL4"]);
    expect(expectedCatheters({ route: "femoral", rootSize: "small", variants: ["small-root"] }).left.accept[0]).toBe("JL3.5");
    expect(expectedCatheters({ route: "femoral", rootSize: "normal", variants: [], heightCm: 150 }).left.accept[0]).toBe("JL3.5");
    expect(expectedCatheters({ route: "femoral", rootSize: "normal", variants: ["shepherds-crook-rca"] }).right.accept).toEqual(["AR", "3DRC", "HS"]);
    // every expected catheter is on the cart
    for (const e of [fem, rad]) for (const side of [e.left, e.right, e.guideLeft, e.guideRight]) for (const id of side.accept) expect(catheterById(id), id).toBeDefined();
  });

  it("Brilakis's rule: the ascending aortic diameter in cm plus 1 gives the JL size (4 cm gives a JL5)", () => {
    expect(brilakisJlSize(4)).toBe("JL5");
    expect(brilakisJlSize(4.2)).toBe("JL5");
    expect(brilakisJlSize(3)).toBe("JL4");
    expect(brilakisJlSize(5)).toBe("JL6");
    expect(aortaCmFromNote("Moderate aortic regurgitation; ascending aorta 4.2 cm on CT.")).toBe(4.2);
    expect(aortaCmFromNote("Normal.")).toBeUndefined();
  });

  it("diag-catheter-choice-by-root: a JL5 and an AR1 fit the tall man with the dilated root and the anterior RCA; a JL4 and a JR4 do not; the decisions go to the ledger", () => {
    const c = scenarioCase("diag-catheter-choice-by-root")!;
    const against = choiceCaseFor(c);
    expect(against).toMatchObject({ route: "femoral", rootSize: "dilated", heightCm: 197, aortaCm: 4.2 });
    const good = scoreCatheterChoice({ access: "femoral", left: "JL5", right: "AR1" }, against);
    expect(good.ok).toBe(true);
    expect(good.route.ok).toBe(true);
    const usual = scoreCatheterChoice({ access: "femoral", left: "JL4", right: "JR4" }, against);
    expect(usual.left.ok).toBe(false);
    expect(usual.right.ok).toBe(false);
    expect(usual.left.why).toMatch(/plus 1/);
    const wrongRoute = scoreCatheterChoice({ access: "radial-right", left: "JL5", right: "AR1" }, against);
    expect(wrongRoute.route.ok).toBe(false);
    const recs = engagementDecisions({ choice: { given: { access: "femoral", left: "JL4", right: "AR2", guide: "AL1", guideFrench: 6 }, against } });
    expect(recs.map((r) => r.id)).toEqual(["engage-choice-route", "engage-choice-left", "engage-choice-right", "engage-choice-guide"]);
    expect(recs.find((r) => r.id === "engage-choice-left")!.correct).toBe(false);
    expect(recs.find((r) => r.id === "engage-choice-right")!.correct).toBe(true);
    for (const r of recs) expect(r.lessonId).toBeDefined();
  });

  it("at an aorto-ostial lesion a guide larger than 6 Fr is flagged (Brilakis)", () => {
    const c = scenarioCase("diag-rca-set")!;
    expect(hasAortoOstialLesion(c.lesions)).toBe(true);
    const s = scoreCatheterChoice({ access: "femoral", left: "JL4", right: "JR4", guide: "JR4", guideFrench: 8 }, choiceCaseFor(c));
    expect(s.guideFrenchAtOstium).toEqual({ ok: false, given: 8 });
    expect(scoreCatheterChoice({ access: "femoral", guide: "JR4", guideFrench: 6 }, choiceCaseFor(c)).guideFrenchAtOstium?.ok).toBe(true);
  });
});

describe("the stop decision and the left main views", () => {
  it("in an elective patient the stop is expected after a large contrast volume without success, not in an emergency; no question when everything was engaged", () => {
    const elective = { engagedAll: false, emergency: false, contrastMl: 160, warnMl: 136 };
    expect(scoreStopDecision({ ...elective, stopped: true })!.correct).toBe(true);
    expect(scoreStopDecision({ ...elective, stopped: false })!.correct).toBe(false);
    expect(scoreStopDecision({ ...elective, contrastMl: 60, stopped: false })!.correct).toBe(true);
    // stopped early, with little contrast and the ladder not worked through: premature
    const early = scoreStopDecision({ ...elective, contrastMl: 60, stopped: true })!;
    expect(early.correct).toBe(false);
    expect(early.expected).toMatch(/before stopping/);
    expect(scoreStopDecision({ ...elective, emergency: true, stopped: true })!.correct).toBe(false);
    expect(scoreStopDecision({ ...elective, engagedAll: true, stopped: false })).toBeNull();
    const recs = engagementDecisions({ stop: { ...elective, stopped: false } });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ id: "engage-fail-stop", correct: false, lessonId: "pm-engaging-fail" });
  });

  it("the five-view left main set is Brilakis's, and LAO caudal and LAO cranial are the ostial views", () => {
    for (const v of LEFT_MAIN_VIEW_SET) expect(VIEW_PRESETS.some((p) => p.id === v), v).toBe(true);
    expect(VIEW_PRESETS.find((p) => p.id === "spider")!.name).toMatch(/LAO caudal/);
    expect(LEFT_MAIN_OSTIUM_VIEWS).toEqual(["spider", "laocranial"]);
    expect(scoreLeftMainViews(["ap", "raocaudal", "raocranial", "laocranial", "spider"], ["spider", "laocranial"])).toEqual({ missing: [], complete: true, ostiumNamed: true });
    const part = scoreLeftMainViews(["ap", "spider"], ["ap"]);
    expect(part.complete).toBe(false);
    expect(part.missing).toEqual(["raocaudal", "raocranial", "laocranial"]);
    expect(part.ostiumNamed).toBe(false);
    const recs = engagementDecisions({ views: { acquired: ["ap", "spider"], named: ["spider", "laocranial"] } });
    expect(recs.map((r) => [r.id, r.correct])).toEqual([["lm-five-views", false], ["lm-ostium-views", true]]);
  });
});
