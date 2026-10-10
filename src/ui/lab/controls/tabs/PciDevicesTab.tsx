import type { ReactNode } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";

// The PCI lab's devices (pci-lab-shell-session): the device consoles the lab offers in its mode
// (discovered by glob from src/ui/pci/consoles/), one open at a time. The PCI lab provides them as the
// 'pciDevices' capability, so this tab imports nothing of the PCI lab and the diagnostic lab's chunk
// stays free of it. Opening a console is an interruption the PCI session's recorder counts.

/** What the PCI lab offers this tab: its consoles, the one open, and how to show it. */
export interface PciDevicesCapability {
  consoles(): readonly { id: string; label: string }[];
  openId(): string | null;
  open(id: string): void;
  close(): void;
  /** the open console's controls */
  render(id: string): ReactNode;
}

declare module "../types" {
  interface LabCapabilities {
    /** the PCI lab's device consoles (PciDevicesTab) */
    pciDevices: PciDevicesCapability;
  }
}

function PciDevices({ target }: ControlTabProps) {
  const cap = target.capability("pciDevices");
  if (!cap) return <div className="text-[12px] text-ink-faint">No device consoles in this lab.</div>;
  const list = cap.consoles();
  const open = cap.openId();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Device consoles">
        {list.map((c) => (
          <button key={c.id} className={`btn h-7 px-2 text-[12px] ${open === c.id ? "!border-accent !text-ink" : ""}`} aria-pressed={open === c.id} onClick={() => (open === c.id ? cap.close() : cap.open(c.id))}>
            {c.label}
          </button>
        ))}
      </div>
      {open ? cap.render(open) : <div className="text-[12px] text-ink-faint">Open a console for the guide, the wire and the devices. The keys move the wire and the device without one.</div>}
    </div>
  );
}

export const tab: ControlTab = {
  id: "pci-devices",
  label: "Devices",
  // first in the PCI lab's strip (the core tabs use 10 to 40)
  order: 5,
  labs: ["pci"],
  // only where the lab provides its consoles (a bare target without capabilities shows nothing)
  visible: (t: LabControlsTarget) => typeof t.capability === "function" && t.capability("pciDevices") !== null,
  Component: PciDevices,
};
