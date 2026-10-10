// ---------------------------------------------------------------------------
// Temporary pacing engine.
//
// Pure, deterministic model of temporary ventricular pacing for teaching:
//
//   • Lead navigation: a transvenous lead is advanced / withdrawn / rotated
//     through a small topological map of the right heart (SVC or IVC → RA →
//     tricuspid → RV apex or septum), with the classic malpositions (coronary
//     sinus, RV outflow tract / pulmonary artery, IVC and hepatic vein, RA
//     appendage) and over-advancement leading to perforation.
//   • Electrophysiology at the tip: capture threshold (depends on zone and
//     tip contact), sensed R / T / P amplitudes, current of injury.
//   • A 1 ms tick rhythm engine: sinus or atrial activity, AV conduction or
//     block, escape rhythms, a VVI / VOO pacing box (rate, output in mA,
//     sensitivity in mV, refractory period), transcutaneous pacing, noise,
//     undersensing / oversensing, functional non-capture and R-on-T spikes.
//   • Waveforms: surface ECG (lead II and V1), unipolar tip electrogram and
//     an arterial line built from beat-by-beat stroke contributions, so long
//     pauses, non-captured spikes and premature beats show up naturally.
//   • Scripted troubleshooting faults and a scoring function.
//
// Numbers marked "model" are illustrative values chosen to make the teaching
// behaviour visible. They are not patient data and not device specifications.
// Sourced anchors (docs/SIM_FACTS.md item 17): a capture threshold below 1 mA
// is acceptable; output is set at 2 to 3 times the threshold, defaulting to
// about 2.5 times (or per local protocol). Teaching conventions also used:
// sensitivity set at about half the measured R-wave amplitude; normal VVI
// behaviour.
// ---------------------------------------------------------------------------

export type PacingScenarioId =
  | "inferior-chb"
  | "tavi-chb"
  | "sinus-arrest"
  | "epicardial"
  // in-lab bradycardia (pacing-in-lab-scenarios-and-tips)
  | "inlab-rca-chb-rbbb"
  | "inlab-adenosine-avb"
  | "inlab-amiodarone-avb";
export type AccessRoute = "rij" | "femoral" | "left-subclavian" | "epicardial";
export type LeadZone =
  | "svc"
  | "ivc"
  | "hepatic"
  | "ra"
  | "raa"
  | "cs"
  | "rv-inflow"
  | "rv-apex"
  | "rv-septum"
  | "rvot"
  | "pa"
  | "perforated"
  | "epicardial";
/** Direction the curved lead tip points, set by rotating the lead. */
export type TipDirection = "tv" | "posterior" | "lateral" | "superior";
export type Morph =
  | "narrow"
  | "wide-escape"
  | "paced-rv-apex"
  | "paced-rv-septum"
  | "paced-lv"
  | "paced-epicardial"
  | "tcp";
export type PaceMode = "VVI" | "VOO" | "OFF";
export type FaultKind = "displacement" | "threshold-rise" | "undersensing" | "noise-oversensing";
export type Diagnosis = "loss-of-capture" | "undersensing" | "oversensing" | "failure-to-output" | "normal";

// --- Scenarios ---------------------------------------------------------------

export interface PacingScenario {
  id: PacingScenarioId;
  title: string;
  short: string;
  vignette: string;
  /** sinus (atrial) rate in bpm; null if no organised atrial activity */
  atrialRate: number | null;
  /** optional cycled list of P–P intervals (s) — used for sinus arrest */
  sinusPattern?: number[];
  /** does the AV node conduct at baseline? */
  avConduction: boolean;
  /** PR interval for conducted beats, s */
  pr: number;
  /** ventricular escape rate, bpm (null = no reliable escape) */
  escapeRate: number | null;
  escapeMorph: Morph;
  escapeLabel: string;
  /** sensed R-wave amplitude on a well-seated RV lead, mV (model) */
  rWave: number;
  /** far-field atrial signal amplitude seen from the RA, mV (model) */
  pWave: number;
  /** tissue multiplier for ventricular thresholds (model) */
  thresholdFactor: number;
  /** extra stroke volume when a beat follows a properly timed P wave (model) */
  atrialKick: number;
  /** arterial model: mmHg contributed by a full stroke (model) */
  strokeGain: number;
  /** arterial run-off time constant, s (model) */
  tau: number;
  /** transcutaneous capture threshold, mA (model) */
  tcpThreshold: number;
  /** haemodynamically compromised at presentation (a transcutaneous bridge is expected) */
  unstable: boolean;
  /** pacing-dependent: the intrinsic rate is too slow to test sensing safely */
  dependent: boolean;
  /** scripted troubleshooting events after hand-over, in order */
  events: FaultKind[];
  /** fixed route (epicardial wires) */
  fixedRoute?: AccessRoute;
  teaching: string[];
  /**
   * In-lab bradycardia: the block began in the cath lab and the run opens with a choice of initial
   * management (waiting, atropine, a cough, stopping an infusion, external pacing, a femoral wire)
   * before the insertion and box stages (pacing-in-lab-scenarios-and-tips).
   */
  inLab?: InLabCourse;
  /**
   * The output margin over the measured threshold that this scenario requires (default
   * OUTPUT_MARGIN.min). The in-lab scenarios follow Oxford, "at least three times the threshold"
   * (OXFORD_OUTPUT_MARGIN).
   */
  outputMarginMin?: number;
  /** the units the box reads when the run opens (default "mA"; the in-lab scenarios open on a box that reads volts, as Oxford's does) */
  boxUnits?: BoxUnits;
  /** the access verdicts that differ from ACCESS_INFO in this setting (in the lab the femoral vein is Oxford's usual route) */
  access?: Partial<Record<AccessRoute, Pick<AccessInfo, "verdict" | "why">>>;
}

export const PACING_SCENARIOS: PacingScenario[] = [
  {
    id: "inferior-chb",
    title: "Inferior STEMI with complete heart block",
    short: "Inferior STEMI · CHB",
    vignette:
      "A 67-year-old man with an inferior STEMI from a proximal right coronary occlusion, with right ventricular involvement, has developed complete heart block with a slow escape rhythm. He is hypotensive, clammy and drowsy. Atropine gave only a brief response. Pads are on. You are asked to place a temporary transvenous pacing wire in the cath lab.",
    atrialRate: 92,
    avConduction: false,
    pr: 0.18,
    escapeRate: 38,
    escapeMorph: "narrow",
    escapeLabel: "Complete heart block, narrow junctional escape",
    rWave: 9,
    pWave: 3,
    thresholdFactor: 1.25,
    atrialKick: 0.1,
    strokeGain: 57,
    tau: 1.35,
    tcpThreshold: 70,
    unstable: true,
    dependent: false,
    events: ["undersensing", "displacement"],
    teaching: [
      "Block in inferior infarction is usually at the AV node, with a narrow junctional escape. It is often transient and may resolve with reperfusion.",
      "Right ventricular infarction makes the patient preload and AV-synchrony dependent: avoid nitrates and diuretics, give fluid cautiously, and remember that VVI pacing loses the atrial contribution.",
      "When AV conduction returns, the intrinsic rhythm competes with the pacemaker. Reliable sensing is what stops spikes landing on T waves.",
    ],
  },
  {
    id: "tavi-chb",
    title: "Complete heart block after TAVI",
    short: "Post-TAVI · CHB",
    vignette:
      "An 81-year-old woman is 18 hours after TAVI with a self-expanding valve. She had right bundle branch block before the procedure. She now has complete heart block with a broad, slow escape rhythm, is light-headed and hypotensive. She is very likely to need a permanent pacemaker.",
    atrialRate: 78,
    avConduction: false,
    pr: 0.2,
    escapeRate: 30,
    escapeMorph: "wide-escape",
    escapeLabel: "Complete heart block, broad ventricular escape",
    rWave: 8,
    pWave: 3,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 55,
    tau: 1.45,
    tcpThreshold: 75,
    unstable: true,
    dependent: true,
    events: ["noise-oversensing", "threshold-rise"],
    teaching: [
      "Pre-existing right bundle branch block is a strong predictor of complete heart block after TAVI.",
      "Keep the left side (the usual permanent implant side) free of temporary leads, and plan permanent pacing promptly rather than leaving a temporary wire for days.",
      "A broad infranodal escape is slow and unreliable. Treat the patient as pacing dependent: never turn the box down to test sensing.",
    ],
  },
  {
    id: "sinus-arrest",
    title: "Symptomatic sinus arrest",
    short: "Sinus arrest",
    vignette:
      "A 76-year-old man has recurrent sinus pauses of several seconds between runs of sinus rhythm, with two syncopal episodes on the ward. Reversible causes (rate-limiting drugs, electrolytes, ischaemia, thyroid function) have been checked. Permanent pacing is not possible until tomorrow. A temporary wire is requested as a bridge.",
    atrialRate: 65,
    sinusPattern: [0.92, 0.92, 0.92, 0.92, 0.92, 0.92, 0.92, 0.92, 5.4],
    avConduction: true,
    pr: 0.18,
    escapeRate: null,
    escapeMorph: "narrow",
    escapeLabel: "Sinus rhythm with sinus arrest (no reliable escape)",
    rWave: 10,
    pWave: 3,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 50,
    tau: 1.45,
    tcpThreshold: 65,
    unstable: false,
    dependent: false,
    events: ["undersensing", "noise-oversensing"],
    teaching: [
      "With AV conduction intact, an atrial lead would also work (atrial capture conducts to the ventricles); in complete heart block it would not.",
      "Here the pacemaker is a back-up: set a back-up rate below the sinus rate so the patient's own conducted beats inhibit pacing.",
      "Because there is a good intrinsic rhythm, this is the ideal patient in whom to measure the sensed R wave formally.",
    ],
  },
  {
    id: "epicardial",
    title: "Epicardial wires after cardiac surgery",
    short: "Post-surgery · epicardial",
    vignette:
      "A 64-year-old woman is on day 3 after aortic valve replacement and bypass grafting. She has temporary ventricular epicardial wires. Overnight she developed complete heart block with a slow junctional escape. The pacing box is at the bedside.",
    atrialRate: 88,
    avConduction: false,
    pr: 0.18,
    escapeRate: 42,
    escapeMorph: "narrow",
    escapeLabel: "Complete heart block, narrow junctional escape",
    rWave: 6,
    pWave: 1,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 55,
    tau: 1.45,
    tcpThreshold: 70,
    unstable: false,
    dependent: false,
    events: ["threshold-rise", "noise-oversensing"],
    fixedRoute: "epicardial",
    teaching: [
      "Epicardial wire thresholds tend to rise over the days after surgery. Check threshold and sensing at least daily and act on a rising trend.",
      "Persistent heart block after valve surgery needs a decision about permanent pacing rather than prolonged reliance on epicardial wires.",
      "Removing epicardial wires can cause bleeding and tamponade; follow local protocol for timing and observation.",
    ],
  },

  // --- In-lab bradycardia (pacing-in-lab-scenarios-and-tips) ------------------------------
  // The block begins on the table. Each run opens with the initial management (wait, atropine, a
  // cough, stopping an infusion, external pacing, a femoral wire), then the insertion and box
  // stages. The clinical course is written from lesson hb-additional-procedures-pacing (its table
  // "Pacing situations in the two manuals", Oxford ch 9 and 10, Brilakis 3.7 and 12.2); every number
  // here is a model value (see the "model" note at the top of this file and IN_LAB_MODEL below).
  {
    id: "inlab-rca-chb-rbbb",
    title: "Slow rhythm after a right coronary injection",
    short: "In lab · RCA injection",
    vignette:
      "A 72-year-old man with known right bundle branch block is having diagnostic angiography through a right femoral arterial sheath. Seconds after an injection into the right coronary artery his heart rate falls abruptly and the arterial pressure drops. Thirty seconds later it has not recovered. He is drowsy but rousable. Pads and a temporary pacing box are in the room.",
    atrialRate: 84,
    avConduction: false,
    pr: 0.18,
    escapeRate: 34,
    escapeMorph: "wide-escape",
    escapeLabel: "Complete heart block, broad ventricular escape",
    rWave: 8,
    pWave: 3,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 52,
    tau: 1.4,
    tcpThreshold: 70,
    unstable: true,
    dependent: false,
    events: [],
    outputMarginMin: 3,
    boxUnits: "V",
    access: IN_LAB_ACCESS(),
    inLab: {
      cause: "rca-injection",
      resolvesAfterS: null,
      coughResolves: false,
      atropineResolves: false,
      atropineAtrialFactor: 1.2,
      infusion: false,
      timeLimitS: 180,
      expected: ["atropine", "external-pacing", "femoral-wire"],
      advice: {
        wait: "Oxford ch 10: advanced block in the lab usually recovers within minutes unless ischaemia continues, but waiting is reasonable only while you prepare, not instead of preparing.",
        atropine: "Oxford ch 10: atropine 1 mg IV may improve AV conduction in advanced block during catheterisation. In this scenario it speeds the atrial rate but the block persists.",
        cough: "A cough is Brilakis's first response to AV block after intracoronary adenosine (12.2). It does not treat block after an injection in a patient with conduction disease.",
        "external-pacing": "Oxford ch 9: external pacing is the temporising measure while a wire is placed. The pressure is low, so bridge now.",
        "femoral-wire": "Oxford ch 10: Mobitz II or complete block may need urgent transvenous pacing; Oxford ch 9: the femoral vein, through a sheath larger than the wire.",
      },
    },
    teaching: [
      "Oxford ch 10: advanced AV block during catheterisation usually occurs in patients with known conduction delay, from mechanical injury to a bundle branch (usually the right) or from ischaemia (typically the RCA). Conduction usually returns within minutes unless ischaemia continues.",
      "Oxford ch 10: atropine may improve AV conduction; isoprenaline seldom does, although it can speed the sinus node. External pacing temporises (Oxford ch 9).",
      "Oxford ch 9: threshold from 3 V down, ideally 1 V or less, output at least three times the threshold, and leave the box in demand mode.",
    ],
  },
  {
    id: "inlab-adenosine-avb",
    title: "Slow rhythm after intracoronary adenosine",
    short: "In lab · IC adenosine",
    vignette:
      "A 64-year-old woman is having a pressure-wire study of the right coronary artery through a right femoral arterial sheath. Moments after a bolus of intracoronary adenosine the monitor changes and the arterial pressure falls steeply. She says she feels faint. Pads and a temporary pacing box are in the room.",
    atrialRate: 78,
    avConduction: false,
    pr: 0.18,
    escapeRate: null,
    escapeMorph: "wide-escape",
    escapeLabel: "AV block without an escape rhythm (ventricular standstill)",
    rWave: 9,
    pWave: 3,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 54,
    tau: 1.45,
    tcpThreshold: 65,
    unstable: true,
    dependent: true,
    events: [],
    outputMarginMin: 3,
    boxUnits: "V",
    access: IN_LAB_ACCESS(),
    inLab: {
      cause: "adenosine",
      resolvesAfterS: null,
      coughResolves: false,
      atropineResolves: false,
      atropineAtrialFactor: 1.2,
      infusion: false,
      timeLimitS: 60,
      expected: ["cough", "external-pacing", "femoral-wire"],
      advice: {
        wait: "Brilakis 12.2: AV block after intracoronary adenosine is usually over within seconds, but here there is no escape rhythm; waiting is reasonable only while you prepare.",
        atropine: "The manuals do not name atropine for adenosine-induced block (Brilakis 12.2 gives a cough, then brief CPR and temporary pacing if it persists).",
        cough: "Brilakis 12.2: ask the patient to cough. If block without an escape rhythm persists, brief CPR and temporary pacing may be needed.",
        "external-pacing": "Oxford ch 9: external pacing bridges until the wire is in. With no escape rhythm it is needed at once.",
        "femoral-wire": "Brilakis 12.2: persistent block without an escape rhythm may need temporary pacing; Oxford ch 9: the femoral vein, through a sheath larger than the wire.",
      },
    },
    teaching: [
      "Brilakis 12.2: AV block after intracoronary adenosine is usually over within seconds because of the drug's short half-life; ask the patient to cough. If block without an escape rhythm persists, brief CPR and temporary pacing may be needed.",
      "Brilakis 12.2: to prevent it, avoid intracoronary doses above 100 mcg in the RCA.",
      "Without an escape rhythm the patient is pacing dependent: do not turn the box down to test sensing, and confirm that external pacing produces a pulse (Oxford ch 9).",
    ],
  },
  {
    id: "inlab-amiodarone-avb",
    title: "Slow rhythm during an amiodarone infusion",
    short: "In lab · amiodarone",
    vignette:
      "During a long PCI a fast atrial arrhythmia was treated with an intravenous amiodarone infusion, which is still running. Twenty minutes later the heart rate has slowed markedly. The pressure is holding but is lower than before, and the patient feels light-headed. The femoral arterial sheath is still in place.",
    atrialRate: 56,
    avConduction: false,
    pr: 0.2,
    escapeRate: 40,
    escapeMorph: "narrow",
    escapeLabel: "Complete heart block, narrow junctional escape",
    rWave: 9,
    pWave: 3,
    thresholdFactor: 1.0,
    atrialKick: 0.12,
    strokeGain: 60,
    tau: 1.45,
    tcpThreshold: 70,
    unstable: false,
    dependent: false,
    events: [],
    outputMarginMin: 3,
    boxUnits: "V",
    access: IN_LAB_ACCESS(),
    inLab: {
      cause: "amiodarone",
      resolvesAfterS: null,
      coughResolves: false,
      atropineResolves: false,
      atropineAtrialFactor: 1.1,
      infusion: true,
      timeLimitS: 300,
      expected: ["stop-infusion", "femoral-wire"],
      advice: {
        wait: "Brilakis 3.7: the infusion is still running, so waiting alone does not remove the cause.",
        atropine: "The manuals do not name atropine for amiodarone-induced block; the cause is the infusion (Brilakis 3.7).",
        cough: "A cough is the response to AV block after intracoronary adenosine (Brilakis 12.2), not to block from amiodarone.",
        "stop-infusion": "Brilakis 3.7: amiodarone slows AV nodal conduction and can cause bradycardia or AV block: stop it, and temporary pacing may be needed.",
        "external-pacing": "The pressure is holding, so external pacing is a back-up here rather than essential (Oxford ch 9: the temporising measure while a wire is placed).",
        "femoral-wire": "Brilakis 3.7: temporary pacing may be needed; Oxford ch 9: the femoral vein, through a sheath larger than the wire.",
      },
    },
    teaching: [
      "Brilakis 3.7: amiodarone slows AV nodal conduction and can cause bradycardia or AV block. Stop the infusion; temporary pacing may be needed.",
      "Brilakis 3.7: do not give amiodarone to a patient with second- or third-degree block who has no pacemaker.",
      "With a junctional escape the patient has an intrinsic rhythm: leave the box in demand mode, because asynchronous pacing risks ventricular arrhythmias (Oxford ch 9).",
    ],
  },
];

/** The access verdicts in the cath lab (Oxford ch 9 and ch 3, lesson hb-additional-procedures-pacing). */
function IN_LAB_ACCESS(): NonNullable<PacingScenario["access"]> {
  return {
    femoral: {
      verdict: "preferred",
      why: "Oxford's usual route for a temporary wire, and the vein lies beside the arterial sheath already in the groin. Oxford also names the femoral vein for patients who are anticoagulated or have clotting problems, because its complication risk is low. Use a sheath larger than the wire so that it turns and advances freely.",
    },
    rij: {
      verdict: "acceptable",
      why: "A good route on the ward, but in the lab it means a second sterile field at the neck while the patient is bradycardic; Oxford's in-lab default is the femoral vein.",
    },
  };
}

// --- Variants: practice twins and held-out exam versions -------------------------------------

/** A variant of a scenario: a held-out exam version, or a practice variant of the clinical course. */
export interface PacingVariant {
  id: string;
  title: string;
  /** held out for exams: never linked from lessons or cases, never in the practice index; always runs in exam mode */
  heldOut?: boolean;
  /** what differs from the scenario (the in-lab course is merged field by field) */
  patch: Partial<Omit<PacingScenario, "id" | "inLab">> & { inLab?: Partial<InLabCourse> };
}

/**
 * Variants per scenario. Each in-lab scenario has a held-out "exam" twin with a different patient
 * and different model numbers, so the exam is not the practice run repeated. The adenosine block
 * has a practice pair: "persistent" (the scenario as written, block that does not resolve after a
 * cough) and "transient" (the usual course, Brilakis 12.2: over within seconds, after a cough).
 * src/content/lab/presets/bedside/pacing.launch.ts declares the same variants; its test checks both ways.
 */
export const PACING_VARIANTS: Partial<Record<PacingScenarioId, readonly PacingVariant[]>> = {
  "inlab-rca-chb-rbbb": [
    {
      id: "exam",
      title: "Exam version",
      heldOut: true,
      patch: {
        vignette:
          "A 79-year-old woman with known right bundle branch block is having angiography through a right femoral arterial sheath before valve surgery. After an injection into the right coronary artery her heart rate falls abruptly and the arterial pressure drops; it has not recovered half a minute later. She is pale and slow to respond. Pads and a temporary pacing box are in the room.",
        atrialRate: 90,
        escapeRate: 31,
        rWave: 7,
        thresholdFactor: 1.15,
        strokeGain: 50,
      },
    },
  ],
  "inlab-adenosine-avb": [
    { id: "persistent", title: "Block that persists", patch: {} },
    {
      id: "transient",
      title: "Block that recovers",
      patch: {
        escapeLabel: "AV block without an escape rhythm (transient)",
        inLab: { resolvesAfterS: 12, coughResolves: true },
      },
    },
    {
      id: "exam",
      title: "Exam version",
      heldOut: true,
      patch: {
        vignette:
          "A 70-year-old man is having a pressure-wire study of a right coronary lesion through a right femoral arterial sheath. Shortly after a bolus of intracoronary adenosine the monitor changes and the arterial pressure falls. He becomes grey and stops answering questions. Pads and a temporary pacing box are in the room.",
        atrialRate: 70,
        rWave: 8,
        thresholdFactor: 1.1,
        strokeGain: 56,
      },
    },
  ],
  "inlab-amiodarone-avb": [
    {
      id: "exam",
      title: "Exam version",
      heldOut: true,
      patch: {
        vignette:
          "An intravenous amiodarone infusion was started during PCI for a run of fast atrial fibrillation and is still running. Half an hour later the rate has fallen a long way and the patient says she feels dizzy; the pressure is lower than it was but holding. The femoral arterial sheath is still in.",
        atrialRate: 52,
        escapeRate: 44,
        rWave: 10,
        thresholdFactor: 0.9,
      },
    },
  ],
};

/** The variant of a scenario with this id, or null. */
export function pacingVariant(id: PacingScenarioId, variant: string | null | undefined): PacingVariant | null {
  if (!variant) return null;
  return PACING_VARIANTS[id]?.find((v) => v.id === variant) ?? null;
}

/** The scenario, with a variant's changes applied when one is named (an unknown variant is ignored). */
export function getPacingScenario(id: PacingScenarioId, variant?: string | null): PacingScenario {
  const s = PACING_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown pacing scenario ${id}`);
  const v = pacingVariant(id, variant);
  if (!v) return s;
  const { inLab, ...rest } = v.patch;
  return { ...s, ...rest, ...(s.inLab ? { inLab: { ...s.inLab, ...(inLab ?? {}) } } : {}) };
}

// --- In-lab management (pacing-in-lab-scenarios-and-tips) ---------------------------------------

export type InLabCause = "rca-injection" | "adenosine" | "amiodarone";
export type InitialAction = "wait" | "atropine" | "cough" | "stop-infusion" | "external-pacing" | "femoral-wire";
export const INITIAL_ACTIONS: readonly InitialAction[] = ["wait", "atropine", "cough", "stop-infusion", "external-pacing", "femoral-wire"];

export const INITIAL_ACTION_LABEL: Record<InitialAction, string> = {
  wait: "Wait and watch",
  atropine: "Atropine IV",
  cough: "Ask the patient to cough",
  "stop-infusion": "Stop the amiodarone infusion",
  "external-pacing": "External pacing",
  "femoral-wire": "Femoral venous wire",
};

/** How an in-lab block behaves, and what the manuals expect (the advice text cites them). */
export interface InLabCourse {
  cause: InLabCause;
  /** s after onset at which AV conduction returns by itself; null: not within the run (model) */
  resolvesAfterS: number | null;
  /** a cough restores conduction (model; Brilakis 12.2 asks for one after adenosine block) */
  coughResolves: boolean;
  /** atropine restores conduction (model) */
  atropineResolves: boolean;
  /** factor on the atrial rate once atropine has acted (model) */
  atropineAtrialFactor: number;
  /** an infusion is running that can be stopped */
  infusion: boolean;
  /** the rhythm must be supported (paced with capture, or conducting again) within this many s of onset (model) */
  timeLimitS: number;
  /** the initial actions the manuals expect in this scenario */
  expected: readonly InitialAction[];
  /** what the manuals say about each choice here, with the source (shown after the run, or at once in guided practice) */
  advice: Partial<Record<InitialAction, string>>;
}

/**
 * Model parameters of the in-lab course, all MODEL PARAMETER (docs/realism/facts entry requested in
 * the package report): how long the Wait choice watches, how soon a cough and atropine act.
 */
export const IN_LAB_MODEL = {
  /** the Wait choice watches the monitor for this long, s */
  waitS: 30,
  /** a cough acts within this many s */
  coughEffectS: 2,
  /** atropine acts this many s after it is given */
  atropineOnsetS: 20,
  /**
   * s without a ventricular beat (no escape, nothing conducted or paced) after which the patient no
   * longer responds and cannot cough. The manuals say coughing can keep enough blood reaching the
   * brain to preserve consciousness, and treat the patient with persistent standstill as unconscious
   * (module pci-arrest, Brilakis); the interval itself is a MODEL PARAMETER.
   */
  unresponsiveAfterS: 20,
} as const;

/** Which actions a scenario offers at the start (a cough and stopping an infusion only where they apply to the cause or setting). */
export function initialActionsFor(sc: PacingScenario): InitialAction[] {
  if (!sc.inLab) return [];
  return INITIAL_ACTIONS.filter((a) => (a === "stop-infusion" ? sc.inLab!.infusion : true));
}

export interface InLabAction {
  action: InitialAction;
  /** rhythm time, s */
  t: number;
}

/** The in-lab course so far: when the block began, what was done, and when conduction returned. */
export interface InLabState {
  /** rhythm time at which the block began (the start of the run), s */
  onsetT: number;
  actions: InLabAction[];
  /** rhythm time at which AV conduction returned, or null */
  restoredAt: number | null;
}

export function initialInLabState(onsetT = 0): InLabState {
  return { onsetT, actions: [], restoredAt: null };
}

/** The first time an action was taken, or null. */
export function actionAt(st: InLabState, a: InitialAction): number | null {
  return st.actions.find((x) => x.action === a)?.t ?? null;
}

/** When conduction returns given what has been done (rhythm time, s), or null if nothing done so far restores it. */
export function conductionReturnTime(sc: PacingScenario, st: InLabState): number | null {
  const c = sc.inLab;
  if (!c) return null;
  const times: number[] = [];
  if (c.resolvesAfterS !== null) times.push(st.onsetT + c.resolvesAfterS);
  const cough = actionAt(st, "cough");
  if (c.coughResolves && cough !== null) times.push(cough + IN_LAB_MODEL.coughEffectS);
  const atropine = actionAt(st, "atropine");
  if (c.atropineResolves && atropine !== null) times.push(atropine + IN_LAB_MODEL.atropineOnsetS);
  return times.length ? Math.min(...times) : null;
}

/**
 * Does the patient still respond (and so can cough)? Not once there has been no ventricular beat for
 * IN_LAB_MODEL.unresponsiveAfterS; a beat of any origin (escape, conducted, paced, external) restores it.
 * Outside an in-lab run the patient always responds.
 */
export function patientResponsive(s: RhythmState, st: InLabState | null, t = nowOf(s)): boolean {
  if (!st) return true;
  return t - Math.max(st.onsetT, s.lastV) < IN_LAB_MODEL.unresponsiveAfterS;
}

/** Record an initial action at rhythm time t (an action already taken is not recorded twice). */
export function applyInitialAction(sc: PacingScenario, st: InLabState, action: InitialAction, t: number): InLabState {
  if (!sc.inLab || actionAt(st, action) !== null) return st;
  if (action === "stop-infusion" && !sc.inLab.infusion) return st;
  return inLabTick(sc, { ...st, actions: [...st.actions, { action, t }] }, t);
}

/** Advance the course to rhythm time t: conduction returns once its time has come. */
export function inLabTick(sc: PacingScenario, st: InLabState, t: number): InLabState {
  if (st.restoredAt !== null) return st;
  const due = conductionReturnTime(sc, st);
  return due !== null && t >= due ? { ...st, restoredAt: due } : st;
}

/** The faults with AV conduction restored once the course says so. */
export function withInLabConduction(f: Faults, st: InLabState | null): Faults {
  const back = !!st && st.restoredAt !== null;
  return back === f.conductionReturned ? f : { ...f, conductionReturned: back };
}

/** The scenario as the rhythm engine should run it at time t: the atrial rate rises once atropine has acted. */
export function effectiveScenario(sc: PacingScenario, st: InLabState | null, t: number): PacingScenario {
  const at = st ? actionAt(st, "atropine") : null;
  if (!sc.inLab || at === null || sc.atrialRate === null || t < at + IN_LAB_MODEL.atropineOnsetS) return sc;
  return { ...sc, atrialRate: Math.round(sc.atrialRate * sc.inLab.atropineAtrialFactor) };
}

/**
 * Is the rhythm supported now? Paced with capture on (nearly) every beat by the box or external
 * pacing, or the patient's own conduction back, with no long pause in the window.
 */
export function rhythmSupported(n: PacingNumerics, c: Pick<PacingContext, "box" | "tcp" | "faults">): boolean {
  if (n.longestPause > 3) return false;
  if (c.faults.conductionReturned && n.hr > 0) return true;
  const pacing = (c.tcp.on && n.tcpCapture) || (c.box.connected && c.box.mode !== "OFF" && !n.lossOfCapture);
  return pacing && n.pacedPct >= 80;
}

/** Asynchronous pacing while the patient has an intrinsic rhythm (an escape, or conduction back). */
export function asynchronousWithIntrinsic(sc: PacingScenario, f: Faults, box: BoxSettings): boolean {
  return box.connected && box.mode === "VOO" && intrinsicRate(sc, f) > 0;
}

/** What the lab records about the in-lab course for scoring. */
export interface InLabLog {
  onsetT: number;
  actions: InLabAction[];
  /** rhythm time at which the rhythm was first supported, or null */
  supportedAt: number | null;
  restoredAt: number | null;
  /** the box paced asynchronously at some point while there was an intrinsic rhythm */
  asyncWithIntrinsic: boolean;
  /** a transvenous wire was placed and connected */
  wirePlaced: boolean;
}

export type InLabCriterionId = "supported-in-time" | "no-cs-accepted" | "output-margin" | "demand-mode" | "no-async-with-intrinsic";

export interface InLabCriterion {
  id: InLabCriterionId;
  label: string;
  met: boolean;
  detail: string;
}

/**
 * The pass criteria of an in-lab scenario (lab request hb-additional-procedures#0): the rhythm
 * supported within the scenario's time limit; no coronary sinus position accepted; output at least
 * three times the measured threshold; the box left in demand mode; no asynchronous pacing in a
 * patient with an intrinsic rhythm. When conduction returned and no wire was placed, the wire
 * criteria do not apply.
 */
export function inLabCriteria(log: PacingRunLog): InLabCriterion[] {
  const sc = getPacingScenario(log.scenarioId, log.variant);
  const c = sc.inLab;
  const L = log.inLab;
  if (!c || !L) return [];
  const units = log.units ?? "mA";
  const out: InLabCriterion[] = [];
  const within = L.supportedAt !== null && L.supportedAt - L.onsetT <= c.timeLimitS + 1e-9;
  out.push({
    id: "supported-in-time",
    label: "Rhythm supported in time",
    met: within,
    detail:
      L.supportedAt === null
        ? "The rhythm was never supported."
        : `Supported ${formatClock(L.supportedAt - L.onsetT)} after the block began (limit ${formatClock(c.timeLimitS)}).`,
  });
  const noWireNeeded = !L.wirePlaced && L.restoredAt !== null;
  if (noWireNeeded) {
    for (const [id, label] of [
      ["no-cs-accepted", "No coronary sinus position accepted"],
      ["output-margin", "Output at least three times the threshold"],
      ["demand-mode", "Box left in demand mode"],
    ] as [InLabCriterionId, string][])
      out.push({ id, label, met: true, detail: "Conduction returned; no wire was needed." });
  } else {
    out.push({
      id: "no-cs-accepted",
      label: "No coronary sinus position accepted",
      met: L.wirePlaced && log.finalZone !== "cs",
      detail: !L.wirePlaced ? "No wire was placed." : log.finalZone === "cs" ? "The wire was secured in the coronary sinus." : `Wire secured. Final position: ${ZONE_LABEL[log.finalZone]}.`,
    });
    const margin = requiredMargin(sc);
    const thr = log.thresholdMeasured;
    const ratio = thr ? log.finalOutput / thr : 0;
    out.push({
      id: "output-margin",
      label: `Output at least ${margin === OXFORD_OUTPUT_MARGIN ? "three" : margin} times the threshold`,
      met: L.wirePlaced && thr !== null && thr > 0 && ratio >= margin - 1e-9,
      detail:
        thr === null
          ? "The threshold was not measured."
          : `Output ${formatOutput(log.finalOutput, units)} is ${ratio.toFixed(1)} times the measured threshold of ${formatOutput(thr, units)}.`,
    });
    out.push({
      id: "demand-mode",
      label: "Box left in demand mode",
      met: L.wirePlaced && log.finalMode === "VVI",
      detail: log.finalMode === "VVI" ? "VVI (demand)." : log.finalMode === "VOO" ? "Left asynchronous (VOO)." : "Left off.",
    });
  }
  out.push({
    id: "no-async-with-intrinsic",
    label: "No asynchronous pacing with an intrinsic rhythm",
    met: !L.asyncWithIntrinsic,
    detail: L.asyncWithIntrinsic ? "The box paced asynchronously while the patient had a rhythm of their own." : "None.",
  });
  return out;
}

/** An in-lab run passes when every criterion is met. */
export function inLabPassed(log: PacingRunLog): boolean {
  const c = inLabCriteria(log);
  return c.length > 0 && c.every((x) => x.met);
}

// --- Box units: volts or milliamps (pacing-in-lab-scenarios-and-tips) ---------------------------

/** What the box's output dial reads. Sensitivity reads millivolts on both boxes. */
export type BoxUnits = "mA" | "V";

/**
 * Lead impedance used to show the output in volts, ohms. MODEL PARAMETER (docs/realism/facts entry
 * requested in the package report). It is not 1000 ohm, so the two dials read different numbers for
 * the same output and the units matter when a threshold is quoted (1 mA reads 0.5 V). It keeps the
 * model's milliamp anchor (docs/SIM_FACTS.md item 17: threshold below 1 mA, so below 0.5 V) inside the
 * lesson's volt anchors (Oxford ch 9: start at 3 V, threshold ideally 1 V or less; 3 V is within the
 * volt dial). The engine works in milliamps; a box reading volts converts through this impedance.
 */
export const LEAD_IMPEDANCE_OHM = 500;

/** Oxford ch 9 (lesson hb-additional-procedures-pacing): set the output to at least three times the threshold. */
export const OXFORD_OUTPUT_MARGIN = 3;

/** The margin a scenario requires: the in-lab scenarios follow Oxford (3 times), the others SIM_FACTS item 17 (2 to 3 times). */
export function requiredMargin(sc: PacingScenario): number {
  return sc.outputMarginMin ?? OUTPUT_MARGIN.min;
}

/** An output in mA as the box shows it. */
export function outputIn(mA: number, units: BoxUnits, ohm = LEAD_IMPEDANCE_OHM): number {
  return units === "mA" ? mA : (mA * ohm) / 1000;
}

/** A dial value in the box's units, as the engine's mA. */
export function outputFrom(value: number, units: BoxUnits, ohm = LEAD_IMPEDANCE_OHM): number {
  return units === "mA" ? value : (value * 1000) / ohm;
}

/** "2.5 mA" or "2.5 V". */
export function formatOutput(mA: number, units: BoxUnits = "mA", ohm = LEAD_IMPEDANCE_OHM): string {
  return `${round1(outputIn(mA, units, ohm))} ${units}`;
}

/** The output dial's limits in the box's units (on the volt dial, rounded onto its 0.1 V steps). */
export function outputLimits(units: BoxUnits, ohm = LEAD_IMPEDANCE_OHM): [number, number] {
  const lo = outputIn(BOX_LIMITS.output[0], units, ohm);
  const hi = outputIn(BOX_LIMITS.output[1], units, ohm);
  return units === "mA" ? [lo, hi] : [Math.max(0.1, round1(lo)), round1(hi)];
}

/** Step the output dial in the box's units, with the same dial law as stepOutput (0.1 steps to 2, 0.5 to 5, then 1). */
export function stepOutputIn(value: number, dir: 1 | -1, units: BoxUnits, ohm = LEAD_IMPEDANCE_OHM): number {
  if (units === "mA") return stepOutput(value, dir);
  const v = value;
  const step = dir > 0 ? (v < 2 - 1e-9 ? 0.1 : v < 5 - 1e-9 ? 0.5 : 1) : v <= 2 + 1e-9 ? 0.1 : v <= 5 + 1e-9 ? 0.5 : 1;
  const [lo, hi] = outputLimits(units, ohm);
  return clamp(round1(v + dir * step), round1(lo), round1(hi));
}

function formatClock(s: number): string {
  const x = Math.max(0, Math.round(s));
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;
}

// --- Sheath fit (Oxford ch 9: a sheath larger than the wire) --------------------------------------

/** The venous sheath against the pacing wire: one size larger (Oxford ch 9), or the same size. */
export type SheathFit = "larger" | "same";

/** Fraction of a rotation that reaches the tip when the sheath is the same size as the wire (MODEL PARAMETER). */
export const TIGHT_SHEATH_TORQUE = 0.35;

/** Rotate the lead through a sheath: a sheath the same size as the wire binds it, so less of the turn reaches the tip. */
export function rotateThroughSheath(lead: LeadState, deg: number, fit: SheathFit | null): LeadState {
  return rotateLead(lead, fit === "same" ? deg * TIGHT_SHEATH_TORQUE : deg);
}

// --- Access ------------------------------------------------------------------

export interface AccessInfo {
  id: AccessRoute;
  label: string;
  verdict: "preferred" | "acceptable" | "discouraged";
  why: string;
}

export const ACCESS_INFO: Record<AccessRoute, AccessInfo> = {
  rij: {
    id: "rij",
    label: "Right internal jugular",
    verdict: "preferred",
    why: "Short, direct route to the right ventricle with a stable lead position, easy ultrasound-guided puncture, and it leaves the left side free for a permanent system.",
  },
  femoral: {
    id: "femoral",
    label: "Femoral vein",
    verdict: "acceptable",
    why: "Quick under fluoroscopy and compressible, so useful in the lab and after thrombolysis. Leads displace more easily with leg movement, the patient is immobilised, and infection and thrombosis risks rise with time; crossing the tricuspid valve often needs a loop in the right atrium.",
  },
  "left-subclavian": {
    id: "left-subclavian",
    label: "Left subclavian",
    verdict: "discouraged",
    why: "The left subclavian / axillary / cephalic system is the usual site for a permanent pacemaker. A temporary wire there risks venous thrombosis or occlusion and infection at the future implant site. The subclavian vessels are also non-compressible if the patient is anticoagulated or thrombolysed, and there is a pneumothorax risk.",
  },
  epicardial: {
    id: "epicardial",
    label: "Epicardial wires",
    verdict: "preferred",
    why: "Wires placed on the heart at surgery; connect them to the box and test them. No venous access is needed.",
  },
};

/** The access verdict in this scenario's setting (the in-lab scenarios prefer the femoral vein). */
export function accessInfoFor(sc: PacingScenario, route: AccessRoute): AccessInfo {
  const o = sc.access?.[route];
  return o ? { ...ACCESS_INFO[route], ...o } : ACCESS_INFO[route];
}

// --- Lead model ----------------------------------------------------------------

export interface LeadState {
  route: AccessRoute;
  zone: LeadZone;
  /** position within the current zone (model cm), 0..ZONE_LEN */
  pos: number;
  /** tip rotation in degrees, 0..359; 0 points toward the tricuspid valve */
  rot: number;
  /** force applied beyond a terminal position (model cm) */
  push: number;
  /** femoral approach: a loop has been formed against the lateral RA wall */
  loop: boolean;
  /** a perforation has occurred at some point */
  perforated: boolean;
}

export const ZONE_LEN: Record<LeadZone, number> = {
  svc: 12,
  ivc: 10,
  hepatic: 4,
  ra: 4,
  raa: 2,
  cs: 6,
  "rv-inflow": 3,
  "rv-apex": 2,
  "rv-septum": 2,
  rvot: 3,
  pa: 5,
  perforated: 1,
  epicardial: 1,
};

/** Push (model cm) against the apex or septum that perforates the RV. */
export const PERFORATION_PUSH = 1.5;

export const ZONE_LABEL: Record<LeadZone, string> = {
  svc: "Superior vena cava",
  ivc: "Inferior vena cava",
  hepatic: "Hepatic vein",
  ra: "Right atrium",
  raa: "Right atrial appendage",
  cs: "Coronary sinus",
  "rv-inflow": "RV inflow (free in the cavity)",
  "rv-apex": "RV apex",
  "rv-septum": "RV septum",
  rvot: "RV outflow tract",
  pa: "Pulmonary artery",
  perforated: "Through the RV wall (perforation)",
  epicardial: "Epicardial wires",
};

export const DIRECTION_LABEL: Record<TipDirection, string> = {
  tv: "Anterior-leftward (toward the tricuspid valve and RV apex)",
  posterior: "Posterior-medial (coronary sinus os, septum)",
  lateral: "Lateral (RA free wall)",
  superior: "Superior-anterior (RA appendage, RV outflow)",
};

export function initialLead(route: AccessRoute): LeadState {
  return {
    route,
    zone: route === "epicardial" ? "epicardial" : route === "femoral" ? "ivc" : "svc",
    pos: route === "epicardial" ? ZONE_LEN.epicardial : 0,
    rot: 0,
    push: 0,
    loop: false,
    perforated: false,
  };
}

export function normRot(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function directionOf(rot: number): TipDirection {
  const idx = Math.round(normRot(rot) / 90) % 4;
  return (["tv", "posterior", "lateral", "superior"] as TipDirection[])[idx];
}

const TERMINAL: LeadZone[] = ["rv-apex", "rv-septum", "raa", "cs", "pa", "hepatic", "perforated", "epicardial"];
const CONTACT_ZONES: LeadZone[] = ["rv-apex", "rv-septum", "raa", "cs", "epicardial"];

const superiorRoute = (r: AccessRoute) => r === "rij" || r === "left-subclavian";

/** Zone entered when advancing off the far end of `zone`. "loop" = buckles in place. */
export function nextZone(lead: LeadState): LeadZone | "loop" | null {
  const dir = directionOf(lead.rot);
  const { zone, route } = lead;
  if (TERMINAL.includes(zone)) return null;
  if (superiorRoute(route)) {
    switch (zone) {
      case "svc":
        return "ra";
      case "ra":
        return dir === "tv" ? "rv-inflow" : dir === "posterior" ? "cs" : dir === "lateral" ? "ivc" : "raa";
      case "ivc":
        return "hepatic";
      case "rv-inflow":
        return dir === "posterior" ? "rv-septum" : dir === "superior" ? "rvot" : "rv-apex";
      case "rvot":
        return "pa";
      default:
        return null;
    }
  }
  if (route === "femoral") {
    switch (zone) {
      case "ivc":
        return dir === "lateral" ? "hepatic" : "ra";
      case "ra":
        if (dir === "lateral") return "loop";
        if (dir === "posterior") return "cs";
        if (dir === "tv") return lead.loop ? "rv-inflow" : "svc";
        return "svc";
      case "svc":
        return null; // continues up toward the neck; treated as terminal
      case "rv-inflow":
        return dir === "posterior" ? "rv-septum" : dir === "superior" ? "rvot" : "rv-apex";
      case "rvot":
        return "pa";
      default:
        return null;
    }
  }
  return null;
}

/** Zone re-entered when withdrawing out of the near end of `zone`. */
export function prevZone(lead: LeadState): LeadZone | null {
  const { zone, route } = lead;
  if (route === "epicardial") return null;
  const sup = superiorRoute(route);
  switch (zone) {
    case "svc":
      return sup ? null : "ra";
    case "ra":
      return sup ? "svc" : "ivc";
    case "ivc":
      return sup ? "ra" : null;
    case "hepatic":
      return "ivc";
    case "raa":
    case "cs":
    case "rv-inflow":
      return "ra";
    case "rv-apex":
    case "rv-septum":
    case "rvot":
      return "rv-inflow";
    case "pa":
      return "rvot";
    case "perforated":
      return "rv-apex";
    default:
      return null;
  }
}

export interface LeadMove {
  lead: LeadState;
  messages: string[];
}

const ENTRY_MSG: Partial<Record<LeadZone, string>> = {
  ra: "The tip is in the right atrium: large atrial deflections on the tip electrogram.",
  "rv-inflow": "The lead has crossed the tricuspid valve: the ventricular deflection on the tip electrogram becomes large. It is still free in the cavity.",
  "rv-apex": "The tip is heading for the RV apex, pointing to the left and inferiorly on AP.",
  "rv-septum": "The tip is turned onto the septum.",
  rvot: "The tip has flicked up into the RV outflow tract. Free-floating here; withdraw and redirect toward the apex.",
  pa: "The lead has passed the pulmonary valve into the pulmonary artery. Withdraw.",
  cs: "The lead has entered the coronary sinus: it runs up and leftward on AP but POSTERIORLY on the lateral view. Withdraw and redirect anteriorly.",
  ivc: "The lead is in the IVC. Withdraw to the RA and redirect.",
  hepatic: "The tip has entered a hepatic vein, below the cardiac silhouette and off to the right. Withdraw.",
  raa: "The tip is caught in the right atrial appendage.",
  svc: "The lead is in the SVC.",
};

/** Advance (positive) or withdraw (negative) the lead by `cm` (model units). */
export function moveLead(lead: LeadState, cm: number): LeadMove {
  if (lead.route === "epicardial") return { lead, messages: [] };
  const l: LeadState = { ...lead };
  const messages: string[] = [];
  if (cm > 0) {
    let remaining = cm;
    while (remaining > 1e-9) {
      const len = ZONE_LEN[l.zone];
      const room = len - l.pos;
      if (remaining <= room) {
        l.pos += remaining;
        remaining = 0;
        break;
      }
      l.pos = len;
      remaining -= room;
      const nz = nextZone(l);
      if (nz === "loop") {
        if (!l.loop) messages.push("The lead buckles against the lateral RA wall and forms a loop. Rotate so the tip points toward the tricuspid valve, then advance to prolapse across.");
        l.loop = true;
        remaining = 0;
        break;
      }
      if (nz === null) {
        // Terminal: further advance becomes push
        l.push += remaining;
        remaining = 0;
        if ((l.zone === "rv-apex" || l.zone === "rv-septum") && l.push > PERFORATION_PUSH) {
          l.zone = "perforated";
          l.pos = ZONE_LEN.perforated * 0.5;
          l.push = 0;
          l.perforated = true;
          messages.push("Perforation: the lead has been pushed through the RV wall. Pacing threshold rises, the paced complex changes to a right bundle branch block pattern, and the patient may have chest pain or hiccups. Withdraw into the cavity and look for a pericardial effusion on echo.");
        } else if (l.zone === "rv-apex" || l.zone === "rv-septum") {
          messages.push("Firm resistance: the tip is wedged against the myocardium. Do not push further.");
        }
        break;
      }
      l.zone = nz;
      l.pos = 0;
      const m = ENTRY_MSG[nz];
      if (m) messages.push(m);
    }
  } else if (cm < 0) {
    let remaining = -cm;
    if (l.push > 0) {
      const d = Math.min(l.push, remaining);
      l.push -= d;
      remaining -= d;
    }
    while (remaining > 1e-9) {
      if (remaining <= l.pos) {
        l.pos -= remaining;
        remaining = 0;
        break;
      }
      remaining -= l.pos;
      const pz = prevZone(l);
      if (pz === null) {
        l.pos = 0;
        remaining = 0;
        messages.push("The lead is fully withdrawn to the sheath.");
        break;
      }
      if (l.zone === "perforated") messages.push("Withdrawn back into the RV cavity. A perforation has occurred: check echo for an effusion.");
      if (pz === "ivc" || pz === "svc") l.loop = false;
      l.zone = pz;
      l.pos = ZONE_LEN[pz];
      const m = ENTRY_MSG[pz];
      if (m && pz !== "rv-inflow") messages.push(m);
    }
  }
  return { lead: l, messages };
}

export function rotateLead(lead: LeadState, deg: number): LeadState {
  return { ...lead, rot: normRot(lead.rot + deg) };
}

export interface LeadInfo {
  zone: LeadZone;
  label: string;
  direction: TipDirection;
  /** tip contact with myocardium 0..1 */
  contact: number;
  /** stable, low-threshold ventricular position */
  stable: boolean;
  inRV: boolean;
  /** recognised malposition, or null */
  malposition: string | null;
  /** course on the lateral view */
  lateralCourse: "anterior" | "posterior" | "midline" | "inferior";
  /** current of injury on the tip electrogram, 0..1 */
  injury: number;
}

export function leadContact(lead: LeadState): number {
  if (!CONTACT_ZONES.includes(lead.zone)) return 0;
  return Math.max(0, Math.min(1, lead.pos / ZONE_LEN[lead.zone]));
}

export function leadInfo(lead: LeadState): LeadInfo {
  const contact = leadContact(lead);
  const z = lead.zone;
  const inRV = z === "rv-apex" || z === "rv-septum" || z === "rv-inflow" || z === "rvot";
  const stable = (z === "rv-apex" || z === "rv-septum" || z === "epicardial") && contact >= 0.6;
  let malposition: string | null = null;
  if (z === "cs") malposition = "Coronary sinus: posterior course on the lateral view; any capture is of the LV, with a right bundle branch block pattern.";
  else if (z === "rvot") malposition = "RV outflow tract: free-floating, unstable, high threshold.";
  else if (z === "pa") malposition = "Pulmonary artery: no ventricular capture.";
  else if (z === "hepatic") malposition = "Hepatic vein: no cardiac capture; may stimulate the diaphragm.";
  else if (z === "ivc") malposition = "IVC: below the heart.";
  else if (z === "raa") malposition = "RA appendage: atrial capture only.";
  else if (z === "perforated") malposition = "Perforation through the RV wall.";
  const lateralCourse: LeadInfo["lateralCourse"] =
    z === "cs" ? "posterior" : inRV || z === "perforated" || z === "pa" ? "anterior" : z === "hepatic" || z === "ivc" ? "inferior" : "midline";
  const injury = z === "rv-apex" || z === "rv-septum" ? contact : z === "epicardial" ? 0.3 : z === "raa" ? contact * 0.5 : z === "cs" ? contact * 0.25 : 0;
  return { zone: z, label: ZONE_LABEL[z], direction: directionOf(lead.rot), contact, stable, inRV, malposition, lateralCourse, injury };
}

// --- Electrophysiology at the tip --------------------------------------------

interface ZoneEp {
  /** base ventricular capture threshold, mA (null = cannot capture the ventricle) */
  vThr: number | null;
  /** atrial capture threshold, mA */
  aThr: number | null;
  /** sensed R-wave fraction of the scenario R wave */
  rF: number;
  /** sensed far-field P fraction */
  pF: number;
  /** beat-to-beat threshold variability from an unstable tip (0..1) */
  instability: number;
  morph: Morph;
  /** output at which the diaphragm is stimulated (null = not in model) */
  phrenicAt: number | null;
}

// All values here are model values.
const ZONE_EP: Record<LeadZone, ZoneEp> = {
  svc: { vThr: null, aThr: null, rF: 0.05, pF: 0.6, instability: 0, morph: "paced-rv-apex", phrenicAt: null },
  ivc: { vThr: null, aThr: null, rF: 0.05, pF: 0.2, instability: 0, morph: "paced-rv-apex", phrenicAt: null },
  hepatic: { vThr: null, aThr: null, rF: 0.02, pF: 0.05, instability: 0, morph: "paced-rv-apex", phrenicAt: 5 },
  ra: { vThr: null, aThr: null, rF: 0.15, pF: 1.0, instability: 0, morph: "paced-rv-apex", phrenicAt: null },
  raa: { vThr: null, aThr: 1.2, rF: 0.1, pF: 1.0, instability: 0.1, morph: "paced-rv-apex", phrenicAt: null },
  cs: { vThr: 2.5, aThr: null, rF: 0.35, pF: 0.5, instability: 0.2, morph: "paced-lv", phrenicAt: null },
  "rv-inflow": { vThr: 4.0, aThr: null, rF: 0.4, pF: 0.15, instability: 0.8, morph: "paced-rv-apex", phrenicAt: null },
  "rv-apex": { vThr: 0.6, aThr: null, rF: 1.0, pF: 0.05, instability: 0.05, morph: "paced-rv-apex", phrenicAt: null },
  "rv-septum": { vThr: 0.65, aThr: null, rF: 0.9, pF: 0.05, instability: 0.08, morph: "paced-rv-septum", phrenicAt: null },
  rvot: { vThr: 3.0, aThr: null, rF: 0.6, pF: 0.1, instability: 0.6, morph: "paced-rv-septum", phrenicAt: null },
  pa: { vThr: null, aThr: null, rF: 0.1, pF: 0.1, instability: 0, morph: "paced-rv-septum", phrenicAt: null },
  perforated: { vThr: 3.5, aThr: null, rF: 0.3, pF: 0.05, instability: 0.3, morph: "paced-lv", phrenicAt: 8 },
  epicardial: { vThr: 2.0, aThr: null, rF: 1.0, pF: 0.3, instability: 0.05, morph: "paced-epicardial", phrenicAt: null },
};

export interface Faults {
  /** multiplier on the ventricular capture threshold (threshold rise) */
  thresholdMult: number;
  /** multiplier on the sensed R wave (undersensing) */
  rMult: number;
  /** intermittent noise on the lead circuit (loose connection) */
  noise: boolean;
  /** amplitude of that noise as seen by the box, mV (model) */
  noiseAmp: number;
  /** AV conduction has recovered */
  conductionReturned: boolean;
}

/** Default noise amplitude seen by the box during a connection fault, mV (model). */
export const NOISE_AMP = 3;

export const NO_FAULTS: Faults = { thresholdMult: 1, rMult: 1, noise: false, noiseAmp: NOISE_AMP, conductionReturned: false };

export interface TipEp {
  vThr: number | null;
  aThr: number | null;
  instability: number;
  morph: Morph;
  phrenicAt: number | null;
}

export function tipEp(lead: LeadState, sc: PacingScenario, f: Faults = NO_FAULTS): TipEp {
  const ep = ZONE_EP[lead.zone];
  const c = leadContact(lead);
  const contactMult = CONTACT_ZONES.includes(lead.zone) ? 1 + 2 * (1 - c) : 1;
  const vThr = ep.vThr === null ? null : round1(ep.vThr * sc.thresholdFactor * contactMult * f.thresholdMult);
  const aThr = ep.aThr === null ? null : round1(ep.aThr * contactMult);
  return { vThr, aThr, instability: ep.instability, morph: ep.morph, phrenicAt: ep.phrenicAt };
}

/** Ventricular capture threshold (mA) at the current tip position, or null if no ventricular capture is possible. */
export function captureThreshold(lead: LeadState, sc: PacingScenario, f: Faults = NO_FAULTS): number | null {
  return tipEp(lead, sc, f).vThr;
}

/**
 * The lowest output (mA, to 0.1) that captures on EVERY beat at this position,
 * allowing for beat-to-beat variation from an unstable tip. This is what a
 * threshold test measures.
 */
export function consistentThreshold(lead: LeadState, sc: PacingScenario, f: Faults = NO_FAULTS): number | null {
  const ep = tipEp(lead, sc, f);
  if (ep.vThr === null) return null;
  return Math.ceil(ep.vThr * (1 + ep.instability) * 10 - 1e-6) / 10;
}

/** Does a pulse of `output` mA capture, given threshold `thr` (null = never)? */
export function captures(output: number, thr: number | null): boolean {
  return thr !== null && output >= thr;
}

export interface SensedSignals {
  /** intrinsic R wave on the lead, mV */
  r: number;
  /** T wave after an intrinsic beat, mV */
  t: number;
  /** evoked T wave after a paced beat, mV */
  tPaced: number;
  /** far-field atrial signal, mV */
  p: number;
  /** noise from a connection fault, mV (0 if none) */
  noise: number;
}

export function sensedSignals(lead: LeadState, sc: PacingScenario, f: Faults = NO_FAULTS): SensedSignals {
  const ep = ZONE_EP[lead.zone];
  const c = leadContact(lead);
  const contactF = CONTACT_ZONES.includes(lead.zone) ? 0.6 + 0.4 * c : 1;
  const r = round2(sc.rWave * ep.rF * contactF * f.rMult);
  return {
    r,
    t: round2(r * 0.18),
    tPaced: round2(r * 0.22),
    p: round2(sc.pWave * ep.pF),
    noise: f.noise ? f.noiseAmp * 1.15 : 0,
  };
}

export type SensingStatus = "appropriate" | "undersensing" | "oversensing";

export interface SensingAssessment {
  status: SensingStatus;
  undersensing: boolean;
  tOversensing: boolean;
  pOversensing: boolean;
  noiseOversensing: boolean;
  /** sensitivity <= half the R wave */
  margin: boolean;
}

/**
 * A signal is sensed when its amplitude is at least the sensitivity setting
 * (in mV). A HIGHER number is LESS sensitive.
 */
export function assessSensing(sensitivity: number, s: SensedSignals): SensingAssessment {
  const undersensing = s.r < sensitivity;
  const tOversensing = s.tPaced >= sensitivity || s.t >= sensitivity;
  const pOversensing = s.p >= sensitivity;
  const noiseOversensing = s.noise > 0 && s.noise >= sensitivity;
  const over = tOversensing || pOversensing || noiseOversensing;
  return {
    status: undersensing ? "undersensing" : over ? "oversensing" : "appropriate",
    undersensing,
    tOversensing,
    pOversensing,
    noiseOversensing,
    margin: sensitivity <= s.r / 2,
  };
}

/** Output margin over threshold: 2 to 3 times, default about 2.5 times (SIM_FACTS item 17). */
export const OUTPUT_MARGIN = { min: 2, default: 2.5, max: 3 } as const;
/** Acceptable capture threshold: below this, mA (SIM_FACTS item 17). */
export const ACCEPTABLE_THRESHOLD = 1;

/** About 2.5 times the threshold, rounded up to 0.1 mA (follow local protocol). */
export function recommendedOutput(threshold: number): number {
  return Math.min(20, Math.ceil(threshold * OUTPUT_MARGIN.default * 10 - 1e-6) / 10);
}

/** About half the measured R wave (a twofold sensing margin). */
export function recommendedSensitivity(rWave: number): number {
  return Math.max(0.5, Math.floor((rWave / 2) * 2) / 2);
}

// --- Box controls ---------------------------------------------------------------

export interface BoxSettings {
  mode: PaceMode;
  rate: number; // ppm
  output: number; // mA
  sensitivity: number; // mV
  connected: boolean;
}

export interface TcpSettings {
  on: boolean;
  rate: number;
  current: number; // mA
  demand: boolean;
}

export const BOX_LIMITS = { rate: [30, 180], output: [0.1, 20], sensitivity: [0.5, 20] } as const;
export const TCP_LIMITS = { rate: [30, 180], current: [0, 200] } as const;

export const DEFAULT_BOX: BoxSettings = { mode: "VVI", rate: 70, output: 5, sensitivity: 2, connected: false };
export const DEFAULT_TCP: TcpSettings = { on: false, rate: 70, current: 0, demand: true };

/** Step the output dial: 0.1 mA steps up to 2 mA, 0.5 mA to 5 mA, then 1 mA. */
export function stepOutput(v: number, dir: 1 | -1): number {
  const step = dir > 0 ? (v < 2 - 1e-9 ? 0.1 : v < 5 - 1e-9 ? 0.5 : 1) : v <= 2 + 1e-9 ? 0.1 : v <= 5 + 1e-9 ? 0.5 : 1;
  return clamp(round1(v + dir * step), BOX_LIMITS.output[0], BOX_LIMITS.output[1]);
}

/** Step the sensitivity dial in 0.5 mV steps. */
export function stepSensitivity(v: number, dir: 1 | -1): number {
  return clamp(Math.round((v + dir * 0.5) * 2) / 2, BOX_LIMITS.sensitivity[0], BOX_LIMITS.sensitivity[1]);
}

export function stepRate(v: number, dir: 1 | -1): number {
  return clamp(Math.round(v + dir * 5), BOX_LIMITS.rate[0], BOX_LIMITS.rate[1]);
}

// --- Rhythm engine -----------------------------------------------------------------

/** Ventricular effective refractory period after depolarisation, s (model). */
export const ERP = 0.26;
/** Pacing box ventricular refractory period after a paced or sensed event, s (model). */
export const BOX_REFRACTORY = 0.25;
/** Window after a ventricular depolarisation in which a spike lands on the T wave, s (model). */
export const VULNERABLE: readonly [number, number] = [0.2, 0.42];
/** Arterial upstroke delay after the QRS (electromechanical + transit), s (model). */
export const ART_DELAY = 0.16;
/** Arterial pressure toward which run-off decays during asystole, mmHg (model). */
export const P_FLOOR = 12;

export interface StripEvent {
  t: number;
  kind: "p" | "qrs" | "spike" | "sense" | "noise";
  origin?: "sinus" | "paced-atrial" | "conducted" | "escape" | "paced" | "tcp";
  morph?: Morph;
  stroke?: number;
  source?: "box" | "tcp";
  captured?: boolean;
  chamber?: "v" | "a" | "none";
  refractory?: boolean;
  onT?: boolean;
  phrenic?: boolean;
  amp?: number;
}

export interface RhythmState {
  /** integer milliseconds of simulated time */
  ms: number;
  nextSinus: number;
  sinusIdx: number;
  pendingConduction: number | null;
  lastV: number;
  lastA: number;
  lastBox: number;
  lastBoxPace: number;
  lastTcp: number;
  spikeIdx: number;
  /** consecutive paced beats (drives overdrive suppression of the escape focus) */
  pacedRun: number;
  pendingT: { t: number; amp: number } | null;
  noiseNext: number;
  rng: number;
  events: StripEvent[];
}

export interface PacingContext {
  scenario: PacingScenario;
  lead: LeadState;
  box: BoxSettings;
  tcp: TcpSettings;
  faults: Faults;
}

export const nowOf = (s: RhythmState) => s.ms / 1000;

/** Create a rhythm state with `preroll` seconds of the untreated rhythm already run. */
export function createRhythm(sc: PacingScenario, preroll = 10, seed = 12345): RhythmState {
  const s: RhythmState = {
    ms: 0,
    nextSinus: 0.35,
    sinusIdx: 0,
    pendingConduction: null,
    lastV: -0.6,
    lastA: -1,
    lastBox: -10,
    lastBoxPace: -10,
    lastTcp: -10,
    spikeIdx: 0,
    pacedRun: 0,
    pendingT: null,
    noiseNext: 0,
    rng: seed >>> 0,
    events: [],
  };
  if (preroll > 0) {
    advanceRhythm(
      s,
      {
        scenario: sc,
        lead: initialLead(sc.fixedRoute ?? "rij"),
        box: { ...DEFAULT_BOX, mode: "OFF", connected: false },
        tcp: { ...DEFAULT_TCP },
        faults: NO_FAULTS,
      },
      preroll
    );
  }
  return s;
}

function rand(s: RhythmState): number {
  // xorshift32 — deterministic per seed
  let x = s.rng || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  s.rng = x;
  return x / 4294967296;
}

/** Deterministic 0..1 sequence used for beat-to-beat threshold variation. */
export function wobble(k: number): number {
  return 0.5 + 0.5 * Math.sin(k * 2.39996);
}

function sinusInterval(sc: PacingScenario, idx: number): number {
  if (sc.sinusPattern && sc.sinusPattern.length) return sc.sinusPattern[idx % sc.sinusPattern.length];
  return 60 / (sc.atrialRate ?? 60);
}

/** Escape interval, prolonged after a run of paced beats (overdrive suppression; model scaling). */
export function escapeInterval(sc: PacingScenario, pacedRun: number): number {
  if (!sc.escapeRate) return Infinity;
  return (60 / sc.escapeRate) * (1 + Math.min(1.5, pacedRun * 0.15));
}

function strokeFor(sc: PacingScenario, rr: number, morph: Morph, kick: boolean): number {
  const fill = clamp(1 - Math.exp(-(rr - 0.15) / 0.38), 0, 1); // diastolic filling time (model)
  const m = morph === "narrow" ? 1 : morph === "tcp" ? 0.8 : 0.85; // dyssynchrony (model)
  return sc.strokeGain * fill * m * (kick ? 1 + sc.atrialKick : 1);
}

function push(s: RhythmState, e: StripEvent) {
  s.events.push(e);
}

function sense(s: RhythmState, c: PacingContext, t: number, amp: number) {
  if (!c.box.connected || c.box.mode !== "VVI") return;
  if (amp < c.box.sensitivity) return;
  if (t - s.lastBox < BOX_REFRACTORY) return;
  s.lastBox = t;
  push(s, { t, kind: "sense", amp });
}

function emitP(s: RhythmState, c: PacingContext, t: number, origin: "sinus" | "paced-atrial") {
  push(s, { t, kind: "p", origin });
  s.lastA = t;
  const conducts = c.scenario.avConduction || c.faults.conductionReturned;
  if (conducts && s.pendingConduction === null) s.pendingConduction = t + c.scenario.pr;
  if (origin === "sinus") sense(s, c, t, sensedSignals(c.lead, c.scenario, c.faults).p);
}

function ventricular(s: RhythmState, c: PacingContext, t: number, origin: StripEvent["origin"], morph: Morph) {
  const rr = t - s.lastV;
  const kick = origin === "conducted";
  push(s, { t, kind: "qrs", origin, morph, stroke: strokeFor(c.scenario, rr, morph, kick) });
  s.lastV = t;
  s.pacedRun = origin === "paced" || origin === "tcp" ? s.pacedRun + 1 : 0;
  const sig = sensedSignals(c.lead, c.scenario, c.faults);
  s.pendingT = { t: t + MORPH[morph].tPeak, amp: origin === "paced" ? sig.tPaced : sig.t };
  if (origin !== "paced") sense(s, c, t, sig.r);
}

function boxPace(s: RhythmState, c: PacingContext, t: number) {
  s.lastBox = t;
  s.lastBoxPace = t;
  const ep = tipEp(c.lead, c.scenario, c.faults);
  const sinceV = t - s.lastV;
  const refractory = sinceV < ERP;
  let onT = false;
  let captured = false;
  let chamber: "v" | "a" | "none" = "none";
  if (ep.vThr !== null) {
    chamber = "v";
    const thr = ep.vThr * (1 + ep.instability * wobble(s.spikeIdx));
    captured = !refractory && c.box.output >= thr;
    // R-on-T: a stimulus strong enough to capture, delivered on the T wave
    onT = sinceV >= VULNERABLE[0] && sinceV <= VULNERABLE[1] && c.box.output >= thr;
  } else if (ep.aThr !== null) {
    chamber = "a";
    captured = t - s.lastA >= 0.3 && c.box.output >= ep.aThr;
  }
  s.spikeIdx++;
  push(s, {
    t,
    kind: "spike",
    source: "box",
    captured,
    chamber,
    refractory: chamber === "v" && refractory,
    onT: chamber === "v" && onT,
    phrenic: ep.phrenicAt !== null && c.box.output >= ep.phrenicAt,
  });
  if (captured && chamber === "v") ventricular(s, c, t, "paced", ep.morph);
  if (captured && chamber === "a") emitP(s, c, t, "paced-atrial");
}

function tcpPace(s: RhythmState, c: PacingContext, t: number) {
  s.lastTcp = t;
  const sinceV = t - s.lastV;
  const refractory = sinceV < ERP;
  const onT = sinceV >= VULNERABLE[0] && sinceV <= VULNERABLE[1] && c.tcp.current >= c.scenario.tcpThreshold;
  const captured = !refractory && c.tcp.current >= c.scenario.tcpThreshold;
  push(s, { t, kind: "spike", source: "tcp", captured, chamber: "v", refractory, onT });
  if (captured) ventricular(s, c, t, "tcp", "tcp");
}

function tick(s: RhythmState, c: PacingContext) {
  const t = s.ms / 1000;
  const sc = c.scenario;
  // 1) atrial activity
  if ((sc.atrialRate !== null || sc.sinusPattern) && t >= s.nextSinus) {
    emitP(s, c, t, "sinus");
    s.nextSinus += sinusInterval(sc, s.sinusIdx++);
  }
  // 2) AV conduction
  if (s.pendingConduction !== null && t >= s.pendingConduction) {
    s.pendingConduction = null;
    if (t - s.lastV >= ERP) ventricular(s, c, t, "conducted", "narrow");
  }
  // 3) escape focus (reset by every ventricular depolarisation; after a run of
  //    paced beats it is overdrive-suppressed and slower to emerge)
  if (sc.escapeRate && t - s.lastV >= escapeInterval(sc, s.pacedRun)) ventricular(s, c, t, "escape", sc.escapeMorph);
  // 4) pacing box
  if (c.box.connected && c.box.mode !== "OFF") {
    const ivl = 60 / c.box.rate;
    const ref = c.box.mode === "VVI" ? s.lastBox : s.lastBoxPace;
    if (t - ref >= ivl - 1e-9) boxPace(s, c, t);
  }
  // 5) transcutaneous pacing
  if (c.tcp.on && c.tcp.current > 0) {
    const ivl = 60 / c.tcp.rate;
    const ref = c.tcp.demand ? Math.max(s.lastTcp, s.lastV) : s.lastTcp;
    if (t - ref >= ivl - 1e-9) tcpPace(s, c, t);
  }
  // 6) T wave reaches the lead electrogram
  if (s.pendingT && t >= s.pendingT.t) {
    const amp = s.pendingT.amp;
    s.pendingT = null;
    sense(s, c, t, amp);
  }
  // 7) intermittent noise (connection fault): bursts of ~3.5 s every 7 s
  if (c.faults.noise) {
    if (t >= s.noiseNext) {
      const inBurst = t % 7 < 3.5;
      if (inBurst) {
        const amp = c.faults.noiseAmp * (0.85 + 0.3 * rand(s));
        push(s, { t, kind: "noise", amp });
        sense(s, c, t, amp);
        s.noiseNext = t + 0.06 + 0.1 * rand(s);
      } else {
        s.noiseNext = t - (t % 7) + 7;
      }
    }
  } else {
    s.noiseNext = t;
  }
}

/**
 * Advance the rhythm by `dt` seconds in 1 ms ticks. Mutates and returns `s`.
 * Deterministic for a given starting state, context and seed.
 */
export function advanceRhythm(s: RhythmState, c: PacingContext, dt: number): RhythmState {
  const endMs = s.ms + Math.round(dt * 1000);
  while (s.ms < endMs) {
    s.ms += 1;
    tick(s, c);
  }
  const cutoff = s.ms / 1000 - 15;
  if (s.events.length > 0 && s.events[0].t < cutoff) {
    let i = 0;
    while (i < s.events.length && s.events[i].t < cutoff) i++;
    s.events.splice(0, i);
  }
  return s;
}

// --- Waveforms ----------------------------------------------------------------------

type Wave = readonly [amp: number, centre: number, width: number];
interface MorphSpec {
  II: Wave[];
  V1: Wave[];
  /** T-wave peak after the QRS onset, s */
  tPeak: number;
  label: string;
}

/**
 * QRS–T morphologies. RV pacing gives a broad left bundle branch block-like
 * complex (negative in V1); apical pacing gives a superior axis (negative in
 * II), septal / outflow pacing an inferior axis. LV capture (coronary sinus,
 * or through a perforation) gives a right bundle branch block-like complex
 * (positive in V1).
 */
export const MORPH: Record<Morph, MorphSpec> = {
  narrow: {
    II: [[-0.12, 0.0, 0.008], [1.1, 0.02, 0.011], [-0.28, 0.045, 0.01], [0.32, 0.3, 0.05]],
    V1: [[0.22, 0.012, 0.01], [-0.95, 0.04, 0.013], [0.12, 0.3, 0.05]],
    tPeak: 0.3,
    label: "narrow QRS",
  },
  "wide-escape": {
    II: [[0.85, 0.045, 0.03], [-0.25, 0.11, 0.025], [-0.35, 0.37, 0.06]],
    V1: [[-0.9, 0.055, 0.035], [0.3, 0.38, 0.06]],
    tPeak: 0.37,
    label: "broad escape",
  },
  "paced-rv-apex": {
    II: [[-0.25, 0.015, 0.012], [-1.0, 0.065, 0.035], [0.45, 0.37, 0.065]],
    V1: [[-1.1, 0.065, 0.035], [0.4, 0.37, 0.065]],
    tPeak: 0.37,
    label: "paced, LBBB pattern, superior axis (RV apex)",
  },
  "paced-rv-septum": {
    II: [[0.95, 0.065, 0.035], [-0.4, 0.37, 0.065]],
    V1: [[-0.95, 0.065, 0.035], [0.35, 0.37, 0.065]],
    tPeak: 0.37,
    label: "paced, LBBB pattern, inferior axis (septum / outflow)",
  },
  "paced-lv": {
    II: [[-0.6, 0.05, 0.03], [0.4, 0.11, 0.03], [0.3, 0.38, 0.065]],
    V1: [[1.05, 0.065, 0.035], [-0.4, 0.38, 0.065]],
    tPeak: 0.38,
    label: "paced, RBBB pattern (LV capture)",
  },
  "paced-epicardial": {
    II: [[0.7, 0.065, 0.04], [-0.3, 0.38, 0.07]],
    V1: [[-0.6, 0.055, 0.035], [0.4, 0.1, 0.03], [0.25, 0.38, 0.07]],
    tPeak: 0.38,
    label: "paced (epicardial)",
  },
  tcp: {
    II: [[1.1, 0.075, 0.045], [-0.6, 0.39, 0.08]],
    V1: [[-1.0, 0.075, 0.045], [0.5, 0.39, 0.08]],
    tPeak: 0.39,
    label: "transcutaneous capture",
  },
};

const P_WAVE: Record<"II" | "V1", Wave[]> = {
  II: [[0.16, 0.04, 0.025]],
  V1: [[0.08, 0.03, 0.02], [-0.06, 0.07, 0.02]],
};

const BOX_SPIKE = { II: 1.6, V1: 1.3 };

function waves(ws: Wave[], u: number): number {
  let v = 0;
  for (const [a, c, w] of ws) {
    const z = (u - c) / w;
    if (z > -5 && z < 5) v += a * Math.exp(-z * z);
  }
  return v;
}

/** Surface ECG (lead II or V1) in mV-like units at time t. */
export function ecgAt(s: RhythmState, t: number, lead: "II" | "V1" = "II"): number {
  let v = 0;
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    const u = t - e.t;
    if (u > 1.0) break;
    if (u < -0.05) continue;
    if (e.kind === "p") v += waves(P_WAVE[lead], u);
    else if (e.kind === "qrs" && e.morph) v += waves(MORPH[e.morph][lead], u);
    else if (e.kind === "spike") {
      if (e.source === "box") {
        if (u >= 0 && u < 0.004) v += BOX_SPIKE[lead];
      } else if (e.source === "tcp") {
        if (u >= 0 && u < 0.006) v += 2.2;
        else if (u >= 0.006 && u < 0.22) v += -1.5 * Math.exp(-(u - 0.006) / 0.05);
      }
    }
  }
  return v;
}

/**
 * ECG over a display interval [t0, t1): returns the sample at t1, but a
 * pacing spike anywhere in the interval wins so it is never lost between
 * screen pixels.
 */
export function ecgRange(s: RhythmState, t0: number, t1: number, lead: "II" | "V1" = "II"): number {
  const base = ecgAt(s, t1, lead);
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    if (e.t < t0 - 0.01) break;
    if (e.kind === "spike" && e.t >= t0 - 1e-9 && e.t < t1) {
      return e.source === "tcp" ? 2.2 : base + BOX_SPIKE[lead];
    }
  }
  return base;
}

/** Arterial pulse contribution of a single stroke (0..1) at u seconds after the upstroke. */
export function pulseShape(u: number, tau: number): number {
  if (u < 0) return 0;
  if (u < 0.1) return 0.5 - 0.5 * Math.cos((Math.PI * u) / 0.1);
  if (u < 0.26) return 1 - (0.12 * (u - 0.1)) / 0.16;
  if (u < 0.3) return 0.88 - (0.08 * (u - 0.26)) / 0.04;
  if (u < 0.36) return 0.8 + 0.04 * Math.sin((Math.PI * (u - 0.3)) / 0.06);
  return 0.8 * Math.exp(-(u - 0.36) / tau);
}

/** Arterial pressure (mmHg) at time t — linear superposition of recent strokes. */
export function arterialAt(s: RhythmState, sc: PacingScenario, t: number): number {
  let p = P_FLOOR;
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    if (e.kind !== "qrs") continue;
    const u = t - e.t - ART_DELAY;
    if (u > 12) break;
    if (u < 0) continue;
    p += (e.stroke ?? 0) * pulseShape(u, sc.tau);
  }
  return p;
}

/**
 * Unipolar tip electrogram (normalised units) — what you would see with the
 * distal electrode connected to a chest lead while positioning: a large atrial
 * signal in the RA, a large ventricular signal in the RV, both in the coronary
 * sinus (it sits in the AV groove), and ST elevation (current of injury) when
 * the tip is in firm contact with the myocardium.
 */
export function tipEgmAt(s: RhythmState, lead: LeadState, t: number): number {
  const z = lead.zone;
  const info = leadInfo(lead);
  const pAmp: Record<LeadZone, number> = {
    svc: -0.9, ivc: 0.25, hepatic: 0.08, ra: 1.3, raa: 1.6, cs: 0.9, "rv-inflow": 0.25,
    "rv-apex": 0.08, "rv-septum": 0.1, rvot: 0.12, pa: 0.15, perforated: 0.05, epicardial: 0.3,
  };
  const vAmp: Record<LeadZone, number> = {
    svc: 0.1, ivc: 0.1, hepatic: 0.05, ra: 0.3, raa: 0.2, cs: 0.9, "rv-inflow": 1.4,
    "rv-apex": 1.8, "rv-septum": 1.7, rvot: 1.2, pa: 0.25, perforated: 0.6, epicardial: 1.2,
  };
  let v = 0;
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    const u = t - e.t;
    if (u > 1.0) break;
    if (u < -0.05) continue;
    if (e.kind === "p") {
      const a = pAmp[z];
      // high RA: negative P; mid RA: biphasic; low RA / below: positive
      if (z === "ra") v += a * (waves([[0.7, 0.03, 0.012], [-0.6, 0.055, 0.012]], u));
      else v += a * waves([[1, 0.035, 0.014]], u);
    } else if (e.kind === "qrs") {
      const a = vAmp[z];
      v += a * waves([[1, 0.02, 0.008], [-0.7, 0.04, 0.01]], u);
      if (info.injury > 0) {
        // current of injury: elevated ST plateau
        const plateau = u > 0.04 && u < 0.32 ? 1 - Math.pow((u - 0.18) / 0.14, 4) : 0;
        v += info.injury * 0.75 * a * Math.max(0, plateau);
      }
      v += 0.15 * a * waves([[1, MORPH[e.morph ?? "narrow"].tPeak, 0.05]], u);
    } else if (e.kind === "spike" && e.source === "box") {
      if (u >= 0 && u < 0.004) v += 2.2;
    }
  }
  return v;
}

// --- Numerics and status ------------------------------------------------------------

export interface PacingNumerics {
  hr: number;
  sys: number;
  dia: number;
  map: number;
  /** % of ventricular beats in the window that were paced (box or TCP) */
  pacedPct: number;
  label: string;
  warning: "none" | "caution" | "danger";
  lossOfCapture: boolean;
  onT: boolean;
  inhibitedPause: boolean;
  /** longest gap between ventricular beats in the window, s */
  longestPause: number;
  phrenic: boolean;
  tcpArtefactOnly: boolean;
  tcpCapture: boolean;
}

export function pacingNumerics(s: RhythmState, c: PacingContext, window = 8): PacingNumerics {
  const t = nowOf(s);
  const from = t - window;
  const recent = s.events.filter((e) => e.t >= from && e.t <= t);
  const qrs = recent.filter((e) => e.kind === "qrs");
  const spikes = recent.filter((e) => e.kind === "spike");
  const boxSpikes = spikes.filter((e) => e.source === "box");
  const tcpSpikes = spikes.filter((e) => e.source === "tcp");
  const senses = recent.filter((e) => e.kind === "sense");

  // HR: mean of the last few RR intervals; a gap longer than that (a pause) pulls it down
  const hrBeats = s.events.filter((e) => e.kind === "qrs" && e.t >= t - 10 && e.t <= t).slice(-7);
  let hr = 0;
  if (hrBeats.length >= 2) {
    const meanRR = (hrBeats[hrBeats.length - 1].t - hrBeats[0].t) / (hrBeats.length - 1);
    const gap = t - hrBeats[hrBeats.length - 1].t;
    hr = Math.round(60 / Math.max(meanRR, gap));
  } else if (hrBeats.length === 1) {
    hr = Math.round(60 / Math.max(1, t - hrBeats[0].t));
  }

  // BP from the waveform over the last 5 s
  let sys = 0;
  let dia = 999;
  let sum = 0;
  let n = 0;
  for (let x = t - 5; x <= t; x += 0.02) {
    const p = arterialAt(s, c.scenario, x);
    sys = Math.max(sys, p);
    dia = Math.min(dia, p);
    sum += p;
    n++;
  }
  const map = n ? sum / n : 0;

  const paced = qrs.filter((e) => e.origin === "paced" || e.origin === "tcp").length;
  const pacedPct = qrs.length ? Math.round((100 * paced) / qrs.length) : 0;

  const lossOfCapture = boxSpikes.some((e) => e.chamber === "v" && !e.captured && !e.refractory) ||
    (c.box.connected && boxSpikes.length > 0 && boxSpikes.every((e) => e.chamber === "none" || (e.chamber === "a" && !e.captured)));
  const onT = spikes.some((e) => e.onT);
  let longestPause = 0;
  let prev = from;
  for (const e of qrs) {
    longestPause = Math.max(longestPause, e.t - prev);
    prev = e.t;
  }
  longestPause = Math.max(longestPause, t - prev);
  const inhibitedPause =
    c.box.connected && c.box.mode === "VVI" && longestPause > 60 / c.box.rate + 0.6 && senses.length > 0 && recent.some((e) => e.kind === "noise" || e.kind === "sense");
  const phrenic = boxSpikes.some((e) => e.phrenic);
  const tcpCapture = tcpSpikes.some((e) => e.captured);
  const tcpArtefactOnly = tcpSpikes.length > 0 && !tcpSpikes.some((e) => e.captured);

  let label = c.scenario.escapeLabel;
  let warning: PacingNumerics["warning"] = c.scenario.unstable ? "caution" : "none";
  if (qrs.length === 0 || longestPause > 3) {
    label = inhibitedPause ? "Pause: pacing inhibited (oversensing)" : "Long pause / ventricular standstill";
    warning = "danger";
  } else if (onT) {
    label = "Competitive pacing: spikes on T waves (R-on-T risk)";
    warning = "danger";
  } else if (lossOfCapture) {
    label = "Pacing spikes without capture (loss of capture)";
    warning = "danger";
  } else if (inhibitedPause) {
    label = "Pacing inhibited: oversensing";
    warning = "danger";
  } else if (tcpArtefactOnly) {
    label = "Transcutaneous spikes and artefact without capture";
    warning = "danger";
  } else if (tcpCapture && pacedPct > 80) {
    label = `Transcutaneous pacing ${c.tcp.rate} ppm: electrical capture`;
    warning = "caution";
  } else if (pacedPct >= 90 && c.box.connected) {
    label = `Paced (${c.box.mode} ${c.box.rate} ppm), consistent capture`;
    warning = "none";
  } else if (pacedPct > 0) {
    label = "Intrinsic and paced beats (demand pacing)";
    warning = "none";
  } else if (c.faults.conductionReturned) {
    label = "Sinus rhythm with AV conduction";
    warning = "none";
  }
  return {
    hr,
    sys: Math.round(sys),
    dia: Math.round(dia === 999 ? 0 : dia),
    map: Math.round(map),
    pacedPct,
    label,
    warning,
    lossOfCapture,
    onT,
    inhibitedPause,
    longestPause,
    phrenic,
    tcpArtefactOnly,
    tcpCapture,
  };
}

/** Intrinsic ventricular rate (bpm) when not paced — used to decide whether sensing can be tested. */
export function intrinsicRate(sc: PacingScenario, f: Faults = NO_FAULTS): number {
  if (sc.avConduction || f.conductionReturned) {
    if (sc.sinusPattern) return Math.round(60 / sc.sinusPattern[0]);
    return sc.atrialRate ?? 0;
  }
  return sc.escapeRate ?? 0;
}

/** Sensing can be tested only if the intrinsic rate exceeds the lowest box rate. */
export function sensingTestable(sc: PacingScenario, f: Faults = NO_FAULTS): boolean {
  return !sc.dependent && intrinsicRate(sc, f) > BOX_LIMITS.rate[0];
}

// --- Troubleshooting faults ---------------------------------------------------------

export interface FaultInfo {
  kind: FaultKind;
  title: string;
  call: string;
  diagnosis: Diagnosis;
  fix: string;
}

export const FAULT_INFO: Record<FaultKind, FaultInfo> = {
  displacement: {
    kind: "displacement",
    title: "Lead displacement",
    call: "The patient sat up to eat. The nurse calls: the monitor shows pacing spikes but the heart rate has dropped and the blood pressure is falling.",
    diagnosis: "loss-of-capture",
    fix: "Turn the output up to maximum and check every connection, start transcutaneous pacing if capture is not restored, then reposition the lead under fluoroscopy and re-measure the threshold.",
  },
  "threshold-rise": {
    kind: "threshold-rise",
    title: "Rising threshold",
    call: "On the routine check the paced rhythm is intermittently failing to capture at the current output.",
    diagnosis: "loss-of-capture",
    fix: "Re-measure the threshold, set the output at 2 to 3 times the new threshold (or per local protocol), look for causes (ischaemia, electrolytes, drugs, lead micro-displacement), and plan definitive pacing if it keeps rising.",
  },
  undersensing: {
    kind: "undersensing",
    title: "Undersensing",
    call: "The patient's own rhythm has returned, but the box keeps firing: some spikes land on T waves.",
    diagnosis: "undersensing",
    fix: "Make the box more sensitive by turning the sensitivity NUMBER down below the R-wave amplitude (staying above the T wave), or reposition the lead if the R wave is too small. Avoid asynchronous pacing while there is a competing rhythm.",
  },
  "noise-oversensing": {
    kind: "noise-oversensing",
    title: "Oversensing",
    call: "There are pauses with no pacing spikes at all, and the box SENSE light is flickering during them.",
    diagnosis: "oversensing",
    fix: "Check and reseat every connection (the bridging cable is a common culprit). Make the box less sensitive by turning the sensitivity number up, staying below the R wave. In a pacing-dependent patient asynchronous mode (VOO) is a temporary measure while you find the cause.",
  },
};

export const DIAGNOSIS_LABEL: Record<Diagnosis, string> = {
  "loss-of-capture": "Loss of capture",
  undersensing: "Undersensing",
  oversensing: "Oversensing",
  "failure-to-output": "Failure to output",
  normal: "Normal pacemaker function",
};

export interface FaultApplied {
  lead: LeadState;
  faults: Faults;
}

/** Apply a scripted fault, sized against the learner's current settings so the problem is visible. */
export function applyFault(kind: FaultKind, sc: PacingScenario, lead: LeadState, faults: Faults, box: BoxSettings): FaultApplied {
  switch (kind) {
    case "displacement":
      if (lead.route === "epicardial") return { lead, faults: { ...faults, thresholdMult: faults.thresholdMult * 4 } };
      // the tip has left the myocardium: earlier tissue-level changes no longer apply
      return { lead: { ...lead, zone: "rv-inflow", pos: 1.5, push: 0 }, faults: { ...faults, rMult: 1, thresholdMult: 1 } };
    case "threshold-rise": {
      const base = captureThreshold(lead, sc, { ...faults, thresholdMult: 1 }) ?? 1;
      const target = clamp(box.output * 1.3, base * 2.5, 8);
      return { lead, faults: { ...faults, thresholdMult: target / base } };
    }
    case "undersensing": {
      const r0 = sensedSignals(lead, sc, { ...faults, rMult: 1 }).r;
      const target = Math.min(r0 * 0.35, box.sensitivity * 0.6);
      return { lead, faults: { ...faults, rMult: Math.max(0.05, target / r0), conductionReturned: true } };
    }
    case "noise-oversensing": {
      // big enough to be sensed at the current setting (a loose connection can produce large artefacts)
      const r = sensedSignals(lead, sc, faults).r;
      const amp = clamp(Math.max(NOISE_AMP, box.sensitivity * 1.5), 1, Math.max(NOISE_AMP, r * 0.85));
      return { lead, faults: { ...faults, noise: true, noiseAmp: round1(amp) } };
    }
  }
}

export interface FaultStatus {
  resolved: boolean;
  partial: boolean;
  detail: string;
}

export function faultStatus(kind: FaultKind, sc: PacingScenario, lead: LeadState, faults: Faults, box: BoxSettings): FaultStatus {
  const thr = consistentThreshold(lead, sc, faults);
  const sig = sensedSignals(lead, sc, faults);
  const info = leadInfo(lead);
  switch (kind) {
    case "displacement": {
      if (info.stable && captures(box.output, thr) && box.mode !== "OFF" && box.connected)
        return { resolved: true, partial: false, detail: "Lead back in a stable ventricular position with capture." };
      if (captures(box.output, thr))
        return { resolved: false, partial: true, detail: "Capture is being achieved at high output, but the tip is not in a stable position. Reposition it." };
      return { resolved: false, partial: false, detail: "No reliable capture." };
    }
    case "threshold-rise": {
      if (thr !== null && box.output >= 2 * thr && box.connected && box.mode !== "OFF")
        return { resolved: true, partial: false, detail: `Output ${box.output} mA restores a margin over the new threshold of ${thr} mA.` };
      if (thr !== null && box.output >= thr) return { resolved: false, partial: true, detail: "Capturing, but with less than a twofold margin." };
      return { resolved: false, partial: false, detail: "Output is below the new threshold." };
    }
    case "undersensing": {
      const a = assessSensing(box.sensitivity, sig);
      if (box.mode === "VVI" && !a.undersensing && !a.tOversensing)
        return { resolved: true, partial: false, detail: `Sensitivity ${box.sensitivity} mV now sees the ${sig.r} mV R wave without counting T waves.` };
      if (box.mode === "VOO") return { resolved: false, partial: false, detail: "Asynchronous pacing guarantees competition with the intrinsic rhythm." };
      return { resolved: false, partial: false, detail: a.undersensing ? "The R wave is still below the sensitivity setting." : "Now oversensing T waves." };
    }
    case "noise-oversensing": {
      const a = assessSensing(box.sensitivity, sig);
      if (!faults.noise && box.mode === "VVI" && a.status === "appropriate")
        return { resolved: true, partial: false, detail: "Connection fault corrected; sensing appropriate." };
      if (box.mode === "VVI" && !a.noiseOversensing && !a.undersensing)
        return { resolved: true, partial: !faults.noise ? false : true, detail: "Sensitivity now above the noise and below the R wave. The cause (connection) should still be checked." };
      if (box.mode === "VOO") return { resolved: false, partial: true, detail: "VOO keeps the patient paced while you find the cause, but is not a long-term fix." };
      return { resolved: false, partial: false, detail: "The box is still being inhibited." };
    }
  }
}

// --- Scoring -----------------------------------------------------------------------------

export interface PacingEventOutcome {
  kind: FaultKind;
  diagnosis: Diagnosis | null;
  resolved: boolean;
  partial: boolean;
}

export interface PacingRunLog {
  scenarioId: PacingScenarioId;
  /** the variant run (PACING_VARIANTS), if any */
  variant?: string | null;
  /** the units the box read at the end (formatting only: every output here is in mA) */
  units?: BoxUnits;
  /** the venous sheath against the wire, when one was chosen */
  sheath?: SheathFit | null;
  /** the in-lab course (in-lab scenarios only) */
  inLab?: InLabLog;
  tcpUsed: boolean;
  tcpMechanicalChecked: boolean;
  access: AccessRoute | null;
  finalZone: LeadZone;
  finalContact: number;
  lateralChecked: boolean;
  perforation: boolean;
  thresholdMeasured: number | null;
  trueThreshold: number | null;
  finalOutput: number;
  finalRate: number;
  finalSensitivity: number;
  finalMode: PaceMode;
  sensingMeasured: number | null;
  sensingSkippedDependent: boolean;
  rWave: number;
  tWave: number;
  onTSpikes: number;
  events: PacingEventOutcome[];
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

export function scorePacing(log: PacingRunLog): ScoreResult {
  const sc = getPacingScenario(log.scenarioId, log.variant);
  const items: ScoreItem[] = [];
  const u = log.units ?? "mA";
  const inLab = sc.inLab && log.inLab ? { c: sc.inLab, L: log.inLab } : null;
  // an in-lab block that recovered without a wire: the wire items do not apply
  const noWire = !!inLab && !inLab.L.wirePlaced && inLab.L.restoredAt !== null;

  if (inLab) {
    // Initial management (20): the actions the manuals expect here, and not waiting instead of preparing
    const { c, L } = inLab;
    // external pacing counts only once it captured (pads alone, or pacing that never captured, earn nothing)
    const taken = new Set(L.actions.map((a) => a.action).filter((a) => a !== "external-pacing" || log.tcpUsed));
    const share = 20 / Math.max(1, c.expected.length);
    let p = 0;
    const lines: string[] = [];
    for (const a of c.expected) {
      if (taken.has(a)) p += share;
      lines.push(`${INITIAL_ACTION_LABEL[a]}: ${taken.has(a) ? "done" : "not done"}. ${c.advice[a] ?? ""}`.trim());
    }
    const wait = L.actions.find((a) => a.action === "wait");
    const prepared = L.actions.some((a) => (a.action === "external-pacing" || a.action === "femoral-wire") && wait && a.t <= wait.t + IN_LAB_MODEL.waitS);
    if (wait && sc.unstable && !prepared && L.restoredAt === null) {
      p -= 5;
      lines.push(`Waited without preparing. ${c.advice.wait ?? ""}`.trim());
    }
    for (const a of L.actions) if (!c.expected.includes(a.action) && a.action !== "wait" && c.advice[a.action]) lines.push(`${INITIAL_ACTION_LABEL[a.action]}: ${c.advice[a.action]}`);
    items.push({ label: "Initial management", points: Math.max(0, Math.round(p)), max: 20, detail: lines.join(" ") });

    // Rhythm supported in time (15)
    const dt = L.supportedAt === null ? null : L.supportedAt - L.onsetT;
    items.push({
      label: "Rhythm supported in time",
      points: dt === null ? 0 : dt <= c.timeLimitS + 1e-9 ? 15 : 5,
      max: 15,
      detail:
        dt === null
          ? "The rhythm was never supported by pacing or by the patient's own conduction."
          : `Supported ${Math.round(dt)} s after the block began, against a limit of ${c.timeLimitS} s${L.restoredAt !== null && L.supportedAt !== null && L.restoredAt <= L.supportedAt ? " (conduction returned)" : ""}.`,
    });
  } else if (sc.unstable) {
    // Bridge (10)
    const p = (log.tcpUsed ? 5 : 0) + (log.tcpMechanicalChecked ? 5 : 0);
    items.push({
      label: "Transcutaneous bridge",
      points: p,
      max: 10,
      detail: log.tcpUsed
        ? log.tcpMechanicalChecked
          ? "Paced transcutaneously and confirmed mechanical capture with a pulse / arterial trace."
          : "Paced transcutaneously, but mechanical capture was not confirmed: the ECG artefact can mimic capture."
        : "The patient was compromised; transcutaneous pacing should bridge until the wire is in.",
    });
  } else {
    items.push({ label: "Transcutaneous bridge", points: 10, max: 10, detail: "Not essential here (pads on as a precaution)." });
  }

  // Access (10)
  const acc = log.access ?? sc.fixedRoute ?? null;
  const ai = acc ? accessInfoFor(sc, acc) : null;
  {
    let p = !ai ? 0 : ai.verdict === "preferred" ? 10 : ai.verdict === "acceptable" ? 8 : 2;
    let detail = ai ? `${ai.label}: ${ai.why}` : "No access chosen.";
    if (noWire && !ai) {
      p = 10;
      detail = "Conduction returned; no venous access was needed.";
    }
    if (log.sheath === "same" && acc !== "epicardial") {
      p = Math.max(0, p - 3);
      detail += " The sheath was the same size as the wire, so the wire bound and turned stiffly; Oxford uses a sheath larger than the wire (ch 9).";
    }
    items.push({ label: "Access", points: p, max: 10, detail });
  }

  if (noWire) {
    items.push({ label: "Lead position", points: 20, max: 20, detail: "Conduction returned; no wire was needed." });
    items.push({ label: "Threshold and output", points: 15, max: 15, detail: "Conduction returned; no wire was needed." });
    items.push({ label: "Sensing", points: 15, max: 15, detail: "Conduction returned; no wire was needed." });
    items.push({ label: "Pacing rate", points: 5, max: 5, detail: "Conduction returned; no wire was needed." });
  } else {
    // Position (20)
    {
      let p = 0;
      const good = log.finalZone === "rv-apex" || log.finalZone === "rv-septum" || log.finalZone === "epicardial";
      if (good) p += 10;
      if (good && log.finalContact >= 0.6 && (log.trueThreshold ?? 99) < ACCEPTABLE_THRESHOLD) p += 5;
      else if (log.finalZone === "epicardial") p += 5;
      if (log.lateralChecked || log.finalZone === "epicardial") p += 5;
      if (log.perforation) p -= 10;
      items.push({
        label: "Lead position",
        points: Math.max(0, p),
        max: 20,
        detail:
          (good ? `Final position: ${ZONE_LABEL[log.finalZone]}.` : `Final position ${ZONE_LABEL[log.finalZone]} is not a stable ventricular position.`) +
          (log.lateralChecked || log.finalZone === "epicardial" ? "" : " A lateral view was not checked (it separates the anterior RV from the posterior coronary sinus).") +
          (log.perforation ? " The lead perforated the RV wall." : ""),
      });
    }

    // Threshold and output (15)
    {
      let p = 0;
      const thr = log.trueThreshold;
      const margin = requiredMargin(sc);
      const oxford = margin >= OXFORD_OUTPUT_MARGIN - 1e-9;
      const measuredOk = log.thresholdMeasured !== null && thr !== null && Math.abs(log.thresholdMeasured - thr) <= Math.max(0.2, thr * 0.15);
      if (measuredOk) p += 7;
      else if (log.thresholdMeasured !== null) p += 3;
      let outDetail = "";
      // in-lab scenarios judge the output against the threshold the learner measured (the request's rule); the others against the true one
      const ref = inLab ? log.thresholdMeasured : thr;
      if (ref !== null && ref > 0) {
        const ratio = log.finalOutput / ref;
        const what = inLab ? "the measured threshold" : "the threshold";
        if (ratio >= margin - 1e-9) {
          p += 8;
          outDetail = `Output ${formatOutput(log.finalOutput, u)} is ${ratio.toFixed(1)} times ${what}${!oxford && ratio > OUTPUT_MARGIN.max + 0.05 ? " (more than the usual 2 to 3 times, but safe)" : ""}.`;
        } else if (ratio >= 1.5) {
          p += 3;
          outDetail = oxford
            ? `Output ${formatOutput(log.finalOutput, u)} is only ${ratio.toFixed(1)} times ${what}; Oxford sets at least three times the threshold (ch 9).`
            : `Output ${formatOutput(log.finalOutput, u)} is only ${ratio.toFixed(1)} times the threshold; set 2 to 3 times (about 2.5 times) or per local protocol.`;
        } else {
          outDetail = `Output ${formatOutput(log.finalOutput, u)} leaves an unsafe margin over a threshold of ${formatOutput(ref, u)}.`;
        }
      } else if (inLab) {
        outDetail = "Without a measured threshold the margin cannot be set.";
      }
      items.push({
        label: "Threshold and output",
        points: p,
        max: 15,
        detail: (log.thresholdMeasured !== null ? `Measured threshold ${formatOutput(log.thresholdMeasured, u)}. ` : "Threshold not measured. ") + outDetail,
      });
    }

    // Sensing (15)
    {
      let p = 0;
      const sig: SensedSignals = { r: log.rWave, t: log.tWave, tPaced: log.tWave * (0.22 / 0.18), p: 0, noise: 0 };
      const a = assessSensing(log.finalSensitivity, sig);
      if (!a.undersensing) p += 5;
      if (!a.tOversensing) p += 5;
      if (a.margin && !a.tOversensing) p += 3;
      if (log.sensingMeasured !== null || log.sensingSkippedDependent) p += 2;
      if (log.finalMode !== "VVI") p = Math.min(p, 5);
      const asyncIntrinsic = !!inLab?.L.asyncWithIntrinsic;
      if (asyncIntrinsic) p = Math.min(p, 5);
      items.push({
        label: "Sensing",
        points: p,
        max: 15,
        detail:
          `Sensitivity ${log.finalSensitivity} mV against an R wave of ${log.rWave} mV. ` +
          (a.undersensing ? "The box will undersense. " : a.tOversensing ? "The box will oversense T waves. " : a.margin ? "Good twofold margin. " : "Senses, but with less than a twofold margin. ") +
          (log.finalMode !== "VVI" ? "Left in an asynchronous or off mode. " : "") +
          (asyncIntrinsic ? "The box paced asynchronously while the patient had a rhythm of their own (Oxford ch 9: asynchronous pacing risks ventricular arrhythmias). " : ""),
      });
    }

    // Rate (5)
    items.push({
      label: "Pacing rate",
      points: log.finalRate >= 50 && log.finalRate <= 90 ? 5 : 2,
      max: 5,
      detail: `Rate ${log.finalRate} ppm.`,
    });
  }

  // Troubleshooting (25): the scenarios with scripted events after hand-over
  if (!inLab) {
    const n = Math.max(1, log.events.length);
    let p = 0;
    const lines: string[] = [];
    for (const e of log.events) {
      const info = FAULT_INFO[e.kind];
      const dx = e.diagnosis === info.diagnosis;
      const share = 25 / n;
      p += (dx ? share * 0.4 : 0) + (e.resolved ? (e.partial ? share * 0.4 : share * 0.6) : 0);
      lines.push(`${info.title}: ${dx ? "correctly identified" : "misidentified"}, ${e.resolved ? (e.partial ? "partly fixed" : "fixed") : "not fixed"}.`);
    }
    if (log.onTSpikes > 0) lines.push(`${log.onTSpikes} spike(s) fell on T waves during the run.`);
    items.push({ label: "Troubleshooting", points: Math.round(p), max: 25, detail: lines.join(" ") || "No events reached." });
  } else if (log.onTSpikes > 0) {
    const s = items.find((i) => i.label === "Sensing");
    if (s) s.detail += `${log.onTSpikes} spike(s) fell on T waves during the run.`;
  }

  const total = items.reduce((a, b) => a + b.points, 0);
  const max = items.reduce((a, b) => a + b.max, 0);
  return { score: clamp(Math.round((100 * total) / Math.max(1, max)), 0, 100), items };
}

// --- utils ---------------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
