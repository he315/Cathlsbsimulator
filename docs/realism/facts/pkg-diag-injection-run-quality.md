# diag-injection-run-quality: model parameters

Filling, streaming, catheter size and run mechanics in the diagnostic lab: the plunger force and the catheter's lumen (`src/simulation/injection.ts`, `src/data/catheters.ts`), the side holes' escape and the ostial mixing of a whole push (`src/render/xray/contrastTransport.ts`), the run analysis (`src/simulation/imaging/runQuality.ts`) and the run scenarios' start states (`src/simulation/diagnosticScenarios/runs.ts`).

Sourced values carry their location in the code and are not repeated as model parameters:

- The lumens: the 5 Fr diagnostic (1.19 mm), 6 Fr diagnostic (1.42 mm) and 6 Fr guide (1.80 mm) inner diameters are manufacturers' specifications already in `LUMENS` (facts I1.md). No 4 Fr inner diameter has been opened, so `lumenForCatheter` refuses a size below 5 Fr and the catalogue offers 5 Fr versions ('-5F') of the JL4 and JR4 only.
- `RUN_QUALITY.beatsMin` 3 beats: Oxford's vessel full for about 3 beats with reflux into the root, typically 5-10 mL left and 3-5 mL right (pm-acquiring-cine, `src/content/manual/pci-manual/08-acquiring.ts:539`, `:570`, `:654`; pm-interpreting-pitfalls, `09-interpreting.ts:608`, `:2026`).
- `RUN_QUALITY.pushDelayS` 1-2 s: Oxford, pedal first and inject after 1-2 seconds (`08-acquiring.ts:654`).
- `RUN_QUALITY.qfrFps` 12.5 frames per second, nitrate after the first projection, two projections with minimal foreshortening and overlap, brisk continuous injection, no zooming and no table movement: the FAVOR II Europe-Japan protocol as pm-physiology-derived gives it (`src/content/manual/pci-manual/14-physiology.ts:1114-1121`).
- `RUN_QUALITY.qfrLesionPct` 40-90 %: the intermediate stenoses of FAVOR III Europe (`14-physiology.ts:1142`).
- The causes of incomplete filling the scenarios are built on (small, especially 4 Fr, and side-hole catheters, large or ectatic arteries, poor engagement, high coronary flow in severe aortic stenosis, a weak injection): Brilakis, pm-interpreting-pitfalls (`09-interpreting.ts:329`) and pm-acquiring-cine (`08-acquiring.ts:580`).
- The root injection shares (`ROOT_INJECTION`, `rootInjectionShares`) are diag-anatomy-variants' model parameters, unchanged; this package only uses them as each ostium's seat capture (opt-in `BolusView.rootFill`, set by the diagnostic lab).

## The syringe and the catheter (injection.ts, contrastTransport.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `STANDARD_PLUNGER` | src/simulation/injection.ts | 0.7 | fraction of a full push | MODEL PARAMETER: the plunger fraction that gives the standard aimed flow (`TARGET_FLOW_ML_S`); it is the keyboard's default plunger force (src/input/settings.ts `keyboard.plungerForce`), so the default key push is the standard injection. The aimed flow scales linearly with the fraction and is capped by `MAX_HAND_FORCE_N` through the lumen in use |
| `SIDE_HOLE_ESCAPE` | src/render/xray/contrastTransport.ts | 0.3 | share of the injected flow | MODEL PARAMETER: the share that leaves through the side holes into the root instead of the end hole (the module text says side holes reduce the jet into the artery and let contrast escape into the aorta; no figure) |

## The run analysis (runQuality.ts RUN_QUALITY)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `fullInlet` | src/simulation/imaging/runQuality.ts | 0.8 | strength entering the artery, 0-1 | MODEL PARAMETER: at or above it the artery counts as full. The beats are counted from the first to the last moment at full strength, plus the washout: the time that last full-strength contrast takes to pass along the artery to its distal bed, which is the transport's own median terminal transit (`TransportNet.thetaEnd`) over the side's flow scale, so it adds no constant (`DiagnosticLabSession.judgePush`). Without the washout the count was the push alone, and a 3-5 mL right push through the lab's lumen (the hand gives about 2.1-2.3 mL/s through the 6 Fr diagnostic at the keyboard's force, and the lumen's dead volume leaves first) could never reach 3 beats |
| `refluxMinMl` | src/simulation/imaging/runQuality.ts | 0.1 | mL of full-strength contrast | MODEL PARAMETER: contrast spilled back from the full artery into the root (captured jet the coronary could not take, times the injectate's strength) at or above which the run shows reflux. Measured in the diagnostic lab session (diag-run-mechanics, 6 Fr JR4 and JL4, force 0.7, the lumen starting with saline, the tip seated with an aortic pressure trace: capture 1, seal 0.3): right 3.6 mL 0.18 mL and 3.1 beats, 4.9 mL 0.37 mL and 3.7 beats; left 4.1 mL 0.31 mL and 2.7 beats (under 3 beats, below Oxford's 5 mL), 5.5 mL 0.61 mL and 3.7 beats, 6.9 mL 0.68 mL and 4.4 beats, 8.3 mL 0.92 mL and 4.7 beats; with the lumen primed with contrast every value is higher. A tip with a damped or ventricularised trace (seal 0.9: the wedged tip overdrives the artery) spills 0.02-0.18 mL for the same pushes, so most of them are tagged no-reflux, which is the intended reading of a wedged catheter. A 3 mL push at 1 mL/s in high flow spills none |
| `streamingIndex` | src/simulation/imaging/runQuality.ts | 0.5 | mean mixing deficiency while pushing, 0-1 | MODEL PARAMETER (the plan: "the streaming threshold is a model parameter"). The deficiency is the transport's own (1 - smoothstep(`MIXING_JET.poor`, `MIXING_JET.full`, jet over native flow)). Measured (library case, beat 0.8 s, capture 1, seal 0.3): 3 mL at 1 mL/s at flow scale 1.8, 0.93; 8 mL forceful through the 6 Fr guide at 1.8, 0.02; the lab's 6 Fr diagnostic 10 mL push at rest, 0.05; a plunger fraction of 0.2 at rest, 0.60; the keyboard's fine push (0.35) at rest, 0.31; the 5 Fr lumen at full force at flow scale 1.6, 0.71; the 6 Fr diagnostic at full force at 1.6, 0.37; right side at 1.8: 5 Fr 0.85, 6 Fr diagnostic 0.24, 6 Fr guide 0.07 |
| `testPuffMl` | src/simulation/imaging/runQuality.ts | 3 | mL | MODEL PARAMETER (the plan's value): a push under it is a test puff, recorded with the tip's classification and not judged as a run |
| `pushingMlS` | src/simulation/imaging/runQuality.ts | 0.05 | mL/s | MODEL PARAMETER: flow above which the syringe counts as pushing (the samples the streaming index averages) |
| `panSpeedMmS` | src/simulation/imaging/runQuality.ts | 5 | mm/s | MODEL PARAMETER: table speed during cine above which the run is panned |
| `panTravelMm` | src/simulation/imaging/runQuality.ts | 3 | mm | MODEL PARAMETER: table travel during cine above which the run is panned |
| `breathHeldShare` | src/simulation/imaging/runQuality.ts | 0.9 | share of the run | MODEL PARAMETER: below it the patient was breathing during the run |
| `qfrPairDeg` | src/simulation/imaging/runQuality.ts | 25 | degrees between the beam axes | MODEL PARAMETER: FAVOR II asks for two projections with minimal foreshortening and overlap, not an angle; not sourced |
| `foreshorteningMin` | src/simulation/imaging/runQuality.ts | 0.8 | projected over true length of the lesion segment | MODEL PARAMETER |
| `overlapMarginMm` | src/simulation/imaging/runQuality.ts | 0.5 | mm beyond the two radii in the detector plane | MODEL PARAMETER: another vessel's projection this close to the lesion's overlaps it |
| `overlapNearMm` | src/simulation/imaging/runQuality.ts | 6 | mm in 3D | MODEL PARAMETER: vessel points this close to the lesion are its own neighbourhood (a branch origin), not an overlap |
| `nitrateDilation` | src/simulation/imaging/runQuality.ts | 0.02 | epicardial dilation, 0-1 (PatientEngine.epicardialDilation) | MODEL PARAMETER: at or above it nitrate is on board |

The distal arrival time a run must outlast (`stopped-early`) is the transport's own median terminal transit (`TransportNet.thetaEnd`, flow time at resting flow) divided by the side's flow scale; it adds no constant.

## The run scenarios (runs.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_AS_FLOW_SCALE` | src/simulation/diagnosticScenarios/runs.ts | 1.4 | resting coronary flow over the standard tree's, both sides | MODEL PARAMETER: high coronary flow in severe aortic stenosis (Brilakis, module text) without a figure; chosen so the 5 Fr lumen at full force streams (index 0.65 with the whole jet captured, 0.71 with 0.87 of it, the seat of the lab's start controls) and the 6 Fr diagnostic lumen with a firm push does not (0.28 and 0.37), against the threshold 0.5, with the lumen starting with saline. At 1.6 and 1.5 the 6 Fr push came within 0.05 of the threshold in the browser runs (0.47, 0.46), because the engine's live flow scale at the push was about 1.02. The patient engine does not model the high flow (its demand follows the rate-pressure product), so the factor multiplies the engine's live flow scale (`DiagnosticLabSession.flowScaleFor`) |
| `MP_ECTATIC_RCA_FLOW_SCALE` | src/simulation/diagnosticScenarios/runs.ts | 1.8 | flow of the ectatic RCA over the standard tree's RCA | MODEL PARAMETER: the render tree draws no ectasia, so the larger artery's larger flow is given here (large or ectatic arteries are a cause of incomplete filling, module text) |
| `RUN_SETUPS` catheters | src/simulation/diagnosticScenarios/runs.ts | JL4, JL4-5F, JR4-5F | catalogue ids | scenario data: the catheter at the root when each case opens |

## Realism re-capture (FluoroView.tsx, sceneBuilder.ts and contrastTransport.ts are renderer files)

The baseline set was re-captured on 10 October 2026 after the change as `diag-irq`: `__xrayCapture.baseline("diag-irq")`, then `live("pci", "diag-irq")` with the PCI lab open and `live("diagnostic", "diag-irq")` with the diagnostic lab open, in a tab emulating 1600 x 1000 on the development server on port 5173 (diagnostic lab frames 988 px, PCI lab frames 1280 px, the same frame sizes as the baseline; catheter mechanics at the default, case easy-left-0 with the JL4 seated selectively in the left main). It was scored with `python3 scripts/realism/report.py diag-irq` and compared with `python3 scripts/realism/compare_sets.py baseline diag-irq`.

Headline: 189 of 236 in both the baseline and diag-irq, every section unchanged (Background 7/14, Borders 3/4, Catheter 4/4, Contrast 15/24, Field 4/4, Geometry 36/46, Grey levels 17/18, Motion 21/31, Noise 17/18, Timing 59/66, Vessels 6/7). No row was lost and none gained, so no scorecard row was re-scored. Every frame of the ten offscreen scorecard sequences (the six reference views, the fluoroscopy and flush companions) is byte-identical to the baseline: the new paths are opt-in (`BolusView.vessel`, `BolusView.rootFill` and the side-hole seat are set only by the lab), the capture specs set none of them, and the specs' existing 6 Fr catheter and flow scale 1 give the same frames as before. The differing files are the metadata PNGs, which carry capture metadata, the dev_balloon and dev_stent device scenes, which already differed from the baseline in earlier sets because other packages edited the PCI device and bench files, and the two live-path sequences.

The live-path runs are measurements outside the pass count. live_diag_raocau has 37 of 64 values inside the real band (baseline 35, route-wire-led 37, dss-spasm 34). Its filling is slower than in the earlier sets because the push now passes through the 6 Fr diagnostic lumen at the keyboard's plunger force: rise 10-90 % 1.267 s (route-wire-led 1.067 s, dss-spasm 0.733 s) and 90 % filling 2.133 s (2.0 s, 1.6 s), both now inside the real band. The measurement rows of live_diag_raocau whose band status changed against the baseline:

| metric | label | artery | view | baseline | diag-irq | band | change |
|---|---|---|---|---|---|---|---|
| grey.p5 | grey p5 | LCA | RAO-CAU | 99 | 104 | 82.4 to 101.2 | in to out |
| halo_auto.overshoot_peak_px | overshoot peak distance | any | any | 3.25 | 19.5 | 6.95 to 23.95 | out to in |
| halo_auto.overshoot_rel_step | overshoot / step | any | any | 0.3289 | 0.0825 | 0.0049 to 0.3243 | out to in |
| heart_rate.bpm | heart rate from frame differences | any | any | 142.51 | 69.53 | 56.394 to 90.981 | out to in |
| texture.bandpass_rms.bright | lung band-pass 4-32 px RMS (bright tiles) | any | any | 7.053 | 6.713 | 7.0032 to 10.8307 | in to out |
| timing.f90_s | 90 % filling | LCA | RAO-CAU | 1.733 | 2.133 | 2.067 to 3.467 | out to in |
| timing.rise_s | rise 10-90 % | LCA | RAO-CAU | 0.8 | 1.267 | 1.267 to 2.6 | out to in |
| timing.wash50_after_peak_s | 50 % washout after peak | LCA | RAO-CAU | 0.867 | 0.267 | 0.3335 to 1.4 | in to out |

live_pci_raocra (41 of 63; baseline 44 of 62, route-wire-led 40, dss-spasm 41) runs on the PCI lab's real-time clock, which this package does not touch; its rows move between captures of the same code (route-wire-led and dss-spasm differ from each other by as much), so they are not attributed to this change.
