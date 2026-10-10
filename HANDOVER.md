# CathMaster: handover for an independent critique

Written 2026-10-06 for a fresh Claude session that has not seen the history of this project. Your job is
to **critique everything here honestly and specifically**, not to build. Read this file first, then the
code. Treat every statement below as a lead to verify, not as fact. It was assembled from read-only
survey agents, an adversarial fact-check of the first draft, and the notes of the agents that wrote the
code; several of those notes turned out to be wrong or stale, and this file may be too.

Contents

1. What you are asked to do
2. What the owner wants (their words)
3. Rules that bind you
4. How to run, inspect and measure (and what not to overwrite)
5. Project map
6. State of each area (leads to verify)
7. How the project got here
8. Which documents to trust
9. Requests that are open or planned
10. The critique: questions, protocol and output

---

## 1. What you are asked to do

The owner, an advanced cardiology fellow, wants an independent, unsparing critique of CathMaster: the
images, the procedures, the teaching and mentoring, the clinical content, the code and architecture, the
process that produced it, and its readiness to go on a **public website** (section 9). They want to know
what is good, what is weak, what is misleading or unsafe, and what to do next, in priority order.

Deliverable: one critique report (structure in section 10) written to `docs/critique/CRITIQUE-<date>.md`,
plus a short summary in chat. **Do not change source code, content or data** unless the owner asks after
reading the critique. Read-only probes, one small capture set under a new name, and targeted tests are
fine.

## 2. What the owner wants (their words)

The overall aim, stated early on: the "be all and end all app" for an advanced fellow learning
angiography and PCI, taking them from novice to independent complex PCI, including structural work,
ECMO, Impella "and everything else".

The request that drives the current phase of work (quoted as typed):

> 1) The angiograms are much better, but it still llooks fake. I want you to make it look absolutely
> 10000% realistic 2) the procedure feels like a gam, i want it to feel real 3) I want this to go beyod
> what is known and what is possible kin professional sim - i waant it to be mind blowingly realistic,
> both in terms of the images but also doing the procedure. I dont care how many tokens you use, bbut
> take this to the next next next next level 4) The whole project should seem like an ultra-realistic
> experience - iw ant to get good at angio and intervention just on my computer without ever needing to
> leave. I want it to be teaching and menotring but als super realistic please

Benchmarks the owner pointed to: the Imperial College SimCath project
(https://www.imperial.ac.uk/engagement-and-simulation-science/our-work/projects/simulated-catheterisation-simcath/)
and a vendor's coronary suite page (https://www.philips.co.uk/healthcare/image-guided-therapy/coronary-suite).
The research plan (`docs/realism/phase1-research-and-plan.json`) also records commercial simulator and
imaging-processing pages used as comparisons.

Earlier requests: a professional visual redesign (done: the "Clinical Graphite" design system); real
angiograms from openly licensed datasets (done: three datasets, `datasets/ATTRIBUTION.md`).

Most recent requests (2026-10-06), not yet started: publishing the app as a normal website, and
building the training around two textbooks and two educators' YouTube channels (section 9).

## 3. Rules that bind you

These are the owner's standing rules for this project. They apply to you and to anything you recommend.

- **Educational tool, not a medical device.** The disclaimer must stay.
- **Never invent citations, figures, guideline numbers or trial results.** If you cite something it must
  be real and checkable. If you say a number in the code is wrong, give the right value and its source, or
  say you do not know.
- **Copyright.** Copyrighted books and videos are sources to learn from and cite, not text to copy. No
  verbatim reproduction beyond short quotations; teaching text must be original.
- **Patient images.** Real angiograms only from openly licensed, de-identified datasets with attribution
  (DOI and licence) and screening for burned-in identifiers. No images from the web, papers or videos.
- **Downloads need the owner's explicit approval** (file name, source, size).
- **Never delete the owner's data or the evidence.** `datasets/raw` (38 GB) and `datasets/extracted`
  (43 GB) are the owner's to delete. `datasets/tmp` (37 GB) is scratch, but it holds about 400 capture sets
  and the realism caches behind the whole scorecard history: do not delete or overwrite it (section 4).
- **No vendor product names in the UI chrome** (navigation, labels, buttons, panel headers). Whether device
  names may appear in lesson and case text is for the owner to decide.
- **British English**, plain prose.
- **Do not modify security software** (Microsoft Defender) or system settings.
- **Not a git repository.** There is no version control; the only backup is a manual snapshot in
  `.backups/2026-10-04-pre-realism`, older than most of the code. Run nothing destructive.
- **Do not touch the owner's learner record.** Never use Settings > reset or clear site data in the
  owner's own browser profile.
- `/Users/qc25212/Downloads/CLAUDE.md` belongs to an unrelated R echocardiography project. Ignore it.

## 4. How to run, inspect and measure

Project root: `/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator` (the path has spaces: quote
it). Stack: React 18, TypeScript (strict), Vite 5, Tailwind, Zustand, WebGL2, three.js with
@react-three/fiber and drei (the 3D anatomy lab only), recharts (competencies screen), Vitest. Browser
only; no backend. Learner data lives in the browser (localStorage and IndexedDB).

### Machine limits

This Mac stalls under load: Microsoft Defender scans the many image files the pipelines write, and
parallel agents with builds, tests and browser captures have repeatedly been killed for making no
progress. Run one heavy thing at a time, keep each command under about two minutes, and put long jobs in
the background. The disk is 98% full (about 11 GiB free on 2026-10-06).

### Commands

| Task | Command or route |
|---|---|
| Dev server | `npm run dev` (port 5173). In Claude Code, use the preview tool with the `cathmaster` entry in `.claude/launch.json`. `vite.config.ts` sets `open: true` (it also opens the system browser) and has no `strictPort`: if 5173 is busy Vite moves to 5174, a different origin with empty storage, so all progress appears lost. `npm run preview` (4173) is another separate origin |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit`, or `npm run typecheck` / `npm run build` (these use `tsc -b`, which follows the project references). `npx tsc --noEmit -p .` checks nothing: the root tsconfig has `files: []` |
| Whole test suite | `npx vitest run` in the background (93 s on 2026-10-06; much longer under load) |
| One test file | `npx vitest run src/render/xray/xray.test.ts` |
| Strict realism gates | `REALISM_STRICT=1 npx vitest run src/render/xray/realism.test.ts` (off by default) |
| Production build | `npm run build` (`dist/` dates from 5 October 21:40 and is older than the source) |

Last run, 2026-10-06 20:24: typecheck clean; whole suite 1,158 passed, 15 skipped (14 strict realism gates
and one per-track check that need environment variables), 0 failed; 67 files passed, 1 skipped. The tail
of that log is in `docs/critique/test-run-2026-10-06.txt`. Vitest strips types without checking them, and
there are no tests that compile shaders or render the UI in a browser (only server-side render smoke
tests).

### Using the labs in a hidden browser pane

When the browser pane is hidden, `requestAnimationFrame` pauses and live labs freeze. A dead-man rule
releases every held key on blur or when the page is hidden, so pedals cannot be held either. Drive the
labs through the development hooks instead:

- Diagnostic lab: `window.__lab`, `__labStep(seconds)`, `__fluoroDraw("cine")`
- PCI lab: `window.__pci`, `__pciStep`, `__pciDraw(bt)`, `__pciLab`, `__pciCrew`
- Full case: `window.__caseSession.tick(s)`, `__accessFluoroDraw`, `__usDraw`
- Renderer: `window.__xray`, `__xrayPerf()` after `__xray.perf.enable(true)`

Keyboard in the diagnostic lab (`src/input/keyboard.ts`): F and C are held pedals (fluoroscopy, cine);
W/S advance and withdraw; A/D roll; Space with Q/E/Z pins; 1-5 move the right hand; J/K/L push, flush and
pull the syringe; arrows move the C-arm. The PCI lab has its own, different keys (`AngioPci.tsx` around
289-316). Difficulty is set in Settings and changes how forgiving catheter engagement is.

### Image measurement, without destroying evidence

- `window.__xrayCapture.standard("<name>")` films the six reference views plus fluoroscopy and flush
  companions. It works only through the dev server (the `/__capture` endpoint). Frames are written flat as
  `datasets/tmp/captures/<name>__<seq>_fNNN.png`; `scripts/realism/report.py <name>` gathers and scores
  them (needs macOS `sips`; pass `--jobs 1` or `2`). **Use a fresh name** such as `rev-20261006`: calling
  `standard()` with no name writes `baseline`, and reusing any existing name (about 400 exist, including
  `baseline`, `c1w0`, `c1f1`, `c1g0`) overwrites the history. `report.py` overwrites
  `datasets/tmp/realism_report.json`; copy it first.
- `scripts/realism/contact_sheet.py --side-by-side` writes into `docs/realism/wave2/C1-sheets/` unless you
  pass `--out <your scratch folder>`. Do pass it.
- Do not run `targets.py` or `npm run realism`: they re-measure the whole 13 GB library.
- Image overrides persist until reload: `window.__sceneOverrides` (every render path, including captures),
  `window.__xrayTune` (FluoroView only: view trainer and diagnostic lab), `__contrastTune`,
  `__injectionTune`. The analytic segment integrator is off by default and is switched on by `?segments=1`
  or, persistently and in production builds too, by localStorage `cathmaster.xraySegments = "1"`. Check
  that key is unset before judging images.

Visual evidence already on disk: `docs/realism/wave2/C1-sheets/C1-compare.png` (start of C1, end of C1,
and the nearest-angle real run; pre-contrast and peak; six views). The real library is browsable in the
app under Learn > Real angiograms (dev or preview server only).

## 5. Project map

407 TypeScript files under `src/` (339 source, 68 test), about 148,800 non-test and 18,200 test lines.
The sidebar has 30 sections in six groups (`src/App.tsx`).

| Area | Where | What it is |
|---|---|---|
| X-ray renderer | `src/render/xray/` | WebGL2 line-integral renderer of an analytic thorax, bones, coronary tree, catheters and wires, with a flat-panel image chain (scatter, noise, MTF, 8-level pyramid processing, auto-window, recursive filter) and automatic dose-rate control |
| Coronary anatomy | `src/render/xray/coronaryAtlas.ts`, `coronaryGrowth.ts`, `heartMotion.ts`, `contrastTransport.ts` | Seeded coronary "genome", growth with SYNTAX labels, clock-driven heart motion, contrast advection |
| Patient engine | `src/simulation/patient/`, `src/simulation/clock/`, `src/simulation/ecg12.ts` | Lumped circulation, 14 drugs, ischaemia, rhythm, 12-lead ECG, transducer, on one cardiac clock |
| Radiation dose | `src/simulation/dose.ts` | Air kerma, KAP, skin-dose map, operator scatter, 5-minute signal (sources in `docs/realism/facts/S6.md`) |
| Diagnostic lab | `src/ui/sim/`, `src/ui/lab/`, `src/state/useSimulatorStore.ts`, `src/simulation/engagement.ts` | Full-screen lab shell with pedals, reference monitor, QCA, hands and syringe, attending, team and audio; catheter behaviour from the legacy analytic tip model |
| PCI lab | `src/ui/sections/AngioPci.tsx`, `src/simulation/angioPci.ts`, `src/simulation/pci/`, `src/simulation/complications/` | Older page with newer engines attached through compatibility shims |
| Full case | `src/ui/sections/ProcedureLab.tsx`, `src/simulation/access/`, `src/simulation/session/caseSession.ts` | Arrival to handover: ultrasound puncture, access fluoroscopy, table steps, hand-over to the labs, closure, recovery |
| Rod physics | `src/physics/` | XPBD Cosserat rod engine for catheters and wires (about 8,200 lines). The rod solver is used by no lab; its lumen geometry (`lumen.ts`) is used by the full case's access route |
| Input | `src/input/` | Hardware input (keyboard, pointer lock, gamepad, MIDI, WebHID, DIY torquer, haptics) used by the diagnostic lab only; its event bus is shared with the team and audio |
| Team and audio | `src/simulation/team/`, `src/audio/`, `src/ui/team/` | Scrub, radiographer, physiologist, sedation nurse and patient voices; closed-loop orders; lab sounds |
| Academy | `src/content/` | 10 tracks, 68 modules, 231 lessons, 542 questions, 51 branching cases, 178 references, 180 glossary terms |
| Mentor | `src/mentor/`, `src/ui/mentor/` | Attending rules, safety stops, PEARLS debrief, standards, telemetry, replay |
| Progression | `src/progress/`, `src/content/mentor/catalogue.ts`, `src/ui/sections/Challenge.tsx`, `CaseLibrary.tsx`, `Analytics.tsx` | 18 EPAs on EAPCI levels I-V, ladders, held-out exams (Assessment screen), logbook |
| Real angiograms | `src/ui/angio/`, `src/ui/sections/RealAngiograms.tsx`, `scripts/angio_library/`, `datasets/` | 731 patients or studies, 4,718 runs, about 215,000 frames from CADICA (CC BY 4.0), CoronaryDominance (CC0) and AngioCAD (CC BY 4.0); nine reading drills, exams, cases, a real-or-simulated drill |
| Calculators | `src/ui/sections/Calculators.tsx`, `src/simulation/calc.ts` | Patient-specific outputs with colour coding: BSA, Fick, SVR/PVR, PAPi, cardiac power, Qp:Qs, Gorlin and Hakki valve areas, CKD-EPI eGFR, maximum contrast, Mehran score |
| Other labs | `src/ui/sections/` (HaemoLab, McsLab, StructuralLab, BedsideLab, PciBench, PhysiologyLab), `src/ui/structural/`, `src/ui/bedside/`, `src/ui/mcs/` | Haemodynamics, IABP/Impella/ECMO, TAVI/TEER/LAAO, pacing, pericardiocentesis, IVUS/OCT bench, pressure wire: interactive engines with SVG schematics |
| Legacy screens | Skills group (Anatomy lab, Catheters and wires, Pressure safety, Pathology), View trainer, Daily plan, Angio curriculum | Run on the July case library (`src/simulation/caseGenerator.ts`) and the legacy 365-day curriculum |
| Realism harness | `scripts/realism/`, `src/dev/xrayCapture.ts`, `datasets/library/realism_targets.json` | Capture, matched JPEG pipeline, 1,765 targets measured on real runs, scorecard |
| Notes | `docs/realism/` | Research plan; wave 1 notes S0, S2, S2b, S3, S4, S6, S7, S8, S9, S11, S13; wave 2 notes I1-I4, C1, QA; `facts/` files listing each constant's source |

## 6. State of each area (leads to verify)

Status words: working, partial, unwired (built but not reachable from the app), stub, broken. File and line
references are from 2026-10-06 and may drift.

### 6.1 X-ray images

What exists: an exact per-ray line-integral renderer with lung carving, procedural lung texture, bone with
trabecular texture, an always-on thorax segment pass (ribs, cartilage, pulmonary vessels), ribbon tubes
for vessels and devices, and a full flat-panel chain. Calibration is against real cine through a scorecard.

**Scorecard history** (rows inside the real band): baseline 133 of 229; I1 step 1 154 of 228; I1 step 2
171 of 235; start of C1 (`c1w0`) 169 of 235; end of C1 (`c1f1`, the documented hand-off) 183 of 235; a
later set `c1g0` (5 October 22:17, undocumented) 186 of 236. **Seven renderer and harness files were then
edited between 22:26 and 22:34** (`sceneBuilder.ts`, `thorax.ts`, `thorax.test.ts`, `xrayCapture.ts`,
`XrayRenderer.ts`, `systemProfiles.ts`, `pyramid.ts`), after the last note and capture, so **no scorecard
measures the code as it stands**, and no note says what changed. Find out what those edits did.

**How a row passes:** the simulator median lies within p10-p90 of the real runs, or within the full
observed range when there are fewer than 10 (`scripts/realism/targets.py`, `report.py`); each metric is
judged alone. Nobody has scored a held-out real run against the targets, so there is no real-versus-real
ceiling. C1 rejected a 192 of 235 variant because the lungs looked cloud-like (`docs/realism/wave2/C1.md`
around line 116), which shows score and appearance can diverge.

Leads:

- **No human test of realism.** Nobody outside the build has done the blinded real-or-simulated drill, and
  its 30 simulated clips predate C1.
- **The scorecard is narrow and may be overfitted.** Two synthetic patients, six views at 768 px and a
  20 cm field, no devices, steady-state exposure, targets mainly from one vendor's images; several bands
  rest on 3 to 5 real runs. Two runs that differed only in dome height scored 187 and 183, with nine
  borderline rows flipping each way. Almost every constant changed in C1 is a model parameter fitted to it
  (`docs/realism/facts/C1.md`).
- **Largest failures at peak opacification:** left coronary trees too narrow and too little of the frame
  opacified; RCA over-contrasted; cardiac motion wrong in both directions (too much in RCA views, about
  half the real LAD cross-axis motion); lung texture spectrum and thin lines; tree extent and tortuosity
  (`docs/realism/wave2/C1-scorecard.md`).
- **Background reads as procedural:** mottled lung noise, perfectly elliptical diaphragm domes, a spine of
  stacked cylinders, a round right atrium, a dark ring over the spine in LAO cranial.
- **Catheter and wire course are synthetic.** Both coronary labs use the legacy root-tethered catheter
  path (`legacyCatheter: true` at `src/ui/sim/FluoroView.tsx:162,193` and `AngioPci.tsx:888`); the
  diagnostic lab draws a straight two-point wire (`FluoroView.tsx:128`), which the research plan said to
  remove. A passing test records that, with the vertical aortic root the renderer draws, engaged Judkins
  left shapes sit a median 3.74 mm from real silhouettes, and that a fitted root orientation exists but is
  not applied by the renderer (`src/physics` engaged-shape tests).
- **About 4,000 lines of the analytic segment integrator are off by default**
  (`SEGMENTS_DEFAULT = false`, `sceneBuilder.ts:217`). It is the only source of motion blur,
  motion-compensated recursion, focal-spot blur and strut-level stents; it widened vessels and cost 5 to
  11 ms per frame, so it was left off. Two geometry paths now have to be kept in step.
- **The scorecard does not measure what the trainee sees.** Captures omit PCI devices, closed-loop dose
  control, the patient clock and the diagnostic lab's render path (compare `src/dev/xrayCapture.ts`
  around 206 with `AngioPci.tsx` around 826 and `FluoroView.tsx` 115-205).
- **Physics simplifications on the default path:** bone shares the soft-tissue channel (a bone gain is
  computed in `adrc.ts` but never read), so bone contrast does not change with kV; no focal-spot blur, beam
  hardening or detector lag; the iodine attenuation constant (`thorax.ts`, `MU.iodinePerMg`) has no cited
  source.
- **Performance:** a pipelined `render()` benchmark on an Apple M4 gave 7.5 ms per frame at 768 px and
  13.1 ms at 1024 px (scenes pre-built, one read-back at the end). That is not the lab's frame time: capture
  mode measured 1.3-2.0 ms scene plus 21.6-22.4 ms render, and the PCI lab's draw was about 20 ms at
  1024 px in I1. No fallback below 768 px; synchronous GPU read-back per exposed frame in the diagnostic
  lab.
- **Imaging profiles B and C** (other vendors' processing) are stale and cannot be selected from the UI.

### 6.2 Patient, anatomy and physiology

What exists: a seeded patient drawn from AngioCAD clinical rows (376 of 412), a lumped circulation on a
shared cardiac clock, 14 drugs, ischaemia, necrosis, rhythm hazards, a 12-lead ECG from a
vectorcardiogram through Dower lead vectors, and a transducer model. It is wired into the diagnostic lab,
the PCI lab and the full case, with a shared haemodynamic monitor. The facts files separate cited
constants from labelled model parameters.

Leads:

- **Successful PCI does not change the patient engine.** The scenario lesions given to the engine
  (`AngioPci.tsx:138`) change only through `setCoronaryTree` (`engine.ts:486`), which nothing outside a
  test calls. `patientBridge` handles only occlusions the procedure itself causes. Meanwhile the image tree
  is rebuilt from the post-PCI lumen, so after stenting the image and the physiology diverge: the STEMI
  culprit stays occluded in the engine. Inferred from code; test it (stent the LCx STEMI and watch the
  monitor).
- **"One patient" is several.** The patient profile, the coronary genome (its own sex and heart size), the
  thorax (its own habitus) and the PCI scenario brief are seeded independently and can contradict each
  other.
- **The image does not follow the physiology.** No lab passes engine flow to contrast transport, so
  opacification ignores the engine's pressure, heart rate, hyperaemia or arrest. (The PCI lab does pass its
  own device state: a balloon stops contrast beyond it, no-reflow slows it.) Heart motion amplitude and the
  ventriculogram ignore LVEF and regional ischaemia. The injector pushes against a fixed 93 mmHg.
- **The diagnostic lab keeps a parallel legacy physiology** (pressure classes; a conus injection that
  always causes VF, forced into the engine) that overrides the engine's own hazard model.
- **Clinical plausibility questions:** necrosis reaches 100% after about 25 minutes of full ischaemia
  (unsourced); stenosis physiology needs stacked unsourced reserve factors to keep resting flow sensible;
  no active atria (no loss of atrial kick in AF, no AV dissociation haemodynamics); the hand-injection limit
  is a plunger force (about 57 N, an assumption) that leaves 6 Fr injections at about 2.8 mL/s near the
  limit, and 5 Fr cannot be chosen; a thin formulary (no antiplatelet loading, GP IIb/IIIa, bivalirudin,
  amiodarone or IV lidocaine).
- The MCS lab runs its own instance of the same circulation model with its own clock; the structural and
  haemodynamics labs use separate engines.

### 6.3 Procedures

Three procedure surfaces on different engines:

- **Diagnostic lab** (Coronary simulators > Cath lab): the most complete. Full-screen shell, pedal-gated
  fluoroscopy and cine, C-arm dynamics, reference monitor with QCA, gloved hands and syringe on the table,
  the attending (pre-brief, time-out, escalation, debrief), team voices and lab audio. But catheter
  behaviour is the legacy analytic tip model whose ostium capture radius and alignment tolerance **scale
  with the difficulty setting** (`src/simulation/engagement.ts:214-218`), and catheter exchange is an
  instant button.
- **PCI lab** (Coronary simulators > PCI in the cath lab): the older page with newer engines attached.
  Device handling goes through compatibility shims (`loadDevice`, `moveDevice`, `inflate`, `deflate` in
  `src/simulation/angioPci.ts` around 836-1020): preparation is instant, there is no delivery physics or
  guide back-out, and inflation and deflation are instant. Of 67 exported functions in `angioPci.ts`, the
  page uses 23; the unused ones include the whole equipment workflow, guide selection and engagement, the
  indeflator, pressure wire, IVUS and lesion estimate. The page shows ground truth: model QCA after the
  first injection, coach read-outs **on by default** (`AngioPci.tsx:113`), wire position against the
  lesion, bold recommended views, and a log that names complications as they happen. Fluoroscopy switches
  on automatically for 900 ms on each device action. No attending, pre-brief or safety stops; the debrief
  is a tick and cross list and the logbook records 100 or 0. "Repeat the case" keeps the previous patient,
  dose and syringes. Displayed balloon and stent pressures come from an "illustrative" table that disagrees
  with the values the engine applies.
- **Full case** (Full procedure): ultrasound puncture, access fluoroscopy on a 1-D wire, a table workspace
  that is a list of named "Do" buttons (including the wrong options by name), hand-over to the diagnostic
  lab (works) and to PCI. **Ad hoc PCI does not treat what was diagnosed:** it opens a fixed scenario
  (`useState(PCI_SCENARIOS[0].id)`, `AngioPci.tsx:108`) with a guide already seated and heparin assumed;
  only the patient engine and dose carry over. The case workspaces have no team voices or audio.
- **Rod physics is built, tested and unused.** Its manoeuvre tests pass on the live geometry: JL4 engages
  from the femoral route, JR4 needs clockwise torque, over-torque whips, a right catheter prolapses in the
  left sinus, a guide backs out when a device is pushed against resistance, Amplatz and JL5 behave as
  expected (`src/physics/manoeuvres*.test.ts`; see the test log). Some problems recorded in
  `docs/realism/wave1/S7.md` (Amplatz read as prolapse, JL5 in dilated roots) therefore look fixed; whether
  a 0.014 wire can be steered into the LAD and whether the solver fits its frame budget are still open. No
  lab imports the solver and no feature flag exists.
- **Input:** pedals, grips, gamepad and MIDI work only in the diagnostic lab; the PCI lab has its own keys,
  so the controls change on conversion to ad hoc PCI. The new haptics never receive a force signal.
- Team equipment orders produce read-backs but never reach the lab's devices.
- Many bail-outs exist in the complication engine without a control: covered stent, coil,
  pericardiocentesis, aspiration thrombectomy, kissing balloon.
- Four PCI scenarios: focal mid-LAD, calcified mid-RCA, LCx STEMI, mid-RCA CTO. No bifurcation, left main,
  graft or imaging-guided optimisation in the lab.

### 6.4 Teaching, mentoring and progression

What exists: a large Academy (numbers in section 5) with a content validator in the test suite; branching
cases (31 synthetic, 20 retold from published case reports with links, with 40 added teaching branches
marked as such); an attending in the diagnostic lab; 18 EPAs with ladders, held-out exams and a logbook;
nine stratified reading drills on the real library with kappa, Brier score and calibration.

Leads:

- **PCI gets no hands-on mentoring** (6.3). PCI attending rules, standards and pre-briefs exist but only
  tests reach them (`src/mentor/rules.ts` 229-315, `standards.ts` 78-84,
  `src/content/mentor/prebriefs.ts` 614).
- **Progression cannot show PCI or structural competence.** PCI, haemodynamics, MCS, structural and bedside
  EPAs stop at level II; the bail-out EPA can reach only level I, from quiz knowledge.
- **Diagnostic levels III and IV rest on the legacy composite score** (65 or more on the legacy catheter
  engine), not on the sourced standards the mentor computes (`src/simulation/scoring.ts:97-106`,
  `src/progress/logbook.ts`). Level IV is labelled "Independent: first operator without direct
  supervision" (`src/progress/competency.ts:78`), while the disclaimer says real angiography must be
  learned under direct expert supervision (`src/data/teachingText.ts`).
- **The debrief loop is broken in practice:** skill cards are announced ("Practice scheduled") but never
  scheduled; self-ratings, the pre-brief plan, take-home and replay are discarded or unwired
  (`src/ui/sim/Simulator.tsx` 250-263, `src/ui/mentor/Debrief.tsx`).
- **Exam integrity:** lesson cine blocks and the real-or-simulated drill show runs from held-out exam
  patients, one with expert lesion boxes on (`src/content/tracks/diagnostic.ts` 1403, 1763; 8 of the 27
  real patients behind the sim clips are held out).
- **References:** all 178 entries carry `verified: true` with no per-entry audit trail; ten spot checks
  were correct. The Jensen 2016 citation in `src/mentor/standards.ts:45` gives pages 1434-1441; PubMed
  (PMID 26547247) gives EuroIntervention 2016;11(13):1503-10. **Four references are private "supplied"
  documents** (`refs.ts`: a commercial PCI handbook PDF, the owner's notes on angiographic views, the
  owner's notes on the Oxford handbook, an annotated atlas), cited about 438 times in the content (271,
  86, 70 and 11). No reader can check them.
- **Copyright exposure:** the commercial PCI handbook PDF sits in `docs/reference/` (not git-ignored); the
  two .docx files there are the owner's own notes. Plain-text extracts of these sources sit in
  `docs/realism/research/ref/` (including `pci.txt`, 196 KB) and in the session scratchpad
  (`/private/tmp/claude-502/.../scratchpad/refs/`), and `docs/AUTHORING.md` tells authors to work from the
  extracts. A 10-word overlap check found 10 teaching lines with runs of 10 to 13 words. Judge whether the
  content heavily citing the commercial handbook is close paraphrase.
- **Attribution:** full CC BY attribution inside the Real angiograms section; lesson cine blocks show only
  dataset name and licence; the datasets are not on the References page; 376 AngioCAD clinical rows are
  compiled into the shipped JavaScript (`src/simulation/patient/angiocadPriors.ts`), which CC BY allows
  with attribution.
- The question bank is mostly easy for an advanced fellow (198 at level 1, 292 at level 2, 52 at level 3);
  some answer-length cueing remains.
- Two parallel curricula (the Academy and the legacy 365-day curriculum) and two coaching systems coexist.
- Learner data is spread across stores that export and reset miss; dates use UTC.
- About 150 explicit dose statements sit in content, mentor and pharmacology files; none has been audited
  against current guidance.

### 6.5 Shell, other labs and release

- **Haemodynamics, MCS, structural, bedside, IVUS/OCT bench and pressure-wire labs** are real interactive
  engines, honestly labelled as teaching models, but their imaging is SVG schematics with slider consoles
  and 0 to 100 scores with floors (for example `McsLab.tsx:107`, `Math.max(40, 100 - harms * 10)`). The
  pacing lab advances a lead on a schematic fluoroscopy view and the Impella console sets pump depth on a
  diagram; nothing uses the X-ray renderer, and there is no ECMO cannulation.
- **Calculators** give patient-specific numbers with good and danger colouring. This is the part most
  likely to be used on a real patient and the part most exposed to being read as medical-device software
  once published; check every formula and threshold.
- **Design system** mostly followed; drift in the bedside labs (canvas glow, scanlines, pulsing LEDs, text
  under 12 px) and about 700 to 760 raw hex colours in `src/ui` (most in the structural diagrams).
- **Vendor names in UI chrome:** the navigation item "IABP · Impella · ECMO" (`App.tsx:81`), the MCS tab
  label and subtitle and the "Impella console" panel header (`McsLab.tsx` 27, 32, 452), the Dashboard card
  "Impella console" (`Dashboard.tsx:53`). Case and lesson text name many devices.
- **Robustness:** no error boundaries (one render exception or a stale chunk after a redeploy blanks the
  app); no WebGL context-loss handling; when WebGL2 or float render targets are missing the diagnostic lab
  silently draws nothing (`FluoroView.tsx:116`), while the PCI and access views show a message.
- **Publishing blockers:** the app builds to a static site of about 5 MB, but the real-angiogram library
  (13 GB, about 217,000 files) is served only by the dev and preview servers through absolute
  `/angio-library` paths. Fonts load from Google. No lint, CI, licence file or favicon. Desktop-only, dark
  only.
- **Dev endpoint:** the dev server's `POST /__capture` (`scripts/vite-angio-library.mjs`) checks neither
  origin nor content type and has no total size limit, so any page open in the same browser could write
  files of up to 20 MB each onto a nearly full disk. Vite is pinned at 5.4.10, which predates published
  dev-server security fixes in later 5.4.x releases; check the advisories. Low severity for a local tool.
- **Navigation sprawl:** 30 sidebar items and several overlapping learning structures; no single path.
- **Dead and duplicate code:** about 1,100 lines of orphaned simulator widgets; a duplicated catheter path
  module; two IVUS engines (bench and in-lab); a second, unreachable pressure-wire front end over the same
  physiology model; two haptics modules; two attending implementations.

### 6.6 Data outside the code

- **Patient-derived images outside the protected folders.** `.gitignore` excludes only
  `datasets/raw|extracted|tmp|library` and `.backups`. Derivatives of real frames also sit in
  `scripts/anatomy_validation/out/` (about 1,900 PNGs, 334 MB) and in the contact sheets under
  `docs/realism/wave2/C1-sheets/`. They would be committed if git were introduced without new exclusions,
  as would `docs/reference/`.
- **Volatile scratch.** About 11 GB of project scratch lives in `/private/tmp/claude-502/` (the previous
  session's scratchpad, about 7 GB, including book extracts and full-text articles; and
  `cathmaster-research`, about 4 GB). `/private/tmp` is cleared on reboot, yet `docs/AUTHORING.md`,
  `docs/realism/wave1/S2.md` and the results files cite paths there. `docs/realism/research/` holds about
  120 one-off scripts with hard-coded paths: history, not a reproducible pipeline.

## 7. How the project got here

Roughly in order (2026):

1. **July:** a diagnostic angiography trainer with schematic projections, an analytic catheter tip model, a
   coach and XP-style gamification (what the README still describes).
2. **Early October:** Academy rebuild (10 tracks); new engines (haemodynamics, pressure wire, PCI bench,
   MCS, structural, bedside); a physically based WebGL2 X-ray renderer replacing the schematic one; a first
   PCI lab.
3. **Real angiograms:** three openly licensed datasets downloaded with the owner's approval, screened,
   converted to 512 px JPEG and built into a library with drills. Comparing the renderer with real runs
   found washout, stenosis-timing, field-centring and ribbon-twist bugs, which were fixed.
4. **Professional redesign** with Claude Design: the Clinical Graphite system.
5. **Realism programme** (after the request in section 2): a research and plan phase
   (`docs/realism/phase1-research-and-plan.json`), which also found and fixed a reversed cranial/caudal
   sign in the projection. Wave 1 ran eleven parallel streams: S0 realism harness, S2 detector and image
   chain, S2b analytic vessel and device integrator, S3 heart motion and coronary morphology, S4 thorax,
   S6 dose-rate control and dose, S7 rod physics, S8 input, S9 patient engine, S11 mentor, S13 reading
   drills. The planned contrast stream did not run; contrast transport was built in wave 2a (I1). Wave 2a
   integrated them (I1-I4).
6. **Wave 2b and its rerun failed:** every parallel agent stalled under machine load. The lab-shell track
   left the diagnostic lab shell (`facts/C2.md`) and the team and audio track left `facts/C4.md`; the PCI
   track's notes (`facts/C3.md`) and the session track's (`facts/C5.md`, `wave2/C5.md`) were never written.
   A single QA agent then integrated the team, audio and hand-over and got the suite green
   (`docs/realism/wave2/QA.md`).
7. **Wave 2c (sequential):** image calibration step 1 (C1) completed (domes, heart silhouette, catheter
   lumen; 183 of 235). Seven renderer files were edited afterwards without notes (6.1). The run then stopped
   when a session ended. What never ran: calibration step 2 (sequences, fluoroscopy versus cine, PCI views,
   performance); rods in the diagnostic lab; the PCI lab on the full-screen shell with the input system,
   equipment workflow, indeflator, physiology console, IVUS and an attending.

Much of the work was written by agents in parallel, sometimes on top of each other's half-finished edits.
Look for seams, duplicates and claims that outran the code.

## 8. Which documents to trust

| Document | Reliability |
|---|---|
| `README.md` | Stale (July): 15 sections, XP and streaks, an old keymap, dead widgets. Do not rely on it |
| `docs/UPGRADE_ROADMAP.md` | Status updates at the top are roughly right for 3-4 October; the body below contradicts them (says PCI is missing, no Vitest) |
| `docs/realism/phase1-research-and-plan.json` | The plan for the realism programme: what was intended, to compare with what was built |
| `docs/realism/wave1/*.md`, `wave2/I1-I4.md` | Per-stream build notes. Mostly accurate about their stream at the time; several listed integration steps were never done; S9's header ("nothing is wired") is now stale |
| `docs/realism/wave2/QA.md` | Accurate for the team, audio and hand-over integration; predates C1 |
| `docs/realism/wave2/C1.md`, `C1-scorecard.md` | The documented end of image calibration step 1. Superseded by the undocumented `c1g0` score and later edits (6.1) |
| `docs/realism/facts/*.md` | Source of each constant. **Two numbering schemes share "C":** `facts/C1.md` is image calibration (wave 2c); `facts/C2.md` (diagnostic lab shell) and `facts/C4.md` (team, patient voice, audio) are wave 2b lab tracks. `facts/C3.md` and `facts/C5.md` are cited from code but do not exist; the PCI complication modules cite no source file at all |
| `datasets/ATTRIBUTION.md` | Dataset sources, licences, changes and screening |
| `docs/SIM_FACTS.md`, `docs/AUTHORING.md` | Content sourcing rules (AUTHORING points at volatile scratch extracts, 6.6) |

## 9. Requests that are open or planned

- **Unfinished realism work:** the items in section 7, step 7.
- **Publishing as a public website.** Proposal so far: a static host for the app; object storage for the
  library, each run repacked as one short video to cut the file count; a sources and licences page for
  CC BY; a configurable library address. Nothing has been done. Judge what else publication needs
  (copyright clean-up, attribution, medical wording, calculators, robustness, privacy).
- **Textbooks and videos.** The owner wants the training built around two textbooks (Brilakis, *Manual of
  Percutaneous Coronary Interventions: A Step-by-Step Approach*, Elsevier; and the Oxford Specialist
  Handbook *Cardiac Catheterization and Coronary Intervention*, 2nd edition, OUP 2020) and the YouTube
  channels of Emmanouil Brilakis (all playlists) and Elias Hanna, taught interactively and step by step,
  with the lab reflecting it. Because of copyright and the patient-image rule, the agreed direction is: map
  every topic and technique from the books' contents pages and the public video titles against the current
  Academy and labs; fill gaps with original teaching and step-by-step interactive lessons tied to lab
  states; cite chapters and link videos as further study; build virtual cases for the techniques; attach
  open-library real cases where they exist. Copying the books or videos in, or taking angiograms from the
  videos, is out; written permission from the publishers or educators would allow more. Note that
  `docs/reference/BRILAKIS_PRINCIPLES.md` (a July design note distilled from the Brilakis manuals and
  channel) already exists. Comment on this plan, and on how the existing reliance on "supplied" sources
  (6.4) should change first.

## 10. The critique: questions, protocol and output

### Questions to answer

1. **Images.** List the observable and measurable differences between the simulated frames and the real
   runs, ranked by how quickly an expert would notice them. State the limits of your own visual judgement;
   do not claim expert perception. Is the scorecard measuring the right things, and is the calibration
   method sound or overfitted? Design the blinded human test that would settle "indistinguishable" (readers,
   number of clips, analysis), using the existing real-or-simulated drill once its clips are refilmed. What
   would most improve realism per unit of effort?
2. **Procedure.** Does a diagnostic study and a PCI feel like a real procedure or a game? List the moments
   that break it (thresholds, instant actions, on-screen answers, missing steps, wrong device behaviour)
   from an operator's point of view.
3. **Clinical accuracy and safety.** Are the physiology, device behaviour, complications, drugs, doses,
   calculators and teaching content correct and current? Flag anything unsafe, wrong, unsourced or
   over-claimed, including the competence labels against the disclaimer.
4. **Teaching and mentoring.** Would this take a fellow from novice to independent complex PCI? What does a
   learner actually get from the attending, debrief, drills and progression, compared with what the code was
   designed to do? Is the competence model defensible?
5. **Architecture and code.** Is the structure sound? Where are the duplicate paths, dead code, risky seams,
   global mutable state, performance traps and missing error handling? What should be deleted, finished or
   redesigned (for example: the segment integrator, the rods, the PCI page)?
6. **Tests and evidence.** Do the tests test what matters? What is claimed without evidence?
7. **Process.** What does the history (parallel agents, stalled runs, missing and stale notes, edits without
   notes, no version control) say about how to run the next phase?
8. **Product.** Is the navigation and scope right for one learner? What should be cut or merged?
9. **Release.** What must change before the public website: licensing, copyright, attribution, privacy,
   medical wording, hosting, robustness, security?
10. **The plan.** Given the owner's goals, what should the next five pieces of work be, in order, and what
    should be stopped? Include your view of the textbook and video plan in section 9.

### Protocol (feasible on this machine)

- **Live app, with a budget.** Drive one diagnostic case (pre-brief to debrief) and one PCI case (the LCx
  STEMI: stent it, then watch the monitor) through the hooks in section 4, taking a screenshot at each
  stage. Then, if time allows, the full procedure with ad hoc PCI and one MCS and one structural case. Say
  plainly which findings come from running the app and which from reading code only.
- **Images.** Use the existing contact sheets and the real library in the app. At most one capture set of
  your own, under a new name, scored with `report.py`, and its sheet written to your scratch folder. That
  also measures the unscored edits in 6.1.
- **References.** Check a stated sample (for example 20, stratified by kind: trial, guideline, consensus,
  paper, book) against PubMed or the DOI, and report the hit rate.
- **Doses.** Sample at least 30 of the dose statements (6.4) across drugs and settings and check them
  against current guidance; report every error.
- **Leads.** Mark each lead in section 6 confirmed, refuted or unclear, with evidence. Then find what the
  surveys missed.
- Respect the machine limits and the evidence rules in section 4.

### Severity

- **Critical:** could teach unsafe practice, breaches a licence or copyright, or loses the owner's data.
- **High:** blocks the owner's stated goals (realistic images, a procedure that feels real, mentoring to
  independent complex PCI) or blocks publication.
- **Medium:** degrades realism, teaching or reliability.
- **Low:** polish.

### Evidence standard

Every finding needs evidence a reader can check: a file and line, a screenshot or capture path, a command
and its output, or a reference that exists. Separate what you observed from what you infer. If a lead in
this document is wrong, say so plainly.

### Output

Write `docs/critique/CRITIQUE-<YYYY-MM-DD>.md` with:

1. A one-page verdict: where CathMaster stands against the owner's goals, in plain terms.
2. Findings ranked by severity, each with area, finding, evidence, why it matters to the owner's goals,
   and the recommended fix with a rough size (small, medium, large).
3. The status of every lead in section 6 (confirmed, refuted, unclear).
4. What is genuinely good and should be kept.
5. The recommended next five pieces of work in order, and what to stop or delete.
6. Open questions only the owner can answer.

Then give the owner a short summary in chat with the path to the file.
