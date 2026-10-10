import { describe, it, expect } from "vitest";
import type { CaseStudy, LaunchFile, Track } from "../../content/schema";
import { buildKnownLaunch, validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import type { Block } from "../../content/schema";
import {
  PRACTICE_INDEX,
  buildPracticeIndex,
  casePractice,
  describeLaunch,
  lessonIdFor,
  lessonPractice,
  practiceAfterCase,
  practiceForCase,
  practiceForLesson,
} from "./practiceIndex";

const FIXTURES = import.meta.glob<LaunchFiles[string]>("./__fixtures__/*.launch.ts", { eager: true });
const DEMO = "./__fixtures__/demo.launch.ts";

/** A minimal content root with lessons x and y and case case-z. */
const lesson = (id: string) => ({ id, title: id, minutes: 1, blocks: [] });
const caseZ = { id: "case-z", title: "z", trackId: "foundations", stage: 1, provenance: { kind: "synthetic" }, summary: "", presentation: "", findings: [], steps: [], outcome: "", learningPoints: [] } as unknown as CaseStudy;
const ROOT: Track[] = [
  {
    id: "foundations",
    order: 0,
    title: "t",
    tagline: "",
    description: "",
    stage: 1,
    modules: [{ id: "m", title: "m", stage: 1, summary: "", objectives: [], lessons: [lesson("x"), lesson("y")], quiz: [] }],
    cases: [caseZ],
  },
];

describe("practice index", () => {
  it("lists a fixture scenario under lesson x with its params", () => {
    const idx = buildPracticeIndex({ [DEMO]: FIXTURES[DEMO] });
    const x = practiceForLesson("x", idx);
    expect(x).toHaveLength(1);
    expect(x[0]).toMatchObject({ sim: "haemo", scenario: "fixture-practice", mode: "guided", title: "Fixture practice scenario" });
    expect(x[0].params).toEqual({ scenario: "fixture-practice", mode: "guided" });
  });

  it("never lists a held-out scenario or variant", () => {
    const idx = buildPracticeIndex(FIXTURES);
    const all = [...idx.byLesson.values(), ...idx.byCase.values()].flat();
    expect(all.some((e) => e.scenario === "fixture-exam")).toBe(false);
    expect(all.some((e) => e.variant === "vx")).toBe(false);
    // A link to the held-out scenario is dropped from the index and refused by the validator.
    const bad: LaunchFile = { sim: "haemo", links: [{ scenario: "fixture-exam", lessonIds: ["x"] }] };
    const withBad = { ...FIXTURES, "./bad.launch.ts": { launch: bad } };
    expect(practiceForLesson("x", buildPracticeIndex(withBad))).toHaveLength(1);
    const errs = validateLaunchLinks({ tracks: ROOT }, buildKnownLaunch(withBad));
    expect(errs.some((e) => /held out/.test(e))).toBe(true);
  });

  it("a links entry adds a start to a scenario declared in another file and lists it under its lesson and case", () => {
    const idx = buildPracticeIndex(FIXTURES);
    const y = practiceForLesson("y", idx);
    expect(y).toHaveLength(1);
    expect(y[0].params).toEqual({ scenario: "fixture-practice", start: "late-start", mode: "supervised" });
    expect(y[0].title).toBe("Fixture practice scenario · Later start");
    expect(practiceForCase("case-z", idx).map((e) => e.params)).toEqual([y[0].params]);
    expect(describeLaunch("haemo", y[0].params, idx)).toBe("Fixture practice scenario · start: Later start · supervised mode");
    expect(validateLaunchLinks({ tracks: ROOT }, buildKnownLaunch(FIXTURES))).toEqual([]);
  });

  it("a links entry that names an unknown start fails validateLaunchLinks", () => {
    const unknownStart: LaunchFile = { sim: "haemo", links: [{ scenario: "fixture-practice", start: "nope", lessonIds: ["x"] }] };
    const files = { ...FIXTURES, "./unknown-start.launch.ts": { launch: unknownStart } };
    const errs = validateLaunchLinks({ tracks: ROOT }, buildKnownLaunch(files));
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/unknown start "nope"/);
    // and the index leaves the broken link out
    expect(practiceForLesson("x", buildPracticeIndex(files))).toHaveLength(1);
  });

  it("refuses links to lessons and cases that do not exist, and duplicate scenario ids", () => {
    const stray: LaunchFile = { sim: "haemo", scenarios: [{ id: "fixture-practice", title: "dup", lessonIds: ["no-such-lesson"] }], links: [{ scenario: "fixture-practice", lessonIds: ["missing"], caseIds: ["missing-case"] }] };
    const errs = validateLaunchLinks({ tracks: ROOT }, buildKnownLaunch({ ...FIXTURES, "./zz.launch.ts": { launch: stray } }));
    expect(errs.some((e) => /already declared/.test(e))).toBe(true);
    expect(errs.some((e) => /unknown lesson "missing"/.test(e))).toBe(true);
    expect(errs.some((e) => /unknown case "missing-case"/.test(e))).toBe(true);
  });

  it("the runtime index excludes the fixtures and every entry it lists validates", () => {
    expect(practiceForLesson("x")).toEqual([]);
    expect(PRACTICE_INDEX.known.problems).toEqual([]);
    for (const e of [...PRACTICE_INDEX.byLesson.values(), ...PRACTICE_INDEX.byCase.values()].flat()) expect(e.source).not.toMatch(/__fixtures__/);
  });
});

describe("practice index: built-in drills, lessons and cases", () => {
  it("lists an angio-real reading drill linked from a .launch.ts, as the validator accepts it", () => {
    const reading: LaunchFile = { sim: "angio-real", links: [{ drill: "locate", lessonIds: ["x"] }] };
    const files = { "./reading.launch.ts": { launch: reading } };
    expect(validateLaunchLinks({ tracks: ROOT }, buildKnownLaunch(files))).toEqual([]);
    const x = practiceForLesson("x", buildPracticeIndex(files));
    expect(x).toHaveLength(1);
    expect(x[0]).toMatchObject({ sim: "angio-real", drill: "locate" });
    expect(x[0].params).toEqual({ drill: "locate" });
  });

  it("finds a lesson by its own blocks array and leaves out entries the lesson links inline", () => {
    const idx = buildPracticeIndex({ [DEMO]: FIXTURES[DEMO] });
    const blocks: Block[] = [{ kind: "p", text: "Some text." }];
    const content = { TRACKS: [{ ...ROOT[0], modules: [{ ...ROOT[0].modules[0], lessons: [{ ...lesson("x"), blocks }] }] }] };
    expect(lessonIdFor(content, blocks)).toBe("x");
    expect(lessonIdFor(content, [...blocks])).toBeUndefined();
    const rows = lessonPractice(lessonIdFor(content, blocks), blocks, idx);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sim: "haemo", title: "Fixture practice scenario", params: { scenario: "fixture-practice", mode: "guided" } });
    // An inline sim block for the same scenario (any mode) removes the row.
    const inline: Block[] = [...blocks, { kind: "sim", sim: "haemo", task: "Run it", params: { scenario: "fixture-practice", mode: "supervised" } }];
    expect(lessonPractice("x", inline, idx)).toEqual([]);
    expect(lessonPractice(undefined, blocks, idx)).toEqual([]);
  });

  it("merges a case's own practice with index entries, one row per lab place, and only after the case has a record", () => {
    const idx = buildPracticeIndex(FIXTURES);
    expect(casePractice(caseZ, idx).map((p) => p.params)).toEqual([{ scenario: "fixture-practice", start: "late-start", mode: "supervised" }]);
    // The index entry carries a mode; the case's own entry for the same place without one is not repeated.
    const own = { ...caseZ, practice: [{ sim: "haemo", task: "Own task", params: { scenario: "fixture-practice", start: "late-start" } }] } as CaseStudy;
    const rows = casePractice(own, idx);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Own task");
    expect(practiceAfterCase(caseZ, {}, idx)).toEqual([]);
    expect(practiceAfterCase(caseZ, { "case-z": { best: 80 } }, idx)).toHaveLength(1);
  });
});

describe("practice rendering (server-side smoke test)", () => {
  it("renders 'Practise this in the lab' rows and a sim block with params", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { PracticeList, BlockView } = await import("./BlockRenderer");
    const html = renderToString(createElement(PracticeList, { items: [{ key: "k", sim: "haemo", title: "Fixture practice scenario", params: { scenario: "fixture-practice", mode: "guided" } }] }));
    expect(html).toContain("Practise this in the lab");
    expect(html).toContain("Fixture practice scenario");
    expect(html).toContain("Haemodynamics lab");
    expect(renderToString(createElement(PracticeList, { items: [] }))).toBe("");
    const sim = renderToString(createElement(BlockView, { b: { kind: "sim", sim: "haemo", task: "Do the study", params: { scenario: "pe-massive", mode: "supervised" } } }));
    expect(sim.replace(/<!-- -->/g, "")).toContain("Opens at pe-massive · supervised mode.");
  });
});
