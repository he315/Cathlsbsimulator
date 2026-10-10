# pci-antithrombotic-orders: model parameters

The PCI lab's anticoagulant and antiplatelet orders: the device- and regimen-specific ACT targets and the recheck clock (`src/simulation/pci/lesionAssessment.ts`), the sourced dosing (`src/simulation/pci/doses.ts`), the order record, protamine reaction and suspected-HIT errors (`src/simulation/pci/actions/drugs.ts`), the drugs console (`src/ui/pci/consoles/DrugsConsole.tsx`) and the two lad-focal variants (`src/simulation/pci/scenarios/packs/antithrombotic.ts`).

Sourced values carry their module-text location in the code and are not repeated as model parameters. All are in lesson pm-antithrombotics (`src/content/manual/pci-manual/03-antithrombotics.ts`): the ACT goals, Hemochron 300-350 s and HemoTec 250-300 s with heparin alone, 200-250 s with a GP IIb/IIIa inhibitor or cangrelor (a Hemochron figure; no HemoTec figure, so the lab applies it and flags it), antegrade CTO above 300 s and retrograde above 350 s on a Hemochron (lines 119-124); bivalirudin on the heparin goals (321); the check 5 minutes after a bolus (93) and the recheck every 20-30 minutes (101); heparin 70-100 U/kg, 50-70 U/kg with an IV antiplatelet agent (64-65); protamine 1-1.5 mg per 100 U (Brilakis 3.4, 217), Oxford 1 mg per 80-100 U within 15 minutes and less later (218), never above 50 mg, no faster than 5 mg/min (Brilakis 26.2) or over 10 minutes (Oxford), a reaction 5-10 minutes after the dose (205) and its risk factors (210); eptifibatide 180 µg/kg twice 10 minutes apart then 2.0 µg/kg/min, halved to 1 at a creatinine clearance of 60 mL/min or less (Brilakis) or below 50 mL/min with dialysis a contraindication (product information) (1024-1025); tirofiban 25 µg/kg over 3 minutes then 0.15 µg/kg/min, 0.075 at 60 mL/min or less (1031-1032); cangrelor 30 µg/kg then 4 µg/kg/min for at least 2 hours or the procedure (1017), and ticagrelor at any time, clopidogrel or prasugrel immediately after it stops (1124); bivalirudin 0.75 mg/kg, 1.75 mg/kg/h, 1 mg/kg/h below 30 mL/min, 0.25 mg/kg/h on dialysis, half-life 25 minutes, no antidote, the 4-hour run-on only at the normal rate (311-322); the settings that forbid an IV antiplatelet agent (CTO, perforation, SCAD, routine vein graft, 1112-1115); the oral loads (709, 716, 723, 730); in suspected HIT every heparin source stops, flushes and pressure line included (417), the 4Ts and the antibody test (ASH 2018, 412); the HIT variant's platelet counts, 230 and 98 x 10^9/L on day 7 (case pm-antithrombotics-case-hit, 1627 and 1634). Everything below is a MODEL PARAMETER.

## Protamine (doses.ts, actions/drugs.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_OXFORD_LATE_HALF_LIFE_MIN` | 60 | min | Oxford says to give less protamine after 15 minutes without a figure; the lab scales Oxford's range by the heparin left from the 15-minute mark, at Brilakis's 60-minute half-life after 100 U/kg (line 72) |
| `suggestedMg` rule | lowest dose both ranges accept, else Brilakis's lower bound | mg | A single figure to compare with the 50 mg cap; the manuals give ranges |
| `MP_PROTAMINE_REACTION.baseP` | 0.03 | probability per dose | No incidence is stated; slow administration 'lowers the risk' (line 205) |
| `MP_PROTAMINE_REACTION.fastFactor` | 4 | x | Above 5 mg/min the chance rises (direction from line 205) |
| `MP_PROTAMINE_REACTION.overCapFactor` | 2 | x | Above 50 mg |
| `MP_PROTAMINE_REACTION.riskFactor` | 2 | x per listed risk factor | Direction from line 210 |
| `MP_PROTAMINE_REACTION.maxP` | 0.7 | probability | Ceiling |
| `MP_PROTAMINE_REACTION.level` / `levelFast` | 0.7 / 0.8 | share of vascular tone lost (engine setVasodilation) | Systemic hypotension of the reaction (line 205), 'typically severe' (line 1213): set so that a drawn reaction takes a standard lad-focal patient's mean pressure below the lab's 65 mmHg hypotension threshold (patientEvents hypotensionMapMmHg) against the engine's baroreflex (0.55 left it near 80 mmHg), deeper after a fast push; the engine has no public pulmonary vascular resistance setter, so the pulmonary vasoconstriction is not modelled |
| `MP_PROTAMINE_REACTION.riseS` | 60 | s | Onset of the fall once the reaction begins |
| `MP_PROTAMINE_REACTION.halfLifeS` | 600 | s | Recovery |
| Onset draw | uniform over 5-10 minutes | min | The sourced window; the uniform shape is the model's |

## IV agents and the orders (doses.ts, actions/drugs.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_RATE_TOLERANCE` | 0.05 | share of the regimen rate | An ordered infusion rate within 5% of the patient's renal regimen counts as that regimen |
| Applied eptifibatide rule | product information (halved below 50 mL/min) | n/a | The lesson says 'follow the product information'; Brilakis's rate is shown beside it when it differs |
| IV antiplatelet 'running' | from the first bolus or infusion until a stop | n/a | The ACT goal switches to 200-250 s while an agent is being given |
| Legacy GP IIb/IIIa bail-out | listed as running (key `gp2b3a`) from its dose until stopped in the console | n/a | Treated like the named agents so the 200-250 s goal ends when it is stopped |
| Eptifibatide second bolus check | an error once more than the sourced 10-minute gap has passed after the first bolus of an infused course with no second bolus | min | The two-bolus regimen (line 1024); the moment it counts as missed is the model's |
| ACT above the range with an IV agent | an error when a measured ACT exceeds the top of the 200-250 s goal while an IV antiplatelet agent runs | s | The goal range (line 121); request pm-antithrombotics#6 makes 'not pushed above 250 s' a success criterion |
| Stale ACT refusal | the 30-minute refusal in `actGateFor` applies only in a case that declares its antithrombotic context | n/a | A case that declares none keeps the lab's earlier single-gate behaviour. The live supervised device gate (`actions/devices.ts`) and the mentor's `actOk` (`mentor/bridge/pciSession.ts`) still call the legacy two-argument `actGate`, the single 250 s gate, until a package that owns those files switches them to `actGateFor`; in the running lab the device-specific goals and the stale refusal therefore do not yet block a device leaving the guide |
| `DEFAULT_ACT_DEVICE` | HemoTec | n/a | When a case declares no machine, the lab's single 250 s gate (the HemoTec heparin-alone floor) is kept |
| Pre-case heparin | counted as a dose at t = 0 | s | The lab heparinises before the case (setup.heparinised); the recheck clock runs from it until a dose or an ACT is recorded |
| 'low-act' rule | measured or true ACT below the active target, or more than 30 minutes without an ACT | n/a | The plan's tip integration; 30 minutes is the top of the sourced 20-30 minute interval |
| Nurse reminder | from 20 minutes after the last ACT (or dose) | min | The bottom of the sourced interval; Oxford's nurse keeps the ACT on time (line 103) |
| Heparinised flush in HIT | an error from the first injection, wire out of the guide or device introduced while the flush is heparinised | n/a | The lab standard is heparinised saline (line 417); the moment it counts as given is the model's |
| Recheck clock start | from when the ACT sample was drawn when the record states it (`recordAct` `sampleT`; `recordTeamAct` sets it to the report time less the ACT value, since the scrub reports when the sample clots), else from the record | s | The ACT describes the blood at the sample; the session's team-ACT path still records without the sample time until it calls `recordTeamAct` (reported to the session owner), so on that path the clock runs from the result |
| Debrief ACT target line | one span per regimen or machine change, each from the record that began it, rounded down to the minute | min | The targets that applied over the case rather than the one in force at sign-out |

## Drugs console (DrugsConsole.tsx)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_PROTAMINE_PORTION_S` | 10 | s | The engine has no protamine infusion: an order given over N minutes reaches it in equal portions every 10 lab seconds over those minutes (a push at once); its protamine binds heparin over about 30 s, so the reversal follows the ordered rate |
| Context declaration | the run's variant context is written as case setup outside the attending's gate when the console opens, retried on each lab step until present | n/a | Case setup is not an operator action; the session should declare it at construction (reported to the session owner) |

