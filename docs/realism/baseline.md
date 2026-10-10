# Realism baseline

Work package realism-baseline (docs/curriculum/LAB_BUILD_PLAN.md, phase 0). This note records the scorecard of the X-ray renderer as it stands on 8 October 2026, the PCI device scenes and live-path sequences added to the capture set, and what the seven renderer and harness files edited after the last documented score (`c1g0`, HANDOVER 6.1) changed. No renderer constant and no file under `src/render/` changed in this package.

## 1. The baseline

| | |
|---|---|
| Capture set | `baseline` (datasets/tmp/captures/baseline/, 14 sequences, 358 MB) |
| Captured | 8 October 2026, offscreen sequences 07:16-07:17 UTC, live-path sequences 07:47 UTC, dev_guide re-captured 08:14 UTC with the wire tip out of the guide (section 2), development server on port 5173, Apple M4 |
| Scorecard | `python3 scripts/realism/report.py baseline` (matched pipeline), datasets/tmp/realism/reports/baseline/scorecard_matched.md and .json |
| Headline | **189 of 236 rows inside the real band**; 4 further rows indicative (fewer than 3 real runs) |
| Specs | the c1g0 specs: `standardSpecs()` in src/dev/xrayCapture.ts with every default, as recorded in the c1g0 metadata (six reference views lad_raocau, lad_raocra, lad_apcra, lad_laocra, rca_lao, rca_rao; 768 px; 20 cm field; 15 frames/s; 51 frames; standard push from frame 0; seed 1; 4 warm-up frames; the 40-frame fluoroscopy companion and the 12-frame flush companion with a 6 Fr diagnostic catheter). The resolved specs of c1g0 and of the baseline are identical (a test in src/dev/xrayCapture.test.ts checks the values). |

How it was made, in a browser tab on the development server:

```
await __xrayCapture.baseline("baseline")      // the c1g0 specs, then the four device scenes (offscreen)
// open "PCI in the cath lab", then:
await __xrayCapture.live("pci", "baseline")
// open "Cath lab" (the diagnostic lab with a case), then:
await __xrayCapture.live("diagnostic", "baseline")
```

then `python3 scripts/realism/report.py baseline`. The live sequences were filmed with the tab emulating a 1600 x 1000 viewport, so the lab canvases had their desktop size (PCI lab 1280 px, diagnostic lab 988 px). The lab canvases follow the pane, and in a pane about 650 px wide the diagnostic lab's fluoroscopy canvas shrinks to 19 CSS px (160 px frames), so a live capture now stops with an error when the lab canvas is under 512 px (`LIVE_MIN_PX`) and records the canvas's CSS width (`lab.cssPx`); `report.py` shows each measurement run's frame size ("frame px"). Re-capture live runs at the baseline's viewport, or at least at the same frame size, before comparing them with these.

Sections against c1g0 (`python3 scripts/realism/compare_sets.py c1g0 baseline`):

| section | c1g0 | baseline |
|---|---|---|
| Background | 7/14 | 7/14 |
| Borders | 3/4 | 3/4 |
| Catheter | 4/4 | 4/4 |
| Contrast | 15/24 | 15/24 |
| Field | 4/4 | 4/4 |
| Geometry | 36/46 | 36/46 |
| Grey levels | 17/18 | 17/18 |
| Motion | 19/31 | 21/31 |
| Noise | 17/18 | 17/18 |
| Timing | 58/66 | 59/66 |
| Vessels | 6/7 | 6/7 |
| **Total** | **186/236** | **189/236** |

`compare_sets.py baseline baseline` reports no lost and no gained rows.

### Files that must be kept

`compare_sets.py baseline <set>` loads the baseline from datasets/tmp/realism/reports/baseline/scorecard_matched.json (SHA-256 07e6d82ce53d8e7773fdab5e7c23c702e8e45b8f3b4d02fd763dbad099bc4b55, generated 8 October 2026 09:15 local time, after the dev_guide re-capture; its 248 rows are identical to those of the 08:49 report, only the dev_guide measurements changed), and a rescore of the baseline reads the frames in datasets/tmp/captures/baseline/. Both live in the scratch tree datasets/tmp, so neither may be cleaned while renderer packages are judged against this baseline. Section 6 lists every row of that file, so the reference survives in this note even if the scratch tree is lost.

### How later packages use it

A package that edits a renderer file (section 2 of the build plan) re-captures the same set under a new name, scores it and compares:

```
await __xrayCapture.baseline("<set>"); await __xrayCapture.live("pci", "<set>"); await __xrayCapture.live("diagnostic", "<set>")
python3 scripts/realism/report.py <set>
python3 scripts/realism/compare_sets.py baseline <set>
```

The package closes only if no more than 2 rows are lost, with every re-scored row listed in its notes. The offscreen sequences are deterministic on one machine (the same code gives the same frame hashes: c1g0 and the c1s-base sweep base, captured four minutes apart, are identical in every frame), so any lost row comes from the change under test. Rows near a band edge can still flip when a change is small; C1 recorded nine borderline flips each way between two runs that differed only in dome height (docs/realism/wave2/C1.md).

## 2. Device scenes and live-path sequences

These runs have no real reference band of their own (the library has no licensed device or lab-path runs yet). Each spec carries `role: "device"` or `role: "live"`; `report.py` measures them with the scorecard's own code, one run at a time, and lists the rows under "Measurements outside the pass count" (JSON key `measurements`). They never enter the rows, the headline or `compare_sets.py`. Each measurement row also shows the same row measured alone on the run's twin: the scorecard run of the same artery and view family.

### Device scenes (offscreen, deterministic)

The lad-focal scenario in RAO cranial (the view of lad_raocra, the twin), a standard cine run with the check injection, drawn through `pciDevices` and `pciFlowMods` from src/ui/sections/AngioPci.tsx, with the lumen rebuilt from the engine state as the lab does. The state comes from the PCI engine (`pciStageState` in xrayCapture.ts, following src/simulation/pci/testSetup.ts):

| run | state | rows inside the band (not counted) |
|---|---|---|
| dev_guide | guide engaged in the left main, wire tip advanced 5 mm out of it into the left main (14.6 mm long) | 62 of 84 |
| dev_wire | wire steered LM > LAD to 109 mm, 35 mm beyond the lesion (61.4-73.4 mm) | 63 of 84 |
| dev_balloon | semi-compliant balloon 2.5 x 16 mm centred on the lesion, inflated to 8 atm | 64 of 84 |
| dev_stent | stent 2.5 x 16 mm deployed at 10 atm (expanded 2.58 mm, 59.4-75.4 mm), balloon withdrawn | 63 of 84 |

The device size and pressures are capture-scene settings, not device claims: the diameter is the scenario's reference diameter at the lesion rounded to 0.25 mm, the length the lesion length plus 4 mm rounded up to 2 mm, and the pressures the nominal pressures of the engine's own catalogue (`BALLOON_SPEC["semi-compliant"].nominalAtm`, `STENT_SPEC.nominalAtm` in src/simulation/pciBench.ts). Every capture's metadata lists the steps and values. 16 mm is not one of the lengths the PCI lab's device menu offers (AngioPci.tsx `LENGTHS`), and the diameter rule is not clamped to the menu's diameters, so these scenes show a device size a trainee cannot pick; a later change of this rule (for example to the smallest menu length that covers the lesion plus 4 mm) re-baselines the device scenes.

What the rows show:

- dev_guide was first captured with the wire tip in the guide's lumen (-25 mm). That run was identical to lad_raocra in every frame (same hashes) and in all 84 rows, because the guide catheter is already in every scorecard scene and pciDevices draws nothing while the wire is inside it; it repeated its twin instead of measuring a device. The guide stage now advances the wire tip 5 mm out of the guide (`GUIDE_STAGE_WIRE_MM`, a capture-scene setting: the wire just introduced into the proximal left main, not a device claim), so pciDevices draws the wire stub and its coil (2 tubes). The catheter and iodine are those of the twin. Against the twin, the stub moves the vessel and motion rows most: large-vessel FWHM 9.44 against 9.61 px and depth 77.1 against 69.1, the LAD cross-section track range 11.7 against 37.0 px (as with dev_wire; that the tracked scan line crosses the wire stub is likely but was not checked), rib-margin FWHM 2.67 against 2.81 px; 51 of 84 values differ from the twin, 32 of them by 2 % or less. 62 of 84 inside the band, against 61 for the twin.
- The wire and the stent shift the LAD cross-section motion track (range 9.4 px against 37.0 px on the twin): the tracked scan line now crosses metal. The vessel profile rows hardly move (large-vessel FWHM 9.5 against 9.6 px).
- The inflated balloon stops antegrade contrast beyond it (pciFlowMods): frames at 90 % or more of peak 4 against 10.

### Live-path sequences (the labs' own render paths)

`source: "pci-hook"` films the PCI lab through `window.__pciDraw(bt)` (AngioPci.tsx PciFluoro.draw: the lab's dose-rate controller, patient clock, legacy catheter path, syringe and flow state, devices); `source: "fluoro-hook"` films the diagnostic lab through `window.__fluoroDraw(mode)` (FluoroView.tsx drawXray with its session) after seating the catheter in the left main with the skill cards' start controls and pressing the hand injection. The capture watches `XrayRenderer.render` while it runs (restored afterwards) to record the lab's scene: iodine, the catheter, rib margins and the meter per frame. The labs keep their trees to themselves, so the vessel, geometry and vessel-motion rows are not measured on these runs. Between frames the lab advances 1/15 s, in real time when its own frame loop runs at full rate (the measured clock rate is recorded) or by its step hook (`__pciStep`, `__labStep`) when the pane is hidden or throttled; frames are kept in memory and uploaded after the run so the run keeps its frame rate. These runs read the wall clock and are not deterministic.

The live capture drives and changes the open case and does not restore it: in the diagnostic lab it commands catheter insertion and torque, steps 4.5 s of patient time, aspirates, starts and releases a hand injection and draws 55 frames, each of which runs the session's exposure and frame recording, so dose, contrast and recorded frames accrue in the case; in the PCI lab it switches the scenario in the lab's list and the view. Run it on a fresh case and reload afterwards. It stops with an error when the lab canvas is not square or is under 512 px (`LIVE_MIN_PX`), and when the PCI lab's clock does not run and `__pciStep` is missing (the frames would show a still heart).

| run | lab | clock | rows inside the band (not counted) |
|---|---|---|---|
| live_pci_raocra | PCI lab, lad-focal, RAO cranial, 1280 px | real time (rate 1.0, 15.1 frames/s) | 44 of 62 |
| live_diag_raocau | diagnostic lab, case "Routine left coronary", JL4 seated in the LM, RAO caudal, 988 px | stepped (rate 0.07 on its own) | 35 of 64 |

Leads for the renderer work (measurements, not judgements):

- PCI lab: the block-matching motion median is 0.0 px against 5.9 on the offscreen twin, and the catheter shaft moves about half as much (median step 0.6 against 1.7 px). The lab's image moves much less from frame to frame than the capture path's. Not explained here.
- Diagnostic lab: a different patient and catheter, so the absolute values are not a like-for-like comparison. Peak local contrast 28.8 against 45.6, opacified area 0.068 against 0.138, unfilled catheter depth 22.6 against 44.4, the catheter shaft almost still (range 3.0 against 16.4 px), the field-edge rows of a different field (corner row 7.2 against -28.4), and a heart rate from frame differences of 143/min against 72/min, which needs checking against the lab's clock before anyone acts on it. The frames also show a round heart outline and a bright gastric air ellipse at the bottom of the RAO caudal field.

## 3. The seven files edited after c1g0

c1g0 was captured on 5 October at 22:15 (local time; metadata 21:15 UTC) and scored 186 of 236 at 22:17. Seven files were then saved between 22:26 and 22:34 without notes. Their earlier versions are not kept anywhere, so the changes were reconstructed from three sources:

1. **The production build in dist/ (5 October 21:40, the end of C1).** Each current file was minified with the same esbuild targets and compared token by token with the build's code (identifiers normalised). This gives the net change since 21:40, not since c1g0.
2. **Frame hashes of the calibration sweep sets captured during the edits.** Each sweep has a `base` variant with the committed constants: c1s-base (22:19-22:22), c1r-base (22:26:12, RCA views only), c1m-base (22:30:46). c1s-base is identical to c1g0 in every frame; c1r-base differs in the RCA runs; **c1m-base is identical to the baseline in all 51 frames of all six reference views.** The fluoroscopy and flush companions were not captured between c1g0 and the baseline.
3. **Difference maps** between those sets (frames 2 and 20), which show where the image changed.

A file's modification time is only its last save, so an edit seen in the build diff may have been made before c1g0 and saved again later. Where the evidence cannot place an edit, this says so.

What the sets show. c1g0 to c1r-base changed only hilar bronchi (tube-shaped differences in the upper field, up to 19 grey levels, 1.5 % of pixels changed by more than 2 levels). c1r-base to c1m-base changed only the vertebral bodies. c1g0 to the baseline fluoroscopy and flush companions shows the same bronchial pattern and no overall shift (mean signed difference -0.01 and +0.08 grey levels). The projected geometry in the metadata (vessel centre lines, contraction, iodine, catheter) is identical in c1f1, c1g0, c1m-base and the baseline. So every pixel change after c1g0 is anatomy in thorax.ts; the other six files changed no pixel in the scorecard runs.

| file | last save | what the code now does, against the 21:40 build | evidence on when | rows moved |
|---|---|---|---|---|
| src/render/xray/sceneBuilder.ts | 22:26:00 | (a) the calcified-plaque shell attenuation is `VESSEL_PROFILE.calciumMu` (0.055 /mm, the old literal value) so sweeps can vary it; (b) the scene passes the thorax rib centre lines on as `scene.extra.ribLines` for the capture annotations; (c) `motionAt(clock, heart)` now receives the tree's heart | (b) existed by c1g0: its metadata has 24 rib margins on frame 0, c1f1's none. (a) existed by 22:26:36, when the c1r-ca0 and c1r-ca38 sweeps ran (by their names probably calciumMu 0 and 0.038; the sweep variants are not recorded). (c) cannot be placed; the projected geometry is identical in every set, so it changed nothing measured | none |
| src/render/xray/thorax.ts | 22:27:11 | after c1g0: **bronchi split where they would run inside a large pulmonary vessel** (radius 1.6 mm or more, 12 mm grid; "a bronchus never runs inside a vessel", C1 review round), and **vertebral bodies drawn as five stacked open cortical slabs with a concave waist** (`VERTEBRA_SLABS` 5, `VERTEBRA_WAIST_MM` [2.2, 1.4], replacing one box-like cylinder). Before c1g0 (in the build diff but no pixel change after c1g0): pericardium 0 to 12 mm, the dependent-lung carve under the heart (`RETRO`, depth 40 mm), breast slots, rib density as `ANATOMY_TUNE.ribs` (same values), bronchial and heart attenuation written from the MU constants, rib lines in the thorax output | bronchi: between 22:19 and 22:26:12 (c1g0 = c1s-base; c1r-base differs only at the bronchi). Vertebrae: between 22:26:12 and 22:30:46 (c1r-base to c1m-base differs only at the vertebrae). The c1f1 to c1g0 change (183 to 186, broad differences along the heart border and lungs) holds the pre-c1g0 items | **all of them**: 109 of 248 row values changed; lost 2, gained 5 (table below). The RCA runs alone cannot be split between the two edits from the sweep sets |
| src/render/xray/thorax.test.ts | 22:27:36 | tests of the two edits: "bronchi run beside their arteries, never inside them" (under 2 % of bronchus points inside a large artery, against 12-23 % before) and the vertebrae tests (slabs grouped into 19 bodies, waist narrower than the rims, disc gaps 4.5-8.5 mm). 38 tests pass | saved with thorax.ts | none |
| src/dev/xrayCapture.ts | 22:30:18 | the frame annotations record the renderer's meter after each frame (`lastMeter`: processed log p5, p50, p95 and window width). Otherwise as in the C1 inventory (docs/realism/wave2/C1.md section 0) | absent from the c1g0 and c1r-base metadata, present from c1m-base. The resolved specs of c1g0, c1r-base, c1m-base and the baseline are identical | none (harness only) |
| src/render/xray/XrayRenderer.ts | 22:31:56 | passes the profile window's `minWidth` to `solveWindowBand` explicitly, defaulting to 0.25, the value the function already used | the six reference views are identical in every frame to c1m-base, captured 70 s before this save | none |
| src/render/xray/systemProfiles.ts | 22:31:56 | adds an optional `minWidth` to the window type; no profile sets it. Every profile value (band gains, residual, coring, LUT, window targets, detector, temporal, field) is identical to the 21:40 build | as XrayRenderer.ts | none |
| src/render/xray/pyramid.ts | 22:34:43 | `solveWindow`: when the minimum window width binds (a frame with a narrow grey range), the extra span is shared equally by the two ends, so the frame sits in the middle of the window instead of being pinned to the bright target ("C1 review round"); adds a `lutSlope` helper the app does not call | the six reference views are identical to c1m-base, so the floor never binds in them; the fluoroscopy and flush companions differ from c1g0 only by the bronchial pattern | none found |

Rows that changed result between c1g0 and the baseline (all from the thorax.ts edits):

| row | artery / view | c1g0 | baseline | band |
|---|---|---|---|---|
| LOST: opacified area > 10 levels | LCA LAO-CRA | 0.179 | 0.146 | 0.154-0.558 |
| LOST: frames at >= 90 % | LCA AP-CRA | 4 | 3 | 4-11.4 |
| GAINED: opacified area > 20 levels | LCA LAO-CRA | 0.037 | 0.061 | 0.049-0.458 |
| GAINED: frames at >= 90 % | LCA RAO-CAU | 11 | 10 | 3-10 |
| GAINED: 50 % washout after peak | LCA AP-CRA | 0.333 | 0.400 | 0.400-1.200 |
| GAINED: LAD cross-section track, range | any | 14.7 | 24.0 | 22.9-31.1 |
| GAINED: LAD cross-section track, maximum step | any | 8.0 | 8.9 | 8.2-12.0 |

The changed values by section: Noise 18, Background 13, Borders 3, Contrast 24, Timing 19, Motion 17, Field 4, Vessels 7, Bone 2, Catheter 2. Most moved by small amounts; the seven above crossed a band edge. Several are borderline rows of the kind C1 saw flip with unrelated changes.

The sweep sets captured during the edits (c1s-rib1, -rib2, -tex1, -band1; c1r-ca0, -ca38; c1m-mw30, -mw35; c1v-v1 to -v4; c1c-a, -b, -c) record their specs but not their variants. c1v and c1c were captured after the last save and differ from the baseline in every frame, so none of their variants is the committed state.

## 4. The narrowed-tree check

To show that the scorecard and `compare_sets.py` catch a degraded image, the set `narrow-left` was captured with the c1g0 specs and every left coronary lumen radius scaled by 0.6 (`narrowTree: { side: "left", scale: 0.6 }`, a harness option that is never part of the baseline):

```
await __xrayCapture.standard("narrow-left", { narrowTree: { side: "left", scale: 0.6 } })
python3 scripts/realism/report.py narrow-left
python3 scripts/realism/compare_sets.py baseline narrow-left
```

The left cine runs differ from the baseline from frame 5 (contrast arrival); the RCA runs and the two companions are identical in every frame. Result: 178 of 236. It loses 17 rows (6 gained), well beyond the 2-row tolerance:

- Contrast: opacified area > 20 levels in AP-CRA (0.047 to 0.020), LAO-CRA (0.061 to 0.028) and RAO-CRA (0.055 to 0.033).
- Timing: first appearance in AP-CRA and LAO-CRA (0.53 to 0.00 s), 50 % filling RAO-CRA, 90 % filling LAO-CRA, frames at >= 90 % LAO-CRA and RAO-CAU, rise 10-90 % RAO-CAU, 50 % washout AP-CRA and RAO-CRA, end-of-run level LAO-CRA, time above 50 % AP-CRA.
- Motion: block-matching median RAO-CRA (5.9 to 1.1), LAD cross-section track range (24.0 to 12.9) and maximum step (8.9 to 7.0).

## 5. Changes in this package and housekeeping

- src/dev/xrayCapture.ts: device scenes (`devices`, `pciStageState`, `DEVICE_SCENES`), live-path capture through the labs' hooks (`captureHook`, `LIVE_SEQUENCES`, `annotateLiveFrame`), `role`, `narrowTree`, `baselineSpecs()`, and `__xrayCapture.baseline()` and `.live()` (API version 3). The scorecard specs and their frames are unchanged: the six reference views captured with this file are identical to c1m-base.
- The device scenes depend on the engine tests' simulated operator: the guide and wire states come from `wireToTarget` in src/simulation/pci/testSetup.ts, so a change there (its steering step or guard, made for an engine test) re-baselines dev_wire, dev_balloon and dev_stent (re-capture and rescore). xrayCapture.ts imports `pciDevices` and `pciFlowMods` from src/ui/sections/AngioPci.tsx, and main.tsx loads xrayCapture at the start of every development session, so the PCI lab's module graph, a lazy route in App.tsx, now loads eagerly in development. This is accepted for a development-only harness; if start-up cost becomes a problem, the import can move behind a dynamic `import()` inside `installXrayCapture`. Production builds are not affected.
- scripts/realism/report.py: runs with role "device" or "live" are measured as measurements outside the pass count, with their twin (`partition_runs`, `measurement_rows`). On an existing set without roles it gives the same rows as before (checked on c1g0: all 248 rows identical; the c1g0 report files were restored afterwards). scripts/realism/test_report_roles.py checks the roles, the partition and that every measurement row has `pass` None (`python3 -I -m unittest discover -s scripts/realism -p 'test_report_roles.py'`).
- src/dev/xrayCapture.test.ts (new): the c1g0 specs, roles, the four device states, the device tubes drawn through pciDevices, the guide-stage scene keeping its twin's catheter and iodine and adding only the wire stub, balloon occlusion, determinism, the live-frame annotation and the narrowed tree.
- The earlier capture set named `baseline` (wave 1, 5 October 00:15, 76 of 102 on the scorecard of that time) was renamed `s0-baseline` in datasets/tmp/captures and datasets/tmp/realism/reports to free the name.
- `compare_sets.py --all` fails on the fluoroscopy rule row, whose band has no upper end (also on c1f1 against c1g0, so it predates this package). The summary and the LOST and GAINED lists work.

## 6. Row list

Every row of datasets/tmp/realism/reports/baseline/scorecard_matched.json (matched pipeline, profile cd-ds): 248 rows, of which 236 are scored (189 pass, 47 fail), 4 are indicative (fewer than 3 real runs) and 8 have no target. The band is the target band of the real runs (p10 to p90, or the observed range when fewer than 10 runs); a note in brackets names the target's profile or artery/view when it is not the row's own. Values are rounded to three decimals.

| # | section | metric | artery / view | simulator | real band | n real | result |
|---|---|---|---|---|---|---|---|
| 1 | Noise | temporal noise SD (`noise.sigma_t`) | any | 3.447 | 3.031 to 3.628 | 13 | pass |
| 2 | Noise | noise dark/bright ratio (96-127 / 160-191) (`noise.dark_bright_ratio`) | any | 1.130 | 0.901 to 1.295 | 13 | pass |
| 3 | Noise | noise autocorrelation lag 1 (`noise.acf_lag1`) | any | 0.358 | 0.272 to 0.472 | 13 | pass |
| 4 | Noise | noise autocorrelation lag 2 (`noise.acf_lag2`) | any | -0.021 | -0.099 to 0.011 | 13 | pass |
| 5 | Noise | NPS fraction below 0.1 cycles/px (`noise.nps_low_frac`) | any | 0.260 | 0.189 to 0.339 | 13 | pass |
| 6 | Noise | NPS high/low ratio (`noise.nps_hi_lo`) | any | 0.286 | 0.126 to 0.561 | 13 | pass |
| 7 | Noise | frame-to-frame noise correlation (`noise.rho_temporal`) | any | 0.032 | -0.015 to 0.144 | 13 | pass |
| 8 | Noise | run-start noise settling (pair 0-1 / 9-10) (`settle.first_pair_ratio`) | any | 1.717 | 1.335 to 1.680 | 20 | fail |
| 9 | Background | lung band-pass 4-32 px RMS (bright tiles) (`texture.bandpass_rms.bright`) | any | 6.343 | 7.003 to 10.831 | 54 | fail |
| 10 | Background | band-pass RMS (mid tiles) (`texture.bandpass_rms.mid`) | any | 5.388 | 5.114 to 9.938 | 54 | pass |
| 11 | Background | band-pass RMS (dark tiles) (`texture.bandpass_rms.dark`) | any | 6.045 | 4.429 to 8.870 | 54 | pass |
| 12 | Background | power at 0.125 cycles/px (bright) (`texture.power_0.125.bright`) | any | 107.590 | 143.405 to 373.071 | 54 | fail |
| 13 | Background | spectrum slope 0.1-0.3 cycles/px (bright) (`texture.slope_hi.bright`) | any | -1.407 | -3.241 to -1.821 | 54 | fail |
| 14 | Background | background spectrum beta 0.008-0.08 (`spectrum.beta_lo`) | any | 2.273 | 2.181 to 3.025 | 54 | pass |
| 15 | Background | background band power 0.008-0.08 (`spectrum.band_power`) | any | 71,966 | 49,099 to 410,539 | 54 | pass |
| 16 | Background | thin dark-line pixels (pre-contrast) (`ridges.pre_frame`) | any | 7,516 | 10,070 to 16,415 | 54 | fail |
| 17 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | LCA AP-CRA | 21.840 | 22.172 to 27.700 | 13 | fail |
| 18 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | LCA LAO-CRA | 27.100 | 22.900 to 38.400 | 9 | pass |
| 19 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | LCA RAO-CAU | 25.070 | 21.550 to 28.140 | 3 | pass |
| 20 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | LCA RAO-CRA | 26.450 | 21.494 to 32.746 | 22 | pass |
| 21 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | RCA LAO-0 | 21.010 | 28.497 to 39.262 | 14 | fail |
| 22 | Background | local contrast p99, pre-contrast (`local_contrast.pre`) | RCA RAO-0 | 19.860 | 25.942 to 41.536 (RCA/any) | 25 | fail |
| 23 | Borders | large-border bright overshoot (`halo_auto.overshoot`) | any | 9.485 | 0.282 to 13.629 | 54 | pass |
| 24 | Borders | overshoot / step (`halo_auto.overshoot_rel_step`) | any | 0.209 | 0.005 to 0.324 | 54 | pass |
| 25 | Borders | overshoot peak distance (`halo_auto.overshoot_peak_px`) | any | 3.250 | 6.950 to 23.950 | 54 | fail |
| 26 | Borders | dark-side undershoot (`halo_auto.undershoot`) | any | -2.385 | -2.784 to 15.745 | 54 | pass |
| 27 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | LCA AP-CRA | 43.010 | 29.934 to 47.816 | 13 | pass |
| 28 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | LCA LAO-CRA | 50.060 | 27.250 to 55.020 | 9 | pass |
| 29 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | LCA RAO-CAU | 45.580 | 33.940 to 50.800 | 3 | pass |
| 30 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | LCA RAO-CRA | 46.910 | 33.710 to 55.523 | 22 | pass |
| 31 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | RCA LAO-0 | 60.580 | 35.520 to 45.352 | 14 | fail |
| 32 | Contrast | local contrast p99, peak frame (`local_contrast.peak`) | RCA RAO-0 | 62.690 | 32.664 to 46.684 (RCA/any) | 25 | fail |
| 33 | Contrast | opacified area > 10 levels (`opacified.area10`) | LCA AP-CRA | 0.098 | 0.081 to 0.426 | 13 | pass |
| 34 | Contrast | opacified area > 10 levels (`opacified.area10`) | LCA LAO-CRA | 0.146 | 0.154 to 0.558 | 9 | fail |
| 35 | Contrast | opacified area > 10 levels (`opacified.area10`) | LCA RAO-CAU | 0.138 | 0.248 to 0.344 | 3 | fail |
| 36 | Contrast | opacified area > 10 levels (`opacified.area10`) | LCA RAO-CRA | 0.141 | 0.132 to 0.589 | 22 | pass |
| 37 | Contrast | opacified area > 10 levels (`opacified.area10`) | RCA LAO-0 | 0.318 | 0.181 to 0.460 | 14 | pass |
| 38 | Contrast | opacified area > 10 levels (`opacified.area10`) | RCA RAO-0 | 0.227 | 0.139 to 0.460 (RCA/any) | 25 | pass |
| 39 | Contrast | opacified area > 20 levels (`opacified.area20`) | LCA AP-CRA | 0.047 | 0.035 to 0.295 | 13 | pass |
| 40 | Contrast | opacified area > 20 levels (`opacified.area20`) | LCA LAO-CRA | 0.061 | 0.049 to 0.458 | 9 | pass |
| 41 | Contrast | opacified area > 20 levels (`opacified.area20`) | LCA RAO-CAU | 0.028 | 0.090 to 0.164 | 3 | fail |
| 42 | Contrast | opacified area > 20 levels (`opacified.area20`) | LCA RAO-CRA | 0.055 | 0.046 to 0.496 | 22 | pass |
| 43 | Contrast | opacified area > 20 levels (`opacified.area20`) | RCA LAO-0 | 0.071 | 0.085 to 0.280 | 14 | fail |
| 44 | Contrast | opacified area > 20 levels (`opacified.area20`) | RCA RAO-0 | 0.075 | 0.077 to 0.252 (RCA/any) | 25 | fail |
| 45 | Contrast | peak mean darkening (`opacified.peakD`) | LCA AP-CRA | 4.674 | 3.547 to 15.667 | 13 | pass |
| 46 | Contrast | peak mean darkening (`opacified.peakD`) | LCA LAO-CRA | 5.537 | 5.713 to 24.591 | 9 | fail |
| 47 | Contrast | peak mean darkening (`opacified.peakD`) | LCA RAO-CAU | 4.446 | 7.035 to 8.895 | 3 | fail |
| 48 | Contrast | peak mean darkening (`opacified.peakD`) | LCA RAO-CRA | 5.528 | 5.104 to 25.722 | 22 | pass |
| 49 | Contrast | peak mean darkening (`opacified.peakD`) | RCA LAO-0 | 8.283 | 6.127 to 13.554 | 14 | pass |
| 50 | Contrast | peak mean darkening (`opacified.peakD`) | RCA RAO-0 | 7.385 | 5.133 to 12.584 (RCA/any) | 25 | pass |
| 51 | Timing | first appearance (10%) (`timing.f10_s`) | LCA AP-CRA | 0.533 | 0.294 to 0.706 | 13 | pass |
| 52 | Timing | first appearance (10%) (`timing.f10_s`) | LCA LAO-CRA | 0.533 | 0.200 to 0.667 | 9 | pass |
| 53 | Timing | first appearance (10%) (`timing.f10_s`) | LCA RAO-CAU | 0.467 | 0.467 to 1.067 | 3 | pass |
| 54 | Timing | first appearance (10%) (`timing.f10_s`) | LCA RAO-CRA | 0.467 | 0.333 to 0.793 | 22 | pass |
| 55 | Timing | first appearance (10%) (`timing.f10_s`) | RCA LAO-0 | 0.533 | 0.067 to 0.760 | 14 | pass |
| 56 | Timing | first appearance (10%) (`timing.f10_s`) | RCA RAO-0 | 0.533 | 0.067 to 0.707 (RCA/any) | 25 | pass |
| 57 | Timing | 50% filling (`timing.f50_s`) | LCA AP-CRA | 0.667 | 0.560 to 1.000 | 13 | pass |
| 58 | Timing | 50% filling (`timing.f50_s`) | LCA LAO-CRA | 0.733 | 0.600 to 1.533 | 9 | pass |
| 59 | Timing | 50% filling (`timing.f50_s`) | LCA RAO-CAU | 0.933 | 1.067 to 1.533 | 3 | fail |
| 60 | Timing | 50% filling (`timing.f50_s`) | LCA RAO-CRA | 0.800 | 0.733 to 1.454 | 22 | pass |
| 61 | Timing | 50% filling (`timing.f50_s`) | RCA LAO-0 | 0.933 | 0.660 to 1.787 | 14 | pass |
| 62 | Timing | 50% filling (`timing.f50_s`) | RCA RAO-0 | 0.867 | 0.600 to 2.027 (RCA/any) | 25 | pass |
| 63 | Timing | 90% filling (`timing.f90_s`) | LCA AP-CRA | 2.467 | 0.933 to 1.960 | 13 | fail |
| 64 | Timing | 90% filling (`timing.f90_s`) | LCA LAO-CRA | 1.533 | 0.867 to 2.267 | 9 | pass |
| 65 | Timing | 90% filling (`timing.f90_s`) | LCA RAO-CAU | 1.867 | 2.067 to 3.467 | 3 | fail |
| 66 | Timing | 90% filling (`timing.f90_s`) | LCA RAO-CRA | 2.200 | 1.340 to 2.533 | 22 | pass |
| 67 | Timing | 90% filling (`timing.f90_s`) | RCA LAO-0 | 2.400 | 1.300 to 2.913 | 14 | pass |
| 68 | Timing | 90% filling (`timing.f90_s`) | RCA RAO-0 | 2.400 | 1.200 to 2.907 (RCA/any) | 25 | pass |
| 69 | Timing | rise 10-90% (`timing.rise_s`) | LCA AP-CRA | 1.933 | 0.480 to 1.493 | 13 | fail |
| 70 | Timing | rise 10-90% (`timing.rise_s`) | LCA LAO-CRA | 1.000 | 0.333 to 1.667 | 9 | pass |
| 71 | Timing | rise 10-90% (`timing.rise_s`) | LCA RAO-CAU | 1.400 | 1.267 to 2.600 | 3 | pass |
| 72 | Timing | rise 10-90% (`timing.rise_s`) | LCA RAO-CRA | 1.733 | 0.807 to 1.980 | 22 | pass |
| 73 | Timing | rise 10-90% (`timing.rise_s`) | RCA LAO-0 | 1.867 | 1.133 to 2.267 | 14 | pass |
| 74 | Timing | rise 10-90% (`timing.rise_s`) | RCA RAO-0 | 1.867 | 1.027 to 2.307 (RCA/any) | 25 | pass |
| 75 | Timing | frames at >= 90% (`timing.frames_ge90`) | LCA AP-CRA | 3.000 | 4.000 to 11.400 | 13 | fail |
| 76 | Timing | frames at >= 90% (`timing.frames_ge90`) | LCA LAO-CRA | 5.000 | 4.000 to 10.000 | 9 | pass |
| 77 | Timing | frames at >= 90% (`timing.frames_ge90`) | LCA RAO-CAU | 10.000 | 3.000 to 10.000 | 3 | pass |
| 78 | Timing | frames at >= 90% (`timing.frames_ge90`) | LCA RAO-CRA | 10.000 | 3.000 to 12.000 | 22 | pass |
| 79 | Timing | frames at >= 90% (`timing.frames_ge90`) | RCA LAO-0 | 5.000 | 4.000 to 9.700 | 14 | pass |
| 80 | Timing | frames at >= 90% (`timing.frames_ge90`) | RCA RAO-0 | 4.000 | 2.000 to 9.600 (RCA/any) | 25 | pass |
| 81 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | LCA AP-CRA | 0.400 | 0.400 to 1.200 | 11 | pass |
| 82 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | LCA LAO-CRA | 1.200 | 0.400 to 1.333 | 4 | pass |
| 83 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | LCA RAO-CAU | 1.067 | 0.334 to 1.400 (LCA/any) | 56 | pass |
| 84 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | LCA RAO-CRA | 0.600 | 0.467 to 1.693 | 14 | pass |
| 85 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | RCA LAO-0 | 0.400 | 0.200 to 0.933 | 9 | pass |
| 86 | Timing | 50% washout after peak (`timing.wash50_after_peak_s`) | RCA RAO-0 | 0.533 | 0.307 to 0.933 (RCA/any) | 17 | pass |
| 87 | Timing | end-of-run level / peak (`timing.end_rel`) | LCA AP-CRA | 0.421 | 0.077 to 0.555 | 13 | pass |
| 88 | Timing | end-of-run level / peak (`timing.end_rel`) | LCA LAO-CRA | 0.017 | -0.045 to 0.937 | 9 | pass |
| 89 | Timing | end-of-run level / peak (`timing.end_rel`) | LCA RAO-CAU | 0.208 | 0.407 to 0.750 | 3 | fail |
| 90 | Timing | end-of-run level / peak (`timing.end_rel`) | LCA RAO-CRA | 0.368 | 0.167 to 0.909 | 22 | pass |
| 91 | Timing | end-of-run level / peak (`timing.end_rel`) | RCA LAO-0 | 0.467 | 0.166 to 0.741 | 14 | pass |
| 92 | Timing | end-of-run level / peak (`timing.end_rel`) | RCA RAO-0 | 0.372 | -0.071 to 0.733 (RCA/any) | 25 | pass |
| 93 | Timing | run length (`timing.run_s`) | LCA AP-CRA | 3.400 | 3.333 to 3.920 | 13 | pass |
| 94 | Timing | run length (`timing.run_s`) | LCA LAO-CRA | 3.400 | 2.400 to 4.400 | 9 | pass |
| 95 | Timing | run length (`timing.run_s`) | LCA RAO-CAU | 3.400 | 3.333 to 3.733 | 3 | pass |
| 96 | Timing | run length (`timing.run_s`) | LCA RAO-CRA | 3.400 | 2.687 to 4.367 | 22 | pass |
| 97 | Timing | run length (`timing.run_s`) | RCA LAO-0 | 3.400 | 2.753 to 4.693 | 14 | pass |
| 98 | Timing | run length (`timing.run_s`) | RCA RAO-0 | 3.400 | 2.533 to 4.680 (RCA/any) | 25 | pass |
| 99 | Motion | heart rate from frame differences (`heart_rate.bpm`) | any | 71.985 | 56.394 to 90.981 | 52 | pass |
| 100 | Motion | block-matching motion, median (`motion_block.median`) | LCA AP-CRA | 6.599 | 1.778 to 7.000 | 13 | pass |
| 101 | Motion | block-matching motion, median (`motion_block.median`) | LCA LAO-CRA | 5.642 | 2.059 to 8.431 | 9 | pass |
| 102 | Motion | block-matching motion, median (`motion_block.median`) | LCA RAO-CAU | 4.273 | 1.457 to 3.624 | 3 | fail |
| 103 | Motion | block-matching motion, median (`motion_block.median`) | LCA RAO-CRA | 5.920 | 1.778 to 8.368 | 22 | pass |
| 104 | Motion | block-matching motion, median (`motion_block.median`) | RCA LAO-0 | 4.300 | 1.326 to 3.538 | 14 | fail |
| 105 | Motion | block-matching motion, median (`motion_block.median`) | RCA RAO-0 | 10.596 | 0.892 to 5.988 (RCA/any) | 25 | fail |
| 106 | Motion | block-matching motion, p90 (`motion_block.p90`) | LCA AP-CRA | 13.318 | 4.632 to 13.483 | 13 | pass |
| 107 | Motion | block-matching motion, p90 (`motion_block.p90`) | LCA LAO-CRA | 11.443 | 3.744 to 11.522 | 9 | pass |
| 108 | Motion | block-matching motion, p90 (`motion_block.p90`) | LCA RAO-CAU | 11.000 | 2.408 to 8.646 | 3 | fail |
| 109 | Motion | block-matching motion, p90 (`motion_block.p90`) | LCA RAO-CRA | 12.660 | 4.689 to 14.998 | 22 | pass |
| 110 | Motion | block-matching motion, p90 (`motion_block.p90`) | RCA LAO-0 | 14.867 | 2.248 to 6.795 | 14 | fail |
| 111 | Motion | block-matching motion, p90 (`motion_block.p90`) | RCA RAO-0 | 15.201 | 2.180 to 11.061 (RCA/any) | 25 | fail |
| 112 | Motion | block-matching motion, max (`motion_block.max`) | LCA AP-CRA | 14.422 | 5.469 to 15.071 | 13 | pass |
| 113 | Motion | block-matching motion, max (`motion_block.max`) | LCA LAO-CRA | 13.153 | 4.062 to 14.439 | 9 | pass |
| 114 | Motion | block-matching motion, max (`motion_block.max`) | LCA RAO-CAU | 12.506 | 4.000 to 12.502 | 3 | fail |
| 115 | Motion | block-matching motion, max (`motion_block.max`) | LCA RAO-CRA | 14.351 | 6.079 to 15.969 | 22 | pass |
| 116 | Motion | block-matching motion, max (`motion_block.max`) | RCA LAO-0 | 16.429 | 3.437 to 13.065 | 14 | fail |
| 117 | Motion | block-matching motion, max (`motion_block.max`) | RCA RAO-0 | 17.046 | 3.154 to 13.244 (RCA/any) | 25 | fail |
| 118 | Field | outer 0-2 px vs 16-32 px band (`field.edge02_rel`) | any | -6.775 | -15.817 to 0.590 | 80 | pass |
| 119 | Field | 2-4 px vs 16-32 px band (`field.edge24_rel`) | any | -3.200 | -10.056 to 1.793 | 80 | pass |
| 120 | Field | 8-16 px vs 16-32 px band (`field.edge816_rel`) | any | -0.435 | -3.640 to 5.514 | 80 | pass |
| 121 | Field | corners vs 16-32 px band (`field.corner_rel`) | any | -8.080 | -26.283 to 3.184 | 80 | pass |
| 122 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | LCA AP-CRA | 0.600 | 0.480 to 0.906 | 13 | pass |
| 123 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | LCA LAO-CRA | 0.600 | 0.200 to 1.067 | 9 | pass |
| 124 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | LCA RAO-CAU | 0.667 | 0.733 to 1.267 | 3 | fail |
| 125 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | LCA RAO-CRA | 0.600 | 0.467 to 0.993 | 22 | pass |
| 126 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | RCA LAO-0 | 0.733 | 0.487 to 1.180 | 14 | pass |
| 127 | Timing | contrast arrival (30% of rise) (`arrival.arrival30_s`) | RCA RAO-0 | 0.733 | 0.293 to 1.173 (RCA/any) | 25 | pass |
| 128 | Timing | time above 50% of rise (`arrival.above50_s`) | LCA AP-CRA | 2.067 | 1.600 to 2.814 | 13 | pass |
| 129 | Timing | time above 50% of rise (`arrival.above50_s`) | LCA LAO-CRA | 2.133 | 1.333 to 2.867 | 9 | pass |
| 130 | Timing | time above 50% of rise (`arrival.above50_s`) | LCA RAO-CAU | 2.200 | 1.733 to 2.267 | 3 | pass |
| 131 | Timing | time above 50% of rise (`arrival.above50_s`) | LCA RAO-CRA | 2.333 | 1.474 to 2.834 | 22 | pass |
| 132 | Timing | time above 50% of rise (`arrival.above50_s`) | RCA LAO-0 | 2.267 | 1.193 to 2.600 | 14 | pass |
| 133 | Timing | time above 50% of rise (`arrival.above50_s`) | RCA RAO-0 | 2.200 | 1.133 to 2.600 (RCA/any) | 25 | pass |
| 134 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | LCA AP-CRA | 0.000 | 0.000 to 0.000 | 13 | pass |
| 135 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | LCA LAO-CRA | 0.000 | 0.000 to 0.000 | 9 | pass |
| 136 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | LCA RAO-CAU | 0.000 | 0.000 to 0.000 | 3 | pass |
| 137 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | LCA RAO-CRA | 0.000 | 0.000 to 0.000 | 22 | pass |
| 138 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | RCA LAO-0 | 0.000 | 0.000 to 0.000 | 14 | pass |
| 139 | Timing | contrast present in the first frame (0/1) (`arrival.at_frame0`) | RCA RAO-0 | 0.000 | 0.000 to 0.000 (RCA/any) | 25 | pass |
| 140 | Noise | noise SD at grey 60-79 (cd-ds) (`noise.sigma_t_by_grey20.60-79`) | any | 4.032 | 3.688 to 4.728 | 6 | pass |
| 141 | Noise | noise SD at grey 80-99 (cd-ds) (`noise.sigma_t_by_grey20.80-99`) | any | 3.892 | 3.517 to 4.240 | 12 | pass |
| 142 | Noise | noise SD at grey 100-119 (cd-ds) (`noise.sigma_t_by_grey20.100-119`) | any | 3.615 | 3.161 to 3.810 | 13 | pass |
| 143 | Noise | noise SD at grey 120-139 (cd-ds) (`noise.sigma_t_by_grey20.120-139`) | any | 3.571 | 2.772 to 3.676 | 13 | pass |
| 144 | Noise | noise SD at grey 140-159 (cd-ds) (`noise.sigma_t_by_grey20.140-159`) | any | 3.525 | 2.836 to 3.640 | 13 | pass |
| 145 | Noise | noise SD at grey 160-179 (cd-ds) (`noise.sigma_t_by_grey20.160-179`) | any | 3.316 | 2.802 to 3.674 | 13 | pass |
| 146 | Noise | noise SD at grey 180-199 (cd-ds) (`noise.sigma_t_by_grey20.180-199`) | any | 3.127 | 2.611 to 4.561 | 13 | pass |
| 147 | Noise | noise SD at grey 200-219 (cd-ds) (`noise.sigma_t_by_grey20.200-219`) | any | 3.055 | 3.001 to 4.941 | 13 | pass |
| 148 | Noise | noise SD at grey 220-239 (cd-ds) (`noise.sigma_t_by_grey20.220-239`) | any | 3.151 | 2.809 to 3.553 | 4 | pass |
| 149 | Noise | fluoro / cine noise SD at equal grey (lad_raocau_fluoro vs lad_raocau) (`noise.fluoro_over_cine`) | LCA RAO-CAU | 1.387 | rule: ratio > 1 | 0 | pass |
| 150 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | LCA AP-CRA | 8.355 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | fail |
| 151 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | LCA LAO-CRA | 9.895 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 152 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | LCA RAO-CAU | 7.612 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | fail |
| 153 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | LCA RAO-CRA | 7.899 | 9.085 to 18.587 (cd-ds+cd-main) | 5 | fail |
| 154 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | RCA LAO-0 | 8.993 | 8.979 to 16.686 (cd-ds+cd-main) | 4 | pass |
| 155 | Geometry | tortuosity band RMS 3-8 mm (`tortuosity.b3_8`) | RCA RAO-0 | 7.459 | 8.979 to 16.686 (cd-ds+cd-main, RCA/any) | 4 | fail |
| 156 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | LCA AP-CRA | 12.710 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 157 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | LCA LAO-CRA | 10.948 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 158 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | LCA RAO-CAU | 14.906 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 159 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | LCA RAO-CRA | 14.545 | 7.688 to 22.387 (cd-ds+cd-main) | 5 | pass |
| 160 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | RCA LAO-0 | 8.622 | 6.485 to 12.387 (cd-ds+cd-main) | 4 | pass |
| 161 | Geometry | tortuosity band RMS 8-20 mm (`tortuosity.b8_20`) | RCA RAO-0 | 5.365 | 6.485 to 12.387 (cd-ds+cd-main, RCA/any) | 4 | fail |
| 162 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | LCA AP-CRA | 13.455 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 163 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | LCA LAO-CRA | 13.862 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 164 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | LCA RAO-CAU | 15.002 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| 165 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | LCA RAO-CRA | 13.321 | 7.755 to 35.875 (cd-ds+cd-main) | 5 | pass |
| 166 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | RCA LAO-0 | 10.972 | 10.027 to 16.742 (cd-ds+cd-main) | 4 | pass |
| 167 | Geometry | tortuosity band RMS 20-60 mm (`tortuosity.b20_60`) | RCA RAO-0 | 10.656 | 10.027 to 16.742 (cd-ds+cd-main, RCA/any) | 4 | pass |
| 168 | Geometry | projected LM+LAD length (`shape.length_mm`) | LCA AP-CRA | 131.100 | no target |  | not scored |
| 169 | Geometry | projected LM+LAD length (`shape.length_mm`) | LCA LAO-CRA | 130.200 | no target |  | not scored |
| 170 | Geometry | projected LM+LAD length (`shape.length_mm`) | LCA RAO-CAU | 124.200 | no target |  | not scored |
| 171 | Geometry | projected LM+LAD length (`shape.length_mm`) | LCA RAO-CRA | 130.600 | 96.400 to 135.700 (cd-ds+cd-main) | 5 | pass |
| 172 | Geometry | LM+LAD arc / chord (`shape.arc_chord`) | LCA AP-CRA | 1.136 | no target |  | not scored |
| 173 | Geometry | LM+LAD arc / chord (`shape.arc_chord`) | LCA LAO-CRA | 1.148 | no target |  | not scored |
| 174 | Geometry | LM+LAD arc / chord (`shape.arc_chord`) | LCA RAO-CAU | 1.158 | no target |  | not scored |
| 175 | Geometry | LM+LAD arc / chord (`shape.arc_chord`) | LCA RAO-CRA | 1.154 | 1.211 to 1.460 (cd-ds+cd-main) | 5 | fail |
| 176 | Geometry | tree extent, width (`extent.width_mm`) | LCA AP-CRA | 55.000 | 75.692 to 119.692 (cd-ds+cd-main) | 11 | fail |
| 177 | Geometry | tree extent, width (`extent.width_mm`) | LCA LAO-CRA | 56.200 | 64.000 to 123.077 (cd-ds+cd-main) | 8 | fail |
| 178 | Geometry | tree extent, width (`extent.width_mm`) | LCA RAO-CAU | 66.700 | 86.831 to 114.154 (cd-ds+cd-main) | 12 | fail |
| 179 | Geometry | tree extent, width (`extent.width_mm`) | LCA RAO-CRA | 67.700 | 91.385 to 130.769 (cd-ds+cd-main) | 9 | fail |
| 180 | Geometry | tree extent, width (`extent.width_mm`) | RCA LAO-0 | 69.400 | 44.000 to 44.000 (cd-ds+cd-main) | 1 | outside, indicative |
| 181 | Geometry | tree extent, width (`extent.width_mm`) | RCA RAO-0 | 55.800 | no target |  | not scored |
| 182 | Geometry | tree extent, height (`extent.height_mm`) | LCA AP-CRA | 89.700 | 57.846 to 115.692 (cd-ds+cd-main) | 11 | pass |
| 183 | Geometry | tree extent, height (`extent.height_mm`) | LCA LAO-CRA | 94.100 | 53.231 to 124.615 (cd-ds+cd-main) | 8 | pass |
| 184 | Geometry | tree extent, height (`extent.height_mm`) | LCA RAO-CAU | 76.900 | 65.477 to 119.077 (cd-ds+cd-main) | 12 | pass |
| 185 | Geometry | tree extent, height (`extent.height_mm`) | LCA RAO-CRA | 80.500 | 40.000 to 128.000 (cd-ds+cd-main) | 9 | pass |
| 186 | Geometry | tree extent, height (`extent.height_mm`) | RCA LAO-0 | 112.700 | 50.462 to 50.462 (cd-ds+cd-main) | 1 | outside, indicative |
| 187 | Geometry | tree extent, height (`extent.height_mm`) | RCA RAO-0 | 115.800 | no target |  | not scored |
| 188 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | LCA AP-CRA | 9.740 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 189 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | LCA LAO-CRA | 9.670 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 190 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | LCA RAO-CAU | 6.440 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 191 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | LCA RAO-CRA | 9.570 | 3.945 to 15.483 (cd-ds+cd-main) | 25 | pass |
| 192 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | RCA LAO-0 | 10.460 | 9.421 to 29.348 (cd-ds+cd-main) | 19 | pass |
| 193 | Geometry | landmark displacement P10-P90 (mm) (`motion_mm.p10p90`) | RCA RAO-0 | 21.400 | 9.421 to 29.348 (cd-ds+cd-main, RCA/any) | 19 | pass |
| 194 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | LCA AP-CRA | 19.980 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 195 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | LCA LAO-CRA | 19.580 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 196 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | LCA RAO-CAU | 14.550 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 197 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | LCA RAO-CRA | 19.560 | 9.960 to 26.340 (cd-ds+cd-main) | 25 | pass |
| 198 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | RCA LAO-0 | 23.570 | 16.989 to 87.157 (cd-ds+cd-main) | 20 | pass |
| 199 | Geometry | landmark speed, median (mm/s) (`motion_mm.speed_median`) | RCA RAO-0 | 46.480 | 16.989 to 87.157 (cd-ds+cd-main, RCA/any) | 20 | pass |
| 200 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | LCA AP-CRA | 46.110 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 201 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | LCA LAO-CRA | 46.050 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 202 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | LCA RAO-CAU | 30.690 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| 203 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | LCA RAO-CRA | 45.320 | 27.157 to 57.443 (cd-ds+cd-main) | 25 | pass |
| 204 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | RCA LAO-0 | 52.380 | 47.100 to 134.151 (cd-ds+cd-main) | 20 | pass |
| 205 | Geometry | landmark speed, 90th centile (mm/s) (`motion_mm.speed_p90`) | RCA RAO-0 | 103.060 | 47.100 to 134.151 (cd-ds+cd-main, RCA/any) | 20 | pass |
| 206 | Grey levels | grey p5 (lad_apcra) (`grey.p5`) | LCA AP-CRA | 96.000 | 87.800 to 106.200 (cd-ds+cd-main) | 25 | pass |
| 207 | Grey levels | grey p50 (lad_apcra) (`grey.p50`) | LCA AP-CRA | 137.000 | 122.800 to 137.600 (cd-ds+cd-main) | 25 | pass |
| 208 | Grey levels | grey p95 (lad_apcra) (`grey.p95`) | LCA AP-CRA | 205.000 | 181.800 to 220.200 (cd-ds+cd-main) | 25 | pass |
| 209 | Grey levels | grey p5 (lad_laocra) (`grey.p5`) | LCA LAO-CRA | 95.000 | 81.800 to 102.200 (cd-ds+cd-main) | 25 | pass |
| 210 | Grey levels | grey p50 (lad_laocra) (`grey.p50`) | LCA LAO-CRA | 135.000 | 126.000 to 149.600 (cd-ds+cd-main) | 25 | pass |
| 211 | Grey levels | grey p95 (lad_laocra) (`grey.p95`) | LCA LAO-CRA | 199.000 | 182.400 to 223.200 (cd-ds+cd-main) | 25 | pass |
| 212 | Grey levels | grey p5 (lad_raocau) (`grey.p5`) | LCA RAO-CAU | 95.000 | 82.400 to 101.200 (cd-ds+cd-main) | 25 | pass |
| 213 | Grey levels | grey p50 (lad_raocau) (`grey.p50`) | LCA RAO-CAU | 136.000 | 129.400 to 145.000 (cd-ds+cd-main) | 25 | pass |
| 214 | Grey levels | grey p95 (lad_raocau) (`grey.p95`) | LCA RAO-CAU | 205.000 | 177.800 to 214.800 (cd-ds+cd-main) | 25 | pass |
| 215 | Grey levels | grey p5 (lad_raocra) (`grey.p5`) | LCA RAO-CRA | 95.000 | 77.800 to 104.800 (cd-ds+cd-main) | 25 | pass |
| 216 | Grey levels | grey p50 (lad_raocra) (`grey.p50`) | LCA RAO-CRA | 136.000 | 124.600 to 163.600 (cd-ds+cd-main) | 25 | pass |
| 217 | Grey levels | grey p95 (lad_raocra) (`grey.p95`) | LCA RAO-CRA | 206.000 | 200.800 to 237.200 (cd-ds+cd-main) | 25 | pass |
| 218 | Grey levels | grey p5 (rca_lao) (`grey.p5`) | RCA LAO-0 | 97.000 | 81.000 to 106.200 (cd-ds+cd-main) | 25 | pass |
| 219 | Grey levels | grey p50 (rca_lao) (`grey.p50`) | RCA LAO-0 | 136.000 | 135.000 to 156.600 (cd-ds+cd-main) | 25 | pass |
| 220 | Grey levels | grey p95 (rca_lao) (`grey.p95`) | RCA LAO-0 | 204.000 | 184.400 to 219.800 (cd-ds+cd-main) | 25 | pass |
| 221 | Grey levels | grey p5 (rca_rao) (`grey.p5`) | RCA RAO-0 | 96.000 | 81.000 to 99.000 (cd-ds+cd-main) | 3 | pass |
| 222 | Grey levels | grey p50 (rca_rao) (`grey.p50`) | RCA RAO-0 | 135.000 | 120.000 to 135.000 (cd-ds+cd-main) | 3 | pass |
| 223 | Grey levels | grey p95 (rca_rao) (`grey.p95`) | RCA RAO-0 | 205.000 | 161.000 to 177.000 (cd-ds+cd-main) | 3 | fail |
| 224 | Vessels | large vessels at peak opacification: fwhm_px (`vessel.vessel-large.fwhm_px`) | any | 9.104 | 4.045 to 9.605 | 10 | pass |
| 225 | Vessels | large vessels at peak opacification: depth (`vessel.vessel-large.depth`) | any | 68.335 | 38.353 to 75.072 | 10 | pass |
| 226 | Vessels | large vessels at peak opacification: w80_w20 (`vessel.vessel-large.w80_w20`) | any | 0.518 | 0.220 to 0.493 | 10 | fail |
| 227 | Vessels | large vessels at peak opacification: edge10_90_px (`vessel.vessel-large.edge10_90_px`) | any | 4.080 | 1.850 to 6.792 | 10 | pass |
| 228 | Vessels | large vessels at peak opacification: halo (`vessel.vessel-large.halo`) | any | 7.420 | 4.771 to 14.474 | 10 | pass |
| 229 | Vessels | smallest visible branches: fwhm_px (`vessel.vessel-small.fwhm_px`) | any | 2.382 | 1.986 to 5.748 | 6 | pass |
| 230 | Vessels | smallest visible branches: depth (`vessel.vessel-small.depth`) | any | 13.180 | 5.470 to 27.400 | 6 | pass |
| 231 | Bone | rib margins: fwhm_px (`vessel.rib-margin.fwhm_px`) | any | 3.872 | 4.008 to 4.162 | 2 | outside, indicative |
| 232 | Bone | rib margins: depth (`vessel.rib-margin.depth`) | any | 10.925 | 13.850 to 29.700 | 2 | outside, indicative |
| 233 | Catheter | unfilled guide catheter: outer_fwhm_px (`catheter.catheter.outer_fwhm_px`) | any | 7.000 | 7.000 to 9.750 | 3 | pass |
| 234 | Catheter | unfilled guide catheter: wall_sep_px (`catheter.catheter.wall_sep_px`) | any | 4.500 | 4.000 to 6.000 | 3 | pass |
| 235 | Catheter | unfilled guide catheter: lumen_contrast (`catheter.catheter.lumen_contrast`) | any | 9.900 | 3.010 to 25.430 | 3 | pass |
| 236 | Catheter | unfilled guide catheter: depth (`catheter.catheter.depth`) | any | 36.680 | 24.330 to 54.490 | 3 | pass |
| 237 | Motion | LAD cross-section track: range_px (`xtrack.motion-LAD.range_px`) | any | 23.990 | 22.880 to 31.110 | 3 | pass |
| 238 | Motion | LAD cross-section track: step_median (`xtrack.motion-LAD.step_median`) | any | 2.120 | 2.380 to 2.870 | 3 | fail |
| 239 | Motion | LAD cross-section track: step_p90 (`xtrack.motion-LAD.step_p90`) | any | 5.800 | 4.620 to 8.710 | 3 | pass |
| 240 | Motion | LAD cross-section track: step_max (`xtrack.motion-LAD.step_max`) | any | 8.935 | 8.190 to 12.020 | 3 | pass |
| 241 | Motion | RCA cross-section track: range_px (`xtrack.motion-RCA.range_px`) | any | 28.700 | 27.930 to 44.900 | 4 | pass |
| 242 | Motion | RCA cross-section track: step_median (`xtrack.motion-RCA.step_median`) | any | 7.600 | 2.420 to 8.910 | 4 | pass |
| 243 | Motion | RCA cross-section track: step_p90 (`xtrack.motion-RCA.step_p90`) | any | 9.875 | 8.230 to 12.130 | 4 | pass |
| 244 | Motion | RCA cross-section track: step_max (`xtrack.motion-RCA.step_max`) | any | 11.710 | 10.350 to 14.450 | 4 | pass |
| 245 | Motion | catheter shaft cross-section track: range_px (`xtrack.motion-cath.range_px`) | any | 13.780 | 10.250 to 30.810 | 5 | pass |
| 246 | Motion | catheter shaft cross-section track: step_median (`xtrack.motion-cath.step_median`) | any | 2.205 | 1.650 to 4.740 | 5 | pass |
| 247 | Motion | catheter shaft cross-section track: step_p90 (`xtrack.motion-cath.step_p90`) | any | 4.270 | 3.020 to 7.710 | 5 | pass |
| 248 | Motion | catheter shaft cross-section track: step_max (`xtrack.motion-cath.step_max`) | any | 4.985 | 4.770 to 11.090 | 5 | pass |
