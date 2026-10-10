# Evidence: pm-interpreting (Interpreting the angiogram)

Module file: `src/content/manual/pci-manual/09-interpreting.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21). New references added: tonino-fame-angio-2010 (PMID 20579537; checked on PubMed: Tonino PAL, Fearon WF, De Bruyne B, et al., J Am Coll Cardiol 2010;55(25):2816–2821; the abstract gives every number quoted); round 1 added sternheim-bridging-2021 (PMID 34823663, JACC 2021;78(22):2196–2212), park-lm-ivus-2014 (PMID 25147031, JACC Cardiovasc Interv 2014;7(8):868–874), li-ivus-length-2021 (PMID 34660717, Front Cardiovasc Med 2021;8:715514) and saw-scad-outcomes-2017 (PMID 28838364, JACC 2017;70(9):1148–1158), each checked on PubMed and used only for what its abstract states. Existing registry references newly used in round 1: esc-acs-2023, total-2015 (PMID 25853743, abstract re-read), esc-ccs-2024. Existing registry references used: timi-1985, gibson-tfc-1996 (PMID 8598078, abstract re-read on PubMed for this module), vanthof-mbg-1998 (PMID 9639373, abstract re-read), gibson-timi-thrombus-2001, nhlbi-dissection-1991, ellis-1994, rentrop-1985, werner-collaterals-2003, cto-consensus-2019, scad-saw-2014, beltrame-covadis-vsa-2017 (PMID 26245334, abstract re-read).

Notes for checkers
- The Brilakis text extract drops en dashes and inequality signs. Each of these was confirmed on the PDF page image: 1–2 mL (p.123); 50–200 mcg, >120, 100–120, <100 mmHg, 0.4 mg, 1–2 minutes (p.124); ≥70%–90% and ≥50% (p.130); ≤1/2, >1/2 but <2, ≥2 vessel diameters (p.130); <50% of reference diameter (p.130–131); 3–5 mm, >70°, >90°, >120°, >45°, ≥1 mm (p.132–133); 270°, 180°–270°, <180°, 38% and 73% (p.355); >2.0 mm (p.391); 100–300 mcg (p.444).
- Disagreements taught explicitly: significance thresholds (Brilakis "≥70%–90%" outside the left main and ≥50% in it, p.130; Oxford ">70%" and ">50%", p.175); nitrate doses (Brilakis routine 50–200 mcg by systolic pressure p.124, general intracoronary dose 100–300 mcg in the drug chapter p.42, treatment of spasm 100–300 mcg p.444; Oxford 100–250 µg boluses p.173); panning (Oxford pans to follow distal vessels p.159; Brilakis pans only if needed, degrades image p.126); aneurysm definition (Brilakis ch 6 includes diffuse segments p.133; ch 22 calls diffuse dilatation ectasia p.404); sublingual (Brilakis 0.4 mg p.124; Oxford 1–2 puffs p.173).
- Not taught because neither manual nor a verified reference supports it: TIMI frame-count landmark definitions and the frame rate of the original study (only the abstract facts are used; the full text could not be retrieved, so the lesson says only that the normals apply at the original frame rate and must be scaled); blush-grade descriptors beyond 0 none / 1 minimal / 2 moderate / 3 normal (the 'ground-glass' descriptor was removed in round 1); collateral timelines after occlusion; detailed COVADIS thresholds; nitrate accentuation of myocardial bridges; stenting of bridges; first-line bridge therapy from Sternheim (full text not available); nitrate contraindication in aortic stenosis (no verified reference found; the case and spasm lesson say neither manual addresses it and frame a reduced dose as the cautious course, by analogy with Brilakis's HOCM contraindication and his warning against high and multiple doses, p.42).
- Round 1 author reasoning, labelled as such in the text: in case inferior-stemi s0 feedback, the RCA was the LAD's collateral donor on the old film, so its occlusion leaves the LAD territory more poorly supplied (follows from the case data).
- Library frame rates (10 fps for CADICA runs, 15 fps for the dominance and AngioCAD runs) were read from `datasets/library/*/index.json`, not from a book.
- The only remaining 8-word overlaps reported by the copy check are the bibliographic citations of tonino-fame-angio-2010, park-lm-ivus-2014 and saw-scad-outcomes-2017 (authors and article titles, which Brilakis's reference lists also print; a citation has to match its source).

## Lesson pm-interpreting-stenosis

- Angiography as 'lumenography'/'lumenology': oxford p.27
- At least two projections, preferably orthogonal; avoid overlap and foreshortening; depending on lesion location, separate views may be needed for proximal and distal limits: oxford p.209; oxford p.175 (two projections, especially eccentric)
- Orthogonal set per vessel: brilakis p.127 (6.6.2 step 7); caudal for proximal, cranial for distal: oxford p.159; both taught in full in pm-acquiring (cross-reference)
- Reference = adjacent angiographically normal segment; proximal and distal reference diameters averaged; %DS = 100 × [1 − MLD/average reference]: brilakis p.129–130 (6.8.2.2, Fig 6.2)
- Projection in which stenosis appears worst and least foreshortened is used; orthogonal projections needed: brilakis p.130; eccentric lesion illustration Fig 6.3: brilakis p.131; oxford Fig 6.17 p.176 and p.175 (oval lesion severe in one view, normal in another)
- Lesion length in mm from proximal to distal normal reference: brilakis p.130 (6.8.2.3)
- PCI angiography must define length, reference diameter either side, complexity features (side branches, tortuosity, calcification, thrombus): oxford p.209
- Check 1 arithmetic is the module's own illustration of the Brilakis formula; MLD ÷ reference is the fraction of the reference diameter remaining (arithmetic)
- Thresholds: brilakis p.130 (≥70%–90% non-LM, ≥50% LM; %DS alone has limitations, Fig 6.4; physiology preferred for deciding intervention; not in ACS culprit lesions); oxford p.175 (>70% ≈ 90% area; >50% LMS; mild ≤30%, moderate 30–70%, severe >70%); oxford p.176 Fig 6.18 caption (not flow-limiting until >70% diameter/90% area)
- FAME numbers (1,329 lesions; 35%, 80%, 96%; 235 of 509 = 46%): ref tonino-fame-angio-2010 (abstract); reproduced as Fig 6.4: brilakis p.132
- Inter-/intra-observer variability; ±20% in moderate lesions; mild and severe most accurate; may underestimate by up to 50% in extreme cases, which may be due to incomplete views or eccentricity; appearance may not correlate with physiology; diffuse disease makes vessel look smaller; remodelling may make it look larger; resolution ~0.2 mm: oxford p.175
- Grading at or beyond major side branches is challenging: brilakis p.129
- Not imaged at 90° → lesion may appear shorter and more severe: oxford p.209
- Normal calibres: proximal LAD 3.5–4.0 mm men, 3.0–3.5 mm women, tapers; Cx tapers from mid portion usually after first OM; RCA uniform until crux: oxford p.179
- QCA: computer software, online analysis in most modern labs; calibration usually with catheter diameter; edge detection; MLD vs reference either side; diameter stenosis, length, calibre, area by mathematical assumptions: oxford p.177. The statement that the operator still chooses frame and reference follows from the steps (frame selection oxford p.177; reference choice brilakis p.129–130); no claim of greater reproducibility is made
- When uncertainty remains: pressure wire (FFR) or intravascular imaging: oxford p.177
- IVUS luminal area <4 mm² likely ischaemia-producing in native epicardial vessels except LMS: oxford p.231 (the handbook prints 'mean luminal area'; flagged in the text)
- Caveat: 122 non-left-main intermediate lesions, best MLA cut-off 3.6 mm², AUC 0.714 against angiography-derived FFR ≤0.8: ref li-ivus-length-2021 (abstract). Left main: 112 patients with isolated ostial/shaft intermediate LM stenosis, MLA ≤4.5 mm² for FFR ≤0.80: ref park-lm-ivus-2014 (abstract). Physiology preferred for deciding on intervention: brilakis p.130
- Reviewing the pictures after the case is essential: oxford p.175
- Pearl: compare reference with normal calibre (oxford p.179) and diffuse disease makes the vessel appear smaller (oxford p.175); the pearl is phrased as a prompt to ask, not a rule
- Library run p11_v16 (CADICA): keyframes 12–29 each carry a p0_20 box; keyframes 20 and 21 also carry a p90_98 box: datasets/library/cadica/index.json

## Lesson pm-interpreting-flow

- Flow is the first parameter assessed for each artery and lesion: brilakis p.128 (6.8.2.1)
- TIMI grades 0–3 with labels (no perfusion; penetration without perfusion; partial perfusion; complete perfusion) and comparison beds (opposite artery or bed proximal to obstruction; uninvolved bed): brilakis p.128–129 (Fig 6.1 p.129); ref timi-1985
- Full opacification with reflux into aorta: brilakis p.126 (6.6.2 step 3); continue acquisition until all branches opacified: brilakis p.127
- TIMI frame count: frames for dye to reach standardised distal landmarks; 78 normal arteries; LAD 36.2 ± 2.6, RCA 20.4 ± 3.0, Cx 22.2 ± 4.1; LAD 1.7 times the mean of the RCA and Cx counts, divided by 1.7 = CTFC; reproducibility 4.7 ± 3.9 frames between two injections; simple, reproducible, objective, standardises TIMI grades and compares trials: ref gibson-tfc-1996 (abstract). Frame-rate dependence and the need to scale counts to the original rate are arithmetic, stated as such (the original rate is not stated because it could not be verified); library frame rates from datasets/library index files
- Absent blush after PCI as part of no-reflow diagnosis; downstream myocardium should blush after injection into an unobstructed vessel: oxford p.267. 'Passes through the microcirculation of perfused myocardium' describes reperfusion blush as distinct from Ellis class 2 extravasation (brilakis p.133)
- Blush grade 0–3 (none, minimal, moderate, normal); 777 patients after primary angioplasty; mortality 3%, 6%, 23% for grades 3, 2, 0/1 over mean 1.9 years; independent of Killip class, TIMI flow, LVEF: ref vanthof-mbg-1998 (abstract)
- Prolonged acquisition for collaterals and grading of blush: oxford p.159; panning degrades image: brilakis p.126; Oxford radiographer pans to follow distal vessels: oxford p.159
- Long acquisitions avoided except for delayed collateral filling: brilakis p.127 (6.6.2 step 5); avoid repeated contrast injections into a vessel with no-reflow (worsens ischaemia): oxford p.267
- Ellis class 2 = pericardial or myocardial blush without ≥1 mm exit hole: brilakis p.133; ref ellis-1994
- Conus injection → myocardial blush → VF: oxford p.157
- Causes of inability to fill (small, especially 4 Fr; side holes; large or ectatic; poor engagement; high flow: severe AS, HOCM, DCM, AV fistula; iso-osmolar viscosity; weak injection; high LVEDP); remedies (larger lumen, guide instead of diagnostic, avoid side holes, stronger injection, manual preferred with slight damping); declare non-diagnostic rather than erroneous: brilakis p.127 (6.6.3.1)
- Poor antegrade flow after balloon: vasodilators, possibly thrombectomy, unless dissection → stenting: brilakis p.184 (9.8)
- Loss of distal vessel visualisation: causes (stent through tight lesion, dissection, distal embolisation, spasm), prevention (lesion preparation, nitroglycerin), treatment (withdraw stent, inject until contrast beyond lesion, advance stent to entrap contrast; dissection → stent; spasm → IC nitroglycerin): brilakis p.190 (10.2.8.4.2)
- No-reflow: TIMI 0 or 1 after PCI, no blush, chest pain, ST elevation, sometimes hypotension; no mechanical obstruction; anticipate in bulky/thrombus-filled lesions, SVGs, ectatic native vessels, primary PCI: oxford p.266–267; may follow pre-dilation but commoner after stent deployment or post-dilation; increased short- and long-term post-PCI mortality; flow often improves with time and vasodilators: oxford p.267
- Slow flow paired with no-reflow throughout Brilakis (e.g. atherectomy): brilakis p.361, p.362, p.368 (19); SVG PCI p.337, p.349
- Culprit clue table: ECG, hypokinesis on ventriculography or echo, thrombus, contrast staining, poor or no collaterals, ease of wiring: brilakis p.143 (7.2.1a); ECG, slow antegrade flow, luminal haziness, collateral flow, distal branch occlusion suggesting embolism, ventriculography (hypokinesis, takotsubo), OCT (rupture, erosion, thrombus), echo (hypokinesis, rupture, VSD, papillary muscle rupture): brilakis p.378–379 (20.7); occlusion with thrombus usually easy; OCT when no culprit apparent; later MRI; takotsubo as non-ischaemic: brilakis p.379
- Distal vessel loss prevention (adequate lesion preparation, nitroglycerin): brilakis p.190 (10.2.8.4.2)
- Check 2: NHLBI type C (persistent extraluminal cap): brilakis p.132 Fig 6.5; poor flow → vasodilators and possibly thrombectomy, unless dissection → stenting: brilakis p.184
- Tip pci-no-reflow-distal-vasodilator is an existing tip from pm-lab-drugs (shown, not authored here)

## Lesson pm-interpreting-pitfalls

- Inexperienced operators/outdated equipment produce incomplete or misinterpreted studies: oxford p.180
- Better to declare non-diagnostic than give an erroneous interpretation: brilakis p.127
- Orientation: Cx closest to spine in all LCA views; spine on left = RAO, on right = LAO; diagonals vs septals; obtuse marginals, terminal marginal, AV Cx; RV marginals pass anteriorly and supply mainly RV: oxford p.179
- Standard views may not suffice; avoid overlap and foreshortening; cranial and caudal angulation, especially LCA: oxford p.180; at least two orthogonal projections; causes of poor visualisation (poor engagement, weak injection, overlap, patient size, not enough views): brilakis p.127–128 (6.6.3.3)
- Contrast volumes 5–10 mL LCA, 3–5 mL RCA, larger for grafts; streaming; fill for 3 beats with reflux into aortic root: oxford p.180
- Ostial lesions missed if tip too far in; injection with acquisition in right coronary sinus: oxford p.156
- Aorto-ostial lesions with severe damping: non-selective angiography reduces dissection risk but images may be suboptimal: brilakis p.274 (15.1.6)
- Super-selective engagement (short LMS, poor technique); test injection alerts; JL one size larger usually engages Cx; RCA selective engagement usually the conus, VF if large volume injected: oxford p.180
- Catheter-tip spasm (round 2: action now withdraw until the trace is free, careful coaxial re-engagement, intracoronary nitrate, wait 1–2 minutes, document relief): oxford p.173 (nitrate after careful re-engagement; maximal dilatation in 1–2 minutes), p.180; brilakis p.444 (25.2.5: nitroglycerin after engagement, before angiography)
- Unsupplied myocardium → anomalous vessel overlooked: oxford p.181; ostial occlusion confirmed by collateral flow; cusp angiography/aortography: brilakis p.117 (5.7.3.2)
- Competitive filling and back filling of graft: oxford p.197; failure to see collaterals with occluded native implies graft may be patent: oxford p.198
- Lesions at/beyond major side branches hard to grade: brilakis p.129; bifurcation lesions among ambiguous anatomy for IVUS: oxford p.231
- Orthogonal view table: brilakis p.127 (6.6.2 step 7); caudal for proximal, cranial for distal: oxford p.159
- Stiff wires straighten anatomy and provoke spasm: oxford p.174; pseudolesions from catheters/wires in highly tortuous vessels such as LIMA grafts; avoid instrumentation; soft-body wires and microcatheters; remove equipment, ensuring no dissection first (e.g. IVUS): brilakis p.445 (25.2.6)
- Check 1: short LMS / one size larger JL: oxford p.180; anomalous Cx and dot sign: oxford p.181
- Check 2: oxford p.198 ('may still be patent'; the option now says 'may')
- Tips diag-short-lm-size-up and diag-conus-withdraw are existing tips from pm-engaging (shown, not authored here)
- Pearl (account for every territory) builds on oxford p.181 (failure to recognise an unsupplied area) and brilakis p.117

## Lesson pm-interpreting-morphology

- Parameters assessed per artery and lesion (flow, stenosis, length, thrombus, calcification, dissection, branch involvement, ostial location, tortuosity, aneurysm, collaterals, perforation, fistulae): brilakis p.128–135 (6.8.2.1–6.8.2.13); occlusions acute and chronic harder to recanalise: brilakis p.129–130
- Lesion-preparation algorithm and reasons: brilakis p.167 (9.2); large thrombus → thrombectomy often: p.168 (9.4); severe calcium → atherectomy or IVL often: p.168 (9.5); primary stenting in degenerated SVGs with friable lesions or thrombus when no thrombectomy planned or it fails: p.168 (9.6); confirm balloon expansion before stenting: p.184 (9.9)
- Thrombus: limited detection; intraluminal filling defect with or without staining; can be confused with calcific nodule; TIMI thrombus grades 1–5: brilakis p.130; ref gibson-timi-thrombus-2001
- Luminal haziness as culprit clue; OCT shows rupture/erosion and thrombus: brilakis p.378–379 (20.7)
- Never primary stenting in heavily calcified lesions (underexpansion, restenosis, stent thrombosis): brilakis p.356 (19.9); OCT arc >180°, thickness >0.5 mm, length >5 mm → increased risk of underexpansion; OCT depth vs IVUS shadowing: brilakis p.374 (19.13.1); physiology encouraged because of poor angiography–physiology correlation: brilakis p.374 (19.12)
- Calcium definitions (severe: radio-opacities without cardiac motion before contrast, both sides; moderate: densities <50% reference diameter, often only during cardiac movement before contrast); angiography underestimates vs imaging: brilakis p.130–131; 1,155 lesions, 38% angiography vs 73% IVUS; arc >270° severe, 180°–270° moderate, <180° mild; challenges (severity, delivery, expansion, complications acute and late): brilakis p.355
- Multiple views; physiology and IVUS/OCT encouraged: brilakis p.356 (19.6); OCT can determine calcium depth, IVUS shows shadowing: brilakis p.374 (19.13.1)
- Injection starts 1–2 seconds after cine begins to see prior stent, calcium, contrast clearing: brilakis p.126 (6.6.2 step 3)
- NHLBI A–F definitions; developed in balloon angioplasty era, still useful: brilakis p.131–132 (Fig 6.5); spiral type D example Fig 6.6 p.133; ref nhlbi-dissection-1991
- SCAD definition (not atherosclerotic, traumatic or iatrogenic; IMH or intimal disruption): brilakis p.399 (22.1); femoral access preferred (threefold radial dissection risk in one series), extreme care, coaxial, no deep intubation, avoid GP IIb/IIIa and cangrelor: brilakis p.400 (22.1.3–22.1.5); 327 patients, average age 52.5 ± 9.6, 90.5% women, 56.9% postmenopausal: ref saw-scad-outcomes-2017 (abstract)
- SCAD suspected in young women, especially peripartum; strong injections avoided; types 1, 2 (usually >20 mm; 2A bordered by normal segments; 2B to distal tip), 3 (focal or tubular, usually <20 mm, mimics atherosclerosis, intracoronary imaging if safe): brilakis p.399–400 (22.1.1, 22.1.6); ref scad-saw-2014; aortic dissection involving ostia: brilakis p.132
- Aneurysm: localized dilation of a portion or diffuse segments >1.5 × adjacent normal: brilakis p.133 (6.8.2.10); focal (aneurysm) vs diffuse (ectasia) ≥1.5 ×; forceful injection and possibly a guide for large vessels; nitroglycerin critical in small vessels: brilakis p.404 (22.3.6); small <2.5 mm: brilakis p.403 (22.3); physiology very helpful in small vessels (territory size) and potentially in large vessels: brilakis p.404 (22.3.12)
- Ectatic native vessels and no-reflow: oxford p.267; IVUS for ambiguous anatomy (aneurysms, filling defects, bifurcations, heavily calcified vessels, hazy lesions): oxford p.231
- Bifurcation definition (European Bifurcation Club): brilakis p.132 (6.8.2.7)
- Ostial within 3–5 mm; aorto-ostial (RCA, LM, aorto-coronary SVG and arterial grafts) and branch ostial: brilakis p.132–133 (6.8.2.8)
- Tortuosity definitions (moderate ≥2 bends >70° or 1 >90°; severe 2 >90° or 1 >120°; within-lesion >45° for CTO): brilakis p.133 (6.8.2.9)
- Ellis classes and cavity spilling: brilakis p.133, p.135; ref ellis-1994
- ACC/AHA and SCAI classifications and their features: oxford p.211–212
- Check 1 (grade 3): brilakis p.130. Check 2 (severe calcium; imaging and atherectomy): brilakis p.130, p.355, p.168, p.374
- Pearl summarises brilakis p.167–168 and p.356 (no primary stenting in heavy calcium); routine thrombus aspiration not recommended, bail-out only: ref esc-acs-2023; TOTAL (10,732 STEMI patients; primary composite of CV death, recurrent MI, cardiogenic shock or NYHA IV HF within 180 days unchanged, 6.9% vs 7.0%; key safety outcome stroke within 30 days 0.7% vs 0.3%): ref total-2015 (abstract re-read on PubMed in round 2; round 2 reworded the pearl so that 180 days is the primary time point and 30 days applies only to stroke)

## Lesson pm-interpreting-collaterals

- Each of three territories can develop collaterals to others; collaterals imply reduced supply; no collaterals + occluded native → graft may be patent: oxford p.198
- Collateral filling suggests acute or chronic occlusion or high-grade stenosis; Rentrop (Fig 6.8) and Werner (Fig 6.9): brilakis p.133–135; refs rentrop-1985, werner-collaterals-2003. Rentrop grade wording follows the Fig 6.8 caption (0 none; 1 side branch only; 2 partial filling; 3 complete filling) p.134; Werner CC0 no continuous connection, CC1 threadlike, CC2 side-branch-like p.135 and p.392
- Continue acquisition until branches and collaterals opacified; long acquisitions only for delayed collateral filling; panning degrades, especially in dual injection: brilakis p.126–127 (6.6.2); prolonged acquisition for collaterals and radiographer pans to follow distal vessels: oxford p.159
- Low magnification, breath hold, no panning, optimal projections, part of routine diagnostic study when CTO discovered: brilakis p.391 (21.6.4)
- Dual injection simplest and most effective; all patients with contralateral collaterals; improves safety (guidewire location, perforation management): brilakis p.390 (21.6)
- Antegrade-only injection overestimates length; dual injection or CCTA: brilakis p.391 (21.6.2)
- Shifting collaterals; previously visualised collaterals that disappear may still be crossable: brilakis p.392
- ACS: collaterals may not have had time to form: brilakis p.379 (20.8); poor or no collaterals among culprit criteria: brilakis p.143 (7.2.1a)
- Flush ostial occlusion confirmed by collateral flow: brilakis p.117 (5.7.3.2)
- CTO definition (TIMI 0, ≥3 months): brilakis p.389; ref cto-consensus-2019
- CTO territory always ischaemic even with good collaterals; physiology not typically used in CTO vessel; donor FFR increases 0.03 to 0.10 after recanalisation: brilakis p.395 (21.12); donor physiology ideally after recanalisation: brilakis p.228 (12.3.5)
- Four features (proximal cap; length, course, composition; distal vessel; collaterals): brilakis p.390–391; ambiguous cap and clarification techniques incl. pre-procedural or co-registered CCTA and move-the-cap; unresolved cap → primary retrograde or move-the-cap: p.390 (21.6.1); CCTA for least-foreshortened projection: p.389 (21.1, Fig 21.1); knuckled wire or retrograde when course unclear or tortuous; subintimal entry more likely: p.391 (21.6.2); small diffusely diseased distal vessels harder; distal caps more calcified in vessels bypassed distal to CTO; distal calcium hinders re-entry; retrograde favoured with distal-cap bifurcation: p.391 (21.6.3); patent and occluded grafts as retrograde conduits: p.392 (21.6.4); post-stent physiology step-up: p.395 (21.12.1); calcification and tortuosity: p.391 (21.6.2); distal vessel >2.0 mm, fill well, no significant disease, free of major branches; small from hypoperfusion and increases after recanalisation; distal-cap bifurcation hinders antegrade wiring and increases side-branch loss: p.391 (21.6.3)
- Collateral features (size, tortuosity, bifurcations, entry and exit angles, stent jailing, distance from exit to distal cap); lack of tortuosity most important predictor followed by size; septal usually safer than epicardial; donor vessel proximal to origin and collateral dominance; IMA-supplied LAD as donor raises global ischaemia risk: brilakis p.391–392
- Check 1 (round 1: answer now Rentrop 2, partial filling of the occluded RCA's epicardial course; Rentrop grades the occluded recipient artery, Fig 6.8 caption): brilakis p.134; ref rentrop-1985. Check 2: brilakis p.228, p.395
- Pearl: collateral filling suggests acute or chronic occlusion: brilakis p.133 (6.8.2.11); collaterals may not have had time to form: p.379; culprit criteria incl. contrast staining and ease of wiring: p.143. The earlier claim that a richly collateralised occlusion behaves like an old one was removed in round 1
- Library run cdm-00883-LCA-1 is tagged collaterals: true in datasets/library/dominance-main/index.json

## Lesson pm-interpreting-spasm

- Spasm can mimic severe stenosis; trial of IC nitrate if in doubt: oxford p.174
- Nitroglycerin goal (prevent/correct spasm read as fixed lesions; optimise balloon and stent sizing): brilakis p.124 (6.3.1); routine IC nitroglycerin before angiography: brilakis p.42 (3.2.1)
- Catheter-tip spasm features (after ostial engagement; ventricularises then falls, rises only after withdrawal; commonest in non-dominant RCA and vessels of calibre similar to catheter; shorter low-weight patients): oxford p.173; over-engagement, decline a few seconds after engagement, withdraw and give nitrates: oxford p.180
- Equipment causes (deep guide engagement, aggressive manipulation, wiring/balloon/stenting): brilakis p.444 (25.2.5); stiff wires: oxford p.174; IVUS spasm <3%, responsive to IC GTN; GTN before and after IVUS: oxford p.231
- Cocaine/amphetamine refractory spasm needing IC verapamil; contrast reaction rarely: oxford p.174
- Vasospasm: MI or sudden death; mild plaque or normal arteries after vasoactive substances (cocaine, epinephrine, chemotherapeutic agents); may lack traditional risk factors; provocation with IC ergonovine or acetylcholine; CCB first line, other vasodilators: oxford p.147
- Ergonovine provocation now rarely performed (risk of intractable spasm and MI): oxford p.180; invasive coronary function testing with acetylcholine provocation in ANOCA/INOCA work-up: ref esc-ccs-2024 (same reference used for this in the Academy physiology track, physiology-imaging.ts)
- COVADIS three criteria: ref beltrame-covadis-vsa-2017 (abstract)
- Nitroglycerin for ostial lesions: brilakis p.274 (15.1.6); small vessels critical: brilakis p.404 (22.3.6); radial grafts very prone to spasm: brilakis p.339 (18.5.3)
- Withdraw before injecting through a ventricularised catheter: taught in pm-engaging (oxford p.321 never inject with damped or ventricularised trace)
- Contraindications and PDE5 windows (sildenafil, vardenafil, avanafil 24 h; tadalafil 48 h), hypovolaemia, RV infarction: brilakis p.124; HOCM (nitroglycerin worsens LVOT obstruction by decreasing preload and afterload), avoid high and multiple doses; hypotension treatment: no further doses (half-life 1.5–7.5 min), saline, wait, vasopressors (norepinephrine or phenylephrine) if extreme or persistent, assess other causes such as bleeding: brilakis p.42 (3.2.1.3.1); general IC dose 100–300 mcg: brilakis p.42 (3.2.1.2)
- Severe aortic stenosis: not addressed by either manual; the lesson says so and frames a reduced dose as the cautious course (no external reference found)
- Doses: 50–200 mcg by systolic pressure (>120: 200; 100–120: 100; <100: 50 or none): brilakis p.124; 100–300 mcg repeated, IC calcium channel blockers: brilakis p.444; Oxford 100–250 µg GTN or ISDN repeated boluses, 1–2 minutes, sublingual 1–2 puffs: oxford p.173; manifold or Y-connector introducer needle ('nitro on a stick'); sublingual 0.4 mg; wait 1–2 minutes (up to 2 minutes to vasodilate); BP drop common: brilakis p.124; saline (often prophylactic), observe, vasopressors such as phenylephrine: brilakis p.125
- Sequence withdraw → careful re-engagement → intracoronary nitrate → wait → image: oxford p.173 (nitrates after careful re-engagement), p.174 (document relief), p.180 (withdraw and give nitrates); brilakis p.444 (nitroglycerin after coronary engagement, before angiography)
- OCT or IVUS if spasm will not recede: brilakis p.124; nitroprusside, verapamil for intractable spasm: oxford p.173
- SCAD suspicion in young women and type 2: brilakis p.399–400
- Vasospasm and bridging as causes of suboptimal post-PCI FFR: brilakis p.218 (12.1)
- Pseudolesions (check 3): brilakis p.445; oxford p.174
- Oral nitrates no barrier; blunted response on IV infusion: oxford p.173
- Check 1 numbers (132/78 mmHg) illustrative; dose from brilakis p.124; sequence from oxford p.173 and brilakis p.444
- Existing tips shown (not authored here): pci-wire-spasm-nitrate (pm-lab-drugs). Round 2 removed diag-ostial-spasm-withdraw-nitrate (pm-engaging; puts the nitrate before re-engagement, against oxford p.173 and brilakis p.444) and diag-nitrate-dose-by-pressure (pm-lab-drugs; names only PDE-5 inhibitors, against brilakis p.98–99 and p.42) from the spasm lesson until their own modules correct them; corrections returned to the orchestrator. The lesson steps teach the full sequence, dose bands and contraindications, so no teaching was lost

## Lesson pm-interpreting-anomalies

- 1–2% of unselected angiograms; separate LAD/Cx ostia and anterior RCA are normal variants; unusual origin, course, distribution and fistulae; importance depends on course and predisposition to coronary disease; sudden death with anomalous LCA between aorta and PA (dynamic compression, ischaemic arrhythmia): oxford p.181
- Anomalous Cx: commonest (0.2–0.7%); from proximal RCA or right sinus; retro-aortic to posterolateral LV; dot sign at ventriculography; absent lateral-wall vessel; incomplete revascularisation or ligation during valve replacement; retro-aortic segment small and hard to graft: oxford p.181; Fig 6.19 (critical proximal stenosis on selective intubation): oxford p.182
- Other origins (RCA from left sinus, LMS from right sinus, ostia in ascending aorta; rarer LMS/isolated LAD from PA): oxford p.181
- Catheter choice: no hard rules; aortography; JR4 or AL/AR from right sinus; JL of unusual size or AL from left sinus; multipurpose catheters risk dissection: oxford p.182
- Single coronary artery <0.1% and forms L-I, L-II, R-I, R-II, R-III: oxford p.183
- Planning: anomalous origin recorded from prior procedures; catheters used: brilakis p.32; aortic CT for anomalous coronaries: brilakis p.34 (1.5); CT defines anomalous origin/anatomy including fistula: oxford p.30
- Test injections identify anomalous origins and unusual take-off: oxford p.155
- Failure-to-engage algorithm final step (stop if all fails, especially after large contrast volume and no emergency such as STEMI or shock; coronary CT): brilakis p.119 (5.7.3.6, Fig 5.20); steps 2–4 cross-referenced to pm-engaging
- Cusp angiography or ascending aortography; RAO instead of LAO; different catheters such as AL; coronary CT angiography: brilakis p.117 (5.7.3.1); aortogram usually 60 mL over 3 seconds through a pigtail; may show ostial occlusion: brilakis p.118 (5.7.3.6)
- JL3.5 for separate LAD origin: oxford p.153
- Guide catheter extension when coaxial alignment not possible, e.g. anomalous coronary arteries: brilakis p.528 (30.3.2)
- Fistula definition and treatment indications (volume overload; steal): brilakis p.135 (6.8.2.13); usually to PA, less commonly a chamber; shunt rarely haemodynamically important: oxford p.183
- Ellis class 3 cavity spilling: brilakis p.135
- Bridging (intramyocardial segment, commonest mid LAD, systolic compression; no good evidence of downstream ischaemia; agents to reduce LV hypertrophy and aid relaxation, e.g. beta-blockers, calcium channel blockers): oxford p.184; bridging as cause of suboptimal post-PCI FFR: brilakis p.218; traditionally considered benign, specific subsets associated with ischaemic symptoms, contemporary invasive and non-invasive functional and anatomical assessment: ref sternheim-bridging-2021 (abstract). 'Rather than stenting' removed in round 1
- Dot sign: 'the anomalous vessel end-on' at ventriculography: oxford p.181; 'dot sign on left ventriculogram': oxford p.182 Fig 6.19 caption. RAO and retro-aortic position of the dot are no longer stated
- Check 1 explanation: sudden death linked to interarterial LCA: oxford p.181; critical proximal stenosis on selective intubation: oxford p.182 Fig 6.19; ligation risk: oxford p.181
- Check 1 setting (valve surgery, ligation risk): oxford p.181–182
- Existing tip shown (not authored here): diag-anomalous-origin-image-first (pm-engaging)

## Quiz

- q1: brilakis p.130 (formula); arithmetic illustrative
- q2: ref tonino-fame-angio-2010; brilakis p.132
- q3: brilakis p.127 (6.6.3.1)
- q4: brilakis p.130–131, p.355
- q5: brilakis p.132–133 (Fig 6.5, Fig 6.6)
- q6: brilakis p.143 (7.2.1a), p.379 (20.8), p.130 (meniscus listed under possible thrombus, grade 1; total occlusion grade 5), p.130 and p.228 (physiology not in ACS culprits), p.395 (not in CTO vessel)
- q7: brilakis p.391 (21.6.2)
- q8: brilakis p.124, p.42 (100–300 mcg general IC dose), p.444
- q9: brilakis p.135; oxford p.183
- q10: ref vanthof-mbg-1998; oxford p.159 (prolonged acquisition), brilakis p.133 (Ellis blush)
- q11: brilakis p.391–392
- q12: oxford p.181–182 (dot sign, unsupplied lateral wall), p.180 (one size larger JL engages Cx), p.183 (fistulae usually to PA); round 1 replaced the invented 'ring', 'cap' and 'moon' signs with real but wrong alternatives

## Cases

pm-interpreting-case-missing-cx
- s0: brilakis p.124 (dose by systolic pressure, wait, BP drop); p.42 (HOCM contraindication, avoid high and multiple doses; hypotension treatment). Aortic stenosis not addressed by either manual; reduced dose framed as the cautious course
- s1: oxford p.173 (catheter-tip spasm picture, nitrate after careful re-engagement, document); brilakis p.444 (nitroglycerin after engagement); never inject into ventricularised catheter: oxford p.321
- c-inject: brilakis p.126 (6.5.4, catheter occluding flow → hypotension, arrhythmia; withdraw)
- s2/c-occluded: oxford p.180 (short LMS, one size larger), p.181 (unsupplied territory, anomalous Cx, dot sign), p.175 (review images after case); round 1 made 'proceed to the ventriculogram' suboptimal
- s3/c-mp: oxford p.182 (catheter choice, MP dissection risk); brilakis p.132 (type C staining), p.123–124 (dissection treatment: stop injecting, retract, wire, stent)
- s4: brilakis p.130 (worst view, physiology preferred)
- s5: oxford p.181 (ligation at valve surgery); oxford p.153 (document catheters used)

pm-interpreting-case-inferior-stemi
- s0 (rewritten in round 1 so that the anatomy is possible: RCA septal collaterals to the LAD on the old film; circumflex epicardial collaterals today): brilakis p.143 (culprit criteria incl. ECG, wall motion, thrombus, poor/no collaterals); p.133 (collateral filling compatible with acute or chronic occlusion); p.130 and p.395 (no physiology in ACS culprit or CTO vessel); donor-territory statement is reasoning from the case data
- c-wrong-culprit: brilakis p.143 (7.2.1b ongoing ischaemia priority); p.390 (dual injection for CTO)
- s1: brilakis p.128 (TIMI 0), p.130 (thrombus grade 5; meniscus under possible thrombus). The re-grading sentence was removed in round 1
- s2: brilakis p.130 (grade 4), p.128–129 (TIMI 2; comparison with the opposite artery, here the circumflex), p.168 (large thrombus → thrombectomy often); routine aspiration not recommended, bail-out: refs esc-acs-2023, total-2015
- s3/c-push: brilakis p.190 (10.2.8.4.1–2)
- s4/c-missed-dissection: brilakis p.132 (type C), p.184 (dissection → stenting); oxford p.267 (no-reflow without mechanical obstruction)
- s5: brilakis p.129 (TIMI 3, comparison with the circumflex); ref vanthof-mbg-1998; oxford p.159 (prolonged acquisition), p.267 ('ground-glass' removed in round 1)

## Tips (new)

- diag-interp-orthogonal-worst-view: brilakis p.130; oxford p.175, p.209
- pci-interp-qca-calibrate: oxford p.177; brilakis p.130
- pci-interp-grade-flow: brilakis p.128–129, p.184; oxford p.159, p.267
- pci-interp-lost-distal-vessel: brilakis p.190
- diag-interp-fill-or-call-nondiagnostic: oxford p.180; brilakis p.127
- diag-interp-ostium-from-outside: oxford p.156
- pci-interp-pseudolesion: brilakis p.445 (LIMA grafts as the example of highly tortuous vessels); oxford p.174. Round 1 narrowed the trigger to wiring of mammary grafts until the lab vocabulary has a new-narrowing event (see lab requests)
- pci-interp-thrombus-grade: brilakis p.130, p.168; refs esc-acs-2023, total-2015
- pci-interp-calcium-look-first: brilakis p.130–131 (moderate: <50% of reference diameter, often only with motion), p.355, p.356 (19.6, 19.9 never primary stenting), p.374 (19.13.1 OCT thresholds), p.184 (9.9)
- pci-interp-dissection-nhlbi: brilakis p.132
- diag-interp-collateral-long-run: brilakis p.127 (long acquisitions only for delayed collaterals), p.390 (dual injection with contralateral collaterals), p.391; oxford p.159. Trigger still broad because LAB_EVENTS has no occlusion event and this module may not edit src/content/lab/tips.ts; round 2 returned the 'total-occlusion' event to the orchestrator, after which the trigger becomes { phase: ['views'], event: ['total-occlusion'] } (see lab requests)
- pci-interp-donor-ffr: brilakis p.228, p.395 (21.12.2 applies to CTO donor vessels only). Trigger to become { phase: ['physiology'], event: ['total-occlusion'] } once the event exists (returned to the orchestrator in round 2)
- diag-interp-nitrate-before-fixed: brilakis p.124, p.42 (HOCM), p.444; oxford p.173–174 (after careful re-engagement)
- diag-interp-anomalous-cx-search: oxford p.181–182 (dot sign on left ventriculogram, vessel end-on)
- diag-interp-every-territory: oxford p.181; brilakis p.117
