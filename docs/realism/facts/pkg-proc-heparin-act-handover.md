# proc-heparin-act-handover: model parameters

The hand-over gate before ad hoc PCI (`src/simulation/session/caseSession.ts`, the section headed "the hand-over gate before ad hoc PCI"), the order section `src/ui/access/orders/Heparin.tsx` and the scenarios in `src/simulation/session/scenarios/heparin.ts`.

## Sourced values used (not model parameters)

| Value | Where it is used | Source |
|---|---|---|
| PCI heparin 70-100 U/kg; 50-70 U/kg with a GP IIb/IIIa inhibitor or cangrelor | `SOURCED_PCI_HEPARIN`, caseSession.ts | Lesson pm-antithrombotics-heparin, src/content/manual/pci-manual/03-antithrombotics.ts:64-65 (Brilakis 3.4 and 20.3) |
| ACT goals: heparin alone on a HemoTec 250-300 s; with an IV antiplatelet agent 200-250 s (a Hemochron figure, applied to the HemoTec and flagged as not specified) | `actTarget()` and `ACT_TARGETS_S`, src/simulation/pci/lesionAssessment.ts (pci-antithrombotic-orders), read through `CaseSession.pciActTarget()` | 03-antithrombotics.ts:119-121 |
| A low ACT may be a failed or tissued IV line; redose through the arterial sheath if the line is doubtful, and remeasure before any coronary device | the tissued line, the side-arm route and the `low-act-line-checked` decision | 03-antithrombotics.ts:88, 98, 151, 245 |
| Contrast ceiling by the stricter rule (Brilakis 3.7 x GFR less recent contrast; Oxford 5 mL/kg) | the `ckd-budget-adhoc` budget, `contrastBudget()` in src/simulation/patient/contrastBudget.ts (found-patient-formulary) | 05-patient-complications.ts:698-711, as that module cites |

## Gate settings (`MP_PCI_GATE`, caseSession.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `actDevice` | HemoTec | - | The case's ACT machine. The full case has always used the 250-300 s goal (`SOURCED_DOSES.pciActS`), which is the HemoTec heparin-alone range; the lab declares no other machine |
| `doseToleranceU` | 500 | U | A total heparin dose within 500 U of the weight-based range counts as in it: doses are drawn up in round numbers. `pciTopUpU()` rounds the top-up up to the next 500 U, so the total it names is never below the lower U/kg bound (at 95 kg after 5000 U: 2000 U, 7000 U in all, 74 U/kg). Neither manual gives a tolerance |
| `tissuedChance` | 0.03 | probability per case | The rare tissued IV cannula, drawn once, at the first PCI bolus given IV at the gate or the first look at the cannula at the gate, whichever comes first (the same draw either way), from the case's own random stream (`iv-line:<seed>`), in a case whose scenario does not set the line. A look before the gate finds the line running and leaves it undrawn. Neither manual gives a rate |
| `inspectS` | 15 | s | Time to look at and flush the IV cannula |
| `resiteS` | 120 | s | Time to put in a new IV cannula |

The gate holds the case (the attending stops it) in guided and supervised mode until an ACT at or above the target's lower bound has been measured after the last heparin dose; independent and exam runs go on and the decision is scored. Only the lower bound holds the case or fails `pci-act-before-wiring`: an ACT above the target's upper bound passes and is scored correct, with the overshoot named in the decision's given text ("ACT 342 s, above the 250-300 s target range"), and in guided mode the attending says it is above the range and that no more heparin is needed. This is a session rule, not a clinical value.

The gate's tips (`gateTips()` in Heparin.tsx, from `pciGateTipContext()`): the context is the PCI plan and wire phases with only the gate's own events (`PCI_GATE_EVENTS`: 'low-act', 'high-contrast-volume'), and the list keeps the tips those events raise and the tips of lesson pm-antithrombotics-heparin, best first, at most three. The case's other events (chest pain, ST change) stay with the case panel's tip contexts.

## The tissued cannula

A dose given IV into a tissued cannula does not reach the circulation: the session does not pass it to the patient engine, so the ACT stays where it was (it falls slowly as the heparin already given is cleared). The dose is charted as given (`HeparinDose.delivered` is false in the hand-over's `anticoag.doses`; the live screen never shows it). This is a model of "the drug never reached the circulation" (03-antithrombotics.ts:88), not a fraction from a source.

## Scenario settings (scenarios/heparin.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| seeds | `heparin-adhoc-heparin-1`, `heparin-adhoc-gpi-planned-1`, `heparin-tissued-cannula-7`, `heparin-ckd-budget-adhoc-1` | - | Fixed patients. The tissued case's seed was chosen so that the access dose leaves the ACT below target (about 190 s) and a 5000 U side-arm redose reaches it |
| `HEPARIN_CASE_WEIGHT_KG` | 95 | kg | With the 5000 U access dose (`SOURCED_DOSES.radialHeparinU`) about 53 U/kg: short of 70 U/kg, within 50-70 U/kg, so the PCI dose differs with and without the planned GP IIb/IIIa inhibitor |
| `CKD_CASE.creatinineUmolL` | 200 | µmol/L | An eGFR of 25 mL/min (CKD-EPI 2021, recomputed by `applyProfileOverrides`) for this seed's patient |
| `CKD_CASE.weightKg` | 72 | kg | - |
| `CKD_CASE.ctMl`, `ctDaysAgo` | 40, 2 | mL, days | The CT two days before (the request's example), counted by `contrastBudget()` within its 7-day window |
| `CKD_CASE.diagnosticMl` | 48 | mL | The diagnostic study's contrast, leaving a few mL of the stricter-rule budget for the PCI |

The resulting budget, the same on the test path (`newCaseSession`) and the store's path, in every mode (pinned in caseSession.test.ts): Brilakis 3.7 x 25 = 92.5 mL, less the CT's 40 mL = 52.5 mL (Oxford 5 mL/kg x 72 kg = 360 mL, less 40 = 320 mL, is the looser rule), rounded down to a 52 mL budget; 48 mL used, 4 mL left at the gate.
