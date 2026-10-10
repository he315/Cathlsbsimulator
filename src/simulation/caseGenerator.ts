import type {
  AnatomyCase,
  AnatomyVariant,
  Dominance,
  AccessRoute,
  RootSize,
  PathologyKind,
  Lesion,
  LesionMorphology,
  CollateralChannel,
  ScadType,
  VesselId,
  MistakeCode,
  MistakeRecord,
} from "../types";
import { Rng, uid } from "../utils/random";
import { diagScenarioById, type DiagScenario } from "./diagnosticScenarios";

/**
 * Anatomy anomalies a random case can carry (diag-anatomy-variants), drawn on their own seeded stream with the prior
 * below, so a case without one is the case it always was. Only a spec that asks for it (CaseSpec.anomalyPrior: the
 * free lab's and the anatomy lab's random cases, generateRandomCase, and the 'rand' and 'daily' presets) draws one. The prior is the 1-2% of unselected angiograms in which
 * Oxford finds variant or anomalous anatomy (pm-interpreting-anomalies, pm-engaging-fail), taken at its midpoint; the
 * equal split among the anomalies is a MODEL PARAMETER (Oxford gives 0.2-0.7% for the circumflex from the right side
 * alone). The separate LAD and circumflex ostia and the anterior RCA, which Oxford counts as normal variants, are in
 * VARIANT_POOL already.
 */
export const ANOMALY_PRIOR = 0.015;
export const ANOMALY_VARIANTS: readonly AnatomyVariant[] = [
  "anomalous-lcx-right-sinus",
  "anomalous-lcx-from-rca",
  "anomalous-rca-left-sinus",
  "anomalous-lm-right-sinus",
  "high-ostia",
  "fistula-lad-pa",
];

interface CoreParams {
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  access: AccessRoute;
  rootSize: RootSize;
  rootRotationDeg: number;
  aortaTiltDeg: number;
  dominance: Dominance;
  variants: AnatomyVariant[];
  pathology: PathologyKind;
  focus: "left" | "right" | "both";
  objectives: string[];
  /** lesion morphologies to draw on the pathology's lesions (CaseSpec.morphology); absent: the plain lesions */
  morphology?: LesionMorphology[];
  /** give the non-occlusive lesions an eccentric lumen (CaseSpec.eccentric) */
  eccentric?: boolean;
}

// Catheters for the anatomy variants of diag-anatomy-variants, from the manuals as pm-interpreting-anomalies and
// pm-engaging-left/-rca/-fail quote them: there is no fixed rule; from the right sinus a JR4 may work but an Amplatz
// shape (AL or AR) is often needed, from the left sinus a JL (sometimes of an unusual size) or an AL (Oxford ch 6;
// Brilakis 5.7); a dilating root brings the RCA forward and AR1-2 or AL1-2 help (Brilakis); a dilated root takes a
// larger JL (Brilakis: the aortic diameter in cm plus one). The usual first catheter stays first: the lab opens the
// case with recommendedCatheters[0], and these cases teach finding the ostium before changing shape.
function recommendedLeft(rootSize: RootSize, variants: AnatomyVariant[], access: AccessRoute): string[] {
  const radial = access !== "femoral";
  if (variants.includes("anomalous-lm-right-sinus")) return [radial ? "TIG" : "JL4", "AL1", "AR"];
  // the dilated root's first catheter stays first; the largest JL on the cart and an Amplatz follow
  if (variants.includes("very-dilated-root")) return ["JL4.5", "JL5", "AL2"];
  if (variants.includes("high-ostia")) return [radial ? "TIG" : "JL4", "AL1"];
  if (variants.includes("horizontal-aorta")) return ["AL1", "JL4"];
  if (rootSize === "small") return radial ? ["JL3.5", "TIG"] : ["JL3.5"];
  if (rootSize === "dilated") return ["JL4.5", "JL5"];
  return radial ? ["JL4", "TIG"] : ["JL4"];
}

function recommendedRight(variants: AnatomyVariant[], access: AccessRoute): string[] {
  const radial = access !== "femoral";
  if (variants.includes("anomalous-rca-left-sinus")) return [radial ? "TIG" : "JR4", "AL1", "JL4"];
  if (variants.includes("anomalous-lcx-right-sinus") || variants.includes("anomalous-lcx-from-rca")) return [radial ? "TIG" : "JR4", "AL1", "AR"];
  if (variants.includes("very-dilated-root") || variants.includes("high-ostia")) return [radial ? "TIG" : "JR4", "AR", "AL1"];
  if (
    variants.includes("high-rca") ||
    variants.includes("superior-rca") ||
    variants.includes("shepherds-crook-rca") ||
    variants.includes("anterior-rca")
  )
    return ["AR", "JR4"];
  return radial ? ["JR4", "IKR", "TIG"] : ["JR4"];
}

function requiredViewsFor(focus: "left" | "right" | "both"): string[] {
  const left = ["spider", "raocranial", "laocranial", "raocaudal"];
  const right = ["rcalao", "rcarao"];
  if (focus === "left") return left;
  if (focus === "right") return right;
  return [...left.slice(0, 3), ...right];
}

function trapsFor(p: CoreParams): string[] {
  const traps: string[] = [];
  if (p.rootSize === "dilated" && p.focus !== "right")
    traps.push("A small left catheter will fall short and inject the root.");
  if (p.rootSize === "small")
    traps.push("An over-sized catheter will cram the cusp and prolapse toward the LV.");
  if (p.variants.includes("high-rca") || p.variants.includes("superior-rca"))
    traps.push("The RCA take-off is high — pushing a JR4 forward drops you into the LV.");
  if (p.variants.includes("anterior-rca"))
    traps.push("The RCA is anterior — extra clockwise torque is needed to face the ostium.");
  if (p.variants.includes("rotated-root"))
    traps.push("The root is rotated — the catheter's natural tip position is off; torque to compensate.");
  if (p.variants.includes("horizontal-aorta"))
    traps.push("Horizontal aorta — a Judkins may not seat; an Amplatz shape reaches the cusp.");
  // anatomy variants (diag-anatomy-variants): guided teaching aids only (CoachPanel), worded as what to do, not as
  // the answer
  if (p.variants.some((v) => (ANOMALY_VARIANTS as readonly string[]).includes(v)))
    traps.push("If a territory has no supplying vessel, find the ostium with a sinus injection or an aortogram before changing catheters.");
  if (p.variants.includes("conus-separate-ostium"))
    traps.push("If the trace damps as the right catheter enters, withdraw before any injection.");
  if (p.variants.includes("myocardial-bridge"))
    traps.push("Grade any narrowing on a diastolic frame, and compare it with systole.");
  if (p.variants.includes("very-dilated-root"))
    traps.push("A very large root: if the left catheter cannot reach the ostium, size up or change shape before pushing.");
  if (p.pathology === "left-main")
    traps.push("Left main disease — avoid deep engagement and damping; keep the pressure clean.");
  if (p.pathology === "ostial-rca")
    traps.push("Ostial RCA disease — gentle, non-deep engagement; watch for damping.");
  traps.push("Confirm a clean aortic pressure before every injection.");
  return traps;
}

/** The donor and recipient of the collateral channel a generated CTO gets, by the occluded vessel (contralateral, the commonest routes). */
const CTO_CHANNEL: Partial<Record<VesselId, Pick<CollateralChannel, "donor" | "recipient" | "type">>> = {
  RCA: { donor: "LAD", recipient: "PDA", type: "septal" },
  LAD: { donor: "RCA", recipient: "LAD", type: "septal" },
  LCx: { donor: "RCA", recipient: "OM1", type: "epicardial" },
};

/**
 * Morphology for a generated lesion, drawn with its own seeded stream so the rest of the case is
 * unchanged (diag-lesion-morphologies). A morphology applies only to lesions it fits: 'cto' to
 * occlusions, 'thrombus' to thrombotic lesions, 'spasm' to spasm lesions, 'scad' to non-occlusive
 * ones; 'concentric' leaves the lesion as it is. The values are model draws, not sourced figures.
 */
function withMorphology(l: Lesion, kinds: readonly LesionMorphology[], eccentric: boolean, rng: Rng): Lesion {
  const out: Lesion = { ...l };
  const occluded = l.severity >= 99 || l.kind === "cto";
  if (kinds.includes("cto") && occluded && l.kind !== "thrombotic") {
    const ch = CTO_CHANNEL[l.vessel];
    out.morphology = "cto";
    out.cto = {
      stump: rng.pick(["tapered", "blunt"] as const),
      lengthMm: rng.int(10, 35),
      collaterals: ch ? [{ ...ch, wernerCC: rng.pick([1, 1, 2] as const), rentrop: rng.pick([2, 3, 3] as const), tortuosity: rng.pick([0, 1, 2] as const) }] : [],
    };
  } else if (kinds.includes("thrombus") && l.kind === "thrombotic") {
    out.morphology = "thrombus";
    out.thrombusGrade = occluded ? 5 : rng.pick([2, 3, 4] as const);
  } else if (kinds.includes("spasm") && l.kind === "spasm") {
    out.morphology = "spasm";
    out.nitrateResponsive = true;
  } else if (kinds.includes("scad") && !occluded) {
    const type = rng.pick(["1", "2A", "2B", "3"] as const);
    out.morphology = "scad";
    out.scadType = type;
  }
  if (eccentric && !occluded && out.morphology !== "scad") {
    out.eccentricity = Math.round((0.4 + 0.4 * rng.next()) * 100) / 100;
    out.orientationDeg = rng.int(0, 179);
  }
  return out;
}

function lesionsFor(pathology: PathologyKind, rng: Rng, morph?: { kinds: readonly LesionMorphology[]; eccentric: boolean; rng: Rng }): Lesion[] {
  const plain = plainLesionsFor(pathology, rng);
  if (!morph || (!morph.kinds.length && !morph.eccentric)) return plain;
  return plain.map((l) => withMorphology(l, morph.kinds, morph.eccentric, morph.rng));
}

function plainLesionsFor(pathology: PathologyKind, rng: Rng): Lesion[] {
  const mk = (vessel: VesselId, position: number, severity: number): Lesion => ({
    vessel,
    position,
    severity,
    kind: pathology,
  });
  switch (pathology) {
    case "none":
      return [];
    case "mild-irregularity":
      return [mk("LAD", 0.4, rng.int(20, 35)), mk("RCA", 0.5, rng.int(20, 30))];
    case "moderate-stenosis":
      return [mk("LAD", 0.45, rng.int(50, 68))];
    case "severe-stenosis":
      return [mk(rng.pick(["LAD", "LCx", "RCA"]), 0.5, rng.int(75, 90))];
    case "critical-lad":
      return [mk("LAD", 0.22, rng.int(90, 98))];
    case "left-main":
      return [mk("LM", 0.6, rng.int(60, 85))];
    case "ostial-rca":
      return [mk("RCA", 0.03, rng.int(70, 90))];
    case "mid-rca":
      return [mk("RCA", 0.5, rng.int(70, 90))];
    case "lcx-om":
      return [mk("LCx", 0.4, rng.int(70, 88)), mk("OM1", 0.3, rng.int(50, 70))];
    case "diffuse":
      return [
        mk("LAD", 0.3, rng.int(40, 60)),
        mk("LAD", 0.6, rng.int(45, 65)),
        mk("RCA", 0.5, rng.int(40, 60)),
      ];
    case "cto":
      return [mk("RCA", 0.35, 100)];
    case "thrombotic":
      return [mk("LAD", 0.25, rng.int(92, 100))];
    case "calcified":
      return [mk("RCA", 0.45, rng.int(60, 80))];
    case "spasm":
      return [mk("RCA", 0.4, rng.int(50, 80))];
    default:
      return [];
  }
}

function teachingSummary(p: CoreParams): string {
  const bits: string[] = [];
  bits.push(
    `${p.rootSize[0].toUpperCase()}${p.rootSize.slice(1)} aortic root, ${p.dominance} dominant, ${p.access.replace("-", " ")} access.`
  );
  if (p.variants.length) bits.push(`Variants: ${p.variants.join(", ")}.`);
  if (p.pathology !== "none") bits.push(`Pathology: ${p.pathology.replace("-", " ")}.`);
  bits.push(
    p.focus === "left"
      ? "Goal: safe selective left coronary angiography with diagnostic views of the LAD and LCx."
      : p.focus === "right"
      ? "Goal: safe selective RCA angiography with LAO and RAO working views."
      : "Goal: a complete, safe diagnostic study of both coronary systems."
  );
  return bits.join(" ");
}

export function buildCase(p: CoreParams, id?: string): AnatomyCase {
  const seed = id ?? uid();
  const rng = new Rng(seed + p.name);
  const rec =
    p.focus === "left"
      ? recommendedLeft(p.rootSize, p.variants, p.access)
      : p.focus === "right"
      ? recommendedRight(p.variants, p.access)
      : [...recommendedLeft(p.rootSize, p.variants, p.access).slice(0, 1), ...recommendedRight(p.variants, p.access).slice(0, 1)];
  const acceptable = Array.from(
    new Set([
      ...rec,
      ...recommendedLeft(p.rootSize, p.variants, p.access),
      ...recommendedRight(p.variants, p.access),
      "TIG",
    ])
  );
  return {
    id: seed,
    name: p.name,
    difficulty: p.difficulty,
    accessRoute: p.access,
    rootSize: p.rootSize,
    rootRotationDeg: p.rootRotationDeg,
    aortaTiltDeg: p.aortaTiltDeg,
    dominance: p.dominance,
    variants: p.variants,
    pathology: p.pathology,
    lesions: lesionsFor(p.pathology, rng, p.morphology?.length || p.eccentric ? { kinds: p.morphology ?? [], eccentric: !!p.eccentric, rng: new Rng(seed + p.name + ":morphology") } : undefined),
    recommendedCatheters: rec,
    acceptableCatheters: acceptable,
    requiredViews: requiredViewsFor(p.focus),
    traps: trapsFor(p),
    objectives: p.objectives,
    teachingSummary: teachingSummary(p),
  };
}

// ---------------------------------------------------------------------------
// 25 case templates → expanded into a named library of 100+ cases.
// ---------------------------------------------------------------------------
interface Template {
  key: string;
  name: string;
  base: Omit<CoreParams, "name">;
}

const TEMPLATES: Template[] = [
  { key: "easy-left", name: "Routine left coronary", base: { difficulty: 1, access: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 5, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "left", objectives: ["Engage the left main coaxially with a JL4", "Obtain diagnostic LAD and LCx views"] } },
  { key: "easy-rca", name: "Routine RCA", base: { difficulty: 1, access: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 5, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "right", objectives: ["Engage the RCA with torque and gentle withdrawal", "Obtain LAO and RAO RCA views"] } },
  { key: "complete-normal", name: "Complete normal study", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Complete both coronary systems safely", "Keep contrast and fluoro efficient"] } },
  { key: "small-root", name: "Small root — JL3.5", base: { difficulty: 2, access: "femoral", rootSize: "small", rootRotationDeg: 0, aortaTiltDeg: 4, dominance: "right", variants: ["small-root"], pathology: "none", focus: "left", objectives: ["Select JL3.5 for the small root", "Avoid deep engagement and prolapse"] } },
  { key: "large-root", name: "Dilated root — JL5", base: { difficulty: 3, access: "femoral", rootSize: "dilated", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["dilated-root"], pathology: "none", focus: "left", objectives: ["Recognise the dilated root", "Step up to JL4.5/JL5 to reach the left main"] } },
  { key: "rca-difficult", name: "Difficult RCA take-off", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 8, aortaTiltDeg: 8, dominance: "right", variants: ["anterior-rca"], pathology: "none", focus: "right", objectives: ["Use extra clockwise torque for the anterior ostium", "Avoid dropping into the LV"] } },
  { key: "high-rca", name: "High anterior RCA", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["high-rca", "anterior-rca"], pathology: "none", focus: "right", objectives: ["Reach the high anterior ostium", "Switch to an Amplatz Right if JR4 fails"] } },
  { key: "dilated-root-both", name: "Dilated root — full study", base: { difficulty: 4, access: "femoral", rootSize: "dilated", rootRotationDeg: 10, aortaTiltDeg: 14, dominance: "right", variants: ["dilated-root"], pathology: "mild-irregularity", focus: "both", objectives: ["Match catheters to the dilated root", "Complete a safe study"] } },
  { key: "horizontal-aorta", name: "Horizontal aorta", base: { difficulty: 4, access: "femoral", rootSize: "dilated", rootRotationDeg: 8, aortaTiltDeg: 32, dominance: "right", variants: ["horizontal-aorta", "dilated-root"], pathology: "none", focus: "left", objectives: ["Recognise the horizontal aorta", "Use an Amplatz shape to reach the left main"] } },
  { key: "tortuous-radial", name: "Tortuous radial route", base: { difficulty: 4, access: "radial-right", rootSize: "normal", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["radial-loop", "tortuous-subclavian"], pathology: "none", focus: "both", objectives: ["Navigate the radial loop with a hydrophilic wire", "Complete the study with a TIG"] } },
  { key: "femoral-easy", name: "Femoral — easy control", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 2, aortaTiltDeg: 6, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Use stable femoral catheter control", "Obtain a full diagnostic set"] } },
  { key: "radial-tig", name: "Radial — TIG universal", base: { difficulty: 3, access: "radial-left", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Engage both coronaries with one TIG", "Confirm which vessel before each injection"] } },
  { key: "lm-deep", name: "Left main deep-engagement risk", base: { difficulty: 4, access: "femoral", rootSize: "small", rootRotationDeg: 4, aortaTiltDeg: 6, dominance: "right", variants: ["small-root", "short-lm"], pathology: "none", focus: "left", objectives: ["Avoid deep left main engagement", "Recognise damping and withdraw"] } },
  { key: "rca-damping", name: "RCA damping risk", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "ostial-rca", focus: "right", objectives: ["Engage without damping the ostial RCA", "Read the pressure before injecting"] } },
  { key: "nonselective-trap", name: "Non-selective injection trap", base: { difficulty: 3, access: "femoral", rootSize: "dilated", rootRotationDeg: 6, aortaTiltDeg: 10, dominance: "right", variants: ["dilated-root"], pathology: "none", focus: "left", objectives: ["Resist injecting a non-selective root puff", "Seat selectively first"] } },
  { key: "lv-entry-trap", name: "LV entry trap", base: { difficulty: 3, access: "femoral", rootSize: "small", rootRotationDeg: 4, aortaTiltDeg: 6, dominance: "right", variants: ["small-root"], pathology: "none", focus: "left", objectives: ["Do not push below the valve plane", "Recover from LV entry by withdrawing"] } },
  { key: "short-lm", name: "Short left main", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["short-lm"], pathology: "none", focus: "left", objectives: ["Handle a short LM without deep engagement", "Separate LAD and LCx with the spider view"] } },
  { key: "separate-ostia", name: "Separate LAD/LCx ostia", base: { difficulty: 4, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["separate-ostia"], pathology: "none", focus: "left", objectives: ["Recognise the absent left main", "Engage the LAD and LCx ostia separately"] } },
  { key: "left-dominant", name: "Left dominant system", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "left", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Recognise left dominance (PDA from LCx)", "Image the dominant circumflex fully"] } },
  { key: "right-dominant", name: "Right dominant system", base: { difficulty: 2, access: "femoral", rootSize: "normal", rootRotationDeg: 2, aortaTiltDeg: 6, dominance: "right", variants: ["normal-root"], pathology: "none", focus: "both", objectives: ["Confirm right dominance", "Image the crux and PDA in the RCA cranial view"] } },
  { key: "ramus", name: "Ramus intermedius", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["ramus"], pathology: "none", focus: "left", objectives: ["Identify the ramus intermedius", "Do not mistake it for a high diagonal"] } },
  { key: "prox-lad", name: "Proximal LAD lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "critical-lad", focus: "left", objectives: ["Demonstrate the proximal LAD lesion", "Choose views that avoid foreshortening it"] } },
  { key: "lcx-lesion", name: "Circumflex / OM lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "lcx-om", focus: "left", objectives: ["Lay out the LCx and OMs in RAO caudal", "Grade the lesion severity"] } },
  { key: "rca-lesion", name: "Mid RCA lesion", base: { difficulty: 3, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "mid-rca", focus: "right", objectives: ["Demonstrate the mid RCA lesion", "Elongate it in the RAO view"] } },
  { key: "left-main-lesion", name: "Left main disease recognition", base: { difficulty: 5, access: "femoral", rootSize: "normal", rootRotationDeg: 4, aortaTiltDeg: 8, dominance: "right", variants: ["normal-root"], pathology: "left-main", focus: "left", objectives: ["Recognise left main disease safely", "Avoid deep engagement; keep pressure clean"] } },
];

function variationName(base: string, i: number): string {
  return i === 0 ? base : `${base} — variant ${i + 1}`;
}

export const CASE_LIBRARY: AnatomyCase[] = (() => {
  const out: AnatomyCase[] = [];
  TEMPLATES.forEach((tpl) => {
    for (let i = 0; i < 4; i++) {
      const rng = new Rng(tpl.key + ":" + i);
      const p: CoreParams = {
        ...tpl.base,
        name: variationName(tpl.name, i),
        rootRotationDeg: tpl.base.rootRotationDeg + rng.int(-8, 12),
        aortaTiltDeg: Math.max(0, tpl.base.aortaTiltDeg + rng.int(-4, 8)),
      };
      out.push(buildCase(p, `${tpl.key}-${i}`));
    }
  });
  return out;
})();

export const caseById = (id: string): AnatomyCase | undefined =>
  CASE_LIBRARY.find((c) => c.id === id);

// ---------------------------------------------------------------------------
// Procedural random case generation for endless practice.
// ---------------------------------------------------------------------------
const ROOTS: RootSize[] = ["small", "normal", "normal", "dilated"];
const DOMS: Dominance[] = ["right", "right", "right", "left", "codominant"];
const ACCESS: AccessRoute[] = ["femoral", "femoral", "radial-right", "radial-left"];
const VARIANT_POOL: AnatomyVariant[] = [
  "high-rca",
  "anterior-rca",
  "superior-rca",
  "shepherds-crook-rca",
  "short-lm",
  "long-lm",
  "separate-ostia",
  "ramus",
  "rotated-root",
  "horizontal-aorta",
  "tortuous-rca",
];
const PATHS: PathologyKind[] = [
  "none",
  "none",
  "mild-irregularity",
  "moderate-stenosis",
  "severe-stenosis",
  "critical-lad",
  "left-main",
  "ostial-rca",
  "mid-rca",
  "lcx-om",
  "diffuse",
];

// ---------------------------------------------------------------------------
// Parametric generator core.
//
// Every practice case — random, daily, a targeted batch, or a saved failure —
// comes out of one function: `generateCase(seed, spec)`. A `CaseSpec` is a set
// of soft constraints; anything left unspecified is drawn from a pool by the
// seeded RNG, so a spec like `{ focus: "right", forceVariants: ["high-rca"] }`
// yields an endless, reproducible stream of high-RCA cases. The seed + preset
// key are encoded into the case id so any generated case can be regenerated
// byte-for-byte later (replay-by-seed, saved failures, the daily case).
// ---------------------------------------------------------------------------

/** A soft constraint set. Scalar fields accept a single value OR a list to
 *  pick from; anything omitted is drawn from the default pool. */
export interface CaseSpec {
  focus?: "left" | "right" | "both";
  access?: AccessRoute | AccessRoute[];
  rootSize?: RootSize | RootSize[];
  dominance?: Dominance | Dominance[];
  pathology?: PathologyKind | PathologyKind[];
  /** always present in the generated case */
  forceVariants?: AnatomyVariant[];
  /** random extra variants are drawn from here (defaults to VARIANT_POOL) */
  variantPool?: AnatomyVariant[];
  /** inclusive range for how many random extra variants to draw */
  variantCount?: [number, number];
  minDifficulty?: number;
  maxDifficulty?: number;
  /** overrides the auto-generated case name */
  nameHint?: string;
  /** extra teaching objectives appended to the anatomy-driven defaults */
  objectives?: string[];
  /**
   * Lesion morphologies to draw on the pathology's lesions where they fit ('cto' with a collateral channel,
   * 'thrombus' with a TIMI thrombus grade, 'spasm' relieved by nitrate, 'scad' of a drawn type). Absent: the
   * plain concentric lesions, so existing specs generate the cases they always did.
   */
  morphology?: LesionMorphology | LesionMorphology[];
  /** give the non-occlusive lesions an eccentric lumen of a drawn eccentricity and orientation */
  eccentric?: boolean;
  /**
   * Draw a rare anomaly at ANOMALY_PRIOR (diag-anatomy-variants). Only random cases ask for it (generateRandomCase,
   * the 'rand' and 'daily' presets); every other caller (the full case, ad hoc PCI, targeted presets) gets none.
   */
  anomalyPrior?: boolean;
}

/** Resolve a spec field: fixed value → use it; list → pick one; absent → pool. */
function pickOpt<T>(rng: Rng, val: T | T[] | undefined, pool: readonly T[]): T {
  if (val === undefined) return rng.pick(pool);
  if (Array.isArray(val)) return rng.pick(val.length ? val : pool);
  return val;
}

// --- Case id encoding (preset key + seed) for deterministic replay ---------
const GEN_PREFIX = "gen";
const SEP = "|";

function encodeCaseId(presetKey: string, seed: string): string {
  return [GEN_PREFIX, presetKey, seed].join(SEP);
}

function decodeCaseId(id: string): { presetKey: string; seed: string } | null {
  if (!id.startsWith(GEN_PREFIX + SEP)) return null;
  const parts = id.split(SEP);
  if (parts.length < 3) return null;
  return { presetKey: parts[1], seed: parts.slice(2).join(SEP) };
}

/** True if the id refers to a procedurally generated (not library) case. */
export const isGeneratedId = (id: string): boolean => decodeCaseId(id) !== null;

function autoName(
  focus: "left" | "right" | "both",
  rootSize: RootSize,
  variants: AnatomyVariant[],
  pathology: PathologyKind,
  spec: CaseSpec
): string {
  if (spec.nameHint) return spec.nameHint;
  const focusLabel =
    focus === "left" ? "Left coronary" : focus === "right" ? "RCA" : "Full study";
  const salientVariant = variants.find(
    (v) => v !== "normal-root" && v !== "small-root" && v !== "dilated-root"
  );
  const detail =
    pathology !== "none"
      ? pathology.replace(/-/g, " ")
      : salientVariant
      ? salientVariant.replace(/-/g, " ")
      : `${rootSize} root`;
  return `${focusLabel} — ${detail}`;
}

const DEFAULT_OBJECTIVES = [
  "Choose a catheter suited to the anatomy",
  "Engage selectively without damping or LV entry",
  "Obtain diagnostic views of the target vessels",
];

/**
 * The one true case factory. Deterministic in (seed, spec, presetKey): the same
 * inputs always reproduce the identical case, which is what makes replay-by-seed
 * and saved-failure reload work.
 */
export function generateCase(
  seed: string,
  spec: CaseSpec = {},
  presetKey = "rand"
): AnatomyCase {
  const rng = new Rng("gen:" + seed);
  const rootSize = pickOpt(rng, spec.rootSize, ROOTS);
  const dominance = pickOpt(rng, spec.dominance, DOMS);
  const access = pickOpt(rng, spec.access, ACCESS);
  const focus = spec.focus ?? rng.pick(["left", "right", "both"] as const);

  const variants: AnatomyVariant[] = [...(spec.forceVariants ?? [])];
  const pool = spec.variantPool && spec.variantPool.length ? spec.variantPool : VARIANT_POOL;
  const [vlo, vhi] = spec.variantCount ?? [0, 2];
  const nVar = rng.int(vlo, vhi);
  for (let i = 0; i < nVar; i++) variants.push(rng.pick(pool));
  if (rootSize === "small" && !variants.includes("small-root")) variants.push("small-root");
  if (rootSize === "dilated" && !variants.includes("dilated-root")) variants.push("dilated-root");
  const uniqueVariants = Array.from(new Set(variants));

  const pathology = pickOpt(rng, spec.pathology, PATHS);
  // the case's name is drawn before any rare anomaly, so it never names one (the lab shows the name)
  const name = autoName(focus, rootSize, uniqueVariants, pathology, spec);
  // a random case that asks for it (the default pool, no forced variants, not a scenario) carries a rare anomaly at a
  // low prior, drawn on its own stream so that the rest of the case is unchanged
  const randomAnatomy = spec.anomalyPrior === true && presetKey !== SCN_PREFIX && !spec.variantPool && !spec.forceVariants && (spec.variantCount?.[1] ?? 2) > 0;
  if (randomAnatomy) {
    const ra = new Rng(`gen-anomaly:${seed}`);
    if (ra.next() < ANOMALY_PRIOR) uniqueVariants.push(ra.pick(ANOMALY_VARIANTS));
  }

  let difficulty = 1 + uniqueVariants.length + (pathology !== "none" ? 1 : 0);
  difficulty = Math.max(spec.minDifficulty ?? 1, difficulty);
  difficulty = Math.min(spec.maxDifficulty ?? 5, difficulty);
  difficulty = Math.max(1, Math.min(5, difficulty));

  const p: CoreParams = {
    name,
    difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
    access,
    rootSize,
    rootRotationDeg: rng.int(-15, 20),
    aortaTiltDeg: rng.int(0, 30),
    dominance,
    variants: uniqueVariants,
    pathology,
    focus,
    objectives: [...DEFAULT_OBJECTIVES, ...(spec.objectives ?? [])],
  };
  if (spec.morphology) p.morphology = Array.isArray(spec.morphology) ? spec.morphology : [spec.morphology];
  if (spec.eccentric) p.eccentric = true;
  return buildCase(p, encodeCaseId(presetKey, seed));
}

/**
 * Back-compat wrapper. Older callers pass a raw seed and expect a random case;
 * it now routes through the parametric core under the "rand" preset.
 */
export function generateRandomCase(
  seed: string = uid(),
  opts: { minDifficulty?: number; focus?: "left" | "right" | "both" } = {}
): AnatomyCase {
  return generateCase(seed, { minDifficulty: opts.minDifficulty, focus: opts.focus, anomalyPrior: true }, "rand");
}

// ---------------------------------------------------------------------------
// Targeted batch presets. Each is a named CaseSpec so the UI can offer
// "generate 20 X" buttons and the coach can steer practice at a weak skill.
// ---------------------------------------------------------------------------
export interface CasePreset {
  key: string;
  label: string;
  description: string;
  spec: CaseSpec;
}

export const PRESET_SPECS: Record<string, CasePreset> = {
  rand: {
    key: "rand",
    label: "Random mixed",
    description: "A fresh draw across every access, root, variant and pathology.",
    spec: { anomalyPrior: true },
  },
  daily: {
    key: "daily",
    label: "Daily case",
    description: "The same case for everyone today, seeded by the date.",
    spec: { anomalyPrior: true },
  },
  rca: {
    key: "rca",
    label: "RCA engagement",
    description: "Right coronary focus — torque to the ostium, avoid the LV.",
    spec: { focus: "right", nameHint: "RCA engagement drill" },
  },
  "high-rca": {
    key: "high-rca",
    label: "High / anterior RCA",
    description: "High, anteriorly-directed RCA take-offs that defeat a plain JR4.",
    spec: {
      focus: "right",
      forceVariants: ["high-rca", "anterior-rca"],
      variantPool: ["superior-rca", "shepherds-crook-rca", "tortuous-rca"],
      variantCount: [0, 1],
      minDifficulty: 4,
      nameHint: "High anterior RCA",
    },
  },
  "shepherds-crook": {
    key: "shepherds-crook",
    label: "Shepherd's crook RCA",
    description: "Severe superior loop — an Amplatz Right or support is usually needed.",
    spec: {
      focus: "right",
      forceVariants: ["shepherds-crook-rca"],
      minDifficulty: 4,
      nameHint: "Shepherd's crook RCA",
    },
  },
  "lv-trap": {
    key: "lv-trap",
    label: "LV-entry trap",
    description: "Small roots where an over-sized left catheter prolapses into the LV.",
    spec: {
      focus: "left",
      rootSize: "small",
      forceVariants: ["small-root"],
      variantPool: ["short-lm"],
      variantCount: [0, 1],
      nameHint: "LV-entry trap",
    },
  },
  "nonselective-trap": {
    key: "nonselective-trap",
    label: "Non-selective trap",
    description: "Dilated roots that tempt a root puff instead of a selective seat.",
    spec: {
      focus: "left",
      rootSize: "dilated",
      forceVariants: ["dilated-root"],
      nameHint: "Non-selective injection trap",
    },
  },
  "left-main": {
    key: "left-main",
    label: "Left main disease",
    description: "Recognise left main disease and stay out of it — no deep engagement.",
    spec: {
      focus: "left",
      pathology: "left-main",
      minDifficulty: 4,
      nameHint: "Left main disease",
    },
  },
  damping: {
    key: "damping",
    label: "Damping / pressure",
    description: "Ostial disease that damps the trace — read pressure before injecting.",
    spec: {
      focus: "right",
      pathology: ["ostial-rca", "mid-rca"],
      nameHint: "Damping & pressure drill",
    },
  },
  "catheter-selection": {
    key: "catheter-selection",
    label: "Catheter selection",
    description: "Mixed roots and take-offs where the right shape is the whole game.",
    spec: {
      variantPool: [
        "high-rca",
        "anterior-rca",
        "horizontal-aorta",
        "shepherds-crook-rca",
        "separate-ostia",
      ],
      variantCount: [1, 2],
      rootSize: ["small", "dilated"],
      nameHint: "Catheter selection drill",
    },
  },
  torque: {
    key: "torque",
    label: "Torque control",
    description: "Rotated roots and anterior ostia that demand precise torque.",
    spec: {
      focus: "right",
      forceVariants: ["anterior-rca"],
      variantPool: ["rotated-root", "superior-rca"],
      variantCount: [0, 1],
      nameHint: "Torque control drill",
    },
  },
  radial: {
    key: "radial",
    label: "Radial access",
    description: "Radial routes with loops and subclavian tortuosity; a TIG shines.",
    spec: {
      access: ["radial-right", "radial-left"],
      focus: "both",
      variantPool: ["radial-loop", "tortuous-subclavian", "tortuous-rca"],
      variantCount: [1, 2],
      nameHint: "Radial access case",
    },
  },
  dilated: {
    key: "dilated",
    label: "Dilated root",
    description: "Big roots needing a JL4.5/JL5 to reach the left main.",
    spec: { focus: "left", rootSize: "dilated", forceVariants: ["dilated-root"], nameHint: "Dilated root" },
  },
  views: {
    key: "views",
    label: "View selection",
    description: "Lesions and dominance twists that punish a lazy projection.",
    spec: {
      focus: "both",
      pathology: ["critical-lad", "lcx-om", "mid-rca", "diffuse"],
      variantPool: ["ramus", "separate-ostia"],
      variantCount: [0, 1],
      nameHint: "View selection drill",
    },
  },
  left: {
    key: "left",
    label: "Left coronary",
    description: "Left-system focus across a range of roots and left-main lengths.",
    spec: { focus: "left", nameHint: "Left coronary case" },
  },
};

/** Ordered list for the UI (stable, human-curated order). */
export const PRESET_ORDER: string[] = [
  "rand",
  "rca",
  "high-rca",
  "shepherds-crook",
  "lv-trap",
  "nonselective-trap",
  "left-main",
  "damping",
  "catheter-selection",
  "torque",
  "radial",
  "dilated",
  "views",
  "left",
];

/** Generate `n` reproducible cases for a preset. Same seedBase → same batch. */
export function generateBatch(
  presetKey: string,
  n: number,
  seedBase: string = uid()
): AnatomyCase[] {
  const spec = PRESET_SPECS[presetKey]?.spec ?? {};
  const out: AnatomyCase[] = [];
  for (let i = 0; i < n; i++) {
    out.push(generateCase(`${seedBase}:${i}`, spec, presetKey));
  }
  return out;
}

// --- Daily case ------------------------------------------------------------
export function dailySeed(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `daily-${y}-${m}-${day}`;
}

export function dailyCase(d: Date = new Date()): AnatomyCase {
  return generateCase(dailySeed(d), PRESET_SPECS.daily.spec, "daily");
}

// ---------------------------------------------------------------------------
// Named diagnostic scenarios (diag-scenario-registry). A scenario
// (src/simulation/diagnosticScenarios/) is one patient: its spec draws the
// anatomy from the seed, and the case carries the scenario's chart, events,
// grafts and lesions. The id 'scn|<scenario>|<seed>' regenerates it.
// ---------------------------------------------------------------------------
const SCN_PREFIX = "scn";

/** The seed a scenario opens with when the launch names none. */
export const DEFAULT_SCENARIO_SEED = "1";

/** The case id of a scenario at a seed. */
export function scenarioCaseId(scenarioId: string, seed: string = DEFAULT_SCENARIO_SEED): string {
  return [SCN_PREFIX, scenarioId, seed].join(SEP);
}

/** Decode a scenario case id ('scn|<scenario>|<seed>'); null for any other id. */
export function decodeScenarioCaseId(id: string): { scenarioId: string; seed: string } | null {
  if (!id.startsWith(SCN_PREFIX + SEP)) return null;
  const parts = id.split(SEP);
  if (parts.length < 3 || !parts[1]) return null;
  return { scenarioId: parts[1], seed: parts.slice(2).join(SEP) };
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const SCAD_TYPES: readonly ScadType[] = ["1", "2A", "2B", "3"];

/**
 * A scenario's SCAD lesion that names no type takes one from the seed, so each seed of the scenario
 * can show another of Brilakis's types (diag-lesion-morphologies; the same seed always gives the same
 * type). Lesions that name a type keep it.
 */
function scadTypesForSeed(lesions: Lesion[], scenarioId: string, seed: string): Lesion[] {
  if (!lesions.some((l) => l.morphology === "scad" && !l.scadType)) return lesions;
  const rng = new Rng(`scad:${scenarioId}:${seed}`);
  return lesions.map((l) => (l.morphology === "scad" && !l.scadType ? { ...l, scadType: rng.pick(SCAD_TYPES) } : l));
}

/**
 * The case of a named diagnostic scenario at a seed: deterministic in (scenario, seed), so the same
 * pair always gives the identical case. `lookup` is the registry (tests pass their own).
 */
export function scenarioCase(
  scenarioId: string,
  seed: string = DEFAULT_SCENARIO_SEED,
  lookup: (id: string) => DiagScenario | undefined = diagScenarioById
): AnatomyCase | undefined {
  const s = lookup(scenarioId);
  if (!s) return undefined;
  const id = scenarioCaseId(scenarioId, seed);
  const base = generateCase(`${SCN_PREFIX}:${scenarioId}:${seed}`, { ...s.spec, nameHint: s.caseName, objectives: undefined }, SCN_PREFIX);
  const c: AnatomyCase = {
    ...base,
    id,
    // the lab's name for the case states the presentation only (s.title is for the lessons and the library)
    name: s.caseName,
    lesions: s.lesions ? scadTypesForSeed(clone(s.lesions), scenarioId, seed) : base.lesions,
    objectives: s.objectives ? [...s.objectives] : base.objectives,
    scenarioId,
    events: [...s.events],
    chart: clone(s.chart),
  };
  if (s.grafts?.length) c.grafts = clone(s.grafts);
  return c;
}

// --- Replay: reconstruct any generated case from its id --------------------
export function reconstructCase(id: string): AnatomyCase | undefined {
  const scn = decodeScenarioCaseId(id);
  if (scn) return scenarioCase(scn.scenarioId, scn.seed);
  const dec = decodeCaseId(id);
  if (!dec) return undefined;
  const spec = PRESET_SPECS[dec.presetKey]?.spec ?? {};
  return generateCase(dec.seed, spec, dec.presetKey);
}

/** Look up a library case by id, else regenerate a procedural one from its id. */
export function resolveCase(id: string): AnatomyCase | undefined {
  return caseById(id) ?? reconstructCase(id);
}

/** Replay a raw seed under a preset (used by the "replay seed" input). */
export function replaySeed(seed: string, presetKey = "rand"): AnatomyCase {
  const spec = PRESET_SPECS[presetKey]?.spec ?? {};
  return generateCase(seed.trim(), spec, presetKey);
}

// ---------------------------------------------------------------------------
// Derived difficulty axes — a quick, explainable breakdown for the browser UI.
// ---------------------------------------------------------------------------
export function caseDifficultyAxes(c: AnatomyCase): {
  engagement: number;
  rca: number;
  view: number;
} {
  let engagement = 1;
  let rca = 1;
  let view = 1;

  // Engagement: how hard is it to seat selectively without damping / LV entry.
  if (c.rootSize !== "normal") engagement += 1;
  if (c.variants.includes("short-lm")) engagement += 1;
  if (c.variants.includes("separate-ostia")) engagement += 1;
  if (c.variants.includes("horizontal-aorta")) engagement += 1;
  if (c.pathology === "left-main" || c.pathology === "ostial-rca") engagement += 2;
  if (c.accessRoute !== "femoral") engagement += 1;

  // RCA: take-off geometry that fights the catheter.
  if (c.variants.includes("high-rca")) rca += 2;
  if (c.variants.includes("anterior-rca")) rca += 1;
  if (c.variants.includes("superior-rca")) rca += 1;
  if (c.variants.includes("shepherds-crook-rca")) rca += 2;
  if (c.variants.includes("tortuous-rca")) rca += 1;
  // anatomy variants (diag-anatomy-variants)
  if (c.variants.some((v) => (ANOMALY_VARIANTS as readonly string[]).includes(v))) engagement += 2;
  if (c.variants.includes("very-dilated-root")) engagement += 1;
  if (c.variants.includes("conus-separate-ostium")) rca += 1;
  if (c.variants.includes("myocardial-bridge") || c.variants.includes("fistula-lad-pa")) view += 1;

  // View: how much a wrong projection will cost you.
  view += Math.min(3, c.lesions.length);
  if (c.dominance !== "right") view += 1;
  if (c.variants.includes("ramus")) view += 1;
  if (c.variants.includes("separate-ostia")) view += 1;

  return {
    engagement: Math.min(5, engagement),
    rca: Math.min(5, rca),
    view: Math.min(5, view),
  };
}

// ---------------------------------------------------------------------------
// Coach hook: map a learner's most common mistakes to a targeted preset so
// "target my weakest skill" produces cases that rehearse exactly that error.
// ---------------------------------------------------------------------------
const MISTAKE_TO_PRESET: Partial<Record<MistakeCode, string>> = {
  "too-high": "lv-trap",
  "lv-entry": "lv-trap",
  "lv-injection": "lv-trap",
  "too-much-pushing": "lv-trap",
  "insufficient-withdrawal": "damping",
  "non-selective-injection": "nonselective-trap",
  "damped-injection": "damping",
  "deep-engagement": "damping",
  "ignored-pressure-warning": "damping",
  "wrong-catheter": "catheter-selection",
  "catheter-changed-early": "catheter-selection",
  "catheter-changed-late": "catheter-selection",
  "wrong-rotation": "torque",
  "over-rotation": "torque",
  "non-coaxial": "torque",
  "poor-view": "views",
  "vessel-misid": "views",
  "excess-fluoro": "damping",
  "excess-contrast": "nonselective-trap",
  "too-low": "rca",
};

/** Preset key targeting the learner's most frequent mistake (or "rand"). */
export function weakestSkillPreset(
  mistakes: Record<string, MistakeRecord> | undefined
): string {
  const entries = Object.values(mistakes ?? {});
  if (!entries.length) return "rand";
  entries.sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);
  return MISTAKE_TO_PRESET[entries[0].code] ?? "rand";
}
