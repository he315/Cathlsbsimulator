# Evidence: pm-lab-drugs (Sedation, vasodilators, pressors, antiarrhythmics and contrast)

Module file: `src/content/manual/pci-manual/04-lab-drugs.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

New references (checked on PubMed: authors, title, journal, year, volume, issue, pages):
- kubica-impression-2016: PMID 26491112, Eur Heart J 2016;37(3):245–52 (online 2015). Figures used: 70 patients analysed (35 per group); morphine 5 mg IV vs placebo before ticagrelor 180 mg; ticagrelor AUC(0–12) down 36%, active metabolite down 37%; Tmax 4 vs 2 h; more high platelet reactivity with morphine. All from the PubMed abstract.
- debacker-soap2-2010: PMID 20200382, N Engl J Med 2010;362(9):779–89. Figures used: 1679 patients; 28-day death 52.5% vs 48.5% (P = 0.10, not significant); arrhythmic events 24.1% vs 12.4%; dopamine associated with higher 28-day death in the 280 cardiogenic shock patients. All from the PubMed abstract. (Brilakis p.428 cites this trial for "dopamine associated with more arrhythmias".)

Further new references added in fixer round 1 (each checked on PubMed: authors, title, journal, year, volume, issue, pages):
- hoffman-flumazenil-1993: PMID 8306565, Clin Pharm 1993;12(9):641–56. Used from the abstract: resedation may occur within 1–2 hours after flumazenil, so repeated doses or an infusion may be needed; adverse reactions include CNS effects, resedation, cardiovascular effects and seizures. The long-term-benzodiazepine/seizure-history contraindication proposed by a checker is NOT in the abstract and was not added.
- esc-va-2022: PMID 36017572, Eur Heart J 2022;43(40):3997–4126 (abstract not available on PubMed). Recommendation details checked against Könemann & Eckardt, Herzschrittmacherther Elektrophysiol 2022;33:450–7 (PMID 36385401, full text PMC9691474, German): new class I for electrical cardioversion also in haemodynamically tolerated VT, described as first-line; procainamide (PROCAMIO) newly preferred, class IIa, for regular broad-complex tachycardia with known or suspected structural heart disease; amiodarone only a "restrained" recommendation; verapamil for left fascicular VT and beta-blockers for outflow tract VT (idiopathic). The qualifier "provided that the anaesthetic/sedation risk is low" is the guideline's wording as reported by web summaries of the guideline (academic.oup.com page and ACC key points); the full guideline table could not be opened in this session.
- cheskes-dose-vf-2022: PMID 36342151, N Engl J Med 2022;387(21):1947–56. From the abstract: out-of-hospital refractory VF, cluster-randomised, 405 patients; survival to discharge DSED 30.4% and vector change 21.7% vs standard 13.3%.
- mcgwin-ranitidine-2020: PMID 33374592, Cancers (Basel) 2020;13(1):24 (PMC7793066). From the full text: NDMA, a probable human carcinogen, found in ranitidine; "in April 2020, the FDA announced that ranitidine was to be withdrawn from the market".
- bednarczuk-eta-contrast-thyroid-2021: PMID 34395299, Eur Thyroid J 2021;10(4):269–84. From the abstract only (full text not retrievable): ICM-induced thyroid dysfunction mostly mild and transient; individualised approach based on age, symptoms, pre-existing thyroid disease, comorbidities and iodine intake. The checker's "urgent angiography should not be withheld" is NOT in the abstract and was not stated as the guideline's; the module says only "agree the plan with endocrinology".
- esc-hf-2021 (already in src/content/refs.ts; guideline PDF text read in this session from the scratchpad copy eschf.txt): Table 22 dobutamine 2–20 µg/kg/min; section 11.3.5 inotropes reserved for LV systolic dysfunction, low output and low SBP (e.g. <90 mmHg) with poor organ perfusion, start at low doses and uptitrate with close monitoring; section 11.3.6 SOAP II significance only in the subgroup of 280 with cardiogenic shock, <10% had MI, limiting generalisability; epinephrine vs norepinephrine RCT in MI cardiogenic shock stopped early for more refractory shock with epinephrine; recommendation "a vasopressor, preferably norepinephrine, may be considered" ("may be considered" = class IIb); IV vasodilators may be considered when SBP >110 mmHg (class IIb).

Existing registry references used: rcuk-anaphylaxis-2021 (the guideline PDF, May 2021, was downloaded from resus.org.uk and read in this session; quotes and page anchors below), umakoshi-contrast-switch-2022 and vandermolen-contrast-hsr-2024 (added by pm-planning; used only for the statements their notes record: about 61% fewer recurrent reactions with a different agent, RR 0.39, six observational studies; switching agent, ideally after allergological assessment, increasingly advocated in place of premedication).

## Notes for checkers

- The Brilakis text extract drops en dashes. Every range below was confirmed on the PDF page images: p.41 (midazolam 0.5–1 mg, 15–80 min; fentanyl 25–100 mcg, 30–60 min; naloxone 0.1–0.2 mg, 2- to 3-minute intervals); p.42 (IC/intragraft NTG 100–300 mcg; IV 10 mcg/min, +10 every 5 min, SBP >100, max 200 mcg/min; SL 0.4 mg; PDE-5 24 h / tadalafil 48 h; half-life 1.5–7.5 min); p.43 (nicardipine 100–300; nitroprusside 100–300; verapamil radial 2–3 mg, IC 1 mg over 2 min); p.44 (adenosine RCA 50–100, LM 100–200, graft 100–200, IV 140 mcg/kg/min; aminophylline 250–300 mg IV over 10 min; AF 2.7%); p.46 (delayed reactions usually 6–12 h); p.47 (prednisone 50 mg at 13, 7, 1 h; methylprednisolone 32 mg at 12 and 2 h; diphenhydramine 25–50 mg IV; hydrocortisone 100–400 mg IV over 1 min; epinephrine 0.3 mg of 1:10,000 IV, total 1 mg; Jod–Basedow 2–12 weeks); p.56 (phenylephrine 50–100 mcg then 0.5–1.4 mcg/kg/min; norepinephrine 0.1–0.5; vasopressin 0.03 U/min, +0.005 every 10–15 min, max 0.1; dopamine 10–20 pressor, 5–10 inotrope; epinephrine arrest 1 mg every 3–5 min, shock 2–10 mcg/min, anaphylaxis 0.3–0.5 mL of 1 mg/mL SC or IM every 1–2 h; dobutamine 10–40 mcg/kg/min; MAP <60 mmHg); p.57–58 (amiodarone 150 mg over 10 min, 300 mg push, 1 mg/min for 6 h; atropine 0.5 mg to total 3 mg).
- Oxford Fig. 4.4 (p.99) is an image; its values were read from a 200 dpi render of the page. Generic names only are used in the module.
- Errors or inconsistencies found in the books (taught carefully, not repeated as fact):
  - Brilakis 3.6 (p.56) gives adrenaline for anaphylaxis as 0.3–0.5 mL of 1 mg/mL SC or IM "every 1–2 hours"; 3.3 (p.47) gives 0.3 mg of 1:10,000 IV, repeat to 1 mg. RCUK 2021 (p.29) repeats IM 0.5 mg after 5 minutes and says the SC route is not recommended (less effective). The module teaches the RCUK regimen as current UK practice and shows both Brilakis regimens attributed (lesson table and quiz q11).
  - Brilakis's dobutamine range 10–40 mcg/kg/min (p.56) is printed as given and now set beside the 2021 ESC heart failure guideline's 2–20 µg/kg/min (Table 22) with its advice to start low and uptitrate; the module adds "check the dose against the BNF or your local protocol" (no BNF figure is quoted).
  - Brilakis on nicardipine duration: 3.2.2 (p.43) "shorter duration of action"; 18.3 (p.337) and 18.9.2 (p.349) "prolonged duration of action". The module states the inconsistency.
  - Brilakis 28.1.3.2 (p.488) cross-refers adenosine to "Section 3.2.4" (verapamil); adenosine is 3.2.5. Not taught; noted only.
  - Oxford ch 10 Contrast reaction (p.307) says reactions are less common "due to the use of non-iodinated hypo-osmolar agents"; coronary contrast agents are iodinated (Oxford p.99 itself). The module says "modern low-osmolar non-ionic agents".
  - Oxford is internally inconsistent on mechanism: p.100 (ch 4) anaphylactoid reactions "occur via an unknown mechanism"; p.307 (ch 10) "usually type 1 IgE-mediated". Brilakis p.46: IgE-mediated or direct mast cell degranulation. The module gives all three.
  - Adenosine IV dose: Brilakis 3.2.5 (p.44) 140 mcg/kg/min; 12.2.6 (p.223) 140–180 mcg/kg/min. LM IC: 3.2.5 100–200 mcg; 12.2.6 200 mcg, up to 600 mcg in some studies. Both taught.
- Disagreements between the books taught explicitly: sedative doses (Brilakis midazolam 0.5–1 mg / fentanyl 25–100 mcg, p.41; Oxford midazolam 0.5–2.5 mg, diazepam 2–10 mg, fentanyl 25–50 mcg aliquots, p.44); IC nitrate (Brilakis 100–300 mcg p.42, 50–200 by SBP p.124; Oxford 100–250 mcg p.173); radial nitrate (Brilakis 100–200 mcg p.92/p.106; Oxford GTN 200–400 mcg p.71); no-reflow doses (Brilakis p.43–44 vs Oxford p.268); contrast ceiling (Oxford 5–7 mL/kg p.101; Brilakis 3.7 × GFR p.39); anaphylaxis treatment (Brilakis p.47, p.56; Oxford p.307); atropine (Brilakis 0.5 mg to 3 mg p.58; Oxford 0.5–1 mg, 1 mg for AV conduction p.312, 0.5–1.0 mg vasovagal p.308).
- Statements that are the module's own reasoning (not claimed from a source): the sedation pearl (name reversal doses at the brief); "small steps restore breathing without abruptly abolishing analgesia" (derived from Brilakis's "until the desired degree of reversal", p.41); "support the airway and give oxygen while you decide which agent to reverse"; "plan important discussions for when the patient is fully awake" (derived from Oxford p.340); nitrates pearl (read the pressure aloud); nitrate check explanation "Brilakis's other spasm treatment, an intracoronary calcium channel blocker (25.2), is the alternative, given cautiously because it also lowers the pressure" (labelled in the text as our inference; Brilakis p.444 lists IC CCBs for spasm; p.124 and p.487 list verapamil as a cause of vasodilator hypotension); "plan important discussions for when the patient is fully awake" (labelled "our advice"); AF heparin paragraph "check the ACT before adding a further bolus" (labelled "our advice"; Oxford p.310–311 dose is for AF during catheterisation; ACT targets Brilakis 3.4, p.47–48); flumazenil step "rather than sending the patient straight back to an unmonitored bed"; "treat duration as unsettled and judge by the response" (nicardipine); microvascular pearl ("drug works best when already in the microcirculation as debris arrives", derived from both books' emphasis on prevention, Oxford p.267, Brilakis p.337, p.361); pressors pearl ("empty, failing or dilated"); "drugs hold the pressure while you treat the cause" (paraphrase of Brilakis 28.1.3, p.488); antiarrhythmics pearls ("say the unit aloud"; "ask what the catheter just did"); contrast pearl; reactions pearl (keep IM-strength adrenaline and a syringe and needle on the trolley; RCUK p.29–30 prefers ampoule, syringe and needle and a 21G/23G needle); the synthetic case details (patients, numbers, sequences).
- Video notes say only what the registry titles say.

## Lesson pm-lab-drugs-sedation

- Goal of sedation: improve patient comfort: brilakis p.41 (3.1.1)
- Discomfort can cause movement, tachycardia and tachypnoea, which may worsen ischaemia: brilakis p.37 (2.1)
- Sedation given in nearly all patients, titrated to acceptable comfort without compromising respiratory or haemodynamic status: brilakis p.39 (2.8)
- Midazolam 0.5–1 mg IV, repeatable, duration 15–80 min; fentanyl 25–100 mcg IV, repeatable, 30–60 min; morphine and other opioids can be used: brilakis p.41 (3.1.2)
- Short-acting benzodiazepines relieve anxiety and associated hypertension; diazepam (Diazemuls) 2–10 mg IV or midazolam 0.5–2.5 mg IV as patient arrives on table; care in elderly, advanced airways disease, significant comorbidity, obese; additional sedation with small aliquots of short-acting opioid e.g. fentanyl 25–50 mcg: oxford p.44 (ch 1 Pre-medication, within Catheter laboratory preparation)
- Venous cannula for sedation, fluids, emergency drugs, preferably left arm: oxford p.41 (ch 1 Patient preparation)
- Good continuous ECG; pulse oximetry SaO2 >96% on room air; supplemental O2 to high-risk patients or those receiving high doses of sedation: oxford p.43 (ch 1 Catheter laboratory preparation)
- Cath lab RN usually administers sedation and monitors ECG, pressure, saturation: brilakis p.40 (2.12 box)
- Nurse-led sedation components (cannulation; pharmacokinetics of drugs and reversal agents; when appropriate; judge fluid/inotrope/BP support with knowledge of EF, structure, coronary patency; monitor HR, BP, oximetry after drugs; autonomy to titrate requested doses freeing the operator): oxford p.56 (ch 2 The nurse)
- Hypopnoea from excessive sedation; prevention: avoid excessive sedation, monitor saturation throughout: brilakis p.41 (3.1.3.1)
- Desaturation may be hypoventilation from heavy sedation, early pulmonary oedema, artefact or other causes; ABG gives fuller information: brilakis p.38 (2.4)
- Reversal: stop sedation; flumazenil 0.2 mg IV over 15 s, if no response after 45 s 0.2 mg over 1 min, repeat at 1-min intervals to total 1 mg; naloxone 0.1–0.2 mg IV, repeat every 2–3 min to desired reversal; intubation may be needed for severe respiratory depression: brilakis p.41
- Midazolam acts up to 80 min (check explanation "waiting is not a plan"): brilakis p.41
- Opioids delay gastric emptying and P2Y12 absorption → thrombotic complications; avoid opioids in STEMI if not necessary; treat with IV antiplatelet agents (cangrelor or GPI): brilakis p.42 (3.1.3.2)
- IMPRESSION figures: ref kubica-impression-2016
- Anxiety/inadequate sedation causes radial spasm; adequate moderate sedation prevents; more sedation, rarely propofol or GA with entrapment: brilakis p.508–509 (29.2.3); also p.106 (5.3.3.4)
- Oxford: spasm prevented through mild sedation (opiates and benzodiazepines) prior to radial access: oxford p.73 (ch 3)
- Adequate sedation and hydration may minimise vasovagal reaction: brilakis p.488 (28.1.2 item 8)
- Cardioversion in lab under IV benzodiazepine sedation or GA: oxford p.281 (ch 9)
- Avoid strenuous activity, alcohol and signing legal documents for 48 h if sedation given: oxford p.57 (ch 2 The nurse, patient self-care)
- Telling results while still sedated with midazolam is unhelpful: oxford p.340 (ch 11 Communication)
- Check 1 reasoning (elderly, obese, airways disease, SaO2 below 96%): oxford p.43–44; sedation not contraindicated and anxiety causes spasm: brilakis p.508
- Tip diag-sedation-titrate: brilakis p.41; oxford p.43–44
- Tip pci-opioid-delays-p2y12: brilakis p.42; ref kubica-impression-2016
- Tip diag-radial-spasm-release is pm-engaging's tip (shown, not authored here)

## Lesson pm-lab-drugs-nitrates

- Classification: large-vessel (nitroglycerin) vs small-vessel (nicardipine, nitroprusside, adenosine): brilakis p.42 (3.2)
- NTG goals: dilate coronaries (IC routinely before angiography to prevent spasm and allow accurate interpretation), treat hypertension, pulmonary oedema: brilakis p.42 (3.2.1.1)
- Goal of 6.3: prevent/correct spasm that could be read as fixed lesions and optimise balloon and stent sizing: brilakis p.124 (6.3.1)
- Some operators give nitrates routinely to all; SL spray or infusion before procedure; maximal vasodilatation images: oxford p.173
- GTN before and after IVUS to reduce spasm: oxford p.231 (ch 8 Intravascular ultrasound)
- IC/intragraft 100–300 mcg; IV 10 mcg/min up by 10 every 5 min, SBP >100, max 200 mcg/min; SL 0.4 mg: brilakis p.42 (3.2.1.2)
- SBP ladder: >120 → 200 mcg; 100–120 → 100 mcg; <100 → 50 mcg or none; via manifold or Y-connector with introducer needle ("nitro on a stick"); SL 0.4 mg alternative; wait 1–2 min (up to 2 min for vasodilation): brilakis p.124 (6.3.2)
- Spasm treatment IC NTG usual 100–300 mcg, may repeat; IC calcium channel blockers: brilakis p.444 (25.2.5)
- GTN or ISDN IC boluses 100–250 mcg; maximal vasodilatation 1–2 min; GTN spray SL 1–2 puffs; nitrates can be given if already on oral preparation; on IV infusion response may be blunted; help differentiate spasm and ostial lesions; nitroprusside rarely used except no-reflow or intractable spasm with CCB such as verapamil: oxford p.173
- Pulmonary oedema: high-flow O2, sit up, IV loop diuretic (furosemide 80–100 mg), if SBP >100 IV nitrate e.g. ISDN 2–10 mg/h, CPAP, consider IABP: oxford p.302 (ch 10 Pulmonary oedema)
- Radial: verapamil 2–3 mg, nicardipine 100–200 mcg, or NTG 100–200 mcg after sheath: brilakis p.92 (4.3.9); verapamil 2.5 mg and/or NTG 100–200 mcg after sheath: brilakis p.106 (5.3.3.4); Oxford cocktail heparin 2500 IU, verapamil 2.5 mg, GTN 200–400 mcg, regimens vary: oxford p.71 (ch 3)
- Catheter-tip spasm after ostial engagement; waveform ventricularises then falls; recovers only after withdrawal; commonest in non-dominant RCA and vessels of calibre similar to catheter (shorter, lower-weight patients): oxford p.173
- Spasm during PCI with stiff wires straightening anatomy; cocaine/amphetamine refractory spasm requiring IC verapamil; may mimic severe stenosis, trial of IC nitrate; catheter withdrawal may be required; image documenting relief: oxford p.174
- IC nitrates after careful re-engagement discriminate spasm and ostial disease: oxford p.173
- OCT/IVUS when spasm does not recede after NTG: brilakis p.124 (6.3.2)
- Hypotension causes: venous dilation (↓preload), arterial dilation (↓afterload); PDE-5 inhibitors; HOCM worsens LVOT obstruction: brilakis p.42 (3.2.1.3.1)
- Prevention: avoid high and multiple doses; not in hypotension or RV infarction; PDE-5 windows avanafil/sildenafil/vardenafil 24 h, tadalafil 48 h; not in HOCM: brilakis p.42; hypovolaemia, RV infarction, PDE-5, low pressure: brilakis p.124–125 (6.3.3.1)
- Oxford uses sublingual GTN to accentuate the HOCM gradient: oxford p.145 (ch 5 Cardiomyopathy)
- Avoid excessive NTG and other vasodilators (prevention of hypotension): brilakis p.488 (28.1.2 item 9)
- Treatment: no more NTG (half-life 1.5–7.5 min); normal saline; waiting; vasopressors (norepinephrine or phenylephrine) for extreme or persistent hypotension; assess other causes such as bleeding: brilakis p.42
- Saline often given prophylactically after NTG; phenylephrine for severe hypotension; causes include vasovagal reaction to nitrates and transducer issues (pseudohypotension): brilakis p.124–125 (6.3.3.1)
- Headache (intracranial dilation), dizziness, flushing; reflex tachycardia: brilakis p.43
- GTN and other nitrates not shown useful in no-reflow: oxford p.268
- Tip diag-nitrate-dose-by-pressure: brilakis p.124; oxford p.173
- Tip pci-wire-spasm-nitrate: brilakis p.444 (deep engagement, aggressive manipulation, instrumentation as causes; NTG 100–300 repeat; IC CCB), p.124 (IVUS/OCT); oxford p.174 (stiff wires). Brilakis lists IC NTG and IC calcium channel blockers in parallel with no order, so the tip title and text give no sequence (round 2)
- Tips diag-ostial-spasm-withdraw-nitrate (pm-engaging) and diag-planning-pde5-nitrate (pm-planning) shown, not authored here

## Lesson pm-lab-drugs-microvascular

- Nicardipine: CCB; IC small-artery vasodilation; preferred agent for preventing/treating no-reflow e.g. atherectomy and SVG PCI; less hypotensive than nitroprusside and verapamil; "shorter duration of action": brilakis p.43 (3.2.2); IC 100–300 mcg: p.43
- Nicardipine intragraft 100–300 mcg, before and after SVG PCI, esp. slow/no-reflow; "prolonged duration of action and less hypotensive effect": brilakis p.337 (18.3), p.349 (18.9.2)
- Nicardipine radial 100–200 mcg: brilakis p.92
- Nitroprusside IC 100–300 mcg; hypotension treated as 3.2.1.3.1: brilakis p.43 (3.2.3)
- Verapamil radial 2–3 mg; IC 1 mg over 2 min; prevent radial spasm and no-reflow; hypotension as 3.2.1.3.1: brilakis p.43 (3.2.4)
- Adenosine: no-reflow and physiology; RCA 50–100 mcg; LM 100–200 mcg, several thousand mcg slowly in no-reflow; intragraft 100–200 mcg; IV 140 mcg/kg/min central or large peripheral vein; regadenoson costly, papaverine not available in US and may cause VF: brilakis p.44 (3.2.5)
- Oxford no-reflow: verapamil 100–500 mcg slow IC, repeatable, beware heart block; adenosine 30–50 mcg IC, repeatable, avoid in asthmatics/dipyridamole; nitroprusside 50–100 mcg, repeatable: oxford p.268
- Prevention via guide; established no-reflow via OTW balloon or multifunctional probing catheter as close to distal bed as possible: oxford p.268
- Vasodilator before atherectomy in most patients unless hypotensive; nicardipine most common; cocktail of verapamil, NTG and heparin: brilakis p.361 (19.9.5.4)
- Distal delivery via microcatheter or dual-lumen or aspiration catheter; IC epinephrine in refractory no-reflow: brilakis p.364 (19.9.5.7.1)
- IC epinephrine 0.05 mg used in air embolism: brilakis p.111 (5.5.3.2); IC epinephrine in air-embolism cardiac arrest: brilakis p.444 (25.2.3.3)
- Avoid repeated contrast injections in no-reflow (worsen ischaemia), flow often improves with time and vasodilators; IABP if hypotension persists: oxford p.267
- No-reflow difficult to treat once established; prevention key: oxford p.267
- Flush guide after IC adenosine: brilakis p.223 (12.2.6.2 step 2)
- Heart block: AV node, most likely RCA; prevention avoid high doses in RCA, slow administration, aminophylline 250–300 mg IV over 10 min during RCA atherectomy (A1 antagonist); treatment watchful waiting: brilakis p.44 (3.2.5.3.1)
- Do not give >100 mcg IC adenosine in RCA (or dominant LCx for VF/AF): brilakis p.224–225 (12.2.6.4); cough (self-CPR); transient CPR and temporary pacing if AV block without escape persists: brilakis p.224
- AF most common adenosine arrhythmia (2.7% after IV); well tolerated except accessory pathways; caused by PVCs sometimes during AV block; treatment DC cardioversion or amiodarone, beta-blockers or CCB: brilakis p.44–45 (3.2.5.3.2)
- VF/torsades: R-on-T after pause, may occur without pause; cough; defibrillation: brilakis p.45 (3.2.5.3.3)
- Fig 3.2: 40 mcg IC adenosine into RCA → complete heart block then AF; cardioversion at end of procedure: brilakis p.45
- Adenosine flushing/chest constriction; contraindicated in asthma or dipyridamole: oxford p.234 (ch 8 Pressure wire)
- Aminophylline 250–300 mg IV over 10 min or 20–40 mg IC; adenosine released from injured red cells; alternatively atropine 0.5–1.0 mg IV before atherectomy: brilakis p.355 (19.3); pacemaker, aminophylline or brief test runs: brilakis p.360 (19.9.4)
- Oxford: check HR and ECG before rotablation; pretreat with atropine; some operators place a temporary wire: oxford p.270–271 (ch 8 Rotational atherectomy)
- Physiology: adenosine RCA 50–100 mcg; LM 200 mcg, up to 600 mcg in studies; IV 140–180 mcg/kg/min; regadenoson; papaverine: brilakis p.223 (12.2.6.2); caffeine as a cause of failed hyperaemia: brilakis p.224 (12.2.6.3.2)
- IV infusion gives more stable hyperaemia than IC, needs 60–90 s, slightly higher side-effect rate: oxford p.235
- Check explanation: radial verapamil dose (2–3 mg) vs IC doses (1 mg; 100–500 mcg): brilakis p.43, oxford p.268
- Tip pci-no-reflow-distal-vasodilator: brilakis p.364, p.43–44; oxford p.267–268
- Tip pci-svg-intragraft-vasodilator: brilakis p.337, p.349, p.43
- Tip pci-adenosine-rca-dose: brilakis p.44, p.223–225
- Tip pci-adenosine-block-cough-wait: brilakis p.44–45, p.224

## Lesson pm-lab-drugs-pressors

- Drug classes and goals (vasopressor: increase BP; inotrope: increase contractility): brilakis p.55–56 (3.6.1.1, 3.6.2.1)
- Three causes of true hypotension: hypovolaemia, cardiac failure, peripheral vasodilation (Fig. 28.1); bleeding most common hypovolaemia cause; cardiac failure from LV/RV dysfunction (ischaemia), valvular (acute regurgitation; Amplatz or deep EBU opening aortic cusp), tamponade, tachy/bradyarrhythmias; vasodilation from vasovagal, anaphylaxis, medications (NTG esp. with PDE-5, verapamil): brilakis p.485–487 (28.1.1)
- Treatment of cause; vasopressors and inotropes, MCS while treating cause: brilakis p.488 (28.1.3)
- Hypotension common; fasting dehydration and hypotensive drugs; often slow IV fluids all that is required; reversible causes list: oxford p.304 (ch 10 Hypotension)
- Phenylephrine purely vasopressor, choice in HCM (inotropy worsens intracavitary obstruction); norepinephrine mainly vasopressor, less inotropic; vasopressin pure vasopressor; dopamine >10 mcg/kg/min mainly vasopressor; MAP <60 mmHg; central line recommended if possible: brilakis p.56 (3.6.1.2)
- Doses: phenylephrine 50–100 mcg bolus then 0.5–1.4 mcg/kg/min; norepinephrine 0.1–0.5 mcg/kg/min, preferred in cardiogenic and septic shock; vasopressin 0.03 U/min, +0.005 U/min every 10–15 min to max 0.1 U/min; dopamine 10–20 mcg/kg/min (lower doses inotropic and chronotropic): brilakis p.56
- Inotropes: epinephrine similar pressor and inotropic effect; dopamine 5–10 mcg/kg/min predominantly inotropic; dobutamine pure inotrope 10–40 mcg/kg/min; epinephrine arrest 1 mg IV every 3–5 min, cardiogenic shock 2–10 mcg/min: brilakis p.56 (3.6.2.2)
- Phenylephrine for severe hypotension after NTG: brilakis p.125 (6.3.3.1)
- LM PCI: early vasopressors (norepinephrine) if hypotension; defibrillation pads: brilakis p.329 (17.2)
- Hypertension: excessive dose or correction of initial cause; avoid high doses, use MCS; catecholamine half-life short, BP falls within minutes: brilakis p.56 (3.6.1.3.1)
- Arrhythmias: excessive adrenergic stimulation, ischaemia; lowest doses, MCS; lidocaine and amiodarone; VA-ECMO for refractory: brilakis p.56–57 (3.6.2.3.1)
- Shock: pressors/inotropes raise myocardial oxygen consumption, arrhythmias, may hamper recovery; dopamine more arrhythmias than norepinephrine (SOAP II, ref [11]); alpha agonists avoided (no inotropic support, increase afterload); early MCS reduces need: brilakis p.428–429 (24.2.3); CPO >0.6 W while limiting escalating doses: brilakis p.428 (24.2.2)
- SOAP II figures: ref debacker-soap2-2010
- "Noradrenaline, not dopamine, first-line vasopressor in cardiogenic shock": brilakis p.56 (norepinephrine preferred for cardiogenic shock) with ref debacker-soap2-2010
- Inotropes supportive if revascularisation not an option (Oxford MI): oxford p.301 — listed in sources; not quoted as a number
- Check (HCM): phenylephrine rationale brilakis p.56; verapamil hypotension treated as for NTG (saline, stop): brilakis p.43, p.42
- Tip pci-hypotension-match-pressor: brilakis p.485–488, p.56, p.428–429
- Tip pci-left-main-early-noradrenaline: brilakis p.329
- Tip mcs-pressor-escalation-limit: brilakis p.428–429, p.56; ref debacker-soap2-2010
- Tip pci-mon-false-hypotension is pm-monitoring's tip (shown, not authored here)

## Lesson pm-lab-drugs-antiarrhythmics

- Arrhythmia 0.4% of diagnostic catheterisation: oxford p.299 (ch 10 Risks of complications)
- Transient benign arrhythmias frequent (ectopics, sinus bradycardia): oxford p.309
- Lab arrhythmias usually ischaemic, treating ischaemia improves them; often post-reperfusion: brilakis p.488 (28.1.3.2)
- Amiodarone goals (ventricular and atrial tachyarrhythmias; refractory VF); 150 mg over 10 min (may repeat) then 1 mg/min 6 h; VF 300 mg IV push then 1 mg/min 6 h: brilakis p.57 (3.7.1)
- Hypotension (allergic reaction with angioedema/urticaria; vasodilation and myocardial depression partly from polysorbate 80 or benzyl alcohol; caution low BP; stop; treat anaphylaxis; else vasopressors and inotropes): brilakis p.57
- Bradycardia/AV block: AV node; not in 2nd/3rd-degree block without pacemaker; stop; temporary pacing: brilakis p.57
- Torsades/VF: prolonged QT; pre-excitation with AF; avoid; defibrillation; stop: brilakis p.58
- VF causes (manipulation near stenosed ostium; plugging e.g. intermediate; conus injection; dissection, air); immediate defibrillation per ALS; resistant → amiodarone 300 mg IV and different defibrillator; correct K+, Mg2+: oxford p.309
- Contrast not clearing because catheter occludes ostium → VF/VT; disengage: brilakis p.275 (15.1.6)
- VT: similar precipitants; RVOT during RHC and LV catheterisation; poorly tolerated → synchronised DC 200–360 J (or biphasic equivalent) under sedation/GA; tolerated → beta-blocker (metoprolol 5 mg IV bolus) or amiodarone 150 mg IV over 10 min through large vein, both repeatable; monitor hypotension, inform anaesthetist, prepare DC: oxford p.309
- Lidocaine 50 mg IV over 2 min, repeated every 5 min to max 200 mg if BP stable; overdrive pacing; persisting VT → synchronised DC: oxford p.310
- Overdrive pacing: 80–90% termination of sustained monomorphic VT; 15–20 bpm faster; high output 5–10 V; stop after 5–10 s capture; risk of acceleration to pulseless VT/VF; background pacing 90–110 bpm: oxford p.310
- AF: atrial irritation during RHC, ischaemia, pericarditis; most self-terminate; severe compromise criteria (rate >150, hypotension/hypoperfusion, reduced consciousness, pulmonary oedema, ischaemia) → high-flow O2, heparin 5000–10,000 IU IV, immediate synchronised DC (360 J monophasic or 200 J biphasic) under sedation/GA: oxford p.310–311
- Mild–moderate (<150, breathless, mild hypotension): heparin then weight-adjusted LMWH if persists; flecainide 2 mg/kg (max 150 mg) IV over 30 min if good haemodynamics, no pulmonary oedema, no known structural heart disease; electrical cardioversion 2–3 h later if fails; amiodarone 300 mg IV over 1 h, efficacy poor: oxford p.311
- SVT: catheter manipulation in RA/RV in predisposed patient; vagal manoeuvres; adenosine 6–18 mg IV with saline flush; verapamil 5–10 mg slow IV if reinitiates, avoid impaired LV or significant hypotension; flecainide, esmolol, sotalol after expert consultation; DC 200–360 J; first episodes no prophylaxis: oxford p.311–312
- Transient bradycardia/junctional rhythm common during injection; recover spontaneously or with atropine 0.5–1 mg IV; bradycardia may be vasovagal and precede collapse: oxford p.312
- Contrast-related transient bradycardia resolves within seconds; transient ST changes and QRS widening common; ventricular arrhythmias uncommon: oxford p.101
- Higher-degree block: known conduction delay, mechanical damage to (usually right) bundle, ischaemia (typically RCA); recovery within minutes unless ongoing ischaemia; first-degree and Mobitz I no urgent intervention; Mobitz II and CHB may need urgent temporary pacing; atropine 1 mg may improve AV conduction; isoprenaline bolus 25–50, infusion 5–10 mcg/min rarely improves conduction but increases sinus automaticity: oxford p.312
- Vasovagal: HR slows before BP drops; lie down, raise legs; atropine 0.5–1.0 mg IV; rapid saline; improvement within minutes or reconsider (MI, tamponade, retroperitoneal bleed); tamponade usually with tachycardia: oxford p.308
- Atropine at sheath removal for vasovagal; vasovagal: saline, atropine for bradycardia: brilakis p.196–197 (11.1.6)
- Atropine 0.5 mg IV push to total 3 mg; rebound tachycardia (resolution of cause, high dose; lowest dose; resolves); dry mouth; mydriasis/blurred vision; flushing: brilakis p.58 (3.7.2)
- Defibrillation pads in LM cases (cross-reference): brilakis p.329
- Tip diag-vf-shock-then-amiodarone: oxford p.309; brilakis p.57, p.275
- Tip diag-bradycardia-atropine-or-pace: oxford p.312; brilakis p.58
- Tip pci-mon-vf-roles is pm-monitoring's tip (shown, not authored here)

## Lesson pm-lab-drugs-contrast-media

- Goals: visualise arteries; clear blood for OCT: brilakis p.46 (3.3.1)
- Lowest possible volume; iso-osmolar associated with lower contrast nephropathy risk: brilakis p.46 (3.3.2)
- CI-AKI highest risk advanced CKD; discussed in 28.3: brilakis p.46 (3.3.3.1)
- Why agents work (atomic weight; iodine soluble, low toxicity; renal excretion): oxford p.99
- Osmolality (higher than blood opacifies better, draws water; heat/discomfort, kidneys and blood–brain barrier; closer to blood better tolerated); viscosity (ease/speed; viscous agents hard through small catheters, sluggish filling); ionic monomer high osmolality; ionic dimer reduced; non-ionic substantially lower; non-ionic better side-effect profile at greater cost: oxford p.100
- Fig. 4.4 values (diatrizoate 306/5.0/1530; ioxaglate 320/7.5/580; iopamidol 300/4.7/616; iohexol 300/6.3/640; ioversol 300/5.5/645; iopromide 300/4.6/610; iobitridol 300/6.0/695; iotrolan 300/8.1/320; iodixanol 320/11.4/290 iso): oxford p.99 (figure)
- Contrast damping in 4 and 5 Fr catheters: brilakis p.485 (28.1.1.1)
- Dose-dependent: heat, flushing, localised discomfort (arm in IMA angiography), vasodilatation, hypotension, myocardial depression; nephrotoxic esp. diabetes and reduced CrCl: oxford p.100
- Don't exceed 5–7 mL/kg; haemodynamic responses (vasodilatation, myocardial depression, rising LVEDP) more pronounced with high osmolality; non-ionic for severe LV impairment, severe CAD, severe valve disease; transient bradycardia, ST changes, QRS widening, ventricular arrhythmias uncommon: oxford p.101
- Pulmonary oedema with large contrast volumes in LV impairment, raised LVEDP, severe AS/MS, dialysis: oxford p.302
- Thyroid: Jod–Basedow (2–12 weeks), hypothyroidism; avoid contrast in hyper/hypothyroidism; endocrinology referral: brilakis p.47 (3.3.3.3)
- Ceiling 3.7 × GFR, lower in CKD or single kidney, count recent contrast (e.g. CT): brilakis p.39 (2.6)
- Non-ionic low- or iso-osmolar agents for renal impairment: oxford p.42 (ch 1 Patient preparation)
- Check arithmetic: 3.7 × 30 = 111 mL; 5–7 × 70 = 350–490 mL; q12: 3.7 × 25 ≈ 93 mL; 5–7 × 60 = 300–420 mL (module calculations)
- Tip diag-contrast-ceiling-two-rules: oxford p.101; brilakis p.39; oxford p.42

## Lesson pm-lab-drugs-contrast-reactions

- Contrast reaction 0.4%; less common with modern agents; rapid deterioration with profound hypotension and airway obstruction; usually type 1 IgE: oxford p.307 (see errors note on "non-iodinated")
- Immediate or delayed (usually 6–12 h); mild (rash) to life-threatening (angioedema, anaphylactic shock); IgE or direct mast cell degranulation: brilakis p.46 (3.3.3.2)
- Anaphylactoid reactions via unknown mechanism (equipment chapter): oxford p.100
- Iso-osmolar vs ionic low-osmolar ioxaglate (prevention); iso-osmolar higher risk of delayed skin reactions: brilakis p.46
- Highest risk: prior anaphylaxis, contrast reaction, atopy, asthma: oxford p.307
- Protamine reaction (hypotension, pulmonary vasoconstriction 5–10 min): brilakis p.48 (3.4.2.1.3); amiodarone allergic hypotension: brilakis p.57; contrast reaction causing spasm and hypotension: oxford p.174
- Symptoms usually within 15 min of first injection; pruritus, flushing, cyanosis, rash, wheezing, angio-oedema; tachycardia and hypotension: oxford p.307
- Allergic signs: skin rash, itching, hives, swelling of lips/tongue/throat, hypotension: brilakis p.37 (2.1)
- Vasovagal features and differential (venepuncture, cannulation, arterial puncture, compression; HR slows before BP falls; pale; tamponade with tachycardia): oxford p.308
- Brilakis treatment: diphenhydramine 25–50 mg IV; cimetidine 300 mg IV or ranitidine 50 mg IV over 15 min; hydrocortisone 100–400 mg IV over 1 min; epinephrine 0.3 mg of 1:10,000 IV, repeat to total 1 mg; IV normal saline: brilakis p.47
- Epinephrine for anaphylaxis 0.3–0.5 mL of 1 mg/mL SC or IM every 1–2 h; give immediately without waiting for steroids: brilakis p.56 (3.6.2.2)
- Peripheral vasodilation from anaphylaxis treated with epinephrine and fluid: brilakis p.488 (28.1.3.2)
- Oxford: patent airway, 100% O2; IV hydrocortisone 200 mg and chlorphenamine 10 mg; epinephrine 0.5 mg IM (0.5 mL of 1:1000); nebulised salbutamol 5 mg; IV 0.9% saline; serum tryptase; severe: epinephrine 100 mcg IV (1 mL of 1:10,000); pulseless → PEA with compressions and ventilation: oxford p.307
- Premedication lowers anaphylactic shock risk: brilakis p.488 (28.1.2 item 6); premedication regimens: brilakis p.47, oxford p.307 (taught in pm-planning)
- RCUK 2021 (ref rcuk-anaphylaxis-2021; guideline PDF): adrenaline first-line, IM early in anterolateral thigh, repeat after 5 minutes if ABC problems persist (summary p.7; dose table p.29: adult 500 micrograms IM, 0.5 mL of 1 mg/mL); SC and inhaled routes not recommended, less effective (p.29); IV adrenaline only by experienced specialists in appropriate settings, risks of dilution errors/bolus dosing (tachyarrhythmias, severe hypertension, MI, stroke) (p.29–30); refractory anaphylaxis = no improvement in respiratory or cardiovascular symptoms despite 2 appropriate IM doses → low-dose IV infusion with expert help, continue IM every 5 min until infusion started; IV boluses not recommended unless cardiac arrest, though those experienced with vasopressors may use them while infusion set up; reduce infusion for tachycardia, arrhythmia, hypertension (section 6, p.35–37); IV fluid bolus 500–1000 mL in adults for hypotension/shock or poor response to first dose (5.3); supine or semi-recumbent, avoid sudden posture change (summary of changes, p.8); antihistamines third-line, not for ABC problems, non-sedating oral preferred for skin after stabilisation (p.8, 5.4); corticosteroids no longer advised routinely (p.8, 5.5); tryptase: initial asap without delaying treatment, second 1–2 h (no later than 4 h), third at least 24 h after resolution or in convalescence (7.2); all patients referred to specialist allergy clinic (summary p.7); ampoule, syringe and needle preferred in healthcare settings, 21G or 23G needle (p.29–30)
- Switching agent: ref umakoshi-contrast-switch-2022 (about 61% fewer recurrent reactions, observational studies), ref vandermolen-contrast-hsr-2024 (switching increasingly advocated in place of premedication, preferably after allergological assessment)
- Tip diag-reaction-or-vagal: oxford p.307, p.308
- Tip diag-anaphylaxis-im-adrenaline: ref rcuk-anaphylaxis-2021; oxford p.307; brilakis p.56
- Tip pci-anaphylaxis-im-adrenaline: ref rcuk-anaphylaxis-2021; brilakis p.47, p.57, p.48; oxford p.174

## Quiz

- q1 flumazenil/naloxone: brilakis p.41
- q2 IMPRESSION: ref kubica-impression-2016; brilakis p.42
- q3 PDE-5 windows, HCM, RV infarction; 200 mcg at SBP >120: brilakis p.42, p.124
- q4 aminophylline, atropine, pacing, test runs: brilakis p.355, p.360; verapamil 5–10 mg is Oxford's SVT dose p.311
- q5 distal delivery; nitrates not useful; repeated contrast worsens ischaemia; IABP for persisting hypotension: oxford p.267–268; brilakis p.364
- q6 adenosine VF after pause; ≤100 mcg RCA or dominant LCx; slow; cough/defibrillate: brilakis p.44–45, p.224–225
- q7 phenylephrine pure vasopressor, HCM; norepinephrine preferred in cardiogenic shock; central line if possible: brilakis p.56
- q8 SOAP II: ref debacker-soap2-2010; brilakis p.428
- q9 amiodarone not with prolonged QT: brilakis p.58; lidocaine regimen and VT options: oxford p.309–310; verapamil/adenosine for SVT: oxford p.311
- q10 AF severe compromise management; flecainide conditions; amiodarone poor efficacy: oxford p.310–311
- q11 RCUK regimen: ref rcuk-anaphylaxis-2021; Brilakis regimens p.47, p.56
- q12 non-ionic low/iso-osmolar in renal impairment: oxford p.42; iso-osmolar lower nephropathy risk: brilakis p.46; 3.7 × GFR, lower in CKD, recent contrast: brilakis p.39; 5–7 mL/kg: oxford p.101; ionic monomer high osmolality: oxford p.100

## Cases

Case pm-lab-drugs-case-svg (synthetic): sedation cautions oxford p.43–44, brilakis p.41; reversal brilakis p.41; desaturation differential brilakis p.38; tadalafil 48 h brilakis p.42, p.124; nitrate hypotension sequence brilakis p.42, p.124–125; intragraft nicardipine before and after brilakis p.337, p.349; GPI not routine in SVG PCI brilakis p.337, oxford p.265; distal delivery oxford p.268, brilakis p.364; repeated contrast worsens ischaemia and IABP oxford p.267; pressors raise oxygen demand brilakis p.428; intragraft adenosine 100–200 mcg and LM "several thousand mcg slowly" brilakis p.44; no more than 100 mcg IC adenosine in the RCA (the graft feeds the RCA and the microcatheter delivers into its bed) brilakis p.224–225; Oxford no-reflow adenosine 30–50 mcg oxford p.268; embolic protection in SVG PCI when feasible brilakis p.341 (18.8.2.1), landing zone p.341–342, slow/no flow with filter: aspirate through guide then remove filter p.343, filter retrieval restoring flow and containing debris Fig. 25.7 p.443; distal protection mandatory oxford p.265, distal protection as no-reflow prevention oxford p.267; vasodilator pretreatment "may reduce" no-reflow oxford p.267; nicardipine often before and after SVG PCI brilakis p.337, p.349; nitrate hypotension causes list brilakis p.124; c2 heart rate 104/min added (synthetic); IV adenosine 6–18 mg for SVT oxford p.311; heart block cough and wait brilakis p.44, p.224; adenosine AF well tolerated, cardioversion or drugs brilakis p.44–45; AF often self-terminates, immediate DC only with severe compromise, flecainide only without structural heart disease oxford p.310–311. Outcome: the base outcome no longer mentions filter retrieval; the acceptable s3 option (nicardipine without a protection device) sets flag no-epd, whose outcome variant says a filter could have been landed and both manuals would have used one (brilakis p.341–342, oxford p.265).

Case pm-lab-drugs-case-anaphylaxis (synthetic): presentation and risk oxford p.307; vasovagal features oxford p.308; atropine treats vagal bradycardia oxford p.308, p.312; IM adrenaline, fluids, posture, IV adrenaline restrictions, refractory definition and infusion, reduce infusion for side effects, antihistamines/steroids not first-line, tryptase timing, allergy referral: ref rcuk-anaphylaxis-2021 (pages above); adrenaline immediately without waiting for steroids brilakis p.56; salbutamol 5 mg oxford p.307; catecholamine short half-life brilakis p.56; lowest inotrope dose for arrhythmia brilakis p.56–57; amiodarone 300 mg is the VF dose, can cause hypotension and allergic reaction brilakis p.57; recording the agent and switching: refs umakoshi-contrast-switch-2022, vandermolen-contrast-hsr-2024.

## Existing Academy lessons read (not edited)

- foundations fnd-pharm-lab-drugs: intra-arterial verapamil "commonly 2.5–5 mg" — the manuals give 2–3 mg (Brilakis p.43, p.92) and 2.5 mg (Brilakis p.106; Oxford p.71); the 5 mg upper figure is not in either manual (not necessarily wrong; for the checkers to judge).
- complications comp-noreflow, acute-mcs mcs-shock-management, foundations fnd-ecg-arrhythmias, fnd-safety-contrast, fnd-safety-allergy, fnd-case-contrast-reaction, diagnostic dx-ind-consent: no errors found against the manuals or RCUK 2021 on the points this module covers.


## Fixer round 1: claims changed or added (with sources)

### pm-lab-drugs-sedation
- Diazepam "Not mentioned" by Brilakis: brilakis p.41 (3.1.2 lists midazolam, fentanyl, other opioids such as morphine)
- Nurse-led sedation includes "an understanding of the procedure and when sedation is appropriate": oxford p.56
- Monitor level of consciousness and breathing; is breathing assistance (BiPAP or intubation) needed: brilakis p.37 (2.1 item 3)
- Flumazenil: manual gives no cautions (brilakis p.41); resedation within 1–2 h, repeat doses or infusion, seizures and cardiovascular effects: ref hoffman-flumazenil-1993; midazolam up to 80 min brilakis p.41
- After the case: avoid strenuous activity and alcohol for 48 h, and signing legal documents if sedation given: oxford p.57; results to a patient still sedated with midazolam "unhelpful": oxford p.340 (ch 11, PDF p.~361 region; line in extract ch11 "still sedated with midazolam is unhelpful"); "plan discussions when fully awake" labelled as our advice

### pm-lab-drugs-nitrates
- Pulmonary oedema: Brilakis lists the goal without a route (p.42); IV ISDN 2–10 mg/h if SBP >100: oxford p.302; ESC HF 2021 IV vasodilators may be considered when SBP >110 mmHg, class IIb: ref esc-hf-2021 (section 11.3.4 and recommendation table)
- Radial heparin 50 units/kg up to 5000 units for diagnostic catheterisation, 100 units/kg may be more effective; vasodilator before sheath removal may reduce radial artery occlusion: brilakis p.92 (4.3.9)
- Spasm: IC NTG 100–300 mcg (repeat) and IC calcium channel blockers listed in parallel: brilakis p.444 (25.2.5)
- Cautions table: RV infarction listed as do-not-give and as a cause: brilakis p.42, p.124; PDE-5 coadministration as a cause: brilakis p.42; "neither manual gives the mechanism" (checked: no RV preload rationale in either)
- "A drop in systemic blood pressure is common": brilakis p.124 (6.3.2)
- Other causes list (bleeding, vasovagal reaction to nitrates, transducer/connection pseudohypotension, hypovolaemia when NPO without IV fluids, RV infarction, verapamil for radial access): brilakis p.124 (6.3.3.1); "if hypotension persists, assess for other causes such as bleeding": brilakis p.42
- Tadalafil check: CCB inference labelled (see Notes for checkers)

### pm-lab-drugs-microvascular
- No-reflow contrast: avoid repeated injections (worsen ischaemia), flow often improves with time and vasodilators, IABP: oxford p.267 (reworded)
- SVG protection step: brilakis p.341 (18.8.2.1 use if technically feasible; landing zone), p.443 (25.2.3.2 prevention list), p.343 (slow/no flow: aspirate through guide then filter removal), p.443 Fig. 25.7 (flow restored after filter retrieval, filter contained tissue); oxford p.265 (randomised trials, distal protection mandatory), p.267
- Adenosine AF: cardioversion if no spontaneous conversion: brilakis p.225 (12.2.6.4.3); drugs alternative brilakis p.45
- Adenosine can induce chest pain, bronchospasm, bradycardia and AV block: oxford p.234 (iFR section); flushing/chest constriction p.234
- IV adenosine FFR measured 1–3 min after starting, SBP drop ~10 mmHg and HR rise 5–10 bpm as surrogate of hyperaemia; papaverine 8 mg RCA, 12 mg LM, usually avoided due to ventricular arrhythmias: brilakis p.223 (12.2.6.2)

### pm-lab-drugs-pressors
- Vasodilation row: vasopressors (norepinephrine or phenylephrine) for extreme/persistent nitrate or vasodilator hypotension: brilakis p.42, p.43, p.125; epinephrine and fluid for anaphylactic shock: brilakis p.488 (28.1.3.2)
- RHC pattern (hypovolaemia low filling/low CO; cardiac failure high filling, low if RV failure/low CO; vasodilation low filling/high CO), RHC useful when cause not apparent: brilakis p.485–486 (28.1.1.2, Fig. 28.1, described not reproduced)
- Acute MR/AR may benefit from vasodilators but often need urgent/emergent surgery; IABP for acute MR; tamponade pericardiocentesis; myocardial rupture emergency surgery; cardiac arrest CPR ideally automated, then VA-ECMO if no prompt recovery: brilakis p.488 (28.1.3.1, 28.1.3.2). The product named in the book is replaced by the generic "automated chest compression device".
- IV vasopressors as a cause of radial spasm: brilakis p.508 (29.2.3)
- Dobutamine: Brilakis 10–40 mcg/kg/min p.56; ESC 2021 Table 22 2–20 µg/kg/min; inotropes reserved for LV systolic dysfunction, low output, low SBP with poor perfusion; start low, uptitrate: ref esc-hf-2021 (11.3.5). Brilakis gives no indication beyond "pure inotropic effect" (p.56).
- Adrenaline in MI cardiogenic shock: RCT stopped early, more refractory shock with epinephrine; ESC prefers norepinephrine: ref esc-hf-2021 (11.3.6)
- SOAP II: subgroup analysis (P = 0.03) ref debacker-soap2-2010; Brilakis cites SOAP II for arrhythmias p.428 (24.2.3), prefers norepinephrine in cardiogenic shock p.56 (no citation there); ESC 2021: significance only in subgroup of 280, <10% MI, limits generalisability; "a vasopressor, preferably norepinephrine, may be considered" (IIb): ref esc-hf-2021

### pm-lab-drugs-antiarrhythmics
- 0.4% is for serious complications of diagnostic catheterisation and coronary angiography: oxford p.299
- Pre-excited AF check: amiodarone contraindicated brilakis p.58; heparin 5000–10,000 IU oxford p.310–311; flecainide conditions oxford p.311; neither manual contraindicates heparin or flecainide in pre-excitation (checked by search of both extracts)
- DOSE VF: ref cheskes-dose-vf-2022 (out-of-hospital, paramedic-treated refractory VF; the lesson step, keypoint 3 and tip diag-vf-shock-then-amiodarone all say "out-of-hospital" so the result is not read as tested in the cath lab)
- Overdrive pacing capture: change in QRS morphology and rise in monitored rate to the pacing rate: oxford p.310
- ESC 2022 VT: ref esc-va-2022 (details as above); "Oxford has an anaesthetist informed": oxford p.309
- Flecainide definition of no known structural heart disease (no previous ischaemic or valve disease and a normal TTE): oxford p.311; "rarely suitable in a patient with coronary disease" is a direct consequence of that definition
- SVT: accessory pathway as predisposition, narrow complex usually, broad with BBB or rate-related aberrancy, vagal manoeuvres named (carotid sinus massage, Valsalva, ice): oxford p.311 (Oxford also lists ocular pressure; it is deliberately left out because a round-2 checker reported that the 2019 ESC SVT guideline, PMID 31504425, describes eyeball pressure as potentially harmful and abandoned; that sentence could not be retrieved for verification, as the guideline is not in PMC or Europe PMC and the publisher page truncates, so neither the manoeuvre nor the caveat is taught and the guideline is not cited); maintenance drugs or ablation referral depend on frequency, duration, severity: oxford p.312
- Adenosine dose paragraph: IC up to several thousand mcg slowly in LM no-reflow: brilakis p.44; up to 600 mcg LM in studies: brilakis p.223
- Heparin for AF: dose context oxford p.310–311; ACT-guided anticoagulation in PCI brilakis 3.4 (p.47–48); advice labelled as ours
- Vasovagal: 2–3%; emotion, dehydration, mild starvation, anticipated pain; young anxious males; ward venesection/cannulation, arterial puncture, compression; pale, syncopal, apnoeic, may appear dead; tamponade with tachycardia; immediate echo if uncertain: oxford p.308
- Sheath-removal check: isoprenaline rarely improves conduction but increases sinus automaticity; Mobitz II/CHB may need urgent temporary pacing: oxford p.312

### pm-lab-drugs-contrast-media
- Osmolality and viscosity points reworded (oxford p.100)
- Thyroid: hypersecretion in patients with underlying thyroid disease (Jod–Basedow 2–12 weeks), hypothyroidism, avoid contrast, endocrinology: brilakis p.47; ETA 2021: ref bednarczuk-eta-contrast-thyroid-2021 (abstract)

### pm-lab-drugs-contrast-reactions
- Heart rate: compensatory tachycardia characteristic; bradycardia usually a late feature often preceding cardiac arrest: rcuk-anaphylaxis-2021 (section 3.2 Airway/Breathing/Circulation problems, guideline p.20–21: compensatory tachycardia characteristic; bradycardia usually a late feature, often preceding cardiac arrest); oxford p.307 tachycardia and hypotension can occur
- Brilakis 3.6 adrenaline SC/IM every 1–2 hours: brilakis p.56; RCUK repeat after 5 minutes: rcuk p.7, p.29
- H2 blockers: Brilakis cimetidine 300 mg IV or ranitidine 50 mg IV over 15 min p.47; RCUK finds no evidence to support routine use of an H2-receptor antihistamine such as ranitidine (antihistamine section, guideline p.31–32); ranitidine withdrawal: ref mcgwin-ranitidine-2020
- Fluids: up to 3–5 L in adults for severe anaphylactic shock; non-glucose crystalloid (Hartmann's or Plasma-Lyte) rather than 0.9% sodium chloride for large volumes to reduce hyperchloraemia; fluids tend to be underused (rcuk 5.3 and 6.7.3, p.37–38)
- Second-line vasopressors: insufficient evidence for any particular one; expert advice, local protocols, sufficient expertise and monitoring (rcuk 6.7.3, p.38)
- Arrest: start compressions early in the peri-arrest patient; peri-operative anaphylaxis: compressions if non-invasive SBP remains <50 mmHg; prolonged CPR including extracorporeal CPR should be considered (rcuk p.38)
- Switching agent caveats: vandermolen-contrast-hsr-2024 abstract ("Measures to prevent recurrent HSR following nonvascular administration are similar to those recommended ... after intravascular CM administration"); umakoshi-contrast-switch-2022 six observational studies
- Tip diag-anaphylaxis-im-adrenaline: Brilakis 3.6 removed from its sources (it supports only "give immediately"); RCUK primary

### Tips (trigger changes)
- pci-opioid-delays-p2y12: now phase plan (advice belongs to planning a STEMI case, not to in-procedure ST elevation); text begins "In STEMI"
- pci-adenosine-block-cough-wait: text now begins "If the block follows an adenosine bolus"
- pci-wire-spasm-nitrate: trigger kept on ostial-spasm (the only spasm event in LAB_EVENTS); slow-flow rejected because nitrates do not help no-reflow (oxford p.268) and would conflict with pci-no-reflow-distal-vasodilator; a coronary-spasm event is requested in the lab-request file
- pci-svg-intragraft-vasodilator: now includes embolic protection (brilakis p.341, oxford p.265)

### Rejected or not applied
- Complications track cross-reference (intracoronary adrenaline "often chosen" when hypotensive in no-reflow): neither manual says this; Brilakis gives IC epinephrine only for refractory no-reflow (p.364, 19.9.5.7.1) and air-embolism arrest (p.444). Not added to this module; returned as an Academy fix.
- SOAP II citation flagged by overlap.py: a bibliographic citation (names and title) checked on PubMed; left unchanged.
