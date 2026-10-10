// Launch metadata for the LAAO device-mechanics presets (structural-laao-device-mechanics).
// Engine-free: types only. The ids match LAAO_PRESET_IDS in src/simulation/laao.ts, whose
// LAAO_SCENARIOS holds the presets with the core cases, so StructuralLab resolves a launch of any of
// them to the LAAO procedure; src/ui/lab/structuralTips.laao.test.ts checks both ways.
//
// Each preset is a full LAAO case that opens at its TOE measurements (the step a later stage needs
// the earlier stages' choices from), except the follow-up drill, which opens at the 6–12 week visit
// with its device already released. Every preset practises both LAAO lessons: planning (filling,
// the modality offsets, the puncture from the CT) and the implant (the two families' movements,
// release criteria, recapture and follow-up). The reverse chicken-wing preset is the patient of the
// module's reverse-wing case. The titles describe the patient, not the error the drill holds.
import type { LaunchFile, LaunchStart } from "../../../schema";

const LAAO_LESSONS = ["hb-mitral-tricuspid-laa-laao-implant", "hb-mitral-tricuspid-laa-laao-plan"];
const FROM_MEASURE: LaunchStart[] = [{ id: "measure", title: "From the TOE measurements" }];
const AT_FOLLOWUP: LaunchStart[] = [{ id: "followup", title: "At the follow-up visit" }];

export const launch: LaunchFile = {
  sim: "laao",
  scenarios: [
    { id: "laao-plug", title: "Large windsock for a plug occluder", lessonIds: [...LAAO_LESSONS], starts: FROM_MEASURE },
    { id: "laao-lobe-disc", title: "Short neck for a lobe-and-disc occluder", lessonIds: [...LAAO_LESSONS], starts: FROM_MEASURE },
    { id: "laao-underfilled", title: "Fasted patient under general anaesthesia", lessonIds: [...LAAO_LESSONS], starts: FROM_MEASURE },
    {
      id: "laao-reverse-chicken-wing",
      title: "Recurrent bleeding, a reverse chicken-wing",
      lessonIds: [...LAAO_LESSONS],
      caseIds: ["hb-mitral-tricuspid-laa-case-laao-reverse-wing"],
      starts: FROM_MEASURE,
    },
    { id: "laao-drt-followup", title: "Eight-week imaging after a plug occluder", lessonIds: [...LAAO_LESSONS], starts: AT_FOLLOWUP },
  ],
};
