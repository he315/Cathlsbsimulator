// ---------------------------------------------------------------------------
// Pericardiocentesis engine.
//
// Pure, deterministic teaching model of cardiac tamponade and its drainage:
//
//   • Pericardial pressure rises along a J-shaped pressure–volume curve. A
//     fast bleed into a pericardium that has not stretched (acute) reaches
//     tamponade with a small volume; a slow effusion stretches the sac and
//     can be large before pressure rises (chronic).
//   • Haemodynamics: diastolic pressures rise and equalise with pericardial
//     pressure, tachycardia, falling systolic pressure, narrow pulse pressure,
//     pulsus paradoxus, and the echo signs (RA systolic collapse, RV diastolic
//     collapse, plethoric IVC, exaggerated respiratory variation of inflow).
//   • Window choice, needle trajectory (angle to skin, aim, entry point, rib
//     border) and the structures crossed along the needle path, with the
//     classic hazards (RV or LV puncture, liver, stomach, lung, internal
//     mammary artery, intercostal vessels, coronary laceration).
//   • Confirmation: aspirate appearance, agitated saline, pressure through the
//     needle, wire course on fluoroscopy. Drainage and re-accumulation.
//   • Scoring.
//
// Numbers marked "model" are illustrative values chosen to make the teaching
// behaviour visible, not measurements. Textbook anchors: normal pericardial
// fluid of the order of tens of mL; tamponade with a small volume when acute
// and with a large one when chronic; pulsus paradoxus defined as an
// inspiratory fall in systolic pressure of more than 10 mmHg; effusion size
// by diastolic echo-free space (<10 mm small, 10–20 mm moderate, >20 mm large).
//
// Perforation scenarios (pericardiocentesis-tips-and-pci-handover, from the
// module cm-perforation, src/content/manual/complication-management/
// 03-perforation.ts):
//   • from-pci-perforation continues the PCI patient on its PatientEngine (a
//     hand-over snapshot from useLabHandoverStore, or a stand-in perforated
//     patient when the lab is opened from a lesson): blood keeps entering the
//     pericardium while the hole is open, drainage goes through
//     engine.drainPericardium, and the vitals are the engine's
//     (EnginePericardium below). haemodynamics() stays the model for every
//     other scenario.
//   • perforation-unstable: drain at once, guided by fluoroscopy because the
//     leaked contrast outlines the sac and the echo is not there yet
//     (lesson cm-perforation-first-minutes step 5; Brilakis 26.2).
//   • perforation-stable-small: a small effusion in a stable patient may be
//     best left, because the raised pericardial pressure helps to tamponade
//     the hole (lesson cm-perforation-pericardiocentesis, "Small effusion,
//     stable patient"; question cm-perforation-q12). The coupling of the leak
//     to the pericardial pressure (leakRate) is a MODEL PARAMETER.
//   • post-cabg-loculated: after CABG the blood can loculate behind the heart
//     out of reach of a subxiphoid needle, which meets no fluid and provokes
//     ectopy; CT-guided or surgical drainage is the answer (lesson
//     cm-perforation-collateral-cabg; question cm-perforation-q10; Brilakis
//     26.6).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../content/lab/tips";
import { MP_ENGINE, PatientEngine } from "./patient/engine";
import { generatePatient, type PatientProfile } from "./patient/patient";
import { ANGIOCAD_SEGMENTS } from "./patient/angiocadPriors";

export type PericScenarioId =
  | "pci-perforation"
  | "malignant"
  | "post-surgical-posterior"
  | "aortic-dissection"
  | "from-pci-perforation"
  | "perforation-unstable"
  | "perforation-stable-small"
  | "post-cabg-loculated";
export type EchoWindow = "subxiphoid" | "apical" | "parasternal";
export type Management = "pericardiocentesis" | "surgical-drainage" | "ct-guided-drainage" | "emergency-surgery" | "controlled-aspiration" | "observe";
export type Structure =
  | "tissue"
  | "liver"
  | "stomach"
  | "lung"
  | "mammary"
  | "intercostal"
  | "effusion"
  | "epicardium"
  | "rv"
  | "lv"
  | "ra";
export type Fluid = "blood-acute" | "serosanguinous" | "clot" | "blood-dissection";

export interface PericScenario {
  id: PericScenarioId;
  title: string;
  short: string;
  vignette: string;
  setting: string;
  /** effusion volume at the start, mL (model) */
  initialVolume: number;
  /** 0 = acute (stiff pericardium) … 1 = chronic (stretched) */
  chronicity: number;
  /** ongoing accumulation, mL per minute of simulated time (model) */
  bleedRate: number;
  /** relative pocket depth at each window (1 = circumferential share) */
  distribution: Record<EchoWindow | "posterior", number>;
  /** loculated / regional collection: classic right-heart collapse may be absent */
  regional: boolean;
  fluid: Fluid;
  heparinised: boolean;
  correct: Management;
  acceptable: Management[];
  baseline: { hr: number; sbp: number; dbp: number; ra: number };
  /** extra echo findings shown with the effusion */
  echoExtras: string[];
  teaching: string[];
  /** rationale options for the management decision (first = correct) */
  rationale?: { question: string; options: string[]; correct: number };
  /** managements scored as fully correct alongside `correct` (for example CT-guided or surgical drainage) */
  alsoCorrect?: Management[];
  /** vocabulary events raised for the whole run in the lab's tip context (the scenario's own story) */
  events?: LabEvent[];
  /** leaked contrast outlines the pericardial sac on fluoroscopy, so X-ray can guide the needle */
  contrastSac?: boolean;
  /** lab seconds before the echo machine arrives (absent: echo from the start). MODEL PARAMETER */
  echoAfterS?: number;
  /**
   * pericardial pressure (mmHg) at which the leak stops: the leak falls in proportion as the
   * pericardial pressure rises towards it (leakRate). Absent: the leak does not depend on the
   * pericardial pressure. MODEL PARAMETER (the module gives the direction, not a number).
   */
  leakStopMmHg?: number;
  /** an unstable patient should have the first fluid out within this many lab seconds. MODEL PARAMETER */
  promptDrainS?: number;
  /** the patient is continued on a PatientEngine (a hand-over from the PCI lab, or a stand-in) */
  engine?: boolean;
}

export const PERIC_SCENARIOS: PericScenario[] = [
  {
    id: "pci-perforation",
    title: "Coronary perforation and tamponade in the lab",
    short: "Post-PCI perforation",
    vignette:
      "During PCI to a heavily calcified LAD in a 74-year-old woman, a stiff wire has exited the vessel and contrast is streaming into the pericardium. She becomes hypotensive and tachycardic a few minutes later. She has had unfractionated heparin. The primary operator is preparing to seal the vessel while you drain the pericardium.",
    setting: "Cath lab, supine, fluoroscopy and echo available",
    initialVolume: 150,
    chronicity: 0,
    bleedRate: 20,
    distribution: { subxiphoid: 1.0, apical: 0.75, parasternal: 0.55, posterior: 0.8 },
    regional: false,
    fluid: "blood-acute",
    heparinised: true,
    correct: "pericardiocentesis",
    acceptable: [],
    baseline: { hr: 78, sbp: 128, dbp: 72, ra: 6 },
    echoExtras: ["Echogenic material in the effusion suggests fresh blood"],
    events: ["perforation"],
    teaching: [
      "In acute haemopericardium a small volume causes tamponade because the pericardium has not had time to stretch; removing a small volume brings a large fall in pressure.",
      "Drainage keeps the patient alive but does not stop the bleeding. The source has to be sealed: prolonged balloon inflation at the perforation, then a covered stent or coils (for distal perforations), reversal of heparin when appropriate, and surgery if this fails.",
      "Leave a pigtail drain in: it relieves recurrent tamponade and tells you whether the bleeding has stopped.",
      "The patient is heparinised, so the clotting test of the aspirate is unreliable. Confirm needle position with agitated saline, pressure through the needle and the wire course.",
    ],
  },
  {
    id: "malignant",
    title: "Malignant pericardial effusion",
    short: "Malignant effusion",
    vignette:
      "A 58-year-old woman with metastatic lung adenocarcinoma has three weeks of increasing breathlessness. She is tachycardic and hypotensive with a raised JVP. Echo shows a large circumferential pericardial effusion.",
    setting: "Cath lab, semi-recumbent, echo-guided with fluoroscopy",
    initialVolume: 1350,
    chronicity: 0.85,
    bleedRate: 0,
    distribution: { subxiphoid: 0.75, apical: 0.9, parasternal: 0.6, posterior: 0.8 },
    regional: false,
    fluid: "serosanguinous",
    heparinised: false,
    correct: "pericardiocentesis",
    acceptable: [],
    baseline: { hr: 84, sbp: 126, dbp: 78, ra: 6 },
    echoExtras: ["Swinging heart within a large effusion"],
    teaching: [
      "A slowly accumulating effusion stretches the pericardium, so a large volume is present before pressure rises; once on the steep part of the curve, a little more fluid tips the patient into tamponade.",
      "Echo guidance is used to choose the site with the largest pocket closest to the skin and nothing in the way; here that is often apical or subxiphoid.",
      "Many centres drain large chronic effusions in stages (about 1 L at a time is commonly quoted) to reduce the risk of pericardial decompression syndrome, and leave the drain in to allow further drainage.",
      "Send fluid for cytology, microbiology and biochemistry. Malignant effusions often recur; extended drainage, intrapericardial therapy or a pericardial window may be needed.",
    ],
  },
  {
    id: "post-surgical-posterior",
    title: "Loculated posterior collection after cardiac surgery",
    short: "Post-surgery loculated",
    vignette:
      "A 69-year-old man is 6 days after bypass grafting and mitral valve repair. He has become hypotensive and oliguric with a rising CVP. Echo shows a loculated collection behind the left atrium and left ventricle, with little or no fluid anteriorly, inferiorly or at the apex.",
    setting: "Cardiac surgical ward / ICU",
    initialVolume: 420,
    chronicity: 0.2,
    bleedRate: 0,
    distribution: { subxiphoid: 0.15, apical: 0.1, parasternal: 0.05, posterior: 1.25 },
    regional: true,
    fluid: "clot",
    heparinised: false,
    correct: "surgical-drainage",
    acceptable: [],
    baseline: { hr: 86, sbp: 118, dbp: 66, ra: 8 },
    echoExtras: ["Echogenic, partly organised collection compressing the left atrium and left ventricle", "Classic right atrial and right ventricular collapse absent"],
    teaching: [
      "After cardiac surgery, collections are often loculated and partly clotted. Regional tamponade can compress the left heart without the classic right-sided echo signs or pulsus paradoxus.",
      "A posterior collection with no anterior, inferior or apical fluid has no safe percutaneous window: the needle would meet myocardium or bypass grafts before fluid.",
      "The treatment is surgical evacuation (re-sternotomy or a surgical window) by the cardiac surgical team.",
    ],
    rationale: {
      question: "Why is percutaneous pericardiocentesis not appropriate here?",
      options: [
        "There is no safe window: the collection is posterior and loculated, with no fluid between the chest wall and the heart",
        "Pericardiocentesis is always contraindicated within a month of surgery",
        "The patient is not haemodynamically compromised",
        "Clotted blood can only be removed with a larger needle from the apex",
      ],
      correct: 0,
    },
  },
  {
    id: "aortic-dissection",
    title: "Type A aortic dissection with haemopericardium",
    short: "Aortic dissection",
    vignette:
      "A 61-year-old man with hypertension has sudden tearing chest pain radiating to the back. CT shows a type A aortic dissection. Echo shows a pericardial effusion with features of tamponade, a dilated aortic root with an intimal flap and aortic regurgitation. The cardiac surgical team is on its way.",
    setting: "Emergency department / resuscitation",
    initialVolume: 300,
    chronicity: 0.1,
    bleedRate: 0,
    distribution: { subxiphoid: 0.9, apical: 0.7, parasternal: 0.6, posterior: 0.8 },
    regional: false,
    fluid: "blood-dissection",
    heparinised: false,
    correct: "emergency-surgery",
    acceptable: ["controlled-aspiration"],
    baseline: { hr: 90, sbp: 140, dbp: 80, ra: 6 },
    echoExtras: ["Dilated aortic root with an intimal flap", "Aortic regurgitation"],
    teaching: [
      "Haemopericardium from a type A dissection is treated by emergency surgery. Pericardiocentesis is generally contraindicated: restoring the blood pressure can extend the dissection or cause free rupture, and the bleeding will continue.",
      "If the patient is peri-arrest and surgery is not immediately available, guidelines allow controlled drainage of very small volumes only, aiming for a minimal perfusing pressure rather than normal haemodynamics.",
      "Avoid excessive fluid loading and vasodilators; control pain; get the patient to theatre.",
    ],
    rationale: {
      question: "Why is full pericardiocentesis avoided in this patient?",
      options: [
        "Raising the blood pressure can extend the dissection or cause free rupture, and the source is not controlled",
        "The effusion is too small to drain",
        "Blood in the pericardium always clots and cannot be aspirated",
        "The subxiphoid approach is impossible with aortic regurgitation",
      ],
      correct: 0,
    },
  },
  // --- perforation scenarios (pericardiocentesis-tips-and-pci-handover) -------------------
  {
    id: "from-pci-perforation",
    title: "Tamponade after a coronary perforation: the patient from the PCI lab",
    short: "From the PCI lab",
    vignette:
      "The patient comes to you from the PCI lab, where a perforation has been bleeding into the pericardium. The same patient, the same heparin and the same leak: blood keeps entering the sac for as long as the hole is open. The primary operator is ready to seal the vessel while you drain.",
    setting: "Cath lab, supine, fluoroscopy and echo available",
    // nominal values for the window score and the fallback; the engine sets the real volume
    initialVolume: 180,
    chronicity: 0,
    bleedRate: 60,
    distribution: { subxiphoid: 1.0, apical: 0.75, parasternal: 0.55, posterior: 0.8 },
    regional: false,
    fluid: "blood-acute",
    heparinised: true,
    correct: "pericardiocentesis",
    acceptable: [],
    baseline: { hr: 76, sbp: 126, dbp: 72, ra: 6 },
    echoExtras: ["Echogenic material in the effusion suggests fresh blood"],
    events: ["perforation"],
    contrastSac: true,
    engine: true,
    teaching: [
      "Drainage keeps the patient alive but does not stop the bleeding; the hole has to be sealed, and the drain output shows whether it has been.",
      "Leaked contrast often outlines the pericardium, so fluoroscopy can guide the needle; echo shows the size of the effusion, guides the needle if there is time, and shows the result (Brilakis 26.2).",
      "Modest volumes of 20–50 mL often relieve tamponade. Leave the drain until the bleeding has stopped, and repeat the echo straight after drainage and then serially (Oxford ch 9).",
    ],
  },
  {
    id: "perforation-unstable",
    title: "Hypotension minutes after a perforation, echo not yet in the room",
    short: "Perforation, unstable",
    vignette:
      "During PCI to a calcified LAD a stiff wire has exited the vessel. A balloon is being inflated at the site, but the blood pressure has fallen to the seventies and the heart rate is climbing. The echo machine is on its way from another room. The patient has had unfractionated heparin.",
    setting: "Cath lab, supine, fluoroscopy available; echo on its way",
    initialVolume: 156,
    chronicity: 0,
    bleedRate: 15,
    distribution: { subxiphoid: 1.0, apical: 0.7, parasternal: 0.5, posterior: 0.8 },
    regional: false,
    fluid: "blood-acute",
    heparinised: true,
    correct: "pericardiocentesis",
    acceptable: [],
    baseline: { hr: 80, sbp: 124, dbp: 70, ra: 6 },
    echoExtras: ["Echogenic material in the effusion suggests fresh blood"],
    events: ["perforation"],
    contrastSac: true,
    echoAfterS: 90,
    leakStopMmHg: 40,
    promptDrainS: 240,
    teaching: [
      "Haemodynamic instability after a perforation means immediate pericardiocentesis (Brilakis 26.2; Oxford ch 10); do not wait for echo in an unstable patient.",
      "Leaked contrast often outlines the sac, so fluoroscopy can guide the needle. Confirm on screening that the J-wire curls round the heart border outside the chambers before you dilate.",
      "Keep the coronary balloon up while you drain, so that no more blood enters; drainage does not seal the hole.",
      "Modest volumes of 20–50 mL often relieve tamponade. Leave the drain and re-image as soon as echo is available.",
    ],
  },
  {
    id: "perforation-stable-small",
    title: "Small effusion after a distal wire exit, patient comfortable",
    short: "Perforation, small effusion",
    vignette:
      "During PCI a hydrophilic wire tip was seen beyond the end of a small distal branch, with a faint blush. The wire has been pulled back and a balloon was inflated briefly. She is comfortable; the pressure and heart rate are unchanged. Echo is in the room.",
    setting: "Cath lab, supine, echo and fluoroscopy available",
    initialVolume: 50,
    chronicity: 0,
    bleedRate: 3,
    distribution: { subxiphoid: 1.0, apical: 0.75, parasternal: 0.55, posterior: 0.8 },
    regional: false,
    fluid: "blood-acute",
    heparinised: true,
    correct: "observe",
    acceptable: [],
    baseline: { hr: 80, sbp: 120, dbp: 72, ra: 6 },
    echoExtras: [],
    events: ["perforation"],
    leakStopMmHg: 1.5,
    teaching: [
      "Brilakis ties drainage to haemodynamics: instability needs immediate drainage, but a small effusion in a stable patient may be best left, because the raised pericardial pressure from the blood already there may help to tamponade the hole.",
      "Follow the effusion with echo; an echo contrast agent can show whether blood is still entering the sac.",
      "A needle into a thin rim of fluid has little margin before it meets the epicardium and its coronary vessels.",
    ],
    rationale: {
      question: "Why may this effusion be left for now?",
      options: [
        "It is small and she is stable: the raised pericardial pressure may help to tamponade the hole while echo follows it",
        "Effusions after a perforation never need drainage",
        "Heparinised blood cannot be aspirated through a needle",
        "It should be drained only after protamine has been given",
      ],
      correct: 0,
    },
  },
  {
    id: "post-cabg-loculated",
    title: "Hypotension after a perforation in a patient with previous bypass surgery",
    short: "Perforation after CABG",
    vignette:
      "A 71-year-old man with previous bypass surgery has PCI to a native circumflex branch. A polymer-jacketed wire perforated a small distal branch and a balloon was inflated. Twenty minutes later he is tachycardic and hypotensive with a widening respiratory swing on the arterial trace. The echo is unimpressive from below the xiphoid.",
    setting: "Cath lab, supine, echo and fluoroscopy available",
    initialVolume: 220,
    chronicity: 0,
    bleedRate: 0,
    distribution: { subxiphoid: 0, apical: 0.05, parasternal: 0, posterior: 1.4 },
    regional: true,
    fluid: "clot",
    heparinised: true,
    correct: "ct-guided-drainage",
    alsoCorrect: ["surgical-drainage"],
    acceptable: [],
    baseline: { hr: 84, sbp: 122, dbp: 70, ra: 7 },
    echoExtras: ["Localised echogenic collection behind the left atrium", "No free fluid anteriorly, inferiorly or at the apex", "Classic right atrial and right ventricular collapse absent"],
    events: ["perforation", "prior-cabg"],
    teaching: [
      "After CABG the blood can collect as a loculated haematoma that compresses a single chamber, such as the left atrium or the right ventricle: 'dry tamponade' (Brilakis 26.6).",
      "A needle from below the xiphoid cannot reach a posterior collection: it meets myocardium, not fluid. Drainage is CT-guided or surgical, with the circulation supported meanwhile.",
      "Previous CABG does not protect. Perforations in these patients are sealed at once, with a covered stent or coils, so that a loculated collection has no time to form.",
    ],
    rationale: {
      question: "Why is a subxiphoid needle not the answer here?",
      options: [
        "The collection is loculated behind the heart: there is no fluid on the subxiphoid path, so the needle would meet myocardium",
        "Bypass patients are protected from tamponade by pericardial adhesions",
        "Pericardiocentesis is never done in heparinised patients",
        "Clot can only be removed through an apical needle",
      ],
      correct: 0,
    },
  },
];

export function getPericScenario(id: PericScenarioId): PericScenario {
  const s = PERIC_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown pericardiocentesis scenario ${id}`);
  return s;
}

export const MANAGEMENT_LABEL: Record<Management, string> = {
  pericardiocentesis: "Proceed to echo-guided pericardiocentesis",
  "surgical-drainage": "Refer for surgical drainage",
  "ct-guided-drainage": "Call for CT-guided drainage",
  "emergency-surgery": "Emergency surgery; avoid pericardiocentesis",
  "controlled-aspiration": "Controlled small-volume aspiration only, as a bridge to surgery",
  observe: "Observe and repeat the echo",
};

// --- Physiology -----------------------------------------------------------------

/**
 * Pericardial pressure (mmHg) for an effusion volume (mL). J-shaped; a more
 * chronic effusion shifts the curve to the right and flattens it (model).
 */
export function pericardialPressure(volume: number, chronicity: number): number {
  const c = clamp(chronicity, 0, 1);
  const v0 = 30 + 500 * c;
  const scale = 45 + 330 * c;
  const p = Math.exp((Math.max(0, volume) - v0) / scale) - 1;
  return clamp(p, 0, 40);
}

export interface Haemo {
  ppc: number;
  /** 0..1 tamponade severity */
  severity: number;
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  ra: number;
  pcwp: number;
  /** inspiratory fall in systolic pressure, mmHg */
  pulsus: number;
  equalised: boolean;
  raCollapse: boolean;
  rvCollapse: boolean;
  plethoricIvc: boolean;
  leftHeartCompression: boolean;
  /** respiratory variation in mitral E velocity, % */
  mitralVar: number;
  /** respiratory variation in tricuspid E velocity, % */
  tricuspidVar: number;
  alternans: boolean;
  lowVoltage: boolean;
  tamponade: boolean;
}

export function haemodynamics(volume: number, sc: PericScenario): Haemo {
  const ppc = pericardialPressure(volume, sc.chronicity);
  const severity = clamp((ppc - 4) / 14, 0, 1);
  const b = sc.baseline;
  const sbp = Math.round(b.sbp - 55 * severity);
  const dbp = Math.round(b.dbp - 22 * severity);
  return {
    ...signsFor(severity, ppc, volume, sc),
    hr: Math.round(Math.min(135, b.hr + 45 * severity)),
    sbp,
    dbp,
    map: Math.round(dbp + (sbp - dbp) / 3),
  };
}

/**
 * The bedside signs for a tamponade severity (0..1) and pericardial pressure (mmHg): the pressure
 * through the needle, the venous pressures, pulsus paradoxus, the echo signs and the tamponade flag
 * (MODEL). The pressure used is at least the one the severity stands for (severity = (ppc - 4) / 14),
 * so a severity raised from elsewhere (haemoFromEngine) moves every sign with it; for
 * haemodynamics() that is its own pressure, unchanged.
 */
/** MODEL PARAMETER: ceiling on the pericardial pressure read from a loculated collection, mmHg. */
export const REGIONAL_PPC_CAP = 25;
/** MODEL PARAMETER: rise in right atrial pressure at full severity with a loculated collection, mmHg. */
export const REGIONAL_RA_RISE = 6;

export function signsFor(severity: number, ppc: number, volume: number, sc: PericScenario): Omit<Haemo, "hr" | "sbp" | "dbp" | "map"> {
  const sev = clamp(severity, 0, 1);
  // MODEL PARAMETER: a loculated (regional) collection compresses one chamber locally, so its pressure
  // is capped at REGIONAL_PPC_CAP for the readouts and the right atrial pressure is not tied to it
  // (it rises with severity from baseline instead); a circumferential effusion sets RA as before.
  const p = Math.max(sc.regional ? Math.min(ppc, REGIONAL_PPC_CAP) : ppc, sev > 0 ? 4 + 14 * sev : 0);
  const b = sc.baseline;
  const ra = sc.regional ? Math.round(b.ra + REGIONAL_RA_RISE * sev) : Math.round(Math.max(b.ra, p + 1));
  const pockets = pocketDepths(volume, sc);
  const largest = Math.max(pockets.subxiphoid, pockets.apical, pockets.parasternal, pockets.posterior);
  return {
    ppc: round1(p),
    severity: sev,
    ra,
    pcwp: Math.round(Math.max(10, p + 1.5)),
    pulsus: Math.round(sc.regional ? 5 + 6 * sev : 5 + 21 * sev),
    equalised: p + 1 >= b.ra && p + 1.5 >= 10,
    raCollapse: !sc.regional && p > 5,
    rvCollapse: !sc.regional && p > 9,
    plethoricIvc: ra >= 12,
    leftHeartCompression: sc.regional && sev > 0.3,
    mitralVar: Math.round(sc.regional ? 10 + 8 * sev : 10 + 30 * sev),
    tricuspidVar: Math.round(sc.regional ? 15 + 10 * sev : 15 + 45 * sev),
    alternans: !sc.regional && largest > 20 && volume > 500,
    lowVoltage: volume > 500,
    tamponade: sev > 0.3,
  };
}

/** Systolic pressure of a beat at a given inspiratory fraction (0 expiration … 1 peak inspiration). */
export function beatSystolic(h: Haemo, inspFrac: number): number {
  return h.sbp - h.pulsus * clamp(inspFrac, 0, 1);
}

/** Respiratory cycle: rate (breaths/min, model) and inspiratory fraction 0..1 at time t. */
export const RESP_RATE = 20;
export function inspiration(t: number, rate = RESP_RATE): number {
  const period = 60 / rate;
  const ph = (((t % period) + period) % period) / period;
  // inspiration over the first 40% of the cycle
  if (ph < 0.4) return Math.sin((Math.PI * ph) / 0.4);
  return 0;
}

/** Pulsus paradoxus as it would be measured from the trace across one breath. */
export function measuredPulsus(h: Haemo): number {
  return beatSystolic(h, 0) - beatSystolic(h, 1);
}

// --- Echo ------------------------------------------------------------------------------

export interface Pockets {
  subxiphoid: number;
  apical: number;
  parasternal: number;
  posterior: number;
}

/** Diastolic echo-free space (mm) at each window (model scaling with volume). */
export function pocketDepths(volume: number, sc: PericScenario): Pockets {
  const base = 1.15 * Math.sqrt(Math.max(0, volume));
  return {
    subxiphoid: round1(base * sc.distribution.subxiphoid),
    apical: round1(base * sc.distribution.apical),
    parasternal: round1(base * sc.distribution.parasternal),
    posterior: round1(base * sc.distribution.posterior),
  };
}

export type EffusionSize = "none" | "small" | "moderate" | "large";

/** ESC size categories by diastolic echo-free space. */
export function effusionSize(mm: number): EffusionSize {
  if (mm < 2) return "none";
  if (mm < 10) return "small";
  if (mm <= 20) return "moderate";
  return "large";
}

/** Best percutaneous window: the largest accessible pocket. */
export function bestWindow(volume: number, sc: PericScenario): { window: EchoWindow; mm: number } {
  const p = pocketDepths(volume, sc);
  const order: EchoWindow[] = ["subxiphoid", "apical", "parasternal"];
  let best: EchoWindow = "subxiphoid";
  for (const w of order) if (p[w] > p[best]) best = w;
  return { window: best, mm: p[best] };
}

// --- Needle trajectory ---------------------------------------------------------------

export interface Trajectory {
  window: EchoWindow;
  /** needle angle to the skin, degrees */
  angle: number;
  /** aim in the frontal plane relative to the window's standard direction, degrees (− medial / rightward, + lateral / leftward) */
  aim: number;
  /** entry point shift, −1 (medial) … +1 (lateral) */
  lateral: number;
  /** intercostal entries: along the upper border of the rib below, or under the lower border of the rib above */
  ribEdge: "above-rib" | "below-rib";
}

export interface WindowInfo {
  label: string;
  /** standard angle to the skin, degrees */
  idealAngle: number;
  /** what aim 0 points at */
  aimRef: string;
  /** skin to parietal pericardium along the ideal path, mm (model) */
  skinDepth: number;
  chamber: "rv" | "lv";
  intercostal: boolean;
  teach: string;
}

export const WINDOW_INFO: Record<EchoWindow, WindowInfo> = {
  subxiphoid: {
    label: "Subxiphoid",
    idealAngle: 30,
    aimRef: "the left shoulder",
    skinDepth: 50,
    chamber: "rv",
    intercostal: false,
    teach: "Enter just below and left of the xiphisternum, about 30 degrees to the skin, aiming toward the left shoulder. Too steep and the needle heads for the liver or stomach; aimed rightward it heads for the liver and right atrium. The first chamber beyond the fluid is the right ventricle.",
  },
  apical: {
    label: "Apical",
    idealAngle: 60,
    aimRef: "the right shoulder, along the axis of the LV",
    skinDepth: 30,
    chamber: "lv",
    intercostal: true,
    teach: "Enter where echo shows the apical pocket, matching the transducer angle, along the upper border of the rib below. Too lateral risks the lung (pneumothorax). The chamber beyond the fluid is the thick-walled LV apex, near the distal LAD.",
  },
  parasternal: {
    label: "Left parasternal",
    idealAngle: 85,
    aimRef: "straight in, perpendicular to the chest wall",
    skinDepth: 30,
    chamber: "rv",
    intercostal: true,
    teach: "Enter over the anterior pocket, perpendicular to the chest wall, along the upper border of the rib below. Too close to the sternal edge risks the internal mammary (thoracic) artery; too lateral risks the lung. The chamber beyond is the RV.",
  },
};

export const STRUCTURE_LABEL: Record<Structure, string> = {
  tissue: "Chest or abdominal wall",
  liver: "Liver",
  stomach: "Stomach",
  lung: "Lung / pleura",
  mammary: "Internal mammary (thoracic) artery",
  intercostal: "Intercostal neurovascular bundle",
  effusion: "Pericardial fluid",
  epicardium: "Epicardial surface",
  rv: "Right ventricle",
  lv: "Left ventricle",
  ra: "Right atrium",
};

export interface PathSegment {
  structure: Structure;
  from: number;
  to: number;
}

export interface Hazard {
  structure: Structure | "coronary" | "pocket";
  severity: "caution" | "danger";
  text: string;
  /** depth at which the hazard is met, mm (null = whole path) */
  at: number | null;
}

export interface NeedlePath {
  segments: PathSegment[];
  hazards: Hazard[];
  /** fluid traversed along the path, mm */
  effusionMm: number;
  /** depth at which the parietal pericardium is reached, mm (null if never) */
  pericardiumAt: number | null;
  chamber: Structure;
  /** 0..1 — how well the needle points at the pocket */
  alignment: number;
  coronaryRisk: boolean;
}

const EPI = 3; // epicardial contact band, mm (model)

/** Trace a needle path through the structures it would cross (model geometry). */
export function needlePath(traj: Trajectory, pockets: Pockets): NeedlePath {
  const w = WINDOW_INFO[traj.window];
  const dA = traj.angle - w.idealAngle;
  const alignment = clamp(1 - (dA / 45) ** 2 - (traj.aim / 60) ** 2, 0.15, 1);
  const pocket = pockets[traj.window];
  const hazards: Hazard[] = [];
  const pre: PathSegment[] = [];
  let peri = w.skinDepth;
  let chamber: Structure = w.chamber;
  let reaches = true;

  if (traj.window === "subxiphoid") {
    if (traj.angle < 12) {
      reaches = false;
      hazards.push({ structure: "pocket", severity: "caution", text: "Too flat: the needle runs in the abdominal wall and catches the costal margin without reaching the pericardium.", at: null });
    }
    const steep = traj.angle > 50;
    const right = traj.aim < -25;
    if (reaches && (steep || right)) {
      const organ: Structure = steep && traj.aim > 20 ? "stomach" : "liver";
      pre.push({ structure: organ, from: 20, to: 48 });
      peri = 62;
      hazards.push({
        structure: organ,
        severity: "danger",
        text: organ === "liver"
          ? steep
            ? "Too steep: the path runs posteriorly through the left lobe of the liver before the pericardium."
            : "Aimed toward the right shoulder: the path crosses the liver and heads for the right atrium."
          : "Too steep and lateral: the path enters the stomach below the diaphragm.",
        at: 20,
      });
    } else if (reaches && traj.angle > 42) {
      hazards.push({ structure: "liver", severity: "caution", text: "Steep: close to the edge of the left lobe of the liver. Flatten the needle.", at: 25 });
    }
    if (right) chamber = "ra";
    if (traj.aim > 35) {
      chamber = "lv";
      hazards.push({ structure: "pocket", severity: "caution", text: "Aimed well lateral of the left shoulder, away from the inferior pocket, toward the inferolateral LV.", at: null });
    }
  } else {
    if (traj.ribEdge === "below-rib") {
      pre.push({ structure: "intercostal", from: 6, to: 12 });
      hazards.push({ structure: "intercostal", severity: "danger", text: "Under the lower border of the rib above: the intercostal artery, vein and nerve run here. Enter along the upper border of the rib below.", at: 6 });
    }
    if (traj.window === "parasternal" && traj.lateral < -0.3) {
      pre.push({ structure: "mammary", from: 9, to: 15 });
      hazards.push({ structure: "mammary", severity: "danger", text: "Too close to the sternal edge: the internal mammary (thoracic) artery runs parallel to the sternum here.", at: 9 });
    }
    const lungLimit = traj.window === "parasternal" ? 0.6 : 0.5;
    if (traj.lateral > lungLimit) {
      pre.push({ structure: "lung", from: 14, to: 26 });
      peri = w.skinDepth + 8;
      hazards.push({ structure: "lung", severity: "danger", text: "Too lateral: the path crosses lung and pleura (pneumothorax risk).", at: 14 });
    }
    chamber = w.chamber;
  }

  if (Math.abs(dA) > 25 && reaches) {
    hazards.push({ structure: "pocket", severity: "caution", text: `The needle angle is ${Math.round(Math.abs(dA))} degrees off the line that showed the pocket; it crosses the thin edge of the fluid.`, at: null });
  }

  const segments: PathSegment[] = [];
  let effusionMm = 0;
  let pericardiumAt: number | null = null;
  let coronaryRisk = false;
  if (!reaches) {
    segments.push({ structure: "tissue", from: 0, to: 200 });
  } else {
    pre.sort((a, b) => a.from - b.from);
    let cursor = 0;
    for (const sgm of pre) {
      if (sgm.from > cursor) segments.push({ structure: "tissue", from: cursor, to: sgm.from });
      segments.push(sgm);
      cursor = sgm.to;
    }
    if (peri > cursor) segments.push({ structure: "tissue", from: cursor, to: peri });
    effusionMm = round1(pocket * alignment);
    pericardiumAt = peri;
    if (effusionMm > 0.2) segments.push({ structure: "effusion", from: peri, to: peri + effusionMm });
    const epiFrom = peri + Math.max(0, effusionMm);
    segments.push({ structure: "epicardium", from: epiFrom, to: epiFrom + EPI });
    segments.push({ structure: chamber, from: epiFrom + EPI, to: epiFrom + EPI + 80 });
    if (effusionMm < 10) {
      coronaryRisk = true;
      hazards.push({
        structure: "coronary",
        severity: effusionMm < 5 ? "danger" : "caution",
        text: `Only about ${Math.round(effusionMm)} mm of fluid along this path: little margin before the needle meets the epicardium and its coronary vessels${traj.window === "apical" ? " (the distal LAD wraps the apex)" : ""}.`,
        at: epiFrom,
      });
    }
  }
  return { segments, hazards, effusionMm, pericardiumAt, chamber, alignment, coronaryRisk };
}

export function structureAt(path: NeedlePath, depth: number): Structure {
  if (depth <= 0) return "tissue";
  for (const s of path.segments) if (depth >= s.from && depth < s.to) return s.structure;
  return path.segments[path.segments.length - 1]?.structure ?? "tissue";
}

/** Overall risk rating of a planned trajectory. */
export function trajectoryRisk(path: NeedlePath): "safe" | "caution" | "danger" {
  if (path.hazards.some((h) => h.severity === "danger")) return "danger";
  if (path.hazards.length > 0) return "caution";
  return "safe";
}

// --- Confirmation ---------------------------------------------------------------------

export interface Aspirate {
  label: string;
  colour: string;
  clots: "yes" | "no" | "unreliable" | "n/a";
  detail: string;
  air: boolean;
}

const BLOODSTAINED = "Uniformly bloodstained fluid";
const BLOOD_COLOUR = "#991b1b";

export function aspirate(structure: Structure, sc: PericScenario): Aspirate {
  switch (structure) {
    case "effusion":
      if (sc.fluid === "serosanguinous")
        return { label: "Serosanguinous fluid", colour: "#c2410c", clots: "no", detail: "Blood-tinged fluid that does not clot. Send for cytology, microbiology and biochemistry.", air: false };
      if (sc.fluid === "clot")
        return { label: "A few mL of dark blood, then nothing", colour: "#4c0519", clots: "n/a", detail: "Partly organised clot does not drain through a needle.", air: false };
      return {
        label: BLOODSTAINED,
        colour: BLOOD_COLOUR,
        clots: sc.heparinised ? "unreliable" : "no",
        detail: sc.heparinised
          ? "Pericardial blood is usually defibrinated and does not clot, but this patient is heparinised so the test is unreliable. Use saline contrast, pressure and the wire course."
          : "Defibrinated pericardial blood usually does not clot, though very fresh bleeding may.",
        air: false,
      };
    case "rv":
      // after a perforation the sac holds fresh blood, so blood from the RV looks the same in the
      // syringe: only the saline, the pressure and the wire course tell them apart (request
      // cm-perforation#6; tip bed-peri-confirm-wire)
      if (sc.fluid === "blood-acute") return { label: BLOODSTAINED, colour: BLOOD_COLOUR, clots: sc.heparinised ? "unreliable" : "yes", detail: "Right ventricular blood: it looks the same as the pericardial blood. Withdraw.", air: false };
      return { label: sc.heparinised ? "Dark blood" : "Dark blood that clots", colour: "#7f1d1d", clots: sc.heparinised ? "unreliable" : "yes", detail: "Intracardiac (right ventricular) blood, with ventricular ectopics. Withdraw.", air: false };
    case "ra":
      if (sc.fluid === "blood-acute") return { label: BLOODSTAINED, colour: BLOOD_COLOUR, clots: sc.heparinised ? "unreliable" : "yes", detail: "Right atrial blood: it looks the same as the pericardial blood. Withdraw.", air: false };
      return { label: "Dark venous blood", colour: "#7f1d1d", clots: sc.heparinised ? "unreliable" : "yes", detail: "Right atrial blood, with atrial ectopics. Withdraw.", air: false };
    case "lv":
      return { label: "Bright red pulsatile blood", colour: "#dc2626", clots: sc.heparinised ? "unreliable" : "yes", detail: "Left ventricular blood at systemic pressure. Withdraw.", air: false };
    case "liver":
      return { label: "Dark blood or nothing", colour: "#581c1c", clots: "n/a", detail: "Liver puncture: risk of hepatic laceration and intra-abdominal bleeding.", air: false };
    case "stomach":
      return { label: "Gastric contents / air", colour: "#a3a37a", clots: "n/a", detail: "The needle is in the stomach.", air: true };
    case "lung":
      return { label: "Air bubbles", colour: "#94a3b8", clots: "n/a", detail: "Air in the syringe: the needle has crossed the lung. Pneumothorax risk; chest X-ray afterwards.", air: true };
    case "mammary":
      return { label: "Bright red blood", colour: "#dc2626", clots: "yes", detail: "Internal mammary artery injury: chest wall haematoma or haemothorax risk.", air: false };
    case "intercostal":
      return { label: "Bright red blood", colour: "#dc2626", clots: "yes", detail: "Intercostal vessel injury: haemothorax risk.", air: false };
    case "epicardium":
      return { label: "Nothing", colour: "transparent", clots: "n/a", detail: "The needle is touching the heart: ventricular ectopics and a scratching sensation. Withdraw slightly.", air: false };
    default:
      return { label: "Nothing", colour: "transparent", clots: "n/a", detail: "The needle is still in tissue.", air: false };
  }
}

export type SalineResult = "pericardial" | "rv" | "lv" | "ra" | "none";

/** Agitated saline through the needle: where do the bubbles appear on echo? */
export function salineCheck(structure: Structure): SalineResult {
  if (structure === "effusion") return "pericardial";
  if (structure === "rv") return "rv";
  if (structure === "lv") return "lv";
  if (structure === "ra") return "ra";
  return "none";
}

export const SALINE_TEXT: Record<SalineResult, string> = {
  pericardial: "Bubbles swirl in the pericardial space around the heart and stay outside the cardiac chambers: needle in the effusion.",
  rv: "Bubbles appear inside the right ventricular cavity: the needle is in the RV.",
  lv: "Bubbles appear inside the left ventricle and are ejected into the aorta: the needle is in the LV.",
  ra: "Bubbles appear in the right atrium: the needle is in the RA.",
  none: "No bubbles seen in or around the heart: the needle tip is not in the pericardium or a chamber.",
};

export type WireResult = "wraps" | "rvot-pa" | "lv-aorta" | "ra-cava" | "extracardiac";

/** J-wire through the needle, seen on fluoroscopy. */
export function wireCheck(structure: Structure): WireResult {
  if (structure === "effusion") return "wraps";
  if (structure === "rv") return "rvot-pa";
  if (structure === "lv") return "lv-aorta";
  if (structure === "ra") return "ra-cava";
  return "extracardiac";
}

export const WIRE_TEXT: Record<WireResult, string> = {
  wraps: "The wire curls around the cardiac silhouette, following the heart border within the pericardial space. Safe to dilate.",
  "rvot-pa": "The wire crosses the RV and goes out through the outflow tract into the pulmonary artery. It is in the RV: do not dilate.",
  "lv-aorta": "The wire passes from the LV out into the ascending aorta. Do not dilate.",
  "ra-cava": "The wire passes up or down the venae cavae from the RA. Do not dilate.",
  extracardiac: "The wire does not follow the heart border; it is outside the pericardium.",
};

/** Pressure transduced through the needle (mmHg) at cardiac phase ph (0..1). */
export function needlePressure(structure: Structure, h: Haemo, ph: number, insp: number): number {
  const q = ((ph % 1) + 1) % 1;
  const sys = q < 0.35 ? Math.sin((Math.PI * q) / 0.35) : 0;
  switch (structure) {
    case "effusion":
      return h.ppc + 1.5 * Math.sin(2 * Math.PI * q) - 2.5 * insp;
    case "rv":
      // RV systolic peak about 28 mmHg (within the normal 15–30, SIM_FACTS item 18), diastolic equal to RA
      return h.ra + (Math.max(h.ra + 12, 28) - h.ra) * sys;
    case "ra":
      return h.ra + 2 * Math.sin(4 * Math.PI * q);
    case "lv":
      return h.ra + (h.sbp - h.ra) * sys;
    default:
      return 0;
  }
}

// --- Effusion dynamics ------------------------------------------------------------------

/** Volume after dt seconds of ongoing accumulation (mL/min) unless the source is sealed. */
export function accumulate(volume: number, dtSec: number, bleedRate: number, sealed: boolean): number {
  if (sealed || bleedRate <= 0) return volume;
  return volume + (bleedRate * dtSec) / 60;
}

export function drain(volume: number, ml: number): { volume: number; removed: number } {
  const removed = Math.min(Math.max(0, volume - 5), Math.max(0, ml));
  return { volume: volume - removed, removed };
}

/**
 * The leak into the pericardium (mL/min) at a pericardial pressure: the scenario's bleed rate,
 * falling in proportion as the pressure rises towards leakStopMmHg when the scenario sets one
 * (the raised pericardial pressure helps to tamponade the hole; the coupling is a MODEL PARAMETER).
 */
export function leakRate(sc: Pick<PericScenario, "bleedRate" | "leakStopMmHg">, ppc: number): number {
  if (sc.bleedRate <= 0) return 0;
  if (!sc.leakStopMmHg) return sc.bleedRate;
  return sc.bleedRate * clamp(1 - Math.max(0, ppc) / sc.leakStopMmHg, 0, 1);
}

/**
 * Volume after dtSec seconds of accumulation at the scenario's leak, coupled to the pericardial
 * pressure (leakRate), in steps of at most one second. Without leakStopMmHg it equals accumulate().
 */
export function accumulateCoupled(volume: number, dtSec: number, sc: PericScenario, sealed: boolean): number {
  if (sealed || sc.bleedRate <= 0) return volume;
  if (!sc.leakStopMmHg) return accumulate(volume, dtSec, sc.bleedRate, false);
  let v = volume;
  let left = Math.max(0, dtSec);
  while (left > 1e-9) {
    const h = Math.min(1, left);
    v += (leakRate(sc, pericardialPressure(v, sc.chronicity)) * h) / 60;
    left -= h;
  }
  return v;
}

/** Contact with the heart (the epicardium or a chamber) provokes ectopic beats on the monitor. */
export function provokesEctopy(structure: Structure | null): boolean {
  return structure === "epicardium" || structure === "rv" || structure === "lv" || structure === "ra";
}

/** Is the echo machine in the room at lab time t (s)? */
export function echoAvailable(sc: Pick<PericScenario, "echoAfterS">, t: number): boolean {
  return !sc.echoAfterS || t >= sc.echoAfterS;
}

/** Is a management fully correct for the scenario (its correct choice or an equivalent)? */
export function isCorrectManagement(sc: PericScenario, m: Management | null): boolean {
  return m !== null && (m === sc.correct || (sc.alsoCorrect ?? []).includes(m));
}

// --- The PCI patient on its PatientEngine -----------------------------------------------------

/** What the lab needs of a PatientEngine. */
export type PericEngine = Pick<PatientEngine, "advance" | "vitals" | "setPericardialInflow" | "drainPericardium">;

/**
 * Leak defaults for a hand-over that does not state them, and for the stand-in patient (MODEL
 * PARAMETERS): the leak, mL/s; the engine's pericardial pressure at which it stops, mmHg; and the
 * volume the stand-in patient arrives with, mL. The engine's circulation falls steeply between about
 * 100 and 150 mL of acute pericardial blood (its own pressure curve, MP_ENGINE.periK and periV0:
 * about 2.6 mmHg at 110 mL, 3.9 at 130 and 5.6 at 150). The stand-in arrives at the start of that
 * fall with a slow leak still open; a stop pressure of 3.9 mmHg lets the leak settle near 130 mL,
 * where the patient is hypotensive (MAP about 50) and still needs drainage, short of the collapse
 * beyond about 150 mL.
 */
export const HANDOVER_LEAK = { mlPerS: 0.35, stopMmHg: 3.9, standInArrivalMl: 110 } as const;

/**
 * Severity from the engine's mean arterial pressure: none at or above this MAP, mmHg, rising to full
 * severity this many mmHg below it (MODEL PARAMETERS, the bedside display's scale).
 */
export const ENGINE_SEVERITY_MAP = { from: 65, span: 35 } as const;

/** The engine's pericardial pressure for a volume (its own curve, engine.ts MP_ENGINE.periK, periV0), mmHg. */
export function enginePericardialPressure(ml: number): number {
  return MP_ENGINE.periK * (Math.exp(Math.max(0, ml) / MP_ENGINE.periV0) - 1);
}

export interface EngineLeak {
  /** blood entering the pericardium while the hole is open, mL/s */
  mlPerS: number;
  /** engine pericardial pressure at which the leak stops, mmHg (MODEL PARAMETER) */
  stopMmHg: number;
  sealed: boolean;
}

/** The leak now (mL/s): the open leak falls as the engine's pericardial pressure rises towards stopMmHg. */
export function engineLeakNow(leak: EngineLeak, ml: number): number {
  if (leak.sealed || leak.mlPerS <= 0) return 0;
  return leak.mlPerS * clamp(1 - enginePericardialPressure(ml) / Math.max(1e-6, leak.stopMmHg), 0, 1);
}

/**
 * The bedside picture of the patient on its engine. The circulation is the engine's: heart rate and
 * arterial pressure from its vitals (the true aortic pressure, as an arterial line shows it). What
 * the engine does not model at the bedside (the pressure through the needle or drain, the venous
 * pressure as the effusion equalises with it, pulsus paradoxus and the echo signs) comes from the
 * bedside model at the engine's pericardial volume (haemodynamics(), MODEL), with the severity
 * raised to what the engine's MAP shows when that is worse (ENGINE_SEVERITY_MAP).
 */
export function haemoFromEngine(e: PericEngine, sc: PericScenario): Haemo {
  const v = e.vitals();
  const base = haemodynamics(v.pericardialMl, sc);
  const a = v.aortaTrue;
  const map = Math.round(a.mean);
  const severity = Math.max(base.severity, clamp((ENGINE_SEVERITY_MAP.from - map) / ENGINE_SEVERITY_MAP.span, 0, 1));
  return {
    ...signsFor(severity, base.ppc, v.pericardialMl, sc),
    hr: Math.round(v.hr ?? 0),
    sbp: Math.round(a.sys),
    dbp: Math.round(a.dia),
    map,
  };
}

/**
 * The patient on its engine in the pericardiocentesis lab: the leak runs while the hole is open
 * (coupled to the pericardial pressure), drainage goes through engine.drainPericardium, and the
 * picture comes from the engine (haemoFromEngine). The lab owns the engine.
 */
export class EnginePericardium {
  private extraMl = 0;
  constructor(
    readonly engine: PericEngine,
    readonly leak: EngineLeak
  ) {}

  get volume(): number {
    return this.engine.vitals().pericardialMl;
  }
  get ppc(): number {
    return enginePericardialPressure(this.volume);
  }
  get t(): number {
    return this.engine.vitals().t;
  }

  /** Advance the patient by `seconds` in steps of `dt`, setting the leak before each step. */
  step(seconds: number, dt = 0.25): void {
    let left = Math.max(0, seconds);
    while (left > 1e-9) {
      const h = Math.min(dt, left);
      let inflow = engineLeakNow(this.leak, this.volume);
      if (this.extraMl > 0) {
        const add = Math.min(this.extraMl, 150 * h);
        this.extraMl -= add;
        inflow += add / h;
      }
      this.engine.setPericardialInflow(inflow);
      this.engine.advance(h);
      left -= h;
    }
    this.engine.setPericardialInflow(engineLeakNow(this.leak, this.volume));
  }

  /** Drain up to `ml` from the pericardium; returns what came out. */
  drain(ml: number): number {
    return this.engine.drainPericardium(Math.max(0, Math.min(ml, this.volume - 5)));
  }

  /** The hole is sealed: no more blood enters. */
  seal(): void {
    this.leak.sealed = true;
    this.engine.setPericardialInflow(0);
  }

  /** A sudden bleed of `ml` into the pericardium over the next seconds (a dilator in a chamber). */
  bleed(ml: number): void {
    this.extraMl += Math.max(0, ml);
  }

  haemo(sc: PericScenario): Haemo {
    return haemoFromEngine(this.engine, sc);
  }
}

/** A hand-over as this lab reads it (the fields of useLabHandoverStore's LabTransfer it uses). */
export interface PericTransfer {
  patient: { snapshot: { periInflow: number }; profile: PatientProfile } | null;
  payload?: Record<string, unknown> | null;
  events?: readonly LabEvent[];
}

/** The leak a hand-over carries: payload.leakMlPerS, else the snapshot's inflow, else the default; sealed from payload.sealed. */
export function leakFromTransfer(t: PericTransfer | null): EngineLeak {
  const p = t?.payload ?? {};
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null);
  const sealed = p.sealed === true;
  const mlPerS = num(p.leakMlPerS) ?? (t?.patient ? t.patient.snapshot.periInflow : null) ?? HANDOVER_LEAK.mlPerS;
  const stopMmHg = num(p.leakStopMmHg) ?? HANDOVER_LEAK.stopMmHg;
  return { mlPerS, stopMmHg: stopMmHg > 0 ? stopMmHg : HANDOVER_LEAK.stopMmHg, sealed };
}

/**
 * A stand-in for the PCI patient when the lab is opened without a hand-over (from a lesson): a
 * patient with no coronary disease in sinus rhythm whose perforation has been bleeding until the
 * pericardium holds HANDOVER_LEAK.standInArrivalMl, with the leak still open (MODEL).
 */
export function standInPerforatedEngine(seed: string | number = 41): PatientEngine {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const sgm of ANGIOCAD_SEGMENTS) grades[sgm] = 0;
  const profile: PatientProfile = { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
  const e = new PatientEngine({ profile, lesions: [] });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(6);
  // fill the pericardium at 2 mL/s to the arrival volume, then leave the hand-over leak open
  const fillS = HANDOVER_LEAK.standInArrivalMl / 2;
  e.setPericardialInflow(2);
  e.advance(fillS);
  e.setPericardialInflow(HANDOVER_LEAK.mlPerS);
  return e;
}

// --- Scoring ------------------------------------------------------------------------------

export interface PericRunLog {
  scenarioId: PericScenarioId;
  management: Management | null;
  rationaleCorrect: boolean | null;
  supportiveCorrect: number;
  supportiveWrong: number;
  window: EchoWindow | null;
  plannedRisk: "safe" | "caution" | "danger" | null;
  structuresEntered: Structure[];
  aspiratedWhileAdvancing: boolean;
  salineResult: SalineResult | null;
  pressureChecked: boolean;
  wireResult: WireResult | null;
  dilatedWithoutWireCheck: boolean;
  dilatedIntoChamber: boolean;
  drainPlaced: boolean;
  drainedMl: number;
  finalPpc: number;
  finalSeverity: number;
  bleedSealRequested: boolean;
  stagedDrainage: boolean;
  fluidSent: boolean;
  /** the echo was repeated after drainage, or while observing (perforation scenarios) */
  echoRepeated?: boolean;
  /** lab seconds from the start to the first fluid out (null: none drained) */
  secondsToDrain?: number | null;
  /** the effusion volume the learner saw when the needle plan was committed (else on arrival), mL (absent: the scenario's initialVolume); a patient on its engine arrives with its own */
  initialMl?: number;
}

export interface ScoreItem {
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  items: ScoreItem[];
}

export const SUPPORTIVE_OPTIONS: { id: string; label: string; good: boolean }[] = [
  { id: "surgeons", label: "Call the cardiac surgical team now", good: true },
  { id: "fluid", label: "Cautious fluid to support preload", good: true },
  { id: "avoid-ppv", label: "Avoid positive pressure ventilation where possible until the chest is open", good: true },
  { id: "vasodilator", label: "Start a nitrate infusion for the chest pain", good: false },
  { id: "diuretic", label: "Give a loop diuretic for the raised JVP", good: false },
  { id: "blind", label: "Blind subxiphoid needle aspiration on the ward", good: false },
];

export function scorePericardiocentesis(log: PericRunLog): ScoreResult {
  const sc = getPericScenario(log.scenarioId);
  const items: ScoreItem[] = [];
  const correctMgmt = isCorrectManagement(sc, log.management);
  const acceptableMgmt = log.management !== null && sc.acceptable.includes(log.management);
  const perforation = (sc.events ?? []).includes("perforation");

  if (sc.correct !== "pericardiocentesis") {
    items.push({
      label: "Management decision",
      points: correctMgmt ? 50 : acceptableMgmt ? 30 : 0,
      max: 50,
      detail: correctMgmt
        ? `${MANAGEMENT_LABEL[sc.correct]}: correct.`
        : acceptableMgmt
        ? "Acceptable only as a bridge if the patient is peri-arrest and surgery is not immediately available."
        : `The right call was: ${MANAGEMENT_LABEL[sc.correct]}.`,
    });
    items.push({
      label: "Rationale",
      points: log.rationaleCorrect ? 25 : 0,
      max: 25,
      detail: sc.rationale ? `${sc.rationale.question} ${sc.rationale.options[sc.rationale.correct]}.` : "",
    });
    if (sc.correct === "observe") {
      items.push({
        label: "Follow the effusion",
        points: log.management === "observe" && log.echoRepeated ? 25 : 0,
        max: 25,
        detail:
          log.management !== "observe"
            ? "The effusion was not left to be followed with echo."
            : log.echoRepeated
            ? "The echo was repeated to follow the effusion."
            : "A small effusion that is left must be followed with repeat echo.",
      });
    } else {
      const sup = clamp(log.supportiveCorrect * 5 - log.supportiveWrong * 5 + (log.supportiveCorrect === 3 ? 10 : 0), 0, 25);
      items.push({ label: "Supportive measures", points: sup, max: 25, detail: `${log.supportiveCorrect} appropriate, ${log.supportiveWrong} inappropriate choice(s).` });
    }
    if (log.structuresEntered.length > 0) {
      const harm = log.structuresEntered.filter((s) => s !== "tissue" && s !== "effusion");
      items.push({
        label: "Attempted percutaneous drainage",
        points: harm.length ? -20 : -10,
        max: 0,
        detail: harm.length ? `Needle entered: ${harm.map((h) => STRUCTURE_LABEL[h]).join(", ")}.` : "A needle was passed despite no safe indication.",
      });
    }
    if (perforation && sc.correct !== "observe") items.push(sealItem(log));
    // scenarios with extra items are scored out of their own maximum (every original scenario's is 100)
    const total = items.reduce((a, b) => a + b.points, 0);
    const max = items.reduce((a, b) => a + b.max, 0);
    return { score: clamp(Math.round(max > 100 ? (total * 100) / max : total), 0, 100), items };
  }

  // Percutaneous scenarios
  items.push({
    label: "Management decision",
    points: correctMgmt ? 15 : 0,
    max: 15,
    detail: correctMgmt ? "Tamponade recognised; drainage indicated." : "Tamponade with a drainable effusion needed pericardiocentesis.",
  });

  const v0 = log.initialMl ?? sc.initialVolume;
  const best = bestWindow(v0, sc);
  const pockets = pocketDepths(v0, sc);
  if (log.window) {
    const mm = pockets[log.window];
    const pts = mm >= best.mm - 3 || mm > 20 ? 15 : mm >= 10 ? 8 : 0;
    items.push({
      label: "Window",
      points: pts,
      max: 15,
      detail: `${WINDOW_INFO[log.window].label} pocket ${Math.round(mm)} mm; the largest was ${WINDOW_INFO[best.window].label} at ${Math.round(best.mm)} mm.`,
    });
  } else items.push({ label: "Window", points: 0, max: 15, detail: "No window chosen." });

  const harmful = Array.from(new Set(log.structuresEntered.filter((s) => s !== "tissue" && s !== "effusion" && s !== "epicardium")));
  const trajPts = log.plannedRisk === "safe" ? 20 : log.plannedRisk === "caution" ? 12 : log.plannedRisk === "danger" ? 4 : 0;
  items.push({
    label: "Trajectory",
    points: Math.max(0, trajPts - harmful.length * 6),
    max: 20,
    detail:
      (log.plannedRisk ? `Planned path rated ${log.plannedRisk}. ` : "") +
      (harmful.length ? `Needle entered: ${harmful.map((h) => STRUCTURE_LABEL[h]).join(", ")}.` : "No structure injured."),
  });

  items.push({
    label: "Technique",
    points: (log.aspiratedWhileAdvancing ? 5 : 0) + (log.structuresEntered.some((s) => s === "rv" || s === "lv" || s === "ra") ? 0 : 5),
    max: 10,
    detail: (log.aspiratedWhileAdvancing ? "Aspirated while advancing. " : "Advance with gentle continuous aspiration so you know the moment you enter fluid. ") +
      (log.structuresEntered.some((s) => s === "rv" || s === "lv" || s === "ra") ? "A cardiac chamber was punctured." : ""),
  });

  {
    let p = 0;
    if (log.salineResult === "pericardial" || log.pressureChecked) p += 7;
    if (log.wireResult === "wraps") p += 8;
    let detail = log.salineResult ? `Saline: ${log.salineResult}. ` : "No agitated saline check. ";
    detail += log.wireResult ? `Wire: ${log.wireResult === "wraps" ? "wrapped around the heart" : log.wireResult}. ` : "Wire course not checked. ";
    if (log.dilatedWithoutWireCheck) {
      p -= 15;
      detail += "Dilated before confirming the wire course. ";
    }
    if (log.dilatedIntoChamber) {
      p -= 25;
      detail += "The dilator was passed into a cardiac chamber: a surgical emergency. ";
    }
    items.push({ label: "Confirmation", points: p, max: 15, detail });
  }

  items.push({
    label: "Drainage and recovery",
    points: (log.drainPlaced ? 5 : 0) + (log.finalPpc < 5 ? 5 : 0) + (log.finalSeverity < 0.15 ? 5 : 0),
    max: 15,
    detail: `${log.drainPlaced ? "Pigtail drain placed. " : "No drain placed. "}Drained ${Math.round(log.drainedMl)} mL; final pericardial pressure ${round1(log.finalPpc)} mmHg.`,
  });

  if (sc.promptDrainS) {
    const s = log.secondsToDrain ?? null;
    const prompt = s !== null && s <= sc.promptDrainS;
    items.push({
      label: "Drained promptly",
      points: prompt ? 10 : 0,
      max: 10,
      detail: s === null ? "No fluid was drained." : `First fluid out at ${Math.round(s)} s${prompt ? "." : `; an unstable patient needs drainage at once, without waiting for echo.`}`,
    });
  }
  if (perforation && sc.id !== "pci-perforation") {
    items.push({
      label: "Re-imaged after drainage",
      points: log.echoRepeated ? 5 : 0,
      max: 5,
      detail: log.echoRepeated ? "Echo repeated after drainage." : "Repeat the echo straight after drainage and then serially.",
    });
  }

  if (perforation) {
    items.push(sealItem(log));
  } else if (sc.id === "malignant") {
    items.push({
      label: "Drainage plan",
      points: (log.stagedDrainage ? 5 : 0) + (log.fluidSent ? 5 : 0),
      max: 10,
      detail: `${log.stagedDrainage ? "Drained in stages." : "Drained a very large volume in one go; staged drainage reduces the risk of decompression syndrome."} ${log.fluidSent ? "Fluid sent for analysis." : "Fluid not sent for cytology, microbiology and biochemistry."}`,
    });
  }

  // scenarios with extra items are scored out of their own maximum (every original scenario's is 100)
  const total = items.reduce((a, b) => a + b.points, 0);
  const max = items.reduce((a, b) => a + b.max, 0);
  return { score: clamp(Math.round(max > 100 ? (total * 100) / max : total), 0, 100), items };
}

/** The score item for asking the primary operator to seal the perforation. */
function sealItem(log: PericRunLog): ScoreItem {
  return {
    label: "Stop the bleeding",
    points: log.bleedSealRequested ? 10 : 0,
    max: 10,
    detail: log.bleedSealRequested ? "Asked for the perforation to be sealed." : "Drainage alone does not stop a coronary perforation; the source must be sealed.",
  };
}

// --- utils ----------------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
