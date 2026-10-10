# pci-bench-imaging-unify: model parameters

One frame generator for the IVUS and OCT bench and the PCI lab (`src/simulation/pci/ivus.ts`), one criteria function (`src/simulation/imaging/criteria.ts`), one renderer (`src/ui/imaging/IntravascularView.tsx`), the bench images and a new teaching lesion (`src/simulation/pciBench.ts`) and the bench tip context (`src/ui/lab/benchTips.ts`).

Sourced values carry their location in the code and are not repeated: the optimisation criteria (`EXPANSION_MIN_PCT` 80%, `MSA_MIN_MM2` IVUS 5.5 and OCT 4.5 mm², `MSA_MIN_LM_MM2` distal 7 and proximal 8 mm², `MALAPPOSITION_MAX_MM` 0.4 mm, `EDGE_PB_MAX` 0.5; docs/SIM_FACTS.md §12 and §13); the vessel size and length classes in benchTips.ts (`SMALL_VESSEL_MM` 2.5 mm, `LARGE_VESSEL_MM` 4.0 mm, `LONG_LESION_MM` 20 mm; cp-other-complex-vessel-size, Brilakis, and cp-other-complex-long-lesions, Oxford Table 8.2 and Brilakis 7.1); the tissue penetration ranges that `MP_PENETRATION_MM` sits inside (Oxford, src/content/manual/pci-manual/15-imaging.ts). The bench balloon and stent pressures (`BALLOON_SPEC`, `STENT_SPEC`) are now read from the device catalogue at 3.0 mm (`SPEC_REF_D`), so they are equipment.ts values (docs/realism/facts/pci-equipment.md), not new numbers.

## Frames (ivus.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_CALCIUM_THICKNESS` | src/simulation/pci/ivus.ts | grade 0: 0, 1: 0.4, 2: 0.8 | mm | MODEL PARAMETER: calcium thickness for OCT frames of the PCI lab's graded lesions |
| `MP_LIPID_ARC_DEG` | src/simulation/pci/ivus.ts | 2.4 rad in degrees (about 137.5) | degrees | MODEL PARAMETER: arc of the PCI lab's lipid pool, ±1.2 rad as before |
| `MP_CALCIUM_DEPTH` | src/simulation/pci/ivus.ts | 0.25 | fraction of the plaque thickness | MODEL PARAMETER: depth of the calcium's leading edge within the plaque |
| `MP_PENETRATION_MM` | src/simulation/pci/ivus.ts | IVUS 5, OCT 2.5 | mm beyond the lumen | MODEL PARAMETER inside the module's ranges (IVUS 4-8 mm, OCT 2-3.5 mm; Oxford, 15-imaging.ts) |
| `MP_IVUS_EEM_HIDDEN_ARC_DEG` | src/simulation/pci/ivus.ts | 180 | degrees of calcium arc | MODEL PARAMETER: the module teaches that IVUS shows only calcium's leading edge and its shadow but gives no arc at which the EEM cannot be traced, so the bench takes more than half the circumference |

## Bench images and lesion (pciBench.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_BENCH_FLAP_ARC` | src/simulation/pciBench.ts | minor 70, major 150 | degrees | MODEL PARAMETER: dissection flap arc by severity |
| `MP_BENCH_FLAP_MM` | src/simulation/pciBench.ts | 3 | mm beside a stent edge | MODEL PARAMETER: dissection flap length |
| `MP_BENCH_PLAQUE_ANGLE` | src/simulation/pciBench.ts | -30° (as radians) | rad | MODEL PARAMETER: the plaque's thickest part towards the upper right |
| `MP_BENCH_WIRE_ANGLE` | src/simulation/pciBench.ts | 150° (as radians) | rad | MODEL PARAMETER: where the imaging wire lies in the frame |
| `MP_BENCH_LCX_OSTIUM` | src/simulation/pciBench.ts | atMm 10, angle 100° (as radians), diameterMm 3.5 | mm; rad; mm | MODEL PARAMETER: the circumflex ostium of the distal left main lesion |
| `small-diagonal` lesion (`BENCH_LESIONS`) | src/simulation/pciBench.ts | segment 30 mm; EEM 3.2 mm proximal, 2.8 mm distal; lesion 11-21 mm; plaque burden 0.8 at the lesion, 0.5 at the shoulders (2 mm), 0.3 background; fibrous | mm; fraction | MODEL PARAMETERS of the teaching lesion, chosen so the distal reference lumen is under 2.5 mm (Brilakis 22.3's small vessel, cp-other-complex-vessel-size) with an EEM larger than the lumen |

## Renderer (IntravascularView.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Drawn fibrous cap | src/ui/imaging/IntravascularView.tsx | 80 when the scenario states no cap (`lip.capUm ?? 80`), at least 0.04 mm | µm | A drawing value, not a measurement (labelled so in the code) |
| `R_FIELD` | src/ui/imaging/IntravascularView.tsx | 148 | SVG units | Drawing setting: the radius of the image field |
