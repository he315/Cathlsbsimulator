// ---------------------------------------------------------------------------
// Antithrombotic pack (pci-antithrombotic-orders).
//
// This pack adds no scenario of its own: it declares two variants of the core
// pack's lad-focal (the links and the variants are in the engine-free sibling
// antithrombotic.launch.ts) and the facts each variant changes, which the
// drugs console (src/ui/pci/consoles/DrugsConsole.tsx) and the drug actions
// (src/simulation/pci/actions/drugs.ts declareAntithrombotic) read by the
// run's variant id (resolveScenario turns a non-ladder variant into the
// run's seed, so session.resolved.seed names it):
//
//  - hemochron: the lab's ACT machine is a Hemochron, so the heparin-alone goal
//    is 300-350 s (Brilakis 2.8 and 3.4, lesson pm-antithrombotics-heparin,
//    src/content/manual/pci-manual/03-antithrombotics.ts:119). The patient is
//    heparinised to the lower PCI dose before the case as in every lad-focal
//    run; each ACT is read against the Hemochron goal (a value of 250-300 s is
//    low here: the lesson's check question at line 134), and the recheck clock
//    runs from the last ACT.
//  - hit-bivalirudin: suspected type 2 HIT. The pre-case chart shows the
//    platelet trend of the lesson's case (230 x 10^9/L on admission, 98 on day
//    7 of heparin: case pm-antithrombotics-case-hit, 03-antithrombotics.ts:1627
//    and 1634); the learner scores the 4Ts and orders the antibody test (ASH
//    2018, line 412), switches the flushes to heparin-free saline (line 417)
//    and anticoagulates with renally dosed bivalirudin. Any heparin, including
//    a heparinised flush, is a critical error. The ACT goal is the heparin one
//    (line 321) on a Hemochron.
//
// Engine-free: types only, as every pack.
// ---------------------------------------------------------------------------

import type { PciScenarioDef } from "../types";
import type { ActDevice } from "../../lesionAssessment";

/** One platelet count on the pre-case chart. */
export interface PlateletReading {
  /** day of heparin treatment (0: admission) */
  day: number;
  /** ×10⁹/L */
  count: number;
}

/** What an antithrombotic variant of a scenario changes. */
export interface AntithromboticVariant {
  id: string;
  /** the scenario it varies */
  scenario: string;
  title: string;
  /** the lab's point-of-care ACT machine */
  actDevice: ActDevice;
  /** suspected type 2 HIT: no heparin from any source */
  hit: boolean;
  /**
   * The patient should arrive without heparin in the lab (the HIT case). The PCI lab session
   * heparinises every lad-focal run today; honouring this is the session's (reported as out of scope).
   */
  heparinFree: boolean;
  /** the pre-case chart (HIT variant) */
  chart?: { platelets: PlateletReading[]; heparinSince: string; note: string; source: string };
  /** what the variant adds to the brief */
  brief: string;
}

export const ANTITHROMBOTIC_VARIANTS: Readonly<Record<string, AntithromboticVariant>> = {
  hemochron: {
    id: "hemochron",
    scenario: "lad-focal",
    title: "Hemochron ACT machine",
    actDevice: "hemochron",
    hit: false,
    heparinFree: false,
    brief: "The lab's ACT machine reads higher than the one in the next room. Heparin has been given; check the ACT before any device leaves the guide and keep it checked.",
  },
  "hit-bivalirudin": {
    id: "hit-bivalirudin",
    scenario: "lad-focal",
    title: "Falling platelet count on heparin",
    actDevice: "hemochron",
    hit: true,
    heparinFree: true,
    chart: {
      platelets: [
        { day: 0, count: 230 },
        { day: 7, count: 98 },
      ],
      heparinSince: "admission",
      note: "Heparin infusion since admission; angiography delayed by a chest infection.",
      source: "case pm-antithrombotics-case-hit (pci-manual/03-antithrombotics.ts:1627 and 1634)",
    },
    brief: "The platelet count has fallen during heparin treatment since admission. Review the chart before anything is given.",
  },
};

/** The antithrombotic variant a run was opened at (its variant id), or null. */
export function antithromboticVariant(id: string | null | undefined): AntithromboticVariant | null {
  return (id && Object.prototype.hasOwnProperty.call(ANTITHROMBOTIC_VARIANTS, id) ? ANTITHROMBOTIC_VARIANTS[id] : null) ?? null;
}

/** No scenario of its own: the variants are lad-focal's. */
export const scenarios: PciScenarioDef[] = [];
