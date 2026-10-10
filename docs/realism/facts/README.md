# Realism facts

This folder records where the simulator's numbers come from. A value in the code either cites its source (the module text in `src/content/manual/**`, a lab request, or a paper listed in one of these files) or is labelled MODEL PARAMETER in the code and listed here with what it rests on.

- Stream and track files (`S0.md` to `S13.md`, `C1.md` to `C4.md`, `I1.md` to `I4.md`) cover the engines built before the lab build.
- `pci-equipment.md` covers the device catalogue (`src/simulation/pci/equipment.ts`).
- `pkg-<package id>.md` files cover the lab build's work packages (docs/curriculum/LAB_BUILD_PLAN.md), one file per package that added model parameters.

`facts/C3.md` and `facts/C5.md`, which some older code comments name, were never written. The sourced values that `src/simulation/access/closure.ts` attributed to `C5.md` are now listed in `pkg-access-closure-femoral-manual.md`.

## Model parameters of the lab build's runs 1 to 3

Packages accepted in runs 1 to 3 labelled their model parameters in code but could not list them here, because this folder was not among their files. The files below were written afterwards from the code as it stands (repair-model-parameter-facts). Each lists the constant, its file, its value and unit, and what it rests on.

| File | Package |
|---|---|
| `pkg-access-closure-femoral-manual.md` | Femoral closure algorithm and hands-on compression; also the sourced values of closure.ts |
| `pkg-access-femoral-puncture.md` | Femoral puncture: groin anatomy, needle, micro-wire, scoring and scenarios |
| `pkg-access-femoral-upsizing-angiogram.md` | Upsizing to a femoral sheath and the femoral angiogram |
| `pkg-access-multi-site.md` | More than one access site; the crossover scenario |
| `pkg-angio-expert-label-drills.md` | Expert-label drills and the simulated TIMI flow drill |
| `pkg-diag-anatomy-variants.md` | Anomalous origins, high ostia, separate conus, very dilated root, fistula |
| `pkg-diag-engagement-fallback.md` | The difficulty-free engagement thresholds and the conus check |
| `pkg-diag-lab-drugs.md` | Drugs in the diagnostic lab |
| `pkg-diag-lesion-morphologies.md` | SCAD, CTO, thrombus and collateral drawing |
| `pkg-diag-lv-aorta-render.md` | Ventriculogram, aortogram and iliofemoral run |
| `pkg-diag-pressure-transducer.md` | Pressure-line faults, the physiologist's call-out, pressure scenarios |
| `pkg-diag-rod-physics.md` | Rod physics in the diagnostic lab |
| `pkg-diag-scenario-registry.md` | Diagnostic scenario registry and script module |
| `pkg-diag-tip-context.md` | Diagnostic lab tip context |
| `pkg-found-lab-session-plumbing.md` | Patient-event thresholds, event holds, logbook bounds |
| `pkg-haemo-aortic-stenosis-studies.md` | Crossing the stenotic valve; aortic stenosis studies |
| `pkg-haemo-study-session-and-tips.md` | Haemodynamic study grading and five teaching scenarios |
| `pkg-haemo-transducer-and-setup.md` | Haemodynamic line set-up and the fast-flush test |
| `pkg-pci-bench-bifurcation.md` | Bifurcation bench |
| `pkg-pci-bench-imaging-unify.md` | Shared IVUS and OCT frames on the bench |
| `pkg-pci-bench-stent-platforms-sizing.md` | Stent platforms A to E, sizing and positioning presets |
| `pkg-pci-scenario-registry.md` | PCI scenario registry and the 'wire across' start |
| `pkg-pericardiocentesis-tips-and-pci-handover.md` | Perforation scenarios and the hand-over from the PCI lab |
| `pkg-physiology-engine-unify-and-setup.md` | Pressure-wire session, set-up faults and the physiology lab host |
| `pkg-proc-anaphylaxis-vagal.md` | Contrast reactions, vasovagal reactions and their mimics |
| `pkg-proc-foundation-scenarios-ledger.md` | Autopilot settings of the full case |
| `pkg-proc-hypotension-pressors.md` | Hypotension causes, pressors and oedema |
| `pkg-proc-tip-context.md` | Full-case tip context |
| `pkg-structural-tips-and-tavi-course.md` | TAVI post-deployment course and the coronary obstruction scenario |
| `pkg-structural-transseptal-hands-on.md` | Hands-on transseptal puncture |
| `pkg-xray-device-fluoro-views.md` | Device fluoroscopy: device sizes, materials, venous course |

Not covered here, and why: found-patient-formulary and pci-device-catalogue recorded their own (`S9.md`, `pci-equipment.md`); pci-engine-modularise and found-mentor-registries moved existing constants without changing them (`MENTOR_PARAMS` is in `S11.md`); mcs-console-split-select-and-tips used module thresholds and labelled no model parameter; the other accepted packages added none. pacing-in-lab-scenarios-and-tips and pci-lab-shell-session were not accepted in runs 1 to 3. The five packages resumed in run 4 (proc-chart-planted-problems, pci-bench-measure-and-plan, diag-study-report, physiology-hyperaemia-and-adenosine, physiology-left-main-and-ostial) record their own.
