# pci-attending: model parameters

The attending in the PCI lab (MentorEngine through the PCI bridge, the pre-brief and plan, the team time-out, the sign-out and the PEARLS debrief). The thresholds, times and chances below have no literature source. The sourced content the package uses is cited where it is written: the fourteen steps (pm-planning-steps, src/content/manual/pci-manual/01-planning.ts:57-73), the location tree and the risk factors for the forecast (cm-principles-closure-forecast, src/content/manual/complication-management/01-principles-closure.ts:84, 160-169), the support plan (Brilakis 14.1.2, same file:126-137), the time-out and sign-out items (Oxford, pm-monitoring-checklist, src/content/manual/pci-manual/02-monitoring.ts:800-812), the guide size for V-stenting and simultaneous kissing stents (01-planning.ts:254 and 349; tip pci-planning-guide-size, 01-planning.ts:1661), the contrast ceilings (src/simulation/patient/contrastBudget.ts, Brilakis 2.6 and 1.1, Oxford ch 4), the ACT gate (actGate, src/simulation/pci/lesionAssessment.ts) and the classification of a procedure-related infarction (mills-5udmi-2026 as cm-principles-closure-pmi teaches it, 01-principles-closure.ts:1115-1119).

## The bridge (src/mentor/bridge/pciSession.ts, `PCI_BRIDGE_PARAMS`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `guideExitZoneMm` | 10 | mm | Choice: a device whose distal end is within 10 mm of the guide tip (or beyond it) with its proximal end still inside the guide is leaving the guide; the tip pci-delivery-marker-then-screen (push blind only to the shaft marker, then screen it to the guide tip) gives the rule, not the distance. The assisted load leaves the device 2 mm inside the tip (actions/devices.ts loadDevice), so it is in the zone at once |
| `deviceMovingMm` | 0.05 | mm per attending frame | Choice: above rounding; a device that moved more than this between frames is moving |
| `beyondWireMarginMm` | 6 | mm | Not a new value: the engine's own beyond-wire margin (actions/devices.ts, `beyondWire: target >= st.tipMm - 6`, and moveDevice's limit) |
| `backoutWindowS` | 5 | procedure s | Choice: a guide back-out logged by the engine counts as 'recent' for this long (the guide-backout-ignored rule). Only the engine's push-induced 'guide-backout' counts: a guide disengaged on purpose with a device in the coronary (an aorto-ostial stent positioned with the guide backed off, complex-pci/01-ostial.ts) does not |
| `pullWindowS` | 3 | procedure s | Choice: a 'pull-before-deflation' logged by the engine counts as recent for this long (withdraw-before-deflate) |
| `inflatedFill` | 0.05 | fraction of the balloon's fill | Not a new value: the level below which the engine treats a balloon as empty (moveDevice, removeDevice) |
| `eventOrderS` | 0.0001 | s | Choice: recorder events taken from the engine's log in one frame are stamped this far apart, so their order (a move before an injection) is kept for the metrics |

## The rules (src/mentor/rules/pci.ts)

| Rule | persistS | cooldownS | Severity | Rests on |
|---|---|---|---|---|
| unscreened-device-advance | 0.2 | 8 | safety | Choice of times; the stop itself is the rule of pci-delivery-marker-then-screen |
| act-not-checked | 0.5 | 20 | technique (supervised practice only: `actRequired`) | Choice of times; the stop is pci-act-before-coronary-devices with the engine's actGate |
| withdraw-before-deflate | 0 | 10 | safety | Choice of times; the stop is pci-balloon-withdraw-deflated |
| guide-backout-ignored | 0.3 | 12 | technique | Choice of times; the stop is pci-mon-guide-backout |
| contrast-ceiling | 0.5 | 60 | technique | Choice of times; the warning level and the ceiling are contrastBudget.ts's (warnFraction 0.8, a MODEL PARAMETER of found-patient-formulary) |
| pci-stuck | 0 | 60 | technique | Choice of times. `PCI_STUCK_NO_PROGRESS_S` = 120 s without progress (Choice: longer than the diagnostic lab's 60 s time-out, because stent positioning and lesion preparation run for minutes with few logged steps). The PCI attending's engine leaves out the diagnostic 'time-out' rule (rules/diagnostic.ts), whose lines are about catheters and the root; a form being filled in counts as progress |

## The attending (src/ui/pci/usePciAttending.ts, `PCI_ATTENDING_PARAMS`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `stepHz` | 10 | Hz | Choice: the attending steps and the recorder samples at the recorder's 10 Hz (src/mentor/telemetry.ts) |
| `absentChance` | 0.5 | probability per case | Choice: how often a team member is out of the room when the time-out is due (pm-monitoring#4 asks for one such member; the draw is seeded by the case and its seed) |
| `arrivalS` | 20 | lab s after the time-out opens | Choice: when the absent member comes back |
| `damagedWireChance` | 0.25 | probability per case | Choice: how often a case is the wire-integrity variant (a wire without its tip coil); seeded by the case and its seed |
| `troponinRiseAfterComplication` | 0.85 | probability | Choice: the simulated troponin course after a case in which the engine produced a lost branch, a dissection, slow or no flow, or thrombus |
| `troponinRiseUncomplicated` | 0.3 | probability | Choice: after an uncomplicated case |
| `clinicalFeature` | 0.6 | probability given a rise | Choice: symptoms, new ischaemic ECG change, new Q waves or unexplained deterioration |
| `wallMotionResidual` | 0.7 | probability | Choice: a new regional wall-motion abnormality on echo after a complication left untreated or with a residual finding |
| `wallMotionResolved` | 0.25 | probability | Choice: after a complication treated and resolved |

The simulated result shows no troponin values or multiples: it says whether troponin rose above the sex-specific 99th centile and the baseline and whether it was still rising at 6 hours, as the module text describes the course (01-principles-closure.ts:1116-1117); the multiples are a pointer to imaging, not a threshold.

## Choices a reviewer may want to see

- Guide size the plan needs (`guideFrenchNeeded`, src/mentor/prebrief.ts): 7 Fr when the stent strategy is V-stenting or simultaneous kissing stents (option 'v-or-sks'; 01-planning.ts:254 and 349: most techniques fit a 6 Fr guide, these two need at least 7 Fr), 6 Fr for any other two-stent plan. For a planned atherectomy the module text asks for 'a size that fits atherectomy' (01-planning.ts:349), which depends on the burr: 7 Fr for a planned atherectomy is a MODEL PARAMETER (value 7, unit French, Choice).
- The expected forecast (`expectedForecast`): thrombus gives embolisation and thrombosis; severe calcium gives dissection and entrapment (the request's example for the calcified mid-RCA); a CTO gives aorto-coronary dissection and perforation; a bifurcation gives side-branch occlusion; severe tortuosity gives pseudolesion and spasm; dissection is always listed. A forecast counts as named when it names two or three complications and one of the first two expected.
- The expected support plan (`expectedSupport`): high risk is an unprotected left main, severe calcium, a large thrombus, a CTO, or a bifurcation in a severely tortuous vessel; abnormal haemodynamics are a scenario event 'shock' or 'cardiogenic-shock' (none of the current scenarios has one).
- The first move per complication (`FIRST_MOVE_FOR`, src/content/mentor/prebriefs.ts) is taken from the tips and lesson lines cited beside it.
- deployWithoutPositioningRun (src/mentor/metrics.ts) now counts a deployment with no injection between the last device move and the deployment, which is the engine's own test (st.injectedSinceDeviceMove) and the attending's; before, a positioning run had to start after the move.
- The sign-out lists only the complications the learner has recognised (pci-cx-recognition), under the learner's own answer; in guided practice the others show as an unnamed count. The classification is asked from the recognised kinds while the case is live. The simulated result itself comes from the engine's complications.
- The CTO stopping rules reached (`stopReached`, src/ui/pci/usePciAttending.ts): air kerma from the dose totals (mGy to Gy), contrast pushed divided by the creatinine clearance (profile.renal.crclMlMin), and the case's wall-clock minutes, each against the plan's own limit; the first one passed is named in the debrief.
