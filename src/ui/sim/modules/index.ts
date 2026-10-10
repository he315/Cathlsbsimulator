// ---------------------------------------------------------------------------
// Diagnostic lab session modules (diag-tip-context).
//
// Every src/ui/sim/modules/*.ts other than this file is a session module: it
// exports `createSessionModule: () => SessionModule` and, when it reports
// phases or events for the tips, `raises` (LabRaises, read by the reachability
// report). Nothing lists the modules; a later diagnostic package adds a file
// here instead of editing labSession.ts. DiagnosticLabSession creates one
// instance of every module per session, attaches it, steps it after its own
// step, tells it about each injection and merges its events() into the tip
// context. Modules are created in file-name order.
//
// A module imports DiagnosticLabSession as a type only (import type): the
// session imports this registry, so a value import would be a cycle.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { ContrastOutcome } from "../../../types";
import type { DiagnosticLabSession } from "../labSession";

/** An injection the session has started (after the store booked its outcome). */
export interface SessionInjection {
  /** lab time, s */
  t: number;
  side: "left" | "right";
  /** the store's outcome of the injection (null when the store recorded none) */
  outcome: ContrastOutcome | null;
  catheterId: string;
}

export interface SessionModule {
  /** unique id (kebab-case) */
  id: string;
  /** called once when the session is built; may return a function the session calls on dispose */
  attach(session: DiagnosticLabSession): void | (() => void);
  /** called after every session step with its dt, s */
  step?(dt: number): void;
  /** called when an injection starts */
  onInject?(ev: SessionInjection): void;
  /** events the module reports now (merged into the tip context with the session's EventLog) */
  events?(): readonly LabEvent[];
}

export type SessionModuleFactory = () => SessionModule;

/** What a module file exports. */
export interface SessionModuleFile {
  createSessionModule?: SessionModuleFactory;
  raises?: LabRaises | readonly LabRaises[];
}

/** One registered module file. */
export interface SessionModuleEntry {
  file: string;
  create: SessionModuleFactory;
}

/** Collect the module factories from glob modules (path to module). Throws on a file without a factory. */
export function collectSessionModules(files: Record<string, unknown>): SessionModuleEntry[] {
  const out: SessionModuleEntry[] = [];
  for (const file of Object.keys(files).sort()) {
    const create = (files[file] as SessionModuleFile | undefined)?.createSessionModule;
    if (typeof create !== "function") throw new Error(`diagnostic session module file ${file} does not export 'createSessionModule'`);
    out.push({ file, create });
  }
  return out;
}

/**
 * Create one instance of each factory, checking ids. Throws on a module without an id or attach,
 * or on a duplicate id.
 */
export function instantiateSessionModules(factories: readonly SessionModuleFactory[]): SessionModule[] {
  const seen = new Set<string>();
  return factories.map((f) => {
    const m = f();
    if (!m || typeof m.id !== "string" || !m.id) throw new Error("a diagnostic session module has no id");
    if (typeof m.attach !== "function") throw new Error(`diagnostic session module '${m.id}' has no attach()`);
    if (seen.has(m.id)) throw new Error(`diagnostic session module id '${m.id}' is used twice`);
    seen.add(m.id);
    return m;
  });
}

const FILES = import.meta.glob<SessionModuleFile>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });

/** Every registered session module file, in file-name order. */
export const SESSION_MODULES: readonly SessionModuleEntry[] = collectSessionModules(FILES);

/** The factories of every registered module (what DiagnosticLabSession uses by default). */
export function sessionModuleFactories(): SessionModuleFactory[] {
  return SESSION_MODULES.map((m) => m.create);
}
