# Evidence: hb-specific-conditions (Valves, pericardium, cardiomyopathy and pulmonary embolism)

Module file: `src/content/manual/cath-handbook/05-specific-conditions.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21). Round 1 fixes applied: see the notes below and each lesson's list; device brand names removed from source locators ("ch 9: Microaxial pump"). Oxford chapter 5 runs PDF pp.128–148; every page of it was read in the extract and as page images (pp.129–140, 143–146), including Figs 5.1–5.7 and 5.10–5.13.

New references (module `refs` export, each checked on PubMed in this session):
- `omran-aortic-crossing-emboli-2003`: PMID 12699950; Lancet 2003;361(9365):1241–1246; abstract read (152 randomised, 101 crossed vs 51 not; 32 controls with coronary angiography and laevocardiography; MRI and neurological assessment within 48 h before and after; 22/101 (22%) focal diffusion abnormalities in an embolic pattern, 3 (3%) clinically apparent deficits; none without valve passage or among controls; conclusion: inform patients, use only with unclear echo findings when the information is needed).
- `stein-pioped-angiography-1992`: PMID 1735144; Circulation 1992;85(2):462–468; abstract read (1,111 patients; death 5 (0.5%), major non-fatal 9 (1%), minor 60 (5%); MICU 5/122 (4%) vs 9/989 (1%), p<0.02; PA pressure, contrast volume and presence of PE did not significantly affect complications; renal dysfunction 13 (1%), older patients 74 vs 57 years; non-diagnostic 35 (3%), incomplete 12 (1%); PE after negative angiogram 4/675 (0.6%); conclusion: clinical judgement probably the most important consideration).
- `esc-myopericardial-2025`: PMID 40878297; Eur Heart J 2025;46(40):3952–4041; no abstract in PubMed; sections 4.5.5 and 4.5.6 read on the publisher page (academic.oup.com, doi 10.1093/eurheartj/ehaf192). Claims used: transient constriction = constriction with ongoing inflammation that can be reversed with anti-inflammatory treatment; a trial of 3–6 months of anti-inflammatory therapy recommended; CRP and multimodality imaging including CMR to detect inflammation; failure of medical therapy, or constriction without pericarditis, referred for pericardiectomy without delay. Replaces `esc-pericardial-2015` (kept as a historical reference).
- `aha-acc-pe-2026`: PMID 41712677; Circulation 2026;153(12):e977–e1051 (also J Am Coll Cardiol 2026;87(13):1626–1710, PMID 41712898); abstract read. Claims used: introduces the AHA/ACC Acute Pulmonary Embolism Clinical Categories for severity, prognosis and treatment decisions; addresses advanced interventional therapies. No class or level of recommendation is quoted in the module.
- `esc-pe-2019`: PMID 31504429; Eur Heart J 2020;41(4):543–603; no abstract in PubMed. Claims used: CTPA the imaging method of choice for suspected PE; high-risk PE = haemodynamic instability; systemic thrombolysis recommended for high-risk PE; surgical embolectomy recommended when thrombolysis is contraindicated or has failed; percutaneous catheter-directed treatment should be considered as an alternative in that situation. Checkers: verify against the guideline's high-risk PE treatment recommendations table.

Existing references used (re-checked on PubMed in this session where marked): `hurrell-constriction-1996` (PMID 8640975, abstract read: 36 patients, 15 surgically proven CP, 21 other causes of heart failure; high-fidelity manometric catheters and respirometry; conventional criteria lacked sensitivity and specificity and failed to distinguish groups; inspiratory RV/LV discordance distinguished them, P<.05), `talreja-constriction-2008` (PMID 18206742, abstract read: 100 consecutive patients, 59 surgically documented CP, 41 RMD; early rapid filling and end-diastolic equalisation present in both; conventional criteria statistically different but predictive accuracy of any <75%; systolic area index = RV/LV systolic pressure-time area ratio inspiration vs expiration; sensitivity 97%, predictive accuracy 100%), `brockenbrough-1961` (Crossref record only, paper not read; used only as the eponym of the post-ectopic sign. The HOCM column content is attributed to Oxford p.146 and to the Academy lesson hd-pm-hocm, not to the 1961 paper), `esc-vhd-2021`, `esc-vhd-2025` (PMID 40878295, metadata checked on PubMed; aortic stenosis and coronary assessment text read on the publisher page, doi 10.1093/eurheartj/ehaf194, sections 5.5.1, 6.1, 8.2.1 and Figure 6), `esc-cardiomyopathy-2023`, `esc-pericardial-2015`, `gorlin-1951` (CO in mL/min in the formula), `hanna-pcm` (for the Academy-lesson content cross-referred to: chamber identification by diastolic contour on pullback, Valsalva lowering preload).

Existing tips reused in lessons (not redefined): `haemo-as-slow-rise-not-damping` and `diag-as-high-flow-fill` (cp-complex-patients; Brilakis 5.6 p.111, 6.6 p.127), `haemo-v-wave-not-specific` (cp-acs-thrombus; Oxford p.135), `diag-hypo-amplatz-valve` (cm-patient-complications; Brilakis 28.1 p.487).

## Notes for checkers

- **Round 2 fixes:** PIOPED sentences in q11 and the PE lesson reworded; q6 Amplatz/EBU sentence reworded (brilakis p.487); right heart navigation wording reworded in the PE case and the right-valve lesson (oxford p.111–112); MS line updated to the 2025 ESC/EACTS figure title and the version note removed; calcium-score caveat added (ESC 2025 section 8.2.1); cannon-wave tip names complete heart block and junctional rhythm (oxford p.114); Brockenbrough pulse-pressure row and sentence attributed to hd-pm-hocm, the 1961 paper kept as eponym only.

- **Error in Oxford (taught explicitly):** p.132, aortic regurgitation grade III reads "opacification of left ventricle becoming equal to the left ventricle"; grades II and IV are defined against the aorta, so the module teaches grade III as LV density equal to the aorta and says the printed wording is a slip.
- **Oxford sentence that conflicts with the catheter evidence (taught explicitly):** p.145, restrictive cardiomyopathy: respiratory variation between the LV and RV traces is named as a discriminator that "does not occur in constrictive pericarditis". Read literally this runs against Hurrell (PMID 8640975) and Talreja (PMID 18206742), who place respiratory discordance of the ventricular pressures in constriction ("unique to CP", Talreja) with concordance in restrictive disease. The module states the conflict and tells the learner to follow the catheter evidence; it no longer offers its own diastolic interpretation.
- **Disagreement between sources (taught):** (1) Nitroglycerin in HOCM: Oxford p.145 uses a vasodilator (sublingual GTN) to accentuate the gradient; Brilakis p.42 (3.2.1.3.1) lists HOCM as a cause of nitroglycerin hypotension and says do not administer to HOCM patients. Both given with context. (2) Catheter for the HOCM pullback: Oxford p.145 pigtail; module cites Brilakis p.111 (side holes can mask tip pressure) and the Academy lesson hd-pm-hocm (end-hole catheter preferred). (3) Constriction RA trace: Oxford p.143 "steep Y descent and smaller X descent"; Academy hd-pm-constriction table "steep x and y". Both noted. (4) PA pressure and angiography risk: Oxford p.139 (PA systolic >60 mmHg a contraindication unless very experienced) vs PIOPED (PA pressure not a significant predictor). Both given, with Oxford's rule as the lab rule. (5) MS severity: Oxford p.134 bands vs ESC ≤1.5 cm² (2021 clinically significant; 2025 clinically severe rheumatic MS). (6) AS severe boundaries: Oxford <1.0 cm² and >40 mmHg vs ESC 2025 (unchanged from 2021) ≤1.0 cm² (≤0.6 cm²/m²) and ≥40 mmHg. (7) Support-device contraindications: Brilakis p.251 (severe AR for Impella, IABP and VA-ECMO) vs Oxford p.290 (significant AR, significant AS, HOCM with significant gradient for IABP) and p.295 (severe AS, moderate/severe AR for Impella).
- **Interpretive or teaching sentences (flag for checkers):** AS lesson "The catheter tip points the wire at the orifice; the wire does the crossing" (gloss on Oxford p.129); AS pearl (whiteboard question, built on Oxford p.129 and Omran); AS "A pullback gradient is a reasonable screening number" (teaching gloss on Oxford p.129 and Fig 5.1); the "small calculated area can reflect a valve that a weak ventricle cannot open fully" (gloss on Oxford p.116 flow dependence); tricuspid "single pullback ... beat-to-beat variation could swamp a 5 mmHg difference" (gloss on Oxford p.138); constriction mechanism paragraph ("pericardial shell fixes the total volume ... LV must give up room"; consistent with Hurrell/Talreja's "increased ventricular interdependence" and the Academy lesson); "Mark inspiration on the recording" pearl; HOCM "Provocation works by making the ventricle smaller" (from Oxford's two provocations plus Brilakis p.42 mechanism); case 1 "fluid bolus" feedback (inverse of Brilakis's preload mechanism); PE pearl (two questions before scrubbing, built on Oxford p.139); right-sided pullback pearl.
- **Figures read from page images:** p.130 Fig 5.1 (shaded mean gradient between simultaneous LV and Ao; peak-to-peak arrow joining peaks at different times); p.130 Fig 5.2 (Prussian helmet sign on aortography and catheter/wire crossing frames); p.133 Fig 5.3 (wedge above LV through diastole, shaded mean gradient); p.135 Fig 5.4 (v wave on the PCW trace on the LV downslope); p.136 Fig 5.5 (grade IV MR: LA darker than LV); p.137 Fig 5.6 (PA dilatation and pulmonary regurgitation, posteroanterior view, complex congenital heart disease); p.140 Fig 5.7 (selective right PA injection with filling defects, multiple emboli); p.143 Fig 5.10 (LV and RV diastolic traces superimposed with dip and plateau, square-root sign); p.145 Fig 5.12 (pressure falls in LVOT before aorta); p.146 Fig 5.13 (post-PVC beat).
- **Haemo lab scenario titles** used in sim tasks were taken from `src/simulation/haemo.ts` (ids normal, aortic-stenosis, mitral-stenosis, constriction, restriction, tamponade, hocm, acute-mr, acute-ar).
- **Possible issues in existing Academy lessons (for the fixer):** none found to be wrong against the manuals. Two points worth a look: (a) haemodynamics.ts `hd-pm-constriction` table gives the constrictive RA waveform as "steep x and y", whereas Oxford p.143 says steep y with a smaller x descent; (b) `hd-pm-hocm` says a pigtail "cannot localise" the gradient, whereas Oxford p.145 describes the HOCM pullback with a pigtail; the statement may be right in principle but is stronger than either manual.

## Lesson hb-specific-conditions-as

- Non-invasive studies should have provided mean and peak gradient and valve area before the catheter study; occasions when direct assessment is required; coronary angiography often performed: oxford p.129
- Table of severity (mild >1.4 / <35 / <20; moderate 1.0–1.4 / 35–65 / 20–40; severe <1.0 / >65 / >40), titled data to obtain prior to catheterisation: oxford p.130 (Table 5.1)
- ESC 2025 (as 2021) high-gradient severe AS: AVA ≤1 cm² (or ≤0.6 cm²/m²), mean gradient ≥40 mmHg, Vmax ≥4.0 m/s: ref esc-vhd-2025 (Figure 6), esc-vhd-2021
- Doppler peak is an instantaneous value, not peak-to-peak: as taught in hd-valves-as-gradients (refs esc-vhd-2021, hanna-pcm)
- Coronary disease difficult to diagnose non-invasively with significant valve disease; routine to consider angiography in symptomatic patients assessed for valve surgery; small risks believed outweighed by consequences of missing severe CAD; part of overall surgical risk assessment; practice varies by institution; adding CABG to AVR in elderly significantly increases operative risk; guide: over 40 with ≥1 risk factor (diabetes, hypertension, family history), asymptomatic with suspected ischaemia, LV systolic dysfunction; endocarditis: only with multiple risk factors or coronary embolisation: oxford p.27–28
- ESC 2025: CCTA recommended as an alternative to coronary angiography to rule out CAD in patients at low or moderate risk of obstructive CAD (section 5.5.1); in TAVI candidates, omission of invasive coronary angiography should be considered when work-up CCTA is of sufficient quality to exclude relevant CAD (section 6.1); class and level not quoted: ref esc-vhd-2025
- Difficult aortic valve: first check notes for significant AS: oxford p.108
- Diagnostic crossing in severe AS rarely performed, rarely changes management, hazardous; emboli on brain MRI; echo the gold standard for most: oxford p.129 (box)
- Omran numbers (152; 101 vs 51; 48 h MRI; 22/101 = 22% with focal diffusion abnormalities; 3 of these (3%) clinically apparent, so 19/101 ≈ 19% without symptoms (arithmetic); none without crossing; 32 controls without valvular AS who had coronary angiography and laevocardiography; conclusion and informing patients): ref omran-aortic-crossing-emboli-2003
- Need to cross, with two examples ("for example"): discrepancy between symptoms and non-invasive testing, or TAVI work-up: oxford p.129; TAVI work-up haemodynamics may include transvalvular gradients and RHC depending on reliability of non-invasive studies: oxford p.131
- ESC 2025: LV catheterisation not recommended unless there are symptoms and signs of severe AS and non-invasive investigations are inconclusive (section 8.2): ref esc-vhd-2025
- "About one in five / one in thirty": arithmetic restatement of Omran's 22% and 3%
- Technique step 3: great care and controlled manipulation (oxford p.129); embolism only in patients with valve passage (ref omran-aortic-crossing-emboli-2003). No claim about crossing duration or leaflet contact is made.
- Simultaneous pressures the most accurate method (two catheters or double-lumen catheter in LV): oxford p.129
- 5 F AL1 diagnostic catheter, hydrophilic straight-tipped wire; once in ventricle swap for pigtail using exchange-length J wire; great care, controlled manipulation; aortography may help identify the point of leaflet opening, "Prussian helmet sign", a useful visual landmark: oxford p.129, Fig 5.2 p.130 (no mechanism for the appearance is given)
- Difficult (non-stenotic) valve sequence: wire to stiffen catheter, wire to cross with catheter tip directing, change to JR4 or AL, straight or hydrophilic wire, advance catheter, withdraw wire, connect to pressure, exchange over long wire to pigtail if ventriculography planned: oxford p.108
- Brilakis: pigtail difficult to advance through AS; balloon dilation of a stenotic valve may be needed; 0.035 in. J-wire to stiffen the pigtail: brilakis p.258 (14.4.5.3)
- Methods table (captioned "Methods Oxford describes", no ranking of pullback against femoral): simultaneous most accurate; femoral artery less accurate (reason, delay and peripheral amplification, from the Academy lesson hd-valves-as-gradients); pullback peak-to-peak limited by time difference between peaks and catheter interfering with valve opening and closure; pullback is how gradients are usually obtained: oxford p.129; Fig 5.1 p.130
- Post-ventriculogram pullback from LV to aorta to record an estimate of the LVOT gradient: oxford p.120
- Fluid-filled system: long tip-to-transducer distance gives timing delay and some damping; end-pressure, catheter impact and catheter whip artefacts: oxford p.95
- Gorlin AVA = CO ÷ [44.3 × SEP × HR × √mean gradient]: oxford p.116; inputs CO, mean gradient, systolic ejection time: oxford p.129; CO in mL/min: ref gorlin-1951 (and hd-valves-as-area)
- Worked example arithmetic: 44.3 × 0.32 = 14.176; × 75 = 1063.2; × 7 = 7442.4; 4200 ÷ 7442 = 0.564 cm² (module's own calculation)
- Gorlin depends on forward flow; overestimates at high CO, underestimates at low CO: oxford p.116
- Inaccuracies and practical limitations led to its extinction from routine practice: oxford p.129; invasive CO techniques inaccurate: oxford p.115
- Check 2 (output 2.6 L/min, LVEF 25%): oxford p.116; hd-valves-as-area
- LFLG: AVA ≤1 cm² with mean <40 mmHg, SVi ≤35 mL/m², LVEF <50% (reduced) or ≥50% (preserved); DSE discriminates pseudo-severe from true severe AS in reduced-EF LFLG; flow reserve = ≥20% rise in stroke volume with low-dose dobutamine; CCT AV calcium scoring provides important adjunctive information in LFLG AS and is complementary to DSE in reduced-EF LFLG; preserved-EF LFLG: intervention after careful confirmation that AS is severe; Agatston >2000 (men) / >1200 (women) indicate severe AS, higher thresholds 3000/1600 very specific, severe unlikely <1600/<800; cautious interpretation where severe AS can develop without pronounced calcification (bicuspid valve, concomitant amyloidosis, predominantly fibrotic stenosis): ref esc-vhd-2025 (section 8.2.1, Figure 6). Invasive dobutamine study when echo non-diagnostic: credited to the Academy lesson hd-valves-as-area (not to the guideline, which does not mention it)
- Coronary-procedure table: dilated ascending aorta with AS or AR may need larger catheters: brilakis p.34 (1.5); AS waveform appears damped but is parvus and tardus; side holes mask damping: brilakis p.111 (5.6); high coronary flow in severe AS, HOCM, dilated cardiomyopathy, AV fistula causes inability to fill; non-diagnostic better than erroneous: brilakis p.127 (6.6.3.1); critical AS relative contraindication to ventriculography: oxford p.117; FFR limited validation in AS: oxford p.234; FFR decreases significantly after TAVR due to increased hyperaemic flow, iFR unchanged, FFR may underestimate severity in severe AS: brilakis p.427 (24.1.12); Impella contraindicated in severe AS: oxford p.295; IABP contraindicated in significant AS: oxford p.290
- Videos: titles only (7l5kBea_XIk, y-JO26kM4CI, VMePFUh9P4U)

## Lesson hb-specific-conditions-mitral

- MS assessment typically simultaneous left and right heart catheterisation; coronary angiography usually performed if considered for mitral surgery: oxford p.133; simultaneous study for MV disease: oxford p.93
- Right heart catheter (MPA2 or Swan–Ganz) into main PA to measure PA systolic pressure; advance to PCWP as LA surrogate; pigtail in LV body for LVEDP: oxford p.133
- PCWP: advance as patient inhales until gentle resistance: oxford p.111
- LVEDP normal 3–12 mmHg: oxford p.110
- Mean mitral gradient = area between PCWP and LV curve in diastole; Fig 5.3 wedge above LV in diastole: oxford p.133
- Mean gradients influenced by heart rate, particularly in AF; average at least 10 beats: oxford p.133
- LV angiography occasionally at end for calcification, leaflet motion, MR degree: oxford p.133
- PCWP probably overestimates LA pressure by 2–3 mmHg in MS: oxford p.133
- Wedge delay correction and transseptal LA pressure: as taught in hd-valves-mitral
- Table (normal 4–6 / N/A; mild >1.5 / <5; moderate 1.0–1.5 / variable; severe <1.0 / >10): oxford p.134 (Table 5.2)
- ESC MS line ≤1.5 cm²: 2021 'clinically significant' ref esc-vhd-2021; 2025 keeps the threshold: list of figures on the publisher page (doi 10.1093/eurheartj/ehaf194) titles the MS management figure 'Management of clinically severe rheumatic mitral stenosis (mitral valve area ≤1.5 cm2)', ref esc-vhd-2025. The MS body text was not readable on the page, so the module quotes only the figure title's wording (rheumatic, clinically severe, ≤1.5 cm²). Version note removed in round 2
- Moderate MS mean gradient "variable"; gradient influenced by heart rate: oxford p.134, p.133
- Gorlin MVA = CO ÷ [37.7 × DFP × HR × √mean gradient]; error-prone, rarely performed: oxford p.116, p.133
- Worked example: 37.7 × 0.45 = 16.965; × 70 = 1187.6; × 3.464 = 4114; 4000 ÷ 4114 ≈ 0.97 (module text rounds the denominator as ≈ 4109 using √12 ≈ 3.46; result 0.97 either way)
- MR: large v waves in PCWP, transmitted LV pressure waves, during downslope of LV trace; not specific, can occur in other conditions that elevate LA pressure (e.g. VSD, infiltrative myocardial disease): oxford p.135, Fig 5.4
- Normal LA v wave usually slightly higher than a wave: oxford p.110
- MR grades I–IV by LA opacification relative to LV: oxford p.135; Fig 5.5 p.136
- Not catheter pressure on mitral apparatus or ventricular ectopics; may identify cause (flail leaflet, annular calcification): oxford p.135
- LV gram relative contraindications LVEDP >35 mmHg, pulmonary oedema: oxford p.117; LVEDP >30 mmHg pulmonary oedema likely, high LVEDP: minimise contrast and avoid ventriculography: oxford p.110
- Short period of ectopy at the start of the injection is common; keep acquiring until a satisfactory ectopic-free cycle: oxford p.119
- Reduce injection with impaired LV or LVEDP >25 mmHg (e.g. 30 mL at 10 mL/s); typical 30–35 mL at 10–15 mL/s; rise time 0.1–0.5 s to prevent catheter whip: oxford p.119
- Catheter mid-cavity, minimise ectopy, avoid mitral apparatus: oxford p.118
- MR usually seen in 30° RAO panning to LA; 60° LAO 20° cranial also: oxford p.120
- Undiagnosed CAD may be the mechanism for MR: oxford p.28
- Acute MR/AR may benefit from vasodilators but often poorly tolerated, urgent or emergent surgery; IABP for acute MR: brilakis p.488 (28.1.3.2)
- IABP indication severe MR with cardiac failure: oxford p.290 (Box 9.1)
- Videos: titles only (1_8lFiWvrPc, VMePFUh9P4U, UYH8XJaH9k8)

## Lesson hb-specific-conditions-ar-right

- Aortography: pigtail with side holes; advance over wire under screening to proximal ascending aorta; ensure not interfering with leaflet opening/closing; remove wire, aspirate, connect injector; 40–60 mL at 20 mL/s, LAO, breath hold: oxford p.126
- AR grades I–IV, estimate depends on regurgitant volume and LV function: oxford p.132 (grade III slip, see notes); same caveat for MR: oxford p.135
- Dilated ascending aorta with AS/AR may need larger catheters: brilakis p.34 (1.5)
- Amplatz (and deeply curved EBU) catheters may push aortic cusp open and cause acute AR; repositioning immediately corrects hypotension: brilakis p.487 (28.1.1.2.2)
- Acute AR often poorly tolerated, urgent/emergent surgery: brilakis p.488 (28.1.3.2)
- Severe AR contraindication to Impella: brilakis p.251 (14.1.3); to VA-ECMO or IABP: brilakis p.251 (14.1.6)
- Oxford: IABP contraindicated in significant AR: p.290; Impella contraindicated in moderate/severe AR: p.295
- PS: advance right heart catheter through valve to main PA, pullback with continuous recording: oxford p.137
- Reaching PA: pull back from RV apex, rotate tip cranially, advance; guide wire in difficult cases; deep breath helps: oxford p.111–112
- Oxford normal RV systolic 20–25, PA systolic 20–25 / diastolic 4–8 mmHg: oxford p.113 (Table 4.1); Academy reference ranges RV systolic 15–30, RV end-diastolic 2–8 mmHg: hd-waveforms (haemodynamics.ts). Oxford's RV diastolic 6–12 figure is no longer quoted
- Chamber naming by diastolic contour, intermediate chamber with arterial systolic and ventricular diastolic pressure = subvalvar: as taught in hd-valves-ar-ps (ref hanna-pcm)
- PR assessed by pulmonary angiography, also shows PA dilatation; Fig 5.6 complex congenital heart disease: oxford p.137
- TS uncommon, usually with mitral disease; catheterisation rarely used alone; 5 mmHg gradients can cause significant symptoms; two matched catheters RA and RV: oxford p.138
- TS: prominent a waves with muted y descent: oxford p.114 (Fig 4.18 caption)
- TR: large v waves in RA as blood forced into RA in systole: oxford p.138; large c and v waves with loss of x descent; normal RA v wave usually slightly smaller than a; AF loses a wave; CHB and junctional rhythm give cannon a waves (RA contracting against a closed tricuspid valve): oxford p.114 (Fig 4.18 caption); cannon waves regular in junctional rhythm, AV dissociation in CHB: hd-waveforms. TR check stem now specifies sinus rhythm with 1:1 AV conduction
- Right ventriculography not commonly performed; used in TR: oxford p.117
- Videos: titles only (DFbsXsNeqzw, gcsqWvUe0wQ)

## Lesson hb-specific-conditions-constriction

- Simultaneous left and right heart catheterisation for suspected constriction: oxford p.93
- Seven constriction features (hypotension, tachycardia, Kussmaul's sign, M or W RA with steep Y and smaller X, dip and plateau, equal elevated diastolic pressures, LV/RV diastolic matching during respiration); Fig 5.10 dip and plateau and square-root sign: oxford p.143
- Normal respiratory variation: RA falls on spontaneous inspiration, rises on expiration; reverse with mechanical ventilation: oxford p.114
- Kussmaul mechanism sentence ("rigid pericardium stops the heart feeling the fall"): teaching gloss (see notes)
- Zeroing at mid-chest with port open to air; flush to avoid air: oxford p.97; timing delay and some damping from the long fluid column, catheter impact and catheter whip artefacts: oxford p.95
- High-fidelity manometric catheters and respirometry: ref hurrell-constriction-1996; high-fidelity waveforms: ref talreja-constriction-2008
- Restrictive/infiltrative cardiomyopathies similar haemodynamic findings: oxford p.145; early rapid filling and equalised end-diastolic pressures present in both CP and RMD: ref talreja-constriction-2008; discriminator sentence and its conflict with Hurrell/Talreja: oxford p.145 (see notes)
- Tamponade table cell (systolic peaks also discordant; exaggerated interdependence underlies pulsus paradoxus) and keypoint "discordance separates constriction from restriction, not from tamponade": Academy hd-pm-tamponade (haemodynamics.ts, 'Tamponade compared with constriction' table)
- Hurrell numbers and findings; Talreja numbers, conventional <75%, SAI definition, 97%, 100%: refs as above
- Tamponade: echo gives diagnosis instantly; similar findings to constriction; pulsus paradoxus >10 mmHg; RA elevated and blunted; Fig 5.11 echo: large effusion, small RV and RA, RA collapse: oxford p.144
- Effusive-constrictive and drainage monitoring: as taught in hd-pm-tamponade
- Transient constriction reversible with anti-inflammatory treatment; 3–6 month anti-inflammatory trial; CRP and multimodality imaging including CMR; pericardiectomy without delay after failed medical therapy or for constriction without pericarditis: ref esc-myopericardial-2025 (sections 4.5.5, 4.5.6)
- Videos: titles only (Ty0ucFCRiHs, AafsNxAyADk, 0sXHIb1pjzs, NX81MYPpbtQ)

## Lesson hb-specific-conditions-hocm

- Dynamic gradient between LV and aorta; pigtail in LV body, slowly withdrawn with continuous recording; ideally second arterial catheter in aorta for beat-to-beat comparison; gradient from apex to outflow tract; pressure falls just before crossing the valve; Fig 5.12: oxford p.145
- Valsalva or vasodilator (e.g. sublingual GTN) accentuates gradient: oxford p.145
- Valsalva reduces return of blood to the heart: ref hanna-pcm (physiology, as in hd-pm-hocm)
- Nitroglycerin worsens LVOT obstruction by decreasing preload and afterload; do not administer to HOCM patients: brilakis p.42 (3.2.1.3.1)
- Routine post-ventriculogram LV-to-aorta pullback estimates the LVOT gradient: oxford p.120 ("set up the formal study" is a teaching gloss)
- Side-hole catheters can mask damping or ventricularisation at the tip: brilakis p.111 (5.6)
- End-hole catheter preferred for localisation: Academy hd-pm-hocm (refs hanna-pcm, nishimura-carabello-haemodynamics-2012)
- ESC 2023: LVOTO defined as peak instantaneous Doppler LVOT gradient ≥30 mmHg at rest or with provocation; ≥50 mmHg haemodynamically important, usual threshold for invasive treatment: ref esc-cardiomyopathy-2023; echo first line, invasive when echo inconclusive: Academy hd-pm-hocm; catheter peak-to-peak not interchangeable with Doppler instantaneous: as taught in hd-valves-as-gradients
- Brockenbrough sign: after PVC, gradient increases in AS with increase in systemic pressure; in HOCM systemic pressure of post-ectopic beat usually lower than beat before; Fig 5.13: oxford p.146; eponym ref brockenbrough-1961. LV pressure and gradient rise in HOCM, aortic systolic falls or fails to rise, aortic pulse pressure falls: Academy hd-pm-hocm Brockenbrough table (refs brockenbrough-1961, nishimura-carabello-haemodynamics-2012, hanna-pcm); Oxford is not cited for the HOCM gradient rise
- Phenylephrine purely vasopressor, vasopressor of choice in HCM because inotropic effect can worsen intracavitary obstruction; vasopressin also a pure vasopressor; phenylephrine 50–100 mcg IV bolus then 0.5–1.4 mcg/kg/min: brilakis p.56 (3.6.1.2)
- Nitroglycerin hypotension treatment: no additional doses (half-life 1.5–7.5 min), normal saline, waiting (often resolves after a few minutes), vasopressors (norepinephrine or phenylephrine) for extreme or persistent hypotension, assess other causes such as bleeding: brilakis p.42 (3.2.1.3.1)
- IABP contraindicated in HOCM with significant gradient: oxford p.290
- High coronary flow in HOCM and dilated cardiomyopathy: brilakis p.127 (6.6.3.1)
- FFR limited validation in hypertrophic cardiomyopathy: oxford p.234
- Videos: titles only (azHS4z4gllQ, gcsqWvUe0wQ, UYH8XJaH9k8)

## Lesson hb-specific-conditions-pe

- Invasive pulmonary angiography largely replaced by CTPA; catheterisation in massive PE when embolectomy considered: oxford p.139
- CTPA the imaging method of choice: ref esc-pe-2019
- RHC used during interventional procedures including intervention for PE: oxford p.93
- High-risk PE: thrombolysis; surgical embolectomy if contraindicated or failed; catheter-directed treatment considered as alternative: ref esc-pe-2019
- Right-sided microaxial pump indicated for acute RV failure from massive PE; inserted via the femoral vein into the main PA: oxford p.295
- 2026 AHA/ACC guideline: clinical categories, advanced interventional therapy recommendations: ref aha-acc-pe-2026 (abstract)
- Venous access carefully considered; femoral may dislodge iliofemoral clot; continuous PA and systemic pressures; PA systolic >60 mmHg contraindication unless very experienced: oxford p.139
- Venous access list includes pulmonary angiography: oxford p.79; IJ indications include pulmonary angiography with IVC thrombus or other obstruction such as caval filter: oxford p.82; femoral vein the usual route for routine right heart study: oxford p.80
- Right heart navigation: direct passage or RA loop prolapsing into RV; ectopy indicates RV; pull back from apex, rotate cranially, advance; wire helps; selective PAs by rotating and advancing; deep breath helps; vigorous manipulation causes ventricular arrhythmias: oxford p.111–112
- Protocol: AP, pigtail in main PA, 30–40 mL at 12–20 mL/s if normal PA pressures, DSA if breath-holding, selective 10 mL hand injections for filling defects; Fig 5.7 filling defects, multiple emboli: oxford p.140
- PR and PA dilatation on pulmonary angiography: oxford p.137
- Aortogram 40–60 mL at 20 mL/s LAO (distractor in check): oxford p.126; check options rewritten to equal length
- PIOPED figures and conclusion; incomplete studies usually because of a complication; consensus readings unchallenged diagnosis in 96%; risks sufficiently low to justify angiography in the appropriate clinical setting: ref stein-pioped-angiography-1992
- No videos (none matched to this topic in the brief)

## Quiz

- q1: ref omran-aortic-crossing-emboli-2003; oxford p.129
- q1: 3 deficits among the 22, about 19% silent (arithmetic on Omran abstract)
- q2: oxford p.129 (controlled manipulation)
- q3: oxford p.116; ref esc-vhd-2025 (DSE, CT calcium complementary); invasive dobutamine: hd-valves-as-area (hanna-pcm)
- q4: Gorlin MVA arithmetic 37.7 × 0.40 × 75 = 1131; × √25 (5) = 5655; 4500 ÷ 5655 = 0.796 ≈ 0.80; without square root 1131 × 25 = 28275, 4500 ÷ 28275 = 0.159 ≈ 0.16; with gradient 22–23 mmHg: 0.85–0.83; bands oxford p.134; ESC ≤1.5 line ref esc-vhd-2021 (clinically significant) and esc-vhd-2025 (clinically severe rheumatic MS, figure title); wedge 2–3 mmHg oxford p.133
- q5: oxford p.135
- q6: grade IV oxford p.132; Amplatz/EBU acute AR brilakis p.487; IABP contraindication brilakis p.251, oxford p.290
- q7: oxford p.138
- q8: ref talreja-constriction-2008
- q9: oxford p.114, p.143, p.144
- q10: brilakis p.56, p.42; oxford p.145 (vasodilator only as a way of accentuating the gradient), p.290
- q11: ref stein-pioped-angiography-1992; oxford p.139

## Cases

- hb-specific-conditions-case-syncope: crossing indications oxford p.129, ESC ref esc-vhd-2025 (section 8.2.2); Omran percentages; ventriculography relative contraindication oxford p.117; crossing technique and Prussian helmet oxford p.129–130; JR4 in difficult-valve sequence oxford p.108; simultaneous pressures and pullback limitations, femoral less accurate oxford p.129; gradient localisation oxford p.145; post-ectopic aortic pressure oxford p.146; provocation oxford p.145; nitroglycerin hypotension brilakis p.42; phenylephrine brilakis p.56; inotrope worsens obstruction brilakis p.56; IABP contraindication oxford p.290; high-flow opacification brilakis p.127. The neurological event now occurs on the table; the best response (stop manipulation, stroke team now, limit the study, no provocation) rests on Omran (embolism after crossing, 3% clinically apparent) and is a clinical safety step; the flagged path continues at a planned repeat study (variants on measure, localise, provoke). Presentation states TOE and CT calcium scoring were inconclusive (ESC 2025 role of CT calcium; oxford p.129 discrepancy with non-invasive testing). 'localise' uses an end-hole multipurpose catheter for the pullback: Academy hd-pm-hocm (pigtail side holes straddle the gradient). Removed 'acceptable' from the JR4/stiff-wire and GTN-without-vasopressor options. Radial reference feedback: peripheral delay and amplification from hd-valves-as-gradients. Hypotension feedback: full Brilakis nitroglycerin-hypotension sequence p.42 and phenylephrine dose p.56. The numbers in the case (pressures, durations, the speech disturbance) are synthetic.
- hb-specific-conditions-case-pe: venous access and monitoring and 60 mmHg rule oxford p.139; IJ with IVC thrombus or filter oxford p.82; right heart navigation and arrhythmias oxford p.111–112; protocol for normal pressures oxford p.140; PIOPED ref stein-pioped-angiography-1992; treatment ref esc-pe-2019 and ref aha-acc-pe-2026 (pointer only); right-sided microaxial pump via femoral vein into the main PA oxford p.295. The 'inject' option at PA 66 mmHg is no longer marked acceptable (oxford p.139). The history of a previous DVT and months of exertional breathlessness was added so that the PA systolic pressure of 65–66 mmHg is plausible; the module makes no claim about chronic thromboembolic disease. Clinical details are synthetic.

## Tips

- haemo-as-cross-only-if-discordant: oxford p.129 ("for example" wording); ref omran-aortic-crossing-emboli-2003
- haemo-as-al1-straight-wire: oxford p.129–130
- haemo-as-simultaneous-gradient: oxford p.129
- haemo-ms-wedge-lv-ten-beats: oxford p.133
- diag-lvgram-catheter-induced-mr: oxford p.135, p.118
- diag-aortogram-ar-grading: oxford p.126, p.132
- haemo-ps-continuous-pullback: oxford p.137, p.113; hd-valves-ar-ps (hanna-pcm) for diastolic contour
- haemo-ts-two-matched-catheters: oxford p.138
- haemo-tr-ra-v-wave: oxford p.138, p.114
- haemo-constriction-simultaneous-lv-rv: oxford p.143, p.145; refs hurrell-constriction-1996, talreja-constriction-2008
- haemo-constriction-check-ventilation: oxford p.114, p.143
- haemo-hocm-pullback-second-catheter: oxford p.145
- haemo-hocm-provoke-valsalva-gtn: oxford p.145; brilakis p.42, p.56
- haemo-hocm-post-ectopic-aorta: oxford p.146; hd-pm-hocm for LV pressure and gradient rise in HOCM and the narrower pulse pressure (brockenbrough-1961 as eponym only)
- haemo-hocm-hypotension-phenylephrine: brilakis p.56 (phenylephrine choice and 50–100 mcg bolus), p.42 (stop nitrate, saline, often settles within minutes, vasopressor if extreme or persistent); oxford p.290
- haemo-pe-venous-access-clot: oxford p.139, p.82
- haemo-pe-pa-pressure-limit: oxford p.139
- haemo-pulmonary-angiography-protocol: oxford p.140

## Tip triggers

- The haemo tips in this module trigger on phase alone because the haemo lab has no scenario events yet; the crowding risk under the five-tip limit is recorded in docs/curriculum/lab-requests/hb-specific-conditions.json (last entry, P1).
