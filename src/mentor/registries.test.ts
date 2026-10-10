// found-mentor-registries: the rule, debrief check and debrief section
// registries, the decision ledger in the debrief and the skill-card schedule.
import { beforeEach, describe, expect, it } from "vitest";
import type { MistakeCode } from "../types";
import { emptyFrame, ProcedureRecorder, type ProcedureRecord } from "./telemetry";
import { assessAttempt } from "./index";
import { buildDebrief, completeGap, runDebriefChecks, TIP_SHOWN_TELEMETRY, tipsShownOf, withLedger, type DebriefInput } from "./debrief";
import { collectChecks, CHECK_FILES, DEBRIEF_CHECKS } from "./debriefChecks/index";
import { ALL_RULES, collectRules, MENTOR_PARAMS, RULE_FILES, RULES, ruleById, TIMEOUT_RULE, type MentorRule } from "./rules";
import { MentorEngine } from "./mentor";
import type { MentorInput } from "./context";
import type { DecisionRecord } from "./ledger";
import { cardForCode, dueCardIds, isSchedulableCardId, reviewCard, scheduleCards, SKILL_CARD_TEMPLATES } from "./skillCards";
import { dueIds, partitionDue } from "../simulation/srs";
import { useProgressStore } from "../state/useProgressStore";
import type { RecordingMeta } from "./types";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const meta = (over: Partial<RecordingMeta> = {}): RecordingMeta => ({ id: "rec", startedAt: 0, caseId: "easy-rca-0", lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1", ...over });

/** A short record with a damped injection (one damped-injection gap) and optional extra events. */
function dampedRecord(extra: { kind: string; data?: Record<string, unknown> }[] = []): ProcedureRecord {
  const rec = new ProcedureRecorder(meta());
  let t = 0;
  let step = 0;
  const frame = () => {
    t += 0.1;
    step++;
    rec.sample({ ...emptyFrame(), tWall: t, step }, true);
  };
  for (let i = 0; i < 10; i++) frame();
  rec.event({ kind: "inject", data: { ml: 6, aspirated: "clean", pressure: "damped", outcome: "deep-reflux", engagement: "deep-rca" }, tWall: t, tPatient: t, step, cmd: 0 });
  for (const e of extra) {
    frame();
    rec.event({ kind: e.kind, data: e.data, tWall: t, tPatient: t, step, cmd: 0 });
  }
  for (let i = 0; i < 10; i++) frame();
  return rec.toRecord();
}

const DECISIONS: DecisionRecord[] = [
  { id: "access-route", t: 12, stage: "access", label: "Access route", correct: true, expected: "Radial", given: "Radial", lessonId: "lesson-access-fixture" },
  { id: "closure-choice", t: 300, stage: "closure", label: "Closure", correct: false, expected: "Manual compression", given: "Plug device", lessonId: "lesson-closure-fixture", tipIds: [] },
];

const baseInput = (t: number, over: Partial<MentorInput> = {}): MentorInput => ({
  tWall: t,
  lab: "diagnostic",
  engagement: "non-selective",
  pressure: "aortic",
  sys: 120,
  dia: 70,
  resistance: 0,
  advancing: false,
  insertion: 0,
  aspirated: "unknown",
  beam: 0,
  cArm: { laoRao: 0, cranialCaudal: 0 },
  ...over,
});

// ---------------------------------------------------------------------------
// rules
// ---------------------------------------------------------------------------

describe("rule registry", () => {
  const RULE_IDS = ["damped-before-inject", "conus", "lv-entry", "push-resistance", "no-aspirate", "foreshortened-view", "wire-septal", "device-beyond-wire", "oversized-balloon", "deploy-without-run"];

  // Later packages add rule files; these checks hold for the two groups split out here whatever else is registered.
  const legacy = () => RULES.filter((r) => RULE_IDS.includes(r.id)).map((r) => r.id);

  it("RULES has the ids and order it had as one array, from two group files", () => {
    expect(Object.keys(RULE_FILES)).toEqual(expect.arrayContaining(["./diagnostic.ts", "./pciLegacy.ts"]));
    const groups = [...(RULE_FILES["./diagnostic.ts"].rules ?? []), ...(RULE_FILES["./pciLegacy.ts"].rules ?? [])].map((r) => r.id);
    expect(groups).toEqual(RULE_IDS);
    expect(legacy()).toEqual(RULE_IDS);
    // every registered rule is in RULES once (with only the two groups, RULES is exactly RULE_IDS)
    expect(RULES.length).toBe(Object.values(RULE_FILES).reduce((n, m) => n + m.rules.length, 0));
    if (Object.keys(RULE_FILES).length === 2) expect(RULES.map((r) => r.id)).toEqual(RULE_IDS);
    expect(ALL_RULES.map((r) => r.id)).toEqual([...RULES.map((r) => r.id), "time-out"]);
    expect(ALL_RULES[ALL_RULES.length - 1]).toBe(TIMEOUT_RULE);
    expect(ruleById("wire-septal")?.lab).toBe("pci");
    expect(MENTOR_PARAMS.pushStopS).toBe(3);
  });

  it("a file under rules/ registers its rules without editing an index (fixture)", () => {
    const withFixture = import.meta.glob(["./rules/*.ts", "!./rules/index.ts", "./rules/__fixtures__/*.ts"], { eager: true });
    const rules = collectRules(withFixture);
    const ids = rules.map((r) => r.id);
    // the real registry plus the fixture, nothing else changed
    expect(ids.filter((id) => id !== "fixture-heavy-hand")).toEqual(RULES.map((r) => r.id));
    // the fixture's order (150) puts its group between the diagnostic (100) and PCI (200) groups
    expect(ids.indexOf("fixture-heavy-hand")).toBeGreaterThan(ids.indexOf("foreshortened-view"));
    expect(ids.indexOf("fixture-heavy-hand")).toBeLessThan(ids.indexOf("wire-septal"));
    // and the engine runs it
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 }, [...rules, TIMEOUT_RULE]);
    const said = [];
    for (let t = 0; t < 4; t += 0.1) said.push(...eng.step(baseInput(t, { resistance: 0.99 })));
    expect(said.some((u) => u.ruleId === "fixture-heavy-hand" && u.text.startsWith("Fixture:"))).toBe(true);
    // the default engine does not know the fixture
    expect(new MentorEngine().rules.some((r) => r.id === "fixture-heavy-hand")).toBe(false);
  });

  it("allows the new pre-action kinds in stopOn", () => {
    const withFixture = collectRules(import.meta.glob(["./rules/__fixtures__/*.ts"], { eager: true }), []);
    const r = withFixture[0] as MentorRule;
    const ctx = new MentorEngine().tracker.update(baseInput(0, { resistance: 0.99 }));
    expect(r.stopOn!("power-inject", ctx)).toBe(true);
    expect(r.stopOn!("give-ic", ctx)).toBe(false);
  });

  it("refuses a file without rules, a malformed rule and a duplicate id", () => {
    const ok = RULE_FILES["./diagnostic.ts"];
    expect(() => collectRules({ "./empty.ts": {} })).toThrow(/does not export 'rules'/);
    expect(() => collectRules({ "./noorder.ts": { rules: [] } })).toThrow(/numeric 'order'/);
    expect(() => collectRules({ "./a.ts": ok, "./b.ts": ok })).toThrow(/declared by .*a\.ts and .*b\.ts/);
    const timeoutClash = { order: 1, rules: [{ ...RULES[0], id: "time-out" }] };
    expect(() => collectRules({ "./t.ts": timeoutClash })).toThrow(/'time-out' is declared by the reserved rules/);
    const noLines = { order: 1, rules: [{ ...RULES[0], id: "x", lines: {} }] };
    expect(() => collectRules({ "./x.ts": noLines })).toThrow(/ladder levels/);
  });
});

// ---------------------------------------------------------------------------
// registry files never import their registry at runtime (that would be a cycle)
// ---------------------------------------------------------------------------

describe("registry files import their registry for types only", () => {
  // Over the whole source, so multi-line imports, re-exports, side-effect and dynamic imports count.
  const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const CLAUSE = String.raw`(?:[\w$]+\s*,\s*)?(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\}|[\w$]+)`;
  const runtimeImport = (src: string, targets: string[]) =>
    targets.some((t) => {
      const spec = String.raw`["']${esc(t)}(?:\.tsx?)?["']`;
      const from = new RegExp(String.raw`(?:^|[;\n])\s*(?:import|export)\s+(?!type\b)${CLAUSE}\s*from\s*${spec}`, "m");
      const bare = new RegExp(String.raw`(?:^|[;\n])\s*import\s*${spec}`, "m");
      const dynamic = new RegExp(String.raw`\bimport\(\s*${spec}\s*\)`);
      return from.test(src) || bare.test(src) || dynamic.test(src);
    });

  it("the guard sees every runtime form and passes type-only imports", () => {
    const T = ["../rules"];
    expect(runtimeImport(`import {\n  MENTOR_PARAMS,\n  RULES\n} from "../rules";`, T)).toBe(true);
    expect(runtimeImport(`export { MENTOR_PARAMS } from "../rules";`, T)).toBe(true);
    expect(runtimeImport(`export * from '../rules';`, T)).toBe(true);
    expect(runtimeImport(`import * as R from "../rules";`, T)).toBe(true);
    expect(runtimeImport(`import "../rules";`, T)).toBe(true);
    expect(runtimeImport(`const m = await import("../rules");`, T)).toBe(true);
    expect(runtimeImport(`import def, { x } from "../rules.ts";`, T)).toBe(true);
    expect(runtimeImport(`import type { MentorRule } from "../rules";\nexport type { MentorRule } from "../rules";`, T)).toBe(false);
    expect(runtimeImport(`import type {\n  MentorRule,\n} from "../rules";`, T)).toBe(false);
    expect(runtimeImport(`import { x } from "../rules/other";`, T)).toBe(false);
  });

  it("rule files, check files and section files", () => {
    const rules = import.meta.glob<string>(["./rules/*.ts", "!./rules/index.ts", "./rules/__fixtures__/*.ts"], { query: "?raw", import: "default", eager: true });
    const checks = import.meta.glob<string>(["./debriefChecks/*.ts", "!./debriefChecks/index.ts", "./debriefChecks/__fixtures__/*.ts"], { query: "?raw", import: "default", eager: true });
    const sections = import.meta.glob<string>(["../ui/mentor/debrief/*.tsx", "../ui/mentor/debrief/__fixtures__/*.tsx"], { query: "?raw", import: "default", eager: true });
    expect(Object.keys(rules).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(sections).length).toBeGreaterThanOrEqual(2);
    for (const [p, src] of Object.entries(rules)) expect(runtimeImport(src, ["../rules", "../../rules", "./index", "../index"]), p).toBe(false);
    for (const [p, src] of Object.entries(checks)) expect(runtimeImport(src, ["../debrief", "../../debrief", "./index", "../index"]), p).toBe(false);
    for (const [p, src] of Object.entries(sections)) expect(runtimeImport(src, ["./index", "../index", "../Debrief", "../../Debrief"]), p).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// debrief checks
// ---------------------------------------------------------------------------

describe("debrief check registry", () => {
  it("registers every check file, and without checks the debrief is as it was", () => {
    expect(DEBRIEF_CHECKS.map((c) => c.path)).toEqual(collectChecks(CHECK_FILES).map((c) => c.path));
    const r = dampedRecord();
    const as = assessAttempt(r);
    const d = buildDebrief({ record: r, analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: false } }, []);
    expect(d.analysis.gaps.map((g) => g.code)).toEqual(["damped-injection"]);
    expect(d.analysis.gaps[0].check).toBeUndefined();
    expect(d.checkErrors).toBeUndefined();
  });

  it("a file under debriefChecks/ registers its check without editing an index (fixture); its gaps rank with the debrief's own", () => {
    const all = collectChecks(import.meta.glob(["./debriefChecks/*.ts", "!./debriefChecks/index.ts", "./debriefChecks/__fixtures__/*.ts"], { eager: true }));
    expect(all.map((c) => c.id)).toContain("fixture-wrong-decision");
    expect(all.length).toBe(DEBRIEF_CHECKS.length + 1);
    const checks = all.filter((c) => c.id === "fixture-wrong-decision");
    const as = assessAttempt(dampedRecord());
    const input: DebriefInput = { record: dampedRecord(), analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: false }, decisions: DECISIONS };
    const d = buildDebrief(input, checks);
    const ids = d.analysis.gaps.map((g) => g.id);
    expect(ids).toContain("gap-damped-injection");
    expect(ids).toContain("fixture-closure-choice");
    const g = d.analysis.gaps.find((x) => x.id === "fixture-closure-choice")!;
    expect(g.check).toBe("fixture-wrong-decision");
    expect(g.lessonId).toBe("lesson-closure-fixture");
    expect(g.strategy).toBe("directive");
    expect(g.directive).toMatch(/expected answer was Manual compression/);
    expect(g.cardId).toBeUndefined();
    expect(d.summary.takeHomeOptions).toContain("Fixture: next time I will check the decision against the plan.");
    // only the gap with a card schedules one
    expect(d.summary.cardsToSchedule).toEqual([cardForCode("damped-injection").id]);
    // the debrief's own gaps run first: a check gap with the same id is dropped
    const clash = buildDebrief(input, [{ id: "clash", order: 0, path: "./clash.ts", check: () => [{ id: "gap-damped-injection", title: "x", severity: "efficiency", tWall: 0, teaching: "x" }] }]);
    expect(clash.analysis.gaps.filter((x) => x.id === "gap-damped-injection").map((x) => x.title)).not.toContain("x");
  });

  it("completes a check gap like the debrief's own and survives a failing check", () => {
    const r = dampedRecord();
    const g = completeGap({ id: "c1", title: "Late heparin", severity: "safety", tWall: 1, teaching: "Give heparin before the wire.", code: "no-aspirate", occurrences: 2, advocacy: "I noticed the wire went in first." }, r, "chk");
    expect(g.priority).toBe(6);
    expect(g.strategy).toBe("advocacy-inquiry");
    expect(g.inquiry).toBe("What were you seeing at that point?");
    expect(g.frames!.length).toBeGreaterThanOrEqual(2);
    expect(g.cardId).toBe(cardForCode("no-aspirate").id);
    expect(g.clip).toEqual({ from: 0, to: 5 });
    const as = assessAttempt(r);
    const input: DebriefInput = { record: r, analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: true } };
    const res = runDebriefChecks(input, [
      { id: "boom", order: 0, path: "./boom.ts", check: () => { throw new Error("bad data"); } },
      { id: "ok", order: 1, path: "./ok.ts", check: () => [{ id: "ok-1", title: "Fine", severity: "efficiency", tWall: 0, teaching: "Noted." }] },
    ]);
    expect(res.errors).toEqual(["boom: bad data"]);
    expect(res.gaps.map((x) => x.id)).toEqual(["ok-1"]);
    expect(buildDebrief(input, [{ id: "boom", order: 0, path: "./boom.ts", check: () => { throw new Error("bad data"); } }]).checkErrors).toEqual(["boom: bad data"]);
  });

  it("refuses a file without check() and a duplicate id", () => {
    expect(() => collectChecks({ "./x.ts": {} })).toThrow(/does not export 'check'/);
    const check = () => [];
    expect(() => collectChecks({ "./a.ts": { check, id: "same" }, "./b.ts": { check, id: "same" } })).toThrow(/'same' is declared by/);
    expect(collectChecks({ "./late.ts": { check }, "./early.ts": { check, order: 1 } }).map((c) => c.id)).toEqual(["early", "late"]);
  });
});

// ---------------------------------------------------------------------------
// the ledger and tips in the debrief
// ---------------------------------------------------------------------------

describe("decision ledger and tips in the debrief", () => {
  it("buildDebrief carries the decisions and the tips shown (record events and lab ids, each once)", async () => {
    const { LAB_TIPS } = await import("../content/lab/tips");
    const [a, b] = LAB_TIPS;
    const r = dampedRecord([
      { kind: TIP_SHOWN_TELEMETRY, data: { tipId: a.id } },
      { kind: TIP_SHOWN_TELEMETRY, data: { tipId: a.id } },
    ]);
    expect(tipsShownOf(r, [b.id, a.id]).map((t) => t.id)).toEqual([a.id, b.id]);
    const as = assessAttempt(r);
    const d = buildDebrief({ record: r, analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: false }, decisions: DECISIONS, tipsShown: [b.id] });
    expect(d.ledger.decisions.map((x) => x.id)).toEqual(["access-route", "closure-choice"]);
    expect(d.ledger.summary).toMatchObject({ total: 2, correct: 1, lessonsToReview: ["lesson-closure-fixture"], stages: ["access", "closure"] });
    expect(d.tipsShown.map((t) => t.id)).toEqual([a.id, b.id]);
    expect(d.tipsShown[0].tWall).toBeGreaterThan(0);
    // assessAttempt has no ledger; withLedger adds it afterwards
    expect(as.debrief.ledger.decisions).toEqual([]);
    const w = withLedger(as.debrief, DECISIONS, [b.id]);
    expect(w.ledger.summary.total).toBe(2);
    expect(withLedger(w, [{ ...DECISIONS[1], correct: true, given: "Manual compression" }]).ledger.summary.correct).toBe(2);
    expect(withLedger(as.debrief)).toBe(as.debrief);
  }, 30_000); // the first import of the tip registry is slow on a cold transform

  it("the Decisions tab shows each decision with its lesson link, and the tips with theirs", async () => {
    const { createElement: h } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { loadTips } = await import("../ui/lab/useLabTips");
    const tipsMod = await loadTips();
    const [a] = tipsMod.LAB_TIPS;
    const { DEBRIEF_SECTIONS } = await import("../ui/mentor/debrief/index");
    const { LedgerSection, loadTipCard } = await import("../ui/mentor/debrief/LedgerSection");
    // before the tip card has loaded, the tips show as loading (the card is not in the debrief's chunk)
    const early = renderToStaticMarkup(h(LedgerSection, { model: withLedger(assessAttempt(dampedRecord()).debrief, DECISIONS, [a.id]), t0: 0, onOpenLesson: () => undefined }));
    expect(early).toContain("Loading tips...");
    await loadTipCard();
    const { default: Debrief } = await import("../ui/mentor/Debrief");
    expect(DEBRIEF_SECTIONS.map((s) => s.id)).toContain("ledger");
    const r = dampedRecord([{ kind: TIP_SHOWN_TELEMETRY, data: { tipId: a.id } }]);
    const model = withLedger(assessAttempt(r).debrief, DECISIONS);
    const ledger = DEBRIEF_SECTIONS.find((s) => s.id === "ledger")!;
    expect(ledger.applies({ model, t0: 0 })).toBe(true);
    expect(ledger.applies({ model: assessAttempt(dampedRecord()).debrief, t0: 0 })).toBe(false);
    const opened: string[] = [];
    const html = renderToStaticMarkup(h(LedgerSection, { model, t0: 0, onOpenLesson: (id: string) => opened.push(id) }));
    expect(html).toContain("1 of 2 decisions matched the expected answer. 1 lesson to review.");
    expect(html).toContain("Plug device");
    expect(html).toContain("Manual compression");
    expect(html).toContain("Not as expected");
    expect(html).toContain('data-lesson="lesson-access-fixture"');
    expect(html).toContain('data-lesson="lesson-closure-fixture"');
    expect(html).toContain(`data-tip="${a.id}"`);
    expect(html).toContain(`data-lesson="${a.lessonId}"`);
    expect(html).toContain("Open lesson");
    // the debrief offers the tab, locked until the learner has rated themselves
    const db = renderToStaticMarkup(h(Debrief, { model: assessAttempt(dampedRecord()).debrief, decisions: DECISIONS, sections: [ledger], onFinish: () => undefined }));
    expect(db).toMatch(/<button[^>]*disabled=""[^>]*>Decisions<\/button>/);
    expect(db).not.toContain("Plug device");
    // tip ids that resolve to no tip leave no empty tips heading
    const none = renderToStaticMarkup(h(LedgerSection, { model: withLedger(assessAttempt(dampedRecord()).debrief, DECISIONS, ["no-such-tip"]), t0: 0, onOpenLesson: () => undefined }));
    expect(none).not.toContain("Tips shown during the run");
    expect(none).not.toContain("Tips for these decisions");
    // a tip only linked from a decision is not listed as shown during the run
    const [, b] = tipsMod.LAB_TIPS;
    const linked = DECISIONS.map((d, i) => (i === 0 ? { ...d, tipIds: [b.id, a.id] } : d));
    const split = renderToStaticMarkup(h(LedgerSection, { model: withLedger(assessAttempt(r).debrief, linked), t0: 0, onOpenLesson: () => undefined }));
    const shownAt = split.indexOf("Tips shown during the run");
    const linkedAt = split.indexOf("Tips for these decisions");
    expect(shownAt).toBeGreaterThan(-1);
    expect(linkedAt).toBeGreaterThan(shownAt);
    expect(split.slice(shownAt, linkedAt)).toContain(`data-tip="${a.id}"`);
    expect(split.slice(shownAt, linkedAt)).not.toContain(`data-tip="${b.id}"`);
    expect(split.slice(linkedAt)).toContain(`data-tip="${b.id}"`);
    expect(split.slice(linkedAt)).not.toContain(`data-tip="${a.id}"`);
    // with nothing shown, only the decisions' list appears
    const onlyLinked = renderToStaticMarkup(h(LedgerSection, { model: withLedger(assessAttempt(dampedRecord()).debrief, linked), t0: 0, onOpenLesson: () => undefined }));
    expect(onlyLinked).not.toContain("Tips shown during the run");
    expect(onlyLinked).toContain("Tips for these decisions");
  });

  it("the section glob leaves out co-located test files", async () => {
    const src = (await import("../ui/mentor/debrief/index.ts?raw")).default as string;
    expect(src).toMatch(/import\.meta\.glob<DebriefSectionModule>\(\["\.\/\*\.tsx", "!\.\/\*\.test\.tsx"\]/);
  });

  it("a file under debrief/ adds a tab without editing an index (fixture)", async () => {
    const { createElement: h } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { collectDebriefSections, sectionsFor } = await import("../ui/mentor/debrief/index");
    const { default: Debrief } = await import("../ui/mentor/Debrief");
    const { DEBRIEF_SECTIONS } = await import("../ui/mentor/debrief/index");
    const all = collectDebriefSections(import.meta.glob(["../ui/mentor/debrief/*.tsx", "../ui/mentor/debrief/__fixtures__/*.tsx"], { eager: true }));
    // the real registry plus the fixture, sorted by order (fixture 50 before the ledger's 100)
    expect(all.map((s) => s.id).filter((id) => id !== "fixture-reflection")).toEqual(DEBRIEF_SECTIONS.map((s) => s.id));
    expect(all.findIndex((s) => s.id === "fixture-reflection")).toBeLessThan(all.findIndex((s) => s.id === "ledger"));
    const sections = all.filter((s) => s.id === "fixture-reflection" || s.id === "ledger");
    const model = assessAttempt(dampedRecord()).debrief;
    expect(sectionsFor({ model, t0: 0 }, sections).map((s) => s.id)).toEqual(["fixture-reflection"]);
    const db = renderToStaticMarkup(h(Debrief, { model, sections, onFinish: () => undefined }));
    expect(db).toContain(">Fixture tab</button>");
    expect(db).not.toContain(">Decisions</button>");
    const body = renderToStaticMarkup(h(sections[0].Component, { model, t0: 0, onOpenLesson: () => undefined }));
    expect(body).toContain(`Fixture section body with ${model.analysis.gaps.length} gaps`);
    expect(() => collectDebriefSections({ "./X.tsx": {} })).toThrow(/does not export 'section'/);
    expect(() => collectDebriefSections({ "./S.tsx": { section: { ...sections[0], id: "summary" } } })).toThrow(/is a debrief phase/);
    expect(() => collectDebriefSections({ "./A.tsx": { section: sections[0] }, "./B.tsx": { section: sections[0] } })).toThrow(/declared by/);
  });
});

// ---------------------------------------------------------------------------
// skill cards announced in the debrief are scheduled
// ---------------------------------------------------------------------------

describe("skill-card scheduling from the debrief", () => {
  const TODAY = "2026-10-08";
  beforeEach(() => useProgressStore.getState().reset());

  it("scheduleCards adds announced cards due today, brings later ones forward, grades none, and is idempotent", () => {
    const a = cardForCode("damped-injection").id;
    const b = cardForCode("no-aspirate").id;
    const later = reviewCard(reviewCard(undefined, true, "2026-10-01", 1), true, "2026-10-02", 2); // due 2026-10-05 + interval
    const futureB = { ...later, due: "2026-10-20" };
    const res = scheduleCards({ [b]: futureB, "quiz-1": later }, [a, b, a, "pci:wire-in-septal", "skill:pci-1", "nonsense"], TODAY);
    expect(res.added).toEqual([a]);
    expect(res.broughtForward).toEqual([b]);
    expect(res.memory[a]).toMatchObject({ due: TODAY, attempts: 0, lapses: 0, reps: 0 });
    expect(res.memory[b]).toMatchObject({ due: TODAY, reps: futureB.reps, attempts: futureB.attempts, ease: futureB.ease });
    expect(res.memory["pci:wire-in-septal"]).toBeUndefined();
    expect(dueCardIds(res.memory, TODAY).sort()).toEqual([a, b].sort());
    const again = scheduleCards(res.memory, [a, b], TODAY);
    expect(again.added).toEqual([]);
    expect(again.broughtForward).toEqual([]);
    expect(again.memory).toBe(res.memory);
  });

  it("a check gap's card with no template is neither announced nor scheduled", () => {
    const r = dampedRecord();
    const as = assessAttempt(r);
    const input: DebriefInput = { record: r, analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: false } };
    const d = buildDebrief(input, [{ id: "pci-card", order: 0, path: "./pci.ts", check: () => [{ id: "pci-gap", title: "Wire in a septal", severity: "safety", tWall: 1, teaching: "Check the wire tip.", cardId: "pci:wire-in-septal" }] }]);
    const g = d.analysis.gaps.find((x) => x.id === "pci-gap")!;
    expect(g.cardId).toBe("pci:wire-in-septal");
    expect(d.summary.cardsToSchedule).toEqual([cardForCode("damped-injection").id]);
    expect(d.summary.cardsToSchedule.every(isSchedulableCardId)).toBe(true);
    const res = scheduleCards({}, d.summary.cardsToSchedule, TODAY);
    expect(res.added).toEqual(d.summary.cardsToSchedule);
    expect(res.memory["pci:wire-in-septal"]).toBeUndefined();
  });

  it("a skill card announced in the debrief appears in the review schedule", async () => {
    const { scheduleAnnouncedCards } = await import("../ui/mentor/Debrief");
    const d = assessAttempt(dampedRecord()).debrief;
    const announced = d.summary.cardsToSchedule;
    expect(announced).toContain(cardForCode("damped-injection").id);
    expect(useProgressStore.getState().profile.quizMemory[announced[0]]).toBeUndefined();
    const res = scheduleAnnouncedCards(announced, TODAY);
    expect(res.added).toEqual(announced);
    const mem = useProgressStore.getState().profile.quizMemory;
    // the Review section's own selection: due ids, the card part, cards with a template
    const { cards } = partitionDue(dueIds(mem, TODAY));
    const reviewCards = cards.filter((id) => SKILL_CARD_TEMPLATES[id.split(":").slice(1).join(":") as MistakeCode]);
    expect(reviewCards).toEqual(announced);
    // scheduling again the same day changes nothing
    expect(scheduleAnnouncedCards(announced, TODAY).added).toEqual([]);
  });
});
