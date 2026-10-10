# Evidence: cp-bifurcation-provisional (Bifurcations: assessment and provisional stenting)

Module file: `src/content/manual/complex-pci/02-bifurcation-provisional.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21). The brief gave "Oxford 'Bifurcation lesions' (p.231)"; in the PDF the section is on p.257–258 (printed 236–237) and "Bifurcation PCI techniques" on p.259–260 (printed 238–239). PDF p.231 is IVUS, which lists bifurcation lesions among IVUS indications.

## New references (checked on PubMed: authors, title, journal, year, volume, pages; abstracts read)

- pan-jailed-wire-2016: PMID 27659568, JACC Cardiovasc Interv 2016;9(18):1917–1924. Randomised; 115 polymer-coated vs 120 non-polymer-coated jailed wires; 2 mild damage vs 63 (55%) damaged (32% mild, 21% moderate, 2% severe); jailed length a factor; SB wiring time 19 vs 42 s. This is Brilakis's ref [6] on p.299.
- qin-active-sb-protection-2021: PMID 34789648, Int Heart J 2021;62(6):1241–1248. Meta-analysis, 5 studies (4 randomised, 1 observational), 1,174 patients; active SB protection (jailed balloon technique, balloon-stent kissing, jailed microcatheter) vs jailed wire; SB occlusion RR 0.47 (95% CI 0.30–0.73, fixed effect; 0.52 random effects); periprocedural MI RR 0.63 (NS); long-term MACE RR 0.48 (NS).
- wang-protective-ballooning-2022: PMID 35120269, Catheter Cardiovasc Interv 2022;99 Suppl 1:1418–1423. Randomised, single centre, non-left-main true bifurcations; 173 protective ballooning vs 167 jailed wire (340 total); SB occlusion 0.6% vs 5.4%; SB rewiring 0.6% vs 4.2%; periprocedural MI 1.73% vs 3.59% (NS); 12-month MACE similar.
- somendra-modified-jailed-balloon-2025: PMID 40021000, PMC12138095, Indian Heart J 2025;77(2):89–92. Describes the modified jailed balloon technique: semi-compliant balloon sized to the SB inflated simultaneously with the main-branch stent balloon during deployment, then POT, then recrossing the SB; 25 cases. Used only for the description of the technique.

## Existing references used (all in src/content/refs.ts, verified; abstracts re-read this session)

- koo-jailed-sb-ffr-2005: PMID 16098427, J Am Coll Cardiol 2005;46(4):633–637. 97 jailed SB lesions (vessel >2.0 mm, >50% visual stenosis), FFR successful in 94; no lesion with <75% stenosis had FFR <0.75; of 73 lesions ≥75%, only 20 functionally significant. Brilakis cites it (p.300 ref [8]).
- nordic-baltic3-2011: PMID 21173348, Circulation 2011;123(1):79–86. 477 patients, FKBD 238 vs no FKBD 239; 6-month MACE 2.1% vs 2.5% (P=1.00); 8-month SB (re)stenosis 7.9% vs 15.4% (P=0.039); true bifurcations 7.6% vs 20.0% (P=0.024); longer procedure and fluoroscopy times and more contrast with FKBD.
- october-2023: PMID 37634149, N Engl J Med 2023;389(16):1477–1487. 1,201 patients with complex bifurcation lesions; OCT 600 vs angiography 601; 2-year MACE 10.1% vs 14.1% (HR 0.70, 95% CI 0.50–0.98).
- medina-2006: the Medina classification (Brilakis ref [1], p.294).
- dkcrush5-2017: PMID 29096915, J Am Coll Cardiol 2017;70:2605–2617. 482 patients with true distal LM bifurcations (Medina 1,1,1 or 0,1,1); definite or probable stent thrombosis at 1 year 0.4% DK crush vs 3.3% provisional (abstract re-read).
- definition2-2020: PMID 32588060, Eur Heart J 2020;41:2523–2536. 653 patients with DEFINITION-criteria complex bifurcations; 1-year TLF 6.1% two-stent (77.8% DK crush) vs 11.4% provisional, HR 0.52 (abstract re-read).
- definition-2014: PMID 25326748, JACC Cardiovasc Interv 2014;7(11):1266–1276 (abstract re-read; it establishes the complexity criteria). The criteria themselves (major: SB stenosis ≥70% in LM or ≥90% elsewhere with SB lesion length ≥10 mm; complex = 1 major + ≥2 minor) are cited as already taught in Academy lesson cx-bif-two-stent (pci-complex.ts lines 213–222), which cites definition-2014.
- esc-ccs-2024: recommends IVUS or OCT guidance for anatomically complex lesions including true bifurcations, as already taught in physiology-imaging.ts (lines 1270, 1640) and pci-core.ts (line 2597). Class and level are not quoted because they could not be checked against the guideline table in this session.
- esc-acs-2023: radial access recommended in ACS, as taught in acute-mcs.ts line 169 and diagnostic.ts line 397. (Fixer round 3: the unsupported 'default in UK and ESC practice' for elective PCI was removed.)

## New reference added in round 1

- giustino-complex-pci-dapt-2016: PMID 27595509, J Am Coll Cardiol 2016;68(17):1851–1864. Checked on PubMed (authors Giustino, Chieffo, Palmerini et al.; title; journal; year; volume; pages). Pooled patient-level data from 6 RCTs, 9,577 patients; complex PCI = ≥1 of 3 vessels treated, ≥3 stents, ≥3 lesions, bifurcation with 2 stents, total stent length >60 mm, CTO; long-term DAPT reduced MACE in complex PCI (adjusted HR 0.56) but not in non-complex PCI (HR 1.01).

## Notes for checkers

- Extract garbles confirmed on the page images (p.293–305 read as images): "branches ,2 mm" = <2 mm (p.293); "TIMI flow , 3, diameter stenosis . 70%" = TIMI flow <3, diameter stenosis >70% (p.294); "70 90" = 70°–90°, ",70" = <70° (p.294); "$6 mm" = ≥6 mm and "810 mm" = 8–10 mm (p.298–299); "(1.01.5 mm)" = 1.0–1.5 mm (p.303); "1012 atm" = 10–12 atm (p.305); "(12 mm)" protrusion in TAP = 1–2 mm (p.306, figure label "1–2 mm"); DK crush "23 mm" = 2–3 mm (p.312, figure label); "1214 atm" = 12–14 atm (p.317); p.218 "FFR # 0.80" = ≤0.80, "$ 2 mm" = ≥2 mm, "FFR . 0.80" = >0.80.
- Brilakis is internally inconsistent on microcatheter protection of the second wire during atherectomy: 16.2.9 (p.296) lists it as an option needing an 8 Fr guide; 19.9.6 (p.370) says it "should be avoided". The lesson gives both.
- Brilakis's algorithm figure (p.293) gives TAP (70–90°) and reverse crush or culotte (<70°) as bail-outs after failed provisional; the text of step 4c (p.303) also lists T-stenting. The lesson gives the figure's version in lesson 1 and the text's in lesson 5.
- Disagreements taught explicitly: (1) TAP angle: Brilakis p.294 (T or TAP for 70–90°) vs Oxford p.259 (T when angle approaches 90°, TAP when <90°). (2) SB preparation in provisional stenting: Brilakis p.296–297 (avoid) vs Oxford p.259 (provisional includes no intervention or balloon dilatation, typically kissing, of the SB ostium) and Oxford Fig. 8.20 p.258 (main then side-branch dilatation before the single LAD stent). (3) Routine kissing: Brilakis p.302 ("not always necessary"), p.332 (no clear benefit of routine kissing after provisional LM) vs Oxford p.258 (final kiss advisable regardless of technique; improves outcomes); Oxford p.260 DES box (SB manipulation after DES unnecessary unless it occludes) is internally at odds with p.258; Nordic-Baltic III data added.
- Jailed balloon techniques: neither manual describes them; taught only from the PubMed-checked references above, framed as "neither manual teaches it" with the evidence limited to SB occlusion.
- Named products omitted per authoring rule 7: Finecross, TwinPass, Sasuke, Venture, Swift NINJA, Supercross, Sapphire Pro, Glider, StentBoost, CLEARstent are replaced by generic classes ("small microcatheter", "dual-lumen microcatheter", "angulated microcatheter", "very small balloons, down to 1.0 mm", "low-profile balloons with a skived tip", "enhanced stent visualisation"). Guide names AL, EBU, XB kept as curve names.
- Things deliberately sent to other modules: two-stent technique steps (T, TAP, reverse crush, DK crush, culotte, V, SKS) to cp-bifurcation-two-stent; left main specifics to cp-left-main; branch ostial lesions (Medina 0,0,1 and 0,1,0) to cp-ostial; atherectomy to cp-calcium; hairpin wire, deflection balloon and wire organisation to pm-wiring; FFR technique to pm-physiology; imaging criteria to pm-imaging; wire fracture management to cm-equipment-loss.
- Worked numbers are arithmetic from Brilakis's formula (p.302): 0.678 × (2.75 + 2.5) = 3.56; 0.678 × (3.5 + 3.0) = 4.41; 0.678 × (3.0 + 3.0) = 4.07; 0.678 × (3.5 + 2.5) = 4.07; 0.678 × (3.0 + 2.5) = 3.73; 0.678 × (3.75 + 2.5) = 4.24; 0.678 × (2.5 + 2.0) = 3.05.

## Possible errors in existing Academy lessons (src/content/tracks/pci-complex.ts, module cx-bifurcation), for the fixer

1. `cx-bif-two-stent`, DK-crush step "Stent the SB with an MV balloon in place": protrusion given as "1–2 mm". Brilakis p.312 (step 2, Fig. 16.42) gives **2–3 mm** for DK crush; 1–2 mm is the TAP protrusion (p.306) and V-stenting (p.322). The same "1–2 mm" appears in quiz item `cx-q-bif-crush-wire`.
2. `cx-bif-provisional` POT step, the pitfall list and quiz `cx-q-bif-pot`: POT distal marker "just proximal to the carina". Brilakis p.300 puts the POT balloon's distal marker **at** the carina (DK crush POT p.316: "distal edge at the bifurcation carina"); "just proximal to the neocarina" is his wording only for the final POT after TAP (p.307). Either cite a source for "just proximal" or align with Brilakis.
3. `cx-bif-assessment` first paragraph: "Roughly one PCI in five involves a bifurcation" has no source in either manual; Oxford p.257 says up to 15% of PCI target lesions.
4. `cx-bif-provisional` step "Wire both branches": "Wire the harder branch first" and step "Deploy across the SB": "avoid very high deployment pressure over it" are not in either manual (Brilakis p.191 lists concern about a large jailed branch as a reason to forgo high-pressure post-dilatation, which is close but not the same). Source should be checked.
5. `cx-bif-provisional` pitfall "Many operators prefer not to jail polymer-jacketed wires": Brilakis p.299 presents the controversy but reports randomised data (Pan 2016) in which polymer-coated jailed wires were damaged far less often (2 of 115) than non-polymer-coated ones (55%). The pitfall should present both sides.
6. `cx-bif-assessment` vocabulary table: "True bifurcation (Medina 1,1,1; 1,0,1; 0,1,1)". Brilakis p.332 gives "true (Medina 1.1.1. or Medina 0.1.1.)" as examples; 1,0,1 is commonly included elsewhere but not by Brilakis. Minor; consider citing the EBC source for the three-pattern definition.

## Lesson cp-bifurcation-provisional-assess

- EBC definition of a bifurcation lesion (narrowing adjacent to and/or involving the origin of a significant SB): brilakis p.132 (6.8.2.7)
- Up to 15% of PCI target lesions; harder because of SB compromise/occlusion and the variety of strategies: oxford p.257
- Medina: PMV, DMV, SB order; 1 = ≥50% diameter stenosis, 0 = <50%: brilakis p.294 (Fig. 16.2); Oxford x,y,z with 0 = none, 1 = present: oxford p.257 (Fig. 8.19); ref medina-2006
- Seven patterns 1,1,1; 1,1,0; 1,0,1; 0,1,1; 1,0,0; 0,1,0; 0,0,1: brilakis p.294; oxford p.257
- 1,1,1 and 0,1,1 called true bifurcations; DK crush preferred for true LM bifurcations; provisional for LM bifurcations without significant SB involvement: brilakis p.332 (17.10). DKCRUSH-V enrolled LM bifurcations with Medina 1,1,1 or 0,1,1: ref dkcrush5-2017. Neither manual defines 'true bifurcation'; Brilakis p.332 gives 1,1,1 and 0,1,1 as examples; 1,0,1 attributed to Academy cx-bif-assessment (pci-complex.ts line 51). 'Shared feature: ≥50% stenosis in MV and SB ostium together' follows from the Medina definition (brilakis p.294 Fig. 16.2). Keypoint 2 now attributes the patterns the same way (fixer round 1)
- 0,1,1 → V-stenting option: brilakis p.293–294 (Fig. 16.1, 16.1.5)
- 0,1,0 and 0,0,1 = branch ostial lesions: brilakis p.287 (15.2); cx-bif-assessment handles 1,0,0 or 0,1,0 with provisional stenting (pci-complex.ts line 79), cross-referenced
- 1,1,0 and 1,0,0 rows: no SB ostial stenosis of 50% or more (0 = <50% diameter stenosis, brilakis p.294 Fig. 16.2), lesser disease possible; Oxford "SB occlusion rare when pretreatment ostial stenosis <50%": oxford p.257; plaque and carina shift as causes of SB occlusion: brilakis p.192 (10.2.13.3.4)
- 1,0,1 row: severity of SB disease drives occlusion risk: brilakis p.294 (16.1.2)
- ACC/AHA: bifurcation with protected SB = type B, unprotected SB = type C: oxford p.212 (Table 8.2); unprotected bifurcation a multivariate predictor of failure: oxford p.211; bifurcations among lesion characteristics making PCI complex: oxford p.246
- Estimating stenosis at or beyond major side branches challenging (uncertain diameter change): brilakis p.129 (6.8.2.2)
- Angiography in angulations separating MV and SB, to facilitate wiring, stent placement and crush: brilakis p.295 (16.2.6)
- At least two projections, preferably orthogonal; avoid foreshortening and overlap with other vessels/side branches: oxford p.175
- LM bifurcation views RAO caudal, AP caudal, LAO caudal (spider): brilakis p.331 (17.6)
- Check 1 (fixer round 3, replaced because it repeated Academy quiz cx-q-bif-medina): LM normal, LAD ostium 70%, circumflex ostium 40% → Medina 0,1,0 (1 = ≥50%, 0 = <50%: brilakis p.294 Fig. 16.2); branch ostial lesions are Medina 0,0,1 or 0,1,0: brilakis p.287 (15.2); IVUS shows disease rarely isolated to the LAD or circumflex ostium, extending into the distal LM in more than 90% and 80%: ref johnson-eapci-lm-imaging-2026 (full text, LM stent selection section)
- Step 1: SB preservation depends on size and territory; branches <2 mm usually need not be preserved; if no → PCI of MV: brilakis p.293 (16.1.1, Fig. 16.1). (the 2.5 mm clause from cx-bif-assessment was deleted in fixer round 1: no manual or verified source)
- Oxford: calibre <2.0 mm rarely considered for treatment; decision to protect (by balloon or wiring) depends on calibre, distribution and ostial involvement: oxford p.257
- Step 2 Oxford addition: crush mandates two stents, used when a reasonably sized SB is severely compromised and likely to worsen with MV intervention; provisional converted to two stents typically for severe stenosis or impaired SB flow from plaque or carina shift; commonest bail-outs T, TAP, culotte: oxford p.259
- 'Beyond the manuals' step: DEFINITION criteria and DEFINITION II (653 patients, TLF 6.1% vs 11.4%, 77.8% DK crush): refs definition-2014, definition2-2020 (see above)
- Step 2: likelihood of SB occlusion: location (Medina), SB severity, morphology (calcification, thrombus, length; imaging helps), angulation (extreme angles hard to wire): brilakis p.294 (16.1.2); low → provisional, high → planned two-stent: brilakis p.293 (Fig. 16.1)
- Step 3: provisional: wire SB, crossover stent, SB compromised? no → stop; yes → balloon angioplasty; success → stop; failure → angle: 70–90° TAP; <70° reverse crush, culotte: brilakis p.293 (Fig. 16.1); balloon angioplasty often suffices: brilakis p.294 (16.1.3)
- SKS only for emergency or bail-out; advantage speed with wire access kept in MV and SB; disadvantage long neocarina: brilakis p.322 (16.2.10.8)
- Step 4: planned two-stent: Medina 0,1,1 → V-stenting; emergency → SKS; else angle 70–90° T-stent, <70° DK crush, culotte: brilakis p.293 (Fig. 16.1); DK crush preferred in most cases: brilakis p.294 (16.1.4); SKS long neocarina, very challenging subsequent treatment, not for non-emergent PCI: brilakis p.295 (16.1.6)
- Table (round 2: column header changed from 'Brilakis 16.1' to 'Brilakis 16.1–16.2'; angle rows come from 16.1.4 p.294 and Fig. 16.1 p.293; each 'Default strategy' point now carries its section): provisional preferred and easiest: brilakis p.297 (16.2.10.1); EBC TWO, provisional and culotte similar outcomes in complex bifurcations with large stenosed SBs: brilakis p.317 (16.2.10.6); T and TAP easier and faster than DK crush or culotte: brilakis p.304 (16.2.10.2). Keypoint 6 adds reverse crush for <70°: brilakis p.294 (16.1.4); reverse crush as bail-out: p.293 Fig. 16.1, p.308
- Table: Oxford T-stenting when angle approaches 90°, TAP when <90°: oxford p.259; provisional preferred and easiest for most lesions if feasible without significant risk to a significant SB: brilakis p.297; little evidence any approach superior to provisional T: oxford p.257; Fig. 8.21 caption "recent data suggest that the 'provisional stent' technique produces the best results": oxford p.260
- Angle paragraph (round 1: the unsourced 'principle' removed): T-stenting lands the proximal edge at the SB ostium, TAP slightly protrudes: oxford p.259; T and TAP best for angles close to 90°, especially when MV is large relative to SB: brilakis p.304 (16.2.10.2); SB stent should protrude slightly into MV, shorter protrusion may leave ostium poorly covered: brilakis p.305
- Check 2 (3.0 mm diagonal, 40% ostium): brilakis p.293–294; oxford p.257 (<50% rule); SKS emergencies only p.295, p.322; SB may be left unwired if no significant disease: brilakis p.296; provisional wires the SB if important and at risk: brilakis p.293 Fig. 16.1, p.297
- Unclear SB ostial severity → haemodynamic assessment or intravascular imaging: brilakis p.297 (16.2.10.1 Background)
- Physiology three roles: brilakis p.325 (16.2.12) (paraphrased in round 1)
- Imaging four roles (diameter and length of MV/SB lesions, calcification, stent expansion, cause of complications such as substent wiring): brilakis p.325 (16.2.13)
- Enhanced stent visualisation confirms SB ostium coverage and stent deformation: brilakis p.326
- Pitfall SKS: brilakis p.295
- Pearl: synthesis of 16.1.1–16.1.2 and p.297 advice to use physiology/imaging when unclear; no new facts
- Keypoints: as above

## Lesson cp-bifurcation-provisional-setup

- Goal: deploy a stent in the MV without compromising the SB: brilakis p.297
- Anticoagulation similar to standard PCI; consider prolonged DAPT at low bleeding risk because bifurcation stenting associated with increased stent thrombosis: brilakis p.295 (16.2.3)
- Complex PCI counts a bifurcation only with 2 stents; long DAPT reduced MACE only in complex PCI: ref giustino-complex-pci-dapt-2016
- Oxford: restenosis high with much metal; DES may reduce restenosis but may increase stent thrombosis risk by more than 5% when more than one DES deployed: oxford p.260. Contemporary rate: DKCRUSH-V definite or probable ST at 1 year 0.4% vs 3.3%: ref dkcrush5-2017
- Access: radial or femoral both acceptable, femoral may give optimal support in highly complex cases: brilakis p.295 (16.2.4); ESC 2023 ACS guideline recommends radial: ref esc-acs-2023; the 'UK and ESC default' claim was removed (fixer round 3); 7–8 Fr requirements: brilakis p.295, p.296
- Haemodynamic support depends on patient and procedural factors; complex LM bifurcation PCI with depressed LV function, especially with occluded or severely diseased RCA: brilakis p.327 (16.2.14)
- Radial or femoral acceptable by anatomy, complexity and experience; femoral may provide optimal support in highly complex cases: brilakis p.295 (16.2.4)
- Supportive guides: AL for RCA, EBU or XB for left main: brilakis p.295 (16.2.5)
- Most techniques through 6 Fr; V-stenting and SKS need at least 7 Fr; larger guides ease two devices (especially previously used balloons), more support, easier troubleshooting: brilakis p.295 (16.2.1, 16.2.5)
- Oxford: most 6 F guides accommodate two balloon catheters for kissing: oxford p.258
- Wire both MV and SB in most cases unless SB too small or no significant disease; workhorse wires for both: brilakis p.296 (16.2.8)
- Provisional: wire both if SB important and at risk of occlusion: brilakis p.297
- Wire organisation (towel, colours, bent back end, torquer): brilakis p.154–155 (8.6.2.10)
- Difficult SB wiring A/B/C options: brilakis p.296 (16.2.8); MV modification carries risk of SB occlusion: brilakis p.296
- Dual-lumen microcatheter: wire angulated vessel through the over-the-wire lumen: brilakis p.155 (8.6.3.3); monorail lumen over the first wire, new wire through OTW lumen: brilakis p.153, p.558
- Hairpin, deflection balloon (taught in pm-wiring): brilakis p.155–158
- Monitor distal position of both wires (distal migration may perforate); replace polymer-jacketed wires with workhorse before lesion prep and stenting: brilakis p.296
- Check 1: polymer-jacketed wire exchange rule: brilakis p.296; microcatheter allows guidewire exchanges without rewiring: brilakis p.155 (8.6.3.3 solution 2)
- MV preparation in all cases (facilitates sizing, delivery, expansion); SB preparation generally avoided in provisional (may cause SB dissection necessitating stenting); SB and MV routinely prepared when two-stent techniques planned; imaging for size and length and need for atherectomy: brilakis p.296 (16.2.9); repeated p.297
- Oxford provisional crossover: predilation and stenting of MV with either no intervention or balloon dilatation (typically kissing) of the SB ostium: oxford p.259; Fig. 8.20 main then side-branch dilation, single LAD stent, kissing after wire exchange: oxford p.258; protecting the SB 'by either balloon prior to dilation or simply wiring the vessel': oxford p.257
- Brilakis chapter 10 SB occlusion prevention list: wire important SBs; balloon or stent SB before stenting the main branch; POT proximal to the carina; causes jailing and plaque/carina shift: brilakis p.192 (10.2.13.3.4)
- Atherectomy: only one guidewire in the treated artery; other wire traditionally removed to prevent wire fracture; dissection of non-wired vessel makes rewiring challenging: brilakis p.296
- Guide extension over the atherectomy wire for lesions at proximal SB or distal MV; 7 Fr guide + 6 Fr extension for 1.25 mm rotational burr or 1.25 mm orbital crown; 8 Fr + 7 Fr for 1.5 mm burr: brilakis p.296
- Microcatheter over the non-atherectomy wire, smaller microcatheter to minimise damage, move slowly during the runs when several runs are done; requires 8 Fr: brilakis p.296; Fig. 16.3 perforated small microcatheter during orbital atherectomy: brilakis p.297; "should be avoided" (risk of microcatheter and wire damage and embolisation): brilakis p.370 (19.9.6)
- Leave SB wire accepting low risk of damage; laser atherectomy: brilakis p.296
- MV stent diameter = distal MV; must be expandable to proximal MV with POT; know post-dilatation limits (Fig. 10.1): brilakis p.298 (step 1)
- Proximal sizing → SB occlusion (carina shift) and distal MV dissection/perforation: brilakis p.298 (Fig. 16.6); chapter 10 rule for tapering vessels: brilakis p.186 (10.2.3.2.2)
- LM: stents from LM into LAD or LCx must expand to LM diameter: brilakis p.332 (17.10)
- MV stent length enough for POT balloon (≥6 mm if 6 mm balloons available): brilakis p.298; shortest balloon 6 mm; at least 6 mm, ideally 8–10 mm of stent proximal to carina: brilakis p.299 (step 3)
- Deliver MV stent across bifurcation with SB wire in place: brilakis p.298 (Fig. 16.5), p.299 (step 2)
- Check 2 (3.0 vs 3.5 mm, 4 mm proximal too short): brilakis p.298–299
- Pitfalls: guide too small for plan (p.295), SB ballooning (p.296), polymer-jacketed wire (p.296), proximal sizing (p.298), no room for POT (p.299)
- Pearl: plan stent length from POT backwards: brilakis p.299–300 (POT balloon length and distal marker at carina)
- Drill and bench tasks restate the sizing rules above

## Lesson cp-bifurcation-provisional-jailed

- Step 2 deploy MV stent jailing SB wire; jailing recommended in any bifurcation stenting when SB must be preserved: brilakis p.299
- Four reasons (keeps SB open and marks it; favourably alters angle for recrossing; anchoring for guide seating and support; low-profile balloon or torquable microcatheter over jailed wire to rescue SB in extreme situations): brilakis p.299
- Check 1 (occluded SB: marker and rescue route): brilakis p.299, p.303 (4c "No")
- Before jailing, partially withdraw SB wire so radio-opaque portion closer to carina; do not jail across the radio-opaque portion (fracture risk): brilakis p.299
- Straight tip before jailing (looped tip entangles with stent); avoid jailing long segments: brilakis p.302
- Jailed length a factor in wire damage: brilakis p.299; ref pan-jailed-wire-2016
- Exceptions to high-pressure post-dilatation include concern about compromising a large jailed branch: brilakis p.191 (10.2)
- Wire types that can be jailed; controversy over polymer stripping and embolisation; 2 of 115 polymer-coated mildly damaged vs 55% (63 of 120) non-polymer-coated, two with internal fracturing; faster SB wiring with polymer-coated; polymer embolisation in 10% of autopsied hearts (not jailing): brilakis p.299; ref pan-jailed-wire-2016 (randomised design)
- Round 1: the paragraph after the table now states only that the trial assessed wire damage, not embolisation, that the autopsy finding was from another setting, and that Brilakis draws no conclusion (p.299). Pan 2016 count given as 63 of 120 'reported as 55%' (63/120 = 52.5%; the abstract and Brilakis both print 55%)
- Some advocate not jailing; risk of SB occlusion exceeds risk of entrapment in most cases: brilakis p.472 (27.2.2.1)
- Jailed balloon techniques not in either manual (searched both extracts for "jailed balloon": absent); modified JBT description: ref somendra-modified-jailed-balloon-2025; the meta-analysis pooled jailed balloon, balloon-stent kissing and jailed microcatheter strategies as 'active' protection: ref qin-active-sb-protection-2021; randomised trial 340 patients, SB occlusion 0.6% vs 5.4%, MACE similar at 12 months: ref wang-protective-ballooning-2022; meta-analysis 5 studies, 1,174 patients, SB occlusion RR 0.47 fixed effect, no reduction in PMI or long-term MACE: ref qin-active-sb-protection-2021
- Jailed wire removed after SB rewiring: brilakis p.301 (4b step 2); in occluded SB only after a low-profile balloon advanced into the SB: brilakis p.302 (4c)
- Removal: do not pull hard, gentle constant traction; hard pulling → fracture/unravelling, possibly emergency surgery, and deep guide intubation → guide-induced dissection: brilakis p.301
- Small balloon or microcatheter to the area of entrapment then gently withdraw: brilakis p.301; focuses withdrawal force; guide extension could also be used: brilakis p.472 (27.2.3.1.2)
- Small balloon advanced distally and inflated, then repeat POT: brilakis p.302
- Rotation with a torquer: brilakis p.302
- Second wire + balloon; surgery; last-straw hard pull with balloon or microcatheter in place hoping for fracture without unravelling; IVUS to confirm no unravelling after fracture: brilakis p.472–473 (27.2.3)
- Check 2: brilakis p.301
- Pearl: the three preparation points against fracture (radio-opaque segment, p.299), entanglement on withdrawal (looped tip, p.302) and wire damage (jailed length, p.299, p.302); no claim about how many entrapments they prevent

## Lesson cp-bifurcation-provisional-pot

- Step 3 POT; Oxford: POT and final kissing strongly recommended (T and TAP): oxford p.259
- POT in provisional (p.299–300), TAP final POT (p.307), reverse crush (p.308), DK crush (p.316, p.317), culotte (p.318): brilakis
- Distal-sized stent then POT to proximal MV; normal tapering: brilakis p.186, p.298
- POT goal: optimise MV stent deployment proximal to carina, especially with significant diameter discrepancy; increases strut diameter facilitating distal wire crossing: brilakis p.299 (Fig. 16.8 caption)
- DK crush: POT ensures good expansion and apposition and that the wire back into the SB does not advance underneath the MV stent: brilakis p.316 (step 13)
- In provisional, POT (step 3) precedes SB assessment and rewiring (step 4): brilakis p.299–300
- Full chapter 10 prevention list (wire important SBs; balloon or stent SB before MV; POT proximal to carina) and causes (jailing; plaque and carina shift): brilakis p.192 (10.2.13.3.4)
- Keypoint: POT increases strut diameter facilitating distal wire crossing (provisional): brilakis p.299 Fig. 16.8; 'wire not underneath the MV stent' attributed to DK crush only: brilakis p.316
- POT balloon diameter = proximal MV: brilakis p.299
- Oversized POT balloon (and oversized MV stent, significant SB ostial disease) increases likelihood of SB compromise: brilakis p.300
- Length equal or shorter than MV stent proximal to carina; shorter → multiple inflations repositioning; longer → injures MV proximal to stent, increasing restenosis: brilakis p.299–300
- Distal marker at the carina; too distal → SB compromise; too proximal → no optimal expansion next to SB ostium: brilakis p.300. cx-bif-provisional's 'just proximal to the carina' acknowledged (pci-complex.ts line 138)
- Post-dilatation with a shorter non-compliant balloon: brilakis p.191 (10.2)
- Check 1 (3.5 × 8 mm, marker at carina): brilakis p.299–300. Round 1: the 15 mm distractor explained as too distal (half the balloon in the distal MV, SB compromise, p.300) and longer than the 9 mm proximal segment (p.299); the earlier claim that its proximal end injures unstented vessel was wrong (7.5 mm proximal to the carina stays inside 9 mm of stent) and is removed
- Table of POT errors: brilakis p.299–300
- Final POT may not be necessary depending on kissing result, but should be considered to correct oval deformation: brilakis p.302
- Repeat POT after freeing a jailed wire with an inflated balloon: brilakis p.302
- TAP final POT: distal marker just proximal to the neocarina to avoid crushing protruding struts: brilakis p.307
- LM stents must expand to LM diameter: brilakis p.332
- Check 2 (final POT corrects ovalisation): brilakis p.302
- Pearl: jailed wire marks the SB position (p.299); angiography in angulations separating MV and SB to facilitate stent placement (p.295)

## Lesson cp-bifurcation-provisional-sb

- Step 4 flow chart (4a SB OK → done; 4b compromised not occluded → rewire, remove jailed wire, kiss, POT, good result? else SB stenting; 4c occluded → rewiring feasible? yes → as 4b; no → balloon over jailed wire, option 1/2): brilakis p.300 (Fig. 16.9)
- Compromise criteria for an important SB: TIMI flow <3, diameter stenosis >70%, NHLBI dissection B or more: brilakis p.294 (16.1.3)
- Assessment: antegrade flow; visual stenosis frequently overestimates; physiology (in non-culprit lesions for ACS); IVUS/OCT for ostial SB stenosis: brilakis p.300
- FFR ≤0.80 → further treatment (if vessel ≥2 mm); >0.80 → no further treatment; IC nitroglycerin may reverse spasm: brilakis p.218 (12.1)
- Koo 2005 figures: ref koo-jailed-sb-ffr-2005 (abstract re-read: 97 lesions; FFR measured with a pressure wire 5 mm distal and proximal to the jailed ostial lesion; no lesion <75% had FFR <0.75; 20 of 73 ≥75% functionally significant); the note that the study reported against 0.75 while Brilakis's treatment threshold is 0.80 follows from the abstract and p.218
- Pressure wire into the SB passes through the MV stent struts (the jailed wire lies outside the stent: p.299 step 2; Koo measured with a pressure wire in the SB); keeping the jailed wire until the decision follows Brilakis's rule that the jailed wire comes out only after the SB has been rewired (p.301, 4b step 2)
- Significant SB ostial disease, oversized MV stent or oversized POT balloon increase SB compromise: brilakis p.300
- Chapter 25 SB occlusion after stenting: causes ostial disease, dissection, large plaque burden; diagnosis angiography and ECG changes; treatment rewire, balloon angioplasty including kissing, stenting: brilakis p.437 (Table, row 4); p.444 (25.2.4 refers to 16.2.10.1)
- Check 1 (75% ostium, TIMI 3 → FFR): brilakis p.218, p.300; ref koo-jailed-sb-ffr-2005; 75% meets the >70% compromise definition: brilakis p.294; next step rewire and kiss (4b): p.300–302; kissing defensible on Oxford p.258 (now consistent with case s6 'acceptable')
- 4a: procedure done: brilakis p.300
- 4b step 1: rewire through a distal strut; better scaffolding (Fig. 16.11); proximal recrossing pushes struts inward toward the MV lumen: brilakis p.300–301
- New wire usually; some use the MV wire to avoid substent wiring with a new wire; some advance the rewiring wire through a microcatheter then advance the microcatheter into the SB: brilakis p.300
- Distal strut technique (pass distal, point to SB, pull back until tip drops, advance); OCT confirmation: brilakis p.301
- Jailed wire removed: brilakis p.301
- Kissing: not always necessary; optimises stent geometry and SB ostium coverage, facilitates future SB access; usually non-compliant short balloons (harder to deliver); compliant possible, minimise high-pressure inflations: brilakis p.302
- Finet's law: effective diameter = 0.678 × (balloon 1 + balloon 2); should be similar to proximal MV: brilakis p.302. Round 1 reconciliation with cx-bif-provisional (balloons sized to each distal branch, pci-complex.ts line 141): start from branch-sized balloons, check with the formula, downsize the MV balloon if the effective diameter clearly exceeds the proximal MV (application of p.302; arithmetic 3.0 + 2.5 = 3.73 mm). Round 2: 'keep the proximal overlap short' removed from the formula note; neither manual gives it and no verified reference was found
- POT–side–POT (fixer round 1 rewrite): not in either manual (Brilakis p.302 kissing only; Oxford p.258–259 kissing and POT); named as taught in Academy cx-bif-provisional (pci-complex.ts line 141); described from ref andreasen-final-pot-2020 (bench study: provisional with kissing vs POT-side-POT vs culotte; final POT across the SB takeoff reduced the opened SB cell area, most after POT-side-POT with proximal wiring; POT proximal to the takeoff caused limited or no reduction). The unsourced rationale 'avoids two balloons distorting the proximal stent' was removed
- Final POT may not be necessary after a good kiss but should be considered: brilakis p.302; culotte final POT optional: brilakis p.319. Round 1 removed 'always follow the kiss with POT' everywhere
- SB stent if still suboptimal (TAP, reverse crush, culotte): brilakis p.302; Oxford: commonest bail-outs T, TAP, culotte: oxford p.259
- Check 2 (Finet pairs): arithmetic from brilakis p.302
- 4c yes: rewire distal strut; remove jailed wire after a low-profile balloon advanced into the SB (confirms through, not underneath, the MV stent); kiss; final POT; SB stent options T-stenting, TAP, reverse crush, culotte: brilakis p.302–303
- 4c no: 1.0–1.5 mm balloon over jailed wire partially into SB; torquable microcatheter spun in if balloon will not cross; balloon angioplasty restores antegrade flow; option 1 rewire through MV stent ideally with dual-lumen microcatheter (avoid wire behind "lifted" struts), remove jailed wire, kiss, final POT, SB stent if suboptimal: brilakis p.303 (Figs 16.15–16.20); option 2 inverted DK crush (SB acts as MV, MV as SB): brilakis p.304
- "This dilates the branch outside the MV stent": the balloon runs over the jailed wire, which lies between the stent and the vessel wall (p.299, step 2; Fig. 16.15–16.16 p.303)
- Kit: small balloons important for jailed SBs; 1.0 mm the lowest profile balloon in the United States, 0.85 mm in Europe: brilakis p.569 (30.9.2); semicompliant balloon with skived tip and low entry profile suited to crossing stent struts and ballooning jailed SBs: brilakis p.570; microcatheters can be used after rewiring an SB through stent struts: brilakis p.542; dual-lumen microcatheter uses including wiring side branches and a second wire: brilakis p.558–559 (Fig. 30.71)
- Enhanced stent visualisation: brilakis p.326
- Kissing disagreement table: brilakis p.302, p.332; oxford p.258, p.260 (Oxford rows paraphrased in round 1); ref nordic-baltic3-2011 (SB restenosis in the 326-patient angiographic subset; 'long-term data on stent thrombosis are needed', abstract)
- Check 3 (low-profile balloon before pulling jailed wire): brilakis p.302
- Pitfalls: p.218, p.300–303
- Pearl: technique p.301 (pull back until the tip drops); OCT confirmation p.301
- Imaging: p.325; OCTOBER (1,201 patients, 10.1% vs 14.1%, HR 0.70): ref october-2023; ESC 2024 CCS recommendation for imaging in anatomically complex lesions including true bifurcations: ref esc-ccs-2024 (see above)
- Physiology sim: p.218 (IC nitroglycerin, 0.80, 2 mm)

## Quiz

- q1: brilakis p.293–294 (16.1.1, 16.1.2, Fig. 16.1); SB lesion length ≥10 mm as a DEFINITION criterion: ref definition-2014 via cx-bif-two-stent
- q2: brilakis p.294 (16.1.3), p.300 (visual overestimation)
- q3: brilakis p.299–300
- q4: brilakis p.300–301 (Fig. 16.11); POT facilitates distal crossing p.299
- q5: brilakis p.302 (arithmetic as listed above)
- q6: brilakis p.303–304; TAP starting point p.305 (TAP preparation: MV stented, SB rewired, kissing and repeat POT); TAP 'no rewiring of the SB is required' advantage: p.305
- q7: brilakis p.303 (dual-lumen microcatheter to avoid wire advancement behind lifted struts); wire under the stent identified by imaging p.325
- q8: brilakis p.301–302; last-straw option p.473
- q9: ref nordic-baltic3-2011 (option D now names the trial); brilakis p.302, p.332; oxford p.258
- q10: brilakis p.296; microcatheter option 8 Fr p.296; microcatheter and wire damage, embolisation, 'should be avoided': p.370 (19.9.6)
- q11: brilakis p.293–295 (Fig. 16.1, 16.1.5, 16.1.6, 16.2.1), p.322 (at least 7 Fr for two DES), p.287 (branch ostial lesions)

## Cases

### cp-bifurcation-provisional-case-lad-diagonal (synthetic)
- s1 strategy: brilakis p.293–295, p.297; oxford p.257; unwired option penalty reduced to −5 with the p.296 caveat (SB without significant disease may be left unwired)
- s2 preparation: brilakis p.296–297; oxford p.257–259 (Fig. 8.20 and SB protection by balloon before dilation); brilakis p.192 (chapter 10 list); atherectomy wire removal problem p.296
- c-sb-dissection: NHLBI B = compromise p.294; SB stent options p.302
- s3 sizing and POT room: brilakis p.298–299
- c-oversized: brilakis p.298 (Fig. 16.6); TIMI 1 = compromised, not occluded → 4b, jailed wire removed after rewiring: p.300–302; keeping the jailed wire until a balloon follows is the 4c rule (p.302), offered as an optional extra precaution
- s4 jailing prep: brilakis p.299, p.302
- s5 POT: brilakis p.299–300. Variant no-room-for-pot: shortest POT balloon 6 mm (p.299); longer balloon injures MV proximal to stent (p.300); no proximal-stent fix is prescribed (removed in round 1); imaging assesses stent expansion (p.325). Option 2 feedback: too distal, half the balloon in the distal MV (p.300), and longer than the proximal segment (p.299)
- c-pot-distal: TIMI <3 compromise p.294; 4b p.300–302; TAP preparation p.305
- s6 SB assessment: brilakis p.218, p.294, p.300, p.302; oxford p.258; ref nordic-baltic3-2011
- Outcome (round 2 rewrite: no longer settles on standard-duration DAPT): consider prolonged DAPT at low bleeding risk after bifurcation stenting: brilakis p.295 (16.2.3); complex-PCI evidence for longer DAPT counted a bifurcation only with 2 stents: ref giustino-complex-pci-dapt-2016; duration therefore set by the patient's bleeding risk (synthesis of the two, no new fact). Case refs now list giustino-complex-pci-dapt-2016 and nordic-baltic3-2011 (s6 feedback cites Nordic-Baltic III)

### cp-bifurcation-provisional-case-lost-om (synthetic)
- s1: brilakis p.300, p.302 (4c yes), p.305 (TAP starting point)
- c-no-marker: SB wiring escalation (wire, microcatheter including angulated and dual-lumen, MV modification): brilakis p.296; the unsourced ranking of microcatheters removed
- s2: brilakis p.303–304 (4c no; option 2 inverted DK crush); oversized balloon → SB compromise p.300
- s3 / c-proximal-cell: brilakis p.301, p.303
- s4 / c-under-stent: brilakis p.302; imaging for substent wiring p.325
- s5 / c-fracture: brilakis p.301–302; p.472–474 (27.2.3.2, Fig. 27.10: unravelling? → cover with stent? → stent over fragments, else surgery if extending into aorta or critical location such as LM or other major bifurcation; no unravelling → need to remove (twirling, snare) → otherwise stent over or leave in place)
- s6: Finet arithmetic p.302
- s7: final POT p.302; SB stent only if suboptimal p.302
- s1 option 3 (TAP) feedback: TAP 'no rewiring' advantage and its starting point: p.305

## Lab tips

(Superseded in part by "Fixer round 1" below.) Round 2 trigger change: 'wire-side-branch' is not a bifurcation signal. src/ui/lab/pciTips.ts raises it in every PCI case when the wire tip lies in a vessel off the target route (the wire has strayed), and while it is active the phase can only be guide, wire or complication, because 'across' needs the wire on target. It has been removed from every pci-bif-* trigger. TipTrigger and LabContext have no lesion field, so phase-only triggers in a reported phase would show in every PCI case. The planning tips (guide-size, wire-both-branches, no-sb-predilation, atherectomy-two-wires, mv-stent-size) are gated on phase 'plan' alone, which pciTipContext never reports today, so they are taught in the lessons and are not shown in the lab until a bifurcation lesion context exists; Brilakis p.297 lists wiring and lesion preparation under the preparation of a provisional strategy, and the guide size (p.295), the guide size that atherectomy through a guide extension needs (p.296) and the stent diameter and length (p.298) are chosen before the stent is delivered. pci-bif-jail-wire-prep is gated on phase 'stent' with 'side-branch-compromise' (a side branch already compromised before the main-vessel stent is deployed is the branch the jailed wire must keep open and mark, brilakis p.299). POT, kissing, rewiring, strut confirmation and rescue are gated on 'side-branch-compromise' only. pci-bif-jailed-wire-removal no longer uses 'equipment-entrapment' (raised for any trapped device, which would have shown jailed-wire advice for, for example, a stuck balloon in a simple case); it is gated on phase 'optimise' with 'side-branch-compromise', the moment the jailed wire is removed after side-branch rewiring (brilakis p.301 step 2), and retitled 'Removing the jailed wire: gentle traction, never a hard pull'. The SB-wiring tip stays on 'wire-prolapse' only; 'acute-closure' stays removed from the occluded-SB tip (a main-vessel closure follows the chapter 25 algorithm). A lesion context is requested in the lab-request file.


- pci-bif-guide-size: brilakis p.295; oxford p.258
- pci-bif-wire-both-branches: brilakis p.296–297, p.154–155
- pci-bif-hard-side-branch-wire: brilakis p.296, p.155–158
- pci-bif-no-sb-predilation: brilakis p.296–297
- pci-bif-atherectomy-two-wires: brilakis p.296, p.370 (damage, embolisation, should be avoided)
- pci-bif-mv-stent-size: brilakis p.298–299
- pci-bif-jail-wire-prep: brilakis p.299, p.302 (looped tip entangles on withdrawal; jailed length linked to wire damage, p.299)
- pci-bif-jailed-wire-removal: brilakis p.301–302
- pci-bif-pot-size-position: brilakis p.299–300
- pci-bif-assess-side-branch: brilakis p.294, p.300, p.218
- pci-bif-rewire-distal-cell: brilakis p.300–301
- pci-bif-kissing-size: brilakis p.302 ('consider' a final POT)
- pci-bif-confirm-inside-struts: brilakis p.302; imaging p.325
- pci-bif-occluded-sb-rescue: brilakis p.303–304

## Fixer round 1 (checker findings applied)

New reference: andreasen-final-pot-2020, PMID 32087046, PMC7384175, Catheter Cardiovasc Interv 2020;96(1):31–39 (Andreasen LN, Holm NR, Webber B, Ormiston JA), checked on PubMed, abstract read. Existing references now also used: ebc-main-2021 (PMID 34002215, Eur Heart J 2021;42(37):3829–3839, abstract re-read: 467 true LM bifurcations; primary endpoint 14.7% stepwise provisional vs 17.7% dual stenting, HR 0.8, P = 0.34; stent thrombosis 1.7% vs 1.3%; 'stepwise provisional strategy should remain the default'), esc-ccs-2024 (PMID 39210710; DAPT default after elective PCI for CCS, aspirin plus clopidogrel up to 6 months, 1–3 months at high bleeding risk, longer considered at high ischaemic and low bleeding risk: as taught in foundations.ts line 1738 and pci-core.ts lines 641–643; class and level not quoted), finet-fractal-2008 (coefficient derived from native coronary bifurcations, QCA and IVUS: title of the paper), definition2-2020 (abstract re-read: TLF difference 'largely driven by' TVMI and clinically driven TLR; cardiac death 2.5% vs 2.1%, NS), giustino-complex-pci-dapt-2016 (abstract re-read: long-term DAPT increased major bleeding, similar between groups, p = 0.96).

Lesson cp-bifurcation-provisional-assess
- Up to 15% of target lesions: oxford p.257; cx-bif-assessment's 'roughly one PCI in five' named as the Academy figure; no manual gives a per-procedure figure
- 1,1,1 row: Brilakis prefers DK crush for true LM bifurcations citing DKCRUSH-V: brilakis p.332; EBC MAIN figures and conclusion: ref ebc-main-2021
- DEFINITION step: 'Neither book cites DEFINITION II' (both manuals checked; neither reference list cites it); criterion rewritten so that SB lesion length ≥10 mm applies to both LM and non-LM (cx-bif-two-stent table, pci-complex.ts lines 216–217); TVMI/TLR driver and cardiac death: ref definition2-2020
- Check 2: moderate calcium as a morphological determinant of SB occlusion: brilakis p.294 (16.1.2); SB wired when important and at risk: brilakis p.297; pearl reworded so it no longer assumes no calcium

Lesson cp-bifurcation-provisional-setup
- Drugs row: Oxford wording (more than one DES may increase ST risk by more than 5%): oxford p.260, 'written with early-generation DES in mind' removed; DKCRUSH-V 0.4% vs 3.3%: ref dkcrush5-2017; EBC MAIN ST 1.7% vs 1.3%: ref ebc-main-2021; ESC 2024 CCS DAPT default: ref esc-ccs-2024 (as above); Giustino bleeding: ref giustino-complex-pci-dapt-2016
- Guide size: LM bifurcation 7 or 8 Fr preferred for support: brilakis p.329 (17.4)
- SB wiring options: three groups listed as alternatives ('can be used'), MV modification carries SB occlusion risk: brilakis p.296. Fixer round 3: 'usually kept for last' removed from the lesson step, keypoint, tip pci-bif-hard-side-branch-wire and case c-no-marker; the text now says Brilakis flags the risk and gives no order, and that the risk is a reason to try the wire and microcatheter options first (stated as reasoning, not as Brilakis's sequence)
- SB preparation: dissection 'necessitating stenting': brilakis p.296, p.297
- 'Where the books differ': cx-bif-provisional's SB dilatation rule (severely diseased SB or precarious access) quoted from pci-complex.ts line 135
- Microcatheter protection during atherectomy: 'should be avoided' is in the orbital atherectomy section 19.9.6 (brilakis p.370); 16.2.9 lists it as an option (p.296). Lesson, q10 and tip now say this. q10 option D replaced with '7 Fr guide with a small microcatheter over the diagonal wire, moved slowly during the runs' (microcatheter protection needs 8 Fr: brilakis p.296)

Lesson cp-bifurcation-provisional-jailed
- Opening sentence paraphrased (brilakis p.299)
- Prevention: avoid aggressive wire manipulation, especially in small branches; severe calcification a cause of entrapment: brilakis p.472 (27.2.1.1, 27.2.2.1)
- Rotation step: 'may help': brilakis p.302; over-rotation a cause of fracture: brilakis p.472 (27.2.1.2). Same caution in the tip, q8 explanation, keypoint and case lost-om s5
- Repeat POT after inflating a balloon over the jailed wire: brilakis p.302 gives no reason; the reason is now marked as presumption
- Jailed balloon heading 'as well as a wire'; modified technique described in 25 cases with SBs unsuitable for stenting: ref somendra-modified-jailed-balloon-2025 (abstract); Wang 2022 described only as 'a protective ballooning technique' (abstract does not describe the method): ref wang-protective-ballooning-2022

Lesson cp-bifurcation-provisional-pot
- POT balloon type: Brilakis gives diameter, length and position for POT (p.299–300) but no balloon type; general post-dilatation with a shorter non-compliant balloon: brilakis p.191 (10.2)
- Final POT bullet: cx-bif-provisional repeats POT after every kiss (pci-complex.ts line 141, 'then re-POT'); Brilakis p.302 'should be considered'

Lesson cp-bifurcation-provisional-sb
- Physiology row: 'Adenosine FFR'; threshold reason 'increased risk of subsequent adverse events' at FFR ≤0.80, hence 'at or below this value': brilakis p.218 (12.1.2); physiology only in non-culprit lesions in ACS, so not valid in the culprit vessel: brilakis p.300; jailed wire removed only after SB rewiring: brilakis p.301 (16.2.10.1, 4b step 2). Raw page reference and the 'inference' wording removed from learner text (fixer round 3)
- Distal-cell technique reworded (brilakis p.301) in the lesson step, pearl, tip, case lost-om s3 and c-proximal-cell
- Finet note: effective diameter similar to proximal MV: brilakis p.302; coefficient from native vessels: ref finet-fractal-2008; cx-bif-provisional sizes NC balloons to each distal branch and re-POTs (pci-complex.ts line 141); the 'downsize the MV balloon' rule was removed from the note and the check explanation (no source). Arithmetic: 0.678 × 5.5 = 3.73; 0.678 × 5.25 = 3.56; 0.678 × 6.0 = 4.07
- Wire under the stent: 'crush the stent' removed everywhere (no source). Replaced by: a balloon at a previously deployed stent that will not advance suggests the wire crossed under a strut; rewire through the stent: brilakis p.177 (9.7.8.3) and Fig. 9.10 (p.178); imaging identifies substent wiring: brilakis p.325 (16.2.13); the 4c rule (low-profile balloon before removing the jailed wire confirms the wire is through, not under, the stent): brilakis p.302
- Nordic-Baltic III row reworded: 7.9% with the kiss vs 15.4% without; true bifurcations 7.6% vs 20.0%; MACE 2.1% with vs 2.5% without: ref nordic-baltic3-2011
- q4: Fig. 16.11 reproduced from Sawaya 2016 (brilakis p.301 caption), 'bench images' removed

Case cp-bifurcation-provisional-case-lad-diagonal
- s1 option 3: provisional wires the SB when important and at risk: brilakis p.297
- c-sb-dissection (fixer round 3): best option shortened; SB preparation avoided because dissection necessitates stenting: brilakis p.296; bail-out angle now deferred to lesson 5 step 5 (manuals differ); planned two-stent DK crush or culotte <70°: brilakis p.294 (16.1.4); DK crush keeps wire access to the MV at all times with little to no SB loss risk, particularly important with dissections: brilakis p.311 (16.2.10.5); new third option SKS: not for non-emergent PCI, needs ≥7 Fr: brilakis p.295 (16.1.6, 16.2.1)
- c-pot-distal option 2 and s6 option 4 (fixer round 3): error rests on timing (SB stent only after rewiring, kissing, POT and a poor result: brilakis p.300 Fig. 16.9, p.302); angle disagreement stated: Brilakis Fig. 16.1 p.293 (70–90° TAP; <70° reverse crush or culotte) vs Oxford p.259 (TAP preferred when angle <90°) vs Academy cx-bif-provisional (pci-complex.ts line 143 and keypoint line 196: TAP usual bail-out)
- c-oversized is now a rewind teaching note ('had you deployed...'), and s4 carries a variant for flag oversized-stent returning the case to the 3.0 mm stent, so the step order follows Brilakis steps 1–4 (p.298–302)
- Outcome: ESC 2024 CCS default up to 6 months DAPT: ref esc-ccs-2024; more major bleeding with longer DAPT: ref giustino-complex-pci-dapt-2016

Case cp-bifurcation-provisional-case-lost-om
- s2 option 3: 'Balloon over the jailed wire, then convert to an inverted DK crush'; option 2 follows balloon inflation over the jailed wire: brilakis p.300 (Fig. 16.9), p.304; 'more complex' removed
- s4 prompt no longer asserts a distal-cell crossing; c-under-stent uses a 1.0–1.5 mm low-profile balloon (brilakis p.302 'low profile balloon'; 1.0–1.5 mm from p.303); inflating option now penalised −10 with flag substent-inflation and feedback limited to sourced points (p.177, p.325)
- c-fracture: location decides surgery (aorta, LM or other major bifurcation), otherwise trap behind a stent, snare can break the wire near the ostium to allow stenting, avoid retrieving unravelled fragments: brilakis p.473, p.476 (27.2.3.2.2–27.2.3.2.3)
- s6: 3.0/2.5 mm (3.73 mm) now best, 2.75/2.5 mm (3.56 mm) acceptable; both 'similar' to 3.5 mm (brilakis p.302); final POT corrects ovalisation (p.302)

Lab tips (fixer round 1)
- pci-bif-guide-size: LM 7 or 8 Fr, brilakis p.329; sources add 17.4
- pci-bif-hard-side-branch-wire: retitled; options as three groups, brilakis p.296
- pci-bif-no-sb-predilation: sources now 16.2 only (Oxford p.258–259 includes SB dilatation in provisional and does not support the tip)
- pci-bif-atherectomy-two-wires: 19.9.6 versus 16.2.9 wording
- pci-bif-jailed-wire-removal: trigger now phase 'optimise', event 'equipment-entrapment', requires 'side-branch-compromise' (stand-in for a bifurcation context); text adds gentle rotation and over-rotation caution (p.302, p.472)
- pci-bif-assess-side-branch: 'adenosine FFR' (p.218)
- pci-bif-rewire-distal-cell: reworded (p.301)
- pci-bif-confirm-inside-struts and pci-bif-occluded-sb-rescue: lesson-only (phase 'plan' with 'side-branch-compromise', which cannot co-occur) until a 'side-branch-occlusion' event exists; 4c is for an occluded SB only (brilakis p.300, p.302–303). Both signals requested in the lab-request file
- POT, rewiring and kissing tips stay on 'side-branch-compromise' (the 4b response to a compromised branch, brilakis p.300–302); no finer event exists to show only the assessment tip first; requested

## Fixer round 2 (checker findings applied)

- Lesson sb, 'An alternative to the kiss': the bench study was described backwards. Andreasen 2020 (PMID 32087046, PMC7384175, full text read) placed the first POT with the distal marker at the carina, then compared a final POT across the SB takeoff with one proximal to the takeoff; the Discussion notes that reviews and consensus papers show the conventional final POT across the takeoff. A balloon with its distal marker at the carina covers the SB ostium, so it is in the 'across' position: pooled 43% reduction of the opened SB cell, rejailing with a metallic carina, greatest after POT–side–POT with proximal wiring; proximal final POT about 4% reduction. Discussion 4.5: POT–side–POT needs a final POT across the takeoff to correct malapposition opposite the SB. Phantom B angle 30° (narrow angle); bench only. Text now says the study differs from Brilakis (POT marker at the carina, p.300). Matching clauses added to the lesson pot 'Final POT' bullet and to case lost-om s7 best feedback; ref andreasen-final-pot-2020 added to lesson pot and case lost-om refs.
- Case lost-om c-no-marker best feedback: no longer a ladder. Brilakis 16.2.8 (p.296) lists A wire-based, B microcatheter, C modify MV as techniques that 'can be used'; MV modification carries risk of SB occlusion. Wording now matches the lesson setup block and keypoint ('usually kept for last' as in round 1).
- Case lost-om c-fracture best feedback: Brilakis 27.2.3.2.2 (p.473) names 'left main or other major bifurcation' without defining it; the circumflex–OM classification is now hedged ('may count'; decide with the surgical team).
- Tip pci-bif-jail-wire-prep: trigger was phase 'stent' with 'side-branch-compromise'. tipsFor (src/content/lab/tips.ts) requires an event to be active, and src/ui/lab/pciTips.ts raises 'side-branch-compromise' only for an overt or prodromal side-branch complication, at or after deployment, so the pre-deployment advice (brilakis p.297–299) would appear only after the branch was compromised. Phase 'stent' alone would show it in every PCI case. Now phase 'plan' (lesson-only), and the lab-request tip-engine entry asks for phase 'stent' plus a bifurcation lesion context. This supersedes the jail-wire-prep sentence in the round 2 trigger note above.
- Lesson assess block 0: the parenthesis naming the Academy figure ('roughly one PCI in five') was removed, so the sentence stays correct whether or not the Academy fix to cx-bif-assessment (pci-complex.ts line 35, Oxford p.257 up to 15% of target lesions) is applied. That Academy fix is returned again in academyFixes.


## Fixer round 3 (round 1 findings of the second checker pass)

Lesson assess
- Medina 1,1,1 row: DK crush preferred for true (1,1,1 or 0,1,1) LM bifurcations, refs [7,8] = NOBLE and Ramadan 2018: brilakis p.332 (17.10), reference list p.333–334; DKCRUSH-V cited in 16.2.10.5 with TLF at 12 months 5% vs 10%: brilakis p.311
- Opening paragraph: Academy cx-bif-assessment 2.5 mm (pci-complex.ts line 86); Brilakis <2 mm usually not preserved, decision by size and territory: brilakis p.293. The Academy 'one PCI in five' (line 35) is not named; the Academy fix to Oxford's 'up to 15% of target lesions' (oxford p.257) is returned again
- True bifurcation: Bif-ARC true bifurcation disease = Medina 1,1,1, 1,0,1 or 0,1,1, as quoted in ref johnson-eapci-lm-imaging-2026 (full text read, PMC13634641, circumflex complexity section); ref lunardi-bif-arc-2022 (PMID 35597684, metadata and abstract checked; full text not in PMC)
- Physiology bullet: Fig. 16.79, LM stenting, circumflex ostium appeared compromised, FFR pullback showed pressure step-up at the LM, confirming significant focal ostial circumflex stenosis: brilakis p.325–326 (16.2.12)

Lesson setup
- Drugs row: Oxford ST >5% with more than one DES: oxford p.260, now marked as not current; DKCRUSH-V 0.4% vs 3.3%: ref dkcrush5-2017; EBC MAIN 1.7% vs 1.3%: ref ebc-main-2021
- Haemodynamic support paraphrased: brilakis p.327 (16.2.14)
- 'Where the books differ': Oxford provisional crossover = MV stenting with no SB intervention or SB ostial balloon dilatation (typically kissing): oxford p.259; provisional T-stenting defined as MV stenting with SB balloon dilatation: oxford p.257
- Atherectomy: highly diseased SB risks dissection and occlusion during atherectomy; delivery over a guide extension past the side branch protects more proximal branches: brilakis p.370 (19.9.6)
- Diameter step: imaging very useful for size and length of MV and SB lesions: brilakis p.296 (16.2.9); IVUS/OCT recommended in true bifurcations: ref esc-ccs-2024; OCTOBER: ref october-2023 (refs added to the lesson)
- Quiz q10: Brilakis gives only 7/6 Fr (1.25 mm) and 8/7 Fr (1.5 mm): brilakis p.296

Lesson jailed
- Table row 1 rephrased around the numbers: brilakis p.299; ref pan-jailed-wire-2016
- Step 1 addition: unintended stent deformation in a pre-specified OCTOBER analysis: 9.3% of OCT-guided cases, 18.5% in LM bifurcation PCI; sites failed to recognise or treat it in 55%, with 23.3% MACE; guide catheter collision due to a jailed wire named as a cause; stent enhancement imaging useful for deformation; Fig. 7 shows proximal stent distortion after jailed-wire withdrawal corrected by repeat POT: ref johnson-eapci-lm-imaging-2026 (full text read). 'Watch the guide while you pull' follows from brilakis p.301 (deep intubation when pulling hard) and the consensus mechanism; the checker's 'keep the guide disengaged' was not adopted because neither source says it
- Step 3: speculation removed; repeat POT after the distal balloon: brilakis p.302
- Step 4: 'only a few turns' removed (lesson, tip pci-bif-jailed-wire-removal, case lost-om s5): rotation with a torquer may help: brilakis p.302; over-rotation causes fracture: brilakis p.472 (27.2.1.2)
- New pitfall and keypoint on stent deformation: as above

Lesson POT
- Final POT bullet: proximal final POT 'little or no reduction (about 4%)': ref andreasen-final-pot-2020 (abstract 4% [0.6%;6%])
- Distal marker step: balloons differ in cone angle and shoulder position relative to the markers: ref andreasen-final-pot-2020, Discussion 4.3 (full text)

Lesson sb
- Physiology row: see the rewritten line above
- DKCRUSH-VI paragraph: 320 patients, Medina 1,1,1 or 0,1,1, provisional; angiographic criteria TIMI <3, ostial SB stenosis >70% or dissection worse than type A vs SB FFR <0.80; SB stenting attempted 38.1% vs 25.9%; 1-year MACE 18.1% both: ref chen-dkcrush6-2015 (PMID 25819187, abstract read)
- Exit 4a: 'procedure done' brilakis p.300 (Fig. 16.9); imaging for stent expansion: brilakis p.325 (16.2.13)
- 4b step 1: MV wire used by some to avoid substent wiring with a new wire; Brilakis uses a new wire: brilakis p.300
- 'An alternative to the kiss': PROPOT 120 patients, crossover stenting, POT + SB dilatation vs kissing; composite OCT bifurcation stent failure at final 27% vs 32%; unplanned additional procedures 38% vs 25%; 'did not result in a favorable trend': ref murasato-propot-2022 (PMID 35170843, abstract read); major ISA 35% vs 17%: ref yamawaki-propot-oct-2023 (PMID 37680550, abstract read)
- Final POT step: bench finding cross-referenced: ref andreasen-final-pot-2020
- 4c step 1 paraphrased: brilakis p.303
- Dual-lumen microcatheter handling (stiffening mandrel in some, side-port direction hard to control and may need reinsertion, trapping balloon to keep wire positions on withdrawal; use for wiring through jailed side branches): brilakis p.558 (30.6.4)
- Kissing check rewritten: options 3.5+3.0 (4.41), 3.0+3.0 (4.07), 3.0+2.5 (3.73, answer), 2.5+2.0 (3.05); arithmetic from brilakis p.302; branch-matched sizing attributed to Academy cx-bif-provisional (pci-complex.ts line 141)
- Step 5 'Still not good?': angle disagreement as in the c-pot-distal line above

Cases
- lad-diagonal s6 best feedback: DKCRUSH-VI added (ref chen-dkcrush6-2015)
- lost-om c-under-stent: rewiring through the stent, ideally after knuckling the wire tip more proximally: brilakis p.177 (9.7.8.3)
- lost-om c-fracture: best option shortened; retrieval of unravelled fragments generally avoided (more unravelling), although successful removal described; snare to break near ostium; trap behind stent: brilakis p.475–476 (27.2.3.2.2–3); clean fracture: small distal fragments may be left, long fragments in a large artery retrieved (twirling, snare): brilakis p.476 (27.2.3.2.4–6); new option 'snare straight away' wrong for the same reason
- lost-om s6: 2.75 + 2.5 feedback attributes the ranking to the Academy convention (cx-bif-provisional line 141), Brilakis's only rule being effective diameter similar to proximal MV (p.302)
- lost-om s7: best = final POT kept proximal to the OM takeoff, allowing for the shoulder (ref andreasen-final-pot-2020: across the takeoff 34% reduction after distal rewiring, proximal about 4%; shoulders vary, 4.3); new acceptable option = marker at the carina as for the first POT (brilakis p.300 places the first POT marker at the carina; p.302 gives no position for the final POT)

Tips and triggers
- pci-bif-jailed-wire-removal: text as step 4 and the stent-deformation point; ref johnson-eapci-lm-imaging-2026 added
- pci-bif-occluded-sb-rescue, pci-bif-hard-side-branch-wire: reworded as above
- Trigger findings: not applied in the module, because LAB_EVENTS (src/content/lab/tips.ts) has no 'bifurcation' event and that file belongs to no module. Phase 'plan' is never reported by the PCI lab (src/ui/lab/pciTips.ts lines 41–48), so the six plan tips are lesson-only and cannot appear in other PCI cases today; moving them to 'stent', 'lesion-prep' or 'wire' without a bifurcation gate would show them in every PCI case. pci-bif-pot-size-position stays on 'side-branch-compromise' for the same reason (phase 'optimise' alone would show it after every stent). The 'bifurcation' event is returned in academyFixes and the target triggers are listed in the lab-request tip-engine entry

## Fixer round 4 (round 2 findings of the second checker pass)

- Case lad-diagonal c-pot-distal best option: final POT now 'kept proximal to the diagonal takeoff', matching lost-om s7 and lesson pot step 4; feedback adds that a final balloon across the takeoff narrowed the newly opened cell (bench study, lesson 5): ref andreasen-final-pot-2020 (PMC7384175, Results: 34% reduction after distal rewiring, 43% pooled, about 4% when proximal to the takeoff), now in the case refs. Rewiring, kissing and repeat POT sequence unchanged: brilakis p.300–302
- Lesson jailed keypoint 6: 18.5% now stated as unintended stent deformation from any cause in left main cases, guide collision during jailed-wire withdrawal being one cause, not the rate from pulling the wire: ref johnson-eapci-lm-imaging-2026 (as in the round 3 step 1 entry)
- Lesson setup, Drugs row: Oxford p.260 figure (more than 5% with more than one DES) now set against the two-stent arms: DK crush 0.4% definite or probable ST at 1 year (DKCRUSH-V, PMID 29096915, abstract re-read) and dual stenting 1.3% at 12 months (EBC MAIN, PMID 34002215, abstract re-read); provisional arms 3.3% and 1.7% given as such; 'far lower' removed
- Lesson sb, 'An alternative to the kiss': PROPOT result reworded so the order of the groups is explicit (27% POT and SB dilatation, 32% kissing) and the conclusion is the authors' (no favourable trend for POT); unplanned additional procedures 38% vs 25%: ref murasato-propot-2022 (PMID 35170843, abstract re-read)
- Lab-request file: no change needed; the final-POT position is already stated in the rewiring-and-kissing request
