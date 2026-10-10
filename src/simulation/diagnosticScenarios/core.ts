// ---------------------------------------------------------------------------
// The first diagnostic scenarios (diag-scenario-registry): one patient each,
// with a chart that carries the problem the lesson plants.
//
// Chart values (age, size, renal function, echo, drug timings) are scenario
// data, not sourced facts. The rules they test are sourced where the code that
// applies them lives: the contrast ceilings in
// src/simulation/patient/contrastBudget.ts (Brilakis 2.6 and 1.1, Oxford ch 4),
// the PDE-5 windows in src/simulation/patient/pharmacology.ts (PDE5_WINDOW_H,
// Brilakis 3.2), and the pre-brief questions in src/mentor/prebrief.ts.
// The lab requests each scenario answers are named above it.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only. The
// indication is the one the patient engine's seeded patient is drawn with
// (generatePatient): an ACS only where the history is one.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

export const scenarios: DiagScenario[] = [
  // cp-complex-patients#4: a resuscitated out-of-hospital arrest with persistent ST elevation.
  {
    id: "diag-ohca-post-rosc",
    title: "Resuscitated arrest with ST elevation",
    caseName: "Resuscitated arrest with ST elevation",
    indication: "STEMI",
    brief:
      "A 58-year-old man collapsed at home. Bystander CPR was started, the first rhythm was VF and the ambulance crew restored a circulation after defibrillation. He arrives intubated and ventilated on a vasopressor infusion. The post-resuscitation ECG is on the chart.",
    lessonIds: ["cp-complex-patients-ohca"],
    module: { id: "cp-complex-patients", title: "Cardiogenic shock, cardiac arrest and TAVI patients" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Resuscitated arrest with ST elevation" },
    lesions: [{ vessel: "LAD", position: 0.2, severity: 95, kind: "thrombotic", morphology: "thrombus", role: "target" }],
    // 'stemi': the persistent ST elevation is a STEMI presentation, so the study report asks its MI
    // classification (asksMiClass); diag-acs-scenarios adds it with the pre-brief ECG and the triage gate
    // (ACS_CASES in acs.ts)
    events: ["post-arrest", "stemi"],
    chart: {
      ageY: 58,
      sex: "M",
      heightCm: 176,
      weightKg: 84,
      egfr: 68,
      echo: { note: "Bedside echo in the emergency department: LV function reduced, no pericardial effusion." },
      drugs: [{ name: "Noradrenaline infusion", route: "IV" }, { name: "Propofol infusion", route: "IV" }, { name: "Aspirin", route: "IV" }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      arrestHistory: { rhythm: "vf", witnessed: true, minutesToRosc: 15, note: "Bystander CPR. Defibrillated by the ambulance crew. Post-resuscitation ECG: persistent anterior ST elevation." },
      ecgId: "ecg-ohca-anterior",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [
      // the post-resuscitation ECG the chart shows: held for the case
      { id: "post-rosc-ecg", when: { afterS: 0 }, do: [{ kind: "raise", event: "st-elevation", hold: "case" }] },
    ],
    checks: [
      { id: "triage", text: "Persistent ST elevation after resuscitation goes to primary PCI whether or not the patient responds.", lessonId: "cp-complex-patients-ohca" },
      { id: "femoral", text: "Femoral access when mechanical support may be needed, with no time lost to radial spasm on a vasopressor.", lessonId: "cp-complex-patients-ohca" },
    ],
  },

  // hb-background#6: a contrast-sensitive patient (LV impairment, severe aortic stenosis, eGFR 30).
  {
    id: "diag-contrast-sensitive",
    title: "Weak ventricle, tight valve, low eGFR",
    caseName: "Angiography before valve intervention",
    indication: "SA",
    brief:
      "A 78-year-old woman with severe aortic stenosis and an ejection fraction of 30% is having coronary angiography before valve intervention. Her renal function is on the chart. A transthoracic echo last week answered the questions about the ventricle and the valve.",
    lessonIds: ["hb-background-general"],
    module: { id: "hb-background", title: "Background for the lab: anatomy, disease and beyond the coronaries" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Angiography before valve intervention" },
    events: [],
    chart: {
      ageY: 78,
      sex: "F",
      heightCm: 158,
      weightKg: 60,
      egfr: 30,
      echo: { lvef: 30, valves: [{ valve: "aortic", lesion: "stenosis", severity: "severe" }], note: "Severe aortic stenosis, LV ejection fraction 30%." },
      drugs: [{ name: "Furosemide", route: "oral", lastDoseHoursAgo: 4 }, { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: ["egfr-ceiling"],
    startAt: "root",
    script: [
      // the volume reaches the warning of the stricter ceiling: the attending's caution
      { id: "contrast-warning", when: { contrast: "warn" }, do: [{ kind: "raise", event: "high-contrast-volume", hold: "case" }] },
    ],
    checks: [
      { id: "ceiling", text: "Contrast ceiling set from the eGFR at the start (3.7 × eGFR, Brilakis) and the case finished below it.", lessonId: "hb-background-general" },
      { id: "no-ventriculogram", text: "No ventriculogram: a recent good echo has answered the question, and the aortic stenosis is severe.", lessonId: "hb-background-general" },
    ],
  },

  // pm-lab-drugs#1: a PDE-5 inhibitor within its window on the chart.
  {
    id: "diag-nitrate-pde5",
    title: "Spasm and a PDE-5 inhibitor",
    caseName: "Chest pain at rest and at night",
    indication: "SA",
    brief:
      "A 62-year-old man with chest pain at rest, sometimes at night, is having diagnostic angiography. His medicines are on the chart; ask about any not listed there.",
    lessonIds: ["pm-lab-drugs-nitrates"],
    module: { id: "pm-lab-drugs", title: "Sedation, vasodilators, pressors, antiarrhythmics and contrast" },
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "spasm", variantCount: [0, 0], nameHint: "Chest pain at rest and at night" },
    lesions: [{ vessel: "RCA", position: 0.4, severity: 70, kind: "spasm", morphology: "spasm", nitrateResponsive: true }],
    // the sildenafil on the chart is history, not a finding: the case event lets setup-phase PDE-5 tips key on it (plan: diag-lab-drugs tipIntegration)
    events: ["pde5-recent"],
    chart: {
      ageY: 62,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 82,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Sildenafil", drugId: "sildenafil", route: "oral", lastDoseHoursAgo: 10 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-nitrate", text: "No nitrate within the PDE-5 inhibitor's window (sildenafil, vardenafil or avanafil 24 h; tadalafil 48 h; Brilakis 3.2).", lessonId: "pm-lab-drugs-nitrates" },
      { id: "hypotension", text: "Nitrate hypotension, if it happens, corrected with saline and, if severe, a vasopressor.", lessonId: "pm-lab-drugs-nitrates" },
    ],
  },

  // cp-prior-cabg#0: a post-CABG study from the operation note.
  {
    id: "diag-graft-search",
    title: "Find every graft in the operation note",
    caseName: "Angina after bypass surgery",
    indication: "SA",
    brief:
      "A 71-year-old man had bypass surgery nine years ago and now has angina again. The operation note is on the chart. Find and image every graft it lists, and account for every territory.",
    lessonIds: ["cp-prior-cabg-svg-find"],
    module: { id: "cp-prior-cabg", title: "Patients with bypass grafts" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "cto", variantCount: [0, 0], nameHint: "Angina after bypass surgery" },
    lesions: [
      { vessel: "LAD", position: 0.12, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "RCA", position: 0.25, severity: 100, kind: "cto", morphology: "cto" },
      { vessel: "LCx", position: 0.3, severity: 85, kind: "severe-stenosis" },
    ],
    // Oxford's usual order on the anterior ascending aorta: circumflex grafts highest, RCA grafts lowest (cp-prior-cabg#0)
    grafts: [
      { id: "lima-lad", conduit: "lima", target: "LAD", position: 0.55, proximalSite: "left-subclavian", status: "patent", ringMarker: false },
      { id: "svg-om", conduit: "svg", target: "OM1", position: 0.35, proximalSite: "aorta-high", status: "patent", ringMarker: true },
      { id: "svg-rca", conduit: "svg", target: "PDA", position: 0.3, proximalSite: "aorta-low", status: "occluded", ringMarker: false },
    ],
    events: [],
    chart: {
      ageY: 71,
      sex: "M",
      heightCm: 172,
      weightKg: 80,
      egfr: 55,
      echo: { lvef: 50, note: "Mild inferior hypokinesia." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }, { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      operationNote: "Coronary artery bypass grafting, nine years ago: left internal mammary artery to the LAD; saphenous vein graft to the first obtuse marginal (ring marker at the aortic anastomosis); saphenous vein graft to the posterior descending artery.",
      previousCatheters: [{ target: "left", catheterId: "JL4", route: "femoral" }, { target: "graft", catheterId: "JR4", route: "femoral" }],
      consentScope: "diagnostic-only",
    },
    planted: ["operation-note", "egfr-ceiling"],
    startAt: "root",
    checks: [
      { id: "every-graft", text: "Every graft in the operation note engaged or shown to be occluded (a stump, or an aortogram), and every territory accounted for.", lessonId: "cp-prior-cabg-svg-find" },
      { id: "contrast", text: "No injection into a damped trace, and contrast kept below 3.7 × eGFR; near the limit with a graft still missing and no emergency, stop and request coronary CT.", lessonId: "cp-prior-cabg-svg-find" },
    ],
  },

  // The scad-suspected case event (waiting.ts: diag-ocx-scad-setup, diag-ocx-scad-no-deep-seat).
  {
    id: "diag-scad-suspected",
    title: "Chest pain three weeks after delivery",
    caseName: "Chest pain three weeks after delivery",
    indication: "NSTEMI",
    brief:
      "A 38-year-old woman delivered her second child three weeks ago. She has had chest pain since this morning and a raised troponin. Her ECG shows anterior T-wave inversion.",
    lessonIds: ["cp-other-complex-scad"],
    module: { id: "cp-other-complex", title: "SCAD, stent failure, vessel size and long lesions" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Chest pain three weeks after delivery" },
    lesions: [{ vessel: "LAD", position: 0.55, severity: 70, kind: "moderate-stenosis", morphology: "scad", scadType: "2A", lengthMm: 30 }],
    events: [],
    chart: {
      ageY: 38,
      sex: "F",
      heightCm: 165,
      weightKg: 68,
      egfr: 105,
      echo: { lvef: 55, note: "Mild apical hypokinesia." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 5 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [{ id: "scad-history", when: { afterS: 0 }, do: [{ kind: "raise", event: "scad-suspected", hold: "case" }] }],
    checks: [
      { id: "gentle", text: "Coaxial engagement without deep intubation, and soft injections.", lessonId: "cp-other-complex-scad" },
    ],
  },

  // pm-engaging trace reading with a planted pregnancy question (hb-lab-and-radiation#4).
  {
    id: "diag-trace-recognition",
    title: "Read the trace before every injection",
    caseName: "Exertional angina, positive stress test",
    indication: "SA",
    brief:
      "A 46-year-old woman with exertional angina and a positive stress test is having diagnostic angiography from the right radial. Name the pressure trace before every test injection and every cine run.",
    lessonIds: ["pm-engaging-trace", "hb-lab-and-radiation-dose"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "ostial-rca", variantCount: [0, 0], nameHint: "Exertional angina, positive stress test" },
    events: [],
    chart: {
      ageY: 46,
      sex: "F",
      heightCm: 163,
      weightKg: 71,
      egfr: 96,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }, { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "test-not-done",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "trace", text: "No injection into a damped or ventricularised trace.", lessonId: "pm-engaging-trace" },
      { id: "pregnancy", text: "Pregnancy status confirmed before the first exposure.", lessonId: "hb-lab-and-radiation-dose" },
    ],
  },

  // hb-lab-and-radiation#4: previous fluoroscopy and a radiation skin injury.
  {
    id: "diag-prior-radiation",
    title: "A healing skin injury from the last procedure",
    caseName: "Recurrent angina five weeks after PCI",
    indication: "SA",
    brief:
      "A 67-year-old man had a long chronic total occlusion procedure on his right coronary artery five weeks ago and now has recurrent angina. The previous procedures and the skin examination are on the chart.",
    lessonIds: ["hb-lab-and-radiation-reduce", "pm-acquiring-setup"],
    module: { id: "hb-lab-and-radiation", title: "The lab, imaging equipment and radiation safety" },
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mid-rca", variantCount: [0, 0], nameHint: "Recurrent angina five weeks after PCI" },
    events: [],
    chart: {
      ageY: 67,
      sex: "M",
      heightCm: 180,
      weightKg: 98,
      egfr: 74,
      echo: { lvef: 55 },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }, { name: "Clopidogrel", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      priorFluoroProcedures: [{ procedure: "Chronic total occlusion PCI of the right coronary artery", daysAgo: 35 }],
      skinFindings: ["Healing erythema over the right upper back"],
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "history", text: "Previous fluoroscopic procedures asked about and the back examined before the first exposure.", lessonId: "hb-lab-and-radiation-reduce" },
      { id: "skin", text: "Fewer cine runs, and the injured area kept out of the beam.", lessonId: "hb-lab-and-radiation-reduce" },
    ],
  },
];
