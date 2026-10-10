// ---------------------------------------------------------------------------
// Launching the PCI lab at a named scenario (pci-scenario-registry).
//
// A lesson, case, case library or progress screen opens the lab with
// useUiStore.openSim('angio-pci', params), which leaves the params in
// useLabLaunchStore; a lab that sends its patient on (the full case after a
// diagnostic study) puts a transfer in useLabHandoverStore. The PCI lab takes
// either here, once, and gets back the resolved scenario, the start state,
// the mode and the events to keep active for the run:
//   scenario   a registry id (src/simulation/pci/scenarios/packs/*.launch.ts)
//   variant    a ladder variant id (pci-<id>~L3) or a seed
//   seed       the seed of the run's random draws
//   start      a start state of the scenario (default: the scenario's own)
//   mode       guided | supervised | independent | exam (default guided)
//   technique, step, workspace   passed through for the tip context and the layout
//   events     comma-separated events kept active for the whole run
// A transfer is taken before a link, and a link pending beside it is set
// aside. Nothing here is persisted.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";
import type { LaunchMode, LaunchParams } from "../../content/schema";
import { isLaunchMode } from "../../content/validateLaunch";
import { useEffect, useRef } from "react";
import { subscribeLabLaunch, takeLaunch } from "../../state/useLabLaunchStore";
import { subscribeLabHandover, takeHandover, type LabTransfer } from "../../state/useLabHandoverStore";
import { resolveScenario, type ResolvedPciScenario } from "../../simulation/pci/scenarios/generate";
import { startOf } from "../../simulation/pci/scenarios/registry";
import type { PciStartDef } from "../../simulation/pci/scenarios/types";

export const PCI_SIM = "angio-pci" as const;

export interface PciLaunch {
  source: "link" | "handover";
  params: LaunchParams;
  resolved: ResolvedPciScenario;
  start: PciStartDef;
  mode: LaunchMode;
  technique?: string;
  step?: number;
  workspace?: string;
  /** the scenario's events, the start's, the launch's `events` and the transfer's, each once */
  events: LabEvent[];
}

export interface PciLaunchResult {
  /** null when the params name no scenario the lab can open */
  launch: PciLaunch | null;
  /** what could not be honoured (an unknown mode or start falls back to the default and is listed) */
  problems: string[];
  /** the transfer this launch came with (its patient, report and context), if any */
  handover: LabTransfer | null;
}

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parse the comma-separated `events` param (names that are not kebab-case are reported and dropped). */
function parseEvents(raw: string | undefined, problems: string[]): LabEvent[] {
  if (!raw) return [];
  const out: LabEvent[] = [];
  for (const e of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
    if (KEBAB.test(e)) out.push(e as LabEvent);
    else problems.push(`event "${e}" is not a kebab-case event name`);
  }
  return out;
}

/** Resolve launch params (and an optional transfer) into what the lab opens. Pure: it reads no store. */
export function resolvePciLaunch(params: LaunchParams | null | undefined, handover: LabTransfer | null = null): PciLaunchResult {
  const p: LaunchParams = { ...(params ?? {}) };
  const problems: string[] = [];
  const fail = (msg: string): PciLaunchResult => ({ launch: null, problems: [...problems, msg], handover });
  if (!p.scenario) return fail(handover ? "the transfer names no PCI scenario" : "the launch names no PCI scenario");
  let resolved: ResolvedPciScenario;
  try {
    resolved = resolveScenario(p.scenario, p.variant, { seed: p.seed });
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
  let start = startOf(resolved.def, p.start);
  if (!start) {
    problems.push(`unknown start "${p.start}" for scenario "${p.scenario}"; opening at the default start`);
    start = startOf(resolved.def)!;
  }
  let mode: LaunchMode = "guided";
  if (p.mode !== undefined) {
    if (isLaunchMode(p.mode)) mode = p.mode;
    else problems.push(`unknown mode "${p.mode}"; opening in guided mode`);
  }
  let step: number | undefined;
  if (p.step !== undefined) {
    const n = Number(p.step);
    if (Number.isInteger(n) && n > 0) step = n;
    else problems.push(`step "${p.step}" is not a positive whole number`);
  }
  const events = [...new Set<LabEvent>([...resolved.events, ...(start.events ?? []), ...parseEvents(p.events, problems), ...(handover?.events ?? [])])];
  const launch: PciLaunch = { source: handover ? "handover" : "link", params: p, resolved, start, mode, events };
  if (p.technique) launch.technique = p.technique;
  if (step !== undefined) launch.step = step;
  if (p.workspace) launch.workspace = p.workspace;
  return { launch, problems, handover };
}

/** Resolve a transfer to the PCI lab. */
export const resolvePciHandover = (t: LabTransfer): PciLaunchResult => resolvePciLaunch(t.params, t);

/**
 * Take what is pending for the PCI lab, once: a transfer first, else a link. Null when nothing is
 * pending. Both stores are consumed: a link pending beside a transfer is set aside (the transfer
 * carries the patient) and named in the result's problems.
 */
export function takePciLaunch(): PciLaunchResult | null {
  const t = takeHandover(PCI_SIM);
  const params = takeLaunch(PCI_SIM);
  if (t) {
    const r = resolvePciHandover(t);
    if (params) r.problems.push(`a pending link${params.scenario ? ` to "${params.scenario}"` : ""} was set aside: the transfer is taken first`);
    return r;
  }
  return params ? resolvePciLaunch(params) : null;
}

/**
 * Deliver launches to the PCI lab: calls `onLaunch` at once with what is pending (takePciLaunch, so a
 * transfer wins over a link pending beside it), then once for every new transfer or link that arrives.
 * Returns the unsubscribe function. usePciLaunch wraps this in an effect; it is exported for tests.
 */
export function subscribePciLaunch(onLaunch: (r: PciLaunchResult) => void): () => void {
  const first = takePciLaunch();
  if (first) onLaunch(first);
  // both stores are empty now, so these deliver only what arrives later
  const offHandover = subscribeLabHandover(PCI_SIM, (t) => onLaunch(resolvePciHandover(t)));
  const offLink = subscribeLabLaunch(PCI_SIM, (params) => onLaunch(resolvePciLaunch(params)));
  return () => {
    offHandover();
    offLink();
  };
}

/**
 * For the PCI lab component: calls `onLaunch` on mount and whenever a new link or transfer for the
 * lab arrives while it is mounted (pass `enabled: false` while it is not the visible tab).
 */
export function usePciLaunch(onLaunch: (r: PciLaunchResult) => void, enabled = true): void {
  const cb = useRef(onLaunch);
  cb.current = onLaunch;
  useEffect(() => {
    if (!enabled) return;
    return subscribePciLaunch((r) => cb.current(r));
  }, [enabled]);
}
