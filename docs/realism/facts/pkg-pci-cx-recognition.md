# pci-cx-recognition: model parameters

Complication recognition in the PCI lab: the recognition gate and the assessment score in the complication engine (`src/simulation/complications/engine.ts`, types in `types.ts`), the assessment action (`src/simulation/pci/actions/step.ts`, `recognisePci`), the tip-context gate and its event sources (`src/ui/lab/pciEvents/recognition.ts`), the form (`src/ui/pci/RecognitionForm.tsx`), the lab wiring (`src/ui/pci/PciLab.tsx`) and the metrics (`src/mentor/metrics.ts`).

No dose, threshold or device dimension is added. The classifications the form asks for are those the engine already uses: NHLBI A-F as listed in `src/simulation/complications/dissection.ts`, Ellis I, II, III and III cavity spilling as in `perforation.ts` and worded as lab request cm-perforation#0 words them, TIMI 0-3. The cause-finding checklist (keep the wire; image the stent edges and the distal vessel in two projections or with IVUS or OCT; check the pressure, the ECG and the ACT) is the lab request cm-flow-embolism#2 and the package design (docs/curriculum/lab-build-plan.json). 'Acute closure' as TIMI 0-1 flow follows lab request cm-principles-closure#2 ('opens with TIMI 0-1 flow') and the Oxford no-reflow grade quoted in the module text ('TIMI 1 or TIMI 0'). Everything below is a MODEL PARAMETER: a mapping or a scoring rule chosen where the text names a grade without saying how the simulator's internal state maps onto it.

## The engine (engine.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_TIMI_FRACTION` | 0.95, 0.7, 0.3 | fraction of the vessel's flow a complication removes, at or above which the flow is TIMI 0, 1, 2 (below the last, TIMI 3) | The engine's own flow-limit fractions (`flowLimit` in dissection.ts: type F 1, E 0.7, D 0.35, C 0.1) placed so that F is TIMI 0, E TIMI 1, D TIMI 2 and A-C TIMI 3; no source gives the mapping |
| TIMI of no-reflow | `timiFor(severity)` in noReflow.ts | grade | The no-reflow module's own severity-to-TIMI rule, unchanged |
| TIMI of thrombus and air | flow fraction 0.6 (embolised), 0.3 x severity (thrombus on the wire), min(1, severity) (air) | fraction | The fractions `patientEffects` already gives the patient engine for these kinds |
| TIMI of a perforation | 3 | grade | The engine models no flow loss from a perforation |
| TIMI of a compromised side branch | its own grade ('TIMI 0-1' accepts 0 or 1) | grade | The side-branch module's grades, unchanged |
| TIMI scoring | exact grade (within a side branch's 0-1 range) | grade | Scoring choice: no tolerance |
| Correct assessment | cause, and the grade the cause asks for (NHLBI type; Ellis grade and location), and the TIMI grade when given, all right | rule | Scoring choice; request cm-perforation#0 asks for 'correct location and grade within one attempt' |
| Embolised thrombus | 'thrombus' or 'no-reflow' both accepted as the cause | rule | Scoring choice: the slow flow of an embolised thrombus is distal embolisation |
| Which complication an answer is scored against | the unrecognised one whose kind the answer names, else the most severe | rule | Scoring choice when two are open at once |
| Time to recognition | from the complication's onset (`t0`, when its first cue appeared) to the submission | s | Design choice ('scored on time to recognition') |
| Perforation location | 'collateral' when the complication's data say so, 'distal' for a distal wire exit (`data.distal`), otherwise 'large vessel' | rule | The perforation module's own distinction between wire exits and device perforations. No engine code sets `data.collateral` yet, so 'collateral' never occurs: the form keeps the option (always wrong for now) and the tip context does not raise `perforation-collateral` |
| What counts as naming | a stage-change note, or a text naming the kind, a grade (NHLBI, Ellis, TIMI) or the morphology a grade is defined by (the defining words of the form's NHLBI and Ellis options, the TIMI definitions, and the modules' descriptions: lucency, haziness, bubbles, jet, chamber, hole, leak, side branch and similar) | rule | The plan: 'texts that name or grade' become labels; morphology words added because the dissection render draws the same false channel for every NHLBI type, so a morphology text would grade it |
| Cues of an unrecognised complication | neutral: what changed and, where it is not itself graded, where (treated segment, ostium, flow beyond the segment); a perforation's cue gives no location; every note of such a complication reaches the live log as type 'cue' | rule | No ground truth on live screens; grading rests on the image |
| When a complication is named | once the learner names its cause correctly; a wrong cause is recorded (attempt 1) and leaves it open, a reassessment counts up the attempt | rule | Scoring choice: a wrong answer must not unlock the true name or its tips |
| Image cues wait for a run | every cue about the angiographic image (all but the aspirate's) of an unrecognised complication is held on `cx.heldCues` and reaches the live log only when a contrast run through the guide shows it: the injection itself (`onInjection`) releases what was held, and the PCI step (`stepPci`) releases changes made while that run's contrast was still in the vessel; a contralateral injection releases nothing | rule | A dissection, a perforation or slow flow is seen only with contrast in the vessel (the module text and the plan: the operator sees it on the next run) |
| `MP_RUN_WINDOW_S` | 3 | s after a guide injection during which a new change is still seen on that run | MODEL PARAMETER: no source gives how long a run's contrast stays in the vessel; chosen as a few cardiac cycles |
| First attempt kept | a reassessment after a wrong cause keeps the first attempt (`recognised.first`: time, cause, delay, correct); the metrics score the first attempt and the debrief shows it, in green only when the first attempt was right | rule | Scoring choice: the metrics and the debrief must agree |
| Assessment log line | the learner's own answer ('Assessed as: ...'), tone info, the same for a right, a wrong and a false-alarm assessment | rule | No score feedback on live screens outside guided aids (the form shows the score in guided practice) |

## The tip context (pciEvents/recognition.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `slow-flow` cue | a live complication leaving TIMI 2 or less in the treated vessel (not a side branch, not a perforation), once a guide run at or after its first sign (or within `MP_RUN_WINDOW_S` before it) has shown it | grade | Slow flow is what the operator sees beyond a flow-limiting lesion on a run; the cue events of the design. The base source's `slow-flow` from the no-reflow mirror (src/ui/lab/pciEvents/base.ts) is not gated by this package |
| `acute-closure` | a live complication leaving TIMI 0-1 in the treated vessel, raised once assessed | grade | As above |
| `aortocoronary-dissection` | an ostial dissection from the guide (`data.ostial`), raised once assessed | rule | The event's vocabulary note (staining at the ostium, sinus or aortic wall) |
| `perforation-large-vessel`, `perforation-distal` | a live perforation at that site, raised once assessed; `perforation-collateral` is not raised until the engine makes collateral perforations | rule | The engine's perforation sites |

## The lab (PciLab.tsx, RecognitionForm.tsx)

| Parameter | Value | Rests on |
|---|---|---|
| Presentation | attending dialogue in the drawer, procedure and hands running, in supervised and independent practice; a dialogue over the lab that holds the procedure clock and the hands in guided practice and exams | LAB_BUILD_PLAN.md section 2: forms block the procedure only in guided mode and exam |
| Attending prompt | guided practice only: the form opens when a complication the learner has not assessed has shown on the image (no image cue of it still held), one complication per prompt, oldest first, and again after an answer naming the wrong cause; the next prompt follows when the form closes, and the prompt says when more than one thing has changed | The design ('or the attending prompt in guided mode'); a guided teaching aid |
| Ellis option wording | I: crater; II: blush, no exit hole of 1 mm or more; III: jet through an exit hole of 1 mm or more; III-CS: spilling into a chamber or vessel | The module's Ellis table (src/content/manual/complication-management/03-perforation.ts) and lab request cm-perforation#0 |
| Score shown after submission | guided practice only; otherwise in the debrief | No ground truth on live screens outside guided aids |
