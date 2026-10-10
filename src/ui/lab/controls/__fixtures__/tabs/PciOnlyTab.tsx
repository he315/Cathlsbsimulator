import type { ControlTab } from "../../types";

// Test fixture (controls.test.ts): a tab for the PCI lab only.

export const tab: ControlTab = {
  id: "fixture-pci",
  label: "Fixture PCI tab",
  order: 50,
  labs: ["pci"],
  Component: () => <span>Fixture PCI body</span>,
};
