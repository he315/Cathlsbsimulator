# pci-bench-stent-platforms-sizing: model parameters

Five generic stent platforms (`src/simulation/bench/platforms.ts`), sizing and positioning on the bench (`src/simulation/pciBench.ts`), the stent panel's animation (`src/ui/bench/StentPanel.tsx`) and the platform presets. Platforms are named A to E; no product names.

Sourced values carry their location in the code and are not repeated as model parameters: the size facts (eq-balloons-stents-cart-stent-build, 'Size facts to know before choosing a platform', Brilakis 10.1, 10.2, 22.3: the smallest stent 2.0 mm on one platform; the largest 5.0 mm, expandable to 5.75 mm; another platform's 4.0 mm stent also to 5.75 mm; a third platform's 3.5 and 4.0 mm stents to 5.5 mm; the 3.5-4.0 mm band's limits about 4.5-5.5 mm); the three structural designs (Oxford, Intracoronary stents); the markers (cp-ostial-stent, Brilakis 15.1.10: the stent just inside the markers in most stents, at the centre of each marker on at least one platform); strong radial strength at aorto-coronary lesions (cp-ostial-troubleshoot, Brilakis 15.1.10, Fig. 15.10); the aorto-ostial target 1-2 mm into the aorta (`OSTIAL_PROTRUSION_MM`) and the short flaring balloon (`FLARE_HALF_MM` 4 mm, half of 6-8 mm; cp-ostial-stent); a vessel under 2.5 mm is small (`SMALL_VESSEL_REF_MM`, Brilakis 22.3). Platform A's sizes, chart and limits are the catalogue drug-eluting stent (equipment.ts, see pci-equipment.md). Each platform lists its own model-parameter fields in `modelParam`.

## Platforms (platforms.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_PLATFORM_STRUT_MM` | src/simulation/bench/platforms.ts | A: the catalogue's `THIN_STRUT_DES.strutMm` (inherited); B 0.06; C 0.074; D 0.09; E 0.12 | mm | MODEL PARAMETERS except A's; E inside the 50-140 µm span of the module's ISAR-STEREO-2 figures |
| `MP_RADIAL_STRENGTH_RECOIL_FACTOR` | src/simulation/bench/platforms.ts | standard 1, strong 0.2 | share of a lesion's elastic recoil let through | MODEL PARAMETER |
| Band limits with `source: null` | src/simulation/bench/platforms.ts | B: 2.0-2.25 mm to 2.75, 2.5-3.0 to 3.75, 3.5-4.0 to 4.75; C: 2.25-2.75 to 3.5, 3.0-3.5 to 4.75; D: 2.25-3.0 to 3.75; E: 2.5-3.0 to 3.5 | mm (labelled post-dilatation limit) | MODEL PARAMETERS; B's 4.75 lies inside the module's 4.5-5.5 mm for the 3.5-4.0 mm band |
| Platform lengths | src/simulation/bench/platforms.ts | B 8, 12, 15, 18, 22, 26, 30, 38; C 8, 12, 15, 18, 23, 28, 33, 38; D 8, 12, 16, 20, 24, 28, 32, 38; E 9, 13, 16, 18, 23, 28, 33 | mm | MODEL PARAMETERS |
| Cells and E's design | src/simulation/bench/platforms.ts | A-D open cell; E closed cell, strut width 0.12 mm, 6 connectors per gap, 8 crowns up to 3.0 mm and 10 above; B strut width 0.08 mm | n/a; mm | MODEL PARAMETERS (the open and closed designs are Oxford's; which platform has which is a model choice) |
| Platform C's centred markers | src/simulation/bench/platforms.ts | the stent ends at the centre of each marker | n/a | Model choice of which platform carries the sourced centred-marker design |

## Sizing and deployment (pciBench.ts, StentPanel.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_DISSECTION_EXTENSION_MM` | src/simulation/pciBench.ts | 5 | mm beyond the balloon's distal end | MODEL PARAMETER: how far a dissection from an oversized balloon runs |
| `MP_BALLOON_SHOULDER_MM` | src/simulation/pciBench.ts | 2 | mm beyond the stent end | MODEL PARAMETER: the stent balloon's shoulder, which dilates an uncovered ostium on deployment |
| `MP_RECOIL_SIGNIFICANT_MM` | src/simulation/pciBench.ts | 0.25 | mm of diameter lost after deployment | MODEL PARAMETER: above this the recoil counts |
| `MP_OCT_CLEAR_MAX_LUMEN_MM` | src/simulation/pciBench.ts | 4.0 | mm | MODEL PARAMETER: an OCT flush clears the lumen incompletely where it is larger. The module states that OCT filling is hard in a big artery and IVUS is preferred in large and ectatic vessels (cp-other-complex-vessel-size, Brilakis 22.3) but gives no diameter |
| `MP_STENT_SWING_MM` | src/simulation/bench/platforms.ts | taper 2, ostial 3 | mm with each beat | MODEL PARAMETER: the stent swing of the moving presets |
| `MP_OSTIAL_RECOIL_FRACTION` | src/simulation/bench/platforms.ts | 0.4 | share of the acute gain lost | MODEL PARAMETER: the recoil preset's ostium |
| `MP_BEAT_S` | src/ui/bench/StentPanel.tsx | 0.8 | s | MODEL PARAMETER: cardiac cycle of the swing animation (a resting rate of about 75 per minute) |

## Presets (platforms.ts `PLATFORM_LESIONS`)

All dimensions, plaque burdens, calcium, motion and recoil values are MODEL PARAMETERS of the teaching lesions unless a comment names the module text they come from. The EEM is the reference lumen over √0.7 (`eemOf`, a background plaque burden of 0.3).

| Preset | File | Values | Rests on |
|---|---|---|---|
| `taper-lad` | src/simulation/bench/platforms.ts | segment 50 mm; lumen 3.5 mm proximal to 2.75 mm distal; lesion 12-36 mm; plaque burden 0.78 | pm-prep-and-stent-deploy's bench task: a LAD tapering from 3.5 to 2.75 mm over a 24 mm lesion predilated over 28 mm |
| `lm-lad-crossover` | src/simulation/bench/platforms.ts | segment 40 mm; lumen 4.8 mm proximal, EEM 3.95 mm distal; lesion 5-18 mm; plaque burden 0.72 | cp-left-main-technique and the eq-balloons-stents-cart-stent-build check: a 4.8 mm distal left main into a 3.5 mm proximal LAD |
| `small-distal-225` | src/simulation/bench/platforms.ts | segment 30 mm; lumen 2.5 to 2.25 mm; lesion 11-19 mm; plaque burden 0.82 | cp-other-complex-vessel-size: under 2.5 mm is small |
| `ectatic-rca` | src/simulation/bench/platforms.ts | segment 50 mm; lumen 4.5 to 3.5 mm; lesion 20-30 mm; plaque burden 0.8 | cp-other-complex-vessel-size's check: a 4.5 mm ectatic proximal RCA tapering to 3.5 mm |
| `ostial-rca-short`, `ostial-overhang` | src/simulation/bench/platforms.ts | segment 40 mm; lumen 4.0 to 3.6 mm; lesion from 5 mm (ostial-rca-short to 12 mm, plaque burden 0.74) | Model choice: aorto-ostial RCA presets (cp-ostial-stent) |
