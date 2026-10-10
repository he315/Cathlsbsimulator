# pci-intravascular-imaging: model parameters

The PCI lab's in-lab IVUS and OCT acquisition (`src/simulation/pci/ivus.ts`, `src/simulation/pci/actions/imaging.ts`), the imaging catheter's hand bindings (`src/ui/pci/inputBindings/imaging.ts`), its drawing on fluoroscopy (`src/ui/pci/render/imagingCatheter.ts`), the imaging console (`src/ui/pci/consoles/ImagingConsole.tsx`), the imaging event sources (`src/ui/lab/pciEvents/imaging.ts`) and the enhanced stent view (`src/simulation/imaging/stentEnhance.ts`, offered by `src/ui/lab/ReferenceMonitor.tsx` where the host passes `enhance`). The catheters' profiles, technologies and pullback speeds come from the device catalogue (`src/simulation/pci/equipment.ts`, already sourced). The optimisation thresholds come from `src/simulation/imaging/criteria.ts` (SIM_FACTS section 12). The values the module text gives are cited below; every other value is a MODEL PARAMETER, chosen so that the acquisition behaves as the module text describes, not taken from a source.

## Values from the module text

All from `src/content/manual/pci-manual/15-imaging.ts`.

| Value | File | Value | Source |
|---|---|---|---|
| OCT survey and high-resolution modes | `ivus.ts` `OCT_MODES` | 75 mm at 36 mm/s, 5 frames/mm, 2.1 s; 54 mm at 18 mm/s, 10 frames/mm, 3.0 s | pm-imaging-oct, table 'The two acquisition modes' (Brilakis table 13.3) |
| OCT middle marker at least 57 mm distal to the target | `ivus.ts` `OCT_MIDDLE_MARKER_RULE_MM` | 57 mm | pm-imaging-oct step 2; tip pci-img-oct-marker. The debrief (`imagingDebrief` 'oct-marker') judges what the tip says the rule is for, "so the lesion falls inside the run": the OCT run started with the lens beyond the lesion's distal end and ended proximal to its proximal edge |
| OCT proximal marker 50 mm proximal to the lens | `ivus.ts` `OCT_PROXIMAL_MARKER_MM` | 50 mm | pm-imaging-oct step 2 |
| Least injection rate that clears the lumen | `ivus.ts` `OCT_FLUSH_MIN_ML_S` | 3 mL/s right, 4 mL/s left | pm-imaging-oct 'When the run fails' (Brilakis 13.3.5): "inject at least 3 mL/s in the RCA and 4 mL/s in the left main" |
| Typical injector settings | `ivus.ts` `OCT_FLUSH_TYPICAL`; the console's default | 4 mL/s for 4 s left, 3 mL/s for 3 s right | pm-imaging-oct step 6 |
| Hand injection needs a guide of 6 Fr or more; 5 Fr needs an injector | `ivus.ts` `OCT_HAND_INJECTION_MIN_FRENCH` | 6 Fr | pm-imaging-oct 'Before you start'; equipment.ts `guideHandInjectionMinFrench` |
| OCT purge with undiluted contrast; calibrate, never while purging | `actions/imaging.ts` `purgeImaging`, `calibrateImaging` | rule | pm-imaging-oct steps 3 and 4 |
| Phased-array 'clear view' in a roomy segment or the aorta before crossing; no preparation | `actions/imaging.ts` `clearViewImaging`; `ivus.ts` `newAcquisition` | rule | pm-imaging-ivus step 2 and the catheter-family table |
| Rotational IVUS flushed before use | `ivus.ts` `newAcquisition` (`purged` false) | rule | pm-imaging-ivus table 'Preparation: flush before it enters the body' |
| IVUS motorised pullback speeds | `ivus.ts` `IVUS_PULLBACK_SPEEDS` | rotational 0.5, 1, 10 mm/s; phased-array 0.5, 1 mm/s | pm-imaging-ivus step 3 (Oxford 0.5-1.0 mm/s; Brilakis 1-10 mm/s by catheter); equipment.ts `pullbackMmS` |
| Tight or calcified lesions stop the catheter; forcing kinks it; predilate | `actions/imaging.ts` `advanceImaging` | rule | pm-imaging-ivus; tip pci-img-cannot-cross |
| Phased-array pullbacks jump across tight segments and struts; pull back slowly | `actions/imaging.ts` `startImagingRun` | rule | pm-imaging-ivus; tip pci-img-ivus-jumps |
| A forceful injection drives an unheld catheter and wire distally | `actions/imaging.ts` `octFlush` | rule | pm-imaging-oct 'When the run fails'; tip pci-img-oct-hold-catheter |
| A flush cannot clear an aorto-ostial segment reliably | `ivus.ts` `acquisitionArtefacts` (`ostial`) | rule | pm-imaging-when-which |
| Underexpansion: MSA below 80% of the mean reference, or not above 5.5 mm² (IVUS), 4.5 mm² (OCT), 8 mm² left main | `ivus.ts` `assessedUnderexpanded` (thresholds from criteria.ts) | rule | pm-imaging-optimisation table; SIM_FACTS 12 |
| Fix: non-compliant balloon at least the stent diameter above 18 atm | `ivus.ts` `UNDEREXPANSION_FIX`, `nextStepFor` | 18 atm | pm-imaging-optimisation; tip pci-eqb-postdil-which-balloon |
| Extensive malapposition: 0.4 mm or more, or 1 mm or more long; semi-compliant at low pressure | `ivus.ts` `EXTENSIVE_MALAPPOSITION` | 0.4 mm, 1 mm | pm-imaging-optimisation (Brilakis wording) |
| Edge dissection over 60 degrees and/or over 3 mm: another stent | `ivus.ts` `EDGE_DISSECTION_STENT` | 60 degrees, 3 mm | pm-imaging-optimisation |
| OCT calcium score: arc over 180 degrees 2, thickness over 0.5 mm 1, length over 5 mm 1 | `actions/imaging.ts` `recordCalciumRule`; the console's question | rule | pm-imaging-planning (Fujino; Brilakis figure 13.7); bench/measure.ts `CALCIUM_SCORE_RULE` |
| The OCT flush is a contrast injection through the guide | `actions/imaging.ts` `octFlush`, `flushPsi` | method | It goes through the complications engine's injection hook (`onInjection`: air, extension of a dissection, ostial injury) as a cine injection does. Its pressure is the injection circuit's (`src/simulation/injection.ts` `pressureForFlow` through the guide's lumen with the wire and a device shaft in it, `lumenObstruction(true, true)`), a hand push capped at `MAX_HAND_PRESSURE_PSI`; forceful when the rate reaches `MP_MIGRATION_RATE_ML_S`. No new value |
| X-ray stent enhancement on stored frames | `stentEnhance.ts` | method | pm-imaging-optimisation: "the X-ray stent-enhancement mode or imaging shows a poor result" |

## MODEL PARAMETERS

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_HAND_FLUSH_MAX_ML_S` | `ivus.ts` | 5 Fr 2.5, 6 Fr 4.5, 7 Fr 5.5, 8 Fr 6 | mL/s | The fastest hand flush through each guide with the imaging catheter in it, set so the module's rule holds: by hand a 6 Fr guide reaches the 4 mL/s the left system needs and a 5 Fr guide does not. (The lab's syringe physics, src/simulation/injection.ts, would give less through a 6 Fr guide with a device shaft in it; the rule of the module text is followed instead.) |
| `MP_FLUSH_CLEAR_DELAY_S` | `ivus.ts` | 0.5 | s | From the start of the push to a clear lumen (the trigger); the clear part of a run is the flush duration less this |
| `MP_OSTIAL_UNCLEARED_MM` | `ivus.ts` | 3 | mm from the vessel origin | Length of an aorto-ostial segment a flush cannot clear (the vocabulary's aorto-ostial lesion lies within 3-5 mm of the origin) |
| `MP_OCT_LENS_TO_MIDDLE_MM` | `ivus.ts` | 3 (57 - 54) | mm | Lens to middle marker, so that the module's 57 mm rule is exactly the condition for a 54 mm high-resolution run to reach the target's proximal edge. The module text describes the markers but gives no lens-to-marker distance |
| `MP_TIP_BEYOND_LENS_MM` | `ivus.ts` | rotational 10, phased-array 2.5, OCT 20 | mm | Catheter tip (sheath) beyond the imaging element. The phased-array value is the catalogue's short-tip version (2.5 mm, pm-imaging-when-which); the others are not given |
| `MP_RINGDOWN_MM` | `ivus.ts` | 0.9 | mm | Near field hidden by ring-down without clear view |
| `MP_ROOMY_LUMEN_MM` | `ivus.ts` | 2.5 | mm | Clear view works in a segment at least this wide outside the lesion, or with the catheter still in the guide at the root |
| `MP_CROSS_CLEARANCE_MM`, `MP_CROSS_CALCIUM_MM` | `ivus.ts` | 0.1, 0.3 | mm | The catheter crosses an untreated lesion where the lumen is at least its catalogue profile plus 0.1 mm, plus 0.3 mm in untreated grade 2 calcium. With these the catheters stop at the untreated lad-focal and rca-calcified lesions. The calcium surcharge no longer applies once the lesion is prepared (`actions/imaging.ts` `lesionPrepared`: a balloon or stent inflated in the lesion, or the stenosis less than at the start) |
| `MP_CROSS_PREPARED_GIVE_MM` | `ivus.ts` | 0.4 | mm | In a prepared lesion the catheter crosses where the lumen is at least its profile less 0.4 mm (the cracked plaque gives way). Set so the module's remedy, predilatation with a small balloon (pm-imaging-ivus 'If it will not cross'), works in the calcified case: in rca-calcified the engine leaves a lumen of 0.78 mm after a 2.0 mm semi-compliant balloon at 12 atm, 0.87 mm after 2.5 mm at 12 atm and 0.99 mm after a 3.0 mm non-compliant at 14 atm, which the catalogue's catheters (0.95 to 1.15 mm) then cross; the untreated lesion (0.60 mm) still stops them |
| `MP_FORCE_KINK_PUSHES` | `ivus.ts` | 3 | pushes | Pushes against the stop before the catheter kinks (the module says forcing kinks it, without a number) |
| `MP_IMAGING_WIRE_MARGIN_MM` | `ivus.ts` | 5 | mm | The catheter tip stays this far behind the wire tip |
| `MP_JUMP_SAFE_MM_S`, `MP_JUMP_CLEARANCE_MM` | `ivus.ts` | 0.5, 0.6 | mm/s, mm | A phased-array pullback faster than 0.5 mm/s jumps where the lumen is under its profile plus 0.6 mm or across a stent edge |
| `MP_MIGRATION_RATE_ML_S`, `MP_MIGRATION_MM` | `ivus.ts` | 4, 5 | mL/s, mm | A flush of at least 4 mL/s drives an unheld catheter and wire 5 mm distally |
| `MP_MISCALIBRATION_SCALE` | `ivus.ts` | 1.12 | linear scale | The console's measurements on an OCT catheter not calibrated, or calibrated while purging |
| `MP_DEBRIEF_TOLERANCE` | `actions/imaging.ts` | MSA 0.5 mm², references 15% | | The trainee's MSA counts as measured within 0.5 mm² of the run's (as the bench's MLA tolerance) |
| `SHAFT_MU`, `TRANSDUCER_MM`, `TRANSDUCER_MU`, `MARKER_MM`, `MARKER_MU` | `render/imagingCatheter.ts` | 0.35; rotational 2, phased-array 3, OCT 1.2 mm; 4.5; 1 mm; 3.2 | attenuation, mm | The catheter's polymer shaft (the microcatheter's attenuation), its radiopaque imaging element and marker bands (core.ts's marker attenuation) |
| `MP_MARKER_RADIUS_PX`, `MP_MARKER_CANDIDATES`, `MP_CANDIDATE_FLOOR`, `MP_MARKER_TRACK_PX`, `MP_STRETCH_CLIP` | `stentEnhance.ts` | 2 px, 10, 0.25, 24 px, 1% | | The marker detector (a dark compact blob against its surround), the tracking between frames and the result's contrast stretch. The stretch applies in full within the square about the markers (half-width 0.75 of their separation) and fades linearly to none over the same distance beyond it, so the background is not saturated |
| `MP_MARKER_SEP_MM`, `MP_MAX_FRAMES` | `stentEnhance.ts` | 4-45 mm, 20 frames | mm at the isocentre, frames | The balloon marker separation looked for on a stored run (the catalogue's balloons are 8-38 mm long) and the most frames registered (lowered from 40 after the in-app check: 20 frames of 512 x 512 took about 1.7 s on the main thread) |

## Realism re-capture

The baseline capture set was re-captured after the change as `wp-piv` (9 October 2026, at a 1600 x 1000 viewport: the twelve offscreen sequences of `baselineSpecs("wp-piv")` captured one call at a time through `__xrayCapture.capture` because the development server reloaded the page during a single `baseline()` call; then `live("pci", "wp-piv")` on lad-focal and `live("diagnostic", "wp-piv")`). `python3 scripts/realism/report.py wp-piv`: 189 of 236 rows inside the real band, as the baseline. `python3 scripts/realism/compare_sets.py baseline wp-piv` lists no lost and no gained rows, so no row was re-scored. render/imagingCatheter.ts draws only while an imaging catheter is on the wire (st.device.kind 'ivus'), so the baseline's device scenes and live paths draw the same tubes as before (src/ui/pci/render/imagingCatheter.test.ts checks that it draws nothing for a wire and a balloon).
