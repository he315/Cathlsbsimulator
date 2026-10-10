# diag-catheter-kink: model parameters

Torque loss and catheter kinking in the rod mechanics: the torsional brake in a tortuous segment, the kink's latch, growth and undoing (`src/physics/engine.ts`), the tortuous segments of the access route (`src/physics/lumen.ts`), the column behind a kink in the pressure line (`src/simulation/patient/transducer.ts`), the drawn fold (`src/physics/legacyBridge.ts`), and the lab's use of it: scenario start states, the table-side recovery and the events (`src/ui/physics/physicsDevices.ts`).

No source in the module text gives a threshold for kinking: every number below is a MODEL PARAMETER. What the module text does give, and the code follows, is quoted here with its location rather than repeated as a model parameter:

- the signs and causes: a tip that stays still while the hub turns, a trace that damps or disappears; tortuous iliac, aortic or subclavian arteries (eq-sheaths-guides, "Suspect a kink before it happens", Brilakis 5.4.3 and 5.7.4.1; pm-engaging-torque);
- the prevention: a 0.035 or 0.038 in wire inside while manipulating, a long sheath, a catheter 1 Fr smaller than the sheath (pm-engaging, Brilakis 5.4; eq-sheaths-guides 5.3.3.3);
- the sheath lengths: 10 cm the usual length (eq-sheaths-guides, Brilakis 30.1.3), 25 and 45 cm long sheaths (eq-sheaths-guides, Brilakis 4.2.13, 5.4): `DEFAULT_SHEATH_MM` 100 and `LONG_SHEATH_MM` 250, 450 in engine.ts, taken as the length inside the body;
- the escalation and its order: screen the whole catheter; 1 untwist and pass a 0.035 in wire; 2 hold the tip with a snare from a second access, or a cuff on the upper arm for a radial kink below the brachial artery; 3 pressurise the lumen with an inflation device at 3-4 atm; 4 cut the hub and cover the kink with a sheath; 5 bring it out through the arteriotomy (eq-sheaths-guides, "A kinked guide: Brilakis's escalation (5.7.4.1, Fig. 5.21)"; pm-engaging-torque): `KINK_ESCALATION` in physicsDevices.ts;
- no injection or flush through a kinked catheter (pm-engaging-torque).

## The brake and the latch (engine.ts)

The model is opt-in: `KinkSetup.model` is false in `DEFAULT_KINK_SETUP` (engine.ts), so an engine that is never sent `{ kind: "kink-setup", setup: { model: true } }` brakes nothing, runs no tracker and never kinks, whatever its variants. Only `DiagnosticPhysics` (physicsDevices.ts) turns it on. This is a switch, not a model parameter.


| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_KINK_BRAKE` | src/physics/engine.ts | 1e6 | multiple of the blood's spin drag (a braked body's axial rotational mobility is divided by 1 + this) | MODEL PARAMETER: chosen so that three one-way turns store enough twist to kink in the tortuous-iliac geometry in most starts (measured 5 of 5 at segment scales 1.0, 1.2 and 1.4) |
| `MP_KINK_WIRE_BRAKE` | src/physics/engine.ts | 0.02 | factor on the brake with a 0.035 in wire inside across the body | MODEL PARAMETER (the module's "a wire inside transmits manipulation"). Lowered from 0.05 after the in-app check, where the lab's own J wire left 20 mm short of the tip still kinked 3 of 5 JL4 starts; at 0.02 it kinked 1 of 5 there (physicsDevices.kink.test.ts) and 1 of 5 with the wire withdrawn 160 mm into the shaft (kink.test.ts), against 5 of 5 with the wire out |
| `MP_KINK_UNDERSIZE_BRAKE` | src/physics/engine.ts | 0.2 | factor on the brake with a catheter 1 Fr smaller than the sheath | MODEL PARAMETER |
| `MP_KINK_TWIST` | src/physics/engine.ts | 1.3 | rad of twist stored up to the distal end of the tortuous segment | MODEL PARAMETER: below the twist at which the fingers slip on the hub (grip torque 8 N·mm over the shaft's torsional stiffness) |
| `MP_KINK_WIRE_TWIST` | src/physics/engine.ts | 1.6 | factor on `MP_KINK_TWIST` with a 0.035 in wire inside across the segment | MODEL PARAMETER |
| `MP_KINK_WIRE_SEVERITY_MAX` | src/physics/engine.ts | 0.45 | severity 0-1, at most, of a kink with a 0.035 in wire across it (at the latch and as it tightens); its severity is the stored twist over `MP_KINK_WIRE_TWIST` × `MP_KINK_SEVERE_TWIST` | MODEL PARAMETER: the wire splints the lumen, so the shaft folds round it but cannot close on it. Below `MP_KINK_UNTWIST_MAX` and `MP_KINK_WIRE_PASS_MAX`, so a kink over the wire is undone by untwisting or by drawing the wire back and passing it again. Added after the in-app check, where kinks over the wire latched at severity 1.0 against 0.68 without it |
| `MP_KINK_S` | src/physics/engine.ts | 0.8 | s the stored twist stays above `MP_KINK_TWIST` with the tip not following | MODEL PARAMETER (the plan's MP_KINK_S) |
| `MP_KINK_TURNING_RAD`, `MP_KINK_TURNING_S` | src/physics/engine.ts | 0.05; 0.3 | rad of hand rotation the same way as the stored twist; s | MODEL PARAMETERS: the hand must still be turning (a held hub with twist in it does not fold) |
| `MP_KINK_TIP_STILL`, `MP_KINK_TIP_TAU_S` | src/physics/engine.ts | 1.2; 0.5 | rad/s of the tip's spin, averaged; s | MODEL PARAMETERS: the tip does not follow a hub turned at π rad/s |
| `MP_KINK_SEVERE_TWIST` | src/physics/engine.ts | 3.4 | rad of stored twist at severity 1 | MODEL PARAMETER |
| `MP_KINK_MIN_SEVERITY` | src/physics/engine.ts | 0.3 | severity 0-1 at the latch, at least | MODEL PARAMETER |
| `MP_KINK_BEND_RAD` | src/physics/engine.ts | 0.6 | rad of plastic bend added to the kinked joint's rest curvature at severity 1 | MODEL PARAMETER |
| `MP_KINK_EI_FACTOR` | src/physics/engine.ts | 0.4 | fraction of the joint's bending stiffness left in a kink | MODEL PARAMETER |
| `MP_KINK_REF_U` | src/physics/engine.ts | 150 | mm from the tip: the shaft body the tip's rotation is read from | MODEL PARAMETER (proximal to the preformed curves) |
| `MP_TNT_WINDOW_S`, `MP_TNT_HUB_RAD`, `MP_TNT_TIP_FRACTION` | src/physics/engine.ts | 2; 1.5708; 0.25 | s; rad of hub rotation in the window; fraction of it the tip may turn | MODEL PARAMETERS: torque-not-transmitted (the plan's 2 s) |
| `MP_KINK_TRACK_SUBSTEPS` | src/physics/engine.ts | 4 | substeps between tracker runs | MODEL PARAMETER (about 30 Hz at 120 Hz substeps) |

## Undoing the kink (engine.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_KINK_UNTWIST_RAD` | src/physics/engine.ts | 0.5 | rad of hub rotation back against the kinking direction, with the stored twist taken out | MODEL PARAMETER |
| `MP_KINK_UNTWIST_MAX` | src/physics/engine.ts | 0.6 | severity 0-1 that untwisting undoes without the tip held (with a snare or a cuff, any) | MODEL PARAMETER (the module's step 2: hold the tip so the segment can be straightened while untwisting) |
| `MP_KINK_WIRE_PASS_MAX` | src/physics/engine.ts | 0.75 | severity 0-1 a 0.035 in wire passes and straightens; tighter, it stops at the kink | MODEL PARAMETER |
| `MP_KINK_PRESSURISE_MAX` | src/physics/engine.ts | 0.9 | severity 0-1 that pressurising the lumen (the module's 3-4 atm) unwinds | MODEL PARAMETER |

## The tortuous segments (lumen.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `TORTUOUS_REGIONS` | src/physics/lumen.ts | iliac: femoral and iliac regions; subclavian: subclavian and innominate regions | lumen regions of the access route, weight 1 | MODEL PARAMETER: the stretches whose control points the tortuous-iliac and tortuous-subclavian variants displace; without a variant a route has no tortuous segment |

## The trace behind a kink (transducer.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_C_KINK` | src/simulation/patient/transducer.ts | 0.002 | mL/mmHg | MODEL PARAMETER: compliance of the column behind a kink |
| `MP_G_KINK_OPEN` | src/simulation/patient/transducer.ts | 0.02 | mL/s/mmHg at an open lumen, times (1 − kink)² | MODEL PARAMETER: the column's time constant is about 0.2 s at severity 0.3, 0.4 s at 0.5 and seconds near closure |
| `MP_KINK_CLOSED` | src/simulation/patient/transducer.ts | 0.95 | severity 0-1 | MODEL PARAMETER: at or above it the lumen is closed (tipFromPhysics passes 1, a flat line) |

## The drawn fold (legacyBridge.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `KINK_FOLD_MM` | src/physics/legacyBridge.ts | height 3.5, length 4 | mm | MODEL PARAMETERS: the hairpin drawn at the kink's node (the rod's shaft segments are 30 mm or longer) |

## The lab (physicsDevices.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `KINK_STARTS` | src/ui/physics/physicsDevices.ts | diag-kink-radial-forearm: radial region, severity 0.85 | severity 0-1 | MODEL PARAMETER of the scenario: tighter than the wire passes or untwisting alone undoes, so the cuff is the step that works |
| `KINK_WIRE_FEED_MM` | src/ui/physics/physicsDevices.ts | 40 | mm short of the kink | MODEL PARAMETER: a wire fed back into a kinked catheter goes in quickly to here |
| `KINK_WIRE_PASS_MM` | src/ui/physics/physicsDevices.ts | 90 | mm | MODEL PARAMETER: the table-side wire advance |
| `KINK_UNTWIST_TURN_RAD` | src/ui/physics/physicsDevices.ts | 3.1416 | rad per press (half a turn) | MODEL PARAMETER: the module's "rotate gently in the opposite direction"; much further stores twist the other way |
| `KINK_OBSERVE_S` | src/ui/physics/physicsDevices.ts | 2.5 | s | MODEL PARAMETER: when the operator judges an untwist or a wire pass |
| `MP_KINK_INJECT_REFUSE` | src/ui/physics/physicsDevices.ts | 0.5 | severity 0-1 | MODEL PARAMETER: a kink this tight closes the lumen to an injection (the syringe will not push) |
| `MP_TNT_HOLD_S` | src/ui/physics/physicsDevices.ts | 10 | s | MODEL PARAMETER: torque-not-transmitted stays raised this long after the read-out last reported it |
| `MP_KINK_EVENT_HOLD_S` | src/ui/physics/physicsDevices.ts | 1 | s | MODEL PARAMETER: catheter-kink's hold per report (cleared when the kink is undone) |

## Not model parameters (lab behaviour)

- The catheter counts as moving, so that an earlier aspiration no longer stands, only when the hand pushed, pulled or turned it since the last read-out (physicsDevices.ts `readout().moving`). The former test on tip displacement (0.3 mm between read-outs) is removed: with the heart moving, the tip exceeded it within a few frames with the hub held.
- The screening step records `KINK_SCREEN_OBSERVED` (physicsDevices.ts): the lab's field stays over the chest (src/simulation/imaging/carm.ts `TABLE_PARAMS`), so the record does not claim that the whole catheter was on the image.
