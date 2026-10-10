# angio-decision-drills: model parameters

The package adds Brilakis's stable revascularisation algorithm (`src/content/decisions/revascStable.ts`), the decision step of the diagnostic lab (`src/ui/sim/modules/revascDecision.ts`), four stable scenarios (`src/simulation/diagnosticScenarios/multivessel.ts`), and two reading drills on real AngioCAD studies (`src/ui/angio/library.ts`, `src/ui/angio/syntax.ts`, `src/ui/sections/RealAngiograms.tsx`).

## Sourced rules (not model parameters)

These come from the module text and carry the lesson and book location in the code. They are listed here so that a reviewer can check them against the lessons.

| Rule | Value | File | Source |
|---|---|---|---|
| Asymptomatic single-vessel disease goes on only with ischaemia over 10% or a proximal LAD stenosis of 50% or more | 10%, 50% | revascStable.ts `ASYMPTOMATIC_RULE` | pm-target-ccs-why, "Question 2", "In the asymptomatic patient"; Brilakis 7.1, Fig. 7.1 |
| Asymptomatic multivessel disease goes on only with ischaemia over 10%, LVEF below 35% or a left main stenosis of 50% or more | 10%, 35%, 50% | revascStable.ts `ASYMPTOMATIC_RULE` | the same block |
| Order of the modality questions: previous CABG, diabetes, then candidacy with diabetes or complexity first without it | n/a | revascStable.ts `decideStable` | pm-target-heart-team, "The modality questions, in order" and its key points; Brilakis 7.1, Fig. 7.1 |
| Heart-team rule: equal PCI and CABG recommendations mean a heart-team discussion and no ad hoc PCI | n/a | revascStable.ts `decideStable` | pm-target-heart-team, "Current guidance on three-vessel disease" (2024 ESC as quoted in the endorsement) |
| SYNTAX lesion: 50% or more in a vessel of at least 1.5 mm | 50%, 1.5 mm | syntax.ts `SYNTAX_LESION_RULE` | pm-target-heart-team, "The SYNTAX score, step by step"; Brilakis Fig. 7.2; sianos-syntax-score-2005 |
| Three-vessel disease 0 to 22 PCI or CABG, above 22 CABG; left main 0 to 32 PCI or CABG, 33 or more CABG; two-vessel no threshold | 22, 32 | syntax.ts `SYNTAX_THRESHOLDS` | pm-target-heart-team, "Using the score" (Brilakis Table 7.1, 17.7) |
| Diabetes moves multivessel disease to CABG whatever the score | n/a | syntax.ts `syntaxRule`, revascStable.ts | pm-target-heart-team pitfalls; 2024 ESC row of "Using the score" |
| Vessel count threshold on AngioCAD: a stenosis over 50% | AngioCAD band 51-75 or above | library.ts `angioCadExtent` | Brilakis's prognostic table in pm-target-ccs-why ("Stenosis above 50%"); the AngioCAD bands as published |

The SYNTAX score is not totalled (`SYNTAX_TOTAL_STATUS`): the segment weights must come from the primary paper (Sianos 2005), whose weight table has not been obtained and extracted.

## Model parameters

| Parameter | Value | Unit | File | Rests on |
|---|---|---|---|---|
| AngioCAD band 26-50 read as indeterminate (not scored either way) in the SYNTAX comparison | n/a | n/a | syntax.ts `angioCadLesionClass` | The band holds 50% (a SYNTAX lesion) and 26 to 49% (not one); the dataset gives no finer value |
| Diagonals with the LAD, the obtuse marginal with the circumflex, the PDA and posterolateral branch with the dominant artery | n/a | n/a | syntax.ts `segmentVessel` | Convention for counting diseased arteries from AngioCAD's 15 segments |
| Decision drill studies: AngioCAD patients labelled 'SA' with grades and runs | n/a | n/a | library.ts `revascStudies` | The algorithm is for stable disease; the label is the dataset's own |
| Studies left out of the decision drills: all 15 segments graded normal ('NL') with a Gensini score above 0 | 30 of 116 stable-angina studies in the installed library (86 kept) | studies | library.ts `gradesContradictGensini`, `revascStudies` | A Gensini score above 0 needs at least one graded lesion, so these grades cannot serve as the answer key; the inconsistency is in the dataset itself, not the importer |
| Facts the dataset records for the missing-facts step: extent and complexity (from the runs), diabetes (its flag), LV function when LVEF is recorded | n/a | n/a | library.ts `recordedFacts` | What AngioCAD contains; symptoms are not recorded because the label is a diagnosis category |
| Studies per set in the two real-library drills | 5 | studies | library.ts `REVASC_SET_SIZE` | A set of about ten minutes |
| Module id | revasc-decision | n/a | revascDecision.ts | n/a |

## Scenario data (multivessel.ts)

Every value below is scenario data chosen so that the case teaches its decision. None comes from a source.

### diag-mvd-diabetes-fit (CABG)

| Parameter | Value | Unit |
|---|---|---|
| Lesions | LAD 0.18, 85%; LCx 0.25, 80%; RCA 0.45, 85% | position along the vessel, % diameter stenosis |
| Age, sex, height, weight | 63, M, 175, 88 | years, cm, kg |
| eGFR, LVEF | 78, 50 | mL/min/1.73 m2, % |
| Access, consent | right radial, diagnostic and ad hoc PCI | n/a |
| Decision chart | angina on one flight of stairs on two drugs; diabetes; no previous CABG; ischaemia about 15% of the LV; surgical risk low, good candidate; complexity complex | n/a |

### diag-mvd-two-vessel-heart-team (heart team)

| Parameter | Value | Unit |
|---|---|---|
| Lesions | LAD 0.45, 80%, 12 mm; RCA 0.45, 80%, 10 mm | position, %, mm |
| Age, sex, height, weight | 57, F, 164, 70 | years, cm, kg |
| eGFR, LVEF | 88, 60 | mL/min/1.73 m2, % |
| Access, consent | right radial, diagnostic and ad hoc PCI | n/a |
| Decision chart | angina on brisk walking on two drugs; no diabetes; no previous CABG; exercise test 2 mm ST depression at stage 2, no perfusion imaging; surgical risk low, good candidate; complexity less complex | n/a |

### diag-mvd-diabetes-frail (PCI)

| Parameter | Value | Unit |
|---|---|---|
| Lesions | LAD 0.4, 90%; LCx 0.5, 75%; RCA 0.35, 80% | position, % |
| Age, sex, height, weight | 84, M, 170, 64 | years, cm, kg |
| eGFR, LVEF | 52, 45 | mL/min/1.73 m2, % |
| Access, consent | right radial, diagnostic only | n/a |
| Decision chart | angina on dressing on three drugs; diabetes; chronic lung disease and frailty; no previous CABG; no functional test; surgical risk high, poor candidate | n/a |

### diag-svd-asymptomatic-small-territory (no revascularisation)

| Parameter | Value | Unit |
|---|---|---|
| Lesion | RCA 0.45, 80% | position, % |
| Age, sex, height, weight | 63, M, 180, 82 | years, cm, kg |
| eGFR, LVEF | 90, 60 | mL/min/1.73 m2, % |
| Access, consent | right radial, diagnostic and ad hoc PCI | n/a |
| Decision chart | no symptoms; ischaemia about 5% of the LV; no diabetes; no previous CABG; surgical risk low | n/a |

The asymptomatic case mirrors the lesson's own check question in pm-target-ccs-why (a 63-year-old, a single 80% mid-RCA stenosis, ischaemia in about 5% of the LV).
