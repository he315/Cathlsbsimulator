# Evidence: cp-cto-antegrade (Chronic total occlusions: antegrade crossing)

Module file: `src/content/manual/complex-pci/10-cto-antegrade.ts`. Page numbers are PDF pages (Brilakis PDF page = printed page + 26; Oxford PDF page = printed page + 21). Brilakis ch 21 (pp. 389–398) read in full, with pp. 392–394 read as page images.

New references (module `refs` export; each checked on PubMed this session, abstract read, full text read where a PMCID is given):
`colombo-star-2005` (PMID 15789384; Catheter Cardiovasc Interv 2005;64(4):407–411; Brilakis ch 21 ref 33),
`whitlow-fast-cto-2012` (PMID 22516395; JACC Cardiovasc Interv 2012;5(4):393–401; ref 39),
`karacsonyi-crossboss-first-2018` (PMID 29413236; JACC Cardiovasc Interv 2018;11(3):225–233; ref 40),
`galassi-mini-star-2012` (PMID 21956876; Catheter Cardiovasc Interv 2012;79(1):30–40; ref 42),
`azzalini-vessel-architecture-2018` (PMID 28303648; Catheter Cardiovasc Interv 2018;91(4):725–734; ref 20),
`danek-adr-registry-2016` (PMID 27088405, PMC4862911 full text; Int J Cardiol 2016;214:428–437; ref 47),
`hirai-spm-2018` (PMID 29068126; Catheter Cardiovasc Interv 2018;91(6):1035–1042; ref 36),
`wu-apcto-reentry-2020` (PMID 31769597, PMC7754104 full text; Catheter Cardiovasc Interv 2020;96(7):1423–1433, epub 2019),
`christopoulos-stick-swap-2015` (PMID 26332885; J Invasive Cardiol 2015;27(9):E199–E202; no DOI in PubMed),
`alexandrou-base-2023` (PMID 37676010; Catheter Cardiovasc Interv 2023;102(5):834–843),
`roy-side-base-2018` (PMID 29266669; Catheter Cardiovasc Interv 2018;92(1):E15–E19),
`giangiacomi-scratch-go-2024` (PMID 39387319; Catheter Cardiovasc Interv 2024;104(6):1220–1224),
`wu-apcto-antegrade-2025` (PMID 39967211, PMC11840268 full text; JACC Asia 2025;5(2):219–230; added in fixer round 1).
Existing refs reused: `cto-consensus-2019` (PMID 31356129, abstract re-read: principle 3 microcatheter), `tajti-progress-hybrid-2018`, `brilakis-cto-algorithm-2012`, `harding-apcto-algorithm-2017`, `vo-move-the-cap-2016` (PMID 26332640, abstract re-read), `karatasakis-cap-ambiguity-2016`, `wu-global-cto-algorithm-2021` (PMID 34412818, abstract only), `galassi-eurocto-consensus-2019` (all defined in cp-cto-strategy).

## Notes for checkers

- Extract garbles confirmed on page images: p.392 "proximal cap crossing of 1–2 mm" ("12 mm" in the extract); p.394 Fig 21.4 (dual angiography; ambiguous cap, poor distal target, interventional collateral; length < 20 mm; wire escalation vs dissection re-entry; fail arrows). p.587 "4 atm" and "0.009 in." read from the extract (no dash ambiguity).
- Scope: the manuals do not describe BASE, scratch-and-go, STRAW, stick-and-swap, bobsled, the bougie technique, LAST, contrast-guided STAR or mini-STAR. Brilakis names "move the cap techniques" (pp.390, 394), "wire-based strategies" (refs 41, 42) and "dedicated reentry systems" (p.393) only. Those techniques are taught strictly from the abstracts (and the two PMC full texts) listed above, and the lesson says so ("Neither manual describes these techniques step by step").
- Scratch-and-go: the name is not defined in any abstract as such. The lesson ties it to Vo 2016 (subintimal entry proximal to the cap "using a stiff coronary guidewire") and to Giangiacomi 2024, whose abstract names "the scratch-and-go ... technique" with a stiff wire used to enter the subintimal space. BASE is named and expanded in Alexandrou 2023 (title) and Roy 2018; the balloon detail ("slightly oversized balloon") is from Vo 2016.
- Device names: none in lesson text. Generic names used: "blunt dissection catheter" (CrossBoss), "re-entry balloon system" and "stiff re-entry wire" (Stingray LP balloon and wire), "rotational microcatheter", "dual-lumen microcatheter", "guide extension", "support catheters" (MultiCross/CenterCross/NovaCross/Prodigy). Product names appear only inside reference citations and in video notes where the video title itself names a device ("CrossBoss First randomised controlled trial"). Catheter curve names used in cases: EBU, AL.
- Disagreements taught explicitly: (1) first wire: Oxford p.263 stiff heavyweight wires vs Brilakis p.392/p.150 soft tapered first for tapered caps; (2) confirming wire position by injection through an OTW balloon or microcatheter: Oxford p.263 suggests it; Brilakis p.159 and p.438 warn it extends a subintimal dissection; (3) 6 Fr guides and trapping the re-entry balloon: Brilakis p.160 (6 Fr prevents trapping of OTW balloons, the dissection catheter and the re-entry balloon) vs Wu 2020 (LP version trappable in 6 Fr with a dedicated trapping balloon or trapping guide extension; walked out of 5 Fr over a 300 cm wire); (4) hybrid ADR reaching the distal cap with a primary knuckle or dissection catheter (Danek 2016 introduction; Fig 21.4) vs Asia Pacific AWE-first with knuckles only for "long plus" CTOs (Wu 2020); (5) hybrid failed-AWE → ADR vs Asia Pacific parallel wiring or re-entry balloon (harding-apcto-algorithm-2017, Wu 2020).
- Possible issues in existing Academy lessons (pci-complex `cx-cto`, for the fixer): (a) `cx-cto-hybrid` ADR step "Advance a knuckled polymer-jacketed wire (a loop that cannot perforate easily)" is broadly right, but Brilakis p.453 says knuckled wires "are not safe" for distal perforation and p.154 that a knuckle perforation is larger; worth a qualifier. (b) `cx-cto-hybrid` ADR step "Decompression techniques exist if it happens" is unspecific; STRAW through the re-entry balloon is the named technique (Wu 2020). (c) `cx-cto-safety` wire table maps "Stiff, polymer-jacketed (Pilot type)" to "Knuckle wire for dissection; tracking through long occlusions"; Brilakis Table 30.8 (p.565) gives antegrade crossing when the course is unclear, knuckle formation and re-entry during ADR; consistent. (d) Same items (a)–(c) of cp-cto-strategy's notes about `cx-cto-safety` stop rules (3 hours; eGFR vs creatinine clearance) still apply.

## Lesson cp-cto-antegrade-awe-kit

- AWE = antegrade wiring, wires advanced in original direction of blood flow; most widely used CTO crossing technique: brilakis p.392 (21.8.1)
- PROGRESS CTO: 3,122 procedures; final successful crossing strategy AWE 52.0% (retrograde 27.1%, ADR 20.9%, i.e. of successfully crossed lesions; technical success 87%): ref tajti-progress-hybrid-2018
- Later algorithms not by length alone: Asia Pacific weighs ambiguity, calcium, tortuosity, length, previous failure: ref harding-apcto-algorithm-2017 (abstract); global algorithm step 6 'antegrade wiring strategies': ref wu-global-cto-algorithm-2021 (abstract); AW the prevailing technique, intentional subintimal tracking with knuckle up front for 'long plus' (long, ambiguous course, tortuosity, heavy calcium): ref wu-apcto-antegrade-2025
- Hybrid: antegrade when no ambiguous cap / poor distal target with interventional collateral; wire escalation when length < 20 mm: brilakis p.394 (Fig 21.4)
- Microcatheter essential for wire manipulation and exchanges (principle 3): ref cto-consensus-2019
- Microcatheters routinely used for wire support in CTO; increase tip stiffness and penetration; reshape tip; exchanges; protect proximal vessel; injection: brilakis p.541–542 (30.6)
- Insert wire together with microcatheter, bypassing introducer: brilakis p.149 (8.1); preload into microcatheter: brilakis p.151 (8.4)
- Five microcatheter categories (large, small, angulated, dual-lumen, plaque modification): brilakis p.149, p.541
- Large microcatheters usually used for CTO support; can be spun; avoid overspinning: brilakis p.542 (30.6.1)
- OTW balloon alternative: cheaper, stiffer, kinks, marker in middle of small balloons: brilakis p.149 (8.1); better support than many microcatheters, cheaper: brilakis p.541
- Microcatheters preferred to OTW balloons (tip marker, more flexible, track better, kink less; kinked shaft prevents exchanges): brilakis p.540
- Microcatheter care: over-rotation → deformation, entrapment, fracture proximal to tip, wire binding (fatigue); flush after contrast to avoid wire stickiness; exchange a fatigued microcatheter: brilakis p.558 (30.6.6); delivery of coils, fat or thrombin for perforation: brilakis p.542 (30.6 item 6)
- Oxford: OTW balloons add support to prevent wire tip deflection: oxford p.263; OTW balloons now usually restricted to CTO PCI: oxford p.217
- Workhorse: soft tip usually ≤1 g, no polymer jacket; exchange aggressive wires for workhorse before delivery: brilakis p.561 (30.7.1)
- Polymer-jacketed groups; soft tapered and stiff for CTO; soft non-tapered for non-CTO and collateral crossing: brilakis p.561 (30.7.2), p.565 (Fig 30.74, Table 30.8)
- Tip loads: soft tapered 0.6–1.2 g; soft non-tapered 0.8–2.1 g; stiff 1.7–4.1 g: brilakis p.565 (Table 30.8)
- Soft tapered = front-line antegrade CTO wires, one used for knuckle: brilakis p.565 (Table 30.8)
- Stiff polymer-jacketed: antegrade crossing when course unclear, knuckle formation, re-entry during ADR: brilakis p.565 (Table 30.8)
- Stiff tapered-tip wires for resistant proximal caps, moderate vs strong penetrating power: brilakis p.561 (30.7.3)
- Composite-core intermediate-penetration wire as blunt-cap starting option: brilakis p.392 (21.8.1). Distinct from composite-core advanced workhorse wires for tortuous non-CTO lesions: brilakis p.149 (8.2.2 option 1). (Row rewritten in fixer round 1; 'torquable' not claimed.)
- Polymer jacket: facilitates tortuosity and collaterals; risk of distal perforation and subintimal tracking/dissection; use only when necessary; exchange before balloons and stents: brilakis p.561 (30.7.2)
- Core-to-tip stiffer (push, torque, support); shaping ribbon floppier, less traumatic; hydrophilic coatings help occluded vessels: oxford p.215
- Oxford CTO wires: stiff heavyweight, prevent deflection, aid cap penetration, often hydrophilic; perforation not uncommon, tamponade: oxford p.263
- Oxford evolving approaches: ultrasonic and laser guide wires for long occlusions: oxford p.263. Not part of current algorithms: refs wu-global-cto-algorithm-2021 (abstract steps), wu-apcto-antegrade-2025 (full text, not mentioned)
- First wire by cap (tapered/functional with visible channel → low-penetration tapered polymer-jacketed, escalate; blunt → intermediate polymer-jacketed or composite core; stiff high-penetration for resistant caps or areas of resistance in body): brilakis p.392 (21.8.1)
- CTO initial wire usually polymer-jacketed tapered; stiff highly penetrating wires (jacketed or not) often used: brilakis p.150 (8.2.2)
- Distal bend smaller than target vessel diameter; one bend to reach, another to cross in CTOs; two bends for large vessels/angulated ostia: brilakis p.150 (8.3.2)
- Start with small bend; easy to add, hard to remove: brilakis p.151 (8.3.3)
- Right-handed operators push/pull with left, rotate with right in complex lesions: brilakis p.153 (8.6.2.4)
- Continuous short rotations to avoid tip lodging/dissection: oxford p.216
- Keep tip free: withdraw and readvance, or parallel wire: brilakis p.153–154 (8.6.2.5)
- Change damaged tip, ideally via microcatheter and trapping: brilakis p.154 (8.6.2.8)
- Support catheters (self-expanding scaffold, nitinol wires, soft balloon): brilakis p.538 (30.4); increase backup and penetration force: brilakis p.539; ≥10 mm proximal landing zone; cannot be trapped, 300 cm wire: brilakis p.539
- 6 Fr may limit IVUS cap penetration (cross-reference, pitfall): brilakis p.390 (21.5)
- Check 1 (microcatheter support at the cap): brilakis p.541–542; oxford p.263
- Check 2 (blunt cap first wire): brilakis p.392
- Tip pci-cto-antegrade-microcatheter: brilakis p.149, p.541–542, ref cto-consensus-2019; tip pci-cto-antegrade-first-wire: brilakis p.392, p.150

## Lesson cp-cto-antegrade-awe-crossing

- Small changes (tip angulation, change wire; no same-class restriction) before bigger changes: brilakis p.394 (21.8.5)
- Raise backup force before penetration force at a tough proximal cap (supportive guide, side-branch anchor, coaxial balloon anchor, guide extension): ref wu-apcto-antegrade-2025 ('The Tough Proximal Cap')
- Anatomy dictates body crossing (four approaches, wire classes, no Gaia Next 2 or stiffer with an unclear course, decision up front but not rigid, only IVUS shows the space used, ADAPT for tough distal caps): ref wu-apcto-antegrade-2025
- Stiff, tapered and polymer-jacketed wires more likely to perforate small distal branches: brilakis p.453 (26.4 causes); 1–2 mm rule stated for proximal cap, stiff wires allowed for resistance within the body: brilakis p.392
- Opening sentence: advancing microcatheters, balloons or stents over an exited wire creates or enlarges a perforation: brilakis p.392
- Escalation to intermediate and high penetration as required: brilakis p.392
- Step-up/step-down: de-escalate after 1–2 mm of proximal cap crossing: brilakis p.392 (image checked)
- Escalate/de-escalate as standard CTO technique: brilakis p.154 (8.6.2.9)
- Reference image, intermittent injections, contralateral injection key principle, orthogonal views: brilakis p.154 (8.6.2.6)
- Three positions and actions (true lumen → microcatheter in, exchange to workhorse to minimise distal injury/perforation; exits → withdraw and redirect without advancing microcatheters, balloons or stents; subintimal → redirect, else leave for parallel wire with dual-lumen microcatheter or IVUS, or ADR): brilakis p.392–393 (21.8.1)
- Oxford clues to extraluminal passage: abnormal course or motion with cardiac cycle; multiple ventricular extrasystoles: oxford p.263
- Subintimal advancement significantly distal to distal cap → haematoma, luminal compression, lower success: brilakis p.393
- Calcification and tortuosity increase subintimal (extraplaque) entry: brilakis p.391 (21.6.2)
- Distal caps calcified/resistant in vessels bypassed distal to CTO; bifurcation at distal cap hinders antegrade wiring, side-branch loss; retrograde favoured: brilakis p.391 (21.6.3)
- IVUS confirms true lumen / re-entry: brilakis p.159 (8.7.4), p.395 (21.13.1); solid-state preferred for CTO crossing (images closer to tip): brilakis p.243 (Table 13.4)
- Workhorse wire through advanced microcatheter: no resistance in true lumen, significant resistance if subintimal: brilakis p.438 (25.2)
- Microcatheter injection if subintimal enlarges the space / extends dissection: brilakis p.159 (8.7.4), p.438 (25.2)
- Oxford: dye through OTW balloon or multifunctional probing catheter (not a microcatheter) when no antegrade flow to confirm intra- vs extraluminal: oxford p.263
- Perforation recognition and first response: dye accumulating in pericardium or pulsatile exit; tamponade not uncommon; rapid pericardiocentesis, fluids, prolonged balloon inflation; protamine and covered stent may be needed: oxford p.263. Balloon to occlude, IV fluids/vasopressors, pericardiocentesis if hypotension, notify surgeons: brilakis p.449 (Fig 26 universal algorithm); coils or fat through microcatheter for distal perforation: brilakis p.542; wire hole small and self-sealing, equipment over it enlarges it: brilakis p.449 (26.x cause 4)
- Exchange stiff/polymer-jacketed wire immediately after crossing: brilakis p.160 (8.8.3), p.454 (26.4 prevention 3); more likely to perforate: brilakis p.453–454
- Replacement wire options (workhorse, support, atherectomy wire): brilakis p.150 (8.2.2 item 5)
- Trapping preferred; steps (withdraw into guide, balloon next to not over wire); 15–20 atm: brilakis p.160, p.162
- Trapping balloon 2.5 mm for 6 or 7 Fr, 3.0 mm for 7 and 8 Fr; length ≥20 mm; polymer-jacketed wires slip: brilakis p.160, p.162
- Back-bleed after trapping (air entrained, embolism): brilakis p.162
- Hydraulic exchange avoided in CTO PCI, especially stiff tapered or stiff polymer-jacketed wires (inadvertent advancement, perforation): brilakis p.163
- Wire extension alternative (specific extension for each wire maker): brilakis p.163 (8.9.2.3)
- 6 Fr: OTW balloons, dissection catheter and re-entry balloon cannot be trapped; 6 Fr with 0.071 in. ID traps low-profile microcatheters; dedicated trapping balloons trap in smaller guides; guide extension with built-in trapping balloon in 6–8 Fr: brilakis p.160 (8.9.2.1)
- Trapping details: monorail preferred to OTW trapping balloons; stylet to pass the valve; balloon beyond the distal marker near the primary curve; shaft markers unreliable with short guides; multiple devices in one guide likely to fail; deformed balloon replaced; pressure damped during trapping; continuous saline flush alternative to prevent air; anchor balloon reused (≥2.5 mm in 6–7 Fr, ≥3.0 mm in 8 Fr); works over 300 cm wires: brilakis p.160–162
- Hydraulic exchange also avoided for OTW balloons and the re-entry balloon (friction, loss of wire): brilakis p.163
- Order: trapping first, extensions second, hydraulic avoided: brilakis p.453 (26.4 cause 2); circumcision cumbersome, for wire entrapped in microcatheter or when extensions/trapping not possible: brilakis p.164 (8.9.2.4)
- Check 1 (wire exit): brilakis p.392; oxford p.263. Check 2 (exchange in 7 Fr): brilakis p.160, p.163
- Drill: escalation soft tapered → intermediate → stiff tapered only if needed: brilakis p.392
- Tips: pci-cto-antegrade-step-down (brilakis p.392, p.394, p.154; ref wu-apcto-antegrade-2025); pci-cto-antegrade-confirm-lumen (brilakis p.392, p.159, p.438, p.243); pci-cto-antegrade-trap-exchange (brilakis p.160–163, p.454)

## Lesson cp-cto-antegrade-parallel

- Subintimal: redirect; if fails leave in place to guide second wire (parallel wire), dual-lumen microcatheter or IVUS; alternatively ADR (three options; no number of redirections given): brilakis p.392–393; change to retrograde: brilakis p.394 (21.8.5); avoid excessive single-wire redirection, move promptly: ref wu-apcto-reentry-2020 (2.2, 3.5)
- Leave wire, advance second next to it (general wiring): brilakis p.154 (8.6.2.5)
- Dual-lumen microcatheter: monorail lumen over first wire, new wire through OTW lumen; trapping to remove: brilakis p.153 (8.5.3.2)
- Dual-lumen uses in CTO PCI (parallel wiring; side branch adjacent to proximal cap; wiring distal vessel when crossing went into a distal side branch without losing access); tips: hard to deliver, stiffening mandrel, side-port direction hard, trapping balloon for withdrawal: brilakis p.558 (30.6.4)
- IVUS-guided antegrade re-entry requires 8 Fr guides, IVUS expertise, limited wire manoeuvrability with subintimal IVUS catheter: brilakis p.393 (the lesson applies the same constraints to IVUS-guided parallel wiring as an inference); parallel wiring 'facilitated by IVUS': brilakis p.392; 6 Fr guides may limit IVUS-guided cap penetration: brilakis p.390 (21.5)
- Solid-state IVUS preferred for CTO crossing: brilakis p.243
- Hybrid: AWE fail → ADR: brilakis p.394 (Fig 21.4); Asia Pacific: parallel wiring or re-entry balloon after failed antegrade wiring: ref harding-apcto-algorithm-2017; ref wu-apcto-reentry-2020
- Mechanism (parallel = intraplaque wire puncturing distal cap; re-entry balloon = from subintimal space beyond distal cap at a re-entry zone): ref wu-apcto-reentry-2020
- Factor table (soft distal cap; first wire intraplaque with control; mid-RCA cap; calcium in re-entry zone → parallel; first wire subintimal; poor control; good re-entry zone, distal RCA easy; wire close to lumen; calcium in CTO → re-entry balloon; bifurcation at distal cap → retrograde, else parallel): ref wu-apcto-reentry-2020 (section 2.2 and Table 1)
- Added rows: very hard calcified distal cap defeats parallel wiring, re-entry balloon bypasses it; no haematoma expansion favours re-entry balloon; large lumen, good retrograde filling, easy delivery favour both; re-entry balloon often succeeds in very small lumens and suboptimal filling; dual-lumen catheters deliver more easily than the LP re-entry balloon: ref wu-apcto-reentry-2020 (2.2)
- Decide early, do not switch between them; peri-wire space expansion reduces control; redirection/parallel wiring enlarge haematoma; non-anatomical factors (experience, availability, cost); parallel wiring slightly cheaper in most countries: ref wu-apcto-reentry-2020
- Check 1 (distal side-branch crossing, dual-lumen): brilakis p.558. Check 2 (re-entry balloon choice): ref wu-apcto-reentry-2020
- Tips: pci-cto-antegrade-parallel-wire (brilakis p.392–393, p.558, p.154); pci-cto-antegrade-distal-branch (brilakis p.558); pci-cto-antegrade-decide-early (ref wu-apcto-reentry-2020; brilakis p.392–393)

## Lesson cp-cto-antegrade-adr-track

- ADR definition; intentional or unintentional: brilakis p.393 (21.8.2)
- STAR: J-configured 0.014 inch hydrophilic wire; 31 patients; restenosis 53% of restudied: ref colombo-star-2005
- STAR uncontrollable re-entry, long stents, side branch occlusion, injury, ISR and reocclusion; now bail-out without stenting, repeat attempt after 2–3 months (investment): brilakis p.393 (image checked)
- Limited ADR (dedicated re-entry systems or wire-based) minimise injury, limit dissection and stent length, preserve side branches; favourable outcomes (reworded): brilakis p.393
- Intro: long subintimal tracks → haematoma (p.393) and side-branch loss (STAR, p.393)
- Later algorithms not by length alone (table row): refs harding-apcto-algorithm-2017, wu-global-cto-algorithm-2021, wu-apcto-antegrade-2025
- Vessel architecture concept: ref azzalini-vessel-architecture-2018
- ADR primary when length ≥20 mm (no retrograde indication): brilakis p.394 (Fig 21.4); unambiguous cap, good distal vessel, >20 mm: ref danek-adr-registry-2016 (introduction)
- ADR after other strategies: ref danek-adr-registry-2016 (289 of 458 after failure)
- Knuckle or retrograde preferred when course unclear or highly tortuous; knuckle low perforation risk within vessel architecture: brilakis p.391 (21.6.2)
- Asia Pacific: AWE first; knuckle for long-plus CTOs: ref wu-apcto-reentry-2020
- Registry numbers (1,313; 34.9%; 12.9%; 86.9 vs 91.8; 2.9 vs 2.2; 92.7 vs 94.2; tamponade 1.8 vs 0.1): ref danek-adr-registry-2016
- Oxford: catheter-based devices for guided blunt dissection: oxford p.263
- Knuckle wires: stiff polymer-jacketed and Fielder XT (soft tapered) for knuckles: brilakis p.565 (Table 30.8); knuckled = J-shaped: brilakis p.391; neither manual describes how a knuckle is formed (method removed in round 1)
- Highly supportive wires (support wires, 30.7.4) not to be knuckled: brilakis p.154
- Knuckle size trade-off: bigger knuckle bigger space, fewer small side-branch entries; smaller knuckle check multiple views: ref wu-apcto-antegrade-2025 ('Intentional Subintimal Tracking')
- Knuckle kept small, not beyond radiopaque portion; avoid on highly supportive wires; less likely to perforate but larger perforation; advances through tortuosity without entering side branches: brilakis p.154 (8.6.2.7)
- Knuckled wires not safe, can exit vessel: brilakis p.453 (26.4 causes)
- Knuckle into RV marginal branch → haematoma, branch pinched, hypotension from RV ischaemia in recovery needing inotropes; wire had already reached the space beside the distal cap, knuckle unneeded; knuckle without clear indication not recommended; bougie instead; recovery by redirecting a non-knuckle wire to the original space: ref wu-apcto-reentry-2020 (3.2, Figure 5)
- Stop knuckle short of distal cap; non-knuckle intermediate wire to subintimal space parallel to distal cap; do not try to puncture distal lumen with high-penetration wire after knuckling: ref wu-apcto-reentry-2020 (sections 2.1, 3.3)
- Aggressive knuckling → deformation, entrapment: brilakis p.472 (27.2.1.1); entrapped wire: do NOT pull hard (fracture/unravelling, may need surgery); microcatheter or balloon over it and pull gently; inflate balloon; second wire plus balloon: brilakis p.472 (27.2.3.1); Fig 27.11 entrapped knuckle freed: brilakis p.475
- Dissection catheter: stiff metallic OTW, 1 mm blunt rounded hydrophilic tip, fast spin with torque device, limited dissection plane, easier re-entry, low perforation unless into side branches: brilakis p.587 (30.16.1) (description reworded in round 1)
- 3 of 8 ADR perforations from dissection catheter (one through old stent struts in ISR CTO, two during RCA crossing); short advances, torque device as brake, two orthogonal views; particularly useful in ISR CTO; can exit through stent struts; ISR use 15.9% vs 10.6% with technical success 97.4% vs 86.4% (p = 0.09); technical success with the catheter 89.8% vs 83.5% across ADR cases; observational design: ref danek-adr-registry-2016 (full text)
- Perforation in an overlapping diagonal, massive perforation in an RV marginal branch (Fig 4c, 4d); ISR features favouring the catheter (straight, shorter history, no underexpansion, tapered cap, both caps inside stent); unnoticed wire passage under thin struts; straightening and finishing; not for course ambiguity: ref wu-apcto-reentry-2020 (2.1)
- APCTO now prefers 3D wiring for ISR CTOs: ref wu-apcto-antegrade-2025
- CrossBoss First (246; 11 centres; 56 vs 66 min NS; technical 87.8%; MACE 3.28 vs 4.03): ref karacsonyi-crossboss-first-2018
- FAST-CTOs (150 CTOs failing standard techniques; mean 41 mm; 77%; perforation 9.3%, 3 treated, no tamponade): ref whitlow-fast-cto-2012
- No antegrade contrast once subintimal; remove syringe; contralateral or superselective ipsilateral collateral injection; blocking balloon in proximal cap; guide extension same size as guide; open Y-connector during retrograde injections: ref wu-apcto-reentry-2020 (section 3.6)
- Damped guide pressure desirable during ADR to minimise antegrade flow and haematoma: brilakis p.522 (30.2.5)
- Guide extension use: reduce haematoma during ADR by pressure dampening and reducing antegrade flow: brilakis p.532 (30.3.2 item 7)
- Do not inject with damped waveform: brilakis p.438 (25.2); guide damping and forceful injection through wedged guides cause aorto-coronary dissection: brilakis p.439 (25.2.1.1); extreme caution injecting through a guide extension (hydraulic dissection): brilakis p.440
- Pearl: excessive wiring before the re-entry balloon causes extensive haematoma: ref wu-apcto-reentry-2020 (3.7); unnecessary knuckling (3.2); long knuckle track enlarges space (3.3); antegrade injection (3.6)
- Keep dissection short; subintimal advancement beyond distal cap → haematoma: brilakis p.393
- Check 1 (knuckle for unclear course): brilakis p.391, p.154; ref wu-apcto-reentry-2020. Check 2 (no antegrade injection): ref wu-apcto-reentry-2020; brilakis p.159, p.438
- Tips: pci-cto-antegrade-knuckle (brilakis p.154, p.391, p.453, p.472; ref wu); pci-cto-antegrade-dissection-catheter (brilakis p.587; refs danek, wu); pci-cto-antegrade-inflow (brilakis p.522, p.532; ref wu)

## Lesson cp-cto-antegrade-reentry

- Re-enter near distal cap; avoid long subintimal track: brilakis p.393
- Re-entry zone factors (calcification, plaque load, lumen size, plaque thickness, distance of wire to lumen, haematoma size, tortuosity, balloon stability); plaque thickness 1.32 vs 0.33 mm; preprocedural CT; distal RCA easy, mid RCA harder, LAD side-branch risk: ref wu-apcto-reentry-2020 (sections 2.2, 3.4)
- Re-entry balloon: 2.5 mm wide, 10 mm long, flat, two side ports, 4 atm, self-orienting toward true lumen especially when the dissection space is small; stiff re-entry wire, tapered tip, directed to port under fluoroscopy: brilakis p.587 (30.16.2); 180° opposed ports: brilakis p.588 (Fig 30.109)
- Distal vessel factors: >2.0 mm, well filling, not diseased, no major branches easier; small diffusely diseased harder especially after subintimal entry; some small from hypoperfusion and enlarge; distal calcification hinders re-entry: brilakis p.391 (21.6.3). Round 2: sentence recast in original order and wording (easier vessel first, then the harder one, then calcium). Wire <0.5 mm from lumen, no haematoma expansion, good retrograde filling; re-entry balloon often successful in very small lumens: ref wu-apcto-reentry-2020 (2.2)
- Balloon preparation with pure contrast and negative pressure: ref wu-apcto-reentry-2020 (3.1)
- Bougie with rotational microcatheter; 1.5 mm balloon if microcatheter cannot pass; supportive wire exchange: ref wu-apcto-reentry-2020 (2.1, 3.2)
- STRAW: suction through balloon on wire removal, about 4 minutes; complete occlusive STRAW with second OTW balloon in 8 Fr: ref wu-apcto-reentry-2020 (3.7)
- Stick with re-entry wire or another high-penetration wire: ref wu-apcto-reentry-2020 (3.10); brilakis p.587
- Swap: re-entry wire high penetration may dissect distal vessel; swap to familiar wire (polymer-jacketed options listed): ref wu-apcto-reentry-2020 (3.8)
- Trapping: 8 Fr with 3.0 mm; 7 Fr with 2.5 mm for the LP balloon; 6 Fr with dedicated trapping balloon / trapping guide extension; 5 Fr with 300 cm wire: ref wu-apcto-reentry-2020 (3.9); 6 Fr prevents trapping: brilakis p.160; hydraulic exchange avoided for the re-entry balloon: brilakis p.163
- Double-blind stick-and-swap (distal vessel invisible despite decompression attempts; both ports; swap to stiff polymer-jacketed wire): ref christopoulos-stick-swap-2015
- Multi-stick-and-swap (small distal lumen; 3–5 passes; spinning on last): ref wu-apcto-reentry-2020 (3.11)
- Bobsled (move balloon distally before re-attempt; no indication given, table cell says so): ref danek-adr-registry-2016
- Stick into plaque first when wire far from lumen: ref wu-apcto-reentry-2020 (3.4, Fig 6)
- Registry use (54.8%; stick-and-swap 82, successful 66; bobsled 8; STRAW 2): ref danek-adr-registry-2016
- Routine STRAW and stick-and-swap; delayed use is 'one of the most common mistakes' seen when proctoring: ref wu-apcto-reentry-2020 (3.5, conclusions)
- STAR, contrast-guided STAR, mini-STAR, LAST definitions: ref danek-adr-registry-2016 (discussion)
- Mini-STAR 97.6% vs 52%; retrospective, non-randomised (MeSH Retrospective Studies): ref galassi-mini-star-2012
- Carlino technique (contrast injection into intima or subintimal space through microcatheter): brilakis p.542 (30.6 item 5)
- IVUS-guided antegrade re-entry, 8 Fr: brilakis p.393; IVUS confirms re-entry: brilakis p.395
- When re-entry fails: change strategy (retrograde) per hybrid algorithm: brilakis p.394; investment, 2–3 months: brilakis p.393; Hirai (observational registry; 59 of 138; similar complications; adjusted 10.5-point SAQ SS at 30 days; further studies needed on the necessity of subsequent PCI): ref hirai-spm-2018; stop reasons with thresholds (>5 Gy air kerma without crossing or substantial progress; >3.7 × estimated creatinine clearance), individual risk–benefit at each stage, STAR or fail rather than aggressive: brilakis p.394
- Check 1 (swap): ref wu-apcto-reentry-2020. Check 2 (investment): brilakis p.393–394; ref hirai-spm-2018
- Tips: pci-cto-antegrade-reentry-zone (brilakis p.393; ref wu); pci-cto-antegrade-stick-swap (brilakis p.587; ref wu); pci-cto-antegrade-straw (refs wu, christopoulos); pci-cto-antegrade-investment (brilakis p.393–394; ref hirai)

## Lesson cp-cto-antegrade-move-cap

- Move-the-cap techniques for ambiguous cap; primary retrograde or move-the-cap if unresolved: brilakis p.390 (21.6.1)
- Antegrade approach to ambiguous caps without collateral or graft: IVUS/CCTA or move-the-cap: brilakis p.394 (21.8.4)
- Subintimal entry proximal to cap with stiff wire or slightly oversized balloon; followed by standard ADR; minimises perforation; useful for balloon-uncrossable lesions: ref vo-move-the-cap-2016
- BASE named (balloon-assisted subintimal entry); 31 centres 2016–2023; 155 of 1,968 ADR (7.9%); 42 vs 37 mm; J-CTO 3.4 vs 3.0; PROGRESS-CTO higher; cap ambiguity, side branch at cap, blunt/no stump, calcification, tortuosity; technical 71.6 vs 75.5; procedural 71.6 vs 72.8; MACE 1.3 vs 4.1: ref alexandrou-base-2023
- Scratch-and-go named, stiff wire subintimal entry, then re-entry after wire exchange at acute margin, IVUS confirmation, three stents: ref giangiacomi-scratch-go-2024
- Side-BASE: concern over proximal side-branch loss with BASE; side-branch anchor balloon combined with BASE; sub-intimal access via side branch; for ambiguity and resistant caps: ref roy-side-base-2018
- Retrograde used in 68% of ambiguous-cap cases ("about two-thirds"): ref karatasakis-cap-ambiguity-2016 (verified note in cp-cto-strategy)
- Cap clarification methods (projections, microcatheter injection, IVUS, CT): brilakis p.390 (cross-reference to cp-cto-strategy)
- External crush and subintimal distal anchor need subintimal crossing and experienced operators: brilakis p.413–414 (23.1.8)
- Antegrade attempts to recanalise true aorto-ostial CTO cause aorto-coronary dissection: brilakis p.439 (25.2.1.1); flush aorto-ostial CTOs often primary retrograde: brilakis p.394 ('often' throughout since round 1; no ban on move-the-cap is claimed)
- Names: Vo 2016 described stiff-wire and balloon entry; BASE named and side-BASE described in roy-side-base-2018; EuroCTO 2019 advised IVUS, BASE and scratch-and-go then retrograde for cap ambiguity (as reported in ref wu-apcto-antegrade-2025; consensus abstract does not list techniques); Alexandrou 2023 largest BASE registry
- Check 2 stem: IVUS and preprocedural CT both used (the two imaging options of brilakis p.394)
- Check 1 (purpose of BASE balloon): ref vo-move-the-cap-2016. Check 2 (ambiguous cap at diagonal, no collateral): brilakis p.394; refs vo, roy
- Tip pci-cto-antegrade-move-cap: brilakis p.390, p.394; refs vo-move-the-cap-2016, roy-side-base-2018

## Quiz

- q1 step-down: brilakis p.392, p.154. q2 tapered cap first wire: brilakis p.392. q3 microcatheter injection risk vs Oxford: brilakis p.159, p.438, p.243; oxford p.263. q4 hydraulic exchange: brilakis p.163, p.162. q5 parallel vs re-entry factors: ref wu-apcto-reentry-2020; brilakis p.393. q6 STAR: brilakis p.393; ref colombo-star-2005 (53%). q7 haematoma management: ref wu-apcto-reentry-2020. q8 CrossBoss First: ref karacsonyi-crossboss-first-2018. q9 double-blind stick-and-swap: ref christopoulos-stick-swap-2015; multi-stick: ref wu. q10 move-the-cap: refs vo-move-the-cap-2016, alexandrou-base-2023; brilakis p.394, p.439. q11 knuckle: brilakis p.154, p.453; ref wu-apcto-antegrade-2025 (larger knuckle enters small branches less often; option D now 'keeps the space small', unambiguously wrong). q1 explanation: highly supportive wires (Grand Slam, Iron Man): brilakis p.154. q5 stem rewritten (wire within plaque at the cap, no subintimal statement): ref wu-apcto-reentry-2020 Table 1.

## Cases

- cp-cto-antegrade-case-lad: synthetic. First wire by cap (brilakis p.392); microcatheter (ref cto-consensus-2019); wire exit handling and Oxford clues (brilakis p.392; oxford p.263); escalation and step-down (brilakis p.392); deep subintimal advancement and haematoma (brilakis p.393); parallel wiring factors (ref wu); microcatheter injection risk (brilakis p.159, p.438); exchange, trapping, back-bleed, hydraulic exchange avoided (brilakis p.160–163). Set-up details (8 Fr EBU, ACT > 300 s antegrade) from brilakis p.390 (21.3, 21.5).
- cp-cto-antegrade-case-lad round 1 changes: s2 knuckle option no longer acceptable (no indication; ref wu-apcto-reentry-2020 3.2); s3 feedback: 1–2 mm rule for the cap applied by analogy (brilakis p.392), stiff wires more likely to perforate (brilakis p.453); s4 prompt now a wire within the occluded segment short of the lumen (intraplaque), consistent with parallel wiring (ref wu Table 1).
- cp-cto-antegrade-case-rca round 1 changes: s1 feedback 'long plus' knuckle (ref wu-apcto-reentry-2020 2.1; ref wu-apcto-antegrade-2025) and global algorithm antegrade wiring step (ref wu-global-cto-algorithm-2021); s3 stop knuckling into branch, return to a non-knuckled wire (ref wu 3.2); s3-branch: hypotension → exclude tamponade (effusions accumulate rapidly and often cause hypotension: brilakis p.447; perforation commoner in CTO PCI: brilakis p.447; knuckles can exit: brilakis p.453; echo assesses effusion: brilakis p.449) and femoral bleed (retroperitoneal haematoma suspected with hypotension after femoral access: brilakis p.501, 29.4); new consequence s3-tamponade: balloon, fluids/vasopressors, pericardiocentesis, notify surgeons (brilakis p.449 universal algorithm; oxford p.263); heparin not reversed until equipment removed and pericardium evacuated (thrombosis of guide/vessel, pericardial clot): brilakis p.449; s4-haematoma 'one of the commonest mistakes' (ref wu 3.5); s5 blind both-port option now penalised (double-blind only for invisible distal vessel: ref christopoulos-stick-swap-2015; side ports puncture toward lumen or adventitia: ref wu-apcto-reentry-2020 introduction); s6 6 Fr note (brilakis p.160; ref wu 3.9).
- cp-cto-antegrade-case-rca: synthetic. Hybrid choice ADR for ≥20 mm (brilakis p.394); Asia Pacific AWE-first acceptable (ref wu); knuckle for unclear tortuous course (brilakis p.391); dissection catheter not for ambiguity, perforates in side branches (ref wu; brilakis p.587); stiff wire exit handling (brilakis p.392); knuckle into RV marginal branch → RV ischaemia (ref wu Fig 5); stop knuckle short of distal cap, no stick from knuckle track (ref wu); haematoma management, guide extension, STRAW, avoid parallel/balloon switching (ref wu; brilakis p.532); stick-and-swap (ref wu); double-blind variant (ref christopoulos); trapping 3.0 mm in 8 Fr, back-bleed, no hydraulic exchange for the re-entry balloon (brilakis p.160–163). Set-up (8 Fr AL to RCA, femoral) from brilakis p.390 (21.5). The outcome texts (effusion watched, extra stent, branch not recovering) are synthetic consequences, not claims from the sources.

## Lab tip triggers (round 1)

- Re-entry tips (reentry-zone, stick-swap, straw) now fire on `dissection`, the knuckle tip on `dissection`, the investment tip only on `high-contrast-volume` or `high-radiation-dose`; decide-early only on `wire-subintimal`. This keeps the number of tips matching a first subintimal wire within the `tipsFor` limit and stops 'invest and come back' appearing before any re-entry attempt (STRAW after re-entry balloon delivery: ref wu-apcto-reentry-2020 3.7; investment after failed crossing: brilakis p.393).
- Remaining limitation: `total-occlusion`, `wire-subintimal` and `dissection` are not CTO-specific, so these tips can still appear in primary PCI or after an iatrogenic dissection. A CTO-specific event and an AND condition in `TipTrigger` are needed in src/content/lab/tips.ts (returned to the orchestrator as an Academy fix; not editable from this module).
- Tip text changes: step-down (no same-class restriction, brilakis p.394; backup before penetration, ref wu-apcto-antegrade-2025); trap-exchange (6 Fr caveat, brilakis p.160); parallel-wire ('redirect briefly', brilakis p.392, ref wu 2.2); knuckle (indication, stop knuckling into a branch, ref wu 3.2); inflow (no injection through damped guide or guide extension: brilakis p.438–440).

## Round 2 changes

- Lab tip triggers: every tip now goes through the module's `cto()` helper, which adds `requires: ["cto"]` to its trigger. CTO-only scope of all sixteen tips: brilakis p.392–394 (21.8), p.587 (30.16). The field takes effect once src/content/lab/tips.ts adds a "cto" event and checks `requires` in tipsFor and validateTips, and src/ui/lab/pciTips.ts raises "cto" in the CTO scenario (returned as Academy fixes). The knuckle, re-entry zone, stick-and-swap, STRAW and inflow tips now list `wire-subintimal` and `dissection` with the `wire` and `complication` phases, because pciTipContext sets the phase to `complication` whenever a dissection is overt (src/ui/lab/pciTips.ts), so a `wire`-only trigger on `dissection` could never match.
- awe-kit block 1: 'long plus' = long ambiguous segment, tortuosity and heavy calcium together, knuckle up front; intentional subintimal tracking also possible without a knuckle using blunt intermediate-penetration wires (Pilot 200, Neo 3, UB 3, Gladius EX): ref wu-apcto-antegrade-2025 ('Crossing the CTO Body', 'Intentional Subintimal Tracking'). Lesson 2 algorithm table row brought into line ('and', not 'or').
- awe-kit Oxford wires item: ultrasound and laser guidewires (oxford p.263) are not mentioned in the 2025 Asia Pacific antegrade wiring update: ref wu-apcto-antegrade-2025 (full text read). The Wu 2021 half was removed: only its abstract was available.
- awe-crossing keypoint and tip pci-cto-antegrade-trap-exchange: in 6 Fr a standard balloon traps only low-profile microcatheters, and only in a 0.071 in. guide; dedicated trapping balloons trap in smaller guides; trapping guide extension in 6–8 Fr: brilakis p.160 (8.9.2.1).
- awe-crossing 'Where' item: shaft markers not reliable with short or shortened guides: brilakis p.161 (8.9.2.1), recast in original wording.
