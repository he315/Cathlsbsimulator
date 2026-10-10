# access-femoral-puncture: model parameters

The femoral puncture in the full case: the groin anatomy (`src/simulation/access/site.ts`), the needle, micro-wire and B-mode models (`src/simulation/access/ultrasound.ts`), the limb on fluoroscopy (`src/simulation/access/route.ts`, `src/ui/access/AccessFluoroView.tsx`), the scoring (`src/simulation/session/caseSession.ts`) and the scenarios (`src/simulation/session/scenarios/femoral.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the needle angles of Brilakis 4.2, step 6 (about 45 degrees for an artery about 2 cm deep; for one about 4 cm deep keep 45 degrees and move the skin entry down the leg, rather than steepening to about 70 degrees); 'first or second pass' as the success criterion (lab request pm-access#1); the micro-wire's wrong courses (inferior epigastric, lateral circumflex iliac, down the leg) and their causes (Brilakis 4.2, steps 7 and 8); the plugged needle (Brilakis 4.2.6.3); clear of calcium (Brilakis 4.2, step 4). The bands and limits that turn those statements into numbers are model parameters.

## Groin anatomy (site.ts `MP_SITE`, the femoral terms)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `femoralHeadLat` | src/simulation/access/site.ts | 6 | mm | MODEL PARAMETER: lateral offset of the femoral head's centre from the CFA centre line |
| `presetFasciaMm` | src/simulation/access/site.ts | 4.5 | mm | MODEL PARAMETER: fascia and muscle below the fat, above a scenario's near-wall depth preset |
| `branchR` | src/simulation/access/site.ts | 1.1 | mm | MODEL PARAMETER: radius of the inferior epigastric and lateral circumflex iliac arteries |
| `ieaAboveLigament`, `lciaAboveLigament` | src/simulation/access/site.ts | 4, 7 | mm above the ligament | MODEL PARAMETER: their origins |
| `branchLen`, `branchDy`, `branchDz` | src/simulation/access/site.ts | 60; 0.55; -0.25 | mm drawn; course per mm of x (medial or lateral; towards the skin) | MODEL PARAMETER |
| `accessoryProfundaShare`, `accessoryProfundaBelowHead` | src/simulation/access/site.ts | 0.4; 4 | share of the CFA radius; mm below the head centre | MODEL PARAMETER: the accessory profunda |
| `clearWindowMm` | src/simulation/access/site.ts | 6 | mm | MODEL PARAMETER: a calcified stretch must leave this much clear artery to remain the target window |

## Needle, micro-wire and B-mode (ultrasound.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_NEEDLE.wireSteepDegFemoral` | src/simulation/access/ultrasound.ts | 75 | degrees | MODEL PARAMETER: the steepest needle the wire still passes from at the groin; a deep CFA may be punctured at about 70 degrees (Brilakis 4.2, step 6, his second option) |
| `MP_NEEDLE.tentCalcified`, `calciumDeflectDeg` | src/simulation/access/ultrasound.ts | 2.6; 9 | mm of indentation; degrees of sideways turn | MODEL PARAMETER: a calcified anterior wall, before the needle glances off it |
| `MP_MICRO.branchReachMm` | src/simulation/access/ultrasound.ts | 25 | mm above the entry | MODEL PARAMETER: the wire can enter a branch whose origin lies this far above the entry |
| `MP_MICRO.branchYawDeg` | src/simulation/access/ultrasound.ts | 6 | degrees | MODEL PARAMETER: a needle aimed at least this far medial (IEA) or lateral (LCIA) |
| `MP_MICRO.downLegAngleDeg`, `downLegReachMm` | src/simulation/access/ultrasound.ts | 50; 8 | degrees; mm above the bifurcation | MODEL PARAMETER: a steep entry near the bifurcation sends the wire down the leg |
| `MP_MICRO.branchFreeMm`, `branchCreep` | src/simulation/access/ultrasound.ts | 30; 0.15 | mm; share of the push | MODEL PARAMETER: the wire runs freely into a small branch, then creeps against the stop |
| `MP_BMODE.calcium`, `calciumMm`, `calciumShadow` | src/simulation/access/ultrasound.ts | 1.0; 0.9; 0.12 | echogenicity; mm; share passing beneath | MODEL PARAMETER (tuned by eye; no physical claim): anterior-wall calcium and its shadow |

## Limb on fluoroscopy (route.ts, AccessFluoroView.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_LIMB.sheathTipSiteX` | src/simulation/access/route.ts | 85 | mm from the inguinal crease | MODEL PARAMETER: the route's start, the tip of a 10 cm sheath after a typical puncture |
| `MP_GROIN_DRAW.needleR`, `steelMu` | src/simulation/access/route.ts | 0.4; 0.95 | mm; per mm | MODEL PARAMETER (drawing sizes, not device dimensions): the micropuncture needle and the scene builder's steel |
| `MP_GROIN_DRAW.markerLen`, `markerSpread`, `markerR` | src/simulation/access/route.ts | 70; 6; 1.2 | mm | MODEL PARAMETER: the haemostat laid over the pulse as a skin marker |
| `MP_GROIN_DRAW.stepMm` | src/simulation/access/route.ts | 2 | mm | Drawing setting: sample spacing along the limb |
| `GROIN_FRAME_BELOW_HEAD_MM` | src/ui/access/AccessFluoroView.tsx | 15 | mm along the limb | Framing choice: the groin station is centred this far below the head so the head and the 1-2 cm below it lie mid-field |

## Scoring (caseSession.ts `MP_FEMORAL_PUNCTURE`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `markToleranceMm` | src/simulation/session/caseSession.ts | 6 | mm | MODEL PARAMETER: the skin mark counts as on the lower edge of the femoral head within this |
| `deepNearWallMm` | src/simulation/session/caseSession.ts | 30 | mm at the crease | MODEL PARAMETER: a CFA this deep is scored as a deep artery |
| `about45Deg` | src/simulation/session/caseSession.ts | [38, 52] | degrees | The band is a MODEL PARAMETER around Brilakis's 'about 45 degrees' |
| `steepDeg` | src/simulation/session/caseSession.ts | [60, 75] | degrees | The band is a MODEL PARAMETER around Brilakis's 'about 70 degrees' |
| `passes` | src/simulation/session/caseSession.ts | 2 | passes | Lab request pm-access#1 (sourced) |
| `flushNeedleS`, `markS` | src/simulation/session/caseSession.ts | 15; 10 | s | MODEL PARAMETER: time to take the needle out and flush it, and to mark the skin |

## Scenarios (femoral.ts)

Scenario settings are MODEL PARAMETERS of the scenario unless cited; none is a population value. Site x is mm along the limb from the inguinal crease, positive towards the heart; the femoral head has the site model's 24 mm radius. Every scenario is elective (stable angina) with a fixed seed.

| Scenario | File | Settings | Rests on |
|---|---|---|---|
| `fem-normal`, `fem-plugged-needle` | src/simulation/session/scenarios/femoral.ts | ligament 66, head centre 30, bifurcation -4 | The bifurcation just below the crease, where it lies in about three quarters of patients (site.ts `SOURCED_SITE`) |
| `fem-high-bif` | src/simulation/session/scenarios/femoral.ts | ligament 70, head 30, bifurcation 36 | A high bifurcation over the femoral head (lab request pm-access#1): 6 mm above the head centre |
| `fem-calcified-anterior` | src/simulation/session/scenarios/femoral.ts | ligament 66, head 30, bifurcation -4; anterior calcium from x 26 to 50 | Calcium over the upper half of the head, the clear stretch over the lower half (Brilakis 4.2, step 4) |
| `fem-deep-4cm` | src/simulation/session/scenarios/femoral.ts | near wall 40 mm; man, 175 cm, 122 kg | Brilakis 4.2, step 6, the artery about 4 cm deep |
| `fem-shallow-2cm` | src/simulation/session/scenarios/femoral.ts | near wall 20 mm; woman, 165 cm, 58 kg | Brilakis 4.2, step 6, the artery about 2 cm deep |
| `fem-micro-wire-iea`, `fem-micro-wire-lcia` | src/simulation/session/scenarios/femoral.ts | ligament 60, head 28, bifurcation -5; IEA origin x 50 or LCIA origin x 52 | Model choice: the branch origins 20-25 mm above the middle of the puncture window, so a wire fed to the usual length reaches them |
| `fem-micro-wire-down-leg` | src/simulation/session/scenarios/femoral.ts | ligament 66, head 30, bifurcation 4 | Scripted course down the leg (Brilakis 4.2, steps 7 and 8) |
| `fem-entry-below-head` (`BELOW_HEAD_MM`) | src/simulation/session/scenarios/femoral.ts | ligament 64, head 38, bifurcation -20; the team's entry 6 mm below the head's lower edge | Model choice: an entry below the head to be recognised on screening (Brilakis 4.2, step 8) |
