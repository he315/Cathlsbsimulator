// Test fixture for the debrief section registry (registries.test.ts): a
// section file as a package would add it under src/ui/mentor/debrief/.
import type { DebriefSection, DebriefSectionProps } from "../index";

function FixtureBody({ model }: DebriefSectionProps) {
  return <p>Fixture section body with {model.analysis.gaps.length} gaps</p>;
}

export const section: DebriefSection = {
  id: "fixture-reflection",
  label: "Fixture tab",
  order: 50,
  applies: ({ model }) => model.analysis.gaps.length > 0,
  Component: FixtureBody,
};
