// Launch metadata for the delivery scenario pack (pci-device-delivery; engine-free: types only).
//
// Scenario ids, titles and starts match ./delivery.ts (the registry checks). Both scenarios are listed
// under the delivery, support and equipment-position lessons (pm-prep-and-stent-delivery,
// pm-prep-and-stent-support, pm-monitoring-position). The links follow lab-build-plan.json's
// lessonAndCaseLinks for this package: the guide extension lessons open the stuck stent at the moment of
// failure ({scenario: 'rca-stuck-stent', start: 'stent-stuck-bend2'}), the combined-support lesson opens
// the uncrossable lesion with the balloon at its edge ({scenario: 'rca-calcified-uncrossable', start:
// 'balloon-at-edge'}). The pm-prep-and-stent delivery lessons already list rca-calcified from the core
// pack's launch file.
import type { LaunchFile } from "../../../../content/schema";

const WIRE_ACROSS = { id: "wire-across", title: "Wire across the lesion" };

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [
    {
      id: "rca-stuck-stent",
      title: "Stuck stent: calcified, tortuous RCA",
      lessonIds: ["pm-prep-and-stent-delivery", "pm-prep-and-stent-support", "pm-monitoring-position"],
      starts: [{ id: "stent-stuck-bend2", title: "Stent stuck at the second bend" }, WIRE_ACROSS],
    },
    {
      id: "rca-calcified-uncrossable",
      title: "Balloon-uncrossable calcified mid-RCA",
      lessonIds: ["pm-prep-and-stent-delivery", "pm-prep-and-stent-support", "pm-monitoring-position"],
      starts: [{ id: "balloon-at-edge", title: "Balloon stopped at the lesion edge" }, WIRE_ACROSS],
    },
  ],
  links: [
    {
      scenario: "rca-stuck-stent",
      start: "stent-stuck-bend2",
      title: "Stuck stent at the second bend · guide extension",
      lessonIds: ["eq-sheaths-guides-extension-device", "eq-sheaths-guides-extension-use"],
    },
    {
      scenario: "rca-calcified-uncrossable",
      start: "balloon-at-edge",
      title: "Balloon stopped at the lesion edge · inchworming the extension",
      lessonIds: ["cp-uncrossable-extension-combined"],
    },
  ],
};
