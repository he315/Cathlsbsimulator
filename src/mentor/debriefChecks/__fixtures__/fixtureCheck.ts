// Test fixture for the debrief check registry (registries.test.ts): a check
// file as a package would add it under src/mentor/debriefChecks/.
import type { CheckGap, DebriefInput } from "../../debrief";

export const id = "fixture-wrong-decision";
export const order = 10;

/** One gap per decision that did not match, linked to its lesson. */
export function check(input: DebriefInput): CheckGap[] {
  return (input.decisions ?? [])
    .filter((d) => !d.correct)
    .map((d) => ({
      id: `fixture-${d.id}`,
      title: `Fixture: ${d.label}`,
      severity: "safety" as const,
      tWall: d.t,
      teaching: `Fixture teaching: the expected answer was ${d.expected}.`,
      lessonId: d.lessonId,
      takeHome: "Fixture: next time I will check the decision against the plan.",
    }));
}
