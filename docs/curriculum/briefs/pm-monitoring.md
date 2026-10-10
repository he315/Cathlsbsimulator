# Brief: pm-monitoring — Monitoring and running the room

- Track: `pci-manual`  ·  Stage: 2  ·  File: `src/content/manual/pci-manual/02-monitoring.ts`
- Write also: `docs/curriculum/evidence/pm-monitoring.md` and `docs/curriculum/lab-requests/pm-monitoring.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 1 (PDF pages 29–36): 1.2 'Monitoring' (p.33)
- Brilakis chapter 2 (PDF pages 37–40): 2.1 'Patient' (p.37), 2.2 'Electrocardiogram' (p.37), 2.3 'Pressure waveform' (p.38), 2.4 'Oxygen saturation' (p.38), 2.7 'Access site' (p.39), 2.9 'Operator and team performance' (p.39), 2.10 'Cath lab environment' (p.39), 2.11 'Sterile field and equipment' (p.39), 2.12 'Equipment position within the body' (p.40)
- Brilakis chapter 8 (PDF pages 149–166): 8.10 'Monitor wire position' (p.164)
- Oxford chapter 1 (PDF pages 22–45): 'Catheter laboratory preparation' (p.43)
- Oxford chapter 2 (PDF pages 46–63): 'The cardiac physiologist' (p.59); 'The cardiologist' (p.47); 'The nurse' (p.53); 'The radiographer' (p.63)
- Oxford chapter 4 (PDF pages 92–127): 'Equipment' (p.97); 'Pressure waveforms' (p.95)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `ts-monitoring` — Continuous monitoring: patient, ECG, pressure, oxygen saturation and access site  (P1, coverage now: partial)
- Book locations from the map: Brilakis 1.2, 2.1, 2.2, 2.3, 2.4, 2.7; Oxford 2: The cardiac physiologist
- In CathMaster now: fnd-lab: The team and the room; pci-after: Monitoring and the hypotensive patient; Lab: Full procedure; Lab: Cath lab: diagnostic angiography  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add unannounced monitor changes during PCI-lab cases, scored on time to recognition.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `XPF_SXb657U` [Brilakis] 2. Manual of PCI - Monitoring

### `hd-transducers` — Transducers: zeroing, levelling, damping and the fast-flush test  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.3; Oxford 4: Pressure waveforms; 4: Equipment
- In CathMaster now: hd-basics: From pressure to waveform: transducers, zeroing and levelling; hd-basics: Damping, resonance and the fast-flush test; Lab: Full procedure; Lab: Haemodynamics lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a fast-flush test and a mis-levelled transducer fault to the haemodynamics lab.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `5ARDKipHats` [Hanna] Hemodynamics 1: Essential hemodynamics, pitfalls, anomalies- Elias Hanna, Univ Iowa

### `ts-equipment-position` — Watching wire and device position: wire tip and guide  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.12, 8.10; Oxford —
- In CathMaster now: pci-wires: Tortuosity, buddy wires and wire safety; Lab: PCI in the cath lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: The engine already models wire perforation and wiring into branches off the route. Add lesson steps that begin with the wire tip drifting distally during a device exchange.

### `ts-checklist-timeout` — Safety checklist, team brief and time-out  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.9, 2.10; Oxford 1: Catheter laboratory preparation
- In CathMaster now: fnd-lab: Consent and the safety checklist; Lab: Full procedure; Lab: Cath lab: diagnostic angiography  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Extend the diagnostic lab's pre-brief time-out to the PCI lab, covering equipment, anticoagulation and the bailout plan.

### `ts-team-roles` — Team roles: cardiologist, nurse, physiologist and radiographer  (P2, coverage now: partial)
- Book locations from the map: Brilakis 2.9; Oxford 2: The cardiologist; 2: The nurse; 2: The cardiac physiologist; 2: The radiographer
- In CathMaster now: fnd-lab: The team and the room; Lab: Cath lab: diagnostic angiography  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Extend the diagnostic lab's verbal team orders to device handling in the PCI lab.

### `ts-crisis-leadership` — Crisis leadership, closed-loop communication and human factors  (P1, coverage now: partial)
- Book locations from the map: Brilakis 2.9; Oxford 2: The cardiologist
- In CathMaster now: comp-principles: Leading the team in a crisis; comp-principles: The complications kit and human factors  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Run a complication scenario in the PCI lab where the learner must assign tasks through the team engine, scored on closed-loop communication.

### `ts-sterile-environment` — The sterile field, the cath lab environment and equipment handling  (P3, coverage now: text-only)
- Book locations from the map: Brilakis 2.10, 2.11; Oxford 1: Catheter laboratory preparation
- In CathMaster now: fnd-lab: Scrubbing, the sterile field and safe handling; fnd-lab: Your first days in the lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add check-understanding steps and a contamination event on the Full procedure table.

