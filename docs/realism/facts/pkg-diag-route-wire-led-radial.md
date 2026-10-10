# diag-route-wire-led-radial: model parameters

From the sheath to the aortic root in the diagnostic lab: the radial loop in the physics lumen (`src/physics/lumen.ts`), the narrow-J and 300 cm wires (`src/physics/catheterShapes.ts`), the sheath start, the route mechanics (wire lead, dissection accumulator, wire in the ventricle, stalls, perforation, balloon-assisted tracking) of the lab's physics (`src/ui/physics/physicsDevices.ts`), the route session module (`src/ui/sim/modules/route.ts`) and the drawing of the straightened loop and of a peripheral dissection (`src/simulation/access/route.ts`).

What the module text gives, and the code follows, is quoted here with its location rather than repeated as a model parameter:

- the J wire leads the catheter; catheters always travel over a wire (pm-to-the-root-advance, `src/content/manual/pci-manual/06-to-the-root.ts`:489);
- after the wire comes out: "Draw back 2–3 mL and discard it" (06-to-the-root.ts:538), connect while flushing, fill with contrast to the tip (06-to-the-root.ts:636): `MP_ROUTE_MODULE.aspirateMinMl`, `aspirateMaxMl` and the order of the Route tab's hub actions;
- the resistance algorithm: transduce the side arm (no waveform: subintimal sheath or, from the radial, severe spasm; 06-to-the-root.ts:686), bring the catheter up close and try other wires, "a polymer-jacketed hydrophilic wire or a narrow-J radial wire, and a 0.014 inch wire to negotiate loops" (06-to-the-root.ts:696), image from just below (06-to-the-root.ts:716): the Route tab's actions and `RouteScore.transducedFirst`, `imagedBeforeRewire`;
- balloon-assisted tracking: a compliant balloon 1:1 with the catheter, half out of its tip, "3–6 atm", advanced as a unit (06-to-the-root.ts:747-774): `MP_ROUTE_LED.batAtm` = [3, 6];
- straightening a loop "can create pseudolesions on the angiogram, which are artefacts of the straightened artery and not disease" (06-to-the-root.ts:743);
- a radial perforation: "advancing a catheter across the perforated segment usually seals it" (06-to-the-root.ts:820);
- the narrow-J radial wire's J "has a 1.5 mm radius instead of the standard 3 mm" (Brilakis; 06-to-the-root.ts:122): `NARROWJ` in catheterShapes.ts;
- exchange-length wires "250–300 cm, Oxford" (06-to-the-root.ts:121) and "a 0.035 or 0.038 inch wire 300 cm long, keeping its tip in the root" (06-to-the-root.ts:782): `J300` (3000 mm) in catheterShapes.ts, `J260` already there.

## The radial loop (lumen.ts)

The loop exists in the physics lumen only for a case that starts at the sheath (`DiagnosticPhysics` leaves the variant out of the lumen of a case that opens at the root, so those cases keep their geometry). The engine builds its lumen from the model and its own flags; the loop reaches it on the model (`withRouteVariants`), and the lab's straightening reaches it with the coronary motion (`loopControlInput`). Both are channels, not model parameters.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `RADIAL_LOOP.loopR` | src/physics/lumen.ts | 5 | mm, radius of the loop's centre line | MODEL PARAMETER: the access route's loop radius, unchanged (`MP_ROUTE.loopR` in src/simulation/access/route.ts now reads it) |
| `RADIAL_LOOP.n`, `RADIAL_LOOP.advanceMm` | src/physics/lumen.ts | 24; 1.5 | samples per turn; mm the artery moves on over the turn | MODEL PARAMETERS: the access route's construction, unchanged (its drawn loop is point for point what it was) |
| `RADIAL_LOOP.drawLumenR` | src/physics/lumen.ts | 1.0 | mm, the lumen radius the route draws in the loop | MODEL PARAMETER: the access route's value, unchanged |
| `RADIAL_LOOP.lumenR` | src/physics/lumen.ts | 1.18 | mm, the physics lumen radius in the loop | the radial artery's radius in lumen.ts (Hasan 2025: radial artery 2.35 mm, lumen.ts armCtrl) |
| `RADIAL_LOOP.liftMm` | src/physics/lumen.ts | 3.6 | mm the physics loop rises out of its plane over the turn | MODEL PARAMETER: enough that the artery leaving the loop passes over the artery entering it with more than a 0.035 in wire's width of wall between them (route.test.ts); a planar loop's crossing would be one lumen and a device would cut across it |
| `RADIAL_LOOP.settleMm` | src/physics/lumen.ts | 14 | mm of artery beyond the loop over which it comes back into its plane | MODEL PARAMETER |
| `RADIAL_LOOP.friction`, `Region.RadialLoop` | src/physics/lumen.ts | 8 | wall-friction scale of the loop's samples (1 elsewhere in the artery; `regionFrictionScale`) | MODEL PARAMETER: with it a J wire pushed 60 mm stalls in the loop in 5 of 5 starts (tip 11 to 30 mm short of the loop's exit) and a hydrophilic wire passes in 5 of 5 (0.8 to 4.7 mm beyond it; route.test.ts); tuning runs at 6 and 10 gave the same J result. A 6 Fr catheter over the hydrophilic wire catches (the hand's grip slips at the engine's 4 N). The 0.014 in wire has its own scale (next row). Limitation: the narrow-J stalls in this loop like the J (13 to 17 mm short of the exit): it has the J's radius and core, and the contact model scales friction by region and device radius only, so its smaller J changes little. The scenario's check names the hydrophilic and 0.014 in wires (the module text gives the 0.014 in wire "to negotiate loops", 06-to-the-root.ts:696, and has a narrow-J stopping in the forearm, :1290) |
| `RADIAL_LOOP.fineMaxR`, `RADIAL_LOOP.frictionFine`, `Region.RadialLoopFine` | src/physics/lumen.ts | 0.3 mm; 2 | a device of radius above 0 and under 0.3 mm (the 0.014 in wire, 0.18 mm; not a 0.035 in wire, 0.44 mm) meets the loop with wall-friction scale 2 instead of 8; the lumen query reports the loop's fine region for it, the tube samples stay `RadialLoop` | MODEL PARAMETER: a fine wire, a small part of the loop's 1.18 mm lumen, meets less of the turn's grip. Tuning (route.test.ts starts, 60 mm push): at scale 8 the 0.014 in wire stalls 12 to 16 mm short of the exit; at 5 it stalls 3 to 6 mm short; at 3, 2, 1.5 and 1 it passes 11 to 20 mm beyond the exit in 5 of 5; 2 leaves margin. The J stalls in 5 of 5 at 8 |

The straightened loop (`LumenSet.setLoopStraighten`, 0 the turn, 1 straight): each loop sample moves towards the artery's own course from the junction and the lift goes with the turn; at 1 the route is about 28 mm shorter. Not a model parameter: the geometry of `RADIAL_LOOP` itself.

## Wires (catheterShapes.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `NARROWJ` | src/physics/catheterShapes.ts | J of 1.5 mm radius (one arc of π·1.5 mm turning 180°); core 13 GPa, floppy 30 mm at 3%, transition 40 mm | mm; MPa | the J radius from the module text (above); core and tip MODEL PARAMETERS, the standard J wire's |
| `J300` | src/physics/catheterShapes.ts | length 3000; J and core as the standard J wire | mm | the length from the module text (above); the rest MODEL PARAMETERS, the standard J wire's |

## The lab's route mechanics (physicsDevices.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ROUTE_START` | src/ui/physics/physicsDevices.ts | catheterBeyondSheathMm 5, wireLeadMm 25 | mm | MODEL PARAMETERS: a sheath start, the catheter just out of the sheath tip with the J wire leading it |
| `MP_INSERTION_HYSTERESIS_MM` | src/ui/physics/physicsDevices.ts | 6 | mm | MODEL PARAMETER: from the sheath, the reported insertion falls only once the catheter has come back this far (the shaft shortens by a few millimetres under the hand's load against a catch; the session reads any fall with the wire leading as a withdrawal over the wire) |
| `MP_ROUTE_LED.notLeadingMm` | src/ui/physics/physicsDevices.ts | 2 | mm the catheter tip may be beyond the wire tip before it is not led | MODEL PARAMETER |
| `MP_ROUTE_LED.rootMarginMm` | src/ui/physics/physicsDevices.ts | 15 | mm short of the root top along the route | MODEL PARAMETER: where "in the route" ends |
| `MP_ROUTE_LED.noWireDistalMm` | src/ui/physics/physicsDevices.ts | 20 | mm | MODEL PARAMETER: with no wire in the catheter, the distal length whose wall load the dissection accumulator counts |
| `MP_ROUTE_LED.dissectionNs` | src/ui/physics/physicsDevices.ts | 2 | N·s of wall load on the catheter beyond the wire tip while it is pushed in the route | MODEL PARAMETER: a 20 mm advance beyond the wire tip in the iliac gives about 0.09 N·s (physicsDevices.route.test.ts), so a single short slip does not dissect and sustained pushing beyond the wire does |
| `MP_ROUTE_LED.lvBelowValveMm` | src/ui/physics/physicsDevices.ts | 4 | mm below the valve plane | MODEL PARAMETER: the wire tip this deep, in the LV lumen, is in the ventricle |
| `MP_ROUTE_LED.stallWindowS`, `stallPushMm`, `stallProgressMm` | src/ui/physics/physicsDevices.ts | 1; 6; 2 | s; mm pushed in the window; mm the tip moved on | MODEL PARAMETERS: a stall |
| `MP_ROUTE_LED.loopNearMm` | src/ui/physics/physicsDevices.ts | 10 | mm before the loop's first sample | MODEL PARAMETER: a tip this close is at the loop |
| `MP_ROUTE_LED.forceN`, `perforationNs` | src/ui/physics/physicsDevices.ts | 3; 4 | N of hub load; N·s above it, integrated while stalled in the forearm | MODEL PARAMETERS: about three seconds of pushing at the grip limit against the loop perforates a forearm branch |
| `MP_ROUTE_LED.sealMm` | src/ui/physics/physicsDevices.ts | 10 | mm the catheter tip must be beyond the perforation to cover it | MODEL PARAMETER (the sealing itself is the module text's, above) |
| `MP_ROUTE_LED.batStraightenPerMm` | src/ui/physics/physicsDevices.ts | 1/30 | of the loop's straightening per mm the assembly is advanced through it | MODEL PARAMETER: about the loop's own length of advance straightens it (the contact model of balloon-assisted tracking: the balloon covers the catheter's leading edge, so the assembly takes the loop straight rather than catching in it) |
| `MP_ROUTE_LED.loopSendStep` | src/ui/physics/physicsDevices.ts | 0.02 | of the loop's straightening | MODEL PARAMETER (solver cost, not anatomy): the lumens on both threads are given the straightening rounded to this step, and exactly 1 once it is within half a step of straight, so they rebuild a few dozen times over a crossing instead of every frame. Rounding down at the last step (0.98 for a straightening of 0.9999) left a residual curl that held the catheter 14 mm into the loop's exit in the perforation test; the snap to 1 removes it |
| `ROUTE_WIRE_INSIDE_MM` | src/ui/physics/physicsDevices.ts | 5 | mm inside the catheter tip | MODEL PARAMETER: where a newly chosen wire is put, for the hand to take on |

The exchange from a sheath start: over a wire that is not exchange length (`ROUTE_WIRES[].exchange`) the wire comes out with the catheter and the new catheter starts at the sheath again over it (`routeLostExchanges`); over the 260 or 300 cm wire the exchange keeps the wire in the aorta as before. A case that opens at the root keeps the lab's exchange as it was.

## The route session module (modules/route.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_ROUTE_MODULE.holdS` | src/ui/sim/modules/route.ts | wire-not-leading 6, dissection 600, wire-in-lv 2, wire-resistance 20, radial-loop 120, new-narrowing(-tortuous) 120, perforation and haematoma 600, air 30 | s each event stays raised after it was last reported | MODEL PARAMETERS |
| `MP_ROUTE_MODULE.dryConnectionAirMl` | src/ui/sim/modules/route.ts | 0.3 | mL of air in the line from a dry connection | MODEL PARAMETER (the transducer's air model damps the trace with it) |
| `MP_ROUTE_MODULE.puffMl` | src/ui/sim/modules/route.ts | 3 | mL of contrast per puff, booked to the patient engine | MODEL PARAMETER |
| `MP_ROUTE_MODULE.puffS` | src/ui/sim/modules/route.ts | rise 0.4, hold 1.2, fade 2 | s | MODEL PARAMETERS of the drawing (the access lab's puff envelope) |
| `MP_ROUTE_MODULE.sheathPuffMm` | src/ui/sim/modules/route.ts | radial 230, femoral 140 | mm up the artery from the sheath tip | MODEL PARAMETERS: radial long enough to fill the radial loop's place at the radial-brachial junction |
| `MP_ROUTE_MODULE.catheterPuffMm` | src/ui/sim/modules/route.ts | ahead 120, back 40 | mm | MODEL PARAMETERS |
| `MP_ROUTE_MODULE.pseudolesionAt` | src/ui/sim/modules/route.ts | 0.5 | of the loop's straightening | MODEL PARAMETER: from here a puff through the catheter shows the accordion narrowings and the question is asked |
| (behaviour) what a puff shows | src/ui/sim/modules/route.ts `RouteControl.look` | at full strength with fluoroscopy or cine on, once per puff | | Not a number: the step log records what the image showed (the loop, the straightened loop's narrowings, a dissection's stain, extravasation) and the module raises radial-loop, new-narrowing(-tortuous), dissection and perforation only then; the pseudolesion question is asked only then. The stretch a puff covers is the drawing's (`puffShows`: side arm 0 to `sheathPuffMm` + 5 mm; catheter `fromS` − back − 5 to `fromS` + ahead + 5 mm). Haematoma is raised at the perforation's onset (the swelling shows without an image) |
| `MP_ROUTE_MODULE.iodineShare` | src/ui/sim/modules/route.ts | sheath 0.8, catheter 0.8 | of the syringe's iodine in the limb artery | MODEL PARAMETERS of the drawing: both are hand puffs into the same forearm artery, so both take the access lab's forearm angiogram share (`MP_RADIAL_SEQUENCE.angioIodineShare`, 0.8). The side arm first took AccessFluoroView's side-arm value (0.5); the in-app check of 10 October 2026 found the loop too faint to read at the forearm station of the diagnostic lab's 25 cm field (the puff's change was at the frame noise, 5 x 5 blocks), so it was raised to the catheter's share. The access lab keeps its own values |

The ectopy from a wire in the ventricle uses the patient engine's own chance per beat (`MP_ENGINE.pvcPerBeatLvContact`, src/simulation/patient/engine.ts) with a generator seeded by the case; no new value. It counts only while the catheter tip is not in the ventricle (`RouteMechanics.lvContact`): with the catheter tip there (a pigtail for ventriculography) the engine's own TipInput.lvContact already counts the contact, so the beats are not counted twice.

## The drawing (access route.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_PSEUDOLESION` | src/simulation/access/route.ts | waists 3, depth 0.5, widthMm 2.5, beforeMm 6, afterMm 30 | count; fraction of the lumen at full straightening; mm | MODEL PARAMETERS of the drawing: the narrow waists of the straightened loop |
| `MP_DISSECTION_DRAW` | src/simulation/access/route.ts | lenMm 22, offsetMm 1.6, rMm 0.7, densityShare 0.8 | mm; share of the lumen's iodine density | MODEL PARAMETERS of the drawing: contrast held in the wall beside the lumen |

## Not model parameters

- The balloon pressures the Route tab offers (2, 3, 4, 5, 6, 8, 10 atm, `BAT_ATM` in src/ui/lab/controls/tabs/RouteTab.tsx) are choices; only 3–6 atm (the module text's) straightens the loop.
- The table station the image follows ('Follow the wire': the station of the access route nearest the leading tip) uses the access route's stations (`buildRoute3D`).

## Realism re-capture (src/ui/sim/FluoroView.tsx is a renderer file)

The FluoroView change is additive: it pans to a limb station and adds the limb and the puffs only while the route module reports a station or a puff (a case that opens at the sheath), so every other case draws as before. The baseline set was re-captured on 10 October 2026 after the change as `route-wire-led` (`__xrayCapture.baseline("route-wire-led")`, then `live("diagnostic", …)` and `live("pci", …)` with each lab open, the tab emulating 1600 x 1000, the catheter mechanics setting at its default), scored with `python3 scripts/realism/report.py route-wire-led` and compared with `python3 scripts/realism/compare_sets.py baseline route-wire-led`: 189 of 236 in both, every section unchanged, no row lost and none gained, so no row was re-scored.
