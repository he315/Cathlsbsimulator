# Evidence: eq-sheaths-guides (Sheaths, guides and guide extensions)

Module file: `src/content/manual/equipment/01-sheaths-guides.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

Sections read in full: Brilakis chapter 30 sections 30.1–30.5 (p.513–540) and the rest of chapter 30 for context; chapter 21 (p.389–398); 23.1 (p.407–413); 9.7.7–9.10 (p.171–184). Related passages read: 4.1 (p.61), 4.2.13–4.2.15 (p.77–81), 4.3 (p.82–83, 90–92), 5.2–5.7 (p.97–120), 6.6 (p.127), 8.4–8.5 (p.151–153), 8.9 (p.160–161), 10.2.8 (p.187–189), 14.4.11 (p.261), 15.1 (p.272–273, 278), 16.1 (p.296), 18.5 (p.339), 18.8 (p.341, 344, 348), 18.10.3 (p.351), 19.9 (p.362–369), 20 (p.379–383), 24.1 (p.425), 25.2.1.1 (p.439–440), 26 (Fig. 26.9, p.454), 27.1 (p.465–466), 27.3 (p.478, 482), 28.2 (p.490), 29.2 (p.506–510). Oxford: chapter 3 Radial artery access (p.71), Femoral artery access (p.75); chapter 4 Equipment (p.97) and Catheters (p.103); chapter 6 Choice of catheters (p.153); chapter 8 Guiding catheters (p.213–214) and Specific techniques in complex PCI (p.246); chapter 10 Limb ischaemia (p.317–318) and Left main stem dissection (p.323).

Page images checked: Brilakis p.516 (Fig. 30.2 percentages and Fig. 30.3 tip positions), p.520–521 (shortening steps, "3–4 cm", Fig. 30.8 panel labels including "dilator 1 Fr larger than sheath" and "redundant length of guide catheter"), p.104 (Fig. 5.9: "3–6 atm", sized 1:1, razor effect; Fig. 5.8 stent dislodged by a guide). Dash-garbled numbers confirmed in the PDF text layer: p.515 "4–6", "5–8", "7–8", "7–9", "15–19"; p.522 "18–23 gauge"; p.533 "6–8 atm".

New references (module `refs` export, each checked on PubMed for authors, title, journal, year, volume, issue and pages, abstract read): `duong-guide-extension-2015` (PMID 26429852), `waterbury-guide-extension-2016` (PMID 26698371), `chen-guide-extension-maude-2019` (PMID 31079818), `wu-retrograde-tips-2008` (PMID 19012325). All four are Brilakis's own chapter 30 references ([27], [31], [29], [9]). Existing refs reused: `zhang-doca-tri-2012` (DOCA-TRI; figures from its PubMed-checked note in pm-prep-and-stent), `huang-guide-extension-reverse-cart-2017`, `reifart-parallel-sheath-2014`.

## Notes for checkers

- **Fig. 30.2 (p.516) internal inconsistency.** The figure labels 5 Fr 11.1% and 6 Fr 14.5% of a 6 mm femoral lumen. Using the outer diameters the same chapter gives for standard sheaths (Table 30.2, p.517: 5 Fr 2.29 mm, 6 Fr 2.62 mm, 7 Fr 2.95 mm), (OD/6)² gives 14.6%, 19.1% and 24.2%. The 7 Fr label (24.2%) matches the calculation exactly; the 5 and 6 Fr labels do not (the 6 Fr label equals the 5 Fr calculation). The lesson teaches the formula, quotes the 7–11 Fr labels, and says the 5 and 6 Fr labels are lower than the calculation. The existing pm-access lesson table ("a 6 Fr sheath takes up 14.5% of the lumen") repeats the figure label; flagged for the fixer.
- **Oxford lumen figure.** Oxford p.213: 6 F guides "may have an internal diameter up to 0.71 mm". Brilakis Table 30.4 (p.519): 0.071 in. (1.80 mm). The lesson says the Oxford figure cannot be right (0.71 mm is about a third of the 2.0 mm outer diameter; arithmetic) and to use Brilakis's value. (Round 1 fix: the earlier claim that it matches 'read as inches' was wrong; 0.71 in. is 18 mm.)
- **Radial sheath length disagreement taught explicitly (three positions)**: Brilakis 4.3.8 (p.90: long sheaths usually avoided, RAO and spasm) vs 29.2.3.3 (p.509: long 24 cm radial sheaths reaching the brachial artery exclude the radial from catheter manipulation and minimise endothelial trauma and spasm, listed under spasm prevention) vs 30.1.3 (p.518: 16 or 25 cm, especially left radial, partly outside) and 4.3 (p.82: 16–25 cm partially inserted, left radial, avoids supination) and 21.4 (p.390: long radial sheaths may facilitate left radial CTO PCI); Oxford p.71 (short or long, sometimes hydrophilic).
- **Extension inner diameter**: "approximately 2 French smaller" (30.3.1, p.527) vs "decreases the original guide size by 1–2 French" (30.3.4, p.536); both given.
- **Burr sizes with extensions**: 19.9.5 (p.362) 7 Fr extensions preferred for 1.25 and 1.5 mm burrs (general preference); 16.1 (p.296) 7 Fr guide + 6 Fr extension takes a 1.25 mm burr or 1.25 mm orbital crown, 8 Fr guide + 7 Fr extension takes a 1.5 mm burr, in the bifurcation context where the extension sits over the atherectomy wire only and the side-branch wire stays outside it. Both given, each in its context.
- **Crown trapping**: Table 19.2 (p.369) applies to a standard extension; 19.9.6.5 (p.368) trapping can also be done if an 8 Fr extension with a built-in trapping balloon is used. Both taught.
- **Microaxial pump access**: 30.1.1.1 (p.515) gives 13 Fr for the smaller and 14 Fr for the larger percutaneous model; Table 14.1 (p.254) gives 12 Fr for the smaller model and 21 Fr for the surgically placed largest model (p.253: two percutaneous types and one requiring surgical cut-down). The lesson gives 13/14 Fr citing 30.1.1.1 and 21 Fr for the surgical model citing Table 14.1.
- **Device names (rule 7)** replaced by classes: Pinnacle → standard sheath; Glidesheath Slender, Prelude Ideal → thin-walled sheaths; Eaucath → dedicated sheathless guide system; Railway → dilator run through a standard guide; Cook Select 125 cm → 125 cm diagnostic catheter; Heartrail guides → guides with a dimpled low-friction surface; Arrow → kink-resistant sheath; Guideliner/Guidezilla/Telescope/Guidion → guide extension; Trapliner → extension with a built-in trapping balloon; Heartrail 5-in-6 → catheter-in-catheter (5-in-6) system; Impella 2.5/CP → smaller/larger microaxial pump; Complex PCI Solutions → compatibility app; Graftmaster → covered stent; Tegaderm → transparent adhesive dressing; Launcher, Mach 1, Ikari, Adroit, Vista Brite → "varies by manufacturer"; Xience/Promus/Resolute shaft lengths → "longest stent shafts 140–145 cm"; RG3/R350 → long externalisation wires. Cook hydrophilic sheath → "one earlier-generation hydrophilic radial sheath".
- **Possible issues in existing Academy lessons (not edited)**: (a) CORRECTED in round 1. `dx-access` ("Long sheaths can reduce spasm in difficult arms") is supported by Brilakis 29.2.3.3 (p.509), which lists long (24 cm) radial sheaths reaching the brachial artery among spasm-prevention measures; it is not a conflict, though Brilakis 4.3.8 (p.90) usually avoids long radial sheaths, so the two chapters differ. (b) `pm-access` sheath table "In Brilakis's illustration of a 6 mm femoral artery, a 6 Fr sheath takes up 14.5%": correct transcription of Fig. 30.2 but the label is inconsistent with the manual's own outer diameters (see above). (c) `pci-guides` "When support fails" table, sheathless guide row "Stiffer; more guide-related dissection; harder to exchange": not found in either manual; needs a source.

## Lesson eq-sheaths-guides-sizing

- Larger sheath occupies more artery → higher likelihood of limb ischaemia and arterial thrombosis: brilakis p.515
- Large sheaths relative to radial diameter cause RAO (p.507, 29.2.2.2), spasm (p.508, 29.2.3.2) and pseudoaneurysm (p.509, 29.2.4.2); spasm prevention thin-walled smallest sheath (p.508); pseudoaneurysm prevention smallest sheath (p.509); bleeding prevention: avoid large sheaths relative to radial size, which ultrasound can assess (p.506)
- 1 Fr = 0.33 mm; 6 Fr sheath accepts 2.0 mm catheter; 7 Fr 2.33 mm; 8 Fr 2.67 mm: brilakis p.515; Oxford French scale (smaller numbers smaller catheters): oxford p.103
- Internal diameter must exceed catheter; 6 Fr standard sheath ID 2.22 mm tapering to 2.06 mm vs 2.0 mm: brilakis p.515
- Sheath OD ≈ guide two sizes bigger; 6 Fr sheath 2.62 mm vs 8 Fr guide 2.67 mm; advantage of sheathless insertion: brilakis p.515
- Thin-walled sheaths: OD 5 Fr 2.29→2.14, 6 Fr 2.62→2.44, 7 Fr 2.95→2.79 mm; easier insertion, less spasm, more kinking: brilakis p.517 (Table 30.2)
- Formula (OD/artery)²: geometry (area ∝ diameter²); worked values computed from p.517 diameters; Fig. 30.2 labels 4F 10.7, 5F 11.1, 6F 14.5, 7F 24.2, 8F 30.6, 9F 38.6, 10F 53.5, 11F 64.8%: brilakis p.516 (image)
- Check 1: (2.62/6)² ≈ 0.19: arithmetic; distractors 7%, 30% (the Fig. 30.2 8 Fr label is 30.6%, p.516), 44% (unsquared ratio). The 14% option (Fig. 30.2 6 Fr label) was removed in round 1 so a reader of the figure is not marked wrong.
- Diagnostic 4–6 Fr; 4 Fr often needs automated injector: brilakis p.515; Oxford femoral 4 or 5 F for diagnostic: oxford p.75; diagnostic catheters 4–6 F, smaller need more force, autoinjectors help, smaller sheaths/punctures, earlier mobilisation, fewer vascular complications, floppier, reduced torque: oxford p.153
- PCI 5–8 Fr, complex 7–8 Fr: brilakis p.515; most PCI through 6 Fr guides; larger guides better support and visualisation; 2.0 mm Rotablator burrs need 7 Fr; V-stenting and simultaneous kissing stents need 7 Fr: p.518; Oxford 6 F typical, 7 or 8 F complex: oxford p.75; catheters 4–8 F typically 6 F, most 100 cm: oxford p.103
- CTO: 7–8 Fr guides; 6 Fr may limit IVUS-guided cap penetration or complication management: brilakis p.390 (21.5)
- Radial 5 or 6 Fr most common, 7 or 8 Fr in larger radials: brilakis p.516; 4 Fr sheaths for diagnostic angiography, or thin-walled sheaths, preferred (lower profile, less spasm); size by radial size (ultrasound) and plan: p.90 (4.3.8.2); distal radial smaller limits sheath size: p.83; Oxford radial 5 or 6 F, short or long, sometimes hydrophilic: oxford p.71
- Support devices: IABP 7–9 Fr (or sheathless), Impella 2.5 13 Fr, CP 14 Fr, VA-ECMO arterial 15–19 Fr, venous 25 Fr: brilakis p.515; two percutaneous types and one surgical cut-down type (5.0): p.253; 21 Fr for 5.0: Table 14.1 p.254
- 5 Fr guides cause of stent loss; avoid for complex lesions (less room to withdraw deformed stents): brilakis p.465–466 (27.1.1, 27.1.2)
- Femoral preference is operator preference; ESC radial standard: ref esc-acs-2023, esc-ccs-2024 (as taught in pm-access 'Guideline position'); radial and biradial CTO access increasing: brilakis p.390 (21.4); 7 Fr thin-walled sheath OD: p.517
- Oxford: transient RAO up to 7–8%, mostly silent (ulnar supplies); compartment syndrome very rare; large sheath size among risk factors; lower limb ischaemia typically with closure devices especially large femoral sheaths: oxford p.317–318
- Compatibility app for 6, 7, 8 Fr: brilakis p.172 (9.7.7), p.519
- Small radial → ulnar, contralateral radial or femoral: brilakis p.91 (4.3.8.3), p.106 (5.3.3.4)
- Dip sheath in saline to activate hydrophilic coating: brilakis p.90
- At least one femoral access for complex PCI, often 7 or 8 Fr: brilakis p.61
- Aspirate side arm (3–4 mL), discard, flush with different syringe of heparinised saline; thrombus forms in sheath: brilakis p.79 (4.2.14), p.81 (separate syringes), p.108 (5.4)
- Bleeding around sheath → upsize to larger sheath: brilakis p.81 (4.2.15.3, Treatment); causes listed there include injury of the arterial wall during sheath insertion; branch bleeding coils/thrombin, covered stent, surgery: p.81
- Sterile granuloma: erythematous nodules, sometimes sterile discharge; clinical diagnosis after excluding infection; can lead to delayed pseudoaneurysm; foreign-body reaction to sheath polymer, commoner with earlier generation (Cook) sheaths, can still occur; avoid Cook hydrophilic sheaths; usually resolves; steroid cream; excision if persists: brilakis p.510 (29.2.5); pseudoaneurysm diagnosis pulsatile mass confirmed by duplex: p.509 (29.2.4.1)
- Sheath will not advance (track, scar, damaged tip, smaller sheath, stiff wire over dilator, dilator first): brilakis p.77–78 (cross-reference to pm-access)
- Oxford: anticipate need for larger calibre for rota or complex two-stent to avoid switching guides mid-PCI: oxford p.214
- Check 2 (6 Fr accepts 2.0 mm; OD close to 8 Fr guide; 6 Fr guide lumen ~1.8 mm): brilakis p.515, p.519

## Lesson eq-sheaths-guides-long-sheathless

- Usual femoral sheath 10 cm; longer (25 or 45 cm) for obesity, iliac or aortic tortuosity, strong support; longer sheaths give better guide support and torque response: brilakis p.515
- Tip positions: 10 cm internal iliac origin, 25 cm distal aortic bifurcation, 45 cm level of diaphragm: brilakis p.516 (text and Fig. 30.3 image)
- 25 or 45 cm for iliac tortuosity, iliac stents, obese patients in whom a short sheath may not reach the femoral artery, extra backup: brilakis p.77 (4.2.13)
- Long (25–55 cm) femoral sheaths prevent catheter kinking: brilakis p.109
- 45 or 55 cm sheath through severe iliac stenosis; long sheath through iliac stents to avoid deformation/dislodgement: brilakis p.103; Fig. 5.8 stent dislodged by guide into aorta: p.104 (image)
- 45 cm sheath across abdominal aortic aneurysm after crossing: brilakis p.101 (Fig. 5.6)
- Complex PCI: at least one femoral access, 7 or 8 Fr, ideally 45 cm: brilakis p.61; CTO: many keep one femoral, often 45 cm sheath: p.390
- Insert long sheath once crossing achieved: brilakis p.100–101 (5.2.4)
- Long sheath 1 Fr larger than catheter for very tortuous iliacs: brilakis p.515; long (45 cm) sheath at least 1 Fr larger than catheter facilitates manipulation: p.100
- Catheter slightly smaller than sheath (7 Fr guide in 8 Fr sheath); 0.035/0.038 in. wire inside stiffens: brilakis p.117 (5.7.3.3)
- Long femoral sheaths in severe iliac/aortic disease (prevention of debris in catheter): brilakis p.108, p.112
- Kink-resistant sheaths; parallel sheath technique (second puncture same femoral, 4 Fr sheath, stiff 0.035 in. wire): brilakis p.104; ref reifart-parallel-sheath-2014 (existing)
- Oxford: vascular access difficulty/PVD among patient characteristics making PCI complex: oxford p.246
- Check 1 (stem: sluggish response, no kink on screening; answer 7 Fr guide in 8 Fr sheath or 0.035 in. wire; Brilakis's list order wire, back end of wire, long sheath, smaller catheter): brilakis p.117 (5.7.3.3); kink suspected when tip not moving despite turning hub, screen entire catheter: p.109 (5.4.3.3, 5.4.3.4 step 2), p.112, p.119
- Kink paragraph and steps: causes (iliac/aortic/subclavian tortuosity, extensive manipulation), prevention (long sheaths, avoid excessive rotation, 0.035/0.038 in. wire inside), diagnosis (tip not moving with hub, waveform dampened or lost, fluoroscopy confirms): brilakis p.119 (5.7.4.1); treatment steps 1–5 (untwist + 0.035 in. wire, back end risk, 0.069 in. wire; snare from second access, BP cuff for radial kink below brachial; indeflator 3–4 atm; cut at hub, sheath same size or 1–2 Fr larger, risk without dilator; pull through arteriotomy then guidewire; snare fragments): p.119–120, Fig. 5.21; full lesson in pm-engaging (pm-engaging-torque). 'Do not inject while damped or lost': damping algorithm p.108–109 (5.4)
- Guide with less distal angulation (tortuosity solution): brilakis p.104 (5.3.3.3)
- Length and reach: long sheaths may shorten distance from access to ostium (prevention of failure to reach root): brilakis p.106 (5.3.4)
- Impella sheath technique: 7 Fr sheath through Impella 14 Fr sheath valve (shaft 9 Fr); guide may not reach ostia if 45 cm sheath cannot be fully advanced, 90 cm guides, tall/tortuous; prevention 100 (or 125) cm guides, short 7 Fr sheaths; hold Impella during sheath insertion (forward movement → LV injury): brilakis p.261
- Radial positions table: p.90 (4.3.8), p.518 (30.1.3), p.82 (16–25 cm partially inserted left radial, no supination), p.509 (29.2.3.3: 24 cm sheaths reaching the brachial artery, spasm prevention), p.390 (21.4), oxford p.71. Rows reworded in round 1 (copy finding).
- Radial spasm tip (access-sheath-sheathless-spasm): equipment solutions p.106 (5.3.3.4); avoid forceful sheath withdrawal (avulsion): p.509 (29.2.3.4)
- Femoral preference note: ref esc-acs-2023, esc-ccs-2024
- Sheathless: dedicated system 7.5 Fr through puncture equivalent to 5 Fr sheath (CTO); dilator through guide; 125 cm diagnostic catheter as dilator for 90 or 100 cm guide 2 Fr larger (Fig. 30.6: 5 Fr 125 cm into 7 Fr 100 cm EBU 3.5); BAT for sheathless placement; alternative standard 7 or 8 Fr guide through short 7 or 8 Fr sheath: brilakis p.517–518
- BAT: compliant balloon sized 1:1, half in half out of guide tip, 3–6 atm, lower more flexible, higher more pushable, prevents razor effect; particularly radial loops: brilakis p.104 (image)
- Spasm solutions: IA vasodilators, SC nitroglycerin, sedation, 5 Fr guides, dimpled-surface guides, sheathless guide or dilator system, hydrophilic sheaths and catheters, low-profile sheaths: brilakis p.106
- Radial stenosis: low-profile sheath or sheathless guide may gently dilate: brilakis p.103
- Sheathless guide with inner dilator prevents razor effect and scraping (embolisation prevention): brilakis p.110; also p.112
- IABP can be inserted without a sheath: brilakis p.515
- Check 2 (125 cm, 5 Fr inside 7 Fr 100 cm): brilakis p.517–518 (Fig. 30.6); razor effect: p.104
- Pearl (tip positions): p.516

## Lesson eq-sheaths-guides-extension-device

- One of the most commonly used tools for balloon and stent delivery: brilakis p.175 (9.7.8), p.189 (10.2.8)
- Used in 83 of 1539 PCIs (5.4%): ref duong-guide-extension-2015
- Guide vs diagnostic: thinner walls, larger lumen, metal mesh; diagnostic more torquable, less likely to kink; guides softer tips for longer engagement and deep seating with less dissection risk: brilakis p.518; Table 30.3 (6 Fr diag ID 0.057 in./1.45 mm, guide 0.069–0.072 in./1.78 mm, OD 0.079 in./2 mm, 2 vs 3 layers): p.519
- Oxford multilayer guides: outer polyurethane (shape), middle woven mesh (stiffness), inner Teflon (friction), atraumatic soft tip: oxford p.213
- Guide IDs Table 30.4 (5 Fr 0.058–0.059, 6 Fr 0.070–0.072, 7 Fr 0.081, 8 Fr 0.090–0.091 in.; mm values): brilakis p.519; text examples 0.072/0.071/0.070: p.518
- Oxford "up to 0.71 mm": oxford p.213 (see notes); Oxford: 6 F guide may accommodate two balloon or stent catheters simultaneously; atraumatic soft tip to prevent iatrogenic coronary dissection: oxford p.213
- Diagnostic catheter engages and wires, exchange over supportive 300 cm 0.014 in. wire: brilakis p.518 (30.2.1), p.117–118 (5.7.3.3); 6 Fr AL3 guide with 4 Fr diagnostic telescoped for dilated root: p.118 (5.7.3.4)
- 6 Fr guide lumen prevents trapping of OTW balloons, CrossBoss, Stingray (generic: dissection re-entry devices); 0.071 in. 6 Fr guides allow trapping of low-profile microcatheters: brilakis p.160 (8.9.2.1)
- Larger guides better support (both: brilakis p.518; oxford p.214 "8 F > 7 F > 6 F") and vessel visualisation (brilakis p.518); 2.0 mm burr and V-stenting/SKS need 7 Fr: p.518
- Push rod + distal cylinder (25 cm in three designs, 13 cm in trapping design); XL 40 cm; total length 145–150 cm: brilakis p.526–528 (text and Table 30.5)
- Collar/entry port; tip marker 2 mm from tip; marker 4 mm from collar; spade-shaped marker at entry port; positioning markers 95 (single) and 105 cm (double), or 90 and 100 cm; Guidion exit markers 95 and 105 cm: brilakis p.529–530 (Figs 30.20, 30.22, 30.23)
- Trapping version: balloon proximal to proximal collar: brilakis p.527; 6–8 Fr sizes; pins short guidewires; advantages less fluoroscopy to position trapping balloon and less equipment (used trapping balloons hard to reinsert); works best with 135 cm microcatheters, 150 cm often too long: p.160 (8.9.2.1)
- Heartrail 5-in-6: no push rod/cylinder, 120 cm catheter through standard guide, ID 0.059 in. (1.50 mm): brilakis p.526, p.528; Fig. 30.24 5 Fr in 6 Fr: p.531
- Table 30.5 extension IDs (5 Fr 0.046 and 0.041; 5.5 Fr 0.051; 6 Fr 0.056/0.057; 7 Fr 0.062/0.063; 8 Fr 0.071/0.072): brilakis p.528
- Comparisons (6 Fr extension 0.056 vs 5 Fr guide 0.058; 8 Fr extension 0.071 = 6 Fr guide; 7 Fr extension between 5 and 6 Fr guides): brilakis p.536
- About 2 Fr smaller: p.527; 1–2 Fr: p.536; attention to damping and ACT for thrombus: p.536
- Smaller extension in larger guide → wire between cylinder and guide wall: brilakis p.533 (Fig. 30.31 p.535)
- Check 1 (burrs): brilakis p.296, p.362
- Burrs and crown: p.362 (19.9.5, general preference 7 Fr extension), p.296 (16.1, bifurcation pairing with side-branch wire outside); Table 19.2 crown trapping (6 Fr no; 6+ext no; 7 yes; 7+ext no; 8 yes; 8+ext no): p.369; trapping possible with 8 Fr Trapliner: p.368 (19.9.6.5)
- Check 1 rewritten as bifurcation case (stem: extension over atherectomy wire only, side-branch wire outside): p.296
- 5 Fr guides and stent loss (list item and pitfall): p.465–466 (27.1)
- Support catheters (30.4): scaffold up to 4.5 mm, three lumens 120° apart or single central lumen for microcatheters; nitinol 10 mm element with helical struts; 5 Fr catheter with balloon to 6 mm, relief valve 1 atm; increase backup and penetration force; cannot be exchanged by trapping, 300 cm wires; at least 10 mm proximal landing zone: brilakis p.537–539 (round 2: the 300 cm wire and 10 mm landing-zone limits are stated only for MultiCross and CenterCross, 30.4.1 p.539; keypoint now limited to the scaffold types); taught further in cp-cto-antegrade
- Thrombectomy catheter may not fit within extension: brilakis p.383
- Covered stent advanced with 8 Fr extension to perforation: brilakis p.454 (Fig. 26.9 panel H)
- IVUS + microcatheter fit in 7 Fr guide (app example): brilakis p.520 (Fig. 30.7)
- Uses: delivery major indication; coaxial alignment ideal but helps when not possible, anomalous coronaries, IMA grafts; dilated ascending aorta; thrombectomy by aspirating through guide; retrieval of entrapped Rotablator burrs; reverse CART (reduces distance retrograde wire traverses; retrograde support); KAM snare; reduce haematoma in ADR by damping and reducing flow: brilakis p.527–532 (30.3.2)
- Support and proximal-vessel "modification" (device through the extension without contacting the wall): brilakis p.175, p.189
- Failure to reach root → extensions: p.106 (5.3.4); suboptimal curve size → extension: p.118–119 (5.7.3.4, Fig. 5.20 step 3)
- Better engagement for visualisation: brilakis p.127 (6.6.3.2)
- TAVI: guide or extension railed into ostium over wire: brilakis p.425
- Ostial: small extension engages and guide backed out: brilakis p.272 (damping prevention), p.273 (aorto-coronary dissection prevention); re-engagement after guide position loss during aorto-ostial stenting: p.277–278
- Thrombectomy via distal extension; risks distal dissection, ischaemia with haemodynamic compromise, stent deformation: brilakis p.382; routine use not supported by randomised data: brilakis p.381 (ch 20: routine use not supported by randomised data); TOTAL no benefit, more stroke: ref total-2015; 2023 ESC ACS no routine aspiration: ref esc-acs-2023 (as taught in cp-acs-thrombus)
- Uses table caption changed to 'Brilakis' (Oxford has no text on guide extensions)
- Entrapped burr: cut shaft, advance extension: brilakis p.364, Fig. 19.10 p.366; entrapped balloon: cut shaft, advance extension close, pull; Trapliner can trap simultaneously: p.478; non-deflating balloon: cut shaft, extension pushed against it, stiff wire or back end through extension to puncture: p.482
- KAM snare: wire loop trapped by inflated balloon at distal extension: brilakis p.532, p.592
- Reverse CART: brilakis p.394 (21.8.3); ref huang-guide-extension-reverse-cart-2017 (existing)
- Bifurcation atherectomy: extension over atherectomy wire only, isolating burr/crown from other wire: brilakis p.296
- Knuckle wire support: brilakis p.379 (20.8.2); EPD retrieval sheath through stents: p.344, p.348
- DOCA-TRI (randomised, transradial complex lesions with failed delivery, 5-in-6 vs buddy wire/balloon anchoring, technical success 97.9% vs 39.8%): brilakis p.409 (23.1.3.1.1); ref zhang-doca-tri-2012
- Duong indications 84.7/10.5/2.3/1/1%; RCA 50%; success 73.3%; complications 4 (4.8%) incl. 1 emergency CABG: ref duong-guide-extension-2015
- Check 2 (ostial: small extension, guide backed out): brilakis p.272–273
- Pearl numbers: p.528, p.536

## Lesson eq-sheaths-guides-extension-use

- Stop advancing if guide backs out or wire compromised: brilakis p.408 (23.1.1); coaxial withdrawal / never forceful withdrawal (taught in pm-prep-and-stent): brilakis p.465 (27.1.1)
- Changing guide after wire crossing may lose wire position: brilakis p.409
- Deep intubation alternative, usually 5 or 6 Fr guides: brilakis p.535 (30.3.3 #10); usually RCA or SVGs, rarely left; increases support but may cause dissection: p.175 (9.7.8.3.2.1.5); distal anchor needs two wires, at least 6 Fr guide, better 7 or 8 Fr; distal dissection requiring extensive stenting: p.175 (9.7.8.3.2.1.7)
- Same-size extension when more wires may pass; smaller in larger guide → wire outside cylinder: brilakis p.533 (30.3.3 #4); deliberate one-size-smaller pairing in bifurcation atherectomy: p.296 (16.1)
- Radial: stent deformation/stripping at collar around subclavian curve; consider 40 cm cylinder (no mechanism stated): brilakis p.409 (23.1.3.1.1 #4)
- Guidewire and guide position loss or distal vessel injury while advancing extension: brilakis p.409 (23.1.3.1.1 #1); complications table row added
- Push rod under towel at side of Y-connector to avoid wire wrap: brilakis p.532 (30.3.3 #1), p.172, p.465
- Collar should not be advanced outside the guide: brilakis p.533 (#5)
- Inchworming (2.0 mm balloon, 6–8 atm, advance on deflation); over balloon or microcatheter preferred to bare 0.014 in. wire (plaque edge, dissection); GBAT (nominal pressure, advance together); distal anchor; inchworming generally preferred (centres): brilakis p.532–533 (Fig. 30.28); leading balloon through tortuous vessel and previously stented segments: p.534 (Fig. 30.29)
- Minimise damping; if damped verify antegrade flow and no injury; avoid injection through deeply engaged extension; dissection antegrade or retrograde: brilakis p.536
- Fluoroscopy as stent enters proximal port if resistance; preload stent into extension outside the body: brilakis p.536; also p.466
- Resistance at entry of cylinder → remove and reinsert extension (wire wrap): brilakis p.172; p.465–466 (do not apply force)
- Deformation while withdrawing into tip; inspect withdrawn stent: brilakis p.536
- Hold push rod during forceful injection (ejection): brilakis p.537
- Deep advancement may cause coronary dissection: brilakis p.536
- Second wire: remove extensions/balloons/stents first; otherwise under fluoroscopy without force: brilakis p.153 (8.5.3.2), p.151 (8.4); microcatheter with wire withdrawn into it: p.533 (#4)
- Trapping difficult with standard extension (balloon proximal to collar; equipment retracted there); Trapliner preferred: brilakis p.533 (#6)
- Very flexible; tortuous lesions: brilakis p.534 (#7); mother-daughter-granddaughter (6 Fr through 8 Fr): p.534 (#8), Fig. 30.32 p.535
- Proximal-to-distal stenting via extension through proximal stent; distal-to-proximal preferred: brilakis p.534 (#9); longitudinal stent deformation upon forceful advancement through deployed stent: p.537 (#7)
- Hand-made side holes may prevent extension advancement and weaken guide: brilakis p.522
- IMA dissection/perforation with deep intubation and extensions: brilakis p.339
- Check 1 (damped → no injection; flow and integrity; hydraulic dissection forwards or into aorta): brilakis p.536, Fig. 30.35 p.537; wedged: p.409
- Complications table: deformation (p.536 #1–2), stent loss (p.465 27.1.1), dissection/acute closure (p.536 #3; Fig. 30.36 OM lesion, proximal circumflex dissection, acute closure, emergency CABG p.538), thrombus (p.536 #4), ejection (p.537 #5; Brilakis ref [28] title: left main bidirectional dissection caused by ejection, p.598), fracture (p.537 #6; Fig. 30.37 p.538: tip entrapment advancing into diagonal through LAD stent, shaft fracture on retrieval, balloon inflated in cylinder, retrieved), marker dislodgement (p.409 #3), ischaemia/haemodynamic compromise with deep seating and extensions (p.382)
- Fracture commonest reported problem for both devices; others: inability to pass equipment through or damage to devices, inability to advance the extension to the lesion, kinking (mostly partial or complete fracture on investigation), dissection; also perforation (2 per device), thrombus in catheter, 1 aortic dissection, 1 no-reflow; occasional deaths: ref chen-guide-extension-maude-2019 (abstract re-read round 1; round 2 completed the list)
- Marker row: dislodgement of distal marker (no location or treatment given): p.409 (23.1.3.1.1 #3); ischaemia row: no specific treatment given (p.382)
- Lesson sources: Oxford removed (no Oxford text on guide extensions)
- Waterbury: 363 cases, success 80.2%, deformation 2.2%, dissection 3.3%, declining: ref waterbury-guide-extension-2016
- Duong: 4.8%, 2 vessel injuries (1 emergency CABG), 2 equipment losses (marker detachment, sheared wire tip): ref duong-guide-extension-2015
- Check 2 (fracture retrieval): brilakis p.538 (Fig. 30.37)

## Lesson eq-sheaths-guides-length

- Most catheters 100 cm: brilakis p.519; oxford p.103
- 90 cm guides (commercially available from multiple manufacturers) for retrograde CTO PCI or very distal targets (native lesions through bypass grafts); most IM guides 90 cm for this reason; any guide can be shortened: brilakis p.519
- 125 cm guides for very tall patients or very tortuous aortas: brilakis p.519; balloons/stents may not reach; longest DES shafts 145, 144, 140 cm: p.106 (5.3.4), p.187
- Shortened guides: poor torque, disconnection: brilakis p.520
- Reach solutions: short guides, deep intubation, 300 cm wires, long-shaft balloons and stents: brilakis p.341 (18.8.1); short or shortened guides and longest shafts: p.174 (9.7.8.3.1), p.187 (10.2.8.3.1); guide extensions may allow safer deep intubation and better alignment: p.187
- IMA: shortened guides occasionally required for distal anastomotic lesion or native beyond: brilakis p.351 (18.10.3)
- Balloon shaft 90 cm (distal) and 100 cm (proximal) markers; first marker for 90 cm guides, second for 100 cm: brilakis p.171 (9.7.7.2), Fig. 9.4 p.173
- Proximal marker with 90 cm guide → device exits before marker reaches Y-connector: brilakis p.490 (28.2.2.3.2)
- Wire markers 90 and 100 cm; know guide length; torquer ~90 cm: brilakis p.152 (8.4)
- Short or shortened guides: balloon shaft markers cannot be relied on to prevent trapping balloon advancing into vessel: brilakis p.161 (8.9.2.1 step 3 caveat). Round 1: lesson, check explanation, keypoints, tip and q10 now say 'short or shortened' and limit the caveat to trapping balloons; 90 cm mark for delivery in 90 cm guides unchanged (p.171). Round 2: q10 distractor D now names balloon shaft markers (the 90 and 100 cm markers are on the balloon shaft, p.171 Fig. 9.4, and on some wires, p.152; not on the guide); q10 explanation says 'balloon shaft markers'
- 'Guide will not reach the root' table: causes very tall, severe subclavian or iliac/aortic tortuosity, distal radial access; prevention long sheaths (may shorten distance), stiff guidewire straightening aorta, longer (125 cm) catheters; solutions longer catheters (balloons/stents may not reach; longest DES shafts 145/144/140 cm), guide extensions, parallel sheath technique, change access site (femoral usually shorter): brilakis p.106 (5.3.4)
- Check 1: p.171, p.490, p.161
- Shortening rarely performed (long externalisation wires, 90 cm guides); still needed for retrograde via grafts or apical collaterals where microcatheters may not reach: brilakis p.519
- Technique cites Wu [9]: brilakis p.519, p.598; ref wu-retrograde-tips-2008
- Steps: engage, mark length outside femoral sheath; remove, cut marked segment with sterile scissors; sheath 1 Fr smaller (6 Fr for 7 Fr, 7 Fr for 8 Fr) cut to 3–4 cm; flare both ends with dilator of the guide's size; reconnect proximal and distal pieces; Tegaderm over the joint: brilakis p.519–520, Fig. 30.8 p.521 (image: "redundant length of guide catheter", "dilator 1 Fr larger than sheath")
- Check 2 (8 Fr guide → 7 Fr connector, 8 Fr dilator): brilakis p.520
- Sheath length and reach (Impella sheath): brilakis p.261 (causes: 45 cm sheath not fully advanced, 90 cm guides, tall or tortuous patients; reworded round 1 so a fully inserted 45 cm sheath is not implied to block reach)
- Pearl: synthesis of the above; no new facts
- Quiz items: q1 p.516–517 arithmetic; q2 p.515, p.517; q3 p.90, p.82, p.518, p.509, p.515; q4 p.103–104, p.61; q5 p.528, p.536; q6 p.533, p.535; q7 p.532–533; q8 p.537 (Fig. 30.35), p.536; q9 ref waterbury-guide-extension-2016; q10 p.519–521, p.161; q11 p.261, p.106 (extension among solutions), p.536 (injection risk)

## Cases

- Stuck stent case: AL1 for radial RCA PCI (brilakis p.522); stop when guide backs out (p.408); support around wire vs guide change (p.409); matched extension, wire outside smaller extension (p.533); 40 cm cylinder radial (p.409); push rod towel, collar (p.532–533); wire wrap at cylinder entry → remove and reinsert (p.172); inchworming 2.0 mm 6–8 atm vs bare wire vs GBAT (p.532–533); damped → no injection, flow and integrity (p.536); hydraulic dissection into aortic root (p.537); stop injecting, keep wire, stent the ostium protruding 1–2 mm into the aorta, IVUS, serial CT/TOE and blood pressure control for large dissections (p.440, 25.2.1.1; cm-principles-closure); c-mismatch reworded: smaller extension chosen for ease, second wire runs between cylinder and guide wall (p.533, Fig. 30.31); withdrawal into tip deforms stent, inspect (p.536); hold rod during forceful injection (p.537). Patient details synthetic.
- Reach case: indication: recurrent SVG failure → native CTO recanalisation at experienced centres (p.340, 18.7.2; p.389, 21.1); patent or even occluded grafts as retrograde pathways (p.392, 21.6); kink (c-kink) escalation p.119–120; s2 stem now states no kink on screening (p.109, p.117); complex PCI femoral 7–8 Fr 45 cm (p.61, p.390); long sheath once crossed, support and torque (p.515, p.100); 6 Fr limits CTO options (p.390); kink: untwist, wire through kink (p.119), long sheaths prevent kinking (p.109); 7 Fr guide in 8 Fr sheath, wire to stiffen (p.117); shortening for retrograde via grafts when microcatheter does not reach (p.519); connector one French smaller, 3–4 cm, flared, dressing (p.520); markers unreliable in shortened guide (p.161); guide extension reverse CART shortens retrograde wire distance (p.528, p.394); power injections avoided after proximal CTO dilation (p.440). The "125 cm guide makes the retrograde reach worse" feedback is reasoning from guide length (a longer retrograde guide adds length the retrograde equipment must travel), not a manual statement.

## Lab tips

- access-sheath-plan-size: p.515, p.90, p.507–508; oxford p.71
- access-sheath-ooze-upsize: p.81 (4.2.15.3); trigger narrowed to bleeding
- access-sheath-femoral-length-tip: p.516, p.77, p.103
- access-sheath-radial-long-caution: p.90, p.509, p.518, p.82, p.390
- access-sheath-sheathless-option: p.517–518, p.104 (planning trigger, no event)
- access-sheath-sheathless-spasm: p.106, p.509
- mcs-pump-sheath-guide-reach: p.261
- pci-gx-size-match: p.533, p.527, p.536, p.296
- pci-gx-engage-when-guide-cannot: p.527–528, p.118–119, p.532–533
- pci-gx-ostial-keep-guide-out: p.272–273; wedged-extension caveat p.409, p.536 (trigger now requires catheter-too-deep)
- pci-gx-thrombus-aspiration: p.528, p.382–383; ref total-2015, esc-acs-2023 (phase lesion-prep/stent)
- pci-gx-atherectomy-plan: p.362, p.296, p.368–369
- pci-gx-second-wire: p.153, p.533 (trigger stent-uncrossable)
- pci-gx-nested-extensions: p.534–535
- pci-gx-through-proximal-stent: p.534, p.537 (longitudinal deformation, direction not specified)
- pci-gx-radial-long-cylinder: p.409 (mechanism removed)
- pci-gx-fracture-retrieval: p.538
- pci-gx-retrieve-entrapped-device: p.364–366, p.478, p.482
- pci-guide-reach-distal-target: p.519, p.341, p.351, p.187
- pci-guide-short-markers: p.171, p.490, p.161 (short or shortened)
- pci-guide-shorten-by-hand: p.519–521; ref wu-retrograde-tips-2008
