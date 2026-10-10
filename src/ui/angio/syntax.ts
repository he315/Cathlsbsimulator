// ===========================================================================
// SYNTAX lesion marking on real AngioCAD studies (angio-decision-drills).
//
// The learner sets dominance (right or left only: SYNTAX has no co-dominant
// option), marks each lesion of 50% or more in a vessel of at least 1.5 mm
// by segment, and notes its adverse features, as pm-target-heart-team ("The
// SYNTAX score, step by step", Brilakis Fig. 7.2 from the 2018 ESC/EACTS
// guideline; lesion definition sianos-syntax-score-2005) teaches.
//
// The score is not totalled. The project rule is that segment weights come
// from the primary SYNTAX paper (Sianos 2005), and that paper's weight table
// has not been obtained and extracted; the lesson quotes only some of the
// weights. Until it is, the drill compares the learner's lesion set with the
// AngioCAD segment grades, segment by segment, and says so
// (SYNTAX_TOTAL_STATUS).
//
// AngioCAD grades each of 15 segments in bands (NL, 1-25, 26-50, 51-75,
// 76-90, 91-99, 100). A band of 51% or more is a SYNTAX lesion; NL and 1-25
// are not; 26-50 holds both 50% (a lesion) and 26-49% (not one), so a
// segment graded 26-50 is indeterminate and not scored either way. AngioCAD
// records no vessel diameter and no lesion features, so the 1.5 mm criterion
// and the adverse features the learner notes are kept with the answer and
// shown back, not scored.
//
// The modality rules that use the score (syntaxRule) follow the lesson's
// table: three-vessel disease 0–22 PCI or CABG, above 22 CABG; left main
// 0–32 PCI or CABG, 33 or more CABG; two-vessel disease no threshold; and
// diabetes moves multivessel disease to CABG whatever the score. The left
// main threshold is never applied to three-vessel disease.
// ===========================================================================

import { ANGIOCAD_SEGMENTS, type AngioCadSegment } from "../../simulation/patient/angiocadPriors";
import type { SourceLoc } from "../../content/schema";

export { ANGIOCAD_SEGMENTS, type AngioCadSegment };

const HEART_TEAM_LESSON = "pm-target-heart-team";
const FIG_7_2: SourceLoc[] = [{ book: "brilakis-pci", loc: "7.1 (Fig. 7.2)" }];
const TABLE_7_1: SourceLoc[] = [
  { book: "brilakis-pci", loc: "7.1 (Table 7.1)" },
  { book: "brilakis-pci", loc: "17.7" },
];

/** The lesion definition (pm-target-heart-team; sianos-syntax-score-2005). */
export const SYNTAX_LESION_RULE = {
  minStenosisPct: 50,
  minVesselMm: 1.5,
  lessonId: HEART_TEAM_LESSON,
  sources: FIG_7_2,
} as const;

/** Why the drill compares lesion sets instead of totalling the score. */
export const SYNTAX_TOTAL_STATUS = {
  totalled: false,
  reason:
    "The score is not totalled here: segment weights are taken only from the primary SYNTAX paper (Sianos 2005), and its weight table has not yet been obtained and extracted. Your lesion set is compared with the AngioCAD segment grades instead.",
} as const;

/**
 * The SYNTAX total. No weight table exists here, so it is always null: this function is replaced (and
 * SYNTAX_TOTAL_STATUS.totalled set) only when the Sianos 2005 segment weights have been extracted. It never
 * returns a number without them.
 */
export function syntaxTotal(): number | null {
  return null;
}

/** Adverse features a learner can note on a marked lesion (the lesson's steps 3a to 11). */
export const SYNTAX_FEATURES = [
  { id: "occlusion", label: "Total occlusion" },
  { id: "trifurcation", label: "Trifurcation" },
  { id: "bifurcation", label: "Bifurcation (Medina)" },
  { id: "aorto-ostial", label: "Aorto-ostial" },
  { id: "tortuosity", label: "Severe tortuosity proximal to the lesion" },
  { id: "length", label: "Length over 20 mm" },
  { id: "calcium", label: "Heavy calcification" },
  { id: "thrombus", label: "Thrombus" },
  { id: "diffuse", label: "Diffuse disease or small vessels downstream" },
] as const;
export type SyntaxFeature = (typeof SYNTAX_FEATURES)[number]["id"];

export type Artery = "LAD" | "LCx" | "RCA";
export type SegmentVessel = Artery | "LM";

/**
 * The artery an AngioCAD segment belongs to. Diagonals belong to the LAD and the obtuse marginal to the
 * circumflex; the PDA and posterolateral branch belong to the dominant artery (the RCA in a right-dominant
 * system, the circumflex in a left-dominant one).
 */
export function segmentVessel(seg: AngioCadSegment, dominance: "right" | "left"): SegmentVessel {
  if (seg === "LM") return "LM";
  if (seg === "PDA" || seg === "PLB") return dominance === "left" ? "LCx" : "RCA";
  if (/LAD$/.test(seg) || seg === "D1" || seg === "D2") return "LAD";
  if (/LCx$/.test(seg) || seg === "OM") return "LCx";
  return "RCA";
}

/** How an AngioCAD grade reads as a SYNTAX lesion. */
export type LesionClass = "lesion" | "none" | "indeterminate";

export function angioCadLesionClass(grade: string | undefined | null): LesionClass {
  switch (grade) {
    case "51-75":
    case "76-90":
    case "91-99":
    case "100":
      return "lesion";
    case "26-50":
      return "indeterminate";
    default:
      return "none";
  }
}

export interface SegmentAgreement {
  segment: AngioCadSegment;
  vessel: SegmentVessel;
  /** the learner marked a lesion here */
  marked: boolean;
  /** the AngioCAD grade as published */
  grade: string;
  reference: LesionClass;
  /** null where the reference is indeterminate */
  agree: boolean | null;
}

export interface LesionSetComparison {
  rows: SegmentAgreement[];
  agreed: number;
  disagreed: number;
  /** segments graded 26-50, not scored */
  indeterminate: number;
  /** marked and a lesion in AngioCAD */
  bothLesion: number;
  /** marked, not a lesion in AngioCAD */
  extra: number;
  /** a lesion in AngioCAD, not marked */
  missed: number;
  /** agreed of the scored segments (NaN when none is scored) */
  agreement: number;
}

/**
 * Compare a learner's lesion set with the AngioCAD grades, per segment: every one of the 15 AngioCAD
 * segments gives one row, and segments graded 26-50 are not scored.
 */
export function compareLesionSets(marked: Iterable<string>, segments: Readonly<Record<string, string>>, dominance: "right" | "left"): LesionSetComparison {
  const m = new Set(marked);
  const rows: SegmentAgreement[] = ANGIOCAD_SEGMENTS.map((segment) => {
    const grade = segments[segment] ?? "NL";
    const reference = angioCadLesionClass(grade);
    const isMarked = m.has(segment);
    return { segment, vessel: segmentVessel(segment, dominance), marked: isMarked, grade, reference, agree: reference === "indeterminate" ? null : isMarked === (reference === "lesion") };
  });
  const scored = rows.filter((r) => r.agree !== null);
  const agreed = scored.filter((r) => r.agree).length;
  return {
    rows,
    agreed,
    disagreed: scored.length - agreed,
    indeterminate: rows.length - scored.length,
    bothLesion: rows.filter((r) => r.marked && r.reference === "lesion").length,
    extra: rows.filter((r) => r.marked && r.reference === "none").length,
    missed: rows.filter((r) => !r.marked && r.reference === "lesion").length,
    agreement: scored.length ? agreed / scored.length : NaN,
  };
}

// ---------------------------------------------------------------------------
// Anatomy and the modality rule that the score feeds
// ---------------------------------------------------------------------------

export const ANATOMY_CLASSES = ["left-main", "three-vessel", "two-vessel", "one-vessel", "none"] as const;
export type AnatomyClass = (typeof ANATOMY_CLASSES)[number];

export const ANATOMY_LABEL: Record<AnatomyClass, string> = {
  "left-main": "Left main disease",
  "three-vessel": "Three-vessel disease",
  "two-vessel": "Two-vessel disease",
  "one-vessel": "Single-vessel disease",
  none: "No lesion of 50% or more",
};

export interface Anatomy {
  leftMain: boolean;
  /** arteries with a lesion beyond the left main */
  arteries: Artery[];
  /** a lesion in the proximal LAD */
  proximalLad: boolean;
  class: AnatomyClass;
}

/** The anatomy of a lesion set (segments marked as lesions); a left main lesion makes it left main disease. */
export function anatomyOf(lesionSegments: Iterable<string>, dominance: "right" | "left"): Anatomy {
  const segs = new Set(lesionSegments);
  const arteries = new Set<Artery>();
  let leftMain = false;
  for (const s of ANGIOCAD_SEGMENTS) {
    if (!segs.has(s)) continue;
    const v = segmentVessel(s, dominance);
    if (v === "LM") leftMain = true;
    else arteries.add(v);
  }
  const n = arteries.size;
  const cls: AnatomyClass = leftMain ? "left-main" : n >= 3 ? "three-vessel" : n === 2 ? "two-vessel" : n === 1 ? "one-vessel" : "none";
  return { leftMain, arteries: (["LAD", "LCx", "RCA"] as const).filter((a) => arteries.has(a)), proximalLad: segs.has("Prox LAD"), class: cls };
}

/**
 * The anatomy classes the AngioCAD grades allow: with the indeterminate (26-50) segments read as no lesion
 * and as lesions. Usually one class; two when an indeterminate segment changes the anatomy.
 */
export function angioCadAnatomies(segments: Readonly<Record<string, string>>, dominance: "right" | "left"): AnatomyClass[] {
  const strict = ANGIOCAD_SEGMENTS.filter((s) => angioCadLesionClass(segments[s]) === "lesion");
  const loose = ANGIOCAD_SEGMENTS.filter((s) => angioCadLesionClass(segments[s]) !== "none");
  return [...new Set([anatomyOf(strict, dominance).class, anatomyOf(loose, dominance).class])];
}

/** Which of the lesson's threshold sets applies to an anatomy. */
export type ThresholdSet = "left-main" | "three-vessel" | "two-vessel" | "not-used";

export const THRESHOLD_SET_LABEL: Record<ThresholdSet, string> = {
  "left-main": "Left main: PCI or CABG at 0–32, CABG at 33 or more",
  "three-vessel": "Three-vessel disease: PCI or CABG at 0–22, CABG above 22",
  "two-vessel": "Two-vessel disease: no threshold given, PCI or CABG",
  "not-used": "No SYNTAX threshold: single-vessel or no disease",
};

export function thresholdSetFor(anatomy: AnatomyClass): ThresholdSet {
  if (anatomy === "left-main") return "left-main";
  if (anatomy === "three-vessel") return "three-vessel";
  if (anatomy === "two-vessel") return "two-vessel";
  return "not-used";
}

export interface SyntaxRule {
  thresholds: ThresholdSet;
  /** what the score allows: either modality or CABG; null where the score is not used */
  modality: "pci-or-cabg" | "cabg" | null;
  text: string;
  lessonId: string;
  sources: SourceLoc[];
}

/** The lesson's thresholds: three-vessel above 22 CABG; left main 33 or more CABG (Brilakis Table 7.1, 17.7). */
export const SYNTAX_THRESHOLDS = { threeVesselEitherMax: 22, leftMainEitherMax: 32 } as const;

/**
 * The modality the SYNTAX score points to for an anatomy (Brilakis Table 7.1 and 17.7, as pm-target-heart-team
 * tabulates them). Diabetes with multivessel or left main disease moves the answer to CABG whatever the score
 * (the lesson's pitfall; the 2024 ESC position for three-vessel disease). The thresholds are chosen by the
 * anatomy, so 33 is never used for three-vessel disease.
 */
export function syntaxRule(anatomy: AnatomyClass, score: number, diabetes = false): SyntaxRule {
  const thresholds = thresholdSetFor(anatomy);
  const base = { thresholds, lessonId: HEART_TEAM_LESSON, sources: TABLE_7_1 };
  if (thresholds === "not-used") return { ...base, modality: null, text: "The SYNTAX thresholds are for multivessel and left main disease; a single-vessel decision does not use them." };
  if (diabetes)
    return {
      ...base,
      modality: "cabg",
      text: "Diabetes moves multivessel and left main disease towards CABG whatever the SYNTAX score; the 2024 ESC guideline recommends CABG over PCI in diabetes with three-vessel disease.",
    };
  if (thresholds === "two-vessel") return { ...base, modality: "pci-or-cabg", text: "Two-vessel disease: the table gives no threshold, so PCI or CABG." };
  if (thresholds === "three-vessel")
    return score > SYNTAX_THRESHOLDS.threeVesselEitherMax
      ? { ...base, modality: "cabg", text: `Three-vessel disease with a score above ${SYNTAX_THRESHOLDS.threeVesselEitherMax}: CABG (Brilakis, 2018 ESC). The left main threshold of 33 does not apply.` }
      : {
          ...base,
          modality: "pci-or-cabg",
          text: `Three-vessel disease scoring 0–${SYNTAX_THRESHOLDS.threeVesselEitherMax}: PCI or CABG (Brilakis, 2018 ESC); without diabetes the 2024 ESC guideline makes PCI a class I alternative at low or intermediate complexity if it can match CABG's completeness.`,
        };
  return score > SYNTAX_THRESHOLDS.leftMainEitherMax
    ? { ...base, modality: "cabg", text: `Left main disease scoring ${SYNTAX_THRESHOLDS.leftMainEitherMax + 1} or more: CABG usually benefits good surgical candidates more.` }
    : { ...base, modality: "pci-or-cabg", text: `Left main disease scoring 0–${SYNTAX_THRESHOLDS.leftMainEitherMax}: PCI or CABG give similar benefit in good surgical candidates without diabetes.` };
}
