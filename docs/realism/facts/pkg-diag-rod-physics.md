# diag-rod-physics: model parameters

The rod (device physics) implementation for the diagnostic lab (`src/ui/physics/physicsDevices.ts`, registered by `src/ui/physics/impl/rod.ts`), its bridge to the engagement vocabulary (`src/physics/legacyBridge.ts`), the tip input to the transducer chain (`src/simulation/patient/transducer.ts`) and the drawing of the moving catheter (`src/ui/sim/FluoroView.tsx`). The package added no dose, threshold or device dimension from the clinical sources. The values below are performance thresholds for this machine, settings of the crew's technique, and couplings fitted so the rod reproduces the analytic model's trace classes.

## Performance rule (physicsDevices.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `COST_RULE` | src/ui/physics/physicsDevices.ts | median 4, 95th centile 8, over a 60 s session at 1024 px | ms per lab frame; s; px | Thresholds for this machine set in lab-build-plan (diag-rod-physics), not sourced values: the rod is on by default only below both |
| `MEASURED_COST` | src/ui/physics/physicsDevices.ts | median 1.6, 95th centile 3.8, 3601 frames, at 988 px | ms; frames; px | A measurement (8 October 2026, the development machine, worker mode, the JL4 then JR4 scripts), not a parameter. At 988 px it is below the rule's 1024 px, so `ROD_DEFAULT_ON` is false |
| `SOLVER_BUDGET_MS` | src/ui/physics/physicsDevices.ts | `COST_RULE.medianMs` x 4 = 16 | ms per 1/15 s of patient time | Derived: the median step at 60 frames/s, four frames per 1/15 s |
| `OVER_BUDGET_FALLBACK_S` | src/ui/physics/physicsDevices.ts | 10 | s | The plan's rule: seconds over budget before the lab falls back to the simple model |
| `OVER_BUDGET_GRACE_S` | src/ui/physics/physicsDevices.ts | 15 | s of patient time | MODEL PARAMETER and a deviation from the plan: the over-budget flag is not counted while the worker warms up and catches up after the init bench |

## Start state and the exchange (physicsDevices.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `START_TIP_BACK_MM` | src/ui/physics/physicsDevices.ts | 70 | mm back from the top of the root along the route | Model choice: where the catheter starts, over the J wire |
| `START_WIRE_LEAD_MM` | src/ui/physics/physicsDevices.ts | 30 | mm | Model choice: the J wire's lead beyond the catheter tip at the start |
| `EXCHANGE` | src/ui/physics/physicsDevices.ts | clearMm 45, clearMaxMm 90, wireLeadMm 20, pullMm 150, outS 3, finalLeadMm 20, pullMmS 40, wireMmS 50, stepMaxS 8 | mm; s; mm/s; s | MODEL PARAMETERS of the crew's technique for the exchange over the wire, not sourced values (wireMmS raised from 25 to 50 at review) |
| `REINSERT_WIRE_INSIDE_MM` | src/ui/physics/physicsDevices.ts | 120 | mm inside the catheter tip | Model choice: a wire pushed in again after withdrawal is fed through the hub to this point |
| `SHEATH_HUB_MM` | src/ui/physics/physicsDevices.ts | 25 | mm outside the skin | The solver's own sheath exit (src/physics/engine.ts sheathExit), copied |

## Reading the rod (physicsDevices.ts, legacyBridge.ts, transducer.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `PUSHING_HOLD_S` | src/ui/physics/physicsDevices.ts | 0.3 | s | Model choice: the hub load counts as forward pressure only while the hand pushes and this long after, so a held catheter resting against the wall is not counted as forcing |
| `PROLAPSE_WINDOW_S`, `PROLAPSE_REPEAT`, `PROLAPSE_MIN_S` | src/ui/physics/physicsDevices.ts | 60, 2, 0.5 | s; prolapses; s | Model choice: two prolapses within 60 s raise 'engage-fail'; a prolapse counts when the catheter stays folded 0.5 s (so the classifier's flicker is not counted) |
| `MP_CONUS_LATCH_S`, `MP_CONUS_RELEASE_DEPTH_MM` | src/ui/physics/physicsDevices.ts | 0.3, -1.5 | s; mm | MODEL PARAMETERS: with the heart moving the classifier finds a tip in the conus for only part of the beat, so the lab latches it after 0.3 s in all and releases it after more than one RR interval out with the depth short of -1.5 mm |
| `MP_CORONARY_RESEND` | src/ui/physics/physicsDevices.ts | 0.02 | share of the contraction or breathing range | MODEL PARAMETER: about one sixtieth of the range, below what the image shows; the lumens are re-sent to the solver only beyond it |
| `MIN_RADIUS_MM` with the conus always kept | src/ui/physics/physicsDevices.ts | 0.6 | mm at the vessel origin | Model choice: thinner vessels are left out of the physics (coronaryLumens.ts default), except the conus, which has its own ostium and lodges a right catheter whatever its calibre |
| `IN_VESSEL_MM` | src/physics/legacyBridge.ts | 0.5 | mm beyond the ostium | MODEL PARAMETER: a tip resting on the ostial rim (the classifier's funnel, depth -0.5 to 0) is still 'near' |
| `DEEP_MM` | src/physics/legacyBridge.ts | 6.5 | mm | A copy of the classifier's deep threshold (engagementClassifier.ts `DEEP_MM`); the two must agree |
| `MP_CONUS_GAP_MIN` | src/simulation/patient/transducer.ts | 0.09 | open fraction of the lumen | MODEL PARAMETER: the conus is narrower than a 6 Fr catheter, so the tip lodges in the branch mouth; the leak is the conus gap tipFromEngagement has always used, read as a damped trace |
| `MP_WALL_CONTACT_PER_N` | src/simulation/patient/transducer.ts | 2 | wall contact (model units) per N | MODEL PARAMETER, fitted: 0.3 N, a firm deep seat in the rod model, gives the 0.6 that tipFromEngagement uses for a deep seat |
| `MP_DEEP_RCA_RUNOFF` | src/simulation/patient/transducer.ts | 0.5 | runoff (TipInput.runoff) | MODEL PARAMETER: the value tipFromEngagement's deep right seat has always used, now named and shared with tipFromPhysics |

`MOVING_MM` (0.3 mm of tip travel between read-outs) was removed by diag-catheter-kink: the catheter now counts as moving when the hand pushed, pulled or turned it since the last read-out (physicsDevices.ts), because with the heart moving the tip travels more than that while the hub is held still.

## Drawing (FluoroView.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Root-coupling window | src/ui/sim/FluoroView.tsx | the tip within the sinus radius plus 10 mm, and less than 30 mm above the sinus top | mm | MODEL PARAMETER: the drawn catheter moves with the root (by arclength from the tip) only while its tip is in the root |
