// Launch metadata for the temporary pacing tab of the bedside lab (pacing-in-lab-scenarios-and-tips).
// Engine-free: types only. The scenario and variant ids are PACING_SCENARIOS' and PACING_VARIANTS'
// (src/simulation/pacing.ts); src/ui/lab/pacingTips.scenario.test.ts checks both ways.
//
// The three in-lab bradycardia scenarios are practice twins of their held-out "exam" variants, which
// the practice index never lists and no lesson or case links (exam integrity, HANDOVER 6.4); the
// lab always runs a held-out variant in exam mode. The adenosine scenario also has the practice pair
// "persistent" (as written: the block does not resolve after a cough) and "transient" (the usual
// course). The titles do not give the diagnosis or the answer away.
import type { LaunchFile } from "../../../schema";

const PACE = "hb-additional-procedures-pacing";
// the Academy's bedside pacing lessons (src/content/tracks/procedures-career.ts)
const ACAD_IND = "bed-pacing-indications";
const ACAD_INS = "bed-pacing-insertion";
const ACAD_SET = "bed-pacing-settings";

const EXAM = { id: "exam", title: "Exam version", heldOut: true } as const;

export const launch: LaunchFile = {
  sim: "pacing",
  scenarios: [
    { id: "inlab-rca-chb-rbbb", title: "Slow rhythm after a right coronary injection", lessonIds: [PACE], variants: [EXAM] },
    {
      id: "inlab-adenosine-avb",
      title: "Slow rhythm after intracoronary adenosine",
      lessonIds: [PACE],
      variants: [
        { id: "persistent", title: "Block that persists" },
        { id: "transient", title: "Block that recovers" },
        EXAM,
      ],
    },
    { id: "inlab-amiodarone-avb", title: "Slow rhythm during an amiodarone infusion", lessonIds: [PACE], variants: [EXAM] },
    { id: "inferior-chb", title: "Inferior STEMI with a slow rhythm", lessonIds: [PACE, ACAD_IND, ACAD_INS, ACAD_SET] },
    { id: "tavi-chb", title: "A slow rhythm after TAVI", lessonIds: [PACE, ACAD_IND, ACAD_SET] },
    { id: "sinus-arrest", title: "Pauses and syncope on the ward", lessonIds: [PACE, ACAD_IND, ACAD_SET] },
    { id: "epicardial", title: "Epicardial wires after cardiac surgery", lessonIds: [PACE, ACAD_SET] },
  ],
  links: [
    {
      scenario: "inlab-adenosine-avb",
      variant: "transient",
      title: "Slow rhythm after intracoronary adenosine: the usual course",
      lessonIds: [PACE],
    },
  ],
};
