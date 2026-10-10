import type { ControlTab, ControlTabProps } from "../../types";

// Test fixture (controls.test.ts): a tab added as one file, with no other file edited.

function Fixture({ target, kit: { Hold } }: ControlTabProps) {
  return (
    <div>
      <span>Fixture tab body for the {target.controlsLab} lab</span>
      <Hold onStart={() => target.holdBreath(true)} onStop={() => target.holdBreath(false)}>
        Fixture hold
      </Hold>
    </div>
  );
}

export const tab: ControlTab = {
  id: "fixture",
  label: "Fixture tab",
  order: 25,
  labs: ["diagnostic"],
  Component: Fixture,
};
