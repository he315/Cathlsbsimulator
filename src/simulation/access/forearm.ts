// ---------------------------------------------------------------------------
// The forearm haematoma after radial access, and compartment syndrome
// (access-cx-forearm; lessons cm-access-complications-radial-bleeding and
// pm-engaging-spasm; lab requests cm-access-complications#5 and pm-engaging#4).
//
// Pure model and grading; the full case runs it through the session module
// src/simulation/session/modules/forearm.ts.
//
// Grade. The extent of the haematoma from the puncture at the wrist is
// haematomaCm(volume) (closure.ts); the grade is the EASY grade of that extent
// (easyGradeFromSize, closure.ts: I under 5 cm, II to 10 cm, III beyond 10 cm
// but below the elbow, IV above the elbow, V an ischaemic threat), the chart
// Brilakis reproduces from Bertrand (Fig. 29.10; the lesson's table,
// src/content/manual/complication-management/06-access-complications.ts:633-642:
// I local within about 5 cm, II up to about 10 cm, III below the elbow, IV
// above it, V compartment syndrome). The distance from the wrist to the elbow
// is a MODEL PARAMETER.
//
// Circumference. The swollen length of the forearm holds the haematoma's
// volume spread evenly along its extent, so at a mark within the extent the
// cross-section gains volume / extent (cm²) and the circumference is
// sqrt(C² + 4π·volume/extent) (a cylinder); beyond the extent it is the
// patient's own. The chart's remark asks for the forearm and arm
// circumference to be measured repeatedly (06-access-complications.ts:646).
//
// Growth. Blood comes from the source at its rate (a scenario setting),
// scaled by the ACT, an intravenous antiplatelet infusion and the systolic
// pressure, and reduced by each measure in place: a band moved over the hole
// or a second band, ice, the arm raised in a sling, analgesia (pain control
// helps the pressure), blood pressure control, a light compressive bandage,
// and an inflated arm cuff below systolic (Oxford ch 10 and the chart: the
// lesson's table and remarks, :623-647 and :702). A source whose rate stays
// below the sealing rate for the sealing time stops for good. Every factor is
// a MODEL PARAMETER (docs/realism/facts/pkg-access-cx-forearm.md); the
// directions are the lesson's.
//
// The arm cuff. The sources differ (06-access-complications.ts:623-627): the
// chart sets the cuff 20 mmHg below systolic, lets it down every 15 minutes
// and allows the finger saturation to be watched while it is up (Bertrand);
// Oxford inflates it up to 15 mmHg below systolic to stop a haematoma
// becoming a compartment syndrome; Brilakis's text says above systolic for
// haemostasis at the puncture. For a forearm haematoma the two below-systolic
// schemes are accepted (the package design), each with the finger saturation
// watched and a plan to let the cuff down ('never leave a cuff inflated
// without a plan to let it down', :626).
//
// Compartment syndrome. A swollen forearm with pain worse on passive
// stretching, pallor, pulselessness, paralysis and paraesthesia (Oxford ch 10,
// :701). Once the signs are present compression, pain relief, pressure control
// and reversal no longer stop it: the only right action is to call the
// vascular surgeons at once (Oxford: involve them early; Brilakis: emergency
// fasciotomy, :703 and :1934-1943), and further compression is then wrong
// (lab request cm-access-complications#5). The signs appear when a haematoma
// goes on growing past the compartment volume (a MODEL PARAMETER), or at a
// scenario's scripted time.
// ---------------------------------------------------------------------------

import { easyGradeFromSize, haematomaCm, haematomaMlForCm, type EasyGrade } from "./closure";

// ---------------------------------------------------------------------------
// Grades and the chart
// ---------------------------------------------------------------------------

export type ForearmGrade = Exclude<EasyGrade, 0>;
export const FOREARM_GRADES: readonly ForearmGrade[] = [1, 2, 3, 4, 5];
export const GRADE_LABEL: Record<ForearmGrade, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

/** What the learner can do for a forearm haematoma (the chart's treatments, the remarks, Oxford's and the call). */
export type ForearmMeasure =
  | "reposition-band"
  | "second-band"
  | "ice"
  | "sling"
  | "analgesia"
  | "bp-control"
  | "stop-infusion"
  | "reverse-heparin"
  | "cuff"
  | "bandage"
  | "inform"
  | "call-surgeons";

export const MEASURE_LABEL: Record<ForearmMeasure, string> = {
  "reposition-band": "Move the band over the arterial hole",
  "second-band": "Add a second band against the first",
  ice: "Ice on the swelling, in a bag or a washcloth",
  sling: "Raise the arm in a sling",
  analgesia: "Analgesia",
  "bp-control": "Bring the blood pressure down",
  "stop-infusion": "Stop the antiplatelet or anticoagulant infusion",
  "reverse-heparin": "Reverse the heparin",
  cuff: "Arm cuff",
  bandage: "Light compressive bandage around the forearm and arm",
  inform: "Tell the operator",
  "call-surgeons": "Call the vascular surgeons now",
};

/** Measures that press on the forearm: wrong once the compartment signs are there. */
export const COMPRESSION_MEASURES: readonly ForearmMeasure[] = ["reposition-band", "second-band", "cuff", "bandage"];

/**
 * The chart Brilakis reproduces from Bertrand (Fig. 29.10; 06-access-complications.ts:633-642): the extent, the
 * treatment and who is told, by grade. 'Band' is the chart's 'an extra band' (or the band moved over the hole,
 * Brilakis 29.2.1.4 step 1, :620).
 */
export const BERTRAND_CHART: Record<ForearmGrade, { extent: string; treatment: readonly ("analgesia" | "band" | "ice" | "cuff" | "surgery")[]; tell: "none" | "inform" | "call-now" }> = {
  1: { extent: "Local and superficial, within about 5 cm of the puncture", treatment: ["analgesia", "band", "ice"], tell: "none" },
  2: { extent: "Moderate infiltration of muscle, up to about 10 cm", treatment: ["analgesia", "band", "ice"], tell: "inform" },
  3: { extent: "Forearm haematoma with muscle infiltration, still below the elbow", treatment: ["analgesia", "band", "ice", "cuff"], tell: "inform" },
  4: { extent: "Haematoma and muscle infiltration extending above the elbow", treatment: ["analgesia", "band", "ice", "cuff"], tell: "inform" },
  5: { extent: "Ischaemic threat: compartment syndrome", treatment: ["surgery"], tell: "call-now" },
};

/** The signs of compartment syndrome in a swollen forearm (Oxford ch 10; 06-access-complications.ts:701). */
export const COMPARTMENT_SIGNS = ["pain worse on passive stretching", "pallor", "pulselessness", "paralysis", "paraesthesia"] as const;

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the forearm haematoma (docs/realism/facts/pkg-access-cx-forearm.md). */
export const MP_FOREARM = {
  /** from the puncture at the wrist crease to the elbow crease (cm) */
  elbowCm: 24,
  /** where the circumference is measured: forearm marks above the wrist crease, and the arm this far above the elbow (cm) */
  forearmMarksCm: [5, 10, 15, 20] as readonly number[],
  armAboveElbowCm: 5,
  /** the patient's own forearm circumference: at a BMI of 25, per BMI unit, and its limits (cm) */
  forearmCircAtBmi25Cm: 24,
  forearmCircPerBmiCm: 0.5,
  forearmCircMinCm: 19,
  forearmCircMaxCm: 34,
  /** the arm above the elbow is this much larger than the forearm (cm) */
  armExtraCm: 4,
  /** measurements are read to the nearest (cm) */
  tapeStepCm: 0.5,
  /** the ACT scales the source: ACT / actRefS, within these limits */
  actRefS: 130,
  actMinK: 0.6,
  actMaxK: 3,
  /** an intravenous antiplatelet infusion running multiplies the source */
  antiplateletK: 1.5,
  /** the systolic pressure scales the source: systolic / sysRefMmHg, within these limits */
  sysRefMmHg: 130,
  sysMinK: 0.6,
  sysMaxK: 1.6,
  /** what each measure in place multiplies the source by */
  factor: {
    band: 0.35,
    secondBandToo: 0.8,
    ice: 0.85,
    sling: 0.85,
    analgesia: 0.9,
    bpControl: 0.8,
    bandage: 0.6,
    /** the cuff while inflated below systolic, and above it (the arm's inflow shut) */
    cuffBelow: 0.15,
    cuffAbove: 0.05,
    /** the band taken off while the haematoma still grows: nothing presses the hole */
    bandOff: 3,
  },
  /** the source stops for good once its rate has stayed below this (mL/min) for this long (s) */
  sealBelowMlMin: 0.4,
  sealAfterS: 300,
  /** a haematoma that goes on growing past this volume threatens the hand: the compartment signs appear (mL) */
  compartmentMl: 450,
  /** a site check feels a swelling from this volume, and the patient complains of it from this one (mL; the ward's) */
  palpableMl: 2,
  reportMl: 60,
  /** Bertrand's cuff is let down for this long at each 15-minute deflation (s) */
  cuffDeflatedS: 60,
  /** a cuff pressure within this of 20 mmHg below systolic counts as Bertrand's (mmHg; the reading's resolution) */
  bertrandToleranceMmHg: 3,
  /** the vascular surgeons reach the patient this long after the call, and take the arm to theatre (s) */
  surgeonsArriveS: 900,
  /** the call counts as 'at once' within this time of the signs being reported (s; scoring setting) */
  callWithinS: 600,
  /** a haematoma still growing this long after it was found has its treatment scored as it stands (s; scoring setting) */
  treatmentVerdictAfterS: 1800,
  /** the share of shed blood taken from the engine's stressed volume (the session's MP_SESSION.bleedStressedShare) */
  stressedShare: 0.35,
};

/** The two accepted cuff schemes (sourced: 06-access-complications.ts:623-627 and :702). */
export const CUFF_SCHEMES = {
  /** Oxford: up to 15 mmHg below systolic */
  oxfordMaxBelowMmHg: 15,
  /** Bertrand's chart: 20 mmHg below systolic, let down every 15 minutes, finger saturation watched */
  bertrandBelowMmHg: 20,
  bertrandDeflateEveryMin: 15,
};

// ---------------------------------------------------------------------------
// Extent, grade and circumference
// ---------------------------------------------------------------------------

/** The extent of the haematoma from the puncture (cm): haematomaCm (closure.ts). */
export const forearmExtentCm = (ml: number): number => haematomaCm(ml);

/** The volume whose extent is `cm` (mL). */
export const forearmMlForExtent = (cm: number): number => haematomaMlForCm(cm);

/** The grade of a haematoma of this volume (0 for none): the EASY grade of its extent, V with the compartment signs. */
export function forearmGrade(ml: number, compartment = false, elbowCm = MP_FOREARM.elbowCm): EasyGrade {
  const cm = forearmExtentCm(ml);
  if (compartment) return 5;
  return easyGradeFromSize(cm, cm >= elbowCm, false);
}

/** Whether the swelling reaches above the elbow. */
export const aboveElbow = (ml: number, elbowCm = MP_FOREARM.elbowCm): boolean => forearmExtentCm(ml) >= elbowCm;

/** The patient's own forearm circumference (cm) from the BMI (MODEL PARAMETER). */
export function baselineForearmCircCm(bmi: number): number {
  const m = MP_FOREARM;
  const c = m.forearmCircAtBmi25Cm + (bmi - 25) * m.forearmCircPerBmiCm;
  return Math.min(m.forearmCircMaxCm, Math.max(m.forearmCircMinCm, c));
}

const tape = (cm: number) => Math.round(cm / MP_FOREARM.tapeStepCm) * MP_FOREARM.tapeStepCm;

/** One mark of a set of measurements: where (cm above the wrist crease), this arm and the other (cm). */
export interface CircMark {
  label: string;
  atCm: number;
  cm: number;
  otherCm: number;
}

/**
 * The circumferences at the marks (the forearm marks and the arm above the elbow), with the other arm's for
 * comparison: a mark within the swollen length gains volume / extent of cross-section (a cylinder).
 */
export function circumferences(ml: number, bmi: number, elbowCm = MP_FOREARM.elbowCm): CircMark[] {
  const base = baselineForearmCircCm(bmi);
  const extent = forearmExtentCm(ml);
  const at = (markCm: number, own: number): number => {
    if (ml <= 0 || markCm > extent || extent <= 0) return own;
    return Math.sqrt(own * own + (4 * Math.PI * ml) / extent);
  };
  const out: CircMark[] = MP_FOREARM.forearmMarksCm.map((d) => ({ label: `Forearm ${d} cm above the wrist`, atCm: d, cm: tape(at(d, base)), otherCm: tape(base) }));
  const armAt = elbowCm + MP_FOREARM.armAboveElbowCm;
  const arm = base + MP_FOREARM.armExtraCm;
  out.push({ label: `Arm ${MP_FOREARM.armAboveElbowCm} cm above the elbow`, atCm: armAt, cm: tape(at(armAt, arm)), otherCm: tape(arm) });
  return out;
}

// ---------------------------------------------------------------------------
// Growth
// ---------------------------------------------------------------------------

/** What acts on the source now. */
export interface ForearmGrowthInputs {
  /** the source's own rate (mL/min) */
  sourceMlMin: number;
  /** the true ACT (s) */
  actS: number;
  /** an intravenous antiplatelet infusion is running */
  antiplatelet: boolean;
  /** the true systolic pressure (mmHg) */
  sysMmHg: number;
  /** the measures in place */
  measures: ReadonlySet<ForearmMeasure>;
  /** the cuff now: inflated below or above systolic, or not inflated */
  cuff: "below" | "above" | null;
  /** the radial band has been taken off */
  bandOff: boolean;
}

/** The rate the haematoma grows at now (mL/min). */
export function forearmGrowthMlMin(o: ForearmGrowthInputs): number {
  const m = MP_FOREARM;
  const f = m.factor;
  let k = Math.min(m.actMaxK, Math.max(m.actMinK, o.actS / m.actRefS));
  if (o.antiplatelet) k *= m.antiplateletK;
  k *= Math.min(m.sysMaxK, Math.max(m.sysMinK, o.sysMmHg / m.sysRefMmHg));
  const has = (x: ForearmMeasure) => o.measures.has(x);
  if (o.bandOff) k *= f.bandOff;
  else if (has("reposition-band") || has("second-band")) k *= f.band * (has("reposition-band") && has("second-band") ? f.secondBandToo : 1);
  if (has("ice")) k *= f.ice;
  if (has("sling")) k *= f.sling;
  if (has("analgesia")) k *= f.analgesia;
  if (has("bp-control")) k *= f.bpControl;
  if (has("bandage")) k *= f.bandage;
  if (o.cuff === "below") k *= f.cuffBelow;
  else if (o.cuff === "above") k *= f.cuffAbove;
  return Math.max(0, o.sourceMlMin) * k;
}

/** A source of bleeding into the forearm, stepped by stepForearmSource. */
export interface ForearmSource {
  /** the haematoma's volume (mL) */
  ml: number;
  /** the source stops on its own once the haematoma reaches this (mL), if set */
  capMl: number | null;
  /** when the source stopped for good (s), or null */
  sealedAt: number | null;
  /** since when the rate has been below the sealing rate (s), or null */
  lowSince: number | null;
}

/** Step the source by h seconds at time t (s) with this rate (mL/min). Returns the mL added. */
export function stepForearmSource(src: ForearmSource, h: number, t: number, rateMlMin: number): number {
  if (src.sealedAt !== null || h <= 0) return 0;
  if (rateMlMin < MP_FOREARM.sealBelowMlMin) {
    src.lowSince ??= t - h;
    if (t - src.lowSince >= MP_FOREARM.sealAfterS) {
      src.sealedAt = t;
      return 0;
    }
  } else src.lowSince = null;
  let add = (rateMlMin * h) / 60;
  if (src.capMl !== null) add = Math.max(0, Math.min(add, src.capMl - src.ml));
  src.ml += add;
  if (src.capMl !== null && src.ml >= src.capMl - 1e-9) src.sealedAt = t;
  return add;
}

// ---------------------------------------------------------------------------
// The cuff
// ---------------------------------------------------------------------------

export interface CuffSetting {
  /** the cuff pressure (mmHg) */
  mmHg: number;
  /** let down every this many minutes, or null (no plan to let it down) */
  deflateEveryMin: number | null;
  /** a saturation probe on a finger of that hand while the cuff is up */
  fingerSat: boolean;
}

export interface CuffGrade {
  scheme: "oxford" | "bertrand" | null;
  correct: boolean;
  /** inflated at or above systolic */
  aboveSystolic: boolean;
  reasons: string[];
  expected: string;
}

export const CUFF_EXPECTED =
  "Below systolic by one of the two schemes: up to 15 mmHg below systolic (Oxford), or 20 mmHg below systolic let down every 15 minutes (Bertrand's chart); the finger saturation watched while it is up, and never left up without a plan to let it down";

/** Grade a cuff for a forearm haematoma against the systolic pressure at the time (pure). */
export function gradeForearmCuff(c: CuffSetting, sysMmHg: number): CuffGrade {
  const below = sysMmHg - c.mmHg;
  const reasons: string[] = [];
  const aboveSystolic = below <= 0;
  let scheme: CuffGrade["scheme"] = null;
  if (aboveSystolic) reasons.push(`${Math.round(c.mmHg)} mmHg is at or above the systolic of ${Math.round(sysMmHg)} mmHg: it shuts off the arm's inflow.`);
  else if (below <= CUFF_SCHEMES.oxfordMaxBelowMmHg) scheme = "oxford";
  else if (Math.abs(below - CUFF_SCHEMES.bertrandBelowMmHg) <= MP_FOREARM.bertrandToleranceMmHg) {
    if (c.deflateEveryMin === CUFF_SCHEMES.bertrandDeflateEveryMin) scheme = "bertrand";
    else reasons.push("20 mmHg below systolic is Bertrand's setting, which lets the cuff down every 15 minutes.");
  } else reasons.push(`${Math.round(below)} mmHg below the systolic of ${Math.round(sysMmHg)} mmHg is lower than either scheme.`);
  if (c.deflateEveryMin === null) reasons.push("No plan to let the cuff down.");
  if (!c.fingerSat) reasons.push("The finger saturation is not watched while the cuff is up.");
  return { scheme, correct: scheme !== null && c.deflateEveryMin !== null && c.fingerSat, aboveSystolic, reasons, expected: CUFF_EXPECTED };
}

// ---------------------------------------------------------------------------
// Treatment by grade, and the compartment call
// ---------------------------------------------------------------------------

export interface TreatmentGrade {
  correct: boolean;
  missing: string[];
  expected: string;
}

const TREATMENT_WORD = { analgesia: "analgesia", band: "an extra band (or the band moved over the hole)", ice: "ice", cuff: "an arm cuff below systolic", surgery: "the vascular surgeons" } as const;

/** The chart's treatment for a grade, in words. */
export function chartTreatmentText(g: ForearmGrade): string {
  const c = BERTRAND_CHART[g];
  const items = c.treatment.map((t) => TREATMENT_WORD[t]);
  const tell = c.tell === "inform" ? "; tell the operator" : c.tell === "call-now" ? "; call at once" : "";
  return `Grade ${GRADE_LABEL[g]}: ${items.join(", ")}${tell}`;
}

/**
 * Was the chart's treatment for the grade given (pure)? For I-IV: analgesia, an extra band or the band moved, ice,
 * with the cuff for III and IV (an accepted scheme) and the operator told from II. Grade V is the compartment call,
 * graded on its own.
 */
export function gradeForearmTreatment(g: ForearmGrade, done: ReadonlySet<ForearmMeasure>, cuffAccepted: boolean): TreatmentGrade {
  const c = BERTRAND_CHART[g];
  const missing: string[] = [];
  for (const t of c.treatment) {
    if (t === "analgesia" && !done.has("analgesia")) missing.push(TREATMENT_WORD.analgesia);
    if (t === "band" && !done.has("reposition-band") && !done.has("second-band")) missing.push(TREATMENT_WORD.band);
    if (t === "ice" && !done.has("ice")) missing.push(TREATMENT_WORD.ice);
    if (t === "cuff" && !(done.has("cuff") && cuffAccepted)) missing.push(TREATMENT_WORD.cuff);
    if (t === "surgery" && !done.has("call-surgeons")) missing.push(TREATMENT_WORD.surgery);
  }
  if (c.tell !== "none" && !done.has(c.tell === "call-now" ? "call-surgeons" : "inform")) missing.push(c.tell === "inform" ? "the operator told" : "the call");
  return { correct: missing.length === 0, missing, expected: chartTreatmentText(g) };
}

export interface CompartmentResponse {
  /** the surgeons were called within the window of the signs being reported */
  callCorrect: boolean | null;
  /** a compression measure was used after the signs (wrong) */
  compressedAfter: boolean;
  /** the first action after the signs */
  first: ForearmMeasure | null;
}

/** The response to the compartment signs (pure): the actions after `signsAt` and the time now (s). */
export function gradeCompartmentResponse(actions: readonly { id: ForearmMeasure; t: number }[], signsAt: number, now: number): CompartmentResponse {
  const after = actions.filter((a) => a.t >= signsAt);
  const call = after.find((a) => a.id === "call-surgeons");
  // compression after the signs is wrong whether it comes before the call or while the surgeons are on their way
  const compressedAfter = after.some((a) => COMPRESSION_MEASURES.includes(a.id));
  let callCorrect: boolean | null = null;
  if (call) callCorrect = call.t - signsAt <= MP_FOREARM.callWithinS;
  else if (now - signsAt > MP_FOREARM.callWithinS) callCorrect = false;
  return { callCorrect, compressedAfter, first: after[0]?.id ?? null };
}

// ---------------------------------------------------------------------------
// What the learner sees (signs only; the grade is the learner's to give)
// ---------------------------------------------------------------------------

/** The forearm and hand on examination: the extent, the feel, and the hand's colour, pulses, movement and sensation. */
export function forearmExamText(ml: number, compartment: boolean, elbowCm = MP_FOREARM.elbowCm): string {
  const cm = forearmExtentCm(ml);
  if (ml < MP_FOREARM.palpableMl) return "The wrist and forearm are soft and not swollen. The hand is pink and warm; radial and ulnar pulses are felt; the fingers move and feel normally.";
  const reach = cm >= elbowCm ? `from the wrist to above the elbow (about ${Math.round(cm)} cm)` : cm > 10 ? `from the wrist to about ${Math.round(cm)} cm up the forearm, still below the elbow` : `about ${Math.round(cm)} cm across at the wrist and lower forearm`;
  if (compartment)
    return `The forearm is swollen ${reach}, tense and very tender. Passively extending the fingers makes the pain much worse. The hand is pale and cool; the radial pulse cannot be felt; the fingers barely move, and the patient says they are numb and tingling.`;
  const feel = cm > 10 ? "firm and tender" : "soft to firm and a little tender";
  return `A swelling ${reach}, ${feel}. The hand is pink and warm; radial and ulnar pulses are felt; the fingers move normally and feel normal; passive finger extension is not painful.`;
}
