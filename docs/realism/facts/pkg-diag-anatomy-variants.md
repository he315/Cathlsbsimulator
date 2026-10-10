# diag-anatomy-variants: model parameters

Anomalous coronary origins, high ostia, a separate conus, a very dilated root and a coronary-to-pulmonary-artery fistula: the root anatomy (`src/simulation/anatomy.ts`), the coronary tree (`src/render/xray/coronaryGrowth.ts`, `src/render/xray/coronaryAtlas.ts`), their filling (`src/render/xray/contrastTransport.ts`) and how often a random case carries one (`src/simulation/caseGenerator.ts`).

The manuals name the anomalies and how they show, not their geometry (pm-interpreting-anomalies, pm-engaging-fail: Oxford ch 6, Brilakis 5.7), so every placement is a model parameter. Sourced: the 1-2% of unselected angiograms with variant or anomalous anatomy (Oxford, taken at its midpoint for `ANOMALY_PRIOR`); the anomalous circumflex faintly filled on the RCA run (Oxford, pm-interpreting-anomalies); an aortogram through a pigtail, usually 60 mL over 3 s (Brilakis, pm-engaging-fail); telescoping a 4 Fr catheter through a 6 Fr AL3 guide in a very dilated root, and Brilakis's JL size rule of the aortic diameter in cm plus one (pm-engaging-fail, pm-engaging-left); a fistula usually drains to the pulmonary artery and the shunt is rarely large (pm-interpreting-anomalies; Oxford ch 6, Brilakis).

## Root and origins (anatomy.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `VERY_DILATED_ROOT_RADIUS` | src/simulation/anatomy.ts | 28 | mm (sinus radius; a 56 mm root) | MODEL PARAMETER: larger than the dilated root's 48 mm |
| `ANOM_RCA_LEFT` | src/simulation/anatomy.ts | dAzDeg 55, dHeight 3 | degrees past the left main towards the commissure; mm above it | MODEL PARAMETER: RCA from the left sinus |
| `ANOM_LM_RIGHT` | src/simulation/anatomy.ts | dAzDeg -30, dHeight -1 | degrees from the RCA ostium; mm relative to it | MODEL PARAMETER: left main from the right sinus |
| `ANOM_LCX_RIGHT` | src/simulation/anatomy.ts | dAzDeg 22, dHeight -2 | degrees posterior to the RCA ostium; mm below it | MODEL PARAMETER: circumflex from the right sinus |
| `HIGH_OSTIA_LIFT_MM` | src/simulation/anatomy.ts | 10 | mm | MODEL PARAMETER: both ostia this far above their usual height, at or above the sinotubular junction |
| `CONUS_SEPARATE` | src/simulation/anatomy.ts | dAzDeg -10, dHeight 2.5 | degrees; mm from the RCA ostium | MODEL PARAMETER: a conus with its own large ostium beside the RCA's (the usual conus is 18 degrees and 4 mm away) |
| `COURSE_CLEAR_MM` | src/simulation/anatomy.ts | 3 | mm beyond the sinus wall | MODEL PARAMETER: clearance of an anomalous artery's course round the root |

## Tree (coronaryGrowth.ts, coronaryAtlas.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `LCX_FROM_RCA_MM` | src/render/xray/coronaryGrowth.ts | 6 | mm along the RCA | MODEL PARAMETER: where a circumflex from the proximal RCA leaves it |
| `LM_COURSE_CLEAR_MM` | src/render/xray/coronaryGrowth.ts | 4 | mm | MODEL PARAMETER: clearance of an interarterial left main from the sinus wall |
| `FISTULA_DRAIN` | src/render/xray/coronaryGrowth.ts | dx 4, y 24, dz 6 | mm in the aortic frame (x = R + dx, z = R + dz) | MODEL PARAMETER: the drainage on the anterior wall of the pulmonary trunk above the valve |
| `FISTULA_TORTUOSITY` | src/render/xray/coronaryGrowth.ts | 1.8 | factor on the patient's tortuosity index | MODEL PARAMETER (fistulae are tortuous) |
| `FISTULA_WIDENING` | src/render/xray/coronaryGrowth.ts | 1.3 | factor over its length | MODEL PARAMETER: the fistula widens towards its drainage |
| `PRIORS.fistula` | src/render/xray/coronaryAtlas.ts | atFrac [0.06, 0.14], radiusMm [0.7, 0.95] | fraction of the LAD's length; mm | MODEL PARAMETERS: the manuals give no dimensions |

## Filling (contrastTransport.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `SINUS_FED` | src/render/xray/contrastTransport.ts | delayS 0.6, share 0.3 | s of flow time; share of the engaged ostium's strength | MODEL PARAMETERS: an artery with its own ostium in the injected sinus fills from the reflux; no source gives a delay or a share. A circumflex from the proximal RCA is a true RCA branch and keeps share 1 |
| `ROOT_INJECTION` | src/render/xray/contrastTransport.ts | falloffMm 18, sinusMax 0.35, aortogram 0.3 | mm (about a sinus radius); shares | MODEL PARAMETERS: a non-selective sinus injection reaches an ostium less with distance from the tip, at most 0.35; an aortogram reaches every ostium with 0.3 |

## How often (caseGenerator.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ANOMALY_PRIOR` | src/simulation/caseGenerator.ts | 0.015 | probability per random case that asks for it | The midpoint of Oxford's 1-2% (sourced); the equal split among `ANOMALY_VARIANTS` is a MODEL PARAMETER (Oxford gives 0.2-0.7% for the circumflex from the right side alone). Drawn only by specs with `anomalyPrior` (the free and anatomy labs' random cases, generateRandomCase, the 'rand' and 'daily' presets) |
