// Launch metadata for the full case's retroperitoneal bleed scenarios (access-cx-bleeding-retroperitoneal;
// engine-free: types only). The ids, titles and lessons are those of scenarios/bleeding.ts. The on-table cases
// open at 'closure' (the sheath in, the catheter out), the recovery cases at 'recovery'. Every case is listed
// under the bleeding lesson; those that walk through the femoral algorithm (the bladder, the other groin, the
// route from recovery) also under the femoral bleeding lesson, and the cangrelor case under the IV
// antiplatelet lesson and the module's own case study. The titles do not name the bleed. No mode is set: the
// learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const ACCESS = "cm-access-complications-femoral-bleeding";
const BLEED = "cm-patient-complications-bleeding";
const IV = "pm-antithrombotics-iv";
const RP_CASE = "cm-access-complications-case-retroperitoneal";
const ON_TABLE = [{ id: "closure", title: "On the table, sheath in" }];
const IN_RECOVERY = [{ id: "recovery", title: "In recovery" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "rp-on-table", title: "Back pain and a falling pressure on the table", lessonIds: [ACCESS, BLEED], starts: ON_TABLE },
    { id: "rp-no-bleed-found", title: "A falling pressure on the table (2)", lessonIds: [ACCESS, BLEED], starts: ON_TABLE },
    { id: "rp-cangrelor", title: "A falling pressure at the end of a PCI", lessonIds: [ACCESS, BLEED, IV], caseIds: [RP_CASE], starts: ON_TABLE },
    { id: "rp-recovery-unstable", title: "Recovery: back pain and a slow pulse", lessonIds: [ACCESS, BLEED], starts: IN_RECOVERY },
    { id: "rp-recovery-stable", title: "Recovery: a backache after a femoral case", lessonIds: [ACCESS, BLEED], starts: IN_RECOVERY },
    { id: "rp-ticagrelor", title: "Recovery after PCI: a falling pressure", lessonIds: [BLEED], starts: IN_RECOVERY },
    { id: "rp-doac-dabigatran", title: "Recovery: a falling pressure in a patient on an anticoagulant (1)", lessonIds: [BLEED], starts: IN_RECOVERY },
    { id: "rp-doac-apixaban", title: "Recovery: a falling pressure in a patient on an anticoagulant (2)", lessonIds: [BLEED], starts: IN_RECOVERY },
  ],
};
