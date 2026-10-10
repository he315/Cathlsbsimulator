import type {
  MistakeCode,
  MistakeRecord,
  ScoreState,
  SimEvent,
  SectionId,
} from "../types";
import { MISTAKE_INFO } from "../data/teachingText";

export interface CoachInsight {
  headline: string;
  detail: string;
  dominantMistake: MistakeCode | null;
  recommendation: { text: string; section: SectionId } | null;
  positives: string[];
}

// End-of-case coaching from the events + score of a single attempt.
export function coachCase(events: SimEvent[], score: ScoreState): CoachInsight {
  const counts = new Map<MistakeCode, number>();
  for (const e of events) {
    if (e.code in MISTAKE_INFO) {
      const c = e.code as MistakeCode;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }

  const positives: string[] = [];
  if (score.dangerousInjections === 0)
    positives.push("No dangerous injections — you respected the pressure trace.");
  if (score.lvEntries === 0)
    positives.push("You never crossed the valve plane into the LV.");
  if (score.selectiveInjections > 0)
    positives.push(`${score.selectiveInjections} selective injection(s) achieved.`);
  if (score.diagnosticInjections >= 2)
    positives.push("You obtained diagnostic-quality runs.");
  if (events.some((e) => e.code === "engaged"))
    positives.push("Successful selective engagement recorded.");

  let dominant: MistakeCode | null = null;
  let max = 0;
  for (const [k, v] of counts) {
    if (v > max) {
      max = v;
      dominant = k;
    }
  }

  if (!dominant) {
    return {
      headline: "Clean run.",
      detail:
        "No repeated errors this case. Push into harder anatomy or reduce your contrast and fluoroscopy further.",
      dominantMistake: null,
      recommendation: null,
      positives,
    };
  }

  const info = MISTAKE_INFO[dominant];
  return {
    headline: `Your dominant error this case was: ${info.label.toLowerCase()}.`,
    detail: `${info.explain} It occurred ${max} time(s). ${coachSpecific(dominant)}`,
    dominantMistake: dominant,
    recommendation: { text: info.drill, section: info.drillSection },
    positives,
  };
}

function coachSpecific(code: MistakeCode): string {
  switch (code) {
    case "too-much-pushing":
      return "You are trying to solve an alignment problem with forward pressure. Withdraw to the sinus level and use small torque instead.";
    case "lv-entry":
      return "Each time, the tip was below the valve plane. The correct reflex is to withdraw to the root — never push.";
    case "non-selective-injection":
      return "Confirm selective engagement (and a clean pressure) before you commit contrast.";
    case "damped-injection":
      return "This is safety-critical. A damped trace means withdraw first, inject second.";
    case "dissection":
      return "You dissected a vessel by forcing the catheter against the wall. Force never seats a catheter — if it will not go, withdraw and re-approach with torque, and stop the instant you feel resistance build.";
    case "air-embolism":
      return "Aspirate to a free blood return before every injection. No return means the tip is against the wall or deeply engaged — reposition, never inject blind.";
    case "vf-arrest":
      return "You injected into the conus branch (or a damped ostial tip). Recognise conus over-selection on the pressure trace, back out onto the RCA ostium, and never force contrast into a damped position.";
    case "no-aspirate":
      return "Build the reflex: seat, aspirate, confirm a clean pressure, then inject.";
    case "wrong-catheter":
      return "Re-read the root size before you pick a curve — a mismatched catheter cannot seat.";
    case "poor-view":
      return "Match the projection to the segment: RAO/LAO cranial for the LAD, RAO caudal for the circumflex, LAO for the RCA.";
    default:
      return "Slow down and correct the position before the next injection.";
  }
}

// Longitudinal coaching from the accumulated mistake ledger.
export function coachLongitudinal(
  mistakes: Record<string, MistakeRecord>
): CoachInsight {
  const entries = Object.values(mistakes).sort((a, b) => b.count - a.count);
  if (entries.length === 0) {
    return {
      headline: "No recurring mistakes logged yet.",
      detail: "Complete a few cases and the coach will identify your dominant error pattern.",
      dominantMistake: null,
      recommendation: null,
      positives: [],
    };
  }
  const top = entries[0];
  const info = MISTAKE_INFO[top.code];
  const contexts = Array.from(new Set(top.contexts)).slice(0, 3);
  return {
    headline: `Across your training, your most frequent error is: ${info.label.toLowerCase()} (${top.count}×).`,
    detail: `${info.explain}${
      contexts.length ? ` Seen most in: ${contexts.join(", ")}.` : ""
    } ${coachSpecific(top.code)}`,
    dominantMistake: top.code,
    recommendation: { text: info.drill, section: info.drillSection },
    positives: [],
  };
}
