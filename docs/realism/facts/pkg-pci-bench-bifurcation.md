# pci-bench-bifurcation: model parameters

The bifurcation bench (`src/simulation/bench/bifurcation.ts`), the shared technique step catalogue (`src/simulation/pci/technique/steps.ts`), the bench panel and the bifurcation view. The step catalogue holds the techniques' steps as the module text gives them; it adds no numbers.

Sourced values carry their location in the code and are not repeated as model parameters: Finet's coefficient 0.678 (Brilakis 16.2, cp-bifurcation-two-stent-dk-crush); the shortest POT balloons 6 mm and 8-10 mm of stent proximal to the carina being better (`POT_MIN_PROXIMAL_MM`, `POT_BETTER_PROXIMAL_MM`, cp-bifurcation-provisional-setup); coverage after a kiss through crushed layers, one-step 0.53 and two-step 0.33 (`CRUSH_KISS_COVERAGE`, Ormiston micro-CT, cp-bifurcation-two-stent-dk-crush 'Why two steps?'); the technique choice by Brilakis's chart (reverse crush and culotte below 70 degrees) and the trials named in the presets' `why` and `source`; the left main DK crush case (cp-bifurcation-two-stent-case-lm-dk-crush: Medina 1,1,1, circumflex 2.75 mm, LAD-circumflex angle about 60 degrees, IVUS left main 4.0 and proximal LAD 3.0 mm).

## Tolerances and coverage (bifurcation.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_SIZE_TOL_MM` | src/simulation/bench/bifurcation.ts | 0.25 | mm | MODEL PARAMETER: '1:1', 'sized to' and 'similar' (the plan's 0.25 mm for Finet) |
| `MP_CARINA_BEYOND_TOL_MM` | src/simulation/bench/bifurcation.ts | 0.5 | mm | MODEL PARAMETER: how far beyond the carina a distal marker may sit and still be 'at the carina' |
| `MP_POT_PROXIMAL_TOL_MM` | src/simulation/bench/bifurcation.ts | 2 | mm | MODEL PARAMETER: a POT marker more proximal is 'too proximal' (the module's exercise moves it 3 mm) |
| `MP_CLEARLY_LARGER_MM` | src/simulation/bench/bifurcation.ts | 0.5 | mm | MODEL PARAMETER: the proximal MV is 'clearly larger' than the distal from this difference |
| `MP_JAIL_COVERAGE` | src/simulation/bench/bifurcation.ts | open 0.45, closed 0.6 | share of the SB ostium covered by metal | MODEL PARAMETER: one jailing layer before any kiss, by cell design |
| `MP_CRUSHED_COVERAGE` | src/simulation/bench/bifurcation.ts | 0.8 | share | MODEL PARAMETER: crushed layers before the kiss |
| `MP_SINGLE_LAYER_FACTOR` | src/simulation/bench/bifurcation.ts | 0.6 | share of the crushed figures | MODEL PARAMETER: a single jailing layer after a kiss |
| `MP_WRONG_CELL_COVERAGE` | src/simulation/bench/bifurcation.ts | 0.15 | added share | MODEL PARAMETER: rewiring through the wrong strut |
| `MP_TAP_SB_FIRST_COVERAGE` | src/simulation/bench/bifurcation.ts | 0.2 | added share | MODEL PARAMETER: the MV balloon deflated last in the TAP kiss |
| `MP_KISS_OVAL` | src/simulation/bench/bifurcation.ts | 0.3 | oval index = 1 + 0.3 x (smaller / larger balloon) | MODEL PARAMETER: ovalisation a kiss leaves |
| `MP_ROUND_OVAL_INDEX` | src/simulation/bench/bifurcation.ts | 1.1 | oval index | MODEL PARAMETER: up to this the proximal stent counts as round |
| `MP_OPEN_STRUTS_FACTOR` | src/simulation/bench/bifurcation.ts | 0.6 | share of the ostial metal left | MODEL PARAMETER: opening the struts into the unstented culotte branch |
| `MP_UNOPENED_SECOND_STENT_COVERAGE` | src/simulation/bench/bifurcation.ts | 0.1 | added share | MODEL PARAMETER: the second culotte stent through unopened struts |
| `MP_POT_BEYOND_COVERAGE` | src/simulation/bench/bifurcation.ts | 0.1 | added share | MODEL PARAMETER: a POT beyond the carina with the SB unstented |
| `MP_NEOCARINA_CRUSH_FACTOR` | src/simulation/bench/bifurcation.ts | 0.3 | share of the TAP neocarina left | MODEL PARAMETER: a POT crushes the protruding struts |
| `MP_SCORE_MAJOR`, `MP_SCORE_MINOR` | src/simulation/bench/bifurcation.ts | 10; 3 | points lost per finding (a failure scores 0) | MODEL PARAMETER: the result's scoring |
| `MP_TAP_DELIVER_BEYOND_MM` | src/simulation/bench/bifurcation.ts | 2 | mm beyond the SB ostium | MODEL PARAMETER: where the TAP SB stent first sits, before its protrusion is set |
| `MP_BRANCH_BALLOON_DEFAULT_MM` | src/simulation/bench/bifurcation.ts | 2.0 | mm | MODEL PARAMETER: SB balloon diameter when none is given |
| `MP_CRUSH_POT_MARKER_MM` | src/simulation/bench/bifurcation.ts | -0.5 | mm from the carina (negative: proximal) | MODEL PARAMETER: the POT's distal marker after a distally sized crush balloon when none is given |

## Presets (bifurcation.ts `BIF_PRESETS`)

Each preset lists its model-parameter fields in `modelParam`. References in mm, angle in degrees.

| Preset | File | Geometry | Rests on |
|---|---|---|---|
| `bif-provisional` | src/simulation/bench/bifurcation.ts | proximal 3.5, distal 3.0, SB 2.75, angle 50; drawn lengths 16, 20, 14 | Drawn lengths and the diagonal's ostial disease as 'mild' are MODEL PARAMETERS |
| `bif-tap` | src/simulation/bench/bifurcation.ts | proximal 3.5, distal 3.0, SB 2.5, angle 80; drawn lengths 16, 20, 14 | Drawn lengths, Medina 1,1,1 and the ostial disease as 'severe' are MODEL PARAMETERS |
| `bif-dk-crush` | src/simulation/bench/bifurcation.ts | proximal 4.0, distal 3.0, SB 2.75, angle 60; drawn lengths 14, 20, 16 | The module's left main case; the drawn lengths are MODEL PARAMETERS |
| `bif-culotte` | src/simulation/bench/bifurcation.ts | proximal 3.75, distal 2.75, SB 2.75, angle 45; drawn lengths 16, 20, 14 | MODEL PARAMETER, the whole geometry: branches of the same size (the culotte lesson's rule) and a proximal reference near Finet (0.678 x (2.75 + 2.75) = 3.73 mm), so a kiss with each balloon 1:1 fits |
