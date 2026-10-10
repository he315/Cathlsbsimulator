# Evidence: pm-monitoring (Monitoring and running the room)

Module file: `src/content/manual/pci-manual/02-monitoring.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

New references (each checked on PubMed for authors, title, journal, year, volume, issue and pages; two read in full text on PMC):
- kovacs-zero-reference-2013: Eur Respir J 2013;42(6):1586–1594, PMID 23794468 (abstract).
- michard-damping-2024: J Clin Monit Comput 2024;38(4):749–752, PMID 38573369, PMC11297833 (full text).
- kleinman-fast-flush-1996: J Clin Monit 1996;12(2):149–154, PMID 8823635 (abstract).
- hargestam-closed-loop-2013: BMJ Open 2013;3(10):e003525, PMID 24148213, PMC3808778 (full text).
- grogan-crm-2004: J Am Coll Surg 2004;199(6):843–848, PMID 15555963 (abstract).
- haynes-checklist-2009: N Engl J Med 2009;360(5):491–499, PMID 19144931 (abstract).
- hofmann-deto2x-2017: N Engl J Med 2017;377(13):1240–1249, PMID 28844200 (abstract): patients with suspected MI and SpO2 ≥90% randomised to oxygen or air; 1-year all-cause death 5.0% vs 5.1%, HR 0.97.
- soar-erc-als-2021: Resuscitation 2021;161:115–151, PMID 33773825 (metadata). Content read in the authorised German translation (Notf Rett Med 2021;24:406–446, PMID 34121923, PMC8185697, full text): up to three successive shocks may be considered only for initial VF/pVT in a witnessed arrest with a defibrillator immediately available, e.g. during cardiac catheterisation or in a monitored area; three initial stacked shocks count as one initial shock for timing the first adrenaline.
- siassakos-teamwork-2011: BJOG 2011;118(5):596–607, PMID 21291509 (abstract): in simulated eclampsia, more efficient teams declared the emergency earlier and managed the critical task with closed-loop communication (task clearly and loudly delegated, accepted, executed, completion acknowledged), measured by time to magnesium.
- Existing references now also used: esc-acs-2023 (oxygen only for SpO2 <90% in ACS; the same threshold is taught by the existing Academy lessons foundations.ts and acute-mcs.ts; the guideline full text was not retrievable through PubMed) and esc-ph-2022 (zero reference at the mid-thoracic level, halfway between the anterior sternum and the table; already taught in haemodynamics.ts; full text not retrievable through PubMed; Kovacs is a co-author and his data show the mid-thoracic level matched the left atrium in 97.4%).

Notes for checkers
- Confirmed on the Brilakis PDF page images (p.37–40), because the extract drops en dashes and symbols: air kerma 5–7 Gy and >15 Gy sentinel (p.39), contrast ≥3.7 × GFR (p.39), ACT targets on a Hemochron device 300–350 s, >350 s retrograde CTO, 200–250 s with GP IIb/IIIa inhibitor or cangrelor (p.39, now taught in the watch lesson), 35 mmHg pulsus paradoxus in Fig 2.2 caption (p.38), Fig 2.1 twelve items (p.37).
- Disagreement taught: transducer level within Oxford: V4 electrode height checked with a ruler (p.60) versus zero at mid-chest (p.97). The lesson now says the two are different heights, explains (as the module's own hydrostatic reasoning, labelled) that V4 lies on the anterior chest so a transducer level with it sits above the atria and under-reads, notes that Kovacs did not test V4 height, and recommends the mid-thoracic level (Kovacs: level with LA in 97.4%; ESC/ERS 2022 via esc-ph-2022). Round 2: the halfway-between-sternum-and-table definition is now credited to ESC/ERS 2022 and Kovacs only; Oxford p.97 says just 'mid-chest' without defining it, and the lesson, keypoint 3, tip haemo-mon-zero-level and LAD case s0 feedback now say so rather than presenting the definition as Oxford's.
- Team model differences taught as two descriptions, not a disagreement: Brilakis (p.40) technician and RN; Oxford (p.43, 53–62) physiologist and scrub/circulating nurses.
- The fast-flush test is not in either manual; the lesson says so and teaches it only from Michard 2024 (an editorial; full text) and Kleinman 1996 (a bench study: 16–20 G catheters on 91–274 cm tubing with the tip in a pressure generator; FF equalled square-wave testing without air, but with 0.05 mL of air the FF test showed lower natural frequency and greater damping, i.e. a worse response), noting that they concern arterial pressure lines rather than coronary catheters. The fast-flush lab tip no longer cites Oxford ch 4; its manual source is Brilakis 5.6 (p.112: clear air bubbles from the transducer; kinked catheter), which supports only the fault-finding part (air, kink).
- Closed-loop communication and crew resource management are not in either manual; taught only from Härgestam 2013 (full text), Siassakos 2011 (abstract) and Grogan 2004 (abstract), labelled as such. The point that directed orders are more likely to be executed than orders 'in the air', and that many orders in the air overload resuscitation teams, is in Härgestam's Discussion as a citation of other work (Siassakos; resuscitation-team studies), not a Härgestam finding; the lesson, check, quiz q10 and tip now attribute it that way.
- Omitted on purpose: Oxford p.61 says the conus branch supplies the AV node (doubtful; already omitted by pm-engaging). Oxford p.60 heads its list of tachyarrhythmias "Minor tachyarrhythmias (AF/flutter, VT, VF)"; the word "minor" was not repeated.
- Module's own reasoning, labelled in the text: a vasopressor given for false hypotension may cause hypertension once the fault is corrected (Brilakis p.486 says only 'correct identified issue'); V4 height under-reads (hydrostatic principle); the monitoring scan pearl (no timing from Brilakis); applying Oxford's death documentation list (p.300) to other serious complications.
- Examples marked as the module's own: the PCI time-out content (access, guide, anticoagulation, bailout kit) is labelled "this module's suggestion, built from Brilakis's planning chapter"; which steps count as critical for the sterile cockpit is left to the team because the manuals do not list them.

## Lesson pm-monitoring-watch

- Monitoring continuous from beginning to end so complications are identified and corrected promptly; parameters in Fig 2.1: brilakis p.37
- Twelve items of Fig 2.1 (patient, ECG, pressure, O2 saturation, radiation dose with X-ray system and shield position, contrast volume, access site, anticoagulation/ACT, sedation, medication, operators, environment, sterile field, equipment position within body): brilakis p.37 (figure image)
- Radiation: cumulative air kerma and DAP monitored; procedure usually stopped if air kerma exceeds 5–7 Gy; >15 Gy sentinel event; dose rate tracked; continuous operator dose monitors alert to high operator dose in real time (product name not used); shields and image receptor position continually monitored and adjusted: brilakis p.39 (2.5). Sentinel event is a US Joint Commission term requiring reporting to US regulators: brilakis p.488 (28.2.1); IR(ME)R for UK: oxford p.55, p.63
- Contrast: tracked automatically by some systems (an injector and a contrast-diversion system are named; generic in lesson); generally stopped before ≥3.7 × GFR, lower threshold in CKD or single kidney; recent contrast (e.g., CT) considered: brilakis p.39 (2.6)
- Sedation given in nearly all patients, titrated for comfort without compromising respiratory or haemodynamic status; UFH in most procedures monitored by ACT; Hemochron targets 300–350 s most PCI, >350 s retrograde CTO, 200–250 s with GP IIb/IIIa inhibitor or cangrelor; vasopressors, atropine: brilakis p.39 (2.8)
- Operators' and team's state, excessive fatigue: brilakis p.39 (2.9); environment noise and distraction: p.39 (2.10); sterile field and equipment: p.39 (2.11); equipment position: p.40 (2.12)
- Baseline ECG and heart rate, vital signs, pulse oximetry: brilakis p.33 (1.2); ECG morphology and rate at the beginning so changes are identified: brilakis p.37 (2.2)
- 12-lead ECG before catheterisation as baseline; venous cannula for sedation, IV fluids and emergency drugs, preferably left arm: oxford p.41
- Brief examination: pulse and BP, presence or absence of peripheral pulses, pulmonary congestion (raised JVP, basal crackles); recent bloods at minimum blood count, electrolytes, renal function, glucose: oxford p.41
- Good-quality continuous ECG; pulse oximetry, SaO2 >96% on room air (presented as Oxford's pre-procedure check, not a treatment threshold); supplemental O2 to high-risk or heavily sedated: oxford p.43
- Routine oxygen with SpO2 ≥90% in suspected MI did not reduce 1-year mortality: ref hofmann-deto2x-2017; oxygen in ACS only for SpO2 <90%: ref esc-acs-2023
- Pulses at access site and distally at beginning and end; bleeding/haematoma, continuous inspection and palpation help early identification (lesson no longer says a small haematoma is easier to control): brilakis p.39 (2.7)
- Introduce yourself, remember the patient's name: oxford p.43
- Patient discomfort → movement → complications; tachycardia and tachypnoea → worse ischaemia: brilakis p.37 (2.1.1)
- Chest, abdominal, groin pain; anticipated or unexpected; ischaemia, perforation, other complications: brilakis p.37 (2.1.2)
- Consciousness and breathing; BiPAP or intubation: brilakis p.37 (2.1.3) (lesson says "non-invasive ventilation" for BiPAP)
- Moves all extremities (stroke) or excessive movement hindering procedure: brilakis p.37 (2.1.4)
- Allergy signs: rash, itching, hives, swelling of lips, tongue, throat, hypotension: brilakis p.37 (2.1.5)
- Check 1: hypovolaemia most commonly from bleeding; access-site inspection; "dented bladder" sign of retroperitoneal haematoma on bladder fluoroscopy: brilakis p.487 (28.1.1.2.1). Scenario numbers illustrative.
- ECG set-up: standard electrode positions, radiolucent cables, 25 mm/s, 10 mm/mV, three leads with pressures, 12-lead on request: oxford p.60
- ECG changes of concern: new ST depression, new ST elevation: brilakis p.37; bradycardia, tachycardia, QRS widening, ventricular premature beats during wire manipulations, VF: brilakis p.38 (2.2)
- Physiologist reports most of Brilakis's changes plus others (lesson wording changed; Oxford's call-out list has no QRS widening or sinus tachycardia). Physiologist reports ST changes, SV and V ectopics (bigeminy, couplets, triplets; SV ectopics now in the table), bradyarrhythmias (1st/2nd/complete block, new BBB), tachyarrhythmias (AF/flutter, VT, VF): oxford p.60; call-outs including new BBB especially left, heart block, AF/flutter, VT, AIVR (useful in primary PCI), VF, asystole: oxford p.61
- ST elevation usually first sign of coronary embolism: brilakis p.111 (cited via pm-engaging evidence: "embolism (ST elevation is usually the first sign)"); catheter obstructing inflow → hypotension, arrhythmia, VF: brilakis p.126 (6.5.4); contrast may cause ST elevation or depression: brilakis p.126 (6.5.2)
- Contrast: transient bradycardia, transient ST changes and QRS widening commonly seen: oxford p.101
- Vasovagal: heart rate usually slows before blood pressure drops; tamponade usually with tachycardia: oxford p.308
- AF precipitated by atrial irritation during RHC, ischaemia or pericarditis: oxford p.310
- Ectopics and sinus bradycardia frequent and transient: oxford p.309
- VF causes: manipulation near stenosed ostium, plugging (intermediate vessel), conus injection, ischaemic complications: oxford p.309. VT: precipitants similar to VF plus RHC manipulation (especially RVOT) and LV catheterisation: oxford p.309. Ventricular arrhythmias uncommon but can be induced during coronary injection: oxford p.101. No causes of asystole given; asystole is a call-out: oxford p.61
- Fig 2.2: ST elevation and 35 mmHg pulsus paradoxus after distal vessel perforation (caption does not say wire; lesson now says 'distal vessel perforation'), CTO PCI, prior CABG: brilakis p.38
- Desaturation: may be hypoventilation from heavy sedation, but also early pulmonary oedema, artefact, other (no ranking; 'most often' and 'usually' removed from lesson, keypoint and STEMI case); ABG more comprehensive: brilakis p.38 (2.4)
- Over-sedation suppresses respiratory drive; monitor O2 sat; stop sedation, flumazenil for midazolam and naloxone for opioids (doses not given here; reversal not conditional on failure to improve), intubation if severe: brilakis p.41 (3.1.3.1). Oxygen for heavily sedated patients is Oxford's: oxford p.43 (sedation check answer and STEMI s1 now attribute it so)
- Nurse-led sedation monitoring with HR, BP and pulse oximetry after drug administration: oxford p.56
- Who assesses: primary and secondary operators; technician constantly monitoring ECG and pressure; RN monitors ECG, pressure, O2 sat and usually administers medications: brilakis p.40
- Oxford cardiologist intra-procedural duties (ECG, O2 sat, haemodynamics, comfort, radiation and contrast, ACT): oxford p.47; physiologist monitors and communicates: oxford p.59; circulating nurse monitors and communicates changes immediately, prepares, documents: oxford p.54; scrub nurse complements circulating nurse's monitoring: oxford p.53
- Pearl (scan of screens and patient) is labelled as the module's own suggestion; no timing is given (the 'ten seconds' figure has been removed).
- Post-procedure observations: NIBP, three-lead ECG if stented, O2 sat, respiratory rate; typically every 15 min first hour, half-hourly second hour, hourly thereafter; radial: haemostasis, wound observations every 15 min until device removed (colour, sensation, temperature, shape, size, pulse, pain); femoral: femoral, popliteal and pedal pulses, observations every 15 min until mobile; haemodynamic changes to nurse in charge; chest pain after PCI: 12-lead ECG first and alert operator: oxford p.56–57. Fuller teaching named as the after-the-procedure module (post-monitoring topic)
- Module summary changed from 'to the last dressing' to 'until the patient leaves the lab'

## Lesson pm-monitoring-pressure

- Arterial pressure monitored continuously; hypotension, pulsus paradoxus, hypertension, damping or disappearance: brilakis p.38 (2.3)
- Damping may reflect true aortic pressure or be due to deep engagement/ostial lesions, air entrainment (trapping technique), thrombus, kinking, equipment (aspiration catheter in 6 Fr guide), transducer disconnection: brilakis p.38 (2.3)
- False hypotension list: Y-connector haemostatic valve open; catheter–transducer connection open or air; damping common with ostial lesions and large guides such as 8 Fr; side-hole guides mask damping, should never be used to engage LM except ostial LM CTOs, can mask ischaemia and lead to collapse; catheter obstruction by air, thrombus or contrast (contrast especially in 4 and 5 Fr); aspirate, if fails remove without injection; bulky equipment: brilakis p.485 (28.1.1.1); algorithm figure p.486
- Prevention of false hypotension: verify connections, meticulous clearing after insertion, avoid deep engagement: brilakis p.487–488 (28.1.2)
- Damping algorithm (withdraw, aspirate, transducer, kink, remove under suction, aspirate sheath): brilakis p.112 (5.6.3.5), pointed to pm-engaging
- No injection while damped (coronary or aorto-coronary dissection, air embolism); injecting through thrombus risks coronary or systemic thromboembolism: brilakis p.38 (2.3 a, c). If aspiration fails withdraw slightly and re-aspirate; then remove WITHOUT inserting a guidewire: brilakis p.112 (5.6.3.2); remove without injecting and without advancing a wire while maintaining suction, then aspirate sheath: brilakis p.112 (5.6.3.5 steps 5–6)
- Damping may reflect the true aortic pressure: brilakis p.38 (2.3). Oxford damping causes: tip facing aortic wall, too deep in ostium, against ostial LM or RCA plaque, in conus branch; contrast not injected or only with very high caution (aortic or coronary wall dissection); the conus/AV-node statement omitted: oxford p.61. 'Damping or ventricularization of the aortic pressure waveform' is a physiologist call-out: oxford p.61
- Check 1 (open valve): brilakis p.485; correct identified issue: brilakis p.486 (Fig 28.1). "Vasopressor for a measurement fault may cause hypertension" is labelled in the lesson, pitfall, check and LAD case (c-pressor info) as the module's reasoning, not a source statement
- True hypotension three groups: hypovolaemia, cardiac failure, peripheral vasodilation; RHC useful if cause unclear: brilakis p.485 (28.1.1.2), Fig 28.1 p.486
- Hypovolaemia: bleeding, access-site haematoma, dented bladder sign: brilakis p.487; poor hydration: brilakis p.486 (Fig 28.1); fasted patient: brilakis p.124 (6.3.3.1, hypovolaemia in fasted patient)
- Hypovolaemia most commonly caused by bleeding: brilakis p.487
- Cardiac failure: LV/RV dysfunction usually ischaemic, acute valvular regurgitation, tamponade; Amplatz or deeply curved EBU (lesson: 'an EBU guide with a deep curve', the curve not the depth of engagement) pushing aortic cusp open → acute AR, corrected by repositioning; brady- and tachyarrhythmias: brilakis p.487 (28.1.1.2.2); valvular stenosis and myocardial rupture listed: brilakis p.486 (Fig 28.1)
- RHC pattern: hypovolaemia LV filling pressure low, CO low; cardiac failure high (can be low in RV failure, figure footnote), CO low; vasodilation low, CO high: brilakis p.486 (Fig 28.1)
- Prevention of true hypotension, nine items (access technique and radial, avoid excess anticoagulation; hydration; prophylactic support in high-risk; avoid prolonged occlusion; avoid perforation; contrast-allergy premedication; early arrhythmia correction; adequate sedation and hydration against vasovagal; avoid excess nitroglycerin and vasodilators): brilakis p.487–488 (28.1.2)
- Treatment: treat cause immediately and completely; may not be feasible (acute closure not recanalised); vasopressors and inotropes, MCS in some; CPR ideally automated, then VA-ECMO if no prompt recovery: brilakis p.488 (28.1.3); cause-specific treatment pointed to the hypotension and arrhythmia module
- Vasodilation: vasovagal, anaphylaxis, nitroglycerin (especially after PDE5 inhibitor), verapamil (intracoronary or intra-arterial for preventing radial spasm; lesson wording corrected): brilakis p.487 (28.1.1.2.3)
- Swan-Ganz in patients who develop hypotension and in HF or shock, to guide support decisions and detect new changes: brilakis p.38 (2.3)
- Physiologist calls significant fall from baseline, general rule systolic <90 mmHg: oxford p.61
- Pulsus paradoxus in tamponade: inspiratory fall in systemic pressure >10 mmHg; echo gives diagnosis instantly: oxford p.144
- Anxiety and associated hypertension: oxford p.44
- Check 2 (respiratory swing, CTO): brilakis p.38 Fig 2.2; tamponade with tachycardia: oxford p.308; echo: oxford p.144
- Amplatz/EBU repositioning (quiz q3): brilakis p.487 and Fig 28.2 p.487. The q3 stem now shows an undamped aortic waveform with a falling diastolic (135/70 to 118/38) so that it points to regurgitation rather than damping from deep intubation (Fig 28.2 legend notes a damped tracing); widening pulse pressure with AR is standard physiology, illustrative numbers

## Lesson pm-monitoring-transducers

- Fluid-filled catheter → manifold → transducer → electrical signal on monitor; long distance causes timing delay and some damping; tip transducer more accurate but impractical and expensive (reworded to avoid the book's phrasing): oxford p.95
- Artefacts: end-pressure (high-velocity jets), catheter impact (wall or valve), catheter whip (motion in chamber): oxford p.95
- Three functions of pressure recording: monitoring, guiding catheter manipulation, diagnosis (valve gradients, RHC for pulmonary hypertension, pressure wire): oxford p.60
- Manifold three to five ports; proximal to catheter, one to pressure via flush infusion, one to contrast, syringe distal; zero by opening distal port to air at mid-chest level; flush carefully to avoid trapped air that may embolise; assistant may set up, check before injection: oxford p.97
- Flush infusion per hospital protocol, typically heparinised saline, e.g., heparin 1000 IU in 500 mL 0.9% saline: oxford p.97
- Patient supine with one pillow; transducer at height of V4 electrode, ruler to confirm; calibrated and zeroed before the procedure, can be done during by opening manifold to air: oxford p.60
- Ensure the pressure transducer has been calibrated; manifold flushed and contrast run through without air: oxford p.43
- Kovacs: 196 consecutive RHC patients; four zero reference levels; 1/3 thoracic diameter level with RA in 98.5%; mid-thoracic level with LA in 97.4%; largest difference 8.0 (2.0–15.4) mmHg median between "5 cm below anterior thorax surface" and "10 cm above table level"; 59% vs 80% classified with PH and 7% vs 38% with elevated left heart pressures: ref kovacs-zero-reference-2013 (abstract)
- Check 1 and quiz q4: the direction (transducer below the heart reads high) is now stated as the hydrostatic principle, not credited to Kovacs; Kovacs is cited only for the size of the effect (median 8.0 mmHg; 59% vs 80% PH; 7% vs 38% raised left heart pressures)
- 'For aortic pressure a few mmHg rarely matters' deleted (unsupported)
- Levelling step: V4 height (oxford p.60) and mid-chest (oxford p.97) are different heights; V4 height above the atria is the module's hydrostatic reasoning; Kovacs did not test V4 height (abstract lists the four ZRLs tested); mid-thoracic level = halfway between anterior sternum and table: ref esc-ph-2022; LA level 97.4%: ref kovacs-zero-reference-2013. Keypoint 3, tip haemo-mon-zero-level and LAD case s0 now say mid-thoracic level and treat it as matching Oxford's undefined 'mid-chest' (oxford p.97 gives only 'mid-chest'; the halfway definition is esc-ph-2022 and Kovacs)
- Fast-flush test not in either manual (grep for "flush test", "square wave", "fast flush" in both books: no hits)
- FF test equivalent to square-wave (gold standard) in systems without air; with air, FF showed lower natural frequency and greater damping (worse dynamic response) than SW; bench (in vitro) study, catheter tip in a pressure generator; FF is the clinical test of choice: ref kleinman-fast-flush-1996 (abstract)
- Over- and underdamping frequent; overdamping underestimates systolic, underdamping overestimates; MAP relatively insensitive; recommend regular fast-flush tests; flushing with high pressure; normal: a couple of oscillations; overdamped: none; underdamped: multiple oscillations ("ringing"); overdamped waveform flat with barely visible dicrotic notch; overdamping: air bubbles, kinking, partial obstruction; underdamping: resonance filters may be needed; longer tubing → more resonance: ref michard-damping-2024 (full text)
- Michard 2024 is an editorial (the lesson now calls it one); Kleinman is a bench study of arterial catheter–tubing systems; the lesson labels both as concerning arterial pressure lines
- Transducer malfunction: clear air bubbles, turn switch on, use different transducer: brilakis p.112 (5.6.3.4); bubble damping in step 3: brilakis p.112 (5.6.3.5)
- Pressure-wire: flush and zero wire outside body: brilakis p.219 (12.2.1); failure to equalise causes incl. air in aortic pressure line; prevention incl. systemic line flushed and properly zeroed: brilakis p.220 (12.2.3.3); pressure drift from loose or malfunctioning transducer: brilakis p.221 (12.2.4.4.2); Oxford: wire flushed and zeroed, equalised at guide tip: oxford p.235
- Contrast in small catheters damps (pitfall): brilakis p.485

## Lesson pm-monitoring-position

- Monitor position of sheaths, guides, wires, balloons, stents for efficacy and safety; guide disengagement during balloon/stent delivery when operator focuses on the device → loss of guide and wire; deep engagement → dissection and acute closure, especially with contrast; wire tip not monitored, especially with collimation → small branch, distal perforation: brilakis p.40 (2.12)
- Guide sucked in with forceful balloon withdrawal or before full deflation → guide-induced dissection: brilakis p.182 (9.7.11.3.2)
- Wire tip advanced too distally → perforation; risk higher with polymer-jacketed, stiff or tapered tips: brilakis p.164 (8.10.3.1); knuckled wires can still exit the vessel: brilakis p.453 (26.4 causes)
- Wire withdrawal proximal to lesion → inability to treat acute closure if dissection: brilakis p.165 (8.10.3.2)
- Forceful balloon advancement through resistance is listed under Causes (no frequency claim; 'usual/commonest cause' removed from lesson and LAD case s3) → wire and guide position loss; always monitor guide and distal wire position, adjust effort; re-engage and rewire or readvance: brilakis p.179 (9.7.8.4.1), p.190 (10.2.8.4.1)
- Forward push increases support but can cause prolapse and disengagement; independent-hand technique: brilakis p.175 (9.7.8.3.2.1.4), p.188 (10.2.8)
- Stent won't cross: repeat balloon angioplasty or sometimes atherectomy; good lesion preparation; avoid very aggressive attempts: brilakis p.165 (8.10.3.2)
- Withdraw balloon: confirm full deflation by fluoroscopy; withdraw while monitoring guide and wire; if guide sucked in stop, reposition, traction; partially disengage guide before removing balloon; independent-hand (left pulls guide, right retracts balloon): brilakis p.182 (9.7.11)
- Remove balloon: left hand fixes wire outside Y-connector, right withdraws balloon; then switch: brilakis p.182 (9.7.12); prevention of wire loss: wipe wire with wet gauze, small movements, avoid kinking (replace after inserting another wire), fluoroscopy of wire tip if difficult, trapping, separate and wipe multiple wires: brilakis p.183
- After balloon removal: aspirate and flush guide; confirm optimal engagement (may be disengaged or deep); then contrast: brilakis p.183 (9.7.13), p.191 (10.2.13)
- Goal: avoid inadvertent withdrawal or distal advancement; tip monitored and adjusted: brilakis p.164 (8.10.1–8.10.2); continuous or at least intermittent monitoring, especially with collimation and difficult delivery/withdrawal: brilakis p.164; system with high resolution in part of screen and low resolution elsewhere (named as ControlRad; product name not used in lesson): brilakis p.165
- OTW exchange: uncontrolled advancement of hydrophilic, polymer-jacketed or stiff wire → distal perforation; balloon trapping first choice, wire extensions second, avoid hydraulic exchange: brilakis p.453 (26.4 causes); hydraulic exchange avoided with stiff or polymer-jacketed wires: brilakis p.163 (8.9.2.2); 6 Fr guide too small to trap OTW balloons (hence 7 Fr in the check stem): brilakis p.160 (8.9.2.1); polymer-jacketed wires can slip past the trapping balloon during aggressive withdrawal: brilakis p.162
- Wire advanced into coronary inadvertently or during injections without fluoroscopy → dissection, perforation, loss of guide position; markers at 90 and 100 cm on some wires; know 90 vs 100 cm guide; torquer at ~90 cm; do not remove wire, inject and redirect; side-hole guide exit: brilakis p.152 (8.5.2–8.5.3.1)
- Distal perforation hard to diagnose with collimation; tamponade may occur hours later: brilakis p.451 (26.4 opening); monitor closely; no GP IIb/IIIa or cangrelor: brilakis p.453; first step balloon proximal to perforation, then fat or coil embolisation: brilakis p.165 (8.10.3.1)
- Prevention: meticulous attention to distal wire during equipment delivery or with multiple wires, especially stiff and polymer-jacketed; trapping during exchanges; exchange stiff or polymer-jacketed wire for workhorse immediately after confirmed crossing: brilakis p.454 (26.4 Prevention); also p.160 (8.8 prevention)
- Treatment: STEP 1 balloon proximal, pericardiocentesis if hypotension, notify cardiac surgery; STEP 2 if sealed, observation and heparin reversal after equipment removal may be enough, but definitive treatment (embolisation or covered stent) preferred in most cases to avoid late reopening and late tamponade; STEP 3 embolisation most common (fat or coils); covered stent across the branch ostium if branch too small or angulated to wire; embolisation steps: second wire into the perforated branch, then microcatheter, with transient balloon deflations: brilakis p.456 (26.4 Treatment, 26.4.1; Fig 26.10 p.455–456). Brilakis does not teach pulling the wire back first; the position check and LAD case c-blush no longer say so
- Acute closure stress → inadvertent wire removal; guide manipulation; continuous attention to guide; calm and true-lumen wire key: brilakis p.435 (25.1)
- Check 1 and quiz q6: brilakis p.165, p.179, p.190
- Check 2 (OTW balloon through 7 Fr guide, polymer wire, pushed and pulled before trapping, blush) and quiz q7: brilakis p.160, p.162, p.164–165, p.451, p.453–456

## Lesson pm-monitoring-checklist

- WHO checklist in all cath labs, aim preventing never events: oxford p.54
- UK local safety standards for invasive procedures: ref natssips2-2023 (existing reference)
- WHO study: 19-item checklist designed to improve team communication; 8 hospitals; deaths 1.5% → 0.8%, inpatient complications 11.0% → 7.0%; non-cardiac surgery: ref haynes-checklist-2009
- Brief: all members present; work list; main details; possible challenges; post-procedure destination (day-case unit, cardiology ward, CCU, other ward); staffing or equipment issues; roles in complications or arrest: oxford p.55; cardiologist attends and leads briefing incl. intra- and post-procedural care plan and role of list coordinator: oxford p.47
- Room checks: circulating nurse verifies safety checks and tidiness: oxford p.53; physiologist checks ECG, O2 probe, balloon pump, defibrillator, temporary pacing box working and stocked; resus trolley daily checklist kept with it; in date, packaged and sterile: oxford p.59; cardiologist verifies team availability and equipment: oxford p.47
- Sign in before sedation, GA or draping; identity incl. DOB and hospital number, procedure, consent; whiteboard items (Hb, creatinine, height and weight, IV site, DAPT maintenance/loading, bleeding, respiratory, diabetes with last glucose, allergies, arterial site): oxford p.55
- Consent signature confirmed with patient; notes reviewed to ensure still indicated; pregnancy confirmation: oxford p.43; radiographer documents pregnancy: oxford p.63
- Time out: circulating nurse signs and hands to operator; operator confirms everyone aware and case can proceed, equipment checked and ready, IR(ME)R authorised per standard operating protocol: oxford p.55
- Sign out by scrub nurse: documentation; equipment check, sharps count, wire integrity; equipment left in situ; unexpected issues: oxford p.55; DAPT need and duration (stent or e.g. TAVI valve), loading dose recorded, given in lab or due on ward; recovery concerns; patient should not leave until all completed: oxford p.56
- Cardiologist verifies kit integrity, nothing left except stent: oxford p.48
- Every team member takes part: nurse p.53, physiologist p.59, radiographer p.63, cardiologist p.47
- Observe procedures when changing hospital; local resuscitation guidelines; whereabouts of resus equipment and emergency drugs; who would defibrillate in VF: oxford p.43
- PCI time-out paragraph: labelled as module's suggestion; Brilakis planning chapter content (access, engagement, pharmacology, haemodynamic support): brilakis p.29–35 (1.1–1.14)

## Lesson pm-monitoring-team

- Personnel: specialist nurse, cardiac physiologist, radiographer, cardiologist with defined roles: oxford p.43; minimum of two nurses, third in many centres incl. Oxford Heart Centre for complex/elderly patients when staffing allows: oxford p.53
- Cardiologist pre-, intra-, post-procedural duties (list in table): oxford p.47–48, including duty of candour, coroner and department manager after intra-procedural death, GP letter, debrief at end of day
- Scrub nurse duties: oxford p.53; circulating nurse duties: oxford p.53–54 (handover items, documentation, integrity, monitoring, second circulating nurse for notes, ACT and heparin, communicating when operator not screening, glucose)
- Nurse-led sedation components: oxford p.56
- Physiologist duties incl. defibrillation default and on operator instruction, rota and pressure wire, pacing (rate, threshold, amplitude), balloon pump/LV device, ACT timing: oxford p.59; 15–20 minute ACT warning: oxford p.61; report contents: oxford p.61–62; printouts of baseline, final and event traces: oxford p.61
- Radiographer duties incl. IR(ME)R 2017 and IRR 2017, ALARP, reference views, contrast stock, PPE quality, pregnancy check, staff protection warnings (screening time, dose, distance from intensifier, shielding and PPE), dose reduction (projections, saving fluoroscopy, collimation, low acquisition rate, avoid zooming, filtration), C-arm for CPR, record doses, archive, educate patients, teach, audit: oxford p.63
- Store the loop (air bubble embolisation) before pressing the pedal again: oxford p.159 ("Storing the unexpected", section "Imaging the coronaries")
- Pearl on who watches what: brilakis p.40
- Cardiologist teaching and research duties: oxford p.47. Training: 1–2 years general medicine, 3–4 years cardiology; fellowship ideally 2 years, minimum 200 supervised PCIs, primary PCI rota, imaging and physiology: oxford p.48–49; formal learning minimum 30 full days (240 hours) over 2 years: oxford p.49; assessment incl. independent trainer, simulator, final exam; centre >800 coronary interventions/year, at least two supervisors with >1000 PCIs and >5 years' experience; CARDS logbook: oxford p.50; logbook signed off monthly for trainees; EAPCI certification launched 2018, valid 5 years: oxford p.51
- Nurse training: departmental programme; supernumerary period usually 10 weeks depending on learning needs; observed in practice with assessment grid; 100% required before sign-off: oxford p.54
- Scrub nurse takes part in brief, sign in, WHO checklist, time out and sign out; maintains patient safety and sterility within the scrub field: oxford p.53
- Check 1 (VF, who shocks): oxford p.59; check 2 (dose reduction list): oxford p.63

## Lesson pm-monitoring-crisis

- Cardiologist leads management of cardiac arrest or complications; self-awareness as team leader: oxford p.47–48
- Roles in arrest assigned at brief: oxford p.47, p.55
- Acute closure stress → inadvertent wire removal; guide attention; calm and true-lumen wire key: brilakis p.435 (25.1)
- Physiologist call-out list: oxford p.61
- Call-out is the first verbalisation of an observation; CLC three steps (sender transmits, receiver check-back, sender verifies); directed commands more likely executed than commands "in the air"; multiple orders in the air → task overload; about one in seven call-outs completed as CLC (45 of 319, 14%); egalitarian style more CLC (RR 1.14), authoritarian fewer (RR 0.85); hesitation to speak up against authority; teams had watched an introductory video emphasising CLC; previous simulation training did not increase CLC: ref hargestam-closed-loop-2013 (full text)
- VF: immediate defibrillation using standard ALS: oxford p.309. Up to three successive shocks for witnessed, monitored VF/pVT with a defibrillator immediately available (e.g. cath lab), counted as one shock for adrenaline timing: ref soar-erc-als-2021 (German translation full text)
- Refractory VF: consider amiodarone 300 mg IV and a different defibrillator; correct K+ and Mg2+: oxford p.309. VT: poorly tolerated → synchronised DC shock under sedation/GA, 200–360 J or biphasic equivalent; tolerated → bolus metoprolol 5 mg IV or amiodarone 150 mg IV over 10 min via large vein, both repeatable; monitor for hypotension, inform anaesthetist, prepare for DC cardioversion: oxford p.309; lidocaine 50 mg IV over 2 min repeated every 5 min to max 200 mg if BP stable; stable monomorphic VT may respond to overdrive pacing; risk of acceleration, be ready to defibrillate: oxford p.310
- Arrhythmias in the lab usually due to ischaemia; often after reperfusion; bradycardia and AV block often drug-induced, e.g. adenosine, short-acting: brilakis p.488 (28.1.3.2)
- Physiologist shocks on operator's instruction, default unless otherwise prespecified: oxford p.59
- Radiographer moves C-arm to facilitate CPR: oxford p.63
- Circulating nurse prepares in anticipation, documents events, ideally a second circulating nurse: oxford p.54; scrub nurse sterility and checks before issuing: oxford p.53
- CPR ideally with automated system (Lucas named in source; generic in lesson), then VA-ECMO if no prompt recovery: brilakis p.488 (28.1.3.1)
- Documentation of exact timing of events, personnel present, equipment, perceived mechanism of death, and whether next of kin contacted and what was said (in the death section): oxford p.300. The lesson says Oxford gives this list for a death and that the module applies it to other crises as good practice
- Death: contact next of kin and explain events (effective communication can often avoid complaints and litigation); adverse incident form and unit manager if iatrogenic; family may view the body with privacy, religious requirements; GP notified early (bereavement counselling for the family); coroner; postmortem if unexplained; staff time to talk (reworded); cancel or postpone procedures; counselling for staff in some hospitals: oxford p.300; intra-procedural death inform department manager and coroner; duty of candour; debrief team at end of day especially after complications: oxford p.48
- Fatigue: brilakis p.39 (2.9); operator or patient fatigue after diagnostic catheterisation as a reason not to proceed ad hoc; inadequate informed consent for higher-risk anatomy: brilakis p.146 (7.3.1 list); operator and patient fatigue and excessive contrast or radiation favour staged multivessel PCI: brilakis p.146 (7.3.2)
- Noise, distraction, sterile cockpit: brilakis p.39 (2.10)
- CRM six areas (managing fatigue, creating and managing teams, recognising adverse situations/red flags, cross-checking and communication, decision making, performance feedback); 8-hour course; participants from trauma, ED, operative services, cardiac catheterisation laboratory, administration; 95% agreed CRM training would reduce errors; positive impact on 20 of 23 attitude items; attitudes, not outcomes: ref grogan-crm-2004
- Closed-loop example phrasing in the table is the module's own; it now names drug, dose and route: nicardipine 200 micrograms intracoronary, within Brilakis's intracoronary range 100–300 mcg; nicardipine preferred agent for no-reflow: brilakis p.43 (3.2.2); 'follow local protocol' stated
- Härgestam: CLC more with ≥2 structured trauma courses (RR 3.17); 5-min introductory video emphasising CLC watched before training; directed vs 'in the air' orders and task overload are cited in the Discussion from other work (Siassakos; resuscitation teams): ref hargestam-closed-loop-2013 (full text). Siassakos: earlier declaration of the emergency and closed-loop delegation of the critical task linked with faster magnesium: ref siassakos-teamwork-2011 (abstract)

## Lesson pm-monitoring-sterile

- Avoid excessive noise and distractions; sterile cockpit rule = informal name for FAA regulation that crew perform only duties required for safe operation during critical phases of flight; apply during critical parts of procedure: brilakis p.39 (2.10)
- Keeping table organised for identification and use; dried blood and contrast make gloves and equipment sticky and risk embolism if debris enters manifold; wipe gloves and equipment regularly, flush catheters with heparinised saline: brilakis p.39 (2.11)
- Protective equipment per local policy; lead protection and sterile scrub suit; drape access site aseptically, check local procedure with nursing staff; manifold flushed and contrast without bubbles; check sterile trolley: oxford p.43
- Inspect tubing, manifold, syringes for air bubbles; flush catheters and clean wires with heparinised saline before use: oxford p.303 (stroke section)
- Groin antiseptic from centre to periphery in concentric circles; dry before drape: brilakis p.64 (4.2.2.2); wrist scrubbed, dry before drape; contamination by patient's hands → repeat scrub: brilakis p.83 (4.3.2); groin contamination → repeat: brilakis p.64 (4.2.2.4)
- Scrub nurse organised preparation per manufacturer's instructions, standardised aseptic technique from hand washing through skin prep to completion, maintain field sterility and encourage others: oxford p.53
- Wire handling: wet gauze wipe, separate and wipe multiple wires, small movements, replace kinked wire after inserting intact one; high-pressure (>20 atm) inflations make balloons sticky; sticky wire: brilakis p.182–183 (9.7.12)
- Check 1 (contaminated wrist): brilakis p.83; check 2 (sticky balloon): brilakis p.182–183

## Quiz

- q1 bulky equipment (aspiration catheter in 6 Fr guide): brilakis p.38, p.485
- q2 Fig 2.2: brilakis p.38; AIVR listed as a call-out 'useful in primary PCI' (not called a reperfusion rhythm): oxford p.61
- q3 Amplatz/EBU cusp, repositioning: brilakis p.487; RHC: p.485
- q4 Kovacs (size of effect); direction from the hydrostatic principle; mean relatively insensitive to damping: Michard; catheter whip is a motion artefact (distractor C replaced): oxford p.95
- q5 underdamping, tubing length: Michard
- q6 position loss and preparation: brilakis p.165, p.175, p.179, p.190
- q7 distal perforation: brilakis p.164–165, p.451, p.453–456
- q8 time out vs sign in: oxford p.55
- q9 ACT warning 15–20 min and other call-outs: oxford p.61
- q10 Härgestam (full text): option C now 'two or more structured trauma courses linked with fewer closed loops' (the study found more, RR 3.17)
- q11 wiping and flushing: brilakis p.39
- q12 desaturation causes and ABG: brilakis p.38; sedation response: brilakis p.41; crackles as a sign of pulmonary congestion at baseline: oxford p.41

## Cases

- pm-monitoring-case-lad: baseline and zeroing at the mid-thoracic level (brilakis p.33, p.37, p.39; oxford p.43, p.60, p.97; esc-ph-2022; Kovacs); c-timeout: 3.7 × GFR with a lower threshold in CKD and recent contrast considered (brilakis p.39); 3.7 × 52 ≈ 192 mL; s2 option 3 feedback: partial withdrawal is step 1 for damping (brilakis p.112) and guide disengagement can lose guide and wire position (brilakis p.40); c-pressor info labels the hypertension as the module's reasoning; c-blush best option: proximal balloon then definitive treatment in most cases (brilakis p.456); s5 option 2 no longer acceptable, sign out is a cardiologist duty (oxford p.48); time out with radiographer (oxford p.55, p.63); contrast limit 3.7 × GFR (brilakis p.39); false hypotension (brilakis p.485); stent will not cross, guide backs out (brilakis p.165, p.179, p.190); dissection needs true-lumen wire and stent (brilakis p.435–436, 25.1–25.2.1); wire tip under collimation and distal perforation management (brilakis p.40, p.164–165, p.451, p.453–456); sign out (oxford p.48, p.55–56). Patient details, numbers and the stent size are illustrative.
- pm-monitoring-case-stemi-night: brief and roles (oxford p.47, p.55); sedation and desaturation (brilakis p.38, p.41; oxford p.43 oxygen, p.56); s2 up to three shocks (soar-erc-als-2021) and arrhythmias after reperfusion (brilakis p.488); s3 nicardipine 200 mcg intracoronary for no-reflow (brilakis p.43); s4 'Ignore it' no longer acceptable (oxford p.59, p.61); s5 prompt now has the patient still in the lab, so the sign out precedes transfer (oxford p.56); s5 option 2 (defer debrief and documentation to the morning) no longer acceptable and carries stability -3, since the sign out confirms accurate documentation and the patient does not leave until every section is complete and acted on (oxford p.55–56) and the circulating nurse records events as they happen (oxford p.54); VF defibrillation by physiologist on instruction, ALS, C-arm (oxford p.59, p.63, p.309); keep wire (brilakis p.435); named orders and check-back (Härgestam); scribe and documentation (oxford p.54, p.300); ACT warning (oxford p.61, p.54); sign out, candour, debrief (oxford p.48, p.55–56). Times and values are illustrative.

## Lab tips

- pci-mon-baseline: brilakis p.33, p.37, p.39; oxford p.43; esc-acs-2023; hofmann-deto2x-2017
- pci-mon-st-change: brilakis p.37–38
- access-mon-pulses-site: brilakis p.39
- pci-mon-false-hypotension: brilakis p.485–487, p.38
- pci-mon-pulsus-paradoxus: brilakis p.38; oxford p.144
- haemo-mon-zero-level: oxford p.97 (mid-chest, undefined); halfway definition esc-ph-2022 and Kovacs
- haemo-mon-fast-flush: Michard; Kleinman; manual source Brilakis 5.6 (p.111–112: thrombus or air in the catheter, kinking, air bubbles in the transducer) for the causes of damping only. The tip text now states that the test itself comes from the arterial-line literature (Michard, Kleinman), not the two manuals
- pci-mon-aortic-line-physiology: brilakis p.220–221; oxford p.235
- pci-mon-watch-both-ends: brilakis p.40, p.179, p.182, p.190
- pci-mon-guide-backout: brilakis p.165, p.179, p.190
- pci-mon-check-guide-after-removal: brilakis p.183, p.191
- pci-mon-wire-tip-collimation: brilakis p.40, p.164, p.453–454
- pci-mon-keep-wire-in-crisis: brilakis p.435
- pci-mon-time-out: oxford p.55 (time out items); who defibrillates belongs to the brief: oxford p.43, p.47, p.55; the plan aloud is labelled in the tip as this module's suggestion (brilakis p.29–35)
- pci-mon-sign-out: oxford p.48, p.55–56
- pci-mon-act-warning: oxford p.54, p.59, p.61
- pci-mon-dose-advice: oxford p.63; brilakis p.39
- diag-mon-store-loop: oxford p.159
- pci-mon-vf-roles: oxford p.59, p.63, p.309; brilakis p.435; scribe from oxford p.54; up to three shocks: soar-erc-als-2021
- pci-mon-closed-loop: Härgestam (Discussion, citing other work, for the directed-order point); oxford p.47
- pci-mon-fatigue-defer: brilakis p.146, p.39; text now adds that during a complication the vessel is secured first and staging applies to the remaining lesions (module's caution; the trigger events can fire during a bailout)
- pci-mon-sterile-cockpit: brilakis p.39
- pci-mon-wipe-wire: brilakis p.39, p.183

## Possible errors in existing Academy lessons (for routing; not edited)

- foundations `fnd-lab-sterile`: "Clip hair if needed (do not shave)". Both manuals say shave: Brilakis p.64 (groin areas are shaved) and Oxford p.41 (both groins should be shaved if femoral cannulation is planned). The Academy statement may reflect newer infection-control guidance, but it disagrees with the two manuals and cites no reference for it.
- complications `comp-principles-team`: the example order "open a covered stent 3.0 by 16" names a size combination not in Brilakis's covered-stent table (p.451: one design 2.8, 3.5, 4.0, 4.5, 4.8 mm in 16, 19, 26 mm lengths; the other 2.5–5.0 mm in 15, 20, 26 mm lengths). Illustrative, but a learner could take it as a real size.
