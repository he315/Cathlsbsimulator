# physiology-anoca-cft: model parameters

The coronary function test in ANOCA with acetylcholine provocation: injection-level thermodilution, the hyperaemia markers and the display beat (`src/simulation/physiology.ts`), the study, its acetylcholine model, the presets and the debrief (`src/simulation/physiology/ach.ts`), and the panel (`src/ui/physiology/CftPanel.tsx`).

Sourced values carry their module-text location in the code and are not repeated as model parameters. All are from lesson pm-physiology-microvascular (`src/content/manual/pci-manual/14-physiology.ts`) unless named otherwise: GTN at most 200 µg before any reading and its half-life of about 2 minutes (protocol step 4); 3-4 mL of room-temperature saline from a 5 mL syringe, the same volume and force each time, until three transit times lie within 10%, and their mean is the value (step 5); IV adenosine 140 µg/kg/min and the four markers of real hyperaemia (step 6); the drift check, 0.03 or more means re-equalise and repeat (step 7); acetylcholine last (step 8); CFR abnormal below 2.0 (CorMicA) or below 2.5 (UK consensus), IMR 25 or more, FFR above 0.80 confirms no epicardial lesion (table 'What is measured', steps 3 and 6; `CUTOFF`, `CUTOFF_SOURCES`); the three acetylcholine regimens and the 18.2 µg/mL solution (table 'Acetylcholine regimens in use'; `ACH_PROTOCOLS`); the response criteria, 90% or more epicardial constriction and 20% or more during the infusion (table 'Reading the response'); two views at least 30° apart ('Imaging for QCA'); the safety steps (pads, pacing, halved RCA dose, nitrate then atropine for spasm, atropine and pacing for AV block, aspirate the guide after an infusion; 'Safety during acetylcholine'); the endotypes and treatment directions (table 'Endotype, then treatment'). The systemic signs of IV adenosine, a systolic fall of about 10 mmHg and a heart-rate rise of 5-10 beats/min, are those of tip pci-phys-iv-hyperaemia-signs (Brilakis 12.2, Oxford ch 8). The IV adenosine time course is the engine's (pharmacology.ts `ivAdenosineSteadyLevel`, `ivAdenosineTauS`, the sourced time to maximum by site). Everything below is a MODEL PARAMETER.

## Thermodilution and hyperaemia markers (physiology.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_TD_CV` | 0.03 | coefficient of variation | Scatter of one transit time with the same volume and force each time; small enough that three such injections agree within 10% more than nine times in ten |
| `MP_TD_CV_INCONSISTENT` | 0.15 | coefficient of variation | Scatter with a varying volume, a volume outside 3-4 mL or a slow push (the lesson's pitfall: scattered curves from inconsistent injections); three such injections agree within 10% less than six times in ten |
| `MP_TD_SAME_VOLUME_ML` | 0.5 | mL | Two injections count as the same volume within this |
| `MP_TD_MIN_FACTOR` | 0.3 | share of the true mean transit time | Floor on a scattered transit time (`tdTransitTime`), so a far-tail draw cannot give a zero or negative time |
| `MP_WAVE_MARKER_H0` | 0.75 | hyperaemia fraction | The distal waveform starts to change (notch filling, early-diastolic dip) above this; chosen with `MP_MARKER_ON` so that the waveform markers appear at hyperaemia 0.9, the pressure-wire session's submaximal threshold (`MP_SUBMAXIMAL_H`), so confirmed markers mean maximal hyperaemia for the study |
| `MP_MARKER_ON` | 0.6 | share of the full change | Ventricularisation and the lost notch count as present (reached at hyperaemia 0.9) |
| `MP_VENT_DIP_MMHG` | 6 | mmHg | Early-diastolic dip of a fully ventricularised distal trace below the aortic (`distalBeat`) |
| `distalBeat` notch window | phases 0.32-0.44 | fraction of the cycle | The incisura of `aorticPressure`'s piecewise shape, filled in on the distal trace in proportion to the waveform change; display only |
| `MP_SYSTEMIC_H` | 0.5 | hyperaemia fraction | The patient feels the systemic effects of IV adenosine above this |
| `MP_SEPARATION_SHARE` | 0.6 | share of the rise | Pa and Pd count as separated once Pa − Pd has risen by this share of its rise from rest to maximal hyperaemia; an absolute threshold would never be met in microvascular disease, where the separation stays below 1 mmHg |

## The study and acetylcholine (ach.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Mean pressure fall with IV adenosine | 10 × hyperaemia | mmHg | The sourced systolic fall of about 10 mmHg, taken for the mean pressure as well (`cftVitals`) |
| Heart-rate rise with IV adenosine | 7.5 × hyperaemia | beats/min | The midpoint of the sourced 5-10 (`IV_ADENOSINE_HR_RISE_BPM`) |
| `ACH_READ_WINDOW_S` | 60 | s | A dose's response is read until 1 minute after it ends; derived from the stepped practice's angiography 1 minute after each injection. 'ach-provocation' is active from the start of a dose to the end of this window, or while its spasm lasts |
| Acetylcholine refused while adenosine acts | hyperaemia above `MP_REST_H` (0.05, pwSession.ts) | hyperaemia fraction | The lesson orders adenosine before acetylcholine; the session gives no acetylcholine until IV adenosine has been stopped and worn off, so the acetylcholine event never coincides with adenosine |
| Hyperaemic injection flagged | the four markers not yet confirmed (`cftMarkers`), which happens below hyperaemia 0.9 (`MP_SUBMAXIMAL_H`, pwSession.ts) | | The lesson's criterion (protocol step 6: confirm hyperaemia by its markers); the waveform markers are tuned to appear at the session's submaximal threshold |
| `MP_ACH_ONSET_S` | 8 | s | From the start of a dose to pain and ECG change |
| `MP_ACH_BRADY_PER_UG` | 0.003 | fraction of the rate per µg (left-equivalent) | Heart-rate fall during a dose: 100 µg into the left takes 70 to 49 beats/min ("bradycardia is common") |
| `MP_ACH_BRADY_MAX` | 0.5 | fraction | The largest fall any dose causes |
| `MP_ACH_BRADY_TAU_S` | 8 | s | Recovery after the dose ends ("usually self-limiting") |
| `MP_ACH_RCA_AVB_UG` | 50 | µg | An RCA dose of this or more brings transient AV block, a labelled hazard; the lesson says a lower RCA dose (at most 50-80 µg) may reduce bradycardia but gives no incidence |
| `MP_ACH_AVB_S` | 15 | s | AV block lasts this long after the dose ends |
| `MP_ACH_ESCAPE_HR` | 35 | beats/min | Ventricular escape rate during the block |
| `MP_PACING_RATE_BPM` (pwSession.ts) | 70 | beats/min | Temporary pacing rate, reused |
| `MP_ATROPINE_SHARE` | 0.8 | share | Share of the acetylcholine slowing that IV atropine removes; it also ends the AV block |
| `MP_RCA_DOSE_WEIGHT` | 2 | multiplier | An RCA dose counts double against the left's thresholds (the lesson halves RCA doses for the same effect) |
| `MP_SPASM_PERSIST_S` | 300 | s | Unrelieved spasm resolves on its own after this |
| `MP_NITRATE_RELIEF_S` | 30 | s | Intracoronary nitrate (or intracoronary atropine) relieves spasm over this ("quickly") |
| `MP_GUIDE_DEAD_SPACE_ML` | 2 | mL | Acetylcholine left in the guide after an infusion through it; flushing or injecting contrast without aspirating gives it as a bolus |
| `MP_ACCIDENTAL_BOLUS_S` | 2 | s | The time over which that unaspirated acetylcholine goes in when the guide is flushed or contrast is injected |
| `MP_ANGIO_EYE_SD` | 0.05 | fraction of diameter | Observer error of the operator's eyeball estimate of the narrowing on a run (`angioEstimate`); seeded from the study's generator without advancing it |
| `MP_ANGIO_EYE_STEP` | 0.1 | fraction of diameter | The eyeball estimate is read to the nearest 10%; the live screen shows it, the measured value (QCA) only with the guided aids or after the classification |
| Stepped-dose gap | `ACH_PROTOCOLS.stepped.maxGapS` 180 s | s | Sourced (stepped practice: up to 3 minutes between doses); checked in the debrief (item 'step-gap-left' or 'step-gap-right', not an order error), from the end of one dose to the start of the next |
| `MP_CFT_DRIFT_BUILD_S` | 90 | s | A preset's drift builds linearly over this from the start; re-equalising removes it |
| `MP_SUBTHRESHOLD_CONSTRICTION` | 0.15 | fraction of diameter | A spasm-prone vessel below its threshold dose |
| `MP_USUAL_PAIN_SCORE` | 7 | 0-10 | Pain score of reproduced usual angina (above the chest-pain event threshold, patientEvents.ts) |
| `MP_NITRATE_MASK_SHARE` | 0.3 | share | A total GTN dose above 200 µg before the test leaves this share of a provoked spasm, without pain or ECG change (the lesson's pitfall: a large nitrate dose can mask spasm; the threshold is the lesson's 200 µg) |
| `MP_SPASM_EVENT_CONSTRICTION` | 0.5 | fraction of diameter | The context raises 'coronary-spasm' at this constriction |
| `MP_SPASM_POS` | 0.45 | fraction of vessel length from the ostium | Where acetylcholine spasm sits, upstream of the sensor parked 6 cm in; `cftCaseWith` adds the constriction there as a temporary lesion, so `cftPressures` and the distal trace fall during spasm, and the vessel strip draws it there |
| `MP_SPASM_LENGTH_MM` | 30 | mm | Length of that constricted segment (diffuse mid-vessel spasm); with a 95% constriction Pd/Pa falls well below 0.80 |
| Bradycardia and chest-pain events | `PATIENT_EVENT_THRESHOLDS` (50 beats/min, pain 3) | | The shared adapter's thresholds (patientEvents.ts), reused by `cftEvents` |
| `CFT_VIEWS` | RAO 30 caudal 20, RAO 30 cranial 30, AP cranial 40, LAO 40 cranial 30 | degrees | Common left coronary projections; separation is the angle between beam directions |

## Presets (ach.ts `ANOCA_PRESETS`)

| Preset | Physiology | Vasoreactivity | Drift | Rests on |
|---|---|---|---|---|
| anoca-cmd | the existing 'anoca' case: CFR potential 1.6, 25% mild lesion (CFR 1.6, IMR 47, FFR 0.99) | kind none, constriction 0.1, infusion 0.1 | 0 | The lesson's check question (CFR 1.7, IMR 34, FFR 0.90): abnormal by both CFR cut-offs |
| anoca-epicardial-spasm | CFR potential 3.6 (CFR 3.5, IMR 21) | epicardial spasm at 50 µg left-equivalent, 0.95 | 0 | 90% or more with the usual pain and ST elevation; the stepped regimen turns positive at its second dose, the UK bolus at once |
| anoca-microvascular-spasm | CFR potential 3.4, 20% lesion (CFR 3.3, IMR 22) | microvascular spasm at 100 µg, constriction 0.25 | +3.5 mmHg | The usual pain and ST depression without 90% constriction; the drift reads Pd/Pa about 1.04 at the ostium, above the 0.03 threshold |
| anoca-normal | CFR potential 3.6, 15% lesion | dilates (−0.1), infusion −0.05 | 0 | Normal CFR, IMR and FFR and no response |

Each preset's answer is checked against `classifyEndotype` of its true values with both CFR cut-offs (ach.test.ts).

## Panel (CftPanel.tsx)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `CFT_STEP_S` | 0.02 | s | Model clock step (setInterval, 50 Hz, as the physiology lab's `MODEL_STEP_S`); the traces read one memoised snapshot of the vitals per step |
| Sensor position shown | 60 | mm beyond the guide tip | The lesson's "at least 5 cm into the vessel"; display only |
| ECG shape | P 0.15, R 1.1, T 0.3 mV; ST +0.3 (elevation) or −0.18 (depression) mV | mV | A schematic lead; with AV block the P waves run at the sinus rate (`CftVitals.sinusHr`: the patient's own rate with the adenosine rise and the acetylcholine slowing) and the escape QRS is wide unless paced |
| Patient's pain line | pain at or above `PATIENT_EVENT_THRESHOLDS.chestPainScore` (3, patientEvents.ts) | 0-10 | The shared chest-pain event threshold, reused |
