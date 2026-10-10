// Module cp-bifurcation-provisional: bifurcation assessment and provisional stenting (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, sections 16.1 and 16.2 (provisional stenting, POT, jailed wire, rewiring, kissing),
// with related passages in 6.8, 8.6, 10.2, 12.1, 13.1, 15.2, 17.4-17.13, 19.9, 25.2, 27.2, 30.6 and 30.9; Oxford Handbook
// of Cardiac Catheterization and Coronary Intervention, chapter 8 (bifurcation lesions, bifurcation PCI techniques,
// lesion classification, specific techniques in complex PCI) and chapter 6 (quantification of stenoses).
// Two-stent techniques (T, TAP, culotte, crush variants, V and SKS) are taught in cp-bifurcation-two-stent; the left
// main in cp-left-main; branch ostial lesions in cp-ostial; calcium modification in cp-calcium.
// Every claim is listed with its page in docs/curriculum/evidence/cp-bifurcation-provisional.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const OX_LESIONS = { book: "oxford-cath" as const, loc: "ch 8: Bifurcation lesions" };
const OX_TECH = { book: "oxford-cath" as const, loc: "ch 8: Bifurcation PCI techniques" };

export const module: Module = {
  id: "cp-bifurcation-provisional",
  title: "Bifurcations: assessment and provisional stenting",
  stage: 4,
  summary:
    "How to read a bifurcation and decide what it needs, then the provisional strategy as Brilakis lays it out, one step at a time: planning the guide, wiring both branches, preparing the main vessel, sizing and placing the main-vessel stent, jailing the side-branch wire and getting it out again, the proximal optimisation technique, judging the side branch, rewiring it through the right cell, kissing balloon inflation, final POT, and the bail-outs when the branch narrows or closes.",
  objectives: [
    "Describe a bifurcation with the Medina classification and the clinical features the classification leaves out, and decide whether the side branch must be preserved.",
    "Estimate the likelihood of side-branch occlusion and walk through Brilakis's bifurcation algorithm to choose between provisional stenting and a planned two-stent strategy.",
    "Set up a provisional case: guide size and shape, wiring both branches (and what to do when the side branch will not wire), main-vessel preparation, and atherectomy with two wires in place.",
    "Size and position the main-vessel stent, jail the side-branch wire safely, and remove a jailed wire without fracturing it.",
    "Perform POT with the right balloon diameter, length and position, and explain what goes wrong when the balloon is too distal, too proximal, too long or oversized.",
    "Judge whether the side branch is compromised, rewire it through a distal strut, perform kissing balloon inflation with balloons sized by Finet's law, consider a final POT, and rescue an occluded side branch.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-provisional-assess",
      title: "Reading a bifurcation and choosing the strategy",
      minutes: 14,
      topics: ["cx-bifurcation-assessment"],
      sources: [
        B("16.1"),
        B("16.2"),
        B("6.8"),
        B("15.2"),
        B("17.10"),
        OX_LESIONS,
        OX_TECH,
        { book: "oxford-cath", loc: "ch 8: Lesion classification" },
        { book: "oxford-cath", loc: "ch 8: Specific techniques in complex PCI" },
        { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
      ],
      refs: [...BOOKS, "medina-2006", "definition-2014", "definition2-2020", "dkcrush5-2017", "ebc-main-2021", "lunardi-bif-arc-2022", "johnson-eapci-lm-imaging-2026"],
      blocks: [
        {
          kind: "p",
          text: "A bifurcation lesion is a narrowing that sits next to, or runs into, the origin of a side branch that matters. Brilakis takes the European Bifurcation Club's definition, which turns on that word: a **significant** side branch. The Oxford handbook puts bifurcations at up to 15% of PCI target lesions (neither manual gives a figure per procedure) and names the two reasons they are harder than a plain lesion: the side branch can be compromised or occluded during the procedure, and there are many competing ways of treating them. The Academy lesson cx-bif-assessment uses 2.5 mm as the size at which branches usually matter, a figure neither manual gives; Brilakis's floor is 2 mm, and for a branch between 2.0 and 2.5 mm the decision rests on the territory it supplies. This lesson is the thinking before the first wire; the rest of the module is the provisional technique itself. The earlier Academy lesson cx-bif-assessment covers vocabulary; here the aim is the decision.",
        },
        { kind: "h", text: "Describing the lesion: Medina" },
        {
          kind: "p",
          text: "The Medina classification writes three digits in a fixed order: proximal main vessel (MV), distal main vessel, side branch (SB). Brilakis scores a segment 1 when its diameter stenosis is 50% or more and 0 when it is less; the Oxford handbook simply writes 1 for a lesion present and 0 for none. The seven possible patterns are below, with what each tells you about planning.",
        },
        {
          kind: "table",
          caption: "The seven Medina patterns and what they change",
          head: ["Medina", "Disease in", "Planning point from the manuals"],
          rows: [
            ["1,1,1", "Proximal MV, distal MV and SB ostium", "True bifurcation. In the left main Brilakis prefers a two-stent technique (especially DK crush) for true bifurcations (17.10); in his DK crush section (16.2.10.5) he cites DKCRUSH-V, in which target lesion failure at 12 months was 5% with DK crush against 10% with provisional stenting. The later EBC MAIN trial (467 patients with true left main bifurcations) found no advantage of systematic dual stenting over stepwise provisional at 12 months (death, MI or target lesion revascularisation 17.7% vs 14.7%), and its authors keep stepwise provisional as the default; cp-left-main sets the two trials side by side"],
            ["1,1,0", "MV on both sides of the branch, SB spared", "No SB ostial stenosis of 50% or more (lesser disease may be present; Oxford: occlusion is rare under 50% ostial stenosis), but plaque and carina shift can still compromise it"],
            ["1,0,1", "Proximal MV and SB ostium", "True bifurcation (cx-bif-assessment). Assess how severe and long the SB disease is: it drives the risk of losing the branch"],
            ["0,1,1", "Distal MV and SB, proximal MV free", "True bifurcation. The one pattern for which Brilakis's algorithm offers V-stenting in a planned two-stent strategy"],
            ["1,0,0", "Proximal MV only", "No SB ostial stenosis of 50% or more"],
            ["0,1,0", "Distal MV only", "Brilakis treats it as a branch ostial lesion of the distal MV (cp-ostial); cx-bif-assessment handles it with provisional MV stenting while watching the SB"],
            ["0,0,1", "SB ostium only", "Also a branch ostial lesion (cp-ostial)"],
          ],
        },
        {
          kind: "figure",
          id: "medina",
          caption: "Medina: proximal MV, distal MV, side branch, always in that order.",
        },
        {
          kind: "p",
          text: "**True bifurcation.** Neither manual defines the term. Brilakis, in his left main section, gives Medina 1,1,1 and 0,1,1 as the examples of a true bifurcation, and DKCRUSH-V enrolled left main bifurcations with those two patterns. The standardised definition comes from the Bifurcation Academic Research Consortium (Bif-ARC, 2022), which, as the 2026 EAPCI and European Bifurcation Club consensus quotes it, counts Medina 1,1,1, 1,0,1 and 0,1,1 as true bifurcation disease; the Academy lesson cx-bif-assessment uses the same three. What they share is a stenosis of 50% or more in the main vessel and at the SB ostium together. When a trial below reports results for true bifurcations, check which patterns it enrolled.",
        },
        {
          kind: "list",
          items: [
            "**Lesion classification systems.** In the ACC/AHA scheme the Oxford handbook reproduces, a bifurcation with a protected side branch is a type B feature and one with an unprotected side branch a type C feature, and an unprotected bifurcation is among the multivariate predictors of procedural failure. The handbook also lists bifurcations among the lesion characteristics that make PCI complex.",
            "**Reading stenosis at a branch.** Brilakis warns that percent stenosis at or just beyond a major branch is hard to estimate because the reference diameter changes across the branch.",
            "**The views.** Image in angulations that pull the MV and the SB apart, because every later step (wiring, stent placement, and a crush if one is done) depends on seeing the carina. The Oxford handbook's general rule applies: at least two projections, ideally orthogonal, without foreshortening and without overlap from other vessels or side branches. For the left main bifurcation Brilakis names RAO caudal, AP caudal and LAO caudal (the spider).",
          ],
        },
        {
          kind: "check",
          stem: "The left main is free of disease. The LAD ostium has a 70% stenosis and the circumflex ostium a 40% narrowing. How do you code it, and how does Brilakis approach it?",
          options: [
            "0,1,1: both daughter ostia are narrowed, so it is a true bifurcation and a planned two-stent case",
            "0,1,0: a branch ostial lesion of the LAD, treated as Brilakis describes for ostial lesions",
            "1,1,0: the LAD ostium sits at the carina, so it also counts as proximal main-vessel disease",
            "0,1,0: and since the left main is spared, the circumflex needs no thought during LAD stenting",
          ],
          answer: 1,
          explanation:
            "Each segment scores 1 only at 50% stenosis or more, so the 40% circumflex scores 0 and the code is 0,1,0, not 0,1,1. Brilakis treats Medina 0,1,0 and 0,0,1 as branch ostial lesions and handles them in his ostial chapter (cp-ostial). The circumflex still matters: a score of 0 does not mean no plaque, and the 2026 EAPCI and European Bifurcation Club consensus notes that on IVUS, disease is rarely confined to the LAD or circumflex ostium, extending back into the distal left main in more than 90% and 80% of cases respectively. That is what makes the choice between stenting into the left main and stopping at the ostium hard. Disease at the LAD origin does not make the left main score 1.",
        },
        { kind: "h", text: "Brilakis's algorithm, question by question" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Must this branch be kept open?",
              detail:
                "Decide from its size and the territory it supplies. Brilakis's rule of thumb: branches under 2 mm usually do not need preserving. The Oxford handbook agrees that a branch under 2.0 mm is seldom a treatment target, and frames the decision to protect a branch (by wiring it, or with a balloon) as depending on its calibre, its area of distribution and how much of its ostium is involved. **If no**, treat the MV only.",
            },
            {
              title: "2. If yes, how likely is the side branch to occlude when the MV is stented?",
              detail:
                "Brilakis lists four determinants: where the disease is (Medina), how severe the SB disease is, lesion morphology (calcium, thrombus, length; intravascular imaging helps here), and the bifurcation angle, since extreme angles can be hard to wire. The Oxford handbook adds a useful anchor: occlusion of the branch is rare when its ostial stenosis is under 50% before treatment. **Low likelihood**: provisional stenting. **High likelihood**: a planned two-stent strategy. The Oxford handbook frames the same choice: a crush technique, which commits you to two stents, suits a reasonably sized SB that is already severely compromised and likely to get worse when the MV is treated; and a provisional case is converted to two stents when the SB is left with severe stenosis or impaired flow from plaque or carina shift.",
            },
            {
              title: "Beyond the manuals: long, severe SB disease",
              detail:
                "Neither book cites DEFINITION II. The DEFINITION criteria (taught in cx-bif-two-stent) call a bifurcation complex when it has one major criterion plus at least two minor ones. The major criterion is an SB diameter stenosis of 70% or more (left main) or 90% or more (outside the left main), in either case with an SB lesion 10 mm or longer. In such lesions DEFINITION II (653 patients) found less target lesion failure at 1 year with a planned two-stent strategy, mostly DK crush, than with provisional stenting (6.1% vs 11.4%); the difference came from target-vessel infarction and revascularisation, and cardiac death did not differ. Apply this after Brilakis's two questions, not instead of them (cp-bifurcation-two-stent).",
            },
            {
              title: "3. Provisional path: wire the SB, put a crossover stent in the MV, then ask whether the SB is compromised",
              detail:
                "Not compromised: stop. Compromised: balloon angioplasty of the SB, which often restores or improves its flow. If that fails, stent the SB by a technique chosen on the angle: 70–90° TAP; under 70° reverse crush or culotte. The Oxford handbook names T-stenting, TAP and culotte as the commonest bail-outs. Lesson 5 and cp-bifurcation-two-stent take this further.",
            },
            {
              title: "4. Planned two-stent path: three more questions",
              detail:
                "Medina 0,1,1? V-stenting can be used. An emergency in which both branches must stay accessible? Simultaneous kissing stents (SKS). Brilakis keeps SKS for emergencies or bail-out: they are quick to place and keep a wire in each branch, but they leave a long metal neocarina that makes any later treatment and equipment delivery very difficult, so he rules them out for non-emergency PCI. Otherwise choose by angle: 70–90° T-stenting; under 70° DK crush or culotte, with DK crush his preferred strategy in most cases. The steps of each are in cp-bifurcation-two-stent.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Angle and technique: the two manuals compared",
          head: ["", "Brilakis 16.1–16.2", "Oxford handbook"],
          rows: [
            ["Angle close to 90°", "70–90°: T-stenting (planned) or TAP (after provisional)", "T-stenting preferred when the angle approaches 90°"],
            ["Narrower angle", "Under 70°: DK crush (preferred), culotte; reverse crush or culotte as bail-out after provisional", "TAP preferred when the angle is under 90°"],
            ["Default strategy", "Provisional is the simplest approach and his first choice for most bifurcations, as long as it can be done without seriously endangering a significant SB (16.2.10.1). He cites EBC TWO: in complex bifurcations with large stenosed SBs, provisional and culotte gave similar outcomes (16.2.10.6). T and TAP are quicker and easier than DK crush or culotte (16.2.10.2)", "Little evidence that any approach beats the simple provisional T technique; the figure caption notes recent data favouring the provisional stent approach"],
          ],
        },
        {
          kind: "p",
          text: "The two books draw the TAP line in different places: Brilakis gives TAP for angles of 70–90°, while the Oxford handbook prefers TAP whenever the angle is under 90° and keeps T-stenting for angles near 90°. Oxford describes T-stenting as landing the SB stent edge at the ostium and TAP as letting it protrude slightly into the MV. Brilakis asks for slight protrusion even in T-stenting, because a shorter protrusion may leave the ostium poorly covered, and he favours T and TAP for angles near 90°, above all when the SB is small compared with the MV. Neither book gives a geometric rule beyond this; the details are in cp-bifurcation-two-stent.",
        },
        {
          kind: "check",
          stem: "A 3.0 mm diagonal leaves the LAD at about 45°. Its ostium has a 40% narrowing and the LAD lesion (Medina 1,1,0) is moderately calcified. The diagonal supplies a large anterolateral territory. Which plan follows Brilakis's algorithm?",
          options: [
            "Treat the LAD only, without wiring the diagonal, because its ostium is under 50%",
            "Planned DK crush, because the angle is under 70° and DK crush is his preferred two-stent technique",
            "Simultaneous kissing stents, which keep both branches open throughout the procedure",
            "Provisional stenting with the diagonal wired, since its occlusion risk looks low",
          ],
          answer: 3,
          explanation:
            "The branch is large and supplies important myocardium, so it should be preserved (question 1), and its ostium is only mildly diseased, which makes occlusion unlikely (question 2, and Oxford's rule that occlusion is rare under 50% ostial stenosis). The moderate calcium in the LAD is a morphological risk factor in Brilakis's list and a reason to wire the diagonal and consider imaging, but with a mildly diseased SB ostium the overall risk still favours provisional stenting with the SB wired. The angle only chooses a two-stent technique once two stents are needed, so going straight to DK crush skips question 2. Brilakis's wiring section does allow an SB without significant disease to be left unwired, but his provisional section wires the SB when it is important and at risk of occlusion; a large branch to a big territory with a diseased ostium in a calcified lesion qualifies. SKS is for emergencies or bail-out only.",
        },
        { kind: "h", text: "When the side-branch ostium is hard to judge" },
        {
          kind: "list",
          items: [
            "Before you choose, Brilakis advises physiology or intravascular imaging when you cannot tell how severe the SB ostial disease is.",
            "**Physiology** helps at three points: before treatment, to grade both lesions; at the end, to judge the result; and during a provisional case, to tell whether the branch has really been compromised (pm-physiology teaches the technique). Brilakis illustrates the third use with a left main case (Fig. 16.79): after stenting, the circumflex ostium looked narrowed, and on FFR pullback the pressure rose in a single step as the sensor came back from the circumflex into the left main, which located a significant focal stenosis at the jailed ostium.",
            "**Intravascular imaging** has four: how wide and how long each lesion is in the MV and the SB, the presence and severity of calcium, stent expansion, and the cause of a complication such as a wire that has passed under the stent (pm-imaging).",
            "**Enhanced stent visualisation** on the X-ray system can confirm that the stent fully covers the SB ostium and show stent deformation.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Reversing the last two Medina digits. Say the segments aloud in order before you write the code.",
            "Treating the Medina code as the strategy. It says where the plaque is, not how big or important the branch is, how long its disease runs or what the angle is.",
            "Choosing a two-stent technique by angle before deciding whether two stents are needed at all.",
            "Planning from a view in which the SB ostium overlaps the MV or is foreshortened.",
            "Planning SKS for an elective case: Brilakis keeps it for emergencies or bail-out because of the long neocarina it leaves.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask the two algorithm questions in order and say the answers out loud before the case: 'This branch matters because of its size and territory; its occlusion risk is low because the ostium is mildly diseased and short, and I have weighed the calcium in the main vessel; so provisional, with the branch wired.' If you cannot fill in the second sentence from the angiogram, that is the moment to measure the ostium with a pressure wire or image it.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "plan",
          task: "For each left coronary run, choose the next projection you would take to separate the LAD from its diagonal (or the LAD from the circumflex at the left main) and lay out the carina, then say which digit of the Medina code that view lets you score.",
        },
        { kind: "sim", sim: "views", task: "Find two projections, ideally about 90° apart, that open the LAD-diagonal bifurcation without overlap or foreshortening; then find the caudal views that open the left main bifurcation." },
        { kind: "video", id: "HdtEEK33YVA", note: "Manual of PCI chapter 16.1: bifurcation PCI step by step." },
        { kind: "video", id: "zc93aV12EdY", note: "Elias Hanna on modern bifurcation algorithms and the details of provisional techniques." },
        { kind: "video", id: "MTR9XnRyqds", note: "A case of LAD-diagonal bifurcation PCI." },
        {
          kind: "keypoints",
          items: [
            "Bifurcation lesion: a narrowing beside, or reaching into, the ostium of a side branch that matters (European Bifurcation Club definition, used by Brilakis).",
            "Medina order: proximal MV, distal MV, SB; 1 means a stenosis of 50% or more, 0 less than 50% (not necessarily no disease). True bifurcation: Brilakis names 1,1,1 and 0,1,1; Bif-ARC adds 1,0,1.",
            "Question 1: does the SB need preserving? Size (under 2 mm usually not) and territory.",
            "Question 2: how likely is SB occlusion? Medina pattern, SB severity, calcium, thrombus, length and angle; Oxford: rare when the ostial stenosis is under 50%.",
            "Low risk: provisional. High risk: planned two stents (V-stenting for 0,1,1; SKS only in emergencies or as a bail-out, being quick and keeping both wires; otherwise by angle). Long, severe SB disease meeting the DEFINITION criteria favoured a planned two-stent strategy in DEFINITION II.",
            "Angle picks the two-stent technique: Brilakis 70–90° T or TAP, under 70° DK crush (preferred), culotte or reverse crush (reverse crush as a bail-out after provisional); Oxford draws the TAP line at 90°.",
            "If the SB ostium is unclear, measure it with physiology or image it before deciding.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-provisional-setup",
      title: "Provisional stenting I: guide, wires, preparation and the main-vessel stent",
      minutes: 14,
      topics: ["cx-provisional"],
      sources: [B("16.2"), B("8.6"), B("10.2"), B("19.9"), B("30.6"), B("17.4"), OX_LESIONS, OX_TECH],
      refs: [...BOOKS, "giustino-complex-pci-dapt-2016", "dkcrush5-2017", "ebc-main-2021", "esc-acs-2023", "esc-ccs-2024", "october-2023"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis's goal for provisional stenting is one sentence: put a stent in the main vessel without compromising the side branch. Everything before the first inflation is set up for that, and for the moment when the branch narrows anyway and you need a way back into it. This lesson takes you from the guide to a positioned MV stent. Planning, monitoring and drugs follow the standard chapters, with two bifurcation-specific points below.",
        },
        { kind: "h", text: "Before the wires" },
        {
          kind: "table",
          head: ["Step", "Bifurcation-specific point"],
          rows: [
            ["Drugs", "Anticoagulation is the same as for any PCI. Brilakis advises considering prolonged dual antiplatelet therapy (DAPT) in patients at low bleeding risk, because bifurcation stenting carries a higher risk of stent thrombosis. For elective PCI in chronic coronary syndrome, the 2024 ESC guideline default is aspirin plus clopidogrel for up to 6 months (1–3 months at high bleeding risk), with longer therapy considered only when ischaemic risk is high and bleeding risk low (pm-antithrombotics). The evidence for longer therapy after complex PCI (a pooled analysis of six trials, Giustino 2016) counted a bifurcation as complex only when two stents were implanted; longer DAPT reduced events only in the complex group and increased major bleeding to a similar degree in both groups, so a single provisional stent does not by itself make PCI complex. The Oxford handbook notes that DES may cut the high restenosis rates of multi-stent techniques, and warns that more than one DES may raise stent thrombosis risk by more than 5%. Do not quote that figure as current. In contemporary left main trials, stent thrombosis at 1 year with a planned two-stent strategy was 0.4% with DK crush in DKCRUSH-V (definite or probable) and 1.3% with dual stenting in EBC MAIN; the provisional arms had 3.3% and 1.7% respectively."],
            ["Access", "Brilakis accepts radial or femoral, chosen on anatomy, complexity and experience, and notes that femoral access may support a highly complex case best. In ACS the 2023 ESC guideline recommends radial access (pm-access). Think about access in advance when the plan needs a 7 or 8 Fr guide (V-stenting, SKS, the atherectomy set-ups below) or extra support."],
            ["Haemodynamic support", "Decided on patient and procedural factors. Brilakis names poor LV function during complex left main bifurcation PCI as a possible indication, more so when the RCA is blocked or badly diseased (cp-left-main)."],
            ["Guide shape", "Supportive: AL for the RCA, EBU or XB for the left main."],
            ["Guide size", "Most bifurcation techniques fit a 6 Fr guide (Oxford: most 6 F guides take two balloon catheters for a kiss). V-stenting and SKS need at least 7 Fr. A larger guide passes two devices more easily, particularly balloons that have already been used, adds support and makes troubleshooting easier. For left main bifurcation PCI Brilakis prefers 7 or 8 Fr guides for their support (17.4; cp-left-main)."],
          ],
        },
        { kind: "tip", id: "pci-bif-guide-size" },
        { kind: "h", text: "Wiring both branches" },
        {
          kind: "steps",
          items: [
            {
              title: "Wire the MV and the SB",
              detail:
                "Brilakis wires both branches routinely; the exceptions are a very small SB or one without significant disease. In provisional stenting the SB gets a wire when it matters and could close. Standard workhorse wires are his choice for both branches.",
            },
            {
              title: "Keep the wires apart outside the body",
              detail:
                "With two wires in the same guide you must know which is which at every step. pm-wiring teaches Brilakis's towel method and the alternatives (wires of different colours, a slight bend in the back end of the SB wire, a torquer on one of them).",
            },
            {
              title: "If the SB will not wire: options in three groups",
              detail:
                "Brilakis lists the options as alternatives, not a fixed sequence. **Wire**: add a secondary bend, change to a hydrophilic-coated or polymer-jacketed wire, or use the reversed (hairpin) wire technique. **Microcatheter**: a large or small microcatheter supports the wire and lets you reshape the tip without losing position; an angulated microcatheter aims the wire at the branch; a dual-lumen microcatheter lets you wire the branch through its over-the-wire lumen while it rides on the MV wire. **Modify the MV**: balloon angioplasty (possibly with a plaque modification balloon) or atherectomy can open the way, but carries a risk of SB occlusion, which is why Brilakis flags it; he gives no order, but that risk is a reason to try the wire and microcatheter options first. The hairpin and the deflection balloon are taught in pm-wiring.",
            },
            {
              title: "Watch both wire tips and swap specialty wires",
              detail:
                "Check the distal position of both wires throughout: a tip that migrates too far can perforate. If a polymer-jacketed wire was needed to reach a branch, exchange it for a workhorse wire before lesion preparation and stenting.",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-wire-both-branches" },
        { kind: "tip", id: "pci-bif-hard-side-branch-wire" },
        {
          kind: "check",
          stem: "You have wired a sharply angulated diagonal with a polymer-jacketed wire through an angulated microcatheter, after a workhorse wire repeatedly prolapsed into the LAD. What should you do before predilating the LAD?",
          options: [
            "Exchange the diagonal wire for a workhorse wire through the microcatheter, then check both tips",
            "Leave the polymer-jacketed wire in the diagonal, because rewiring may fail later",
            "Remove the microcatheter and the diagonal wire, since the diagonal does not need a wire for provisional stenting",
            "Advance the polymer-jacketed wire as far as possible into the distal diagonal for support",
          ],
          answer: 0,
          explanation:
            "Brilakis asks for polymer-jacketed wires used for wiring to be replaced by a workhorse wire before lesion preparation and stenting; the microcatheter lets you swap without losing the branch. The diagonal was wired because it is important and at risk, so pulling the wire throws away your protection. Pushing a wire far distally risks perforation. (Whether polymer-jacketed wires can be jailed is debated, as lesson 3 explains, but the exchange rule comes first.)",
        },
        { kind: "h", text: "Preparing the lesion" },
        {
          kind: "list",
          items: [
            "**The MV: always.** Brilakis prepares the MV lesion in every case because it helps sizing, delivery and expansion of the stent (the general sequence is in pm-prep-and-stent).",
            "**The SB: generally not, in provisional stenting.** A balloon in the SB can dissect it, and Brilakis expects a dissected branch to need a stent, which turns a one-stent plan into two. (When a two-stent technique is planned, both branches are prepared routinely.)",
            "**Imaging** helps measure the size and length of both lesions and decide whether atherectomy or other preparation is needed.",
          ],
        },
        {
          kind: "p",
          text: "**Where the books differ.** Oxford's technique section describes provisional stenting as MV stenting with either no SB intervention or balloon dilatation of the SB ostium (typically a kiss); its background section defines provisional T-stenting as MV stenting with balloon dilatation of the SB. Its illustrated LAD-diagonal case (dilating the MV and then the SB before the single LAD stent) and its section on protecting the side branch (a balloon before dilatation, or simply a wire) also include ballooning the SB before the MV stent. Brilakis is not consistent either: in chapter 10 he lists ballooning or stenting the SB before MV stenting among the ways to prevent SB occlusion, while his bifurcation chapter says SB preparation should generally be avoided in provisional stenting because it may dissect the branch. The Academy lesson cx-bif-provisional allows SB dilatation only when the SB is severely diseased or access is precarious, which is close to the exception described here. If the branch is so tight that you fear losing it, that is also an argument about occlusion risk and possibly a two-stent plan (lesson 1).",
        },
        { kind: "tip", id: "pci-bif-no-sb-predilation" },
        {
          kind: "steps",
          title: "Atherectomy with two wires in place",
          items: [
            {
              title: "The problem",
              detail:
                "During atherectomy the artery being treated should hold only the atherectomy wire, so the second wire is traditionally pulled out to stop it fracturing. If the unwired branch then dissects, getting back into it can be very hard. And atherectomy itself can dissect or occlude a highly diseased SB (19.9.6).",
            },
            {
              title: "Option 1: a guide extension over the atherectomy wire",
              detail:
                "Useful when the lesion needing atherectomy is in the proximal SB or the distal MV. The extension keeps the burr or crown apart from the second wire. Brilakis's sizes: a 7 Fr guide with a 6 Fr extension takes a 1.25 mm rotational burr or the 1.25 mm orbital crown; an 8 Fr guide with a 7 Fr extension takes a 1.5 mm burr. Taking the device through an extension advanced beyond the branch also shields branches proximal to the lesion (19.9.6).",
            },
            {
              title: "Option 2: a microcatheter over the other wire",
              detail:
                "Use a small one, to limit damage to it, and with several runs move it slowly during the runs so the same segment is not abraded repeatedly; this needs an 8 Fr guide. Brilakis shows a small microcatheter perforated by an orbital crown. In his orbital atherectomy section (19.9.6) he advises avoiding this protection, because the microcatheter and wire can be damaged and embolise, although 16.2.9 lists it as an option.",
            },
            {
              title: "Options 3 and 4",
              detail: "Leave the SB wire in place and accept a low risk of wire damage, or use laser atherectomy. Atherectomy itself is taught in cp-calcium.",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-atherectomy-two-wires" },
        { kind: "h", text: "Step 1: choose and deliver the MV stent" },
        {
          kind: "steps",
          items: [
            {
              title: "Diameter: the distal MV",
              detail:
                "Match the stent to the distal MV. A stent sized to the larger proximal MV shifts the carina into the SB and can occlude it, and can dissect or perforate the distal MV. Chapter 10 gives the same rule for every tapering vessel. Brilakis finds intravascular imaging very useful for measuring the size and length of both lesions, and in a true or complex bifurcation the distal and proximal references and the landing zones are best taken from IVUS or OCT: the 2024 ESC chronic coronary syndromes guideline recommends imaging guidance in true bifurcations, and OCTOBER found fewer events with OCT guidance (lesson 5).",
            },
            {
              title: "...but able to reach the proximal MV",
              detail:
                "The stent must also expand, at POT, to the proximal MV diameter for full apposition. Know each stent's post-dilatation limit so that you do not deform it (Brilakis's stent expansion chart is in pm-prep-and-stent). In the left main, stents deployed into the LAD or circumflex must be able to reach the left main diameter.",
            },
            {
              title: "Length: leave room for POT",
              detail:
                "The POT balloon must fit inside the stent proximal to the carina. The shortest balloons are 6 mm long, so place the stent so that 6 mm or more of it (8–10 mm is better) lies before the carina.",
            },
            {
              title: "Position across the branch",
              detail:
                "Deliver the stent over the MV wire across the bifurcation, with the SB wire left in place beside it, ready to be jailed (next lesson).",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-mv-stent-size" },
        {
          kind: "check",
          stem: "The proximal LAD measures 3.5 mm, the LAD beyond the diagonal 3.0 mm. The lesion starts 4 mm proximal to the diagonal and ends 10 mm beyond it. Which MV stent plan follows Brilakis?",
          options: [
            "3.5 mm, landing its proximal edge exactly 4 mm before the carina so the whole lesion is covered",
            "3.0 mm, covering the lesion with at least 6 mm (ideally 8–10 mm) proximal to the carina",
            "3.25 mm, the average of the two references, so neither segment is badly mismatched",
            "3.0 mm, placed so that its proximal edge ends exactly at the carina to avoid jailing the branch",
          ],
          answer: 1,
          explanation:
            "Size to the distal MV (3.0 mm) on a platform that can be expanded to 3.5 mm, and make it long enough for a POT balloon: at least 6 mm, ideally 8–10 mm, proximal to the carina. A 3.5 mm stent risks carina shift with SB occlusion and distal dissection or perforation, and 4 mm of proximal stent is too short for any POT balloon. An average diameter is still oversized distally and undersized proximally. A stent ending at the carina leaves the bifurcation untreated and is not provisional stenting.",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting a case that may need two stents or atherectomy through a guide too small for the plan, then changing guides across a half-treated bifurcation.",
            "Ballooning the SB 'to be safe' in a provisional case, dissecting it, and having to stent it.",
            "Leaving a polymer-jacketed wire in place for stenting.",
            "Sizing the MV stent to the proximal reference.",
            "Choosing a stent so short that nothing longer than a few millimetres sits proximal to the carina, which makes POT impossible.",
          ],
        },
        {
          kind: "pearl",
          text: "Plan the stent from the POT backwards. Decide where the POT balloon's distal marker will sit (at the carina) and how long the balloon is, then make sure the stent extends at least that far proximally. If the lesion starts right at the carina, you will still need extra stent proximally simply to make room for POT.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, treat the nearest diagonal as a side branch you must preserve: say aloud which wire goes where, size the LAD stent to the distal reference, and choose a length so that 8–10 mm of it lies before the diagonal origin.",
        },
        { kind: "sim", sim: "pci-bench", task: "Size a main-vessel stent to a 3.0 mm distal reference in a vessel that is 3.5 mm proximally, confirm the chosen platform can be post-dilated to 3.5 mm, and choose its length so that at least 6 mm (ideally 8–10 mm) lies proximal to the branch." },
        { kind: "video", id: "s9aKkOfiBio", note: "Manual of PCI chapter 16.2: provisional bifurcation stenting." },
        { kind: "video", id: "cQMEvu7RavQ", note: "Case 26: provisional bifurcation stenting." },
        { kind: "video", id: "NS719aZYv50", note: "CTO Manual case 136: bifurcation atherectomy." },
        {
          kind: "keypoints",
          items: [
            "Goal of provisional: stent the MV without compromising the SB.",
            "6 Fr suits most techniques; V-stenting and SKS need at least 7 Fr; larger guides make two devices easier and give more support, and 7 or 8 Fr is preferred for left main bifurcations.",
            "Brilakis: consider prolonged DAPT at low bleeding risk after bifurcation stenting. The 2024 ESC default after elective PCI is up to 6 months of aspirin and clopidogrel; the complex-PCI evidence for longer DAPT counted two-stent bifurcations, and a single provisional stent alone does not make PCI complex.",
            "Wire both branches with workhorse wires. If the SB will not wire: options in three groups (wire, microcatheter, MV modification); Brilakis flags MV modification for its risk of SB occlusion and gives no order. Swap polymer-jacketed wires before stenting.",
            "Prepare the MV always; avoid preparing the SB in provisional stenting (Brilakis 16.2). Oxford, and Brilakis's own chapter 10 list, also mention ballooning the SB before the MV stent.",
            "MV stent: diameter of the distal MV, expandable to the proximal MV, at least 6 mm (ideally 8–10 mm) proximal to the carina.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-provisional-jailed",
      title: "Provisional stenting II: the jailed wire, jailed balloons and getting a jailed wire out",
      minutes: 13,
      topics: ["cx-jailed-wire"],
      sources: [B("16.2"), B("10.2"), B("27.2"), B("30.9"), OX_LESIONS],
      refs: [...BOOKS, "pan-jailed-wire-2016", "qin-active-sb-protection-2021", "wang-protective-ballooning-2022", "somendra-modified-jailed-balloon-2025", "johnson-eapci-lm-imaging-2026"],
      blocks: [
        {
          kind: "p",
          text: "Step 2 of Brilakis's provisional sequence is to deploy the MV stent with the SB wire still in the branch, trapped between the stent and the vessel wall. That trapped wire is the jailed wire, and Brilakis advises leaving one whenever the branch has to be kept, whatever the technique. This lesson covers why, how to prepare the wire before you trap it, the debate about which wires to jail, the balloon-based alternatives, and how to get a jailed wire out without breaking it.",
        },
        { kind: "h", text: "Four things a jailed wire does for you" },
        {
          kind: "list",
          ordered: true,
          items: [
            "**It helps keep the branch open, and marks it if it closes.** An occluded branch is invisible; the wire still shows exactly where its ostium is, which guides every rewiring attempt.",
            "**It improves the angle for recrossing.** The trapped wire alters the geometry of the bifurcation in a way that makes reaccess easier.",
            "**It anchors the guide.** It helps seat the guide and adds support for advancing equipment in the later steps.",
            "**It is a rescue route.** In extreme cases you can pass a low-profile balloon (or a torquable microcatheter) along the jailed wire into a closed branch and dilate it to bring flow back (lesson 5).",
          ],
        },
        {
          kind: "check",
          stem: "After MV stenting the diagonal has no flow at all. Which property of the jailed wire matters most at this moment?",
          options: [
            "It increases guide support for advancing a second stent into the LAD",
            "It shows the ostium's position and offers a route for a small rescue balloon",
            "It keeps the stent struts away from the carina while the stent is being deployed",
            "It allows physiology of the diagonal to be measured through the jailed wire itself",
          ],
          answer: 1,
          explanation:
            "With the branch occluded, the wire's value is as a marker of the SB position for rewiring and, if rewiring fails, as a track for a small balloon or torquable microcatheter to restore flow. Support is a real benefit but not the urgent one. A jailed workhorse wire measures nothing, and it does not hold struts away from the carina.",
        },
        { kind: "h", text: "Preparing the wire before it is trapped" },
        {
          kind: "steps",
          items: [
            {
              title: "Pull the SB wire back a little",
              detail:
                "Withdraw it partly so that its radio-opaque segment lies closer to the carina and the wire is easier to see. Do not jail across the radio-opaque segment itself: that may raise the risk of fracture.",
            },
            {
              title: "Make sure the tip is straight",
              detail:
                "A wire with a loop at its tip is harder to pull back later, because the loop can catch on the deployed stent.",
            },
            {
              title: "Keep the jailed segment short",
              detail:
                "Avoid trapping long lengths of wire. In the jailed-wire study Brilakis cites, the length jailed was one of the factors that increased damage to the wire.",
            },
            {
              title: "Handle the wire gently",
              detail:
                "Chapter 27 adds two points on entrapment: avoid aggressive wire manipulation, above all in small branches, and expect entrapment to be more likely when the lesion is severely calcified.",
            },
            {
              title: "Deploy the MV stent",
              detail:
                "Deploy it as in any PCI (pm-prep-and-stent). One link to the jailed branch: among Brilakis's exceptions to routine high-pressure post-dilatation is concern about compromising a large jailed branch.",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-jail-wire-prep" },
        { kind: "h", text: "Which wire should be jailed?" },
        {
          kind: "p",
          text: "Workhorse, hydrophilic-coated and polymer-jacketed wires can all be jailed. The controversy is over polymer-jacketed wires, because the polymer could be stripped as the wire is pulled out and embolise downstream. Brilakis sets out the evidence on both sides:",
        },
        {
          kind: "table",
          head: ["Finding", "Source as cited by Brilakis"],
          rows: [
            ["Polymer-coated wires: 2 of 115 showed any damage, and that mild. Non-polymer-coated wires: 63 of 120 (reported as 55%) were damaged, and in two the core had fractured internally","Microscopy study of wires jailed during provisional stenting (Pan 2016, a randomised trial)"],
            ["Longer jailed length meant more damage; the SB was wired faster with polymer-coated wires", "Same study"],
            ["Embolised polymer jacket material found beyond stented arteries in 10% of hearts at autopsy", "A separate autopsy study, not in the setting of wire jailing"],
          ],
        },
        {
          kind: "p",
          text: "So the randomised microscopy trial found little damage to jailed polymer-coated wires and frequent damage to ordinary ones, but it looked at the wires, not for embolisation downstream; the autopsy finding of polymer embolisation came from a different setting. Brilakis draws no conclusion, and the question is not settled. Note also Brilakis's broader rule from chapter 27 on equipment entrapment: some advocate not jailing the SB wire at all, but in most cases the risk of losing the branch outweighs the risk of the wire becoming trapped.",
        },
        { kind: "h", text: "Jailing a balloon as well as a wire" },
        {
          kind: "p",
          text: "Neither manual teaches it, but later studies have tested leaving a **balloon** in the side branch, alongside the SB wire, while the MV stent is deployed. In one published variant (the modified jailed balloon technique, described in 25 cases with side branches whose anatomy was unsuitable for stenting), a semi-compliant balloon sized to the branch is inflated together with the stent balloon during deployment, followed by POT and recrossing of the branch. The evidence so far is about the branch, not the patient:",
        },
        {
          kind: "list",
          items: [
            "A randomised single-centre trial in non-left-main true bifurcations (340 patients) compared a protective ballooning technique with the jailed wire alone: SB occlusion 0.6% vs 5.4%, with similar major adverse events at 12 months. (The abstract does not describe how the protective ballooning was done.)",
            "A meta-analysis of five studies (1,174 patients) pooled several active side-branch protection strategies (jailed balloon, balloon-stent kissing and jailed microcatheter) against the jailed wire: SB occlusion was roughly halved (risk ratio 0.47 in the fixed-effect model), but periprocedural myocardial infarction and long-term adverse events were not reduced.",
          ],
        },
        {
          kind: "p",
          text: "Neither manual includes these techniques, and the trials so far show an effect on branch occlusion only. The jailed wire remains the manuals' method and the one this module teaches.",
        },
        { kind: "h", text: "Getting a jailed wire out" },
        {
          kind: "p",
          text: "The jailed wire comes out after the SB has been rewired through the stent (lesson 5), and in an occluded branch only after a low-profile balloon has followed the new wire into it. When it will not come:",
        },
        {
          kind: "steps",
          items: [
            {
              title: "1. Do not pull hard",
              detail:
                "Use gentle, constant traction. Pulling hard can fracture or unravel the wire, which may need emergency cardiac surgery, and can drag the guide deep into the vessel and dissect it. A guide pulled in this way can also strike the proximal end of the stent and distort it: in a pre-specified analysis of OCTOBER, unintended stent deformation was found in 9.3% of OCT-guided cases and 18.5% of left main cases, the sites missed or left untreated 55% of these, and those patients had a 23.3% rate of major adverse cardiac events. The 2026 EAPCI and European Bifurcation Club consensus names guide collision during jailed-wire withdrawal as one cause and shows a distorted proximal stent corrected by a repeat POT. So watch the guide while you pull, and afterwards check the proximal stent with imaging or enhanced stent visualisation, repeating POT if it has been deformed.",
            },
            {
              title: "2. Bring a small balloon or microcatheter up to the trap",
              detail:
                "Advance it over the jailed wire all the way to where the wire is caught, then withdraw the wire gently. It focuses the pulling force at the point of entrapment. Chapter 27 adds that a guide extension can be used the same way.",
            },
            {
              title: "3. Inflate a small balloon distally",
              detail:
                "Advance a small balloon as far as it will go over the jailed wire and inflate it to free the wire. Brilakis asks for a repeat POT afterwards.",
            },
            {
              title: "4. Rotate it, gently",
              detail: "Turning the wire with a torquer may release it. Avoid over-rotation, which Brilakis lists, like hard pulling, as a cause of wire fracture (27.2.1.2).",
            },
            {
              title: "5. If all of this fails",
              detail:
                "Chapter 27's further steps: a second wire beside the trapped one with a balloon inflated to free it, and if retrieval still fails, surgery. Brilakis's last resort is to pull hard with a balloon or microcatheter in place, hoping for a clean break rather than unravelling; after any fracture, IVUS shows whether the coil has unravelled (cm-equipment-loss).",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-jailed-wire-removal" },
        {
          kind: "check",
          stem: "The jailed diagonal wire does not move with gentle traction and the guide starts to dive into the left main as you pull. What is the next step Brilakis lists?",
          options: [
            "Pull harder and faster so the wire comes free before the guide moves further",
            "Leave the wire in permanently and cut it at the groin, since it is jailed by the stent",
            "Advance a small balloon or microcatheter to the trap, then pull gently",
            "Inflate a large non-compliant balloon in the LAD stent to open the struts around the wire",
          ],
          answer: 2,
          explanation:
            "Brilakis's first two rules are not to pull hard (fracture, unravelling, guide-induced dissection) and then to advance a small balloon or microcatheter to the trap so the force acts where the wire is caught. Pulling harder is exactly what causes fracture and the deep intubation you are seeing. A large balloon in the MV is not on his list; the balloon he uses goes over the jailed wire itself, followed by a repeat POT.",
        },
        {
          kind: "pitfalls",
          items: [
            "Jailing the radio-opaque segment, a looped tip or a long length of wire.",
            "Aggressive wire manipulation in a small branch, especially in a severely calcified lesion, which makes entrapment more likely.",
            "Removing the jailed wire before a new wire is in the branch, then losing the branch without a marker.",
            "Pulling a stuck jailed wire hard, or over-rotating it: fracture, unravelling, or a guide dissection from deep intubation.",
            "Forgetting the repeat POT after inflating a balloon over the jailed wire to free it.",
            "Letting the guide ride into the stent as the jailed wire comes out, and not checking the proximal stent for deformation afterwards.",
            "Using an active SB protection technique as if it were proven to improve clinical outcomes; so far it reduces branch occlusion only.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you deploy, look at the jailed wire on the screen and ask three questions: is its radio-opaque segment just beyond the carina but not under the stent, is the tip straight, and is the trapped length short? These are the preparation points Brilakis gives against fracture, entanglement on withdrawal and wire damage.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, before deploying the LAD stent, describe where you would leave a diagonal wire: radio-opaque segment just beyond the carina but not under the stent, straight tip, short jailed length. Then talk through the five steps you would take if it would not come out.",
        },
        { kind: "video", id: "wz0pmiWGGb0", note: "CTO Manual case 308: the jailed side branch." },
        { kind: "video", id: "eV1blkBd2bQ", note: "Case 19: a provisional stenting complication." },
        {
          kind: "keypoints",
          items: [
            "Jail the SB wire whenever the SB must be preserved: it keeps it open, marks it, improves the recrossing angle, anchors the guide and is a rescue route.",
            "Before jailing: radio-opaque segment near the carina but not trapped, straight tip, short jailed length; avoid aggressive manipulation in small branches, and expect entrapment more often in severe calcification.",
            "In the randomised microscopy study, polymer-coated jailed wires were rarely damaged and ordinary wires often were; polymer embolisation has been found at autopsy, but not in a jailing study, and embolisation was not assessed in the trial.",
            "Active SB protection (jailed balloon, balloon-stent kissing, jailed microcatheter) reduced SB occlusion but not periprocedural infarction or adverse events.",
            "Stuck wire: no hard pulling; small balloon or microcatheter to the trap; inflate a small balloon distally then repeat POT; rotate with a torquer, avoiding over-rotation (it can fracture the wire); then chapter 27's escalation.",
            "Pulling the jailed wire can bring the guide into the proximal stent and deform it (unintended stent deformation from any cause, guide collision during jailed-wire withdrawal among them, was found in 18.5% of left main cases in OCTOBER): watch the guide, check the proximal stent, and repeat POT if it is distorted.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-provisional-pot",
      title: "The proximal optimisation technique",
      minutes: 11,
      topics: ["cx-pot"],
      sources: [B("16.2"), B("10.2"), B("17.10"), B("25.2"), OX_TECH],
      refs: [...BOOKS, "andreasen-final-pot-2020"],
      blocks: [
        {
          kind: "p",
          text: "Step 3 of Brilakis's sequence is the proximal optimisation technique (POT): a short balloon inflated only in the part of the MV stent that lies proximal to the carina. It is how one stent sized for the small distal vessel is made to fit the larger proximal vessel. The Oxford handbook strongly recommends POT together with a final kissing inflation after T and TAP stenting, and Brilakis builds it into provisional, TAP, reverse crush, DK crush and culotte.",
        },
        { kind: "h", text: "Why it is needed" },
        {
          kind: "list",
          items: [
            "Vessels taper, and at a bifurcation the step down from proximal to distal MV can be large. A stent sized to the distal MV (as it must be, lesson 2) is undersized and poorly apposed proximally until it is post-dilated there.",
            "**What POT does**: it optimises expansion and apposition of the stent proximal to the carina, most of all when there is a big diameter mismatch, and it opens the stent cells, which makes it easier to cross into the SB through a distal strut later.",
            "In DK crush, Brilakis adds that POT stops the wire going back into the SB from passing underneath the MV stent; in the provisional sequence, too, POT comes before any rewiring.",
            "Chapter 10 lists three ways to prevent SB occlusion after stenting: wire important side branches before stenting, balloon or stent the SB before stenting the MV, and perform POT proximal to the carina. (Its causes are jailing of the SB ostium and plaque and carina shift.) On SB preparation in provisional stenting, see lesson 2.",
          ],
        },
        { kind: "h", text: "The balloon: diameter, length, position" },
        {
          kind: "steps",
          items: [
            {
              title: "Diameter = the proximal MV",
              detail:
                "Size the POT balloon to the proximal MV diameter. An oversized POT balloon is one of the things Brilakis lists as increasing the likelihood of SB compromise, alongside significant ostial SB disease and an oversized MV stent.",
            },
            {
              title: "Length ≤ the stent proximal to the carina",
              detail:
                "The balloon must be as long as, or shorter than, the segment of stent proximal to the carina. Shorter is acceptable: you inflate several times, moving the balloon between inflations. Longer is not: the balloon would injure the MV proximal to the stent and raise the risk of restenosis.",
            },
            {
              title: "Distal marker at the carina",
              detail:
                "Brilakis places the distal marker at the carina (cx-bif-provisional says just proximal to it; either way, never beyond it). Too distal, and the oversized balloon may compromise the SB. Too proximal, and the stent stays underexpanded right next to the SB ostium, which is the part POT is for. The marker is not necessarily where the inflated balloon ends: designs differ in cone angle and in where the shoulders sit relative to the markers, so know the balloon you are using (Andreasen 2020).",
            },
            {
              title: "Inflate, deflate, remove",
              detail:
                "Brilakis does not name a balloon type for POT; his general post-dilatation balloon is a shorter non-compliant one (10.2; pm-prep-and-stent). Then assess the SB (lesson 5).",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-pot-size-position" },
        {
          kind: "check",
          stem: "After deploying a 3.0 mm stent across the diagonal, 9 mm of stent lies proximal to the carina, and the proximal LAD is 3.5 mm. Which POT balloon and position follow Brilakis?",
          options: [
            "3.5 × 8 mm, distal marker at the carina",
            "3.5 × 15 mm, centred on the carina",
            "3.0 × 8 mm, distal marker at the carina",
            "3.5 × 12 mm, distal marker just beyond the carina",
          ],
          answer: 0,
          explanation:
            "Diameter matches the proximal MV (3.5 mm), length fits within the 9 mm of proximal stent, and the distal marker sits at the carina. A balloon centred on the carina puts half its length into the distal MV, so its distal marker is far beyond the carina and the oversized balloon may compromise the SB; at 15 mm it is also longer than the stent proximal to the carina. A 3.0 mm balloon adds nothing proximally. A 12 mm balloon is longer than the 9 mm proximal segment and a distal marker beyond the carina risks SB compromise.",
        },
        {
          kind: "table",
          caption: "POT errors and what they cause (Brilakis 16.2.10.1)",
          head: ["Error", "Consequence", "Fix"],
          rows: [
            ["Distal marker beyond the carina", "May compromise the SB", "Pull back until the marker is at the carina"],
            ["Distal marker well proximal to the carina", "MV stent not optimally expanded beside the SB ostium", "Advance to the carina"],
            ["Balloon longer than the proximal stent segment", "Injury to unstented proximal MV; more restenosis", "Shorter balloon, or a longer stent next time"],
            ["Balloon shorter than the proximal stent segment", "None if handled: needs more than one inflation", "Inflate, reposition, inflate again"],
            ["Balloon oversized for the proximal MV", "More SB compromise", "Size 1:1 to the proximal MV"],
          ],
        },
        { kind: "h", text: "POT again: after kissing, and after rescue manoeuvres" },
        {
          kind: "list",
          items: [
            "**Final POT** after kissing: two balloons side by side in the proximal stent leave it oval. Final POT may not be needed if the kiss gave a good result, but Brilakis advises considering it to correct that ovalisation (the Academy lesson cx-bif-provisional repeats POT after every kiss; Brilakis makes it a consideration). Brilakis's POT rule puts the distal marker at the carina; one bench study (Andreasen 2020, narrow-angle phantom) found that a final POT across the SB takeoff narrowed the opened cell in front of the SB, while one kept entirely proximal to the takeoff caused little or no reduction (about 4%) (lesson 5).",
            "**After freeing a jailed wire** with a balloon inflated over it, repeat the POT (lesson 3).",
            "**After TAP** (cp-bifurcation-two-stent), the final POT balloon's distal marker goes just proximal to the neocarina formed by the SB stent's protruding struts, so that it does not crush them.",
            "In the left main, Brilakis notes the stents must be able to expand to the left main diameter, which is what POT asks of them (cp-left-main).",
          ],
        },
        {
          kind: "check",
          stem: "You have just finished a kissing inflation after rewiring the diagonal. The angiogram looks good. Why might you still perform a final POT?",
          options: [
            "To reshape the proximal stent, made oval by the two balloons",
            "To dilate the diagonal ostium further with the larger balloon in the main vessel",
            "Because kissing inflation always leaves the distal main vessel underexpanded",
            "To push the jailed wire's tip further into the distal side branch for support",
          ],
          answer: 0,
          explanation:
            "Brilakis's reason for final POT is the oval deformation of the proximal MV stent caused by two balloons inflated together in it; it may be unnecessary if the kiss gave an excellent result, but should be considered. A POT balloon sits proximal to the carina and does not treat the SB ostium or the distal MV, and by this stage the jailed wire has already been removed.",
        },
        {
          kind: "pitfalls",
          items: [
            "A POT balloon centred on the carina or with its distal marker in the distal MV.",
            "A POT balloon longer than the stent proximal to the carina, injuring unstented vessel.",
            "Skipping POT when the proximal MV is much bigger than the distal, leaving the proximal stent poorly apposed and the cells smaller for rewiring.",
            "Forgetting to repeat POT after freeing a jailed wire with a balloon, and forgetting to consider a final POT after kissing.",
          ],
        },
        {
          kind: "pearl",
          text: "Position the POT balloon in the view that best lays out the carina, with the jailed wire visible: the jailed wire shows where the SB leaves the MV, so the distal marker can be placed at the carina rather than guessed.",
        },
        { kind: "sim", sim: "pci-bench", task: "After deploying a stent sized to the distal main vessel, perform POT with a non-compliant balloon sized to the proximal reference and no longer than the proximal stent segment, with its distal marker at the carina; then repeat with the marker 3 mm too distal and too proximal and compare the proximal apposition and the side-branch ostium." },
        { kind: "video", id: "s9aKkOfiBio", note: "Manual of PCI chapter 16.2: provisional bifurcation stenting." },
        { kind: "video", id: "2z7WipFuPnI", note: "Case 115: provisional bifurcation stenting troubleshooting." },
        {
          kind: "keypoints",
          items: [
            "POT: a short balloon inflated in the stent proximal to the carina, to fit a distally sized stent to the proximal MV.",
            "Diameter: proximal MV. Length: equal to or shorter than the stent proximal to the carina. Distal marker: at the carina.",
            "Too distal: SB compromise. Too proximal: underexpansion beside the SB ostium. Too long: injury and restenosis proximally. Oversized: SB compromise.",
            "POT opens the cells and eases distal-strut rewiring; in DK crush Brilakis adds that it stops the wire back into the SB from passing under the MV stent.",
            "Consider a final POT after kissing to correct ovalisation (it may not be needed after a good kiss); repeat POT after a balloon has been inflated over the jailed wire.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-bifurcation-provisional-sb",
      title: "Provisional stenting III: judging the side branch, rewiring and kissing",
      minutes: 15,
      topics: ["cx-kissing", "cx-provisional"],
      sources: [B("16.1"), B("16.2"), B("12.1"), B("17.10"), B("17.12"), B("10.2"), B("9.7"), B("25.2"), B("30.6"), B("30.9"), OX_LESIONS, OX_TECH],
      refs: [...BOOKS, "koo-jailed-sb-ffr-2005", "chen-dkcrush6-2015", "nordic-baltic3-2011", "october-2023", "esc-ccs-2024", "finet-fractal-2008", "andreasen-final-pot-2020", "murasato-propot-2022", "yamawaki-propot-oct-2023"],
      blocks: [
        {
          kind: "p",
          text: "Step 4 is the decision the whole strategy hinges on: after the MV stent and POT, is the side branch compromised? Brilakis's flow chart has three exits: the branch is fine (stop), compromised but open (rewire, kiss, final POT), or occluded (rewire if you can, rescue over the jailed wire if you cannot). This lesson works through each exit.",
        },
        { kind: "h", text: "Step 4: is the side branch compromised?" },
        {
          kind: "table",
          head: ["How to look", "What it tells you"],
          rows: [
            ["Antegrade flow", "Reduced or absent flow means the SB is compromised. Brilakis's threshold for an important SB: TIMI flow below 3"],
            ["Luminal stenosis", "Diameter stenosis over 70% counts as compromise, but the eye frequently overestimates a jailed ostium"],
            ["Dissection", "NHLBI type B or worse counts as compromise"],
            ["Physiology", "Adenosine FFR of 0.80 or less in a branch of 2 mm or more: treat further (at or below this value the risk of later adverse events is higher, 12.1). Above 0.80: leave it. Not valid in the culprit vessel of an acute coronary syndrome: Brilakis limits physiology in ACS to non-culprit lesions, so a jailed branch of the culprit artery is judged by flow, stenosis, dissection, ECG and imaging. Intracoronary nitroglycerin first may reverse spasm. The pressure wire has to reach the SB through the MV stent struts (the jailed workhorse wire lies outside the stent and measures nothing). Keep the jailed wire in place while you decide: Brilakis removes it only after the SB has been rewired (16.2.10.1)"],
            ["Intravascular imaging", "IVUS or OCT can grade the SB ostial stenosis"],
          ],
        },
        {
          kind: "p",
          text: "The over-reading is substantial. In the study of jailed branches that Brilakis cites (Koo 2005: branches over 2.0 mm with more than 50% narrowing on visual estimate after MV stenting), no branch with less than 75% stenosis had an FFR below 0.75, and of 73 branches with 75% or more, only 20 were functionally significant. (That study reported FFR against 0.75; the treatment threshold Brilakis teaches is 0.80.) Significant ostial SB disease before stenting, an oversized MV stent and an oversized POT balloon all make compromise more likely. Chapter 25 adds dissection and a large plaque burden as causes, with ECG changes as a sign.",
        },
        {
          kind: "p",
          text: "**Does physiology change outcomes?** One randomised trial answers this. DKCRUSH-VI (320 patients with Medina 1,1,1 or 0,1,1 bifurcations treated by provisional stenting) compared side-branch treatment guided by an SB FFR under 0.80 with treatment guided by angiographic criteria matching Brilakis's (TIMI flow under 3, ostial stenosis over 70%, or a dissection worse than type A). FFR guidance led to fewer attempts to stent the side branch (25.9% vs 38.1%), and major adverse cardiac events at 1 year were 18.1% in both groups. Physiology spares the patient a second stent; it has not been shown to prevent events.",
        },
        { kind: "tip", id: "pci-bif-assess-side-branch" },
        {
          kind: "check",
          stem: "After MV stenting and POT, a 2.5 mm diagonal looks 75% narrowed at its ostium. Flow is TIMI 3, there is no dissection, and the patient is pain-free with an unchanged ECG. It is a stable patient. What do you do?",
          options: [
            "Stent the diagonal with TAP, because a 75% ostial narrowing is above Brilakis's 70% threshold",
            "Kiss straight away, because Oxford advises a final kiss whatever the technique",
            "Measure FFR in the diagonal: treat it further only if 0.80 or less",
            "Remove the jailed wire and finish, because the diagonal is under 3 mm",
          ],
          answer: 2,
          explanation:
            "The only sign of compromise is angiographic. A 75% stenosis does meet Brilakis's over-70% definition of compromise, but he also warns that the eye frequently overestimates jailed ostia (in Koo's series most 75% or worse jailed branches were not functionally significant) and uses FFR to decide: 0.80 or less in a branch of at least 2 mm needs further treatment; above 0.80 does not. Even if it were treated, his next step would be rewiring and kissing (4b), not TAP. Kissing straight away is defensible on Oxford's advice (a final kiss whatever the technique), but it does not answer the question this branch poses, whether it is ischaemic. Size alone does not make a 2.5 mm branch unimportant.",
        },
        { kind: "h", text: "Exit 4a: not compromised" },
        { kind: "p", text: "The procedure is done: Brilakis's chart (Fig. 16.9) takes you straight to the end. Intravascular imaging can still be used to check stent expansion (16.2.13)." },
        { kind: "h", text: "Exit 4b: compromised but open" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Rewire the SB through a distal strut",
              detail:
                "Cross from inside the MV stent into the SB through a cell close to the carina. Distal-cell recrossing scaffolds the SB ostium better; a proximal cell pushes the struts inwards, into the MV lumen. Brilakis usually uses a new wire, although some operators rewire with the MV wire, to avoid a new wire passing behind the stent struts (substent wiring). Some pass the rewiring wire through a microcatheter, then advance the microcatheter into the SB to help the next balloon follow.",
            },
            {
              title: "How to land in a distal cell",
              detail:
                "Advance beyond the carina, aim the tip at the branch and withdraw slowly; when the tip falls into the branch origin, push forward through that cell. OCT can confirm that the crossing was distal.",
            },
            {
              title: "2. Remove the jailed wire",
              detail: "Only now, with a new wire in the branch (lesson 3 if it is stuck).",
            },
            {
              title: "3. Kissing balloon inflation",
              detail:
                "Inflate a balloon in the SB and one in the MV together. Brilakis: not always necessary, but it can improve the geometry of the stent and the coverage of the SB ostium and make later access to the SB easier. Short non-compliant balloons are the usual choice, though they deliver less easily; compliant ones are acceptable if you keep high-pressure inflations few.",
            },
            {
              title: "An alternative to the kiss",
              detail:
                "Brilakis describes kissing only, and Oxford kissing and POT. The Academy lesson cx-bif-provisional also teaches POT–side–POT: SB dilatation through the rewired cell, then a repeat POT. A bench study in a narrow-angle (30°) phantom (Andreasen 2020) tested it alongside kissing. A final POT with the balloon across the SB takeoff, which is where a balloon with its distal marker at the carina lies, shrank the opened cell in front of the SB and could rejail the branch when a metallic carina was present; the loss was greatest after POT–side–POT with proximal-cell wiring. A final POT placed entirely proximal to the takeoff caused little or no reduction. The same study found that POT–side–POT needs a final POT across the takeoff to correct the malapposition opposite the SB. In patients, the randomised PROPOT trial (120 patients with crossover stenting, OCT end points) compared POT followed by SB dilatation with kissing: bifurcation stent failure at the end of the procedure was similar (27% with POT and SB dilatation, 32% with kissing; the authors found no favourable trend for POT), unplanned additional procedures were more frequent with POT (38% vs 25%), and in its OCT analysis major malapposition was more common after POT and SB dilatation (35% vs 17%). Clinical outcome data are lacking. Brilakis, for his part, places the POT marker at the carina and teaches kissing.",
            },
            {
              title: "4. Final POT",
              detail: "Consider it to correct the oval deformation the kiss leaves in the proximal stent (lesson 4). For where to put the balloon, weigh the bench finding above: a final balloon kept proximal to the SB takeoff left the newly opened cell almost untouched.",
            },
            {
              title: "5. Still not good?",
              detail:
                "Stent the SB: TAP, reverse crush or culotte (cp-bifurcation-two-stent). The Oxford handbook names T-stenting, TAP and culotte as the commonest bail-out two-stent techniques after provisional. On angle the manuals differ: Brilakis's chart lists TAP for 70–90° and reverse crush or culotte below 70°, whereas Oxford prefers TAP whenever the angle is under 90°, and the Academy lesson cx-bif-provisional uses TAP as the usual bail-out. Either way, the SB stent comes only after rewiring, kissing and repeat POT have left a poor result.",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-rewire-distal-cell" },
        {
          kind: "formula",
          name: "Finet's law applied to kissing balloons (Brilakis 16.2)",
          expr: "Effective diameter of two balloons inflated side by side = 0.678 × (diameter of balloon 1 + diameter of balloon 2)",
          note: "Brilakis asks for the effective diameter to be similar to the proximal MV diameter. Finet derived the 0.678 coefficient from native coronary bifurcations, not from balloons, so treat the result as a guide. The Academy lesson cx-bif-provisional sizes non-compliant balloons to each distal branch and corrects the oval proximal stent with a final POT. Example: in a 3.5 mm proximal MV, a 3.0 mm MV balloon with a 2.5 mm SB balloon gives 0.678 × 5.5 ≈ 3.73 mm, and 2.75 + 2.5 gives 3.56 mm; both are similar to 3.5 mm, whereas 3.5 + 2.5 gives 4.07 mm.",
        },
        { kind: "tip", id: "pci-bif-kissing-size" },
        {
          kind: "check",
          stem: "Proximal LAD 3.5 mm, distal LAD 3.0 mm, diagonal 2.5 mm. You are about to kiss after rewiring the diagonal. Which balloon pair gives an effective diameter closest to the proximal LAD?",
          options: [
            "3.5 mm in the LAD with 3.0 mm in the diagonal",
            "3.0 mm in the LAD with 3.0 mm in the diagonal",
            "3.0 mm in the LAD with 2.5 mm in the diagonal",
            "2.5 mm in the LAD with 2.0 mm in the diagonal",
          ],
          answer: 2,
          explanation:
            "0.678 × (3.0 + 2.5) = 3.73 mm, similar to the 3.5 mm proximal LAD, which is Brilakis's rule; it also happens to match each balloon to its distal branch, the Academy lesson's convention. 3.5 + 3.0 gives 4.41 mm and 3.0 + 3.0 gives 4.07 mm, both overstretching the proximal vessel; 2.5 + 2.0 gives 3.05 mm, too small to shape the proximal stent and undersized for both branches. A final POT then corrects the oval proximal stent.",
        },
        { kind: "h", text: "Exit 4c: occluded" },
        {
          kind: "steps",
          title: "If rewiring is feasible",
          items: [
            { title: "1. Rewire through a distal strut", detail: "As in 4b, with the jailed wire as your landmark." },
            {
              title: "2. Prove the wire is inside the stent before pulling the jailed wire",
              detail:
                "Remove the jailed wire only after a low-profile balloon has followed the new wire into the SB. This proves that the new wire is inside the struts rather than behind the stent.",
            },
            { title: "3. Kiss, 4. final POT", detail: "As in 4b." },
            { title: "5. Still suboptimal", detail: "Stent the SB: T-stenting, TAP, reverse crush or culotte." },
          ],
        },
        {
          kind: "steps",
          title: "If rewiring is not feasible",
          items: [
            {
              title: "1. A small balloon over the jailed wire",
              detail:
                "Advance a 1.0–1.5 mm balloon over the jailed wire, partly into the occluded SB. If no balloon will pass, try a torquable microcatheter: rotating it into the branch often opens a track that a balloon can then follow.",
            },
            { title: "2. Inflate to restore antegrade flow", detail: "This dilates the branch outside the MV stent, between the stent and the vessel wall." },
            {
              title: "Option 1: now rewire through the MV struts",
              detail:
                "Ideally with a dual-lumen microcatheter, because the balloon has lifted the struts and a new wire can easily slip behind them (handling tips below). Then remove the jailed wire, kiss and finish with POT; stent the SB if the result is still poor.",
            },
            {
              title: "Option 2: inverted DK crush",
              detail: "Convert to DK crush with the roles swapped: the SB is treated as the main vessel and the MV as the side branch (cp-bifurcation-two-stent).",
            },
          ],
        },
        { kind: "tip", id: "pci-bif-confirm-inside-struts" },
        { kind: "tip", id: "pci-bif-occluded-sb-rescue" },
        {
          kind: "list",
          items: [
            "**Kit that helps** (Brilakis chapter 30): very small balloons for jailed side branches (at the time of writing the lowest-profile balloon was 1.0 mm in the United States and 0.85 mm in Europe); low-profile balloons with a skived tip, suited to crossing stent struts and ballooning jailed branches; a microcatheter, which is also useful once a side branch has been rewired through the struts; dual-lumen microcatheters for wiring a side branch alongside a wire already in place, including a branch jailed by a stent.",
            "**Handling a dual-lumen microcatheter** (30.6.4): it can be hard to deliver (some models come with a stiffening mandrel for the over-the-wire lumen), and its side port can be hard to aim, which may mean taking it out and reinserting it. Once the branch is wired, keeping both wire tips in place while you withdraw the microcatheter is difficult; Brilakis does it best with a trapping balloon.",
            "**Enhanced stent visualisation** can confirm that the SB ostium is covered and whether the stent has been deformed.",
          ],
        },
        { kind: "h", text: "Routine kissing: the books disagree" },
        {
          kind: "table",
          head: ["Source", "Position"],
          rows: [
            ["Brilakis 16.2", "Kissing is not always necessary in provisional stenting; it is done for a compromised SB, and a final POT is then considered"],
            ["Brilakis 17.10", "No clear benefit from routine kissing after provisional stenting of the left main bifurcation"],
            ["Oxford handbook, Bifurcation lesions", "Recommends finishing every bifurcation technique with a kiss, for full stent expansion and a well-shaped carina, and states that kissing improves outcomes"],
            ["Oxford handbook, DES box", "On recent evidence, further work on the SB after DES makes no difference to outcomes unless the branch closes"],
            ["Nordic-Baltic Bifurcation Study III", "477 patients after MV stenting, randomised to final kiss or not: 6-month adverse events 2.1% with the kiss vs 2.5% without (no difference); angiographic SB restenosis at 8 months, in the 326 patients with angiographic follow-up, 7.9% with the kiss vs 15.4% without (true bifurcations 7.6% vs 20.0%); longer procedures and more contrast with the kiss"],
          ],
        },
        {
          kind: "p",
          text: "Reconciled: in provisional stenting, kiss when the SB is compromised and you have rewired it, then consider a final POT to correct the oval deformation (Brilakis: it may not be needed if the kiss gave a good result). In Nordic-Baltic III a routine kiss after MV stenting did not change clinical events at 6 months but did reduce angiographic restenosis of the branch; the authors noted that longer-term data on stent thrombosis were still needed. Kissing in two-stent techniques is a different matter and is taught in cp-bifurcation-two-stent.",
        },
        {
          kind: "check",
          stem: "The diagonal occluded after MV stenting. You have recrossed with a new wire and are about to pull the jailed wire. What must happen first?",
          options: [
            "A contrast injection showing the new wire in the distal diagonal",
            "A final POT, so the stent is fully apposed before the jailed wire moves",
            "A low-profile balloon advanced over the new wire into the diagonal",
            "A kissing inflation with the jailed wire still in place for support",
          ],
          answer: 2,
          explanation:
            "A wire can look perfectly placed in the distal branch on contrast and still have passed under the MV stent. Brilakis keeps the jailed wire until a low-profile balloon has followed the new wire into the SB, which shows the wire is inside the struts. A wire under the stent cannot be used to treat the branch through the stent: equipment may fail to follow it (Brilakis Fig. 9.10), and imaging identifies it (16.2.13). A kiss with the jailed wire still trapped is not part of the sequence.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating a jailed SB because it looks narrowed, without physiology or imaging.",
            "Rewiring through a proximal cell, leaving struts across the SB ostium.",
            "Pulling the jailed wire before a new wire is safely in the branch, or, in an occluded branch, before a balloon has followed it.",
            "Choosing kissing balloons without checking the pair against the proximal MV, and overstretching the proximal stent.",
            "Leaving an oval proximal stent after kissing without considering a final POT.",
            "Rewiring after ballooning over the jailed wire without a dual-lumen microcatheter, and slipping behind the lifted struts.",
          ],
        },
        {
          kind: "pearl",
          text: "Rewire by pulling, not pushing. With the new wire parked beyond the carina and its tip aimed at the branch, slow withdrawal lets it fall into the cell beside the carina, which is the distal cell you want; OCT can confirm it.",
        },
        {
          kind: "list",
          items: [
            "**Use intravascular imaging in true and complex bifurcations.** The 2024 ESC chronic coronary syndromes guideline recommends IVUS or OCT guidance for anatomically complex lesions, including true bifurcations, and OCTOBER (1,201 patients with complex bifurcation lesions) found fewer major adverse cardiac events at 2 years with OCT guidance than with angiography guidance (10.1% vs 14.1%); both postdate the manuals. Brilakis lists what imaging gives you: lesion size and length, calcium, stent expansion and the cause of complications such as a wire under the stent (pm-imaging).",
          ],
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, treat the nearest diagonal as jailed after LAD stenting: state the three findings that would make it compromised (TIMI flow, stenosis, dissection), what FFR value would leave it alone, and the order of steps if it occluded (rewire distal cell, balloon into the branch before pulling the jailed wire, kiss with Finet-sized balloons, final POT).",
        },
        { kind: "sim", sim: "physiology", task: "Measure adenosine FFR in a jailed side branch after main-vessel stenting: give intracoronary nitroglycerin first, then decide by the 0.80 cut-off and the 2 mm size criterion whether the branch needs anything more." },
        { kind: "video", id: "7F-mb2GMs1U", note: "Elias Hanna on wiring techniques: rewiring through stent struts in bifurcation cases." },
        { kind: "video", id: "3QkYr3OtFNg", note: "Case 180: bifurcation troubleshooting." },
        { kind: "video", id: "9SL7BnPzFvw", note: "Case 59: double provisional." },
        {
          kind: "keypoints",
          items: [
            "Compromised SB (Brilakis): TIMI flow under 3, diameter stenosis over 70%, or NHLBI dissection type B or worse.",
            "The eye overestimates a jailed ostium; adenosine FFR 0.80 or less in a branch of 2 mm or more means treat, above 0.80 means leave (not in the culprit vessel of an ACS). In DKCRUSH-VI, FFR guidance meant fewer SB stents than angiographic criteria, with the same 1-year events.",
            "Compromised but open: rewire a distal strut, remove the jailed wire, kiss, consider final POT; SB stent only if still poor.",
            "Occluded: rewire and prove it with a low-profile balloon before pulling the jailed wire; if rewiring fails, 1.0–1.5 mm balloon over the jailed wire, then rewire through a dual-lumen microcatheter, or inverted DK crush.",
            "Kissing balloons: 0.678 × (sum of diameters) should be similar to the proximal MV (a guide: Finet derived it from native vessels); a final POT corrects the oval proximal stent.",
            "In Nordic-Baltic III, a routine final kiss after MV stenting did not change 6-month clinical events but reduced angiographic SB restenosis (Brilakis: not always necessary; Oxford: advisable).",
            "Use IVUS or OCT in true and complex bifurcations (2024 ESC CCS guideline; OCTOBER).",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-bifurcation-provisional-q1",
      stem: "Brilakis's bifurcation algorithm asks two questions before any technique is chosen. Which pair is it?",
      options: [
        "Is the Medina code 1,1,1? Is the bifurcation angle under 70°?",
        "Does the SB need preserving? How likely is it to occlude after MV stenting?",
        "Is the guide at least 7 Fr? Can both branches be wired with workhorse wires?",
        "Is the SB larger than 2.75 mm? Is its ostial lesion longer than 10 mm?",
      ],
      answer: 1,
      explanation:
        "Brilakis first asks whether the SB must be preserved (size, with branches under 2 mm usually not, and territory) and then how likely it is to occlude (Medina, SB severity, morphology, angle). Only then do Medina 0,1,1, emergency status and the angle pick a technique. Medina and angle are later questions; guide size is a planning point; the 2.75 mm and 10 mm figures are not part of Brilakis's two questions (an SB lesion length of 10 mm or more belongs to the DEFINITION complexity criteria, a later step).",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q2",
      stem: "Which finding after MV stenting does Brilakis count as compromise of an important side branch?",
      options: [
        "Diameter stenosis of 60% at the SB ostium with TIMI 3 flow",
        "NHLBI type A dissection at the SB ostium with TIMI 3 flow",
        "TIMI 2 flow in the SB, without visible dissection",
        "Any narrowing of the ostium compared with the baseline angiogram",
      ],
      answer: 2,
      explanation:
        "His criteria are TIMI flow under 3, diameter stenosis over 70%, or NHLBI dissection type B or worse; TIMI 2 meets the first. A 60% stenosis and a type A dissection fall below his thresholds, and any change from baseline is not a criterion, especially since the eye overestimates jailed ostia.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q3",
      stem: "The MV stent has 7 mm proximal to the carina and the proximal MV is 4.0 mm. Which POT is correct?",
      options: [
        "4.0 × 6 mm non-compliant balloon, distal marker at the carina",
        "4.0 × 12 mm non-compliant balloon, distal marker at the carina",
        "4.0 × 6 mm non-compliant balloon, distal marker 3 mm into the distal MV",
        "3.5 × 6 mm non-compliant balloon, distal marker 3 mm proximal to the carina",
      ],
      answer: 0,
      explanation:
        "The balloon matches the proximal MV, is no longer than the 7 mm of proximal stent, and its distal marker is at the carina. A 12 mm balloon would injure unstented proximal vessel and raise restenosis. A marker in the distal MV risks SB compromise. An undersized balloon placed well proximal leaves the stent underexpanded next to the SB ostium.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q4",
      stem: "Why does Brilakis rewire a compromised side branch through a distal strut, close to the carina?",
      options: [
        "A distal cell is the largest cell after POT, so the next balloon crosses it with the least force",
        "It scaffolds the SB ostium better; proximal recrossing pushes struts into the MV lumen",
        "Distal recrossing keeps the new wire well away from the jailed wire, so the two cannot wrap",
        "Distal cells are the only cells that a dual-lumen microcatheter can enter without damage",
      ],
      answer: 1,
      explanation:
        "The reason Brilakis gives, with the figure he reproduces from Sawaya 2016 (Fig. 16.11), is scaffolding: dilating through the distal cell pushes struts to cover the SB ostium, while a proximal crossing leaves struts pushed inwards into the MV lumen. POT does open cells and ease crossing, but that is why POT comes first, not why the distal cell is chosen. The other two statements are not in either manual.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q5",
      stem: "Proximal MV 3.75 mm, distal MV 3.0 mm, SB 2.5 mm. Using Finet's law, which kissing pair best matches the proximal MV?",
      options: [
        "3.0 mm MV balloon with 2.5 mm SB balloon",
        "3.5 mm MV balloon with 3.0 mm SB balloon",
        "3.75 mm MV balloon with 2.5 mm SB balloon",
        "2.5 mm MV balloon with 2.0 mm SB balloon",
      ],
      answer: 0,
      explanation:
        "0.678 × (3.0 + 2.5) = 3.73 mm, the closest to 3.75 mm. 3.5 + 3.0 gives 4.41 mm and 3.75 + 2.5 gives 4.24 mm, both oversized for the proximal stent; 2.5 + 2.0 gives 3.05 mm, too small to shape it. Brilakis asks for the effective diameter of the two balloons to be similar to the proximal MV.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q6",
      stem: "After MV stenting the SB is occluded and repeated attempts to rewire it through the stent fail. What does Brilakis do next?",
      options: [
        "Remove the jailed wire and use it to rewire, since it already has the right tip shape",
        "Stent the SB straight away with TAP, since TAP needs no rewiring",
        "Advance a 1.0–1.5 mm balloon over the jailed wire partly into the SB and inflate it",
        "Inflate a balloon in the MV stent at high pressure to open its struts over the SB",
      ],
      answer: 2,
      explanation:
        "His 4c 'no' branch is to pass a 1.0–1.5 mm balloon along the jailed wire, or a torquable microcatheter rotated into the branch if no balloon will pass, to restore flow; then rewire through the struts (ideally via a dual-lumen microcatheter) or convert to inverted DK crush. Pulling the jailed wire throws away the marker and rescue route. Brilakis does call TAP simple because no rewiring is needed after the SB stent is placed, but TAP starts from an SB that has already been rewired through the MV stent, kissed and post-dilated with POT, so it cannot rescue a branch you cannot re-enter.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q7",
      stem: "In the situation of question 6, you have ballooned over the jailed wire and flow is back. Why does Brilakis prefer a dual-lumen microcatheter for the rewiring that follows?",
      options: [
        "The ballooning has lifted the MV struts, and a new wire can easily pass behind them",
        "It lets you measure the pressure in the SB at the same time as wiring it",
        "It allows the jailed wire to be withdrawn through the second lumen without traction",
        "It is the only device stiff enough to cross freshly dilated plaque in the branch",
      ],
      answer: 0,
      explanation:
        "Ballooning outside the MV stent lifts its struts away from the wall, creating space for a new wire to go behind them; the dual-lumen microcatheter guides the new wire through the struts instead. A wire that has passed behind the struts cannot be used to treat the branch through the stent. The other options describe functions the device does not have in this setting.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q8",
      stem: "A jailed workhorse wire will not come out with gentle traction. You advance a microcatheter to the entrapment and pull gently: still stuck. What is Brilakis's next step in chapter 16?",
      options: [
        "Pull hard with the microcatheter in place, accepting the chance of a clean fracture",
        "Advance a small balloon distally over the jailed wire, inflate it, then repeat POT",
        "Refer immediately for surgery, since a stuck jailed wire cannot be freed percutaneously",
        "Deploy a second stent over the MV wire so the jailed wire is trapped there permanently",
      ],
      answer: 1,
      explanation:
        "After no hard pulling and a balloon or microcatheter to the trap, his next step is a small balloon advanced distally over the jailed wire and inflated to free it, followed by a repeat POT; gentle rotation with a torquer may also help (gentle, because chapter 27 lists over-rotation among the causes of wire fracture). A deliberate hard pull is his 'last straw' option from chapter 27 after everything else, including surgery being considered. Stenting over the wire is not on his list for a jailed wire.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q9",
      stem: "Which statement about routine final kissing after provisional MV stenting is best supported?",
      options: [
        "Both manuals recommend it in every case, because it improves survival",
        "Neither manual mentions it, as it was introduced after both were published",
        "In Nordic-Baltic III it cut 6-month adverse events by about half",
        "In Nordic-Baltic III, clinical outcomes were similar but SB restenosis fell",
      ],
      answer: 3,
      explanation:
        "In Nordic-Baltic III, 6-month adverse events were 2.1% with a final kiss and 2.5% without (no difference), while SB restenosis at 8 months fell from 15.4% to 7.9%. The manuals differ: Brilakis says kissing is not always necessary and finds no clear benefit of routine kissing after provisional left main stenting, while the Oxford handbook calls a final kiss advisable regardless of technique. Neither claims a survival benefit.",
      difficulty: 3,
      refs: [...BOOKS, "nordic-baltic3-2011"],
    },
    {
      id: "cp-bifurcation-provisional-q10",
      stem: "A heavily calcified distal LAD lesion just beyond a large diagonal needs rotational atherectomy. You want to keep the diagonal wire in. Which set-up does Brilakis describe for a 1.25 mm burr?",
      options: [
        "A 6 Fr guide with a 5 Fr guide extension over the atherectomy wire",
        "A 7 Fr guide with a 6 Fr guide extension over the atherectomy wire",
        "A 7 Fr guide with a 6 Fr extension placed over the diagonal wire instead",
        "A 7 Fr guide with a small microcatheter over the diagonal wire, moved slowly during the runs",
      ],
      answer: 1,
      explanation:
        "The guide extension rides on the atherectomy wire alone, so the burr never touches the other wire; a 7 Fr guide with a 6 Fr extension accommodates a 1.25 mm burr or crown (an 8 Fr guide with a 7 Fr extension for a 1.5 mm burr). Brilakis gives no 6 Fr set-up: 7 Fr with a 6 Fr extension is the smallest combination he describes for a 1.25 mm burr. Putting the extension over the diagonal wire does not shield anything from the burr. Protecting the wire with a small microcatheter instead needs an 8 Fr guide, not 7 Fr, and risks damage to the microcatheter and wire and embolisation; in his orbital atherectomy section (19.9.6) Brilakis advises avoiding it, although 16.2.9 lists it as an option.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-bifurcation-provisional-q11",
      stem: "A 72-year-old has a Medina 0,1,1 bifurcation. Which statement fits Brilakis's algorithm?",
      options: [
        "V-stenting may be used if a planned two-stent strategy is chosen, and needs a guide of at least 7 Fr",
        "V-stenting is mandatory, because the proximal MV is free of disease and two stents are therefore always needed",
        "SKS is preferred over V-stenting for this pattern, because SKS leaves only a short metal neocarina behind",
        "The pattern is a branch ostial lesion, so it should be treated as Brilakis describes for ostial lesions",
      ],
      answer: 0,
      explanation:
        "Medina 0,1,1 is where Brilakis's planned two-stent branch offers V-stenting, which, like SKS, needs at least 7 Fr to deliver two stents together. Nothing is mandatory: the occlusion-risk question still decides whether two stents are planned at all. SKS leaves a long neocarina and is kept for emergencies or bail-out. Brilakis treats Medina 0,0,1 and 0,1,0 as the branch ostial lesions.",
      difficulty: 2,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Run a provisional case on the bench: size the main-vessel stent to the distal reference with room for POT proximally, perform POT sized to the proximal reference with the distal marker at the carina, then choose kissing balloons whose Finet effective diameter matches the proximal vessel and finish with a final POT." },
    { sim: "views", task: "Find the projections that separate the LAD from its diagonal and the left main bifurcation from both its branches, in two roughly orthogonal views." },
    { sim: "physiology", task: "Measure FFR in a jailed side branch after main-vessel stenting and decide by the 0.80 cut-off whether to treat it." },
  ],
  caseIds: ["cp-bifurcation-provisional-case-lad-diagonal", "cp-bifurcation-provisional-case-lost-om"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cp-bifurcation-provisional-case-lad-diagonal",
    title: "An LAD-diagonal bifurcation done the provisional way",
    trackId: "complex-pci",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 16.1 and 16.2 (provisional stenting steps 1-4), 10.2 and 12.1; Oxford Handbook, chapter 8 (bifurcation lesions, bifurcation PCI techniques)",
    },
    summary: "Elective PCI of a mid-LAD lesion across a large diagonal: strategy, wiring, preparation, stent sizing, jailing, POT and side-branch assessment.",
    presentation:
      "A 63-year-old man has angina on one flight of stairs despite two antianginal drugs and anterior ischaemia on stress perfusion imaging. Angiography shows an 85% mid-LAD stenosis that starts just proximal to a large first diagonal and continues beyond it (Medina 1,1,0). The diagonal ostium has a short 30% narrowing; the diagonal is 2.75 mm and supplies a large anterolateral territory, and leaves the LAD at about 50°. There is mild calcification. He is booked for PCI from the right radial artery.",
    findings: ["Blood pressure 136/78 mmHg, sinus rhythm 64/min", "LVEF 55%", "Proximal LAD 3.5 mm, LAD beyond the diagonal 3.0 mm, diagonal 2.75 mm", "Heparin given; ACT in range; 6 Fr EBU guide engaged"],
    steps: [
      {
        id: "s1",
        prompt: "Which strategy do you choose?",
        options: [
          {
            text: "Provisional stenting of the LAD with the diagonal wired",
            best: true,
            feedback: "The diagonal must be preserved (2.75 mm, large territory), and its occlusion risk is low: the ostium is only mildly and briefly diseased (Oxford: occlusion is rare under 50% ostial stenosis). Low risk means provisional, with the SB wired (Brilakis 16.1).",
          },
          {
            text: "Planned DK crush, because the angle is under 70°",
            feedback: "The angle chooses the two-stent technique only once two stents are needed. With a mildly diseased SB ostium the occlusion risk is low, so the algorithm leads to provisional, which Brilakis calls the preferred and easiest technique for most bifurcations.",
            stateDelta: { stability: -5, flags: ["overtreated"] },
          },
          {
            text: "Stent the LAD without wiring the diagonal",
            feedback: "Brilakis's wiring section allows an SB without significant disease to be left unwired, and a 30% ostium is mild. But his provisional section wires the SB when it is important and at risk of occlusion (16.2.10.1), and a 2.75 mm branch to a large territory, crossed by a calcified LAD lesion, qualifies: the wire keeps it open, marks it and offers a rescue route.",
            stateDelta: { stability: -5, flags: ["sb-unwired"] },
          },
          {
            text: "Simultaneous kissing stents to keep both branches open",
            feedback: "Brilakis rules SKS out for non-emergency PCI because of the long neocarina it leaves, and it needs at least a 7 Fr guide.",
            stateDelta: { stability: -10, flags: ["overtreated"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Both branches are wired with workhorse wires and kept apart on the table. How do you prepare the lesion?",
        variants: [{ flag: "sb-unwired", info: "On reflection you have now wired the diagonal as well, as Brilakis advises for an important branch at risk." }],
        options: [
          {
            text: "Predilate the LAD only",
            best: true,
            feedback: "Brilakis prepares the MV in all cases (it helps sizing, delivery and expansion) and generally avoids preparing the SB in provisional stenting.",
          },
          {
            text: "Predilate the LAD and then the diagonal ostium",
            next: "c-sb-dissection",
            feedback: "Oxford's illustrated case and its side-branch protection section include ballooning the SB before the MV stent (as does Brilakis's chapter 10 list), but his bifurcation chapter advises against it in provisional stenting because a dissected SB then needs a stent.",
            stateDelta: { stability: -5, flags: ["sb-ballooned"] },
          },
          {
            text: "Rotational atherectomy of the LAD with the diagonal wire removed",
            feedback: "Mild calcium does not call for atherectomy, and removing the SB wire throws away your protection; if a dissection then closes the diagonal, rewiring may be very hard.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-sb-dissection",
        kind: "consequence",
        prompt: "The angiogram after the diagonal balloon shows an NHLBI type B dissection at the diagonal ostium with TIMI 3 flow.",
        options: [
          {
            text: "Keep the diagonal wire, stent the LAD over it, and reassess the diagonal after POT",
            best: true,
            feedback: "Brilakis avoids SB ballooning in provisional stenting precisely because a dissection then calls for a stent (16.2.9). Continuing provisional with the wire jailed is reasonable, because the wire is still in the diagonal, but expect to stent it: a type B dissection counts as compromise, so rewire and kiss, and if it stays poor, stent the diagonal (on the angle, see the bail-out note in lesson 5). A planned two-stent technique chosen by angle (DK crush or culotte, 16.1.4) is the alternative, and Brilakis notes that DK crush keeps wire access to the MV throughout with little risk of losing the SB, which matters most when a dissection is present (16.2.10.5).",
          },
          {
            text: "Pull the diagonal wire so it is not jailed in a dissected branch",
            feedback: "That removes the marker and the rescue route from the one branch now most at risk of closing.",
            stateDelta: { stability: -15, flags: ["sb-unwired"] },
          },
          {
            text: "Convert to simultaneous kissing stents to cover both branches now",
            feedback: "Brilakis keeps SKS for emergencies or bail-out because of the long neocarina it leaves, and it needs at least a 7 Fr guide; this patient is stable with TIMI 3 flow and a 6 Fr guide.",
            stateDelta: { stability: -10, flags: ["overtreated"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Which LAD stent do you choose?",
        options: [
          {
            text: "3.0 mm, with about 8–10 mm of it lying before the diagonal, on a platform that can be post-dilated to 3.5 mm",
            best: true,
            feedback: "Distal MV diameter, expandable to the proximal MV, and room for a POT balloon (at least 6 mm, ideally 8–10 mm, proximal to the carina).",
          },
          {
            text: "3.5 mm, matched to the proximal LAD for apposition",
            next: "c-oversized",
            feedback: "Sized to the proximal MV, the stent shifts the carina into the SB and can dissect or perforate the distal LAD.",
            stateDelta: { stability: -15, flags: ["oversized-stent"] },
          },
          {
            text: "3.0 mm, with only 3 mm of stent proximal to the diagonal to keep it short",
            feedback: "No POT balloon fits in 3 mm: the shortest are 6 mm long. The proximal stent would stay undersized against a 3.5 mm vessel.",
            stateDelta: { stability: -5, flags: ["no-room-for-pot"] },
          },
        ],
      },
      {
        id: "c-oversized",
        kind: "consequence",
        prompt: "Teaching note: had you deployed the 3.5 mm stent (Brilakis Fig. 16.6), the diagonal flow could fall to TIMI 1 with a hazy edge in the distal LAD. After jailing and POT, what would that situation call for?",
        options: [
          {
            text: "Rewire the diagonal through a distal strut, remove the jailed wire once the new wire is in, kiss and consider final POT; image the distal edge and treat a dissection if present",
            best: true,
            feedback: "TIMI 1 flow is compromise without occlusion, so this is Brilakis's step 4b, with attention to the distal edge injury that proximal sizing causes. Keeping the jailed wire until a balloon has followed the new wire, as he does for an occluded SB (4c), is a reasonable extra precaution. The case now goes back to the plan with the 3.0 mm stent.",
          },
          {
            text: "Pull the jailed wire and start rewiring with it",
            feedback: "Removing the jailed wire before a new wire is in the branch throws away the only marker of the ostium. The case now goes back to the plan with the 3.0 mm stent.",
            stateDelta: { stability: -15, flags: ["sb-lost"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The stent is positioned across the diagonal. How do you prepare the diagonal wire before deployment?",
        variants: [{ flag: "oversized-stent", info: "For the rest of the case, continue with the 3.0 mm stent sized to the distal LAD, with 8–10 mm of it proximal to the diagonal." }],
        options: [
          {
            text: "Pull it back so its radio-opaque segment is just beyond the carina but not under the stent, with a straight tip and a short jailed length",
            best: true,
            feedback: "Brilakis's tips: visible near the carina, never jailed across the radio-opaque segment (fracture risk), straight tip (loops entangle), short jailed segment (less damage).",
          },
          {
            text: "Leave it deep in the diagonal with a long length under the stent for extra support",
            feedback: "A long jailed segment increases wire damage; support is not worth that risk.",
            stateDelta: { stability: -5, flags: ["long-jail"] },
          },
          {
            text: "Remove it, then rewire the diagonal through the stent afterwards if needed",
            feedback: "Brilakis recommends jailing whenever the SB must be preserved: the wire keeps it open, marks it, improves the recrossing angle and offers a rescue route.",
            stateDelta: { stability: -10, flags: ["sb-unwired"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The stent is deployed. Which POT do you perform?",
        variants: [{ flag: "no-room-for-pot", info: "With only 3 mm of stent proximal to the carina, no POT balloon fits within the stent (the shortest are 6 mm), and a longer one would injure unstented vessel; the plan should have used a longer stent. Discuss with a senior whether the undersized proximal stent needs further treatment, guided by imaging. For the teaching, choose the POT you would have used with 8–10 mm of proximal stent." }],
        options: [
          {
            text: "3.5 × 8 mm non-compliant balloon, distal marker at the carina",
            best: true,
            feedback: "Proximal MV diameter, no longer than the stent proximal to the carina, distal marker at the carina.",
          },
          {
            text: "3.5 × 15 mm non-compliant balloon centred on the carina",
            next: "c-pot-distal",
            feedback: "Too distal: centring the balloon on the carina places half of it in the distal MV, which can compromise the SB. A POT balloon should also be no longer than the stent proximal to the carina.",
            stateDelta: { stability: -10, flags: ["pot-distal"] },
          },
          {
            text: "No POT: the stent was deployed at nominal pressure and looks fine",
            feedback: "With a 3.5 mm proximal and 3.0 mm distal LAD, a 3.0 mm stent is undersized proximally until POT; POT also opens the cells for any rewiring.",
            stateDelta: { stability: -5, flags: ["no-pot"] },
          },
        ],
      },
      {
        id: "c-pot-distal",
        kind: "consequence",
        prompt: "After the long POT balloon the diagonal ostium looks pinched with TIMI 2 flow.",
        options: [
          {
            text: "Treat it as a compromised SB: rewire a distal strut, remove the jailed wire, kiss with Finet-sized balloons, then a final POT with a short balloon kept proximal to the diagonal takeoff",
            best: true,
            feedback: "TIMI flow under 3 is compromise. The provisional 4b sequence fixes it; here a final POT is worth doing, because the first one was misplaced. Keep that final balloon proximal to the takeoff: in a bench study, one lying across the takeoff narrowed the cell just opened in front of the branch (lesson 5).",
          },
          {
            text: "Put a stent in the diagonal straight away with TAP",
            feedback: "Too early: an SB stent comes after rewiring, kissing and repeat POT, and only if the result is still poor. Which stent technique to use is a separate question, and on angle the manuals differ: Brilakis's chart lists reverse crush or culotte below 70°, whereas Oxford prefers TAP below 90° and the Academy lesson cx-bif-provisional uses TAP as the usual bail-out (cp-bifurcation-two-stent).",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "After POT the diagonal ostium looks about 70% narrowed, with TIMI 3 flow. The patient is pain-free and the ECG is unchanged.",
        options: [
          {
            text: "Measure diagonal FFR after intracoronary nitroglycerin: leave it if above 0.80",
            best: true,
            feedback: "The eye frequently overestimates a jailed ostium; FFR above 0.80 needs no further treatment, 0.80 or less in a branch of 2 mm or more does (Brilakis 12.1). This is an elective case, so physiology is valid here. In DKCRUSH-VI, FFR guidance led to fewer side-branch stents than angiographic criteria, with the same 1-year event rate.",
          },
          {
            text: "Accept the result without physiology: TIMI 3 and no symptoms",
            acceptable: true,
            feedback: "Reasonable: 70% is not above Brilakis's 70% threshold, flow is normal and there is no ischaemia. Physiology simply makes the decision objective.",
          },
          {
            text: "Rewire and kiss routinely, because Oxford advises a final kiss",
            acceptable: true,
            feedback: "Defensible: Oxford advises a final kiss whatever the technique. It is not the best answer because it does not tell you whether the branch is ischaemic; Brilakis calls kissing not always necessary, and Nordic-Baltic III found no clinical benefit from a routine kiss at 6 months (with less angiographic SB restenosis). If you kiss, size by Finet's law and consider a final POT.",
          },
          {
            text: "Stent the diagonal with TAP because it looks severe",
            feedback: "A second stent on the strength of an angiographic appearance that the eye tends to overestimate, and before the branch has been shown to need anything: an SB stent comes only after rewiring, kissing and repeat POT have failed. (On the angle for a bail-out stent the manuals differ: Brilakis's chart lists reverse crush or culotte below 70°, Oxford prefers TAP below 90°.)",
            stateDelta: { stability: -10, flags: ["overtreated"] },
          },
        ],
      },
    ],
    outcome:
      "The LAD is stented with a single stent, POT is performed with a short balloon at the carina, and the diagonal is left alone after a reassuring pressure measurement. He is discharged the next day on dual antiplatelet therapy. For his elective PCI the default is aspirin and clopidogrel for up to 6 months (2024 ESC CCS guideline). Brilakis advises considering a longer course after bifurcation stenting when bleeding risk is low, while the pooled trial evidence for longer DAPT after complex PCI counted a bifurcation only when two stents were used and found more major bleeding with longer therapy; any extension is therefore set by weighing his own ischaemic and bleeding risk, not by the bifurcation alone.",
    outcomeVariants: [
      { flag: "overtreated", text: "Choosing more metal than the anatomy needed added time and steps; provisional was the algorithm's answer for a branch with a mildly diseased ostium." },
      { flag: "sb-ballooned", text: "Ballooning the diagonal in a provisional case dissected it, which turned a one-stent plan into a possible two-stent case." },
      { flag: "oversized-stent", text: "Choosing a stent sized to the proximal LAD risks carina shift into the diagonal and distal edge injury, both avoidable by sizing to the distal LAD and doing POT." },
      { flag: "pot-distal", text: "A POT balloon centred on the carina put half its length into the distal LAD and pushed on the diagonal; a short balloon with its distal marker at the carina would not have." },
      { flag: "sb-lost", text: "Removing the jailed wire before a new wire was in the branch left no marker for rewiring." },
    ],
    learningPoints: [
      "Preserve an important SB, and choose provisional when its occlusion risk is low.",
      "Prepare the MV; avoid ballooning the SB in provisional stenting.",
      "Size the MV stent to the distal MV, expandable to the proximal MV, with at least 6 mm (ideally 8–10 mm) proximal to the carina.",
      "Jail the SB wire with its radio-opaque segment near but not under the stent, a straight tip and a short jailed length.",
      "POT: proximal MV diameter, length within the proximal stent, distal marker at the carina.",
      "Judge the SB by flow, stenosis over 70%, dissection grade and, when in doubt, FFR; the eye overestimates.",
    ],
    refs: [...BOOKS, "nordic-baltic3-2011", "giustino-complex-pci-dapt-2016", "esc-ccs-2024", "chen-dkcrush6-2015", "andreasen-final-pot-2020"],
  },
  {
    id: "cp-bifurcation-provisional-case-lost-om",
    title: "A circumflex stent closes the obtuse marginal",
    trackId: "complex-pci",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, section 16.2 (provisional stenting steps 2-4c, jailed wire removal), 27.2 and 30.6-30.9; Oxford Handbook, chapter 8 (bifurcation PCI techniques)",
    },
    summary: "A provisional circumflex-obtuse marginal case in which the branch occludes after MV stenting: rewiring, rescue over the jailed wire, a stuck jailed wire, kissing and final POT.",
    presentation:
      "A 58-year-old woman with recurrent angina has a 90% proximal-to-mid circumflex stenosis across the origin of a large first obtuse marginal (OM), whose ostium has a 60% narrowing. The circumflex is 3.5 mm proximally and 3.0 mm beyond the OM; the OM is 2.5 mm. The team chose provisional stenting. Both branches were wired with workhorse wires through a 6 Fr EBU guide, the circumflex was predilated, a 3.0 mm stent was deployed with the OM wire jailed and POT was done with a 3.5 mm balloon at the carina.",
    findings: ["Blood pressure 128/72 mmHg, sinus rhythm 72/min", "ACT in range", "After POT: OM TIMI 0, mild lateral chest discomfort, ST depression in V5–V6"],
    steps: [
      {
        id: "s1",
        prompt: "The OM is occluded. What do you do first?",
        options: [
          {
            text: "Try to rewire the OM through a distal strut of the circumflex stent, using the jailed wire as a landmark",
            best: true,
            feedback: "Brilakis's 4c: if rewiring is feasible, rewire through a distal strut; the jailed wire shows where the ostium is.",
          },
          {
            text: "Pull the jailed wire out so it does not get in the way",
            next: "c-no-marker",
            feedback: "The jailed wire marks the occluded ostium and is the route for a rescue balloon; it comes out only after a new wire is in and a low-profile balloon has followed it.",
            stateDelta: { stability: -15, flags: ["marker-lost"] },
          },
          {
            text: "Deliver a stent into the OM with TAP straight away",
            feedback: "Brilakis calls TAP simple because no rewiring is needed once the SB stent is in, but TAP starts from an SB that has been rewired, kissed and post-dilated with POT; it cannot be delivered into a branch you have not yet re-entered through the stent.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-no-marker",
        kind: "consequence",
        prompt: "With the jailed wire gone, the OM stump is invisible and several rewiring attempts go nowhere. The ST depression deepens.",
        options: [
          {
            text: "Use the earlier cine as a road map, try an angulated or dual-lumen microcatheter to aim at the ostium, and call a senior colleague",
            best: true,
            feedback: "Brilakis groups the options for a difficult SB wire as wire changes, microcatheters (including angulated and dual-lumen ones) and MV modification. He gives no order, but he flags MV modification for its risk of SB occlusion, which is a reason to try the wire and microcatheter options first.",
          },
          {
            text: "Accept the loss of the OM",
            feedback: "A 2.5 mm OM with ischaemia is worth fighting for while there are options left.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "After ten minutes, rewiring through the struts has failed with two wires and a reshaped tip. The patient has ongoing discomfort.",
        variants: [{ flag: "marker-lost", info: "Teaching note: without the jailed wire, the rescue Brilakis teaches at this step would not be available. For the rest of the case, continue as if the jailed wire had been left in place." }],
        options: [
          {
            text: "Advance a 1.0–1.5 mm balloon over the jailed wire partly into the OM and inflate it to restore flow",
            best: true,
            feedback: "Brilakis's 4c 'no' branch. If no balloon will pass, rotating a torquable microcatheter into the branch often opens a track for one.",
          },
          {
            text: "Inflate a large balloon in the circumflex stent at high pressure",
            feedback: "That does not open the OM, and the oversized balloon pushes the carina further across it.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Balloon over the jailed wire, then convert to an inverted DK crush",
            acceptable: true,
            feedback: "Brilakis's option 2 follows balloon inflation over the jailed wire (Fig. 16.9): DK crush with the roles reversed, the OM acting as the main vessel. Option 1, rewiring through the lifted struts, keeps the single-stent plan, which is why it is the path this case follows.",
          },
        ],
      },
      {
        id: "s3",
        prompt: "TIMI 2 flow returns in the OM and the pain eases. How do you rewire it now?",
        options: [
          {
            text: "Through the circumflex struts, using a dual-lumen microcatheter",
            best: true,
            feedback: "The balloon has lifted the struts; a dual-lumen microcatheter helps avoid passing the new wire behind them.",
          },
          {
            text: "With a new wire alone, advancing it into whichever cell it finds first",
            next: "c-proximal-cell",
            feedback: "Without Brilakis's distal-cell technique (park the wire beyond the carina, aim at the branch, withdraw slowly until it falls in) you do not know which cell you have crossed, and after ballooning over the jailed wire the struts are lifted, so a wire alone can pass behind them.",
            stateDelta: { stability: -5, flags: ["proximal-cell"] },
          },
        ],
      },
      {
        id: "c-proximal-cell",
        kind: "consequence",
        prompt: "OCT shows the new wire entered the OM through a proximal cell.",
        options: [
          {
            text: "Withdraw and recross distally: wire parked beyond the carina, tip aimed at the OM, slow withdrawal until it falls in, then forward through that cell",
            best: true,
            feedback: "Distal-cell crossing scaffolds the SB ostium; proximal crossing leaves struts pushed into the MV lumen.",
          },
          {
            text: "Accept it and kiss",
            feedback: "You can kiss through a proximal cell, but it scaffolds the ostium less well.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The new wire has been advanced into the distal OM and seems to cross the stent near the carina. What do you do before removing the jailed wire?",
        options: [
          {
            text: "Advance a low-profile balloon over the new wire into the OM",
            best: true,
            feedback: "Brilakis removes the jailed wire only after a low-profile balloon has followed the new wire into the branch, proving it is inside the struts.",
          },
          {
            text: "Nothing: the contrast injection shows the new wire in the distal OM",
            next: "c-under-stent",
            feedback: "A wire under the stent also runs down the distal OM on contrast.",
            stateDelta: { stability: -10, flags: ["under-stent-risk"] },
          },
        ],
      },
      {
        id: "c-under-stent",
        kind: "consequence",
        prompt: "You pull the jailed wire. A small low-profile balloon (1.0–1.5 mm) will not follow the new wire into the OM, and IVUS shows the wire running behind the circumflex struts.",
        options: [
          {
            text: "Do not inflate; withdraw the new wire and recross through the struts with a dual-lumen microcatheter",
            best: true,
            feedback: "A wire under the stent cannot be used to treat the branch through the stent. When a balloon will not follow through a deployed stent, Brilakis suspects a wire under a strut and takes a new course through the stent, preferably with a knuckle formed on the wire tip further back, proximal to the stent (9.7, Fig. 9.10); imaging found the problem, as he lists among its uses (16.2.13). Here the struts have been lifted, so a dual-lumen microcatheter helps.",
          },
          {
            text: "Inflate the balloon where it stopped to open a channel",
            feedback: "That dilates along the wrong path, behind the struts, and still leaves you without a wire through the stent into the branch, now with the jailed wire gone. Brilakis's answer to a balloon that will not follow is to rewire through the stent.",
            stateDelta: { stability: -10, flags: ["substent-inflation"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The balloon has followed the new wire into the OM. The jailed wire will not come out with gentle traction, and the guide dives deeper as you pull.",
        options: [
          {
            text: "Stop pulling; advance a microcatheter or small balloon over the jailed wire to the trap and withdraw gently",
            best: true,
            feedback: "Brilakis: do not pull hard (fracture, unravelling, guide-induced dissection); bring a small balloon or microcatheter to the entrapment. Next would be a small balloon inflated distally (then repeat POT) and rotation with a torquer, avoiding over-rotation, which is another cause of wire fracture (27.2.1.2). The guide diving in as you pull can also deform the proximal stent, so check it afterwards and repeat POT if it is distorted.",
          },
          {
            text: "Pull firmly while the assistant holds the guide back",
            next: "c-fracture",
            feedback: "Hard pulling is how jailed wires fracture or unravel.",
            stateDelta: { stability: -20, flags: ["wire-fracture"] },
          },
        ],
      },
      {
        id: "c-fracture",
        kind: "consequence",
        prompt: "The wire suddenly gives way; the distal segment remains in the OM and circumflex.",
        options: [
          {
            text: "Image with IVUS to tell unravelling from a clean fracture, then decide on surgery, stenting or retrieval",
            best: true,
            feedback: "Brilakis 27.2.3.2 and his entrapment and fracture algorithm: unravelling is the first question. If the wire has unravelled, fragments reaching the aorta or lying in a critical location (the left main or another major bifurcation) need emergency surgery; otherwise they are trapped behind a stent, if necessary after a snare has broken the wire close to the ostium. Attempts to retrieve unravelled fragments should generally be avoided, because they can unravel the wire further (although successful removal has been described). After a clean fracture, small fragments in small distal branches may be left, while long fragments in a large artery are better retrieved (wire twirling, snare). A large circumflex–OM bifurcation may count as one of the major bifurcations Brilakis treats as critical; decide with the surgical team.",
          },
          {
            text: "Snare the fragments straight away, before they can migrate",
            feedback: "Not before imaging: if the wire has unravelled, Brilakis advises against retrieval attempts in general, because they can unravel it further; IVUS first tells you which problem you have.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Leave it and finish the case without imaging",
            feedback: "An unravelled coil can form a thrombogenic tangle; you need to know which you are dealing with.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The jailed wire is out. Which kissing balloons do you use? (Proximal circumflex 3.5 mm, distal circumflex 3.0 mm, OM 2.5 mm.)",
        options: [
          {
            text: "3.0 mm in the circumflex and 2.5 mm in the OM",
            best: true,
            feedback: "0.678 × (3.0 + 2.5) ≈ 3.73 mm, similar to the 3.5 mm proximal vessel, as Brilakis asks, and each balloon matches its distal branch, which is the Academy lesson's convention (cx-bif-provisional) rather than a rule of Brilakis's. A final POT then corrects the oval proximal stent.",
          },
          {
            text: "3.5 mm in the circumflex and 2.5 mm in the OM",
            feedback: "0.678 × 6.0 ≈ 4.07 mm: the pair overstretches the 3.5 mm proximal stent.",
            stateDelta: { stability: -5, flags: ["oversized-kiss"] },
          },
          {
            text: "2.75 mm in the circumflex and 2.5 mm in the OM",
            acceptable: true,
            feedback: "0.678 × 5.25 ≈ 3.56 mm, also similar to the proximal vessel, so it meets Brilakis's rule, his only sizing rule for the kiss. It is ranked below 3.0 + 2.5 only because the Academy lesson cx-bif-provisional sizes each balloon to its distal branch, and 2.75 mm is under the 3.0 mm distal circumflex. Finet's coefficient comes from native vessels, so either pair is reasonable.",
          },
        ],
      },
      {
        id: "s7",
        prompt: "The kiss is done. The OM has TIMI 3 flow and a mild residual narrowing; the ST changes have resolved.",
        variants: [{ flag: "oversized-kiss", info: "IVUS shows the proximal stent stretched and oval after the oversized kiss." }],
        options: [
          {
            text: "Final POT with the balloon kept proximal to the OM takeoff, allowing for its shoulder, then final imaging",
            best: true,
            feedback: "Final POT corrects the oval deformation left by two balloons in the proximal stent, and Brilakis advises considering it after every kiss. Where to put it: in the bench study (Andreasen 2020), a final balloon across the side-branch takeoff narrowed the cell just opened in front of the branch (by 34% even after distal rewiring), whereas one kept proximal to the takeoff narrowed it by about 4%; balloon shoulders sit differently relative to the markers in different designs, so allow for the one you are using.",
          },
          {
            text: "Final POT with the distal marker at the carina, as for the first POT, then final imaging",
            acceptable: true,
            feedback: "This is where Brilakis puts the marker for the first POT, and he does not give a separate position for the final one. But a balloon with its marker at the carina lies across the OM takeoff, which in the bench study narrowed the newly opened cell in front of the branch; keeping the final balloon proximal to the takeoff avoided that.",
          },
          {
            text: "Stent the OM with TAP to make sure",
            feedback: "The SB result is now good; Brilakis stents the SB only if the result stays suboptimal.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Finish without final POT",
            acceptable: true,
            feedback: "Brilakis says final POT may not be needed after a good kiss, but advises considering it to correct ovalisation.",
          },
        ],
      },
    ],
    outcome:
      "The OM is rescued with a single circumflex stent: flow restored over the jailed wire, rewired through a distal cell, the jailed wire freed without force, a Finet-sized kiss and a final POT. She is pain-free on the ward the same evening.",
    outcomeVariants: [
      { flag: "marker-lost", text: "Removing the jailed wire early cost the marker and the rescue route and made recovery slow and uncertain." },
      { flag: "substent-inflation", text: "Inflating over a wire that had passed behind the circumflex struts dilated the wrong path and left no wire through the stent; proving the wire is inside the stent with a low-profile balloon before pulling the jailed wire, and rewiring through the stent when a balloon will not follow, prevent this." },
      { flag: "wire-fracture", text: "Pulling hard on the jailed wire fractured it; gentle traction and a microcatheter or balloon to the trap come first." },
    ],
    learningPoints: [
      "An occluded SB: rewire through a distal strut if you can; if not, a 1.0–1.5 mm balloon over the jailed wire, then rewire through the lifted struts with a dual-lumen microcatheter, or inverted DK crush.",
      "Keep the jailed wire until a low-profile balloon has followed the new wire into the branch.",
      "Never pull hard on a jailed wire: microcatheter or small balloon to the trap, inflate a small balloon distally then repeat POT, rotate gently.",
      "Size kissing balloons so that 0.678 × (sum of diameters) is similar to the proximal MV, then consider a final POT.",
    ],
    refs: [...BOOKS, "andreasen-final-pot-2020", "johnson-eapci-lm-imaging-2026"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-bif-guide-size",
    lab: "pci",
    when: { phase: ["plan", "guide"], requires: ["bifurcation"] },
    title: "Bifurcation guide: supportive shape, size for the plan",
    text: "Most bifurcation techniques fit a 6 Fr guide, but V-stenting and simultaneous kissing stents need at least 7 Fr. A larger guide passes two devices (especially used balloons) more easily, gives more support and makes troubleshooting easier; for left main bifurcation PCI Brilakis prefers 7 or 8 Fr for support. Choose a supportive shape: AL for the RCA, EBU or XB for the left main.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2"), B("17.4"), OX_LESIONS],
    refs: BOOKS,
  },
  {
    id: "pci-bif-wire-both-branches",
    lab: "pci",
    when: { phase: ["plan", "wire"], requires: ["bifurcation"] },
    title: "Wire the side branch you need to keep",
    text: "Wire both the main vessel and any important side branch at risk of occlusion, with workhorse wires, and keep track of which wire is which outside the body. Watch both tips: a wire that migrates too far distally can perforate.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2"), B("8.6")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-hard-side-branch-wire",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-prolapse"], requires: ["bifurcation"] },
    title: "Side branch will not wire: wire, microcatheter and main-vessel options",
    text: "Wire options: a secondary bend, a hydrophilic or polymer-jacketed wire, or a reversed hairpin wire. Microcatheter options: a large or small microcatheter for support and tip reshaping, an angulated one, or a dual-lumen one. Ballooning or atherectomy of the main vessel can itself close the branch, which is why Brilakis flags it; he gives no order. Swap any polymer-jacketed wire for a workhorse wire before preparation and stenting.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2"), B("8.6"), B("30.6")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-no-sb-predilation",
    lab: "pci",
    when: { phase: ["plan", "lesion-prep"], requires: ["bifurcation"] },
    title: "Provisional: prepare the main vessel, not the side branch",
    text: "Prepare the main-vessel lesion in every case. In a provisional strategy avoid ballooning the side branch: a dissection there usually means it has to be stented.",
    tone: "caution",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-atherectomy-two-wires",
    lab: "pci",
    when: { phase: ["plan", "lesion-prep"], requires: ["bifurcation"] },
    title: "Atherectomy at a bifurcation: isolate the burr from the second wire",
    text: "Only the atherectomy wire should be exposed to the burr or crown. To keep the side-branch wire in, run the device through a guide extension over the atherectomy wire (7 Fr guide with 6 Fr extension for a 1.25 mm burr or crown; 8 Fr with 7 Fr for 1.5 mm), or accept a low risk of wire damage. Microcatheter protection of the second wire needs 8 Fr and can damage the microcatheter and wire and cause embolisation; in his orbital atherectomy section Brilakis advises avoiding it, although his bifurcation chapter lists it as an option.",
    tone: "caution",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2"), B("19.9")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-mv-stent-size",
    lab: "pci",
    when: { phase: ["plan", "stent"], requires: ["bifurcation"] },
    title: "Main-vessel stent: distal diameter, room for POT",
    text: "Size the stent to the distal main vessel on a platform that can be expanded to the proximal main vessel. Choose a length that puts 6 mm or more of stent (8–10 mm is better) before the carina, so the POT balloon fits.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-setup",
    sources: [B("16.2"), B("10.2")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-jail-wire-prep",
    lab: "pci",
    when: { phase: ["stent"], requires: ["bifurcation"] },
    title: "Before jailing: radio-opaque segment near, not under; straight tip; short length",
    text: "Pull the side-branch wire back until its radio-opaque segment lies just beyond the carina, but do not trap that segment under the stent. Check the tip is straight and keep the jailed length short: a looped tip can catch on the stent during removal, and a longer jailed length was associated with more wire damage.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-jailed",
    sources: [B("16.2")],
    refs: [...BOOKS, "pan-jailed-wire-2016"],
  },
  {
    id: "pci-bif-jailed-wire-removal",
    lab: "pci",
    when: { phase: ["optimise"], event: ["equipment-entrapment"], requires: ["bifurcation"] },
    title: "Removing the jailed wire: gentle traction, never a hard pull",
    text: "Withdraw the jailed wire with gentle constant traction only. If it resists, advance a small balloon or microcatheter to the point of entrapment and pull gently; if that fails, inflate a small balloon advanced distally over the jailed wire (then repeat POT), or rotate the wire with a torquer, avoiding over-rotation. Hard pulling or over-rotation can fracture or unravel the wire, and hard pulling can drag the guide deep enough to dissect or to deform the proximal stent, so check the stent afterwards and repeat POT if it is distorted.",
    tone: "bailout",
    lessonId: "cp-bifurcation-provisional-jailed",
    sources: [B("16.2"), B("27.2")],
    refs: [...BOOKS, "johnson-eapci-lm-imaging-2026"],
  },
  {
    id: "pci-bif-pot-size-position",
    lab: "pci",
    when: { phase: ["optimise"], requires: ["bifurcation"] },
    title: "POT: proximal diameter, short balloon, distal marker at the carina",
    text: "Size the POT balloon to the proximal main vessel, no longer than the stent proximal to the carina, with its distal marker at the carina. Too distal or oversized compromises the side branch; too proximal leaves the stent underexpanded beside the branch; too long injures the vessel proximal to the stent.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-pot",
    sources: [B("16.2")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-assess-side-branch",
    lab: "pci",
    when: { phase: ["optimise", "physiology"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Is the side branch really compromised?",
    text: "Compromise means TIMI flow under 3, diameter stenosis over 70% or an NHLBI type B or worse dissection. The eye often overestimates a jailed ostium: after intracoronary nitroglycerin, adenosine FFR of 0.80 or less in a branch of at least 2 mm needs treatment, above 0.80 does not.",
    tone: "caution",
    lessonId: "cp-bifurcation-provisional-sb",
    sources: [B("16.1"), B("16.2"), B("12.1")],
    refs: [...BOOKS, "koo-jailed-sb-ffr-2005"],
  },
  {
    id: "pci-bif-rewire-distal-cell",
    lab: "pci",
    when: { phase: ["optimise"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Rewire the side branch through a distal cell",
    text: "Park the new wire beyond the carina with its tip aimed at the side branch, withdraw it slowly until it falls into the branch origin, and push forward through that cell, next to the carina. A distal cell scaffolds the ostium better; OCT can confirm it. Remove the jailed wire only once the new wire is in.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-sb",
    sources: [B("16.2")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-kissing-size",
    lab: "pci",
    when: { phase: ["optimise"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Kissing balloons: size the pair for the proximal vessel",
    text: "Choose the two balloons so that 0.678 × (sum of their diameters) is close to the proximal main-vessel diameter. Short non-compliant balloons are usual; with compliant ones keep high-pressure inflations to a minimum. Consider a final POT after the kiss to correct the oval proximal stent.",
    tone: "do",
    lessonId: "cp-bifurcation-provisional-sb",
    sources: [B("16.2")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-confirm-inside-struts",
    lab: "pci",
    // Lesson-only until the lab reports a side-branch occlusion event (requested): 'plan' and a side-branch
    // compromise never occur together, so this trigger cannot fire in the lab today.
    when: { phase: ["plan"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Occluded branch rewired: prove the wire is inside the stent",
    text: "Before removing the jailed wire from an occluded side branch, advance a low-profile balloon over the new wire into the branch. If it will not follow, suspect a wire under the stent and image before inflating anything.",
    tone: "caution",
    lessonId: "cp-bifurcation-provisional-sb",
    sources: [B("16.2"), B("16.1")],
    refs: BOOKS,
  },
  {
    id: "pci-bif-occluded-sb-rescue",
    lab: "pci",
    // Lesson-only until the lab reports a side-branch occlusion event (requested); see the note above.
    when: { phase: ["plan"], event: ["side-branch-compromise"], requires: ["bifurcation"] },
    title: "Occluded side branch you cannot rewire: balloon over the jailed wire",
    text: "Advance a 1.0–1.5 mm balloon over the jailed wire partly into the branch and inflate it to restore flow; if no balloon will pass, rotate a torquable microcatheter into the branch to open a track for one. Then rewire through the lifted struts, ideally with a dual-lumen microcatheter, or convert to an inverted DK crush.",
    tone: "bailout",
    lessonId: "cp-bifurcation-provisional-sb",
    sources: [B("16.2"), B("30.9")],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "andreasen-final-pot-2020",
    kind: "paper",
    citation:
      "Andreasen LN, Holm NR, Webber B, Ormiston JA. Critical aspects of balloon position during final proximal optimization technique (POT) in coronary bifurcation stenting. Catheter Cardiovasc Interv. 2020;96:31–39.",
    url: "https://doi.org/10.1002/ccd.28801",
    note: "PMID: 32087046; PMC7384175. Checked on PubMed: authors, title, journal, year, volume 96, issue 1, pages 31–39; full text read (PMC7384175). Bench model, 30° phantom, 31 implantations: provisional with kissing (13), POT-side-POT (12), culotte (6). Results: final POT across the SB takeoff reduced the opened SB cell area by 43% pooled (34% after distal rewiring without a metallic carina; 54–70% after POT-side-POT with proximal wiring) and could rejail the SB with a metallic carina; final POT proximal to the takeoff reduced it by about 4%; distal rewiring, kissing and proximal final POT was the reference strategy. Discussion 4.3: balloons differ in cone angle and shoulder position relative to the markers. Discussion point (d) and 4.5: POT-side-POT needs a final POT across the takeoff to correct malapposition opposite the SB.",
    verified: true,
  },
  {
    id: "chen-dkcrush6-2015",
    kind: "trial",
    citation:
      "Chen SL, Ye F, Zhang JJ, et al. Randomized comparison of FFR-guided and angiography-guided provisional stenting of true coronary bifurcation lesions: the DKCRUSH-VI trial. JACC Cardiovasc Interv. 2015;8:536–546.",
    url: "https://doi.org/10.1016/j.jcin.2014.12.221",
    note: "PMID: 25819187. Checked on PubMed: authors, title, journal, year, volume 8, issue 4, pages 536–546; abstract read (320 patients with Medina 1,1,1 or 0,1,1 bifurcations, provisional SB approach; angiography-guided SB treatment for TIMI flow <3, ostial SB stenosis >70% or dissection worse than type A vs FFR-guided for SB FFR <0.80; SB stenting attempted 38.1% vs 25.9%; 1-year MACE 18.1% in both groups).",
    verified: true,
  },
  {
    id: "murasato-propot-2022",
    kind: "trial",
    citation:
      "Murasato Y, Watanabe Y, Yamawaki M, et al. Effect of proximal optimization technique on coronary bifurcation stent failure: insights from the multicenter randomized PROPOT trial. Catheter Cardiovasc Interv. 2022;99:1047–1058.",
    url: "https://doi.org/10.1002/ccd.30120",
    note: "PMID: 35170843. Checked on PubMed: authors, title, journal, year, volume 99, issue 4, pages 1047–1058; abstract read (120 patients with crossover stenting randomised to POT followed by SB dilatation or kissing; OCT-defined composite bifurcation stent failure at the end of the procedure 27% vs 32%; unplanned additional procedures 38% vs 25%; POT did not result in a favourable trend).",
    verified: true,
  },
  {
    id: "yamawaki-propot-oct-2023",
    kind: "paper",
    citation:
      "Yamawaki M, Murasato Y, Watanabe Y, et al. Impact of coronary bifurcation angle on stent malapposition in a randomized comparison between proximal optimization technique followed by side branch dilatation and kissing balloon inflation. Int J Cardiol Heart Vasc. 2023;48:101265.",
    url: "https://doi.org/10.1016/j.ijcha.2023.101265",
    note: "PMID: 37680550; PMC10480620. Checked on PubMed: authors, title, journal, year, volume 48, article 101265; abstract read (PROPOT OCT analysis, 100 patients; major incomplete stent apposition 35% after POT and SB dilatation vs 17% after kissing).",
    verified: true,
  },
  {
    id: "lunardi-bif-arc-2022",
    kind: "paper",
    citation:
      "Lunardi M, Louvard Y, Lefèvre T, et al. Definitions and standardized endpoints for treatment of coronary bifurcations. J Am Coll Cardiol. 2022;80:63–88.",
    url: "https://doi.org/10.1016/j.jacc.2022.04.024",
    note: "PMID: 35597684. Checked on PubMed: authors, title, journal, year, volume 80, issue 1, pages 63–88; abstract read (Bifurcation Academic Research Consortium consensus: standardised definitions of bifurcation lesions and side-branch relevance). Full text not available in PMC; the true-bifurcation patterns (Medina 1,1,1, 1,0,1 or 0,1,1) are taken from the 2026 EAPCI/EBC consensus's quotation of Bif-ARC (johnson-eapci-lm-imaging-2026, full text read).",
    verified: true,
  },
  {
    id: "giustino-complex-pci-dapt-2016",
    kind: "paper",
    citation:
      "Giustino G, Chieffo A, Palmerini T, et al. Efficacy and safety of dual antiplatelet therapy after complex PCI. J Am Coll Cardiol. 2016;68:1851–1864.",
    url: "https://doi.org/10.1016/j.jacc.2016.07.760",
    note: "PMID: 27595509. Checked on PubMed: authors, title, journal, year, volume 68, issue 17, pages 1851–1864; abstract read (patient-level pooled analysis of 6 randomised trials, 9,577 patients; complex PCI defined as at least one of 3 vessels treated, 3 or more stents, 3 or more lesions, bifurcation with 2 stents, total stent length over 60 mm, or CTO; long-term vs short-term DAPT reduced MACE in complex PCI (adjusted HR 0.56) but not in non-complex PCI (HR 1.01); long-term DAPT increased major bleeding, similarly in both groups).",
    verified: true,
  },
  {
    id: "pan-jailed-wire-2016",
    kind: "trial",
    citation:
      "Pan M, Ojeda S, Villanueva E, et al. Structural damage of jailed guidewire during the treatment of coronary bifurcation lesions: a microscopic randomized trial. JACC Cardiovasc Interv. 2016;9:1917–1924.",
    url: "https://doi.org/10.1016/j.jcin.2016.06.030",
    note: "PMID: 27659568. Checked on PubMed: authors, title, journal, year, volume 9, issue 18, pages 1917–1924; abstract read (polymer-coated 115 vs non-polymer-coated 120 jailed wires; 2 mild damage vs 63 (55%) damaged; jailed length a factor; side-branch wiring faster with polymer-coated wires). Cited by Brilakis 16.2 (ref 6).",
    verified: true,
  },
  {
    id: "qin-active-sb-protection-2021",
    kind: "paper",
    citation:
      "Qin Q, Zheng B, Liu J, et al. Active versus conventional side branch protection strategy for coronary bifurcation lesions. Int Heart J. 2021;62:1241–1248.",
    url: "https://doi.org/10.1536/ihj.21-467",
    note: "PMID: 34789648. Checked on PubMed: authors, title, journal, year, volume 62, issue 6, pages 1241–1248; abstract read (meta-analysis of 5 studies, 4 randomised, 1,174 patients; active strategies including the jailed balloon technique vs jailed wire; SB occlusion RR 0.47 (95% CI 0.30–0.73, fixed effect); periprocedural MI and long-term MACE not significantly different).",
    verified: true,
  },
  {
    id: "wang-protective-ballooning-2022",
    kind: "trial",
    citation:
      "Wang M, Liu H, Xu B, et al. Protective ballooning technique for prevention of side branch occlusion in coronary nonleft main true bifurcation lesions: a single-center study. Catheter Cardiovasc Interv. 2022;99 Suppl 1:1418–1423.",
    url: "https://doi.org/10.1002/ccd.30100",
    note: "PMID: 35120269. Checked on PubMed: authors, title, journal, year, volume 99 Suppl 1, pages 1418–1423; abstract read (randomised; 173 protective ballooning vs 167 jailed wire; SB occlusion 0.6% vs 5.4%; SB rewiring 0.6% vs 4.2%; periprocedural MI and 12-month MACE similar).",
    verified: true,
  },
  {
    id: "somendra-modified-jailed-balloon-2025",
    kind: "paper",
    citation:
      "Somendra S, Gupta H, Sharma YP. Early experience with the \"modified jailed balloon technique\" for side branch protection in bifurcation lesions. Indian Heart J. 2025;77:89–92.",
    url: "https://doi.org/10.1016/j.ihj.2025.02.011",
    note: "PMID: 40021000; PMC12138095. Checked on PubMed: authors, title, journal, year, volume 77, issue 2, pages 89–92; abstract read (technique: a semi-compliant balloon sized to the SB is inflated simultaneously with the main-branch stent balloon during deployment, followed by POT and recrossing of the SB; 25 cases). Cited only for the description of the technique.",
    verified: true,
  },
];
