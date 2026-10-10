# access-multi-site: model parameters

More than one access site in the full case, and the crossover scenario (`src/simulation/session/scenarios/crossover.ts`): a radial case in a heparinised patient whose wire stops in the forearm, finished through the femoral artery. The package added no dose, threshold or device dimension; the ACT and band values it uses are the existing sourced ones (SOURCED_DOSES and FEMORAL, cited in caseSession.ts and closure.ts). The femoral puncture under ultrasound and fluoroscopy in an anticoagulated patient rests on Brilakis 4.1 and Oxford ch 3 ('Anticoagulation issues'), as cited by the tip access-crossover-anticoagulated-care.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `WIRE_STALL_MM` | src/simulation/session/scenarios/crossover.ts | 0.05 | mm per push | MODEL PARAMETER (scenario setting): a push that moves the wire less than this has stalled, which ends the start state's wire drive |
| Wire drive in the start state | src/simulation/session/scenarios/crossover.ts | 1 mm pushes of wire and catheter, 0.033 s per tick, at most 3000 pushes | mm; s; pushes | MODEL PARAMETER (scenario setting): the wire is advanced with the beam on until it stalls in the loop |
| Scenario choices | src/simulation/session/scenarios/crossover.ts | stable angina (indication 'SA'); the radial-loop variant made impassable (`obstructRoute("loop")`); the TIG catheter; start at 'sheath-in' | n/a | MODEL PARAMETERS (scenario settings, none a population value): an elective case can wait out the ACT before the femoral sheath comes out |
