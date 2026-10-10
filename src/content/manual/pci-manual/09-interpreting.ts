// Module pm-interpreting: interpreting the angiogram (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.5, 3.2, 5.7, 6.3, 6.6, 6.8, 7.2, 9.2-9.8, 10.2, 12.1, 12.3,
// 15.1, 18.5, 19, 20.7, 20.8, 21 (whole chapter), 22.1, 22.3, 25.2, 30.3; Oxford Handbook of Cardiac
// Catheterization and Coronary Intervention, chapters 1, 5, 6, 7 and 8.
// Every claim is listed with its page in docs/curriculum/evidence/pm-interpreting.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-interpreting",
  title: "Interpreting the angiogram",
  stage: 2,
  summary:
    "How to read a coronary angiogram so that the report can be trusted: grading a stenosis by eye and with QCA, grading flow with TIMI grades, frame counts and myocardial blush, avoiding the pitfalls that hide or invent lesions, describing thrombus, calcium, dissection and aneurysm, recognising and grading collaterals, telling spasm from fixed disease, and finding anomalous arteries, fistulae and myocardial bridges.",
  objectives: [
    "Calculate percentage diameter stenosis from a measured minimal lumen diameter and an averaged reference, choose the frames that make the estimate valid, and state the thresholds each manual uses for significance.",
    "Explain from the FAME data why visual grading misjudges functional severity even in the 70–90% band, and when to add QCA, a pressure wire or intravascular imaging.",
    "Assign TIMI flow grades against a fair comparison bed, explain the corrected TIMI frame count and the myocardial blush grade, and work through the causes of poor opacification and slow flow.",
    "Recognise the pitfalls of foreshortening, overlap, underfilling, deep and super-selective engagement, missed territories, competitive graft flow and wire-induced pseudolesions.",
    "Grade thrombus (TIMI thrombus grade), calcium (angiographic and imaging definitions), dissection (NHLBI A–F) and dilatation (aneurysm and ectasia), and describe ostial, bifurcation and tortuous lesions in the manual's terms.",
    "Film and grade collaterals (Rentrop and Werner), read what they say about the age of an occlusion, and assess a chronic total occlusion's four angiographic features.",
    "Distinguish catheter-tip, wire-induced, drug-induced and spontaneous spasm from fixed disease, and give intracoronary nitrate safely.",
    "Find and engage anomalous coronary arteries, recognise the missing circumflex and the dot sign, and describe fistulae and myocardial bridges with their management.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-stenosis",
      title: "Grading a stenosis: by eye, by calculation and with QCA",
      minutes: 14,
      topics: ["dx-stenosis-grading"],
      sources: [
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
        { book: "oxford-cath", loc: "ch 6: Tips for interpretation" },
        { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 1: Indications for coronary angiography" },
      ],
      refs: [...BOOKS, "tonino-fame-angio-2010", "li-ivus-length-2021", "park-lm-ivus-2014"],
      blocks: [
        {
          kind: "p",
          text: "Oxford calls coronary angiography ‘lumenography’: it shows the shadow of the contrast column inside the artery and nothing of the wall. Grading a stenosis therefore means comparing the narrowest part of that shadow with what the artery ought to measure at that point. The Academy lesson on grading gave the formulas and the visual categories. This lesson works through the reading as a sequence of decisions, adds the rules each manual uses, and shows where the eye and the computer both go wrong.",
        },
        { kind: "h", text: "The reading, one step at a time" },
        {
          kind: "steps",
          title: "Grading one lesion",
          items: [
            {
              title: "1. Pick valid frames",
              detail:
                "You need the lesion in at least two projections, ideally at right angles to each other (orthogonal), each free of overlap from other vessels or side branches and with as little foreshortening as possible. Oxford adds that, depending on where the lesion lies, separate views may be needed for its proximal and distal limits. Brilakis's orthogonal set for each artery and graft, and Oxford's rule of thumb (caudal tilt for proximal segments, cranial tilt for distal ones), are taught in the projections lesson of the acquiring module (pm-acquiring).",
            },
            {
              title: "2. Find the reference",
              detail:
                "The reference is the nearest segment that looks angiographically normal. Brilakis measures a reference diameter on each side of the lesion, proximal and distal, and uses their average.",
            },
            {
              title: "3. Measure the minimal lumen diameter (MLD)",
              detail: "The narrowest diameter of the contrast column within the lesion, in the same frame.",
            },
            {
              title: "4. Calculate",
              detail: "Percentage diameter stenosis is 100 × (1 − MLD ÷ average reference diameter). The formula is below.",
            },
            {
              title: "5. Report the worst view",
              detail:
                "Brilakis reports the projection in which the narrowing looks most severe and is least foreshortened. An eccentric lesion can look tight from one angle and almost normal from another (his Fig 6.3; Oxford Fig 6.17), so averaging two views understates it.",
            },
            {
              title: "6. Measure the length",
              detail: "In millimetres, from the proximal ‘normal’ reference segment to the distal one, in a view that does not foreshorten the segment.",
            },
            {
              title: "7. Describe the neighbourhood",
              detail:
                "For PCI the angiogram has to define more than severity: Oxford lists the lesion length, the reference diameter on either side, and the features that make the procedure complex, such as nearby side branches, tortuosity, calcium and thrombus. Those descriptors are taught in the lesion morphology lesson of this module.",
            },
          ],
        },
        {
          kind: "formula",
          name: "Percentage diameter stenosis (Brilakis Fig 6.2)",
          expr: "%DS = 100 × [1 − MLD ÷ ((proximal reference + distal reference) ÷ 2)]",
          note: "MLD = minimal lumen diameter. Using only the proximal reference overstates a lesion in a tapering vessel; using only the distal one understates it.",
        },
        {
          kind: "check",
          stem: "In a mid LAD lesion the proximal reference measures 3.4 mm, the distal reference 2.6 mm and the minimal lumen diameter 0.9 mm. Using Brilakis's averaged reference, what is the diameter stenosis?",
          options: ["About 65%", "About 70%", "About 74%", "About 30%"],
          answer: 1,
          explanation:
            "The average reference is (3.4 + 2.6) ÷ 2 = 3.0 mm, so the stenosis is 100 × (1 − 0.9 ÷ 3.0) = 70%. Using the proximal reference alone gives about 74% and the distal alone about 65%, which is why the method matters when a vessel tapers. 30% is the fraction of the reference diameter that remains, not the stenosis.",
        },
        { kind: "h", text: "Where each manual draws the line" },
        {
          kind: "table",
          caption: "Thresholds for an angiographically significant stenosis",
          head: ["Source", "Vessels other than the left main", "Left main", "What else it says"],
          rows: [
            [
              "Brilakis 6.8",
              "A diameter stenosis of 70%–90% or more is regarded as significant",
              "50% or more",
              "Percentage stenosis alone has limitations as a guide to haemodynamic severity (his Fig 6.4); physiology is preferred to decide whether to intervene, but not in the culprit lesion of an acute coronary syndrome",
            ],
            [
              "Oxford ch 6",
              "Above 70% diameter, which corresponds to roughly 90% area, in an epicardial vessel",
              "Above 50%",
              "Lesions generally become flow-limiting only beyond 70% diameter or 90% area. Because visual estimates are imprecise, some operators simply call lesions mild (30% or less), moderate (30–70%) or severe (above 70%)",
            ],
          ],
        },
        {
          kind: "p",
          text: "Why does Brilakis insist that percentage stenosis is not enough? His Fig 6.4 reproduces the FAME analysis by Tonino and colleagues. In the FFR-guided arm, 1,329 lesions were graded by eye before the pressure wire was used. Of those called 50–70%, **35%** had an FFR of 0.80 or less; of those called 71–90%, **80%** did; of subtotal (91–99%) lesions, **96%** did. Of 509 patients with multivessel disease on the angiogram, only 235 (46%) had two or more vessels with an FFR of 0.80 or less. The lesson is that the eye misclassifies not only intermediate lesions but also one in five lesions in the 71–90% band.",
        },
        {
          kind: "check",
          stem: "A man with stable angina and no prior functional test has a mid LAD lesion that you estimate at 75% in two views. Which statement is best supported by the manuals?",
          options: [
            "It exceeds 70%, so by Oxford's rule it is flow-limiting and can be stented without further assessment",
            "A 75% diameter stenosis is always a 94% area stenosis, so ischaemia in this territory can be taken as certain",
            "QCA of the same frames will settle the question, because it measures flow across the lesion as well as diameter",
            "About one in five lesions graded 71–90% by eye in FAME had an FFR above 0.80, so physiology is preferred before deciding",
          ],
          answer: 3,
          explanation:
            "In the FAME analysis 80% of lesions in the 71–90% visual band were functionally significant, so 20% were not, and Brilakis prefers physiology for deciding on intervention outside an ACS culprit. Oxford's 70% figure describes when lesions generally become flow-limiting; it is not a guarantee for one lesion. The area figure assumes a circular lumen, and QCA measures the lumen outline, not flow.",
        },
        { kind: "h", text: "Why the eye is wrong" },
        {
          kind: "list",
          items: [
            "**Observer variability**, between readers and for the same reader. Oxford puts it at about ±20% for moderate lesions; mild and severe lesions are graded most accurately.",
            "**Underestimation**, by up to 50% in extreme cases (Oxford), which may be due to incomplete views or an eccentric lumen.",
            "**A diseased reference.** Atherosclerosis is diffuse, so the ‘normal’ segment may itself be narrowed and the lesion looks milder than it is. Remodelling works the other way and can make a vessel look larger than it is.",
            "**Branch points.** Brilakis notes that grading at or beyond a large side branch is hard, because the vessel's diameter changes across the bifurcation.",
            "**Foreshortening.** Oxford warns that a lesion not imaged at right angles to the beam can look both shorter and more severe.",
            "**Resolution.** Angiography separates structures only about 0.2 mm apart (Oxford).",
            "**Lumen is not physiology.** The angiographic appearance may not match the lesion's physiological effect.",
          ],
        },
        {
          kind: "table",
          caption: "Normal calibre: a sense check on your reference (Oxford, Tips for interpretation)",
          head: ["Vessel", "What to expect"],
          rows: [
            ["Proximal LAD", "Men 3.5–4.0 mm, women 3.0–3.5 mm; it narrows gradually towards the apex"],
            ["Circumflex", "Tapers too, but not until its mid portion, usually after the first obtuse marginal"],
            ["RCA", "Usually uniform in calibre until it divides at the crux"],
          ],
        },
        { kind: "h", text: "Quantitative coronary angiography (QCA)" },
        {
          kind: "steps",
          title: "Using QCA (Oxford, Quantification of stenoses)",
          items: [
            { title: "Calibrate", detail: "QCA needs a scale. It is usually calibrated against the known diameter of the catheter in the image." },
            { title: "Choose the segment", detail: "Use a frame and projection that meet the rules above: no overlap, least foreshortening, good opacification." },
            {
              title: "Let the software find the edges",
              detail: "Edge-detection algorithms outline the opacified lumen and compare the minimal lumen diameter with the reference diameter on either side.",
            },
            {
              title: "Read the outputs",
              detail:
                "Diameter stenosis, lesion length and vessel calibre are measured; area stenosis is calculated from mathematical assumptions about the lumen's shape. Most modern laboratories can run the analysis live during the case.",
            },
          ],
        },
        {
          kind: "p",
          text: "QCA does the arithmetic from the edges it detects, but the operator still chooses the frame and the reference segment, and it measures the same two-dimensional shadow, so it inherits the projection's faults: a foreshortened, overlapped or poorly filled segment gives a precise number for the wrong thing. When the angiogram leaves the severity uncertain, Oxford adds a pressure wire for physiology or intravascular imaging for anatomy. As an example of an anatomical threshold, Oxford gives a luminal area below 4 mm² on IVUS as marking a stenosis that probably causes ischaemia, in native epicardial arteries apart from the left main (the handbook prints ‘mean’ luminal area; the conventional measure is the minimal lumen area). Treat that number with caution. Later work comparing IVUS with physiology found that a single area cut-off identifies functionally significant non-left-main lesions poorly: in one study of 122 intermediate non-left-main lesions, the best minimal lumen area cut-off (3.6 mm²) gave an area under the curve of only 0.714 against angiography-derived FFR. Validated IVUS area criteria come mainly from the left main, where 4.5 mm² or less matched an FFR of 0.80 or less in isolated ostial and shaft lesions. Outside the left main, Brilakis prefers physiology to decide on intervention. How to use both tools is taught in the coronary physiology and intravascular imaging modules.",
        },
        { kind: "tip", id: "diag-interp-orthogonal-worst-view" },
        { kind: "tip", id: "pci-interp-qca-calibrate" },
        {
          kind: "pitfalls",
          items: [
            "Averaging an eccentric lesion's two views instead of reporting the worse one.",
            "Taking the reference at a branch point or in a diffusely diseased segment.",
            "Measuring length in a foreshortened view, which also makes the lesion look tighter.",
            "Grading from a poorly filled or streaming run (see the pitfalls lesson).",
            "Treating QCA as a measure of physiology, or a 70% threshold as proof of ischaemia.",
            "Forgetting to review the images after the case; Oxford calls this essential for picking up abnormalities missed during the procedure.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you accept a reference diameter, compare it with what the vessel should measure. A proximal LAD ‘reference’ well below Oxford's normal range should make you ask whether the whole vessel is diseased, in which case every percentage you calculate from it understates the problem.",
        },
        {
          kind: "cine",
          run: "p11_v16",
          showBoxes: true,
          caption: "Real right coronary run with the dataset's lesion boxes. Most keyframes box a mild lesion (CADICA label 0–20%); a second box, for the 90–98% lesion, appears only on keyframes 20 and 21. Estimate both yourself before you look at the boxes.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "estimate",
          task: "Estimate the diameter stenosis on each run, in percent, and compare with the expert category. Note how far apart your estimates and the labels are in moderate lesions.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, run QCA on the lesion in two orthogonal views: calibrate, read the minimal lumen diameter, both references and the length, and report the view in which the lesion is worse.",
        },
        { kind: "video", id: "qK2euYOpfEU", note: "Brilakis's chapter summary on how to interpret the coronary angiogram." },
        {
          kind: "keypoints",
          items: [
            "Two orthogonal views, no overlap, least foreshortening; report the worst view.",
            "%DS = 100 × (1 − MLD ÷ average of proximal and distal reference).",
            "Significant: Brilakis 70%–90% or more outside the left main and 50% or more in it; Oxford above 70% (about 90% area) and above 50% in the left main.",
            "FAME: 35% of 50–70%, 80% of 71–90% and 96% of 91–99% lesions had FFR 0.80 or less; physiology decides, except in ACS culprits.",
            "Observer variability is about ±20% in moderate lesions; diffuse disease, branch points and foreshortening all distort the estimate.",
            "QCA is calibrated on the catheter and measures the lumen outline by edge detection; it does not measure physiology, and an IVUS area cut-off is a weak substitute for physiology outside the left main.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-flow",
      title: "Flow: TIMI grade, frame count and myocardial blush",
      minutes: 14,
      topics: ["dx-timi-flow"],
      sources: [
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "9.8" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "19" },
        { book: "brilakis-pci", loc: "20.7" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 8: The no-reflow phenomenon" },
      ],
      refs: [...BOOKS, "timi-1985", "gibson-tfc-1996", "vanthof-mbg-1998", "ellis-1994"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis puts flow first in his list of what to assess in every artery and every run. It tells you whether a lesion is limiting perfusion now, whether an intervention has helped or harmed, and, in an acute syndrome, which artery is the culprit. Flow has three levels of description: the TIMI grade (a category), the TIMI frame count (a number) and the myocardial blush (the tissue).",
        },
        { kind: "h", text: "Grading TIMI flow" },
        {
          kind: "steps",
          title: "Four questions, in order",
          items: [
            {
              title: "Can this run be graded?",
              detail:
                "The artery must be fully opacified, with contrast refluxing into the aorta, and filmed until the distal bed has filled and begun to clear. A weak injection makes every vessel look slow (see the table of causes below). Keep runs no longer than the question needs: Brilakis otherwise avoids long acquisitions and prolongs them only for delayed collateral filling, and Oxford prolongs them for collaterals and blush, so lengthen a run deliberately when you need to see blush or collaterals. Once no-reflow is established, Oxford warns against repeated contrast injections into the affected artery, which worsen ischaemia.",
            },
            {
              title: "What will you compare it with?",
              detail:
                "Brilakis's definitions compare the distal bed with a bed that is not involved: the same artery proximal to the obstruction, or the opposite coronary artery.",
            },
            {
              title: "Does any contrast get past the obstruction?",
              detail: "If none does, the flow is TIMI 0. If some does, go on.",
            },
            {
              title: "Does the whole distal bed fill during the run, and how fast?",
              detail:
                "If contrast gets through but stalls and never opacifies the entire distal bed while you are filming, it is TIMI 1. If the whole bed fills but filling, clearance or both are perceptibly slower than in the comparison bed, it is TIMI 2. If filling and clearance are as brisk as in the comparison bed, it is TIMI 3.",
            },
          ],
        },
        {
          kind: "table",
          caption: "TIMI flow grades (Brilakis 6.8, Fig 6.1; in this module's words)",
          head: ["Grade", "Label", "What you see"],
          rows: [
            ["0", "No perfusion", "Contrast stops at the obstruction; nothing beyond it opacifies"],
            ["1", "Penetration without perfusion", "Contrast passes the obstruction but hangs and never fills the whole distal bed during the run"],
            ["2", "Partial perfusion", "The whole distal bed fills, but entry, clearance or both are visibly slower than in an uninvolved bed"],
            ["3", "Complete perfusion", "Entry into the distal bed is as prompt as into the proximal bed, and clearance as fast as from an uninvolved bed"],
          ],
        },
        {
          kind: "check",
          stem: "During primary PCI for an inferior STEMI, the RCA fills to its end after wiring and balloon dilatation, but contrast takes clearly longer to reach the posterolateral branches and to clear than it does in the LAD on the left injection. What is the TIMI grade?",
          options: ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3"],
          answer: 2,
          explanation:
            "The whole distal bed opacifies, so it is at least TIMI 2, and filling and clearance are perceptibly slower than in an uninvolved bed (the opposite artery), so it is not TIMI 3. TIMI 1 would mean the distal bed never fills completely during the run.",
        },
        { kind: "h", text: "The TIMI frame count: putting a number on it" },
        {
          kind: "p",
          text: "Gibson and colleagues made flow a continuous measurement by counting the cine frames contrast needs to reach standardised distal landmarks. In 78 normal arteries the LAD needed 36.2 ± 2.6 frames, about 1.7 times the mean of the RCA (20.4 ± 3.0) and circumflex (22.2 ± 4.1) counts, so LAD counts are divided by 1.7 to give the **corrected TIMI frame count**. Two injections in the same artery differed by a mean of 4.7 ± 3.9 frames. The authors present it as a simple, reproducible and objective way to standardise TIMI grades and compare trials. Because it counts frames, a count depends on the acquisition frame rate: the same transit time gives half as many frames at half the rate. The published normal values therefore apply only at the frame rate of the original study's films; a count made at any other rate has to be scaled to that rate before it is compared with them. The real runs in this app's library were recorded at 10 or 15 frames per second, so their raw counts cannot be set against the published normals.",
        },
        { kind: "h", text: "Myocardial blush: perfusion of the muscle" },
        {
          kind: "p",
          text: "An open epicardial artery does not guarantee that the muscle is perfused. When contrast passes through the microcirculation of perfused myocardium, the territory briefly becomes denser and then clears: the myocardial blush. Oxford expects the downstream myocardium to blush after injection into an unobstructed vessel, and uses the absence of blush after PCI as part of the diagnosis of no-reflow. Van 't Hof and colleagues graded blush in 777 patients after primary angioplasty as 0 (none), 1 (minimal), 2 (moderate) or 3 (normal). Mortality over a mean of 1.9 years was 3%, 6% and 23% for grades 3, 2 and 0/1, and blush grade predicted long-term mortality independently of TIMI flow, Killip class and ejection fraction. To grade blush you have to keep filming: Oxford asks for prolonged acquisition for blush and collaterals. The manuals differ on panning: Oxford has the radiographer pan to follow the distal vessels, whereas Brilakis pans only when needed because panning degrades the image, above all in dual-injection runs (see the acquiring module).",
        },
        {
          kind: "table",
          caption: "Three different ‘blushes’ in the cath lab",
          head: ["Term", "Meaning", "Source"],
          rows: [
            ["Myocardial blush grade", "Tissue perfusion after reperfusion, graded 0–3; normal blush is reassuring", "Van 't Hof 1998; Oxford ch 8"],
            ["Ellis class 2 perforation", "A pericardial or myocardial blush without an exit hole of 1 mm or more: contrast outside the vessel", "Brilakis 6.8; Ellis 1994"],
            ["Conus injection blush", "Contrast forced into the small conus branch accumulates in the myocardium and can trigger ventricular fibrillation", "Oxford ch 6, Catheter manipulation"],
          ],
        },
        { kind: "h", text: "When flow looks poor: find the cause" },
        {
          kind: "table",
          head: ["Cause", "Clue", "What the manuals do"],
          rows: [
            [
              "Underfilling that only looks like poor flow",
              "Every vessel looks faint; no reflux into the aorta. Brilakis lists small (especially 4 Fr) and side-hole catheters, large or ectatic arteries, poor engagement, high-flow states (severe aortic stenosis, hypertrophic obstructive or dilated cardiomyopathy, arteriovenous fistula), viscous iso-osmolar contrast, a weak injection and a high LV end-diastolic pressure",
              "Larger lumen (a guide or a bigger diagnostic catheter), no side holes, a stronger injection (manual if there is slight damping). If the artery still cannot be filled, call the study non-diagnostic rather than risk a wrong reading",
            ],
            [
              "Poor flow after balloon angioplasty",
              "New slow flow beyond the treated segment",
              "Vasodilators and possibly thrombectomy, unless a dissection is the cause, in which case it needs stenting (Brilakis 9.8)",
            ],
            [
              "Distal vessel disappears while a stent is advanced",
              "The stent is crossing a tight lesion, or there is dissection, distal embolisation or spasm",
              "For a tight lesion, pull the stent back, inject until contrast lies beyond the lesion and re-advance to trap it there; stent a dissection; give intracoronary nitroglycerin for spasm. Prevent it with adequate lesion preparation and nitroglycerin (Brilakis 10.2)",
            ],
            [
              "No-reflow",
              "After PCI: TIMI 0 or 1 flow without a mechanical obstruction, no blush, chest pain and ST elevation, sometimes hypotension (Oxford). Brilakis repeatedly pairs slow flow with no-reflow (for example after atherectomy), so a new TIMI 2 without a mechanical cause belongs in the same search",
              "More likely with bulky or thrombus-laden lesions, vein grafts, ectatic native vessels and primary PCI. It can follow predilatation but is commoner after stent deployment or postdilatation, and it carries higher short- and long-term mortality after PCI; flow often improves with time and vasodilators (Oxford). Treatment is taught in the no-reflow module",
            ],
            [
              "Acute coronary syndrome",
              "Slow antegrade flow and luminal haziness",
              "Both are among Brilakis's clues to the culprit lesion; the full list is in the box below",
            ],
          ],
        },
        {
          kind: "table",
          caption: "Finding the culprit in an acute coronary syndrome (Brilakis 7.2 and 20.7)",
          head: ["Clue", "What to look for"],
          rows: [
            ["ECG", "The artery supplying the territory with ST elevation"],
            ["Wall motion", "Hypokinesis of that territory on left ventriculography or echocardiography; the ventriculogram may instead suggest another diagnosis such as takotsubo cardiomyopathy, and echo can show mechanical complications (ventricular rupture, ventricular septal defect, papillary muscle rupture)"],
            ["Flow", "Slow antegrade flow"],
            ["Thrombus", "Luminal haziness or a filling defect; contrast staining at the lesion"],
            ["Collaterals", "Poor or absent collaterals favour the culprit, since collaterals may not have had time to form"],
            ["Distal branches", "Occluded distal branches, which suggest an earlier embolus"],
            ["Wiring", "How easily the lesion is crossed"],
            ["OCT", "Plaque rupture or erosion, and thrombus"],
          ],
        },
        {
          kind: "p",
          text: "No single clue settles it; weigh them together. Occlusion with obvious thrombus usually makes the culprit plain. When no culprit is visible, OCT can show whether one is present, and if doubt remains, later magnetic resonance imaging can show the injured territory and so point to the vessel. Sometimes there is no culprit because the presentation is not ischaemic at all, as in takotsubo cardiomyopathy.",
        },
        {
          kind: "check",
          stem: "After predilating a mid LAD lesion, flow falls to TIMI 2. The run shows a linear lucency at the balloon site with a cap of contrast that persists after the vessel has cleared. The patient has mild chest pain. What does Brilakis's lesion-preparation algorithm direct?",
          options: [
            "Stent the dissected segment, since a dissection causing poor flow needs stenting rather than vasodilators",
            "Intracoronary vasodilators first, because poor flow after balloon angioplasty is usually microvascular",
            "Aspiration thrombectomy first, then reassess flow before deciding whether stenting is needed at all",
            "Stop and repeat the angiogram in 10 minutes, as TIMI 2 flow often improves without treatment",
          ],
          answer: 0,
          explanation:
            "Persistent extraluminal contrast after washout is a dissection (NHLBI type C). Brilakis treats poor flow after balloon angioplasty with vasodilators and possibly thrombectomy, except when the cause is dissection, which needs stenting. Giving vasodilators while a flow-limiting dissection is left untreated misses the mechanical cause.",
        },
        { kind: "tip", id: "pci-interp-grade-flow" },
        { kind: "tip", id: "pci-interp-lost-distal-vessel" },
        { kind: "tip", id: "pci-no-reflow-distal-vasodilator" },
        {
          kind: "pitfalls",
          items: [
            "Grading flow from a weak injection through a small catheter: underfilling is not slow flow.",
            "Comparing with an unfair bed; use the proximal segment of the same artery or the opposite artery.",
            "Stopping the run before the distal bed has filled and cleared, which makes TIMI 2 look like TIMI 1 and makes blush impossible to grade.",
            "Panning during a run you want to grade for blush.",
            "Treating poor flow from a dissection with vasodilators.",
            "Confusing a perforation's myocardial blush (Ellis class 2) with reperfusion blush.",
            "Repeating contrast injections into an artery with established no-reflow, which worsens ischaemia (Oxford).",
          ],
        },
        {
          kind: "pearl",
          text: "When the distal vessel vanishes as a stent crosses a tight lesion, you can give yourself a road map: pull the stent back, inject until contrast lies beyond the lesion, then advance the stent so it traps that contrast distally.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "occlusion",
          task: "Decide whether the RCA is occluded on each real run. For every run you call open, also name a TIMI grade and the bed you compared it with.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the LCx STEMI scenario, grade TIMI flow on the first injection, after wiring and after each balloon or stent step. Keep the other runs short, and prolong only the final run, deliberately, until the territory has filled and cleared so that blush can be graded.",
        },
        { kind: "video", id: "qK2euYOpfEU", note: "Brilakis's chapter summary on interpreting the angiogram, which includes flow." },
        {
          kind: "keypoints",
          items: [
            "Grade only a well-filled run; compare with the proximal bed or the opposite artery.",
            "TIMI 0 none past the obstruction; 1 gets through but never fills the bed; 2 fills but slower; 3 as brisk as normal.",
            "Corrected TIMI frame count: frames to a standard distal landmark, LAD count divided by 1.7; it depends on frame rate.",
            "Myocardial blush grades tissue perfusion 0–3 and independently predicts mortality after primary PCI.",
            "Poor opacification has technical causes; if the artery cannot be filled, call the study non-diagnostic.",
            "Poor flow after ballooning: vasodilators and possibly thrombectomy, unless a dissection is the cause, which is stented.",
            "Culprit clues: ECG, wall motion, slow flow, thrombus or staining, poor collaterals, distal branch occlusion, ease of wiring and OCT; weigh them together.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-pitfalls",
      title: "Pitfalls: foreshortening, overlap, poor filling, selective injection and missed vessels",
      minutes: 13,
      topics: ["dx-pitfalls"],
      sources: [
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Tips for interpretation" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 7: Competitive filling" },
        { book: "oxford-cath", loc: "ch 7: Collateral filling" },
        { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Oxford opens its list of common pitfalls by pointing out that inexperienced operators and old equipment produce studies that are incomplete or misread. Most errors are not subtle judgements about a difficult lesion; they are lesions that were never properly shown, vessels that were never filled, and territories nobody noticed were empty. Brilakis's rule sums up the attitude: if an artery cannot be filled completely, it is better to call the angiogram non-diagnostic than to give an interpretation that may be wrong.",
        },
        { kind: "h", text: "First, orientate yourself" },
        {
          kind: "list",
          items: [
            "In every view of the left coronary, the circumflex is the vessel closest to the spine.",
            "If the spine is on the left of the image the view is RAO; if it is on the right, LAO.",
            "LAD branches heading for the lateral wall are diagonals; those heading into the septum are septals.",
            "Circumflex branches to the lateral wall are obtuse marginals (the last may be called the terminal marginal); a branch continuing in the AV groove towards the base is the AV circumflex.",
            "The RCA's right ventricular marginals run anteriorly and supply mainly right ventricular muscle.",
          ],
        },
        { kind: "h", text: "The pitfalls and their fixes" },
        {
          kind: "table",
          head: ["Pitfall", "How it misleads you", "Prevention or fix"],
          rows: [
            [
              "A ‘standard’ set of views only",
              "Vessels overlap or are foreshortened, so lesions are hidden, shortened or exaggerated",
              "Add cranial and caudal angulation, particularly for the left coronary; plain LAO and RAO are not enough (Oxford). Use at least two orthogonal projections and as many as it takes (Brilakis)",
            ],
            [
              "Overlap",
              "A lesion sits behind another vessel or a branch",
              "Change projection until the segment is clear; Brilakis also lists large patients, weak injection and poor engagement as reasons segments are poorly seen",
            ],
            [
              "Too little contrast, too slowly",
              "Streaming, the mixing of opacified and unopacified blood, makes quantification difficult and can create or hide narrowings",
              "Oxford's typical volumes are 5–10 mL for the left coronary and 3–5 mL for the RCA, more for grafts, injected fast enough to fill the artery for 3 beats and reflux into the aortic root",
            ],
            [
              "Catheter tip too deep",
              "An ostial lesion lies behind the tip and is never opacified",
              "If in doubt, inject and acquire with the tip in the right coronary sinus (Oxford). For aorto-ostial lesions with severe damping, Brilakis notes that non-selective angiography lowers the risk of dissection at the cost of image quality",
            ],
            [
              "Super-selective engagement",
              "With a short or absent left main, a JL may fill only the LAD, and the circumflex can be called occluded; in the RCA it is usually the conus that is entered",
              "A test injection should reveal it. A JL one size larger usually engages the circumflex. Withdraw from the conus before injecting, because a large injection there can cause ventricular fibrillation",
            ],
            [
              "Catheter-tip spasm",
              "A tight ostial narrowing, often in the RCA, that is not disease",
              "Withdraw until the trace is free, re-engage carefully (coaxial, not deep), give intracoronary nitrate, wait 1–2 minutes and document relief (spasm lesson)",
            ],
            [
              "An empty territory",
              "A whole area of myocardium has no supplying vessel: an anomalous vessel (often the circumflex) or a flush ostial occlusion",
              "Look for faint filling on the other injection, use cusp angiography or an aortogram, and look for collaterals filling the territory (Brilakis 5.7; anomalies lesson)",
            ],
            [
              "Bypass grafts",
              "Where a patent native artery is also grafted, contrast washes out beyond the anastomosis (competitive filling) and the graft may back-fill",
              "Read the native and graft injections together. If a native vessel is occluded and no collaterals fill it, Oxford infers that the graft supplying it may still be patent",
            ],
            [
              "Lesions at bifurcations",
              "The diameter changes across the branch, so the reference is uncertain",
              "Grade with care (Brilakis 6.8); Oxford lists bifurcation lesions among the ambiguous anatomy that IVUS can clarify (ch 8)",
            ],
            [
              "Equipment in a tortuous vessel",
              "Stiff wires straighten the artery and provoke spasm (Oxford); catheters and wires in very tortuous vessels such as LIMA grafts create pseudolesions (Brilakis 25.2)",
              "Use soft-bodied wires and microcatheters. Removing the equipment is the treatment for a pseudolesion, but first make sure there is no dissection, for example with IVUS",
            ],
          ],
        },
        {
          kind: "table",
          caption: "A minimum set of orthogonal views (Brilakis 6.6; taught in full in the acquiring module)",
          head: ["Vessel", "Projections"],
          rows: [
            ["Left main", "AP; RAO with caudal tilt; RAO with cranial tilt; LAO with cranial tilt; LAO with caudal tilt (the spider)"],
            ["LAD", "AP or RAO with cranial tilt, plus RAO with caudal tilt"],
            ["RCA", "LAO; LAO with cranial tilt or AP with cranial tilt; RAO"],
            ["Vein and radial grafts", "LAO and RAO"],
            ["Internal mammary grafts", "AP, lateral, and AP or RAO with cranial tilt"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's rule of thumb for choosing tilt: proximal segments generally show best with caudal angulation and distal segments with cranial angulation. Add views until every segment has been seen clearly in two planes; the set above is a minimum, not a limit.",
        },
        {
          kind: "check",
          stem: "From the femoral route a JL4 drops into the left coronary. The run shows the LAD and diagonals well, but no vessel runs to the lateral wall, and the pressure trace is free. What should you do before reporting an occluded circumflex?",
          options: [
            "Report a circumflex occlusion at its origin, since the trace is free and the LAD fills normally on this view",
            "Give intracoronary nitrate and repeat the same run, because the missing circumflex is probably in spasm",
            "Suspect selective LAD engagement past a short left main: inject with the tip eased back or use a JL one size larger",
            "Proceed to the RCA; the circumflex territory will be assessed on the ventriculogram later in the study",
          ],
          answer: 2,
          explanation:
            "A missing circumflex after a JL engages is often super-selective entry into the LAD past a short left main; Oxford advises a test injection to recognise it and a JL one size larger, which will usually engage the circumflex. If that fails, think of an anomalous circumflex arising from the right side, which you look for on the RCA injection, in the sinuses and on the ventriculogram (dot sign). Reporting an occlusion without these steps is the classic error.",
        },
        {
          kind: "check",
          stem: "A man with previous bypass surgery has an occluded native LAD. Neither the RCA nor the circumflex injection shows any collateral filling of the LAD, and the LIMA has not yet been injected. What does this suggest?",
          options: [
            "The LIMA graft may still be patent and supplying the LAD, so engage it before drawing conclusions",
            "The LAD territory is infarcted and non-viable, so the LIMA does not need to be found",
            "The occlusion must be recent, since collaterals take months to form in grafted patients",
            "Collaterals are being hidden by streaming; repeat the native injections with more contrast",
          ],
          answer: 0,
          explanation:
            "Oxford's rule: collaterals to a territory imply reduced supply to it, and their absence when the native vessel is occluded suggests that the graft to that territory may still be patent. Find and inject the LIMA. Absence of collaterals says nothing about viability, and nothing in the manuals dates an occlusion from their absence in this setting.",
        },
        { kind: "tip", id: "diag-interp-fill-or-call-nondiagnostic" },
        { kind: "tip", id: "diag-interp-ostium-from-outside" },
        { kind: "tip", id: "diag-short-lm-size-up" },
        { kind: "tip", id: "diag-conus-withdraw" },
        { kind: "tip", id: "pci-interp-pseudolesion" },
        {
          kind: "pitfalls",
          title: "Habits that cause misreads",
          items: [
            "Reading only the frames shown live and never reviewing the stored runs after the case.",
            "Calling a missing circumflex occluded without excluding a short left main or an anomalous origin.",
            "Accepting a deep RCA position and so never imaging the ostium.",
            "Grading a streaming run, or one with no reflux into the aorta.",
            "Reading a narrowing that appeared after a stiff wire went in as new disease.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you finish, put the territories together: anterior wall and septum, lateral wall, inferior wall, right ventricle. Each should have an artery you have seen fill. An empty territory is either an anomaly, a flush occlusion or a vessel you have not injected yet.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "In the projection trainer, image the left main, LAD and circumflex with cranial and caudal angulation and find the view that shows the proximal LAD without overlap or foreshortening. Name each view from the position of the spine.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA with a JR4 and deliberately take a run with the tip deep, then one from the right sinus with the tip withdrawn. Compare how much of the ostium each shows.",
        },
        { kind: "drill", target: "angio-real", drill: "view", task: "Name the projection of each real run from the spine, the catheter and the course of the vessels." },
        { kind: "video", id: "XxUGDCim5sg", note: "Hanna: tips for coronary angiography." },
        { kind: "video", id: "eGdfIk73cds", note: "Hanna: a collection of interesting coronary angiograms." },
        { kind: "video", id: "W-7hiIlAVAA", note: "Hanna: interesting coronary angiograms and the decisions that followed (part 3)." },
        {
          kind: "keypoints",
          items: [
            "Circumflex nearest the spine; spine on the left means RAO.",
            "Use cranial and caudal views; avoid overlap and foreshortening.",
            "Inject enough to fill for 3 beats with reflux (Oxford: 5–10 mL left, 3–5 mL right); otherwise expect streaming.",
            "A deep tip hides the ostium; inject from the sinus if in doubt.",
            "A missing circumflex: short left main, anomaly or flush occlusion, never assume occlusion.",
            "Competitive graft flow and absent collaterals change what native injections mean.",
            "If you cannot fill the artery, call the study non-diagnostic.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-morphology",
      title: "Describing the lesion: thrombus, calcium, dissection, aneurysm and ectasia",
      minutes: 15,
      topics: ["dx-lesion-morphology"],
      sources: [
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "9.2" },
        { book: "brilakis-pci", loc: "9.4" },
        { book: "brilakis-pci", loc: "9.5" },
        { book: "brilakis-pci", loc: "9.6" },
        { book: "brilakis-pci", loc: "9.9" },
        { book: "brilakis-pci", loc: "19" },
        { book: "brilakis-pci", loc: "20.7" },
        { book: "brilakis-pci", loc: "22.1" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "19.13" },
        { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 8: The no-reflow phenomenon" },
      ],
      refs: [...BOOKS, "gibson-timi-thrombus-2001", "nhlbi-dissection-1991", "ellis-1994", "scad-saw-2014", "saw-scad-outcomes-2017", "esc-acs-2023", "total-2015"],
      blocks: [
        {
          kind: "p",
          text: "A percentage tells you how narrow a lesion is; the description tells you what it is and how it will behave when you treat it. Brilakis's chapter 6 lists the features to assess in every artery and lesion, and his lesion-preparation algorithm (chapter 9) shows why: a large thrombus, heavy calcium or a degenerated graft each changes what you do before a stent goes in.",
        },
        {
          kind: "steps",
          title: "A fixed order for every lesion (after Brilakis 6.8)",
          items: [
            { title: "Flow", detail: "TIMI grade, as in the flow lesson." },
            { title: "Severity and length", detail: "Percentage diameter stenosis and length in millimetres, as in the grading lesson. A total occlusion, acute or chronic, is harder to open." },
            { title: "Thrombus", detail: "Present or not, and its TIMI thrombus grade." },
            { title: "Calcium", detail: "Look before the contrast arrives." },
            { title: "Dissection", detail: "NHLBI type." },
            { title: "Branches and ostia", detail: "Bifurcation, aorto-ostial or branch-ostial location." },
            { title: "Tortuosity", detail: "Proximal to and within the lesion." },
            { title: "Dilatation", detail: "Aneurysm or ectasia." },
            { title: "Collaterals, perforation and fistulae", detail: "Taught in the collaterals and anomalies lessons, and in the perforation module." },
          ],
        },
        { kind: "h", text: "Thrombus" },
        {
          kind: "p",
          text: "Angiography is not good at detecting thrombus. It appears as a filling defect within the lumen, sometimes accompanied by contrast staining, and it can be mistaken for a calcified nodule. In an acute syndrome, luminal haziness that suggests thrombus is one of Brilakis's clues to the culprit, and OCT can show the plaque rupture or erosion and the thrombus directly. The usual grading is the TIMI thrombus grade.",
        },
        {
          kind: "table",
          caption: "TIMI thrombus grade (Brilakis 6.8; Gibson 2001)",
          head: ["Grade", "Appearance"],
          rows: [
            ["1", "Possible thrombus: lower contrast density, haziness, an irregular contour, or a smooth convex meniscus at an occlusion. Suggestive, not diagnostic"],
            ["2", "Definite thrombus, largest dimension no more than half the vessel diameter"],
            ["3", "Definite thrombus, largest linear dimension more than half but less than two vessel diameters"],
            ["4", "Definite thrombus, largest dimension two vessel diameters or more"],
            ["5", "Total occlusion"],
          ],
        },
        {
          kind: "check",
          stem: "A proximal RCA lesion contains a clearly outlined filling defect about one and a half vessel diameters long, with antegrade flow preserved. What is the TIMI thrombus grade?",
          options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"],
          answer: 2,
          explanation:
            "Definite thrombus larger than half a vessel diameter but shorter than two diameters is grade 3. Grade 4 starts at two diameters, grade 2 is half a diameter or less, grade 1 is only possible thrombus, and grade 5 is a total occlusion.",
        },
        { kind: "h", text: "Calcium" },
        {
          kind: "table",
          caption: "Grading calcium",
          head: ["Method", "Severe", "Moderate or mild"],
          rows: [
            [
              "Angiography (Brilakis 6.8, 19)",
              "Radio-opacities seen without cardiac motion before contrast is injected, involving both sides of the arterial wall",
              "Moderate: densities involving less than 50% of the reference lesion diameter, often visible only while the heart moves, before contrast",
            ],
            ["IVUS or OCT arc (Brilakis 19)", "More than 270°", "Moderate 180°–270°; mild less than 180°"],
          ],
        },
        {
          kind: "p",
          text: "Angiography underestimates calcium. In the IVUS study Brilakis quotes, of 1,155 lesions, angiography found calcium in 38% and IVUS in 73%. Calcium makes severity harder to judge, equipment harder to deliver and the lesion and stent harder to expand, and it raises the risk of dissection, perforation, equipment loss and restenosis. So take multiple views, look at the screen before the contrast arrives (Brilakis starts injecting 1–2 seconds into the cine run partly so that calcium can be seen), and use physiology and IVUS or OCT freely: Brilakis encourages physiology in heavily calcified lesions because their angiographic appearance correlates poorly with physiological measurements. Imaging also grades the calcium: OCT can show its depth, whereas IVUS shows only the shadow behind it, and lesions with a calcium arc over 180°, a maximum thickness over 0.5 mm and a length over 5 mm carry a raised risk that the stent will be underexpanded. In the lesion-preparation algorithm, severe calcium often means atherectomy or intravascular lithotripsy, and good balloon expansion is confirmed before stenting. Brilakis is categorical that a heavily calcified lesion is never stented without preparation (primary stenting), because a lesion that cannot be fully dilated leaves the stent underexpanded, which raises the risk of restenosis and stent thrombosis. The calcified lesions module teaches the treatment.",
        },
        {
          kind: "check",
          stem: "On fluoroscopy before contrast, you see dense parallel opacities along both walls of the mid RCA that stay visible even in frames where the heart is still. How should this be classified and what follows?",
          options: [
            "Moderate calcification, because it is seen before contrast; plain balloon angioplasty is enough",
            "Probably a calcified nodule mimicking thrombus; give a glycoprotein IIb/IIIa inhibitor and reassess",
            "Stent struts from an old stent, as calcium is only visible when the heart is moving",
            "Severe calcification; expect angiography to understate it, and plan intravascular imaging and possible atherectomy",
          ],
          answer: 3,
          explanation:
            "Opacities involving both walls and seen without cardiac motion before contrast are Brilakis's angiographic definition of severe calcification. Angiography underestimates calcium, so imaging (OCT can show depth; IVUS shows shadowing) and lesion modification such as atherectomy are often needed; stenting it without preparation is the one thing Brilakis rules out. Moderate calcium involves less than half the reference diameter and is often seen only with motion.",
        },
        { kind: "h", text: "Dissection" },
        {
          kind: "table",
          caption: "NHLBI dissection types (developed for balloon angioplasty, still used with stents)",
          head: ["Type", "What you see"],
          rows: [
            ["A", "Small radiolucent areas in the lumen during injection that leave nothing behind once the contrast clears"],
            ["B", "Parallel tracks or a double lumen, again without contrast persisting"],
            ["C", "A cap of contrast outside the lumen that persists after the contrast clears (extraluminal staining)"],
            ["D", "A spiral dissection, usually with heavy staining of the false lumen"],
            ["E", "Dissection with persistent filling defects inside the lumen"],
            ["F", "Dissection that has occluded the lumen, with no antegrade flow beyond"],
          ],
        },
        {
          kind: "p",
          text: "Not every dissection is made by a balloon. Spontaneous coronary artery dissection (SCAD) is a dissection of an epicardial artery that is not caused by atherosclerosis, trauma or instrumentation; the artery is obstructed by an intramural haematoma or an intimal tear rather than by plaque rupture or thrombus. Brilakis advises suspecting it in young women, especially around childbirth. Do not read ‘young’ too narrowly: in a prospective series of 327 patients, 90.5% were women, their average age was 52.5 years and more than half of the women were postmenopausal (Saw 2017). Once it is suspected, the angiogram itself must not add an iatrogenic dissection: Brilakis prefers femoral access (one series found a threefold higher risk of catheter-induced dissection with radial access), engages with great care, coaxially and without deep intubation, and avoids strong contrast injections; he also generally avoids glycoprotein IIb/IIIa inhibitors and cangrelor, which may extend an intramural haematoma. Brilakis describes three angiographic types: type 1, several radiolucent lumens or contrast staining of the wall; type 2, a diffuse narrowing usually longer than 20 mm, either bordered by normal segments (2A) or running to the vessel's tip (2B); type 3, a focal or tubular narrowing usually shorter than 20 mm that mimics atherosclerosis and needs intracoronary imaging, if safe, to diagnose. Aortic dissection can also involve the coronary ostia and present as an acute coronary syndrome. SCAD management is taught in the complex lesions track.",
        },
        { kind: "h", text: "Aneurysm and ectasia" },
        {
          kind: "p",
          text: "Brilakis's two definitions differ slightly. In chapter 6 an aneurysm is dilatation of part of an artery, or of diffuse segments of it, to more than 1.5 times the diameter of the neighbouring normal artery. In his chapter on large vessels, dilatation to at least 1.5 times is called an aneurysm when it is focal and ectasia when it is diffuse; that is the usage in this module. Large vessels need forceful injection, and sometimes a guide catheter, to fill completely; an ectatic artery that is underfilled can look slow or hazy. Lesion severity is also hard to judge in large vessels, which may benefit from physiology, and in small vessels (under 2.5 mm) physiology is very helpful because significance depends on the size of the territory as well as on the narrowing; in small vessels nitroglycerin is critical so that spasm does not make them look smaller than they are. Oxford lists ectatic native vessels among the settings where no-reflow should be anticipated, and gives aneurysms among the ambiguous appearances that IVUS can clarify, alongside filling defects, bifurcations, heavy calcium and hazy lesions.",
        },
        { kind: "h", text: "Branches, ostia and tortuosity" },
        {
          kind: "table",
          head: ["Descriptor", "Definition used by Brilakis (6.8)"],
          rows: [
            ["Bifurcation lesion", "The European Bifurcation Club's definition: a narrowing beside, or extending into, the origin of an important side branch"],
            ["Ostial lesion", "Within 3–5 mm of the vessel's origin. Aorto-ostial: the RCA, left main and aorto-coronary grafts (vein and arterial). Branch ostial: the origin of a branch of a coronary vessel"],
            ["Moderate proximal tortuosity", "At least 2 bends over 70°, or 1 bend over 90°, proximal to the lesion"],
            ["Severe proximal tortuosity", "2 bends over 90°, or 1 bend over 120°"],
            ["Bend within the lesion", "Over 45° is regarded as significant for chronic total occlusions"],
            ["Perforation", "Graded by the Ellis classes 1–3, with cavity spilling (class 3 into a chamber or the coronary sinus); taught in the perforation module"],
          ],
        },
        {
          kind: "p",
          text: "Oxford summarises lesion complexity with the ACC/AHA and SCAI classifications, which use many of these same features (length, eccentricity, tortuosity, angulation, calcium, occlusion age, bifurcations, degenerated grafts and thrombus). Classifying a lesion for planning is taught in the planning module.",
        },
        { kind: "tip", id: "pci-interp-thrombus-grade" },
        { kind: "tip", id: "pci-interp-calcium-look-first" },
        { kind: "tip", id: "pci-interp-dissection-nhlbi" },
        {
          kind: "pitfalls",
          items: [
            "Injecting immediately and never seeing the calcium on plain fluoroscopy.",
            "Calling a calcified nodule thrombus, or the reverse; both are filling defects, and imaging separates them.",
            "Grading a dissection before the contrast has cleared, so persistent staining (type C) is missed.",
            "Underfilling an ectatic artery and reading the haze as thrombus or slow flow.",
            "Overlooking a long smooth narrowing in a woman as diffuse atheroma when it may be SCAD type 2.",
            "Stenting a heavily calcified lesion without preparing it first.",
          ],
        },
        {
          kind: "pearl",
          text: "Let the description write the plan: severe calcium points to imaging and atherectomy or lithotripsy, never to primary stenting; a degenerated vein graft with friable plaque, or thrombus that will not be or could not be aspirated, is among the few situations in which Brilakis may prefer to stent without any preparation. Brilakis notes that a large thrombus often leads to thrombectomy, but current guidance is narrower: the 2023 ESC acute coronary syndrome guideline does not recommend routine thrombus aspiration, after the TOTAL trial, in which routine aspiration left the 180-day rate of cardiovascular death, reinfarction, cardiogenic shock or NYHA class IV heart failure unchanged, while stroke within 30 days was more frequent. Aspiration is kept for bail-out, when a large thrombus persists after wiring or balloon dilatation.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, look at the lesion on fluoroscopy before the first injection and grade the calcium; then describe the lesion in the fixed order: flow, severity, length, thrombus, calcium, dissection, branches, tortuosity and dilatation.",
        },
        { kind: "drill", target: "angio-real", drill: "locate", task: "Find the lesion on each real run, then describe it in the fixed order before you grade it." },
        { kind: "video", id: "XZoGURFaUkI", note: "Brilakis case 78: calcium versus thrombus." },
        { kind: "video", id: "iABWsnz1QHY", note: "Brilakis case 196: a calcified and aneurysmal RCA." },
        { kind: "video", id: "ka8kxtblPHc", note: "Brilakis case 156: a large thrombus." },
        {
          kind: "keypoints",
          items: [
            "Describe every lesion in a fixed order: flow, severity, length, thrombus, calcium, dissection, branches, tortuosity, dilatation.",
            "TIMI thrombus grade: 1 possible, 2 up to half a diameter, 3 half to two diameters, 4 two or more, 5 occlusion.",
            "Severe calcium: both walls, seen without motion before contrast (38% on angiography against 73% on IVUS); never primary stenting; on OCT an arc over 180°, thickness over 0.5 mm and length over 5 mm predict underexpansion.",
            "Large thrombus: aspiration only as bail-out; routine aspiration is not recommended (2023 ESC, TOTAL).",
            "NHLBI A–F: staining that persists after washout is type C, a spiral is D, filling defects E, occlusion F.",
            "Dilatation of 1.5 times the adjacent normal artery or more: focal is aneurysm, diffuse is ectasia (Brilakis ch 6 includes diffuse segments under aneurysm).",
            "Suspected SCAD: femoral access, gentle coaxial engagement, no forceful injections; it is not confined to young or pregnant women.",
            "Ostial: within 3–5 mm of the origin. Severe tortuosity: 2 bends over 90° or 1 over 120°.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-collaterals",
      title: "Collaterals: filming, grading and reading them",
      minutes: 14,
      topics: ["dx-collaterals"],
      sources: [
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "21" },
        { book: "brilakis-pci", loc: "21.1" },
        { book: "brilakis-pci", loc: "21.6" },
        { book: "brilakis-pci", loc: "21.12" },
        { book: "brilakis-pci", loc: "12.3" },
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "20.8" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "oxford-cath", loc: "ch 7: Collateral filling" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
      ],
      refs: [...BOOKS, "rentrop-1985", "werner-collaterals-2003", "cto-consensus-2019"],
      blocks: [
        {
          kind: "p",
          text: "Each of the three main coronary territories can grow collateral vessels to the others (Oxford). When an injection of one artery fills another artery's territory, the recipient's own supply is reduced: Brilakis reads collateral filling as a sign of an acute or chronic occlusion, or a high-grade stenosis, of the collateralised vessel. Collaterals also map the distal bed of an occluded artery and the routes a retrograde approach might use. The Academy lesson on collaterals covered the named pathways; this lesson covers how to film them, how the manuals grade them and what they mean for decisions.",
        },
        { kind: "h", text: "Filming collaterals" },
        {
          kind: "steps",
          items: [
            {
              title: "Keep the pedal down",
              detail:
                "Collateral filling is late. Brilakis continues acquisition until every branch, and the collateral-filled vessel when there is an occlusion, has opacified, and reserves long acquisitions for exactly this situation. Oxford asks for prolonged acquisition to examine collaterals.",
            },
            {
              title: "Do not pan if you can avoid it",
              detail:
                "The manuals differ: Oxford has the radiographer pan to follow distal vessels, while Brilakis pans only when needed, because panning degrades the image, and avoids it in collateral and dual-injection runs. For a chronic total occlusion Brilakis wants the collaterals filmed at low magnification, during a breath hold and without panning, in projections that show them fully, as part of the routine diagnostic study.",
            },
            {
              title: "Inject both sides when the CTO fills from the other artery",
              detail:
                "Brilakis regards injecting both coronaries as the single easiest step that most improves CTO success, and wants it in every patient whose CTO is fed by contralateral collaterals; it also makes the procedure safer by showing where the wire is and helping with complications such as perforation. Antegrade-only injection overestimates occlusion length, because competing antegrade and retrograde flow leave the distal vessel underfilled.",
            },
            {
              title: "Look at the old films",
              detail:
                "The dominant collateral can change over time or during PCI (‘shifting collaterals’), and collaterals seen before but not on the day may still be crossable.",
            },
          ],
        },
        { kind: "h", text: "Two grading systems" },
        {
          kind: "table",
          caption: "Rentrop grade: how much of the recipient artery fills (Brilakis Fig 6.8)",
          head: ["Grade", "Recipient artery"],
          rows: [
            ["0", "No collateral filling visible"],
            ["1", "Side branches of the recipient fill, but not its epicardial trunk"],
            ["2", "The epicardial trunk fills partially"],
            ["3", "The epicardial trunk fills completely"],
          ],
        },
        {
          kind: "table",
          caption: "Werner collateral connection grade: the size of the channel (Brilakis Fig 6.9, 21.6)",
          head: ["Grade", "Channel"],
          rows: [
            ["CC0", "No continuous connection between donor and recipient"],
            ["CC1", "A continuous, thread-like connection"],
            ["CC2", "A continuous connection the size of a side branch"],
          ],
        },
        {
          kind: "check",
          stem: "The RCA is occluded in its mid segment. An LAD injection shows septal channels running down into the inferior septum; contrast reaches the posterior descending artery, fills it and travels back along the distal RCA to the crux, but the RCA between the crux and the occlusion does not fill. How would you grade the collateral filling of the occluded RCA?",
          options: ["Rentrop 0", "Rentrop 1", "Rentrop 2", "Rentrop 3"],
          answer: 2,
          explanation:
            "Rentrop grades how much of the occluded (recipient) artery fills, here the RCA. Part of its epicardial course fills (the PDA and the distal RCA to the crux) but not the segment back to the occlusion, so this is partial filling, grade 2. Grade 3 would need the whole epicardial RCA beyond the occlusion to fill; grade 1 is filling of side branches only. The size of the septal channels themselves is a separate question, answered by the Werner grade.",
        },
        { kind: "h", text: "What collaterals tell you" },
        {
          kind: "table",
          head: ["Setting", "Reading"],
          rows: [
            [
              "Acute coronary syndrome",
              "Collaterals may not have had time to form, so the distal vessel can be poorly seen or invisible (Brilakis 20.8). Among his culprit clues are poor or absent collaterals (7.2)",
            ],
            [
              "A territory with no visible artery",
              "Collateral flow into it can confirm a flush ostial occlusion that no catheter can engage (Brilakis 5.7)",
            ],
            [
              "Bypass grafts",
              "An occluded native artery without collaterals suggests the graft to it may be patent (Oxford)",
            ],
            [
              "Chronic total occlusion",
              "TIMI 0 flow, thought to have been present for 3 months or longer. Its territory is ischaemic even when the collaterals are good, so physiology is not usually measured in the CTO vessel itself before treatment; after stenting, a pressure step-up along the vessel suggests that segment needs more treatment (Brilakis 21.12)",
            ],
            [
              "Donor vessel physiology",
              "A lesion in the donor artery may look more significant while it feeds the CTO; FFR rose by 0.03 to 0.10 after the CTO was opened in the studies Brilakis cites, so donor physiology is best measured after recanalisation (12.3, 21.12)",
            ],
          ],
        },
        { kind: "h", text: "Reading a chronic total occlusion: the four features" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Proximal cap",
              detail:
                "Where the occlusion starts and its shape. An ambiguous cap risks perforation if crossed blindly; more projections, a microcatheter injection near the cap, IVUS, CT (before the case or co-registered live) or dissection and re-entry ‘move the cap’ techniques can define or bypass it. When the cap stays ambiguous despite these, the usual advice is to start retrograde or use a move-the-cap technique, if either is feasible.",
            },
            {
              title: "2. Length, course and composition",
              detail: "Measured best with dual injection or CT; CT can also pick the fluoroscopic projections with least foreshortening for the crossing attempt (Brilakis Fig 21.1). Heavy calcium and tortuosity in the occluded segment make crossing harder and favour subintimal wire entry; when the course is unclear or very tortuous, a knuckled wire or a switch to the retrograde approach is often preferred.",
            },
            {
              title: "3. Distal vessel",
              detail:
                "Large (over 2.0 mm), well filled, free of significant disease and of major branches is favourable; small, diffusely diseased distal vessels are harder, especially after subintimal wire entry. A small distal vessel may simply be underperfused and will enlarge after recanalisation, so do not judge its true size from the occluded state. Distal caps are more often calcified and resistant when the vessel has been bypassed beyond the CTO, and distal calcium can hinder re-entry. A bifurcation at the distal cap makes antegrade wiring harder and risks losing a branch, so the retrograde approach is favoured there.",
            },
            {
              title: "4. Collaterals",
              detail:
                "Septal, epicardial or graft routes; a patent bypass graft is an ideal retrograde conduit (no side branches, predictable course, large calibre), and even an occluded graft can be used. For each channel note its size, tortuosity, branching, the angles at which it leaves the donor and enters the recipient, any stent jailing its entry or exit, and the distance from its exit to the distal cap. Lack of tortuosity is the strongest predictor of crossing a channel, then size. Septals are generally safer than epicardials. Also assess the donor artery proximal to the channel and whether one large collateral carries most of the supply.",
            },
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds a caution for patients whose collaterals come from an LAD supplied by a mammary graft: working through that graft risks global ischaemia and is avoided where possible. Crossing strategy is taught in the CTO modules of the complex PCI track.",
        },
        {
          kind: "check",
          stem: "A patient has an RCA chronic total occlusion collateralised from the LAD, and a 60% proximal LAD lesion with an FFR of 0.78. What do the manuals say about this measurement?",
          options: [
            "Treat the LAD lesion first, because an FFR of 0.78 is significant whatever the territory beyond it",
            "FFR cannot be measured in a donor vessel at all; use visual grading of the LAD instead",
            "Measure FFR in the CTO vessel through the collaterals to decide which artery to treat",
            "Donor FFR can rise after the CTO is opened, so it is best reassessed after recanalisation",
          ],
          answer: 3,
          explanation:
            "The LAD carries the RCA territory's collateral flow as well as its own, so its FFR can be lower than it will be once the RCA is open; Brilakis quotes rises of 0.03 to 0.10 and recommends measuring donor physiology ideally after recanalisation. Physiology is not usually measured in the CTO vessel, whose territory is ischaemic even with good collaterals.",
        },
        { kind: "tip", id: "diag-interp-collateral-long-run" },
        { kind: "tip", id: "pci-interp-donor-ffr" },
        {
          kind: "pitfalls",
          items: [
            "Stopping the run before the collaterals have filled, then reporting ‘no collaterals’.",
            "Panning or using high magnification for collateral runs, which loses the channels.",
            "Judging a CTO's length from an antegrade injection alone.",
            "Taking good collaterals as proof that the CTO territory is not ischaemic.",
            "Measuring donor-vessel FFR as if the collateral load were not there.",
            "Sizing the distal vessel of an occlusion from its underperfused calibre.",
          ],
        },
        {
          kind: "pearl",
          text: "Collaterals help, but they do not date an occlusion on their own. Brilakis reads collateral filling as compatible with an acute or a chronic occlusion, notes that in an acute syndrome collaterals may not have had time to form, and lists poor or absent collaterals as one culprit clue among several. In a syndrome with two occlusions, weigh that clue with the ECG territory, the wall motion, thrombus, contrast staining and ease of wiring, and look for an old angiogram that already shows one of the occlusions.",
        },
        {
          kind: "cine",
          run: "cdm-00883-LCA-1",
          caption: "Real left coronary run tagged by the dataset as showing collaterals. Keep watching late in the run for filling of a territory the left system does not normally supply, and grade it on the Rentrop scale.",
        },
        { kind: "drill", target: "angio-real", drill: "collaterals", task: "Decide whether each real run shows collateral filling; for each one that does, name the donor, the recipient and a Rentrop grade." },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, describe the four CTO features (proximal cap, length and course, distal vessel, collaterals) before choosing any equipment.",
        },
        { kind: "video", id: "JtpKic3-Wjw", note: "Brilakis, Manual of CTO PCI 8.3.2: retrograde crossing via septal collaterals." },
        { kind: "video", id: "uPvZfHQYTDQ", note: "Brilakis, Manual of CTO PCI 8.3.3: retrograde crossing via epicardial collaterals." },
        { kind: "video", id: "EFoeXwIcv4g", note: "Brilakis CTO case 290: bridging collaterals." },
        {
          kind: "keypoints",
          items: [
            "Collateral filling means the recipient is occluded or severely narrowed.",
            "Film long, at low magnification, during breath hold, without panning; inject both sides when a CTO fills from contralateral collaterals.",
            "Rentrop 0–3 grades filling of the occluded recipient artery; Werner CC0–CC2 grades the channel.",
            "Acute occlusions often lack collaterals; poor collaterals are one culprit clue, not a way to date an occlusion alone.",
            "CTO: proximal cap, length and course, distal vessel, collaterals. Antegrade-only injection overestimates length.",
            "CTO territories are ischaemic despite good collaterals; donor FFR is best measured after recanalisation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-spasm",
      title: "Spasm: catheter-induced, wire-induced and vasospastic angina",
      minutes: 13,
      topics: ["dx-spasm"],
      sources: [
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "brilakis-pci", loc: "18.5" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 5: Myocardial infarction with non-obstructed coronary arteries" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
      ],
      refs: [...BOOKS, "beltrame-covadis-vsa-2017", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Spasm can look exactly like a severe stenosis (Oxford). A narrowing that is spasm and is reported as disease leads to an unnecessary stent; a smooth vessel that is constricted leads to an undersized one. That is why Brilakis gives intracoronary nitroglycerin as a routine step before angiography: to prevent or reverse spasm that could be read as a fixed lesion, and to make balloon and stent sizing accurate.",
        },
        {
          kind: "table",
          caption: "Where spasm comes from",
          head: ["Kind", "How it presents", "Source"],
          rows: [
            [
              "Catheter-tip spasm",
              "After the catheter engages the ostium, often after over-engagement: the pressure ventricularises and then keeps falling, recovering only when the catheter is pulled back. Commonest in a non-dominant RCA and in arteries about the size of the catheter, so more frequent in shorter, lighter patients",
              "Oxford ch 6",
            ],
            [
              "Equipment-induced",
              "Deep or aggressive guide manipulation, wiring, balloons and stents (Brilakis 25.2); stiff wires that straighten the artery (Oxford); spasm in under 3% of IVUS studies, usually relieved by intracoronary GTN (Oxford ch 8)",
              "Both",
            ],
            ["Drug-induced", "Cocaine or amphetamine derivatives, which can cause refractory spasm needing intracoronary verapamil", "Oxford ch 6"],
            ["Contrast reaction", "Rarely, spasm with hypotension as part of a reaction to contrast", "Oxford ch 6"],
            [
              "Spontaneous (vasospastic angina)",
              "Severe constriction that can cause infarction or sudden death, often at sites of mild plaque but also in normal arteries after vasoactive substances (cocaine, adrenaline, some chemotherapy drugs); patients may lack the usual risk factors",
              "Oxford ch 5",
            ],
          ],
        },
        { kind: "h", text: "Is this narrowing spasm? A working sequence" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Suspect it",
              detail:
                "Think of spasm for a narrowing at the catheter tip, an ostial narrowing, a smooth narrowing in an otherwise normal vessel, a narrowing that appeared after wiring, and in small arteries and radial grafts. Brilakis stresses nitroglycerin before angiography of ostial lesions, small arteries and radial grafts.",
            },
            {
              title: "2. If the catheter is the cause, back off first",
              detail:
                "Withdraw until the aortic trace returns. Nothing is injected through a ventricularised or damped catheter, nitrate included; the engaging module teaches the trace.",
            },
            {
              title: "3. Check that nitrate is safe",
              detail:
                "Look at the systolic pressure. Do not give nitroglycerin if the pressure is low, the patient may be hypovolaemic, there is right ventricular infarction, or a phosphodiesterase-5 inhibitor has been taken recently: within 24 hours for sildenafil, vardenafil or avanafil, and within 48 hours for tadalafil (Brilakis 6.3). Brilakis also withholds it in hypertrophic obstructive cardiomyopathy, where lowering preload and afterload worsens the outflow obstruction (3.2). Neither manual addresses severe aortic stenosis; with a fixed outflow obstruction the cautious course is a reduced dose, or none, with the pressure watched closely, following local protocol.",
            },
            {
              title: "4. Re-engage carefully, then give intracoronary nitrate",
              detail:
                "Both manuals give the nitrate into the artery after a careful re-engagement: coaxial, not deep, with an undamped trace (Oxford ch 6; Brilakis 25.2 gives it after engagement and before angiography). Brilakis's routine pre-angiography dose is 50–200 µg by systolic pressure: 200 µg above 120 mmHg, 100 µg at 100–120 mmHg, and 50 µg or none below 100 mmHg. His drug chapter (3.2) gives 100–300 µg as the general intracoronary dose, and for established spasm (25.2) he gives 100–300 µg, repeated if needed, and lists intracoronary calcium channel blockers; the same drug chapter warns against high and repeated doses because of hypotension. Oxford gives GTN or isosorbide dinitrate as repeated 100–250 µg boluses. Give it through the manifold or straight into the Y-connector with the introducer needle (‘nitro on a stick’). Sublingual alternatives are 0.4 mg (Brilakis) or 1–2 puffs of GTN spray (Oxford). Doses are typical; follow local protocol.",
            },
            {
              title: "5. Wait, and watch the pressure",
              detail: "Brilakis waits 1–2 minutes before imaging because vasodilatation can take up to 2 minutes; Oxford notes that maximal dilatation may take 1–2 minutes. A fall in blood pressure is common. If it happens, give no further nitroglycerin (its half-life is 1.5 to 7.5 minutes), give saline (often given anyway after nitroglycerin), and wait, since the hypotension often settles within minutes; use a vasopressor such as norepinephrine or phenylephrine if it is extreme or persistent, and if it persists look for another cause, such as bleeding.",
            },
            {
              title: "6. Image again and record the result",
              detail: "Acquire an image of the same segment to document that the spasm has gone (Oxford).",
            },
            {
              title: "7. If it does not resolve",
              detail:
                "Brilakis uses OCT or IVUS to tell spasm from atherosclerotic stenosis. For intractable spasm Oxford mentions sodium nitroprusside, sometimes with a calcium channel blocker such as verapamil. A long, smooth narrowing in a woman should also raise spontaneous coronary artery dissection (type 2; complex lesions track).",
            },
          ],
        },
        {
          kind: "check",
          stem: "A JR4 engages a small non-dominant RCA in a slim woman. Within a few seconds the trace ventricularises and then keeps falling; a test run had shown a tight, smooth ostial narrowing. Blood pressure in the aorta is 132/78 mmHg. What is the best sequence?",
          options: [
            "Withdraw until the aortic trace returns, re-engage gently and coaxially with a free trace, give intracoronary nitroglycerin, wait, then image the ostium",
            "Inject 200 µg of nitroglycerin through the engaged catheter now, then take the RAO run to define the ostial lesion",
            "Report a severe ostial RCA stenosis and plan PCI with a guide that has side holes to avoid damping",
            "Change to an Amplatz catheter to engage more deeply and stabilise the tip beyond the narrowing",
          ],
          answer: 0,
          explanation:
            "Ventricularisation followed by a further fall, in a non-dominant RCA about the size of the catheter, is the catheter-tip spasm pattern Oxford describes. Injecting through the wedged catheter, even nitrate, risks dissection; pull back first. Then re-engage carefully, coaxial and not deep, with an undamped trace, and give the nitrate into the artery: with a systolic pressure above 120 mmHg, Brilakis's dose is 200 µg. Wait 1–2 minutes and document the result. Reporting or treating the narrowing before excluding spasm is the error the step exists to prevent.",
        },
        {
          kind: "check",
          stem: "Before a diagnostic study, a man's systolic pressure is 128 mmHg. He took tadalafil 30 hours ago. What does Brilakis advise about routine intracoronary nitroglycerin?",
          options: [
            "Give 200 µg, as the systolic pressure is above 120 mmHg",
            "Do not give it: tadalafil within the past 48 hours is a reason to withhold nitroglycerin",
            "Give 100 µg, halving the dose because of the tadalafil",
            "Give it sublingually rather than into the coronary, which avoids the interaction",
          ],
          answer: 1,
          explanation:
            "Brilakis lists recent phosphodiesterase-5 inhibitor use as a cause of hypotension after nitroglycerin and a reason not to give it, with a window of 48 hours for tadalafil (24 hours for sildenafil, vardenafil and avanafil). The pressure-based dose applies only when there is no contraindication, and a sublingual dose is still nitroglycerin.",
        },
        { kind: "h", text: "Vasospastic angina" },
        {
          kind: "p",
          text: "Spontaneous spasm belongs among the causes of myocardial infarction with non-obstructed coronary arteries. Oxford states that the diagnosis can be confirmed by provocation testing with intracoronary ergonovine or acetylcholine, and that treatment is pharmacological, with calcium channel blockers first line and other vasodilators as alternatives. In its list of angiographic pitfalls Oxford adds that ergonovine provocation is now rarely performed, because of the risk of intractable spasm causing infarction. That caution concerns ergonovine; provocation testing as such has not been abandoned. The 2024 ESC chronic coronary syndromes guideline includes invasive coronary function testing, with intracoronary acetylcholine provocation in experienced laboratories, in the work-up of angina with non-obstructed coronary arteries. The international COVADIS criteria rest on three elements: angina that responds to nitrate, transient ischaemic ECG changes, and documented coronary artery spasm. How provocation testing is done, and its safety precautions, are taught in the coronary physiology module.",
        },
        {
          kind: "p",
          text: "Spasm also explains some unexpected physiology: Brilakis lists coronary vasospasm, and myocardial bridging, among the causes of a disappointing FFR after PCI, and Oxford gives GTN before and after IVUS to reduce spasm during imaging.",
        },
        {
          kind: "check",
          stem: "During PCI of a tortuous RCA, two new narrowings appear in the mid vessel once a stiff wire has been advanced. The patient is stable. What is the most appropriate interpretation and action?",
          options: [
            "New dissections from the wire, so stent both narrowings now before they extend any further",
            "Thrombus formed on the wire, so give a glycoprotein IIb/IIIa inhibitor and repeat the run",
            "Calcified plaque newly revealed by the wire, so plan atherectomy of both segments",
            "Spasm or pseudolesions from the straightened vessel: give nitrate and confirm there is no dissection before removing equipment",
          ],
          answer: 3,
          explanation:
            "Oxford notes that stiff wires straighten the artery and provoke spasm, and Brilakis describes pseudolesions caused by catheters and wires in tortuous vessels, for which removing the equipment is the treatment once a dissection has been excluded, for example with IVUS. Stenting them would treat an artefact.",
        },
        { kind: "tip", id: "diag-interp-nitrate-before-fixed" },
        { kind: "tip", id: "pci-wire-spasm-nitrate" },
        {
          kind: "pitfalls",
          items: [
            "Calling an ostial or smooth narrowing fixed before giving nitrate.",
            "Injecting nitrate through a ventricularised catheter instead of withdrawing first, or giving it from the sinus instead of after a careful re-engagement.",
            "Giving nitroglycerin to a patient who is hypotensive, hypovolaemic, has RV infarction or hypertrophic obstructive cardiomyopathy, or has taken a PDE-5 inhibitor recently.",
            "Repeating doses into falling pressure; give no more and treat the hypotension.",
            "Imaging before the nitrate has had 1–2 minutes to work.",
            "Forgetting to record the image that shows the spasm has resolved.",
            "Stenting wire-induced narrowings in a straightened tortuous vessel.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford notes that nitrates can be given even to patients already taking an oral preparation, but that the vasodilator response may be blunted in someone on an intravenous nitrate infusion. Remember this when an intracoronary dose seems to change little.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA with a JR4. Before each run, state the systolic pressure and the nitroglycerin dose you would give by Brilakis's scheme, wait before acquiring, and name the trace. If the trace ventricularises and falls, withdraw first.",
        },
        { kind: "video", id: "6HmNE36hBec", note: "Brilakis: nitroglycerin ‘on a stick’." },
        { kind: "video", id: "3sGSkQ6hoQ0", note: "Brilakis case 56: coronary anatomy assessment, core principles." },
        {
          kind: "keypoints",
          items: [
            "Spasm mimics severe stenosis; give nitrate before calling a narrowing fixed.",
            "Catheter-tip spasm: ventricularises then falls; commonest in a small non-dominant RCA. Withdraw, re-engage carefully, then give nitrate.",
            "Nitroglycerin by systolic pressure: over 120 mmHg 200 µg, 100–120 mmHg 100 µg, under 100 mmHg 50 µg or none; wait 1–2 minutes.",
            "Withhold it with hypotension, hypovolaemia, RV infarction, HOCM or recent PDE-5 inhibitors (48 hours for tadalafil); be cautious in severe aortic stenosis.",
            "Established spasm: 100–300 µg repeated, intracoronary calcium channel blockers, but avoid high and repeated doses into falling pressure; OCT or IVUS if it will not resolve.",
            "Vasospastic angina: provocation with acetylcholine (ergonovine now rarely); calcium channel blockers first line.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-interpreting-anomalies",
      title: "Coronary anomalies, fistulae and myocardial bridging",
      minutes: 14,
      topics: ["dx-coronary-anomalies"],
      sources: [
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "1.5" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "brilakis-pci", loc: "30.3" },
        { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 1: Cardiac CT or invasive angiography?" },
      ],
      refs: [...BOOKS, "sternheim-bridging-2021"],
      blocks: [
        {
          kind: "p",
          text: "Oxford finds variant or anomalous coronary anatomy in 1–2% of unselected angiograms. Anomalies include arteries that arise, run or branch abnormally, and fistulae. How much one matters depends on the route the vessel takes and on whether it is prone to coronary disease. They matter in three ways: some carry a risk of sudden death, an unrecognised one can be reported as an occlusion or left out of a revascularisation, and they make engagement difficult. The two commonest variants, separate LAD and circumflex ostia in the left sinus and an anterior origin of the RCA, are frequent enough to count as normal variants.",
        },
        {
          kind: "table",
          caption: "Anomalies the manuals describe",
          head: ["Anomaly", "How it shows itself", "Why it matters"],
          rows: [
            [
              "Circumflex from the proximal RCA or the right sinus (the commonest, 0.2–0.7%)",
              "No vessel supplies the lateral wall on the left injection; the vessel outlines faintly on the RCA injection; on the left ventriculogram it may be seen end-on (the ‘dot’ sign)",
              "It runs behind the aorta to the posterolateral LV. Missed, it leads to incomplete revascularisation or to ligation during valve replacement; its retro-aortic segment is often very small and hard to graft",
            ],
            ["RCA from the left sinus", "No RCA from the right sinus", "Importance depends on its course"],
            ["Left main from the right sinus", "No left coronary in the left sinus", "Sudden death has been reported when an anomalous left coronary passes between the aorta and pulmonary artery, probably from dynamic compression and ischaemic arrhythmia"],
            ["Ostia in the ascending aorta", "Oxford lists it among the common types of anomalous origin; aortography shows the ostium and proximal course", "Engagement and catheter choice"],
            ["Left main or isolated LAD from the pulmonary artery", "Listed by Oxford among the rarer variants", "Rare"],
            ["Single coronary artery (under 0.1%)", "One ostium supplies the whole heart", "Forms below"],
          ],
        },
        {
          kind: "table",
          caption: "Forms of single coronary artery listed by Oxford",
          head: ["Code", "Arrangement"],
          rows: [
            ["L-I", "The left coronary supplies the whole heart; effectively no RCA"],
            ["L-II", "The RCA arises from the left coronary"],
            ["R-I", "The RCA supplies the whole heart"],
            ["R-II", "The left coronary arises from the RCA"],
            ["R-III", "The LAD and circumflex arise separately from the RCA"],
          ],
        },
        { kind: "h", text: "Finding and engaging an anomalous artery" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Read the history",
              detail:
                "Brilakis's planning checklist records anomalous origin of the left or right coronary from earlier procedures and the catheters that worked, and asks whether aortic CT angiography shows anomalous coronaries. Oxford lists defining anomalous origin and course, including fistulae, among the uses of cardiac CT.",
            },
            {
              title: "2. Notice what is missing",
              detail:
                "The commonest way to miss an anomalous circumflex is to fail to see that a region of myocardium has no supply. Small test injections can reveal anomalous origins and unusual take-offs (Oxford).",
            },
            {
              title: "3. Look on the other injections",
              detail: "Faint filling of the missing vessel on the RCA run, or the dot sign on the ventriculogram, places it.",
            },
            {
              title: "4. Image the sinus or the aorta",
              detail:
                "Cusp angiography or an ascending aortogram shows where the ostia are; Brilakis's aortogram is usually 60 mL over 3 seconds through a pigtail. Try an RAO view as well as the usual LAO. An aortogram may also show that the target artery is occluded at its ostium, which makes selective engagement unnecessary.",
            },
            {
              title: "5. Choose the catheter from the anatomy",
              detail:
                "There is no fixed rule. For a vessel from the right sinus a JR4 may work, but an Amplatz shape (AL or AR) is often needed; from the left sinus, a JL, sometimes of unusual size, or an AL. A JL3.5 suits a separate LAD origin. Multipurpose catheters can work but engage at an aggressive angle and can dissect. For PCI, a guide catheter extension can help when the guide cannot sit coaxially in an anomalous artery (Brilakis 30.3).",
            },
            {
              title: "6. Define the course",
              detail: "Coronary CT angiography clarifies the anatomy (Brilakis 5.7). A left coronary passing between the aorta and the pulmonary artery is the course linked with sudden death (Oxford).",
            },
            {
              title: "7. Know when to stop",
              detail:
                "Brilakis's failure-to-engage algorithm (5.7, Fig 5.20) runs from locating the ostia, through improving catheter control, changing curve size or adding a guide extension, to trying other shapes; those middle steps are taught in the engaging module (pm-engaging). Its last step is to stop when everything has failed and there is no emergency, particularly after a large contrast load, and define the anatomy with coronary CT instead.",
            },
          ],
        },
        {
          kind: "check",
          stem: "In a man with severe aortic stenosis being assessed before valve surgery, the left injection shows a large LAD but nothing supplies the lateral wall, even with the JL tip eased back. On the RCA run, a vessel fills faintly from the proximal RCA and heads behind the aorta. What is the most important next step?",
          options: [
            "Engage the anomalous circumflex selectively (an Amplatz shape is often needed) and image it fully",
            "Report a circumflex occlusion and ask the surgeon to graft the obtuse marginal territory",
            "Nothing further, because a retro-aortic circumflex is a benign variant that never develops disease",
            "Repeat the left injection with a larger volume, since streaming is hiding the circumflex",
          ],
          answer: 0,
          explanation:
            "This is the commonest anomaly: the circumflex arising from the proximal RCA or right sinus and running behind the aorta. Oxford warns that missing it leads to incomplete revascularisation or ligation during valve surgery. Oxford ties sudden death to an interarterial course of the left coronary, not to the retro-aortic circumflex, but this vessel can still carry a critical stenosis (its Fig 6.19 shows one found only on selective intubation) and is at risk at valve surgery. Calling it occluded, or leaving it unimaged, would be wrong.",
        },
        { kind: "h", text: "Fistulae" },
        {
          kind: "p",
          text: "A coronary fistula links a coronary artery straight to a heart chamber, the coronary sinus, the pulmonary artery, a pulmonary vein or a systemic vein, bypassing the capillaries (Brilakis). Oxford finds them usually draining to the pulmonary artery and less commonly to a cardiac chamber, and notes that the shunt is rarely large enough to matter haemodynamically. Most need no treatment. Brilakis reserves treatment for two situations: flow large enough to overload the right or left heart, and ischaemia from steal, where blood takes the low-pressure route through the fistula instead of through the coronary capillaries. Do not confuse a fistula with Ellis class 3 cavity spilling, which is a perforation into a chamber or the coronary sinus.",
        },
        { kind: "h", text: "Myocardial bridging" },
        {
          kind: "p",
          text: "A bridge is a short segment of a coronary artery that runs within the myocardium, most often in the mid LAD (Oxford). Ventricular contraction squeezes it during systole and it opens again in diastole, so the narrowing comes and goes with each beat, unlike a fixed plaque. Oxford found no good evidence that bridging causes ischaemia beyond the bridge, and its treatment is medical: beta-blockers or calcium channel blockers, which lessen LV hypertrophy and improve relaxation. Later work has qualified the ‘benign’ view: a 2021 JACC state-of-the-art review notes that bridges, traditionally considered benign, include subsets associated with ischaemic symptoms, and that invasive and non-invasive imaging and functional testing now allow them to be assessed. Brilakis lists bridging among the causes of a suboptimal FFR after PCI.",
        },
        {
          kind: "check",
          stem: "A mid LAD segment narrows to about 70% in systolic frames and looks normal in diastolic frames, in every projection. How should it be reported and managed according to Oxford?",
          options: [
            "A 70% fixed stenosis, measured in the frame where it looks tightest, and referred for PCI",
            "Catheter-tip spasm transmitted down the LAD, treated by withdrawing the catheter and giving nitrate",
            "Myocardial bridging, which Oxford treats medically with beta-blockers or calcium channel blockers",
            "A type B dissection, since the lumen changes calibre between frames, and stented to prevent extension",
          ],
          answer: 2,
          explanation:
            "Narrowing that appears in systole and disappears in diastole is the signature of a myocardial bridge. Oxford found no good evidence that bridging causes ischaemia and treats it medically with beta-blockers or calcium channel blockers; more recent work recognises that some bridges are linked with ischaemic symptoms and can be assessed functionally. Measuring a systolic frame as a fixed stenosis is the trap.",
        },
        { kind: "tip", id: "diag-anomalous-origin-image-first" },
        { kind: "tip", id: "diag-interp-anomalous-cx-search" },
        { kind: "tip", id: "diag-interp-every-territory" },
        {
          kind: "pitfalls",
          items: [
            "Calling the circumflex occluded when it arises from the right side.",
            "Cycling through catheters before a sinus injection or aortogram has shown where the ostium is.",
            "Pushing a multipurpose catheter hard into an anomalous ostium and dissecting it.",
            "Measuring a bridged segment in systole as a fixed stenosis.",
            "Treating every fistula: most need nothing.",
            "Not recording the anomaly and the catheters that worked, so the next operator starts again.",
          ],
        },
        {
          kind: "pearl",
          text: "Before valve surgery, make sure every territory has a named supplying vessel on your report. An anomalous circumflex that the surgeon does not know about can be tied off at the operation.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Practise the search for a missing artery: after the left and right injections, list which territories each has supplied. Then take a non-selective injection in the right sinus and compare it with the selective RCA run.",
        },
        { kind: "video", id: "Rel5KYzYKew", note: "Hanna: coronary artery anomalies, their angiography, illustrative cases and management." },
        { kind: "video", id: "oGJjg-xem3k", note: "Brilakis case 190: a heavily calcified and tortuous anomalous circumflex." },
        { kind: "video", id: "laYXNLAERKo", note: "Brilakis case 4: STEMI in an anomalous RCA." },
        { kind: "video", id: "2SDaJrW3gsE", note: "Brilakis case 198: the fistula." },
        {
          kind: "keypoints",
          items: [
            "Anomalies are found in 1–2% of angiograms; separate LAD and Cx ostia and an anterior RCA are normal variants.",
            "Commonest anomaly: circumflex from the proximal RCA or right sinus (0.2–0.7%), retro-aortic; look for the empty lateral wall and the dot sign.",
            "An interarterial course of an anomalous left coronary is linked with sudden death.",
            "Find the ostium first (sinus injection, aortogram 60 mL over 3 s, RAO view, CT), then choose the catheter; Amplatz shapes are often needed.",
            "Fistulae usually need no treatment; treat for volume overload or steal.",
            "Bridging: systolic narrowing of the mid LAD; Oxford treats it with beta-blockers or calcium channel blockers; some bridges are now known to cause ischaemic symptoms.",
            "If engagement fails after every step and there is no emergency, stop and use coronary CT.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-interpreting-q1",
      stem: "A circumflex lesion has a minimal lumen diameter of 1.2 mm, a proximal reference of 3.2 mm and a distal reference of 2.8 mm. Using Brilakis's method, what is the percentage diameter stenosis?",
      options: ["About 57%", "About 60%", "About 63%", "About 40%"],
      answer: 1,
      explanation:
        "The average reference is (3.2 + 2.8) ÷ 2 = 3.0 mm, and 100 × (1 − 1.2 ÷ 3.0) = 60%. Using only the distal reference gives about 57% and only the proximal about 63%. 40% is the fraction of the reference diameter that remains.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q2",
      stem: "In the FAME angiographic analysis reproduced by Brilakis, what proportion of lesions graded visually as 71–90% had an FFR of 0.80 or less?",
      options: ["About 35%", "About 50%", "About 80%", "About 96%"],
      answer: 2,
      explanation:
        "80% of lesions in the 71–90% band were functionally significant, so one in five was not. 35% is the figure for the 50–70% band and 96% for subtotal lesions. The point is that angiography misjudges significance outside the intermediate band too.",
      difficulty: 2,
      refs: [...BOOKS, "tonino-fame-angio-2010"],
    },
    {
      id: "pm-interpreting-q3",
      stem: "A diagnostic left coronary injection through a 4 Fr side-hole catheter in a patient with severe aortic stenosis shows faint, slowly filling vessels without reflux into the aorta. What is the best interpretation?",
      options: [
        "Diffuse TIMI 2 flow in all left coronary branches, suggesting microvascular disease in the territory",
        "Underfilling from the catheter and the high-flow state; change to a larger lumen without side holes, or call the run non-diagnostic",
        "Diffuse spasm of the left system provoked by the catheter, to be treated with repeated intracoronary nitrate boluses",
        "Left main disease limiting all flow, so take an aortic root injection and refer the patient for surgery",
      ],
      answer: 1,
      explanation:
        "Small (especially 4 Fr) and side-hole catheters, high-flow states such as severe aortic stenosis, and weak injections all prevent full opacification. Brilakis's remedies are a larger lumen, no side holes and a stronger injection, and if the artery still cannot be filled he would rather call the angiogram non-diagnostic. Grading TIMI flow from such a run is the trap.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q4",
      stem: "Which finding is Brilakis's angiographic definition of severe coronary calcification?",
      options: [
        "Densities involving less than half the reference diameter, seen mainly as the heart moves before contrast",
        "Radio-opacities on both sides of the arterial wall that are visible without cardiac motion before contrast",
        "A calcium arc of more than 180° on intravascular ultrasound or optical coherence tomography",
        "Any opacity along the vessel that becomes visible only after contrast has been injected into it",
      ],
      answer: 1,
      explanation:
        "Severe calcium is seen on both walls without cardiac motion, before contrast. Densities seen mainly with cardiac motion are Brilakis's moderate calcium. On imaging, more than 270° of arc is severe and 180–270° moderate, so 180° describes moderate rather than severe calcium.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q5",
      stem: "After predilatation, a spiral filling defect extends down the mid and distal LAD with dense staining of a false lumen; antegrade flow is preserved. What is the NHLBI type?",
      options: ["Type B", "Type C", "Type D", "Type F"],
      answer: 2,
      explanation:
        "A spiral dissection, usually with heavy staining of the false lumen, is type D (Brilakis Fig 6.6 shows one in the LAD). Type C is a persistent extraluminal cap, type B parallel tracks without persistence, and type F an occlusion with no distal flow.",
      difficulty: 1,
      refs: [...BOOKS, "nhlbi-dissection-1991"],
    },
    {
      id: "pm-interpreting-q6",
      stem: "A patient with a recent inferior STEMI has an occluded RCA and an occluded LAD. The LAD fills completely from RCA septal branches on an old film; today the RCA is occluded with a hazy, convex meniscus and no collaterals fill its distal bed. Which reading is best supported?",
      options: [
        "The LAD is the culprit, because complete collateral filling shows that its occlusion is the more severe one",
        "The RCA is the likely culprit: absent collaterals and a hazy meniscus point to an acute occlusion",
        "Neither can be the culprit until the CTO territory has been assessed with a pressure wire",
        "Both are chronic, because an acute occlusion cannot coexist with a chronic total occlusion",
      ],
      answer: 1,
      explanation:
        "Brilakis lists poor or no collaterals and thrombus among culprit clues, and notes that in ACS collaterals may not have had time to form. A smooth convex meniscus at an occlusion is an angiographic sign of thrombus (Brilakis lists it under possible thrombus), although an occluded vessel is graded TIMI thrombus grade 5 until flow is restored. The old film already showed the LAD occluded, so it is the chronic lesion; collaterals alone would not have dated it. Physiology is not used in ACS culprits or in CTO vessels.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q7",
      stem: "An RCA chronic total occlusion is imaged by left coronary injection alone. The occluded segment appears 45 mm long. Why might this overestimate the length, and what corrects it?",
      options: [
        "Foreshortening in LAO lengthens the segment; correct it by repeating the same run in a steeper LAO view",
        "Competing antegrade and retrograde flow underfill the distal vessel; dual injection or CT defines the true distal cap",
        "Contrast streaming exaggerates every occlusion; correct it by injecting a larger volume into the left system",
        "Spasm of the distal vessel shortens the visible lumen; correct it with intracoronary nitrate given down the left system",
      ],
      answer: 1,
      explanation:
        "Brilakis explains that antegrade-only injections overestimate CTO length because the distal vessel is underfilled where antegrade and retrograde flow compete, leaving the distal cap uncertain. Dual injection, or CT before the procedure, shows the cap and length accurately. Foreshortening makes a segment look shorter, not longer.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q8",
      stem: "A patient's systolic pressure is 108 mmHg, there is no right ventricular infarction or outflow obstruction, and no PDE-5 inhibitor has been taken. Which routine pre-angiography intracoronary nitroglycerin dose does Brilakis's chapter 6 scheme give?",
      options: ["50 µg", "100 µg", "200 µg", "300 µg"],
      answer: 1,
      explanation:
        "The chapter 6 scheme is 200 µg above 120 mmHg, 100 µg at 100–120 mmHg and 50 µg or none below 100 mmHg, followed by a 1–2 minute wait. 300 µg lies outside that scheme. Brilakis gives 100–300 µg as the general intracoronary dose in his drug chapter (3.2) and for treating spasm (25.2), so the manual is not internally consistent; follow local protocol.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q9",
      stem: "In which pair of situations does Brilakis say a coronary fistula needs treatment?",
      options: [
        "Whenever it drains into the coronary sinus or a cardiac chamber, and whenever a murmur can be heard",
        "When flow causes right- or left-sided volume overload, or when steal through it causes ischaemia",
        "Whenever it is found on angiography in a patient who also has obstructive coronary disease",
        "Only when it is larger than the coronary artery that feeds it, or the patient is younger than 40",
      ],
      answer: 1,
      explanation:
        "Most fistulae need no treatment; Brilakis reserves it for large flow that overloads the right or left heart and for ischaemia from steal, blood preferring the low-pressure fistula to the coronary capillaries. Oxford adds that the shunt is rarely haemodynamically important. Neither manual sets size, age or drainage site rules.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q10",
      stem: "After primary PCI the infarct artery has TIMI 3 flow, but its territory shows no myocardial blush on a run continued well into washout. Which statement is supported by the van 't Hof study?",
      options: [
        "Blush adds nothing once TIMI 3 flow has been restored, because epicardial flow determines prognosis",
        "Blush grade predicted long-term mortality independently of TIMI flow; grades 0/1 had 23% mortality against 3% for grade 3",
        "Absent blush with TIMI 3 flow indicates a perforation, since contrast is leaving the vessel without staining",
        "Absent blush is an artefact of continuing the run too long, which washes out the myocardial contrast",
      ],
      answer: 1,
      explanation:
        "In 777 primary angioplasty patients, myocardial blush grade predicted long-term mortality independently of TIMI flow, Killip class and ejection fraction, with mortality of 3%, 6% and 23% for grades 3, 2 and 0/1. Recording well into washout is how blush is graded, not an artefact. A perforation's blush is contrast outside the vessel, a different finding.",
      difficulty: 3,
      refs: [...BOOKS, "vanthof-mbg-1998"],
    },
    {
      id: "pm-interpreting-q11",
      stem: "An RCA CTO is collateralised by septal and epicardial channels. Which feature does Brilakis identify as the most important predictor of crossing a collateral with a wire and devices?",
      options: [
        "The collateral's size on the Werner scale, with CC2 channels always preferred",
        "Lack of tortuosity, followed by size",
        "The Rentrop grade of the recipient vessel, with grade 3 required",
        "How far the collateral's exit lies from the distal cap",
      ],
      answer: 1,
      explanation:
        "Brilakis states that lack of tortuosity is the most important predictor, followed by size. Distance to the distal cap, entry and exit angles, branching and stent jailing all matter too, but they rank below. The Rentrop grade describes how much of the recipient fills, not whether a channel can be crossed.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-interpreting-q12",
      stem: "On the left ventriculogram a small round opacity appears, a vessel seen end-on, and the left coronary injection shows no vessel supplying the lateral wall. What does Oxford call this finding and what does it suggest?",
      options: [
        "The ‘dot’ sign: an anomalous circumflex arising from the right side, seen end-on",
        "Super-selective LAD engagement past a short left main, the circumflex stump seen end-on",
        "A coronary fistula draining into a cardiac chamber, its drainage point seen end-on",
        "An anomalous RCA from the left sinus, seen end-on between the aorta and pulmonary artery",
      ],
      answer: 0,
      explanation:
        "Oxford describes the dot sign at ventriculography, the anomalous circumflex seen end-on, as one of the two ways the anomaly declares itself, the other being an unsupplied lateral wall. A short left main explains a missing circumflex on the left injection, but a JL one size larger will usually engage it, and it is not an end-on vessel on the ventriculogram. Oxford finds fistulae usually draining to the pulmonary artery, and an anomalous RCA does not leave the lateral wall without a supplying vessel.",
      difficulty: 2,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "cathlab", task: "Image the left and right coronaries in at least two orthogonal views each, give nitroglycerin by systolic pressure before the first run, and before finishing list which artery supplies each territory." },
    { sim: "views", task: "Find, for the proximal LAD, the mid RCA and the left main, the view that shows the segment without overlap or foreshortening." },
    { sim: "pci-bench", task: "Size a balloon and stent from the averaged proximal and distal reference diameters rather than from one end of the lesion." },
  ],
  caseIds: ["pm-interpreting-case-missing-cx", "pm-interpreting-case-inferior-stemi"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-interpreting-case-missing-cx",
    title: "The ostial RCA lesion and the missing circumflex",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 3.2, 5.7, 6.3, 6.6, 6.8 and 25.2; Oxford Handbook, chapter 6 (use of nitrates, quantification of stenoses, common pitfalls, unusual coronary anatomy)",
    },
    summary: "A diagnostic study before aortic valve surgery in which catheter-tip spasm mimics an ostial RCA stenosis and an anomalous circumflex is nearly reported as occluded.",
    presentation:
      "A 66-year-old woman, 1.55 m and 54 kg, with severe aortic stenosis is referred for coronary angiography before surgical valve replacement. She has exertional breathlessness and occasional chest tightness. No previous angiography.",
    findings: ["Blood pressure 134/72 mmHg, sinus rhythm 70/min", "Right radial access with a 6 Fr sheath", "No PDE-5 inhibitor use; not on nitrates"],
    steps: [
      {
        id: "s0",
        prompt: "The aortic trace is free. Before the first coronary run, what do you do about intracoronary nitroglycerin?",
        info: "Systolic pressure 134 mmHg. Aortic stenosis is severe.",
        options: [
          {
            text: "Give a reduced intracoronary dose (100 µg or less) after engaging with a free trace, watch the arterial pressure, and wait 1–2 minutes before acquiring",
            best: true,
            feedback:
              "Brilakis gives routine intracoronary nitroglycerin before angiography unless there is a contraindication, dosed by systolic pressure, but his scheme does not address aortic stenosis. He withholds nitroglycerin in hypertrophic obstructive cardiomyopathy, where it worsens outflow obstruction, and warns against high and repeated doses. With a severe fixed outflow obstruction, a reduced dose with the pressure watched closely is the cautious choice (typical practice; follow local protocol). Waiting 1–2 minutes lets the vasodilatation develop.",
          },
          {
            text: "Give 200 µg intracoronary after engaging with a free trace, as the systolic pressure is above 120 mmHg",
            acceptable: true,
            feedback:
              "This follows the pressure bands of Brilakis's chapter 6 scheme, but that scheme was not written with severe aortic stenosis in mind, and Brilakis advises against high and repeated doses. Watch the pressure closely; if it falls, give no more, give saline and wait, and use a vasopressor if it is extreme or persistent.",
            stateDelta: { stability: -3 },
          },
          {
            text: "Skip nitroglycerin and start acquiring straight away to save time",
            feedback: "Without nitrate, spasm can be read as fixed disease and vessel sizes understated. Brilakis makes it a routine step unless contraindicated.",
            stateDelta: { stability: -5, flags: ["no-nitrate"] },
          },
        ],
      },
      {
        id: "s1",
        prompt:
          "A JR4 is turned into the RCA. Within a few seconds the trace ventricularises and then keeps falling. A test puff given just before the fall showed a tight, smooth narrowing at the ostium of a small RCA. What now?",
        variants: [{ flag: "no-nitrate", info: "No nitroglycerin has been given yet." }],
        options: [
          {
            text: "Withdraw until the aortic trace returns, re-engage gently and coaxially with a free trace, give intracoronary nitroglycerin, wait, then image the ostium",
            best: true,
            feedback:
              "Ventricularisation followed by a further fall, in a small RCA about the size of the catheter in a small patient, is Oxford's picture of catheter-tip spasm. Withdraw first; nothing goes through a wedged catheter. Then careful re-engagement, intracoronary nitrate with an undamped trace, a 1–2 minute wait, and an image documenting relief.",
          },
          {
            text: "Take the LAO and RAO runs now to document the ostial stenosis while the catheter is engaged",
            next: "c-inject",
            feedback: "Injecting through a ventricularised catheter risks dissection and ischaemia, and the narrowing may not be disease at all.",
            stateDelta: { stability: -25, flags: ["ostial-injection"] },
          },
          {
            text: "Report a severe ostial RCA stenosis and move on to the left coronary",
            next: "c-report",
            feedback: "Calling it disease before excluding spasm is the error the nitrate step exists to prevent.",
            stateDelta: { stability: -10, flags: ["spasm-reported"] },
          },
        ],
      },
      {
        id: "c-inject",
        kind: "consequence",
        prompt: "During the injection she becomes bradycardic and complains of chest pain; the inferior leads show ST elevation. What do you do?",
        info: "Heart rate 42/min, blood pressure 92/54 mmHg.",
        options: [
          {
            text: "Stop injecting, withdraw the catheter from the ostium, and look for dissection or staining on a gentle injection from outside the ostium",
            best: true,
            feedback: "Remove the obstruction first. A catheter that obstructs flow causes hypotension and arrhythmia, and Brilakis's remedy is to withdraw it. Then look for a dissection before going further.",
          },
          {
            text: "Inject again to define what has happened",
            feedback: "More contrast through a wedged catheter worsens ischaemia and may extend a dissection.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-report",
        kind: "consequence",
        prompt: "The attending reviews the runs and asks why the ventricularised trace and the smooth ostial narrowing were not tested with nitrate. What do you do?",
        options: [
          {
            text: "Re-engage the RCA gently with a free trace, give intracoronary nitroglycerin, wait and repeat the ostial view, documenting the result",
            best: true,
            feedback: "If the narrowing resolves it was spasm; the recorded image prevents a wrong report and an unnecessary operation on the RCA.",
          },
          {
            text: "Keep the report; the surgeon can graft the RCA anyway during the valve operation",
            feedback: "Exclude spasm first: otherwise a normal RCA may be grafted unnecessarily at the valve operation.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "After nitrate and careful re-engagement, the RCA ostium is smooth and normal. You change to a JL3.5 for the left coronary. The run shows a large LAD and diagonals, but no vessel reaches the lateral wall. The trace is free. What next?",
        options: [
          {
            text: "Ease the tip back and take another view; if no circumflex appears, consider a JL one size larger and look at the RCA run for a vessel arising there",
            best: true,
            feedback:
              "A missing circumflex may be selective LAD engagement past a short left main (one JL size up usually finds it) or an anomalous origin from the right side. Both must be excluded before anyone writes ‘occluded’.",
          },
          {
            text: "Report an occluded circumflex at its origin and recommend grafting of the obtuse marginal territory",
            next: "c-occluded",
            feedback: "An empty lateral wall is not proof of occlusion. An anomalous or super-selectively missed vessel must be excluded first.",
            stateDelta: { stability: -15, flags: ["cx-misread"] },
          },
          {
            text: "Proceed directly to the ventriculogram and finish the study",
            feedback: "The ventriculogram may show the dot sign, but finishing without searching for the vessel risks missing it: Oxford warns that an anomalous circumflex is overlooked when nobody notices an unsupplied territory, and a JL one size larger normally finds a circumflex hidden by a short left main.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-occluded",
        kind: "consequence",
        prompt: "The surgeon calls: the planned graft target is unclear, and she asks whether you are sure the circumflex is occluded. What do you do?",
        options: [
          {
            text: "Review the RCA and ventriculogram runs for faint filling or a dot sign, and offer to re-study with a sinus injection",
            best: true,
            feedback: "Oxford: anomalous anatomy, commonly an anomalous circumflex, is missed when nobody notices an unsupplied territory. Reviewing the stored runs is essential.",
          },
          {
            text: "Confirm the report; there was no circumflex on the left injection",
            feedback: "An anomalous circumflex missed before valve surgery can be ligated at operation.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "Review of the RCA run shows a vessel filling faintly from the proximal RCA and heading behind the aorta. The left ventriculogram shows a small round opacity, a vessel seen end-on. How do you image it?",
        options: [
          {
            text: "Take a right sinus injection to find its ostium, then engage it selectively, often with an Amplatz shape, and image it in two views",
            best: true,
            feedback: "Find the ostium first, then choose the catheter. Oxford: from the right sinus a JR4 may work, but an AL or AR shape is often needed.",
          },
          {
            text: "Engage it with a multipurpose catheter pushed firmly into the proximal RCA for a stable position",
            next: "c-mp",
            feedback: "Multipurpose catheters can work but engage at an aggressive angle and can dissect, particularly when pushed.",
            stateDelta: { stability: -20, flags: ["anomaly-dissection"] },
          },
          {
            text: "Leave it: a retro-aortic circumflex is benign and needs no imaging",
            feedback: "Oxford links sudden death with an interarterial left coronary, not with this retro-aortic course, but the vessel can still carry a critical stenosis (Oxford Fig 6.19) and is at risk of ligation at valve surgery, so the surgeon needs to know where it runs.",
            stateDelta: { stability: -10, flags: ["cx-unimaged"] },
          },
        ],
      },
      {
        id: "c-mp",
        kind: "consequence",
        prompt: "After the forceful engagement, contrast lingers in the wall of the proximal anomalous vessel after washout. The trace is now damped. What do you do?",
        info: "Blood pressure 118/66 mmHg, no chest pain yet.",
        options: [
          {
            text: "Stop injecting, withdraw the catheter gently, and assess flow with a gentle injection from the sinus; call for help in case stenting is needed",
            best: true,
            feedback: "Persistent staining after washout is a dissection (NHLBI type C). Stop injecting through the damped catheter, back off, and assess flow; a flow-limiting dissection needs wiring and stenting.",
          },
          {
            text: "Inject again firmly to see whether the stain clears",
            feedback: "Forceful injection into a damped catheter extends a dissection.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Selective injection of the anomalous circumflex in two views shows a proximal narrowing: 75% in one view and 50% in the orthogonal view. How do you report it?",
        options: [
          {
            text: "As about 75%, the worse view, noting it is eccentric, with a recommendation that physiology or imaging could refine its significance",
            best: true,
            feedback: "Report the view in which the lesion looks worst and least foreshortened. Percentage stenosis alone is a limited guide to significance; Brilakis prefers physiology to decide on intervention.",
          },
          {
            text: "As about 62%, the average of the two views",
            feedback: "Averaging an eccentric lesion understates it.",
            stateDelta: { stability: -5 },
          },
          {
            text: "As 50%, because the orthogonal view is the more reliable of the two",
            feedback: "Neither view is more reliable; the eccentric lumen is narrowest in the worse view.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "What must the report contain for the surgical team and the next operator?",
        options: [
          {
            text: "The anomalous origin and retro-aortic course, the lesion and its severity, the normal RCA after nitrate, and the catheters that engaged each vessel",
            best: true,
            feedback: "The surgeon must know about a retro-aortic circumflex to avoid it during valve replacement, and recording the catheters saves the next operator from repeating the search.",
          },
          {
            text: "The stenosis severity only; anatomical details are for the surgeon to find at operation",
            feedback: "Oxford warns that an overlooked anomalous circumflex can be ligated during valve replacement.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The RCA was normal once catheter-tip spasm was relieved. The circumflex arose from the proximal RCA and ran behind the aorta, with an eccentric proximal stenosis. The heart team planned valve replacement with knowledge of the anomalous course and assessment of the circumflex lesion.",
    outcomeVariants: [
      { flag: "spasm-reported", text: "An initial report of ostial RCA disease had to be corrected after nitrate." },
      { flag: "ostial-injection", text: "Injection through the ventricularised catheter caused transient ischaemia and bradycardia." },
      { flag: "cx-misread", text: "The circumflex was briefly reported as occluded, which would have misdirected the surgical plan." },
      { flag: "anomaly-dissection", text: "Forceful multipurpose engagement dissected the anomalous vessel." },
      { flag: "cx-unimaged", text: "Leaving the anomalous circumflex unimaged would have missed its proximal lesion." },
    ],
    learningPoints: [
      "Give nitrate before angiography unless contraindicated, dosed by systolic pressure, and wait 1–2 minutes; with a fixed outflow obstruction such as severe aortic stenosis, give less and watch the pressure.",
      "Ventricularisation that keeps falling in a small RCA is catheter-tip spasm: withdraw, re-engage carefully, give nitrate, document.",
      "An empty lateral wall means a short left main, an anomalous circumflex or a flush occlusion; never assume occlusion.",
      "Find an anomalous ostium with a sinus injection before choosing a catheter; Amplatz shapes are often needed and multipurpose catheters can dissect.",
      "Report an eccentric lesion from its worst view.",
      "Record the anomaly and the catheters that worked for the surgeon and the next operator.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-interpreting-case-inferior-stemi",
    title: "Two occlusions, one culprit",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 6.6, 6.8, 7.2, 9.2, 9.8, 10.2, 20.7, 20.8 and 21.6; Oxford Handbook, chapter 6 (common pitfalls) and chapter 8 (the no-reflow phenomenon)",
    },
    summary: "Primary PCI for an inferior STEMI in a patient who also has an old LAD occlusion: reading collaterals and thrombus to find the culprit, then grading flow and recognising a dissection.",
    presentation:
      "A 61-year-old man presents 3 hours after the onset of chest pain with inferior ST elevation. He had an anterior myocardial infarction treated medically several years ago in another country. Femoral access is used.",
    findings: ["Blood pressure 108/70 mmHg, heart rate 64/min", "ST elevation in II, III and aVF", "Echo: anterior wall thinned and akinetic; inferior wall hypokinetic"],
    steps: [
      {
        id: "s0",
        prompt:
          "An angiogram sent from the other hospital, taken at the time of his anterior infarction, shows the LAD occluded proximally with its distal vessel filling completely from RCA septal collaterals. Today the left injection shows the same proximal LAD occlusion, the distal LAD now filling only faintly and late through epicardial collaterals from the circumflex. The RCA is occluded in its mid segment with a hazy, smooth convex edge, and no collaterals fill its distal bed. Which artery is the culprit?",
        options: [
          {
            text: "The RCA: an acute-looking occlusion with a meniscus, no collaterals, and an inferior territory matching the ECG",
            best: true,
            feedback:
              "Brilakis's culprit clues include the ECG territory, wall motion, thrombus and poor or no collaterals, weighed together. The old film shows that the LAD was already occluded years ago, and its territory is thinned and akinetic: the old infarct. Note too that the RCA was the LAD's main collateral donor on the old film, so its occlusion also leaves the LAD territory more poorly supplied.",
          },
          {
            text: "The LAD, because a proximal LAD occlusion always takes priority over a mid RCA occlusion",
            next: "c-wrong-culprit",
            feedback: "The old film shows the LAD occlusion is the chronic one, supplying a scarred wall. Treating it first delays reperfusion of the inferior wall.",
            stateDelta: { stability: -20, flags: ["wrong-culprit"] },
          },
          {
            text: "Measure FFR in both vessels first to decide",
            feedback: "Physiology is not used in ACS culprit lesions, and the CTO territory is ischaemic whatever its collaterals; it would only delay reperfusion.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-wrong-culprit",
        kind: "consequence",
        prompt: "Twenty minutes into failed wiring of the LAD, the inferior ST elevation is worse and the pressure is 88/56 mmHg. What now?",
        options: [
          {
            text: "Stop the LAD attempt and reperfuse the RCA",
            best: true,
            feedback: "The ongoing inferior infarction is the priority. The LAD occlusion is chronic, with its own planning needs (dual injection, CTO strategy).",
          },
          {
            text: "Escalate to stiffer wires in the LAD",
            feedback: "Escalating on a chronic occlusion during a STEMI wastes the time the RCA territory needs.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s1",
        prompt: "How would you grade the RCA thrombus and flow on the diagnostic run?",
        options: [
          {
            text: "TIMI flow 0 with TIMI thrombus grade 5 (total occlusion)",
            best: true,
            feedback: "No contrast passes the occlusion (TIMI flow 0), and a total occlusion is TIMI thrombus grade 5. The hazy convex edge is a sign of thrombus, but it does not change the grade of an occluded vessel.",
          },
          {
            text: "TIMI flow 1 with TIMI thrombus grade 1, since the edge is only hazy",
            feedback: "Grade 1 thrombus is possible thrombus; a total occlusion is grade 5. Flow 1 needs contrast beyond the obstruction.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt:
          "After wiring and a small balloon, the RCA opens. A filling defect about three vessel diameters long persists at the lesion, and the distal bed fills completely, but filling and clearance are clearly slower than in the circumflex on the left injection. What are the thrombus and flow grades, and what is reasonable next?",
        options: [
          {
            text: "TIMI thrombus grade 4 and TIMI 2 flow; large thrombus persisting after balloon dilatation is where bail-out aspiration is reasonable before stenting",
            best: true,
            feedback: "Definite thrombus of two vessel diameters or more is grade 4. Complete but slower filling than an uninvolved bed is TIMI 2. Brilakis's algorithm notes that thrombectomy is often performed for large thrombus, but the 2023 ESC guideline does not recommend routine aspiration (TOTAL found no clinical benefit and more strokes); large thrombus that persists after wiring or balloon dilatation is the bail-out setting in which it remains an option.",
          },
          {
            text: "TIMI thrombus grade 2 and TIMI 3 flow; stent directly",
            feedback: "Grade 2 is thrombus no longer than half a vessel diameter, and filling slower than a comparison bed is TIMI 2.",
            stateDelta: { stability: -10, flags: ["undergraded"] },
          },
          {
            text: "TIMI thrombus grade 3 and TIMI 1 flow; give vasodilators and wait",
            feedback: "Grade 3 ends below two diameters, and TIMI 1 means the distal bed never fills completely. Here it fills.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt:
          "After thrombus aspiration, the stent will not cross the tight residual lesion easily, and as it is pushed the distal RCA disappears from view. The patient is stable. What do you do?",
        options: [
          {
            text: "Pull the stent back, inject until contrast lies beyond the lesion, then re-advance so the stent traps it, and look again",
            best: true,
            feedback: "Brilakis lists a stent crossing a tight lesion as a cause of lost distal visualisation; trapping contrast distally restores the road map. If dissection, embolisation or spasm is the cause, treat that instead.",
          },
          {
            text: "Keep pushing the stent forward until it crosses, then deploy it where the markers are",
            next: "c-push",
            feedback: "Forceful advancement through resistance risks stent loss and losing the guide position, and you are now deploying blind.",
            stateDelta: { stability: -20, flags: ["blind-deploy"] },
          },
        ],
      },
      {
        id: "c-push",
        kind: "consequence",
        prompt: "The guide backs out of the RCA ostium as you push, and the stent is now partly across the lesion. What first?",
        options: [
          {
            text: "Stop pushing, re-engage the guide with the wire held in place, and confirm the stent and distal wire positions before doing anything else",
            best: true,
            feedback: "Brilakis: watch the guide and the distal wire whenever a stent is advanced or withdrawn, and re-engage before going further.",
          },
          {
            text: "Deploy the stent where it is to avoid losing it",
            feedback: "A stent deployed short of the lesion leaves the lesion untreated and may need further stents.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4",
        prompt:
          "The stent is deployed. On the final run, a linear lucency runs beyond the distal stent edge, with a cap of contrast that persists after washout; distal flow is now TIMI 2. Which description and step is correct?",
        options: [
          {
            text: "An NHLBI type C edge dissection limiting flow; it needs stenting rather than vasodilators",
            best: true,
            feedback: "Persistent extraluminal staining is type C. Poor flow caused by a dissection is treated by stenting it (Brilakis 9.8).",
          },
          {
            text: "No-reflow from embolised thrombus; give a microvascular vasodilator through a microcatheter",
            next: "c-missed-dissection",
            feedback: "No-reflow is poor flow without a mechanical obstruction. Here there is one: a dissection.",
            stateDelta: { stability: -20, flags: ["missed-dissection"] },
          },
          {
            text: "An NHLBI type A dissection, which needs no treatment because contrast does not persist",
            feedback: "Type A leaves nothing behind after washout; this one has a persistent cap.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-missed-dissection",
        kind: "consequence",
        prompt: "After the vasodilator the flow is unchanged and the stain has lengthened. The patient has recurrent pain. What now?",
        options: [
          {
            text: "Recognise the dissection and stent the distal edge to cover it",
            best: true,
            feedback: "A flow-limiting dissection needs stenting; vasodilators cannot treat a mechanical cause.",
          },
          {
            text: "Repeat the vasodilator at a higher dose",
            feedback: "More drug does not seal a dissection, and the stain is extending.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt:
          "After an additional stent at the distal edge, the RCA fills and clears as briskly as the circumflex. On the deliberately prolonged final run, the inferior wall briefly becomes denser and then clears. How do you document the result?",
        options: [
          {
            text: "TIMI 3 flow with normal myocardial blush, noting the collateralised LAD occlusion as a chronic lesion for separate planning",
            best: true,
            feedback:
              "Flow as brisk as the comparison bed is TIMI 3; a blush that appears and clears is normal tissue perfusion. The old LAD occlusion needs its own assessment, including dual injection, if treatment is ever considered.",
          },
          {
            text: "TIMI 3 flow; blush is not reported because it cannot be graded on a long run",
            feedback: "A long run is exactly how blush is graded (Oxford); blush grade predicts outcome independently of TIMI flow.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The RCA was the culprit and was reperfused with TIMI 3 flow and a normal blush after bail-out thrombus aspiration and stenting, including a second stent for a distal edge dissection. The chronic LAD occlusion, collateralised from the RCA on the old film and faintly from the circumflex today, was documented for later assessment.",
    outcomeVariants: [
      { flag: "wrong-culprit", text: "Time spent on the old LAD occlusion delayed reperfusion of the inferior wall." },
      { flag: "undergraded", text: "The thrombus was under-graded, so stenting was attempted before the large thrombus was dealt with." },
      { flag: "blind-deploy", text: "Pushing the stent blindly cost the guide position." },
      { flag: "missed-dissection", text: "A dissection was mistaken for no-reflow and treated with drugs before it was stented." },
    ],
    learningPoints: [
      "Collaterals help but do not date an occlusion on their own: Brilakis reads collateral filling as compatible with acute or chronic occlusion, and lists poor or absent collaterals as one culprit clue to weigh with the ECG, wall motion, thrombus, contrast staining and ease of wiring. An old film is the strongest evidence of age.",
      "TIMI flow and TIMI thrombus grades are separate scales; grade both on each run.",
      "Brilakis notes that large thrombus often leads to thrombectomy, but routine aspiration is not recommended (2023 ESC, TOTAL); keep it for bail-out when large thrombus persists after wiring or balloon dilatation.",
      "When the distal vessel disappears as a stent crosses a tight lesion, trap contrast distally to restore the road map.",
      "Persistent staining after washout is a type C dissection; poor flow from a dissection is stented, not treated with vasodilators.",
      "Grade blush on a long final run.",
    ],
    refs: [...BOOKS, "gibson-timi-thrombus-2001", "nhlbi-dissection-1991", "vanthof-mbg-1998", "esc-acs-2023", "total-2015"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "diag-interp-orthogonal-worst-view",
    lab: "diagnostic",
    when: { phase: ["views"] },
    title: "Grade every lesion in two orthogonal views",
    text: "Show each lesion in at least two views, ideally at right angles, free of overlap and with the least foreshortening. Report the stenosis from the view in which it looks worst; an eccentric lumen looks mild from one side.",
    tone: "do",
    lessonId: "pm-interpreting-stenosis",
    sources: [
      { book: "brilakis-pci", loc: "6.8" },
      { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-interp-qca-calibrate",
    lab: "pci",
    when: { phase: ["plan"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "QCA: calibrate, then measure in a clean view",
    text: "Calibrate QCA on the catheter's known diameter, and measure in a frame with no overlap or foreshortening. Take the average of the proximal and distal reference diameters, and measure length from normal segment to normal segment.",
    tone: "do",
    lessonId: "pm-interpreting-stenosis",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
      { book: "brilakis-pci", loc: "6.8" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-interp-grade-flow",
    lab: "pci",
    when: { event: ["slow-flow", "no-reflow"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Grade the flow and look for a mechanical cause",
    text: "Grade TIMI flow against the proximal segment or the opposite artery on a well-filled run, and keep filming through washout to judge blush. Look for a dissection first: poor flow from a dissection is stented, not treated with vasodilators.",
    tone: "caution",
    lessonId: "pm-interpreting-flow",
    sources: [
      { book: "brilakis-pci", loc: "6.8" },
      { book: "brilakis-pci", loc: "9.8" },
      { book: "oxford-cath", loc: "ch 8: The no-reflow phenomenon" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-interp-lost-distal-vessel",
    lab: "pci",
    when: { phase: ["stent"], event: ["slow-flow"] },
    title: "Distal vessel lost as the stent crosses",
    text: "If the distal vessel disappears while a stent crosses a tight lesion, pull it back, inject until contrast lies beyond the lesion, and re-advance so the stent traps it. If the cause is dissection, stent it; if spasm, give intracoronary nitroglycerin.",
    tone: "bailout",
    lessonId: "pm-interpreting-flow",
    sources: [{ book: "brilakis-pci", loc: "10.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-interp-fill-or-call-nondiagnostic",
    lab: "diagnostic",
    when: { event: ["contrast-streaming"] },
    title: "Fill the artery or call the run non-diagnostic",
    text: "Inject enough to fill the artery for about 3 beats with reflux into the aorta (Oxford: typically 5–10 mL left, 3–5 mL right). If small or side-hole catheters, poor engagement or a large vessel still defeat you, use a bigger lumen; if it still cannot be filled, call it non-diagnostic rather than guess.",
    tone: "caution",
    lessonId: "pm-interpreting-pitfalls",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
      { book: "brilakis-pci", loc: "6.6" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "diag-interp-ostium-from-outside",
    lab: "diagnostic",
    when: { event: ["catheter-too-deep"] },
    title: "A deep tip hides the ostium",
    text: "With the catheter deep in the artery, an ostial lesion lies behind the tip and is never opacified. If in doubt, ease back and acquire a run with the tip in the sinus.",
    tone: "caution",
    lessonId: "pm-interpreting-pitfalls",
    sources: [{ book: "oxford-cath", loc: "ch 6: Catheter manipulation" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "pci-interp-pseudolesion",
    lab: "pci",
    when: { phase: ["wire"], event: ["new-narrowing"] },
    title: "New narrowings after wiring a tortuous vessel",
    text: "Stiff wires straighten a tortuous artery and can provoke spasm or pseudolesions. Give intracoronary nitrate to exclude spasm (it will not correct a pseudolesion). Removing the equipment treats a pseudolesion, but make sure there is no dissection (for example with IVUS) before you take it out.",
    tone: "caution",
    lessonId: "pm-interpreting-pitfalls",
    sources: [
      { book: "brilakis-pci", loc: "25.2" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-interp-thrombus-grade",
    lab: "pci",
    when: { event: ["thrombus"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Grade the thrombus before choosing the next device",
    text: "TIMI thrombus grade: 1 possible, 2 up to half a vessel diameter, 3 more than half but under two diameters, 4 two diameters or more, 5 total occlusion. A filling defect can also be a calcified nodule. Routine aspiration is not recommended (2023 ESC, TOTAL); keep it for bail-out when a large thrombus persists after wiring or balloon dilatation.",
    tone: "do",
    lessonId: "pm-interpreting-morphology",
    sources: [
      { book: "brilakis-pci", loc: "6.8" },
      { book: "brilakis-pci", loc: "9.2" },
    ],
    refs: ["brilakis-manual-pci", "gibson-timi-thrombus-2001", "esc-acs-2023", "total-2015"],
  },
  {
    id: "pci-interp-calcium-look-first",
    lab: "pci",
    when: { phase: ["plan", "lesion-prep"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Look for calcium before the contrast arrives",
    text: "Opacities on both walls that are visible without cardiac motion before contrast are severe calcification; densities involving less than half the reference diameter, often seen only while the heart moves, are moderate. Angiography underestimates calcium, so use multiple views and IVUS or OCT (an arc over 180°, thickness over 0.5 mm and length over 5 mm predict underexpansion). Never stent a heavily calcified lesion without preparation, and confirm balloon expansion first.",
    tone: "do",
    lessonId: "pm-interpreting-morphology",
    sources: [
      { book: "brilakis-pci", loc: "6.8" },
      { book: "brilakis-pci", loc: "19" },
      { book: "brilakis-pci", loc: "19.9" },
      { book: "brilakis-pci", loc: "19.13" },
      { book: "brilakis-pci", loc: "9.9" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-interp-dissection-nhlbi",
    lab: "pci",
    when: { event: ["dissection"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Name the dissection type after washout",
    text: "Film until the contrast has cleared. Lucency without persistence is type A, parallel tracks type B, a persistent extraluminal cap type C, a spiral with false-lumen staining type D, persistent filling defects type E, and occlusion type F.",
    tone: "do",
    lessonId: "pm-interpreting-morphology",
    sources: [{ book: "brilakis-pci", loc: "6.8" }],
    refs: ["brilakis-manual-pci", "nhlbi-dissection-1991"],
  },
  {
    id: "diag-interp-collateral-long-run",
    lab: "diagnostic",
    when: { phase: ["views"], event: ["total-occlusion"] },
    title: "Film long enough to see collaterals",
    text: "When a vessel is occluded, keep acquiring until the collaterals and the vessel they fill have opacified; otherwise keep runs short. For a chronic total occlusion, film at low magnification during breath hold without panning, and inject both arteries when the CTO fills from contralateral collaterals.",
    tone: "do",
    lessonId: "pm-interpreting-collaterals",
    sources: [
      { book: "brilakis-pci", loc: "6.6" },
      { book: "brilakis-pci", loc: "21.6" },
      { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-interp-donor-ffr",
    lab: "pci",
    when: { phase: ["physiology"], event: ["total-occlusion"] },
    title: "Donor-vessel FFR changes after the CTO opens",
    text: "An artery feeding collaterals to a chronic total occlusion can show a lower FFR than it will after recanalisation (rises of 0.03 to 0.10 in the studies Brilakis cites). Measure the donor after the CTO is opened where possible, and do not use physiology in the CTO vessel itself.",
    tone: "caution",
    lessonId: "pm-interpreting-collaterals",
    sources: [
      { book: "brilakis-pci", loc: "12.3" },
      { book: "brilakis-pci", loc: "21.12" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-interp-nitrate-before-fixed",
    lab: "diagnostic",
    when: { phase: ["views"], vessel: ["RCA", "LM", "LAD", "LCx"] },
    title: "Nitrate before you call a narrowing fixed",
    text: "Spasm can mimic a severe stenosis, especially at an ostium or in a small vessel. With the catheter re-engaged carefully, a free trace and no contraindication (including HOCM), give intracoronary nitrate, wait 1–2 minutes, re-image and record the result. If it still will not resolve, OCT or IVUS can separate spasm from plaque.",
    tone: "do",
    lessonId: "pm-interpreting-spasm",
    sources: [
      { book: "brilakis-pci", loc: "6.3" },
      { book: "brilakis-pci", loc: "3.2" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "diag-interp-anomalous-cx-search",
    lab: "diagnostic",
    when: { event: ["anomalous-origin"], vessel: ["LCx"] },
    title: "Missing circumflex: search the right side",
    text: "When no vessel supplies the lateral wall, look for faint filling of a vessel from the proximal RCA on the right injection and for the dot sign on the left ventriculogram (the anomalous vessel seen end-on). The anomalous circumflex arises from the proximal RCA or the right sinus and runs behind the aorta.",
    tone: "do",
    lessonId: "pm-interpreting-anomalies",
    sources: [{ book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-interp-every-territory",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Before finishing, account for every territory",
    text: "Check that the anterior wall and septum, the lateral wall, the inferior wall and the right ventricle each have a vessel you have seen fill. An empty territory means an anomalous vessel, a flush ostial occlusion or an artery not yet injected.",
    tone: "caution",
    lessonId: "pm-interpreting-anomalies",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
      { book: "brilakis-pci", loc: "5.7" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
];

export const refs: Reference[] = [
  {
    id: "tonino-fame-angio-2010",
    kind: "paper",
    citation:
      "Tonino PAL, Fearon WF, De Bruyne B, et al. Angiographic versus functional severity of coronary artery stenoses in the FAME study: fractional flow reserve versus angiography in multivessel evaluation. J Am Coll Cardiol. 2010;55:2816–2821.",
    url: "https://doi.org/10.1016/j.jacc.2009.11.096",
    note: "PMID: 20579537. Checked on PubMed: authors, title, journal, year, volume 55, issue 25, pages 2816–2821; abstract gives 35%, 80% and 96% of lesions FFR ≤0.80 in the 50–70%, 71–90% and 91–99% bands, and 235 of 509 patients with functional multivessel disease.",
    verified: true,
  },
  {
    id: "sternheim-bridging-2021",
    kind: "paper",
    citation:
      "Sternheim D, Power DA, Samtani R, Kini A, Fuster V, Sharma S. Myocardial bridging: diagnosis, functional assessment, and management: JACC state-of-the-art review. J Am Coll Cardiol. 2021;78:2196–2212.",
    url: "https://doi.org/10.1016/j.jacc.2021.09.859",
    note: "PMID: 34823663. Checked on PubMed: authors, title, journal, year, volume 78, issue 22, pages 2196–2212. Only the abstract's statements are used (traditionally considered benign; specific subsets associated with ischaemic symptoms; contemporary invasive and non-invasive functional and anatomical assessment).",
    verified: true,
  },
  {
    id: "park-lm-ivus-2014",
    kind: "paper",
    citation:
      "Park SJ, Ahn JM, Kang SJ, et al. Intravascular ultrasound-derived minimal lumen area criteria for functionally significant left main coronary artery stenosis. JACC Cardiovasc Interv. 2014;7:868–874.",
    url: "https://doi.org/10.1016/j.jcin.2014.02.015",
    note: "PMID: 25147031. Checked on PubMed: authors, title, journal, year, volume 7, issue 8, pages 868–874; abstract gives 112 patients with isolated ostial and shaft intermediate left main stenosis and an optimal IVUS MLA cut-off of 4.5 mm² for FFR ≤0.80.",
    verified: true,
  },
  {
    id: "li-ivus-length-2021",
    kind: "paper",
    citation:
      "Li M, Cheang I, He Y, Liao S, Wang H, Kong X. Lesion length improves diagnostic accuracy of intravascular ultrasound for detecting functional intermediate coronary stenosis evaluated with coronary angiography-derived fractional flow reserve in non-left main artery. Front Cardiovasc Med. 2021;8:715514.",
    url: "https://doi.org/10.3389/fcvm.2021.715514",
    note: "PMID: 34660717. Checked on PubMed: authors, title, journal, year, volume 8, article 715514; abstract gives 122 non-left-main intermediate lesions, best MLA cut-off 3.6 mm² with AUC 0.714 against angiography-derived FFR ≤0.8.",
    verified: true,
  },
  {
    id: "saw-scad-outcomes-2017",
    kind: "paper",
    citation:
      "Saw J, Humphries K, Aymong E, et al. Spontaneous coronary artery dissection: clinical outcomes and risk of recurrence. J Am Coll Cardiol. 2017;70:1148–1158.",
    url: "https://doi.org/10.1016/j.jacc.2017.06.053",
    note: "PMID: 28838364. Checked on PubMed: authors, title, journal, year, volume 70, issue 9, pages 1148–1158; abstract gives 327 patients, average age 52.5 ± 9.6 years, 90.5% women, 56.9% postmenopausal. Brilakis reproduces this paper's SCAD classification figure (Fig 22.2).",
    verified: true,
  },
];
