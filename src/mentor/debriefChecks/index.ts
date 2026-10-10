// ---------------------------------------------------------------------------
// The debrief check registry (found-mentor-registries).
//
// Every src/mentor/debriefChecks/*.ts other than this index (and test files)
// is a debrief check: it exports `function check(input)` returning the gaps it
// finds (CheckGap[], from src/mentor/debrief.ts), and may export `id` (default:
// the file name) and `order` (default 1000; lower runs first, ties by path).
// buildDebrief runs the checks after finding its own gaps and ranks all of
// them together. Nothing else lists the files, so a package adds a check by
// adding a file here. Test fixtures live under __fixtures__/ and are not
// globbed.
//
// Check files import from ../debrief with `import type` only, because
// debrief.ts imports this registry (registries.test.ts checks this).
// ---------------------------------------------------------------------------

import type { CheckGap, DebriefInput } from "../debrief";

/** What a file under src/mentor/debriefChecks/ exports. */
export interface DebriefCheckModule {
  check: (input: DebriefInput) => CheckGap[];
  id?: string;
  order?: number;
}

/** A registered check. */
export interface DebriefCheck {
  id: string;
  order: number;
  path: string;
  check: (input: DebriefInput) => CheckGap[];
}

/** Default position of a check that gives no order. */
export const DEFAULT_CHECK_ORDER = 1000;

const fileId = (path: string) => path.replace(/^.*\//, "").replace(/\.tsx?$/, "");

/** Collect the checks from glob modules (path to module). Throws on a file without check() or a duplicate id. */
export function collectChecks(modules: Record<string, unknown>): DebriefCheck[] {
  const out: DebriefCheck[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(modules).sort()) {
    const mod = modules[path] as Partial<DebriefCheckModule> | undefined;
    if (!mod || typeof mod.check !== "function") throw new Error(`debrief check file ${path} does not export 'check'`);
    const id = mod.id ?? fileId(path);
    if (typeof id !== "string" || !id) throw new Error(`${path}: check id must be a non-empty string`);
    const order = mod.order ?? DEFAULT_CHECK_ORDER;
    if (typeof order !== "number" || !Number.isFinite(order)) throw new Error(`${path}: check '${id}' order must be a number`);
    const prev = seen.get(id);
    if (prev) throw new Error(`debrief check id '${id}' is declared by ${prev} and ${path}`);
    seen.set(id, path);
    out.push({ id, order, path, check: mod.check });
  }
  return out.sort((a, b) => a.order - b.order || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** The check files (path to module), for the registry and its tests. */
export const CHECK_FILES = import.meta.glob<DebriefCheckModule>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });

/** Every registered debrief check, in run order (none at the time of the split). */
export const DEBRIEF_CHECKS: readonly DebriefCheck[] = collectChecks(CHECK_FILES);
