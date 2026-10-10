# structural-laao-device-mechanics: model parameters

The LAAO device mechanics (`src/simulation/laao.ts`, drawn by `src/ui/structural/LaaoViews.tsx` and run by `src/ui/structural/LaaoLab.tsx`) and its presets (`src/content/lab/presets/structural/laao.launch.ts`). This is a teaching model, not a predictor, and its device geometry is generic.

## Sourced values (not model parameters)

Each is cited where it is defined in `laao.ts`. All come from the module text, lessons hb-mitral-tricuspid-laa-laao-plan ("plan") and hb-mitral-tricuspid-laa-laao-implant ("implant"), which give the 2020 EHRA/EAPCI consensus.

| Constant | Value | Source |
|---|---|---|
| `PLUG_MIN_COMPRESSION_PCT` | 8% in every plane | implant, PASS Size (earlier-generation device the consensus describes) |
| `LEAK_LIMIT_MM` | under 3 mm in all four planes | implant, PASS Seal (consensus imaging chapter procedural target) |
| lobe-and-disc seal | no device leak | implant, lobe-and-disc "Tug and check" |
| `FOLLOWUP_LEAK_MM` | 5 mm | implant, antithrombotic table (residual leak) |
| plug Position | more than half the device beyond the ostium | implant, PASS Position |
| `SHEATH_MARKER_BEHIND_TIP_MM`, `MARKER_WALL_MIN_MM` | 5 mm; at least 5 mm | implant, plug "Sheath over the pigtail" |
| `PLUG_SHEATH_MARKER_SIZES` | 21, 27, 33 mm | implant, equipment details |
| `SHEATH_ACROSS_CM` | 2-3 cm | implant, plug "Access sheath across" and "Pigtail into the deepest lobe" |
| `PLUG_TUG_TIP_BACK_CM` | 2-4 cm | implant, PASS Anchor |
| `LOBE_TUG_TIP_BACK_CM` | about 2 cm | implant, lobe-and-disc "Tug and check" |
| `landingZoneDepthMm` | 10 mm for 25 mm or less, 12 mm for 28 mm or more | implant, lobe-and-disc "Measure the landing zone" |
| `LOBE_BEYOND_CX` | a half to two-thirds or more | implant, lobe-and-disc "Tug and check" |
| `LA_LOADED_MMHG`, `LA_FLUID_TRIGGER_MMHG` | above 12 mmHg; below 11-12 mmHg | plan, "Why the numbers disagree" |
| `FLUID_CHALLENGE_ML` | 250-1,000 mL | plan |
| `FILL_GAIN_MM` | about 2 mm | plan, table (500-1,000 mL bolus) |
| `CT_OVER_TOE_MM`, `CT_OVER_FLUORO_MM` | 1-3 mm; 2-4 mm | plan, table |
| `FOLLOWUP_WEEKS` | 6-12 weeks | plan, "Imaging after the implant" |
| puncture rule | inferior-posterior for most; inferior central or anterior for a reverse chicken-wing or posteriorly bent proximal appendage | plan, "Planning the views, the sheath and the puncture" (Fukutomi, consensus) |
| follow-up actions | DRT anticoagulated until resolved; no antithrombotic not appropriate; small leaks re-imaged; 5 mm or more anticoagulation or closure | implant, antithrombotic table |
| `laao-reverse-chicken-wing` numbers | mean LA 8 mmHg; TOE landing zone 18 mm dry, 22 mm loaded; CT 21 mm; LVEF 50%; 500 mL example; DRT at 8 weeks | module case hb-mitral-tricuspid-laa-case-laao-reverse-wing |

## Model parameters (`LAAO_MECH` and the others)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `COMPRESSION_WINDOW` | src/simulation/laao.ts | 10-30 | % | MODEL PARAMETER (kept from before): teaching window for the lobe, and the plug's upper bound in `PLUG_COMPRESSION_WINDOW` |
| marginal anchor threshold | src/simulation/laao.ts (`assessLaao`) | min(5, window minimum - 1) | % | MODEL PARAMETER: below the family's minimum the device shifts on the tug; it keeps the earlier 5% for the lobe and 5% for the plug's 8% minimum |
| `tooProximal` band (plug) | src/simulation/laao.ts (`POSITION_BANDS`) | -3 mm | mm | MODEL PARAMETER (kept): below it a plug that is still more than half beyond the ostium is borderline and anchors and seals less well |
| lobe-and-disc leak under 3 mm | src/simulation/laao.ts (`assessLaao`) | borderline | - | MODEL PARAMETER: within the general target but not this device's "no device leak" |
| `defaultLaMeanMmHg` | src/simulation/laao.ts | 14 | mmHg | MODEL PARAMETER: a scenario that names no filling is already loaded, so the earlier cases measure as before |
| `fluidMmHgPer250` | src/simulation/laao.ts | normal 2.5, impaired 3.5 | mmHg per 250 mL | MODEL PARAMETER: chosen so that the case's 500 mL with an LVEF of 50% lifts 8 mmHg above 12 |
| `fluidMaxMl` | src/simulation/laao.ts | normal 1,000; impaired 500 | mL | MODEL PARAMETER: the module's upper end for a normal LV, half for an impaired LV or heart failure history (the module says "by LV function" without a figure) |
| `toeMeasurementsAt` | src/simulation/laao.ts | deficit = gain x (12 - LA) / (12 - starting LA), clamped 0-1, rounded to 0.5 mm | mm | MODEL PARAMETER: the dry appendage shrinks linearly between the starting and the loaded pressure |
| `gainMm` (reverse chicken-wing) | src/simulation/laao.ts | 4 | mm | the case's 18 mm dry and 22 mm loaded landing zone |
| `ctOverToeMm`, `ctOverFluoroMm` | src/simulation/laao.ts | 2; 3 | mm | MODEL PARAMETER: mid-range values inside the module's 1-3 mm and 2-4 mm; CT is taken against TOE at the starting filling |
| `modalityOffsetMm` (reverse chicken-wing) | src/simulation/laao.ts | CT over TOE 3, over fluoroscopy 3 | mm | the case: CT 21 mm against TOE 18 mm dry |
| `sheathStartMm` | src/simulation/laao.ts | -10 | mm from the ostium | MODEL PARAMETER: the sheath sits in the atrium in front of the ostium before it is advanced |
| `appendageWallMm` | src/simulation/laao.ts | the largest measured depth | mm | MODEL PARAMETER: the deepest lobe the sheath can meet along the axis |
| `plugPositionFromSheath` | src/simulation/laao.ts | shoulder = sheath tip - 5 mm - device length | mm | MODEL PARAMETER built on the sourced marker: the plug's distal end sits at the aligned distal marker |
| `plugPushMm` | src/simulation/laao.ts | 4 | mm | MODEL PARAMETER: how far a pushed plug or lobe travels forward |
| `lobeSlipMm` | src/simulation/laao.ts | 5 | mm | MODEL PARAMETER: proximal slip when the lobe is opened by pulling the sheath |
| `sheathCreepMm` | src/simulation/laao.ts | 5 | mm | MODEL PARAMETER: sheath creep when the pigtail is removed without holding the sheath |
| `sheathBehindPlugMm` | src/simulation/laao.ts | 5 | mm behind the plug shoulder | MODEL PARAMETER: where the access sheath tip sits once the plug is unsheathed |
| plug full recapture | src/simulation/laao.ts (`laaoDeployStep`) | sheath tip = shoulder + 5 mm + device length | mm | MODEL PARAMETER built on the sourced marker: the sheath is re-advanced over the whole plug, so its distal end is back at the distal marker and an unsheathe in place redeploys it where it was |
| `lobeSheathWallMarginMm` | src/simulation/laao.ts | 1 | mm | MODEL PARAMETER: the lobe-and-disc delivery sheath tip within this of the deepest measured depth, or beyond it, is against the wall (flag `sheath-wall`, major, traumatic); the plug's 5 mm marker rule is the plug sheath's own |
| lobe-and-disc pushed before the ball | src/simulation/laao.ts (`laaoDeployStep`, flag `lobe-push-before-ball`) | major | - | MODEL PARAMETER: the module forms the ball by holding the cable and pulling the sheath back; it does not grade pushing the loaded device out, so this severity and the forward travel (`plugPushMm`) are the model's |
| `circumflexMm` | src/simulation/laao.ts | 1 | mm inside the ostium | MODEL PARAMETER: the circumflex at the inferior edge of the ostium (drawn there in LaaToeView) |
| `lobeTugRangeCm` | src/simulation/laao.ts | 1-3 | cm | MODEL PARAMETER: tolerance around the sourced "about 2 cm" |
| `lobeWaitMin` | src/simulation/laao.ts | 3 | min | MODEL PARAMETER for the module's "a few minutes" |
| `separationMinMm` | src/simulation/laao.ts | 2 | mm | MODEL PARAMETER: the lobe's proximal edge this far inside shows a separation from the disc |
| disc concave | src/simulation/laao.ts (`releaseCriteria`) | disc at least the largest ostium, lobe 2-12 mm inside, no overshoot | - | MODEL PARAMETER |
| tyre-shaped lobe | src/simulation/laao.ts (`releaseCriteria`) | lobe compression at least 10% and coaxial | - | MODEL PARAMETER for "slightly compressed, perpendicular" |
| `traumaEffusionScore` | src/simulation/laao.ts | 2 per movement | risk score | MODEL PARAMETER: sheath against the wall, a pushed plug, a forward recapture |
| anchors damaged | src/simulation/laao.ts (`assessLaao`) | anchor one rank lower; embolisation score +1 | - | MODEL PARAMETER for "fixation unreliable" |
| `centralApMax` | src/simulation/laao.ts | 0.2 | fossa ap coordinate | MODEL PARAMETER: inferior-central up to 0.2, inferior-anterior above (posterior at -0.05 or below, as assessTransseptal) |
| reverse chicken-wing site quality | src/simulation/laao.ts (`laaoPunctureQuality`, `laaoCoaxial`) | inferior central or anterior ideal and coaxial; mid-fossa central or anterior acceptable and coaxial; inferior-posterior acceptable, not coaxial; others poor | - | the case grades inferior-posterior "acceptable"; the planning list gives "mid-fossa to anterior" for a reverse chicken-wing (consensus) while the check's best answer is still inferior (Fukutomi) |
| `midFossaSiMax` | src/simulation/laao.ts | 0.3 | fossa si coordinate | MODEL PARAMETER: mid-fossa lies above -0.1 (assessTransseptal's inferior) and at or below 0.3 (its LAAO "acceptable" height) |
| `points` | src/simulation/laao.ts | minor 3, major 8, critical 15, early release 15, sizing 8, puncture 8, follow-up 15 | score points | MODEL PARAMETER: the mechanics deductions |
| `scoreLaaoFollowUp` | src/simulation/laao.ts | wrong DRT plan -60, other wrong plan -40 | score points | MODEL PARAMETER |
| follow-up visit | src/simulation/laao.ts (`followUpFinding`) | 8 weeks | weeks | the case's "At 8 weeks", inside the sourced 6-12 weeks |
| presets' measurements, `sheathAcrossCm` 4.5, `drtMm` 5 and 6, `deployed` 30 mm plug at 5 mm | src/simulation/laao.ts | as listed in `LAAO_SCENARIOS` | mm, cm | MODEL PARAMETERS: synthetic teaching cases (the deployed plug sits deep, an implant factor the module names for DRT) |
| fluid button, cap | src/ui/structural/LaaoLab.tsx | 250 mL per press, 1,500 mL in all | mL | MODEL PARAMETER of the interface; doses above the LV's maximum are deducted, not blocked |
| tug choices | src/ui/structural/LaaoLab.tsx | 1-6 cm | cm | MODEL PARAMETER of the interface |
| `LOBE_HALF` | src/ui/structural/LaaoLab.tsx | 4 | mm | half the illustrative lobe length: the ball slider starts with the lobe centred on the landing zone |
| fluoroscopy view | src/ui/structural/LaaoViews.tsx | 3.6 px/mm, axis -35 degrees, the 135 degree measurement for the diameters, drawn to `appendageWallMm` | - | drawing scale; RAO 30/caudal 20 corresponds roughly to TOE 135 degrees (plan); the wall is drawn where the marker rule judges it |
