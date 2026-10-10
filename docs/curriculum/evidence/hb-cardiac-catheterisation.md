# Evidence: hb-cardiac-catheterisation (Right and left heart catheterisation)

Module file: `src/content/manual/cath-handbook/04-cardiac-catheterisation.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21). One new reference was added in round 1 (fixer): `ghadri-takotsubo-consensus-2018` (PMID 29850871, PMC5991216; full text read). `omran-aortic-crossing-emboli-2003` (PMID 12699950) is the registry entry added by hb-specific-conditions; its abstract was re-read on PubMed in round 1. Existing registry references used: `oxford-cath-handbook`, `brilakis-manual-pci`, `esc-ph-2022`, `esc-achd-2020`, `hanna-pcm` (for the 1.36 mL O₂/g haemoglobin factor, as in the Academy lesson hd-flow-fick, and for the Academy-lesson cross-references on the v-wave mechanism (hd-waveforms-right), RBBB/complete heart block and PA rupture (hd-basics-catheters-access), which cite it), `korabathina-papi-2012`, `tehrani-shock-team-2019` (source of Brilakis Fig 24.7, as credited on brilakis p.429), `kovacs-zero-reference-2013` (zeroing landmark, via the reused tip haemo-mon-zero-level), `sellers-1964` (angiographic regurgitation grading, cited as background only).

## Notes for checkers

- Oxford printed PDF pages 94, 102, 106, 124 and 127 are blank or figure-only (checked on the PDF images for p.94); Figs 4.14 (p.109) and Table 4.1 (p.113) were read from the PDF images.
- Brilakis extract drops inequality signs; confirmed on the page images or by context: ">18 mmHg", "<0.9", ">25 mmHg", "<50%" (p.249); ">12 mmHg", "<0.9" (p.251); "<1.8", "<2.2", ">15", "<0.6 W", "<1.0" (p.429); "CPO = [MAP × CO]/451", "PAPi = [sPAP − dPAP]/[RA]" (p.429 caption, p.251).
- Disagreements taught explicitly:
  - Invasive cardiac output: Oxford calls the invasive methods inaccurate and rarely if ever used clinically (oxford p.115); Brilakis's shock pathway relies on Fick CI and CPO (brilakis p.429); the 2022 ESC/ERS guideline prefers thermodilution in PH work-up (ref esc-ph-2022).
  - PVR normal: Oxford 25–125 dyn·s·cm⁻⁵ (oxford p.115) versus ESC/ERS 2022 abnormal above 2 WU (ref esc-ph-2022). 25–125 dyn ÷ 80 = 0.3–1.6 WU (arithmetic).
  - PAPi threshold: 0.9 (brilakis p.251, 14.1.8) versus 1.0 (brilakis p.429, Fig 24.7).
  - Severe shock criteria: Oxford ch 9 CI <1.5, PCWP >30, LVEDP >30, CP <0.6 W (oxford p.287) versus Brilakis Fig 24.7 (brilakis p.429).
  - LVEDP thresholds within Oxford: reduce injection >25 mmHg (oxford p.119); pulmonary oedema likely >30, avoid LV gram (oxford p.110); relative contraindication >35 (oxford p.117).
  - Aortogram dose: Oxford 40–60 mL at 20 mL/s LAO (oxford p.126); Brilakis 60 mL over 3 s (brilakis p.118, 5.7.3.6) and 60 mL at 20 mL/s LAO (brilakis p.338, 18.5).
  - Coarctation threshold: Oxford >50 mmHg (oxford p.126); 2020 ESC ACHD guideline invasive peak-to-peak ≥20 mmHg in hypertensive patients with a raised non-invasive gradient (ref esc-achd-2020; the reference is in the registry as verified; the full text could not be re-read in this session, so the claim is limited to that one recommendation).
  - Normal right heart ranges: Oxford Table 4.1 (oxford p.113) differ from the Academy lesson hd-waveforms-left; the lesson says ranges differ and are a sense check.
- Book errors handled: Oxford's AR grade III reads "becoming equal to the left ventricle" (oxford p.132); the lesson gives the evident meaning (LV reaching the density of the aorta), consistent with grades II and IV on the same page. Oxford's Fick sentence says "difference between systemic and arterial oxygen concentrations" (oxford p.115) but the printed formula is Ao − PA content; the lesson follows the formula (arterial minus mixed venous).
- Vasoreactivity testing is not in either manual; the lesson says so and cites only ref esc-ph-2022 (indications idiopathic/heritable/drug- or toxin-associated PAH; inhaled NO or iloprost, IV epoprostenol alternative; positive = fall ≥10 mmHg to ≤40 mmHg with CO unchanged or increased; avoided in left heart disease is attributed to the Academy lesson hd-flow-resistance-ph). These match the Academy lesson hd-flow-resistance-ph, which cites the same guideline. The guideline full text is not in PMC (DOI 10.1093/eurheartj/ehac237 returned no PMCID), so it was not re-read in this session.
- Author reasoning, labelled or obvious from arithmetic: all worked examples and quiz arithmetic; the case statement that air in a patient with an ASD is not safely ignored (Oxford: air may embolise, oxford p.97; abnormal communication allows paradoxical embolus, oxford p.147); the pearls on using breathing to advance a catheter (from oxford p.111–112) and taking the aortogram before crossing a stenotic valve (from oxford p.129).
- Possible issues in existing Academy lessons (for the checkers and fixer to route; not edited):
  - `dx-lv-gram` (diagnostic.ts) grades MR 2+ as LA opacification "not clearing completely"; Oxford grade II is moderate LA opacification that "clears with subsequent beats" (oxford p.135). The two should be reconciled or attributed.
  - `dx-lv-gram` lists "pre-existing right bundle branch block" as a reason to avoid ventriculography; neither manual says this (unverified, not repeated here).
  - `dx-lv-gram` gives typical settings "30–40 mL at 10–15 mL/s"; Oxford gives 30–35 mL (oxford p.119).
  - `hd-waveforms-left` normal values differ from Oxford's (PA diastolic 4–12 vs 4–8; RVEDP 2–8 vs RV diastolic 6–12; wedge 4–12 vs 6–12; SVR 800–1200 vs 800–1400; CI 2.5–4.0 vs 2.5–3.5). Not wrong as ranges vary, but no source is named for them.

## Lesson hb-cardiac-catheterisation-setup

- Definition: invasive haemodynamic data by direct and indirect pressures and saturations, anatomy by contrast; RHC used to be routine; non-invasive imaging reduced the need; review imaging and confirm indication: oxford p.93
- Indications table (left, right, simultaneous, each item): oxford p.93
- Brilakis: RHC strongly recommended in low EF complex PCI or unclear haemodynamic status; Swan Ganz left in place to monitor PA pressure and guide escalation/de-escalation: brilakis p.249 (14.1.1); RHC useful for finding cause of hypotension: brilakis p.485 (28.1.1.2); shock pathway with RHC: brilakis p.429 (Fig 24.7); also brilakis p.428 (24.2.2)
- Check 1 (mitral disease needs simultaneous study; PCWP vs LV gradient): oxford p.93; oxford p.133
- Manifold 3–5 ports; proximal to catheter; port to pressure via flush infusion; port to contrast; syringe at distal end; zero by opening distal port to air at mid-chest; flush to avoid air embolism; check assistant's set-up before injection: oxford p.97
- Flush: heparinised saline, e.g. 1000 IU in 500 mL 0.9% saline, per protocol: oxford p.97
- Levelling detail and mid-thoracic landmark: cross-reference to pm-monitoring (tip haemo-mon-zero-level; ref esc-ph-2022, kovacs-zero-reference-2013)
- Fluid-filled system: timing delay and damping; tip transducer more accurate but impractical and expensive; end-pressure, catheter impact, catheter whip artefacts: oxford p.95
- Guidewires: core, spring coil, coating; 30–45 cm; 250–300 cm; 0.025 inch for arm; 0.03–0.038 inch J for diagnostic; straight or J tips; hydrophilic useful, exchangeable, more fragile, not through introducer needle: oxford p.97
- Catheters: French by outer diameter; 4–8 F, typically 6 F; most 100 cm; Luer-Lok; check prior catheters and problems: oxford p.103
- Pressure injector: precise bolus at exact rate; chambers and large vessels; expel air from reservoir; secure catheter (disarticulation); aspirate for bubbles; control per local policy; watch image and stop for displacement/staining: oxford p.97
- Contrast: vasodilatation, myocardial depression, LVEDP rise, more with high osmolality; non-ionic for severe LV impairment, severe CAD, severe valve disease: oxford p.101; 5–7 mL/kg: oxford p.101
- Check 2 (stop injection if displacement/staining): oxford p.97; rise time to prevent catheter whip: oxford p.119; wire removed before connecting injector: oxford p.126
- Pearl (check prior catheters and problems with catheter selection): oxford p.103; the rest is labelled practical reasoning
- Reused tips: haemo-mon-zero-level, haemo-mon-fast-flush (pm-monitoring sources). New tip haemo-setup-manifold-check: oxford p.97

## Lesson hb-cardiac-catheterisation-rhc

- Venous access purposes (RH pressures/saturations, CO, shunts, pulmonary angiography, biopsy); route depends on procedure, patient, expertise: oxford p.79
- Right femoral vein usual for L+R studies; SVC approaches sometimes preferred: oxford p.111; femoral vein medial to artery; sheath usually 5 or 6 F; sidearm flushed against thrombus; route most used for routine L+R: oxford p.80
- IJ indications: PA catheterisation, biopsy, pulmonary angiography with IVC thrombus or filter: oxford p.82
- Catheter range (short RA catheters to balloon flotation able to wedge); multipurpose for most diagnostic RHC: oxford p.111
- Steps 1–7 (connect to pressure, flush before insertion; RA easy from either cava; femoral side branches, withdraw and rotate under screening; direct crossing or RA loop prolapse like pacing leads; wire stiffens and gives torque; ectopy indicates RV; pull back from RV apex, rotate cranially, advance to main PA; wire in difficult cases; selective RPA/LPA by rotating and advancing; wedge by advancing on inhalation to gentle resistance): oxford p.111
- Difficult right heart (loop; withdraw and rotate; soft-tipped J wire to stiffen; deep breath helps reach PA and clearer PCWP; vigorous RV manipulation causes ventricular arrhythmias): oxford p.111–112
- VT can be induced during RH manipulation, particularly RVOT: oxford p.309; VT management (synchronised DC cardioversion if poorly tolerated; IV beta-blocker or amiodarone if tolerated; lidocaine; overdrive pacing): oxford p.309–310
- Knotting (vigorous prolonged manipulation; expert help immediately; do not pull tight; wire may undo; else pull tight, back to sheath, remove system; bleeding; surgical repair may be needed; snares and forceps; surgical removal reported): oxford p.112
- AF from atrial irritation during RHC; most self-terminate: oxford p.310
- Tamponade from RV catheter/pacing wire manipulation (thin wall): oxford p.305
- Check 1 (off apex, cranial, advance; vigorous manipulation and arrhythmias): oxford p.111–112
- Table 4.1 normal ranges: oxford p.113 (PDF image)
- mPAP >20 defines PH: ref esc-ph-2022; Academy values differ: hd-waveforms-left
- RA trace (a after P, peak = maximum RV filling; c TV closure; v RV contraction; RA slightly lower than LA; v slightly smaller than a; AF loss of a; CHB/junctional cannon waves; TR large c and v, loss of x; TS prominent a, muted y); RV a wave = RA contraction: oxford p.114 (Fig 4.18 caption)
- PCWP slightly damped LA; mean PCWP similar to PA diastolic in normal physiology: oxford p.114 (Fig 4.19 caption)
- Respiratory variation spontaneous vs ventilated: oxford p.114; end-expiration: ref esc-ph-2022
- Check 2 (ventilated pattern reverses): oxford p.114; Kussmaul's sign is an inspiratory rise in RA pressure: oxford p.143
- Brilakis: RA >12 or PAPi <0.9 RV failure, PAPi formula: brilakis p.251 (14.1.8); PCWP >18 LV failure: brilakis p.249 (14.1.1); ref korabathina-papi-2012
- Tips haemo-rhc-flush-and-watch, -femoral-side-branch, -ra-loop, -apex-to-pa, -wedge-inspiration, -knot: oxford p.111–112, p.309; reused haemo-support-rhc-thresholds (pm-support-choice)

## Lesson hb-cardiac-catheterisation-lhc

- Routes: retrograde femoral/radial/brachial; transseptal via PFO, ASD, transseptal puncture; through VSD: oxford p.107
- Pigtail first choice from femoral; MP occasional alternative from the arm; 0.035 inch J wire: oxford p.107
- Pigtail less likely to advance behind a papillary muscle than Amplatz or MP, in the Impella insertion steps (crossing to place a 0.014/0.018 inch stiff wire): brilakis p.258 (14.4.5.2); pigtail tip can catch in papillary muscles during ventriculography: oxford p.119
- Normal crossing steps (tip just above valve; withdraw wire, connect pressure; optimise for aortography; AP or RAO; slight U loop; gentle pressure; optimise for LV gram): oxford p.107
- Difficult valve sequence (check notes for AS; reintroduce wire to stiffen; wire leads, catheter tip directs; JR4 or AL; straight or hydrophilic wire; advance catheter over wire, withdraw wire, connect; exchange over long wire to pigtail for LV gram): oxford p.108
- Brilakis, Impella setting: cause of difficulty is aortic stenosis; balloon dilatation may be needed; 0.035 inch J wire stiffens the pigtail: brilakis p.258 (14.4.5.3.1)
- Check 1: oxford p.108
- Stenotic valve (rarely performed for diagnosis, rarely changes management, hazardous, emboli on brain MRI; echo gold standard; when needed e.g. discrepancy or TAVI work-up: 5 F AL1 + hydrophilic straight-tipped wire, exchange to pigtail with exchange-length J wire, controlled wire; aortography shows leaflet opening, Prussian helmet sign): oxford p.129, Fig 5.2 p.130
- Gradient methods (simultaneous most accurate, two catheters or double-lumen; femoral less accurate; pullback peak-to-peak with limitations): oxford p.129
- Normal values Ao 100–140/60–90, LV 100–140/3–12, LA 1–10, adult male: oxford p.109 (Fig 4.14, PDF image)
- LA waves a/c/v, v slightly higher than a, x and y descents; LV a wave; aortic dicrotic notch, IABP timing: oxford p.110
- LVEDP at end of diastole just after a wave (C-point) or with R wave; normal 3–12; >30 oedema likely; high LVEDP minimise contrast, avoid LV gram; PCWP indirect: oxford p.110
- Check 2 (26 mmHg; reduce above 25): oxford p.110, p.119
- High LVEDP causes incomplete coronary filling: brilakis p.127 (6.6.3.1)
- VT during LV catheterisation: oxford p.309
- Pearl (aortogram first): oxford p.129 (aortography may help identify leaflet opening); the aiming use is labelled author's reasoning
- Tips haemo-lhc-u-loop (oxford p.107), haemo-lhc-difficult-valve (oxford p.108; brilakis p.258), haemo-lhc-stenotic-valve (oxford p.129), haemo-lhc-lvedp-point (oxford p.110); reused diag-lvedp-before-lv-gram (cm-flow-embolism)

## Lesson hb-cardiac-catheterisation-output

- Oxford: CO estimated by LV gram or measured by thermodilution/Fick; invasive techniques inaccurate, rarely if ever performed clinically; basic understanding still important: oxford p.115
- Brilakis shock pathway with Fick CI and CPO: brilakis p.429 (Fig 24.7, from Tehrani et al.; ref tehrani-shock-team-2019); serial invasive haemodynamics in shock: brilakis p.428 (24.2.2)
- ESC/ERS 2022: CO a core RHC measurement in PH; thermodilution preferred: ref esc-ph-2022
- CI = CO/BSA, typically 2.5–3.5: oxford p.115
- Thermodilution: bolus into proximal port of RH catheter (Swan–Ganz type), thermistor at distal end, computerised analysis: oxford p.115; technique cross-referenced to hd-flow-thermodilution
- Fick formula (O₂ consumption ÷ Ao−PA content mL/100 mL × 10); O₂ consumption hard to measure; indirect Fick assumes VO₂ from sex, age, BSA: oxford p.115
- 1.36 mL O₂/g Hb: ref hanna-pcm (as in hd-flow-fick)
- Worked example arithmetic: author's; CPO formula and 0.6 W threshold: brilakis p.429
- Check 1 arithmetic (Hb 10 → 5.1 L/min): author's; haemoglobin cancels in shunt ratio: follows from oxford p.116 formula using saturations only
- Shock criteria table: brilakis p.429 (Fig 24.7: Fick CI <1.8 without, <2.2 with inotropes/vasopressors; PCWP >15; CPO <0.6 W; PAPi <1.0); oxford p.287 (BP <90 etc.; CI <1.5; PCWP >30; LVEDP >30; cardiac power <0.6 W) under 'Choice of MCS' in the MCS devices section; brilakis p.486 (Fig 28.1)
- PAPi 0.9 vs 1.0: brilakis p.251 vs p.429
- SV = EDV − ESV: oxford p.122 (EF formula labelled stroke volume); CO = SV × HR: brilakis p.487 (28.1.1.2.2)
- Gorlin constants 44.3 and 37.7; depends on forward flow; overestimates at high CO, underestimates at low; rarely used now: oxford p.116
- Check 2 arithmetic (70 × 3.2 ÷ 451 ≈ 0.50 W): author's, formula brilakis p.429; threshold oxford p.287 and brilakis p.429
- Tips haemo-co-say-how (oxford p.115), haemo-co-index-it (oxford p.115; brilakis p.429); reused haemo-support-cpo-papi (pm-support-choice)

## Lesson hb-cardiac-catheterisation-resistance

- Resistance = pressure gradient ÷ flow; Wood units and dyn·s·cm⁻⁵, 1 Wood = 80; SVR useful for hypotension, low in sepsis, high in cardiogenic shock, normal 800–1400; PVR normal 25–125, measured in transplant assessment; SVR formula 80 × (Ao mean − RA mean)/CO: oxford p.115; PVR formula 80 × (PA mean − LA mean or PCWP)/CO: oxford p.116
- ESC/ERS 2022: PVR >2 WU abnormal; mPAP >20; pre-capillary PAWP ≤15 and PVR >2; IpcPH PAWP >15 PVR ≤2: ref esc-ph-2022
- Worked example and check 1 arithmetic: author's
- False hypotension checks (Y-connector, connection/air, dampening, air/thrombus/contrast in catheter, bulky equipment): brilakis p.485 (28.1.1.1), Fig 28.1 p.486
- True hypotension: hypovolaemia, cardiac failure, peripheral vasodilation; RHC to determine cause: brilakis p.485; RHC pattern table and examples (bleeding, poor hydration; ischaemia, LV/RV failure, regurgitation/stenosis, tamponade, myocardial rupture, brady/tachycardia; vasovagal, anaphylaxis, medications; LV filling pressure can be low in RV failure): brilakis p.486 (Fig 28.1)
- Check 2 arithmetic (SVR ≈ 545): author's; pattern brilakis p.486; range oxford p.115
- PAPi formula and thresholds: brilakis p.251 (14.1.8)
- Vasoreactivity: ref esc-ph-2022 (see Notes); not in either manual (searched both extracts for 'vasoreactiv', 'nitric oxide', 'iloprost': no hits in the relevant sense)
- Tips haemo-pvr-right-pressures (oxford p.115–116), haemo-hypotension-pattern (brilakis p.485–486; oxford p.115)

## Lesson hb-cardiac-catheterisation-shunts

- Oximetry from multiple venous and arterial samples; errors from streaming and inaccurate positioning; commonest use L→R ratio; samples SVC, IVC, PA, aorta; MV = (3 × SVC + IVC)/4 because SVC lower than IVC; Qp/Qs = (Ao − MV)/(PV or 98 − PA); substitute 98% if no PV; <1.5 small; >2 large: oxford p.116
- ESC ACHD weighs ratio with RV volume load and PVR; ASD closure with RV volume overload and PVR <3 WU regardless of symptoms: ref esc-achd-2020 (as in hd-shunts-patterns)
- Worked example and check 1 arithmetic: author's
- Denominator 13 points in the example: arithmetic
- ASD: commonest congenital defect in adults; breathlessness/palpitation from RHF and PH; TTE and TOE diagnosis; RHC with PA pressure, RH pullback, attempt to cross for LA sat, quantify shunt, exclude anomalous PV drainage; secundum commonly closed percutaneously, often planned with study, TOE or ICE guidance: oxford p.141
- ASD as route to left heart: oxford p.107
- VSD: echo confirms; cath for location, size, shunt; in adults during or just before corrective procedure; simultaneous LV and RV pressures for gradient; oximetry; LV gram LAO cranial shows septum, contrast LV→RV: oxford p.142 (Fig 5.9)
- Check 2 (LAO 60 cran 20 for VSD; RAO walls; AP for RV gram): oxford p.119, p.118
- Tips haemo-shunt-mixed-venous (oxford p.116), haemo-shunt-asd-cross (oxford p.141), haemo-shunt-vsd-simultaneous (oxford p.142); reused haemo-post-mi-shunt-run (cp-acs-thrombus)

## Lesson hb-cardiac-catheterisation-lv-gram

- LV gram traditionally routine; identifies function, wall motion, aneurysm, thrombus, VSD, valvular regurgitation; indications; relative contraindications (critical AS; severe LMS, hypotension risk; LVEDP >35; pulmonary oedema; LV systolic hypertension; LV thrombus); complications (VT/VF; air/thrombus embolism; contrast reactions and nephropathy; intramyocardial injection usually benign, tamponade may occur; access complications); echo obviates radiation and contrast and gives all and more: oxford p.117
- Brilakis ACS: hypokinesis on LV gram/echo identifies culprit: brilakis p.143 (7.2.1a); LV gram diagnoses takotsubo and mechanical complications (papillary muscle, free wall rupture), TTE alternative: brilakis p.145 (7.2.10); brilakis p.379 (20.7)
- Procedure steps: pigtail with side holes; mid-cavity minimises ectopy and avoids mitral apparatus; care with aneurysm (mural thrombus); connect to pressure, confirm LV trace, note LVEDP; connect injector, extension sometimes; expel contrast slowly to eliminate air; secure connections: oxford p.118
- Injection: avoid air; preset volume over programmed time; 30–35 mL at 10–15 mL/s; rise/fall 0.1–0.5 s, 1/100th of flow rate, 0.1 s at 10 mL/s, to prevent whip; impaired LV or LVEDP >25 reduce (e.g. 30 mL at 10 mL/s); warn of warm flush and micturition sensation; deep breath hold, line up, repeat and acquire; inject a few frames after start; acquire until satisfactory cycle; withdraw rapidly if complications; reconnect to pressure: oxford p.119
- Difficulties: papillary muscles (rotate, withdraw); apical ectopy (withdraw, reposition); acquire until ectopic-free cycle; avoid injecting into aneurysm, 10 mL hand test; warn patient: oxford p.119
- Views: RAO 30 anterior, apical, inferior; LAO 60 cranial 20 posterolateral and septal, VSD; biplane single injection, more radiation and time: oxford p.119; MR in RAO 30 with panning to LA, LAO also; 30–60 fps; reconnect pressure without air; diagnostic quality, repeat if needed; pullback LV→Ao for LVOT gradient; remove over wire: oxford p.120
- Check 1 (apical ectopy): oxford p.119; ectopics affect MR grading: oxford p.135
- Interpretation: eyeball normal/mild/moderate/severe; quantitative software; EF = (EDV − ESV)/EDV: oxford p.121–122; wall motion normal/hypokinetic/akinetic/dyskinetic: oxford p.122; thrombus filling defect, apex, poor LV/aneurysm, may be laminar: oxford p.122
- Takotsubo: unobstructed arteries, classical apical ballooning: oxford p.148
- Anomalous Cx dot sign (vessel end-on), retro-aortic course, absent lateral wall vessel: oxford p.181
- VSD contrast LV→RV: oxford p.142
- MR grades I–IV; estimate depends on regurgitant volume and LV function; exclude catheter-induced MR and ectopics; may show cause (flail leaflet, annular calcification): oxford p.135
- Check 2: oxford p.135
- RV gram: TR, R→L shunts, RV cardiomyopathies, RVOT abnormalities; AP projection shows TV and PAs: oxford p.117–118 (Fig 4.20)
- Intramyocardial injection → tamponade: oxford p.305 (Fig 10.2)
- Pearl (three LVEDP figures): oxford p.110, p.117, p.119
- Tips diag-lv-gram-mid-cavity (oxford p.118–119), diag-lv-gram-injector (oxford p.118–119), diag-lv-gram-test-injection (oxford p.119, p.305), diag-lv-gram-papillary (oxford p.119), diag-lv-gram-clean-cycle (oxford p.119, p.135), diag-lv-gram-views (oxford p.119–120), diag-lv-pullback-over-wire (oxford p.120); reused diag-lvedp-before-lv-gram, diag-lv-gram-tamponade

## Lesson hb-cardiac-catheterisation-aortography

- Indications (AR severity; aortic pathology, aneurysm, dissection rarely, coarctation; graft origin and patency): oxford p.125
- Cusp angiography or aortography when ostium not understood; anomalous origin or flush ostial occlusion; RAO instead of LAO; 60 mL over 3 s through pigtail: brilakis p.117–118 (5.7.3.1, 5.7.3.2, 5.7.3.6)
- TAVI: aortography always to assess valve–ascending aorta angulation: oxford p.131
- Prussian helmet sign: oxford p.129–130
- Procedure: pigtail with side holes; advance on wire under screening to proximal ascending aorta; not interfering with leaflets; remove wire, aspirate, connect injector; breath hold, 40–60 mL at 20 mL/s, LAO; grafts: slightly higher, prolonged acquisition: oxford p.126
- Brilakis graft aortogram 60 mL at 20 mL/s LAO; continue until all territories have a flow source: brilakis p.338 (18.5.2)
- Check 1: instruction to keep the catheter from interfering with leaflet opening/closing: oxford p.126; that a catheter holding a leaflet creates or exaggerates AR is labelled author's reasoning (Oxford links valve interference to pullback-gradient errors, oxford p.129)
- AR grades I–IV, depends on regurgitant volume and LV function: oxford p.132 (grade III typo, see Notes)
- Amplatz or deeply curved EBU (wording corrected from 'deeply seated' in round 1) can push cusp open, acute AR, hypotension, repositioning corrects: brilakis p.487 (28.1.1.2.2, Fig 28.2)
- Graft road map: aortography before graft localisation when unclear which grafts, occluded graft, locate origin; LAO; loop images, freeze clearest frame, road map in same projection; sternal sutures and rib spaces as markers: oxford p.187
- Check 2: oxford p.187; brilakis p.338
- Coarctation: catheter determines gradient; aortography size, site, coexisting pathology; >50 mmHg indication; RAO imaging: oxford p.126; ESC 2020 ACHD threshold: ref esc-achd-2020 (see Notes)
- Pearl (RAO for anomalies): brilakis p.117 (5.7.3.1)
- Tips diag-aortogram-setup (oxford p.126), diag-aortogram-graft-roadmap (oxford p.187, p.126; brilakis p.338), diag-aortogram-anomalous-origin (brilakis p.117–118; oxford p.182 tips for anomalous coronaries, catheter choice from aortography)

## Quiz

- q1: oxford p.93
- q2: oxford p.111–112
- q3: oxford p.112
- q4: oxford p.129; critical AS relative contraindication to LV gram oxford p.117
- q5: formula oxford p.115; 1.36 ref hanna-pcm; arithmetic author's
- q6: oxford p.115; arithmetic author's
- q7: oxford p.116; arithmetic author's
- q8: oxford p.119, p.110, p.126; brilakis p.118
- q9: oxford p.119, p.118
- q10: oxford p.132, p.126
- q11: brilakis p.485–487 (Fig 28.1, Fig 28.2)
- q12: ref esc-ph-2022

## Cases

- Case ASD: preparation oxford p.97, p.111; air risk with communication (author reasoning: oxford p.97, p.147); RA loop, soft J wire oxford p.111–112; vigorous manipulation, arrhythmias, VT in RVOT oxford p.112, p.309; persisting VT management oxford p.309; knot management oxford p.112; IJ suits PA catheterisation oxford p.82; femoral usual oxford p.80, p.111; to PA oxford p.111–112; samples and LA crossing oxford p.116, p.141; Flamm and ratio oxford p.116; Oxford thresholds oxford p.116; PVR with Qp and closure criteria ref esc-achd-2020; unclassified PH category ref esc-ph-2022; TOE-guided percutaneous closure oxford p.141; vein surgical repair after knot removal oxford p.112.
- Case LV study: difficult valve sequence oxford p.108, brilakis p.258; LVEDP thresholds oxford p.110, p.119; pulmonary oedema cause and management (high-flow O₂, sit up) oxford p.302; mid-cavity position and air-free connection oxford p.118; ectopics and MR oxford p.119, p.135; intramyocardial injection and tamponade, echo, pericardiocentesis oxford p.117, p.305; RAO walls, MR grade I, LAO for septum oxford p.119, p.135; wall motion terms oxford p.122; pullback and removal over wire oxford p.120.

## Round 1 fixer changes (claims added or reworded, with sources)

### Setup
- Cardiac cycle steps from Fig 4.1 (MV closes near QRS as LV exceeds LA; AV opens as LV exceeds aorta; AV closes at dicrotic notch; MV opens as LV falls below LA; EDV at start of ejection, ESV after AV closure): oxford p.96 (figure read on the PDF image); "timings important to interpretation": oxford p.95; gradients read from overlaid traces: oxford p.130 (Fig 5.1), p.133 (Fig 5.3)
- Mechanical injector pumps for coronary angiography, hand controller, may improve image quality and reduce contrast dose: oxford p.97
- Contrast table: why iodine, opacification by higher atomic weight liquid, iodine soluble and low toxicity, renal excretion: oxford p.99; osmolality (mOsm/kg H₂O, better opacification, draws water, heat/discomfort, renal and blood–brain barrier toxicity, closer to blood better tolerated), viscosity, ionic monomer/dimer/non-ionic (non-ionic better side-effect profile, greater cost), idiosyncratic anaphylactoid reactions of unknown mechanism, dose-dependent effects (heat, flushing, localised discomfort e.g. IMA injection, vasodilatation, hypotension, myocardial depression), nephropathy especially diabetes and reduced creatinine clearance: oxford p.100; 5–7 mL/kg, transient renal dysfunction more common with pre-existing renal failure, ECG changes (transient bradycardia resolving in seconds, transient ST changes and QRS widening, ventricular arrhythmias uncommon with coronary injection): oxford p.101; reactions usually IgE-mediated (intra-book disagreement taught): oxford p.307
- Current practice low- or iso-osmolar for everyone and eGFR-based budget as a guide: Academy lesson dx-ind-prep (diagnostic.ts, "Use a low- or iso-osmolar agent"; contrast budget from eGFR)
- "Reproduces a cardiogenic shock pathway (from Tehrani and colleagues)": brilakis p.429 caption; ref tehrani-shock-team-2019
- Luer-lock (generic spelling of oxford p.103 connector)

### Right heart
- Arm route (antecubital vein with radial artery; femoral vein kept for transseptal or large-bore work): Academy lesson hd-basics-catheters-access (haemodynamics.ts)
- PA diastolic 4–8 vs PCWP 6–12 quirk: oxford p.113 (Table 4.1); wedge mean below PA diastolic and Academy ranges PA diastolic 4–12, wedge 4–12: Academy hd-basics-catheters-access and hd-waveforms-left (haemodynamics.ts)
- v wave: Oxford RV contraction (oxford p.114) and LV systole (oxford p.110); filling mechanism from Academy hd-waveforms-right (haemodynamics.ts, "Atrial filling from the venae cavae against a closed tricuspid valve")
- PCWP >25 with mixed venous saturation <50%: high risk of periprocedural pulmonary oedema and shock: brilakis p.249 (14.1.1)
- Knot: cause vigorous prolonged manipulation; occasionally undone by carefully advancing the guidewire: oxford p.112; recognition by loss of torque labelled author's advice
- RBBB/complete heart block with LBBB, pacing available; PA rupture rare but often fatal, risk with PH, age, anticoagulation, distal position: Academy hd-basics-catheters-access (haemodynamics.ts pitfalls); not in either manual (stated)
- Pearl: deep breath helps into PA and clearer PCWP: oxford p.112; wedge on inhalation: oxford p.111; timing labelled practical reasoning

### Left heart
- Stenotic valve: cross when non-invasive data inconclusive or discordant (oxford p.129 discrepancy example; Omran authors' conclusion "unclear echocardiographical findings"); Omran 2003: 22 of 101 (22%) new DWI lesions, 3 (3%) clinically apparent deficits, none without valve passage: ref omran-aortic-crossing-emboli-2003 (abstract)
- Controlled wire manipulation; crossing attempts frequently cause emboli: oxford p.129
- LVEDP: oedema likely >30; avoid LV gram when LVEDP is "high" with no number: oxford p.110

### Output
- Oxford position: inaccurate, rarely if ever used clinically, basic understanding still important: oxford p.115; "state how each output was obtained" labelled author's advice
- Gorlin: CO ÷ [44.3 × systolic ejection period × HR × √mean gradient]; MVA 37.7 and diastolic filling period: oxford p.116; needs CO, mean gradient and systolic ejection time: oxford p.129
- Brilakis clinical entry criteria (SBP <90 mmHg >30 min or inotropes/vasopressors; end-organ hypoperfusion; lactate >2 mmol/L): brilakis p.429 (Fig 24.7); serial lactate and invasive haemodynamics, regular RA/PAPi, CPO >0.6 W while limiting escalating vasopressors/inotropes: brilakis p.428 (24.2.2)
- Oxford clinical features of severe shock (BP <90, HR >120, lactate >4 mmol/L, cool extremities, obtunded, two or more inotropes/vasoactive drugs): oxford p.287
- Thermodilution keypoint: bolus of liquid into proximal port, thermistor in distal end: oxford p.115
- 1.36 factor attributed in text to the Academy's Fick lesson (hd-flow-fick; ref hanna-pcm)

### Resistance and hypotension
- Catheter obstruction by air, thrombus or contrast (contrast damping especially 4 and 5 F); aspirate; if aspiration fails remove without injection: brilakis p.485 (28.1.1.1)
- Damping common with ostial lesions and 8 F guides; side-hole guides mask damping, never for LM engagement except ostial LM CTO: brilakis p.485
- Hypovolaemia most commonly bleeding; access-site haematoma; dented bladder sign of retroperitoneal haematoma; stroke volume causes (LV/RV dysfunction mostly ischaemia, acute regurgitation, tamponade); arrhythmias; vasodilatation from vasovagal, anaphylaxis, nitroglycerin especially after PDE5 inhibitors, verapamil for radial spasm; prevention of false and true hypotension: brilakis p.487 (28.1.1.2.1–28.1.2)

### Shunts
- Errors due to streaming and inaccurate catheter positioning (Oxford wording); 98% substituted only if PV sampling not possible: oxford p.116; duplicate samples and 98%-overstates-with-abnormal-lungs labelled author's reasoning
- Resistance = pressure gradient across a bed ÷ flow through that bed: oxford p.115; use of Qp for PVR in a shunt labelled as following from this definition
- Anomalous pulmonary venous drainage: an aim of the ASD study, method not given: oxford p.141; oximetry clues in Academy hd-shunts (haemodynamics.ts)
- VSD check: RAO 30° shows anterior, apical, inferior walls: oxford p.119

### LV gram
- Ectopics and MR: oxford p.135; rise time prevents whip: oxford p.119 (check 1 explanation, case s3 feedback)
- LV gram can clarify infarct area or suggest myocarditis: brilakis p.145 (7.2.11); TTE shows VSD, ventricular rupture, papillary muscle rupture: brilakis p.379 (20.7)
- Takotsubo types and CAD: ref ghadri-takotsubo-consensus-2018 (four major types apical/midventricular/basal/focal; CAD 10–29%, not an exclusion; WMA usually beyond the involved artery's territory)
- Sellers-based Academy grading with timing (MR 4+ dense LA within first beat with pulmonary vein reflux; AR 4+ dense LV within first beat): Academy dx-lv-gram and dx-aortography (diagnostic.ts), ref sellers-1964
- Pearl: three LVEDP numbers (oxford p.119, p.110, p.117) and the separate un-numbered "avoid when high" advice (oxford p.110)

### Aortography
- TAVI row: CT angiography supplies part of the access assessment non-invasively: oxford p.131
- Graft markers in about 10%; multipurpose for right grafts, AL1 or LCB for left; JR4 often both; bilateral subclavian angiography and IMA clips; aortogram 60 mL at 20 mL/s LAO; keep searching until all territories have a flow source: brilakis p.338 (18.5)
- Anomalous origin: cusp angiography/aortography, RAO instead of LAO, different catheter (e.g. AL), coronary CT angiography: brilakis p.117 (5.7.3.1); flush occlusion, collateral confirmation: brilakis p.117 (5.7.3.2); Oxford catheter tips (no hard rules; aortography shows ostium/course; JR4 or AL/AR for right sinus; JL of unusual size or AL for left sinus; multipurpose dissection risk): oxford p.182

### Quiz and cases (round 1)
- q5: distractors 24.5 (×10 omitted), 0.25 (×100), 9.8 (CO × BSA), 4.9 (output): arithmetic on oxford p.115 formula
- q7: PA as mixed venous (96 − 85) ÷ 13 ≈ 0.85; equal weighting 2.0: arithmetic on oxford p.116
- q8: oxford p.119, p.110
- Case LV study s2 (LVEDP 26, no orthopnoea, echo failed): reduce above 25 oxford p.119; avoid when high oxford p.110; pulmonary oedema relative contraindication oxford p.117
- Case LV study s2-oedema: management sequence and at-risk groups: oxford p.302
- Case LV study s3-stain: contrast in pericardial space, immediate pericardiocentesis with high suspicion, drain until bleeding stops, protamine/platelets/clotting factors: oxford p.305; tamponade mimics vasovagal but usually tachycardic, heart rate slows first in vasovagal: oxford p.308; outcome variant now tamponade with drainage
- Case LV study s5 option 2 now not acceptable: oxford p.120 (pullback when pressure recorded; remove over guide wire)
- Case ASD s4: option 2 RA as mixed venous with PA and aorta → s4-ra ((97 − 84) ÷ 13 = 1.0); option 3 PA as mixed venous → new s4-pa ((97 − 85) ÷ 13 ≈ 0.9): arithmetic on oxford p.116
- Case ASD s2-vt feedback: VT management oxford p.309

### Rejected or limited in round 1 (for the checkers)
- ESC ACHD 2020 additions (ASD closure not recommended in Eisenmenger/exercise desaturation; fenestrated closure at PVR ≥5 WU; coarctation ≥50% narrowing): guideline full text not in PMC (PMID 32860028, no PMCID), so not added.
- "CT is the main TAVI planning tool": no verifiable source in hand (2021 ESC/EACTS full text not in PMC); limited to Oxford's own note on CT angiography (oxford p.131).
- hanna-pcm kept in the output lesson and q5: it supports the 1.36 mL O₂/g factor, which neither manual states.

### Round 2 fixes
- RHC Table 4.1 paragraph: wedge mean above PA diastolic usually means poor wedge or faulty recording, unless a giant v wave raises the mean; reposition and check. Source: Academy haemodynamics.ts right heart pearl (giant v wave exception) and waveform table (large v waves inflate the mean); oxford p.114 (mean PCWP similar to PA diastolic); large v waves in MR: oxford Ch.5 mitral regurgitation section (chapter pp.128–149).
- Case LV study learningPoints[1]: reduce injection above 25 mmHg (oxford p.119); avoid LV gram when LVEDP high and pulmonary oedema likely above 30 (oxford p.110); omit when echo can answer, patient breathless or in oedema, or LVEDP near 30. Now consistent with s2 best answer (reduced run at 26 mmHg).
- Tip diag-aortogram-setup: consequence of leaflet interference now labelled (author's reasoning), matching the lesson step and check; instruction itself oxford p.126.
