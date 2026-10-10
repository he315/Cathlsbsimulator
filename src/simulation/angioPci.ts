// ---------------------------------------------------------------------------
// Angiographic PCI: the procedure state that ties the PCI engines together on
// the same coronary tree the X-ray renderer draws.
//
// - The coronary wire (pci/coronaryWire.ts): shaped tip, torque with lag and
//   whip, 3D branch entry, prolapse, lesion resistance by wire type,
//   subintimal tracking, distal danger zone.
// - The guide and the equipment workflow (pci/guide.ts, pci/equipment.ts):
//   guide choice and back-up, box label, preparation, backloading, the
//   haemostatic valve, delivery against the guide's back-up, wire drag when it
//   is not pinned, guide extension and buddy wire.
// - The indeflator (pci/indeflator.ts): screw rate, pressure dial, inflation
//   and deflation times, burst pressures, melon-seeding.
// - Procedural stents (pci/stentGeometry.ts): rings and struts with
//   expansion, malapposition, foreshortening, overlap and compression.
// - Pressure wire and IVUS on the same anatomy (pci/pressureWire.ts,
//   pci/ivus.ts).
// - The physical complication engine (complications/engine.ts) with
//   prodromes, progression and bail-outs, fed to the S9 patient engine
//   through pciPatientEffects().
// - Lesion assessment, sizing and ACT (pci/lesionAssessment.ts) and a
//   metric debrief (no checklist score).
//
// The lesion response to dilatation remains a teaching model (calcium
// resistance, recoil, modification by scoring and lithotripsy); device
// diameters come from the compliance charts in equipment.ts.
//
// The public functions are pure: (state, inputs) → new state.
//
// This file is a stable facade. The state, its types and the shared helpers
// live in pci/state.ts; each engine area is an action module in
// pci/actions/ (wire, guide, devices, inflation, drugs, pressure, imaging,
// assessment, step, patient, bailouts, debrief, scenario). Every public
// export of an action module reaches this facade through `export *`; a
// helper an action module shares with another is placed in that module's
// default export, which `export *` does not re-export. From pci/state.ts only
// the public symbols are re-exported, by name. pci/facade.test.ts freezes the
// runtime export list.
// ---------------------------------------------------------------------------

export type { WireKind, BalloonKind } from "./pci/equipment";
export type { TipShape } from "./pci/coronaryWire";
export type { RngState } from "./pci/rng";

export {
  initialPci,
  lesionNow,
  pciGeom,
  routeEndMm,
  routeSamples,
  sampleAtMm,
  takeOffAngle,
  type Device,
  type DeviceKind,
  type DeviceStage,
  type InitOptions,
  type PciEvent,
  type PciGeom,
  type PciScenario,
  type PciState,
  type PciTelemetry,
  type Placed,
} from "./pci/state";

export * from "./pci/actions/scenario";
export * from "./pci/actions/wire";
export * from "./pci/actions/guide";
export * from "./pci/actions/devices";
export * from "./pci/actions/inflation";
export * from "./pci/actions/drugs";
export * from "./pci/actions/pressure";
export * from "./pci/actions/imaging";
export * from "./pci/actions/assessment";
export * from "./pci/actions/step";
export * from "./pci/actions/patient";
export * from "./pci/actions/bailouts";
export * from "./pci/actions/debrief";
