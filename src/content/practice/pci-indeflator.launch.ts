// Engine-free practice links of pci-indeflator (found-launch-links): inflating on the indeflator over
// seconds (rate, pressure and hold), rupture, melon-seeding and the undilatable waist, and the
// stent-or-not decision after predilatation, listed under the lessons that teach them. Both open at the
// core pack's 'wire-across' start, with the wire across the lesion, ready for the first balloon:
//   - rca-calcified: choose and inflate a balloon in heavy calcium; a waist that persists at the rated
//     burst pressure after a hold, a rupture above the drawn burst pressure, the cutting-balloon rule, and
//     no stent while the waist persists (pm-prep-and-stent-balloon-choose, pm-prep-and-stent-balloon-inflate,
//     pm-prep-and-stent-when);
//   - lad-focal: predilate a focal mid-LAD lesion and decide whether to stent (pm-prep-and-stent-when),
//     with what the predilatation left (good result, slow flow, a flow-limiting dissection, a waist, a
//     small distal vessel) as the engine draws it (the same three lessons).
// The plan names the starts 'balloon-in-lesion' (rca-calcified) and 'post-predilatation' (lad-focal, its
// outcome drawn by seed: predilatationStart in src/simulation/pci/actions/inflation.ts); the core pack
// (owned by pci-scenario-registry) does not declare them and this file cannot add a start the lab cannot
// open, so both links use 'wire-across' until the pack adds them.
import type { LaunchFile } from "../schema";

const LESSONS = ["pm-prep-and-stent-balloon-choose", "pm-prep-and-stent-balloon-inflate", "pm-prep-and-stent-when"];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    {
      scenario: "rca-calcified",
      start: "wire-across",
      title: "Inflate on the indeflator in a calcified mid-RCA lesion, and do not stent over a waist",
      lessonIds: LESSONS,
    },
    {
      scenario: "lad-focal",
      start: "wire-across",
      title: "Predilate a focal mid-LAD lesion, then decide whether to stent",
      lessonIds: LESSONS,
    },
  ],
};
