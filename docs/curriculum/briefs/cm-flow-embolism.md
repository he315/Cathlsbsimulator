# Brief: cm-flow-embolism — No-reflow, embolism and stroke

- Track: `complication-management`  ·  Stage: 4  ·  File: `src/content/manual/complication-management/02-flow-embolism.ts`
- Write also: `docs/curriculum/evidence/cm-flow-embolism.md` and `docs/curriculum/lab-requests/cm-flow-embolism.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 5 (PDF pages 97–122): 5.4 'Step 4. Aspirate guide catheter' (p.108)
- Brilakis chapter 9 (PDF pages 167–184): 9.8 'Good flow?' (p.184)
- Brilakis chapter 25 (PDF pages 435–446): 25.2 'Determine the cause of acute vessel closure and tr' (p.435)
- Oxford chapter 8 (PDF pages 204–273): "The 'no-reflow' (search the chapter) phenomenon"
- Oxford chapter 10 (PDF pages 298–335): 'Air embolism' (p.327); 'Cholesterol embolization' (p.335); 'Pulmonary oedema' (p.302); 'Stroke' (p.303)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `comp-no-reflow` — Slow flow and no-reflow  (P1, coverage now: partial)
- Book locations from the map: Brilakis 25.2, 9.8; Oxford 8: The 'no-reflow' phenomenon
- In CathMaster now: comp-dissection-flow: Slow flow and no-reflow; comp-case-svg-noreflow; pub-calcified-lad-no-reflow; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add drug delivery through a microcatheter once that device exists.
- Videos (5; choose the most relevant 1–4 per lesson):
  - `LvM51_9s8SA` [Brilakis] Case 222: Manual of PCI - SSO2 for no reflow
  - `ARrFtw473ek` [Brilakis] Case 38: PCI Manual: No reflow during SVG PCI
  - `wA60SnGptYI` [Brilakis] Case 272: Manual of CTO PCI - No flow
  - `UYDQobOdsVU` [Brilakis] Case 203: Manual of CTO PCI - No reflow?!
  - `6HmNE36hBec` [Brilakis] Nitro "on a stick"

### `comp-embolisation` — Plaque and thrombus embolisation  (P2, coverage now: partial)
- Book locations from the map: Brilakis 25.2; Oxford —
- In CathMaster now: comp-dissection-flow: Air embolism and intraprocedural thrombosis; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Expose aspiration as the bailout for the embolisation the engine already models.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `y2hZUVqFhRY` [Brilakis] 25.4 Plaque and thrombus embolization - Manual of PCI

### `comp-air-embolism` — Air embolism  (P1, coverage now: partial)
- Book locations from the map: Brilakis 25.2, 5.4; Oxford 10: Air embolism
- In CathMaster now: comp-dissection-flow: Air embolism and intraprocedural thrombosis; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add an air-embolism lesson that starts in the engine's air state, with the treatment steps taught in the module.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `xng1sbQ-bT0` [Brilakis] 25.5 Air embolization - Manual of PCI
  - `36nFSiyR008` [Brilakis] Case 197: Manual of PCI - Airmail
  - `eTb3Stlg8fU` [Hanna] SCAD cases and discussion- Air embolism cases   Elias Hanna

### `comp-stroke` — Stroke around the procedure  (P2, coverage now: text-only)
- Book locations from the map: Brilakis —; Oxford 10: Stroke
- In CathMaster now: comp-systemic-access: Stroke, arrhythmia, cholesterol embolisation and radiation injury  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a neurological deficit in recovery in the Full procedure, with an escalation step.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `nF4sR3k7ivI` [Brilakis] Case 136: PCI Manual - Stroke

### `comp-oedema-cholesterol` — Pulmonary oedema and cholesterol embolisation  (P3, coverage now: text-only)
- Book locations from the map: Brilakis —; Oxford 10: Pulmonary oedema; 10: Cholesterol embolization
- In CathMaster now: comp-systemic-access: Stroke, arrhythmia, cholesterol embolisation and radiation injury  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add check-understanding steps. Add a pulmonary oedema event in the Full procedure, triggered by fluid and contrast load.

