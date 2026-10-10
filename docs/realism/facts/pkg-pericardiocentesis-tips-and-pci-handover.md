# pericardiocentesis-tips-and-pci-handover: model parameters

The pericardiocentesis lab's perforation scenarios, the hand-over of a perforated patient from the PCI lab on its PatientEngine (`src/simulation/pericardiocentesis.ts`) and the lab host (`src/ui/bedside/PericardioLab.tsx`).

Sourced teaching points carry their location in the scenario text and are not repeated: immediate drainage for haemodynamic instability after a perforation without waiting for echo (Brilakis 26.2; Oxford ch 10); leaked contrast outlining the sac so fluoroscopy can guide the needle, and echo to size and follow the effusion (Brilakis 26.2); modest volumes of 20-50 mL often relieving tamponade, leaving the drain and repeating the echo (Oxford ch 9); a small effusion in a stable patient may be left because the raised pericardial pressure may help to tamponade the hole (Brilakis). The module gives the direction of that coupling, not a number, so the numbers below are model parameters.

## Leak and hand-over (pericardiocentesis.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `leakStopMmHg` (perforation-unstable) | src/simulation/pericardiocentesis.ts | 40 | mmHg pericardial pressure | MODEL PARAMETER: the leak falls in proportion as the pericardial pressure rises towards this (`leakRate`); high, so the leak barely slows |
| `leakStopMmHg` (perforation-stable-small) | src/simulation/pericardiocentesis.ts | 1.5 | mmHg | MODEL PARAMETER: low, so the small leak stops itself (the pericardial pressure helps to tamponade the hole) |
| `echoAfterS` (perforation-unstable) | src/simulation/pericardiocentesis.ts | 90 | s of lab time | MODEL PARAMETER: the echo machine arrives after this |
| `promptDrainS` (perforation-unstable) | src/simulation/pericardiocentesis.ts | 240 | s of lab time | MODEL PARAMETER: an unstable patient should have the first fluid out within this; scored 10 points as 'Drained promptly' |
| `HANDOVER_LEAK.mlPerS` | src/simulation/pericardiocentesis.ts | 0.35 | mL/s | MODEL PARAMETER: the leak for a hand-over that does not state one, and for the stand-in patient |
| `HANDOVER_LEAK.stopMmHg` | src/simulation/pericardiocentesis.ts | 3.9 | mmHg (engine pericardial pressure) | MODEL PARAMETER, fitted to the engine's own pressure curve (engine.ts `MP_ENGINE.periK`, `periV0`: about 2.6 mmHg at 110 mL, 3.9 at 130, 5.6 at 150): the leak settles near 130 mL, where the patient is hypotensive (MAP about 50) and still needs drainage, short of the collapse beyond about 150 mL |
| `HANDOVER_LEAK.standInArrivalMl` | src/simulation/pericardiocentesis.ts | 110 | mL | MODEL PARAMETER: the stand-in patient (opened from a lesson, no hand-over) arrives at the start of the engine's steep fall, filled at 2 mL/s with the leak left open |
| `ENGINE_SEVERITY_MAP` | src/simulation/pericardiocentesis.ts | from 65, span 35 | mmHg | MODEL PARAMETER (the bedside display's scale): severity from the engine's MAP is none at or above 65 mmHg and full 35 mmHg below it |
| `REGIONAL_PPC_CAP` | src/simulation/pericardiocentesis.ts | 25 | mmHg | MODEL PARAMETER: ceiling on the pericardial pressure read from a loculated collection |
| `REGIONAL_RA_RISE` | src/simulation/pericardiocentesis.ts | 6 | mmHg at full severity | MODEL PARAMETER: with a loculated collection the RA pressure rises with severity from baseline instead of following the pericardial pressure |
| Stand-in patient seed | src/simulation/pericardiocentesis.ts (`standInPerforatedEngine`) | seed 41, stable angina, no coronary disease, sinus rhythm | n/a | Model choice: a neutral patient to carry the perforation |

## The three perforation scenarios (pericardiocentesis.ts `PERIC_SCENARIOS`)

All values are MODEL PARAMETERS of written teaching cases, none a measured patient. Volumes in mL, `bleedRate` in mL/min, pressures in mmHg.

| Scenario | File | Values | Rests on |
|---|---|---|---|
| `from-pci-perforation` | src/simulation/pericardiocentesis.ts | nominal initial volume 180 and bleed rate 60 (for the window score and the fallback; the engine sets the real volume); baseline HR 76, BP 126/72, RA 6; pocket distribution subxiphoid 1.0, apical 0.75, parasternal 0.55, posterior 0.8 | Model choice: the PCI patient continued on its engine |
| `perforation-unstable` | src/simulation/pericardiocentesis.ts | initial volume 156, bleed rate 15; baseline HR 80, BP 124/70, RA 6; distribution 1.0, 0.7, 0.5, 0.8 | Model choice: hypotension minutes after a perforation, echo not yet in the room |
| `perforation-stable-small` | src/simulation/pericardiocentesis.ts | initial volume 50, bleed rate 3; baseline HR 80, BP 120/72, RA 6; distribution 1.0, 0.75, 0.55, 0.8 | Model choice: a small effusion in a comfortable patient (correct answer 'observe') |

## Lab host (PericardioLab.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `SEAL_S` | src/ui/bedside/PericardioLab.tsx | 20 | s | MODEL PARAMETER: from the request until the primary operator has sealed the perforation |
