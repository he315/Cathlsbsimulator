# structural-transseptal-hands-on: model parameters

The hands-on transseptal puncture for the TEER and LAAO labs (`src/simulation/transseptal.ts`, drawn by `src/ui/structural/TransseptalStage.tsx`) and its presets (`src/content/lab/presets/structural/transseptal.launch.ts`). The file's header says it: every number is sourced or a MODEL PARAMETER labelled where it is defined; this is a teaching model, not a predictor.

Sourced values carry their location in the code and are not repeated as model parameters: anticoagulation (`TS_HEPARIN`: heparin on entering the left atrium, Brilakis 14.6; an ACT of at least 250 s, LAAO consensus, 250-300 s Russo; 70-100 U/kg, consensus, Russo 100 U/kg; about 2000 U early as one approach, Russo; lessons hb-mitral-tricuspid-laa-ts-cross and ts-setup); the septal reflex (inferior ST elevation, hypotension, bradycardia and sweating that settle within minutes, Russo); the posterior exit at the border of the fossa with the muscular septum (Russo); the trace shapes (Oxford ch 4: LA v slightly taller than a, RA a above v).

## Pull-down and contact (transseptal.ts `TS_MECH`, all MODEL PARAMETERS)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `svcEndMm`, `jump1Mm` | src/simulation/transseptal.ts | 20; 8 | mm | MODEL PARAMETER: the tip drops from the SVC into the RA (the first jump) |
| `fossaMm`, `jump2Mm` | src/simulation/transseptal.ts | 40; 4 | mm | MODEL PARAMETER: a septally pointed tip drops onto the fossa (the second jump) |
| `ivcMm` | src/simulation/transseptal.ts | 75 | mm | MODEL PARAMETER: a tip not pointed at the septum slides into the IVC |
| `septalSector` | src/simulation/transseptal.ts | [3.5, 7.5] | clock hours | MODEL PARAMETER: the arrow points at the septum |
| `engageSi`, `rimSi`, `ectopyS` | src/simulation/transseptal.ts | 0.75; 0.6; 6 | fossa superior-inferior coordinate; s | MODEL PARAMETER: first contact at the superior rim, where atrial ectopics run |
| `apClockCentre`, `apPerHour` | src/simulation/transseptal.ts | 4.5; 0.4 | clock hour; fossa ap per hour | MODEL PARAMETER: ap = -(h - 4.5) x 0.4 on engagement |
| `siPerMmPull`, `siPerMmPush` | src/simulation/transseptal.ts | 0.06; 0.03 | si per mm | MODEL PARAMETER: withdrawal moves the contact inferior, advancing superior |
| `apPerDeg`, `releaseMm`, `torqueMaxDeg` | src/simulation/transseptal.ts | 0.012; 2; 120 | ap per degree; mm; degrees | MODEL PARAMETER: stored rotation, released by a slight withdrawal |
| `slipSi` | src/simulation/transseptal.ts | -0.95 | si | MODEL PARAMETER: the tip slips off the inferior rim into the IVC |
| `misalignH` | src/simulation/transseptal.ts | 1.2 | clock hours | MODEL PARAMETER: the arrow's error when arrow and side arm are not aligned |
| `tentStartMm`, `tentPerMm`, `tentMaxMm` | src/simulation/transseptal.ts | 4; 1.5; normal 12, thick 14, floppy 22 | mm; mm per mm; mm | MODEL PARAMETER: tent depth |
| `floppyLossSi` | src/simulation/transseptal.ts | 0.45 | si | MODEL PARAMETER: a floppy septum loses height while devices are steered |

## Monitor model (`TS_PATIENT`), times (`TS_ACTION_S`), traces (`TS_TRACES`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `TS_PATIENT` baseline | src/simulation/transseptal.ts | weight 75, HR 72, BP 124/68 | kg; bpm; mmHg | MODEL PARAMETER |
| `TS_PATIENT.vagal` | src/simulation/transseptal.ts | onset 20, plateau 90, end 180; HR -30, systolic -45, diastolic -25; ST 2 | s after the crossing; bpm; mmHg; mm | MODEL PARAMETERS of the sourced septal reflex |
| `TS_PATIENT.atropineHrFactor` | src/simulation/transseptal.ts | 0.3 | factor on the remaining rate drop | MODEL PARAMETER |
| `TS_PATIENT.airEmbolism` | src/simulation/transseptal.ts | onset 15, resolve 600; ST 2.5; systolic -30, diastolic -15, HR +10 | s; mm; mmHg; bpm | MODEL PARAMETER: air into the right coronary |
| `TS_PATIENT.tamponade` | src/simulation/transseptal.ts | start 60, span 120; systolic -60, diastolic -25, HR +35 | mL; mmHg; bpm | MODEL PARAMETER: pericardial blood where the pressure starts to fall, and the span to full tamponade |
| `TS_PATIENT.bleed` | src/simulation/transseptal.ts | sheath or dilator in the aorta 3, a hole in the LA wall 0.8, a posterior exit 0.6 | mL/s | MODEL PARAMETER |
| `TS_PATIENT.drainedMl`, `fluids` | src/simulation/transseptal.ts | 10; systolic +10, diastolic +5 for 180 s | mL; mmHg; s | MODEL PARAMETER: left after pericardiocentesis; a fluid bolus |
| `TS_PATIENT.baselineActS` | src/simulation/transseptal.ts | 120 | s | The 120 s baseline pharmacology.ts is calibrated with |
| `TS_ACTION_S` | src/simulation/transseptal.ts | setup 20, rotate 2, pull 2, to the SVC 60, needle 5, check 10, dilator 15, sheath 20, wire 30, heparin 10, ACT 60, remove needle 20, flush 15, surgeon 10, echo 10, drug 10, fluids 30, drain 120, close 300, remove 30 | s | MODEL PARAMETERS: time each action takes |
| `TS_HEPARIN.onEntryS` | src/simulation/transseptal.ts | 60 | s after the crossing | MODEL PARAMETER: 'on entering' the left atrium |
| `TS_HEPARIN.inRangeWithinS` | src/simulation/transseptal.ts | 300 | s after the crossing | MODEL PARAMETER: 'reach a therapeutic ACT quickly' |
| `TS_TRACES` | src/simulation/transseptal.ts | LA a 10, v 13, mean 9; RA a 8, v 6, mean 5; aortic 124/68, mean 87 | mmHg | MODEL PARAMETER magnitudes of the sourced shapes |
| `RECOVERY_S` | src/simulation/transseptal.ts | 600 | s | MODEL PARAMETER: how long recovery is watched after leaving the table |
| LA wall hole after drainage | src/simulation/transseptal.ts | seals once drained | n/a | MODEL PARAMETER (a posterior exit needs closing; the aorta, the surgeon) |
| Score deductions (`scoreTransseptal`) | src/simulation/transseptal.ts | from 5 (e.g. arrow and side arm not aligned) to 40 (dilator into the aorta) points of 100 | points | MODEL PARAMETERS of the puncture's scoring |

## Presets (`BASE_VARIANT`, `TS_PRESETS`)

| Setting | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `aorticAp` | src/simulation/transseptal.ts | 0.5 (base); -0.3 in ts-aortic-puncture | fossa ap | MODEL PARAMETER: a crossing further anterior enters the aortic root; 0.5 matches assessTransseptal's danger zone; a dilated root that hugs the fossa moves it posteriorly |
| `posteriorExitAp` | src/simulation/transseptal.ts | -0.85 (base); -0.3 in ts-delayed-tamponade | fossa ap | MODEL PARAMETER: a crossing further posterior (or above si 0.85) passes through the pericardial space; -0.85 matches the posterior danger flag |
| Septum and flags | src/simulation/transseptal.ts | ts-thick-septum thick, sheath resists; ts-floppy-septum floppy; ts-vagal reflex; ts-pacing-lead pacing leads | n/a | Model choices of the synthetic teaching cases |
