// ===========================================================================
// Runtime practice index (found-launch-links).
//
// Globs every engine-free src/**/*.launch.ts eagerly (as src/content/manual/
// index.ts globs the module files) and lists, under each lesson and case,
// the lab scenarios and drills that practise it. A package's links appear the
// day its .launch.ts lands, without any lesson edit. Held-out exam scenarios,
// variants and drills are never listed, and a link the validator would refuse
// (unknown scenario, start, variant, drill or mode) is left out; the content
// test (validateLaunchLinks) reports it.
//
// Fixtures for tests live under __fixtures__/ folders and are excluded here and
// in content.test.ts.
// ===========================================================================

import type { Block, CaseStudy, LaunchMode, LaunchParams, LaunchSim, Track } from "../../content/schema";
import { buildKnownLaunch, checkLaunchParams, linkParams, type KnownLaunch, type LaunchFiles } from "../../content/validateLaunch";

export interface PracticeEntry {
  sim: LaunchSim;
  scenario?: string;
  drill?: string;
  start?: string;
  variant?: string;
  /** the mode the lab opens in (the link's, else the scenario's, else guided) */
  mode: LaunchMode;
  title: string;
  /** what openSim receives */
  params: LaunchParams;
  /** the .launch.ts the entry comes from */
  source: string;
}

export interface PracticeIndex {
  known: KnownLaunch;
  byLesson: Map<string, PracticeEntry[]>;
  byCase: Map<string, PracticeEntry[]>;
}

/** A stable key for a launch: sim plus params in key order (used to merge duplicates). */
export function launchKey(sim: string, params?: LaunchParams): string {
  const p = params ?? {};
  return `${sim}?${Object.keys(p)
    .sort()
    .map((k) => `${k}=${p[k]}`)
    .join("&")}`;
}

/**
 * What a launch opens, whatever its mode: an inline block, a case's own practice entry and an index
 * entry for the same place are one link (the index always adds a mode to scenario links).
 */
export function placeKey(sim: string, params?: LaunchParams): string {
  const { mode: _mode, ...rest } = params ?? {};
  return launchKey(sim, rest);
}

/** Build the index from glob results (path to module with a `launch` export). */
export function buildPracticeIndex(files: LaunchFiles): PracticeIndex {
  // The default build options accept the built-in Real angiograms drills, as content.test.ts does.
  const known = buildKnownLaunch(files);
  const byLesson = new Map<string, PracticeEntry[]>();
  const byCase = new Map<string, PracticeEntry[]>();
  const seen = new Set<string>();
  const add = (map: Map<string, PracticeEntry[]>, kind: "lesson" | "case", id: string, e: PracticeEntry) => {
    const k = `${kind}:${id}:${launchKey(e.sim, e.params)}`;
    if (seen.has(k)) return;
    seen.add(k);
    map.set(id, [...(map.get(id) ?? []), e]);
  };

  type Item = { order: number; entry: PracticeEntry; lessonIds: string[]; caseIds: string[] };
  const items: Item[] = [];
  for (const m of known.scenarios.values())
    for (const s of m.values()) {
      if (s.heldOut) continue;
      const mode = s.mode ?? "guided";
      const params: LaunchParams = s.sim === "angio-real" ? { scenario: s.id } : { scenario: s.id, mode };
      items.push({ order: s.order, lessonIds: s.lessonIds, caseIds: s.caseIds, entry: { sim: s.sim, scenario: s.id, mode, title: s.title, params, source: s.file } });
    }
  for (const m of known.drills.values())
    for (const d of m.values()) {
      if (d.heldOut || d.order < 0) continue;
      items.push({ order: d.order, lessonIds: d.lessonIds, caseIds: d.caseIds, entry: { sim: d.sim, drill: d.id, mode: "guided", title: d.title, params: { drill: d.id }, source: d.file } });
    }
  for (const l of known.links) {
    const e = l.entry;
    const params = linkParams(l.sim, e);
    const problems: string[] = [];
    checkLaunchParams(l.sim, params, known, "", problems);
    if (problems.length || !e.scenario === !e.drill) continue;
    const s = e.scenario ? known.scenarios.get(l.sim)?.get(e.scenario) : undefined;
    const d = e.drill ? known.drills.get(l.sim)?.get(e.drill) : undefined;
    const mode: LaunchMode = e.mode ?? s?.mode ?? "guided";
    if (e.scenario && l.sim !== "angio-real" && !params.mode) params.mode = mode;
    const start = e.start ? s?.starts.get(e.start) : undefined;
    const variant = e.variant ? s?.variants.get(e.variant)?.title : undefined;
    const title = e.title ?? [s?.title ?? d?.title ?? e.scenario ?? e.drill, start ?? e.start, variant ?? e.variant].filter(Boolean).join(" · ");
    items.push({
      order: l.order,
      lessonIds: Array.isArray(e.lessonIds) ? e.lessonIds : [],
      caseIds: Array.isArray(e.caseIds) ? e.caseIds : [],
      entry: { sim: l.sim, scenario: e.scenario, drill: e.drill, start: e.start, variant: e.variant, mode, title, params, source: l.file },
    });
  }
  items.sort((a, b) => a.order - b.order);
  for (const it of items) {
    for (const id of it.lessonIds) add(byLesson, "lesson", id, it.entry);
    for (const id of it.caseIds) add(byCase, "case", id, it.entry);
  }
  return { known, byLesson, byCase };
}

// The literal patterns must match content.test.ts (import.meta.glob takes literals only).
const FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });

export const PRACTICE_INDEX: PracticeIndex = buildPracticeIndex(FILES);

export const practiceForLesson = (lessonId: string, index: PracticeIndex = PRACTICE_INDEX): PracticeEntry[] => index.byLesson.get(lessonId) ?? [];
export const practiceForCase = (caseId: string, index: PracticeIndex = PRACTICE_INDEX): PracticeEntry[] => index.byCase.get(caseId) ?? [];

const MODE_LABEL: Record<LaunchMode, string> = { guided: "guided", supervised: "supervised", independent: "independent", exam: "exam" };

/**
 * A short description of what a launch opens, from the declared titles, for example
 * "Focal LAD lesson · start: wire across · guided mode". Empty when there is nothing to say.
 */
export function describeLaunch(sim: LaunchSim, params: LaunchParams | undefined, index: PracticeIndex = PRACTICE_INDEX): string {
  if (!params) return "";
  const parts: string[] = [];
  const id = params.scenario ?? params.preset;
  const s = id ? index.known.scenarios.get(sim)?.get(id) : undefined;
  if (id) parts.push(s?.title ?? id);
  if (params.drill && sim !== "angio-real") parts.push(index.known.drills.get(sim)?.get(params.drill)?.title ?? params.drill);
  if (params.start) parts.push(`start: ${s?.starts.get(params.start) ?? params.start.replace(/-/g, " ")}`);
  if (params.variant) parts.push(`variant: ${s?.variants.get(params.variant)?.title ?? params.variant}`);
  const mode = params.mode as LaunchMode | undefined;
  if (mode && MODE_LABEL[mode]) parts.push(`${MODE_LABEL[mode]} mode`);
  return parts.join(" · ");
}

// ---------------------------------------------------------------------------
// Rows of a 'Practise this in the lab' list, for lessons (BlockRenderer) and cases (CaseStudies).
// Kept here, outside the component files, so those export only components.
// ---------------------------------------------------------------------------

/** One row of a 'Practise this in the lab' list. */
export interface PracticeItem {
  key: string;
  sim: LaunchSim;
  title: string;
  params?: LaunchParams;
}

export const practiceItem = (e: PracticeEntry): PracticeItem => ({ key: `${e.source}:${launchKey(e.sim, e.params)}`, sim: e.sim, title: e.title, params: e.params });

/** The case's own practice entries, then the practice-index entries that name it, without repeating a lab place. */
export function casePractice(c: CaseStudy, index: PracticeIndex = PRACTICE_INDEX): PracticeItem[] {
  const own: PracticeItem[] = (c.practice ?? []).map((p, i) => ({ key: `own:${i}:${launchKey(p.sim, p.params)}`, sim: p.sim, title: p.task, params: p.params }));
  const seen = new Set(own.map((p) => placeKey(p.sim, p.params)));
  const indexed = practiceForCase(c.id, index)
    .filter((e) => !seen.has(placeKey(e.sim, e.params)))
    .map(practiceItem);
  return [...own, ...indexed];
}

/**
 * The practice list shown under a case: empty until the case has a record (completed at least
 * once), so it sits after the outcome and names no complication before the learner has met it.
 */
export function practiceAfterCase(c: CaseStudy, caseRecords: Record<string, unknown>, index: PracticeIndex = PRACTICE_INDEX): PracticeItem[] {
  return caseRecords[c.id] ? casePractice(c, index) : [];
}

/** Lesson id by the identity of its blocks array, for callers that pass only the blocks. */
const LESSON_BY_BLOCKS = new WeakMap<Block[], string>();
const INDEXED = new WeakSet<object>();
export function lessonIdFor(content: { TRACKS: Track[] } | null, blocks: Block[]): string | undefined {
  if (content && !INDEXED.has(content)) {
    for (const t of content.TRACKS) for (const m of t.modules) for (const l of m.lessons) LESSON_BY_BLOCKS.set(l.blocks, l.id);
    INDEXED.add(content);
  }
  return LESSON_BY_BLOCKS.get(blocks);
}

/** The inline launches a lesson already shows, so the practice list does not repeat them. */
export function inlineLaunchKeys(blocks: Block[]): Set<string> {
  const keys = new Set<string>();
  for (const b of blocks) {
    if (b.kind === "sim" && b.params) keys.add(placeKey(b.sim, b.params));
    if (b.kind === "drill" && b.target === "angio-pci" && b.params) keys.add(placeKey(b.target, b.params));
    if (b.kind === "drill" && b.target === "angio-real" && b.drill) keys.add(placeKey(b.target, { ...(b.params ?? {}), drill: b.drill }));
  }
  return keys;
}

/** The practice rows under a lesson: its index entries less those its blocks already link inline. */
export function lessonPractice(lessonId: string | undefined, blocks: Block[], index: PracticeIndex = PRACTICE_INDEX): PracticeItem[] {
  if (!lessonId) return [];
  const inline = inlineLaunchKeys(blocks);
  return practiceForLesson(lessonId, index)
    .filter((e) => !inline.has(placeKey(e.sim, e.params)))
    .map(practiceItem);
}
