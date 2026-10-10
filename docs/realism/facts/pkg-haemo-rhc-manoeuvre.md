# haemo-rhc-manoeuvre: model parameters

The haemodynamics lab's right heart catheter is steered by hand (`src/simulation/rightHeartCatheter.ts`, driven from `src/ui/haemo/CatheterPanel.tsx`, drawn by `src/ui/haemo/RhcFluoro.tsx`). The topology is the pacing lab's chamber-zone model (`src/simulation/pacing.ts`: `nextZone`, `prevZone`, `moveLead`, `rotateLead`, `directionOf`, `ZONE_LEN`, `PERFORATION_PUSH`), used through its exported functions and unchanged. The behaviour follows Oxford's torque-directed technique as taught in hb-cardiac-catheterisation-rhc (Oxford ch 4: Accessing the right heart), the arrhythmia text of hb-background-silhouette and the AF tip of hb-background-general (Oxford ch 10). No dose is given anywhere: the AF and VT management steps are choices without doses, because the haemodynamics lab has no drug engine. Every number below that does not cite the module text is a MODEL PARAMETER, chosen so that the behaviour matches what the module text describes; none is a clinical measurement.

## Rules from the module text

| Rule | File | Source |
|---|---|---|
| The tip can catch in a venous side branch on the femoral passage; withdraw a little and rotate under screening | `rightHeartCatheter.ts` `advance` (trap direction, renal zone; the pacing model's hepatic vein for a lateral tip) | hb-cardiac-catheterisation-rhc step 2 and table; tip haemo-rhc-femoral-side-branch |
| From the femoral vein the RV is entered from a loop formed in the RA (pacing model: RA + lateral push forms the loop; only from the loop does the tip prolapse across the valve) | `pacing.ts` `nextZone` (unchanged), used by `advance` | step 3; tip haemo-rhc-ra-loop |
| Ventricular ectopy on entering the RV | `RHC_P_ECTOPY_ON_ENTRY` | step 4 |
| Forceful manipulation in the RV provokes ectopy and VT, particularly in the outflow tract | `ventricularHazards`, `RHC_ZONE_IRRITABILITY` | table "Ectopy or ventricular tachycardia"; tip haemo-rhc-apex-to-pa; hb-background-silhouette |
| Persistent VT poorly tolerated: synchronised DC cardioversion | `treat` (`sync-cardioversion` ends VT; an unsynchronised shock is noted, not critical: the module text advises synchronised cardioversion and does not call an unsynchronised shock a critical error) | hb-cardiac-catheterisation-rhc table (Oxford complications chapter) |
| PA from the apex: withdraw off the apex, rotate the tip cranially, advance | `advance` (pacing RV inflow + superior → RVOT → PA; the apex is terminal) | step 5; tip haemo-rhc-apex-to-pa |
| A deep breath helps the catheter into the PA and gives a cleaner wedge; wedge on inspiration with a gentle advance until gentle resistance | `RHC_INSP_THRESHOLD`, `RHC_P_RVOT_BOUNCE`, `advance` PA branch | step 7; tip haemo-rhc-wedge-inspiration |
| A multipurpose catheter has no balloon; a balloon-tipped catheter wedges with the balloon up | `advance` PA branch | the lesson's check answer; plan design (lab-build-plan.json) |
| Pushing at the apex only buckles the catheter | `RHC_MAX_PUSH` (below the pacing model's perforation push, so a catheter never perforates in this lab) | the lesson's check stem |
| A soft J wire stiffens the catheter and gives torque | `RHC_WIRE_TORQUE` | step 3 and table |
| A catheter that no longer responds to torque after a long passage is a reason to screen for a knot | `rhcEvents` (catheter-kink with a knot) | "A knotted catheter", step 1 (author's advice in the lesson) |
| Knots follow vigorous, prolonged manipulation | `knotHazard`, `knotRisk` | "A knotted catheter"; tip haemo-rhc-knot |
| Knot bail-out: call for help at once, do not pull tight, try to undo it by advancing the wire, else tighten, bring to the sheath and remove together | `call-help`, `wire-advance`, `pull-tight`, `remove-with-sheath`; critical error `knot-pulled-tight-before-help` | "A knotted catheter" steps 2 to 4; check question; tip haemo-rhc-knot |
| Flush and connect before insertion | `inserted-unflushed` (noted, not critical) | step 1; tip haemo-rhc-flush-and-watch |
| AF from atrial irritation; most episodes stop; severe compromise (rate above 150, hypotension, ...) gets high-flow oxygen and IV heparin then a synchronised shock; milder compromise gets heparin then flecainide without structural heart disease or pulmonary oedema, or amiodarone | `atrialHazard`, `treat`, `rhcDecisions`, `AF_SEVERE_RATE` 150 | tip haemo-bg-af-in-lab (Oxford ch 10); lab request hb-background#5 |
| engage-fail after 45 s without progress, on the femoral passage before the RV is reached (the stage its two tips teach: haemo-rhc-femoral-side-branch, haemo-rhc-ra-loop) | `RHC_ENGAGE_FAIL_S` 45 s, `rhcEvents` | the plan's tipIntegration (lab-build-plan.json); the 45 s and the gating are MODEL PARAMETERS |
| Severe AF scored correct only with oxygen and heparin given before the synchronised shock | `rhcDecisions` | tip haemo-bg-af-in-lab ("then a synchronised shock") |
| A knot undone with the wire is scored correct only when help was called first | `rhcDecisions` | "A knotted catheter" step 2 (call for help at once) |

## MODEL PARAMETERS

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `RHC_ZONE_LEN` | `rightHeartCatheter.ts` | renal 3, wedge 1 | model cm | Lengths on the same scale as the pacing model's ZONE_LEN; a side branch is short, the wedge is the last centimetre |
| `RHC_GENTLE_CM` | `rightHeartCatheter.ts` | 1 | model cm | An advance of this much or less counts as gentle |
| `RHC_STEP` | `rightHeartCatheter.ts` | gentle 0.5, firm 2 | model cm | The two advance buttons |
| `RHC_MAX_PUSH` | `rightHeartCatheter.ts` | 0.9 × PERFORATION_PUSH (1.35) | model cm | Keeps the catheter buckling rather than perforating (perforation is not part of this package) |
| `RHC_TORQUE` | `rightHeartCatheter.ts` | multipurpose 0.85, balloon 0.5, pigtail 0.7 | share of hub rotation | A torque-directed catheter transmits well; a flotation catheter poorly |
| `RHC_WIRE_TORQUE` | `rightHeartCatheter.ts` | +0.1 (capped at 0.95) | share | The wire adds torque (lesson step 3) |
| `RHC_KINK_WINDUP_DEG` | `rightHeartCatheter.ts` | 360 | degrees | Stored shaft rotation at which the tip no longer follows (catheter-kink) |
| `RHC_WINDUP_RELAX_S` | `rightHeartCatheter.ts` | 15 | s | Time constant of the stored rotation relaxing |
| `RHC_SIDE_BRANCH_P` | `rightHeartCatheter.ts` | multipurpose 0.3, balloon 0.15, pigtail 0.2 | probability per first femoral passage | How often the first passage catches a branch; the preset rhc-femoral-mp sets 1 so the learner meets it |
| `RHC_BALLOON_UP_SIDE_BRANCH` | `rightHeartCatheter.ts` | 0.3 | multiplier | A floating balloon catches less |
| `RHC_P_ECTOPY`, `RHC_P_ECTOPY_ON_ENTRY` | `rightHeartCatheter.ts` | 0.25 × force × weight; 0.8 on entry | probability per manipulation | Ectopy common with work in the RV and on entering it |
| `RHC_P_VT` | `rightHeartCatheter.ts` | 0.02 × force² × weight | probability per manipulation | VT rises steeply with force, so a firm push in the outflow tract provokes it far more than a gentle advance |
| `RHC_ZONE_IRRITABILITY` | `rightHeartCatheter.ts` | inflow 0.5, apex 1, septum 1, RVOT 3 | weight | "Particularly in the RV outflow tract" |
| `RHC_BALLOON_UP_HAZARD` | `rightHeartCatheter.ts` | 0.5 | multiplier | A floating balloon tip irritates less |
| `RHC_P_MAX` | `rightHeartCatheter.ts` | 0.9 | probability | Cap on any one draw |
| `RHC_ECTOPY_S` | `rightHeartCatheter.ts` | 3 | s | Ectopy lasts after the last provocation |
| `RHC_VT_RUN_S` | `rightHeartCatheter.ts` | 4 | s | A run stops after the provocation ends unless the tip is still pressed into the ventricle |
| `RHC_VT_SUSTAINED_S` | `rightHeartCatheter.ts` | 30 | s | A run this long no longer stops on its own |
| `RHC_VT_HYPOTENSION_S` | `rightHeartCatheter.ts` | 10 | s | VT lasting this long raises hypotension |
| `RHC_VT_RATE` | `rightHeartCatheter.ts` | 180 | /min | Display rate of the local wide-complex morph |
| `RHC_P_RVOT_BOUNCE`, `RHC_P_RVOT_BOUNCE_BALLOON` | `rightHeartCatheter.ts` | 0.5, 0.2 (0 on a breath in) | probability | Without a breath the tip may flick back off the pulmonary valve |
| `RHC_INSP_THRESHOLD` | `rightHeartCatheter.ts` | 0.5 | inspiration 0..1 (haemo.ts `inspiration()`) | Counts as "breathing in" |
| `RHC_DEEP_BREATH_S` | `rightHeartCatheter.ts` | 4 | s | A deep breath held |
| `RHC_KNOT_TURNS`, `RHC_KNOT_TIME_S` | `rightHeartCatheter.ts` | 6 turns, 600 s | turns of the tip; s in the RA loop or RV | One unit of knot risk each; a knot can form on a forceful manipulation once the risk reaches 1 |
| `RHC_P_KNOT` | `rightHeartCatheter.ts` | 0.3 | probability per forceful manipulation at risk ≥ 1 | Knots follow prolonged manipulation |
| `RHC_P_KNOT_UNDO` | `rightHeartCatheter.ts` | 0.35 | probability | "Now and then" the wire undoes it |
| `RHC_KNOT_RISK_PRELOAD` | `rightHeartCatheter.ts` | 5 turns, 420 s | | The rhc-knot-risk preset starts after a long passage |
| `RHC_P_AF`, `RHC_P_AF_PRESET` | `rightHeartCatheter.ts` | 0.01, 0.5 | probability per atrial manipulation | AF is uncommon; the rhc-af preset makes it appear |
| `RHC_AF_SELF_LIMITING_SHARE` | `rightHeartCatheter.ts` | 0.8 (the rest split equally between mild and severe) | share | "Most episodes stop"; the rhc-af preset draws each variant equally |
| `RHC_AF_SELF_S` | `rightHeartCatheter.ts` | 60 | s | A self-limiting episode stops this long after the atrium is left alone |
| `RHC_AF_DRUG_S` | `rightHeartCatheter.ts` | 30 | s | A mild episode stops this long after the drug (compressed lab time, not a pharmacological onset) |
| `RHC_AF_PROMPT_S` | `rightHeartCatheter.ts` | 120 | s | Severe AF without a synchronised shock after this long is noted ("promptly" in the request); the debrief calls it the lab's model threshold, not Oxford's |
| `RHC_AF_RATE` | `rightHeartCatheter.ts` | self-limiting 130, severe 165, mild 120 | /min | Severe above Oxford's 150, mild below it |
| `RHC_WITHDRAW_FORCE` | `rightHeartCatheter.ts` | 0.5 | multiplier | A withdrawal in the RV irritates less than an advance of the same length |
| `RHC_TURN_FORCE_PER_90` | `rightHeartCatheter.ts` | 0.5 per 90 degrees | force units (as an advance of RHC_GENTLE_CM is 1) | A turn of the hub in the ventricle is a smaller manipulation than an advance |
| `RHC_FORCEFUL_TURN_DEG`, `RHC_TURN_BURST_S` | `rightHeartCatheter.ts` | 90 degrees within 2 s | degrees of hub rotation; s | Turning that counts as forceful for the knot; turns of the panel's 30 degree buttons in quick succession add up, so the knot follows torque from the controls ("accumulated loop rotations" in the plan) |
| `RHC_DEFAULT_HR` | `rightHeartCatheter.ts`, `CatheterPanel.tsx` | 70 | /min | Sinus rate when a scenario gives none |
| `RHC_IRRITABLE` | `rightHeartCatheter.ts` | 2.5 | multiplier | The rhc-rvot-irritable preset |
| `STRUCTURAL` | `CatheterPanel.tsx` | aortic stenosis, low-flow AS, mitral stenosis, HOCM, constriction, restriction, atrial or ventricular shunt, cardiogenic shock | scenario events | Read as structural heart disease for the AF drug choice |
| Fluoroscopy courses of the renal branch and the wedge | `RhcFluoro.tsx` `EXTRA_PATH` | drawing coordinates | 240 × 240 frame | Drawn from the end of the pacing image's IVC and PA courses |
| ECG morphs | `RhcFluoro.tsx` `NARROW`, `WIDE`, `VT`, AF baseline | illustrative shapes | | A local wide-complex morph until pacing-overdrive-and-tcp adds VT to the shared rhythm engine |
| `ECG_ECTOPIC_SHARE` | `RhcFluoro.tsx` | 0.35 | share of beats | Premature wide beats during ectopy (illustrative) |
| `ECG_AF_RR_SPREAD` | `RhcFluoro.tsx` | 0.6 to 1.4 | multiples of the mean RR | Irregular RR in AF (illustrative) |

## Notes for other packages

- The waiting count of the haemo lab fell by three tips that can really show from this package (haemo-rhc-femoral-side-branch, haemo-rhc-ra-loop, haemo-rhc-knot) and one counted only nominally: haemo-lhc-difficult-valve (phase left-heart, event engage-fail) is satisfiable only because the reachability report pools the lab's raises. The catheter never raises engage-fail with the left heart catheter in, so that tip cannot show from here; it belongs to the aortic valve crossing (ValvePanel, avCrossing) or a retarget in waiting.ts.
- HaemoLab.tsx does not yet pass `mode` and `onDecide` to CatheterPanel, so the knot and AF decisions reach only the panel's debrief, not the run's ledger.
- The catheter raises hypotension for VT and severe AF while the arterial trace keeps the scenario's pressure; the trace owner can feed `rhcRhythm` into the arterial trace and the study's MAP.
