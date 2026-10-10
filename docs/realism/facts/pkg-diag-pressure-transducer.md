# diag-pressure-transducer: model parameters

The diagnostic lab's pressure line: transducer faults (`src/simulation/patient/transducer.ts`), the physiologist's call-out (`src/ui/lab/labTeam.ts`), the lab session's pressure events (`src/ui/sim/labSession.ts`) and the pressure scenarios (`src/simulation/diagnosticScenarios/pressure.ts`).

Sourced values carry their location in the code and are not repeated as model parameters: the physiologist calls out a systolic below 90 mmHg as a rule of thumb (`MP_CALLOUT_SYSTOLIC_MMHG` 90; Oxford team model, pm-engaging, src/content/manual/pci-manual/07-engaging.ts), which `MP_HYPOTENSION_SYS_MMHG` reuses; thrombus usually comes from the sheath (Brilakis 5.4); side holes on the '-SH' variants and the Tiger-type universal radial curve (Oxford ch 6, pm-engaging); severe aortic stenosis at a valve area of 1.0 cm² or less (ESC/EACTS, hb-specific-conditions, 05-specific-conditions.ts). `BLOOD_DENSITY` 1060 kg/m³ in circulation.ts is physics (the Bernoulli loss across a narrowed orifice).

## Transducer faults (transducer.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_FAULT_AIR_ML` | src/simulation/patient/transducer.ts | 0.1 | mL | MODEL PARAMETER: enough air to overdamp the 100 cm catheter and 150 cm line of DEFAULT_LINE (natural frequency below 5 Hz) |
| `MP_AIR_FAULT_MIN_ML` | src/simulation/patient/transducer.ts | 0.01 | mL | MODEL PARAMETER: air from which the trace is affected and the line counts as faulty |
| `MP_FAULT_DRIFT_MMHG` | src/simulation/patient/transducer.ts | 18 | mmHg | MODEL PARAMETER: the zero offset of an 'unzeroed' fault |
| `MP_FAULT_LOW_CM` | src/simulation/patient/transducer.ts | 15 | cm below (or above, for 'high') the phlebostatic axis | MODEL PARAMETER: about 11 mmHg off through MMHG_PER_CM |
| `MP_LEVEL_TOL_CM` | src/simulation/patient/transducer.ts | 5 | cm | MODEL PARAMETER: further than this from the phlebostatic axis counts as not levelled |
| `MP_FAST_FLUSH_S` | src/simulation/patient/transducer.ts | 0.5 | s | MODEL PARAMETER: length of a fast flush (the square-wave test) |
| `MP_PLUG_R_FACTOR` | src/simulation/patient/transducer.ts | 200 | factor on the catheter's viscous resistance | MODEL PARAMETER: a plug in the lumen low-passes the column (time constant well under a second), damping the trace towards the mean |

## Call-out and session events (labTeam.ts, labSession.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_CALLOUT_HOLD_S` | src/ui/lab/labTeam.ts | 3 | s | MODEL PARAMETER: the displayed systolic must stay below 90 mmHg this long before the call-out |
| `MP_CALLOUT_RECOVER_MMHG` | src/ui/lab/labTeam.ts | 5 | mmHg above the threshold, for `MP_CALLOUT_HOLD_S` | MODEL PARAMETER: the episode ends |
| `MP_HYPOTENSION_HOLD_S` | src/ui/sim/labSession.ts | = `MP_CALLOUT_HOLD_S` (3) | s | MODEL PARAMETER (the physiologist's hold), with the tip free on the true systolic |
| `MP_HOLD_UP_S` | src/ui/sim/labSession.ts | 4 | s after the end of a push | MODEL PARAMETER (the plan's value; not sourced): contrast still in the vessel with the tip obstructing raises 'contrast-hold-up' |
| `MP_HOLD_UP_MAX_S` | src/ui/sim/labSession.ts | 20 | s | MODEL PARAMETER: longest the lab keeps a push's contrast in the vessels while the tip obstructs |
| `MP_HARD_PULL` | src/ui/sim/labSession.ts | 0.85 | pull strength 0-1 | MODEL PARAMETER: a pull this firm against a blocked catheter draws air in; kept above the keyboard's full pull (settings.ts plungerForce 0.7) so only a deliberate full pull does |
| `MP_OSTIAL_POSITION` | src/ui/sim/labSession.ts | 0.06 | position 0-1 along the vessel | MODEL PARAMETER: lesions this close to the origin narrow the ostium around an engaged catheter |
| `MP_PLUG_EMBOLUS` | src/ui/sim/labSession.ts | param 0.3, fraction 1 | position along the LAD or RCA; occlusion fraction | MODEL PARAMETERS: where a flushed plug lodges and how much it occludes |
| `MP_FLUSH_HOLD_BEATS` | src/ui/sim/labSession.ts | 5 | cardiac cycles | MODEL PARAMETER: the engine averages the last 4 beats, so the store's numbers hold their pre-flush values 4 beats plus the beat the flush ended in |
| `MP_SEVERE_AS_AVA_CM2` | src/ui/sim/labSession.ts | 0.7 | cm² | MODEL PARAMETER inside the module's severe band (1.0 cm² or less): the valve area the engine gives a chart's severe aortic stenosis |

## Scenarios (diagnosticScenarios/pressure.ts)

| Setting | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `parkedInsertion` | src/simulation/diagnosticScenarios/pressure.ts | -12 (diag-damping-causes, diag-aspiration-failures, diag-transducer-faults, diag-as-pulse-not-damping) | the simple model's insertion units (negative is withdrawn) | MODEL PARAMETER of the scenario: the catheter parked above the sinus so the case opens with the tip free |
| `heartRateBpm` (diag-transducer-faults) | src/simulation/diagnosticScenarios/pressure.ts | 70 | bpm | MODEL PARAMETER: the centre of generatePatient's heart-rate line, so the patient does not sit near the bradycardia threshold |
| `aorticValveAreaCm2` (diag-as-pulse-not-damping) | src/simulation/diagnosticScenarios/pressure.ts | 0.7 | cm² | MODEL PARAMETER inside the severe band (1.0 cm² or less) |
| Fault presets | src/simulation/diagnosticScenarios/pressure.ts | air in the dome from the start (`MP_FAULT_AIR_ML`, 0.1 mL); the transducer knocked low after the first injection (`MP_FAULT_LOW_CM`, 15 cm) | mL; cm | The transducer MODEL PARAMETERS above |
