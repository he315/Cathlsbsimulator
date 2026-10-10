// Test fixture for the rule registry (registries.test.ts): a rule group file
// as a package would add it under src/mentor/rules/. Not globbed by the app.
import type { MentorRule } from "../../rules";

export const order = 150;

export const rules: MentorRule[] = [
  {
    id: "fixture-heavy-hand",
    title: "Fixture: very high felt resistance",
    severity: "technique",
    phase: "engage",
    lab: "any",
    when: (c) => c.resistance > 0.95,
    persistS: 0.5,
    stopOn: (a, c) => a === "power-inject" && c.resistance > 0.95,
    anchor: "hub",
    cooldownS: 10,
    lines: {
      1: () => "Fixture: what are you feeling at the hub?",
      2: () => "Fixture: that is a lot of resistance.",
    },
  },
];
