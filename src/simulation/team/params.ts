// ---------------------------------------------------------------------------
// Team model parameters.
//
// Every number here is a MODEL PARAMETER chosen for teaching (docs/realism/
// facts/C4.md, "Model parameters"), except where a fact id is given. None of
// the query thresholds is a dosing reference: they only decide when the
// simulated nurse asks the operator to confirm an order, so that a slip of
// unit or decimal is caught the way a careful nurse would catch it.
// ---------------------------------------------------------------------------

import type { DrugId } from "../patient/pharmacology";

export const TEAM_PARAMS = {
  /** delay before a team member starts to answer, s (uniform range) */
  respondS: [0.6, 1.4] as [number, number],
  /** the patient answers a little more slowly, s */
  patientRespondS: [0.9, 2.0] as [number, number],
  /** speaking rate, words per second (sets caption duration and the speech queue) */
  wordsPerS: 2.6,
  /** IV drug drawn up and given after the read-back, s */
  ivPrepS: [8, 18] as [number, number],
  /** IC or IA syringe drawn up, labelled and passed to the table, s */
  icPrepS: [12, 25] as [number, number],
  /** equipment fetched and opened onto the table, s */
  fetchS: [15, 35] as [number, number],
  /** ACT sample drawn and loaded into the machine, s (the result then takes the clotting time itself, fact C4-F9) */
  actSampleS: 25,
  /** operator confirmation of a read-back within this window closes the loop, s */
  ackWindowS: 10,
  /** a team member waits this long for an answer to a query before asking again, s */
  queryRepeatS: 12,
  /** probability that a read-back is misheard (wrong number) */
  mishearP: 0.02,
  /** probability that an opened item is not what was asked for (wrong-item event) */
  wrongItemP: 0.03,
  /** physiologist calls a damped or ventricularised trace after this long, s */
  dampedCalloutS: 1.5,
  /** sats callout below this SpO2, % */
  spo2CalloutBelow: 92,
  /** patient vitals and symptoms sampled at this interval, s */
  patientSampleS: 0.5,
  /** a patient warning counts for an event within this many seconds after it */
  warnWindowS: 120,
  /** a patient warning given this soon after the event does not count, s */
  warnLateS: 0,
  /** contrast into the root or LV of at least this volume gives the warmth sensation, mL */
  warmthMinMl: 15,
  /** chance that such an injection is felt as warmth (fact C4-F6: more than 90% report warmth with intra-arterial contrast) */
  warmthP: 0.9,
  /** breath-hold level as a fraction of a full inspiration */
  breathHoldLevel: 0.8,
  /** the patient lets go of a held breath after this long, s (shorter when breathless) */
  breathHoldMaxS: 20,
  breathHoldMaxBreathlessS: 8,
  /** patient chest pain thresholds (0-10 scale of the S9 engine) for speaking, with hysteresis */
  painSpeak: [3, 6] as [number, number],
  painEased: 1,
  /** symptom (0..1) above which the patient mentions it */
  symptomSpeak: 0.5,
  itchSpeak: 0.4,
  anxietySpeak: 0.7,
  /** the patient does not speak below this conscious level */
  consciousSpeak: 0.4,
  /** the sedation nurse calls out drowsiness below this conscious level */
  drowsyCallout: 0.3,
  /** minimum time between two remarks on the same topic, s */
  topicCooldownS: 25,
  anxietyCooldownS: 90,
  /** C-arm: the radiographer reports arrival within this many degrees */
  carmArriveDeg: 0.5,
  /** "a bit more" C-arm, degrees */
  carmNudgeDeg: 5,
  /** C-arm velocity the radiographer requests through the input bus when no drive port exists, deg/s */
  carmBusSpeed: 10,
  /** alarms silenced for this long on request, s */
  silenceS: 120,
  /** default defibrillator energy when none is stated, J */
  defaultJoules: 200,
} as const;

/**
 * Single doses above which the nurse asks for confirmation (MODEL PARAMETERS, set well above usual
 * lab doses so that only a slip of unit or decimal triggers them; not a dosing reference).
 * Units are the drug's own (pharmacology.ts DRUGS[drug].unit).
 */
export const QUERY_ABOVE: Record<DrugId, number> = {
  heparin: 15000, // U
  protamine: 100, // mg
  gtn: 1000, // µg
  adenosine: 400, // µg intracoronary; IV boluses use QUERY_ABOVE_IV_ADENOSINE
  verapamil: 5, // mg
  atropine: 3, // mg
  metaraminol: 5, // mg
  phenylephrine: 500, // µg
  noradrenaline: 100, // µg
  adrenaline: 1000, // µg
  midazolam: 5, // mg
  fentanyl: 150, // µg
  chlorphenamine: 20, // mg
  hydrocortisone: 500, // mg
  // found-patient-formulary: the same rule (MODEL PARAMETERS well above the module's stated doses,
  // pharmacology.ts FORMULARY_REFERENCE, so that only a slip of unit or decimal is queried)
  flumazenil: 1, // mg (the module's total is 1 mg)
  naloxone: 2, // mg
  diazepam: 20, // mg
  propofol: 200, // mg
  dobutamine: 1000, // µg (infusion-only: a bolus is queried by the nurse anyway)
  dopamine: 1000, // µg (infusion-only)
  vasopressin: 5, // U (infusion-only)
  isoprenaline: 200, // µg
  furosemide: 250, // mg
  salbutamol: 10, // mg
  amiodarone: 450, // mg
  lidocaine: 200, // mg
  metoprolol: 15, // mg
  flecainide: 200, // mg
  aminophylline: 500, // mg
  nicardipine: 1000, // µg
  nitroprusside: 1000, // µg
  eptifibatide: 40000, // µg (weight-based bolus)
  tirofiban: 5000, // µg (weight-based bolus)
  cangrelor: 5000, // µg (weight-based bolus)
  bivalirudin: 150, // mg (weight-based bolus)
  idarucizumab: 5000, // mg (the module's dose is 5 g in two 2.5 g doses)
  andexanet: 2000, // mg
  pcc: 10000, // U
  aspirin: 600, // mg
  clopidogrel: 600, // mg
  prasugrel: 60, // mg
  ticagrelor: 180, // mg
};

/** IV adenosine bolus, µg (model, as above). */
export const QUERY_ABOVE_IV_ADENOSINE = 18000;

/** Which team member gives which drug. */
export const DRUG_ROLE: Record<DrugId, "scrub" | "sedation"> = {
  heparin: "scrub",
  protamine: "scrub",
  gtn: "scrub",
  adenosine: "scrub",
  verapamil: "scrub",
  atropine: "sedation",
  metaraminol: "sedation",
  phenylephrine: "sedation",
  noradrenaline: "sedation",
  adrenaline: "sedation",
  midazolam: "sedation",
  fentanyl: "sedation",
  chlorphenamine: "sedation",
  hydrocortisone: "sedation",
  // found-patient-formulary: IV drugs, reversal agents and oral loads go to the sedation nurse;
  // intracoronary and procedural antithrombotic drugs to the scrub nurse
  flumazenil: "sedation",
  naloxone: "sedation",
  diazepam: "sedation",
  propofol: "sedation",
  dobutamine: "sedation",
  dopamine: "sedation",
  vasopressin: "sedation",
  isoprenaline: "sedation",
  furosemide: "sedation",
  salbutamol: "sedation",
  amiodarone: "sedation",
  lidocaine: "sedation",
  metoprolol: "sedation",
  flecainide: "sedation",
  aminophylline: "sedation",
  nicardipine: "scrub",
  nitroprusside: "scrub",
  eptifibatide: "scrub",
  tirofiban: "scrub",
  cangrelor: "scrub",
  bivalirudin: "scrub",
  idarucizumab: "sedation",
  andexanet: "sedation",
  pcc: "sedation",
  aspirin: "sedation",
  clopidogrel: "sedation",
  prasugrel: "sedation",
  ticagrelor: "sedation",
};
