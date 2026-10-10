// ---------------------------------------------------------------------------
// The attending's rule registry (found-mentor-registries).
//
// Every src/mentor/rules/*.ts other than this index (and test files) is a rule
// group: it exports `order` (a number) and `rules` (MentorRule[]). RULES is the
// groups' rules in group order (ties by file path), each group's rules in the
// order the file lists them. Nothing else lists the files, so a package adds
// rules by adding a file here. Test fixtures live under __fixtures__/ and are
// not globbed.
//
// The groups at the time of the split: diagnostic.ts (order 100) and
// pciLegacy.ts (order 200), which give exactly the ids and order RULES had
// when it was one array in src/mentor/rules.ts.
// ---------------------------------------------------------------------------

import type { MentorRule, RuleGroupModule } from "../rules";
import { TIMEOUT_RULE } from "./diagnostic";

const LADDER_KEYS = new Set(["1", "2", "3", "4", "5"]);

/**
 * Collect the rules from glob modules (path to module). Throws on a file that is not a rule group,
 * a malformed rule, or an id declared twice (here, or by the time-out rule).
 */
export function collectRules(modules: Record<string, unknown>, reserved: readonly MentorRule[] = [TIMEOUT_RULE]): MentorRule[] {
  const groups: { path: string; order: number; rules: MentorRule[] }[] = [];
  const seen = new Map<string, string>(reserved.map((r) => [r.id, "the reserved rules"]));
  for (const path of Object.keys(modules).sort()) {
    const mod = modules[path] as Partial<RuleGroupModule> | undefined;
    if (!mod || !Array.isArray(mod.rules)) throw new Error(`rule file ${path} does not export 'rules'`);
    if (typeof mod.order !== "number" || !Number.isFinite(mod.order)) throw new Error(`rule file ${path} does not export a numeric 'order'`);
    for (const r of mod.rules) {
      if (!r || typeof r.id !== "string" || !r.id) throw new Error(`${path}: a rule has no id`);
      if (typeof r.title !== "string" || !r.title) throw new Error(`${path}: rule '${r.id}' has no title`);
      if (typeof r.when !== "function") throw new Error(`${path}: rule '${r.id}' has no 'when'`);
      if (!Number.isFinite(r.persistS) || !Number.isFinite(r.cooldownS)) throw new Error(`${path}: rule '${r.id}' needs persistS and cooldownS`);
      const levels = Object.keys(r.lines ?? {});
      if (!levels.length || levels.some((k) => !LADDER_KEYS.has(k) || typeof (r.lines as Record<string, unknown>)[k] !== "function")) throw new Error(`${path}: rule '${r.id}' needs lines on ladder levels 1 to 5`);
      const prev = seen.get(r.id);
      if (prev) throw new Error(`rule id '${r.id}' is declared by ${prev} and ${path}`);
      seen.set(r.id, path);
    }
    groups.push({ path, order: mod.order, rules: mod.rules });
  }
  groups.sort((a, b) => a.order - b.order || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return groups.flatMap((g) => g.rules);
}

/** The rule group files (path to module), for the registry and its tests. */
export const RULE_FILES = import.meta.glob<RuleGroupModule>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });

/** Every registered rule, in group order. */
export const RULES: MentorRule[] = collectRules(RULE_FILES);

export { TIMEOUT_RULE };

export const ALL_RULES: MentorRule[] = [...RULES, TIMEOUT_RULE];

export const ruleById = (id: string): MentorRule | undefined => ALL_RULES.find((r) => r.id === id);
