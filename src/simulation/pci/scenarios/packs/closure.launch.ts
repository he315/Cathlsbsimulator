// Launch metadata for the flow and closure pack (pci-flow-closure; engine-free: types only).
//
// The scenario's id, title and starts match ./closure.ts (the registry checks). The links follow
// lab-build-plan.json's lessonAndCaseLinks for this package. The plan names starts on the core pack's
// cases ({scenario:'lcx-stemi', start:'no-reflow'}, {scenario:'rca-calcified', start:'air-rca'},
// {scenario:'lad-focal', start:'closure-timi0'}); the core pack (owned by pci-scenario-registry) does not
// declare them and this file cannot add a start the lab cannot open, so they are variants that this file
// adds, opened at the core pack's 'wire-across' start, as pci-patient-coupling does for its drills. The
// lab turns each into its state with src/simulation/pci/actions/bailouts.ts applyFlowStart. The plan's
// {scenario:'rca-ostial', start:'sinus-stain'} is this pack's own rca-aortocoronary at 'sinus-stain' (see
// closure.ts); svg-degenerated belongs to pci-graft, which links it when it lands. The closure variant
// draws its mechanism from the run's seed; the closure-<mechanism> variants open each one for practice.
import type { LaunchFile, LaunchVariant } from "../../../../content/schema";

const WIRE_ACROSS = "wire-across";

const LCX_VARIANTS: LaunchVariant[] = [
  { id: "no-reflow", title: "no-reflow after stenting the thrombotic circumflex" },
  { id: "no-reflow-refractory", title: "refractory no-reflow after stenting" },
  { id: "air-lcx", title: "air in the circumflex after stenting" },
];
const RCA_VARIANTS: LaunchVariant[] = [
  { id: "air-rca", title: "air in the RCA" },
  { id: "plaque-embolisation", title: "slow flow after high-pressure dilatation of calcified plaque" },
  { id: "wire-spasm", title: "new narrowings with a stiff wire" },
];
const LAD_VARIANTS: LaunchVariant[] = [
  { id: "closure-timi0", title: "abrupt closure with a hidden cause" },
  { id: "closure-dissection", title: "abrupt closure: dissection" },
  { id: "closure-plaque", title: "abrupt closure: plaque embolisation" },
  { id: "closure-thrombus", title: "abrupt closure: thrombosis" },
  { id: "closure-spasm", title: "abrupt closure: spasm" },
  { id: "flow-states", title: "flow states to grade" },
  { id: "dissection-rescue", title: "dissection with a re-crossed wire" },
  { id: "air-lad", title: "air in the LAD" },
];

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [
    {
      id: "rca-aortocoronary",
      title: "Proximal RCA stenosis through an Amplatz guide",
      lessonIds: ["cm-principles-closure-aortocoronary"],
      starts: [
        { id: "sinus-stain", title: "Contrast staining the right sinus after a forceful injection" },
        { id: "guide-in-root", title: "Guide in the aortic root" },
        { id: "guide-engaged", title: "Guide engaged" },
        { id: "wire-across", title: "Wire across the lesion" },
      ],
    },
  ],
  links: [
    {
      scenario: "lcx-stemi",
      start: WIRE_ACROSS,
      variant: "no-reflow",
      title: "No-reflow after stenting the occluded circumflex: deliver the vasodilator distally",
      lessonIds: ["cm-flow-embolism-noreflow", "cm-flow-embolism-plaque-thrombus", "pm-lab-drugs-microvascular", "pm-interpreting-flow"],
      adds: { variants: LCX_VARIANTS },
    },
    {
      scenario: "lcx-stemi",
      start: WIRE_ACROSS,
      variant: "no-reflow-refractory",
      title: "Refractory no-reflow after two distal vasodilator doses (wire across)",
      lessonIds: ["cm-flow-embolism-noreflow"],
    },
    {
      scenario: "lcx-stemi",
      start: WIRE_ACROSS,
      variant: "air-lcx",
      title: "Air in the circumflex after the stent balloon was withdrawn without aspirating the guide",
      lessonIds: ["cm-flow-embolism-air"],
    },
    {
      scenario: "rca-calcified",
      start: WIRE_ACROSS,
      variant: "air-rca",
      title: "Air in the RCA after a balloon was withdrawn without aspirating the guide",
      lessonIds: ["cm-flow-embolism-air"],
      adds: { variants: RCA_VARIANTS },
    },
    {
      scenario: "rca-calcified",
      start: WIRE_ACROSS,
      variant: "plaque-embolisation",
      title: "Slow flow after high-pressure dilatation of calcified plaque: aspirate, do not stent over it",
      lessonIds: ["cm-flow-embolism-plaque-thrombus", "cm-flow-embolism-noreflow"],
    },
    {
      scenario: "rca-calcified",
      start: WIRE_ACROSS,
      variant: "wire-spasm",
      title: "New narrowings with a stiff wire in the RCA: nitrate, image, then the equipment",
      lessonIds: ["pm-interpreting-pitfalls", "pm-interpreting-spasm", "pm-lab-drugs-nitrates"],
    },
    {
      scenario: "lad-focal",
      start: WIRE_ACROSS,
      variant: "closure-timi0",
      mode: "supervised",
      title: "Abrupt closure after predilatation of a mid-LAD lesion: find the cause, then treat it",
      lessonIds: ["cm-principles-closure-acute", "cm-flow-embolism-plaque-thrombus"],
      adds: { variants: LAD_VARIANTS },
    },
    {
      scenario: "lad-focal",
      start: WIRE_ACROSS,
      variant: "flow-states",
      title: "Grade the flow after balloon angioplasty of a mid-LAD lesion",
      lessonIds: ["pm-interpreting-flow", "pm-interpreting-morphology", "cm-flow-embolism-noreflow"],
    },
    {
      scenario: "lad-focal",
      start: WIRE_ACROSS,
      variant: "dissection-rescue",
      title: "A dissection with a re-crossed wire: confirm the true lumen before the stent",
      lessonIds: ["cm-principles-closure-dissection"],
    },
    {
      scenario: "lad-focal",
      start: WIRE_ACROSS,
      variant: "air-lad",
      title: "Air in the LAD after trapping without back-bleeding the guide",
      lessonIds: ["cm-flow-embolism-air"],
    },
  ],
};
