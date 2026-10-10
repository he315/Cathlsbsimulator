# proc-anaphylaxis-vagal: model parameters

Contrast reactions, vasovagal reactions and their mimics in the full case: the emergency orders and scoring (`src/simulation/session/emergencies.ts`, `src/simulation/session/modules/emergencies.ts`), the reaction course in the patient engine (`src/simulation/patient/responses.ts`, `src/simulation/patient/engine.ts`) and the scenarios (`src/simulation/session/scenarios/emergencies.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the anaphylaxis doses (`ANAPHYLAXIS`: adrenaline 0.5 mg IM of the 1 mg/mL strength, repeat after 5 minutes, refractory after two IM doses, a crystalloid bolus of 500-1000 mL and up to 3-5 L, RCUK 2021 and Oxford; chlorphenamine 10 mg IV, hydrocortisone 200 mg IV, nebulised salbutamol 5 mg, Oxford ch 10; the 1 mg IV arrest dose, FORMULARY_REFERENCE, 04-lab-drugs.ts); the tryptase timing (`TRYPTASE`, RCUK 2021: 1-2 h, no later than 4 h, at least 24 h after resolution); atropine 0.5-1.0 mg (Oxford) and 0.5 mg repeated to 3 mg (Brilakis) in `VASOVAGAL`; local anaesthetic volumes (`LOCAL_ANAESTHETIC`: femoral 10-20 mL Brilakis, 10 mL Oxford; radial about 1 mL Brilakis, 1-2 mL Oxford; 05-access.ts); the adrenaline infusion range 2-10 µg/min (04-lab-drugs.ts); vagal prevention by generous local anaesthetic and saline running before a femoral sheath is removed (cm-patient-complications-vasovagal, Brilakis 11.1).

## Session settings (emergencies.ts `MP_EMERGENCIES`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `imWithinS` | src/simulation/session/emergencies.ts | 120 | s from the first signs | MODEL PARAMETER: IM adrenaline counts as prompt (the request's 'within a short time of recognition') |
| `repeatFromS`, `repeatByS` | src/simulation/session/emergencies.ts | 240, 480 | s after the first dose | MODEL PARAMETER: the repeat dose window ('after 5 minutes', with a minute's tolerance) |
| `infusionByS` | src/simulation/session/emergencies.ts | 600 | s after the second dose | MODEL PARAMETER: when the infusion is expected |
| `persistLevel`, `persistMapMmHg` | src/simulation/session/emergencies.ts | 0.2; 65 | reaction component (0-1); mmHg | MODEL PARAMETER: problems persist |
| `infusionExcessUgMin` | src/simulation/session/emergencies.ts | 10 | µg/min | Above the module's 2-10 µg/min (04-lab-drugs.ts) counts as excessive |
| `infusionRatesUgMin` | src/simulation/session/emergencies.ts | 1, 2, 5, 10, 20 | µg/min | MODEL PARAMETER: rates offered |
| `infusionTachyAfterS`, `infusionSettleS` | src/simulation/session/emergencies.ts | 60; 30 | s | MODEL PARAMETER: an excessive rate gives a tachyarrhythmia, which settles after the rate is reduced |
| `orderS` | src/simulation/session/emergencies.ts | IM 20, IV 25, ready 5, nebuliser 30, echo 120, call 15, sample 30, note 20, bleeding check 60, posture 10 | s | MODEL PARAMETER: time each kind of order takes |
| `bolusOverS` | src/simulation/session/emergencies.ts | 300 | s | MODEL PARAMETER: a rapid crystalloid bolus runs in over this |
| `salineDripMl`, `salineDripS` | src/simulation/session/emergencies.ts | 500; 3600 | mL; s | MODEL PARAMETER: the saline drip before sheath removal |
| `legsUpMl`, `legsUpS` | src/simulation/session/emergencies.ts | 250; 30 | mL; s | MODEL PARAMETER: volume moved centrally by raising the legs |
| `oxygenLpm` | src/simulation/session/emergencies.ts | 15 | L/min | MODEL PARAMETER: high-flow oxygen (the engine's FiO2 ceiling applies) |
| `injectionMl` | src/simulation/session/emergencies.ts | 8 | mL | MODEL PARAMETER: contrast per 'continue the angiogram' injection |
| `vagalSymptomaticWithinS`, `symptomaticHr` | src/simulation/session/emergencies.ts | 90; 50 | s; bpm | MODEL PARAMETER: a vagal episode is symptomatic when HR < 50 or MAP < 65 within 90 s of onset |
| `vagalTreatWithinS` | src/simulation/session/emergencies.ts | 180 | s | MODEL PARAMETER: atropine or fluid expected within this of onset |
| `noResponseAfterS`, `reconsiderWithinS` | src/simulation/session/emergencies.ts | 180; 300 | s | MODEL PARAMETER: no response ('within a few minutes', Oxford) and the look for a mimic after it |
| `fastHr`, `fastLookWithinS`, `fastHypotensionHoldS` | src/simulation/session/emergencies.ts | 100; 300; 10 | bpm; s; s | MODEL PARAMETER: a fast-rate hypotension calls for a look |
| `resolvedLevel`, `resolvedMinS` | src/simulation/session/emergencies.ts | 0.05; 60 | reaction level; s | MODEL PARAMETER: a reaction counts as resolved |
| `episodeS` | src/simulation/session/emergencies.ts | 900 | s | MODEL PARAMETER: the vasovagal and fast-hypotension windows close |
| `vagalSvrLagS` | src/simulation/session/emergencies.ts | 40 | s | MODEL PARAMETER: the vagal vasodilation lags the slowing |
| `removalMagnitude` | src/simulation/session/emergencies.ts | femoral 0.55, radial 0.3 | vagal magnitude (0-1) | MODEL PARAMETER: sheath removal by site |
| `echo` | src/simulation/session/emergencies.ts | large effusion 100 mL, any effusion 20 mL, hypovolaemic loss 500 mL or MAP 55 mmHg | mL; mmHg | MODEL PARAMETER: the echo read-out |
| `bleedCheck` | src/simulation/session/emergencies.ts | haematoma from 30 mL, haemoglobin fall above 400 mL loss | mL | MODEL PARAMETER: the bleeding check read-out |
| `signs` | src/simulation/session/emergencies.ts | speak 0.5, itch 0.4, skin 0.3, airway 0.3 | levels 0-1 | MODEL PARAMETER: when the patient says a symptom and the nurse sees the rash, wheeze or swollen lips; nothing said names the reaction |
| `LOCAL_ONSET_S` | src/simulation/session/modules/emergencies.ts | 45 | s | Not new: the session's `MP_SESSION.localOnsetS`, kept in step |

## Reaction course (responses.ts `MP_EMERGENCY`, engine.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `escalationPerMl`, `escalationMax` | src/simulation/patient/responses.ts | 0.02; 0.6 | reaction peak per mL; ceiling | MODEL PARAMETER: contrast given after the reaction began raises its peak |
| `preArrestFrom`, `preArrestFull` | src/simulation/patient/responses.ts | 0.4; 0.8 | reaction level | MODEL PARAMETER: pre-arrest bradycardia begins and reaches full effect |
| `preArrestHrDrop`, `preArrestAtropineShare` | src/simulation/patient/responses.ts | 0.65; 0.4 | fractions | MODEL PARAMETER: heart rate lost at full effect, and the share atropine lifts |
| `forcedVagalLevel`, `forcedVagalHoldS` | src/simulation/patient/responses.ts | 0.95; 240 | level; s | MODEL PARAMETER: a forced (scenario) vagal episode |
| `MP_VAGAL_PREVENTION.noLocalGain` | src/simulation/patient/engine.ts | 0.6 | extra vagal magnitude | MODEL PARAMETER: a puncture or sheath with no effective local anaesthetic |
| `MP_VAGAL_PREVENTION.salineRelief` | src/simulation/patient/engine.ts | 0.6 | share removed | MODEL PARAMETER: saline running removes this share of a sheath removal's magnitude |
| `MP_ENGINE.periMaxMmHg` | src/simulation/patient/engine.ts | 40 | mmHg | MODEL PARAMETER: ceiling of the pericardial pressure on the ventricles; above the venous filling pressure the heart has already stopped filling |
| `MP_ENGINE.ventMinMl` | src/simulation/patient/engine.ts | 0 | mL | MODEL PARAMETER: a ventricle squeezed by an effusion empties to this and no further |

## Scenarios (scenarios/emergencies.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `FIRST_RUN_ML` | src/simulation/session/scenarios/emergencies.ts | 8 | mL | Scenario setting: the first left coronary run, the reaction's trigger |
| `ASTHMATIC_ONSET_S` | src/simulation/session/scenarios/emergencies.ts | 120 | s after the first run | Scenario setting within Oxford's 15 minutes |
| `TAMPONADE_ML_S` | src/simulation/session/scenarios/emergencies.ts | 0.5 | mL/s | Scenario setting: blood into the pericardium in the tamponade mimic |
| `TAMPONADE_CAP_ML` | src/simulation/session/scenarios/emergencies.ts | 155 | mL | MODEL PARAMETER: the bleed stops there, a large effusion with low pressure and a fast rate that waits for the learner |
