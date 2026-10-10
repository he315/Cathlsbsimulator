# physiology-left-main-and-ostial: model parameters

Each value below is a MODEL PARAMETER. None comes directly from a source. Where a value is fitted to a figure in the module text, the figure is named.

| Parameter | File | Value | Unit | What it rests on |
|---|---|---|---|---|
| `MP_OSTIAL_GUIDE` | src/simulation/physiology.ts | A 2, B 14 | mmHg·s/mL, mmHg·s²/mL² | Fitted so that a seated guide without side holes reads the FFR about 0.04 high. The figure is from the study cited in cp-ostial (lesson cp-ostial-assess): 0.87 engaged against 0.83 disengaged. In the left main (`ostial-lm-damped`) the model gives about 0.06, an extrapolation. |
| `MP_SIDE_HOLE_SCALE` | src/simulation/physiology.ts | 0.25 | fraction | Fitted to the same study with a side-hole guide: 0.85 against 0.83, about 0.02 high. |
| `LM_SEG` | src/simulation/physiology.ts | 4.5 mm reference diameter, 10 mm long | mm | Chosen so that each preset shows its teaching point. It matches the session's `MP_LM_LENGTH_MM` (10 mm). |
| `branchCase` dimensions | src/simulation/physiology.ts | LAD 3.5 mm × 110 mm, LCx 3.2 mm × 90 mm, diffuse 0.05, CFR potential 3.6 | mm, fraction | Chosen so that each preset shows its teaching point. |
| Left main preset lesions (`LEFT_MAIN_MODELS`, `OSTIAL_RCA`) | src/simulation/physiology.ts | per preset (diameter stenosis, position, length, `looksDs`) | fraction, mm | Each preset's figures are set so that its branch FFRs fall on the side of 0.80 that the module text's teaching point needs. The cut-off itself comes from `CUTOFF`. |
| `JUNCTION_MAX_ITER`, `JUNCTION_TOL_MMHG` | src/simulation/physiology.ts | 60, 1e-9 | iterations, mmHg | Numerical settings of the junction solver, not physiology. |

## Session integration (this run)

This run added no new numeric parameter. In a branched preset, the session (src/simulation/pci/pwSession.ts, action `branch`) pulls the wire back until its tip lies at the bifurcation before steering it into the other branch. That distance uses the left main length above and `SENSOR_FROM_TIP_MM` (sourced in pressureWire.ts).
