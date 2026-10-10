// ===========================================================================
// Launch-link integrity (found-launch-links). Pure and engine-free.
//
// Every lab declares its scenarios, start states, variants and drills in
// engine-free src/**/*.launch.ts files (each exports `launch: LaunchFile`).
// buildKnownLaunch merges them by sim and scenario id; validateLaunchLinks then
// checks every sim block, angio-pci drill block, module sim and case practice
// entry in the content, and every links entry of the .launch.ts files:
//  - the scenario (or preset) exists for that sim, and the start and variant
//    belong to it;
//  - the mode is a known value;
//  - nothing held out for exams (a heldOut scenario, variant or drill) is
//    linked from a lesson or case (exam integrity, HANDOVER 6.4);
//  - the lessons and cases a .launch.ts names exist.
// Known ids are passed in, never imported: content.test.ts builds them with
// import.meta.glob, and node scripts run under vite-node (scripts/README.md).
// Returns human-readable problems (empty = valid).
// ===========================================================================

import { DRILL_PARAM_RULES, LAUNCH_MODES } from "./schema";
import { ANGIO_DRILL_IDS } from "./validate";
import type {
  AngioDrillId,
  CaseStudy,
  LaunchDrill,
  LaunchFile,
  LaunchLinkEntry,
  LaunchMode,
  LaunchParams,
  LaunchScenario,
  LaunchSim,
  LaunchStart,
  LaunchVariant,
  Track,
} from "./schema";

/** Every launch destination; a Record so the compiler keeps it in step with LaunchSim. */
const SIMS: Record<LaunchSim, true> = {
  cathlab: true,
  procedure: true,
  views: true,
  haemo: true,
  "pci-bench": true,
  physiology: true,
  iabp: true,
  impella: true,
  ecmo: true,
  tavi: true,
  teer: true,
  laao: true,
  pacing: true,
  pericardiocentesis: true,
  "angio-real": true,
  "angio-pci": true,
  pressure: true,
};
export const LAUNCH_SIMS = Object.keys(SIMS) as LaunchSim[];
export const isLaunchSim = (s: unknown): s is LaunchSim => typeof s === "string" && Object.prototype.hasOwnProperty.call(SIMS, s);
export const isLaunchMode = (m: unknown): m is LaunchMode => typeof m === "string" && (LAUNCH_MODES as readonly string[]).includes(m);

export interface KnownVariant {
  id: string;
  title?: string;
  heldOut: boolean;
}

export interface KnownScenario {
  sim: LaunchSim;
  id: string;
  title: string;
  lessonIds: string[];
  caseIds: string[];
  /** start id to its title (if any), merged from the scenario and every file's `adds` */
  starts: Map<string, string | undefined>;
  variants: Map<string, KnownVariant>;
  mode?: LaunchMode;
  heldOut: boolean;
  /** the file that declares it */
  file: string;
  /** declaration order across all files, for a stable practice index */
  order: number;
}

export interface KnownDrill {
  sim: LaunchSim;
  id: string;
  title: string;
  lessonIds: string[];
  caseIds: string[];
  heldOut: boolean;
  file: string;
  order: number;
}

export interface KnownLink {
  sim: LaunchSim;
  file: string;
  index: number;
  entry: LaunchLinkEntry;
  order: number;
}

export interface KnownLaunch {
  scenarios: Map<LaunchSim, Map<string, KnownScenario>>;
  drills: Map<LaunchSim, Map<string, KnownDrill>>;
  links: KnownLink[];
  /** problems found while merging the files (unknown sims, duplicates, malformed entries) */
  problems: string[];
}

/** A glob result: module path to module (with a `launch` export), or path to LaunchFile directly. */
export type LaunchFiles = Record<string, { launch?: LaunchFile } | LaunchFile>;

export interface BuildOptions {
  /**
   * Drill ids a sim offers that are not declared in a .launch.ts. They may be linked but are not
   * listed in the practice index. Defaults to BUILTIN_LAUNCH_DRILLS, so the content test and the
   * runtime practice index accept the same drills.
   */
  drills?: Partial<Record<LaunchSim, readonly string[]>>;
}

/** Drills the sections offer without a .launch.ts: the Real angiograms reading drills (validate.ts). */
export const BUILTIN_LAUNCH_DRILLS: Readonly<Partial<Record<LaunchSim, readonly string[]>>> = { "angio-real": ANGIO_DRILL_IDS };

const asStart = (s: string | LaunchStart): LaunchStart => (typeof s === "string" ? { id: s } : s);
const asVariant = (v: string | LaunchVariant): LaunchVariant => (typeof v === "string" ? { id: v } : v);
const isStrArray = (a: unknown): a is string[] => Array.isArray(a) && a.every((x) => typeof x === "string" && x.length > 0);

function fileOf(mod: { launch?: LaunchFile } | LaunchFile): LaunchFile | undefined {
  if (mod && typeof mod === "object" && "sim" in mod) return mod as LaunchFile;
  return (mod as { launch?: LaunchFile })?.launch;
}

/** Merge every .launch.ts by sim and scenario id. Paths are sorted so the result does not depend on glob order. */
export function buildKnownLaunch(files: LaunchFiles, opts: BuildOptions = {}): KnownLaunch {
  const known: KnownLaunch = { scenarios: new Map(), drills: new Map(), links: [], problems: [] };
  const p = known.problems;
  let order = 0;
  const scen = (sim: LaunchSim) => {
    let m = known.scenarios.get(sim);
    if (!m) known.scenarios.set(sim, (m = new Map()));
    return m;
  };
  const drl = (sim: LaunchSim) => {
    let m = known.drills.get(sim);
    if (!m) known.drills.set(sim, (m = new Map()));
    return m;
  };
  const addStart = (s: KnownScenario, st: string | LaunchStart, where: string) => {
    const x = asStart(st);
    if (!x || typeof x.id !== "string" || !x.id) return void p.push(`${where}: start without an id`);
    if (s.starts.has(x.id)) return void p.push(`${where}: duplicate start "${x.id}" for scenario "${s.id}"`);
    s.starts.set(x.id, x.title);
  };
  const addVariant = (s: KnownScenario, v: string | LaunchVariant, where: string) => {
    const x = asVariant(v);
    if (!x || typeof x.id !== "string" || !x.id) return void p.push(`${where}: variant without an id`);
    if (s.variants.has(x.id)) return void p.push(`${where}: duplicate variant "${x.id}" for scenario "${s.id}"`);
    s.variants.set(x.id, { id: x.id, title: x.title, heldOut: !!x.heldOut });
  };

  const parsed: { path: string; f: LaunchFile }[] = [];
  for (const path of Object.keys(files).sort()) {
    const f = fileOf(files[path]);
    if (!f) {
      p.push(`${path}: no \`launch\` export`);
      continue;
    }
    if (!isLaunchSim(f.sim)) {
      p.push(`${path}: unknown sim "${String(f.sim)}"`);
      continue;
    }
    parsed.push({ path, f });
  }

  // Pass 1: scenarios and drills.
  for (const { path, f } of parsed) {
    (f.scenarios ?? []).forEach((s: LaunchScenario, i) => {
      const where = `${path} scenario ${i}`;
      if (!s || typeof s.id !== "string" || !s.id) return void p.push(`${where}: scenario without an id`);
      if (typeof s.title !== "string" || !s.title.trim()) p.push(`${where} (${s.id}): scenario without a title`);
      if (!Array.isArray(s.lessonIds)) p.push(`${where} (${s.id}): lessonIds must be an array (empty when no lesson practises it)`);
      if (s.mode !== undefined && !isLaunchMode(s.mode)) p.push(`${where} (${s.id}): unknown mode "${s.mode}"`);
      const m = scen(f.sim);
      const prev = m.get(s.id);
      if (prev) return void p.push(`${where}: scenario "${s.id}" for ${f.sim} is already declared in ${prev.file}`);
      const k: KnownScenario = {
        sim: f.sim,
        id: s.id,
        title: s.title ?? s.id,
        lessonIds: isStrArray(s.lessonIds) ? [...s.lessonIds] : [],
        caseIds: isStrArray(s.caseIds) ? [...s.caseIds] : [],
        starts: new Map(),
        variants: new Map(),
        mode: isLaunchMode(s.mode) ? s.mode : undefined,
        heldOut: !!s.heldOut,
        file: path,
        order: order++,
      };
      for (const st of s.starts ?? []) addStart(k, st, `${where} (${s.id})`);
      for (const v of s.variants ?? []) addVariant(k, v, `${where} (${s.id})`);
      m.set(s.id, k);
    });
    (f.drills ?? []).forEach((d: LaunchDrill, i) => {
      const where = `${path} drill ${i}`;
      if (!d || typeof d.id !== "string" || !d.id) return void p.push(`${where}: drill without an id`);
      const m = drl(f.sim);
      const prev = m.get(d.id);
      if (prev) return void p.push(`${where}: drill "${d.id}" for ${f.sim} is already declared in ${prev.file}`);
      m.set(d.id, {
        sim: f.sim,
        id: d.id,
        title: d.title ?? d.id,
        lessonIds: isStrArray(d.lessonIds) ? [...d.lessonIds] : [],
        caseIds: isStrArray(d.caseIds) ? [...d.caseIds] : [],
        heldOut: !!d.heldOut,
        file: path,
        order: order++,
      });
    });
  }
  // Drills a section offers without declaring them (not listed in the practice index).
  for (const [sim, ids] of Object.entries(opts.drills ?? BUILTIN_LAUNCH_DRILLS) as [LaunchSim, readonly string[]][]) {
    const m = drl(sim);
    for (const id of ids) if (!m.has(id)) m.set(id, { sim, id, title: id, lessonIds: [], caseIds: [], heldOut: false, file: "(built in)", order: -1 });
  }

  // Pass 2: links and the starts and variants they add to scenarios declared anywhere.
  for (const { path, f } of parsed) {
    (f.links ?? []).forEach((e: LaunchLinkEntry, i) => {
      const where = `${path} link ${i}`;
      if (!e || typeof e !== "object") return void p.push(`${where}: malformed link`);
      if (e.adds) {
        const s = e.scenario ? known.scenarios.get(f.sim)?.get(e.scenario) : undefined;
        if (!s) p.push(`${where}: adds starts or variants to unknown scenario "${e.scenario ?? "(none)"}" for ${f.sim}`);
        else {
          for (const st of e.adds.starts ?? []) addStart(s, st, where);
          for (const v of e.adds.variants ?? []) addVariant(s, v, where);
        }
      }
      known.links.push({ sim: f.sim, file: path, index: i, entry: e, order: order++ });
    });
  }
  return known;
}

/** The params a links entry opens its lab with. */
export function linkParams(sim: LaunchSim, e: LaunchLinkEntry): LaunchParams {
  const out: LaunchParams = { ...(e.params ?? {}) };
  if (e.scenario) out.scenario = e.scenario;
  if (e.drill) out.drill = e.drill;
  if (e.start) out.start = e.start;
  if (e.variant) out.variant = e.variant;
  if (e.mode) out.mode = e.mode;
  return out;
}

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Check one launch (sim plus params) against the known ids. Everything checked here comes from a
 * lesson, a case or a practice link, so held-out ids are always refused.
 */
export function checkLaunchParams(sim: LaunchSim, params: LaunchParams | undefined, known: KnownLaunch, where: string, errs: string[]): void {
  if (!isLaunchSim(sim)) return void errs.push(`${where}: unknown sim "${String(sim)}"`);
  if (!params) return;
  if (typeof params !== "object" || Array.isArray(params)) return void errs.push(`${where}: params must be an object of strings`);
  for (const [k, v] of Object.entries(params)) if (typeof v !== "string" || !v.trim()) errs.push(`${where}: param "${k}" must be a non-empty string`);

  if (params.mode !== undefined && !isLaunchMode(params.mode)) errs.push(`${where}: unknown mode "${params.mode}" (one of ${LAUNCH_MODES.join(", ")})`);
  if (params.step !== undefined && params.technique === undefined) errs.push(`${where}: step "${params.step}" without a technique`);
  if (params.events !== undefined)
    for (const ev of params.events.split(",").map((x) => x.trim()))
      if (!KEBAB.test(ev)) errs.push(`${where}: event "${ev}" is not a kebab-case event name`);

  const scenarios = known.scenarios.get(sim);
  const look = (key: "scenario" | "preset"): KnownScenario | undefined => {
    const id = params[key];
    if (id === undefined) return undefined;
    const s = scenarios?.get(id);
    if (!s) errs.push(`${where}: unknown ${key} "${id}" for ${sim}`);
    else if (s.heldOut) errs.push(`${where}: ${key} "${id}" is held out for exams and cannot be linked from lessons or cases`);
    return s;
  };
  const byScenario = look("scenario");
  const byPreset = look("preset");
  const s = params.scenario !== undefined ? byScenario : byPreset;
  const named = params.scenario ?? params.preset;

  if (params.start !== undefined) {
    if (named === undefined) errs.push(`${where}: start "${params.start}" without a scenario`);
    else if (s && !s.starts.has(params.start)) errs.push(`${where}: unknown start "${params.start}" for scenario "${s.id}"`);
  }
  if (params.variant !== undefined) {
    if (named === undefined) errs.push(`${where}: variant "${params.variant}" without a scenario`);
    else if (s) {
      const v = s.variants.get(params.variant);
      if (!v) errs.push(`${where}: unknown variant "${params.variant}" for scenario "${s.id}"`);
      else if (v.heldOut) errs.push(`${where}: variant "${params.variant}" of "${s.id}" is held out for exams and cannot be linked from lessons or cases`);
    }
  }

  if (params.drill !== undefined) {
    const d = known.drills.get(sim)?.get(params.drill);
    if (!d) errs.push(`${where}: unknown drill "${params.drill}" for ${sim}`);
    else if (d.heldOut) errs.push(`${where}: drill "${params.drill}" is held out for exams and cannot be linked from lessons or cases`);
    // Real-angiogram drills take only the parameters their section applies (DRILL_PARAM_RULES).
    if (sim === "angio-real") {
      const rules = DRILL_PARAM_RULES[params.drill as AngioDrillId];
      for (const [k, v] of Object.entries(params)) {
        if (k === "drill") continue;
        if (!rules || !(k in rules)) errs.push(`${where}: drill "${params.drill}" takes no parameter "${k}"`);
        else if (!rules[k].includes(v)) errs.push(`${where}: value "${v}" not allowed for "${k}" in drill "${params.drill}"`);
      }
    }
  }
}

/** The content a launch check walks: the tracks (with their cases) and any further cases. */
export interface LaunchContentRoot {
  tracks: Track[];
  cases?: CaseStudy[];
}

/** Check every launch in the content and in the .launch.ts files. */
export function validateLaunchLinks(root: LaunchContentRoot, known: KnownLaunch): string[] {
  const errs: string[] = [...known.problems];
  const lessonIds = new Set<string>();
  const caseById = new Map<string, CaseStudy>();
  for (const t of root.tracks) {
    for (const c of t.cases) caseById.set(c.id, c);
    for (const m of t.modules) {
      for (const l of m.lessons) {
        lessonIds.add(l.id);
        l.blocks.forEach((b, i) => {
          const where = `${l.id} block ${i}`;
          if (b.kind === "sim" && b.params) checkLaunchParams(b.sim, b.params, known, where, errs);
          if (b.kind === "drill" && b.target === "angio-pci" && b.params) checkLaunchParams("angio-pci", b.params, known, where, errs);
        });
      }
      (m.sims ?? []).forEach((s, i) => {
        if (s.params) checkLaunchParams(s.sim, s.params, known, `${m.id} sims ${i}`, errs);
      });
    }
  }
  for (const c of root.cases ?? []) caseById.set(c.id, c);
  for (const c of caseById.values())
    (c.practice ?? []).forEach((pr, i) => {
      const where = `${c.id} practice ${i}`;
      if (!pr || !isLaunchSim(pr.sim)) return void errs.push(`${where}: unknown sim "${String(pr?.sim)}"`);
      if (typeof pr.task !== "string" || !pr.task.trim()) errs.push(`${where}: practice entry without a task`);
      checkLaunchParams(pr.sim, pr.params, known, where, errs);
    });

  const checkTargets = (where: string, lessons: string[], cases: string[]) => {
    for (const id of lessons) if (!lessonIds.has(id)) errs.push(`${where}: unknown lesson "${id}"`);
    for (const id of cases) if (!caseById.has(id)) errs.push(`${where}: unknown case "${id}"`);
  };
  for (const m of known.scenarios.values())
    for (const s of m.values()) {
      const where = `${s.file} scenario ${s.id}`;
      checkTargets(where, s.lessonIds, s.caseIds);
      if (s.heldOut && (s.lessonIds.length || s.caseIds.length)) errs.push(`${where}: held out for exams but lists lessons or cases`);
    }
  for (const m of known.drills.values())
    for (const d of m.values()) {
      const where = `${d.file} drill ${d.id}`;
      checkTargets(where, d.lessonIds, d.caseIds);
      if (d.heldOut && (d.lessonIds.length || d.caseIds.length)) errs.push(`${where}: held out for exams but lists lessons or cases`);
    }
  for (const k of known.links) {
    const where = `${k.file} link ${k.index}`;
    const e = k.entry;
    if (!e.scenario === !e.drill) errs.push(`${where}: a link names exactly one scenario or drill`);
    if (!isStrArray(e.lessonIds)) errs.push(`${where}: lessonIds must be an array of lesson ids`);
    else if (!e.lessonIds.length && !(e.caseIds ?? []).length) errs.push(`${where}: links to no lesson or case`);
    if (e.caseIds !== undefined && !isStrArray(e.caseIds)) errs.push(`${where}: caseIds must be an array of case ids`);
    checkTargets(where, isStrArray(e.lessonIds) ? e.lessonIds : [], isStrArray(e.caseIds) ? e.caseIds : []);
    checkLaunchParams(k.sim, linkParams(k.sim, e), known, where, errs);
  }
  return errs;
}
