// Launch metadata for the haemodynamics lab's right heart passage presets (haemo-rhc-manoeuvre).
// Engine-free: types only. The presets are starts this file adds to the 'normal' scenario that
// core.launch.ts declares, so the lab opens them through its usual launch; the right heart catheter
// controls (src/ui/haemo/CatheterPanel.tsx) read the start as a preset of the torque-directed catheter
// (RHC_PRESETS in src/simulation/rightHeartCatheter.ts, whose tests check both ways). Every preset is
// the femoral route with a multipurpose catheter, and is listed under the lessons that teach the
// passage, its arrhythmias and its knot. The titles say where the study starts, not what will happen.
import type { LaunchFile, LaunchLinkEntry } from "../../../schema";

const LESSONS = ["hb-cardiac-catheterisation-rhc", "hb-background-silhouette", "hb-background-general"];

const preset = (start: string, title: string): LaunchLinkEntry => ({
  scenario: "normal",
  start,
  title,
  mode: "guided",
  lessonIds: LESSONS,
  adds: { starts: [{ id: start, title }] },
});

export const launch: LaunchFile = {
  sim: "haemo",
  links: [
    preset("rhc-femoral-mp", "Right heart study from the femoral vein: multipurpose catheter"),
    preset("rhc-knot-risk", "Right heart study: a long passage, catheter in the RV"),
    preset("rhc-af", "Right heart study: catheter in the right atrium"),
    preset("rhc-rvot-irritable", "Right heart study: catheter in the outflow tract"),
  ],
};
