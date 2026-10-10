// ---------------------------------------------------------------------------
// Full-case session modules (proc-foundation-scenarios-ledger).
//
// Every src/simulation/session/modules/*.ts other than this file and tests is
// a session module: it exports `createSessionModule: () => CaseSessionModule`
// and, when it reports phases or events for the tips, `raises` (LabRaises,
// read by the reachability report). Nothing lists the modules: a package adds
// behaviour to the full case by adding a file here, and caseSession.ts is
// edited only for the core access and closure flow.
//
// CaseSession creates one instance of every module per session (file-name
// order), attaches it, calls slowTick after its own slow consequences, tells
// it about each session hook, and merges its events() into the session's
// active events. session.mod(id) returns the instance, so a panel or a test
// can call the module's actions.
//
// A module imports CaseSession as a type only (import type): the session
// imports this registry, so a value import would be a cycle.
//
// What a module may use of the session beyond its state (repair-session-flow):
//   - gate(action, args): the session consults every module before an action
//     a module may refuse (CaseGatedAction: placeNeedle, femoralDevice) and
//     speaks the first refusal as an attending stop line; a module never
//     wraps the session's methods;
//   - session.say() and session.logEntry(): the attending's lines (under the
//     visibility policy) and the case log; a module never pushes into
//     session.attending or session.log;
//   - postponed(): the module ended the case (the planning module's hold and
//     delay); before any puncture the session's finish() accepts it;
//   - session.holdLapse(by, rate) and releaseLapse(by): pause or slow a
//     compression, band or recovery time-lapse while an emergency is under
//     way (the live lab turns holds on with session.lapseHoldsOn);
//   - tipContexts(): lab contexts the module reports beside the case's own
//     (the hypotension module's right heart numbers); caseTips.ts merges them;
//   - session.teamSetup: true while a scenario's start state runs, so what it
//     does (a team puncture) is the team's, not the learner's.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { NeedlePose } from "../../access/ultrasound";
import type { CaseSession } from "../caseSession";
import type { SessionHook } from "../scenarios/index";

/** What each action a module may refuse passes to gate(). */
export interface CaseGateArgs {
  placeNeedle: { pose: NeedlePose };
  femoralDevice: { kind?: "suture-device" | "collagen-plug" };
}

/** The session actions a module may refuse. */
export type CaseGatedAction = keyof CaseGateArgs;

/** A case a module ended (the planning module's hold and delay): when, and the line that says so. */
export interface CasePostponement {
  t: number;
  text: string;
}

export interface CaseSessionModule {
  /** unique id (kebab-case); session.mod(id) finds it */
  id: string;
  /** called once when the session is built; may return a function the session calls on dispose */
  attach(session: CaseSession): void | (() => void);
  /** called on every slow step of the session clock with the step, s (at most 5 s) */
  slowTick?(h: number): void;
  /** called when a session hook fires ('puncture', 'sheath-in', 'sheath-pull', 'closure', ...) */
  onHook?(hook: SessionHook): void;
  /** events the module reports now (merged into the session's active events) */
  events?(): readonly LabEvent[];
  /**
   * Consulted before an action a module may refuse: the line the attending says to refuse it, or null to
   * let it go ahead. The session asks every module in attach order and stops at the first refusal.
   */
  gate?<A extends CaseGatedAction>(action: A, args: CaseGateArgs[A]): string | null;
  /** the case this module ended (null: it goes on); before any puncture finish() accepts it */
  postponed?(): CasePostponement | null;
  /** lab contexts the module reports now, beside the case's own (src/ui/access/caseTips.ts merges them) */
  tipContexts?(): readonly LabContext[];
  /** what panels and tests may call through session.mod(id).actions */
  actions?: Record<string, (...args: never[]) => unknown>;
}

export type CaseSessionModuleFactory = () => CaseSessionModule;

/** What a module file exports. */
export interface CaseSessionModuleFile {
  createSessionModule?: CaseSessionModuleFactory;
  raises?: LabRaises | readonly LabRaises[];
}

export interface CaseSessionModuleEntry {
  file: string;
  create: CaseSessionModuleFactory;
}

/** Collect the factories from glob modules (path to module). Throws on a file without a factory. */
export function collectCaseModules(files: Record<string, unknown>): CaseSessionModuleEntry[] {
  const out: CaseSessionModuleEntry[] = [];
  for (const file of Object.keys(files).sort()) {
    const create = (files[file] as CaseSessionModuleFile | undefined)?.createSessionModule;
    if (typeof create !== "function") throw new Error(`full-case session module file ${file} does not export 'createSessionModule'`);
    out.push({ file, create });
  }
  return out;
}

/** One instance of each factory. Throws on a module without an id or attach, or on a duplicate id. */
export function instantiateCaseModules(factories: readonly CaseSessionModuleFactory[]): CaseSessionModule[] {
  const seen = new Set<string>();
  return factories.map((f) => {
    const m = f();
    if (!m || typeof m.id !== "string" || !m.id) throw new Error("a full-case session module has no id");
    if (typeof m.attach !== "function") throw new Error(`full-case session module '${m.id}' has no attach()`);
    if (seen.has(m.id)) throw new Error(`full-case session module id '${m.id}' is used twice`);
    seen.add(m.id);
    return m;
  });
}

// The literal patterns: every module file in this folder, not this index or tests.
const FILES = import.meta.glob<CaseSessionModuleFile>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });

/** The registered module factories, in file-name order. */
export const CASE_SESSION_MODULES: readonly CaseSessionModuleFactory[] = collectCaseModules(FILES).map((e) => e.create);
