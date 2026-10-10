// ---------------------------------------------------------------------------
// The table-side tab registry (found-lab-controls-registry).
//
// Every src/ui/lab/controls/tabs/*.tsx that exports `tab: ControlTab` is a
// tab; nothing else lists them. Tabs are sorted by order, then id. Test
// fixtures live under __fixtures__/ and are not globbed here.
// ---------------------------------------------------------------------------

import type { LabPolicy } from "../visibility";
import type { ControlTab, ControlTabModule, LabControlsTarget } from "./types";

/** Collect the tabs from glob modules (path to module). Throws on a malformed tab or a duplicate id. */
export function collectControlTabs(modules: Record<string, unknown>): ControlTab[] {
  const out: ControlTab[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(modules).sort()) {
    const tab = (modules[path] as ControlTabModule | undefined)?.tab;
    if (!tab) throw new Error(`table-side tab file ${path} does not export 'tab'`);
    if (typeof tab.id !== "string" || !tab.id) throw new Error(`${path}: tab id missing`);
    if (typeof tab.label !== "string" || !tab.label) throw new Error(`${path}: tab '${tab.id}' has no label`);
    if (!Number.isFinite(tab.order)) throw new Error(`${path}: tab '${tab.id}' has no order`);
    if (!Array.isArray(tab.labs) || !tab.labs.length) throw new Error(`${path}: tab '${tab.id}' lists no labs`);
    if (typeof tab.Component !== "function" && typeof tab.Component !== "object") throw new Error(`${path}: tab '${tab.id}' has no Component`);
    const prev = seen.get(tab.id);
    if (prev) throw new Error(`table-side tab id '${tab.id}' is declared by ${prev} and ${path}`);
    seen.set(tab.id, path);
    out.push(tab);
  }
  return out.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const FILES = import.meta.glob<ControlTabModule>("./tabs/*.tsx", { eager: true });

/** Every registered table-side tab, in strip order. */
export const CONTROL_TABS: readonly ControlTab[] = collectControlTabs(FILES);

/** The tabs this target shows under this policy. */
export function tabsFor(target: LabControlsTarget, policy: LabPolicy, tabs: readonly ControlTab[] = CONTROL_TABS): ControlTab[] {
  return tabs.filter((t) => t.labs.includes(target.controlsLab) && (t.visible ? t.visible(target, policy) : true));
}
