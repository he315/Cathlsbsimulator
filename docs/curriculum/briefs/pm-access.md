# Brief: pm-access — Arterial and venous access

- Track: `pci-manual`  ·  Stage: 2  ·  File: `src/content/manual/pci-manual/05-access.ts`
- Write also: `docs/curriculum/evidence/pm-access.md` and `docs/curriculum/lab-requests/pm-access.json`

## Where to read (PDF pages; extracts in $BOOKS/brilakis/chNN.txt and $BOOKS/oxford/chNN.txt)

- Brilakis chapter 1 (PDF pages 29–36): 1.4 'Access' (p.33)
- Brilakis chapter 4 (PDF pages 61–96): 4.1 'Choosing access site' (p.61), 4.2 'Femoral access' (p.62), 4.3 'Radial access' (p.82), 4.4 'Other access sites' (p.93)
- Brilakis chapter 11 (PDF pages 195–216): 11.1 'Femoral access' (p.195)
- Brilakis chapter 14 (PDF pages 249–270): 14.4 'Impella insertion: step-by-step' (p.257)
- Oxford chapter 3 (PDF pages 64–91): 'Arterial closure devices' (p.89); 'Femoral artery access' (p.75); 'Femoral vein access' (p.80); 'How to obtain venous access' (p.79); 'Internal jugular vein access' (p.81); 'Radial artery access' (p.71); 'Subclavian vein access' (p.83); 'The Seldinger technique' (p.65); 'Trends in vascular access' (p.69); 'Which arterial access route to use?' (p.67)

## Topics (each needs a lesson, or a shared lesson that lists it in `topics`)

### `acc-site-choice` — Choosing the access site: radial or femoral  (P1, coverage now: partial)
- Book locations from the map: Brilakis 1.4, 4.1; Oxford 3: Which arterial access route to use?; 3: Trends in vascular access
- In CathMaster now: dx-access: Radial access: anatomy and technique; dx-access: Femoral access; bed-access-closure: Planning and obtaining large-bore access; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a lesson whose steps vary patient factors (anticoagulation, large-bore need, prior CABG) and then open the Full procedure chart so the learner commits to an access route and sees what follows from it.
- Videos (6; choose the most relevant 1–4 per lesson):
  - `97flCAkT5xY` [Brilakis] 4.1. Choosing access site - Manual of PCI
  - `NTNEQzVJINk` [Brilakis] Case 18: PCI Manual: Radial PCI - when to switch?
  - `7TUFq35ATj0` [Brilakis] Optimizing Vascular Access - Dallas CVI 2016
  - `zbRyvCrjz-I` [Brilakis] Debate 2: Radial vs. Femoral Access for PCI - Dallas CVI 2016
  - `BE-88Jf6d0Q` [Brilakis] Vascular Access Management for Coronary and Peripheral Interventions - Dallas CVI 2015
  - `cHvPrxoV2-Y` [Brilakis] Case 31: PCI Manual - PCI and extreme obesity

### `acc-seldinger` — Seldinger technique and sheath insertion  (P1, coverage now: covered)
- Book locations from the map: Brilakis 4.2, 4.3; Oxford 3: The Seldinger technique
- In CathMaster now: dx-access (all lessons); Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add held-out access exam cases so access can count toward entrustment above level II.

### `acc-radial` — Ultrasound-guided radial access, step by step  (P1, coverage now: covered)
- Book locations from the map: Brilakis 4.3; Oxford 3: Radial artery access
- In CathMaster now: dx-access: Radial access: anatomy and technique; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add a lesson step that opens the Full procedure access stage with a small-radial patient preset.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `zQCx7wQSe-Q` [Brilakis] 4.3 Radial artery access: step-by-step - Manual of PCI
  - `K96telF5pxg` [Hanna] Coronary catheter techniques 1: focus on transradial approach- Elias Hanna, Univ Iowa

### `acc-femoral` — Ultrasound- and fluoroscopy-guided femoral access  (P1, coverage now: covered)
- Book locations from the map: Brilakis 4.2; Oxford 3: Femoral artery access
- In CathMaster now: dx-access: Femoral access; Lab: Full procedure  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Keep. Add a high-bifurcation preset and a femoral-head fluoroscopy check as lesson steps.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `S7UWo_MsWjc` [Brilakis] 4 2 Femoral access step-by-step - Manual of PCI
  - `7TUFq35ATj0` [Brilakis] Optimizing Vascular Access - Dallas CVI 2016

### `acc-alternative-arterial` — Alternative arterial access: distal radial, ulnar, brachial, axillary and transcaval  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 4.4; Oxford 3: Which arterial access route to use?
- In CathMaster now: dx-access; bed-access-closure: Planning and obtaining large-bore access  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a distal radial site to the ultrasound access engine. Keep the other routes as check-understanding steps.
- Videos (2; choose the most relevant 1–4 per lesson):
  - `vAOGSbKG4xM` [Brilakis] Case 215: Manual of PCI - Snuffbox, kink, rota, perf, coil
  - `BXRpJS8jtFM` [Hanna] Axillary balloon pump (+Impella): step-by-step access, exchange, closure, complications- Elias Hanna

### `acc-venous` — Venous access: femoral vein, internal jugular and subclavian  (P2, coverage now: partial)
- Book locations from the map: Brilakis 4.4; Oxford 3: How to obtain venous access; 3: Femoral vein access; 3: Internal jugular vein access; 3: Subclavian vein access
- In CathMaster now: hd-basics: Catheters, access and the sequence of a right heart study; bed-pacing: Access, lead choice and positioning under fluoroscopy; Lab: Temporary pacing; Lab: Haemodynamics lab  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Extend the ultrasound-guided access engine to the femoral vein and internal jugular so that pacing and right heart studies begin with a real puncture instead of a route choice.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `i76OWhbpwM4` [Hanna] Simple techniques for femoral or difficult right heart cath

### `acc-sheath-troubleshoot` — Troubleshooting sheath insertion: wire will not advance, dilator will not pass  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 4.2, 4.3; Oxford 3: The Seldinger technique
- In CathMaster now: dx-access: Troubleshooting the radial route  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add scripted resistance events to the Full procedure access stage (wire entering a side branch, a scarred groin), with one lesson step per fix.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `L2ls1c3dvbo` [Brilakis] 4.4 Manual of PCI - Dilator will not go over wire

### `acc-large-bore-preclose` — Large-bore access and the double-suture pre-close technique  (P2, coverage now: text-only)
- Book locations from the map: Brilakis 4.2, 11.1, 14.4; Oxford 3: Arterial closure devices
- In CathMaster now: bed-access-closure: Planning and obtaining large-bore access; bed-access-closure: Closure devices and the pre-close technique; cx-high-risk: Protected PCI and large-bore access  (read these lessons first; do not repeat them, go deeper and step by step)
- Proposed build: Add a large-bore branch to the Full procedure: ultrasound puncture, femoral angiogram, pre-close sequence and upsizing, with a check at each step.
- Videos (1; choose the most relevant 1–4 per lesson):
  - `M72Te9oB76g` [Brilakis] 4.5 Large bore access with double Perclose - Manual of PCI

