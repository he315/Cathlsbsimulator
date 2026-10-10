# Evidence: cp-other-complex (SCAD, stent failure, vessel size and long lesions)

Module file: `src/content/manual/complex-pci/12-other-complex.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

New references (module `refs` export, each checked on PubMed for authors, title, journal, year, volume, issue and pages; abstracts read): `hayes-scad-aha-2018` (PMID 29472380, PMC5957087; Circulation 2018;137(19):e523–e557), `saw-scad-arteriopathies-2014` (PMID 25294399; Circ Cardiovasc Interv 2014;7(5):645–55), `bresson-imh-fenestration-2019` (PMID 30838754; CCI 2019;94(1):E17–E19), `torrado-stent-failure-2018` (PMID 29650125; JACC 2018;71(15):1676–1695), `kawsara-aneurysm-2018` (PMID 29976357; JACC CI 2018;11(13):1211–1223), `megaly-dcb-small-vessel-2019` (PMID 30489687; CCI 2019;93(5):E277–E286), `negi-brachytherapy-2016` (PMID 27339842; JACC CI 2016;9(12):1259–1265), `megaly-brachytherapy-2020` (PMID 31943747; CCI 2021;97(1):32–38, epub 13 January 2020; print issue January 2021 confirmed from the Crossref record for doi 10.1002/ccd.28716), `klein-stent-failure-scai-2023` (PMID 39131655, PMC11308135; J Soc Cardiovasc Angiogr Interv 2023;2(4):100971; full text read), `cerrato-disco-2021` (PMID 34338759; Eur Heart J 2021;42(33):3161–3171; abstract read). `hayes-scad-aha-2018` full text now read (PMC5957087) and used beyond its abstract (see below). All except Bresson-type single case and Torrado are Brilakis's own chapter 22 or 30 references (ch 22 refs 1, 2, 4, 5, 6, 7; ch 30 refs 85, 86).

Existing refs reused (round 1 adds `esc-revasc-2018`, `esc-acs-2023`, `garcia-garcia-arc2-2018`, all already verified in refs.ts): `saw-scad-outcomes-2017` (defined by pm-interpreting; Brilakis's ch 22 ref 3, the classification figure 22.2), `yeh-agent-ide-2024` (defined by pm-prep-and-stent; re-checked on PubMed: PMID 38460161, JAMA 2024;331(12):1015–1024; abstract: 600 patients with ISR, 2:1 paclitaxel-coated vs uncoated balloon, US, 'none have been previously evaluated or approved for use in coronary circulation in the United States'; 1-year TLF 17.9% vs 28.6%, HR 0.59; TLR 13.0% vs 24.7%; target-vessel MI 5.8% vs 11.1%), `hong-ivus-xpl-2015` (defined by pm-imaging; Brilakis ch 22 ref 8), `cutlip-arc-2007`, `mehran-isr-1999` (named only to point to the Academy lesson cx-isr).

## Notes for checkers

- The Brilakis extract drops dashes and comparison signs. Confirmed on the page images (p.399–406 and p.416–418 viewed): p.400 ">20 mm", "<20 mm", "3−5 days"; p.401 "5−10 mm", "(>1 year)"; p.403 "(<2.5 mm)", "(≥4.0 mm)"; p.406 "(≥28 mm in length)"; p.417 "26−28 atm", "30−60 seconds", "0.5 mm", ">14 atm"; p.418 "(≥1.75 mm)", "80 Hz", "80 mJ/mm²". Not imaged, same garble pattern: p.29 "6–12 months"; p.380 "1.0–1.5 mm"; p.573 "(>40 atm)"; p.574 "2.5 × 40 mm"; p.141 "<2mm", ">20mm".
- Device names replaced by generic classes (rule 7): StentBoost/CLEARstent → X-ray stent-enhancement modes; Resolute Onyx, Synergy, Xience Sierra → "the largest drug-eluting stent", "others" (sizes kept); Orsiro → not named (40 mm longest in the United States); AngioSculpt → scoring balloon; Chocolate → nitinol-caged balloon; Wolverine → cutting balloon; ELCA/X-80 → 0.9 mm excimer laser catheter; Wiggle → support wire built with distal waves; Venture → angulated microcatheter; Beta-Cath → not named; OPN NC → very-high-pressure balloon; Shockwave → lithotripsy. Trial names (IVUS-XPL, AGENT IDE) kept.
- Disagreements taught explicitly: (1) brachytherapy: Brilakis p.403 'recurrent in-stent restenosis is best treated with brachytherapy or drug-coated balloons' and p.597 'useful for treatment of recurrent in-stent restenosis' vs Oxford p.222 'largely been superseded by repeat stenting with DESs'; (2) drugs to prevent restenosis: Oxford p.221 'Pharmacological therapies have yet to be proven' vs Brilakis p.402 cilostazol 'may decrease the risk of in-stent restenosis, but is contraindicated in patients with heart failure'; (3) aneurysm threshold wording within Brilakis: p.404 'at least 1.5 times' vs p.133 'more than 1.5 times'.
- Out-of-date points: coronary DCB 'not currently available in the United States' (p.403, p.573) → AGENT IDE (2024) result (ref yeh-agent-ide-2024); no approval date is claimed. Lithotripsy and very-high-pressure balloons are given as Brilakis's 'future techniques' (Fig. 23.7, p.416) with current use pointed to cp-calcium. Stent sizes are attributed to 'when the manual was written'.
- Inferences flagged in the text as the module's own reasoning are kept minimal: the pearl blocks; 'say the diagnosis aloud' (planning step 1 of SCAD, an operational restatement of p.399 'should be suspected'); 'a loop cannot slip through a stent cell' (explanation of why a knuckle prevents sub-strut passage, p.402); 'a poorly filled vessel's lesions cannot be judged properly' (p.404 importance of complete filling; p.404 severity assessment challenging in large vessels).
- Possible issues in existing Academy lessons (for the fixer; not edited): (a) `cx-scad-anomalous` (pci-complex) teaches 'Restore flow with a small balloon ... Stent only if unavoidable' and 'some operators treat the distal and proximal edges first'; Brilakis p.401 instead lists direct stenting (to minimise IMH expansion), cutting-balloon decompression, and long stents 5–10 mm beyond the IMH with a smaller diameter, and p.445 gives 'stent distally first, then proximally' for a propagating haematoma; the lesson cites no source for the balloon-first approach. (b) `cx-isr` (pci-complex) says IVUS/OCT 'Neointimal hyperplasia ... DCB or DES' and 'Recurrent multilayer ISR ... consider CABG, or ... brachytherapy'; it does not mention Brilakis's first-episode/recurrence rule (DES for the first, DCB or brachytherapy for recurrence, p.403) or Oxford's view that brachytherapy has been superseded (p.222). (c) `comp-st-definitions` gives acute/subacute subdivisions (within 24 h, 24 h–30 d) not in Oxford's Table 8.5 (p.228), which gives early (within 30 days), late and very late only; ARC 2007 does define acute and subacute, so this is not an error, but the source should be `cutlip-arc-2007` rather than the books.

## Lesson cp-other-complex-scad

- Definition: epicardial dissection not associated with atherosclerosis or trauma and not iatrogenic; injury mainly from IMH or intimal disruption obstructing the artery rather than plaque rupture or intraluminal thrombus: brilakis p.399 (22.1)
- Suspect in young women, especially peripartum: brilakis p.399 (22.1.1); STEMI in postpartum patients may be SCAD: brilakis p.377 (20.1)
- AHA statement abstract (cause of ACS, MI, sudden death in young women and those with few risk factors; female sex, pregnancy, physical and emotional stressors, arteriopathies especially FMD; high recurrence): ref hayes-scad-aha-2018
- 168 patients, 92.3% women, mean age 52.1, FMD 72.0%, stressor 56.5%: ref saw-scad-arteriopathies-2014
- Careful monitoring throughout (high risk of complications and haemodynamic deterioration): brilakis p.399 (22.1.2)
- Anticoagulation and oral antiplatelets as in non-SCAD; GP IIb/IIIa inhibitors and cangrelor generally avoided (risk of extending IMH): brilakis p.400 (22.1.3)
- Femoral preferred; threefold higher catheter-induced iatrogenic dissection with radial in one series: brilakis p.400 (22.1.4) (the figure is not in the Saw 2014 abstract and is attributed to Brilakis)
- Coaxial engagement with extreme care, no deep intubation: brilakis p.400 (22.1.5)
- Avoid strong contrast injections (iatrogenic dissection): brilakis p.400 (22.1.6)
- Nitrate before calling SCAD rather than spasm: pointed to the Academy lesson dx-anat-spasm-scad (not claimed from Brilakis)
- Identification challenging, needs awareness: brilakis p.400
- Types 1, 2 (usually >20 mm; 2A normal segments proximal and distal to IMH; 2B to the distal tip), 3 (focal/tubular, usually <20 mm, mimics atherosclerosis, needs imaging if safe): brilakis p.400 (Fig. 22.2, Saw classification); ref saw-scad-outcomes-2017
- Type 2 67.0%, type 1 29.1%, type 3 3.9%: ref saw-scad-arteriopathies-2014
- OCT/IVUS can confirm SCAD but may extend dissection; use cautiously: brilakis p.401 (22.1.13); wiring and contrast injection may cause hydraulic extension of the flap and acute closure: brilakis p.240 (13.3); OCT preferred for suspected dissection but contrast may extend it: brilakis p.233 (Table 13.2)
- Physiology limited role: brilakis p.401 (22.1.12)
- PCI high complication risk, 'a temptation to be avoided'; conservative preferred; revascularisation for active ischaemia or instability: brilakis p.400 (22.1.7)
- Stable without LM or proximal two-vessel dissection: in-hospital observation 3–5 days without revascularisation; stable with LM or proximal two-vessel: CABG vs continued observation; unstable or active ischaemia: PCI or CABG by anatomy: brilakis p.400–401
- 134/168 initially conservative; 3 revascularised for extension; all 79 restudied ≥26 days later healed; recurrence 13.1%: ref saw-scad-arteriopathies-2014
- VA-ECMO access recommended because of risk of acute closure; online case 72: brilakis p.401 (22.1.14)
- Avoid polymer-jacketed wires (subintimal entry): brilakis p.401 (22.1.8)
- Unclear wire position: do not advance a balloon; IVUS can confirm intraluminal wire; injecting through microcatheter/OTW balloon risks extending a subintimal dissection: brilakis p.380 (20.8.3)
- Direct stenting proposed to minimise IMH expansion; cutting balloon can decompress the haematoma with perforation risk; fenestration at multiple sites before stenting: brilakis p.401 (22.1.9); ref bresson-imh-fenestration-2019 (single case, OCT-guided, multiple decompression sites)
- Cutting balloon: high crossing profile, inflate very slowly 1 atm every 5 s; used in SCAD: brilakis p.571 (30.9.3.3)
- Long stents 5–10 mm on both sides of the IMH; diameter smaller than for similar atherosclerotic lesions: brilakis p.401 (22.1.10)
- Closure as chapter 11: brilakis p.401 (22.1.11)
- IMH after PCI: causes SCAD and balloon/stent; prevention: proper sizing, avoid very high deployment pressures, avoid balloon protrusion beyond stent edges; treatment: stent distally first then proximally, or cutting balloon decompression; small IMH conservative especially if tear sealed/stented: brilakis p.445 (25.2.8)
- Case: dissection treated by stenting, reentry as bail-out: brilakis p.437 (Table 25.1)
- Sim block: cathlab lab exists (JL4, femoral route, views)
- Videos: titles only (m_k3y-2j1Dk, 6Ne-6W_7h_A, kYypi3JXH1I, eTb3Stlg8fU)

## Lesson cp-other-complex-isr-mechanism

- Stent failure as thrombosis or ISR; ST life-threatening, usually STEMI; ISR usually stable angina, sometimes ACS: brilakis p.401 (22.2)
- Restenosis definition (renarrowing at the site of a successful intervention); 'Achilles heel' (paraphrased): oxford p.221
- Three processes: recoil immediate; inflammation and neointimal proliferation weeks/months; negative remodelling months/years; recoil and remodelling largely eliminated by stents; neointima remains between struts: oxford p.221
- Cascade: injury by balloon and stent, platelet activation, local thrombus, recruitment of neutrophils, monocytes, lymphocytes by cytokines and growth factors; mediators stimulate SMC proliferation → intimal hyperplasia; timing depends on presentation (acute/elective) and injury: oxford p.221
- 30–60% at 6 months after balloon angioplasty; BMS from ~25% to 10–15%: oxford p.221; PES/SES reduce TLR to <10% in highly selected trial populations: oxford p.224
- More common in longer lesions, smaller calibre vessels, complex lesions, diabetes, renal failure: oxford p.221
- Angiographic ≫ clinical; clinical ~10%; surveillance angiography inflates repeat revascularisation; controversial surrogate: oxford p.221
- Late lumen loss definition and use as key surrogate: oxford p.224
- Small arteries and long lesions restenose more: brilakis p.404 (22.3.7), p.405 (22.4.7)
- Torrado abstract summary (first-gen DES less restenosis, more late ST; prolonged antithrombotics less ST, more bleeding; second-gen DES less late ST; very late failure risk): ref torrado-stent-failure-2018
- Prevention: correct sizing, optimal expansion, complete coverage; IVUS reduces restenosis; drugs unproven: oxford p.221
- Geographic miss increases restenosis: brilakis p.186 (10.2.3); underexpansion increases ISR and ST: brilakis p.243 (13.3), p.418 (23.2.5)
- Cilostazol may decrease ISR; contraindicated in heart failure: brilakis p.402 (22.2.3)
- History: stent types, sizes, prior failure, prior brachytherapy (lifelong DAPT, very late >1 year ST); current antiplatelets, compliance, recent discontinuation, recent non-cardiac surgery: brilakis p.401–402 (22.2.1)
- Stent enhancement with a balloon in the stent shows fracture or gap: brilakis p.402 (22.2.6)
- Imaging essential in stent failure; neointima, neoatherosclerosis, underexpansion, fracture: brilakis p.403 (22.2.13); IVUS or OCT for cause of stent failure: brilakis p.233 (Table 13.2); determine cause of stent failure before/after PCI: brilakis p.231–232 (13.1)
- OCT mechanisms of failure: malapposition, underexpansion, neoatherosclerosis; OCT greater definition of intimal hyperplasia: oxford p.238
- Physiology can assess significance; imaging preferred in most cases: brilakis p.403 (22.2.12)
- Fig 8.15: angiogram appears not to show severe renarrowing; IVUS before and after further balloon angioplasty and repeat stenting: oxford p.232; IVUS recommended for PCI for ISR: oxford p.232; IVUS assesses expansion of original stent and apposition of new stents: oxford p.222
- Mechanism table: neointima → first ISR repeat DES after confirming well dilated, recurrent DCB or brachytherapy (brilakis p.403); underexpansion/undersizing → 23.2, imaging for sizing and expansion, high-pressure NC postdilatation (brilakis p.402–403); fracture → new stent, hard to wire (brilakis p.402–403); gap → imaging and enhancement to cover gap and old stent (brilakis p.403); malapposition → oxford p.238, correction at implantation in pm-imaging (brilakis p.243)
- Mehran pattern: pointer to Academy cx-isr (ref mehran-isr-1999)
- Videos: titles only (e5kIUY5uCzo, IpOOwMaXOF8, SOJ9u82p59g)

## Lesson cp-other-complex-isr-treatment

- Revascularisation type depends on type of restenosis, prior restenotic events, anatomy, CABG feasibility: brilakis p.402 (22.2.7); severe diffuse or recurrent restenosis may indicate CABG: oxford p.222
- Sub-strut wiring in ST or ISR; manifests as difficulty advancing equipment; prevented by knuckled wire; CTO case 143: brilakis p.402 (22.2.8)
- Balloon difficulty through stents: suspect sub-strut wiring, withdraw, knuckled wire; forceful advancement → longitudinal stent deformation: brilakis p.183 (9.7.13.3.2)
- Fig 27.8 deformed LAD stent crossed with knuckled wire, then balloon and stent delivered: brilakis p.470–471 (27.1)
- Support wire with three distal deflections helps delivery through previously placed stents, tortuosity, calcification; not for primary wiring; exchange via microcatheter/OTW balloon; bends can be placed manually in a workhorse wire: brilakis p.561 (30.7.4)
- Fracture very challenging to wire: brilakis p.402 (22.2.8)
- Meticulous imaging-guided lesion preparation before additional stent: brilakis p.402 (22.2.9)
- 1:1 balloon to distal reference to see full expansion, particularly important for calcified and ISR lesions: brilakis p.169 (9.7.3.2.1)
- Balloon ± cutting balloon may compact restenotic intima: oxford p.222; balloons too short melon-seed, too long damage normal wall: oxford p.218
- Plaque modification balloons score/modify and prevent 'watermelon seeding': brilakis p.570 (30.9.3)
- Fig 23.7 panel B order: high-pressure balloon (shorter, two smaller simultaneous, ≥1 buddy wire) → modified balloon (scoring, nitinol-caged, cutting) → laser → atherectomy (orbital, rotational) → subintimal crossing → CABG; future: IVL, very high-pressure balloon; imaging throughout: brilakis p.416 (image viewed)
- NC up to 26–28 atm, know RBP; prolonged 30–60 s or more: brilakis p.417 (23.2.2)
- Cutting balloon slow, avoid >14 atm; blade fracture, strut avulsion, entrapment: brilakis p.417 (23.2.3)
- Laser 0.9 mm at 80 Hz and 80 mJ/mm²; with simultaneous contrast within underexpanded stent; contrast lasing reserved for in-stent because of dissection; then high-pressure balloon: brilakis p.418 (23.2.6); laser over any 0.014 in. wire; used with contrast to expand underexpanded stents: brilakis p.582 (30.11)
- Stentablation risks: embolisation of stent material or plaque, burr entrapment, stent damage needing more stents; higher risk in recent stents; burrs ≥1.75 mm; in-stent atherectomy higher restenosis than laser; orbital avoided in recently implanted stents; atherectomy reserved: brilakis p.418 (23.2.5); orbital not in recent stents, rotational burr entrapment and stent distortion in recent stents: brilakis p.415 (23.2)
- De novo panel A starts with 'likely to respond to balloon?' and goes atherectomy before laser: brilakis p.416
- Subintimal crossing may allow expansion: brilakis p.418 (23.2.7)
- CABG when all fails; untreated undilatable lesion → more ST and ISR: brilakis p.418 (23.2.8)
- Very high-pressure balloon >40 atm: brilakis p.573 (30.9.7)
- First ISR: repeat DES after confirming well dilated; recurrent: brachytherapy or DCB (not available in US): brilakis p.403 (22.2.10); DES for treatment of restenotic lesions: oxford p.224
- If undersizing/underexpansion: imaging for sizing and expansion; high-pressure NC postdilatation: brilakis p.403
- DCB: paclitaxel and sirolimus most common; used most for ISR, also bifurcations and small vessels; coronary DCB not available in US; peripheral DCB off label in large coronary vessels: brilakis p.573 (30.9.6)
- Brachytherapy: beta radiation within the restenosed segment; indefinite DAPT for ST risk: brilakis p.402 (22.2.9); strontium-90/yttrium source, limited centres, useful for recurrent ISR: brilakis p.597 (30.22)
- Brachytherapy largely superseded by repeat DES: oxford p.222
- Negi: 186 patients, 283 lesions, 95% >2 prior TLR, TLR 12.1% at 1 y, 20.7% at 3 y: ref negi-brachytherapy-2016
- Megaly: 116 patients, TLF 20.1% at 1 y, 32.9% at 2 y; IVUS TLR 14.3% vs 39.6%: ref megaly-brachytherapy-2020
- AGENT IDE: ref yeh-agent-ide-2024 (details above)
- Intentional stent crushing in in-stent CTO with encouraging results: brilakis p.471 (27.1)
- Videos: titles only (uIMcp8QWqzE, yulnmmP24PI, mnqzShZ89zE, RNxl_wf9B2Q)

## Lesson cp-other-complex-stent-thrombosis

- Definition: thrombus within a deployed stent: oxford p.227
- Life-threatening, usually STEMI; often underexpansion or insufficient antithrombotic therapy; rarely fracture: brilakis p.401 (22.2)
- Table 8.5 Dublin/ARC 2006: definite (ACS and angiographic or pathological confirmation), probable (unexplained death within 30 days or target-vessel MI without confirmation or other culprit), possible (unexplained death after 30 days); early within 30 days, late 30 days–1 year, very late after 1 year: oxford p.227–228; ref cutlip-arc-2007
- No single pathophysiology; very late ST after DES sometimes despite DAPT; DES prevents re-endothelialisation: oxford p.227
- Predisposing factors list: oxford p.227; more stents/length may increase restenosis and ST in multivessel PCI: oxford p.255
- Bifurcation stenting increased ST risk; prolonged DAPT if low bleeding risk: brilakis p.295 (16.2.3)
- Uncommon but catastrophic; also in BMS; BMS <1% up to 4 years, DES 1.2–1.3% same period on-label: oxford p.227
- Torrado: second-generation DES reduced late ST: ref torrado-stent-failure-2018
- Noncompliance or non-cardiac surgery within 6–12 months: PCI may be best avoided; medical therapy or CABG: brilakis p.29 (1.1); update pointer to pm-prep-and-stent
- Sizing and expansion; IVUS to prevent malapposition may be beneficial; DAPT adherence crucial; no evidence of heparin/LMWH protection when antiplatelets stopped for surgery: oxford p.227
- Protamine only after all intracoronary equipment removed; ST risk if stents implanted; protamine hypersensitivity: brilakis p.49 (3.4.4)
- Immediate PCI as STEMI: brilakis p.402 (22.2.7); STEMI with prior stenting may be ST: brilakis p.377 (20.1)
- Careful monitoring: brilakis p.402 (22.2.2); haemodynamic support especially in ST: brilakis p.403 (22.2.14)
- Radial or femoral; radial generally preferred in ST with STEMI: brilakis p.402 (22.2.4)
- Wiring challenging; polymer-jacketed can facilitate: brilakis p.402 (22.2.8); escalation workhorse without hydrophilic tip → soft hydrophilic tip → soft polymer-jacketed; avoid stiff polymer escalation (perforation); microcatheter or 1.0–1.5 mm balloon support: brilakis p.379–380 (20.8.1–20.8.2); exchange polymer-jacketed wire for workhorse before balloons and stents: brilakis p.561 (30.7.2)
- Sub-strut wiring and fracture: brilakis p.402 (22.2.8)
- Stent enhancement with balloon in occluded stent: brilakis p.402 (22.2.6); imaging essential: brilakis p.403 (22.2.13); OCT mechanisms: oxford p.238
- Repeat stenting if suboptimal; undersizing/underexpansion: 23.2, imaging for sizing and expansion, high-pressure NC; fracture: new stent; gap: imaging and enhancement to cover: brilakis p.403 (22.2.10)
- Lifelong DAPT after ST unless high bleeding risk: brilakis p.402 (22.2.3), attributed as Brilakis's own position (round 1)
- Prasugrel: relatively small first-line application; usually considered in ST or recurrent ST when other agents failed; not recommended >75 years, <60 kg, active bleeding, stroke/TIA: oxford p.240
- Brachytherapy → lifelong DAPT: brilakis p.401
- Drill: angio-pci LCx STEMI scenario exists (MANUAL_AUTHORING list)
- Videos: titles only (rMle1jEGzqs is titled '22.3 Stent Thrombosis' in the registry, reproduced as given; TDyKZW2fTPA, 3cTsbooCHJI, iCpjeqOSXDk)

## Lesson cp-other-complex-vessel-size

- Small <2.5 mm, large ≥4.0 mm pose additional challenges: brilakis p.403 (22.3)
- Nitroglycerin critical in small arteries (spasm): brilakis p.404 (22.3.6)
- Imaging: true size and positive remodelling, may allow larger stents: brilakis p.405 (22.3.13)
- PCI and CABG harder in small arteries; stenting small arteries increased restenosis especially in diabetes: brilakis p.404 (22.3.7)
- Restenosis commoner in smaller calibre vessels: oxford p.221; NICE DES where vessel <3 mm and/or lesion >15 mm: oxford p.224
- SYNTAX step 11 (≥75% of distal segment <2 mm adds one point per segment): brilakis p.141 (Table in 7.1)
- Physiology very helpful (severity and territory size): brilakis p.404 (22.3.12)
- Avoid aggressive wire manipulation: brilakis p.404 (22.3.8)
- Avoid atherectomy especially if tortuous; avoid oversized balloons (dissections requiring longer stents); DCB can be used: brilakis p.404 (22.3.9)
- Balloon diameter no larger than calibre at lesion; oversizing dissection/rupture; undersizing incomplete preparation: oxford p.218
- Megaly meta-analysis (7 studies, 1,824 patients; DCB vs DES similar TLR and MACE; vs uncoated balloon lower TLR and binary restenosis): ref megaly-dcb-small-vessel-2019
- Smallest stent 2.0 mm; minimise length while covering: brilakis p.404 (22.3.10)
- Large: forceful injection and possibly a guide catheter: brilakis p.404 (22.3.6)
- Aneurysm (focal) or ectasia (diffuse) ≥1.5× adjacent normal: brilakis p.404 (22.3.6); 'more than 1.5 times': brilakis p.133 (6.8.2.10); up to 5% of angiograms; limited outcome data: ref kawsara-aneurysm-2018
- Severity assessment challenging in large vessels; physiology may help: brilakis p.404 (22.3.12)
- Side branches through large vessels: wire prolapse; polymer-jacketed wires and angulated microcatheters: brilakis p.404 (22.3.8); angulated microcatheters section: brilakis p.551 (30.6.3); polymer wire exchange before devices: brilakis p.561 (30.7.2)
- Imaging helpful for sizing; IVUS preferred over OCT (complete filling challenging): brilakis p.404–405 (22.3.9, 22.3.13); IVUS better for large vessels, LMS, aorto-ostial, ectatic/aneurysmal, impaired kidney function: oxford p.238
- Largest DES up to 5.0 mm, expandable to 5.75 mm; others to 5.75 and 5.5 mm; size to distal reference, then larger shorter NC to proximal reference: brilakis p.404 (22.3.10)
- Peripheral stents in very large (≥6 mm) vessels; know expansion limits: brilakis p.186 (10.2.3)
- Peripheral DCB off label in large coronary vessels: brilakis p.573 (30.9.6); peripheral IVL off label in large arteries, smallest 2.5 × 40 mm: brilakis p.573–574 (30.9.8)
- Existing tip reused: pci-stent-size-distal (pm-prep-and-stent)
- Video: title only (wMLOExQnPgA)

## Lesson cp-other-complex-long-lesions

- ACC/AHA type A discrete <10 mm, B tubular 10–20 mm, C diffuse >20 mm: oxford p.212 (Table 8.2)
- SYNTAX: lesion length >20 mm adds one point: brilakis p.141
- Long lesions among multivariate predictors of procedural failure with CTO, unprotected bifurcation, obvious thrombus: oxford p.211
- Restenosis commoner in longer lesions: oxford p.221; NICE DES >15 mm: oxford p.224
- Long lesions → increased restenosis → consider in PCI vs CABG: brilakis p.405 (22.4.7)
- More stents/length may increase restenosis and ST: oxford p.255
- Pullback step-up suggests more focal lesion: brilakis p.406 (22.4.12)
- Pullback technique (fluoroscopy with simultaneous pressure, resting or IV adenosine, stop when radiopaque segment reaches guide tip); multiple lesions: FFR summed, treat biggest gradient first, re-measure; iFR pullback virtual intervention for serial or diffuse; co-registration: brilakis p.225 (12.2.7)
- Fig 12.7 diffuse disease without step-up: PCI challenging (long stents), CABG preferable if feasible: brilakis p.225
- Imaging measures proximal and distal reference and length: brilakis p.406 (22.4.13); long lesions on the list where imaging benefits most; landing zone free of atherosclerosis to avoid geographic miss: brilakis p.231 (13.1)
- IVUS-XPL: lesions ≥28 mm; lower MACE: brilakis p.406; 1,400 patients, 5.8% vs 2.9% at 1 year, driven by TLR: ref hong-ivus-xpl-2015
- Known-length balloon estimate of length: brilakis p.186 (10.2.3)
- Avoid aggressive wire manipulation: brilakis p.405 (22.4.8)
- Distal lesions/segments first: brilakis p.183 (9.7.13.3.1)
- Balloon too short melon-seeds; too long damages adjacent normal wall: oxford p.218
- Cover entire lesion including balloon-injured segments; geographic miss increases restenosis; long stents 40 mm US, 60 mm Europe; long stents hard to deliver through tortuous calcified segments, >1 shorter stents or better preparation and support: brilakis p.186 (10.2.3); longest in US 40 mm; multiple stents for long lesions such as CTOs: brilakis p.405 (22.4.10)
- Existing tip reused: pci-stent-cover-injured-segment
- Sim: physiology lab exists
- Videos: titles only (wMLOExQnPgA, G1HJMOF579I)

## Quiz

- q1: brilakis p.399. q2: brilakis p.400–401. q3: brilakis p.400–401. q4: ref saw-scad-arteriopathies-2014. q5: oxford p.221. q6: brilakis p.402, p.183, p.417. q7: brilakis p.416–418. q8: brilakis p.403, p.597, p.402, p.418; oxford p.222. q9: oxford p.228. q10: brilakis p.401–403. q11: brilakis p.404–405; oxford p.238. q12: brilakis p.225; oxford p.255.

## Cases

- cp-other-complex-case-scad: access p.400; engagement and injections p.400; iatrogenic dissection treated by stenting with reentry as bail-out p.437 (Table 25.1); type 2A p.400; observation 3–5 days p.400; Saw 2014 healing data (ref); imaging may extend p.401, p.240; recurrent ischaemia → PCI or CABG by anatomy p.401; no GP IIb/IIIa or cangrelor p.400; VA-ECMO p.401; no polymer-jacketed wire p.401; unclear wire position, IVUS, no injection through OTW p.380; direct stenting, cutting balloon fenestration, long undersized stents 5–10 mm p.401; cutting balloon 1 atm every 5 s p.571; IMH distal-first, avoid high pressure and balloon protrusion p.445. FMD association: ref hayes-scad-aha-2018.
- cp-other-complex-case-stent-failure: immediate PCI p.402; history items p.401–402; premature discontinuation first predisposing factor oxford p.227; haemodynamic support p.403; radial preferred p.402; wire escalation p.379–380 and p.402, exchange p.561; sub-strut wiring p.402, p.183; deformed stent re-crossed with knuckle p.470–471; imaging essential p.403; enhancement p.402; underexpansion → 23.2 p.402–403; in-stent order p.416–418; burr ≥1.75 mm, orbital in recent stents p.418; repeat stenting if suboptimal, imaging sizing, high-pressure NC p.403; untreated undilatable lesion p.418; lifelong DAPT p.402; prasugrel oxford p.240; no heparin/LMWH protection oxford p.227; aspirin not stopped (case-by-case) oxford p.243 (Table 8.11).

## Round 1 fixes (checker findings): new or changed claims

### cp-other-complex-scad
- Takotsubo after a stressor; angiography often needed to exclude other causes: brilakis p.377 (20.1)
- 62.3% of women postmenopausal; all presented with MI; ST elevation 26.1%: ref saw-scad-arteriopathies-2014 (abstract)
- Femoral access or extra caution with radial; single retrospective series, threefold catheter-induced dissection: ref hayes-scad-aha-2018 (full text, PCI section)
- Heparin started at presentation: consider stopping once SCAD diagnosed if no other indication; DAPT vs aspirin chosen individually: ref hayes-scad-aha-2018 (Anticoagulation and Antiplatelet Therapy)
- DISCO: 199 conservatively managed; 12-month MACE 18.9% DAPT vs 6.0% SAPT, HR 2.62, DAPT independently associated: ref cerrato-disco-2021 (abstract); 'a registry cannot prove cause' is the module's caveat
- Clopidogrel generally not recommended in breastfeeding; low-dose aspirin safe: ref hayes-scad-aha-2018 (pregnancy and lactation section)
- Imaging: Brilakis 'may also cause extension ... used cautiously': brilakis p.401 (22.1.13); 'concerns exist over whether wiring and contrast injection may lead to hydraulic extension': brilakis p.240 (13.3); mechanisms (wire or imaging catheter, guide dissection, hydraulic extension with OCT contrast) and 'only when angiographic diagnosis is uncertain (eg type 3 or unclear lesions)' and vessel large enough: ref hayes-scad-aha-2018 (Intracoronary Imaging)
- Type 1 row: 'the angiogram is usually diagnostic' (type 3 requires imaging if safe: brilakis p.400, 22.1.6); 'imaging not needed' follows the AHA rule above
- Polymer-jacketed wires avoided because of risk of subintimal guidewire entry: brilakis p.401 (22.1.8) ('false lumen already open' removed)
- Cutting balloon slow inflation and deflation: brilakis p.169 (9.7.3.2.5); atherotomes sharper than scalpels, may perforate gloves or skin, damage vessels if not fully deflated before withdrawal: oxford p.218 (Cutting balloon angioplasty)
- Small haematomas conservative 'especially if' tear sealed/stented: brilakis p.445 (25.2.8) (check explanation reworded)
- Beta-blocker HR 0.36 for recurrence in 327-patient Vancouver series: ref hayes-scad-aha-2018 (beta-adrenergic blockers); many clinicians recommend against subsequent pregnancy, few data: ref hayes-scad-aha-2018; FMD screening pointer: Academy cx-scad-anomalous (pci-complex.ts)
- Case c-iatrogenic: avoid contrast injections, if needed non-selective with catheter disengaged; rapid stenting especially proximal; small non-flow-limiting dissections need no treatment; IVUS confirms distal true lumen: brilakis p.437 (25.2.1 treatment list); Table 25.1 p.437
- Case s3/s4 variants for the iatrogenic branch (proximal catheter dissection stented, mid-LAD SCAD separate); s4 stem now says the spontaneous dissection is confined to the mid LAD
- Case outcome and learning points: beta-blocker, antiplatelet plan with breastfeeding, FMD screening, pregnancy counselling: ref hayes-scad-aha-2018
- SCAD check 1 rewritten (shorter key, GP IIb/IIIa one-point distractor); content as before (brilakis p.400)

### cp-other-complex-isr-mechanism
- Cascade wording paraphrased (oxford p.221)
- Underexpansion 'raises the risk' of ISR and ST: brilakis p.243 (13.3 'increases the risk'), p.418 (23.2.5 'can predispose')
- Step 2 relabelled as module advice (no manual source)
- Intracoronary GTN before and after IVUS; spasm <3%; major complications <0.3% incl. dissection, thrombus, catheter entrapment by stent strut: oxford p.231 (Intravascular ultrasound)
- Check explanation: DCB is Brilakis's option for recurrent ISR: brilakis p.403 (22.2.10)
- Mechanism table DES/DCB row: ESC/EACTS accepts either (ref klein-stent-failure-scai-2023 'ESC/EACTS Guidelines give DCBs a class I indication for the treatment of ISR'; ref esc-revasc-2018; Academy complications.ts ISR lesson says both recommended)

### cp-other-complex-isr-treatment
- Sub-strut wiring 'can manifest as difficulty advancing equipment': brilakis p.402 (22.2.8)
- Knuckle ideally with polymer-jacketed wire; if balloon delivery still difficult, rewire again or Glider balloon (bevelled/skived tip for crossing struts, brilakis p.408 (23.1) and p.570 (30.9)) or Wiggle wire (support wire with distal waves, 30.7): brilakis p.470 (27.1.3.10); device names replaced by generic classes
- High-pressure balloon details: RBP and % diameter growth; prolonged 30–60 s or rapid pressure cycling; slightly undersized by 0.5 mm; avoid ballooning non-stented segments and cover all ballooned segments; shorter balloons concentrate force; two undersized balloons side by side; buddy wires as makeshift scoring: brilakis p.417 (23.2.2)
- What can go wrong: perforation avoided with 1:1 or lower sizing and de-airing; balloon rupture → immediate angiography for perforation, air embolism, flow-limiting dissection; sticky balloons, loss of wire position, remove under fluoroscopy: brilakis p.417 (23.2.2); plaque-modification balloons: wire/guide position loss, anchor or guide extension, rupture/perforation, entrapment: brilakis p.417 (23.2.3); laser dissection and perforation: brilakis p.418 (23.2.6); atherectomy risks rise with tortuosity, thrombus, dissections, grafts: brilakis p.418 (23.2.4)
- Laser activated during saline flushing, or contrast within underexpanded stent: brilakis p.418 (23.2.6)
- Atherectomy reserved until high-pressure balloons (with/without buddy wires), laser, or where available IVL or very high-pressure balloon fail; RASER described for highly resistant lesions: brilakis p.418 (23.2.5)
- Subintimal crossing 'may also allow expansion' ('outside the old stent' removed): brilakis p.418 (23.2.7)
- Cutting balloon deflation and Oxford blade warning: brilakis p.169, oxford p.218
- 'Shuttle back and forth' paraphrase of melon-seeding: oxford p.218
- DCB class I in ESC/EACTS; trials/meta-analyses similar DCB vs DES outcomes: ref klein-stent-failure-scai-2023 (DCBs section); ref esc-revasc-2018
- Brachytherapy resurgence for DES-ISR; often reserved for refractory or multilayer ISR; many centres consider recurrence after 2 failed DES layers an indication; 3 or more layers 3-year TLF >50%; third layer almost always underexpanded, avoid: ref klein-stent-failure-scai-2023 (VBT, risk factors, recurrent ISR sections)
- AGENT IDE: lesion <26 mm, RVD >2.0 to ≤4.0 mm, 2:1; cardiac death 2.9% vs 1.6% (HR 1.75, P=.38): ref yeh-agent-ide-2024 (PubMed abstract re-read)
- Sim tasks and module sims[0]: DES or DCB both acceptable, Brilakis's preference stated

### cp-other-complex-stent-thrombosis
- ARC probable: MI in target territory without angiographic confirmation and no other obvious cause: ref cutlip-arc-2007 (Oxford p.228 table words it 'even without angiographic confirmation of thrombosis or other identified culprit lesion'); acute <24 h, subacute 24 h–30 d: ref cutlip-arc-2007, ref klein-stent-failure-scai-2023 (Classification); ARC-2: ref garcia-garcia-arc2-2018
- Frequency paraphrased (oxford p.227); contemporary 0.5–1.0% first year, 0.2–0.6% per year after, higher in ACS (3.4%) and primary stenting for STEMI: ref klein-stent-failure-scai-2023
- Thrombus algorithm: antegrade flow, thrombus size, ongoing ischaemia, 24–48 h antithrombotic therapy with repeat angiography, thrombectomy: brilakis p.380–381 (20.9, Fig. 20.2); stent thrombosis wiring sends to 20.9: brilakis p.402 (22.2.8)
- Repeat stenting 'may be needed if a suboptimal result is obtained': brilakis p.403 (22.2.10); additional stents limited to significant residual dissections, avoided where possible because recurrent ST rises with stent length; edge dissections and disease progression treated: ref klein-stent-failure-scai-2023
- DAPT: lifelong is Brilakis's position (p.402); SCAI: compliance and drug resistance evaluated, more potent therapy (aspirin, prasugrel or ticagrelor) considered; no lifelong rule: ref klein-stent-failure-scai-2023; beyond 12 months when ischaemic risk high and bleeding risk not: pm-antithrombotics (Brilakis 3.5 table)
- Prasugrel: Oxford p.240 (small first-line role, stent thrombosis when other agents failed; not recommended >75, <60 kg, history of active bleeding or stroke/TIA); Brilakis p.50 (3.5.1.2.2: 60 mg load, 10 mg daily, 5 mg for <60 kg or >75 years, contraindicated after prior TIA or stroke); 2023 ESC ACS prasugrel in preference to ticagrelor for ACS proceeding to PCI: ref esc-acs-2023 (as taught in pm-antithrombotics and pci-core)
- Checklist wording: current antiplatelet therapy, compliance, recent discontinuation, recent non-cardiac surgery: brilakis p.402 (22.2.1)
- OCT check rewritten (one-inflation-then-stent distractor; key: expand then re-image)

### cp-other-complex-vessel-size
- NICE criteria labelled historical (oxford p.224); DES in nearly all PCIs, SVG the only subgroup with similar BMS outcomes: brilakis p.585 (30.14); DES for any PCI: ref esc-revasc-2018 (as taught in pci-core and pm-prep-and-stent)
- IVUS preferred: Brilakis contrast filling (p.405, 22.3.13); Oxford lower tissue penetration of infrared light and no contrast needed (oxford p.238); GTN before and after IVUS (oxford p.231)
- DCB 'can also be used in this setting' with no preparation precondition: brilakis p.404 (22.3.9); tip and sim wording changed

### cp-other-complex-long-lesions
- Step-up 'may suggest that the lesion is more focal': brilakis p.406 (22.4.12); 'may be enough' wording
- Drift check: Pd/Pa at guide tip; >1.02 or <0.98 suggests significant drift, re-equalise and repeat: brilakis p.226 (12.2.8)
- Balloon shorter than estimated lesion length to avoid injuring segments that would need longer stents: brilakis p.169 (9.7.3.2.2); all ballooned segments covered: brilakis p.417 (23.2.2)
- NICE row labelled historical; brilakis p.585; ref esc-revasc-2018

### Quiz
- q7 explanation: text places IVL/very-high-pressure balloon before atherectomy where available: brilakis p.418
- q11 option A and explanation: both prefer IVUS for different reasons: brilakis p.405, oxford p.238

### Cases (cp-other-complex-case-stent-failure)
- s5 feedback: thrombus handled per 20.9 (brilakis p.380–381)
- s6 feedback: IVL or very-high-pressure balloon before atherectomy where available: brilakis p.418 (23.2.5)
- s7 rebuilt: stem states IVUS shows target expansion and no edge dissection or residual disease; best = finish without new stent (brilakis p.403 'may be needed if suboptimal'; ref klein-stent-failure-scai-2023); new IVUS-sized DES acceptable; no imaging wrong
- s8: best option prolonged DAPT beyond 12 months, potent P2Y12, adherence, bleeding review; interruption not drug failure (oxford p.240 'when secondary prevention with other antiplatelet agents has failed'); 12-month option feedback reworded; outcome and outcomeVariant reworded

### Tips (trigger changes)
- pci-ocx-scad-stent-long-small: event removed; title 'SCAD needing a stent'; text opens with spontaneous (not equipment-caused) dissection
- pci-ocx-st-wire-escalation: event thrombus only
- pci-ocx-st-lifelong-dapt: event removed; conditional title; SCAI caveat
- pci-ocx-isr-first-or-recurrent: phase plan and lesion-prep, no event; ESC/EACTS either DES or DCB; third layer avoided (SCAI)
- pci-ocx-small-vessel-prep: event removed; 'after good preparation' removed
- pci-ocx-substrut-knuckle, pci-ocx-instent-atherectomy-last, pci-ocx-large-vessel-ivus, pci-ocx-long-pullback, pci-ocx-long-distal-first, pci-ocx-st-fix-mechanism, pci-ocx-imh-distal-first, pci-ocx-scad-plan, diag-ocx-scad-setup: text updated as in the lessons above (same sources)

## Round 2 fixes

- cp-other-complex-scad: the borrowed tip block pci-img-scad-caution (defined in pm-imaging, 15-imaging.ts) removed from the lesson, because its wording ('weigh whether imaging will change management') has no source and conflicts with the lesson paragraph (brilakis p.401, 22.1.13: imaging may extend the dissection, use cautiously; ref hayes-scad-aha-2018: imaging only when the angiographic diagnosis is uncertain and the vessel is large enough). The corrected wording for that tip was returned to the coordinator for 15-imaging.ts (oxford p.324: IVUS better than OCT for wire position in left main dissection because it avoids contrast).
- cp-other-complex-isr-mechanism: refs now include esc-revasc-2018 and klein-stent-failure-scai-2023 for the table row 'ESC/EACTS guidance accepts either a new DES or a drug-coated balloon' (same sources as the isr-treatment lesson).
- pci-ocx-st-fix-mechanism: trigger kept (stent or optimise, stent-underexpanded) because its advice on sizing, checking and post-dilating the new stent applies in those phases (brilakis p.377, 22.2.10); title and first sentence now conditional ('If an old failed stent is the target'), so it no longer reads as advice about an old stent after an ordinary de novo stent; underexpansion treated as a balloon-undilatable lesion: brilakis p.376–377 (22.2.9).
- q9 explanation: 'probable' now reads 'a target-vessel infarct without angiographic confirmation and with no other identified culprit', matching oxford p.227–228 Table 8.5 and ref cutlip-arc-2007, as in the stent-thrombosis lesson.
