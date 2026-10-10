import type { ControlTab } from "../../types";

// Test fixture (controls.test.ts): a tab that hides itself in exams.

export const tab: ControlTab = {
  id: "fixture-not-exam",
  label: "Fixture practice tab",
  order: 60,
  labs: ["diagnostic"],
  visible: (_target, policy) => policy.mode !== "exam",
  Component: () => <span>Fixture practice body</span>,
};
