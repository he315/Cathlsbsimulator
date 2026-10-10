#!/bin/sh
# Re-runs every measurement used in the image-forensics comparison (Python stdlib only).
# Real data: lossless Azurion npz (datasets/extracted/CoronaryDominance/...), lossless CADICA PNG
# (datasets/extracted/CADICA/...), JPEG library (datasets/library/...). Renderer frames: PNGs captured
# from the built app (dist/) into captures/ by serve.py + a canvas-capture snippet (see captures/).
set -e
cd /private/tmp/claude-502/cathmaster-research

# (1) noise: temporal-difference sigma by grey level, ACF lags 1-4, NPS, rho (recursive filtering)
python3 noise2.py npz cd-01031-LCA-6 cd-01031-LCA-8 cd-01031-LCA-4 cd-01031-RCA-10 cd-01029-LCA-7 cd-01033-LCA-3 \
  cd-01034-LCA-4 cd-01036-RCA-6 cd-01037-LCA-2 cd-01040-LCA-3 cd-01045-LCA-3 cd-01032-RCA-5 cd-01048-LCA-5
python3 noise2.py cadica p10_v1 p1_v1 p2_v1 p5_v1 p13_v1 p20_v2 p25_v5 p31_v5 p36_v3 p40_v1
L="/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/datasets/library"
python3 noise2.py jpg "$L/dominance/cd-01031-LCA-6" "$L/dominance-main/cdm-00002-LCA-2" "$L/dominance-main/cdm-00003-LCA-4" \
  "$L/dominance-main/cdm-00004-LCA-3" "$L/dominance-main/cdm-00002-RCA-6" "$L/dominance-main/cdm-00005-LCA-1"
python3 noise2.py cap lad_raocau lad_apcra lad_laocra rca_lao rca_rao
python3 noisebin.py npz cd-01031-LCA-6 cd-01031-LCA-4 cd-01033-LCA-3 cd-01036-RCA-6
python3 noisebin.py cap lad_raocau lad_apcra
python3 settle.py $(cut -d' ' -f1-20 timing_runs.txt)          # first-frame exposure settling

# (2) edges: large borders (heart border, diaphragm, filter seam) real vs renderer
python3 edge2.py jobs_edge2.json
python3 edge2.py jobs_edge3.json

# (3)/(4) vessel, catheter, small-branch, bone-line profiles
python3 vessel.py jobs_vessel1.json
python3 vessel.py jobs_small.json
python3 vessel.py jobs_bone.json
python3 vessel.py jobs_rib.json
python3 vessel.py jobs_render.json
python3 vessel.py jobs_render2.json
python3 vessel.py jobs_rsmall.json
python3 cath.py jobs_cath.json

# (5) background texture spectra (pre-contrast frames)
python3 texture.py npz:cd-01031-LCA-6:2 npz:cd-01031-LCA-8:2 npz:cd-01031-LCA-4:2 npz:cd-01031-RCA-10:2 \
  npz:cd-01029-LCA-7:2 npz:cd-01033-LCA-3:2 npz:cd-01040-LCA-3:2 npz:cd-01032-RCA-5:2 cadica:p10_v1:1 cadica:p2_v1:1 cadica:p31_v5:1
python3 texture.py png:$PWD/tmp/r_lad_apcra_2.png:0 png:$PWD/tmp/r_lad_laocra_2.png:0 png:$PWD/tmp/r_rca_rao_2.png:0

# (6) cardiac motion (cross-section tracking of vessels and catheter)
python3 xtrack.py jobs_x1.json; python3 xtrack.py jobs_x2.json; python3 xtrack.py jobs_x3.json
python3 xtrack.py jobs_x5.json; python3 xtrack.py jobs_x6.json; python3 xtrack.py jobs_xc_real.json
python3 xtrack.py jobs_xr.json; python3 xtrack.py jobs_xr2.json; python3 xtrack.py jobs_xc.json

# (7) contrast timing (49 random clean Azurion runs)
python3 timing.py npz $(cat timing_runs.txt)
python3 ridge.py npz; python3 ridge.py cap lad_raocau lad_apcra lad_laocra rca_lao rca_rao

# (8) field shape, borders, vignetting, straight edges (80 runs per source)
for k in azurion cadica allura angiocad; do python3 field.py $k 80; done
