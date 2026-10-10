# diag-rhythm-haemodynamic-events: model parameters

Arrhythmias, vagal reactions and hypotension causes in the diagnostic lab: the injection hazard model (`src/simulation/patient/responses.ts`, driven by `src/simulation/patient/engine.ts`), the new rhythms (`src/simulation/patient/rhythm.ts`), the rhythm orders and the diagnostic hypotension causes (`src/ui/sim/labSession.ts`, the Rhythm tab `src/ui/lab/controls/tabs/RhythmTab.tsx`), where a femoral puncture bleeds (`src/simulation/access/site.ts`), the attending's rhythm rules and the vagal time limit (`src/mentor/rules/diagRhythm.ts`) and the scenarios (`src/simulation/diagnosticScenarios/rhythm.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the VF triggers of an injection (tips diag-vf-catheter-cause, complex-pci/08-complex-patients.ts:1851, and diag-vf-shock-then-amiodarone, pci-manual/04-lab-drugs.ts:2047); the electrical treatment (unsynchronised 150-200 J biphasic for VF; synchronised 200-360 J or the biphasic equivalent for poorly tolerated VT; 200 J biphasic or 360 J monophasic for AF with severe compromise; 08-complex-patients.ts:610-611 and complication-management/05-patient-complications.ts:434-459); the ALS drug timing (adrenaline 1 mg after the third shock, amiodarone 300 mg after three shocks and 150 mg after five, 08-complex-patients.ts:622); atropine 0.5-1.0 mg (05-patient-complications.ts:341); lidocaine 50 mg and metoprolol 5 mg for tolerated VT (05-patient-complications.ts:457); adenosine 6 mg IV for SVT (04-lab-drugs.ts:857); flecainide 2 mg/kg, at most 150 mg (05-patient-complications.ts:425); heparin 5000 IU in AF with compromise (04-lab-drugs.ts:855); overdrive pacing 15-20 beats per minute above the VT, ending it in 80-90% (05-patient-complications.ts:458); the QTc of 540 ms in a patient with VT at LV catheterisation (04-lab-drugs.ts:1349); amiodarone avoided in long QT, pre-excited AF and unpaced high-grade block, flecainide only without structural heart disease, verapamil and adenosine not for VT (04-lab-drugs.ts:813, 912, 936, 939, 1358); a high puncture invites retroperitoneal bleeding and a slow pulse is common with it (complication-management/06-access-complications.ts:74, 145, 225); intracoronary nitroglycerin 200 µg above 120 mmHg (Brilakis 6.3, 04-lab-drugs.ts:251). The long-QT cut-off is the formulary's `MP_INTERACTION.longQtcS` (found-patient-formulary).

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_INJECTION_HAZARD.conusPerMl` | src/simulation/patient/responses.ts | 0.03 | per mL | MODEL PARAMETER: the legacy `MP_RESP.vfPerMlConus`, kept |
| `MP_INJECTION_HAZARD.dampedPerMl` | src/simulation/patient/responses.ts | 0.01 | per mL | MODEL PARAMETER: the legacy `MP_RESP.vfPerMlRightDamped`, now for a damped or ventricularised trace in either coronary |
| `MP_INJECTION_HAZARD.wedgedPerMl` | src/simulation/patient/responses.ts | 0.004 | per mL | MODEL PARAMETER: the legacy `MP_RESP.vfPerMlWedged`, kept |
| `MP_INJECTION_HAZARD.freePerMl` | src/simulation/patient/responses.ts | 0 | per mL | MODEL PARAMETER: a selective injection with a free trace has none of the module text's triggers |
| `MP_INJECTION_HAZARD.pluggingPerMl` | src/simulation/patient/responses.ts | 0.01 | per mL | MODEL PARAMETER: added at a fully plugged ostium (gap 0), falling linearly to none at `plugGapFree` |
| `MP_INJECTION_HAZARD.plugGapFree` | src/simulation/patient/responses.ts | 0.2 | open fraction (TipInput.gap) | MODEL PARAMETER |
| `MP_INJECTION_HAZARD.dwellPerMlS` | src/simulation/patient/responses.ts | 0.0008 | per mL per s | MODEL PARAMETER: contrast an obstructing tip holds in the artery ('contrast that could not clear') |
| `MP_INJECTION_HAZARD.lvContactVtPerS` | src/simulation/patient/responses.ts | 0.004 | per s | MODEL PARAMETER: sustained VT while the catheter touches the LV wall |
| `MP_INJECTION_HAZARD.longQtVtGain` | src/simulation/patient/responses.ts | 3 | multiplier | MODEL PARAMETER: the LV-contact VT hazard with a QTc at or above the formulary's long-QT cut-off |
| `MP_INJECTION_HAZARD.vtRateBpm` | src/simulation/patient/responses.ts | 165 | bpm | MODEL PARAMETER |
| `MP_INJECTION_HAZARD.vtRevertPerS` | src/simulation/patient/responses.ts | 0.02 | per s | MODEL PARAMETER: a sustained VT reverts once an antiarrhythmic acts |
| `MP_INJECTION_HAZARD.antiarrhythmicOn` | src/simulation/patient/responses.ts | 0.3 | effect 0..1 | MODEL PARAMETER: the formulary's antiarrhythmic effect from which reversion can happen |
| `MP_INJECTION_HAZARD.afRevertPerS` | src/simulation/patient/responses.ts | 0.01 | per s | MODEL PARAMETER: AF started in the case reverts on an antiarrhythmic |
| `MP_INJECTION_HAZARD.svtBlockOn` | src/simulation/patient/responses.ts | 0.3 | AV nodal drive 0..1 | MODEL PARAMETER: an SVT ends once adenosine's AV nodal block exceeds this |
| `MP_ENGINE.svtRate` | src/simulation/patient/engine.ts | 180 | bpm | MODEL PARAMETER: an SVT's rate when none is given |
| `MIN_STRESSED_ML` | src/simulation/patient/engine.ts | 20 | mL | MODEL PARAMETER: the floor a volume deficit leaves (the engine's existing floor for bleeding and diuresis) |
| `MP_PUNCTURE_BLEED.retroperitonealMlS` | src/simulation/access/site.ts | 3 | mL/s | MODEL PARAMETER: a brisk hidden bleed that a fluid bolus and legs up do not keep up with |
| `MP_PUNCTURE_BLEED.retroperitonealSlowAfterMl` | src/simulation/access/site.ts | 1500 | mL | MODEL PARAMETER: after this the bleed slows to the shared model's `MP_CAUSES.bleedSlowMlS` |
| `MP_PUNCTURE_BLEED.slowPulseLevel` | src/simulation/access/site.ts | 0.55 | engine vagal level 0..1 | MODEL PARAMETER: the slow pulse that comes with the bleed (a slow pulse is common, Brilakis) |
| `MP_PUNCTURE_BLEED.slowPulseHoldS` | src/simulation/access/site.ts | 600 | s | MODEL PARAMETER |
| `MP_PUNCTURE_BLEED.groinMlS` | src/simulation/access/site.ts | 0.15 | mL/s | MODEL PARAMETER: an entry over or below the head oozes into the groin |
| `highPunctureX` margin | src/simulation/access/site.ts | 8 | mm above the femoral head | MODEL PARAMETER: the scenario's high puncture |
| `MP_RHYTHM_ORDERS.energiesJ` | src/ui/sim/labSession.ts | 50, 100, 150, 200, 300, 360 | J | MODEL PARAMETER: the defibrillator's choices, covering the module text's energies |
| `MP_RHYTHM_ORDERS.defaultEnergyJ` | src/ui/sim/labSession.ts | 200 | J | MODEL PARAMETER: the lab's earlier fixed charge |
| `MP_RHYTHM_ORDERS.externalPacingSetupS` | src/ui/sim/labSession.ts | 30 | s | MODEL PARAMETER: pads on and capture after the order |
| `MP_RHYTHM_ORDERS.transvenousPacingSetupS` | src/ui/sim/labSession.ts | 240 | s | MODEL PARAMETER: the shared cause model's `MP_CAUSES.paceS` |
| `MP_RHYTHM_ORDERS.pacingRateBpm` | src/ui/sim/labSession.ts | 70 | bpm | MODEL PARAMETER: the pacing rate when none is chosen |
| `MP_RHYTHM_ORDERS.overdriveVfP` | src/ui/sim/labSession.ts | 0.05 | probability | MODEL PARAMETER: overdrive pacing accelerating VT into VF (the text says only that it can) |
| `MP_RHYTHM_ORDERS.overdriveAboveBpm`, `overdriveSuccessP` | src/ui/sim/labSession.ts | 15, 0.85 | bpm, probability | Sourced (Oxford, 05-patient-complications.ts:458: 15-20 above; 80-90%) |
| `MP_RHYTHM_ORDERS.legsUpMl` | src/ui/sim/labSession.ts | 150 | mL | MODEL PARAMETER: the volume legs up moves centrally |
| `MP_RHYTHM_ORDERS.legsUpOverS` | src/ui/sim/labSession.ts | 30 | s | MODEL PARAMETER |
| `MP_RHYTHM_ORDERS.vagalLimitsS` | src/ui/sim/labSession.ts | 120, 180, 300 | s | MODEL PARAMETER: the time limits offered for 'a few minutes' (05-patient-complications.ts:328) |
| `MP_RHYTHM_ORDERS.lowSystolicMmHg` | src/ui/sim/labSession.ts | 90 | mmHg | MODEL PARAMETER: a significant hypotension for the verapamil rule (the physiologist's call-out threshold, `MP_CALLOUT_SYSTOLIC_MMHG`) |
| `MP_RHYTHM_ORDERS.vagalSvrLagS` | src/ui/sim/labSession.ts | 20 | s | MODEL PARAMETER: in the vagal scenario the vascular tone follows the slowing with this lag (the emergency course's `vagalSvrLagS`), so the rate falls before the pressure |
| `MP_RHYTHM_ORDERS.vagalEventLevel` | src/ui/sim/labSession.ts | 0.4 | engine vagal level 0..1 | MODEL PARAMETER: 'vagal' is raised above it |
| `MP_RHYTHM_ORDERS.awakeConscious`, `sedatedAt` | src/ui/sim/labSession.ts | 0.6, 0.3 | 0..1 | MODEL PARAMETERS: a synchronised shock above this conscious level and below this sedation is recorded as given awake |
| `MP_RHYTHM_ORDERS.amplatzCuspAr` | src/ui/sim/labSession.ts | 0.5 | engine aortic regurgitation 0..1 | MODEL PARAMETER: an Amplatz deep on the cusp holding the valve open |
| `MP_RHYTHM_ORDERS.mimicTamponadeMlS` | src/ui/sim/labSession.ts | 1.0 | mL/s | MODEL PARAMETER: the tamponade of the vagal look-alike |
| `MP_RHYTHM_ORDERS.mimicTamponadeCapMl` | src/ui/sim/labSession.ts | 200 | mL | MODEL PARAMETER |
| `MP_RHYTHM_ORDERS.drainMl` | src/ui/sim/labSession.ts | 500 | mL | MODEL PARAMETER: the shared model's `MP_CAUSES.drainMl` |
| `MP_RHYTHM_ORDERS.echoEffusionMl` | src/ui/sim/labSession.ts | 20 | mL | MODEL PARAMETER: the patient adapter's `effusionMl` |
| `MP_DRY_DEFICIT_ML` | src/ui/sim/labSession.ts | 520 | mL | MODEL PARAMETER: the shared model's fasting deficit (`MP_CAUSES.fastingDeficitMl`), for a scenario whose history makes the patient dry |
| Fast saline in the Rhythm tab (`RHYTHM_DRUGS` saline-250) | src/ui/sim/labSession.ts | 250 | mL | MODEL PARAMETER: the smaller of the drugs menu's saline volumes |
| Sedation for cardioversion (`RHYTHM_DRUGS` midazolam-1) | src/ui/sim/labSession.ts | 1 | mg IV | MODEL PARAMETER for the dose: IV benzodiazepine sedation is sourced (08-complex-patients.ts:610); 1 mg is the sedation lesson's example dose (04-lab-drugs.ts:140) |
| `MP_VAGAL_RECONSIDER_S` | src/mentor/rules/diagRhythm.ts | 300 | s | MODEL PARAMETER for 'a few minutes' in the debrief's vagal time-limit finding |
| `RHYTHM_ECGS["ecg-rhythm-af-long-qt"].qtcMs` | src/simulation/diagnosticScenarios/rhythm.ts | 520 | ms | Scenario data (above the formulary's long-QT cut-off) |
| `rhythmSetups["diag-vagal-vs-bleed"].hypotension.afterS` | src/simulation/diagnosticScenarios/rhythm.ts | 60 | s after the time-out | MODEL PARAMETER |
| `rhythmSetups["diag-vagal-vs-bleed"].tamponadeMlS` | src/simulation/diagnosticScenarios/rhythm.ts | 1.0 | mL/s | MODEL PARAMETER (the same as `mimicTamponadeMlS`) |
| `rhythmSetups["diag-amplatz-hypotension"].cuspRegurgitation` | src/simulation/diagnosticScenarios/rhythm.ts | 0.6 | engine aortic regurgitation 0..1 | MODEL PARAMETER |
| `rhythmSetups["diag-arrhythmia-contraindications"].startRhythm.rateBpm` | src/simulation/diagnosticScenarios/rhythm.ts | 150 | bpm | Scenario data (the module text's severe compromise is a rate above 150) |
| `vagalMimicCause` | src/simulation/diagnosticScenarios/rhythm.ts | character-code sum mod 3: 1 hidden bleed, 2 tamponade, 0 true vasovagal | - | MODEL PARAMETER: what a seed runs (seed "1", the default, the bleed; "2" the tamponade; "3" the true vasovagal reaction) |
