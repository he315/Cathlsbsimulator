# diag-lv-aorta-render: model parameters

The left ventriculogram, aortogram and iliofemoral run (`src/render/xray/lvGram.ts`) and the regional wall motion they draw (`src/render/xray/heartMotion.ts`). The class names (normal, hypokinetic, akinetic, dyskinetic; the RAO and LAO segments; Oxford grades I-IV of regurgitation; Sellers' scheme) are the module's. The numbers that draw them are MODEL PARAMETERS chosen so that each appearance is distinct by eye and the compartment model gives the module text's densities; lvGram.test.ts checks the volumes, the views and the regurgitation densities. Sourced: the long-axis shortening is the mean of the lateral and septal MAPSE of `DEFAULT_AMPLITUDES` (Ochs 2017, in heartMotion.ts).

## Wall motion (heartMotion.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `WALL_MOTION_SCALE` | src/render/xray/heartMotion.ts | normal 1, hypokinetic 0.45, akinetic 0, dyskinetic -0.3 | share of the normal inward excursion | MODEL PARAMETERS: each class distinct by eye on a cine run, not measured |
| `LV_ENDOCARDIUM.radialShortening` | src/render/xray/heartMotion.ts | 0.33 | share of the end-diastolic cavity radius | MODEL PARAMETER: with the long-axis shortening gives the nominal cavity an ejection fraction of about 60%; not a measured fractional shortening |
| `LV_ENDOCARDIUM.longShortenMm` | src/render/xray/heartMotion.ts | mean of `DEFAULT_AMPLITUDES.mapseLateral` and `mapseSeptal` | mm | The sourced MAPSE values (Ochs 2017) |
| `LV_ENDOCARDIUM.apexExcursionMm` | src/render/xray/heartMotion.ts | 6 | mm for a scale of 1 | MODEL PARAMETER: axial excursion of the apical endocardium |

## Cavity and compartment model (lvGram.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `WALL_PHI` | src/render/xray/lvGram.ts | anterior 45, posterolateral 135, inferior -135, septal -45 | degrees round the long axis | MODEL PARAMETER: turned 45 degrees from the heart's anterior axis so RAO 30 profiles the anterior and inferior walls and LAO 60 cranial 20 the septal and posterolateral |
| `BASE_NARROWING` | src/render/xray/lvGram.ts | 0.38 | share of the mid-cavity radius | MODEL PARAMETER: the cavity meets the narrower mitral annulus, blended over the basal 30% |
| `APICAL_FROM` | src/render/xray/lvGram.ts | 0.62 | share of the cavity length from the base (blend 0.2) | MODEL PARAMETER: where the apical segment begins |
| `LV_CAVITY` | src/render/xray/lvGram.ts | radiusShare 0.6, apexWallMm 8, slices 28, lvotRadiusMm 10, mixTauS 0.3, laWallMm 2, laaShare 0.7 | share; mm; count; mm; s; mm; share | MODEL PARAMETERS: an end-diastolic cavity of about 52 x 54 mm on the nominal heart |
| `LV_PUFF` | src/render/xray/lvGram.ts | conc 0.5, elong 1.6, minMl 2, maxCavityShare 0.3, minU 0.12, maxU 0.8, midU 0.45, drawMl 0.01; shells [1, 0.5], [1.4, 0.3], [1.9, 0.2] | shares; mL; fractions of length | MODEL PARAMETERS: the unmixed injection drawn as a dense, soft-edged cloud at the tip |
| `MR_GRADES` | src/render/xray/lvGram.ts | rf 0.06, 0.25, 0.42, 0.55 (grades 1-4); LA scale 1, 1, 1.05, 1.08; LV scale 1, 1.04, 1.1, 1.16 | regurgitant share of the stroke; radius scales | MODEL PARAMETERS chosen so the compartment model gives the module's densities in RAO 30 (grade I clears each beat; grade III reaches the reference chamber's density) |
| `AR_GRADES` | src/render/xray/lvGram.ts | rf 0.08, 0.25, 0.45, 0.6; LV scale 1, 1.05, 1.12, 1.2 | as above | MODEL PARAMETERS, the same fit in LAO |
| `LV_CIRCULATION` | src/render/xray/lvGram.ts | aortaMl 110, rvMl 120, laConduit 0.3, ectopicRegurg 2, stainPerMl 0.08, stainTauS 240, takoBase 1.25, takoApex -0.3 | mL; share; factor; per mL; s; excursion scales | MODEL PARAMETERS: mixing volumes, conduit flow, an ectopic beat's doubled regurgitation, the wall stain, the takotsubo base and apex |
| Apical thrombus, VSD shunt defaults | src/render/xray/lvGram.ts | thrombus 16 mm long; shunt 0.25 of LV ejection (at most 0.6) | mm; share | MODEL PARAMETERS (spec defaults) |
| `rvCavity` | src/render/xray/lvGram.ts | centre 30 mm right of the RV ellipsoid's centre and 2 mm posterior; half sizes 0.45 of the heart length, 30 and 12 mm; free wall in by 25% at end-systole | mm; share | MODEL PARAMETERS: about 10 mm of septum between it and the LV cavity |
| `regionScale` | src/render/xray/lvGram.ts | 1 - 1.15 x loss; transmural necrosis above 0.85 bulges to at most -0.3 | excursion scale | MODEL PARAMETERS: ischaemic myocardium stops contracting, necrosis bulges |
| Apical blend of regions | src/render/xray/lvGram.ts | 0.6-0.9 of the length | fraction | MODEL PARAMETERS: a region pointing to the apex counts for the apical segment |
| `CAVITY_DRAW` | src/render/xray/lvGram.ts | sampleMm 1.25, endOnSin 0.5, minSamples 24, maxSamples 160 | mm; sine; counts | MODEL PARAMETERS of the drawing |
| `CAVITY_GUIDE_R` | src/render/xray/lvGram.ts | 0.05 | mm | Drawing setting: the zero-iodine guide tube that keeps every sample |

## Aortogram and iliofemoral run (lvGram.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `AORTA_PATH` | src/render/xray/lvGram.ts | 11 points from (0, 20, 0) radius 15 to (24, -60, -80) radius 11 | mm, aortic frame | MODEL PARAMETERS following the thorax's aorta |
| Descending aorta dilution | src/render/xray/lvGram.ts | up to 35% less iodine | share | MODEL PARAMETER |
| `ARCH_BRANCHES` | src/render/xray/lvGram.ts | brachiocephalic radius 6, left common carotid 3.8, left subclavian 5 (tapering 10% per point) | mm | MODEL PARAMETERS; iodine 0.85 of the aorta's |
| Graft stumps | src/render/xray/lvGram.ts | up to 3 on the anterior ascending aorta, 11 mm apart, radius 2.2 to 1.6 mm, a marker ring radius 3.1 mm | mm | MODEL PARAMETERS |
| `ANOMALOUS_CX` | src/render/xray/lvGram.ts | 6 points from (-12, 6, 2) to (36, -4, -34) | mm | MODEL PARAMETERS: the retro-aortic course, its middle part along the RAO 30 viewing direction so it is seen end-on (the 'dot' sign) |
| `ILIOFEMORAL` | src/render/xray/lvGram.ts | radii aorta 9, common iliac 5, external iliac 4, common femoral 4; femoral head radius 24; flowMlS 25; speedMmS 250 | mm; mL/s; mm/s | MODEL PARAMETERS, not a measured pelvis |
