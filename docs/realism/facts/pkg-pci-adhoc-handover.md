# pci-adhoc-handover: model parameters

Ad hoc PCI on the lesion the full case diagnosed: the PCI scenario built from the case (`src/simulation/pci/scenarios/fromCase.ts`), the PCI lab's hand-over path (`src/ui/pci/PciLab.tsx`: `caseLaunchFor`, `prepareHandedOver`, `caseReportOf`) and the case's side of the return (`src/simulation/session/caseSession.ts`: `toPci({ target })`, `stageLabReport`, `returnFromLab`, `pciOutcome`, `pciFollowUp`).

No dose, ACT goal or device dimension is defined by this package. The heparin top-up and the ACT target come from the case (`pciReady`, `SOURCED_PCI_HEPARIN` and `actTarget()`, see pkg-proc-heparin-act-handover.md); the supervised device gate is the PCI engine's (`actGate`, src/simulation/pci/lesionAssessment.ts, `ACT_TARGET_S`); stents are reported at the catalogue's nominal diameter and labelled length (src/simulation/pci/equipment.ts).

## Values taken from code elsewhere (not new parameters)

| Value | Where it is used | Rests on |
|---|---|---|
| Default guide: EBU3.5 for a left target, JR4 for a right target; working views of the core scenario for the vessel | `scenarioFromCase`, read at run time from the registry (`pciScenarioDef`) | The core pack's lad-focal, lcx-stemi and rca-calcified definitions (src/simulation/pci/scenarios/packs/core.ts) |
| Start states (catheter in the root, guide engaged, wire across) | `scenarioFromCase` | `STANDARD_PCI_STARTS`, packs/core.ts; the first is retitled "Diagnostic catheter in the aortic root" when the hand-over names one |
| ACT target for clearing 'low-act' | `prepareHandedOver` | The case's `pciReady.actTargetS[0]` (else `anticoag.targetS[0]`, else `ACT_TARGET_S` 250 s) |

## Model parameters (`MP_FROM_CASE` and `finalTimiOf`, fromCase.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `defaultLengthMm.occlusion` | 18 | mm | A case lesion without a length (the PCI engine needs one to size devices) gets the median lesionsFromProfile draws for a total occlusion (log-normal median 18 mm, src/simulation/patient/patient.ts). Full-case lesions always carry a length, so this applies only to hand-built cases |
| `defaultLengthMm.other` | 12 | mm | As above, the median for every other lesion (log-normal median 12 mm) |
| `tortuousVariants` | tortuous-rca, shepherds-crook-rca | - | Case variants that set the PCI anatomy's tortuosity grade to 1 (moderate); every other case is grade 0. A model choice, not from a source |
| `minorWhenTreated` | dissection, side-branch, air | - | A reported complication of these kinds is graded minor when it was treated or resolved by the end of the lab; any other kind, and any complication left untreated, is major. A model choice for the LabReport's two-level severity; neither manual grades it this way |
| Final TIMI from the engine state | occluded (residual 100%) 0; a live no-reflow at the engine's own grade for its severity; slow flow 2; else 3 | TIMI grade | The no-reflow grade is `timiFor` of src/simulation/complications/noReflow.ts (the engine's mapping, not new); the order of the rules and slow flow as TIMI 2 are model choices |
| When a vessel counts as treated (src/simulation/pci/scenarios/fromCase.ts `vesselTreated`) | a stent placed in the lab (not a restenosed stent that came with the case), a predilatation, a completed balloon inflation or a post-dilatation; a wire alone is not | rule | LabReport.finalTimi is null when no vessel was treated (src/simulation/session/handover.ts); which actions count as treatment is a model choice |

## Rules (not numbers)

- The target is the case lesion whose id (`vessel@position`) the study report's PciTarget names; else the most severe lesion on the target's vessel; else the most severe lesion of the case. The debrief says which (`targetCheckText`).
- The culprit is the profile's culprit segment, mapped to the case's lesions only when they are the profile's own (one per graded AngioCAD segment, in segment order); otherwise the case has no culprit to compare with.
- Heparin counts as given in the PCI engine (`setup.heparinised`) when any dose reached the circulation (`deliveredHeparinU > 0`).
- The ACT measured at the hand-over gate is carried into the PCI lab only when it was measured after the last delivered heparin dose; 'low-act' is held from the start until an ACT at the case's PCI target is recorded in the lab.
- A bystander lesion on a vessel the PCI lab's coronary tree lacks is dropped (the PCI geometry needs every lesion on a tree vessel); the target is never dropped, and a target the tree cannot place falls back to the most severe lesion the tree can place, marked 'unplaced' (the brief and the debrief name the report's choice and the lesion treated). The definition's id, which seeds the lab's tree, is keyed on the lesion the report named, so the fallback keeps the same tree.
- Post-dilatation in the LabReport: the engine records it for the lab (`counters.postdilatedInStent`), not per stent. With none, every stent is reported as not post-dilated; with one and a single stent, that stent is; with several stents the field is left out (not known which).
- A returned PCI's complications join the case's list as `pci-<return number>-<engine id>`, marked `source: "pci"`; the case's pass rule (no critical error and no major complication) counts only the case's own, since the PCI lab grades its own. The finish flags are not held as case events (an access context would read a coronary perforation or dissection as an access complication); `moduleTipContexts()` gives them to a PCI finish context for the rest of the case.
- The finish flags the case keeps (`PCI_FINISH_FLAGS`): perforation, dissection, no-reflow, acute-closure, stent-loss, equipment-entrapment, thrombus, air, side-branch-compromise, high-radiation-dose, high-contrast-volume, cto and bifurcation (lab request hb-after-the-procedure#5).
