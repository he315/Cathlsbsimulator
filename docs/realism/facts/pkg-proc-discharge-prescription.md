# proc-discharge-prescription: model parameters

The discharge antithrombotic prescription (`src/simulation/session/discharge.ts`, the session module `src/simulation/session/modules/discharge.ts` and the scenarios in `src/simulation/session/scenarios/discharge.ts`). The sourced values the prescription is scored against are `DISCHARGE_RULES`, `ARC_HBR` and `MAINTENANCE_DOSE` in `discharge.ts`, each with its location in the module text in the file header (lesson hb-after-the-procedure-dapt, `src/content/manual/cath-handbook/09-after-the-procedure.ts`; lesson pm-antithrombotics-oral, `src/content/manual/pci-manual/03-antithrombotics.ts`). Where Brilakis, Oxford and the ESC guidelines differ, the scorer either accepts each of them or follows one, and the expected answer names each position with its source (for example, after ACS without high bleeding risk the verdict follows Brilakis and the 2023 ESC, prasugrel or ticagrelor, and the expected answer adds that Oxford Table 8.8 also lists clopidogrel). Every value below is a MODEL PARAMETER: none is a clinical or population value from a source.

## Scoring settings (`MP_DISCHARGE`, discharge.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `stopDateTolMonthDays` | 7 | days | A stop date written for a duration in months counts when within a week of the date the plan's own duration gives (calendar months from the procedure date). No source gives a tolerance; a week covers the choice of a clinic day |
| `stopDateTolDays` | 2 | days | The same for a duration in days (the triple therapy week) |
| `tripleIschaemicMinDays` | 7 | days | When ischaemic risk dominates, triple therapy shorter than the default week is scored as undertreatment. The 2023 ESC sequence (09-after-the-procedure.ts:557-559) gives up to 1 week by default and up to 1 month in this group; the floor is the default week, a scoring choice |
| `defaultHbGdl` | 14.2 (men), 13.1 (women) | g/dL | The haemoglobin of a case that ran PCI without a discharge scenario (the generated patient carries no blood count); both outside the ARC-HBR bands |
| `defaultPlatelets` | 240 | × 10⁹/L | The platelet count of such a case |
| `defaultPciDate` | 2026-03-02 | date | The procedure date the stop dates count from, in every scenario and derived case |
| `signS` | 120 | s | Session time to write and sign the prescription |
| `followUpS` | 60 | s | Session time the follow-up visit takes (the days between are not played) |
| `dualShortMinOtherCriteria` | 1 | ARC-HBR criteria | With an anticoagulant, dual therapy may stop at 6 months 'in selected patients, such as those with several bleeding risk factors' (09-after-the-procedure.ts:559). The text gives no count. The anticoagulant is itself an ARC-HBR major criterion, so one further criterion gives two bleeding risk factors; 6 months is then accepted beside 12. A scoring choice |
| `derivedOacIndication` | "its existing indication" | text | The chart of a case that ran PCI without a discharge scenario names atrial fibrillation as the anticoagulant's indication only when the generated patient is in atrial fibrillation; otherwise the profile carries no indication and the chart says this |

## Scenario settings (`DISCHARGE_CASES`, discharge.ts, and `scenarios/discharge.ts`)

| Scenario | Settings | Rests on |
|---|---|---|
| dapt-stable | Man, 62 y, 80 kg, creatinine 85 µmol/L; stable angina; Hb 14.2 g/dL, platelets 240; one 3.0 × 18 mm stent (in the LAD, the patient's tightest lesion); nosebleeds at the day-12 follow-up, Hb unchanged (minor) | Scenario settings: no ARC-HBR criterion; the follow-up bleed is the drill for pci-post-bleeding-dapt |
| dapt-acs | Man, 58 y, 84 kg, creatinine 80; NSTEMI; Hb 14.8, platelets 265; one 3.5 × 22 mm stent in the culprit (RCA); seed dapt-acs-i | No criterion, no prasugrel contraindication |
| dapt-hbr-one-major | Woman, 68 y, 66 kg, creatinine 185 (eGFR about 25); NSTEMI; Hb 12.4; one 2.75 × 15 mm stent in the culprit (RCA); seed dapt-hbr-one-major-j | The lesson's own check question (09-after-the-procedure.ts:521): eGFR under 30, Hb 12.4 not minor in a woman |
| dapt-hbr-two-minor | Man, 77 y, 74 kg, creatinine 124 (eGFR about 52); stable angina; Hb 13.6; one 3.0 × 18 mm stent in the tightest lesion (LAD); seed dapt-hbr-two-minor-g | Two minor criteria (age 75 or older, eGFR 30-59), nothing major |
| dapt-af-acs | Man, 72 y, 82 kg, creatinine 95; NSTEMI; apixaban 5 mg twice daily for AF, last dose 36 h before; one 3.0 × 24 mm stent in the culprit (RCA); seed dapt-af-acs-h | The lesson's check question (09-after-the-procedure.ts:567): ischaemic risk not unusually high |
| dapt-af-ischaemic | Man, 66 y, 90 kg, creatinine 88; STEMI; rivaroxaban 20 mg daily for AF, last dose 30 h before; a previous LAD stent thrombosis, diabetes; two overlapping stents (3.0 × 38, 3.5 × 28 mm) in the culprit (RCA) | Ischaemic risk and anatomical features outweigh bleeding risk (09-after-the-procedure.ts:559) |
| dapt-surgery-planned | Woman, 66 y, 70 kg, creatinine 75; stable angina; Hb 13.4; a total hip replacement listed for 4 months; one 3.0 × 18 mm stent in the tightest lesion (LAD) | The lesson's surgery check (elective surgery before the 6-month DAPT course is complete) |
| every scenario | Radial access, opened at 'recovery'; the team's PCI report: drug-eluting stents (generic), 16 atm, post-dilated, TIMI 3, 90-220 mL contrast, 12-20 min fluoroscopy, 45 min; dose per fluoroscopy minute 25 mGy air kerma and 3 Gy·cm² (as the ward scenarios) | Scenario settings |
| ACS scenarios (dapt-acs, dapt-hbr-one-major, dapt-af-acs) | Left ventricular ejection fraction 55% (`ACS_LVEF`) | The generated NSTEMI patients drew an ejection fraction of 20-34%, which the prescription does not turn on and the case facts do not mention |

## The patient the learner takes over (`scenarios/discharge.ts`)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| the treated lesion | the thrombotic culprit, else the tightest lesion (`treatedLesionIndex`) | rule | The team's PCI treats the patient's own lesion; the report's stents are put in that vessel |
| `STENTED_RESIDUAL_PCT` | 0 | % diameter stenosis | The stented lesion in the engine's network after the team's PCI (the report gives TIMI 3 and no residual stenosis). The engine takes it through `setCoronaryTree`, as the PCI lab's sync does after stenting; every thrombotic lesion is taken as treated |
| presentation ischaemia | ended in every region at the team's PCI; the necrosis the engine grew during the case is kept | rule | The learner writes the discharge prescription for a reperfused patient, not one in ongoing ischaemia |
| `TEAM_SETTLE_S` | 60 | s | The team's time on the ward before the learner takes over; longer than a transient tip event's hold (`TRANSIENT_HOLD_S`, 30 s), so what the monitor read during the team's PCI has gone |
| radial artery | 2.8 | mm | Every scenario: larger than the team's sheath (2.67 mm outer diameter), so the attending has no sheath to criticise in a case the team ran with clean technique |
| seeds | dapt-acs-i, dapt-hbr-one-major-j, dapt-af-acs-h, dapt-hbr-two-minor-g | | Chosen for a resting pulse of 60-80/min; the first draws had a resting sinus tachycardia (87-101/min) or a sinus bradycardia (50/min) |
| start-state check (test) | pulse 55-95/min, ejection fraction 40% or more, chest pain score under 1, no 'st-elevation' or 'chest-pain' event | | The bounds `discharge.test.ts` checks every scenario against at the start and 2 minutes later; test bounds, not clinical thresholds |

