# physiology-engine-unify-and-setup: model parameters

The pressure-wire session reducer (`src/simulation/pci/pwSession.ts`), its set-up faults, the wire model (`src/simulation/pci/pressureWire.ts`) and the physiology lab host (`src/ui/sections/PhysiologyLab.tsx`). Later packages (physiology-hyperaemia-and-adenosine, physiology-left-main-and-ostial) added their own constants to pwSession.ts and record them in their own facts files; they are not listed here.

Sourced values carry their location in the code and are not repeated: the sensor about 3 cm from the wire tip (`SENSOR_FROM_TIP_MM` 30 mm; Oxford ch 8 and Brilakis 12.2, lesson pm-physiology-setup); the intracoronary adenosine and GTN doses (`IC_ADENOSINE_LEGACY_UG`, `PW_IC_GTN_UG`, cited in pwSession.ts); the IV adenosine 60-90 s build-up that `MP_IV_RAMP_S` compresses (lesson pm-physiology-indices).

## Set-up faults and readings (pwSession.ts, pressureWire.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_UNZEROED_SD_MMHG` | src/simulation/pci/pwSession.ts | 20 | mmHg (SD of the offset) | MODEL PARAMETER: offset of a wire that has not been zeroed |
| `MP_ZERO_OFFSET_SD_MMHG` | src/simulation/pci/pressureWire.ts | 3 | mmHg (SD) | MODEL PARAMETER: offset left on a wire just zeroed outside the body, removed by equalisation |
| `EQUALISE_MIN_MM` | src/simulation/pci/pressureWire.ts | -1 | mm (negative: inside the guide) | MODEL PARAMETER: the tolerance equalise() has always used, now named |
| `MP_INTRODUCER_LEAK_MMHG` | src/simulation/pci/pwSession.ts | 3 | mmHg | MODEL PARAMETER: an introducer left in the haemostatic valve makes the guide pressure read low by this much |
| `MP_INTRODUCER_TAU_S` | src/simulation/pci/pwSession.ts | 0.05 | s (first-order lag) | MODEL PARAMETER: ... and damps it |
| `MP_AIR_ML` | src/simulation/pci/pwSession.ts | 0.05 | mL | MODEL PARAMETER: air in the aortic line in the 'air-aortic' fault (Transducer.setAir) |
| `MP_GUIDE_CONTRAST` | src/simulation/pci/pwSession.ts | 1 | fraction of the guide | MODEL PARAMETER: contrast filling the guide after an angiographic injection (Transducer.setContrast) |
| `MP_WAVE_LAG` | src/simulation/pci/pwSession.ts | 0.05 | fraction of the cardiac cycle | MODEL PARAMETER: phase lag of Pd behind Pa on the faulty wire of 'offset-waveforms' |
| `MP_MISMATCH_RMS_MMHG` | src/simulation/pci/pwSession.ts | 2 | mmHg (RMS over a beat, means removed) | MODEL PARAMETER, fitted: an undamaged, flushed system with the default line reads about 1, so 2 separates superimposed from mismatched waveforms |
| `MP_LM_LENGTH_MM` | src/simulation/pci/pwSession.ts | 10 | mm beyond the guide tip | MODEL PARAMETER: where the wire tip passes the left main bifurcation |
| `PROXIMAL_LAD` lesion | src/simulation/pci/pwSession.ts | 65% stenosis, 6 mm long at position 0.035 of a 115 mm, 3.2 mm vessel; diffuse 0.08 | %; mm; fraction | Model choice (written case data, not a measured patient): a short proximal lesion within the first centimetre, for the 'sensor parked too deep' fault |

## Timing and classification (pwSession.ts)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_IV_RAMP_S` | src/simulation/pci/pwSession.ts | 20 | s | MODEL PARAMETER: IV adenosine hyperaemia builds over this long, time-compressed from the module's 60-90 s (pm-physiology-indices). The patient engine runs the drug's own onset (pharmacology.ts `ADENOSINE.timeToMaxIvS`) for blood pressure and heart rate |
| `MP_PULLBACK_S` | src/simulation/pci/pwSession.ts | 9 | s | MODEL PARAMETER: a pullback from the distal vessel to the guide tip, time-compressed |
| `MP_REST_H` | src/simulation/pci/pwSession.ts | 0.05 | hyperaemia fraction | MODEL PARAMETER: below this counts as resting |
| `MP_MAX_H` | src/simulation/pci/pwSession.ts | 0.95 | hyperaemia fraction | MODEL PARAMETER: at or above this counts as maximal |
| `MP_PULLBACK_FFR_H` | src/simulation/pci/pwSession.ts | 0.5 | hyperaemia fraction | MODEL PARAMETER: a pullback above this is a hyperaemic (FFR) pullback, else a resting one |
| `MP_MAP_STEP` | src/simulation/pci/pwSession.ts | 0.5 | mmHg | MODEL PARAMETER: the patient's MAP is fed into the case rounded to this step, so physiology.ts's cache stays small |
| `MP_DISTAL_MARGIN` | src/simulation/pci/pwSession.ts | 0.15 | fraction of the vessel | MODEL PARAMETER: a reading counts as distal to every lesion only this far beyond the deepest one |
| `MP_THERMO_DISTAL_X` | src/simulation/pci/pwSession.ts | 0.6 | fraction along the vessel | MODEL PARAMETER: thermodilution needs the sensor at least this far along ('the distal vessel') |
| `PW_EVENT_HOLD_S` | src/simulation/pci/pwSession.ts | 30 | s | Not new: the shared `TRANSIENT_HOLD_S` of eventLog.ts (MODEL PARAMETER there) |

## Lab host (PhysiologyLab.tsx)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MODEL_STEP_S` | src/ui/sections/PhysiologyLab.tsx | 0.02 | s (50 Hz) | MODEL PARAMETER: the engine and the session advance together at this step |
| `MP_GUIDE_ENGAGED_GAP` | src/ui/sections/PhysiologyLab.tsx | 0.8 | open fraction of the ostium (transducer.ts `TipInput.gap`) | MODEL PARAMETER: an engaged guide that does not obstruct the ostium |
| `MP_GUIDE_WEDGE_GAP` | src/ui/sections/PhysiologyLab.tsx | 0.13 | open fraction of the ostium | MODEL PARAMETER: a deeply seated guide; the value tipFromEngagement uses for a deep left guide |
| `MP_PULSE_MMHG` | src/ui/sections/PhysiologyLab.tsx | 45 | mmHg | MODEL PARAMETER: pulse pressure the profile is built with before its MAP is fitted (physiology.ts aorticPressure uses 45) |
| `MP_MIN_REST_HR` | src/ui/sections/PhysiologyLab.tsx | `PATIENT_EVENT_THRESHOLDS.bradycardiaHr` + 5 = 55 | bpm | MODEL PARAMETER: a slow seeded resting rate is raised to this so the bradycardia event (and its adenosine heart-block tip) does not fire before any adenosine is given |
