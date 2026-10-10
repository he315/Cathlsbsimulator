# proc-recovery-ward: model parameters

The recovery ward of the full case: the observation schedule and mobilisation plan, the sets of observations, the ward's events and their first-action menus, the stroke on the table and the follow-up vignettes (`src/simulation/session/ward.ts`), the session's ward plumbing (`src/simulation/session/caseSession.ts`), the new delayed kinds (`src/simulation/access/closure.ts`) and the ward scenarios (`src/simulation/session/scenarios/ward.ts`).

Sourced values carry their module-text location in the code and are not repeated as model parameters: Oxford's arrival steps (pulse and blood pressure, a quick neurological check, every access site), observations every 15 minutes for the first hour, every 30 minutes for the second, then hourly, the radial site every 15 minutes until the band is off, the femoral site with the femoral, popliteal and pedal pulses every 15 minutes until mobile, three-lead ECG monitoring after a stent (`OXFORD_WARD`; `src/content/manual/cath-handbook/09-after-the-procedure.ts` :284-316); walking after about 1 hour after radial access or a closure device, flat for 1 hour and walking from 2 1/2 hours after a 6 F femoral arterial puncture (Oxford ch 11), up after 3 hours of bed rest (Oxford ch 3) (:345-350); the first actions for chest pain after PCI (12-lead ECG first, then the operator), hypotension and tamponade (senior help and fluids while looking for the reversible causes, echo, pericardiocentesis), stroke (ABC, onset time, stroke team, examination written down, CT with CT angiography, the antithrombotic drugs reviewed) and a rising creatinine (hydration with normal saline, recheck at 48-72 hours or later) (:365-373), and the pitfalls (:408-416: nitrate before the ECG, hypotension put down to dehydration, a normal 48 hour creatinine taken as the end of it); 'aspirin before imaging' wrong in a late stroke (`02-flow-embolism.ts` :626-646); the end-of-case check of speech and all four limbs (Brilakis 5.5, `02-flow-embolism.ts` :620, :668); the forearm haematoma's management (re-site the band or a second band, press and elevate; the doctor informed from grade II) (`06-access-complications.ts`, 'Access-site bleeding' and the grading table), the groin haematoma pressed just proximal to the skin puncture (same file :254); the stroke on the table (stop, the stroke team, emergency CT with CT angiography; the heparin given bears on thrombolysis) (`06-to-the-root.ts` :1352-1357); cholesterol embolisation's pattern (livedo reticularis, blue toes, palpable pulses, renal impairment beyond 2 weeks, raised eosinophils) and supportive treatment, against acute limb ischaemia and contrast nephropathy (`02-flow-embolism.ts` :770-797). Oxford's and the KDIGO (ESUR 2018) definitions of the creatinine rise (44 µmol/L or more than 25%; 26.5 µmol/L or 1.5 times baseline) are the lesson's (:373). Everything below is a MODEL PARAMETER or a scenario setting.

## The plan (ward.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Observation intervals accepted | no longer than Oxford's in each period | min | Oxford's frequencies are 'typical', adjusted by nursing judgement (:311): observing more often is not wrong; less often, or none in a period, is |
| `MP_WARD.walkShortFromMin`, `walkShortToMin` | 45, 90 | min | 'About 1 hour' to walking after radial access or a closure device, read as 45-90 minutes |
| `MP_WARD.flatShortMaxMin` | 30 | min | After radial access or a device no bed rest is needed; up to 30 minutes flat is accepted |
| `MP_WARD.smallFemoralSheathMaxFr` | 5 | F | Oxford groups 'a small femoral sheath' with radial access and a device (about 1 hour to walking, :348) and gives the longer plan for a 6 F puncture (:349); a manual femoral closure of a sheath up to 5 F accepts the short plan (or the 6 F plan), and from 6 F the 6 F figures apply. The working site's sheath size is the one that came out (`sheathHistory`), else the compression's |
| Stented, without a LabReport | the case's own PCI (`labsDone` includes 'pci'); the occlusion at the case's first lesion | n/a | Until the live PCI lab passes its LabReport back, the session's own PCI record stands in for the reported stents (a balloon-only PCI counts too) |
| `MP_WARD.arrivalWindowS` | 900 | s | A plan written within 15 minutes of arrival takes the arrival set then; later, the arrival set is missed |
| `MP_WARD.occlusionPainMaxS` | 120 | s | A stent thrombosis is reported by the patient once the engine's ischaemia meets its STEMI criteria (about 20 s after the occlusion in ward-chest-pain-post-pci), so an ECG recorded at the report shows the change; this is the latest the report comes if the criteria are not met. No source: a timing of the simulation |
| `MP_WARD.tableStopAfterS` | 60 | s | The attending stops the case after a stroke on the table once the learner has made a first move, or after this wait without one, so the stop does not give the first action away. No source: a timing of the simulation |
| Ward plan not written | scored as not written when the case started on the ward, an event happened there, or the ward ran past `arrivalWindowS` | n/a | A case finished as the patient reaches the ward (the autopilot's runs) is not scored for a ward it never ran |
| Times from arrival | the recovery hook (every site closed) | n/a | The femoral line comes out at the closure, so 'after the line is removed' and 'after arrival' are the same moment in the case |

## Sets and findings (ward.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Blood pressure in a set | the engine's true aortic systolic and diastolic, rounded | mmHg | A cuff reading with no error model |
| `MP_WARD.palpableMl` | 2 | mL | A haematoma is felt at a site check from this volume |
| `MP_WARD.reportMl` | 60 | mL | Without a site check the patient complains of the swelling once it reaches this volume |
| `MP_WARD.lowSysMmHg`, `highHr` | 100, 100 | mmHg, bpm | A set shows a tamponade when the systolic is below 100 or the pulse above 100 |
| `MP_WARD.faintSysMmHg` | 85 | mmHg | Without a set, the patient feels faint and calls the nurse once the systolic is below this |
| `MP_WARD.echoEffusionMl`, `echoCollapseMl` | 30, 120 | mL | The bedside echo reports an effusion from 30 mL of pericardial blood and right heart collapse from 120 mL (the engine takes the systolic below 100 mmHg somewhere between about 110 and 135 mL, by patient) |
| `MP_WARD.actionS` | 30 | s | Each first action on the ward takes this long on the session clock |
| `MP_WARD.stentParamDefault` | 0.3 | 0-1 along the vessel | Where a stent thrombosis occludes the stented vessel when the case gives no lesion on it |
| Recognised at the set where it first appeared | the first action before the next scheduled set | n/a | The lab request's 'every event recognised at the observation where it first appears' |
| Popliteal pulse (caseSession.ts `wardPulseText`) | the weaker of the femoral and foot pulses | n/a | The pulse model has no popliteal pulse of its own |
| A recovery time-lapse stops at a finding | the lapse ends when the ward finds an event | n/a | The nurse calls the doctor; a UI behaviour |

## The table and follow-up (ward.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_WARD.tableStrokeAfterClot` | 0.3 | probability | An embolic stroke after a catheter clot is flushed into the aorta (the session's clot-flushed critical); the module gives no rate per event; certain in table-embolic-stroke |
| `MP_WARD.tableStrokeAfterAir` | 0.1 | probability | An embolic stroke after air is flushed into the root (the air-embolism critical); lower, because the model sends root air to the coronary |
| Stroke deficit on the table | word-finding difficulty and a weak right hand | n/a | The deficit of the lesson's case (06-to-the-root.ts :1352) |
| `MP_WARD.cholesterolChance` | 0.1 | probability | The vignette's chance in a patient with a diseased aorta and wireless exchanges; the module's 1.4% (Fukumoto, 1,786 patients) is the rate over all routine cases, not this group's; certain in followup-cholesterol-emboli |
| The 48-72 hour creatinine without a scenario rise | the creatinine before the procedure | µmol/L | No model of contrast nephropathy: only a scenario schedules a rise |

## Scenario settings (scenarios/ward.ts)

| Setting | Value | Unit | Rests on |
|---|---|---|---|
| `DOSE_PER_FLUORO_MIN` | air kerma 25, kerma-area product 3 | mGy, Gy cm2 per minute of fluoroscopy | Gives a team report a dose with its time; it sets only the case totals |
| Team stent | LAD, 3.0 x 18 mm, 14 atm, post-dilated, generic drug-eluting stent | mm, atm | A plausible single stent; the occlusion reads only its vessel |
| Contrast in the team reports | 60-260 | mL | ward-radial (240) and ward-creatinine-rise (260) over the patient's Cigarroa ceiling, so high-contrast-volume is raised |
| ward-radial chest ache | 50 min after closure, minor (no occlusion) | min | A chest ache after a stent with no new ECG change: the ECG still comes first |
| ward-forearm-haematoma | from 20 min, 1.2 mL/min up to 150 mL | min, mL/min, mL | Found at 30 min with 15-minute checks (12 mL), at 60 min with hourly checks (48 mL), by the patient at 60 mL with none |
| ward-chest-pain-post-pci | 40 min after closure, major (the LAD occluded until the operator is called) | min | The engine's ischaemia, pain and ST elevation follow the occlusion |
| ward-tamponade-after-perforation | from 15 min, 3 mL/min up to 140 mL | min, mL/min, mL | In this patient the engine's systolic is 124 mmHg at the 45 minute set and 86 mmHg at the 60 minute set (about 135 mL), so Oxford's schedule finds it at 60 minutes; capped at 140 mL (systolic about 74 mmHg) so the untreated patient is hypotensive, not in arrest, and feels faint (below 85 mmHg) without a set |
| ward-stroke-late | 150 min after closure | min | 'Hours after the study' (:372) |
| ward-creatinine-rise | 160 µmol/L before, 218 µmol/L at 48 hours | µmol/L | A rise of 58 µmol/L (36%), over both definitions the lesson gives |
| Patients | ages, sex, weight, creatinine | n/a | Chosen so nothing in the chart competes with the drill |

## Plan-form choices (RecoveryPanel.tsx)

The interval and time choices the plan form offers (observations every 5-120 minutes or none; site checks every 10-60 minutes or none; flat 0-180 minutes; walking from 30-240 minutes) are control settings, not clinical values. Nothing is preset.
