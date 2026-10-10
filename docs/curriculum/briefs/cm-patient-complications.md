# Brief: cm-patient-complications — Hypotension, arrhythmia, radiation, kidneys and bleeding

- Track: `complication-management`  ·  Stage: 3  ·  File: `src/content/manual/complication-management/05-patient-complications.ts`
- Write also: `docs/curriculum/evidence/cm-patient-complications.md` and `docs/curriculum/lab-requests/cm-patient-complications.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 2 (PDF pages 37–40): 2.2 'Electrocardiogram' (p.37), 2.6 'Contrast volume' (p.39)
- Brilakis chapter 3 (PDF pages 41–60): 3.4 'Anticoagulants' (p.47), 3.7 'Antiarrhythmics' (p.57)
- Brilakis chapter 28 (PDF pages 485–496): 28.1 'Hypotension' (p.485), 28.2 'Radiation skin injury' (p.488), 28.3 'Contrast-induced acute kidney injury' (p.494)
- Brilakis chapter 29 (PDF pages 497–512): 29.1 'Femoral access complications' (p.497)
- Brilakis chapter 30 (PDF pages 513–600): whole chapter
- Oxford chapter 1 (PDF pages 22–45): 'Dose excess' (p.39)
- Oxford chapter 3 (PDF pages 64–91): 'Anticoagulation issues' (p.85)
- Oxford chapter 9 (PDF pages 274–297): 'Cardioversion/defibrillation' (p.282)
- Oxford chapter 10 (PDF pages 298–335): 'Arrhythmia' (p.309); 'Contrast nephropathy' (p.333); 'Hypotension' (p.304); 'Renal failure' (p.331); 'Vasovagal reaction' (p.308)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `comp-hypotension-vasovagal` — Hypotension in the lab, including vasovagal reactions  (P1, coverage now: partial)
- Book locations from the map: Brilakis 28.1; Oxford 10: Hypotension; 10: Vasovagal reaction
- In CathMaster now: pci-after: Monitoring and the hypotensive patient; pci-case-ward-hypotension; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a structured differential step whenever the patient engine drops the blood pressure.
- Videos (3; choose the most relevant 1–4 per lesson):
  - `iG18Julm6NA` [Brilakis] 28.1 Hypotension - Manual of PCI
  - `QQfDGVH_ogs` [Brilakis] Case 145: PCI Manual - Hypotension after left main engagement
  - `l5PoQy7dgWo` [Brilakis] Case 165: Manual of CTO PCI - Collapse

### `comp-arrhythmia` — Arrhythmias and defibrillation in the lab  (P1, coverage now: partial)
- Book locations from the map: Brilakis 3.7, 2.2; Oxford 10: Arrhythmia; 9: Cardioversion/defibrillation
- In CathMaster now: fnd-ecg: Arrhythmias in the cath lab; comp-systemic-access: Stroke, arrhythmia, cholesterol embolisation and radiation injury; Lab: Cath lab: diagnostic angiography; Lab: Temporary pacing  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add injection-related VF and bradycardia events to the PCI lab.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `Dg-PqPQPhcA` [Brilakis] Case 153: PCI Manual - STEMI, kinked guide, VF
  - `MG8W3F3qGa8` [Brilakis] Case 77: PCI Manual - Snaring for treating ventricular tachycardia

### `rc-dose-excess` — High-dose cases and follow-up for radiation skin injury  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 28.2; Oxford 1: Dose excess
- In CathMaster now: comp-systemic-access: Stroke, arrhythmia, cholesterol embolisation and radiation injury  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a long CTO case whose debrief triggers a dose-excess follow-up decision.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `CuPjSsGRREM` [Brilakis] 28.2 Preventing radiation-related complications

### `rc-contrast-volume` — Tracking contrast volume against the patient's limit  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.6, 30; Oxford 10: Contrast nephropathy
- In CathMaster now: fnd-safety: Contrast media and kidney protection; Lab: Cath lab: diagnostic angiography; Lab: Calculators  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Show a per-patient contrast limit in the PCI lab and score against it in the debrief.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `Ml8VQrwAVDU` [Brilakis] Case 259: Manual of CTO PCI - Ultra low contrast CTO PCI

### `rc-caki-prevention` — Preventing contrast-associated acute kidney injury  (P1, coverage now: text-only)
- Book locations from the map: Brilakis 28.3; Oxford 10: Renal failure; 10: Contrast nephropathy
- In CathMaster now: fnd-safety: Contrast media and kidney protection; comp-systemic-access: Major bleeding, contrast reactions and contrast-associated AKI; Lab: Calculators  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a low-eGFR patient to the Full procedure, with hydration orders and a contrast budget that carries into ad hoc PCI.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `XF9bo16qAy0` [Brilakis] 28.3 How to prevent contrast-induced acute kidney injury - Manual of PCI
  - `Zl_oDZ2rbiE` [Brilakis] Case 103: PCI Manual - DK crush with 5 mL of contrast

### `comp-major-bleeding` — Major bleeding and anticoagulant reversal  (P1, coverage now: text-only)
- Book locations from the map: Brilakis 29.1, 3.4; Oxford 3: Anticoagulation issues
- In CathMaster now: comp-systemic-access: Major bleeding, contrast reactions and contrast-associated AKI  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a reversal and transfusion decision to the retroperitoneal bleed scenario.

