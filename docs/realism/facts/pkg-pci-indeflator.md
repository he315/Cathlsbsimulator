# pci-indeflator: model parameters

The indeflator (`src/simulation/pci/indeflator.ts`) now records the hold and the time at the rated burst pressure and has a plunger lock; the lesion's yield is one shared model (`src/simulation/pci/lesionYield.ts`); the inflation actions (`src/simulation/pci/actions/inflation.ts`) add the outcomes of an inflation. Clinical numbers are taken from the module text (pm-prep-and-stent, lesson "Balloon angioplasty II: inflate, deflate, withdraw and check", which cites Brilakis 9.7 to 9.9, 23.1, 23.2, 30.9 and Oxford ch 8) or from the device catalogue's cited labels (`src/simulation/pci/equipment.ts`). Everything else is a model parameter. Values marked "earlier value" were already in the engine and keep their old behaviour.

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_HOLD_BAND_ATM` | src/simulation/pci/indeflator.ts | 0.1 | atm | Choice: the pressure counts as holding its target within this band, and as at the rated burst pressure from this far below it (dial rounding) |
| `MP_HOLD_RESTART_ATM` | src/simulation/pci/indeflator.ts | 0.5 | atm | Choice: a new screw target this far above the pressure now starts a new hold |
| `INDEFLATOR_MAX_ATM` | src/simulation/pci/indeflator.ts | 30 | atm | The plan's dial range (lab-build-plan.json, pci-indeflator design: "needle dial 0-30 atm"); the screw already clamped to 30 |
| `MP_YIELD_ONSET_ATM` | src/simulation/pci/lesionYield.ts | 6 | atm | Earlier value (the engine's yield formula in actions/inflation.ts) |
| `MP_YIELD_SPAN_ATM` | src/simulation/pci/lesionYield.ts | 20 | atm | Earlier value |
| `MP_HOLD_GAIN` | src/simulation/pci/lesionYield.ts | 0.15 | fraction of the remaining resistance | Choice: a long hold overcomes a little more of the lesion. The module gives the clinical step (prolonged inflations of 30-60 s or more as the first step for an undilatable lesion), not its size |
| `MP_HOLD_FULL_S` | src/simulation/pci/lesionYield.ts | 30 | s | The start of the module's 30-60 s prolonged inflation (pm-prep-and-stent, "First step of the undilatable algorithm"); the gain is linear up to it |
| `MP_HOLD_CALCIUM_DAMP` | src/simulation/pci/lesionYield.ts | 0.25 | share of the hold gain per calcium grade | Choice: heavy calcium does not creep, so a hold helps it less |
| `MP_WAIST_RATIO` | src/simulation/pci/lesionYield.ts | 0.85 | fraction of the chart diameter | Earlier value (the engine's waist criterion; base.ts's `STENT_UNDEREXPANDED_RATIO` mirrors it) |
| `MP_UNDILATABLE_HOLD_S` | src/simulation/pci/actions/inflation.ts | 10 | s | The module's usual non-compliant hold is 10-20 s (pm-prep-and-stent, "Step 9: inflating the balloon", Brilakis 9.7.9); the plan's rule names a hold of 10 s or more |
| `MP_REAPPLY_HOLD_S` | src/simulation/pci/actions/inflation.ts | 5 | s | Choice: a repeat inflation to the same pressure held this long works on the lesion again (and draws its complications again) |
| `MP_STENT_EXPANSION_RATIO` | src/simulation/pci/actions/inflation.ts | 0.8 | stent diameter at the lesion / expanded diameter | The plan's "expansion ratio below 0.8, model parameter, until imaging measures it"; the bench uses 80% (SIM_FACTS §12) |
| `MP_PULL_GRIP_MIN` | src/simulation/pci/actions/inflation.ts | 0.3 | 0..1 | Choice: a balloon that has not emptied still grips the lesion with its open wings |
| `MP_PULL_GRIP_FULL_FILL` | src/simulation/pci/actions/inflation.ts | 0.25 | fill fraction | Choice: the grip of a balloon pulled before it has emptied rises linearly from `MP_PULL_GRIP_MIN` to full at this fill (the same value as the indeflator's occlusion threshold, `MP_OCCLUDE_FILL`) |
| `MP_PULL_GUIDE_DRAW` | src/simulation/pci/actions/inflation.ts | 0.8 | fraction of the pull | Choice: how much of a pull on a gripping balloon drags the guide in. The mechanism is the module's (Step 11: a forceful pull before full deflation drags the guide tip into the coronary) |
| `MP_PULL_COAX_LOSS_PER_MM` | src/simulation/pci/actions/inflation.ts | 0.05 | coaxiality per mm | Choice |
| `MP_GUIDE_MAX_DEPTH_MM` | src/simulation/pci/actions/inflation.ts | 8 | mm | Mirrors the guide engine's seating limit (`seatGuide` in src/simulation/pci/guide.ts clamps depth to 8 mm) |
| `MP_CUTTING_FAST_RATIO_BUMP` | src/simulation/pci/actions/inflation.ts | 0.1 | added to the device-to-vessel ratio of the dissection draw | Choice: a cutting balloon inflated faster than its label scores the wall more. The rule itself (about 1 atm every 5 s, not above 12 atm) is the catalogue's cited label (`maxInflateAtmPerS` 0.2, `rbpAtm` 12; module pm-prep-and-stent, step 9 table) |
| `MP_OSTIAL_RECOIL_P` | src/simulation/pci/actions/inflation.ts | 0.35 | probability per deployment | Choice. Recoil at aorto-ostial lesions is the module's (cp-ostial-troubleshoot, Brilakis 15.1.10: "the stent lacks the radial strength to hold the lesion open") |
| `MP_RECOIL_REPEAT` | src/simulation/pci/actions/inflation.ts | 0.5 | share of the recoil chance after a post-dilatation | Choice (the module: post-dilate again and wait; it may recoil again) |
| `MP_OSTIAL_RECOIL_FRAC` | src/simulation/pci/actions/inflation.ts | 0.15 | share of the stent diameter at the lesion | Choice |
| `MP_FLOW_LIMITING` | src/simulation/pci/actions/inflation.ts | 0.35 | dissection.ts flowLimit | Choice: NHLBI type D or worse counts as a flow-limiting dissection for the stent-or-not state |
| `SMALL_VESSEL_MM` | src/simulation/pci/actions/inflation.ts | 2.5 | mm, reference lumen | The module's small-vessel class (cp-other-complex-vessel-size, Brilakis), the value the bench uses (`SMALL_VESSEL_MM` in src/ui/lab/benchTips.ts). Kept as the class; the stent-or-not state does not use it |
| `MP_VERY_SMALL_DISTAL_MM` | src/simulation/pci/actions/inflation.ts | 2.0 | mm, distal reference lumen | Choice: the lab request's 'very small distal vessel' (pm-prep-and-stent#6), narrower than the small-vessel class. lad-focal's distal reference (about 2.16 mm) is above it, so the drill's 'good' outcome can occur there; the LAD lesion moved distally (position 0.65, about 1.45 mm) is below it |
| `MP_DISTAL_REF_MM` | src/simulation/pci/actions/inflation.ts | 5 | mm beyond the distal shoulder | Choice: where the distal reference is read |
| `MP_MELON_SHORT_MM` | src/simulation/pci/actions/inflation.ts | 12 | mm | Choice. The risk factors are the module's (pm-prep-and-stent, "Watermelon seeding": a severe or sharply angulated lesion, a short balloon, inflating too fast) |
| `MP_MELON_ANGLE_DEG` | src/simulation/pci/actions/inflation.ts | 45 | deg of turning across the lesion | Choice: this much bend doubles the melon-seed risk in `melonSeedRisk` |
| `MP_MELON_BASE` | src/simulation/pci/actions/inflation.ts | 0.3 | probability per atm/s above `MP_MELON_RISE_ATM_S` (plus 1) | Earlier value (step.ts's melon-seed draw, `0.3 * (rise - MP_MELON_RISE_ATM_S + 1)`) |
| `MP_MELON_RISK_MAX` | src/simulation/pci/actions/inflation.ts | 0.95 | probability | Choice: cap of `melonSeedRisk` (step.ts caps its rate-only draw at 0.85) |
| `MP_MELON_SHORT_FACTOR_MIN`, `MP_MELON_SHORT_FACTOR_MAX` | src/simulation/pci/actions/inflation.ts | 0.5, 1.5 | multiplier | Choice: clamp on the short-balloon factor `MP_MELON_SHORT_MM / length` |
| `PREDIL_OUTCOME_WEIGHTS` | src/simulation/pci/actions/inflation.ts | good 0.4, slow flow 0.2, dissection 0.2, waist 0.2 | relative weights | Choice: the stent-or-not drill's seeded outcomes (the outcome list is the lab request's, pm-prep-and-stent#6). A very small distal vessel comes only from the anatomy |
| `MP_DRILL_WAIST_RESISTANCE` | src/simulation/pci/actions/inflation.ts | 0.9 | resistance 0..1 | Choice: a lesion drawn to keep a waist is made fibrocalcific before the drill's predilatation |
| `MP_PREDIL_SIZE_RATIO` | src/simulation/pci/actions/inflation.ts | 0.85 | balloon / reference | Choice for the drill's team predilatation (the module sizes balloons 1:1 or less to the vessel) |
| `MP_PREDIL_ATM` | src/simulation/pci/actions/inflation.ts | 12 | atm | Within the module's 12-14 atm for a compliant balloon (step 9 table) |
| `MP_PREDIL_LENGTH_MARGIN_MM` | src/simulation/pci/actions/inflation.ts | 2 | mm | Choice: the drill's predilatation balloon is the shortest catalogue length at least the lesion's span plus this |
| `MP_PREDIL_NOREFLOW_SEV_MIN`, `MP_PREDIL_NOREFLOW_SEV_SPAN` | src/simulation/pci/actions/inflation.ts | 0.3, 0.25 | no-reflow severity 0..1 (MIN + SPAN x uniform draw) | Choice: the drill's imposed slow flow (TIMI from noReflow.ts `timiFor`) |
| `MP_PREDIL_DISSECTION_SEV_MIN`, `MP_PREDIL_DISSECTION_SEV_SPAN` | src/simulation/pci/actions/inflation.ts | 0.85, 0.1 | dissection severity 0..1 (MIN + SPAN x uniform draw) | Choice: the drill's imposed flow-limiting dissection (NHLBI type D) |
| `MP_PREDIL_DISSECTION_EXTRA_MM`, `MP_PREDIL_DISSECTION_MIN_LEN_MM` | src/simulation/pci/actions/inflation.ts | 4, 6 | mm | Choice: the imposed dissection's length is the lesion's span plus 4 mm, at least 6 mm |
| `INFLATION_EVENT_HOLD_S` | src/ui/lab/pciEvents/inflation.ts | 30 | s | Choice: a recorded undilatable inflation or a rupture stays raised for the tips this long after it |
| `DEFAULT_SCREW_RATE` | src/ui/pci/inputBindings/indeflator.ts | 3 | atm/s | About 12 atm in 3-5 s, the module's speed of inflation for standard balloons (step 9 table) |
| `SCREW_RATES` | src/ui/pci/inputBindings/indeflator.ts | 0.2, 0.5, 1, 2, 3, 4, 6 | atm/s | Choice of console settings, from the cutting balloon's 1 atm per 5 s to a fast turn |
| `INDEFLATOR_PULL_ON` | src/ui/pci/inputBindings/indeflator.ts | 0.08 | pull 0..1 | The input target's `PCI_PLUNGER_ON` |
| `PX_PER_ATM` | src/ui/pci/consoles/IndeflatorConsole.tsx | 8 | screen px of drag per atm | Choice (UI): the on-screen screw's drag scale |

Not model parameters, but behaviour a reviewer may want to see:

- An instant inflation (`inflate`, hold 0) gives exactly the engine's earlier yield; only a timed inflation with a hold differs.
- The lock holds the plunger: while locked the screw does not turn and the plunger cannot be pulled back. Locking freezes the screw's target at the pressure then, so a pressure still rising stops where it is. A rupture empties the balloon and releases the lock.
- The cutting-balloon rule is counted once per inflation (one 'cutting-balloon-rule' record after each 'inflate-start'); later screw ticks of the same inflation only update that record. An inflation starts when the balloon is empty and the screw was not already turned in.
- A guide dissection drawn by a pull before deflation carries its own cause ("guide drawn into the artery by a balloon pulled before it had emptied") and a cue that names no complication ("The guide tip sits deeper in the ostium."); the dissection shows on the next injection.
- Deflation keeps the earlier model (`MP_DEFLATE_OF_SPEC` 0.55, exponential emptying): a 3.0 mm non-compliant balloon (label 15 s) empties in about 12.7 s (stepped at 0.25 s), within its label.
