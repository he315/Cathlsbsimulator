# CathMaster lab build plan

Written 8 October 2026 for the owner and for the agents who will build it. It merges four group plans (PCI lab; diagnostic lab, view trainer and real angiograms; full case and access; the other labs: IVUS and OCT bench, pressure wire, haemodynamics, mechanical support, structural and bedside) into one build order. The machine-readable copy with the full design of every package is docs/curriculum/lab-build-plan.json; this file and that one list the same packages.

The 48 modules wrote 443 lab requests (155 P1, 191 P2, 97 P3). The plan has 159 work packages (112 P1, 36 P2, 11 P3). Every request is assigned to at least one package, and every P1 request to at least one P1 package; six requests are declined in part (section 7). The schedule runs in 57 waves of at most three packages, and the last P1 package lands in wave 39. This revision answers a review of the first version; section 9 lists what changed and why.

## 1. Goals

- Procedures that feel real. Catheters, guides, wires and devices move by mechanics; devices are taken from a cart, prepared, backloaded and introduced through the valve; balloons inflate on an indeflator over seconds; the guide backs out when a stent is pushed against a calcified bend.
- The patient responds to what was done. Physiology follows the lumen actually treated, opacification follows coronary flow, complications arise from technique (a damped injection, an unaspirated sheath, a forced wire) rather than from fixed rules.
- The labs stop revealing the answer. The learner measures, grades and names; the screen shows only what an operator would see; truth appears in the debrief.
- Teaching at the moment it applies. Every lab reports its phase, events, technique step and procedure so that the lab tips from the 48 modules appear when they are relevant, and disappear in exams.
- Mentoring. The attending runs a pre-brief and plan, time-out, safety stops, sign-out and a PEARLS debrief in the diagnostic lab, the PCI lab and the full case, and every scored decision links to the lesson that teaches it.
- One patient across the case. Diagnostic study, ad hoc PCI on the diagnosed lesion, closure, ward and discharge happen on the same anatomy and the same patient engine, with heparin, contrast and complications carried forward.
- Practice on demand. Every lesson and case opens the lab on the scenario that practises it, from the day that scenario lands.
- Honest progression. Held-out exams raise simulator entrustment above level II, with wording that matches the disclaimer.
- Sourced numbers. Every dose, threshold and device dimension cites the module text or is labelled a model parameter.

## 2. Rules every package follows

- Edit only the files the package lists, plus new test files. If another file must change, stop and report rather than editing it; the schedule depends on the lists being true. An assertion that would go into an existing test file another package owns goes into a new test file of this package instead.
- Dependencies are complete, not merely enough for the wave order. A package that lists a file in a glob-registry folder depends on the package that creates the registry; a package that lists a new file which another package creates first depends on that package; a package that names a shared module in its design (contrastBudget, patientEvents, giveDrug, PhysicsDevices, pwSession, practiceIndex and the others in section 6) depends on its creator. Section 6 describes the check that enforces this, so a free slot can take a package from further down the list without starting it before its foundation exists.
- Registries are discovered by glob (import.meta.glob with eager loading), so a package adds a file instead of editing a shared index. This covers PCI scenario packs (src/simulation/pci/scenarios/packs/), PCI consoles (src/ui/pci/consoles/), PCI device drawing (src/ui/pci/render/), PCI input bindings (src/ui/pci/inputBindings/), PCI event sources (src/ui/lab/pciEvents/), physics implementations (src/ui/physics/impl/), diagnostic scenario packs (src/simulation/diagnosticScenarios/) and session modules (src/ui/sim/modules/), full-case scenarios (src/simulation/session/scenarios/) and session modules (src/simulation/session/modules/), chart and order sections (src/ui/access/chart/, src/ui/access/orders/), table-side tabs (src/ui/lab/controls/tabs/), mentor rule files (src/mentor/rules/), debrief checks and sections (src/mentor/debriefChecks/, src/ui/mentor/debrief/), dev-lab presets (src/content/lab/presets/<lab>/) and practice link files (src/content/practice/). Scripts that touch content run with vite-node, as scripts/content/status.ts already does (scripts/README.md says so); content.test.ts, reachability.test.ts and the runtime practice index may glob the .launch.ts files and the event sources.
- Links are data. A package's lesson and case links are the lessonIds and caseIds in its .launch.ts: its scenario pack, its dev-lab preset, or src/content/practice/<package-id>.launch.ts when it adds a start state or a drill to a scenario it does not own. The practice index (found-launch-links) turns them into 'Practise this in the lab' entries under each lesson and case the day the package lands. Only found-tip-retarget, tip-retarget-catchup and the three content-links packages edit lesson module files.
- Event, phase, procedure and technique names come from found-tips-vocabulary. A package that needs a new name does not add it; it asks for a small vocabulary amendment, which is scheduled like any package.
- Tip integration is tested, not only described. Each PCI event source, diagnostic and full-case session module and lab tip-context file exports raises (for PCI event sources it is derived from the file's PCI_EVENT_SOURCES), and the reachability report reads those exports; no package keeps a hand-written list of what it raises, and no feature package edits waiting.ts. Every package that raises events or phases has an acceptance test that drives a named scenario, checks that two named tips appear, and checks that the waiting.ts entries naming the package become satisfiable.
- No dose, threshold, device dimension or citation from memory. Each value carries a source location from the module text or is labelled MODEL PARAMETER in docs/realism/facts (HANDOVER 6.4: about 150 dose statements are unaudited). Where Brilakis and Oxford differ, both are shown with their sources. Drugs are added only by found-patient-formulary; later packages call giveDrug and do not edit pharmacology.ts.
- No ground truth on live screens outside guided teaching aids, which follow labScreens. Complications are named only after the learner's assessment, except VF and tamponade cues, which stay immediate.
- Hands, not panels. Every action an operator does with the hands in the PCI lab (advance, withdraw, torque, pin, inflate by screw, aspirate, inject) is bound through pciInputTarget, by a file in src/ui/pci/inputBindings/, and is reachable without opening a console. Consoles show device read-outs and settings only. Forms (plan, time-out, recognition, sign-out, CTO planning) are attending dialogue in supervised and independent mode and block the procedure only in guided mode and exam.
- Generic device names in UI chrome (HANDOVER 6.5). Lesson and case text is unchanged.
- Shared engines (PatientEngine, circulation.ts, transducer.ts, rhythm, pharmacology) keep their defaults, so labs a package does not touch behave as before. Run the patient, team, lab and mentor tests by file after any change to them.
- Renderer files are measured against a baseline. A package that lists a file under src/render/xray/ or src/ui/pci/render/, or pciDevicesRender.ts, PciLiveMonitor.tsx, src/ui/sim/FluoroView.tsx or src/dev/xrayCapture.ts, depends on realism-baseline, makes additive changes, re-captures the baseline set and closes only if scripts/realism/compare_sets.py baseline <set> shows no more than 2 rows lost, with every re-scored row listed in its notes. The agent runs the capture through the dev hooks; if the machine cannot, the owner runs it before the package is closed.
- Machine limits: at most three agents at once; tool calls under about two minutes; tests by file, never the whole suite; typecheck with npx tsc -p tsconfig.app.json --noEmit. The browser pane pauses requestAnimationFrame when hidden, so every lab is checked through its dev hooks (window.__lab, __pciDraw, __pciStep, __fluoroDraw, __labStep, __caseSession).

## 3. Shared foundations first

These run before any lab work. They replace parts of the four group plans that each group designed separately, and two of them (realism-baseline and progression-labels) exist so that the image and the progression screens are honest from the start.

| Package | What it gives every lab | What it replaces |
|---|---|---|
| found-tips-vocabulary | One set of LabContext and TipTrigger fields (phases, procedures, technique, step, imaging), alsoIn for borrowed tips, tipsForAll for the full case, wider access routes, bedside stage phases and every new event, with naming conflicts settled | The vocabulary parts of pci-tip-vocabulary, diag-tip-context, proc-tip-context and tips-procedure-vocabulary |
| found-tip-retarget | Every trigger edit whose names the labs raise by the end of phase 1, in one pass, with no caution or bailout tip lost from a complication context; the other requested edits recorded as data in waiting.ts for tip-retarget-catchup; the reachability report, read from the labs' own raises exports | The retargeting in four plans, which touched the same module files |
| found-launch-links | One deep-link shape (sim block params, CaseStudy.practice, a pending-launch store for every lab), validation against engine-free .launch.ts files, the held-out rule, the registries-by-glob rule and the runtime practice index that lists each scenario under its lessons and cases | requestPciLaunch and PCI_LAUNCH_KEYS; the diagnostic scenario and seed fields; the full case's requestScenario; the dev labs' preset and takeLabPreset |
| found-lab-session-plumbing | One event log with hold windows, one engine-vitals-to-events adapter, one tip hook and panel with the visibility policy, one run-logging call with case id, mode, decisions and metrics, the decision ledger type and the dev hooks | The diagnostic LabEventLog, the PCI EventLatch, the full case's panel and ledger, the dev labs' useLabSession |
| found-case-model-types | Shared lesion, collateral, graft, anatomy-variant and chart types | Separate lesion definitions in the diagnostic and PCI plans; eight packages editing src/types/index.ts |
| found-patient-formulary | Every new drug, infusion, interaction and reversal agent (with nitroprusside and the oral antiplatelets), the heparin half-life fix, rightHeart() and one contrast-ceiling module | Drug additions in pci-antithrombotic-orders, diag-lab-drugs, diag-contrast-ceilings-oedema, proc-engine-formulary and proc-heparin-act-handover |
| found-lab-controls-registry | Table-side controls as glob-discovered tabs behind a lab-agnostic target | Eight packages editing TableSideControls.tsx; the LabControlsTarget refactor inside the PCI lab shell |
| found-mentor-registries | Rule files, debrief checks and debrief sections as registries, the ledger tab and the skill-card scheduling fix | Five diagnostic packages, the PCI attending and the reflection step all editing rules.ts, debrief.ts and Debrief.tsx |
| realism-baseline | A scored baseline of the renderer as it stands, with PCI devices and the live lab render paths in the capture set | The rule that renderer packages ask the owner to re-run a capture, which had nothing to compare with |
| progression-labels | Level labels that name the simulator, and diagnostic levels III and IV on the mentor's standards | The label and gating fix that waited inside progression-exams (P2) |
| found-handover-contract | Types for what passes between labs and a store for stand-alone transfers with an engine snapshot | The hand-over parts of pci-adhoc-handover, the full case's contract and labs-presets-and-handover |

The shared items the brief named map onto these as follows.

- Lab context and tip-event plumbing: found-tips-vocabulary, found-tip-retarget and found-lab-session-plumbing, then one context package per lab (pci-tip-context, diag-tip-context, proc-tip-context, and the context functions inside haemo-study-session-and-tips, mcs-console-split-select-and-tips, structural-tips-and-tavi-course, pericardiocentesis-tips-and-pci-handover, pacing-in-lab-scenarios-and-tips, pci-bench-imaging-unify and physiology-engine-unify-and-setup), and tip-retarget-catchup once the later events exist.
- Scenario registry and deep links: found-launch-links for the shape and validation; pci-scenario-registry, diag-scenario-registry and proc-foundation-scenarios-ledger for the three procedure labs; per-lab preset files in the dev-lab packages; the practice index lists every scenario under its lessons from the day it lands, and content-links-backfill (P1), content-links-backfill-p2 and content-links-backfill-p3 make the inline lesson blocks agree with it.
- Input system: pci-lab-shell-session moves the PCI lab onto the full-screen shell and pci-lab-input moves it onto the S8 input system (hands, pedals, gamepad, MIDI, HID, haptics with a real force signal from deliver(), and a registry of hand bindings that device packages extend); diag-engagement-fallback removes difficulty from the analytic engagement model and defines the physics interface; diag-rod-physics routes the diagnostic hand commands to the rod solver; pci-two-rail-engine adds the second wire and balloon slots. The full case and the dev labs keep their own keys in this plan (see risks).
- Attending and debrief: found-mentor-registries, then pci-attending for the PCI lab, rule files in the diagnostic packages, the full case's ledger in proc-foundation-scenarios-ledger, and debrief-reflection for all three.
- Case hand-over: found-handover-contract, then diag-study-report (the target is chosen here and nowhere else), proc-heparin-act-handover, proc-adhoc-gate and pci-adhoc-handover for the full case, and the stand-alone transfers in pci-perforation, pericardiocentesis-tips-and-pci-handover, physiology-post-pci-handover and pci-shock-chain.

## 4. How the overlaps were resolved

- Event names. Case and scenario properties are events raised for the whole case and gated with requires; the diagnostic plan's separate flags field is dropped. 'cto' replaces 'chronic-occlusion'; 'in-stent-lesion' replaces 'isr'; 'scad-suspected' replaces 'scad'; 'av-block' replaces 'heart-block'; 'vt' and 'atrial-fibrillation' replace their longer and shorter variants; 'perforation-collateral' replaces 'collateral-perforation'; 'new-narrowing-tortuous' replaces 'pseudolesion'; 'wire-misdirected' replaces 'wire-wrong-branch'; 'wire-resistance' replaces 'iliac-resistance'.
- Cross-lab tips. Two mechanisms are kept, each for its case: alsoIn (with the borrowing lab's phases) for the 32 PCI, access, haemodynamic and structural tips the diagnostic lab shows, and tipsForAll for the full case, which genuinely spans the access, diagnostic, PCI and haemodynamic labs.
- Deep links. Four designs became one params shape and one launch store (found-launch-links).
- Imaging. The bench and the PCI lab now share one frame generator (pci/ivus.ts), one criteria function and one renderer, built by pci-bench-imaging-unify; pci-intravascular-imaging adds only the in-lab acquisition. The PCI plan's separate IvusViews extraction is dropped.
- Pressure wire. The physiology lab's session reducer (pwSession.ts) and plots are built once in physiology-engine-unify-and-setup; the PCI console uses them, which retires the second pressure-wire front end.
- Device catalogue and pressures. equipment.ts is the only catalogue; the bench's BALLOON_SPEC is derived from it, which fixes the displayed-versus-applied pressure mismatch.
- Lesion response to dilatation. pci-indeflator creates one lesion-yield model that the bench's timed inflations also use.
- Bifurcation steps. pci-bench-bifurcation defines the step catalogue (technique/steps.ts) that the PCI lab's technique machines and the tips' step numbers share.
- Rod physics. diag-engagement-fallback builds the difficulty-free analytic fallback in engagement.ts and the PhysicsDevices interface with its registry (src/ui/physics/types.ts); diag-rod-physics implements the interface with the solver (src/ui/physics/physicsDevices.ts, registered by src/ui/physics/impl/rod.ts). pci-guide-engagement uses the interface and the fallback, so the PCI critical path no longer waits for the riskiest package in the plan; PCI_ROD_GUIDE switches on only once an implementation meeting its cost threshold is registered.
- Hypotension. One cause model (src/simulation/patient/hypotensionCauses.ts, built by proc-hypotension-pressors) holds causes and their signatures; the PCI lab and the diagnostic rhythm package add their own causes to it.
- Contrast ceilings. One module (contrastBudget.ts, in found-patient-formulary) gives both rules and one warning threshold (80% of the stricter ceiling by default, configurable, with announcements at 50% and 100%) for the PCI lab, the diagnostic lab and the full case.
- Radial spasm. access-radial-sequence creates the one spasm model; diag-spasm-states couples it to the rod physics. The core radial path no longer waits for the physics work.
- ECG leads. diag-acs-scenarios adds the right-sided and posterior leads once; the PCI RV-infarct case uses them.
- Collaterals and grafts. diag-lesion-morphologies builds the collateral channel model and diag-grafts-svg puts grafts in the shared coronary tree; the PCI CTO, retrograde and graft packages use them.
- The ad hoc decision. The target is chosen in the diagnostic study report; the full case's gate scores the decision; the PCI lab builds its scenario from the case. The PCI plan's separate target screen is dropped.
- Held-out exams. pci-progression-exam and labs-heldout-exams are one package (progression-exams), because they edit the same progression files with the same rules. The level labels and the standards rule for diagnostic levels III and IV come first, in progression-labels.
- Content links. Lessons and cases list their scenarios through the practice index as soon as each .launch.ts lands. pci-lesson-deeplink-backfill and proc-content-deeplinks are one package (content-links-backfill), extended to the diagnostic and dev-lab lessons and limited to converting the existing sim and drill blocks for P1 scenarios; a P2 pass and a short P3 pass follow.
- Tip retargets. found-tip-retarget applies only the edits whose names a lab raises by the end of phase 1, or that touch labs which show no tips today, guarded by a superset test on the PCI complication contexts. The edits that need later events are data in waiting.ts; tip-retarget-catchup applies them after the last P1 package that raises them, and content-links-backfill-p2 applies those whose raisers are P2 packages.
- PCI lab shell. The first plan's pci-lab-shell is two packages: pci-lab-shell-session (layout, session, pedal fluoroscopy and cine, stored runs, fresh patient) and pci-lab-input (S8 input, haptics, hand bindings, keyboard handler removal). pci-tip-context needs only the first.
- Large files. angioPci.ts is split into action modules first; panels.tsx, PciBench.tsx, HaemoLab.tsx, McsLab.tsx and PhysiologyLab.tsx are split by the first package that touches them; caseSession.ts gains session modules so that only the core access and closure packages edit it.
- Priority. pci-team-orders moves from P2 to P1 because it alone carries the P1 request pm-monitoring#6; pci-bench-balloon-physics moves to P1 because the P1 in-stent restenosis bench depends on it; content-links-backfill moves from P2 to P1 because practice on demand is a P1 goal, and its P2 part becomes content-links-backfill-p2.

## 5. Phases and work packages

Each block gives what the learner will be able to do, what is built, the requests it covers, its dependencies, its main files, its key acceptance tests, and its size, priority and wave. The full design, the tip integration, the lesson and case links and every file and test are in lab-build-plan.json.

### Phase 0: shared foundations

11 packages that every lab needs. Most are small and change no behaviour; they exist so that later packages add files instead of editing the same shared files, and so that the four labs use one vocabulary, one link shape, one event log, one formulary and one hand-over contract. realism-baseline gives every later image change a score to be compared with, and progression-labels makes the progression screens honest before any lab work.

#### found-tips-vocabulary

**One tip vocabulary for every lab.** M, P1, wave 1. Lab: shared (tip engine).

- Learner: Nothing visible yet; every lab can now describe its moment precisely enough for the right tip to appear.
- Built: A single change to src/content/lab/tips.ts that adds every field, phase, route and event the four group plans asked for, with their naming conflicts resolved, so that no later package edits the vocabulary. Merges the vocabulary parts of pci-tip-vocabulary, diag-tip-context, proc-tip-context and tips-procedure-vocabulary, and the events that diag-route-arch-femoral-variants and diag-grafts-arterial would have added.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (3): src/content/lab/tips.ts, src/content/validate.ts, src/content/lab/tips.test.ts.
- Acceptance: vitest content.test.ts and manual.test.ts pass unchanged (no tip is retargeted here). tips.test.ts: a snapshot of tipsFor for 20 existing diagnostic and PCI contexts (phase only) is identical before and after. tips.test.ts: validateTips rejects step without technique, an unknown procedure, and alsoIn with a phase that is not in the borrowing lab. Plus 2 more in the JSON.

#### found-launch-links

**One deep-link shape for lessons, cases and every lab.** M, P1, wave 1. Lab: shared (content links and navigation).

- Learner: Clicks 'Practise' in a lesson or case and lands in the named lab scenario, start state and mode instead of whatever was last loaded.
- Built: Lessons, cases, the case library and progress screens open any lab at a named scenario, variant, start state and mode through one parameter shape and one pending-launch store. Replaces four separate designs (PCI_LAUNCH_KEYS and requestPciLaunch, the diagnostic sim block scenario and seed fields, the full case's requestScenario, and the dev labs' preset and takeLabPreset). Adds a runtime practice index built from every scenario pack's .launch.ts, so each lesson and case lists the scenarios that practise it from the day the scenario lands.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (10): src/content/schema.ts, src/content/validateLaunch.ts, src/content/content.test.ts, src/state/useUiStore.ts, src/state/useLabLaunchStore.ts, src/ui/content/BlockRenderer.tsx, src/ui/sections/CaseStudies.tsx, src/ui/content/practiceIndex.ts, and 2 more.
- Acceptance: vitest content.test.ts: an unknown scenario id, an unknown start id, an unknown mode and a link to a heldOut scenario each fail validation; existing content passes (no params yet). vitest: openSim('haemo',{scenario:'pe-massive'}) then take('haemo') returns the params once, then null; NavMemory never contains them. practiceIndex.test.ts: a fixture .launch.ts with lessonIds ['x'] gives lesson x one entry with its params; a heldOut scenario is absent; a links entry that names an unknown start fails validateLaunchLinks. Plus 2 more in the JSON.

#### found-case-model-types

**Shared lesion, graft, anatomy-variant and chart types.** S, P1, wave 1. Lab: shared (case and anatomy model).

- Learner: Nothing visible; a lesion, graft or chart means the same thing in the diagnostic lab, the PCI lab and the full case.
- Built: One set of case-model types used by the diagnostic scenarios, the PCI scenario registry and the full case, so that a lesion means the same thing in every lab (the diagnostic plan's cross-cutting request) and src/types/index.ts is edited once instead of by eight packages.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (2): src/types/index.ts, src/types/caseModel.test.ts.
- Acceptance: npx tsc -p tsconfig.app.json --noEmit is clean with no other file changed. caseModel.test.ts: 200 random cases from caseGenerator contain none of the new variants and equal their pre-change JSON for a fixed seed set.

#### found-tip-retarget

**Retarget the lesson tips the early labs can raise, and report reachability.** L, P1, wave 2. Lab: shared (lesson content).

- Learner: Sees tips only in the lab, procedure, technique step and scenario they were written for, never a CTO tip in a STEMI or a TAVI tip in an LAAO.
- Built: The edits to the when: triggers of tips in src/content/manual/** that narrow a tip to its lab, procedure, route or scenario using names the labs raise by the end of phase 1, done in one pass because they touch the same module files. No caution or bailout tip leaves a complication context the PCI lab reports (superset test). Every other requested retarget is recorded as data in waiting.ts for tip-retarget-catchup and content-links-backfill-p2. Adds the reachability test, which reads what each lab raises from the event sources themselves. Merges the retargeting parts of pci-tip-vocabulary, tips-procedure-vocabulary, proc-tip-context, proc-consent-conversation, diag-tip-context, diag-radiation-practice and diag-acs-scenarios.
- Requests: cp-bifurcation-provisional#7, cp-calcium#0, cp-cto-antegrade#8, cp-cto-strategy#0, cp-ostial#0, eq-sheaths-guides#7, pm-imaging#10, pm-imaging#11, cp-other-complex#0, pm-interpreting#10, hb-additional-procedures#8, hb-specific-conditions#9.
- Depends on: found-tips-vocabulary.
- Files (50): src/content/validate.ts, src/content/manual.test.ts, src/content/lab/reachability.test.ts, src/content/lab/raisable/waiting.ts, src/content/manual/cath-handbook/01-lab-and-radiation.ts, src/content/manual/cath-handbook/02-the-operator.ts, src/content/manual/cath-handbook/03-safe-practice.ts, src/content/manual/cath-handbook/04-cardiac-catheterisation.ts, and 42 more.
- Acceptance: vitest manual.test.ts: validateTips returns [] with the new rule that every structural, mcs and pericardiocentesis tip sets a known procedure. Superset: for lad-focal and rca-calcified contexts at phase 'complication' with perforation, dissection, no-reflow, thrombus or air, the set of caution and bailout tips returned by tipsFor(ctx, 100) is a superset of the pre-change set. No PCI tip lists 'total-occlusion' as its only CTO gate; imaging 'ivus' returns no OCT-only tip; with events ['perforation'] alone pci-perf-covered-one-guide is still returned (its retarget waits in waiting.ts). Plus 3 more in the JSON.

#### found-lab-session-plumbing

**Shared event log, patient-event adapter, tip panel, run logging, decision ledger and dev hooks.** L, P1, wave 2. Lab: shared (all labs).

- Learner: Gets the same tip drawer, 'ask for a tip' rule and logbook entry in every lab; patient tips (hypotension, VF, bleeding) appear in every lab.
- Built: The plumbing every lab needs to show tips and score a run: one event log with hold windows, one adapter from engine vitals to patient events, one tip hook and panel with the visibility policy, one run-logging API with case id, mode, decisions and metrics, one decision ledger, and window.__lab dev hooks for hidden-pane checks. Merges labs-tips-panel-and-session (dev), the LabEventLog (diagnostic), the EventLatch (PCI), the case tips panel visibility (full case) and the shared engine-event adapter the full-case plan asked for.
- Requests: hb-additional-procedures#8, cm-perforation#12, hb-tavi#0.
- Depends on: found-tips-vocabulary.
- Files (13): src/ui/lab/eventLog.ts, src/ui/lab/eventLog.test.ts, src/ui/lab/patientEvents.ts, src/ui/lab/patientEvents.test.ts, src/ui/lab/useLabTips.ts, src/ui/lab/LabTipsPanel.tsx, src/ui/lab/LabModeBar.tsx, src/ui/lab/labRun.ts, and 5 more.
- Acceptance: eventLog.test.ts: an event raised with holdS 60 is active at 59 s and gone at 61 s of lab time; default hold is 30 s. patientEvents.test.ts: MAP 60 for 9 s raises nothing, for 11 s raises hypotension; HR 45 raises bradycardia. labRun.test.ts: finish() writes exactly one logbook row with mode, caseId and decisions; exam mode returns no tips; supervised shows tips only after askHelp(). Plus 2 more in the JSON.

#### realism-baseline

**Realism baseline for the renderer as it stands, with devices and the live lab render paths.** M, P1, wave 2. Lab: shared (X-ray renderer and realism scorecard).

- Learner: Nothing visible; every later change to the image is measured against the image as it is now, devices and live labs included.
- Built: Captures and scores the renderer as it stands, records what the seven renderer and harness files edited after the last scorecard changed (HANDOVER 6.1), adds PCI device scenes (guide, wire, balloon, stent) and the diagnostic and PCI lab render paths to the capture set, and stores the result as the reference every renderer-editing package is compared with. Improving realism itself is a separate track (section 8).
- Requests: none (enabling package).
- Depends on: nothing.
- Files (3): src/dev/xrayCapture.ts, scripts/realism/report.py, docs/realism/baseline.md.
- Acceptance: docs/realism/baseline.md records the headline of the current code with the c1g0 specs, the capture set id and date, and for each of the seven files edited after c1g0 what changed and which rows moved (compare_sets.py c1g0 baseline). The capture set includes guide, wire, balloon and stent scenes drawn through pciDevices and one diagnostic-lab and one PCI-lab live-path sequence; report.py lists their rows as measurements outside the pass count. compare_sets.py baseline baseline reports no lost rows; a capture made with a deliberately narrowed left tree lists the rows it loses. Plus 1 more in the JSON.

#### found-patient-formulary

**Patient engine formulary, interactions, heparin kinetics and the contrast ceiling.** L, P1, wave 3. Lab: shared (patient engine).

- Learner: Can give the drugs the manuals use (reversal agents, pressors, inotropes, IV and oral antiplatelets, nitroprusside, antiarrhythmics, oxygen) and see each act on the patient, with contrast ceilings computed the same way everywhere.
- Built: Every drug, route, infusion and interaction the PCI, diagnostic, full-case and physiology plans add to the shared PatientEngine, in one change, plus one contrast-ceiling module used by all labs. Merges proc-engine-formulary with the drug additions of pci-antithrombotic-orders, diag-lab-drugs and diag-contrast-ceilings-oedema, the heparin half-life recalibration from proc-heparin-act-handover, the PDE-5 interaction from proc-chart-planted-problems and diag-lab-drugs, and the contrast ceiling from pci-budgets-stop-rules. It is the only package that adds drugs; later packages call giveDrug and do not edit pharmacology.ts.
- Requests: pm-lab-drugs#6, pm-lab-drugs#11, pm-lab-drugs#0, cm-patient-complications#6.
- Depends on: nothing.
- Files (11): src/simulation/patient/pharmacology.ts, src/simulation/patient/engine.ts, src/simulation/patient/responses.ts, src/simulation/patient/patient.ts, src/simulation/patient/contrastBudget.ts, src/simulation/patient/contrastBudget.test.ts, src/simulation/team/params.ts, src/simulation/team/intents.ts, and 3 more.
- Acceptance: patient.test.ts: heparin half-life is 30 +/- 5 min after 25 U/kg and 60 +/- 8 min after 100 U/kg; existing diagnostic and PCI ACT tests are updated with the new values and pass. patient.test.ts: noradrenaline raises MAP more in a vasodilated profile than during ongoing bleeding; dobutamine lowers MAP in the HCM profile and phenylephrine raises it; flumazenil steps reduce midazolam sedation and naloxone does not; oxygen raises SpO2 under the same respiratory depression. patient.test.ts: GTN after a PDE-5 inhibitor drops MAP more than without; eptifibatide raises the antithrombotic effect and lowers the thrombus hazard. Plus 3 more in the JSON.

#### found-lab-controls-registry

**Table-side controls as a tab registry behind a lab-agnostic target.** S, P1, wave 3. Lab: shared (diagnostic and PCI lab shell).

- Learner: Nothing visible; the table-side controls can gain drug, bail-out and device tabs without breaking each other.
- Built: Refactors TableSideControls.tsx into tabs discovered by glob and bound to a LabControlsTarget interface that both DiagnosticLabSession and the coming PciLabSession implement. Eight packages that would each edit TableSideControls.tsx (drugs, bail-outs, kink recovery, route tools, rhythm orders, left heart, beam controls, PCI consoles) now add a tab file instead.
- Requests: none (enabling package).
- Depends on: found-launch-links.
- Files (9): src/ui/lab/TableSideControls.tsx, src/ui/lab/controls/types.ts, src/ui/lab/controls/registry.ts, src/ui/lab/controls/tabs/CArmTab.tsx, src/ui/lab/controls/tabs/ImagingTab.tsx, src/ui/lab/controls/tabs/BackTableTab.tsx, src/ui/lab/controls/tabs/DefibTab.tsx, src/ui/sim/labSession.ts, and 1 more.
- Acceptance: lab.test.ts and integration.test.ts pass unchanged. A test renders TableSideControls for the diagnostic session and finds the same four sections as before. Adding a file under controls/tabs/ adds a tab without editing any other file (test with a fixture tab).

#### found-handover-contract

**Hand-over contract between labs.** S, P1, wave 3. Lab: shared (case session and cross-lab transfer).

- Learner: Nothing visible yet; later, a patient can be carried from one lab to another with heparin, contrast, consent and complications intact.
- Built: One set of types for what passes between labs: the full case's SessionHandover extensions (PCI target, anticoagulation, antithrombotics, contrast, consent limit, sheath clot), the LabReport each lab returns (stents, final TIMI, complications, contrast, dose, duration) and a store for stand-alone transfers with a PatientEngine snapshot (perforation to pericardiocentesis, stenting to post-PCI physiology, biopsy perforation to drainage). Merges the hand-over parts of pci-adhoc-handover, the full-case cross-cutting contract and labs-presets-and-handover.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (3): src/simulation/session/handover.ts, src/state/useLabHandoverStore.ts, src/simulation/session/handover.test.ts.
- Acceptance: handover.test.ts: a PatientEngine snapshot round-trips through the store (restore gives the same pericardialMl and MAP within 1 mmHg); take() returns it once. npx tsc -p tsconfig.app.json --noEmit is clean.

#### found-mentor-registries

**Mentor rules, debrief checks and debrief sections as registries; one debrief for every lab.** M, P1, wave 4. Lab: shared (attending and debrief).

- Learner: Gets one debrief that shows every scored decision with its lesson, and skill cards that are actually scheduled.
- Built: Splits src/mentor/rules.ts into rule files discovered by glob, turns the debrief's report gaps (src/mentor/debrief.ts) and the Debrief.tsx sections into registries, and shows the decision ledger. The PCI attending, five diagnostic packages, the reflection step and the full case's ledger then add files instead of editing the same three. Two attending implementations exist (HANDOVER 6.5); this package makes MentorEngine the only one new work may extend.
- Requests: none (enabling package).
- Depends on: found-lab-session-plumbing.
- Files (11): src/mentor/rules.ts, src/mentor/rules/index.ts, src/mentor/rules/diagnostic.ts, src/mentor/rules/pciLegacy.ts, src/mentor/debrief.ts, src/mentor/debriefChecks/index.ts, src/ui/mentor/Debrief.tsx, src/ui/mentor/debrief/index.ts, and 3 more.
- Acceptance: mentor.test.ts passes with RULES identical in ids and order. A debrief with ledger decisions shows them with lesson links; a skill card announced in the debrief appears in the review schedule. Adding a file under rules/ or debriefChecks/ registers it without editing an index (fixture test).

#### progression-labels

**Honest entrustment labels and standards-based diagnostic levels.** S, P1, wave 4. Lab: progress.

- Learner: Sees entrustment levels that describe simulator performance, with diagnostic levels III and IV earned on the sourced standards rather than the legacy score.
- Built: Relabels the entrustment levels so that none reads 'first operator without direct supervision', and makes diagnostic levels III and IV rest on the mentor's sourced standards instead of the legacy composite score (HANDOVER 6.4), so the app does not describe the fellow as independent while the P1 work is built. The exam ladders stay in progression-exams.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (3): src/progress/competency.ts, src/progress/logbook.ts, src/progress/progress.test.ts.
- Acceptance: progress.test.ts: no level label or detail contains 'without direct supervision'; every label names the simulator. A diagnostic attempt with finalScore 90 and a failed DIAGNOSTIC_FULL_STUDY standard does not count toward level III; one that passes the standards does. A stored profile recomputed on load never shows a higher level than before; existing progress.test.ts cases pass.

### Phase 1: lab foundations

Each lab moves onto its shell, reports its context to the tip system and gains a scenario registry. At the end of this phase the diagnostic, PCI, full-case, haemodynamics, pressure-wire, MCS, structural and pericardiocentesis labs show tips, open named scenarios from links and log runs with case id and mode; the IVUS and OCT bench and the pacing lab follow early in phase 2. The PCI lab is on the full-screen layout with pedals, stored runs and the S8 input system, and the analytic engagement model no longer scales with difficulty; this is the first checkpoint for the owner to play.

#### pci-engine-modularise

**Split angioPci.ts into action modules behind a stable facade.** M, P1, wave 4. Lab: angio-pci.

- Learner: Nothing visible; the PCI engine can be extended in parallel.
- Built: Pure refactor so later packages edit separate engine areas. No behaviour change: angioPci.ts re-exports every current symbol.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (16): src/simulation/angioPci.ts, src/simulation/pci/state.ts, src/simulation/pci/actions/wire.ts, src/simulation/pci/actions/guide.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/actions/inflation.ts, src/simulation/pci/actions/drugs.ts, src/simulation/pci/actions/pressure.ts, and 8 more.
- Acceptance: angioPci.test.ts, complications.test.ts and every src/simulation/pci/*.test.ts pass unchanged. facade.test.ts: Object.keys of the angioPci module equals the frozen pre-split list. No import cycle: state.ts imports no action module. Plus 1 more in the JSON.

#### diag-tip-context

**Diagnostic lab phase, event and context reporting, and session modules.** M, P1, wave 5. Lab: cathlab.

- Learner: Sees most of the 154 diagnostic tips at the right moment, plus the borrowed PCI, access, haemodynamic and structural tips.
- Built: Makes the diagnostic lab report every phase and event its tips are written for, with case events, route and vessel, so that most of the 154 diagnostic tips (about 40 reachable today) can show, and the borrowed pci, access, haemo and structural tips appear through alsoIn. Gives DiagnosticLabSession session modules discovered by glob, so later diagnostic packages add files instead of editing labSession.ts.
- Requests: cp-complex-patients#4, cp-complex-patients#5, cp-prior-cabg#0, hb-specific-conditions#3, hb-lab-and-radiation#3.
- Depends on: found-tips-vocabulary, found-tip-retarget, found-lab-session-plumbing.
- Files (6): src/ui/lab/diagnosticContext.ts, src/ui/lab/diagnosticContext.test.ts, src/ui/lab/useLabTips.ts, src/ui/sim/labSession.ts, src/ui/sim/modules/index.ts, src/ui/sim/Simulator.tsx.
- Acceptance: diagnosticContext.test.ts: setup before the time-out; advance with the tip above the sinus; inject while the injector is active; views after a filmed selective run on the engaged side; exchange while a catheter is withdrawn over the wire; finish when the finish step is open; lv-aorta with PIG. An event raised with holdS 60 is active at 59 s and gone at 61 s of lab time. tipsFor({lab:'diagnostic', phase:'views'}) can return pci-interp-qca-calibrate through alsoIn; a tip requiring prior-cabg is excluded without it. Plus 3 more in the JSON.

#### diag-engagement-fallback

**Difficulty-free analytic engagement and the physics adapter interface.** S, P1, wave 5. Lab: cathlab.

- Learner: Engages the coronaries against the same capture tolerance at every difficulty; difficulty now changes the help, not the target.
- Built: Makes the analytic engagement model use one fixed capture radius and tolerance at every difficulty (HANDOVER 6.3), and defines the PhysicsDevices interface and its registry, so the PCI guide work builds on both without waiting for the rod solver.
- Requests: none (enabling package).
- Depends on: nothing.
- Files (5): src/simulation/engagement.ts, src/simulation/engagement.test.ts, src/simulation/pressure.test.ts, src/ui/physics/types.ts, src/ui/physics/types.test.ts.
- Acceptance: engagement.test.ts: with physics off, engagement uses difficultyScaled false by default; the THRESH row for 'advanced' is the single fixed set; the scaled behaviour is reachable only through { difficultyScaled: true }. engagement.test.ts: beginner and advanced difficulty give identical engagement classification for the same tip pose across 200 seeded poses. pressure.test.ts passes, with any case that relied on the beginner radius moved inside the fixed radius; lab.test.ts and integration.test.ts pass unchanged. Plus 1 more in the JSON.

#### proc-foundation-scenarios-ledger

**Full-case foundation: scenarios, autopilot, session modules, ledger, file split.** L, P1, wave 5. Lab: procedure.

- Learner: Opens the full case at any named scenario and stage from a lesson, and sees every scored decision with its lesson at the end.
- Built: Gives the full case named scenarios (patient, site and event overrides plus a start stage), an autopilot that fast-forwards to any stage, session modules discovered by glob, the decision ledger in every scored step, and splits panels.tsx so later packages work in separate files. Deep links come from found-launch-links and the ledger type from found-lab-session-plumbing.
- Requests: none (enabling package).
- Depends on: found-launch-links, found-lab-session-plumbing, found-handover-contract.
- Files (21): src/simulation/session/scenarios/index.ts, src/simulation/session/scenarios/default.ts, src/simulation/session/scenarios/default.launch.ts, src/simulation/session/autopilot.ts, src/simulation/session/modules/index.ts, src/simulation/session/caseSession.ts, src/simulation/session/caseSession.test.ts, src/simulation/access/site.ts, and 13 more.
- Acceptance: autopilot.fastForward(session,'closure') on a radial and a femoral seed leaves a sheath in, the catheter out, heparin given and closureDone() false; existing caseSession tests pass using the moved helpers. newCaseSession({ scenario }) with a DOAC and raised creatinine override shows them in session.chart with a recomputed MACD. session.decide() records appear in finish().decisions and in the logbook row. Plus 4 more in the JSON.

#### pci-scenario-registry

**PCI scenario registry with multi-lesion definitions, start states and seeded variants.** L, P1, wave 6. Lab: angio-pci.

- Learner: Opens a named PCI case (or a seeded variant, a start state or an exam) from a lesson, with several lesions per case.
- Built: Replaces the four hard-coded PCI_SCENARIOS with a typed registry that scenario packs extend by adding files, with multi-lesion geometry, seeded hidden variants and start states. Links use found-launch-links.
- Requests: none (enabling package).
- Depends on: pci-engine-modularise, found-launch-links, found-case-model-types.
- Files (12): src/simulation/pci/scenarios/types.ts, src/simulation/pci/scenarios/registry.ts, src/simulation/pci/scenarios/generate.ts, src/simulation/pci/scenarios/legacy.ts, src/simulation/pci/scenarios/packs/core.ts, src/simulation/pci/scenarios/packs/core.launch.ts, src/simulation/pci/scenarios/scenarios.test.ts, src/simulation/pci/actions/scenario.ts, and 4 more.
- Acceptance: scenarios.test.ts: every registry entry builds a coronary tree, pciGeom finds every lesion with startMm < endMm, and toPciScenario(core four) reproduces the current initPci state (severity, resistance, guide id). resolveScenario('rca-calcified','pci-rca-calcified~L3') is deterministic and equals catalogue pciVariantById output. launch.test.ts: validateLaunchLinks with a fixture link rejects an angio-pci link with an unknown scenario or start id. Plus 3 more in the JSON.

#### pci-device-catalogue

**Sourced PCI equipment catalogue.** M, P1, wave 6. Lab: angio-pci.

- Learner: Chooses from a realistic cart of balloons, stents, microcatheters, extensions, imaging catheters, atherectomy, retrieval devices, wires and guides with correct charts and guide-size limits.
- Built: Extends equipment.ts with every device class the requests name (balloons, stents, covered stents, microcatheters, extensions, aspiration, imaging, atherectomy, laser, retrieval, wires, guides), each with compliance chart, crossing profile, minimum guide size and a source or model-parameter label. The one catalogue read by the PCI lab tray and indeflator, the IVUS and OCT bench, and the scenario packs.
- Requests: eq-balloons-stents-cart#0, pm-wiring#3, pm-wiring#9, pm-wiring#0, eq-sheaths-guides#0, cm-perforation#3.
- Depends on: pci-engine-modularise.
- Files (4): src/simulation/pci/equipment.ts, src/simulation/pci/equipment.test.ts, src/simulation/pci/guide.ts, docs/realism/facts/pci-equipment.md.
- Acceptance: equipment.test.ts: chartDiameter is monotone in pressure for every balloon; NC grows less per atm than SC; every DeviceSpec has sources or modelParam. A 2.0 mm burr reports minGuideFr 7; extension inner diameters match the table; covered stents offer exactly the listed diameters. boxLabel shows nominal, RBP and expiry for each class. Plus 2 more in the JSON.

#### proc-tip-context

**Full-case tip context with route, site and step, across access, diagnostic, PCI and haemodynamic tips.** M, P1, wave 6. Lab: access.

- Learner: Sees the access tips at the right step and site (femoral or radial; puncture, wire, sheath, closure) in the full case.
- Built: Makes the 89 access tips appear in the full case at the right moment by reporting the access step, site and route, raising access events from the session, and merging access, diagnostic, PCI and haemodynamic tips in one case panel through tipsForAll.
- Requests: pm-access#11, pm-closure#5.
- Depends on: proc-foundation-scenarios-ledger, found-tips-vocabulary, found-tip-retarget.
- Files (5): src/ui/access/caseTips.ts, src/ui/access/caseTips.test.ts, src/ui/access/CaseTipsPanel.tsx, src/ui/sections/ProcedureLab.tsx, src/simulation/session/caseSession.ts.
- Acceptance: caseTips.test.ts: a session advanced to a femoral sheath yields access step 'sheath' and route 'femoral'; a radial session at the wrist never yields a femoral-only tip. A context { lab:'access', phase:'closure', route:'radial' } returns access-radial-remove-now, access-radial-band-inflation and access-radial-patency-check within the default limit. mcs-largebore-limb-check is not returned unless limb-ischaemia is active. Plus 2 more in the JSON.

#### pci-lab-shell-session

**PCI lab on the full-screen LabLayout with a PciLabSession, pedal fluoroscopy and stored runs.** L, P1, wave 7. Lab: angio-pci.

- Learner: Does PCI on the same full-screen lab as diagnostic angiography: pedal fluoroscopy and cine, stored runs, QCA on the reference monitor, dose, and a fresh patient each case.
- Built: Moves the PCI lab onto the diagnostic lab's shell (live and reference monitors, haemodynamics, dose, table strip, table-side controls), introduces a session object, pedal-gated fluoroscopy and cine with stored runs, and gives each new or repeated case a fresh patient, dose and syringes. Removes the 900 ms automatic fluoroscopy. The lab keeps its current keys, through src/ui/pci/usePciInput.ts, until pci-lab-input moves it onto the S8 input system.
- Requests: hb-lab-and-radiation#0, hb-lab-and-radiation#1, hb-lab-and-radiation#2, cm-patient-complications#3.
- Depends on: pci-engine-modularise, pci-scenario-registry, found-lab-session-plumbing, found-lab-controls-registry, realism-baseline.
- Files (16): src/ui/sections/AngioPci.tsx, src/ui/pci/PciLab.tsx, src/ui/pci/PciLabSession.ts, src/ui/pci/PciLabSession.test.ts, src/ui/pci/PciLiveMonitor.tsx, src/ui/pci/pciDevicesRender.ts, src/ui/pci/render/core.ts, src/ui/pci/usePciInput.ts, and 8 more.
- Acceptance: PciLabSession.test.ts (headless): 5 s of pedal fluoroscopy raises fluoroTimeS by about 5; advanceDevice with the pedal up adds no fluoroscopy time; one cine run adds one series with frames > 0 to useSeriesStore. A repeated case has contrastMl 0, a new PatientEngine instance and fresh syringes. PciLabSession.test.ts: each core scenario (lad-focal, rca-calcified, lcx-stemi, rca-cto) can be completed headlessly in guided and in independent mode through PciLabSession, loading devices through the AssistedDeviceConsole path. Plus 5 more in the JSON.

#### access-multi-site

**More than one access site per case.** L, P1, wave 7. Lab: access.

- Learner: Converts radial to femoral, adds a venous or standby sheath, or punctures the other groin, with each site closed in turn.
- Built: One case holds several access sites, each with its own puncture model, sheath and closure, so the learner can convert radial to femoral, puncture the opposite groin for a bleed, or add a venous or standby sheath.
- Requests: pm-antithrombotics#7.
- Depends on: proc-foundation-scenarios-ledger.
- Files (12): src/simulation/session/caseSession.ts, src/simulation/access/route.ts, src/simulation/procedure.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/AccessFluoroView.tsx, src/ui/access/panels/ClosurePanel.tsx, src/ui/access/panels/HandoverPanel.tsx, src/ui/access/panels/AccessPicker.tsx, and 4 more.
- Acceptance: Existing session tests pass unchanged through the getters. After a radial sheath, addSite('femoral','right') allows a second puncture; finish() refuses until both sites are closed. A left femoral route has the same segment lengths as the right within 5%. Plus 4 more in the JSON.

#### haemo-study-session-and-tips

**Haemo study session: phases, scenario events, tips, learner-entered calculations, shock presets.** L, P1, wave 7. Lab: haemo.

- Learner: Performs a haemodynamic study with tips and does the calculations by hand, including the shock numbers.
- Built: Wraps the haemodynamics lab in a study session that knows catheter position, phase and scenario events, shows tips, and makes the learner calculate CO, SVR, PVR, CPO, PAPi and valve areas (graded against derive()) instead of reading them; adds cardiogenic-shock presets with before-PCI and after-PCI sets and the CPO/PAPi table.
- Requests: hb-specific-conditions#9, pm-support-choice#1.
- Depends on: found-lab-session-plumbing, found-launch-links, found-tip-retarget.
- Files (13): src/simulation/haemo.ts, src/simulation/haemo.test.ts, src/simulation/haemoStudy.ts, src/simulation/haemoStudy.test.ts, src/ui/sections/HaemoLab.tsx, src/ui/haemo/CatheterPanel.tsx, src/ui/haemo/OximetryPanel.tsx, src/ui/haemo/CalcPanel.tsx, and 5 more.
- Acceptance: haemoTips.test.ts: for every scenario and phase, no tip whose requires names another scenario's event is returned. CPO 0.01 W off is accepted and 0.05 W off rejected; the shock-biv post set routes to the right-sided or biventricular row. derive() values are unchanged for the 15 scenarios. Plus 3 more in the JSON.

#### pci-lab-input

**PCI lab on the S8 input system: hands, pedals, gamepad and haptics.** M, P1, wave 8. Lab: angio-pci.

- Learner: Drives wires, devices, the guide and the syringe with the same hands, pedals and gamepad as in diagnostic angiography, and feels a device push back against a calcified bend.
- Built: Moves the PCI lab's controls onto the S8 input system the diagnostic lab uses (hands, pedals, gamepad, MIDI, HID), with a haptic reaction that carries the real force from deliver(), and removes the private keyboard handler. Hand actions are bound through binding files discovered by glob, so later device packages add a file instead of editing the input target.
- Requests: none (enabling package).
- Depends on: pci-lab-shell-session.
- Files (6): src/ui/pci/pciInputTarget.ts, src/ui/pci/inputBindings/index.ts, src/ui/pci/usePciInput.ts, src/input/legacyAdapter.ts, src/input/settings.ts, src/ui/pci/input.pci.test.ts.
- Acceptance: input.pci.test.ts: a push on 'balloon' calls advanceDevice and, against a calcified bend, emits 'reaction' with requiredN > 0; the gamepad mapping equals the diagnostic lab's. Adding a fixture file under src/ui/pci/inputBindings/ binds its action without editing pciInputTarget.ts. src/input/input.test.ts passes unchanged. Plus 1 more in the JSON.

#### pci-tip-context

**PCI tip context: phase machine and event sources from the session snapshot.** M, P1, wave 8. Lab: angio-pci.

- Learner: Sees PCI technique tips at the moment they apply (planning, guide, wire, preparation, stent, optimisation, physiology, imaging, complication, finish) instead of a handful of latched events.
- Built: Rewrites pciTipContext as a pure function of the snapshot. It reports every phase and the events the lab can detect, holds transient events for a window instead of latching them, and lets feature packages add event sources as files.
- Requests: pm-imaging#10, pm-imaging#11, cp-cto-strategy#0, cp-bifurcation-provisional#7, cp-ostial#0, eq-sheaths-guides#7, hb-after-the-procedure#5.
- Depends on: found-tips-vocabulary, found-tip-retarget, pci-lab-shell-session.
- Files (5): src/ui/lab/pciTips.ts, src/ui/lab/pciEvents/index.ts, src/ui/lab/pciEvents/base.ts, src/ui/lab/pciTips.test.ts, src/ui/pci/usePciTips.ts.
- Acceptance: pciTips.test.ts: lad-focal with the guide in the root gives phase 'guide', and 'plan' when snap.prebriefOpen is injected; wire in a septal gives wire-side-branch; guide back-out at t is gone at t+31 s; rca-cto gives 'cto' and never 'total-occlusion'; lcx-stemi never gives 'cto'; pressure wire gives 'physiology'; IVUS gives 'imaging' with imaging 'ivus'; stent with only an edge flap gives 'optimise'; with snap.finishing injected after a perforation the finish context keeps 'perforation'. With snap.recognised false a dissection gives only cue events; with it true the context has 'dissection' and phase 'complication'. reachability.test.ts reads raises from pciEvents/base.ts and prints the count of PCI tips still waiting.

#### diag-scenario-registry

**Diagnostic scenarios, patient chart and one patient from one seed.** M, P1, wave 8. Lab: cathlab.

- Learner: Opens a named diagnostic case with a patient chart and a planted problem from a lesson; the patient's body, coronaries and physiology are one person.
- Built: Named, seeded diagnostic scenarios that carry a patient chart, case events, anatomy and scripted events, opened from lessons, cases and the case library through found-launch-links. The chart seeds the thorax, coronary genome and engine from one seed, so the case is one patient (HANDOVER 6.2).
- Requests: cp-complex-patients#4, hb-background#6, pm-lab-drugs#1, hb-lab-and-radiation#4, cp-prior-cabg#0.
- Depends on: diag-tip-context, found-launch-links, found-case-model-types.
- Files (12): src/simulation/diagnosticScenarios/index.ts, src/simulation/diagnosticScenarios/core.ts, src/simulation/diagnosticScenarios/core.launch.ts, src/simulation/diagnosticScenarios/scenarios.test.ts, src/simulation/caseGenerator.ts, src/ui/sections/CaseLibrary.tsx, src/ui/mentor/PreBrief.tsx, src/mentor/prebrief.ts, and 4 more.
- Acceptance: scenarios.test.ts: scenarioCase('diag-graft-search','s1') twice gives identical AnatomyCase JSON; resolveCase on its id returns it. launch.test.ts: validateLaunchLinks with a fixture link rejects a cathlab link with an unknown scenario id. A scenario with chart eGFR 30 seeds an engine whose vitals().contrast.crclMlMin matches. Plus 3 more in the JSON.

#### physiology-engine-unify-and-setup

**Pressure-wire session shared by the physiology and PCI labs, on the patient engine, with set-up faults.** L, P1, wave 9. Lab: physiology.

- Learner: Sets up the pressure wire properly and recognises the faults that make a reading wrong.
- Built: Moves PhysiologyLab onto a pressure-wire session reducer built from pci/pressureWire.ts, with aortic pressure, heart rate and rhythm from PatientEngine and the Pa channel through the Transducer, and extracts the plots, so the PCI lab's pressure-wire console uses the same front end (HANDOVER 6.5: one of two pressure-wire front ends is unreachable). Adds the set-up faults.
- Requests: pm-physiology#1.
- Depends on: found-lab-session-plumbing, found-launch-links, found-tip-retarget.
- Files (12): src/simulation/pci/pwSession.ts, src/simulation/pci/pwSession.test.ts, src/simulation/pci/pressureWire.ts, src/ui/sections/PhysiologyLab.tsx, src/ui/physiology/SetupPanel.tsx, src/ui/physiology/MeasurePanel.tsx, src/ui/physiology/TraceView.tsx, src/ui/physiology/PullbackPlot.tsx, and 4 more.
- Acceptance: pwSession.test.ts: equalising with the sensor 10 mm in leaves an offset and the drift check fails; equalising at the tip passes. With 'fault-offset-waveforms' mean Pd equals mean Pa but the mismatch flag is set and an FFR recorded is invalid; with air in the aortic line the verdict is overdamped and pressure context 'damped'. physiology.test.ts values are unchanged at equal MAP. Plus 3 more in the JSON.

#### mcs-console-split-select-and-tips

**MCS consoles split, generic device names, device-choice step, tips and session scoring.** M, P1, wave 9. Lab: mcs.

- Learner: Chooses the right mechanical support for the patient and is scored on clear criteria, with tips.
- Built: Splits McsLab.tsx into one file per console, uses generic names in UI chrome (including the App navigation and Dashboard labels, HANDOVER 6.5), adds a scored device-choice step, shows tips, and replaces the floored scores with criteria-based scoring. useCirculation gains a manual step and an injectable engine for the shock chain.
- Requests: pm-support-choice#0.
- Depends on: found-lab-session-plumbing, found-launch-links, found-tip-retarget.
- Files (15): src/ui/sections/McsLab.tsx, src/ui/mcs/shared.tsx, src/ui/mcs/IabpConsole.tsx, src/ui/mcs/ImpellaConsole.tsx, src/ui/mcs/EcmoConsole.tsx, src/ui/mcs/DeviceChoice.tsx, src/ui/mcs/useCirculation.ts, src/ui/mcs/mcs.test.tsx, and 7 more.
- Acceptance: deviceChoice.test.ts: each select preset's correct choice and finding score full marks; a microaxial pump with LV thrombus is critical. mcsTips.test.ts: at phase 'insert' in the IABP console no pump or ECMO tip is returned. No score floor remains; a run with two critical errors can fail. Plus 3 more in the JSON.

#### structural-tips-and-tavi-course

**Structural lab tips for TAVI, TEER and LAAO, a post-deployment TAVI course and the coronary obstruction scenario.** M, P1, wave 9. Lab: tavi.

- Learner: Gets tips in TAVI, TEER and LAAO, and recognises coronary obstruction after valve deployment.
- Built: Tips in the three structural labs keyed by procedure and step, and a short post-deployment haemodynamic course in TAVI so hypotension and ST elevation are real events, with a coronary obstruction scenario that must be recognised and rescued at once.
- Requests: hb-tavi#0, hb-tavi#5, hb-additional-procedures#8.
- Depends on: found-lab-session-plumbing, found-launch-links, found-tip-retarget.
- Files (10): src/simulation/tavi.ts, src/simulation/tavi.test.ts, src/ui/structural/TaviLab.tsx, src/ui/structural/TaviViews.tsx, src/ui/structural/TeerLab.tsx, src/ui/structural/LaaoLab.tsx, src/ui/sections/StructuralLab.tsx, src/ui/lab/structuralTips.ts, and 2 more.
- Acceptance: structuralTips.test.ts: at each TAVI step only structural-tavi-* tips for that step return; no TEER or LAAO tip appears in TAVI. structural-tavi-hypotension-coronary returns only while taviCourse reports MAP below 65 after pacing. In 'tavi-coronary-obstruction' root injection within 60 s scores better than waiting 3 min. Plus 3 more in the JSON.

#### pericardiocentesis-tips-and-pci-handover

**Pericardiocentesis tips, live hand-over from a coronary perforation, and the post-CABG loculated collection.** L, P1, wave 10. Lab: pericardiocentesis.

- Learner: Drains tamponade from a coronary perforation on the same patient and recognises a loculated post-CABG collection.
- Built: Bedside tips in the pericardiocentesis lab. Opened from a perforation it continues the PCI patient on its PatientEngine (pericardial volume grows while the hole is open, fluoroscopy shows the contrast-outlined sac). Small stable effusions may be left; 20-50 mL drainage improves haemodynamics; the drain stays. A post-CABG perforation produces a localised collection without a subxiphoid window.
- Requests: cm-perforation#12, cm-perforation#6, cm-perforation#7.
- Depends on: found-lab-session-plumbing, found-launch-links, found-handover-contract, found-tip-retarget.
- Files (7): src/ui/bedside/PericardioLab.tsx, src/simulation/pericardiocentesis.ts, src/simulation/pericardiocentesis.test.ts, src/ui/sections/BedsideLab.tsx, src/ui/lab/bedsideTips.ts, src/ui/lab/bedsideTips.test.ts, src/content/lab/presets/bedside/pericardio.launch.ts.
- Acceptance: bedsideTips.test.ts: bed-peri-set-up, bed-peri-confirm-wire, bed-peri-after-pci and bed-peri-drain-stays appear at their stages with procedures ['pericardiocentesis'] and none in the pacing tab. With a hand-over snapshot and an open leak pericardialMl rises every second; draining 40 mL raises MAP. In 'post-cabg-loculated' a subxiphoid needle returns no fluid and raises ectopy; CT or surgical drainage is correct. Plus 3 more in the JSON.

#### xray-device-fluoro-views

**Fluoroscopy of non-coronary devices on the real X-ray renderer.** L, P2, wave 11. Lab: mcs, pacing, pericardiocentesis, haemo, structural.

- Learner: Sees pumps, balloons, cannulae, leads and needles on real-looking fluoroscopy instead of diagrams.
- Built: A reusable X-ray view that draws the patient's thorax with device tubes (IABP balloon and tip marker, microaxial pump, ECMO cannulae, pacing lead, RHC balloon catheter, pericardial needle and J wire with the contrast-outlined sac, transseptal sheath and needle) through buildXrayScene's extras hook, pedal-gated and dose-tracked, replacing SVG schematics where realism matters.
- Requests: none (enabling package).
- Depends on: realism-baseline.
- Files (3): src/render/xray/deviceTubes.ts, src/render/xray/deviceTubes.test.ts, src/ui/xray/XrayDeviceView.tsx.
- Acceptance: deviceTubes.test.ts: an IABP tip 2 cm below the carina yields a tube whose radio-opaque tip is at that height; helium mu is below soft tissue. browser (hidden pane): the dev draw hook renders an IABP frame with the tip marker visible against the spine within the lab frame budget. No existing renderer file changes. Plus 1 more in the JSON.

### Phase 2: core hands-on skills (P1)

The hands-on core: rod physics and one pressure system in the diagnostic lab; the device workflow, indeflator, guide, delivery, wire, imaging, physiology and the attending in the PCI lab; the access sequence and closure in the full case; the IVUS and OCT bench, the pressure wire, haemodynamics and transseptal puncture in the other labs.

#### diag-rod-physics

**Rod physics in place of the analytic tip model, through one adapter for both coronary labs.** XL, P1, wave 10. Lab: cathlab.

- Learner: Engages with a catheter that behaves mechanically (torque lag, prolapse, deep seating, exchange over a wire) rather than snapping in at a difficulty-scaled radius.
- Built: Runs the src/physics Cosserat-rod solver in the diagnostic lab behind a physicsDevices flag (default on only when the cost threshold below is met). Engagement, damping input, the catheter image and exchanges come from mechanics; difficulty changes assistance, not capture radius. The adapter implements the PhysicsDevices interface from diag-engagement-fallback, so pci-guide-engagement picks it up when it is registered.
- Requests: pm-engaging#5, pm-engaging#7, pm-engaging#8, pm-engaging#6.
- Depends on: diag-tip-context, diag-engagement-fallback, realism-baseline, found-launch-links.
- Files (14): src/ui/physics/physicsDevices.ts, src/ui/physics/physicsDevices.test.ts, src/ui/physics/impl/rod.ts, src/ui/sim/labSession.ts, src/state/useSimulatorStore.ts, src/ui/sim/FluoroView.tsx, src/ui/sim/Simulator.tsx, src/physics/legacyBridge.ts, and 6 more.
- Acceptance: physicsDevices.test.ts (in-thread client): the JL4 procedure reaches 'selective-lm' in at least 3 of 5 starts at both beginner and advanced difficulty. JR4 driven into the conus gives tipState damped or ventricularised and engagement.conus true. An exchange JL4 to JR4 over the J wire keeps the wire tip above the valve plane throughout. Plus 5 more in the JSON.

#### proc-chart-planted-problems

**Chart with one planted problem and the pre-puncture checklist.** L, P1, wave 10. Lab: procedure.

- Learner: Reads a realistic chart, finds the one planted problem and acts on it, then completes the pre-puncture checklist.
- Built: A realistic pre-procedure record with one planted problem per patient from the manuals' checklists, an action for each, consequences when missed, and Oxford's pre-puncture checklist before the needle.
- Requests: pm-planning#2, pm-to-the-root#9.
- Depends on: proc-foundation-scenarios-ledger, proc-tip-context, found-patient-formulary.
- Files (7): src/simulation/session/planning.ts, src/simulation/session/planning.test.ts, src/simulation/session/modules/planning.ts, src/simulation/session/scenarios/planning.ts, src/simulation/session/scenarios/planning.launch.ts, src/ui/access/chart/PlantedProblems.tsx, src/simulation/patient/patient.ts.
- Acceptance: planning.test.ts: every generated patient in a fixed seed set has exactly one planted problem and the chart states it. 'pde5-24h' with GTN drops true MAP more than the same dose without the flag. 'doac-recent' with 'hold and delay' records a correct decision and ends the case; missed, the debrief links pm-planning-assessment. Plus 4 more in the JSON.

#### pci-wire-microcatheter

**Wire choice, tip shaping, microcatheter, trapping and subintimal recognition.** L, P1, wave 11. Lab: angio-pci.

- Learner: Shapes the wire tip, chooses among the seven wire classes, uses a microcatheter for support and exchanges, traps wires, and recognises subintimal tracking on orthogonal views.
- Built: The seven wire classes, a tip-shaping tool, a microcatheter (support, exchange, distal injection), trapping for over-the-wire exchanges, a tortuous circumflex scenario for prolapse, recognisable subintimal tracking and held-out wiring exercises.
- Requests: pm-wiring#3, pm-wiring#4, pm-wiring#6, pm-wiring#7, pm-wiring#8, pm-wiring#9, pm-engaging#11, eq-balloons-stents-cart#3.
- Depends on: pci-lab-shell-session, pci-device-catalogue, pci-tip-context, pci-lab-input, realism-baseline.
- Files (10): src/simulation/pci/coronaryWire.ts, src/simulation/pci/coronaryWire.test.ts, src/simulation/pci/actions/wire.ts, src/simulation/pci/state.ts, src/ui/pci/consoles/WireConsole.tsx, src/ui/pci/inputBindings/wire.ts, src/ui/pci/render/wire.ts, src/simulation/pci/scenarios/packs/wiring.ts, and 2 more.
- Acceptance: coronaryWire.test.ts: a microcatheter 2 mm behind the tip crosses the CTO cap more often than one 20 mm behind (50 seeds); exchange through the microcatheter keeps tipMm within 1 mm. Trapping: a 2.0 mm balloon in a 7 Fr guide lets the wire migrate back more than 5 mm; a 2.5 x 20 mm balloon at 18 atm in 6 Fr holds it within 1 mm. A primary bend longer than the vessel diameter catches the wall in the OM scenario; polymer-jacketed wires prolapse less than workhorse wires across 50 seeds. Plus 5 more in the JSON.

#### diag-study-report

**Finish-of-study step and study report, including the PCI target.** M, P1, wave 11. Lab: cathlab.

- Learner: Finishes a study by accounting for every territory, stating findings, declaring non-diagnostic runs and choosing ad hoc PCI, deferral or the heart team, with the target recorded.
- Built: A finish phase before the debrief: the learner accounts for every territory, states findings per vessel and graft, declares non-diagnostic runs, classifies MI and decides between no PCI, ad hoc PCI, stopping for the heart team or a staged procedure. Choosing a target here (vessel, segment, own QCA and length) is the only target-decision step in the app; the full case's gate and the PCI hand-over read it.
- Requests: pm-acquiring#8, pm-interpreting#3, pm-planning#4, cp-cto-strategy#8, hb-background#4, cp-prior-cabg#1, pm-interpreting#9.
- Depends on: diag-tip-context, diag-scenario-registry, found-mentor-registries, found-handover-contract, found-launch-links.
- Files (8): src/ui/lab/StudyReport.tsx, src/state/useSimulatorStore.ts, src/ui/sim/Simulator.tsx, src/mentor/report.ts, src/mentor/report.test.ts, src/mentor/debriefChecks/report.ts, src/ui/mentor/debrief/ReportSection.tsx, src/content/practice/diag-study-report.launch.ts.
- Acceptance: report.test.ts: an anomalous-Cx case with the lateral wall assigned to 'LCx from the left injection' is flagged; assigning it to the RCA injection passes; existing report tests pass. A stable LM case with decision 'ad hoc PCI' produces the deferral gap citing the Brilakis reasons. An ad hoc decision with a target writes a PciTarget that the hand-over contract accepts. Plus 3 more in the JSON.

#### diag-pressure-transducer

**One pressure system: engine traces, transducer faults, aspiration outcomes.** L, P1, wave 12. Lab: cathlab.

- Learner: Reads one true pressure trace and works through transducer faults, side-hole catheters, aortic stenosis, aspiration failures and plugged catheters.
- Built: Drives the store's pressure class, events and scoring from the engine's tip chamber and transducer instead of legacy pressure.ts, and adds transducer faults, side-hole catheters, aortic stenosis and true hypotension, a physiologist call-out, aspiration outcomes with a gauze view, plugged catheters and the consequences of flushing them.
- Requests: pm-engaging#0, pm-engaging#1, pm-to-the-root#8, cp-left-main#5, hb-specific-conditions#8, cp-complex-patients#7, pm-interpreting#8.
- Depends on: diag-tip-context, diag-scenario-registry.
- Files (12): src/state/useSimulatorStore.ts, src/simulation/patient/transducer.ts, src/simulation/patient/engine.ts, src/simulation/circulation.ts, src/simulation/patient/patient.ts, src/ui/sim/labSession.ts, src/ui/lab/HaemoMonitor.tsx, src/ui/lab/TableView.tsx, and 4 more.
- Acceptance: TipInput with gap 0.1 and a JR4 gives tipState 'ventricularised'; with sideHoles true it gives 'aortic'. Fault 'air-bubble' lowers natural frequency and displayed pulse pressure; fast flush and re-prime restore it. Valve area 0.7 cm2 gives a later aortic peak and lower pulse than 3 cm2 and tipState stays 'aortic'. Plus 4 more in the JSON.

#### diag-lesion-morphologies

**Lesion morphologies and the shared collateral model.** L, P1, wave 12. Lab: cathlab.

- Learner: Reads eccentric, tapering, branch, spasm, thrombus, SCAD and CTO lesions whose severity depends on the view, with collaterals that fill late.
- Built: Eccentric, tapering, branch, spasm, thrombus, CTO with collaterals and SCAD lesions with view-dependent severity from elliptical lumens. The collateral channel model built here is also what the PCI CTO packages use, so collateral filling looks the same in both labs.
- Requests: pm-interpreting#0, pm-acquiring#1, cp-cto-strategy#8, cp-other-complex#1, cp-ostial#7, pm-interpreting#5, pm-interpreting#6, pm-interpreting#11.
- Depends on: diag-scenario-registry, found-case-model-types, realism-baseline.
- Files (8): src/render/xray/coronaryTree.ts, src/render/xray/sceneBuilder.ts, src/render/xray/contrastTransport.ts, src/render/xray/coronaryGrowth.ts, src/simulation/caseGenerator.ts, src/render/xray/lesionMorphology.test.ts, src/simulation/diagnosticScenarios/lesions.ts, src/simulation/diagnosticScenarios/lesions.launch.ts.
- Acceptance: An eccentric lesion (0.6) gives projected %DS differing by at least 15 points between orthogonal views; a concentric one by under 2. The CTO recipient reaches half its peak opacity later than the donor and only after more than 2 s. A spasm lesion's rendered severity falls as the engine's GTN effect rises. Plus 4 more in the JSON.

#### pci-bench-imaging-unify

**One intravascular imaging engine and renderer for the bench and the PCI lab.** L, P1, wave 12. Lab: pci-bench.

- Learner: Reads IVUS and OCT on the bench with images built by the same engine as the PCI lab.
- Built: Makes src/simulation/pci/ivus.ts the single frame generator (modality, calcium with thickness, plaque-burden profile, lipid cap, thrombus type, side branches, stent layers) with shared EAPCI criteria and one renderer, ending the two IVUS engines (HANDOVER 6.5). The bench builds frames from it and devices from the catalogue, is split into step components, and reports its tip context. pci-intravascular-imaging then adds the in-lab acquisition on the same engine.
- Requests: none (enabling package).
- Depends on: found-lab-session-plumbing, found-launch-links, pci-device-catalogue.
- Files (17): src/simulation/pci/ivus.ts, src/simulation/pci/ivus.test.ts, src/simulation/imaging/types.ts, src/simulation/imaging/criteria.ts, src/simulation/pciBench.ts, src/simulation/pciBench.test.ts, src/ui/imaging/IntravascularView.tsx, src/ui/imaging/LongitudinalView.tsx, and 9 more.
- Acceptance: pciBench.test.ts expectations still pass (focal LAD optimised plan scores >= 80; calcified RCA without modification fails expansion), recalibrated where compliance changed. ivus.test.ts: for each BENCH_LESION, lumen and EEM areas at 10 positions match pciBench lumen() and eem() within 2%; OCT frames report calcium thickness and IVUS frames null. BALLOON_SPEC diameters equal equipment.ts chartDiameter at nominal and RBP for every kind. Plus 4 more in the JSON.

#### pci-guide-engagement

**Guide choice and engagement as the first step, on the shared rod-physics adapter.** L, P1, wave 13. Lab: angio-pci.

- Learner: Chooses, engages, seats and exchanges the guide from the aortic root, feels back-up, and sees damping and ventricularisation from the guide's own position.
- Built: Each case starts with the guide in the aortic root. The learner chooses shape, size and length, then engages, seats and re-engages. Engagement uses the difficulty-independent analytic model from diag-engagement-fallback, and the rod solver through the PhysicsDevices interface once diag-rod-physics registers it (PCI_ROD_GUIDE, off until then). Guide position sets damping, ventricularisation and the wire's first direction.
- Requests: pm-wiring#0, pm-wiring#1, pm-wiring#2, pm-engaging#10.
- Depends on: pci-lab-shell-session, pci-device-catalogue, diag-engagement-fallback, pci-tip-context, realism-baseline, pci-lab-input, found-launch-links.
- Files (13): src/simulation/pci/guide.ts, src/simulation/pci/guide.test.ts, src/simulation/pci/actions/guide.ts, src/simulation/pci/patientBridge.ts, src/simulation/pci/coronaryWire.ts, src/ui/pci/useGuidePhysics.ts, src/ui/pci/consoles/GuideConsole.tsx, src/ui/pci/render/guide.ts, and 5 more.
- Acceptance: guide.test.ts: a 3 mm deep seat raises backupN and the damping wedge fraction; a 7 Fr AL in an ostial RCA damps more often than a 6 Fr JR (seeded). guideWireAim.test.ts: with EBU3.75 in a wide-angle left main the first advance enters the LCx in more than 50% of 50 seeds and the LAD after re-seating; coronaryWire.test.ts passes unchanged. With no physics implementation registered, the analytic fallback engages JL4G and EBU3.5 in the PCI anatomy within 30 s of scripted hand commands; with a fixture implementation registered, 'catheter' commands reach it. Plus 4 more in the JSON.

#### access-femoral-puncture

**Femoral landmarks, ultrasound sweep and needle events.** L, P1, wave 13. Lab: access.

- Learner: Marks the femoral head on fluoroscopy, scans the bifurcation and calcium on ultrasound, and punctures the common femoral artery at the right height.
- Built: The Brilakis femoral sequence before the wire: a draggable marker on AP fluoroscopy for the inferior border of the femoral head, an ultrasound sweep with bifurcation height, anterior-wall calcium and the compressible vein, depth presets, micropuncture wire courses and scripted hub-return events.
- Requests: pm-access#1, pm-access#2.
- Depends on: proc-tip-context, access-multi-site.
- Files (10): src/simulation/access/site.ts, src/simulation/access/ultrasound.ts, src/simulation/access/route.ts, src/simulation/session/caseSession.ts, src/simulation/session/autopilot.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/AccessFluoroView.tsx, src/simulation/access/access.test.ts, and 2 more.
- Acceptance: In 'fem-high-bif' the bifurcation lies within the head window and a puncture at the head centre is classified low. 'fem-micro-wire-iea' raises wire-misdirected; insertSheath before withdrawal is a critical stop. A CFV puncture gives a venous flashback and event venous-flashback; 'fem-plugged-needle' gives no flash until 'flush needle'. Plus 4 more in the JSON.

#### proc-anaphylaxis-vagal

**Anaphylaxis order set and vasovagal look-alikes at puncture, sheath and removal.** M, P1, wave 13. Lab: procedure.

- Learner: Treats anaphylaxis with the right order set and tells it apart from vasovagal reactions.
- Built: An anaphylaxis event treated through orders with consequences for wrong orders, a vasovagal look-alike and a pre-arrest bradycardic anaphylaxis variant, and vagal prevention and management at puncture, sheath insertion and removal.
- Requests: pm-lab-drugs#11, cm-patient-complications#7, cm-perforation#9.
- Depends on: found-patient-formulary, proc-tip-context.
- Files (8): src/simulation/session/emergencies.ts, src/simulation/session/emergencies.test.ts, src/simulation/session/modules/emergencies.ts, src/simulation/patient/engine.ts, src/simulation/patient/responses.ts, src/ui/access/orders/Emergency.tsx, src/simulation/session/scenarios/emergencies.ts, src/simulation/session/scenarios/emergencies.launch.ts.
- Acceptance: In 'anaphylaxis-asthmatic' IM adrenaline 0.5 mg within 2 min restores MAP above 65 sooner than chlorphenamine and hydrocortisone first. 'vagal-mimic' shows HR falling before MAP without itch or flushing; atropine restores HR; 'anaphylaxis-prearrest-brady' scores atropine-only wrong. 'vagal-no-local' gives a vagal event more often over a seed set than with local and saline; tryptase outside the windows is wrong. Plus 2 more in the JSON.

#### access-femoral-upsizing-angiogram

**Micropuncture upsizing, sheath preparation and the femoral angiogram.** L, P1, wave 14. Lab: access.

- Learner: Upsizes from micropuncture safely, prepares the sheath, handles resistance and reads the femoral angiogram.
- Built: Upsizing from the micropuncture wire to a 0.035 wire, a safe skin nick, sheath length, aspiration and flushing with separate syringes, upsizing resistance, then a femoral angiogram in the ipsilateral oblique with a structured report.
- Requests: pm-access#3, pm-access#8, pm-to-the-root#1, pm-to-the-root#2.
- Depends on: access-femoral-puncture.
- Files (11): src/simulation/access/upsizing.ts, src/simulation/access/upsizing.test.ts, src/simulation/access/ultrasound.ts, src/simulation/access/route.ts, src/simulation/session/caseSession.ts, src/simulation/session/autopilot.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/AccessFluoroView.tsx, and 3 more.
- Acceptance: Skin nick with the sheath in is refused; needle-dilator-0.035-sheath succeeds. Flush before aspirate is wrong; skipping aspiration sets catheter lumen clot and aspirate() later finds clot. 'fem-subintimal-sheath' shows a damped side-arm trace and a puff through it is a critical error; 'fem-poor-track' blocks the sheath until nick-and-spread. Plus 4 more in the JSON.

#### proc-hypotension-pressors

**Hypotension by mechanism with the shared cause model, pressor and inotrope infusions, and pulmonary oedema.** L, P1, wave 14. Lab: procedure.

- Learner: Confirms hypotension is real, finds its mechanism and bridges with the matching drug or support.
- Built: Hypotension from hypovolaemia, cardiac failure or vasodilation that the learner must confirm, diagnose (including a right heart readout) and bridge with the matching drug, escalating to mechanical support, plus a fluid and contrast pulmonary oedema event. Builds the shared hypotension-cause model that the PCI and diagnostic labs add their own causes to.
- Requests: pm-lab-drugs#6, cm-flow-embolism#8.
- Depends on: found-patient-formulary, proc-anaphylaxis-vagal.
- Files (8): src/simulation/patient/hypotensionCauses.ts, src/simulation/patient/hypotensionCauses.test.ts, src/simulation/session/hypotension.ts, src/simulation/session/modules/hypotension.ts, src/ui/access/orders/Infusions.tsx, src/ui/access/InfusionPanel.tsx, src/simulation/session/scenarios/hypotension.ts, src/simulation/session/scenarios/hypotension.launch.ts.
- Acceptance: 'hypo-false-transducer' scores a pressor before levelling wrong. The RHC readout in 'hypo-bleeding' shows low RA and low output; in 'hypo-ischaemia' high PCWP and low output. Dobutamine started at 20 ug/kg/min is scored as starting high; in 'hypo-hcm' an inotrope worsens MAP and phenylephrine is correct. Plus 3 more in the JSON.

#### pci-bench-measure-and-plan

**Modality choice, measurement tools and a scored pre-PCI plan, with left main presets.** L, P1, wave 14. Lab: pci-bench.

- Learner: Chooses the right modality for a goal, measures on the frames and writes a scored pre-PCI plan, including left main.
- Built: Removes ground truth from the bench: the learner commits to IVUS or OCT against a stated goal, measures on the frames and enters the plan, which is compared with frame truth and has consequences. Left main presets imaged from both branches and an ostial pullback into the aorta. The measurement tools are shared with the PCI lab.
- Requests: pm-imaging#0, pm-imaging#4, pm-imaging#5, cp-left-main#3.
- Depends on: pci-bench-imaging-unify.
- Files (8): src/simulation/pciBench.ts, src/simulation/bench/measure.ts, src/simulation/bench/measure.test.ts, src/ui/imaging/MeasureTools.tsx, src/ui/bench/ImagePanel.tsx, src/ui/bench/PlanForm.tsx, src/ui/bench/AssessPanel.tsx, src/content/lab/presets/pci-bench/measure.launch.ts.
- Acceptance: measure.test.ts: correct entries for focal-lad pass; a stent sized to the proximal reference is flagged and deploy() reports a distal edge dissection; an edge on the lipid pool reports an edge dissection. OCT for 'ostial-lm-ivus' is wrong and its aorta frames have no measurable lumen. 'distal-lm-two-branch' is graded correct only with both pullbacks; a short circumflex ostial lesion shows only on the LCx pullback. Plus 3 more in the JSON.

#### access-route-decision

**Route decision card, pulses and spasm-risk planning.** M, P1, wave 15. Lab: access.

- Learner: Examines pulses and chooses site, sheath and a fallback by the five-step algorithm, with a spasm-risk plan.
- Built: Before access the learner examines pulses, reads a patient card and chooses site, sheath size and length and a fallback against the five-step algorithm; spasm risk is planned with sedation, local and the radial cocktail.
- Requests: pm-access#0, hb-background#7, pm-engaging#13, pm-monitoring#8.
- Depends on: proc-chart-planted-problems, access-multi-site.
- Files (8): src/simulation/access/siteChoice.ts, src/simulation/access/siteChoice.test.ts, src/simulation/session/modules/routePlan.ts, src/simulation/session/scenarios/routes.ts, src/simulation/session/scenarios/routes.launch.ts, src/ui/access/chart/PlanAccess.tsx, src/ui/access/panels/AccessPicker.tsx, src/ui/access/UltrasoundView.tsx.
- Acceptance: 'lima-graft' scores left radial correct and right radial wrong; 'complex-pci-8fr' accepts 7-8 Fr 45 cm femoral. 'impalpable-femorals', 'axillofemoral-graft' and 'aaa-mural-thrombus' score any femoral choice wrong; a plan without a fallback fails that item. In 'spasm-high-risk' a 7 Fr standard sheath without sedation or cocktail gives more spasm at the subclavian than a 5 Fr thin sheath with both. Plus 3 more in the JSON.

#### access-closure-femoral-manual

**Femoral closure algorithm and hands-on manual compression.** L, P1, wave 15. Lab: access.

- Learner: Chooses femoral closure by the four questions and performs manual compression with the hands in the right place.
- Built: Femoral closure with the four-question algorithm and the side-arm angiogram, then hands-on manual compression with preparation, a falling ACT, optional protamine, blood pressure control, a draggable hand position, held pressure and a timer, with consequences including vasovagal reactions, tamponade mimics and retroperitoneal bleeding.
- Requests: pm-closure#0, pm-closure#1, pm-antithrombotics#7, cm-patient-complications#7, cm-perforation#9.
- Depends on: access-femoral-upsizing-angiogram, access-multi-site, proc-tip-context, found-patient-formulary.
- Files (11): src/simulation/access/closurePlan.ts, src/simulation/access/closurePlan.test.ts, src/simulation/access/compression.ts, src/simulation/access/compression.test.ts, src/simulation/access/closure.ts, src/simulation/session/caseSession.ts, src/ui/access/panels/ClosurePanel.tsx, src/ui/access/GroinView.tsx, and 3 more.
- Acceptance: closurePlan rejects a collagen plug for 'closure-fem-high-stick' and any device for 'closure-fem-below-bif' and 'closure-fem-small-artery'. Hand compression at ACT 240 s is wrong and after waiting to 170 s correct; protamine before the catheter is out is refused; 80 mg is capped or scored wrong. Compression 15 mm caudal to the arteriotomy raises the large-haematoma risk over the centred value. Plus 4 more in the JSON.

#### pacing-in-lab-scenarios-and-tips

**Pacing tips, in-lab bradycardia scenarios as held-out exams, and volt or milliamp units.** M, P1, wave 15. Lab: pacing.

- Learner: Manages in-lab bradycardia and paces correctly, with exam versions.
- Built: Tips in the pacing lab by stage; three in-lab scenarios (CHB with hypotension after an RCA injection with known RBBB, adenosine AV block without escape that does not resolve after a cough, AV block during amiodarone), each starting with a choice of waiting, atropine, external pacing or a femoral wire before the insertion and box stages; tips hidden in exam mode; box output in volts or milliamps.
- Requests: hb-additional-procedures#0, hb-additional-procedures#2.
- Depends on: found-lab-session-plumbing, found-launch-links, found-tip-retarget, pericardiocentesis-tips-and-pci-handover.
- Files (5): src/simulation/pacing.ts, src/simulation/pacing.test.ts, src/ui/bedside/PacingLab.tsx, src/ui/lab/bedsideTips.ts, src/content/lab/presets/bedside/pacing.launch.ts.
- Acceptance: In the persistent 'inlab-adenosine-avb' variant waiting 30 s and a cough do not restore conduction; transvenous pacing at 3x threshold in demand mode passes. Output entered in volts at 3x threshold passes in both unit displays. At stage 'test' bed-pace-threshold-margin appears; in exam mode no tips are returned. Plus 2 more in the JSON.

#### pci-indeflator

**Indeflator console with real inflation timing, outcomes and one shared lesion-yield model.** M, P1, wave 16. Lab: angio-pci.

- Learner: Inflates a balloon at a chosen rate on an indeflator, watches it fill on fluoroscopy, sees waists, ruptures and melon-seeding, and decides whether to stent after predilatation.
- Built: Drives inflation through the existing indeflator engine instead of the instant shims, adds outcome states after predilatation and the stent-or-not decision, and creates the lesion-yield model that the IVUS and OCT bench also uses, so the bench and the lab dilate lesions the same way.
- Requests: pm-prep-and-stent#0, pm-prep-and-stent#1, pm-prep-and-stent#6, eq-balloons-stents-cart#1.
- Depends on: pci-lab-shell-session, pci-device-catalogue, pci-tip-context, pci-lab-input, found-launch-links.
- Files (9): src/ui/pci/consoles/IndeflatorConsole.tsx, src/ui/pci/inputBindings/indeflator.ts, src/simulation/pci/indeflator.ts, src/simulation/pci/indeflator.test.ts, src/simulation/pci/lesionYield.ts, src/simulation/pci/actions/inflation.ts, src/simulation/pci/state.ts, src/ui/lab/pciEvents/inflation.ts, and 1 more.
- Acceptance: indeflator.test.ts: screwTo 12 atm at 3 atm/s reaches 12 atm after about 4 s of stepPci at 0.25 s; deflation of a 3.0 NC takes at least the spec time; inflating past the drawn burst ruptures (seeded) and logs balloon-rupture. The melon-seed counter increments with an 8 mm balloon at 6 atm/s in an angulated lesion and not with a 15 mm balloon at 1 atm/s. Withdrawal before full deflation increases guide depthMm and raises the dissection hazard. Plus 4 more in the JSON.

#### pci-intravascular-imaging

**IVUS and OCT in the PCI lab: acquisition, trainee measurement, image-guided optimisation, enhanced stent visualisation.** L, P1, wave 16. Lab: angio-pci.

- Learner: Acquires IVUS and OCT in the PCI lab, measures on the frames, optimises the stent actually deployed and uses enhanced stent visualisation.
- Built: Brings imaging catheters into the fluoroscopic lab on the single imaging engine and renderer that pci-bench-imaging-unify builds. Adds the lab-only parts: IVUS pullback under fluoroscopy, OCT flush as a learner decision with its contrast, trainee tracing, the image, post-dilate, re-image loop on the stent actually deployed, and marker-registered enhanced stent visualisation.
- Requests: pm-imaging#1, pm-imaging#2, pm-imaging#6, eq-balloons-stents-cart#2, pm-prep-and-stent#8, pm-interpreting#12, pm-imaging#10.
- Depends on: pci-lab-shell-session, pci-device-catalogue, pci-bench-imaging-unify, pci-bench-measure-and-plan, pci-tip-context, pci-lab-input, realism-baseline, found-launch-links.
- Files (11): src/simulation/pci/ivus.ts, src/simulation/pci/ivus.test.ts, src/simulation/pci/actions/imaging.ts, src/simulation/imaging/stentEnhance.ts, src/simulation/imaging/stentEnhance.test.ts, src/ui/pci/consoles/ImagingConsole.tsx, src/ui/pci/inputBindings/imaging.ts, src/ui/lab/ReferenceMonitor.tsx, and 3 more.
- Acceptance: ivus.test.ts: an OCT frame with flush volume below threshold is flagged blood-filled; phased-array without clear view shows ring-down; after a 3.0 stent at 10 atm in rca-calcified MSA is below 80% of reference and after an NC 3.5 at 20 atm it rises. stentEnhance.test.ts: synthetic frames with moving markers give a sharper stent profile than one frame. OCT flush volume appears in the session contrast total. Plus 5 more in the JSON.

#### access-radial-sequence

**Radial puncture, wire and sheath stage with spasm, resistance and perforation.** L, P1, wave 16. Lab: access.

- Learner: Gains radial access with the right local, technique and sedation, and handles spasm, loops and perforation.
- Built: Radial access with arm positioning, ultrasound depth, a local volume that can compress the artery, single-wall or through-and-through puncture, spasm from repeated passes or no sedation, resistance at the needle and in the forearm with a forearm angiogram, balloon-assisted tracking for loops, perforation sealing, cocktail and heparin timing and securing the sheath.
- Requests: pm-access#4, pm-access#5, pm-engaging#13, cm-access-complications#5, pm-antithrombotics#1.
- Depends on: access-route-decision, proc-tip-context.
- Files (14): src/simulation/access/site.ts, src/simulation/access/ultrasound.ts, src/simulation/procedure.ts, src/simulation/access/route.ts, src/simulation/session/caseSession.ts, src/simulation/session/autopilot.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/AccessFluoroView.tsx, and 6 more.
- Acceptance: 3 mL of local without waiting reduces the radial lumen and fails the first pass more often over a seed set than 1 mL. 'radial-normal' is reached with at most two passes by the autopilot pose; through-and-through flashes on withdrawal only. In 'radial-loop' BAT passes without perforation; forcing a hydrophilic wire perforates and the catheter-across action seals in the scripted run. Plus 4 more in the JSON.

#### pci-device-delivery

**Device delivery, guide back-out, wire migration, support options and guide extension.** L, P1, wave 17. Lab: angio-pci.

- Learner: Feels a stent stall at a calcified bend, sees the guide back out and the wire migrate, and solves delivery with support options and a guide extension.
- Built: Makes advanceDevice the only device motion path and adds shaft markers, two-hand versus independent-hand technique, guide suck-in on withdrawal, the support menu for failed delivery, stepwise guide-extension delivery and the stuck-stent start state.
- Requests: pm-prep-and-stent#3, pm-prep-and-stent#4, pm-monitoring#3, eq-sheaths-guides#0, eq-sheaths-guides#1, cp-uncrossable#1, eq-sheaths-guides#8, cp-uncrossable#4.
- Depends on: pci-lab-shell-session, pci-device-catalogue, pci-guide-engagement, pci-lab-input, pci-tip-context.
- Files (11): src/simulation/pci/actions/devices.ts, src/simulation/pci/guide.ts, src/simulation/pci/state.ts, src/ui/pci/pciInputTarget.ts, src/ui/pci/consoles/SupportConsole.tsx, src/ui/pci/inputBindings/support.ts, src/ui/lab/TableView.tsx, src/simulation/pci/scenarios/packs/delivery.ts, and 3 more.
- Acceptance: delivery.test.ts: a 3.0 x 22 stent pushed at the calcified bend with a JR4 6 Fr gives guideBackouts >= 1 and wire migration when unpinned, none when pinned; with the extension 40 mm in it crosses. Balloon-assisted tracking advances the extension past the bend; skipping deflation fails. counters.unscreened increments when a device passes the guide tip with fluoroscopy off. Plus 5 more in the JSON.

#### pci-cx-recognition

**Complication recognition: cues first, cause-finding and grading before the label.** M, P1, wave 17. Lab: angio-pci.

- Learner: Recognises and grades a complication from cues before the lab names it, and is scored on time to recognition.
- Built: Stops the lab naming complications. The engine progresses as before, but the learner sees cues until a structured assessment (cause-finding for flow failure, NHLBI grade for dissection, location and Ellis grade for perforation, TIMI grade). Time to recognition is scored.
- Requests: cm-flow-embolism#2, cm-principles-closure#2, cm-principles-closure#3, cm-perforation#0.
- Depends on: pci-lab-shell-session, pci-tip-context, found-launch-links.
- Files (10): src/simulation/complications/types.ts, src/simulation/complications/engine.ts, src/simulation/complications/complications.test.ts, src/simulation/pci/actions/step.ts, src/ui/pci/RecognitionForm.tsx, src/ui/pci/PciLab.tsx, src/mentor/metrics.ts, src/ui/lab/pciEvents/recognition.ts, and 2 more.
- Acceptance: complications.test.ts: a lesion dissection emits only 'cue' notes to st.events; the 'label' note appears in debrief data. recognition.test.ts: before recognition the context lacks 'dissection'; after a submitted grade it has it and phase 'complication'. pciMetrics reports timeToRecognitionS and correctness. Plus 5 more in the JSON.

#### proc-preprocedure-orders

**Pre-procedure drug orders: anticoagulants, antiplatelets, kidney protection.** L, P1, wave 17. Lab: procedure.

- Learner: Writes scored pre-procedure orders for anticoagulants, antiplatelets and kidney protection with a contrast ceiling.
- Built: A scored pre-procedure order sheet: oral anticoagulant hold, continue or bridge with restart time; aspirin and P2Y12 choice, load and timing with contraindication screening; saline, metformin, NSAID and statin orders for a low-eGFR patient with a stated contrast ceiling.
- Requests: pm-antithrombotics#4, pm-antithrombotics#5, cm-patient-complications#5.
- Depends on: proc-chart-planted-problems, found-patient-formulary.
- Files (7): src/simulation/session/preorders.ts, src/simulation/session/preorders.test.ts, src/simulation/session/modules/preorders.ts, src/simulation/session/scenarios/preorders.ts, src/simulation/session/scenarios/preorders.launch.ts, src/ui/access/chart/PreOrders.tsx, src/ui/access/panels/TablePanel.tsx.
- Acceptance: AF on apixaban with normal clearance scores 'hold without bridging' correct and 'bridge' wrong; a mechanical valve on warfarin scores the reverse. Prasugrel with a previous stroke is wrong; ticagrelor with a strong CYP3A inhibitor is wrong. In 'ckd-low-ef' a saline rate above the tailored rate raises LVEDP and pulmonary-oedema. Plus 3 more in the JSON.

#### pci-attending

**Attending in the PCI lab: pre-brief and plan, time-out, safety stops, sign-out and PEARLS debrief.** L, P1, wave 18. Lab: angio-pci.

- Learner: Is briefed, plans the case, runs the time-out, is stopped at unsafe steps, signs out with an equipment and wire check, and gets a PEARLS debrief with measured metrics.
- Built: Wires MentorEngine, the unused PCI rules, the PCI pre-briefs and the PEARLS debrief into the PCI lab through a PCI bridge. Adds the planning form with a complication forecast, the team time-out, sign-out with equipment and wire-integrity checks, and a logbook entry with measured metrics instead of 100 or 0.
- Requests: pm-monitoring#4, pm-planning#0, cm-principles-closure#0, hb-safe-practice#3, hb-safe-practice#2, hb-the-operator#4, cm-principles-closure#8.
- Depends on: pci-lab-shell-session, pci-tip-context, found-mentor-registries, found-patient-formulary.
- Files (12): src/mentor/bridge/pciSession.ts, src/ui/pci/usePciAttending.ts, src/mentor/rules/pci.ts, src/mentor/context.ts, src/mentor/prebrief.ts, src/mentor/metrics.ts, src/mentor/mentor.test.ts, src/content/mentor/prebriefs.ts, and 4 more.
- Acceptance: mentor.test.ts: a bridge input with the wire in a septal fires wire-septal; preAction('inflate') with an oversized balloon outside the lesion returns allow=false at entrustment 1; preAction('advance-device') with the beam off as the device leaves the guide returns allow=false; preAction('deploy') without a positioning run triggers deploy-without-run. The sign-out blocks finish in the wire-integrity variant until the damaged wire is recorded. pciMetrics on a recorded headless run reports deployWithoutPositioningRun, oversizedOutsideLesion and deviceBeyondWire consistent with st.counters. Plus 4 more in the JSON.

#### access-closure-radial

**Radial closure with high ACT, band position, spasm on removal and late radial problems.** M, P1, wave 18. Lab: access.

- Learner: Closes the radial artery with a correctly placed band and patent haemostasis, including with a high ACT and a gripping spasm.
- Built: Radial closure that can open with a large sheath, a high ACT and an antiplatelet infusion running: side-arm vasodilator, band positioned relative to skin and arterial punctures, inflation and patent haemostasis with the pleth, spasm gripping the sheath, a second band for a proximal haematoma, timed removal and late radial complications.
- Requests: pm-closure#4, pm-engaging#4, cm-access-complications#6, cm-access-complications#5.
- Depends on: access-radial-sequence, access-multi-site.
- Files (7): src/simulation/access/closure.ts, src/simulation/session/caseSession.ts, src/ui/access/panels/ClosurePanel.tsx, src/ui/access/WristView.tsx, src/simulation/access/radialClosure.test.ts, src/simulation/session/scenarios/closureRadial.ts, src/simulation/session/scenarios/closureRadial.launch.ts.
- Acceptance: A band centred 8 mm distal to the arterial puncture bleeds at the planned volume; centred over it does not. In 'closure-radial-7fr-act320-gpi' pulling the sheath at once is correct and waiting for the ACT wrong. Forced removal in 'closure-radial-spasm-grip' is critical and schedules a forearm haematoma; the cuff and vasodilator path does not. Plus 3 more in the JSON.

#### pci-bench-stent-platforms-sizing

**Stent platforms, positioning feedback, tapering, small and large vessels, and the aorto-ostial mode.** L, P1, wave 18. Lab: pci-bench.

- Learner: Chooses a platform and size, avoids geographic miss and overexpansion, and handles small, ectatic and aorto-ostial vessels.
- Built: Generic stent platforms with size range, post-dilatation limits by size band, strut thickness, cell design and marker offsets; geographic miss against the recorded predilatation; cardiac motion and rapid pacing; overexpansion limits; small and ectatic vessel variants; and an aorto-ostial bench with four failure modes.
- Requests: pm-prep-and-stent#7, cp-left-main#4, cp-other-complex#5, cp-ostial#3, eq-balloons-stents-cart#4.
- Depends on: pci-bench-imaging-unify.
- Files (9): src/simulation/bench/platforms.ts, src/simulation/bench/platforms.test.ts, src/simulation/pciBench.ts, src/simulation/pciBench.test.ts, src/simulation/pci/stentGeometry.ts, src/ui/bench/StentPanel.tsx, src/ui/bench/OptimisePanel.tsx, src/ui/imaging/LongitudinalView.tsx, and 1 more.
- Acceptance: platforms.test.ts: every platform's limits match the module table; POT to 5.0 mm on a 3.5 mm platform with a 4.5 mm limit is flagged. Predilatation over 10-25 mm with a stent over 12-24 mm reports a geographic miss. 'ostial-rca-short' with the stent ending 1 mm distal to the ostium passes the angiographic check and fails IVUS coverage. Plus 3 more in the JSON.

#### pci-pressure-wire-console

**Pressure-wire console in the PCI lab on the shared pressure-wire session.** M, P1, wave 19. Lab: angio-pci.

- Learner: Equalises, measures FFR and resting ratios, and does a pullback and drift check in the PCI lab with the same console as the physiology lab.
- Built: Exposes the in-lab pressure wire through a console that uses the pwSession reducer and plots built by physiology-engine-unify-and-setup, so the physiology lab and the PCI lab have one pressure-wire front end (HANDOVER 6.5). Equalisation can fail for real reasons; pullback, drift and co-registration on the stored angiogram.
- Requests: pm-monitoring#2, pm-physiology#9, pm-imaging#8.
- Depends on: pci-lab-shell-session, physiology-engine-unify-and-setup, pci-lab-input, found-launch-links.
- Files (6): src/ui/pci/consoles/PressureWireConsole.tsx, src/ui/pci/inputBindings/pressureWire.ts, src/simulation/pci/pressureWire.ts, src/simulation/pci/pressureWire.test.ts, src/simulation/pci/actions/pressure.ts, src/content/practice/pci-pressure-wire-console.launch.ts.
- Acceptance: pressureWire.test.ts: equalisation fails with line air and succeeds after flushing; an 85% mid-LAD lesion gives FFR < 0.80 at hyperaemia; a loose transducer gives drift > 0.03. A guide left contrast-filled is rejected at equalisation with a message. browser: Pa/Pd show, the pullback plot draws and the sensor marker sits on the stored frame. Plus 3 more in the JSON.

#### diag-lab-drugs

**Drug orders as syringe actions in the diagnostic lab.** L, P1, wave 19. Lab: cathlab.

- Learner: Doses intracoronary nitrate from the pressure, gives IA and IV drugs by the right route with team read-back, and meets PDE-5 and other interactions.
- Built: A drugs tab and syringe actions: IC GTN dosed by the learner from the systolic pressure, route through the manifold or the Y-connector, IA cocktail through the sheath, and IV drugs given by the team with read-back. The formulary and interactions come from found-patient-formulary.
- Requests: pm-acquiring#0, pm-lab-drugs#1, cm-patient-complications#10, pm-interpreting#8, pm-acquiring#1, pm-lab-drugs#8, cm-patient-complications#1.
- Depends on: diag-tip-context, diag-scenario-registry, found-patient-formulary, found-lab-controls-registry, found-mentor-registries.
- Files (9): src/ui/lab/controls/tabs/DrugsTab.tsx, src/ui/lab/TableView.tsx, src/ui/lab/labTeam.ts, src/simulation/patient/patient.ts, src/mentor/rules/diagDrugs.ts, src/ui/sim/modules/drugs.ts, src/ui/sim/drugs.test.ts, src/simulation/diagnosticScenarios/drugs.ts, and 1 more.
- Acceptance: GTN 200 ug IC lowers systolic within 90 s; with a PDE-5 inhibitor 4 h earlier the fall is larger; phenylephrine reverses it. give-ic with tipState ventricularised returns allow false with an utterance. IA verapamil raises vasodilator-given for 300 s of lab time. Plus 3 more in the JSON.

#### structural-transseptal-hands-on

**Hands-on transseptal puncture shared by TEER, LAAO, PMC and the septal occluder.** L, P1, wave 19. Lab: teer.

- Learner: Performs a transseptal puncture by hand with its confirmations and complications.
- Built: A manipulated needle and sheath replace the fossa point-picker: arrow on a clock face, pull-down from the SVC with two jumps, ectopy at the superior rim, tenting in the bicaval view, and the contact point moved only by combined rotation and withdrawal; then the four crossing confirmations, heparin and ACT, air at the hub, and aortic puncture, vagal reflex, delayed posterior tamponade and resistant crossing branches.
- Requests: hb-mitral-tricuspid-laa#0, hb-mitral-tricuspid-laa#1.
- Depends on: structural-tips-and-tavi-course.
- Files (9): src/simulation/transseptal.ts, src/simulation/transseptal.test.ts, src/simulation/teer.ts, src/ui/structural/TransseptalStage.tsx, src/ui/structural/FossaPicker.tsx, src/ui/structural/TeerLab.tsx, src/ui/structural/LaaoLab.tsx, src/ui/lab/structuralTips.ts, and 1 more.
- Acceptance: Rotation alone does not move the tent point; clockwise with withdrawal moves it posterior; the pull-down registers two jumps. Advancing the dilator after an aortic-trace confirmation is critical and produces haemopericardium. The vagal variant resolves without effusion; delayed tamponade raises hypotension later; TEER and LAAO results through the new module are unchanged. Plus 2 more in the JSON.

#### pci-budgets-stop-rules

**Contrast and radiation budgets, checkpoints and stop rules.** M, P1, wave 20. Lab: angio-pci.

- Learner: Works within a patient-specific contrast ceiling and dose budget, hears the announcements and decides at a stop-or-continue checkpoint.
- Built: Each patient's contrast ceiling from contrastBudget.ts, every millilitre and the live dose tracked, thresholds announced, a stop-or-continue checkpoint, and a multivessel stable scenario that exercises the counters.
- Requests: cm-patient-complications#4, cm-patient-complications#9, cm-principles-closure#1, cp-cto-strategy#4, pm-planning#1, pm-target#4.
- Depends on: pci-lab-shell-session, pci-scenario-registry, found-patient-formulary, pci-tip-context.
- Files (8): src/simulation/pci/budgets.ts, src/simulation/pci/budgets.test.ts, src/ui/pci/PciLabSession.ts, src/ui/pci/PciCheckpoint.tsx, src/ui/pci/PciLab.tsx, src/simulation/pci/scenarios/packs/multivessel.ts, src/simulation/pci/scenarios/packs/multivessel.launch.ts, src/ui/lab/pciEvents/budgets.ts.
- Acceptance: budgets.test.ts: eGFR 45 gives 166.5 mL; eGFR 25 gives a ceiling below the clearance rule; 60 mL two days earlier is subtracted. Crossing the warning threshold raises high-contrast-volume once and keeps it active; 5 Gy raises high-radiation-dose; both appear in the finish context. A KAR of 1 Gy emits an announcement; the checkpoint holds the beam until answered. Plus 3 more in the JSON.

#### pci-antithrombotic-orders

**Anticoagulation and antiplatelet orders: ACT targets, recheck clock, protamine, GP IIb/IIIa, cangrelor, bivalirudin and HIT.** M, P1, wave 20. Lab: angio-pci.

- Learner: Orders heparin, protamine, GP IIb/IIIa, cangrelor or bivalirudin with device- and regimen-specific ACT targets, and manages a suspected HIT case.
- Built: Replaces the single 250 s ACT gate with device- and regimen-specific targets and a recheck clock, and adds protamine with dose, rate and reaction, the intravenous antiplatelets with renal adjustment, and a suspected-HIT case that forces bivalirudin. The drugs themselves are in found-patient-formulary.
- Requests: pm-antithrombotics#0, pm-antithrombotics#2, pm-antithrombotics#3, pm-antithrombotics#6.
- Depends on: pci-lab-shell-session, found-patient-formulary.
- Files (7): src/simulation/pci/lesionAssessment.ts, src/simulation/pci/doses.ts, src/simulation/pci/actions/drugs.ts, src/ui/pci/consoles/DrugsConsole.tsx, src/simulation/pci/scenarios/packs/antithrombotic.ts, src/simulation/pci/scenarios/packs/antithrombotic.launch.ts, src/simulation/pci/antithrombotic.test.ts.
- Acceptance: antithrombotic.test.ts: Hemochron with heparin alone fails the gate at 270 s and passes at 310 s; with eptifibatide running 230 s passes. Protamine for 7,000 U at 30 min is within the Brilakis and Oxford ranges and capped at 50 mg; a rate above 5 mg/min raises the reaction probability. Eptifibatide is halved at CrCl 45; tirofiban is halved at CrCl 55. Plus 3 more in the JSON.

#### pci-bench-bifurcation

**Bifurcation bench and the shared technique step catalogue.** L, P1, wave 20. Lab: pci-bench.

- Learner: Practises provisional and two-stent techniques with the effect of each step visible in cross-section.
- Built: A bifurcation segment with cross-sectional and longitudinal strut views covering provisional stenting with POT and cell choice, one-step versus two-step kissing, and TAP, DK crush and culotte as ordered steps whose mistakes show on imaging. Defines src/simulation/pci/technique/steps.ts, the step catalogue the PCI lab's technique machines and the tips' step numbers share.
- Requests: cp-bifurcation-two-stent#10, cp-bifurcation-provisional#4, cp-bifurcation-two-stent#8.
- Depends on: pci-bench-imaging-unify, pci-bench-stent-platforms-sizing.
- Files (7): src/simulation/pci/technique/steps.ts, src/simulation/bench/bifurcation.ts, src/simulation/bench/bifurcation.test.ts, src/ui/bench/BifurcationPanel.tsx, src/ui/imaging/BifurcationView.tsx, src/ui/sections/PciBench.tsx, src/content/lab/presets/pci-bench/bifurcation.launch.ts.
- Acceptance: bifurcation.test.ts: two-step kissing leaves less SB-ostium metal than one-step; POT at the carina corrects the oval index after kissing; POT beyond the carina flags distal overstretch. Finet diameter equals 0.678 x sum; a pair within 0.25 mm of the proximal reference is accepted. DK crush with 1 mm protrusion or a proximally sized crush balloon past the carina is a failure state; steps unlock in order; the step numbers equal those in technique/steps.ts. Plus 2 more in the JSON.

#### diag-anatomy-variants

**Anatomy presets: anomalous origins, RCA variants, roots, conus, bridge, fistula.** L, P1, wave 21. Lab: cathlab.

- Learner: Finds anomalous origins, high ostia, a separate conus, a bridge, a fistula and very dilated roots by injection and catheter choice.
- Built: Exposes in the analytic ostia, the render tree and the physics lumens the anomalies the renderer can already grow, and adds the missing ones, so engagement problems come from anatomy.
- Requests: pm-interpreting#9, pm-engaging#6, pm-engaging#7, pm-engaging#8.
- Depends on: diag-scenario-registry, found-case-model-types, realism-baseline.
- Files (9): src/simulation/anatomy.ts, src/simulation/caseGenerator.ts, src/render/xray/coronaryGrowth.ts, src/render/xray/coronaryAtlas.ts, src/render/xray/contrastTransport.ts, src/physics/coronaryLumens.ts, src/simulation/diagnosticScenarios/anatomy.ts, src/simulation/diagnosticScenarios/anatomy.launch.ts, and 1 more.
- Acceptance: anatomy.test.ts: each new variant builds a tree whose LCx, RCA or LM origin is on the stated sinus; regionSupply assigns the lateral wall to the RCA injection for anomalous-lcx-right-sinus. physics: AL1 with the Amplatz procedure engages the anomalous RCA from the left sinus in at least 2 of 5 starts; JR4 in fewer. render: the myocardial bridge radius is smaller at contraction 1 than at 0. Plus 4 more in the JSON.

#### proc-heparin-act-handover

**Heparin, ACT and contrast budget carried through the hand-over to ad hoc PCI.** M, P1, wave 21. Lab: procedure.

- Learner: Doses heparin and checks the ACT at the hand-over to ad hoc PCI, with the contrast budget carried over.
- Built: Records every heparin dose with time and route, makes the PCI heparin dose and ACT a decision at the hand-over, adds a tissued cannula event, and carries the contrast budget and remaining contrast into PCI. The half-life recalibration itself is in found-patient-formulary.
- Requests: pm-antithrombotics#1, cm-patient-complications#5.
- Depends on: proc-preprocedure-orders, found-handover-contract, found-patient-formulary.
- Files (7): src/simulation/session/caseSession.ts, src/ui/sections/ProcedureLab.tsx, src/state/useProcedureStore.ts, src/ui/access/orders/Heparin.tsx, src/simulation/session/caseSession.test.ts, src/simulation/session/scenarios/heparin.ts, src/simulation/session/scenarios/heparin.launch.ts.
- Acceptance: 'tissued-cannula' gives an ACT within 20 s of baseline after an IV 5000 U bolus; an IA redose reaches target. A PCI dose of 100 U/kg minus the access dose is correct; 100 U/kg on top of a planned GP IIb/IIIa is wrong. SessionHandover.contrast.remainingMl equals budget minus used. Plus 3 more in the JSON.

#### haemo-rhc-manoeuvre

**Torque-directed right heart catheterisation with ectopy, VT, knot and AF events.** L, P1, wave 21. Lab: haemo.

- Learner: Steers a right heart catheter by torque under fluoroscopy and handles ectopy, VT, a knot and AF.
- Built: Replaces the four-button RHC with a femoral catheter driven by advance, withdraw and torque on the pacing lab's chamber-zone model: side-branch catching, an RA loop to enter the RV, ectopy and VT from forceful RVOT work, reaching the PA from the apex with cranial rotation, breath effects, wedging on inspiration, a knot after prolonged forceful manipulation, and AF from atrial manipulation.
- Requests: hb-cardiac-catheterisation#5, hb-background#8, hb-background#5.
- Depends on: haemo-study-session-and-tips, pacing-in-lab-scenarios-and-tips.
- Files (7): src/simulation/rightHeartCatheter.ts, src/simulation/rightHeartCatheter.test.ts, src/simulation/pacing.ts, src/ui/haemo/CatheterPanel.tsx, src/ui/haemo/RhcFluoro.tsx, src/ui/lab/haemoTips.ts, src/content/lab/presets/haemo/rhc.launch.ts.
- Acceptance: From the femoral route without an RA loop the catheter does not enter the RV in 20 attempts; with a loop it does. Withdrawing from the apex with cranial rotation reaches the PA; forceful RVOT advance raises VT more often than gentle advance. Pulling a formed knot tight before calling for help is a critical error. Plus 3 more in the JSON.

#### pci-assessment-policy-qca

**Assessment-mode policy, trainee QCA and removal of revealed ground truth.** M, P1, wave 22. Lab: angio-pci.

- Learner: Measures the lesion with QCA and sizes devices without the lab revealing the answer; supervised and exam runs hide teaching aids.
- Built: Applies the diagnostic lab's LabPolicy and labScreens rules to PCI. QCA becomes the trainee's own measurement on stored runs; coach read-outs are off by default and tied to guided mode; the live log shows only what an operator could see; displayed sizes and pressures come from the catalogue charts.
- Requests: none (enabling package).
- Depends on: pci-lab-shell-session, pci-device-catalogue.
- Files (7): src/ui/lab/visibility.ts, src/ui/pci/PciLab.tsx, src/ui/pci/PciAssessPanel.tsx, src/ui/lab/ReferenceMonitor.tsx, src/ui/lab/QcaTool.tsx, src/simulation/pci/actions/assessment.ts, src/ui/lab/lab.test.ts.
- Acceptance: lab.test.ts: labScreens for a PCI exam policy has teachingAids false and hints 'off'; guided entrustment 1 has teachingAids true. A headless dissection produces no live log line containing 'dissection'; the debrief lists it. QCA on a stored PCI run calibrated on a 6 Fr guide returns MLD within 0.2 mm of truthNow for lad-focal (integration test with a captured frame). Plus 2 more in the JSON.

#### diag-lv-aorta-render

**Ventriculogram and aortogram imaging with wall motion and regurgitation.** L, P1, wave 22. Lab: cathlab.

- Learner: Sees a ventriculogram with real segmental wall motion, mitral and aortic regurgitation and stains, and a realistic aortogram.
- Built: Replaces the uniformly filling ventriculogram ellipsoid with an LV cavity that has segmental wall motion tied to coronary territories, mitral regurgitation into a left atrium, aortic regurgitation into the LV, stain, thrombus, takotsubo, VSD jet and the anomalous circumflex dot sign, plus aortogram and iliofemoral run imaging.
- Requests: hb-cardiac-catheterisation#0, hb-cardiac-catheterisation#1, hb-cardiac-catheterisation#2, hb-specific-conditions#3, hb-background#1, cm-perforation#10, cp-complex-patients#7.
- Depends on: realism-baseline.
- Files (6): src/render/xray/lvGram.ts, src/render/xray/lvGram.test.ts, src/render/xray/sceneBuilder.ts, src/render/xray/heartMotion.ts, src/render/xray/heartShape.ts, src/simulation/patient/engine.ts.
- Acceptance: lvGram.test.ts: an akinetic anterior segment's projected area change in RAO 30 is under 10% of a normal segment's; a dyskinetic one moves outward. MR grade III gives LA mean opacity close to the LV's; grade I clears each beat. browser: window.__fluoroDraw('cine') during an LV injection at RAO 30 shows the cavity contracting with the case's pattern. Plus 2 more in the JSON.

#### haemo-aortic-stenosis-studies

**Crossing the stenotic aortic valve, and low-flow low-gradient AS with dobutamine.** L, P1, wave 22. Lab: haemo.

- Learner: Decides whether to cross a stenotic valve, crosses it well, and works up low-flow low-gradient AS with dobutamine.
- Built: A cross-or-not decision from the echo report, a crossing manoeuvre with catheter and wire choice, an optional aortogram landmark and a manipulation-quality monitor with embolism risk rising with crossing time; simultaneous LV-Ao gradient against the pullback; classical LFLG AS with live Gorlin under staged dobutamine.
- Requests: hb-specific-conditions#0, hb-specific-conditions#1.
- Depends on: haemo-study-session-and-tips.
- Files (7): src/simulation/haemo.ts, src/simulation/haemo.test.ts, src/simulation/haemo/avCrossing.ts, src/simulation/haemo/avCrossing.test.ts, src/ui/haemo/CatheterPanel.tsx, src/ui/haemo/ValvePanel.tsx, src/content/lab/presets/haemo/aorticStenosis.launch.ts.
- Acceptance: Crossing in 'as-concordant-echo' is an unnecessary crossing. gorlinLive in 'lflg-pseudo' rises above 1.0 cm2 at peak dobutamine; in 'lflg-true' it stays at or below 1.0 while the gradient exceeds 40; 'lflg-no-reserve' stroke volume rises less than 20%. AL1 with a straight hydrophilic wire crosses in fewer attempts than a pigtail with a J wire; haemo-as-* tips appear only with aortic-stenosis. Plus 2 more in the JSON.

#### pci-equipment-tray

**Equipment tray and table workflow: cart, label, preparation, backload, valve, aspirate.** M, P1, wave 23. Lab: angio-pci.

- Learner: Checks the cart, reads the box label, prepares, backloads and introduces each device through the valve and aspirates the guide, with air and expired boxes as real traps.
- Built: Replaces the instant loadDevice shim with the engine's real workflow (requestDevice, checkLabel, prepareDevice, backloadDevice, setValve, aspirateGuide), with a cart that has stock and expiry, a prep station whose mixture choice changes what fluoroscopy shows, and wire set-up with the Y-connector, introducer and torque device.
- Requests: pm-prep-and-stent#0, pm-prep-and-stent#2, pm-wiring#5, eq-balloons-stents-cart#5, hb-the-operator#4.
- Depends on: pci-lab-shell-session, pci-device-catalogue, found-mentor-registries, realism-baseline, found-launch-links.
- Files (10): src/simulation/pci/cart.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/state.ts, src/simulation/pci/coronaryWire.ts, src/ui/pci/consoles/EquipmentTray.tsx, src/ui/pci/consoles/AssistedDeviceConsole.tsx, src/ui/pci/render/balloonFill.ts, src/mentor/rules/pciTray.ts, and 2 more.
- Acceptance: tray.test.ts: backload without prepareDevice increments counters.unpreparedDevices and adds guide air; the next injection without aspiration produces an air complication (seeded). Balloon iodine with mixture 'saline' is below a visibility threshold and with '1:1' above it. An expired box is flagged at the label check and its use is recorded in the debrief. Plus 5 more in the JSON.

#### physiology-hyperaemia-and-adenosine

**Hyperaemia choices, failures, dose entry and adenosine arrhythmias.** L, P1, wave 23. Lab: physiology.

- Learner: Gives adenosine by the right route and dose, recognises failed hyperaemia and manages adenosine arrhythmias.
- Built: IC adenosine with a dose by vessel and a guide flush, IV adenosine at 140-180 ug/kg/min by line site with systemic signs, contrast FFR, failure states (tissued vein, saline, low dose, caffeine, disengaged guide, early reading), and adenosine AV block, AF and VF with orders.
- Requests: pm-physiology#2, pm-lab-drugs#4, pm-physiology#3.
- Depends on: physiology-engine-unify-and-setup, found-patient-formulary.
- Files (8): src/simulation/patient/engine.ts, src/simulation/patient/pharmacology.ts, src/simulation/patient/patient.test.ts, src/simulation/pci/pwSession.ts, src/ui/physiology/MeasurePanel.tsx, src/ui/physiology/OrdersPanel.tsx, src/ui/lab/physiologyTips.ts, src/content/lab/presets/physiology/hyperaemia.launch.ts.
- Acceptance: An IC RCA dose of 200 ug arms AV block more often than 60 ug over 500 seeded runs; a peripheral IV infusion reaches 90% effect later than central. FFR at h < 0.9 is flagged submaximal; FFR before the guide flush after an IC bolus is flagged early. In 'adenosine-vf' engine.shock() restores an organised rhythm by the engine's model. Plus 3 more in the JSON.

#### physiology-left-main-and-ostial

**Branched left main physiology and aorto-ostial measurement with the guide disengaged.** L, P1, wave 23. Lab: physiology.

- Learner: Measures left main and ostial lesions correctly, including masking by downstream disease and guide disengagement.
- Built: A branched case (LM feeding LAD and LCx in parallel) so pullbacks from both branches localise the step and downstream LAD disease masks LM severity, and ostial LM or aorto-ostial RCA cases where an engaged guide damps the trace and the FFR reads falsely high until disengaged.
- Requests: pm-physiology#5, pm-physiology#6, cp-ostial#5, cp-left-main#7.
- Depends on: physiology-engine-unify-and-setup.
- Files (5): src/simulation/physiology.ts, src/simulation/physiology.test.ts, src/ui/physiology/TraceView.tsx, src/ui/physiology/VesselStrip.tsx, src/content/lab/presets/physiology/leftMain.launch.ts.
- Acceptance: In 'lm-masked-by-lad' the LCx FFR rises when the LAD lesion is removed; in 'lm-ostial-lcx' only the LCx pullback shows a step. 'ostial-rca-engaged' FFR engaged exceeds disengaged by 0.03-0.05 without side holes and by about half with them. An unbranched case gives identical results through the branched solver; the solver converges at 95% DS. Plus 2 more in the JSON.

#### haemo-transducer-and-setup

**Transducer levelling, zeroing, fast-flush test and manifold set-up.** M, P1, wave 24. Lab: haemo.

- Learner: Levels, zeros and tests the transducer and flushes the manifold properly.
- Built: Every haemo trace goes through the Transducer model: level at the mid-thoracic point, zero through the manifold, find a transducer mis-levelled at V4 and a table move after zeroing, read the fast-flush test, and flush a manifold with a hidden bubble.
- Requests: pm-monitoring#1, hb-cardiac-catheterisation#10.
- Depends on: haemo-study-session-and-tips.
- Files (6): src/simulation/haemoStudy.ts, src/simulation/haemoStudy.test.ts, src/simulation/patient/transducer.ts, src/ui/haemo/TracePanel.tsx, src/ui/haemo/SetupPanel.tsx, src/content/lab/presets/haemo/setup.launch.ts.
- Acceptance: A transducer 10 cm above the level under-reads RA by about 7.4 mmHg; zeroing after levelling removes it; a table move after zeroing with a pole transducer re-introduces it. Fast-flush verdicts: optimal for the default line, overdamped with 0.3 mL air, underdamped with a 300 cm line. Injecting through an unflushed manifold raises air and is a critical error. Plus 2 more in the JSON.

#### angio-expert-label-drills

**Expert labels and label-gated reading drills on the real library.** L, P1, wave 25. Lab: angio-real.

- Learner: Grades TIMI flow and counts frames on simulated runs at once, and on expert-labelled real runs (with morphology, collateral, Medina, calcium and segment drills) once a supervising reader has labelled them.
- Built: An expert label layer and a reader mode for a named supervising reader, with drills for TIMI flow and frame count, morphology, Rentrop and Werner grades, Medina, calcium, ACC/AHA class and SYNTAX segment naming, each shown only when enough runs carry labels. Until labels exist, a TIMI and frame-count drill on simulated runs, whose flow the engine knows, opens from the same lesson blocks.
- Requests: pm-interpreting#1, pm-interpreting#5, pm-interpreting#6, cp-bifurcation-provisional#5, cp-calcium#7, pm-planning#5, pm-acquiring#7.
- Depends on: found-tips-vocabulary, found-launch-links.
- Files (10): src/ui/angio/labels.ts, src/ui/angio/labels.test.ts, src/ui/angio/library.ts, src/ui/angio/CinePlayer.tsx, src/ui/sections/RealAngiograms.tsx, src/ui/sections/Settings.tsx, src/content/schema.ts, src/ui/angio/simFlowDrill.ts, and 2 more.
- Acceptance: labels.test.ts: merging labels.json gives labelled runs; the gate hides a drill with 19 labelled runs and shows it with 20. simFlowDrill.test.ts: runs rendered at the flowScale values for TIMI 0, 1, 2 and 3 are graded against the engine's grade, and the frame-count answer is the model's count at the run's fps, labelled a model value. Frame-count correction divides LAD counts by 1.7 and scales by fps; no normal value shows when refs has none. Plus 5 more in the JSON.

#### angio-decision-drills

**Revascularisation decision and SYNTAX scoring on multi-run patient studies.** M, P1, wave 26. Lab: angio-real.

- Learner: Decides between no revascularisation, PCI, CABG and the heart team on simulated multi-vessel cases with a full chart, and marks SYNTAX lesions on real studies.
- Built: Adds the revascularisation decision step, with Brilakis's stable algorithm and the heart-team rule, to simulated multi-vessel diagnostic cases that carry a full chart, and adds SYNTAX lesion marking on real AngioCAD studies compared with the AngioCAD segment grades. The real-library drill uses only what the dataset contains and asks the learner which missing facts they would need.
- Requests: pm-target#1, pm-target#2.
- Depends on: found-launch-links, angio-expert-label-drills, diag-scenario-registry, diag-study-report.
- Files (10): src/ui/sections/RealAngiograms.tsx, src/ui/angio/library.ts, src/ui/angio/syntax.ts, src/ui/angio/syntax.test.ts, src/content/decisions/revascStable.ts, src/content/decisions/revascStable.test.ts, src/content/schema.ts, src/simulation/diagnosticScenarios/multivessel.ts, and 2 more.
- Acceptance: revascStable.test.ts: an asymptomatic single-vessel patient without proximal LAD disease or > 10% ischaemia returns 'no revascularisation'; diabetes with multivessel disease and a good surgical candidate returns 'CABG'. syntax.test.ts: lesion-set agreement with AngioCAD grades is per segment; the LM threshold is not applied to three-vessel disease. browser: the real-library plan drill shows only dataset fields and asks for the missing facts with no generated values; the decision step runs on a multivessel diagnostic scenario after its study report, with the chart shown. Plus 2 more in the JSON.

### Phase 3: complications, complex PCI and the whole case end to end (P1)

Complications that are recognised before they are named, the complex PCI programmes (bifurcation, left main, ostial, calcium, ACS, CTO), grafts and the left heart in the diagnostic lab, and the full case joined end to end: diagnostic study, ad hoc gate, PCI on the diagnosed lesion, closure, ward and discharge. The phase ends with tip-retarget-catchup, which applies the tip retargets that needed these events, and content-links-backfill, which points the inline lesson blocks at the P1 scenarios.

#### pci-patient-coupling

**Patient coupling: physiology follows the treated lumen, flow drives contrast, hypotension causes, arrhythmias, defibrillation and arrest.** L, P1, wave 24. Lab: angio-pci.

- Learner: Sees the patient respond to the vessel actually treated, opacification follow coronary flow, hypotension with a hidden cause, and arrhythmias that need the defibrillator, CPR or a compression device.
- Built: Closes the HANDOVER 6.2 gaps for PCI: the engine's coronary tree follows the stented lumen, contrast transport follows engine flow, hypotension has a hidden cause from the shared cause model, and injection- and drug-related arrhythmias come with a working defibrillator, CPR and a mechanical compression device in the image.
- Requests: cm-patient-complications#0, cm-patient-complications#2, cp-complex-patients#1, pm-monitoring#0, pm-support-choice#3, cm-patient-complications#8.
- Depends on: pci-lab-shell-session, found-patient-formulary, proc-hypotension-pressors, realism-baseline, found-launch-links.
- Files (11): src/simulation/pci/hypotension.ts, src/simulation/pci/patientBridge.ts, src/simulation/pci/actions/patient.ts, src/simulation/pci/actions/step.ts, src/simulation/pci/patientCoupling.test.ts, src/ui/pci/PciLabSession.ts, src/ui/pci/render/cpr.ts, src/ui/pci/consoles/DefibConsole.tsx, and 3 more.
- Acceptance: patientCoupling.test.ts: stenting the lcx-stemi culprit restores LCx territory supply within 60 s; without stenting it does not. With engine.forceRhythm('vf') pciFlowMods flowScale < 0.2 and the contrast front advances slower. A 'valve-open' cause resolves on setValve(false); a 'tamponade' cause shows pulsus paradoxus > 10 mmHg and responds to pericardiocentesis; a 'vasovagal' cause shows HR < 50. Plus 4 more in the JSON.

#### pci-two-rail-engine

**Two wires and two devices: rails, jailing, strut-cell rewiring and kissing.** XL, P1, wave 24. Lab: angio-pci.

- Learner: Works with two wires and two devices: jailing, rewiring a chosen strut cell, kissing balloons and POT.
- Built: Extends the engine from one wire and one device to two rails, which every bifurcation, buddy-wire, parallel-wire, retrograde and jailed-wire request needs.
- Requests: cp-bifurcation-provisional#1, pm-prep-and-stent#5.
- Depends on: pci-lab-shell-session, pci-wire-microcatheter, pci-tip-context, pci-lab-input, realism-baseline, found-launch-links.
- Files (15): src/simulation/pci/state.ts, src/simulation/pci/actions/wire.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/actions/inflation.ts, src/simulation/pci/stentGeometry.ts, src/simulation/complications/sideBranch.ts, src/simulation/session/types.ts, src/input/settings.ts, and 7 more.
- Acceptance: twoRail.test.ts: deploying the main-vessel stent with rail B in the diagonal sets rails[1].jailed; rewiring rail B at the distal stent position reports cell 'distal'; kissing gives two occlusions in pciFlowMods. POT increases proximal ring diameters only. An under-strut wire makes a balloon stall at the stent edge. Plus 4 more in the JSON.

#### diag-catheter-kink

**Torque loss and catheter kinking with the manual's recovery sequence.** L, P1, wave 25. Lab: cathlab.

- Learner: Recognises torque loss and a kinked catheter and follows the manual's recovery sequence.
- Built: Adds a kink to the rod physics: twist stored in a tortuous segment while the tip stops following latches a kink that damps the trace, blocks aspiration and shows on fluoroscopy of the whole catheter, with prevention measures and Brilakis's escalation.
- Requests: pm-engaging#2, eq-sheaths-guides#4, cp-prior-cabg#2, cp-complex-patients#5.
- Depends on: diag-rod-physics, diag-pressure-transducer, diag-tip-context, found-lab-controls-registry, diag-scenario-registry.
- Files (10): src/physics/engine.ts, src/physics/lumen.ts, src/physics/protocol.ts, src/physics/legacyBridge.ts, src/physics/kink.test.ts, src/ui/physics/physicsDevices.ts, src/ui/lab/controls/tabs/KinkTab.tsx, src/simulation/patient/transducer.ts, and 2 more.
- Acceptance: kink.test.ts: 20 manoeuvre-suite runs in normal anatomy produce zero kinks. In 'tortuous-iliac' three one-way turns without a wire latch a kink in at least 4 of 5 starts; with the wire inside or a 45 cm sheath, fewer. A latched kink gives tipState damped or none and aspiration 'no-return'. Plus 3 more in the JSON.

#### diag-grafts-svg

**Post-CABG cases: vein grafts in the shared tree, operation note, engagement, imaging, aortogram road map and report.** XL, P1, wave 25. Lab: cathlab.

- Learner: Finds and images vein grafts from the operation note, reads competitive flow and uses an aortogram road map.
- Built: Grafts in anatomy, image and physics. Post-CABG scenarios carry an operation note, graft ostia at their usual levels, patent, diseased and occluded grafts with stumps, competitive and collateral filling, sternal wires, clips and ring markers, graft catheters, graft-not-found handling and a frozen aortogram road map. The graft vessels are part of the shared coronary tree, so pci-graft and the prior-CABG CTO use them.
- Requests: cp-prior-cabg#0, cp-prior-cabg#1, hb-cardiac-catheterisation#3, pm-acquiring#9, hb-background#2.
- Depends on: diag-rod-physics, diag-scenario-registry, diag-study-report, diag-lesion-morphologies, realism-baseline.
- Files (15): src/simulation/anatomy.ts, src/render/xray/coronaryGrowth.ts, src/render/xray/coronaryTree.ts, src/render/xray/contrastTransport.ts, src/render/xray/sceneBuilder.ts, src/physics/coronaryLumens.ts, src/physics/catheterShapes.ts, src/data/catheters.ts, and 7 more.
- Acceptance: grafts.test.ts: graft ostia heights are ordered circumflex > LAD > RCA, all anterior to the native RCA ostium. With a native proximal occlusion and a patent graft, a native injection does not fill the distal territory and a graft injection does; with a stenosed native vessel competitive washout appears. JR4 with LAO withdrawal and clockwise torque engages the right SVG in at least 2 of 5 starts; repeated failed attempts near the LAD graft level raise graft-not-found. Plus 4 more in the JSON.

#### pci-flow-closure

**Flow failure and abrupt closure: no-reflow with distal delivery, embolisation types, air, spasm, pseudolesions, dissection rescue, aortocoronary dissection.** L, P1, wave 26. Lab: angio-pci.

- Learner: Treats no-reflow with distal delivery, distinguishes embolisation types, air, spasm and pseudolesions, rescues abrupt closure and manages an aortocoronary dissection.
- Built: Builds the flow and closure states the requests describe. Each can be graded and needs a specific treatment; start states drop the learner into closure, air or an aortic stain.
- Requests: cm-flow-embolism#0, cm-flow-embolism#1, cm-flow-embolism#4, cm-flow-embolism#5, cm-flow-embolism#10, cm-principles-closure#2, cm-principles-closure#3, cm-principles-closure#5, pm-interpreting#2, pm-interpreting#4, pm-lab-drugs#2, pm-lab-drugs#13.
- Depends on: pci-cx-recognition, pci-wire-microcatheter, pci-patient-coupling, found-patient-formulary, pci-lab-input.
- Files (13): src/simulation/complications/noReflow.ts, src/simulation/complications/thrombus.ts, src/simulation/complications/airEmbolism.ts, src/simulation/complications/dissection.ts, src/simulation/complications/complications.test.ts, src/simulation/pci/actions/bailouts.ts, src/simulation/pci/actions/drugs.ts, src/simulation/pci/actions/patient.ts, and 5 more.
- Acceptance: complications.test.ts: adenosine via the guide with TIMI 0 does not improve flow and the same dose via the microcatheter does; two distal doses without improvement raise no-reflow-refractory. Plaque embolisation does not respond to GP IIb/IIIa; thrombus embolisation does. The air start shows HR < 50 and inferior ST elevation, resolved by aspiration plus forceful injection within the patient clock. Plus 5 more in the JSON.

#### pci-bifurcation-provisional

**Provisional bifurcation stenting with a step machine, side-branch occlusion and rescue.** L, P1, wave 26. Lab: angio-pci.

- Learner: Performs provisional bifurcation stenting step by step and rescues an occluded side branch.
- Built: The LAD-diagonal provisional scenario and variants, a provisional step machine on the shared step catalogue (from pci-bench-bifurcation), side-branch occlusion with ECG change, and rescue over the jailed wire.
- Requests: cp-bifurcation-provisional#0, cp-bifurcation-provisional#1, cp-bifurcation-provisional#2, cm-principles-closure#7, pm-physiology#9.
- Depends on: pci-two-rail-engine, pci-pressure-wire-console, pci-scenario-registry, pci-bench-bifurcation.
- Files (7): src/simulation/pci/technique/provisional.ts, src/simulation/pci/technique/index.ts, src/simulation/pci/technique/provisional.test.ts, src/simulation/pci/scenarios/packs/bifurcation.ts, src/simulation/pci/scenarios/packs/bifurcation.launch.ts, src/ui/pci/consoles/TechniqueConsole.tsx, src/ui/lab/pciEvents/bifurcation.ts.
- Acceptance: provisional.test.ts: a scripted headless run reaches step 10 with valid flags; deploying the MV stent without a jailed SB wire is flagged. In lcx-om-sb-occlusion SB TIMI 0 raises side-branch-compromise and st-elevation; a balloon over the jailed wire restores flow. pciTips: technique 'provisional' step 7 brings the distal-cell rewiring tips and no two-stent tip. Plus 3 more in the JSON.

#### pci-calcium-uncrossable

**Calcium and uncrossable lesions: rotational and orbital atherectomy, IVL, laser, cutting, the uncrossable and undilatable algorithms.** XL, P1, wave 27. Lab: angio-pci.

- Learner: Modifies calcium with rotational or orbital atherectomy, IVL, laser or cutting balloons and follows the uncrossable and undilatable algorithms.
- Built: Plaque-modification devices with run models and complications, calcium by arc, thickness and length, the balloon-uncrossable algorithm stepwise, uncrossable and undilatable variants, a penalty for direct stenting and bradycardia prevention before RCA atherectomy.
- Requests: cp-calcium#0, cp-calcium#1, cp-calcium#2, cp-calcium#3, cp-uncrossable#0, cp-uncrossable#2, pm-interpreting#12, pm-lab-drugs#5.
- Depends on: pci-device-delivery, pci-wire-microcatheter, pci-indeflator, pci-intravascular-imaging, pci-tip-context, pci-lab-input, realism-baseline.
- Files (11): src/simulation/pci/atherectomy.ts, src/simulation/pci/atherectomy.test.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/actions/inflation.ts, src/ui/pci/consoles/AtherectomyConsole.tsx, src/ui/pci/inputBindings/atherectomy.ts, src/ui/pci/render/atherectomy.ts, src/simulation/pci/scenarios/packs/calcium.ts, and 3 more.
- Acceptance: atherectomy.test.ts: a 2.0 mm burr is refused in a 6 Fr guide; runs over 15 s raise long-run and the no-reflow hazard; RCA runs without prevention give AV block more often than with aminophylline (seeded). After adequate rota runs the NC balloon expands without a waist; direct stenting without preparation gives an expansion ratio < 0.8. 'mc-fails' leaves laser over the existing wire as the next step; 'mc-crosses' allows the atherectomy wire exchange. Plus 5 more in the JSON.

#### pci-cto-planning-antegrade

**CTO planning and antegrade techniques.** XL, P1, wave 27. Lab: angio-pci.

- Learner: Plans a CTO from the dual injection and CT, escalates wires, recognises wire position on orthogonal views, and uses parallel wiring and ADR.
- Built: Makes the RCA CTO a full antegrade programme: a generator for the four angiographic features, planning with a measured dual run, hybrid strategy and fallback, set-up and CT review, the wire escalation ladder, wire positions recognisable only on orthogonal contralateral views, parallel wiring, ADR with a knuckle, and the P3 re-entry and move-the-cap stages.
- Requests: cp-cto-strategy#1, cp-cto-strategy#2, cp-cto-strategy#3, cp-cto-strategy#5, cp-cto-strategy#7, cp-cto-strategy#9, hb-the-operator#3, pm-imaging#9, pm-interpreting#7, pm-imaging#12, cp-cto-antegrade#0, cp-cto-antegrade#1, cp-cto-antegrade#2, cp-cto-antegrade#3, cp-cto-antegrade#4, cp-cto-antegrade#5, cp-cto-antegrade#6.
- Depends on: pci-wire-microcatheter, pci-intravascular-imaging, pci-budgets-stop-rules, pci-two-rail-engine, diag-lesion-morphologies.
- Files (10): src/simulation/pci/cto/generator.ts, src/simulation/pci/cto/planning.ts, src/simulation/pci/cto/cto.test.ts, src/simulation/pci/coronaryWire.ts, src/simulation/pci/actions/wire.ts, src/ui/pci/CtoPlanning.tsx, src/ui/pci/CtPanel.tsx, src/simulation/pci/scenarios/packs/cto.ts, and 2 more.
- Acceptance: cto.test.ts: the generator produces each of the four features in both states across 40 seeds; an ambiguous cap without a CT or IVUS step blocks the 'no blind cap' check. A subintimal wire is indistinguishable from true lumen in one contralateral view and distinguishable in two orthogonal views (projected offset > 1 mm). Parallel wiring with a dual-lumen microcatheter keeps the first wire's route. Plus 5 more in the JSON.

#### proc-recovery-ward

**Recovery ward with scheduled observations, site checks and timed events.** L, P1, wave 27. Lab: procedure.

- Learner: Plans observations, checks site and pulses, and acts first on ward events after the case.
- Built: Replaces the observe button with a time-accelerated ward: the learner sets the observation and mobilisation plan by route, reviews each set, inspects the site and pulses, and acts first on forearm haematoma, post-PCI chest pain, tamponade, stroke, rising creatinine and later vignettes; adds the end-of-case neurological check and embolic stroke on the table.
- Requests: hb-after-the-procedure#1, pm-monitoring#9, pm-monitoring#8, cm-flow-embolism#7, cm-flow-embolism#9, pm-to-the-root#10.
- Depends on: access-closure-radial, access-closure-femoral-manual, found-handover-contract.
- Files (8): src/simulation/session/ward.ts, src/simulation/session/ward.test.ts, src/simulation/access/closure.ts, src/simulation/session/caseSession.ts, src/ui/access/panels/RecoveryPanel.tsx, src/ui/access/panels/TablePanel.tsx, src/simulation/session/scenarios/ward.ts, src/simulation/session/scenarios/ward.launch.ts.
- Acceptance: A radial schedule without 15-minute site checks while the band is on is wrong; the Oxford schedule is correct. In 'ward-forearm-haematoma' the haematoma is found at the first site check after onset and is larger when checks are skipped. 'ward-chest-pain-post-pci' scores ECG first correct and nitrate first wrong; 'ward-stroke-late' scores aspirin before imaging wrong. Plus 4 more in the JSON.

#### diag-route-wire-led-radial

**From sheath to root: wire-led advance, wet connection, exchange wire and the radial loop algorithm.** L, P1, wave 28. Lab: cathlab.

- Learner: Starts at the sheath, leads with the J wire, connects wet, and works through a radial loop with imaging, wire choice and balloon-assisted tracking.
- Built: Scenarios can start at the sheath. The catheter follows a leading J wire that stays out of the ventricle, is aspirated and connected wet, and the radial loop and resistance algorithm are hand actions.
- Requests: pm-to-the-root#3, pm-to-the-root#4, pm-engaging#9.
- Depends on: diag-rod-physics, diag-scenario-registry, diag-tip-context, found-lab-controls-registry, realism-baseline.
- Files (11): src/ui/physics/physicsDevices.ts, src/physics/lumen.ts, src/physics/catheterShapes.ts, src/simulation/access/route.ts, src/ui/sim/FluoroView.tsx, src/ui/lab/controls/tabs/RouteTab.tsx, src/ui/lab/TableView.tsx, src/ui/sim/modules/route.ts, and 3 more.
- Acceptance: In 'radial-loop' a J wire pushed 60 mm stalls at the loop; a hydrophilic wire passes in at least 3 of 5 starts. Advancing the catheter 20 mm beyond the wire tip in the iliac segment raises wire-not-leading and the dissection accumulator; with the wire leading it stays zero. A straight wire through the valve gives lvContact and ectopic beats; withdrawal stops them. Plus 4 more in the JSON.

#### diag-acs-scenarios

**ACS scenarios: 12-lead prediction, STEMI mode, post-arrest triage, SCAD, culprit studies and MI classification.** L, P1, wave 28. Lab: cathlab.

- Learner: Predicts the culprit from a 12-lead (including right-sided and posterior leads), runs STEMI and post-arrest cases, and identifies the culprit among two lesions.
- Built: The clinical front end for ACS cases: a pre-brief 12-lead with territory and activation prediction, STEMI mode with a reperfusion clock and engagement-order scoring, post-arrest triage, a SCAD case, culprit studies with two candidate lesions and an old film, iatrogenic ST elevation and MI classification. The right-sided and posterior leads added here are also used by the PCI RV-infarct case.
- Requests: cp-acs-thrombus#0, pm-target#6, cp-complex-patients#4, cp-other-complex#1, pm-target#5, pm-interpreting#11, hb-background#4, cm-principles-closure#9.
- Depends on: diag-scenario-registry, diag-study-report, diag-lesion-morphologies, diag-tip-context, found-mentor-registries.
- Files (9): src/simulation/diagnosticScenarios/acs.ts, src/simulation/diagnosticScenarios/acs.launch.ts, src/simulation/ecg12.ts, src/simulation/ecg12.test.ts, src/ui/lab/EcgPrebrief.tsx, src/ui/mentor/PreBrief.tsx, src/ui/lab/StudyReport.tsx, src/state/useSeriesStore.ts, and 1 more.
- Acceptance: ecg12.test.ts: a proximal RCA occlusion gives ST elevation in II, III, aVF and V4R; a posterior scenario gives V1-V3 depression with V7-V9 elevation of at least 0.5 mm. In diag-stemi-inferior-rv a first selective RCA guide engagement before any left injection fails the engagement-order rule. The OHCA choice 'immediate angiography' for a stable patient without ST elevation is scored against the class III recommendation. Plus 3 more in the JSON.

#### proc-adhoc-gate

**Ad hoc or delayed PCI decision gate.** M, P1, wave 28. Lab: procedure.

- Learner: Decides ad hoc PCI against dose, contrast, consent, anatomy and centre capability, and defers when the manual says so.
- Built: At the end of the diagnostic stage the gate shows contrast, screening time and air kerma, consent wording, centre capabilities, any complication, time of day and an occasional STEMI call, reads the target and decision from the diagnostic study report, and scores the decision with the deferral reasons.
- Requests: pm-target#3.
- Depends on: proc-heparin-act-handover, diag-study-report.
- Files (7): src/simulation/session/adhoc.ts, src/simulation/session/adhoc.test.ts, src/ui/access/AdHocGate.tsx, src/ui/sections/ProcedureLab.tsx, src/state/useProcedureStore.ts, src/simulation/session/scenarios/adhoc.ts, src/simulation/session/scenarios/adhoc.launch.ts.
- Acceptance: 'adhoc-left-main-stable' scores proceed wrong and defer with 'anatomy' correct; 'adhoc-acs-ongoing' scores proceed correct. A consent limit of diagnostic only makes proceed wrong regardless of anatomy. browser: the gate shows contrast against the budget and the STEMI call interrupts in its scenario. Plus 2 more in the JSON.

#### pci-acs-thrombus

**ACS and thrombus: acute occlusion behaviour, aspiration thrombectomy, RV infarct, stent thrombosis, ACS wiring, multivessel STEMI.** L, P1, wave 29. Lab: angio-pci.

- Learner: Treats STEMI as an acute occlusion, performs aspiration thrombectomy, and manages RV infarction, stent thrombosis and a multivessel STEMI plan.
- Built: Makes the STEMI cases behave like acute occlusions and adds the nine-step aspiration thrombectomy, thrombus strategy choices, a proximal RCA STEMI with RV involvement and heart block, stent thrombosis with wire escalation, two ACS wiring cases, the multivessel STEMI plan and the opioid-antiplatelet interaction.
- Requests: cp-acs-thrombus#2, cp-acs-thrombus#3, cp-acs-thrombus#4, cp-acs-thrombus#5, cp-other-complex#3, pm-target#7, pm-target#10, pm-lab-drugs#12.
- Depends on: pci-wire-microcatheter, pci-flow-closure, pci-antithrombotic-orders, diag-acs-scenarios, found-patient-formulary, pci-lab-input.
- Files (8): src/simulation/pci/scenarios/packs/acs.ts, src/simulation/pci/scenarios/packs/acs.launch.ts, src/simulation/pci/thrombectomy.ts, src/simulation/pci/thrombectomy.test.ts, src/simulation/pci/actions/bailouts.ts, src/simulation/complications/thrombus.ts, src/ui/pci/consoles/ThrombectomyConsole.tsx, src/ui/pci/inputBindings/thrombectomy.ts.
- Acceptance: thrombectomy.test.ts: a 7 Fr catheter is refused in a 6 Fr guide; withdrawal without suction re-embolises (seeded); the full nine steps lower the thrombus grade. rca-stemi-rv: nitrate drops MAP > 15 mmHg; CHB resolves within 120 s of reperfusion. lad-stent-thrombosis: a workhorse fails to cross in all seeds; the hydrophilic then polymer escalation with microcatheter crosses. Plus 4 more in the JSON.

#### access-cx-bleeding-retroperitoneal

**Retroperitoneal bleed: recognition, general measures, reversal, transfusion and imaging route.** L, P1, wave 29. Lab: access.

- Learner: Recognises and manages a retroperitoneal bleed, including reversal, transfusion and the right imaging route.
- Built: When a retroperitoneal bleed presents, the learner starts general measures, chooses the diagnostic route for location and stability (bladder screen and contralateral angiography in the lab, CT only when stable), reverses anticoagulation after diagnosis and manages antiplatelet therapy.
- Requests: cm-access-complications#0, cm-patient-complications#6.
- Depends on: access-closure-femoral-manual, access-multi-site, found-patient-formulary.
- Files (10): src/simulation/access/bleeding.ts, src/simulation/access/bleeding.test.ts, src/simulation/access/closure.ts, src/simulation/access/route.ts, src/simulation/session/modules/bleeding.ts, src/ui/access/orders/Bleeding.tsx, src/ui/access/BleedingPanel.tsx, src/ui/access/AccessFluoroView.tsx, and 2 more.
- Acceptance: In 'rp-recovery-unstable' CT before control is wrong and back to the lab correct. Hb measured 10 min after onset is within 1 g/dL of baseline and lower at 60 min. Protamine 80 mg fast is refused or causes hypotension 5-10 min later; platelets in 'rp-ticagrelor' are scored as not expected to reverse; stopping DAPT outright is wrong; treating a bleeding point in 'rp-no-bleed-found' is wrong. Plus 3 more in the JSON.

#### proc-discharge-prescription

**Scored discharge antithrombotic prescription.** M, P1, wave 29. Lab: procedure.

- Learner: Writes the discharge antithrombotic plan with bleeding risk, durations and stop dates.
- Built: After a PCI case the learner classifies bleeding risk, chooses the P2Y12 inhibitor and DAPT duration, adds a PPI where needed, warns about ticagrelor breathlessness, writes stop dates, builds triple therapy for anticoagulated patients and advises on surgery timing.
- Requests: hb-after-the-procedure#2, pm-antithrombotics#5.
- Depends on: proc-preprocedure-orders, found-handover-contract.
- Files (7): src/simulation/session/discharge.ts, src/simulation/session/discharge.test.ts, src/simulation/session/modules/discharge.ts, src/ui/access/panels/DischargePanel.tsx, src/ui/sections/ProcedureLab.tsx, src/simulation/session/scenarios/discharge.ts, src/simulation/session/scenarios/discharge.launch.ts.
- Acceptance: Prasugrel in triple therapy is wrong; clopidogrel is correct. De-escalation within 30 days of ACS without bleeding is wrong; a plan without stop dates fails that item. 'dapt-hbr-two-minor' classified as not HBR is wrong. Plus 2 more in the JSON.

#### pci-perforation

**Perforation management: blocking balloon, universal sequence, covered stents, distal embolisation, delayed perforation.** L, P1, wave 30. Lab: angio-pci.

- Learner: Seals a perforation with a blocking balloon, runs the universal sequence, delivers a covered stent or coils, and catches a delayed distal perforation.
- Built: Turns the perforation bail-outs into real controls and devices, run against a pericardial patient clock, with a hand-over to the pericardiocentesis lab and the delayed distal perforation that presents in the finish phase.
- Requests: cm-perforation#0, cm-perforation#1, cm-perforation#2, cm-perforation#3, cm-perforation#4, cm-perforation#5, cm-perforation#11.
- Depends on: pci-cx-recognition, pci-wire-microcatheter, pci-device-catalogue, pci-indeflator, found-handover-contract, pci-lab-input, realism-baseline.
- Files (9): src/simulation/complications/perforation.ts, src/simulation/complications/complications.test.ts, src/simulation/pci/actions/bailouts.ts, src/ui/pci/consoles/PerforationConsole.tsx, src/ui/pci/inputBindings/perforation.ts, src/ui/pci/render/perforation.ts, src/simulation/pci/scenarios/packs/perforation.ts, src/simulation/pci/scenarios/packs/perforation.launch.ts, and 1 more.
- Acceptance: complications.test.ts: an Ellis III perforation with a 3.0 mm balloon occluding a 3.0 mm vessel gives pericardialMlS 0 while inflated; a 2.5 mm balloon in a 3.5 mm vessel does not seal. A 4.5 mm covered stent is refused in a 6 Fr guide; a 3.5 mm one is accepted and needs at least 15 atm to seal. A coil through a microcatheter in the distal branch stops the distal leak. Plus 6 more in the JSON.

#### pci-bifurcation-two-stent

**Two-stent bifurcation techniques: DK crush, culotte, T and TAP, reverse and mini-crush, V and SKS.** XL, P1, wave 30. Lab: angio-pci.

- Learner: Performs DK crush, culotte, T and TAP (and the P3 variants) with each step scored.
- Built: Technique state machines with scored steps on adjustable bifurcations, the 'balloon will not enter the side branch' event, bail-out TAP and planned T-stenting, and the P3 variants.
- Requests: cp-bifurcation-two-stent#0, cp-bifurcation-two-stent#1, cp-bifurcation-two-stent#2, cp-bifurcation-two-stent#3, cp-bifurcation-two-stent#4, cp-bifurcation-two-stent#5, cp-bifurcation-two-stent#6, cp-bifurcation-two-stent#7, cp-bifurcation-two-stent#9.
- Depends on: pci-bifurcation-provisional.
- Files (10): src/simulation/pci/technique/dkCrush.ts, src/simulation/pci/technique/culotte.ts, src/simulation/pci/technique/tStent.ts, src/simulation/pci/technique/crushVariants.ts, src/simulation/pci/technique/sks.ts, src/simulation/pci/technique/index.ts, src/simulation/pci/technique/twoStent.test.ts, src/simulation/pci/scenarios/packs/bifurcationTwoStent.ts, and 2 more.
- Acceptance: twoStent.test.ts: a scripted DK crush reaches step 17 with all steps valid; skipping POT before the first rewire marks step 7 invalid; a proximal-cell rewire in DK crush is flagged. Culotte with the first stent in the less angulated branch is flagged at step 1. The SB balloon-through-struts stall raises balloon-uncrossable and the bifurcation tips, not side-branch-compromise. Plus 3 more in the JSON.

#### pci-bench-balloon-physics

**Timed balloon preparation with the indeflator on the shared lesion-yield model.** L, P1, wave 30. Lab: pci-bench.

- Learner: Prepares calcium with timed inflations, cutting balloons and IVL and learns when a lesion is undilatable.
- Built: Replaces instant bench inflations with indeflator.ts and the lesion-yield model from pci-indeflator: waists yield over pressure and time, rupture follows the drawn burst pressure, fast inflation melon-seeds, cutting balloons have a rate and pressure rule, lithotripsy has an emitter field and pulse counter; adds very-high-pressure balloons, buddy wires and an uncrossable or undilatable mode. Raised to P1 because the P1 in-stent restenosis sequence depends on it.
- Requests: cp-calcium#4, cp-calcium#5, cp-uncrossable#3.
- Depends on: pci-bench-imaging-unify, pci-indeflator.
- Files (4): src/simulation/pciBench.ts, src/simulation/pciBench.test.ts, src/ui/bench/PrepPanel.tsx, src/content/lab/presets/pci-bench/balloon.launch.ts.
- Acceptance: On calcified-rca a 3.0 NC held at 22 atm for 30 s expands further than the same balloon inflated for 5 s. A cutting balloon from 0 to 12 atm in 3 s flags the rate rule; above 14 atm flags the ceiling. With seeded RNG a semi-compliant balloon 4 atm above RBP ruptures in most draws as balloon-rupture. Plus 3 more in the JSON.

#### pci-left-main

**Left main scenarios: distal, ostial and shaft, short LM, severe ostial disease, guide-induced LM dissection, plan-dependent set-up.** L, P1, wave 31. Lab: angio-pci.

- Learner: Treats distal, ostial and short left main disease with the right set-up, and manages guide-induced LM dissection.
- Built: Left main cases built on the bifurcation tools, with engagement damping and its traps, LM dissection with variants, set-up that must be chosen in the plan, and early noradrenaline for falling pressure.
- Requests: cp-left-main#0, cp-left-main#1, cp-left-main#2, cp-ostial#8, cm-principles-closure#6, pm-planning#6, pm-lab-drugs#7.
- Depends on: pci-bifurcation-provisional, pci-guide-engagement, pci-intravascular-imaging, pci-attending.
- Files (6): src/simulation/pci/scenarios/packs/leftMain.ts, src/simulation/pci/scenarios/packs/leftMain.launch.ts, src/simulation/pci/patientBridge.ts, src/simulation/complications/dissection.ts, src/simulation/pci/actions/guide.ts, src/simulation/pci/leftMain.test.ts.
- Acceptance: leftMain.test.ts: 7 Fr deep in lm-ostial-shaft damps; a side-hole guide shows a normal trace with reduced distal flow; lm-short deep guide makes LCx flow 0 with a normal aortic trace. Forceful balloon withdrawal with EBU depth > 3 mm can create an LM dissection (seeded) with variant fields. Without pads and a vasopressor in the plan, lm-distal-111 hypotension occurs at device delivery; with early noradrenaline MAP stays above 65. Plus 3 more in the JSON.

#### pci-cto-retrograde

**Retrograde CTO: collateral selection, septal and epicardial wiring, reverse CART, connection, externalisation, final donor injection, prior-CABG route.** L, P1, wave 31. Lab: angio-pci.

- Learner: Selects a collateral, wires it retrogradely, performs reverse CART, connects and externalises, and reads the final donor injection.
- Built: Uses collateral vessels as retrograde routes from a second working guide, through reverse CART with IVUS, connection and externalisation, end-of-case donor injection outcomes, the prior-CABG CTO with equipment-length constraints, and the epicardial and ipsilateral variants.
- Requests: cp-cto-retrograde#0, cp-cto-retrograde#1, cp-cto-retrograde#2, cp-cto-retrograde#3, cp-cto-retrograde#4, cp-cto-retrograde#5, cp-cto-retrograde#6, eq-sheaths-guides#5.
- Depends on: pci-cto-planning-antegrade, pci-two-rail-engine, diag-grafts-svg, realism-baseline.
- Files (10): src/simulation/pci/cto/retrograde.ts, src/simulation/pci/cto/retrograde.test.ts, src/simulation/pci/geometry.ts, src/simulation/pci/coronaryWire.ts, src/simulation/pci/actions/wire.ts, src/ui/pci/PciLiveMonitor.tsx, src/ui/pci/render/retrograde.ts, src/simulation/pci/scenarios/packs/ctoRetrograde.ts, and 2 more.
- Acceptance: retrograde.test.ts: a wire can be routed LAD to septal collateral to distal RCA; a tortuous channel stalls the microcatheter more often than a straight one. Snaring is refused before the microcatheter has crossed; externalisation with a 300 cm wire is refused when the route is longer. Final donor injection outcomes occur in the seeded proportions; the epicardial outcome raises perforation-collateral and pericardial-effusion. Plus 4 more in the JSON.

#### pci-shock-chain

**Cardiogenic shock case chained across the haemodynamics lab, the pump console and the PCI lab.** L, P1, wave 31. Lab: angio-pci + mcs + haemo.

- Learner: Manages one shock patient from right heart catheterisation through mechanical support to culprit-only PCI and the weaning decision.
- Built: One shared PatientEngine carried from right heart catheterisation through the support decision to culprit-only PCI with slow flow, then post-PCI numbers that decide weaning, right-sided support or escalation, plus a 'call the shock team or choose support' action inside the PCI lab.
- Requests: cp-complex-patients#0, cm-flow-embolism#3.
- Depends on: pci-patient-coupling, pci-acs-thrombus, haemo-study-session-and-tips, mcs-console-split-select-and-tips, found-handover-contract, proc-foundation-scenarios-ledger, pci-lab-input, realism-baseline.
- Files (10): src/simulation/session/caseSession.ts, src/ui/mcs/useCirculation.ts, src/simulation/haemoStudy.ts, src/simulation/iabp.ts, src/ui/pci/consoles/SupportDeviceConsole.tsx, src/ui/pci/inputBindings/supportDevice.ts, src/ui/pci/render/support.ts, src/simulation/pci/scenarios/packs/shock.ts, and 2 more.
- Acceptance: shock.test.ts: one engine instance flows haemo to MCS to PCI (same object, same clock); support raises MAP in the PCI lab; culprit reperfusion improves CPO. Non-culprit stenting or FFR in shock is recorded as a plan error. The IABP is visible in the PA view and augmentation appears on the arterial trace. Plus 5 more in the JSON.

#### pci-ostial

**Ostial scenarios: aorto-ostial RCA, branch ostial, guide-stent interaction, ostial calcium, flaring.** L, P1, wave 32. Lab: angio-pci.

- Learner: Treats aorto-ostial and branch ostial lesions, managing guide-stent interaction, damping and ostial calcium.
- Built: The aorto-ostial RCA case with damping and intermittent engagement, aorto-ostial stenting with the guide and stent moving as a unit, ostial calcium modification, the branch ostial diagonal or circumflex case, and the dual-balloon flaring catheter.
- Requests: cp-ostial#0, cp-ostial#1, cp-ostial#2, cp-ostial#4, cp-ostial#6, pm-engaging#12, eq-balloons-stents-cart#6.
- Depends on: pci-guide-engagement, pci-device-delivery, pci-intravascular-imaging, pci-calcium-uncrossable.
- Files (7): src/simulation/pci/scenarios/packs/ostial.ts, src/simulation/pci/scenarios/packs/ostial.launch.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/actions/guide.ts, src/simulation/pci/patientBridge.ts, src/simulation/complications/dissection.ts, src/simulation/pci/ostial.test.ts.
- Acceptance: ostial.test.ts: withdrawing the guide 3 mm with the stent free advances the stent about 3 mm; in unit mode it does not. An injection with a damped trace in rca-ostial raises the aortocoronary dissection hazard. In diag-ostial at 85 degrees a workhorse prolapses down the LAD in more than 50% of seeds; a dual-lumen microcatheter reduces it. Plus 3 more in the JSON.

#### diag-engagement-technique-set

**Engagement technique scenarios, catheter choice and the failure-to-engage ladder.** M, P1, wave 32. Lab: cathlab.

- Learner: Practises the femoral and radial engagement sets and the failure-to-engage ladder, with catheter choice compared with route and root.
- Built: Scored scenarios on the physics and anatomy: femoral LM over a looped J wire, the radial left set, the RCA set, the five-step failure ladder with a stop decision, and LM damping causes with the five-view set; pre-case catheter choice compared with route and root, and catheters that worked recorded.
- Requests: pm-engaging#5, pm-engaging#6, pm-engaging#7, pm-engaging#8, pm-to-the-root#7, pm-interpreting#3, cp-left-main#5, cp-ostial#7.
- Depends on: diag-rod-physics, diag-anatomy-variants, diag-scenario-registry, found-mentor-registries.
- Files (9): src/simulation/diagnosticScenarios/engagement.ts, src/simulation/diagnosticScenarios/engagement.launch.ts, src/data/catheters.ts, src/physics/catheterShapes.ts, src/physics/manoeuvres.ts, src/mentor/rules/diagEngagement.ts, src/ui/mentor/PreBrief.tsx, src/progress/logbook.ts, and 1 more.
- Acceptance: JL3.5 from the right radial engages the LM in at least 3 of 5 starts; a JL one size larger reaches the LCx ostium in the short-LM variant where the smaller enters the LAD. A JL tip parked 2-3 cm above the right-cusp floor folds into the left cusp when the looped J wire is withdrawn in at least 3 of 5 starts. Three catheter changes without a sinus injection triggers the new rule. Plus 3 more in the JSON.

#### diag-spasm-states

**Catheter-tip and focal coronary spasm, and live radial spasm.** L, P1, wave 32. Lab: cathlab.

- Learner: Distinguishes catheter-tip and focal spasm from fixed disease and manages radial spasm without avulsing the artery.
- Built: Catheter-tip spasm shows as a smooth ostial narrowing that resolves after withdrawal and nitrate; a focal spasm lesion resolves on repeat in the same projection (with a persistent variant); radial spasm is a live state that drags on the catheter, hurts, narrows on a side-arm puff, responds to the manual's measures and can cause avulsion if forced.
- Requests: pm-interpreting#8, pm-acquiring#1, cp-ostial#7, pm-engaging#3, cp-complex-patients#4.
- Depends on: diag-lab-drugs, diag-rod-physics, diag-lesion-morphologies, access-radial-sequence, realism-baseline.
- Files (12): src/simulation/patient/responses.ts, src/simulation/patient/engine.ts, src/render/xray/sceneBuilder.ts, src/render/xray/coronaryTree.ts, src/simulation/access/radialSpasm.ts, src/simulation/access/radialSpasm.test.ts, src/simulation/access/site.ts, src/physics/lumen.ts, and 4 more.
- Acceptance: With wallContact 0.6 on a small non-dominant RCA, engine spasm rises, tipState ventricularises then falls, and after withdrawal plus GTN 100 ug spasm halves within 120 s. radialSpasm.test.ts: spasm probability rises with sheath size and exchanges and falls with the cocktail; at spasm 0.8 hub axial force for a 10 mm withdrawal is at least twice baseline. A forceful pull at spasm 0.8 raises haematoma and records avulsion. Plus 4 more in the JSON.

#### diag-injection-run-quality

**Filling, streaming, catheter size and run mechanics.** L, P1, wave 33. Lab: cathlab.

- Learner: Learns how catheter size, side holes, injection force and flow change filling, and has every run judged for streaming, panning and QFR suitability.
- Built: Opacification depends on catheter lumen, side holes, injection force, coronary flow and timing. Each run is analysed for streaming, reflux, panning, breath-hold and QFR suitability, and the learner can declare a run non-diagnostic.
- Requests: pm-interpreting#3, pm-acquiring#4, pm-acquiring#5, hb-specific-conditions#8, pm-acquiring#2, cp-complex-patients#7, pm-physiology#11, cp-cto-strategy#8.
- Depends on: diag-tip-context, diag-pressure-transducer, diag-study-report, realism-baseline.
- Files (12): src/ui/sim/labSession.ts, src/simulation/injection.ts, src/ui/sim/FluoroView.tsx, src/render/xray/sceneBuilder.ts, src/render/xray/contrastTransport.ts, src/simulation/imaging/runQuality.ts, src/simulation/imaging/runQuality.test.ts, src/state/useSeriesStore.ts, and 4 more.
- Acceptance: runQuality.test.ts: a 3 mL push at 1 mL/s into a high-flow (flowScale 1.8) left system gives a higher streaming index and no reflux than an 8 mL firm push, and is tagged non-diagnostic. A run with table velocity above threshold during cine is tagged panned and fails the QFR check. With classifier vessel LAD in a short-LM case the filled set excludes LCx. Plus 4 more in the JSON.

#### diag-lv-aorta-task

**Left heart tasks: valve crossing, LVEDP, power injector, ventriculogram, aortogram and their complications.** XL, P1, wave 33. Lab: cathlab.

- Learner: Crosses the valve, reads LVEDP, sets the power injector, films and grades the ventriculogram or aortogram, and handles ectopy, entrapment and staining.
- Built: The pigtail as a task workflow: cross the valve (difficult-valve and severe-AS variants), read LVEDP, set the power injector, film and read the ventriculogram or aortogram, record a pullback, and handle ectopy, entrapment, catheter-induced regurgitation, staining with later tamponade and pulmonary oedema.
- Requests: hb-cardiac-catheterisation#0, hb-cardiac-catheterisation#1, hb-cardiac-catheterisation#2, hb-cardiac-catheterisation#4, hb-cardiac-catheterisation#11, hb-specific-conditions#3, hb-background#1, cm-perforation#10, cp-complex-patients#7.
- Depends on: diag-lv-aorta-render, diag-rod-physics, diag-pressure-transducer, diag-study-report, found-mentor-registries, found-lab-controls-registry.
- Files (13): src/simulation/powerInjector.ts, src/simulation/powerInjector.test.ts, src/physics/lumen.ts, src/physics/engine.ts, src/simulation/circulation.ts, src/simulation/patient/engine.ts, src/state/useSimulatorStore.ts, src/ui/sim/modules/leftHeart.ts, and 5 more.
- Acceptance: A pigtail over a J wire crosses a normal valve in at least 3 of 5 starts within 20 s; with the difficult-valve opening it does not and a straight wire does. powerInjector.test.ts: arming without the air check is refused; 30 mL at 10 mL/s with a 0.5 s rise matches volume and peak rate. power-inject with LVEDP 36 is stopped. Plus 4 more in the JSON.

#### access-cx-endovascular-control

**Endovascular control from the opposite groin, and limb ischaemia by cause.** L, P1, wave 33. Lab: access.

- Learner: Controls an iliofemoral bleed from the other groin and treats a cold leg by its cause.
- Built: Crossing over the aortic bifurcation from the other groin, seeing extravasation or dissection on access fluoroscopy, tamponading with a low-pressure balloon, choosing the device that fits vessel and segment, and treating a cold leg by cause.
- Requests: cm-access-complications#1, cm-access-complications#4.
- Depends on: access-cx-bleeding-retroperitoneal, access-multi-site.
- Files (9): src/simulation/access/endovascular.ts, src/simulation/access/endovascular.test.ts, src/simulation/access/route.ts, src/simulation/procedure.ts, src/simulation/session/modules/endovascular.ts, src/ui/access/AccessFluoroView.tsx, src/ui/access/EndovascularPanel.tsx, src/simulation/session/scenarios/endovascular.ts, and 1 more.
- Acceptance: Deploying any device before balloon occlusion is wrong. Coils in 'bleed-external-iliac' fail and a covered stent succeeds; a stent across the bifurcation in 'bleed-cfa' records profunda loss; coiling 'bleed-iea-branch' without a retrograde check is wrong. 'livedo-not-ali' scores emergency angiography wrong. Plus 3 more in the JSON.

#### diag-rhythm-haemodynamic-events

**Arrhythmias, vasovagal reactions and hypotension causes from the engine.** L, P1, wave 34. Lab: cathlab.

- Learner: Meets VF, VT, AF, heart block and vagal reactions caused by what was actually done, with cardioversion and pacing orders.
- Built: Removes the legacy 'conus injection always causes VF' path so the engine's hazard model produces VF from conus, damped and obstructive injections and contrast hold-up, and adds VT, AF, SVT, injection bradycardia, heart block, vasovagal reactions and their mimics, with cardioversion and pacing orders.
- Requests: cp-complex-patients#2, pm-lab-drugs#8, cm-patient-complications#1, cp-left-main#5, pm-engaging#7.
- Depends on: diag-lab-drugs, diag-pressure-transducer, proc-hypotension-pressors, found-lab-controls-registry.
- Files (11): src/state/useSimulatorStore.ts, src/ui/sim/labSession.ts, src/simulation/patient/engine.ts, src/simulation/patient/rhythm.ts, src/simulation/patient/responses.ts, src/simulation/access/site.ts, src/ui/lab/controls/tabs/RhythmTab.tsx, src/mentor/rules/diagRhythm.ts, and 3 more.
- Acceptance: 100 seeded conus injections produce VF in some but not all; 100 selective free-trace injections produce none. An injection with the ostium obstructed and contrast present after 4 s raises contrast-hold-up and a higher VF probability. Amiodarone ordered with chart long QT is stopped with a reason. Plus 3 more in the JSON.

#### diag-grafts-arterial

**Arch, subclavian and internal mammary grafts.** L, P1, wave 34. Lab: cathlab.

- Learner: Engages the LIMA and RIMA through the arch and subclavian, manages a subclavian stenosis and avoids an ostial dissection.
- Built: Subclavian, vertebral and carotid branches, in situ LIMA and RIMA, an optional subclavian stenosis, mammary catheters, wire steering in the subclavian, a cuff for non-selective injection, and LIMA ostial dissection from a forceful injection.
- Requests: cp-prior-cabg#2, cp-prior-cabg#7, pm-acquiring#9.
- Depends on: diag-grafts-svg, diag-catheter-kink, realism-baseline.
- Files (9): src/physics/lumen.ts, src/physics/catheterShapes.ts, src/data/catheters.ts, src/render/xray/coronaryGrowth.ts, src/render/xray/thorax.ts, src/render/xray/contrastTransport.ts, src/physics/arch.test.ts, src/simulation/diagnosticScenarios/arterialGrafts.ts, and 1 more.
- Acceptance: From the femoral route an IM catheter over a J wire reaches the left subclavian beyond the vertebral origin in at least 2 of 5 starts; anticlockwise withdrawal engages the LIMA. In the stenosis variant subclavian tip pressure is lower than aortic by more than the chart's gradient. A forceful LIMA injection with low coaxiality leaves a persistent ostial stain on the next run. Plus 4 more in the JSON.

#### access-cx-forearm

**Forearm haematoma grading and management, and compartment syndrome escalation.** M, P1, wave 34. Lab: access.

- Learner: Grades and manages a forearm haematoma and escalates at once for compartment syndrome.
- Built: Forearm haematoma by grade with circumference measurements; the learner repositions or adds a band, applies ice, elevates, uses a timed arm cuff with finger saturation, controls pain and pressure, stops infusions and reverses heparin, and calls the surgeons at once for compartment signs.
- Requests: cm-access-complications#5, pm-engaging#4.
- Depends on: access-closure-radial, proc-recovery-ward.
- Files (7): src/simulation/access/forearm.ts, src/simulation/access/forearm.test.ts, src/simulation/access/closure.ts, src/simulation/session/modules/forearm.ts, src/ui/access/panels/RecoveryPanel.tsx, src/simulation/session/scenarios/forearm.ts, src/simulation/session/scenarios/forearm.launch.ts.
- Acceptance: Grades from 4 cm, 9 cm and below-elbow volumes are I, II and III. In 'forearm-compartment' compression after the signs is wrong and the surgical call correct. Cuff, ice and band repositioning in 'forearm-grade-3' stop growth within the scripted time. Plus 2 more in the JSON.

#### diag-iatrogenic-complications

**Manifold air, coronary air embolism, diagnostic-catheter dissection and embolic stroke.** M, P1, wave 35. Lab: cathlab.

- Learner: Checks the manifold for air and manages air embolism, ostial dissection and embolic stroke caused at the diagnostic stage.
- Built: A table set-up step where the manifold may hold a bubble or a loose connection, with coronary air embolism on the first injection if missed; ostial dissection from injecting through an abnormal trace, with the manual's choices including hand-over to the PCI lab; and embolic stroke from flushing a plugged catheter.
- Requests: pm-to-the-root#0, cm-flow-embolism#6, cm-principles-closure#4, cm-principles-closure#9, pm-engaging#1, pm-to-the-root#8.
- Depends on: diag-pressure-transducer, diag-tip-context, diag-scenario-registry, found-handover-contract, realism-baseline.
- Files (10): src/ui/lab/TableView.tsx, src/ui/sim/modules/iatrogenic.ts, src/state/useSimulatorStore.ts, src/render/xray/sceneBuilder.ts, src/render/xray/contrastTransport.ts, src/simulation/complications/dissection.ts, src/simulation/complications/airEmbolism.ts, src/ui/sim/iatrogenic.test.ts, and 2 more.
- Acceptance: An unflushed scenario bubble gives airEmbolisms 1 on the first selective injection in a stand-alone case; flushing first gives 0. An injection with tipState damped sets an ostial dissection in some seeds and never with a free trace; the next run has a persistent stain. browser: diag-manifold-air shows the bubble on the table; missing it shows the air lucency on cine and the air tips. Plus 3 more in the JSON.

#### pci-bench-isr-and-atherectomy

**In-stent restenosis bench, the in-stent undilatable sequence, and atherectomy planning.** L, P1, wave 35. Lab: pci-bench.

- Learner: Identifies the mechanism of in-stent restenosis before treating it and plans atherectomy with compatible equipment.
- Built: ISR lesions with selectable mechanisms (neointima, underexpansion with calcium behind the struts, fracture or gap, malapposition, second layer), mechanism naming before treatment, the in-stent undilatable order, and rotational and orbital atherectomy as planning exercises with burr, guide and extension compatibility from the catalogue.
- Requests: cp-other-complex#4, cp-calcium#6, cp-calcium#8, cp-left-main#8.
- Depends on: pci-bench-imaging-unify, pci-bench-balloon-physics.
- Files (8): src/simulation/pciBench.ts, src/simulation/bench/isr.ts, src/simulation/bench/isr.test.ts, src/simulation/pci/ivus.ts, src/ui/bench/PrepPanel.tsx, src/ui/bench/IsrPanel.tsx, src/ui/bench/AtherectomyPlanner.tsx, src/content/lab/presets/pci-bench/isr.launch.ts.
- Acceptance: isr.test.ts: a new stent into an unexpanded stent is a critical error; orbital atherectomy in a stent under 30 days old is blocked. The sequence check passes only in the module's order; a drug-coated balloon for a first neointimal episode is acceptable. Compatibility rejects a 1.5 mm burr through a 6 Fr extension; fracture frames show a strut gap and two-layer frames two rings. Plus 2 more in the JSON.

#### physiology-post-pci-handover

**Post-PCI physiology hand-over.** S, P1, wave 35. Lab: physiology.

- Learner: Measures physiology after stenting and decides what to do with the result.
- Built: A post-stent study in three variants (in-stent step from underexpansion, a focal edge step, diffuse loss) plus a final value above 0.91, opened from the bench, from the PCI lab after stenting and from lessons.
- Requests: pm-physiology#8.
- Depends on: physiology-engine-unify-and-setup, pci-bench-imaging-unify, found-handover-contract.
- Files (5): src/simulation/physiology.ts, src/simulation/physiology/postPci.test.ts, src/ui/physiology/DecisionPanel.tsx, src/ui/bench/AssessPanel.tsx, src/content/lab/presets/physiology/postPci.launch.ts.
- Acceptance: The in-stent variant's largest gradient lies inside the stented segment; the good variant's final FFR exceeds 0.91. A bench result with 70% expansion produces an in-stent step case when handed over. practiceIndex lists every scenario in src/content/lab/presets/physiology/postPci.launch.ts under lessons pm-physiology-after-pci (from src/content/lab/presets/physiology/postPci.launch.ts). Plus 1 more in the JSON.

#### pci-adhoc-handover

**Ad hoc PCI that treats the diagnosed lesion.** L, P1, wave 36. Lab: angio-pci.

- Learner: Treats in the PCI lab the very lesion diagnosed in the full case, with the guide exchange, heparin top-up and ACT check that entails.
- Built: After the diagnostic study and the scored ad hoc gate, the PCI lab opens on the same patient, anatomy and lesions, with the diagnostic catheter still in the aorta, a guide exchange to do, heparin to top up and an ACT to check. The outcome returns to the case. The target is chosen in the diagnostic study report (diag-study-report), not in a separate PCI screen.
- Requests: hb-after-the-procedure#5.
- Depends on: pci-scenario-registry, pci-lab-shell-session, pci-guide-engagement, diag-study-report, found-handover-contract, proc-heparin-act-handover, proc-adhoc-gate.
- Files (4): src/simulation/pci/scenarios/fromCase.ts, src/simulation/pci/scenarios/fromCase.test.ts, src/ui/pci/PciLab.tsx, src/simulation/session/caseSession.ts.
- Acceptance: fromCase.test.ts: a case with a 90% mid-RCA and a 50% LAD lesion, target RCA, gives a definition whose target is the RCA lesion with the same position and severity and whose tree matches the diagnostic tree. After hand-over the PCI session uses the same PatientEngine and the contrast total continues; a device cannot leave the guide in supervised mode before the ACT target. The outcome object is present in caseSession after returnFromLab and the recovery step sees the complication flags. Plus 2 more in the JSON.

#### pci-team-orders

**Team orders reach the devices, with closed-loop communication scored.** M, P1, wave 36. Lab: angio-pci.

- Learner: Gives spoken or typed orders to the team that actually reach the devices and drugs, with closed-loop communication scored.
- Built: Connects the team engine's equipment, label-check, hold-wire, drug and protocol intents to the PCI tray and engine, with read-back, delays or drops for unaddressed orders, a scribe role and scoring in complication scenarios. The diagnostic lab can use the same connection for catheter orders later. P1 because it alone carries the P1 request pm-monitoring#6.
- Requests: pm-monitoring#5, pm-monitoring#6, hb-safe-practice#2.
- Depends on: pci-equipment-tray, pci-lab-shell-session, found-patient-formulary, found-launch-links.
- Files (7): src/ui/lab/labTeam.ts, src/simulation/team/intents.ts, src/simulation/team/team.ts, src/simulation/team/team.test.ts, src/ui/pci/PciLabSession.ts, src/ui/pci/consoles/EquipmentTray.tsx, src/content/practice/pci-team-orders.launch.ts.
- Acceptance: team.test.ts: '3.0 by 15 NC balloon' to the scrub opens that device in the tray with read-back; 'can someone give atropine' without a name is delayed or dropped more often than a named order (seeded). 'I have the wire' pins the wire. The TeamReport after the VF scenario lists closed-loop counts. Plus 2 more in the JSON.

#### structural-laao-device-mechanics

**LAAO device-specific deployment, PASS with numbers, filling and modality effects on sizing, CT puncture planning, and follow-up.** L, P1, wave 36. Lab: laao.

- Learner: Deploys the two LAAO device families to their release criteria after proper filling and sizing.
- Built: Plug occluder (marker pigtail into the deepest lobe, distal marker off the wall, unsheathing with ventilation held, PASS with numbers and a tug) and lobe-and-disc device (push to form the ball, disc criteria, anchors-in-sheath hazard); LA pressure and a fluid challenge before sizing; CT, TOE and fluoroscopy measurement offsets; puncture site from CT morphology; follow-up with device-related thrombus.
- Requests: hb-mitral-tricuspid-laa#4, hb-mitral-tricuspid-laa#5.
- Depends on: structural-transseptal-hands-on.
- Files (5): src/simulation/laao.ts, src/simulation/laao.test.ts, src/ui/structural/LaaoLab.tsx, src/ui/structural/LaaoViews.tsx, src/content/lab/presets/structural/laao.launch.ts.
- Acceptance: Release before PASS criteria is wrong for each device; a push movement on the plug device is flagged. Sizing from an underfilled TOE measurement selects a smaller device than after the fluid challenge. An inferior-posterior puncture in 'laao-reverse-chicken-wing' gives coaxial false; DRT without anticoagulation is wrong. Plus 2 more in the JSON.

#### diag-pressure-recognition-drill

**Timed pressure-trace recognition drill.** M, P1, wave 37. Lab: diagnostic.

- Learner: Names engine-generated pressure traces against the clock and picks the first action.
- Built: Replaces the static Pressure safety gallery with a timed drill of engine-generated traces at real speed; the learner names each and chooses the first action, scored with agreement and confidence.
- Requests: pm-engaging#0.
- Depends on: diag-pressure-transducer, diag-scenario-registry, found-launch-links.
- Files (6): src/simulation/pressureDrill.ts, src/simulation/pressureDrill.test.ts, src/ui/sections/PressureTrainer.tsx, src/content/schema.ts, src/state/useUiStore.ts, src/content/practice/diag-pressure-recognition-drill.launch.ts.
- Acceptance: pressureDrill.test.ts: every item type produces a trace whose classifyTip matches its label (side-hole item 'aortic' with gap 0); the AS item is not damped; the same seed gives the same order. browser: openSim('pressure',{set:'damping'}); answering 'inject' to a damped item scores wrong and shows the damping tip. practiceIndex lists every scenario in src/content/practice/diag-pressure-recognition-drill.launch.ts under lessons pm-engaging-trace, pm-engaging-damping (from src/content/practice/diag-pressure-recognition-drill.launch.ts). Plus 1 more in the JSON.

#### diag-qca-measurement

**QCA in the diagnostic lab: references, foreshortening and comparison with the model.** M, P1, wave 37. Lab: cathlab.

- Learner: Measures with both references, sees the effect of foreshortening and compares the reported value with the model only in the debrief.
- Built: Builds on the existing diagnostic QCA tool (the request saying QCA is PCI-only is out of date): both references and their average, derived area stenosis, foreshortened-frame warning, the reported view, and comparison with the model's projected value in the debrief only.
- Requests: pm-interpreting#0.
- Depends on: diag-lesion-morphologies, diag-study-report, found-mentor-registries, found-launch-links.
- Files (6): src/ui/lab/QcaTool.tsx, src/simulation/imaging/qca.ts, src/simulation/imaging/qca.test.ts, src/ui/lab/ReferenceMonitor.tsx, src/mentor/debriefChecks/qca.ts, src/content/practice/diag-qca-measurement.launch.ts.
- Acceptance: qca.test.ts: on a synthetic tapering vessel the averaged reference gives %DS within 5 points of truth while the proximal-only reference overestimates by more than 5. A reported measurement from a frame with foreshortening 0.6 is flagged; one from the orthogonal 0.95 view within 5 points passes. browser: diag-eccentric-orthogonal, measure in two views; the debrief names the worse view. Plus 2 more in the JSON.

#### physiology-anoca-cft

**Coronary function test in ANOCA with acetylcholine provocation.** L, P1, wave 37. Lab: physiology.

- Learner: Runs a coronary function test in ANOCA, including acetylcholine provocation, and classifies the endotype.
- Built: The ANOCA study in the UK consensus order: low-dose GTN first, resting thermodilution with scatter from inconsistent injections, IV adenosine giving hyperaemic Tmn, CFR, IMR and FFR together, a drift check, then incremental acetylcholine with monitoring and endotype classification.
- Requests: pm-physiology#10, pm-physiology#12.
- Depends on: physiology-hyperaemia-and-adenosine.
- Files (7): src/simulation/physiology.ts, src/simulation/physiology.test.ts, src/simulation/physiology/ach.ts, src/simulation/physiology/ach.test.ts, src/ui/physiology/CftPanel.tsx, src/ui/lab/physiologyTips.ts, src/content/lab/presets/physiology/anoca.launch.ts.
- Acceptance: In 'anoca-cmd' CFR and IMR are on the abnormal side with FFR > 0.80; three inconsistent injections scatter more than consistent ones. ach-provocation is present only while an ACh dose is active; no pci-phys-ach-* tip appears in any adenosine-only preset. ACh before resting thermodilution is an order error; each preset's endotype answer is scored. Plus 2 more in the JSON.

#### tip-retarget-catchup

**Apply the deferred tip retargets once the labs raise their events.** M, P1, wave 38. Lab: shared (lesson content).

- Learner: Sees the perforation, bifurcation-step, calcium, wire, retrograde, acetylcholine and pacing tips only at the moment each lab can now detect, without losing a bail-out tip along the way.
- Built: Applies the trigger edits that found-tip-retarget recorded in waiting.ts because they depend on events, techniques and phases first raised in phases 2 and 3: perforation subtypes, flow and spasm, calcium devices, bifurcation technique and step, wire and microcatheter events, retrograde work, acetylcholine testing and the pacing stage phases. Runs alone after the last P1 package that raises them, because it edits the module files.
- Requests: cm-flow-embolism#1, cm-flow-embolism#10, cm-patient-complications#8, cm-perforation#11, cp-bifurcation-two-stent#9, cp-calcium#0, cp-cto-retrograde#6, pm-lab-drugs#13, pm-wiring#10, pm-wiring#11, pm-physiology#12, pm-interpreting#10, eq-sheaths-guides#7, hb-additional-procedures#8.
- Depends on: found-tip-retarget, pci-perforation, pci-bifurcation-provisional, pci-bifurcation-two-stent, pci-calcium-uncrossable, pci-device-delivery, pci-flow-closure, pci-cto-retrograde, pci-wire-microcatheter, pci-two-rail-engine, pci-patient-coupling, physiology-anoca-cft, pacing-in-lab-scenarios-and-tips.
- Files (51): src/content/lab/tips.ts, src/content/validate.ts, src/content/manual.test.ts, src/content/lab/raisable/waiting.ts, src/content/lab/retargetCatchup.test.ts, src/content/manual/cath-handbook/01-lab-and-radiation.ts, src/content/manual/cath-handbook/02-the-operator.ts, src/content/manual/cath-handbook/03-safe-practice.ts, and 43 more.
- Acceptance: retargetCatchup.test.ts: tipsFor with events ['perforation','perforation-distal'] returns no pci-perf-covered-* tip and with 'perforation-large-vessel' returns pci-perf-covered-one-guide; tipsFor({lab:'pci',phase:'stent',technique:'dk-crush',step:3,events:['bifurcation']}) returns pci-dkcrush-sb-deploy-pressure and with technique 'culotte' it does not. pci-phys-ach-* is absent without ach-provocation; pci-interp-pseudolesion is absent at phase 'wire' without new-narrowing; tipsFor({lab:'bedside',phase:'test',procedures:['pacing']}) contains bed-pace-threshold-margin and no bed-peri-* tip. Superset: for lad-focal and rca-calcified contexts at phase 'complication' with perforation (and its subtype), dissection, no-reflow, thrombus or air, the caution and bailout tips returned by tipsFor(ctx, 100) are a superset of the set before this package. Plus 2 more in the JSON.

#### content-links-backfill

**Point the existing lesson and case blocks at their P1 scenarios.** L, P1, wave 39. Lab: all labs (lesson content).

- Learner: Opens the right scenario from the inline blocks of every lesson and case, not only from the practice list beneath it.
- Built: Converts the existing sim and drill blocks (84 angio-pci drill blocks, 108 cathlab and 94 procedure sim blocks, and the dev-lab sim blocks) whose scenarios come from P1 packages to explicit launch params, and adds CaseStudy.practice links, following each lab request's lessonIds, so the inline blocks open the right scenario as well as the practice index. Merges pci-lesson-deeplink-backfill and proc-content-deeplinks and adds the cathlab and dev-lab links the other plans left implicit.
- Requests: none (enabling package).
- Depends on: found-tip-retarget, pci-scenario-registry, pci-device-delivery, pci-wire-microcatheter, pci-budgets-stop-rules, pci-antithrombotic-orders, pci-perforation, pci-flow-closure, pci-bifurcation-provisional, pci-bifurcation-two-stent, pci-left-main, pci-ostial, pci-calcium-uncrossable, pci-acs-thrombus, pci-cto-planning-antegrade, pci-cto-retrograde, pci-shock-chain, diag-scenario-registry, diag-pressure-transducer, diag-anatomy-variants, diag-lesion-morphologies, diag-catheter-kink, diag-route-wire-led-radial, diag-engagement-technique-set, diag-injection-run-quality, diag-lab-drugs, diag-spasm-states, diag-rhythm-haemodynamic-events, diag-lv-aorta-task, diag-grafts-svg, diag-grafts-arterial, diag-acs-scenarios, diag-iatrogenic-complications, proc-foundation-scenarios-ledger, access-multi-site, proc-chart-planted-problems, proc-preprocedure-orders, access-route-decision, access-femoral-puncture, access-femoral-upsizing-angiogram, access-radial-sequence, proc-heparin-act-handover, proc-adhoc-gate, access-closure-femoral-manual, access-closure-radial, proc-recovery-ward, access-cx-bleeding-retroperitoneal, access-cx-endovascular-control, access-cx-forearm, proc-anaphylaxis-vagal, proc-hypotension-pressors, proc-discharge-prescription, pci-bench-imaging-unify, pci-bench-measure-and-plan, pci-bench-balloon-physics, pci-bench-isr-and-atherectomy, pci-bench-stent-platforms-sizing, pci-bench-bifurcation, physiology-engine-unify-and-setup, physiology-hyperaemia-and-adenosine, physiology-left-main-and-ostial, physiology-post-pci-handover, physiology-anoca-cft, haemo-study-session-and-tips, haemo-transducer-and-setup, haemo-rhc-manoeuvre, haemo-aortic-stenosis-studies, mcs-console-split-select-and-tips, structural-tips-and-tavi-course, structural-transseptal-hands-on, structural-laao-device-mechanics, pericardiocentesis-tips-and-pci-handover, pacing-in-lab-scenarios-and-tips, tip-retarget-catchup.
- Files (50): src/content/manual/pci-manual/01-planning.ts, src/content/manual/pci-manual/02-monitoring.ts, src/content/manual/pci-manual/03-antithrombotics.ts, src/content/manual/pci-manual/04-lab-drugs.ts, src/content/manual/pci-manual/05-access.ts, src/content/manual/pci-manual/06-to-the-root.ts, src/content/manual/pci-manual/07-engaging.ts, src/content/manual/pci-manual/08-acquiring.ts, and 42 more.
- Acceptance: content.test.ts: every angio-pci drill block and every cathlab and procedure sim block whose scenario comes from a P1 package has a scenario param that validateLaunchLinks accepts. Every lessonId named by a P1 lab request in docs/curriculum/lab-requests/*.json appears in practiceIndex or has a block whose scenario lists that lesson. The link-to-tips warning count is reported and recorded in the package notes. Plus 1 more in the JSON.

### Phase 4: extensions (P2)

P2 work: further anatomy and route variants, closure devices, venous access, the large-bore and mechanical support programme, structural planning and devices, more haemodynamic studies, progression above level II, and reflection.

#### diag-tavi-frame-engagement

**Coronary engagement through a transcatheter valve frame.** L, P2, wave 40. Lab: cathlab.

- Learner: Engages coronaries through a transcatheter valve frame and frees a trapped guide.
- Built: A self-expanding supra-annular or balloon-expandable frame in the root with implant depth, commissural orientation, sinus width and ostial height; catheters pass through cells, and an acute-angle crossing can trap a guide. The frame is shared hardware used by the PCI TAVI case.
- Requests: cp-complex-patients#5.
- Depends on: diag-rod-physics, diag-scenario-registry, diag-catheter-kink, realism-baseline.
- Files (7): src/physics/lumen.ts, src/physics/contact.ts, src/physics/engine.ts, src/render/xray/hardware.ts, src/physics/taviFrame.test.ts, src/simulation/diagnosticScenarios/tavi.ts, src/simulation/diagnosticScenarios/tavi.launch.ts.
- Acceptance: With a high implant a JL4 does not reach the LM in 5 starts while a short-tipped JR4 through a cell above the ostium does in at least 2. An EBU pushed through a cell at an acute angle becomes entrapped; withdrawal over a wire frees it. browser: diag-tavi-self-expanding-high shows the frame and TAVI tips only in this case. Plus 3 more in the JSON.

#### access-closure-femoral-devices

**Stepwise collagen-plug and suture-mediated closure.** L, P2, wave 40. Lab: access.

- Learner: Deploys a collagen plug and a suture-mediated device step by step and recognises their failures.
- Built: Replaces the one-click closure device with stepwise collagen-plug and suture-mediated sequences with their indicators, resistance cues and failure modes. The suture sequence is reused for large-bore pre-closure in the MCS lab.
- Requests: pm-closure#2, pm-closure#3.
- Depends on: access-closure-femoral-manual.
- Files (8): src/simulation/access/devices/plug.ts, src/simulation/access/devices/suture.ts, src/simulation/access/devices/devices.test.ts, src/simulation/session/caseSession.ts, src/ui/access/DevicePanel.tsx, src/ui/access/panels/ClosurePanel.tsx, src/simulation/session/scenarios/closureDevices.ts, src/simulation/session/scenarios/closureDevices.launch.ts.
- Acceptance: The plug drip indicator is on inside the lumen and off outside; tamping before resistance in 'plug-deep-sheath' deploys an intra-arterial plug and raises limb-ischaemia; a 6 Fr device in an 8 Fr sheath pulls through. Firing the suture at 30 degrees gives a loose suture more often than at 45 degrees; reinserting the wire then a second device achieves haemostasis; skipping track preparation makes the device stick. browser: the device panel's indicators change with depth. Plus 2 more in the JSON.

#### haemo-valve-and-myocardial-studies

**Mitral stenosis in AF, pulmonary and tricuspid valve disease, HOCM provocation, severe TR and PMC haemodynamics.** L, P2, wave 40. Lab: haemo.

- Learner: Assesses mitral, tricuspid and pulmonary valve disease and HOCM haemodynamics.
- Built: Irregular rhythm with a beat-varying mitral gradient, beat averaging and Gorlin; pulmonary stenosis pullback; severe TR; tricuspid stenosis visible only with two matched catheters; HOCM provocation with nitrate hypotension and its management; severe secondary TR with TAPSE/PASP coupling.
- Requests: hb-specific-conditions#2, hb-specific-conditions#4, hb-specific-conditions#6, hb-mitral-tricuspid-laa#6.
- Depends on: haemo-study-session-and-tips, haemo-aortic-stenosis-studies.
- Files (6): src/simulation/haemo.ts, src/simulation/haemo.test.ts, src/ui/haemo/ValvePanel.tsx, src/ui/haemo/TracePanel.tsx, src/ui/haemo/OrdersPanel.tsx, src/content/lab/presets/haemo/valves.launch.ts.
- Acceptance: In 'ms-af' single-beat mean gradients vary by more than 3 mmHg and the 10-beat average gives the model MVA within 0.1 cm2. In 'ts-with-ms' two-catheter RA-RV gradient is 5 +/- 1 mmHg and a single-catheter estimate below 2. HOCM GTN raises the gradient and lowers MAP; dobutamine raises the gradient further; phenylephrine raises MAP; TAPSE/PASP below 0.31 is classified poor. Plus 2 more in the JSON.

#### access-sheath-choice

**Sheath choice as a real decision.** M, P2, wave 41. Lab: access.

- Learner: Chooses sheath size, wall and length against the measured artery and the planned devices.
- Built: Sheath size 4-8 Fr, standard or thin-walled, length by route, sheathless options, occupied fraction against the scanned artery, and the femoral sheath tip at its true level on fluoroscopy.
- Requests: eq-sheaths-guides#3.
- Depends on: access-femoral-upsizing-angiogram, access-route-decision.
- Files (9): src/simulation/access/closure.ts, src/simulation/session/caseSession.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/AccessFluoroView.tsx, src/ui/access/panels/HandoverPanel.tsx, docs/realism/facts/C5.md, src/simulation/access/access.test.ts, src/simulation/session/scenarios/sheaths.ts, and 1 more.
- Acceptance: Occupied fraction for a 6 Fr standard sheath in a 2.4 mm radial equals (OD/2.4)^2. A 45 cm femoral tip lies above the aortic bifurcation; a 10 cm tip below the iliac bifurcation. 'sheath-small-radial' scores 7 Fr standard wrong and 5 or 6 Fr thin correct; a long radial sheath without a reason is wrong. Plus 2 more in the JSON.

#### haemo-shunt-studies

**ASD and VSD studies, and post-infarct VSR versus papillary rupture.** M, P2, wave 41. Lab: haemo.

- Learner: Runs an oximetry study for ASD and VSD and tells VSR from papillary rupture.
- Built: ASD pressures, crossing for an LA saturation, an SVC/IVC/PA/Ao run with streaming, an anomalous drainage clue, Flamm, Qp:Qs and PVR using Qp; VSD simultaneous LV and RV pressures and the LAO cranial view; post-infarct VSR versus papillary rupture with an IABP bridge decision.
- Requests: hb-cardiac-catheterisation#9, cp-acs-thrombus#6.
- Depends on: haemo-study-session-and-tips.
- Files (5): src/simulation/haemo.ts, src/simulation/haemo.test.ts, src/ui/haemo/OximetryPanel.tsx, src/ui/haemo/CalcPanel.tsx, src/content/lab/presets/haemo/shunts.launch.ts.
- Acceptance: Learner Qp:Qs within 0.2 of derive() is accepted for 'asd-secundum'; PA as mixed venous is flagged. 'asd-papvd' shows a step-up between high and low SVC. 'post-mi-papillary' shows large v waves without step-up; IABP with significant AR is wrong. Plus 2 more in the JSON.

#### mcs-largebore-access-and-removal

**Large-bore access, limb perfusion, single-access PCI through the pump sheath, and bleeding at removal.** L, P2, wave 41. Lab: mcs.

- Learner: Gains and closes large-bore access with pre-close sutures and limb checks, and runs PCI through the pump sheath.
- Built: A shared large-bore stage before the pump, ECMO or IABP: 5-6 Fr sheath and femoral angiogram with artery size, two pre-close sutures using the suture sequence from access-closure-femoral-devices, sequential dilatation, peel-away sheath, heparin to ACT above 250 s and a limb angiogram; timed limb checks; removal with a crossover balloon and failed closure; single-access PCI through the pump sheath.
- Requests: pm-access#9, cm-access-complications#3, cm-access-complications#7, eq-sheaths-guides#6.
- Depends on: mcs-console-split-select-and-tips, xray-device-fluoro-views, access-closure-femoral-devices.
- Files (9): src/simulation/mcs/largeBore.ts, src/simulation/mcs/largeBore.test.ts, src/simulation/circulation.ts, src/ui/mcs/LargeBoreStage.tsx, src/ui/mcs/ImpellaConsole.tsx, src/ui/mcs/EcmoConsole.tsx, src/ui/mcs/IabpConsole.tsx, src/ui/lab/mcsTips.ts, and 1 more.
- Acceptance: Dilating before sutures, opening the sheath below ACT 250 s or losing wire access is flagged. In 'largebore-limb-ischaemia' the first abnormal check raises limb-ischaemia; recognition after it loses the criterion. In 'largebore-failed-closure' a pre-placed crossover balloon inflated within 10 s limits blood loss below the no-balloon run. Plus 3 more in the JSON.

#### access-venous

**Ultrasound-guided venous access: femoral vein, internal jugular, subclavian.** L, P2, wave 42. Lab: access.

- Learner: Gains femoral, jugular and subclavian venous access under ultrasound.
- Built: Venous access for right heart, pacing and support cases: femoral vein with syringe suction, real-time ultrasound for the internal jugular with landmark approaches as fallback, landmark subclavian, transfixed-vein and no-return events, and artery and vein in one groin.
- Requests: pm-access#7.
- Depends on: access-multi-site, proc-tip-context.
- Files (8): src/simulation/access/site.ts, src/simulation/access/ultrasound.ts, src/simulation/session/caseSession.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/panels/ClosurePanel.tsx, src/simulation/access/venous.test.ts, src/simulation/session/scenarios/venous.ts, src/simulation/session/scenarios/venous.launch.ts.
- Acceptance: The IJV collapses at a lower probe pressure than the carotid; head-down tilt increases its radius. 'vein-transfixed' flashes only on withdrawal with suction; a subclavian pass beyond the pleura raises pneumothorax. Removing a venous sheath before the arterial one in the same groin is wrong; 'vein-ivc-filter' scores femoral vein wrong and jugular correct. Plus 2 more in the JSON.

#### mcs-impella-insertion-and-events

**Microaxial pump insertion under fluoroscopy, running-pump events, RV failure decision and protected left main PCI.** L, P2, wave 42. Lab: mcs.

- Learner: Inserts and positions a microaxial pump and manages its running problems and the right ventricle.
- Built: Insertion (crossing catheter, 0.018 stiff wire, loading lumen, bleeding while the inlet is in the sheath, iliac resistance, depth and start check), running events (too deep, pulled back, stopped pump, forward movement, removal versus repositioning sheath, suction from tamponade, haemolysis), an RV support decision and a protected left main PCI with ischaemic steps.
- Requests: pm-support-devices#2, pm-support-devices#3, pm-support-choice#2, cp-left-main#6.
- Depends on: mcs-largebore-access-and-removal, xray-device-fluoro-views.
- Files (8): src/simulation/mcs/pumpInsertion.ts, src/simulation/mcs/pumpInsertion.test.ts, src/simulation/circulation.ts, src/simulation/circulation.test.ts, src/ui/mcs/ImpellaConsole.tsx, src/ui/mcs/PumpInsertionStage.tsx, src/ui/lab/mcsTips.ts, src/content/lab/presets/mcs/pump.launch.ts.
- Acceptance: Amplatz crossing gives a higher subpapillary probability than pigtail; a retained loading tube is critical. Raising pericardial pressure under the pump produces suction at P8; a stopped pump left across the valve raises LV end-diastolic volume. In 'protected-lm-chip' an unsupported inflation drops MAP below 65 and upfront support keeps it above; pump-migration is present after the pulled-back event. Plus 2 more in the JSON.

#### structural-tavi-planning

**TAVI planning by hand: annulus, coronary risk with leaflet length, re-access risk and valve-in-valve.** L, P2, wave 42. Lab: tavi.

- Learner: Measures the annulus and coronary risk by hand on CT and plans valve-in-valve.
- Built: Three hinge points define the double-oblique plane; the learner reads diameters, traces perimeter and area and enters the derived diameters before the chart appears, including eccentric and borderline cases; coronary risk with leaflet length and sinus width; re-access factors; valve-in-valve planning with VTC and ring fracture.
- Requests: hb-tavi#1, hb-tavi#2, cp-complex-patients#8, hb-tavi#6.
- Depends on: structural-tips-and-tavi-course.
- Files (6): src/simulation/tavi.ts, src/simulation/tavi.test.ts, src/ui/structural/TaviLab.tsx, src/ui/structural/TaviViews.tsx, src/ui/structural/TaviPlanTools.tsx, src/content/lab/presets/structural/taviPlanning.launch.ts.
- Acceptance: An ellipse from three hinge points reproduces the scenario min and max diameters within 0.5 mm; learner diameters within 0.3 mm accepted. The borderline preset flags re-measurement when area- and perimeter-derived sizes differ by a size. Routine protection in a low-risk root is wrong; standard ViV with VTC below 4 mm is wrong. Plus 2 more in the JSON.

#### pci-equipment-loss

**Equipment loss and entrapment: stent loss, snares, jailed-wire traction, wire fracture, balloon and microcatheter failures.** L, P2, wave 43. Lab: angio-pci.

- Learner: Retrieves a lost stent with snares, manages jailed-wire entrapment and wire fracture, and handles balloon and microcatheter failures.
- Built: Equipment complications and their retrieval tools as distinct events: stent stripping, snares and second access, traction-tracked jailed-wire entrapment with guide dive and fracture, balloon rupture and no-deflate, microcatheter over-rotation, and guide-extension bail-outs.
- Requests: cm-equipment-loss#0, cm-equipment-loss#1, cm-equipment-loss#2, cm-equipment-loss#3, cm-equipment-loss#4, cm-equipment-loss#6, eq-sheaths-guides#2, cp-bifurcation-provisional#3.
- Depends on: pci-device-delivery, pci-wire-microcatheter, pci-indeflator, pci-two-rail-engine, pci-cx-recognition, pci-lab-input, realism-baseline.
- Files (11): src/simulation/complications/equipment.ts, src/simulation/complications/types.ts, src/simulation/complications/engine.ts, src/simulation/pci/actions/devices.ts, src/simulation/pci/actions/bailouts.ts, src/ui/pci/consoles/RetrievalConsole.tsx, src/ui/pci/inputBindings/retrieval.ts, src/ui/pci/render/retrieval.ts, and 3 more.
- Acceptance: Pulling a stuck stent back through a guide with coaxial < 0.5 strips it (seeded) and raises stent-loss; withdrawing the wire out of the lost stent raises stent-loss-wire-out. Jailed-wire traction above the threshold increases guide depthMm and either releases or fractures the wire (seeded); a fracture raises wire-fracture. A snare is refused through a guide too small for its catheter. Plus 5 more in the JSON.

#### diag-route-arch-femoral-variants

**Subclavian, arch and femoral route variants with their remedies.** L, P2, wave 43. Lab: cathlab.

- Learner: Handles a tortuous subclavian, arteria lusoria, iliac disease and stents, an aneurysm and a very tall patient.
- Built: Tortuous subclavian with descending-aorta wire entry and the deep-breath correction, arteria lusoria with timed conversion in STEMI, iliac tortuosity, stenosis, old iliac stent, AAA, a very tall patient, long sheaths, a parallel 4 Fr stiff-wire sheath and catheter length.
- Requests: pm-to-the-root#5, pm-to-the-root#6, eq-sheaths-guides#4, pm-target#6.
- Depends on: diag-route-wire-led-radial, diag-catheter-kink.
- Files (7): src/physics/lumen.ts, src/simulation/access/route.ts, src/ui/physics/physicsDevices.ts, src/ui/lab/controls/tabs/RouteTab.tsx, src/simulation/diagnosticScenarios/arch.ts, src/simulation/diagnosticScenarios/arch.launch.ts, src/physics/routeVariants.test.ts.
- Acceptance: From the right radial in 'tortuous-subclavian' a wire at end-expiration enters the descending aorta in at least 2 of 5 starts; during a held inspiration it reaches the ascending aorta more often. In 'arteria-lusoria' the right radial route reaches the ascending aorta in 0 of 5 starts within 120 mm past the arch. With 'tall-patient' a 100 cm JL4 stops above the sinus and 125 cm reaches. Plus 3 more in the JSON.

#### pacing-overdrive-and-tcp

**Overdrive pacing of monomorphic VT and transcutaneous pacing.** M, P2, wave 43. Lab: pacing.

- Learner: Overdrive-paces VT and uses transcutaneous pacing correctly.
- Built: Overdrive pacing of a stable VT (unstable variant where cardioversion is right) with rate, multiplier, output, capture by QRS change, stopping after 5-10 s, acceleration or VF requiring a shock, and optional background pacing; transcutaneous pacing with pad positions, current to capture and pulse confirmation.
- Requests: hb-additional-procedures#1, cm-patient-complications#11, pm-lab-drugs#9.
- Depends on: pacing-in-lab-scenarios-and-tips, haemo-rhc-manoeuvre.
- Files (5): src/simulation/pacing.ts, src/simulation/pacing.test.ts, src/ui/bedside/PacingLab.tsx, src/ui/bedside/SweepMonitor.tsx, src/content/lab/presets/bedside/overdrive.launch.ts.
- Acceptance: Pacing below the VT rate never captures; 20/min above with output above threshold captures within the delay. Over seeded runs stopping after capture terminates VT in most runs and degenerates to VF in a minority; a shock restores rhythm. TCP confirmed only by ECG capture without a pulse check is incomplete. Plus 2 more in the JSON.

#### pci-graft

**Graft PCI: degenerated vein graft, embolic protection, intragraft vasodilators, LIMA-LAD with pseudolesions.** L, P2, wave 44. Lab: angio-pci.

- Learner: Treats a degenerated vein graft with embolic protection and intragraft vasodilator, and a LIMA-LAD with pseudolesions.
- Built: Graft scenarios on the graft anatomy that diag-grafts-svg adds to the shared coronary tree: an SVG decision step, embolic protection filters with landing-zone rules, prophylactic intragraft vasodilator, and a LIMA-LAD case with accordion pseudolesions and an anastomotic lesion.
- Requests: cp-prior-cabg#3, cp-prior-cabg#4, cp-prior-cabg#5, cp-prior-cabg#6, pm-lab-drugs#3.
- Depends on: pci-device-delivery, pci-flow-closure, diag-grafts-svg, pci-lab-input.
- Files (7): src/simulation/pci/epd.ts, src/simulation/pci/epd.test.ts, src/simulation/pci/actions/devices.ts, src/ui/pci/consoles/EpdConsole.tsx, src/ui/pci/inputBindings/epd.ts, src/simulation/pci/scenarios/packs/graft.ts, src/simulation/pci/scenarios/packs/graft.launch.ts.
- Acceptance: epd.test.ts: a filter is refused when the landing zone is shorter than required; with a filter, embolisation gives filter fill instead of distal no-reflow; pulling an open filter through a stent is flagged. Nicardipine before ballooning lowers the no-reflow probability (seeded). lima-lad: a stiff wire produces new-narrowing-tortuous; vasodilator does not change it; withdrawal clears it. Plus 4 more in the JSON.

#### diag-view-coverage-segments

**Orthogonal view sets, ostial views and segment naming on stored runs.** M, P2, wave 44. Lab: cathlab.

- Learner: Checks each artery against the orthogonal view sets and names SYNTAX segments on the stored runs.
- Built: A views debrief that checks each artery and graft against the manual's orthogonal sets and a two-view-per-segment rule, names runs in signed notation, and a segment-naming exercise on the learner's own stored runs.
- Requests: pm-acquiring#6, cp-left-main#5, cp-ostial#7, pm-acquiring#7, cp-prior-cabg#1.
- Depends on: diag-study-report, found-mentor-registries.
- Files (9): src/mentor/viewSets.ts, src/mentor/coverage.ts, src/mentor/debriefChecks/views.ts, src/ui/mentor/debrief/ViewsSection.tsx, src/ui/lab/ReferenceMonitor.tsx, src/ui/lab/SeriesBrowser.tsx, src/mentor/viewSets.test.ts, src/simulation/diagnosticScenarios/views.ts, and 1 more.
- Acceptance: A left study with only RAO caudal and LAO caudal runs lists segments 6-7 as seen once and fails the LAD set. A click on the projected mid LCx in a left-dominant case is graded 13; the PDA from the LCx is 15. browser: finish diag-lm-five-views with three runs; the Views tab names the missing LAO cranial. Plus 2 more in the JSON.

#### diag-contrast-ceilings-oedema

**Contrast agent choice, running ceilings and pulmonary oedema.** M, P2, wave 44. Lab: cathlab.

- Learner: Chooses a contrast agent, watches both ceilings and manages pulmonary oedema.
- Built: Choice of contrast agent class with viscosity, osmolar and haemodynamic effects, the running total against both ceilings from contrastBudget.ts, and pulmonary oedema from excess volume or an ill-judged ventriculogram with the manual's management.
- Requests: pm-lab-drugs#10, hb-background#6, hb-cardiac-catheterisation#11, pm-engaging#8, cp-prior-cabg#0.
- Depends on: diag-lab-drugs, diag-scenario-registry, found-patient-formulary.
- Files (8): src/ui/mentor/PreBrief.tsx, src/simulation/injection.ts, src/simulation/patient/engine.ts, src/ui/lab/DosePanel.tsx, src/ui/sim/modules/contrast.ts, src/ui/sim/contrast.test.ts, src/simulation/diagnosticScenarios/contrast.ts, src/simulation/diagnosticScenarios/contrast.launch.ts.
- Acceptance: An iso-osmolar agent through diag-5 gives a lower peak flow than a low-osmolar agent at the same plunger force. 250 mL in a patient with LVEF 25% and LVEDP 28 produces pulmonary oedema; furosemide and nitrate lower LVEDP over minutes. browser: diag-contrast-sensitive-lv shows both ceilings and the stricter raises high-contrast-volume at the warning threshold. Plus 2 more in the JSON.

#### diag-radiation-practice

**Operator protection, dose display, pedal discipline and beam controls.** M, P2, wave 45. Lab: cathlab.

- Learner: Protects themselves and the patient, sees operator and patient dose, and is scored on pedal discipline.
- Built: Shield, pad, distance and personal protection choices with an operator dose read-out and a dosimeter alarm, live patient dose rate and cumulative air kerma with follow-up triggers, detection of screening while moving or idle, pregnancy and prior-radiation checks, an optional kV, mA and filtration teaching panel, and ergonomics set-up.
- Requests: hb-lab-and-radiation#3, hb-lab-and-radiation#4, hb-lab-and-radiation#5, pm-acquiring#3, hb-safe-practice#4.
- Depends on: diag-tip-context, diag-scenario-registry, found-mentor-registries, found-lab-controls-registry, pci-lab-shell-session, realism-baseline.
- Files (10): src/simulation/dose.ts, src/simulation/dose.test.ts, src/simulation/imaging/exposure.ts, src/ui/lab/DosePanel.tsx, src/ui/mentor/PreBrief.tsx, src/mentor/debriefChecks/radiation.ts, src/ui/lab/controls/tabs/BeamTab.tsx, src/render/xray/adrc.ts, and 2 more.
- Acceptance: dose.test.ts: doubling operator distance quarters the eye dose rate; shield high or away raises it; steep LAO 90 raises it more than RAO 30 at the same KAP rate. 3 s of fluoroscopy while the C-arm moves increments the moving-screen count; the alarm event is raised at the set rate. browser: diag-operator-protection, a pad in the field raises dose and the debrief shows operator dose beside patient dose. Plus 3 more in the JSON.

#### proc-consent-conversation

**Scored consent conversation from the patient's own risks.** M, P2, wave 45. Lab: procedure.

- Learner: Consents the patient with risks raised by the patient's own factors and an agreed ad hoc limit.
- Built: Replaces one-click consent with a statement-choice conversation whose risks are raised by the patient's factors and which agrees an ad hoc limit and resuscitation status.
- Requests: pm-planning#3.
- Depends on: proc-chart-planted-problems.
- Files (7): src/simulation/session/consent.ts, src/simulation/session/consent.test.ts, src/simulation/session/modules/consent.ts, src/simulation/session/caseSession.ts, src/ui/access/chart/Consent.tsx, src/simulation/session/scenarios/consent.ts, src/simulation/session/scenarios/consent.launch.ts.
- Acceptance: A selection without mortality fails; one naming the patient's CKD and LV impairment passes the risk item. In 'consent-no-capacity-lpa' best interests over the attorney is wrong. consent.adHocLimit is present in the SessionHandover. Plus 2 more in the JSON.

#### access-distal-radial

**Distal radial and ulnar sites, and a tall patient.** M, P2, wave 45. Lab: access.

- Learner: Punctures the distal radial and ulnar arteries and copes with a very tall patient.
- Built: The snuffbox and ulnar sites in the ultrasound engine with hand position, puncture angle and direction and a smaller artery limiting the sheath, and a tall-patient preset where a standard catheter cannot reach the root.
- Requests: pm-access#6.
- Depends on: access-radial-sequence, access-sheath-choice.
- Files (8): src/simulation/access/site.ts, src/simulation/access/ultrasound.ts, src/simulation/access/route.ts, src/simulation/procedure.ts, src/ui/access/UltrasoundView.tsx, src/simulation/access/access.test.ts, src/simulation/session/scenarios/distalRadial.ts, src/simulation/session/scenarios/distalRadial.launch.ts.
- Acceptance: The distal radial diameter is smaller than the same patient's radial and a sheath above its limit is refused or scored wrong. A medial-to-lateral yaw fails the angle item. In 'tall-patient-distal' a 100 cm catheter stops short of the root and 125 cm reaches. Plus 3 more in the JSON.

#### access-femoral-route-hazards

**Iliac occlusion, aortic occlusion and aneurysm on the femoral wire route.** M, P2, wave 46. Lab: access.

- Learner: Images rather than forces an iliac occlusion, aortic occlusion or aneurysm.
- Built: Obstacles on the femoral route that the learner must image rather than force: an iliac occlusion on angiography, an occluded aorta behind an axillofemoral graft, and an unsuspected aneurysm where the J wire loops back.
- Requests: hb-background#7.
- Depends on: access-femoral-upsizing-angiogram, found-case-model-types.
- Files (7): src/simulation/procedure.ts, src/simulation/access/route.ts, src/simulation/caseGenerator.ts, src/simulation/session/modules/routeHazards.ts, src/simulation/access/access.test.ts, src/simulation/session/scenarios/routeHazards.ts, src/simulation/session/scenarios/routeHazards.launch.ts.
- Acceptance: In 'iliac-occlusion-weak-pulse' the wire cannot pass the iliac segment and forcing raises a dissection. In 'aaa-unsuspected' the wire loops in the abdomen and advancing 50 mm further without a puff is wrong. browser: __accessFluoroDraw({ station:'pelvis', puff:true }) shows the iliac cut-off. Plus 2 more in the JSON.

#### proc-triage-queues

**Referral triage, NSTE-ACS queue and STEMI transfer clock.** L, P2, wave 46. Lab: procedure.

- Learner: Triages referrals, orders an NSTE-ACS queue and runs a STEMI transfer against the clock.
- Built: Pre-case decision screens: a referral queue to accept, defer or decline, an NSTE-ACS queue by urgency with pretreatment decisions, and a STEMI transfer scenario with a running clock, the reperfusion decision and a timed run to the table.
- Requests: pm-target#0, pm-target#9, cp-acs-thrombus#1.
- Depends on: proc-foundation-scenarios-ledger, access-multi-site, proc-preprocedure-orders.
- Files (8): src/simulation/session/triage.ts, src/simulation/session/triage.test.ts, src/simulation/session/modules/triage.ts, src/ui/access/TriagePanel.tsx, src/ui/sections/ProcedureLab.tsx, src/simulation/patient/engine.ts, src/simulation/session/scenarios/triage.ts, src/simulation/session/scenarios/triage.launch.ts.
- Acceptance: A refused-consent referral scored accept is wrong; the NSTE queue scores ongoing pain first. 'stemi-transfer-far' with an expected 150 min scores primary PCI wrong and lysis correct; a full-dose lytic at 78 is wrong. ST resolution below 50% at 90 min scores rescue PCI correct. Plus 3 more in the JSON.

#### access-cx-groin-duplex

**Groin haematoma, pseudoaneurysm and fistula on duplex.** M, P2, wave 46. Lab: access.

- Learner: Assesses haematoma, pseudoaneurysm and fistula on duplex and chooses observation, thrombin or surgery.
- Built: At follow-up the learner presses at the right place, asks for duplex on the access ultrasound engine with colour flow, measures cavity and neck, and chooses observation, thrombin, compression or surgery.
- Requests: cm-access-complications#2, cm-access-complications#6.
- Depends on: proc-recovery-ward.
- Files (8): src/simulation/access/ultrasound.ts, src/simulation/access/site.ts, src/simulation/session/modules/duplex.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/panels/RecoveryPanel.tsx, src/simulation/access/duplex.test.ts, src/simulation/session/scenarios/duplex.ts, src/simulation/session/scenarios/duplex.launch.ts.
- Acceptance: Calipers on 'psa-narrow-neck' return cavity and neck within 1 mm of the scenario values. Thrombin in 'psa-wide-neck' is wrong and in 'psa-narrow-neck' clots the cavity. 'avf' colour overlay shows continuous flow in the vein. Plus 2 more in the JSON.

#### proc-sedation

**Titrated sedation with over-sedation, agitation and desaturation mimics.** M, P2, wave 47. Lab: procedure.

- Learner: Titrates sedation and reverses over-sedation without being fooled by mimics.
- Built: Sedation as titrated orders with responses by age, weight, lung disease and sleep apnoea; over-sedation with stepwise reversal; an agitated under-sedated patient; desaturations from early oedema or probe artefact that reversal does not fix.
- Requests: pm-lab-drugs#0.
- Depends on: found-patient-formulary, proc-hypotension-pressors.
- Files (9): src/simulation/session/sedation.ts, src/simulation/session/sedation.test.ts, src/simulation/session/modules/sedation.ts, src/simulation/patient/patient.ts, src/ui/access/orders/Sedation.tsx, src/ui/lab/HaemoMonitor.tsx, src/ui/access/UltrasoundView.tsx, src/simulation/session/scenarios/sedation.ts, and 1 more.
- Acceptance: 'sedation-osa' with midazolam 2 mg and fentanyl 100 ug drops SpO2 below 90 where a fit 50-year-old does not. Naloxone for 'desat-probe-artefact' is wrong. Agitation in 'sedation-anxious-young' raises spasm inputs against titrated sedation. Plus 2 more in the JSON.

#### proc-handover-report-discharge

**Ward hand-over, operator's report, explanation to the patient and discharge summary.** L, P2, wave 47. Lab: procedure.

- Learner: Hands over to the ward, writes the operator's report, explains the result to the patient and writes the discharge summary.
- Built: Structured, scored end-of-case documents: the four-item ward hand-over with every line, the operator's report per lesion and stent, the conversation with the patient (with complication and high-dose variants), and the discharge summary with advice.
- Requests: hb-after-the-procedure#0, hb-after-the-procedure#3, hb-after-the-procedure#4.
- Depends on: proc-recovery-ward, proc-discharge-prescription, access-multi-site.
- Files (7): src/simulation/session/report.ts, src/simulation/session/report.test.ts, src/simulation/session/modules/report.ts, src/ui/access/panels/HandoverPanel.tsx, src/ui/access/panels/DischargePanel.tsx, src/simulation/session/scenarios/report.ts, src/simulation/session/scenarios/report.launch.ts.
- Acceptance: 'report-venous-sheath-left' fails the lines item when the venous sheath is not listed with its removal time. 'report-nondiagnostic-filling' reported as normal is wrong; results given while sedation is above threshold are wrong. 'discharge-lorry-driver' scores car-licence advice wrong; 'talk-high-dose' without skin review within a month fails. Plus 2 more in the JSON.

#### pci-bench-reading-library

**Frame-reading drills: OCT plaque, ACS culprits, artefacts, CTO IVUS and MINOCA.** L, P2, wave 47. Lab: pci-bench.

- Learner: Names plaque, culprit features, artefacts and CTO wire positions on generated frames.
- Built: A 'Read frames' mode with generated IVUS and OCT pullbacks containing labelled features and artefacts; the learner names each finding and the fix or next step, scored with balanced accuracy.
- Requests: hb-background#3, pm-imaging#3, pm-imaging#7, cp-cto-antegrade#7, cp-cto-strategy#6, cp-acs-thrombus#7.
- Depends on: pci-bench-imaging-unify.
- Files (7): src/simulation/pci/ivus.ts, src/simulation/bench/readingFrames.ts, src/simulation/bench/readingFrames.test.ts, src/ui/imaging/IntravascularView.tsx, src/ui/bench/ReadingDrill.tsx, src/ui/sections/PciBench.tsx, src/content/lab/presets/pci-bench/reading.launch.ts.
- Acceptance: Every recipe produces frames whose feature flags match its key; TCFA frames have capUm < 65; NURD never appears on phased-array sets. Calcium and lipid differ by border sharpness in OCT frames. MINOCA scoring marks a stent without a proven culprit wrong and CMR correct when OCT is normal. Plus 2 more in the JSON.

#### physiology-decision-and-subsets

**Treat-or-defer decision, misleading subsets, long-lesion pullbacks, jailed side branch, ACS context and virtual PCI.** L, P2, wave 48. Lab: physiology.

- Learner: Decides when physiology helps, recognises the subsets where it misleads, and predicts the result of PCI from a pullback.
- Built: A decision step before the wire is opened, subsets where the value misleads (vein graft, CTO donor, severe AS before and after TAVR, high RA, shock, diabetic discordance), long-lesion focal versus diffuse pullbacks, jailed side-branch FFR, an ACS culprit card, and co-registered virtual PCI.
- Requests: pm-physiology#0, pm-physiology#7, pm-target#8, cp-bifurcation-provisional#6, cp-other-complex#6, pm-physiology#4.
- Depends on: physiology-left-main-and-ostial, physiology-post-pci-handover.
- Files (8): src/simulation/physiology.ts, src/simulation/physiology.test.ts, src/simulation/physiology/virtualPci.ts, src/simulation/physiology/virtualPci.test.ts, src/ui/physiology/DecisionPanel.tsx, src/ui/physiology/CaseCard.tsx, src/ui/physiology/VesselStrip.tsx, src/content/lab/presets/physiology/decision.launch.ts.
- Acceptance: Decision scoring for each card matches the module's rules. virtualPci.test.ts: removing the marked segment predicts close to the treated model value; the diffuse preset predicts less than 0.03 gain. The CTO donor FFR rises 0.03-0.10 after opening; the Pd-Pv correction lowers FFR at RA 15 mmHg; a pullback past the guide tip without a drift check is flagged. Plus 2 more in the JSON.

#### haemo-cardiac-output-thermodilution

**Thermodilution injections with taught pitfalls, compared with Fick.** M, P2, wave 48. Lab: haemo.

- Learner: Measures thermodilution output, recognises its pitfalls and compares it with Fick.
- Built: Proximal-port injections with volume, temperature, speed and timing, each curve and output shown, scenarios that distort the curves (slow injection, smaller volume than entered, warm injectate, shunt, severe TR, very low output, AF), and comparison with Fick with the method stated.
- Requests: hb-cardiac-catheterisation#6.
- Depends on: haemo-study-session-and-tips, haemo-shunt-studies.
- Files (5): src/simulation/haemo/thermodilution.ts, src/simulation/haemo/thermodilution.test.ts, src/ui/haemo/CalcPanel.tsx, src/ui/haemo/ThermoPanel.tsx, src/content/lab/presets/haemo/thermo.launch.ts.
- Acceptance: A correct injection set returns CO within 5% of derive().co. Entering 10 mL when 7 mL was injected overestimates CO by about 10/7; TR prolongs the tail and differs from Fick. The report is rejected without method and index. Plus 2 more in the JSON.

#### haemo-events-and-special-studies

**Hypotension work-up, tamponade pulsus tool, massive PE with pulmonary angiography, ventilation and vasoreactivity.** L, P2, wave 48. Lab: haemo.

- Learner: Works up intraprocedural hypotension, tamponade, massive PE, ventilated patients and vasoreactivity.
- Built: A hypotension work-up that excludes false readings first, tamponade traces with a pulsus tool, massive PE with access choice against duplex and a pulmonary angiography protocol, a ventilation toggle for constriction, restriction and tamponade, and PAH vasoreactivity.
- Requests: hb-cardiac-catheterisation#7, cm-perforation#8, hb-specific-conditions#7, hb-specific-conditions#5, hb-cardiac-catheterisation#8.
- Depends on: haemo-study-session-and-tips, haemo-rhc-manoeuvre, proc-hypotension-pressors, haemo-valve-and-myocardial-studies.
- Files (8): src/simulation/haemo.ts, src/simulation/haemo.test.ts, src/simulation/haemo/events.ts, src/simulation/haemo/events.test.ts, src/ui/haemo/OrdersPanel.tsx, src/ui/haemo/TracePanel.tsx, src/ui/haemo/PulmonaryAngio.tsx, src/content/lab/presets/haemo/events.launch.ts.
- Acceptance: In 'hypotension-false-ycon' treating before closing the Y-connector is wrong; SVR within 10% accepted. Pulsus measured on 'tamponade-pulsus' is within 2 mmHg of the scenario value. With ventilation on RA rises on inspiration and a Kussmaul call is wrong; vasoreactivity with a raised wedge is blocked; haemo-pe-* tips appear only with pulmonary-embolism. Plus 2 more in the JSON.

#### mcs-iabp-insertion-and-troubleshooting

**IABP insertion and troubleshooting on the circulation model.** L, P2, wave 49. Lab: mcs.

- Learner: Sizes, inserts and troubleshoots an IABP on the circulation model.
- Built: Height-based sizing with both charts, balloon preparation, the kit wire to the arch, tip at the carina and left subclavian landmark, then troubleshooting presets on the circulation model's IABP with a static balloon clock.
- Requests: pm-support-devices#0, pm-support-devices#1, cm-access-complications#8.
- Depends on: mcs-console-split-select-and-tips, xray-device-fluoro-views, mcs-largebore-access-and-removal.
- Files (8): src/simulation/iabp.ts, src/simulation/iabp.test.ts, src/simulation/circulation.ts, src/simulation/mcs/iabpFaults.ts, src/simulation/mcs/iabpFaults.test.ts, src/ui/mcs/IabpConsole.tsx, src/ui/mcs/IabpInsertionStage.tsx, src/content/lab/presets/mcs/iabp.launch.ts.
- Acceptance: Each correctable fault lowers augmented diastolic pressure and its fix restores MAP within 5 mmHg. A static balloon left more than 15 model minutes is critical; 1:1 without anticoagulation accepted and 1:3 rejected. The size for a 165 cm patient matches each chart. Plus 2 more in the JSON.

#### structural-tavi-procedure

**TAVI access with both sides measured, pacing route and conduction plan, and paravalvular regurgitation work-up.** L, P2, wave 49. Lab: tavi.

- Learner: Chooses access and pacing for TAVI and works up paravalvular regurgitation.
- Built: Both iliofemoral axes measured, the puncture sequence (secondary access first, guided puncture, two sutures before dilatation, protection wire, contralateral check angiogram), pacing by LV or RV wire with threshold and conduction predictors, and PVR grading with the mechanism named before correction.
- Requests: hb-tavi#3, hb-tavi#4, hb-tavi#7.
- Depends on: structural-tavi-planning, pacing-in-lab-scenarios-and-tips.
- Files (6): src/simulation/tavi.ts, src/simulation/tavi.test.ts, src/ui/structural/TaviLab.tsx, src/ui/structural/TaviViews.tsx, src/ui/structural/TaviAccessStage.tsx, src/content/lab/presets/structural/taviProcedure.launch.ts.
- Acceptance: The side whose MLD is below the system minimum is wrong; dilatation before sutures is flagged. In 'tavi-rbbb' removing the RV wire leads to delayed CHB; a retained wire not in demand mode is flagged. A plug while underexpansion remains is wrong. Plus 2 more in the JSON.

#### structural-teer-steering-and-tricuspid

**TEER steering, x-plane and 3D views, C-arm alignment, planimetry, tricuspid TEER and end-of-case septal assessment.** L, P2, wave 49. Lab: teer.

- Learner: Steers and grasps in TEER, does tricuspid TEER and assesses the iatrogenic ASD.
- Built: Steering mechanics in the steer, grasp and assess steps, guide flex for an aorta-hugger, 3D view orientation, C-arm alignment, planimetered area, LA v wave and a second device; tricuspid TEER with morphology, gap, jet location and the responder profile; iatrogenic ASD assessment and venous closure after guide removal.
- Requests: hb-mitral-tricuspid-laa#2, hb-mitral-tricuspid-laa#3, hb-mitral-tricuspid-laa#7.
- Depends on: structural-transseptal-hands-on.
- Files (7): src/simulation/teer.ts, src/simulation/teer.test.ts, src/simulation/tteer.ts, src/simulation/tteer.test.ts, src/ui/structural/TeerLab.tsx, src/ui/structural/TeerViews.tsx, src/content/lab/presets/structural/teer.launch.ts.
- Acceptance: Clockwise rotation moves the implant posterior in the LVOT view and push moves it in the intercommissural view; guide flex corrects an aorta-hugger. Release without insertion quantified on both leaflets is wrong; planimetered area below 1.5 cm2 after a second device is flagged. A 12 mm tricuspid gap raises SLDA probability; declining a futile responder profile is correct; the iASD decision matches the criteria. Plus 2 more in the JSON.

#### views-chamber-depth

**View trainer chamber overlay and a depth mode.** M, P2, wave 50. Lab: views.

- Learner: Places chambers and walls at any C-arm angle and names the artery for each wall.
- Built: An optional chamber and valve-plane silhouette at any C-arm angle with a tap-to-place exercise and wall-to-artery naming by dominance, and a guided-only depth thumbnail in the diagnostic lab.
- Requests: hb-background#0, hb-background#2.
- Depends on: found-launch-links, diag-grafts-svg.
- Files (7): src/ui/sections/ViewTrainer.tsx, src/ui/views/ChamberOverlay.tsx, src/ui/views/chamberOverlay.test.ts, src/data/viewPresets.ts, src/ui/sim/DepthThumbnail.tsx, src/ui/sim/Simulator.tsx, src/content/practice/views-chamber-depth.launch.ts.
- Acceptance: The projected LV apex at RAO 30 lies left-inferior of the aortic valve centre; the RV apex projects medial to the LV apex in AP. Tapping inside the projected inferior wall at RAO 30 scores correct; RCA for the inferior wall is correct in right dominance and wrong in left. browser: the view trainer overlay works at LAO 60/CRA 20. Plus 1 more in the JSON.

#### debrief-reflection

**Structured reflection after every debrief and a pause after major events.** M, P2, wave 50. Lab: diagnostic + pci + procedure.

- Learner: Reflects on each case in a structured way and pauses for a team debrief after a major event.
- Built: A reflection debrief section for the diagnostic, PCI and full-case debriefs (timeline, decision points, frame questions, system factors, one action) saved to the logbook and shown in Mistake review, and a pause-for-team-debrief choice before the next case after a major event.
- Requests: hb-safe-practice#0, hb-safe-practice#4.
- Depends on: diag-study-report, found-mentor-registries, found-lab-session-plumbing.
- Files (6): src/ui/mentor/debrief/ReflectionSection.tsx, src/progress/types.ts, src/progress/logbook.ts, src/progress/reflection.test.ts, src/ui/sections/MistakeReview.tsx, src/mentor/timeline.ts.
- Acceptance: reflection.test.ts: a reflection with an empty or repeated action is rejected; a valid one is saved and reloaded; three reflections ticking fatigue flag an audit topic. browser: finish a case with VF; the next case start asks about a team debrief. Tips (a new test file beside its event source): in a scenario that exercises it, after the action that raises 'acute-closure', tipsFor(ctx, 20) includes pci-safe-capture-the-facts and pci-safe-pause-after-major-event; every waiting.ts entry naming debrief-reflection becomes satisfiable, so the reachability waiting count for the pci lab falls by at least their number.

#### mcs-ecmo-cannulation-and-management

**VA-ECMO cannulation including ECPR, limb NIRS, refractory hypoxaemia, venting, weaning and cannula complications.** XL, P2, wave 50. Lab: mcs.

- Learner: Cannulates for VA-ECMO (including during CPR) and manages limb perfusion, hypoxaemia, venting and weaning.
- Built: Stepwise cannulation (groins, angiogram, antegrade perfusion sheath, heparin, venous wire with a fall-back-into-RA scenario, venous cannula at the SVC-RA junction, arterial wire and cannula, wet connection with optional bubbles), ECPR under mechanical CPR with a contraindication screen, leg NIRS from the model, the refractory hypoxaemia branch, vent choice, a weaning trial and cannula complications.
- Requests: pm-support-devices#4, cp-complex-patients#3, pm-access#10, pm-support-choice#5, pm-support-devices#5, cm-access-complications#8.
- Depends on: mcs-largebore-access-and-removal, xray-device-fluoro-views, mcs-impella-insertion-and-events.
- Files (7): src/simulation/mcs/ecmoCannulation.ts, src/simulation/mcs/ecmoCannulation.test.ts, src/simulation/circulation.ts, src/simulation/circulation.test.ts, src/ui/mcs/EcmoConsole.tsx, src/ui/mcs/EcmoCannulationStage.tsx, src/content/lab/presets/mcs/ecmo.launch.ts.
- Acceptance: Advancing the venous cannula with the wire in the RA is critical; same-groin cannulae congest the leg. Leg NIRS falls below 50% without a DPC in 'ecmo-leg-nirs' and recovers with it. Removing the pump when VA-ECMO starts in 'ecmo-hypoxaemia-on-pump' is wrong; right radial sat is lower than femoral; a wean step without the anticoagulation prompt is flagged. Plus 2 more in the JSON.

#### progression-exams

**Held-out exams and simulator entrustment above level II for PCI and the other labs.** M, P2, wave 51. Lab: progress (PCI and the other labs).

- Learner: Earns simulator entrustment above level II in PCI and the other labs through held-out exams.
- Built: PCI ladders and exam variants built from the registry, and held-out presets in the haemodynamics, MCS, structural, bedside, bench and pressure-wire labs, run in exam mode (no hints, one counted attempt, leaving counts as failure, critical errors reset). EPA ceilings rise to III and IV with simulator-entrustment wording, Oxford logbook fields are recorded, and held-out wiring exercises are added. Merges pci-progression-exam and labs-heldout-exams.
- Requests: hb-the-operator#0, hb-the-operator#4, pm-wiring#6, hb-the-operator#1.
- Depends on: pci-assessment-policy-qca, pci-attending, pci-scenario-registry, haemo-study-session-and-tips, mcs-console-split-select-and-tips, structural-tips-and-tavi-course, pacing-in-lab-scenarios-and-tips, pci-wire-microcatheter, found-lab-session-plumbing, progression-labels.
- Files (7): src/content/mentor/catalogue.ts, src/progress/competency.ts, src/progress/logbook.ts, src/mentor/standards.ts, src/ui/lab/visibility.ts, src/progress/progress.test.ts, src/ui/sections/Challenge.tsx.
- Acceptance: progress.test.ts: two exam passes on distinct held-out variants on two days with no critical error raise pci-simple and haemo-cath to III; a perforation resets the PCI count; expiry drops a level. Exam variants never equal practice variants; a practice session on a held-out id is rejected. The logbook entry has all Oxford fields.

### Phase 5: lower priority and the content link layer

P3 packages and the P2 and P3 passes of the content link layer. content-links-backfill-p2 and content-links-backfill-p3 edit many lesson files and therefore run alone in their waves, after every scenario they link to exists.

#### content-links-backfill-p2

**Link lesson blocks to the P2 scenarios and apply the P2 tip retargets.** M, P2, wave 52. Lab: all labs (lesson content).

- Learner: Opens every P2 scenario from its lesson blocks, and sees the equipment-loss, filter and dose-alarm tips only when they apply.
- Built: A second pass of content-links-backfill for the scenarios the P2 packages add, plus the deferred tip retargets whose events only P2 packages raise (wire fracture, balloon entrapment and snare tips from pci-equipment-loss, the filter tips from pci-graft, the operator dose alarm from diag-radiation-practice).
- Requests: cm-equipment-loss#6, cp-prior-cabg#6.
- Depends on: content-links-backfill, pci-equipment-loss, pci-graft, diag-route-arch-femoral-variants, diag-view-coverage-segments, diag-contrast-ceilings-oedema, diag-tavi-frame-engagement, diag-radiation-practice, proc-consent-conversation, access-sheath-choice, access-distal-radial, access-venous, access-femoral-route-hazards, proc-triage-queues, access-closure-femoral-devices, access-cx-groin-duplex, proc-sedation, proc-handover-report-discharge, pci-bench-reading-library, physiology-decision-and-subsets, haemo-valve-and-myocardial-studies, haemo-shunt-studies, haemo-cardiac-output-thermodilution, haemo-events-and-special-studies, mcs-largebore-access-and-removal, mcs-impella-insertion-and-events, mcs-iabp-insertion-and-troubleshooting, mcs-ecmo-cannulation-and-management, structural-tavi-planning, structural-tavi-procedure, structural-teer-steering-and-tricuspid, pacing-overdrive-and-tcp.
- Files (52): src/content/manual/pci-manual/01-planning.ts, src/content/manual/pci-manual/02-monitoring.ts, src/content/manual/pci-manual/03-antithrombotics.ts, src/content/manual/pci-manual/04-lab-drugs.ts, src/content/manual/pci-manual/05-access.ts, src/content/manual/pci-manual/06-to-the-root.ts, src/content/manual/pci-manual/07-engaging.ts, src/content/manual/pci-manual/08-acquiring.ts, and 44 more.
- Acceptance: content.test.ts: every lessonId named by a P1 or P2 lab request appears in practiceIndex or has a block whose scenario lists that lesson. tipsFor with events ['equipment-entrapment','wire-fracture'] returns pci-wire-fracture-ivus-first and with 'balloon-entrapment' alone does not; pci-epd-* tips appear only with epd-deployed. reachability.test.ts: waiting.ts holds no ready entry; the superset guard passes for the complication contexts.

#### pci-complex-p3

**Lower-priority complex scenarios: SCAD, long serial lesions, PCI through a transcatheter valve, alcohol septal ablation.** L, P3, wave 53. Lab: angio-pci.

- Learner: Practises SCAD, long serial lesions, PCI through a TAVI frame and alcohol septal ablation.
- Built: P3 scenarios that reuse existing devices and engines and need only definitions plus small model additions.
- Requests: cp-other-complex#2, cp-other-complex#7, cp-complex-patients#6, hb-additional-procedures#6.
- Depends on: pci-scenario-registry, pci-lab-shell-session, pci-intravascular-imaging, diag-tavi-frame-engagement, realism-baseline.
- Files (5): src/simulation/pci/scenarios/packs/complexOther.ts, src/simulation/pci/scenarios/packs/complexOther.launch.ts, src/simulation/pci/septalAblation.ts, src/simulation/pci/complexOther.test.ts, src/ui/pci/render/tavi.ts.
- Acceptance: SCAD: a polymer wire enters the false lumen in more than 50% of seeds; high-pressure post-dilatation extends the haematoma. Serial lesions: treating proximal first raises distal delivery failure. TAVI: guide coaxial stays < 0.5; wiring first then extension delivers the stent. Plus 4 more in the JSON.

#### diag-supervisor-mode

**Supervisor mode: stop a scripted trainee at each unsafe step.** L, P3, wave 53. Lab: diagnostic.

- Learner: Acts as the trainer: stops a scripted trainee at each unsafe step and gives one target.
- Built: Replays scripted trainee runs through the real lab with faults at set moments; the learner, as trainer, stops the run, names the problem and the instruction, and gives one target at the end.
- Requests: hb-the-operator#2.
- Depends on: diag-rod-physics, diag-tip-context, diag-scenario-registry.
- Files (6): src/simulation/supervisorScripts.ts, src/simulation/supervisorScripts.test.ts, src/ui/mentor/SupervisorMode.tsx, src/mentor/replay.ts, src/ui/sections/CaseLibrary.tsx, src/simulation/supervisorScripts.launch.ts.
- Acceptance: Replaying a script twice gives identical engagement and injection timelines. A stop 0.5 s after the damped-injection fault and before the push scores; a stop after the push does not. browser: diag-supervise-damped, stop at the fault and choose the correct problem; the debrief asks for one target. Plus 2 more in the JSON.

#### proc-support-standby

**High-risk elective PCI planning: right heart numbers and standby support.** M, P3, wave 53. Lab: procedure.

- Learner: Plans support for high-risk elective PCI from right heart numbers.
- Built: A planning step with the right heart study at the start, the choice between no support, standby with a 4 Fr femoral arterial sheath and prophylactic support, and the PA catheter kept in.
- Requests: pm-support-choice#4.
- Depends on: access-venous, proc-hypotension-pressors, access-multi-site.
- Files (5): src/simulation/session/support.ts, src/simulation/session/support.test.ts, src/ui/access/chart/SupportPlan.tsx, src/simulation/session/scenarios/support.ts, src/simulation/session/scenarios/support.launch.ts.
- Acceptance: 'support-abnormal-haemo-only' scores no standby sheath wrong; 'support-both' without a recorded reason fails. The retained PA catheter appears in the hand-over lines. practiceIndex lists the scenarios support-normal-haemo-low-risk, support-abnormal-haemo-only, support-high-risk-only under lessons pm-support-choice-when (from src/simulation/session/scenarios/support.launch.ts). Plus 1 more in the JSON.

#### logbook-audit-gaps

**Personal audit view and logbook export with a gap view.** M, P3, wave 54. Lab: logbook.

- Learner: Audits their own outcomes honestly and sees which logbook categories still need practice.
- Built: An audit tab from every case started (including abandoned and failed attempts) with observed against expected outcomes, a funnel plot, monthly process measures and a stored improvement target, plus Oxford logbook fields with CSV export and a gap view linking to practice.
- Requests: hb-safe-practice#1, hb-the-operator#5.
- Depends on: diag-scenario-registry, debrief-reflection, progression-exams.
- Files (5): src/progress/audit.ts, src/progress/audit.test.ts, src/progress/types.ts, src/progress/logbook.ts, src/ui/sections/Analytics.tsx.
- Acceptance: audit.test.ts: an abandoned case counts in the denominator and is labelled; expected below 1 shows the notice; control limits match exact binomial values. CSV export has one row per entry with all Oxford fields. browser: the Audit tab links a zero-count 'vein graft' field to diag-graft-search.

#### proc-sterile-field

**Sterile field and environment events.** S, P3, wave 54. Lab: procedure.

- Learner: Keeps the field sterile, the room quiet and the lines free of air.
- Built: A contaminated access site before the puncture, background conversation during critical steps, and air in the manifold or tubing before the first injection.
- Requests: pm-monitoring#7.
- Depends on: proc-chart-planted-problems.
- Files (7): src/simulation/session/environment.ts, src/simulation/session/environment.test.ts, src/simulation/session/modules/environment.ts, src/ui/access/UltrasoundView.tsx, src/ui/access/panels/TablePanel.tsx, src/simulation/session/scenarios/environment.ts, src/simulation/session/scenarios/environment.launch.ts.
- Acceptance: Puncture after 'sterile-hand-touch' without re-prep is wrong. 'sterile-air-tubing' inspection shows bubbles and flushing clears the hazard. practiceIndex lists the scenarios sterile-hand-touch, sterile-chatter, sterile-air-tubing under lessons pm-monitoring-sterile (from src/simulation/session/scenarios/environment.launch.ts). Plus 1 more in the JSON.

#### pci-bench-guide-extension

**Guide extension delivery and trapping exercise.** M, P3, wave 54. Lab: pci-bench.

- Learner: Delivers a stent through an extension collar without deforming it.
- Built: A schematic delivery exercise: a stent through the extension collar (push rod position and wire wrap, loading outside the body, collar position), stent deformation when forced, and trapping with a standard or integrated-balloon extension.
- Requests: cm-equipment-loss#5.
- Depends on: pci-bench-imaging-unify.
- Files (5): src/simulation/bench/delivery.ts, src/simulation/bench/delivery.test.ts, src/ui/bench/DeliveryPanel.tsx, src/ui/sections/PciBench.tsx, src/content/lab/presets/pci-bench/delivery.launch.ts.
- Acceptance: Forcing a stent at the collar with wire wrap deforms it; reinserting the extension clears the wrap. A trapping balloon distal to the collar with a standard extension fails; with an integrated trapping extension it passes. practiceIndex lists every scenario in src/content/lab/presets/pci-bench/delivery.launch.ts under lessons cm-equipment-loss-stent, cm-equipment-loss-balloon-microcath (from src/content/lab/presets/pci-bench/delivery.launch.ts). Plus 1 more in the JSON.

#### glossary-history-timeline

**Interactive history timeline and core definitions.** S, P3, wave 55. Lab: glossary.

- Learner: Orders the milestones of catheterisation and reviews the core definitions.
- Built: A History panel in the Glossary with the module's milestones, source disagreements marked, an ordering exercise, and four core definitions in the review queue.
- Requests: hb-lab-and-radiation#6.
- Depends on: nothing.
- Files (4): src/content/history.ts, src/content/history.test.ts, src/ui/sections/Glossary.tsx, src/ui/sections/Review.tsx.
- Acceptance: history.test.ts: every milestone has a source location; disagreements carry both values. browser: the milestones can be ordered; the review queue shows the four definitions.

#### structural-septal-occluder

**Septal occluder for ASD and PFO.** M, P3, wave 55. Lab: laao.

- Learner: Closes an ASD or PFO safely.
- Built: TOE or ICE at the start, defect crossing, balloon sizing that can overstretch, device choice with qualitative erosion risk, PFO size and residual shunt, LA disc, waist and RA disc, push-pull test, release only with both discs on their sides, and a day-one effusion variant.
- Requests: hb-additional-procedures#7.
- Depends on: structural-transseptal-hands-on.
- Files (5): src/simulation/septalOccluder.ts, src/simulation/septalOccluder.test.ts, src/ui/structural/SeptalOccluderLab.tsx, src/ui/sections/StructuralLab.tsx, src/content/lab/presets/structural/septalOccluder.launch.ts.
- Acceptance: Release with the LA disc on the RA side is critical; an oversized ASD device with a deficient aortic rim is wrong. A follow-up plan without endocarditis prophylaxis is incomplete. practiceIndex lists every scenario in src/content/lab/presets/structural/septalOccluder.launch.ts under lessons hb-additional-procedures-septal-closure (from src/content/lab/presets/structural/septalOccluder.launch.ts). Plus 1 more in the JSON.

#### pacing-endomyocardial-biopsy

**Endomyocardial biopsy mode on the pacing lab views.** M, P3, wave 55. Lab: pacing.

- Learner: Takes endomyocardial biopsies safely and recognises a perforation.
- Built: A bioptome through the right internal jugular across the tricuspid valve under LAO 60 and RAO 30, contact signalled by resistance and ectopics, a bite sequence with a sample counter, and a perforation event more likely when the jaws face the free wall or apex that develops into tamponade with hand-off to pericardiocentesis.
- Requests: hb-additional-procedures#3.
- Depends on: pacing-in-lab-scenarios-and-tips, pericardiocentesis-tips-and-pci-handover, pacing-overdrive-and-tcp.
- Files (6): src/simulation/biopsy.ts, src/simulation/biopsy.test.ts, src/ui/bedside/BiopsyLab.tsx, src/ui/bedside/PacingFluoro.tsx, src/ui/sections/BedsideLab.tsx, src/content/lab/presets/bedside/biopsy.launch.ts.
- Acceptance: Free-wall bites carry a higher perforation probability than septal bites over seeded runs. Four or five adequate samples without free-wall contact pass; tamponade not recognised within two minutes fails. practiceIndex lists every scenario in src/content/lab/presets/bedside/biopsy.launch.ts under lessons hb-additional-procedures-emb (from src/content/lab/presets/bedside/biopsy.launch.ts). Plus 1 more in the JSON.

#### structural-valvuloplasty-pathways

**Stand-alone balloon aortic valvuloplasty and percutaneous mitral commissurotomy.** L, P3, wave 56. Lab: tavi.

- Learner: Performs balloon aortic valvuloplasty and mitral commissurotomy.
- Built: The BAV pathway (exclusions and ceiling of care, sheath sizing with pre-closure above 8 F, venous pacing wire, ACT 250-300 s, crossing with crossing-time embolism risk, stiff wire at the apex, balloon against annulus, LVOT and STJ, rapid pacing) and the PMC pathway (TOE gate, selection, transseptal access with LA pressure, stepwise single-balloon inflations, stop on a tear).
- Requests: hb-additional-procedures#4, hb-additional-procedures#5.
- Depends on: structural-transseptal-hands-on, haemo-valve-and-myocardial-studies.
- Files (5): src/simulation/valvuloplasty.ts, src/simulation/valvuloplasty.test.ts, src/ui/structural/ValvuloplastyLab.tsx, src/ui/sections/StructuralLab.tsx, src/content/lab/presets/structural/valvuloplasty.launch.ts.
- Acceptance: A BAV balloon larger than the STJ is wrong; inflation without rapid pacing is critical. PMC with LA thrombus cannot pass the TOE gate; continuing after a tear in the calcified variant is wrong. practiceIndex lists every scenario in src/content/lab/presets/structural/valvuloplasty.launch.ts under lessons hb-additional-procedures-bav, hb-additional-procedures-pmc (from src/content/lab/presets/structural/valvuloplasty.launch.ts). Plus 1 more in the JSON.

#### content-links-backfill-p3

**Link lessons to the P3 scenarios.** S, P3, wave 57. Lab: all labs (lesson content).

- Learner: Opens, from the P3 lessons, their scenarios too.
- Built: A short second pass of content-links-backfill for the scenarios that the P3 packages add, so the link test can cover every lab request.
- Requests: none (enabling package).
- Depends on: content-links-backfill-p2, pci-complex-p3, proc-support-standby, proc-sterile-field, pci-bench-guide-extension, structural-septal-occluder, structural-valvuloplasty-pathways, pacing-endomyocardial-biopsy, diag-supervisor-mode.
- Files (50): src/content/manual/pci-manual/01-planning.ts, src/content/manual/pci-manual/02-monitoring.ts, src/content/manual/pci-manual/03-antithrombotics.ts, src/content/manual/pci-manual/04-lab-drugs.ts, src/content/manual/pci-manual/05-access.ts, src/content/manual/pci-manual/06-to-the-root.ts, src/content/manual/pci-manual/07-engaging.ts, src/content/manual/pci-manual/08-acquiring.ts, and 42 more.
- Acceptance: content.test.ts: every lessonId named by any lab request has at least one block whose scenario lists that lesson. validateLaunchLinks accepts every new param.

## 6. Schedule

The waves below never put two packages that edit the same file side by side, respect every dependency, and hold at most three packages, the machine's limit. P1 packages come first (one P2 package, xray-device-fluoro-views, fills a free slot in a P1 wave), then P2, then P3; within a priority they are ordered by phase and by how much later work each package unblocks. tip-retarget-catchup and the three content-links packages run alone, because they edit the lesson module files. The packages in a wave can run in parallel.

A wave is a planning unit, not a barrier: when a package finishes early, its slot may take the next package in the list whose dependencies are done and whose files do not overlap any package still running. This is safe only because the dependency lists are complete. The plan was checked by script before it was written out, and the same check must be re-run whenever a package is added or changed: (1) a package that lists a file in a glob-registry folder (section 2) depends on the package that creates that registry; (2) a package that lists a file that does not yet exist, and that another package also lists, depends on the package that creates it first; (3) a package whose design names a shared module (contrastBudget, hypotensionCauses, lesionYield, physicsDevices, PhysicsDevices, useLabHandoverStore, useContextTips, patientEvents, technique/steps, pwSession, radialSpasm, EventLog, useLabRun, giveDrug, practiceIndex, realism-baseline) depends on its creator; (4) no P1 package depends on a P2 or P3 package; (5) the graph has no cycle, every dependency lands in an earlier wave, no wave holds more than three packages and no two packages in a wave share a listed file; (6) every request is assigned and every P1 request has a P1 package. On this revision every check passes.

Sizes are counted in agent sessions, one session being one agent run in a fresh context that ends with the package, or one of its checkpoints, accepted or handed over: S is one session, M two, L three to four, XL five or more, and an XL package is split into checkpoints by its agent. At the midpoints (S 1, M 2, L 3.5, XL 6) the P1 packages add up to about 339 sessions and the whole plan to about 467. With three agents in parallel the P1 work needs at least 113 rounds of sessions; at two rounds a day that is about 8 weeks of uninterrupted work, and the serial chains, reviews and owner checkpoints make it longer.

| Wave | Packages that can run in parallel |
|---|---|
| 1 | found-tips-vocabulary, found-launch-links, found-case-model-types |
| 2 | realism-baseline, found-tip-retarget, found-lab-session-plumbing |
| 3 | found-handover-contract, found-patient-formulary, found-lab-controls-registry |
| 4 | found-mentor-registries, progression-labels, pci-engine-modularise |
| 5 | diag-tip-context, proc-foundation-scenarios-ledger, diag-engagement-fallback |
| 6 | pci-scenario-registry, pci-device-catalogue, proc-tip-context |
| 7 | pci-lab-shell-session, access-multi-site, haemo-study-session-and-tips |
| 8 | pci-lab-input, pci-tip-context, diag-scenario-registry |
| 9 | physiology-engine-unify-and-setup, mcs-console-split-select-and-tips, structural-tips-and-tavi-course |
| 10 | pericardiocentesis-tips-and-pci-handover, diag-rod-physics, proc-chart-planted-problems |
| 11 | xray-device-fluoro-views, pci-wire-microcatheter, diag-study-report |
| 12 | pci-bench-imaging-unify, diag-pressure-transducer, diag-lesion-morphologies |
| 13 | access-femoral-puncture, pci-guide-engagement, proc-anaphylaxis-vagal |
| 14 | access-femoral-upsizing-angiogram, proc-hypotension-pressors, pci-bench-measure-and-plan |
| 15 | access-route-decision, access-closure-femoral-manual, pacing-in-lab-scenarios-and-tips |
| 16 | access-radial-sequence, pci-indeflator, pci-intravascular-imaging |
| 17 | pci-cx-recognition, pci-device-delivery, proc-preprocedure-orders |
| 18 | access-closure-radial, pci-attending, pci-bench-stent-platforms-sizing |
| 19 | structural-transseptal-hands-on, pci-pressure-wire-console, diag-lab-drugs |
| 20 | pci-bench-bifurcation, pci-budgets-stop-rules, pci-antithrombotic-orders |
| 21 | haemo-rhc-manoeuvre, diag-anatomy-variants, proc-heparin-act-handover |
| 22 | haemo-aortic-stenosis-studies, pci-assessment-policy-qca, diag-lv-aorta-render |
| 23 | physiology-left-main-and-ostial, pci-equipment-tray, physiology-hyperaemia-and-adenosine |
| 24 | haemo-transducer-and-setup, pci-patient-coupling, pci-two-rail-engine |
| 25 | angio-expert-label-drills, diag-catheter-kink, diag-grafts-svg |
| 26 | angio-decision-drills, pci-flow-closure, pci-bifurcation-provisional |
| 27 | proc-recovery-ward, pci-calcium-uncrossable, pci-cto-planning-antegrade |
| 28 | diag-acs-scenarios, diag-route-wire-led-radial, proc-adhoc-gate |
| 29 | pci-acs-thrombus, access-cx-bleeding-retroperitoneal, proc-discharge-prescription |
| 30 | pci-bench-balloon-physics, pci-perforation, pci-bifurcation-two-stent |
| 31 | pci-left-main, pci-cto-retrograde, pci-shock-chain |
| 32 | pci-ostial, diag-engagement-technique-set, diag-spasm-states |
| 33 | access-cx-endovascular-control, diag-injection-run-quality, diag-lv-aorta-task |
| 34 | access-cx-forearm, diag-rhythm-haemodynamic-events, diag-grafts-arterial |
| 35 | pci-bench-isr-and-atherectomy, diag-iatrogenic-complications, physiology-post-pci-handover |
| 36 | structural-laao-device-mechanics, pci-adhoc-handover, pci-team-orders |
| 37 | physiology-anoca-cft, diag-pressure-recognition-drill, diag-qca-measurement |
| 38 | tip-retarget-catchup |
| 39 | content-links-backfill |
| 40 | access-closure-femoral-devices, diag-tavi-frame-engagement, haemo-valve-and-myocardial-studies |
| 41 | mcs-largebore-access-and-removal, access-sheath-choice, haemo-shunt-studies |
| 42 | mcs-impella-insertion-and-events, access-venous, structural-tavi-planning |
| 43 | pacing-overdrive-and-tcp, pci-equipment-loss, diag-route-arch-femoral-variants |
| 44 | diag-view-coverage-segments, pci-graft, diag-contrast-ceilings-oedema |
| 45 | proc-consent-conversation, diag-radiation-practice, access-distal-radial |
| 46 | proc-triage-queues, access-femoral-route-hazards, access-cx-groin-duplex |
| 47 | proc-handover-report-discharge, proc-sedation, pci-bench-reading-library |
| 48 | physiology-decision-and-subsets, haemo-cardiac-output-thermodilution, haemo-events-and-special-studies |
| 49 | mcs-iabp-insertion-and-troubleshooting, structural-tavi-procedure, structural-teer-steering-and-tricuspid |
| 50 | mcs-ecmo-cannulation-and-management, views-chamber-depth, debrief-reflection |
| 51 | progression-exams |
| 52 | content-links-backfill-p2 |
| 53 | pci-complex-p3, diag-supervisor-mode, proc-support-standby |
| 54 | proc-sterile-field, pci-bench-guide-extension, logbook-audit-gaps |
| 55 | structural-septal-occluder, pacing-endomyocardial-biopsy, glossary-history-timeline |
| 56 | structural-valvuloplasty-pathways |
| 57 | content-links-backfill-p3 |

Owner checkpoints. After wave 10 the phase 1 lab foundations are in: most labs show tips and open named scenarios, and the PCI lab runs on the full-screen layout with pedals, stored runs and the S8 input system; play it before the device work starts. After wave 26 the phase 2 core skills are in (the bench tips arrive in wave 12 and the pacing lab's in wave 15). After wave 39 every P1 package has landed, the deferred tips are retargeted, the lessons point at their scenarios and the full case runs end to end on one patient. At the checkpoints after waves 26 and 39 the owner does a timed, unassisted run of lad-focal and rca-calcified in independent mode; the run recorder reports the number of console opens and modal interruptions (pci-lab-shell-session logs them), and the owner records the counts, the times and a short realism rating in docs/curriculum/playtests.md. If a case plays as a sequence of panels rather than a procedure, the next PCI packages are re-planned before they start.

The files most packages touch, which set the length of the serial chains (lesson module files aside):

- src/simulation/session/caseSession.ts: 16 packages
- src/simulation/patient/engine.ts: 11 packages
- src/ui/access/UltrasoundView.tsx: 11 packages
- src/simulation/access/route.ts: 10 packages
- src/ui/sim/labSession.ts: 8 packages
- src/simulation/pci/actions/devices.ts: 8 packages
- src/simulation/access/site.ts: 8 packages
- src/render/xray/contrastTransport.ts: 7 packages
- src/state/useSimulatorStore.ts: 7 packages
- src/physics/lumen.ts: 7 packages
- src/ui/access/AccessFluoroView.tsx: 7 packages
- src/simulation/pci/state.ts: 6 packages

If one of these files is being edited, no other package that lists it may start. Agents should keep their edits to these files small and in their own functions so that later packages merge cleanly.

## 7. Requests declined

No request is declined outright: all 443 are assigned to a package. Six are declined in part.

| Request | Part declined | Reason | Where the rest is built |
|---|---|---|---|
| pm-target#5 | Pairing a 12-lead ECG with real CADICA runs of the same patient | The licensed CADICA and CoronaryDominance sets carry no ECG, presentation or culprit labels. Attaching a generated ECG to a real patient's angiogram would fabricate a clinical record on real data. | diag-acs-scenarios, on simulated cases, with the chronic-occlusion distractor and the no-visible-culprit work-up |
| pm-interpreting#11 | Running the culprit drill on library studies | The library has no culprit, old-film, ECG or wall-motion labels, so there is no reference answer. It can follow if an expert labels culprits through the label pipeline (angio-expert-label-drills). | diag-acs-scenarios: two candidate lesions and a previous study rendered from the same patient |
| cp-acs-thrombus#0 | Linking a matching CADICA run for each ECG pattern | No ECG or culprit territory exists for the real runs, so a matching run cannot be chosen from data. | diag-acs-scenarios |
| pm-target#1 | A generated clinical vignette (symptoms, ischaemic burden, previous CABG, surgical risk band) attached to real AngioCAD patients | The dataset has none of these fields. Generating them for a real patient's study would fabricate a clinical record on real data, the same reason pm-target#5 is declined in part. | angio-decision-drills: the decision step runs on simulated multi-vessel diagnostic cases with a full chart; on real studies the drill uses only the dataset's fields and asks which missing facts the learner would need |
| hb-after-the-procedure#0 | Scoring a hand-over note and operator's report written as free prose | A browser app without a language model cannot grade free text reliably or fairly. The request allows structured fields; a free-text box remains for the learner's own notes and is not scored. | proc-handover-report-discharge |
| hb-after-the-procedure#3 | A virtual patient who asks open-ended questions | Open conversation would need a language model and could produce clinical statements no source supports. The patient's questions and refusals are scripted branches written from the lesson. | proc-handover-report-discharge |

## 8. Risks

- Size. This is 159 packages, 112 of them P1, on a machine that manages three agents at a time. The P1 work is about 339 agent sessions (section 6), so expect many weeks. The checkpoints in section 6 let the owner stop, play and re-prioritise; the P2 and P3 phases should be re-planned after the P1 checkpoint rather than run on autopilot.
- Shared engines. PatientEngine, circulation.ts, transducer.ts and pharmacology.ts are used by every lab. A change for one lab can shift another (the heparin half-life fix alone changes ACT in all of them). Defaults stay normal, and the patient, team, lab and mentor tests run after each such change.
- Rod physics. The solver's frame budget in the lab is unproven on this machine under load, worker frames arrive one frame late, and 0.014 wire steering was never achieved (HANDOVER 6.3). The analytic fallback without difficulty scaling lands first (diag-engagement-fallback) and the PCI guide work builds on it, so the PCI critical path does not wait for the solver. Physics defaults on only if the median step cost is under 4 ms and the 95th centile under 8 ms in a scripted 60 s session at 1024 px; otherwise it stays off with a banner. The switch is a setting, and the coronary wire stays on its 1-D route model.
- Image realism is a separate track. This plan does not improve the scorecard failures HANDOVER 6.1 lists (left trees too narrow, cardiac motion wrong, a background that reads as procedural, a synthetic catheter course). It only stops new work making them worse: realism-baseline scores the code as it stands, with devices and the live lab paths, and every renderer package is compared with it. Raising the score needs its own plan.
- Realism without targets. The ventriculogram, IVUS and OCT artefacts, grafts, collaterals, the TAVI frame and device fluoroscopy, and the device and live-path rows that realism-baseline adds, have no real reference set in the scorecard. Each must be checked against licensed reference images or by the owner before it is called realistic.
- Model parameters presented as fact. Kink thresholds, delivery forces, lesion yield, hazard rates, spasm and haematoma growth have no sourced values. They must be labelled in the facts files and in the debrief wherever the learner might read them as data.
- Clinical correctness. Doses, thresholds, guideline classes and device limits come from the module text; where a module cites a guideline the plan has not verified (the 2025 ESC valve table, COAR 2022, SYNTAX weights, normal frame counts), the value stays out until the primary source has been read. Entrustment levels, kink behaviour, the TAVI frame and atherectomy complications need clinician review.
- Serial chains on hot files. caseSession.ts, engine.ts, UltrasoundView.tsx and route.ts are each edited by ten or more packages. The session modules, file splits and glob registries reduce this, but these chains set the pace of the full case and should be kept moving first when slots free up.
- Glob registries. import.meta.glob works in Vite, Vitest and vite-node but not in plain node. Scripts that touch content run with vite-node (scripts/README.md), and the runtime practice index globs the .launch.ts files the same way src/content/manual/index.ts globs the module files.
- Cross-lab cases. The shock chain needs the haemodynamics and MCS labs to accept a shared PatientEngine, which they do not today (HANDOVER 6.2, 6.5); the ad hoc hand-over needs the diagnostic lab and PCI lab to agree on pressure classes. Both are planned but are the most likely P1 packages to slip.
- Inline links lag the practice list. The practice index lists each scenario under its lessons and cases from the day its .launch.ts lands, but the existing inline sim and drill blocks in lessons keep their old targets until content-links-backfill (wave 39) for P1 scenarios and content-links-backfill-p2 (wave 52) for P2 ones. Until then a lesson's inline block may open a default scenario while its practice list opens the right one.
- Tips missing for a few waves. found-tip-retarget applies a narrowing gate when the lab raises its name by the end of phase 1, so tips gated on cto, bifurcation, calcified-lesion and the lesion types are missing from the PCI lab between wave 2 and pci-tip-context (wave 8), and the gated diagnostic tips until diag-tip-context (wave 5). The superset test keeps every caution and bailout tip in the complication contexts throughout; the other labs show no tips before their context packages anyway.
- Input outside the coronary labs. The full case and the dev labs keep their own keys in this plan, so the controls still change at the hand-over from access to the diagnostic lab. A later package should give them the same input bus (the full-case and dev-lab plans both asked for it as a cross-cutting item, not as a lab request).
- Team voices in the full case. The case workspaces have no team voices or audio (HANDOVER 6.3); orders, read-backs and the sterile-cockpit events work as text until LabTeam is wired into ProcedureLab, which belongs to a later team package.
- Expert labels for the real-run drills. angio-expert-label-drills needs a named supervising reader, chosen by the owner, to label at least 20 runs per drill in Reader mode before the TIMI, frame-count, morphology, collateral, Medina, calcium and segment drills on real runs appear. At a few minutes per run and attribute that is roughly one to two hours of the reader's time per drill (an estimate, not measured). Until then the simulated-run TIMI and frame-count drill covers pm-interpreting#1, and the other drills show 'not yet labelled'; pm-interpreting#5 and the other label-gated requests count as built only once labels exist.
- Exam integrity. Held-out scenarios are refused in lesson and case links, but held-out real patients still appear in lesson cine blocks (HANDOVER 6.4); progression-exams must not count drills on those patients.
- Copyright. The lesson content leans on a commercial handbook (HANDOVER 6.4). Packages quote numbers and rules with their source locations and write their own wording; no agent copies passages into the labs.

## 9. Review notes

A review of the first version (153 packages, 52 waves) found seventeen issues. Each was checked against the code before the plan was changed. All were accepted; five were adapted where the code or the priority rules required it, and the adaptations are stated below. The revision has 159 packages in 57 waves, and the last P1 package lands in wave 39.

- Lessons could not open scenarios until a P2 package in the last waves. Accepted. found-launch-links adds src/ui/content/practiceIndex.ts, which globs src/**/*.launch.ts at runtime and lists each scenario under its lessons and cases, excluding held-out ones; BlockRenderer and CaseStudies render the entries. Every package with a .launch.ts has an acceptance line naming the scenarios and lessons the index must list. Fifteen packages that described links without owning a scenario pack (for example start states such as guide-in-root on a core scenario, or real-angiogram drills) now add src/content/practice/<package-id>.launch.ts. content-links-backfill is P1, moved to phase 3, limited to converting the existing sim and drill blocks, and runs in wave 39. Adapted: a P1 package may not depend on P2 packages, so its P2 dependencies moved into a new content-links-backfill-p2.
- The early retarget hid existing bail-out tips. Accepted, and verified: today the covered-stent tips trigger on 'perforation' (complication-management/03-perforation.ts 1987-2009), and the PCI lab raises 'perforation' (src/ui/lab/pciTips.ts line 25). found-tip-retarget now applies only edits whose names a lab raises by the end of phase 1, or that touch labs which show no tips today (only the diagnostic and PCI labs call tipsFor), and carries the superset test on the lad-focal and rca-calcified complication contexts. Everything else is recorded as data in waiting.ts and applied by tip-retarget-catchup (wave 38, alone). Adapted: the retargets whose events only P2 packages raise (wire fracture, balloon entrapment, snares, filters, operator dose alarm) cannot sit in a P1 package that runs before their raisers, so content-links-backfill-p2 applies them. The deprecated 'pacing' and 'pericardiocentesis' aliases stay until the catchup, because the pacing tips move with it; the first version also removed them without listing src/content/lab/tips.ts.
- Tip integration was claimed but not tested, and raisable files contradicted the one-file rule. Accepted. Event sources, session modules and lab tip-context files export raises; reachability.test.ts globs those exports, and the eight hand-written raisable files are gone from the file lists. pci-tip-context no longer tells feature packages to edit waiting.ts. 129 packages gained a generated tip line naming a scenario, the event or phase that triggers each tip, and two tip ids taken from the package's own requests; six more have hand-written lines. Adapted: the critique asked for 'falls by at least N'. The counts are not knowable until found-tip-retarget writes waiting.ts, so N is defined as the number of waiting.ts entries that name the package, which waiting.ts records. proc-foundation-scenarios-ledger has no tips of its own; its check is that every ledger record's tip id resolves.
- No realism baseline. Accepted, and verified: HANDOVER 6.1 says seven files were edited after the last capture, and src/dev/xrayCapture.ts does not import pciDevices (only the segments demo does), so the first version's claim that xrayCapture imported them was wrong and is corrected. realism-baseline (phase 0, wave 2) scores the code as it stands with the existing compare_sets.py, adds device scenes and the two live lab paths, and every one of the 26 packages that lists a renderer file depends on it and must not lose more than 2 rows. Device and live-path rows are measurements outside the pass count until licensed reference runs exist, since no real band exists to judge them. Section 8 states that improving realism is a separate track.
- The dependency graph left out real build dependencies. Accepted. The listed dependencies were added. The check described in section 6 was run over the whole plan; it found one further candidate, found-patient-formulary naming patientEvents, which was rejected because the formulary only produces states that patientEvents later reads. Three further flags from a folder-based variant of the check are not missing dependencies either: diag-tip-context creates src/ui/sim/modules/index.ts itself, diag-engagement-fallback now creates src/ui/physics/types.ts, and access-route-decision mentions radialSpasm.ts only as the model access-radial-sequence, which depends on it, will feed. Splitting pci-lab-shell and adding the binding registry also added dependencies on pci-lab-input for every PCI package with a hand-operated console.
- Acceptance tests edited shared test files the packages did not list. Accepted. The assertions moved into new per-package test files: src/simulation/pci/scenarios/launch.test.ts, src/simulation/diagnosticScenarios/launch.test.ts, src/ui/pci/input.pci.test.ts, src/ui/pci/twoRail.input.test.ts, src/simulation/pci/guideWireAim.test.ts, src/ui/lab/pciEvents/recognition.test.ts and src/ui/lab/pciEvents/calcium.test.ts. The remaining references to existing tests (content.test.ts in found-tips-vocabulary, angioPci.test.ts, physiology.test.ts, team.test.ts, guide.test.ts in pci-device-catalogue) only run them unchanged. The overlap check passes.
- pci-guide-engagement depended on the XL rod-physics package. Accepted. diag-engagement-fallback (S, phase 1) holds the difficulty-free fallback and the PhysicsDevices interface; pci-guide-engagement depends on it and lands in wave 13, and diag-rod-physics carries the cost threshold for turning physics on by default. The interface uses a glob registry (src/ui/physics/impl/) so the PCI lab picks up the solver whenever it is registered, in either order.
- 'Physics off reproduces current results' kept the difficulty-scaled capture. Accepted, and verified against the THRESH table at src/simulation/engagement.ts 214-218. The wording now lives in diag-engagement-fallback, with the added check that beginner and advanced give the same classification for the same pose. pressure.test.ts, which calls computeEngagement at 'beginner', is listed so that it can be adjusted.
- The glob guard premise was wrong. Accepted, and verified: scripts/content/status.ts runs under vite-node and calls import.meta.glob on line 5, and src/content/manual/index.ts line 29 uses an eager glob. globGuard.test.ts and the test-only glob rule are dropped. src/vite-env.d.ts is not needed: src/render/xray/realism.test.ts carries the vite/client reference and tsconfig.app.json includes all of src, so import.meta.glob is already typed for the app program; it is dropped from the file list.
- The formulary lacked nitroprusside and the oral antiplatelets. Accepted. They are added with oral and crushed routes and onset curves as labelled model parameters; pci-flow-closure, proc-preprocedure-orders, pci-antithrombotic-orders and pci-acs-thrombus call giveDrug. Adapted: the ticagrelor test uses the lcx-stemi patient profile, because the formulary package runs before the PCI scenario registry.
- The decision drill attached generated vignettes to real patients. Accepted. The decision step runs on simulated multi-vessel diagnostic cases with a full chart; the real-library drill uses only dataset fields and asks which facts are missing. pm-target#1 is added to section 7 as a partial decline.
- The expert-label drills had no reader and no fallback. Accepted. The external dependency is stated in the package and in section 8, and a simulated-run TIMI and frame-count drill, whose answers come from the engine's flow model, opens from the same lesson blocks until labels exist.
- Supervised, independent and exam PCI could not load devices for many waves. Accepted. AssistedDeviceConsole serves every mode until pci-equipment-tray, and pci-lab-shell-session must complete each core scenario headlessly in guided and independent mode.
- pci-tip-context asserted behaviour that later packages supply. Accepted. Its tests inject snapshot flags (prebriefOpen, finishing, recognised); the end-to-end versions are in pci-attending and pci-cx-recognition.
- Sizes. Accepted. pci-lab-shell is split into pci-lab-shell-session (L) and pci-lab-input (M); found-lab-session-plumbing is L, pci-two-rail-engine XL and pci-adhoc-handover L; section 6 defines the sizes in agent sessions and gives the totals.
- The progression screens called the fellow independent throughout the build. Accepted. progression-labels (S, phase 0) fixes the label at src/progress/competency.ts line 78 and the gating. Adapted: the composite-score gating lives in src/progress/logbook.ts (PASS_SCORE and the attempt rows), not in competency.ts, so that file is listed too.
- Procedure feel. Accepted. Section 2 gains the hands-not-panels rule; 13 hand-operated consoles gain a binding file in src/ui/pci/inputBindings/ and a test that drives them with the console closed; the plan, time-out, recognition, sign-out and CTO planning forms are attending dialogue outside guided mode and exam; the session logs console opens and modal interruptions, and the owner checkpoints after waves 26 and 39 record a timed unassisted run in docs/curriculum/playtests.md.

The JSON now carries each package's wave, so the schedule can be checked from the JSON alone.
