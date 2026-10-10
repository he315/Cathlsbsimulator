# Anatomy and motion validation (stream S3)

This folder holds the tools that compare the simulator's coronary anatomy and heart motion with measurements from the CoronaryDominance cine library.

- **`library/`** holds the real-library tools of the anatomy-motion audit. They were ported from the scratch folder unchanged, except that outputs now go to `out/` (or `$ANATOMY_OUT`) and they read the library from `datasets/library`. They use Node stdlib plus `sips` for image input and output.
  - `trace.mjs`: minimal-path centrelines.
  - `track.mjs`: NCC landmark tracking.
  - `shape.mjs`: arc length and arc/chord.
  - `spectrum.mjs`: tangent-angle band RMS.
  - `realskel.mjs`: vessel-mask extents.
  - `transect2.mjs`: transect crossings.
  - `cathwidth.mjs`: catheter-width calibration.
  - Helpers: `img.mjs`, `skel.mjs`, `draw.mjs`, `period.mjs`, `width.mjs`, `pick.mjs`, `countrows.mjs`.
  - `realskel_nocath.mjs` (added by the S3 fix): the realskel.mjs masks with the guiding catheter traced from the image border and removed, from the peak frame (`peak`, lower bound) or the whole filling phase (`fill`, upper bound). Run with `node scripts/anatomy_validation/library/realskel_nocath.mjs [debugPngs] [peak|fill]`; overlays go to `out/nocath/` (orange: removed catheter, blue: kept vessel mask).
- **`data/`** holds the outputs of those tools from the audit run: extents, motion tracks and traced centrelines.
- **`build_reference.mjs`** builds `reference.json` from `data/` (and the xtrack outputs in `docs/realism/research/`). Run it with `node scripts/anatomy_validation/build_reference.mjs`. Fields: `extents` (catheter-inclusive masks), `extentsVesselOnly` (catheter removed, peak and fill), `tortuosity`, `lmLadLengthRAOcraMm`, `motionP1090Mm`, `xtrackLines` (scan-line tracks with their view angles) and `quoted`.
- **`metrics.ts`** computes the same metrics on simulated trees: projected extents, band RMS, landmark motion (with the across-vessel step), the xtrack scan-line measurement (`scanlineMotion`, `xtrackSpec`), transect raster and opacified-area proxy. `src/render/xray/anatomy.test.ts` uses it.
- **`sim_metrics.ts`** prints a simulator-versus-library report over N genomes. Run it with `npx vite-node scripts/anatomy_validation/sim_metrics.ts 16`.
- **`render_raster.ts`** writes synthetic contrast-only rasters as PGM for visual checks.
- **`branch_report.ts`** prints named side-branch calibres (D1, OM1, OM2 against Divia Paul 2018), series ordering, sinoatrial nodal length, side consistency over all variants and transect crossings.
- **`extent_report.ts`** prints simulated LCA extents, vessel-only and with an emulated catheter, against the library.
- **`fit_axis.ts`** fits the mean heart axis and length to the vessel-only extent bands, the traced LM+LAD length and the no-climb constraint.
- **`fit_motion.ts`** evaluates motion settings (translation scale, radial, whole-heart rotation vector, RV swing) against the NCC P10-P90 values and the xtrack lines of both the LAD and the RCA. Run it with `npx vite-node scripts/anatomy_validation/fit_motion.ts 8 "1,0.12,0,-5,3;1,0.12,0,0,0"`. Each setting is `transScale,radial,rotX,rotY,rotZ[,rvSwing[,tapse]]`: the translation scale is relative to the current default, the rest are absolute (rvSwing and tapse default to the current values).
- **`artefact_report.ts`** (wave 2, I2) counts generator artefacts with `metrics.treeArtefacts`: branches that re-enter their parent's lumen away from the origin, same-tree pairs that are not parent and child whose axes pass within 0.9 x the larger radius, and left-right lumen intersections, on `CASE_LIBRARY[0..2]` (the trees S2b counted) and N genomes.
- **`crossing_report.ts`** (wave 2, I2) names the vessel behind every counted transect crossing (`rasterMetrics(...).peaks`) and reports the mean per row by class, plus the number of left vessels visible over 15 mm.
- **`named_report.ts`** (wave 2, I2 review) reports, over N genomes plus the whole `CASE_LIBRARY`: named-branch lengths (PDA, D1-D4, OM1-OM3, PL2, PL3, PLV) and the PDA's end on the long axis; the depth of the LAD and of the other epicardial named vessels outside a flagged bridge (samples below -1 and -3 mm); whether every genome bridge is still flagged on the grown vessel; and every named vessel the clearance check cut short or left out, with the vessel that blocked it (`Topology.cuts`). Run it with `npx vite-node scripts/anatomy_validation/named_report.ts 24 [1]` (the second argument prints one line per tree).
- **`perf.ts`** reports per-frame and build cost.
- **`refs/`** holds the literature abstracts as fetched through NCBI E-utilities, plus a Medrano-Gracia 2017 full-text excerpt. They back `docs/realism/facts/S3.md`.

All millimetre values from the library assume a 6 F catheter. Multiply them by 0.83 if the catheter was 5 F.
