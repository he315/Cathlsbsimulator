// ---------------------------------------------------------------------------
// Rule group: engagement technique in the diagnostic lab
// (diag-engagement-technique-set).
//
// The live rules (ENGAGEMENT_RULES):
//   shapes-cycled            more than two catheter changes without a sinus
//                            injection or an aortogram: shapes are being
//                            cycled before the ostium is located (technique).
//                            Brilakis's first question when engagement fails
//                            is whether the ostium has been located, by a
//                            non-selective cusp injection or an aortogram,
//                            before curve sizes and shapes are changed
//                            (pm-engaging-fail, src/content/manual/pci-manual/
//                            07-engaging.ts:792-812, 5.7.3.6).
//   deep-free-trace-inject   an injection with the tip deep in the artery
//                            while the trace still looks free (safety). A
//                            deep position obstructs flow and can hide an
//                            ostial lesion, and a side-hole catheter can keep
//                            the trace normal while its end hole is
//                            obstructed (07-engaging.ts:101, :676, :740;
//                            diag-pressure-transducer). A damped deep seat is
//                            the 'damped-before-inject' rule's
//                            (rules/diagnostic.ts), and the conus is the
//                            'conus' rule's: neither is repeated here.
//   ostium-from-outside      deep at an aorto-ostial lesion without a sinus
//                            injection yet (technique; stops 'inject'): "A tip
//                            sitting too far into the artery can hide an
//                            ostial lesion. When unsure, image the right sinus
//                            non-selectively" (07-engaging.ts:738; tip
//                            diag-interp-ostium-from-outside, Oxford).
//
// deep-free-trace-inject reads only what the live attending already passes
// (the engagement, the trace and the conus flag), so it is in `rules` (what
// RULES collects) and runs in the lab. shapes-cycled and ostium-from-outside
// read EngagementMentorCtx.engagementWork (the catheter changes and root
// injections of the case, from EngagementWorkTracker below), which the
// diagnostic lab's attending does not pass yet, and mentor.test.ts runs a
// firing scenario for every rule in RULES; they join RULES once the lab passes
// the field (reported with this package).
//
// The scoring functions (pure, for the debrief and the ledger):
//   scoreCatheterChoice      the pre-case catheter choice against the route and
//                            the root (pm-to-the-root-choice, 06-to-the-root.ts
//                            :325, :340, :350-360, :453-455; tip
//                            diag-root-match-curve-to-route; 07-engaging.ts
//                            :714-722)
//   scoreStopDecision        the failed-engagement ladder's stop, on the
//                            contrast total (step 5, 07-engaging.ts:808)
//   scoreLeftMainViews       the five-view left main set and the two views
//                            that show its ostium least foreshortened
//                            (Brilakis 6.4 and 15.1.6, complex-pci/
//                            04-left-main.ts:169-171)
//   engagementDecisions      all of these as decision-ledger records
//
// Thresholds and persistence are MODEL PARAMETERS
// (docs/realism/facts/pkg-diag-engagement-technique-set.md). This file imports
// types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule } from "../rules";
import type { DecisionRecord } from "../ledger";
import type { AccessRoute, AnatomyCase, AnatomyVariant, EngagementKind, RootSize } from "../../types";
import { catheterById } from "../../data/catheters";

/** Position of this group in RULES (after the ACS rules, 320). */
export const order = 330;

/** MODEL PARAMETERS of the engagement rules (no source gives a number). */
export const MP_ENGAGEMENT_RULES = {
  /**
   * Catheter changes without a sinus injection or an aortogram that the attending allows before calling it shape
   * cycling: more than this many (the plan's "more than 2 changes"; the module text gives the order of the steps,
   * not a count).
   */
  shapeChangesAllowed: 2,
  /** seconds a deep seat with a free trace persists before the attending asks */
  deepPersistS: 1.5,
  /** seconds deep at an ostial lesion without a sinus injection before the attending asks */
  ostialPersistS: 2,
};

// --- what the lab passes -----------------------------------------------------------------------

/** The case's engagement work so far, for the rules. */
export interface EngagementWork {
  /** catheter changes since the last non-selective root injection (a sinus injection or an aortogram), or since the case began */
  changesSinceRootLook: number;
  /** a non-selective root injection has been made in this case */
  rootLooked: boolean;
  /** the case has an aorto-ostial lesion (the RCA or the left main) */
  ostialLesion: boolean;
}

/** The attending's context with the engagement work. */
export interface EngagementMentorCtx extends MentorCtx {
  engagementWork?: EngagementWork;
}

const workOf = (c: MentorCtx): EngagementWork | undefined => (c as EngagementMentorCtx).engagementWork;

/** The engagement kinds of a non-selective injection into the root: a sinus injection, or a puff or an aortogram above the sinuses. */
export const ROOT_LOOK_KINDS: readonly EngagementKind[] = ["ascending-aorta", "sinus-level", "non-selective"];
const DEEP_KINDS: readonly EngagementKind[] = ["deep-lm", "deep-rca"];

/**
 * Keeps EngagementWork for one case from what the lab sees: the catheter in use (a new id is a change) and each
 * injection with the engagement it was made from. The first catheter of the case is not a change.
 */
export class EngagementWorkTracker {
  readonly ostialLesion: boolean;
  private catheterId: string | null;
  private changes = 0;
  private looked = false;

  constructor(o: { catheterId?: string; ostialLesion?: boolean } = {}) {
    this.catheterId = o.catheterId ?? null;
    this.ostialLesion = !!o.ostialLesion;
  }

  /** The catheter in use now. */
  noteCatheter(id: string): void {
    if (this.catheterId !== null && id !== this.catheterId) this.changes++;
    this.catheterId = id;
  }

  /** An injection, from the engagement the tip had when it was made. */
  noteInjection(kind: EngagementKind): void {
    if (ROOT_LOOK_KINDS.includes(kind)) {
      this.looked = true;
      this.changes = 0;
    }
  }

  get work(): EngagementWork {
    return { changesSinceRootLook: this.changes, rootLooked: this.looked, ostialLesion: this.ostialLesion };
  }
}

/** Whether a case's lesions include an aorto-ostial one: within the first 5% of the RCA or the left main, or a lesion that says so. */
export function hasAortoOstialLesion(lesions: readonly { vessel: string; position: number; sites?: readonly string[] }[]): boolean {
  return lesions.some((l) => l.sites?.includes("aorto-ostial-lesion") || ((l.vessel === "RCA" || l.vessel === "LM") && l.position <= 0.05));
}

const shapesCycled = (c: MentorCtx) => (workOf(c)?.changesSinceRootLook ?? 0) > MP_ENGAGEMENT_RULES.shapeChangesAllowed;
const deepFree = (c: MentorCtx) => DEEP_KINDS.includes(c.engagement) && !c.damped && !c.conus;
const deepAtOstium = (c: MentorCtx) => {
  const w = workOf(c);
  return !!w && w.ostialLesion && !w.rootLooked && DEEP_KINDS.includes(c.engagement);
};
const sideWord = (c: MentorCtx) => (c.engagement === "deep-rca" ? "right coronary" : "left main");

export const ENGAGEMENT_RULES: MentorRule[] = [
  {
    id: "shapes-cycled",
    title: "Shapes cycled before the ostium is located",
    severity: "technique",
    phase: "engage",
    lab: "diagnostic",
    when: shapesCycled,
    persistS: 0,
    anchor: "plan",
    cooldownS: 30,
    mistake: "catheter-changed-early",
    lines: {
      1: () => "Before the next catheter: do you know where the ostium is?",
      2: (c) => `That's ${workOf(c)?.changesSinceRootLook ?? 3} catheters. What has the root shown you so far?`,
      3: () => "You're changing shapes without having seen the ostium.",
      4: () => "Sit in the sinus and give a small non-selective injection, or do an aortogram, then choose the shape from what it shows.",
      5: () => "Stop changing catheters. Find the ostium first.",
    },
    frames: [
      { id: "next-one", text: "I thought the next shape would work", teaching: "Brilakis's first question when engagement fails is whether you know where the ostium is. A cusp injection or an aortogram answers it and may show a high, anomalous or flush-occluded ostium; only then do the curve size and the shape follow.", drill: "catheter-changed-early" },
      { id: "contrast", text: "I was saving contrast", teaching: "One small sinus injection costs less contrast than several failed shapes, and it tells you which shape to choose.", drill: "non-selective-injection" },
    ],
  },
  {
    id: "deep-free-trace-inject",
    title: "Injection from a deep position",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: deepFree,
    persistS: MP_ENGAGEMENT_RULES.deepPersistS,
    stopOn: (a, c) => a === "inject" && deepFree(c),
    anchor: "fluoro",
    cooldownS: 10,
    mistake: "deep-engagement",
    lines: {
      1: () => "Where is the tip relative to the ostium?",
      2: () => "Look at how far the catheter has gone into the artery.",
      3: (c) => `You're deep in the ${sideWord(c)}. A trace that looks free doesn't make that safe.`,
      4: () => "Ease back until the tip sits at the ostium, then check the trace and inject.",
      5: () => "Stop. Not from there. Come back to the ostium first.",
    },
    frames: [
      { id: "trace-ok", text: "The trace looked normal", teaching: "A deep tip obstructs flow even when the trace looks free, and a catheter with side holes keeps sampling the aorta while its end hole is blocked. Confirm the position on fluoroscopy, not on the trace alone.", drill: "deep-engagement" },
      { id: "support", text: "I wanted a stable position for the run", teaching: "Stability for a diagnostic run comes from a coaxial seat at the ostium. A deep position can dissect the artery and hides an ostial lesion.", drill: "deep-engagement" },
    ],
  },
  {
    id: "ostium-from-outside",
    title: "Ostial lesion judged from inside the artery",
    severity: "technique",
    phase: "inject",
    lab: "diagnostic",
    when: deepAtOstium,
    persistS: MP_ENGAGEMENT_RULES.ostialPersistS,
    stopOn: (a, c) => a === "inject" && deepAtOstium(c),
    anchor: "fluoro",
    cooldownS: 20,
    mistake: "deep-engagement",
    lines: {
      1: () => "Can you see the ostium from where the tip is?",
      2: () => "The tip is past the first few millimetres of the artery.",
      3: () => "From this deep you won't see the ostium. Anything there is hidden behind the tip.",
      4: () => "Withdraw into the sinus and give a non-selective injection to see the ostium from outside.",
      5: () => "Hold that run. Image the ostium from the sinus first.",
    },
    frames: [
      { id: "selective-enough", text: "A selective run shows everything", teaching: "A tip that sits too far into the artery hides the ostium. When unsure, image the sinus non-selectively; Oxford and Brilakis both warn that ostial disease is missed this way.", drill: "deep-engagement" },
    ],
  },
];

/**
 * The rules of ENGAGEMENT_RULES that read only the live attending's context (no engagementWork), and so run in the
 * lab now.
 */
export const LIVE_ENGAGEMENT_RULE_IDS: readonly string[] = ["deep-free-trace-inject"];

/**
 * What the registry collects into RULES (src/mentor/rules/index.ts): the live rules only. shapes-cycled and
 * ostium-from-outside read EngagementMentorCtx.engagementWork, which the lab's attending does not pass yet
 * (EngagementWorkTracker is the feed); they join RULES once the lab passes the field and mentor.test.ts has their
 * firing scenarios (reported with this package).
 */
export const rules: MentorRule[] = ENGAGEMENT_RULES.filter((r) => LIVE_ENGAGEMENT_RULE_IDS.includes(r.id));

// --- the catheter choice ------------------------------------------------------------------------

/** The catheters the learner states before the case (the pre-brief's catheter step). */
export interface CatheterChoice {
  access: AccessRoute;
  left?: string;
  right?: string;
  /** the guide, if PCI may follow */
  guide?: string;
  /** French size of the diagnostic catheters and of the guide */
  french?: number;
  guideFrench?: number;
}

/** What the choice is compared with: the route, the root and what the chart says of the patient. */
export interface ChoiceCase {
  route: AccessRoute;
  rootSize: RootSize;
  variants: readonly AnatomyVariant[];
  heightCm?: number;
  /** the ascending aortic diameter, cm, when the chart gives it */
  aortaCm?: number;
  /** the case has an aorto-ostial lesion */
  ostialLesion?: boolean;
}

/**
 * Height bands for "short patients" and "very tall patients" (Oxford, 06-to-the-root.ts:340, :350). MODEL
 * PARAMETERS: the module text names the groups without a height.
 */
export const MP_HEIGHT_CM = { short: 160, veryTall: 190 };

export interface SideExpectation {
  /** catheters that fit the route and the root, the first the usual one */
  accept: string[];
  /** why, with the source */
  why: string;
}

export interface CatheterExpectation {
  left: SideExpectation;
  right: SideExpectation;
  /** guides for PCI on each side by this route */
  guideLeft: SideExpectation;
  guideRight: SideExpectation;
}

const has = (c: ChoiceCase, v: AnatomyVariant) => c.variants.includes(v);
const JL_SIZES = [3.5, 4, 4.5, 5, 6];
const jl = (n: number) => `JL${n}`;

/** Brilakis's JL for a dilated ascending aorta: its diameter in cm plus 1, to the nearest catalogue size (4 cm gives a JL5). */
export function brilakisJlSize(aortaCm: number): string {
  const want = aortaCm + 1;
  let best = JL_SIZES[0];
  for (const n of JL_SIZES) if (Math.abs(n - want) < Math.abs(best - want)) best = n;
  return jl(best);
}

/**
 * The catheters the module text expects for a route and a root (pm-to-the-root-choice and pm-engaging):
 * - left: JL4 from the femoral or left radial route, JL3.5 or a universal radial curve from the right radial (Oxford;
 *   Brilakis lists the universal curves); JL3.5 for a short patient, a small root, a high left main or a separate LAD
 *   origin, JL5 or JL6 for a dilated root or a very tall patient, an AL for dilated sinuses (Oxford); a dilated
 *   ascending aorta's diameter in cm plus 1 gives the JL size (Brilakis); with a short left main a JL one size larger
 *   than the usual one is accepted too (Oxford).
 * - right: JR4 by either route (Oxford), universal curves from the radial (Brilakis); the Williams (3DRC) as Oxford's
 *   alternative; AR1-2 or AL1-2 for an RCA carried forward by a dilated root (Brilakis); AR MOD, 3DRC or a hockey stick
 *   for a shepherd's crook (Oxford, Brilakis).
 * - guides: EBU-type for the left (Ikari left from the radial); for the RCA, JR4 or AL1 femorally, AL1 or Ikari right
 *   from the radial, where JR guides are generally avoided (Brilakis).
 */
export function expectedCatheters(c: ChoiceCase): CatheterExpectation {
  const rightRadial = c.route === "radial-right";
  const radial = c.route !== "femoral";
  const short = (c.heightCm ?? 170) < MP_HEIGHT_CM.short;
  const tall = (c.heightCm ?? 170) >= MP_HEIGHT_CM.veryTall;
  const dilated = c.rootSize === "dilated" || has(c, "dilated-root") || has(c, "very-dilated-root");

  let left: SideExpectation;
  if (dilated) {
    const size = c.aortaCm ? brilakisJlSize(c.aortaCm) : "JL5";
    left = { accept: [...new Set([size, "JL5", "JL6", "AL1", "AL2"])], why: `A dilated root takes a larger JL (Brilakis: the aortic diameter in cm plus 1${c.aortaCm ? `, here ${size}` : ""}; Oxford: JL5 or JL6), or an AL for dilated sinuses.` };
  } else if (c.rootSize === "small" || has(c, "small-root") || short || has(c, "high-ostia") || has(c, "separate-ostia")) {
    left = { accept: ["JL3.5", ...(rightRadial ? ["TIG"] : [])], why: "A short patient, a small root, a high left main or a separate LAD origin takes the shorter JL3.5 (Oxford)." };
  } else if (rightRadial) {
    left = { accept: ["JL3.5", "TIG"], why: "From the right radial: a JL3.5 (Oxford) or a universal curve (Brilakis)." };
  } else {
    left = { accept: tall ? ["JL4", "JL5", "JL6"] : ["JL4"], why: tall ? "Femoral or left radial: JL4 first, with a longer arm (JL5 or JL6) ready for a very tall patient (Oxford)." : "Femoral or left radial: JL4 (both books)." };
  }

  // a short left main: the usual JL keeps entering the LAD, and a JL one size larger lets the tip sit back at the
  // circumflex (Oxford, 07-engaging.ts:551-560; tip diag-short-lm-size-up), so that size is accepted as well
  if (has(c, "short-lm")) {
    const first = left.accept.find((id) => /^JL\d/.test(id));
    const n = first ? JL_SIZES.indexOf(Number(first.slice(2))) : -1;
    const larger = n >= 0 && n + 1 < JL_SIZES.length ? jl(JL_SIZES[n + 1]) : undefined;
    if (larger && !left.accept.includes(larger)) left = { accept: [...left.accept, larger], why: `${left.why} With a short left main, a JL one size larger (${larger}) reaches the circumflex (Oxford).` };
  }

  let right: SideExpectation;
  if (dilated && has(c, "anterior-rca")) {
    right = { accept: ["AR1", "AR2", "AL1", "AL2"], why: "A dilating root rotates anticlockwise and brings the RCA forward: AR1 or AR2, or AL1 or AL2 (Brilakis)." };
  } else if (has(c, "shepherds-crook-rca")) {
    right = { accept: ["AR", "3DRC", "HS"], why: "A shepherd's crook takes an AR MOD or a Williams 3DRC (Oxford) or a hockey stick (Brilakis)." };
  } else {
    right = { accept: radial ? ["JR4", "TIG", "IKR"] : ["JR4", "3DRC"], why: radial ? "From the radial: a JR4 (Oxford) or a universal curve (Brilakis)." : "Femoral: a JR4, or the Williams 3DRC as Oxford's alternative." };
  }

  const guideLeft: SideExpectation = { accept: radial ? ["EBU3.5", "EBU4.0", "EBU3.0", "IKL"] : ["EBU3.5", "EBU4.0", "EBU3.0"], why: "An extra-backup guide for the left (EBU 3.75 or XB 3.5 for most); JL guides support poorly (Brilakis); Ikari left from the radial." };
  const guideRight: SideExpectation = radial
    ? { accept: ["AL1", "IKR"], why: "From the radial: AL1, Ikari Right or 3D Right; JR guides are generally avoided because they support poorly (Brilakis)." }
    : { accept: ["JR4", "AL1", "AR1", "AR2", "HS"], why: "Femoral RCA guides: JR4, AL1 for complex PCI (Brilakis); Oxford ranks AR1-2 above the JR4 and a hockey stick or AL1-2 highest." };
  return { left, right, guideLeft, guideRight };
}

export interface ChoiceVerdict {
  given: string | undefined;
  ok: boolean;
  expected: string[];
  why: string;
}

export interface CatheterChoiceScore {
  route: { ok: boolean; expected: AccessRoute; given: AccessRoute };
  left: ChoiceVerdict;
  right: ChoiceVerdict;
  /** present when a guide was stated */
  guide?: ChoiceVerdict;
  /** a guide larger than 6 Fr at an aorto-ostial lesion (Brilakis uses 6 Fr there because larger guides damp more, 07-engaging.ts:722) */
  guideFrenchAtOstium?: { ok: boolean; given: number };
  /** both coronary catheters fit the route and the root */
  ok: boolean;
}

/** The ascending aortic diameter (cm) a chart's echo or CT line states ("ascending aorta 4.2 cm"), if any. */
export function aortaCmFromNote(note: string | undefined): number | undefined {
  const m = note?.match(/ascending aorta\D{0,12}?(\d+(?:\.\d+)?)\s*cm/i);
  const v = m ? Number(m[1]) : NaN;
  return Number.isFinite(v) && v > 1 && v < 10 ? v : undefined;
}

/** What a case gives the comparison: its route, root, variants, the chart's height and aortic diameter, an ostial lesion. */
export function choiceCaseFor(c: Pick<AnatomyCase, "accessRoute" | "rootSize" | "variants" | "lesions" | "chart">): ChoiceCase {
  return {
    route: c.accessRoute,
    rootSize: c.rootSize,
    variants: c.variants,
    heightCm: c.chart?.heightCm,
    aortaCm: aortaCmFromNote(c.chart?.echo?.note),
    ostialLesion: hasAortoOstialLesion(c.lesions),
  };
}

const verdict = (given: string | undefined, e: SideExpectation): ChoiceVerdict => ({ given, ok: !!given && e.accept.includes(given), expected: e.accept, why: e.why });

/** The pre-case choice against the route and the root (pm-to-the-root#7). */
export function scoreCatheterChoice(choice: CatheterChoice, c: ChoiceCase): CatheterChoiceScore {
  const e = expectedCatheters({ ...c, route: c.route });
  const left = verdict(choice.left, e.left);
  const right = verdict(choice.right, e.right);
  const out: CatheterChoiceScore = { route: { ok: choice.access === c.route, expected: c.route, given: choice.access }, left, right, ok: left.ok && right.ok };
  if (choice.guide) {
    const side = catheterById(choice.guide)?.target === "right" ? e.guideRight : e.guideLeft;
    out.guide = verdict(choice.guide, side);
  }
  if (c.ostialLesion && choice.guide && choice.guideFrench !== undefined) out.guideFrenchAtOstium = { ok: choice.guideFrench <= 6, given: choice.guideFrench };
  return out;
}

// --- the stop decision and the left main views ---------------------------------------------------

export interface StopDecisionInput {
  /** the learner ended the study without engaging every target */
  stopped: boolean;
  /** every target was engaged and imaged */
  engagedAll: boolean;
  /** an emergency (STEMI, cardiogenic shock), when stopping is not the answer */
  emergency: boolean;
  /** contrast used, mL */
  contrastMl: number;
  /** the warning of the stricter contrast ceiling, mL (contrastBudget.ts) */
  warnMl: number;
}

/**
 * Step 5 of the failed-engagement ladder (Brilakis 5.7.3.6, 07-engaging.ts:808): when everything fails, consider
 * ending the procedure, particularly after a large contrast volume and without an emergency; not in STEMI or shock.
 * A large volume is the warning of the stricter contrast ceiling (MODEL PARAMETER: the module text gives no volume).
 * Below it, in an elective case, stopping is premature (the five steps come first) and continuing is correct.
 * Null when every target was engaged (no stop question).
 */
export function scoreStopDecision(s: StopDecisionInput): { correct: boolean; expected: string; given: string } | null {
  if (s.engagedAll) return null;
  const given = s.stopped ? "Stopped" : "Continued";
  if (s.emergency) return { correct: !s.stopped, expected: "Continue: an emergency is not a reason to stop", given };
  const large = s.contrastMl >= s.warnMl;
  if (large) return { correct: s.stopped, expected: "Stop after a large contrast volume without success, and plan coronary CT", given };
  // before a large volume the ladder is still to be worked through: stopping now is premature
  return { correct: !s.stopped, expected: "Work through the five steps before stopping", given };
}

/** Brilakis's left coronary set for the left main: AP, RAO caudal, RAO cranial, LAO cranial and LAO caudal (6.4), by view preset id. */
export const LEFT_MAIN_VIEW_SET: readonly string[] = ["ap", "raocaudal", "raocranial", "laocranial", "spider"];
/** The views that show the true left main ostium least foreshortened: LAO caudal and LAO cranial (Brilakis 15.1.6). */
export const LEFT_MAIN_OSTIUM_VIEWS: readonly string[] = ["spider", "laocranial"];

/** The five-view set acquired, and the two least foreshortened ostial views named. */
export function scoreLeftMainViews(acquired: readonly string[], named: readonly string[] = []): { missing: string[]; complete: boolean; ostiumNamed: boolean } {
  const missing = LEFT_MAIN_VIEW_SET.filter((v) => !acquired.includes(v));
  const ostiumNamed = LEFT_MAIN_OSTIUM_VIEWS.every((v) => named.includes(v)) && named.every((v) => LEFT_MAIN_OSTIUM_VIEWS.includes(v));
  return { missing, complete: missing.length === 0, ostiumNamed };
}

// --- the ledger -----------------------------------------------------------------------------------

const names = (ids: readonly string[]) => ids.map((id) => catheterById(id)?.name ?? id).join(", ");
const routeName: Record<AccessRoute, string> = { femoral: "Femoral", "radial-right": "Right radial", "radial-left": "Left radial" };

/** The engagement set's decisions as ledger records (stage 'setup' for the choice, 'finish' for the stop and the views). */
export function engagementDecisions(o: {
  t?: number;
  choice?: { given: CatheterChoice; against: ChoiceCase };
  stop?: StopDecisionInput;
  views?: { acquired: readonly string[]; named?: readonly string[] };
}): DecisionRecord[] {
  const t = o.t ?? 0;
  const out: DecisionRecord[] = [];
  if (o.choice) {
    const s = scoreCatheterChoice(o.choice.given, o.choice.against);
    out.push({ id: "engage-choice-route", t, stage: "setup", label: "Access route stated", correct: s.route.ok, expected: routeName[s.route.expected], given: routeName[s.route.given], lessonId: "pm-to-the-root-choice" });
    out.push({ id: "engage-choice-left", t, stage: "setup", label: "Left catheter for the route and the root", correct: s.left.ok, expected: names(s.left.expected), given: s.left.given ? names([s.left.given]) : "None", lessonId: "pm-to-the-root-choice", tipIds: ["diag-root-match-curve-to-route", "diag-dilated-root-sizing"] });
    out.push({ id: "engage-choice-right", t, stage: "setup", label: "Right catheter for the route and the root", correct: s.right.ok, expected: names(s.right.expected), given: s.right.given ? names([s.right.given]) : "None", lessonId: "pm-to-the-root-choice", tipIds: ["diag-root-match-curve-to-route"] });
    if (s.guide) out.push({ id: "engage-choice-guide", t, stage: "setup", label: "Guide for PCI by this route", correct: s.guide.ok, expected: names(s.guide.expected), given: names([s.guide.given!]), lessonId: "pm-to-the-root-choice" });
    if (s.guideFrenchAtOstium) out.push({ id: "engage-choice-guide-french", t, stage: "setup", label: "Guide size at an aorto-ostial lesion", correct: s.guideFrenchAtOstium.ok, expected: "6 Fr", given: `${s.guideFrenchAtOstium.given} Fr`, lessonId: "pm-engaging-rca" });
  }
  if (o.stop) {
    const v = scoreStopDecision(o.stop);
    if (v) out.push({ id: "engage-fail-stop", t, stage: "finish", label: "Stop decision after failed engagement", correct: v.correct, expected: v.expected, given: v.given, lessonId: "pm-engaging-fail", tipIds: ["diag-engage-fail-ladder"] });
  }
  if (o.views) {
    const v = scoreLeftMainViews(o.views.acquired, o.views.named ?? []);
    out.push({ id: "lm-five-views", t, stage: "views", label: "The five-view left main set", correct: v.complete, expected: "AP, RAO caudal, RAO cranial, LAO cranial, LAO caudal", given: v.missing.length ? `Missing ${v.missing.length}` : "All five", lessonId: "cp-left-main-assess", tipIds: ["diag-lm-damping-causes"] });
    if (o.views.named) out.push({ id: "lm-ostium-views", t, stage: "views", label: "Least foreshortened views of the left main ostium", correct: v.ostiumNamed, expected: "LAO caudal and LAO cranial", given: o.views.named.length ? o.views.named.join(", ") : "None named", lessonId: "cp-left-main-assess" });
  }
  return out;
}
