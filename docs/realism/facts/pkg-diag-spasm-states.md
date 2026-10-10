# diag-spasm-states: model parameters

Catheter-tip spasm, focal coronary spasm and live radial spasm in the diagnostic lab: the catheter-tip spasm model of the patient engine (`src/simulation/patient/responses.ts`, `TipSpasmModel`, `MP_TIP_SPASM`), its drawing (`src/render/xray/coronaryTree.ts` `MP_TIP_SPASM_RENDER`, `src/ui/sim/FluoroView.tsx` `MP_SPASM_VIEW`), the live radial spasm host of the shared spasm model (`src/simulation/access/radialSpasm.ts` `MP_RADIAL_LIVE`, `LiveRadialSpasm`) kept by the engine for a radial case (`src/simulation/patient/engine.ts` `setRadialAccess`), the radial artery in the rod mechanics' lumen (`src/physics/lumen.ts` `RADIAL_SPASM_LUMEN`), the spasm session module (`src/ui/physics/physicsDevices.ts` `MP_SPASM_MODULE`), the forearm haematoma (`src/simulation/access/site.ts` `MP_FOREARM_HAEMATOMA`) and the scenarios (`src/simulation/diagnosticScenarios/spasm.ts`).

Sourced statements carry their module-text location in the code and are not repeated here: withdrawal, gentle coaxial re-engagement with a free trace, intracoronary nitrate dosed by the systolic pressure and a 1-2 minute wait before the repeat view (pm-interpreting-spasm, pm-acquiring-test-nitrate; Brilakis 5.8 and 6.3, 04-lab-drugs.ts line 251); a small non-dominant RCA as the commonest site of catheter-tip spasm (Oxford, tip diag-acq-small-rca-small-volume); the radial spasm measures (07-engaging.ts lines 1316-1325: nitroglycerin and verapamil into the artery, intravenously when the side port will not aspirate; nitroglycerin under the skin or under the tongue; more sedation, propofol, a nerve block or general anaesthesia; warmth; a lubricious solution; an upper-arm cuff above systolic for 5 minutes, the only number, used as `MP_RADIAL_LIVE.cuffHoldS`); intra-arterial lidocaine refused because of seizures (line 1321); forceful withdrawal avulsing the artery with forearm bleeding (line 1316); intravenous vasopressors and arrest as radial spasm risks (Brilakis 4.3 and 24.2, tip access-arrest-radial-spasm). Everything below is a MODEL PARAMETER: a size the text does not give.

## Catheter-tip spasm (responses.ts, `MP_TIP_SPASM`; off by default, set by the spasm session module)

The spasm session module turns this model on for this pack's scenarios only (`isSpasmPackScenario`, the ids of spasm.ts); every other diagnostic case keeps the legacy dynamics until a decision widens it. The engine snapshot carries the model (`tipSpasm`, written only when it is on).

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `riseTauS` | 25 | s | The legacy model's time constant (`MP_RESP.spasmTauS`): the trace ventricularises and then keeps falling over seconds after engagement (lab request pm-interpreting#8) |
| `holdTauS` | 300 | s | A provoked spasm outlasts the withdrawal: the module text's sequence needs nitrate, not withdrawal alone, to relieve it |
| `nitrateTauS` | 20 | s | Relief within the 1-2 minute wait after intracoronary nitrate |
| `fullReliefAt` | 0.5 | epicardial dilation (pharmacology) | About the dilation of 100 µg intracoronary in its first minutes (0.5-0.6 in the engine) |
| `refRadiusMm` | 1.9 | mm | The ostial radius of an average RCA in the generator (1.9-2.0 mm in a dominant RCA; 1.5 mm in the small non-dominant RCA of diag-catheter-tip-spasm-rca) |
| `maxScale` | 2.2 | gain multiplier | Susceptibility (refRadiusMm / ostial radius)^2, so a small ostium round a 6 Fr tip spasms more, bounded |
| `contactFree`, `max` | 0.2, 0.9 | wall contact; spasm | The legacy model's values |

## Drawing the spasm (coronaryTree.ts `MP_TIP_SPASM_RENDER`, FluoroView.tsx `MP_SPASM_VIEW`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `gain` | 1.4 | diameter share per unit of engine spasm | A spasm of 0.25 draws a smooth narrowing of about a third of the diameter, visible on a test run |
| `minShare` | 0.2 | share of the radius | The lumen never draws closed |
| `halfLengthMm` | 4 | mm | A short, smooth, concentric ostial narrowing round the tip |
| `minSeverity` | 0.01 | engine spasm | Below this nothing is drawn |
| `ostialMm`, `tipBeyondMm` | 2, 1 | mm | The narrowing sits round and just beyond the tip, at least at the ostium |

## Live radial spasm (radialSpasm.ts `MP_RADIAL_LIVE`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `significantAt`, `probabilityWidth` | 0.5, 0.08 | tone | A spasm that grips, hurts and shows on a puff; the logistic step from the target tone to its probability |
| `gtnEffectPer100Ug`, `gtnTauS`, `verapamilEffectPerMg`, `verapamilTauS` | 0.45, 260, 0.25, 1800 | effect, s | The full case's own values (caseSession.ts `MP_SESSION`), so both labs relieve spasm alike; radialSpasm.test.ts asserts they are equal. caseSession.ts should import them from radialSpasm.ts when its owner next edits it, leaving one source |
| `ivShare` | 0.5 | share | An intravenous dose reaches the radial artery less than one given into it |
| `scNitrate`, `slNitrate`, `nitrateTauS` | 0.6, 0.4, 600 | effect, s | Local nitrate around the artery acts more than sublingual; the full case's 600 s fall (`MP_RADIAL_SEQUENCE.nitrateTauS`) |
| `warmthRelief`, `warmthOnsetS`, `warmthTauS` | 0.5, 60, 300 | relief, s | Warmth can relieve spasm completely (the text); it takes a minute |
| `lubriciousRelief`, `lubriciousTauS` | 0.4, 300 | friction share, s | A lubricious solution eases the catheter, not the tone |
| `cuffRelief`, `cuffTauS` | 0.7, 240 | relief, s | The artery often relaxes when the cuff is let down |
| `nerveBlockRelief`, `gaRelief` | 0.85, 0.95 | relief | The rescue for equipment entrapped by severe spasm |
| `wallMu`, `gripPressureNmm2`, `fullInterference`, `tonicPressureNmm2` | 0.25, 0.012, 0.5, 0.003 | -, N/mm², ratio, N/mm² | The artery closing on the shaft: friction of the wall pressure over the contact area; at a tone of 0.8 a 6 Fr catheter over 120 mm of a 2.2 mm artery is gripped with about 3 N |
| `baseN`, `basePerMmS` | 0.25, 0.004 | N, N per mm/s | The sheath valve and a relaxed artery |
| `gripPerMmS` | 0.08 | share per mm/s | A faster pull meets more resistance (the arterial wall is dragged with the shaft) |
| `torqueShare` | 0.6 | share of the radius | Rotation drags too |
| `avulsionN`, `avulsionLevel` | 8, 0.6 | N, tone | A forceful pull (about 40 mm/s) through a gripping spasm avulses; a gentle one (3-5 mm/s) does not |
| `painFrom`, `painStill` | 0.35, 0.35 | tone, share | Forearm pain with spasm, more when the catheter moves |
| `painTauS` | 20 | s | The forearm pain's fall once the spasm stops hurting: the engine's procedural pain fall (responses.ts). The pain is the host's (`LiveRadialSpasm.pain`), read out as `symptoms.forearmPain` (0-10, scaled by the patient's pain sensitivity and analgesia as the chest pain is) and spoken by the patient ('patient.stimulus' of kind 'radial-spasm'); it enters neither the chest pain nor the sympathetic drive nor the afterload |
| `pruneBelow` | 0.001 | effect | A dose or a decaying measure whose effect has fallen below this is dropped from the host's lists (a nerve block and general anaesthesia last the case) |

## The radial lumen in the rod mechanics (lumen.ts `RADIAL_SPASM_LUMEN`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `clearanceMm` | 0.03 | mm | The spastic lumen closes on the shaft but not below the device's radius |
| `gripAt` | 0.35 | tone | From this tone a catheter-sized device meets the wall with the grip's friction |
| `friction` | 1 | wall-friction scale (Region.RadialSpasm) | The relaxed artery's: the grip has one source, the shared model's `gripForceN`, added at the hub (DiagnosticPhysics.reaction for the haptics, and the module's hub force of a pull). A larger solver friction here would count the grip twice under the rod mechanics |

## The spasm session module (physicsDevices.ts `MP_SPASM_MODULE`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `stepS` | 0.25 | s | As the kink module |
| `ostialAt`, `ostialHoldS` | 0.15, 30 | engine spasm, s | A spasm that ventricularises or damps the trace (the engine's tip chamber at the scenario's RCA) |
| `radialHoldS` | 30 | s | The radial-spasm event while it is felt |
| `movingMmS` | 0.5 | mm/s | Hand speed counted as moving the catheter |
| `contactMm` | 120 | mm | Catheter length in the radial artery beyond a standard short sheath, under the simple catheter model. The rod mechanics measure the length in their own route's radial artery (about 160 mm in diag-radial-spasm-entrapment), so the same pull meets a proportionally larger grip there: the difference is the geometry, the function is the same |
| `catheterOdMm` | 2.0 | mm | 6 Fr (the sheath sizes are closure.ts `SHEATHS`) |
| `painEveryS` | 2 | s | The forearm pain (`PatientEngine.forearmPain`, magnitude `spasmPain`) is reported at most this often; the patient's voice has its own cooldown. An avulsion gives the full pain with the vagal draw of a painful stimulus, without chest pain |
| `maxHandMmS` | 240 | mm/s | 60 mm in one quarter-second evaluation: a faster change of the catheter position is a reset (a catheter change, a case load), not a pull. A catheter change itself is an exchange and that evaluation reads no movement |
| hand speed under the rod mechanics | the commanded catheter push (DiagnosticPhysics.catheterFedMm) | mm | The reported insertion there moves in steps of a shaft segment as nodes cross the skin, and the tip sticks and slips in a gripping spasm; either read as a jerk of 40-50 mm/s from a 10 mm/s hand. The simple catheter model reads the hub insertion |
| `noAspirateAt` | 0.85 | tone | The side arm will not aspirate once the artery has closed round the sheath tip |

## The forearm haematoma (site.ts `MP_FOREARM_HAEMATOMA`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `avulsionMl`, `perNewtonMl` | 30, 2 | mL, mL per N | An avulsion bleeds at once, more after a harder pull |
| `mlPerMin`, `capMl` | 6, 250 | mL/min, mL | It grows while nothing compresses it, towards a forearm's capacity |
| `visibleMl`, `tenseMl` | 20, 120 | mL | A visible swelling, and a tense forearm (the compartment syndrome warning of the text) |

## Scenario data (spasm.ts `spasmSetups`, `MP_SPASM_EVENT_HOLD_S`)

| Scenario | Value | Rests on |
|---|---|---|
| diag-radial-spasm-entrapment | radial artery 1.9 mm, 6 Fr sheath, 2 exchanges made, tone 0.75 with 0.2 transient | A small artery, large sheath and repeated exchanges (pm-engaging#3) |
| diag-ohca-vasopressor-radial | 6 Fr sheath, noradrenaline 10 µg/min running | A resuscitated patient on a vasopressor (cp-complex-patients#4); the rate is scenario data, not taken from the module text |
| `MP_SPASM_EVENT_HOLD_S` | 30 s | The script's hold of ostial-spasm after a deep seat damps the RCA trace; the same value is the spasm module's `ostialHoldS`, so the event follows the engine's spasm and lapses once nitrate has relieved it |
| diag-catheter-tip-spasm-rca root | normal | The small RCA is the left-dominant tree's; a small root would cram the JR4 (store tip.cram 4 mm, the aspiration's wall limit) and refuse every injection through it |
