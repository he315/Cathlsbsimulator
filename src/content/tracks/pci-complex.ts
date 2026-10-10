// ===========================================================================
// Track 5 — Complex PCI (prefix cx-).
// Bifurcation, left main, calcium, CTO, grafts and thrombus, special lesions,
// complex high-risk indicated PCI. Complication MANAGEMENT lives in the
// complications track; MCS devices in depth live in the acute-mcs track.
// ===========================================================================

import type { CaseStudy, Module, Track } from "../schema";

// ---------------------------------------------------------------------------
// Module 1 — Bifurcation PCI
// ---------------------------------------------------------------------------
const bifurcation: Module = {
  id: "cx-bifurcation",
  title: "Bifurcation PCI",
  stage: 4,
  summary:
    "Define a bifurcation lesion, decide whether the side branch matters, run a stepwise provisional strategy with POT, and recognise when a planned two-stent technique is justified.",
  objectives: [
    "Apply the European Bifurcation Club definition and the Medina classification, and list the anatomical features Medina leaves out.",
    "Perform stepwise provisional stenting: wire both branches, size to the distal main vessel, POT, assess the side branch, rewire a distal cell, kiss or POT–side–POT, re-POT.",
    "Identify complex bifurcations using the DEFINITION criteria and choose between TAP, culotte, DK-crush and V/SKS.",
    "Summarise the direction of the DKCRUSH-V and EBC MAIN results and explain why they appear to disagree.",
  ],
  lessons: [
    {
      id: "cx-bif-assessment",
      title: "Bifurcation lesions: definitions, Medina and which branch matters",
      minutes: 8,
      refs: ["ebc-consensus", "medina-2006", "supplied-medmastery", "supplied-eh-views"],
      blocks: [
        { kind: "h", text: "Why bifurcations behave differently" },
        {
          kind: "p",
          text: "A bifurcation is any point where a coronary artery divides. Plaque gathers there because flow separates and wall shear stress falls along the lateral walls, while the flow divider itself (the carina) is usually spared. The Oxford handbook puts bifurcations at up to 15% of PCI target lesions.",
        },
        {
          kind: "p",
          text: "Stenting across a branch changes three things at once. The main vessel steps down in calibre across the branch, so one stent diameter cannot fit both segments. The stent pushes the carina towards the side-branch ostium. And the side branch can now only be reached through the struts of a stent. Every bifurcation technique is a way of managing these three consequences.",
        },
        { kind: "h", text: "Vocabulary" },
        {
          kind: "table",
          head: ["Term", "Meaning"],
          rows: [
            ["Main vessel (MV)", "The larger, continuing vessel: proximal MV before the branch, distal MV after it"],
            ["Side branch (SB)", "The smaller branch arising at the bifurcation"],
            ["Carina", "The flow divider between distal MV and SB"],
            ["Polygon of confluence (POC)", "The zone where proximal MV, distal MV and SB meet"],
            ["Bifurcation angle", "Angle between distal MV and SB. Narrow angles increase SB compromise after MV stenting; very wide angles make SB wiring and device delivery harder"],
            ["True bifurcation", "Significant disease in both the MV and the SB ostium (Medina 1,1,1; 1,0,1; 0,1,1)"],
            ["Significant side branch", "A branch you would not want to lose in the clinical context of this patient"],
          ],
        },
        { kind: "h", text: "The European Bifurcation Club definition" },
        {
          kind: "p",
          text: "The European Bifurcation Club (EBC) defines a bifurcation lesion as a coronary narrowing adjacent to, or involving, the origin of a **significant side branch**. Significance is deliberately clinical: a 2 mm diagonal supplying viable anterolateral myocardium in a patient with an LVEF of 30% matters more than a larger branch supplying scar.",
        },
        {
          kind: "figure",
          id: "medina",
          caption: "Medina classification: three digits in the fixed order proximal MV, distal MV, side branch; 1 means a diameter stenosis of 50% or more, 0 means less.",
        },
        {
          kind: "p",
          text: "Medina describes *where* the plaque is. It is quick and reproducible, but it says nothing about SB size, the length of SB ostial disease, the angle or calcium, and those are what actually drive strategy.",
        },
        {
          kind: "table",
          caption: "Common Medina patterns",
          head: ["Medina", "Plaque location", "Usual implication"],
          rows: [
            ["1,1,1", "Proximal MV, distal MV and SB", "True bifurcation; provisional often still feasible; measure SB lesion length"],
            ["1,1,0", "MV across the branch, SB ostium spared", "Provisional; SB at risk from carina shift"],
            ["1,0,1", "Proximal MV and SB", "True bifurcation"],
            ["0,1,1", "Distal MV and SB, proximal MV spared", "True bifurcation; V-stenting only if the proximal MV is large and genuinely disease-free"],
            ["0,0,1", "Isolated SB ostium", "Treat the SB alone (for example drug-coated balloon) or medically"],
            ["1,0,0 or 0,1,0", "Single MV segment next to the branch", "Provisional; watch for SB compromise"],
          ],
        },
        { kind: "h", text: "Does this side branch matter?" },
        {
          kind: "list",
          items: [
            "Size: as a rough guide, branches of 2.5 mm or more usually matter; branches of about 2.75 mm or more with long ostial disease are the ones that raise the question of a second stent.",
            "Territory and viability: how much living myocardium depends on it?",
            "Collaterals: does it feed collaterals to an occluded territory, or is it collateral-dependent itself?",
            "LV function: what would a periprocedural infarct in this territory cost the patient?",
            "Ostial disease: severity and, above all, length of SB ostial disease predict compromise and the need for a second stent.",
            "Angle and calcium at the ostium: predict how hard rewiring will be if the branch closes.",
            "Future access: will anyone be able to reach this branch again (for example the LCx in distal left main disease)?",
          ],
        },
        {
          kind: "pitfalls",
          title: "Imaging the bifurcation",
          items: [
            "Deciding strategy from a view in which the SB ostium is foreshortened or overlapped by the MV. Find two views that lay the carina out.",
            "For the distal left main and proximal LAD/LCx, caudal views (LAO caudal 'spider', RAO caudal) work in horizontal hearts; in vertical hearts cranial views often open the bifurcation better.",
            "Calling a jailed side branch 'severe' from one projection. Angiography tends to overestimate the significance of a jailed SB ostium.",
            "Ignoring calcium at the carina, which predicts failure to rewire and failure to expand.",
          ],
        },
        {
          kind: "pearl",
          text: "Imaging studies suggest that when a side branch narrows after main-vessel stenting, carina shift (the stent pushing the flow divider across the ostium) contributes more than plaque shift. That is why a correctly placed POT and, if needed, a distal-cell rewire fix most problems without a second stent.",
        },
        {
          kind: "keypoints",
          items: [
            "A bifurcation lesion is defined by a significant SB, and significance is a clinical judgement.",
            "Medina tells you plaque location only; add SB size, ostial lesion length, angle and calcium.",
            "A true bifurcation (1,1,1; 1,0,1; 0,1,1) is not by itself an indication for two stents.",
            "Get two views that open the carina before choosing a strategy.",
          ],
        },
      ],
    },
    {
      id: "cx-bif-provisional",
      title: "Provisional stenting step by step",
      minutes: 9,
      refs: ["ebc-consensus", "brilakis-manual-pci", "supplied-medmastery", "finet-fractal-2008", "koo-jailed-sb-ffr-2005", "nordic-baltic3-2011"],
      blocks: [
        {
          kind: "p",
          text: "Provisional stenting means stenting the main vessel across the side branch and treating the side branch only if it needs it. In most bifurcations, routine multi-stent techniques add complications and restenosis without benefit, so the EBC recommends provisional as the default. Keep it simple, but stepwise.",
        },
        {
          kind: "steps",
          title: "Stepwise provisional",
          items: [
            { title: "Wire both branches", detail: "Wire the MV and any SB you would not want to lose. Wire the harder branch first, while the anatomy is undisturbed. The SB wire marks the ostium, slightly widens the angle and is your route back if the branch closes." },
            { title: "Prepare the main vessel", detail: "Pre-dilate the MV as for any lesion; image it if calcium is suspected. Dilate the SB only if it is severely diseased or access is precarious: an SB dissection makes later rewiring harder." },
            { title: "Size the MV stent to the distal MV", detail: "Choose stent diameter from the distal MV reference, not the proximal MV, to avoid dissecting or rupturing the smaller distal segment. Cover healthy to healthy; the proximal segment will be corrected by POT." },
            { title: "Deploy across the SB, jailing its wire", detail: "Leave the SB wire in place. Withdraw it so only a short segment is trapped, avoid very high deployment pressure over it, and never remove it before a new wire is in the branch." },
            { title: "Proximal optimisation technique (POT)", detail: "A short non-compliant (NC) balloon sized 1:1 to the proximal MV reference, positioned with its distal marker just proximal to the carina, inflated at high pressure. It expands and apposes the proximal stent, moves struts away from the SB ostium and often improves SB flow and later rewiring." },
            { title: "Assess the side branch", detail: "Two views, ECG and symptoms. If there is TIMI 3 flow, no significant dissection and no ischaemia, stop here. A pinched-looking ostium is often not functionally significant." },
            { title: "If the SB is compromised: rewire a distal cell", detail: "Cross from inside the stent into the SB through a cell close to the carina (a distal cell), using the jailed wire as a landmark. Only then remove the jailed wire, and re-use it in the distal MV if needed." },
            { title: "Open the SB ostium", detail: "Either kissing balloon inflation (NC balloons sized to each distal branch, short proximal overlap) or POT–side–POT (SB dilatation followed by repeat POT). Both open struts across the ostium; kissing distorts the proximal stent, POT–side–POT avoids simultaneous inflation." },
            { title: "Re-POT", detail: "After kissing, repeat a POT to correct proximal stent ovalisation and restore circular apposition." },
            { title: "Bail-out SB stent only if still needed", detail: "Persistent TIMI <3, flow-limiting dissection or severe ostial narrowing with ischaemia: stent the SB, usually by T and protrusion (TAP); culotte is an alternative when the branches are of similar size." },
            { title: "Image the result", detail: "IVUS or OCT: MV expansion, apposition at the POC, strut position across the SB ostium, edge dissections." },
          ],
        },
        {
          kind: "formula",
          name: "Finet's law (bifurcation fractal geometry)",
          expr: "Proximal MV diameter ≈ 0.678 × (distal MV diameter + SB diameter)",
          note: "Estimates the expected proximal MV diameter when the proximal reference is itself diseased, to help choose the POT balloon. A direct IVUS or OCT measurement is better when available.",
        },
        {
          kind: "table",
          caption: "After MV stenting: leave or treat the side branch?",
          head: ["Finding", "Usual action"],
          rows: [
            ["TIMI 3 flow, no dissection, no symptoms or ECG change", "Leave; consider physiology if genuinely uncertain"],
            ["Ostial pinching on angiography only, TIMI 3 flow", "Usually leave; jailed SB lesions are often overestimated by angiography"],
            ["TIMI <3 flow in a significant SB", "Rewire a distal cell and open (kissing or POT–side–POT)"],
            ["Dissection extending into the SB beyond the ostium", "Rewire and dilate; stent the SB if flow-limiting"],
            ["Chest pain, ST shift or haemodynamic change attributable to the SB", "Treat"],
            ["SB cannot be rewired", "Change tip shape, use a microcatheter or dual-lumen catheter; seek senior help if the branch is large"],
          ],
        },
        {
          kind: "p",
          text: "Routine final kissing after a single MV stent has not been shown to improve outcomes when the SB is not compromised, and it distorts the proximal stent. Reserve it for a compromised branch and always follow it with a re-POT.",
        },
        {
          kind: "pitfalls",
          items: [
            "POT balloon too long or too distal: its distal shoulder pushes the carina into the SB. Too proximal: the stent stays underexpanded at the POC.",
            "Sizing the MV stent to the proximal vessel: distal edge dissection or rupture.",
            "Rewiring the SB through a proximal cell in provisional stenting: leaves a strut bar floating across the ostium and hinders a later SB stent.",
            "Kissing with oversized balloons or a long proximal overlap: proximal stent distortion and dissection.",
            "Pulling hard on a jailed wire: wire fracture or stripping of a polymer jacket. Many operators prefer not to jail polymer-jacketed wires.",
            "Removing the jailed wire before the new wire is in the SB, and then losing the branch.",
          ],
        },
        {
          kind: "pearl",
          text: "The jailed wire is the most useful piece of equipment in a provisional case: it marks the ostium and is the route back in. Remove it only after the new wire is safely in the side branch.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Deploy a stent sized to a 3.0 mm distal main vessel across a branch, then perform a POT with a 3.5 mm NC balloon whose distal marker sits just proximal to the carina. Check proximal apposition on IVUS.",
        },
        {
          kind: "keypoints",
          items: [
            "Provisional is the default; stent sized to the distal MV, then POT sized to the proximal MV.",
            "Treat the SB only if it is compromised: TIMI <3, significant dissection or ischaemia.",
            "Rewire through a distal cell, open with kissing or POT–side–POT, then re-POT.",
            "TAP is the usual bail-out if the SB still needs a stent.",
          ],
        },
      ],
    },
    {
      id: "cx-bif-two-stent",
      title: "Planned two-stent strategies: when and how",
      minutes: 9,
      refs: ["definition-2014", "dkcrush5-2017", "ebc-main-2021", "ebc-consensus", "october-2023", "supplied-medmastery", "brilakis-manual-pci", "definition2-2020"],
      blocks: [
        {
          kind: "p",
          text: "A planned two-stent strategy is chosen when the SB is large, its disease is long and severe, and access after MV stenting might be lost. A Medina 1,1,1 label alone is not enough. Two-stent techniques need two operators at the indeflators for simultaneous inflations, meticulous wire management and, usually, intravascular imaging.",
        },
        {
          kind: "table",
          caption: "DEFINITION criteria: a bifurcation is 'complex' with 1 major plus at least 2 minor criteria",
          head: ["Category", "Criterion"],
          rows: [
            ["Major (distal left main)", "SB diameter stenosis ≥70% and SB lesion length ≥10 mm"],
            ["Major (non-left main)", "SB diameter stenosis ≥90% and SB lesion length ≥10 mm"],
            ["Minor", "Moderate to severe calcification"],
            ["Minor", "Multiple lesions"],
            ["Minor", "Bifurcation angle <45° or >70°"],
            ["Minor", "MV reference diameter <2.5 mm"],
            ["Minor", "Thrombus-containing lesion"],
            ["Minor", "MV lesion length ≥25 mm"],
          ],
        },
        { kind: "h", text: "What the trials suggest (direction only)" },
        {
          kind: "list",
          items: [
            "DEFINITION (registry): complex lesions by these criteria had worse outcomes, and in complex lesions a two-stent strategy was associated with better results than provisional; in simple lesions it was not. A later randomised trial (DEFINITION II) supported a planned two-stent approach, mostly DK-crush, in lesions meeting these criteria.",
            "DKCRUSH-V (distal left main true bifurcations): DK-crush had lower target lesion failure at one year than provisional stenting.",
            "EBC MAIN (distal left main true bifurcations): stepwise provisional was not worse than systematic dual stenting at one year, with numerically fewer events.",
            "Reconciling them: DKCRUSH-V enrolled lesions with more extensive SB disease and used a single technique performed by experienced operators; EBC MAIN allowed several dual-stent techniques and generous bail-out. A practical synthesis is provisional by default and planned DK-crush when SB disease is long and severe.",
            "OCTOBER: OCT-guided PCI of complex bifurcations improved clinical outcomes compared with angiography guidance.",
          ],
        },
        {
          kind: "steps",
          title: "DK-crush (double kissing crush)",
          items: [
            { title: "Wire and prepare both branches", detail: "Pre-dilate MV and SB. Confirm both balloons expand fully." },
            { title: "Stent the SB with an MV balloon in place", detail: "Position the SB stent protruding 2–3 mm into the MV, with an uninflated balloon parked in the MV across the bifurcation. Deploy the SB stent." },
            { title: "Remove SB balloon and wire, then crush", detail: "Withdraw the SB stent balloon and the SB wire, then inflate the MV balloon to crush the protruding SB stent against the MV wall." },
            { title: "Rewire the SB and perform the first kiss", detail: "Recross into the SB through the crushed struts (often the hardest step and confirmed by imaging if in doubt), dilate the SB ostium with an NC balloon at high pressure, then perform the first kissing inflation." },
            { title: "Stent the MV and POT", detail: "Remove both kissing balloons; the SB wire may be removed now or left jailed and withdrawn after the final rewiring. Deploy the MV stent sized to the distal MV, then POT with an NC balloon sized to the proximal MV." },
            { title: "Rewire the SB and perform the final kiss", detail: "Recross into the SB, dilate its ostium with an NC balloon, then the final kissing inflation." },
            { title: "Final POT and imaging", detail: "Re-POT to correct proximal distortion; IVUS or OCT to confirm SB ostial expansion and MV apposition." },
          ],
        },
        {
          kind: "steps",
          title: "Culotte",
          items: [
            { title: "Wire and prepare both branches", detail: "Best when the two branches are of similar diameter." },
            { title: "Stent the more angulated branch first", detail: "Usually the SB, stented from the SB back into the proximal MV." },
            { title: "POT the first stent", detail: "Expands the proximal segment so that recrossing and the second stent pass more easily." },
            { title: "Recross into the unstented branch", detail: "Rewire the other branch through the struts of the first stent, remove the jailed wire and dilate the struts." },
            { title: "Deploy the second stent", detail: "From the other branch into the proximal MV, overlapping the first stent; keep the overlap short." },
            { title: "Recross, kiss and re-POT", detail: "Rewire the first branch through the second stent, then a kissing inflation with NC balloons. Brilakis treats a final POT after culotte as optional." },
          ],
        },
        {
          kind: "table",
          caption: "Choosing a two-stent technique",
          head: ["Technique", "Best suited to", "Advantages", "Drawbacks"],
          rows: [
            ["TAP", "Bail-out after provisional", "Builds on provisional; minimal metal overlap", "Small metal neocarina in the MV"],
            ["T-stenting", "SB angle close to 90°", "No overlap", "Gap at the SB ostium if the angle is narrow"],
            ["Culotte", "Branches of similar size", "Complete SB ostial coverage", "Double metal layer proximally; two recrossings"],
            ["DK-crush", "Long, severe SB disease; complex distal left main", "Complete SB coverage; strongest data in complex left main", "Many steps; recrossing crushed struts can fail"],
            ["V-stenting", "Medina 0,1,1 (disease-free proximal MV)", "Simple: no rewiring, and both wires stay in place", "Metal neocarina where the stents meet, which can hinder later wiring and devices; needs at least a 7 Fr guide"],
            ["Simultaneous kissing stents", "Emergencies and bail-out only", "Very quick; both wires stay in place", "Long neocarina in the proximal MV that later devices struggle to pass; needs at least a 7 Fr guide"],
          ],
        },
        {
          kind: "p",
          text: "**TAP in practice:** after provisional MV stenting and rewiring, position the SB stent with minimal protrusion into the MV while an uninflated NC balloon sits in the MV stent. Deploy the SB stent, withdraw its balloon slightly into the MV, kiss with the MV balloon, then re-POT.",
        },
        {
          kind: "pitfalls",
          items: [
            "Converting to two stents because the SB looks narrowed after MV stenting when flow is TIMI 3 and the patient is pain-free.",
            "Using V-stenting when the proximal MV is diseased (the disease is left uncovered), or SKS in an elective case (its long neocarina hampers later procedures).",
            "Forgetting to remove the SB wire before crushing, trapping it behind metal.",
            "Recrossing outside the stent (behind struts) and then dilating: the stent is crushed. Confirm wire position with imaging if in doubt.",
            "Omitting final kissing in two-stent techniques: SB ostial underexpansion and restenosis.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Plan two stents for complex lesions (DEFINITION), especially long severe SB disease in a large branch.",
            "DK-crush has the strongest randomised support in complex distal left main lesions; provisional remains the default elsewhere.",
            "Two-stent techniques finish with a kissing inflation (in V-stenting and SKS the simultaneous deployment is the kiss). Brilakis then adds a final POT after DK-crush, keeps the POT balloon just proximal to the neocarina after TAP, and treats a final POT after culotte as optional.",
            "Use intravascular imaging: it improves outcomes in complex bifurcation PCI.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-bif-medina",
      stem: "A proximal LAD lesion lies just before a large diagonal and extends into the diagonal ostium. The LAD beyond the diagonal has no significant disease. What is the Medina classification?",
      options: ["1,0,1", "1,1,0", "0,1,1", "1,1,1", "0,0,1"],
      answer: 0,
      explanation:
        "Medina scores proximal MV, distal MV and side branch in that fixed order: proximal LAD diseased (1), distal LAD spared (0), diagonal ostium diseased (1), giving 1,0,1, a true bifurcation. 1,1,0 is the commonest wrong answer because it reverses the last two digits; it would mean the distal LAD is diseased and the diagonal spared.",
      difficulty: 1,
      refs: ["medina-2006", "supplied-medmastery"],
    },
    {
      id: "cx-q-bif-mv-size",
      stem: "In provisional stenting of an LAD/diagonal bifurcation, from which reference diameter should the main-vessel stent be sized?",
      options: [
        "The distal main vessel beyond the side branch",
        "The proximal main vessel before the side branch",
        "The average of proximal and distal main vessel",
        "The side-branch reference diameter",
      ],
      answer: 0,
      explanation:
        "The stent is sized to the distal MV so that its distal edge does not dissect or rupture the smaller distal segment; the larger proximal segment is then expanded with a POT balloon sized to the proximal reference. Sizing to the proximal MV is the tempting error and risks distal edge injury.",
      difficulty: 1,
      refs: ["ebc-consensus", "supplied-medmastery"],
    },
    {
      id: "cx-q-bif-pot",
      stem: "Where should the POT balloon be positioned after main-vessel stenting across a bifurcation?",
      options: [
        "Distal marker just proximal to the carina, balloon in the proximal MV stent",
        "Centred on the carina so it covers both the proximal and distal main vessel",
        "Across the whole stent length to ensure uniform expansion from end to end",
        "In the distal main vessel just beyond the carina, sized to the distal reference",
        "With the distal marker at the side-branch ostium, just inside the side branch",
      ],
      answer: 0,
      explanation:
        "POT uses a short NC balloon sized to the proximal MV, with its distal end just proximal to the carina, so the proximal stent is expanded without the oversized balloon reaching the distal MV. Centring it on the carina is the common mistake: the oversized balloon then pushes the carina into the side branch and overstretches the distal MV.",
      difficulty: 2,
      refs: ["ebc-consensus", "supplied-medmastery"],
    },
    {
      id: "cx-q-bif-distal-cell",
      stem: "After provisional MV stenting the side branch has TIMI 1 flow. Through which part of the MV stent should you aim to rewire the side branch?",
      options: [
        "A distal cell, close to the carina",
        "A proximal cell, well away from the carina",
        "Any cell, as cell position makes no difference",
        "Behind the stent, alongside the jailed wire",
      ],
      answer: 0,
      explanation:
        "Rewiring a distal cell means that subsequent dilatation pushes struts towards the SB ostium and scaffolds it, leaving the ostium clear. A proximal cell leaves a strut bar floating across the ostium and makes any later SB stent harder to place. Passing behind the stent is never intended: dilating there crushes the stent.",
      difficulty: 2,
      refs: ["ebc-consensus"],
    },
    {
      id: "cx-q-bif-leave-sb",
      stem: "After MV stenting and POT, a 2.5 mm diagonal shows 75% ostial pinching on angiography with TIMI 3 flow. The patient is pain-free with no ECG change. What is the most appropriate next step?",
      options: [
        "Leave the diagonal, or assess it with physiology if truly uncertain",
        "Implant a diagonal stent straight away using the TAP technique",
        "Convert to a culotte strategy with a second stent placed in the diagonal",
        "Perform a routine final kissing inflation without a re-POT",
      ],
      answer: 0,
      explanation:
        "A jailed SB with TIMI 3 flow and no ischaemia is usually left: angiography overestimates jailed SB stenosis, and pressure-wire studies show most such lesions are not functionally significant. Stenting it with TAP is the tempting over-treatment, adding metal and restenosis risk with no benefit. Routine kissing without re-POT distorts the proximal stent.",
      difficulty: 2,
      refs: ["ebc-consensus", "brilakis-manual-pci", "koo-jailed-sb-ffr-2005", "nordic-baltic3-2011"],
    },
    {
      id: "cx-q-bif-definition",
      stem: "Which non-left-main bifurcation meets the DEFINITION criteria for a complex lesion?",
      options: [
        "SB stenosis 90%, SB lesion length 14 mm, moderate calcification, MV lesion length 28 mm",
        "SB stenosis 70%, SB lesion length 6 mm, bifurcation angle 80°, MV reference 2.3 mm",
        "SB stenosis 90%, SB lesion length 5 mm, thrombus, multiple lesions",
        "SB stenosis 60%, SB lesion length 20 mm, heavy calcification, MV lesion length 30 mm",
      ],
      answer: 0,
      explanation:
        "Complex requires one major criterion (outside the left main: SB stenosis of 90% or more and SB lesion length of 10 mm or more) plus at least two minor ones; the 14 mm side-branch lesion meets the major criterion and adds calcification and an MV length of 25 mm or more. The 90% stenosis with a 5 mm side-branch lesion is tempting because of the 90% stenosis, but its SB lesion is only 5 mm long, so the major criterion is not met.",
      difficulty: 3,
      refs: ["definition-2014"],
    },
    {
      id: "cx-q-bif-crush-wire",
      stem: "During DK-crush, the SB stent has been deployed with 1–2 mm protrusion into the main vessel. What must happen before the MV balloon is inflated to crush it?",
      options: [
        "Remove the SB stent balloon and the SB wire",
        "Perform kissing inflation with the SB stent balloon",
        "Deploy the MV stent over the parked balloon",
        "Leave the SB wire in place to preserve access",
        "Perform a POT in the proximal MV",
      ],
      answer: 0,
      explanation:
        "The SB balloon and wire are withdrawn so the protruding SB stent can be crushed without trapping the wire behind metal; access is regained by recrossing before the first kiss. Leaving the SB wire in place is the tempting option because it feels safer, but it would be jailed behind crushed struts and could be impossible to remove.",
      difficulty: 2,
      refs: ["dkcrush5-2017", "supplied-medmastery"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Run a provisional strategy: size the stent to the distal main vessel, POT with an NC balloon sized to the proximal vessel, then confirm apposition at the polygon of confluence on IVUS.",
    },
  ],
  caseIds: ["cx-case-lm-bifurcation"],
};

// ---------------------------------------------------------------------------
// Module 2 — Left main PCI
// ---------------------------------------------------------------------------
const leftMain: Module = {
  id: "cx-left-main",
  title: "Left main disease",
  stage: 5,
  summary:
    "Assess the left main with angiography, physiology and IVUS, decide between PCI and CABG with the heart team, and plan and perform imaging-guided left main PCI.",
  objectives: [
    "Choose views and techniques that reliably show the left main ostium, shaft and bifurcation, and recognise damping and catheter-induced artefact.",
    "Interpret left main FFR and IVUS minimum lumen area, including population differences in IVUS thresholds.",
    "Apply SYNTAX-based heart team reasoning and summarise the direction of EXCEL and NOBLE.",
    "Plan left main PCI by segment, size and optimise it with IVUS, and identify patients who need a haemodynamic support plan.",
  ],
  lessons: [
    {
      id: "cx-lm-assessment",
      title: "Left main: anatomy, angiography and assessment",
      minutes: 6,
      refs: ["supplied-medmastery", "supplied-eh-views", "supplied-oxford", "eapci-imaging-2018", "litro-2011"],
      blocks: [
        {
          kind: "p",
          text: "The left main (LM) arises from the left sinus of Valsalva, runs for a variable length (often about a centimetre) and divides into the LAD and LCx; a ramus intermedius makes it a trifurcation. In a right-dominant system it supplies most of the left ventricle, and in a left-dominant system almost all of it. Myocardial jeopardy is therefore large, and loss of flow during PCI causes rapid global ischaemia.",
        },
        {
          kind: "table",
          caption: "Three left main segments",
          head: ["Segment", "Typical disease", "PCI consideration"],
          rows: [
            ["Ostium", "Aorto-ostial, often fibrotic or calcified", "Damping on engagement; physiology needs the guide disengaged; may need debulking"],
            ["Shaft (body)", "Behaves like any large coronary segment", "Simplest to stent; vessel may exceed some stent platforms' expansion limits"],
            ["Distal bifurcation", "Most common site (roughly two-thirds of LM lesions involve the bifurcation)", "Highest complication and restenosis risk; bifurcation strategy needed"],
          ],
        },
        { kind: "h", text: "Angiography" },
        {
          kind: "list",
          items: [
            "Ostium: LAO straight, AP cranial or LAO cranial. When LM disease is suspected (for example ST elevation in aVR with widespread ST depression), make LAO straight your first view.",
            "Avoid relying on RAO views for the ostium: they look down the barrel of the LM and foreshorten it. Caudal views overlap the ostium with the aortic cusp.",
            "Distal LM: caudal views, especially LAO caudal (spider); RAO caudal and AP caudal are also good. In vertical hearts cranial views may be better.",
            "A non-selective injection into the left sinus shows the true ostium when the catheter tip sits beyond it.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pressure damping or ventricularisation on engagement means the catheter is obstructing flow, often because of ostial LM disease. Withdraw, inject non-selectively, and do not inject forcefully into a damped catheter.",
            "Catheter-induced spasm at the ostium can mimic fixed disease. Give intracoronary nitrate and re-image with the catheter disengaged.",
            "A short LM with deep engagement places the catheter tip in the LAD or LCx, so LM disease is never opacified.",
            "Guide catheters with side holes can hide damping and give falsely reassuring pressures.",
          ],
        },
        { kind: "h", text: "Physiology and imaging" },
        {
          kind: "p",
          text: "LM FFR uses the usual 0.80 threshold, but the guide must be disengaged into the aorta during measurement, which is why intravenous adenosine is often preferred to intracoronary boluses. Significant disease in the proximal LAD or LCx reduces hyperaemic flow across the LM and pushes the LM FFR upwards, so a downstream lesion can make LM disease look less severe than it is.",
        },
        {
          kind: "p",
          text: "IVUS is the imaging workhorse for the LM because it does not need a contrast flush and can image the ostium. In Western populations an IVUS minimum lumen area (MLA) of about 6 mm² is the commonly used threshold for a significant LM stenosis. Studies in Asian populations have suggested lower thresholds of roughly 4.5–5 mm², reflecting smaller vessel size; interpret MLA in the context of the patient, body size and other data rather than as a single cut-off.",
        },
        {
          kind: "table",
          caption: "Tools for assessing the left main",
          head: ["Tool", "Strengths", "Limitations in the LM"],
          rows: [
            ["Angiography", "Rapid; shows anatomy and bifurcation pattern", "Ostial and distal LM often over- or underestimated; overlap and foreshortening"],
            ["FFR", "Functional significance", "Guide must be disengaged; downstream LAD/LCx disease raises LM FFR"],
            ["IVUS", "Plaque burden, MLA, vessel size, extent of disease into LAD/LCx ostia, calcium", "MLA thresholds differ between populations"],
            ["OCT", "High resolution, calcium thickness", "Ostial LM often cannot be cleared of blood; limited penetration in a large vessel"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Ostium: LAO straight, AP or LAO cranial. Distal LM: caudal views.",
            "Damping on engagement is a warning sign of ostial LM disease.",
            "LM FFR needs a disengaged guide; downstream disease raises it.",
            "IVUS MLA thresholds are about 6 mm² in Western cohorts and lower in some Asian cohorts.",
          ],
        },
      ],
    },
    {
      id: "cx-lm-decision",
      title: "Heart team decisions: SYNTAX, PCI or CABG",
      minutes: 5,
      refs: ["esc-revasc-2018", "esc-ccs-2024", "syntax-2009", "excel-2016", "noble-2016", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "Significant LM disease carries a poor prognosis on medical therapy alone, and surgical revascularisation was shown decades ago to improve survival. The question today is usually not whether to revascularise but how. For stable patients this is a heart team decision; in an emergency (STEMI or cardiogenic shock with an LM culprit) the decision is made in the lab and PCI is usually the fastest option.",
        },
        {
          kind: "list",
          items: [
            "Heart team members: interventional cardiologist, cardiac surgeon, non-invasive or general cardiologist, and where relevant an anaesthetist, geriatrician or imaging specialist.",
            "Inputs: SYNTAX score (anatomical complexity), surgical risk (EuroSCORE II or STS), diabetes, LV function, frailty and comorbidity, likely completeness of revascularisation by each route, coexisting valve or aortic disease, and the patient's informed preferences.",
          ],
        },
        {
          kind: "figure",
          id: "aha-segments",
          caption: "The SYNTAX score is built on this coronary segment map, weighting each lesion by the territory it subtends and its complexity (bifurcation, calcium, length, occlusion, thrombus, tortuosity).",
        },
        {
          kind: "table",
          caption: "2018 ESC/EACTS recommendations for left main disease suitable for both procedures",
          head: ["SYNTAX score", "CABG", "PCI"],
          rows: [
            ["Low (0–22)", "Class I", "Class I"],
            ["Intermediate (23–32)", "Class I", "Class IIa"],
            ["High (≥33)", "Class I", "Class III (not recommended)"],
          ],
        },
        {
          kind: "p",
          text: "The 2024 ESC chronic coronary syndrome guideline kept the same broad logic: CABG remains the reference treatment for LM disease, and PCI is a reasonable alternative when anatomy is of low complexity and PCI can achieve revascularisation as complete as surgery. Check the current guideline wording before quoting classes.",
        },
        { kind: "h", text: "The trials (direction only)" },
        {
          kind: "list",
          items: [
            "SYNTAX: introduced the SYNTAX score; in the LM subgroup outcomes with PCI were broadly comparable to CABG at low and intermediate scores, with CABG favoured as complexity rose.",
            "EXCEL (LM disease with low or intermediate SYNTAX, contemporary DES): PCI met non-inferiority against CABG for death, stroke or MI at three years. Longer follow-up and the trial's periprocedural MI definition later became contentious.",
            "NOBLE (LM disease, contemporary DES): CABG was superior for a broader composite including repeat revascularisation, driven by more repeat revascularisation and spontaneous MI after PCI, with similar mortality.",
            "Common thread: medium-term survival is similar in appropriately selected patients, while repeat revascularisation is more frequent after PCI.",
          ],
        },
        {
          kind: "table",
          caption: "Factors that tilt the decision",
          head: ["Tends to favour CABG", "Tends to favour PCI"],
          rows: [
            ["High SYNTAX score or complex multivessel disease", "Isolated ostial or shaft LM disease, low SYNTAX"],
            ["Diabetes with multivessel disease", "High surgical risk, frailty, severe lung disease, porcelain aorta"],
            ["Concomitant valve or aortic surgery needed", "Poor or absent conduits"],
            ["CTOs or anatomy unlikely to allow complete PCI", "Emergency presentation with an LM culprit"],
            ["Patient prefers durability over recovery time", "Patient prefers quicker recovery after informed discussion"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Ad hoc LM PCI in a stable patient straight after the diagnostic run, without heart team review or informed consent about CABG.",
            "Scoring the anatomy optimistically: undercounting calcium, bifurcations or diffuse disease lowers SYNTAX and biases the decision.",
            "Ignoring completeness: a technically good LM stent that leaves a large untreated territory may be worse than CABG.",
            "Assuming 'too old for surgery' without a formal frailty and risk assessment.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Stable LM disease: heart team; emergency LM culprit: treat in the lab.",
            "Low SYNTAX: PCI and CABG are both reasonable; high SYNTAX: CABG.",
            "EXCEL and NOBLE: similar survival, more repeat revascularisation after PCI.",
          ],
        },
      ],
    },
    {
      id: "cx-lm-technique",
      title: "Planning and performing left main PCI",
      minutes: 7,
      refs: ["supplied-medmastery", "eapci-imaging-2018", "definition-2014", "dkcrush5-2017", "ebc-main-2021", "brilakis-manual-pci", "kang-lm-ivus-2011"],
      blocks: [
        {
          kind: "p",
          text: "LM PCI forgives very little. Once flow is compromised, ischaemia is global and rapid, so the plan, the equipment and the bail-out options must be ready before the guide touches the ostium.",
        },
        {
          kind: "list",
          items: [
            "Collaterals and the RCA: an occluded or severely diseased RCA means little support when the LM is obstructed by equipment.",
            "LV function and haemodynamics: severe LV impairment, an occluded RCA or a 'last remaining vessel' should trigger a haemodynamic support plan and at least a spare femoral access (see the high-risk PCI module and the acute-mcs track).",
            "Access and guide size: 6 Fr allows most provisional strategies and kissing with modern balloons; 7–8 Fr is needed for simultaneous kissing stents, larger rotational atherectomy burrs and some two-stent work. Check compatibility charts.",
            "Guide shape: an extra-backup curve suits distal LM work; for ostial disease a guide you can back out of the ostium quickly (for example a Judkins) may be safer than one that dives deep.",
            "Imaging: IVUS available and planned, with pullbacks from both LAD and LCx before stenting.",
            "Lesion preparation kit ready if calcium is present, and a wire and balloon preloaded for severe ostial disease.",
          ],
        },
        { kind: "h", text: "Ostial and shaft lesions" },
        {
          kind: "steps",
          items: [
            { title: "Engage gently and watch the pressure", detail: "Expect damping. Keep injections short and disengage between runs." },
            { title: "Image and size", detail: "IVUS of the LM and the proximal LAD/LCx defines vessel size, plaque extent and calcium. LM diameters are often 4–5.5 mm; choose a stent platform whose maximal expansion diameter covers the LM (check the instructions for use)." },
            { title: "Position for the ostium", detail: "For true aorto-ostial disease, the stent should protrude about 1–2 mm into the aorta. Disengage the guide before deployment so it does not deform the stent edge." },
            { title: "Post-dilate and confirm coverage", detail: "Large NC balloon at high pressure; flare the ostium if needed. An IVUS pullback into the aorta confirms the ostium is covered." },
            { title: "Protect the stent from the guide", detail: "Never push the guide into a freshly placed ostial stent: longitudinal deformation is easy and hard to fix." },
          ],
        },
        { kind: "h", text: "Distal bifurcation lesions" },
        {
          kind: "p",
          text: "Provisional is the default: stent from the LM into the larger or more diseased branch (usually the LAD, a 'cross-over'), POT to the LM diameter, and treat the LCx only if needed. IVUS pullbacks from both branches before stenting show how far plaque extends into the LCx ostium. When the LCx stenosis is 70% or more and the LCx lesion is 10 mm or longer (the DEFINITION LM major criterion), particularly with additional complexity, a planned DK-crush is reasonable in experienced hands.",
        },
        {
          kind: "table",
          caption: "One widely quoted IVUS rule for minimal stent area after LM PCI (approximate values from a Korean cohort; interpret with relative expansion)",
          head: ["Segment", "Target minimal stent area"],
          rows: [
            ["LCx ostium", "About 5 mm²"],
            ["LAD ostium", "About 6 mm²"],
            ["Polygon of confluence", "About 7 mm²"],
            ["LM above the polygon of confluence", "About 8 mm²"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stent too small for the LM, or platform expanded beyond its limit: malapposition, strut fracture and thrombosis.",
            "Ostial stent short of the aorta: residual ostial disease and early restenosis.",
            "Forgetting the LCx after cross-over: assess it in a caudal view and treat it if compromised.",
            "In a trifurcation, the ramus is often the branch at risk; decide in advance whether it matters.",
            "Relying on OCT at the ostium: the LM ostium frequently cannot be cleared of blood.",
          ],
        },
        {
          kind: "pearl",
          text: "Before starting, say aloud what you will do if flow stops: who opens the support device, where the access is, which balloon goes in first. The minutes saved matter more in the LM than anywhere else.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Size an LM-to-LAD cross-over stent from IVUS (LM about 4.8 mm, proximal LAD about 3.6 mm), then POT the LM with an NC balloon sized to the LM and compare the minimal stent areas against the targets.",
        },
        {
          kind: "keypoints",
          items: [
            "Plan support, access, guide, imaging and debulking before engaging.",
            "Ostial LM: 1–2 mm into the aorta, guide disengaged, confirm with IVUS.",
            "Distal LM: provisional by default; planned DK-crush for long, severe LCx disease.",
            "Optimise with IVUS against segment-specific stent area targets.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-lm-ostium-view",
      stem: "A patient with ST elevation in aVR and widespread ST depression is having angiography. Which first view best shows the left main ostium?",
      options: [
        "LAO straight",
        "RAO caudal (30°/20°)",
        "RAO cranial",
        "AP caudal (0°/30°)",
      ],
      answer: 0,
      explanation:
        "LAO straight is orthogonal to the left main ostium and is the recommended first view when LM disease is suspected; AP and LAO cranial are alternatives. RAO caudal is tempting because it is a standard opening view for the left system, but RAO views look down the barrel of the ostium, and caudal views overlap it with the aortic cusp.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "cx-q-lm-ffr-downstream",
      stem: "You measure FFR across an intermediate distal left main lesion. There is also a severe proximal LAD stenosis. How does the LAD lesion affect the left main FFR?",
      options: [
        "It makes the LM FFR higher, so the LM lesion may look less significant than it is",
        "It makes the LM FFR lower, so the LM lesion may look more significant than it is",
        "It has no effect because FFR is lesion-specific",
        "It only matters if the RCA is occluded",
      ],
      answer: 0,
      explanation:
        "A severe downstream stenosis limits hyperaemic flow across the LM, reducing the LM gradient and raising its FFR, so the LM can be underestimated. The tempting answer, a falsely low FFR, would be true only if the pressure wire were placed beyond both lesions, which measures them together rather than the LM alone.",
      difficulty: 3,
      refs: ["supplied-medmastery"],
    },
    {
      id: "cx-q-lm-ivus-mla",
      stem: "Which statement about IVUS minimum lumen area thresholds for left main stenosis is most accurate?",
      options: [
        "About 6 mm² in Western cohorts, with lower thresholds proposed in Asian cohorts",
        "A single universal threshold of 4 mm² applies to every vessel, including the left main",
        "About 6 mm² is used in Asian cohorts and about 4.5 mm² in Western cohorts",
        "IVUS cannot assess the left main reliably, so only FFR should be used to decide",
      ],
      answer: 0,
      explanation:
        "A threshold of about 6 mm² is widely used in Western populations, while studies in Asian patients have suggested roughly 4.5–5 mm², reflecting smaller vessel size. The 4 mm² figure applies to non-LM vessels in older studies and should not be transferred to the LM. Quoting 6 mm² for Asian and 4.5 mm² for Western cohorts reverses the population difference.",
      difficulty: 2,
      refs: ["supplied-medmastery", "eapci-imaging-2018", "litro-2011"],
    },
    {
      id: "cx-q-lm-syntax-high",
      stem: "A stable patient with distal left main disease and three-vessel disease has a SYNTAX score of 38 and acceptable surgical risk. Under the 2018 ESC/EACTS guideline, what is the recommendation for PCI?",
      options: [
        "Not recommended (Class III); CABG is recommended",
        "Class I, as an equivalent alternative to CABG",
        "Class IIa, as a reasonable alternative to CABG",
        "Class IIb, to be decided by the operator's preference",
      ],
      answer: 0,
      explanation:
        "For LM disease with a high SYNTAX score (33 or more), CABG is Class I and PCI is Class III. Class IIa is the tempting answer but applies to intermediate scores (23–32). Low scores (22 or less) give both PCI and CABG Class I.",
      difficulty: 2,
      refs: ["esc-revasc-2018"],
    },
    {
      id: "cx-q-lm-excel-noble",
      stem: "Which finding is common to the EXCEL and NOBLE left main trials?",
      options: [
        "Repeat revascularisation was more frequent after PCI than after CABG",
        "PCI reduced all-cause mortality compared with CABG at five years of follow-up",
        "CABG reduced all-cause mortality by about half in both trials",
        "Stroke was consistently more frequent after PCI than after CABG",
      ],
      answer: 0,
      explanation:
        "Both trials found more repeat revascularisation after PCI, and neither showed a clear survival difference in their primary reports. Stroke is a tempting distractor, but it was not a consistent finding across the two trials, and early stroke risk is generally a concern with surgery rather than PCI. Neither trial showed a mortality benefit for PCI.",
      difficulty: 2,
      refs: ["excel-2016", "noble-2016"],
    },
    {
      id: "cx-q-lm-distal-strategy",
      stem: "Distal LM disease (Medina 1,1,1). IVUS shows LCx ostial disease extending 4 mm, LCx 3.2 mm, LAD 3.8 mm, LM 4.8 mm. What is the most appropriate default strategy?",
      options: [
        "Provisional LM-to-LAD stenting with POT, treating the LCx only if compromised",
        "Planned DK-crush, because it is a true bifurcation with disease in both branches",
        "Simultaneous kissing stents into the LAD and LCx with a new metal carina in the LM",
        "Separate stents to the LAD and LCx ostia without covering the left main itself",
      ],
      answer: 0,
      explanation:
        "The LCx lesion is short (well under 10 mm), so it does not meet the DEFINITION LM major criterion, and provisional is the default. DK-crush is tempting because the lesion is a true bifurcation, but its trial advantage was in more extensive SB disease. SKS leaves a metal carina in a diseased LM, and ostial-only stents leave LM disease untreated.",
      difficulty: 2,
      refs: ["definition-2014", "ebc-main-2021", "dkcrush5-2017"],
    },
    {
      id: "cx-q-lm-ostial-position",
      stem: "How should a stent be positioned for a true aorto-ostial left main lesion?",
      options: [
        "Protruding 1–2 mm into the aorta, with the guide disengaged at deployment",
        "With the proximal marker exactly 2 mm inside the LM so no metal enters the aorta",
        "With the guide deeply engaged to stabilise the stent during deployment",
        "Protruding 5–10 mm into the aorta for safety, so the ostium is surely covered",
      ],
      answer: 0,
      explanation:
        "Ostial plaque is often continuous with aortic wall plaque, so the stent should cover the ostium with a small protrusion into the aorta, deployed with the guide backed out so it cannot crush the edge. Keeping the stent inside the LM is the tempting error: it leaves ostial disease uncovered and causes early restenosis. Long protrusion makes future engagement very difficult.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
  ],
  sims: [
    {
      sim: "views",
      task: "Identify the projections that open the left main ostium (LAO straight, AP or LAO cranial) and those that open the distal left main bifurcation (LAO caudal, RAO caudal).",
    },
    {
      sim: "pci-bench",
      task: "Perform IVUS-guided LM cross-over stenting with POT and compare the result against segment-specific minimal stent area targets.",
    },
  ],
  caseIds: ["cx-case-lm-bifurcation"],
};

// ---------------------------------------------------------------------------
// Module 3 — Calcified lesions
// ---------------------------------------------------------------------------
const calcium: Module = {
  id: "cx-calcium",
  title: "Calcified lesions",
  stage: 4,
  summary:
    "Recognise and grade coronary calcium, understand why it causes stent underexpansion, and work through a lesion-preparation algorithm from NC balloon to lithotripsy, atherectomy and laser.",
  objectives: [
    "Grade calcium on angiography, IVUS and OCT, and calculate the OCT calcium score.",
    "Explain how calcium causes underexpansion and why underexpansion matters.",
    "Apply a stepwise lesion-preparation algorithm and choose a device from imaging findings.",
    "Describe the principles and characteristic hazards of intravascular lithotripsy, rotational and orbital atherectomy and excimer laser.",
  ],
  lessons: [
    {
      id: "cx-ca-recognition",
      title: "Recognising and grading coronary calcium",
      minutes: 5,
      refs: ["fujino-calcium-2018", "eapci-imaging-2018", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        { kind: "h", text: "Why calcium matters" },
        {
          kind: "p",
          text: "Coronary calcium is more common with age, diabetes and chronic kidney disease, and it causes trouble at every stage of PCI. It is the main reason a lesion cannot be crossed, cannot be dilated or cannot be stented to its full size.",
        },
        {
          kind: "list",
          items: [
            "Failure to deliver wires, balloons and stents through a rigid, irregular lumen.",
            "Failure to dilate: the balloon develops a persistent waist.",
            "Stent underexpansion, one of the strongest predictors of stent thrombosis and restenosis.",
            "Malapposition, and damage to the stent's polymer and drug coating during forced delivery.",
            "Stent loss or deformation when pushed hard against calcium.",
            "Dissection and perforation when balloons are forced to high pressure against a rigid ring.",
          ],
        },
        { kind: "h", text: "Angiographic recognition" },
        {
          kind: "p",
          text: "Look before you inject: start acquisition a moment before contrast arrives and scan for radio-opacities along the vessel. Angiography misses a large proportion of the calcium that IVUS detects, so a 'clean' fluoroscopic image does not exclude it.",
        },
        {
          kind: "table",
          caption: "Angiographic calcium grading (standard trial definitions)",
          head: ["Grade", "Appearance before contrast"],
          rows: [
            ["None or mild", "No clear radio-opacity"],
            ["Moderate", "Radio-opacities seen only with cardiac motion, before contrast injection"],
            ["Severe", "Radio-opacities visible without cardiac motion, usually on both sides of the lumen"],
          ],
        },
        { kind: "h", text: "Intravascular imaging" },
        {
          kind: "table",
          caption: "IVUS versus OCT for calcium",
          head: ["Feature", "IVUS", "OCT"],
          rows: [
            ["Appearance", "Bright echoes with acoustic shadowing behind", "Signal-poor area with sharply delineated borders"],
            ["Arc (degrees)", "Measurable", "Measurable"],
            ["Thickness", "Not measurable behind the shadow; reverberations suggest thin calcium", "Measurable (unless very thick)"],
            ["Length", "Measurable on pullback", "Measurable on pullback"],
            ["Depth (superficial vs deep)", "Yes", "Yes, with better resolution"],
            ["Calcified nodule", "Irregular, protruding bright mass", "Protruding, often with an irregular surface"],
            ["Practical limits", "Lower resolution", "Needs a contrast flush; less useful at ostia and in large vessels"],
          ],
        },
        { kind: "h", text: "The OCT calcium score" },
        {
          kind: "table",
          caption: "OCT calcium score (0–4); a score of 4 predicts a high risk of stent underexpansion",
          head: ["Element", "Threshold", "Points"],
          rows: [
            ["Maximum calcium arc", ">180°", "2"],
            ["Maximum calcium thickness", ">0.5 mm", "1"],
            ["Calcium length", ">5 mm", "1"],
          ],
        },
        {
          kind: "p",
          text: "The score is easy to remember as a 'rule of fives': more than 0.5 mm thick, more than 5 mm long, and an arc of more than half the circumference. A score of 4 identifies lesions in which an NC balloon alone is unlikely to achieve adequate expansion, so dedicated calcium modification should be planned before stenting. Lower scores usually respond to NC or modified balloons.",
        },
        {
          kind: "list",
          items: [
            "Circumferential (napkin-ring) calcium cannot be expanded until the ring is fractured.",
            "Calcified nodules protrude into the lumen; they resist balloons and are associated with higher restenosis rates.",
            "Calcium at a bend combines poor deliverability with wire bias, raising the perforation risk of atherectomy.",
            "Long diffuse calcium predicts both delivery problems and underexpansion.",
          ],
        },
        {
          kind: "pearl",
          text: "Thin calcium fractures; thick calcium does not. After any modification, look on imaging for fractures (gaps in the calcium ring). Visible fractures predict good stent expansion far better than the angiogram does.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming no calcium because none is visible on fluoroscopy.",
            "Forgetting that IVUS cannot measure thickness behind the acoustic shadow.",
            "Stenting first and imaging afterwards, when the underexpansion is already permanent.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Severe angiographic calcium is visible without cardiac motion; angiography still misses much calcium.",
            "OCT calcium score: arc >180° (2), thickness >0.5 mm (1), length >5 mm (1); 4 means plan modification.",
            "Underexpansion is the key mechanism of harm.",
          ],
        },
      ],
    },
    {
      id: "cx-ca-algorithm",
      title: "Lesion preparation: a stepwise algorithm",
      minutes: 7,
      refs: ["eapci-imaging-2018", "disrupt-cad3-2020", "fujino-calcium-2018", "renovate-2023", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "The governing rule is simple: if a balloon cannot fully expand the lesion, a stent will not either. A 1:1 non-compliant balloon that expands fully, without a waist, at high pressure is your proof that the lesion is ready for a stent.",
        },
        {
          kind: "figure",
          id: "stent-compliance",
          caption: "Compliance behaviour: semi-compliant balloons grow with pressure and dog-bone around a rigid lesion; non-compliant balloons hold their diameter and transmit pressure to the lesion.",
        },
        {
          kind: "steps",
          title: "Stepwise lesion preparation",
          items: [
            { title: "Image first if you can", detail: "If an imaging catheter crosses, IVUS or OCT tells you arc, thickness, depth, length and nodules, and gives the reference size for every later device." },
            { title: "Build support before you need it", detail: "A well-engaged, supportive guide (7 Fr where possible), an extra-support or buddy wire and a guide extension ready on the table." },
            { title: "If nothing crosses", detail: "Try a small (1.0–1.5 mm) balloon or a microcatheter. If a microcatheter crosses, exchange for an atherectomy wire and use rotational or orbital atherectomy. If not even a microcatheter crosses, excimer laser over the workhorse wire can create a channel." },
            { title: "Test with a 1:1 NC balloon", detail: "Inflate to high pressure within the rated burst pressure. Full expansion without a waist: proceed to stenting." },
            { title: "Persistent waist: choose by imaging", detail: "Thin or moderate calcium: cutting or scoring balloon. Thick, deep or circumferential calcium: intravascular lithotripsy. Residual resistance: very-high-pressure twin-layer NC balloon." },
            { title: "Thick superficial calcium, nodules or devices that will not cross", detail: "Atherectomy to debulk and create a lumen, then lithotripsy or NC balloon as needed. Combinations are common." },
            { title: "Prove the modification", detail: "Repeat the 1:1 NC balloon: it should now expand fully. Imaging should show fractures." },
            { title: "Stent, post-dilate, image", detail: "Deploy, post-dilate with NC balloons sized to the reference, and confirm expansion and apposition on imaging." },
          ],
        },
        {
          kind: "table",
          caption: "Lesion-modification devices",
          head: ["Device", "Mechanism", "Best for", "Limits"],
          rows: [
            ["High-pressure NC balloon", "Concentrates pressure without growing", "First test of any calcified lesion", "Cannot crack thick circumferential calcium; rupture beyond rated pressure"],
            ["Cutting balloon", "Microblades focus force into linear incisions", "Thin–moderate calcium, fibrotic and in-stent lesions", "Bulky, stiff; can dissect"],
            ["Scoring balloon", "External wire elements score the plaque", "Similar to cutting balloon, more deliverable", "Less force than blades"],
            ["Very-high-pressure twin-layer balloon", "Inflates to very high pressures with little growth", "Residual resistant lesions, underexpanded stents", "Bulky; rupture causes dissection or perforation"],
            ["Intravascular lithotripsy (IVL)", "Acoustic pressure waves fracture superficial and deep calcium", "Thick, deep, circumferential calcium; underexpanded segments", "Bulky crossing profile; little effect on nodules or soft plaque"],
            ["Rotational atherectomy (RA)", "Diamond-coated burr ablates hard tissue differentially", "Uncrossable or undilatable superficial calcium", "Needs dedicated wire; slow flow, perforation, burr entrapment"],
            ["Orbital atherectomy (OA)", "Eccentric crown orbits and sands, orbit widening with speed", "Superficial calcium, larger vessels", "Wire bias, perforation, slow flow"],
            ["Excimer laser (ELCA)", "Photoablation over any 0.014 inch wire", "Balloon-uncrossable lesions, underexpanded stents", "Limited effect on heavy calcium alone; dissection"],
          ],
        },
        {
          kind: "table",
          caption: "Expansion targets after stenting (EAPCI imaging consensus, non-left-main vessels)",
          head: ["Measure", "Target"],
          rows: [
            ["Relative expansion", "Minimal stent area >80% of the average reference lumen area"],
            ["Absolute minimal stent area (IVUS)", ">5.5 mm²"],
            ["Absolute minimal stent area (OCT)", ">4.5 mm²"],
          ],
        },
        {
          kind: "p",
          text: "Intravascular imaging guidance improves outcomes in complex PCI (RENOVATE-COMPLEX-PCI), and calcified lesions are where it changes decisions most often: device choice, sizing and whether expansion is good enough.",
        },
        {
          kind: "pitfalls",
          items: [
            "Inflating a semi-compliant balloon to very high pressure in a resistant lesion: it dog-bones, injures the edges and may rupture.",
            "Exceeding rated burst pressure 'just once more': balloon rupture in calcium can dissect or perforate the vessel.",
            "Pushing a stent through a lesion that no balloon has expanded: underexpansion, stent stripping or loss.",
            "Leaving a buddy wire alongside a stent in a calcified segment: it can become trapped.",
            "Escalating devices without imaging, and then not knowing why expansion failed.",
          ],
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Inflate a 3.0 mm NC balloon in a calcified lesion; when a waist persists, select a modification device, then stent and post-dilate until the minimal stent area exceeds 80% of the reference.",
        },
        {
          kind: "keypoints",
          items: [
            "Full expansion of a 1:1 NC balloon is the gatekeeper for stenting.",
            "Choose modification by imaging: cutting/scoring for thin calcium, IVL for thick or deep calcium, atherectomy when devices cannot cross or for nodules.",
            "Targets: minimal stent area >80% of reference, >5.5 mm² by IVUS or >4.5 mm² by OCT outside the left main.",
          ],
        },
      ],
    },
    {
      id: "cx-ca-devices",
      title: "Atherectomy, lithotripsy and laser: principles and hazards",
      minutes: 7,
      refs: ["disrupt-cad3-2020", "supplied-medmastery", "brilakis-manual-pci", "seattle-complications-2020", "barbato-rota-consensus-2015"],
      blocks: [
        { kind: "h", text: "Intravascular lithotripsy" },
        {
          kind: "p",
          text: "An IVL catheter is a balloon containing emitters that generate acoustic pressure waves. The balloon is sized about 1:1 to the reference vessel and inflated at low pressure to couple with the wall while pulses are delivered, then raised towards nominal pressure to dilate; cycles are repeated along the lesion. Pulses per catheter are limited, so check the instructions for use. The waves fracture both superficial and deep calcium with little effect on soft tissue. DISRUPT CAD III, a single-arm study, reported high procedural success with low rates of serious angiographic complications in severely calcified lesions.",
        },
        {
          kind: "list",
          items: [
            "Advantages: works over a standard workhorse wire, familiar balloon technique, effective on deep calcium.",
            "Limitations: bulky profile that may not cross very tight lesions (pre-dilate with a small balloon or debulk first); limited effect on calcified nodules.",
            "Ventricular ectopy timed with pulses is recognised and usually benign; keep the rhythm on screen.",
          ],
        },
        { kind: "h", text: "Rotational atherectomy" },
        {
          kind: "steps",
          items: [
            { title: "Wire", detail: "Exchange to the dedicated stainless-steel RA wire through a microcatheter. If the RA wire cannot be delivered, RA is not possible." },
            { title: "Burr size", detail: "Start small. Expert consensus suggests a burr-to-artery ratio of about 0.5–0.6; the aim is to modify, not to debulk to the full lumen." },
            { title: "Guide compatibility", detail: "Smaller burrs pass through a 6 Fr guide; larger burrs need 7–8 Fr. Check the compatibility chart." },
            { title: "Speed and runs", detail: "Platform speed in the range of about 135 000–180 000 rpm is commonly recommended. Use short runs, ideally under 15 seconds (Brilakis), with at least 30 seconds between runs, a gentle pecking motion, and avoid decelerations of more than about 5000 rpm, which signal the burr is working too hard." },
            { title: "Before advancing", detail: "Activate proximal to the lesion and release stored tension in the system so the burr does not jump forward." },
            { title: "Flush and rhythm", detail: "Use the lubricant and vasodilator flush per local protocol. Bradycardia and AV block are common when treating a dominant RCA or LCx; many operators place a temporary pacing wire or have one ready in these vessels." },
          ],
        },
        { kind: "h", text: "Orbital atherectomy" },
        {
          kind: "p",
          text: "An eccentrically mounted diamond-coated crown orbits as it spins, sanding the wall in both directions; the orbit widens as speed increases, so one crown can treat a range of vessel sizes. It uses its own dedicated wire. Hazards resemble those of RA: wire bias on bends, perforation, dissection and slow flow.",
        },
        { kind: "h", text: "Excimer laser coronary atherectomy" },
        {
          kind: "p",
          text: "ELCA delivers ultraviolet photoablation through a catheter that tracks over any 0.014 inch wire. It is most useful when a workhorse wire has crossed but neither a balloon nor a microcatheter will follow, and in underexpanded stents. On its own it does little to heavy calcium, but it often creates enough channel for a microcatheter, an RA wire or a small balloon. Lasing with contrast in the field increases the effect and also the risk of dissection and perforation.",
        },
        {
          kind: "table",
          caption: "Complications to anticipate (management is covered in the complications track)",
          head: ["Complication", "Why it happens", "Prevention and recognition"],
          rows: [
            ["Slow flow or no-reflow", "Microparticulate debris, especially with RA and OA", "Short runs, small burr, flush, adequate perfusion pressure; watch flow after each run"],
            ["Perforation", "Wire bias on bends, oversized devices, balloon rupture", "Conservative sizing, care at angulated segments, respect rated burst pressure"],
            ["Burr entrapment", "Burr passes a lesion without ablating it and cannot be withdrawn", "Avoid forceful pushing and long runs; never stop the burr distal to a tight lesion"],
            ["Dissection", "Forceful dilatation, cutting balloons, laser with contrast", "Image, stage escalation, stent appropriately"],
            ["Bradycardia, AV block, hypotension", "RA in dominant RCA/LCx, slow flow", "Pacing back-up, vasopressors ready"],
            ["Stent loss or stripping", "Stent forced through unprepared calcium", "Prepare the lesion first; use a guide extension"],
          ],
        },
        {
          kind: "pearl",
          text: "Plan the order before you start: if a device is likely to be needed, decide in advance how you will exchange to its wire and which guide it needs. Changing guides in the middle of a calcified case wastes time and contrast.",
        },
        {
          kind: "keypoints",
          items: [
            "IVL: 1:1 sizing, low-pressure pulses, effective on deep calcium, limited by profile.",
            "RA: dedicated wire, burr-to-artery ratio about 0.5–0.6, short runs, avoid large decelerations.",
            "ELCA: crosses over any wire when nothing else will follow.",
            "Anticipate slow flow, perforation, entrapment and bradycardia.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-ca-oct-score",
      stem: "OCT before stenting shows calcium with a maximum arc of 270°, maximum thickness 0.9 mm and length 8 mm. What is the OCT calcium score and its implication?",
      options: [
        "4: high risk of stent underexpansion; modify the calcium before stenting",
        "3: moderate risk; direct stenting is reasonable",
        "2: low risk; a semi-compliant balloon is sufficient",
        "4: high risk of perforation; avoid any balloon above nominal pressure",
      ],
      answer: 0,
      explanation:
        "Arc >180° scores 2, thickness >0.5 mm scores 1 and length >5 mm scores 1, total 4, which predicts underexpansion and calls for dedicated modification such as IVL or atherectomy before stenting. The perforation option has the right number but the wrong meaning: the score predicts underexpansion, not perforation.",
      difficulty: 2,
      refs: ["fujino-calcium-2018"],
    },
    {
      id: "cx-q-ca-angio-severe",
      stem: "On angiography, which finding defines severe coronary calcification?",
      options: [
        "Opacities visible without cardiac motion before contrast, usually both sides",
        "Radio-opacities visible only during cardiac motion before contrast injection",
        "A lesion that needs more than 16 atm to dilate with a non-compliant balloon",
        "Haziness at the lesion after contrast injection, with a filling defect",
      ],
      answer: 0,
      explanation:
        "Severe calcium is seen even without cardiac motion and typically on both sides of the vessel. Visibility only with cardiac motion is the definition of moderate calcium, the main distractor. Haziness after contrast suggests thrombus or dissection rather than calcium.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "cx-q-ca-ivus-thickness",
      stem: "Which calcium feature can OCT measure that IVUS generally cannot?",
      options: ["Thickness", "Arc", "Length", "Superficial versus deep location"],
      answer: 0,
      explanation:
        "On IVUS calcium casts an acoustic shadow, so its back edge and therefore thickness cannot be measured, although reverberations hint at thin calcium. OCT light penetrates calcium and shows both borders. Arc is the tempting distractor, but both modalities measure arc and length.",
      difficulty: 1,
      refs: ["eapci-imaging-2018"],
    },
    {
      id: "cx-q-ca-dogbone",
      stem: "A 3.0 mm NC balloon in a mid RCA lesion keeps a tight waist at its rated burst pressure. IVUS shows 360° superficial calcium with no reverberations. What is the best next step?",
      options: [
        "Calcium modification, such as intravascular lithotripsy, before stenting",
        "Deploy a 3.0 mm stent and post-dilate it at high pressure to crack the calcium",
        "Inflate the same NC balloon 6 atm above its rated burst pressure",
        "Switch to a 3.5 mm semi-compliant balloon at high pressure",
      ],
      answer: 0,
      explanation:
        "A persistent waist in thick circumferential calcium means the lesion is not ready for a stent; IVL (or atherectomy) is needed to fracture it. Stenting is the tempting shortcut but leaves a permanently underexpanded stent. Exceeding rated burst pressure risks rupture and perforation, and a semi-compliant balloon will dog-bone and injure the edges.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "cx-q-ca-burr-ratio",
      stem: "Expert consensus on rotational atherectomy recommends which approximate burr-to-artery ratio?",
      options: ["0.5–0.6", "0.8–0.9", "1.0", "0.2–0.3"],
      answer: 0,
      explanation:
        "Modern RA aims to modify plaque so balloons and stents can expand, not to debulk to the full lumen, so a burr-to-artery ratio of about 0.5–0.6 is recommended. Ratios of 0.8 or more were used in the debulking era and increase slow flow, dissection and perforation.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "barbato-rota-consensus-2015"],
    },
    {
      id: "cx-q-ca-laser",
      stem: "A workhorse wire has crossed a severely calcified lesion, but neither a 1.0 mm balloon nor a microcatheter will follow, so the wire cannot be exchanged. Which device can be used next over the existing wire?",
      options: ["Excimer laser catheter", "Rotational atherectomy burr", "Intravascular lithotripsy balloon", "Cutting balloon"],
      answer: 0,
      explanation:
        "Excimer laser tracks over any 0.014 inch wire and can create a channel for a microcatheter or balloon. RA is the tempting answer, but it requires exchange to its dedicated wire, which needs a microcatheter to cross first. IVL and cutting balloons are bulkier than a 1.0 mm balloon and will not cross.",
      difficulty: 3,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "cx-q-ca-ivl-sizing",
      stem: "How is an intravascular lithotripsy balloon sized and used?",
      options: [
        "About 1:1 to the reference, at low pressure during pulses, then raised towards nominal",
        "About 0.5:1 to the reference vessel, inflated to very high pressure while the pulses are given",
        "Oversized by 1 mm to ensure wall contact, inflated to rated burst pressure throughout",
        "Sized to the minimum lumen diameter and kept deflated while the pulses are delivered",
      ],
      answer: 0,
      explanation:
        "IVL balloons are sized about 1:1 to the reference so the balloon couples with the wall, pulses are delivered at low pressure, and pressure is then raised to dilate. Undersizing to about 0.5:1 loses wall contact and the energy transfer that fractures calcium. Oversizing and high pressure defeat the purpose of a low-pressure, energy-based device.",
      difficulty: 2,
      refs: ["disrupt-cad3-2020"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Prepare a heavily calcified lesion: test with a 1:1 NC balloon, modify the calcium when a waist persists, then stent and optimise to imaging-based expansion targets.",
    },
  ],
  caseIds: ["cx-case-calcified-rca"],
};

// ---------------------------------------------------------------------------
// Module 4 — Chronic total occlusions
// ---------------------------------------------------------------------------
const cto: Module = {
  id: "cx-cto",
  title: "Chronic total occlusions",
  stage: 5,
  summary:
    "Select patients who benefit from CTO PCI, plan with dual injection and the four angiographic parameters, apply the hybrid algorithm, and respect stopping rules and CTO-specific dangers.",
  objectives: [
    "Define a CTO and summarise who benefits from CTO PCI and what the trials show.",
    "Plan a CTO procedure using dual injection, the four angiographic parameters and the J-CTO score.",
    "Describe antegrade wire escalation, antegrade dissection and re-entry, retrograde crossing, reverse CART and externalisation.",
    "Apply contrast, radiation and time stopping rules and anticipate donor-vessel and collateral complications.",
  ],
  lessons: [
    {
      id: "cx-cto-why",
      title: "CTO: definition, benefit and case selection",
      minutes: 5,
      refs: ["cto-consensus-2019", "euro-cto-2018", "brilakis-manual-cto", "supplied-medmastery", "esc-ccs-2024", "decision-cto-2019"],
      blocks: [
        {
          kind: "p",
          text: "A chronic total occlusion is a coronary occlusion with no antegrade flow through the occluded segment (TIMI 0) and an estimated duration of at least three months. Duration is estimated from the history (onset of symptoms, a prior infarct) or a previous angiogram. A near-occlusion with faint antegrade filling (TIMI 1) is sometimes called a functional occlusion; it is not a true CTO, although the techniques overlap.",
        },
        {
          kind: "table",
          caption: "CTO anatomy",
          head: ["Term", "Meaning"],
          rows: [
            ["Proximal cap", "The entry point of the occlusion; often fibrotic and calcified, the hardest part to penetrate"],
            ["Stump", "Tapered (funnel into the cap, favourable) or blunt (no clear entry, unfavourable)"],
            ["Occlusion body", "The occluded segment; may contain loose tissue and microchannels"],
            ["Distal cap", "Where the occlusion ends; often softer than the proximal cap"],
            ["Bridging collaterals", "Small vessels around the occlusion that can mimic a lumen"],
            ["Interventional collaterals", "Collaterals large and straight enough to be crossed with a wire and microcatheter"],
          ],
        },
        { kind: "h", text: "Who benefits" },
        {
          kind: "list",
          items: [
            "The main established benefit is symptomatic. In EURO-CTO, CTO PCI improved angina and quality of life at one year compared with optimal medical therapy.",
            "Randomised trials have not shown that CTO PCI reduces death or myocardial infarction, and a trial comparing CTO PCI with medical therapy (DECISION-CTO) found no difference in major events.",
            "Collaterals do not make the territory normal: myocardium supplied only by collaterals almost always behaves as if subtended by a severe stenosis under stress.",
            "The best candidate has symptoms attributable to the CTO territory despite medical therapy, with viable myocardium in that territory.",
          ],
        },
        {
          kind: "table",
          caption: "Weighing a CTO attempt",
          head: ["Favours an attempt", "Favours medical therapy or surgery"],
          rows: [
            ["Angina or equivalent despite optimal medical therapy", "No symptoms, or symptoms not plausibly from the CTO territory"],
            ["Viable myocardium in the territory", "Territory infarcted and non-viable"],
            ["Single CTO with otherwise limited disease", "Multivessel disease with a high SYNTAX score: discuss CABG"],
            ["Experienced CTO operator and team available", "Operator without CTO training or access to all strategies"],
          ],
        },
        {
          kind: "p",
          text: "CTO PCI carries a higher complication rate than non-CTO PCI: perforation and tamponade, donor-vessel injury, periprocedural MI, contrast nephropathy and radiation skin injury. Contemporary success rates above 90% come from expert operators using all crossing strategies. Dedicated CTO lists, a stocked CTO trolley and a trained team are part of the treatment.",
        },
        {
          kind: "pitfalls",
          items: [
            "An ad hoc CTO attempt straight after a diagnostic angiogram, without dual injection, planning or consent for CTO-specific risks.",
            "Treating an asymptomatic CTO into scar to 'complete' revascularisation.",
            "Ignoring the alternative of CABG when the CTO is part of complex multivessel disease.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "CTO: TIMI 0 flow in the occluded segment for an estimated three months or more.",
            "Main proven benefit: angina and quality of life (EURO-CTO), not death or MI.",
            "Select symptomatic patients with viable territory; plan electively with an experienced team.",
          ],
        },
      ],
    },
    {
      id: "cx-cto-planning",
      title: "Reading the CTO angiogram: dual injection and the four parameters",
      minutes: 6,
      refs: ["cto-consensus-2019", "brilakis-manual-cto", "jcto-2011", "rentrop-1985", "supplied-eh-views", "supplied-medmastery", "werner-collaterals-2003", "brilakis-cto-algorithm-2012"],
      blocks: [
        {
          kind: "p",
          text: "In CTO PCI the angiogram is the plan. A careful review before you take any device out of its packet decides the strategy, predicts difficulty and shows you where the dangers are.",
        },
        {
          kind: "steps",
          title: "Dual injection",
          items: [
            { title: "Two guides, two arteries", detail: "One guide in the occluded vessel, one in the donor vessel that supplies the collaterals. A single injection cannot show the distal vessel when it fills only from the other side." },
            { title: "Inject the donor first", detail: "Start the donor injection, then inject the occluded vessel a beat or two later, so collateral filling of the distal vessel coincides with antegrade filling of the proximal cap." },
            { title: "Low magnification, long acquisition", detail: "Keep the whole occlusion and collateral course in the field, with minimal panning, and record long enough to see late collateral filling." },
            { title: "Multiple projections", detail: "At least two orthogonal views of the occlusion, plus views that lay out the collaterals you might use." },
          ],
        },
        { kind: "h", text: "The four angiographic parameters" },
        {
          kind: "table",
          head: ["Parameter", "What you look for", "Why it matters"],
          rows: [
            ["Proximal cap", "Clear entry point or ambiguous (cannot tell where the occlusion starts, often at a side branch)", "An ambiguous cap makes antegrade entry risky and favours retrograde or cap-clarifying techniques"],
            ["Lesion length", "Shorter or longer than about 20 mm", "Long occlusions are slower to wire and suit dissection and re-entry"],
            ["Distal vessel", "Size, disease, and whether a major bifurcation sits at the distal cap", "A good distal 'landing zone' allows antegrade re-entry; a poor one favours retrograde"],
            ["Interventional collaterals", "Septal or epicardial channels that a wire could cross, their size, tortuosity and entry/exit angles", "Determines whether a retrograde approach is available"],
          ],
        },
        { kind: "h", text: "The J-CTO score" },
        {
          kind: "table",
          caption: "J-CTO score: one point each; originally developed to predict successful wire crossing within 30 minutes",
          head: ["Feature", "Point if present"],
          rows: [
            ["Blunt stump (no tapered entry)", "1"],
            ["Calcification within the occlusion", "1"],
            ["Bending of more than 45° within the occluded segment", "1"],
            ["Occlusion length of 20 mm or more", "1"],
            ["Previous failed attempt", "1"],
          ],
        },
        {
          kind: "p",
          text: "J-CTO 0 is easy, 1 intermediate, 2 difficult and 3 or more very difficult. It is a planning and case-selection tool, not a decision rule; other scores exist (for example PROGRESS-CTO) that also weigh collaterals and the proximal cap. CT coronary angiography can clarify course, calcium and length, especially for ambiguous caps or repeat attempts.",
        },
        { kind: "h", text: "Collaterals" },
        {
          kind: "p",
          text: "Collaterals form between neighbouring arteries: septal connections between LAD and posterior descending artery, epicardial connections between the apical LAD and PDA, between distal LCx and the RCA's AV continuation, and between obtuse marginals and posterolateral branches. Atrial channels and the conus can also contribute (Vieussens' ring from the conus to the LAD; Kugel's artery through the atrial septum).",
        },
        {
          kind: "table",
          caption: "Grading collateral filling (Rentrop)",
          head: ["Grade", "Filling of the occluded vessel"],
          rows: [
            ["0", "None"],
            ["1", "Side branches only"],
            ["2", "Partial filling of the epicardial vessel"],
            ["3", "Complete filling of the epicardial vessel"],
          ],
        },
        {
          kind: "list",
          items: [
            "Rentrop describes how well the distal vessel fills; for retrograde planning you also need the size and continuity of each channel (graded CC0 to CC2), its tortuosity and its entry and exit angles.",
            "Septal collaterals are preferred for retrograde crossing: a septal perforation rarely causes tamponade.",
            "Epicardial collaterals are more tortuous and their perforation can cause tamponade quickly.",
            "In patients with prior CABG, an epicardial perforation can cause a loculated haematoma that compresses a cardiac chamber and may not be drainable by pericardiocentesis.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Planning from a single injection: the distal vessel is underestimated or missed.",
            "Mistaking bridging collaterals for the occluded vessel's lumen.",
            "Missing a bifurcation at the distal cap, where dissection and re-entry could lose a branch.",
            "Not reviewing old angiograms: a previous film may show the course of the vessel before it occluded.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Dual injection: donor first, low magnification, long acquisition.",
            "Four parameters: proximal cap, length, distal vessel, interventional collaterals.",
            "J-CTO predicts difficulty; it does not tell you which strategy to use.",
            "Septal collaterals are the safer retrograde channels.",
          ],
        },
      ],
    },
    {
      id: "cx-cto-hybrid",
      title: "The hybrid algorithm: antegrade and retrograde crossing",
      minutes: 6,
      refs: ["cto-consensus-2019", "brilakis-manual-cto", "supplied-medmastery", "brilakis-cto-algorithm-2012", "ungureanu-portal-techniques-2025"],
      blocks: [
        {
          kind: "p",
          text: "The hybrid approach treats the crossing strategies as tools in one kit. Start with the strategy most likely to succeed safely and efficiently given the four parameters, and switch early when progress stalls rather than persisting with one technique until contrast, radiation or time run out.",
        },
        {
          kind: "figure",
          id: "cto-algorithm",
          caption: "Hybrid CTO algorithm: dual injection, assessment of proximal cap, length, distal vessel and collaterals, then antegrade wire escalation, antegrade dissection and re-entry or retrograde, with early strategy change.",
        },
        {
          kind: "table",
          caption: "Typical initial strategy",
          head: ["Angiographic situation", "Usual first strategy"],
          rows: [
            ["Clear proximal cap, short occlusion, good distal vessel", "Antegrade wire escalation"],
            ["Clear proximal cap, long occlusion, good distal landing zone", "Antegrade wire escalation with an early move to dissection and re-entry (the original algorithm favoured primary dissection and re-entry here)"],
            ["Ambiguous proximal cap with interventional collaterals", "Retrograde"],
            ["Poor distal vessel or bifurcation at the distal cap, with collaterals", "Retrograde"],
            ["Ambiguous proximal cap without usable collaterals", "Clarify the cap: IVUS from a side branch, CT, or cap-modification techniques"],
          ],
        },
        {
          kind: "steps",
          title: "Antegrade wire escalation (AWE)",
          items: [
            { title: "Microcatheter to the cap", detail: "Always work through a microcatheter: it supports the wire, allows exchanges and lets you change tip shape quickly." },
            { title: "Start soft and tapered", detail: "A soft, polymer-jacketed, tapered-tip wire can follow microchannels through a tapered stump." },
            { title: "Escalate tip load", detail: "Move to intermediate and then stiff, tapered-tip wires (composite-core or high tip-load designs) to penetrate a hard cap and steer through the body." },
            { title: "Confirm position", detail: "Check the wire tip in orthogonal views with contralateral injection before advancing the microcatheter. A wire outside the vessel architecture must be withdrawn and redirected." },
          ],
        },
        {
          kind: "steps",
          title: "Antegrade dissection and re-entry (ADR)",
          items: [
            { title: "Enter the subintimal space deliberately", detail: "Advance a knuckled polymer-jacketed wire (a loop that cannot perforate easily) or a blunt dissection catheter through the occlusion within the vessel wall." },
            { title: "Stop near the distal cap", detail: "Keep the dissection short and re-enter just beyond the distal cap to preserve side branches." },
            { title: "Re-enter the true lumen", detail: "Use a dedicated re-entry balloon with a stiff, sharp re-entry wire, guided by contralateral injection; wire-based re-entry is an alternative." },
            { title: "Protect the distal true lumen", detail: "Avoid antegrade contrast injections once in the subintimal space: the expanding haematoma compresses the true lumen. Decompression techniques exist if it happens." },
          ],
        },
        {
          kind: "steps",
          title: "Retrograde crossing",
          items: [
            { title: "Select the collateral", detail: "Usually a septal channel. Use a soft polymer-jacketed wire through a microcatheter; tip injections through the microcatheter define the course." },
            { title: "Cross to the distal vessel", detail: "Advance wire and then microcatheter through the collateral into the occluded vessel beyond the distal cap." },
            { title: "Cross the occlusion", detail: "Retrograde wire escalation through the (often softer) distal cap, or a dissection-based technique." },
            { title: "Reverse CART", detail: "Inflate an antegrade balloon in the subintimal space to create a shared space, then steer the retrograde wire into it and on into the proximal true lumen and antegrade guide. IVUS helps size the balloon and locate the wires; a guide extension can shorten the distance." },
            { title: "Externalise", detail: "Advance the retrograde microcatheter into the antegrade guide and exchange for a long externalisation wire, which is pulled out through the antegrade guide to create a rail." },
            { title: "Treat antegradely", detail: "Deliver balloons and stents over the externalised wire from the antegrade side, keeping tension low and watching both guides." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Persisting with one wire or one strategy for an hour: the algorithm works because it changes strategy early.",
            "Antegrade contrast injection after entering the subintimal space.",
            "Dragging a retrograde microcatheter or wire through a collateral without a microcatheter covering it: collateral injury.",
            "High tension on an externalised wire, which strains the collateral channel and risks injury to the donor-artery ostium.",
            "Ballooning or stenting before confirming the wire is in the distal true lumen.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "AWE for clear caps and short occlusions; ADR for long occlusions with a good landing zone; retrograde for ambiguous caps or poor distal vessels with usable collaterals.",
            "Reverse CART connects antegrade and retrograde wires; externalisation provides a rail.",
            "Change strategy early when progress stalls.",
          ],
        },
      ],
    },
    {
      id: "cx-cto-safety",
      title: "Equipment, stopping rules and CTO-specific dangers",
      minutes: 6,
      refs: ["cto-consensus-2019", "brilakis-manual-cto", "radiation-consensus-2018", "supplied-medmastery", "seattle-complications-2020", "brilakis-manual-pci", "laskey-vcrcl-2007", "wu-global-cto-algorithm-2021"],
      blocks: [
        {
          kind: "table",
          caption: "Wire families (brand names in parentheses are examples only)",
          head: ["Family", "Typical use"],
          rows: [
            ["Soft, polymer-jacketed, tapered (Fielder XT type)", "Microchannels, tapered stumps, collateral crossing"],
            ["Composite-core, intermediate to stiff (Gaia type)", "Controlled, torquable penetration and steering through the occlusion"],
            ["Stiff, tapered, high tip-load (Confianza type)", "Penetrating a hard proximal or distal cap"],
            ["Stiff, polymer-jacketed (Pilot type)", "Knuckle wire for dissection; tracking through long occlusions"],
            ["Long externalisation wires (about 330–350 cm)", "Retrograde externalisation"],
          ],
        },
        {
          kind: "table",
          caption: "Other CTO equipment",
          head: ["Device", "Role"],
          rows: [
            ["Microcatheters", "Support, wire exchange, tip injections, collateral crossing"],
            ["Dual-lumen catheters", "Second-wire access at side branches and for parallel wiring"],
            ["Blunt dissection catheter", "Controlled subintimal advance"],
            ["Re-entry balloon and wire", "Antegrade re-entry into the distal true lumen"],
            ["Snares", "Capture of a retrograde wire"],
            ["Guide extensions and long sheaths", "Support; long sheaths improve guide control in tortuous iliacs"],
            ["IVUS", "Cap identification, wire position, reverse CART and vessel sizing"],
          ],
        },
        { kind: "h", text: "Access, anticoagulation and set-up" },
        {
          kind: "list",
          items: [
            "Dual arterial access (biradial, bifemoral or radial–femoral), often with larger guides for the antegrade side; shorter guides help retrograde externalisation reach.",
            "Anticoagulation is checked regularly: commonly quoted ACT targets are at least 300 seconds for antegrade and at least 350 seconds for retrograde work. Thrombosis of a donor vessel during retrograde work can be catastrophic.",
            "Monitor contrast, air kerma and elapsed time continuously, announced by the team at set intervals.",
          ],
        },
        {
          kind: "table",
          caption: "When to consider stopping (Brilakis 21.8.5; 2019 global CTO consensus; 2021 global crossing algorithm)",
          head: ["Measure", "Consider stopping when"],
          rows: [
            ["Contrast", "Volume exceeds 3.7 × the estimated creatinine clearance (mL)"],
            ["Radiation", "Air kerma exceeds 5 Gy, unless the procedure is very close to success"],
            ["Time", "A long procedure (the 2021 global crossing algorithm lists long procedural time but gives no threshold)"],
            ["Clinical", "Complication, patient distress, operator fatigue, or no progress despite strategy changes"],
          ],
        },
        {
          kind: "p",
          text: "An unsuccessful attempt need not be wasted. If a long subintimal track has been created, balloon angioplasty within it (subintimal plaque modification, an 'investment procedure') can make a repeat attempt after a few months more likely to succeed. Patients who received a high radiation dose need skin follow-up per local protocol.",
        },
        {
          kind: "table",
          caption: "CTO-specific dangers (prevention and recognition; management is in the complications track)",
          head: ["Danger", "Mechanism", "Prevention and recognition"],
          rows: [
            ["Donor vessel dissection or thrombosis", "Deep guide intubation under traction, ischaemia from equipment in collaterals, low ACT", "Watch the donor guide and pressure, keep ACT high, inject the donor regularly"],
            ["Collateral perforation", "Wire or microcatheter injury, especially in epicardial channels", "Prefer septals; never advance without a microcatheter; check for staining"],
            ["Loculated haematoma after prior CABG", "Epicardial collateral perforation with adherent pericardium", "Avoid epicardial channels where possible; low threshold to image with echo"],
            ["Wire exit perforation", "Stiff wire outside the vessel architecture", "Orthogonal views with contralateral injection before advancing devices"],
            ["Side-branch loss", "Long subintimal track and re-entry beyond branches", "Re-enter close to the distal cap; image"],
            ["Aortocoronary dissection", "Guide trauma, typically RCA", "Gentle guide handling; avoid forceful injections into a damped catheter"],
            ["Radiation skin injury and contrast nephropathy", "Long procedures", "Collimation, frame rate reduction, angulation changes; stopping rules"],
          ],
        },
        {
          kind: "pearl",
          text: "Before you remove the last wire, inject the donor vessel and the treated vessel. Collateral and donor-vessel injuries are often silent until you look for them.",
        },
        {
          kind: "p",
          text: "After crossing, the distal vessel usually looks small because it has been underfilled for months. Give intracoronary nitrate, size with IVUS, and avoid oversizing; the vessel often enlarges after flow is restored. Do not land a long stent in a tiny distal vessel with poor run-off.",
        },
        {
          kind: "keypoints",
          items: [
            "Consider stopping at contrast >3.7 × estimated creatinine clearance, air kerma >5 Gy without crossing or substantial progress, or a long procedure.",
            "Keep ACT high, especially in retrograde work.",
            "Protect the donor vessel and collaterals; check both before finishing.",
            "Size the recanalised distal vessel with IVUS after nitrate.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-cto-definition",
      stem: "Which definition best describes a coronary chronic total occlusion?",
      options: [
        "TIMI 0 flow in the occluded segment, estimated duration at least 3 months",
        "TIMI 1 flow through a lesion that has been present for at least 1 month",
        "Any occlusion whose distal vessel fills by collaterals from another artery",
        "A 99% stenosis with TIMI 2 flow that has been present for at least 6 weeks",
      ],
      answer: 0,
      explanation:
        "A CTO requires TIMI 0 flow within the occluded segment and an estimated duration of three months or more. TIMI 1 flow with faint antegrade filling describes a functional occlusion, the main distractor; it is not a true CTO. Collateral filling occurs within days of an acute occlusion and does not define chronicity.",
      difficulty: 1,
      refs: ["cto-consensus-2019", "supplied-medmastery"],
    },
    {
      id: "cx-q-cto-benefit",
      stem: "What is the best-established benefit of CTO PCI from randomised trials?",
      options: [
        "Improvement in angina and quality of life",
        "Reduction in all-cause mortality",
        "Reduction in spontaneous myocardial infarction",
        "Reduction in sudden cardiac death",
      ],
      answer: 0,
      explanation:
        "EURO-CTO showed improved angina and quality of life with CTO PCI compared with optimal medical therapy. Mortality benefit is tempting because observational data link successful CTO PCI with better survival, but randomised trials have not shown a reduction in death or MI.",
      difficulty: 1,
      refs: ["euro-cto-2018", "cto-consensus-2019", "decision-cto-2019"],
    },
    {
      id: "cx-q-cto-dual",
      stem: "An RCA CTO fills via septal collaterals from the LAD. What is the recommended way to obtain the planning angiogram?",
      options: [
        "Dual injection, starting the LAD injection first, at low magnification with a long acquisition",
        "Selective RCA injection only, at high magnification",
        "Simultaneous injection starting the RCA first, panning to follow the contrast",
        "LAD injection only, since the distal RCA fills from it",
      ],
      answer: 0,
      explanation:
        "Dual injection shows the proximal cap and the collateral-filled distal vessel together; starting the donor (LAD) first lets the slower collateral filling coincide with antegrade filling. Starting the RCA first and panning is tempting, but the order is reversed and panning loses late filling. Single injections cannot show the whole occlusion.",
      difficulty: 2,
      refs: ["cto-consensus-2019", "brilakis-manual-cto"],
    },
    {
      id: "cx-q-cto-four",
      stem: "Which of the following is NOT one of the four angiographic parameters used to choose the initial CTO crossing strategy?",
      options: [
        "Left ventricular ejection fraction",
        "Proximal cap ambiguity",
        "Occlusion length",
        "Quality of the distal vessel",
        "Presence of interventional collaterals",
      ],
      answer: 0,
      explanation:
        "The hybrid algorithm uses proximal cap ambiguity, lesion length, distal vessel quality and interventional collaterals. LVEF matters for patient selection and haemodynamic planning but does not determine the crossing strategy.",
      difficulty: 1,
      refs: ["cto-consensus-2019", "brilakis-manual-cto", "brilakis-cto-algorithm-2012"],
    },
    {
      id: "cx-q-cto-jcto",
      stem: "A CTO has a blunt stump, calcification, a 30 mm length and a straight course, and has not been attempted before. What is the J-CTO score?",
      options: ["3", "2", "4", "5"],
      answer: 0,
      explanation:
        "Blunt stump, calcification and length of 20 mm or more score one point each, giving 3 (very difficult). The course has no bend over 45° and there was no previous attempt, so those score 0. Choosing 4 usually comes from counting length twice or scoring the bend.",
      difficulty: 2,
      refs: ["jcto-2011"],
    },
    {
      id: "cx-q-cto-ambiguous",
      stem: "An LAD CTO has an ambiguous proximal cap at a large diagonal, a 25 mm occlusion, and a good distal LAD filled by large septal collaterals from the RCA. Which initial strategy is most appropriate?",
      options: [
        "Retrograde via the septal collaterals",
        "Antegrade wire escalation with a stiff tapered wire aimed at the presumed cap",
        "Antegrade dissection and re-entry starting at the diagonal",
        "Medical therapy, because the cap is ambiguous",
      ],
      answer: 0,
      explanation:
        "An ambiguous proximal cap with interventional septal collaterals favours a primary retrograde approach. Aiming a stiff wire at a cap you cannot see is the tempting antegrade option, but it risks perforation or a subintimal entry in the wrong place. An ambiguous cap alone does not preclude PCI when a safe retrograde route exists.",
      difficulty: 2,
      refs: ["cto-consensus-2019", "brilakis-manual-cto", "brilakis-cto-algorithm-2012"],
    },
    {
      id: "cx-q-cto-reverse-cart",
      stem: "What happens in reverse CART?",
      options: [
        "An antegrade balloon opens a subintimal space; the retrograde wire enters it to the true lumen",
        "A retrograde balloon is inflated in the subintimal space and the antegrade wire is steered into it",
        "Both wires are advanced within the true lumen from each end until their tips touch",
        "The retrograde wire is snared in the aorta and pulled out through the femoral sheath",
      ],
      answer: 0,
      explanation:
        "In reverse CART the antegrade balloon creates a shared dissection space and the retrograde wire crosses into it and on into the antegrade guide. A retrograde balloon with an antegrade wire is conventional CART (retrograde balloon, antegrade wire), the main distractor; it is used much less often today. Snaring is a separate step sometimes used for externalisation, not the CART mechanism.",
      difficulty: 3,
      refs: ["brilakis-manual-cto"],
    },
    {
      id: "cx-q-cto-stop",
      stem: "A patient with an estimated creatinine clearance of 60 mL/min is 2.5 hours into a CTO procedure. Contrast used is 240 mL and air kerma is 5.6 Gy, with no progress after two strategy changes. What is the best course?",
      options: [
        "Stop: radiation and contrast thresholds are both passed with no progress",
        "Continue, because a 3-hour procedure time limit has not yet been reached",
        "Continue until the contrast volume reaches 5 × creatinine clearance, then reassess",
        "Switch to a third strategy, because only one threshold has been passed so far",
      ],
      answer: 0,
      explanation:
        "Air kerma above 5 Gy is a consensus trigger to consider stopping unless success is imminent, and the contrast trigger is 3.7 × the estimated creatinine clearance, here 3.7 × 60 = 222 mL, already exceeded at 240 mL. With no progress, stop. Waiting for a procedure-time limit is the tempting error: no source gives a time threshold, and each trigger stands on its own, not as a target to reach.",
      difficulty: 3,
      refs: ["cto-consensus-2019", "radiation-consensus-2018", "brilakis-manual-pci", "laskey-vcrcl-2007", "wu-global-cto-algorithm-2021"],
    },
  ],
  sims: [
    {
      sim: "views",
      task: "Identify LAO straight, LAO cranial and RAO projections, and state which best opens the distal RCA bifurcation and posterior descending artery for a dual-injection RCA CTO run.",
    },
  ],
  caseIds: ["cx-case-rca-cto"],
};

// ---------------------------------------------------------------------------
// Module 5 — Grafts and thrombus
// ---------------------------------------------------------------------------
const graftsThrombus: Module = {
  id: "cx-grafts-thrombus",
  title: "Bypass grafts and thrombus-rich lesions",
  stage: 4,
  summary:
    "Treat saphenous vein and arterial grafts safely, think native vessel first, prevent distal embolisation and no-reflow, and apply current STEMI technique for thrombus-rich lesions.",
  objectives: [
    "Explain why degenerated vein grafts embolise, and when to treat the native vessel instead.",
    "Choose and use embolic protection, and apply no-reflow prevention in SVG PCI.",
    "Recognise the specific problems of LIMA and radial artery graft PCI.",
    "Grade thrombus, and apply current evidence on thrombus aspiration, deferred stenting and GP IIb/IIIa inhibitors.",
  ],
  lessons: [
    {
      id: "cx-svg-pci",
      title: "Saphenous vein graft PCI",
      minutes: 7,
      refs: ["supplied-medmastery", "supplied-eh-views", "esc-revasc-2018", "brilakis-manual-pci", "safer-2002"],
      blocks: [
        {
          kind: "p",
          text: "Vein grafts fail in a predictable sequence. In the first month failure is usually technical or thrombotic. Between one month and a year, intimal hyperplasia narrows the graft, often at the anastomoses. After the first year, vein graft atherosclerosis develops: diffuse, soft, friable, lipid-rich plaque with thrombus and a thin or absent fibrous cap. That last type is what makes SVG PCI dangerous, because balloon and stent compress debris straight into the distal bed.",
        },
        {
          kind: "list",
          items: [
            "Grafts are often large, with a marked size mismatch between graft and native vessel.",
            "Degenerated grafts contain thrombotic and atheromatous material that embolises during balloon and stent deployment, causing periprocedural MI, slow flow or abrupt occlusion.",
            "Redo CABG is often undesirable, particularly with a patent LIMA that a redo sternotomy could injure, so graft and native PCI become the main options.",
          ],
        },
        { kind: "h", text: "Think native vessel first" },
        {
          kind: "list",
          items: [
            "SVG PCI has higher rates of periprocedural MI, restenosis and late events than native-vessel PCI. If the native artery supplying the territory can be treated, including a native CTO in experienced hands, it is generally preferred over a degenerated graft body.",
            "Do not attempt to recanalise a chronically occluded vein graft: success is poor, embolic risk high and durability short. Treat the native vessel if the territory needs it.",
            "Ask whether the graft's territory needs revascularisation at all, and whether the graft is the culprit if the presentation is acute.",
          ],
        },
        { kind: "h", text: "Imaging the graft" },
        {
          kind: "list",
          items: [
            "Graft ostia on the ascending aorta run, from lowest to highest, RCA graft, LAD/diagonal graft, OM graft; RCA grafts arise on the right border, LAD/diagonal grafts anteriorly, OM grafts on the left posterior border.",
            "Engage right-sided grafts in an LAO view and left-sided grafts in an RAO view.",
            "Assess three structures in every graft: ostium and body, distal anastomosis, and native run-off. Use the engagement view for the body and a view suited to the native target for the anastomosis.",
          ],
        },
        {
          kind: "table",
          caption: "Lesion location matters",
          head: ["Location", "Typical pathology", "Approach"],
          rows: [
            ["Aorto-ostial", "Fibrotic, sometimes calcified; recoils", "Treat as an aorto-ostial lesion; lower embolic risk"],
            ["Graft body", "Degenerated, friable, thrombus-laden", "Highest embolic risk; embolic protection where anatomy allows"],
            ["Distal anastomosis", "Intimal hyperplasia, behaves more like native disease", "Lower embolic risk; filter usually impossible because there is no landing zone"],
          ],
        },
        { kind: "h", text: "Embolic protection" },
        {
          kind: "table",
          head: ["Type", "How it works", "Needs", "Limitations"],
          rows: [
            ["Distal filter", "Basket on a wire captures debris while flow continues", "A straight landing zone of adequate length and size beyond the lesion (check the instructions for use)", "Misses particles smaller than the pores; full baskets block flow; cannot be used for distal anastomotic lesions"],
            ["Distal occlusion balloon", "Occludes flow beyond the lesion; debris aspirated before deflation", "Landing zone beyond the lesion", "Ischaemia during occlusion; device availability varies"],
            ["Proximal occlusion", "Occludes inflow so debris can be aspirated", "Space proximal to the lesion", "Not usable for ostial lesions; device availability varies"],
          ],
        },
        {
          kind: "p",
          text: "Early randomised data showed fewer major adverse events with distal protection during SVG PCI than without it; more recent observational data have been mixed and use varies between centres. A reasonable practice is selective use in degenerated graft-body lesions where there is a landing zone.",
        },
        {
          kind: "steps",
          title: "Preventing no-reflow in vein graft PCI",
          items: [
            { title: "Pretreat the microcirculation", detail: "Intragraft vasodilators (for example adenosine, nitroprusside or verapamil, per local protocol) before and after stenting." },
            { title: "Direct stent where possible", detail: "Avoid pre-dilatation of friable plaque: each inflation releases debris." },
            { title: "Do not oversize", detail: "Choose a stent slightly smaller than the graft reference and avoid aggressive post-dilatation; the stent is there to trap debris against the wall, not to maximise lumen." },
            { title: "Protect where possible", detail: "Embolic protection in degenerated body lesions with a landing zone." },
            { title: "Watch flow continuously", detail: "Slowing flow, chest pain or ST change means debris: act before the bed is fully obstructed (management is in the complications track)." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting the filter wire against the graft wall when two wires are in place: it may be impossible to retrieve.",
            "A filter full of debris blocks flow; aspirate the stagnant column above it and retrieve it promptly.",
            "Treating an incidental old graft stenosis that supplies an infarcted territory.",
            "Forgetting the native run-off: a perfect graft result into a diseased, tiny native vessel achieves little.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Late SVG disease is friable and embolises; PCI risk is mainly distal embolisation and no-reflow.",
            "Native vessel first; do not recanalise chronically occluded vein grafts.",
            "Direct stent, do not oversize, minimise post-dilatation, use vasodilators and protection where feasible.",
          ],
        },
      ],
    },
    {
      id: "cx-arterial-grafts",
      title: "Arterial graft PCI",
      minutes: 5,
      refs: ["supplied-eh-views", "supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "The LIMA to LAD graft has excellent long-term patency. When it fails, the problem is usually at the distal anastomosis (often early and technical), in the subclavian artery upstream, or a matter of competitive flow rather than disease. Atherosclerosis in the LIMA body is uncommon.",
        },
        {
          kind: "table",
          caption: "LIMA problems and what they mean",
          head: ["Finding", "Usual meaning", "Approach"],
          rows: [
            ["Anastomotic stenosis", "Technical or intimal hyperplasia", "Usually responds well to balloon angioplasty with or without stenting"],
            ["Diffusely thin LIMA ('string sign') with only moderate native LAD disease", "Competitive flow from the native vessel", "Not a target for graft PCI; reassess the native lesion physiologically"],
            ["Proximal subclavian stenosis", "Reduced inflow, possible coronary–subclavian steal", "Measure the gradient; treat the subclavian lesion"],
            ["Kink or tortuosity", "Surgical lie or redundancy", "May straighten with a wire, producing pseudo-lesions"],
          ],
        },
        {
          kind: "steps",
          title: "LIMA PCI: practical points",
          items: [
            { title: "Access", detail: "Left radial or femoral access gives the easiest route to the left subclavian; right radial access is possible but harder." },
            { title: "Guide", detail: "An internal mammary curve, seated coaxially without deep intubation. Watch for damping: the LIMA ostium is small and dissects easily." },
            { title: "Check equipment length", detail: "The anastomosis can be a long way from the ostium. Confirm the balloon and stent shafts are long enough through the chosen guide; a shorter guide may be needed." },
            { title: "Wire choice", detail: "A soft workhorse wire. Stiff wires straighten the tortuous LIMA and create accordion-like pseudo-lesions." },
            { title: "Image the anastomosis", detail: "A left lateral projection often gives the only clear view of the LIMA–LAD anastomosis; cranial native-LAD views and RAO or LAO caudal views are alternatives." },
          ],
        },
        {
          kind: "p",
          text: "Radial artery grafts are muscular and prone to spasm, so give vasodilators liberally and keep instrumentation gentle. Like the LIMA, they can show a string sign when the native vessel they bypass is not severely stenosed.",
        },
        {
          kind: "p",
          text: "Before treating a failing arterial graft, look at the native vessel it bypasses. If the native LAD lesion is accessible and the LIMA problem is competitive flow or a long diseased segment, native PCI may be the better route. If the LIMA anastomosis is the problem and the native LAD is occluded or diffusely diseased, graft PCI is the obvious target. After LIMA PCI, image the whole graft from its ostium to exclude guide- or wire-induced dissection before removing the guide.",
        },
        {
          kind: "pitfalls",
          items: [
            "Guide-induced dissection of the LIMA ostium from aggressive engagement.",
            "Stenting pseudo-lesions created by a stiff wire in a tortuous graft.",
            "Running out of shaft length at the distal anastomosis halfway through the case.",
            "Missing a subclavian stenosis that explains the patient's symptoms.",
          ],
        },
        {
          kind: "pearl",
          text: "A pseudo-lesion disappears when you pull the stiff part of the wire back or swap to a softer wire. A true lesion does not. Check before you stent anything that appeared only after wiring.",
        },
        {
          kind: "keypoints",
          items: [
            "LIMA failure is usually anastomotic, upstream (subclavian) or competitive flow.",
            "Left radial or femoral access, gentle coaxial engagement, soft wire, check shaft length.",
            "Arterial grafts spasm and form pseudo-lesions; recognise both.",
          ],
        },
      ],
    },
    {
      id: "cx-thrombus",
      title: "Thrombus-rich lesions and STEMI technique",
      minutes: 6,
      refs: ["total-2015", "esc-acs-2023", "culprit-shock-2017", "timi-1985", "supplied-medmastery", "danami3-defer-2016", "gibson-timi-thrombus-2001"],
      blocks: [
        {
          kind: "p",
          text: "Thrombus appears with acute coronary syndromes, after instrumentation, and when anticoagulation or antiplatelet therapy is inadequate. It embolises downstream when disturbed, causing slow flow, no-reflow and side-branch occlusion. The aim is to restore flow and scaffold the lesion while disturbing the thrombus as little as possible.",
        },
        {
          kind: "table",
          caption: "TIMI thrombus grade",
          head: ["Grade", "Description"],
          rows: [
            ["0", "No thrombus"],
            ["1", "Possible thrombus: haziness, irregular contour"],
            ["2", "Definite thrombus, largest dimension up to half the vessel diameter"],
            ["3", "Definite thrombus, more than half but less than two vessel diameters"],
            ["4", "Definite thrombus, two vessel diameters or more (large thrombus burden)"],
            ["5", "Total occlusion"],
          ],
        },
        {
          kind: "steps",
          title: "Primary PCI technique for a thrombotic culprit",
          items: [
            { title: "Antithrombotic therapy first", detail: "Anticoagulation and antiplatelet therapy per local protocol, radial access by default." },
            { title: "Wire gently", detail: "Crossing the occlusion often restores some flow. Confirm the wire is in the distal true lumen." },
            { title: "Restore flow with the minimum", detail: "A small balloon at modest pressure if needed. Avoid repeated or aggressive pre-dilatation." },
            { title: "Reassess after flow returns", detail: "Give intracoronary nitrate. Vasoconstriction and thrombus make the vessel look smaller than it is." },
            { title: "Size and stent", detail: "Size to the nitrate-treated reference, with imaging if uncertain; avoid undersizing. Direct stenting is reasonable when the anatomy is clear." },
            { title: "Post-dilate judiciously", detail: "Achieve expansion, but avoid repeated high-pressure inflations in a thrombus-laden segment, which promote no-reflow." },
            { title: "Check the result", detail: "TIMI flow, myocardial blush and the distal bed for embolic cut-offs." },
          ],
        },
        { kind: "h", text: "Thrombus aspiration" },
        {
          kind: "p",
          text: "TOTAL randomised over 10 000 STEMI patients to routine manual thrombectomy or PCI alone: there was no reduction in cardiovascular death, recurrent MI, cardiogenic shock or severe heart failure, and there was more stroke at 30 days with thrombectomy. The 2023 ESC ACS guideline therefore does not recommend routine thrombus aspiration. Bail-out aspiration for a large residual thrombus after wiring or balloon dilatation remains an option.",
        },
        {
          kind: "list",
          items: [
            "Advance the aspiration catheter slowly, aspirate as you cross the thrombus and withdraw slowly under continuous suction.",
            "Keep the guide well engaged as the catheter enters it, so captured thrombus is not stripped into the aorta and carried to the brain.",
            "Let the guide back-bleed after removal to clear air and debris before the next injection.",
            "Watch that thrombus is not dragged into an unaffected branch during withdrawal.",
          ],
        },
        { kind: "h", text: "Deferred stenting" },
        {
          kind: "p",
          text: "Deferring the stent for a day or two after restoring flow, hoping the thrombus will resolve, did not improve clinical outcomes in a randomised trial (DANAMI-3-DEFER), and routine deferred stenting is not recommended. It remains an individual decision in selected cases, such as a very large residual thrombus with restored TIMI 3 flow where immediate stenting seems likely to cause no-reflow, with intensified antithrombotic therapy and a planned repeat angiogram.",
        },
        { kind: "h", text: "GP IIb/IIIa inhibitors" },
        {
          kind: "p",
          text: "The 2023 ESC ACS guideline advises considering GP IIb/IIIa inhibitors as bail-out therapy for no-reflow or a thrombotic complication, not routinely. They increase bleeding, so weigh thrombus burden against bleeding risk and access site.",
        },
        {
          kind: "p",
          text: "In cardiogenic shock with multivessel disease, treat the culprit lesion only at the index procedure: CULPRIT-SHOCK found lower 30-day death or renal replacement therapy with culprit-only PCI than with immediate multivessel PCI.",
        },
        {
          kind: "pitfalls",
          items: [
            "Multiple aggressive balloon inflations to 'clear' thrombus: more embolisation and no-reflow.",
            "Sizing the stent to the vasoconstricted, thrombus-filled vessel: undersizing and malapposition.",
            "Withdrawing an aspiration catheter with the guide disengaged.",
            "Not looking for distal embolic cut-offs on the final run.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Restore flow with minimal manipulation; give nitrate before sizing.",
            "Routine aspiration and routine deferred stenting are not recommended; bail-out use is an individual decision.",
            "GP IIb/IIIa inhibitors are for bail-out of no-reflow or thrombotic complications.",
            "Culprit-only PCI at the index procedure in cardiogenic shock.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-gt-native-first",
      stem: "A patient 12 years after CABG has angina. The SVG to the obtuse marginal is diffusely degenerated with a severe mid-body lesion. The native LCx has a focal, non-calcified proximal stenosis suitable for PCI. What is the preferred target?",
      options: [
        "PCI of the native LCx lesion",
        "PCI of the SVG body with a distal filter",
        "PCI of the SVG body without embolic protection",
        "Redo CABG as first-line",
      ],
      answer: 0,
      explanation:
        "When the native vessel supplying the territory can be treated, it is generally preferred to a degenerated graft body, which carries higher periprocedural MI, restenosis and late event rates. SVG PCI with a filter is the tempting option and would be reasonable if the native vessel were not treatable. Redo CABG carries considerable risk and is not first-line here.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "brilakis-manual-pci"],
    },
    {
      id: "cx-q-gt-occluded-svg",
      stem: "During angiography for stable angina after CABG, an SVG to the RCA is found to be chronically occluded. What is the most appropriate approach to this graft?",
      options: [
        "Leave the occluded graft and, if the territory needs it, treat the native RCA",
        "Recanalise the graft with a stiff wire and stent its full length",
        "Thrombolyse the graft through a microcatheter",
        "Recanalise the graft using distal embolic protection",
      ],
      answer: 0,
      explanation:
        "Chronically occluded vein grafts have poor recanalisation success, high embolic risk and short durability, so they are left alone and the native vessel is treated if needed. Recanalising with protection is the tempting answer, but a protection device cannot be positioned beyond an occlusion that has not been crossed, and the underlying problem of durability remains.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cx-q-gt-filter-landing",
      stem: "In which SVG lesion is a distal filter usually NOT feasible?",
      options: [
        "A lesion at the distal anastomosis",
        "A mid-body lesion with a straight 4 cm segment beyond it",
        "A proximal-body lesion in a large graft",
        "A body lesion with mild haziness",
      ],
      answer: 0,
      explanation:
        "A filter needs a landing zone of adequate length and size beyond the lesion; at the distal anastomosis there is none within the graft. Distal anastomotic lesions also behave more like native disease with lower embolic risk. Body lesions with a straight segment beyond them are the classic use for a filter.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "cx-q-gt-noreflow-prevent",
      stem: "Which approach best reduces the risk of no-reflow when stenting a degenerated SVG body lesion?",
      options: [
        "Direct stenting with a slightly undersized stent and little post-dilatation",
        "Pre-dilatation with a large balloon to measure the true graft diameter first",
        "Oversizing the stent by 0.5 mm so that all the friable debris is trapped",
        "High-pressure post-dilatation to maximise the final lumen in the graft",
      ],
      answer: 0,
      explanation:
        "Each balloon inflation of friable vein-graft plaque releases debris, so direct stenting, modest sizing and minimal post-dilatation reduce embolisation. Oversizing is tempting on the logic of 'trapping' debris, but more barotrauma means more embolisation and no-reflow.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cx-q-gt-total",
      stem: "What did the TOTAL trial show about routine manual thrombectomy in STEMI?",
      options: [
        "No reduction in CV death, MI, shock or severe heart failure; more stroke at 30 days",
        "A significant reduction in cardiovascular death at 180 days in all patients",
        "Reduced stent thrombosis and reinfarction, at the cost of more access bleeding",
        "Benefit only in patients with TIMI 0 flow at presentation, who had less no-reflow and MI",
      ],
      answer: 0,
      explanation:
        "TOTAL found no benefit in its primary composite and an increase in early stroke, which led guidelines to advise against routine aspiration. The subgroup option is tempting, but no subgroup established a clear benefit that changed this recommendation; aspiration is reserved for bail-out.",
      difficulty: 2,
      refs: ["total-2015", "esc-acs-2023"],
    },
    {
      id: "cx-q-gt-thrombus-grade",
      stem: "An angiogram shows definite thrombus extending over about three vessel diameters, with antegrade flow preserved. What is the TIMI thrombus grade?",
      options: ["4", "3", "5", "2"],
      answer: 0,
      explanation:
        "Grade 4 is definite thrombus with its largest dimension two vessel diameters or more (large thrombus burden). Grade 3 covers more than half but less than two diameters, the nearest distractor. Grade 5 is total occlusion, which is excluded because flow is preserved.",
      difficulty: 1,
      refs: ["supplied-medmastery", "gibson-timi-thrombus-2001"],
    },
    {
      id: "cx-q-gt-string-sign",
      stem: "A LIMA to LAD graft is diffusely thin along its whole length but patent; the native LAD has a 60% stenosis. What is the most likely explanation?",
      options: [
        "Competitive flow from the native LAD (string sign)",
        "Diffuse LIMA atherosclerosis requiring a long stent",
        "LIMA dissection from guide engagement",
        "Subclavian steal from a proximal subclavian stenosis",
      ],
      answer: 0,
      explanation:
        "When the native vessel is only moderately stenosed, competitive flow lets the arterial graft shrink to a thin 'string'. It is not a PCI target. Diffuse LIMA atherosclerosis is rare, and stenting it would be the tempting wrong answer. Subclavian steal reduces graft inflow but does not usually produce a uniformly thin graft with a moderate native lesion.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
  ],
  sims: [
    {
      sim: "views",
      task: "Name the projection, then choose the view you would use to show a LIMA–LAD anastomosis (left lateral first) and the body of a right-sided vein graft (LAO).",
    },
  ],
  caseIds: ["cx-case-degenerated-svg"],
};

// ---------------------------------------------------------------------------
// Module 6 — Special lesions
// ---------------------------------------------------------------------------
const special: Module = {
  id: "cx-special",
  title: "Special lesion subsets",
  stage: 4,
  summary:
    "Ostial and tortuous lesions, small vessels and drug-coated balloons, long diffuse disease, in-stent restenosis, SCAD and anomalous coronary arteries.",
  objectives: [
    "Stent aorto-ostial lesions accurately and distinguish them from branch-ostial lesions.",
    "Build support in tortuous vessels and recognise pseudo-lesions.",
    "Use drug-coated balloons correctly and avoid long stents ending in poor run-off.",
    "Image the mechanism of in-stent restenosis and choose between DCB and DES.",
    "Decide when to intervene in SCAD and keep intervention minimal; plan PCI in anomalous coronaries.",
  ],
  lessons: [
    {
      id: "cx-ostial-tortuous",
      title: "Ostial lesions and tortuous vessels",
      minutes: 6,
      refs: ["supplied-medmastery", "supplied-oxford", "supplied-eh-views", "brilakis-manual-pci"],
      blocks: [
        { kind: "h", text: "Aorto-ostial versus branch-ostial" },
        {
          kind: "table",
          head: ["Feature", "Aorto-ostial (RCA, LM, vein graft ostium)", "Branch-ostial (ostial LAD, LCx, diagonal)"],
          rows: [
            ["Plaque", "Fibrotic, often calcified, continuous with aortic wall; recoils", "Often continuous with the parent vessel; plaque or carina shift into the parent"],
            ["Main risk", "Missing the ostium, recoil, guide damage to the stent", "Geographic miss or compromising the parent vessel"],
            ["Typical strategy", "Stent with 1–2 mm protrusion into the aorta", "Precise ostial placement with imaging, or cover from the parent vessel (for example cross-over from LM into LAD)"],
          ],
        },
        {
          kind: "steps",
          title: "Stenting an aorto-ostial lesion",
          items: [
            { title: "Prove the lesion is real", detail: "Catheter-tip spasm mimics ostial disease. Give intracoronary nitrate and perform a non-selective injection in the sinus with the catheter disengaged." },
            { title: "Choose a guide you can control", detail: "Coaxial, able to back out quickly, not one that dives deep. Side holes keep flow but hide damping." },
            { title: "Image and prepare", detail: "IVUS (OCT struggles at the ostium) for size, calcium and true ostial extent. Fibrotic or calcified ostia recoil: prepare with NC, cutting or scoring balloons, or atherectomy if calcified." },
            { title: "Position in a view orthogonal to the ostium", detail: "For the RCA usually LAO; for the LM LAO straight or AP/LAO cranial. Back the guide out before deployment so the stent can sit 1–2 mm into the aorta." },
            { title: "Deploy and flare", detail: "Deploy, then flare the protruding segment with a larger NC balloon partly in the aorta, or with a dedicated dual-balloon ostial flaring system." },
            { title: "Confirm coverage", detail: "IVUS pullback into the aorta shows the stent covers the ostium. Never push the guide into the new stent: the edge deforms longitudinally." },
          ],
        },
        {
          kind: "p",
          text: "The **Szabo technique** is an alternative positioning aid: a second wire is threaded through the most proximal cell of the stent and parked in the aorta (or in the parent vessel for a branch ostium), so the stent stops at the ostium as it is advanced. It risks stent deformation, dislodgement and wire entrapment, and imaging confirmation is still needed.",
        },
        { kind: "h", text: "Tortuous and angulated vessels" },
        {
          kind: "list",
          items: [
            "Guide: a shape with better back-up against the opposite aortic wall, or a larger size for more stiffness.",
            "Wire: an extra-support wire, or a buddy wire alongside the first to straighten the vessel. Devices do not always pass more easily over the stiffer wire because of wire bias.",
            "Guide extension: advanced over a balloon (or anchored by an inflated distal balloon) to deliver devices beyond bends; when stenting long segments, place it distally and stent from distal to proximal as you withdraw.",
            "Anchor balloon: inflate a small balloon in a proximal side branch to fix the guide.",
            "Stent choice: a more deliverable, shorter or thinner-strut stent; allow for extra length because tortuous segments look shorter than they are.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pseudo-lesions: a stiff wire straightens a tortuous vessel and creates concertina-like narrowings. They vanish when the wire is withdrawn into a microcatheter or exchanged for a soft wire. Do not stent them.",
            "Wire bias on bends directs atherectomy devices into one wall and causes perforation.",
            "Buddy wires wrap around each other or get trapped behind a stent: remove the non-stent wire before deployment.",
            "A guide extension left in place obstructs flow and can injure the proximal vessel: check the proximal vessel on the final run.",
          ],
        },
        {
          kind: "pearl",
          text: "Support problems are solved in order: guide first, then wire, then guide extension, then anchoring. Reaching for the most aggressive tool first usually damages the vessel you are trying to treat.",
        },
        {
          kind: "keypoints",
          items: [
            "Aorto-ostial: exclude spasm, prepare for recoil, 1–2 mm into the aorta with the guide disengaged, confirm on IVUS.",
            "Branch-ostial: precise placement or cover from the parent vessel.",
            "Tortuosity: escalate support stepwise and recognise pseudo-lesions.",
          ],
        },
      ],
    },
    {
      id: "cx-small-diffuse",
      title: "Small vessels, drug-coated balloons and long diffuse disease",
      minutes: 5,
      refs: ["supplied-eh-views", "supplied-medmastery", "nhlbi-dissection-1991", "brilakis-manual-pci", "basket-small2-2018", "jeger-dcb-consensus-2020"],
      blocks: [
        {
          kind: "p",
          text: "Restenosis risk rises as vessel size falls and lesion length grows. Small vessels (roughly under 2.75 mm) and long diffuse disease are where stents perform least well and where it pays to think about alternatives.",
        },
        { kind: "h", text: "Drug-coated balloons" },
        {
          kind: "p",
          text: "A drug-coated balloon (DCB) transfers an antiproliferative drug (paclitaxel or a sirolimus-family agent) to the vessel wall during a single inflation and leaves no metal behind. In small vessels, the BASKET-SMALL 2 trial found DCB non-inferior to DES for major adverse events at one year in vessels under 3 mm. DCB is also an established treatment for in-stent restenosis and a useful option for side-branch ostia and diffuse distal disease.",
        },
        {
          kind: "steps",
          title: "DCB technique (typical; follow device instructions)",
          items: [
            { title: "Prepare the lesion", detail: "Pre-dilate with a semi-compliant, NC, scoring or cutting balloon sized about 0.8–1.0 to the reference." },
            { title: "Decide whether DCB is appropriate", detail: "Proceed if residual stenosis is about 30% or less, flow is TIMI 3 and there is no flow-limiting dissection. Otherwise, stent." },
            { title: "Size and length", detail: "DCB about 1:1 to the reference and longer than the prepared segment by a few millimetres at each end, to avoid geographic miss." },
            { title: "Deliver promptly and inflate", detail: "Drug washes off in transit, so reach the lesion without delay. Inflate at nominal pressure, typically for 30–60 seconds." },
            { title: "Final assessment", detail: "Accept minor non-flow-limiting dissections; stent if a dissection limits flow." },
          ],
        },
        {
          kind: "figure",
          id: "nhlbi-dissection",
          caption: "NHLBI dissection types A–F. After DCB lesion preparation, small type A–B dissections with TIMI 3 flow are usually acceptable; types C–F, or any flow-limiting dissection, call for a stent.",
        },
        { kind: "h", text: "Long diffuse disease: the full-metal-jacket problem" },
        {
          kind: "p",
          text: "Long overlapping stents ('full metal jacket') carry higher rates of stent thrombosis and restenosis, and they make future surgery or PCI harder. Run-off matters as much as the lesion: a stent needs adequate outflow to stay open. A teaching case from the supplied notes describes a man with stable angina who received a full-metal-jacket LAD ending in a tiny distal vessel; the whole segment thrombosed two days later, causing a large anterior MI.",
        },
        {
          kind: "list",
          items: [
            "Question the indication: diffuse LAD disease is often better served by medical therapy or a LIMA graft than by 60 mm of metal.",
            "Use physiology pullback to separate focal pressure drops (treatable with short stents) from diffuse loss (poorly served by PCI).",
            "Image to choose landing zones in the least diseased segments.",
            "Consider a hybrid approach: DES for the proximal, larger segment and DCB for the smaller distal segment.",
            "Do not end a stent in a very small vessel with poor run-off, and make sure the vessel is the true one: a smooth, straight vessel in LAO may be an acute marginal rather than the true RCA.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Using a DCB after inadequate preparation: high residual stenosis and early recoil.",
            "Geographic miss: the DCB shorter than the injured segment, leaving injured but untreated edges.",
            "Delaying DCB delivery in a tortuous vessel, losing much of the drug before inflation.",
            "Stenting to the tip of a small distal vessel ('stenting proximal to tip'): poor run-off, thrombosis.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "DCB: prepare well, accept only a good result, size 1:1, cover beyond the prepared segment, inflate 30–60 s.",
            "In small vessels DCB is a reasonable alternative to DES.",
            "Avoid full-metal-jacket stenting into poor run-off; use physiology and imaging to target focal disease.",
          ],
        },
      ],
    },
    {
      id: "cx-isr",
      title: "In-stent restenosis",
      minutes: 4,
      refs: ["esc-revasc-2018", "eapci-imaging-2018", "supplied-medmastery", "brilakis-manual-pci", "mehran-isr-1999"],
      blocks: [
        {
          kind: "p",
          text: "In-stent restenosis (ISR) is a diameter stenosis of 50% or more within the stent or its 5 mm edges. With modern DES it is less common, but it remains a frequent reason for repeat PCI. It often presents as stable angina, though a substantial minority present with an acute coronary syndrome.",
        },
        {
          kind: "table",
          caption: "Mehran angiographic classification",
          head: ["Pattern", "Description"],
          rows: [
            ["I (focal)", "10 mm or shorter, within the stent, at a margin or a gap"],
            ["II (diffuse intrastent)", "Longer than 10 mm, confined to the stent"],
            ["III (proliferative)", "Longer than 10 mm and extending beyond the stent edges"],
            ["IV (occlusive)", "Total occlusion"],
          ],
        },
        {
          kind: "p",
          text: "Focal patterns respond better to treatment than diffuse, proliferative or occlusive patterns, which recur more often.",
        },
        { kind: "h", text: "Image the mechanism" },
        {
          kind: "table",
          head: ["Mechanism", "Imaging clue", "Implication"],
          rows: [
            ["Stent underexpansion", "Small minimal stent area relative to vessel; often calcium behind the struts", "Fix the expansion first: high-pressure NC, very-high-pressure balloon or IVL"],
            ["Stent fracture or gap", "Missing struts or discontinuity", "Usually needs a new stent across the gap"],
            ["Edge restenosis or geographic miss", "Disease at the edge or in an uncovered segment", "Cover the uncovered disease"],
            ["Neointimal hyperplasia", "Homogeneous tissue inside a well-expanded stent", "DCB or DES"],
            ["Neoatherosclerosis", "Lipid-rich or calcified neointima on OCT", "Behaves like native plaque; may need modification"],
            ["Multiple stent layers", "Two or more metal layers", "Favour DCB to avoid another layer; consider CABG for recurrent cases"],
          ],
        },
        {
          kind: "steps",
          title: "A practical sequence",
          items: [
            { title: "Image", detail: "IVUS or OCT identifies mechanical causes, which angiography cannot." },
            { title: "Correct mechanical problems", detail: "Underexpansion is treated by expanding the original stent; adding a new stent inside an underexpanded one leaves the problem in place." },
            { title: "Prepare the tissue", detail: "Neointima is slippery, and balloons can 'watermelon-seed' out of the lesion. Scoring or cutting balloons grip better." },
            { title: "Definitive treatment", detail: "The 2018 ESC/EACTS guideline recommends both DES and DCB for ISR. DES tends to give a larger lumen; DCB avoids another layer of metal." },
            { title: "Recurrent multilayer ISR", detail: "Consider CABG, or specialist options such as intravascular brachytherapy where available." },
            { title: "Review the patient", detail: "Adherence, risk factors and the original indication." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Treating ISR without imaging and missing an underexpanded stent.",
            "Placing a third or fourth layer of metal for recurrent ISR.",
            "Using a short, slippery balloon at high pressure that jumps out of the lesion and dissects the edge.",
          ],
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Assess a restenosed stent on IVUS: decide whether the problem is underexpansion or neointimal tissue, correct the expansion if needed, then choose DCB or DES.",
        },
        {
          kind: "keypoints",
          items: [
            "ISR is classified by pattern (Mehran I–IV); diffuse and occlusive patterns recur more.",
            "Image every ISR to find mechanical causes, and fix underexpansion first.",
            "DES and DCB are both recommended; DCB avoids an extra layer.",
          ],
        },
      ],
    },
    {
      id: "cx-scad-anomalous",
      title: "SCAD and anomalous coronary arteries",
      minutes: 6,
      refs: ["scad-esc-2018", "scad-saw-2014", "supplied-eh-views", "supplied-oxford"],
      blocks: [
        { kind: "h", text: "Spontaneous coronary artery dissection" },
        {
          kind: "p",
          text: "SCAD is a non-atherosclerotic cause of acute coronary syndrome in which an intramural haematoma, with or without an intimal tear, compresses the true lumen. It affects younger patients and especially women, including around pregnancy, and is associated with fibromuscular dysplasia (FMD) and emotional or physical stressors. A minority of cases occur in men, often after intense physical exertion.",
        },
        {
          kind: "table",
          caption: "Angiographic types (Saw classification)",
          head: ["Type", "Appearance"],
          rows: [
            ["1", "Contrast staining of the wall with multiple lumens or a visible flap"],
            ["2A", "Long, smooth, diffuse narrowing bounded by normal segments proximally and distally"],
            ["2B", "Long, smooth narrowing that extends to the distal tip of the artery"],
            ["3", "Focal or tubular narrowing that mimics atherosclerosis; usually needs intravascular imaging to diagnose"],
          ],
        },
        {
          kind: "list",
          items: [
            "Clues: long smooth narrowing, abrupt change in calibre, tortuous vessels without atheroma or calcium, often distal.",
            "Exclude spasm first: give intracoronary nitrate. A narrowing that persists after nitrate supports SCAD.",
            "Use IVUS or OCT only when the diagnosis is genuinely uncertain: instrumentation can extend the dissection. On IVUS the haematoma appears as a dark crescent compressing the true lumen.",
            "Screen for FMD in other vascular beds when SCAD is diagnosed.",
          ],
        },
        {
          kind: "table",
          caption: "Conservative or intervene?",
          head: ["Situation", "Usual approach"],
          rows: [
            ["Stable, TIMI 2–3 flow, no ongoing ischaemia", "Conservative; most dissections heal spontaneously over weeks"],
            ["Ongoing ischaemia or STEMI with TIMI 0–1 flow", "Revascularise to save myocardium"],
            ["Haemodynamic instability or arrhythmia", "Revascularise"],
            ["Left main or proximal multivessel dissection", "Revascularise; CABG may be preferable when PCI is not feasible"],
          ],
        },
        {
          kind: "steps",
          title: "When PCI is necessary: keep it minimal",
          items: [
            { title: "Wire gently", detail: "A soft workhorse wire, confirming distal true-lumen position (for example by entering a distal branch) before any device." },
            { title: "Restore flow with a small balloon", detail: "Low-pressure, undersized balloon inflation. If TIMI 3 flow returns, stop." },
            { title: "Stent only if unavoidable", detail: "Use stents long enough to extend well beyond the haematoma; some operators treat the distal and proximal edges first to limit propagation. Haematoma resorption can later leave struts malapposed." },
            { title: "Surgery for extensive proximal disease", detail: "Bypass grafts often occlude later as the native vessel heals, but CABG can be lifesaving acutely." },
          ],
        },
        {
          kind: "pearl",
          text: "PCI in SCAD has lower success and higher complication rates than in atherosclerotic disease. The angiographic diagnosis matters even when the vessel is occluded, because it changes the technique, the medical therapy and the follow-up.",
        },
        { kind: "h", text: "Anomalous coronary arteries" },
        {
          kind: "p",
          text: "Anomalous origin or course is found in about 1–2% of angiograms. Separate LAD and LCx ostia and an anterior RCA origin are common enough to be normal variants. The commonest true anomaly is an LCx arising from the right sinus or RCA and running behind the aorta (retro-aortic), which is benign. The most dangerous is a coronary passing between the aorta and pulmonary artery (interarterial), especially the left coronary from the right sinus.",
        },
        {
          kind: "list",
          items: [
            "Suspect an anomaly when expected anatomy is missing, for example no LCx on the left injection; the LCx may fill faintly from the right.",
            "An aortogram or CT coronary angiography defines origin and course before PCI.",
            "Standard Judkins catheters often fail; Amplatz (left or right) or multipurpose curves reach unusual ostia. Guide support is frequently poor, so plan for support techniques.",
            "An interarterial course with high-risk features is usually a surgical question for a specialist team, not an ad hoc PCI target.",
            "Atherosclerotic lesions in an anomalous but benign-course vessel are treated with standard PCI technique once a stable guide position is achieved.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting a non-occlusive SCAD in a stable patient.",
            "Routine IVUS or OCT to 'confirm' an obvious SCAD.",
            "Forcing a guide into an anomalous ostium and dissecting it.",
            "Failing to notice that a territory is unsupplied and missing an anomalous vessel altogether.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "SCAD: give nitrate, diagnose angiographically, treat conservatively if stable with preserved flow.",
            "Intervene for ongoing ischaemia with poor flow, instability or LM/proximal multivessel involvement, and keep PCI minimal.",
            "Anomalies: define with CT or aortogram, choose Amplatz or multipurpose curves, refer interarterial courses to a specialist team.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-sp-ostial-rca",
      stem: "You are stenting a fibrotic aorto-ostial RCA lesion. Which approach to positioning is correct?",
      options: [
        "LAO view, guide backed out, stent protruding about 1–2 mm into the aorta",
        "RAO view, guide deeply engaged, and the proximal marker 2 mm inside the RCA",
        "Any view, with the guide engaged to stabilise the stent during deployment",
        "LAO view, with the stent positioned 5 mm into the aorta to ensure coverage",
      ],
      answer: 0,
      explanation:
        "The LAO view is orthogonal to the RCA ostium, and the guide must be disengaged so the stent can cover the ostium with a small aortic protrusion. Keeping the stent inside the RCA is the commonest error and leaves ostial plaque uncovered. A long protrusion makes later engagement very difficult.",
      difficulty: 2,
      refs: ["supplied-eh-views", "supplied-medmastery"],
    },
    {
      id: "cx-q-sp-pseudolesion",
      stem: "After an extra-support wire is advanced into a tortuous RCA, two new narrowings appear in a previously normal mid segment. What should you do?",
      options: [
        "Withdraw the stiff part of the wire, or use a softer wire, and re-image",
        "Stent both narrowings immediately before they progress to occlusion",
        "Give intracoronary adenosine and then proceed to stenting both segments",
        "Pre-dilate both narrowings with a semi-compliant balloon, then stent",
      ],
      answer: 0,
      explanation:
        "New narrowings that appear after a stiff wire straightens a tortuous vessel are pseudo-lesions (concertina effect) and disappear when the stiff segment is withdrawn or a softer wire is used. Stenting them is the tempting mistake and treats a non-existent lesion.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "cx-q-sp-dcb-accept",
      stem: "After lesion preparation in a 2.5 mm vessel, which finding makes it appropriate to proceed with a drug-coated balloon rather than a stent?",
      options: [
        "Residual stenosis about 25%, TIMI 3 flow, small non-flow-limiting type A dissection",
        "Residual stenosis about 50%, TIMI 3 flow and no dissection on the final angiogram",
        "Residual stenosis about 20%, TIMI 2 flow and a type D spiral dissection",
        "Residual stenosis about 40%, TIMI 3 flow and a type C dissection with contrast stain",
      ],
      answer: 0,
      explanation:
        "DCB requires good preparation: residual stenosis of about 30% or less, TIMI 3 flow and no flow-limiting dissection; small type A–B dissections are acceptable. A spiral (type D) dissection with impaired flow needs a stent even though the residual stenosis looks good, which makes the 20% residual with a spiral dissection the tempting trap.",
      difficulty: 2,
      refs: ["nhlbi-dissection-1991", "brilakis-manual-pci", "jeger-dcb-consensus-2020"],
    },
    {
      id: "cx-q-sp-mehran",
      stem: "A restenosis 18 mm long extends beyond both edges of a 15 mm stent. What is the Mehran pattern?",
      options: ["III (proliferative)", "II (diffuse intrastent)", "I (focal)", "IV (occlusive)"],
      answer: 0,
      explanation:
        "Pattern III is diffuse restenosis longer than 10 mm that extends beyond the stent edges. Pattern II is the tempting option but applies only when the restenosis is confined within the stent.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "mehran-isr-1999"],
    },
    {
      id: "cx-q-sp-isr-first",
      stem: "A patient has recurrent angina 9 months after LAD stenting. Angiography shows focal ISR. What is the most useful first step before choosing a treatment?",
      options: [
        "Intravascular imaging to look for underexpansion or other mechanical causes",
        "Implant a second drug-eluting stent inside the first to cover the restenosis",
        "Treat with a drug-coated balloon straight away, without further assessment",
        "Rotational atherectomy of the stent struts to debulk the restenotic tissue",
      ],
      answer: 0,
      explanation:
        "Imaging identifies mechanical causes such as underexpansion, fracture or edge disease, which change treatment; an underexpanded stent must be expanded rather than covered with another layer. Proceeding directly to DES or DCB is tempting but may leave the cause untreated. Stent ablation is a last resort in specialist hands.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "eapci-imaging-2018"],
    },
    {
      id: "cx-q-sp-scad-conservative",
      stem: "A 42-year-old woman with NSTEMI has a long, smooth mid-LAD narrowing that persists after intracoronary nitrate. Flow is TIMI 3, she is pain-free and haemodynamically stable. What is the best management?",
      options: [
        "Conservative medical management without PCI",
        "IVUS to confirm the diagnosis, then stent",
        "Long DES covering the whole narrowing",
        "Balloon angioplasty to restore a normal lumen",
      ],
      answer: 0,
      explanation:
        "This is type 2 SCAD in a stable patient with preserved flow; most such dissections heal, and PCI has lower success with a risk of propagation. Imaging to confirm is tempting but adds risk when the angiographic diagnosis is clear and would not change management.",
      difficulty: 2,
      refs: ["scad-esc-2018", "supplied-eh-views"],
    },
    {
      id: "cx-q-sp-runoff",
      stem: "Why did a long overlapping LAD stent ending in a very small distal vessel thrombose two days after implantation in a patient with stable angina?",
      options: [
        "Poor distal run-off left too little outflow to keep the stented segment patent",
        "The patient was given too much heparin",
        "Long stents always thrombose within 48 hours",
        "The stent was oversized for the distal vessel, causing perforation",
      ],
      answer: 0,
      explanation:
        "A stent needs adequate outflow; ending a long stent in a tiny territory with minimal flow is a major driver of early thrombosis. Long stents increase risk but do not always thrombose, which makes the claim that they always thrombose within 48 hours an overstatement. Excess heparin causes bleeding, not thrombosis.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Treat an in-stent restenosis: image, correct underexpansion, prepare with a scoring balloon and finish with a drug-coated balloon sized 1:1.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 7 — Complex high-risk indicated PCI
// ---------------------------------------------------------------------------
const highRisk: Module = {
  id: "cx-high-risk",
  title: "Complex high-risk indicated PCI",
  stage: 5,
  summary:
    "Define complex high-risk indicated PCI, assess patient, anatomical and haemodynamic risk, plan protected PCI and large-bore access, and set stop and bail-out criteria before starting.",
  objectives: [
    "Describe the three risk domains of complex high-risk indicated PCI and confirm that a real indication exists.",
    "Use invasive haemodynamics (LVEDP, cardiac power output, PAPi) to inform planning.",
    "Explain the principles and limits of evidence for mechanical support during high-risk PCI.",
    "Plan large-bore femoral access, and set explicit stop, escalation and bail-out criteria.",
  ],
  lessons: [
    {
      id: "cx-chip-assessment",
      title: "Defining and assessing complex high-risk indicated PCI",
      minutes: 5,
      refs: ["revived-2022", "esc-ccs-2024", "syntax-2009", "mehran-cin-2004", "supplied-medmastery", "brilakis-manual-pci", "fincke-cpo-2004", "korabathina-papi-2012"],
      blocks: [
        {
          kind: "p",
          text: "Complex high-risk indicated PCI (CHIP) describes patients in whom complex anatomy, comorbidity and impaired haemodynamics coincide, who have a genuine indication for revascularisation, and for whom PCI has been chosen, often because surgery is declined or carries prohibitive risk. The word that matters most is *indicated*: high risk is only justified by a clear expected benefit.",
        },
        {
          kind: "table",
          caption: "Three risk domains",
          head: ["Domain", "Examples"],
          rows: [
            ["Patient", "Advanced age, frailty, diabetes, chronic kidney disease, prior CABG, peripheral vascular disease, lung disease, prior stroke"],
            ["Anatomy and lesion", "Unprotected left main, last remaining vessel, multivessel disease, CTO, heavy calcium needing atherectomy, complex bifurcation, degenerated grafts"],
            ["Haemodynamic", "Severe LV dysfunction, raised LVEDP, RV dysfunction, significant valve disease (especially aortic stenosis), recent decompensation"],
          ],
        },
        { kind: "h", text: "Is there a real indication?" },
        {
          kind: "list",
          items: [
            "Symptoms limiting quality of life despite optimal medical therapy, in a territory with viable myocardium.",
            "An acute coronary syndrome with a treatable culprit.",
            "Prognosis alone is a weak indication in stable ischaemic cardiomyopathy: REVIVED-BCIS2 found that PCI did not reduce death or heart-failure hospitalisation compared with optimal medical therapy in patients with severe ischaemic LV dysfunction and viable myocardium.",
            "A heart team decision documenting why CABG is not chosen, and the patient's own goals and understanding of risk.",
          ],
        },
        { kind: "h", text: "Haemodynamic assessment" },
        {
          kind: "p",
          text: "Measure before you start. A right heart study or at least an LVEDP measurement at the beginning of the case tells you how much reserve the patient has. A high LVEDP before any ischaemia means little tolerance for balloon inflations, slow flow or contrast load.",
        },
        {
          kind: "formula",
          name: "Cardiac power output",
          expr: "CPO (W) = mean arterial pressure (mmHg) × cardiac output (L/min) ÷ 451",
          note: "Integrates pressure and flow; low values indicate limited haemodynamic reserve. Interpret in context rather than against a single cut-off.",
        },
        {
          kind: "formula",
          name: "Pulmonary artery pulsatility index",
          expr: "PAPi = (PA systolic − PA diastolic) ÷ right atrial pressure",
          note: "Low values suggest RV dysfunction, which matters if left-sided support is planned, because an LV support device depends on the RV filling it.",
        },
        {
          kind: "table",
          caption: "Risk features and what they mean for the plan",
          head: ["Feature", "Planning implication"],
          rows: [
            ["Unprotected LM or last remaining vessel with poor LV", "Plan haemodynamic support and large-bore access"],
            ["Occluded RCA or poor collaterals to the target territory", "Ischaemia during inflations will be poorly tolerated"],
            ["Heavy calcium needing atherectomy", "Slow flow is likely; poor LV tolerates it badly"],
            ["Chronic kidney disease", "Contrast budget, hydration plan, staging"],
            ["Severe aortic stenosis", "Heart team: valve and coronary sequence; hypotension tolerated badly"],
            ["Peripheral vascular disease", "Large-bore access may be impossible; alternative access or no support"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Equating CHIP with 'treat everything': complete revascularisation is not a goal in itself.",
            "Skipping the heart team because the patient is 'too sick for surgery'.",
            "Starting without an LVEDP or right heart study and discovering the lack of reserve during the first inflation.",
            "Ignoring kidney function: contrast nephropathy is common in this group and worsens outcomes.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "CHIP combines patient, anatomical and haemodynamic risk with a clear indication.",
            "PCI for prognosis alone in stable ischaemic cardiomyopathy is not supported by REVIVED-BCIS2.",
            "Measure LVEDP or perform a right heart study before starting.",
          ],
        },
      ],
    },
    {
      id: "cx-chip-support",
      title: "Protected PCI and large-bore access",
      minutes: 5,
      refs: ["brilakis-manual-pci", "supplied-medmastery", "hanna-pcm", "protect-ii-2012", "perera-chip-bcis3-2026"],
      blocks: [
        {
          kind: "p",
          text: "Mechanical support during high-risk PCI aims to keep perfusion pressure up and the left ventricle unloaded through the ischaemic periods of the procedure: balloon inflations, atherectomy runs, slow flow and complications. This lesson covers principles only; the devices are taught in depth in the acute-mcs track.",
        },
        {
          kind: "table",
          caption: "Support options in principle",
          head: ["Device", "What it does", "Main limitations"],
          rows: [
            ["Intra-aortic balloon pump", "Diastolic augmentation and modest afterload reduction; small increase in output", "Modest support; depends on native LV function and rhythm"],
            ["Microaxial flow pump (Impella type)", "Pumps blood from LV to aorta, unloading the LV and adding forward flow", "Large-bore access, haemolysis, vascular and bleeding complications; needs adequate RV function"],
            ["VA-ECMO", "Full circulatory and respiratory support", "Raises LV afterload (may need venting); largest cannulae and complication burden; rarely used for elective PCI"],
          ],
        },
        {
          kind: "p",
          text: "The evidence for routine prophylactic support in elective high-risk PCI is limited. PROTECT II, comparing a microaxial pump with an IABP during high-risk PCI, did not show a significant difference in its 30-day primary composite endpoint. CHIP-BCIS3 (2026) randomised 300 patients with severe LV dysfunction having complex PCI to elective microaxial-pump unloading or standard care: the pump did not reduce the hierarchical composite (win ratio 0.85, 95% CI 0.63–1.15), and deaths were numerically higher with it (hazard ratio 1.54, 95% CI 0.99–2.41). Guidelines do not recommend routine use, and the decision is individual: severity of LV dysfunction, the amount of myocardium at risk, LVEDP, the expected ischaemic time and the vascular access available.",
        },
        {
          kind: "list",
          items: [
            "Teams commonly consider support when severe LV impairment coincides with an unprotected LM, a last remaining vessel or extensive myocardium at risk, especially with a raised LVEDP or planned atherectomy. Thresholds vary between centres.",
            "If support is not inserted upfront, place a femoral sheath or at least prepare access so a device can be inserted quickly if the patient deteriorates.",
          ],
        },
        { kind: "h", text: "Large-bore femoral access" },
        {
          kind: "steps",
          items: [
            { title: "Image the iliofemoral axis beforehand", detail: "CT or angiography: minimal lumen diameter against the device's sheath size (check the instructions for use), calcification, tortuosity, prior surgery or stents." },
            { title: "Puncture the right spot", detail: "Ultrasound-guided anterior-wall puncture of the common femoral artery, over the femoral head, above the bifurcation and below the inferior epigastric artery; confirm with fluoroscopy and a sheath angiogram before upsizing." },
            { title: "Pre-close before upsizing", detail: "Place suture-based closure devices (commonly two) through the small sheath before dilating up to the large-bore sheath, following the device technique." },
            { title: "Upsize carefully", detail: "Anticoagulate, then serial dilatation over a stiff wire." },
            { title: "Protect the limb", detail: "Check distal pulses or Doppler signals; consider a distal perfusion cannula when large-bore support will stay in for long." },
            { title: "Plan removal", detail: "Close in the lab where possible, with contralateral access and a balloon ready to tamponade the iliac artery from above if closure fails." },
          ],
        },
        {
          kind: "p",
          text: "Alternative routes (axillary, transcaval) exist in specialist centres when the femoral route is unusable.",
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing above the inferior epigastric artery: retroperitoneal bleeding that cannot be compressed.",
            "Puncturing at or below the bifurcation: pseudoaneurysm, limb ischaemia and closure failure.",
            "Upsizing before placing pre-closure sutures.",
            "Forgetting that an LV support device relies on a functioning RV.",
          ],
        },
        {
          kind: "sim",
          sim: "impella",
          task: "Position a microaxial pump with its inlet in the LV and outlet above the aortic valve, then identify the console and imaging signs of a malpositioned pump.",
        },
        {
          kind: "keypoints",
          items: [
            "Support maintains perfusion and unloads the LV during ischaemic periods.",
            "Evidence for routine prophylactic support is limited; decide case by case.",
            "Large-bore access: image first, ultrasound-guided CFA puncture, pre-close, protect the limb, plan closure.",
          ],
        },
      ],
    },
    {
      id: "cx-chip-conduct",
      title: "Running the case: sequence, stop rules and bail-out",
      minutes: 4,
      refs: ["seattle-complications-2020", "brilakis-manual-pci", "cto-consensus-2019", "mehran-cin-2004"],
      blocks: [
        {
          kind: "steps",
          title: "Before the patient arrives",
          items: [
            { title: "Brief the team", detail: "Indication, plan, expected difficult steps, support strategy, and what each person does if the patient deteriorates." },
            { title: "Equipment on the table", detail: "Debulking devices, covered stents, coils, a pericardiocentesis set, temporary pacing and support devices checked and available." },
            { title: "Patient preparation", detail: "Kidney protection and hydration per local protocol, blood products if needed, an anaesthetic plan (usually local anaesthesia and light sedation), and invasive arterial monitoring." },
            { title: "Budget contrast, time and radiation", detail: "Agree upfront ceilings; for contrast, a commonly quoted ratio is about 3.7 × eGFR in mL." },
          ],
        },
        { kind: "h", text: "Sequence" },
        {
          kind: "list",
          items: [
            "Ask which lesion, if it went wrong, would be least tolerated. Treat it with support in place and all bail-out tools ready.",
            "If a vessel is a donor of collaterals to an occluded territory, protecting it is protecting two territories.",
            "Stage the procedure when contrast, time or the patient's tolerance runs out; staging is a plan, not a failure.",
          ],
        },
        {
          kind: "table",
          caption: "Stop or escalate triggers",
          head: ["Trigger", "Response"],
          rows: [
            ["Falling mean arterial pressure, rising LVEDP or PA pressure", "Pause the ischaemic step; restore perfusion; escalate support"],
            ["Slow flow or no-reflow during atherectomy", "Stop ablating; vasodilators distally; support blood pressure"],
            ["Sustained arrhythmia", "Treat; reconsider whether to continue"],
            ["Contrast, time or radiation ceiling reached", "Stop and stage"],
            ["Perforation, dissection or equipment loss", "Follow the bail-out pathway (complications track)"],
            ["Patient distress or intolerance", "Pause; reconsider sedation and plan"],
          ],
        },
        {
          kind: "p",
          text: "Escalation should be rehearsed, not improvised: who inserts the device, through which access, and what the next step is if it is not enough. In practice a named second operator and a scrub nurse who knows the bail-out sequence matter as much as the device.",
        },
        {
          kind: "list",
          items: [
            "Spare contrast: let intravascular imaging and physiology replace confirmatory injections, use small test puffs, and choose projections carefully so each run answers a question.",
            "Spare ischaemic time: keep balloon inflations short, deflate fully between inflations, and avoid leaving guide extensions or bulky devices across the target territory longer than needed.",
            "Spare radiation: collimate, lower the frame rate, change angulation during long cases, and keep the detector close to the patient.",
          ],
        },
        { kind: "h", text: "After the procedure" },
        {
          kind: "list",
          items: [
            "Wean and remove support in the lab where possible, or plan monitored weaning in a critical care setting.",
            "Check access sites, limb perfusion, haemoglobin and kidney function.",
            "Document what was done, what was left untreated and whether further staged work is planned.",
            "Debrief the team, especially after a difficult case.",
          ],
        },
        {
          kind: "pearl",
          text: "The best bail-out is the one you never need because the plan stopped you in time. Agree the stop criteria aloud before the first wire is in.",
        },
        {
          kind: "keypoints",
          items: [
            "Brief, prepare equipment and budget contrast before starting.",
            "Sequence lesions by how badly a complication would be tolerated.",
            "Use explicit stop and escalation triggers, and stage when limits are reached.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cx-q-hr-domains",
      stem: "Which of the following is NOT one of the three risk domains used to define complex high-risk indicated PCI?",
      options: [
        "Operator experience",
        "Patient comorbidity",
        "Anatomical and lesion complexity",
        "Haemodynamic status",
      ],
      answer: 0,
      explanation:
        "CHIP is defined by patient, anatomical and haemodynamic risk in the presence of an indication. Operator experience influences outcome and should match the case, but it is not a defining domain; that distinction is what makes it the tempting choice.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cx-q-hr-revived",
      stem: "What did REVIVED-BCIS2 show in patients with severe ischaemic LV dysfunction and viable myocardium?",
      options: [
        "PCI did not reduce death or heart-failure admission versus medical therapy",
        "PCI reduced all-cause mortality by about a third over a median of three years",
        "PCI improved LVEF substantially at 6 months compared with medical therapy",
        "PCI was superior to CABG in patients with viable myocardium on cardiac MRI",
      ],
      answer: 0,
      explanation:
        "REVIVED-BCIS2 found no reduction in its primary outcome of death or heart-failure hospitalisation with PCI on top of optimal medical therapy. A mortality benefit is tempting because viability seemed to promise it, but the trial did not show one. CABG was not a comparator.",
      difficulty: 2,
      refs: ["revived-2022"],
    },
    {
      id: "cx-q-hr-cpo",
      stem: "A patient has a mean arterial pressure of 70 mmHg and a cardiac output of 4.0 L/min. What is the cardiac power output?",
      options: ["About 0.62 W", "About 2.8 W", "About 0.16 W", "About 1.6 W"],
      answer: 0,
      explanation:
        "CPO = MAP × CO ÷ 451 = 70 × 4.0 ÷ 451, about 0.62 W. A value of 2.8 comes from dividing by 100 instead of 451, the commonest arithmetic slip.",
      difficulty: 2,
      refs: ["hanna-pcm", "fincke-cpo-2004"],
    },
    {
      id: "cx-q-hr-puncture",
      stem: "Where should the arterial puncture be for large-bore femoral access?",
      options: [
        "Common femoral artery over the femoral head, between the bifurcation and the epigastric",
        "Superficial femoral artery just below the bifurcation, where the vessel runs a straight course",
        "External iliac artery above the inguinal ligament, which offers a larger vessel",
        "At the level of the inguinal skin crease, regardless of where the femoral head lies",
      ],
      answer: 0,
      explanation:
        "The common femoral artery over the femoral head can be compressed and closed, and the puncture stays below the inferior epigastric artery to avoid retroperitoneal bleeding. The external iliac is tempting because it is larger, but a puncture there cannot be compressed. The skin crease is an unreliable landmark.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cx-q-hr-preclose",
      stem: "When are suture-based closure devices deployed in the pre-close technique for large-bore access?",
      options: [
        "Through the initial small sheath, before upsizing to the large-bore sheath",
        "After the large-bore sheath is removed at the end of the case, over a wire",
        "Only if manual compression fails after the large-bore sheath is removed",
        "Through the large-bore sheath during the procedure, once the device is in",
      ],
      answer: 0,
      explanation:
        "Pre-closure means placing the sutures through a small sheath before dilating the artery, then tying them when the large sheath is removed. Deploying after the large sheath is out is the tempting answer, but by then the arteriotomy is too large for standard suture placement.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "cx-q-hr-protect2",
      stem: "Which statement best summarises the evidence for routine prophylactic mechanical support in elective high-risk PCI?",
      options: [
        "Limited: a microaxial pump versus IABP trial showed no significant 30-day difference",
        "Routine microaxial pump support has been shown to reduce mortality at 90 days",
        "IABP has been shown to reduce mortality in elective high-risk PCI in randomised trials",
        "Guidelines recommend routine support for all patients with an LVEF below 40%",
      ],
      answer: 0,
      explanation:
        "PROTECT II did not show a significant difference in its primary 30-day composite between a microaxial pump and IABP, and guidelines do not recommend routine support. The mortality claims are tempting because support is intuitive, but they have not been shown in elective high-risk PCI.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "protect-ii-2012"],
    },
    {
      id: "cx-q-hr-trigger",
      stem: "During rotational atherectomy of an unprotected left main in a patient with LVEF 25%, flow slows, mean arterial pressure falls from 80 to 58 mmHg and the patient becomes breathless. What is the most appropriate immediate response?",
      options: [
        "Stop ablating, restore perfusion pressure and escalate support",
        "Continue with a larger burr to finish quickly",
        "Inject contrast forcefully to clear the slow flow",
        "Proceed to stenting immediately without assessing flow",
      ],
      answer: 0,
      explanation:
        "Slow flow with haemodynamic deterioration is a stop-and-escalate trigger: stop the ischaemic step, support the circulation and treat slow flow before going on. Finishing quickly is tempting in a crisis, but more ablation adds debris and ischaemia to a ventricle with no reserve.",
      difficulty: 2,
      refs: ["seattle-complications-2020", "brilakis-manual-pci"],
    },
  ],
  sims: [
    {
      sim: "impella",
      task: "Set up a microaxial pump for protected PCI: confirm position, then recognise suction and malposition alarms during a simulated ischaemic period.",
    },
    {
      sim: "iabp",
      task: "Time an intra-aortic balloon pump correctly, then identify early and late inflation and deflation errors.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Cases (synthetic)
// ---------------------------------------------------------------------------
const cases: CaseStudy[] = [
  {
    id: "cx-case-lm-bifurcation",
    title: "Distal left main bifurcation in a patient with diabetes",
    trackId: "pci-complex",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "Heart team decision, IVUS-guided choice between provisional and two-stent strategy, management of a compromised LCx, and the role of the final POT.",
    presentation:
      "A 67-year-old man with insulin-treated type 2 diabetes, hypertension and an eGFR of 58 mL/min/1.73 m² has had two months of CCS class III angina despite a beta-blocker, a calcium-channel blocker and a long-acting nitrate. Echocardiography shows an LVEF of 50% with no significant valve disease. An exercise test showed ST depression at a low workload.",
    findings: [
      "Right radial access, 6 Fr diagnostic catheters.",
      "Distal left main stenosis of about 70% extending into the LAD and LCx ostia (Medina 1,1,1).",
      "LAD with mild mid-vessel disease; non-dominant LCx of good size; dominant RCA with mild irregularities.",
      "SYNTAX score calculated at 21.",
      "BP 128/72 mmHg, heart rate 64 bpm, pain-free on the table.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The diagnostic angiogram is complete. What is the most appropriate next step?",
        options: [
          {
            text: "Discuss at the heart team meeting with the SYNTAX score, surgical risk and the patient's preferences.",
            best: true,
            feedback:
              "Correct. Stable LM disease is a heart team decision. With a low SYNTAX score both PCI and CABG are reasonable (2018 ESC/EACTS: both Class I), and the patient should hear the trade-offs, including more repeat revascularisation after PCI.",
            next: "s2",
          },
          {
            text: "Proceed to ad hoc left main PCI now while radial access is in place.",
            feedback:
              "Not appropriate in a stable patient. Ad hoc LM PCI denies the patient an informed choice between PCI and CABG and skips heart team review. The case continues after a heart team discussion.",
            next: "s1-adhoc-lm", stateDelta: {"stability": -10} },
          {
            text: "Refer directly for CABG because diabetes mandates surgery.",
            feedback:
              "CABG is a strong option, but diabetes does not mandate it in isolated LM disease with a low SYNTAX score. The decision belongs to the heart team with the patient. The case continues after that discussion.",
            next: "s2",
          },
          {
            text: "Measure left main FFR before deciding anything.",
            feedback:
              "Physiology or IVUS helps with intermediate LM lesions, but a 70% distal LM stenosis with typical angina and a positive exercise test does not need functional confirmation to reach the heart team. The case continues after the discussion.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you plan the procedure?",
        info:
          "Heart team: SYNTAX 21, EuroSCORE II 2.1%. The surgeon is willing to operate. After discussing both options, including the higher repeat revascularisation rate after PCI, the patient chooses PCI.",
        options: [
          {
            text: "Radial or femoral access with a 7 Fr extra-backup guide, IVUS available, with pullbacks from both LAD and LCx before choosing the stent strategy.",
            best: true,
            feedback:
              "Correct. A supportive guide large enough for any bifurcation technique, and IVUS from both branches, tell you LM size and how far plaque extends into the LCx, which decides provisional versus two stents.",
            next: "s3",
          },
          {
            text: "6 Fr JL4 guide, angiography-guided provisional stenting with sizing by eye.",
            feedback:
              "Angiographic sizing of the LM is unreliable and the JL4 gives limited support for bifurcation work. Intravascular imaging is expected for LM PCI.",
            next: "s3",
          },
          {
            text: "Plan simultaneous kissing stents from the outset for speed.",
            feedback:
              "SKS creates a long metal neocarina in a diseased LM and makes future intervention difficult. It is suited only to a large, disease-free proximal segment.",
            next: "s3",
          },
          {
            text: "Insert a microaxial pump electively because the lesion is in the left main.",
            feedback:
              "LVEF is 50%, the dominant RCA is patent and haemodynamics are normal. Support adds access complications without a clear benefit here.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "Which stent strategy do you choose?",
        info:
          "IVUS: LM reference diameter 4.8 mm with a minimal lumen area of 4.9 mm²; proximal LAD 3.8 mm; LCx 3.2 mm. LCx ostial plaque extends 4 mm into the LCx; no significant calcium.",
        options: [
          {
            text: "Provisional: LM-to-LAD cross-over stent sized to the LAD, POT to the LM diameter, and treat the LCx only if compromised.",
            best: true,
            feedback:
              "Correct. LCx disease is short (under 10 mm), so this does not meet the DEFINITION LM major criterion. Provisional is the default, as supported by EBC MAIN.",
            next: "s4",
          },
          {
            text: "Planned DK-crush, because this is a true bifurcation.",
            feedback:
              "DKCRUSH-V favoured DK-crush in LM lesions with more extensive SB disease. A 4 mm LCx ostial lesion does not need a planned second stent; a true bifurcation alone is not an indication.",
            next: "s4",
          },
          {
            text: "Culotte from the LM into both branches.",
            feedback:
              "Culotte suits branches of similar size with significant disease in both. Here it adds metal and steps without need.",
            next: "s4",
          },
          {
            text: "Stent the left main shaft only, stopping proximal to the bifurcation.",
            feedback:
              "The disease involves the distal LM and both ostia. Stopping short leaves the most important disease untreated.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "What do you do next?",
        info:
          "A 3.75 × 22 mm DES is deployed from LM into LAD, jailing the LCx wire, followed by POT with a 5.0 mm NC balloon. In the caudal view the LCx ostium now looks about 80% narrowed with TIMI 2 flow. The patient reports chest tightness and there is 1 mm ST depression in I and aVL.",
        options: [
          {
            text: "Rewire the LCx through a distal cell, remove the jailed wire, open the ostium with kissing NC balloons (or POT–side–POT), then re-POT.",
            best: true,
            feedback:
              "Correct. TIMI 2 flow with ischaemia means the LCx is compromised. A distal-cell rewire with kissing or POT–side–POT usually restores it without a second stent.",
            next: "s5",
          },
          {
            text: "Leave it, because jailed branches are overestimated by angiography.",
            feedback:
              "That applies to a pinched ostium with TIMI 3 flow and no ischaemia. Here flow is reduced and the patient has ischaemia in a large branch.",
            next: "s5",
          },
          {
            text: "Stent the LCx immediately using TAP without first rewiring and dilating.",
            feedback:
              "TAP requires a wire through the MV stent struts in any case, and most compromised branches recover after rewiring and dilatation. A second stent is the bail-out if that fails.",
            next: "s5",
          },
          {
            text: "Pull out the jailed LCx wire first, then try to rewire the LCx.",
            feedback:
              "Removing the jailed wire first loses your landmark and the route back into a narrowed branch. Rewire first, then remove it.",
            next: "s4-lost-lcx", stateDelta: {"stability": -20, "flags": ["lcx-lost"]} },
        ],
      },
      {
        id: "s5",
        prompt: "What do you do now?",
        info:
          "After a distal-cell rewire and kissing with 3.5 mm (LAD) and 3.0 mm (LCx) NC balloons, LCx flow is TIMI 3 and symptoms settle. IVUS: LCx ostium minimal stent area 5.3 mm², LAD ostium 7.0 mm², polygon of confluence 8.1 mm². The proximal LM stent is oval and malapposed, with a stent area of 9.0 mm² against a lumen area of about 13 mm².",
        options: [
          {
            text: "Final re-POT with the 5.0 mm NC balloon in the LM, distal marker just proximal to the carina, then repeat IVUS.",
            best: true,
            feedback:
              "Correct. Kissing distorts the proximal stent into an oval. A final POT restores a circular, apposed proximal stent without disturbing the branches.",
          },
          {
            text: "Accept the result, because each segment meets the minimal stent area targets.",
            feedback:
              "Absolute areas are not the only criterion: the proximal stent is malapposed and distorted after kissing, which a final POT corrects quickly.", next: "s5-no-repot", stateDelta: {"stability": -10} },
          {
            text: "Implant a second stent in the proximal LM.",
            feedback:
              "The problem is malapposition and ovalisation, not inadequate coverage. A second layer of metal adds nothing that a POT cannot fix.",
          },
          {
            text: "Repeat kissing with larger balloons.",
            feedback:
              "Larger kissing balloons distort the proximal stent further and risk dissection. Re-POT is the correction.",
          },
        ],
      },
      {
        "id": "s1-adhoc-lm",
        "kind": "consequence",
        "info": "Halfway through preparing the guide, the patient asks whether surgery was an option and says nobody has discussed it with him.",
        "prompt": "What do you do?",
        "options": [
          {
            "text": "Stop, explain the findings and both options, and take the case to the heart team before any left main PCI",
            "best": true,
            "feedback": "Stable left main disease in diabetes needs a heart team decision and an informed patient.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Reassure him that PCI is equivalent and proceed",
            "feedback": "Equivalence depends on the SYNTAX score and patient factors; he has not been given the choice.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "Proceed and discuss surgery afterwards if the result is poor",
            "feedback": "Consent must come before the procedure.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s4-lost-lcx",
        "kind": "consequence",
        "info": "With the jailed wire removed, repeated attempts fail to rewire the LCx. It is now occluded; the patient has pain and lateral ST depression.",
        "prompt": "The circumflex is lost after removing the marker wire. What now?",
        "options": [
          {
            "text": "Use a dual-lumen microcatheter from the LAD wire and a polymer-jacketed wire to recross the struts, then a small balloon to open the ostium",
            "best": true,
            "feedback": "Dedicated microcatheters improve side-branch rewiring; keep the jailed wire next time as a marker.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Accept the loss; the circumflex is non-dominant",
            "feedback": "A 3.2 mm circumflex supplies a large territory; ongoing ischaemia needs treatment.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Inflate a large balloon in the LAD stent to push the carina back",
            "feedback": "Further main-vessel dilatation pushes the carina further across the ostium.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s5-no-repot",
        "kind": "consequence",
        "info": "Final IVUS shows the proximal left main stent elliptical and distorted after kissing, with an area well below the target for this left main.",
        "prompt": "What should have followed the kissing inflation?",
        "options": [
          {
            "text": "A final re-POT in the left main to round the proximal stent; do it now and repeat IVUS",
            "best": true,
            "feedback": "Kissing distorts the proximal stent; a final POT restores its shape.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Nothing; IVUS targets apply to the branches only",
            "feedback": "The left main target is the one that matters most.",
            "stateDelta": {
              "stability": -10
            }
          },
          {
            "text": "A second stent in the proximal left main",
            "feedback": "The problem is shape, not coverage.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "After the final POT, IVUS showed a circular, well-apposed LM stent with all segments meeting their targets. The patient was discharged the next day on dual antiplatelet therapy per local protocol, with secondary prevention and diabetes review.",
    outcomeVariants: [
      {
        "flag": "lcx-lost",
        "text": "Removing the jailed wire before rewiring cost time and caused a transient circumflex occlusion."
      }
    ],
    learningPoints: [
      "Stable left main disease is a heart team decision; SYNTAX, surgical risk and patient preference drive it.",
      "IVUS of both branches before stenting decides between provisional and two-stent strategies.",
      "Short SB ostial disease favours provisional even in a Medina 1,1,1 lesion.",
      "A compromised side branch is rewired through a distal cell before the jailed wire is removed.",
      "Kissing distorts the proximal stent: always finish with a re-POT.",
    ],
    refs: ["esc-revasc-2018", "excel-2016", "noble-2016", "ebc-consensus", "definition-2014", "dkcrush5-2017", "ebc-main-2021", "kang-lm-ivus-2011", "koo-jailed-sb-ffr-2005"],
  },
  {
    id: "cx-case-calcified-rca",
    title: "Heavily calcified RCA: the balloon that will not expand",
    trackId: "pci-complex",
    stage: 4,
    provenance: { kind: "synthetic" },
    summary:
      "An undilatable calcified RCA lesion: imaging, calcium scoring, choosing lithotripsy, recognising benign pulse-synchronous ectopy, sizing and accepting a good result.",
    presentation:
      "A 78-year-old woman has CCS class III angina despite two antianginal drugs. She has chronic kidney disease (eGFR 42 mL/min/1.73 m²) and an LVEF of 55%. Angiography showed a severe calcified mid-RCA stenosis with minor LAD and LCx disease, and the heart team recommended PCI.",
    findings: [
      "Right radial access, 6 Fr JR4 guide.",
      "Mid-RCA 90% stenosis about 15 mm long, with radio-opacities visible on both sides of the vessel before contrast and without cardiac motion.",
      "Distal RCA reference about 3.0 mm, proximal about 3.5 mm.",
      "BP 138/70 mmHg, heart rate 66 bpm, sinus rhythm.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What do you do next?",
        info:
          "A workhorse wire crosses easily. A 2.0 mm semi-compliant balloon crosses but keeps a fixed waist at its rated burst pressure.",
        options: [
          {
            text: "Image the lesion with OCT or IVUS to characterise the calcium before choosing a device.",
            best: true,
            feedback:
              "Correct. A catheter has crossed, so imaging can give arc, thickness, length and reference size, which decide the modification device.",
            next: "s2",
          },
          {
            text: "Try a 2.5 mm NC balloon at high pressure first.",
            acceptable: true,
            feedback:
              "Reasonable: an NC balloon is the proper test of a calcified lesion. But imaging now would tell you whether it is likely to work and size every later device.",
            next: "s2",
          },
          {
            text: "Inflate the semi-compliant balloon well above its rated burst pressure.",
            feedback:
              "Semi-compliant balloons dog-bone in calcium; exceeding rated burst pressure risks rupture, dissection and perforation.",
            next: "s2",
          },
          {
            text: "Deploy a 3.0 mm DES and post-dilate at high pressure.",
            feedback:
              "If a balloon cannot expand the lesion, a stent will not. This produces a permanently underexpanded stent with high thrombosis and restenosis risk.",
            next: "s1-stent-undilated", stateDelta: {"stability": -20, "flags": ["underexpanded"]} },
        ],
      },
      {
        id: "s2",
        prompt: "Calculate the OCT calcium score and choose the modification strategy.",
        info:
          "OCT (after a small balloon partially opened the lumen): maximum calcium arc 300°, maximum thickness 1.0 mm, calcified length 12 mm; no nodule. Distal reference lumen about 2.9 mm, external elastic membrane about 3.2 mm.",
        options: [
          {
            text: "Score 4: intravascular lithotripsy with a 3.0 mm balloon.",
            best: true,
            feedback:
              "Correct. Arc >180° (2) + thickness >0.5 mm (1) + length >5 mm (1) = 4, predicting underexpansion. IVL sized 1:1 to the reference fractures thick calcium, and the lesion is now crossable.",
            next: "s3",
          },
          {
            text: "Score 4: rotational atherectomy with a 1.5 mm burr.",
            acceptable: true,
            feedback:
              "A reasonable alternative (burr-to-artery ratio about 0.5) for thick superficial calcium, especially if an IVL balloon would not cross. It carries more slow-flow risk, which matters with her kidney function.",
            next: "s3",
          },
          {
            text: "Score 2: a cutting balloon is enough.",
            feedback:
              "The score is miscalculated: the arc alone scores 2, and thickness and length add one each. Cutting balloons rarely crack 1 mm thick, near-circumferential calcium.",
            next: "s3",
          },
          {
            text: "Score 4: very-high-pressure balloon taken to the highest pressure available.",
            feedback:
              "Very-high-pressure balloons help residual resistance, but with thick near-circumferential calcium a rupture at extreme pressure risks dissection or perforation. Fracture the calcium first.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "What do you do?",
        info:
          "During the first lithotripsy cycle at low pressure, ventricular ectopic beats coincide with the pulses. BP 132/68 mmHg; she has no chest pain.",
        options: [
          {
            text: "Continue while watching rhythm and pressure; pulse-synchronous ectopy is recognised and usually benign.",
            best: true,
            feedback:
              "Correct. Ectopy timed with lithotripsy pulses is a known, usually harmless phenomenon. Keep the rhythm and pressure on screen.",
            next: "s4",
          },
          {
            text: "Abandon lithotripsy and switch to atherectomy.",
            feedback: "There is no reason to abandon an effective device for a benign phenomenon.",
            next: "s3-switched-rota", stateDelta: {"stability": -5} },
          {
            text: "Give an antiarrhythmic bolus.",
            feedback: "Not indicated: the ectopy is pulse-synchronous and the patient is stable.",
            next: "s4",
          },
          {
            text: "Deflate and wait 10 minutes before continuing.",
            feedback: "Unnecessary delay; the ectopy stops when pulses stop and does not need a pause.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "How do you stent?",
        info:
          "After lithotripsy along the lesion, a 3.0 mm NC balloon expands fully at high pressure with no waist. OCT shows two calcium fractures.",
        options: [
          {
            text: "3.0 mm DES sized to the distal reference, covering normal to normal, NC post-dilatation (3.5 mm proximally) and an OCT check.",
            best: true,
            feedback:
              "Correct. The lesion is now proven expandable. Size to the distal reference, optimise proximally and confirm expansion on imaging.",
            next: "s5",
          },
          {
            text: "2.5 mm DES to be safe in a calcified vessel.",
            feedback: "Undersizing guarantees a small minimal stent area and higher restenosis risk; modification was done precisely so you could size properly.",
            next: "s5",
          },
          {
            text: "3.5 mm DES across the whole lesion at high pressure.",
            feedback: "Oversized for the 3.0 mm distal vessel, risking distal edge dissection or rupture. Use POT-style proximal optimisation instead.",
            next: "s5",
          },
          {
            text: "Drug-coated balloon alone.",
            feedback:
              "DCB-only strategies are used in small vessels and ISR, but in a 3 mm vessel with severe calcium a stent is the standard approach.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "What is your final decision?",
        info:
          "OCT: minimal stent area 5.8 mm², 86% of the average reference lumen area, well apposed. A small intimal edge dissection at the distal edge, short and confined to a narrow arc, with TIMI 3 flow.",
        options: [
          {
            text: "Accept the result.",
            best: true,
            feedback:
              "Correct. Expansion exceeds 80% of the reference and the absolute area target. A small, non-flow-limiting intimal edge dissection does not need treatment.",
          },
          {
            text: "Add another stent to cover the edge dissection.",
            feedback: "Unnecessary metal: minor intimal edge dissections with normal flow heal without treatment.", next: "s5-extra-stent", stateDelta: {"stability": -5} },
          {
            text: "Post-dilate the distal edge with a 3.5 mm balloon.",
            feedback: "This could extend the dissection and injure the smaller distal vessel.",
          },
          {
            text: "Post-dilate at high pressure throughout to reach 100% expansion.",
            feedback: "Targets are already met; chasing 100% raises the risk of edge injury without proven benefit.",
          },
        ],
      },
      {
        "id": "s1-stent-undilated",
        "kind": "consequence",
        "info": "The stent deploys with a fixed waist; post-dilatation at 24 atm leaves the minimal stent area well below half the reference.",
        "prompt": "The stent is underexpanded over undilatable calcium. What now?",
        "options": [
          {
            "text": "Image, then use intravascular lithotripsy inside the stent and high-pressure NC post-dilatation",
            "best": true,
            "feedback": "Lithotripsy can fracture calcium behind struts; the lesion should have been prepared first.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Inflate a semi-compliant balloon at very high pressure",
            "feedback": "Semi-compliant balloons dog-bone and rupture, injuring the edges.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Place a second stent inside to add radial strength",
            "feedback": "More metal does not crack calcium.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
      {
        "id": "s3-switched-rota",
        "kind": "consequence",
        "info": "You prepare rotational atherectomy. The burr must now pass a lesion already partly treated, and the team asks about the plan.",
        "prompt": "Was abandoning lithotripsy necessary?",
        "options": [
          {
            "text": "No: pulse-synchronous ectopy is benign; resume lithotripsy with rhythm and pressure monitoring",
            "best": true,
            "feedback": "Recognised benign ectopy does not require a change of device.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Yes: ectopy during lithotripsy means the device is dangerous",
            "feedback": "The ectopy is mechanically triggered and stops with the pulses.",
            "stateDelta": {
              "stability": -5
            }
          },
          {
            "text": "Give an antiarrhythmic and then use both devices",
            "feedback": "No antiarrhythmic is needed, and combining devices adds risk.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s5-extra-stent",
        "kind": "consequence",
        "info": "A second stent is placed for the short intimal edge flap. It extends into a smaller distal segment with a new edge step.",
        "prompt": "What is the lesson?",
        "options": [
          {
            "text": "A small non-flow-limiting edge dissection with a well-expanded stent can be left; more metal creates new edges",
            "best": true,
            "feedback": "Minor edge dissections are usually benign when flow is normal.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Always cover any dissection seen on imaging",
            "feedback": "Imaging finds small flaps that do not need treatment.",
            "stateDelta": {
              "stability": -5
            }
          },
          {
            "text": "Post-dilate the new distal edge at high pressure",
            "feedback": "This risks a new, larger dissection in the small segment.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "The patient was angina-free at follow-up. Kidney function was unchanged after a contrast-sparing, imaging-guided procedure.",
    outcomeVariants: [
      {
        "flag": "underexpanded",
        "text": "Stenting before preparing the calcium left an underexpanded stent that needed rescue lithotripsy."
      }
    ],
    learningPoints: [
      "A balloon that will not expand is a stop sign for stenting.",
      "Imaging (OCT calcium score) converts 'calcified' into a specific modification plan.",
      "IVL is sized 1:1 and pulse-synchronous ectopy is usually benign.",
      "Prove modification with a fully expanded 1:1 NC balloon before stenting.",
      "Accept a result that meets expansion targets; small intimal edge dissections need no treatment.",
    ],
    refs: ["fujino-calcium-2018", "disrupt-cad3-2020", "eapci-imaging-2018", "supplied-medmastery", "barbato-rota-consensus-2015"],
  },
  {
    id: "cx-case-rca-cto",
    title: "RCA CTO with an ambiguous proximal cap",
    trackId: "pci-complex",
    stage: 5,
    provenance: { kind: "synthetic" },
    summary:
      "Set-up with dual injection, choosing a primary retrograde strategy for an ambiguous cap, reverse CART and externalisation, recognising donor-vessel compromise, and sizing the recanalised vessel.",
    presentation:
      "A 59-year-old man has had CCS class III angina for 8 months despite three antianginal drugs. He has no history of infarction. Cardiac MRI shows inferior hypokinesia with late gadolinium enhancement involving less than a quarter of the wall thickness and an inducible inferior perfusion defect. LVEF 52%, eGFR 80 mL/min/1.73 m².",
    findings: [
      "Angiography 3 months ago: proximal RCA occlusion; LAD and LCx with mild disease only.",
      "SYNTAX score 11.",
      "Heart team: elective CTO PCI by the CTO operator; CABG not favoured for single-vessel disease.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "How do you set up the procedure?",
        options: [
          {
            text: "Dual arterial access with a guide in each coronary; dual injection starting with the LAD, low magnification and long acquisition.",
            best: true,
            feedback:
              "Correct. Dual injection shows the proximal cap and the collateral-filled distal RCA together. Starting the donor first lets slower collateral filling coincide with antegrade filling.",
            next: "s2",
          },
          {
            text: "Dual injection starting with the RCA, panning to follow the collaterals.",
            acceptable: true,
            feedback:
              "Dual injection is right, but the donor should be injected first, and panning makes late collateral filling harder to read. Keep the field still at low magnification.",
            next: "s2",
          },
          {
            text: "A single guide in the RCA; inject the RCA and start wiring the stump.",
            feedback:
              "Without contralateral injection the distal vessel, distal cap and collaterals are invisible, and you cannot confirm wire position. This is how perforations happen.",
            next: "s1-single-injection", stateDelta: {"stability": -10} },
          {
            text: "A single guide in the LAD to show the collaterals, then switch it to the RCA.",
            feedback: "Sequential single injections never show the proximal and distal caps at the same time and leave you without contralateral guidance while wiring.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "What is your initial crossing strategy?",
        info:
          "Dual injection: the proximal RCA ends at a large RV branch and the entry into the occlusion is not visible (ambiguous proximal cap). Occlusion length about 30 mm. The distal RCA is good-sized (about 3 mm) with the crux bifurcation 2 cm beyond the distal cap. Two septal collaterals from the LAD reach the posterior descending artery; one is large and moderately tortuous. J-CTO score 3.",
        options: [
          {
            text: "Primary retrograde approach via the large septal collateral.",
            best: true,
            feedback:
              "Correct. An ambiguous proximal cap with a usable septal collateral and a good distal vessel favours retrograde. Septal channels are the safer retrograde route.",
            next: "s3",
          },
          {
            text: "IVUS from the RV branch to locate the proximal cap, then antegrade wiring.",
            acceptable: true,
            feedback:
              "A recognised way to resolve an ambiguous cap, and it may succeed. With a good septal collateral available, retrograde is usually more efficient for a 30 mm occlusion.",
            next: "s3",
          },
          {
            text: "Antegrade wire escalation with a stiff tapered wire aimed at the presumed cap.",
            feedback:
              "Aiming a stiff wire at a cap you cannot see risks perforation or subintimal entry in the wrong place, often at the RV branch.",
            next: "s2-antegrade-exit", stateDelta: {"stability": -15} },
          {
            text: "Abandon and refer for CABG.",
            feedback: "The heart team chose CTO PCI and a safe retrograde route exists; an ambiguous cap is a reason to change strategy, not to abandon.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "What is the next step?",
        info:
          "A soft polymer-jacketed wire crosses the septal collateral with microcatheter support; the microcatheter follows into the distal RCA. Retrograde wire escalation does not penetrate the distal cap. From the antegrade side, a knuckled wire has been advanced into the subintimal space of the occluded segment and overlaps the retrograde wire.",
        options: [
          {
            text: "Reverse CART: inflate an antegrade balloon, sized with IVUS, in the subintimal space and steer the retrograde wire into it and on to the antegrade guide.",
            best: true,
            feedback:
              "Correct. The antegrade balloon creates a shared space where the two wires overlap; the retrograde wire then crosses into the proximal true lumen.",
            next: "s4",
          },
          {
            text: "Advance a guide extension in the RCA to shorten the distance, then perform reverse CART.",
            acceptable: true,
            feedback:
              "A useful adjunct that can make reverse CART easier, though reverse CART itself is the key step.",
            next: "s4",
          },
          {
            text: "Keep escalating to stiffer retrograde wires.",
            feedback:
              "Persisting with a failing technique wastes time, contrast and radiation; the hybrid approach changes strategy when progress stalls.",
            next: "s4",
          },
          {
            text: "Inject contrast antegradely to see where the knuckle is.",
            feedback:
              "Antegrade injection after entering the subintimal space expands the haematoma and compresses the distal true lumen. Use the retrograde injection or IVUS instead.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "The retrograde wire enters the antegrade guide. How do you establish a rail?",
        options: [
          {
            text: "Trap the wire in the antegrade guide, advance the retrograde microcatheter into the guide, exchange for a long externalisation wire and externalise it.",
            best: true,
            feedback:
              "Correct. The microcatheter protects the collateral, and the externalised wire provides a strong rail for antegrade devices.",
            next: "s5",
          },
          {
            text: "Advance an antegrade wire along the retrograde wire into the distal true lumen and treat from the antegrade side.",
            acceptable: true,
            feedback:
              "Feasible when the antegrade wire follows easily (a 'rendezvous'), avoiding externalisation, but externalisation is the more reliable rail.",
            next: "s5",
          },
          {
            text: "Pull the retrograde microcatheter back into the LAD guide to tidy up.",
            feedback: "Withdrawing the microcatheter loses collateral protection and the route you just created.",
            next: "s5",
          },
          {
            text: "Deliver balloons and stents retrogradely from the LAD side.",
            feedback: "Retrograde device delivery through a septal channel is rarely appropriate and risks collateral injury.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "What is your immediate action?",
        info:
          "During balloon dilatation over the externalised wire the patient reports chest pain. The LAD guide pressure is damped and the guide has been drawn deep into the LAD. Procedure time 2 h 20 min, air kerma 3.1 Gy, contrast 210 mL.",
        options: [
          {
            text: "Release tension on the externalised wire, back the LAD guide out, and inject the LAD to look for dissection or thrombus.",
            best: true,
            feedback:
              "Correct. Traction on an externalised wire strains the collateral and can injure the donor-artery ostium, risking donor-vessel dissection and ischaemia. Protecting the donor vessel protects both territories.",
            next: "s6",
          },
          {
            text: "Ignore it: the pain is from the RCA balloon inflation.",
            feedback: "Damping in the donor guide is a warning sign. Assume the donor vessel is in trouble until proven otherwise.",
            next: "s5-donor-ignored", stateDelta: {"stability": -25, "flags": ["donor-ischaemia"]} },
          {
            text: "Pull the retrograde microcatheter out of the collateral quickly.",
            feedback: "Uncontrolled removal can injure the collateral and loses the externalised rail; first release tension and back out the guide.",
            next: "s6",
          },
          {
            text: "Give a bolus of GP IIb/IIIa inhibitor.",
            feedback: "There is no evidence of thrombus yet. The problem is mechanical: the guide position.",
            next: "s6",
          },
        ],
      },
      {
        id: "s6",
        prompt: "How do you complete the procedure?",
        info:
          "With the guide backed out, LAD angiography is normal and the pain settles. IVUS after intracoronary nitrate: distal RCA external elastic membrane about 3.2 mm, proximal about 4.0 mm; the wire is in the vessel architecture throughout.",
        options: [
          {
            text: "Stent from the distal landing zone to the proximal RCA, sized to IVUS, without extending into the small PDA; then check the LAD and the septal collateral before removing the last wire.",
            best: true,
            feedback:
              "Correct. IVUS sizes the underfilled distal vessel properly; avoid running stents into small run-off; and always inspect the donor vessel and collateral before finishing.",
          },
          {
            text: "Size stents to the angiographic distal lumen of about 2.25 mm.",
            feedback: "The distal vessel looks small because it has been underfilled for months; sizing to it undersizes the stent.",
          },
          {
            text: "Stent all the way into the PDA and posterolateral branch to cover every irregularity.",
            feedback: "A full metal jacket into small branches with limited run-off invites stent thrombosis.",
          },
          {
            text: "Balloon angioplasty only and finish.",
            feedback: "A recanalised CTO without stenting has a high reocclusion rate; stent the occluded segment.",
          },
        ],
      },
      {
        "id": "s2-antegrade-exit",
        "kind": "consequence",
        "info": "The stiff tapered wire advances into a side branch of the RV branch and leaves a small contrast stain outside the vessel.",
        "prompt": "The wire has exited. What now?",
        "options": [
          {
            "text": "Withdraw the wire, check for extravasation and effusion, and change to a primary retrograde strategy",
            "best": true,
            "feedback": "With an ambiguous cap, blind antegrade escalation is hazardous; the retrograde route was the right primary choice.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Keep escalating to a stiffer antegrade wire at the same point",
            "feedback": "Stiffer wires at an unknown cap make further exits likely.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Follow with a microcatheter to see where the wire went",
            "feedback": "Advancing over an exited wire enlarges the perforation.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s5-donor-ignored",
        "kind": "consequence",
        "info": "Five minutes later: 3 mm anterior ST elevation, BP 78/44 mmHg and a damped LAD guide trace.",
        "prompt": "The donor LAD is ischaemic. What now?",
        "options": [
          {
            "text": "Release tension, back the LAD guide out, inject to assess for dissection or thrombus, and treat the donor vessel immediately",
            "best": true,
            "feedback": "Donor-vessel compromise threatens the whole collateral-dependent territory and must be fixed first.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Finish the RCA quickly and then look at the LAD",
            "feedback": "Every minute of donor ischaemia risks arrest.",
            "stateDelta": {
              "stability": -20
            }
          },
          {
            "text": "Give a vasopressor and continue",
            "feedback": "Supporting pressure without fixing the cause is futile.",
            "stateDelta": {
              "stability": -15
            }
          }
        ]
      },
      {
        "id": "s1-single-injection",
        "kind": "consequence",
        "info": "The RCA-only injection shows the proximal stump but none of the distal vessel or collaterals.",
        "prompt": "You cannot see the target. What do you do?",
        "options": [
          {
            "text": "Place a second guide in the left system and perform a dual injection, starting the LAD first, with a long acquisition",
            "best": true,
            "feedback": "Dual injection shows the cap, the occlusion length and the distal target together.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Start wiring towards where the distal vessel probably is",
            "feedback": "Wiring without seeing the target is how exits and perforations happen.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Inject more contrast into the RCA",
            "feedback": "Antegrade injection cannot fill a collateral-supplied distal vessel.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
    ],
    outcome:
      "Final angiography showed TIMI 3 flow in the RCA, a normal LAD and an intact septal collateral. Contrast and radiation stayed within stopping thresholds. His angina resolved over the following weeks.",
    outcomeVariants: [
      {
        "flag": "donor-ischaemia",
        "text": "Ignoring the damped donor guide caused prolonged anterior ischaemia during the CTO procedure."
      }
    ],
    learningPoints: [
      "CTO PCI is planned electively for symptoms in a viable territory.",
      "Dual injection is mandatory: donor first, low magnification, long acquisition.",
      "An ambiguous proximal cap with a good septal collateral favours a retrograde strategy.",
      "Reverse CART and externalisation connect the two sides; keep tension low on the externalised wire.",
      "Watch the donor guide and check the donor vessel and collateral before finishing.",
      "Size the recanalised vessel with IVUS after nitrate; avoid stenting into poor run-off.",
    ],
    refs: ["cto-consensus-2019", "brilakis-manual-cto", "jcto-2011", "euro-cto-2018", "supplied-eh-views", "ungureanu-portal-techniques-2025"],
  },
  {
    id: "cx-case-degenerated-svg",
    title: "Degenerated vein graft with high no-reflow risk",
    trackId: "pci-complex",
    stage: 4,
    provenance: { kind: "synthetic" },
    summary:
      "Choosing the culprit target after CABG, embolic protection, stenting technique to limit embolisation, recognising a full filter with slow flow, and planning beyond the graft.",
    presentation:
      "A 74-year-old man had CABG 14 years ago (LIMA to LAD, SVG to OM, SVG to RCA). He is admitted with NSTEMI after 3 hours of rest pain, now settled; troponin is rising and the ECG shows inferior T-wave inversion. LVEF 45%. He has received antiplatelet and anticoagulant therapy per the ACS protocol.",
    findings: [
      "LIMA to LAD patent with good run-off.",
      "SVG to OM chronically occluded (already occluded on an angiogram 4 years ago).",
      "SVG to RCA diffusely degenerated, with a bulky, hazy 90% mid-body lesion and a straight 4 cm segment beyond it before the distal anastomosis; graft diameter about 4.0 mm.",
      "Native RCA occluded proximally; native LCx with diffuse moderate disease.",
      "BP 142/80 mmHg, heart rate 72 bpm, pain-free.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which lesion do you treat?",
        options: [
          {
            text: "The SVG to RCA mid-body lesion, the likely culprit.",
            best: true,
            feedback:
              "Correct. The hazy, bulky lesion in the graft supplying the inferior territory fits the presentation and ECG; in an acute presentation the culprit is treated.",
            next: "s2",
          },
          {
            text: "Recanalise the chronically occluded SVG to OM.",
            feedback: "Chronically occluded vein grafts should not be recanalised: low success, high embolic risk and poor durability. It is also not the culprit.",
            next: "s1-occluded-graft", stateDelta: {"stability": -10} },
          {
            text: "Attempt the native RCA CTO now instead of the graft.",
            feedback:
              "Native-vessel-first thinking is right for elective planning, but an ad hoc CTO procedure during an NSTEMI, with a treatable culprit graft lesion, is not appropriate.",
            next: "s2",
          },
          {
            text: "Medical therapy alone.",
            feedback: "He has an NSTEMI with a severe, likely culprit lesion; revascularisation of the culprit is indicated.",
            next: "s2",
          },
        ],
      },
      {
        id: "s2",
        prompt: "How do you protect against distal embolisation?",
        info: "A guide is engaged coaxially in the SVG to RCA.",
        options: [
          {
            text: "Deploy a distal filter in the straight segment beyond the lesion, and give an intragraft vasodilator before stenting.",
            best: true,
            feedback:
              "Correct. A degenerated body lesion with a good landing zone is the ideal setting for a filter, and pretreating the microcirculation reduces no-reflow.",
            next: "s3",
          },
          {
            text: "Use a proximal occlusion device, if available.",
            acceptable: true,
            feedback:
              "A valid alternative, particularly without a distal landing zone, but availability is limited and a filter suits this anatomy well.",
            next: "s3",
          },
          {
            text: "No protection; give a GP IIb/IIIa inhibitor instead.",
            feedback: "GP IIb/IIIa inhibitors have not shown consistent benefit in SVG PCI and do not capture atheromatous debris.",
            next: "s2-no-protection", stateDelta: {"stability": -15, "flags": ["slow-flow"]} },
          {
            text: "Routine thrombus aspiration, then stent without protection.",
            feedback: "Aspiration does not remove friable atheroma reliably, and routine aspiration is not recommended. It is not a substitute for protection.",
            next: "s3",
          },
        ],
      },
      {
        id: "s3",
        prompt: "How do you stent?",
        options: [
          {
            text: "Direct stenting with a DES slightly smaller than the graft (3.5 mm), avoiding aggressive post-dilatation.",
            best: true,
            feedback:
              "Correct. Each inflation of friable plaque releases debris. Direct stenting with modest sizing and minimal post-dilatation limits embolisation.",
            next: "s4",
          },
          {
            text: "Direct stenting with a 4.0 mm DES, post-dilating gently only if clearly underexpanded.",
            acceptable: true,
            feedback: "Reasonable, but sizing slightly below the graft reference further reduces barotrauma in a degenerated graft.",
            next: "s4",
          },
          {
            text: "Pre-dilate with a 3.0 mm balloon, then a 4.0 mm stent and 4.5 mm NC post-dilatation at high pressure.",
            feedback: "Multiple and oversized inflations maximise embolisation and no-reflow risk.",
            next: "s2-no-protection", stateDelta: {"stability": -20, "flags": ["slow-flow"]} },
          {
            text: "Cutting balloon first to 'debulk' the plaque.",
            feedback: "Cutting a soft, friable vein-graft plaque releases debris and has no role here.",
            next: "s4",
          },
        ],
      },
      {
        id: "s4",
        prompt: "What is your immediate step?",
        info:
          "After stent deployment, flow slows to TIMI 1. The filter basket looks full, with contrast stagnating just proximal to it. He has chest pain and 1.5 mm inferior ST elevation. BP 118/70 mmHg.",
        options: [
          {
            text: "Aspirate the stagnant column above the filter with an aspiration catheter, then retrieve the filter, and give an intragraft vasodilator distally.",
            best: true,
            feedback:
              "Correct. A full filter blocks flow; aspirating the column first prevents the debris showering downstream during retrieval. Further no-reflow management is covered in the complications track.",
            next: "s5",
          },
          {
            text: "Post-dilate the stent at high pressure to improve flow.",
            feedback: "The problem is debris and microvascular obstruction, not stent expansion. More inflation adds more debris.",
            next: "s5",
          },
          {
            text: "Pull the filter straight back through the stent without aspirating.",
            feedback: "Retrieving a full filter without aspirating the stagnant column can release debris into the distal bed.",
            next: "s4-filter-stripped", stateDelta: {"stability": -15} },
          {
            text: "Leave the filter in place and wait for flow to improve.",
            feedback: "A full filter will not clear itself, and ischaemia continues while you wait.",
            next: "s5",
          },
        ],
      },
      {
        id: "s5",
        prompt: "How do you plan after the procedure?",
        info:
          "After aspiration and filter retrieval, TIMI 3 flow returns and the pain and ST elevation resolve. Debris is visible in the retrieved filter.",
        options: [
          {
            text: "Antiplatelet therapy per the ACS protocol and secondary prevention; if angina recurs, consider elective native RCA CTO PCI rather than further vein graft PCI.",
            best: true,
            feedback:
              "Correct. Degenerated grafts continue to fail; for future events the native vessel (even a CTO, in experienced hands) is often the more durable target.",
          },
          {
            text: "Schedule elective recanalisation of the occluded SVG to OM.",
            feedback: "Chronically occluded vein grafts should be left alone; treat the native LCx if that territory becomes symptomatic.",
          },
          {
            text: "Plan routine repeat angiography at 6 weeks.",
            feedback: "Routine surveillance angiography is not needed; reassess clinically and investigate if symptoms recur.",
          },
        ],
      },
      {
        "id": "s2-no-protection",
        "kind": "consequence",
        "info": "After stenting, flow falls to TIMI 1, contrast stagnates and the patient has chest pain with inferior ST elevation.",
        "prompt": "This is no-reflow from distal embolisation. What do you do?",
        "options": [
          {
            "text": "Exclude a mechanical cause, then give distal vasodilators (adenosine, nitroprusside or verapamil) through a microcatheter and avoid further balloon inflations",
            "best": true,
            "feedback": "Distal drug delivery is the mainstay once debris has embolised.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Post-dilate at high pressure to improve the lumen",
            "feedback": "More barotrauma releases more debris.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Give vasodilators through the guide only",
            "acceptable": true,
            "feedback": "Guide delivery may reach some of the graft but less of the microcirculation.",
            "stateDelta": {
              "stability": -5
            }
          }
        ]
      },
      {
        "id": "s4-filter-stripped",
        "kind": "consequence",
        "info": "As the full filter is pulled back through the stent, debris spills distally and flow drops to TIMI 0.",
        "prompt": "What now?",
        "options": [
          {
            "text": "Aspirate the distal graft and native vessel, give distal vasodilators, and assess flow",
            "best": true,
            "feedback": "Aspirating before filter retrieval prevents this; afterwards, aspiration and distal drugs are the rescue.",
            "stateDelta": {
              "stability": 5
            }
          },
          {
            "text": "Balloon the distal anastomosis",
            "feedback": "Ballooning embolic material makes no-reflow worse.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Finish and transfer to the ward",
            "feedback": "Leaving TIMI 0 flow means an infarct.",
            "stateDelta": {
              "stability": -20
            }
          }
        ]
      },
      {
        "id": "s1-occluded-graft",
        "kind": "consequence",
        "info": "After 40 minutes and 150 mL of contrast, the chronically occluded SVG to OM has not been crossed and the patient still has inferior ischaemia.",
        "prompt": "What should have been treated first?",
        "options": [
          {
            "text": "The culprit SVG to RCA lesion; stop working on the occluded graft and treat the culprit",
            "best": true,
            "feedback": "Chronically occluded vein grafts have poor results; the culprit comes first.",
            "stateDelta": {
              "stability": 0
            }
          },
          {
            "text": "Keep going on the occluded graft until it opens",
            "feedback": "Prolonged work on an old occluded graft adds contrast and risk without treating the culprit.",
            "stateDelta": {
              "stability": -15
            }
          },
          {
            "text": "Abandon the procedure and refer for redo CABG",
            "feedback": "The culprit is treatable now.",
            "stateDelta": {
              "stability": -10
            }
          }
        ]
      },
    ],
    outcome:
      "He was discharged on day three without further symptoms. At clinic review he remained angina-free; the heart team noted the native RCA CTO as the preferred target should symptoms return.",
    outcomeVariants: [
      {
        "flag": "slow-flow",
        "text": "Working without embolic protection, or with aggressive balloon sizing, led to slow flow and a periprocedural infarct."
      }
    ],
    learningPoints: [
      "In an acute presentation treat the culprit; in elective planning think native vessel first.",
      "Do not recanalise chronically occluded vein grafts.",
      "Use embolic protection in degenerated graft-body lesions with a landing zone.",
      "Direct stent, size modestly and avoid aggressive post-dilatation in vein grafts.",
      "A full filter with slow flow needs aspiration of the stagnant column before retrieval.",
    ],
    refs: ["supplied-medmastery", "supplied-eh-views", "esc-acs-2023", "esc-revasc-2018", "brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------
export const pciComplex: Track = {
  id: "pci-complex",
  order: 5,
  title: "Complex PCI",
  tagline: "Bifurcation, left main, calcium, CTO, grafts and thrombus",
  description:
    "Plan and perform complex coronary intervention: bifurcation and left main stenting, calcium modification, chronic total occlusions, vein grafts and thrombus, special lesion subsets and complex high-risk indicated PCI. Prevention and recognition of complications are taught here; their management is in the complications track.",
  stage: 4,
  modules: [bifurcation, leftMain, calcium, cto, graftsThrombus, special, highRisk],
  cases,
};
