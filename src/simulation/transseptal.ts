// ===========================================================================
// Transseptal puncture by hand (structural-transseptal-hands-on).
//
// Shared by TEER, LAAO and, when their labs exist, PMC and the septal occluder. The learner holds
// the needle arrow and the sheath side arm as one, sets the arrow on a clock face, pulls the system
// down from the SVC (a jump into the right atrium, a second into the fossa, atrial ectopics as the
// tip catches the superior rim), reads the tent in the bicaval, short-axis and four-chamber views
// and moves the contact point. Rotation alone spins the sheath without moving the contact point:
// the turn is stored as torque in the system and is expressed only when the system is pulled back
// slightly, so clockwise with a slight withdrawal moves the tent posterior; withdrawal alone moves it
// inferior. Then the crossing: the tip pressure, aspiration, a contrast puff and TOE (four
// confirmations before the dilator moves), heparin and the ACT, air at the hub, and the branches
// the module teaches: aortic puncture, the septal (Bezold–Jarisch-like) reflex, a posterior exit
// with delayed tamponade, a thick septum that will not cross with force, a floppy septum that loses
// height, and a sheath that will not follow the dilator.
//
// Source: lessons hb-mitral-tricuspid-laa-ts-setup and hb-mitral-tricuspid-laa-ts-cross
// (src/content/manual/cath-handbook/08-mitral-tricuspid-laa.ts), which cite Russo 2021, the
// EHRA/EAPCI LAAO consensus 2020, Hausleiter 2023, Oxford ch 4 and Brilakis 14.6. Every geometric
// constant, time constant and haemodynamic magnitude below that the module does not state is a
// MODEL PARAMETER, labelled where it is defined. This is a teaching model, not a predictor.
//
// The fossa point, the height and the site assessment that TEER and LAAO score (FossaPoint,
// septalHeightCm, assessTransseptal) moved here from teer.ts unchanged; teer.ts re-exports them.
// ===========================================================================

import type { MrEtiology } from "./teer";
import { HEPARIN_VD_L_PER_KG, MP_ACT_SLOPE_S_PER_U_ML, heparinHalfLifeS } from "./patient/pharmacology";
import { INITIAL_PATIENT_EVENT_STATE, PATIENT_EVENT_THRESHOLDS, patientEvents, type PatientEventState, type PatientVitals } from "../ui/lab/patientEvents";
import type { LabEvent } from "../content/lab/tips";

// ---------------------------------------------------------------------------
// The fossa point and the site assessment (moved from teer.ts, unchanged)
// ---------------------------------------------------------------------------

/** Position on the fossa ovalis: si +1 superior … −1 inferior; ap +1 anterior … −1 posterior. */
export interface FossaPoint {
  si: number;
  ap: number;
}

export type TransseptalProcedure = "teer" | "laao";

export interface TransseptalResult {
  heightCm: number;
  quality: "ideal" | "acceptable" | "poor";
  danger: boolean;
  flags: { tone: "good" | "warn" | "danger"; text: string }[];
  /** LAAO: sheath approaches the appendage along its axis */
  coaxialForLaa: boolean;
}

/**
 * Height targets (docs/SIM_FACTS.md item 8): about 4.0–4.5 cm above the
 * annulus, at least 4 cm in degenerative MR; lower heights (about 3–3.5 cm)
 * are acceptable in functional MR because the tethered coaptation point lies
 * below the annulus. Posterior, mid-to-superior on the fossa.
 */
export const TEER_HEIGHT_TEXT =
  "Commonly taught TEER height is about 4.0–4.5 cm above the mitral annular plane: at least 4 cm in degenerative MR, lower (about 3–3.5 cm) acceptable in functional MR. Approximate; device- and anatomy-dependent.";

export const TEER_HEIGHT_TARGET: Record<MrEtiology, [number, number]> = {
  degenerative: [4.0, 4.5],
  functional: [3.5, 4.5],
};

/** Height above the mitral annular plane in the four-chamber view. Superior and posterior punctures are higher. */
export function septalHeightCm(baseCm: number, p: FossaPoint): number {
  return baseCm + 0.9 * p.si - 0.5 * p.ap;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function assessTransseptal(
  procedure: TransseptalProcedure,
  p: FossaPoint,
  baseCm: number,
  heightTarget: [number, number] = TEER_HEIGHT_TARGET.degenerative
): TransseptalResult {
  const heightCm = septalHeightCm(baseCm, p);
  const flags: TransseptalResult["flags"] = [];
  let danger = false;
  if (p.ap > 0.5) {
    danger = true;
    flags.push({ tone: "danger", text: "Anterior tenting beside the aortic root: risk of aortic puncture." });
  }
  if (p.si > 0.85) {
    danger = true;
    flags.push({ tone: "danger", text: "Very superior: infolded wall between the SVC and right upper pulmonary vein; the needle can exit the heart." });
  }
  if (p.ap < -0.85) {
    danger = true;
    flags.push({ tone: "danger", text: "Very posterior: close to the posterior free wall." });
  }
  if (p.si < -0.85) {
    danger = true;
    flags.push({ tone: "danger", text: "Very inferior: close to the IVC orifice and coronary sinus." });
  }
  const midSuperior = p.si >= 0 && p.si <= 0.75;
  const inferior = p.si <= -0.1;
  const posterior = p.ap <= -0.05;
  let quality: TransseptalResult["quality"];
  if (procedure === "teer") {
    const inBand = heightCm >= heightTarget[0] && heightCm <= heightTarget[1];
    const nearBand = heightCm >= heightTarget[0] - 0.5 && heightCm <= heightTarget[1] + 0.5;
    if (midSuperior && posterior) flags.push({ tone: "good", text: "Posterior and mid-to-superior: the usual TEER site." });
    else if (!posterior) flags.push({ tone: "warn", text: "Not posterior: a central or anterior puncture aims the guide towards the aorta rather than down to the valve." });
    else flags.push({ tone: "warn", text: "TEER prefers a posterior, mid-to-superior site, giving room and a coaxial line down to the valve." });
    if (inBand) flags.push({ tone: "good", text: `Height ${heightCm.toFixed(1)} cm, within the ${heightTarget[0]}–${heightTarget[1]} cm target for this anatomy.` });
    else if (heightCm < heightTarget[0])
      flags.push({ tone: "warn", text: `Height ${heightCm.toFixed(1)} cm: low, leaving little room to steer down onto the leaflets.` });
    else flags.push({ tone: "warn", text: `Height ${heightCm.toFixed(1)} cm: high, making it harder to reach and align at the valve.` });
    quality = !danger && midSuperior && posterior && inBand ? "ideal" : !danger && nearBand ? "acceptable" : "poor";
  } else {
    if (inferior && posterior) flags.push({ tone: "good", text: "Inferior and posterior: coaxial with the anteriorly and superiorly directed appendage." });
    else flags.push({ tone: "warn", text: "LAAO prefers an inferior and posterior site; a superior puncture approaches the appendage at an angle." });
    quality = !danger && inferior && posterior ? "ideal" : !danger && p.si <= 0.3 ? "acceptable" : "poor";
  }
  return { heightCm, quality, danger, flags, coaxialForLaa: inferior && posterior && !danger };
}

// ---------------------------------------------------------------------------
// Hosts, variants and presets
// ---------------------------------------------------------------------------

/** The procedure the puncture is for (the tip context reports it with "transseptal"). */
export type TsHost = "teer" | "laao" | "pmc" | "septal-occluder";

export const TS_HOST_LABEL: Record<TsHost, string> = {
  teer: "edge-to-edge repair",
  laao: "appendage occlusion",
  pmc: "mitral commissurotomy",
  "septal-occluder": "septal closure",
};

export type SeptumKind = "normal" | "thick" | "floppy";

export interface TsVariant {
  id: string;
  title: string;
  /** synthetic teaching vignette (what the operator knows before starting) */
  vignette: string;
  septum: SeptumKind;
  /**
   * A crossing site further anterior than this (fossa ap) enters the aortic root instead of the
   * left atrium. MODEL PARAMETER: 0.5 matches the danger zone assessTransseptal flags; a dilated root
   * that hugs the fossa moves it posteriorly.
   */
  aorticAp: number;
  /**
   * A crossing site further posterior than this (fossa ap), or above si 0.85 (the infolded wall
   * assessTransseptal flags), passes through the pericardial space (Russo: a puncture at the border
   * of the fossa with the muscular septum). MODEL PARAMETER: −0.85 matches the posterior danger flag.
   */
  posteriorExitAp: number;
  /** a septal (Bezold–Jarisch-like) reflex follows the crossing */
  vagal: boolean;
  /** pacing leads run through the SVC and right atrium; the wire to the SVC starts anterior to them */
  pacingLeads: boolean;
  /** the sheath does not follow the dilator at the dilator–sheath step */
  sheathResists: boolean;
  /** what the stage tells the learner in guided mode (never shown in exam) */
  focus: string;
}

const BASE_VARIANT: Omit<TsVariant, "id" | "title" | "vignette" | "focus"> = {
  septum: "normal",
  aorticAp: 0.5,
  posteriorExitAp: -0.85,
  vagal: false,
  pacingLeads: false,
  sheathResists: false,
};

/** The variant TEER and LAAO run when no transseptal preset is chosen. */
export const STANDARD_VARIANT: TsVariant = {
  ...BASE_VARIANT,
  id: "standard",
  title: "Standard septum",
  vignette: "Normal-sized atria, a thin fossa and no devices in the right heart.",
  focus: "Orient, pull down, tent posteriorly at the height you need, confirm the left atrium four ways and secure it.",
};

/** The transseptal presets (dev-lab presets of the TEER lab; src/content/lab/presets/structural/transseptal.launch.ts). */
export interface TsPreset {
  id: string;
  /** the TEER scenario whose valve and atrium the drill uses (height base and target) */
  teerScenario: string;
  variant: TsVariant;
}

export const TS_PRESETS: readonly TsPreset[] = [
  { id: "ts-standard", teerScenario: "teer-p2-flail", variant: { ...STANDARD_VARIANT, id: "ts-standard", title: "Transseptal puncture for TEER" } },
  {
    id: "ts-thick-septum",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-thick-septum",
      title: "Thick septum after surgery and radiotherapy",
      vignette: "Synthetic teaching case. Previous mitral surgery and chest radiotherapy; TOE shows a thick, echo-bright fossa.",
      septum: "thick",
      sheathResists: true,
      focus: "A thick septum stores force and the system overshoots once through. Choose RF or a sharp wire; protect the back wall with a wire before escalating on the sheath.",
    },
  },
  {
    id: "ts-floppy-septum",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-floppy-septum",
      title: "Floppy, aneurysmal septum",
      vignette: "Synthetic teaching case. TOE shows a mobile, aneurysmal interatrial septum bowing into both atria.",
      septum: "floppy",
      focus: "A floppy septum loses height while devices are steered: puncture higher than usual for mitral work.",
    },
  },
  {
    id: "ts-aortic-puncture",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-aortic-puncture",
      title: "Dilated aortic root",
      vignette: "Synthetic teaching case. Dilated ascending aorta; the aortic root bulges against the anterior fossa on the short-axis view.",
      // MODEL PARAMETER: the root hugs the fossa, so a central or anterior tent lies against it
      aorticAp: -0.3,
      focus: "The root lies against the anterior fossa. Read the short-axis view before crossing; read the tip pressure before the dilator moves.",
    },
  },
  {
    id: "ts-vagal",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-vagal",
      title: "Routine TEER work-up, no previous surgery",
      vignette: "Synthetic teaching case. Routine TEER work-up; no previous cardiac surgery.",
      vagal: true,
      focus: "Watch the monitor after the needle crosses, and look before you act.",
    },
  },
  {
    id: "ts-delayed-tamponade",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-delayed-tamponade",
      title: "Large atrium, posterior target",
      vignette: "Synthetic teaching case. A large left atrium; the posterior fossa borders the muscular septum closely.",
      // MODEL PARAMETER: the fossa's posterior border is close, so a usual posterior TEER site exits
      posteriorExitAp: -0.3,
      focus: "An uneventful puncture does not prove safety. Before the catheters come out, decide how you will watch for a posterior exit.",
    },
  },
  {
    id: "ts-pacing-lead",
    teerScenario: "teer-p2-flail",
    variant: {
      ...BASE_VARIANT,
      id: "ts-pacing-lead",
      title: "Dual-chamber pacemaker",
      vignette: "Synthetic teaching case. A dual-chamber pacemaker with right atrial and right ventricular leads.",
      pacingLeads: true,
      focus: "Keep the wire to the SVC posterior to the leads: check it in LAO, where it should lie to the right of them.",
    },
  },
];

export function transseptalPreset(id: string | null | undefined): TsPreset | undefined {
  return id ? TS_PRESETS.find((p) => p.id === id) : undefined;
}

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** Pull-down geometry and contact mechanics. All MODEL PARAMETERS. */
export const TS_MECH = {
  /** withdrawal from the start in the SVC at which the tip drops into the right atrium, mm */
  svcEndMm: 20,
  /** the first jump (SVC to right atrium), mm */
  jump1Mm: 8,
  /** withdrawal at which a septally pointed tip drops into the fossa, mm */
  fossaMm: 40,
  /** the second jump (onto the fossa), mm */
  jump2Mm: 4,
  /** a tip not pointed at the septum slides down the free wall into the IVC at this withdrawal, mm */
  ivcMm: 75,
  /** the arrow points at the septum between these clock hours (noon to the ceiling, 6 to the floor) */
  septalSector: [3.5, 7.5] as [number, number],
  /** where the tip first touches the fossa: its superior rim (si) */
  engageSi: 0.75,
  /** the superior rim, where atrial ectopics are common (si above this) */
  rimSi: 0.6,
  /** how long atrial ectopics run after the tip catches the rim, s */
  ectopyS: 6,
  /** fossa ap from the clock hour on engagement: ap = −(h − apClockCentre) · apPerHour */
  apClockCentre: 4.5,
  apPerHour: 0.4,
  /** withdrawal moves the contact point inferior by this per mm */
  siPerMmPull: 0.06,
  /** advancing moves it superior by this per mm, and deepens the tent */
  siPerMmPush: 0.03,
  /** stored rotation moves the contact point by this (ap) per degree when released (clockwise → posterior) */
  apPerDeg: 0.012,
  /** a slight withdrawal of this many mm releases all stored rotation */
  releaseMm: 2,
  /** most rotation the system stores before the sheath simply spins, degrees */
  torqueMaxDeg: 120,
  /** the tip slips off the inferior rim of the fossa into the IVC below this si */
  slipSi: -0.95,
  /** the arrow reads this many hours clockwise of the tip when arrow and side arm are not aligned */
  misalignH: 1.2,
  /** tent depth on first contact, per mm advanced, and its maximum, mm (floppy septum: deeper) */
  tentStartMm: 4,
  tentPerMm: 1.5,
  tentMaxMm: { normal: 12, thick: 14, floppy: 22 } as Record<SeptumKind, number>,
  /** a floppy septum loses this much si (height) while devices are steered after the crossing */
  floppyLossSi: 0.45,
} as const;

/** Monitor model of the patient. All MODEL PARAMETERS unless a source is given. */
export const TS_PATIENT = {
  weightKg: 75,
  hr: 72,
  sys: 124,
  dia: 68,
  /**
   * The septal reflex: inferior ST elevation, hypotension, bradycardia and sweating that settle
   * within minutes (Russo, lesson hb-mitral-tricuspid-laa-ts-cross). Onset, plateau and the end of
   * recovery, s after the crossing, and the depth of each change: MODEL PARAMETERS.
   */
  vagal: { onsetS: 20, plateauS: 90, endS: 180, hrDrop: 30, sysDrop: 45, diaDrop: 25, stMm: 2 },
  /** atropine shortens the bradycardia: the remaining rate drop is multiplied by this */
  atropineHrFactor: 0.3,
  /** air embolised into the right coronary: ST elevation that persists, and slow recovery, s */
  airEmbolism: { onsetS: 15, resolveS: 600, stMm: 2.5, sysDrop: 30, diaDrop: 15, hrRise: 10 },
  /** pericardial blood: volume where the pressure starts to fall, and the span to full tamponade, mL */
  tamponade: { startMl: 60, spanMl: 120, sysDrop: 60, diaDrop: 25, hrRise: 35 },
  /** bleeding into the pericardium, mL/s: sheath or dilator in the aorta, a hole in the LA wall, a posterior exit */
  bleed: { aorticSheath: 3, laWall: 0.8, posteriorExit: 0.6 },
  /** volume left after pericardiocentesis, mL */
  drainedMl: 10,
  /** a fluid bolus lifts the pressure by this for this long */
  fluids: { sysRise: 10, diaRise: 5, s: 180 },
  /** baseline ACT, s (the 120 s baseline pharmacology.ts is calibrated with) */
  baselineActS: 120,
} as const;

/** Time each action takes, s. MODEL PARAMETERS. */
export const TS_ACTION_S = {
  setup: 20,
  rotate: 2,
  pull: 2,
  toSvc: 60,
  needle: 5,
  check: 10,
  dilator: 15,
  sheath: 20,
  wire: 30,
  heparin: 10,
  act: 60,
  removeNeedle: 20,
  flush: 15,
  surgeon: 10,
  echo: 10,
  drug: 10,
  fluids: 30,
  drain: 120,
  close: 300,
  remove: 30,
} as const;

/**
 * Anticoagulation: heparin on entering the left atrium (Brilakis 14.6), to an ACT of at least 250 s
 * (LAAO consensus; 250–300 s Russo), 70–100 U/kg (consensus; Russo 100 U/kg), with about 2,000 U
 * early as one approach (Russo). Lesson hb-mitral-tricuspid-laa-ts-cross and ts-setup.
 */
export const TS_HEPARIN = {
  actTargetS: 250,
  actRangeS: [250, 300] as [number, number],
  earlyU: 2000,
  fullUPerKg: [70, 100] as [number, number],
  /** "on entering" the left atrium: the full dose within this many s of the crossing (MODEL PARAMETER) */
  onEntryS: 60,
  /** "reach a therapeutic ACT quickly": a measured ACT in range within this many s (MODEL PARAMETER) */
  inRangeWithinS: 300,
} as const;

/** Tip pressure as the needle trace shows it (Oxford ch 4: LA v slightly taller than a; RA a above v). MODEL PARAMETER magnitudes, mmHg. */
export const TS_TRACES = {
  la: { a: 10, v: 13, mean: 9 },
  ra: { a: 8, v: 6, mean: 5 },
  aortic: { sys: 124, dia: 68, mean: 87 },
} as const;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type TsStage = "setup" | "pulldown" | "fossa" | "crossed" | "secured" | "finish" | "recovery" | "done" | "abandoned";
/** Where blood is entering the pericardium from. */
export type BleedSource = "aorta" | "la-wall" | "posterior-exit";
export type TipZone = "svc" | "ra" | "fossa" | "ivc";
/** Where the needle tip is (hidden: the learner reads it from the checks). */
export type NeedleSite = "none" | "la" | "aorta";
export type TraceKind = "la" | "ra" | "aortic" | "none";
export type CrossTool = "needle" | "rf" | "sharp-wire";
export type ConfirmCheck = "toe" | "aspirate" | "pressure" | "contrast";
export const CONFIRM_CHECKS: readonly ConfirmCheck[] = ["toe", "aspirate", "pressure", "contrast"];

export interface TsLogEntry {
  t: number;
  text: string;
  tone?: "good" | "warn" | "danger";
}

export interface TsState {
  variant: TsVariant;
  host: TsHost;
  /** lab time, s */
  t: number;
  stage: TsStage;
  // set-up
  aligned: boolean;
  /** where the arrow on the needle hub points, clock hours (noon to the ceiling, 6 to the floor) */
  clockH: number;
  /** pacing leads: the wire's course relative to them, and whether it was checked in LAO */
  wire: "posterior" | "anterior";
  laoChecked: boolean;
  // pull-down
  depthMm: number;
  zone: TipZone;
  jumps: { t: number; into: "ra" | "fossa" }[];
  ectopyUntil: number;
  ivcDrops: number;
  pulldowns: number;
  contact: FossaPoint | null;
  storedTorqueDeg: number;
  tentMm: number;
  // crossing
  tool: CrossTool;
  forcedPushes: number;
  needle: NeedleSite;
  /** crossings that entered the aortic root (kept when the needle is withdrawn and the fossa re-crossed) */
  aorticCrossings: number;
  /** the needle passed through the pericardial space (silent until the catheters come out) */
  posteriorExit: boolean;
  crossT: number | null;
  /** the contact point at the moment of crossing */
  crossedAt: FossaPoint | null;
  checks: ConfirmCheck[];
  /** the learner's reading of the tip pressure trace */
  traceRead: TraceKind | null;
  dilator: "ra" | "la" | "aorta";
  sheath: "ra" | "la";
  needleOut: boolean;
  /** a J wire parked deep in a pulmonary vein through the dilator (before escalating) */
  pvWire: boolean;
  /** the 0.032-inch wire in the left superior pulmonary vein after the needle is out */
  lspvWire: boolean;
  sheathTries: number;
  // anticoagulation
  heparin: { t: number; u: number }[];
  acts: { t: number; s: number }[];
  // air
  air: "none" | "in-sheath" | "embolised";
  airT: number | null;
  // haemodynamics
  pericardialMl: number;
  bleeds: BleedSource[];
  vagalT: number | null;
  atropineT: number | null;
  fluidsT: number | null;
  /** TOE looked at, s (an effusion shows only while an echo is being looked at) */
  echoT: number | null;
  drains: number;
  breachClosed: boolean;
  surgeonCalled: boolean;
  aorticWithdrawn: boolean;
  // finish
  /** a wire was left across the septum when the left atrial catheters came out */
  wireLeftAcross: boolean;
  /** when that wire was removed */
  wireOutT: number | null;
  cathetersOutT: number | null;
  watchedS: number;
  /** the hypotension hold of the shared patient-event rules, carried in lab time */
  pe: PatientEventState;
  critical: string[];
  log: TsLogEntry[];
}

export interface TsOptions {
  variant?: TsVariant;
  host?: TsHost;
  /** the arrow's starting clock hour (default 12: as loaded, before the learner orients it) */
  clockH?: number;
}

export function createTransseptal(o: TsOptions = {}): TsState {
  const variant = o.variant ?? STANDARD_VARIANT;
  return {
    variant,
    host: o.host ?? "teer",
    t: 0,
    stage: "setup",
    aligned: false,
    clockH: o.clockH ?? 12,
    wire: variant.pacingLeads ? "anterior" : "posterior",
    laoChecked: false,
    depthMm: 0,
    zone: "svc",
    jumps: [],
    ectopyUntil: -1,
    ivcDrops: 0,
    pulldowns: 0,
    contact: null,
    storedTorqueDeg: 0,
    tentMm: 0,
    tool: "needle",
    forcedPushes: 0,
    needle: "none",
    aorticCrossings: 0,
    posteriorExit: false,
    crossT: null,
    crossedAt: null,
    checks: [],
    traceRead: null,
    dilator: "ra",
    sheath: "ra",
    needleOut: false,
    pvWire: false,
    lspvWire: false,
    sheathTries: 0,
    heparin: [],
    acts: [],
    air: "none",
    airT: null,
    pericardialMl: 0,
    bleeds: [],
    vagalT: null,
    atropineT: null,
    fluidsT: null,
    echoT: null,
    drains: 0,
    breachClosed: false,
    surgeonCalled: false,
    aorticWithdrawn: false,
    wireLeftAcross: false,
    wireOutT: null,
    cathetersOutT: null,
    watchedS: 0,
    pe: { ...INITIAL_PATIENT_EVENT_STATE },
    critical: [],
    log: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers the views and the tests read
// ---------------------------------------------------------------------------

export const normClock = (h: number) => {
  const x = ((h % 12) + 12) % 12;
  return x === 0 ? 12 : x;
};

/** The clock hour the tip actually points to (the arrow is misleading unless aligned with the side arm). */
export function tipClockH(s: Pick<TsState, "clockH" | "aligned">): number {
  return normClock(s.aligned ? s.clockH : s.clockH - TS_MECH.misalignH);
}

export function pointsAtSeptum(h: number): boolean {
  const x = normClock(h);
  return x >= TS_MECH.septalSector[0] && x <= TS_MECH.septalSector[1];
}

export function apFromClock(h: number): number {
  return clamp(-(normClock(h) - TS_MECH.apClockCentre) * TS_MECH.apPerHour, -0.9, 0.9);
}

/** "5:30" for 5.5 hours. */
export function clockLabel(h: number): string {
  const x = normClock(h);
  let hh = Math.floor(x);
  let mm = Math.round((x - hh) * 60);
  if (mm === 60) {
    hh += 1;
    mm = 0;
  }
  return `${hh === 0 ? 12 : hh}:${String(mm).padStart(2, "0")}`;
}

/** Whether the four confirmations have all been done. */
export function fourConfirmations(s: Pick<TsState, "checks">): boolean {
  return CONFIRM_CHECKS.every((c) => s.checks.includes(c));
}

/** The left atrium has been entered (needle across in the LA). */
export function laEntered(s: Pick<TsState, "needle">): boolean {
  return s.needle === "la";
}

/** Heparin given, U, by time t. */
export function heparinGivenU(s: Pick<TsState, "heparin">, t = Infinity): number {
  return s.heparin.filter((h) => h.t <= t).reduce((a, h) => a + h.u, 0);
}

/**
 * ACT at time t from the heparin given, s: plasma level from the volume of distribution, a
 * level-dependent half-life and the ACT slope of src/simulation/patient/pharmacology.ts (its
 * calibration: 100 U/kg gives about 320 s at 10 min from a 120 s baseline).
 */
export function actAt(s: Pick<TsState, "heparin">, t: number, weightKg: number = TS_PATIENT.weightKg): number {
  const doses = s.heparin.filter((h) => h.t <= t).sort((a, b) => a.t - b.t);
  if (!doses.length) return TS_PATIENT.baselineActS;
  const volMl = HEPARIN_VD_L_PER_KG * weightKg * 1000;
  let u = 0;
  let now = doses[0].t;
  let i = 0;
  for (;;) {
    while (i < doses.length && doses[i].t <= now) u += doses[i++].u;
    if (now >= t) break;
    const next = Math.min(t, i < doses.length ? doses[i].t : t, now + 30);
    u *= Math.exp((-Math.LN2 * (next - now)) / heparinHalfLifeS(u / volMl));
    now = next;
  }
  return TS_PATIENT.baselineActS + MP_ACT_SLOPE_S_PER_U_ML * (u / volMl);
}

export function lastAct(s: Pick<TsState, "acts">): { t: number; s: number } | null {
  return s.acts.length ? s.acts[s.acts.length - 1] : null;
}

/** The fossa point the host procedure inherits: where the septum was crossed, with the height a floppy septum loses. */
export function transseptalPoint(s: Pick<TsState, "crossedAt" | "contact" | "variant">): FossaPoint | null {
  const p = s.crossedAt ?? s.contact;
  if (!p) return null;
  if (s.variant.septum === "floppy" && s.crossedAt) return { si: clamp(p.si - TS_MECH.floppyLossSi, -1, 1), ap: p.ap };
  return { ...p };
}

/** The fossa point as the TOE views show it now (the tent, or the crossing site once across). */
export function shownPoint(s: Pick<TsState, "crossedAt" | "contact">): FossaPoint | null {
  return s.crossedAt ?? s.contact;
}

// ---------------------------------------------------------------------------
// The monitor
// ---------------------------------------------------------------------------

export interface TsVitals {
  t: number;
  hr: number;
  sys: number;
  dia: number;
  map: number;
  /** inferior-lead ST shift, mm */
  stMm: number;
  rhythm: "sinus" | "sinus with atrial ectopics";
  sweating: boolean;
  pericardialMl: number;
}

const ramp = (x: number, a: number) => clamp(x / a, 0, 1);

export function vitalsAt(s: TsState, t = s.t): TsVitals {
  const P = TS_PATIENT;
  let hr: number = P.hr;
  let sys: number = P.sys;
  let dia: number = P.dia;
  let st = 0;
  let sweating = false;
  if (s.vagalT !== null && t >= s.vagalT) {
    const V = P.vagal;
    const x = t - s.vagalT;
    const amp = x < V.onsetS ? x / V.onsetS : x < V.plateauS ? 1 : x < V.endS ? 1 - (x - V.plateauS) / (V.endS - V.plateauS) : 0;
    const hrAmp = s.atropineT !== null && t >= s.atropineT ? amp * P.atropineHrFactor : amp;
    hr -= V.hrDrop * hrAmp;
    sys -= V.sysDrop * amp;
    dia -= V.diaDrop * amp;
    st += V.stMm * amp;
    sweating = amp > 0.3;
  }
  if (s.air === "embolised" && s.airT !== null && t >= s.airT) {
    const A = P.airEmbolism;
    const y = t - s.airT;
    const a = y < A.onsetS ? y / A.onsetS : Math.max(0, 1 - (y - A.onsetS) / A.resolveS);
    st += A.stMm * a;
    sys -= A.sysDrop * a;
    dia -= A.diaDrop * a;
    hr += A.hrRise * a;
  }
  const T = P.tamponade;
  const f = ramp(s.pericardialMl - T.startMl, T.spanMl);
  sys -= T.sysDrop * f;
  dia -= T.diaDrop * f;
  hr += T.hrRise * f;
  if (s.fluidsT !== null && t >= s.fluidsT && t - s.fluidsT < P.fluids.s) {
    sys += P.fluids.sysRise;
    dia += P.fluids.diaRise;
  }
  sys = Math.max(40, sys);
  dia = Math.max(25, Math.min(dia, sys - 10));
  const map = dia + (sys - dia) / 3;
  return {
    t,
    hr: Math.round(hr),
    sys: Math.round(sys),
    dia: Math.round(dia),
    map: Math.round(map),
    stMm: Math.round(st * 10) / 10,
    rhythm: t < s.ectopyUntil ? "sinus with atrial ectopics" : "sinus",
    sweating,
    pericardialMl: s.pericardialMl,
  };
}

/** The vitals in the shared patient-event shape (src/ui/lab/patientEvents.ts). */
export function patientVitals(v: TsVitals): PatientVitals {
  return {
    t: v.t,
    hr: v.hr,
    rhythmKind: "sinus",
    av: 0,
    art: { sys: v.sys, dia: v.dia, mean: v.map },
    // 1 mm in two contiguous inferior leads: the limb-lead threshold the patient engine uses (ecg12.ts stemiCriteria)
    stemi: { met: v.stMm >= 1, groups: [] },
    pericardialMl: v.pericardialMl,
  };
}

// ---------------------------------------------------------------------------
// Events (the tip vocabulary)
// ---------------------------------------------------------------------------

/** What the stage can raise; structuralTips.ts declares it in `raises`. */
export const TRANSSEPTAL_EVENTS = ["low-act", "air", "hypotension", "bradycardia", "st-elevation", "tamponade"] as const satisfies readonly LabEvent[];

/**
 * The events present now. Monitor events come from the shared patient-event rules (the hypotension
 * hold measured in lab time); low-act once the left atrium is entered until an ACT measured since
 * the crossing is in range; air while bubbles show in the opened sheath.
 */
export function transseptalEvents(s: TsState): LabEvent[] {
  const v = vitalsAt(s);
  const last = lastAct(s);
  const r = patientEvents(patientVitals(v), s.pe, { actMeasuredS: last ? last.s : null }, { thresholds: { actGoalS: TS_HEPARIN.actTargetS } });
  // the ACT matters once the left atrium is entered: a low ACT before the crossing is not raised
  const out: LabEvent[] = r.events.filter((e) => (TRANSSEPTAL_EVENTS as readonly string[]).includes(e) && (e !== "low-act" || laEntered(s)));
  const add = (e: LabEvent) => {
    if (!out.includes(e)) out.push(e);
  };
  // ts-cross: heparin once the left atrium is entered and the ACT checked; the tip stays until an ACT
  // taken since the crossing is in range (heparin given without a measured ACT does not clear it)
  if (laEntered(s) && !(last && last.s >= TS_HEPARIN.actTargetS && s.crossT !== null && last.t >= s.crossT)) add("low-act");
  if (s.air === "in-sheath") add("air");
  return out;
}

/** The stage is in the positioning and crossing part of the puncture (tips drawn for "position"). */
export function inPositionPhase(s: Pick<TsState, "stage">): boolean {
  return s.stage === "fossa" || s.stage === "crossed" || s.stage === "secured" || s.stage === "finish";
}

/**
 * A complication has declared itself on the monitor or been named by the learner: the aortic trace
 * read as aortic, a needle withdrawn or a dilator advanced into the aorta, or a monitor event.
 * (Tamponade cues stay immediate; the aortic puncture is named only after the learner's reading.)
 */
export function complicationActive(s: TsState, events: readonly LabEvent[] = transseptalEvents(s)): boolean {
  if (s.needle === "aorta" && (s.traceRead === "aortic" || s.dilator === "aorta")) return true;
  return events.some((e) => e === "hypotension" || e === "bradycardia" || e === "st-elevation" || e === "tamponade");
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type TsAction =
  | { kind: "align" }
  | { kind: "set-clock"; h: number }
  | { kind: "check-lao" }
  | { kind: "repass-wire" }
  | { kind: "rotate"; deg: number }
  | { kind: "pull"; mm: number }
  | { kind: "move"; deg: number; mm: number }
  | { kind: "to-svc" }
  | { kind: "tool"; tool: CrossTool }
  | { kind: "advance-needle"; force?: boolean }
  | { kind: "check"; what: ConfirmCheck }
  | { kind: "read-trace"; as: TraceKind }
  | { kind: "withdraw-needle" }
  | { kind: "advance-dilator" }
  | { kind: "advance-sheath"; escalate?: boolean }
  | { kind: "pv-wire" }
  | { kind: "remove-needle"; hubLow: boolean; aspirate: boolean }
  | { kind: "flush" }
  | { kind: "lspv-wire" }
  | { kind: "heparin"; u: number }
  | { kind: "measure-act" }
  | { kind: "call-surgeon" }
  | { kind: "echo" }
  | { kind: "atropine" }
  | { kind: "fluids" }
  | { kind: "pericardiocentesis" }
  | { kind: "close-breach" }
  | { kind: "wait"; s: number }
  | { kind: "catheters-out"; leaveWire: boolean }
  | { kind: "finish" };

function log(s: TsState, text: string, tone?: TsLogEntry["tone"]): void {
  s.log.push({ t: s.t, text, tone });
}

function critical(s: TsState, text: string): void {
  if (!s.critical.includes(text)) s.critical.push(text);
}

/** Advance lab time, second by second: bleeding, the hypotension hold, the watch after the catheters are out. */
function tick(s: TsState, dt: number): void {
  let left = Math.max(0, dt);
  while (left > 0) {
    const step = Math.min(1, left);
    s.t += step;
    left -= step;
    const rate = bleedRate(s);
    if (rate > 0) s.pericardialMl += rate * step;
    if (s.cathetersOutT !== null && s.wireLeftAcross && s.wireOutT === null) s.watchedS += step;
    s.pe = patientEvents(patientVitals(vitalsAt(s)), s.pe).state;
  }
}

/** Bleeding into the pericardium now, mL/s. */
export function bleedRate(s: Pick<TsState, "bleeds">): number {
  const B = TS_PATIENT.bleed;
  return s.bleeds.reduce((a, b) => a + (b === "aorta" ? B.aorticSheath : b === "la-wall" ? B.laWall : B.posteriorExit), 0);
}

function bleed(s: TsState, b: BleedSource): void {
  if (!s.bleeds.includes(b)) s.bleeds.push(b);
}

function clone(s: TsState): TsState {
  return {
    ...s,
    bleeds: s.bleeds.slice(),
    contact: s.contact ? { ...s.contact } : null,
    crossedAt: s.crossedAt ? { ...s.crossedAt } : null,
    jumps: s.jumps.slice(),
    checks: s.checks.slice(),
    heparin: s.heparin.slice(),
    acts: s.acts.slice(),
    pe: { ...s.pe },
    critical: s.critical.slice(),
    log: s.log.slice(),
  };
}

/** The left atrial stages in which the needle, dilator or sheath is across. */
const across = (s: TsState) => s.stage === "crossed" || s.stage === "secured";

function engageFossa(s: TsState, h: number): void {
  s.zone = "fossa";
  s.stage = "fossa";
  s.depthMm += TS_MECH.jump2Mm;
  s.contact = { si: TS_MECH.engageSi, ap: apFromClock(h) };
  s.storedTorqueDeg = 0;
  s.tentMm = TS_MECH.tentStartMm;
  s.jumps.push({ t: s.t, into: "fossa" });
  s.ectopyUntil = s.t + TS_MECH.ectopyS;
  log(s, "A second jump as the tip drops onto the fossa; atrial ectopics on the monitor; tenting on the bicaval view.");
}

function pull(s: TsState, mm: number): void {
  const M = TS_MECH;
  if (s.stage === "setup") {
    s.stage = "pulldown";
    s.pulldowns += 1;
  }
  if (s.zone === "ivc") {
    if (mm > 0) log(s, "The tip is in the IVC; pulling further changes nothing. Re-advance the wire to the SVC and start again.", "warn");
    return;
  }
  if (s.zone === "fossa" && s.contact) {
    const c = s.contact;
    if (mm > 0) {
      // a slight withdrawal releases the stored rotation at the contact point, and moves it inferior
      const release = s.storedTorqueDeg * Math.min(1, mm / M.releaseMm);
      s.storedTorqueDeg -= release;
      c.ap = clamp(c.ap - release * M.apPerDeg, -1, 1);
      c.si -= mm * M.siPerMmPull;
      s.tentMm = Math.max(M.tentStartMm * 0.5, s.tentMm - mm * 0.5);
      if (c.si < M.slipSi) {
        s.zone = "ivc";
        s.stage = "pulldown";
        s.contact = null;
        s.tentMm = 0;
        s.ivcDrops += 1;
        s.depthMm = M.ivcMm;
        log(s, "The tip slipped off the inferior rim: on AP fluoroscopy the system has fallen into the IVC.", "warn");
        return;
      }
      if (c.si > M.rimSi) s.ectopyUntil = Math.max(s.ectopyUntil, s.t + 2);
    } else if (mm < 0) {
      const a = -mm;
      c.si = Math.min(0.97, c.si + a * M.siPerMmPush);
      s.tentMm = Math.min(M.tentMaxMm[s.variant.septum], s.tentMm + a * M.tentPerMm);
      if (c.si > M.rimSi) s.ectopyUntil = s.t + M.ectopyS;
    }
    // keep the contact point on the fossa
    const r = Math.hypot(c.si, c.ap);
    if (r > 0.97) {
      c.si = (c.si / r) * 0.97;
      c.ap = (c.ap / r) * 0.97;
    }
    s.depthMm += mm;
    return;
  }
  // SVC and right atrium
  const before = s.depthMm;
  s.depthMm = Math.max(0, s.depthMm + mm);
  if (s.zone === "svc" && s.depthMm >= M.svcEndMm) {
    s.zone = "ra";
    s.depthMm += M.jump1Mm;
    s.jumps.push({ t: s.t, into: "ra" });
    log(s, "A jump as the tip drops from the SVC into the right atrium.");
  }
  if (s.zone === "ra" && before < M.fossaMm && s.depthMm >= M.fossaMm) {
    const h = tipClockH(s);
    if (pointsAtSeptum(h)) {
      engageFossa(s, h);
      return;
    }
    log(s, "No second jump: the tip is sliding down the atrial wall away from the septum.", "warn");
  }
  if (s.zone === "ra" && s.depthMm >= M.ivcMm) {
    s.zone = "ivc";
    s.ivcDrops += 1;
    log(s, "On AP fluoroscopy the tip has fallen into the IVC.", "warn");
  }
  if (s.zone === "svc" && s.depthMm === 0 && mm < 0) log(s, "The system is at the top of the SVC.");
}

function rotate(s: TsState, deg: number): void {
  s.clockH = normClock(s.clockH + deg / 30);
  if (s.zone === "fossa" && s.contact) {
    // friction holds the contact point: the turn is stored in the system, not expressed at the tip
    const before = s.storedTorqueDeg;
    s.storedTorqueDeg = clamp(s.storedTorqueDeg + deg, -TS_MECH.torqueMaxDeg, TS_MECH.torqueMaxDeg);
    if (Math.abs(s.storedTorqueDeg) === TS_MECH.torqueMaxDeg && Math.abs(before) === TS_MECH.torqueMaxDeg)
      log(s, "The sheath spins in your hand; the tent on the short-axis view has not moved.", "warn");
  }
}

/** Where a crossing at the contact point goes, and what comes with it. */
function cross(s: TsState, overshoot: boolean): void {
  const c = s.contact!;
  const v = s.variant;
  s.crossT = s.t;
  s.crossedAt = { ...c };
  s.stage = "crossed";
  if (c.ap > v.aorticAp) {
    // the tent does not release: the needle has gone through the anterior fossa towards the aortic root
    s.needle = "aorta";
    s.aorticCrossings += 1;
    log(s, "The needle advances; the tent does not spring back into the left atrium.");
  } else {
    s.needle = "la";
    s.tentMm = 0;
    s.posteriorExit = c.ap < v.posteriorExitAp || c.si > 0.85;
    log(s, "The tent springs back as the needle crosses.");
  }
  if (overshoot) {
    bleed(s, "la-wall");
    log(s, "The septum gave suddenly and the system jumped forward towards the far left atrial wall.", "danger");
  }
  if (v.vagal && s.needle === "la") s.vagalT = s.t;
}

/** How long after leaving the table recovery is watched, s (MODEL PARAMETER). */
export const RECOVERY_S = 600;

/** Apply one action, returning the new state (the input is not changed). */
export function transseptalStep(s0: TsState, a: TsAction): TsState {
  const s = clone(s0);
  if (s.stage === "done" || s.stage === "abandoned") return s;
  const A = TS_ACTION_S;
  switch (a.kind) {
    case "align":
      if (s.stage !== "setup") break;
      s.aligned = true;
      tick(s, A.setup);
      log(s, "Needle arrow and sheath side arm aligned and held as one.");
      break;
    case "set-clock":
      if (s.zone === "fossa") rotate(s, (normClock(a.h) - s.clockH) * 30);
      else s.clockH = normClock(a.h);
      tick(s, A.rotate);
      break;
    case "check-lao":
      s.laoChecked = true;
      tick(s, A.check);
      // neutral: the image (now LAO) carries the finding, the log only that the projection was taken
      log(s, "LAO projection: wire and leads on screen.");
      break;
    case "repass-wire":
      if (s.stage !== "setup") break;
      s.wire = "posterior";
      tick(s, A.toSvc);
      log(s, "Wire re-passed to the SVC.");
      break;
    case "rotate":
      rotate(s, a.deg);
      tick(s, A.rotate);
      break;
    case "pull":
      if (across(s) || s.stage === "finish") break;
      pull(s, a.mm);
      tick(s, A.pull);
      break;
    case "move":
      if (across(s) || s.stage === "finish") break;
      rotate(s, a.deg);
      pull(s, a.mm);
      tick(s, A.pull);
      break;
    case "to-svc":
      if (across(s) || s.stage === "finish") break;
      s.zone = "svc";
      s.stage = "setup";
      s.depthMm = 0;
      s.contact = null;
      s.storedTorqueDeg = 0;
      s.tentMm = 0;
      tick(s, A.toSvc);
      log(s, "Needle withdrawn into the dilator, wire re-advanced to the SVC and the system brought back up for a new pull-down.");
      break;
    case "tool":
      if (s.stage === "fossa" || s.stage === "setup" || s.stage === "pulldown") s.tool = a.tool;
      break;
    case "advance-needle": {
      if (s.stage !== "fossa" || !s.contact) break;
      tick(s, A.needle);
      if (s.variant.septum === "thick" && s.tool === "needle") {
        if (a.force) {
          s.forcedPushes += 1;
          cross(s, true);
        } else {
          s.tentMm = Math.min(TS_MECH.tentMaxMm.thick, s.tentMm + 4);
          log(s, "The fossa tents deeply but the needle does not cross.", "warn");
        }
        break;
      }
      if (a.force) s.forcedPushes += 1;
      if (s.tool !== "needle") log(s, s.tool === "rf" ? "Radiofrequency applied at the tent: the septum is crossed with little force." : "The sharp wire crosses and forms a J in the left atrium.");
      cross(s, false);
      break;
    }
    case "check": {
      if (s.stage !== "crossed" && s.stage !== "secured") break;
      if (!s.checks.includes(a.what)) s.checks.push(a.what);
      tick(s, A.check);
      log(s, checkFinding(s, a.what));
      break;
    }
    case "read-trace":
      if (!s.checks.includes("pressure")) break;
      s.traceRead = a.as;
      break;
    case "withdraw-needle":
      if (s.stage !== "crossed" || s.dilator !== "ra") break;
      tick(s, A.check);
      if (s.needle === "aorta" && s.traceRead === "aortic") {
        s.aorticWithdrawn = true;
        log(s, "Needle withdrawn after the aortic trace was confirmed.", "warn");
      }
      s.needle = "none";
      s.stage = "fossa";
      s.crossT = null;
      s.crossedAt = null;
      s.checks = [];
      s.traceRead = null;
      s.tentMm = TS_MECH.tentStartMm;
      log(s, "Needle withdrawn into the dilator; the tip rests on the fossa again.");
      break;
    case "advance-dilator":
      if (s.stage !== "crossed" || s.dilator !== "ra") break;
      tick(s, A.dilator);
      if (!fourConfirmations(s)) critical(s, "Dilator advanced without the four confirmations.");
      if (s.needle === "aorta") {
        s.dilator = "aorta";
        bleed(s, "aorta");
        critical(s, "Dilator advanced into the aorta.");
        log(s, "The dilator advances over the needle.");
      } else {
        s.dilator = "la";
        log(s, "Dilator across into the left atrium.");
      }
      break;
    case "advance-sheath":
      if (s.stage !== "crossed" || s.dilator !== "la" || s.sheath === "la") break;
      s.sheathTries += 1;
      tick(s, A.sheath);
      if (s.variant.sheathResists) {
        if (!a.escalate) {
          log(s, "Mild forward pressure with a slight turn: the sheath still hangs at the dilator–sheath step.", "warn");
          break;
        }
        if (!s.pvWire) {
          bleed(s, "la-wall");
          critical(s, "Escalated on a resistant sheath without a wire parked deep in a pulmonary vein.");
          log(s, "The sheath gave suddenly and the dilator tip jumped into the posterior left atrial wall.", "danger");
        } else log(s, "Over the stiff wire the sheath tracks across.");
      } else if (a.escalate) log(s, "Sheath across into the left atrium.");
      else log(s, "Sheath across into the left atrium with mild forward pressure.");
      s.sheath = "la";
      break;
    case "pv-wire":
      if (s.stage !== "crossed" || s.dilator !== "la") break;
      s.pvWire = true;
      tick(s, A.wire);
      log(s, "J wire parked deep in the left superior pulmonary vein through the dilator.");
      break;
    case "remove-needle":
      if (s.sheath !== "la" || s.needleOut) break;
      s.needleOut = true;
      tick(s, A.removeNeedle);
      if (!a.hubLow || !a.aspirate) {
        s.air = "in-sheath";
        s.airT = s.t;
        log(s, "Bubbles in the sheath hub and side arm.", "warn");
      } else log(s, "Needle and dilator out, hub low, aspirating: blood without bubbles.");
      break;
    case "flush":
      if (!s.needleOut) break;
      tick(s, A.flush);
      if (s.air === "in-sheath") {
        s.air = "none";
        s.airT = null;
        log(s, "Sheath aspirated and flushed: the air is out.");
      } else log(s, "Sheath aspirated, flushed and connected to pressure.");
      break;
    case "lspv-wire":
      if (!s.needleOut || s.lspvWire) break;
      if (s.air === "in-sheath") {
        s.air = "embolised";
        s.airT = s.t;
        log(s, "The wire went in through a sheath that still held air.", "danger");
      }
      s.lspvWire = true;
      tick(s, A.wire);
      log(s, "Wire parked in the left superior pulmonary vein; the four-chamber view shows it is not in the appendage.");
      if (s.stage === "crossed") s.stage = "secured";
      break;
    case "heparin":
      if (!(a.u > 0)) break;
      s.heparin.push({ t: s.t, u: a.u });
      tick(s, A.heparin);
      log(s, `Heparin ${a.u.toLocaleString("en-GB")} U given.`);
      break;
    case "measure-act": {
      const value = Math.round(actAt(s, s.t));
      s.acts.push({ t: s.t, s: value });
      tick(s, A.act);
      log(s, `ACT ${value} s.`);
      break;
    }
    case "call-surgeon":
      s.surgeonCalled = true;
      tick(s, A.surgeon);
      log(s, "Cardiac surgeon called.");
      if (s.needle === "aorta" && (s.dilator === "aorta" || s.traceRead === "aortic")) {
        s.stage = "abandoned";
        log(s, "Procedure stopped with nothing withdrawn; the surgical team takes over.");
      }
      break;
    case "echo":
      s.echoT = s.t;
      tick(s, A.echo);
      log(s, echoFinding(s));
      break;
    case "atropine":
      s.atropineT = s.t;
      tick(s, A.drug);
      log(s, "Atropine given.");
      break;
    case "fluids":
      s.fluidsT = s.t;
      tick(s, A.fluids);
      log(s, "Fluid bolus given.");
      break;
    case "pericardiocentesis":
      s.drains += 1;
      tick(s, A.drain);
      if (s.pericardialMl < PATIENT_EVENT_THRESHOLDS.effusionMl) {
        log(s, "Pericardiocentesis attempted: no effusion to drain.", "warn");
        break;
      }
      log(s, `Pericardiocentesis: ${Math.round(s.pericardialMl - TS_PATIENT.drainedMl)} mL of blood drained.`);
      s.pericardialMl = TS_PATIENT.drainedMl;
      // a dilator hole in the atrial wall seals once drained (MODEL PARAMETER); a posterior exit needs closing, the aorta the surgeon
      s.bleeds = s.bleeds.filter((b) => b !== "la-wall");
      if (s.bleeds.includes("aorta")) log(s, "Blood re-accumulates in the pericardium.", "danger");
      break;
    case "close-breach":
      if (s.cathetersOutT === null || s.breachClosed) break;
      if (!s.posteriorExit) {
        // the control is offered after any drained effusion; it does not reveal where the blood came from
        tick(s, A.check);
        log(s, "No septal breach found on TOE.");
        break;
      }
      const overWire = s.wireLeftAcross && s.wireOutT === null;
      if (!overWire) critical(s, "Breach closed only after a new puncture: no wire had been left across.");
      // the occluder stops the leak once it is across; the closure takes time
      s.breachClosed = true;
      s.bleeds = s.bleeds.filter((b) => b !== "posterior-exit");
      tick(s, A.close);
      log(s, overWire ? "The breach is closed with an occluder over the wire left across the septum." : "A new puncture and an occluder close the breach.");
      break;
    case "wait":
      tick(s, Math.max(0, a.s));
      break;
    case "catheters-out":
      if (s.stage !== "secured") break;
      s.stage = "finish";
      s.cathetersOutT = s.t;
      s.wireLeftAcross = a.leaveWire;
      if (s.posteriorExit) bleed(s, "posterior-exit");
      tick(s, A.remove);
      log(s, a.leaveWire ? "Left atrial catheters out; a wire is left across the septum while you watch." : "Left atrial catheters and wire out.");
      break;
    case "finish":
      if (s.stage === "recovery") {
        s.stage = "done";
        log(s, "Patient handed over to recovery.");
        break;
      }
      if (s.stage !== "finish") break;
      if (s.wireLeftAcross && s.wireOutT === null) {
        s.wireOutT = s.t;
        log(s, "Wire removed from across the septum.");
      }
      if (bleedRate(s) > 0) {
        // the patient leaves the table; the recovery nurse calls once the pressure falls (at most RECOVERY_S later)
        const until = s.t + RECOVERY_S;
        while (s.t < until && !transseptalEvents(s).includes("hypotension")) tick(s, 5);
        s.stage = "recovery";
        log(s, transseptalEvents(s).includes("hypotension") ? "Recovery calls: the patient is hypotensive and clammy." : "The patient is back in recovery.", "warn");
        break;
      }
      s.stage = "done";
      log(s, "Transseptal sheath work finished; the patient goes to recovery.");
      break;
  }
  return s;
}

/** Apply several actions in turn. */
export function transseptalRun(s: TsState, actions: readonly TsAction[]): TsState {
  return actions.reduce(transseptalStep, s);
}

/** What a confirmation shows (operator-visible findings, never the diagnosis). */
export function checkFinding(s: Pick<TsState, "needle">, what: ConfirmCheck): string {
  const aorta = s.needle === "aorta";
  switch (what) {
    case "toe":
      return aorta
        ? "TOE: no needle tip in the left atrium; the tent has not released into it, and the tip lies towards the aortic root."
        : "TOE: the tent has released and the needle tip lies in the left atrium.";
    case "aspirate":
      return "Blood aspirates freely through the needle.";
    case "pressure":
      return "Tip pressure on the monitor.";
    case "contrast":
      return aorta ? "Contrast puff: the contrast streams away upwards along the ascending aorta." : "Contrast puff: the contrast swirls in the left atrium and clears towards the ventricle.";
  }
}

/** What the tip pressure trace is (drawn by the view; the learner names it). */
export function traceKind(s: Pick<TsState, "needle" | "zone">): TraceKind {
  if (s.needle === "aorta") return "aortic";
  if (s.needle === "la") return "la";
  return s.zone === "fossa" || s.zone === "ra" ? "ra" : "none";
}

export function echoFinding(s: TsState): string {
  const ml = s.pericardialMl;
  if (ml < PATIENT_EVENT_THRESHOLDS.effusionMl) return "TOE: no pericardial effusion.";
  const where = s.posteriorExit && s.cathetersOutT !== null ? " with an atrial wall haematoma" : "";
  if (ml < 60) return `TOE: a small pericardial effusion${where}.`;
  if (ml < 120) return `TOE: a moderate pericardial effusion${where}.`;
  return `TOE: a large pericardial effusion${where}, with right atrial collapse.`;
}

// ---------------------------------------------------------------------------
// Scoring and decisions
// ---------------------------------------------------------------------------

export interface TsDeduction {
  points: number;
  reason: string;
}

export interface TsScore {
  score: number;
  deductions: TsDeduction[];
  critical: string[];
}

/** Score of the puncture itself (deduction points are MODEL PARAMETERS). The host procedure keeps its own scoring of the site. */
export function scoreTransseptal(s: TsState, site?: TransseptalResult | null): TsScore {
  const d: TsDeduction[] = [];
  const crit = s.critical.slice();
  if (s.variant.pacingLeads && s.wire === "anterior") d.push({ points: 10, reason: "Wire to the SVC left anterior to the pacing leads." });
  if (!s.aligned) d.push({ points: 5, reason: "Pull-down without the needle arrow and side arm aligned." });
  if (s.ivcDrops > 0) d.push({ points: Math.min(10, 5 * s.ivcDrops), reason: `The system fell into the IVC ${s.ivcDrops === 1 ? "once" : `${s.ivcDrops} times`}.` });
  if (site) {
    if (site.danger) d.push({ points: 20, reason: "Crossed in a danger zone." });
    else if (site.quality === "poor") d.push({ points: 10, reason: "Crossing site poorly suited to the procedure." });
    else if (site.quality === "acceptable") d.push({ points: 5, reason: "Crossing site acceptable but not ideal." });
  }
  if (crit.includes("Dilator advanced without the four confirmations.")) d.push({ points: 30, reason: "Dilator advanced before TOE, aspiration, pressure and contrast had all confirmed the left atrium." });
  // the avoidable mistake behind every aortic puncture: crossing where the root lies against the fossa
  if (s.aorticCrossings > 0 && !site?.danger)
    d.push({ points: 20, reason: "Crossed where the aortic root lies against the fossa: read the short-axis view and move the tent posterior before crossing." });
  if (s.dilator === "aorta") d.push({ points: 40, reason: "Dilator advanced into the aorta: haemopericardium." });
  if (s.needle === "aorta" && s.traceRead !== null && s.traceRead !== "aortic") d.push({ points: 10, reason: "An aortic trace was read as another trace." });
  if (s.aorticWithdrawn) d.push({ points: 15, reason: "Needle withdrawn after an aortic puncture was confirmed: withdraw nothing and call the surgeon." });
  if (s.needle === "aorta" && s.dilator === "aorta" && !s.surgeonCalled) d.push({ points: 15, reason: "Surgeon not called after the aortic puncture." });
  if (s.forcedPushes > 0 && s.variant.septum === "thick") d.push({ points: 20, reason: "Forced the needle through a thick septum: the system overshot towards the far wall. Use RF or a sharp wire." });
  if (crit.includes("Escalated on a resistant sheath without a wire parked deep in a pulmonary vein.")) d.push({ points: 20, reason: "Escalated on a resistant sheath before protecting the back wall with a wire." });
  const laT = s.crossT;
  if (s.needle === "la" && laT !== null) {
    const full = TS_HEPARIN.fullUPerKg[0] * TS_PATIENT.weightKg;
    let cum = 0;
    let fullT: number | null = null;
    for (const h of s.heparin) {
      cum += h.u;
      if (cum >= full) {
        fullT = h.t;
        break;
      }
    }
    if (fullT === null) d.push({ points: 15, reason: "No full heparin dose after entering the left atrium." });
    else if (fullT > laT + TS_HEPARIN.onEntryS) d.push({ points: 10, reason: `Full heparin ${Math.round(fullT - laT)} s after entering the left atrium: give it on entry.` });
    const inRange = s.acts.some((x) => x.s >= TS_HEPARIN.actTargetS && x.t >= laT && x.t <= laT + TS_HEPARIN.inRangeWithinS);
    if (!inRange) d.push({ points: 10, reason: `No ACT of at least ${TS_HEPARIN.actTargetS} s measured within ${TS_HEPARIN.inRangeWithinS / 60} min of crossing.` });
  }
  if (s.air === "embolised") d.push({ points: 20, reason: "Air embolised from the sheath." });
  else if (s.log.some((l) => l.text.startsWith("Bubbles in the sheath"))) d.push({ points: 5, reason: "Air entered the sheath as the needle came out: thumb on the hub, hub low, aspirate." });
  if (s.vagalT !== null && s.drains > 0 && s.pericardialMl < PATIENT_EVENT_THRESHOLDS.effusionMl && !s.posteriorExit && s.dilator !== "aorta" && s.bleeds.length === 0)
    d.push({ points: 15, reason: "Pericardiocentesis for a septal reflex without an effusion." });
  if (s.posteriorExit && s.cathetersOutT !== null && !s.wireLeftAcross) d.push({ points: 10, reason: "No wire left across to watch for a posterior exit after the catheters came out." });
  if (s.pericardialMl >= TS_PATIENT.tamponade.startMl + TS_PATIENT.tamponade.spanMl / 2 && (s.stage === "done" || s.stage === "abandoned")) {
    d.push({ points: 30, reason: "Tamponade left undrained." });
    if (!crit.includes("Tamponade left undrained.")) crit.push("Tamponade left undrained.");
  }
  const total = d.reduce((a, b) => a + b.points, 0);
  return { score: Math.max(0, Math.min(100, Math.round(100 - total))), deductions: d, critical: crit };
}

export interface TsDecision {
  id: string;
  stage: string;
  label: string;
  correct: boolean;
  expected: string;
  given: string;
  lessonId: string;
  tipIds: string[];
}

const SETUP = "hb-mitral-tricuspid-laa-ts-setup";
const CROSS = "hb-mitral-tricuspid-laa-ts-cross";

/** The scored decisions of the puncture, for the run's decision ledger and the debrief. */
export function transseptalDecisions(s: TsState): TsDecision[] {
  const out: TsDecision[] = [];
  out.push({
    id: "ts-orient",
    stage: "access",
    label: "Arrow and side arm aligned before the pull-down",
    correct: s.aligned,
    expected: "Aligned and held as one, arrow at about 5 to 6 o'clock",
    given: s.aligned ? `Aligned, arrow at ${clockLabel(s.clockH)}` : "Not aligned",
    lessonId: SETUP,
    tipIds: ["structural-ts-pulldown-orient"],
  });
  if (s.variant.pacingLeads)
    out.push({
      id: "ts-pacing-lead",
      stage: "access",
      label: "Wire posterior to the pacing leads",
      correct: s.wire === "posterior",
      expected: "Checked in LAO: wire to the right of the leads",
      given: s.wire === "posterior" ? (s.laoChecked ? "Checked and posterior" : "Posterior") : "Anterior to the leads",
      lessonId: SETUP,
      tipIds: ["structural-ts-pacing-lead-wire"],
    });
  if (s.aorticCrossings > 0 || (s.variant.aorticAp < BASE_VARIANT.aorticAp && s.crossT !== null))
    out.push({
      id: "ts-site-vs-aorta",
      stage: "access",
      label: "Crossing site clear of the aortic root",
      correct: s.aorticCrossings === 0,
      expected: "Read the short-axis view and move the tent posterior of the root before crossing",
      given: s.aorticCrossings > 0 ? "Crossed into the aortic root" : "Crossed posterior to the root",
      lessonId: CROSS,
      tipIds: ["structural-ts-aortic-puncture-hold"],
    });
  if (s.crossT !== null || s.dilator !== "ra")
    out.push({
      id: "ts-four-confirmations",
      stage: "access",
      label: "Left atrium confirmed four ways before the dilator moved",
      correct: !s.critical.includes("Dilator advanced without the four confirmations.") && s.dilator !== "aorta",
      expected: "TOE, aspiration, pressure and contrast; no dilator on an arterial trace",
      given: s.dilator === "ra" ? `${s.checks.length} of 4 checks; dilator not advanced` : s.dilator === "aorta" ? "Dilator advanced into the aorta" : `${s.checks.length} of 4 checks before the dilator`,
      lessonId: CROSS,
      tipIds: ["structural-ts-four-confirmations", "structural-ts-aortic-puncture-hold"],
    });
  if (s.needle === "la" && s.crossT !== null) {
    const sc = scoreTransseptal(s);
    const late = sc.deductions.some((x) => x.reason.includes("heparin"));
    out.push({
      id: "ts-heparin",
      stage: "access",
      label: "Heparin on entering the left atrium, ACT in range",
      correct: !late && !sc.deductions.some((x) => x.reason.startsWith("No ACT")),
      expected: `70–100 U/kg on entry; ACT at least ${TS_HEPARIN.actTargetS} s within minutes`,
      given: `${heparinGivenU(s).toLocaleString("en-GB")} U; last ACT ${lastAct(s)?.s ?? "not measured"}`,
      lessonId: CROSS,
      tipIds: ["structural-ts-heparin-after-crossing"],
    });
  }
  if (s.needleOut)
    out.push({
      id: "ts-air",
      stage: "access",
      label: "Needle and dilator out without air",
      correct: !s.log.some((l) => l.text.startsWith("Bubbles in the sheath")),
      expected: "Thumb on the hub, hub low, aspirate, flush",
      given: s.air === "embolised" ? "Air embolised" : s.log.some((l) => l.text.startsWith("Bubbles")) ? "Air in the sheath" : "No air",
      lessonId: CROSS,
      tipIds: ["structural-ts-air-hub-low"],
    });
  if (s.variant.septum === "thick")
    out.push({
      id: "ts-thick-tool",
      stage: "access",
      label: "Tool for a thick septum",
      correct: s.forcedPushes === 0 && s.tool !== "needle",
      expected: "RF or a sharp wire, not force",
      given: s.forcedPushes ? "Forced the needle" : s.tool,
      lessonId: CROSS,
      tipIds: ["structural-ts-resistant-wire-first"],
    });
  if (s.posteriorExit && s.cathetersOutT !== null)
    out.push({
      id: "ts-watch",
      stage: "access",
      label: "Wire left across and watched after the catheters came out",
      correct: s.wireLeftAcross,
      expected: "Leave a wire across and watch pressure, ECG and TOE for a few minutes",
      given: s.wireLeftAcross ? `Watched ${Math.round(s.watchedS)} s` : "No wire left",
      lessonId: CROSS,
      tipIds: ["structural-ts-posterior-delayed-tamponade"],
    });
  return out;
}
