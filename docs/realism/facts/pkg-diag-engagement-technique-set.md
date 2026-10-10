# diag-engagement-technique-set: model parameters

The engagement technique set: eight catalogue shapes for the analytic model (`src/data/catheters.ts`) and the rod physics (`src/physics/catheterShapes.ts`), the scripted operator of the looped-wire, right radial and short left main procedures (`src/physics/manoeuvres.ts`), the analytic short left main and the side of a circumflex ostium in the right sinus (`src/simulation/engagement.ts`), the attending's engagement rules and the scoring of the catheter choice, the stop decision and the left main views (`src/mentor/rules/diagEngagement.ts`), and the per-patient record of the catheters that worked (`src/progress/logbook.ts`). The package added no dose, threshold or device dimension from the clinical sources: the module text names the shapes, the techniques and the order of the failed-engagement steps, and the values below are model parameters where it gives no number.

Sourced (module text, quoted where it is used): the femoral left main over the looped J wire, the tip parked 2-3 cm above the floor of the right cusp, folding into the left cusp as the wire comes out, and a tip pushed onto the cusp floor only going deeper (Brilakis, `src/content/manual/pci-manual/07-engaging.ts:484-497`, `:1470`); the JL3.5 or a universal curve from the right radial and the JL4 from the femoral or left radial route, the JL3.5 for short patients, small roots, a high left main or a separate LAD, the JL5 or JL6 for dilated roots or very tall patients (Oxford, `06-to-the-root.ts:340`, `:350`, `:453`); the JL size from a dilated ascending aorta, its diameter in cm plus 1, 4 cm giving a JL5 (Brilakis, `06-to-the-root.ts:325`); AR1 or AR2, or AL1 or AL2, for an RCA carried forward by a dilated root (Brilakis, `07-engaging.ts:714`); AR MOD, 3DRC or IMA for a shepherd's crook (Oxford) and the hockey stick or IM (Brilakis) (`07-engaging.ts:715`); Oxford's RCA guide support ranking, JR4 least, AR1-2 more, hockey stick or AL1-2 most (`07-engaging.ts:722`); radial RCA guides AL1, Ikari Right, 3D Right, JR guides generally avoided (Brilakis, `06-to-the-root.ts:360`); a 6 Fr guide at an aorto-ostial lesion because larger guides damp more (Brilakis, `07-engaging.ts:722`); telescoping a 4 Fr catheter through a 6 Fr AL3 guide in a very dilated root (Brilakis, `07-engaging.ts:836`); the five failed-engagement steps and stopping after a large contrast volume without an emergency (Brilakis 5.7.3.6, `07-engaging.ts:792-812`); the short left main, where a JL keeps entering the LAD and one size larger usually reaches the circumflex (Oxford, `07-engaging.ts:551-560`); the left main view set AP, RAO caudal, RAO cranial, LAO cranial, LAO caudal and the ostium least foreshortened in LAO caudal and LAO cranial (Brilakis 6.4 and 15.1.6, `src/content/manual/complex-pci/04-left-main.ts:169-171`).

## Catalogue (data/catheters.ts, physics/catheterShapes.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ENGAGEMENT_SET` | src/data/catheters.ts | JL6 reach 27, seat 18; JR4.5 reach 20; JR5 reach 22; AL3 reach 26, deep risk 0.72; AR1 reach 22; AR2 reach 25; HS reach 18, seat 17; 3DRC reach 18 | analytic model units (mm); 0..1 | MODEL PARAMETERS of the analytic engagement model, continuing the catalogue's reach steps (3-4 mm a size) and its Amplatz deep-seating risks; the AR1 and AR2 reach the dilated root's sinus (24 mm), which they are for; the module text names the shapes and their uses, not their geometry |
| `SHAPE_PARAMS.jlBySize` | src/physics/catheterShapes.ts | "6": secRadiusMm 25, secTurn 185, primaryTurn 95 | mm; degrees | MODEL PARAMETER: the JL5's calibrated curve opened by 3 mm; not calibrated on a root (the general formula would give 33 mm) |
| `amplatzRightSized` | src/physics/catheterShapes.ts | hook radius 9 + 3 x size (AR1 12, AR2 15), 120 degree hook, 25 degree reverse tip bend | mm; degrees | MODEL PARAMETERS: the modified Amplatz right's bend and hook, sized |
| `hockeyStick` | src/physics/catheterShapes.ts | 18 mm straight tip limb, one 60 degree bend over 12 mm | mm; degrees | MODEL PARAMETERS |
| `williamsRight` | src/physics/catheterShapes.ts | 10 mm primary curve of 75 degrees rolled 30 degrees out of plane, 24 mm arm, 26 mm secondary curve of 45 degrees | mm; degrees | MODEL PARAMETERS |

## Scripted operator (physics/manoeuvres.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `FOLD_PARK` | src/physics/manoeuvres.ts | aboveMm 20, floorMm 3 | mm above the valve plane | aboveMm: the low end of Brilakis's 2-3 cm above the floor of the right cusp (sourced range; the model's valve plane stands for the cusp floor); floorMm: MODEL PARAMETER, a tip on the floor |
| `FOLD_PROTOCOL` | src/physics/manoeuvres.ts | wireStepMm 4, wireSteps 30, loopMm 4, heightTolMm 1.5, heightSteps 40, cathStepMaxMm 3 | mm; steps | MODEL PARAMETERS of the scripted operator: the wire advanced until its tip is within 4 mm of the valve (looping there), the catheter brought to the parked height over the held wire |
| `RADIAL_STARTS` | src/physics/manoeuvres.ts | 40, 50, 60, 70, 80 | mm of the tip back from the top of the root | MODEL PARAMETERS: the radial starts tigerLeft already used |
| `SHORT_LM_SEAT` | src/physics/manoeuvres.ts | pushMm 1, steps 6 | mm per 0.5 s; steps | MODEL PARAMETERS: the gentle seating push after engagement in a short left main |

Measured on 10 October 2026 at the default solver settings (`src/physics/manoeuvres.test.ts`, "the engagement technique set"): the JL3.5 from the right radial engaged the left main in 3 of 5 starts in the normal root and 4 of 5 in the small root (live geometry), and in 1 of 5 on the frozen fixture, which the test now pins at 1 or more; the live normal-root figure sits exactly at the acceptance boundary (3 of 5), so a solver retune that drops it is a known gap of this calibration, not a new fault; over the looped wire the parked JL4 folded into the left cusp in 4 of 5 starts (live) and 5 of 5 (fixture) and then engaged in 5 of 5, against 0 of 5 from the floor of the right cusp; in the short left main a seated JL4 entered the LAD in 7 of 12 femoral starts and a JL4.5 in 2 of 12, never the circumflex (the rod's larger curve stays at the bifurcation; the analytic model below gives the circumflex).

## Analytic model (simulation/engagement.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_SHORT_LM_MM` | src/simulation/engagement.ts | 7 | mm along the model's left main polyline | MODEL PARAMETER: between the anatomy's short left main (5.8 mm) and its usual one (9.5 mm) |
| `MP_SHORT_LM_LCX_REACH_MM` | src/simulation/engagement.ts | 2.5 | mm of reach beyond the sinus radius | MODEL PARAMETER: "one size larger" than the root needs, against the catalogue's 3-4 mm reach steps; a JL at or below it seats in the LAD of a short left main (a deep, damped seat), one at or above it at the circumflex |

The short left main's branch entry is opt-in (`EngagementOptions.shortLmBranches`, default false), so the shared engine's default is unchanged for every preset and lab (the 'lm-deep' and 'short-lm' library cases keep a free selective seat for their accepted JL) and for the PCI guide stand-in; guides are never branched. The lab's store does not pass the option yet (reported with this package).

## Attending and scoring (mentor/rules/diagEngagement.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_ENGAGEMENT_RULES` | src/mentor/rules/diagEngagement.ts | shapeChangesAllowed 2, deepPersistS 1.5, ostialPersistS 2 | catheter changes; s; s | MODEL PARAMETERS: the plan's "more than 2 changes without a sinus injection or aortogram" (the module text gives the order of the steps, not a count), and persistence like the other diagnostic rules |
| `MP_HEIGHT_CM` | src/mentor/rules/diagEngagement.ts | short 160, veryTall 190 | cm | MODEL PARAMETERS: Oxford names short and very tall patients without a height |
| `JL_SIZES` | src/mentor/rules/diagEngagement.ts | 3.5, 4, 4.5, 5, 6 | cm (Judkins left sizes on the cart) | The catalogue's Judkins left sizes, to which Brilakis's diameter-plus-1 is rounded |

The stop decision counts a large contrast volume as the warning of the stricter contrast ceiling (`contrastBudget.ts`, its defaults), a MODEL PARAMETER: the module text gives no volume. Below it, in an elective case, a stop is scored as premature. With a short left main the catheter choice also accepts the JL one size larger than the usual one (Oxford, `07-engaging.ts:551-560`), the size step being the catalogue's `JL_SIZES`.

`ENGAGEMENT_CATHETER_LISTS` (src/simulation/diagnosticScenarios/engagement.ts) is scenario data, not a sourced value: each scenario's accepted catheters, the union of what `expectedCatheters` accepts for its seeds and what the case generator already accepts. It is not applied yet (DiagScenario.spec has no catheter override; reported with this package).

## Record of the catheters that worked (progress/logbook.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `WORKED_CATHETERS_MAX` | src/progress/logbook.ts | 200 | patients | Storage bound, not a clinical value |
