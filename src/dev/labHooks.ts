// ---------------------------------------------------------------------------
// Dev hooks for the labs (found-lab-session-plumbing). The browser pane pauses
// requestAnimationFrame while it is hidden, so a lab that advances on frames
// cannot be checked by watching it. registerLabHook(name, hook) installs
// window.__lab[name] in DEV builds with the lab's current tip context, the tips
// it would show, its state and (optionally) a step function that advances it
// by hand:
//
//   window.__lab.pci.context()   // LabContext (or one per lab, for the full case)
//   window.__lab.pci.tips()      // tip ids the lab would show now
//   window.__lab.pci.state()     // whatever the lab exposes (JSON-friendly)
//   window.__lab.pci.step(2)     // advance 2 s of lab time
//
// The diagnostic lab already sets window.__lab to its session in DEV (the X-ray
// capture uses it). The hooks live on whatever object window.__lab holds: they
// are added to it, and re-added when a lab replaces it, without overwriting a
// property the object has of its own. window.__labHooks always holds every
// registered hook. In a production build nothing is installed: both globals
// stay undefined.
//
// Two consequences for callers:
// - window.__lab is not always a DiagnosticLabSession. While a hook is
//   registered and no session has been assigned it is a plain holder of the
//   hooks, so it is truthy on a page without the diagnostic lab. A caller that
//   needs the session tests for one of its methods
//   (typeof window.__lab?.startInjection === "function"), never the truthiness
//   of window.__lab.
// - A hook named after a property the session already has (engine, run, table,
//   contrast, crew, ...) is not added to window.__lab; it is reachable only as
//   window.__labHooks[name]. DEV builds warn once per name when this happens.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../content/lab/tips";

export interface LabHook {
  /** the tip context the lab reports now (one per lab for a lab that spans several) */
  context: () => LabContext | readonly LabContext[] | null;
  /** the ids of the tips the lab would show now (under its policy) */
  tips: () => readonly string[];
  /** the lab's state for inspection (JSON-friendly) */
  state: () => unknown;
  /** advance the lab by `seconds` of lab time in steps of dt (default the lab's own) */
  step?: (seconds: number, dt?: number) => void;
  /** the events active now (EventLog.active) */
  events?: () => readonly LabEvent[];
}

/** The installed handle: the hook, plus its name. */
export type LabHookHandle = LabHook & { readonly name: string };

type HookTarget = Record<string, unknown>;

/** Registered hooks per target (window in the app, any object in tests). */
const REGISTRIES = new WeakMap<object, Map<string, LabHookHandle>>();

/** Is this a DEV build? */
export function labHooksEnabled(): boolean {
  const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return !!env?.DEV;
}

function registry(target: object): Map<string, LabHookHandle> {
  let m = REGISTRIES.get(target);
  if (!m) {
    m = new Map();
    REGISTRIES.set(target, m);
  }
  return m;
}

const HANDLE = Symbol("labHook");
function isHandle(v: unknown): boolean {
  return !!v && typeof v === "object" && (v as Record<symbol, unknown>)[HANDLE] === true;
}

/** Names already warned about as shadowed (once per name per page). */
const WARNED = new Set<string>();

/**
 * Warn (once per name) that a hook is left off window.__lab because the object there has that
 * property. Only reached in DEV builds: attach runs only once a hook has been registered with hooks
 * enabled.
 */
function warnShadowed(name: string): void {
  if (WARNED.has(name)) return;
  WARNED.add(name);
  if (typeof console !== "undefined") {
    console.warn(`[labHooks] window.__lab already has "${name}", so the lab hook of that name is not added there; use window.__labHooks["${name}"].`);
  }
}

/** Add the registered hooks to an object, never shadowing a property or method the object has of its own. */
function attach(obj: unknown, hooks: Map<string, LabHookHandle>): void {
  if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return;
  const o = obj as Record<string, unknown>;
  for (const [name, h] of hooks) {
    const own = Object.getOwnPropertyDescriptor(o, name);
    if (own ? !isHandle(own.value) : name in o) {
      warnShadowed(name);
      continue;
    }
    try {
      Object.defineProperty(o, name, { value: h, configurable: true, enumerable: false, writable: true });
    } catch {
      // a frozen object: the hook stays reachable through __labHooks
    }
  }
}

type LabGetter = (() => unknown) & { __labHooks?: boolean; __holder?: Record<string, unknown> };

/**
 * Make target.__lab an accessor that keeps the hooks on whatever object is assigned to it (the
 * diagnostic lab assigns its session), and target.__labHooks the plain registry. With no session
 * assigned, __lab is a holder of the hooks while any is registered and undefined otherwise.
 */
function install(target: HookTarget, hooks: Map<string, LabHookHandle>): void {
  const desc = Object.getOwnPropertyDescriptor(target, "__lab");
  if (!desc || !(desc.get as LabGetter | undefined)?.__labHooks) {
    let base: unknown = desc && "value" in desc ? desc.value : desc?.get ? desc.get.call(target) : undefined;
    const holder: Record<string, unknown> = {};
    const get = function (this: unknown) {
      return base ?? (hooks.size ? holder : undefined);
    } as LabGetter;
    get.__labHooks = true;
    get.__holder = holder;
    Object.defineProperty(target, "__lab", {
      configurable: true,
      enumerable: true,
      get,
      set(v: unknown) {
        base = v;
        attach(v, hooks);
      },
    });
    attach(holder, hooks);
    if (base) attach(base, hooks);
  }
  attach(target.__lab, hooks);
  const all: Record<string, LabHookHandle> = {};
  for (const [n, h] of hooks) all[n] = h;
  target.__labHooks = all;
}

/** Remove a hook from target.__lab (only if it is still ours) and from the registry view. */
function uninstall(target: HookTarget, name: string, h: LabHookHandle, hooks: Map<string, LabHookHandle>): void {
  const holder = (Object.getOwnPropertyDescriptor(target, "__lab")?.get as LabGetter | undefined)?.__holder;
  for (const lab of [target.__lab as Record<string, unknown> | undefined, holder]) {
    if (lab && Object.getOwnPropertyDescriptor(lab, name)?.value === h) {
      try {
        delete lab[name];
      } catch {
        // frozen
      }
    }
  }
  const all: Record<string, LabHookHandle> = {};
  for (const [n, x] of hooks) all[n] = x;
  target.__labHooks = all;
}

/**
 * Install target.__lab[name] (testable form of registerLabHook). When `enabled` is false nothing is
 * installed. Returns the function that removes it; a later registration under the same name
 * replaces it, and the earlier remover then does nothing.
 */
export function registerLabHookOn(target: object, name: string, hook: LabHook, enabled: boolean): () => void {
  if (!enabled) return () => undefined;
  const hooks = registry(target);
  const handle = { ...hook, name, [HANDLE]: true } as LabHookHandle;
  hooks.set(name, handle);
  install(target as HookTarget, hooks);
  return () => {
    if (hooks.get(name) !== handle) return;
    hooks.delete(name);
    uninstall(target as HookTarget, name, handle, hooks);
  };
}

/** Install window.__lab[name] in DEV builds; returns the function that removes it (a no-op in production). */
export function registerLabHook(name: string, hook: LabHook): () => void {
  if (typeof globalThis === "undefined") return () => undefined;
  return registerLabHookOn(globalThis, name, hook, labHooksEnabled());
}
