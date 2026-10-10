import type {
  DailySession,
  DrillPlan,
  TrainingIntensity,
  MistakeRecord,
  DrillKind,
} from "../types";
import { phaseForDay, INTENSITY_MINUTES } from "../data/curriculum";

interface DrillSpec {
  kind: DrillKind;
  title: (phaseFocus: string) => string;
  weight: number;
  target: string;
  section: DrillPlan["section"];
  minPhase?: number;
}

const BASE_DRILLS: DrillSpec[] = [
  { kind: "anatomy-warmup", title: () => "Anatomy warm-up: root, cusps and ostia", weight: 1, target: "Spatial orientation", section: "anatomy" },
  { kind: "wire-catheter", title: () => "Wire & catheter handling", weight: 1, target: "Push / pull / torque", section: "catheter-lab" },
  { kind: "engagement", title: () => "Engagement drill", weight: 2.2, target: "Coaxial selective engagement", section: "free" },
  { kind: "view", title: () => "Fluoroscopy view trainer", weight: 1.4, target: "Projection selection", section: "view-trainer", minPhase: 2 },
  { kind: "pressure-safety", title: () => "Pressure & safety trainer", weight: 1.4, target: "Damping & LV recognition", section: "pressure-trainer" },
  { kind: "case", title: () => "Case simulation", weight: 2, target: "Complete diagnostic study", section: "cases", minPhase: 3 },
  { kind: "pathology", title: () => "Pathology recognition", weight: 1, target: "Lesion & view adequacy", section: "pathology", minPhase: 6 },
  { kind: "reflection", title: () => "Reflection & mistake review", weight: 0.8, target: "Coach feedback", section: "mistakes" },
  { kind: "challenge", title: () => "Daily challenge", weight: 1, target: "No-hint case", section: "challenge", minPhase: 4 },
];

function adaptiveInserts(mistakes: Record<string, MistakeRecord>): {
  drills: DrillSpec[];
  note: string;
} {
  const drills: DrillSpec[] = [];
  const notes: string[] = [];
  const count = (code: string) => mistakes[code]?.count ?? 0;

  if (count("lv-entry") + count("lv-injection") >= 3) {
    drills.push({ kind: "pressure-safety", title: () => "PRIORITY: root-level & LV-entry drill", weight: 2, target: "Stop at the sinus level", section: "pressure-trainer" });
    notes.push("Repeated LV entries: extra root-level work assigned.");
  }
  if (count("damped-injection") + count("deep-engagement") >= 2) {
    drills.push({ kind: "pressure-safety", title: () => "PRIORITY: damping recognition drill", weight: 1.6, target: "Read pressure before injecting", section: "pressure-trainer" });
    notes.push("Damping or deep engagement pattern: pressure-safety emphasis added.");
  }
  if (count("non-selective-injection") >= 2) {
    drills.push({ kind: "engagement", title: () => "PRIORITY: selective engagement drill", weight: 1.6, target: "Seat before injecting", section: "free" });
    notes.push("Non-selective injections: selective-engagement drill added.");
  }
  if (count("wrong-catheter") >= 2) {
    drills.push({ kind: "wire-catheter", title: () => "PRIORITY: catheter and root matching quiz", weight: 1.2, target: "Match curve to root", section: "catheter-lab" });
    notes.push("Catheter selection errors: catheter lab quiz added.");
  }
  if (count("poor-view") + count("vessel-misid") >= 2) {
    drills.push({ kind: "view", title: () => "PRIORITY: projection trainer", weight: 1.4, target: "View selection", section: "view-trainer" });
    notes.push("View or identification errors: projection trainer emphasis added.");
  }
  if (count("excess-contrast") + count("excess-fluoro") >= 2) {
    drills.push({ kind: "challenge", title: () => "PRIORITY: efficiency challenge", weight: 1, target: "Contrast & fluoro limits", section: "challenge" });
    notes.push("Efficiency drift: a limited contrast and fluoroscopy challenge added.");
  }

  return {
    drills,
    note: notes.length
      ? notes.join(" ")
      : "No dominant weakness detected: standard progression.",
  };
}

/**
 * Items the progression layer puts at the top of the day: spaced practice of
 * procedural skills that are due, refreshers for expired entrustment, the daily
 * challenge and the quiz review. Each carries its own minutes; the rest of the
 * day is shared among the phase drills by weight.
 */
export interface DailyPriority extends DrillPlan {
  /** why it is on the plan (shown under the title) */
  reason?: string;
}

export function generateDailySession(
  day: number,
  intensity: TrainingIntensity,
  mistakes: Record<string, MistakeRecord> = {},
  priority: DailyPriority[] = []
): DailySession {
  const phase = phaseForDay(day);
  const budget = INTENSITY_MINUTES[intensity];
  const fixed = priority.reduce((a, p) => a + p.minutes, 0);
  const totalMinutes = Math.max(budget - fixed, Math.round(budget / 3));

  const inserts = adaptiveInserts(mistakes);
  const specs = [
    ...BASE_DRILLS.filter((d) => !d.minPhase || phase.id >= d.minPhase),
    ...inserts.drills,
  ];

  const weightSum = specs.reduce((a, b) => a + b.weight, 0);
  const base: DrillPlan[] = specs.map((s) => ({
    kind: s.kind,
    title: s.title(phase.focus),
    minutes: Math.max(5, Math.round((s.weight / weightSum) * totalMinutes)),
    target: s.target,
    section: s.section,
  }));
  const drills: DrillPlan[] = [...priority.map(({ reason, ...d }) => ({ ...d, target: reason ? `${d.target} · ${reason}` : d.target })), ...base];

  return {
    day,
    phase,
    title: `Day ${day}: ${phase.name}`,
    drills,
    totalMinutes: drills.reduce((a, b) => a + b.minutes, 0),
    adaptiveNote: inserts.note,
  };
}
