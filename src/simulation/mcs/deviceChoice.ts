// ---------------------------------------------------------------------------
// Choosing mechanical circulatory support (mcs-console-split-select-and-tips):
// the device-choice step at the start of each MCS console, and the scoring of
// an MCS lab session.
//
// A SupportProfile is what the operator knows before the case: the right
// heart numbers, blood pressure, rhythm and oxygenation, the planned
// procedure, the echo, the iliofemoral arteries and the rest of the history.
// expectedChoice() walks the algorithm the module teaches and returns what is
// accepted and the finding that decides it; scoreChoice() scores a learner's
// choice against it. Every threshold below names the lesson that gives it
// (src/content/manual/pci-manual/16-support-choice.ts, Brilakis's Manual of
// PCI chapter 14.1 as that module teaches it):
//
//   pm-support-choice-when   "Right heart numbers Brilakis uses before PCI":
//                            wedge above 18 mmHg suggests LV failure; PAPi
//                            below 0.9 RV failure; wedge above 25 mmHg with a
//                            mixed venous saturation below 50% a high risk of
//                            oedema and shock. Step 3: the high-risk
//                            procedures (unprotected left main, last remaining
//                            vessel, atherectomy, retrograde CTO PCI). Step 4:
//                            the two-axes table (none, standby with a 4 Fr
//                            femoral sheath, upfront support or standby after
//                            CHIP-BCIS3).
//   pm-support-choice-which  "Ask these in order": the four microaxial pump
//                            contraindications (mechanical aortic valve, LV
//                            thrombus, severe aortic regurgitation, atrial or
//                            ventricular septal defect); the iliofemoral route
//                            more than 5 mm wide without severe calcium or
//                            tortuosity; an alternative (axillary, transcaval)
//                            route, otherwise a balloon pump; if the pump is
//                            contraindicated, a balloon pump or VA-ECMO unless
//                            severe aortic regurgitation, aortic dissection or
//                            uncontrolled bleeding, with an aortic aneurysm
//                            ruling out the balloon pump and severe peripheral
//                            arterial disease VA-ECMO (Table 14.1).
//   pm-support-choice-shock  shock (Tehrani algorithm): systolic below 90 mmHg
//                            or drugs needed to hold it, with end-organ
//                            hypoperfusion (lactate above 2 mmol/L). "Three
//                            questions, in order": hypoxaemia that persists
//                            despite optimal oxygenation and ventilation →
//                            VA-ECMO; RV failure (RA above 12 mmHg or PAPi
//                            below 0.9): both ventricles → VA-ECMO or left and
//                            right devices together, RV alone → a right-sided
//                            device; LV failure: pre-shock with a cardiac index
//                            above 2.0 → a balloon pump may be enough,
//                            severe → a microaxial pump, refractory → VA-ECMO.
//   pm-support-choice-cpr    arrest: VA-ECMO (pm-support-choice-when: "In
//                            arrest, VA-ECMO is essential").
//
// What scores as wrong comes from the lab request (docs/curriculum/lab-requests/
// pm-support-choice.json): a microaxial pump with a mechanical aortic valve or
// LV thrombus (a critical error, one per contraindication ignored), a
// left-sided device for isolated RV failure, a balloon pump for severe shock,
// VA-ECMO for hypoxaemia before ventilation is optimised, and anything but
// VA-ECMO for refractory hypoxaemic shock or arrest. For abnormal haemodynamics
// with a high-risk procedure both upfront support and standby are accepted,
// provided the learner states the trade-off.
//
// Engine-free and pure: the presets' ids are the scenario ids of
// src/content/lab/presets/mcs/core.launch.ts.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";

// --- thresholds (each from the module text, see above) -------------------------

export const SUPPORT_THRESHOLDS = {
  /** pm-support-choice-when: wedge above this suggests LV failure, mmHg */
  lvFailureWedge: 18,
  /** pm-support-choice-when and -shock: PAPi below this suggests RV failure */
  rvFailurePapi: 0.9,
  /** pm-support-choice-when: wedge above this with mixed venous saturation below svo2Warn warns of oedema and shock, mmHg */
  oedemaWedge: 25,
  /** pm-support-choice-when: mixed venous saturation below this, with the wedge above oedemaWedge, % */
  svo2Warn: 50,
  /** pm-support-choice-shock: RA pressure above this suggests RV failure, mmHg */
  rvFailureRa: 12,
  /** pm-support-choice-shock (Tehrani): systolic below this, or drugs needed to hold it, mmHg */
  shockSystolic: 90,
  /** pm-support-choice-shock (Tehrani): lactate above this marks hypoperfusion, mmol/L */
  shockLactate: 2,
  /** pm-support-choice-shock: pre-shock with a cardiac index above this, L/min/m² */
  preShockIndex: 2.0,
  /** pm-support-choice-which: the iliofemoral arteries must be wider than this for the 14 Fr pump, mm */
  iliofemoralMinMm: 5,
} as const;

// --- the profile -----------------------------------------------------------------

export type PlannedProcedure =
  | "simple" // a simple lesion
  | "unprotected-lm"
  | "last-vessel"
  | "atherectomy"
  | "retrograde-cto"
  | "primary-pci" // the culprit artery in an acute infarct
  | "none"; // no PCI planned yet (arrest, shock before angiography)

/** The procedures Brilakis counts as high risk (pm-support-choice-when, Step 3). */
export const HIGH_RISK_PROCEDURES: readonly PlannedProcedure[] = ["unprotected-lm", "last-vessel", "atherectomy", "retrograde-cto"];

export const PROCEDURE_LABEL: Record<PlannedProcedure, string> = {
  simple: "PCI of a simple, focal lesion",
  "unprotected-lm": "Unprotected left main PCI",
  "last-vessel": "PCI of the last remaining vessel",
  atherectomy: "Rotational atherectomy",
  "retrograde-cto": "Retrograde CTO PCI",
  "primary-pci": "Primary PCI of the culprit artery",
  none: "No PCI planned yet",
};

export type ArGrade = "none" | "mild" | "moderate" | "severe";

export interface SupportProfile {
  id: string;
  title: string;
  /** the story, as the operator hears it */
  brief: string;
  age: number;
  sex: "male" | "female";
  rhythm: "sinus" | "af" | "vf";
  hr: number;
  /** cuff or arterial line, mmHg; 0/0 in arrest without compressions measured */
  bp: { sys: number; dia: number };
  onPressors: boolean;
  /** mmol/L, when measured */
  lactate?: number;
  /** right heart study, mmHg; absent when none was done */
  rhc?: { ra: number; paSys: number; paDia: number; wedge: number; svo2: number };
  /** L/min and L/min/m², when measured */
  co?: number;
  ci?: number;
  spo2: number;
  /** what is being done for oxygenation now */
  ventilation: "room-air" | "oxygen" | "high-flow" | "optimised";
  /** hypoxaemic on what is being given (the clinical finding, as the team reports it) */
  hypoxaemic: boolean;
  /** hypoperfusion continues despite a first device */
  refractory?: boolean;
  procedure: PlannedProcedure;
  /** the coronary anatomy in a few words */
  anatomy: string;
  echo: { lvef: number; mechanicalAv: boolean; lvThrombus: boolean; ar: ArGrade; asd: boolean; vsd: boolean; note?: string };
  iliofemoral: { minLumenMm: number; severeCalcium: boolean; severeTortuosity: boolean };
  /** axillary or transcaval large-bore access is done in this centre */
  alternativeRoute: boolean;
  aorticDissection: boolean;
  aorticAneurysm: boolean;
  severePad: boolean;
  bleeding: "none" | "high-risk" | "uncontrolled";
}

// --- the learner's choice --------------------------------------------------------

export type SupportClass = "none" | "standby" | "upfront" | "shock" | "arrest";
export type SupportDevice = "none" | "change-plan" | "iabp" | "microaxial" | "va-ecmo" | "right-sided" | "combined";

export const CLASS_LABEL: Record<SupportClass, string> = {
  none: "No support needed",
  standby: "Standby: device in the room, 4 Fr femoral sheath in",
  upfront: "Upfront support before the PCI",
  shock: "Cardiogenic shock",
  arrest: "Cardiac arrest",
};

/** Generic device names (HANDOVER 6.5). */
export const DEVICE_LABEL: Record<SupportDevice, string> = {
  none: "No device",
  "change-plan": "No device is suitable: change the plan",
  iabp: "Intra-aortic balloon pump",
  microaxial: "Microaxial flow pump",
  "va-ecmo": "VA-ECMO",
  "right-sided": "Right-sided support",
  combined: "Left- and right-sided devices together",
};

/** The findings a learner can name as the one that decided the choice. */
export const FINDINGS = {
  "normal-low-risk": "Normal haemodynamics and a low-risk procedure",
  "high-risk-procedure": "A high-risk procedure with normal haemodynamics",
  "abnormal-haemodynamics": "Abnormal haemodynamics with a low-risk procedure",
  "both-axes": "Abnormal haemodynamics and a high-risk procedure",
  "mechanical-av": "Mechanical aortic valve",
  "lv-thrombus": "LV thrombus",
  "severe-ar": "Severe aortic regurgitation",
  "septal-defect": "Atrial or ventricular septal defect",
  "iliofemoral-adequate": "Iliofemoral route adequate for the pump",
  "iliofemoral-inadequate": "Iliofemoral route too small, calcified or tortuous, no alternative route",
  "alternative-route": "Femoral route unsuitable, alternative route available",
  "aortic-dissection": "Aortic dissection",
  "uncontrolled-bleeding": "Uncontrolled bleeding",
  "aortic-aneurysm": "Aortic aneurysm",
  "severe-pad": "Severe peripheral arterial disease",
  "hypoxaemia-despite-ventilation": "Hypoxaemia despite optimal oxygenation and ventilation",
  "hypoxaemia-not-optimised": "Hypoxaemia before oxygenation and ventilation are optimised",
  "rv-failure": "Isolated RV failure",
  "biventricular-failure": "Failure of both ventricles",
  "pre-shock-index": "Pre-shock with a preserved cardiac index",
  "severe-lv-shock": "Severe shock from LV failure",
  "refractory-shock": "Shock refractory to the first device",
  "cardiac-arrest": "Cardiac arrest",
} as const;
export type FindingId = keyof typeof FINDINGS;

/** A finding label set inside a sentence: the first letter lowered unless it opens an acronym (LV, RV). */
export function inSentence(label: string): string {
  if (label.length > 1 && label[1] === label[1].toUpperCase() && label[1] !== label[1].toLowerCase()) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

export interface SupportChoice {
  classification: SupportClass;
  device: SupportDevice;
  finding: FindingId | null;
  /** the learner stated the upfront-against-standby trade-off (CHIP-BCIS3) */
  tradeOffStated?: boolean;
}

// --- the algorithm ---------------------------------------------------------------

export interface ExpectedChoice {
  classifications: SupportClass[];
  devices: SupportDevice[];
  findings: FindingId[];
  /** both upfront and standby are accepted only with the trade-off stated */
  tradeOffRequired: boolean;
  /** the branches the algorithm took, for the debrief */
  path: string[];
}

export const papi = (r: { ra: number; paSys: number; paDia: number }): number => (r.ra > 0 ? (r.paSys - r.paDia) / r.ra : Infinity);
export const meanPressure = (bp: { sys: number; dia: number }): number => Math.round(bp.dia + (bp.sys - bp.dia) / 3);

/** Normal, abnormal but stable, shock or arrest (pm-support-choice-when Step 2, pm-support-choice-shock). */
export function haemodynamicState(p: SupportProfile): "normal" | "abnormal" | "shock" | "arrest" {
  const T = SUPPORT_THRESHOLDS;
  if (p.rhythm === "vf") return "arrest";
  const lowPressure = p.bp.sys < T.shockSystolic || p.onPressors;
  if (lowPressure && (p.lactate ?? 0) > T.shockLactate) return "shock";
  const r = p.rhc;
  if (r && (r.wedge > T.lvFailureWedge || papi(r) < T.rvFailurePapi || (r.wedge > T.oedemaWedge && r.svo2 < T.svo2Warn))) return "abnormal";
  return "normal";
}

export const isHighRisk = (p: SupportProfile): boolean => HIGH_RISK_PROCEDURES.includes(p.procedure);

/** The microaxial pump's contraindications in the algorithm, as findings. */
export function pumpContraindications(p: SupportProfile): FindingId[] {
  const out: FindingId[] = [];
  if (p.echo.mechanicalAv) out.push("mechanical-av");
  if (p.echo.lvThrombus) out.push("lv-thrombus");
  if (p.echo.ar === "severe") out.push("severe-ar");
  if (p.echo.asd || p.echo.vsd) out.push("septal-defect");
  return out;
}

/** Question 4: a balloon pump or VA-ECMO when the pump is contraindicated (pm-support-choice-which). */
function balloonOrEcmo(p: SupportProfile, path: string[]): { devices: SupportDevice[]; findings: FindingId[] } {
  const stop: FindingId[] = [];
  if (p.echo.ar === "severe") stop.push("severe-ar");
  if (p.aorticDissection) stop.push("aortic-dissection");
  if (p.bleeding === "uncontrolled") stop.push("uncontrolled-bleeding");
  if (stop.length) {
    path.push("Severe aortic regurgitation, aortic dissection or uncontrolled bleeding: no support option, change the plan");
    return { devices: ["change-plan"], findings: stop };
  }
  const devices: SupportDevice[] = [];
  if (!p.aorticAneurysm) devices.push("iabp");
  else path.push("Aortic aneurysm: no balloon pump");
  if (!p.severePad) devices.push("va-ecmo");
  else path.push("Severe peripheral arterial disease: no VA-ECMO");
  if (!devices.length) return { devices: ["change-plan"], findings: ["aortic-aneurysm", "severe-pad"] };
  path.push(`Balloon pump or VA-ECMO: ${devices.map((d) => DEVICE_LABEL[d]).join(" or ")}`);
  return { devices, findings: pumpContraindications(p) };
}

/** The device algorithm for a patient who needs (or may need) support and is not in shock. */
function deviceAlgorithm(p: SupportProfile, path: string[]): { devices: SupportDevice[]; findings: FindingId[] } {
  const ci = pumpContraindications(p);
  if (ci.length) {
    path.push(`Microaxial pump contraindicated: ${ci.map((f) => inSentence(FINDINGS[f])).join(", ")}`);
    return balloonOrEcmo(p, path);
  }
  const f = p.iliofemoral;
  if (f.minLumenMm > SUPPORT_THRESHOLDS.iliofemoralMinMm && !f.severeCalcium && !f.severeTortuosity) {
    path.push("No pump contraindication; iliofemoral route adequate: microaxial flow pump");
    return { devices: ["microaxial"], findings: ["iliofemoral-adequate"] };
  }
  if (p.alternativeRoute) {
    path.push("Femoral route unsuitable; alternative route available: microaxial flow pump by that route");
    return { devices: ["microaxial"], findings: ["alternative-route"] };
  }
  path.push("Femoral route unsuitable and no alternative route: balloon pump");
  return { devices: ["iabp"], findings: ["iliofemoral-inadequate"] };
}

/** What the algorithm accepts for this profile, and the finding that decides it. */
export function expectedChoice(p: SupportProfile): ExpectedChoice {
  const T = SUPPORT_THRESHOLDS;
  const path: string[] = [];
  const state = haemodynamicState(p);

  if (state === "arrest") {
    path.push("Cardiac arrest: VA-ECMO supports both the circulation and oxygenation");
    return { classifications: ["arrest"], devices: ["va-ecmo"], findings: ["cardiac-arrest"], tradeOffRequired: false, path };
  }

  if (state === "shock") {
    path.push("Cardiogenic shock: hypotension with hypoperfusion");
    if (p.hypoxaemic && p.ventilation === "optimised") {
      path.push("1. Hypoxaemia despite optimal oxygenation and ventilation: VA-ECMO");
      return { classifications: ["shock"], devices: ["va-ecmo"], findings: ["hypoxaemia-despite-ventilation"], tradeOffRequired: false, path };
    }
    const r = p.rhc;
    const rv = !!r && (r.ra > T.rvFailureRa || papi(r) < T.rvFailurePapi);
    const lv = !!r && r.wedge > T.lvFailureWedge;
    if (rv) {
      if (lv) {
        path.push("2. RV and LV failing: VA-ECMO, or left- and right-sided devices together");
        return { classifications: ["shock"], devices: ["va-ecmo", "combined"], findings: ["biventricular-failure"], tradeOffRequired: false, path };
      }
      path.push("2. RV failing, LV not: a right-sided device");
      return { classifications: ["shock"], devices: ["right-sided"], findings: ["rv-failure"], tradeOffRequired: false, path };
    }
    if (p.refractory) {
      path.push("3. Refractory LV shock: escalate to VA-ECMO");
      return { classifications: ["shock"], devices: ["va-ecmo"], findings: ["refractory-shock"], tradeOffRequired: false, path };
    }
    const ci = pumpContraindications(p);
    if ((p.ci ?? 0) > T.preShockIndex) {
      path.push("3. Pre-shock with a cardiac index above 2.0: a balloon pump may be enough, with monitoring");
      const devices: SupportDevice[] = ci.length ? ["iabp"] : ["iabp", "microaxial"];
      return { classifications: ["shock"], devices, findings: ["pre-shock-index"], tradeOffRequired: false, path };
    }
    if (ci.length) {
      // severe shock with the pump ruled out: a balloon pump is not enough, so VA-ECMO if it is possible
      path.push(`3. Severe LV shock, microaxial pump contraindicated (${ci.map((f) => inSentence(FINDINGS[f])).join(", ")}): VA-ECMO`);
      const q4 = balloonOrEcmo(p, path);
      const devices = q4.devices.filter((d) => d !== "iabp");
      return { classifications: ["shock"], devices: devices.length ? devices : ["change-plan"], findings: q4.findings, tradeOffRequired: false, path };
    }
    path.push("3. Severe shock from LV failure: microaxial flow pump");
    return { classifications: ["shock"], devices: ["microaxial"], findings: ["severe-lv-shock"], tradeOffRequired: false, path };
  }

  // not in shock: the two axes
  const abnormal = state === "abnormal";
  const high = isHighRisk(p);
  if (!abnormal && !high) {
    path.push("Normal haemodynamics, low-risk procedure: no support");
    return { classifications: ["none"], devices: ["none"], findings: ["normal-low-risk"], tradeOffRequired: false, path };
  }
  const both = abnormal && high;
  const classifications: SupportClass[] = both ? ["upfront", "standby"] : ["standby"];
  path.push(
    both
      ? "Abnormal haemodynamics with a high-risk procedure: upfront support or standby with the access in (Brilakis against CHIP-BCIS3), the trade-off stated"
      : abnormal
        ? "Abnormal haemodynamics, low-risk procedure: standby"
        : "Normal haemodynamics, high-risk procedure: standby"
  );
  const axis: FindingId = both ? "both-axes" : abnormal ? "abnormal-haemodynamics" : "high-risk-procedure";
  const dev = deviceAlgorithm(p, path);
  // the deciding finding is the contraindication when one decides the device, else the axes
  const findings: FindingId[] = pumpContraindications(p).length || dev.devices.includes("change-plan") ? dev.findings : [axis];
  return { classifications, devices: dev.devices, findings, tradeOffRequired: both, path };
}

/** The findings that place a patient on the two axes (pm-support-choice-when) rather than in device selection. */
export const AXIS_FINDINGS: readonly FindingId[] = ["normal-low-risk", "high-risk-procedure", "abnormal-haemodynamics", "both-axes"];

/**
 * The lesson that teaches a profile's decision, for the decision records: arrest in
 * pm-support-choice-cpr, shock in pm-support-choice-shock; otherwise whether to support
 * (pm-support-choice-when) when an axis finding decides it, and which device
 * (pm-support-choice-which) when a contraindication or the route does.
 */
export function choiceLesson(p: SupportProfile): "pm-support-choice-cpr" | "pm-support-choice-shock" | "pm-support-choice-when" | "pm-support-choice-which" {
  const state = haemodynamicState(p);
  if (state === "arrest") return "pm-support-choice-cpr";
  if (state === "shock") return "pm-support-choice-shock";
  return expectedChoice(p).findings.every((f) => AXIS_FINDINGS.includes(f)) ? "pm-support-choice-when" : "pm-support-choice-which";
}

// --- scoring ---------------------------------------------------------------------

/** Points for each part of the choice (scoring weights of the app, not clinical values). */
export const CHOICE_POINTS = { classification: 30, device: 50, finding: 20 } as const;

export interface ChoiceResult {
  score: number;
  passed: boolean;
  classificationOk: boolean;
  deviceOk: boolean;
  findingOk: boolean;
  /** critical errors, each named */
  critical: string[];
  /** why a wrong device is wrong, for the debrief */
  wrong: string[];
  expected: ExpectedChoice;
}

/** Score a learner's choice against the algorithm (full marks for an accepted choice and finding). */
export function scoreChoice(p: SupportProfile, c: SupportChoice): ChoiceResult {
  const T = SUPPORT_THRESHOLDS;
  const exp = expectedChoice(p);
  const state = haemodynamicState(p);
  const classInList = exp.classifications.includes(c.classification);
  const classificationOk = classInList && (!exp.tradeOffRequired || !!c.tradeOffStated);
  const deviceOk = exp.devices.includes(c.device);
  const findingOk = !!c.finding && exp.findings.includes(c.finding);

  const critical: string[] = [];
  const wrong: string[] = [];
  if (c.device === "microaxial" || c.device === "combined") {
    if (p.echo.mechanicalAv) critical.push("Microaxial flow pump with a mechanical aortic valve");
    if (p.echo.lvThrombus) critical.push("Microaxial flow pump with LV thrombus");
  }
  if (!deviceOk) {
    const r = p.rhc;
    const rvOnly = state === "shock" && !!r && (r.ra > T.rvFailureRa || papi(r) < T.rvFailurePapi) && r.wedge <= T.lvFailureWedge;
    if (rvOnly && (c.device === "iabp" || c.device === "microaxial")) wrong.push("A left-sided device cannot help isolated RV failure: it depends on the RV to fill");
    if (state === "shock" && c.device === "iabp" && (p.ci ?? 0) <= T.preShockIndex) wrong.push("A balloon pump is not enough for severe shock");
    if (c.device === "va-ecmo" && p.hypoxaemic && p.ventilation !== "optimised") wrong.push("VA-ECMO before oxygenation and ventilation have been optimised");
    if ((state === "arrest" || (state === "shock" && p.hypoxaemic && p.ventilation === "optimised")) && c.device !== "va-ecmo") wrong.push("Only VA-ECMO supports both the circulation and oxygenation here");
  }

  const P = CHOICE_POINTS;
  const score = (classificationOk ? P.classification : 0) + (deviceOk ? P.device : 0) + (findingOk ? P.finding : 0);
  return { score, passed: classificationOk && deviceOk && critical.length === 0, classificationOk, deviceOk, findingOk, critical, wrong, expected: exp };
}

/**
 * The tip events a profile shows before any device, from what is on the screen: VF in arrest,
 * hypotension below the shock systolic or on pressors, a ventilated patient, atrial fibrillation.
 * The classification itself (shock or not) is the learner's, so it is not raised.
 */
export function profileEvents(p: SupportProfile): LabEvent[] {
  const out: LabEvent[] = [];
  if (p.rhythm === "vf") out.push("vf");
  if (p.rhythm === "vf" || p.bp.sys < SUPPORT_THRESHOLDS.shockSystolic || p.onPressors) out.push("hypotension");
  if (p.ventilation === "optimised") out.push("ventilated");
  if (p.rhythm === "af") out.push("atrial-fibrillation");
  return out;
}

// --- the presets -----------------------------------------------------------------

const BASE = {
  rhythm: "sinus" as const,
  onPressors: false,
  ventilation: "room-air" as const,
  hypoxaemic: false,
  alternativeRoute: false,
  aorticDissection: false,
  aorticAneurysm: false,
  severePad: false,
  bleeding: "none" as const,
};
const CLEAN_ECHO = { mechanicalAv: false, lvThrombus: false, ar: "none" as ArGrade, asd: false, vsd: false };
const GOOD_ILIACS = { minLumenMm: 7, severeCalcium: false, severeTortuosity: false };

/**
 * The device-choice presets (scenario ids of src/content/lab/presets/mcs/core.launch.ts). The
 * numbers are case data written for these scenarios; the thresholds they are read against are the
 * module's (SUPPORT_THRESHOLDS).
 */
export const SELECT_PRESETS: readonly SupportProfile[] = [
  {
    ...BASE,
    id: "select-chip-lm",
    title: "Planned left main PCI with a poor ventricle",
    brief: "A 71-year-old man with breathlessness on minimal exertion and a known ejection fraction of 25% is booked for left main bifurcation PCI after the surgeons declined him. The right heart study has just been done.",
    age: 71,
    sex: "male",
    hr: 82,
    bp: { sys: 110, dia: 70 },
    lactate: 1.1,
    rhc: { ra: 9, paSys: 50, paDia: 29, wedge: 27, svo2: 46 },
    co: 3.6,
    ci: 1.9,
    spo2: 95,
    procedure: "unprotected-lm",
    anatomy: "Distal left main bifurcation disease, occluded RCA filling by collaterals",
    echo: { ...CLEAN_ECHO, lvef: 25, ar: "mild" },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-mech-av",
    title: "Left main atherectomy after valve surgery",
    brief: "A 74-year-old man with an ejection fraction of 20% needs left main PCI with atherectomy; the heart team has declined further surgery. He had his aortic valve replaced nine years ago.",
    age: 74,
    sex: "male",
    hr: 76,
    bp: { sys: 108, dia: 66 },
    lactate: 1.3,
    rhc: { ra: 10, paSys: 52, paDia: 30, wedge: 28, svo2: 52 },
    co: 3.8,
    ci: 2.0,
    spo2: 96,
    procedure: "atherectomy",
    anatomy: "Heavily calcified distal left main and proximal LAD, occluded RCA",
    echo: { ...CLEAN_ECHO, lvef: 20, mechanicalAv: true, note: "Normally functioning mechanical aortic prosthesis" },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-lv-thrombus",
    title: "PCI to the last remaining vessel after an anterior infarct",
    brief: "A 66-year-old woman, three weeks after a late-presenting anterior infarct, has recurrent angina at rest. The LAD and RCA are occluded; the circumflex is the last patent vessel with a tight proximal stenosis. Pre-procedure echo has been reported.",
    age: 66,
    sex: "female",
    hr: 88,
    bp: { sys: 104, dia: 64 },
    lactate: 1.4,
    rhc: { ra: 11, paSys: 48, paDia: 26, wedge: 24, svo2: 55 },
    co: 3.5,
    ci: 2.1,
    spo2: 95,
    procedure: "last-vessel",
    anatomy: "Occluded LAD and RCA; 90% proximal circumflex stenosis",
    echo: { ...CLEAN_ECHO, lvef: 25, lvThrombus: true, note: "Apical akinesis with a mobile apical thrombus" },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-severe-ar",
    title: "Retrograde CTO PCI in a breathless man with a diastolic murmur",
    brief: "A 69-year-old man with refractory angina is booked for retrograde CTO PCI of the RCA through septal collaterals. He has a soft early diastolic murmur. The right heart study and echo are back.",
    age: 69,
    sex: "male",
    hr: 70,
    bp: { sys: 142, dia: 48 },
    lactate: 1.0,
    rhc: { ra: 8, paSys: 46, paDia: 24, wedge: 22, svo2: 60 },
    co: 4.6,
    ci: 2.4,
    spo2: 96,
    procedure: "retrograde-cto",
    anatomy: "Long RCA CTO, septal collaterals from the LAD",
    echo: { ...CLEAN_ECHO, lvef: 40, ar: "severe", note: "Severe aortic regurgitation with holodiastolic flow reversal in the descending aorta" },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-biv-hypoxaemia",
    title: "Extensive anterior STEMI, shocked and hypoxaemic",
    brief: "A 58-year-old man with an extensive anterior STEMI is cold, confused and hypotensive on noradrenaline. He was intubated for pulmonary oedema and is ventilated on FiO₂ 1.0 with high PEEP after recruitment. A right heart catheter is in.",
    age: 58,
    sex: "male",
    hr: 118,
    bp: { sys: 78, dia: 52 },
    onPressors: true,
    lactate: 6.2,
    rhc: { ra: 17, paSys: 34, paDia: 25, wedge: 28, svo2: 41 },
    co: 2.9,
    ci: 1.4,
    spo2: 83,
    ventilation: "optimised",
    hypoxaemic: true,
    procedure: "primary-pci",
    anatomy: "Proximal LAD occlusion",
    echo: { ...CLEAN_ECHO, lvef: 15, note: "Severe LV and RV dysfunction" },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-simple-lesion",
    title: "Stable angina with a focal RCA lesion",
    brief: "A 61-year-old woman with exertional angina on two drugs is having PCI to a focal mid-RCA stenosis. She has no heart failure symptoms; the echo and right heart numbers were checked at the start.",
    age: 61,
    sex: "female",
    hr: 64,
    bp: { sys: 132, dia: 78 },
    lactate: 0.9,
    rhc: { ra: 5, paSys: 24, paDia: 10, wedge: 9, svo2: 72 },
    co: 5.2,
    ci: 2.9,
    spo2: 98,
    procedure: "simple",
    anatomy: "Focal 80% mid-RCA stenosis, normal left system",
    echo: { ...CLEAN_ECHO, lvef: 60 },
    iliofemoral: GOOD_ILIACS,
  },
  {
    ...BASE,
    id: "select-arrest",
    title: "VF arrest during primary PCI",
    brief: "A 49-year-old man in VF since the wire crossed his proximal LAD occlusion. Four shocks have failed; a mechanical compression device is running and an airway is secured. Both groins are free.",
    age: 49,
    sex: "male",
    rhythm: "vf",
    hr: 0,
    bp: { sys: 0, dia: 0 },
    lactate: 7.5,
    spo2: 0,
    ventilation: "optimised",
    hypoxaemic: false,
    procedure: "primary-pci",
    anatomy: "Proximal LAD occlusion, wire across",
    echo: { ...CLEAN_ECHO, lvef: 0, note: "Not available" },
    iliofemoral: GOOD_ILIACS,
  },
];

export const SELECT_PRESET_BY_ID: Readonly<Record<string, SupportProfile>> = Object.fromEntries(SELECT_PRESETS.map((p) => [p.id, p]));
export const isSelectPreset = (id: string): boolean => id in SELECT_PRESET_BY_ID;

// --- session scoring -------------------------------------------------------------

/**
 * Criteria for scoring a console session (replaces the floored scores the consoles kept before:
 * Math.max(40, ...) and Math.max(50, ...)). Weights are scoring parameters of the app.
 */
export const SESSION_POINTS = { targets: 60, harmFree: 25, perHarm: 10, efficiency: 15, perExtraMove: 5, perCritical: 30 } as const;

export interface McsSessionInput {
  /** every target held for the hold time */
  targetsMet: boolean;
  /** harmful episodes during the run (suction, drainage chatter, retrograde circuit flow) */
  harms: number;
  criticalErrors: number;
  /** adjustments beyond the expected number (the balloon pump timing cases) */
  extraMoves?: number;
}

export interface McsSessionScore {
  score: number;
  passed: boolean;
  criteria: { targets: number; harmFree: number; efficiency: number; critical: number };
}

/** Criteria-based session score: no floor; a session with any critical error fails. */
export function scoreMcsSession(i: McsSessionInput): McsSessionScore {
  const P = SESSION_POINTS;
  const targets = i.targetsMet ? P.targets : 0;
  const harmFree = Math.max(0, P.harmFree - P.perHarm * Math.max(0, i.harms));
  const efficiency = Math.max(0, P.efficiency - P.perExtraMove * Math.max(0, i.extraMoves ?? 0));
  const critical = -P.perCritical * Math.max(0, i.criticalErrors);
  const score = Math.min(100, Math.max(0, targets + harmFree + efficiency + critical));
  return { score, passed: i.targetsMet && i.criticalErrors === 0, criteria: { targets, harmFree, efficiency, critical } };
}
