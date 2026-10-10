# pci-budgets-stop-rules: model parameters

The PCI lab's contrast and radiation budgets, the team's announcements and the stop-or-continue checkpoint (`src/simulation/pci/budgets.ts`), their use in the lab session (`src/ui/pci/PciLabSession.ts`), the checkpoint and counters (`src/ui/pci/PciCheckpoint.tsx`) and the multivessel scenario (`src/simulation/pci/scenarios/packs/multivessel.ts`).

Sourced values carry their module-text location in the code and are not repeated as model parameters: the contrast rules, the warning threshold and the announcement points of the shared contrast module (`src/simulation/patient/contrastBudget.ts`, docs/realism/facts/S9.md); the creatinine clearance as the ceiling below an eGFR of 30 (Brilakis 28.3, complication-management/05-patient-complications.ts:704); the air kerma limit of 5 Gy (the lower end of Brilakis's 5-7 Gy and his CTO rule, 01-principles-closure.ts:263 and :400); the sentinel level above 15 Gy (01-principles-closure.ts:400); an air kerma call at each 1 Gy and each 30 minutes (Brilakis 28.2.2.4.8, 01-principles-closure.ts:386; Oxford's radiographer at 1 Gy, 05-patient-complications.ts:564), with the contrast total announced at the same points (the module's own extension, 01-principles-closure.ts:386); a dose rate above 20 mGy/min (05-patient-complications.ts:672); the other substantial radiation dose levels (`DOSE_TRIGGERS`, src/simulation/dose.ts). The judgement of a decision follows the module text: approaching the ceiling is the time to stop or stage (pci-manual/01-planning.ts:1692); above 5-7 Gy the procedure is usually stopped and staging is legitimate (05-patient-complications.ts:567); a CTO above 5 Gy without crossing or progress is stopped or bailed out, and a change of strategy does not erase the dose (01-principles-closure.ts:1292); a CTO already crossed is completed economically (complex-pci/09-cto-strategy.ts:929). Everything below is a MODEL PARAMETER.

## Budgets and checkpoints (budgets.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Checkpoint thresholds | the warning threshold (80% of the ceiling), the ceiling, the air kerma limit | n/a | The plan's design (lab-build-plan.json, pci-budgets-stop-rules: a stop-or-continue modal at thresholds). The module asks for a decision point at each change of wire or strategy as well (cm-principles-closure#1); that is not built: the lab does not yet detect a change of strategy |
| Decisions offered | continue (with a named next step), change strategy, bail out (CTO only), stage, stop | n/a | The lab request's list (cm-principles-closure#1) |
| Progress claims | crossed, making progress, no progress | n/a | The learner states progress; the judgement reads the engine's crossing (`st.wire.crossed`), not the claim |
| Warning checkpoint judgement | any explicit decision is right | n/a | pm-planning#1: no case exceeds the ceiling 'without an explicit decision' |
| CTO at the air kerma limit, not crossed | stop or bail out is right; with 'making progress' reported, the decision is not scored (marked correct, the rule shown as the expectation) | n/a | The rule is 'more than 5 Gy without crossing or progress' (01-principles-closure.ts:400; 'substantial progress' at :1292); the lab does not measure progress, so a decision resting on the learner's claim is not scored |
| Checkpoint opening | each checkpoint opens from its own test (total at or above the warning threshold, at or above the ceiling), whatever the announcement points | n/a | Presentation of the plan's design |
| No ceiling left (recent contrast at or above the rule) | any contrast counts as over: the event is raised and both contrast checkpoints open | n/a | The module counts recent contrast against the ceiling (05-patient-complications.ts:698-699) |
| Naming the ceiling in the calls and at the checkpoint | the rule's ceiling is named only with the teaching aids (guided practice); otherwise the calls give the volume only, unless the ceiling in force is the learner's own figure from the plan ('the agreed ceiling of N') | n/a | No ground truth on live lab screens outside guided aids (LAB_BUILD_PLAN section 2) |
| Advanced-CKD ceiling with recent contrast | the creatinine clearance less the recent contrast | mL | The module says to count recent contrast against the ceiling (05-patient-complications.ts:698-699); applying it to the advisory figure too is this package's reading |
| Single kidney | a note only, no lower figure | n/a | Both manuals say 'lower'; neither gives a figure |
| Prior contrast that day (`priorContrastMl`) | counted as recent contrast 0 days ago | mL | The scenario type's field is 'contrast already given that day' |
| A plan above the rule | ignored (the rule stays the ceiling) | n/a | contrastBudget's own rule: the plan is used only when lower |
| Elapsed-time call text | rounded to the nearest 0.1 Gy | Gy | Presentation |

## The 'long-case' variant (`BUDGET_CARRY_VARIANTS`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `karMGy` | 4500 | mGy | Teaching value: 0.5 Gy below the 5 Gy rule, so the rule and its checkpoint are reached within the session |
| `fluoroS` | 2400 | s | Teaching value, below the 60-minute fluoroscopy level of DOSE_TRIGGERS so the radiation event comes from the air kerma |
| `contrastMl` | 150 | mL | Teaching value below 3.7 x a typical clearance (the module's own check uses 70 mL/min, 259 mL) |
| `elapsedS` | 6000 | s | Teaching value (100 minutes into the attempt) |
| Kerma-area product | not carried | Gy cm2 | No figure; the display starts the KAP from this lab |
| Which launches carry it | the launch's variant id 'long-case', for rca-cto only (the scenario whose launch file declares it); a run seed of the same name carries nothing | n/a | The variant is declared for rca-cto by multivessel.launch.ts |
| Carried contrast to the patient engine | not booked | n/a | The carried 150 mL counts in the budget only; the engine's own contrast count starts with this lab |

## The multivessel scenario (multivessel.ts) and its patient (PciLabSession.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Lesions | RCA 0.15 60% 8 mm; RCA 0.62 85% 12 mm (target); LAD 0.25 80% 14 mm; LCx 0.45 75% 10 mm; LM 0.80 40% 5 mm | position 0-1, % stenosis, mm | Teaching values of a synthetic case (pm-target#4: serial lesions in one artery, lesions in a second, a non-critical distal left main) |
| eGFR | 45 | mL/min/1.73 m2 | The plan's worked example (166.5 mL) |
| Contrast that morning | 60 | mL | The plan's worked example of subtracted recent contrast |
| Creatinine for a set eGFR | solved from the profile's 2021 CKD-EPI formula for the seed's age and sex, to 0.01 mg/dL; clearance and MACD recomputed from it | mg/dL | Keeps the engine's renal facts consistent with the scenario's eGFR (the formulas are sourced, S9.md) |

## The session (PciLabSession.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Who blocks | the checkpoint holds the beam and the hands in guided practice and exams; in supervised and independent practice it is attending dialogue in the drawer | n/a | LAB_BUILD_PLAN section 2: forms block the procedure only in guided mode and exam |
| A blocking checkpoint during a run | the call is made at the crossing; the dialogue, and the hold on the beam and the hands, wait until the run ends | n/a | The run that crosses the threshold is filmed, not cut off (its contrast is not wasted) |
| The radiographer at the air kerma limit | when the 1 Gy call and the radiation checkpoint fall in one reading, only the checkpoint's line is spoken, with the time and contrast in it (both are still recorded) | n/a | Presentation: one line instead of two at once |
| Patient adapter's contrast rule | follows the budget's warning threshold, not the fraction of the MACD | n/a | One ceiling for the lab (LAB_BUILD_PLAN section 4) |
| Engine-side contrast (a microcatheter injection) | added to the lab's total and booked to the patient engine | mL | Every millilitre counts (cm-patient-complications#4); an OCT flush is already booked on the guide's syringe by its binding and is not counted twice |
| Contrast counter colour | warning from 50% of the ceiling, danger at the ceiling | fraction | The plan's browser check (the counter turns the warning colour at 50%) and the 50% announcement point |
| Ceiling figure on the counter | shown with the teaching aids, or when the ceiling in force is the learner's own plan figure (a plan above the rule is not used, and the rule's figure is not shown in its place) | n/a | The learner sets the ceiling at the plan step; the rule's figure is not shown outside guided aids |
