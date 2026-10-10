# I1 scorecard, step 2: hand injection and contrast transport

This file was revised after the adversarial review of step 2. The revision withdrew the slow plunger release, recalibrated
the standard push, corrected the slowing beyond chronic stenoses and made the denominators consistent. The first
submission's numbers are kept further down with corrected denominators.

## How the sets were taken and scored

Capture sets were filmed on 2026-10-05 from the development server, in a tab of its own on a non-application page of
the server (`/package.json`, so other agents' hot reloads could not interrupt a capture), with
`import("/src/dev/xrayCapture.ts")`: the six S0 reference views (768 px, 20 cm field, 15 frames/s, four fluoroscopy
warm-up frames), **51 frames (3.4 s, `CINE_RUN_S`, the lab's run)**, `injection { at: 0, duration: D }` (`at` is the
press; the push follows `OPERATOR_DELAY_S` = 0.3 s later inside the scene builder, so every run opens on pre-contrast
frames), plus the 40-frame fluoroscopy companion without contrast:

    m.capture([...m.standardSpecs(set, { fluoro: false, nFrames: 51, injection: { at: 0, duration: D } }),
               { set, name: "lad_raocau_fluoro", view: "raocaudal", scenario: "lad-focal", mode: "fluoro", nFrames: 40, injection: null }])

All sets use the committed constants of their time, without development overrides, except `i1s3flush`
(`window.__sceneOverrides = { catheterContrast: 0 }`: the guide holds saline before the push). Scoring:
`python3 scripts/realism/report.py <set>` (matched pipeline) and `--pipeline lossless`.

**Denominators.** Every count in this file is the one report.py prints: rows where the simulator has a value and the
target has at least 3 real runs. Rows with no simulator value (for example a 50 % washout that never happens inside the
run) are left out of both the numerator and the denominator. The family table uses the same rule, so its columns add up
to the headline. The first submission's family table counted rows without a value as failures, which gave 235 where
report.py printed 233; that table has been recomputed below.

## Summary

| Set | What it is | Matched | Lossless |
|---|---|---|---|
| `s0base` | S0 baseline (wave-1 tree) | 133 of 229 | 137 of 229 |
| `i1final` | step 1, canned bolus | 154 of 228 | 157 of 228 |
| `i1s2final` | step 2 as first submitted: 1.8 s push, 0.9 s release | 168 of 233 | 171 of 233 |
| `i1s3a` | revision: 0.1 s release, 1.8 s push | 162 of 235 | |
| `i1s3b` | revision: 0.1 s release, 2.2 s push | 171 of 235 | |
| `i1s3c` | revision: 0.1 s release, 2.5 s push | 171 of 235 | |
| **`i1s3final`** | **revision as committed** (2.2 s push, 0.1 s release, chronic-stenosis fix, lumen plug fill) | **171 of 235** | **174 of 235** |
| `i1s3flush` | as `i1s3final`, guide flushed with saline before the push | 143 of 234 | |

`i1s3final` and `i1s3b` give identical rows: the lumen changes after `i1s3b` do not alter a primed run.

### Per family (pass / rows scored, matched)

```
family          i1s2final  i1s3a    i1s3b    i1s3c    i1s3final  i1s3flush
Noise             15/17    15/17    15/17    15/17    15/17      15/17
Background         5/14     5/14     5/14     5/14     5/14       4/14
Borders            4/4      4/4      4/4      4/4      4/4        4/4
Contrast          11/24     9/24    10/24    11/24    10/24       4/24
Timing            54/64    48/66    56/66    56/66    56/66      39/65
Motion            18/31    20/31    20/31    19/31    20/31      16/31
Field              4/4      4/4      4/4      4/4      4/4        4/4
Geometry          36/46    36/46    36/46    36/46    36/46      36/46
Grey levels       15/18    15/18    15/18    15/18    15/18      15/18
Vessels            5/7      5/7      5/7      5/7      5/7        5/7
Catheter           1/4      1/4      1/4      1/4      1/4        1/4
TOTAL           168/233  162/235  171/235  171/235  171/235    143/234
```

Lossless, `i1s2final` against `i1s3final`: timing 55/64 against 60/66, total 171/233 against 174/235.

- **Removing the syringe tail.** With the 0.1 s release and the old 1.8 s push (`i1s3a`) the runs wash out early: end-of-run
  level median 0.03 of the peak and timing 48 of 66. That is what the first submission's 0.9 s release had been hiding.
- **Push duration.** 2.2 s and 2.5 s both give 56 of 66 timing rows (171 of 235 in total). 2.2 s was committed because it uses
  less contrast (8.5 against 9.7 mL left).
- **Catheter, 1 of 4, unchanged.** The flushed set shows that the lumen's contents do not explain these rows. With saline in
  the lumen the shaft still measures lumen contrast 0 (real 3.0-25.4), wall separation 3.75 px (real 4.0-6.0) and outer
  FWHM 6.5 px (real 7.0-9.75). With contrast in the lumen the values are 0, 1.5 and 6.25 px. The rendered 6 Fr catheter is
  narrower than the real ones in the library, and its two walls are not resolved after the image chain's blur. That is a
  catheter geometry and resolution item, not a lumen item.
- **The flushed guide (`i1s3flush`).** Its saline (2.5 mL, about 0.6 s at 4 mL/s) leaves the tip first, so first appearance
  moves to 1.07 s in AP cranial and LAO cranial (real bands 0.29-0.71 and 0.20-0.67 s) and timing drops to 39 of 65. Real
  runs therefore mostly start with contrast in the lumen, and the capture default stays primed.

## Timing against the measured targets (`i1s3final`)

"Real" is the median of the six views' real medians, matched / lossless. The simulator value is the median over the six
views, with the range in brackets.

| target | simulator (matched) | real | verdict |
|---|---|---|---|
| fill 10-90 % (rise) | 1.33 s (0.60-1.93) | 1.37 / 1.23 s | matched median on target; AP cranial 1.93 s fails (band 0.48-1.49) |
| first appearance (10 %) | 0.57 s (0.47-0.67) | 0.50 / 0.47 s | slightly late; all 6 rows pass |
| arrival (30 % of rise) | 0.67 s (0.53-0.93) | 0.62 / 0.65 s | all 6 rows pass |
| contrast in the first frame | 0 of 6 runs | 0 | pass |
| 50 % filling | 0.90 s (0.60-1.33) | 0.98 / 1.00 s | 5 of 6 pass |
| 90 % filling | 1.97 s (1.07-2.47) | 1.82 / 1.65 s | **slower than the real runs**; 4 of 6 pass |
| peak (time of the largest count; not a scored row) | 2.20 s (1.73-2.60) | 2.13 s | close (first submission 2.57 s) |
| 50 % washout after the peak | 0.63 s (0.33-1.20) | 0.80 / 0.67 s | all 6 rows pass (first submission 3 of 4 scored) |
| level at the end of the run / peak | **0.15** (-0.06-0.50) | 0.44 / 0.46 | **lower than the real runs**: 3 of 6 pass matched, 6 of 6 lossless |
| time above 50 % of the rise | 1.87 s (1.33-2.33) | 2.15 / 1.87 s | 5 of 6 pass |
| run length | 3.40 s | 3.53 / 3.40 s | all pass |

Stated plainly:

- The 90 % fill and the time to peak are still slower than in the real runs. The rise median matches on the matched
  pipeline but fails in AP cranial, where the guide catheter dominates the count.
- With the syringe tail removed, the end-of-run level falls well below the real median (0.15 against 0.44). The transport's
  own persistence (distal transit, the laminar wall layer, blush) is weaker than what real runs show at 3.4 s. The real
  value probably also reflects operators who keep pushing until close to the end of the run. Recovering it physically needs
  a sourced washout or wall-retention measurement, or a distribution of push durations, not a longer syringe tail.

TIMI frame count analogue (model, `xray.test.ts`): normal LAD, circumflex and RCA within 2 SD of Gibson 1996, as before.
Beyond a chronic stenosis (three library cases, LAD 0.38, 12 mm; origin to 85 % of the LAD): 80 % x1.12-1.16, 85 %
x1.24-1.40, 90 % x1.32-1.55, mean over 80-90 % x1.31 (Li 2021: 28.56 / 21.64 = x1.32). The distal vessel reaches 0.83-0.86
strength inside the run (0.87-0.89 without a lesion). Acute thrombotic 90 %: more than x1.5 the chronic count and under 0.6
of its distal peak (TIMI 1-2).

Remaining timing failures (10, matched): LCA AP cranial 90 % filling, rise and time above 50 % (count dominated by the guide
catheter); LCA RAO caudal 50 % and 90 % filling (early against a 3-run band) and end level; LCA LAO cranial frames at >= 90 %
(15 against 4-10) and end level (-0.06 against -0.05 to 0.94); RCA LAO frames at >= 90 % (10 against 4-9.7) and end level
(0.13 against 0.17-0.74).

## Timing tables (`i1s3final`, matched)

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| first appearance (10%) | LCA AP-CRA | 0.533 | 0.467 | 0.294 to 0.706 | 13 | pass |
| first appearance (10%) | LCA LAO-CRA | 0.467 | 0.533 | 0.200 to 0.667 | 9 | pass |
| first appearance (10%) | LCA RAO-CAU | 0.600 | 0.867 | 0.467 to 1.067 | 3 | pass |
| first appearance (10%) | LCA RAO-CRA | 0.600 | 0.533 | 0.333 to 0.793 | 22 | pass |
| first appearance (10%) | RCA LAO-0 | 0.467 | 0.334 | 0.067 to 0.760 | 14 | pass |
| first appearance (10%) | RCA RAO-0 | 0.667 | 0.333 | 0.067 to 0.707 (RCA/any) | 25 | pass |
| 50% filling | LCA AP-CRA | 0.733 | 0.867 | 0.560 to 1.000 | 13 | pass |
| 50% filling | LCA LAO-CRA | 0.600 | 0.933 | 0.600 to 1.533 | 9 | pass |
| 50% filling | LCA RAO-CAU | 1.000 | 1.533 | 1.067 to 1.533 | 3 | FAIL |
| 50% filling | LCA RAO-CRA | 1.333 | 0.967 | 0.733 to 1.454 | 22 | pass |
| 50% filling | RCA LAO-0 | 0.800 | 1.000 | 0.660 to 1.787 | 14 | pass |
| 50% filling | RCA RAO-0 | 1.067 | 1.067 | 0.600 to 2.027 (RCA/any) | 25 | pass |
| 90% filling | LCA AP-CRA | 2.467 | 1.533 | 0.933 to 1.960 | 13 | FAIL |
| 90% filling | LCA LAO-CRA | 1.067 | 1.667 | 0.867 to 2.267 | 9 | pass |
| 90% filling | LCA RAO-CAU | 1.933 | 2.333 | 2.067 to 3.467 | 3 | FAIL |
| 90% filling | LCA RAO-CRA | 2.267 | 1.667 | 1.340 to 2.533 | 22 | pass |
| 90% filling | RCA LAO-0 | 1.600 | 1.966 | 1.300 to 2.913 | 14 | pass |
| 90% filling | RCA RAO-0 | 2.000 | 2.000 | 1.200 to 2.907 (RCA/any) | 25 | pass |
| rise 10-90% | LCA AP-CRA | 1.933 | 1.000 | 0.480 to 1.493 | 13 | FAIL |
| rise 10-90% | LCA LAO-CRA | 0.600 | 1.000 | 0.333 to 1.667 | 9 | pass |
| rise 10-90% | LCA RAO-CAU | 1.333 | 1.600 | 1.267 to 2.600 | 3 | pass |
| rise 10-90% | LCA RAO-CRA | 1.667 | 1.133 | 0.807 to 1.980 | 22 | pass |
| rise 10-90% | RCA LAO-0 | 1.133 | 1.633 | 1.133 to 2.267 | 14 | pass |
| rise 10-90% | RCA RAO-0 | 1.333 | 1.733 | 1.027 to 2.307 (RCA/any) | 25 | pass |
| frames at >= 90% | LCA AP-CRA | 4.000 | 6.000 | 4.000 to 11.400 | 13 | pass |
| frames at >= 90% | LCA LAO-CRA | 15.000 | 7.000 | 4.000 to 10.000 | 9 | FAIL |
| frames at >= 90% | LCA RAO-CAU | 5.000 | 3.000 | 3.000 to 10.000 | 3 | pass |
| frames at >= 90% | LCA RAO-CRA | 4.000 | 6.500 | 3.000 to 12.000 | 22 | pass |
| frames at >= 90% | RCA LAO-0 | 10.000 | 6.500 | 4.000 to 9.700 | 14 | FAIL |
| frames at >= 90% | RCA RAO-0 | 3.000 | 4.000 | 2.000 to 9.600 (RCA/any) | 25 | pass |
| 50% washout after peak | LCA AP-CRA | 0.600 | 0.800 | 0.400 to 1.200 | 11 | pass |
| 50% washout after peak | LCA LAO-CRA | 1.200 | 0.734 | 0.400 to 1.333 | 4 | pass |
| 50% washout after peak | LCA RAO-CAU | 1.000 | 0.867 | 0.334 to 1.400 (LCA/any) | 56 | pass |
| 50% washout after peak | LCA RAO-CRA | 0.667 | 0.900 | 0.467 to 1.693 | 14 | pass |
| 50% washout after peak | RCA LAO-0 | 0.333 | 0.800 | 0.200 to 0.933 | 9 | pass |
| 50% washout after peak | RCA RAO-0 | 0.467 | 0.667 | 0.307 to 0.933 (RCA/any) | 17 | pass |
| end-of-run level / peak | LCA AP-CRA | 0.500 | 0.205 | 0.077 to 0.555 | 13 | pass |
| end-of-run level / peak | LCA LAO-CRA | -0.059 | 0.561 | -0.045 to 0.937 | 9 | FAIL |
| end-of-run level / peak | LCA RAO-CAU | 0.192 | 0.557 | 0.407 to 0.750 | 3 | FAIL |
| end-of-run level / peak | LCA RAO-CRA | 0.170 | 0.438 | 0.167 to 0.909 | 22 | pass |
| end-of-run level / peak | RCA LAO-0 | 0.129 | 0.435 | 0.166 to 0.741 | 14 | FAIL |
| end-of-run level / peak | RCA RAO-0 | 0.138 | 0.377 | -0.071 to 0.733 (RCA/any) | 25 | pass |
| run length | LCA AP-CRA | 3.400 | 3.533 | 3.333 to 3.920 | 13 | pass |
| run length | LCA LAO-CRA | 3.400 | 3.067 | 2.400 to 4.400 | 9 | pass |
| run length | LCA RAO-CAU | 3.400 | 3.600 | 3.333 to 3.733 | 3 | pass |
| run length | LCA RAO-CRA | 3.400 | 3.533 | 2.687 to 4.367 | 22 | pass |
| run length | RCA LAO-0 | 3.400 | 3.534 | 2.753 to 4.693 | 14 | pass |
| run length | RCA RAO-0 | 3.400 | 3.467 | 2.533 to 4.680 (RCA/any) | 25 | pass |
| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| contrast arrival (30% of rise) | LCA AP-CRA | 0.600 | 0.600 | 0.480 to 0.906 | 13 | pass |
| contrast arrival (30% of rise) | LCA LAO-CRA | 0.533 | 0.600 | 0.200 to 1.067 | 9 | pass |
| contrast arrival (30% of rise) | LCA RAO-CAU | 0.733 | 1.133 | 0.733 to 1.267 | 3 | pass |
| contrast arrival (30% of rise) | LCA RAO-CRA | 0.933 | 0.667 | 0.467 to 0.993 | 22 | pass |
| contrast arrival (30% of rise) | RCA LAO-0 | 0.600 | 0.633 | 0.487 to 1.180 | 14 | pass |
| contrast arrival (30% of rise) | RCA RAO-0 | 0.933 | 0.600 | 0.293 to 1.173 (RCA/any) | 25 | pass |
| time above 50% of rise | LCA AP-CRA | 1.333 | 2.000 | 1.600 to 2.814 | 13 | FAIL |
| time above 50% of rise | LCA LAO-CRA | 2.333 | 1.600 | 1.333 to 2.867 | 9 | pass |
| time above 50% of rise | LCA RAO-CAU | 2.000 | 2.200 | 1.733 to 2.267 | 3 | pass |
| time above 50% of rise | LCA RAO-CRA | 1.733 | 2.100 | 1.474 to 2.834 | 22 | pass |
| time above 50% of rise | RCA LAO-0 | 2.000 | 2.267 | 1.193 to 2.600 | 14 | pass |
| time above 50% of rise | RCA RAO-0 | 1.600 | 2.200 | 1.133 to 2.600 (RCA/any) | 25 | pass |
| contrast present in the first frame (0/1) | LCA AP-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 13 | pass |
| contrast present in the first frame (0/1) | LCA LAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 9 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CAU | 0.000 | 0.000 | 0.000 to 0.000 | 3 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 22 | pass |
| contrast present in the first frame (0/1) | RCA LAO-0 | 0.000 | 0.000 | 0.000 to 0.000 | 14 | pass |
| contrast present in the first frame (0/1) | RCA RAO-0 | 0.000 | 0.000 | 0.000 to 0.000 (RCA/any) | 25 | pass |

---

# First submission (kept for the record, denominators corrected)

`i1s2final`: 1.8 s push with a 0.9 s plunger release; `i1s2def`: the S0 default 63-frame run (167 of 235). Matched 168 of
233, lossless 171 of 233 (report.py's denominators). The first submission's family table showed "TOTAL 168/235" and "Timing
54/66" because it counted the two runs without a 50 % washout value as failures. On report.py's rule the figures are Timing
54 of 64 and total 168 of 233, as in the summary above.

The first submission's headline called the rise "matched" at 1.53 s against 1.33 / 1.27 s. That was 15-20 % slower, and the
time to peak (2.57 s against 2.13 s) and the AP cranial rise (1.93 s against 0.48-1.49) also failed. Its end-of-run level
(0.44) and washout passed only because the syringe kept delivering 1.1 mL/s at 3.0 s and 0.45 mL/s at the end of the run.

## Calibration sweeps (quick timing extraction, matched pipeline)

| set | change | key effect |
|---|---|---|
| `i1s2a` | first transport: laminar 0.4, dispersion 0.05 + 0.22 theta, gain 1, release 0.25 s, blush 5 | first appearance in band in 5 of 6 views; washout too fast (end level ~0); reflux cloud hides the guide (sinus mixing 25 mL/s) |
| `i1s2b`, `i1s2c` | target flows 3.0/2.0 mL/s, sinus 60 mL/s; blush 10 | blush 10 mg/mL brings opacified area > 10 levels to 0.17-0.27 |
| `i1s2e` | transit gain 1.2 (TIMI frame count) | fronts faster; little change in the image counts |
| `i1s2f`, `i1s2g`, `i1s2h`, `i1s2i` | laminar 0.15-0.25, kappa 0.12-0.15, release 0.4-0.6 s, gain 1.2-1.5, target flows back to 4.0/2.5 | gain 1.5 too fast for the TIMI counts; h kept |
| `i1s2j` | committed h values, 51-frame run | 165 of 235; end level still 0.0-0.06 |
| `i1s2l`, `i1s2k` | release 0.65 s, 0.9 s | end level 0.08-0.50 and 0.15-0.45; 0.9 s committed |
