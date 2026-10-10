# access-femoral-upsizing-angiogram: model parameters

Upsizing the femoral micropuncture to a sheath, the sheath's preparation and the femoral angiogram in the full case (`src/simulation/access/upsizing.ts`), its drawing on ultrasound and fluoroscopy (`src/simulation/access/route.ts`, `src/simulation/access/ultrasound.ts`, `src/ui/access/AccessFluoroView.tsx`) and the scenarios (`src/simulation/session/scenarios/upsizing.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: `SOURCED_UPSIZING` (Brilakis 4.2, steps 13-15, src/content/manual/pci-manual/05-access.ts: draw 3-4 mL from the side arm and discard it; inject about 5-10 mL; RAO 20-30 degrees for the right groin, LAO 20-30 degrees for the left; and the closure criterion of pm-closure-plan, 13-closure.ts, a common femoral artery larger than 5 mm entered above its bifurcation); the troubleshooting table's resistances and their fixes (pm-access-troubleshoot, 05-access.ts); the obese-groin check 'In a patient with a BMI of 41' that the `OBESE` profile reproduces.

## Upsizing (upsizing.ts `MP_UPSIZING`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Step times: `nickS`, `spreadS`, `dilatorS`, `innerOutS`, `wire035S`, `dilatorOutS`, `fixS`, `exchangeS`, `aspirateS`, `flushS`, `transduceS`, `angioS` | src/simulation/access/upsizing.ts | 10, 10, 15, 6, 15, 5, 20, 45, 8, 8, 10, 6 | s | MODEL PARAMETERS: session times of each step, not from a source |
| `wire035Mm` | src/simulation/access/upsizing.ts | 300 | mm beyond the entry | MODEL PARAMETER: the 0.035 inch wire passed to the abdominal aorta |
| `angioDefaultMl` | src/simulation/access/upsizing.ts | 8 | mL | MODEL PARAMETER within the sourced 5-10 mL: the femoral angiogram when no volume is chosen |
| `puffClampMl` | src/simulation/access/upsizing.ts | [1, 20] | mL | MODEL PARAMETER: clamp on any side-arm injection |
| `angioSliderMl` | src/simulation/access/upsizing.ts | [2, 15] | mL | MODEL PARAMETER: the slider spans the sourced 5-10 mL |
| `dampedReadingOfDia` | src/simulation/access/upsizing.ts | [0.4, 0.35] | fractions of the aortic diastolic pressure ([systolic, diastolic] of the reading) | MODEL PARAMETER: a damped side arm (subintimal sheath) |
| `angioIodineShare` | src/simulation/access/upsizing.ts | 0.85 | share of the contrast's iodine concentration | MODEL PARAMETER, set by eye on the rendered RAO 30 frames so the bifurcation and the entry stay readable over the femoral head and in the larger body sizes (checked in fem-angio-below-bif, habitus 1.08) |

## Drawing (route.ts `MP_FEMORAL_ANGIO`, ultrasound.ts, AccessFluoroView.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_FEMORAL_ANGIO.pfaLateralShare` | src/simulation/access/route.ts | 0.25 | share of the lateral offset | MODEL PARAMETER: the profunda keeps its depth from the site model and this share of its lateral offset from the SFA on the angiogram |
| `MP_FEMORAL_ANGIO.branchLenMm` | src/simulation/access/route.ts | 140 | mm | MODEL PARAMETER: drawn length of the femoral branches |
| `MP_FEMORAL_ANGIO.calciumR`, `calciumMuShare` | src/simulation/access/route.ts | 0.7; 0.6 | mm; share | MODEL PARAMETER: the calcium line on the angiogram |
| `MP_FEMORAL_ANGIO.spreadLenMm` | src/simulation/access/route.ts | 60 | mm below the bifurcation | MODEL PARAMETER: the stretch over which femoralBifurcationSpread judges whether the branches open out |
| Dilator on ultrasound | src/simulation/access/ultrasound.ts | sheath 70, dilator 35 into the artery; radius (Fr/3) x 0.5 | mm | MODEL drawing lengths, labelled in the code |
| Dilator on fluoroscopy | src/ui/access/AccessFluoroView.tsx | 100 from the skin, radius 0.7 | mm | MODEL drawing length, labelled in the code |
| `FIELD_MAG_MM` | src/ui/access/AccessFluoroView.tsx | 170 | mm at the detector | Framing setting, not a device dimension: the magnified field |

## Scenarios (scenarios/upsizing.ts) and autopilot

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `GROIN` | src/simulation/session/scenarios/upsizing.ts | ligament 66, head centre 30, bifurcation -4 | mm from the crease | Scenario setting: the standard groin, as fem-normal's (see pkg-access-femoral-puncture.md) |
| `BELOW_BIF_AIM_ABOVE_MM`, `HIGH_BIF_X` | src/simulation/session/scenarios/upsizing.ts | 5; 22 | mm | Scenario settings (fem-angio-below-bif): the needle aimed 5 mm above a high bifurcation at x 22, so the wire enters within the site model's 3 mm 'at the bifurcation' |
| `HIGH_AIM_X`, `HIGH_IEA_X` | src/simulation/session/scenarios/upsizing.ts | 56; 48 | mm | Scenario settings (fem-angio-high): the wire enters at about 52, some 4 mm above the lowest point of the inferior epigastric artery, below the high-stick line (ligament 62 less 5 mm) |
| `OBESE` | src/simulation/session/scenarios/upsizing.ts | woman, 165 cm, 112 kg | cm; kg | A BMI of about 41, the module's obese-groin check |
| `SPO2_RECHECK_S`, `SPO2_RECHECKS` | src/simulation/session/autopilot.ts | 30; 10 | s; rechecks | Autopilot settings (not clinical values): how long it waits on oxygen before rechecking the SpO2, and how often |
