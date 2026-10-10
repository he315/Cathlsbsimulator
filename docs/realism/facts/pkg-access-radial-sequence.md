# access-radial-sequence: model parameters

The radial sequence of the full case: the shared spasm model (`src/simulation/access/radialSpasm.ts`), the wrist anatomy (`src/simulation/access/site.ts`), the needle and the local anaesthetic at the wrist (`src/simulation/access/ultrasound.ts`), the wire rules (`src/simulation/procedure.ts`), the forearm on fluoroscopy (`src/simulation/access/route.ts`), the session (`src/simulation/session/caseSession.ts`, `MP_RADIAL_SEQUENCE`) and the radial scenarios (`src/simulation/session/scenarios/radial.ts`).

Sourced values carry their module-text location in the code and are not repeated as model parameters: about 1 mL of local anaesthetic (Brilakis) and 1-2 mL of 1% lidocaine (Oxford), aspirate first, a large volume flattens the artery and recovers in 1-2 minutes or the operator moves along it (pm-access-radial-puncture, step 4; `LOCAL_ANAESTHETIC.radialMl` in emergencies.ts); the spasm risk factors, prevention and treatment (the lesson's 'Spasm at the puncture' table, Brilakis 4.3 and his complications chapter); single-wall and through-and-through punctures (step 5); needle-tip resistance, wrist extension, turning the bevel, and imaging forearm resistance through a catheter just below the wire tip (pm-access-radial-sheath, step 6); aspirate 3-4 mL, the vasodilator, securing the sheath, Oxford's cocktail of heparin 2500 IU, verapamil 2.5 mg and GTN 200-400 micrograms, and heparin held to the root in extreme tortuosity (steps 9-10); balloon-assisted tracking half out of the tip at 3-6 atm (tip access-cx-radial-loop-bat, Brilakis 29.2 and 5.3); a catheter across the hole seals most radial perforations, otherwise a long balloon at low pressure for a prolonged time (tip access-cx-radial-perforation-cover); no more than two passes in the normal preset (lab request pm-access#4). Everything below is a MODEL PARAMETER: a setting chosen where the text names a factor or a step without a number, a drawing choice, or a scenario choice.

## The spasm model (radialSpasm.ts, `MP_RADIAL_SPASM`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `smallDiamMm`, `perMmBelow` | 2.5, 0.3 | mm; tone per mm below | 'Small radial artery' (Brilakis 4.3); 2.5 mm sits between the generator's female (2.35) and male (2.7) means, so only a smaller than average artery counts |
| `youngAgeY`, `perYearYounger`, `youngMax` | 55, 0.005, 0.15 | years; tone per year; tone | 'Younger patients' (Brilakis 4.3) without an age |
| `female`, `smoker` | 0.05, 0.05 | tone | 'Women, current smokers' (complications chapter), small terms because they are weaker than the artery's size |
| `anxiety` | 0.4 | tone per unit of the engine's anxiety | 'Anxiety'; the engine's anxiety already falls with sedation (responses.ts), so sedation acts through it |
| `pain` | 0.25 | tone | The session's existing rule that pain without local anaesthetic makes spasm more likely (caseSession.ts spasmInputs) |
| `sheathRatioFree`, `sheathPerRatio` | 0.9, 0.6 | ratio; tone per unit ratio | 'Large sheaths' as a factor: nothing until the sheath approaches the artery's size |
| `exchange`, `exchangeMax`, `exchangeImpulse` | 0.04, 0.2, 0.08 | tone | 'Repeated catheter exchanges through a small radial artery' (pm-engaging-spasm pitfalls) |
| `vasopressor` | 0.2 | tone | 'Intravenous vasopressors' (Brilakis 4.3) |
| `passImpulse`, `painfulPassImpulse` | 0.12, 0.12 | tone, fading | 'Several needle passes'; the first pass adds nothing |
| `vasodilatorRelief`, `nitrateRelief` | 0.8, 0.7 | share of the drive removed at full effect | Vasodilators and nitroglycerin as prevention and treatment |
| `tauRiseS`, `tauFallS`, `tauImpulseS` | 10, 90, 90 | s | Spasm comes quickly and relaxes over minutes ('wait') |
| `lumenAtFull` | 0.5 | share of the relaxed lumen | A clamped artery still shows a lumen on ultrasound |
| `slowFlashAt`, `poorFlashAt` | 0.45, 0.7 | tone | The flash slows before it fails; at a poor flash the wire will not pass ('restore good backflow') |

## The wrist and the needle (site.ts, ultrasound.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_SITE.neutralDeeperMm`, `neutralLateralMm` | site.ts | 3, 3 | mm | A forearm that cannot be supinated turns the artery away from a probe held where it would be on a supinated wrist |
| Default arm | site.ts | supinated for a right radial; across the body for a left | n/a | The usual set-up; 'bring the arm across the abdomen palm up' for the left radial (step 2) |
| `MP_LOCAL.freeMl` | ultrasound.ts | 1 | mL | Brilakis's 'about 1 mL' presses on nothing |
| `MP_LOCAL.squashPerMl`, `squashMax` | ultrasound.ts | 0.25, 0.85 | share of the vertical lumen per mL above 1 mL | 'Larger volumes squash the artery'; 4 mL (the lesson's check question) leaves the artery nearly flat |
| `MP_LOCAL.squashTauS` | ultrasound.ts | 40 | s | 'Wait 1-2 minutes for the artery to recover': mostly gone by 2 minutes |
| `MP_LOCAL.spreadBaseMm`, `spreadPerMl` | ultrasound.ts | 6, 3 | mm | 'Or move to a different point along the radial artery': the bleb presses only near where it was given |
| `MP_LOCAL.disperseTauS` | ultrasound.ts | 150 | s | The bleb seen on the image disperses over minutes (drawing) |
| Bleb drawing proportions | ultrasound.ts `blebGeometry` | R x 1.3 across, R x 0.35 thick, R from the volume left | n/a | Drawing choice |
| `MP_NEEDLE.collapseShare` | ultrasound.ts | 1 | share of the lumen's height | A flattened artery closes under the tent and both walls go together ('larger volumes squash the artery and make it harder to enter') |
| `MP_NEEDLE.collapseFlatness` | ultrasound.ts | 0.7 | lumen height over width | Only a flattened lumen (a bleb pressing on it) closes so; a round artery narrowed by its tone does not |
| `MP_NEEDLE.transfixReopenMm` | ultrasound.ts | 0.3 | mm | After both walls went together, blood returns as the needle is drawn back |
| `MP_NEEDLE.bevelSideEcc` | ultrasound.ts | 0.35 | share of the artery's half-width | 'If the needle entered the side of the artery' |
| Roll eccentricity against the narrowed width | ultrasound.ts | rule | n/a | A narrowed artery is a smaller target |

## The wire and the forearm image (procedure.ts, route.ts)

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Tight loop (`tightenLoop`) | procedure.ts | rule | n/a | A scenario setting: no 0.035 inch wire crosses it; only balloon-assisted tracking does |
| Balloon-assisted tracking opens a loop and cannot perforate | procedure.ts | rule | n/a | 'So the catheter edge cannot cut the wall' |
| Wire perforation chance | procedure.ts `MP_WIRE.perforationPerMm` | 0.02 per mm (existing) | n/a | Unchanged; now also recorded where it happened (`perforationS`) |
| `MP_ROUTE.forearmCentreShare` | route.ts | 0.7 | share of the radial artery's length | Framing: the forearm field holds a loop at the radial-brachial junction |
| `MP_EXTRAVASATION` (tracks 7, 9 mm, spread 0.45, radius 1.8 mm, density share 1.0, fan half-angle 0.9 rad, depth share 0.3) | route.ts | as listed | mm; share of the arterial iodine density; rad | Drawing of the blush around a perforation. The tracks fan square to the artery in the image plane (beam taken along z, the forearm views being AP or within 30 degrees of it) with only a small depth component, so they spread on the image rather than stacking onto the artery; sized so an open leak is visible by eye at a 25 cm field |
| `MP_EXTRAVASATION.puddleMm`, `puddleShare` | route.ts | 3, 0.5 | mm; share of the arterial iodine density | Drawing: the contrast stain pooling at the hole itself |
| `MP_RADIAL_SEQUENCE.angioIodineShare` | caseSession.ts (drawn in AccessFluoroView.tsx) | 0.8 | share of the contrast's iodine | Drawing: contrast injected through a catheter just below the wire tip is less diluted than a sheath puff (which keeps the existing 0.5 limb dilution) |
| Forearm angiogram fill, `MP_RADIAL_SEQUENCE.angioAheadMm`, `angioBackMm` | caseSession.ts, route.ts | 120, 10 | mm | Drawing and reading: how far contrast from a catheter fills the forearm |
| `MP_SESSION.radialPuffMm` | caseSession.ts | 190 | mm | The length the fluoroscopy view already drew for a radial sheath puff, now also used to read it |

## The session (caseSession.ts, `MP_RADIAL_SEQUENCE`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `blebScoredSquash` | 0.2 | share | A bleb still flattening the artery this much where the needle meets it counts as punctured through. The bleb item is scored only after a single injection above Oxford's upper volume (`localMaxMl`, `LOCAL_ANAESTHETIC.radialMl[1]`), so a volume scored correct is never a bleb item |
| `nitrateEffect`, `nitrateTauS` | 0.6, 600 | effect, s | Nitroglycerin under the tongue, under the skin or around the artery; the module text gives no dose, so only its local effect on the tone is modelled (the formulary has no sublingual or subcutaneous route) |
| `pushTolMm` | 25 | mm | The wire pushed this far against forearm resistance without an image is 'pushing' |
| `angioBelowTipMm` | 40 | mm | 'Just below the wire tip' |
| `batTipMm`, `batLeadMm`, `batPastMm` | 25, 8, 10 | mm | The catheter close behind the wire tip; the balloon half out of it; the tracking ends past the loop |
| `sealCatheterP` | 0.85 | share of runs | 'Seals most radial perforations' |
| `wireAcrossMm`, `wireLostMm` | 15, 5 | mm | The wire across the damaged segment; pulled back below it |
| `sealCatheterS`, `sealBalloonS` | 60, 300 | s | The catheter held across; the long balloon 'for a prolonged time' |
| `strokeBeyondMm` | 1.5 | mm | A through-and-through stroke carries the bevel clear of the back wall |
| `armS`, `secureS`, `nitrateS`, `batSetupS` | 20, 30, 20, 60 | s | Session timings |
| `MP_RADIAL_TONE_STEP_S` | 0.5 | s | Session setting: how often the tone is stepped |
| Puncture spasm complication | `MP_RADIAL_SPASM.poorFlashAt` | tone | A spasm that stops the wire is a complication, as one that grips the wire later is |
| Unsecured sheath slips at a catheter exchange | rule | n/a | 'An unsecured sheath that slips out when the arm moves' (pitfalls), as a rule |
| Vasopressor infusions | noradrenaline, adrenaline, phenylephrine, metaraminol, vasopressin, dopamine | n/a | 'Intravenous vasopressors', read from the engine's infusion events |

## Scenarios (scenarios/radial.ts)

| Scenario | Settings | Rests on |
|---|---|---|
| radial-normal | man, 64 y, 2.7 mm radial, anxiety 0.3; local left to the learner | The standard wrist |
| radial-small | woman, 58 y, 1.8 mm radial | 'A small artery is hard to enter and prone to spasm' |
| radial-anxious-young | woman, 31 y, 2.2 mm radial, anxiety 0.95 | Younger, woman, anxiety: the lesson's risk factors |
| radial-lima-left | left radial, LIMA in the history; arm at the side, wrist not extended | 'Use it when the patient has a patent LIMA graft' |
| radial-no-supination | both forearms fixed, cannot supinate | The lab request's 'patient unable to supinate' |
| radial-bleb | the team's 4 mL at the probe | The lesson's check question ('After 4 mL of lidocaine around the wrist') |
| radial-loop | radial loop, tight; opens with the sheath in | The lab requests' loop and balloon-assisted tracking |
| radial-tortuous-extreme | radial loop (aimable) and tortuous subclavian; extreme tortuosity in the previous report | Brilakis 4.3: heparin may be held to the root |
| radial-forced-perforation | tight loop; the team's hydrophilic wire forced until it perforated; catheter seal scripted to hold | The scripted run of the lab request |
