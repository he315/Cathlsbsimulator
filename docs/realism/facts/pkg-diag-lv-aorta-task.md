# diag-lv-aorta-task: model parameters

The left heart tasks of the diagnostic lab: the power injector (`src/simulation/powerInjector.ts`), the valve's systolic opening in the rod model (`src/physics/lumen.ts`, `src/physics/engine.ts`), the regurgitant conductances and atrial contraction (`src/simulation/circulation.ts`, `src/simulation/patient/engine.ts`), the left heart session module (`src/ui/sim/modules/leftHeart.ts`), the attending's rules (`src/mentor/rules/diagLv.ts`) and the scenarios (`src/simulation/diagnosticScenarios/leftHeart.ts`).

Sourced values carry their location in the code and are not repeated as model parameters. From `src/content/manual/cath-handbook/04-cardiac-catheterisation.ts`: the injector's description and the stop on displacement or staining (:166); the ventriculogram settings 30–35 mL at 10–15 mL/s, a rise time of 0.1–0.5 s, reduced (for example 30 mL at 10 mL/s) with an LVEDP above 25 mmHg (:1248); the aortogram 40–60 mL at 20 mL/s in LAO (:1451); LVEDP above 35 mmHg a relative contraindication and pulmonary oedema likely above 30 mmHg (:1220, :1373, :621); the mid-cavity position, the 10 mL hand test injection and the fix for a pigtail caught in the papillary muscles (:1236 and the problems table); the views and the walls they profile; the leaflets-clear check for the aortogram (:1445). From `src/content/manual/complication-management/02-flow-embolism.ts:833`: oxygen, sitting up, furosemide 80–100 mg IV, an IV nitrate only above a systolic of 100 mmHg, CPAP, consider an IABP. The leaflet-induced aortic regurgitation is the author's design choice (hb-cardiac-catheterisation#2), labelled so in the module's header.

## Power injector (`src/simulation/powerInjector.ts` `MP_POWER_INJECTOR`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `volumeMl` min, max | src/simulation/powerInjector.ts | 1, 100 | mL | MODEL PARAMETER: the console's setting range |
| `rateMlS` min, max | src/simulation/powerInjector.ts | 1, 30 | mL/s | MODEL PARAMETER |
| `riseS` min, max | src/simulation/powerInjector.ts | 0, 1 | s | MODEL PARAMETER (covers the module text's 0.1–0.5 s) |
| `pressureLimitPsi` min, max | src/simulation/powerInjector.ts | 100, 1200 | psi | MODEL PARAMETER |
| `defaults` | src/simulation/powerInjector.ts | 30 mL, 10 mL/s, 0.1 s, 600 psi | | volume, rate and rise from the module text's reduced run and its rise rule; the 600 psi limit is a MODEL PARAMETER (no source opened) |
| `fireDelayS` | src/simulation/powerInjector.ts | 0.3 | s | MODEL PARAMETER: the module text's "a few frames into acquisition" |
| pressure through the lumen | src/simulation/powerInjector.ts | `circuitFor` of injection.ts | | the hand syringe's circuit (laminar tube, line and jet loss, facts/I1.md) |

## Valve opening in the rod model (`src/physics/lumen.ts` `VALVE_OPENING`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `normalAreaCm2` | src/physics/lumen.ts | 3 | cm² | MODEL PARAMETER: a normal valve's opening (full radius of a disc of that area, about 9.8 mm) |
| `maxRadiusShare` | src/physics/lumen.ts | 0.75 | of the annulus radius | MODEL PARAMETER |
| `crossBelowMm` | src/physics/lumen.ts | 2 | mm below the valve plane | MODEL PARAMETER: a body there inside the opening has crossed |
| `difficultRadiusShare` | src/physics/lumen.ts | 0.16 | of the normal opening | MODEL PARAMETER: the difficult valve admits a straight wire, not a J curve or a pigtail loop (valveCrossing.test.ts) |
| `eccentricShare` | src/physics/lumen.ts | 0.18 | of the annulus radius | MODEL PARAMETER: a difficult or stenotic opening lies off the axis towards the non-coronary cusp |
| `minRadiusMm` | src/physics/lumen.ts | 0.8 | mm | MODEL PARAMETER |
| press-to-cross radius with a valve set | src/physics/engine.ts `crossRadius` | min(1.2 x orifice, full opening) | mm | MODEL PARAMETER: pressing does not open a valve wider than its opening |

The opening's share open is the patient engine's `aorticValveOpening()` (aortic flow over its running peak, `MP_LEFT_HEART.avOpenTauS`).

## Circulation and patient engine

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ATRIAL_CONTRACTION.leadS`, `durS` | src/simulation/circulation.ts | 0.17, 0.13 | s before the R wave; s | MODEL PARAMETER: a half-sine atrial kick ending just before the R wave, so the LVEDP read there follows the a wave |
| `MP_LEFT_HEART.mrConductanceMlSPerMmHg` | src/simulation/patient/engine.ts | 1.2 | mL/s per mmHg at severity 1 | MODEL PARAMETER |
| `MP_LEFT_HEART.atrialKickMmHg` | src/simulation/patient/engine.ts | 6 | mmHg | MODEL PARAMETER |
| `MP_LEFT_HEART.avOpenTauS` | src/simulation/patient/engine.ts | 4 | s | MODEL PARAMETER: decay of the peak aortic flow the opening is scaled by |
| `Patient.mrConductance`, `arConductance`, `atrialKickMmHg` | src/simulation/circulation.ts | unset | | off by default: other labs unchanged |
| `loadVolume` | src/simulation/patient/engine.ts | | mL over s | a silent stressed-volume change for start states and the contrast load (no fluid order) |

## Left heart module (`src/ui/sim/modules/leftHeart.ts` `MP_LEFT_HEART_TASK`)

| Constant | Value | Unit | Rests on |
|---|---|---|---|
| `simpleCavityMm` | 70 | mm below the valve plane, base to apex | MODEL PARAMETER (simple model) |
| `bands` outflow, papillaryFrom, apex, wall | 0.2, 0.4, 0.68, 0.92 | long-axis fraction | MODEL PARAMETER |
| `posteriorSin` | -0.5 | sine of the curve's azimuth | MODEL PARAMETER: facing the mitral apparatus and papillary muscles |
| `wallQ` | 0.86 | share of the rod model's LV radius | MODEL PARAMETER |
| `leafletMm` | 4 | mm above the valve plane | MODEL PARAMETER |
| `catheterMr`, `catheterAr`, `amplatzAr` | 0.55, 0.04, 0.8 | severity 0..1 | MODEL PARAMETER (catheter-induced regurgitation; an Amplatz opening a cusp). `catheterAr` acts on the acute open-cusp coupling (`MP_COUPLING.arConductanceMlSPerMmHg` 8, about 0.32 mL/s per mmHg, roughly 10 mL a beat): a pigtail resting on the leaflets leaks, it does not hold a cusp open. It adds to the scenario's own AR (capped at severity 1); the catheter's MR takes the larger of the two |
| `leafletDwellS` | 2 | s | MODEL PARAMETER: a pigtail makes regurgitation only after resting this long on the leaflets, so a transit to cross the valve (about 1.5 s) does not |
| `entrapAfterS`, `freeTorqueRad`, `freeWithdrawMm`, `holdInsertionMm` | 1.5, 0.6, 3, 0.5 | s, rad, mm, mm | MODEL PARAMETER (the scripted entrapment; the fix is the module text's) |
| `stain` minMl, wallShare, leakMlSPerMl, delayS, bleedS | 0.5, 0.3, 0.12, 20, 240 | mL, share, mL/s per mL, s, s | MODEL PARAMETER: the stain and its later leak into the pericardium |
| `tamponadeMl` | 120 | mL | MODEL PARAMETER: the event's threshold (the engine's pericardial pressure curve, MP_ENGINE) |
| `oedemaVolumePerMl` | 4 | mL of stressed volume per mL of an LV run | MODEL PARAMETER: the contrast's haemodynamic load (the module text says contrast raises LVEDP, :213) |
| `oedemaWatchS` | 120 | s | MODEL PARAMETER |
| `oxygenLpm` | 15 | L/min | MODEL PARAMETER: "high-flow oxygen" has no figure in the module text |
| `whip` rateMlS, riseS, depthMm | 13, 0.1, 6 | mL/s, s, mm | MODEL PARAMETER: an abrupt high-flow start moves the catheter (the module text's reason for the rise time) |
| `lvedpVolumePerMmHg` | 20 | mL per mmHg | the patient engine's own calibration (`stressed: 860 + (lvedp - 10) * 20`) |
| `lvedpSettle` everyS, forS, gain | 2.5, 20, 0.8 | s, s, share | MODEL PARAMETER: corrections that bring the start state's LVEDP to its target |
| `failedPassesForEngageFail` | 3 | passes | MODEL PARAMETER |
| `valveZoneMm` | 5 | mm above the valve plane | MODEL PARAMETER: time at the valve for the embolic-risk score |
| `clearS` | 8 | s | MODEL PARAMETER: the power run's contrast on the image after the push |
| `holdS` ectopy, regurg, tooDeep, hypotension | 10, 20, 5, 30 | s | MODEL PARAMETER: event holds |
| echo effusion size | 4 + mL/25, 4 to 30 | mm | MODEL PARAMETER: a rough size from the pericardial volume |
| `runViewOf` bands | RAO at or beyond 15, LAO from 40, cranial from 10 | degrees | MODEL PARAMETER round the module text's RAO 30 and LAO 60 cranial 20 |
| `globalFunctionOf` | 55, 45, 35 | LVEF % | MODEL PARAMETER bands for normal, mild, moderate, severe |
| `severityPerGrade` | 0.25 | engine MR severity (0..1) per angiographic grade | MODEL PARAMETER: the scenario's MR grade (findings `mr`) applied to the engine in `applySetup`, grade IV giving severity 1 (`MP_LEFT_HEART.mrConductanceMlSPerMmHg` at full scale); while the catheter makes its own MR the engine takes the larger of the two |
| `arSeverityPerGrade` | 0.03 | engine AR severity per angiographic grade | MODEL PARAMETER: the scenario's chronic AR grade (findings `ar`) on the open-cusp coupling, grade III giving 0.09 (about 0.7 mL/s per mmHg); the aortogram's grade itself is the render input (`LvGramSpec.ar`) |
| `compensatedArSettleS` | 30 | s | MODEL PARAMETER: a scenario with chronic AR and no LVEDP of its own holds the engine's resting LVEDP (read before the AR is applied) for this long through the `lvedpSettle` corrections, standing for the compensated, dilated ventricle of chronic AR; grade III then rests below 25 mmHg with SpO2 at 94% or above (leftHeart.fixes.test.ts) |
| `drainFractionPerS` | 0.05 | share of the pericardial volume per second | MODEL PARAMETER: what a drain left in removes, besides the leak's own inflow (trackComplications) |
| `truthNow` LVEF fallback | 60 | LVEF % | MODEL PARAMETER: the truth's EF when a scenario's findings give none (a normal ventricle) |
| Amplatz cusp opening | `st.tip.cram` above 0, or insertion advanced by more than 0.05 mm in a step, with the tip on the leaflets | mm | MODEL PARAMETER: an Amplatz opens a cusp only when pushed onto the valve; it stays open until the tip leaves the leaflets |

Crossing in the simple model with the difficult or stenotic valve uses `crossingProbability` and `attemptDraw` of `src/simulation/haemo/avCrossing.ts` (that package's MODEL PARAMETERS); the embolic-risk score and the unnecessary-crossing rule are that file's too.

## FluoroView (`src/ui/sim/FluoroView.tsx`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ILIAC_FIELD_CENTRE` | src/ui/sim/FluoroView.tsx | x 0, y -440, z -60 | mm, aortic frame | MODEL PARAMETER: where the table centres the iliofemoral run, between the femoral heads of lvGram.ts `ILIOFEMORAL` |

## Scenarios (`src/simulation/diagnosticScenarios/leftHeart.ts` `leftHeartSetups`)

| Scenario | Values | Rests on |
|---|---|---|
| diag-lv-gram-task | LVEDP 27 mmHg; anterior and apical hypokinesis, LVEF 45 | MODEL PARAMETER: above the module text's 25, below its 30 |
| diag-lv-gram-reading-set | LVEDP 14; ten patterns (`READING_SET`) drawn by the seed | MODEL PARAMETER: the patterns are those the lab request names |
| diag-aortogram-ar-grading | AR grades I-IV (`AR_SET`) by the seed | MODEL PARAMETER |
| diag-difficult-valve-crossing | the difficult valve, LVEDP 12; MR grade 3 (the chart's echo: severe mitral regurgitation) | MODEL PARAMETER; the MR grade follows the scenario's own chart |
| diag-as-cross-or-not, diag-tavi-workup | stenotic valve (the engine's 0.7 cm² from the chart, `MP_SEVERE_AS_AVA_CM2` in labSession.ts); crossing not indicated | the module text's severe band; the value is diag-pressure-transducer's MODEL PARAMETER |
| diag-lv-stain-tamponade | LVEDP 16; apical dyskinesis, anterior akinesis, LVEF 35; aneurysm (the leak lasts 1.5 x bleedS) | MODEL PARAMETER |
