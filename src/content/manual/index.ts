// ===========================================================================
// The manual curriculum: every topic of the two core manuals (Brilakis,
// Manual of PCI; the Oxford Specialist Handbook of Cardiac Catheterization and
// Coronary Intervention), taught step by step in original words, with videos
// from the Brilakis and Elias Hanna channels as further study.
//
// One file per module under ./<track-id>/NN-<module-id>.ts, collected here in
// filename order. A module file exports `module` (lessons, quiz), and may export
// `cases` (branching cases for that module), `tips` (lab technique tips,
// src/content/lab/tips.ts) and `refs` (new references, collected into
// src/content/refs.ts). Authors never edit this file or each other's files.
// ===========================================================================

import type { CaseStudy, Module, Reference, Track, TrackId } from "../schema";
import type { LabTip } from "../lab/tips";

export interface ModuleFile {
  module: Module;
  cases?: CaseStudy[];
  tips?: LabTip[];
  /**
   * New references this module cites that are not yet in src/content/refs.ts. `verified: true`
   * only after the citation was checked against PubMed or the publisher (put the PMID or DOI in
   * `note`). Ids must be unique across the whole registry (content.test.ts checks).
   */
  refs?: Reference[];
}

const FILES = import.meta.glob<ModuleFile>(["./*/*.ts", "!./**/*.test.ts"], { eager: true });

type ManualTrackId = Extract<TrackId, "pci-manual" | "complex-pci" | "complication-management" | "equipment" | "cath-handbook">;

const META: Record<ManualTrackId, Omit<Track, "modules" | "cases">> = {
  "pci-manual": {
    id: "pci-manual",
    order: 10,
    title: "PCI step by step",
    tagline: "Every PCI, from the plan to the closure, one step at a time",
    description:
      "The sequence every coronary intervention follows: planning, monitoring, medications, access, engagement, angiography, choosing the target, wiring, lesion preparation, stenting, closure, physiology, imaging and haemodynamic support. Each step is taught as you would do it, practised in the labs, and checked as you go.",
    stage: 3,
  },
  "complex-pci": {
    id: "complex-pci",
    order: 11,
    title: "Complex lesions and patients",
    tagline: "Ostial, bifurcation, left main, grafts, calcium, thrombus, CTO and the patients who make PCI harder",
    description:
      "How the standard steps change for each complex lesion subset and complex patient group, with the algorithms, the equipment choices and the bail-outs that go with them.",
    stage: 4,
  },
  "complication-management": {
    id: "complication-management",
    order: 12,
    title: "Complications: prevent, recognise, treat",
    tagline: "Acute closure, perforation, lost equipment, hypotension, radiation, kidneys and access",
    description:
      "Each complication taught the same way: why it happens, how to prevent it, the first signs, and the stepwise bail-out, rehearsed in cases and in the lab.",
    stage: 4,
  },
  equipment: {
    id: "equipment",
    order: 13,
    title: "The equipment",
    tagline: "Sheaths to embolic protection: what each device class does and when to reach for it",
    description:
      "The kit of the catheter laboratory, class by class: how each kind of device is built, how it behaves, and how to choose between them for the job in front of you.",
    stage: 3,
  },
  "cath-handbook": {
    id: "cath-handbook",
    order: 14,
    title: "The catheter laboratory handbook",
    tagline: "The team, access, cardiac catheterisation, specific conditions, grafts, other procedures and aftercare",
    description:
      "The practical handbook of the cath lab: who does what, how to get in and out safely, how to run a right and left heart study, how specific conditions change the procedure, graft angiography, the other procedures done in the lab, and the care that follows.",
    stage: 2,
  },
};

function collect(trackId: ManualTrackId): ModuleFile[] {
  return Object.keys(FILES)
    .filter((k) => k.startsWith(`./${trackId}/`))
    .sort()
    .map((k) => FILES[k]);
}

export const MANUAL_TRACKS: Track[] = (Object.keys(META) as ManualTrackId[])
  .map((id) => {
    const files = collect(id);
    return { ...META[id], modules: files.map((f) => f.module), cases: files.flatMap((f) => f.cases ?? []) };
  })
  .filter((t) => t.modules.length > 0);

export const MANUAL_TIPS: LabTip[] = Object.keys(FILES)
  .sort()
  .flatMap((k) => FILES[k].tips ?? []);

export const MANUAL_REFS: Reference[] = Object.keys(FILES)
  .sort()
  .flatMap((k) => FILES[k].refs ?? []);
