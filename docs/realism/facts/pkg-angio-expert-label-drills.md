# angio-expert-label-drills: model parameters

Expert-label drills on the real angiogram library (`src/ui/angio/labels.ts`) and a simulated TIMI flow drill on generated runs (`src/ui/angio/simFlowDrill.ts`), with their screens in `src/ui/sections/RealAngiograms.tsx`.

Sourced values carry their location in the code and are not repeated as model parameters: Gibson's LAD correction of 1.7 (`LAD_CORRECTION`, pm-interpreting-flow); the TIMI grade definitions, with TIMI 2 graded against the proximal segment or an uninvolved artery (pm-interpreting-flow); the published normal frame counts, shown only once every key of `FRAME_COUNT_VALUE_KEYS` is verified against Gibson 1996 (`FRAME_COUNT_REF`); the label schemas (SYNTAX segments, ACC/AHA types, SCAI classes, NHLBI and TIMI options) as the module names them. Gibson's own landmark definitions are not used because they could not be verified (docs/curriculum/evidence/pm-interpreting.md).

## Simulated flow drill (simFlowDrill.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `SIM_FLOW_LANDMARK` | src/ui/angio/simFlowDrill.ts | LAD 0.9, LCx 0.9, RCA 0.85 | fraction of the vessel's length | MODEL PARAMETER: the distal points at which the transport's frame-count analogue was calibrated to Gibson's normal counts (xray.test.ts, 'reproduces the normal TIMI frame counts') |
| `SIM_FLOW_ORIGIN` | src/ui/angio/simFlowDrill.ts | 0.02 | fraction of the length | MODEL PARAMETER, as the calibration: where the counted transit starts |
| `SIM_FLOW_OCCLUSION_AT` | src/ui/angio/simFlowDrill.ts | 0.35 | fraction of the length | MODEL PARAMETER: where the TIMI 0 run's vessel is occluded |
| `SIM_FLOW_SETTINGS` | src/ui/angio/simFlowDrill.ts | LAD: TIMI 2 slow beyond 0.3 at 0.45, TIMI 1 at 0.06, TIMI 0 occluded. LCx: flow scale 0.35 (TIMI 2), 0.06 (TIMI 1). RCA: TIMI 2 slow beyond 0.3 at 0.35; TIMI 1 flow scale 0.06 with slow beyond 0.3 at 0.3 | share of resting flow | MODEL PARAMETERS chosen so the transport, graded by engineGrade, gives each grade (simFlowDrill.test.ts checks every spec); not physiological flows |
| `SIM_FLOW_GRADING` | src/ui/angio/simFlowDrill.ts | beyondShare 0.05, fillShare 0.5, slowRatio 1.4 | shares; multiple of the normal transit | MODEL PARAMETERS: the module's definitions are qualitative ('none' beyond the obstruction; the landmark 'filled'; 'perceptibly slower') |
| `SIM_FLOW_RUN_S` | src/ui/angio/simFlowDrill.ts | `CINE_RUN_S` + 1.6 | s | MODEL PARAMETER: the lab's cine run plus time to see the distal bed fill and begin to clear |
| `SIM_FRAME_TOLERANCE` | src/ui/angio/simFlowDrill.ts | 3 | frames at the run's rate | MODEL PARAMETER: a learner's count within this agrees |
| `SIM_FLOW_SPECS` rates | src/ui/angio/simFlowDrill.ts | 15 and 10 | frames per s | The two rates of the real library, so counts at different rates have to be compared through the rate |
| `SIM_FLOW_VIEW` | src/ui/angio/simFlowDrill.ts | LAD RAO 30 cranial 30; LCx RAO 30 caudal 25; RCA LAO 30 | degrees | MODEL PARAMETER (choice of view): the diagnostic view presets' angles |
| `SAMPLE_HZ` | src/ui/angio/simFlowDrill.ts | 60 | Hz | Numerical setting: sampling of the transport for grading |

## Label drills (labels.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `FRAME_TOLERANCE_DEFAULT` | src/ui/angio/labels.ts | 3 | frames either side of the reader's count | MODEL PARAMETER: when the reader states no tolerance |
| `LABEL_PER_CLASS` | src/ui/angio/labels.ts | 3 | items per stratum | MODEL PARAMETER: a set of 5-10 minutes |
| `LABEL_GATE_MIN` | src/ui/angio/labels.ts | 20 | labelled runs per drill | Planning parameter from lab-build-plan.json (angio-expert-label-drills), not a source value: a drill is shown only with at least this many |
