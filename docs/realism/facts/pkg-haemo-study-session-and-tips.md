# haemo-study-session-and-tips: model parameters

The haemodynamics lab as a study session (`src/simulation/haemoStudy.ts`), five new teaching scenarios (`src/simulation/haemo.ts`) and the lab's tip context (`src/ui/lab/haemoTips.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the grading tolerances for CPO (within 0.02 W) and PAPi (within 0.1), lab request pm-support-choice#1; SVR within 10% and Qp:Qs within 0.1, this package's design in lab-build-plan.json; the shock decision table at CPO 0.6 W and PAPi 0.9 (`SHOCK_CPO_W`, `SHOCK_PAPI`, `SHOCK_TABLE`), lessons pm-support-choice-rv and pm-support-choice-shock; the formulas and their lesson ids in `CALCS`.

## Grading and scoring (haemoStudy.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `CALC_TOLERANCE.co` | src/simulation/haemoStudy.ts | rel 0.1 | share of the reference | MODEL PARAMETER: a grading band for this lab, not a clinical value |
| `CALC_TOLERANCE.ci` | src/simulation/haemoStudy.ts | rel 0.1 | share of the reference | MODEL PARAMETER, as above |
| `CALC_TOLERANCE.pvr` | src/simulation/haemoStudy.ts | rel 0.1 or abs 0.3 | share; Wood units | MODEL PARAMETER, as above |
| `CALC_TOLERANCE.tpg` | src/simulation/haemoStudy.ts | abs 2 | mmHg | MODEL PARAMETER, as above |
| `CALC_TOLERANCE.ava`, `CALC_TOLERANCE.mva` | src/simulation/haemoStudy.ts | abs 0.1 each | cm² | MODEL PARAMETER, as above |
| Study score weights (`scoreStudy`) | src/simulation/haemoStudy.ts | diagnosis 50, data collected 25, calculations 25 | points of 100 | MODEL PARAMETERS of this lab's scoring. A calculation counts when accepted at the first entry; for a scenario with sets the shock decision counts as one more calculation |
| `HAEMO_HYPOTENSION_MAP` | src/simulation/haemoStudy.ts | 65 | mmHg (displayed MAP) | The same value as `PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg` (MODEL PARAMETER there, see pkg-found-lab-session-plumbing.md); haemoTips.test.ts checks they agree. No hold time, because the scenarios are steady |

## Teaching scenarios (haemo.ts)

Every pressure, saturation and Hb in these five scenarios is a MODEL PARAMETER: written for this app to sit clearly on one side of the module thresholds the study teaches (pm-support-choice: CPO 0.6 W, PAPi 0.9, wedge 25 mmHg with a mixed venous saturation of 50%; RV failure at an RA pressure above 12 mmHg (Brilakis, pm-support-choice, src/content/manual/pci-manual/16-support-choice.ts); hb-specific-conditions-pe: PA systolic 60 mmHg). None is a measured patient. Pressures in mmHg, saturations as fractions, Hb in g/dL.

| Scenario | File | Key values | Sits on this side of |
|---|---|---|---|
| `pe-high-risk` | src/simulation/haemo.ts | HR 112; RA base 13; RV 46/14 (systolic/EDP); PA 46/22; wedge base 7; Ao 78/50; PA sat 0.52, Ao 0.89; Hb 13 | Raised right-sided pressures with a normal wedge; PA systolic below 60 mmHg |
| `shock-lv` | src/simulation/haemo.ts | Before: HR 110; RA base 10; PA 42/26; wedge base 26; Ao 76/48; PA sat 0.48. After PCI: HR 96; RA base 8; PA 36/20; wedge base 17; Ao 98/62; PA sat 0.64. Hb 13.5 | CPO below 0.6 W before, above after; PAPi above 0.9 throughout (the wean row) |
| `shock-rv` | src/simulation/haemo.ts | Before: HR 62; RA base 16; PA 27/18; wedge base 10; Ao 78/50; PA sat 0.51. After PCI: HR 78; RA base 13; PA 28/19; wedge base 11; Ao 104/66; PA sat 0.64. Hb 13 | RA above 12 mmHg and PAPi below 0.9; after PCI CPO above 0.6 W with PAPi still below 0.9 |
| `shock-biv` | src/simulation/haemo.ts | Before: HR 118; RA base 16; PA 40/30; wedge base 27; Ao 70/46; PA sat 0.45. After PCI: HR 112; RA base 17; PA 38/29; wedge base 22; Ao 78/50; PA sat 0.52. Hb 13 | CPO below 0.6 W and PAPi below 0.9 before and after |
| `chip-elective` | src/simulation/haemo.ts | HR 84; RA base 8; PA 52/30; wedge base 27; Ao 116/68; PA sat 0.46; Hb 12.5 | Wedge above 25 mmHg with a mixed venous saturation below 50%, normal blood pressure, PAPi above 0.9 |
