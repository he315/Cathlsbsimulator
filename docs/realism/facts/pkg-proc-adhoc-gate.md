# proc-adhoc-gate: model parameters

The ad hoc or delayed PCI decision gate of the full case: the rules and facts in `src/simulation/session/adhoc.ts`, the gate on screen in `src/ui/access/AdHocGate.tsx`, the store's path in `src/state/useProcedureStore.ts` and the scenarios in `src/simulation/session/scenarios/adhoc.ts`.

## Sourced content used (not model parameters)

| Content | Where it is used | Source |
|---|---|---|
| The nine reasons to defer ad hoc PCI (anatomy, dose, place, consent, symptoms and ischaemia, complication, people, preparation, choice) with their wording | `DEFERRAL_REASONS` in src/mentor/report.ts (diag-study-report), read by the gate's checklist and rules | Lesson pm-target-timing, src/content/manual/pci-manual/10-target.ts:633-647 (Brilakis 7.3, after the SCAI consensus) |
| Ad hoc PCI is needed in most ACS patients with active ischaemia; delayed PCI is favoured in stable patients, or ACS without active ischaemia, when a listed reason applies | `deferralReasonsApplying` (the active-ischaemia branch) and `judgeAdHoc` | 10-target.ts:620-627 (Brilakis 7.3.1) |
| A STEMI coming in as you weigh ad hoc PCI in a stable patient is a scheduling clash ('People') | the STEMI call and the 'people' rule | 10-target.ts:643 |
| Anatomy whose PCI risk is clearly higher than was discussed (left main, multivessel, CTO) makes the consent inadequate | the consent rule for a consent to a simple ad hoc PCI | tip diag-planning-ad-hoc-consent, pci-manual/01-planning.ts:1817-1828 (Brilakis 7.3, 1.1); the same model rule as `deferralReasonsFor` in src/mentor/report.ts (docs/realism/facts/pkg-diag-study-report.md) |
| Contrast warning threshold, 80% of the stricter ceiling | the 'dose' rule and the 'high-contrast-volume' event at the gate | `CONTRAST_BUDGET_DEFAULTS.warnFraction`, src/simulation/patient/contrastBudget.ts (a MODEL default set by LAB_BUILD_PLAN section 4, not a new value here) |
| Radiation follow-up trigger levels: reference air kerma 5 Gy, KAP 500 Gy·cm², 60 min fluoroscopy | the 'dose' rule and the 'high-radiation-dose' event at the gate | `DOSE_TRIGGERS`, src/simulation/dose.ts (cited there) |

## Gate settings (`MP_ADHOC`, adhoc.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `chestPainActive` | 3 | score 0-10 (the engine's `symptoms.chestPain`) | An ACS patient with chest pain at or above this has active ischaemia. Neither manual gives a number; a mid-low score of the engine's scale, so a patient reporting pain counts |
| `ischaemiaActive` | 0.2 | index 0-1 (the engine's territory `ischaemia`) | An ACS patient with regional ischaemia at or above this has active ischaemia, as do ST elevation (`stemi.met`, the 'st-elevation' event) and the chest pain above. An engine-scale threshold, not a clinical value |
| `stemiCallChance` | 0.1 | probability per case | The 'occasional' STEMI call of the request in a case whose scenario sets no interruption, drawn once from the case's seed (`adhoc-call:<seed>`). Neither manual gives a rate |
| `stemiCallAfterS` | 25 | s | When that call comes in after the gate opens; it comes at once if the learner records a decision first, so the call always interrupts a pending decision |
| `clockStartMin` | 510 (08:30) | minutes after midnight | The time of day a case starts when its scenario sets none; the gate shows the start plus the session clock |

## Other model rules (adhoc.ts)

| Rule | Value | Rests on |
|---|---|---|
| `DEFAULT_CENTRE` | every capability on site (cardiac surgery, intravascular imaging, pressure wire, atherectomy or lithotripsy, mechanical support, a CTO programme) | So the 'place' rule changes nothing in random cases; a scenario sets a smaller centre |
| 'place' applies | no on-site surgery with unprotected left main, CTO or multivessel disease; no CTO programme for a CTO; no atherectomy for severe calcium (`calcium === 2`) | A reading of 'no on-site surgery when patient or lesion risk is high, or not the equipment the lesion needs' (10-target.ts:639) |
| 'symptoms' applies | the scenario says the symptoms are uncertain, or there is no non-invasive evidence of ischaemia and the centre has neither a pressure wire nor imaging (stable patients only) | A reading of 10-target.ts:641 |
| 'complication' applies | a recorded complication of severity 'major' (critical ones are major), except the process errors 'no-time-out' and 'air-in-line', or the study report's complication flag | Brilakis's 'anything that went wrong during the diagnostic study' (10-target.ts:642); the severity cut is a model choice so that a minor, settled problem does not by itself stop a PCI |
| 'anatomy' applies | unprotected left main, a CTO (`kind` 'cto' or the morphology fields), multivessel disease (`complexAnatomy` in report.ts: two or more arteries with a lesion of 51% or more beyond the left main), or a significant bifurcation lesion (Medina class or a 'bifurcation' site) | 10-target.ts:637; SIGNIFICANT_PCT is report.ts's MODEL threshold |
| `consentLimitFromText` | wording with no mention of angioplasty, PCI or a stent, or that limits the diagnostic study or the angiography ('diagnostic ... only', 'angiography only', 'diagnostic study alone', 'no PCI'): the diagnostic study only ('PCI of the culprit lesion only' is not); 'any PCI', 'complex' or 'including left main': any PCI; otherwise ad hoc PCI of the lesion found | Until proc-consent-conversation gives the session a consent limit, the chart's consent form is read this way (the plan's design) |
| Scoring | 'proceed' correct when no reason applies; 'defer' correct when a reason applies and the learner names at least one that does, or, in a stable patient with none, when the learner names any reason; the checklist correct when every applying reason and no other is ticked | The request's success criterion (lab-requests/pm-target.json #3); deferral is never wrong in stable disease (the SCAI consensus: no trial favours either strategy, 10-target.ts:631) |

## Scenario settings (`scenarios/adhoc.ts`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Seeds | adhoc-lm-40, adhoc-cto-69, adhoc-mvd-4, adhoc-acs-1, adhoc-simple-7, adhoc-simple-14, adhoc-simple-32 | - | Chosen by search so that the patient's own generated anatomy is the case's: left main 70% with LAD 88% (stable); LAD CTO; LAD 86%, LCx 91%, RCA 79%; a 96% thrombotic mid-LAD STEMI culprit; a single LAD lesion (86%, 85%, 86%). adhoc.test.ts checks each |
| `ADHOC_DIAGNOSTIC` | 70 mL contrast, 240 s screening, 350 mGy air kerma, 25 Gy·cm² KAP | mL, s, mGy, Gy·cm² | A routine diagnostic study's totals, added because the autopilot does no angiogram; well under the contrast warning threshold and the dose trigger levels, so 'dose' never applies by itself The contrast goes into the patient engine; the dose is booked as the diagnostic lab's return (`returnFromLab`, the lab totals), not as the access stage's own fluoroscopy, which the Fluoroscopy workspace rewrites from its own tracker |
| `ADHOC_FINDINGS` | one line per scenario, e.g. 'left main 70%; LAD 90%; first diagonal 65%; circumflex and right coronary minor irregularities. Right dominant.' | % (visual estimate) | The team's report of the study the case opens after, shown on the gate until the learner files a study report of their own: the seed's generated anatomy (vessel, kind, dominance) with each stenosis rounded to 5%, as a visual estimate is reported. A stenosis under 25% is reported as 'minor irregularities'. adhoc.test.ts checks that each line names every significant lesion's vessel |
| `LATE_START_MIN` | 1150 (19:10) | minutes after midnight | The late-evening case's start |
| `LATE_CALL_AFTER_S` | 20 | s | When that case's STEMI call comes in after the gate opens (sooner if the learner decides first) |
| Consent wording | 'Signed for coronary angiography and possible angioplasty.' (a simple ad hoc PCI); 'Signed for coronary angiography and primary PCI.' (the STEMI); 'Signed for diagnostic coronary angiography only.' | - | Scenario text |
| The complication | ventricular fibrillation on a coronary injection, one shock, sinus rhythm restored (severity major), recorded at the 'return' hook | - | A complication of the diagnostic study the case states; the patient engine is not put through it |

## Known disagreement with the study report (for diag-study-report, not settled here)

The gate's anatomy and consent rules and `deferralReasonsFor` in src/mentor/report.ts can differ on one patient: report.ts reads a CTO from the morphology fields only (a generated CTO carries `kind` 'cto'), does not count a bifurcation lesion under 'anatomy', and reads the consent from `caseData.chart.consentScope`, which the case's hand-over does not set, while the gate reads the scenario's consent, then a session consent limit, then the chart's consent-form wording. Until the two are aligned in report.ts and the hand-over, the gate's rules above are the ones that score the ad hoc decision.
