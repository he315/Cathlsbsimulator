# diag-acs-scenarios: model parameters

The ACS front end of the diagnostic lab: the pre-brief 12-lead with right-sided and posterior leads, STEMI mode (reperfusion clock and engagement order), the triage after a resuscitated arrest, a postpartum SCAD, culprit studies with a previous study, and an iatrogenic occlusion. Every value below marked MODEL PARAMETER is a choice made to make the case or the drawing teach its lesson; none comes from a source. Values that come from the module text are listed separately with their location.

## Sourced values (module text, not model parameters)

| Value | Where it is used | Source |
|---|---|---|
| ST elevation of at least 0.5 mm in V7-V9 for a posterior STEMI (`POSTERIOR_ST_MM`) | `src/simulation/ecg12.ts` `extendedStemi` | cp-acs-thrombus-ecg, 2023 ESC supplementary data Figure S2 table (`src/content/manual/complex-pci/07-acs-thrombus.ts`, 'Job 1: the activation ECG') |
| 1 mm in every lead other than V2-V3, V3R and V4R counted among the contiguous leads (`OTHER_LEADS_ST_MM`) | `ecg12.ts` `extendedStemi` | same table |
| Primary PCI within 120 minutes of the STEMI diagnosis, timed from the diagnosis (`REPERFUSION_LIMIT_MIN`) | `src/mentor/rules/diagAcs.ts` `reperfusionClock` | cp-acs-thrombus-reperfusion, Oxford's reperfusion decision steps 1 and 3 (`07-acs-thrombus.ts`) |
| Resuscitated arrest with persistent ST elevation: primary PCI strategy, 2023 ESC class I, level B; stable without ST elevation: routine immediate angiography not recommended, class III, level A | `diagAcs.ts` `OHCA_RECOMMENDATIONS`, `scoreOhcaTriage` | cp-complex-patients-ohca, 'Who needs emergency angiography' table (`src/content/manual/complex-pci/08-complex-patients.ts`) |
| Oxygen only below 90% saturation, 100% for air embolism; immediate PCI; no thrombolysis; no routine balloon pump (`OXYGEN_BELOW_SAT_PCT`) | `diagAcs.ts` `scoreIatrogenic` | cm-principles-closure-pmi, STEMI during catheterisation (`src/content/manual/complication-management/01-principles-closure.ts`) |
| Engagement order: anterior STEMI, guide into the left main first; non-anterior, diagnostic angiography of the left first | `diagAcs.ts` `scoreEngagementOrder`, rule `stemi-rca-before-left` | pm-target-culprit, 'Brilakis's recommended engagement order in STEMI' (`src/content/manual/pci-manual/10-target.ts`); tip diag-stemi-engagement-order cites Brilakis 20.5 |
| Culprit clues and the no-culprit work-up order (review the runs, ventriculogram or echo, OCT, cardiac MR) | `src/simulation/diagnosticScenarios/acs.ts` `CULPRIT_CLUES`, `NO_CULPRIT_STEPS` | pm-target-culprit, the culprit-signs table and 'No obvious culprit: the work-up' (`10-target.ts`) |
| LBBB and RBBB features the templates are set to show (QRS over 120 ms; no Q and a monomorphic R in I, V5, V6; ST-T opposite the QRS; rsR' in V1-V3; slurred S in I, aVL, V5-V6) | `ecg12.ts` templates | cp-acs-thrombus-ecg, ESC Figure S2 patterns table |

## src/simulation/ecg12.ts

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| V3R, V4R lead vectors (`EXTRA_LEAD_VECTORS`) | V3 and V4 of Dower's table with x negated: V3R [-0.882, 0.098, -1.277], V4R [-1.213, 0.127, -0.601] | Frank coefficients | Mirror of the left chest positions across the sagittal plane; Dower's table has no right-sided leads |
| V7, V8, V9 angles behind the x axis on V6's horizontal plane (`MP_POSTERIOR_LEAD_DEG`) | 45, 65, 85 | degrees | Posterior axillary, mid-scapular and paraspinal lines continuing V6's sweep (V6 sits about 15 degrees behind x); magnitude V6's horizontal magnitude, y as V6 |
| RV weight in the pre-brief injury vector (`MP_PREBRIEF_RV_WEIGHT`) | 1 | weight | The engine counts the RV at 0.5; the right-sided leads lie over the RV, so a single dipole at 0.5 would hide V4R elevation in a proximal RCA occlusion |
| Pre-brief ST injury gain (`MP_PREBRIEF_ST_GAIN`) | 1.5 | mV per unit of myocardial share | An established occlusion; the engine's resting gain is 1.0 with injury growing over minutes. With it a proximal RCA occlusion gives about 5 mm in III and 1.6 mm in V4R, a mid circumflex occlusion about 0.6 mm in V7-V9 |
| Diffuse subendocardial ST vector (`MP_DIFFUSE_SUBENDOCARDIAL_ST`) | [-0.12, -0.145, -0.045] | mV, Frank | Depression of 1 mm or more in six leads with elevation in aVR, the module's multivessel or left main pattern |
| T-wave inversion vectors (`MP_T_INVERSION`) | lateral [-0.36, -0.08, -0.12]; anterior [-0.04, -0.02, 0.38] | mV, Frank | Inverted T in I, aVL, V5-V6 (lateral) or V1-V4 (anterior) without ST elevation |
| LBBB QRS pulses | centres -35 and +25 ms; sigmas 22/24 and 26/30 ms; vectors [0.42, 0.08, 0.55] and [0.88, 0.22, 0.62] | s, mV | Leftward and posterior activation without the septal q |
| LBBB T vector | [-0.24, -0.06, -0.28] | mV | Discordant T |
| RBBB terminal pulse | centre +55 ms, sigmas 16/22 ms, vector [-0.42, 0.06, -0.5], added to the normal QRS | s, mV | Late rightward, anterior force: R' in V1, S in I and V6 |
| RBBB T vector | [0.27, 0.22, 0.06] | mV | The normal T, slightly posterior |
| RBBB J point (`qrsWindow`) | +90 ms after R (QRS onset -45 ms) | s | QRS over 120 ms |
| Secondary ST of LBBB and paced beats (`SECONDARY_ST`) | LBBB [-0.07, -0.015, -0.1]; paced [-0.06, 0.08, -0.06] | mV | ST opposite the main QRS; used by the pre-brief strip only, not the engine's beats |
| Strip QT | 0.40 × sqrt(RR) | s | Bazett with a corrected 0.40 s |
| Strip PR default | 0.16 | s | Normal conduction |
| Strip first R peak, length, rate | 0.35 s, 2.5 s, 250 Hz | s, Hz | One cell of a 12-lead printout at the engine's sample rate |

## src/simulation/diagnosticScenarios/acs.ts

Chart values (age, sex, height, weight, eGFR, echo notes, drugs, arrest history), lesion values (vessel, position, severity, thrombus grade) and the ECG heart rates are scenario data chosen for each case.

| Scenario | Parameter | Value | Unit | Rests on |
|---|---|---|---|---|
| diag-stemi-anterior | culprit lesion; ECG occlusion on the textbook network | LAD 0.1, 100%, thrombotic grade 5; LAD 0.05 | fraction, % | Proximal LAD. The module text supports only that septal involvement points to the LAD proximal to its septal branches (cp-acs-thrombus-ecg); the drawing's exact lead pattern at this level is a MODEL PARAMETER |
| diag-stemi-anterior | minutes from diagnosis to the table | 45 | min | Scenario choice |
| diag-stemi-inferior-rv | culprit; ECG occlusion | RCA 0.08, 100%, grade 5; RCA 0.05 | fraction | Upstream of the RV branches |
| diag-stemi-inferior-rv | minutes from diagnosis | 50 | min | Scenario choice |
| diag-stemi-posterior | culprit; ECG occlusion | LCx 0.45, 100%, grade 5; LCx 0.38 | fraction | Beyond the obtuse marginal on the network, so the standard 12 leads show depression only |
| diag-stemi-posterior | minutes from diagnosis | 60 | min | Scenario choice |
| diag-lbbb-paced | culprit; conduction | LAD 0.3, 100%, grade 4; LBBB | fraction | Scenario choice; the patient engine draws narrow beats (no bundle branch block in the engine) |
| diag-ohca-st-elevation | culprit; ECG occlusion | RCA 0.5, 100%, grade 5; RCA 0.5 | fraction | Inferior elevation without V4R |
| diag-ohca-no-st | lesion | LCx 0.35, 80%, severe stenosis | fraction, % | A coronary cause to find at the delayed study |
| diag-ohca-post-rosc (core pack) | ECG occlusion | LAD 0.2 | fraction | The core pack's LAD lesion at 0.2 |
| diag-scad-postpartum | SCAD lesion | LAD 0.5, 90%, type drawn by the seed | fraction, % | Scenario choice |
| diag-scad-postpartum | iatrogenic dissection on deep intubation | engine occlusion LAD 0.04, fraction 0.7 | fraction | A flow-limiting proximal tear. The injection-into-a-damped-trace trigger was removed: the script has no condition that holds only at an injection given into a damped trace |
| diag-scad-postpartum | ECG level | not graded (null) | n/a | The module text does not support a level from this ECG |
| diag-no-visible-culprit | lesions | LCx 0.4 30%, RCA 0.5 25% | fraction, % | No stenosis of 50% or more |
| diag-iatrogenic-occlusion | embolus on the first right coronary run | engine occlusion RCA 0.7, fraction 1 | fraction | A distal embolus |
| diag-iatrogenic-occlusion | saturation, on-site PCI | 97%, yes | %, n/a | Normal saturation: oxygen not indicated |
| diag-two-candidate-culprits (lesions pack) | previous study lesions | RCA 0.35 CTO (as the case), no circumflex lesion | n/a | The old report: the RCA was occluded and filled from the left |
| diag-two-candidate-culprits | previous study runs | left LAO 30 caudal 25, left RAO 30 caudal 25, right LAO 30 | degrees | Standard views |

## src/mentor/rules/diagAcs.ts

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `stemi-rca-before-left` persistence, cooldown | 2, 30 | s | As the other technique rules |
| Clues required for a culprit (`MIN_CULPRIT_CLUES`) | 2 | clues | Lab request pm-interpreting#11 ('at least two supporting clues named each time'); not module text |

## src/ui/lab/EcgPrebrief.tsx

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| ECG drawing scale | 4 px per mm at 25 mm/s and 10 mm/mV | px | Display only |
| Previous study run | 15 frames/s, 3 s, JL4 or JR4, 200 mm field, breath hold 0.7 | n/a | A short diagnostic cine run as the simulated-flow drill films one |
| Reperfusion clock start | first time the case shows the clock, kept in useAcsStore (`clockStartedAt`) | ms | Display: the clock runs on across the pre-brief's steps |
