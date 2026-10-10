// ---------------------------------------------------------------------------
// The shared hypotension-cause model (proc-hypotension-pressors).
//
// One registry of the causes of a low pressure in the lab, each with:
//   - its mechanism, in Brilakis's three classes of true hypotension (28.1:
//     hypovolaemia, cardiac failure, peripheral vasodilation), or a false
//     reading from the pressure line;
//   - its signature: the right heart pattern of the mechanism (Brilakis Fig.
//     28.1 as the pressors lesson describes it: hypovolaemia low filling and
//     low output; cardiac failure high filling and low output, with low
//     left-sided filling when the right ventricle fails; vasodilation low
//     filling and high output), the heart rate and whether a cuff pressure
//     agrees with the line;
//   - the treatment of the cause and how a bridging drug fits it (the
//     pressors lesson's tables: phenylephrine in obstructive hypertrophic
//     cardiomyopathy, noradrenaline in cardiogenic shock, fluid and control of
//     the bleeding site for bleeding, no pressor for a damped or misplaced
//     line);
//   - a script that starts it on a patient engine, through public engine
//     methods only (setHaemorrhage, fluid, setOcclusion, setPericardialInflow,
//     forceRhythm, setVasodilation, giveDrug, the transducer), and a run that
//     ticks it and takes treatments.
//
// Labs add their own causes with registerHypotensionCause (the PCI lab's
// guide holding the aortic valve open, src/simulation/pci/hypotension.ts; the
// diagnostic rhythm package's), so the debrief, the right heart read-out and
// the drug rules have one source. The full case drives the causes through
// src/simulation/session/hypotension.ts and the session module
// src/simulation/session/modules/hypotension.ts.
//
// Sources (module text, src/content/manual/**):
//   pm-lab-drugs-pressors (pci-manual/04-lab-drugs.ts:615-720): the three
//     mechanisms with their lab examples and first treatments, the right heart
//     pattern of each, the drug table (Brilakis 3.6) and the pitfalls
//     (treating a damped trace with a pressor; a pressor hiding bleeding or
//     tamponade; an inotrope in obstructive HCM; dopamine over noradrenaline
//     in cardiogenic shock).
//   pm-monitoring-pressure (tip pci-mon-false-hypotension, Brilakis 28.1 and
//     2.3): the line checks before a low pressure is called real.
//   hb-cardiac-catheterisation (cath-handbook/04-cardiac-catheterisation.ts:
//     2360): Oxford's typical cardiac index, 2.5-3.5 L/min/m2.
//   cm-flow-embolism-oedema-cholesterol (complication-management/
//     02-flow-embolism.ts:725-732): LVEDP normal 3-12 mmHg and above 30 mmHg
//     pulmonary oedema likely (Oxford ch 4); a wedge above 18 mmHg suggests LV
//     failure (Brilakis 14.1).
// Every other number below is a MODEL PARAMETER (MP_CAUSES, RHC_REFERENCE's
// RA bounds and each cause's script settings): settings of the simulator that
// give the right direction and pace, not clinical values.
//
// Engine-light: imports types only from the engine, so the order sections and
// the scenarios can import it without the engine.
// ---------------------------------------------------------------------------

import type { DrugId, InfusionDrug, Route } from "./pharmacology";
import type { GiveResult, RightHeartNumbers, Vitals } from "./engine";
import type { ReactionKind } from "./responses";
import { bsaMosteller } from "../calc";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** Brilakis's three mechanisms of true hypotension (28.1), and a false reading from the line. */
export type HypotensionMechanism = "hypovolaemia" | "cardiac" | "vasodilation" | "false-reading";
export const HYPOTENSION_MECHANISMS: readonly HypotensionMechanism[] = ["hypovolaemia", "cardiac", "vasodilation", "false-reading"];

/** The pressors lesson's pearl: 'say the mechanism out loud: empty, failing or dilated' (04-lab-drugs.ts:712). */
export const MECHANISM_WORDS: Readonly<Record<HypotensionMechanism, string>> = {
  hypovolaemia: "Empty (hypovolaemia)",
  cardiac: "Failing (cardiac failure)",
  vasodilation: "Dilated (vasodilation)",
  "false-reading": "Not real (the line)",
};

export type Level = "low" | "normal" | "high";

/** A cause's haemodynamic signature: what a right heart catheter, the monitor and a cuff show. */
export interface CauseSignature {
  /** left-sided filling (wedge, LVEDP) */
  filling: Level;
  /** cardiac output (index) */
  output: Level;
  /** right atrial pressure */
  ra: Level;
  /** heart rate */
  rate: "slow" | "normal" | "fast";
  /** a cuff pressure agrees with the low line pressure ('low'), or is normal (a false reading) */
  cuff: "low" | "normal";
}

/** Drugs a bridge rule names: the vasoactive infusions and bolus pressors, by formulary id. */
export type BridgeDrug = Extract<DrugId, "phenylephrine" | "noradrenaline" | "vasopressin" | "dopamine" | "adrenaline" | "dobutamine" | "isoprenaline" | "metaraminol">;

/** Inotropes: drugs with an inotropic action (the pressors lesson's table). */
export const INOTROPES: readonly BridgeDrug[] = ["dobutamine", "dopamine", "adrenaline", "isoprenaline"];
/** Pure vasopressors (the same table). */
export const PURE_PRESSORS: readonly BridgeDrug[] = ["phenylephrine", "vasopressin", "metaraminol"];

export type BridgeVerdict = "right" | "acceptable" | "wrong";

/** How a vasoactive drug fits a cause, with the reason the debrief gives. */
export interface BridgeRule {
  right: readonly BridgeDrug[];
  acceptable: readonly BridgeDrug[];
  /** what the debrief says for any drug not listed (wrong); per-drug reasons override it */
  otherwise: string;
  why?: Partial<Record<BridgeDrug, string>>;
  /** the drug a debrief names as the bridge */
  expected: string;
  /** a pressor before the cause's first treatment is wrong (bleeding, fasting, tamponade, a slow rhythm, a false reading) */
  causeFirst?: boolean;
}

/** A treatment of the cause a lab can apply (the session's orders map onto these). */
export type CauseTreatment = "fluid" | "blood" | "control-bleeding" | "drain-pericardium" | "pace" | "atropine" | "level-transducer" | "zero-transducer" | "flush-line" | "stop-drug" | "revascularise" | "support";

// ---------------------------------------------------------------------------
// The engine port
// ---------------------------------------------------------------------------

/**
 * The patient engine's methods the causes use (PatientEngine has every one; a test double may leave
 * some out, and a script then skips that effect).
 */
export interface HypotensionEnginePort {
  readonly profile?: { lvef: number; weightKg: number; heightCm: number; lvot?: { obstructive: boolean } };
  setHaemorrhage?(mlPerS: number): void;
  fluid?(ml: number, overS?: number): void;
  setOcclusion?(id: string, o: { vessel: string; param: number; fraction: number }): void;
  clearOcclusion?(id: string): void;
  setPericardialInflow?(mlPerS: number): void;
  drainPericardium?(ml: number): number;
  forceRhythm?(kind: "vf" | "vt" | "asystole" | "aivr" | "sinus" | "chb", reason?: string): void;
  setVasodilation?(fraction: number): void;
  giveDrug?(drug: DrugId, dose: number, route: Route): GiveResult;
  startInfusion?(o: { drug: InfusionDrug; rate: number; site?: "central" | "peripheral" }): void;
  stopInfusion?(drug: InfusionDrug): void;
  forceVagal?(level?: number, holdS?: number): void;
  forceReaction?(kind: Exclude<ReactionKind, "none">, onsetS: number, opts?: { preArrest?: boolean }): void;
  readonly transducer?: { setHeight?(cm: number): void; setAir?(ml: number): void };
  readonly pharm?: { setContext?(ctx: { hocm?: boolean }): void };
  vitals?(): Vitals;
  rightHeart?(): RightHeartNumbers;
}

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the cause scripts (simulator settings, not clinical values). */
export const MP_CAUSES = {
  /** bleeding: rate into a hidden space (mL/s), and the volume at which it slows to `slowMlS` by itself (mL) */
  bleedMlS: 1.0,
  bleedSlowAfterMl: 420,
  bleedSlowMlS: 0.02,
  /** control of the bleeding site takes this long to stop it (s) */
  controlS: 120,
  /** fasting: the circulating volume missing on arrival, taken out at `fastingMlS` (mL, mL/s) */
  fastingDeficitMl: 520,
  fastingMlS: 2,
  /**
   * ischaemia: the occlusions (vessel, position 0..1, fraction) and the central volume shift that
   * stands for the stiff ischaemic ventricle's rise in filling pressure (the engine's ischaemia lowers
   * contractility only), mL over s
   */
  ischaemiaOcclusions: [
    { vessel: "LAD", param: 0.05, fraction: 1 },
    { vessel: "LCx", param: 0.05, fraction: 1 },
    { vessel: "RCA", param: 0.1, fraction: 0.5 },
  ],
  ischaemiaCongestionMl: 250,
  ischaemiaCongestionOverS: 120,
  /** tamponade: blood into the pericardium (mL/s), stopping by itself at this volume (mL) */
  tamponadeMlS: 0.5,
  tamponadeCapMl: 155,
  /** a drain takes this long (s) and removes up to this volume (mL) */
  drainS: 300,
  drainMl: 500,
  /** a temporary pacing wire is placed and captures after this long (s) */
  paceS: 240,
  /** vasodilation by cause (0..1 of vascular tone lost) and its half-life as the drug wears off (s) */
  vasodilation: { "gtn-pde5": 0.68, verapamil: 0.6, "hcm-vasodilator": 0.45 } as Record<string, number>,
  vasodilationHalfLifeS: 1500,
  /** false reading: the transducer this far above the phlebostatic axis (cm), and air in the line (mL) */
  transducerHighCm: 35,
  lineAirMl: 0,
} as const;

/**
 * The right heart reference the read-out is classified against. Sourced: the wedge above 18 mmHg
 * (Brilakis 14.1), the LVEDP normal range 3-12 mmHg (Oxford ch 4) and Oxford's typical cardiac index
 * 2.5-3.5 L/min/m2 (see the header). The RA bounds are MODEL PARAMETERS: this engine's resting right
 * atrial pressure runs at 1-3 mmHg, so 'low' and 'high' are set about it.
 */
export const RHC_REFERENCE = {
  wedgeHighMmHg: 18,
  fillingNormalMmHg: [3, 12] as const,
  ciTypical: [2.5, 3.5] as const,
  raLowMmHg: 1.2,
  raHighMmHg: 6,
  /** a heart rate below this is 'slow', above this 'fast', and above `tachyHr` a tachyarrhythmia (bpm; MODEL PARAMETERS) */
  slowHr: 50,
  fastHr: 100,
  tachyHr: 150,
} as const;

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export interface RightHeartPattern {
  ra: Level;
  filling: Level;
  output: Level;
  ci: number;
  /** the mechanism the pattern points to (Brilakis Fig. 28.1, with the rate for a brady- or tachyarrhythmia) */
  mechanism: Exclude<HypotensionMechanism, "false-reading">;
}

/** Cardiac index, L/min/m2 (Mosteller body surface area, src/simulation/calc.ts). */
export function cardiacIndex(coLMin: number, heightCm: number, weightKg: number): number {
  return coLMin / Math.max(0.5, bsaMosteller(heightCm, weightKg));
}

/** Classify a right heart read-out (pure). `hr` adds the rhythm: a slow or very fast rate is a cardiac cause. */
export function classifyRightHeart(rh: Pick<RightHeartNumbers, "raMmHg" | "pcwpMmHg" | "coLMin">, body: { heightCm: number; weightKg: number }, hr: number | null = null): RightHeartPattern {
  const R = RHC_REFERENCE;
  const ci = cardiacIndex(rh.coLMin, body.heightCm, body.weightKg);
  const output: Level = ci < R.ciTypical[0] ? "low" : ci > R.ciTypical[1] ? "high" : "normal";
  const filling: Level = rh.pcwpMmHg > R.wedgeHighMmHg ? "high" : rh.pcwpMmHg < R.fillingNormalMmHg[0] ? "low" : "normal";
  const ra: Level = rh.raMmHg < R.raLowMmHg ? "low" : rh.raMmHg > R.raHighMmHg ? "high" : "normal";
  let mechanism: RightHeartPattern["mechanism"];
  if (output === "high") mechanism = "vasodilation";
  else if (hr !== null && (hr < R.slowHr || hr > R.tachyHr)) mechanism = "cardiac";
  else if (filling === "high" || ra === "high") mechanism = "cardiac";
  else if (output === "low") mechanism = "hypovolaemia";
  // a normal output with a low pressure: empty if the filling is low, else a low resistance
  else mechanism = filling === "low" || ra === "low" ? "hypovolaemia" : "vasodilation";
  return { ra, filling, output, ci, mechanism };
}

// ---------------------------------------------------------------------------
// Causes
// ---------------------------------------------------------------------------

/** A cause running on a patient: what a lab ticks and treats. */
export interface CauseRun {
  readonly causeId: string;
  /** advance the script (s of patient time) */
  tick(port: HypotensionEnginePort, dtS: number): void;
  /** apply a treatment of the cause; returns whether this cause answers to it (the effect may take time) */
  treat(port: HypotensionEnginePort, t: CauseTreatment): boolean;
  /** the cause itself has stopped (the effect on the pressure may outlast it) */
  stopped(): boolean;
}

export interface HypotensionCause {
  id: string;
  mechanism: HypotensionMechanism;
  /** debrief label, sentence case */
  label: string;
  signature: CauseSignature;
  /** the treatment of the cause, as the debrief states it */
  treatment: string;
  /** the treatments that address the cause (the first of them counts as treating it) */
  treatments: readonly CauseTreatment[];
  bridge: BridgeRule;
  lessonId: string;
  /** where its rules come from */
  source: string;
  /** start it on the engine now; null when the engine lacks what the script needs */
  start(port: HypotensionEnginePort): CauseRun | null;
}

/** How a vasoactive drug fits a cause (pure). */
export function bridgeVerdict(cause: Pick<HypotensionCause, "bridge">, drug: BridgeDrug): { verdict: BridgeVerdict; why: string } {
  const b = cause.bridge;
  if (b.right.includes(drug)) return { verdict: "right", why: b.why?.[drug] ?? b.expected };
  if (b.acceptable.includes(drug)) return { verdict: "acceptable", why: b.why?.[drug] ?? b.expected };
  return { verdict: "wrong", why: b.why?.[drug] ?? b.otherwise };
}

// script helpers --------------------------------------------------------------

/** A run whose cause stops on any of `stops`, with an optional tick. */
function run(causeId: string, o: { tick?: (port: HypotensionEnginePort, dtS: number, r: { stopped: boolean }) => void; stops?: readonly CauseTreatment[]; onStop?: (port: HypotensionEnginePort, t: CauseTreatment) => void } = {}): CauseRun {
  const st = { stopped: false };
  return {
    causeId,
    tick: (port, dtS) => o.tick?.(port, dtS, st),
    treat: (port, t) => {
      if (!o.stops?.includes(t)) return false;
      if (!st.stopped) {
        st.stopped = true;
        o.onStop?.(port, t);
      }
      return true;
    },
    stopped: () => st.stopped,
  };
}

/** Vasodilation that wears off with the drug (MP_CAUSES.vasodilationHalfLifeS). */
function vasodilationRun(causeId: string, level: number, port: HypotensionEnginePort): CauseRun {
  let f = level;
  port.setVasodilation?.(f);
  return run(causeId, {
    tick: (p, dtS, r) => {
      if (r.stopped) return;
      f *= Math.pow(0.5, dtS / MP_CAUSES.vasodilationHalfLifeS);
      if (f < 0.02) {
        f = 0;
        r.stopped = true;
      }
      p.setVasodilation?.(f);
    },
  });
}

const PRESSORS = "pm-lab-drugs-pressors";
const BRILAKIS_28 = "Brilakis 28.1 and 3.6 (pm-lab-drugs-pressors, pci-manual/04-lab-drugs.ts:621-660)";

const NO_PRESSOR_FIRST = "A vasopressor before the cause was treated hides it (the lesson's pitfalls)";

/** The causes every lab shares (labs register more). */
export const CORE_CAUSES: readonly HypotensionCause[] = [
  {
    id: "bleeding",
    mechanism: "hypovolaemia",
    label: "Bleeding (hypovolaemia)",
    signature: { filling: "low", output: "low", ra: "low", rate: "fast", cuff: "low" },
    treatment: "Saline and blood, and control of the bleeding site",
    treatments: ["control-bleeding", "blood", "fluid"],
    bridge: {
      right: [],
      acceptable: ["noradrenaline", "phenylephrine", "metaraminol"],
      otherwise: "Volume and control of the bleeding, with a vasopressor only as a bridge",
      why: { dobutamine: "An inotrope does not fill an empty circulation", dopamine: "An inotrope does not fill an empty circulation" },
      expected: "Fluid, blood and control of the bleeding site; a vasopressor only as a bridge",
      causeFirst: true,
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.setHaemorrhage) return null;
      let lost = 0;
      port.setHaemorrhage(MP_CAUSES.bleedMlS);
      return run("bleeding", {
        tick: (p, dtS, r) => {
          if (r.stopped) return;
          lost += MP_CAUSES.bleedMlS * dtS;
          // a bleed into a closed space slows as it fills (it never stops by itself)
          if (lost >= MP_CAUSES.bleedSlowAfterMl) p.setHaemorrhage?.(MP_CAUSES.bleedSlowMlS);
        },
        stops: ["control-bleeding"],
        onStop: (p) => p.setHaemorrhage?.(0),
      });
    },
  },
  {
    id: "fasting",
    mechanism: "hypovolaemia",
    label: "Poor hydration after fasting (hypovolaemia)",
    signature: { filling: "low", output: "low", ra: "low", rate: "fast", cuff: "low" },
    treatment: "Saline (Oxford: a slow IV infusion is often all a fasted, dehydrated patient needs)",
    treatments: ["fluid"],
    bridge: {
      right: [],
      acceptable: ["phenylephrine", "metaraminol", "noradrenaline"],
      otherwise: "Fluid treats it; a vasopressor only as a bridge",
      expected: "Saline first; a vasopressor only as a bridge",
      causeFirst: true,
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.fluid) return null;
      // the deficit taken out of the circulation a little at a time (the engine's fluid() with a
      // negative volume removes it within one step, so each tick takes only its share)
      let left = MP_CAUSES.fastingDeficitMl;
      return run("fasting", {
        tick: (p, dtS) => {
          if (left <= 0) return;
          const ml = Math.min(left, MP_CAUSES.fastingMlS * dtS);
          left -= ml;
          p.fluid?.(-ml, 1);
        },
        stops: ["fluid"],
      });
    },
  },
  {
    id: "ischaemia",
    mechanism: "cardiac",
    label: "Ischaemic left ventricular failure (cardiac)",
    signature: { filling: "high", output: "low", ra: "normal", rate: "fast", cuff: "low" },
    treatment: "Revascularise; noradrenaline as the bridge, with mechanical support when doses rise",
    treatments: ["revascularise", "support"],
    bridge: {
      right: ["noradrenaline"],
      acceptable: ["dobutamine"],
      otherwise: "Noradrenaline is the preferred vasopressor in cardiogenic shock",
      why: {
        dopamine: "Dopamine caused more arrhythmias than noradrenaline (SOAP II) and is not preferred in cardiogenic shock",
        phenylephrine: "A pure alpha agonist adds afterload without inotropy (Brilakis 24.2)",
        vasopressin: "A pure vasopressor adds afterload without inotropy (Brilakis 24.2)",
        metaraminol: "A pure vasopressor adds afterload without inotropy (Brilakis 24.2)",
        adrenaline: "The 2021 ESC heart failure guideline prefers noradrenaline after a trial of adrenaline in shock after MI stopped early",
        dobutamine: "An inotrope for low output once the pressure is held",
      },
      expected: "Noradrenaline, the lowest effective dose; mechanical support rather than escalating doses",
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.setOcclusion) return null;
      MP_CAUSES.ischaemiaOcclusions.forEach((o, i) => port.setOcclusion!(`hypotension-ischaemia-${i}`, o));
      port.fluid?.(MP_CAUSES.ischaemiaCongestionMl, MP_CAUSES.ischaemiaCongestionOverS);
      return run("ischaemia", {
        stops: ["revascularise"],
        onStop: (p) => MP_CAUSES.ischaemiaOcclusions.forEach((_, i) => p.clearOcclusion?.(`hypotension-ischaemia-${i}`)),
      });
    },
  },
  {
    id: "tamponade",
    mechanism: "cardiac",
    label: "Tamponade (cardiac)",
    signature: { filling: "normal", output: "low", ra: "high", rate: "fast", cuff: "low" },
    treatment: "Drain the pericardium",
    treatments: ["drain-pericardium"],
    bridge: {
      right: [],
      acceptable: ["noradrenaline", "adrenaline", "phenylephrine", "metaraminol", "dobutamine"],
      otherwise: "Drainage treats it; drugs only bridge",
      expected: "Pericardial drainage; drugs only as a bridge to it",
      causeFirst: true,
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.setPericardialInflow) return null;
      let ml = 0;
      port.setPericardialInflow(MP_CAUSES.tamponadeMlS);
      return run("tamponade", {
        tick: (p, dtS, r) => {
          if (r.stopped) return;
          ml += MP_CAUSES.tamponadeMlS * dtS;
          if (ml >= MP_CAUSES.tamponadeCapMl) p.setPericardialInflow?.(0);
        },
        stops: ["drain-pericardium"],
        onStop: (p) => {
          p.setPericardialInflow?.(0);
          p.drainPericardium?.(MP_CAUSES.drainMl);
        },
      });
    },
  },
  {
    id: "arrhythmia",
    mechanism: "cardiac",
    label: "Complete heart block (cardiac: a bradyarrhythmia)",
    signature: { filling: "normal", output: "low", ra: "normal", rate: "slow", cuff: "low" },
    treatment: "Correct the rhythm: atropine, then temporary pacing",
    treatments: ["pace", "atropine"],
    bridge: {
      right: [],
      acceptable: ["isoprenaline", "adrenaline", "dopamine"],
      otherwise: "The rate is the problem: correct the rhythm",
      why: { isoprenaline: "Isoprenaline rarely improves conduction but can speed the sinus node (Oxford, 04-lab-drugs.ts:886); pacing treats complete block" },
      expected: "Atropine, a chronotrope and temporary pacing; not a vasopressor",
      causeFirst: true,
    },
    lessonId: PRESSORS,
    source: `${BRILAKIS_28}; isoprenaline and atropine for heart block (04-lab-drugs.ts:886)`,
    start(port) {
      if (!port.forceRhythm) return null;
      port.forceRhythm("chb", "hypotension scenario");
      return run("arrhythmia", { stops: ["pace"], onStop: (p) => p.forceRhythm?.("sinus", "paced") });
    },
  },
  {
    id: "gtn-pde5",
    mechanism: "vasodilation",
    label: "Nitrate after a PDE-5 inhibitor (vasodilation)",
    signature: { filling: "low", output: "high", ra: "normal", rate: "fast", cuff: "low" },
    treatment: "Stop the nitrate; fluid; a vasopressor for severe or persistent hypotension",
    treatments: ["fluid", "stop-drug"],
    bridge: {
      right: ["noradrenaline", "phenylephrine", "metaraminol"],
      acceptable: ["vasopressin"],
      otherwise: "A vasopressor (noradrenaline or phenylephrine) for drug-induced vasodilation (Brilakis 3.2, 6.3)",
      why: { dobutamine: "Dobutamine dilates further and does not restore the tone" },
      expected: "Fluid and a vasopressor (noradrenaline or phenylephrine)",
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.setVasodilation) return null;
      return vasodilationRun("gtn-pde5", MP_CAUSES.vasodilation["gtn-pde5"], port);
    },
  },
  {
    id: "verapamil",
    mechanism: "vasodilation",
    label: "Verapamil (vasodilation)",
    signature: { filling: "low", output: "high", ra: "normal", rate: "normal", cuff: "low" },
    treatment: "No further verapamil; fluid; a vasopressor for severe or persistent hypotension",
    treatments: ["fluid", "stop-drug"],
    bridge: {
      right: ["noradrenaline", "phenylephrine", "metaraminol"],
      acceptable: ["vasopressin"],
      otherwise: "A vasopressor (noradrenaline or phenylephrine) for drug-induced vasodilation (Brilakis 3.2, 6.3)",
      expected: "Fluid and a vasopressor (noradrenaline or phenylephrine)",
    },
    lessonId: PRESSORS,
    source: BRILAKIS_28,
    start(port) {
      if (!port.setVasodilation) return null;
      return vasodilationRun("verapamil", MP_CAUSES.vasodilation.verapamil, port);
    },
  },
  {
    id: "hcm-vasodilator",
    mechanism: "vasodilation",
    label: "Vasodilation in obstructive hypertrophic cardiomyopathy",
    signature: { filling: "normal", output: "high", ra: "normal", rate: "fast", cuff: "low" },
    treatment: "Fluid and a pure vasopressor; no inotrope and no further vasodilator",
    treatments: ["fluid", "stop-drug"],
    bridge: {
      right: ["phenylephrine"],
      acceptable: ["vasopressin", "metaraminol"],
      otherwise: "An inotrope worsens the outflow obstruction",
      why: {
        noradrenaline: "Noradrenaline adds some inotropy; phenylephrine, a pure vasopressor, is the drug for obstructive HCM",
        dobutamine: "An inotrope worsens the intracavitary obstruction",
        dopamine: "Dopamine adds inotropy, which worsens the obstruction",
        adrenaline: "Adrenaline adds inotropy, which worsens the obstruction",
      },
      expected: "Phenylephrine (a pure vasopressor) and fluid",
    },
    lessonId: PRESSORS,
    source: `${BRILAKIS_28}; the lesson's HCM check (04-lab-drugs.ts:664-675)`,
    start(port) {
      if (!port.setVasodilation) return null;
      return vasodilationRun("hcm-vasodilator", MP_CAUSES.vasodilation["hcm-vasodilator"], port);
    },
  },
  {
    id: "vagal",
    mechanism: "vasodilation",
    label: "Vasovagal reaction (vasodilation and slowing)",
    signature: { filling: "low", output: "low", ra: "low", rate: "slow", cuff: "low" },
    treatment: "Legs up, atropine and fast saline (cm-patient-complications-vasovagal)",
    treatments: ["atropine", "fluid"],
    bridge: { right: [], acceptable: [], otherwise: "Atropine and fluid treat it", expected: "Atropine and fluid; no pressor", causeFirst: true },
    lessonId: "cm-patient-complications-vasovagal",
    source: "cm-patient-complications-vasovagal (complication-management/05-patient-complications.ts)",
    start(port) {
      if (!port.forceVagal) return null;
      port.forceVagal();
      return run("vagal", { stops: ["atropine"] });
    },
  },
  {
    id: "reaction",
    mechanism: "vasodilation",
    label: "Contrast anaphylaxis (vasodilation and capillary leak)",
    signature: { filling: "low", output: "high", ra: "low", rate: "fast", cuff: "low" },
    treatment: "IM adrenaline and fluid (pm-lab-drugs-contrast-reactions)",
    treatments: ["fluid"],
    bridge: { right: ["adrenaline"], acceptable: [], otherwise: "Adrenaline treats anaphylaxis", expected: "Adrenaline with fluid", causeFirst: false },
    lessonId: "pm-lab-drugs-contrast-reactions",
    source: "pm-lab-drugs-contrast-reactions (pci-manual/04-lab-drugs.ts)",
    start(port) {
      if (!port.forceReaction) return null;
      port.forceReaction("severe", 0);
      return run("reaction");
    },
  },
  {
    id: "transducer-high",
    mechanism: "false-reading",
    label: "A transducer above the heart (a false low reading)",
    signature: { filling: "normal", output: "normal", ra: "normal", rate: "normal", cuff: "normal" },
    treatment: "Level the transducer at the mid-chest and zero it; check against a cuff",
    // zeroing does not remove a hydrostatic offset: only levelling treats it (zeroing is a check)
    treatments: ["level-transducer"],
    bridge: { right: [], acceptable: [], otherwise: "Treating a false reading with a vasopressor", expected: "No drug: level the transducer and check the cuff", causeFirst: true },
    lessonId: "pm-monitoring-pressure",
    source: "pm-monitoring-pressure (tip pci-mon-false-hypotension, Brilakis 28.1 and 2.3)",
    start(port) {
      if (!port.transducer?.setHeight) return null;
      port.transducer.setHeight(MP_CAUSES.transducerHighCm);
      return run("transducer-high", { stops: ["level-transducer"] });
    },
  },
  {
    id: "damped-line",
    mechanism: "false-reading",
    label: "Air in the line (a damped, falsely low reading)",
    signature: { filling: "normal", output: "normal", ra: "normal", rate: "normal", cuff: "normal" },
    treatment: "Flush the line free of air; check against a cuff",
    treatments: ["flush-line"],
    bridge: { right: [], acceptable: [], otherwise: "Treating a damped trace with a vasopressor", expected: "No drug: flush the line and check the cuff", causeFirst: true },
    lessonId: "pm-monitoring-pressure",
    source: "pm-monitoring-pressure (tip pci-mon-false-hypotension, Brilakis 28.1 and 2.3)",
    start(port) {
      if (!port.transducer?.setAir) return null;
      port.transducer.setAir(0.05);
      return run("damped-line", { stops: ["flush-line"] });
    },
  },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const REGISTRY = new Map<string, HypotensionCause>(CORE_CAUSES.map((c) => [c.id, c]));

const CORE_IDS = new Set(CORE_CAUSES.map((c) => c.id));

/**
 * Add a lab's own cause (the PCI lab's, the diagnostic rhythm package's). The same id from the same
 * source replaces the earlier entry (a module reloaded by the dev server, or imported twice in a test
 * worker); a core cause's id, or an id another source registered, throws.
 */
export function registerHypotensionCause(c: HypotensionCause): void {
  if (!c || typeof c.id !== "string" || !c.id) throw new Error("a hypotension cause has no id");
  const prev = REGISTRY.get(c.id);
  if (prev && (CORE_IDS.has(c.id) || prev.source !== c.source)) throw new Error(`hypotension cause '${c.id}' is already registered`);
  if (!HYPOTENSION_MECHANISMS.includes(c.mechanism)) throw new Error(`hypotension cause '${c.id}' has an unknown mechanism '${String(c.mechanism)}'`);
  REGISTRY.set(c.id, c);
}

export function hypotensionCause(id: string | null | undefined): HypotensionCause | undefined {
  return id ? REGISTRY.get(id) : undefined;
}

/** Every registered cause, core first, then in registration order. */
export function hypotensionCauses(): HypotensionCause[] {
  return [...REGISTRY.values()];
}

/** Start a registered cause on an engine. */
export function startHypotensionCause(id: string, port: HypotensionEnginePort): CauseRun | null {
  const c = REGISTRY.get(id);
  return c ? c.start(port) : null;
}

/**
 * Give an engine's patient obstructive hypertrophic cardiomyopathy after it was built (the scenario
 * profile overrides have no LVOT field yet): the profile's flag, which the engine's LVOT model reads
 * every step, and the formulary's interaction context. At rest the obstruction factor is 1, so the
 * pressure is unchanged until inotropy, rate, preload or afterload move it.
 */
export function makeObstructiveHcm(port: HypotensionEnginePort): boolean {
  const p = port.profile as { lvot?: { obstructive: boolean } } | undefined;
  if (!p) return false;
  p.lvot = { obstructive: true };
  port.pharm?.setContext?.({ hocm: true });
  return true;
}
