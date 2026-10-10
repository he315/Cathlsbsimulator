# haemo-transducer-and-setup: model parameters

Setting up the haemodynamic pressure line: levelling, zeroing, the manifold, the fast-flush test and its faults (`src/simulation/haemoStudy.ts`, `src/simulation/patient/transducer.ts`, `src/ui/haemo/SetupPanel.tsx`, `src/ui/haemo/TracePanel.tsx`) and the set-up presets.

Sourced values carry their location in the code and are not repeated as model parameters: the natural frequency a line needs, above 24 Hz, and an adequate line's one or two oscillations after a fast flush (`FLUSH_MIN_FN_HZ` 24, `FLUSH_MAX_OSCILLATIONS` 2; Deranged Physiology, docs/realism/facts/S9.md §transducer); optimal damping 0.64-0.7 (S9.md); longer tubing makes resonance more likely, with several oscillations and a systolic overshoot (pm-monitoring-transducers, 'Doing and reading the test'); levelling to the mid-thoracic level and the test as described (Michard 2024 in the module); the hydrostatic offset is physics (`MMHG_PER_CM`, about 0.74 mmHg per cm). The 0.3 mL of air and the 300 cm extension are the acceptance tests of this package's plan.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_CHEST_DEPTH_CM` | src/simulation/haemoStudy.ts | 20 | cm | MODEL PARAMETER: front-to-back chest depth, so V4 sits 10 cm above the mid-thoracic level |
| `MP_TABLE_MOVE_CM` | src/simulation/haemoStudy.ts | 10 | cm | MODEL PARAMETER: the table raised in the table-move preset (the module's check: a difficult femoral venous puncture) |
| `MP_HAEMO_LEVEL_TOL_CM` | src/simulation/haemoStudy.ts | 1 | cm | MODEL PARAMETER: within this of the mid-thoracic level counts as level (under 1 mmHg) |
| `MP_UNZEROED_OFFSET_MMHG` | src/simulation/haemoStudy.ts | 6 | mmHg | MODEL PARAMETER: what an unzeroed transducer reads at atmosphere |
| `MP_PRESET_AIR_ML` | src/simulation/haemoStudy.ts | 0.3 | mL | The plan's acceptance test: air in the dome in the overdamped preset |
| `MP_KINK_RMM` | src/simulation/haemoStudy.ts | 0.2 | mm | MODEL PARAMETER: inner radius of a kinked line |
| `HAEMO_LINE` | src/simulation/haemoStudy.ts | catheter 100 cm x 0.45 mm radius, line 30 cm x 0.9 mm, damping gain 5.8 | cm; mm; gain | MODEL PARAMETERS chosen so the line sits in the sourced band: about 25.7 Hz and a damping of about 0.6, called optimal, with one visible oscillation after a fast flush. The diagnostic lab's DEFAULT_LINE is unchanged |
| `HAEMO_LONG_LINE_CM` | src/simulation/haemoStudy.ts | 300 | cm | The plan's acceptance test: the long extension of the underdamped preset |
| `MP_LONG_LINE_RMM` | src/simulation/haemoStudy.ts | 0.4 | mm | MODEL PARAMETER: inner radius of the long extension |
| `MP_LONG_LINE_DAMPING_GAIN` | src/simulation/haemoStudy.ts | 1 | gain | MODEL PARAMETER: the lumped model cannot ring through a longer line by itself, so the extension carries a lower gain: about 12 Hz, damping about 0.28, three visible oscillations |
| `MANIFOLD_PORTS` | src/simulation/haemoStudy.ts | four: pressure line, contrast, saline flush, waste | ports | MODEL PARAMETER: the module describes 3-5 |
| Set-up preset score weighting (`scoreStudy`) | src/simulation/haemoStudy.ts | study score x 0.75 + 25 x the share of set-up checks met; air injected through the manifold fails the study | points | MODEL PARAMETERS of the set-up presets' scoring |
| `CHAIN_DT_S` | src/simulation/haemoStudy.ts | 0.0005 | s | Numerical setting: Transducer.step asks for 0.5 ms or less |
| `MP_FLUSH_VISIBLE` | src/simulation/patient/transducer.ts | 0.03 | share of the flush step | MODEL PARAMETER: an oscillation is visible while at least this; chosen so a line at the top of the optimal band (damping 0.75, dynamic()'s overdamped boundary) shows none |
| `FLUSH_GRID_S` | src/ui/haemo/SetupPanel.tsx | 0.04 | s | MODEL PARAMETER: one small square of a 25 mm/s strip, so the ringing period can be read |
| `CHAIN_MAX_GAP_S`, `CHAIN_RESTART_S` | src/ui/haemo/TracePanel.tsx | 2; 1 | s | Display settings: a longer gap in the trace clock (a hidden pane) restarts the chain 1 s before now |
