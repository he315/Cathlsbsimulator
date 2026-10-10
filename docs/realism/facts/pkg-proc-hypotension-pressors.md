# proc-hypotension-pressors: model parameters

One hypotension cause model (`src/simulation/patient/hypotensionCauses.ts`), the case's hypotension and oedema orders and scoring (`src/simulation/session/hypotension.ts`, `src/simulation/session/modules/hypotension.ts`), the infusion panel and the scenarios (`src/simulation/session/scenarios/hypotension.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: each pump's dose range (`PUMPS[].range` with `source`: Brilakis 3.6 for noradrenaline, phenylephrine, vasopressin, dopamine and adrenaline; ESC 2021 in the lesson for dobutamine; Oxford for isoprenaline; Brilakis 3.2 for GTN; all in 04-lab-drugs.ts); atropine 1 mg for heart block (`ATROPINE_BLOCK_MG`, 04-lab-drugs.ts); the phenylephrine 50-100 µg bolus and Brilakis's vasopressor trigger at MAP below 60 mmHg (`PRESSOR_DOSES`, pm-lab-drugs-pressors); the oedema regimen (`OEDEMA`: furosemide 80-100 mg IV, Oxford; IV nitrate only above a systolic of 100 mmHg, Oxford and Brilakis; GTN from 10 µg/min to 200, Brilakis; LVEDP above 30 mmHg, Oxford ch 4); the right heart reference's wedge above 18 mmHg (Brilakis 14.1), filling 3-12 mmHg (Oxford ch 4) and typical cardiac index 2.5-3.5 L/min/m² (Oxford); the mechanism pattern of Brilakis Fig. 28.1.

## Cause scripts (hypotensionCauses.ts `MP_CAUSES`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `bleedMlS`, `bleedSlowAfterMl`, `bleedSlowMlS` | src/simulation/patient/hypotensionCauses.ts | 1.0; 420; 0.02 | mL/s; mL; mL/s | MODEL PARAMETER (simulator setting): bleeding into a hidden space, slowing by itself at the volume |
| `controlS` | src/simulation/patient/hypotensionCauses.ts | 120 | s | MODEL PARAMETER: control of the bleeding site takes this long |
| `fastingDeficitMl`, `fastingMlS` | src/simulation/patient/hypotensionCauses.ts | 520; 2 | mL; mL/s | MODEL PARAMETER: the circulating volume missing on arrival after fasting |
| `ischaemiaOcclusions` | src/simulation/patient/hypotensionCauses.ts | LAD at 0.05 fraction 1; LCx at 0.05 fraction 1; RCA at 0.1 fraction 0.5 | position 0-1; occlusion fraction | MODEL PARAMETER: the ischaemic cause |
| `ischaemiaCongestionMl`, `ischaemiaCongestionOverS` | src/simulation/patient/hypotensionCauses.ts | 250; 120 | mL; s | MODEL PARAMETER: central volume shift standing for the stiff ischaemic ventricle's rise in filling pressure (the engine's ischaemia lowers contractility only) |
| `tamponadeMlS`, `tamponadeCapMl` | src/simulation/patient/hypotensionCauses.ts | 0.5; 155 | mL/s; mL | MODEL PARAMETER: blood into the pericardium, stopping by itself |
| `drainS`, `drainMl` | src/simulation/patient/hypotensionCauses.ts | 300; 500 | s; mL | MODEL PARAMETER: a drain's duration and the most it removes |
| `paceS` | src/simulation/patient/hypotensionCauses.ts | 240 | s | MODEL PARAMETER: a temporary pacing wire is placed and captures after this |
| `vasodilation`, `vasodilationHalfLifeS` | src/simulation/patient/hypotensionCauses.ts | GTN with a PDE5 inhibitor 0.68, verapamil 0.6, vasodilator in HCM 0.45; half-life 1500 | share of vascular tone lost; s | MODEL PARAMETER: vasodilation by cause, wearing off with the drug |
| `transducerHighCm`, `lineAirMl` | src/simulation/patient/hypotensionCauses.ts | 35; 0 | cm above the phlebostatic axis; mL | MODEL PARAMETER: the false-reading cause |
| `RHC_REFERENCE.raLowMmHg`, `raHighMmHg` | src/simulation/patient/hypotensionCauses.ts | 1.2; 6 | mmHg | MODEL PARAMETER: this engine's resting RA pressure runs at 1-3 mmHg, so 'low' and 'high' are set about it |
| `RHC_REFERENCE.slowHr`, `fastHr`, `tachyHr` | src/simulation/patient/hypotensionCauses.ts | 50; 100; 150 | bpm | MODEL PARAMETER: slow, fast and tachyarrhythmia rates in the classification |

## Session (hypotension.ts `MP_HYPOTENSION`, `PUMPS`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `PUMPS[].strengths` | src/simulation/session/hypotension.ts | noradrenaline 40, 80; phenylephrine 100, 200; vasopressin 0.4, 1; dopamine 1600, 3200; adrenaline 40, 80; dobutamine 2500, 5000; isoprenaline 20, 40; GTN 500, 1000 | µg/mL (vasopressin U/mL) | MODEL PARAMETERS: syringe strengths offered; local protocol decides |
| `PUMPS[].step` | src/simulation/session/hypotension.ts | 0.05, 0.1, 0.005, 1, 1, 0.5, 1, 10 (same order) | the pump's rate unit | Panel setting: the rate step |
| `episodeMapMmHg`, `episodeHoldS` | src/simulation/session/hypotension.ts | 65; 10 | mmHg; s | The lab's hypotension event (patientEvents.ts, MODEL PARAMETERS there) |
| `episodeCloseS`, `causeTreatWithinS` | src/simulation/session/hypotension.ts | 180; 600 | s | MODEL PARAMETER: an episode closes after the means stand at or above 65 this long; the cause is expected to be treated within this of the onset |
| `dobutamineLowStartUgKgMin` | src/simulation/session/hypotension.ts | 5 | µg/kg/min | MODEL PARAMETER: a start above this counts as high (ESC 2021 'start at low doses', its range beginning at 2) |
| `orderS` | src/simulation/session/hypotension.ts | drug 20, pump 30, check 10, cuff 40, RHC 300, modelled RHC 20, posture 10, call 15 | s | MODEL PARAMETER: time each kind of order takes |
| `bloodUnitMl`, `bloodUnitS`, `salineOverS` | src/simulation/session/hypotension.ts | 300; 600; 300 | mL; s; s | MODEL PARAMETER: a unit of red cells as given in the model, and a saline bolus |
| `escalateAboveTop`, `escalateLowOnPressorS` | src/simulation/session/hypotension.ts | 1; 300 | multiple of the range's top; s | MODEL PARAMETER: when the offer of support comes |
| `arrhythmiaPerMin`, `arrhythmiaDopamineFactor` | src/simulation/session/hypotension.ts | 0.25; 2 | hazard per min; factor | MODEL PARAMETER: arrhythmia while a vasoactive drug runs above its range (dopamine at any vasopressor dose, SOAP II's excess as the direction) |
| `arrhythmiaSettleS`, `arrhythmiaRunS`, `arrhythmiaRunGapS` | src/simulation/session/hypotension.ts | 30; 15; 60 | s | MODEL PARAMETER: the high-dose arrhythmia as non-sustained runs of VT |
| `reboundMapMmHg`, `reboundHoldS`, `reboundReduceWithinS` | src/simulation/session/hypotension.ts | 105; 60; 300 | mmHg; s; s | MODEL PARAMETER: rebound on a pressor once the cause is fixed |
| `oedemaRiskLvef` | src/simulation/session/hypotension.ts | 40 | % | MODEL PARAMETER: 'LV impairment', for which the module gives no figure |
| `oedemaSpo2`, `oedemaResolvedSpo2`, `oedemaResolvedLvedp`, `oedemaResolvedHoldS` | src/simulation/session/hypotension.ts | 92; 94; 25; 60 | %; %; mmHg; s | MODEL PARAMETER: the oedema event and its resolution |
| `atRiskLoadMl`, `bolusMl` | src/simulation/session/hypotension.ts | 800; 500 | mL | MODEL PARAMETER: an at-risk load raises 'high-contrast-volume'; a bolus this large in an at-risk patient with a raised LVEDP is the oedema decision |
| `cpapPreloadMl`, `cpapOverS` | src/simulation/session/hypotension.ts | 250; 120 | mL; s | MODEL PARAMETER: CPAP as a preload reduction with oxygen at the mask's ceiling |
| `oxygenLpm` | src/simulation/session/hypotension.ts | 15 | L/min | MODEL PARAMETER: high-flow oxygen (the engine's FiO2 ceiling applies) |
| `sitUpMl`, `sitUpS` | src/simulation/session/hypotension.ts | 150; 30 | mL; s | MODEL PARAMETER: sitting up moves this out of the central circulation |
| `speakLevel` | src/simulation/session/hypotension.ts | 0.5 | symptom level 0-1 | MODEL PARAMETER: the case's signs are said once at this level |
| `RHC_OPEN_S`, `CONFIRM_WINDOW_S` | src/simulation/session/modules/hypotension.ts | 600; 300 | s | Panel settings: how long the right heart numbers stay open for the tips; a line check counts for an episode opening within this |

## Scenarios (scenarios/hypotension.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `OEDEMA_PRELOAD_ML` | src/simulation/session/scenarios/hypotension.ts | 470 | mL | MODEL PARAMETER: central volume that raises the filling pressure before the learner takes over (oedema-lvedp-high) |
| `OEDEMA_SETTLE_S` | src/simulation/session/scenarios/hypotension.ts | 90 | s | Scenario setting: the time it is given to settle |
