// ---------------------------------------------------------------------------
// The PCI lab's device consoles as a registry (pci-lab-shell-session).
//
// Every src/ui/pci/consoles/*.tsx that exports `meta` (PciConsoleMeta) and a
// default component is a console; nothing else lists them, so a device
// package adds a console by adding a file. The table-side Devices tab
// (src/ui/lab/controls/tabs/PciDevicesTab.tsx) offers the consoles of the
// session's mode and shows the one open; opening one is an interruption the
// session's recorder counts ('ui' event with the console id).
// ---------------------------------------------------------------------------

import { useSyncExternalStore, type ComponentType } from "react";
import type { LaunchMode } from "../../../content/schema";
import type { PciLabSession } from "../PciLabSession";

export interface PciConsoleMeta {
  /** unique across the registry */
  id: string;
  /** the name on the console's button (generic device names, British English) */
  label: string;
  /** position among the consoles, ascending */
  order: number;
  /** the modes that offer it (default: every mode) */
  modes?: readonly LaunchMode[];
}

export interface PciConsoleProps {
  session: PciLabSession;
}

export interface PciConsole extends PciConsoleMeta {
  Component: ComponentType<PciConsoleProps>;
}

/** What a console module exports. */
export interface PciConsoleModule {
  meta?: PciConsoleMeta;
  default?: ComponentType<PciConsoleProps>;
}

/** Collect the consoles from glob results (path to module). Throws on a malformed console or a duplicate id. */
export function collectConsoles(files: Record<string, PciConsoleModule>): PciConsole[] {
  const out: PciConsole[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(files).sort()) {
    const m = files[path];
    const meta = m?.meta;
    if (!meta) throw new Error(`PCI console file ${path} does not export 'meta'`);
    if (typeof meta.id !== "string" || !meta.id) throw new Error(`${path}: console id missing`);
    if (typeof meta.label !== "string" || !meta.label) throw new Error(`${path}: console '${meta.id}' has no label`);
    if (!Number.isFinite(meta.order)) throw new Error(`${path}: console '${meta.id}' has no order`);
    if (typeof m.default !== "function" && typeof m.default !== "object") throw new Error(`${path}: console '${meta.id}' has no default component`);
    const prev = seen.get(meta.id);
    if (prev) throw new Error(`PCI console id '${meta.id}' is declared by ${prev} and ${path}`);
    seen.set(meta.id, path);
    out.push({ ...meta, Component: m.default! });
  }
  return out.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const FILES = import.meta.glob<PciConsoleModule>("./*.tsx", { eager: true });

// Development only: a console file exports `meta` (an object, rebuilt on every edit) next to its
// component, which React Fast Refresh would treat as an incompatible export and remount the lab
// (losing the case in progress). The registry reads `meta` once, so the refresh runtime may ignore it
// in console files; the component still hot-swaps. Other ignore rules already installed are kept.
const CONSOLE_DIR = "/src/ui/pci/consoles/";
if (import.meta.hot && typeof window !== "undefined") {
  type IgnoreHook = ((arg: { id: string }) => string[]) & { pciConsoles?: true };
  const w = window as unknown as { __getReactRefreshIgnoredExports?: IgnoreHook };
  const prev = w.__getReactRefreshIgnoredExports;
  // installed once, even when this module itself is hot-reloaded
  if (!prev?.pciConsoles) {
    const hook: IgnoreHook = ({ id }) => [...(prev?.({ id }) ?? []), ...(id.includes(CONSOLE_DIR) ? ["meta"] : [])];
    hook.pciConsoles = true;
    w.__getReactRefreshIgnoredExports = hook;
  }
}

let collected: readonly PciConsole[] | null = null;

/**
 * Every registered console, in order. Collected on first use: a console file imports this module (for
 * usePciSession), so the glob's modules are complete only once every import has been evaluated.
 */
export function pciConsoles(): readonly PciConsole[] {
  return (collected ??= collectConsoles(FILES));
}

/** The consoles a mode offers. */
export function consolesFor(mode: LaunchMode, consoles: readonly PciConsole[] = pciConsoles()): PciConsole[] {
  return consoles.filter((c) => !c.modes || c.modes.includes(mode));
}

/** Re-render when the PCI session publishes (actions, the procedure clock, about 5 Hz). */
export function usePciSession(session: PciLabSession | null): number {
  return useSyncExternalStore(
    (fn) => (session ? session.subscribe(fn) : () => undefined),
    () => session?.version ?? 0,
    () => session?.version ?? 0
  );
}
