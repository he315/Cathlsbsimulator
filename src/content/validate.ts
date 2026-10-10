// Structural integrity checks for authored content. Pure — used by
// content.test.ts and by each author's own track test. Returns a list of
// human-readable problems (empty = valid).

import type { AngioDrillId, AngioSimId, Block, BookId, CaseOption, CaseStudy, FigureId, SimId, SourceLoc, Track, QuizItem } from "./schema";
import { DRILL_PARAM_RULES } from "./schema";
import { VIDEOS } from "./videos";
import {
  ACCESS_ROUTES,
  BIF_TECHNIQUES,
  CATHETER_FAMILIES,
  IMAGING_MODALITIES,
  LAB_EVENTS,
  LAB_PHASES,
  LAB_PROCEDURES,
  SUPERSEDED_EVENTS,
  TIP_BY_ID,
  TIP_VESSELS,
  type LabTip,
} from "./lab/tips";

export const SIM_IDS: readonly SimId[] = [
  "cathlab",
  "procedure",
  "views",
  "haemo",
  "pci-bench",
  "physiology",
  "iabp",
  "impella",
  "ecmo",
  "tavi",
  "teer",
  "laao",
  "pacing",
  "pericardiocentesis",
];

export const ANGIO_SIM_IDS: readonly AngioSimId[] = ["angio-real", "angio-pci"];

export const ANGIO_DRILL_IDS: readonly AngioDrillId[] = [
  "artery",
  "dominance",
  "occlusion",
  "collaterals",
  "view",
  "grade",
  "locate",
  "estimate",
  "plan",
  "review",
];

export const FIGURE_IDS: readonly FigureId[] = [
  "coronary-tree",
  "aha-segments",
  "views-compass",
  "wiggers",
  "rhc-waveforms",
  "iabp-timing",
  "impella-position",
  "ecmo-circuit",
  "tavi-depth",
  "medina",
  "ellis",
  "nhlbi-dissection",
  "cto-algorithm",
  "stent-compliance",
];

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Library run ids: CADICA p<n>_v<n>, CoronaryDominance cd-/cdm-<n>-<artery>-<n>, AngioCAD ac-<n>-<n>. */
const RUN_ID = /^(p\d+_v\d+|cdm?-\d+-(LCA|RCA)-\d+|ac-\d+-\d+)$/;

function checkBlock(b: Block, where: string, refIds: Set<string>, errs: string[]) {
  const nonEmpty = (s: string, label: string) => {
    if (!s || !s.trim()) errs.push(`${where}: empty ${label}`);
  };
  switch (b.kind) {
    case "h":
    case "p":
      nonEmpty(b.text, b.kind);
      break;
    case "pearl":
      nonEmpty(b.text, "pearl");
      break;
    case "list":
    case "keypoints":
    case "pitfalls":
      if (!b.items.length) errs.push(`${where}: empty ${b.kind}`);
      b.items.forEach((s, i) => nonEmpty(s, `${b.kind}[${i}]`));
      break;
    case "table":
      if (!b.head.length) errs.push(`${where}: table without header`);
      b.rows.forEach((r, i) => {
        if (r.length !== b.head.length)
          errs.push(`${where}: table row ${i} has ${r.length} cells, header has ${b.head.length}`);
      });
      break;
    case "steps":
      if (!b.items.length) errs.push(`${where}: empty steps`);
      b.items.forEach((s, i) => {
        nonEmpty(s.title, `step[${i}].title`);
        nonEmpty(s.detail, `step[${i}].detail`);
      });
      break;
    case "formula":
      nonEmpty(b.name, "formula name");
      nonEmpty(b.expr, "formula expr");
      break;
    case "figure":
      if (!FIGURE_IDS.includes(b.id)) errs.push(`${where}: unknown figure "${b.id}"`);
      break;
    case "sim":
      if (!SIM_IDS.includes(b.sim)) errs.push(`${where}: unknown sim "${b.sim}"`);
      nonEmpty(b.task, "sim task");
      break;
    case "cine":
      if (!RUN_ID.test(b.run)) errs.push(`${where}: cine run id "${b.run}" is not a library run id`);
      nonEmpty(b.caption, "cine caption");
      break;
    case "drill":
      if (!ANGIO_SIM_IDS.includes(b.target)) errs.push(`${where}: unknown drill target "${b.target}"`);
      if (b.drill !== undefined && !ANGIO_DRILL_IDS.includes(b.drill)) errs.push(`${where}: unknown drill "${b.drill}"`);
      if (b.drill !== undefined && b.target !== "angio-real") errs.push(`${where}: drills live in angio-real`);
      if (b.params && Object.keys(b.params).length) {
        // Only parameters the section applies are allowed, so a parameter in content always takes effect.
        const rules = b.drill ? DRILL_PARAM_RULES[b.drill] : undefined;
        if (!rules) errs.push(`${where}: drill "${b.drill ?? "(none)"}" takes no parameters`);
        else
          for (const [k, v] of Object.entries(b.params)) {
            if (!(k in rules)) errs.push(`${where}: unknown parameter "${k}" for drill "${b.drill}"`);
            else if (!rules[k].includes(String(v))) errs.push(`${where}: parameter ${k}="${v}" not one of ${rules[k].join(", ")}`);
          }
      }
      nonEmpty(b.task, "drill task");
      break;
    case "video":
      if (!VIDEOS[b.id]) errs.push(`${where}: video "${b.id}" is not in the video registry`);
      if (b.note !== undefined) nonEmpty(b.note, "video note");
      break;
    case "check":
      nonEmpty(b.stem, "check stem");
      if (b.options.length < 3 || b.options.length > 5) errs.push(`${where}: check needs 3–5 options (has ${b.options.length})`);
      if (!Number.isInteger(b.answer) || b.answer < 0 || b.answer >= b.options.length) errs.push(`${where}: check answer ${b.answer} out of range`);
      if (new Set(b.options.map((o) => o.trim().toLowerCase())).size !== b.options.length) errs.push(`${where}: check has duplicate options`);
      b.options.forEach((o, i) => nonEmpty(o, `check option ${i}`));
      if (!b.explanation || b.explanation.trim().length < 20) errs.push(`${where}: check explanation too short`);
      break;
    case "tip":
      if (!TIP_BY_ID[b.id]) errs.push(`${where}: tip "${b.id}" is not in the lab tip registry`);
      break;
    default:
      errs.push(`${where}: unknown block kind ${(b as { kind: string }).kind}`);
  }
  void refIds;
}

function checkQuiz(q: QuizItem, where: string, refIds: Set<string>, errs: string[]) {
  if (!q.stem.trim()) errs.push(`${where}: empty stem`);
  if (q.options.length < 3 || q.options.length > 5)
    errs.push(`${where}: needs 3–5 options (has ${q.options.length})`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
    errs.push(`${where}: answer index ${q.answer} out of range`);
  if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length)
    errs.push(`${where}: duplicate options`);
  q.options.forEach((o, i) => {
    if (!o.trim()) errs.push(`${where}: empty option ${i}`);
  });
  if (!q.explanation || q.explanation.trim().length < 20) errs.push(`${where}: explanation too short`);
  for (const r of q.refs ?? []) if (!refIds.has(r)) errs.push(`${where}: unknown ref "${r}"`);
}

// ---------------------------------------------------------------------------
// Sources in the two core manuals, and lab tips
// ---------------------------------------------------------------------------

export const BOOK_IDS: readonly BookId[] = ["brilakis-pci", "oxford-cath"];
/** Brilakis loc: a chapter or section number ("8", "8.3", "16.2"); Oxford loc: "ch <n>: <section heading>". */
const LOC_RULE: Record<BookId, RegExp> = {
  "brilakis-pci": /^(?:[1-9]|[12]\d|30)(?:\.\d{1,2})?$/,
  "oxford-cath": /^ch (?:[1-9]|1[01]): \S.*$/,
};

export function checkSources(sources: SourceLoc[] | undefined, where: string, errs: string[]) {
  for (const s of sources ?? []) {
    if (!BOOK_IDS.includes(s.book)) errs.push(`${where}: unknown book "${s.book}"`);
    else if (!LOC_RULE[s.book].test(s.loc)) errs.push(`${where}: source location "${s.loc}" does not follow the ${s.book} format`);
  }
}

function supersededHint(name: string): string {
  const to = SUPERSEDED_EVENTS[name];
  return to ? ` (the agreed name is "${to}")` : "";
}

/** alsoIn: each borrowing lab is a known lab other than the tip's own, named once, with its own phases. */
function checkAlsoIn(t: LabTip, w: string, errs: string[]) {
  if (t.alsoIn === undefined) return;
  if (!Array.isArray(t.alsoIn) || !t.alsoIn.length) {
    errs.push(`${w}: alsoIn is empty`);
    return;
  }
  const labs = new Set<string>();
  for (const a of t.alsoIn) {
    const phases = LAB_PHASES[a.lab] as readonly string[] | undefined;
    if (!phases) {
      errs.push(`${w}: alsoIn names unknown lab "${a.lab}"`);
      continue;
    }
    if (a.lab === t.lab) errs.push(`${w}: alsoIn names the tip's own lab "${a.lab}"`);
    if (labs.has(a.lab)) errs.push(`${w}: alsoIn names lab "${a.lab}" twice`);
    labs.add(a.lab);
    for (const p of a.phase ?? []) if (!phases.includes(p)) errs.push(`${w}: alsoIn phase "${p}" is not a ${a.lab} phase`);
    if (a.phase && !a.phase.length) errs.push(`${w}: alsoIn ${a.lab} has an empty phase list`);
    // the borrow drops the tip's own phase condition, so it needs a phase of its own or another condition
    if (!a.phase?.length && !Object.entries(t.when).some(([k, x]) => k !== "phase" && Array.isArray(x) && x.length))
      errs.push(`${w}: alsoIn ${a.lab} sets no phase and the trigger has no condition besides phase, so the tip would show at every ${a.lab} phase`);
  }
}

/** Labs that host more than one procedure on the same phase names: each of their tips names its procedure. */
const PROCEDURE_LABS: readonly string[] = ["structural", "mcs"];

/**
 * A tip in a lab that hosts several procedures must name a known one, or it would show in every
 * procedure that shares its phase names (a TAVI tip in an LAAO). Bedside tips name theirs too; the
 * pacing tips still on the deprecated "pacing" phase are exempt until tip-retarget-catchup moves them,
 * and the "pericardiocentesis" alias is no longer accepted on a trigger.
 */
function checkProcedure(t: LabTip, w: string, errs: string[]) {
  const named = (t.when.procedure ?? []).some((p) => (LAB_PROCEDURES as readonly string[]).includes(p));
  if (PROCEDURE_LABS.includes(t.lab)) {
    if (!named) errs.push(`${w}: ${t.lab === "mcs" ? "an" : "a"} ${t.lab} tip must name its procedure (when.procedure)`);
    return;
  }
  if (t.lab !== "bedside") return;
  const phases = (t.when.phase ?? []) as readonly string[];
  if (phases.includes("pericardiocentesis"))
    errs.push(`${w}: phase "pericardiocentesis" is retired; use procedure ["pericardiocentesis"] with a stage phase`);
  else if (!named && !phases.includes("pacing")) errs.push(`${w}: a bedside tip must name its procedure (when.procedure)`);
}

/** Check every lab tip: ids, triggers against the lab vocabularies, the teaching lesson and the sources. */
export function validateTips(tips: LabTip[], lessonIds: Set<string>, refIds: Set<string>): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const t of tips) {
    const w = `tip ${t.id}`;
    if (!KEBAB.test(t.id)) errs.push(`${w}: id not kebab-case`);
    if (seen.has(t.id)) errs.push(`${w}: duplicate id`);
    seen.add(t.id);
    const phases = LAB_PHASES[t.lab] as readonly string[] | undefined;
    if (!phases) errs.push(`${w}: unknown lab "${t.lab}"`);
    for (const p of t.when.phase ?? []) if (phases && !phases.includes(p)) errs.push(`${w}: phase "${p}" is not a ${t.lab} phase`);
    for (const e of t.when.event ?? []) if (!(LAB_EVENTS as readonly string[]).includes(e)) errs.push(`${w}: unknown event "${e}"${supersededHint(e)}`);
    for (const e of t.when.requires ?? []) if (!(LAB_EVENTS as readonly string[]).includes(e)) errs.push(`${w}: unknown required event "${e}"${supersededHint(e)}`);
    for (const c of t.when.catheter ?? []) if (!(CATHETER_FAMILIES as readonly string[]).includes(c)) errs.push(`${w}: unknown catheter family "${c}"`);
    for (const v of t.when.vessel ?? []) if (!(TIP_VESSELS as readonly string[]).includes(v)) errs.push(`${w}: unknown vessel "${v}"`);
    for (const r of t.when.route ?? []) if (!(ACCESS_ROUTES as readonly string[]).includes(r)) errs.push(`${w}: unknown route "${r}"`);
    for (const p of t.when.procedure ?? []) if (!(LAB_PROCEDURES as readonly string[]).includes(p)) errs.push(`${w}: unknown procedure "${p}"`);
    for (const x of t.when.technique ?? []) if (!(BIF_TECHNIQUES as readonly string[]).includes(x)) errs.push(`${w}: unknown technique "${x}"`);
    for (const m of t.when.imaging ?? []) if (!(IMAGING_MODALITIES as readonly string[]).includes(m)) errs.push(`${w}: unknown imaging modality "${m}"`);
    if (t.when.step !== undefined) {
      const st: unknown = t.when.step;
      if (!Array.isArray(st) || st.length !== 2 || !st.every((n) => Number.isInteger(n) && n >= 0))
        errs.push(`${w}: step must be [from, to] with whole step numbers`);
      else if (st[0] > st[1]) errs.push(`${w}: step range ${st[0]}–${st[1]} runs backwards`);
      if (!t.when.technique?.length) errs.push(`${w}: step is set without a technique`);
    }
    checkAlsoIn(t, w, errs);
    checkProcedure(t, w, errs);
    if (!Object.values(t.when).some((x) => Array.isArray(x) && x.length)) errs.push(`${w}: trigger sets no condition`);
    if (!t.title.trim()) errs.push(`${w}: empty title`);
    if (!t.text.trim() || t.text.length < 30) errs.push(`${w}: text too short`);
    if (!["do", "caution", "bailout"].includes(t.tone)) errs.push(`${w}: unknown tone "${t.tone}"`);
    if (!lessonIds.has(t.lessonId)) errs.push(`${w}: lesson "${t.lessonId}" does not exist`);
    if (!t.sources.length) errs.push(`${w}: no sources`);
    checkSources(t.sources, w, errs);
    for (const r of t.refs ?? []) if (!refIds.has(r)) errs.push(`${w}: unknown ref "${r}"`);
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Answer-length cue
// ---------------------------------------------------------------------------

/**
 * Project rule (not from literature): an item gives itself away when the
 * correct option is more than `ratio` times the mean distractor length or is
 * uniquely the longest option. A module fails when more than `maxFraction` of
 * its items do. With four or five options of similar length the correct one is
 * uniquely longest about a fifth to a quarter of the time by chance.
 */
export const LENGTH_CUE = { ratio: 1.3, maxFraction: 0.35 } as const;

export function lengthCueItem(q: Pick<QuizItem, "options" | "answer">): boolean {
  const L = q.options.map((o) => o.trim().length);
  const a = L[q.answer];
  const others = L.filter((_, i) => i !== q.answer);
  if (!others.length) return false;
  const mean = others.reduce((x, y) => x + y, 0) / others.length;
  return a > LENGTH_CUE.ratio * mean || others.every((x) => x < a);
}

export function lengthCue(items: Pick<QuizItem, "options" | "answer">[]): { n: number; flagged: number; fraction: number } {
  const flagged = items.filter(lengthCueItem).length;
  return { n: items.length, flagged, fraction: items.length ? flagged / items.length : 0 };
}

// ---------------------------------------------------------------------------
// Case graph
// ---------------------------------------------------------------------------

/** Where an option leads: its `next`, else the next main step after the last main step visited, else the end (null). */
export function nextStepId(c: CaseStudy, option: CaseOption, lastMainId: string | null): string | null {
  if (option.next) return option.next;
  const from = lastMainId ? c.steps.findIndex((s) => s.id === lastMainId) : -1;
  for (let i = from + 1; i < c.steps.length; i++) if (c.steps[i].kind !== "consequence") return c.steps[i].id;
  return null;
}

export interface CaseWalk {
  /** step ids reachable from the entry step */
  reachable: Set<string>;
  /** step ids where the options lead to two or more different places */
  branching: Set<string>;
  /** a path revisits a step (cycle) */
  cyclic: boolean;
}

/** Explore every path through a case, tracking the last main step (it decides where consequence steps return). */
export function walkCase(c: CaseStudy): CaseWalk {
  const reachable = new Set<string>();
  const branching = new Set<string>();
  let cyclic = false;
  const byId = new Map(c.steps.map((s) => [s.id, s]));
  const first = c.steps[0];
  if (!first) return { reachable, branching, cyclic };
  const seen = new Set<string>();
  // A state is (step, last main step): the same consequence step reached from two main steps is not a loop.
  const stack: { id: string; lastMain: string | null; path: string[] }[] = [{ id: first.id, lastMain: null, path: [] }];
  while (stack.length) {
    const { id, lastMain, path } = stack.pop()!;
    const s = byId.get(id);
    if (!s) continue;
    const lm = s.kind === "consequence" ? lastMain : id;
    if (path.includes(`${id}|${lm}`)) {
      cyclic = true;
      continue;
    }
    reachable.add(id);
    const dests = new Set(s.options.map((o) => nextStepId(c, o, lm) ?? "END"));
    if (dests.size > 1) branching.add(id);
    const state = `${id}|${lm}`;
    if (seen.has(state)) continue;
    seen.add(state);
    for (const d of dests) if (d !== "END") stack.push({ id: d, lastMain: lm, path: [...path, state] });
  }
  return { reachable, branching, cyclic };
}

/** Steps across cases whose options branch to different consequences. */
export function branchingSteps(cases: CaseStudy[]): { steps: number; branching: number } {
  let steps = 0;
  let branching = 0;
  for (const c of cases) {
    steps += c.steps.length;
    branching += walkCase(c).branching.size;
  }
  return { steps, branching };
}

export function validateCase(c: CaseStudy, refIds: Set<string>, errs: string[]) {
  const where = `case ${c.id}`;
  if (!KEBAB.test(c.id)) errs.push(`${where}: id not kebab-case`);
  if (!c.steps.length) errs.push(`${where}: no steps`);
  if (c.steps[0]?.kind === "consequence") errs.push(`${where}: the entry step cannot be a consequence step`);
  const stepIds = new Set<string>();
  for (const s of c.steps) {
    if (stepIds.has(s.id)) errs.push(`${where}: duplicate step id ${s.id}`);
    stepIds.add(s.id);
  }
  const flagsSet = new Set<string>();
  for (const s of c.steps) for (const o of s.options) for (const f of o.stateDelta?.flags ?? []) flagsSet.add(f);
  for (const s of c.steps) {
    if (s.options.length < 2) errs.push(`${where}/${s.id}: needs ≥2 options`);
    if (!s.options.some((o) => o.best)) errs.push(`${where}/${s.id}: no option marked best`);
    for (const o of s.options) {
      if (o.next && !stepIds.has(o.next)) errs.push(`${where}/${s.id}: option points to missing step "${o.next}"`);
      if (o.next === s.id) errs.push(`${where}/${s.id}: option points to its own step`);
      if (!o.feedback.trim()) errs.push(`${where}/${s.id}: option without feedback`);
      if (!o.text.trim()) errs.push(`${where}/${s.id}: option without text`);
      const d = o.stateDelta;
      if (d) {
        if (d.stability !== undefined && (!Number.isFinite(d.stability) || d.stability < -50 || d.stability > 50))
          errs.push(`${where}/${s.id}: stability delta ${d.stability} outside −50…50`);
        for (const f of d.flags ?? []) if (!KEBAB.test(f)) errs.push(`${where}/${s.id}: flag "${f}" not kebab-case`);
        if (o.best && (d.stability ?? 0) < 0) errs.push(`${where}/${s.id}: the best option should not worsen the patient`);
      }
    }
    for (const v of s.variants ?? []) {
      if (!flagsSet.has(v.flag)) errs.push(`${where}/${s.id}: variant flag "${v.flag}" is never set`);
      if (!v.info.trim()) errs.push(`${where}/${s.id}: empty variant info`);
    }
  }
  for (const v of c.outcomeVariants ?? []) {
    if (!flagsSet.has(v.flag)) errs.push(`${where}: outcome flag "${v.flag}" is never set`);
    if (!v.text.trim()) errs.push(`${where}: empty outcome variant`);
  }
  if (c.steps.length && [...stepIds].every((id) => stepIds.has(id))) {
    const w = walkCase(c);
    for (const s of c.steps) if (!w.reachable.has(s.id)) errs.push(`${where}/${s.id}: step is unreachable`);
    if (w.cyclic) errs.push(`${where}: a path through the case loops`);
  }
  if (c.provenance.kind === "published" && !/^https?:\/\//.test(c.provenance.url))
    errs.push(`${where}: published case needs a source URL`);
  if (!c.learningPoints.length) errs.push(`${where}: no learning points`);
  for (const r of c.refs ?? []) if (!refIds.has(r)) errs.push(`${where}: unknown ref "${r}"`);
}

/** Validate one track. `seen` is shared across tracks to catch global id collisions. */
export function validateTrack(t: Track, refIds: Set<string>, seen: Set<string> = new Set()): string[] {
  const errs: string[] = [];
  const claim = (id: string, where: string) => {
    if (seen.has(id)) errs.push(`${where}: duplicate id "${id}"`);
    seen.add(id);
  };
  if (!t.modules.length) errs.push(`track ${t.id}: no modules`);
  const caseIds = new Set(t.cases.map((c) => c.id));
  for (const m of t.modules) {
    const mw = `module ${m.id}`;
    if (!KEBAB.test(m.id)) errs.push(`${mw}: id not kebab-case`);
    claim(m.id, mw);
    if (!m.objectives.length) errs.push(`${mw}: no objectives`);
    if (!m.lessons.length) errs.push(`${mw}: no lessons`);
    for (const l of m.lessons) {
      const lw = `lesson ${l.id}`;
      if (!KEBAB.test(l.id)) errs.push(`${lw}: id not kebab-case`);
      claim(l.id, lw);
      if (!l.blocks.length) errs.push(`${lw}: no blocks`);
      l.blocks.forEach((b, i) => checkBlock(b, `${lw} block ${i}`, refIds, errs));
      for (const r of l.refs ?? []) if (!refIds.has(r)) errs.push(`${lw}: unknown ref "${r}"`);
      checkSources(l.sources, lw, errs);
      for (const tp of l.topics ?? []) if (!KEBAB.test(tp)) errs.push(`${lw}: topic id "${tp}" not kebab-case`);
    }
    for (const q of m.quiz) {
      claim(q.id, `quiz ${q.id}`);
      checkQuiz(q, `quiz ${q.id}`, refIds, errs);
    }
    const cue = lengthCue(m.quiz);
    if (cue.fraction > LENGTH_CUE.maxFraction)
      errs.push(
        `${mw}: answer-length cue in ${cue.flagged} of ${cue.n} quiz items (the correct option is uniquely longest or over ${LENGTH_CUE.ratio}× the mean distractor; limit ${Math.round(100 * LENGTH_CUE.maxFraction)}%)`
      );
    for (const s of m.sims ?? []) if (!SIM_IDS.includes(s.sim)) errs.push(`${mw}: unknown sim "${s.sim}"`);
    for (const cid of m.caseIds ?? []) if (!caseIds.has(cid)) errs.push(`${mw}: caseId "${cid}" not in this track's cases`);
  }
  for (const c of t.cases) {
    claim(c.id, `case ${c.id}`);
    if (c.trackId !== t.id) errs.push(`case ${c.id}: trackId ${c.trackId} ≠ ${t.id}`);
    validateCase(c, refIds, errs);
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Item analytics (classical test theory)
// ---------------------------------------------------------------------------

export interface ItemResponse {
  /** respondent: a learner, or one attempt when the app has a single learner */
  learner: string;
  item: string;
  correct: boolean;
}

export interface ItemStat {
  /** respondents who answered the item */
  n: number;
  /** p-value: proportion correct (item facility) */
  p: number;
  /**
   * corrected point-biserial: correlation between answering this item correctly
   * and the respondent's proportion correct on the other items. NaN when it
   * cannot be computed (fewer than 3 respondents or no variance).
   */
  pointBiserial: number;
}

/** p-value and point-biserial per item. The latest response per respondent and item counts. */
export function itemStats(log: ItemResponse[]): Record<string, ItemStat> {
  const latest = new Map<string, Map<string, boolean>>();
  for (const r of log) {
    let m = latest.get(r.learner);
    if (!m) latest.set(r.learner, (m = new Map()));
    m.set(r.item, r.correct);
  }
  const items = new Set(log.map((r) => r.item));
  const out: Record<string, ItemStat> = {};
  for (const item of items) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const m of latest.values()) {
      if (!m.has(item)) continue;
      let k = 0;
      let n = 0;
      for (const [id, c] of m)
        if (id !== item) {
          n++;
          if (c) k++;
        }
      xs.push(m.get(item) ? 1 : 0);
      ys.push(n ? k / n : NaN);
    }
    const n = xs.length;
    const p = n ? xs.reduce((a, b) => a + b, 0) / n : NaN;
    let r = NaN;
    const pairs = xs.map((x, i) => [x, ys[i]] as const).filter(([, y]) => Number.isFinite(y));
    if (pairs.length >= 3) {
      const mx = pairs.reduce((a, [x]) => a + x, 0) / pairs.length;
      const my = pairs.reduce((a, [, y]) => a + y, 0) / pairs.length;
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (const [x, y] of pairs) {
        sxy += (x - mx) * (y - my);
        sxx += (x - mx) ** 2;
        syy += (y - my) ** 2;
      }
      if (sxx > 0 && syy > 0) r = sxy / Math.sqrt(sxx * syy);
    }
    out[item] = { n, p, pointBiserial: r };
  }
  return out;
}
