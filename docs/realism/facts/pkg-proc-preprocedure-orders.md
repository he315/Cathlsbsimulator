# proc-preprocedure-orders: model parameters

The pre-procedure order sheet (`src/simulation/session/preorders.ts`, the session module `src/simulation/session/modules/preorders.ts` and the scenarios in `src/simulation/session/scenarios/preorders.ts`). The sourced values the sheet scores against are in `PREORDER_RULES` in `preorders.ts`, each with its location in the module text (lessons pm-antithrombotics-oac, pm-antithrombotics-oral, cm-patient-complications-kidney and cm-patient-complications-contrast-budget). Every value below is a MODEL PARAMETER: none is a clinical or population value from a source.

## Physiology of the signed orders (`MP_PREORDERS`, preorders.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `intravascularShare` | 0.2 | fraction | The engine's `fluid()` keeps all of a bolus in the circulation; over the hours of a pre-procedure infusion most crystalloid leaves it (redistribution, urine), which the engine does not model. Chosen so that 1 mL/kg/h for 12 h keeps an LVEF 30% ventricle out of pulmonary oedema and 3 mL/kg/h for 12 h does not, while 3 mL/kg/h in a normal ventricle stays dry (preorders.test.ts) |
| `preHydrationOverS` | 600 | s | The session time over which the pre-procedure share enters the engine once the orders are signed (the ward hours compressed) |
| `infusionSliceS` | 60 | s | The in-case infusion is delivered to the engine in slices of this length |
| `inrHalfH` | 24 | h | After warfarin stops, the INR's excess over 1 halves every 24 h (a 5-day hold from 3.4 gives 1.1). Neither manual gives a decay rate |
| `doacContinueH` | 12 | h | 'Continue' a DOAC: the last dose was taken the evening before (twice-daily dosing) |
| `restartWindowH` | 4-24 | h | Oxford's 'evening after the procedure', shown as the expected restart |
| `restartMaxH` | 48 | h | A written restart later than this is scored as leaving the patient unprotected for too long |
| `chronicAspirin` | 300 mg, 24 h before | mg, h | A patient on daily aspirin carries its platelet effect on arrival; represented as one dose aged 24 h on the formulary's own pharmacology |
| `opioidFentanylUg` | 100 | µg IV | The opioid given before arrival in the STEMI case, as fentanyl (the formulary's opioid); enough for the formulary's opioid-on-board interaction with oral P2Y12 loads |
| `ckdEgfr` | 60 | mL/min/1.73 m² | Kidney at risk (saline, creatinine checks, catheter set); the planning module's `MP_PLANNING.ckdEgfr` |
| `lvImpairmentLvef` | 40 | % | LV impairment for the saline rate; the hypotension module's `MP_HYPOTENSION.oedemaRiskLvef` |
| `tailoredLvMaxMlKgH` | 1 | mL/kg/h | The highest saline rate scored as tailored in LV impairment: the lower end of Brilakis's 1-3 mL/kg/h and Oxford's 1 mL/kg/h (05-patient-complications.ts:844 asks for the rate to be tailored, with pulmonary oedema in LV impairment, but gives no figure) |
| `tailoredLvMinMlKgH` | 0.5 | mL/kg/h | The lowest saline rate scored as tailored in LV impairment (neither manual gives one) |
| `maxHoursBefore` | 96 | h | The longest pre-procedure time the sheet accepts for a load or the saline |

## Session settings (`MP_PREORDER_TIME`, modules/preorders.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `signS` | 60 | s | Time to write and sign the sheet |
| `ceilingS` | 10 | s | Time to state the ceiling |
| `repeatStopS` | 5 | s | The same stop line is not repeated within this time |

## Scoring choices (preorders.ts)

| Choice | Value | Rests on |
|---|---|---|
| Hold length | correct at or above the shorter manual's hold (Oxford 24 h, 72 h dabigatran in renal impairment; warfarin 3 days) | The manuals differ (03-antithrombotics.ts:525-573); the shorter is the accepted alternative, and the given text notes when Brilakis's longer hold is not met |
| Continue the anticoagulant | accepted for every indication | Oxford sends a fully anticoagulated patient to the wrist; the core session scores the route (`anticoagulated-route`) |
| Laminar thrombus, recurrent VTE: bridging | scored wrong | Oxford lists them among those whose warfarin can stop (03-antithrombotics.ts:525); no scenario uses them yet |
| Prasugrel over 75 years or under 60 kg | scored wrong | Oxford advises against it; Brilakis would use a 5 mg maintenance dose (03-antithrombotics.ts:753); the stricter reading is scored |
| Clopidogrel in ACS | scored wrong unless both potent agents are ruled out | Brilakis 3.5 (03-antithrombotics.ts:758) |
| Stable angiography with possible ad hoc PCI | load before or at PCI both accepted | Brilakis loads when PCI is planned, Oxford preloads anyone due for PCI (03-antithrombotics.ts:788) |
| Aspirin with an anticoagulant, patient already on daily aspirin | continuing the daily dose accepted, as is a peri-procedural 300 or 325 mg dose; the team's reference is to continue | 03-antithrombotics.ts:671 and 1608 ask only that aspirin be kept short with an anticoagulant, not for a reload |
| Nurse's contrast calls and 'high-contrast-volume' | half and all of the ceiling the learner stated, and the event at contrastBudget.ts's warning fraction (0.8) of it | LAB_BUILD_PLAN section 4 (`CONTRAST_BUDGET_DEFAULTS`, docs/realism/facts/S9.md); measured against the stated ceiling so the live screen never shows the rules' own limit |
| Ceiling | correct at or below the stricter of Brilakis 3.7 × eGFR and Oxford 5 mL/kg (contrastBudget.ts), and with an eGFR below 30 at or below twice the creatinine clearance | Brilakis 28.3 (05-patient-complications.ts:704-705) |

## Scenarios (scenarios/preorders.ts, PREORDER_CASES in preorders.ts)

All values are scenario settings chosen to make each case teach its lesson.

| Scenario | Seed | Settings |
|---|---|---|
| oac-af-low-risk | preorders-oac-af-low-risk-0 | Stable angina, booked for PCI; AF on apixaban 5 mg twice daily, last dose 72 h before arrival (effect from the formulary's DOAC half-life); creatinine 85 µmol/L (clearance 86 mL/min); LVEF 60% |
| oac-mechanical-valve | preorders-oac-mechanical-valve-6 | Booked for PCI; warfarin for a mechanical mitral valve, INR today 2.9; sinus; creatinine 90; LVEF 55% |
| oac-rheumatic-mitral | preorders-oac-rheumatic-mitral-9 | Booked for PCI; warfarin for rheumatic mitral stenosis with AF, INR today 2.6; creatinine 80; LVEF 55% |
| oac-lv-thrombus | preorders-oac-lv-thrombus-2 | Angiography; warfarin for a mobile, protruding (non-laminar) LV apical thrombus, INR today 2.4; LVEF 35%; on daily aspirin |
| warfarin-inr-high | preorders-warfarin-inr-high-5 | Angiography, planned femoral; warfarin for low-risk AF, INR today 3.4 |
| elective-pci-preload | preorders-elective-pci-preload-2 | Stable angina, booked for PCI; on daily aspirin; no anticoagulant |
| nste-early-angio | preorders-nste-early-angio-7 | NSTEMI for early angiography; ischaemic stroke 3 years ago; 72 years, 72 kg |
| stemi-opioids | preorders-stemi-opioids-15 | STEMI; morphine in the ambulance (fentanyl 100 µg in the model); clarithromycin 500 mg twice daily; 71 years, 89 kg |
| ckd-egfr-28-metformin-nsaid | preorders-ckd-egfr-28-metformin-nsaid-0 | Stable angina, diabetic, creatinine 215 µmol/L (eGFR 28, clearance 34); metformin, ibuprofen 400 mg three times daily, atorvastatin 80 mg; LVEF 55% |
| ckd-low-ef | preorders-ckd-low-ef-6 | Stable angina, creatinine 180 µmol/L (eGFR 28, clearance 36); LVEF 30%; atorvastatin 80 mg |

Regimens named in the pre-procedure record (modules/preorders.ts, `sheetLines`), scenario settings (MODEL PARAMETER):

| Line | Value | Rests on |
|---|---|---|
| Daily aspirin | 75 mg daily, last dose this morning | Scenario setting for the patients on daily aspirin (oac-lv-thrombus, elective-pci-preload, ckd-egfr-28-metformin-nsaid, ckd-low-ef). The engine carries its effect as `chronicAspirin` above, and the handover's antithrombotics carry that dose, marked as the patient's own (not a load) |
| Metformin | 1 g twice daily, last dose this morning with breakfast | Scenario setting for ckd-egfr-28-metformin-nsaid; only the hold and the restart are scored |

Every seed was chosen so that the planning module's planted problem of the pre-procedure record is out-of-date bloods or an undiscussed do-not-resuscitate order, which do not touch the order sheet (preorders.test.ts checks it).
