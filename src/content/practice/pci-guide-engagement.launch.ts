// Engine-free practice links of pci-guide-engagement (found-launch-links): guide choice, engagement by hand
// from the aortic root, seating and the guide's effect on the wire, listed under the lessons that teach
// them. Both open at the core pack's 'guide-in-root' start, where the guide waits in the aortic root:
//   - lad-focal: engage an extra-backup or Judkins left guide by hand, seat it 2-3 mm and coaxial, see the
//     trace damp when it is pushed deep, and see a large curve send the wire into the circumflex until
//     the guide is re-seated (pm-wiring-guide-choice, pm-wiring-guide-seat, pm-wiring-tortuosity);
//   - rca-calcified: engage a Judkins right or an Amplatz, keep it off the conus, and exchange it for a
//     more supportive guide over an exchange-length wire (pm-wiring-guide-choice, pm-wiring-guide-seat,
//     pm-wiring-tortuosity, pm-engaging-exchange, pm-engaging-fail).
// The plan names a 'guide-wont-seat' start for the exchange link; the core pack (owned by
// pci-scenario-registry) does not declare it and this file cannot add a start the lab cannot open, so the
// exchange is practised from 'guide-in-root' until the pack adds it.
import type { LaunchFile } from "../schema";

const GUIDE_LESSONS = ["pm-wiring-guide-choice", "pm-wiring-guide-seat", "pm-wiring-tortuosity"];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    { scenario: "lad-focal", start: "guide-in-root", title: "Choose, engage and seat the guide for a mid-LAD lesion", lessonIds: GUIDE_LESSONS },
    {
      scenario: "rca-calcified",
      start: "guide-in-root",
      title: "Engage the right coronary and exchange for a supportive guide over the wire",
      lessonIds: [...GUIDE_LESSONS, "pm-engaging-exchange", "pm-engaging-fail"],
    },
  ],
};
