// Launch metadata for the haemodynamics lab's aortic valve studies (haemo-aortic-stenosis-studies).
// Engine-free: types only. The scenario ids match HAEMO_SCENARIOS in src/simulation/haemo.ts
// (avCrossing.test.ts checks both ways). Two crossing decisions (concordant echo: do not cross;
// inconclusive echo: cross well) and the three dobutamine responses of classical low-flow
// low-gradient stenosis. The titles are the scenarios' own, written so that the practice list does
// not give the answer away.
import type { LaunchFile } from "../../../schema";

export const launch: LaunchFile = {
  sim: "haemo",
  scenarios: [
    {
      id: "as-concordant-echo",
      title: "Breathless on exertion, referred for angiography before valve surgery",
      lessonIds: ["hb-specific-conditions-as", "hb-cardiac-catheterisation-lhc"],
    },
    {
      id: "as-discordant-cross",
      title: "Exertional presyncope, echo windows poor",
      lessonIds: ["hb-specific-conditions-as", "hb-cardiac-catheterisation-lhc"],
    },
    {
      id: "lflg-true",
      title: "Breathless with a weak ventricle and a calcified aortic valve",
      lessonIds: ["hb-specific-conditions-as", "hd-valves-as-area"],
    },
    {
      id: "lflg-pseudo",
      title: "Heart failure clinic referral with a narrowed aortic valve on echo",
      lessonIds: ["hb-specific-conditions-as", "hd-valves-as-area"],
    },
    {
      id: "lflg-no-reserve",
      title: "Breathless and hypotensive with a poor ventricle and a calcified valve",
      lessonIds: ["hb-specific-conditions-as", "hd-valves-as-area"],
    },
  ],
};
