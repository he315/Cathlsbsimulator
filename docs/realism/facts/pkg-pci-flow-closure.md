# pci-flow-closure: model parameters

Flow failure and abrupt closure in the PCI lab: distal delivery of intracoronary drugs and refractory no-reflow (`src/simulation/complications/noReflow.ts`), embolised thrombus (`thrombus.ts`), the air start (`airEmbolism.ts`), the aortocoronary dissection, the closure start's dissection and re-crossing a dissection (`dissection.ts`), the routed intracoronary drugs (`src/simulation/pci/actions/drugs.ts`), the flow starts, spasm and the manifold check (`src/simulation/pci/actions/bailouts.ts`), pseudolesions and spasm on the image and in the patient effects (`src/simulation/pci/actions/patient.ts`), the event sources (`src/ui/lab/pciEvents/flow.ts`), the syringe's hand bindings (`src/ui/pci/inputBindings/flow.ts`), the flow console (`src/ui/pci/consoles/FlowConsole.tsx`) and the closure pack (`src/simulation/pci/scenarios/packs/closure.ts`).

Doses are not chosen here: the console's teaching aid shows each manual's dose as the module text gives it (`src/content/manual/complication-management/02-flow-embolism.ts:198-203`, and `src/content/manual/pci-manual/04-lab-drugs.ts:250, 374` for nitroglycerin), listed under `IC_AGENTS` in drugs.ts. The lab gives the learner's dose to the patient engine through the shared formulary (`PatientEngine.giveDrug(drug, dose, 'ic')`); verapamil is converted to the formulary's unit (mg). Adrenaline has no intracoronary route in the formulary (`pharmacology.ts`: iv and im), so its intracoronary dose acts on the complication engine only (see the package report). The adrenaline line of the module (02-flow-embolism.ts:222) cites COAR 2022 and the 2026 network meta-analysis, which `src/content/refs.ts` holds (`khan-coar-2022`, `oliveri-noreflow-nma-2026`); the console's teaching aid names each source by book, section and page as the module's evidence file records them (`docs/curriculum/evidence/cm-flow-embolism.md`), the module line kept in a comment beside each entry.

Everything in the tables below is a MODEL PARAMETER unless the "Rests on" cell cites the module text or a lab request.

## No-reflow (noReflow.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_GUIDE_EFFICACY_BY_TIMI` | src/simulation/complications/noReflow.ts | 0.03, 0.08, 1, 1 | fraction of a guide dose reaching the bed at TIMI 0, 1, 2, 3 | The books say drug in the guide refluxes without antegrade flow (02-flow-embolism.ts, pci-no-reflow-distal-vasodilator: Brilakis 19.9, Oxford ch 8) and give no fraction; the plan asks for "near 0". With antegrade flow (TIMI 2-3) the whole dose is taken to reach the bed, so a guide dose for slow flow acts as the engine's older route-less bail-out did. The same factor gates the route-less intracoronary bail-outs (team orders, the assisted console's vasodilator: `bailoutNoReflow`), which are guide injections and which a refractory no-reflow does not answer except for adrenaline |
| Distal efficacy | src/simulation/complications/noReflow.ts | 1 | fraction | Distal delivery reaches the microvasculature (same sources) |
| `MP_IC_AGENT_CUT` | src/simulation/complications/noReflow.ts | adenosine 0.45, verapamil 0.45, nitroprusside 0.45, nicardipine 0.5, adrenaline 0.55, gtn 0 | fraction of the remaining severity a full distal dose removes | Model choice, of the order of the existing `MP_DRUG_RESPONSE`; nitrate 0 because nitrates have not been shown to help no-reflow (02-flow-embolism.ts:203, Oxford ch 8) |
| Extra step per dose | src/simulation/complications/noReflow.ts | 0.05 x min(1, effect / 0.3) | severity | Model choice: a full dose moves at least one grade, as the existing bail-out's 0.05 |
| `IC_LOWEST_DOSE_UG` | src/simulation/complications/noReflow.ts | adenosine 30, verapamil 100, nitroprusside 50, nicardipine 100, gtn 100 | µg | The lowest dose either manual gives (02-flow-embolism.ts:198-201; 04-lab-drugs.ts:250); a smaller dose acts in proportion (`doseFactor`, model choice) |
| `IC_LOWEST_DOSE_UG` adrenaline | src/simulation/complications/noReflow.ts | 50 | µg | Neither manual gives a no-reflow dose (02-flow-embolism.ts:202); 0.05 mg is the dose Brilakis notes for arrest from air (02-flow-embolism.ts:500), used only as the scale of a full dose |
| `MP_REFRACTORY_FROM_SEVERITY` | src/simulation/complications/noReflow.ts | 0.72 | severity at onset (of the drawn 0.3-0.8) | A no-reflow drawn at or above it is refractory to the vasodilators (about 16% of drawn no-reflow); derived from the existing draw so no seed's later draws shift |
| `REFRACTORY_DISTAL_DOSES` | src/simulation/complications/noReflow.ts | 2 | adequate distal vasodilator doses (at or above `IC_LOWEST_DOSE_UG`) without a TIMI rise; a smaller dose does not count | Lab request cm-flow-embolism#1 ("a lab threshold chosen as an example", Brilakis 19.9 gives no number); the adequacy rule is a model choice, so a token dose cannot mark a no-reflow refractory |
| Refractory response | src/simulation/complications/noReflow.ts | vasodilators 0; adrenaline as above | rule | Brilakis 19.9: adrenaline for no-reflow that does not respond to the vasodilators (02-flow-embolism.ts:187) |
| `MP_ANTIPLATELET_CUT` | src/simulation/complications/noReflow.ts | 0.35 | fraction of a thrombotic no-reflow's severity a GP IIb/IIIa inhibitor or cangrelor removes; 0 for plaque debris | Brilakis 25.2 and 5.5: thrombus responds to antithrombotic escalation, plaque embolisation to aspiration and vasodilators (lab request cm-flow-embolism#4); the fraction is a model choice |
| Aspiration of plaque debris | src/simulation/complications/noReflow.ts | the existing `MP_DRUG_RESPONSE['aspiration-thrombectomy']` (p 0.7, cut 0.35) | | Brilakis 25.2: aspirate the debris (tip pci-embol-plaque-aspirate). Only a no-reflow a flow start seeds as plaque debris (`seedNoReflow`) carries `data.plaque`; a no-reflow drawn in any other case keeps the engine's older rules (little is aspirated without thrombus, a later stent does not worsen it) |
| `MP_STENT_OVER_PLAQUE_WORSEN` | src/simulation/complications/noReflow.ts | 0.25 | severity added once when a stent is placed after plaque embolised | Brilakis 25.2: stenting over embolised plaque can release more and deepen no-reflow; the size is a model choice |

## Thrombus (thrombus.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_EMBOLUS_ANTIPLATELET_CUT` | src/simulation/complications/thrombus.ts | 0.4 | fraction of an embolised thrombus's severity a GP IIb/IIIa inhibitor or cangrelor removes | Brilakis 5.5 and 25.2 (tip pci-embol-thrombus-three-steps); the fraction is a model choice |
| `MP_EMBOLUS_CLEARED` | src/simulation/complications/thrombus.ts | 0.35 | severity below which the embolus has cleared | Model choice: two doses clear the engine's embolised thrombus (0.8 or 0.9) |
| Thrombosis at the closure start | src/simulation/complications/thrombus.ts (`seedThrombosis`) | severity 0.9, 6 mm, embolised | | Model choice: the vessel is cut off at the treated segment |

## Air (airEmbolism.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_AIR_START_ML` | src/simulation/complications/airEmbolism.ts | 0.6 | mL in the RCA at the air start | Above the module's `MP_AIR_FULL_ML` (0.4): the territory is occluded at once; the module's harm-scales-with-volume rule |
| `MP_AIR_START_GUIDE_RESIDUAL_ML` | src/simulation/complications/airEmbolism.ts | 0.15 | mL left in the guide | Lab request cm-flow-embolism#5: a second injection before the source check gives a second air event |
| Wire through the bubbles | src/simulation/complications/airEmbolism.ts (`bailoutAir`), src/simulation/pci/actions/bailouts.ts (`wireThroughBubbles`) | the existing dispersal (`MP_AIR_TAU_S` x 0.35) | | Brilakis: the wire moved through the distal branches breaks up the bubbles (02-flow-embolism.ts:939). NOT WIRED: nothing calls `wireThroughBubbles` yet; the wire route (actions/wire.ts moveWire) must call it after an advance in an air case (package report, out of scope) |
| `airLadMl` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.3 | mL in the LAD at the LAD air start | Model choice: a smaller volume after trapping without back-bleeding |
| `airLcxMl` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.3 | mL in the circumflex at the circumflex air start (after the stent of the no-reflow start) | Model choice, as the LAD start; vagal episode as the LAD start, no heart block (the circumflex start is not the RCA's) |
| Air start rhythm | src/simulation/pci/actions/bailouts.ts (`flowStartPatient`) | complete heart block while the RCA air is in the vessel, sinus once it has cleared (`flowPatientRecovery`) | rule | The module lists AV block among the effects of air (airEmbolism.ts header, Suastika 2016, Attachaipanich 2026); the RCA supplies the AV node in a right-dominant patient |
| `airVagalLevel`, `airVagalHoldS` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.9, 40 | level 0..1, s | Model choice: the vagal, hypotensive reaction to air the module describes |

## Dissection (dissection.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_AORTIC_STAIN_START_MM` | src/simulation/complications/dissection.ts | 8 | mm of stain up the sinus at the sinus-stain start | Model choice |
| `MP_AORTIC_STAIN_PER_INJECTION_MM` | src/simulation/complications/dissection.ts | 4 x (1 + force) | mm per injection into the vessel, force from the injection pressure as `propagate` has it | Lab request cm-principles-closure#5: the stain extends when the learner injects again; the size is a model choice |
| `OSTIAL_PROTRUSION_MM` | src/simulation/complications/dissection.ts | 1, 2 | mm of stent in the aorta: at least the first seals; the debrief marks 1-2 mm as intended | Lab request cm-principles-closure#5 ("1-2 mm protruding into the aorta") |
| Aortocoronary dissection at the start | src/simulation/complications/dissection.ts (`seedAortocoronaryDissection`) | 3 mm from the ostium, 6 mm long, NHLBI C, severity 0.6 | | As the module's own guide dissection (`maybeGuideDissection`) |
| Closure start's dissection | src/simulation/complications/dissection.ts (`seedClosureDissection`) | NHLBI F (D in the rescue and the flow-state starts), severity 0.9 (0.75 for D), 1.3 x the lesion length (1.4 x in the rescue start; 8 mm at the edge) | | Model choice; the flow-state start's edge dissection is type D, not the request's type C, because the engine's flow limit for C (0.1) leaves TIMI 3 and the request asks for slow flow |
| `MP_RECROSS_SUBINTIMAL` | src/simulation/complications/dissection.ts | A 0.02, B 0.08, C 0.2, D 0.35, E 0.45, F 0.6 | chance a wire re-crossing an unsealed dissection tracks into the false lumen | Model choice, rising with the NHLBI type; lab request cm-principles-closure#3 |

## Starts and spasm (bailouts.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `CLOSURE_MECHANISMS` | src/simulation/pci/actions/bailouts.ts | dissection 0.3, plaque embolisation 0.25, thrombosis 0.2, spasm 0.25 | relative weights | Model choice; the mechanisms are lab request cm-principles-closure#2's (pseudolesion, haematoma and the balloon hiding the vessel are not drawn yet) |
| `FLOW_STATES` | src/simulation/pci/actions/bailouts.ts | edge dissection, no-reflow, normal flow, equal weight | | Lab request pm-interpreting#2 (underfilling and the trapping manoeuvre are not modelled yet) |
| `predilatedPct`, `stentedPct` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 40, 10 | % diameter stenosis after predilatation, under the stent | Model choice |
| `noReflowSeverity`, `noReflowRefractoryP` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.95 (TIMI 0), 0.25 | severity, chance | Lab request pm-interpreting#2 (TIMI 0-1 after stenting a thrombus-laden lesion); the chance is a model choice |
| `closurePlaqueSeverity`, `plaqueSeverity`, `flowStateNoReflowSeverity` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.92 (TIMI 0), 0.7 (TIMI 1), 0.65 (TIMI 1) | severity | Model choice |
| `closureSpasmPct`, `wireSpasmPct` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 90, 65 | % stenosis | Model choice |
| `thrombosisActS` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 180 | s | Below the 250 s heparin-alone target (thrombus.ts `ACT_TARGET_S`, 2011 ACCF/AHA/SCAI via S9); lab request cm-principles-closure#2 (low ACT, failed venous line) |
| `stainGuideDepthMm`, `stainGuideCoaxial` | src/simulation/pci/actions/bailouts.ts (`MP_FLOW_START`) | 0.5, 0.9 | mm, 0..1 | Model choice: the guide eased back from the deep seat that caused the stain to a free, coaxial one, so the trace is not damped (guide.ts `guideDamps`) and further RCA injections are possible and enlarge the stain |
| Placed stent at the no-reflow start | src/simulation/pci/actions/bailouts.ts (`placeStent`) | reference diameter to the nearest 0.25 mm (2.5-4), lesion length + 4 mm from 2 mm before it | mm | Model choice |
| `MP_SPASM.visiblePct` | src/simulation/pci/actions/bailouts.ts | 25 | % stenosis below which a spasm is not a new narrowing | Model choice |
| `MP_SPASM.fullDoseUg` | src/simulation/pci/actions/bailouts.ts | gtn 100, verapamil 100, nicardipine 100 | µg that relaxes a spasm fully (smaller in proportion) | Nitroglycerin: the lowest of Brilakis's 100-300 µg (04-lab-drugs.ts:250, Brilakis 3.2, 25.2); the calcium channel blockers: Brilakis lists them as a treatment without a spasm dose (04-lab-drugs.ts:290), so the lowest no-reflow dose of the module's table is used (02-flow-embolism.ts:198, 200) |
| `MP_SPASM.reliefDelayS` | src/simulation/pci/actions/bailouts.ts | 30-120 | s from the dose to the relaxation, drawn | Tip pci-closure-spasm (Brilakis 25.2, 6.3): allow up to 2 minutes; lab request cm-principles-closure#2; the lower bound is a model choice |
| `MP_SPASM.closurePct`, `MP_SPASM.slowPct` | src/simulation/pci/actions/bailouts.ts | 85, 70 | % stenosis from which a spasm closes the vessel (TIMI 0-1, acute-closure) and slows it (TIMI 2, slow-flow) | Model choice |
| `spasmOcclusion` | src/simulation/pci/actions/bailouts.ts | (stenosis - 50) / 45, 0..1 | fraction of flow taken away (the patient engine's occlusion) | Model choice |
| Spasm agents | src/simulation/pci/actions/bailouts.ts (`SPASM_AGENTS`) | glyceryl trinitrate (nitroglycerin), verapamil, nicardipine | | Brilakis 25.2 and 6.3: intracoronary nitroglycerin or a calcium channel blocker (tip pci-wire-spasm-nitrate) |

## Drugs, image and hands

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Distal tip | src/simulation/pci/actions/drugs.ts (`distalDelivery`) | a microcatheter out of the guide on the target route with its tip at or beyond the start of the treated segment; a tip short of it delivers as the guide does | rule | Model choice: the drug must be given beyond the segment (lab request cm-flow-embolism#0) |
| `MP_PSEUDOLESION` | src/simulation/pci/actions/patient.ts | 55, 4 | % stenosis, mm on the image at each site the wiring record lists | Model choice; the sites are pci-wire-microcatheter's (`pseudolesionSites`); drawn, not given to the patient engine |
| `IC_PLUNGER_ON` | src/ui/pci/inputBindings/flow.ts | 0.08 | plunger force or pull, 0..1 | The PCI input target's `PCI_PLUNGER_ON` (pkg-pci-lab-input) |
| `MP_FORCEFUL_FLUSH` | src/ui/pci/inputBindings/flow.ts | 0.6 | plunger force, 0..1 | Model choice: the push on the manifold's saline port at or above which a flush counts as the forceful saline injection the air bail-out asks for (Brilakis p.111: repetitive forceful saline injections, 02-flow-embolism.ts); the books give no force. It acts only with air in the vessel; the ordinary flush always runs |
