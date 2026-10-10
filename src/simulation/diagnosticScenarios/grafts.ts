// ---------------------------------------------------------------------------
// Post-CABG scenarios (diag-grafts-svg): vein grafts in the shared coronary
// tree, found from the operation note and imaged.
//
// The grafts are drawn by the render tree (src/render/xray/coronaryTree.ts
// CoronaryTree.grafts), filled by the transport (contrastTransport.ts
// graftTransportNet: the graft as a source into the native bed beyond its
// anastomosis; graftCompetition: washout and back-filling on a native run)
// and entered by the rod mechanics as lumens of their own
// (src/physics/coronaryLumens.ts). Their aortic ostia follow the module's
// usual order on the anterior ascending aorta (src/simulation/anatomy.ts
// GRAFT_OSTIUM). The chart's operation note is written from the grafts
// (operationNoteFor), so the note and the anatomy cannot disagree.
//
// Chart values (age, size, renal function, echo, drugs), lesion values and
// graft targets are scenario data, not sourced facts. The lab requests each
// scenario answers are named above it. diag-graft-search, the first post-CABG
// case, lives in core.ts (diag-scenario-registry).
//
// Only diag-graft-roadmap-aortogram, whose premise is a graft that cannot be
// found, raises graft-not-found from its script: when the learner is still
// searching the ascending aorta long into the case. That is a stand-in, within
// the script's conditions (lab time and the store's engagement), for the
// per-graft search rule (anatomy.ts GraftSearch: attempts at, and time near,
// a listed graft's level). The rule takes no account of grafts already found,
// so the other cases, where finding the grafts is not the problem, do not use
// it. A session module that steps GraftSearch with the rod tip for every graft
// case (and so makes diag-graft-search raise graft-not-found live) is open
// work outside this package (the module registry is not its file).
//
// These cases need the rod mechanics: only the rod's lumens include the
// grafts, so in the analytic engagement model (physics off) a graft cannot be
// engaged or injected selectively. Engagement targets and fill lists for the
// grafts in the analytic model are open work outside this package
// (src/simulation/engagement.ts, src/simulation/contrast.ts).
// ---------------------------------------------------------------------------

import type { Graft, VesselId } from "../../types";
import type { DiagScenario, ScenarioTrigger } from "./index";

const VESSEL: Partial<Record<VesselId, string>> = {
  LAD: "left anterior descending artery",
  D1: "first diagonal",
  D2: "second diagonal",
  LCx: "circumflex",
  OM1: "first obtuse marginal",
  OM2: "second obtuse marginal",
  RCA: "right coronary artery",
  PDA: "posterior descending artery",
  PLV: "posterolateral branch",
};

const CONDUIT: Record<Graft["conduit"], string> = {
  svg: "saphenous vein graft",
  radial: "radial artery graft",
  lima: "left internal mammary artery",
  rima: "right internal mammary artery",
};

/**
 * The operation note a chart shows for these grafts: the operation, how long ago, and each conduit with its target
 * and the ring markers at its aortic anastomosis. It names what the surgeon did, not what has happened to the grafts
 * since (their status is a finding).
 */
export function operationNoteFor(grafts: readonly Graft[], yearsAgo: number): string {
  const parts = grafts.map((g) => {
    const to = VESSEL[g.target] ?? g.target;
    const marker = g.ringMarker ? " (ring marker at the aortic anastomosis)" : "";
    return g.conduit === "lima" || g.conduit === "rima" ? `${CONDUIT[g.conduit]} to the ${to}` : `${CONDUIT[g.conduit]} to the ${to}${marker}`;
  });
  return `Coronary artery bypass grafting, ${yearsAgo} years ago: ${parts.join("; ")}.`;
}

/**
 * Seconds of lab time after which a learner still searching the ascending aorta for a graft (the store's engagement
 * 'ascending-aorta') is told the graft has not been found. MODEL PARAMETER (no source gives a time).
 */
export const GRAFT_NOT_FOUND_AFTER_S = 240;

/** The graft-not-found trigger of the road-map scenario (see the header). */
const notFound: ScenarioTrigger = {
  id: "graft-not-found",
  when: { afterS: GRAFT_NOT_FOUND_AFTER_S, engagement: ["ascending-aorta"] },
  do: [{ kind: "raise", event: "graft-not-found", hold: 60 }],
};

// cp-prior-cabg#1: graft imaging and interpretation, competitive and collateral filling; cp-prior-cabg#0: a stenosed
// graft ostium (the right graft is diseased: coronaryTree.ts GRAFT_LESION.diseased; its damped trace is open work,
// see the checks below)
const competitiveGrafts: Graft[] = [
  { id: "svg-lad", conduit: "svg", target: "LAD", position: 0.45, proximalSite: "aorta-mid", status: "patent", ringMarker: true },
  { id: "svg-om", conduit: "svg", target: "OM1", position: 0.35, proximalSite: "aorta-high", status: "occluded", ringMarker: true },
  { id: "svg-rca", conduit: "svg", target: "RCA", position: 0.7, proximalSite: "aorta-low", status: "diseased", ringMarker: false },
];

// hb-cardiac-catheterisation#3 and hb-background#2: a graft that is hard to find, a stump and a territory without
// visible supply until the last graft is found
const roadmapGrafts: Graft[] = [
  { id: "svg-om", conduit: "svg", target: "OM1", position: 0.4, proximalSite: "aorta-high", status: "patent", ringMarker: false },
  { id: "svg-d1", conduit: "svg", target: "D1", position: 0.4, proximalSite: "aorta-mid", status: "occluded", ringMarker: false },
  { id: "svg-rca", conduit: "svg", target: "PDA", position: 0.3, proximalSite: "aorta-low", status: "patent", ringMarker: true },
];

// pm-acquiring#9: a long vein graft to a large territory, filmed until the distal bed fills. Both grafts are aortic
// vein grafts, so every graft the note lists can be found in this package's anatomy (in situ mammary grafts are
// diag-grafts-arterial's).
const longGrafts: Graft[] = [
  { id: "svg-lad", conduit: "svg", target: "LAD", position: 0.55, proximalSite: "aorta-mid", status: "patent", ringMarker: false },
  { id: "svg-pda", conduit: "svg", target: "PDA", position: 0.45, proximalSite: "aorta-low", status: "patent", ringMarker: true },
];

export const scenarios: DiagScenario[] = [
  // cp-prior-cabg#1: image each vein graft in two views with its anastomosis, read competitive flow and the stump
  {
    id: "diag-graft-imaging-competitive-flow",
    title: "Image the vein grafts and read competitive flow",
    caseName: "Breathless on exertion after bypass surgery",
    indication: "SA",
    brief:
      "A 68-year-old man had bypass surgery eleven years ago and is now breathless on exertion. The operation note is on the chart. Image every graft from ostium to insertion in two views and the anastomosis in a third, and keep each run going until the native vessel beyond it has filled.",
    lessonIds: ["cp-prior-cabg-svg-image"],
    module: { id: "cp-prior-cabg", title: "Patients with bypass grafts" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Breathless on exertion after bypass surgery" },
    lesions: [
      { vessel: "LAD", position: 0.2, severity: 80, kind: "severe-stenosis", lengthMm: 12 },
      { vessel: "RCA", position: 0.22, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "LCx", position: 0.35, severity: 50, kind: "moderate-stenosis" },
    ],
    grafts: competitiveGrafts,
    events: [],
    chart: {
      ageY: 68,
      sex: "M",
      heightCm: 175,
      weightKg: 84,
      egfr: 62,
      echo: { lvef: 52, note: "Mild inferior hypokinesia." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      operationNote: operationNoteFor(competitiveGrafts, 11),
      previousCatheters: [{ target: "graft", catheterId: "JR4", route: "femoral" }],
      consentScope: "diagnostic-only",
    },
    planted: ["operation-note"],
    startAt: "root",
    // The right graft's stenosis sits just inside its ostium (coronaryTree.ts GRAFT_LESION.diseased), but the rod's
    // trace does not yet damp there: the session narrows the tip's gap only at native ostial lesions
    // (labSession.ts ostialGapFactor). So the check below asks for the stenosis to be recorded and the trace
    // watched, not for a damped trace to be recognised; a check on the damped trace waits on that repair, outside
    // this package. graft-not-found is not scripted here (see the header).
    checks: [
      { id: "views", text: "Each vein graft filmed in LAO and RAO from ostium to insertion, with the anastomosis view for its target (LAO cranial and left lateral for an LAD graft, LAO cranial for an RCA graft).", lessonId: "cp-prior-cabg-svg-image" },
      { id: "long-run", text: "Each graft run kept going until the native vessel beyond the anastomosis had filled.", lessonId: "cp-prior-cabg-svg-image" },
      { id: "competitive", text: "Washout of the native LAD beyond the anastomosis on the left injection recognised as competitive flow from the open graft, not as a new lesion.", lessonId: "cp-prior-cabg-svg-image" },
      { id: "stump", text: "The circumflex graft recorded as occluded (its stump on the aorta), with the circumflex territory supplied natively.", lessonId: "cp-prior-cabg-svg-find" },
      { id: "ostial-stenosis", text: "The stenosis just inside the ostium of the right coronary vein graft recorded from its runs, with the pressure trace watched at the graft ostium before each injection into it.", lessonId: "cp-prior-cabg-svg-find" },
    ],
  },

  // hb-cardiac-catheterisation#3 (and hb-background#2): the aortogram as a road map when a graft cannot be found
  {
    id: "diag-graft-roadmap-aortogram",
    title: "Graft not found: the aortogram as a road map",
    caseName: "Recurrent angina after bypass surgery",
    indication: "SA",
    brief:
      "A 74-year-old woman had bypass surgery thirteen years ago and has recurrent angina. The operation note is on the chart. Account for every graft and every territory; if a graft cannot be found, take an LAO aortogram and use its clearest frame as a road map in the same projection.",
    lessonIds: ["hb-cardiac-catheterisation-aortography", "hb-background-depth"],
    module: { id: "hb-cardiac-catheterisation", title: "Cardiac catheterisation" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "cto", variantCount: [0, 0], nameHint: "Recurrent angina after bypass surgery" },
    lesions: [
      { vessel: "LCx", position: 0.2, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "LAD", position: 0.3, severity: 60, kind: "moderate-stenosis" },
    ],
    grafts: roadmapGrafts,
    events: [],
    chart: {
      ageY: 74,
      sex: "F",
      heightCm: 160,
      weightKg: 66,
      egfr: 58,
      echo: { lvef: 48, note: "Lateral and inferior hypokinesia." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 4 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 4 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      operationNote: operationNoteFor(roadmapGrafts, 13),
      consentScope: "diagnostic-only",
    },
    planted: ["operation-note"],
    startAt: "root",
    script: [notFound],
    checks: [
      { id: "aortogram", text: "After failed attempts at a listed graft, an LAO aortogram with a long acquisition, its clearest frame frozen as a road map, and the graft engaged in the same projection.", lessonId: "hb-cardiac-catheterisation-aortography" },
      { id: "stump", text: "The diagonal graft recorded as occluded from its stump on the aortogram.", lessonId: "hb-cardiac-catheterisation-aortography" },
      { id: "territories", text: "No territory left without a source of flow: the lateral wall, empty on the native left injection, filled from the circumflex graft once it was found.", lessonId: "cp-prior-cabg-svg-find" },
      { id: "levels", text: "Each graft sought at its usual level: the circumflex graft highest, the diagonal graft just above the left coronary ostium, the RCA graft lowest, in front of the native RCA.", lessonId: "hb-background-depth" },
    ],
  },

  // pm-acquiring#9: a long vein graft to a large territory
  {
    id: "diag-long-svg-run",
    title: "A long vein graft: film until the distal bed fills",
    caseName: "Angina at rest after bypass surgery",
    indication: "SA",
    brief:
      "A 70-year-old man had bypass surgery fifteen years ago and now has angina on minimal exertion. The operation note is on the chart. Film the long vein graft until the native vessel beyond it has filled, and account for its whole territory.",
    lessonIds: ["pm-acquiring-cine", "cp-prior-cabg-svg-image"],
    module: { id: "pm-acquiring", title: "Acquiring the angiogram" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "cto", variantCount: [0, 0], nameHint: "Angina at rest after bypass surgery" },
    lesions: [
      { vessel: "RCA", position: 0.15, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "LAD", position: 0.15, severity: 90, kind: "severe-stenosis" },
    ],
    grafts: longGrafts,
    events: [],
    chart: {
      ageY: 70,
      sex: "M",
      heightCm: 178,
      weightKg: 90,
      egfr: 70,
      echo: { lvef: 55, note: "Normal LV function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      operationNote: operationNoteFor(longGrafts, 15),
      consentScope: "diagnostic-only",
    },
    planted: ["operation-note"],
    startAt: "root",
    checks: [
      { id: "long-run", text: "The vein graft run kept going, at a larger volume than a native injection, until the posterior descending artery and its branches had filled.", lessonId: "pm-acquiring-cine" },
      { id: "competitive", text: "The LAD vein graft filmed as well, and the faint LAD beyond its anastomosis on the left injection read as competitive flow from the open graft, not as a new lesion.", lessonId: "cp-prior-cabg-svg-image" },
    ],
  },
];
