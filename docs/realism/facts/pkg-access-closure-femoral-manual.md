# access-closure-femoral-manual: model parameters

The femoral closure algorithm (`src/simulation/access/closurePlan.ts`), hands-on manual compression (`src/simulation/access/compression.ts`), its terms in the femoral outcome model (`src/simulation/access/closure.ts`), the groin view (`src/ui/access/GroinView.tsx`), the closure panel (`src/ui/access/panels/ClosurePanel.tsx`) and the scenarios (`src/simulation/session/scenarios/closureFemoral.ts`).

This file is also the facts file that the header of `src/simulation/access/closure.ts` points to for its sourced values. The file it named before, `facts/C5.md`, was never written; the last section below lists what closure.ts cites, as the code states it.

Sourced values of this package carry their location in the code and are not repeated as model parameters: the closure algorithm (`CLOSURE_ALGORITHM`, pm-closure-plan, Brilakis 11.1: an ACT below 180 s for hand compression; not above 300 s for a device; a common femoral artery larger than 5 mm; a short sheath of 10-13 cm; a collagen plug in that groin within 90 days); the compression numbers (`COMPRESSION`: Brilakis, pull below 180 s and about 2-3 min of pressure per French size; Oxford, below 150-200 s or after 3-4 h, about 8-10 min of continuous pressure, at least two fingers 1 cm proximal to the puncture; protamine 1-1.5 mg per 100 units of heparin to at most 50 mg, and severe hypotension usually 5-10 min after the dose); the preparation checklist (`PREP_CHECKLIST`, Brilakis 11.1.6 steps 1-3 and the lesson's blood-pressure row); 'too little pressure' and hypertension as causes of pseudoaneurysm and bleeding (Brilakis 11.1).

## Femoral outcome terms added (closure.ts `MP_FEMORAL`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_FEMORAL.inadequatePressureHaematoma` | src/simulation/access/closure.ts | 3 | factor at no adequate pressure (linear in the share without) | MODEL PARAMETER: the share of the pressing time without enough pressure at the hole multiplies the large-haematoma risk |
| `MP_FEMORAL.inadequatePressurePseudo` | src/simulation/access/closure.ts | 4 | factor, as above | MODEL PARAMETER: the same for the pseudoaneurysm ('too little pressure', Brilakis 11.1, as its cause) |
| `MP_FEMORAL.perSys20Above140` | src/simulation/access/closure.ts | 1.15 | factor per 20 mmHg of systolic above 140 at the pull | MODEL PARAMETER (hypertension as a cause of bleeding, Brilakis 11.1) |

## The hands (compression.ts `MP_COMPRESSION`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `zoneMm` | src/simulation/access/compression.ts | [-3, 12] | mm from the hole (distal to proximal) | MODEL PARAMETER: the fingers fully cover the hole with their centre in this band; Oxford's 1 cm proximal lies inside it |
| `axialSigmaMm`, `lateralSigmaMm` | src/simulation/access/compression.ts | 5, 5 | mm | MODEL PARAMETER: coverage falls off outside the zone |
| `holdBase`, `holdPerAct100`, `holdPerSys40` | src/simulation/access/compression.ts | 0.4; 0.18; 0.08 | share of full pressure; per 100 s of ACT above 150; per 40 mmHg of systolic above 140 | MODEL PARAMETER: the pressure at the hole that holds it (capped at 0.8 in `holdingPressure`) |
| `occlusive`, `firm` | src/simulation/access/compression.ts | 0.85; 0.5 | share of full pressure | MODEL PARAMETER: occlusive pressure stops distal flow; the slider reads light below 0.5, firm up to 0.85 |
| `oozeMlMinPerDeficit` | src/simulation/access/compression.ts | 30 | mL/min per unit of pressure deficit, scaled by ACT/150 | MODEL PARAMETER: oozing from an uncovered hole |
| `plugMin`, `plugPerAct100`, `plugPerFr`, `plugUndo` | src/simulation/access/compression.ts | 5; 0.6; 0.15; 2 | min at ACT 150 s with a 6 Fr hole; shares; rate multiple | MODEL PARAMETER: plug formation, slower with a higher ACT and a larger hole; bleeding under the fingers undoes it at twice its building rate |
| `visibleHaematomaMl` | src/simulation/access/compression.ts | 15 | mL | MODEL PARAMETER: a groin swelling the operator can see |
| `occlusiveMinForPulses` | src/simulation/access/compression.ts | 6 | min | MODEL PARAMETER: occlusive pressure longer than this leaves the foot pulses reduced after release |
| `protamineReactionSlow`, `protamineFastMultiplier`, `protamineVasodilation`, `protamineReactionS` | src/simulation/access/compression.ts | 0.04; 4; 0.45; 420 | probability; factor; share of vascular tone lost; s | MODEL PARAMETER: the protamine reaction, more likely with a fast injection |
| `protamineSlowS` | src/simulation/access/compression.ts | 300 | s | MODEL PARAMETER: the slow protamine injection |
| `bpLoweringVasodilation`, `bpLoweringS` | src/simulation/access/compression.ts | 0.2; 3600 | share of vascular tone; s | MODEL PARAMETER: the antihypertensive order |
| `raisedSysMmHg` | src/simulation/access/compression.ts | 160 | mmHg | MODEL PARAMETER (a simulator setting, not a clinical threshold: the lesson gives none): systolic counted as raised before removal |
| `swellingMlPerCm2` | src/simulation/access/compression.ts | 0.6 | mL per cm² (width = sqrt(V / 0.6) cm) | Display and wording setting for a groin swelling |
| `overMm`, `offTargetMaxShare` | src/simulation/access/compression.ts | 5; 0.1 | mm; share of the pressing time | MODEL PARAMETER: the fingers count as off the hole beyond 5 mm from the zone; the compression is 'over the arteriotomy' when no more than 10% of the time was off it |

## Display and controls

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `X_MIN`, `X_MAX`, `Y_HALF`, `PX` | src/ui/access/GroinView.tsx | -40, 60, 32, 3 | mm from the nick; px per mm | Display settings: the drawing's frame |
| `FINGER_CLEAR_X`, `FINGER_REACH_Y` | src/ui/access/GroinView.tsx | 16, 24 | px | Display settings: label clearance from the finger ellipses |
| `WAIT_S` | src/ui/access/panels/ClosurePanel.tsx | 600 | s | Control setting: the 'Wait 10 min' with the sheath sutured in, for the ACT to fall |

## Scenarios (scenarios/closureFemoral.ts)

Scenario settings are MODEL PARAMETERS of the scenario unless cited; none is a population value. Site x is mm along the limb from the inguinal crease. Every scenario is elective (stable angina) with a fixed seed.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `GROIN` | src/simulation/session/scenarios/closureFemoral.ts | ligament 66, head 30, bifurcation -4 | mm | fem-normal's groin |
| `HIGH_IEA_X`, `HIGH_ENTRY_X` | src/simulation/session/scenarios/closureFemoral.ts | 48; 52 | mm | closure-fem-high-stick: the entry about 4 mm above the lowest point of the inferior epigastric artery ('entry above the lowest point of the inferior epigastric artery is a high stick') |
| `HIGH_BIF_X`, `BELOW_BIF_ENTRY_X` | src/simulation/session/scenarios/closureFemoral.ts | 22; 23 | mm | closure-fem-below-bif: the entry within the site model's 3 mm of a high bifurcation |
| `BRANCH_ENTRY_X` | src/simulation/session/scenarios/closureFemoral.ts | 20 | mm | closure-fem-branch: the entry in an accessory profunda branch (Brilakis, the lesson's table) |
| `SMALL_CFA_MM` | src/simulation/session/scenarios/closureFemoral.ts | 4.5 | mm | closure-fem-small-artery: under the algorithm's 5 mm |
| `CALCIUM` | src/simulation/session/scenarios/closureFemoral.ts | from x 32 to 54 | mm | closure-fem-calcified: heavy anterior-wall calcium over the upper half of the head |
| `OLD_PLUG_DAYS` | src/simulation/session/scenarios/closureFemoral.ts | 42 | days | closure-fem-old-plug: within the lesson's 90 days |
| `TAMPONADE_ML_S`, `TAMPONADE_CAP_ML` | src/simulation/session/scenarios/closureFemoral.ts | 0.5; 140 | mL/s; mL | compression-tamponade-mimic: the tamponade mimic's rate, stopping where this patient has a fast rate and a low pressure even with saline running |
| `ACT_HIGH_OPEN_S` | src/simulation/session/scenarios/closureFemoral.ts | 245 | s | compression-act-high: the case opens once the engine's ACT is at most this, after heparin to the PCI dose (`SOURCED_DOSES.pciHeparinUPerKg`) and 300 s waits |

## What closure.ts cites (the values the missing facts/C5.md was to hold)

These values were in closure.ts before the lab build. Their sources are transcribed here from the code's own comments; repair-model-parameter-facts did not reopen the papers, so treat them as cited in code, not re-verified.

| Constant | File | Value | Source as the code gives it |
|---|---|---|---|
| `SHEATHS` outer diameters | src/simulation/access/closure.ts | 5 Fr 2.46 mm; 6 Fr 2.67 mm; 6 Fr thin-walled 2.46 mm; 7 Fr 3.02 mm | REDUCE-RAO, Wang 2022, PMC11267382 (6 and 7 Fr); Eltelbany 2024, PMC10976582 (the thin-walled 6 Fr with a 5 Fr, 2.46 mm, outer diameter) |
| `RAO_BASE` | src/simulation/access/closure.ts | 11/217 at 24 h | PROPHET patent-haemostasis arm (Pancholy 2008, via Rashid 2016 table 2) |
| `RAO_OR.occlusive` | src/simulation/access/closure.ts | odds ratio of 27/219 against 11/217 | PROPHET, conventional against patency-documented haemostasis at 24 h |
| `RAO_OR.lowHeparin` | src/simulation/access/closure.ts | 13/222 against 7/243 | Bernat 2011, 2000 IU against 5000 IU heparin, early RAO |
| `RAO_OR.noHeparin` | src/simulation/access/closure.ts | 35/49 against 9/210 | Spaulding 1996, no heparin against 5000 units |
| `RAO_OR.sixHours` | src/simulation/access/closure.ts | 24/200 against 11/200 | Pancholy 2011, 6 h against 2 h compression (interpolated by band hours, a model choice) |
| `RAO_OR.smallArtery`, `largeArtery` | src/simulation/access/closure.ts | odds of 13.0% and 4.0% against 6.8% overall | Saito 1999 abstract, severe flow reduction by artery-to-sheath ratio below or at least 1 (a flow proxy, relative to the cohort) |
| `RAO_OR.ulnar` | src/simulation/access/closure.ts | 1/3 | Eltelbany 2024, 'nearly 3-fold reduction in RAO' with prophylactic ulnar compression, taken as an odds ratio of 1/3 |
| `RAO_OR.warfarin` | src/simulation/access/closure.ts | 16/86 against 25/260 | Ahmed 2012, early RAO |
| `FEMORAL.actForSheathPullS`, `actForSheathPullStrictS` | src/simulation/access/closure.ts | 180; 160 s | Eltelbany 2024, manual compression 'usually once ACT has been less than 160-180 s' |
| `FEMORAL.manualMinutes` | src/simulation/access/closure.ts | 15 min | Bochum trial, PMC4829537, 'compressed by hand for ≥15 minutes' |
| `FEMORAL.deviceFailure` | src/simulation/access/closure.ts | 0.031 | Meta-analysis, PMC9482152, closure device failure 'approximately 3.1%' |
| `FEMORAL.mcLargeHaematoma`, `mcPseudoaneurysm`, `mcAvFistula` | src/simulation/access/closure.ts | 14/214, 10/214, 2/214 | PMC4829537, the manual compression arm after PCI |
| `EASY_INCIDENCE` | src/simulation/access/closure.ts | I 0.042, II 0.017, III 0.035, IV 0.008 | Garg 2019, PMC6620468, after transradial PCI (520 patients); grade sizes I < 5 cm, II 5-10 cm, III > 10 cm distal to the elbow, IV above it, V ischaemic |

The older model parameters in closure.ts, all labelled in the code: `MP_BAND` mmHgPerMl 7.5, maxMl 20, bleedBase 0.32, bleedPerAct100 0.12, bleedPerFr 0.04, occludeShareOfSys 0.72, oozeMlPerMinPerMmHg 0.04 (the later bleedAntiplatelet and thresholdSmoothingS are in pkg-access-closure-radial.md); `RAO_OR.spasm` 1.5 and `RAO_OR.extraPuncture` 1.3; `MP_FEMORAL` actScalePer100 0.55, highStickRetroperitoneal 0.06, baselineRetroperitoneal 0.002, lowStickMultiplier 3, shortCompressionPerMin 1.12, offTargetPerMm 1.08 (beyond 5 mm), backWall 1.6, perFr 1.25 (above 6 Fr), anticoagulated 1.8; a closure device without a femoral angiogram 1.5; each risk capped at 0.9; `MP_DELAY` forearm 15-60 min, groin 10-60 min, retroperitoneal 30-150 min at 6-14 mL/min to 600-1400 mL, pseudoaneurysm 60-240 min; `haematomaCm` sqrt(mL / 0.6). Combining odds ratios from different studies multiplicatively assumes independence: that combination is a model choice.
