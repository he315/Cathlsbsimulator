# QA: integration and release check (wave 2, final step)

## Starting point

- The C1 to C5 notes that the task refers to (`docs/realism/wave2/C1.md` to `C5.md`) do not exist. Only
  `docs/realism/facts/C2.md` and `docs/realism/facts/C4.md` were written; `facts/C3.md` and `facts/C5.md`
  are cited from source comments but are missing as well. The integration below was therefore taken from the
  code itself: the C4 development page (`src/ui/team/demo/main.tsx`, which wires the team and `LabAudio`
  "exactly as a lab would"), the `LabAudio` and `Team` headers, and the hand-over types in
  `src/simulation/session/caseSession.ts` (`SessionHandover`, `returnFromLab`).
- C2 built the diagnostic lab shell (`LabLayout`, `DiagnosticLabSession`, `useAttending`, reference monitor,
  QCA, table-side controls). C3 built the PCI engines (`src/simulation/pci/*`, `src/simulation/complications/*`,
  folded into `src/simulation/angioPci.ts`), but no PCI lab shell: `AngioPci.tsx` was still the older page that
  called the legacy `tick` and `inject` and had no patient engine. The PCI integration below is done in that page.
- At the start the real typecheck was clean; the whole suite had 5 failures, all timeouts under a load
  average of 50 to 82 (see "Test timeouts").

## What was integrated

### Team and sound (C4) in both labs

- `src/ui/lab/labTeam.ts` (new): `LabTeam` holds one `Team` and one `LabAudio` per case on the lab's patient
  engine, following the C4 page's frame order: engine events plus dose and lab events go to
  `team.onTelemetry` and `audio.onTelemetry`, then `team.advance(dt)` and `audio.frame()`. One `AudioEngine`
  is shared by the page (`sharedAudioEngine()`), so sound unlocked by a gesture in one lab stays on in the next;
  nothing sounds before the gesture. Protocol orders come back through `onProtocol`; `onEvents` passes every
  frame's events to the attending's recorder.
- Diagnostic lab (`src/ui/sim/labSession.ts`, `src/ui/sim/Simulator.tsx`):
  - the session owns the crew (`session.crew`): C-arm and table ports are the session's `CArmDrive` and
    `TableDrive`, the input port is the S8 input system, the imaging view reads the store and the dose tracker;
  - the exposure tone follows the beam the chain produces (`setPedal` after the time-out gate), not the raw
    pedal; the syringe sound follows the I1 injector; the dose tracker's five-minute signal reaches the team
    (radiographer resets it) and the sound;
  - protocol orders (frame rates 7.5, 15, 30; fields 25, 20, 16, 12; fluoroscopy level; store fluoro) are
    applied to the store and the exposure loop;
  - `TeamBar` sits in the layout's reserved palette slot (Ctrl K or ⌘K palette, Correct and No for open
    read-backs, Turn sound on, mute, mixer); the last three team lines are captioned over the top of the live
    monitor; the debrief modal shows `TeamReport` (closed-loop orders, read-backs, misheard read-backs, warnings
    to the patient, time-stamped findings) under the attending's debrief;
  - `useAttending` records the engine, dose and team telemetry into the case record.
- PCI lab (`src/ui/sections/AngioPci.tsx`):
  - the page now has a patient engine: the case's own after a hand-over, otherwise one per scenario built on the
    scenario's tree and lesions and heparinised at 70 U/kg rounded to 500 U (`SOURCED_DOSES.pciHeparinUPerKg`,
    2011 ACCF/AHA/SCAI table, already sourced in S9 facts), as the scenarios assume;
  - the 4 Hz procedure clock calls C3's `stepPci` (indeflator, pullbacks, complication engine) with the
    engine's true ACT instead of the legacy `tick`, and applies `pciPatientEffects` through C3's
    `patientBridge.applyEffects` plus `tipFromGuide`, so an inflated balloon makes the territory ischaemic
    with ST changes and symptoms on the monitor; leaving the lab removes device occlusions and takes the
    guide out of the ostium, while complication effects stay;
  - a run through the guide goes through `injectPci` (air, dissection extension and ostial injury from the
    push), and the measured volume is given to the engine at the end of each run;
  - the image uses the engine's cardiac clock (`LabImaging` gained a `clock` option; an engine-owned clock is
    advanced by the engine only), so the image beats and breathes with the ECG on the monitor;
  - `HaemoMonitor`, `TeamBar`, captions over the image and `TeamReport` in the result panel; drugs the team
    gives (heparin, protamine, atropine, intracoronary adenosine, verapamil and adrenaline), oxygen and ACT
    results also act on the PCI state (`giveDrug`, `bailout`, `recordAct`); balloon inflations are reported to
    the team (`notifyInflation`) so unwarned inflations are scored; the indeflator sound follows the device.

### Continuous case-session hand-over (C5)

- `LabStart` (`labSession.ts`): the case's `PatientEngine`, the dose so far, the catheter in the aorta, and air
  left in the line or the lumen.
- Diagnostic: `Simulator` takes `start` and `onSession`. The lab runs the case's engine (one clock for heparin,
  ACT, contrast, pressures and rhythm), seeds its dose tracker with the dose so far (`seedDose`; the display and
  the five-minute signal carry on), starts with the case's catheter (pigtail maps to PIG; not counted as a
  catheter change), and skips the pre-brief time-out because the time-out was done in the chart workspace.
  Air left by the table (`line.lineAir`, `line.lumenAir`) goes down the coronary with the first selective
  injection: an air-embolism event in the score, a vagal stimulus and a transient occlusion that clears with
  the C3 air model parameters (`MP_AIR_PER_INSERT_ML`, `MP_AIR_FULL_ML`, `MP_AIR_TAU_S`); a root injection
  disperses it harmlessly.
- PCI: `AngioPci` takes `handover`; same engine and seeded dose; the header shows the heparin still to give and
  the ACT target from the hand-over.
- Return (`src/state/useProcedureStore.ts`): the mounted lab registers a reporter (`setLabReporter`).
  `backToCase` books the lab's own dose (`doseSince`) and calls `returnFromLab(..., { patientAdvanced: true })`
  with the patient time spent in the lab. `CaseSession.returnFromLab` gained `patientAdvanced`: the session
  clock and its slow consequences (haematoma, lumen clotting) catch up without advancing the patient twice, and
  contrast is not added twice because it is already in the engine's total. Before this, `backToCase` read
  `labImaging.diagnostic`, which the new diagnostic lab never sets, and the PCI lab reported no contrast.
- `ProcedureLab` builds the `LabStart` from the hand-over and the store's engine, and its header shows the live
  contrast total (hand-over total plus what this lab has given since).

## Other fixes

- Test timeouts: five smoke and render tests failed only by timing out under load (load average 50 to 82):
  `content.test.ts` (3), `mentor.test.ts` (1), `progress.test.ts` (1). Run alone at normal load they pass in
  0.4 to 1.7 s. Each now has a 240 s per-test timeout; nothing else changed.

## Verification

- Real typecheck (`npx tsc -p tsconfig.app.json --noEmit`): 0 errors.
- New tests, `src/ui/lab/integration.test.ts` (9 tests, all pass): crew on the lab's engine and silent before
  a gesture; heparin order read back, confirmed, given (ACT up by more than 50 s) and recorded; radiographer's
  C-arm order drives the lab's C-arm to LAO 30 cranial 20; silent `LabTeam` report; hand-over uses the case's
  engine, catheter PIG without a catheter change, dose seeded to 310 s and 40 mGy with zero own share; air in the
  line embolises with the first selective injection (score, event, ischaemia) and not with the second; return
  with `patientAdvanced` moves the session clock 60 s with the engine moved once and contrast equal to the
  engine's; seeded dose gives 2 five-minute signals for 610 s; an engine-owned clock is not advanced by
  `LabImaging.tick`.
- Whole suite and build: see "Final counts".
- Browser smoke test (own tab on the dev server, pane hidden, labs stepped through the dev hooks
  `__labStep`, `__fluoroDraw`, `__pciStep`, `__pciDraw`, `__caseSession`; no console errors on any screen):
  - Home, Academy (a module quiz) and Real angiograms (drills and player) render.
  - Diagnostic lab: team bar present; "Nurse, heparin 5,000 units IV" read back by the scrub nurse, confirmed,
    given at the stated clock time, ACT 284 s; "LAO 40 caudal 25" moved the C-arm; F key pedal down and up
    through the input system; seated in the left main, cine with injection: run 1 stored (58 frames) and shown
    on the reference monitor with QCA available; Finish case opened the debrief with the team communication
    summary ("Read-backs you confirmed: 2 of 2").
  - PCI lab: wire to 99 mm across the mid-LAD lesion, 2.5 x 15 mm balloon at 10 atm (LAD ischaemia 0.28, V2
    ST +0.76 mm, chest pain 8.2/10 and the patient complaining), deflate, 3.0 x 18 mm stent at 12 atm, cine run
    (8.5 mL to the engine), final result "Successful, with a complication that was managed", residual 0%,
    team report shown.
  - Full procedure from access: chart, consent, time-out, local, ultrasound radial puncture with arterial
    flashback, wire intraluminal, 6 Fr sheath, heparin 5,000 U, TIG to the root on fluoroscopy, exchange,
    zero, level, trace check (readiness list empty); hand-over to the diagnostic lab ran the same engine with
    TIG and no second time-out; back to the case moved the session clock with the engine (offset between the
    session clock and the patient clock unchanged at -8.0 s across the diagnostic and PCI hand-overs); ad hoc
    PCI showed "heparin still to give: 500 U, ACT target 250-300 s" and the team gave 2,000 U (ACT 261 to 308 s).
  - Haemodynamics lab and IABP, Impella and ECMO render.
- Image path cost on the PCI page (dev build, 1280 px canvas): 14.3 ms per rendered frame including a read-back,
  about 70 frames/s, above the 15 frames/s target; patient, team and sound 0.1 ms per frame.

## Final counts

- Typecheck (`npx tsc -p tsconfig.app.json --noEmit`): 0 errors.
- Whole suite (`npx vitest run`, background, load average about 5 to 23): 67 test files passed, 1 skipped;
  1153 tests passed, 15 skipped, 0 failed; 99.9 s. Before this step: 1139 passed, 5 failed (timeouts), 15
  skipped. After the last two edits (PCI exit clean-up, comments in `labSession.ts`) `src/ui/lab` was rerun:
  21 of 21 pass.
- Build (`npm run build`: `tsc -b` then `vite build`): exit 0, built in 7.2 s. Vite's warning about chunks over
  500 kB (the main bundle at 2.0 MB, the anatomy scene at 0.86 MB) was already there.
- Browser: no console errors on any screen visited; the PCI exit clean-up was checked after a hand-over
  (balloon occlusion `pci:balloon` present while inflated, gone after "back to the case"; tip moved from the
  ostium to the aorta).

## Known limitations

- C1 to C5 notes and the C3 and C5 fact files are missing; any integration step they described beyond what the
  code shows could not be checked.
- There is no PCI lab shell like the diagnostic one: the PCI page keeps its own layout, raw keyboard (no S8
  input system, pedals or hands), button-driven device handling and instant C-arm moves (the radiographer's
  C-arm orders set the angles at once). The C3 equipment workflow (box labels, preparation, valve, guide
  extension, pressure wire, IVUS) exists in `angioPci.ts` but has no controls on the page.
- After a hand-over the PCI lab still runs its scenario lesion (PCI_SCENARIOS), not the full case's anatomy;
  the patient, heparin, ACT, contrast and dose are the case's.
- Air in the line at the hand-over is modelled with C3's air model parameters and lodges in the LAD or the RCA
  at 30% of its length (model parameter); it is not drawn as bubbles on the image.
- The ACT result comes back after the sample clots (about the ACT itself in seconds), so in a hidden pane it
  needs that much stepped time.
- Smoke tests that render whole screens are slow under heavy machine load; they now carry 240 s timeouts.
