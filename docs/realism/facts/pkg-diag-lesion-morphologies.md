# diag-lesion-morphologies: model parameters

Lesion morphologies drawn in the shared coronary tree (`src/render/xray/coronaryTree.ts`), collateral filling and SCAD retention in the contrast transport (`src/render/xray/contrastTransport.ts`), their appearance in the scene builder (`src/render/xray/sceneBuilder.ts`) and the morphology scenarios (`src/simulation/diagnosticScenarios/lesions.ts`).

The definitions the values draw are sourced: the SCAD types as Brilakis gives them (src/content/manual/complex-pci/12-other-complex.ts, 'Angiographic types of SCAD': 2A usually longer than 20 mm, 3 usually shorter); the TIMI thrombus grades, the Werner collateral connection grades and the Rentrop grades (src/content/manual/pci-manual/09-interpreting.ts). The sizes, speeds and strengths that draw them are model choices, made to draw the appearance the module text describes, not measured.

## Morphology (coronaryTree.ts `MORPHOLOGY`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `scadLengthMm` | src/render/xray/coronaryTree.ts | type 1: 20, 2A: 30, 2B: 0, 3: 12 | mm (default when the lesion gives none) | MODEL PARAMETER inside the sourced direction (2A longer than 20 mm, 3 shorter) |
| `scadShoulderMm` | src/render/xray/coronaryTree.ts | 1: 3, 2A: 5, 2B: 5, 3: 2.5 | mm | MODEL PARAMETER: smooth shoulders for type 2, sharper for type 3 |
| `falseLumenShare`, `flapMm` | src/render/xray/coronaryTree.ts | 0.6, 0.15 | share of the reference radius; mm | MODEL PARAMETER: SCAD type 1 false lumen and the lucent flap |
| `stumpTaperMm`, `stumpBluntMm` | src/render/xray/coronaryTree.ts | 6, 1 | mm | MODEL PARAMETER: CTO stump narrowing to the proximal cap, tapered or blunt |
| `distalCapMm`, `ctoLengthMm` | src/render/xray/coronaryTree.ts | 2, 15 | mm | MODEL PARAMETER: return to calibre beyond the occlusion; occluded length when the lesion gives none |
| `defectHalfLenD` | src/render/xray/coronaryTree.ts | grade 1: 0, 2: 0.2, 3: 0.6, 4: 1.25, 5: 1.25 | share of the reference diameter (half-length) | MODEL PARAMETER inside the sourced bands (grade 2 at most half a diameter, 3 half to two diameters, 4 two or more); grade 1 is haze only |
| `defectShare` | src/render/xray/coronaryTree.ts | 0.55 | share of the lumen radius | MODEL PARAMETER: largest filling-defect radius |
| `hazeMm`, `meniscusTailMm` | src/render/xray/coronaryTree.ts | 2, 3 | mm | MODEL PARAMETER: haze beyond the defect or before a meniscus; occluded column after a thrombotic meniscus |
| `branchOstialShare`, `branchOstialMm` | src/render/xray/coronaryTree.ts | 0.8, 4 | share of the lesion severity; mm | MODEL PARAMETER: the side-branch ostial narrowing for Medina third digit 1 |
| `branchSnap` | src/render/xray/coronaryTree.ts | 0.15 | share of the vessel | MODEL PARAMETER: a branch lesion moves to its side branch only when the branch arises within this distance |

## Collaterals (coronaryTree.ts `COLLATERAL`) and transport (contrastTransport.ts `RETRO`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `COLLATERAL.radiusMm` | src/render/xray/coronaryTree.ts | CC0 0.1, CC1 0.16, CC2 0.3 | mm (CC0 drawn interrupted) | MODEL PARAMETER drawing the Werner grades |
| `COLLATERAL.speedMmS` | src/render/xray/coronaryTree.ts | 30, 45, 60 by Werner grade | mm/s | MODEL PARAMETER: thin channels carry little flow |
| `COLLATERAL.gain` | src/render/xray/coronaryTree.ts | 0.25, 0.4, 0.5 by Werner grade | share of the donor's ostial strength | MODEL PARAMETER: peak strength of the recipient's filling |
| `COLLATERAL.turns`, `ampDeg` | src/render/xray/coronaryTree.ts | turns [1, 2], [3, 5], [7, 10]; amplitude 1, 3, 5 by tortuosity grade | turns; degrees of phi | MODEL PARAMETER: the channel's meander |
| `COLLATERAL.septalDepthMm`, `epicardialDepthMm` | src/render/xray/coronaryTree.ts | 14, 3 | mm below the epicardium | MODEL PARAMETER |
| `COLLATERAL.rentrop2DistalShare` | src/render/xray/coronaryTree.ts | 0.5 | share of the occluded vessel | MODEL PARAMETER: Rentrop 2 fills only the distal share beyond the cap |
| `COLLATERAL.autoGain` | src/render/xray/coronaryTree.ts | 0.3 | share | MODEL PARAMETER: the automatic channels of a CTO without its own description keep the earlier model's look |
| `RETRO` | src/render/xray/contrastTransport.ts | spreadMmS 80, sigma0 0.25, kappa 0.12, retentionTauS 2.5 | mm/s; s; per s of lag; s | MODEL PARAMETER: retrograde spread through the recipient bed, dispersion of the delayed copy (sigma = sigma0 + kappa x lag), and SCAD false-lumen exchange time constant |

## Appearance (sceneBuilder.ts `VESSEL_PROFILE`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `VESSEL_PROFILE.thrombusHaze` | src/render/xray/sceneBuilder.ts | 0.12 | share of the lumen's iodine | MODEL PARAMETER: Brilakis's 'haziness' around a thrombus, drawn, not measured |
| `VESSEL_PROFILE.falseLumenGain` | src/render/xray/sceneBuilder.ts | 0.8 | share of the lumen's strength | MODEL PARAMETER: retained contrast in a SCAD type 1 false lumen |

## Scenarios (diagnosticScenarios/lesions.ts)

The seven scenarios' chart values (age, size, renal function, echo, drugs) and lesion values (position, severity, eccentricity, lengths, channel grades) are scenario data written for this app, not sourced facts, as the file's header says. For example `diag-eccentric-orthogonal` has an LAD lesion at 0.3 of the vessel, 72%, 10 mm, eccentricity 0.6; `diag-cto-contralateral-collaterals` an RCA occlusion at 0.3, tapered stump, 25 mm, with septal (LAD to PDA) and epicardial (LCx to PLV) channels at Werner CC1, Rentrop 3.
