# Brief: pm-prep-and-stent — Lesion preparation and stenting

- Track: `pci-manual`  ·  Stage: 3  ·  File: `src/content/manual/pci-manual/12-prep-and-stent.ts`
- Write also: `docs/curriculum/evidence/pm-prep-and-stent.md` and `docs/curriculum/lab-requests/pm-prep-and-stent.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 1 (PDF pages 29–36): 1.9 'Lesion preparation' (p.35), 1.10 'Stenting' (p.35)
- Brilakis chapter 9 (PDF pages 167–184): 9.1 'Goal' (p.167), 9.2 'When is lesion preparation needed?' (p.167), 9.3 'Confirm successful wiring' (p.168), 9.7 'Balloon angioplasty' (p.168), 9.9 'Balloon expansion' (p.184), 9.10 'Stenting' (p.184)
- Brilakis chapter 10 (PDF pages 185–194): 10.1 'When to stent?' (p.185), 10.2 'How to stent' (p.185)
- Brilakis chapter 23 (PDF pages 407–422): 23.1 'Balloon uncrossable lesions' (p.407)
- Oxford chapter 1 (PDF pages 22–45): 'Fluoroscopy and acquisition' (p.33)
- Oxford chapter 8 (PDF pages 204–273): 'Angioplasty balloons' (p.217); 'Drug-eluting stents' (p.224); 'Intracoronary stents' (p.219); 'Specific techniques in complex PCI' (p.246); 'The PCI procedure' (p.229)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `pci-lesion-prep` — Lesion preparation: when it is needed and how  (P1, coverage now: partial)
- Book locations from the map: Brilakis 1.9, 9.1, 9.2, 9.3; Oxford 8: The PCI procedure
- In CathMaster now: pci-procedure: Wiring and lesion preparation; Lab: PCI in the cath lab; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep as is.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `iCxB2VZ89mM` [Brilakis] 9.1 Manual of PCI - Lesion preparation: when and how
  - `Ta1MbCgzgCg` [Brilakis] Case 128: Manual of CTO Interventions - Importance of vessel preparation

### `pci-balloon-angioplasty` — Balloon angioplasty: sizing, inflation and the indeflator  (P1, coverage now: partial)
- Book locations from the map: Brilakis 9.7, 9.9; Oxford 8: Angioplasty balloons
- In CathMaster now: pci-balloons-stents: Balloon catheters: design, compliance and pressure; Lab: PCI in the cath lab; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add balloon preparation and inflation-duration steps to the PCI lab (the engine has an indeflator module).
- Videos (2; choose the most relevant 1–4 per lesson):
  - `icI8Zn2FFvQ` [Brilakis] 9.2 Manual of PCI - How to perform balloon angioplasty
  - `5GjTX2J80Fw` [Hanna] Sizing of various balloons, stent, DCB by angio and by IVUS/OCT

### `pci-device-delivery` — Delivering balloons and stents  (P1, coverage now: partial)
- Book locations from the map: Brilakis 9.10; Oxford 8: The PCI procedure
- In CathMaster now: pci-procedure: Positioning and deploying the stent; pci-case-lad-support; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Model failed delivery in the calcified and tortuous scenarios so the learner has to escalate support.
- Videos (10; choose the most relevant 1–4 per lesson):
  - `wFyDa1UnwH4` [Brilakis] 9.3 Manual of PCI - How to deliver balloons and stents
  - `RcTu0qOb3T0` [Brilakis] Case 144: PCI Manual - Don't Push!!
  - `3elfcamwu00` [Brilakis] Case 106: PCI Manual - Tortuosity troubleshooting
  - `qpJnSzpR1kA` [Brilakis] Case 53: PCI Manual - Difficulties reaching the coronary lesion
  - `KRqZDDQ6E3g` [Brilakis] Case 34: PCI Manual: Delivery in tortuosity
  - `7YXTePUN8A8` [Brilakis] Case 7: PCI Manual - Wiggle wire to the rescue
  - `Z4-lZ0GmGbY` [Brilakis] Case 1: PCI Manual - Guide extension for visualization and equipment delivery
  - `8punl4-g-i8` [Brilakis] Case 267: Manual of CTO PCI - Just marker
  - `o680G13d3QQ` [Brilakis] How to deliver balloon and stents during complex coronary interventions
  - `Ri0-OiOTN7Q` [Hanna] PCI calcium modification: Updated approach, Device deliverability

### `pci-support-escalation` — Escalating support: deep intubation, buddy wire and anchor balloon  (P1, coverage now: text-only)
- Book locations from the map: Brilakis 9.10, 23.1; Oxford 8: Specific techniques in complex PCI
- In CathMaster now: pci-guides: When support fails: escalation techniques; pci-wires: Tortuosity, buddy wires and wire safety; pci-case-lad-support; Lab: Case studies  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Turn pci-case-lad-support into a PCI-lab scenario where the stent will not advance, with buddy wire and side-branch anchor available.
- Videos (5; choose the most relevant 1–4 per lesson):
  - `03sn2Vsphcc` [Brilakis] Case 179: Manual of PCI - Radial guide support troubleshooting
  - `BYokfubv0f0` [Brilakis] Case 121: PCI Manual - Challenges with RCA PCI
  - `qpJnSzpR1kA` [Brilakis] Case 53: PCI Manual - Difficulties reaching the coronary lesion
  - `SdRSb8Oh-0Q` [Brilakis] Case 37: PCI Manual - Challenges with engagement and support
  - `o680G13d3QQ` [Brilakis] How to deliver balloon and stents during complex coronary interventions

### `pci-when-to-stent` — When to stent, and drug-coated balloon or balloon-only strategies  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 10.1; Oxford 8: Intracoronary stents
- In CathMaster now: cx-special: Small vessels, drug-coated balloons and long diffuse disease  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a drug-coated balloon device to the PCI lab, with a step where the learner judges whether the result after predilatation is acceptable.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `84sVvlUR3Ns` [Brilakis] Case 220: Manual of PCI - DCB troubles
  - `RNxl_wf9B2Q` [Brilakis] Case 89: PCI Manual - Peripheral DCB for coronary ISR
  - `6I_7sjnvZpw` [Brilakis] Case 304: Manual of CTO PCI -  IVL + DCB

### `pci-stent-deployment` — Stent sizing, positioning and deployment  (P1, coverage now: partial)
- Book locations from the map: Brilakis 1.10, 10.2; Oxford 8: Intracoronary stents; 8: Drug-eluting stents
- In CathMaster now: pci-balloons-stents: Sizing and deploying stents; pci-procedure: Positioning and deploying the stent; Lab: PCI in the cath lab; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add feedback on landmarks and geographic miss.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `rInrpac5lwI` [Brilakis] 10.1 Manual of PCI - How to perform stenting
  - `ZFyi-1faRSI` [Brilakis] Case 169: Manual of PCI - The 3.5 mm stent
  - `5GjTX2J80Fw` [Hanna] Sizing of various balloons, stent, DCB by angio and by IVUS/OCT

### `pci-postdilatation-result` — Post-dilatation, enhanced stent visualisation and judging the final result  (P1, coverage now: partial)
- Book locations from the map: Brilakis 10.2; Oxford 8: The PCI procedure; 1: Fluoroscopy and acquisition
- In CathMaster now: pci-procedure: Optimisation and judging the result; Lab: PCI in the cath lab; Lab: PCI bench (IVUS/OCT)  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add an enhanced stent visualisation toggle to the PCI lab and a final-result checklist step.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `rInrpac5lwI` [Brilakis] 10.1 Manual of PCI - How to perform stenting
  - `cyikf9s8Ph8` [Brilakis] Case 117: PCI Manual - Refractory stent underexpansion
  - `TsqRwqZju4s` [Brilakis] Case 67 - PCI Manual - How to treat under-expanded stents

