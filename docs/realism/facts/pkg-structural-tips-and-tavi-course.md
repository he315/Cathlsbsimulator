# structural-tips-and-tavi-course: model parameters

The TAVI post-deployment course (`taviCourse` and its constants in `src/simulation/tavi.ts`), the coronary obstruction scenario and the structural tip context. Every number in `COURSE` is a MODEL PARAMETER chosen for teaching, not a value from the sources. The qualitative features follow lesson hb-tavi-coronary (Ribeiro's registry, Brilakis 29.1): persistent hypotension with ECG change after deployment, usually of the left coronary, recognised by a root injection and treated by rescue PCI; the request hb-tavi#5 asks for a root injection within the first minute.

## The course (tavi.ts `COURSE`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `durationS`, `stepS` | src/simulation/tavi.ts | 360, 1 | s | MODEL PARAMETER: length and sampling step of the modelled course |
| `baselineMap`, `baselinePulse`, `baselineHr` | src/simulation/tavi.ts | 85, 50, 72 | mmHg, mmHg, bpm | MODEL PARAMETER: resting mean pressure, pulse pressure and heart rate |
| `rapidPacingTailS`, `rapidPacingHr`, `rapidPacingMap` | src/simulation/tavi.ts | 5, 180, 45 | s, bpm, mmHg | MODEL PARAMETER: rapid pacing still running when a balloon-expandable valve is released |
| `unpacedStartMap` | src/simulation/tavi.ts | 70 | mmHg | MODEL PARAMETER: mean pressure at release without pacing |
| `recoveryTauS` | src/simulation/tavi.ts | 6 | s | MODEL PARAMETER: time constant of the pressure's return towards its target |
| `obstructionMap`, `obstructionFallPerS`, `obstructionFloorMap` | src/simulation/tavi.ts | 55, 0.05, 35 | mmHg, mmHg/s, mmHg | MODEL PARAMETER: coronary obstruction, the plateau after pacing, its fall and its floor |
| `obstructionStMm`, `stRiseTauS` | src/simulation/tavi.ts | 2.5, 15 | mm, s | MODEL PARAMETER: ST shift in the covered coronary's territory and its time constant |
| `reflowMap`, `reflowTauS`, `stResolveTauS` | src/simulation/tavi.ts | 78, 20, 8 | mmHg, s, s | MODEL PARAMETER: after reflow, the pressure the patient settles at and the time constants |
| `rescueReflowS`, `rescueReflowProtectedS` | src/simulation/tavi.ts | 90, 45 | s | MODEL PARAMETER: from calling the PCI team and surgeon to restored flow; shorter with a protection wire already in the artery |
| `chbOnsetS`, `chbEscapeHr`, `chbMap`, `pacedHr`, `chbAtrialHr` | src/simulation/tavi.ts | 8, 38, 58, 70, 80 | s, bpm, mmHg, bpm, bpm | MODEL PARAMETER: complete heart block after pacing stops (onset, escape rate, mean pressure), the paced rate, and the atrial rate shown on the monitor |
| `ruptureMap`, `ruptureFallPerS`, `ruptureFloorMap` | src/simulation/tavi.ts | 62, 0.08, 40 | mmHg, mmHg/s, mmHg | MODEL PARAMETER: annular rupture, the falling pressure |
| `noiseMmHg` | src/simulation/tavi.ts | 1 | ± mmHg | MODEL PARAMETER: beat-to-beat noise on the mean pressure |

## Scored responses (tavi.ts `COURSE_RESPONSE`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `injectWithinS` | src/simulation/tavi.ts | 60 | s after pacing stops | MODEL PARAMETER, from the request hb-tavi#5 ('within the first minute') and the lesson's 'inject the root at once' (hb-tavi-coronary, check question) |
| `rescueWithinS` | src/simulation/tavi.ts | 60 | s after the injection | MODEL PARAMETER |
| `paceWithinS` | src/simulation/tavi.ts | 60 | s after the onset of complete heart block | MODEL PARAMETER |
| `lowMapMmHg`, `lowMapHoldS` | src/simulation/tavi.ts | 65, 10 | mmHg, s | The same values as `hypotensionMapMmHg` and `hypotensionHoldS` in src/ui/lab/patientEvents.ts (MODEL PARAMETERS there) |
| `ischaemiaRecoveredS`, `ischaemiaImpairedS` | src/simulation/tavi.ts | 180, 360 | s of ischaemic time | MODEL PARAMETER: bands for the debrief's outcome text |

## The coronary obstruction scenario (tavi.ts `tavi-coronary-obstruction`)

| Setting | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Patient and root | src/simulation/tavi.ts | 83-year-old woman, BSA 1.58 m², LVEF 55%; annulus area 380 mm², perimeter 69.8 mm, diameters 20.2-24.0 mm; left coronary height 9.2 mm, right 13.5 mm; sinus 27.0 mm, STJ 24.6 mm; membranous septum 6.5 mm; severe leaflet calcium, mild LVOT calcium; iliofemoral MLD 6.8 mm | years; m²; %; mm², mm | Model choice (synthetic anatomy): the risk features of hb-tavi-coronary (an older woman, no previous grafts, a balloon-expandable valve, a low left ostium and a narrow sinus) |
| The valve already released | src/simulation/tavi.ts | transfemoral, balloon-expandable 23 mm, depth 3 mm (target and final), rapid pacing, no pre- or post-dilatation, no coronary protection | mm | Model choice: the root was misjudged, so the course shows what obstruction does |
