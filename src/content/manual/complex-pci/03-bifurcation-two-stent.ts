// Module cp-bifurcation-two-stent: two-stent bifurcation techniques (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, sections 16.1 and 16.2 (algorithm, preparation, T-stenting, TAP, reverse crush,
// DK crush, culotte, V-stenting, simultaneous kissing stents, physiology, imaging, support), with related passages in
// 8 (wiring), 10.2 (stent sizing), 12 (physiology of the jailed side branch), 13 (imaging), 15.2 (branch ostial
// T-stenting and mini-crush) and 17 (left main); Oxford Handbook of Cardiac Catheterization and Coronary Intervention,
// chapter 8 (bifurcation lesions, bifurcation PCI techniques, left main stem PCI) and chapter 10 (left main stem
// dissection). Provisional stenting, POT, the jailed wire and rewiring for kissing are taught in
// cp-bifurcation-provisional; left main assessment and strategy in cp-left-main.
// Every claim is listed with its page in docs/curriculum/evidence/cp-bifurcation-two-stent.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "cp-bifurcation-two-stent",
  title: "Bifurcations: two-stent techniques",
  stage: 5,
  summary:
    "When one stent is not enough: how to choose between DK crush, culotte, T-stenting, TAP, reverse crush, mini-crush, V-stenting and simultaneous kissing stents, how to set up the case for two stents, and how to perform each technique step by step, with the troubleshooting the manuals give where they give it, and the trials behind the choices.",
  objectives: [
    "Use the bifurcation algorithm to choose a planned or bail-out two-stent technique from side-branch angle, branch sizes, Medina pattern and urgency, and state where the two manuals disagree.",
    "Set up a two-stent case: guide type and size, access, views, wiring and wire management, preparation of both branches, atherectomy with two wires, imaging, physiology, antiplatelet therapy and support.",
    "Perform DK crush in its seventeen steps, including the protrusion, deployment pressures, crush balloon position, proximal-then-distal rewiring, two-step kissing and the POTs, and troubleshoot a balloon that will not enter the side branch.",
    "Perform culotte stenting, choosing the first branch, and know why kissing must finish it.",
    "Perform planned T-stenting and bail-out TAP, with the right protrusion, deflation order and final POT position.",
    "Perform reverse crush and mini-crush, describe the classic crush, and use V-stenting and simultaneous kissing stents only where they belong.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-two-stent-choosing",
      title: "Choosing a two-stent technique and setting up the case",
      minutes: 14,
      topics: ["cx-dk-crush", "cx-culotte", "cx-tap", "cx-reverse-mini-crush"],
      sources: [
        { book: "brilakis-pci", loc: "16.1" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "8" },
        { book: "brilakis-pci", loc: "13" },
        { book: "brilakis-pci", loc: "17" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation lesions" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
      ],
      refs: [
        ...BOOKS,
        "chen-dkcrush3-2013",
        "dkcrush5-2017",
        "chen-dkcrush5-3y-2019",
        "ferenc-bbk2-2016",
        "hildick-smith-ebc-two-2016",
        "ebc-main-2021",
        "arunothayaraj-ebc-main-3y-2025",
        "arunothayaraj-ebc-main-technique-2023",
        "definition2-2020",
        "kan-definition2-3y-2022",
        "esc-ccs-2024",
        "october-2023",
        "gao-dkcrush8-2026",
        "johnson-eapci-lm-imaging-2026",
        "perera-bcis1-2010",
        "perera-chip-bcis3-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "Most bifurcations are treated with one stent in the main vessel (MV) and a provisional approach to the side branch (SB), as taught in cp-bifurcation-provisional. A second stent enters the plan in two ways. It is **planned** from the start when an SB that must be kept has a high chance of closing once the MV is stented. It is a **bail-out** when an important SB is compromised after MV stenting and balloon angioplasty has not fixed it. This lesson is about choosing the technique and preparing the case; the four lessons that follow teach each technique step by step.",
        },
        { kind: "h", text: "Where the two-stent branches of the algorithm lead" },
        {
          kind: "p",
          text: "Brilakis builds the choice on a short series of questions (Fig. 16.1 in the manual). The first is whether the SB has to be kept at all. He decides that from the branch's diameter and from how much myocardium it feeds; branches under 2 mm usually do not need preserving. The Oxford handbook weighs the branch's calibre, its territory and how far the disease involves its ostium, adding that branches narrower than 2.0 mm are seldom treated at all and that SB occlusion is rare when the ostial stenosis before treatment is under 50%. Once you know the SB matters and is likely to be lost, the planned two-stent questions are asked in this order:",
        },
        {
          kind: "steps",
          title: "Planned two-stent strategy (Brilakis)",
          items: [
            {
              title: "1. Is it Medina 0,1,1?",
              detail: "Narrowing of the SB ostium and the MV beyond the branch, with a healthy proximal MV. If yes, V-stenting can be used (lesson 5). In the left main Brilakis counts Medina 0,1,1 as a true bifurcation and prefers a two-stent technique, especially DK crush; V-stenting remains possible there through a 7 or 8 Fr guide (cp-left-main).",
            },
            {
              title: "2. Is this an emergency?",
              detail: "If stents are needed urgently and access to both branches must be kept, simultaneous kissing stents (SKS) can be used. Never use SKS in a non-emergency case (lesson 5).",
            },
            {
              title: "3. What is the SB angle?",
              detail: "Between 70° and 90°: T-stenting. Under 70°: DK crush or culotte, with DK crush preferred in most cases.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Bail-out after provisional stenting (Brilakis)",
          items: [
            {
              title: "Trigger",
              detail: "An important SB is compromised after MV stenting (TIMI flow below 3, diameter stenosis above 70%, or an NHLBI type B or worse dissection) and kissing balloon inflation with re-POT has not given a good result.",
            },
            {
              title: "SB angle 70° to 90°",
              detail: "TAP (T and protrusion). For an SB that is compromised but still open, Brilakis's stenting options are TAP, reverse crush or culotte; plain T-stenting joins that list only when the SB had occluded and has been reopened (16.2.10.1, paths 4b and 4c).",
            },
            {
              title: "SB angle under 70°",
              detail: "Reverse crush or culotte.",
            },
            {
              title: "SB occluded and cannot be rewired through the MV stent",
              detail: "First restore flow: pass a 1.0–1.5 mm balloon over the jailed wire part of the way into the occluded SB and inflate it. If no balloon will cross, a torquable microcatheter can often be rotated into the SB to open a channel that a balloon can then follow. With flow back there are two options. Option 1: rewire through the struts (ideally with a dual lumen microcatheter, so the new wire does not slip behind struts the balloon has lifted), then pull out the jailed wire, kiss and repeat the POT; an SB stent (T-stenting, TAP, reverse crush or culotte) is added only if the result is still poor. Option 2: convert to an inverted DK crush, in which the SB is treated as the MV and the MV as the SB.",
            },
          ],
        },
        {
          kind: "table",
          caption: "What else steers the choice (both manuals; cells marked * are the module's summary of the steps, not a stated strength or weakness)",
          head: ["Technique", "Suits", "Strength", "Weakness"],
          rows: [
            ["DK crush", "SB angle under 70°; true left main bifurcations (Brilakis ch 17)", "The strongest trial data; the MV wire is never given up and the SB is rarely lost, an advantage if a dissection occurs", "Many steps, each of which can go wrong"],
            ["Culotte", "SB and distal MV of similar size", "* Each branch has its own stent running back into the proximal MV", "Two layers of stent in the proximal MV, so kissing is obligatory (Oxford)"],
            ["T-stenting and TAP", "Angle near 90°, above all when the SB is clearly smaller than the MV", "Easier and quicker than DK crush or culotte; TAP is the natural bail-out after provisional stenting", "TAP leaves a neocarina of SB struts in the MV that may obstruct later equipment"],
            ["Reverse crush", "Bail-out with SB angle under 70°", "* Builds on a provisional MV stent already in place", "* The SB must be rewired again, through the crushed stent"],
            ["V-stenting", "Medina 0,1,1", "Simple: no rewiring or kissing, both wires kept", "Leaves a ridge of metal where the branches meet, which later wires and devices can catch on; needs at least 7 Fr"],
            ["SKS", "Emergencies and bail-out only", "Very quick, both wires kept", "A long metal neocarina that later devices struggle to pass; needs at least 7 Fr"],
          ],
        },
        {
          kind: "check",
          stem: "A planned two-stent strategy is chosen for an LAD/diagonal bifurcation with a large diagonal, Medina 1,1,1, and an angle of about 50°. The case is elective. Which technique does Brilakis's algorithm point to first?",
          options: [
            "T-stenting, because it is quicker than any crush technique",
            "DK crush, with culotte as the alternative",
            "V-stenting, because both branches are diseased at the ostium",
            "Simultaneous kissing stents, because both wires are kept",
          ],
          answer: 1,
          explanation:
            "The proximal MV is diseased, so it is not Medina 0,1,1 and V-stenting does not apply; the case is not an emergency, so SKS is excluded. With an angle under 70°, the algorithm gives DK crush or culotte, and Brilakis prefers DK crush in most cases. T-stenting belongs to angles between 70° and 90°: at 50° a stent landed at the ostium would leave part of it uncovered.",
        },
        { kind: "h", text: "Where the books differ" },
        {
          kind: "list",
          items: [
            "**TAP angle.** Brilakis: T-stenting and TAP for angles of 70° to 90°. Oxford: T-stenting when the angle approaches 90°, TAP when it is under 90°.",
            "**Order in T-stenting.** Oxford: in both T-stenting and TAP the main branch is stented first and the SB is stented after rewiring. Brilakis's planned T-stenting puts the SB stent in first, with a balloon parked in the MV, and the MV stent second; his TAP, a bail-out, starts from a stented MV.",
            "**First branch in culotte.** Brilakis: the most angulated branch first, which in his figures is the SB. Oxford: the MV first, then the second stent from the MV into the proximal SB.",
            "**Evidence for provisional.** Oxford: little evidence that any approach beats provisional T-stenting, and the legend to its figure of bifurcation methods goes further, saying recent data favour the provisional approach (Oxford Fig. 8.21). Brilakis: DK crush has the best data, superior to culotte and to provisional stenting in left main bifurcations. Read together (this is the module's synthesis): provisional stays the default for most bifurcations, and DK crush is the planned two-stent technique with the strongest trial support, above all in true left main bifurcations.",
            "**The final kiss.** Oxford advises a final simultaneous kissing inflation whatever the stenting technique, to expand the stents fully and shape the carina, and says it has been shown to improve outcomes. Brilakis is more selective: after provisional stenting he calls kissing helpful but not always necessary, and he finds no clear benefit from routine kissing after provisional left main stenting (cp-bifurcation-provisional). In his two-stent techniques kissing is a listed step, except in V-stenting and SKS, where the simultaneous deployment is itself the kiss.",
            "**Drug-eluting stents (older Oxford data).** Oxford notes that the amount of metal in complex bifurcation techniques gives high restenosis rates, that drug-eluting stents may lower restenosis, and that using two or more drug-eluting stents may raise stent thrombosis risk by over 5%. It adds that, once a drug-eluting stent is in the MV, working on the SB has not been shown to improve outcomes unless the branch closes during the case. This predates current stents and the trials below; treat it as historical context.",
          ],
        },
        { kind: "h", text: "The trials behind the choices" },
        {
          kind: "table",
          caption: "Randomised trials the manual cites, and two it does not",
          head: ["Trial", "Comparison", "Result"],
          rows: [
            ["DKCRUSH-III (2013)", "DK crush vs culotte, distal left main", "MACE at 1 year 6.2% with DK crush vs 16.3% with culotte, driven by target vessel revascularisation"],
            ["DKCRUSH-V (2017, 3-year report 2019)", "DK crush vs provisional, distal left main true bifurcations", "Target lesion failure at 12 months 5.0% with DK crush vs 10.7% with provisional (the manual rounds these to 5% vs 10%), with definite or probable stent thrombosis 0.4% vs 3.3%; at 3 years target lesion failure 8.3% vs 16.9%"],
            ["BBK II (2016)", "Culotte vs TAP when the SB needs a stent", "Less angiographic restenosis with culotte (binary restenosis 6.5% vs 17%); target lesion failure 6.7% vs 12.0%, not significant"],
            ["EBC TWO (2016)", "Provisional T-stenting vs planned culotte; SB at least 2.5 mm with at least 5 mm of ostial disease", "Death, MI or target vessel revascularisation at 12 months 7.7% vs 10.3%, no difference; procedure time, X-ray dose and cost favoured provisional"],
            ["DEFINITION II (2020, 3-year report 2022; not cited in the manual)", "Planned two stents (77.8% DK crush) vs provisional in complex bifurcations by DEFINITION criteria", "Target lesion failure 6.1% vs 11.4% at 1 year and 10.4% vs 16.0% at 3 years, in favour of two stents; from year 1 to year 3 the two groups had similar event rates"],
            ["EBC MAIN (2021, 3-year report 2025, after the manual)", "Stepwise provisional vs planned dual stenting, true left main bifurcations; the protocol's dual-stent options were T, TAP or culotte (per-protocol analysis), and DK crush was not among them", "Death, MI or target lesion revascularisation 14.7% vs 17.7% at 12 months and 23.5% vs 29.5% at 3 years, neither significant. At 3 years revascularisation of the target lesion was less frequent with provisional (8.3% vs 15.6%), and side vessels under 3.25 mm or with lesions under 10 mm long did better with provisional"],
          ],
        },
        {
          kind: "p",
          text: "Read these together. A planned two-stent strategy beat provisional stenting in DKCRUSH-V (DK crush, true distal left main bifurcations) and in DEFINITION II (mostly DK crush, complex bifurcations by the DEFINITION criteria taught in cx-bif-two-stent). EBC TWO outside the left main and EBC MAIN in it found no significant difference in their primary end points, but neither was designed to test DK crush (EBC TWO compared culotte, and EBC MAIN's protocol dual-stent options were T, TAP or culotte), and the 3-year EBC MAIN data favour provisional when the side branch is small or its lesion short. Both manuals keep provisional stenting as the default; when two stents are planned, DK crush is the technique with the strongest trial support. For the left main, current European guidance leans further towards provisional than Brilakis does: the 2026 EAPCI and European Bifurcation Club consensus still advocates a stepwise provisional strategy for complex left main bifurcations, and keeps upfront treatment of the circumflex (DK crush, or an inverted provisional starting from the left main into the circumflex) for a circumflex that looks hard to reach or likely to close.",
        },
        { kind: "h", text: "Setting up the case" },
        {
          kind: "steps",
          title: "Preparation for any two-stent technique",
          items: [
            {
              title: "Guide: support first",
              detail: "Choose a supportive shape: an AL for the right coronary artery, an extra-backup curve such as EBU for the left main. Most techniques work through a 6 Fr guide, but V-stenting and SKS need at least 7 Fr to take two stents side by side. A bigger guide also makes it much easier to pass two devices together (used balloons above all), adds support and leaves room for troubleshooting. For a left main bifurcation Brilakis prefers a 7 or 8 Fr guide for that support (ch 17; cp-left-main). The Oxford handbook notes that most 6 Fr guides take two balloons for kissing.",
            },
            {
              title: "Access",
              detail: "Either wrist or groin access will do. The choice rests on the patient's arteries, how complex the lesion is and the operator's experience; in the hardest cases the groin may give a better-supported guide.",
            },
            {
              title: "Views",
              detail: "Find the projections that open the angle between MV and SB. You need that separation to wire, to place each stent and, for crush techniques, to see the crush.",
            },
            {
              title: "Wires",
              detail: "In most cases wire both branches, using workhorse wires; the exception is an SB that is too small or has no significant disease. If a polymer-jacketed wire was used to cross either branch, swap it for a workhorse wire before preparation and stenting. Watch both tips throughout: a wire that drifts too far distally can perforate. Keep the two wires apart on the table; Brilakis uses a towel, with the wire of the branch higher on the screen placed on top of it.",
            },
            {
              title: "Prepare both branches",
              detail: "This is the main difference from provisional stenting, where SB preparation is avoided because it can dissect the SB and force a stent. When two stents are planned, prepare the SB and the MV routinely. The MV is prepared in every bifurcation case, whatever the technique, because a prepared lesion is easier to size, easier to deliver a stent into and expands the stent better.",
            },
            {
              title: "Imaging and physiology",
              detail: "Before stenting, intravascular imaging gives the diameter and length of each lesion and shows how much calcium there is and whether atherectomy or other preparation is needed. At the end it checks the expansion of both stents, and it can find the cause of a complication such as a wire passed behind a stent. In the left main Brilakis makes final IVUS or OCT of both branches mandatory and gives minimum lumen areas to reach in each segment (cp-left-main). Physiology can define the baseline severity of each branch, whether the final result is adequate, and whether an SB has been compromised during provisional stenting, which decides whether a bail-out second stent is needed (Fig. 16.79; the left main paragraph of lesson 4).",
            },
            {
              title: "Imaging is now a guideline recommendation",
              detail: "The manual lists complex bifurcations among the lesions where imaging helps most. Since it was written, the 2024 ESC chronic coronary syndromes guideline has recommended intravascular imaging to guide PCI of anatomically complex lesions, in particular the left main, true bifurcations and long lesions. Two randomised trials back this: in OCTOBER (1,201 complex bifurcations), OCT guidance lowered major adverse cardiac events at 2 years from 14.1% to 10.1%; in DKCRUSH VIII (555 complex bifurcations by DEFINITION criteria at 24 centres in China, about 45% involving the left main, DK crush in 96.8%), IVUS guidance lowered target vessel failure at 1 year from 14.7% to 6.1%. Its authors attribute the benefit mainly to reaching the predefined IVUS optimisation targets rather than to running IVUS alone, so the images have to be acted on, not just recorded. The module's advice, drawn from the guideline and these trials rather than stated in either: plan imaging for every two-stent case rather than using it only where it happens to be available.",
            },
            {
              title: "Medication and support",
              detail: "Anticoagulation is as for standard PCI. Dual antiplatelet therapy follows the guideline default after elective PCI (about 6 months in chronic coronary syndromes; the Academy lesson pci-pharm-dapt-duration and the 2024 ESC guideline). Brilakis adds that prolonging it should be considered when bleeding risk is low, because bifurcation stenting carries a higher risk of stent thrombosis. The 2024 ESC guideline also allows prasugrel or ticagrelor to be considered instead of clopidogrel in selected elective patients at high thrombotic risk (taught with its examples in the Academy lesson pci-pharm-antiplatelets). Brilakis treats haemodynamic support as a case-by-case decision: complex left main bifurcation stenting with poor LV function may call for it, particularly if the RCA is occluded or severely diseased (cp-left-main). The Oxford handbook (2nd edition, 2020) is firmer for left main PCI: it advises an elective balloon pump when LV function is impaired, short balloon inflations, and IVUS both before PCI (reference diameter and lesion length) and after it (stent expansion). The randomised evidence does not support routine elective support: BCIS-1 (2010, before the handbook) found no difference in its primary end point with an elective balloon pump, although its long-term follow-up reported fewer deaths, and CHIP-BCIS3 (2026) found no benefit from elective microaxial unloading, so support is decided case by case (cp-left-main). Oxford also accepts any of the dedicated bifurcation techniques for a distal left main lesion, but cautions that extra stents for a compromised LAD or circumflex ostium may improve the angiogram while adding to the risk of restenosis and thrombosis.",
            },
          ],
        },
        { kind: "h", text: "Atherectomy when both wires are in" },
        {
          kind: "p",
          text: "During rotational or orbital atherectomy only one wire, the one carrying the burr or crown, can be in the artery being treated, so the other wire is traditionally withdrawn to avoid fracturing it. The cost is that a dissection in the unwired branch may then be hard to rewire. If you want to keep both wires, Brilakis gives these options:",
        },
        {
          kind: "list",
          items: [
            "**Guide extension over the atherectomy wire only**, when the calcium is in the proximal SB or the distal MV: the extension isolates the burr or crown from the second wire. A 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or 1.25 mm orbital crown; an 8 Fr guide with a 7 Fr extension takes a 1.5 mm burr.",
            "**A small microcatheter over the other wire**, to shield it (an 8 Fr guide is needed). Brilakis picks a small one because it is less likely to be damaged. When there are several runs, keep moving the microcatheter slowly during each run so the device does not keep grinding the same segment; the manual shows a protective microcatheter perforated by orbital atherectomy.",
            "**Leave the SB wire unprotected**, accepting a low risk of wire damage.",
            "**Laser atherectomy.**",
          ],
        },
        { kind: "tip", id: "pci-twostent-guide-size" },
        { kind: "tip", id: "pci-twostent-prepare-both" },
        { kind: "tip", id: "pci-twostent-workhorse-wires" },
        { kind: "tip", id: "pci-twostent-atherectomy-two-wires" },
        {
          kind: "check",
          stem: "You plan rotational atherectomy of a calcified distal LAD just beyond a large diagonal, and want to keep the diagonal wire in place during the runs. You have a 6 Fr guide. What does Brilakis's guide-extension option require?",
          options: [
            "Nothing extra: a 6 Fr guide accepts a 6 Fr extension and a 1.5 mm burr",
            "An 8 Fr guide and a 7 Fr extension for any burr size",
            "At least a 7 Fr guide with a 6 Fr extension, for a 1.25 mm burr",
            "Removal of the diagonal wire, because there is no way to keep it",
          ],
          answer: 2,
          explanation:
            "The extension sits over the atherectomy wire only and keeps the burr away from the diagonal wire. A 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or crown; an 8 Fr guide with a 7 Fr extension is needed for a 1.5 mm burr. The manual's arrangements start at a 7 Fr guide and it gives none for 6 Fr. Removing the wire is the traditional approach but not the only one.",
        },
        {
          kind: "p",
          text: "**The trifurcating left main** is rare. Brilakis uses a single stent when the side branches are free of significant disease; if one is involved, any two-stent technique can be used, and a final inflation with three balloons together ('trissing') can be considered to preserve the polygon of confluence. These cases need a 7 or 8 Fr guide. cp-left-main teaches the trifurcation in full.",
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing V-stenting when the proximal MV is diseased: it is a Medina 0,1,1 technique.",
            "Using SKS in an elective case: later wires and devices struggle to pass the long ridge of metal it leaves.",
            "Starting a V-stenting or SKS case with a 6 Fr guide: both need at least 7 Fr.",
            "Applying the provisional rule (do not touch the SB) to a planned two-stent case: here the SB is prepared routinely.",
            "Leaving a polymer-jacketed wire in place for stenting, or losing track of which wire is in which branch.",
          ],
        },
        {
          kind: "pearl",
          text: "The algorithm in Fig. 16.1 already holds the bail-out for every provisional plan, so it costs nothing to name it before the MV stent goes in (the module's advice, not a rule from either book). A provisional plan for a branch at 80° has TAP behind it; at 50° it has reverse crush or culotte, or an inverted DK crush if the branch closes and cannot be rewired.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "POT practice only (the bench cannot yet build a second stent). In the distal left main into LAD case, size the stent to the LAD (the distal MV) and then post-dilate the left main portion with a balloon sized 1:1 to the left main. This proximal optimisation step recurs in DK crush, culotte, TAP and reverse crush.",
        },
        { kind: "video", id: "HdtEEK33YVA", note: "Manual of PCI chapter 16.1: bifurcation PCI step by step." },
        { kind: "video", id: "S61z5nfoLuc", note: "Elias Hanna: left main bifurcation case studies with two-stent techniques." },
        {
          kind: "keypoints",
          items: [
            "Two stents are planned when an SB that must be kept is likely to close, or used as a bail-out when provisional stenting fails.",
            "Planned: Medina 0,1,1 → V-stenting (in the left main Brilakis prefers two-stent techniques, especially DK crush, for 0,1,1 too); emergency → SKS; angle 70°–90° → T-stenting; under 70° → DK crush (preferred) or culotte.",
            "Bail-out: 70°–90° → TAP; under 70° → reverse crush or culotte; occluded and not rewirable → inverted DK crush.",
            "Culotte suits branches of similar size; T and TAP suit a large MV with a smaller SB at a wide angle.",
            "Most techniques run through 6 Fr; V and SKS need at least 7 Fr, the left main is best done through 7 or 8 Fr, and a larger guide eases every two-device step.",
            "In most cases wire both branches with workhorse wires, keep them organised, and prepare both branches.",
            "Plan intravascular imaging for every two-stent case (the module's advice) and act on what it shows: the 2024 ESC guideline recommends it for the left main, true bifurcations and long lesions, and in DKCRUSH VIII the gain came mainly from meeting the IVUS targets.",
            "Provisional stenting is the default for most bifurcations, and in the left main for bifurcations without significant SB disease; for true left main bifurcations (Medina 1,1,1 or 0,1,1) Brilakis prefers a planned two-stent technique, especially DK crush, which has the strongest trial support. The 2026 EAPCI/EBC consensus still favours stepwise provisional in complex left main bifurcations unless the circumflex is hard to reach or likely to close.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-two-stent-dk-crush",
      title: "DK crush step by step",
      minutes: 16,
      topics: ["cx-dk-crush"],
      sources: [
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "15.2" },
        { book: "brilakis-pci", loc: "8" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
      ],
      refs: [...BOOKS, "chen-dkcrush3-2013", "dkcrush5-2017", "ormiston-crush-microct-2008", "finet-fractal-2008", "gao-dkcrush8-2026"],
      blocks: [
        {
          kind: "p",
          text: "Double kissing (DK) crush puts the SB stent in first, flattens its MV portion with a balloon, opens the SB with a first kiss, then stents the MV and finishes with a second kiss. The ‘double kiss’ is the extra kissing inflation before the MV stent, which classic crush does not have. Brilakis is frank that the technique is long and that something can go wrong at each step; what it buys is MV wire access all the way through, very little risk of losing the SB, and the best trial data of any two-stent technique.",
        },
        {
          kind: "p",
          text: "Before step 1, both branches are wired and prepared, with balloon angioplasty, atherectomy or both. The steps fall into four stages. The Oxford handbook gives the same skeleton in brief: SB stent first protruding into the proximal MV, crush with a balloon kept in the MV, rewire and first kiss, MV stent, POT, rewire and second kiss.",
        },
        {
          kind: "steps",
          title: "Stage A: stent the SB and crush it (steps 1 to 6)",
          items: [
            {
              title: "1. Park a balloon in the MV",
              detail: "A balloon sized 1:1 to the distal MV sits in the MV at, or beyond, the SB origin. It is the balloon that will later crush the protruding end of the SB stent.",
            },
            {
              title: "2. Bring the SB stent into place",
              detail: "Let it run the full length of the SB disease and stand 2–3 mm proud of the ostium in the MV (Brilakis's DK crush figure; 1–2 mm is his figure for TAP and V-stenting, not for DK crush). Erring long costs little; erring short can leave part of the ostium unscaffolded, so that a further stent is needed. If it will not reach: prepare the SB or MV further (standard or modified balloons, atherectomy), or add support with the SB anchoring technique (an anchor balloon in the MV) or a guide extension.",
            },
            {
              title: "3. Deploy the SB stent",
              detail: "Deploy at 10–12 atm, not higher, to limit the risk of a distal edge dissection. Then pull the stent balloon back a little so it protrudes into the MV and reinflate it at high pressure (20 atm) to expand the stent fully.",
            },
            {
              title: "4. Take out the SB stent balloon",
              detail: "The SB wire stays for now.",
            },
            {
              title: "5. Angiogram of the SB",
              detail: "Look for underexpansion and a distal dissection. Fix them now, with more SB PCI if needed: an SB result left poor at this stage can make the later rewiring fail.",
            },
            {
              title: "6. Crush",
              detail: "Inflate the parked MV balloon to flatten the protruding SB struts against the MV wall. Most operators withdraw the SB wire first, although it can be left and jailed. If the crush balloon is sized to the proximal MV (as for a POT), keep it from passing beyond the carina, or the distal MV may dissect; the alternative is a balloon sized to the distal MV followed by a POT.",
            },
          ],
        },
        { kind: "tip", id: "pci-dkcrush-mv-balloon-first" },
        { kind: "tip", id: "pci-dkcrush-sb-protrusion" },
        { kind: "tip", id: "pci-dkcrush-sb-deploy-pressure" },
        { kind: "tip", id: "pci-dkcrush-crush-balloon" },
        {
          kind: "check",
          stem: "In step 6 you plan to crush with a non-compliant balloon sized to the proximal LAD, which is 0.75 mm larger than the LAD beyond the diagonal. Where should that balloon sit?",
          options: [
            "Centred on the carina, so that it crushes and post-dilates both segments at once",
            "In the proximal MV, not advanced beyond the carina",
            "Across the full length of the planned MV stent",
            "In the distal MV, sized down by inflating it at nominal pressure",
          ],
          answer: 1,
          explanation:
            "A balloon sized to the proximal MV behaves like a POT balloon: if it extends past the carina into the smaller distal MV it may dissect it. Brilakis keeps such a balloon proximal to the carina, or uses a balloon sized to the distal MV and then a POT. Centring it on the carina is exactly the position that overstretches the distal vessel.",
        },
        {
          kind: "steps",
          title: "Stage B: reopen the SB and give the first kiss (steps 7 to 10)",
          items: [
            {
              title: "7. Rewire the SB through a proximal strut of the crushed stent",
              detail: "Then remove the jailed SB wire if one was left. A proximal-strut entry means the SB balloon will push the crushed struts towards the carina; Brilakis explains the same choice in mini-crush, where a wire through a distal strut risks moving the crushed stent away from the carina.",
            },
            {
              title: "If the SB cannot be rewired",
              detail: "Wire options: put a secondary bend on the wire; change to a hydrophilic or polymer-jacketed wire; use the reversed (hairpin) wire technique. Microcatheter options: a standard microcatheter for support and to reshape the tip without losing position; an angulated microcatheter; a dual lumen microcatheter.",
            },
            {
              title: "8. Bring a balloon into the SB",
              detail: "If it will not advance, in Brilakis's order: a very small balloon (he gives a 1.0 mm example); an anchor balloon in the MV; a specialised balloon (he names one product); a microcatheter to create a track; and finally rewiring the SB.",
            },
            {
              title: "9. First kissing inflation, done as a two-step kiss",
              detail: "Inflate the SB balloon alone at high pressure (20 atm), then inflate both MV and SB balloons together at 10–12 atm. The original MV balloon can be reused if its size suits the proximal MV and the SB balloon (Finet's law, below). Short non-compliant balloons are usual for kissing, though they can be harder to deliver; if compliant balloons are used, keep high-pressure inflations to a minimum (16.2.10.1; cp-bifurcation-provisional).",
            },
            {
              title: "10. Remove both balloons",
              detail: "The SB wire may be left in or taken out. In Brilakis's figures it is left, so it is jailed by the MV stent and removed after the final rewiring.",
            },
          ],
        },
        {
          kind: "formula",
          name: "Finet's relation applied to two kissing balloons (Brilakis)",
          expr: "Effective diameter = 0.678 × (diameter of balloon 1 + diameter of balloon 2)",
          note: "Finet derived the 0.678 coefficient from the diameters of native bifurcating vessels; Brilakis uses the same relation to estimate the effective diameter of a kissing pair, which should be close to the proximal MV diameter. Example: 3.0 mm and 2.5 mm balloons give 0.678 × 5.5 ≈ 3.7 mm.",
        },
        {
          kind: "p",
          text: "**Why two steps?** On micro-CT of bench crush deployments (Ormiston, the study Brilakis cites), metal covered 53% of the SB ostium after a one-step kiss and 33% after a two-step kiss. In the bench images the manual reproduces, a one-step kiss removes some of the double strut layer from the ostium and a two-step kiss removes more of it.",
        },
        { kind: "tip", id: "pci-dkcrush-first-rewire-proximal" },
        { kind: "tip", id: "pci-dkcrush-sb-balloon-wont-go" },
        { kind: "tip", id: "pci-twostent-two-step-kiss" },
        {
          kind: "check",
          stem: "After crushing, a new wire enters the SB stent easily through a strut close to the carina (a distal strut). The fellow wants to carry on with the first kiss. What concern does the manual raise?",
          options: [
            "None: distal struts are always preferred, in every bifurcation step",
            "The SB balloon may push the crushed stent away from the carina, so aim for a proximal strut",
            "A distal strut entry means the wire is under the stent and must be withdrawn",
            "The first kiss should be skipped and the MV stent deployed at once",
          ],
          answer: 1,
          explanation:
            "Distal-strut rewiring is right after MV stenting (provisional, culotte and the second DK crush rewiring). The first DK crush rewiring is the exception: through a proximal strut, so the balloon presses the crushed struts back towards the carina. A distal entry is not by itself proof of substent wiring, and skipping the first kiss removes the step that defines DK crush.",
        },
        {
          kind: "steps",
          title: "Stage C: stent the MV (steps 11 to 13)",
          items: [
            {
              title: "11. Deliver and deploy the MV stent",
              detail: "Sized to the distal MV, as for any MV stent across a bifurcation (pm-prep-and-stent).",
            },
            {
              title: "12. Assess the MV result",
              detail: "Treat any distal MV problem now.",
            },
            {
              title: "13. POT, if the proximal MV is clearly larger than the distal MV",
              detail: "Choose a balloon matched 1:1 to the proximal MV, line its distal edge up with the carina, inflate, remove. This expands and apposes the stent proximally and makes it less likely that the wire you are about to pass into the SB goes behind the MV stent.",
            },
          ],
        },
        {
          kind: "steps",
          title: "Stage D: second kiss and finish (steps 14 to 17)",
          items: [
            {
              title: "14. Rewire the SB through the MV stent, this time through a distal strut",
              detail: "Then pull out the SB wire jailed behind the MV stent, if you left one there. If rewiring fails, use the same wire and microcatheter options as in step 7.",
            },
            {
              title: "15. Second kiss, again in two steps",
              detail: "Advance both balloons (either first). Inflate one at high pressure, then the other at high pressure, then both together at 12–14 atm.",
            },
            {
              title: "16. Final POT",
              detail: "Balloon 1:1 to the proximal MV, distal edge at the carina; inflate and remove. Brilakis gives no reason at this step; in provisional stenting (16.2.10.1) his reason for the final POT is to correct the oval shape the two kissing balloons leave in the proximal MV, and the same kiss comes just before it here.",
            },
            {
              title: "17. Final angiography, and intravascular imaging",
              detail: "Check SB ostium coverage and MV expansion. Enhanced stent visualisation can confirm that the SB ostium is fully covered and show whether a stent has been deformed. Since the manual, DKCRUSH VIII has shown that IVUS guidance of DK crush in complex bifurcations lowers target vessel failure at 1 year, mainly when the IVUS optimisation targets are actually reached (lesson 1).",
            },
          ],
        },
        { kind: "tip", id: "pci-dkcrush-second-rewire-distal" },
        { kind: "tip", id: "pci-twostent-final-pot" },
        {
          kind: "check",
          stem: "During step 15 the SB balloon will not advance through the MV stent struts after the second rewiring. Which response follows the sequence Brilakis gives for the first kiss?",
          options: [
            "Push harder with the same balloon while the guide is pulled back",
            "Abandon the second kiss and finish with a single final POT at the carina instead",
            "Step down to a very small balloon, then an anchor or a microcatheter track",
            "Deploy a third stent from the SB into the MV to cover the ostium",
          ],
          answer: 2,
          explanation:
            "Brilakis gives this list at the first kiss (steps 8 and 9): a very small balloon, an anchor balloon in the MV, a specialised balloon, a microcatheter to make a track, and finally rewiring the SB. He gives no separate list for the second kiss; the module applies the same sequence there. The second kiss is a step of the technique, so dropping it is not an answer, and a third stent treats a problem that a smaller balloon may solve.",
        },
        {
          kind: "pitfalls",
          items: [
            "SB stent landed flush with the ostium instead of 2–3 mm into the MV: part of the ostium may be left unscaffolded and need a further stent.",
            "SB stent deployed straight to high pressure: the distal SB edge can dissect. Deploy at 10–12 atm, then post-dilate with the pulled-back balloon at 20 atm.",
            "Crushing before an SB angiogram: an underexpanded SB stent or a distal dissection left unfixed can make the later rewiring fail.",
            "Proximally sized crush or POT balloon pushed past the carina: distal MV dissection.",
            "First rewiring through a distal strut, or second rewiring through a proximal strut.",
            "One-step kisses instead of two-step kisses: more metal left across the SB ostium on bench imaging.",
            "Omitting the final POT after the second kiss, which Brilakis lists as step 16 (after provisional kissing he uses it to correct the oval shape of the proximal MV stent).",
          ],
        },
        {
          kind: "pearl",
          text: "Keep count of your wires and where each one has been. In DK crush a single SB can be entered three times (the original wire, the first rewiring through the crushed stent, the second through the MV stent), and the strut you need is different the first and second time: proximal through the crushed stent, distal through the MV stent. Saying ‘proximal now, distal later’ before each rewiring helps avoid entering the wrong strut.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "POT practice only (the bench cannot yet build the crush or the kisses). In the distal left main case, after the stent is deployed into the LAD, practise the final step of DK crush: choose a balloon 1:1 to the left main and place it so its distal edge is at the carina for the final POT, then check proximal expansion and apposition on IVUS.",
        },
        { kind: "video", id: "3gLTztQjCzQ", note: "Brilakis: DK crush step by step in a bench model." },
        { kind: "video", id: "wGfNPk2a4y0", note: "Brilakis: how to perform the DK crush technique." },
        { kind: "video", id: "CW-OW5HRiFk", note: "Manual of PCI 16.3: DK crush troubleshooting." },
        { kind: "video", id: "JAhMvyDGotg", note: "Elias Hanna: two-stent techniques, crush, DK crush and culotte." },
        {
          kind: "keypoints",
          items: [
            "Prepare and wire both branches; park a balloon 1:1 to the distal MV at or beyond the SB origin.",
            "SB stent protrudes 2–3 mm into the MV; deploy at 10–12 atm, then the pulled-back balloon at 20 atm.",
            "Angiogram of the SB before crushing; most operators remove the SB wire before the crush.",
            "A proximally sized crush balloon stays proximal to the carina.",
            "First rewiring through a proximal strut of the crushed stent; second through a distal strut of the MV stent.",
            "First kiss: SB balloon alone at 20 atm, then both at 10–12 atm. Second kiss: one balloon at high pressure, then the other at high pressure (either order), then both together at 12–14 atm.",
            "POT after the MV stent if the proximal MV is larger, and a final POT after the second kiss; finish with angiography and imaging.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-two-stent-culotte",
      title: "Culotte stenting step by step",
      minutes: 12,
      topics: ["cx-culotte"],
      sources: [
        { book: "brilakis-pci", loc: "16.2" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation lesions" },
      ],
      refs: [...BOOKS, "chen-dkcrush3-2013", "ferenc-bbk2-2016", "hildick-smith-ebc-two-2016"],
      blocks: [
        {
          kind: "p",
          text: "In a culotte each branch gets its own stent and both stents extend back into the proximal MV, one inside the other, so the proximal MV ends up with two layers of metal. Brilakis places it as the technique for bifurcations whose SB and distal MV are of similar size.",
        },
        {
          kind: "list",
          items: [
            "In left main bifurcations it was inferior to DK crush in DKCRUSH-III.",
            "It gave less angiographic restenosis than TAP in BBK II.",
            "In EBC TWO, a planned culotte and a provisional strategy gave similar outcomes in complex bifurcations with large diseased SBs.",
          ],
        },
        {
          kind: "steps",
          title: "Culotte (Brilakis's eleven steps)",
          items: [
            {
              title: "1. Stent the more angulated branch first",
              detail: "Deliver and deploy the first stent in the branch with the sharper angle, from that branch back into the proximal MV. In the manual's figures this is the SB. The other branch keeps its wire, which is now jailed. Each stent is sized to its own branch but will later be expanded to the proximal MV diameter by a POT, so choose platforms whose labelled post-dilatation limit reaches that diameter. Brilakis asks this of the MV stent in provisional stenting (16.2.10.1) and of any left main stent continued into the LAD or circumflex (17.10), so that it is not overstretched and deformed; his culotte section gives no sizing advice, and the module applies the same logic to both culotte stents because each is POTed to the proximal MV.",
            },
            {
              title: "2. Remove the stent balloon",
              detail: "The wire in the first branch stays; the wire in the other branch is still jailed.",
            },
            {
              title: "3. Evaluate the stented branch",
              detail: "Is more PCI needed for an optimal result in that branch? If so, do it now.",
            },
            {
              title: "4. POT",
              detail: "Expand the proximal part of the first stent to the proximal MV size before recrossing. Brilakis gives no reason at this step; in provisional stenting he notes that a POT enlarges the stent cells and so eases wire crossing (Fig. 16.8), which is the module's reading of its purpose here.",
            },
            {
              title: "5. Rewire the unstented branch through a distal cell at the carina",
              detail: "Then remove the jailed wire.",
            },
            {
              title: "6. Open the struts into that branch",
              detail: "Advance a balloon partly into the unstented branch and inflate it. Brilakis gives no reason; the module's reading is that this widens the cell for the second stent.",
            },
            {
              title: "7. Deliver and deploy the second stent",
              detail: "From the second branch back into the proximal MV, inside the proximal part of the first stent.",
            },
            {
              title: "8. Second POT",
              detail: "A balloon sized to the proximal MV now expands the overlapping segment where the two stents lie one inside the other.",
            },
            {
              title: "9. Rewire the first branch through a distal cell of the second stent",
              detail: "Then remove the jailed wire.",
            },
            {
              title: "10. Kissing balloon inflation",
              detail: "Advance a balloon into each branch (either first). Inflate one at high pressure, then the other at high pressure, then both together at 12–14 atm. Remove both. A final POT is optional. Balloon choice is as in DK crush step 9: short non-compliant balloons, or compliant ones with as few high-pressure inflations as possible.",
            },
            {
              title: "11. Final assessment",
              detail: "Brilakis names the step without detail. The module's suggestion: angiography in the views that separate the branches, with intravascular imaging as in his imaging section (16.2.13).",
            },
          ],
        },
        { kind: "tip", id: "pci-culotte-first-branch" },
        { kind: "tip", id: "pci-culotte-pot-before-rewire" },
        { kind: "tip", id: "pci-twostent-kiss-sequence" },
        {
          kind: "check",
          stem: "In a culotte, the first stent has been deployed from a sharply angled circumflex into the left main and its balloon removed. What comes next, before the LAD is rewired?",
          options: [
            "Rewire the LAD at once through any cell, to save time",
            "Assess the circumflex result, then POT the proximal part of the stent",
            "Kiss with balloons in both branches before any rewiring",
            "Deploy the LAD stent over the jailed LAD wire",
          ],
          answer: 1,
          explanation:
            "Steps 3 and 4 come before rewiring: evaluate the stented branch and treat what needs treating, then POT the proximal stent so the cells are open for the wire. Rewiring is then through a distal cell at the carina. A stent over the jailed wire would be deployed outside the first stent, behind its struts; the jailed wire is removed only after the new wire is through.",
        },
        { kind: "h", text: "The Oxford handbook's version" },
        {
          kind: "p",
          text: "The Oxford handbook describes the culotte the other way round: the MV is stented first, the SB is rewired, and the second stent is deployed from the MV into the proximal SB. It makes the final kiss mandatory after recrossing into the MV, because the double layer of stent in the proximal MV risks under-deployment. The handbook stops there: the evaluation step, the POTs, the distal-cell recrossings and the strut dilatation in the steps above are Brilakis's.",
        },
        {
          kind: "check",
          stem: "Why does the Oxford handbook call the final kissing inflation mandatory in a culotte?",
          options: [
            "Because two layers of stent overlap in the proximal MV and may be under-deployed",
            "Because the SB ostium is left uncovered unless a kiss is done",
            "Because culotte uses compliant stents that need a second inflation",
            "Because the jailed wire cannot be removed without a kiss",
          ],
          answer: 0,
          explanation:
            "The proximal MV holds two layers of stent, one inside the other, and that double layer risks being under-deployed; that is the reason Oxford gives. Each branch in a culotte has its own stent, so an uncovered SB ostium is not the reason, and the jailed wire comes out after rewiring, not because of the kiss.",
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing culotte when the SB is much smaller than the distal MV: the technique suits branches of similar size.",
            "Skipping the POT before recrossing: the cells stay smaller and the wire may pass behind the stent, the risk Brilakis names for the POT before the second DK crush rewiring (the module's extension of 16.2.10.5 step 13; he gives no reason at the culotte POT).",
            "Rewiring through a proximal cell, which scaffolds the ostium less well than a distal cell at the carina.",
            "Not opening the struts into the unstented branch before the second stent.",
            "Leaving out the final kiss: the double-layer segment may stay under-expanded.",
            "Choosing a stent for either branch without checking that its post-dilatation limit reaches the proximal MV diameter: the POTs then overstretch and deform it.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the culotte as two provisional stents in sequence (the module's framing, not Brilakis's). After each stent comes a POT and then rewiring through a distal cell; the first stent is also evaluated and has its struts opened before the second goes in, and the second is followed by the kiss. Keeping to that rhythm makes the next move predictable at every stage.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "POT practice only (the bench cannot yet build the second culotte stent). In the distal left main case, practise the POT after the first stent: size the balloon to the left main, keep its distal edge at the carina, and confirm on IVUS that the proximal stent is apposed before any rewiring would begin.",
        },
        { kind: "video", id: "XZMGc_U1Zl8", note: "Brilakis: how to do culotte bifurcation stenting." },
        { kind: "video", id: "JAhMvyDGotg", note: "Elias Hanna: crush, DK crush and culotte." },
        {
          kind: "keypoints",
          items: [
            "Culotte suits an SB and distal MV of similar size.",
            "Brilakis stents the more angulated branch first; Oxford stents the MV first.",
            "After the first stent: evaluate, POT, rewire through a distal cell at the carina, remove the jailed wire, open the struts. After the second: POT, rewire through a distal cell, remove the jailed wire, kiss.",
            "Both stents end up expanded to the proximal MV diameter, so each platform's post-dilatation limit must reach it.",
            "Open the struts into the unstented branch with a balloon before the second stent.",
            "Kiss in sequence: one at high pressure, the other at high pressure, both together at 12–14 atm; a final POT is optional.",
            "Trial data: worse than DK crush in the left main (DKCRUSH-III), less restenosis than TAP (BBK II), similar to provisional in EBC TWO.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-two-stent-t-tap",
      title: "T-stenting and TAP step by step",
      minutes: 12,
      topics: ["cx-tap"],
      sources: [
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "15.2" },
        { book: "brilakis-pci", loc: "17" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
      ],
      refs: [...BOOKS, "ferenc-bbk2-2016", "hildick-smith-ebc-two-2016"],
      blocks: [
        {
          kind: "p",
          text: "T-stenting and TAP (T and protrusion) are the two techniques for bifurcations whose SB leaves at close to a right angle, above all when the SB is clearly smaller than the MV. They are simpler and faster than DK crush or culotte. In T-stenting the SB stent's proximal marker sits at the SB origin (Brilakis still wants it to jut slightly into the MV; Oxford lands its edge exactly at the ostium). In TAP the SB stent juts only slightly, 1–2 mm, into the MV (Brilakis gives no reason; the module's reading is that this covers the ostium while keeping the neocarina short). Brilakis treats TAP as the bail-out after provisional MV stenting.",
        },
        { kind: "h", text: "Planned T-stenting (Brilakis)" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Park a balloon in the MV",
              detail: "Sized 1:1 to the distal MV, at or beyond the SB origin.",
            },
            {
              title: "2. Bring the SB stent to the ostium",
              detail: "Place its proximal marker at the SB origin so the whole ostium is covered. If it will not go, prepare the SB or MV further (balloon, additional POT, modified balloon, atherectomy) or add support (an SB anchoring balloon in the MV, or a guide extension). Let the stent run the full length of the SB disease and stand slightly proud of the ostium in the MV. Erring long costs little; erring short can leave part of the ostium unscaffolded, so that a further stent is needed.",
            },
            {
              title: "3. Deploy the SB stent",
              detail: "At 10–12 atm to protect the distal edge, then pull the balloon back slightly into the MV and reinflate it at 20 atm.",
            },
            {
              title: "4. Remove the SB balloon and wire",
              detail: "The parked MV balloon also has to be withdrawn before the MV stent can be delivered (the manual does not list this separately). Only the MV wire remains in place.",
            },
            {
              title: "5. Deploy the MV stent",
              detail: "Sized to the distal MV, across the SB origin, over the MV wire.",
            },
            {
              title: "6. Rewire the SB and kiss",
              detail: "Rewire the SB through the MV stent and finish with a kissing inflation (Brilakis step 6).",
            },
          ],
        },
        {
          kind: "p",
          text: "For a branch ostial lesion with no MV disease (Brilakis 15.2), T-stenting is the SB stent alone: wire both branches, predilate the SB, place a stent sized to the SB with its proximal marker at the ostium, deploy, then confirm with several orthogonal views and imaging that the MV was not injured. Wiring such an ostium may need a microcatheter (a dual lumen one especially) or a hydrophilic or polymer-jacketed wire. Prepare the ostium without harming the MV, which matters most when the MV has mild or moderate disease near the bifurcation; scoring or cutting balloons slip less and lower the risk of dissecting the SB ostium. At the end, imaging shows stent expansion, whether the ostium is covered and how far the SB stent sticks into the MV (cp-ostial). At angles under 70° a mini-crush is used instead (lesson 5).",
        },
        { kind: "tip", id: "pci-tstent-proximal-marker" },
        {
          kind: "check",
          stem: "During planned T-stenting of a diagonal leaving at 85°, the final angiogram shows a small unstented gap at the upper edge of the diagonal ostium. What does Brilakis say caused it, and what is the risk?",
          options: [
            "The MV balloon was too large; the gap will close with time",
            "The SB stent protruded too little into the MV; another stent may be needed",
            "The SB stent was deployed at too low a pressure; a higher pressure would close it",
            "Kissing was done; T-stenting should never end with a kiss",
          ],
          answer: 1,
          explanation:
            "Brilakis answers poor ostial coverage with a stent that spans all of the SB disease and stands slightly proud of the ostium in the MV. Erring long costs little; erring short leaves part of the ostium unscaffolded, which may call for a further stent. Deployment pressure does not move the stent edge, and planned T-stenting does finish with rewiring and kissing.",
        },
        { kind: "h", text: "TAP as the bail-out (Brilakis)" },
        {
          kind: "p",
          text: "TAP starts where provisional stenting stops: the MV is stented, the SB has been rewired (ideally through a distal strut), and kissing and a repeat POT have been done, but the SB still needs a stent. Its advantage is simplicity, because once the SB stent is in, nothing has to be rewired. Its drawback is a neocarina, a short ridge of SB stent struts standing in the MV, which may get in the way of equipment later.",
        },
        {
          kind: "steps",
          title: "TAP steps",
          items: [
            {
              title: "1. Deliver the SB stent across the SB ostium",
              detail: "Over the SB wire through the MV stent struts, beyond the ostium for now.",
            },
            {
              title: "2. Put a balloon in the MV stent, across the SB take-off",
              detail: "This balloon will be the MV half of the kiss.",
            },
            {
              title: "3. Set the SB stent with minimal protrusion",
              detail: "1–2 mm into the MV.",
            },
            {
              title: "4. Deploy the SB stent",
              detail: "With the stent in its final position and the MV balloon still in place, uninflated.",
            },
            {
              title: "5. Pull the SB stent balloon back slightly",
              detail: "So that it lies partly in the MV, beside the MV balloon.",
            },
            {
              title: "6. Kiss the SB and MV balloons, deflating the MV balloon first",
              detail: "If the SB balloon goes down first, the MV balloon presses the protruding struts into the SB ostium.",
            },
            {
              title: "7. Final POT just short of the neocarina",
              detail: "Advance the POT balloon only until its distal marker is just proximal to the neocarina; any further and it crushes the protruding struts.",
            },
            {
              title: "8. Final assessment",
              detail: "Brilakis names the step without detail. The module's suggestion: angiography in views that separate the branches, with intravascular imaging (16.2.13) or enhanced stent visualisation, which he uses to confirm that an SB ostium is fully covered.",
            },
          ],
        },
        { kind: "tip", id: "pci-tap-protrusion" },
        { kind: "tip", id: "pci-tap-deflate-mv-first" },
        { kind: "tip", id: "pci-tap-final-pot" },
        {
          kind: "check",
          stem: "In a bail-out TAP the SB stent is deployed and kissing has just been done. Which deflation order and final POT position does Brilakis give?",
          options: [
            "SB balloon first; final POT with its distal marker at the carina",
            "Both together; final POT with its distal marker at the neocarina",
            "MV balloon first; final POT with its distal marker just proximal to the neocarina",
            "MV balloon first; final POT centred on the neocarina",
          ],
          answer: 2,
          explanation:
            "Deflating the MV balloon first stops it squashing the protruding SB struts into the SB ostium. In TAP the ‘carina’ is now the neocarina of SB struts, so the POT balloon must stop just proximal to it; a balloon at or across the neocarina would crush the very struts the technique relies on.",
        },
        { kind: "h", text: "The Oxford handbook's version, and the trials" },
        {
          kind: "list",
          items: [
            "Both T-stenting and TAP can be planned two-stent techniques or a bail-out after failed provisional stenting.",
            "T-stenting when the angle between MV and SB approaches 90°; TAP when it is under 90°.",
            "In both, the MV gets its stent first. The SB is then rewired and stented, the stent edge sitting exactly at the ostium for T, or jutting a little into the proximal MV for TAP.",
            "POT of the proximal main branch and a final kissing inflation are strongly recommended.",
            "Along with culotte, T-stenting and TAP are the bail-outs most often used after provisional stenting.",
            "Trials: culotte gave less angiographic restenosis than TAP in BBK II; in EBC TWO, 16% of patients in the provisional group went on to T-stenting, and the provisional strategy matched a planned culotte.",
          ],
        },
        {
          kind: "p",
          text: "In the left main (Brilakis 17), when a jailed circumflex looks compromised after provisional stenting into the LAD, assess it with imaging and physiology: defer stenting if adenosine FFR is above 0.80 (or a resting index above its cut-off); at 0.80 or below, a second stent can be added by T-stenting, TAP, reverse crush or culotte (cp-left-main).",
        },
        {
          kind: "pitfalls",
          items: [
            "Landing a T-stent at a narrow angle: part of the ostium stays uncovered.",
            "Too little protrusion in T-stenting, or more than 1–2 mm in TAP, which lengthens the neocarina.",
            "Deflating the SB balloon first in the TAP kiss.",
            "Final POT advanced up to or across the neocarina.",
            "Jumping to an SB stent before rewiring, kissing and re-POT have been tried.",
          ],
        },
        {
          kind: "pearl",
          text: "TAP turns a failed provisional result into a finished two-stent result without a single extra rewiring of the SB once its stent is in. Brilakis's algorithm makes it the bail-out for a side branch at 70°–90° (Fig. 16.1); its simplicity is a bonus, not the reason for that choice.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "POT practice only (the bench cannot yet build the side-branch stent). In the distal left main into LAD case, run the provisional sequence that comes before any TAP: size to the LAD, POT with a balloon 1:1 to the left main with its distal edge at the carina, and judge the result on IVUS before deciding whether the circumflex would need a stent.",
        },
        { kind: "video", id: "s9aKkOfiBio", note: "Manual of PCI 16.2: provisional bifurcation stenting, the starting point of TAP." },
        { kind: "video", id: "S61z5nfoLuc", note: "Elias Hanna: left main case studies with two-stent techniques." },
        {
          kind: "keypoints",
          items: [
            "T-stenting and TAP suit SB angles close to 90°, especially with a large MV and a smaller SB.",
            "Planned T-stenting (Brilakis): MV balloon parked, SB stent proximal marker at the ostium, deploy 10–12 atm then 20 atm, remove SB balloon and wire, MV stent, rewire and kiss.",
            "TAP: from a stented, rewired, kissed and re-POTed MV; SB stent protrudes 1–2 mm; MV balloon across the take-off.",
            "In the TAP kiss, deflate the MV balloon first.",
            "Final POT stops just proximal to the neocarina.",
            "Oxford: T near 90°, TAP under 90°, main branch first in both; POT and final kiss strongly recommended.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-two-stent-crush-variants",
      title: "Reverse crush, mini-crush, V-stenting and simultaneous kissing stents",
      minutes: 14,
      topics: ["cx-reverse-mini-crush"],
      sources: [
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "16.1" },
        { book: "brilakis-pci", loc: "15.2" },
        { book: "brilakis-pci", loc: "17" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
      ],
      refs: [...BOOKS, "ormiston-crush-microct-2008"],
      blocks: [
        {
          kind: "p",
          text: "The crush family shares one move: an SB stent that protrudes into the MV is flattened against the MV wall, by a balloon in DK crush, reverse crush and mini-crush or by the MV stent itself in classic crush, then the SB is rewired through the crushed metal and kissed. The variants differ in what is already in the MV when the crush happens. V-stenting and SKS are different again: two stents deployed at the same moment. This lesson teaches the reverse crush (a bail-out), the mini-crush (for branch ostial lesions at an acute angle), the classic crush as the Oxford handbook gives it, and the two simultaneous techniques.",
        },
        { kind: "h", text: "Reverse (internal) crush: a bail-out after provisional stenting" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Rewire the SB through the MV stent and remove the jailed wire",
              detail: "You may advance the MV balloon now rather than at step 3: once the SB has been ballooned, some struts may stick out and make it hard to get an MV balloon past them.",
            },
            {
              title: "2. Dilate the SB",
              detail: "Advance a balloon into the SB, inflate, remove.",
            },
            {
              title: "3. Deliver the MV balloon",
              detail: "Into the MV stent, across the SB origin (if not placed at step 1).",
            },
            {
              title: "4. Deliver the SB stent",
              detail: "Protruding into the MV; the manual's figure shows 2–3 mm, as in DK crush.",
            },
            {
              title: "5. Deploy the SB stent",
              detail: "The MV balloon stays uninflated while the SB stent is deployed.",
            },
            {
              title: "6. Remove the SB stent balloon",
              detail: "The SB wire stays in.",
            },
            {
              title: "7. Crush the SB stent",
              detail: "Inflate the MV balloon inside the MV stent. The SB wire is jailed by the crushed struts.",
            },
            {
              title: "8. Rewire the SB stent and remove the jailed wire",
              detail: "A POT is needed now if the proximal and distal MV differ in size.",
            },
            {
              title: "9. Kissing balloon inflation",
              detail: "One balloon in the SB stent, one in the MV stent, inflated together.",
            },
            {
              title: "10. POT",
              detail: "Balloon sized to the proximal MV. Brilakis gives no reason at this step; after provisional kissing he uses the final POT to correct the oval shape the two balloons leave in the proximal MV.",
            },
            {
              title: "11. Final assessment",
              detail: "Brilakis names the step without detail. The module's suggestion: angiography in views that separate the branches, with intravascular imaging as in 16.2.13.",
            },
          ],
        },
        { kind: "tip", id: "pci-revcrush-mv-balloon-early" },
        {
          kind: "check",
          stem: "In a reverse crush, the SB has just been rewired through the provisional MV stent and dilated. The MV balloon now catches on struts at the bifurcation and will not pass. What could have prevented this, according to the manual?",
          options: [
            "Using a compliant MV balloon, which crosses struts more easily",
            "Advancing the MV balloon at step 1, before the SB was ballooned",
            "Removing the MV wire before dilating the SB",
            "Dilating the SB at 20 atm so that the struts lie flatter",
          ],
          answer: 1,
          explanation:
            "Brilakis allows the MV balloon to be placed at step 1, straight after the SB is rewired, because ballooning the SB can lift struts into the MV lumen and block a balloon advanced afterwards. Removing the MV wire would throw away the access that makes the technique safe, and higher SB pressure is not what the manual offers.",
        },
        { kind: "h", text: "Mini-crush for a branch ostial lesion at an acute angle (Brilakis 15.2)" },
        {
          kind: "p",
          text: "When the disease is at the SB ostium only and the SB leaves at under 70°, the SB stent has to stick well out into the MV to cover the ostium, so Brilakis uses a mini-crush rather than a T-stent.",
        },
        {
          kind: "steps",
          items: [
            {
              title: "1. Wire both branches",
              detail: "The SB ostial lesion and the MV both keep a wire throughout.",
            },
            {
              title: "2. Predilate the SB",
              detail: "Prepare the ostial lesion without injuring the MV, which matters most when the MV has mild or moderate disease near the bifurcation. Scoring or cutting balloons move less during inflation and lower the risk of dissecting the SB ostium. Wiring the ostium may need a microcatheter (especially a dual lumen one) or a hydrophilic or polymer-jacketed wire.",
            },
            {
              title: "3. Position a stent in the SB and a balloon in the MV",
              detail: "The SB stent is sized to the SB and protrudes into the MV just enough to cover both the proximal and distal lips of the ostium. The MV balloon, sized 1:1 to the MV, lies opposite the ostium.",
            },
            {
              title: "4. Deploy the SB stent and remove its balloon",
              detail: "The MV balloon is still in position, uninflated.",
            },
            {
              title: "5. Crush",
              detail: "Inflate the MV balloon to flatten the protruding part of the SB stent, then remove it.",
            },
            {
              title: "6. Rewire the SB stent through a proximal strut with a second wire",
              detail: "So that the SB balloon pushes the crushed stent towards the carina, as in DK crush. A wire through a distal strut risks moving the crushed stent away from the carina.",
            },
            {
              title: "7. Balloons into both branches, then remove the jailed SB wire",
              detail: "Leave the jailed wire until both balloons are in place: it anchors the system and helps the balloons advance.",
            },
            {
              title: "8. Kiss, then remove both balloons",
              detail: "Brilakis lists the kiss and the removal of both balloons without stating a purpose.",
            },
            {
              title: "9. Final assessment",
              detail: "After the final assessment Brilakis adds that significant plaque shift into the MV may call for an MV stent, placed as for any bifurcation. Intravascular imaging shows stent expansion, ostial coverage and how far the SB stent protrudes into the MV. Two further notes sit in his legend to the rewiring figure (Fig. 15.30), not in this step: a POT can be done if the proximal MV is much larger than the distal MV, and an MV dissection may need stenting by DK crush.",
            },
          ],
        },
        { kind: "tip", id: "pci-minicrush-rewire-proximal" },
        {
          kind: "p",
          text: "Ormiston's bench micro-CT study, which Brilakis cites for the two-step kiss, also measured the SB ostium after crush: the residual stenosis was 47% after a classic crush and 36% after a mini-crush, and stents with larger cells left less.",
        },
        { kind: "h", text: "Classic crush, as the Oxford handbook describes it" },
        {
          kind: "list",
          ordered: true,
          items: [
            "A two-stent strategy from the outset, for a reasonably sized SB that is already severely compromised and likely to be compromised further by MV treatment.",
            "Both stents are positioned at once, as if for a kissing inflation.",
            "The SB stent is deployed and its wire withdrawn.",
            "The MV stent is then deployed, flattening the proximal tail of the SB stent against the vessel wall.",
            "The SB is rewired and a kissing inflation performed. Reverse crush and mini-crush are listed as its variants.",
          ],
        },
        {
          kind: "check",
          stem: "In a mini-crush for an ostial diagonal lesion at 50°, the SB stent has been crushed and rewired through a proximal strut. When should the jailed diagonal wire come out?",
          options: [
            "Before rewiring, so that the new wire cannot become tangled with it",
            "After balloons are in both branches, because it helps them advance",
            "After the final assessment, so that access is kept to the end",
            "Never: it is left jailed permanently behind the struts",
          ],
          answer: 1,
          explanation:
            "Brilakis removes the jailed wire once balloons are positioned in both the SB and the MV, using it as an anchor that helps the balloons advance. It has to come out before kissing, so leaving it to the end is not an option, and a wire is never left behind. Taking it out before rewiring would lose the marker and the anchor.",
        },
        { kind: "h", text: "V-stenting (Medina 0,1,1)" },
        {
          kind: "p",
          text: "When the distal MV and the SB ostium are diseased but the proximal MV is not, two stents are put in side by side, each protruding 1–2 mm back from its own ostium (Brilakis). Oxford describes two non-overlapping stents deployed together, one in the distal MV and one in the proximal SB, and calls the overlapping version shotgun or kissing stents. It is simple: no rewiring, no separate kiss, and wires stay in both branches throughout. The price is a ridge of metal where the two stents meet, which later wires and devices can catch on. At least a 7 Fr guide is needed to deliver two drug-eluting stents together, and both branches are prepared as for any bifurcation. In the left main Brilakis counts Medina 0,1,1 as a true bifurcation and prefers a two-stent technique, especially DK crush, although a 7 or 8 Fr guide there does allow V-stenting (cp-left-main).",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Insert a stent into each branch", detail: "Each protrudes 1–2 mm back from its own ostium." },
            { title: "2. Deploy both at once", detail: "Simultaneous deployment acts as the kissing inflation." },
            { title: "3. Remove both stent balloons", detail: "Both wires remain, one in each branch." },
            { title: "4. Final assessment", detail: "Named without detail by Brilakis; the module suggests angiography in views that separate the branches." },
          ],
        },
        { kind: "h", text: "Simultaneous kissing stents: emergencies only" },
        {
          kind: "p",
          text: "SKS is the same move with stents that reach back to cover the whole bifurcation, so the two stents run side by side in the proximal MV and form a long neocarina. It is very fast and keeps wire access to both branches, which suits an emergency in which both must be stented and access to both kept; its long neocarina is why Brilakis keeps it to emergencies and bail-out. The long ridge of metal it leaves in the MV makes any later procedure there very hard, so it should never be used in a non-emergency case. For an iatrogenic left main dissection that involves the bifurcation, Oxford makes cardiac surgery the reference treatment in a stable patient, with two-stent PCI the alternative; in an unstable patient surgery should be discussed but is often not feasible in time, so two-stent PCI is offered promptly, with femoral access ready for circulatory support. Both wires (LAD and circumflex) must be in the true lumen, which IVUS confirms better than OCT because it needs no contrast injection that could extend the false lumen. When the patient is deteriorating rapidly, Oxford accepts SKS in extreme cases as a fast rescue, though it needs a big guide and leaves a long ridge of metal in the middle of the left main.",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Insert both stents", detail: "Together they cover the bifurcation completely, back into the proximal MV. At least a 7 Fr guide." },
            { title: "2. Deploy both at once", detail: "Simultaneous deployment with kissing inflation." },
            { title: "3. Remove both stent balloons", detail: "Both wires remain, one in each branch." },
            { title: "4. Final assessment", detail: "Named without detail by Brilakis; the module suggests angiography in views that separate the branches." },
          ],
        },
        { kind: "tip", id: "pci-vstent-sks-guide" },
        { kind: "tip", id: "pci-sks-emergency-only" },
        {
          kind: "pitfalls",
          items: [
            "Advancing the MV balloon after SB dilatation in reverse crush and finding it blocked by lifted struts.",
            "Rewiring a crushed stent through a distal strut in mini-crush or the first DK crush rewiring.",
            "Removing the jailed SB wire in mini-crush before the balloons are in place, and losing its anchoring.",
            "V-stenting a bifurcation with proximal MV disease, which leaves that disease untreated.",
            "Using SKS electively: later wires and devices struggle to pass its long ridge of metal.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask one question of any crush variant: where must the next wire enter? After a crush, a proximal strut, so the balloon presses the flattened metal back towards the carina. After a fresh stent across the SB, a distal strut, so the ostium is scaffolded. The reverse crush is the exception that tests the rule: its step 8 rewiring goes into the newly crushed SB stent, and the manual does not name the strut; if the result is in doubt, intravascular imaging can identify a wire that has passed behind the stent (16.2.13).",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "POT practice only (the bench cannot yet build the side-branch stent or the crush). In the distal left main case, deploy the stent into the LAD and then optimise the left main portion with a POT; this is the provisional result from which a reverse crush of the circumflex would begin.",
        },
        { kind: "video", id: "DqjwvrpAFJ4", note: "Brilakis: how to perform the reverse crush technique." },
        { kind: "video", id: "CX7GS19TTcQ", note: "Case 25 from the PCI Manual: reverse crush." },
        { kind: "video", id: "JAhMvyDGotg", note: "Elias Hanna: crush, DK crush and culotte." },
        {
          kind: "keypoints",
          items: [
            "Reverse (internal) crush is a bail-out: rewire and dilate the SB through the MV stent, MV balloon in at step 1 or step 3 (step 1 avoids lifted struts blocking it), SB stent protruding, deploy, crush with the SB wire jailed, rewire, kiss, POT.",
            "Mini-crush is for branch ostial lesions at under 70°: SB stent protruding just enough to cover both lips, crush, rewire through a proximal strut, balloons in, then pull the jailed wire, kiss.",
            "Classic crush (Oxford): both stents positioned together, SB stent deployed and its wire withdrawn, MV stent crushes the tail, rewire and kiss.",
            "V-stenting is for Medina 0,1,1 (in the left main Brilakis prefers two-stent techniques, especially DK crush, for true bifurcations, 0,1,1 included): two stents protruding 1–2 mm from each ostium, deployed together; at least 7 Fr.",
            "SKS is for emergencies only: quick, both wires kept, but a long neocarina; at least 7 Fr.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-bifurcation-two-stent-q1",
      stem: "Elective PCI: the LAD just beyond a large diagonal and the ostium of that diagonal are both severely narrowed; the LAD proximal to the diagonal is free of disease. A planned two-stent strategy is chosen. Which technique does Brilakis's algorithm offer for this pattern?",
      options: [
        "V-stenting, since this is Medina 0,1,1",
        "Simultaneous kissing stents, since both wires are kept",
        "Mini-crush, since only the side-branch ostium is diseased",
        "TAP, since the main vessel is stented before the branch",
      ],
      answer: 0,
      explanation:
        "Narrowing beyond the branch and at the SB ostium, with a healthy proximal MV, is Medina 0,1,1, and Brilakis's algorithm offers V-stenting for it, through a guide of at least 7 Fr. SKS shares the simultaneous deployment but is reserved for emergencies because of its long neocarina. Mini-crush is for an SB ostial lesion without distal MV disease, and TAP is a bail-out after provisional stenting.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q2",
      stem: "In DK crush, the SB stent has been deployed and checked. You will crush it with a non-compliant balloon sized to the proximal MV. What does the manual say about this balloon?",
      options: [
        "It should be centred on the carina so that it also post-dilates the distal main vessel",
        "It should not be advanced beyond the carina, because the distal MV may dissect",
        "It must be inflated with the SB wire still in place, to keep SB access",
        "It must be a compliant balloon so the crushed struts are not fractured",
      ],
      answer: 1,
      explanation:
        "A crush balloon sized to the proximal MV is effectively a POT balloon; past the carina it overstretches the smaller distal MV and may dissect it. The alternative Brilakis gives is a balloon sized to the distal MV followed by a POT. The SB wire can be jailed during the crush but most operators remove it first, so it is not a requirement.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q3",
      stem: "Why is the SB rewired through a proximal strut of the crushed stent in the first DK crush rewiring, when a distal strut is chosen almost everywhere else in bifurcation PCI?",
      options: [
        "A proximal strut lies closer to the guide, so it is reached more quickly with less wire manipulation",
        "The SB balloon then pushes the crushed metal towards the carina instead of away from it",
        "A proximal strut is the only cell the crush leaves wide enough for a balloon to pass",
        "Distal struts of a crushed stent are fused together and cannot be crossed at all",
      ],
      answer: 1,
      explanation:
        "Brilakis explains it in his mini-crush section, which he likens to DK crush: a wire through a proximal cell lets the SB balloon press the crushed struts back towards the carina, whereas a distal entry risks displacing the crushed stent away from the carina. Speed is not the reason, and a proximal cell is not the only one a balloon can pass: for a balloon that will not advance, Brilakis offers a very small balloon, an anchor, a specialised balloon or a microcatheter track, not a change of cell. The second rewiring, through the MV stent, returns to the distal-strut rule.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q4",
      stem: "How is the first kissing inflation of DK crush performed, according to Brilakis?",
      options: [
        "Both balloons together at 20 atm, then the SB balloon alone at 10–12 atm",
        "The SB balloon alone at 20 atm, then both balloons together at 10–12 atm",
        "The MV balloon alone at 20 atm, then both balloons together at 20 atm",
        "Both balloons together at nominal pressure, held for one minute",
      ],
      answer: 1,
      explanation:
        "The two-step kiss is a high-pressure (20 atm) SB inflation followed by both balloons at 10–12 atm. On bench micro-CT a two-step kiss left 33% of the SB ostium covered by metal against 53% after a one-step kiss. The second kiss is also two-step, with each balloon at high pressure in turn and then both at 12–14 atm.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "ormiston-crush-microct-2008"],
    },
    {
      id: "cp-bifurcation-two-stent-q5",
      stem: "A TAP is being performed after provisional LAD stenting. The diagonal stent protrudes 1–2 mm into the LAD and has been deployed; the kissing balloons are inflated. Which sequence finishes the technique correctly?",
      options: [
        "Deflate the diagonal balloon first, then POT with the distal marker at the original carina",
        "Deflate both together, then POT with the distal marker across the neocarina",
        "Deflate the LAD balloon first, then POT with the distal marker just proximal to the neocarina",
        "Deflate the LAD balloon first, then skip the final POT because the kissing inflation has already shaped it",
      ],
      answer: 2,
      explanation:
        "Deflating the MV (LAD) balloon first stops it pushing the protruding struts into the diagonal ostium. The final POT then stops just short of the neocarina so the protruding struts are not crushed. A POT up to the original carina would reach the struts, and Brilakis lists the final POT as a TAP step.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q6",
      stem: "For which bifurcation does Brilakis say the culotte technique is best suited?",
      options: [
        "One with a side branch and distal main vessel of similar size",
        "One with a side branch much smaller than the main vessel at 90°",
        "Medina 0,1,1 with a disease-free proximal main vessel",
        "Any bifurcation needing emergency stenting with both wires kept",
      ],
      answer: 0,
      explanation:
        "Culotte puts both stents back into the proximal MV, which suits branches of similar diameter. A small SB at a right angle is T-stenting or TAP territory, Medina 0,1,1 suggests V-stenting, and emergency stenting with both wires kept is the role of simultaneous kissing stents.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q7",
      stem: "Which statement about the randomised trials of two-stent techniques is correct?",
      options: [
        "DKCRUSH-III: culotte had fewer major events than DK crush in distal left main lesions",
        "BBK II: culotte gave less angiographic restenosis than TAP when the side branch needed a stent",
        "EBC TWO: planned culotte reduced death and MI compared with provisional T-stenting",
        "EBC MAIN: planned dual stenting was clearly superior to stepwise provisional stenting in the left main",
      ],
      answer: 1,
      explanation:
        "BBK II found binary restenosis of 6.5% after culotte against 17% after TAP. DKCRUSH-III went the other way (more events with culotte, 16.3% vs 6.2%), EBC TWO showed no difference between provisional and culotte, and EBC MAIN found no significant difference in its primary end point at 1 or 3 years, with numerically fewer events in the provisional group and, at 3 years, less target lesion revascularisation with provisional. The protocol's dual-stent options were T, TAP or culotte; DK crush was not among them.",
      difficulty: 3,
      refs: ["ferenc-bbk2-2016", "chen-dkcrush3-2013", "hildick-smith-ebc-two-2016", "ebc-main-2021", "arunothayaraj-ebc-main-3y-2025", "arunothayaraj-ebc-main-technique-2023"],
    },
    {
      id: "cp-bifurcation-two-stent-q8",
      stem: "Which two-stent techniques does Brilakis say need a guide catheter of at least 7 Fr?",
      options: [
        "DK crush and culotte, because of the number of balloons that must pass through the guide",
        "V-stenting and simultaneous kissing stents, because two stents travel together",
        "T-stenting and TAP, because a stent and a balloon sit side by side",
        "Every two-stent technique, without exception",
      ],
      answer: 1,
      explanation:
        "Most bifurcation techniques can be done through a 6 Fr guide; V-stenting and SKS need at least 7 Fr because two stents are delivered at once. A larger guide still makes passing two devices easier and adds support in any technique, and for left main bifurcation PCI Brilakis prefers 7 or 8 Fr, but it is not an absolute requirement for DK crush, culotte, T or TAP.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "cp-bifurcation-two-stent-q9",
      stem: "After provisional LAD stenting, the diagonal occludes. A small balloon over the jailed wire restores flow, but repeated attempts to rewire the diagonal through the LAD stent fail. What second option does Brilakis give?",
      options: [
        "Simultaneous kissing stents from the left main into both branches",
        "An inverted DK crush, treating the diagonal as the main vessel",
        "A TAP stent delivered over the jailed wire",
        "A culotte with the first stent over the jailed wire",
      ],
      answer: 1,
      explanation:
        "Option 1 is rewiring through the struts, ideally with a dual lumen microcatheter; option 2 is to convert to an inverted DK crush, in which the SB plays the MV and the MV plays the SB. A stent over the jailed wire would be deployed outside the LAD stent, behind its struts, and SKS is a technique for emergencies.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q10",
      stem: "In a mini-crush for an ostial side-branch lesion, why does Brilakis leave the jailed side-branch wire in until balloons are in both branches?",
      options: [
        "It acts as an anchor and helps the balloons advance",
        "It keeps the crushed stent from moving during kissing",
        "It is needed for the kissing inflation itself",
        "It allows a pressure reading in the side branch",
      ],
      answer: 0,
      explanation:
        "Brilakis notes that the jailed wire acts as an anchor that facilitates balloon delivery, and removes it once the SB and MV balloons are in place, before the kiss. It does not hold the crushed stent, is not used for the kiss, and is not a pressure wire.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q11",
      stem: "You want to keep the side-branch wire in place during rotational atherectomy of a calcified distal main vessel. Which arrangement does Brilakis describe for a 1.25 mm burr?",
      options: [
        "A 6 Fr guide with a 5 Fr guide extension placed over both wires",
        "A 7 Fr guide with a 6 Fr guide extension placed over the atherectomy wire only",
        "An 8 Fr guide with a 7 Fr guide extension placed over the side-branch wire instead",
        "A 7 Fr guide with no extension and a polymer-jacketed side-branch wire",
      ],
      answer: 1,
      explanation:
        "The extension runs on the atherectomy wire alone and so keeps the burr apart from the second wire. A 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or crown; an 8 Fr guide with a 7 Fr extension takes a 1.5 mm burr. Placing the extension over the side-branch wire would leave the burr beside the very wire it should be kept away from.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cp-bifurcation-two-stent-q12",
      stem: "Why does Brilakis restrict simultaneous kissing stents to emergencies and bail-out?",
      options: [
        "Its long neocarina makes any later procedure in the vessel very hard",
        "It cannot be performed safely through any guide catheter smaller than 8 Fr",
        "It requires two complete rewirings of the side branch",
        "It leaves the side-branch ostium without stent coverage",
      ],
      answer: 0,
      explanation:
        "SKS is fast and keeps both wires, but the side-by-side stents leave a long metal ridge in the proximal MV that later wires and devices struggle to pass. It needs at least 7 Fr (not 8 Fr), involves no rewiring, and covers the bifurcation completely.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "POT practice only. Distal left main into LAD: size the stent to the LAD, then perform the POT that DK crush, culotte, TAP and reverse crush all use, with a balloon 1:1 to the left main and its distal edge at the carina, and confirm expansion and apposition on IVUS.",
    },
  ],
  caseIds: ["cp-bifurcation-two-stent-case-lm-dk-crush", "cp-bifurcation-two-stent-case-diagonal-tap"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cp-bifurcation-two-stent-case-lm-dk-crush",
    title: "Planned DK crush of a distal left main bifurcation",
    trackId: "complex-pci",
    stage: 5,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 16.1, 16.2 (DK crush), 17; Oxford Handbook ch 8: Bifurcation PCI techniques" },
    summary:
      "A planned DK crush of a true distal left main bifurcation, taken step by step from strategy and set-up to the final POT, with the classic mistakes at each stage.",
    presentation:
      "A 66-year-old man with stable angina despite two anti-anginal drugs. Distal left main disease with a SYNTAX score of 18. The heart team judged PCI an appropriate alternative to CABG for this low-complexity disease; after discussion he chose PCI. LV function is normal and the RCA has only mild disease. Bleeding risk is low.",
    findings: [
      "Distal left main stenosis extending into the ostial LAD and the ostial circumflex: Medina 1,1,1.",
      "Circumflex: 2.75 mm, with an 80% stenosis running about 12 mm from its ostium; LAD-circumflex angle about 60°.",
      "IVUS: left main 4.0 mm, proximal LAD 3.0 mm; moderate calcification without a calcium arc that needs atherectomy.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which strategy do you choose?",
        options: [
          {
            text: "Planned DK crush, stenting the circumflex first",
            best: true,
            feedback:
              "This is a true (Medina 1,1,1) left main bifurcation, for which Brilakis prefers a planned two-stent technique, especially DK crush, which beat both culotte (DKCRUSH-III) and provisional stenting (DKCRUSH-V) in the left main. The angle under 70° also points to DK crush in his algorithm. An 80% circumflex lesion 12 mm long meets the left main major criterion of DEFINITION (stenosis of 70% or more over 10 mm or more), but that alone does not make the lesion complex by DEFINITION, which needs one major and at least two minor criteria (cx-bif-two-stent); the moderate calcification here is only one. The case for DK crush therefore rests on DKCRUSH-V and on Brilakis's preference for true left main bifurcations, not on DEFINITION II. Current European consensus agrees in this case: the circumflex has a stenosis of 70% or more and a lesion length of 10 mm or more, which the 2026 EAPCI/EBC consensus proposes as markers of circumflex complexity and risk of compromise, and it meets the Bif-ARC complex-bifurcation definition (true bifurcation with SB disease of 10 mm or more); where that risk is judged high, the consensus accepts upfront circumflex treatment such as DK crush.",
          },
          {
            text: "Provisional stenting from the left main into the LAD, with a circumflex stent only if needed",
            acceptable: true,
            feedback:
              "Defensible: EBC MAIN found no significant difference in its primary end point between stepwise provisional and planned dual stenting in true left main bifurcations, and provisional is the default for most left main bifurcations. But this is a true (Medina 1,1,1) left main bifurcation, for which Brilakis prefers a planned two-stent technique, especially DK crush. In the 3-year EBC MAIN report provisional did better when the side vessel was under 3.25 mm or its lesion under 10 mm long; this circumflex is 2.75 mm but its disease runs 12 mm, so the trial does not settle the choice.",
          },
          {
            text: "V-stenting into the LAD and circumflex",
            next: "c-v-stent",
            feedback: "V-stenting is a Medina 0,1,1 technique; here the left main itself is diseased.",
            stateDelta: { stability: -10, flags: ["v-stent-misused"] },
          },
          {
            text: "Simultaneous kissing stents, for speed",
            next: "c-sks",
            feedback: "SKS is for emergencies and bail-out only. It would cover the bifurcation, but it leaves a long ridge of metal in the left main that later wires and devices struggle to pass.",
            stateDelta: { stability: -10, flags: ["sks-elective"] },
          },
        ],
      },
      {
        id: "c-sks",
        kind: "consequence",
        prompt: "Your attending stops you: this is an elective case, and SKS would leave two stents side by side in the left main. What do you do?",
        options: [
          {
            text: "Change the plan to a DK crush, with the left main covered by the MV stent",
            best: true,
            feedback: "Right. Speed is the reason to use SKS in an emergency; in an elective case its long neocarina in the left main is not justified.",
          },
          {
            text: "Proceed with SKS; it is the quickest technique and keeps both wires",
            feedback: "Brilakis rules SKS out in non-emergency bifurcation PCI: the long neocarina would make any later left main procedure very hard.",
            stateDelta: { stability: -15, flags: ["sks-elective"] },
          },
        ],
      },
      {
        id: "c-v-stent",
        kind: "consequence",
        prompt: "Your attending stops you: the left main body is diseased, so this is not Medina 0,1,1. What do you do?",
        options: [
          {
            text: "Change the plan to a DK crush, with the left main covered by the MV stent",
            best: true,
            feedback: "Right. The proximal MV disease must be covered, and V-stenting starts both stents at the bifurcation, leaving the left main uncovered.",
          },
          {
            text: "Proceed anyway; any two-stent technique gives the same result",
            feedback: "It does not: V-stenting leaves the left main disease untreated.",
            stateDelta: { stability: -15, flags: ["v-stent-misused"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you set up the case?",
        options: [
          {
            text: "7 Fr EBU guide, workhorse wires in both the LAD and circumflex, organised on a towel, and balloon preparation of both branches",
            best: true,
            feedback:
              "A supportive guide (EBU for the left main), a larger lumen that eases passing two devices, both branches wired with workhorse wires and kept apart, and routine preparation of the SB as well as the MV in a planned two-stent case.",
          },
          {
            text: "6 Fr JL4, a wire in the LAD only, predilatation of the LAD only",
            next: "c-setup",
            feedback: "A non-supportive guide, no circumflex wire, and no SB preparation: the opposite of the two-stent set-up.",
            stateDelta: { stability: -10, flags: ["poor-setup"] },
          },
          {
            text: "6 Fr EBU guide, workhorse wires in both branches kept apart, and balloon preparation of both the LAD and the circumflex",
            acceptable: true,
            feedback:
              "Workable: DK crush can be done through 6 Fr. For a left main bifurcation, though, Brilakis prefers a 7 or 8 Fr guide for its support and for the ease of passing two devices.",
          },
          {
            text: "7 Fr EBU guide, both branches wired, but the circumflex left unprepared to avoid dissecting it",
            feedback:
              "Leaving the SB alone is the provisional rule. When two stents are planned, Brilakis prepares the SB as well as the MV routinely.",
            stateDelta: { stability: -5, flags: ["sb-unprepared"] },
          },
        ],
      },
      {
        id: "c-setup",
        kind: "consequence",
        prompt: "Predilating the LAD alone has shifted plaque into the circumflex ostium, and flow down the circumflex has slowed. The circumflex is not wired.",
        info: "Circumflex TIMI 2, patient has mild chest pain, BP 128/76 mmHg.",
        options: [
          {
            text: "Wire the circumflex now with a workhorse wire, then continue with the DK crush plan",
            best: true,
            feedback: "Wire access to an important SB comes first. This is why both branches are wired before any preparation.",
          },
          {
            text: "Stent the left main into the LAD straight away to seal the plaque",
            feedback: "An MV stent without a circumflex wire risks losing the circumflex altogether.",
            stateDelta: { stability: -20, flags: ["sb-lost"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "A 3.0 mm balloon is parked in the LAD across the circumflex origin. How do you place and deploy the circumflex stent?",
        options: [
          {
            text: "Protrude 2–3 mm into the left main, deploy at 10–12 atm, then pull the balloon back slightly and reinflate at 20 atm",
            best: true,
            feedback: "The protrusion covers the ostium, the moderate deployment pressure protects the distal edge, and the pulled-back high-pressure inflation fully expands the stent.",
          },
          {
            text: "Land it flush with the ostium and deploy at 18 atm",
            next: "c-edge",
            feedback: "No protrusion risks an uncovered ostium, and high deployment pressure risks a distal edge dissection.",
            stateDelta: { stability: -10, flags: ["sb-edge-dissection"] },
          },
          {
            text: "Protrude 6 mm into the left main to be safe, deploy at 10–12 atm",
            acceptable: true,
            feedback: "Brilakis accepts longer protrusion (shorter is the danger), but 2–3 mm is the target. The module's point, not his: a longer protrusion means more SB stent to crush in the left main.",
          },
        ],
      },
      {
        id: "c-edge",
        kind: "consequence",
        prompt: "The SB angiogram shows a dissection at the distal edge of the circumflex stent.",
        info: "Circumflex TIMI 3, linear dissection about 5 mm long beyond the stent.",
        options: [
          {
            text: "Treat it now with further circumflex PCI, before crushing",
            best: true,
            feedback: "Step 5 of DK crush is exactly this: check the SB and fix underexpansion or a distal dissection before the crush, because a poor SB result can make later rewiring fail.",
          },
          {
            text: "Crush first and deal with it at the end",
            feedback: "After the crush, getting equipment back into the circumflex is far harder, and rewiring may fail.",
            stateDelta: { stability: -15, flags: ["sb-edge-dissection"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The circumflex result is good. You remove the circumflex wire and crush the protruding stent with the 3.0 mm balloon parked in the LAD. What comes before the rewiring?",
        options: [
          {
            text: "A POT of the crushed segment with a 4.0 mm non-compliant balloon kept proximal to the carina",
            best: true,
            feedback: "The crush balloon was sized to the distal MV (the LAD), so Brilakis follows the crush with a POT. A 4.0 mm balloon matches the left main, and keeping it proximal to the carina protects the 3.0 mm LAD from dissection.",
          },
          {
            text: "Nothing: rewire the circumflex straight away, since the crush is complete",
            feedback: "A crush with a balloon sized to the distal MV is followed by a POT in Brilakis's sequence; without it the crushed segment in the 4.0 mm left main is left unoptimised before the rewiring.",
            stateDelta: { stability: -5, flags: ["no-crush-pot"] },
          },
          {
            text: "A POT with the 4.0 mm balloon centred on the carina, to treat both segments at once",
            feedback: "A balloon sized to the left main that passes the carina may dissect the 3.0 mm LAD; it must stay proximal to the carina.",
            stateDelta: { stability: -10, flags: ["lad-dissection"] },
          },
        ],
      },
      {
        id: "s4b",
        prompt: "After the POT you rewire the circumflex through the crushed stent. Through which strut?",
        options: [
          {
            text: "A proximal strut of the crushed stent",
            best: true,
            feedback: "So the SB balloon will push the crushed struts towards the carina. The distal-strut rule returns for the second rewiring, through the MV stent.",
          },
          {
            text: "A distal strut, as in provisional stenting",
            feedback: "The distal-strut rule applies after MV stenting. Through the crushed stent, a distal entry risks displacing the crushed metal away from the carina. The manuals give no specific remedy once that has happened, which is why the first rewiring aims for a proximal strut.",
            stateDelta: { stability: -5, flags: ["first-rewire-distal"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "A 2.75 mm balloon will not advance into the circumflex through the crushed struts.",
        options: [
          {
            text: "Try a 1.0 mm balloon, then an anchor balloon in the LAD if needed",
            best: true,
            feedback: "Brilakis's sequence: a very small balloon, an anchor in the MV, a specialised balloon, a microcatheter track, then rewiring.",
          },
          {
            text: "Push hard while advancing the guide",
            next: "c-push",
            feedback: "Force risks guide-induced injury of the left main and loss of wire position.",
            stateDelta: { stability: -15, flags: ["guide-trauma"] },
          },
          {
            text: "Skip the first kiss and stent the LAD",
            feedback: "Without the first kiss it is no longer a DK crush: the extra kiss before the MV stent is the step that defines the technique.",
            stateDelta: { stability: -10, flags: ["no-first-kiss"] },
          },
        ],
      },
      {
        id: "c-push",
        kind: "consequence",
        prompt: "The guide has jumped deep into the left main and the pressure trace has damped.",
        info: "Pressure ventricularised, patient complains of chest pain, BP 98/60 mmHg.",
        options: [
          {
            text: "Pull the guide back to a coaxial position at once, check for a dissection, then use a small balloon",
            best: true,
            feedback: "Restore flow and check the left main first; then return to the small-balloon option.",
          },
          {
            text: "Inject contrast forcefully to see what has happened",
            feedback: "Forceful injection through a deep, damped guide can propagate a dissection.",
            stateDelta: { stability: -20, flags: ["guide-trauma"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The first two-step kiss is done. The LAD stent (3.0 mm) is deployed from the LAD into the left main; you chose a platform whose post-dilatation limit reaches at least 4.0 mm, having checked it before the case. How do you perform the POT?",
        options: [
          {
            text: "4.0 mm non-compliant balloon with its distal edge at the carina",
            best: true,
            feedback: "Sized 1:1 to the proximal MV (the left main), positioned at the carina: proximal expansion and apposition, and less chance of the next wire passing behind the stent. Brilakis asks that a stent taken from the left main into a branch can be expanded to the left main diameter, which is why its post-dilatation limit was checked first.",
          },
          {
            text: "4.0 mm balloon centred across the carina into the LAD",
            next: "c-pot",
            feedback: "Too distal for a POT. Brilakis warns that a POT balloon placed beyond the carina raises the risk of compromising the side branch, here the circumflex ostium; and a balloon sized to the 4.0 mm left main is too big for the 3.0 mm LAD segment it now reaches.",
            stateDelta: { stability: -10, flags: ["pot-too-distal"] },
          },
          {
            text: "Use the 3.0 mm stent balloon at high pressure in the left main",
            feedback: "Undersized for a 4.0 mm left main: the proximal stent stays malapposed and the next wire may pass behind it.",
            stateDelta: { stability: -5, flags: ["malapposition"] },
          },
        ],
      },
      {
        id: "c-pot",
        kind: "consequence",
        prompt: "Angiography shows the carina has shifted: the circumflex ostium now looks narrower than after the first kiss.",
        info: "Circumflex TIMI 3, no chest pain, BP 126/74 mmHg.",
        options: [
          {
            text: "Carry on with the planned steps: rewire the circumflex through a distal strut of the LAD stent, two-step kiss, then a final POT with its distal edge at the carina",
            best: true,
            feedback: "The second rewiring and kiss (steps 14 and 15) are about to reopen the circumflex ostium anyway, and the final POT is then placed correctly, at the carina and no further.",
          },
          {
            text: "Put a further stent into the circumflex ostium now",
            feedback: "Adding metal at the ostium before the planned rewiring and kiss have been done treats a problem the next steps of DK crush are designed to correct.",
            stateDelta: { stability: -10, flags: ["extra-cx-stent"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "How do you finish?",
        options: [
          {
            text: "Rewire the circumflex through a distal strut of the LAD stent, remove the jailed wire, two-step kiss ending at 12–14 atm, final POT at the carina, then angiography and IVUS",
            best: true,
            feedback: "Steps 14 to 17 exactly; in the left main the final IVUS runs from both the LAD and the circumflex. After the guideline-default course of dual antiplatelet therapy, Brilakis would consider prolonging it given his low bleeding risk.",
          },
          {
            text: "Final POT only; the second kiss is optional",
            feedback: "The second kiss is part of DK crush; without it the circumflex ostium is left behind the LAD stent struts.",
            stateDelta: { stability: -10, flags: ["no-final-kiss"] },
          },
          {
            text: "Rewire through a proximal strut again, as in the first rewiring, then kiss",
            feedback: "Through the MV stent, the distal-strut rule applies; a proximal entry leaves struts floating across the circumflex ostium.",
            stateDelta: { stability: -5, flags: ["wrong-strut"] },
          },
        ],
      },
    ],
    outcome:
      "Both branches are widely patent with full coverage of the circumflex ostium. IVUS confirms good expansion and apposition in the left main, LAD and circumflex. He is discharged the next day.",
    outcomeVariants: [
      { flag: "v-stent-misused", text: "Changing the plan cost time; the left main disease would have been left uncovered by V-stenting." },
      { flag: "sks-elective", text: "Changing the plan cost time; SKS would have left a long neocarina in the left main in an elective case." },
      { flag: "pot-too-distal", text: "The POT placed beyond the carina narrowed the circumflex ostium until the second kiss reopened it." },
      { flag: "extra-cx-stent", text: "An unplanned extra stent added metal at the circumflex ostium." },
      { flag: "sb-lost", text: "The circumflex closed when the LAD was stented without a circumflex wire and took a long time to recover; he had a periprocedural infarct." },
      { flag: "sb-edge-dissection", text: "The circumflex edge dissection made later equipment delivery into the circumflex difficult." },
      { flag: "wrong-strut", text: "IVUS showed a less complete scaffold of the circumflex ostium than intended." },
      { flag: "first-rewire-distal", text: "The first rewiring went through a distal strut, which risked pushing the crushed circumflex stent away from the carina." },
      { flag: "no-crush-pot", text: "The crushed segment in the left main was not optimised before the first rewiring." },
      { flag: "sb-unprepared", text: "The circumflex had not been prepared, contrary to the planned two-stent set-up." },
      { flag: "guide-trauma", text: "A guide-induced left main injury needed additional stenting." },
      { flag: "no-first-kiss", text: "The first kiss was skipped, so the procedure ended as a crush rather than a DK crush." },
      { flag: "lad-dissection", text: "An LAD dissection from the left main-sized balloon taken past the carina needed an extra stent." },
      { flag: "malapposition", text: "IVUS later showed proximal malapposition in the left main that needed a further POT." },
      { flag: "no-final-kiss", text: "The circumflex ostium was left partly covered by LAD stent struts." },
      { flag: "poor-setup", text: "The weak set-up added time and risk." },
    ],
    learningPoints: [
      "True (Medina 1,1,1 or 0,1,1) left main bifurcation: Brilakis plans a two-stent technique, especially DK crush. Current European Bifurcation Club guidance keeps stepwise provisional as the default and reserves upfront circumflex treatment such as DK crush for a circumflex that is hard to reach or likely to be lost (EBC MAIN; 2026 EAPCI/EBC consensus); this circumflex (80%, 12 mm) meets the consensus markers for that risk.",
      "Meeting the left main major DEFINITION criterion alone does not make a bifurcation complex by DEFINITION: that needs one major and at least two minor criteria.",
      "Supportive 7 or 8 Fr guide for the left main, workhorse wires in both branches kept organised, and preparation of both branches.",
      "A crush with a balloon sized to the distal MV is followed by a POT kept proximal to the carina.",
      "SB stent 2–3 mm into the MV; deploy at 10–12 atm, then the pulled-back balloon at 20 atm.",
      "Angiogram of the SB before the crush; fix a dissection or underexpansion first.",
      "First rewiring through a proximal strut of the crushed stent, second through a distal strut of the MV stent.",
      "Balloon will not enter the SB: small balloon, MV anchor, specialised balloon, microcatheter, rewire; never force.",
      "POT with a balloon matched to the proximal MV and its distal edge level with the carina, on a stent whose post-dilatation limit reaches the left main diameter; two-step kisses; final POT; IVUS of both branches.",
    ],
    refs: [...BOOKS, "dkcrush5-2017", "chen-dkcrush3-2013", "ebc-main-2021", "arunothayaraj-ebc-main-3y-2025", "esc-ccs-2024", "johnson-eapci-lm-imaging-2026", "definition-2014"],
  },
  {
    id: "cp-bifurcation-two-stent-case-diagonal-tap",
    title: "Provisional LAD stenting that needs a bail-out diagonal stent",
    trackId: "complex-pci",
    stage: 5,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 16.1, 16.2 (provisional stenting, T-stenting, TAP, reverse crush, culotte); Oxford Handbook ch 8: Bifurcation PCI techniques" },
    summary:
      "Provisional stenting of an LAD/diagonal bifurcation compromises a wide-angle diagonal. The learner chooses and performs the bail-out.",
    presentation:
      "A 59-year-old woman with exertional angina and a positive stress test in the anterior territory. Bleeding risk is low.",
    findings: [
      "Proximal LAD stenosis at the origin of a large first diagonal: Medina 1,1,0.",
      "Proximal LAD 3.5 mm, LAD beyond the diagonal 3.0 mm, diagonal 2.5 mm leaving at about 80°.",
      "Both branches wired with workhorse wires; provisional strategy planned with the diagonal wire jailed.",
    ],
    steps: [
      {
        id: "s1",
        prompt:
          "After a 3.0 mm LAD stent and POT with a 3.5 mm balloon, the diagonal has TIMI 1 flow and a 90% ostial narrowing. She has chest pain and anterior ST depression. What next?",
        info: "BP 132/80 mmHg, heart rate 78/min.",
        options: [
          {
            text: "Rewire the diagonal through a distal strut of the LAD stent with a new wire, keeping the jailed wire as a marker",
            best: true,
            feedback: "A compromised but open SB: rewire through a distal strut, then remove the jailed wire, kiss and re-POT (cp-bifurcation-provisional).",
          },
          {
            text: "Deliver a diagonal stent over the jailed wire",
            next: "c-substent",
            feedback: "The jailed wire runs outside the LAD stent; a stent over it would be deployed behind the LAD stent struts.",
            stateDelta: { stability: -20, flags: ["substent"] },
          },
          {
            text: "Accept the result: the LAD looks excellent",
            feedback: "An important SB with TIMI 1 flow and ischaemia is compromised; Brilakis's threshold for action is TIMI flow under 3.",
            stateDelta: { stability: -15, flags: ["sb-ignored"] },
          },
        ],
      },
      {
        id: "c-substent",
        kind: "consequence",
        prompt: "Your attending stops the stent before deployment. What is the correct path?",
        options: [
          {
            text: "Withdraw the stent, rewire through the LAD stent struts, and confirm a balloon passes before removing the jailed wire",
            best: true,
            feedback: "Passing a low-profile balloon into the SB confirms the new wire went through the stent and not underneath it.",
          },
          {
            text: "Deploy it anyway at low pressure",
            feedback: "A stent deployed over the jailed wire would sit behind the LAD stent struts and compress them. This is the module's point: the manuals describe only how to avoid it, by rewiring through the struts and passing a balloon to confirm the route.",
            stateDelta: { stability: -25, flags: ["substent"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "After rewiring, kissing and re-POT, the diagonal has TIMI 2 flow, a 75% ostial stenosis and an NHLBI type C dissection. Which bail-out do you choose?",
        options: [
          {
            text: "TAP",
            best: true,
            feedback: "A smaller diagonal at about 80°: for a bail-out at 70°–90°, Brilakis's algorithm gives TAP, which needs no rewiring once the SB stent is in. The angle is what decides it here.",
          },
          {
            text: "Culotte",
            acceptable: true,
            feedback: "A recognised bail-out, but in Brilakis's algorithm it belongs to angles under 70°, and this diagonal leaves at 80°. Culotte also suits an SB and distal MV of similar size, whereas this diagonal is the smaller branch.",
          },
          {
            text: "Simultaneous kissing stents",
            feedback: "SKS is a technique for emergencies, it is not among the side-branch stenting options Brilakis lists after provisional stenting, and later wires and devices struggle to pass the long ridge of metal it leaves.",
            stateDelta: { stability: -10, flags: ["wrong-technique"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "A 2.5 mm stent is in the diagonal and a balloon is in the LAD stent across the diagonal take-off. Where do you set the diagonal stent?",
        options: [
          {
            text: "Protruding 1–2 mm into the LAD",
            best: true,
            feedback: "Brilakis's TAP step 3: the stent juts only slightly, by 1–2 mm, into the LAD. The module's reading: enough to cover the ostium while keeping the neocarina, the technique's drawback, short.",
          },
          {
            text: "Flush with the ostium, no protrusion",
            next: "c-gap",
            feedback: "TAP calls for minimal protrusion, 1–2 mm into the LAD. A stent that stops short of protruding risks poor coverage of the ostium and a further stent (Brilakis 16.2.10.2–3).",
            stateDelta: { stability: -5, flags: ["flush-landing"] },
          },
          {
            text: "Protruding 5 mm into the LAD",
            feedback: "That is closer to a crush than a TAP; the long neocarina may obstruct later equipment in the LAD.",
            stateDelta: { stability: -5, flags: ["long-neocarina"] },
          },
        ],
      },
      {
        id: "c-gap",
        kind: "consequence",
        prompt: "Before deployment, enhanced stent visualisation shows the proximal edge of the diagonal stent sitting short of the LAD wall, so part of the diagonal ostium would be left bare.",
        options: [
          {
            text: "Pull the stent back until it protrudes 1–2 mm into the LAD, confirm ostial coverage on enhanced stent visualisation, then deploy",
            best: true,
            feedback: "The stent is still undeployed and travels on the diagonal wire, which stays in place, so it only needs repositioning to the 1–2 mm TAP protrusion.",
          },
          {
            text: "Deploy it where it is and rely on the kissing inflation to close the gap",
            feedback: "A kiss cannot move a stent edge. Brilakis warns that a stent stopping short of the ostium can leave part of it unscaffolded, so that a further stent is needed.",
            stateDelta: { stability: -10, flags: ["ostial-gap"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The diagonal stent is deployed and its balloon pulled back slightly; kissing is under way. How do you deflate?",
        options: [
          {
            text: "LAD balloon first, then the diagonal balloon",
            best: true,
            feedback: "Deflating the MV balloon first stops it pressing the protruding struts into the diagonal ostium.",
          },
          {
            text: "Diagonal balloon first, then the LAD balloon",
            feedback: "The still-inflated LAD balloon now crushes the protruding struts into the diagonal ostium.",
            stateDelta: { stability: -10, flags: ["struts-crushed"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Where do you put the final POT balloon?",
        options: [
          {
            text: "Distal marker just proximal to the neocarina",
            best: true,
            feedback: "This optimises the proximal LAD without crushing the protruding diagonal struts.",
          },
          {
            text: "Distal marker at the original carina, as for any POT",
            next: "c-neocarina",
            feedback: "In TAP the original carina lies beyond the neocarina; a balloon there flattens the protruding struts.",
            stateDelta: { stability: -10, flags: ["struts-crushed"] },
          },
        ],
      },
      {
        id: "c-neocarina",
        kind: "consequence",
        prompt: "Imaging shows the protruding struts have been pushed into the diagonal ostium.",
        options: [
          {
            text: "With the diagonal wire still in place (rewire only if it was removed), kiss again with the LAD balloon deflated first, then re-POT short of the neocarina, and confirm with imaging",
            best: true,
            feedback: "The manuals give no specific remedy once the protruding struts have been crushed; this is the module's suggestion. A repeat kiss (MV balloon deflated first) and a POT that stops short of the neocarina is a reasonable step, with imaging to confirm the ostium.",
          },
          {
            text: "Finish the case; the flow looks normal",
            feedback: "Struts pushed across the diagonal ostium leave it narrowed and harder to re-enter later.",
            stateDelta: { stability: -10, flags: ["struts-crushed"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "How do you complete the procedure?",
        options: [
          {
            text: "Final assessment in views that separate the branches and intravascular imaging, with enhanced stent visualisation to confirm ostial coverage; consider prolonging antiplatelet therapy",
            best: true,
            feedback: "Confirm coverage and expansion. After the guideline-default course of dual antiplatelet therapy, Brilakis would consider prolonging it when bleeding risk is low, because bifurcation stenting carries a higher stent thrombosis risk.",
          },
          {
            text: "One view of the LAD, then finish",
            feedback: "A single view can hide an uncovered ostium or a residual dissection.",
            stateDelta: { stability: -5, flags: ["single-view"] },
          },
        ],
      },
    ],
    outcome: "Both branches have TIMI 3 flow, the diagonal ostium is fully covered and the neocarina is short. Her pain has resolved.",
    outcomeVariants: [
      { flag: "substent", text: "The near-deployment of a stent behind the LAD struts is reported as a near miss." },
      { flag: "sb-ignored", text: "She developed a periprocedural infarct in the diagonal territory." },
      { flag: "wrong-technique", text: "The choice of technique added metal and complexity without benefit." },
      { flag: "ostial-gap", text: "A second short stent was needed to cover the diagonal ostium." },
      { flag: "flush-landing", text: "The flush landing cost time: the diagonal stent had to be repositioned before deployment." },
      { flag: "long-neocarina", text: "The long neocarina will make any future LAD intervention harder." },
      { flag: "struts-crushed", text: "Struts were pushed into the diagonal ostium; a repeat kiss was tried to reopen it, a step the manuals do not describe." },
      { flag: "single-view", text: "A second view at follow-up angiography showed a residual narrowing that could have been treated at the time." },
    ],
    learningPoints: [
      "A compromised SB is rewired through a distal strut first; never stent over the jailed wire.",
      "After rewiring, kissing and re-POT, a persisting problem in an SB leaving at 70°–90° calls for TAP.",
      "TAP: SB stent protruding 1–2 mm, MV balloon across the take-off, deploy, pull the SB balloon back, kiss with the MV balloon deflated first.",
      "The final POT stops just proximal to the neocarina.",
      "Confirm ostial coverage with imaging or enhanced stent visualisation; consider prolonging dual antiplatelet therapy beyond the default when bleeding risk is low.",
    ],
    refs: [...BOOKS, "esc-ccs-2024"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

const SRC_16 = [{ book: "brilakis-pci" as const, loc: "16.2" }];

export const tips: LabTip[] = [
  {
    id: "pci-twostent-guide-size",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Two stents planned: choose a supportive guide, 7 Fr for V or SKS",
    text: "Most two-stent techniques can be done through 6 Fr, but V-stenting and simultaneous kissing stents need at least 7 Fr. A larger guide also eases passing two devices at once and adds support for troubleshooting; for a left main bifurcation, 7 or 8 Fr is preferred.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-choosing",
    sources: [...SRC_16, { book: "brilakis-pci", loc: "17" }, { book: "oxford-cath", loc: "ch 8: Bifurcation lesions" }],
    refs: BOOKS,
  },
  {
    id: "pci-twostent-prepare-both",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Planned two stents: prepare the side branch too",
    text: "If two stents are planned: prepare the side branch as well. In provisional stenting it is left alone, because ballooning it can dissect it; when two stents are planned, prepare both the side branch and the main vessel routinely before any stent.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-choosing",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-twostent-workhorse-wires",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Both branches on workhorse wires, kept apart",
    text: "In most cases wire both branches with workhorse wires (unless the side branch is too small or free of significant disease), and exchange any polymer-jacketed wire for a workhorse wire before preparation and stenting. Watch both distal tips, and keep the wires separated on the table so you always know which is which.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-choosing",
    sources: [...SRC_16, { book: "brilakis-pci", loc: "8" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-twostent-atherectomy-two-wires",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Atherectomy at a bifurcation: protect or remove the second wire",
    text: "The second wire is traditionally pulled out before atherectomy so that it cannot fracture. To keep the side-branch wire, run the burr through a guide extension over the atherectomy wire (7 Fr guide with 6 Fr extension for 1.25 mm; 8 Fr with 7 Fr for 1.5 mm), or shield the other wire with a small microcatheter through an 8 Fr guide, moving it slowly during each run so the same segment is not abraded. Brilakis also accepts leaving the side-branch wire unprotected (a low risk of wire damage) or using laser atherectomy instead.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-choosing",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-mv-balloon-first",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush: park the main-vessel balloon before the side-branch stent",
    text: "If DK crush is planned: put a balloon sized 1:1 to the distal main vessel in the main vessel, at or beyond the side-branch origin, before the side-branch stent is positioned. It will crush the protruding stent later.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-sb-protrusion",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush: side-branch stent 2–3 mm into the main vessel",
    text: "If DK crush is planned: run the side-branch stent over the full length of the side-branch disease and let it stand 2–3 mm proud of the ostium in the main vessel. Erring long costs little; erring short can leave part of the ostium unscaffolded and need a further stent.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-sb-deploy-pressure",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush or T-stent: side-branch stent at 10–12 atm, then 20 atm",
    text: "If DK crush or T-stenting is planned: deploy the side-branch stent at 10–12 atm to avoid a distal edge dissection, then pull the balloon back slightly into the main vessel and reinflate at 20 atm. In DK crush, then take an angiogram of the side branch and fix any underexpansion or dissection before the crush.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-crush-balloon",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush: a crush balloon sized to the proximal vessel stays proximal",
    text: "If DK crush is planned and the crushing balloon is sized to the proximal main vessel, do not let it pass beyond the carina, or the distal main vessel may dissect. Alternatively, crush with a balloon sized to the distal main vessel and follow with a POT.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-first-rewire-proximal",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "First rewiring after a crush: through a proximal strut",
    text: "Only after a crush (DK crush, mini-crush): rewire the crushed side-branch stent through a proximal strut so the balloon pushes the crushed metal towards the carina; a distal strut entry risks moving the crushed stent away from the carina. After provisional main-vessel stenting, rewire through a distal strut instead.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: [...SRC_16, { book: "brilakis-pci", loc: "15.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-dkcrush-sb-balloon-wont-go",
    lab: "pci",
    when: { phase: ["optimise"], event: ["balloon-uncrossable"], requires: ["side-branch-compromise", "bifurcation"] },
    title: "Balloon will not enter the side branch through struts",
    text: "Do not force it. Brilakis gives this sequence for the first DK crush kiss (the module applies it to any kiss through struts): a very small (about 1.0 mm) balloon, an anchor balloon in the main vessel, a specialised balloon, or a microcatheter to make a track; if all fail, rewire the side branch.",
    tone: "bailout",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-twostent-two-step-kiss",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush first kiss: side branch alone first",
    text: "If DK crush is planned: in the first kiss, inflate the side-branch balloon alone at 20 atm, then both together at 10–12 atm. In the second kiss each balloon goes alone at high pressure (either first), then both at 12–14 atm. On bench micro-CT a two-step kiss left metal over 33% of the ostium, against 53% after a one-step kiss.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci", "ormiston-crush-microct-2008"],
  },
  {
    id: "pci-dkcrush-second-rewire-distal",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Second rewiring: through a distal strut of the main-vessel stent",
    text: "If DK crush is planned: after the main-vessel stent and POT, rewire the side branch through a distal strut, the opposite of the first rewiring, then remove any jailed side-branch wire.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-twostent-final-pot",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "DK crush: final POT at the carina, then imaging",
    text: "After the final DK crush kiss, place a balloon sized 1:1 to the proximal main vessel with its distal edge at the carina (after provisional kissing Brilakis uses this POT to correct the oval shape the two balloons leave), then take final angiograms and intravascular imaging. After a TAP, stop the POT balloon just proximal to the neocarina instead; after a culotte the final POT is optional.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-dk-crush",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-twostent-kiss-sequence",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Final kiss in DK crush and culotte: one, the other, then both",
    text: "If DK crush or culotte is planned: for the final kiss, advance both balloons (either first), inflate one at high pressure, then the other at high pressure, then both together at 12–14 atm.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-culotte",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-culotte-first-branch",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Culotte: stent the more angulated branch first",
    text: "If culotte is planned: deploy the first stent from the more angulated branch back into the proximal main vessel, on a platform whose post-dilatation limit reaches the proximal main-vessel diameter, then assess that branch before going further. The Oxford handbook stents the main vessel first and makes the final kiss mandatory.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-culotte",
    sources: [...SRC_16, { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" }],
    refs: BOOKS,
  },
  {
    id: "pci-culotte-pot-before-rewire",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Culotte: POT, distal-cell rewire, open the struts",
    text: "If culotte is planned: after the first stent, POT the proximal segment, rewire the other branch through a distal cell at the carina, remove the jailed wire and dilate the struts into that branch before the second stent. After the second stent, POT again and rewire the first branch through a distal cell before the kiss.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-culotte",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-tstent-proximal-marker",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "T-stenting: proximal marker at the side-branch origin",
    text: "If planned T-stenting is chosen: set the proximal marker of the side-branch stent at the origin so the whole ostium is covered, the stent standing slightly proud into the main vessel. Erring short can leave part of the ostium unscaffolded and need a further stent.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-t-tap",
    sources: [...SRC_16, { book: "brilakis-pci", loc: "15.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-tap-protrusion",
    lab: "pci",
    when: { phase: ["stent"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "TAP: side-branch stent 1–2 mm into the main vessel",
    text: "If a TAP is chosen: with a balloon in the main-vessel stent across the side-branch take-off, set the side-branch stent to protrude only 1–2 mm into the main vessel, then deploy it and pull its balloon back slightly for the kiss.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-t-tap",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-tap-deflate-mv-first",
    lab: "pci",
    when: { phase: ["optimise"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "TAP kiss: deflate the main-vessel balloon first",
    text: "If a TAP stent has been placed: when the kiss is over, let the main-vessel balloon down first. If the side-branch balloon deflates first, the main-vessel balloon crushes the protruding struts into the side-branch ostium.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-t-tap",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-tap-final-pot",
    lab: "pci",
    when: { phase: ["optimise", "finish"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "TAP final POT: stop just short of the neocarina",
    text: "If a TAP stent has been placed: advance the final POT balloon only until its distal marker is just proximal to the neocarina formed by the protruding side-branch struts, so the struts are not crushed.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-t-tap",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-revcrush-mv-balloon-early",
    lab: "pci",
    when: { phase: ["optimise", "stent"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Reverse crush: get the main-vessel balloon in before dilating the side branch",
    text: "If a reverse crush is chosen: after rewiring the side branch and removing the jailed wire, consider advancing the main-vessel balloon straight away. Once the side branch has been ballooned, lifted struts can stop a main-vessel balloon from passing.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-crush-variants",
    sources: SRC_16,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-minicrush-rewire-proximal",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "Mini-crush: proximal-strut rewire, pull the jailed wire last",
    text: "If mini-crush is planned: rewire the crushed side-branch stent through a proximal strut with a second wire. Leave the jailed side-branch wire in until balloons are in both branches, because it anchors them, then remove it before the kiss.",
    tone: "do",
    lessonId: "cp-bifurcation-two-stent-crush-variants",
    sources: [{ book: "brilakis-pci", loc: "15.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-vstent-sks-guide",
    lab: "pci",
    when: { phase: ["plan"], requires: ["bifurcation"] },
    title: "V-stenting is for Medina 0,1,1 and needs at least 7 Fr",
    text: "Use V-stenting only when the proximal main vessel is free of disease. Two stents are delivered together, protruding 1–2 mm back from each ostium, so a guide of at least 7 Fr is required. In the left main Brilakis prefers two-stent techniques, especially DK crush, for true bifurcations, Medina 0,1,1 included.",
    tone: "caution",
    lessonId: "cp-bifurcation-two-stent-crush-variants",
    sources: [...SRC_16, { book: "brilakis-pci", loc: "16.1" }, { book: "brilakis-pci", loc: "17" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-sks-emergency-only",
    lab: "pci",
    when: { phase: ["complication"], event: ["acute-closure", "dissection"], vessel: ["LM"] },
    title: "Simultaneous kissing stents: emergencies and bail-out only",
    text: "In extreme cases (for example a left main dissection involving the bifurcation in a deteriorating patient), when both branches must be stented at once and access to both kept, simultaneous kissing stents are fast. They need at least a 7 Fr guide and leave a long neocarina that later devices struggle to pass, so never use them electively.",
    tone: "bailout",
    lessonId: "cp-bifurcation-two-stent-crush-variants",
    sources: [...SRC_16, { book: "oxford-cath", loc: "ch 10: Left main stem dissection" }],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  // chen-dkcrush3-2013 (DKCRUSH-III) is defined once, in the refs export of 04-left-main.ts
  {
    id: "chen-dkcrush5-3y-2019",
    kind: "trial",
    citation:
      "Chen X, Li X, Zhang JJ, et al. 3-Year outcomes of the DKCRUSH-V trial comparing DK crush with provisional stenting for left main bifurcation lesions. JACC Cardiovasc Interv. 2019;12:1927–1937.",
    url: "https://doi.org/10.1016/j.jcin.2019.04.056",
    note: "PMID: 31521645. DOI: 10.1016/j.jcin.2019.04.056. 482 patients; target lesion failure at 3 years 16.9% provisional vs 8.3% DK crush.",
    verified: true,
  },
  {
    id: "ferenc-bbk2-2016",
    kind: "trial",
    citation:
      "Ferenc M, Gick M, Comberg T, et al. Culotte stenting vs. TAP stenting for treatment of de-novo coronary bifurcation lesions with the need for side-branch stenting: the Bifurcations Bad Krozingen (BBK) II angiographic trial. Eur Heart J. 2016;37:3399–3405.",
    url: "https://doi.org/10.1093/eurheartj/ehw345",
    note: "PMID: 27578807. DOI: 10.1093/eurheartj/ehw345. 300 patients; binary restenosis 6.5% culotte vs 17% TAP; 1-year target lesion failure 6.7% vs 12.0% (P = 0.11).",
    verified: true,
  },
  {
    id: "hildick-smith-ebc-two-2016",
    kind: "trial",
    citation:
      "Hildick-Smith D, Behan MW, Lassen JF, et al. The EBC TWO Study (European Bifurcation Coronary TWO): a randomized comparison of provisional T-stenting versus a systematic 2 stent culotte strategy in large caliber true bifurcations. Circ Cardiovasc Interv. 2016;9:e003643.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.115.003643",
    note: "PMID: 27578839. DOI: 10.1161/CIRCINTERVENTIONS.115.003643. 200 patients, SB ≥2.5 mm with ≥5 mm ostial disease; 12-month death, MI or TVR 7.7% provisional vs 10.3% culotte; 16% of the provisional group had T-stenting.",
    verified: true,
  },
  {
    id: "ormiston-crush-microct-2008",
    kind: "paper",
    citation:
      "Ormiston JA, Webster MW, Webber B, Stewart JT, Ruygrok PN, Hatrick RI. The “crush” technique for coronary artery bifurcation stenting: insights from micro-computed tomographic imaging of bench deployments. JACC Cardiovasc Interv. 2008;1:351–357.",
    url: "https://doi.org/10.1016/j.jcin.2008.06.003",
    note: "PMID: 19463329. DOI: 10.1016/j.jcin.2008.06.003. Bench study: SB ostial strut coverage 53% after 1-step vs 33% after 2-step kissing; residual SB ostial stenosis 47% after classic crush vs 36% after mini-crush.",
    verified: true,
  },
  {
    id: "kan-definition2-3y-2022",
    kind: "trial",
    citation:
      "Kan J, Zhang JJ, Sheiban I, et al. 3-Year outcomes after 2-stent with provisional stenting for complex bifurcation lesions defined by DEFINITION criteria. JACC Cardiovasc Interv. 2022;15:1310–1320.",
    url: "https://doi.org/10.1016/j.jcin.2022.05.026",
    note: "PMID: 35798473. DOI: 10.1016/j.jcin.2022.05.026. DEFINITION II, 653 patients; target lesion failure at 3 years 16.0% provisional vs 10.4% two-stent (HR 0.63); no difference between the groups from year 1 to year 3.",
    verified: true,
  },
  {
    id: "arunothayaraj-ebc-main-3y-2025",
    kind: "trial",
    citation:
      "Arunothayaraj S, Egred M, Banning AP, et al. Stepwise provisional versus systematic dual-stent strategies for treatment of true left main coronary bifurcation lesions. Circulation. 2025;151:612–622.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.124.071153",
    note: "PMID: 39907022. DOI: 10.1161/CIRCULATIONAHA.124.071153. EBC MAIN 3-year report, 467 patients; death, MI or TLR 23.5% provisional vs 29.5% dual stent (HR 0.75, P = 0.11); TLR 8.3% vs 15.6% (HR 0.50, P = 0.013); interaction with side vessel diameter and lesion length, smaller (<3.25 mm) and shorter (<10 mm) side-vessel lesions favouring provisional.",
    verified: true,
  },
  {
    id: "arunothayaraj-ebc-main-technique-2023",
    kind: "paper",
    citation:
      "Arunothayaraj S, Lassen JF, Clesham GJ, et al. Impact of technique on bifurcation stent outcomes in the European Bifurcation Club Left Main Coronary Trial. Catheter Cardiovasc Interv. 2023;101:553–562.",
    url: "https://doi.org/10.1002/ccd.30575",
    note: "PMID: 36709485. DOI: 10.1002/ccd.30575. Per-protocol EBC MAIN cohort (438 patients), each allocated to provisional stenting or to one of the protocol's dual-stent options (T, TAP or culotte); DK crush was not among those options.",
    verified: true,
  },
  {
    id: "gao-dkcrush8-2026",
    kind: "trial",
    citation:
      "Gao X, Kan J, Chen Y, et al. IVUS or angiography guidance for percutaneous coronary intervention in complex coronary bifurcation lesions: the DKCRUSH VIII randomized clinical trial. J Am Coll Cardiol. 2026;87:2080–2095.",
    url: "https://doi.org/10.1016/j.jacc.2026.01.081",
    note: "PMID: 41914946. DOI: 10.1016/j.jacc.2026.01.081. 555 patients with complex bifurcations by DEFINITION criteria, DK crush in 96.8%; target vessel failure at 1 year 6.1% IVUS vs 14.7% angiography (HR 0.40).",
    verified: true,
  },
];
