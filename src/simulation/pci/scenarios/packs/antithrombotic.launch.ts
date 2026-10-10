// Launch metadata for the antithrombotic pack (pci-antithrombotic-orders; engine-free: types only).
//
// The pack declares no scenario of its own. It adds two variants to the core pack's lad-focal and
// lists them under the antithrombotic lessons, following lab-build-plan.json's lessonAndCaseLinks
// for this package: {scenario: 'lad-focal', variant: 'hemochron'} under the heparin and IV
// antiplatelet lessons (the ACT goal changes with the machine and when an IV agent is started), and
// {scenario: 'lad-focal', variant: 'hit-bivalirudin'} under the alternatives lesson (suspected HIT).
// The variant ids and titles match ANTITHROMBOTIC_VARIANTS in ./antithrombotic.ts.
import type { LaunchFile } from "../../../../content/schema";

const HEMOCHRON = { id: "hemochron", title: "Hemochron ACT machine" };
const HIT = { id: "hit-bivalirudin", title: "Falling platelet count on heparin" };

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [],
  links: [
    {
      scenario: "lad-focal",
      variant: "hemochron",
      title: "Focal mid-LAD stenosis · ACT targets on a Hemochron",
      lessonIds: ["pm-antithrombotics-heparin", "pm-antithrombotics-iv"],
      adds: { variants: [HEMOCHRON, HIT] },
    },
    {
      scenario: "lad-focal",
      variant: "hit-bivalirudin",
      title: "Focal mid-LAD stenosis · suspected HIT, bivalirudin",
      lessonIds: ["pm-antithrombotics-alternatives"],
    },
  ],
};
