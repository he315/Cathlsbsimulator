# Brief: pm-acquiring — Acquiring the angiogram

- Track: `pci-manual`  ·  Stage: 2  ·  File: `src/content/manual/pci-manual/08-acquiring.ts`
- Write also: `docs/curriculum/evidence/pm-acquiring.md` and `docs/curriculum/lab-requests/pm-acquiring.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 1 (PDF pages 29–36): 1.6 'Angiography' (p.35)
- Brilakis chapter 2 (PDF pages 37–40): 2.5 'Radiation dose—X-ray system and shield positioning' (p.39)
- Brilakis chapter 5 (PDF pages 97–122): 5.9 'Step 9. Proceed with contrast injection as describ' (p.121)
- Brilakis chapter 6 (PDF pages 123–136): 6.2 'Step 2. Test contrast injection' (p.123), 6.3 'Step 3. Administer intracoronary nitroglycerin' (p.124), 6.4 'Step 4. Optimally position patient, image receptor' (p.125), 6.6 'Step 6. Perform cineangiography' (p.126), 6.8 'Step 8. Angiogram interpretation' (p.128)
- Oxford chapter 1 (PDF pages 22–45): 'Fluoroscopy and acquisition' (p.33); 'Radiology equipment' (p.31)
- Oxford chapter 6 (PDF pages 150–185): 'Coronary anatomy' (p.151); 'Imaging the coronaries' (p.159); 'Left coronary artery' (p.151); 'Right coronary artery' (p.151); 'Use of nitrates' (p.173)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `dx-test-injection-nitrate` — Test injection and intracoronary nitrate before angiography  (P2, coverage now: partial)
- Book locations from the map: Brilakis 5.9, 6.2, 6.3; Oxford 6: Use of nitrates
- In CathMaster now: dx-catheters: The safe engagement sequence; dx-interpretation: Grading stenosis and its limits; Lab: Cath lab: diagnostic angiography; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add intracoronary nitrate as a syringe action in the diagnostic lab, and a case where spasm imitates a stenosis until nitrate is given.

### `dx-projections` — Choosing and naming angiographic projections  (P1, coverage now: covered)
- Book locations from the map: Brilakis 1.6, 6.4, 6.6; Oxford 6: Imaging the coronaries; 6: Left coronary artery; 6: Right coronary artery
- In CathMaster now: dx-views (all lessons); Lab: View trainer; Lab: Cath lab: diagnostic angiography; Lab: Real angiograms  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep as is.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `Y3bEFuzTpB8` [Brilakis] 6.1 Manual of PCI - How to perform coronary angiography
  - `XxUGDCim5sg` [Hanna] Coronary angiography tips
  - `r2zahMaZjHY` [Hanna] Coronary angiographic views- Elias Hanna

### `dx-cine-acquisition` — Cine acquisition: injection, breath-hold, panning and frame rate  (P1, coverage now: covered)
- Book locations from the map: Brilakis 6.6, 2.5; Oxford 1: Fluoroscopy and acquisition; 1: Radiology equipment
- In CathMaster now: dx-views: Projection principles; fnd-safety: Radiation protection in practice; Lab: Cath lab: diagnostic angiography  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep as is.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `Y3bEFuzTpB8` [Brilakis] 6.1 Manual of PCI - How to perform coronary angiography

### `fnd-coronary-anatomy-dominance` — Coronary anatomy, segment numbering and dominance  (P1, coverage now: covered)
- Book locations from the map: Brilakis 6.8; Oxford 6: Coronary anatomy; 6: Left coronary artery; 6: Right coronary artery
- In CathMaster now: fnd-coronary-anatomy (all lessons); dx-anatomy-pitfalls: RCA branches and dominance; Lab: Real angiograms; Lab: View trainer; Lab: Cath lab: diagnostic angiography; Lab: Glossary/Atlas  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add a segment-naming step on CoronaryDominance and CADICA runs so segment numbering is drilled on real cine as well as dominance.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `3sGSkQ6hoQ0` [Brilakis] Case 56: PCI Manual - Coronary anatomy assessment: core principles

