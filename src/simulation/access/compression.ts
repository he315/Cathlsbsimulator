// ---------------------------------------------------------------------------
// Hands-on femoral manual compression (access-closure-femoral-manual).
//
// Sources (module text, src/content/manual/**):
//   pm-closure-femoral-compression (pci-manual/13-closure.ts):
//     - when the sheath may come out: Brilakis, once the ACT is below 180 s;
//       Oxford, below 150-200 s, or after 3-4 hours, according to local
//       protocol;
//     - duration: Brilakis about 2-3 minutes per French size (12-18 minutes
//       for 6 Fr, 16-24 for 8 Fr); Oxford continuous pressure for about 8-10
//       minutes; in either case until haemostasis;
//     - the steps (Brilakis 11.1.6 with Oxford's details): telemetry and
//       non-invasive pressure; someone ready with atropine or fluids, saline
//       before removal; sterile gloves; the hands above the skin puncture,
//       over the arterial hole (Oxford: at least two fingers 1 cm proximal to
//       the arterial puncture); a small back-bleed; firm pressure; check the
//       groin, the distal pulses; a clear sterile dressing; the arterial
//       sheath out before the venous one;
//     - a hypertensive patient's pressure lowered before removal with a
//       titratable agent according to local protocol (no drug or dose is
//       named, so the order here names none);
//     - protamine 1-1.5 mg per 100 units of heparin to a maximum of 50 mg,
//       given slowly; severe hypotension usually 5-10 minutes after the dose;
//       only once all coronary equipment is out, and reversal after stenting
//       carries a risk of stent thrombosis;
//     - bleeding from hands too low or to one side, too little pressure,
//       anticoagulation and hypertension; limb ischaemia from overzealous or
//       prolonged pressure; too little pressure as a cause of pseudoaneurysm.
// Everything else (how the fingers' pressure reaches the hole, the pressure
// that holds it, how fast a plug forms, how fast an uncovered hole oozes, the
// protamine reaction's probability and size) is a MODEL PARAMETER: a setting
// of the simulator that gives the right direction, not a clinical value.
//
// Coordinates: mm on the skin from the skin nick, x towards the head
// (proximal, positive) along the artery, y lateral. The arteriotomy lies
// cranial to the skin nick (depth / tan(angle): session.arteriotomyOffsetMm).
// Pure: the session keeps the state and calls stepCompression on its clock.
// ---------------------------------------------------------------------------

/** The sourced numbers (see the header). */
export const COMPRESSION = {
  /** Brilakis: pull once the ACT is below 180 s */
  brilakisActS: 180,
  /** Oxford: below 150-200 s (the upper end is used: 'according to local protocol'), or after 3-4 hours */
  oxfordActS: [150, 200] as [number, number],
  oxfordAfterH: [3, 4] as [number, number],
  /** Brilakis: about 2-3 minutes of pressure per French size */
  brilakisMinPerFr: [2, 3] as [number, number],
  /** Oxford: continuous pressure for about 8-10 minutes */
  oxfordMinutes: [8, 10] as [number, number],
  /** Oxford: at least two fingers, 1 cm proximal to the arterial puncture (mm) */
  oxfordProximalMm: 10,
  /** protamine: 1-1.5 mg per 100 units of heparin, to a maximum of 50 mg */
  protamineMgPer100U: [1, 1.5] as [number, number],
  protamineMaxMg: 50,
  /** severe hypotension usually 5-10 minutes after the dose (s) */
  protamineReactionAfterS: [300, 600] as [number, number],
} as const;

/** Which manual's rule the learner follows for the ACT and the timer. */
export type CompressionRule = "brilakis" | "oxford";

/** The minutes of pressure the rule asks for with this sheath. */
export function requiredMinutes(rule: CompressionRule, fr: number): number {
  return rule === "brilakis" ? COMPRESSION.brilakisMinPerFr[0] * fr : COMPRESSION.oxfordMinutes[0];
}

/** The rule's duration in words ('12-18 min for 6 Fr (Brilakis)'). */
export function requiredMinutesText(rule: CompressionRule, fr: number): string {
  if (rule === "brilakis") return `${COMPRESSION.brilakisMinPerFr[0] * fr}-${COMPRESSION.brilakisMinPerFr[1] * fr} min for ${fr} Fr (Brilakis, 2-3 min per French)`;
  return `about ${COMPRESSION.oxfordMinutes[0]}-${COMPRESSION.oxfordMinutes[1]} min (Oxford)`;
}

/** The ACT allows the sheath out by hand under the rule: measured below the threshold, or (Oxford) 3 hours after the last heparin. */
export function actAllowsPull(rule: CompressionRule, actS: number, sinceHeparinS: number | null): boolean {
  if (rule === "brilakis") return actS < COMPRESSION.brilakisActS;
  return actS < COMPRESSION.oxfordActS[1] || (sinceHeparinS !== null && sinceHeparinS >= COMPRESSION.oxfordAfterH[0] * 3600);
}

// ---------------------------------------------------------------------------
// Preparation
// ---------------------------------------------------------------------------

export type PrepItem = "monitoring" | "vagal-kit" | "saline" | "gloves" | "bp";

/** Brilakis 11.1.6 steps 1-3 and the blood-pressure row of the lesson's table. */
export const PREP_CHECKLIST: readonly { id: PrepItem; label: string; source: string }[] = [
  { id: "monitoring", label: "Telemetry on, non-invasive pressure cycling", source: "Brilakis 11.1.6 step 1" },
  { id: "vagal-kit", label: "Someone ready with atropine and fluids", source: "Brilakis 11.1.6 step 2; Oxford ch 10" },
  { id: "saline", label: "Normal saline running before the sheath comes out", source: "Brilakis 11.1.6 step 2" },
  { id: "gloves", label: "Sterile gloves on", source: "Brilakis 11.1.6 step 3" },
  { id: "bp", label: "Blood pressure checked, and lowered if raised", source: "pm-closure-femoral-compression, 'Blood pressure'" },
];

// ---------------------------------------------------------------------------
// The hands
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the hands-on compression (simulator settings, not clinical values). */
export const MP_COMPRESSION = {
  /**
   * The fingers fully cover the hole when their centre lies from this far distal of it to this far
   * proximal (mm): proximal pressure stops the inflow to the hole (Oxford's 1 cm proximal is inside the
   * band); the band itself is a model setting.
   */
  zoneMm: [-3, 12] as [number, number],
  /** coverage falls off outside the zone along the artery, and to the side, with these widths (mm) */
  axialSigmaMm: 5,
  lateralSigmaMm: 5,
  /** pressure at the hole that holds it, as a share of full pressure: base, plus per 100 s of ACT above 150, plus per 40 mmHg of systolic above 140 */
  holdBase: 0.4,
  holdPerAct100: 0.18,
  holdPerSys40: 0.08,
  /** at or above this share the artery is occluded under the fingers: no distal flow */
  occlusive: 0.85,
  /** the slider's labels: light below `firm`, firm up to `occlusive` */
  firm: 0.5,
  /** oozing from an uncovered hole, mL/min per unit of pressure deficit, scaled by ACT/150 */
  oozeMlMinPerDeficit: 30,
  /** a plug forms after this much adequately held pressure (min) at an ACT of 150 s with a 6 Fr hole; longer with a higher ACT and a larger hole */
  plugMin: 5,
  /** the plug forms this much more slowly per 100 s of ACT above 150 (share) and per Fr above 6 (share) */
  plugPerAct100: 0.6,
  plugPerFr: 0.15,
  /** bleeding under the fingers undoes the plug at this many times its building rate */
  plugUndo: 2,
  /** a groin swelling the operator can see from this volume (mL) */
  visibleHaematomaMl: 15,
  /** occlusive pressure for longer than this (min) leaves the foot pulses reduced after release */
  occlusiveMinForPulses: 6,
  /** the protamine reaction: probability with a slow injection, times this with a fast one; its loss of vascular tone and how long it lasts (s) */
  protamineReactionSlow: 0.04,
  protamineFastMultiplier: 4,
  protamineVasodilation: 0.45,
  protamineReactionS: 420,
  /** the antihypertensive order: the loss of vascular tone it gives, and how long it acts (s) */
  bpLoweringVasodilation: 0.2,
  bpLoweringS: 3600,
  /** systolic above this counts as raised before removal (mmHg; a simulator setting, not a clinical threshold: the lesson gives none) */
  raisedSysMmHg: 160,
  /** the slow protamine injection takes this long (s) */
  protamineSlowS: 300,
  /** a groin swelling of V mL is drawn and described as sqrt(V / this) cm across (a display and wording setting) */
  swellingMlPerCm2: 0.6,
  /** the fingers count as off the hole while their centre lies more than this from the zone over it (mm) */
  overMm: 5,
  /** the compression counts as over the arteriotomy when no more than this share of the pressing time was off it */
  offTargetMaxShare: 0.1,
} as const;

/** The width of a groin swelling of `ml` (cm), as the groin check describes it and GroinView draws it. */
export function swellingCm(ml: number): number {
  return Math.sqrt(Math.max(0, ml) / MP_COMPRESSION.swellingMlPerCm2);
}

/** Where the fingers are and how hard they press. */
export interface Hands {
  /** finger centre on the skin, mm from the skin nick (x proximal, y lateral) */
  xMm: number;
  yMm: number;
  /** 0 off, 1 full */
  pressure: number;
}

/** Distance of the finger centre from the zone that covers the hole (mm; 0 inside it). */
export function positionError(h: Pick<Hands, "xMm" | "yMm">, hole: { xMm: number; yMm: number }): number {
  const dx = h.xMm - hole.xMm;
  const [z0, z1] = MP_COMPRESSION.zoneMm;
  const ax = dx < z0 ? z0 - dx : dx > z1 ? dx - z1 : 0;
  return Math.hypot(ax, h.yMm - hole.yMm);
}

/** How much of the fingers' pressure reaches the hole (0..1). */
export function coverage(h: Pick<Hands, "xMm" | "yMm">, hole: { xMm: number; yMm: number }): number {
  const dx = h.xMm - hole.xMm;
  const [z0, z1] = MP_COMPRESSION.zoneMm;
  const ax = dx < z0 ? z0 - dx : dx > z1 ? dx - z1 : 0;
  const dy = h.yMm - hole.yMm;
  return Math.exp(-(ax * ax) / (2 * MP_COMPRESSION.axialSigmaMm ** 2)) * Math.exp(-(dy * dy) / (2 * MP_COMPRESSION.lateralSigmaMm ** 2));
}

/** The pressure at the hole that holds it now (share of full pressure). */
export function holdingPressure(actS: number, sysMmHg: number): number {
  const M = MP_COMPRESSION;
  return Math.min(0.8, M.holdBase + Math.max(0, (actS - 150) / 100) * M.holdPerAct100 + Math.max(0, (sysMmHg - 140) / 40) * M.holdPerSys40);
}

/** Minutes of adequately held pressure for a plug to form. */
export function plugMinutes(actS: number, fr: number): number {
  const M = MP_COMPRESSION;
  return M.plugMin * (1 + Math.max(0, (actS - 150) / 100) * M.plugPerAct100 + Math.max(0, fr - 6) * M.plugPerFr);
}

/** The compression as the session keeps it. */
export interface CompressionState {
  /** the arteriotomy on the skin map (mm from the skin nick), fixed at the pull */
  hole: { xMm: number; yMm: number };
  fr: number;
  rule: CompressionRule;
  hands: Hands;
  /** session times (s) */
  startedAt: number;
  releasedAt: number | null;
  actAtPull: number;
  sysAtPull: number;
  /** time with any pressure on (s), with adequate pressure at the hole (s), with occlusive pressure (s) */
  pressedS: number;
  adequateS: number;
  occlusiveS: number;
  /** position error integrated over the time pressed (mm.s) */
  errorMmS: number;
  /** time pressed with the fingers more than MP_COMPRESSION.overMm off the hole (s) */
  offTargetS: number;
  /** the plug's progress (min of adequate pressure) */
  plugMin: number;
  /** blood lost from the hole into the groin (mL) */
  haematomaMl: number;
  /** bleeding from the hole now (mL/min) */
  oozeMlMin: number;
  /** the distal flow is stopped under the fingers now */
  occluded: boolean;
  /** the learner lifted the hands before the hole held: it bled again */
  rebleeds: number;
}

export function freshCompression(o: { hole: { xMm: number; yMm: number }; fr: number; rule: CompressionRule; hands: Hands; t: number; actS: number; sysMmHg: number }): CompressionState {
  return {
    hole: { ...o.hole },
    fr: o.fr,
    rule: o.rule,
    hands: { ...o.hands, pressure: clamp01(o.hands.pressure) },
    startedAt: o.t,
    releasedAt: null,
    actAtPull: o.actS,
    sysAtPull: o.sysMmHg,
    pressedS: 0,
    adequateS: 0,
    occlusiveS: 0,
    errorMmS: 0,
    offTargetS: 0,
    plugMin: 0,
    haematomaMl: 0,
    oozeMlMin: 0,
    occluded: false,
    rebleeds: 0,
  };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Advance the compression `dt` s at this ACT and systolic pressure (pure: returns the new state). */
export function stepCompression(c: CompressionState, dt: number, actS: number, sysMmHg: number): CompressionState {
  if (c.releasedAt !== null || dt <= 0) return c;
  const next = { ...c };
  stepCompressionInPlace(next, dt, actS, sysMmHg);
  return next;
}

/**
 * stepCompression updating `c` itself (the session's per-frame path, which allocates nothing). Returns the
 * blood lost into the groin in this step (mL).
 */
export function stepCompressionInPlace(c: CompressionState, dt: number, actS: number, sysMmHg: number): number {
  if (c.releasedAt !== null || dt <= 0) return 0;
  const M = MP_COMPRESSION;
  const eff = c.hands.pressure * coverage(c.hands, c.hole);
  const need = holdingPressure(actS, sysMmHg);
  const pressed = c.hands.pressure > 0.05;
  const adequate = eff >= need;
  const occluded = c.hands.pressure * Math.exp(-((c.hands.yMm - c.hole.yMm) ** 2) / (2 * M.lateralSigmaMm ** 2)) >= M.occlusive;
  const plugNeed = plugMinutes(actS, c.fr);
  const held = c.plugMin >= plugNeed;
  const ooze = adequate || held ? 0 : (need - eff) * M.oozeMlMinPerDeficit * Math.max(0.6, actS / 150);
  const dMin = dt / 60;
  const err = pressed ? positionError(c.hands, c.hole) : 0;
  c.pressedS += pressed ? dt : 0;
  c.adequateS += adequate ? dt : 0;
  c.occlusiveS += occluded ? dt : 0;
  c.errorMmS += err * dt;
  c.offTargetS += pressed && err > M.overMm ? dt : 0;
  c.plugMin = adequate ? c.plugMin + dMin : Math.max(0, c.plugMin - (ooze > 0 ? dMin * M.plugUndo : 0));
  c.haematomaMl += ooze * dMin;
  c.oozeMlMin = ooze;
  c.occluded = occluded;
  return ooze * dMin;
}

/** The plug holds now: the hole will not bleed when the hands come off. */
export function haemostatic(c: CompressionState, actS: number): boolean {
  return c.plugMin >= plugMinutes(actS, c.fr);
}

/** What the compression gave, for femoralRisk and the debrief. */
export interface CompressionSummary {
  minutes: number;
  /** mean distance of the fingers from the zone over the hole while pressing (mm) */
  positionErrorMm: number;
  /** share of the pressing time with enough pressure at the hole */
  pressureAdequacy: number;
  /** minutes pressed with the fingers off the hole (more than MP_COMPRESSION.overMm from it) */
  offTargetMin: number;
  /** the fingers were over the arteriotomy: off it for no more than MP_COMPRESSION.offTargetMaxShare of the pressing time */
  over: boolean;
  occlusiveMin: number;
  haematomaMl: number;
}

export function summariseCompression(c: CompressionState, nowS: number): CompressionSummary {
  const end = c.releasedAt ?? nowS;
  return {
    minutes: Math.round(((end - c.startedAt) / 60) * 10) / 10,
    positionErrorMm: c.pressedS > 0 ? Math.round((c.errorMmS / c.pressedS) * 10) / 10 : 0,
    pressureAdequacy: c.pressedS > 0 ? Math.round((c.adequateS / c.pressedS) * 100) / 100 : 0,
    offTargetMin: Math.round((c.offTargetS / 60) * 10) / 10,
    over: c.pressedS > 0 && c.offTargetS / c.pressedS <= MP_COMPRESSION.offTargetMaxShare,
    occlusiveMin: Math.round((c.occlusiveS / 60) * 10) / 10,
    haematomaMl: Math.round(c.haematomaMl * 10) / 10,
  };
}

/** What the operator feels under the fingers (no diagnosis): the pulse, and blood at the nick. */
export function underTheFingers(c: CompressionState, actS: number, sysMmHg: number): string {
  const eff = c.hands.pressure * coverage(c.hands, c.hole);
  const need = holdingPressure(actS, sysMmHg);
  if (c.hands.pressure < 0.05) return "No pressure on the groin.";
  const pulse = c.occluded ? "No pulse beneath the fingers." : c.hands.pressure >= MP_COMPRESSION.firm ? "The pulse is damped beneath the fingers." : "A strong pulse beneath the fingers.";
  const blood = eff >= need || haemostatic(c, actS) ? "The nick is dry." : "Blood wells up at the skin nick.";
  return `${pulse} ${blood}`;
}

/** The pressure slider's word for a share of full pressure. */
export function pressureWord(p: number): string {
  if (p < 0.05) return "Off";
  if (p < MP_COMPRESSION.firm) return "Light";
  if (p < MP_COMPRESSION.occlusive) return "Firm";
  return "Occlusive";
}

// ---------------------------------------------------------------------------
// Protamine
// ---------------------------------------------------------------------------

/** The sourced dose range for the heparin given (mg), capped at the maximum. */
export function protamineRange(heparinU: number): [number, number] {
  const [a, b] = COMPRESSION.protamineMgPer100U;
  const cap = COMPRESSION.protamineMaxMg;
  return [Math.min(cap, (a * heparinU) / 100), Math.min(cap, (b * heparinU) / 100)];
}

export interface ProtamineGrade {
  /** refused: not given at all */
  refused: boolean;
  /** the dose given (capped at the maximum) */
  givenMg: number;
  correct: boolean;
  reasons: string[];
  expected: string;
}

/**
 * Grade a protamine order (pure): refused while coronary equipment is in; above the 50 mg maximum it is
 * capped and scored wrong; outside 1-1.5 mg per 100 U of the heparin given it is wrong; after stenting it
 * carries the stent-thrombosis caution (said, not scored).
 */
export function gradeProtamine(o: { mg: number; heparinU: number; equipmentIn: boolean }): ProtamineGrade {
  const [lo, hi] = protamineRange(o.heparinU);
  const expected = `Only with all coronary equipment out: ${COMPRESSION.protamineMgPer100U[0]}-${COMPRESSION.protamineMgPer100U[1]} mg per 100 U of heparin (${Math.round(lo)}-${Math.round(hi)} mg for ${o.heparinU} U), no more than ${COMPRESSION.protamineMaxMg} mg, slowly`;
  if (o.equipmentIn) return { refused: true, givenMg: 0, correct: false, reasons: ["Coronary equipment is still in."], expected };
  const reasons: string[] = [];
  const givenMg = Math.min(COMPRESSION.protamineMaxMg, Math.max(0, o.mg));
  if (o.mg > COMPRESSION.protamineMaxMg) reasons.push(`${o.mg} mg is above the ${COMPRESSION.protamineMaxMg} mg maximum: capped at ${COMPRESSION.protamineMaxMg} mg.`);
  else if (o.mg < lo - 0.5 || o.mg > hi + 0.5) reasons.push(`${o.mg} mg is outside ${Math.round(lo)}-${Math.round(hi)} mg for ${o.heparinU} U of heparin.`);
  if (o.heparinU <= 0) reasons.push("No heparin was given.");
  return { refused: false, givenMg, correct: reasons.length === 0, reasons, expected };
}

/** The protamine reaction's probability for the injection rate (MODEL PARAMETER). */
export function protamineReactionChance(rate: "slow" | "fast"): number {
  return Math.min(1, MP_COMPRESSION.protamineReactionSlow * (rate === "fast" ? MP_COMPRESSION.protamineFastMultiplier : 1));
}
