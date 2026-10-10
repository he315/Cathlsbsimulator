# I1 scorecard, step 1: wave-1 imaging integrated into the scene and both labs

Capture set `i1final`, taken on 2026-10-05 at 03:37 from the development server in a tab of its own with
`window.__xrayCapture.standard("i1final")` (deterministic offscreen path, capture mode, S0 standard set:
six reference views, 63-frame cine at 15 frames/s with the bolus from the first cine frame, 20 cm field,
768 px, four fluoroscopy warm-up frames, plus the 40-frame fluoroscopy companion). Scored with
`python3 scripts/realism/report.py i1final` (matched pipeline) and `--pipeline lossless`.

## Summary

| Set | What it is | Matched | Lossless |
|---|---|---|---|
| `s0base` | S0 baseline, 01:28 (wave-1 tree at that time) | 133 of 229 | 137 of 229 |
| `i1pre` | current tree at 03:06, before any I1 change | 128 of 229 | not run |
| `i1final` | integrated (this step) | **154 of 228** | **157 of 228** |

One row fewer is scored because the `noise SD at grey 220-239` bin has no samples in the final set
(the RCA LAO view no longer has pixels that bright; see below).

### Per family (pass / rows with a target, matched)

The counts below are computed from each set's `scorecard_matched.json` and count a row without a value
as not passing (denominator 234-235); the totals that report.py prints are in the table above. Intermediate sets:
`i1a` first integration; `i1b` with the counts calibration (default); `i1c` controller gains
"physical"; `i1d` no hardware; `i1e` ribbon thorax; `i1s` analytic segments on.

```
section            s0base       i1pre         i1a         i1b         i1c         i1d         i1e         i1s     i1final
Noise               16/17       15/17       11/16       15/16       15/16       15/16       15/16       15/16       15/16
Background           3/14        2/14        4/14        3/14        3/14        3/14        3/14        3/14        3/14
Borders               4/4         3/4         4/4         4/4         2/4         4/4         3/4         4/4         4/4
Contrast             6/24        6/24       11/24       10/24        8/24       10/24       11/24        9/24        9/24
Timing              31/66       33/66       35/66       36/66       35/66       35/66       35/66       32/66       38/66
Motion              15/31       13/31       18/31       16/31       18/31       16/31       15/31       17/31       18/31
Field                 4/4         4/4         4/4         4/4         4/4         4/4         4/4         4/4         4/4
Geometry            29/46       29/46       38/46       38/46       38/46       38/46       38/46       38/46       38/46
Grey levels         16/18       16/18       16/18       16/18       16/18       16/18       16/18       16/18       16/18
Vessels               5/7         5/7         5/7         5/7         5/7         5/7         5/7         5/7         5/7
Catheter              4/4         2/4         3/4         3/4         1/4         3/4         4/4         3/4         4/4
TOTAL             133/235     128/235     149/234     150/234     145/234     149/234     149/234     146/234     154/234
```

Every family that passed in the baseline passes at least as many rows now, except **Noise (15 against
16)**. Both noise rows that differ were already lost on the pre-integration capture of the same tree
(`i1pre`: grey 200-219 at 2.77 against a band from 3.00, grey 220-239 at 2.76 against 2.81), before any
I1 change, so they are not integration bugs. They follow the S2 profile refit made after the baseline
was captured (`systemProfiles.ts` modified at 01:45, baseline at 01:28; the dark/bright noise ratio moved
from 1.06 in `s0base` to 1.18 in `i1pre`, the darker floor weighting lowering the bright-grey noise).
The first integrated set (`i1a`) did regress noise (temporal SD 3.64 against the 3.63 band edge, four
grey bins failing): the controller's counts were 12 % low at the 20 cm field. That was an integration
bug and is fixed (`COUNTS_CALIBRATION_FIELD_MM`, facts/I1.md): temporal SD 3.38, 15 of 16 noise rows.

### What moved (baseline -> final)

- Heart motion from the clock: landmark speed median LCA 2.7-3.9 -> 16.2-21.5 mm/s (band 10.0-26.3),
  RCA 4.2 / 13.3 -> 24.3 / 47.2 mm/s (band 17.0-87.2); all six rows now pass. LAD displacement stays in
  band (7.1-10.1 mm), RCA LAO now in band (9.5 mm).
- Catheter coupled to the aortic root: shaft cross-section range 3.3 -> 15.2 px (band 10.3-30.8), median
  step 0.43 -> 2.24, p90 1.67 -> 4.08, max 2.2 -> 5.2 px: all four catheter-motion rows pass.
- Coronary render path and heart shape: tortuosity 3-8 mm passes in two more views, opacified area and
  peak darkening pass in two more views.
- Thorax genome, lung-anchored clutter and heart silhouette: background band power 56,400 -> 106,900
  (band 49,100-410,500); mid-tile band-pass RMS 4.38 -> 5.09 (band from 5.11, still short).
- New failures: block-matching motion is now too large in RCA RAO (median 10.4 px against 0.9-6.0) and
  LCA RAO caudal (5.1 against 1.5-3.6), and the RCA LAO maximum (16.3 against 13.1). The S3 motion field
  moves the RCA and the lateral wall more than the library in RAO views; the cross-section track of the
  same vessels is still short of its band (RCA 26.6 against 27.9-44.9 px), so the amplitude is not simply
  too large: the motion direction differs (S3, see I1.md).

## Full scorecard (matched pipeline)

Generated 2026-10-05T03:39 by `scripts/realism/report.py` in 121 s. Pipeline: **matched** (crop to the collimated field, bilinear resample to 512 x 512, 8-bit, sips JPEG q72). Targets: `datasets/library/realism_targets.json`, profile `cd-ds` unless stated; pass = simulator median inside the target band (p10-p90 of real runs, or the observed range when fewer than 10).

**154 of 228 metrics inside the real band.** 4 further rows compare with fewer than 3 real measurements and are shown as indicative only.

Per-artery rows are split by view family (scripts/realism/views.py, 15-degree rule). A row uses the target of its own artery and view family when that target has at least 3 real runs, otherwise the artery-level target; the band column names the source when it is not the row's own artery/view or the default profile. Geometry rows (tortuosity, length, extent, motion in mm) use the anatomy audit's real traces and tracks (scripts/realism/geometry.py); length and extent are compared only within their own view family. The fluoroscopy/cine row is a rule (ratio above 1), not a library band.

| run | artery | view family | C-arm (LAO+/CRA+) | frames | field box (native px) | ms/frame scene + render |
|---|---|---|---|---|---|---|
| lad_apcra | LCA | AP-CRA | 0 / 30 | 63 | [0, 0, 768, 768] | 3.6 + 17.3 |
| lad_laocra | LCA | LAO-CRA | 32 / 26 | 63 | [0, 0, 768, 768] | 3.5 + 19.0 |
| lad_raocau | LCA | RAO-CAU | -22 / -22 | 63 | [0, 0, 768, 768] | 4.5 + 19.8 |
| lad_raocau_fluoro | LCA | RAO-CAU | -22 / -22 | 40 | [0, 0, 768, 768] | 1.7 + 16.9 |
| lad_raocra | LCA | RAO-CRA | -20 / 24 | 63 | [0, 0, 768, 768] | 3.7 + 19.4 |
| rca_lao | RCA | LAO-0 | 40 / 0 | 63 | [0, 0, 768, 768] | 4.2 + 21.1 |
| rca_rao | RCA | RAO-0 | -30 / 0 | 63 | [0, 0, 768, 768] | 4.2 + 20.5 |


## Noise

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| temporal noise SD |  | 3.376 | 3.331 | 3.031 to 3.628 | 13 | pass |
| noise dark/bright ratio (96-127 / 160-191) |  | 1.192 | 1.117 | 0.901 to 1.295 | 13 | pass |
| noise autocorrelation lag 1 |  | 0.364 | 0.357 | 0.272 to 0.472 | 13 | pass |
| noise autocorrelation lag 2 |  | -0.021 | -0.051 | -0.099 to 0.011 | 13 | pass |
| NPS fraction below 0.1 cycles/px |  | 0.254 | 0.266 | 0.189 to 0.339 | 13 | pass |
| NPS high/low ratio |  | 0.288 | 0.294 | 0.126 to 0.561 | 13 | pass |
| frame-to-frame noise correlation |  | 0.031 | 0.092 | -0.015 to 0.144 | 13 | pass |
| run-start noise settling (pair 0-1 / 9-10) |  | 1.651 | 1.548 | 1.335 to 1.680 | 20 | pass |

## Background

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| lung band-pass 4-32 px RMS (bright tiles) |  | 4.362 | 8.890 | 7.003 to 10.831 | 54 | FAIL |
| band-pass RMS (mid tiles) |  | 5.090 | 7.340 | 5.114 to 9.938 | 54 | FAIL |
| band-pass RMS (dark tiles) |  | 4.279 | 6.456 | 4.429 to 8.870 | 54 | FAIL |
| power at 0.125 cycles/px (bright) |  | 80.435 | 275.940 | 143.405 to 373.071 | 54 | FAIL |
| spectrum slope 0.1-0.3 cycles/px (bright) |  | -0.670 | -2.409 | -3.241 to -1.821 | 54 | FAIL |
| background spectrum beta 0.008-0.08 |  | 2.708 | 2.554 | 2.181 to 3.025 | 54 | pass |
| background band power 0.008-0.08 |  | 106,851 | 110,312 | 49,099 to 410,539 | 54 | pass |
| thin dark-line pixels (pre-contrast) |  | 11,199 | 13,168 | 10,070 to 16,415 | 54 | pass |
| local contrast p99, pre-contrast | LCA AP-CRA | n/a | 23.980 | 22.172 to 27.700 | 13 | no value |
| local contrast p99, pre-contrast | LCA LAO-CRA | n/a | 29.880 | 22.900 to 38.400 | 9 | no value |
| local contrast p99, pre-contrast | LCA RAO-CAU | n/a | 23.020 | 21.550 to 28.140 | 3 | no value |
| local contrast p99, pre-contrast | LCA RAO-CRA | n/a | 27.095 | 21.494 to 32.746 | 22 | no value |
| local contrast p99, pre-contrast | RCA LAO-0 | n/a | 34.100 | 28.497 to 39.262 | 14 | no value |
| local contrast p99, pre-contrast | RCA RAO-0 | n/a | 30.460 | 25.942 to 41.536 (RCA/any) | 25 | no value |

## Borders

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| large-border bright overshoot |  | 1.095 | 5.745 | 0.282 to 13.629 | 54 | pass |
| overshoot / step |  | 0.040 | 0.114 | 0.005 to 0.324 | 54 | pass |
| overshoot peak distance |  | 22.875 | 13.750 | 6.950 to 23.950 | 54 | pass |
| dark-side undershoot |  | 6.310 | 0.685 | -2.784 to 15.745 | 54 | pass |

## Contrast

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| local contrast p99, peak frame | LCA AP-CRA | 38.490 | 36.300 | 29.934 to 47.816 | 13 | pass |
| local contrast p99, peak frame | LCA LAO-CRA | 41.640 | 41.470 | 27.250 to 55.020 | 9 | pass |
| local contrast p99, peak frame | LCA RAO-CAU | 32.070 | 35.640 | 33.940 to 50.800 | 3 | FAIL |
| local contrast p99, peak frame | LCA RAO-CRA | 30.300 | 44.345 | 33.710 to 55.523 | 22 | FAIL |
| local contrast p99, peak frame | RCA LAO-0 | 44.330 | 42.690 | 35.520 to 45.352 | 14 | pass |
| local contrast p99, peak frame | RCA RAO-0 | 32.430 | 39.980 | 32.664 to 46.684 (RCA/any) | 25 | FAIL |
| opacified area > 10 levels | LCA AP-CRA | 0.132 | 0.174 | 0.081 to 0.426 | 13 | pass |
| opacified area > 10 levels | LCA LAO-CRA | 0.081 | 0.210 | 0.154 to 0.558 | 9 | FAIL |
| opacified area > 10 levels | LCA RAO-CAU | 0.219 | 0.270 | 0.248 to 0.344 | 3 | FAIL |
| opacified area > 10 levels | LCA RAO-CRA | 0.224 | 0.278 | 0.132 to 0.589 | 22 | pass |
| opacified area > 10 levels | RCA LAO-0 | 0.130 | 0.310 | 0.181 to 0.460 | 14 | FAIL |
| opacified area > 10 levels | RCA RAO-0 | 0.111 | 0.295 | 0.139 to 0.460 (RCA/any) | 25 | FAIL |
| opacified area > 20 levels | LCA AP-CRA | 0.019 | 0.094 | 0.035 to 0.295 | 13 | FAIL |
| opacified area > 20 levels | LCA LAO-CRA | 0.026 | 0.097 | 0.049 to 0.458 | 9 | FAIL |
| opacified area > 20 levels | LCA RAO-CAU | 0.043 | 0.139 | 0.090 to 0.164 | 3 | FAIL |
| opacified area > 20 levels | LCA RAO-CRA | 0.037 | 0.182 | 0.046 to 0.496 | 22 | FAIL |
| opacified area > 20 levels | RCA LAO-0 | 0.024 | 0.159 | 0.085 to 0.280 | 14 | FAIL |
| opacified area > 20 levels | RCA RAO-0 | 0.026 | 0.144 | 0.077 to 0.252 (RCA/any) | 25 | FAIL |
| peak mean darkening | LCA AP-CRA | 4.656 | 5.910 | 3.547 to 15.667 | 13 | pass |
| peak mean darkening | LCA LAO-CRA | 3.530 | 6.996 | 5.713 to 24.591 | 9 | FAIL |
| peak mean darkening | LCA RAO-CAU | 7.383 | 8.189 | 7.035 to 8.895 | 3 | pass |
| peak mean darkening | LCA RAO-CRA | 7.529 | 9.697 | 5.104 to 25.722 | 22 | pass |
| peak mean darkening | RCA LAO-0 | 5.101 | 9.461 | 6.127 to 13.554 | 14 | FAIL |
| peak mean darkening | RCA RAO-0 | 5.970 | 8.445 | 5.133 to 12.584 (RCA/any) | 25 | pass |

## Timing

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| first appearance (10%) | LCA AP-CRA | 0.200 | 0.467 | 0.294 to 0.706 | 13 | FAIL |
| first appearance (10%) | LCA LAO-CRA | 0.133 | 0.533 | 0.200 to 0.667 | 9 | FAIL |
| first appearance (10%) | LCA RAO-CAU | 0.267 | 0.867 | 0.467 to 1.067 | 3 | FAIL |
| first appearance (10%) | LCA RAO-CRA | 0.333 | 0.533 | 0.333 to 0.793 | 22 | pass |
| first appearance (10%) | RCA LAO-0 | 0.200 | 0.334 | 0.067 to 0.760 | 14 | pass |
| first appearance (10%) | RCA RAO-0 | 0.267 | 0.333 | 0.067 to 0.707 (RCA/any) | 25 | pass |
| 50% filling | LCA AP-CRA | 0.533 | 0.867 | 0.560 to 1.000 | 13 | FAIL |
| 50% filling | LCA LAO-CRA | 0.267 | 0.933 | 0.600 to 1.533 | 9 | FAIL |
| 50% filling | LCA RAO-CAU | 0.400 | 1.533 | 1.067 to 1.533 | 3 | FAIL |
| 50% filling | LCA RAO-CRA | 0.533 | 0.967 | 0.733 to 1.454 | 22 | FAIL |
| 50% filling | RCA LAO-0 | 0.400 | 1.000 | 0.660 to 1.787 | 14 | FAIL |
| 50% filling | RCA RAO-0 | 1.067 | 1.067 | 0.600 to 2.027 (RCA/any) | 25 | pass |
| 90% filling | LCA AP-CRA | 1.600 | 1.533 | 0.933 to 1.960 | 13 | pass |
| 90% filling | LCA LAO-CRA | 0.467 | 1.667 | 0.867 to 2.267 | 9 | FAIL |
| 90% filling | LCA RAO-CAU | 1.200 | 2.333 | 2.067 to 3.467 | 3 | FAIL |
| 90% filling | LCA RAO-CRA | 1.200 | 1.667 | 1.340 to 2.533 | 22 | FAIL |
| 90% filling | RCA LAO-0 | 1.400 | 1.966 | 1.300 to 2.913 | 14 | pass |
| 90% filling | RCA RAO-0 | 1.200 | 2.000 | 1.200 to 2.907 (RCA/any) | 25 | pass |
| rise 10-90% | LCA AP-CRA | 1.400 | 1.000 | 0.480 to 1.493 | 13 | pass |
| rise 10-90% | LCA LAO-CRA | 0.333 | 1.000 | 0.333 to 1.667 | 9 | pass |
| rise 10-90% | LCA RAO-CAU | 0.933 | 1.600 | 1.267 to 2.600 | 3 | FAIL |
| rise 10-90% | LCA RAO-CRA | 0.867 | 1.133 | 0.807 to 1.980 | 22 | pass |
| rise 10-90% | RCA LAO-0 | 1.200 | 1.633 | 1.133 to 2.267 | 14 | pass |
| rise 10-90% | RCA RAO-0 | 0.933 | 1.733 | 1.027 to 2.307 (RCA/any) | 25 | FAIL |
| frames at >= 90% | LCA AP-CRA | 3.000 | 6.000 | 4.000 to 11.400 | 13 | FAIL |
| frames at >= 90% | LCA LAO-CRA | 12.000 | 7.000 | 4.000 to 10.000 | 9 | FAIL |
| frames at >= 90% | LCA RAO-CAU | 8.000 | 3.000 | 3.000 to 10.000 | 3 | pass |
| frames at >= 90% | LCA RAO-CRA | 9.000 | 6.500 | 3.000 to 12.000 | 22 | pass |
| frames at >= 90% | RCA LAO-0 | 6.000 | 6.500 | 4.000 to 9.700 | 14 | pass |
| frames at >= 90% | RCA RAO-0 | 3.000 | 4.000 | 2.000 to 9.600 (RCA/any) | 25 | pass |
| 50% washout after peak | LCA AP-CRA | 0.067 | 0.800 | 0.400 to 1.200 | 11 | FAIL |
| 50% washout after peak | LCA LAO-CRA | 1.000 | 0.734 | 0.400 to 1.333 | 4 | pass |
| 50% washout after peak | LCA RAO-CAU | 1.400 | 0.867 | 0.334 to 1.400 (LCA/any) | 56 | pass |
| 50% washout after peak | LCA RAO-CRA | 1.333 | 0.900 | 0.467 to 1.693 | 14 | pass |
| 50% washout after peak | RCA LAO-0 | 0.733 | 0.800 | 0.200 to 0.933 | 9 | pass |
| 50% washout after peak | RCA RAO-0 | 0.400 | 0.667 | 0.307 to 0.933 (RCA/any) | 17 | pass |
| end-of-run level / peak | LCA AP-CRA | -0.254 | 0.205 | 0.077 to 0.555 | 13 | FAIL |
| end-of-run level / peak | LCA LAO-CRA | -0.560 | 0.561 | -0.045 to 0.937 | 9 | FAIL |
| end-of-run level / peak | LCA RAO-CAU | -0.024 | 0.557 | 0.407 to 0.750 | 3 | FAIL |
| end-of-run level / peak | LCA RAO-CRA | -0.004 | 0.438 | 0.167 to 0.909 | 22 | FAIL |
| end-of-run level / peak | RCA LAO-0 | -0.215 | 0.435 | 0.166 to 0.741 | 14 | FAIL |
| end-of-run level / peak | RCA RAO-0 | -0.017 | 0.377 | -0.071 to 0.733 (RCA/any) | 25 | pass |
| run length | LCA AP-CRA | 4.200 | 3.533 | 3.333 to 3.920 | 13 | FAIL |
| run length | LCA LAO-CRA | 4.200 | 3.067 | 2.400 to 4.400 | 9 | pass |
| run length | LCA RAO-CAU | 4.200 | 3.600 | 3.333 to 3.733 | 3 | FAIL |
| run length | LCA RAO-CRA | 4.200 | 3.533 | 2.687 to 4.367 | 22 | pass |
| run length | RCA LAO-0 | 4.200 | 3.534 | 2.753 to 4.693 | 14 | pass |
| run length | RCA RAO-0 | 4.200 | 3.467 | 2.533 to 4.680 (RCA/any) | 25 | pass |

## Motion

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| heart rate from frame differences |  | 71.515 | 64.605 | 56.394 to 90.981 | 52 | pass |
| block-matching motion, median | LCA AP-CRA | 6.523 | 5.153 | 1.778 to 7.000 | 13 | pass |
| block-matching motion, median | LCA LAO-CRA | 7.070 | 3.970 | 2.059 to 8.431 | 9 | pass |
| block-matching motion, median | LCA RAO-CAU | 5.096 | 3.593 | 1.457 to 3.624 | 3 | FAIL |
| block-matching motion, median | LCA RAO-CRA | 6.708 | 4.818 | 1.778 to 8.368 | 22 | pass |
| block-matching motion, median | RCA LAO-0 | 6.087 | 2.280 | 1.326 to 3.538 | 14 | FAIL |
| block-matching motion, median | RCA RAO-0 | 10.391 | 2.766 | 0.892 to 5.988 (RCA/any) | 25 | FAIL |
| block-matching motion, p90 | LCA AP-CRA | 13.426 | 10.363 | 4.632 to 13.483 | 13 | pass |
| block-matching motion, p90 | LCA LAO-CRA | 13.314 | 8.615 | 3.744 to 11.522 | 9 | FAIL |
| block-matching motion, p90 | LCA RAO-CAU | 12.784 | 6.869 | 2.408 to 8.646 | 3 | FAIL |
| block-matching motion, p90 | LCA RAO-CRA | 13.719 | 10.668 | 4.689 to 14.998 | 22 | pass |
| block-matching motion, p90 | RCA LAO-0 | 11.741 | 4.982 | 2.248 to 6.795 | 14 | FAIL |
| block-matching motion, p90 | RCA RAO-0 | 14.140 | 5.314 | 2.180 to 11.061 (RCA/any) | 25 | FAIL |
| block-matching motion, max | LCA AP-CRA | 15.248 | 13.130 | 5.469 to 15.071 | 13 | FAIL |
| block-matching motion, max | LCA LAO-CRA | 14.159 | 13.019 | 4.062 to 14.439 | 9 | pass |
| block-matching motion, max | LCA RAO-CAU | 14.012 | 9.947 | 4.000 to 12.502 | 3 | FAIL |
| block-matching motion, max | LCA RAO-CRA | 15.652 | 12.937 | 6.079 to 15.969 | 22 | pass |
| block-matching motion, max | RCA LAO-0 | 16.291 | 6.980 | 3.437 to 13.065 | 14 | FAIL |
| block-matching motion, max | RCA RAO-0 | 14.280 | 9.015 | 3.154 to 13.244 (RCA/any) | 25 | FAIL |

## Field

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| outer 0-2 px vs 16-32 px band |  | -8.060 | -5.955 | -15.817 to 0.590 | 80 | pass |
| 2-4 px vs 16-32 px band |  | -4.150 | -4.280 | -10.056 to 1.793 | 80 | pass |
| 8-16 px vs 16-32 px band |  | -0.585 | -0.265 | -3.640 to 5.514 | 80 | pass |
| corners vs 16-32 px band |  | -4.375 | -10.465 | -26.283 to 3.184 | 80 | pass |

## Timing

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| contrast arrival (30% of rise) | LCA AP-CRA | 0.400 | 0.600 | 0.480 to 0.906 | 13 | FAIL |
| contrast arrival (30% of rise) | LCA LAO-CRA | 0.200 | 0.600 | 0.200 to 1.067 | 9 | pass |
| contrast arrival (30% of rise) | LCA RAO-CAU | 0.400 | 1.133 | 0.733 to 1.267 | 3 | FAIL |
| contrast arrival (30% of rise) | LCA RAO-CRA | 0.400 | 0.667 | 0.467 to 0.993 | 22 | FAIL |
| contrast arrival (30% of rise) | RCA LAO-0 | 0.267 | 0.633 | 0.487 to 1.180 | 14 | FAIL |
| contrast arrival (30% of rise) | RCA RAO-0 | 0.333 | 0.600 | 0.293 to 1.173 (RCA/any) | 25 | pass |
| time above 50% of rise | LCA AP-CRA | 1.333 | 2.000 | 1.600 to 2.814 | 13 | FAIL |
| time above 50% of rise | LCA LAO-CRA | 1.600 | 1.600 | 1.333 to 2.867 | 9 | pass |
| time above 50% of rise | LCA RAO-CAU | 2.200 | 2.200 | 1.733 to 2.267 | 3 | pass |
| time above 50% of rise | LCA RAO-CRA | 2.267 | 2.100 | 1.474 to 2.834 | 22 | pass |
| time above 50% of rise | RCA LAO-0 | 2.067 | 2.267 | 1.193 to 2.600 | 14 | pass |
| time above 50% of rise | RCA RAO-0 | 1.133 | 2.200 | 1.133 to 2.600 (RCA/any) | 25 | pass |
| contrast present in the first frame (0/1) | LCA AP-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 13 | pass |
| contrast present in the first frame (0/1) | LCA LAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 9 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CAU | 0.000 | 0.000 | 0.000 to 0.000 | 3 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 22 | pass |
| contrast present in the first frame (0/1) | RCA LAO-0 | 0.000 | 0.000 | 0.000 to 0.000 | 14 | pass |
| contrast present in the first frame (0/1) | RCA RAO-0 | 0.000 | 0.000 | 0.000 to 0.000 (RCA/any) | 25 | pass |

## Noise

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| noise SD at grey 80-99 (cd-ds) |  | 3.673 | 3.851 | 3.517 to 4.240 | 12 | pass |
| noise SD at grey 100-119 (cd-ds) |  | 3.558 | 3.617 | 3.161 to 3.810 | 13 | pass |
| noise SD at grey 120-139 (cd-ds) |  | 3.486 | 3.363 | 2.772 to 3.676 | 13 | pass |
| noise SD at grey 140-159 (cd-ds) |  | 3.416 | 3.358 | 2.836 to 3.640 | 13 | pass |
| noise SD at grey 160-179 (cd-ds) |  | 3.127 | 3.207 | 2.802 to 3.674 | 13 | pass |
| noise SD at grey 180-199 (cd-ds) |  | 2.848 | 3.285 | 2.611 to 4.561 | 13 | pass |
| noise SD at grey 200-219 (cd-ds) |  | 2.740 | 3.294 | 3.001 to 4.941 | 13 | FAIL |
| fluoro / cine noise SD at equal grey (lad_raocau_fluoro vs lad_raocau) | LCA RAO-CAU | 1.435 | n/a | ratio > 1 (plan measurementTargets: fluoro must be noisier than cine at equal grey) | 0 | pass |

## Geometry

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| tortuosity band RMS 3-8 mm | LCA AP-CRA | 10.287 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 3-8 mm | LCA LAO-CRA | 10.550 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 3-8 mm | LCA RAO-CAU | 11.912 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 3-8 mm | LCA RAO-CRA | 9.797 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main) | 5 | pass |
| tortuosity band RMS 3-8 mm | RCA LAO-0 | 10.342 | 14.399 | 8.979 to 16.686 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 3-8 mm | RCA RAO-0 | 8.191 | 14.399 | 8.979 to 16.686 (cd-ds+cd-main, RCA/any) | 4 | FAIL |
| tortuosity band RMS 8-20 mm | LCA AP-CRA | 12.358 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA LAO-CRA | 10.769 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA RAO-CAU | 15.337 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA RAO-CRA | 14.120 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main) | 5 | pass |
| tortuosity band RMS 8-20 mm | RCA LAO-0 | 8.746 | 10.995 | 6.485 to 12.387 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 8-20 mm | RCA RAO-0 | 6.344 | 10.995 | 6.485 to 12.387 (cd-ds+cd-main, RCA/any) | 4 | FAIL |
| tortuosity band RMS 20-60 mm | LCA AP-CRA | 14.168 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA LAO-CRA | 14.154 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA RAO-CAU | 16.603 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA RAO-CRA | 14.740 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main) | 5 | pass |
| tortuosity band RMS 20-60 mm | RCA LAO-0 | 13.858 | 11.621 | 10.027 to 16.742 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 20-60 mm | RCA RAO-0 | 8.990 | 11.621 | 10.027 to 16.742 (cd-ds+cd-main, RCA/any) | 4 | FAIL |
| projected LM+LAD length | LCA AP-CRA | 126.400 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA LAO-CRA | 125.300 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA RAO-CAU | 120.200 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA RAO-CRA | 126.600 | 134.900 | 96.400 to 135.700 (cd-ds+cd-main) | 5 | pass |
| LM+LAD arc / chord | LCA AP-CRA | 1.122 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA LAO-CRA | 1.135 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA RAO-CAU | 1.163 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA RAO-CRA | 1.139 | 1.226 | 1.211 to 1.460 (cd-ds+cd-main) | 5 | FAIL |
| tree extent, width | LCA AP-CRA | 52.500 | 93.846 | 75.692 to 119.692 (cd-ds+cd-main) | 11 | FAIL |
| tree extent, width | LCA LAO-CRA | 56.200 | 102.154 | 64.000 to 123.077 (cd-ds+cd-main) | 8 | FAIL |
| tree extent, width | LCA RAO-CAU | 65.500 | 101.077 | 86.831 to 114.154 (cd-ds+cd-main) | 12 | FAIL |
| tree extent, width | LCA RAO-CRA | 66.400 | 102.769 | 91.385 to 130.769 (cd-ds+cd-main) | 9 | FAIL |
| tree extent, width | RCA LAO-0 | 65.700 | 44.000 | 44.000 to 44.000 (cd-ds+cd-main) | 1 | outside (indicative, n < 3) |
| tree extent, width | RCA RAO-0 | 56.300 | n/a | n/a |  | no target |
| tree extent, height | LCA AP-CRA | 87.300 | 92.923 | 57.846 to 115.692 (cd-ds+cd-main) | 11 | pass |
| tree extent, height | LCA LAO-CRA | 94.500 | 74.154 | 53.231 to 124.615 (cd-ds+cd-main) | 8 | pass |
| tree extent, height | LCA RAO-CAU | 79.500 | 95.077 | 65.477 to 119.077 (cd-ds+cd-main) | 12 | pass |
| tree extent, height | LCA RAO-CRA | 78.900 | 94.462 | 40.000 to 128.000 (cd-ds+cd-main) | 9 | pass |
| tree extent, height | RCA LAO-0 | 111.500 | 50.462 | 50.462 to 50.462 (cd-ds+cd-main) | 1 | outside (indicative, n < 3) |
| tree extent, height | RCA RAO-0 | 115.500 | n/a | n/a |  | no target |
| landmark displacement P10-P90 (mm) | LCA AP-CRA | 10.080 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA LAO-CRA | 9.810 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA RAO-CAU | 7.130 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA RAO-CRA | 9.970 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main) | 25 | pass |
| landmark displacement P10-P90 (mm) | RCA LAO-0 | 9.520 | 17.815 | 9.421 to 29.348 (cd-ds+cd-main) | 19 | pass |
| landmark displacement P10-P90 (mm) | RCA RAO-0 | 21.210 | 17.815 | 9.421 to 29.348 (cd-ds+cd-main, RCA/any) | 19 | pass |
| landmark speed, median (mm/s) | LCA AP-CRA | 21.510 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA LAO-CRA | 20.970 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA RAO-CAU | 16.150 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA RAO-CRA | 21.140 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main) | 25 | pass |
| landmark speed, median (mm/s) | RCA LAO-0 | 24.310 | 49.442 | 16.989 to 87.157 (cd-ds+cd-main) | 20 | pass |
| landmark speed, median (mm/s) | RCA RAO-0 | 47.240 | 49.442 | 16.989 to 87.157 (cd-ds+cd-main, RCA/any) | 20 | pass |
| landmark speed, 90th centile (mm/s) | LCA AP-CRA | 47.780 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA LAO-CRA | 47.090 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA RAO-CAU | 33.980 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA RAO-CRA | 47.340 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main) | 25 | pass |
| landmark speed, 90th centile (mm/s) | RCA LAO-0 | 48.280 | 103.592 | 47.100 to 134.151 (cd-ds+cd-main) | 20 | pass |
| landmark speed, 90th centile (mm/s) | RCA RAO-0 | 102.540 | 103.592 | 47.100 to 134.151 (cd-ds+cd-main, RCA/any) | 20 | pass |

## Grey levels

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| grey p5 (lad_apcra) | LCA AP-CRA | 94.000 | 96.000 | 87.800 to 106.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_apcra) | LCA AP-CRA | 134.000 | 129.000 | 122.800 to 137.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_apcra) | LCA AP-CRA | 203.000 | 201.000 | 181.800 to 220.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_laocra) | LCA LAO-CRA | 95.000 | 98.000 | 81.800 to 102.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_laocra) | LCA LAO-CRA | 135.000 | 136.000 | 126.000 to 149.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_laocra) | LCA LAO-CRA | 203.000 | 197.000 | 182.400 to 223.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_raocau) | LCA RAO-CAU | 95.000 | 93.000 | 82.400 to 101.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_raocau) | LCA RAO-CAU | 143.000 | 133.000 | 129.400 to 145.000 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_raocau) | LCA RAO-CAU | 204.000 | 196.000 | 177.800 to 214.800 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_raocra) | LCA RAO-CRA | 94.000 | 94.000 | 77.800 to 104.800 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_raocra) | LCA RAO-CRA | 140.000 | 139.000 | 124.600 to 163.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_raocra) | LCA RAO-CRA | 203.000 | 219.000 | 200.800 to 237.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (rca_lao) | RCA LAO-0 | 94.000 | 93.000 | 81.000 to 106.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (rca_lao) | RCA LAO-0 | 136.000 | 140.000 | 135.000 to 156.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (rca_lao) | RCA LAO-0 | 203.000 | 197.000 | 184.400 to 219.800 (cd-ds+cd-main) | 25 | pass |
| grey p5 (rca_rao) | RCA RAO-0 | 95.000 | 96.000 | 81.000 to 99.000 (cd-ds+cd-main) | 3 | pass |
| grey p50 (rca_rao) | RCA RAO-0 | 138.000 | 130.000 | 120.000 to 135.000 (cd-ds+cd-main) | 3 | FAIL |
| grey p95 (rca_rao) | RCA RAO-0 | 202.000 | 161.000 | 161.000 to 177.000 (cd-ds+cd-main) | 3 | FAIL |

## Vessels

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| large vessels at peak opacification: fwhm_px |  | 10.830 | 6.854 | 4.045 to 9.605 | 10 | FAIL |
| large vessels at peak opacification: depth |  | 51.610 | 47.725 | 38.353 to 75.072 | 10 | pass |
| large vessels at peak opacification: w80_w20 |  | 0.579 | 0.411 | 0.220 to 0.493 | 10 | FAIL |
| large vessels at peak opacification: edge10_90_px |  | 4.671 | 3.789 | 1.850 to 6.792 | 10 | pass |
| large vessels at peak opacification: halo |  | 5.615 | 8.060 | 4.771 to 14.474 | 10 | pass |
| smallest visible branches: fwhm_px |  | 2.366 | 2.522 | 1.986 to 5.748 | 6 | pass |
| smallest visible branches: depth |  | 10.705 | 18.040 | 5.470 to 27.400 | 6 | pass |

## Bone

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| rib margins: fwhm_px |  | n/a | 4.085 | 4.008 to 4.162 | 2 | no value |
| rib margins: depth |  | n/a | 21.775 | 13.850 to 29.700 | 2 | no value |

## Catheter

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| unfilled guide catheter: outer_fwhm_px |  | 7.000 | 7.750 | 7.000 to 9.750 | 3 | pass |
| unfilled guide catheter: wall_sep_px |  | 4.250 | 4.750 | 4.000 to 6.000 | 3 | pass |
| unfilled guide catheter: lumen_contrast |  | 3.665 | 12.790 | 3.010 to 25.430 | 3 | pass |
| unfilled guide catheter: depth |  | 27.340 | 32.100 | 24.330 to 54.490 | 3 | pass |

## Motion

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| LAD cross-section track: range_px |  | 14.630 | 29.800 | 22.880 to 31.110 | 3 | FAIL |
| LAD cross-section track: step_median |  | 2.440 | 2.550 | 2.380 to 2.870 | 3 | pass |
| LAD cross-section track: step_p90 |  | 4.910 | 6.430 | 4.620 to 8.710 | 3 | pass |
| LAD cross-section track: step_max |  | 10.650 | 11.090 | 8.190 to 12.020 | 3 | pass |
| RCA cross-section track: range_px |  | 26.605 | 33.500 | 27.930 to 44.900 | 4 | FAIL |
| RCA cross-section track: step_median |  | 8.195 | 4.115 | 2.420 to 8.910 | 4 | pass |
| RCA cross-section track: step_p90 |  | 8.940 | 9.790 | 8.230 to 12.130 | 4 | pass |
| RCA cross-section track: step_max |  | 11.645 | 12.425 | 10.350 to 14.450 | 4 | pass |
| catheter shaft cross-section track: range_px |  | 15.165 | 19.880 | 10.250 to 30.810 | 5 | pass |
| catheter shaft cross-section track: step_median |  | 2.235 | 2.250 | 1.650 to 4.740 | 5 | pass |
| catheter shaft cross-section track: step_p90 |  | 4.075 | 5.190 | 3.020 to 7.710 | 5 | pass |
| catheter shaft cross-section track: step_max |  | 5.240 | 6.440 | 4.770 to 11.090 | 5 | pass |

## Motion from the projected geometry (not image-based; for reference)

| run | vessel point | 2-D range px | max step px/frame | median step |
|---|---|---|---|---|
| lad_apcra | LAD | 45.21 | 17.25 | 6.19 |
| lad_laocra | LAD | 44.58 | 16.94 | 5.79 |
| lad_raocau | LAD | 38.13 | 14.5 | 5.18 |
| lad_raocra | LAD | 45.12 | 17.21 | 6.13 |
| rca_lao | RCA | 79.94 | 29.44 | 11.5 |
| rca_rao | RCA | 101.45 | 38.86 | 14.25 |
