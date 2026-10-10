// ---------------------------------------------------------------------------
// Procedural skill cards: 1-3 minute micro-scenarios that start at the moment
// of a specific error (tip in the conus, a ventricularised RCA, a wire in S1,
// an oversized balloon loaded). Every drill named in MISTAKE_INFO has a
// template here, so its "Drill" button can launch a real scenario. Cards are
// graded on measured outcome (passing standards on the micro-scenario's
// metrics, and the error not recurring), never on self-report, and scheduled
// with the existing SM-2 scheduler (srs.ts).
//
// The ledger decay constant (14 days) and card durations are model parameters.
//
// Scheduling (found-mentor-registries, HANDOVER 6.4): the debrief announces the
// cards for its gaps; scheduleCards puts each one in the learner's review
// memory, due today, so the announcement is true in every lab. Scheduling is
// not a grade: a card's SM-2 record changes only when it is played (reviewCard).
// ---------------------------------------------------------------------------

import type { AnatomyCase, CArm, Difficulty, EngagementKind, MistakeCode, MistakeRecord } from "../types";
import { MISTAKE_INFO } from "../data/teachingText";
import { newMemory, review, type QuizMemory } from "../simulation/srs";
import { buildAnatomy } from "../simulation/anatomy";
import { catheterById } from "../data/catheters";
import { computeEngagement, initialControls, type ControlState } from "../simulation/engagement";
import { computeTip } from "../simulation/engagement";
import { computePressure } from "../simulation/pressure";
import { SOURCES, evaluateStandards, type PassingStandard } from "./standards";
import type { Metrics } from "./metrics";
import type { MistakeTally } from "./types";

/** Where a diagnostic card starts: an engagement class (and pressure) the learner must recover from or exploit. */
export interface DiagnosticStart {
  kind: "diagnostic";
  /** caseGenerator preset to draw the case from */
  preset: string;
  /** a specific library case instead of a generated one (when the start state needs that anatomy) */
  caseId?: string;
  /** preferred catheter; resolveDiagnosticStart falls back to other suitable shapes */
  catheterId?: string;
  /** engagement class to start in (found by searching the controls) */
  engagement?: EngagementKind;
  /** require the conus flag (RCA) */
  conus?: boolean;
  /** require this pressure class */
  pressure?: string;
  cArm?: CArm;
  /** the case carries a plan budget (efficiency cards) */
  budget?: { fluoroS?: number; contrastMl?: number };
}

/** Where a PCI card starts, as a description the PCI lab turns into PciState. */
export interface PciStart {
  kind: "pci";
  scenario: string;
  /** the wire tip sits in this branch (tree vessel name) */
  wireIn?: string;
  /** a device is loaded: kind, size relative to the local reference, position */
  device?: { kind: "balloon" | "stent"; sizeRatio: number; at: "lesion" | "proximal-normal" | "distal-normal" | "in-stent" };
  /** a complication is present at the start */
  complication?: "perforation" | "dissection" | "slow-flow";
}

export interface SkillCardTemplate {
  code: MistakeCode;
  /** the MISTAKE_INFO drill name */
  title: string;
  epa: string;
  brief: string;
  start: DiagnosticStart | PciStart;
  /** model parameter: allotted time (s) */
  durationS: number;
  passRule: PassingStandard[];
}

const D = SOURCES.simDefault;
const std = (id: string, metric: string, op: PassingStandard["op"], value: number, label: string): PassingStandard => ({ id, epa: "skill-card", metric, op, value, label, source: D });
const NO_CRIT = std("card-critical", "criticalErrors", "==", 0, "Critical errors");

/** One template per MistakeCode (all 24), each with its MISTAKE_INFO drill title. */
export const SKILL_CARD_TEMPLATES: Record<MistakeCode, SkillCardTemplate> = buildTemplates();

function buildTemplates(): Record<MistakeCode, SkillCardTemplate> {
  const t = (code: MistakeCode, epa: string, brief: string, start: DiagnosticStart | PciStart, passRule: PassingStandard[], durationS = 120): SkillCardTemplate => ({
    code,
    title: MISTAKE_INFO[code].drill,
    epa,
    brief,
    start,
    durationS,
    passRule: [NO_CRIT, ...passRule],
  });
  return {
    "too-high": t("too-high", "lca-engage", "The tip is above the sinuses. Bring it to the cusp level and seat.", { kind: "diagnostic", preset: "left", engagement: "ascending-aorta" }, [std("c-sel", "timeToSelectiveS.left", "<=", 90, "Time to selective")]),
    "too-low": t("too-low", "lca-engage", "The tip is down at the valve plane. Come back up to the cusps without crossing the valve.", { kind: "diagnostic", preset: "lv-trap", engagement: "sinus-level" }, [std("c-lv", "lvEntries", "==", 0, "LV entries")]),
    "lv-entry": t("lv-entry", "lca-engage", "The tip is in the ventricle. Recover to the root and seat the left main.", { kind: "diagnostic", preset: "lv-trap", engagement: "in-lv" }, [std("c-lvinj", "lvInjections", "==", 0, "LV injections")]),
    "wrong-catheter": t("wrong-catheter", "lca-engage", "The catheter on the table does not suit this root. Recognise it and choose.", { kind: "diagnostic", preset: "catheter-selection" }, [std("c-ch", "catheterChanges.total", "<=", 1, "Catheter changes")], 150),
    "too-much-pushing": t("too-much-pushing", "lca-engage", "The shaft is loaded against a tip that will not seat. Release and re-approach.", { kind: "diagnostic", preset: "lv-trap", engagement: "near-lm" }, [std("c-push", "pushingEpisodes", "==", 0, "Pushing episodes")]),
    "insufficient-withdrawal": t("insufficient-withdrawal", "rca-engage", "The tip is deep. Withdraw and reassess before anything else.", { kind: "diagnostic", preset: "damping", caseId: "small-root-0", catheterId: "AR", engagement: "deep-rca" }, [std("c-dmp", "injectWhileDamped", "==", 0, "Injections on a damped trace")]),
    "wrong-rotation": t("wrong-rotation", "rca-engage", "The tip is at the right cusp. Turn the correct way to the ostium.", { kind: "diagnostic", preset: "torque", catheterId: "JR4", engagement: "non-selective" }, [std("c-sel", "timeToSelectiveS.right", "<=", 60, "Time to selective")]),
    // Starts coaxial with the RCA, inside the near-ostium distance but not seated. With the fixed
    // engagement thresholds a JR4 reaches 'near-rca' in only a minority of the torque preset's
    // roots, so the card starts in 'coaxial-rca'. It is pinned to easy-rca-0 because on a fresh
    // torque case the JR4 often cannot seat at all (the brief would be impossible and failed
    // approaches would fail the card), and the smallest-excursion start usually sits one torque
    // step from leaving the class. On easy-rca-0 the JR4 starts in the middle of the coaxial run,
    // seats with a small clockwise turn, and leaves the seated run if torqued further, which the
    // over-rotation check in analysis.ts detects (mentor.test.ts).
    "over-rotation": t("over-rotation", "rca-engage", "The JR4 sits just short of the RCA ostium, lined up. Seat it with small movements and do not torque past the ostium.", { kind: "diagnostic", preset: "torque", caseId: "easy-rca-0", catheterId: "JR4", engagement: "coaxial-rca" }, [std("c-fail", "failedAttempts.right", "<=", 1, "Failed approaches")]),
    "non-coaxial": t("non-coaxial", "lca-engage", "The tip touches the ostium but points across it. Make it coaxial before injecting.", { kind: "diagnostic", preset: "left", caseId: "easy-left-0", engagement: "near-lm" }, [std("c-nonsel", "nonSelectiveInjections", "==", 0, "Non-selective injections")]),
    "deep-engagement": t("deep-engagement", "rca-engage", "The trace is ventricularised. Back out until it recovers.", { kind: "diagnostic", preset: "damping", caseId: "small-root-0", catheterId: "AR", engagement: "deep-rca", pressure: "ventricularised" }, [std("c-dmp", "injectWhileDamped", "==", 0, "Injections on a damped trace")], 90),
    "damped-injection": t("damped-injection", "rca-engage", "Seated, with a damped trace. Make it safe, then take a diagnostic run.", { kind: "diagnostic", preset: "damping", caseId: "small-root-0", catheterId: "AR", engagement: "deep-rca" }, [std("c-dmp", "injectWhileDamped", "==", 0, "Injections on a damped trace"), std("c-loop", "standardisedLoops", ">=", 1, "Diagnostic runs")]),
    "non-selective-injection": t("non-selective-injection", "lca-engage", "A dilated root tempts a root puff. Seat selectively first.", { kind: "diagnostic", preset: "nonselective-trap", engagement: "non-selective" }, [std("c-nonsel", "nonSelectiveInjections", "==", 0, "Non-selective injections")], 150),
    "poor-view": t("poor-view", "diag-study", "Show the target segment unforeshortened in two views.", { kind: "diagnostic", preset: "views", engagement: "selective-lm" }, [std("c-cov", "viewCoverage.missing", "==", 0, "Segments not seen")], 180),
    "vessel-misid": t("vessel-misid", "diag-report", "Name each vessel on a run you acquire.", { kind: "diagnostic", preset: "views", engagement: "selective-lm" }, [], 120),
    "excess-fluoro": t("excess-fluoro", "diag-study", "Complete the left system within a tight fluoroscopy budget.", { kind: "diagnostic", preset: "left", budget: { fluoroS: 90 } }, [std("c-fl", "fluoroS", "<=", 90, "Fluoroscopy time")], 180),
    "excess-contrast": t("excess-contrast", "diag-study", "Complete the left system within a tight contrast budget.", { kind: "diagnostic", preset: "left", budget: { contrastMl: 30 } }, [std("c-ct", "contrastMl", "<=", 30, "Contrast")], 180),
    "ignored-pressure-warning": t("ignored-pressure-warning", "rca-engage", "Watch the trace while you work; act the moment it changes.", { kind: "diagnostic", preset: "damping", caseId: "easy-rca-0", engagement: "selective-rca" }, [std("c-dmp", "injectWhileDamped", "==", 0, "Injections on a damped trace")]),
    "catheter-changed-early": t("catheter-changed-early", "lca-engage", "Give the catheter on the table a systematic try before changing.", { kind: "diagnostic", preset: "left", engagement: "non-selective" }, [std("c-ch", "catheterChanges.total", "==", 0, "Catheter changes"), std("c-sel", "timeToSelectiveS.left", "<=", 120, "Time to selective")], 150),
    "catheter-changed-late": t("catheter-changed-late", "rca-engage", "This catheter cannot reach. Recognise it within a few attempts.", { kind: "diagnostic", preset: "high-rca", catheterId: "JR4", engagement: "non-selective" }, [std("c-fail", "failedAttempts.right", "<=", 3, "Failed approaches before changing")], 150),
    "lv-injection": t("lv-injection", "lca-engage", "The tip has just crossed the valve. Read the trace before you inject.", { kind: "diagnostic", preset: "lv-trap", engagement: "in-lv" }, [std("c-lvinj", "lvInjections", "==", 0, "LV injections")], 90),
    dissection: t("dissection", "lca-engage", "A seated catheter is under load. Engage gently and stop at resistance.", { kind: "diagnostic", preset: "left-main", caseId: "left-main-lesion-0", engagement: "near-lm" }, [std("c-push", "pushingEpisodes", "==", 0, "Pushing episodes")]),
    "air-embolism": t("air-embolism", "rca-engage", "You are seated against the wall. Aspirate before every injection.", { kind: "diagnostic", preset: "damping", caseId: "rca-damping-0", engagement: "selective-rca" }, [std("c-asp", "aspirateCompliance", ">=", 1, "Injections with a clean aspirate")], 90),
    "vf-arrest": t("vf-arrest", "rca-engage", "The tip is in the conus. Recognise it and drop onto the RCA ostium.", { kind: "diagnostic", preset: "rca", caseId: "easy-rca-0", catheterId: "JR4", engagement: "selective-rca", conus: true }, [std("c-dmp", "injectWhileDamped", "==", 0, "Injections on a damped trace")], 90),
    "no-aspirate": t("no-aspirate", "lca-engage", "Seat, look, aspirate, inject: every time.", { kind: "diagnostic", preset: "left", engagement: "selective-lm" }, [std("c-asp", "aspirateCompliance", ">=", 1, "Injections with a clean aspirate")], 90),
  };
}

/** PCI micro-scenarios (not tied to a MistakeCode; ids are `pci:<name>`). */
export const PCI_CARD_TEMPLATES: { id: string; title: string; brief: string; start: PciStart; durationS: number; passRule: PassingStandard[] }[] = [
  { id: "pci:wire-in-septal", title: "Wire out of a septal", brief: "The wire is in the first septal. Get back into the LAD and down to the apex.", start: { kind: "pci", scenario: "lad-focal", wireIn: "S1" }, durationS: 90, passRule: [NO_CRIT, std("p-sep", "septalEntries", "<=", 1, "Septal entries")] },
  { id: "pci:oversized-balloon", title: "Oversized balloon loaded", brief: "A balloon bigger than the vessel is on the wire. Decide where it may be inflated.", start: { kind: "pci", scenario: "lad-focal", device: { kind: "balloon", sizeRatio: 1.3, at: "distal-normal" } }, durationS: 90, passRule: [NO_CRIT, std("p-ovr", "oversizedOutsideLesion", "==", 0, "Oversized inflations outside the lesion")] },
  { id: "pci:stent-positioning", title: "Position before deploying", brief: "A stent is near the lesion. Confirm the position and deploy.", start: { kind: "pci", scenario: "lad-focal", device: { kind: "stent", sizeRatio: 1.0, at: "lesion" } }, durationS: 120, passRule: [NO_CRIT, std("p-pos", "deployWithoutPositioningRun", "==", 0, "Deploys without a positioning run")] },
  { id: "pci:perforation", title: "Distal wire perforation", brief: "Contrast is staining beyond the wire tip. Recognise and treat.", start: { kind: "pci", scenario: "lad-focal", complication: "perforation" }, durationS: 120, passRule: [std("p-bail", "correctBailout", "==", 1, "Correct bailout")] },
];

// --- start-state search (diagnostic) ----------------------------------------------------

/**
 * Find hub controls that put the tip in the requested engagement class for a
 * case and catheter, by searching insertion and torque on the engagement model.
 * Returns null when the class cannot be reached with that catheter.
 */
export function findStartControls(c: AnatomyCase, catheterId: string, target: EngagementKind, opts: { conus?: boolean; pressure?: string; difficulty?: Difficulty } = {}): ControlState | null {
  const cath = catheterById(catheterId);
  if (!cath) return null;
  const model = buildAnatomy(c);
  const diff = opts.difficulty ?? "intermediate";
  let best: { s: ControlState; cost: number } | null = null;
  for (let ins = -12; ins <= 30; ins += 0.5) {
    for (let tq = -3; tq <= 3; tq += 0.05) {
      const s: ControlState = { ...initialControls(), insertion: ins, cmdInsertion: ins, torque: tq, cmdTorque: tq };
      const e = computeEngagement(model, cath, s, diff);
      if (e.kind !== target) continue;
      if (opts.conus !== undefined && e.conus !== opts.conus) continue;
      if (opts.pressure) {
        const p = computePressure(e, computeTip(model, cath, s), s, cath);
        if (p.kind !== opts.pressure) continue;
      }
      // prefer the smallest hub excursion (the most natural position)
      const cost = Math.abs(ins) * 0.1 + Math.abs(tq);
      if (!best || cost < best.cost) best = { s, cost };
    }
  }
  return best?.s ?? null;
}

const LEFT_SHAPES = ["JL4", "JL3.5", "JL4.5", "JL5", "AL1", "EBU3.5", "TIG"];
const RIGHT_SHAPES = ["JR4", "JR3.5", "AR", "IKR", "TIG"];

/**
 * The case, catheter and hub controls for a diagnostic card. Tries the preferred
 * catheter, then the case's acceptable catheters, then the usual shapes for the side.
 */
export function resolveDiagnosticStart(start: DiagnosticStart, c: AnatomyCase): { catheterId: string; controls: ControlState } | null {
  if (!start.engagement) {
    const id = start.catheterId ?? c.recommendedCatheters[0] ?? "JL4";
    return { catheterId: id, controls: initialControls() };
  }
  const right = start.engagement.endsWith("-rca");
  const tryList = [start.catheterId, ...c.recommendedCatheters, ...c.acceptableCatheters, ...(right ? RIGHT_SHAPES : LEFT_SHAPES)].filter((x): x is string => !!x);
  for (const id of [...new Set(tryList)]) {
    const s = findStartControls(c, id, start.engagement, { conus: start.conus, pressure: start.pressure });
    if (s) return { catheterId: id, controls: s };
  }
  return null;
}

// --- grading and scheduling -------------------------------------------------------------

export const cardId = (epa: string, code: MistakeCode): string => `${epa}:${code}`;

export function cardForCode(code: MistakeCode): { id: string; template: SkillCardTemplate } {
  const template = SKILL_CARD_TEMPLATES[code];
  return { id: cardId(template.epa, code), template };
}

/** Pass when every standard passes and the card's own error did not happen again. */
export function gradeCard(template: SkillCardTemplate, m: Metrics, mistakes: MistakeTally): { pass: boolean; reasons: string[] } {
  const ev = evaluateStandards(m, template.passRule);
  const reasons = ev.results.filter((r) => !r.missing && !r.pass).map((r) => r.standard.label);
  const recurred = (mistakes[template.code] ?? 0) > 0;
  if (recurred) reasons.push(`${MISTAKE_INFO[template.code].label} happened again`);
  return { pass: ev.passed && !recurred, reasons };
}

/** Update the card's SM-2 memory from a measured outcome. */
export function reviewCard(prev: QuizMemory | undefined, pass: boolean, today: string, now: number): QuizMemory {
  return review(prev, pass, today, now);
}

/** The result of scheduling a debrief's cards. */
export interface ScheduledCards {
  /** the review memory with every card in it, due today at the latest */
  memory: Record<string, QuizMemory>;
  /** cards that were not in the memory before */
  added: string[];
  /** cards already in the memory whose due date was brought forward to today */
  broughtForward: string[];
}

/**
 * Put the cards a debrief announced (DebriefModel.summary.cardsToSchedule) into the review memory.
 * A card not yet in the memory gets a fresh record due today; a card already there, but due later,
 * is brought forward to today (the gap recurred, so it is practised again now); a card already due
 * is left alone. No attempt, lapse or ease is recorded: only playing the card grades it. Ids that
 * are not skill-card ids ("<epa>:<code>") are ignored. Idempotent for the same day.
 */
export function scheduleCards(memory: Record<string, QuizMemory>, cardIds: readonly string[], today: string): ScheduledCards {
  const out: Record<string, QuizMemory> = { ...memory };
  const added: string[] = [];
  const broughtForward: string[] = [];
  for (const id of new Set(cardIds)) {
    if (!isSchedulableCardId(id)) continue;
    const prev = out[id];
    if (!prev) {
      out[id] = newMemory(today);
      added.push(id);
    } else if (prev.due > today) {
      out[id] = { ...prev, due: today };
      broughtForward.push(id);
    }
  }
  return { memory: added.length || broughtForward.length ? out : memory, added, broughtForward };
}

/**
 * A schedulable skill-card id: "<epa>:<code>" for a card with a template (cardForCode). PCI cards
 * ("pci:<name>") are left out because the review screen lists only templated cards, and a card that
 * is scheduled but never shown would make the debrief's announcement untrue again.
 */
export function isSchedulableCardId(id: string): boolean {
  const i = id.indexOf(":");
  if (i <= 0 || id.startsWith("skill:") || id.startsWith("angio:")) return false;
  const template = SKILL_CARD_TEMPLATES[id.slice(i + 1) as MistakeCode];
  return !!template && cardId(template.epa, template.code) === id;
}

/** Card ids among a memory map that are due (cards are ids with a ':'). */
export function dueCardIds(memory: Record<string, QuizMemory>, today: string): string[] {
  return Object.entries(memory)
    .filter(([id, m]) => id.includes(":") && m.due <= today)
    .sort((a, b) => (a[1].due === b[1].due ? b[1].lapses - a[1].lapses : a[1].due < b[1].due ? -1 : 1))
    .map(([id]) => id);
}

/** Model parameter: time constant of the mistake ledger's decay (days). */
export const LEDGER_TAU_DAYS = 14;

/** Σ exp(−Δdays/τ) over occurrence times (epoch ms). */
export function decayedWeight(timestamps: number[], now: number, tauDays = LEDGER_TAU_DAYS): number {
  const day = 86400000;
  return timestamps.reduce((s, t) => s + Math.exp(-Math.max(0, now - t) / day / tauDays), 0);
}

/** Approximation for the existing ledger, which keeps only a count and the last time seen. */
export function approxRecordWeight(r: MistakeRecord, now: number, tauDays = LEDGER_TAU_DAYS): number {
  return r.count * Math.exp(-Math.max(0, now - r.lastSeen) / 86400000 / tauDays);
}

/** The ledger's weakest code by decayed weight (for weakestSkillPreset). */
export function weakestByDecay(ledger: Record<string, MistakeRecord>, now: number): MistakeCode | null {
  let best: { code: MistakeCode; w: number } | null = null;
  for (const r of Object.values(ledger)) {
    const w = approxRecordWeight(r, now);
    if (!best || w > best.w) best = { code: r.code, w };
  }
  return best && best.w > 0.05 ? best.code : null;
}
