# Real angiogram library: sources, licences and changes

The "Real angiograms" section plays de-identified cine runs from three openly
licensed research datasets. The images are not part of the application source; they
are built locally by the scripts in `scripts/angio_library/` and served by the
development server from `datasets/library/`. They are for education only.

## CADICA

- Jiménez-Partinen A, Molina-Cabello MA, Thurnhofer-Hemsi K, et al. CADICA: a new
  dataset for coronary artery disease detection by using invasive coronary
  angiography. Expert Systems 2024;41(12):e13708.
- Data: https://doi.org/10.17632/p9bpx9ctcv.5 (Mendeley Data, version 5)
- Licence: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- Changes: PNG frames re-encoded as JPEG (quality 72); lesion labels reorganised into
  JSON. 42 patients, 382 runs.
- Acquisition: Siemens Artis Zee, 10 frames/s (as described by the dataset).

## CoronaryDominance

- Kruzhilov I, Mazanov G, Ponomarchuk A, Zubkova G, Shadrin A, Utegenov R, Blinov P,
  Bessonov I. CoronaryDominance: angiogram dataset for coronary dominance
  classification. Scientific Data 2025.
- Paper: https://doi.org/10.1038/s41597-025-04676-8. Data: Hugging Face
  BearSubj13/CoronaryDominance.
- Licence: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Parts used: the domain-shift dataset (81 studies, 426 runs) and, from the main
  dataset, the occlusion, artefact and challenging-case studies (196 studies,
  1,199 runs). The main "normal", "bad quality" and "indefinite type" studies and the
  real-distribution dataset were not downloaded or converted, for disk space.
- Changes: frames converted from floating point to 8-bit and re-encoded as JPEG
  (quality 72); runs truncated to 120 frames. Runs whose frames could not be read
  were skipped (67 files in the main-dataset subsets).
- Labels used: dominance (study level), "occlusion in RCA" on right runs,
  "collaterals in LCA" on left runs, artefact and uncertainty tags, and the C-arm
  primary and secondary angles from the DICOM header.
- Acquisition: Philips Allura Clarity and Azurion, 15 frames/s.

## AngioCAD

- Hosseini MS, Naghsh-Nilchi AR, Safayani M, Sadeghi M, Shirvani E, Danesh M,
  Miramirkhani A. AngioCAD: a publicly available X-ray angiography dataset for
  coronary artery stenosis and CAD detection. Zenodo 2025.
- Data: https://doi.org/10.5281/zenodo.15826856
- Licence: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- Changes: PNG frames re-encoded as JPEG (quality 72), resized to at most 512 pixels,
  first 90 frames of each series. Clinical data and segment stenosis grades are taken
  from AngioCAD_Features.xlsx and AngioCAD_Labels.xlsx. The dataset does not state
  the acquisition frame rate; runs play at 15 frames/s. 412 patients, 2,711 runs (1,873 left,
  815 right; 23 series could not be assigned to an artery from the series columns).

## Screening

Each dataset is published as anonymised. Before use, random samples of first frames
(the frame most likely to carry overlays) were reviewed on contact sheets for burned-in
text, names, dates or identifiers. None was found in the samples reviewed. Frames
show anatomy and devices only (catheters, wires, sternal wires, pacing leads,
prosthetic valves).

## Verification of downloads

CADICA was checked against its published SHA-256 checksum. The AngioCAD volumes
were checked against the MD5 checksums published on the Zenodo record. The
CoronaryDominance archives were checked against the file sizes published on Hugging
Face.

## How the reading drills use the labels

The drills in the "Real angiograms" section score answers only against the labels the
datasets publish. Nothing is relabelled; where labels are grouped or a tolerance is
applied, the rule is stated here and in the drill's feedback.

- **CADICA patient cases.** The patient-level "most severe stenosis" uses the dataset's
  own three classes (<20%, 20-50%, >70%). The index spells them inconsistently ("> 70%",
  ">70%", "< 20%"); spellings are normalised, so all 42 patients can be scored.
- **CADICA run grading.** The seven lesion classes are grouped into four visual
  categories (<50%, 50-69%, 70-89%, 90-100%), matching the categories in which Sen et al.
  (Cardiovasc J Afr 2018;29(5):278-282, https://doi.org/10.5830/CVJA-2018-024) reported
  agreement between three operators. CADICA's 100% class joins the top category.
- **CADICA lesion boxes (find the lesion).** A click counts as a hit inside any expert box
  on the displayed keyframe, enlarged by 10% of the box width and height on each side
  (a project tolerance). The learner's grade is compared with the box that was hit, not
  with the worst lesion on the frame. Negative frames come from runs the experts labelled
  with no lesion.
- **CoronaryDominance projections.** The C-arm angles from the DICOM header are named
  with the app's standard-view boundaries (15 degrees from AP, 15 degrees cranial or caudal,
  LAO 70 degrees). Runs within 5 degrees of a boundary (564 of 1,625 angled runs, 34.7%)
  accept either neighbouring name, or can be left out.
- **CoronaryDominance next-view planning.** The trailing number of each run id is taken as
  the acquisition order of the study. The drill compares a choice with the operator's
  actual next run; it is one operator's practice, not a reference standard.
- **Dominance, occlusion and collateral labels** are used as published (study-level
  dominance; "occlusion in RCA" on right runs; "collaterals in LCA" on left runs).
  All tagged runs are in the main set, so occlusion and collateral drills use main-set
  runs only: negatives carry an explicit "no" tag, come from studies with no run tagged
  for that finding, and are paired with positives that share the same artefact tag. Runs
  flagged uncertain are left out.

Sets are stratified (equal numbers per reference class) so that the datasets' class
imbalance cannot be exploited by guessing. Next-view planning is the exception: its
reference is one operator's practice, and its report says so. Results and spaced-repetition records stay in
the browser.

The ARCADE segmentation dataset (https://doi.org/10.5281/zenodo.10390295) is not used:
a segment-naming drill built on it waits for an approved download and confirmation of its
licence.
