// PCI in the cath lab: wire, prepare, stent and optimise a lesion under fluoroscopy and cine, on the
// physically based X-ray renderer. The lab itself is src/ui/pci/PciLab.tsx on the full-screen lab shell
// (pci-lab-shell-session); this section renders it, and re-exports the device drawing and the live flow
// conditions from src/ui/pci/pciDevicesRender.ts so that the segments demo and the realism-baseline
// device captures (src/dev/xrayCapture.ts) keep importing them from here.
import PciLab from "../pci/PciLab";
import type { PciHandover } from "../pci/PciLabSession";

export { pciDevices, pciFlowMods, NO_REFLOW_SCALE } from "../pci/pciDevicesRender";
export type { PciHandover } from "../pci/PciLabSession";

export default function AngioPci({ handover = null }: { handover?: PciHandover | null } = {}) {
  return (
    <div className="h-full min-h-0">
      <PciLab handover={handover} />
    </div>
  );
}
