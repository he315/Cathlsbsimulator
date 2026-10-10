# diag-grafts-svg: model parameters

Bypass grafts in the shared coronary tree: the aortic graft ostia and the graft search (`src/simulation/anatomy.ts`), the graft courses (`src/render/xray/coronaryGrowth.ts`), graft disease and occlusion (`src/render/xray/coronaryTree.ts`), graft and competitive contrast transport (`src/render/xray/contrastTransport.ts`), the aortogram fill and ring markers (`src/render/xray/sceneBuilder.ts`), the post-CABG hardware (`src/ui/sim/FluoroView.tsx`), the bypass catheter shapes (`src/physics/catheterShapes.ts`), the road map (`src/ui/lab/ReferenceMonitor.tsx`, `src/ui/lab/LiveMonitor.tsx`) and the post-CABG scenarios (`src/simulation/diagnosticScenarios/grafts.ts`).

What is sourced is the order and the phenomena, from the module text: vein grafts are sewn onto the front of the ascending aorta a short way above the sinuses, circumflex grafts highest, LAD and diagonal grafts just above the left coronary ostium, RCA grafts lowest, just above and in front of the native RCA (Oxford ch 7, as src/content/manual/cath-handbook/10-background.ts and src/content/manual/complex-pci/05-prior-cabg.ts give it; lab requests cp-prior-cabg#0, hb-background#2); grafts may need more contrast and longer runs, washout beyond the anastomosis and back-filling of a graft on native injection are competitive flow, and an occluded native artery without collaterals suggests its graft may still be open (05-prior-cabg.ts, tips diag-svg-long-run, diag-graft-not-found; Oxford ch 6 and 7, Brilakis 18.5 and 18.6); an occluded graft shows as a stump on the aorta, and an LAO aortogram with a long acquisition can serve as a road map (cath-handbook/04-cardiac-catheterisation.ts, tip diag-aortogram-graft-roadmap; Oxford ch 4 and 7). Every dimension, speed, share and time below is a model choice made to draw those, not a measured value.

## Graft ostia and the graft search (anatomy.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `GRAFT_OSTIUM` | src/simulation/anatomy.ts | aorta-high 16 mm above the sinotubular junction at 55 degrees; aorta-mid 10 mm at 72 degrees; aorta-low 5 mm at 118 degrees | mm above sinusTopY; degrees azimuth in the aortic frame (90 anterior, 150 the native RCA's sinus) | MODEL PARAMETER inside the sourced order (circumflex highest, LAD just above the left coronary ostium level, RCA lowest and anterior to the native RCA) |
| `GRAFT_SAME_SITE` | src/simulation/anatomy.ts | dAzDeg -14, dHeightMm 3 | degrees; mm per further graft at the same site | MODEL PARAMETER: a second graft sewn beside the first |
| `GRAFT_WALL_RATIO` | src/simulation/anatomy.ts | 0.9 | share of the sinus radius | MODEL PARAMETER, the physics' ascending-aorta ratio (src/physics/lumen.ts ASC_RADIUS_RATIO) |
| `GRAFT_TAKEOFF_DOWN` | src/simulation/anatomy.ts | 0.35 | downward component of the unit take-off direction | MODEL PARAMETER: the conduit leaves the aorta forwards and down |
| `GRAFT_SEARCH.levelMm`, `GRAFT_SEARCH.nearMm` | src/simulation/anatomy.ts | 4, 9 | mm | MODEL PARAMETER: the tip is at a graft's level within 4 mm of its ostium's height, at least 9 mm off the aortic axis on the graft's side, and only at the graft nearest it in height (the bands of neighbouring grafts do not overlap) |
| `GRAFT_SEARCH.attemptGapS` | src/simulation/anatomy.ts | 2 | s | MODEL PARAMETER: a return to the level after this long away is a new attempt |
| `GRAFT_SEARCH.attemptMinS` | src/simulation/anatomy.ts | 0.5 | s | MODEL PARAMETER: a return to a level counts only once the tip has stayed there this long, so a tip passing through a level on its way up or down, or springing past it, has not tried that graft; a tip inside a graft's lumen is at that graft |
| `GRAFT_SEARCH.attempts`, `GRAFT_SEARCH.dwellS` | src/simulation/anatomy.ts | 4, 60 | attempts; s | MODEL PARAMETER: the module text says "repeated failed attempts or time" (lab request cp-prior-cabg#0) and gives no number |
| `GRAFT_SEARCH.seatS` | src/simulation/anatomy.ts | 0.5 | s | MODEL PARAMETER: a tip passing through a graft's mouth has not found it |

## Graft course and status (coronaryGrowth.ts, coronaryTree.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `GRAFT_COURSE.takeoffMm`, `GRAFT_COURSE.liftMm`, `GRAFT_COURSE.approachMm` | src/render/xray/coronaryGrowth.ts | 12, 3, 10 | mm | MODEL PARAMETER: straight take-off from the aorta, height above the epicardium, approach alongside the target before the end-to-side anastomosis |
| `GRAFT_COURSE.radiusMm` | src/render/xray/coronaryGrowth.ts | svg 2.2, radial 1.5 | mm (lumen radius) | MODEL PARAMETER: a vein graft about 4.5 mm across, a radial graft about 3 mm |
| `GRAFT_COURSE.stepMm` | src/render/xray/coronaryGrowth.ts | 1.0 | mm | MODEL PARAMETER: resampling step |
| `GRAFT_LESION.diseased` | src/render/xray/coronaryTree.ts | atMm 6, severity 75, lengthMm 8 | mm from the ostium; % diameter; mm | MODEL PARAMETER: one stenosis just inside the ostium (lab request cp-prior-cabg#0, pressure-damped at a stenosed graft ostium); the rod's trace does not yet damp there (the session narrows the tip's gap only for native ostial lesions), so diag-graft-imaging-competitive-flow asks for the stenosis to be recorded (check ostial-stenosis), not for a damped trace |
| `GRAFT_LESION.stumpMm`, `GRAFT_LESION.stumpEndShare` | src/render/xray/coronaryTree.ts | 6, 0.35 | mm; share of the lumen radius at the stump's end | MODEL PARAMETER: the occluded graft's stump (Oxford ch 7 names the stump, not its size) |

## Graft transport (contrastTransport.ts `GRAFT_FLOW`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `GRAFT_FLOW.restMlS` | src/render/xray/contrastTransport.ts | 0.9 | mL/s | MODEL PARAMETER: resting flow of a patent graft; with the transit gain it gives about 70 mm/s in a 4.4 mm conduit, so a 145 mm graft takes about 2 s to reach its anastomosis |
| `GRAFT_FLOW.nativeSpreadMmS`, `GRAFT_FLOW.retroSpeedMmS` | src/render/xray/contrastTransport.ts | 110, 70 | mm/s | MODEL PARAMETER: spread through the native bed from the anastomosis, antegrade and retrograde |
| `GRAFT_FLOW.competitiveRetroMm` | src/render/xray/contrastTransport.ts | 25 | mm | MODEL PARAMETER: with the native vessel open upstream, the retrograde column stops this far back (competitive flow) |
| `GRAFT_FLOW.capMm` | src/render/xray/contrastTransport.ts | 10 | mm | MODEL PARAMETER: the occlusion's cap that graft contrast does not enter |
| `GRAFT_FLOW.competition` | src/render/xray/contrastTransport.ts | fromPct 40, toPct 90, maxShare 0.6 | % diameter stenosis upstream; share of the bed beyond the anastomosis | MODEL PARAMETER: competitive washout appears with a stenosed native vessel (05-prior-cabg.ts) and rises with the stenosis |
| `GRAFT_FLOW.diseasedShare` | src/render/xray/contrastTransport.ts | 0.6 | share of a patent graft's flow (its own run) and of its competition (washout on a native run) | MODEL PARAMETER |
| `GRAFT_FLOW.backfill` | src/render/xray/contrastTransport.ts | mm 30, gain 0.45 | mm from the anastomosis; share of the native strength | MODEL PARAMETER: back-filling of a graft on native injection (05-prior-cabg.ts) |

## Scene, hardware, catheters, road map, scenarios

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `AORTOGRAM_GRAFT` | src/render/xray/sceneBuilder.ts | share 0.7, fadeMm 40 | share of the aortic concentration; mm along the graft | MODEL PARAMETER: each graft, or an occluded graft's stump, fills from the opacified root on an aortogram |
| `GRAFT_RING` | src/render/xray/sceneBuilder.ts | atMm 2.5, wireMm 0.35, clearMm 0.9 | mm | MODEL PARAMETER: steel ring marker round the conduit at the aortic anastomosis (the operation note names ring markers, lab request cp-prior-cabg#0) |
| `graftHardware` | src/ui/sim/FluoroView.tsx | 5 to 7 sternal wires; mammary-bed clips after a mammary graft | count | MODEL PARAMETER inside hardware.ts's typical sternotomy range (src/render/xray/hardware.ts HardwareSpec: "typical 5-7") |
| `leftCoronaryBypass` | src/physics/catheterShapes.ts | tip 3 mm; primary 10 mm turning 75 degrees; arm 36 mm; secondary 28 mm turning 45 degrees | mm; degrees | MODEL PARAMETER: the module text names the left coronary bypass shape for left grafts a Judkins right cannot reach (tip diag-svg-jr4-after-rca), not its geometry |
| `rightCoronaryBypass` | src/physics/catheterShapes.ts | tip 3 mm; primary 8 mm turning 95 degrees; arm 30 mm; secondary 22 mm turning 30 degrees | mm; degrees | MODEL PARAMETER: a Judkins right with a tighter, downward primary curve for downgoing right grafts |
| `CATHETERS` | src/data/catheters.ts | LCB reach 17, azimuth 60 degrees, seat height 36; RCB reach 17, azimuth 120 degrees, seat height 30 | mm; degrees; mm | MODEL PARAMETER for the analytic engagement model, like every catalogue entry's behaviour |
| `ROADMAP_TOLERANCE_DEG` | src/ui/lab/ReferenceMonitor.tsx | 2 | degrees on each axis | the design's value (docs/curriculum/lab-build-plan.json, diag-grafts-svg) |
| `ROADMAP_FIELD_TOLERANCE_CM` | src/ui/lab/ReferenceMonitor.tsx | 0.5 | cm of field size | MODEL PARAMETER: below the smallest step between the lab's field sizes (25, 20, 16, 12 cm), so the road map shows only at the field it was acquired at |
| `ROADMAP_OPACITY` | src/ui/lab/LiveMonitor.tsx | 0.45 | opacity | MODEL PARAMETER: a display choice |
| `GRAFT_NOT_FOUND_AFTER_S` | src/simulation/diagnosticScenarios/grafts.ts | 240 | s of lab time with the catheter still in the ascending aorta | MODEL PARAMETER: the road-map scenario's stand-in (diag-graft-roadmap-aortogram only, whose premise is a graft not found) for the per-graft search rule (GRAFT_SEARCH) until a session module runs it |

The graft network takes the live flow modifiers with transportNet's rules (no-reflow beyond its point, the patient's per-vessel flow scale); it adds no constant of its own for them.

## Realism re-capture

The first re-capture, `wpgrafts` (10 October 2026, 11:43), was taken before the last saves of contrastTransport.ts, sceneBuilder.ts, FluoroView.tsx and coronaryTree.ts (12:00 to 12:06) and of anatomy.ts (12:08). The set was captured again against the final code as `wpgrafts-r2` (10 October 2026, development server on port 5173): `__xrayCapture.baseline("wpgrafts-r2")` (the c1g0 specs and the four device scenes, offscreen), then at a 1600 x 1000 viewport `live("pci", "wpgrafts-r2")` from the PCI lab and `live("diagnostic", "wpgrafts-r2")` from the cath lab on a freshly loaded case. `python3 scripts/realism/report.py wpgrafts-r2`: 189 of 236 rows inside the real band, as the baseline. `python3 scripts/realism/compare_sets.py baseline wpgrafts-r2` lists no lost and no gained rows, and `compare_sets.py wpgrafts wpgrafts-r2` likewise, so no row was re-scored. Byte for byte, every frame of the offscreen sequences is identical to `wpgrafts`; the eight scorecard sequences and dev_guide and dev_wire are identical to the baseline's frames, and dev_balloon and dev_stent differ from the baseline as they already did in captures by earlier packages (see pkg-pci-guide-engagement.md). The two live sequences read the wall clock and differ in every frame, as live runs do.
