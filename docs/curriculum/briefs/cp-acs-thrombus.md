# Brief: cp-acs-thrombus — Acute coronary syndromes and thrombus

- Track: `complex-pci`  ·  Stage: 3  ·  File: `src/content/manual/complex-pci/07-acs-thrombus.ts`
- Write also: `docs/curriculum/evidence/cp-acs-thrombus.md` and `docs/curriculum/lab-requests/cp-acs-thrombus.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 2 (PDF pages 37–40): 2.2 'Electrocardiogram' (p.37)
- Brilakis chapter 7 (PDF pages 137–148): 7.2 'Acute coronary syndromes' (p.143), 7.3 'PCI timing' (p.145)
- Brilakis chapter 9 (PDF pages 167–184): 9.4 'Large thrombus' (p.168)
- Brilakis chapter 20 (PDF pages 377–388): whole chapter
- Brilakis chapter 30 (PDF pages 513–600): whole chapter
- Oxford chapter 5 (PDF pages 128–149): 'Myocardial infarction with non-obstructed coronary arteries' (search the chapter)
- Oxford chapter 8 (PDF pages 204–273): 'Aspiration catheters' (p.273); 'Facilitated PCI versus a pharmaco-invasive strategy' (search the chapter); 'PCI in acute myocardial infarction' (p.247); 'Primary PCI' (p.249)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `fnd-ecg-stemi` — The ECG for the cath lab: STEMI criteria, equivalents and territories  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.2, 7.2; Oxford 8: PCI in acute myocardial infarction
- In CathMaster now: fnd-ecg (all lessons); fnd-case-inferior-rv; fnd-case-lbbb; Lab: Case studies  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a 12-lead reading drill (the engine has ecg12.ts) where the learner names the territory and predicted culprit. Follow it with a matching real CADICA run, where the library has one, in which they find the occlusion.
- Videos (6; choose the most relevant 1–4 per lesson):
  - `pByFxIoBhvA` [Brilakis] Case 208: Manual of PCI - A different cause of ST elevation
  - `FMQ1vAHK2Zg` [Hanna] Occlusion MI (OMI): ECG patterns and cases
  - `YpYRizqz-yg` [Hanna] STEMI part 3 +Approach to all MIs and troponin grades + subtle STEMI cases (OMI) + LV thrombus
  - `imkOA61BPVk` [Hanna] ST elevation on ECG, part 2: case studies
  - `wtBIG8a8Wbg` [Hanna] ST elevation on ECG, part 1: Differential diagnosis and case studies- STEMI mimickers, subtle STEMI
  - `Wla0XiqtfHc` [Hanna] New LBBB: is it STEMI? Updated STEMI ECG criteria in LBBB (beyond Sgarbossa). Elias Hanna

### `acs-reperfusion-strategy` — Reperfusion strategy, networks, the pharmaco-invasive approach and rescue PCI  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 7.3; Oxford 8: Facilitated PCI versus a pharmaco-invasive strategy
- In CathMaster now: mcs-stemi: Reperfusion strategy, networks and time targets; fnd-pathways: The ACS spectrum and the STEMI pathway  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a branching case with transfer times that requires a reperfusion decision.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `2aLwE87ZvDY` [Brilakis] Advances in management of STEMI - Dallas CVI 2015
  - `ioomfImDIAE` [Hanna] STEMI part 2- Questions and case scenarios- Elias Hanna
  - `zbu1y_AEQrY` [Hanna] STEMI part 1: focus on reperfusion- Elias Hanna

### `acs-primary-pci` — Primary PCI in the lab  (P1, coverage now: partial)
- Book locations from the map: Brilakis 20; Oxford 8: Primary PCI; 8: PCI in acute myocardial infarction
- In CathMaster now: mcs-stemi: Primary PCI in the lab; mcs-case-anterior-stemi-shock; Lab: PCI in the cath lab; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Run STEMI patients from the Full procedure straight into the PCI lab, timed against the time targets taught in mcs-stemi.
- Videos (19; choose the most relevant 1–4 per lesson):
  - `mzIP07Vc-Og` [Brilakis] 20.1 PCI in ACS patients: Manual of PCI
  - `hKR1Hwrnaco` [Brilakis] Case 223: Manual of PCI -  CTO PCI for STEMI
  - `DEMi3416KLA` [Brilakis] Case 187: Manual of PCI - STEMI at 3 am
  - `Qt9gF1uh1AE` [Brilakis] Case 181: Manual of PCI - Atherectomy for STEMI
  - `NeafmDqbT6M` [Brilakis] Case 174: Manual of PCI - Challenging wiring in STEMI
  - `Dg-PqPQPhcA` [Brilakis] Case 153: PCI Manual - STEMI, kinked guide, VF
  - `OBAq0wVkkiY` [Brilakis] Case 130:  PCI Manual - ST elevation resolution
  - `E2mclAG96E8` [Brilakis] Case 122: PCI Manual - AMI after mitral valve replacement
  - `NkXfgmUCW-A` [Brilakis] Case 118: PCI Manual - STEMI culprit?
  - `Q6gLRyyF0jI` [Brilakis] Case 95: PCI Manual - STEMI and unable to engage
  - `qOlOdLF28Gc` [Brilakis] Case 65: PCI Manual - Arteria lusoria and STEMI
  - `C-kTk1hv1Nc` [Brilakis] Case 54: PCI Manual - Knuckle wiring for STEMI
  - `4ntheQqS_Lc` [Brilakis] Case 44: PCI Manual - Wiring in STEMI
  - `tXtTiivM1Kc` [Brilakis] Case 43: PCI Manual - STEMI in a patient with essential thrombocytosis
  - `x9bB5Hab9A0` [Brilakis] Case 27: PCI Manual: STEMI and shock
  - `laYXNLAERKo` [Brilakis] Case 4: PCI Manual - STEMI in anomalous RCA
  - `2aLwE87ZvDY` [Brilakis] Advances in management of STEMI - Dallas CVI 2015
  - `Z_6I_PkGxzo` [Hanna] STEMI angiograms: angiographic and PCI tips
  - `k_WRU_1jU60` [Hanna] STEMI primary PCI: technical tips, including for STEMI with shock- Elias Hanna

### `cx-thrombus` — Thrombus-rich lesions: anticoagulation, GP IIb/IIIa, and direct or deferred stenting  (P1, coverage now: partial)
- Book locations from the map: Brilakis 20, 9.4; Oxford 8: PCI in acute myocardial infarction
- In CathMaster now: cx-grafts-thrombus: Thrombus-rich lesions and STEMI technique; pci-case-nstemi-thrombus; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep the circumflex STEMI scenario. Add a deferred-stenting choice.
- Videos (13; choose the most relevant 1–4 per lesson):
  - `5nUQ-6KT3XQ` [Brilakis] Case 202: Manual of PCI - Thrombus troubles
  - `fJFYyOQQRgM` [Brilakis] Case 189: Manual of PCI - Left main thrombus
  - `ka8kxtblPHc` [Brilakis] Case 156: Manual of PCI - Large thrombus
  - `44Fu588ImqM` [Brilakis] Case 109: PCI Manual - Large thrombus in a covid 19 patient
  - `D2QhNbShgj4` [Brilakis] Case 66: PCI Manual - Thrombus, filter, OCT
  - `LtWpzX1Mi3g` [Brilakis] Case 61: PCI Manual - Filter for clots?
  - `1tCL0HepoqY` [Brilakis] Case 55: PCI Manual - LIMA thrombosis
  - `tXtTiivM1Kc` [Brilakis] Case 43: PCI Manual - STEMI in a patient with essential thrombocytosis
  - `zDyWd7fNPmw` [Brilakis] Case 35: PCI Manual- Large RCA thrombus
  - `AHteTspH3R8` [Brilakis] Case 14: PCI Manual: Large coronary thrombus
  - `vfEFClFSFeg` [Brilakis] Case 217: Manual of CTO PCI - Thrombus Rx marathon
  - `gt28PzWWDXg` [Brilakis] Case 211: Manual of CTO PCI - Thrombus
  - `qsP8jPCmqnE` [Hanna] Heavy coronary thrombus

### `cx-aspiration` — Aspiration thrombectomy step by step  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 20, 30; Oxford 8: Aspiration catheters
- In CathMaster now: cx-grafts-thrombus: Thrombus-rich lesions and STEMI technique  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Expose the aspiration action that the engine already defines as a device in the circumflex STEMI scenario.
- Videos (7; choose the most relevant 1–4 per lesson):
  - `RKErV7eI2NQ` [Brilakis] 20.2 Aspiration thrombectomy step-by-step: Manual of PCI
  - `ka8kxtblPHc` [Brilakis] Case 156: Manual of PCI - Large thrombus
  - `44Fu588ImqM` [Brilakis] Case 109: PCI Manual - Large thrombus in a covid 19 patient
  - `zDyWd7fNPmw` [Brilakis] Case 35: PCI Manual- Large RCA thrombus
  - `AHteTspH3R8` [Brilakis] Case 14: PCI Manual: Large coronary thrombus
  - `vfEFClFSFeg` [Brilakis] Case 217: Manual of CTO PCI - Thrombus Rx marathon
  - `qsP8jPCmqnE` [Hanna] Heavy coronary thrombus

### `acs-rv-posterior` — Inferior, right ventricular and posterior infarction  (P2, coverage now: partial)
- Book locations from the map: Brilakis 20; Oxford —
- In CathMaster now: mcs-stemi: Inferior, RV and posterior MI, and MINOCA; fnd-case-inferior-rv; Lab: Haemodynamics lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add an RCA STEMI scenario to the PCI lab with bradycardia and RV haemodynamics driven by the patient engine.

### `acs-mechanical-complications` — Mechanical complications of MI  (P2, coverage now: partial)
- Book locations from the map: Brilakis —; Oxford —
- In CathMaster now: mcs-stemi: Mechanical complications of MI; pub-post-mi-vsr-transjugular-closure; Lab: Haemodynamics lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep the haemodynamics scenarios for VSR and acute MR. Link them from the lesson as practice steps.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `NuLm5WUX0ew` [Brilakis] Case 51: PCI Manual - MI complications

### `phy-minoca` — MINOCA as a working diagnosis  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 7.2; Oxford 5: Myocardial infarction with non-obstructed coronary arteries
- In CathMaster now: fnd-physiology: Myocardial injury, infarction types and MINOCA; phy-microvascular: MINOCA: a working diagnosis; mcs-stemi: Inferior, RV and posterior MI, and MINOCA  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a branching case that passes through an OCT bench step and then a next-investigation decision.
- Videos (5; choose the most relevant 1–4 per lesson):
  - `E2mclAG96E8` [Brilakis] Case 122: PCI Manual - AMI after mitral valve replacement
  - `u_Fsnu0eoRE` [Brilakis] Case 104: PCI Manual - An unusual myocardial infarction
  - `YsddPIhti-c` [Brilakis] Case 9: PCI Manual - MINOCA?
  - `xSXwJGTdXA4` [Hanna] MI with plaque disruption on IVUS/OCT but stenosis less than 50%: should you stent?
  - `mYP2z4159Fk` [Hanna] Types of plaque disruption by OCT and value of OCT in MINOCA- Elias Hanna, Univ of Iowa

