# Evidence: pm-prep-and-stent (Lesion preparation and stenting)

Module file: `src/content/manual/pci-manual/12-prep-and-stent.ts`. Page numbers are PDF pages (Brilakis PDF page as in the extracts; Oxford PDF page = printed page + 21).

New references (checked on PubMed for authors, title, journal, year, volume and pages; abstracts read):
- gao-rec-cagefree1-2024: PMID 39236727, Lancet 2024;404(10457):1040–1050. 2,272 patients, de novo non-complex lesions irrespective of vessel diameter, after successful predilatation; DCB with rescue stenting (rescue DES 106/1133, 9.4%) vs intended DES; DoCE at 24 months 6.4% vs 3.4%; non-inferiority not met; authors conclude DES should remain preferred.
- yeh-agent-ide-2024: PMID 38460161, PMC10924708, JAMA 2024;331(12):1015–1024. 600 patients with ISR in the US, paclitaxel-coated vs uncoated balloon; 1-year TLF 17.9% vs 28.6%, HR 0.59; superiority met.
- zhang-doca-tri-2012 (round 1): PMID 23171804, EuroIntervention 2012;8(7):848–854. DOCA-TRI: 187 patients with failed stent or balloon delivery after successful wiring, transradial; randomised to a 5-in-6 double catheter (child catheter inside the guide) or buddy wire/balloon anchoring; technical success 97.9% vs 39.8%; 1-year MACE-free survival 89.4% vs 84.9% (p=0.36). This is the trial Brilakis cites at p.409 as a "5-in-6 guide catheter extension".
- urban-leaders-free-2015 (round 1): PMID 26466021, N Engl J Med 2015;373(21):2038–2047. LEADERS FREE: 2,466 high-bleeding-risk patients, all on 1 month of DAPT; polymer-free drug-coated stent superior to BMS (safety 9.4% vs 12.9%; TLR 5.1% vs 9.8%).
- valgimigli-master-dapt-2021 (round 1): PMID 34449185, N Engl J Med 2021;385(18):1643–1655. MASTER DAPT: high bleeding risk, 1 month after a biodegradable-polymer sirolimus-eluting stent; abbreviated DAPT non-inferior (NACE 7.5% vs 7.7%; MACCE 6.1% vs 5.9%), less bleeding (6.5% vs 9.4%).
- frobert-taste-2013 (round 1): PMID 23991656, N Engl J Med 2013;369(17):1587–1597. TASTE: 7,244 STEMI patients; routine aspiration did not reduce 30-day mortality (2.8% vs 3.0%).
- brilakis-diva-2018 (round 1): PMID 29759512, PMC6402785, Lancet 2018;391(10134):1997–2007. DIVA: 597 analysed patients with de novo SVG lesions; 12-month TVF 17% DES vs 19% BMS, no significant difference.

Existing Academy references used in round 1 (all in src/content/refs.ts, verified): total-2015 (PMID 25853743 re-read: 10,732 STEMI patients; no reduction in the primary outcome, 6.9% vs 7.0%; stroke at 30 days 0.7% vs 0.3%); renovate-2023 (PMID 36876735 re-read: 1,639 patients with complex lesions, 2:1 imaging vs angiography; primary end point of cardiac death, target-vessel MI or clinically driven TVR 7.7% vs 12.3%, HR 0.64); esc-revasc-2018 (DES over BMS for any PCI irrespective of planned non-cardiac surgery or anticipated DAPT duration, as already taught in src/content/tracks/pci-core.ts:2089); esc-ncs-2022 (elective non-cardiac surgery usually deferred about 6 months after elective PCI and 12 months after ACS, as taught in pci-core.ts:671); esc-acs-2023 (routine thrombus aspiration not recommended, as taught in pci-complex.ts:1822; DES standard in primary PCI); esc-ccs-2024 (imaging guidance recommended for anatomically complex lesions such as left main, true bifurcations and long lesions, as taught in pci-core.ts:2593).

Existing references re-read on PubMed for the figures used: basket-small2-2018 (PMID 30170854: 758 patients, de novo lesions <3 mm, after successful predilatation, DCB vs second-generation DES; MACE at 12 months 7.5% vs 7.3%; non-inferior). jeger-dcb-consensus-2020 (PMID 32473887: abstract states DCB use established for ISR of BMS and DES; good efficacy and safety in de novo small-vessel disease and high bleeding risk; no class effect). danami3-defer-2016 is cited only for what the Oxford handbook says about it (p.250).

Notes for checkers
- The Brilakis extract garbles symbols: "#" is ≤, "$" is ≥, "." is >, and en dashes are dropped (e.g. "35 seconds" = 3–5 s, "1220 atm" = 12–20 atm). Confirmed on the page images: p.175 "(4–8 atm)", "7 or 8 Fr", "at least 6 Fr", "at least 7 Fr"; p.179 "3–5 seconds", "5 seconds for each atm, not to exceed 12 atm", "≤1:1 ... 12–20 atm", "≤1:1 ... 12–14 atm", "6–8 atm, not to exceed 12 atm", "30–35 atm", "10–20 seconds"; p.180 "up to 20–26 atm for noncompliant", "(>20 atm)"; p.185 "6–12 months", "2.0 mm stents"; p.186 "(≥6 mm)", "85% of media to media", "40 mm in the United States and 60 mm in Europe", ">1 shorter stents"; p.191 "3–5 seconds", "12–14 atm", "(≥20 atm)", "up to 20 atm for semi-compliant; up to 26-28 atm for noncompliant". Not imaged but same garble pattern: p.169 "(≤1.5 mm)"; p.173 "Small diameter (≤1.5 mm) balloons have only one marker ... Larger balloons (≥2.0 mm) have two markers"; p.178 "1.0–1.50 mm"; p.408–409 "1.0–1.5 mm", "≥2.0 mm should NOT be used for grenadoplasty", "1.5–2.0 mm", "6–8 atm"; p.385 "residual TIMI thrombus grade ≤3", "6 ± 2 days".
- Brilakis chapter 10 cross-refers to "Section 9.5.x" for the balloon steps; the steps are actually numbered 9.7.x in chapter 9 (book's internal numbering slip). The lesson cites 9.7.
- Disagreements taught explicitly: (1) Predilatation: Brilakis p.167–168 (prepare nearly all lesions; primary stenting only for friable SVG or thrombus) vs Oxford p.229 (most lesions need only predilatation; some operators skip it and stent directly). (2) Balloon compliance for predilatation: Brilakis p.169 (non-compliant preferred, reusable for post-dilatation, less deliverable) vs Oxford p.217 (compliant is the standard predilatation balloon; non-compliant for post-dilatation). (3) Side-branch anchor pressure within Brilakis: p.175 "1:1 to the side branch ... relatively low pressures (4–8 atm)" vs p.409 "1.5–2.0 mm ... usually at 6–8 atm"; both given. (4) DES indications: Oxford p.224 (NICE: vessel <3 mm and/or lesion >15 mm; cost, short-term data) is out of date; Brilakis p.185 (newer-generation DES in the vast majority) and Oxford's own primary PCI section p.249 (new-generation DES the standard in STEMI) taught as current; REC-CAGEFREE I added.
- Out of date in the manuals, updated with verified references: coronary DCB not available in the US (Brilakis p.573, p.403) — AGENT IDE (US trial) added; DCB evidence in de novo disease updated with BASKET-SMALL 2 and REC-CAGEFREE I. The number of named device brands is reduced to generic classes per authoring rule 7; stent shaft lengths are given as the range Brilakis lists (140–145 cm, p.187); the largest/smallest DES sizes (p.404) and long-stent lengths (p.186) are attributed to "when the manual was written".
- Omitted on purpose: named products (Sapphire, Threader, Guideliner, Rotaglide/Viperglide, StentBoost/CLEARstent, Resolute Onyx, etc.) replaced by generic classes ("small balloons", "guide extension", "atherectomy lubricant emulsion", "enhanced stent visualisation", "vendor modes"). The detailed balloon-uncrossable algorithm (23.1.1–23.1.9) beyond support is summarised and referred to cp-uncrossable; the undilatable algorithm (23.2) to cp-uncrossable; calcium modification to cp-calcium; POT to cp-bifurcation-provisional; imaging criteria to pm-imaging.
- Lesson 8 sentence "Some X-ray systems offer a stent enhancement mode that shows the deployed stent far more clearly than ordinary fluoroscopy" paraphrases Brilakis's "stent imaging enhancement tools" / "X-ray imaging modes" that "help evaluate stent expansion" (p.173, p.191); no mechanism is claimed.
- Round 1 fixes: all 42 checker findings were verified against the pages below and applied. Copy check: the only remaining 8-word runs are the bibliographic citations of zhang-doca-tri-2012 and brilakis-diva-2018 (author names and the published article titles, which also appear in Brilakis's reference lists); no prose run remains. Inline check option lengths were rebalanced: in none of the 17 lesson checks is the correct option now strictly the longest.
- Possible issues in existing Academy lessons (for the fixer): (a) pci-core `pci-bs-balloons` formula note says predilatation "usually uses a ratio slightly below 1:1 (around 0.8–1.0)"; Brilakis p.169 sizes 1:1 to the distal reference for most lesions (Oxford p.218: no larger than the vessel). Not wrong as a range but differs from Brilakis's default; consider citing both. (b) pci-core `pci-proc-stent` says "Remove any buddy wire" before deployment and `pci-guides-escalation` table says the buddy wire "must come out before the stent is deployed"; Brilakis p.175 and p.409 describe the deliberate buddy-wire stent anchor, in which a proximal stent traps a buddy wire on purpose; "must" overstates it. (c) `pci-guides-escalation` table: "Deep intubation ... safer with smaller guides" is not found in either manual (Brilakis p.175/p.188: deep intubation increases support but may cause dissection, usually RCA/SVG); source should be checked. (d) `cx-small-diffuse` gives DCB technique numbers (residual ≤30%, 30–60 s inflation, 0.8–1.0 predilatation) citing jeger-dcb-consensus-2020; these could not be confirmed from the abstract in this session (full text not in PMC).

## Lesson pm-prep-and-stent-prep-why

- Goal: prepare lesion to facilitate stent delivery and expansion: brilakis p.167 (9.1)
- Preparation (mostly balloon) in nearly all lesions; three reasons (delivery and less stent loss; sizing, especially without imaging and with poor distal contrast flow; expansion and need for further modification such as atherectomy, "stent-regret"): brilakis p.167 (9.2)
- Oxford: preparation aims for easy uncomplicated stent delivery and vessel compliance permitting full expansion; particularly important in calcified and thrombus-bearing lesions: oxford p.229
- Maximally dilate before stent; cracking a resistant lesion after stenting very difficult: oxford p.218
- Algorithm (Fig. 9.1): wiring; large thrombus → thrombectomy; severe calcification → atherectomy; degenerated SVG / small thrombus; balloon angioplasty; good flow? (vasodilators); balloon expansion?; stenting: brilakis p.167
- No preparation before successful wiring; confirm optimal distal wire position: brilakis p.168 (9.3)
- Large thrombus → thrombectomy often (9.4); severe calcification → atherectomy or intracoronary lithotripsy (9.5): brilakis p.168
- Step 2 caveat (selective, bail-out thrombectomy; routine aspiration not recommended; reserved for large thrombus burden; TASTE and TOTAL): oxford p.249 (ch 8 Primary PCI); ref total-2015 (no benefit, more stroke at 30 days); ref frobert-taste-2013 (no mortality benefit); ref esc-acs-2023 (routine aspiration not recommended)
- Opening paragraph: the sentence on a stent that cannot reach the lesion or stays narrow states the purpose of preparation (brilakis p.167, 9.1–9.2); no ranking of causes is claimed
- Sizing reason: "especially when no intracoronary imaging is used and when there is poor flow of contrast distal to the target lesion"; the lesson says only that the distal vessel is then hard to judge: brilakis p.167
- Pearl: full 1:1 balloon expansion suggests no additional lesion modification is needed: brilakis p.169 (9.7.3.2.1); initial balloon angioplasty can give a false impression of adequate preparation in severely calcified lesions: brilakis p.356 (19.9.1); imaging recommended before stenting to ensure sufficient preparation: brilakis p.374 (19.10)
- Primary stenting "may be preferred in few lesion types, such as" degenerated SVG with friable lesions, or thrombus when no thrombectomy planned or thrombectomy fails (examples, not a closed list): brilakis p.168 (9.6)
- Poor antegrade flow → vasodilators, thrombectomy may be performed, unless due to dissection → stenting: brilakis p.184 (9.8)
- Confirm good balloon expansion before stenting, especially heavy calcium, to prevent underexpansion: brilakis p.184 (9.9)
- Primary stenting should never be performed in heavily calcified lesions; underexpansion raises restenosis and stent thrombosis risk: brilakis p.356 (19.9)
- Direct stenting a cause of stent loss; avoid direct stenting especially in tortuous calcified vessels: brilakis p.465 (27.1)
- Planning: prior challenges expanding the lesion; severe calcification → consider atherectomy, laser, IVL if available; large thrombus → antithrombotic treatment and thrombectomy: brilakis p.35 (1.9)
- Changing guide after wire crossing may lose wire position: brilakis p.409 (23.1.3.1)
- Step 1: wire through lesion and several cm distally, not into small distal branches; contrast injection to confirm, reposition if suboptimal; perforation risk, especially branches close to the lesion where the balloon may enter: brilakis p.168 (9.7.1)
- Oxford: wire as distally as possible; differential stiffness gives support at the lesion; less chance of being displaced backwards; care with hydrophilic wires very distal: oxford p.216
- Step 2: back-bleed Y-connector; aspirate guide then fill with contrast; goal no air or debris: brilakis p.168 (9.7.2)
- Distal embolisation causes (air sucked in during balloon withdrawal, more with large balloons; thrombus/plaque into guide, bulky large or plaque modification balloons); prevention aspiration then flushing; air: 100% oxygen, possibly aspiration, intracoronary epinephrine in arrest, usually resolves with supportive measures; plaque/thrombus: thrombectomy: brilakis p.169 (9.7.2.3)
- Oxford: most lesions require only predilatation; some operators skip it (direct or primary stenting); adjuncts list (rotational atherectomy, cutting balloon, distal protection, thrombectomy, IVUS, pressure wire): oxford p.229
- Multiple or long lesions: distal first because distal delivery may fail after proximal inflation: brilakis p.183 (9.7.13.3.1)
- Check 1 explanation: brilakis p.356, p.465; check 2: brilakis p.168

## Lesson pm-prep-and-stent-balloon-choose

- Thirteen balloon steps (9.7.1–9.7.13): brilakis p.168–183
- Oxford balloon catheter components (low-profile hypotube with inflation device connection, monorail segment, balloon with radio-opaque markers, chamfered nosecone): oxford p.217
- Diameter 1:1 to distal reference for most lesions, to see whether it fully expands; particularly important for calcified and ISR lesions: brilakis p.169 (9.7.3.2.1)
- Crossing very tight lesions: small balloons ≤1.5 mm first: brilakis p.169
- Oxford: diameter no larger than vessel calibre at lesion; oversizing dissection or rupture; undersizing incomplete preparation: oxford p.218
- Many operators predilate at about 0.8–1.0 to the reference: existing Academy lesson pci-bs-balloons (src/content/tracks/pci-core.ts:1967, :2038); Brilakis's 1:1 purpose (full expansion means no further modification needed): brilakis p.169
- Length shorter than estimated lesion length (avoid injuring segments requiring longer stents): brilakis p.169 (9.7.3.2.2); Oxford: too short may melon-seed, too long may damage normal wall: oxford p.218
- Non-compliant preferred (usable for postdilation), less deliverable: brilakis p.169 (9.7.3.2.3)
- Oxford compliance definitions (compliant standard for predilatation, unpredictable at high pressure; non-compliant for post-dilating stents; semi-compliant controlled compliance): oxford p.217
- Monorail for vast majority (simpler, no long wires, stiffer shaft): brilakis p.169 (9.7.3.2.4); OTW requires exchange-length wires, now usually restricted to CTO: oxford p.217
- Nominal pressure (manufacturer-specified size; 2.5 mm example) and rated/burst pressure (beyond which not designed; rupture and dissection risk): oxford p.218
- Plaque modification balloons: nitinol wires or cutting blades; harder to deliver (profile, flexibility); cutting balloon slow inflation and deflation; can facilitate undilatable lesions; very-high-pressure balloon useful, not available in US: brilakis p.169 (9.7.3.2.5)
- Cutting balloon atherotomes sharper than scalpels, may perforate gloves/skin, damage vessels if not fully deflated before withdrawal; incise fibrotic or calcified lesions: oxford p.218
- Step 4 preparation (remove from packaging; luer-lock syringe usually 50% contrast/50% saline; lower contrast faster but less visible; connect to hub; negative suction plunger up; connect indeflator, negative suction); finger injury from stylet, remove slowly from hoop: brilakis p.170 (9.7.4)
- Invisible balloon: saline instead of contrast or air remaining; label syringe; remove air; re-prepare: brilakis p.170 (9.7.4.4.1)
- Step 5 loading (thumb and index finger of left hand, tip on middle finger at an angle; right hand advances balloon; syringe plunger groove variation): brilakis p.170–171 (9.7.5)
- Step 6: wire back end fixed by assistant/second operator/other hand; standard Y-connector opened then closed; automated haemostatic valves no need to open; damage from tightly closed valve, cutting balloons higher risk; replace damaged balloon: brilakis p.171 (9.7.6)
- Check explanations: brilakis p.169, p.170

## Lesson pm-prep-and-stent-balloon-inflate

- Inflate: rotate indeflator arm to target under fluoroscopy; 3–5 s; cutting balloon 5 s per atm not exceeding 12 atm (prevent blades puncturing balloon, blade entrapment in calcified spicules); NC ≤1:1 12–20 atm; compliant ≤1:1 12–14 atm; cutting 6–8 atm not >12; very-high-pressure balloon 30–35 atm; duration 10–20 s: brilakis p.179 (9.7.9.2)
- Suboptimal expansion → longer inflations or higher pressures (up to 20–26 atm NC): brilakis p.180
- Internal discrepancies footnoted: very-high-pressure balloon 30–35 atm (p.179) vs ">40 atm" (p.573, 30.9.7); cutting balloon "not to exceed 12 atm" (p.179) vs ">14 atm inflation pressures should be avoided" (p.417, 23.2.3); follow the device's instructions
- Rupture "How to avoid it" addition (only NC balloons go higher, within their chart and rated burst pressure): brilakis p.180 (up to 20–26 atm NC), p.417 (know the rated burst pressure and diameter growth of NC balloons); oxford p.218 (rated pressure)
- Undilatable definition (cannot be expanded despite multiple high-pressure balloon inflations): brilakis p.416 (23.2); avoid stenting an undilatable lesion: brilakis p.416
- First step of the undilatable algorithm (NC at high pressure, often up to 26–28 atm, know rated burst pressure and % diameter growth; prolonged inflations 30–60 s or more, or rapid pressure cycling at high pressure; slightly undersized usually by 0.5 mm; avoid injuring non-stented segments, cover all ballooned segments; shorter balloons concentrate force; two undersized balloons side by side; one or more buddy wires): brilakis p.417 (23.2.2); then plaque modification balloons (23.2.3) and atherectomy: brilakis p.417–418, Fig. 23.7 p.416
- Pitfall: rapid inflation is a cause of watermelon seeding (no claim that it hides a waist): brilakis p.180 (9.7.9.3.2)
- Pitfall: never beyond the balloon's rated pressure: oxford p.218; brilakis p.417
- Rupture: causes (complex, highly calcified; >20 atm); prevention (atherectomy or IVL first; avoid >20 atm); suspect sudden indeflator pressure drop; fluoroscopy confirms; treatment: immediate suction to prevent contrast forcefully exiting and causing perforation; remove balloon; aspirate guide for air; angiography; if perforation new balloon delivered and inflated at site: brilakis p.180 (9.7.9.3.1)
- Watching indeflator rather than screen allows more rapid deflation on rupture, stated for grenadoplasty (deliberate rupture of a small 1.0–1.5 mm balloon; ≥2.0 mm must not be used): brilakis p.408–409 (23.1.2, items 1 and 3); the lesson attributes it to that context and adds only that the habit also helps catch an unintended rupture
- Watermelon seeding causes (severe lesion, severe angulation, excessive guide movement, short balloon, rapid inflation); prevention (gentle traction if slipping forward, gentle push if backward; slow inflation; longer balloon); treatment (immediately deflate; repeat at lower pressures and slower; buddy wires; plaque modification balloon; longer balloons): brilakis p.180 (9.7.9.3.2)
- Undilatable: causes severe calcification, ISR; prevention atherectomy before balloon in heavy calcium; diagnosis waist on fluoroscopy; treatment Section 23.2; imaging helps: brilakis p.180–181 (9.7.9.3.3)
- Deflate: rotate to decrease, pull back and lock to create vacuum; several seconds, longer for longer and larger balloons: brilakis p.181 (9.7.10)
- Failure to deflate: lesion or stent recoil, strangulation in guide, hypotube damage; avoid kinking shaft, replace kinked balloon; entrapment 27.3: brilakis p.181 (9.7.10.3.1)
- Withdraw: confirm full deflation on fluoroscopy; withdraw monitoring guide and wire; if guide "sucked into the vessel" stop, reposition; traction on guide: brilakis p.182 (9.7.11)
- Guide-induced dissection: forceful withdrawal sometimes before full deflation; prevention (avoid forceful withdrawal, ensure deflated, partially disengage guide, independent-hand technique left hand pulls guide, right retracts balloon); treatment (maintain wire, stenting): brilakis p.182 (9.7.11.3.2)
- Remove from guide: left hand fixes wire outside Y-connector, right withdraws to left fingers; then right fixes, left withdraws: brilakis p.182 (9.7.12)
- Wire position loss causes (suboptimal fixing, >20 atm inflations making balloons sticky, sticky wire, kinking, wrapping) and prevention (wipe with wet gauze, small movements, avoid kinking and remove a kinked wire after inserting another intact wire, fluoroscopy of tip if challenging, trapping, separate and wipe multiple wires); treatment rewire: brilakis p.182–183 (9.7.12.3.1)
- Check result: aspirate and flush; confirm engagement; contrast; or intravascular imaging to minimise contrast: brilakis p.183 (9.7.13)
- Two gates before stenting (flow; balloon expansion): brilakis p.184 (9.8, 9.9)
- Pearl: creeping pressure fall during stent balloon inflation = continued expansion: brilakis p.191 (10.2.9.2)
- Check explanations: brilakis p.180

## Lesson pm-prep-and-stent-delivery

- Stent steps mirror balloon steps: brilakis p.185 (10.2), p.187
- Step 7: left hand holds Y-connector, thumb and index fix wire; advance without fluoroscopy until first marker (90 cm guide) or second marker (100 cm guide) at Y-connector; then under fluoroscopy to guide tip: brilakis p.171 (9.7.7.2); Fig. 9.4 90 cm (distal) and 100 cm (proximal) markers: brilakis p.173
- Pulsed fluoroscopy typically 7.5 fps, lower image quality, ideal for scouting, wiring, balloon and stent delivery; modern systems store a few seconds of fluoroscopy: oxford p.33
- Resistance causes/prevention/treatment (wire wrapping round guide extension delivery rod, guide kinking, too much equipment, wrapped wires; push rod in a towel; remove extra equipment; compatibility app for 6, 7, 8 Fr; remove and reinsert extension; remove equipment; replace kinked guide): brilakis p.172 (9.7.7.3.1)
- Shaft kinking (forceful advancement, resistance; small bites; small kinks continue, do not straighten; large kinks discard, fracture risk): brilakis p.172 (9.7.7.3.2)
- Inadvertent advancement into coronary (poor visualisation esp. obese; inattention to markers; prevention; withdraw and angiography for dissection or perforation): brilakis p.172 (9.7.7.3.3)
- Independent-hand technique (right hand: middle and ring fingers hold Y-connector, thumb and index the shaft, wire between ring and little finger; left hand holds and advances guide) and two-hand technique (left holds Y-connector and wire, right advances shaft): brilakis p.173 (9.7.8.2); stents: independent technique preferred: brilakis p.187 (10.2.8.2)
- Position confirmed with landmarks (clips, previous stents) and/or contrast: brilakis p.173; minimise contrast in CKD; coregistration with imaging or physiology: brilakis p.187
- ≤1.5 mm balloons one marker in middle, cannot assess length; ≥2.0 mm two markers: brilakis p.173
- Stent enhancement tools facilitate balloon placement inside previous stents: brilakis p.173
- Shaft not long enough: very distal lesions, prior CABG distal to anastomoses; short or shortened guides; longest shafts; stent shaft lengths 140–145 cm (three brands listed); guide extensions may allow safer deep intubation and better alignment: brilakis p.174 (9.7.8.3.1), p.187 (10.2.8.3.1)
- Failure to reach/cross: proximal disease, tortuosity, calcification, highly stenotic lesion, high-profile, non-compliant or used balloons: brilakis p.174; stents add poor lesion preparation; prevention treat proximal vessel, good preparation: brilakis p.187–188
- Resistance at previous stent: wire under strut; rewire, ideally after knuckling proximally: brilakis p.177, p.189; forceful advancement may lead to longitudinal stent deformation: brilakis p.183 (9.7.13.3.2); knuckled wire through prior stent: brilakis p.402 (22.2.8)
- Wire and guide position loss (forceful advancement; avoid force, monitor guide and distal wire, optimal coaxial guide; re-engage and rewire): brilakis p.179 (9.7.8.4.1), p.190 (10.2.8.4.1)
- Loss of distal vessel visualisation causes and treatments (tight lesion: withdraw, inject until contrast distal, readvance to trap contrast; dissection: stent; embolisation: thrombectomy and vasodilators; spasm: IC nitroglycerin; prevention avoid oversized balloons, adequate preparation, nitroglycerin): brilakis p.179 (9.7.8.4.2), p.190 (10.2.8.4.2)
- Stent loss causes and prevention (forceful advancement, deformation; meticulous preparation; avoid force; do not push proximal stent outside guide if not advancing; coaxial guide when withdrawing): brilakis p.190 (10.2.8.4.3)
- Extended stent-loss cause list (tortuosity and calcification, poor preparation with ROTAXUS stent loss 2% without vs 0.5% with rotational atherectomy, direct stenting, 5 Fr guides, forceful withdrawal into guide or extension, catching extension collar, advancement through a previously deployed stent, retrograde collateral delivery): brilakis p.465 (27.1.1); prevention (avoid direct stenting especially in tortuous and calcified vessels; meticulous preparation, often atherectomy in calcified lesions and intracoronary imaging to confirm adequate expansion before stent delivery; stent distal to proximal; guide extension for stents in tortuous and calcified vessels; avoid forceful advancement; push rod under towel beside Y-connector; do not force through extension, remove and reinsert): brilakis p.465 (27.1.2)
- Oxford: guiding catheters behave differently from diagnostic (thinner walls); stable coaxial position "particularly important for PCI" (no comparison with other settings is made; the lesson now says "especially important in PCI"): oxford p.229
- Check explanations: brilakis p.171, p.190

## Lesson pm-prep-and-stent-support

- Support definition, friction-based retrograde force, loss of visualisation and expulsion of equipment: oxford p.214
- Five groups, presented without a prescribed order (Fig. 9.6 and Fig. 10.3; the only ordered algorithm is the balloon-uncrossable one, Fig. 23.1 p.407): guide (larger French, supportive shape, access site, forward push/independent hand, deep intubation, guide extension, anchor side branch/distal); wire (buddy ≥1, support, wiggle, buddy balloon, deep wiring, rewire through prior stent); proximal vessel + lesion (PTCA, plaque modification balloon, atherectomy rotational/orbital/laser, IVL); balloon (smaller, compliant) / stent (shorter, thin-strut, bending); other (deep breath, lubricant administration): brilakis p.174, p.189
- 7 or 8 Fr stronger than 5 or 6 Fr; EBU stronger than JL4; AL1 stronger than JR4: brilakis p.175 (9.7.8.3.2.1); EBU "much stronger"; AL1 or 3D Right; truly complex lesions femoral 8 Fr supportive guides: brilakis p.188
- Femoral stronger than radial; long sheaths; left radial for RCA, right radial for left coronary: brilakis p.175
- Forward push increases support but may cause prolapse and disengagement; independent-hand technique: brilakis p.175, p.188
- Deep intubation increases support, may cause dissection; usually RCA or SVG, rarely left: brilakis p.175, p.188
- Oxford Table 8.4 support ladder (LAD JL3.5/4, AL2, XB/EBU3.5; Cx JL4/5, AL2, Voda/XB/EBU3.5/4; RCA JR4, AR1/2, Hockey Stick/AL1/2); JR4 more support if deep-throated without trauma; larger calibre (8>7>6) more support; plan ahead to avoid switching mid-PCI; extra-support shapes buttress contralateral aortic wall: oxford p.213–214
- Changing guide after wire crossing may lose wire position (unacceptable e.g. CTO); second wire possibly via second guide: brilakis p.409–410 (23.1.3)
- Guide extensions: among most common tools; increase support and "modify" proximal vessel: brilakis p.175, p.189
- Trial Brilakis cites as a randomised 5-in-6 guide extension trial: brilakis p.409 (23.1.3.1.1) and its reference list (DOCA-TRI, EuroIntervention 2012;8:848–54, p.420). Details taught (187 patients in whom delivery had already failed; 5 Fr child catheter in a 6 Fr guide; technical success 97.9% vs 39.8%; no difference in 1-year MACE): ref zhang-doca-tri-2012. That rapid-exchange extensions work on the same principle: brilakis p.175, p.409 (extensions add support and carry the device past the proximal vessel)
- Extension risks (wire/guide position loss, distal injury; ostial or mid-vessel dissection; wedged position damped trace, avoid guide injections, hydraulic dissection; distal marker dislodgement; stent deformation or stripping at proximal collar, subclavian curve in radial; 40 cm instead of 25 cm cylinder in radial cases): brilakis p.409
- Side-branch anchor (most commonly used; balloon in proximal side branch; long balloon, wipe hydrophilic coating with wet gauze; 1:1 to side branch; 4–8 atm): brilakis p.175; (workhorse wire; conus or acute marginal for RCA, diagonal for LAD; 1.5–2.0 mm balloon; usually 6–8 atm; chest pain possible): brilakis p.409 (23.1.3.1.2)
- Distal anchor (balloon inflated distal to or at the occlusion; two guidewires; at least 6 Fr, better 7 or 8 Fr; second wire and balloon withdrawn before deploying to avoid trapping): brilakis p.175–176 (Fig. 9.8)
- Buddy wire stent anchor: brilakis p.175, p.409; risks (inability to remove buddy wire; failure to advance equipment through proximal stent): brilakis p.410
- Anchor limitations (injury usually inconsequential in small branches; 1:1 and low pressure; distal dissection with distal anchor needing extensive stenting; ≥7 Fr often needed; side-branch anchor may modify proximal anatomy and hinder antegrade wiring; ischaemia rarely, when large branches such as diagonals are used (nothing is said about small branches); arrhythmia or instability with prolonged conus occlusion; intermittent deflation): brilakis p.175–176; side-branch dissection infrequent, perforation rare, avoid oversizing, workhorse wire; position loss while advancing anchor balloon: brilakis p.409–410
- Buddy wire increases support and straightens vessel; support wires; wiggle wire; partial wire withdrawal; balloon over buddy wire to deflect: brilakis p.176–177, p.189
- Deep wiring technique (polymer-jacketed wire into ventricle/aorta through arterioluminal communications, which increases wire support, no qualifier; gentle, tactile, fluoroscopy without contrast; redirect if fails; perforation if continuing against resistance; ventricular extrasystoles/tachyarrhythmias usually resolve): brilakis p.177–178
- Support wire inserted via microcatheter: brilakis p.356 (19.8)
- Oxford: wire as distally as possible for extra support at lesion: oxford p.216
- Proximal vessel preparation (balloon, atherectomy, IVL): brilakis p.178 (9.7.8.3.2.3); adequate preparation facilitates delivery and expansion and minimises stent loss: brilakis p.189
- Small 1.0–1.5 mm balloons cross resistant lesions; marker in middle so longer length preferred; compliant more flexible, lower profile; used balloons less deliverable: brilakis p.178 (9.7.8.3.2.4)
- Shorter and thinner-strut stents easier; bending may help but increases stent loss risk: brilakis p.190
- Deep breath (straightening arteries or changing guide seating); lubricant administration may reduce friction: brilakis p.179, p.190
- Balloon-uncrossable algorithm lines (small balloon and grenadoplasty first line; increase support second; microcatheter and wire cutting/puncture third; laser and atherectomy fourth; subintimal techniques fifth; combinations): brilakis p.407 (Fig. 23.1)
- Grenadoplasty caveats (usually 1.0–1.5 mm balloon; ≥2.0 mm should NOT be used; suction immediately on rupture; meticulous preparation to remove all air): brilakis p.408–409 (23.1.2)
- Pitfall reworded (more force instead of a measure from the five groups): avoid forceful advancement, brilakis p.179, p.190; five groups p.174, p.189
- Check explanations: brilakis p.409, p.175

## Lesson pm-prep-and-stent-when

- Goal of stenting: deliver and adequately expand a stent completely covering the lesion: brilakis p.185
- Stenting prevents recoil, reduces acute closure risk (dissection, rupture, thrombus), reduces restenosis: brilakis p.185 (10.1)
- Do-not-stent list (poor antegrade flow unless dissection, stenting in no-reflow worsens it; inability to expand; high risk to an important branch that cannot be protected; very small vessel, 2.0 mm stents available): brilakis p.185
- Stent only after successful wiring, (in most cases) preparation, optimal distal wire position: brilakis p.185
- Restenosis mechanisms (recoil immediate, neointima weeks/months, negative remodelling months/years); recoil and negative remodelling largely eliminated by stents; restenosis 30–60% at 6 months in balloon era; BMS reduced from around 25% to 10–15%: oxford p.221
- Restenosis commoner in longer lesions, smaller calibre vessels, complex lesions, diabetes, renal failure; angiographic restenosis much commoner than clinical, which occurs in approximately 10%: oxford p.221
- PAMI: stenting in primary PCI not associated with mortality benefit, only lower reinfarction or urgent revascularisation: oxford p.249
- Stents initially bail-out devices for abrupt closure after dissection; shown to reduce restenosis vs POBA; near-universal elective use paralleled reduction in death, MI, emergent CABG: oxford p.219
- DAPT planning question (bleeding history or risk, compliance): brilakis p.35 (1.10)
- Avoid stent (DES or BMS) if possible if non-cardiac surgery needed within 6–12 months: brilakis p.185 (10.2.3.2.1), citing ch10 ref [3] Banerjee et al., J Am Coll Cardiol 2017;69:1861-70 (PMID 28385315, doi 10.1016/j.jacc.2017.02.012; PubMed article type Review), so taught as 'citing a 2017 review'; book copyright 2020/2021 postdates the 2018 ESC/EACTS guideline, so not described as written before current guidance
- Current practice: DES over BMS for any PCI irrespective of planned non-cardiac surgery or anticipated DAPT duration: ref esc-revasc-2018 (as in pci-core.ts:2089); HBR managed with a DES and short DAPT: ref urban-leaders-free-2015 (DCS beat BMS with 1 month DAPT in both arms), ref valgimigli-master-dapt-2021 (stopping DAPT at 1 month non-inferior); surgery timing (defer elective surgery about 6 months after elective PCI, 12 months after ACS): ref esc-ncs-2022 (as in pci-core.ts:671)
- Newer-generation DES in vast majority (less restenosis, less stent thrombosis than BMS) except SVG where similar: brilakis p.185; SVG DES = BMS (Fig. 18.1): brilakis p.336; DIVA numbers: ref brilakis-diva-2018; guideline still recommends DES for every PCI: ref esc-revasc-2018
- Stenting over thrombus (usually delayed until after thrombectomy with large burden; if thrombectomy fails, stenting may trap thrombus and restore flow; can still embolise, "cheese grater" effect; thrombus can cause undersizing and malapposition): brilakis p.385 (20.10)
- Thinner struts higher deliverability, lower visibility; brand by studies, lesion, availability and cost: brilakis p.185
- Oxford DES indications (high restenosis risk; restenotic lesions; NICE vessel <3 mm and/or lesion >15 mm) and considerations (cost, short-term data, combinations, stent thrombosis): oxford p.224
- New-generation DES the new standard in STEMI (benefit mainly repeat revascularisation): oxford p.249
- 2018 European guidelines do not recommend BRS outside clinical studies: oxford p.225
- STEMI RCA culprit without knowledge of left anatomy: may need haemodynamic support or CABG, so balloon angioplasty only may be preferable: brilakis p.378 (20.5); "holding step" framing follows from the same passage (the reason is the unknown left anatomy); stenting the culprit with new-generation DES the standard in primary PCI: oxford p.249; ref esc-acs-2023
- Observation without stent after thrombus aspiration advocated, especially small culprit vessel; Escaned 28 STEMI patients: TIMI 3, residual TIMI thrombus grade ≤3, no significant residual stenosis, no significant distal embolisation; vessel patent at repeat angiography after 6 ± 2 days: brilakis p.385 (20.10.1); caveat (small observational series; routine aspiration not recommended): oxford p.249; refs total-2015, frobert-taste-2013
- Deferred stenting rationale; DANAMI-DEFER no improvement with deferred stenting 48 h after primary PCI, more urgent target-vessel revascularisation; guidelines do not recommend: oxford p.249–250
- Consider POBA only for distal anastomotic lesions (IMA grafts) (Fig. 18.1): brilakis p.336
- First ISR episode: repeat DES after confirming lesion well dilated; recurrent ISR best with brachytherapy or DCB (not available in US): brilakis p.403 (22.2.10)
- Small vessels <2.5 mm: brilakis p.403 (22.3); nitroglycerin so arteries do not look small from spasm: p.404 (22.3.6); stenting small arteries increased restenosis risk, especially diabetes: p.404 (22.3.7); avoid aggressive wire manipulation: p.404 (22.3.8); atherectomy generally avoided, especially if highly tortuous; oversized balloons avoided (dissection, longer stent); DCB can be used: brilakis p.404 (22.3.9)
- DCB definition (paclitaxel and sirolimus most common; released on inflation; decreases restenosis); used most often for ISR, also bifurcations and small vessels; coronary DCB not available in US, although peripheral DCBs used off label in some patients with large coronary vessels: brilakis p.573 (30.9.6)
- Oxford mentions drug-eluting balloons only in antiplatelet duration Table 8.8: oxford p.242
- BASKET-SMALL 2 numbers: ref basket-small2-2018
- AGENT IDE numbers: ref yeh-agent-ide-2024
- REC-CAGEFREE I numbers and conclusion: ref gao-rec-cagefree1-2024
- DCB consensus statements (established for ISR of BMS and DES; good data in de novo small vessels and high bleeding risk; no class effect): ref jeger-dcb-consensus-2020
- "Applied only after successful predilatation" is now claimed only for BASKET-SMALL 2 and REC-CAGEFREE I (both abstracts state randomisation after successful predilatation); AGENT IDE and the flow condition dropped
- Check explanations: brilakis p.185, p.184, p.378; oxford p.250; refs above

## Lesson pm-prep-and-stent-deploy

- Goal (deliver, expand, cover): brilakis p.185; thirteen stent steps referencing balloon steps: brilakis p.185–191
- Diameter by angiography and/or imaging; imaging facilitates accurate sizing and confirms preparation: brilakis p.186 (10.2.3.2.2)
- Match distal reference; proximal sizing → distal dissection or perforation (tapering); side branch occlusion due to carina shift; POT with larger balloon to proximal reference: brilakis p.186
- Know expansion limits when proximal much larger (left main, aneurysmal); Fig. 10.1 five platforms with labelled post-dilatation limits by size group; peripheral stents in ≥6 mm vessels: brilakis p.186
- Largest DES 5.0 mm expandable to 5.75 mm; smallest 2.0 mm; minimise stent length in small vessels; distal reference sizing then larger shorter NC proximally: brilakis p.404 (22.3.10)
- Imaging sizing: distal reference, or 85% of media-to-media: brilakis p.186
- Length: cover entire lesion including segments injured by balloon; geographic miss increases restenosis; 40 mm US, 60 mm Europe; length by known-length balloon or IVUS/OCT pullback; long stents hard through tortuous calcified segments, >1 shorter stents, better preparation, more support: brilakis p.186
- Poor size selection consequences (failure to deliver, perforation if too big, geographic miss if too short): brilakis p.186–187 (10.2.3.3); table row 1 parenthesis (long stents challenging through tortuous and calcified segments): brilakis p.186; stent-loss claim removed
- Pearl: geographic miss from a stent too short or excessive injury during preparation (no cause ranked): brilakis p.186, p.192 (10.2.13.3.2); balloon shorter than the lesion: brilakis p.169
- Small vessels <2.5 mm, restenosis risk especially diabetes, nitroglycerin before sizing: brilakis p.403–404 (22.3, 22.3.6, 22.3.7)
- Imaging guidance recommended in anatomically complex lesions: ref esc-ccs-2024
- Stent balloon preparation (50/50; lower concentration faster but less visible; syringe upside down suction; connect indeflator; many operators do not apply indeflator suction; with contemporary stents risk very low and suction usually applied): brilakis p.187 (10.2.4)
- Oxford stent construction (premounted on monorail balloon, sized by final expanded diameter and length; 316 L stainless steel, cobalt/chromium, cobalt/nickel; tubular slotted closed-cell high metal coverage and radial strength, less flexible; modular open-cell more flexible, better side-branch access; coil largely superseded); self-expanding stents fallen out of favour for coronary work, principally due to unacceptably high restenosis rates: oxford p.219
- Position: independent technique preferred; landmarks and contrast; minimise contrast in CKD; coregistration: brilakis p.187; radio-opaque markers indicate stent ends: oxford p.230
- Suboptimal placement causes (patient or operator movement, cardiac motion); deploy only when optimal; rapid pacing; additional stent if incompletely covered; ostial stent protruding into aorta can be snared and removed: brilakis p.191 (10.2.9.3.1)
- Stent from distal to proximal; distal stent sometimes needed later (distal edge dissection): brilakis p.465 (27.1.2)
- Deploy: target pressure under fluoroscopy; 3–5 s; 12–14 atm; followed in most cases by ≥20 atm postdilation with shorter NC; longer inflation better expansion; continued pressure decrease = continued expansion, continue inflation: brilakis p.191 (10.2.9.2)
- Oxford: deploy at not less than nominal, preferably sufficient to expand whole device; customary short imaging run with stent balloon fully expanded; high-pressure inflations with stent balloon not always desirable as balloon ends may overhang and traumatise adjacent segments: oxford p.230
- Restenosis prevention (correct sizing, optimal expansion, complete coverage; IVUS reduces restenosis): oxford p.221; stent thrombosis predisposing factors include malapposition or undersizing; IVUS to prevent malapposition may be beneficial: oxford p.227
- Check explanations: brilakis p.186, p.191

## Lesson pm-prep-and-stent-result

- Postdilation ≥20 atm with shorter NC in most cases; exceptions (excellent expansion on imaging; thrombus or plaque embolisation concern; large jailed branch): brilakis p.191 (10.2.9.2)
- Higher pressures: up to 20 atm semi-compliant, 26–28 atm NC; longer inflations: brilakis p.191
- Proximal segment post-dilated with larger shorter NC to proximal reference: brilakis p.186, p.404
- Oxford: if stent not fully deployed, post-dilate with semi- or non-compliant balloon: oxford p.230
- Oxford: stenting and post-dilation high risk of distal embolisation in primary PCI (deferred stenting rationale): oxford p.249
- Step 13 sequence (aspirate and flush; confirm engagement; nitroglycerin; contrast; StentBoost/CLEARstent; IVUS/OCT or physiology to assess and minimise contrast): brilakis p.191 (10.2.13.2)
- Enhanced stent visualisation uses: placement inside previous stents p.173; expansion p.191; waist diagnosis p.192; SB ostium coverage and deformation p.326 (16.2); stent fracture or gap by placing a balloon in the occluded stent p.402 (22.2.6); calcified lesions with imaging p.374 (19.10); contrast-sparing list p.495 (28.3, Table 28.1, which also lists high fps acquisition to evaluate the final result)
- Oxford cine: higher dose and frame rate, high-resolution images saved for recording/diagnosis, main source of patient radiation, use sparingly; pulsed fluoroscopy for delivery: oxford p.33 (no link to the final result is claimed for Oxford)
- High fps acquisition (15 or 25 fps) to evaluate the final result: brilakis p.495 (Table 28.1)
- Underexpansion (causes severe calcification, ISR, suboptimal preparation; prevention meticulous preparation; diagnosis waist, imaging, enhancement; treatment 23.2): brilakis p.191–192 (10.2.13.3.1)
- Incomplete coverage (short stent, excessive injury; length from balloon or pullback; avoid predilation outside lesion; residual stenosis at edge; additional stents): brilakis p.192 (10.2.13.3.2)
- Distal edge dissection (oversizing and/or very high pressure; incomplete coverage esp. lipid-rich plaque; prevention; lucency at edges, slow or no flow, flap on IVUS/OCT; additional stent for significant): brilakis p.192 (10.2.13.3.3)
- Side-branch occlusion (jailing; plaque and carina shift; wire important branches; balloon or stent SB first; POT proximal to carina; slow or no flow; balloon and/or stent SB): brilakis p.192 (10.2.13.3.4)
- Final result in at least two orthogonal views with wire removed (distortion and artefact); success final diameter stenosis <20%: oxford p.230
- Check first with the wire still across: Brilakis's step 13 checks the result (and treats edge dissection with an additional stent while maintaining the wire) before any wire removal: brilakis p.191–192 (10.2.13); Academy two-stage finish (views with wire in, then remove the wire and repeat): src/content/tracks/pci-core.ts:2624–2625, :3300
- Imaging guidance in complex lesions (left main, true bifurcations, long lesions): ref esc-ccs-2024 (as in pci-core.ts:2593); RENOVATE-COMPLEX-PCI numbers (1,639 patients; 7.7% vs 12.3%; HR 0.64; composite of cardiac death, target-vessel MI, clinically driven TVR): ref renovate-2023; imaging before and after stenting in calcified lesions: brilakis p.374 (19.10)
- OCT post-intervention findings (malapposition, underexpansion, geographic miss, edge dissection, tissue prolapse): oxford p.238
- Stent thrombosis predisposition by malapposition/undersizing: oxford p.227; stent underexpansion leads to restenosis and stent thrombosis: brilakis p.402 (22.2.9). The lesson no longer says malapposition causes restenosis.
- Check explanations: brilakis p.191–192; oxford p.249

## Quiz

- q1: brilakis p.167, p.180–181, p.185 (do-not-stent: inability to expand), p.180 (>20 atm rupture risk; NC up to 20–26 atm), p.416–417 (undilatable definition; NC often up to 26–28 atm within rated burst pressure); oxford p.217 (compliant unpredictable at high pressure), p.218 (oversizing dissection or rupture); stem rewritten so the lesion is truly undilatable (prolonged inflations at 26 atm)
- q2: brilakis p.179
- q3: brilakis p.180
- q4: brilakis p.175, p.176, p.409–410
- q5: brilakis p.176 (Fig. 9.8 panel E), p.175 (buddy wire stent anchor), p.409 (guide change)
- q6: brilakis p.177, p.183, p.189, p.402
- q7: brilakis p.185
- q8: brilakis p.186
- q9: ref gao-rec-cagefree1-2024, yeh-agent-ide-2024, basket-small2-2018
- q10: brilakis p.191
- q11: oxford p.230; explanation note on wire-in views first: brilakis p.191–192
- q12: brilakis p.409 (guide change risk; trial cited), ref zhang-doca-tri-2012 (trial details), p.175, p.188 (AL1 vs JR4), p.179, p.190 (force → position loss), p.465

## Cases

- pm-prep-and-stent-case-calcified-rca: presentation calcium grade (moderate: densities seen only with cardiac motion before contrast): brilakis p.355 (19.1); s1 brilakis p.169, p.356, p.465; s1 balloon-first or upfront atherectomy as two approaches: brilakis p.356 (19.9.1); s1 imaging option (angiography underestimates calcium, 38% vs 73%: p.355; imaging encouraged: p.356, 19.6; OCT calcium arc, thickness and length predict underexpansion: p.417, 23.2.1); s1 oversized compliant feedback: oxford p.217–218, brilakis p.169; c-direct brilakis p.190, p.465; s2 brilakis p.180–181, p.185, p.416–417 (prolonged high-pressure NC inflations, up to 26–28 atm, know rated burst pressure); 30 atm option feedback p.417, p.180; c-rupture brilakis p.180; s3 brilakis p.186; s4 brilakis p.175, p.179, p.188–190, p.409; c-push brilakis p.179, p.190; s5 brilakis p.175, p.176, p.409, ref zhang-doca-tri-2012; c-longer brilakis p.186, p.190; s6 brilakis p.191 (longer inflation better expansion; falling pressure = still expanding), oxford p.230; s7 brilakis p.191, p.374 (imaging after stenting to ensure expansion), p.191–192 (checks with wire in), oxford p.230 (wire-out final views).
- pm-prep-and-stent-case-lcx-flow: s1 brilakis p.168; c-branch brilakis p.168 (perforation, Chapter 26); s2 brilakis p.184, p.185; c-stent-no-reflow brilakis p.185, p.191 (embolisation exception); s3 brilakis p.185; refs gao-rec-cagefree1-2024, basket-small2-2018, yeh-agent-ide-2024; brilakis p.378 (balloon-only example); s4 brilakis p.191; s5 brilakis p.192; c-edge brilakis p.182 (maintain wire, stent); s6 brilakis p.191–192 (step 13 with the wire across), oxford p.230 (wire-out final views). s2 and c-stent-no-reflow ECG details (lateral ST elevation, reciprocal V1–V3 depression) are synthetic case narrative.
- Clinical details in the presentations and outcome narratives are synthetic.

## Lab tips

- pci-prep-wire-check-before-balloon: brilakis p.168; oxford p.216
- pci-prep-clear-the-guide: brilakis p.168–169, p.183
- pci-balloon-size-and-length: brilakis p.169; oxford p.218
- pci-balloon-prep-visible: brilakis p.170
- pci-balloon-open-the-valve: brilakis p.171
- pci-balloon-inflation-numbers: brilakis p.179
- pci-balloon-rupture-suction: brilakis p.180 (tone now caution, anticipatory title; no balloon-rupture event exists in LAB_EVENTS)
- pci-balloon-watermelon: brilakis p.180; oxford p.218 (tone now caution, anticipatory title; no balloon-slip event exists in LAB_EVENTS)
- pci-balloon-waist-stop: brilakis p.180 (>20 atm rupture risk; NC up to 20–26 atm), p.180–181, p.184, p.185, p.416–417 (definition; NC often up to 26–28 atm; know rated burst pressure)
- pci-balloon-withdraw-deflated: brilakis p.181–182
- pci-delivery-marker-then-screen: brilakis p.171, p.173
- pci-delivery-small-bites: brilakis p.172, p.179, p.190
- pci-delivery-old-stent-rewire: brilakis p.177, p.183, p.189, p.402
- pci-delivery-withdraw-coaxial: brilakis p.190, p.465
- pci-support-five-levers: brilakis p.174, p.189, p.409 (no fixed order is given; "combine early" removed)
- pci-support-extension-wedge: brilakis p.409
- pci-support-side-branch-anchor: brilakis p.175–176, p.409–410
- pci-support-distal-anchor-out: brilakis p.176
- pci-support-buddy-wire: brilakis p.176–177, p.189
- pci-support-deep-breath: brilakis p.179, p.190
- pci-stent-not-into-no-reflow: brilakis p.184, p.185
- pci-stent-check-dapt-and-surgery: brilakis p.35, p.185; refs esc-revasc-2018, urban-leaders-free-2015, valgimigli-master-dapt-2021, esc-ncs-2022
- pci-stent-size-distal: brilakis p.186
- pci-stent-cover-injured-segment: brilakis p.186
- pci-stent-cardiac-motion: brilakis p.191
- pci-stent-hold-the-inflation: brilakis p.191; oxford p.230
- pci-optimise-nc-postdilate: brilakis p.191; oxford p.230
- pci-optimise-show-the-stent: brilakis p.173, p.191, p.326, p.495 (trigger now phase optimise only, since the advice is routine)
- pci-optimise-edge-dissection: brilakis p.192 (trigger widened to phases stent, optimise and complication)
- pci-optimise-side-branch-loss: brilakis p.192
- pci-optimise-final-views: oxford p.230; brilakis p.191–192 (wire in first)
- Case calcified-RCA s1 direct-stent feedback: preparation in nearly all lesions: brilakis p.167 (9.2); primary stenting reserved for a few lesion types such as degenerated SVGs with friable lesions or thrombus: brilakis p.168 (9.6); angiography underestimates calcium: brilakis p.355 (19); direct stenting a cause of stent loss, avoid especially in tortuous and calcified vessels: brilakis p.465 (27.1.1, 27.1.2). The 'never in heavily calcified lesions' rule (p.356, 19.9) is no longer used as the reason because the case grades the lesion as moderately calcified.
