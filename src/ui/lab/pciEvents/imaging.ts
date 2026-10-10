// ---------------------------------------------------------------------------
// The PCI lab's intravascular imaging event sources (pci-intravascular-imaging).
//
// The tip context already reports phase 'imaging' and the modality ('ivus' or
// 'oct') while an imaging catheter is on the wire (base.ts imagingOf: the
// catalogue's spec of the device). What this file adds is what the trainee
// finds on a run. After a run the trainee records an assessment in the imaging
// console (their own measurements and findings: src/simulation/pci/ivus.ts
// RunAssessment), and it raises
//   stent-underexpanded  their MSA below 80% of their mean reference, or not
//                        above the MSA target for the modality (or the left main)
//   dissection           they named an edge dissection on the run: naming it is
//                        the recognition, so it is raised without the
//                        recognition gate and keeps the optimise phase
//   thrombus             they named thrombus on the run
// each while it stands: until the next inflation or stent deployment (the
// finding then calls for a new run). Nothing here reads the truth of a run.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), with the phases and
// the modalities the imaging catheters give, so the reachability report reads
// what this file actually detects.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/pci/state";
import { assessedUnderexpanded, type RunAssessment } from "../../../simulation/pci/ivus";
import { CATALOGUE_IMAGING, raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** Telemetry kinds after which a finding no longer stands (the stent was dilated or another deployed). */
const RESETS = new Set(["inflate", "deploy"]);

/** The trainee's latest assessment that still stands (no inflation or deployment logged after it), or null. */
export function standingAssessment(st: PciState): RunAssessment | null {
  const list = st.ivus?.assessments ?? [];
  if (!list.length) return null;
  for (let i = st.log.length - 1; i >= 0; i--) {
    const k = st.log[i].kind;
    if (k === "imaging-assessment") return list[list.length - 1];
    if (RESETS.has(k)) return null;
  }
  return null;
}

/** The left main thresholds apply: the case is a left main lesion or the target is in the left main. */
export function leftMainCase(snap: Pick<PciTipSnapshot, "lesion" | "start" | "caseEvents" | "definition">): boolean {
  if (snap.lesion.vessel === "LM") return true;
  const ev = [...(snap.start?.events ?? []), ...(snap.caseEvents ?? []), ...(snap.definition?.events ?? [])];
  return ev.includes("left-main-lesion") || !!snap.definition?.lesions?.some((l) => l.vessel === "LM" && l.role === "target");
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  {
    event: "stent-underexpanded",
    active: (snap) => {
      const a = standingAssessment(snap.state);
      return !!a && snap.state.stents.length > 0 && assessedUnderexpanded({ ...a, leftMain: a.leftMain ?? leftMainCase(snap) });
    },
  },
  {
    event: "dissection",
    active: (snap) => {
      const a = standingAssessment(snap.state);
      return !!a?.edgeDissection;
    },
  },
  {
    event: "thrombus",
    active: (snap) => !!standingAssessment(snap.state)?.thrombus,
  },
];

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["imaging", "optimise"], imaging: CATALOGUE_IMAGING });
