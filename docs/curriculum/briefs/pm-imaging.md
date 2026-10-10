# Brief: pm-imaging — Intravascular imaging

- Track: `pci-manual`  ·  Stage: 3  ·  File: `src/content/manual/pci-manual/15-imaging.ts`
- Write also: `docs/curriculum/evidence/pm-imaging.md` and `docs/curriculum/lab-requests/pm-imaging.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 1 (PDF pages 29–36): 1.13 'Imaging' (p.35)
- Brilakis chapter 10 (PDF pages 185–194): 10.2 'How to stent' (p.185)
- Brilakis chapter 13 (PDF pages 231–248): 13.1 'When to do coronary intravascular imaging?' (p.231), 13.2 'Imaging modality selection' (p.232), 13.3 'OCT step-by-step' (p.234), 13.4 'IVUS step-by-step' (p.243)
- Brilakis chapter 19 (PDF pages 355–376): whole chapter
- Brilakis chapter 20 (PDF pages 377–388): whole chapter
- Brilakis chapter 21 (PDF pages 389–398): 21.1 'Planning' (p.389)
- Brilakis chapter 30 (PDF pages 513–600): whole chapter
- Oxford chapter 8 (PDF pages 204–273): 'IVUS or OCT?' (p.238); 'Intravascular ultrasound' (p.231); 'Optical coherence tomography' (p.232)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `img-indications-modality` — When to use intravascular imaging, and IVUS or OCT  (P1, coverage now: partial)
- Book locations from the map: Brilakis 13.1, 13.2, 1.13, 30; Oxford 8: IVUS or OCT?
- In CathMaster now: phy-oct: Stent optimisation, IVUS versus OCT, and the evidence; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add bench scenarios where the choice of modality changes the outcome. The learner commits to IVUS or OCT before the pullback.
- Videos (5; choose the most relevant 1–4 per lesson):
  - `slLO5Xd4FM4` [Brilakis] 13.1 Manual of PCI - Intravascular imaging: when and which modality?
  - `R7LIfbAwMcQ` [Brilakis] Advanced Imaging - Dallas CVI 2016
  - `DkJ8P-oQY5s` [Brilakis] Coronary Imaging and Physiology Update - Dallas CVI 2016
  - `TTC1aoFCBMo` [Brilakis] Intravascular Imaging and Physiology: Update 2015 - Dallas CVI 2015
  - `e3UfpXqp0uE` [Brilakis] Coronary Near-Infrared Spectroscopy Review - part 1

### `img-ivus` — IVUS step by step: acquisition and image anatomy  (P1, coverage now: partial)
- Book locations from the map: Brilakis 13.4; Oxford 8: Intravascular ultrasound
- In CathMaster now: phy-ivus: IVUS physics, acquisition and image anatomy; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Expose the IVUS catheter that the engine already defines in the PCI lab, so the pullback is run on the X-ray vessel and then read on the bench.
- Videos (7; choose the most relevant 1–4 per lesson):
  - `CLDtpHpXzzo` [Brilakis] 13.3 Manual of PCI - IVUS step-by-step
  - `wcLcxt3ojUU` [Brilakis] Case 139: PCI Manual - IVUS for culprit vessel identification in NSTEMI
  - `4lthDgjfR-w` [Brilakis] Case 34: Manual of CTO Interventions - IVUS for proximal cap ambiguity
  - `xXoedns1SG0` [Brilakis] Case 35: Manual of CTO Interventions - IVUS facilitated ADR
  - `lLxCaaUAyVU` [Brilakis] Coronary Near-Infrared Spectroscopy Review - part 2
  - `e3UfpXqp0uE` [Brilakis] Coronary Near-Infrared Spectroscopy Review - part 1
  - `9mDgPltOm7Q` [Hanna] Intravascular ultrasound (IVUS) - Elias Hanna, Univ of Iowa

### `img-oct` — OCT step by step: flush, pullback and artefacts  (P2, coverage now: partial)
- Book locations from the map: Brilakis 13.3; Oxford 8: Optical coherence tomography
- In CathMaster now: phy-oct: OCT physics, acquisition and artefacts; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add steps for flush quality and contrast use to the OCT pullback, with an artefact the learner must recognise.
- Videos (6; choose the most relevant 1–4 per lesson):
  - `hBNmLRfw44o` [Brilakis] 13.2 Manual of PCI - OCT step-by-step
  - `VRqERXKp-rU` [Brilakis] Case 87: PCI Manual - MRI + OCT to find NSTEMI culprit
  - `D2QhNbShgj4` [Brilakis] Case 66: PCI Manual - Thrombus, filter, OCT
  - `E1jrJqvJNPM` [Brilakis] Case 6: Manual of CTO Interventions - OCT for thrombus and dissection
  - `mYP2z4159Fk` [Hanna] Types of plaque disruption by OCT and value of OCT in MINOCA- Elias Hanna, Univ of Iowa
  - `dFlnQ6aD0ks` [Hanna] OCT (Optical Coherence Tomography)- Elias Hanna, Univ of Iowa

### `img-pre-pci-planning` — Planning PCI with imaging: vessel sizing, landing zones and calcium  (P1, coverage now: partial)
- Book locations from the map: Brilakis 13.1, 13.4, 19; Oxford 8: Intravascular ultrasound
- In CathMaster now: phy-ivus: Planning PCI with IVUS; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep the bench. Add check steps that compare the learner's chosen sizes and landing zones with the measurements on the frames.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `5GjTX2J80Fw` [Hanna] Sizing of various balloons, stent, DCB by angio and by IVUS/OCT
  - `so9MltihMSs` [Hanna] IVUS/OCT stent guidance, pre- and post-stenting

### `img-stent-optimisation` — IVUS- and OCT-guided stent optimisation: expansion, apposition and edge dissection  (P1, coverage now: partial)
- Book locations from the map: Brilakis 13.3, 13.4, 10.2; Oxford 8: Intravascular ultrasound; 8: Optical coherence tomography
- In CathMaster now: phy-ivus: Post-PCI optimisation and left main IVUS; phy-oct: Stent optimisation, IVUS versus OCT, and the evidence; phy-case-oct-underexpansion; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Link bench optimisation to stents deployed in the PCI lab, so the same stent is imaged, post-dilated and imaged again.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `TsqRwqZju4s` [Brilakis] Case 67 - PCI Manual - How to treat under-expanded stents
  - `so9MltihMSs` [Hanna] IVUS/OCT stent guidance, pre- and post-stenting

### `img-acs-culprit` — Imaging the ACS culprit: rupture, erosion and calcified nodule  (P3, coverage now: partial)
- Book locations from the map: Brilakis 20; Oxford 8: Optical coherence tomography
- In CathMaster now: phy-oct: Reading OCT: plaque, thrombus and the culprit; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add erosion and calcified-nodule scenarios beside the bench's existing lipid-rich culprit.
- Videos (6; choose the most relevant 1–4 per lesson):
  - `wcLcxt3ojUU` [Brilakis] Case 139: PCI Manual - IVUS for culprit vessel identification in NSTEMI
  - `VRqERXKp-rU` [Brilakis] Case 87: PCI Manual - MRI + OCT to find NSTEMI culprit
  - `YsddPIhti-c` [Brilakis] Case 9: PCI Manual - MINOCA?
  - `lLxCaaUAyVU` [Brilakis] Coronary Near-Infrared Spectroscopy Review - part 2
  - `xSXwJGTdXA4` [Hanna] MI with plaque disruption on IVUS/OCT but stenosis less than 50%: should you stent?
  - `mYP2z4159Fk` [Hanna] Types of plaque disruption by OCT and value of OCT in MINOCA- Elias Hanna, Univ of Iowa

### `img-coregistration` — Co-registering imaging and physiology with the angiogram  (P3, coverage now: text-only)
- Book locations from the map: Brilakis 13.1; Oxford —
- In CathMaster now: physiology-imaging track (single mention)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Show the current bench frame position on the PCI-lab angiogram once the two labs share a vessel.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `78bi9BATCLQ` [Brilakis] Case 144: Manual of CTO PCI - CT coregistration for clarifying ambiguity

### `pi-ct-planning` — Coronary CT angiography for PCI and CTO planning: cap, course, calcium, length and co-registration  (P2, coverage now: missing)
- Book locations from the map: Brilakis 21.1; Oxford —
- In CathMaster now: nothing  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a planning lesson that shows a schematic CT reconstruction beside the angiogram and asks the learner to predict cap location, course and calcium before choosing a crossing strategy.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `u1Ysqluo_ZU` [Brilakis] Case 279: Manual of CTO PCI - The benefits of CCTA
  - `r_sMoTLkbqM` [Brilakis] Case 239: Manual of CTO PCI - CT to the rescue

