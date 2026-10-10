# diag-engagement-fallback: model parameters

The difficulty-free analytic engagement model (`src/simulation/engagement.ts`). The package removed difficulty from capture: every lab now uses one fixed row of thresholds. It added no new number; it relabelled the existing rows as model parameters and gave the conus check its own fixed set, taken from an existing row. Distances are in model units (mm) and alignments are cosines between the tip direction and the ostium's take-off axis.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `FIXED_ENGAGEMENT_THRESHOLDS` (= `THRESH.advanced`) | src/simulation/engagement.ts | selDist 3.6, alignSel 0.94, nearDist 8, alignCoax 0.9, deep 2.2 | mm; cosine; mm; cosine; mm | Model choice: the earlier 'advanced' row, kept unchanged and now used at every difficulty, so difficulty changes assistance only |
| `THRESH.beginner`, `THRESH.intermediate` | src/simulation/engagement.ts | beginner selDist 7, alignSel 0.85, nearDist 12, alignCoax 0.8, deep 3.6; intermediate 5, 0.9, 10, 0.85, 2.8 | as above | Model choice: the earlier difficulty-scaled rows, reachable only with `{ difficultyScaled: true }`, which no lab passes (kept for tests and comparison) |
| `CONUS_OVERSELECTION_THRESHOLDS` | src/simulation/engagement.ts | selDist 5, alignSel 0.9 (the intermediate row's values) | mm; cosine | Model choice, fitted by measurement: on a normal right-dominant test case a JR4, JR3.5, AR or IKR tip on the conus ostium lines up at a cosine of about 0.93, so judging the conus against the capture alignment 0.94 would make conus over-selection (and the VF it can provoke) unreachable |
