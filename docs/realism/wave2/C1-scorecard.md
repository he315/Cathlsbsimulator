# C1 scorecard (wave 2, image calibration step 1)

Set `c1f1`: the committed constants at the end of C1, captured on 2026-10-05 with
`window.__xrayCapture.standard("c1f1")` from the development server in a tab of its own (six reference views,
51 frames at 15 frames/s, 768 px, 20 cm field, plus the fluoroscopy and flushed-catheter companions), scored with
`python3 scripts/realism/report.py c1f1` (matched pipeline). Denominators are report.py's: rows with a simulator
value and a target with at least 3 real runs.

| set | what | matched |
|---|---|---|
| `i1s3final` | end of I1 step 2 (the "171/235" of the task) | 171 of 235 |
| `c1w0` | tree at the start of this C1 run (earlier stalled C1 attempt's catheter and pyramid work included) | 169 of 235 |
| `c1f1` | after C1 | **183 of 235** |

Row-by-row comparisons: `python3 scripts/realism/compare_sets.py <base> c1f1`.

## Against the start of this run (c1w0 -> c1f1)

```
c1w0: 169 of 235
c1f1: 183 of 235
section                c1w0         c1f1
Background         3/14         8/14    
Borders            3/4          4/4     
Catheter           4/4          4/4     
Contrast          10/24        10/24    
Field              4/4          4/4     
Geometry          36/46        36/46    
Grey levels       15/18        16/18    
Motion            18/31        21/31    
Noise             14/17        17/17    
Timing            56/66        57/66    
Vessels            6/7          6/7     
```

## Against the I1 baseline (i1s3final -> c1f1)

```
i1s3final: 171 of 235
c1f1: 183 of 235
section           i1s3final         c1f1
Background         5/14         8/14    
Borders            4/4          4/4     
Catheter           1/4          4/4     
Contrast          10/24        10/24    
Field              4/4          4/4     
Geometry          36/46        36/46    
Grey levels       15/18        16/18    
Motion            20/31        21/31    
Noise             15/17        17/17    
Timing            56/66        57/66    
Vessels            5/7          6/7     

LOST (pass -> fail or missing)
  time above 50% of rise                                     LCA  RAO-CAU      2.000 ->     2.333   band 1.733..2.267
  contrast arrival (30% of rise)                             LCA  RAO-CAU      0.733 ->     0.600   band 0.733..1.267
  local contrast p99, peak frame                             RCA  LAO-0       44.060 ->    55.360   band 35.520..45.352
  local contrast p99, peak frame                             RCA  RAO-0       34.830 ->    55.640   band 32.664..46.684
  block-matching motion, max                                 RCA  LAO-0       12.653 ->    13.322   band 3.437..13.065
  block-matching motion, median                              RCA  LAO-0        3.233 ->     6.231   band 1.326..3.538
  opacified area > 10 levels                                 LCA  RAO-CAU      0.307 ->     0.123   band 0.248..0.344
  opacified area > 10 levels                                 LCA  RAO-CRA      0.155 ->     0.113   band 0.132..0.589
  opacified area > 20 levels                                 LCA  AP-CRA       0.036 ->     0.032   band 0.035..0.295
  peak mean darkening                                        LCA  RAO-CRA      6.110 ->     5.017   band 5.104..25.722
  thin dark-line pixels (pre-contrast)                       any  any      11065.500 ->  8335.500   band 10069.900..16415.000
  frames at >= 90%                                           LCA  RAO-CAU      5.000 ->    16.000   band 3.000..10.000
  rise 10-90%                                                LCA  RAO-CAU      1.333 ->     1.000   band 1.267..2.600

GAINED (fail -> pass)
  time above 50% of rise                                     LCA  AP-CRA       1.333 ->     2.133   band 1.600..2.814
  unfilled guide catheter: lumen_contrast                    any  any          0.000 ->     9.060   band 3.010..25.430
  unfilled guide catheter: outer_fwhm_px                     any  any          6.250 ->     7.000   band 7.000..9.750
  unfilled guide catheter: wall_sep_px                       any  any          1.500 ->     4.500   band 4.000..6.000
  grey p50 (lad_raocau)                                      LCA  RAO-CAU    146.000 ->   137.000   band 129.400..145.000
  local contrast p99, peak frame                             LCA  RAO-CAU     32.310 ->    48.780   band 33.940..50.800
  local contrast p99, peak frame                             LCA  RAO-CRA     30.800 ->    44.350   band 33.710..55.523
  local contrast p99, pre-contrast                           LCA  RAO-CAU     16.940 ->    27.750   band 21.550..28.140
  local contrast p99, pre-contrast                           LCA  RAO-CRA     15.700 ->    25.170   band 21.494..32.746
  block-matching motion, max                                 LCA  RAO-CAU     12.622 ->    11.512   band 4.000..12.502
  block-matching motion, p90                                 LCA  LAO-CRA     12.346 ->    11.467   band 3.744..11.522
  noise SD at grey 200-219 (cd-ds)                           any  any          2.749 ->     3.061   band 3.001..4.941
  noise SD at grey 60-79 (cd-ds)                             any  any              - ->     4.093   band 3.688..4.728
  opacified area > 10 levels                                 RCA  LAO-0        0.090 ->     0.247   band 0.181..0.460
  opacified area > 10 levels                                 RCA  RAO-0        0.096 ->     0.181   band 0.139..0.460
  peak mean darkening                                        LCA  AP-CRA       3.499 ->     3.790   band 3.547..15.667
  peak mean darkening                                        RCA  LAO-0        4.935 ->     7.245   band 6.127..13.554
  lung band-pass 4-32 px RMS (bright tiles)                  any  any          4.307 ->     7.192   band 7.003..10.831
  band-pass RMS (mid tiles)                                  any  any          5.046 ->     7.412   band 5.114..9.938
  end-of-run level / peak                                    LCA  LAO-CRA     -0.059 ->     0.030   band -0.045..0.937
  end-of-run level / peak                                    RCA  LAO-0        0.129 ->     0.318   band 0.166..0.741
  90% filling                                                LCA  AP-CRA       2.467 ->     1.667   band 0.933..1.960
  rise 10-90%                                                LCA  AP-CRA       1.933 ->     1.067   band 0.480..1.493
  large vessels at peak opacification: fwhm_px               any  any         10.620 ->     9.153   band 4.045..9.605
  RCA cross-section track: range_px                          any  any         21.925 ->    28.820   band 27.930..44.900
```

## Full scorecard of c1f1

Generated 2026-10-05T21:27 by `scripts/realism/report.py` in 100 s. Pipeline: **matched** (crop to the collimated field, bilinear resample to 512 x 512, 8-bit, sips JPEG q72). Targets: `datasets/library/realism_targets.json`, profile `cd-ds` unless stated; pass = simulator median inside the target band (p10-p90 of real runs, or the observed range when fewer than 10).

**183 of 235 metrics inside the real band.** 4 further rows compare with fewer than 3 real measurements and are shown as indicative only.

Per-artery rows are split by view family (scripts/realism/views.py, 15-degree rule). A row uses the target of its own artery and view family when that target has at least 3 real runs, otherwise the artery-level target; the band column names the source when it is not the row's own artery/view or the default profile. Geometry rows (tortuosity, length, extent, motion in mm) use the anatomy audit's real traces and tracks (scripts/realism/geometry.py); length and extent are compared only within their own view family. The fluoroscopy/cine row is a rule (ratio above 1), not a library band.

| run | artery | view family | C-arm (LAO+/CRA+) | frames | field box (native px) | ms/frame scene + render |
|---|---|---|---|---|---|---|
| lad_apcra | LCA | AP-CRA | 0 / 30 | 51 | [0, 0, 768, 768] | 1.3 + 22.3 |
| lad_laocra | LCA | LAO-CRA | 32 / 26 | 51 | [0, 0, 768, 768] | 1.3 + 22.4 |
| lad_raocau | LCA | RAO-CAU | -22 / -22 | 51 | [0, 0, 768, 768] | 2.0 + 22.2 |
| lad_raocau_fluoro | LCA | RAO-CAU | -22 / -22 | 40 | [0, 0, 768, 768] | 0.7 + 21.9 |
| lad_raocau_flush | LCA | RAO-CAU | -22 / -22 | 12 | [0, 0, 768, 768] | 0.9 + 21.7 |
| lad_raocra | LCA | RAO-CRA | -20 / 24 | 51 | [0, 0, 768, 768] | 1.4 + 21.6 |
| rca_lao | RCA | LAO-0 | 40 / 0 | 51 | [0, 0, 768, 768] | 1.8 + 21.9 |
| rca_rao | RCA | RAO-0 | -30 / 0 | 51 | [0, 0, 768, 768] | 1.6 + 22.2 |


## Noise

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| temporal noise SD |  | 3.448 | 3.331 | 3.031 to 3.628 | 13 | pass |
| noise dark/bright ratio (96-127 / 160-191) |  | 1.102 | 1.117 | 0.901 to 1.295 | 13 | pass |
| noise autocorrelation lag 1 |  | 0.357 | 0.357 | 0.272 to 0.472 | 13 | pass |
| noise autocorrelation lag 2 |  | -0.022 | -0.051 | -0.099 to 0.011 | 13 | pass |
| NPS fraction below 0.1 cycles/px |  | 0.256 | 0.266 | 0.189 to 0.339 | 13 | pass |
| NPS high/low ratio |  | 0.299 | 0.294 | 0.126 to 0.561 | 13 | pass |
| frame-to-frame noise correlation |  | 0.033 | 0.092 | -0.015 to 0.144 | 13 | pass |
| run-start noise settling (pair 0-1 / 9-10) |  | 1.673 | 1.548 | 1.335 to 1.680 | 20 | pass |

## Background

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| lung band-pass 4-32 px RMS (bright tiles) |  | 7.192 | 8.890 | 7.003 to 10.831 | 54 | pass |
| band-pass RMS (mid tiles) |  | 7.412 | 7.340 | 5.114 to 9.938 | 54 | pass |
| band-pass RMS (dark tiles) |  | 6.263 | 6.456 | 4.429 to 8.870 | 54 | pass |
| power at 0.125 cycles/px (bright) |  | 110.920 | 275.940 | 143.405 to 373.071 | 54 | FAIL |
| spectrum slope 0.1-0.3 cycles/px (bright) |  | -1.558 | -2.409 | -3.241 to -1.821 | 54 | FAIL |
| background spectrum beta 0.008-0.08 |  | 2.636 | 2.554 | 2.181 to 3.025 | 54 | pass |
| background band power 0.008-0.08 |  | 190,264 | 110,312 | 49,099 to 410,539 | 54 | pass |
| thin dark-line pixels (pre-contrast) |  | 8,336 | 13,168 | 10,070 to 16,415 | 54 | FAIL |
| local contrast p99, pre-contrast | LCA AP-CRA | 20.490 | 23.980 | 22.172 to 27.700 | 13 | FAIL |
| local contrast p99, pre-contrast | LCA LAO-CRA | 23.900 | 29.880 | 22.900 to 38.400 | 9 | pass |
| local contrast p99, pre-contrast | LCA RAO-CAU | 27.750 | 23.020 | 21.550 to 28.140 | 3 | pass |
| local contrast p99, pre-contrast | LCA RAO-CRA | 25.170 | 27.095 | 21.494 to 32.746 | 22 | pass |
| local contrast p99, pre-contrast | RCA LAO-0 | 22.220 | 34.100 | 28.497 to 39.262 | 14 | FAIL |
| local contrast p99, pre-contrast | RCA RAO-0 | 24.030 | 30.460 | 25.942 to 41.536 (RCA/any) | 25 | FAIL |

## Borders

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| large-border bright overshoot |  | 8.915 | 5.745 | 0.282 to 13.629 | 54 | pass |
| overshoot / step |  | 0.193 | 0.114 | 0.005 to 0.324 | 54 | pass |
| overshoot peak distance |  | 8.250 | 13.750 | 6.950 to 23.950 | 54 | pass |
| dark-side undershoot |  | -0.940 | 0.685 | -2.784 to 15.745 | 54 | pass |

## Contrast

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| local contrast p99, peak frame | LCA AP-CRA | 37.150 | 36.300 | 29.934 to 47.816 | 13 | pass |
| local contrast p99, peak frame | LCA LAO-CRA | 42.530 | 41.470 | 27.250 to 55.020 | 9 | pass |
| local contrast p99, peak frame | LCA RAO-CAU | 48.780 | 35.640 | 33.940 to 50.800 | 3 | pass |
| local contrast p99, peak frame | LCA RAO-CRA | 44.350 | 44.345 | 33.710 to 55.523 | 22 | pass |
| local contrast p99, peak frame | RCA LAO-0 | 55.360 | 42.690 | 35.520 to 45.352 | 14 | FAIL |
| local contrast p99, peak frame | RCA RAO-0 | 55.640 | 39.980 | 32.664 to 46.684 (RCA/any) | 25 | FAIL |
| opacified area > 10 levels | LCA AP-CRA | 0.073 | 0.174 | 0.081 to 0.426 | 13 | FAIL |
| opacified area > 10 levels | LCA LAO-CRA | 0.101 | 0.210 | 0.154 to 0.558 | 9 | FAIL |
| opacified area > 10 levels | LCA RAO-CAU | 0.123 | 0.270 | 0.248 to 0.344 | 3 | FAIL |
| opacified area > 10 levels | LCA RAO-CRA | 0.113 | 0.278 | 0.132 to 0.589 | 22 | FAIL |
| opacified area > 10 levels | RCA LAO-0 | 0.247 | 0.310 | 0.181 to 0.460 | 14 | pass |
| opacified area > 10 levels | RCA RAO-0 | 0.181 | 0.295 | 0.139 to 0.460 (RCA/any) | 25 | pass |
| opacified area > 20 levels | LCA AP-CRA | 0.032 | 0.094 | 0.035 to 0.295 | 13 | FAIL |
| opacified area > 20 levels | LCA LAO-CRA | 0.039 | 0.097 | 0.049 to 0.458 | 9 | FAIL |
| opacified area > 20 levels | LCA RAO-CAU | 0.033 | 0.139 | 0.090 to 0.164 | 3 | FAIL |
| opacified area > 20 levels | LCA RAO-CRA | 0.049 | 0.182 | 0.046 to 0.496 | 22 | pass |
| opacified area > 20 levels | RCA LAO-0 | 0.045 | 0.159 | 0.085 to 0.280 | 14 | FAIL |
| opacified area > 20 levels | RCA RAO-0 | 0.050 | 0.144 | 0.077 to 0.252 (RCA/any) | 25 | FAIL |
| peak mean darkening | LCA AP-CRA | 3.790 | 5.910 | 3.547 to 15.667 | 13 | pass |
| peak mean darkening | LCA LAO-CRA | 4.338 | 6.996 | 5.713 to 24.591 | 9 | FAIL |
| peak mean darkening | LCA RAO-CAU | 4.422 | 8.189 | 7.035 to 8.895 | 3 | FAIL |
| peak mean darkening | LCA RAO-CRA | 5.017 | 9.697 | 5.104 to 25.722 | 22 | FAIL |
| peak mean darkening | RCA LAO-0 | 7.245 | 9.461 | 6.127 to 13.554 | 14 | pass |
| peak mean darkening | RCA RAO-0 | 6.695 | 8.445 | 5.133 to 12.584 (RCA/any) | 25 | pass |

## Timing

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| first appearance (10%) | LCA AP-CRA | 0.600 | 0.467 | 0.294 to 0.706 | 13 | pass |
| first appearance (10%) | LCA LAO-CRA | 0.467 | 0.533 | 0.200 to 0.667 | 9 | pass |
| first appearance (10%) | LCA RAO-CAU | 0.467 | 0.867 | 0.467 to 1.067 | 3 | pass |
| first appearance (10%) | LCA RAO-CRA | 0.533 | 0.533 | 0.333 to 0.793 | 22 | pass |
| first appearance (10%) | RCA LAO-0 | 0.533 | 0.334 | 0.067 to 0.760 | 14 | pass |
| first appearance (10%) | RCA RAO-0 | 0.533 | 0.333 | 0.067 to 0.707 (RCA/any) | 25 | pass |
| 50% filling | LCA AP-CRA | 0.800 | 0.867 | 0.560 to 1.000 | 13 | pass |
| 50% filling | LCA LAO-CRA | 0.667 | 0.933 | 0.600 to 1.533 | 9 | pass |
| 50% filling | LCA RAO-CAU | 0.800 | 1.533 | 1.067 to 1.533 | 3 | FAIL |
| 50% filling | LCA RAO-CRA | 0.867 | 0.967 | 0.733 to 1.454 | 22 | pass |
| 50% filling | RCA LAO-0 | 0.867 | 1.000 | 0.660 to 1.787 | 14 | pass |
| 50% filling | RCA RAO-0 | 0.867 | 1.067 | 0.600 to 2.027 (RCA/any) | 25 | pass |
| 90% filling | LCA AP-CRA | 1.667 | 1.533 | 0.933 to 1.960 | 13 | pass |
| 90% filling | LCA LAO-CRA | 1.333 | 1.667 | 0.867 to 2.267 | 9 | pass |
| 90% filling | LCA RAO-CAU | 1.467 | 2.333 | 2.067 to 3.467 | 3 | FAIL |
| 90% filling | LCA RAO-CRA | 1.467 | 1.667 | 1.340 to 2.533 | 22 | pass |
| 90% filling | RCA LAO-0 | 2.467 | 1.966 | 1.300 to 2.913 | 14 | pass |
| 90% filling | RCA RAO-0 | 1.800 | 2.000 | 1.200 to 2.907 (RCA/any) | 25 | pass |
| rise 10-90% | LCA AP-CRA | 1.067 | 1.000 | 0.480 to 1.493 | 13 | pass |
| rise 10-90% | LCA LAO-CRA | 0.867 | 1.000 | 0.333 to 1.667 | 9 | pass |
| rise 10-90% | LCA RAO-CAU | 1.000 | 1.600 | 1.267 to 2.600 | 3 | FAIL |
| rise 10-90% | LCA RAO-CRA | 0.933 | 1.133 | 0.807 to 1.980 | 22 | pass |
| rise 10-90% | RCA LAO-0 | 1.933 | 1.633 | 1.133 to 2.267 | 14 | pass |
| rise 10-90% | RCA RAO-0 | 1.267 | 1.733 | 1.027 to 2.307 (RCA/any) | 25 | pass |
| frames at >= 90% | LCA AP-CRA | 8.000 | 6.000 | 4.000 to 11.400 | 13 | pass |
| frames at >= 90% | LCA LAO-CRA | 11.000 | 7.000 | 4.000 to 10.000 | 9 | FAIL |
| frames at >= 90% | LCA RAO-CAU | 16.000 | 3.000 | 3.000 to 10.000 | 3 | FAIL |
| frames at >= 90% | LCA RAO-CRA | 10.000 | 6.500 | 3.000 to 12.000 | 22 | pass |
| frames at >= 90% | RCA LAO-0 | 3.000 | 6.500 | 4.000 to 9.700 | 14 | FAIL |
| frames at >= 90% | RCA RAO-0 | 8.000 | 4.000 | 2.000 to 9.600 (RCA/any) | 25 | pass |
| 50% washout after peak | LCA AP-CRA | 0.400 | 0.800 | 0.400 to 1.200 | 11 | pass |
| 50% washout after peak | LCA LAO-CRA | 1.333 | 0.734 | 0.400 to 1.333 | 4 | pass |
| 50% washout after peak | LCA RAO-CAU | 1.067 | 0.867 | 0.334 to 1.400 (LCA/any) | 56 | pass |
| 50% washout after peak | LCA RAO-CRA | 0.733 | 0.900 | 0.467 to 1.693 | 14 | pass |
| 50% washout after peak | RCA LAO-0 | 0.333 | 0.800 | 0.200 to 0.933 | 9 | pass |
| 50% washout after peak | RCA RAO-0 | 0.533 | 0.667 | 0.307 to 0.933 (RCA/any) | 17 | pass |
| end-of-run level / peak | LCA AP-CRA | 0.110 | 0.205 | 0.077 to 0.555 | 13 | pass |
| end-of-run level / peak | LCA LAO-CRA | 0.030 | 0.561 | -0.045 to 0.937 | 9 | pass |
| end-of-run level / peak | LCA RAO-CAU | 0.280 | 0.557 | 0.407 to 0.750 | 3 | FAIL |
| end-of-run level / peak | LCA RAO-CRA | 0.264 | 0.438 | 0.167 to 0.909 | 22 | pass |
| end-of-run level / peak | RCA LAO-0 | 0.318 | 0.435 | 0.166 to 0.741 | 14 | pass |
| end-of-run level / peak | RCA RAO-0 | 0.366 | 0.377 | -0.071 to 0.733 (RCA/any) | 25 | pass |
| run length | LCA AP-CRA | 3.400 | 3.533 | 3.333 to 3.920 | 13 | pass |
| run length | LCA LAO-CRA | 3.400 | 3.067 | 2.400 to 4.400 | 9 | pass |
| run length | LCA RAO-CAU | 3.400 | 3.600 | 3.333 to 3.733 | 3 | pass |
| run length | LCA RAO-CRA | 3.400 | 3.533 | 2.687 to 4.367 | 22 | pass |
| run length | RCA LAO-0 | 3.400 | 3.534 | 2.753 to 4.693 | 14 | pass |
| run length | RCA RAO-0 | 3.400 | 3.467 | 2.533 to 4.680 (RCA/any) | 25 | pass |

## Motion

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| heart rate from frame differences |  | 72.040 | 64.605 | 56.394 to 90.981 | 52 | pass |
| block-matching motion, median | LCA AP-CRA | 6.139 | 5.153 | 1.778 to 7.000 | 13 | pass |
| block-matching motion, median | LCA LAO-CRA | 4.836 | 3.970 | 2.059 to 8.431 | 9 | pass |
| block-matching motion, median | LCA RAO-CAU | 4.243 | 3.593 | 1.457 to 3.624 | 3 | FAIL |
| block-matching motion, median | LCA RAO-CRA | 3.650 | 4.818 | 1.778 to 8.368 | 22 | pass |
| block-matching motion, median | RCA LAO-0 | 6.231 | 2.280 | 1.326 to 3.538 | 14 | FAIL |
| block-matching motion, median | RCA RAO-0 | 10.731 | 2.766 | 0.892 to 5.988 (RCA/any) | 25 | FAIL |
| block-matching motion, p90 | LCA AP-CRA | 12.462 | 10.363 | 4.632 to 13.483 | 13 | pass |
| block-matching motion, p90 | LCA LAO-CRA | 11.467 | 8.615 | 3.744 to 11.522 | 9 | pass |
| block-matching motion, p90 | LCA RAO-CAU | 10.389 | 6.869 | 2.408 to 8.646 | 3 | FAIL |
| block-matching motion, p90 | LCA RAO-CRA | 9.553 | 10.668 | 4.689 to 14.998 | 22 | pass |
| block-matching motion, p90 | RCA LAO-0 | 11.418 | 4.982 | 2.248 to 6.795 | 14 | FAIL |
| block-matching motion, p90 | RCA RAO-0 | 14.886 | 5.314 | 2.180 to 11.061 (RCA/any) | 25 | FAIL |
| block-matching motion, max | LCA AP-CRA | 12.852 | 13.130 | 5.469 to 15.071 | 13 | pass |
| block-matching motion, max | LCA LAO-CRA | 12.704 | 13.019 | 4.062 to 14.439 | 9 | pass |
| block-matching motion, max | LCA RAO-CAU | 11.512 | 9.947 | 4.000 to 12.502 | 3 | pass |
| block-matching motion, max | LCA RAO-CRA | 13.536 | 12.937 | 6.079 to 15.969 | 22 | pass |
| block-matching motion, max | RCA LAO-0 | 13.322 | 6.980 | 3.437 to 13.065 | 14 | FAIL |
| block-matching motion, max | RCA RAO-0 | 17.795 | 9.015 | 3.154 to 13.244 (RCA/any) | 25 | FAIL |

## Field

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| outer 0-2 px vs 16-32 px band |  | -4.620 | -5.955 | -15.817 to 0.590 | 80 | pass |
| 2-4 px vs 16-32 px band |  | -1.575 | -4.280 | -10.056 to 1.793 | 80 | pass |
| 8-16 px vs 16-32 px band |  | 0.580 | -0.265 | -3.640 to 5.514 | 80 | pass |
| corners vs 16-32 px band |  | -5.895 | -10.465 | -26.283 to 3.184 | 80 | pass |

## Timing

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| contrast arrival (30% of rise) | LCA AP-CRA | 0.667 | 0.600 | 0.480 to 0.906 | 13 | pass |
| contrast arrival (30% of rise) | LCA LAO-CRA | 0.533 | 0.600 | 0.200 to 1.067 | 9 | pass |
| contrast arrival (30% of rise) | LCA RAO-CAU | 0.600 | 1.133 | 0.733 to 1.267 | 3 | FAIL |
| contrast arrival (30% of rise) | LCA RAO-CRA | 0.667 | 0.667 | 0.467 to 0.993 | 22 | pass |
| contrast arrival (30% of rise) | RCA LAO-0 | 0.733 | 0.633 | 0.487 to 1.180 | 14 | pass |
| contrast arrival (30% of rise) | RCA RAO-0 | 0.733 | 0.600 | 0.293 to 1.173 (RCA/any) | 25 | pass |
| time above 50% of rise | LCA AP-CRA | 2.133 | 2.000 | 1.600 to 2.814 | 13 | pass |
| time above 50% of rise | LCA LAO-CRA | 2.200 | 1.600 | 1.333 to 2.867 | 9 | pass |
| time above 50% of rise | LCA RAO-CAU | 2.333 | 2.200 | 1.733 to 2.267 | 3 | FAIL |
| time above 50% of rise | LCA RAO-CRA | 2.133 | 2.100 | 1.474 to 2.834 | 22 | pass |
| time above 50% of rise | RCA LAO-0 | 1.800 | 2.267 | 1.193 to 2.600 | 14 | pass |
| time above 50% of rise | RCA RAO-0 | 2.267 | 2.200 | 1.133 to 2.600 (RCA/any) | 25 | pass |
| contrast present in the first frame (0/1) | LCA AP-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 13 | pass |
| contrast present in the first frame (0/1) | LCA LAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 9 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CAU | 0.000 | 0.000 | 0.000 to 0.000 | 3 | pass |
| contrast present in the first frame (0/1) | LCA RAO-CRA | 0.000 | 0.000 | 0.000 to 0.000 | 22 | pass |
| contrast present in the first frame (0/1) | RCA LAO-0 | 0.000 | 0.000 | 0.000 to 0.000 | 14 | pass |
| contrast present in the first frame (0/1) | RCA RAO-0 | 0.000 | 0.000 | 0.000 to 0.000 (RCA/any) | 25 | pass |

## Noise

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| noise SD at grey 60-79 (cd-ds) |  | 4.093 | 4.255 | 3.688 to 4.728 | 6 | pass |
| noise SD at grey 80-99 (cd-ds) |  | 3.766 | 3.851 | 3.517 to 4.240 | 12 | pass |
| noise SD at grey 100-119 (cd-ds) |  | 3.536 | 3.617 | 3.161 to 3.810 | 13 | pass |
| noise SD at grey 120-139 (cd-ds) |  | 3.613 | 3.363 | 2.772 to 3.676 | 13 | pass |
| noise SD at grey 140-159 (cd-ds) |  | 3.579 | 3.358 | 2.836 to 3.640 | 13 | pass |
| noise SD at grey 160-179 (cd-ds) |  | 3.343 | 3.207 | 2.802 to 3.674 | 13 | pass |
| noise SD at grey 180-199 (cd-ds) |  | 3.151 | 3.285 | 2.611 to 4.561 | 13 | pass |
| noise SD at grey 200-219 (cd-ds) |  | 3.061 | 3.294 | 3.001 to 4.941 | 13 | pass |
| fluoro / cine noise SD at equal grey (lad_raocau_fluoro vs lad_raocau) | LCA RAO-CAU | 1.397 | n/a | ratio > 1 (plan measurementTargets: fluoro must be noisier than cine at equal grey) | 0 | pass |

## Geometry

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| tortuosity band RMS 3-8 mm | LCA AP-CRA | 8.355 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | FAIL |
| tortuosity band RMS 3-8 mm | LCA LAO-CRA | 9.895 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 3-8 mm | LCA RAO-CAU | 7.612 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main, LCA/any) | 5 | FAIL |
| tortuosity band RMS 3-8 mm | LCA RAO-CRA | 7.899 | 12.950 | 9.085 to 18.587 (cd-ds+cd-main) | 5 | FAIL |
| tortuosity band RMS 3-8 mm | RCA LAO-0 | 8.993 | 14.399 | 8.979 to 16.686 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 3-8 mm | RCA RAO-0 | 7.459 | 14.399 | 8.979 to 16.686 (cd-ds+cd-main, RCA/any) | 4 | FAIL |
| tortuosity band RMS 8-20 mm | LCA AP-CRA | 12.710 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA LAO-CRA | 10.948 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA RAO-CAU | 14.906 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 8-20 mm | LCA RAO-CRA | 14.545 | 11.238 | 7.688 to 22.387 (cd-ds+cd-main) | 5 | pass |
| tortuosity band RMS 8-20 mm | RCA LAO-0 | 8.622 | 10.995 | 6.485 to 12.387 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 8-20 mm | RCA RAO-0 | 5.365 | 10.995 | 6.485 to 12.387 (cd-ds+cd-main, RCA/any) | 4 | FAIL |
| tortuosity band RMS 20-60 mm | LCA AP-CRA | 13.455 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA LAO-CRA | 13.862 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA RAO-CAU | 15.002 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main, LCA/any) | 5 | pass |
| tortuosity band RMS 20-60 mm | LCA RAO-CRA | 13.321 | 13.853 | 7.755 to 35.875 (cd-ds+cd-main) | 5 | pass |
| tortuosity band RMS 20-60 mm | RCA LAO-0 | 10.972 | 11.621 | 10.027 to 16.742 (cd-ds+cd-main) | 4 | pass |
| tortuosity band RMS 20-60 mm | RCA RAO-0 | 10.656 | 11.621 | 10.027 to 16.742 (cd-ds+cd-main, RCA/any) | 4 | pass |
| projected LM+LAD length | LCA AP-CRA | 131.100 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA LAO-CRA | 130.200 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA RAO-CAU | 124.200 | n/a | n/a |  | no target |
| projected LM+LAD length | LCA RAO-CRA | 130.600 | 134.900 | 96.400 to 135.700 (cd-ds+cd-main) | 5 | pass |
| LM+LAD arc / chord | LCA AP-CRA | 1.136 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA LAO-CRA | 1.148 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA RAO-CAU | 1.158 | n/a | n/a |  | no target |
| LM+LAD arc / chord | LCA RAO-CRA | 1.154 | 1.226 | 1.211 to 1.460 (cd-ds+cd-main) | 5 | FAIL |
| tree extent, width | LCA AP-CRA | 55.000 | 93.846 | 75.692 to 119.692 (cd-ds+cd-main) | 11 | FAIL |
| tree extent, width | LCA LAO-CRA | 56.200 | 102.154 | 64.000 to 123.077 (cd-ds+cd-main) | 8 | FAIL |
| tree extent, width | LCA RAO-CAU | 66.700 | 101.077 | 86.831 to 114.154 (cd-ds+cd-main) | 12 | FAIL |
| tree extent, width | LCA RAO-CRA | 67.700 | 102.769 | 91.385 to 130.769 (cd-ds+cd-main) | 9 | FAIL |
| tree extent, width | RCA LAO-0 | 69.400 | 44.000 | 44.000 to 44.000 (cd-ds+cd-main) | 1 | outside (indicative, n < 3) |
| tree extent, width | RCA RAO-0 | 55.800 | n/a | n/a |  | no target |
| tree extent, height | LCA AP-CRA | 89.700 | 92.923 | 57.846 to 115.692 (cd-ds+cd-main) | 11 | pass |
| tree extent, height | LCA LAO-CRA | 94.100 | 74.154 | 53.231 to 124.615 (cd-ds+cd-main) | 8 | pass |
| tree extent, height | LCA RAO-CAU | 76.900 | 95.077 | 65.477 to 119.077 (cd-ds+cd-main) | 12 | pass |
| tree extent, height | LCA RAO-CRA | 80.500 | 94.462 | 40.000 to 128.000 (cd-ds+cd-main) | 9 | pass |
| tree extent, height | RCA LAO-0 | 112.700 | 50.462 | 50.462 to 50.462 (cd-ds+cd-main) | 1 | outside (indicative, n < 3) |
| tree extent, height | RCA RAO-0 | 115.800 | n/a | n/a |  | no target |
| landmark displacement P10-P90 (mm) | LCA AP-CRA | 9.740 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA LAO-CRA | 9.670 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA RAO-CAU | 6.440 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark displacement P10-P90 (mm) | LCA RAO-CRA | 9.570 | 8.185 | 3.945 to 15.483 (cd-ds+cd-main) | 25 | pass |
| landmark displacement P10-P90 (mm) | RCA LAO-0 | 10.460 | 17.815 | 9.421 to 29.348 (cd-ds+cd-main) | 19 | pass |
| landmark displacement P10-P90 (mm) | RCA RAO-0 | 21.400 | 17.815 | 9.421 to 29.348 (cd-ds+cd-main, RCA/any) | 19 | pass |
| landmark speed, median (mm/s) | LCA AP-CRA | 19.980 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA LAO-CRA | 19.580 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA RAO-CAU | 14.550 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, median (mm/s) | LCA RAO-CRA | 19.560 | 16.846 | 9.960 to 26.340 (cd-ds+cd-main) | 25 | pass |
| landmark speed, median (mm/s) | RCA LAO-0 | 23.570 | 49.442 | 16.989 to 87.157 (cd-ds+cd-main) | 20 | pass |
| landmark speed, median (mm/s) | RCA RAO-0 | 46.480 | 49.442 | 16.989 to 87.157 (cd-ds+cd-main, RCA/any) | 20 | pass |
| landmark speed, 90th centile (mm/s) | LCA AP-CRA | 46.110 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA LAO-CRA | 46.050 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA RAO-CAU | 30.690 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main, LCA/any) | 25 | pass |
| landmark speed, 90th centile (mm/s) | LCA RAO-CRA | 45.320 | 38.677 | 27.157 to 57.443 (cd-ds+cd-main) | 25 | pass |
| landmark speed, 90th centile (mm/s) | RCA LAO-0 | 52.380 | 103.592 | 47.100 to 134.151 (cd-ds+cd-main) | 20 | pass |
| landmark speed, 90th centile (mm/s) | RCA RAO-0 | 103.060 | 103.592 | 47.100 to 134.151 (cd-ds+cd-main, RCA/any) | 20 | pass |

## Grey levels

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| grey p5 (lad_apcra) | LCA AP-CRA | 96.000 | 96.000 | 87.800 to 106.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_apcra) | LCA AP-CRA | 136.000 | 129.000 | 122.800 to 137.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_apcra) | LCA AP-CRA | 206.000 | 201.000 | 181.800 to 220.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_laocra) | LCA LAO-CRA | 95.000 | 98.000 | 81.800 to 102.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_laocra) | LCA LAO-CRA | 135.000 | 136.000 | 126.000 to 149.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_laocra) | LCA LAO-CRA | 205.000 | 197.000 | 182.400 to 223.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_raocau) | LCA RAO-CAU | 95.000 | 93.000 | 82.400 to 101.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_raocau) | LCA RAO-CAU | 137.000 | 133.000 | 129.400 to 145.000 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_raocau) | LCA RAO-CAU | 205.000 | 196.000 | 177.800 to 214.800 (cd-ds+cd-main) | 25 | pass |
| grey p5 (lad_raocra) | LCA RAO-CRA | 96.000 | 94.000 | 77.800 to 104.800 (cd-ds+cd-main) | 25 | pass |
| grey p50 (lad_raocra) | LCA RAO-CRA | 137.000 | 139.000 | 124.600 to 163.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (lad_raocra) | LCA RAO-CRA | 206.000 | 219.000 | 200.800 to 237.200 (cd-ds+cd-main) | 25 | pass |
| grey p5 (rca_lao) | RCA LAO-0 | 97.000 | 93.000 | 81.000 to 106.200 (cd-ds+cd-main) | 25 | pass |
| grey p50 (rca_lao) | RCA LAO-0 | 136.000 | 140.000 | 135.000 to 156.600 (cd-ds+cd-main) | 25 | pass |
| grey p95 (rca_lao) | RCA LAO-0 | 204.000 | 197.000 | 184.400 to 219.800 (cd-ds+cd-main) | 25 | pass |
| grey p5 (rca_rao) | RCA RAO-0 | 96.000 | 96.000 | 81.000 to 99.000 (cd-ds+cd-main) | 3 | pass |
| grey p50 (rca_rao) | RCA RAO-0 | 136.000 | 130.000 | 120.000 to 135.000 (cd-ds+cd-main) | 3 | FAIL |
| grey p95 (rca_rao) | RCA RAO-0 | 203.000 | 161.000 | 161.000 to 177.000 (cd-ds+cd-main) | 3 | FAIL |

## Vessels

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| large vessels at peak opacification: fwhm_px |  | 9.153 | 6.854 | 4.045 to 9.605 | 10 | pass |
| large vessels at peak opacification: depth |  | 60.740 | 47.725 | 38.353 to 75.072 | 10 | pass |
| large vessels at peak opacification: w80_w20 |  | 0.517 | 0.411 | 0.220 to 0.493 | 10 | FAIL |
| large vessels at peak opacification: edge10_90_px |  | 4.122 | 3.789 | 1.850 to 6.792 | 10 | pass |
| large vessels at peak opacification: halo |  | 8.505 | 8.060 | 4.771 to 14.474 | 10 | pass |
| smallest visible branches: fwhm_px |  | 2.463 | 2.522 | 1.986 to 5.748 | 6 | pass |
| smallest visible branches: depth |  | 12.010 | 18.040 | 5.470 to 27.400 | 6 | pass |

## Bone

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| rib margins: fwhm_px |  | n/a | 4.085 | 4.008 to 4.162 | 2 | no value |
| rib margins: depth |  | n/a | 21.775 | 13.850 to 29.700 | 2 | no value |

## Catheter

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| unfilled guide catheter: outer_fwhm_px |  | 7.000 | 7.750 | 7.000 to 9.750 | 3 | pass |
| unfilled guide catheter: wall_sep_px |  | 4.500 | 4.750 | 4.000 to 6.000 | 3 | pass |
| unfilled guide catheter: lumen_contrast |  | 9.060 | 12.790 | 3.010 to 25.430 | 3 | pass |
| unfilled guide catheter: depth |  | 34.750 | 32.100 | 24.330 to 54.490 | 3 | pass |

## Motion

| metric | artery / view | simulator | real median | real band | n real | result |
|---|---|---|---|---|---|---|
| LAD cross-section track: range_px |  | 14.400 | 29.800 | 22.880 to 31.110 | 3 | FAIL |
| LAD cross-section track: step_median |  | 1.730 | 2.550 | 2.380 to 2.870 | 3 | FAIL |
| LAD cross-section track: step_p90 |  | 6.595 | 6.430 | 4.620 to 8.710 | 3 | pass |
| LAD cross-section track: step_max |  | 9.330 | 11.090 | 8.190 to 12.020 | 3 | pass |
| RCA cross-section track: range_px |  | 28.820 | 33.500 | 27.930 to 44.900 | 4 | pass |
| RCA cross-section track: step_median |  | 7.435 | 4.115 | 2.420 to 8.910 | 4 | pass |
| RCA cross-section track: step_p90 |  | 9.945 | 9.790 | 8.230 to 12.130 | 4 | pass |
| RCA cross-section track: step_max |  | 11.900 | 12.425 | 10.350 to 14.450 | 4 | pass |
| catheter shaft cross-section track: range_px |  | 13.835 | 19.880 | 10.250 to 30.810 | 5 | pass |
| catheter shaft cross-section track: step_median |  | 2.095 | 2.250 | 1.650 to 4.740 | 5 | pass |
| catheter shaft cross-section track: step_p90 |  | 4.080 | 5.190 | 3.020 to 7.710 | 5 | pass |
| catheter shaft cross-section track: step_max |  | 6.040 | 6.440 | 4.770 to 11.090 | 5 | pass |

## Motion from the projected geometry (not image-based; for reference)

| run | vessel point | 2-D range px | max step px/frame | median step |
|---|---|---|---|---|
| lad_apcra | LAD | 42.52 | 16.06 | 5.81 |
| lad_laocra | LAD | 42.17 | 15.86 | 5.85 |
| lad_raocau | LAD | 34.92 | 13.16 | 4.65 |
| lad_raocra | LAD | 42.5 | 16.03 | 6.4 |
| rca_lao | RCA | 84.56 | 31.15 | 11.3 |
| rca_rao | RCA | 100.23 | 38.46 | 14.44 |
