# Model parameters of pci-bench-measure-and-plan

The PCI bench's measuring and planning package (lab build plan, docs/curriculum/lab-build-plan.json). Every
value below is a MODEL PARAMETER of the teaching bench: the module text gives the rule but no number, or the
number is a grading tolerance or a teaching lesion's geometry. Values the package takes from the module
(left main MLA thresholds 6.0, 4.5 and 5.4 mm²; segment targets 5, 6, 7 and 8 mm²; the distal-reference
sizing rule lumen + 0.25 mm or EEM - 0.25 mm; the OCT flush of 4 mL/s for 4 s on the left and 3 mL/s for 3 s
on the right; the CKD patient's age 76 and eGFR 24) are cited in the code beside each constant and are not
repeated here.

## Engine (src/simulation/pciBench.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_AORTA_LUMEN_MM` | 30 | mm | Aortic lumen drawn proximal to an ostium. Chosen only to be wider than the imaging field of view, so the frame shows no coronary wall. Not a measured aortic size. |
| `MP_OCT_OSTIAL_UNCLEARED_MM` | 5 | mm | How far past an ostium an OCT flush leaves blood uncleared. Rests on the pm-imaging-when-which pitfall of failing to clear the ostium (the contrast escapes into the aorta); the module gives no length. |
| `MP_TWO_BRANCH_POC_MM` | 12 | mm | Where the LAD and the circumflex leave the left main in the distal-lm-two-branch preset. Teaching geometry. |
| Edge dissection severity (deploy()) | major when plaque burden at the edge > 0.6, otherwise minor | fraction | The rule that an edge in plaque burden over 50% or on lipid dissects when stretched is from pm-imaging-planning (Brilakis 13.3); the 0.6 split between minor and major is the bench's. |
| Distal-oversize severity (deploy()) | a stent larger than every size the distal reference allows dissects the distal edge; major when the nominal diameter exceeds the EEM at the distal edge, otherwise minor | mm | The rule not to size to the proximal reference is from pm-imaging-planning (Brilakis 13.3, 10.2); the severity split at the EEM is the bench's. |
| Left main MSA segment (`benchLeftMainSegment`) | an ostial left main lesion is judged against the proximal left main target, every other left main lesion against the distal | none | The targets themselves (7 mm² distal, 8 mm² proximal) are `MSA_MIN_LM_MM2` in src/simulation/imaging/criteria.ts. Which segment a preset belongs to is the bench's assignment from its geometry. |

## Grading (src/simulation/bench/measure.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MEASURE_TOLERANCE.mlaMm2` | 0.5 | mm² | Plan design tolerance for an entered MLA against the frame truth. |
| `MEASURE_TOLERANCE.refMm` | 0.25 | mm | Reference lumen and EEM diameters; one catalogue size step. |
| `MEASURE_TOLERANCE.landingMm` | 1 | mm | Landing zone positions. |
| `MEASURE_TOLERANCE.arcDeg` | 30 | degrees | Calcium arc. |
| `MEASURE_TOLERANCE.thicknessMm` | 0.1 | mm | Calcium thickness (OCT only; refused on IVUS). |
| `MEASURE_TOLERANCE.calciumLengthMm` | 1 | mm | Calcium length. |
| `MEASURE_TOLERANCE.lengthMm` | 2 | mm | Stent length; the sum of the two landing tolerances. |
| `MP_REFERENCE_WINDOW_MM` | 10 | mm | Length of a reference segment beyond the lesion; matches deploy(), which looks 10 mm beyond an edge. |
| `MP_REFERENCE_PB_MARGIN` | 0.02 | fraction | A reference segment starts where plaque burden falls to within this margin of the vessel's background. |
| `MP_LM_SEGMENT_MM` | poc 3, ostium 3 | mm | Lengths of the left main and branch-ostium segments either side of the bifurcation used for the segment table. |
| `MP_NO_TAPER_MM` | 0.25 | mm | Proximal minus distal reference lumen below which no separate proximal optimisation balloon is expected; one catalogue step. |

## Preset geometry (MEASURE_LESIONS in src/simulation/pciBench.ts)

All dimensions, plaque burdens, calcium and branch geometry are teaching values. Lengths and diameters in
mm, plaque burden as a fraction, arc in degrees.

| Preset | Segment | EEM prox / dist | Lesion | PB max / shoulder / background | Other |
|---|---|---|---|---|---|
| ostial-lm-ivus | 26 | 5.4 / 4.9 | 4-10, shoulder 3 | 0.77 / 0.5 / 0.3 | fibrous; calcium 5-9, arc 110, 0.4 thick; aorta proximal to 4 |
| distal-lm-two-branch | 40 | 5.2 / 3.4, piecewise (0: 5.2, 12: 5.0, 12.5: 4.0, 40: 3.4) | 5-12, shoulder 2 | 0.8 / 0.5 / 0.3 | fibrous; LAD and circumflex pullbacks from 12; circumflex branch 32 long, EEM 5.2, 5.0, 3.8 at 12.5, 3.2, ostial plaque 12.5-15.5 PB 0.78; side branch ostia at 12.75, 3.5 and 4.0 |
| aorto-ostial-rca | 40 | 4.6 / 4.0 | 4-12, shoulder 3 | 0.75 / 0.5 / 0.3 | calcified; calcium 5-11, arc 200, 0.4 thick; aorta proximal to 4 |
| ckd-ivus | 50 | 4.4 / 3.8 | 12-34, shoulder 4 | 0.78 / 0.52 / 0.32 | fibrous; patient age and eGFR from the module |
| acs-culprit-oct | 36 | 4.0 / 3.5 | 11-21, shoulder 2 | 0.74 / 0.45 / 0.28 | lipid, arc 190; red thrombus |
