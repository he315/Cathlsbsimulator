# pci-scenario-registry: model parameters

The PCI scenario registry (`src/simulation/pci/scenarios/`), its start states and the 'wire across' start (`src/simulation/pci/actions/scenario.ts`). The four core scenarios' lesions (vessel, position, severity, length, calcium) were moved unchanged from the earlier `PCI_SCENARIOS` and catalogue `PCI_BASES`; they are written case data and not new here.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_START_WIRE.BEYOND_MM` | src/simulation/pci/actions/scenario.ts | 30 | mm beyond the lesion's distal shoulder | MODEL PARAMETER: where the 'wire-across' start parks the wire tip (a start-state setting, not anatomy or device data) |
| `MP_START_WIRE.MIN_MM` | src/simulation/pci/actions/scenario.ts | 5 | mm | MODEL PARAMETER: the tip is at least this far beyond the shoulder |
| `MP_START_WIRE.END_MARGIN_MM` | src/simulation/pci/actions/scenario.ts | 5 | mm | MODEL PARAMETER: the tip stays at least this far short of the wire engine's end-of-vessel danger zone |
| `MP_START_WIRE.LUMEN_MARGIN_MM` | src/simulation/pci/actions/scenario.ts | 0.5 | mm | MODEL PARAMETER: the tip sits in a lumen at least this much wider than the engine's danger diameter |
| `PciVariantAxes.calciumGrades` split | src/content/mentor/catalogue.ts (`h("ca") < 0.6`), declared in src/simulation/pci/scenarios/types.ts | first grade 60% of the time, else the second; lad-focal [0, 1] | share of ladder variants | MODEL PARAMETER (types.ts). The 60/40 split and lad-focal's none-or-moderate pair were the catalogue's earlier rule, now read from the scenario definition |
| `PciHiddenAxis.options[].weight` | src/simulation/pci/scenarios/types.ts | per pack | relative weight | MODEL PARAMETER unless a pack cites a source (the core pack sets none) |
| `PRACTICE_VARIANTS` | src/simulation/pci/scenarios/packs/core.launch.ts | 25 | ladder variants per base | App setting: how many practice variants each core scenario declares for linking; the held-out exam variants are not declared |
