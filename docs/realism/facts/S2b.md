# Facts used by stream S2b (analytic vessel and device integrator)

Every constant in `src/render/xray/segments/` is one of three kinds: a value taken from a
source listed here, a value measured from the project's own data (method given), or a model
parameter, which the code names as such in a comment.

## Sourced values

### Focal spot dimension: definition (IEC 60336)

- Source opened: IS/IEC 60336 (2005), "Medical electrical equipment, X-ray tube assemblies for
  medical diagnosis, characteristics of focal spots", public copy at
  https://law.resource.org/pub/in/bis/S09/is.iec.60336.2005.pdf (text extracted with pdftotext).
- Clause 8.2: "The actual dimension of the FOCAL SPOT shall be determined as the size of the
  related LINE SPREAD FUNCTION according to Clause 7 measured at 15 % of the peak value".
- Table 3 (maximum permissible focal spot dimensions): nominal 0.6, width 0.90 mm, length
  1.30 mm. Nominal values run from 0.3 to 2.0 in steps of 0.1 (clause 8.3.1).
- Used for: reading a nominal focal spot value as a width at 15 % of the peak of the line spread
  function. For a Gaussian, that width is 2 sqrt(2 ln(1/0.15)) sigma = 3.896 sigma
  (`GAUSS_W15_PER_SIGMA` in thinLut.ts, checked in segments.test.ts).

### Focal spot size used in a cardiac catheterisation laboratory

- Source: Comparison of human observer impression of X-ray fluoroscopy and angiography image
  quality with technical changes to image quality. J Med Imaging 2024; 11(4): 045502.
  DOI 10.1117/1.JMI.11.4.045502 (PMID 39131567, PMC11316400). Abstract retrieved through the
  PubMed full-text service (PMC page itself returned a reCAPTCHA).
- Quoted: "0.6 and 1.0 mm focal spots were used". Context: an image quality study framed
  around fluoroscopy and cine angiography in the cardiac catheterisation laboratory, with
  multi-frame pig thorax images as the background.
- Used for: the default focal spot, nominal 0.6 (`FOCAL_NOMINAL_MM`), the smaller of the two.

### Derived: default focal-spot Gaussian sigma

- sigma_f = 0.6 / 3.896 = 0.154 mm (`DEFAULT_PSF.focalSigmaMm`). This treats the nominal value
  as the 15 % width. IEC 60336 permits an actual width up to 1.5 times the nominal value
  (0.90 mm for 0.6), so the true blur may be up to 1.5 times larger. That is a modelling choice,
  not a measurement. At the object plane the focal blur on the detector is
  sigma_f (SID - z) / z (geometric unsharpness).

### erf approximation

- Abramowitz and Stegun, Handbook of Mathematical Functions, formula 7.1.26 (rational
  approximation, |error| <= 1.5e-7). The coefficients are in `erfApprox` and `THIN_GLSL`. Not
  cited for a physical quantity: segments.test.ts verifies them against direct numerical
  integration of erf (error under 2e-7 on [-3, 3]).

## Values measured from project data

### Coronary tree geometry (sets the union method and the branch tolerance)

- Script: a vite-node run of `buildCoronaryTree` on `CASE_LIBRARY[0]`, with per-joint
  statistics over all 49 vessels and 2,049 segments. It was a scratch script; the same
  quantities are recomputed by the "real coronary tree" test in segments.test.ts.
- Sample spacing: p5 0.99 mm, median 1.00 mm, p95 1.41 mm.
- Bend per joint: median 0.185 rad, p95 0.41, p99 0.53, max 1.17.
- Radius over curvature radius at a joint: median 0.08, p95 0.36, p99 0.56, max 2.7.
- Radius over sample spacing: median 0.44, p95 1.75, max 4.2. Up to four consecutive segments
  overlap, which rules out "subtract the previous segment" unions.
- Radius ratio between adjacent samples: p1 0.655, median 0.985, p99 1.031, min 0.23.
- Branch starts: 42 of 46 coincide exactly with a parent sample; the other 4 lie within 0.05 mm
  of one. Hence `BRANCH_TOL_MM = 0.1`.
- Second measurement (5 October 2026, the grown tree of 228-268 vessels per case, scratch
  vitest runs over `CASE_LIBRARY[0..2]` with the tree's own parent links): a branch's first
  segments overlap a run of up to 7-8 parent segments (the original 3 host slots were too few);
  the family pass adds 419-513 host entries (segment to host-segment pairs) per tree of 5,381-6,001 segments; at most 2 segments per
  tree need an extension list; no overlap was left unresolved. Separately, each tree has 5-7
  branches that leave their parent and re-enter it more than 4 samples past their origin, and
  29-37 pairs of non-parent members whose axes pass within 0.9 of the larger radius of each
  other (deep interpenetration, for example D1 and OM1 in case 0), which the generator should not
  produce (see the S2b notes, handed to S3b).

## Model parameters (named as such in the code)

| Parameter | Value | Where | Reason |
|---|---|---|---|
| sigmaAaPx | 0.5 px | thinLut.ts DEFAULT_PSF | smallest blur that removes beading of point-sampled sub-pixel lines (Poisson summation bound; measured in the wire test) |
| thinLoPx, thinHiPx | 1.0, 1.5 px | config.ts | blend band between the thin path and the exact path |
| ssFeaturePx | 2.5 px | config.ts | features thinner than this get edge-adaptive anti-aliasing |
| ssMinContrast | 0.05 | config.ts | faint features (lung vessels) skip anti-aliasing |
| backfillSlope | 0.05 | config.ts | taper above which the joint-plane gap is back-filled |
| ssMotionPx | 0.5 px | config.ts | motion within one pulse above which time sub-samples are taken |
| JOINT_PLANE_LIMIT | 0.5 | segmentPack.ts | r tan(theta/2) over the shorter segment, beyond which a joint uses hosts rather than a plane |
| RADIUS_STEP_LIMIT | 1.15 | segmentPack.ts | radius step between samples beyond which a joint uses hosts |
| MIN_BISECTOR | 0.2 | segmentPack.ts | bends past about 157 degrees get no plane |
| CHAIN_HOST_BACK | 8 segments | segmentPack.ts | how far back a segment looks for earlier segments it overlaps through a joint without a plane (radius over spacing reaches 4.2 on the tree, so a tight bend overlaps several samples back) |
| BRANCH_SEGS_MAX | 16 segments | segmentPack.ts | a branch's segments checked against its parent from its start |
| BRANCH_SCAN_GAP | 3 segments | segmentPack.ts | the outward scan along the parent stops after this many consecutive misses (the measured parent run at an origin is at most 8 segments) |
| FAMILY_CELL_MM | 2 mm | segmentPack.ts | spatial hash cell of the family-overlap search (about one coronary diameter) |
| HOST_RANGE_MAX, HOST_EXT_MAX | 31, 15 | segmentPack.ts | format limits: consecutive segments in one slot; slot values in one extension list (the longest on five coronary trees was 3) |
| NPC | 6 pieces | segmentGlsl.ts | chord pieces kept after host subtraction (a convex chord minus nearby capsules leaves one or two) |
| BLOCK, CULL_MARGIN_PX, CULL_RETRY | 32 segments, 16 px, 15 calls | tileBinner.ts | block pre-cull granularity, its screen margin and how long it is skipped after removing under 1/16 of the blocks (an optimisation only) |
| pulse width (demo only) | 8 ms | demo.ts | plan S2b task 4 default until the dose stream supplies it |
| tile | 16 px | config.ts | binning granularity |
