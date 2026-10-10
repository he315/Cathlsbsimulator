# found-lab-session-plumbing: model parameters

The shared lab plumbing: the event log with hold windows (`src/ui/lab/eventLog.ts`), the engine-vitals-to-events adapter (`src/ui/lab/patientEvents.ts`), the decision ledger (`src/mentor/ledger.ts`) and the run logging (`src/state/useProgressStore.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the ACT goals in `ACT_GOALS_S` (lesson pm-antithrombotics-heparin's goal table: Brilakis 2.8 and 3.4 Hemochron 300 s, Brilakis 3.4 HemoTec 250 s, Brilakis 3.4 and 3.5 with a GP IIb/IIIa inhibitor or cangrelor 200 s, Oxford ch 8 250 s, the default `actGoalS`); `highLvedpMmHg` 12 mmHg (Oxford ch 4, lesson hb-cardiac-catheterisation-lhc, normal 3-12 mmHg); `oedemaLvedpMmHg` 30 mmHg (Oxford ch 4, lessons hb-cardiac-catheterisation-lhc and cm-flow-embolism-oedema-cholesterol).

## Patient-event thresholds (patientEvents.ts `PATIENT_EVENT_THRESHOLDS`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `hypotensionMapMmHg` | src/ui/lab/patientEvents.ts | 65 | mmHg (displayed MAP) | MODEL PARAMETER named in LAB_BUILD_PLAN (found-lab-session-plumbing) |
| `hypotensionHoldS` | src/ui/lab/patientEvents.ts | 10 | s | MODEL PARAMETER, same source: the MAP must stay below the threshold this long |
| `bradycardiaHr` | src/ui/lab/patientEvents.ts | 50 | bpm (displayed HR) | MODEL PARAMETER named in LAB_BUILD_PLAN (found-lab-session-plumbing) |
| `desaturationSpo2` | src/ui/lab/patientEvents.ts | 90 | % | MODEL PARAMETER: the engine's own SpO2 alarm limit (engine.ts alarmTick) |
| `chestPainScore` | src/ui/lab/patientEvents.ts | 3 | pain score 0-10 | MODEL PARAMETER |
| `oedemaDyspnoea` | src/ui/lab/patientEvents.ts | 0.5 | breathlessness 0-1 | MODEL PARAMETER: together with desaturation, pulmonary oedema on the clinical picture |
| `contrastFraction` | src/ui/lab/patientEvents.ts | 0.8 | share of the maximum acceptable contrast dose | MODEL PARAMETER; LAB_BUILD_PLAN section 4 sets the warning at 80% of the ceiling. A lab can replace it with contrastBudget's check |
| `effusionMl` | src/ui/lab/patientEvents.ts | 20 | mL | MODEL PARAMETER: smallest pericardial effusion reported, and only while an echo is looked at |
| `tamponadeMl` | src/ui/lab/patientEvents.ts | 100 | mL | MODEL PARAMETER: pericardial volume that, with the displayed MAP below `hypotensionMapMmHg`, raises 'tamponade' |

## Event holds (eventLog.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `TRANSIENT_HOLD_S` | src/ui/lab/eventLog.ts | 30 | s | MODEL PARAMETER: long enough to read a tip of one to four sentences and act on it |
| `EVENT_HOLD_S` | src/ui/lab/eventLog.ts | vf 2, vt 2 | s | MODEL PARAMETER: VF and VT stay active only while the lab keeps raising them, so their tips go as soon as the rhythm is treated |

## Storage bounds (app settings, not clinical values)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MAX_METRICS_PER_ROW` | src/state/useProgressStore.ts | 32 | metrics per logbook row | Labelled MODEL PARAMETER of the app: storage bound (the logbook lives in one localStorage key) |
| `DECISION_ROWS_KEPT` | src/state/useProgressStore.ts | 200 | rows | App setting: only the most recent rows keep their decisions |
| `MAX_DECISIONS_PER_RUN` | src/mentor/ledger.ts | 60 | decisions | App setting: storage cap; later records replace the oldest |
| `DECISION_ID_MAX`, `DECISION_TEXT_MAX`, `DECISION_TIPS_MAX` | src/mentor/ledger.ts | 80, 160, 8 | characters, characters, tip ids | App setting: longer text is cut with an ellipsis |
