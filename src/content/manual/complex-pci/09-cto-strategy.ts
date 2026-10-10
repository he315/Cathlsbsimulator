// Module cp-cto-strategy: chronic total occlusions, selection and strategy (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 21 (chronic total occlusions, the whole chapter), with related passages in
// 2.2, 4.1, 5.7, 6.6, 6.8, 7.3, 7.4, 8.2, 8.6, 12.3, 13.1, 13.4, 14.1, 18.6, 18.7 and 30.6; Oxford Handbook of Cardiac
// Catheterization and Coronary Intervention, chapter 8 (chronic total occlusion PCI, lesion classification, angioplasty
// balloons), chapter 7 (collateral filling) and chapter 1 (cardiac CT or invasive angiography).
// The crossing techniques are outlined here (lesson cp-cto-strategy-hybrid, Brilakis 21.8.1-21.8.3); their step-by-step
// detail is planned for cp-cto-antegrade and cp-cto-retrograde (module-plan.json).
// Every claim is listed with its page in docs/curriculum/evidence/cp-cto-strategy.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_CTO = O("ch 8: Chronic total occlusion PCI");

export const module: Module = {
  id: "cp-cto-strategy",
  title: "Chronic total occlusions: selection and strategy",
  stage: 5,
  summary:
    "Everything that happens before the first CTO wire is shaped, and the framework that governs every crossing attempt: who should have CTO PCI and why, how to plan and set up the procedure, how to film and read the CTO angiogram, what to do when the proximal cap cannot be seen, how the hybrid and Asia Pacific algorithms choose and change the crossing strategy, when to stop, and how to finish once the occlusion is crossed. The crossing techniques are outlined at each branch of the algorithm; their step-by-step detail belongs to the antegrade and retrograde CTO modules.",
  objectives: [
    "Define a chronic total occlusion as each manual does, and state the indication for CTO PCI and what the randomised trials EURO-CTO, DECISION-CTO and ORBITA-CTO did and did not show.",
    "Decide when a CTO should be treated as a planned rather than an ad hoc procedure, and name the exceptions Brilakis gives.",
    "Set up a CTO procedure: monitoring, heparin and ACT targets, dual arterial access, guide size and shape, and the place of haemodynamic support.",
    "Film a CTO with dual injection and read it systematically for proximal cap, length and course, distal vessel and collaterals, saying what each finding changes.",
    "Recognise proximal cap ambiguity, list the five ways to resolve or bypass it, and choose between a primary retrograde approach and move-the-cap techniques.",
    "Apply the hybrid algorithm and the seven global guiding principles to choose the first crossing strategy, change it efficiently and stop at the right time.",
    "Finish a CTO procedure safely: stenting and imaging, physiology in the CTO and donor vessels, drugs to avoid, and the donor artery.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-selection",
      title: "Who should have CTO PCI, and why it is planned",
      minutes: 14,
      topics: ["cto-selection"],
      sources: [B("21"), B("21.1"), B("21.12"), B("7.3"), B("7.4"), B("18.7"), O_CTO, O("ch 8: Lesion classification"), O("ch 1: Cardiac CT or invasive angiography?")],
      refs: [...BOOKS, "cto-consensus-2019", "euro-cto-2018", "decision-cto-2019", "khan-orbita-cto-2026", "sandoval-adhoc-cto-2019", "tajti-progress-hybrid-2018", "opolski-ct-rector-2015"],
      blocks: [
        {
          kind: "p",
          text: "A chronic total occlusion (CTO) is an artery that has been completely blocked for months. Opening one needs its own equipment, techniques and planning, and carries more risk than ordinary PCI, so the first decision is not how to cross it but whether this patient should have it crossed at all, and if so, when and by whom.",
        },
        { kind: "h", text: "What counts as a CTO" },
        {
          kind: "table",
          caption: "Definitions and grading in the two manuals",
          head: ["Point", "Brilakis (21)", "Oxford (ch 8)"],
          rows: [
            ["Flow", "TIMI 0: no antegrade flow through the occluded segment", "Complete occlusion of the artery"],
            ["Duration", "Estimated to be at least 3 months", "Longer than 3 months"],
            ["Lesion classes", "Not discussed in chapter 21", "ACC/AHA scheme: an occlusion older than 3 months is a type C feature; one younger than 3 months is type B"],
            ["Place in PCI", "A distinct subset with its own manual (the Manual of CTO Interventions)", "Called one of the 'final frontiers'; CTO is a multivariate predictor of procedural failure"],
          ],
        },
        {
          kind: "p",
          text: "The duration is an estimate rather than a known date. The two books differ only in wording at the three-month boundary.",
        },
        { kind: "h", text: "Why treat a CTO" },
        {
          kind: "steps",
          title: "The case for and against, step by step",
          items: [
            {
              title: "1. The indication is symptoms",
              detail:
                "Brilakis states that the key indication is to improve symptoms, and the first of the seven global guiding principles (Brilakis's consensus reference) puts it as improvement of ischaemic symptoms. Start by asking whether the patient's angina or equivalent can plausibly come from the occluded territory and has persisted despite medical treatment.",
            },
            {
              title: "2. Collaterals do not make the territory safe",
              detail:
                "In the studies Brilakis cites (small series of symptomatic patients, largely without a previous Q-wave infarct), the CTO territory behaved as ischaemic even when the collaterals looked good (21.12). So 'well collateralised' is not a reason to leave a symptomatic CTO alone, and physiology is not normally measured in the CTO vessel to decide on treatment.",
            },
            {
              title: "3. Check that the territory is alive",
              detail:
                "Planning ahead allows extra tests, such as myocardial viability, before committing to the procedure (21.1). There is little point in opening an artery into scar to relieve symptoms that the scar cannot cause.",
            },
            {
              title: "4. Know what the trials show",
              detail:
                "Neither manual reviews the randomised evidence; three randomised trials now define it. EURO-CTO (396 patients, open-label, randomised 2:1 to PCI or optimal medical therapy) improved angina frequency and quality of life on the Seattle Angina Questionnaire at 12 months, and complete freedom from angina was commoner with PCI (71.6% against 57.8%), with no periprocedural death or infarction and similar major events; it was analysed by intention to treat, with 13.4% failed procedures in the PCI arm and 7.3% crossovers from medical therapy. DECISION-CTO (834 patients, open-label, stopped early for slow recruitment, with 19.6% crossing over from the no-PCI arm, and about half of each arm having PCI of non-CTO lesions) found no difference in death, infarction, stroke or repeat revascularisation (22.3% against 22.4% over a median of 4 years), and health status improved similarly in both arms; its authors note low power for clinical end points. ORBITA-CTO (2026; 50 patients with angina from a single-vessel CTO and no other coronary disease, randomised to CTO PCI or a placebo procedure, with patients and staff kept blinded) found that CTO PCI reduced angina beyond placebo over 6 months, giving about 30 more angina-free days and better Seattle Angina Questionnaire scores; it was small and was not designed to measure death or infarction.",
            },
            {
              title: "5. Weigh the chance of success",
              detail:
                "Oxford lists what makes success more likely: an occlusion that is relatively recent, short, away from neighbouring side branches, and entered through a tapered 'run-in'. Brilakis quotes success of 85–90% at experienced centres (7.4); in the PROGRESS CTO registry of 3,122 hybrid procedures at experienced centres, technical success was 87%, procedural success 85% and in-hospital major complications 3.0%. The consensus adds that specific CTO expertise, volume and equipment raise success and help prevent and manage complications.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 66-year-old has CCS class II angina on two antianginal drugs. Angiography shows a mid-RCA CTO filled by good septal collaterals from the LAD, and cardiac MRI shows a viable inferior wall with inducible ischaemia. A colleague says the RCA is 'well collateralised, so leave it'. What is the best reply?",
          options: [
            "Agree: good collaterals mean the inferior territory is protected, so medical therapy alone is the answer",
            "Disagree: collateralised CTO territories remain ischaemic, and symptom relief is the indication to consider CTO PCI",
            "Agree, unless an FFR measured in the CTO vessel through the collaterals is 0.80 or less",
            "Disagree: CTO PCI is indicated mainly because the trials show it lowers death and infarction",
          ],
          answer: 1,
          explanation:
            "The studies Brilakis cites found CTO territories ischaemic even with good collaterals, and the indication for CTO PCI is to relieve symptoms, here persistent angina from a viable, ischaemic territory. Physiology is not normally measured in the CTO vessel. The mortality argument is the tempting wrong answer: DECISION-CTO showed no difference in major events, while EURO-CTO showed better angina control and quality of life, and ORBITA-CTO has now shown the angina benefit against a placebo procedure.",
        },
        { kind: "h", text: "Plan it: why most CTO PCI is not done ad hoc" },
        {
          kind: "p",
          text: "Brilakis discourages ad hoc CTO PCI (straight on from the diagnostic angiogram) in most cases. A separate, planned procedure gives time to prepare and to counsel the patient, and it lowers the contrast and radiation used on the day, reduces fatigue in patient and operator, allows tests such as viability, and lets the risks and alternatives be discussed in full. His general list of reasons to defer PCI (7.3.1) names CTOs among the complex anatomies. The same list includes high contrast or radiation already used or expected; a site without on-site surgery when the risk is high, or without the equipment needed; consent for a much smaller procedure than the one now proposed; doubt about how extensive the symptoms really are; no evidence of ischaemia when FFR or IVUS is not available; a complication during the diagnostic study; operator or patient fatigue; scheduling pressures, such as an emergency arriving; inadequate pretreatment, including an inadequate trial of antianginal drugs; and patient preference. Three of these bear directly on CTO selection: uncertain symptoms, missing evidence of ischaemia and an untried antianginal regimen all argue for stopping and reassessing before any CTO attempt.",
        },
        {
          kind: "list",
          items: [
            "**The registry view.** In the multicentre registry Brilakis cites (Sandoval 2019), 14% of 2,282 CTO procedures were ad hoc. These were less complex lesions, approached mostly with antegrade wire escalation, and had similar technical success to planned cases; the authors concluded that ad hoc CTO PCI may be acceptable for experienced hybrid operators in carefully selected cases, and that complex cases should follow proper planning.",
            "**Exception 1: an ACS from a failing vein graft.** When a heavily diseased saphenous vein graft fails and causes an acute coronary syndrome, Brilakis prefers to treat the native CTO instead, if feasible, and this may have to happen ad hoc (taught in cp-prior-cabg).",
            "**Exception 2: access that is very hard to obtain.** If getting arterial access again would be very difficult, doing the procedure in the same sitting may be the better option.",
          ],
        },
        { kind: "tip", id: "diag-cto-strategy-defer-adhoc" },
        { kind: "h", text: "What planning includes" },
        {
          kind: "steps",
          items: [
            {
              title: "Review every old film",
              detail:
                "Earlier angiograms can show the artery before it occluded, other collateral routes, and how the CTO was approached before. The predominant collateral can change over time (taught in the angiogram lesson below).",
            },
            {
              title: "Consider coronary CT angiography",
              detail:
                "Brilakis finds CCTA useful for the occluded segment and for planning, and it can identify the fluoroscopic projections with the least foreshortening for the crossing attempt (his Fig. 21.1 example is an AP cranial 30° view). CT-based difficulty scores exist, such as the CT-RECTOR score (multiple occlusions, blunt stump, severe calcification, bending, CTO duration of 12 months or more and a previously failed attempt, one point each) and a score from a Korean multicentre CT registry of CTOs. Oxford lists clarifying the anatomy, the distal landing zone and the proximal cap of a CTO among the indications for cardiac CT. On the same page it lists situations in which cardiac CT should not usually be considered, so check for them before requesting it: among them a very high calcium score (above 1000), a large body mass index and previous coronary stenting.",
            },
            {
              title: "Decide the order in multivessel disease",
              detail:
                "With an LAD CTO and non-occlusive RCA and circumflex lesions, some operators attempt the LAD CTO first and refer for surgery if it fails; others treat the RCA and circumflex first so that the CTO attempt is safer (7.4). Either way, the plan is made before the day.",
            },
            {
              title: "Prior bypass surgery",
              detail:
                "Chronically occluded vein grafts should generally not be reopened because of high restenosis risk (class III, level C in the guideline Brilakis cites) unless nothing else is possible, but an occluded graft can serve as a retrograde route to the native artery if the morphology of the graft occlusion is favourable. After failed or repeatedly failing graft PCI, the native CTO can be recanalised at experienced centres (18.7).",
            },
            {
              title: "Book the right list",
              detail:
                "A CTO operator, a team that knows the equipment, the full range of crossing equipment and the means to manage a perforation (21.2). Consent covers the CTO-specific risks.",
            },
          ],
        },
        {
          kind: "check",
          stem: "During a diagnostic study for stable angina you find a proximal LAD CTO with a blunt stump and septal collaterals from the RCA. You have used 90 mL of contrast, the consent covered diagnostic angiography and 'possible PCI', and the patient also has a 70% circumflex lesion. What do you do?",
          options: [
            "Treat the circumflex now, then attempt the LAD CTO in the same sitting while access is in place",
            "Attempt the LAD CTO now with a single 6 Fr radial guide, and stop if it does not cross within an hour",
            "Finish the diagnostic study with good collateral runs, then plan a separate procedure after discussion",
            "Refer for CABG, because a blunt stump means CTO PCI will not succeed",
          ],
          answer: 2,
          explanation:
            "This is a complex, multivessel case with a CTO, and the consent covered far less than a CTO procedure: two of Brilakis's reasons to defer. Planning allows CT, viability, discussion of surgery as well as PCI, and a properly set-up procedure. Pressing on ad hoc is the tempting error; a blunt stump makes crossing harder but does not rule it out.",
        },
        {
          kind: "pitfalls",
          items: [
            "Opening a CTO because it is there, in a patient whose symptoms do not come from its territory or whose territory is scar.",
            "Reading good collaterals as proof that the territory is not ischaemic.",
            "Promising a survival benefit that the randomised trials have not shown.",
            "Rolling straight into a CTO attempt at the end of a diagnostic study, without dual injection, planning or consent for the CTO risks.",
            "Reopening a chronically occluded vein graft instead of the native artery it supplied.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you decide, ask three questions in order: are the symptoms from this territory, is the territory alive, and is this the right operator, list and day? A no to any one of them changes the plan; only then does the angiogram decide how.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "occlusion",
          task: "Decide on each real run whether the artery is occluded. For each occluded vessel, write down what you would need before planning CTO PCI: symptoms from that territory, viability, the old films and a dual-injection study.",
        },
        { kind: "video", id: "qcdZvUr3mUA", note: "Manual of PCI 21.1: chronic total occlusion PCI." },
        { kind: "video", id: "qZoRCMLvnT0", note: "Manual of CTO PCI 7.1: who should undergo CTO PCI." },
        { kind: "video", id: "rYWlk-idf1M", note: "Brilakis on the benefits of CTO PCI (Dallas CVI 2015)." },
        { kind: "video", id: "fL1lESnjDx4", note: "Case 258: a referral for LAD CTO PCI." },
        {
          kind: "keypoints",
          items: [
            "CTO: TIMI 0 flow, estimated duration at least 3 months (Brilakis); occlusion longer than 3 months (Oxford).",
            "The indication is symptom relief; the territory is ischaemic even with good collaterals.",
            "EURO-CTO: better angina and quality of life at 12 months; DECISION-CTO: no difference in major events; ORBITA-CTO: the angina benefit holds against a placebo procedure. No survival benefit has been shown.",
            "Success is likelier in recent, short occlusions away from side branches with a tapered entry; 85–90% at experienced centres.",
            "Plan CTO PCI as a separate procedure in most cases; exceptions are an ACS from a failing vein graft and very difficult access.",
            "Use old films and CCTA; occluded vein grafts are generally not reopened, but one can serve as a retrograde route if its occlusion morphology is favourable.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-setup",
      title: "Setting up the CTO procedure",
      minutes: 13,
      topics: ["cto-selection"],
      sources: [B("21.2"), B("21.3"), B("21.4"), B("21.5"), B("21.10"), B("21.14"), B("3.4"), B("2.2"), B("4.1"), B("5.7"), B("14.1"), B("8.1"), O_CTO, O("ch 8: Angioplasty balloons")],
      refs: [...BOOKS, "tajti-progress-hybrid-2018"],
      blocks: [
        {
          kind: "p",
          text: "A CTO procedure can be long and technically hard, and it can need large doses of radiation and contrast (21.2). The set-up decides what you will be able to do when the first strategy stalls or a complication happens: whether you can inject both arteries, use IVUS at the cap, change to retrograde, or seal a perforation. Get it right before the first wire goes in.",
        },
        {
          kind: "steps",
          title: "The set-up, in order",
          items: [
            {
              title: "1. Monitoring",
              detail:
                "Watch the ECG and haemodynamics throughout, and keep a running count of radiation and contrast (21.2). Be ready for complications, perforation in particular. Brilakis's monitoring chapter illustrates the warning signs with a CTO case: ST elevation and a pulsus paradoxus of 35 mmHg when a distal vessel was perforated in someone who had previously had bypass surgery (Fig. 2.2).",
            },
            {
              title: "2. Anticoagulation: unfractionated heparin",
              detail:
                "Heparin is preferred because it can be reversed if a severe perforation occurs. Brilakis's ACT targets are for a Hemochron analyser (his anticoagulation chapter gives a lower range for the HemoTec type, so use your laboratory's equivalent): above 300 s for antegrade work (some operators accept above 250 s) and above 350 s for retrograde work (some accept above 300 s, but then check very often while the ACT is in the low 300s). Check the ACT every 20–30 minutes once it is therapeutic.",
            },
            {
              title: "3. Drugs to avoid",
              detail:
                "Avoid bivalirudin: its effect cannot be reversed, and Brilakis mentions unpublished cases of guide catheter thrombosis during long procedures. Do not give a glycoprotein IIb/IIIa inhibitor or cangrelor at any point, even once the CTO is crossed and stented, because small wire perforations can reopen and cause a delayed effusion and tamponade.",
            },
            {
              title: "4. Access: usually two arteries, sometimes three",
              detail:
                "Dual (occasionally triple) arterial access is common because dual injection is needed. Femoral and wrist routes (proximal radial, distal radial, ulnar) all work, and radial and biradial access have grown considerably. Distal radial access or long radial sheaths make the left radial easier to use. Many operators still use one or more femoral accesses, frequently through a 45 cm sheath, for guide support; Brilakis's access chapter suggests at least one femoral access (often 7 or 8 Fr, ideally 45 cm long) for complex PCI such as CTOs (4.1).",
            },
            {
              title: "5. Guides: large and supportive",
              detail:
                "Use 7 or 8 Fr guides with supportive shapes: an Amplatz left (AL) for the RCA and an EBU or XB curve for the left main. Strong support is often needed to cross. A 6 Fr guide may rule out IVUS-guided penetration of the cap and limit the management of complications. Brilakis calls AL guides the strongest support for complex RCA work such as RCA CTOs (5.7).",
            },
            {
              title: "6. Microcatheter ready",
              detail:
                "Brilakis says a microcatheter should be considered for any complex lesion, CTOs included (8.1), and the consensus calls one essential in CTO PCI for wire control and exchanges. Oxford mentions over-the-wire balloons for added support; their use is now usually restricted to CTOs.",
            },
            {
              title: "7. Haemodynamic support: rarely, by indication",
              detail:
                "Support was used in about 4% of CTO PCI in the United States (21.14). The usual principles apply (14.1): Brilakis lists retrograde CTO PCI among the complex, prolonged procedures that cause significant ischaemia, which, with abnormal baseline haemodynamics, is when prophylactic support is generally recommended. With normal haemodynamics, a high-risk procedure such as retrograde CTO PCI does not usually get prophylactic support, but a device should be immediately available; many operators place a small (4 Fr) femoral sheath so that one can be inserted quickly if the patient decompensates (14.1).",
            },
            {
              title: "8. Before any retrograde work: the donor artery",
              detail:
                "If the donor artery has a lesion in the path of the planned retrograde route, treat it before retrograde equipment goes in, so that the donor does not thrombose while wires and microcatheters sit in it (21.10). Assess the donor proximal to the collateral as part of reading the angiogram (next lesson).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-anticoagulant-choice" },
        { kind: "tip", id: "pci-cto-strategy-act-recheck" },
        {
          kind: "check",
          stem: "Retrograde wiring through a septal collateral has just started. The last ACT, 35 minutes ago, was 340 s on a Hemochron. What does Brilakis's protocol call for?",
          options: [
            "Nothing yet: 340 s is above the 300 s antegrade target, so the next check can wait until the case ends",
            "Recheck the ACT now, and give heparin to bring it above 350 s for retrograde work",
            "Switch to bivalirudin so that a steady anticoagulant effect no longer needs ACT checks",
            "Give a glycoprotein IIb/IIIa inhibitor to protect the donor artery while equipment sits in it",
          ],
          answer: 1,
          explanation:
            "Retrograde work needs an ACT above 350 s, and once therapeutic it is checked every 20–30 minutes, so a 35-minute-old value of 340 s needs repeating and topping up to above 350 s. The antegrade target is the tempting answer, but the case is now retrograde. Bivalirudin cannot be reversed if you perforate, and IIb/IIIa inhibitors are contraindicated in CTO PCI.",
        },
        { kind: "h", text: "How Oxford frames the technical requirements" },
        {
          kind: "table",
          caption: "Oxford's technical points and how they map to Brilakis",
          head: ["Oxford (ch 8: Chronic total occlusion PCI)", "In Brilakis"],
          rows: [
            ["Good guiding catheter support is essential", "7–8 Fr AL or EBU/XB guides, femoral access for support (21.4, 21.5)"],
            ["Stiff, heavyweight wires, often hydrophilic-coated, resist deflection and help penetrate the cap; perforation with them is not uncommon and can cause tamponade", "Wire choice follows the cap: a soft tapered polymer-jacketed wire first for a tapered cap, stiffer wires when needed, then de-escalation (21.8; outlined in the crossing-strategy lesson below)"],
            ["Over-the-wire balloons add support against tip deflection", "A microcatheter does this job and allows exchanges (8.1)"],
            ["If the wire crosses but there is still no antegrade flow, inject dye through an over-the-wire balloon or probing catheter to show whether the wire is in or outside the lumen", "Contralateral injection and orthogonal views locate the wire (21.8, 8.6)"],
            ["Simultaneous contralateral injection 'in some circumstances' shows the vessel beyond the occlusion", "Dual injection in most cases, and in every patient with contralateral collaterals (21.6)"],
          ],
        },
        {
          kind: "p",
          text: "The emphasis differs: Oxford treats contralateral injection as useful in some circumstances and leads with stiff wires, while Brilakis makes dual injection routine and matches the first wire to the cap: a soft, tapered polymer-jacketed wire for a tapered cap, an intermediate-penetration wire for a blunt one, escalating as needed. Follow Brilakis for technique, which reflects the hybrid approach; Oxford's list of what to watch for remains valid.",
        },
        {
          kind: "check",
          stem: "You are setting up an RCA CTO from the right radial with a 6 Fr JR4 guide because 'it is all we need to start'. What is the main problem with this set-up?",
          options: [
            "A 6 Fr guide would exclude the use of any microcatheter, so wires cannot be exchanged",
            "Radial access is contraindicated for CTO PCI, so the case must be done femorally",
            "A JR4 is too stiff for an RCA CTO and is likely to dissect the ostium during wiring",
            "Support may be inadequate, and 6 Fr may exclude IVUS at the cap and limit bail-out options",
          ],
          answer: 3,
          explanation:
            "Brilakis recommends 7 or 8 Fr guides with supportive shapes (AL for the RCA), because strong support is often needed, and warns that 6 Fr guides may exclude IVUS-guided cap penetration and limit complication management. Radial and biradial CTO PCI are increasingly used, so radial access itself is not the problem, and microcatheters fit 6 Fr guides.",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting with bivalirudin, then meeting a perforation that cannot be reversed.",
            "Letting the ACT drift unchecked during a long retrograde case.",
            "Giving a IIb/IIIa inhibitor or cangrelor 'to protect the stents' at the end of a successful CTO case.",
            "Choosing small guides and a single access, which leaves no route for dual injection, IVUS or a second guide when needed.",
            "Ignoring the contrast and dose counters until the case is already beyond the stopping thresholds.",
            "Starting retrograde work with an untreated donor lesion in the path of the route.",
          ],
        },
        {
          kind: "pearl",
          text: "Set up for the procedure you may need, not the one you hope for. If the plan might turn retrograde, the donor artery needs a guide (not a diagnostic catheter), the ACT needs the retrograde target, and the access must allow both guides to work at once.",
        },
        { kind: "tip", id: "pci-cto-strategy-guide-choice" },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Open the mid-RCA CTO scenario. Before any wiring, state your access, the guide size and shape for each artery, the heparin plan with ACT targets for antegrade and retrograde work, and which drugs you will not give.",
        },
        { kind: "video", id: "oJiIdG3qb9w", note: "Brilakis: fundamentals of CTO PCI." },
        { kind: "video", id: "es33irOZs-s", note: "Manual of CTO PCI case 296: the guide." },
        {
          kind: "keypoints",
          items: [
            "Monitor ECG, haemodynamics, radiation and contrast; be ready for perforation.",
            "Unfractionated heparin: ACT above 300 s antegrade and above 350 s retrograde (analyser-specific), checked every 20–30 minutes.",
            "No bivalirudin, no IIb/IIIa inhibitor, no cangrelor, even after success.",
            "Dual (sometimes triple) access; radial is growing, but many keep one femoral with a 45 cm sheath.",
            "7–8 Fr supportive guides: AL for the RCA, EBU or XB for the left; 6 Fr limits IVUS at the cap and bail-outs.",
            "Haemodynamic support in about 4% of US CTO PCI; retrograde CTO PCI counts as a high-risk procedural plan; with normal haemodynamics keep support immediately available rather than inserting it.",
            "Treat a donor lesion on the retrograde route before retrograde work starts.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-angiogram",
      title: "Dual injection and reading the CTO angiogram",
      minutes: 15,
      topics: ["cto-angiogram"],
      sources: [B("21.6"), B("6.6"), B("6.8"), B("8.6"), B("18.6"), B("30.6"), O_CTO, O("ch 7: Collateral filling"), O("ch 6: Imaging the coronaries")],
      refs: [...BOOKS, "cto-consensus-2019", "werner-collaterals-2003", "rentrop-1985", "wu-global-cto-algorithm-2021"],
      blocks: [
        {
          kind: "p",
          text: "In CTO PCI the angiogram is the plan. Brilakis names dual injection, needed in most CTO cases, as a key difference between CTO and non-CTO PCI, and the consensus makes dual angiography with a structured review its second principle. The collateral lesson of pm-interpreting taught how to film and grade collaterals; this lesson turns the same pictures into strategy decisions, feature by feature. Brilakis treats the collateral review as critical for judging whether a retrograde approach is feasible, and notes that a careful review before the procedure can cut contrast, radiation and procedure time.",
        },
        { kind: "h", text: "Recording the study" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Two catheters, two arteries",
              detail:
                "Place a catheter in the occluded artery and another in the artery that supplies its collaterals. Brilakis wants dual injection in every patient whose CTO is filled by contralateral collaterals: it is, in his view, the simplest single step that most raises success, and it makes crossing safer because it shows where the wire is and helps manage complications such as perforation.",
            },
            {
              title: "2. Low magnification, breath hold, no panning",
              detail:
                "Film so that the whole occlusion and the full collateral course are in the field, during a breath hold, without panning (panning degrades the image, especially in dual-injection runs, 6.6). Use projections that open the collaterals fully. Brilakis wants this quality from the routine diagnostic study when a CTO is first found.",
            },
            {
              title: "3. Keep acquiring until the collaterals have filled",
              detail:
                "Long acquisitions are kept for delayed collateral filling (6.6); Oxford also asks for prolonged acquisition to examine collaterals. In patients with prior bypass surgery, where CTOs are common, long runs without panning help show the collateral circulation (18.6). The books differ on panning: Oxford's general filming advice has the radiographer pan to follow the distal vessels, whereas Brilakis pans only when needed and says it is best avoided because it degrades the image, especially in dual-injection runs. For CTO dual-injection runs, follow Brilakis and do not pan (6.6, 21.6.4).",
            },
            {
              title: "4. Use orthogonal views during crossing",
              detail:
                "Injecting the contralateral artery or graft is often needed to see where the wire is in a CTO, and Brilakis counts it among the key principles of crossing; orthogonal projections confirm the position (8.6). A stored reference image also helps. Oxford adds that when the wire has crossed but there is still no antegrade flow, dye injected through an over-the-wire balloon or probing catheter shows whether the wire is inside or outside the lumen. Brilakis adds that IVUS can confirm true-lumen re-entry (21.13).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-dual-injection" },
        { kind: "h", text: "The four features, and what each one changes" },
        {
          kind: "table",
          caption: "Reading a CTO, one feature at a time (Brilakis 21.6)",
          head: ["Feature", "What to record", "Favourable", "Unfavourable, and what it changes"],
          rows: [
            [
              "1. Proximal cap",
              "Where the occlusion begins and its shape",
              "A clear, tapered entry",
              "An ambiguous cap: blind crossing risks perforation; clarify it, go retrograde or 'move the cap' (next lesson)",
            ],
            [
              "2. Length, course and composition",
              "Length from proximal to distal cap, the course of the occluded segment, calcium, bends",
              "Short, straight, little calcium",
              "Heavy calcium and tortuosity hinder crossing and make subintimal (extraplaque) entry likelier; a bend of more than 45° within the lesion is significant (6.8). An unclear or very tortuous course favours a knuckled wire or a retrograde approach (a knuckled, J-shaped wire advances within the vessel architecture with a low risk of perforation)",
            ],
            [
              "3. Distal vessel",
              "Calibre, filling, disease, branches, calcium at the distal cap",
              "Larger than 2.0 mm, fills well, no significant disease, no major branches",
              "Small, diffusely diseased vessels are harder, especially after subintimal entry; distal calcium can hinder re-entry after subintimal entry; a bifurcation at the distal cap argues against antegrade dissection and re-entry: Brilakis favours retrograde, and the 2021 global algorithm also uses a dual-lumen microcatheter and IVUS for antegrade wiring",
            ],
            [
              "4. Collaterals",
              "Route (septal, epicardial, graft), size, tortuosity, branching, entry and exit angles, stent jailing, distance from exit to distal cap",
              "Straight channels of good size, ideally septal, or a patent graft",
              "No interventional collateral: retrograde is not available; an IMA-supplied donor LAD: avoid working through the graft",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Length is easily overestimated.** With an antegrade injection alone, the distal vessel fills poorly because antegrade and retrograde flow compete, so the distal cap is unclear and the occlusion looks longer than it is. Dual injection, or CT before the case, gives the true position of the proximal cap, the length and the distal cap anatomy.",
        },
        {
          kind: "p",
          text: "**The distal vessel can be smaller than it really is.** Some distal vessels are small because they have been underperfused and have remodelled inwards; they enlarge after recanalisation. Do not reject a CTO, or size its stents, from the calibre seen before it is opened. When the native artery has a graft inserted beyond the occlusion, its distal cap tends to be calcified and hard for wires to penetrate.",
        },
        {
          kind: "p",
          text: "**Bifurcations at either cap.** A branch at the proximal cap, inside the occlusion or at the distal cap makes it harder to wire the main branch antegradely and more likely that a side branch is lost. At the distal cap Brilakis favours the retrograde approach, because antegrade techniques often occlude one of the two branches. The 2021 global crossing algorithm handles a distal-cap bifurcation with a dual-lumen microcatheter and IVUS, so antegrade wiring is not excluded; neither source recommends antegrade dissection and re-entry for a bifurcation at the distal cap. A dual-lumen microcatheter is also one tool for wiring a CTO with a side branch next to the proximal cap (30.6).",
        },
        {
          kind: "check",
          stem: "An antegrade RCA injection suggests a 45 mm occlusion ending at the crux. With simultaneous LAD injection, septal collaterals fill the PDA and the distal RCA back to within 22 mm of the proximal cap, and the distal cap sits just before the bifurcation of the PDA and posterolateral branch. What do you conclude?",
          options: [
            "The occlusion is 45 mm long; the LAD injection only shows collateral flow and should not change the measurement",
            "The occlusion is about 22 mm long, and the bifurcation at the distal cap favours a retrograde approach",
            "The occlusion is about 22 mm long, and the bifurcation favours dissection and re-entry from the antegrade side",
            "The study cannot be interpreted until the RCA is injected alone again in a longer run",
          ],
          answer: 1,
          explanation:
            "Antegrade-only injections overestimate length because the distal vessel fills poorly; the dual injection shows the true distal cap, about 22 mm beyond the proximal cap. With a bifurcation at the distal cap, Brilakis favours retrograde, because antegrade techniques often occlude one of the two branches. The 2021 global algorithm would also allow antegrade wiring with a dual-lumen microcatheter and IVUS, but antegrade dissection and re-entry from the antegrade side is the choice to avoid here.",
        },
        { kind: "h", text: "Reading collaterals for the retrograde option" },
        {
          kind: "steps",
          items: [
            {
              title: "Grade filling and size",
              detail:
                "Rentrop grades how much of the recipient artery fills (0 none, 1 side branches only, 2 partial filling of the epicardial vessel, 3 complete filling); the Werner grade describes the channel itself (CC0 no continuous connection, CC1 thread-like, CC2 side-branch-like). The definitions are taught in pm-interpreting.",
            },
            {
              title: "Judge crossability",
              detail:
                "Lack of tortuosity is the strongest predictor that wires and devices will cross a collateral, followed by size. Invisible septal channels can often still be crossed by 'surfing', letting a wire find the path of least resistance. Septal channels are usually safer and easier than epicardial ones, and unlike epicardials can be dilated with small balloons (1.5 mm or less) at low pressure (2–4 atm) if a device will not follow.",
            },
            {
              title: "Look at the donor artery",
              detail:
                "Assess the donor artery proximal to the collateral, and whether one large collateral carries most of the supply (collateral dominance): both predict ischaemia while retrograde equipment occupies the channel. A donor lesion in the path of the retrograde route should be treated to prevent donor thrombosis (21.10).",
            },
            {
              title: "Grafts as routes",
              detail:
                "A patent bypass graft is an ideal retrograde conduit (no side branches, predictable course, large calibre), although the angle of its distal anastomosis can be awkward; even an occluded graft can be used. If the collaterals come from an LAD that is supplied by a mammary graft, working through the mammary graft risks global ischaemia and is avoided when possible.",
            },
            {
              title: "Shifting collaterals",
              detail:
                "Study previous films for every possible route: the dominant collateral can change before or during the procedure, and a channel seen before but not today may still be crossable.",
            },
            {
              title: "When the anatomy is still unclear",
              detail:
                "Selective contrast injection through a microcatheter placed in the collateral outlines it; inject through the central lumen from a small 2–3 cc Luer-lock syringe, and confirm good blood backflow first so that the injection does not cause barotrauma. If unfavourable or non-interventional epicardial collaterals carry most of the flow, gentle balloon occlusion of that epicardial channel for 2–4 minutes may recruit more favourable interventional collaterals.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-microcatheter-injection" },
        {
          kind: "check",
          stem: "Two septal channels connect the LAD to the PDA in a patient with an RCA CTO. Channel A is CC2 but corkscrew-tortuous; channel B is CC1 and almost straight. Which is the better first choice for retrograde crossing, according to the evidence Brilakis quotes?",
          options: [
            "Channel A, because size is the strongest predictor of crossing a collateral",
            "Neither, because CC1 and tortuous CC2 channels cannot be crossed by wires",
            "Channel B, because absence of tortuosity predicts crossing more strongly than size",
            "Whichever fills the PDA first on the dual injection, because filling speed predicts crossing",
          ],
          answer: 2,
          explanation:
            "In the study Brilakis cites, lack of tortuosity was the most important predictor of wire and device crossing, followed by size. Size is the tempting answer. Even invisible septal channels can often be crossed by surfing, so CC1 is not a barrier.",
        },
        {
          kind: "list",
          items: [
            "**Oxford's reading of collaterals.** Each of the three main territories can grow collaterals to the others; collaterals seen during an injection suggest reduced supply to the territory they fill. With an occluded native artery after bypass surgery, the absence of collaterals suggests that the graft to it may still be open.",
            "**Oxford's example.** In its RCA CTO figures, the distal RCA beyond the occlusion is seen only by retrograde filling from a contralateral left injection, used to confirm that the PCI wire stayed in the lumen.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring length from an antegrade-only injection and choosing a long-occlusion strategy for a short CTO.",
            "Rejecting a CTO because the distal vessel looks small, when it is small only because it has been underfilled.",
            "Missing a bifurcation at the distal cap and losing a branch to antegrade dissection.",
            "Choosing a collateral by size alone and ignoring tortuosity.",
            "Injecting through a microcatheter wedged in a collateral without checking for backflow.",
            "Planning a retrograde route through an LAD that depends on a mammary graft.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the four features down before you open any equipment, in one line each: cap clear or ambiguous; length and course; distal target good or poor; interventional collateral yes or no. Those four answers are exactly the inputs of the hybrid algorithm.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, film with dual injection (the contralateral syringe) at low magnification without panning, keep acquiring until the distal vessel fills, and record the four features: cap, length and course, distal vessel, collaterals. Compare the length on an RCA-only run with the dual run.",
        },
        { kind: "drill", target: "angio-real", drill: "collaterals", task: "For each real run with collateral filling, name the donor and recipient, give a Rentrop grade, and say whether the channel looks septal or epicardial and whether it is straight or tortuous." },
        { kind: "video", id: "VDTpF1c-294", note: "Brilakis: CTO PCI, performing and analysing the angiogram." },
        { kind: "video", id: "wJy_YmEto_g", note: "Manual of CTO PCI case 287: LAD CTO with a poorly visualised distal vessel." },
        { kind: "video", id: "1kU95JiWbFY", note: "Manual of CTO PCI case 152: the value of the old angiogram." },
        { kind: "video", id: "_29gD_J_ddc", note: "Manual of CTO PCI case 251: RCA with tandem CTOs." },
        {
          kind: "keypoints",
          items: [
            "Dual injection in every CTO with contralateral collaterals: it raises success and safety.",
            "Low magnification, breath hold, no panning, long enough for the collaterals to fill.",
            "Four features: proximal cap; length, course and composition; distal vessel; collaterals.",
            "Antegrade-only runs overestimate length; underfilled distal vessels enlarge after recanalisation.",
            "A bifurcation at the distal cap argues against antegrade dissection and re-entry: Brilakis favours retrograde; the 2021 global algorithm also allows antegrade wiring with a dual-lumen microcatheter and IVUS.",
            "Collaterals: lack of tortuosity predicts crossing best, then size; septals are safer and can be dilated with balloons of 1.5 mm or less at 2–4 atm.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-cap-ambiguity",
      title: "Proximal cap ambiguity",
      minutes: 12,
      topics: ["cto-cap-ambiguity"],
      sources: [B("21.6"), B("21.8"), B("21.5"), B("21.13"), B("13.1"), B("13.4"), B("30.6"), O("ch 1: Cardiac CT or invasive angiography?")],
      refs: [...BOOKS, "karatasakis-cap-ambiguity-2016", "vo-move-the-cap-2016", "harding-apcto-algorithm-2017", "cto-consensus-2019"],
      blocks: [
        {
          kind: "p",
          text: "The proximal cap is where the occlusion begins. When you cannot tell where it is, or what shape it has, the cap is ambiguous. A side branch at the start of the occlusion is one setting in which the cap can be hard to define, and flush aorto-ostial CTOs, which leave no stump to engage, raise a similar problem and, like ambiguous caps, are often approached retrogradely from the start. Brilakis's warning is short: trying to cross a cap you cannot locate may lead to perforation, so the cap must be clarified or bypassed before any stiff wire is pushed.",
        },
        {
          kind: "list",
          items: [
            "**How common, and how much it matters.** In the US multicentre registry Brilakis cites (Karatasakis 2016, 1,021 procedures), proximal cap ambiguity was present in 31% of CTOs. These lesions more often had prior bypass surgery (43% against 33%) and moderate or severe calcium (66% against 51%).",
            "**Outcomes.** Technical success was lower (85% against 93%) and so was procedural success (84% against 91%), but major adverse cardiac events were similar (3.2% against 2.9%). Ambiguous caps needed more contrast (281 against 250 mL), more radiation (air kerma 4.0 against 3.0 Gy) and longer procedures (161 against 119 minutes), and IVUS was used more (49% against 36%).",
            "**The retrograde approach dominated.** It was used in 68% of ambiguous-cap cases against 33%, and was more often both the first strategy (39% against 13%) and the one that succeeded (42% against 20%).",
          ],
        },
        { kind: "h", text: "Five ways to find or bypass the cap" },
        {
          kind: "steps",
          title: "Five ways to find or bypass the cap (Brilakis 21.6.1)",
          items: [
            {
              title: "1. More projections",
              detail:
                "Further projections may show a stump that the standard views hide. CT, if available, can choose the views with least foreshortening (21.1).",
            },
            {
              title: "2. A selective injection near the cap",
              detail:
                "Contrast injected through a microcatheter placed close to the proximal cap can outline the stump that a guide injection does not show.",
            },
            {
              title: "3. IVUS",
              detail:
                "IVUS can resolve cap ambiguity and show the course of the vessel (21.8, 21.13). Brilakis prefers solid-state (phased-array) catheters for CTO crossing, because they image closer to the tip (13.4). A 6 Fr guide may exclude IVUS-guided cap penetration (21.5), which is one reason to start with larger guides. The Asia Pacific algorithm also gives IVUS-guided entry a defined role for proximal cap ambiguity.",
            },
            {
              title: "4. CT before the case, or fused with fluoroscopy",
              detail:
                "Preprocedural CCTA, or CT co-registered in real time with the fluoroscopic image, can show where the occluded segment begins and how it runs. Oxford lists clarifying the proximal cap of a CTO among the indications for cardiac CT.",
            },
            {
              title: "5. Move the cap",
              detail:
                "Dissection and re-entry techniques can deliberately enter the vessel wall proximal to the occlusion and bypass the cap altogether. In the technique Vo, Karmpaliotis and Brilakis describe, the subintimal space is entered just proximal to the cap with a stiff wire, or with the help of a slightly oversized balloon inflated there, and the case continues as standard antegrade dissection and re-entry. They describe it as minimising the risk of perforation, and note it also helps with balloon-uncrossable lesions. The re-entry step is outlined in the crossing-strategy lesson.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-no-blind-cap" },
        {
          kind: "check",
          stem: "An LAD CTO begins at the origin of a large first diagonal. On every projection the diagonal overlies the start of the occlusion and you cannot see a stump. There are no interventional collaterals. What is the most appropriate next step?",
          options: [
            "Aim a stiff, high-penetration wire at the expected position of the cap, checking with orthogonal views",
            "Abandon the attempt, because an ambiguous cap without collaterals cannot be treated percutaneously",
            "Start retrograde through the best available collateral, even though none is interventional",
            "Locate the cap with IVUS or CT, or bypass it with a move-the-cap technique, then proceed antegradely",
          ],
          answer: 3,
          explanation:
            "Without a collateral or graft, Brilakis approaches an ambiguous cap antegradely, using IVUS or preprocedural CT to locate the cap and the vessel course, or move-the-cap techniques to enter the wall proximal to the occlusion. Pushing a stiff wire at a guessed cap is the tempting error: it is exactly the move that leads to perforation. Ambiguity alone does not rule out PCI.",
        },
        { kind: "h", text: "Choosing the strategy for an ambiguous cap" },
        {
          kind: "table",
          caption: "Brilakis 21.6 and 21.8: decision by decision",
          head: ["Situation", "Usual approach"],
          rows: [
            ["Cap ambiguous, and clarified by projections, microcatheter injection, IVUS or CT", "Antegrade crossing can proceed safely, guided by what the imaging showed"],
            ["Cap remains ambiguous, and a collateral or graft route is available", "A primary retrograde approach, or a move-the-cap technique, is often recommended, if technically feasible"],
            ["Flush aorto-ostial CTO (no stump to engage)", "Often a primary retrograde approach"],
            ["Cap remains ambiguous, no usable collateral or graft", "Antegrade, using IVUS or preprocedural CT to locate the cap and course, or a move-the-cap technique"],
          ],
        },
        {
          kind: "p",
          text: "Ambiguity is the first of the three questions in both the hybrid and the Asia Pacific algorithms (next lesson): a yes points towards retrograde. It also interacts with the other features. If the cap is at a bifurcation, a dual-lumen microcatheter helps wire a CTO with a side branch next to the proximal cap (30.6), and any antegrade entry there risks losing the branch (21.6).",
        },
        {
          kind: "check",
          stem: "A proximal RCA CTO is flush with the aorta: no stump can be engaged, and the distal RCA fills well from straight septal collaterals of good size. What is the usual first strategy?",
          options: [
            "Primary retrograde approach through the septal collaterals",
            "Antegrade wire escalation from a guide sitting freely at the right sinus",
            "Antegrade dissection and re-entry, starting from the aortic wall",
            "No attempt: flush ostial CTOs are a contraindication to CTO PCI",
          ],
          answer: 0,
          explanation:
            "Brilakis notes that flush aorto-ostial CTOs, like other ambiguous caps, are commonly tackled retrogradely from the start, and here an interventional septal route is available. Ambiguity alone does not rule out PCI, so declining to attempt it is not the answer.",
        },
        {
          kind: "pitfalls",
          items: [
            "Probing an unseen cap with a stiff wire 'to feel for it'.",
            "Choosing 6 Fr guides and then finding you cannot use IVUS at the cap.",
            "Treating 'ambiguous' as 'impossible': many such CTOs are crossed retrogradely or after imaging.",
            "Entering the wall at a bifurcation without a plan to keep the side branch.",
          ],
        },
        {
          kind: "pearl",
          text: "Make the cap a deliberate decision, not a guess. Write down where you believe the occlusion begins and what told you so: a view, a microcatheter injection, IVUS or CT. If you cannot name the evidence, the cap is still ambiguous and the plan should be retrograde or move the cap.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Run IVUS on the bench and practise naming the lumen, the vessel wall and any branch on each frame; a dedicated scenario in which IVUS locates a CTO cap at a branch has been requested for the lab.",
        },
        { kind: "video", id: "tuyI7hLr-X0", note: "Manual of CTO PCI video 16.1: proximal cap ambiguity." },
        { kind: "video", id: "4lthDgjfR-w", note: "Manual of CTO Interventions case 34: IVUS for proximal cap ambiguity." },
        { kind: "video", id: "Zx7AbcJhSrM", note: "Manual of CTO Interventions case 45: 'move the cap' for proximal cap ambiguity." },
        { kind: "video", id: "78bi9BATCLQ", note: "Manual of CTO PCI case 144: CT co-registration for clarifying ambiguity." },
        {
          kind: "keypoints",
          items: [
            "An ambiguous cap is one whose position or shape cannot be determined; crossing it blindly risks perforation.",
            "Present in about a third of CTOs in a US registry, with lower success but similar major events.",
            "Clarify with more views, a microcatheter injection near the cap, IVUS or CT (before or co-registered).",
            "Bypass with move-the-cap: enter the wall just proximal to the cap, then standard dissection and re-entry.",
            "Unresolved ambiguity or a flush aorto-ostial CTO: often primary retrograde, or move the cap, if technically feasible.",
            "Without collaterals: antegrade with IVUS or CT guidance, or move the cap.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-hybrid",
      title: "Crossing algorithms, global principles and when to stop",
      minutes: 15,
      topics: ["cto-hybrid"],
      sources: [B("21.8"), B("21.7"), B("21.13"), B("8.2"), B("8.6"), O_CTO],
      refs: [...BOOKS, "cto-consensus-2019", "brilakis-cto-algorithm-2012", "harding-apcto-algorithm-2017", "wu-global-cto-algorithm-2021", "galassi-eurocto-consensus-2019", "tajti-progress-hybrid-2018", "laskey-vcrcl-2007"],
      blocks: [
        {
          kind: "p",
          text: "Getting a wire through the occlusion is the hardest part of CTO PCI (21.8). Crossing algorithms turn the angiogram into a first choice, and, just as important, tell you when and how to change it. This lesson is the decision framework, with the crossing techniques at each branch in outline; their step-by-step detail belongs to the antegrade and retrograde CTO modules.",
        },
        { kind: "h", text: "Four strategies, two questions" },
        {
          kind: "table",
          caption: "Brilakis classifies crossing by direction and by whether the vessel wall is used (Fig. 21.3)",
          head: ["", "Stay in the plaque (wiring)", "Use the wall (dissection and re-entry)"],
          rows: [
            [
              "Antegrade (with blood flow)",
              "Antegrade wiring, also called wire escalation: the commonest technique; wires are escalated and then de-escalated according to the cap and the body of the occlusion",
              "Antegrade dissection and re-entry: cross within the wall, then re-enter the distal true lumen, ideally close to the distal cap, with a dedicated re-entry system or a wire-based technique",
            ],
            [
              "Retrograde (against flow, from the distal vessel through a collateral or graft)",
              "Retrograde wiring: usually for short occlusions, especially with a tapered distal cap",
              "Retrograde dissection and re-entry: most often reverse CART, a balloon inflated over the antegrade wire creating a space the retrograde wire enters",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Antegrade first, in general.** Brilakis prefers antegrade crossing as the initial strategy, because the retrograde approach carries more complications, takes longer and uses more radiation, and because the lesion has to be prepared antegradely even when it is crossed retrogradely. He notes that some complications counted in retrograde cases are caused by the antegrade attempts.",
            "**Retrograde is still essential.** It is critical for high success, especially in complex CTOs, and has been associated with favourable long-term outcomes.",
            "**What experienced centres actually do.** In PROGRESS CTO, the final successful strategy was antegrade wire escalation in 52.0%, retrograde in 27.1% and antegrade dissection and re-entry in 20.9%, and more than one strategy was needed in 40.9% of cases. Median contrast was 270 mL, air kerma 2.9 Gy and procedure time 123 minutes.",
            "**Oxford's 'novel' approaches.** Oxford lists the retrograde approach (for example a proximal RCA CTO crossed from the LAD through septals), ultrasonic and laser guidewires, and catheter devices for guided blunt dissection as evolving techniques.",
          ],
        },
        { kind: "h", text: "Crossing techniques in outline" },
        {
          kind: "steps",
          title: "What happens at each branch (Brilakis 21.8.1 to 21.8.3)",
          items: [
            {
              title: "1. Antegrade wiring: pick the first wire from the cap",
              detail:
                "Tapered cap (or a functional occlusion in which a channel can be seen): begin with a polymer-jacketed, tapered wire of low penetration force, and escalate to intermediate and then high penetration force only as needed. Blunt cap: begin with an intermediate-penetration wire, polymer-jacketed or with a composite core. Keep stiff, high-penetration wires for a cap that resists everything else, or for resistant segments inside the occlusion (p.392).",
            },
            {
              title: "2. Step down once the cap is breached",
              detail:
                "When the wire has passed 1–2 mm beyond the proximal cap, change back to a less penetrating wire to travel through the occluded segment safely. Brilakis calls the escalation and de-escalation together 'step-up/step-down'.",
            },
            {
              title: "3. Locate the wire, then act on where it is",
              detail:
                "Contralateral injection and orthogonal views show the position. In the distal true lumen: advance the microcatheter and exchange for a workhorse wire (last lesson of this module). Outside the vessel: withdraw and redirect, with nothing advanced over it. In the subintimal space: try to redirect it; if that fails, leave it where it is as a guide and steer a second wire into the true lumen beside it (the parallel wire technique), helped by a dual-lumen microcatheter or by IVUS, or move to dissection and re-entry.",
            },
            {
              title: "4. Do not track far beyond the distal cap in the wall",
              detail:
                "A wire pushed well past the distal cap in the subintimal space raises a haematoma that compresses the true lumen and makes success less likely. IVUS can guide antegrade re-entry, but it needs 8 Fr guides and skill in reading IVUS, and the IVUS catheter lying in the subintimal space restricts how freely the wire can be steered.",
            },
            {
              title: "5. Antegrade dissection and re-entry: limited, not the old STAR",
              detail:
                "The wire enters the wall (on purpose, or by accident during wiring), crosses the occlusion within it and re-enters the distal true lumen. Limited techniques, with a dedicated re-entry system or a wire-based method, keep the vessel injury small, shorten the dissection and therefore the stented length, and make it more likely that side branches survive; they have been associated with favourable clinical outcomes. This is what separates them from the original STAR (below).",
            },
            {
              title: "6. Retrograde: reach the distal cap first",
              detail:
                "A wire passes through a collateral channel or a bypass graft into the artery beyond the occlusion, and a microcatheter follows it to the distal cap. From there, cross by retrograde wiring (mostly chosen for short occlusions, all the more if the distal cap tapers) or by retrograde dissection and re-entry.",
            },
            {
              title: "7. Reverse CART, and what helps when it struggles",
              detail:
                "A balloon is inflated over the antegrade wire, which usually lies in the subintimal space, and the retrograde wire is steered into the space the balloon has made once it is deflated. When reverse CART is difficult, IVUS can show why it is failing and helps choose the balloon size (21.13), and a guide extension catheter can make it easier.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-step-down" },
        { kind: "tip", id: "pci-cto-strategy-subintimal-wire" },
        {
          kind: "check",
          stem: "A tapered LAD cap resisted a soft tapered wire and then an intermediate one. A stiff, high-penetration wire has just entered the cap and is now about 2 mm into the occlusion, with the contralateral injection showing it within the vessel course. What does Brilakis's technique call for next?",
          options: [
            "Keep the stiff wire and push it through the whole occluded segment while it is making progress",
            "Change to a less penetrating wire to travel through the rest of the occlusion",
            "Switch to a retrograde approach now, because a stiff wire was needed for the cap",
            "Advance the stiff wire well beyond the distal cap before checking where it lies",
          ],
          answer: 1,
          explanation:
            "Stiff wires are for breaching a resistant cap; once the wire is 1–2 mm through it, Brilakis de-escalates to a less penetrating wire to navigate the occluded segment safely (step-up/step-down). Carrying on with the stiff wire is the tempting error, because it is moving, but Oxford notes that perforation is not uncommon with stiff wires. Needing a stiff wire is not in itself a reason to go retrograde, and tracking far beyond the distal cap in the wall risks a compressing haematoma.",
        },
        { kind: "h", text: "The hybrid algorithm" },
        {
          kind: "figure",
          id: "cto-algorithm",
          caption: "The hybrid crossing algorithm: dual injection first; an ambiguous cap or a poor distal target, with an interventional collateral to use, points to retrograde, otherwise antegrade; length under 20 mm points to wire escalation, otherwise dissection and re-entry; any failure moves to another branch.",
        },
        {
          kind: "steps",
          title: "Walking the algorithm (Brilakis Fig. 21.4)",
          items: [
            {
              title: "Step 1. Dual injection",
              detail: "Every branch of the algorithm starts from a dual-catheter angiogram read for the four features.",
            },
            {
              title: "Step 2. Antegrade or retrograde?",
              detail:
                "Three questions: is the proximal cap ambiguous, is the distal target poor, and is there an interventional collateral? Ambiguity or a poor distal target with a usable collateral points to a retrograde start; without them, start antegrade. (A retrograde start needs a collateral or graft; without one, ambiguity is handled as in the previous lesson.)",
            },
            {
              title: "Step 3. Wiring or dissection and re-entry?",
              detail:
                "The fourth feature, length: under 20 mm favours wire escalation; 20 mm or more favours dissection and re-entry. This applies on both sides: antegrade wire escalation against antegrade dissection and re-entry, retrograde wire escalation against retrograde dissection and re-entry (reverse CART).",
            },
            {
              title: "Step 4. If it fails, move",
              detail:
                "Every box in the figure has a 'fail' exit to another box: antegrade wiring to antegrade dissection and re-entry, retrograde wiring to reverse CART, and any antegrade strategy to any retrograde one and back.",
            },
          ],
        },
        {
          kind: "check",
          stem: "An LAD CTO has a clear tapered cap, a 32 mm occlusion, a good distal LAD without branches at the distal cap, and only CC0 septal connections. Which first strategy does the hybrid algorithm point to?",
          options: [
            "Retrograde wire escalation through the septal connections",
            "Antegrade dissection and re-entry",
            "Antegrade wire escalation, because the cap is tapered",
            "Reverse CART from the outset",
          ],
          answer: 1,
          explanation:
            "Cap clear and distal target good: antegrade, whatever the collaterals. Length 20 mm or more: the hybrid figure points to dissection and re-entry. Antegrade wiring is still the commonest first technique overall (21.8.1, consensus principle 4), and the Asia Pacific algorithm does not decide on length alone, so starting with wire escalation for a tapered cap and moving early to dissection and re-entry if it stalls is also defensible. The question asks only what the hybrid figure points to.",
        },
        { kind: "h", text: "The Asia Pacific algorithm: what differs" },
        {
          kind: "table",
          head: ["Question", "Hybrid", "Asia Pacific CTO Club (Harding 2017)"],
          rows: [
            ["Antegrade or retrograde first", "Cap ambiguity, distal vessel quality, interventional collaterals", "The same three questions"],
            ["Wiring or dissection", "Occlusion length (under 20 mm or not)", "Not length alone: ambiguity of the vessel course, severe calcium, tortuosity, length and previous failure together"],
            ["Case selection", "Not part of the figure", "Uses the J-CTO score for case selection"],
            ["Cap ambiguity", "Retrograde if a route exists; IVUS can locate the cap", "Gives IVUS-guided entry a defined role"],
            ["When antegrade wiring fails", "Antegrade dissection and re-entry, or a switch to retrograde (the fail arrows join all four boxes)", "Parallel wiring or dissection and re-entry with a re-entry balloon system; IVUS-guided wiring and limited subintimal tracking and re-entry as final options"],
            ["Stopping", "Discussed in the text (stop rules)", "Built into the algorithm"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis presents both as aids, and adds that the choice of the first and later strategies also depends on local equipment and expertise. A third set of recommendations, the 2019 EuroCTO Club consensus, is among the algorithms he cites for strategy change.",
        },
        { kind: "h", text: "The 2021 global crossing algorithm" },
        {
          kind: "p",
          text: "In 2021, after the hybrid figure that the manual reproduces, an international group led by Wu, Brilakis and Mashayekhi published a single global crossing algorithm of ten steps. It keeps the structure taught above and adds explicit steps for what happens after failure.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Start with dual angiography.",
            "Review the films carefully for the four features: proximal cap, occluded segment, distal vessel quality and collaterals.",
            "Deal with proximal cap ambiguity using IVUS, the retrograde approach or move-the-cap techniques.",
            "Deal with a poor distal vessel by going retrograde, and with a bifurcation at the distal cap by using a dual-lumen microcatheter and IVUS.",
            "Judge whether retrograde crossing is feasible through grafts, septal channels or epicardial channels.",
            "Apply the antegrade wiring strategies.",
            "Apply the retrograde approach.",
            "Change strategy when the current one stops making progress.",
            "If crossing fails, consider an investment procedure (subintimal plaque modification) before a later attempt.",
            "Stop for high radiation or contrast doses, a long procedure, a serious complication, operator or patient fatigue, or lack of the expertise or equipment needed.",
          ],
        },
        {
          kind: "p",
          text: "Two differences from the manual's text matter at the table. For a bifurcation at the distal cap, Brilakis favours retrograde (21.6.3), whereas the global algorithm approaches it with a dual-lumen microcatheter and IVUS. And the stop list adds a long procedure and missing expertise or equipment to the reasons in 21.8.5.",
        },
        { kind: "tip", id: "pci-cto-strategy-hybrid-first-choice" },
        { kind: "h", text: "The seven global guiding principles" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Improving ischaemic symptoms is the main indication for CTO PCI.",
            "Dual angiography with a thorough, structured review of the films (and of CCTA when available) underpins planning and safety.",
            "A microcatheter is essential for controlling and exchanging wires.",
            "Antegrade wiring, antegrade dissection and re-entry and the retrograde approach complement one another and are all needed; antegrade wiring is the usual first technique, and the others are often required for complex CTOs.",
            "If the first strategy fails, changing efficiently to another raises eventual success, shortens the procedure and cuts radiation and contrast.",
            "CTO-specific expertise, volume and equipment raise crossing success and help prevent and manage complications such as perforation.",
            "Careful lesion preparation and stenting, often with intracoronary imaging, secure stent expansion and limit short- and long-term events.",
          ],
        },
        { kind: "h", text: "Changing strategy" },
        {
          kind: "steps",
          items: [
            {
              title: "Small changes",
              detail: "If the current approach is not progressing, one option is a small change: a different tip angulation or a different wire.",
            },
            {
              title: "Bigger changes",
              detail:
                "The other option is to convert to another strategy, for example from antegrade to retrograde. Either kind of change may come first: Brilakis bases the choice on the pre-procedure plan and on how the case is going, and the timing and the next strategy depend on the lesion, the problem you have met and the equipment and skills available.",
            },
            {
              title: "Do not wait too long",
              detail:
                "The fifth principle rewards changing efficiently: persisting with a failing technique costs time, contrast and radiation that the next strategy will need.",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-change-early" },
        { kind: "h", text: "When to stop" },
        {
          kind: "table",
          caption: "Reasons to stop a CTO attempt: Brilakis 21.8.5, with two added by the 2021 global algorithm",
          head: ["Reason", "Threshold or trigger"],
          rows: [
            ["A complication", "Occurrence of a complication (then weigh the individual risk against the benefit before any further attempt)"],
            ["Radiation", "Usually an air kerma dose above 5 Gy without crossing or substantial progress"],
            ["Contrast", "A volume above 3.7 times the estimated creatinine clearance"],
            ["No options left", "All feasible crossing strategies exhausted"],
            ["Fatigue", "Patient or physician fatigue"],
            ["A long procedure (2021 global algorithm)", "Long procedure time; no threshold is given"],
            ["Missing expertise or equipment (2021 global algorithm)", "The strategy still needed is beyond the skills or equipment available"],
          ],
        },
        {
          kind: "formula",
          name: "Contrast volume at which to consider stopping",
          expr: "contrast volume (mL) ≈ 3.7 × estimated creatinine clearance (mL/min)",
          note: "Basis: in 3,179 PCI patients (Laskey 2007), an early creatinine rise of more than 0.5 mg/dl occurred in 1.5%; a contrast volume to creatinine clearance ratio of 3.7 was a fair discriminator for it (C-statistic 0.69), and a ratio of 3.7 or more remained an independent predictor. Example: clearance 60 mL/min gives about 222 mL.",
        },
        {
          kind: "p",
          text: "Brilakis frames all of these as risk against benefit, judged again at each stage. He adds that a bail-out STAR, or simply ending the attempt, is often the wiser choice when the only options left are aggressive manoeuvres with a real risk of serious harm. STAR (subintimal tracking and re-entry) once meant uncontrolled re-entry with long stents, lost side branches and high restenosis and reocclusion; it is now a bail-out in which the subintimal track is ballooned without stenting, to prepare for a repeat attempt after 2–3 months (subintimal plaque modification, the 'investment' procedure, which the 2021 global algorithm makes its step after a failed crossing). The limited dissection and re-entry techniques that replaced it as a planned strategy do the opposite of the original STAR: they keep the vessel injury and the dissection short, so less stent is needed and side branches are more often preserved.",
        },
        {
          kind: "p",
          text: "**One rule, two wordings.** Brilakis's CTO chapter and the Laskey study behind it use the estimated creatinine clearance. His planning and monitoring chapters write the same 3.7 rule with the GFR (1, 2.6), and other lessons in this app follow that wording. Creatinine clearance and eGFR are different estimates of kidney function, so state which one you used when you set the limit.",
        },
        { kind: "tip", id: "pci-cto-strategy-stop-rules" },
        {
          kind: "check",
          stem: "An RCA CTO procedure has used 230 mL of contrast; the estimated creatinine clearance is 70 mL/min. Air kerma is 5.4 Gy. The retrograde wire has just been confirmed in the proximal true lumen and is entering the antegrade guide. What is the right decision?",
          options: [
            "Stop at once: an air kerma above 5 Gy is an absolute stop at any stage of the case",
            "Stop, because the contrast used has already passed 3.7 times the creatinine clearance",
            "Finish efficiently: the dose trigger applies without crossing or progress, and contrast is within the limit",
            "Carry on without limits, because the stop rules no longer apply once the occlusion is crossed",
          ],
          answer: 2,
          explanation:
            "The radiation trigger is an air kerma above 5 Gy in the absence of crossing or substantial progress; here the lesion has effectively been crossed. The contrast limit is 3.7 × 70 = 259 mL, and 230 mL is still below it. So the case should be completed, economically: the thresholds still matter, which is why the last option is wrong. Stopping now would throw away a successful crossing.",
        },
        {
          kind: "pitfalls",
          items: [
            "Persisting with one wire or one strategy long after it has stopped making progress.",
            "Starting retrograde when an antegrade strategy was reasonable, or refusing to go retrograde when the algorithm points there.",
            "Treating the stop thresholds as targets to reach rather than triggers to reconsider.",
            "Forgetting that the dose and contrast thresholds depend on whether you are making progress.",
            "Pursuing aggressive rescue manoeuvres when STAR or a planned failure would serve the patient better.",
          ],
        },
        {
          kind: "pearl",
          text: "Announce the four features and the planned first and second strategies at the start, and agree with the team the contrast and dose at which you will reassess. A plan said aloud is easier to change on time.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, after recording the four features, state the hybrid algorithm's first strategy and your fallback, and calculate the contrast limit from the patient's creatinine clearance before you start wiring.",
        },
        { kind: "video", id: "hkowLKvWwoE", note: "Manual of CTO PCI 8.4: CTO crossing algorithms." },
        { kind: "video", id: "YUiFjvjrB6Y", note: "Manual of CTO PCI 8.5: global guiding principles." },
        { kind: "video", id: "SShpWxF9J4c", note: "Manual of CTO PCI 8.3.1: retrograde approach overview." },
        {
          kind: "keypoints",
          items: [
            "Four strategies: antegrade or retrograde, wiring or dissection and re-entry.",
            "Antegrade first in general; retrograde is essential for complex CTOs.",
            "Hybrid: an ambiguous cap or poor distal target, with an interventional collateral, points to retrograde; length under 20 mm to wiring, otherwise dissection and re-entry.",
            "Asia Pacific: the same first three questions, but several factors, not length alone, choose wiring or dissection.",
            "Antegrade wiring: first wire chosen by the cap, step down after 1–2 mm; subintimal wire: redirect, parallel wire or dissection and re-entry, never far past the distal cap.",
            "Change efficiently: a small change (tip angle, wire) or a bigger one (another strategy), as the plan and the case dictate.",
            "Stop for a complication, air kerma above 5 Gy without progress, contrast above 3.7 × estimated creatinine clearance, no options left, or fatigue; the 2021 global algorithm adds a long procedure and missing expertise or equipment.",
            "After a failed crossing, consider an investment procedure and a planned repeat attempt.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-cto-strategy-finish",
      title: "After the crossing: stenting, imaging, physiology and safety",
      minutes: 11,
      topics: ["cto-hybrid"],
      sources: [B("21.8"), B("21.9"), B("21.10"), B("21.12"), B("21.13"), B("12.3"), B("8.2"), B("26"), O_CTO],
      refs: [...BOOKS, "cto-consensus-2019", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Crossing is not the end of a CTO case. The vessel is long, diseased and underfilled, the wire that crossed is often a stiff or polymer-jacketed one, and the collateral and donor artery may have been worked on. The last part of the case decides whether the result lasts and whether a complication shows itself later.",
        },
        {
          kind: "steps",
          title: "From crossing to closure",
          items: [
            {
              title: "1. Confirm the distal true lumen",
              detail:
                "Use contralateral injection and orthogonal views to confirm the wire position before anything follows it (21.8). Oxford lists the clues that a wire has left the lumen: an abnormal course or movement with the cardiac cycle, and repeated ventricular extrasystoles. If a wire has exited the vessel, withdraw and redirect it; do not advance a microcatheter, balloon or stent over it.",
            },
            {
              title: "2. Exchange the crossing wire",
              detail:
                "Once in the distal true lumen, advance the microcatheter into it and exchange the CTO wire for a workhorse wire, to protect the distal vessel from injury and perforation during balloons and stents (21.8, 8.2).",
            },
            {
              title: "3. Prepare the lesion",
              detail: "Lesion preparation follows the general rules (chapter 9; taught in pm-prep-and-stent and cp-calcium).",
            },
            {
              title: "4. Stent with imaging",
              detail:
                "Long lesions often need several long stents, especially in the RCA. Brilakis calls stent optimisation with intravascular imaging critical to prevent later events (21.10), and particularly important here because the stents are long and the distal vessel has remodelled inwards (21.13); imaging shows the expansion and apposition achieved. The 2024 ESC chronic coronary syndromes guideline also recommends intravascular imaging to guide PCI of anatomically complex lesions, long lesions among them. Remember that an underfilled distal vessel enlarges after flow returns.",
            },
            {
              title: "5. No IIb/IIIa inhibitor or cangrelor",
              detail:
                "Even after a successful result: small wire perforations can reopen and cause delayed effusion and tamponade (21.3).",
            },
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-confirm-before-advancing" },
        {
          kind: "check",
          stem: "After antegrade wire escalation, a stiff tapered wire appears to reach the distal LAD. On the contralateral injection in the second orthogonal view, the wire tip runs outside the vessel contour with a faint blush. What do you do?",
          options: [
            "Advance the microcatheter over it to confirm the position with a tip injection",
            "Withdraw the wire and redirect it, without advancing anything over it",
            "Inflate a small balloon over the wire at low pressure to seal the track",
            "Exchange for a workhorse wire through the microcatheter, then reassess",
          ],
          answer: 1,
          explanation:
            "When a wire has left the vessel, pull it back and steer it again; nothing (microcatheter, balloon or stent) should follow it out, because that could create a perforation or make one bigger. Advancing the microcatheter to check is the tempting error. Watch the haemodynamics and the contralateral injection for continued staining; perforation management is taught in the complications track.",
        },
        { kind: "h", text: "Physiology and imaging in CTO PCI" },
        {
          kind: "table",
          head: ["Question", "What the manual says"],
          rows: [
            ["Physiology in the CTO vessel before treatment", "Not typically used: in the small series of symptomatic patients Brilakis cites, the territory behaved as ischaemic even with good collaterals (21.12)"],
            ["Physiology after stenting", "Can assess the result: a pressure step-up shows a segment that needs more treatment"],
            ["Physiology in the donor artery", "Its lesion may look more significant while it feeds the CTO; FFR rose by 0.03 to 0.10 after recanalisation in the studies cited (in one, six of nine donor vessels with FFR 0.80 or less rose above 0.80); measure donor physiology ideally after recanalisation (12.3)"],
            ["IVUS during crossing", "Resolves cap ambiguity, guides and confirms true-lumen re-entry in antegrade and retrograde work, and sizes the balloon for reverse CART (21.13)"],
            ["Imaging for stents", "Optimises expansion and apposition, particularly important with long stents and a negatively remodelled distal vessel"],
          ],
        },
        { kind: "tip", id: "pci-cto-strategy-poststent-physiology" },
        { kind: "tip", id: "pci-interp-donor-ffr" },
        {
          kind: "check",
          stem: "A long RCA CTO has been stented. A pressure-wire pullback from the distal RCA shows a stable gradient that steps up sharply across the mid-RCA stent junction. What does Brilakis advise this indicates?",
          options: [
            "Nothing useful, because physiology cannot be interpreted in a recanalised CTO vessel",
            "That the donor LAD now needs treatment, because its FFR will have fallen",
            "That the distal vessel is still underperfused and will remodel, so no action is needed",
            "That the segment at the step-up needs further treatment, such as more expansion",
          ],
          answer: 3,
          explanation:
            "Physiology is not used before treatment in the CTO vessel, but after stenting it can assess the result: a step-up marks the segment needing more treatment. Imaging then shows why (for example underexpansion). Donor FFR tends to rise, not fall, after recanalisation.",
        },
        {
          kind: "list",
          items: [
            "**Oxford on complications.** It lists extraluminal wire passage, perforation, and restenosis or reocclusion as the CTO complications. A wire outside the lumen is suggested by an abnormal course or motion and repeated ventricular extrasystoles; perforation is recognised by contrast collecting in the pericardium or leaving the vessel in pulses; tamponade is not uncommon; pericardiocentesis, fluids and prolonged balloon inflation at the site stabilise the patient, and heparin reversal and a covered stent may be needed (perforation management is taught in the complications track).",
            "**Oxford on durability.** Restenosis and reocclusion rates stay high even after technical success, although drug-eluting stents reduce restenosis.",
            "**Before you leave (this module's advice).** A sensible final check, consistent with 21.10 and chapter 26: inject the donor and treated arteries again and look at every collateral that was used. Brilakis's perforation chapter requires a contralateral injection after sealing a perforation that was filling through collaterals, to exclude continued bleeding into it from the other artery (26).",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting over the stiff crossing wire instead of exchanging it.",
            "Sizing stents from the underfilled distal vessel without imaging.",
            "Ending with a IIb/IIIa inhibitor or cangrelor 'because the stents are long'.",
            "Measuring donor-vessel FFR before the CTO is opened and treating on that number alone.",
          ],
        },
        {
          kind: "pearl",
          text: "A CTO result is only as good as its weakest stent segment. Treat the long recanalised vessel as an imaging case from the start: plan the stent landing zones on IVUS or OCT, not on the angiogram of a vessel that has been starved of flow for months.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Stent a long lesion with two overlapping stents, then use IVUS to check expansion and apposition along the whole length and correct the weakest segment, as you would after a recanalised CTO.",
        },
        { kind: "video", id: "7qppmXnsj2E", note: "Manual of CTO PCI case 270: success or failure?" },
        { kind: "video", id: "D21ffwSgtDw", note: "Manual of CTO PCI case 273: success but..." },
        {
          kind: "keypoints",
          items: [
            "Confirm the distal true lumen with contralateral injection in orthogonal views before advancing anything.",
            "A wire outside the vessel: withdraw and redirect, never advance devices over it.",
            "Exchange the crossing wire for a workhorse through the microcatheter.",
            "Long stents, optimised with intravascular imaging; the distal vessel enlarges after recanalisation.",
            "No IIb/IIIa inhibitor or cangrelor; check the donor and the collaterals used before removing equipment.",
            "Before treatment, physiology is not typically measured in the CTO vessel; a post-stent step-up needs more treatment; donor FFR rose by a mean of 0.03 to 0.10 after recanalisation in the studies cited, but not in every patient, so measure it again after the CTO is opened.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-cto-strategy-q1",
      stem: "Which statement about defining a chronic total occlusion is consistent with both manuals?",
      options: [
        "A complete occlusion thought to have been present for about 3 months or more",
        "Any occlusion that fills by collaterals from another artery, whatever its age",
        "An occlusion with TIMI 1 flow that has been present for at least 6 weeks",
        "An occlusion classed as ACC/AHA type B because it is younger than 3 months",
      ],
      answer: 0,
      explanation:
        "For Brilakis a CTO has TIMI 0 flow and is thought to be 3 months old or more, and Oxford defines it as a complete occlusion for longer than 3 months; both centre on a complete occlusion of about three months or more. In the ACC/AHA scheme Oxford reproduces, an occlusion under 3 months is a type B feature and over 3 months a type C feature, so an occlusion classed as type B because it is under 3 months old is not chronic. Collateral filling is not part of either definition.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-cto-strategy-q2",
      stem: "A patient asks whether opening his RCA CTO will help him live longer. Which answer best reflects the randomised evidence?",
      options: [
        "Yes: DECISION-CTO showed fewer deaths and infarcts with CTO PCI than with no CTO PCI over 4 years",
        "None of the three randomised trials showed fewer deaths or infarcts; two showed less angina",
        "Yes: EURO-CTO showed lower mortality at 12 months in the PCI group",
        "No: EURO-CTO and DECISION-CTO showed worse health status after CTO PCI than with medical therapy at follow-up",
      ],
      answer: 1,
      explanation:
        "EURO-CTO (open-label) improved angina frequency and quality of life at 12 months, with similar major events. DECISION-CTO found no difference in death, infarction, stroke or repeat revascularisation (22.3% against 22.4%), with health status improving similarly in both arms, though it was stopped early and had many crossovers. ORBITA-CTO has now shown the angina benefit against a placebo procedure, but it was small and did not measure death or infarction. The indication is symptoms; quoting a survival benefit is the tempting error.",
      difficulty: 3,
      refs: ["euro-cto-2018", "decision-cto-2019", "khan-orbita-cto-2026", "cto-consensus-2019"],
    },
    {
      id: "cp-cto-strategy-q3",
      stem: "In which situation does Brilakis consider ad hoc treatment of a native CTO a reasonable choice?",
      options: [
        "A stable patient whose consent covered only diagnostic angiography",
        "Any CTO with a tapered stump, because such occlusions usually cross quickly with soft wires",
        "An acute coronary syndrome caused by a failing, heavily diseased vein graft",
        "A patient who has already received a large contrast volume at diagnosis",
      ],
      answer: 2,
      explanation:
        "Brilakis advises against ad hoc CTO PCI in most cases. His exceptions are an ACS from a failing, heavily diseased saphenous vein graft, where treating the native CTO is preferred if feasible, and patients in whom arterial access is very hard to obtain. Inadequate consent and a high contrast load are reasons to defer, not to proceed.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-strategy-q4",
      stem: "You are planning an RCA CTO that may need retrograde work through septal collaterals from the LAD. Which set-up best matches Brilakis's advice?",
      options: [
        "A single 6 Fr radial JR4 guide and a diagnostic catheter in the LAD, with bivalirudin",
        "A 7–8 Fr AL guide in the RCA, a second guide in the LAD, heparin aiming above 350 s",
        "An 8 Fr EBU guide in the RCA for maximal support, heparin aiming above 250 s",
        "Two 6 Fr guides, heparin above 300 s, and a IIb/IIIa inhibitor once wiring begins",
      ],
      answer: 1,
      explanation:
        "Brilakis recommends 7–8 Fr guides with supportive shapes (AL for the RCA, EBU or XB for the left main), unfractionated heparin with an ACT above 350 s for retrograde work, and no bivalirudin, IIb/IIIa inhibitor or cangrelor. A retrograde plan needs a guide in the donor artery. EBU is a left-sided curve; 250 s is the lower antegrade figure some operators accept.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-strategy-q5",
      stem: "An LAD CTO has an ambiguous cap at a large diagonal, a good distal vessel, and large, straight septal collaterals from the RCA. A colleague suggests IVUS from the diagonal to find the cap and then antegrade wiring. How does this compare with the hybrid algorithm?",
      options: [
        "It contradicts the manual, which forbids antegrade crossing of any ambiguous cap",
        "The algorithm points to retrograde; IVUS-guided antegrade entry is a recognised alternative",
        "The algorithm points to antegrade dissection and re-entry, because the occlusion length is still unknown",
        "The algorithm points to stopping, because ambiguity with a bifurcation precludes PCI",
      ],
      answer: 1,
      explanation:
        "An ambiguous cap with an interventional collateral points the hybrid algorithm to a primary retrograde approach. Brilakis also describes resolving the cap with IVUS or CT so that antegrade crossing can proceed safely, and the Asia Pacific algorithm gives IVUS-guided entry a defined role, so the colleague's plan is a legitimate alternative. The manual does not forbid antegrade crossing once the cap has been clarified.",
      difficulty: 3,
      refs: [...BRILAKIS, "brilakis-cto-algorithm-2012", "harding-apcto-algorithm-2017"],
    },
    {
      id: "cp-cto-strategy-q6",
      stem: "In the US registry Brilakis cites, how did CTOs with proximal cap ambiguity compare with those without?",
      options: [
        "Higher technical success because they were all treated retrogradely",
        "Lower technical success, but similar major adverse cardiac events",
        "Similar success, but a much higher rate of major adverse events",
        "Lower success and higher mortality, so the authors advised against treating them",
      ],
      answer: 1,
      explanation:
        "Ambiguity was present in 31% and was associated with lower technical success (85% against 93%) and procedural success (84% against 91%), with similar major events (3.2% against 2.9%). The retrograde approach was used more often (68% against 33%) and needed more contrast, radiation and time. The authors did not advise against treatment.",
      difficulty: 3,
      refs: ["karatasakis-cap-ambiguity-2016"],
    },
    {
      id: "cp-cto-strategy-q7",
      stem: "What is the 'move the cap' technique?",
      options: [
        "Displacing the cap with an inflated balloon so that a soft wire can find a microchannel inside it",
        "Using a retrograde wire to push the proximal cap into the antegrade guide catheter",
        "Imaging the cap from a side branch with IVUS so the antegrade wire can be redirected",
        "Entering the wall just proximal to the cap, then continuing with dissection and re-entry",
      ],
      answer: 3,
      explanation:
        "In move the cap, the subintimal space is entered proximal to the proximal cap, with a stiff wire or by inflating a slightly oversized balloon there, and the case continues as standard antegrade dissection and re-entry, bypassing an ambiguous or impenetrable cap while limiting perforation risk. IVUS localisation is a different way to deal with ambiguity.",
      difficulty: 2,
      refs: ["vo-move-the-cap-2016", ...BRILAKIS],
    },
    {
      id: "cp-cto-strategy-q8",
      stem: "On the dual injection of an RCA CTO, the proximal cap is clear and the occlusion is 30 mm long. The distal vessel is small and diffusely diseased, and the PDA and posterolateral branch divide at the distal cap. Straight, good-sized septal collaterals fill the PDA. Which first strategy fits Brilakis's teaching?",
      options: [
        "Antegrade dissection and re-entry, re-entering just beyond the bifurcation",
        "Antegrade wire escalation, because the cap is clear and antegrade wiring is the usual start",
        "Retrograde, because the distal target is poor and a bifurcation sits at the distal cap",
        "Stenting from the proximal cap to the posterolateral branch without wiring the PDA",
      ],
      answer: 2,
      explanation:
        "A poor distal target with an interventional collateral points the hybrid algorithm to retrograde, and the 2021 global algorithm also handles a poor distal vessel retrogradely. The bifurcation at the distal cap adds to this: Brilakis favours retrograde there because antegrade techniques often close off one of the two branches, and neither source recommends antegrade dissection and re-entry at a distal-cap bifurcation, which makes antegrade dissection and re-entry beyond the bifurcation the one to avoid. Antegrade wiring is the usual first technique in general, but not with these distal features.",
      difficulty: 3,
      refs: [...BRILAKIS, "brilakis-cto-algorithm-2012", "wu-global-cto-algorithm-2021"],
    },
    {
      id: "cp-cto-strategy-q9",
      stem: "A patient with an estimated creatinine clearance of 50 mL/min is undergoing CTO PCI. Contrast used is 200 mL, air kerma 5.2 Gy, and after two strategy changes the wire has made no progress. What should happen?",
      options: [
        "Continue until contrast reaches 5 × clearance (250 mL), since 3.7 is only a guide",
        "Continue, because the 3.7 × clearance contrast limit of 185 mL is only just exceeded",
        "Stop, because both the radiation and the contrast thresholds have been passed without progress",
        "Switch to a third strategy, because the radiation threshold applies only to retrograde procedures",
      ],
      answer: 2,
      explanation:
        "The contrast trigger is 3.7 × 50 = 185 mL, already exceeded at 200 mL, and an air kerma above 5 Gy without crossing or substantial progress is another trigger. With no progress, stop; STAR or planned failure is often better than aggressive strategies. Neither threshold is a target, neither manual gives a limit of 5 × clearance, and the radiation rule is not limited to retrograde work.",
      difficulty: 3,
      refs: [...BRILAKIS, "laskey-vcrcl-2007"],
    },
    {
      id: "cp-cto-strategy-q10",
      stem: "Why does Brilakis advise against giving a glycoprotein IIb/IIIa inhibitor or cangrelor at the end of a successful CTO PCI?",
      options: [
        "They interact with the heparin needed for ACT targets above 300 s",
        "Small wire perforations can reopen and cause delayed effusion and tamponade",
        "They increase the risk of donor artery thrombosis after retrograde work",
        "They cannot be given through a radial sheath after a long procedure",
      ],
      answer: 1,
      explanation:
        "Minor wire perforations could reopen under these drugs and cause a delayed pericardial effusion and tamponade (21.3). For the same reason heparin, which can be reversed, is preferred to bivalirudin. Donor thrombosis is prevented by adequate heparin and treating donor lesions, not by these drugs.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-strategy-q11",
      stem: "A patient with an RCA CTO has a 60% proximal LAD lesion with FFR 0.78; the LAD supplies the collaterals. The RCA CTO is opened successfully. What does the evidence Brilakis cites predict for the LAD FFR?",
      options: [
        "It will fall, because the LAD loses the protective effect of the collaterals",
        "It will stay at 0.78, because FFR is independent of the territory supplied",
        "It may rise, by 0.03 to 0.10 in the studies cited, so remeasure before treating",
        "It cannot be measured again until the RCA stents have endothelialised",
      ],
      answer: 2,
      explanation:
        "Because the LAD also carries the collateral supply of the RCA territory, its FFR can be lower than it will be once the RCA is open; after recanalisation donor FFR rose by 0.03 to 0.10 in the studies cited, and in one six of nine ischaemic donor vessels became non-ischaemic. Brilakis advises measuring donor physiology ideally after the CTO is opened.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-cto-strategy-q12",
      stem: "Which collateral characteristic most strongly predicts that wires and devices will cross it, according to the study Brilakis quotes?",
      options: [
        "Lack of tortuosity",
        "A Werner CC2 size",
        "Epicardial location",
        "Rentrop grade 3 filling",
      ],
      answer: 0,
      explanation:
        "Lack of tortuosity was the most important predictor, followed by size (the Werner grade). Rentrop grades the filling of the recipient artery, not the crossability of a channel, and epicardial channels are generally harder and less safe than septal ones.",
      difficulty: 2,
      refs: [...BRILAKIS, "werner-collaterals-2003"],
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Stent a long lesion with overlapping stents and optimise it with IVUS along its whole length, as after a recanalised CTO." },
  ],
  caseIds: ["cp-cto-strategy-case-lad"],
};

export const cases: CaseStudy[] = [
  {
    id: "cp-cto-strategy-case-lad",
    title: "LAD CTO: from the diagnostic run to the finished result",
    trackId: "complex-pci",
    stage: 5,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, chapter 21 (21.1–21.14) with 7.3, 8.2 and 12.3; Oxford Handbook, ch 8: Chronic total occlusion PCI" },
    summary:
      "Deciding against an ad hoc attempt, planning and setting up a CTO procedure, reading an ambiguous proximal cap, choosing and changing the crossing strategy, keeping the ACT and stop rules in view, and finishing safely.",
    presentation:
      "A 63-year-old man has CCS class III angina despite a beta-blocker, a long-acting nitrate and a calcium-channel blocker. Stress perfusion MRI shows a large anterior perfusion defect with no transmural scar. LVEF 55%. Estimated creatinine clearance 85 mL/min. Diagnostic angiography is under way through the right radial artery with 5 Fr catheters.",
    findings: [
      "Proximal LAD occlusion; the mid and distal LAD fill late through septal collaterals from a dominant RCA.",
      "The origin of the occlusion, at the level of the first diagonal, is not clearly seen.",
      "Circumflex and RCA with mild disease only.",
      "Contrast so far 70 mL; consent covered diagnostic angiography and possible PCI.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The LAD is occluded. What do you do now?",
        options: [
          {
            text: "Complete the study with long, low-magnification collateral runs during breath hold without panning, then stop and plan a separate CTO procedure.",
            best: true,
            feedback:
              "Correct. Brilakis discourages ad hoc CTO PCI in most cases: planning allows CT and viability review, a proper set-up with dual injection, and consent that covers the CTO risks. Good collateral runs at the diagnostic study save contrast and time later.",
            next: "s2",
          },
          {
            text: "Upgrade to a 6 Fr guide in the LAD through the same radial and attempt the CTO now while you have access.",
            feedback:
              "This is ad hoc CTO PCI with a single small guide, no dual injection and consent for a much simpler procedure: several of Brilakis's reasons to defer.",
            next: "s1-adhoc",
            stateDelta: { stability: -10, flags: ["ad-hoc-attempt"] },
          },
          {
            text: "Recommend medical therapy only: the collaterals protect the anterior wall.",
            feedback:
              "A CTO territory is ischaemic even with good collaterals, and this patient has refractory angina with viable, ischaemic myocardium: exactly the indication for CTO PCI. Leaving it is not wrong for every patient, but the reasoning is.",
            next: "s2",
          },
        ],
      },
      {
        id: "s1-adhoc",
        kind: "consequence",
        prompt: "A 6 Fr guide is in the LAD. With a single injection the distal LAD is invisible and the start of the occlusion is unclear. Contrast is now 130 mL. What now?",
        options: [
          {
            text: "Stop, remove the guide, and plan a staged procedure with dual injection and proper preparation.",
            best: true,
            feedback:
              "Right. Without the contralateral injection you cannot see the distal vessel or confirm a wire position, and the case has none of the preparation a CTO needs. Stopping now costs nothing but time.",
          },
          {
            text: "Probe the presumed cap with a stiff wire and see if it crosses.",
            feedback:
              "Pushing a stiff wire at a cap you cannot see, with no view of the distal vessel, is how perforations happen. The attempt is stopped and rebooked.",
            stateDelta: { stability: -10, flags: ["blind-wiring"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The patient wants the CTO treated. How do you plan it?",
        options: [
          {
            text: "Review the films for all collateral routes, obtain coronary CT angiography of the occluded segment, book a CTO operator and list, and consent for CTO-specific risks.",
            best: true,
            feedback:
              "Correct. CCTA can define the cap, the course and the least-foreshortened projections; the CTO team, equipment and consent are part of the treatment.",
          },
          {
            text: "Book the next routine PCI list; the operator can plan from the diagnostic films on the day.",
            feedback:
              "A routine list may lack the operator, equipment and time a CTO needs, and planning on the day loses the advantages of preparation.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Plan from the diagnostic films and the J-CTO score, without CT.",
            acceptable: true,
            feedback:
              "Reasonable when the anatomy is clear, but here the start of the occlusion was unclear: CT may resolve the cap before the day.",
          },
        ],
      },
      {
        id: "s3",
        prompt: "How do you set up the procedure?",
        info: "CT shows the occlusion beginning at the first diagonal bifurcation, but calcium at its origin and the overlapping diagonal prevent the exact entry point from being defined. The occluded course is straight and 28 mm long, with moderate calcium.",
        options: [
          {
            text: "Right femoral 8 Fr 45 cm sheath with an 8 Fr EBU guide to the LAD; a 7 Fr AL guide to the RCA from the radial; unfractionated heparin with ACT checks every 20–30 minutes.",
            best: true,
            feedback:
              "Correct. Large supportive guides allow IVUS at the cap and complication management; a guide (not a diagnostic catheter) in the RCA keeps the retrograde option open; heparin can be reversed.",
            next: "s4",
          },
          {
            text: "Biradial access with 7 Fr long sheaths: EBU to the LAD, AL to the RCA, heparin.",
            acceptable: true,
            feedback:
              "A valid choice: radial and biradial CTO PCI are increasingly used. Many operators keep one femoral access for extra support.",
            next: "s4",
          },
          {
            text: "One 6 Fr radial EBU guide in the LAD and a 5 Fr diagnostic catheter in the RCA, with bivalirudin.",
            feedback:
              "Small guide, no retrograde guide, and an anticoagulant that cannot be reversed if you perforate.",
            next: "s3-small",
            stateDelta: { stability: -5, flags: ["small-guide"] },
          },
        ],
      },
      {
        id: "s3-small",
        kind: "consequence",
        prompt: "You realise the IVUS catheter you may need at the cap will not work through this guide, and the RCA catheter cannot take retrograde equipment. What do you do?",
        options: [
          {
            text: "Upsize: 8 Fr femoral guide to the LAD and a 7 Fr guide in the RCA; change to heparin with an ACT target.",
            best: true,
            feedback: "Right. Fix the set-up before any wiring; it costs minutes now and avoids being trapped later.",
          },
          {
            text: "Carry on and improvise if needed.",
            feedback: "Brilakis warns that 6 Fr guides may exclude IVUS-guided cap penetration and limit complication management; bivalirudin cannot be reversed.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Dual injection is done. Which first strategy do you choose?",
        info:
          "The diagonal overlies the origin of the occlusion in every view and no stump is seen (ambiguous proximal cap). Length 28 mm. The distal LAD is about 2.5 mm, fills well and has no major branch at the distal cap. A CC2, almost straight septal collateral from the PDA enters the LAD 15 mm beyond the distal cap.",
        options: [
          {
            text: "Primary retrograde approach through the septal collateral.",
            best: true,
            feedback:
              "Correct. An ambiguous cap with an interventional collateral points the hybrid algorithm to retrograde, and septal channels are the safer route.",
            next: "s5",
          },
          {
            text: "IVUS from the diagonal to locate the cap, then antegrade crossing guided by what it shows.",
            acceptable: true,
            feedback:
              "A recognised way to resolve ambiguity (and the reason for the 8 Fr guide). With a good septal route, retrograde is the algorithm's first choice, but this may well work.",
            next: "s5",
          },
          {
            text: "A stiff, high-penetration wire pushed at the estimated entry point, without further imaging.",
            feedback: "CT narrowed the cap down but did not locate it; a stiff, high-penetration wire pushed at an estimated entry point risks perforation. Imaging that truly locates the cap (IVUS, or CT that defines it) does allow antegrade crossing.",
            next: "s4-exit",
            stateDelta: { stability: -20, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "s4-exit",
        kind: "consequence",
        prompt: "In the orthogonal view with the RCA injected, the wire tip lies outside the LAD contour with a small blush. Blood pressure is unchanged. What do you do?",
        options: [
          {
            text: "Withdraw the wire without advancing anything over it, inject both arteries to check for staining, and watch the pressure and an echo.",
            best: true,
            feedback:
              "Right. A wire that has exited the vessel is withdrawn and redirected without microcatheters, balloons or stents over it. Heparin, not bivalirudin, keeps reversal available if the staining grows.",
          },
          {
            text: "Advance the microcatheter over the wire to check its position with a tip injection.",
            feedback: "Advancing a device over an exited wire can enlarge or create a perforation. Management of perforation is taught in the complications track.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Forty minutes into retrograde work, a wire and microcatheter sit in the septal collateral. The ACT, last checked 35 minutes ago at 360 s, now returns 290 s. What do you do?",
        options: [
          {
            text: "Give heparin to bring the ACT above 350 s and recheck every 20–30 minutes.",
            best: true,
            feedback: "Correct. Retrograde work needs an ACT above 350 s; donor thrombosis with equipment in the collateral would be dangerous.",
          },
          {
            text: "Carry on: 290 s is close enough, and you will recheck at the end.",
            feedback:
              "Below the retrograde target, with equipment in a collateral from the donor artery, the risk of thrombus in the donor or guide rises. Brilakis checks every 20–30 minutes.",
            next: "s5-lowact",
            stateDelta: { stability: -10, flags: ["low-act"] },
          },
          {
            text: "Give a glycoprotein IIb/IIIa inhibitor to protect the donor artery.",
            feedback: "IIb/IIIa inhibitors are not given in CTO PCI: small wire perforations can reopen and cause delayed tamponade. Correct the ACT with heparin instead.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5-lowact",
        kind: "consequence",
        prompt: "Twenty minutes later the RCA guide injection shows a hazy filling defect in the proximal RCA. What now?",
        options: [
          {
            text: "Stop retrograde manipulation, give heparin to the retrograde target, aspirate the guide, and re-image the RCA before continuing.",
            best: true,
            feedback:
              "Right. Treat the donor artery as the priority; thrombus there threatens the whole territory it supplies, including the collateralised LAD.",
          },
          {
            text: "Ignore it and push on with the septal crossing.",
            feedback: "A threatened donor artery outranks the CTO. Never continue retrograde work over an unexplained donor change.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The retrograde wire will not negotiate the septal channel despite several tip shapes. Contrast is 190 mL and air kerma 2.1 Gy. What next?",
        options: [
          {
            text: "Change strategy: IVUS from the diagonal to locate the cap, then antegrade crossing (or move the cap if it remains unclear).",
            best: true,
            feedback:
              "Correct. Small changes have failed, so make a bigger one, as the hybrid algorithm's fail arrows and the fifth guiding principle advise.",
          },
          {
            text: "Try another visible septal channel with a different wire.",
            acceptable: true,
            feedback: "A reasonable small change if a second channel looks crossable; set yourself a limit before switching approach.",
          },
          {
            text: "Keep working the same septal channel; it usually crosses in the end.",
            feedback: "Persisting with a failing technique uses up the contrast and radiation the next strategy will need.",
            next: "s6-persist",
            stateDelta: { stability: -5, flags: ["persisted"] },
          },
        ],
      },
      {
        id: "s6-persist",
        kind: "consequence",
        prompt: "An hour later the septal still has not crossed. Contrast is 330 mL and air kerma 5.3 Gy, with no progress. What do you do?",
        options: [
          {
            text: "Stop the attempt and plan a repeat with a different strategy.",
            best: true,
            feedback:
              "Right. The contrast limit (3.7 × 85 ≈ 315 mL) and the dose trigger (above 5 Gy without progress) have both been passed. Failing safely is better than an aggressive rescue.",
          },
          {
            text: "Switch to an antegrade attempt now, since you have not tried it yet.",
            feedback: "Both stop triggers have been passed without progress; starting a new strategy now adds risk. Plan it for another day.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The LAD is crossed into the distal true lumen, confirmed with RCA injection in two orthogonal views. How do you finish?",
        options: [
          {
            text: "Advance the microcatheter, exchange for a workhorse wire, prepare the lesion, stent with IVUS optimisation, give no IIb/IIIa inhibitor or cangrelor, and inject the RCA and the septal before removing equipment.",
            best: true,
            feedback:
              "Correct. Exchanging the crossing wire protects the distal vessel; imaging matters with long stents and a remodelled distal LAD; potent antiplatelets risk delayed tamponade; donor and collateral checks find silent injuries.",
          },
          {
            text: "Stent directly over the crossing wire, sizing the distal stent from the angiogram.",
            feedback:
              "The stiff crossing wire risks distal injury, and the underfilled distal vessel will look smaller than it is: exchange the wire and size with imaging.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Finish with a IIb/IIIa inhibitor bolus because the stented segment is long.",
            feedback: "Not in CTO PCI, even after success: minor wire perforations can reopen and cause delayed effusion and tamponade.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The LAD was opened and stented with IVUS-guided optimisation, the donor RCA and the septal channel were intact on the final injections, and the patient's angina resolved at follow-up.",
    outcomeVariants: [
      { flag: "ad-hoc-attempt", text: "An ad hoc attempt at the diagnostic study used contrast and time without progress; the planned procedure started from a worse position." },
      { flag: "perforation", text: "A wire exit perforation at the presumed cap was recognised and sealed without tamponade, but extended the procedure." },
      { flag: "low-act", text: "A low ACT during retrograde work led to thrombus in the donor RCA, which had to be treated before the case could continue." },
      { flag: "persisted", text: "Persisting with one septal channel passed the stop thresholds; the CTO was crossed at a planned second procedure." },
    ],
    learningPoints: [
      "Plan CTO PCI as a separate procedure in most cases; the indication is symptoms from a viable, ischaemic territory.",
      "Set up for the whole plan: 7–8 Fr supportive guides, a guide in the donor artery, unfractionated heparin with ACT above 350 s for retrograde work, no bivalirudin.",
      "Read the four features on dual injection; an ambiguous cap with an interventional collateral points to retrograde.",
      "Never push a stiff wire at a cap you cannot see; clarify it with IVUS or CT, or move the cap.",
      "Change strategy efficiently; stop at contrast above 3.7 × estimated creatinine clearance or air kerma above 5 Gy without progress.",
      "After crossing: exchange the wire, stent with imaging, no IIb/IIIa inhibitor or cangrelor, check the donor and collaterals.",
    ],
    refs: [...BOOKS, "cto-consensus-2019", "brilakis-cto-algorithm-2012", "laskey-vcrcl-2007"],
  },
];

export const tips: LabTip[] = [
  {
    id: "diag-cto-strategy-defer-adhoc",
    lab: "diagnostic",
    when: { phase: ["views", "finish"], event: ["total-occlusion"] },
    title: "Found a CTO? Film the collaterals, then plan",
    text: "In a stable patient, finish the study with long, low-magnification collateral runs during breath hold without panning, and plan the CTO as a separate procedure. Brilakis advises against ad hoc CTO PCI in most cases; exceptions include an ACS from a failing, heavily diseased vein graft and very difficult access.",
    tone: "do",
    lessonId: "cp-cto-strategy-selection",
    sources: [B("21.1"), B("21.6"), B("7.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-act-recheck",
    lab: "pci",
    when: { phase: ["wire"], event: ["low-act"], requires: ["cto"] },
    title: "CTO: recheck the ACT every 20–30 minutes",
    text: "In a CTO case, keep the ACT above 300 s for antegrade and above 350 s for retrograde work (analyser-specific targets), and recheck it every 20–30 minutes once therapeutic. If it is low, top up with heparin before you continue, especially with equipment in a collateral.",
    tone: "caution",
    lessonId: "cp-cto-strategy-setup",
    sources: [B("21.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-guide-choice",
    lab: "pci",
    when: { phase: ["guide"], requires: ["cto"] },
    title: "CTO guides: 7–8 Fr and supportive",
    text: "For a CTO, use 7 or 8 Fr guides with supportive shapes: AL for the RCA, EBU or XB for the left main. A 6 Fr guide may rule out IVUS-guided cap penetration and limit complication management. If retrograde work is possible, put a guide, not a diagnostic catheter, in the donor artery.",
    tone: "do",
    lessonId: "cp-cto-strategy-setup",
    sources: [B("21.5"), B("5.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-dual-injection",
    lab: "pci",
    when: { phase: ["plan", "wire"], requires: ["cto"] },
    title: "CTO: inject both arteries",
    text: "When collaterals from the other artery fill the CTO, use dual injection: it shows the true distal cap and length, locates the wire during crossing and helps manage a perforation. Film at low magnification during breath hold, without panning, until the distal vessel has filled.",
    tone: "do",
    lessonId: "cp-cto-strategy-angiogram",
    sources: [B("21.6"), B("6.6"), B("8.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-microcatheter-injection",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "CTO: tip injections only after backflow",
    text: "In a CTO, to outline the cap or a collateral, inject contrast through the microcatheter's central lumen with a small (2–3 cc) Luer-lock syringe, but only after confirming good blood backflow, so that the injection cannot cause barotrauma.",
    tone: "caution",
    lessonId: "cp-cto-strategy-angiogram",
    sources: [B("21.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-no-blind-cap",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Never push a stiff wire at an unseen cap",
    text: "In a CTO, if you cannot say where the occlusion begins, clarify it first: more projections, a microcatheter injection near the cap, IVUS or CT. If it stays ambiguous, go retrograde when a route exists or use a move-the-cap technique, if technically feasible.",
    tone: "caution",
    lessonId: "cp-cto-strategy-cap-ambiguity",
    sources: [B("21.6"), B("21.8")],
    refs: [...BRILAKIS, "vo-move-the-cap-2016"],
  },
  {
    id: "pci-cto-strategy-hybrid-first-choice",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "Pick the first CTO strategy from the four features",
    text: "In a CTO: ambiguous cap or poor distal target, with an interventional collateral to use: start retrograde; otherwise start antegrade. Under 20 mm long: wire escalation; 20 mm or longer: dissection and re-entry. Name your fallback before you start.",
    tone: "do",
    lessonId: "cp-cto-strategy-hybrid",
    sources: [B("21.8")],
    refs: [...BRILAKIS, "brilakis-cto-algorithm-2012"],
  },
  {
    id: "pci-cto-strategy-change-early",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "CTO not progressing? Change efficiently",
    text: "When a CTO crossing stops making progress, make a small change (tip angle, a different wire) or a bigger one (for example antegrade to retrograde), as the pre-procedure plan and the case progression dictate. Changing efficiently raises success and saves the time, contrast and radiation the next strategy needs.",
    tone: "do",
    lessonId: "cp-cto-strategy-hybrid",
    sources: [B("21.8")],
    refs: [...BRILAKIS, "cto-consensus-2019"],
  },
  {
    id: "pci-cto-strategy-stop-rules",
    lab: "pci",
    when: { phase: ["wire", "complication"], event: ["high-radiation-dose", "high-contrast-volume"], requires: ["cto"] },
    title: "Know when to stop a CTO",
    text: "In a CTO attempt, stop for a complication, an air kerma above 5 Gy without crossing or real progress, contrast above 3.7 times the estimated creatinine clearance, no crossing options left, or fatigue; the 2021 global algorithm adds a long procedure and missing expertise or equipment. A bail-out STAR or ending the attempt is often wiser than an aggressive rescue.",
    tone: "caution",
    lessonId: "cp-cto-strategy-hybrid",
    sources: [B("21.8")],
    refs: [...BRILAKIS, "laskey-vcrcl-2007", "wu-global-cto-algorithm-2021"],
  },
  {
    id: "pci-cto-strategy-step-down",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Choose the CTO wire by the cap, then step down",
    text: "For a tapered cap start with a soft, tapered polymer-jacketed wire; for a blunt cap, an intermediate-penetration wire; escalate only as the cap demands. Once a stiff wire is 1–2 mm through the proximal cap, de-escalate to a less penetrating wire for the rest of the occlusion.",
    tone: "do",
    lessonId: "cp-cto-strategy-hybrid",
    sources: [B("21.8")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-subintimal-wire",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-subintimal"], requires: ["cto"] },
    title: "CTO wire in the wall: redirect, park or re-enter",
    text: "In a CTO, a wire that has entered the subintimal space can be redirected; if that fails, leave it in place and steer a second wire into the true lumen beside it, helped by a dual-lumen microcatheter or IVUS, or move to dissection and re-entry. Do not push it far beyond the distal cap in the wall: the haematoma compresses the true lumen.",
    tone: "caution",
    lessonId: "cp-cto-strategy-hybrid",
    sources: [B("21.8")],
    refs: BRILAKIS,
  },
  {
    id: "pci-cto-strategy-confirm-before-advancing",
    lab: "pci",
    when: { phase: ["wire"], requires: ["cto"] },
    title: "Confirm the true lumen before anything follows the wire",
    text: "Check the wire tip with contralateral injection in orthogonal views. An abnormal course or motion, or repeated ventricular extrasystoles, suggest it has left the lumen: withdraw and redirect it without advancing a microcatheter, balloon or stent. Once in the distal true lumen, exchange the crossing wire for a workhorse through the microcatheter.",
    tone: "caution",
    lessonId: "cp-cto-strategy-finish",
    sources: [B("21.8"), O_CTO],
    refs: BOOKS,
  },
  {
    id: "pci-cto-strategy-poststent-physiology",
    lab: "pci",
    when: { phase: ["physiology", "optimise"], requires: ["cto"] },
    title: "Physiology in a CTO vessel: mainly after stenting",
    text: "Physiology is not typically used to decide on treating the CTO vessel: in the studies Brilakis cites, its territory behaved as ischaemic even with good collaterals. After stenting, a pressure step-up marks a segment that needs more treatment; image it and optimise.",
    tone: "do",
    lessonId: "cp-cto-strategy-finish",
    sources: [B("21.12")],
    refs: BRILAKIS,
  },
];

export const refs: Reference[] = [
  {
    id: "sandoval-adhoc-cto-2019",
    kind: "paper",
    citation:
      "Sandoval Y, Tajti P, Karatasakis A, et al. Frequency and outcomes of ad hoc versus planned chronic total occlusion percutaneous coronary intervention: multicenter experience. J Invasive Cardiol. 2019;31:133–139.",
    url: "https://doi.org/10.25270/jic/18.00284",
    note: "PMID: 30643040. Checked on PubMed: authors, title, journal, year, volume 31, issue 5, pages 133–139; abstract read (2,282 CTO PCIs 2012–2017, 318 (14%) ad hoc; lower J-CTO, PROGRESS CTO and complication scores in ad hoc; AWE 96% vs 81%; technical success 85% vs 86%; in-hospital MACE 0.6% vs 2.9%; authors: ad hoc may be acceptable for experienced hybrid operators in carefully selected cases, complex cases preferably planned). Brilakis ch 21 ref 4.",
    verified: true,
  },
  {
    id: "tajti-progress-hybrid-2018",
    kind: "paper",
    citation:
      "Tajti P, Karmpaliotis D, Alaswad K, et al. The hybrid approach to chronic total occlusion percutaneous coronary intervention: update from the PROGRESS CTO registry. JACC Cardiovasc Interv. 2018;11:1325–1335.",
    url: "https://doi.org/10.1016/j.jcin.2018.02.036",
    note: "PMID: 29706508. Checked on PubMed: authors, title, journal, year, volume 11, issue 14, pages 1325–1335; abstract read (3,122 CTO PCIs, 20 centres; technical 87%, procedural 85%, in-hospital major complications 3.0%; final strategy AWE 52.0%, retrograde 27.1%, ADR 20.9%; >1 strategy 40.9%; medians contrast 270 mL, air kerma 2.9 Gy, procedure 123 min, fluoroscopy 47 min). Brilakis ch 21 ref 30.",
    verified: true,
  },
  {
    id: "karatasakis-cap-ambiguity-2016",
    kind: "paper",
    citation:
      "Karatasakis A, Danek BA, Karmpaliotis D, et al. Impact of proximal cap ambiguity on outcomes of chronic total occlusion percutaneous coronary intervention: insights from a multicenter US registry. J Invasive Cardiol. 2016;28:391–396.",
    note: "PMID: 27705889 (no DOI in PubMed). Checked on PubMed: authors, title, journal, year, volume 28, issue 10, pages 391–396; abstract read (1,021 CTO PCIs, 11 US centres 2012–2015; ambiguity 31%; prior CABG 43% vs 33%; moderate/severe calcification 66% vs 51%; technical success 85% vs 93%; procedural 84% vs 91%; MACE 3.2% vs 2.9%; retrograde 68% vs 33%, initial 39% vs 13%, successful 42% vs 20%; IVUS 49% vs 36%; contrast 281 vs 250 mL; air kerma 4.0 vs 3.0 Gy; procedure time 161 vs 119 min). Brilakis ch 21 ref 15.",
    verified: true,
  },
  {
    id: "vo-move-the-cap-2016",
    kind: "paper",
    citation:
      "Vo MN, Karmpaliotis D, Brilakis ES. \"Move the cap\" technique for ambiguous or impenetrable proximal cap of coronary total occlusion. Catheter Cardiovasc Interv. 2016;87:742–748.",
    url: "https://doi.org/10.1002/ccd.26079",
    note: "PMID: 26332640. Checked on PubMed: authors, title, journal, year (issue 2016, epub 2015), volume 87, issue 4, pages 742–748; abstract read (subintimal space entered proximal to the proximal cap with a stiff guidewire or by inflating a slightly oversized balloon, followed by standard antegrade dissection and re-entry; minimises perforation risk; also useful for balloon-uncrossable lesions). Brilakis ch 21 ref 17.",
    verified: true,
  },
  {
    id: "harding-apcto-algorithm-2017",
    kind: "consensus",
    citation:
      "Harding SA, Wu EB, Lo S, et al. A new algorithm for crossing chronic total occlusions from the Asia Pacific Chronic Total Occlusion Club. JACC Cardiovasc Interv. 2017;10:2135–2143.",
    url: "https://doi.org/10.1016/j.jcin.2017.06.071",
    note: "PMID: 29122129. Checked on PubMed: authors, title, journal, year, volume 10, issue 21, pages 2135–2143; abstract read (case selection by J-CTO score; same three questions as the hybrid algorithm for antegrade vs retrograde; wiring vs dissection chosen by course ambiguity, severe calcification, tortuosity, length and previous failure, not length alone; IVUS-guided entry for cap ambiguity; parallel wire and re-entry balloon dissection re-entry after failed antegrade wiring; IVUS-guided wiring and limited STAR as final options; guidance on stopping). Brilakis ch 21 ref 19.",
    verified: true,
  },
  {
    id: "laskey-vcrcl-2007",
    kind: "paper",
    citation:
      "Laskey WK, Jenkins C, Selzer F, et al. Volume-to-creatinine clearance ratio: a pharmacokinetically based risk factor for prediction of early creatinine increase after percutaneous coronary intervention. J Am Coll Cardiol. 2007;50:584–590.",
    url: "https://doi.org/10.1016/j.jacc.2007.03.058",
    note: "PMID: 17692741. Checked on PubMed: authors, title, journal, year, volume 50, issue 7, pages 584–590; abstract read (3,179 PCI patients; early creatinine rise >0.5 mg/dl at 24–48 h in 1.5%; V/CrCl ≥3.7 independently associated, OR 3.84). Brilakis ch 21 ref 55.",
    verified: true,
  },
  {
    id: "khan-orbita-cto-2026",
    kind: "trial",
    citation:
      "Khan S, Sajjad U, Fawaz S, et al. Randomized, placebo-controlled trial of chronic total occlusion percutaneous coronary intervention in stable angina: the ORBITA-CTO trial. J Am Coll Cardiol. 2026;88:4–18.",
    url: "https://doi.org/10.1016/j.jacc.2026.03.027",
    note: "PMID: 41999379. Checked on PubMed: authors, title, journal, year, volume 88, issue 1, pages 4–18; abstract read (multicentre, blinded; 50 patients with angina from a single-vessel CTO and no bystander disease, randomised 25:25 to CTO PCI or a placebo procedure after dual-injection angiography; primary angina symptom score OR 4.38, 95% CrI 1.57–12.69; 30.6 more angina-free days; SAQ angina frequency +10.7, with physical limitation, quality of life, summary score and CCS class improved; blinding maintained; follow-up 6 months).",
    verified: true,
  },
  {
    id: "wu-global-cto-algorithm-2021",
    kind: "consensus",
    citation:
      "Wu EB, Brilakis ES, Mashayekhi K, et al. Global chronic total occlusion crossing algorithm: JACC state-of-the-art review. J Am Coll Cardiol. 2021;78:840–853.",
    url: "https://doi.org/10.1016/j.jacc.2021.05.055",
    note: "PMID: 34412818. Checked on PubMed: authors, title, journal, year, volume 78, issue 8, pages 840–853; abstract read (10 steps: dual angiography; review of cap, occluded segment, distal vessel, collaterals; cap ambiguity by IVUS, retrograde or move the cap; poor distal vessel by retrograde, distal-cap bifurcation by dual-lumen catheter and IVUS; retrograde feasibility through grafts, septal and epicardial collaterals; antegrade wiring; retrograde approach; change strategy when not progressing; investment procedure after failure; stop for high radiation or contrast dose, long procedure time, serious complication, operator and patient fatigue, or lack of expertise or equipment).",
    verified: true,
  },
  {
    id: "galassi-eurocto-consensus-2019",
    kind: "consensus",
    citation:
      "Galassi AR, Werner GS, Boukhris M, et al. Percutaneous recanalisation of chronic total occlusions: 2019 consensus document from the EuroCTO Club. EuroIntervention. 2019;15:198–208.",
    url: "https://doi.org/10.4244/EIJ-D-18-00826",
    note: "PMID: 30636678. Checked on PubMed: authors, title, journal, year, volume 15, issue 2, pages 198–208; abstract read (updated EuroCTO Club recommendations on indications, techniques, equipment and operator and centre qualifications). Brilakis ch 21 ref 54, cited among the strategy-change algorithms.",
    verified: true,
  },
];
