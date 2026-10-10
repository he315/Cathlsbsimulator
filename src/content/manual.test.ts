// The manual curriculum (src/content/manual/**): structure, sources, lab tips and topic coverage.
// Fast and self-contained, so module authors can run it after every edit:
//   npx vitest run src/content/manual.test.ts
// MANUAL_COMPLETE=1 also requires every coverage-map topic to be taught by a manual lesson.
import { describe, expect, it } from "vitest";
import { TRACKS } from "./index";
import { MANUAL_TRACKS } from "./manual/index";
import { REFERENCES } from "./refs";
import { LAB_PROCEDURES, LAB_TIPS, type LabTip } from "./lab/tips";
import { validateTips, validateTrack } from "./validate";
import coverage from "../../docs/curriculum/coverage-map-2026-10-06.json";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const REF_IDS = new Set(REFERENCES.map((r) => r.id));
const TOPIC_IDS = new Set((coverage as { topics: { id: string }[] }).topics.map((t) => t.id));
const manualLessons = MANUAL_TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => ({ t, m, l }))));
const ALL_LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));

describe("manual curriculum", () => {
  it("every manual track validates, with ids unique across the whole Academy", () => {
    const seen = new Set<string>();
    const problems: string[] = [];
    for (const t of TRACKS.filter((x) => x.order < 10)) validateTrack(t, REF_IDS, seen);
    for (const t of MANUAL_TRACKS) problems.push(...validateTrack(t, REF_IDS, seen));
    expect(problems).toEqual([]);
  });

  it("every lab tip validates and points at a lesson that exists", () => {
    expect(validateTips(LAB_TIPS, ALL_LESSON_IDS, REF_IDS)).toEqual([]);
  });

  it("every structural, mcs and pericardiocentesis tip names a known procedure, and the validator enforces it", () => {
    const known = new Set<string>(LAB_PROCEDURES);
    const unnamed = LAB_TIPS.filter(
      (t) => (t.lab === "structural" || t.lab === "mcs" || t.id.startsWith("bed-peri-")) && !t.when.procedure?.some((p) => known.has(p))
    ).map((t) => t.id);
    expect(unnamed).toEqual([]);
    // no tip is left on the retired "pericardiocentesis" phase alias
    expect(LAB_TIPS.filter((t) => t.when.phase?.includes("pericardiocentesis")).map((t) => t.id)).toEqual([]);

    const sample = LAB_TIPS.find((t) => t.lab === "structural")!;
    const bare = (over: Partial<LabTip>): LabTip => ({ ...sample, id: `${over.lab ?? sample.lab}-x-no-procedure`, ...over });
    const errs = (t: LabTip) => validateTips([t], ALL_LESSON_IDS, REF_IDS);
    expect(errs(bare({ lab: "structural", when: { phase: ["plan"] } })).some((e) => /a structural tip must name its procedure/.test(e))).toBe(true);
    expect(errs(bare({ lab: "mcs", when: { phase: ["insert"] } })).some((e) => /an mcs tip must name its procedure/.test(e))).toBe(true);
    expect(errs(bare({ lab: "bedside", when: { phase: ["needle"] } })).some((e) => /a bedside tip must name its procedure/.test(e))).toBe(true);
    expect(errs(bare({ lab: "bedside", when: { phase: ["pericardiocentesis"] } })).some((e) => /"pericardiocentesis" is retired/.test(e))).toBe(true);
    // the pacing tips on the deprecated "pacing" phase wait for tip-retarget-catchup
    expect(errs(bare({ lab: "bedside", when: { phase: ["pacing"] } }))).toEqual([]);
    expect(errs(bare({ lab: "structural", when: { phase: ["plan"], procedure: ["laao"] } }))).toEqual([]);
  });

  it("every manual lesson names its sources and topics, and asks at least one check question", () => {
    const problems: string[] = [];
    for (const { l } of manualLessons) {
      if (!l.sources?.length) problems.push(`${l.id}: no sources`);
      if (!l.topics?.length) problems.push(`${l.id}: no topics`);
      for (const tp of l.topics ?? []) if (!TOPIC_IDS.has(tp)) problems.push(`${l.id}: topic "${tp}" is not in the coverage map`);
      if (!l.blocks.some((b) => b.kind === "check")) problems.push(`${l.id}: no check block`);
    }
    expect(problems).toEqual([]);
  });

  it("every manual module has a quiz of at least six items", () => {
    const short = MANUAL_TRACKS.flatMap((t) => t.modules.filter((m) => m.quiz.length < 6).map((m) => `${m.id}: ${m.quiz.length}`));
    expect(short).toEqual([]);
  });

  it("covers the coverage-map topics (all of them when MANUAL_COMPLETE=1)", () => {
    const taught = new Set(manualLessons.flatMap(({ l }) => l.topics ?? []));
    const missing = [...TOPIC_IDS].filter((id) => !taught.has(id));
    if (env.MANUAL_COMPLETE === "1") expect(missing).toEqual([]);
    else console.info(`manual curriculum: ${TOPIC_IDS.size - missing.length} of ${TOPIC_IDS.size} topics taught`);
  });
});
