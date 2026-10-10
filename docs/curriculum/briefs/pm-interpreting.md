# Brief: pm-interpreting — Interpreting the angiogram

- Track: `pci-manual`  ·  Stage: 2  ·  File: `src/content/manual/pci-manual/09-interpreting.ts`
- Write also: `docs/curriculum/evidence/pm-interpreting.md` and `docs/curriculum/lab-requests/pm-interpreting.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 5 (PDF pages 97–122): 5.7 'Step 7. Manipulate catheter to engage coronary ost' (p.114)
- Brilakis chapter 6 (PDF pages 123–136): 6.3 'Step 3. Administer intracoronary nitroglycerin' (p.124), 6.8 'Step 8. Angiogram interpretation' (p.128)
- Brilakis chapter 9 (PDF pages 167–184): 9.2 'When is lesion preparation needed?' (p.167), 9.8 'Good flow?' (p.184)
- Brilakis chapter 21 (PDF pages 389–398): whole chapter
- Oxford chapter 6 (PDF pages 150–185): 'Common pitfalls' (p.180); 'Quantification of stenoses' (p.175); 'Tips for interpretation' (p.179); 'Unusual coronary anatomy' (p.181); 'Use of nitrates' (p.173)
- Oxford chapter 7 (PDF pages 186–203): 'Collateral filling' (p.198)
- Oxford chapter 8 (PDF pages 204–273): 'Imaging the lesion' (p.209)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `dx-stenosis-grading` — Grading stenosis by eye and with QCA  (P1, coverage now: covered)
- Book locations from the map: Brilakis 6.8; Oxford 6: Quantification of stenoses; 8: Imaging the lesion
- In CathMaster now: dx-interpretation: Grading stenosis and its limits; Lab: Real angiograms; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add QCA to the diagnostic lab, which currently has it only in the PCI lab.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `qK2euYOpfEU` [Brilakis] 6.2 Manual of PCI - How to interpret the coronary angiogram

### `dx-timi-flow` — TIMI flow, frame count and myocardial blush  (P1, coverage now: partial)
- Book locations from the map: Brilakis 6.8, 9.8; Oxford 6: Tips for interpretation
- In CathMaster now: dx-interpretation: Flow: TIMI grades and myocardial blush; Lab: Real angiograms  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a TIMI grading drill on library runs once an expert reader has labelled flow. Add a slow-flow state in the PCI lab that the learner must grade.

### `dx-pitfalls` — Interpretation pitfalls: foreshortening, overlap, non-selective injection and missed vessels  (P1, coverage now: covered)
- Book locations from the map: Brilakis 6.8; Oxford 6: Common pitfalls; 6: Tips for interpretation
- In CathMaster now: dx-anatomy-pitfalls: True RCA or acute marginal?; dx-interpretation (all lessons); dx-case-smooth-rca; Lab: View trainer; Lab: Angio case library; Lab: Real angiograms  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep as is.
- Videos (7; choose the most relevant 1–4 per lesson):
  - `qK2euYOpfEU` [Brilakis] 6.2 Manual of PCI - How to interpret the coronary angiogram
  - `XxUGDCim5sg` [Hanna] Coronary angiography tips
  - `pJU6eoaDf48` [Hanna] Medley of cases-2
  - `-iGoZsqraR0` [Hanna] Medley of cases (angiographic and hemodynamics)-1
  - `W-7hiIlAVAA` [Hanna] Interesting coronary angiograms and decision-making -3
  - `eMF8huQPGa0` [Hanna] Interesting coronary angiograms -2
  - `eGdfIk73cds` [Hanna] Interesting coronary angiograms

### `dx-lesion-morphology` — Lesion morphology: thrombus, calcium, dissection and ectasia  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 6.8, 9.2; Oxford 8: Imaging the lesion
- In CathMaster now: dx-interpretation: Thrombus, calcium, dissection, ectasia and when to add physiology or imaging  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a morphology-labelling drill on library runs once expert labels exist, with matching virtual lesions in the PCI lab.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `qK2euYOpfEU` [Brilakis] 6.2 Manual of PCI - How to interpret the coronary angiogram
  - `iABWsnz1QHY` [Brilakis] Case 196: Manual of PCI - Calcified +aneurysmal RCA
  - `XZoGURFaUkI` [Brilakis] Case 78: PCI Manual - Calcium vs thrombus

### `dx-collaterals` — Recognising and grading collaterals  (P2, coverage now: partial)
- Book locations from the map: Brilakis 6.8, 21; Oxford 7: Collateral filling
- In CathMaster now: dx-anatomy-pitfalls: Collaterals: pathways, named channels and grading; Lab: Real angiograms  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Extend the existing 'Collaterals?' drill so the learner also grades the collateral and names the channel.

### `dx-spasm` — Catheter-induced spasm and vasospastic angina  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 6.3; Oxford 6: Use of nitrates; 6: Common pitfalls
- In CathMaster now: dx-anatomy-pitfalls: Spasm and spontaneous coronary artery dissection; phy-microvascular: INOCA, ANOCA and acetylcholine provocation; pub-vasospasm-vf-ecmo-acetylcholine; Lab: Case studies  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a catheter-induced RCA spasm state to the diagnostic lab that resolves with intracoronary nitrate.

### `dx-coronary-anomalies` — Coronary anomalies, fistulae and myocardial bridging  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 5.7, 6.8; Oxford 6: Unusual coronary anatomy
- In CathMaster now: dx-anatomy-pitfalls: Coronary anomalies, fistulae and myocardial bridging; published case pub-anomalous-lm-right-sinus-stemi; Lab: Case studies  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add anomalous-origin variants to the diagnostic case generator so the learner has to find and engage them, and link a lesson step that launches such a case.
- Videos (8; choose the most relevant 1–4 per lesson):
  - `2SDaJrW3gsE` [Brilakis] Case 198: Manual of PCI - The fistula
  - `oGJjg-xem3k` [Brilakis] Case 190: Manual of PCI - Heavily calcified + tortuous anomalous circumflex
  - `laYXNLAERKo` [Brilakis] Case 4: PCI Manual - STEMI in anomalous RCA
  - `5NCILKIE8xs` [Brilakis] Case 265: Manual of CTO PCI: Coronary sinus fistula
  - `f0kkLLDH29g` [Brilakis] Case 159: Manual of CTO PCI - Anomalous circumflex CTO PCI
  - `cHCllDaWTZc` [Brilakis] Case 59: Manual of CTO Interventions - Anomalous RCA CTO
  - `UPmGtERfIKQ` [Hanna] Coronary angiography: Thebesian veins- Coronary fistula
  - `Rel5KYzYKew` [Hanna] Coronary artery anomalies: angiography, case illustrations, and management- Elias Hanna

