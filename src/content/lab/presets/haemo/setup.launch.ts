// Launch metadata for the haemodynamics lab's transducer set-up presets (haemo-transducer-and-setup).
// Engine-free: types only. The presets are starts this file adds to two scenarios that
// core.launch.ts declares ('normal' and 'pah'), so the lab opens them through its usual launch
// (initialStudy reads the start as a set-up preset: SETUP_PRESETS in src/simulation/haemoStudy.ts,
// whose test checks both ways). Each is listed under the two lessons that teach the set-up. The
// titles say what to do, not what is wrong.
import type { LaunchFile, LaunchLinkEntry } from "../../../schema";

const LESSONS = ["pm-monitoring-transducers", "hb-cardiac-catheterisation-setup"];

const preset = (scenario: string, start: string, title: string): LaunchLinkEntry => ({
  scenario,
  start,
  title,
  mode: "guided",
  lessonIds: LESSONS,
  adds: { starts: [{ id: start, title }] },
});

export const launch: LaunchFile = {
  sim: "haemo",
  links: [
    preset("pah", "setup-v4-level", "Transducer set-up: a study set up by a colleague"),
    preset("normal", "setup-table-move", "Transducer set-up: level, zero and keep the landmark"),
    preset("normal", "setup-overdamped-air", "Transducer set-up: test the line before you trust a number"),
    preset("normal", "setup-underdamped-long-line", "Transducer set-up: a new extension line"),
    preset("normal", "setup-hidden-bubble", "Transducer set-up: a manifold prepared by an assistant"),
  ],
};
