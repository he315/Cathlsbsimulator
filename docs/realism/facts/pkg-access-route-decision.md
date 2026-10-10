# access-route-decision: model parameters

The route decision (`src/simulation/access/siteChoice.ts`), the session module `route-plan` (`src/simulation/session/modules/routePlan.ts`) and the route scenarios (`src/simulation/session/scenarios/routes.ts`). Sourced values carry their module-text location in the code: the five steps, the step-1 exclusions, the French ranges by procedure, the 10, 25 and 45 cm femoral lengths, Brilakis Table 30.2's outer diameters, 1 Fr = 0.33 mm and the 90-day closure-device window (pm-access-site-choice); the peripheral exclusions (hb-background-peripheral); the spasm factors, prevention, verapamil 2.5 mg and nitroglycerin 100-200 mcg, the very small radial switched to ulnar or femoral, and the 24 cm long radial sheath (pm-engaging-spasm). Everything below is a MODEL PARAMETER: a setting chosen where the text names a condition without a number, or a scenario choice.

## Route decision (siteChoice.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_SITE_CHOICE.sheathToArteryMax` | siteChoice.ts | 1.2 | ratio of sheath outer diameter to radial diameter | The text says 'a sheath large for the artery invites spasm and occlusion' without a number. Set so that a standard 6 Fr sheath (2.62 mm) fits every radial of at least about 2.2 mm (`smallRadialMm`), as 'radial sheaths are generally 5 or 6 Fr' implies for the usual radial; only a small radial fails it. Used for scoring and for the very small radial |
| `VERY_SMALL_RADIAL_MM` | siteChoice.ts | 1.78 (derived) | mm | Thin-walled 5 Fr outer diameter (2.14 mm, Brilakis Table 30.2) divided by the fit rule: no sheath the lab stocks fits a smaller radial |
| Wrist sheath sizes | siteChoice.ts `WRIST_FR`, `frsFor` | 5 to 8 | Fr | 5 Fr is the smallest wrist sheath the lab stocks (closure.ts SHEATHS); 4 Fr is offered only in the groin (Oxford's 4 Fr femoral diagnostic study) |
| `MP_SITE_CHOICE.smallRadialMm` | siteChoice.ts | 2.2 | mm | 'Small radial artery' as a spasm factor; below the generator's female mean (2.35 mm, patient.ts) |
| `MP_SITE_CHOICE.anxiousFrom` | siteChoice.ts | 0.6 | profile anxiety, 0..1 | 'Anxiety' as a spasm factor |
| `MP_SITE_CHOICE.renalFailureEgfr` | siteChoice.ts | 30 | mL/min/1.73 m2 | 'Renal failure' among Brilakis's high-bleeding-risk factors (no number given) |
| `MP_SITE_CHOICE.bmiLow`, `bmiMorbid` | siteChoice.ts | 18.5, 40 | kg/m2 | 'A body mass index at either extreme' and 'morbid obesity' (no numbers given) |
| Outer diameters at 4 and 8 Fr | siteChoice.ts `sheathOdMm` | table 5 Fr minus 0.33, table 7 Fr plus 0.33 | mm | Extrapolation of Table 30.2 by 1 Fr = 0.33 mm (both sourced; the extrapolation is the model) |
| Short wrist sheath length | siteChoice.ts `WRIST_LENGTHS_CM[0]` | 10 | cm | The session's default sheath length; the text gives no length for a standard radial sheath |
| Wrist French ranges | siteChoice.ts `FR_RANGE.wrist` | diagnostic 5-6, PCI 5-8, complex 7-8 | Fr | Brilakis's ranges by procedure applied to the wrist, with the fit rule deciding 7-8 Fr ('can often go into a larger radial') |
| Weak femoral pulse excludes that groin | siteChoice.ts `excludedSites` | rule | n/a | 'If one is weaker, suspect an occlusion above it' read as an exclusion at step 1 |
| Arteria lusoria excludes the right arm | siteChoice.ts `excludedSites` | rule | n/a | 'Favours the left radial or a femoral route'; femoral is accepted at the default step |
| `MP_SHEATH_SPASM.drivePerS` | siteChoice.ts | 0.01 | spasm (0..1) per s per unit of outer diameter above the artery's | 'Sheath or catheter large for the artery' as a spasm cause; added only while the wire is in the arm, the condition under which the session's slow step relaxes spasm, so the level settles instead of building with the wire out |
| Spasm plan requirement | siteChoice.ts `scoreSpasm` | sedation, local and one vasodilator for every wrist site | n/a | Brilakis's prevention list, applied to every radial plan |
| Spasm plan ticks have no effect of their own | routePlan.ts header | rule | n/a | Deviation from the design's 'skipped items raise the spasm inputs': a skipped item already raises spasm through the session's existing inputs (no sedation, no local, no vasodilator), so only the orders given count; the plan section says each is given from the orders panel |
| Fallback rule | siteChoice.ts `fallbackSites` | steps 2 and 4: a site the step prefers or accepts; steps 1, 3 and 5: any other usable site | n/a | Steps 2 and 4 rule sites out (a LIMA rules out the right arm, complex PCI needs a femoral access); steps 3 and 5 only prefer the radial |

## Session module (routePlan.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_ROUTE_PLAN.palpateS` | routePlan.ts | 5 | s per pulse | Session setting |
| `MP_ROUTE_PLAN.inspectS` | routePlan.ts | 15 | s | Session setting |
| `MP_ROUTE_PLAN.confirmS` | routePlan.ts | 10 | s | Session setting (stating the plan) |
| `MP_ROUTE_PLAN.palpableHaematomaMl` | routePlan.ts | 5 | mL | A swelling felt before it can be seen under the drapes |
| Haematoma 'found while small' | routePlan.ts `scoreMonitoring` | `MP_COMPRESSION.visibleHaematomaMl` (imported) | mL | 'Found while small' means before it is visible under the drapes |
| `LEFT_GROIN_PLANNABLE` | routePlan.ts | false | n/a | Not a clinical value: CaseSession.setAccess takes no side, so the left groin is offered only as a fallback until it does (a test pins the flag to the session's behaviour) |
| Pulses before the choice | routePlan.ts `record` | all eight (radial, ulnar, femoral, foot, both sides) | n/a | Brilakis asks for all the pulses in the arms and legs (hb-background-peripheral) |

## Scenarios (routes.ts)

| Scenario | Parameter | Value | Unit | Rests on |
|---|---|---|---|---|
| all | Seeds, stable angina, no anticoagulant, no contrast reaction, sinus rhythm | `route-*` seeds | n/a | Scenario choice, so that only the scenario's step decides |
| all | Booked access (replaced by the learner's plan) | radial-right or femoral | n/a | Scenario choice (the habitual route the case is booked with) |
| lima-graft | Patient | 68, M | years | Scenario choice |
| lima-graft | Haematoma at the access site | 4 mL at 3 min and 4 mL at 6 min after the sheath | mL | Below the visible 15 mL, above the palpable 5 mL once both have happened |
| arteria-lusoria | Patient | 61, F | years | Scenario choice |
| complex-pci-8fr | Patient | 64, M | years | Scenario choice |
| impalpable-femorals | Patient; femoral and foot pulses | 72, M; absent both sides | years | Request hb-background#7 scenario 1 |
| axillofemoral-graft | Patient | 70, M | years | Scenario choice |
| aaa-mural-thrombus | Patient | 76, M | years | Scenario choice |
| right-groin-plug-60d | Patient; closure device | 69, M; right groin 60 days ago | years; days | Inside Brilakis's 90 days; a LIMA graft so that the groin is a natural choice (the record's planted problem is the plug) |
| spasm-high-risk | Patient | 47, F, 158 cm, 58 kg, radial 2.0 mm, anxiety 0.85, smoker | years, cm, kg, mm | Request pm-engaging#13: smaller than average radial, woman, smoker, anxious |
| very-small-radial | Patient | 58, F, 152 cm, 54 kg, radial 1.6 mm | years, cm, kg, mm | Below `VERY_SMALL_RADIAL_MM` |
