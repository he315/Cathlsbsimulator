# diag-study-report: model parameters

The study report scenario pack (`src/simulation/diagnosticScenarios/studyReport.ts`) adds four scenarios. Every value below is a MODEL PARAMETER: scenario data chosen to make the case teach its lesson. None comes from a source. The thresholds the report scores against (`SIGNIFICANT_PCT`, `OBSTRUCTIVE_PCT` and the reasons to defer) are in `src/mentor/report.ts` and carry their own notes.

## diag-territory-check-anomalous-cx

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Anatomy variant | `anomalous-lcx-right-sinus` on every seed | n/a | The geometry of diag-anatomy-variants; request pm-acquiring#8. The from-RCA variant is left out because the patient engine's coronary regions do not yet include its circumflex |
| Dominance, root, access | right, normal, femoral | n/a | Scenario choice |
| Lesions | none | n/a | So that the only finding is the empty lateral wall |
| Age, sex | 66, M | years | Scenario choice |
| Height, weight | 174, 82 | cm, kg | Scenario choice |
| eGFR | 76 | mL/min/1.73 m2 | Scenario choice |
| LVEF | 57 | % | Scenario choice |
| Consent | diagnostic only | n/a | Scenario choice |

## diag-beyond-consent-lm

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Left main lesion position | 0.5 | fraction of the vessel | Scenario choice |
| Left main lesion severity | 80 | % diameter stenosis | Above `SIGNIFICANT_PCT` (51), so the report counts it as significant unprotected left main disease |
| Grafts | none | n/a | So that the left main is unprotected |
| Age, sex | 71, F | years | Scenario choice |
| Height, weight | 160, 68 | cm, kg | Scenario choice |
| eGFR | 62 | mL/min/1.73 m2 | Scenario choice |
| LVEF | 55 | % | Scenario choice |
| Access | right radial | n/a | Scenario choice |
| Consent | diagnostic and ad hoc PCI | n/a | Request pm-planning#4: the anatomy goes beyond what was consented |

## diag-cto-plan-not-adhoc

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| RCA occlusion position | 0.4 | fraction of the vessel | Scenario choice |
| Occlusion severity | 100 | % | A total occlusion |
| Proximal cap | blunt | n/a | Scenario choice |
| Occlusion length | 30 | mm | Scenario choice |
| Collateral channel | LAD to PDA, septal, Werner CC1, Rentrop 3, tortuosity 0 | grades | Scenario choice; request cp-cto-strategy#8 asks for contralateral collaterals |
| Age, sex | 59, M | years | Scenario choice |
| Height, weight | 181, 94 | cm, kg | Scenario choice |
| eGFR | 84 | mL/min/1.73 m2 | Scenario choice |
| LVEF | 50 | % | Scenario choice |
| Consent | diagnostic and ad hoc PCI | n/a | So that ad hoc PCI is open to the learner and the decision is theirs |

## diag-minoca-classify

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| LAD plaque position | 0.4 | fraction of the vessel | Scenario choice |
| LAD plaque severity | 30 | % diameter stenosis | Below `OBSTRUCTIVE_PCT` (50), the fifth universal definition's cut-off as hb-background-mi gives it |
| Case event | `nste-acs` | n/a | Makes the report ask for the MI classification (`asksMiClass`) |
| Indication | NSTEMI | n/a | The patient engine draws an acute coronary syndrome |
| Age, sex | 54, F | years | Scenario choice |
| Height, weight | 165, 66 | cm, kg | Scenario choice |
| eGFR | 92 | mL/min/1.73 m2 | Scenario choice |
| LVEF | 55 | % | Scenario choice |
| Drug timings | aspirin and ticagrelor 12 h, fondaparinux 10 h | hours before the case | Scenario choice |

## Scoring rules in `src/mentor/report.ts`

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| Consent beyond its scope (`deferralReasonsFor`) | 'consent' applies when the chart's consent is diagnostic only, or when it is diagnostic and ad hoc PCI and the anatomy is complex (unprotected left main, a chronic total occlusion or multivessel disease, as `complexAnatomy` judges them) | n/a | MODEL rule. The lab reads a consent to ad hoc PCI as a discussion of a simple PCI, so complex anatomy is Brilakis's consent reason to defer, "the anatomy carries a much higher PCI risk than was discussed" (pm-planning-consent, pm-target-timing). The chart records only the consent's scope, not what was discussed, so the rule stands in for that discussion |
| A wall credited to an injection not made (`wallItem`, problem `injection-not-made`) | a native wall is correct only when a filmed injection from the side the learner cites filled coronary vessels and at least one stored cine run recorded contrast | n/a | MODEL rule for the scenario check "each wall assigned a vessel that was seen to fill before the study ended" (diag-territory-check-anomalous-cx, pm-interpreting-pitfalls) |
| Side of an injection with no engaged ostium (`withBolusSides` in `src/state/useSimulatorStore.ts`) | RCA, PDA, PLV, conus and acute marginal filling count as the right side; every other filled vessel as the left | n/a | MODEL rule: an aortic or cusp injection is credited to the sides of the vessels it filled |
