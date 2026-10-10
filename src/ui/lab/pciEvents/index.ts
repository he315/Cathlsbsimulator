// ---------------------------------------------------------------------------
// PCI event sources (pci-tip-context): the registry of what the fluoroscopic
// PCI lab can detect for the lab tips.
//
// Every ./*.ts file here other than this index and the tests is an event
// source file. It exports
//   PCI_EVENT_SOURCES  the events it detects: { event, active(snap), holdS }
//   raises             what it reports (LabRaises), derived from its sources
//                      and the phases it sets (raisesFrom in ./base.ts)
// Nothing lists the files: a feature package adds src/ui/lab/pciEvents/<feature>.ts
// and its events reach the tip context (src/ui/lab/pciTips.ts) and the
// reachability report (src/content/lab/reachability.test.ts, which globs this
// folder for `raises`) without editing this index, the tip context or waiting.ts.
//
// The index also re-exports the PCI lab session's own `raises`
// (src/ui/pci/PciLabSession.ts: phases plan and finish, high-radiation-dose and
// the patient events), so the reachability report counts what the session raises.
//
// A source reads one snapshot of the lab (PciTipSnapshot, a structural subset of
// PciLabSession.snapshot()) and nothing else, so the tip context is a pure
// function of the snapshot.
// ---------------------------------------------------------------------------

import type { BifTechnique, LabEvent } from "../../../content/lab/tips";
import type { PciState } from "../../../simulation/pci/state";
import type { PciScenarioDef } from "../../../simulation/pci/scenarios/types";
import type { ActiveDevice } from "../../../simulation/pci/equipment";
import type { DoseTotals } from "../../../simulation/dose";
import type { PatientVitals } from "../patientEvents";

/**
 * What the PCI tip context reads: PciLabSession.snapshot() satisfies it, and tests build or extend
 * one directly. Only `state` and `lesion` are required; everything else is optional so that a
 * headless script (the engine state and the target lesion alone) can ask for a context too.
 */
export interface PciTipSnapshot {
  /** lab seconds (informational; the hold windows run on the procedure clock, state.t) */
  t?: number;
  /** the PCI procedure state */
  state: PciState;
  /** the active target lesion as the geometry places it (mm along its route) */
  lesion: { vessel: string; startMm: number; endMm: number };
  /** the scenario definition (registry): its case-wide events and the target lesion's sites */
  definition?: Pick<PciScenarioDef, "lesions" | "target" | "events">;
  /** the engine scenario: the target's pathology kind and the active target index */
  scenario?: { target: { kind: string }; targetIdx?: number };
  /** the start state the case opened at (its events are held for the run) */
  start?: { events?: readonly LabEvent[] };
  /** further case and scenario events held for the run (a launch's events, a headless caller's flags) */
  caseEvents?: readonly LabEvent[];
  /** the patient engine's vitals (patient events are read from them as well as from activeEvents) */
  vitals?: PatientVitals;
  /** the guide pressure trace's class (src/simulation/pressure.ts PressureKind: aortic, damped, ventricularised...) */
  guidePressure?: string;
  /** the dose so far */
  dose?: DoseTotals;
  /** the session's workflow flags */
  workflow?: { prebriefOpen?: boolean; finishing?: boolean; finished?: boolean };
  /** the session's event log: what occurred during the case (the finish phase keeps it) */
  events?: { history(): readonly { event: LabEvent }[] };
  /** events the session's log holds now (patient events, the dose level, held case events) */
  activeEvents?: readonly LabEvent[];
  /**
   * Injected flags (pci-attending and pci-cx-recognition set them; tests inject them now). Each
   * overrides the matching workflow flag when given.
   */
  /** the case brief (pre-brief) is open: phase 'plan' */
  prebriefOpen?: boolean;
  /** the plan form is open: phase 'plan' */
  planOpen?: boolean;
  /** the sign-out or the debrief is open: phase 'finish' */
  finishing?: boolean;
  /**
   * The complications the learner has recognised (named): true for all, or the event names. Absent
   * means none: before recognition only cue events are raised for a complication.
   */
  recognised?: boolean | readonly LabEvent[];
  /** false while no guide has been put up to the aortic root yet: phase 'plan' (absent: it has) */
  guideIntroduced?: boolean;
  /** the bifurcation technique machine's technique and step, when one is active */
  technique?: { technique: BifTechnique; step?: number } | null;
  /** the active device as the input layer reports it; absent: derived from state.device */
  activeDevice?: ActiveDevice | null;
}

/**
 * One detectable event. `active` returns true while the event is present, or the procedure time
 * (state.t, s) of its last occurrence, in which case the event stays active for `holdS` seconds
 * after it (TRANSIENT_HOLD_S when not given); false, null or undefined while absent.
 */
export interface PciEventSource {
  event: LabEvent;
  active(snap: PciTipSnapshot): boolean | number | null | undefined;
  /** hold after the last occurrence, s (for sources that return a time) */
  holdS?: number;
  /** 'recognition': a complication, named only once the learner has recognised it (snap.recognised) */
  gate?: "recognition";
  /**
   * What the finish phase keeps: 'active' keeps the event while it is active; a function says whether
   * it occurred during the case (a complication, the dose, the contrast). Absent: dropped at finish.
   */
  finish?: "active" | ((snap: PciTipSnapshot) => boolean);
}

/** What an event source file exports (the glob reads these). */
export interface PciEventFile {
  PCI_EVENT_SOURCES?: readonly PciEventSource[];
}

/** Base sources first, then the feature files by path. */
function fileOrder(a: string, b: string): number {
  const ba = /\/base\.ts$/.test(a) ? 0 : 1;
  const bb = /\/base\.ts$/.test(b) ? 0 : 1;
  return ba - bb || (a < b ? -1 : a > b ? 1 : 0);
}

/** Collect the sources of the event source files (glob results: path to module). */
export function collectPciEventSources(files: Record<string, PciEventFile>): { sources: PciEventSource[]; problems: string[] } {
  const sources: PciEventSource[] = [];
  const problems: string[] = [];
  for (const path of Object.keys(files).sort(fileOrder)) {
    const list = files[path]?.PCI_EVENT_SOURCES;
    if (!Array.isArray(list)) {
      problems.push(`${path}: no PCI_EVENT_SOURCES export`);
      continue;
    }
    list.forEach((s, i) => {
      if (!s || typeof s.event !== "string" || typeof s.active !== "function") problems.push(`${path}: source ${i} needs an event and an active(snap) function`);
      else sources.push(s);
    });
  }
  return { sources, problems };
}

// every event source file here, not this index or the tests (namespace imports: a file without the
// export is reported, not a build error)
const FILES = import.meta.glob<PciEventFile>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });

const COLLECTED = collectPciEventSources(FILES);

/** Every PCI event source, base sources first. */
export const PCI_EVENT_SOURCES: readonly PciEventSource[] = COLLECTED.sources;

/** Files that export no sources, or a malformed source (pciTips.test.ts requires none). */
export const PCI_EVENT_SOURCE_PROBLEMS: readonly string[] = COLLECTED.problems;

// The PCI lab session's own raises (plan and finish, high-radiation-dose and the patient events), for
// the reachability report. A live re-export: nothing here reads it while the modules load.
export { raises } from "../../pci/PciLabSession";
