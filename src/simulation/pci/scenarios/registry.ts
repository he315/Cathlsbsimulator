// ---------------------------------------------------------------------------
// PCI scenario registry (pci-scenario-registry).
//
// Every ./packs/*.ts other than the .launch.ts metadata and tests is a
// scenario pack: it exports `scenarios: PciScenarioDef[]`. Nothing lists the
// packs; a package adds scenarios by adding a pack file (with its sibling
// .launch.ts, which the launch validator and the practice index read), never
// by editing this file, the engine or the lab.
//
// The registry joins each definition with its launch metadata (lessons,
// cases, held-out flag) so the launch file is the one place lesson links are
// written. Problems (a duplicate id, a scenario missing from its launch file,
// starts that differ, a second ladder base for an EPA, a default start that
// contradicts setup.guideInRoot) are collected in PCI_REGISTRY_PROBLEMS, which
// scenarios.test.ts requires to be empty; the lab still loads the rest.
//
// Engine-free: this file imports types and the packs only, so the
// competency catalogue reads the ladder bases from here.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LaunchFile, LaunchScenario, LaunchStart } from "../../../content/schema";
import type { PciPackFile, PciScenarioDef, PciStartDef } from "./types";

/** A definition as the registry holds it: with the lessons, cases and held-out flag of its launch file. */
export interface RegisteredPciScenario extends PciScenarioDef {
  lessonIds: string[];
  caseIds: string[];
  heldOut: boolean;
  /** the pack file that declares it */
  pack: string;
}

export interface PciRegistry {
  defs: RegisteredPciScenario[];
  problems: string[];
}

const launchPathOf = (packPath: string) => packPath.replace(/\.ts$/, ".launch.ts");
const startId = (s: string | LaunchStart) => (typeof s === "string" ? s : s.id);
const startTitle = (s: string | LaunchStart) => (typeof s === "string" ? undefined : s.title);

/** Pack order: core.ts first (the lab's default scenario is its first), then the others by path. */
function packOrder(a: string, b: string): number {
  const ca = /\/core\.ts$/.test(a) ? 0 : 1;
  const cb = /\/core\.ts$/.test(b) ? 0 : 1;
  return ca - cb || (a < b ? -1 : a > b ? 1 : 0);
}

/** Join pack files with their sibling launch files (glob results: path to module). */
export function collectPciScenarios(packs: Record<string, Partial<PciPackFile>>, launches: Record<string, { launch?: LaunchFile }>): PciRegistry {
  const defs: RegisteredPciScenario[] = [];
  const problems: string[] = [];
  const seen = new Map<string, string>();
  /** EPA to the scenario that is its ladder base (catalogue.ts takes one base per EPA) */
  const ladderBases = new Map<string, string>();
  for (const path of Object.keys(packs).sort(packOrder)) {
    const list = packs[path]?.scenarios;
    if (!Array.isArray(list)) {
      problems.push(`${path}: no \`scenarios\` export`);
      continue;
    }
    const lf = launches[launchPathOf(path)]?.launch;
    if (!lf) problems.push(`${path}: no sibling ${launchPathOf(path).split("/").pop()} with a \`launch\` export`);
    else if (lf.sim !== "angio-pci") problems.push(`${launchPathOf(path)}: sim must be "angio-pci"`);
    const meta = new Map<string, LaunchScenario>((lf?.scenarios ?? []).map((s) => [s.id, s]));
    for (const d of list) {
      const where = `${path} ${d?.id ?? "(no id)"}`;
      if (!d || typeof d.id !== "string" || !d.id) {
        problems.push(`${path}: scenario without an id`);
        continue;
      }
      const prev = seen.get(d.id);
      if (prev) {
        problems.push(`${where}: duplicate scenario id (first declared in ${prev})`);
        continue;
      }
      seen.set(d.id, path);
      problems.push(...defProblems(d).map((p) => `${where}: ${p}`));
      const m = meta.get(d.id);
      if (lf && !m) problems.push(`${where}: not declared in ${launchPathOf(path)}`);
      if (m) {
        const ids = (m.starts ?? []).map(startId);
        const own = d.starts.map((s) => s.id);
        if (ids.join("|") !== own.join("|")) problems.push(`${where}: starts [${own.join(", ")}] differ from the launch file's [${ids.join(", ")}]`);
        (m.starts ?? []).forEach((s) => {
          const t = startTitle(s);
          const mine = d.starts.find((x) => x.id === startId(s));
          if (t !== undefined && mine && mine.title !== t) problems.push(`${where}: start "${mine.id}" is titled "${mine.title}" here and "${t}" in the launch file`);
        });
        if (m.title !== d.title) problems.push(`${where}: title differs from the launch file's "${m.title}"`);
      }
      if (d.ladderBase && !m?.heldOut) {
        const first = ladderBases.get(d.epa);
        if (first) problems.push(`${where}: second ladderBase for EPA ${d.epa} (first ${first})`);
        else ladderBases.set(d.epa, d.id);
      }
      defs.push({ ...d, lessonIds: [...(m?.lessonIds ?? [])], caseIds: [...(m?.caseIds ?? [])], heldOut: !!m?.heldOut, pack: path });
    }
    for (const id of meta.keys()) if (!list.some((d) => d?.id === id)) problems.push(`${launchPathOf(path)}: scenario "${id}" has no definition in ${path}`);
  }
  return { defs, problems };
}

/** Structural problems of one definition (empty when it is sound). */
export function defProblems(d: PciScenarioDef): string[] {
  const out: string[] = [];
  if (!Array.isArray(d.lesions) || d.lesions.length === 0) out.push("no lesions");
  else {
    d.lesions.forEach((l, i) => {
      if (!(l.position >= 0 && l.position <= 1)) out.push(`lesion ${i}: position ${l.position} outside 0..1`);
      if (!(l.severity >= 0 && l.severity <= 100)) out.push(`lesion ${i}: severity ${l.severity} outside 0..100`);
      if (!(l.lengthMm > 0)) out.push(`lesion ${i}: lengthMm must be positive`);
    });
    const idx = targetIndex(d);
    if (!(idx >= 0 && idx < d.lesions.length)) out.push(`target ${idx} is not a lesion index`);
    if (d.lesions.filter((l) => l.role === "target").length > 1 && d.target === undefined) out.push("several lesions have role 'target'; set `target`");
  }
  if (!d.setup?.guideDefault) out.push("no setup.guideDefault");
  if (!Array.isArray(d.starts) || d.starts.length === 0) out.push("no starts");
  else {
    const ids = d.starts.map((s) => s.id);
    if (new Set(ids).size !== ids.length) out.push("duplicate start ids");
    if (d.start !== undefined && !ids.includes(d.start)) out.push(`default start "${d.start}" is not one of its starts`);
    const def = startOf(d);
    const inRoot = d.setup?.guideInRoot;
    if (def && inRoot !== undefined && def.guideEngaged === inRoot) out.push(`setup.guideInRoot is ${inRoot} but the default start "${def.id}" has guideEngaged ${def.guideEngaged}`);
  }
  for (const h of d.hidden ?? []) if (!h.options.length || h.options.some((o) => !(o.weight > 0))) out.push(`hidden "${h.id}": every option needs a positive weight`);
  return out;
}

/** Index of the active target lesion: `target`, else the lesion with role 'target', else 0. */
export function targetIndex(d: Pick<PciScenarioDef, "lesions" | "target">): number {
  if (d.target !== undefined) return d.target;
  const i = d.lesions.findIndex((l) => l.role === "target");
  return i >= 0 ? i : 0;
}

/** The start a launch asks for, else the definition's default (its `start`, else its first). */
export function startOf(d: Pick<PciScenarioDef, "starts" | "start">, id?: string | null): PciStartDef | undefined {
  if (id) return d.starts.find((s) => s.id === id);
  return (d.start ? d.starts.find((s) => s.id === d.start) : undefined) ?? d.starts[0];
}

/**
 * The scenario events of a definition with lesion `idx` as the active target: the case-wide events,
 * the target lesion's declared sites, and 'calcified-lesion' when its calcium is grade 2. The PCI
 * lab's tip context (pci-tip-context) raises these for the whole run.
 */
export function scenarioEvents(d: Pick<PciScenarioDef, "lesions" | "target" | "events">, idx = targetIndex(d)): LabEvent[] {
  const l = d.lesions[idx];
  const out: LabEvent[] = [...(d.events ?? []), ...(l?.sites ?? [])];
  if (l?.calcium === 2) out.push("calcified-lesion");
  return [...new Set(out)];
}

// The literal patterns: every pack in ./packs, not its launch metadata or tests.
const PACKS = import.meta.glob<Partial<PciPackFile>>(["./packs/*.ts", "!./packs/*.launch.ts", "!./packs/*.test.ts"], { eager: true });
const LAUNCHES = import.meta.glob<{ launch?: LaunchFile }>("./packs/*.launch.ts", { eager: true });

const REGISTRY = collectPciScenarios(PACKS, LAUNCHES);

/** Every PCI scenario definition, core pack first. */
export const PCI_SCENARIO_DEFS: readonly RegisteredPciScenario[] = REGISTRY.defs;

/** What collecting the packs found wrong (scenarios.test.ts requires none). */
export const PCI_REGISTRY_PROBLEMS: readonly string[] = REGISTRY.problems;

export const PCI_DEF_BY_ID: Readonly<Record<string, RegisteredPciScenario>> = Object.fromEntries(PCI_SCENARIO_DEFS.map((d) => [d.id, d]));

export function pciScenarioDef(id: string | null | undefined): RegisteredPciScenario | undefined {
  return id ? PCI_DEF_BY_ID[id] : undefined;
}
