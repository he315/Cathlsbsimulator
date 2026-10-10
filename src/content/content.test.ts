import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TRACKS, PUBLISHED_CASES, GLOSSARY, ALL_CASES } from "./index";
import { REFERENCES, REF_IDS } from "./refs";
import { validateTrack, validateCase, lengthCue, LENGTH_CUE, branchingSteps, itemStats, walkCase, ANGIO_DRILL_IDS } from "./validate";
import type { Block, CaseStudy, LaunchFile, Lesson, Module, Track } from "./schema";
import { buildKnownLaunch, validateLaunchLinks, type LaunchContentRoot, type LaunchFiles } from "./validateLaunch";
import type { QuizMemory } from "../simulation/srs";
import {
  DRILL_LABEL,
  GRADE_BINS,
  PATIENT_DEGREE_CLASSES,
  balancedAccuracy,
  baseRates,
  boxHit,
  brier,
  buildDataset,
  cohenKappa,
  distanceToBin,
  gradeBin,
  hitBox,
  itemFor,
  itemForKey,
  makeSet,
  mergeByName,
  normaliseDegree,
  percentBin,
  planningStudies,
  rng,
  scoreChoice,
  scoreEstimate,
  scoreLocate,
  signedBias,
  srsKey,
  stratifiedSample,
  summarise,
  viewCall,
  LIBRARY_SOURCES,
  STRATIFIED_DRILLS,
  applyDrillParams,
  chanceLevel,
  constantBaseline,
  describeDrillParams,
  librarySubset,
  matchedPairs,
  migrateAngioMemory,
  nuisanceStratum,
  stratum,
  type DrillItem,
  type DrillContext,
  type DrillKind,
  type LibDataset,
  type LibRun,
  type RawDataset,
} from "../ui/angio/library";

// ---------------------------------------------------------------------------
// Academy content
// ---------------------------------------------------------------------------
describe("content integrity", () => {
  it("has the ten core tracks (plus any manual-curriculum tracks) with unique ids and orders", () => {
    expect(TRACKS.filter((t) => t.order < 10).length).toBe(10);
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
    expect(new Set(TRACKS.map((t) => t.order)).size).toBe(TRACKS.length);
  });

  it("every track validates and ids are globally unique", () => {
    const seen = new Set<string>();
    const problems: string[] = [];
    for (const t of TRACKS) problems.push(...validateTrack(t, REF_IDS, seen));
    expect(problems).toEqual([]);
  });

  it("published cases validate and carry a source", () => {
    const problems: string[] = [];
    const seen = new Set<string>(TRACKS.flatMap((t) => t.cases.map((c) => c.id)));
    for (const c of PUBLISHED_CASES) {
      if (seen.has(c.id)) problems.push(`duplicate case id ${c.id}`);
      seen.add(c.id);
      if (c.provenance.kind !== "published") problems.push(`${c.id}: published case without published provenance`);
      validateCase(c, REF_IDS, problems);
      // Branches that did not happen in the report must say so.
      for (const s of c.steps)
        if (s.kind === "consequence" && !/^Teaching branch/.test(s.info ?? "")) problems.push(`${c.id}/${s.id}: consequence step not marked as a teaching branch`);
    }
    expect(problems).toEqual([]);
  });

  it("references have unique ids and verified ones are complete", () => {
    expect(new Set(REFERENCES.map((r) => r.id)).size).toBe(REFERENCES.length);
    for (const r of REFERENCES) expect(r.citation.trim().length).toBeGreaterThan(10);
  });

  it("glossary terms are unique", () => {
    const terms = GLOSSARY.map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });
});

// ---------------------------------------------------------------------------
// Lab launch links (found-launch-links)
// ---------------------------------------------------------------------------
// Every lab's engine-free .launch.ts files; the patterns match src/ui/content/practiceIndex.ts.
const LAUNCH_FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
// The built-in Real angiograms drills (BUILTIN_LAUNCH_DRILLS) are the default, as in the runtime practice index.
const launchKnown = (extra: LaunchFiles = {}) => buildKnownLaunch({ ...LAUNCH_FILES, ...extra });

describe("lab launch links", () => {
  it("existing content and every .launch.ts validate", () => {
    expect(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, launchKnown())).toEqual([]);
  });

  // A test-only lab file: one scenario with a start and a variant, and one held out for exams.
  const DEMO: LaunchFile = {
    sim: "haemo",
    scenarios: [
      { id: "ct-demo", title: "Content test scenario", lessonIds: [], starts: ["s1"], variants: ["v1", { id: "vx", heldOut: true }] },
      { id: "ct-exam", title: "Content test exam", lessonIds: [], heldOut: true },
    ],
  };
  const known = launchKnown({ "/test/ct-demo.launch.ts": { launch: DEMO } });

  // Fixture content is added to the full curriculum rather than replacing it: the real .launch.ts files
  // are validated with the fixture, and the lessons and cases they name live anywhere in TRACKS and
  // PUBLISHED_CASES. Every error a fixture test sees therefore comes from the fixture itself.
  const t0 = TRACKS[0];
  const m0 = t0.modules[0];
  const l0 = m0.lessons[0];
  const fixtureLesson = (b: Block): Lesson => ({ ...l0, id: "ct-fixture-lesson", blocks: [b] });
  const withFixture = (extra: { lesson?: Lesson; module?: Module; cases?: CaseStudy[] }): LaunchContentRoot => ({
    tracks: [
      {
        ...t0,
        modules: [{ ...m0, lessons: [...m0.lessons, ...(extra.lesson ? [extra.lesson] : [])] }, ...t0.modules.slice(1), ...(extra.module ? [extra.module] : [])],
      },
      ...TRACKS.slice(1),
    ],
    cases: [...PUBLISHED_CASES, ...(extra.cases ?? [])],
  });
  const errsFor = (params: Record<string, string>) =>
    validateLaunchLinks(withFixture({ lesson: fixtureLesson({ kind: "sim", sim: "haemo", task: "t", params }) }), known);

  it("the full curriculum with the fixture lab file and no fixture content validates", () => {
    expect(validateLaunchLinks(withFixture({}), known)).toEqual([]);
  });

  it("a sim block naming a known scenario, start, variant and mode passes", () => {
    expect(errsFor({ scenario: "ct-demo", start: "s1", variant: "v1", mode: "supervised", seed: "7" })).toEqual([]);
  });

  it("an unknown scenario id fails", () => {
    expect(errsFor({ scenario: "no-such-scenario" })).toEqual([expect.stringMatching(/unknown scenario "no-such-scenario" for haemo/)]);
  });

  it("an unknown start id fails", () => {
    expect(errsFor({ scenario: "ct-demo", start: "s9" })).toEqual([expect.stringMatching(/unknown start "s9"/)]);
    expect(errsFor({ start: "s1" })).toEqual([expect.stringMatching(/start "s1" without a scenario/)]);
  });

  it("an unknown mode fails", () => {
    expect(errsFor({ scenario: "ct-demo", mode: "practice" })).toEqual([expect.stringMatching(/unknown mode "practice"/)]);
  });

  it("a link to a held-out scenario or variant fails", () => {
    expect(errsFor({ scenario: "ct-exam" })).toEqual([expect.stringMatching(/held out for exams/)]);
    expect(errsFor({ scenario: "ct-demo", variant: "vx" })).toEqual([expect.stringMatching(/held out for exams/)]);
  });

  it("module sims, case practice entries and PCI-lab drill blocks are checked the same way", () => {
    const m: Module = {
      ...m0,
      id: "ct-fixture-module",
      lessons: [fixtureLesson({ kind: "drill", target: "angio-pci", params: { scenario: "nope" }, task: "t" })],
      sims: [{ sim: "haemo" as const, task: "t", params: { scenario: "ct-exam" } }],
    };
    const c = { ...t0.cases[0], id: "ct-fixture-case", practice: [{ sim: "haemo" as const, task: "t", params: { scenario: "ct-demo", mode: "solo" } }] } as CaseStudy;
    const errs = validateLaunchLinks(withFixture({ module: m, cases: [c] }), known);
    expect(errs).toHaveLength(3);
    expect(errs.join("\n")).toMatch(/unknown scenario "nope" for angio-pci/);
    expect(errs.join("\n")).toMatch(/held out for exams/);
    expect(errs.join("\n")).toMatch(/unknown mode "solo"/);
  });

  it("a .launch.ts naming an unknown lesson, case or scenario is rejected; one naming any real lesson passes", () => {
    // the last lesson of the last track: far from the first lesson, so the check must use the full TRACKS
    const lastModules = TRACKS[TRACKS.length - 1].modules;
    const lastLessons = lastModules[lastModules.length - 1].lessons;
    const deep = lastLessons[lastLessons.length - 1].id;
    const BAD: LaunchFile = {
      sim: "haemo",
      scenarios: [{ id: "ct-bad", title: "Content test bad links", lessonIds: [deep, "ct-no-such-lesson"], caseIds: ["ct-no-such-case"] }],
      links: [
        { scenario: "ct-no-such-scenario", lessonIds: [deep] },
        { scenario: "ct-demo", lessonIds: ["ct-no-such-lesson-2"] },
        { scenario: "ct-demo", lessonIds: [deep] },
      ],
    };
    const errs = validateLaunchLinks(withFixture({}), launchKnown({ "/test/ct-demo.launch.ts": { launch: DEMO }, "/test/ct-bad.launch.ts": { launch: BAD } }));
    expect([...errs].sort()).toEqual(
      [
        '/test/ct-bad.launch.ts scenario ct-bad: unknown lesson "ct-no-such-lesson"',
        '/test/ct-bad.launch.ts scenario ct-bad: unknown case "ct-no-such-case"',
        '/test/ct-bad.launch.ts link 0: unknown scenario "ct-no-such-scenario" for haemo',
        '/test/ct-bad.launch.ts link 1: unknown lesson "ct-no-such-lesson-2"',
      ].sort()
    );
  });
});

describe("answer-length cue", () => {
  const items = TRACKS.flatMap((t) => t.modules.flatMap((m) => m.quiz));

  it("no module gives the answer away by option length (validate.ts rule)", () => {
    const flagged: string[] = [];
    for (const t of TRACKS)
      for (const m of t.modules) {
        const c = lengthCue(m.quiz);
        if (c.fraction > LENGTH_CUE.maxFraction) flagged.push(`${m.id}: ${c.flagged}/${c.n}`);
      }
    expect(flagged).toEqual([]);
  });

  it("an always-pick-the-longest strategy scores close to chance", () => {
    let longest = 0;
    let chance = 0;
    for (const q of items) {
      const L = q.options.map((o) => o.length);
      const mx = Math.max(...L);
      const ties = L.filter((x) => x === mx).length;
      if (L[q.answer] === mx) longest += 1 / ties;
      chance += 1 / q.options.length;
    }
    const pLongest = longest / items.length;
    const pChance = chance / items.length;
    console.log(`always-longest ${(100 * pLongest).toFixed(1)}% vs chance ${(100 * pChance).toFixed(1)}% over ${items.length} items`);
    // Project rule: within 10 percentage points of chance.
    expect(pLongest).toBeLessThan(pChance + 0.1);
  });

  it("the correct option is not the shortest either (no reverse cue)", () => {
    let shortest = 0;
    let chance = 0;
    for (const q of items) {
      const L = q.options.map((o) => o.length);
      const mn = Math.min(...L);
      const ties = L.filter((x) => x === mn).length;
      if (L[q.answer] === mn) shortest += 1 / ties;
      chance += 1 / q.options.length;
    }
    expect(shortest / items.length).toBeLessThan(chance / items.length + 0.1);
  });

  it("no explanation refers to options by position, so every item's options are shuffled", () => {
    // QuizRunner keeps the authored order when an explanation says "option C" or "the first option",
    // and authored answers cluster at one index; such items would give the answer away by position.
    const positional = /\b(option [A-E]|(first|second|third|fourth|fifth|last) option)\b/i;
    expect(items.filter((q) => positional.test(q.explanation)).map((q) => q.id)).toEqual([]);
  });

  it("the rule itself flags a module where the answer is always longest", () => {
    const fake = [0, 1, 2, 3].map((i) => ({
      id: `x-${i}`,
      stem: "s",
      options: ["short", "brief", "the correct option is much longer than the rest", "tiny"],
      answer: 2,
      explanation: "long enough explanation text here",
      difficulty: 1 as const,
    }));
    expect(lengthCue(fake).fraction).toBe(1);
  });
});

describe("case branching", () => {
  it("at least 30% of case steps branch to different consequences", () => {
    const b = branchingSteps(ALL_CASES);
    console.log(`${b.branching} of ${b.steps} case steps branch (${((100 * b.branching) / b.steps).toFixed(1)}%)`);
    expect(b.branching / b.steps).toBeGreaterThanOrEqual(0.3);
  });

  it("every case step is reachable from the entry step", () => {
    const unreachable: string[] = [];
    for (const c of ALL_CASES) {
      const w = walkCase(c);
      for (const s of c.steps) if (!w.reachable.has(s.id)) unreachable.push(`${c.id}/${s.id}`);
      if (w.cyclic) unreachable.push(`${c.id}: loops`);
    }
    expect(unreachable).toEqual([]);
  });

  it("consequence steps return to the main line", () => {
    const c = {
      id: "t",
      title: "t",
      trackId: "foundations" as const,
      stage: 1 as const,
      provenance: { kind: "synthetic" as const },
      summary: "",
      presentation: "",
      findings: [],
      outcome: "",
      learningPoints: ["x"],
      steps: [
        { id: "a", prompt: "", options: [{ text: "good", best: true, feedback: "f" }, { text: "bad", feedback: "f", next: "a-bad" }] },
        { id: "b", prompt: "", options: [{ text: "good", best: true, feedback: "f" }, { text: "ok", feedback: "f" }] },
        { id: "a-bad", kind: "consequence" as const, prompt: "", options: [{ text: "rescue", best: true, feedback: "f" }, { text: "worse", feedback: "f" }] },
      ],
    };
    const w = walkCase(c);
    expect([...w.reachable].sort()).toEqual(["a", "a-bad", "b"]);
    expect([...w.branching]).toEqual(["a"]);
    const errs: string[] = [];
    validateCase(c, REF_IDS, errs);
    expect(errs).toEqual([]);
  });
});

describe("case state", () => {
  it("non-best choices compound through stability deltas", async () => {
    const { stabilityDelta, DEFAULT_STABILITY_DELTA } = await import("../ui/content/CasePlayer");
    expect(stabilityDelta({ best: true })).toBe(DEFAULT_STABILITY_DELTA.best);
    expect(stabilityDelta({ acceptable: true })).toBe(DEFAULT_STABILITY_DELTA.acceptable);
    expect(stabilityDelta({})).toBe(DEFAULT_STABILITY_DELTA.other);
    expect(stabilityDelta({ stateDelta: { stability: -25 } })).toBe(-25);
    // Every consequence branch is entered from a non-best option on a main step (a branch may run
    // over several consequence steps, so options inside a branch are not checked).
    const offenders: string[] = [];
    for (const c of ALL_CASES)
      for (const s of c.steps.filter((x) => x.kind !== "consequence"))
        for (const o of s.options) {
          const target = c.steps.find((x) => x.id === o.next);
          if (target?.kind === "consequence" && o.best) offenders.push(`${c.id}/${s.id} -> ${target.id}`);
        }
    expect(offenders).toEqual([]);
  }, 240_000);
});

describe("item analytics", () => {
  it("computes p-value and point-biserial correlation", () => {
    // Four learners; item a is answered correctly by the two strongest only.
    const log = [
      { learner: "1", item: "a", correct: true },
      { learner: "1", item: "b", correct: true },
      { learner: "2", item: "a", correct: true },
      { learner: "2", item: "b", correct: true },
      { learner: "3", item: "a", correct: false },
      { learner: "3", item: "b", correct: true },
      { learner: "4", item: "a", correct: false },
      { learner: "4", item: "b", correct: false },
    ];
    const s = itemStats(log);
    expect(s.a.p).toBeCloseTo(0.5);
    expect(s.a.pointBiserial).toBeGreaterThan(0.5);
    expect(s.b.p).toBeCloseTo(0.75);
  });
});

// ---------------------------------------------------------------------------
// Real-angiogram drills
// ---------------------------------------------------------------------------
describe("drill statistics", () => {
  it("constant answers give chance balanced accuracy and kappa 0", () => {
    const ref = [0, 0, 0, 1, 1, 1];
    expect(balancedAccuracy(ref, [0, 0, 0, 0, 0, 0])).toBeCloseTo(0.5);
    expect(cohenKappa(ref, [1, 1, 1, 1, 1, 1]).kappa).toBeCloseTo(0);
    expect(cohenKappa(ref, ref).kappa).toBeCloseTo(1);
    const ref4 = [0, 1, 2, 3, 0, 1, 2, 3];
    expect(balancedAccuracy(ref4, new Array(8).fill(2))).toBeCloseTo(0.25);
    expect(cohenKappa(ref4, new Array(8).fill(2), "linear", 4).kappa).toBeCloseTo(0);
  });

  it("kappa matches a hand-worked example", () => {
    // 2x2: a=20 b=5 c=10 d=15 (n=50). po=0.7, pe=0.5*0.6+0.5*0.4=0.5, kappa=0.4.
    const ref = [...new Array(25).fill(0), ...new Array(25).fill(1)];
    const ans = [...new Array(20).fill(0), ...new Array(5).fill(1), ...new Array(10).fill(0), ...new Array(15).fill(1)];
    const k = cohenKappa(ref, ans);
    expect(k.kappa).toBeCloseTo(0.4);
    expect(k.lo).toBeLessThan(0.4);
    expect(k.hi).toBeGreaterThan(0.4);
  });

  it("Brier score and bias", () => {
    expect(brier([1, 1], [true, false])).toBeCloseTo(0.5);
    expect(brier([0.5, 0.5], [true, false])).toBeCloseTo(0.25);
    expect(signedBias([0, 1, 2], [1, 2, 3])).toBeCloseTo(1);
  });

  it("grade bins and percent bins agree", () => {
    expect(gradeBin("p0_20")).toBe(0);
    expect(gradeBin("p20_50")).toBe(0);
    expect(gradeBin("p50_70")).toBe(1);
    expect(gradeBin("p70_90")).toBe(2);
    expect(gradeBin("p99")).toBe(3);
    expect(gradeBin("p100")).toBe(3);
    expect(gradeBin(null)).toBe(-1);
    expect(percentBin(49)).toBe(0);
    expect(percentBin(50)).toBe(1);
    expect(percentBin(90)).toBe(3);
    expect(distanceToBin(95, 2)).toBe(6);
    expect(distanceToBin(60, 2)).toBe(-10);
    expect(distanceToBin(75, 2)).toBe(0);
    expect(GRADE_BINS.length).toBe(4);
  });

  it("stratified samples are balanced", () => {
    const xs = [...new Array(80).fill("a"), ...new Array(10).fill("b"), ...new Array(30).fill("c")].map((c, i) => ({ c, i }));
    const s = stratifiedSample(xs, (x) => x.c, 6, rng(1));
    expect(s.length).toBe(18);
    for (const c of ["a", "b", "c"]) expect(s.filter((x) => x.c === c).length).toBe(6);
  });

  it("box hit test uses a 10% margin", () => {
    const b: [number, number, number, number] = [100, 100, 50, 40];
    expect(boxHit(b, 125, 120)).toBe(true);
    expect(boxHit(b, 96, 120)).toBe(true); // 4 px left of the box, margin 5 px
    expect(boxHit(b, 94, 120)).toBe(false);
    expect(boxHit(b, 125, 143.9)).toBe(true); // margin 4 px below
    expect(boxHit(b, 125, 144.5)).toBe(false);
    expect(boxHit(b, 94, 120, 0.2)).toBe(true);
  });

  it("projection calls near a boundary accept both neighbours", () => {
    expect(viewCall({ primary: -30, secondary: 25 }).accepted).toEqual(["RAO cranial"]);
    const c = viewCall({ primary: -13, secondary: 25 });
    expect(c.nominal).toBe("AP cranial");
    expect(c.accepted).toEqual(["RAO cranial", "AP cranial"]);
    expect(viewCall({ primary: 40, secondary: -17 }).accepted).toEqual(["LAO caudal (spider)", "LAO"]);
  });

  it("drill ids in content match the drills the section offers", () => {
    const offered = [...Object.keys(DRILL_LABEL), "review"].sort();
    expect([...ANGIO_DRILL_IDS].sort()).toEqual(offered);
  });

  it("CADICA patient degree labels normalise to the three native classes", () => {
    expect(normaliseDegree("> 70%")).toBe(">70%");
    expect(normaliseDegree(">70%")).toBe(">70%");
    expect(normaliseDegree("< 20%")).toBe("<20%");
    expect(normaliseDegree("20-50%")).toBe("20-50%");
    expect(normaliseDegree("20–50%")).toBe("20-50%");
    expect(normaliseDegree("whatever")).toBeNull();
  });

  // A synthetic CADICA run with two lesions in different grade bins on one frame.
  const twoBox: LibRun = {
    id: "p999_v1",
    dataset: "CADICA",
    patientId: "p999",
    base: "/angio-library/cadica/p999_v1/",
    frames: ["1.jpg", "2.jpg", "3.jpg"],
    fps: 15,
    artery: "LCA",
    keyframes: [2],
    worst: "p90_98",
    boxes: {
      "2": [
        [50, 50, 40, 40, "p20_50"],
        [300, 300, 40, 40, "p90_98"],
      ],
    },
  };

  it("locate grades the lesion the learner hit, not the worst on the frame", () => {
    const it = itemFor("locate", twoBox, { runs: [twoBox], patients: [] })!;
    expect(it.lesion).toBe(true);
    expect(it.answer).toBe(3); // stratified on the worst lesion
    expect(it.question).toMatch(/Click a stenosis/);
    // Hit the milder lesion and grade it < 50%: found and graded correctly.
    const mild = scoreLocate(it, { x: 70, y: 70, frame: 2 }, 0, 0.8);
    expect(mild.hit).toBe(true);
    expect(mild.gradeRef).toBe(0);
    expect(mild.gradeAns).toBe(0);
    expect(mild.hitBox?.[4]).toBe("p20_50");
    // Hit the severe lesion: reference grade is its bin.
    const severe = scoreLocate(it, { x: 320, y: 320, frame: 2 }, 2, 0.8);
    expect(severe.gradeRef).toBe(3);
    expect(severe.gradeAns).toBe(2);
    // Off-frame or off-box clicks do not hit.
    expect(scoreLocate(it, { x: 70, y: 70, frame: 1 }, 0, 0.8).hit).toBe(false);
    expect(scoreLocate(it, { x: 200, y: 200, frame: 2 }, 0, 0.8).hit).toBe(false);
    // The set report grading uses the hit box.
    const s = summarise("locate", [mild, severe]);
    expect(s.grading!.n).toBe(2);
    expect(s.grading!.bias).toBeCloseTo(-0.5);
  });

  it("overlapping boxes resolve to the box whose centre is nearest the click", () => {
    const r: LibRun = { ...twoBox, boxes: { "2": [[100, 100, 100, 100, "p20_50"], [140, 140, 30, 30, "p99"]] } };
    expect(hitBox(r, 2, 155, 155)?.[4]).toBe("p99");
    expect(hitBox(r, 2, 105, 105)?.[4]).toBe("p20_50");
  });

  it("constant-answer baseline and chance level", () => {
    expect(chanceLevel([0, 1, 2, 0])).toBeCloseTo(1 / 3);
    expect(chanceLevel([])).toBeNaN();
    const mk = (answer: number, accepted: number[]): DrillItem => ({
      drill: "view",
      mode: "choice",
      key: "x",
      run: twoBox,
      question: "",
      options: ["A", "B", "C"],
      answer,
      accepted,
      explain: "",
    });
    const strict = [mk(0, [0]), mk(1, [1]), mk(2, [2])];
    expect(constantBaseline(strict)!.accuracy).toBeCloseTo(1 / 3);
    const lenient = [mk(0, [0, 1]), mk(1, [1]), mk(2, [2, 1])];
    expect(constantBaseline(lenient)).toEqual({ option: "B", accuracy: 1 });
  });

  it("drill parameters are validated strictly and applied to the drill context", () => {
    const track = (params: Record<string, string>, drill: "view" | "artery" = "view"): Track =>
      ({
        ...TRACKS[0],
        modules: [{ ...TRACKS[0].modules[0], lessons: [{ ...TRACKS[0].modules[0].lessons[0], blocks: [{ kind: "drill", target: "angio-real", drill, params, task: "t" }] }] }],
      }) as Track;
    const errs = (t: Track) => validateTrack(t, new Set(REF_IDS)).filter((e) => /param/.test(e));
    expect(errs(track({ artery: "LCA", borderline: "exclude" }))).toEqual([]);
    expect(errs(track({ artery: "LAD" })).length).toBe(1);
    expect(errs(track({ dataset: "CADICA" })).length).toBe(1);
    expect(errs(track({ artery: "LCA" }, "artery")).length).toBe(1);
    const runs = [twoBox, { ...twoBox, id: "p999_v2", artery: "RCA" as const }];
    const ctx = applyDrillParams({ runs, patients: [] }, "grade", { artery: "RCA" });
    expect(ctx.runs.map((r) => r.id)).toEqual(["p999_v2"]);
    expect(applyDrillParams({ runs, patients: [] }, "dominance", { artery: "RCA" }).runs.length).toBe(2);
    expect(applyDrillParams({ runs, patients: [] }, "view", { borderline: "exclude" }).borderline).toBe("exclude");
    expect(describeDrillParams({ artery: "LCA", borderline: "exclude" })).toBe("left coronary injections only; borderline projections left out");
  });

  it("every drill block parameter in the Academy is one the section applies", () => {
    const blocks = TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.flatMap((l) => l.blocks))).filter((b) => b.kind === "drill" && b.params);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    for (const t of TRACKS) expect(validateTrack(t, new Set(REF_IDS)).filter((e) => /param/.test(e))).toEqual([]);
  });

  it("real-angiogram SRS records move out of the quiz memory", () => {
    const m = (due: string): QuizMemory => ({ reps: 0, ease: 2.3, interval: 1, due, lapses: 1, attempts: 1, correct: 0, last: 1, lastCorrect: false });
    const rest = migrateAngioMemory({ "q-1": m("2026-01-01"), "angio:grade:p1_v1": m("2026-01-01") });
    expect(rest).not.toBeNull();
    expect(Object.keys(rest!)).toEqual(["q-1"]);
    expect(migrateAngioMemory({ "q-1": m("2026-01-01") })).toBeNull();
  });
});

// The library is built locally and not committed; these tests run when it is present.
const ROOT = join(__dirname, "..", "..", "datasets", "library");
const haveLibrary = LIBRARY_SOURCES.every((s) => existsSync(join(ROOT, s.dir, "index.json")));

function loadLocal(): LibDataset[] {
  return mergeByName(LIBRARY_SOURCES.map((s) => buildDataset(JSON.parse(readFileSync(join(ROOT, s.dir, "index.json"), "utf8")) as RawDataset, s.name, s.dir)));
}

describe.skipIf(!haveLibrary)("real-angiogram drills on the local library", () => {
  const data = haveLibrary ? loadLocal() : [];
  const patients = data.flatMap((d) => d.patients);
  const runs = data.flatMap((d) => d.patients.flatMap((p) => p.runs));
  const ctx: DrillContext = { runs, patients, borderline: "accept" };

  it("every CADICA patient's most severe stenosis can be scored correct (42 of 42)", () => {
    const cad = patients.filter((p) => p.dataset === "CADICA");
    expect(cad.length).toBe(42);
    const scorable = cad.filter((p) => {
      const cls = normaliseDegree(p.maxDegree);
      return cls !== null && PATIENT_DEGREE_CLASSES.includes(cls);
    });
    expect(scorable.length).toBe(42);
  });

  it("unstratified base rates would reward guessing", () => {
    const b = baseRates(ctx);
    console.log(
      `base rates: right dominant ${(100 * b.rightDominant).toFixed(1)}%, LCA ${(100 * b.lca).toFixed(1)}%, CADICA run with no or <20% lesion ${(100 * b.noLesion).toFixed(1)}%, borderline views ${(100 * b.borderlineViews).toFixed(1)}%`
    );
    expect(b.rightDominant).toBeGreaterThan(0.6);
    expect(b.lca).toBeGreaterThan(0.6);
    expect(b.borderlineViews).toBeCloseTo(0.347, 2);
  });

  const DRILLS: DrillKind[] = ["artery", "dominance", "occlusion", "collaterals", "view", "grade", "locate", "estimate"];

  for (const drill of DRILLS)
    it(`${drill}: sets are stratified and a constant answerer scores chance with kappa 0`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const set = makeSet(drill, ctx, rng(seed));
        expect(set.length).toBeGreaterThanOrEqual(drill === "view" ? 16 : 8);
        // Equal counts per reference class (locate: lesion vs none).
        const byRef = new Map<string, number>();
        for (const it of set) {
          const k = drill === "locate" ? String(it.lesion) : String(it.answer);
          byRef.set(k, (byRef.get(k) ?? 0) + 1);
        }
        expect(new Set(byRef.values()).size).toBe(1);
        // Yes/no CoronaryDominance drills: equal positives and negatives within every nuisance stratum.
        if (drill === "occlusion" || drill === "collaterals") {
          const by = new Map<string, number>();
          for (const it of set) by.set(stratum(it), (by.get(stratum(it)) ?? 0) + 1);
          for (const [k, n] of by) expect(by.get(k.replace(/^[01]/, (c) => (c === "0" ? "1" : "0")))).toBe(n);
        }
        if (drill === "locate") {
          // Constant "no lesion" and constant "click the centre".
          for (const constant of ["none", "centre"] as const) {
            const ans = set.map((it) =>
              scoreLocate(it, constant === "none" ? null : { x: 256, y: 256, frame: it.startFrame ?? 1 }, constant === "none" ? null : 2, 0.7)
            );
            const s = summarise(drill, ans);
            expect(s.balancedAccuracy).toBeCloseTo(0.5, 6);
            expect(s.kappa.kappa).toBeCloseTo(0, 6);
            // Raw accuracy: "none" is right on exactly half; a constant click can only lose.
            if (constant === "none") expect(s.accuracy).toBeCloseTo(0.5, 6);
            else expect(s.accuracy).toBeLessThanOrEqual(0.5 + 1e-9);
          }
          continue;
        }
        if (drill === "estimate") {
          for (const pct of [10, 60, 80, 95]) {
            const s = summarise(
              drill,
              set.map((it) => scoreEstimate(it, pct, 0.7))
            );
            expect(s.balancedAccuracy).toBeCloseTo(0.25, 6);
            expect(s.accuracy).toBeCloseTo(0.25, 6);
            expect(s.kappa.kappa).toBeCloseTo(0, 6);
            expect(s.weightedKappa!.kappa).toBeCloseTo(0, 6);
          }
          continue;
        }
        const k = set[0].options.length;
        for (let c = 0; c < k; c++) {
          const s = summarise(
            drill,
            set.map((it) => scoreChoice(it, c, 0.7))
          );
          // A constant answer that is one of the reference classes scores exactly chance; one that never
          // is (for example "Left lateral", absent from the library) scores 0. Kappa is 0 either way.
          const present = set.some((it) => it.accepted.includes(c));
          if (present) expect(s.balancedAccuracy).toBeCloseTo(s.chance, 6);
          else expect(s.balancedAccuracy).toBe(0);
          expect(s.kappa.kappa).toBeCloseTo(0, 6);
          if (k === 2) expect(s.balancedAccuracy).toBeCloseTo(0.5, 6);
          // Raw accuracy of a constant answer: exactly chance when only the reference name is
          // accepted. The view drill with borderline acceptance can exceed it; the set report
          // shows that baseline (constantBaseline) instead of claiming chance.
          if (drill !== "view") expect(s.accuracy).toBeCloseTo(present ? s.chance : 0, 6);
          else expect(s.accuracy).toBeLessThanOrEqual(constantBaseline(set)!.accuracy + 1e-9);
        }
      }
    });

  it("view drill with borderline runs excluded is balanced across all views present", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const set = makeSet("view", { ...ctx, borderline: "exclude" }, rng(seed));
      expect(set.every((it) => it.accepted.length === 1)).toBe(true);
      const s = summarise(
        "view",
        set.map((it) => scoreChoice(it, 4, 0.7))
      );
      expect(s.kappa.kappa).toBeCloseTo(0, 6);
      expect(s.balancedAccuracy).toBeCloseTo(s.chance, 6);
      // Strict set: the best constant answer scores exactly chance in raw accuracy too.
      expect(constantBaseline(set)!.accuracy).toBeCloseTo(s.chance, 6);
      expect(s.accuracy).toBeCloseTo(s.chance, 6);
    }
  });

  it("borderline acceptance raises the constant-answer baseline above chance, and the report says so", () => {
    let above = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const set = makeSet("view", ctx, rng(seed));
      const s = summarise("view", set.map((it) => scoreChoice(it, it.answer, 0.7)));
      if (constantBaseline(set)!.accuracy > s.chance + 1e-9) above++;
    }
    console.log(`view drill with borderline acceptance: best constant answer above chance in ${above} of 20 sets`);
    expect(above).toBeGreaterThan(0);
  });

  it("the plan drill is labelled unstratified and its constant baseline is reported", async () => {
    expect(STRATIFIED_DRILLS).not.toContain("plan");
    const set = makeSet("plan", ctx, rng(5));
    const b = constantBaseline(set)!;
    expect(b.accuracy).toBeGreaterThan(0);
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { SetReport } = await import("../ui/sections/RealAngiograms");
    const done = set.map((item) => ({ item, answer: scoreChoice(item, 0, 0.6) }));
    const html = renderToString(createElement(SetReport, { kind: "plan", done, onAgain: () => {} }));
    expect(html).toContain("Not stratified");
    expect(html).toContain("best constant answer");
  }, 240_000);

  it("occlusion and collaterals: positives and negatives come from the same image set and artefact stratum", () => {
    for (const drill of ["occlusion", "collaterals"] as const) {
      const items = runs.map((r) => itemFor(drill, r, ctx)).filter((x): x is DrillItem => !!x);
      // Nothing from the domain-shift subset, which has no positives.
      expect(items.every((it) => librarySubset(it.run) === "dominance-main")).toBe(true);
      const { pairs, perStratum } = matchedPairs(items, rng(1));
      console.log(`${drill}: ${items.filter((i) => i.answer === 0).length} positives, ${items.filter((i) => i.answer === 1).length} negatives, matched pairs ${pairs.length} ${JSON.stringify(perStratum)}`);
      expect(pairs.length).toBeGreaterThanOrEqual(drill === "occlusion" ? 10 : 30);
      for (const [p, n] of pairs) {
        expect(p.answer).toBe(0);
        expect(n.answer).toBe(1);
        expect(nuisanceStratum(p.run)).toBe(nuisanceStratum(n.run));
      }
      // Neither subset nor artefact tag predicts the label within a set.
      for (let seed = 1; seed <= 20; seed++) {
        const set = makeSet(drill, ctx, rng(seed));
        const art = (v: boolean, ans: number) => set.filter((i) => (i.run.tags?.artefact === true) === v && i.answer === ans).length;
        expect(art(true, 0)).toBe(art(true, 1));
        expect(art(false, 0)).toBe(art(false, 1));
      }
      // A negative never comes from a study with a run tagged for the finding.
      for (const it of items.filter((i) => i.answer === 1)) {
        const p = patients.find((x) => x.id === it.run.patientId && x.dataset === it.run.dataset)!;
        expect(p.runs.some((r) => r.tags?.[drill] === true)).toBe(false);
      }
    }
  });

  it("locate frames with several boxes in different grade bins are graded against the box hit", () => {
    const boxed = runs.filter((r) => r.dataset === "CADICA" && r.boxes && Object.keys(r.boxes).length);
    let multi = 0;
    let mixed = 0;
    for (const r of boxed) {
      const it = itemFor("locate", r, ctx)!;
      const bs = r.boxes![String(it.startFrame)];
      if (bs.length > 1) multi++;
      const bins = new Set(bs.map((b) => gradeBin(b[4])));
      if (bins.size < 2) continue;
      mixed++;
      for (const b of bs) {
        const [x, y, w, h] = b;
        const a = scoreLocate(it, { x: x + w / 2, y: y + h / 2, frame: it.startFrame! }, gradeBin(b[4]), 0.8);
        expect(a.hit).toBe(true);
        // A box nested inside another can resolve to either; the reference is always the box returned.
        expect(a.gradeRef).toBe(gradeBin(a.hitBox![4]));
        if (a.hitBox === b) expect(a.gradeAns).toBe(a.gradeRef);
      }
    }
    console.log(`locate keyframes with more than one box: ${multi} of ${boxed.length}; with boxes in different grade bins: ${mixed}`);
    expect(mixed).toBeGreaterThan(0);
  });

  it("drill parameters from a lesson restrict the set (left coronary projections, strict)", () => {
    const c = applyDrillParams(ctx, "view", { artery: "LCA", borderline: "exclude" });
    const set = makeSet("view", c, rng(2));
    expect(set.length).toBeGreaterThan(0);
    expect(set.every((it) => it.run.artery === "LCA" && it.accepted.length === 1)).toBe(true);
  });

  it("an expert reader scores 100% and kappa 1", () => {
    for (const drill of ["artery", "dominance", "view", "grade"] as DrillKind[]) {
      const set = makeSet(drill, ctx, rng(7));
      const s = summarise(
        drill,
        set.map((it) => scoreChoice(it, it.answer, 1))
      );
      expect(s.accuracy).toBe(1);
      expect(s.kappa.kappa).toBeCloseTo(1, 6);
      expect(s.brier).toBe(0);
    }
  });

  it("locate works on every CADICA run with boxes, and the box centre is a hit", () => {
    const boxed = runs.filter((r) => r.dataset === "CADICA" && r.boxes && Object.keys(r.boxes).length);
    expect(boxed.length).toBe(269);
    for (const r of boxed) {
      const it = itemFor("locate", r, ctx)!;
      expect(it).toBeTruthy();
      expect(it.lesion).toBe(true);
      const [x, y, w, h] = r.boxes![String(it.startFrame)][0];
      expect(hitBox(r, it.startFrame!, x + w / 2, y + h / 2)).toBeTruthy();
      const a = scoreLocate(it, { x: x + w / 2, y: y + h / 2, frame: it.startFrame! }, it.answer, 0.9);
      expect(a.correct && a.hit).toBe(true);
      // A click on the opposite corner of the image misses (no box spans the whole field).
      const far = scoreLocate(it, { x: x + w / 2 > 256 ? 2 : 510, y: y + h / 2 > 256 ? 2 : 510, frame: it.startFrame! }, null, 0.9);
      expect(far.hit).toBe(false);
    }
  });

  it("every cine block in the Academy points to a run in the library", () => {
    const ids = new Set(runs.map((r) => r.id));
    const missing: string[] = [];
    for (const t of TRACKS)
      for (const m of t.modules)
        for (const l of m.lessons) for (const b of l.blocks) if (b.kind === "cine" && !ids.has(b.run)) missing.push(`${l.id}: ${b.run}`);
    expect(missing).toEqual([]);
    const cines = TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.flatMap((l) => l.blocks.filter((b) => b.kind === "cine"))));
    expect(cines.length).toBeGreaterThanOrEqual(8);
  });

  it("drill cards and set reports render for every drill (server-side smoke test)", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { DrillCard, SetReport } = await import("../ui/sections/RealAngiograms");
    for (const drill of [...DRILLS, "plan"] as DrillKind[]) {
      const set = makeSet(drill, ctx, rng(11));
      const it0 = set[0];
      const before = renderToString(createElement(DrillCard, { item: it0, index: 0, total: set.length, data, onCommit: () => {}, onNext: () => {} }));
      expect(before).toContain(DRILL_LABEL[drill]);
      const answer =
        it0.mode === "locate" ? scoreLocate(it0, null, null, 0.6) : it0.mode === "estimate" ? scoreEstimate(it0, 75, 0.6) : scoreChoice(it0, it0.answer, 0.6);
      const after = renderToString(
        createElement(DrillCard, { item: it0, index: 0, total: set.length, data, answered: { item: it0, answer }, onCommit: () => {}, onNext: () => {} })
      );
      expect(after).toContain(it0.mode === "estimate" ? "Published spread" : "Next run");
      const report = renderToString(createElement(SetReport, { kind: drill, done: [{ item: it0, answer }], onAgain: () => {} }));
      expect(report).toContain("Balanced accuracy");
    }
  }, 240_000);

  it("wrong reads come back through SRS keys", () => {
    const r = runs.find((x) => x.dataset === "CADICA" && x.worst === "p90_98") as LibRun;
    const it = itemForKey(srsKey("grade", r.id), ctx);
    expect(it?.run.id).toBe(r.id);
    expect(it?.drill).toBe("grade");
  });

  it("next-view planning runs on CoronaryDominance studies with at least 3 runs", () => {
    const studies = planningStudies(patients);
    expect(studies.length).toBeGreaterThan(100);
    const set = makeSet("plan", ctx, rng(5));
    expect(set.length).toBe(8);
    for (const it of set) {
      expect(it.shown!.length).toBeGreaterThanOrEqual(2);
      expect(it.accepted).toContain(it.answer);
    }
    // half credit when the chosen view was taken later in the study
    const withLater = set.find((it) => it.laterViews?.some((v) => !it.accepted.map((i) => it.options[i]).includes(v)));
    if (withLater) {
      const v = withLater.laterViews!.find((x) => !withLater.accepted.map((i) => withLater.options[i]).includes(x))!;
      expect(scoreChoice(withLater, withLater.options.indexOf(v), 0.5).credit).toBe(0.5);
    }
  });
});
