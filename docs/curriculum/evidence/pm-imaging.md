# Evidence: pm-imaging (Intravascular imaging)

Module file: `src/content/manual/pci-manual/15-imaging.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

New references (checked on PubMed for authors, title, journal, year, volume and pages; abstracts read, full text where stated):
- hong-ivus-xpl-2015: PMID 26556051, JAMA 2015;314(20):2155–2163. 1,400 patients, implanted stent ≥28 mm; MACE at 1 year 2.9% vs 5.8% (HR 0.48), driven by ischaemia-driven TLR 2.5% vs 5.0%; cardiac death not significantly different. Brilakis cites the same trial (p.248 ref 3; p.406).
- stone-imaging-nma-2024: PMID 38401549, Lancet 2024;403(10429):824–837. 22 RCTs, 15,964 patients; imaging vs angiography: TLF RR 0.71, cardiac death RR 0.55, TV-MI 0.82, TLR 0.72, stent thrombosis 0.52, all MI 0.83, all-cause death 0.75; OCT and IVUS outcomes similar.
- kang-octivus-2023: PMID 37634092, Circulation 2023;148(16):1195–1206. 2,008 patients; 1-year composite 2.5% (OCT) vs 3.1% (IVUS), non-inferior; contrast-induced nephropathy 1.4% vs 1.5%; major procedural complications 2.2% vs 3.7%.
- jia-oct-erosion-2013: PMID 23810884, PMC3874870, J Am Coll Cardiol 2013;62(19):1748–1758. Full text read for definitions: rupture = fibrous cap discontinuity with a clear cavity formed inside the plaque; definite OCT-erosion = attached thrombus overlying an intact and visualised plaque; probable OCT-erosion = luminal surface irregularity without thrombus, or attenuation of underlying plaque by thrombus without superficial lipid or calcification immediately proximal or distal; OCT-calcified nodule = fibrous cap disruption over calcified plaque with protruding calcification, superficial calcium and substantive calcium proximal and/or distal; thrombus = mass >250 µm. Results: 126 ACS patients; rupture 43.7%, erosion 31.0%, calcified nodule 7.9%; erosion youngest (53.8 y), more NSTE-ACS, least diameter stenosis, thicker cap, lipid plaque in 43.6% (fibrous 56%); all ruptures over lipid plaque; red thrombus most frequent with rupture, white thrombus predominant with erosion and nodule; nodule older, highest hypertension and CKD; STEMI more common with rupture. Discussion: "conceivable" that erosion could be stabilised with antithrombotic therapy without a stent, "further evidence is needed".
- opolski-ct-rector-2015: PMID 25700748, JACC Cardiovasc Interv 2015;8(2):257–267. 240 CTO lesions, 4 centres; 1 point each for multiple occlusions, blunt stump, severe calcification, bending, duration ≥12 months, previously failed PCI; easy 0, intermediate 1, difficult 2, very difficult ≥3; wire crossing ≤30 min 95%, 88%, 57%, 22%; AUC 0.83 vs 0.71 (J-CTO). Brilakis names the score (p.389).

Existing references used (all in src/content/refs.ts, verified): ultimate-2018 (all-comer IVUS vs angiography, lower TVF; as already taught in physiology-imaging.ts phy-ivus-optimisation and phy-oct-stent; Brilakis p.248 ref 1); esc-ccs-2024 (imaging guidance recommended for anatomically complex lesions, in particular left main, true bifurcations and long lesions; as already taught in physiology-imaging.ts phy-oct-stent and pci-core.ts); fujino-calcium-2018 (calcium score; Brilakis p.240 fig 13.7); ilumien3-2016 (EEM sizing possible in 77%, as quoted by Brilakis p.241); litro-2011 (left main IVUS threshold, Brilakis ref [7] p.231); kang-lm-ivus-2011 (left main segment areas; see note on Brilakis's ref number below); eapci-imaging-2018 (Brilakis's source for the post-stent criteria, p.242 fig 13.10 and p.243); tearney-oct-standards-2012 (OCT standards, cited for OCT tissue terms alongside Jia).

Notes for checkers
- The Brilakis extract garbles symbols: "." before a number is ">", "$" is "≥", "," is "<", en dashes are dropped. Confirmed on page images: p.231 "MLA >6.0 mm² by IVUS or >5.4 mm² by OCT do not require revascularization"; p.232 "10–15 µm compared with 100 µm"; p.233 table 13.1 (IVUS/OCT: resolution +/++ vs +++; penetration +++ vs +; pullback speed + vs +++; ease of interpretation ++ vs +++; predilation of severe lesions + vs ++; thrombus + vs +++; calcium ++ vs +++; aorto-ostial +++ vs +; plaque morphology ++ vs +++; stents ++ vs +++) and table 13.2; p.243 ">4.5 mm² (vs ≥5.5 mm² if measured with IVUS) or >80%", ">8.0 mm²", ">90%", "(>18 atm)", "200 µm or more", "≥400 µm", "≥1 mm", "(>60° arc and/or >3 mm in length)", "Eagle Eye (Philips, 20 MHz)... 45 MHz... 60 MHz... 35–65 MHz", table 13.4; p.244 "usually 1–10 mm/sec depending on the catheter"; p.333 "<6.0 mm² by IVUS or <5.4 mm² by OCT", "4.5 mm² by IVUS... Korean", figure 17.3 (8, 7, 6, 5 mm²). Not imaged but same garble pattern: p.234 "≥6 French"; p.240 ">180°", ">0.5 mm", ">5.0 mm"; p.241 "<50% plaque burden"; p.246 "≥5.5 mm² ... ≥8.0 mm²", "<50% at the proximal and distal stent edge"; p.247 ">3 mm"; p.355 ">270°", "180–270°", "<180°"; p.374 ">180°, >0.5 mm, >5 mm"; p.406 "(≥28 mm in length)"; p.588 "(40–60 MHz)", "(35–65 MHz)".
- Oxford IVUS pullback rate: the IVUS page (p.231) prints "rate 25 mm/second", which conflicts with Oxford's own table 8.6 (p.237: IVUS pullback 0.5–1.0 mm/s) and with Brilakis (p.244: usually 1–10 mm/s). The module gives the table value and Brilakis's range and does not quote 25 mm/s.
- Disagreements taught explicitly: (1) non-left-main IVUS area: Brilakis p.231, p.239, p.246 (do not use MLA for haemodynamic significance outside the left main) vs Oxford p.231 (luminal area <4 mm² signifies likely ischaemia-producing stenosis in native vessels except LMS; Oxford prints "mean luminal area"). (2) Imaging-based stent diameter: Brilakis 13.3 p.241 (lumen +0.25 mm, EEM −0.25 mm) vs Brilakis 10.2 p.186 (85% of media-to-media). (3) IVUS pullback speed (above). (4) Resolution figures: Brilakis p.232 vs Oxford p.231/p.237, both given.
- Brilakis 17.13.2 (p.333) cites ref [11] (Park SJ 2014, an MLA-criteria study) for figure 17.3, whereas the segment stent-area targets are from ref [13] (Kang SJ 2011, 403 patients, Circ Cardiovasc Interv 2011;4:562–9, p.334), which is kang-lm-ivus-2011; the lesson says "from Korean IVUS data" and cites kang-lm-ivus-2011.
- Video numbering: the Brilakis channel titles call OCT "13.2" and IVUS "13.3"; the book numbers OCT 13.3 and IVUS 13.4. Video notes follow the titles only.
- Device names omitted on purpose (Eagle Eye, Refinity, OptiCross, Kodama, DualPro, Novasight, Dragonfly, OPTIS, StentBoost/CLEARstent); generic classes used. The OCT modes are described as "one OCT system" (Brilakis names the system p.236).
- Possible issues in existing Academy lessons (for the fixer): (a) physiology-imaging.ts `phy-ivus-optimisation` table: malapposition "Correct ... if the strut-to-wall distance is > 0.4 mm over > 1 mm length" and "Post-dilate with a balloon sized to the vessel"; Brilakis p.243 defines extensive malapposition as maximum distance ≥400 µm OR length ≥1 mm, corrected "usually with a semicompliant balloon inflated at low pressures". (b) `phy-ivus-planning` sizing table: lumen-based "rounded up (about 0.25–0.5 mm)"; Brilakis p.241 gives 0.25 mm. (c) `phy-oct-basics`: "Each run uses roughly 10–20 mL of contrast" is not in either manual; Brilakis's typical injections (p.236) are 4 mL/s × 4 s (16 mL) left and 3 mL/s × 3 s (9 mL) right. (d) `phy-oct-plaque` ACS culprit table defines erosion and calcified nodule citing eapci-imaging-2018 (Part 1, guidance and optimisation); the OCT definitions are in Jia 2013 (jia-oct-erosion-2013) and the EAPCI Part 2 document; consider adding a reference that contains them.

## Lesson pm-imaging-when-which

- Imaging before, during and after PCI; IVUS and OCT are the available modalities: brilakis p.231 (13.1)
- Some operators image all lesions; benefit appears greater in complex lesions; list of eight (left main, long lesions, CTO, stent failure ISR/ST, severely calcified, complex bifurcations, ACS lesions, minimise contrast with IVUS): brilakis p.231
- Prior PCI of target lesion strongly favours imaging: brilakis p.35 (1.13); tip pci-planning-imaging-restenosis (pm-planning)
- Oxford: IVUS provides additional information and improves outcomes when PCI is IVUS guided; limited by time, financial constraints, training; recommended for ambiguous anatomy, ISR, LMS: oxford p.232
- Table "What imaging is asked to answer": before PCI (left main significance; non-left-main not used; ACS culprit by ulceration, erosion, thrombus, calcified nodule; ambiguous lesions such as dissection, thrombus, calcified nodule; cause of stent failure; risk of distal embolisation with large lipid core plaque or large thrombus): brilakis p.231 (13.1.1); during PCI (need for lesion preparation, atherectomy or intracoronary lithotripsy; CTO crossing with IVUS; landing zone free of atherosclerosis to avoid geographic miss; balloon and stent diameter and length): brilakis p.231 (13.1.2); result after stenting (expansion, apposition, tissue protrusion, edge dissection, geographic miss): brilakis p.232; IVUS reduces contrast and contrast-induced AKI risk in high-risk patients: brilakis p.232; after PCI mechanism of stent failure: brilakis p.232 (13.1.3)
- Check 1: IVUS preferred in CKD as no contrast; dextran limited study: brilakis p.234; IVUS reduces contrast: brilakis p.232; OCT requires blood clearing usually by contrast: brilakis p.233
- Technical table: energy (Oxford 40 MHz p.231; Brilakis catheters 20, 45, 60, 35–65 MHz p.243, 40–60 MHz p.588; range therefore 20–65 MHz); blood clearance (brilakis p.233 table 13.1; oxford p.237); axial resolution 100 µm vs 10–15 µm "10-fold": brilakis p.232; Oxford axial 80–100 vs 10–20, lateral 200–250 vs 20–40, penetration 4–8 vs 2–3.5 mm, catheter 3.2–3.5 vs 2.4–2.7 Fr, frame rate 30–60 vs 200, pullback speed 0.5–1.0 vs 18–36 (up to 40) mm/s, pullback length 150 vs 54–75 (up to 150) mm, mechanical or manual vs mechanical: oxford p.237 (table 8.6), p.231; Brilakis IVUS 1–10 mm/s: brilakis p.244; predilation need and ease of interpretation grades: brilakis p.233 table 13.1
- Goal table (left main IVUS, OCT for non-aorto-ostial; culprit OCT; dissection/thrombus OCT, contrast may extend dissection; stent failure either; plaque either, IVUS for plaque volume; lesion prep, landing zone, size, expansion either; CTO IVUS; apposition and edge dissection OCT; minimise contrast IVUS): brilakis p.233 table 13.2; no outcomes data for OCT of left main: brilakis p.231; phased array preferred for CTO crossing (image closer to tip): brilakis p.243 table 13.4; Oxford IVUS better for large vessels, LMS, aorto-ostial, ectatic/aneurysmal, impaired kidney function; OCT better definition of calcium, thrombus, intimal hyperplasia, plaque (fibrosis/lipid), dissection flaps, stent parameters: oxford p.238
- Selection depends on goal, patient and lesion characteristics (location, chronic or acute kidney disease), local availability and expertise: brilakis p.233–234; large vessels IVUS preferred because complete filling with contrast is challenging; small vessels true size and positive remodelling, larger stents: brilakis p.405 (22.3.13)
- Check 2: aorto-ostial IVUS +++ vs OCT +: brilakis p.233; geographic miss underdiagnosed because balloon shoulder treats the true ostium; imaging preferably IVUS post deployment: brilakis p.280 (15.1); Oxford aorto-ostial IVUS: oxford p.238
- Equipment list: solid-state no preparation, faster, more difficult to deliver, lower resolution, no length measurement unless coregistration; short-tip version 2.5 mm tip-to-imaging distance; rotational 40–60 MHz; IVUS with NIRS (35–65 MHz), large lipid core plaques associated with distal embolisation and no-reflow; hybrid IVUS-OCT; OCT high resolution facilitating interpretation but requires contrast: brilakis p.588 (30.17); rotational needs flushing: brilakis p.243
- Evidence paragraph: IVUS-XPL (ref hong-ivus-xpl-2015; brilakis p.406 "≥28 mm", "lower incidence of MACE"); ULTIMATE all-comer (ref ultimate-2018); 2024 network meta-analysis (ref stone-imaging-nma-2024); OCTIVUS (ref kang-octivus-2023); ESC CCS 2024 (ref esc-ccs-2024)
- Pitfalls: ostial OCT (brilakis p.231, p.233; oxford p.238); OCT in kidney disease (brilakis p.234); non-left-main area (brilakis p.231; oxford p.231); prior PCI (brilakis p.35); pitfall now reads "a pullback helps only if you act on what it shows (expansion, apposition, edges)"; no trial attribution (post-stent parameters: brilakis p.241–243)
- Tips: pci-img-choose-by-goal (brilakis p.233; oxford p.238); pci-img-ivus-contrast-saver (brilakis p.232, p.234; p.191 10.2.13.2 imaging to minimise contrast)
- Videos: titles only

## Lesson pm-imaging-ivus

- Four steps; starting point guide engaged and wire across: brilakis p.243 (13.4)
- Intracoronary GTN before and after imaging to reduce spasm: oxford p.231
- Table 13.4 (flushing no/yes; blood speckle no/yes; colour Doppler yes/no; crossing severe lesions harder/easier; resolution lower/higher especially 60 MHz; CTO crossing phased array preferred as imaging closer to tip); phased array requires no preparation; lumen black without speckle; colour Doppler; rotational lower profile, crosses more easily, higher resolution; example 20 MHz phased array: brilakis p.243
- Length only with automated pullback, more accurate with rotational: brilakis p.246; solid-state no length without coregistration: brilakis p.588
- Jumps only with solid-state; rotational pullback occurs within the catheter: brilakis p.244
- IVUS + NIRS 35–65 MHz; large lipid core plaques associated with distal embolisation and no-reflow: brilakis p.588; p.442–443 (25.2.3.2 lipid-rich plaque among causes of plaque embolisation)
- Short monorail segment, passed over guide wire like a balloon catheter: oxford p.231
- Advance distal to the segment; solid-state to a large portion of the vessel or aorta then press "clear view" before advancing through the lesion: brilakis p.244 (13.4.2)
- Challenges same as OCT 13.3.2: failure to advance (severely stenotic lesion, severe calcification, severe tortuosity, poor guide support); prevention predilation, guide support, supportive wire in tortuosity; treatment remove and predilate with a small balloon, increase support; kinking from forceful advancement, replace if malfunction persists after straightening: brilakis p.235, p.244
- Check 1: brilakis p.235 (treatment), p.243 (phased array harder to cross)
- Pullback: depth to include entire vessel wall; start imaging to ensure no artefacts; manual or automated, usually 1–10 mm/s depending on catheter: brilakis p.244; Oxford table 0.5–1.0 mm/s and 150 mm: oxford p.237
- Jumps causes (tight lesions, tortuosity, calcification, across stent struts e.g. bifurcation stenting), solid-state only; prevention lesion pretreatment, slow steady pullback; treatment rotational catheter, additional pretreatment, forward imaging: brilakis p.244
- Interpretation: adjust depth; artefacts ring-down and NURD (rotational only): brilakis p.245 (fig 13.11); Oxford artefacts blood speckle (flushing may help), guide wire acoustic shadow, motion (NURD due to transducer rotation, axial catheter movement during cardiac cycle): oxford p.231
- Densities (low: blood, media black; high: intima, adventitia white/grey; very high: calcium, stent struts bright white with acoustic shadow): oxford p.231
- Attenuation without calcification highly suggestive of lipid core plaque: brilakis p.245; IVUS images blocked by calcium and show shadowing; OCT can determine depth: brilakis p.374 (19.13.1)
- Computer-assisted measurements of vessel and lumen area, lesion length, reference diameter: oxford p.231; virtual histology: oxford p.232
- Check 2: brilakis p.245; distal embolisation risk with large lipid core: brilakis p.231; oxford p.231 (calcium bright white)
- Complications: spasm <3%, responsive to intracoronary GTN; major <0.3%: dissection, thrombus, catheter entrapment by stent strut: oxford p.231; "what can go wrong" similar to OCT 13.3.2: brilakis p.244
- Pearl: rotational more accurate length (brilakis p.246); phased array no preparation and preferred for CTO crossing (brilakis p.243, p.588)
- Tips: pci-img-nitrate-first (brilakis p.234, p.243; oxford p.231); pci-img-ivus-clear-view (brilakis p.244); pci-img-cannot-cross (brilakis p.235, p.244); pci-img-ivus-jumps (brilakis p.244)

## Lesson pm-imaging-oct

- OCT requires displacement of blood because red cells scatter light; first-generation occlusive balloon; now contrast: oxford p.237; Developments box mentions "saline-filled vessel": oxford p.232
- Starting point: guide well engaged, wire across, intracoronary NTG unless contraindicated; usually ≥6 Fr for manual injection; 5 Fr requires power injector: brilakis p.234 (13.3)
- Step 1 (removed from packaging, flushed with 100% contrast, pullback device in sterile bag, connected); failure to image causes (defective catheter, kinking, pullback device damage from improper disconnection, lens damage during wire insertion on short monorail); prevention gentle handling; replace catheter; pullback device repair: brilakis p.234
- Step 2: 0.014 in. wire; three markers (tip, wire exit port, 50 mm from lens); middle marker at least 57 mm distal to target; two proximal markers demarcate approximate high-resolution run length, integrated in imaging core and track with lens: brilakis p.234
- Failure to advance and kinking: brilakis p.235 (predilation also allows contrast penetration)
- Step 3: flush with 100% contrast, confirm clearance of blood and air; air shadow, blood attenuation: brilakis p.235
- Step 4: calibration button; not while purging: brilakis p.236
- Step 5 and table 13.3 (75 vs 54 mm; 36 vs 18 mm/s; 2.1 vs 3.0 s; 375 vs 540 frames; 5 vs 10 frames/mm; 180 frames/s; survey standard pre-PCI; high-resolution when high detail desired): brilakis p.236
- Test injection; enable; injection under cine; automated injection LCA 4 mL/s × 4 s, RCA 3 mL/s × 3 s; automatic trigger on blood-free lumen, manual possible: brilakis p.236
- Pullback failure: causes, prevention (coaxial engagement, automated injector or thin syringe, contrast through lesion), treatment (engage well/guide extension; ≥3 mL/s RCA, ≥4 mL/s left main; repeat balloon dilation; manual trigger; increase rate or duration; non-linear rise if guide stable): brilakis p.236–237
- Artefacts causes (suboptimal clearance, suboptimal catheter preparation, buddy wires), prevention (fill vessel, power injector, remove buddy wires), repeat after correcting: brilakis p.237
- Distal migration from forceful injection without holding catheter and wire; fix both; assess for distal injury or perforation: brilakis p.237
- Check 1: brilakis p.236–237 (high-resolution mode is a slower, shorter pullback: p.236)
- Step 6: adjust depth; artefacts first: brilakis p.237; artefact table (incomplete blood displacement; eccentric image wire, sunflower and merry-go-round; saturation, streaked scan lines; sew-up from rapid wire or vessel movement within one frame; air bubbles inside catheter, attenuated arc, bubbles visible 5–9 o'clock; fold-over, Fourier-domain, at side branch level): brilakis p.238 (fig 13.3)
- Algorithm (layers visible: normal or fibrous; lumen high attenuation red thrombus, low white thrombus; wall high attenuation lipid, low calcium; mixed lesions): brilakis p.238 (fig 13.4); morphologies (three-layer bright-dark-bright; fibrous homogeneous signal-rich; calcium signal-poor sharp borders, depth and arc measurable; lipid signal-poor poorly defined borders, media not visible beyond; white thrombus minimal attenuation; red thrombus highly attenuating, shadow): brilakis p.239 (fig 13.5)
- Oxford pre/post-intervention OCT uses (vessel sizing by lumen contour or media-to-media; culprit; high-risk plaque; suboptimal result; stent failure): oxford p.238
- Check 2 (air in catheter): brilakis p.235, p.238
- Pitfalls: brilakis p.234–237; SCAD (brilakis p.240, p.401)
- Tips: pci-img-oct-guide-size (p.234), pci-img-oct-marker (p.234), pci-img-oct-purge-calibrate (p.235–236), pci-img-oct-flush-rates (p.236), pci-img-oct-hold-catheter (p.237), pci-img-oct-no-pullback (p.236–237)

## Lesson pm-imaging-planning

- Imaging to decide whether and how; how = need for atherectomy, stent length, stent diameter: brilakis p.239–240 (OCT), p.246 (IVUS)
- Left main thresholds: >6.0 IVUS / >5.4 OCT no revascularisation; ostial LM challenging with OCT; no OCT outcome data; cutoff differs between populations: brilakis p.231; 5.4 OCT not prospectively validated: brilakis p.239, p.246; <6.0 / <5.4 significant; 4.5 mm² proposed for Korean patients with smaller arteries: brilakis p.333 (17.13.1); ref litro-2011
- Non-left main not to be used: brilakis p.231, p.239, p.246; Oxford <4 mm²: oxford p.231
- Aorto-ostial 2D IVUS area interpreted with care, especially left main decisions: brilakis p.275 (15.1.7)
- Check 1: as above
- Calcium: angiography 38% vs IVUS 73% of 1,155 lesions; arc >270 severe, 180–270 moderate, <180 mild: brilakis p.355; OCT calcium dark, low attenuation, sharp borders: brilakis p.240; depth: brilakis p.374
- Score (>180° 2 points, >0.5 mm 1, >5.0 mm 1, total 0–4): brilakis p.240–241; ref fujino-calcium-2018. Score 4 → mean stent expansion 78% vs 96% for scores 0–3 (validation cohort, p<0.01): ref fujino-calcium-2018 (PMID 29400655, abstract). Brilakis p.241 words this as "22% likelihood of stent underexpansion"; the module gives the paper's result and notes Brilakis's wording (22% = 100% − 78%, not a probability). Favours atherectomy or IVL; deep calcium may respond to balloon, superficial more likely ablation: brilakis p.241
- IVUS: no commonly accepted criteria; circumferential and superficial favours atherectomy or IVL: brilakis p.246
- Circumferential superficial, obstructive nodular, thick calcium: brilakis p.356 (19.9.1)
- Check 2 (score 3): brilakis p.240; scores 0–3 had excellent expansion (96%): ref fujino-calcium-2018; 1:1 balloon must fully expand: brilakis p.359 (19.9.3)
- Image after atherectomy if catheter will not cross: brilakis p.374; cracks after balloon give confidence: brilakis p.359 (19.9.3); calcium fracture on OCT associated with improved expansion: brilakis p.374 (19.13.2); imaging recommended before and after stenting in calcium; check expansion and large edge dissections: brilakis p.374 (19.10, 19.13.2)
- Landing zones <50% plaque burden, no lipid-rich plaque especially TCFA (edge dissection); EEM hard to see with OCT in heavy plaque and lipid, unlike IVUS: brilakis p.241; IVUS landing zones: brilakis p.246; free of atherosclerosis to avoid geographic miss: brilakis p.231
- Length with automated pullback; more accurate with rotational: brilakis p.246; injured segments covered: brilakis p.186 (10.2)
- Diameter: match distal reference; distal lumen (recommended by the authors) or EEM-to-EEM; never proximal (distal dissection because vessels taper); post-dilate mid and proximal with larger, shorter balloon; lumen +0.25, EEM −0.25; EEM sizing possible in 77% (ILUMIEN III): brilakis p.241; ref ilumien3-2016; perforation and carina shift, labelled expansion limits, POT: brilakis p.186; 85% of media-to-media: brilakis p.186; Oxford lumen contour or media-to-media: oxford p.238
- Check 3: brilakis p.241
- Other uses: lipid core/thrombus embolic risk: brilakis p.231; small and large vessels: brilakis p.405; long lesions: brilakis p.406; bifurcation diameter, length, calcium: brilakis p.325 (16.2.13); Oxford LMS IVUS before PCI to measure reference and length; visual underestimation → undersizing → restenosis or thrombosis; IVUS guidance eliminates: oxford p.261
- Tips: pci-img-lm-threshold (p.231, p.333), pci-img-calcium-score (p.240, p.374), pci-img-image-after-modification (p.359, p.374), pci-img-landing-zone (p.241, p.246), pci-img-size-distal-reference (p.241, p.186)

## Lesson pm-imaging-optimisation

- Underexpansion increases ISR and ST risk: brilakis p.243
- Loop (pre-PCI OCT, predilate if necessary; measure references and select stent; deploy; angiographic success? no → post-dilation; post-PCI OCT; target MSA? no → post-dilation and repeat OCT; yes complete): brilakis p.242 (fig 13.9)
- High-pressure (≥20 atm) post-dilation with shorter NC balloon in most cases; exception excellent expansion confirmed by imaging; suboptimal expansion on stent-enhancement fluoroscopy or imaging → longer inflations or higher pressures (up to 20 atm semi-compliant; 26–28 atm NC): brilakis p.191 (10.2.9)
- Four OCT parameters; expansion targets (>4.5 OCT vs ≥5.5 IVUS, or >80% of average reference lumen area; LM >8.0; alternatively >90% of proximal/distal reference for proximal/distal MSA); treatment NC ≥ stent diameter >18 atm; malapposition (acute ≥200 µm not associated with failure; extensive ≥400 µm or ≥1 mm corrected, usually semi-compliant low pressure); tissue protrusion not associated with outcomes, post-dilate only if lumen inadequate; OCT more sensitive for edge dissection; small non-flow-limiting no treatment; larger (>60° and/or >3 mm), especially distal, additional stent: brilakis p.241–243; EAPCI consensus source: brilakis p.242 (fig 13.10), ref eapci-imaging-2018
- IVUS criteria (MLA ≥5.5 non-LM, ≥8.0 LM; plaque burden <50% at edges; malapposition; no edge dissection involving media >3 mm; intramural haematoma): brilakis p.246–247; phased-array colour Doppler illustration of severe malapposition: brilakis p.247 (fig 13.14)
- Geographic miss (residual disease): brilakis p.232; distal edge dissection causes (oversizing, very high pressure, incomplete coverage especially edge over lipid-rich plaque): brilakis p.192 (10.2.13.3.3); intramural haematoma among acute closure causes (table): brilakis p.437 (25)
- Check 1 (MSA 3.9; 80% of 6.0 = 4.8): brilakis p.243; no 3.5 mm² threshold exists in the sources (distractor)
- Check 2 (300 µm over 0.6 mm; 30° flap): brilakis p.243; oversizing causes edge dissection: brilakis p.192
- Left main: IVUS or OCT mandatory, both branches; figure 17.3 targets 5 (LCx ostium), 6 (LAD ostium), 7 (POC), 8 (LM proximal to POC) mm² to minimise restenosis: brilakis p.333; ref kang-lm-ivus-2011 (see note); Oxford IVUS after PCI for deployment/expansion; undersizing by eye: oxford p.261; bifurcation imaging determines cause of complications such as substent wiring: brilakis p.325
- Special situations: aorto-ostial (brilakis p.280); ostial catheter dissection stented, imaging to ensure coverage (brilakis p.124, 6.x); branch ostial stent expansion, ostial coverage, protrusion of SB stent into MV (brilakis p.292, 15.2.13); calcium (brilakis p.374); CTO long stents, negative remodelling (brilakis p.395, 21.13.2); ACS (brilakis p.386, 20.13.2); stent failure mechanisms neointima, neoatherosclerosis, underexpansion, fracture; new stent sizing and expansion; gap covered with imaging and stent-enhancement (brilakis p.403, 22.2.10, 22.2.13); Oxford OCT mechanisms malapposition, underexpansion, neoatherosclerosis (oxford p.238)
- Oxford: IVUS-guided stent deployment reduces restenosis risk (oxford p.221); IVUS in ISR assesses expansion of original stent and apposition of new stents (oxford p.222); IVUS to prevent malapposition may be beneficial for stent thrombosis (oxford p.227)
- Tips: pci-img-underexpansion-fix (p.243, p.246), pci-img-malapposition (p.243), pci-img-edge-dissection (p.243, p.247), pci-img-lm-both-branches (p.333; oxford p.261), pci-img-ostial-coverage (p.280)

## Lesson pm-imaging-acs

- OCT gold standard for identifying the ACS culprit, particular importance with unclear culprit; ulceration and thrombus hallmarks, some lesions only erosion: brilakis p.386 (20.13.1); OCT preferred over IVUS due to higher resolution: brilakis p.231; OCT best modality for detecting thrombus: brilakis p.380 (20.8.4)
- No culprit steps: repeat review (subtle staining or thrombus), LV gram or TTE, OCT for presence or absence of culprit (thrombus, rupture): brilakis p.145 (7.2.10); clues list (ECG, slow flow, haziness, collaterals, distal branch occlusion, LV gram, OCT, echo); MRI later: brilakis p.378–379 (20.7)
- Physiology not on culprit or suspected culprit; imaging should be used: brilakis p.217 (12.1.1), p.386 (20.12.1); non-culprit measurements do not significantly change over time: brilakis p.386 (20.12.2)
- Plaque ulceration, erosion, thrombus, calcified nodule help determine culprit: brilakis p.231, p.239
- OCT definitions and series results: ref jia-oct-erosion-2013 (see top)
- Red thrombus high attenuation and shadow; white minimal attenuation: brilakis p.239; thrombus >250 µm: ref jia-oct-erosion-2013
- Oxford high-risk plaque (fibrous cap <65 µm; lipid core with posterior attenuation; lipid arc >90°; macrophage infiltration); OCT culprit rupture and erosion: oxford p.238
- Check 1: ref jia-oct-erosion-2013
- Erosion without stent: suggestion and need for evidence: ref jia-oct-erosion-2013; neither manual recommends it (no statement found)
- Wrong vessel (lesion being crossed may be a CTO), more than one culprit; thrombus or ulceration strongly suggests culprit: brilakis p.380 (20.8.4)
- IVUS often aids confirming intraluminal guidewire; injecting through OTW balloon or microcatheter risks extending subintimal dissection: brilakis p.380 (20.8.3)
- Thrombus can lead to stent undersizing and malapposition: brilakis p.385 (20.10)
- Lipid core/large thrombus embolisation risk: brilakis p.231; lipid-rich plaque cause of plaque embolisation: brilakis p.442 (25.2.3.2)
- After stenting: expansion, apposition, geographic miss, residual thrombus or dissection: brilakis p.386 (20.13.2)
- SCAD: OCT can help diagnosis but wiring and contrast may cause hydraulic extension of the flap and acute closure: brilakis p.240; use cautiously: brilakis p.401 (22.1.13); table 13.2 comment: brilakis p.233; Oxford LMS dissection, IVUS better than OCT for wire position, no contrast injection that may expand false lumen: oxford p.324
- Check 2: postpartum STEMI may be SCAD: brilakis p.377 (20.1); OCT caution as above; physiology not used on suspected culprit
- Tips: pci-oct-unclear-culprit (pm-target); pci-img-thrombus-sizing (p.385, p.386); pci-img-ivus-wire-position (p.380; oxford p.324); pci-img-scad-caution (p.240, p.401; oxford p.324)

## Lesson pm-imaging-coreg-ct

- Angiographic coregistration with intravascular imaging or physiology systems for stent positioning; X-ray landmarks such as clips, previous stents: brilakis p.187 (10.2.8.2)
- OCT coregistration for accurate stent positioning including bifurcations: brilakis p.241; fig 13.9 coregistration of angiography and OCT with longitudinal lumen measurements: brilakis p.242
- Solid-state IVUS no length unless coregistration: brilakis p.588
- Lithotripsy images coregistered to OCT lens showing fractures and luminal gain: brilakis p.371 (fig 19.13)
- Physiology pullback coregistration map of pressure drop: brilakis p.225 (12.1.2)
- Real-time CCTA coregistration for proximal cap: brilakis p.390 (21.6.1)
- Check 1: brilakis p.246, p.588
- Oxford CT indication: clarifying anatomy, distal landing zone and proximal cap for CTO planning: oxford p.30
- CCTA useful for evaluating CTO segment and planning; CT-RECTOR and Korean CT registry scores; optimal projections with least foreshortening; ad hoc CTO PCI discouraged in most cases: brilakis p.389 (21.1)
- Cap ambiguity tools (projections, microcatheter injection, IVUS, preprocedural CCTA or real-time CCTA coregistration, move-the-cap); if unresolved, primary retrograde or move-the-cap: brilakis p.390 (21.6.1); perforation risk with ambiguous cap: brilakis p.390
- Course and tortuosity → knuckle or retrograde: brilakis p.391 (21.6.2); IVUS or CCTA for cap location and vessel course in antegrade approach to ambiguous cap: brilakis p.394 (21.8)
- Severe calcification and tortuosity adversely affect crossing and increase subintimal entry: brilakis p.391
- Length overestimated with antegrade-only injections; dual injection or CCTA more accurate for cap location, length, distal cap: brilakis p.391
- CT-RECTOR table and numbers: ref opolski-ct-rector-2015
- Check 2: ref opolski-ct-rector-2015
- Oxford CT accuracy factors (64-detector minimum, pretest probability, high calcium score, high heart rate, high BMI); not usually in high pretest probability, calcium score >1000, large BMI, previous stenting (accuracy falls with stents <3 mm and thick-strut first generation): oxford p.29–30
- Tips: pci-img-coreg-landing (p.187, p.241); pci-img-ct-cap (p.390, p.389)

## Quiz

- q1: brilakis p.231, p.35
- q2: brilakis p.236–237
- q3: brilakis p.243 (table 13.4)
- q4: brilakis p.240–241, p.243 (stent underexpansion harder to treat: p.359)
- q5: brilakis p.241
- q6: brilakis p.243
- q7: brilakis p.333 (fig 17.3)
- q8: ref jia-oct-erosion-2013; brilakis p.386
- q9: refs kang-octivus-2023, hong-ivus-xpl-2015, stone-imaging-nma-2024, ultimate-2018
- q10: brilakis p.390
- q11: brilakis p.234

## Cases

- pm-imaging-case-calcified-lad: modality (brilakis p.374, p.233); no imaging pitfalls (p.355 angiography underestimates; p.356 false impression; p.374 imaging after stenting); catheter will not cross and kink (p.235); flush failure, rates, holding (p.236–237); distal migration (p.237); calcium score and modification, primary/secondary atherectomy approaches, never primary stenting in heavy calcium, underexpanded stent harder to treat (p.240–241, p.356, p.359); fractures on re-imaging (p.374); sizing, landing away from lipid, POT (p.241, p.186); expansion targets and >18 atm NC (p.243); malapposition thresholds (p.243); edge dissection (p.243, p.247); significant dissection with slow flow needs stent (p.192); undilatable pathway refers to cp-uncrossable (Brilakis 23.2 via p.192).
- pm-imaging-case-nstemi-culprit: OCT for culprit (p.145, p.231, p.386); physiology not on culprit (p.217, p.386); rupture/erosion definitions (ref jia-oct-erosion-2013); red thrombus attenuation (p.239); thrombus undersizing (p.385); post-stent criteria (p.243); non-culprit physiology (p.386); non-left-main area (p.231, p.246; oxford p.231).

## Round 1 fixes (checker findings)

Lesson pm-imaging-when-which
- Oxford full IVUS indication list (lesions of ambiguous severity; ambiguous anatomy: aneurysms, filling defects, bifurcation lesions, heavily calcified vessels, hazy lesions; ISR; true calibre and lesion length; complex PCI: LMS, bifurcation, ISR): oxford p.231
- Spasm vs fixed disease row: suspected spasm not receding after nitroglycerin, OCT or IVUS may help differentiate spasm from atherosclerotic stenosis: brilakis p.124 (6.3.2)
- Check 1 explanation: blood clearing usually by contrast (brilakis p.233); dextran limited study (brilakis p.234); Oxford's Developments box says OCT needs a blood-free (saline-filled) vessel (oxford p.232) but neither book offers saline as a contrast-sparing standard
- Table 13.1 grades added (thrombus + vs +++; calcium ++ vs +++; plaque morphology ++ vs +++; stents ++ vs +++; aorto-ostial +++ vs +) and summary sentence (OCT superior for thrombus, dissection, plaque morphology, strut coverage and apposition): brilakis p.233
- Left main OCT row: no OCT outcome data when written: brilakis p.231; OCTOBER (ref october-2023, PMID 37634149, abstract read): 1,201 patients with complex bifurcations; 111/600 (18.5%) OCT patients had LM bifurcation; MACE at 2 years 10.1% vs 14.1% (HR 0.70)
- OCTIVUS caveat ("selected study population and lower-than-expected event rates"): ref kang-octivus-2023 (abstract)
- ILUMIEN IV (ref ilumien4-2023, PMID 37634188, abstract read): MSA 5.72 vs 5.36 mm²; TVF at 2 years 7.4% vs 8.2%, HR 0.90, P=0.45. RENOVATE-COMPLEX-PCI (ref renovate-2023, PMID 36876735, abstract read): imaging (IVUS or OCT at operator discretion) vs angiography in complex lesions, 7.7% vs 12.3%, HR 0.64. OCTOBER as above
- Energy range 20–65 MHz: brilakis p.243 (DualPro 35–65 MHz)

Lesson pm-imaging-ivus
- Step renamed to the manual's term: solid-state catheter to a large portion of the vessel or aorta, then press "clear view": brilakis p.244 (kept as the manual's own term; no product name)
- Ring-down: only labelled in fig 13.11 (brilakis p.245); the module says the text does not describe it
- Oxford tissue colour-coding refinement (no trade name): oxford p.232
- Pearl: rotational catheters lower profile, cross severe lesions more easily; phased array preferred for CTO crossing (imaging closer to tip), no preparation: brilakis p.243 (table 13.4)

Lesson pm-imaging-planning
- Oxford prints "mean luminal area" <4 mm² except LMS: oxford p.231; Oxford gives no LM area threshold (LMS section p.261 recommends IVUS before/after PCI only); LM thresholds are Brilakis's: brilakis p.231, p.246, p.333
- Aorto-ostial: nitroglycerin to exclude spasm, then physiology (or imaging for ostial LM); 2D IVUS area interpreted with care: brilakis p.275 (15.1.7); avoid multiple acquisitions (dissection risk), imaging determines presence, severity and response to treatment: brilakis p.275 (15.1.6)
- IVUS-derived calcium score published after the manual: ref zhang-ivus-calcium-2021 (PMID 34665658; bibliographic details checked; no text abstract, components not quoted)
- Landing-zone and deep/superficial calcium sentences rewritten in original wording (facts: brilakis p.241)
- Rounding: "up-rounded by 0.25 mm" (lumen), "down-rounded by 0.25 mm" (EEM): brilakis p.241; worked examples revised in round 2 (see below)
- LM visual reference "may be underestimated": oxford p.261

Lesson pm-imaging-optimisation
- Post-dilatation: deployment usually 12–14 atm, then in most cases high-pressure (≥20 atm) post-dilatation with a shorter NC balloon; exceptions: excellent expansion confirmed by imaging, concern about thrombus or plaque embolisation, concern about compromising a large jailed branch: brilakis p.191 (10.2.9)
- Rated burst pressure caveat: be familiar with rated burst pressure of NC balloons; balloon rupture can cause dissection and/or perforation: brilakis p.417 (23.2.2)
- EAPCI thresholds: some based on robust prospective data (expansion, landing zone), others less established (malapposition): brilakis p.242 (fig 13.10 caption)
- Malapposition wording: brilakis p.243 prints "≥400 µm or ... ≥1 mm"; the Academy lesson phy-ivus-optimisation (src/content/tracks/physiology-imaging.ts) applies both together; the EAPCI full text (ref eapci-imaging-2018, PMID 29790954) is not in PMC and was not checked, so the module attributes the "or" wording to Brilakis and flags the difference. All module examples (450 µm/2 mm; 300 µm/0.6 mm; 250 µm/0.5 mm; 500 µm/3 mm) classify the same under either reading
- Tissue protrusion: Brilakis p.243 (not associated with outcomes, ref [17]); ref soeda-oct-protrusion-2015 (PMID 26162917, Circulation 2015;132(11):1020–1029, abstract read): 900 lesions; irregular protrusion (53.8% of lesions) independently predicted 1-year device-oriented events (P=0.003); smooth protrusion not reported as a predictor. Brilakis fig 13.10 caption lists avoidance of irregular tissue protrusion among targets (p.242); the module gives the incidence as about half of lesions (53.8%) and does not claim it is more common in ACS
- After provisional LM–LAD stenting with concern about jailed circumflex: imaging and physiology; defer if FFR >0.80 or non-hyperaemic index above cut-off: brilakis p.333 (17.12.2)
- "IVUS is used the same way" removed; IVUS post-stent checks: brilakis p.246–247
- Pitfall and tip: expansion heads the list of four post-stent parameters: brilakis p.241, p.246 (no statement that malapposition must not be treated first)

Lesson pm-imaging-acs
- 2023 ESC ACS: intravascular imaging, preferably OCT, class IIb for ambiguous culprit; CMR class I when MINOCA uncertain: ref esc-acs-2023 via ref licordari-esc-acs-2024 (appraisal, PMC full text read by pm-target; same wording as pm-target 10-target.ts)
- No stenting after aspiration (Escaned, 28 STEMI patients: TIMI 3 flow, residual TIMI thrombus grade ≤3, no significant residual stenosis, no significant distal embolisation; vessel patent at repeat angiography after 6 ± 2 days); advocated especially in small vessels: brilakis p.385 (20.10.1)
- Thrombus sizing reworded: undersizing and malapposition (brilakis p.385, 20.10); imaging after stenting for expansion, apposition, residual thrombus (brilakis p.386, 20.13.2); "choose reference frames away from it" is the module's practical inference from 20.10

Lesson pm-imaging-coreg-ct
- Check 1 keyed answer: length only with automated pullback (brilakis p.246); solid-state needs coregistration (brilakis p.588); explanation paraphrased
- Oxford CT indication: coronary anatomy, distal landing zone and proximal cap for CTO planning (oxford p.30); course from brilakis p.391 (21.6.2), p.394 (21.8)
- CT-RECTOR bending: abstract gives no threshold; full text not in PMC; no threshold quoted
- IVUS in CTO crossing: IVUS-guided cap penetration limited by 6 Fr guides; 7–8 Fr guides for support (brilakis p.390, 21.5); parallel wire facilitated by IVUS (brilakis p.392); IVUS-guided antegrade re-entry needs 8 Fr guides and IVUS expertise, wire manoeuvrability limited by subintimal IVUS catheter (brilakis p.393); IVUS clarifies mechanism of failure in reverse CART (brilakis p.394); IVUS resolves cap ambiguity, facilitates and confirms true-lumen re-entry antegrade and retrograde, e.g. balloon size for reverse CART (brilakis p.395, 21.13.1)

Quiz
- q2: survey 2.1 s vs high resolution 3.0 s: brilakis p.236
- q4: ref fujino-calcium-2018 (78% vs 96%)
- q5: proximal reference changed to 3.5 mm; option D now "rounding the EEM up" (wrong under either reading of brilakis p.241)

Cases
- calcified LAD: no-imaging path now c-noimage → c-noimage-oct (underexpanded stent over 300° calcium) → s7; stent-first path c-underexpanded → s7. Underexpanded stent treated as balloon-undilatable lesion: high-pressure balloon inflations (with or without buddy wires), laser, IVL or very high-pressure balloon; atherectomy within stents infrequent (embolisation, burr entrapment, stent damage), higher risk in recently placed stents, reserved for failure of other strategies: brilakis p.417–418 (23.2.5–23.2.6), p.403 (22.2.9). s6 MSA changed to 4.2 mm² (fails both OCT targets, brilakis p.243)
- NSTEMI: c-undersized consequence (500 µm over 3 mm proximal malapposition → semi-compliant low-pressure post-dilatation: brilakis p.243; high-pressure post-dilatation avoided with thrombus or plaque embolisation concern: brilakis p.191); s4 smooth protrusion (ref soeda-oct-protrusion-2015); s1 and c-ffr blind-stenting options now stopped by the consultant before deployment; c-ffr feedback paraphrases brilakis p.217 (12.1.1)

Tips (triggers mapped to what src/ui/lab/pciTips.ts reports: phases guide, wire, lesion-prep, stent, optimise, complication; events dissection, perforation, no-reflow, slow-flow, thrombus, air, side-branch-compromise, wire-side-branch, guide-backout, wire-not-crossing)
- pci-img-edge-dissection: superseded in round 2 (see below); pci-img-thrombus-sizing: complication/stent + thrombus; pci-img-underexpansion-fix: optimise (no event)
- pci-img-scad-caution, pci-img-ct-cap, pci-img-ostial-coverage moved to the plan phase so they no longer fire on every dissection, every lesion being wired or every stent; lab request filed for lesion-type context
- Acquisition tips (imaging phase), vessel-specific tips (vessel LM) and event tips (high-contrast-volume, wire-subintimal) kept in the shared vocabulary; lab request filed for the PCI lab to report the imaging and plan phases, the target vessel and those events
- Calcium-score tip text: ref fujino-calcium-2018 (78% vs 96%)

## Round 2 fixes (checker findings)

Lesson pm-imaging-planning
- Deep versus superficial calcium now hedged as in the source: deep calcified lesions "may respond" to balloon angioplasty, superficial ones are "more likely" to need ablative techniques: brilakis p.241 (13.3.6.2.2a); same point p.246
- Rounding worked examples use measurements that are not stent sizes, so the two readings of brilakis p.241 ("up-rounded by 0.25 mm", "down-rounded by 0.25 mm") agree: lumen 2.8 mm + 0.25 = 3.05 → 3.0 mm, next size up from 2.8 = 3.0 mm; EEM 3.2 mm − 0.25 = 2.95 → 3.0 mm, next size down from 3.2 = 3.0 mm. The module states both readings. Arithmetic only; no new source claim
- Sizing check: distal lumen 2.8 mm → 3.0 mm stent under both readings; proximal 3.4 mm → shorter, larger post-dilatation balloon: brilakis p.241

Quiz
- q5: distal lumen 2.8 mm, EEM 3.2 mm, proximal lumen 3.5 mm; key "3.0 mm by either rule, then post-dilate proximally" holds under both readings (arithmetic above); distractors: 3.5 mm proximal sizing (wrong: distal dissection in a tapering vessel, brilakis p.241), 2.5 mm by rounding the lumen down (2.55), 3.25 mm by taking the EEM to its nearest size without the downward step

Cases
- Calcified LAD: base outcome is now path-neutral (final OCT MSA 6.3 mm², distal edge dissection covered by a further stent on every path, angina-free). Path detail moved into flag variants: planned-prep (s4 best and acceptable), sized-planned (s5 best), edge-covered (s7 best), untreated-dissection (s7 leave it, c-edge), edge-balloon (s7 larger balloon, now stopped by the consultant), stent-rescue reworded to "before the calcium had been modified" (true on both the no-imaging and the stent-first paths). s6 non-best options now redirected by the consultant to non-compliant post-dilatation, so the final MSA of 6.3 mm² follows on every path. IVUS option in s1 now states that the consultant asks for OCT because the calcium score needs thickness, which IVUS cannot measure (OCT can determine calcium depth, IVUS images are blocked by calcium and show only shadowing: brilakis p.374, 19.13; thickness is a score component: brilakis p.240)
- Calcified LAD s5: distal lumen 2.8 mm → 3.0 mm stent (lumen rounded up by 0.25 mm): brilakis p.241
- NSTEMI: base outcome now "OCT showed a ruptured circumflex plaque with red thrombus, the culprit, and the circumflex lesion was stented" (true on every path, since every path reaches s3 and stents the circumflex). Variants: clean-reference (s3 best), findings-accepted (s4 best), extra-stent (s4 extra stent), lad-physiology (s5 best, c-mla best), lad-ignored (s5 ignore), lad-area-stent (c-mla proceed), plus the existing wrong-lesion, undersized and stented-both. c-undersized high-pressure option now redirected to low-pressure semi-compliant post-dilatation (brilakis p.243), so the undersized variant stays true

Tips (src/ui/lab/pciTips.ts reports only the phases guide, wire, lesion-prep, stent, optimise and complication, never a vessel, and never the events high-contrast-volume, wire-subintimal or stent-underexpanded; a dissection always forces phase complication)
- pci-img-edge-dissection: trigger now phase optimise only, no event; retitled as a post-stent grading reminder, tone do. Reason: phase optimise and event dissection can never coincide in the current context (any dissection sets phase complication), and the old complication trigger fired on dissections made before any stent. Content unchanged: brilakis p.243, p.247
- pci-img-ivus-contrast-saver: event removed (never emitted); phase optimise; retitled "Spare contrast: check the stent result with IVUS". Content unchanged: brilakis p.232, p.234, p.191
- pci-img-choose-by-goal and pci-img-nitrate-first: lesion-prep added (wire across, guide engaged, no stent yet: the moment pre-PCI imaging is done); imaging phase kept for when the lab reports it
- OCT purge and flush tips retitled with an "OCT:" prefix so that they read correctly if the imaging phase is later reported for IVUS runs
- Remaining acquisition, left main, CTO-cap, ostial, SCAD and wire-position tips keep their imaging, plan, vessel and event triggers; the change to pciTipContext is returned to the orchestrator as an academy fix and is described in the lab request

