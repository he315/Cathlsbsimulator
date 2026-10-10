# Brief: cm-access-complications — Vascular access complications

- Track: `complication-management`  ·  Stage: 3  ·  File: `src/content/manual/complication-management/06-access-complications.ts`
- Write also: `docs/curriculum/evidence/cm-access-complications.md` and `docs/curriculum/lab-requests/cm-access-complications.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 14 (PDF pages 249–270): 14.1 'Hemodynamic support: when and what device' (p.249)
- Brilakis chapter 29 (PDF pages 497–512): 29.1 'Femoral access complications' (p.497), 29.2 'Radial access complications' (p.506)
- Oxford chapter 10 (PDF pages 298–335): 'Limb ischaemia' (p.317); 'Vascular complications' (p.315)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `comp-femoral-bleeding` — Femoral bleeding and retroperitoneal haematoma  (P1, coverage now: partial)
- Book locations from the map: Brilakis 29.1; Oxford 10: Vascular complications
- In CathMaster now: comp-systemic-access: Femoral access complications; comp-case-retroperitoneal; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: The closure engine already schedules delayed bleeds in recovery. Add a management sequence the learner works through when one presents.
- Videos (4; choose the most relevant 1–4 per lesson):
  - `UzFqEfJIeeY` [Brilakis] 29.2 Femoral access bleeding
  - `ukNF_xn93-s` [Brilakis] 29.3 Approch to suspected retroperitoneal hematoma - Manual of PCI
  - `BE-88Jf6d0Q` [Brilakis] Vascular Access Management for Coronary and Peripheral Interventions - Dallas CVI 2015
  - `CXdH-QFquHA` [Hanna] Access complications and management

### `comp-femoral-pseudoaneurysm` — Femoral pseudoaneurysm, AV fistula, infection and nerve injury  (P2, coverage now: partial)
- Book locations from the map: Brilakis 29.1; Oxford 10: Vascular complications
- In CathMaster now: comp-systemic-access: Femoral access complications; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add ultrasound recognition of a pseudoaneurysm, reusing the access ultrasound engine, at follow-up.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `TDcNEUW-qBs` [Brilakis] 29.4 Pseudoaneurysm, AV fistula, Infection, Nerve injury with femoral access - Manual of PCI
  - `CXdH-QFquHA` [Hanna] Access complications and management

### `comp-limb-ischaemia` — Limb ischaemia after femoral or large-bore access  (P2, coverage now: partial)
- Book locations from the map: Brilakis 29.1; Oxford 10: Limb ischaemia
- In CathMaster now: comp-systemic-access: Femoral access complications; mcs-ecmo: Oxygenation, differential hypoxaemia, anticoagulation and complications; Lab: VA-ECMO circuit  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add leg-perfusion checks after large-bore Impella cases, as the ECMO circuit already does.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `JWh8OaDq6K8` [Brilakis] 29.1 Ischemic femoral access complications - Manual of PCI

### `comp-radial` — Radial access complications  (P1, coverage now: partial)
- Book locations from the map: Brilakis 29.2; Oxford 10: Vascular complications
- In CathMaster now: comp-systemic-access: Radial access complications; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add forearm haematoma and radial perforation events to the Full procedure. Radial artery occlusion is already decided at band removal.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `SU74rGGZTe8` [Brilakis] 29.5 Radial access complications - Manual of PCI
  - `CXdH-QFquHA` [Hanna] Access complications and management

### `cx-large-bore-bailout` — Large-bore access complications and endovascular bail-out: crossover balloon occlusion, covered stent for iliofemoral rupture, failed pre-close  (P2, coverage now: missing)
- Book locations from the map: Brilakis 29.1, 14.1; Oxford —
- In CathMaster now: nothing  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a large-bore bleeding scenario to the full-case access workspace: recognise the bleed on haemodynamics and access fluoroscopy, then step through crossover balloon occlusion and covered-stent bail-out.

