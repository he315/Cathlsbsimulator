// ---------------------------------------------------------------------------
// Radial artery spasm: one shared model (access-radial-sequence).
//
// The tone of the radial artery, 0 (relaxed) to 1 (clamped), from the
// patient, the case and what the operator has done. The full case steps it
// at each radial site from arrival; before the sheath it narrows the artery
// on ultrasound and slows the flashback (ultrasound.ts reads the lumen scale
// and the flash class); after the sheath it keeps running (sheath size,
// exchanges, the cocktail) for the forearm images and the debrief, and the
// wire model accepts it as a floor (procedure.ts spasmFloor) for
// diag-spasm-states, which couples the same model to the rod physics of the
// diagnostic lab (the live host at the end of this file). Nothing here knows
// about a session, a needle or a wire: it is pure state and functions.
//
// What drives it is the lesson text (pm-access-radial-puncture, 'Spasm at the
// puncture', after Brilakis 4.3 and his complications chapter): a small
// radial artery, a younger patient, several needle passes, intravenous
// vasopressors; women, current smokers, anxiety, large sheaths and no
// vasodilator. What relieves it is the same table: sedation (through the
// anxiety the patient engine reports, which already counts the sedative),
// nitroglycerin under the tongue, under the skin or around the artery, a
// vasodilator through the sheath, and time. Pain on a pass made without a
// working local anaesthetic adds to it (the full case's own rule, kept from
// caseSession.ts spasmInputs).
//
// Every weight and time constant below is a MODEL PARAMETER (listed in
// docs/realism/facts/pkg-access-radial-sequence.md): the sources name the
// factors, not their sizes.
// ---------------------------------------------------------------------------

/** What the model reads now. All 0..1 unless a unit is given. */
export interface RadialSpasmFactors {
  /** radial artery diameter, mm */
  radialDiamMm: number;
  /** age, years */
  ageY: number;
  female: boolean;
  smoker: boolean;
  /** anxiety now, as the patient engine reports it (sedation already counted) */
  anxiety: number;
  /** pain from the access now: 1 with no working local anaesthetic, 0 with one */
  pain: number;
  /** outer diameter of the sheath in the artery, mm, or null before the sheath */
  sheathOdMm: number | null;
  /** catheter exchanges through the radial artery so far */
  exchanges: number;
  /** intra-arterial vasodilator effect at the radial artery now (verapamil, nitroglycerin, a cocktail) */
  vasodilator: number;
  /** local nitrate effect now (under the tongue, under the skin, around the artery) */
  nitrate: number;
  /** an intravenous vasopressor is running */
  vasopressor: boolean;
}

export interface RadialSpasmState {
  /** tone now, 0..1 */
  level: number;
  /** the transient part from passes and exchanges, decaying with time, 0..1 */
  impulse: number;
  /** skin passes at this artery */
  passes: number;
}

/** One term of the steady drive, for the debrief (what made the artery tight). */
export interface SpasmTerm {
  id: "small-artery" | "younger" | "female" | "smoker" | "anxiety" | "pain" | "sheath" | "exchanges" | "vasopressor";
  label: string;
  value: number;
}

/** MODEL PARAMETERS of the spasm model (none is a population value). */
export const MP_RADIAL_SPASM = {
  /** an artery smaller than this (mm) adds `perMmBelow` per mm below it */
  smallDiamMm: 2.5,
  perMmBelow: 0.3,
  /** each year younger than `youngAgeY` adds `perYearYounger` (capped at `youngMax`) */
  youngAgeY: 55,
  perYearYounger: 0.005,
  youngMax: 0.15,
  female: 0.05,
  smoker: 0.05,
  /** anxiety weight (the engine's anxiety is already lowered by sedation) */
  anxiety: 0.4,
  /** sustained pain from the access (no working local) */
  pain: 0.25,
  /** sheath larger than this share of the artery adds `sheathPerRatio` per unit of the excess ratio */
  sheathRatioFree: 0.9,
  sheathPerRatio: 0.6,
  /** each catheter exchange adds a lasting `exchange` (to `exchangeMax`) and an impulse */
  exchange: 0.04,
  exchangeMax: 0.2,
  exchangeImpulse: 0.08,
  vasopressor: 0.2,
  /** a skin pass after the first adds an impulse, more if it hurt */
  passImpulse: 0.12,
  painfulPassImpulse: 0.12,
  /** relief at a full effect: the intra-arterial vasodilator and the local nitrate (the larger counts) */
  vasodilatorRelief: 0.8,
  nitrateRelief: 0.7,
  /** time constants (s): the tone rises quickly, relaxes slowly; impulses fade */
  tauRiseS: 10,
  tauFallS: 90,
  tauImpulseS: 90,
  /** the lumen at full tone, as a share of the relaxed lumen */
  lumenAtFull: 0.5,
  /** the flashback slows from this tone, and is too poor for a wire from this tone */
  slowFlashAt: 0.45,
  poorFlashAt: 0.7,
};

export function freshRadialSpasm(): RadialSpasmState {
  return { level: 0, impulse: 0, passes: 0 };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** The steady drive of the artery's tone from the patient and the case (before relief), with its terms. */
export function spasmDrive(f: RadialSpasmFactors): { drive: number; terms: SpasmTerm[] } {
  const M = MP_RADIAL_SPASM;
  const terms: SpasmTerm[] = [];
  const add = (id: SpasmTerm["id"], label: string, value: number) => {
    if (value > 1e-6) terms.push({ id, label, value: Math.round(value * 1000) / 1000 });
  };
  add("small-artery", "Small radial artery", Math.max(0, M.smallDiamMm - f.radialDiamMm) * M.perMmBelow);
  add("younger", "Younger patient", Math.min(M.youngMax, Math.max(0, M.youngAgeY - f.ageY) * M.perYearYounger));
  if (f.female) add("female", "Woman", M.female);
  if (f.smoker) add("smoker", "Current smoker", M.smoker);
  add("anxiety", "Anxiety", clamp01(f.anxiety) * M.anxiety);
  add("pain", "Pain at the access", clamp01(f.pain) * M.pain);
  if (f.sheathOdMm !== null && f.radialDiamMm > 0) add("sheath", "Sheath large for the artery", Math.max(0, f.sheathOdMm / f.radialDiamMm - M.sheathRatioFree) * M.sheathPerRatio);
  add("exchanges", "Catheter exchanges", Math.min(M.exchangeMax, Math.max(0, f.exchanges) * M.exchange));
  if (f.vasopressor) add("vasopressor", "Intravenous vasopressor", M.vasopressor);
  return { drive: clamp01(terms.reduce((a, t) => a + t.value, 0)), terms };
}

/** Relief now (0..1): the larger of the intra-arterial vasodilator and the local nitrate. */
export function spasmRelief(f: Pick<RadialSpasmFactors, "vasodilator" | "nitrate">): number {
  return clamp01(Math.max(clamp01(f.vasodilator) * MP_RADIAL_SPASM.vasodilatorRelief, clamp01(f.nitrate) * MP_RADIAL_SPASM.nitrateRelief));
}

/** The tone the artery is heading for now. */
export function spasmTarget(st: RadialSpasmState, f: RadialSpasmFactors): number {
  return clamp01((spasmDrive(f).drive + st.impulse) * (1 - spasmRelief(f)));
}

/** A skin pass at the artery: the second and later passes add an impulse, more when the pass hurt. */
export function spasmOnPass(st: RadialSpasmState, painful: boolean): void {
  st.passes++;
  if (st.passes <= 1) return;
  st.impulse = clamp01(st.impulse + MP_RADIAL_SPASM.passImpulse + (painful ? MP_RADIAL_SPASM.painfulPassImpulse : 0));
}

/** A catheter exchange through the artery: an impulse (the lasting part is the factors' `exchanges`). */
export function spasmOnExchange(st: RadialSpasmState): void {
  st.impulse = clamp01(st.impulse + MP_RADIAL_SPASM.exchangeImpulse);
}

/** Step the tone by `dtS` seconds (first order towards the target; impulses fade). Mutates `st`. */
export function stepRadialSpasm(st: RadialSpasmState, f: RadialSpasmFactors, dtS: number): void {
  if (!(dtS > 0)) return;
  const M = MP_RADIAL_SPASM;
  st.impulse *= Math.exp(-dtS / M.tauImpulseS);
  const target = spasmTarget(st, f);
  const tau = target > st.level ? M.tauRiseS : M.tauFallS;
  st.level = clamp01(target + (st.level - target) * Math.exp(-dtS / tau));
}

/** The lumen of the radial artery as a share of its relaxed lumen at this tone. */
export function radialLumenScale(level: number): number {
  return 1 - (1 - MP_RADIAL_SPASM.lumenAtFull) * clamp01(level);
}

/** What the hub shows of the tone: a brisk flashback, a slow one, or one too poor for a wire. */
export function spasmFlash(level: number): "brisk" | "slow" | "poor" {
  return level >= MP_RADIAL_SPASM.poorFlashAt ? "poor" : level >= MP_RADIAL_SPASM.slowFlashAt ? "slow" : "brisk";
}

// ---------------------------------------------------------------------------
// Live radial spasm in the coronary labs (diag-spasm-states)
//
// The same tone, run for a catheter that is already in the arm: how likely a
// significant spasm is, what it does to the catheter (the artery closes on the
// shaft and grips it, so advance, withdrawal and rotation drag, and the hub
// force rises with the speed of a pull), the forearm pain it gives, the
// narrowing a side-arm puff shows (radialLumenScale), and the avulsion that a
// forceful pull through a gripping spasm causes. The measures are the module
// text's (pm-engaging-spasm, src/content/manual/pci-manual/07-engaging.ts
// lines 1316-1325, after Brilakis 5.3.3.4, 11.2.4.3.1 and 29.2.3.4):
// nitroglycerin or verapamil into the artery through the sheath or catheter,
// intravenously when the side port will not aspirate; nitroglycerin under the
// skin around the artery or under the tongue; more sedation (propofol, a nerve
// block or general anaesthesia for equipment entrapped by severe spasm);
// warmth over the forearm; a lubricious solution; an upper-arm cuff above
// systolic for 5 minutes, then let down. Intra-arterial lidocaine is refused
// (line 1321: it can cause seizures). Forceful withdrawal of a gripped
// catheter can avulse the artery, with forearm bleeding (line 1316).
//
// LiveRadialSpasm is the host the patient engine keeps for a radial case
// (PatientEngine.setRadialAccess): the tone, the local doses and the measures,
// stepped on the patient clock. The full case keeps its own host in
// caseSession.ts with the same drive and relief. Every number below is a
// MODEL PARAMETER (docs/realism/facts/pkg-diag-spasm-states.md).
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the live radial spasm (diag-spasm-states). */
export const MP_RADIAL_LIVE = {
  /** a tone at or above this is a clinically significant spasm (it grips, hurts and shows on a puff) */
  significantAt: 0.5,
  /** width of the logistic step from the target tone to the probability of a significant spasm */
  probabilityWidth: 0.08,
  /**
   * local effect of an intra-arterial dose at the radial artery, and its fall (s): the full case's own
   * values (caseSession.ts MP_SESSION gtnEffectPer100Ug, gtnTauS, verapamilEffectPerMg, verapamilTauS),
   * so that both labs relieve a spasm alike
   */
  gtnEffectPer100Ug: 0.45,
  gtnTauS: 260,
  verapamilEffectPerMg: 0.25,
  verapamilTauS: 1800,
  /** an intravenous dose (the side port will not aspirate) reaches the radial artery at this share of an intra-arterial one */
  ivShare: 0.5,
  /** the local nitrate effect of nitroglycerin under the skin around the artery and under the tongue, and its fall (s) */
  scNitrate: 0.6,
  slNitrate: 0.4,
  nitrateTauS: 600,
  /** warmth over the forearm: relief at full effect, the time to reach it (s), and its fall once removed (s) */
  warmthRelief: 0.5,
  warmthOnsetS: 60,
  warmthTauS: 300,
  /** a lubricious solution: the grip's friction share it removes, and how long it lasts (s) */
  lubriciousRelief: 0.4,
  lubriciousTauS: 300,
  /** the upper-arm cuff: inflated above systolic for this long (s, the module text's 5 minutes), then the relief on release and its fall (s) */
  cuffHoldS: 300,
  cuffRelief: 0.7,
  cuffTauS: 240,
  /** a nerve block and general anaesthesia: relief at full effect */
  nerveBlockRelief: 0.85,
  gaRelief: 0.95,
  /** grip: friction coefficient of the shaft against the arterial wall, and the wall pressure at a full interference, N/mm² */
  wallMu: 0.25,
  gripPressureNmm2: 0.012,
  /** interference (catheter OD over the spastic lumen, minus one) that counts as full */
  fullInterference: 0.5,
  /** the tonic part of the grip: wall pressure per unit of tone above significantAt even without interference, N/mm² */
  tonicPressureNmm2: 0.003,
  /** baseline axial resistance of a catheter in the sheath valve and a relaxed artery, N, and per mm/s of hand speed */
  baseN: 0.25,
  basePerMmS: 0.004,
  /** the grip's resistance rises with the speed of the pull: a share of the grip per mm/s */
  gripPerMmS: 0.08,
  /** torque drag of the grip at the shaft surface: the grip force times this share of the catheter radius */
  torqueShare: 0.6,
  /** avulsion: a hub axial force above this (N) at a tone above avulsionLevel tears the artery */
  avulsionN: 8,
  avulsionLevel: 0.6,
  /** forearm pain from the spasm: none below painFrom, full at 1; a still catheter hurts at this share */
  painFrom: 0.35,
  painStill: 0.35,
  /** the forearm pain's fall once the spasm stops hurting, s (the engine's procedural pain fall, responses.ts) */
  painTauS: 20,
  /** a dose or a decaying measure whose effect has fallen below this is dropped from the host's lists */
  pruneBelow: 1e-3,
};

/** A local measure for radial spasm (pm-engaging-spasm). */
export type RadialMeasureId = "sc-gtn" | "sl-gtn" | "warmth" | "lubricious" | "cuff" | "nerve-block" | "general-anaesthesia" | "ia-lidocaine";

export const RADIAL_MEASURES: readonly RadialMeasureId[] = ["sc-gtn", "sl-gtn", "warmth", "lubricious", "cuff", "nerve-block", "general-anaesthesia", "ia-lidocaine"];

/** A vasodilator for the radial artery, by its route. */
export interface RadialVasodilatorDose {
  drug: "gtn" | "verapamil";
  /** µg for nitroglycerin, mg for verapamil */
  dose: number;
  route: "ia" | "iv";
  /** patient clock time, s */
  t: number;
}

/** The answer to a measure or a dose: done, or refused with the reason the attending gives. */
export interface RadialMeasureResult {
  ok: boolean;
  /** the route a vasodilator went by (an intra-arterial order through a side port that will not aspirate goes intravenously) */
  route?: "ia" | "iv";
  text: string;
}

/** The probability (0..1) that the artery goes into a significant spasm with these factors, from the tone they drive it to. */
export function spasmProbability(f: RadialSpasmFactors, impulse = 0): number {
  const M = MP_RADIAL_LIVE;
  const target = clamp01((spasmDrive(f).drive + impulse) * (1 - spasmRelief(f)));
  return 1 / (1 + Math.exp(-(target - M.significantAt) / M.probabilityWidth));
}

/** The catheter and artery the grip acts between. */
export interface RadialGripInput {
  /** tone now, 0..1 */
  level: number;
  /** catheter outer diameter, mm (6 Fr is 2.0 mm) */
  catheterOdMm: number;
  /** relaxed radial artery diameter, mm */
  radialDiamMm: number;
  /** length of catheter in the radial artery, mm */
  contactMm: number;
  /** share of the friction a lubricious solution has removed, 0..1 */
  lubricated?: number;
}

/** The wall pressure (N/mm²) with which the artery closes on the catheter at this tone. */
export function gripPressure(g: Pick<RadialGripInput, "level" | "catheterOdMm" | "radialDiamMm">): number {
  const M = MP_RADIAL_LIVE;
  const lumen = Math.max(0.1, g.radialDiamMm * radialLumenScale(g.level));
  const interference = clamp01((g.catheterOdMm / lumen - 1) / M.fullInterference);
  const tonic = Math.max(0, clamp01(g.level) - M.significantAt) * M.tonicPressureNmm2;
  return interference * M.gripPressureNmm2 * clamp01(g.level / M.significantAt) + tonic;
}

/** The static grip of the artery on the catheter (N): friction of the wall pressure over the contact area. */
export function gripForceN(g: RadialGripInput): number {
  const M = MP_RADIAL_LIVE;
  const area = Math.PI * g.catheterOdMm * Math.max(0, g.contactMm);
  return M.wallMu * (1 - clamp01(g.lubricated ?? 0)) * gripPressure(g) * area;
}

/**
 * The axial force (N) at the hub to move the catheter at `speedMmS` (either direction) through the arm:
 * the sheath valve and the relaxed artery, plus the grip, which rises with the speed of the move.
 */
export function hubAxialForceN(g: RadialGripInput, speedMmS: number): number {
  const M = MP_RADIAL_LIVE;
  const v = Math.abs(speedMmS);
  return M.baseN + M.basePerMmS * v + gripForceN(g) * (1 + M.gripPerMmS * v);
}

/** The torque drag (N·mm) of the grip at the hub when the catheter is turned. */
export function gripTorqueNmm(g: RadialGripInput): number {
  return gripForceN(g) * (g.catheterOdMm / 2) * MP_RADIAL_LIVE.torqueShare;
}

/** A forceful pull: the hub axial force tears the artery at this tone (MP_RADIAL_LIVE.avulsionN above avulsionLevel). */
export function avulses(level: number, hubAxialN: number): boolean {
  return level > MP_RADIAL_LIVE.avulsionLevel && hubAxialN > MP_RADIAL_LIVE.avulsionN;
}

/** Forearm pain from the spasm, 0..1 (more when the catheter is moved through it). */
export function spasmPain(level: number, moving: boolean): number {
  const M = MP_RADIAL_LIVE;
  const p = clamp01((level - M.painFrom) / (1 - M.painFrom));
  return moving ? p : p * M.painStill;
}

/** What the live host needs once: the artery and the patient. */
export interface LiveRadialSetup {
  radialDiamMm: number;
  ageY: number;
  female: boolean;
  smoker: boolean;
  /** outer diameter of the sheath, mm (closure.ts SHEATHS) */
  sheathOdMm: number;
  /** catheter exchanges already made through the artery */
  exchanges?: number;
  /** the tone at the start (a scenario that opens in spasm), 0..1 */
  startLevel?: number;
  /** the transient part at the start, 0..1 */
  startImpulse?: number;
}

/** What the host reads from the patient at each step. */
export interface LiveRadialInputs {
  /** anxiety now (the engine's, after sedation) */
  anxiety: number;
  /** an intravenous vasopressor is running */
  vasopressor: boolean;
  /** depth of sedation now, 0..1 (propofol deepens it) */
  sedation?: number;
}

export interface LiveRadialSnapshot {
  setup: LiveRadialSetup;
  spasm: RadialSpasmState;
  t: number;
  exchanges: number;
  doses: RadialVasodilatorDose[];
  measures: { id: RadialMeasureId; t: number }[];
  cuffAt: number | null;
  avulsed: boolean;
  /** forearm pain now, 0..1 (absent in older snapshots) */
  pain?: number;
}

/**
 * The live host of one radial artery: the tone and what acts on it, on the patient clock. Pure state:
 * it knows no engine, session or solver; PatientEngine owns one for a radial case.
 */
export class LiveRadialSpasm {
  readonly setup: LiveRadialSetup;
  readonly spasm: RadialSpasmState;
  t = 0;
  exchanges: number;
  doses: RadialVasodilatorDose[] = [];
  measures: { id: RadialMeasureId; t: number }[] = [];
  /** the cuff inflated above systolic at this time, null when it is down */
  cuffAt: number | null = null;
  /** the artery has been avulsed */
  avulsed = false;
  /** forearm pain from the spasm now, 0..1 (hurt; falls with MP_RADIAL_LIVE.painTauS) */
  pain = 0;
  /** the inputs of the last step, copied in place */
  private readonly last: { anxiety: number; vasopressor: boolean; sedation: number } = { anxiety: 0, vasopressor: false, sedation: 0 };
  /** the factors object step() fills in place */
  private readonly scratch: RadialSpasmFactors;

  constructor(setup: LiveRadialSetup, t0 = 0) {
    this.setup = { ...setup };
    this.t = t0;
    this.exchanges = setup.exchanges ?? 0;
    this.spasm = freshRadialSpasm();
    this.spasm.level = clamp01(setup.startLevel ?? 0);
    this.spasm.impulse = clamp01(setup.startImpulse ?? 0);
    this.scratch = this.fillFactors({} as RadialSpasmFactors, this.last);
  }

  get level(): number {
    return this.spasm.level;
  }

  /** The local intra-arterial (or intravenous) vasodilator effect at the artery now, 0..1. */
  vasodilatorEffect(t = this.t): number {
    const M = MP_RADIAL_LIVE;
    let e = 0;
    for (const d of this.doses) {
      const age = Math.max(0, t - d.t);
      const k = d.route === "iv" ? M.ivShare : 1;
      e += k * (d.drug === "gtn" ? (d.dose / 100) * M.gtnEffectPer100Ug * Math.exp(-age / M.gtnTauS) : d.dose * M.verapamilEffectPerMg * Math.exp(-age / M.verapamilTauS));
    }
    return clamp01(e);
  }

  /** The local nitrate effect now (under the skin, under the tongue), 0..1. */
  nitrateEffect(t = this.t): number {
    const M = MP_RADIAL_LIVE;
    let e = 0;
    for (const m of this.measures) {
      const peak = m.id === "sc-gtn" ? M.scNitrate : m.id === "sl-gtn" ? M.slNitrate : 0;
      if (peak > 0) e = Math.max(e, peak * Math.exp(-Math.max(0, t - m.t) / M.nitrateTauS));
    }
    return e;
  }

  /** The relief of the non-drug measures now (warmth, the cuff let down, a nerve block, general anaesthesia), 0..1. */
  measureRelief(t = this.t): number {
    const M = MP_RADIAL_LIVE;
    let r = 0;
    for (const m of this.measures) {
      const age = Math.max(0, t - m.t);
      if (m.id === "warmth") r = Math.max(r, M.warmthRelief * Math.min(1, age / M.warmthOnsetS) * (age > M.warmthOnsetS ? Math.exp(-(age - M.warmthOnsetS) / M.warmthTauS) : 1));
      else if (m.id === "nerve-block") r = Math.max(r, M.nerveBlockRelief);
      else if (m.id === "general-anaesthesia") r = Math.max(r, M.gaRelief);
    }
    // the cuff relieves once it has been held for cuffHoldS and let down (cuffReleased records the release)
    for (const m of this.measures) if (m.id === "cuff") r = Math.max(r, M.cuffRelief * Math.exp(-Math.max(0, t - m.t) / M.cuffTauS));
    return clamp01(r);
  }

  /** The share of the grip's friction a lubricious solution removes now, 0..1. */
  lubrication(t = this.t): number {
    const M = MP_RADIAL_LIVE;
    let e = 0;
    for (const m of this.measures) if (m.id === "lubricious") e = Math.max(e, M.lubriciousRelief * Math.exp(-Math.max(0, t - m.t) / M.lubriciousTauS));
    return e;
  }

  /** The spasm model's factors now (a new object). */
  factors(i: LiveRadialInputs = this.last): RadialSpasmFactors {
    return this.fillFactors({} as RadialSpasmFactors, i);
  }

  /** Fill `out` with the spasm model's factors now. */
  private fillFactors(out: RadialSpasmFactors, i: LiveRadialInputs): RadialSpasmFactors {
    const s = this.setup;
    const sed = clamp01(i.sedation ?? 0);
    out.radialDiamMm = s.radialDiamMm;
    out.ageY = s.ageY;
    out.female = s.female;
    out.smoker = s.smoker;
    out.anxiety = clamp01(i.anxiety);
    out.pain = 0;
    out.sheathOdMm = s.sheathOdMm;
    out.exchanges = this.exchanges;
    // a deep sedation (propofol) and the measures act as vasodilatation at the artery
    out.vasodilator = clamp01(this.vasodilatorEffect() + this.measureRelief() + 0.3 * Math.max(0, sed - 0.5));
    out.nitrate = this.nitrateEffect();
    out.vasopressor = i.vasopressor;
    return out;
  }

  /** Forearm pain from the spasm (0..1): the pain now is the larger of the two. */
  hurt(p: number): void {
    this.pain = Math.max(this.pain, clamp01(p));
  }

  /** Drop the doses and the decaying measures whose effect has fallen below MP_RADIAL_LIVE.pruneBelow. */
  private prune(t: number): void {
    const M = MP_RADIAL_LIVE;
    const doseLeft = (d: RadialVasodilatorDose) => {
      const age = Math.max(0, t - d.t);
      const k = d.route === "iv" ? M.ivShare : 1;
      return k * (d.drug === "gtn" ? (d.dose / 100) * M.gtnEffectPer100Ug * Math.exp(-age / M.gtnTauS) : d.dose * M.verapamilEffectPerMg * Math.exp(-age / M.verapamilTauS));
    };
    const measureLeft = (m: { id: RadialMeasureId; t: number }) => {
      const age = Math.max(0, t - m.t);
      switch (m.id) {
        case "sc-gtn":
          return M.scNitrate * Math.exp(-age / M.nitrateTauS);
        case "sl-gtn":
          return M.slNitrate * Math.exp(-age / M.nitrateTauS);
        case "warmth":
          return age <= M.warmthOnsetS ? 1 : M.warmthRelief * Math.exp(-(age - M.warmthOnsetS) / M.warmthTauS);
        case "lubricious":
          return M.lubriciousRelief * Math.exp(-age / M.lubriciousTauS);
        case "cuff":
          return M.cuffRelief * Math.exp(-age / M.cuffTauS);
        default:
          return 1; // a nerve block and general anaesthesia last the case
      }
    };
    if (this.doses.length && doseLeft(this.doses[0]) < M.pruneBelow) this.doses = this.doses.filter((d) => doseLeft(d) >= M.pruneBelow);
    if (this.measures.some((m) => measureLeft(m) < M.pruneBelow)) this.measures = this.measures.filter((m) => measureLeft(m) >= M.pruneBelow);
  }

  /** The probability of a significant spasm with the factors now. */
  probability(i: LiveRadialInputs = this.last): number {
    return spasmProbability(this.factors(i), this.spasm.impulse);
  }

  /** Step to patient time t (s). */
  step(t: number, i: LiveRadialInputs): void {
    const dt = t - this.t;
    const L = this.last;
    L.anxiety = i.anxiety;
    L.vasopressor = i.vasopressor;
    L.sedation = i.sedation ?? 0;
    if (!(dt > 0)) return;
    this.t = t;
    // the cuff, once held long enough, is let down by the team and the relief begins
    if (this.cuffAt !== null && t - this.cuffAt >= MP_RADIAL_LIVE.cuffHoldS) {
      this.measures.push({ id: "cuff", t: this.cuffAt + MP_RADIAL_LIVE.cuffHoldS });
      this.cuffAt = null;
    }
    this.prune(t);
    if (this.pain > 0) this.pain = this.pain < 1e-3 ? 0 : this.pain * Math.exp(-dt / MP_RADIAL_LIVE.painTauS);
    stepRadialSpasm(this.spasm, this.fillFactors(this.scratch, L), dt);
  }

  /** A catheter exchange through the artery. */
  exchange(): void {
    this.exchanges++;
    spasmOnExchange(this.spasm);
  }

  /**
   * A vasodilator for the artery. Into the artery it needs the side port to aspirate (the module text:
   * if you cannot aspirate through the side port, the intravenous route); an order that cannot go in
   * the artery goes intravenously.
   */
  giveVasodilator(drug: "gtn" | "verapamil", dose: number, route: "ia" | "iv", sideArmAspirates = true): RadialMeasureResult {
    if (!(dose > 0)) return { ok: false, text: "No dose" };
    const r = route === "ia" && !sideArmAspirates ? "iv" : route;
    this.doses.push({ drug, dose, route: r, t: this.t });
    const name = drug === "gtn" ? "Nitroglycerin" : "Verapamil";
    return { ok: true, route: r, text: r === route ? `${name} ${r === "ia" ? "into the radial artery" : "intravenously"}.` : `The side port will not aspirate: ${name.toLowerCase()} given intravenously instead.` };
  }

  /** A measure (pm-engaging-spasm). Intra-arterial lidocaine is refused: it can cause seizures. */
  measure(id: RadialMeasureId): RadialMeasureResult {
    if (id === "ia-lidocaine") return { ok: false, text: "No lidocaine into the artery: it can cause seizures. Lidocaine mixed with nitroglycerin goes under the skin around the artery." };
    if (id === "cuff") {
      if (this.cuffAt !== null) return { ok: false, text: "The cuff is already up." };
      this.cuffAt = this.t;
      return { ok: true, text: "Upper-arm cuff inflated above systolic: hold it for 5 minutes, then let it down." };
    }
    this.measures.push({ id, t: this.t });
    const text: Record<Exclude<RadialMeasureId, "ia-lidocaine" | "cuff">, string> = {
      "sc-gtn": "Nitroglycerin under the skin around the radial artery.",
      "sl-gtn": "Nitroglycerin under the tongue.",
      warmth: "Warm saline gauze over the forearm.",
      lubricious: "Lubricious solution through the sheath.",
      "nerve-block": "Regional nerve block for the arm.",
      "general-anaesthesia": "General anaesthesia.",
    };
    return { ok: true, text: text[id] };
  }

  snapshot(): LiveRadialSnapshot {
    return JSON.parse(JSON.stringify({ setup: this.setup, spasm: this.spasm, t: this.t, exchanges: this.exchanges, doses: this.doses, measures: this.measures, cuffAt: this.cuffAt, avulsed: this.avulsed, ...(this.pain > 0 ? { pain: this.pain } : {}) }));
  }

  static restore(sn: LiveRadialSnapshot): LiveRadialSpasm {
    const h = new LiveRadialSpasm(sn.setup, sn.t);
    Object.assign(h.spasm, sn.spasm);
    h.exchanges = sn.exchanges;
    h.doses = sn.doses.map((d) => ({ ...d }));
    h.measures = sn.measures.map((m) => ({ ...m }));
    h.cuffAt = sn.cuffAt;
    h.avulsed = sn.avulsed;
    h.pain = sn.pain ?? 0;
    return h;
  }
}
