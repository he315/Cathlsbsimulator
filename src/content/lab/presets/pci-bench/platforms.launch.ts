// Launch metadata for the IVUS and OCT bench's platform, sizing and positioning presets
// (pci-bench-stent-platforms-sizing). Engine-free: types only. The scenario ids are the ids of PLATFORM_LESIONS
// (src/simulation/bench/platforms.ts), which BENCH_BY_ID holds beside the picker's and the measuring presets;
// src/ui/lab/benchTips.platforms.test.ts checks both ways.
//
// The params are those of core.launch.ts (scenario, start, modality, mode). Each preset opens at the first
// pullback; taper-lad, whose predilatation is already recorded, and the ostial positioning presets also open
// at the stent step with IVUS already run. Every preset practises choosing, positioning and deploying a stent
// (pm-prep-and-stent-deploy); the others are listed where the preset practises that lesson's skill.
//
// The titles do not give the answer away: each names the vessel and what the angiogram shows.
import type { LaunchFile, LaunchStart } from "../../../schema";

const FROM_IMAGE: LaunchStart = { id: "image", title: "From the first pullback" };
const AT_STENT: LaunchStart = { id: "stent", title: "Imaging done: choose and place the stent" };
const DEPLOY = "pm-prep-and-stent-deploy";
const STENT_BUILD = "eq-balloons-stents-cart-stent-build";
const VESSEL_SIZE = "cp-other-complex-vessel-size";

export const launch: LaunchFile = {
  sim: "pci-bench",
  scenarios: [
    {
      id: "taper-lad",
      title: "Tapering LAD after a long predilatation",
      lessonIds: [DEPLOY, STENT_BUILD],
      starts: [AT_STENT, FROM_IMAGE],
    },
    {
      id: "lm-lad-crossover",
      title: "Distal left main into the proximal LAD",
      lessonIds: [DEPLOY, "cp-left-main-technique", "cp-left-main-distal", STENT_BUILD],
      starts: [FROM_IMAGE],
    },
    {
      id: "small-distal-225",
      title: "Distal LAD that looks small",
      lessonIds: [DEPLOY, VESSEL_SIZE],
      starts: [FROM_IMAGE],
    },
    {
      id: "ectatic-rca",
      title: "Ectatic proximal RCA, mid-vessel stenosis",
      lessonIds: [DEPLOY, VESSEL_SIZE, STENT_BUILD],
      starts: [FROM_IMAGE],
    },
    {
      id: "ostial-rca-short",
      title: "Narrowed RCA ostium",
      lessonIds: [DEPLOY, "cp-ostial-stent", "cp-ostial-troubleshoot", "cp-ostial-assess"],
      starts: [AT_STENT, FROM_IMAGE],
    },
    {
      id: "ostial-overhang",
      title: "Narrowed RCA ostium, unstable guide",
      lessonIds: [DEPLOY, "cp-ostial-stent", "cp-ostial-troubleshoot"],
      starts: [AT_STENT, FROM_IMAGE],
    },
    {
      id: "ostial-fibrotic",
      title: "Calcified RCA ostium",
      lessonIds: [DEPLOY, "cp-ostial-prep", "cp-ostial-troubleshoot"],
      starts: [FROM_IMAGE],
    },
    {
      id: "ostial-recoil",
      title: "Narrowed left main ostium",
      lessonIds: [DEPLOY, "cp-ostial-troubleshoot", "cp-left-main-technique"],
      starts: [FROM_IMAGE],
    },
  ],
};
