# Evidence: cp-cto-strategy (Chronic total occlusions: selection and strategy)

Module file: `src/content/manual/complex-pci/09-cto-strategy.ts`. Page numbers are PDF pages (Brilakis PDF page = printed page + 26; Oxford PDF page = printed page + 21).

New references (module `refs` export, each checked on PubMed, abstract read): `sandoval-adhoc-cto-2019` (PMID 30643040; J Invasive Cardiol 2019;31(5):133–139; Brilakis ch 21 ref 4), `tajti-progress-hybrid-2018` (PMID 29706508; JACC Cardiovasc Interv 2018;11(14):1325–1335; ref 30), `karatasakis-cap-ambiguity-2016` (PMID 27705889; J Invasive Cardiol 2016;28(10):391–396; ref 15; no DOI in PubMed), `vo-move-the-cap-2016` (PMID 26332640; Catheter Cardiovasc Interv 2016;87(4):742–748; ref 17), `harding-apcto-algorithm-2017` (PMID 29122129; JACC Cardiovasc Interv 2017;10(21):2135–2143; ref 19), `laskey-vcrcl-2007` (PMID 17692741; J Am Coll Cardiol 2007;50(7):584–590; ref 55). Round 1 additions (each checked on PubMed, abstract read): `khan-orbita-cto-2026` (PMID 41999379; J Am Coll Cardiol 2026;88(1):4–18), `wu-global-cto-algorithm-2021` (PMID 34412818; J Am Coll Cardiol 2021;78(8):840–853), `galassi-eurocto-consensus-2019` (PMID 30636678; EuroIntervention 2019;15(2):198–208; Brilakis ch 21 ref 54). Existing `esc-ccs-2024` now used in the finish lesson (imaging for complex lesions, no class quoted). Existing refs reused and re-read on PubMed this session: `cto-consensus-2019` (PMID 31356129; the seven principles are taken from its abstract), `euro-cto-2018` (PMID 29722796), `decision-cto-2019` (PMID 30813758). Existing refs reused without change: `brilakis-cto-algorithm-2012`, `werner-collaterals-2003`, `rentrop-1985`, `opolski-ct-rector-2015` (added by pm-imaging; CT-RECTOR items quoted from its verified note).

Existing tips reused in lessons (not redefined): `pci-cto-anticoagulant-choice` (pm-antithrombotics), `pci-interp-donor-ffr` (pm-interpreting).

## Notes for checkers

- Extract garbles confirmed on the page images (PDF pp. 389–395 read as images): p.390 "> 300 seconds (Hemochron) ... (some operators use > 250 s)", "> 350 seconds ... (some operators use > 300 s ...)", "every 20–30 minutes"; p.391 "large caliber (> 2.0 mm)"; p.392 "small (≤1.5 mm) balloons at low pressure (2–4 atm)", "2–3 cc luer lock syringe", "2–4 minutes", "proximal cap crossing of 1–2 mm"; p.393 "after 2–3 months"; p.394 "usually > 5 Gray air kerma", "> 3.7 × the estimated creatinine clearance"; p.133 "Within lesion bend > 45° is considered significant for chronic total occlusions". Fig 21.4 (p.394) read from the image: Dual catheter angiography → criteria 1 ambiguous proximal cap, 2 poor distal target, 3 interventional collateral (yes → Retrograde, no → Antegrade); 4 length < 20 mm (yes → wire escalation, no → dissection re-entry, "CrossBoss–Stingray" antegrade, "Reverse CART" retrograde); "Fail" arrows between all four boxes. The module's description of the figure and the built-in `cto-algorithm` figure caption avoid product names. Fig 21.1 example: "AP Cranial 30° view". Fig 21.3: four strategies (antegrade wiring, ADR, retrograde wiring, retrograde dissection and re-entry). Fig 2.2 (p.38): ST elevation and 35 mmHg pulsus paradoxus after distal vessel perforation in a prior CABG patient.
- The hybrid algorithm figure lists the three criteria without stating how they combine. The lesson words it as "ambiguous cap or poor distal target, with an interventional collateral to use, points to retrograde", consistent with p.394 text (retrograde for ambiguous caps "if technically feasible"; antegrade for ambiguous caps "especially when no collateral or graft is available") and with ref `brilakis-cto-algorithm-2012`.
- Disagreements taught explicitly: (1) CTO definition wording: Brilakis p.389 "TIMI 0 flow with an estimated duration of at least 3 months" vs Oxford p.263 "complete occlusion ... for longer than 3 months". (2) Contralateral injection: Oxford p.263 "in some circumstances" vs Brilakis p.390 dual injection in most cases and in all patients with contralateral collaterals. (3) First wires: Oxford p.263 stiff heavyweight wires vs Brilakis p.392 and p.150 polymer-jacketed tapered wire first for tapered caps. (4) Hybrid vs Asia Pacific on wiring vs dissection (ref harding-apcto-algorithm-2017 abstract).
- Device names: none in the module except catheter curve names (AL, EBU, XB, JR4) and the ACT analyser name Hemochron in body text where Brilakis's targets are device-specific. "Re-entry balloon system" replaces the product name in the Asia Pacific abstract.
- Possible issues in existing Academy lessons (pci-complex `cx-cto`, for the fixer): (a) `cx-cto-safety` stop-rule table gives "Time: procedure exceeds about 3 hours"; neither manual gives a time threshold (Brilakis p.394 lists complication, >5 Gy air kerma without crossing or substantial progress, contrast >3.7 × estimated creatinine clearance, exhaustion of options, fatigue), and the consensus abstract (PMID 31356129) gives none. (b) Same table and keypoints write the contrast rule as "3.7 × eGFR"; Brilakis p.394 says estimated creatinine clearance (ref Laskey 2007 uses creatinine clearance). (c) `cx-cto-hybrid` table row "Clear proximal cap, long occlusion, good distal landing zone → antegrade wire escalation with an early move to dissection and re-entry (the original algorithm favoured primary dissection and re-entry here)" is not in either manual; Brilakis Fig 21.4 sends length ≥20 mm to dissection re-entry. (d) `cx-cto-planning` step "Inject the donor first ... a beat or two later" is not in the PCI manual; unverified here. (e) `cx-cto-why` "Contemporary success rates above 90%" vs Brilakis p.146 "85–90% at experienced centers" and PROGRESS CTO technical success 87% (PMID 29706508). (f) `cx-cto-hybrid` keypoint "retrograde for ambiguous caps or poor distal vessels with usable collaterals" agrees with this module; no issue.

## Lesson cp-cto-strategy-selection

- CTO definition TIMI 0, estimated duration at least 3 months; specialised equipment; Manual of CTO Interventions; global consensus: brilakis p.389
- Oxford definition complete occlusion >3 months, 'final frontiers': oxford p.263
- ACC/AHA: occlusion >3 months type C, <3 months type B (Table 8.2): oxford p.212; CTO multivariate predictor of procedural failure: oxford p.211
- Duration is an estimate rather than a known date: brilakis p.389 ("estimated duration"); round 1 removed the unsourced method of estimation
- Key indication symptom improvement: brilakis p.389; principle 1 "ischemic symptom improvement": ref cto-consensus-2019
- CTO territory ischaemic even with good collaterals; physiology not typically used in CTO vessel: brilakis p.395 (21.12.1). Caveat (round 1): the cited studies are small selected series: Werner 2006 (Brilakis ref 56, PMID 17003048: 107 patients without prior Q-wave MI; collateral flow reserve >2.0 in 7%, steal in one third) and Sachdeva 2014 (ref 57, PMID 23703867: 50 symptomatic CTO patients, all with ischaemic FFR, mean 0.45)
- Planning allows viability evaluation: brilakis p.389
- EURO-CTO: 396 patients, open-label, 2:1, intention to treat with 13.4% failed procedures and 7.3% crossovers, SAQ at 12 months, angina frequency and QoL improved, freedom from angina 71.6% vs 57.8%, no periprocedural death or MI, MACE comparable: ref euro-cto-2018
- DECISION-CTO: 834 randomised, open-label, non-inferiority, about half of each arm had PCI of non-CTO lesions, stopped early for slow recruitment, 19.6% crossover, primary endpoint 22.3% vs 22.4%, median 4.0 years, health status similar improvement, limited by low power: ref decision-cto-2019
- ORBITA-CTO: multicentre, blinded, placebo-controlled; 50 patients with angina from a single-vessel CTO and no bystander disease, 25:25; angina symptom score improved (OR 4.38); 30.6 more angina-free days; SAQ angina frequency +10.7 with physical limitation, QoL, summary score and CCS class improved; 6-month follow-up; blinding maintained; no death or MI end point: ref khan-orbita-cto-2026. 'Three randomised trials now define it' counts EURO-CTO, DECISION-CTO and ORBITA-CTO
- Success likelier: relatively recent, short, remote from side branches, tapered run-in: oxford p.263
- Success 85–90% at experienced centres: brilakis p.146 (7.4)
- PROGRESS CTO 3,122 procedures, technical 87%, procedural 85%, major complications 3.0%: ref tajti-progress-hybrid-2018
- Principle 6 (expertise, volume, equipment): ref cto-consensus-2019
- Ad hoc discouraged in most cases; reasons (planning, preparation, counselling, contrast, radiation, fatigue, viability, discussion): brilakis p.389
- Delayed PCI list (complex disease incl CTO; contrast/radiation; site of service without on-site surgery or equipment; inadequate consent; uncertainty about extent of symptoms; lack of evidence of ischaemia without FFR/IVUS; complication during diagnostic study; fatigue; scheduling challenges such as an incoming STEMI; inadequate pretreatment incl. inadequate trial of antianginal therapy; patient preference): brilakis p.145–146 (7.3.1). 'Three of these bear directly on CTO selection' is teaching synthesis linking 7.3.1 to the symptom indication (p.389)
- Sandoval: 2,282 procedures, 14% ad hoc, less complex, AWE mostly, similar technical success, conclusions: ref sandoval-adhoc-cto-2019
- Exceptions: ACS from failing highly diseased SVG → native CTO preferred if feasible; very challenging access: brilakis p.389
- Old films: shifting collaterals: brilakis p.392 (taught in lesson 3)
- CCTA useful for CTO segment and planning; CT-RECTOR and Korean registry scores; projection with least foreshortening; Fig 21.1 AP cranial 30°: brilakis p.389
- CT-RECTOR items (multiple occlusions, blunt stump, severe calcification, bending, duration ≥12 months, previously failed PCI; one point each): ref opolski-ct-rector-2015 (registry note)
- Oxford CT indication: clarifying anatomy, distal landing zone, proximal cap for CTO planning: oxford p.30; cardiac CT should NOT usually be considered with high calcium score (>1000), large BMI, previous coronary stenting (among others): oxford p.30
- Multivessel order (LAD CTO first then CABG vs treat non-occlusive first): brilakis p.146 (7.4)
- SVG CTOs generally not recanalised, class III LOE C, unless no other options; occluded SVG for retrograde crossing if the occlusion morphology is favourable (p.340, 18.7.2.2); native CTO after SVG PCI failure or recurrent failure at experienced centres: brilakis p.340 (18.7)
- Operators ready to manage complications such as perforation: brilakis p.389 (21.2)
- Check 1: brilakis p.389, p.395; refs euro-cto-2018, decision-cto-2019
- Check 2: brilakis p.389, p.145–146
- Pearl: teaching synthesis of p.389 (symptoms, viability, planning); no new facts
- Drill: angio-real occlusion drill (exists, used in pm-interpreting)
- Videos: titles only

## Lesson cp-cto-strategy-setup

- Challenging, time consuming, high radiation and contrast; ECG, haemodynamics, radiation, contrast; ready for perforation: brilakis p.389 (21.2)
- Fig 2.2: ST elevation, 35 mmHg pulsus paradoxus, distal vessel perforation, prior CABG: brilakis p.38
- UFH preferred (reversible); ACT >300 s antegrade (some >250), >350 s retrograde (some >300, check frequently in low 300s), Hemochron; every 20–30 min: brilakis p.390 (21.3); also brilakis p.48 (3.4.2.1.2: Hemochron 300–350 s, >350 s often recommended for retrograde CTO; HemoTec 250–300 s; ACT every 20–30 min), which supports 'a lower range for the HemoTec type, use your laboratory's equivalent'. Analyser name kept in body text under MANUAL_AUTHORING rule 7; keypoint and tip say 'analyser-specific'
- Bivalirudin avoided (not reversible; unpublished guide thrombosis cases): brilakis p.390
- No GP IIb/IIIa or cangrelor even after success: delayed effusion and tamponade: brilakis p.390
- Dual or triple access; femoral, proximal radial, distal radial, ulnar; biradial increasing; distal radial or long radial sheaths for left radial; many keep one femoral with 45 cm sheath: brilakis p.390 (21.4)
- Complex PCI incl CTO: at least one femoral (often 7 or 8 Fr, ideally 45 cm) often preferred: brilakis p.61 (4.1 step 4)
- 7 or 8 Fr guides, AL for RCA, EBU or XB for left main; 6 Fr may limit IVUS-guided cap penetration and complication management: brilakis p.390 (21.5)
- AL strongest support, preferred for RCA CTO: brilakis p.116 (5.7)
- Microcatheter 'should be considered' for complex lesions including CTOs: brilakis p.149 (8.1.2); principle 3 (essential in CTO PCI): ref cto-consensus-2019
- OTW balloons add support (Oxford CTO section): oxford p.263; OTW use now usually restricted to CTOs: oxford p.217
- Haemodynamic support ~4% of US CTO PCI: brilakis p.395 (21.14); retrograde CTO PCI listed under procedural plan of high-risk PCI; prophylactic support in most cases recommended with abnormal haemodynamics plus high-risk PCI; with normal haemodynamics and high-risk PCI not used prophylactically in most, but immediately available; many operators insert a 4 Fr femoral sheath for rapid device insertion: brilakis p.251 (14.1)
- Step 8 (before retrograde work, treat a donor lesion in the path of the retrograde route to avoid donor thrombosis): brilakis p.395 (21.10); moved here from the finish lesson in round 1
- Oxford table: guide support essential; stiff heavyweight hydrophilic wires, perforation not uncommon, tamponade; OTW balloons; dye through OTW balloon or probing catheter; contralateral injection in some circumstances: oxford p.263
- Brilakis column: brilakis p.390, p.392, p.149, p.154 (8.6.2.6), p.150 (8.2: CTO initial wire usually polymer-jacketed tapered)
- Comparison paragraph (round 1): first wire matched to the cap (tapered cap: polymer-jacketed low-penetration tapered; blunt: intermediate-penetration polymer-jacketed or composite core; escalate as needed): brilakis p.392 (21.8.1)
- Check 1 (ACT): brilakis p.390
- Check 2 (6 Fr JR4): brilakis p.390 (21.4, 21.5)
- Pearl: donor guide for retrograde — inference from p.390 (dual access, guides) and p.393 (retrograde wire through collateral needs guide); ACT retrograde target p.390
- Drill: angio-pci mid-RCA CTO scenario (exists; dual injection supported per AngioPci.tsx)
- Videos: titles only

## Lesson cp-cto-strategy-angiogram

- Dual injection, needed in most CTO cases, a key difference; simplest and most effective technique; all patients with contralateral collaterals; improves safety (wire location, perforation management): brilakis p.390 (21.6)
- Consensus principle 2: ref cto-consensus-2019
- Low magnification, breath hold, no panning, complete opacification, optimal projections, part of routine diagnostic studies: brilakis p.391 (21.6.4)
- Panning degrades image especially in dual injection for CTO; long acquisitions only for delayed collateral filling: brilakis p.126–127 (6.6)
- Oxford prolonged acquisition for collaterals: oxford p.159. Disagreement taught (round 1): Oxford p.159 'The radiographer should pan the field of view to follow the distal vessels' vs Brilakis p.126 (6.6: panning if needed, but best avoided as it degrades the image, especially in dual injection for CTO) and p.391 (21.6.4: without panning)
- Collateral review critical for retrograde feasibility: brilakis p.391 (21.6.4); careful review before the procedure reduces contrast, radiation and duration: brilakis p.392
- Long cine runs without panning in prior CABG (high CTO prevalence): brilakis p.339 (18.6.1)
- Contralateral injection often required to determine wire position, one of the key principles of CTO crossing; orthogonal projections; reference image: brilakis p.154 (8.6.2.6); dye through OTW balloon or probing catheter when no antegrade flow: oxford p.263 (Oxford does not mention IVUS here); IVUS confirms true-lumen re-entry: brilakis p.395 (21.13.1), now a separate sentence attributed to Brilakis (round 2)
- Four characteristics (cap; length, course, composition; distal vessel; collaterals): brilakis p.390, Fig 21.2 p.391
- Ambiguous cap → perforation risk; options; retrograde or move the cap: brilakis p.390 (21.6.1)
- Calcification and tortuosity hinder crossing and increase subintimal (extraplaque) entry; knuckled wire or retrograde when course unclear/tortuous; knuckle low perforation risk: brilakis p.391 (21.6.2)
- Within-lesion bend >45° significant for CTO: brilakis p.133 (6.8.2.9)
- Distal vessel >2.0 mm, fills well, no significant disease, free of major branches favourable; small diffusely diseased harder especially after subintimal entry; hypoperfusion negative remodelling, enlarge after recanalisation; distal caps calcified in vessels bypassed distal to CTO; distal calcification hinders re-entry; bifurcation at distal cap, proximal cap or within segment hinders antegrade wiring and increases side branch loss; retrograde favoured for distal cap bifurcation: brilakis p.391 (21.6.3); distal calcification 'may hinder' re-entry after subintimal entry (round 1 wording); 2021 global algorithm handles a distal-cap bifurcation with a dual-lumen catheter and IVUS and a poor distal vessel retrogradely: ref wu-global-cto-algorithm-2021 (abstract). 'Neither source recommends ADR at a distal-cap bifurcation': Brilakis p.391 (antegrade techniques often occlude a branch) and the global algorithm step 4 (dual-lumen catheter and IVUS, not ADR)
- Length overestimated with antegrade only (underfilling, competing flow); dual injection or CCTA: brilakis p.391 (21.6.2)
- Dual lumen microcatheter for CTOs with side branch adjacent to proximal cap: brilakis p.558 (30.6)
- Collateral assessment: septal, epicardial, grafts; size, tortuosity, bifurcations, entry/exit angle, stent jailing, distance from exit to distal cap: brilakis p.391
- Lack of tortuosity most important, then size; Werner CC0/CC1/CC2; surfing; shifting collaterals; disappeared collaterals may be crossable; selective tip injection after backflow; patent graft ideal (no side branches, predictable course, large calibre), anastomosis angle; occluded grafts usable; IMA-supplied LAD → avoid: brilakis p.392
- Septal safer and easier; dilate ≤1.5 mm balloons at 2–4 atm; donor vessel proximal to collateral and collateral dominance assessed; selective injection with 2–3 cc luer lock syringe through central lumen; balloon occlusion of epicardial collateral 2–4 minutes to recruit interventional collaterals: brilakis p.392
- Rentrop grades from Fig 6.8 caption (0 none; 1 side branch only; 2 partial filling; 3 complete filling): brilakis p.134; Werner from Fig 6.9: brilakis p.135
- Donor lesion in retrograde route treated: brilakis p.395 (21.10)
- Oxford collaterals: each territory can develop collaterals; reduced supply; absence of collaterals with occluded native vessel implies graft may be patent: oxford p.198
- Oxford Figs 8.24–8.26: distal RCA visualised by retrograde filling from contralateral LCA injection to confirm wire intraluminal: oxford p.264
- Check 1 (length and distal bifurcation): brilakis p.391; explanation no longer singles out ADR (round 1); global algorithm note: ref wu-global-cto-algorithm-2021
- Check 2 (tortuosity before size): brilakis p.392
- Pearl: the four features as algorithm inputs: brilakis p.390 and Fig 21.4 p.394
- Drills: angio-pci CTO scenario with contralateral injection; angio-real collaterals drill (exists)
- Videos: titles only

## Lesson cp-cto-strategy-cap-ambiguity

- Understanding cap location and morphology critical; crossing ambiguous cap may lead to perforation: brilakis p.390 (21.6.1)
- A side branch at the start of the occlusion as one setting of ambiguity (no frequency claimed): brilakis p.391 (bifurcation at proximal cap); flush aorto-ostial CTOs, like ambiguous caps, often approached with primary retrograde strategy: brilakis p.394 (21.8.4)
- Karatasakis registry: 1,021 CTO PCIs, 31%, prior CABG 43 vs 33%, calcification 66 vs 51%, technical 85 vs 93%, procedural 84 vs 91%, MACE 3.2 vs 2.9%, retrograde 68 vs 33%, initial 39 vs 13%, successful 42 vs 20%, IVUS 49 vs 36%, contrast 281 vs 250 mL, air kerma 4.0 vs 3.0 Gy, time 161 vs 119 min: ref karatasakis-cap-ambiguity-2016 (Brilakis p.396 ref 15)
- Five techniques (projections; selective microcatheter injection near cap; IVUS; preprocedural CCTA or real-time CCTA co-registration; dissection/re-entry move-the-cap): brilakis p.390; listed without an order, so the steps title no longer claims one (round 1)
- CT for least foreshortened projections: brilakis p.389
- IVUS resolves cap ambiguity, location and vessel course: brilakis p.394 (21.8.4), p.395 (21.13.1); IVUS assists CTO crossing: brilakis p.231 (13.1.2)
- Phased-array (solid state) IVUS preferred for CTO crossing, imaging closer to tip: brilakis p.243 (Table 13.4)
- 6 Fr may limit IVUS-guided cap penetration: brilakis p.390 (21.5)
- Asia Pacific: IVUS-guided entry for cap ambiguity: ref harding-apcto-algorithm-2017
- Oxford CT clarifies proximal cap: oxford p.30
- Move the cap: subintimal entry proximal to cap with stiff wire or slightly oversized balloon, then standard ADR; minimises perforation risk; useful for balloon-uncrossable lesions: ref vo-move-the-cap-2016
- Unresolved → primary retrograde or move the cap, if technically feasible: brilakis p.390
- Ambiguous caps and flush aorto-ostial CTOs often primary retrograde; without collateral or graft antegrade with IVUS/CCTA or move the cap: brilakis p.394 (21.8.4)
- Ambiguity is the first question in hybrid and Asia Pacific algorithms: brilakis p.394 Fig 21.4; ref harding-apcto-algorithm-2017
- Dual lumen microcatheter for side branch at proximal cap: brilakis p.558; side branch loss risk with bifurcation at proximal cap: brilakis p.391
- Check 1 (diagonal overlap, no collaterals): brilakis p.394
- Check 2 (flush aorto-ostial): brilakis p.394; round 1 removed the unsourced reasons (no stump to support a wire; ostium cannot be entered from the aortic wall)
- Table row 2: 'primary retrograde approach or move the cap techniques are often recommended, if technically feasible': brilakis p.390
- Pitfalls: brilakis p.390 (perforation, 6 Fr), p.391 (bifurcation)
- Sim: pci-bench IVUS (generic; dedicated scenario requested)
- Videos: titles only

## Lesson cp-cto-strategy-hybrid

- Wiring the most challenging part; four strategies by direction and subintimal use (Fig 21.3): brilakis p.392 (21.8), p.393
- Antegrade wiring most widely used; step-up/step-down: brilakis p.392 (21.8.1)
- Crossing techniques in outline (round 1, steps 1–7): wire choice by cap (tapered cap or functional occlusion with visible channel: polymer-jacketed low-penetration tapered wire, escalate to intermediate and high; blunt cap: intermediate-penetration polymer-jacketed or composite core; stiff high-penetration for highly resistant caps or resistance within the occlusion); de-escalation after 1–2 mm of cap crossing; contralateral injection and orthogonal projections; distal true lumen: microcatheter and workhorse exchange; exit: withdraw and redirect, nothing over it; subintimal: redirect, or leave for parallel wire assisted by dual-lumen microcatheter or IVUS, or ADR: brilakis p.392. Subintimal advancement significantly beyond the distal cap → haematoma, luminal compression, lower success; IVUS-guided re-entry needs 8 Fr guides and IVUS expertise, limited wire manoeuvrability: brilakis p.393. ADR intentional or unintentional; limited ADR (dedicated systems or wire-based) minimises injury, limits dissection and stent length, preserves side branches, favourable outcomes: brilakis p.393 (21.8.2). Retrograde: wire via collateral or graft, microcatheter to the distal cap, then retrograde wiring (short occlusions, tapered distal cap) or retrograde dissection/re-entry: brilakis p.393 (21.8.3). Reverse CART: balloon over antegrade wire usually subintimal; IVUS clarifies failure mechanism; guide extensions facilitate: brilakis p.394; IVUS selects reverse CART balloon size: brilakis p.395 (21.13.1)
- Outline check (step down after 2 mm): brilakis p.392; Oxford perforation not uncommon with stiff wires: oxford p.263
- ADR: subintimal crossing then re-entry; avoid subintimal advancement significantly distal to distal cap; limited re-entry with dedicated systems or wire-based: brilakis p.393 (21.8.1–21.8.2)
- Retrograde wiring usually short occlusions, tapered distal cap; reverse CART most common; balloon over antegrade wire: brilakis p.393–394 (21.8.3)
- Antegrade preferred initially (higher complications, longer time, more radiation with retrograde; antegrade lesion prep needed); some retrograde complications caused by antegrade attempts; retrograde critical for complex CTOs, favourable long-term outcomes: brilakis p.394 (21.8.4)
- PROGRESS: final strategy AWE 52.0%, retrograde 27.1%, ADR 20.9%; >1 strategy 40.9%; medians contrast 270 mL, air kerma 2.9 Gy, procedure 123 min: ref tajti-progress-hybrid-2018
- Oxford novel approaches (retrograde e.g. proximal RCA CTO from LAD via septals; ultrasonic and laser wires; blunt dissection devices): oxford p.263
- Hybrid algorithm steps: brilakis p.394 Fig 21.4; ref brilakis-cto-algorithm-2012
- Asia Pacific differences (J-CTO case selection; same 3 questions; length not alone: course ambiguity, calcification, tortuosity, length, previous failure; IVUS-guided entry; parallel wire and re-entry balloon dissection re-entry; IVUS-guided wiring and limited STAR final; stopping): ref harding-apcto-algorithm-2017; Brilakis cites both: brilakis p.394
- Strategy selection depends on lesion, equipment, expertise: brilakis p.394
- Asia Pacific table, hybrid column (round 1): cap ambiguity 'retrograde if a route exists; IVUS can locate the cap' (ref brilakis-cto-algorithm-2012 abstract: location of the proximal cap 'using angiography or intravascular ultrasonography'; brilakis p.394); failed antegrade wiring → ADR or switch to retrograde (Fig 21.4 fail arrows join all four boxes, p.394 image)
- EuroCTO 2019 consensus now a module ref: galassi-eurocto-consensus-2019 (PMID 30636678; EuroIntervention 2019;15(2):198–208; Brilakis ch 21 ref 54)
- 2021 global crossing algorithm section (10 steps paraphrased; distal-cap bifurcation by dual-lumen catheter and IVUS; poor distal vessel retrograde; investment procedure after failure; stop for high radiation or contrast dose, long procedural time, serious complication, operator and patient fatigue, lack of expertise or equipment): ref wu-global-cto-algorithm-2021 (PMID 34412818; J Am Coll Cardiol 2021;78(8):840–853; abstract read). 'International group led by Wu, Brilakis and Mashayekhi' = first three authors
- EuroCTO 2019 consensus among algorithms cited for strategy change: brilakis p.394 (ref 54), p.397
- Seven principles: ref cto-consensus-2019 (abstract, PMID 31356129)
- Change of strategy: small changes (tip angulation, guidewire) or significant (antegrade to retrograde), based on planning and progression, no fixed order (round 1 removed 'small changes first'); timing depends on lesion characteristics, challenges, equipment, expertise: brilakis p.394 (21.8.5)
- Stop reasons: occurrence of a complication, >5 Gy air kerma without crossing or substantial progress, contrast >3.7 × estimated CrCl, exhaustion, patient or physician fatigue; risk vs benefit; STAR or fail ('may be best', paraphrased with the hedge kept) rather than aggressive: brilakis p.394. Added rows: long procedure (no threshold) and lack of expertise or equipment: ref wu-global-cto-algorithm-2021
- 'One rule, two wordings': estimated creatinine clearance in brilakis p.394 and ref laskey-vcrcl-2007; GFR wording in brilakis ch 1 (p.33) and 2.6 (p.39)
- Laskey: 3,179 patients; early creatinine rise >0.5 mg/dl in 1.5%; V/CrCl 3.7 a 'fair discriminator' (C-statistic 0.69); ≥3.7 independent predictor (OR 3.84): ref laskey-vcrcl-2007 (abstract re-read round 1); formula renamed 'contrast volume at which to consider stopping' (brilakis p.394 lists it as a reason to stop, not a maximum dose); worked example 3.7 × 60 = 222 (arithmetic)
- STAR history (uncontrolled re-entry, long stents, side branch occlusion, restenosis/reocclusion) → bailout ballooning without stenting, repeat after 2–3 months, subintimal plaque modification/investment: brilakis p.393 (21.8.2)
- Check 1 (tapered cap 32 mm, CC0): brilakis p.394 Fig 21.4 (cap clear and distal target good → antegrade whatever the collaterals); antegrade wiring most common initial technique: brilakis p.392 (21.8.1), ref cto-consensus-2019 principle 4; Asia Pacific not length alone: ref harding-apcto-algorithm-2017
- Check 2 (stop rules: 3.7 × 70 = 259 mL; 230 below; dose caveat): brilakis p.394
- Pearl: announcing plan and thresholds — teaching synthesis of p.394 (planning, stop thresholds); no new facts
- Figure: built-in cto-algorithm figure; caption written from Fig 21.4
- Drill: angio-pci CTO scenario
- Videos: titles only

## Lesson cp-cto-strategy-finish

- Contralateral injection and orthogonal projections determine wire position: brilakis p.392 (21.8.1)
- Oxford extraluminal hints (abnormal course or motion, multiple ventricular extrasystoles): oxford p.263
- Wire exits vessel → withdraw and redirect without advancing microcatheters, balloons or stents: brilakis p.392
- In distal true lumen → advance microcatheter, exchange CTO wire for workhorse: brilakis p.392; exchange after polymer-jacketed or stiff wire: brilakis p.150 (8.2)
- Lesion prep as chapter 9: brilakis p.395 (21.9)
- Multiple long stents especially RCA; imaging optimisation critical to prevent subsequent events: brilakis p.395 (21.10); of particular importance given long stent length and negative remodelling: brilakis p.395 (21.13.2) (round 1 separated the two)
- 2024 ESC CCS recommends intravascular imaging for anatomically complex lesions including long lesions: ref esc-ccs-2024 (as already taught in physiology-imaging.ts line 1640, pci-core.ts and pm-imaging evidence); no class quoted
- Distal vessel enlarges after recanalisation: brilakis p.391
- Donor artery lesions in retrograde path treated: brilakis p.395 (now taught in the setup lesson as a pre-retrograde step; removed from the post-crossing steps in round 1)
- No GP IIb/IIIa or cangrelor: brilakis p.390
- Physiology not typically used in CTO vessel; post-stent step-up → additional treatment: brilakis p.395 (21.12.1)
- Donor FFR rose by a mean of 0.03 (Ladwiniec) to 0.10 (Sachdeva, 0.098 ± 0.04): brilakis p.395 (21.12.2), p.228 (12.3.5); not in every patient (in Sachdeva 6 of 9 ischaemic donors became non-ischaemic, so 3 did not); six of nine donor vessels ≤0.80 to >0.80; physiology ideally after recanalisation: brilakis p.228 (12.3.5)
- IVUS for cap ambiguity, true-lumen re-entry (antegrade and retrograde), reverse CART balloon size: brilakis p.395 (21.13.1)
- Oxford complications: three listed (extraluminal wire passage with hints abnormal course or motion and multiple ventricular extrasystoles; perforation; restenosis/reocclusion): oxford p.263; perforation diagnosis (dye in pericardium, pulsatile exit), tamponade not uncommon, pericardiocentesis, fluids, prolonged balloon inflation, protamine, covered stent: oxford p.263
- Oxford restenosis/reocclusion high, DES reduce: oxford p.263
- Before leaving, inject donor and collaterals: labelled in the lesson as the module's own advice, consistent with brilakis p.395 (21.10); the perforation-specific part (contralateral injection required to exclude continued bleeding into a sealed perforation via collaterals) cited to brilakis p.462 (ch 26)
- Check 1 (wire outside contour): brilakis p.392
- Check 2 (step-up): brilakis p.395
- Pearl: imaging-led stenting of long recanalised vessel — synthesis of p.395 and p.391
- Sim: pci-bench IVUS stent optimisation (exists)
- Videos: titles only

## Quiz

- q1: brilakis p.389; oxford p.263, p.212; 'collateral filling is not part of either definition' (both definitions read)
- q2: refs euro-cto-2018, decision-cto-2019, khan-orbita-cto-2026 (option B now 'None of the three randomised trials showed fewer deaths or infarcts; two showed less angina': EURO-CTO and ORBITA-CTO)
- q3: brilakis p.389, p.145–146
- q4: brilakis p.390
- q5: brilakis p.390, p.394; refs brilakis-cto-algorithm-2012, harding-apcto-algorithm-2017
- q6: ref karatasakis-cap-ambiguity-2016
- q7: ref vo-move-the-cap-2016; brilakis p.390, p.394
- q8 (rewritten round 1: 30 mm, small diffusely diseased distal vessel, distal-cap bifurcation, good septals): poor distal target with interventional collateral → retrograde: brilakis p.394 Fig 21.4, ref brilakis-cto-algorithm-2012; poor distal vessel → retrograde: ref wu-global-cto-algorithm-2021; distal-cap bifurcation retrograde favoured: brilakis p.391; antegrade wiring usual first technique: brilakis p.392
- q9: brilakis p.394; ref laskey-vcrcl-2007 (3.7 × 50 = 185, arithmetic); option A no longer calls 5 × clearance 'commonly quoted'; explanation states neither manual gives it
- q10: brilakis p.390 (minor wire perforations could reopen, delayed effusion and tamponade)
- q11: brilakis p.395, p.228
- q12: brilakis p.392

## Case cp-cto-strategy-case-lad (synthetic)

- s1 / s1-adhoc: brilakis p.389 (ad hoc discouraged), p.391 (collateral filming), p.390 (dual injection); p.395 (territory ischaemic despite collaterals)
- s2: brilakis p.389 (CCTA, preparation, counselling)
- s3 / s3-small: brilakis p.390 (21.3–21.5), p.61 (45 cm sheath, 7–8 Fr)
- Findings (round 1): origin of the occlusion at the first diagonal not clearly seen, so s2's acceptable-option feedback ('the start of the occlusion was unclear') is supported on the main path
- s3 info (round 1): CT narrows the start of the occlusion to the first diagonal bifurcation but calcium and overlap prevent defining the entry point, so the cap stays ambiguous (consistent with brilakis p.390 and p.394: CT that locates the cap allows antegrade crossing)
- s4 / s4-exit: brilakis p.390 (ambiguous cap), p.394 (retrograde for ambiguous cap; IVUS alternative), p.392 (septal safer; wire exit management); option 3 now a stiff wire pushed at an estimated entry point without further imaging
- s5 / s5-lowact: brilakis p.390 (ACT >350 retrograde, every 20–30 min; no GPI), p.395 (donor thrombosis)
- s6 / s6-persist: brilakis p.394 (change of strategy; stop rules: 3.7 × 85 ≈ 315 mL; >5 Gy without progress)
- s7: brilakis p.392 (microcatheter, workhorse exchange), p.395 (imaging, donor), p.390 (no GPI/cangrelor), p.391 (distal vessel enlarges)

## Tips

- diag-cto-strategy-defer-adhoc: brilakis p.389, p.391, p.145
- pci-cto-strategy-act-recheck: brilakis p.390, p.48 (analyser-specific); triggers total-occlusion or low-act, text prefixed 'In a CTO case'
- pci-cto-strategy-guide-choice: brilakis p.390, p.116; text prefixed 'For a CTO' (round 2)
- pci-cto-strategy-dual-injection: brilakis p.390, p.391, p.126–127, p.154; title now 'CTO: inject both arteries' (round 2)
- pci-cto-strategy-microcatheter-injection: brilakis p.392; round 2: 'microcatheter-needed' trigger removed (raised for any lesion), now total-occlusion only; title and text prefixed 'CTO' / 'In a CTO'
- pci-cto-strategy-no-blind-cap: brilakis p.390, p.394; ref vo-move-the-cap-2016; trigger total-occlusion only (round 1: wire-not-crossing removed because the PCI lab raises it for any lesion, src/ui/lab/pciTips.ts line 44)
- pci-cto-strategy-hybrid-first-choice: brilakis p.394 Fig 21.4; title and text name the CTO (round 2)
- pci-cto-strategy-change-early: brilakis p.394 (small or significant change, based on planning and progression); ref cto-consensus-2019 (principle 5); trigger total-occlusion only
- pci-cto-strategy-stop-rules: brilakis p.394; ref laskey-vcrcl-2007; ref wu-global-cto-algorithm-2021 (long procedure, expertise or equipment); triggers total-occlusion, high-radiation-dose, high-contrast-volume; text prefixed 'In a CTO attempt'
- pci-cto-strategy-step-down (new, round 1): brilakis p.392 (21.8.1)
- pci-cto-strategy-subintimal-wire (new, round 1): brilakis p.392–393; trigger wire-subintimal, text prefixed 'In a CTO'
- pci-cto-strategy-confirm-before-advancing: brilakis p.392; oxford p.263 ('repeated ventricular extrasystoles' for Oxford's 'multiple')
- pci-cto-strategy-poststent-physiology: brilakis p.395 ('not typically used')

## Round 1 notes for checkers

- Lab tip triggers: `tipsFor()` (src/content/lab/tips.ts) matches any one listed event; the PCI lab (src/ui/lab/pciTips.ts line 44) raises `wire-not-crossing` whenever the wire tip is inside any target lesion, so no tip in this module uses it any more. CTO tips are keyed on `total-occlusion`; ACT, contrast and dose tips keep their own events and start 'In a CTO'. The events the PCI lab does not yet raise are requested in the lab-request file (first entry).
- Not changed: the 2024 ESC CCS class and level for CTO PCI. The guideline full text could not be read this session (publisher page returned only the opening sections), and no abstract exists on PubMed, so no recommendation class is quoted. The imaging-for-complex-lesions sentence repeats wording already verified in other Academy lessons.
- Not changed: 'Hemochron' stays in the setup step body (MANUAL_AUTHORING rule 7 allows analyser names in body text where a manual's ACT target is device-specific; Brilakis p.48 gives different targets for Hemochron and HemoTec). Keypoint and tip now say 'analyser-specific'.

## Round 2 notes for checkers

- Angiogram lesson, 'Recording the study' step 4: the IVUS clause is split from the Oxford sentence and attributed to Brilakis 21.13.1 (p.395). Oxford's CTO section (p.263) covers only dye through an OTW balloon or multifunctional probing catheter.
- Hybrid lesson, paragraph after the global algorithm list: the comparison is now with the manual's text, not Fig 21.4 (which has only the four criteria and no distal-bifurcation box or stop list). Distal-cap bifurcation: brilakis p.391 (21.6.3, retrograde 'favored'); stop reasons: brilakis p.394 (21.8.5); global algorithm: ref wu-global-cto-algorithm-2021 (dual-lumen catheter and IVUS for a distal-cap bifurcation; stop list adds long procedure time and lack of expertise or equipment).
- q2 option D now names EURO-CTO and DECISION-CTO and says 'medical therapy' (ORBITA-CTO used a placebo procedure, ref khan-orbita-cto-2026). The distractor stays false: EURO-CTO improved health status, DECISION-CTO found similar improvement in both arms.
- Selection lesson keypoint 6 now carries the SVG caveat: generally not reopened; usable as a retrograde route if the occlusion morphology is favourable: brilakis p.340 (18.7.2.2).
- Tip triggers: `total-occlusion` means 'occluded, acute or chronic' (src/content/lab/tips.ts LAB_EVENTS), so CTO tips keyed on it would also show in an acute occlusion once the PCI lab raises it. Within this module every tip keyed on it now names the CTO in its title or opening words, and `microcatheter-needed` is removed. Adding a `chronic-occlusion` event to LAB_EVENTS and re-keying the CTO tips to it is returned to the orchestrator as an Academy fix (tips.ts is outside this module); the lab-request entry stays a blocker until then.

