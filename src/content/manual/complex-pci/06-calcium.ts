// Module cp-calcium: calcified lesions (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 19 (calcification, the whole chapter), 9.5 and 9.7 (lesion preparation and
// balloon inflation), 23.1 and 23.2 (balloon-uncrossable and balloon-undilatable lesions), chapter 27 (equipment loss and
// entrapment) and chapter 30 (30.9 balloons, 30.10 atherectomy, 30.11 laser), with related passages in 1.9, 3.2, 6.8, 7,
// 13.1, 13.3, 13.4, 14.1, 15.1, 16.2, 18.9, 20.9, 22.3, 25.2 and 26.3; Oxford Handbook of Cardiac Catheterization and
// Coronary Intervention, chapter 8 (rotational atherectomy and its alternatives, lesion classification, guiding
// catheters, angioplasty balloons, the PCI procedure, intravascular ultrasound, specific techniques in complex PCI, the
// no-reflow phenomenon), chapter 2 (the cardiac physiologist) and chapter 10 (arrhythmia, coronary perforation).
// Every claim is listed with its page in docs/curriculum/evidence/cp-calcium.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_ROTA = O("ch 8: Rotational atherectomy");

export const module: Module = {
  id: "cp-calcium",
  title: "Calcified lesions",
  stage: 4,
  summary:
    "Calcium makes every step of PCI harder: it hides the true severity of a lesion, stops equipment reaching it, keeps the lesion and the stent from expanding, and raises the risk of dissection, perforation and lost or trapped equipment. This module teaches how to recognise and grade calcium, how to decide between a balloon-first and an atherectomy-first strategy, how to set the case up, and then each tool in turn: high-pressure and plaque modification balloons, intravascular lithotripsy, rotational atherectomy and its complications, orbital atherectomy and excimer laser, as Brilakis and the Oxford handbook teach them.",
  objectives: [
    "Grade coronary calcium on angiography and on IVUS or OCT, and say what each grade predicts for delivery, expansion and complications.",
    "Decide, for a given calcified lesion, between balloon preparation first and upfront atherectomy, and between rotational and orbital atherectomy, using Brilakis's algorithms and the trial evidence.",
    "Set up a calcified case: access, guide size and shape, wiring and wire exchange, drugs, bradycardia prevention and haemodynamic back-up.",
    "Prepare a calcified lesion with balloons, prove that it has expanded before stenting, and finish with high-pressure post-dilatation and imaging.",
    "Describe intravascular lithotripsy, where it fits and what the manuals do and do not say about it.",
    "Perform rotational atherectomy step by step, and prevent, recognise and treat its complications: slow flow, perforation, burr entrapment, bradycardia and wire fracture.",
    "Perform orbital atherectomy step by step and say how it differs from rotational atherectomy.",
    "Use excimer laser for balloon-uncrossable lesions and underexpanded stents, and know when contrast may be used during lasing.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-recognise",
      title: "Recognising and grading calcium, and what it changes",
      minutes: 13,
      topics: ["cx-calcium-recognition"],
      sources: [B("19"), B("6.6"), B("6.8"), B("7"), B("13.1"), B("13.3"), B("13.4"), B("1.9"), O("ch 8: Lesion classification"), O("ch 8: Specific techniques in complex PCI"), O("ch 8: Intravascular ultrasound")],
      refs: [...BOOKS, "mintz-calcium-ivus-1995", "fujino-calcium-2018", "zhang-ivus-calcium-2021"],
      blocks: [
        {
          kind: "p",
          text: "Heavy calcium causes four kinds of trouble in PCI (Brilakis 19). It makes the severity of the lesion hard to judge; it makes wires, balloons and stents hard to deliver; it stops the lesion, and then the stent, from expanding; and it raises the risk of complications, both during the case (dissection, perforation, equipment that is lost or trapped) and afterwards (restenosis). Recognising calcium before you start is therefore part of planning, not an afterthought.",
        },
        { kind: "h", text: "Calcium on the angiogram" },
        {
          kind: "table",
          caption: "Angiographic grading of calcium (Brilakis 6.8.2.5 and 19)",
          head: ["Grade", "What you see, before any contrast is injected"],
          rows: [
            ["Severe", "Radio-opaque densities that are visible even without the heart moving, and that involve both sides of the arterial wall"],
            ["Moderate", "Densities covering less than 50% of the reference lesion diameter, often seen only as the heart moves"],
          ],
        },
        {
          kind: "p",
          text: "The angiogram under-reports calcium. In the study Brilakis quotes, of 1,155 target lesions examined with both methods, angiography found calcium in 38% and IVUS in 73%. Angiography graded 26% of the lesions as moderately and 12% as severely calcified. On IVUS the calcium of a lesion lay only near the lumen in 48%, only deep in the wall in 28% and at both depths in 24%. The same study found angiography reasonably sensitive only for extensive calcium (60% for calcium spanning three quadrants of the vessel on IVUS, 85% for four quadrants) and much less sensitive for milder degrees. So a clean-looking fluoroscopy run does not mean a calcium-free artery.",
        },
        {
          kind: "p",
          text: "**Recording the calcium.** Brilakis builds the check into every cine acquisition: press the cine pedal and record 1–2 seconds of cine before the contrast goes in. Those frames, recorded without contrast, capture any calcium (and any earlier stent) before the contrast column hides it, and let contrast from the previous injection clear (6.6.2).",
        },
        {
          kind: "list",
          items: [
            "**Lesion classification.** In the ACC/AHA scheme (Oxford Table 8.2), light or no calcification is a type A feature and moderate or heavy calcification a type B feature. The Oxford handbook lists vessel calcification among the lesion features that make PCI complex.",
            "**SYNTAX score.** Heavy calcification adds two points to the lesion's score (Brilakis, chapter 7).",
            "**Planning sheet.** Brilakis's pre-procedure checklist asks about prior difficulty expanding the target lesion, and for severe calcification on earlier images prompts you to consider atherectomy, laser and intravascular lithotripsy where available.",
          ],
        },
        {
          kind: "check",
          stem: "On the fluoroscopy run before the first injection, you see a faint density at the mid-RCA lesion that becomes visible only as the heart moves and covers well under half of the vessel width. How should it be graded, and what does that tell you?",
          options: [
            "Severe calcium; plan atherectomy before any balloon",
            "No significant calcium, because severe calcium would be seen on both walls",
            "Moderate calcium; imaging may show considerably more than the angiogram",
            "Mild calcium, which cannot affect stent expansion",
          ],
          answer: 2,
          explanation:
            "Densities under 50% of the reference diameter that appear mainly with cardiac motion are Brilakis's definition of moderate calcium. Severe calcium is visible without cardiac motion and on both sides of the wall. The tempting wrong answer is that the lesion is calcium-free: angiography misses much of the calcium IVUS finds (38% against 73% of lesions in the study he cites), so the grade on the angiogram is a minimum, not the full picture.",
        },
        { kind: "h", text: "Calcium on intravascular imaging" },
        {
          kind: "p",
          text: "IVUS and OCT measure what the angiogram can only hint at: how far round the vessel the calcium extends (its arc), how thick it is, how long it is, and whether it sits near the lumen (superficial) or deep in the wall. Brilakis grades the arc as mild below 180°, moderate between 180° and 270°, and severe above 270°. Imaging is among the complex settings where he finds it most useful, severely calcified lesions included.",
        },
        {
          kind: "table",
          caption: "What each imaging method shows of calcium (Brilakis 13.3, 13.4, 19.13; Oxford ch 8: Intravascular ultrasound)",
          head: ["", "IVUS", "OCT"],
          rows: [
            [
              "Appearance",
              "Bright white, sometimes with a black acoustic shadow behind it (Oxford)",
              "A dark, signal-poor area with sharp edges; light passes into it, so its far edge can usually be seen",
            ],
            [
              "Depth and thickness",
              "The leading edge shows where the calcium begins, so IVUS tells superficial from deep calcium and measures its arc and length; the acoustic shadow hides how thick it is",
              "Arc and thickness can be measured in most cases, because light enters the calcium; Brilakis prefers OCT for judging how far the calcium extends into the wall",
            ],
            [
              "When it favours atherectomy",
              "The manuals give no IVUS threshold (an IVUS-derived calcium score has since been published: Zhang 2021); circumferential, superficial calcium favours atherectomy (or lithotripsy where available)",
              "An arc over 180° (2 points), a maximum thickness over 0.5 mm (1) and a length over 5 mm (1) give a score of 4. In the study Brilakis cites (Fujino 2018), lesions scoring 4 reached a mean stent expansion of only 78%, against 96% for scores of 0 to 3. Brilakis summarises this as a 22% likelihood of underexpansion, but the paper reports mean expansion, not a probability (the OCT calcium score, taught in pm-imaging)",
            ],
            [
              "Practical limits",
              "A solid-state catheter can jump through tight, calcified or tortuous segments (a rotational catheter does not, because its pullback happens inside its sheath): pretreat the lesion and pull back slowly and steadily, or change to a rotational catheter",
              "The catheter may not cross, and contrast may not clear the lesion; predilatation can help both",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**Superficial or deep.** Deep calcium may yield to a balloon; superficial calcium is more likely to need an ablative device (Brilakis 13.3). Superficial and nodular calcium are best treated with atherectomy; a balloon is reasonable for calcium deep in the wall (19.9.3).",
            "**Which features predict atherectomy.** Circumferential superficial calcium, a calcified nodule that obstructs the lumen, or thick calcium on imaging make atherectomy likely to be needed for the stent to expand (19.9.1).",
            "**If the imaging catheter will not cross.** Predilate with a balloon, or image after atherectomy has opened a channel (13.3, 19.13).",
          ],
        },
        { kind: "tip", id: "pci-calc-imaging-decides" },
        {
          kind: "check",
          stem: "Before any device, OCT of a mid-LAD lesion shows calcium spanning 320° of the circumference, 1.1 mm thick at its thickest, over 13 mm, lying right against the lumen. What does this predict?",
          options: [
            "Probably a good response to a 1:1 non-compliant balloon at high pressure, because the calcium is superficial",
            "Poor expected stent expansion (an OCT calcium score of 4), favouring calcium modification",
            "Nothing useful, because OCT cannot see behind calcium, so only IVUS can guide the choice of device here",
            "A lesion that should be stented directly, without predilatation, to avoid a balloon-induced dissection",
          ],
          answer: 1,
          explanation:
            "All three OCT features are present (arc over 180°, thickness over 0.5 mm, length over 5 mm): a score of 4, which in Fujino's validation cohort, the study Brilakis cites, was followed by a mean stent expansion of only 78%, against 96% for lower scores. Brilakis says this favours plaque modification such as atherectomy or lithotripsy. Separately, circumferential superficial calcium on imaging suggests a high likelihood of needing atherectomy (19.9.1). Superficial calcium is the kind least likely to yield to a balloon, so the first option has it backwards. OCT, unlike IVUS, does see into calcium. Direct stenting is never done in heavily calcified lesions.",
        },
        { kind: "h", text: "Calcium or thrombus?" },
        {
          kind: "p",
          text: "A filling defect inside the lumen can be thrombus or a calcified nodule, and angiography cannot always tell them apart (Brilakis 6.8.2.4). Intravascular imaging settles it: Brilakis lists suspected calcified nodules among the ambiguous lesions it is used for, and prefers OCT in acute coronary syndromes because its higher resolution helps identify the culprit, be it an ulcerated or eroded plaque, thrombus, or a calcified nodule (13.1). The distinction matters because the treatments diverge: thrombectomy for one, calcium modification for the other.",
        },
        { kind: "h", text: "Judging severity" },
        {
          kind: "p",
          text: "Calcium makes the angiogram hard to read. Take several views, and use physiology and intravascular imaging, because in heavily calcified arteries the angiographic severity correlates poorly with physiological measurements (Brilakis 19.6, 19.12).",
        },
        {
          kind: "table",
          caption: "What heavy calcium changes at each step of the PCI (Brilakis 19.1 to 19.14); details follow in the lessons below",
          head: ["Step", "The calcium-specific point"],
          rows: [
            ["Planning", "Expect to need large guides, extra support, imaging, atherectomy and other plaque modification such as lithotripsy"],
            ["Medications", "Standard anticoagulation and antiplatelet therapy; the case may be long, so monitor anticoagulation; plan for bradycardia if atherectomy will be done in the artery supplying the AV node"],
            ["Access and guide", "Radial works for most; femoral gives more support for the hardest lesions; 7 or 8 Fr supportive guides, kept coaxial"],
            ["Wiring", "Microcatheters and hydrophilic or polymer-jacketed wires may be needed; a microcatheter is used to exchange to an atherectomy or support wire"],
            ["Preparation", "Never stent primarily; prepare with balloons, plaque modification balloons, atherectomy or lithotripsy"],
            ["Stenting", "Only after the balloon has fully expanded; post-dilate at 20 atm or more with a 1:1 non-compliant balloon; image before and after"],
            ["Physiology and imaging", "Both encouraged; imaging confirms the calcium and the need for atherectomy, and checks expansion at the end"],
            ["Haemodynamic support", "Atherectomy raises the risk of haemodynamic compromise, which may favour support"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting at once and never looking at the vessel on plain fluoroscopy, so calcium is not seen at all.",
            "Taking a calcium-free angiogram at face value: angiography misses a large share of the calcium that IVUS detects.",
            "Calling a calcified nodule thrombus (or the reverse) without imaging, and choosing the wrong treatment.",
            "Judging the severity of a heavily calcified lesion from one angiographic view instead of several views, physiology and imaging.",
            "Assuming an IVUS image shows the thickness of calcium: the ultrasound stops at its front edge.",
          ],
        },
        {
          kind: "pearl",
          text: "Before any device goes in, describe the calcium in four words: arc, thickness, length, depth. Circumferential, thick, long and superficial means the balloon is unlikely to win on its own; deep calcium, or a thin arc, often yields to a balloon. Saying it aloud commits the team to a plan before the first balloon.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, screen the lesion before the first injection and grade the calcium as severe or moderate by Brilakis's definitions; then, after imaging, state the arc, thickness, length and depth of the calcium and whether it predicts that a balloon alone will fail.",
        },
        { kind: "video", id: "KLqBh4qWbQw", note: "Manual of PCI section 19.1: calcification." },
        { kind: "video", id: "XZoGURFaUkI", note: "Manual of PCI case 78: telling calcium from thrombus." },
        { kind: "video", id: "R1qMbS8d-f4", note: "Manual of PCI case 3: the challenges of severe calcification." },
        {
          kind: "keypoints",
          items: [
            "Severe angiographic calcium: densities seen without cardiac motion, on both sides of the wall; moderate: under 50% of the reference diameter, often only with motion.",
            "Angiography under-reports calcium (38% of lesions against 73% on IVUS in the study Brilakis cites).",
            "Imaging arc: under 180° mild, 180–270° moderate, over 270° severe.",
            "IVUS shows arc, length and whether calcium is superficial or deep, but not its thickness; OCT usually shows thickness too.",
            "Circumferential superficial, nodular or thick calcium predicts the need for atherectomy; deep calcium may respond to balloons.",
            "Use several views, physiology and imaging to judge severity; image to tell a calcified nodule from thrombus.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-strategy",
      title: "Balloon first or atherectomy first: choosing the strategy",
      minutes: 15,
      topics: ["cx-calcium-algorithm"],
      sources: [B("19"), B("9.5"), B("23.2"), B("18.9"), B("22.3"), O_ROTA, O("ch 8: The PCI procedure")],
      refs: [
        ...BOOKS,
        "abdel-wahab-rotaxus-2013",
        "abdel-wahab-prepare-calc-2018",
        "kirtane-eclipse-2025",
        "barbato-calcium-consensus-2023",
        "riley-scai-calcium-2024",
        "lawton-revasc-jacc-2021",
        "angsubhakorn-calcium-review-2022",
        "esc-ccs-2024",
        "gurgoglione-esc-ccs-2024",
        "xie-hybrid-imaging-2025",
        "stone-eclipse-imaging-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Brilakis frames the whole of calcified PCI around one question: should you use atherectomy as well as balloons, and if so, when? Everything else in this module follows from the answer. One rule comes first and has no exceptions in his text: **never stent a heavily calcified lesion primarily**, because a lesion that has not been fully dilated leaves the stent underexpanded, and underexpansion raises the risk of restenosis and stent thrombosis.",
        },
        {
          kind: "table",
          caption: "The ways to prepare a severely calcified lesion (Brilakis 19.9, Fig. 19.2)",
          head: ["Group", "Tools", "Brilakis's comment"],
          rows: [
            ["Balloon angioplasty", "Non-compliant balloons at high pressure", "The usual starting point"],
            ["Plaque modification balloons", "Scoring balloon (nitinol struts), nitinol-caged balloon, cutting balloon", "Help the lesion expand but are harder to deliver through heavy calcium"],
            ["Atherectomy", "Orbital and rotational; laser", "Laser is not very effective in severe calcium, but is used particularly for underexpanded stents"],
            ["Newer tools (as of 2020)", "Intravascular lithotripsy; very-high-pressure non-compliant balloon", "Not then available in the United States; taught in this module where the sources allow"],
          ],
        },
        { kind: "h", text: "Upfront or secondary atherectomy" },
        {
          kind: "table",
          caption: "The two approaches (Brilakis 19.9.1)",
          head: ["", "Upfront (primary) atherectomy", "Secondary atherectomy, only if balloons fail"],
          rows: [
            [
              "For",
              "Better preparation of the vessel; less risk of losing a stent or leaving it underexpanded",
              "May be quicker",
            ],
            [
              "Against",
              "Complications of atherectomy, more time, more cost",
              "Can give a false impression that the vessel is ready; balloons can dissect or perforate, which may then make atherectomy unsafe; stent delivery may still be hard",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's summary is that atherectomy should be used when its expected benefit outweighs its risk. The benefit is greater in severely calcified and long lesions, and when imaging shows circumferential superficial calcium, an obstructive calcified nodule or thick calcium. The risk (dissection, embolisation, perforation, lost or trapped equipment) rises with tortuosity, thrombus, dissection and bypass grafts.",
        },
        {
          kind: "steps",
          title: "Brilakis's decision sequence for atherectomy (Fig. 19.3)",
          items: [
            { title: "1. Is the calcification severe?", detail: "If not, prepare with balloon angioplasty." },
            {
              title: "2. Is there severe tortuosity, thrombus, a dissection or a bypass graft?",
              detail: "If yes, start with balloon angioplasty. Tortuosity and dissection are relative contraindications to atherectomy. It is generally avoided in vein grafts (rare old, heavily calcified graft lesions have been treated after other methods failed) and usually avoided in dissected segments (it has been used there for CTOs and undilatable lesions). The Oxford handbook lists severe tortuosity (perforation and burr entrapment) and coronary dissection as contraindications to rotational atherectomy. Brilakis also generally avoids atherectomy in small vessels, above all tortuous ones (22.3).",
            },
            { title: "3. If neither applies", detail: "Atherectomy can be done upfront." },
            {
              title: "4. After balloon angioplasty",
              detail: "If the balloon has fully expanded the lesion, stent. If the lesion is balloon uncrossable or balloon undilatable, go to atherectomy. In the figure this escalation starts from the balloon step, whichever route led there: calcium that was not severe, or severe calcium with tortuosity, thrombus, a dissection or a graft. In the second case weigh the higher risk, remembering that atherectomy has been used even in dissected segments for undilatable lesions. The upfront-atherectomy route has no such loop of its own.",
            },
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook gives three triggers for rotational atherectomy once the team agrees it is indicated: calcium clearly visible on the angiogram, a calcified arc of more than 180° on intravascular imaging, or a lesion that a balloon could not cross or could not dilate.",
        },
        { kind: "tip", id: "pci-calc-no-stent-until-expanded" },
        {
          kind: "check",
          stem: "A heavily calcified mid-LAD lesion has 300° of superficial calcium on OCT. Predilatation with a small balloon has caused a spiral dissection that runs into the lesion, with TIMI 3 flow. Which next step fits Brilakis's algorithm?",
          options: [
            "Rotational atherectomy now, because the calcium is circumferential and superficial",
            "Orbital atherectomy, which cuts sideways and so will not extend the dissection",
            "Continue with balloon-based preparation and avoid atherectomy through the dissection",
            "Direct stenting of the whole segment with a long stent at nominal pressure",
          ],
          answer: 2,
          explanation:
            "A dissection is a relative contraindication to atherectomy in Brilakis's algorithm, and the Oxford handbook lists it as a contraindication to rotational atherectomy; both atherectomy devices share the same risks here. The calcium pattern would otherwise favour atherectomy, which is what makes the first option tempting. This is exactly the downside of a balloon-first approach that Brilakis warns about: a balloon-induced dissection can take atherectomy off the table. Brilakis notes that atherectomy has occasionally been used in dissected segments when a lesion proves balloon undilatable, so the contraindication is relative, not absolute; here the balloon route has not yet failed. A stent deployed without full lesion expansion risks underexpansion.",
        },
        { kind: "h", text: "What the trials say" },
        {
          kind: "list",
          items: [
            "**ROTAXUS** (240 patients with complex calcified lesions, paclitaxel-eluting stents): routine rotational atherectomy gave higher strategy success (92.5% against 83.3%) and fewer crossovers (4.2% against 12.5%), but more in-stent late lumen loss at 9 months (0.44 against 0.31 mm), with similar restenosis, revascularisation and adverse events. The authors concluded that balloon dilatation with provisional rotational atherectomy should remain the default. Brilakis quotes the stent loss without atherectomy in this trial (2.5% of patients in chapter 19; 2% of lesions against 0.5% with atherectomy in chapter 27).",
            "**PREPARE-CALC** (200 patients with severely calcified lesions): upfront rotational atherectomy was more often successful as the first strategy than modified (scoring or cutting) balloons (98% against 81%), with non-inferior late lumen loss. Brilakis notes that 16% of the balloon group needed crossover to rotational atherectomy. The authors judged a provisional modified-balloon strategy feasible as long as bail-out atherectomy is readily available.",
            "**ECLIPSE** (2,005 patients; still running when the manual was written): routine orbital atherectomy before stenting did not reduce target-vessel failure at 1 year (11.5% against 10.0% with balloons) or increase the minimal stent area at the site of maximal calcium on OCT (7.67 against 7.42 mm²), in lesions judged suitable for either strategy. The authors concluded that the data support a balloon-first approach, guided by intravascular imaging, for most calcified lesions that can be crossed and dilated.",
          ],
        },
        {
          kind: "p",
          text: "Read together, the trials and the manual agree on a practical stance: start with balloons when the lesion can be crossed and dilated and nothing on imaging predicts failure, have atherectomy ready, and move to it early when imaging or the balloon tells you the lesion will not yield. A 2023 EAPCI clinical consensus statement now covers rotational and orbital atherectomy and lithotripsy together, and gives guidance on choosing the tool by the calcium's morphology and location. In the United States, a 2024 SCAI expert consensus statement sets out a central algorithm for choosing among the calcium-modification tools, with practical tips for each.",
        },
        {
          kind: "p",
          text: "**Guideline status (after both manuals).** As summarised in a 2022 review, the 2021 ACC/AHA/SCAI revascularisation guideline gives rotational atherectomy a class 2a recommendation (level of evidence B) to improve procedural success in fibrotic or heavily calcified lesions, and also gives intracoronary imaging for guiding complex stenting class 2a (level B); the classes for the other devices are not quoted here because they could not be checked against the guideline text. The 2024 ESC guideline on chronic coronary syndromes recommends, for the first time, IVUS or OCT guidance of PCI in anatomically complex lesions such as left main disease, true bifurcations and long lesions. Within ECLIPSE, an analysis that was observational (imaging was used at the operator's discretion, not by randomisation) found a lower 1-year target-vessel failure with imaging guidance than with angiography alone (9.3% against 13.2%; adjusted hazard ratio 0.74), whether orbital atherectomy or balloons had been used.",
        },
        { kind: "h", text: "Rotational or orbital?" },
        {
          kind: "table",
          caption: "Choosing the atherectomy device (Brilakis 19.9.2, Fig. 19.4). For most cases either works; local availability, experience and cost decide.",
          head: ["Situation", "Preferred", "Why"],
          rows: [
            [
              "Stents already in the target lesion",
              "Rotational",
              "Orbital atherectomy must not be used in recently placed stents (entrapment), though it has been used in endothelialised stents. Rotational atherectomy can be used in old stents and even in stents placed minutes earlier that failed to expand, at the cost of embolisation, burr entrapment and stent distortion; use higher speeds in fresh stents and expect to restent",
            ],
            ["Balloon-uncrossable lesion", "Rotational", "It ablates forwards; the orbital crown ablates sideways (although it has also been used successfully here)"],
            ["Large vessel", "Orbital", "One crown treats a range of diameters, whereas rotational atherectomy needs ever larger burrs"],
            ["Underexpanded stent", "Laser is the exception to its general weakness in calcium", "See the laser lesson"],
          ],
        },
        {
          kind: "check",
          stem: "A stent deployed ten minutes ago in a calcified circumflex is visibly underexpanded despite high-pressure non-compliant inflations. Both atherectomy systems are on the shelf. What does Brilakis say about atherectomy here?",
          options: [
            "Orbital atherectomy is the choice, because its crown ablates in both directions and cannot be trapped",
            "Neither device may ever be used inside any stent, so referral for surgery is the only option left",
            "Rotational atherectomy at higher speed, then restent; other measures such as laser come first",
            "Rotational atherectomy at the lowest available speed, so as not to damage the stent struts",
          ],
          answer: 2,
          explanation:
            "Brilakis forbids orbital atherectomy in recently placed stents because of entrapment. Rotational atherectomy has been used in stents that have just failed to expand, but carries embolisation, burr entrapment and stent distortion, so he uses higher speeds to avoid entrapment, expects to restent, and in general keeps in-stent atherectomy for when other measures (high-pressure balloons with or without buddy wires, laser, lithotripsy or a very-high-pressure balloon where available) have failed. The first option reflects the Oxford handbook's statement that the orbital crown's two-way diamond coating makes entrapment theoretically impossible, which Brilakis's warning contradicts for fresh stents.",
        },
        { kind: "h", text: "When the lesion will not dilate" },
        {
          kind: "p",
          text: "A lesion that will not expand despite repeated high-pressure inflations is balloon undilatable; such lesions are often severely calcified and often balloon uncrossable as well (Brilakis 23.2). The key branch point is whether the lesion is de novo or inside a stent. Its outline is below, so that you can see where each tool in this module sits; the full algorithm, with the crossing techniques of the uncrossable lesion, is to be taught in cp-uncrossable.",
        },
        {
          kind: "table",
          caption: "Outline of Brilakis's algorithm for balloon-undilatable lesions (Fig. 23.7); intravascular imaging at every stage",
          head: ["De novo lesion", "In-stent lesion"],
          rows: [
            ["Likely to respond to a balloon? If yes: high-pressure inflation (shorter balloon, two smaller balloons together, one or more buddy wires), then plaque modification balloons", "High-pressure inflation (the same measures)"],
            ["If unlikely to respond, or if balloons fail: is atherectomy suitable? If yes: orbital or rotational atherectomy", "Plaque modification balloons"],
            ["Then laser", "Then laser"],
            ["Then subintimal crossing techniques", "Then atherectomy (orbital or rotational)"],
            ["Then CABG", "Then subintimal crossing techniques, then CABG"],
            ["Future techniques in 2020: lithotripsy, very-high-pressure balloon", "The same"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting a lesion that a 1:1 balloon has not fully opened, in the hope that high pressure on the stent will finish the job: once metal is in an unyielding lesion, the problem is far more difficult to fix than before stenting.",
            "Dilating aggressively first and then finding that the resulting dissection rules out atherectomy.",
            "Choosing atherectomy in a tortuous vessel, a vein graft, a small vessel or a dissected segment without weighing the higher risk.",
            "Using orbital atherectomy inside a stent placed during the same procedure.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide before the first balloon whether atherectomy is likely, using the angiogram and imaging. If it is, prepare for it from the start (guide size, wire plan, pacing plan, vasodilator), even if you begin with balloons. The decision to escalate is then a two-minute step rather than a re-planning of the case.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Take a calcified lesion with circumferential superficial calcium on imaging. State whether you would start with balloons or atherectomy and why; inflate a 1:1 non-compliant balloon, and when a waist persists, choose the next device by Brilakis's algorithm before stenting.",
        },
        { kind: "video", id: "uvDOJjmVCrY", note: "Elias Hanna: calcium modification strategies, when, what and how, with case scenarios." },
        { kind: "video", id: "lrMbTP0Ou-g", note: "Manual of PCI case 23: atherectomy regret." },
        { kind: "video", id: "U3iw9wp8abo", note: "Manual of PCI case 149: a truly resistant lesion." },
        { kind: "video", id: "Ri0-OiOTN7Q", note: "Elias Hanna: an updated approach to calcium modification and device deliverability." },
        {
          kind: "keypoints",
          items: [
            "Never stent a heavily calcified lesion primarily.",
            "Upfront atherectomy prepares better and loses fewer stents; balloon-first is quicker but can mislead and can dissect.",
            "Atherectomy when benefit exceeds risk: severe, long, circumferential superficial, nodular or thick calcium; avoid in tortuosity, thrombus, dissection, vein grafts and small vessels.",
            "Prior stents and balloon-uncrossable lesions favour rotational atherectomy; large vessels favour orbital; orbital never in fresh stents.",
            "ROTAXUS and ECLIPSE support balloon-first with atherectomy ready; PREPARE-CALC showed upfront rotational atherectomy succeeds more often than modified balloons.",
            "Undilatable lesions: de novo and in-stent algorithms differ (in-stent: balloons, modified balloons and laser before atherectomy).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-setup",
      title: "Setting up a calcified case: access, guide, wire, drugs and back-up",
      minutes: 14,
      topics: ["cx-calcium-algorithm"],
      sources: [
        B("19"),
        B("3.2"),
        B("8.2"),
        B("14.1"),
        B("16.2"),
        B("23.1"),
        B("30.7"),
        B("30.23"),
        O_ROTA,
        O("ch 8: Guiding catheters"),
        O("ch 2: The cardiac physiologist"),
        O("ch 10: Arrhythmia"),
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Most of the hard decisions in a calcified case are taken before the wire crosses. A guide that is too small for the burr you will need, a wire that cannot be exchanged, or a dominant right coronary artery with no plan for bradycardia each turns a manageable lesion into a struggle. This lesson sets the case up so that every escalation is ready.",
        },
        {
          kind: "steps",
          title: "Access and guide (Brilakis 19.4, 19.5; Oxford ch 8: Guiding catheters)",
          items: [
            {
              title: "1. Access",
              detail: "Most calcified lesions can be treated from the radial artery, ideally with a 7 Fr low-profile sheath or a sheathless guide. Femoral access gives more support and can help with the most complex calcified lesions.",
            },
            {
              title: "2. Guide size and shape",
              detail: "Aim for strong support: a 7 or 8 Fr guide with a supportive shape, such as AL1 or a 3D right curve for the RCA and an extra-backup curve (XB or EBU) for the left main. The Oxford handbook makes the same point: larger guides give more support, and planning ahead for rotational atherectomy lets you avoid changing guides in the middle of the case.",
            },
            {
              title: "3. Check the guide against the device",
              detail: "Rotational burrs of 1.25–1.75 mm pass through a 6 Fr guide or larger, a 2.0 mm burr needs at least 7 Fr, and 2.15–2.25 mm burrs at least 8 Fr (Table 19.1). An orbital crown can be trapped with a balloon inside a 7 or 8 Fr guide but not inside a 6 Fr guide, and not alongside an ordinary guide extension (Table 19.2), although an 8 Fr guide extension designed for trapping allows it (19.9.6.5).",
            },
            {
              title: "4. Support from the start, coaxial throughout",
              detail: "Use support techniques early, and keep the guide coaxial during atherectomy. Guides with sharp bends, such as the Amplatz left, can make it hard to advance a burr: an AL1 gives strong support for the RCA, but its curve can resist the burr, so if rotational atherectomy is likely, weigh support against deliverability and keep the guide coaxial. Avoid a damped guide pressure during atherectomy: damping makes slow flow and no-reflow more likely.",
            },
          ],
        },
        {
          kind: "check",
          stem: "You expect to need rotational atherectomy with a 2.0 mm burr for a calcified proximal LAD, approached from the right radial artery. Which set-up fits the manuals?",
          options: [
            "A 6 Fr extra-backup guide, which accepts every burr size up to 2.0 mm",
            "A 7 Fr extra-backup guide through a low-profile sheath or a sheathless system",
            "A 6 Fr Amplatz left guide for maximal support from the contralateral aortic wall",
            "A 5 Fr guide to limit radial trauma, upsizing only if the burr does not pass",
          ],
          answer: 1,
          explanation:
            "A 2.0 mm burr needs at least a 7 Fr guide; 6 Fr accepts burrs only up to 1.75 mm. Brilakis suggests 7 Fr low-profile sheaths or sheathless guides for radial work in calcium, an extra-backup curve for the left system, and warns that the bends of an Amplatz left can obstruct the burr. Changing guides mid-case is what the Oxford handbook tells you to plan away.",
        },
        {
          kind: "steps",
          title: "Wiring (Brilakis 19.8, 8.2, 23.1; Oxford ch 8: Rotational atherectomy)",
          items: [
            {
              title: "1. Cross with what crosses",
              detail: "Calcified, especially tortuous, lesions may need a microcatheter and a hydrophilic or polymer-jacketed wire. Exchange a polymer-jacketed or stiff wire for a workhorse, support or atherectomy wire before preparation, through a microcatheter or over-the-wire balloon, ideally with the trapping technique.",
            },
            {
              title: "2. Exchange for the device wire",
              detail: "If atherectomy is planned, use the microcatheter to swap the crossing wire for the dedicated atherectomy wire. If atherectomy is not planned but delivery will be hard, swap instead for a support wire, which has a stiff body and a soft tip. Direct wiring with the rotational atherectomy wire is possible but difficult (Oxford), which is why both books advise crossing first with a workhorse wire and microcatheter.",
            },
            {
              title: "3. If the microcatheter will not cross",
              detail: "Without a microcatheter across, the atherectomy wire cannot be exchanged in, and rotational atherectomy is not possible (Oxford names laser as the alternative). Brilakis's fallback is to push the microcatheter as deep into the lesion as it will go, remove the original wire and try to recross with the atherectomy wire, accepting that wire position may be lost (23.1.7).",
            },
          ],
        },
        { kind: "tip", id: "pci-calc-wire-exchange" },
        { kind: "h", text: "Drugs" },
        {
          kind: "table",
          caption: "Drugs for calcified PCI and atherectomy (Brilakis 19.3, 19.9.4, 3.2). Doses are those the manual gives; they are typical, and local protocol applies.",
          head: ["Purpose", "Drug and typical dose in the manual", "Note"],
          rows: [
            ["Anticoagulation and antiplatelet therapy", "Standard regimens (pm-antithrombotics)", "Calcified cases can be long: check anticoagulation repeatedly"],
            [
              "Prevent bradycardia during atherectomy of the AV-nodal artery (usually the RCA)",
              "Aminophylline 250–300 mg IV over 10 minutes, or 20–40 mg as an intracoronary bolus; or atropine 0.5–1.0 mg IV before atherectomy",
              "Aminophylline blocks A1 adenosine receptors; adenosine is released from red cells damaged by atherectomy",
            ],
            [
              "Help debris pass through the microcirculation",
              "Nicardipine 100–300 µg intracoronary, or nitroprusside 100–300 µg intracoronary, before atherectomy; verapamil or adenosine are alternatives",
              "Give unless the patient is hypotensive; nicardipine is the most commonly used and the one Brilakis prefers for preventing no-reflow (less hypotension, shorter action than nitroprusside and verapamil). The Oxford handbook's no-reflow doses differ (nitroprusside 50–100 µg; verapamil 100–500 µg, beware heart block; adenosine 30–50 µg); follow local protocol. Adenosine acts on the AV node and can cause heart block, most often when given into the RCA: give it slowly and avoid high doses there (Brilakis 3.2.5.3.1). The Oxford handbook advises avoiding it in asthma and in patients taking dipyridamole",
            ],
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook adds the bedside routine: check the heart rate and baseline ECG before rotational atherectomy to judge how likely severe bradycardia or complete heart block is; when bradycardia or block seems likely it recommends atropine beforehand, and some operators place a prophylactic temporary pacing wire, especially for a large RCA. Its arrhythmia section notes that atropine may improve AV nodal conduction, while Mobitz II or complete heart block may need urgent temporary transvenous pacing.",
        },
        {
          kind: "table",
          caption: "Is a temporary pacemaker needed? (Brilakis 19.9.4, Fig. 19.5)",
          head: ["Target vessel", "Brilakis's approach"],
          rows: [
            ["LAD or non-dominant circumflex", "No pacemaker routinely"],
            [
              "RCA or dominant circumflex",
              "Any of three: a temporary pacemaker; aminophylline; or short test runs to see whether bradycardia occurs. Test runs let you tailor the runs (stop when the rate falls) and avoid the risk of right ventricular perforation by a pacing lead",
            ],
            ["Device and run", "Larger burrs and longer runs cause bradycardia more often than smaller burrs and shorter runs; orbital atherectomy may cause it less often than rotational"],
          ],
        },
        { kind: "tip", id: "pci-calc-bradycardia-plan" },
        {
          kind: "check",
          stem: "Rotational atherectomy is planned for a calcified mid-RCA in a right-dominant system. Resting heart rate is 62/min with normal conduction. Which statement is consistent with both manuals?",
          options: [
            "Pacing is only needed for LAD atherectomy, because the RCA is not near the conducting system",
            "No preparation is needed, because bradycardia only appears with orbital atherectomy",
            "Atherectomy must always be done over a prophylactic pacing wire in any dominant vessel",
            "Choose pacing, aminophylline or atropine pretreatment, or brief test runs, and keep runs short",
          ],
          answer: 3,
          explanation:
            "For the RCA or a dominant circumflex Brilakis offers a temporary pacemaker, aminophylline or brief test runs, with atropine as an alternative drug; the Oxford handbook advises pretreating with atropine when bradycardia is likely and notes that some operators place a prophylactic pacing wire, especially for a large RCA. Neither book makes pacing mandatory, which is why the third option is wrong. Short runs and smaller burrs make bradycardia less likely; it is the LAD and a non-dominant circumflex that usually need no pacing plan.",
        },
        { kind: "h", text: "Haemodynamic back-up and the team" },
        {
          kind: "list",
          items: [
            "**Support.** Atherectomy can cause complications, so consider prophylactic haemodynamic support in patients with poor baseline haemodynamics, low ejection fraction, a large area of myocardium at risk, severe valve disease or severe pulmonary hypertension (19.9.4). Brilakis's support algorithm counts atherectomy, and severe calcification with tortuosity, among the features that make PCI high risk (14.1); the device choice is taught in pm-support-choice.",
            "**Bifurcations.** Atherectomy of the main vessel carries a risk of side-branch occlusion (16.2.8). During atherectomy only the atherectomy wire normally stays in the treated artery; the other wire is usually removed to avoid wire fracture. To keep both wires when the lesion that needs atherectomy lies in the proximal side branch or the distal main vessel, the burr or crown can be passed through a guide extension placed over the atherectomy wire alone: a 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or the 1.25 mm orbital crown, and an 8 Fr guide with a 7 Fr extension takes a 1.5 mm burr. The catch with removing the side-branch wire is that rewiring can be hard if that vessel dissects. Brilakis's bifurcation section also lists two other ways to keep the second wire: cover it with a small microcatheter that is moved slowly during the runs (needs an 8 Fr guide), or simply leave it in place accepting a low risk of wire damage; laser is a further option (16.2.9; cp-bifurcation-provisional). His orbital atherectomy section, by contrast, advises avoiding the microcatheter method (see the orbital lesson).",
            "**The team.** The Oxford handbook lists helping the operator with rotational atherectomy among the cardiac physiologist's duties. Brilakis recommends a dedicated complex-PCI cart, restocked and known to the whole team, and notes that the laser console needs about 5 minutes to warm up and calibrate, so it should be switched on early if laser is a possibility.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting in a 6 Fr guide and discovering mid-case that the burr you need requires 7 or 8 Fr.",
            "Using an Amplatz guide whose bends stop the burr, or letting the guide pressure damp during atherectomy.",
            "Trying to wire a tortuous calcified lesion directly with the atherectomy wire instead of crossing with a workhorse wire and microcatheter.",
            "Treating a dominant RCA or circumflex with atherectomy without a plan for bradycardia.",
            "Giving a vasodilator to a hypotensive patient before atherectomy.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the escalation plan on the board before you start: guide size and shape, the wire you will exchange to, the largest burr the guide accepts, the bradycardia plan, the vasodilator and whether support or a second access is needed. If the plan needs an 8 Fr femoral guide, it is better to start there than to change halfway.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, before wiring, state your access, guide size and curve, the largest rotational burr it accepts, your wire exchange plan and your bradycardia plan for a dominant RCA; then deliver equipment with the guide coaxial and the pressure undamped.",
        },
        { kind: "video", id: "RQiFrT47WXw", note: "Manual of PCI case 20: a heavily calcified right coronary artery." },
        { kind: "video", id: "SXapr6e1DvA", note: "Brilakis: PCI of calcified and tortuous lesions (Dallas CVI 2016)." },
        {
          kind: "keypoints",
          items: [
            "Radial suits most calcified cases (7 Fr low-profile or sheathless); femoral gives the most support.",
            "7–8 Fr supportive guides: AL1 or 3D right for the RCA, XB or EBU for the left; coaxial and undamped during atherectomy.",
            "Burr and guide: 1.25–1.75 mm in 6 Fr, 2.0 mm in 7 Fr, 2.15–2.25 mm in 8 Fr.",
            "Cross with a workhorse wire and microcatheter; exchange for the atherectomy wire through the microcatheter.",
            "RCA or dominant circumflex: pacing, aminophylline or test runs (or atropine); LAD and non-dominant circumflex need no routine pacing.",
            "Vasodilator before atherectomy unless hypotensive (adenosine slowly and not in high doses into the RCA); monitor anticoagulation in long cases; consider prophylactic support in high-risk patients.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-balloons",
      title: "Balloon preparation of calcium, then stenting and finishing",
      minutes: 15,
      topics: ["cx-calcium-algorithm"],
      sources: [B("19"), B("9.7"), B("23.2"), B("26.2"), B("27.3"), B("30.9"), B("15.1"), B("13.4"), O("ch 8: Angioplasty balloons"), O("ch 8: The PCI procedure")],
      refs: [...BOOKS, "fujino-calcium-2018"],
      blocks: [
        {
          kind: "p",
          text: "When balloons are the first tool, the aim is not just to open a channel but to prove that the lesion will yield before any metal is committed. Brilakis's test is a 1:1 non-compliant balloon that expands fully; the Oxford handbook makes the same point from the other side: a resistant lesion is much harder to open once a stent sits inside it, so dilate fully first.",
        },
        { kind: "h", text: "Choosing the balloon" },
        {
          kind: "list",
          items: [
            "**Non-compliant over compliant.** Non-compliant balloons reach higher pressures with less risk of dissection or rupture, but they have a larger crossing profile and are stiffer, so they are harder to deliver (19.9.3).",
            "**Standard or plaque modification balloon first?** Plaque modification balloons help the lesion expand but deliver less well and cost more. The more severe the calcium, the stronger the case for using one first; the harder the delivery, the stronger the case for a standard balloon. Most often a standard balloon goes first and a plaque modification balloon follows if it fails.",
            "**Size.** The test balloon is matched 1:1 to the reference vessel. For trying to break a lesion that will not yield, Brilakis allows a balloon slightly undersized (usually by 0.5 mm) and shorter, which concentrates the force; overall, keep the balloon-to-vessel ratio at 1:1 or less to avoid perforation (23.2.2).",
          ],
        },
        {
          kind: "table",
          caption: "Plaque modification balloons (Brilakis 30.9.3, 9.7.9, 23.2.3; Oxford ch 8: Angioplasty balloons)",
          head: ["Type", "How it works", "Handling"],
          rows: [
            [
              "Scoring balloon",
              "A semi-compliant balloon wrapped in three spiral nitinol struts that score the plaque",
              "Lower crossing profile than the cutting balloon, and more scoring marks per millimetre of plaque; Brilakis reserves the slow inflation for the cutting balloon, not for this one",
            ],
            [
              "Nitinol-caged balloon",
              "A cage divides the inflating balloon into pillows and grooves; the pillows make small dissections that let the lesion open, the grooves relieve stress so the dissections do not spread",
              "Brilakis contrasts it with the cutting balloon, which alone needs very slow inflation",
            ],
            [
              "Cutting balloon",
              "Three or four blades (atherotomes) standing 0.005 in. proud of the balloon cut radial incisions through fibrocalcific tissue",
              "High crossing profile. Inflate and deflate very slowly, about 1 atm every 5 seconds, so the blades can come out of the folds and rewrap; this also lowers the risk of the blades catching on calcified spicules. Brilakis gives usual pressures of 6–8 atm and a ceiling of 12 atm in chapter 9, and says to avoid more than 14 atm in chapter 23. The Oxford handbook warns that the blades are sharper than a scalpel, can cut gloves and skin, and can injure the artery if the balloon is withdrawn before it has fully deflated",
            ],
            [
              "Very-high-pressure non-compliant balloon",
              "A specialised non-compliant balloon that reaches more than 40 atm (30–35 atm are the inflation pressures Brilakis lists)",
              "In a series of 326 undilatable lesions it achieved expansion in more than 90%, with a 2–3% risk of vessel rupture; not available in the United States when the manual was written",
            ],
            [
              "Wire-based scoring balloon",
              "A short monorail catheter carrying a 0.6 × 5 mm balloon that sits beside the guidewire; on inflation the balloon presses the wire into the plaque, so the wire does the scoring",
              "High pressures: nominal 25 atm, rated burst 30 atm. Available only in Europe when the manual was written (30.9.3.4)",
            ],
          ],
        },
        {
          kind: "p",
          text: "Plaque modification balloons have a second job: besides helping the lesion expand, they stop a balloon slipping forwards or backwards out of a tight lesion during inflation (watermelon seeding). Brilakis lists its causes as a severe or angulated lesion, a guide that moves too much, a short balloon and fast inflation (the Oxford handbook also warns that balloons that are too short may slip in this way). To prevent it, inflate slowly, choose a longer balloon where you can, and counter any creep during the inflation: gentle traction on the balloon if it moves forwards, a gentle push if it moves back. If it happens, deflate at once so the healthy segment is not injured, then try again at lower pressure with slower inflation, add one or more buddy wires, change to a plaque modification balloon or use a longer balloon (9.7.9.3.2, 30.9.3).",
        },
        { kind: "tip", id: "pci-calc-cutting-slow" },
        { kind: "h", text: "Making the inflation work" },
        {
          kind: "steps",
          title: "Ways to get more from a balloon in calcium (Brilakis 19.9.3, 23.2.2)",
          items: [
            { title: "Pressure", detail: "High pressure, 20 atm or more, with a non-compliant balloon; for undilatable lesions often up to 26–28 atm. Know the rated burst pressure and the percentage diameter growth of each non-compliant balloon you use, since these differ between balloons: check the instructions for use before going above 20 atm. Brilakis also warns (9.7.9) that pressures above 20 atm are a cause of balloon rupture, especially in calcified lesions, and advises considering atherectomy or lithotripsy first in heavily calcified lesions. Go above 20 atm only with a non-compliant balloon whose rated burst pressure you know." },
            { title: "Time", detail: "Prolonged inflations: 1–2 minutes (19.9.3); 30–60 seconds or more (23.2.2). Once at high pressure, quickly lowering and raising the pressure several times may also help break the lesion." },
            { title: "Watch the indeflator", detail: "A falling pressure on the inflation device means the lesion is giving way: keep inflating for longer rather than deflating." },
            { title: "Buddy wires", detail: "One or more extra wires through the lesion alongside the balloon concentrate the force against the wall, acting as a makeshift scoring or cutting balloon." },
            { title: "Shorter balloon, or two balloons", detail: "A shorter balloon concentrates force within the lesion; two undersized balloons inflated side by side apply asymmetric force that sometimes opens it." },
            { title: "Stay within the lesion", detail: "Do not balloon segments that will not be stented, and cover every ballooned segment with stent to avoid restenosis from a geographic miss." },
          ],
        },
        { kind: "tip", id: "pci-calc-balloon-boost" },
        {
          kind: "check",
          stem: "A 3.0 mm non-compliant balloon in a calcified mid-RCA (reference 3.0 mm) holds a waist at 22 atm. After 20 seconds the indeflator reading drifts down to 19 atm while the waist starts to soften. What does this mean, and what do you do?",
          options: [
            "The balloon is leaking: deflate at once and check for perforation",
            "The lesion is yielding: hold the inflation longer, topping up the pressure",
            "The lesion is undilatable: deflate and go straight to atherectomy",
            "The guide has backed out: deflate and re-engage before trying again",
          ],
          answer: 1,
          explanation:
            "Brilakis teaches that a falling inflation pressure during a prolonged inflation suggests the lesion is expanding, so the inflation should be continued for longer. Rupture is the tempting answer, but rupture shows as a rapid, sudden loss of pressure, not a slow drift with a softening waist. Calling the lesion undilatable now would abandon an inflation that is working.",
        },
        { kind: "h", text: "What to watch for, and what can go wrong" },
        {
          kind: "table",
          caption: "Brilakis 19.9.3, 9.7.9, 23.2.2, 27.3",
          head: ["Watch for", "Meaning"],
          rows: [
            ["Full expansion of the 1:1 balloon", "Required before any stent; fixing an underexpanded stent is far harder than fixing a lesion not yet stented"],
            ["The deflated balloon passing freely back and forth through the lesion", "Shows whether the lesion has been modified enough for the stent to follow, or whether more predilatation is needed"],
            ["Cracks in circumferential superficial calcium on imaging", "Gives confidence that the stent will expand; on OCT, calcium fracture has been linked with better stent expansion"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Rupture.** More likely in heavy calcium, especially nodular calcium, and above 20 atm. A sudden fall in pressure is the sign: deflate at once (apply suction), remove the balloon, aspirate the guide and inject to look for dissection, perforation or no-reflow. If there is a perforation, inflate a new balloon proximal to it at once. A balloon that was not properly de-aired can also cause air embolism.",
            "**If a perforation is seen.** Brilakis's general sequence (26.2, Fig. 26.5): occlude with a balloon at or proximal to the hole; give intravenous fluids and vasopressors as needed; drain the pericardium if the patient becomes hypotensive; let the surgeons know. If contrast keeps leaking, treat by type: a covered stent or prolonged balloon inflation for a perforation of the main vessel, embolisation (fat or coils, for example) for a distal one. If it still leaks, reverse the anticoagulation, and surgery is the step after that. Brilakis advises that in most cases the reversal waits until every device is out of the coronary artery and the pericardium has been drained: giving protamine with equipment still in place risks thrombosis of the guide and the vessel, and the blood in the pericardium can clot so that it can no longer be drained. Glycoprotein IIb/IIIa inhibitors or cangrelor, if used, are stopped once a perforation occurs (26.2). The full algorithm is to be taught in cm-perforation.",
            "**Perforation.** From high pressure, especially in heavy calcium and with oversized balloons.",
            "**Dissection.** Part of how balloons work, but extensive dissection can compromise flow or occlude a side branch.",
            "**Entrapment.** A balloon can stick, especially after rupture; Brilakis's prevention is to consider primary atherectomy for very heavily calcified lesions and to avoid very high pressures that can rupture the balloon (27.3). After high-pressure inflations balloons can become sticky and pull the wire back on removal: watch the wire tip under fluoroscopy as you withdraw.",
            "**A balloon that will not deflate.** One of the causes Brilakis gives is acute recoil of a calcified lesion (or a stent) onto the balloon; strangling of the balloon inside the guide and a damaged hypotube are the others. Prevention: if a balloon's shaft kinks, change the balloon at once. If it happens, he first tries deflating with a second indeflator or a saline-filled luer-lock syringe; a balloon smaller than the vessel may be pulled back into the guide still inflated, or deliberately burst at high pressure; otherwise it is punctured with a stiff wire or the back end of a wire, aimed through an over-the-wire balloon inflated beside it or through a guide extension advanced over the cut shaft; surgery if all of this fails (9.7.10.3.1; the last items of 27.3.3). Retrieval is to be taught in full in cm-equipment-loss.",
            "**Plaque modification balloons.** They may not deliver through an undilatable lesion, and forcing them can cost guide and wire position: add support (an anchor technique or a guide extension) rather than more force. They can rupture or perforate the vessel. Excessive inflation force or a rupture inside the lesion can make the balloon hard to remove, fracturing a cutting-balloon blade, avulsing stent struts or trapping the balloon; inflate a cutting balloon slowly and keep it at or below 14 atm (23.2.3).",
          ],
        },
        {
          kind: "check",
          stem: "You are about to inflate a cutting balloon in a calcified lesion that resisted a non-compliant balloon. Which inflation technique follows the manuals?",
          options: [
            "Rapid inflation to 20 atm to drive the blades in before the balloon can slip",
            "Slow inflation of about 1 atm every 5 seconds, staying well within the lower ceiling",
            "Inflation to rated burst pressure for 2 minutes, then rapid cycling of the pressure",
            "Inflation at nominal pressure only, followed by withdrawal while still partly inflated",
          ],
          answer: 1,
          explanation:
            "The cutting balloon is the exception to high-pressure, prolonged inflation: Brilakis inflates and deflates it very slowly (about 1 atm every 5 seconds) so the blades unfold and rewrap, at usual pressures of 6–8 atm, not above 12 atm in chapter 9 and not above 14 atm in chapter 23. The high-pressure measures in the first and third options are for non-compliant balloons. The Oxford handbook warns that withdrawing a cutting balloon before it has fully deflated can injure the artery.",
        },
        { kind: "h", text: "Stenting and finishing" },
        {
          kind: "steps",
          items: [
            { title: "1. Only after full balloon expansion", detail: "Deliver and deploy the stent once a balloon has fully expanded the lesion (19.10)." },
            { title: "2. Expect a difficult delivery", detail: "Use support-enhancing techniques and meticulous preparation (pm-prep-and-stent teaches delivery). Poor preparation is one of the causes of stent loss that Brilakis lists. He also notes two small aids that may help a balloon or stent advance: running the atherectomy lubricant during advancement to lower friction, and a deep breath from the patient, which may straighten the arteries or change how the guide sits (9.7.8.3.2.5)." },
            { title: "3. Post-dilate", detail: "At high pressure (20 atm or more) with a 1:1 non-compliant balloon." },
            { title: "4. Check expansion", detail: "Image before stenting to confirm the preparation and after stenting to confirm expansion and to look for large edge dissections. Enhanced stent-visualisation X-ray modes help too. The IVUS and OCT criteria for an optimal result are taught in pm-imaging." },
            { title: "5. Recoil at an aorto-ostial lesion", detail: "Calcified aorto-ostial lesions can recoil even after stenting; a renal stent is sometimes used (cp-ostial)." },
          ],
        },
        { kind: "tip", id: "pci-calc-postdilate" },
        {
          kind: "pitfalls",
          items: [
            "Starting with a large-profile plaque modification balloon that cannot reach a tight lesion, instead of a standard balloon first.",
            "Inflating a cutting balloon quickly or to high pressure.",
            "Deflating too soon when the indeflator pressure falls, when the lesion is actually starting to yield.",
            "Ballooning outside the planned stent length, and leaving a ballooned segment unstented.",
            "Watching the screen instead of the indeflator, and missing the sudden pressure drop of a rupture.",
            "Accepting angiographic expansion without imaging: heavily calcified lesions can look expanded during inflation yet have a small lumen on imaging.",
          ],
        },
        {
          kind: "pearl",
          text: "Use the balloon as a gauge. A 1:1 non-compliant balloon that opens fully, then slides back and forth through the lesion without catching, tells you more about stent expansion than any angiographic view. If it does not, the lesion has told you it needs more than a balloon.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "In a calcified lesion, inflate a 1:1 non-compliant balloon at 20 atm or more with a prolonged inflation, watching the indeflator; if a waist persists, escalate (buddy wire, shorter balloon, plaque modification balloon) before stenting; then stent, post-dilate at 20 atm or more with a 1:1 non-compliant balloon and confirm expansion on imaging.",
        },
        { kind: "video", id: "g0IfIsNsops", note: "Manual of PCI case 15: a balloon-undilatable lesion." },
        { kind: "video", id: "o2MErY-y_ns", note: "Manual of PCI case 221: calcification, tortuosity and in-stent restenosis." },
        {
          kind: "keypoints",
          items: [
            "Test with a 1:1 non-compliant balloon; stent only after it fully expands.",
            "Boost the balloon: 20 atm or more within its rating (often up to 26–28 atm in undilatable lesions; above 20 atm rupture is more likely), prolonged inflation, buddy wires, a shorter or undersized balloon, two balloons side by side.",
            "A slowly falling indeflator pressure means the lesion is yielding: inflate for longer.",
            "Cutting balloon: about 1 atm every 5 seconds; usually 6–8 atm, ceiling 12 atm (chapter 9) or 14 atm (chapter 23).",
            "Rupture (sudden pressure loss): deflate, remove, inject; balloon proximal to any perforation.",
            "Post-dilate at 20 atm or more with a 1:1 non-compliant balloon, and image before and after stenting.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-ivl",
      title: "Intravascular lithotripsy",
      minutes: 10,
      topics: ["cx-ivl"],
      sources: [B("19"), B("23.2"), B("30.9"), B("15.1"), B("9.7"), B("14.1"), O_ROTA],
      refs: [...BOOKS, "disrupt-cad3-2020", "barbato-calcium-consensus-2023", "blachutzik-rota-shock-2023", "honton-icare-ofdi-2026", "kristensen-bali-2025", "kechichian-ivl-flutter-2021", "kwok-ivl-capture-2019", "angsubhakorn-calcium-review-2022"],
      blocks: [
        {
          kind: "p",
          text: "Intravascular lithotripsy brings to a balloon catheter the principle used to break kidney stones: pulses of energy from emitters inside the balloon pass into the wall and crack calcium. The two manuals were written while it was new, so this lesson sets out what they say, what the studies since then have shown, including randomised comparisons, and what you must take from the device's instructions instead.",
        },
        { kind: "h", text: "How it works" },
        {
          kind: "list",
          items: [
            "**Brilakis.** The system delivers shockwaves that fracture calcified plaque and overcome extreme resistance (23.2.9, 30.9.8). His text calls them ultrasound or ultrasonic shockwaves, but his own figure (Fig. 30.89) and the trial reports describe acoustic pressure waves; they are not diagnostic ultrasound.",
            "**Oxford handbook.** Pulsatile mechanical energy is delivered at 1 Hz by miniature emitters along a semi-compliant, rapid-exchange balloon; the pulses break up calcium near the lumen and deeper in the wall.",
            "**What imaging shows.** In the case Brilakis illustrates (Fig. 19.13), OCT before treatment showed near-circumferential calcium in an undilatable mid-RCA lesion; after lithotripsy (cavitation bubbles were visible on angiography) OCT showed multiple fractures and a large gain in lumen, and the stent then expanded fully on its own semi-compliant delivery balloon without a high-pressure non-compliant inflation.",
          ],
        },
        {
          kind: "table",
          caption: "The coronary lithotripsy catheter as printed in the manual (Brilakis Fig. 30.89, manufacturer's data, 2020). Check the current instructions for use; specifications change.",
          head: ["Feature", "As printed"],
          rows: [
            ["Balloon diameters", "2.5, 3.0, 3.5 and 4.0 mm"],
            ["Balloon length", "12 mm working length between the marker bands"],
            ["Wire and guide", "0.014 in. wire; 6 Fr guide compatible; working length 138 cm"],
            ["Crossing profile", "About 0.044 in. (0.043 in. for 2.5 mm, up to 0.046 in. for 4.0 mm)"],
            ["Pulses", "80 at most per catheter, as printed in 2020; check the instructions for use of the catheter in your hand"],
            ["Energy profile", "Emitters sit 6 mm apart, 4 mm and 2 mm from the marker bands; acoustic pressure falls off about 3 mm from an emitter, so the energy is smooth over the central 12 mm, and a 2 mm overlap between treated segments optimises it"],
          ],
        },
        {
          kind: "check",
          stem: "The printed energy profile says acoustic pressure falls off about 3 mm from an emitter and that a 2 mm overlap between treated segments optimises the energy. What is the practical consequence for a 30 mm calcified segment?",
          options: [
            "One position in the middle of the segment treats all of it, because the energy spreads along the vessel",
            "Treat it in several positions that overlap slightly, so that no part of the calcium is outside the energy field",
            "Place the balloon just proximal to the calcium so the energy is directed forwards into it",
            "Use a longer non-compliant balloon instead, because lithotripsy only works in focal lesions",
          ],
          answer: 1,
          explanation:
            "A 12 mm balloon whose energy falls off a few millimetres from each emitter cannot treat a 30 mm segment from one position; the figure's advice to overlap treated zones by 2 mm means stepping the balloon along the calcium. The energy is not projected forwards, so placing the balloon proximal to the lesion wastes pulses. Nothing in the sources limits lithotripsy to focal lesions; the figure itself describes how to cover a longer segment.",
        },
        { kind: "h", text: "Where it fits" },
        {
          kind: "list",
          items: [
            "Undilatable lesions with circumferential calcium (23.2.9), and in Brilakis's view especially larger or highly tortuous vessels (19.9.7, Fig. 19.14).",
            "Underexpanded stents: Brilakis cites a report of lithotripsy expanding a severely underexpanded stent, and lists it, where available, among the options to try before atherectomy inside a stent (23.2.5).",
            "Aorto-ostial lesions that are heavily calcified and hard to expand, and as one remedy for a balloon that slips during inflation at the ostium (15.1, cp-ostial).",
            "Preparing a diseased, calcified proximal vessel so that a balloon can reach the lesion beyond it (9.7.8).",
            "Outside the coronaries, it has been used to get large-bore sheaths and support devices through calcified iliofemoral arteries (14.1).",
          ],
        },
        {
          kind: "p",
          text: "**Its limitation is crossing.** The Oxford handbook names the main limitation as the balloon's inability to cross tight lesions. A lesion that a lithotripsy balloon cannot reach or cross needs other tools first: small balloons, and if they fail, the uncrossable-lesion algorithm, in which atherectomy is the fourth line (Brilakis Fig. 23.1; to be taught in cp-uncrossable).",
        },
        { kind: "tip", id: "pci-calc-ivl-crossing" },
        { kind: "h", text: "What the books say about its status, and what has changed" },
        {
          kind: "p",
          text: "In 2020 Brilakis described coronary lithotripsy as promising but not approved in the United States, with the peripheral catheter (smallest size 2.5 × 40 mm) used off label in large coronary arteries. The Oxford handbook, written while randomised efficacy data on the newer devices were still awaited, judged it the most hopeful of them and, because it is simple to use, saw it as having the potential to become the default approach for calcified lesions that will not dilate. Since then, DISRUPT CAD III, a single-arm study of 431 patients with severely calcified de novo lesions designed for regulatory approval of the coronary device, reported procedural success in 92.4% and freedom from major adverse cardiovascular events at 30 days in 92.2%, both above their prespecified performance goals; OCT showed calcium fractures in 67.4% of lesions. It was not a randomised comparison with other devices, and its abstract adds that the minimal stent area was similar whether or not OCT showed fractures. Randomised data have since appeared. In ROTA.shock (70 patients) lithotripsy was non-inferior to rotational atherectomy for minimal stent area on OCT (6.10 against 6.60 mm²). In ICARE OFDI (169 patients with moderate-to-severe calcified lesions, every procedure guided by optical frequency domain imaging) it was again non-inferior to rotational atherectomy for minimal stent area (6.0 against 5.9 mm²), with less major strut malapposition and target-lesion failure at 12 months that the authors judged equivalent (2.4% with lithotripsy, 1.2% with atherectomy). In BALI (200 patients with severely calcified lesions), adding lithotripsy to conventional preparation reduced the combined endpoint of procedural failure or target-vessel failure at 1 year (35% against 52%). The difference came mainly from less residual area stenosis of 20% or more on OCT (32% against 45%), although that component on its own did not reach statistical significance. The manuals' remarks on availability in the United States describe 2020, not today. The 2023 EAPCI clinical consensus statement includes lithotripsy alongside rotational and orbital atherectomy when choosing a tool by calcium morphology and location.",
        },
        {
          kind: "steps",
          title: "Using it: the steps the sources support",
          items: [
            { title: "1. Define the calcium", detail: "Image if the catheter crosses: circumferential or not, deep or superficial, how long. The lithotripsy balloon must be able to reach and cross the calcium." },
            { title: "2. Size, pressures and pulse sequence", detail: "Follow the device's instructions for use; neither manual gives a protocol, and this module does not invent one. Count pulses against the instructions for use of the catheter you are using: the 2020 figure printed 80 per catheter, and current catheters may differ." },
            { title: "3. Cover the whole calcified length", detail: "Step the balloon along the calcium so that treated segments overlap (Fig. 30.89)." },
            { title: "4. Prove the result", detail: "As after any modification, a 1:1 non-compliant balloon must expand fully before stenting (19.9.5.11 applies the same rule after atherectomy). Imaging may show fractures, which is reassuring, but expansion is what counts: in DISRUPT CAD III the minimal stent area was similar with or without visible fractures." },
            { title: "5. Stent and finish", detail: "Stent, post-dilate at 20 atm or more with a 1:1 non-compliant balloon, and confirm expansion on imaging (19.10)." },
          ],
        },
        {
          kind: "check",
          stem: "A 3.5 mm proximal RCA has 340° of calcium extending deep into the wall; a 3.5 mm non-compliant balloon held a waist at 24 atm. A 3.5 mm lithotripsy balloon crosses easily. After treatment, what must happen before the stent?",
          options: [
            "Nothing: lithotripsy fractures calcium so reliably that the stent can follow at once",
            "Rotational atherectomy as well, because lithotripsy only treats superficial calcium",
            "A 1:1 non-compliant balloon should expand fully, the real test of preparation",
            "A cutting balloon at 20 atm to finish what the pulses started",
          ],
          answer: 2,
          explanation:
            "Whatever the device, the proof is full expansion of a 1:1 non-compliant balloon. In DISRUPT CAD III fractures were seen on OCT in two-thirds of lesions, yet the final stent area was similar with or without visible fractures, so expansion, not the fracture itself, is the test. The Oxford handbook describes lithotripsy as acting on deep as well as superficial calcium, so the second option is wrong, and a cutting balloon is never taken to 20 atm.",
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing lithotripsy for a lesion its balloon cannot cross; the bulky catheter is its main weakness.",
            "Treating a long calcified segment from a single position.",
            "Running out of pulses part way along a long lesion without planning a second catheter.",
            "Assuming success without checking expansion with a non-compliant balloon and imaging, or treating the absence of visible fractures as failure when the balloon has expanded.",
            "Being surprised by extra beats timed with the pulses: lithotripsy can depolarise the myocardium, ventricular capture during pulses has been reported, and in one case report atrial flutter followed; keep the ECG and pressure on screen while pulsing. A 2022 review describes these pulse-timed captures as common and transient, with no ventricular tachyarrhythmias or adverse clinical outcomes reported; the authors of the flutter case suggest timing the pulses to the R wave to lower the risk.",
            "Teaching or using an inflation protocol from memory instead of the instructions for use.",
          ],
        },
        {
          kind: "pearl",
          text: "Brilakis describes lithotripsy as promising for undilatable lesions with circumferential calcium, especially in larger or highly tortuous vessels, and the Oxford handbook says it acts on deeper calcium as well as superficial. Its weakness is crossing. So ask two questions: can anything cross? If not, think small balloons and atherectomy first. If something crosses but the wall will not yield, lithotripsy is a strong candidate.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "In a calcified lesion with circumferential deep calcium on imaging and a non-compliant balloon waist, choose lithotripsy, step the balloon along the whole calcified length with overlapping positions, then prove the result with a 1:1 non-compliant balloon and imaging before stenting.",
        },
        { kind: "video", id: "mnqzShZ89zE", note: "Manual of PCI case 63: recurrent in-stent restenosis treated with lithotripsy and brachytherapy." },
        { kind: "video", id: "6I_7sjnvZpw", note: "Manual of CTO PCI case 304: lithotripsy with a drug-coated balloon." },
        { kind: "video", id: "tAVjcfDSUtI", note: "Manual of CTO PCI case 252: rotational atherectomy combined with lithotripsy for a heavily calcified CTO." },
        {
          kind: "keypoints",
          items: [
            "Lithotripsy: emitters in a balloon deliver pulses of acoustic pressure (1 Hz in the Oxford handbook) that fracture calcium, superficial and, per Oxford, deep.",
            "Printed specifications (2020): 2.5–4.0 mm, 12 mm long, 6 Fr, 80 pulses per catheter (check the current instructions for use); energy falls off about 3 mm from an emitter; overlap treated zones by 2 mm.",
            "Described as promising for undilatable, circumferential calcium, larger or tortuous vessels, underexpanded stents and calcified ostia.",
            "Main limitation: crossing tight lesions.",
            "DISRUPT CAD III (single arm, 431 patients): procedural success 92.4%, 30-day freedom from MACE 92.2%, fractures on OCT in 67.4%; since then the randomised ROTA.shock and ICARE OFDI (non-inferior to rotational atherectomy for stent area) and BALI (fewer failures when added to conventional preparation).",
            "Prove the result with a fully expanded 1:1 non-compliant balloon and imaging; follow the instructions for use for sizing and pulse protocol.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-rota",
      title: "Rotational atherectomy, step by step",
      minutes: 18,
      topics: ["cx-rota"],
      sources: [B("19"), B("30.10"), B("30.7"), B("30.9"), B("30.3"), B("23.1"), B("23.2"), B("15.1"), B("16.2"), B("25.2"), O_ROTA, O("ch 2: The cardiac physiologist")],
      refs: [...BOOKS, "barbato-rota-consensus-2015", "barbato-calcium-consensus-2023", "riley-scai-calcium-2024"],
      blocks: [
        {
          kind: "p",
          text: "Rotational atherectomy spins a diamond-coated burr at very high speed over a dedicated wire. The Oxford handbook explains why its role has changed: imaging studies showed that it works mainly by cracking calcium and changing the texture of the plaque rather than by removing bulk, so today it is used to make highly calcified, undilatable lesions dilatable. Brilakis's aim is the same: modify the vessel enough for a balloon to expand it, not debulk all the calcium.",
        },
        { kind: "h", text: "The system" },
        {
          kind: "table",
          caption: "Components of the rotational atherectomy system (Brilakis 30.10.1; Oxford ch 8: Rotational atherectomy)",
          head: ["Part", "What you need to know"],
          rows: [
            [
              "Burr",
              "Elliptical, nickel-coated; only its leading (distal) edge carries 2,000–3,000 diamond crystals of 20–30 µm, standing 5 µm proud. It ablates only while moving forwards, never on the way back, which is why it can become trapped. Eight sizes: 1.25, 1.5, 1.75, 2.0, 2.15, 2.25, 2.38 and 2.5 mm, of which the two smallest are the ones used most",
            ],
            [
              "Advancer",
              "A knob on top moves the burr back and forth; a brake-defeat button at the back releases the wire brake; a docking port holds the wire clip. Three connections: compressed gas that drives the shaft (the Oxford handbook names a helium tank), the flush infusion, and a fibre-optic cable that measures speed. Before use, the Oxford handbook checks the console connections and the helium level, then tests the burr speed",
            ],
            [
              "Wire",
              "330 cm long, 0.009 in. shaft with a 0.014 in. spring tip that the burr cannot pass. Floppy version (longer taper; most cases) and extra-support version (stiffer; aorto-ostial lesions, where it helps align the guide)",
            ],
            ["Wire clip torquer", "Steers the wire; docked in the advancer it stops the wire spinning if the brake is defeated during a run, and allows a single operator to work"],
            ["Console and pedal", "Console shows the speed and whether low-speed glide mode is on; the pedal starts rotation and has the glide-mode switch (retrieval at 60,000–90,000 rpm)"],
            [
              "Flush",
              "A lubricant emulsion (olive oil, egg yolk phospholipids and other components) runs down the drive shaft to cut friction and heat; the Oxford handbook adds vasodilators to the flush to cool the burr tip and prevent spasm. It is contraindicated in egg allergy; saline is used instead, often with verapamil and nitroglycerin, and wherever the lubricant is unavailable",
            ],
            ["Newer version", "Controls on the advancer (no foot pedal) and a smaller console that gives clearer warning of decelerations; burr, wire, clip and flush are unchanged. The Oxford handbook notes it makes single-operator use easier"],
          ],
        },
        { kind: "h", text: "Before you start: burr, guide and wire" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Choose the burr",
              detail: "A 1.5 mm burr is preferred most of the time; it may be less likely to become trapped than a 1.25 mm burr. Burrs of 1.75 mm or more are seldom used except in the left main. Brilakis aims for a burr-to-artery ratio of about 0.5 and lists a ratio below 0.5 among the measures that prevent slow flow; the Oxford handbook gives 0.5–0.6, and its figure caption says the burr should not exceed 0.6 times the reference diameter. Check the guide accepts the burr (1.25–1.75 mm in 6 Fr; 2.0 mm in 7 Fr; 2.15–2.25 mm in 8 Fr).",
            },
            {
              title: "2. Engage",
              detail: "A supportive guide, coaxial with the vessel and not damped. Burrs advance poorly through guides with big bends, such as the Amplatz left.",
            },
            {
              title: "3. Wire",
              detail: "Only the dedicated wire. Cross with a workhorse wire and microcatheter, then exchange: the atherectomy wire steers poorly and kinks easily. Replace a kinked atherectomy wire before any run, because ablating over a kink risks losing wire position (and, chapter 27 adds, wire fracture). The extra-support wire biases the burr to cut on the outer curve of a bend; the floppy wire cuts without that bias.",
            },
            {
              title: "4. Vasodilator",
              detail: "In most patients, unless hypotensive. Nicardipine is the usual drug; nitroprusside, verapamil or adenosine are alternatives (adenosine slowly and not in high doses into the RCA, where it is most likely to cause heart block; see the drug table in the set-up lesson). The flush is often a cocktail of verapamil, nitroglycerin and heparin with the lubricant.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 3.0 mm calcified mid-LAD needs rotational atherectomy. Which burr fits Brilakis's approach best?",
          options: [
            "A 1.25 mm burr, the smallest, because it is the least likely to become trapped",
            "A 2.0 mm burr, to debulk as much calcium as possible before stenting",
            "A 1.5 mm burr, a burr-to-artery ratio of 0.5, to modify the plaque rather than debulk it",
            "A 2.5 mm burr, so that a single pass leaves a lumen close to the reference size",
          ],
          answer: 2,
          explanation:
            "Brilakis usually chooses a ratio of about 0.5 (here 1.5 mm in a 3.0 mm artery) because the goal is a lesion that a balloon can expand, not complete debulking; the 1.5 mm burr is also his usual default. The 1.25 mm burr is the tempting choice, but he finds it more prone to entrapment, because it can slip through a lesion and then fail to come back (the so-called kokesi effect). Large burrs raise the risk of slow flow and perforation and are rarely needed outside the left main.",
        },
        { kind: "h", text: "The run, step by step (Brilakis 19.9.5.5 to 19.9.5.11)" },
        {
          kind: "steps",
          items: [
            {
              title: "5. Check the device outside the body: DRAW",
              detail: "**D**rip: the flush drips from the burr tip. **R**otate: activate outside the body (platforming) and confirm the chosen speed, usually 140,000–160,000 rpm, with the burr clear of towels and gauze, which it can wind up. **A**dvance: move the knob back and forth to check the burr runs smoothly. **W**ire: pull gently on the wire to confirm the brake holds. Then lock the knob about 2 cm from its distal end.",
            },
            {
              title: "6. Bring the burr up to the lesion",
              detail: "Advance under fluoroscopy while holding the wire still, or in glide mode (low speed to reduce friction on the wire) with the brake released; two operators traditionally, one if practised. With a large enough guide, trap the wire instead. Stop 1–2 cm proximal to the lesion and draw the knob back to release stored tension, so the burr does not jump into the lesion when it starts.",
            },
            {
              title: "7. Ablate",
              detail: "Confirm the drip is running and the wire clip is on the back of the wire. Start the burr proximal to the lesion and set the speed. Advance with a gentle pecking motion, avoiding decelerations of more than 5,000 rpm; watch, feel and listen for them. Keep each run short, ideally under 15 seconds, and wait at least 30 seconds, preferably longer, between runs. Watch the ECG and pressure throughout for bradycardia and ST change. Inject contrast after each run (one of Brilakis's measures against slow flow), and at once if you suspect a complication. A harder lesion is dealt with by adding short runs, never by stretching one run out. Repeat runs until the burr passes freely with no resistance or deceleration (polishing runs), or until a complication stops you.",
            },
            {
              title: "8. Remove the burr",
              detail: "Either in glide mode (press the glide button on the pedal or the newer advancer, check the wire clip is on, then press brake defeat while running at 60,000–90,000 rpm and withdraw, watching the wire tip; one operator can do this with the clip docked), or by trapping: pull the burr into the guide, inflate a balloon in the guide beyond the burr to pin the wire, and pull the burr out (screen only at the start). A guide extension built for trapping, which has its own trapping balloon, makes the separate balloon unnecessary, and dedicated trapping balloons (no wire lumen, so lower in profile and less prone to kinking) are an alternative to a standard balloon (19.9.5.8, 30.9.4). After any trapping, back-bleed the Y-connector before the next injection, because trapping without back-bleeding is a cause of air embolism (25.2.3.3).",
            },
            { title: "9. Angiogram", detail: "Look for slow flow or no-reflow, dissection, embolisation, side-branch loss and perforation." },
            {
              title: "10. Change back to a workhorse wire",
              detail: "Trap and exchange through a microcatheter or over-the-wire balloon. You can carry on over the atherectomy wire, especially if a complication has happened, but a workhorse wire steers better, injures the distal vessel less and kinks less.",
            },
            {
              title: "11. Balloon",
              detail: "Always follow atherectomy with a 1:1 non-compliant balloon to prove full expansion. If it does not expand, repeat atherectomy or add a plaque modification balloon or lithotripsy.",
            },
          ],
        },
        { kind: "tip", id: "pci-calc-rota-draw" },
        { kind: "tip", id: "pci-calc-rota-runs" },
        {
          kind: "check",
          stem: "During your second run the console shows the speed falling by about 9,000 rpm as the burr meets the lesion, and the run has lasted 20 seconds. What do you do?",
          options: [
            "Push a little harder to get through, since the burr is clearly working",
            "Increase the platform speed above 180,000 rpm so that the burr does not slow down",
            "Back off, end the run, wait at least 30 seconds, and resume with gentler, shorter pecking",
            "Stop the burr where it is inside the lesion to let it cool, then restart it there",
          ],
          answer: 2,
          explanation:
            "A deceleration above 5,000 rpm and a run beyond 15 seconds are both what Brilakis tells you to avoid: they raise the risk of burr entrapment and release larger and more particles, which causes slow flow. Back off, pause, and resume with lighter contact; if the lesion keeps resisting, add further short runs rather than lengthening this one. Speeds above 180,000 rpm are on his list of things that cause slow flow and perforation, and starting or stopping the burr inside the lesion invites entrapment.",
        },
        { kind: "h", text: "When the burr will not reach the lesion" },
        {
          kind: "table",
          caption: "Brilakis 19.9.5.6",
          head: ["Causes", "Prevention", "Solutions"],
          rows: [
            [
              "Tortuous, calcified vessel; poor guide support; a non-coaxial guide; tortuous iliac arteries that put bends in the guide",
              "Small burrs; balloon angioplasty before delivering the burr, especially in very tortuous vessels; a coaxial guide",
              "Pull the wire gently while advancing the burr; run glide mode while advancing; a guide extension (for a 1.25 or 1.5 mm burr, a 7 Fr extension is the size Brilakis prefers; a 7 Fr extension needs an 8 Fr guide, and in a 7 Fr guide the 6 Fr extension that fits takes a 1.25 mm burr, 16.2.9); ablate the proximal calcified segments first; a brief press of the pedal to nudge the burr forward (‘burping’)",
            ],
          ],
        },
        { kind: "tip", id: "pci-calc-burr-delivery" },
        { kind: "h", text: "Special situations" },
        {
          kind: "list",
          items: [
            "**Aorto-ostial lesions.** Use the extra-support wire and a coaxial guide (less risk of perforation or aortic dissection); the burr often has to be started at the guide tip with the tension released so it does not jump through the lesion, and larger burrs may be needed (15.1; cp-ostial).",
            "**Bifurcations.** Only the atherectomy wire stays in the treated artery unless you isolate the burr inside a guide extension or protect the other wire in a microcatheter (16.2; cp-bifurcation-provisional).",
            "**Inside stents.** Possible in old stents. It has also been done in stents placed moments earlier that failed to expand; in recently placed stents Brilakis advises higher speeds to avoid burr and stent entrapment, warns of distal embolisation and stent distortion, and says a new stent is needed in most cases because the old struts are disrupted; for undilatable stents, burrs of 1.75 mm or more are used selectively to avoid entrapment. In-stent atherectomy carries a higher restenosis risk than laser and is kept for when other measures fail (19.9.2, 23.2.5).",
            "**Balloon-uncrossable lesions.** Rotational atherectomy is favoured because it cuts forwards; a small burr (1.25–1.50 mm) lowers the risk of perforation, which may be higher if the burr works in the subintimal space. It cuts calcium preferentially but not elastic tissue such as the adventitia (23.1.7).",
            "**Lower speeds and embolisation.** In his chapter on acute closure, Brilakis suggests 140,000–150,000 rpm may lower the risk of distal embolisation and no-reflow (25.2.3.2).",
          ],
        },
        {
          kind: "table",
          caption: "Where the two manuals differ",
          head: ["", "Brilakis", "Oxford handbook"],
          rows: [
            ["Burr-to-artery ratio", "About 0.5 (below 0.5 to prevent slow flow; 0.5 or lower in the equipment chapter)", "0.5–0.6; not more than 0.6 × reference diameter"],
            ["Speed", "Usually 140,000–160,000 rpm; avoid more than 180,000 rpm; 140,000–150,000 rpm may embolise less", "135,000–180,000 rpm"],
            ["Run length", "Ideally under 15 seconds, at least 30 seconds between runs; resistance calls for extra runs, not longer ones","No run length given; advises pecking and avoiding decelerations over 5,000 rpm"],
            ["Bradycardia prevention", "Pacing, aminophylline or test runs for the RCA or dominant circumflex; atropine an alternative", "Check rate and ECG; pretreat with atropine when bradycardia is likely; some place a pacing wire, especially for a large RCA"],
          ],
        },
        {
          kind: "p",
          text: "Local protocols may follow other sources as well, such as the 2015 European expert consensus on rotational atherectomy and the 2023 EAPCI clinical consensus statement on calcified lesions, which updates it. In the United States, a 2024 SCAI expert consensus statement gives a central algorithm for choosing among the calcium-modification tools and tips for using each. When a protocol gives a number that differs from either manual, check which source it comes from before you rely on it.",
        },
        {
          kind: "pitfalls",
          items: [
            "Platforming with the burr touching a towel, which it winds up.",
            "Forgetting to release the stored tension, so the burr leaps into the lesion on activation.",
            "Long runs and forceful advancement with big decelerations: entrapment and slow flow.",
            "Starting or stopping the burr inside the lesion, or stopping it beyond the lesion.",
            "Ablating over a kinked wire, or with the burr close to the wire's radiopaque tip.",
            "Stenting straight after atherectomy without proving full expansion with a 1:1 non-compliant balloon.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of each run as a short conversation with the lesion: platform, touch, back off, touch again, stop within 15 seconds, wait at least 30. If you hear the pitch drop or feel the burr grab, you are talking too loudly. A stubborn lesion earns another short exchange, not a longer or louder one.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For a calcified 3.0 mm artery, choose the burr (ratio about 0.5) and check the guide accepts it; then plan the runs: platform speed, pecking with decelerations under 5,000 rpm, runs under 15 seconds, at least 30 seconds between runs, and a 1:1 non-compliant balloon to prove expansion afterwards.",
        },
        { kind: "video", id: "ouLZqVxa9fc", note: "Manual of PCI section 19.2: rotational atherectomy." },
        { kind: "video", id: "cUu7hh9XqZY", note: "Manual of PCI case 157: a 10-minute rotational atherectomy with a very-high-pressure balloon." },
        { kind: "video", id: "VplIgWZzLzk", note: "Elias Hanna: advanced rotational atherectomy techniques, with orbital atherectomy tips." },
        {
          kind: "keypoints",
          items: [
            "Rotational atherectomy now modifies calcium so balloons can work; it ablates only going forwards.",
            "Usually a 1.5 mm burr, ratio about 0.5 (Oxford 0.5–0.6); 1.75 mm or more mainly for the left main; check guide size.",
            "Dedicated wire, exchanged through a microcatheter; replace it if kinked.",
            "DRAW check; usual speed 140,000–160,000 rpm; stop 1–2 cm short and release tension.",
            "Pecking, decelerations under 5,000 rpm, runs under 15 seconds, pauses of 30 seconds or more, polish until free.",
            "Remove in glide mode (60,000–90,000 rpm) or by trapping; angiogram; workhorse wire; 1:1 non-compliant balloon.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-rota-complications",
      title: "Rotational atherectomy complications: slow flow, perforation, burr entrapment and more",
      minutes: 15,
      topics: ["cx-rota-complications"],
      sources: [B("19"), B("27.1"), B("27.2"), B("27.3"), B("27.4"), B("25.2"), B("26.2"), B("26.3"), B("23.1"), O_ROTA, O("ch 8: The ‘no-reflow’ phenomenon"), O("ch 10: Arrhythmia"), O("ch 10: Coronary perforation")],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Rotational atherectomy has five characteristic complications in Brilakis's chapter: reduced antegrade flow, perforation, burr entrapment, arrhythmias and fracture of the wire. The Oxford handbook lists perforation, no-reflow (from heating of the vessel and embolisation of pulverised calcium debris of 5–10 µm) and severe bradycardia or heart block. Each can be largely prevented by the run technique of the previous lesson; this lesson adds recognition and the bail-outs.",
        },
        { kind: "h", text: "1. Slow flow and no-reflow" },
        {
          kind: "table",
          caption: "Reduced antegrade flow after a run (Brilakis 19.9.5.7.1)",
          head: ["Causes", "Prevention", "Treatment"],
          rows: [
            [
              "Distal embolisation of debris; dissection; spasm",
              "Vasodilator before atherectomy; contrast after each run; burr-to-artery ratio under 0.5; no speeds above 180,000 rpm; no damping of the guide; runs under 15 seconds with more than 30 seconds between them; no atherectomy over an existing dissection; a coaxial guide at aorto-ostial lesions (less risk of aortic dissection)",
              "Embolisation suspected: stop atherectomy and give vasodilators (nicardipine, nitroprusside, verapamil or adenosine), ideally delivered into the distal bed through a microcatheter, dual-lumen catheter or aspiration catheter; intracoronary epinephrine for refractory no-reflow. Dissection suspected: a stent will probably be needed; a distal injection through a dual-lumen catheter, or IVUS, helps decide. For plaque embolisation Brilakis also lists aspiration thrombectomy to remove debris, laser if aspiration fails, and avoiding stenting, which can release more debris; covered stents may stop the embolisation but carry a high risk of restenosis and stent thrombosis (25.2.3.2). His first preventive measure for plaque embolisation is avoiding atherectomy, and where it is used, lower speeds",
            ],
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook's no-reflow section adds the general measures: deliver vasodilators as close to the distal bed as possible when antegrade flow is absent, avoid repeated contrast injections into a vessel with established no-reflow because they worsen ischaemia, and, when the pressure stays low, an intra-aortic balloon pump to support coronary perfusion. It also notes that nitrates, intracoronary GTN included, have not been shown to help in no-reflow. The drugs and doses are taught in pm-lab-drugs; the full approach to slow flow and embolisation is to be taught in cm-flow-embolism.",
        },
        { kind: "tip", id: "pci-calc-rota-slow-flow" },
        {
          kind: "check",
          stem: "After the third rotational atherectomy run in a mid-RCA, flow falls to TIMI 1 with ST elevation; blood pressure is 118/70 mmHg. Angiography shows no flap. What is your first move?",
          options: [
            "Another run to clear the debris that is blocking the lesion",
            "Stop atherectomy and give a vasodilator into the distal vessel through a microcatheter",
            "Stent the segment at once to seal the dissection that must be present",
            "Repeated forceful contrast injections to push the debris through the microcirculation",
          ],
          answer: 1,
          explanation:
            "Slow flow with no visible dissection after a run points to distal embolisation: Brilakis stops atherectomy and gives vasodilators, preferably delivered distally through a microcatheter or dual-lumen catheter, with intracoronary epinephrine if refractory. Stenting is the answer when dissection is the cause (check with a distal injection or IVUS), and Brilakis advises against stenting into plaque embolisation. The Oxford handbook warns that repeated contrast injections into a vessel with no-reflow worsen ischaemia.",
        },
        { kind: "h", text: "2. Perforation" },
        {
          kind: "list",
          items: [
            "**Causes.** A small vessel; a large burr; high speed; tortuosity; the wire tip too close to the lesion; a fractured wire allowing uncontrolled ablation; extreme wire bias.",
            "**Prevention.** Do not oversize the burr; avoid rotational atherectomy in highly tortuous vessels.",
            "**Treatment.** First inflate a balloon proximal to, or at, the perforation to stop bleeding into the pericardium, then follow the perforation algorithm: fluids and vasopressors, pericardial drainage if hypotension develops, the surgeons informed, then a covered stent or prolonged balloon inflation for a main-vessel hole or embolisation for a distal one, reversal of anticoagulation if leaking continues (in most cases only once all equipment is out of the artery and the pericardium is drained, because earlier reversal risks guide and vessel thrombosis and clotting of the pericardial blood), and surgery if that fails (Brilakis 26.2, 26.3; outlined in the balloon lesson, to be taught in full in cm-perforation). The Oxford handbook notes that perforation complicates 0.3% of PCI procedures, more often in complex cases and in debulking procedures such as atherectomy, and gives the same first step: occlude the vessel with a balloon at once.",
          ],
        },
        { kind: "tip", id: "pci-calc-atherectomy-perforation" },
        { kind: "h", text: "3. Burr entrapment" },
        {
          kind: "p",
          text: "Because only the front of the burr is diamond-coated, a burr that has passed a tight segment without ablating it may be unable to come back. Brilakis lists the causes as forceful advancement with large decelerations, small burrs (above all the 1.25 mm burr, which slips through and cannot return, the ‘kokesi’ effect), ablation inside previously deployed stents and very tortuous vessels. Prevention follows directly: gentle pecking with short, light contact; burrs of 1.5 mm or more; never stop the burr beyond the lesion; never start or stop it inside the lesion. The Oxford handbook gives the same advice: avoid decelerations over 5,000 rpm and do not wedge the burr in the lesion.",
        },
        {
          kind: "steps",
          title: "Bail-out for a trapped burr (Brilakis 19.9.5.7.3, Fig. 19.9)",
          items: [
            { title: "1. Straighten and pull", detail: "Straighten the guide, make it coaxial, and try again to withdraw the burr." },
            { title: "2. Glide mode", detail: "If the burr can still rotate, glide mode may free it." },
            { title: "3. Second wire and balloon", detail: "Pass a second wire alongside the burr and dilate a balloon next to it to dig it out." },
            { title: "4. Cut the shaft, advance a guide extension", detail: "Cut the drive shaft outside the patient, remove its plastic sheath, and advance a guide extension over it up to the burr, then pull." },
            { title: "5. Snare", detail: "Advance a snare over the cut shaft." },
            { title: "6. Pull the wire gently", detail: "The 0.014 in. wire tip is larger than the burr's 0.009 in. lumen, so pulling the wire back may bring the burr with it." },
            { title: "Other measures", detail: "Subintimal plaque modification beside the burr; vasodilators if the blood pressure allows." },
            { title: "Last resort", detail: "Emergency cardiac surgery if all else fails." },
          ],
        },
        { kind: "tip", id: "pci-calc-burr-entrapment" },
        {
          kind: "check",
          stem: "A 1.25 mm burr was pushed hard through a tight calcified LAD lesion and is now stuck beyond it; it will not rotate. The guide is coaxial and a firm pull has failed. Which step is next in Brilakis's algorithm?",
          options: [
            "Pull harder on the burr and wire together until the burr comes back",
            "Activate at full speed to ablate backwards through the lesion",
            "Advance a second wire past the burr and inflate a balloon beside it",
            "Send the patient straight to surgery, as percutaneous retrieval is not possible",
          ],
          answer: 2,
          explanation:
            "When the burr cannot be rotated in glide mode, Brilakis's next step is a second wire and a balloon inflated next to the burr; then cutting the shaft and advancing a guide extension, then a snare, then a gentle pull on the wire, with surgery last. The burr cannot ablate backwards because its trailing edge has no diamond coating, so spinning it at speed is not a rescue. Forceful pulling is not part of his stepwise algorithm (for a trapped wire he warns never to pull hard, because the wire can fracture, 27.2); surgery is the final step, not the first.",
        },
        { kind: "h", text: "4. Arrhythmias" },
        {
          kind: "list",
          items: [
            "**Causes.** Atherectomy of the RCA or a dominant circumflex; aggressive runs (long or forceful).",
            "**Prevention.** Temporary pacing, aminophylline or atropine for the RCA or a dominant circumflex; avoid aggressive runs.",
            "**Treatment.** Bradycardia usually resolves once the run stops. Tachyarrhythmias usually come from disturbed coronary flow, so treat the slow flow or dissection behind them. For persistent advanced block the Oxford handbook gives atropine (1 mg IV) to improve AV conduction and urgent temporary pacing for Mobitz II or complete block.",
          ],
        },
        { kind: "tip", id: "pci-calc-rota-bradycardia" },
        { kind: "h", text: "5. Wire fracture" },
        {
          kind: "list",
          items: [
            "**Causes.** Ablating close to the wire's 0.014 in. tip; ablating over a kinked wire; highly angulated lesions; prolonged contact in tortuous segments.",
            "**Prevention.** Keep the burr away from the wire tip; replace a kinked wire; keep the burr moving smoothly and do not push on against resistance. Where one spot resists, move the wire slightly during the run (a brief release of the brake with a gentle push or pull), so the burr does not grind the same segment of wire against the calcium.",
            "**Treatment.** Retrieve with another wire or a snare, or leave a fragment that has embolised distally to endothelialise. Brilakis checks a fractured wire with IVUS for unravelling, which is much harder to manage than a clean break (27.2.3.2; retrieval to be taught in cm-equipment-loss).",
          ],
        },
        { kind: "h", text: "Other losses that calcium invites" },
        {
          kind: "list",
          items: [
            "**Stent loss.** Calcium and tortuosity, poor preparation and direct stenting are among its causes. Prevention: meticulous preparation, often with atherectomy, and imaging to confirm expansion before delivery; avoid direct stenting and forceful advancement; use a guide extension to deliver stents in tortuous calcified vessels, and never force a stent that resists inside the extension (27.1.2).",
            "**Balloon entrapment.** Prevented by considering primary atherectomy for very heavily calcified lesions and avoiding very high pressures that rupture balloons (27.3).",
            "**Wire entrapment and microcatheter entrapment or fracture.** Severe calcification is a cause of wire entrapment; aggressive pushing of microcatheters (soft-tipped ones especially) through calcified lesions causes microcatheter entrapment and tip fracture (27.2, 27.4). For a trapped wire Brilakis's first rule is never to pull hard, because a damaged wire can fracture or unravel; he advances a balloon or microcatheter (or a guide extension) over it as far as it will go and pulls gently, then inflates that balloon and pulls again, then passes a second wire and inflates a balloon beside the trapped one, with surgery if all fail (27.2.3). The full retrieval algorithms are to be taught in cm-equipment-loss.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Running again into slow flow instead of stopping and giving distal vasodilators.",
            "Stenting into no-reflow caused by embolisation rather than dissection.",
            "Relying on force to free a trapped burr instead of working through the stepwise bail-out.",
            "Choosing a 1.25 mm burr ‘to be safe’ and creating the conditions for entrapment.",
            "Ignoring a spot of persistent resistance and grinding the same segment of wire until it fractures.",
          ],
        },
        {
          kind: "pearl",
          text: "Most rotational atherectomy complications are the same mistake seen from different angles: too much contact for too long. Short, light runs with long pauses prevent the debris load that causes slow flow, the wedging that traps the burr, and the sustained grinding that breaks the wire.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, if the lab reports slow flow or no-reflow after lesion preparation, stop, check for dissection, and give a vasodilator into the distal vessel through a microcatheter rather than through the guide; if bradycardia appears, stop the run and wait for recovery before planning shorter runs.",
        },
        { kind: "video", id: "ZEbuw8GvF48", note: "Manual of PCI section 19.4: rotational atherectomy complications." },
        { kind: "video", id: "vAOGSbKG4xM", note: "Manual of PCI case 215: snuffbox access, kink, rotational atherectomy, perforation and coil." },
        { kind: "video", id: "5QqwesnusBk", note: "Manual of PCI case 6: severe calcification and distal vessel perforation." },
        {
          kind: "keypoints",
          items: [
            "Slow flow: stop, vasodilators delivered distally, epinephrine if refractory; stent only if dissection is the cause.",
            "Prevent slow flow: vasodilator first, contrast after each run, burr-to-artery ratio under 0.5 (no oversizing), no speeds above 180,000 rpm, no damping, short runs and long pauses.",
            "Perforation: balloon proximal to or at the hole first; avoid large burrs and tortuous vessels.",
            "Burr entrapment: gentle pecking, burr of 1.5 mm or more, never stop beyond or inside the lesion; bail-out: straighten, glide mode, wire and balloon, cut shaft and guide extension, snare, gentle wire pull, surgery.",
            "Bradycardia in the RCA or dominant circumflex usually stops when the run stops; prevent with pacing, aminophylline or atropine.",
            "Wire fracture: keep away from the wire tip, replace kinked wires, move the wire at a point of persistent resistance.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-orbital",
      title: "Orbital atherectomy, step by step",
      minutes: 13,
      topics: ["cx-orbital"],
      sources: [B("19"), B("30.10"), B("15.1"), B("16.2"), B("25.2"), O_ROTA],
      refs: [...BOOKS, "kirtane-eclipse-2025"],
      blocks: [
        {
          kind: "p",
          text: "Orbital atherectomy uses a diamond-coated crown mounted off-centre on a drive shaft. As it spins, the crown swings out in an elliptical orbit that widens as the speed rises, abrading the calcium as it goes (Oxford). Because the orbit, not the crown size, sets how much of the wall is treated, the Oxford handbook states that the one 1.25 mm crown can treat vessels up to 3.5 mm in diameter without upsizing. Brilakis, separately, favours the orbital device for larger vessels because a single crown gives effective ablation where rotational atherectomy would need ever larger burrs, and he considers high speed for vessels over 3.5 mm.",
        },
        {
          kind: "table",
          caption: "The orbital system (Brilakis 30.10.2, Fig. 30.99; Oxford ch 8: Rotational atherectomy)",
          head: ["Part", "Details"],
          rows: [
            ["Device", "Hand-held, over-the-wire; sheath-covered drive shaft with an eccentric 1.25 mm diamond-coated crown; an advancer knob with an on/off button on top, crown-advancement markings and a manual wire brake; 6 Fr guide compatible"],
            ["Speeds", "Two buttons, 80,000 and 120,000 rpm; the low-speed button also starts the glide setting, which turns the crown at 5,000 rpm for advancing and withdrawing it"],
            ["Pump", "Mounts on a drip stand, supplies power and saline, and sounds an alert after 25 seconds of spinning"],
            ["Wire", "Dedicated wires only: the standard one is moderately stiff stainless steel, silicone-coated, with a 0.012 in. shaft widening to a 0.014 in. radiopaque spring tip; the flex-tip version is nitinol with a 1 g tip load, a more flexible body that reduces wire bias, and good torque response. The flex-tip wire can be used to cross the lesion in the first place; the standard wire is stiffer and harder to steer"],
            ["Lubricant", "20 mL per litre of saline; it contains soybean oil, egg yolk phospholipid and glycerin. Neither manual gives a contraindication for it (Brilakis gives egg allergy as one for the rotational lubricant only); because of its egg and soy content, check the instructions for use in a patient with egg or soy allergy, a precaution that is not from the manuals"],
          ],
        },
        {
          kind: "table",
          caption: "Where the two manuals differ on orbital atherectomy",
          head: ["", "Brilakis", "Oxford handbook"],
          rows: [
            ["Entrapment", "Must not be used in recently placed stents because of the risk of entrapment; complications similar to rotational atherectomy", "Diamond chips on the front and back of the crown let it ablate in both directions, which makes entrapment theoretically impossible"],
            ["Wire size", "0.012 in. shaft, 0.014 in. tip", "Described as a 0.014 in. wire"],
            ["Power", "Electrically powered device and pump", "Describes a pneumatic console"],
          ],
        },
        {
          kind: "p",
          text: "Treat the entrapment point as Brilakis teaches it: whatever the crown's design, a device can be caught in a freshly deployed stent, and his rule for fresh stents is absolute.",
        },
        { kind: "h", text: "The procedure (Brilakis 19.9.6)" },
        {
          kind: "steps",
          items: [
            { title: "1. Engage", detail: "As for rotational atherectomy: supportive, coaxial, undamped." },
            { title: "2. Wire", detail: "Cross with a workhorse wire and microcatheter and exchange for the dedicated wire; the standard dedicated wire is stiff and hard to steer." },
            { title: "3. Vasodilator", detail: "In most patients, unless hypotensive; nicardipine usually, or nitroprusside, verapamil or adenosine." },
            {
              title: "4. Test outside the body",
              detail: "Connect to the pump and load over the wire. Check that the advancer knob slides freely and the lubricant drips from the tip; test rotation (brake down, press and release the on/off button) and see the lubricant flow increase. Hold the crown in the air: it tangles in towels. Lock the knob 1 cm from its fully proximal position.",
            },
            {
              title: "5. Bring the crown up",
              detail: "Advance under fluoroscopy while holding the wire, or by trapping, which works in a 7 or 8 Fr guide (or through an 8 Fr guide extension designed for trapping) but not in a 6 Fr guide or alongside an ordinary guide extension. With the knob locked and the brake up, stop about 3–5 mm proximal to the lesion.",
            },
            {
              title: "6. Brake down and choose the speed",
              detail: "The crown will not spin unless the wire brake is locked (except in glide mode, so hold the wire, ideally with a torquer, if you spin without the brake). Start at low speed, 80,000 rpm, in every case: it has less risk of dissection and perforation than 120,000 rpm, and nearly every case can be finished at low speed. Consider high speed for vessels over 3.5 mm or when the post-dilatation balloon does not fully expand; avoid it in arteries under 3.0 mm.",
            },
            { title: "7. Release tension", detail: "Unlock the knob and draw it fully back to release torque in the drive shaft, which otherwise makes the device jump when it starts." },
            {
              title: "8. Spin, then advance slowly",
              detail: "Press on, wait 2 seconds for the orbit to stabilise, then advance at about 1 mm per second, slower still if the pitch changes. Never force it. Work in and out of the lesion so that the crown follows the knob one-to-one on live screening; the device works in both directions, at the same 1 mm per second.",
            },
            {
              title: "9. Runs and rests",
              detail: "Runs under 15 seconds (the pump beeps at 25 seconds); rest 30–60 seconds between runs, and never less than the length of the previous run, to limit spasm and let debris clear the microcirculation.",
            },
            {
              title: "10. Where to stop, and when to finish",
              detail: "Never stop the crown inside an untreated obstructive lesion; move it slowly beyond or before the lesion. Keep it at least 10 mm from the radiopaque end of the wire, which it can shear off. Stop when the crown passes easily with no change in sound. Total treatment time should be under 5 minutes; if more is needed, use a new device. Inject intermittently, and always before removal or if chest pain, ECG change or hypotension appears.",
            },
            {
              title: "11. Remove, check, exchange, balloon",
              detail: "Walk the device back (knob locked, brake up, watching the wire tip), withdraw in glide mode, or trap in the guide (then back-bleed the Y-connector before injecting, to avoid air embolism). Angiogram for complications; trap and exchange to a workhorse wire (you may continue on the dedicated wire, especially after a complication; the flex-tip version is easier to work over); then a 1:1 non-compliant balloon must expand fully, or modify further.",
            },
          ],
        },
        { kind: "tip", id: "pci-calc-orbital-low-speed" },
        {
          kind: "check",
          stem: "You are about to start orbital atherectomy in a 2.75 mm calcified circumflex. Which set-up is right?",
          options: [
            "High speed (120,000 rpm) from the start, because the calcium is hard and the vessel is small",
            "80,000 rpm, brake locked, tension released, then advance about 1 mm per second",
            "Low speed with the wire brake released, so the crown can spin freely over the wire",
            "Start spinning with the crown inside the lesion so that it engages the calcium at once",
          ],
          answer: 1,
          explanation:
            "Brilakis starts every orbital case at 80,000 rpm and advises avoiding high speed in arteries under 3.0 mm. The crown spins only with the brake locked (the glide setting is the exception), tension is released by drawing the knob back before activation, and advancement is slow, about 1 mm per second. The crown is never started or stopped inside an untreated obstructive lesion.",
        },
        { kind: "h", text: "Challenges" },
        {
          kind: "table",
          caption: "Brilakis 19.9.6.5 and 19.9.6.6",
          head: ["Problem", "What to do"],
          rows: [
            [
              "The crown will not reach the lesion (tortuous calcified vessel, a guide with several bends such as an Amplatz, poor support)",
              "Prevent: a larger guide; balloon angioplasty first; or cross the lesion in glide mode and treat while withdrawing. Solve: pull the wire gently while advancing the crown; a guide extension; glide mode at 5,000 rpm (it spins even when unlocked, so hold the wire); treat the proximal segment first",
            ],
            [
              "Aorto-ostial lesion (the orbit is not constrained by the vessel wall)",
              "If the crown can cross, take it to a relatively normal segment beyond, start at low speed and treat backwards. If not, with a coaxial guide seat the device's nose cone in the ostium with the crown 5 mm from the lesion, which constrains the orbit, and advance slowly at low speed, then treat backwards. If the nose cone cannot engage the ostium, do not use orbital atherectomy (cp-ostial)",
            ],
            [
              "Diseased side branches (risk of side-branch dissection and occlusion)",
              "Protecting the branch with a wire inside a microcatheter has been proposed but can damage both and embolise, needs an 8 Fr guide, and should be avoided. Delivering the device through a guide extension beyond the branch can protect more proximal branches. Brilakis's bifurcation section (16.2.9) nevertheless lists microcatheter protection, with a small microcatheter moved during the runs, as an option, and also accepts leaving the side-branch wire in place at a low risk of wire damage: the two sections differ, so weigh the risks for the branch in front of you",
            ],
          ],
        },
        {
          kind: "check",
          stem: "Compared with rotational atherectomy, which statement about orbital atherectomy is supported by Brilakis?",
          options: [
            "It may be less likely to cause bradycardia, and one crown can treat a range of vessel sizes",
            "It is preferred for balloon-uncrossable lesions, because it cuts forwards",
            "It is the preferred device inside a stent implanted earlier in the same procedure",
            "Its runs may last up to 60 seconds, because the crown ablates in both directions",
          ],
          answer: 0,
          explanation:
            "Brilakis notes that orbital atherectomy may cause bradycardia less often than rotational atherectomy, and prefers it in larger vessels because one crown suffices. Rotational atherectomy is preferred for uncrossable lesions because it ablates forwards (the orbital crown ablates sideways), and orbital atherectomy must not be used in recently placed stents. Runs are kept under 15 seconds; 30–60 seconds is the rest between runs.",
        },
        { kind: "h", text: "Evidence" },
        {
          kind: "p",
          text: "Brilakis mentions ECLIPSE as an ongoing 2,000-patient trial. Its results are now published: in 2,005 patients with severely calcified lesions judged suitable for either approach, routine orbital atherectomy before stenting did not lower target-vessel failure at 1 year (11.5% against 10.0% with a balloon-based strategy) or increase the minimal stent area at the site of maximal calcium (7.67 against 7.42 mm²). The authors concluded that the findings support a balloon-first approach, guided by imaging, for calcified lesions that can be crossed and dilated. Because the trial enrolled only lesions suitable for either strategy, it says nothing about lesions that balloons cannot cross or dilate; cardiac deaths at 1 year were numerically higher with orbital atherectomy (39 of 1,008 against 26 of 997), with no formal comparison reported in the abstract. In Brilakis's algorithm atherectomy remains the step for lesions that balloons cannot cross or dilate. Brilakis also suggests 80,000 rpm as the speed that may lower the risk of distal embolisation (25.2.3.2).",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting at high speed, or using high speed in an artery under 3.0 mm.",
            "Advancing too fast or forcing the crown, so it stops following the knob one-to-one.",
            "Spinning in glide mode without holding the wire.",
            "Letting the crown come within 10 mm of the radiopaque end of the wire.",
            "Activating the crown in the aortic root at an aorto-ostial lesion, where the orbit is unconstrained.",
            "Using orbital atherectomy in a stent placed during the same procedure.",
          ],
        },
        {
          kind: "pearl",
          text: "With orbital atherectomy, slowness is the technique: low speed, 1 mm per second, the crown tracking the knob exactly, short runs and rests at least as long as the run. When the sound stays constant through the lesion, you are done.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Plan orbital atherectomy for a calcified 3.0 mm artery (no orbital device in the lab yet): state the guide size if you want to trap the crown, the starting speed, where the crown stops before activation, the run and rest times, the 10 mm rule for the wire tip, and how you will prove the result with a 1:1 non-compliant balloon.",
        },
        { kind: "video", id: "6RkgfkP56WM", note: "Manual of PCI section 19.3: orbital atherectomy." },
        { kind: "video", id: "act-bZAq1AY", note: "Manual of CTO PCI case 182: orbital and rotational atherectomy." },
        { kind: "video", id: "VplIgWZzLzk", note: "Elias Hanna: rotational atherectomy techniques, with orbital atherectomy tips." },
        {
          kind: "keypoints",
          items: [
            "An eccentric 1.25 mm diamond crown orbits wider as speed rises; one crown treats vessels up to 3.5 mm (Oxford).",
            "Dedicated wire only; flex-tip version can wire primarily and has less bias.",
            "Always start at 80,000 rpm; consider 120,000 rpm for vessels over 3.5 mm or when the post-dilatation balloon does not fully expand; avoid it in arteries under 3.0 mm.",
            "Brake locked; release tension; advance 1 mm per second; runs under 15 seconds; rest 30–60 seconds.",
            "Never stop in an untreated lesion; stay 10 mm from the wire tip; total under 5 minutes per device.",
            "Not in recently placed stents (Brilakis); the Oxford handbook calls entrapment theoretically impossible.",
            "ECLIPSE: no advantage of routine orbital atherectomy over balloon-first preparation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-calcium-laser",
      title: "Excimer laser for uncrossable lesions and underexpanded stents",
      minutes: 13,
      topics: ["cx-laser"],
      sources: [B("23.1"), B("23.2"), B("30.11"), B("19"), B("20.9"), B("16.2"), B("25.2"), O_ROTA],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Excimer laser coronary atherectomy delivers pulsed ultraviolet light through a catheter that tracks over any standard 0.014 in. wire. That single fact explains its place: rotational and orbital atherectomy need their own wires, which must be exchanged in through a microcatheter, but laser can be used over the wire that has already crossed. Brilakis reports that it is increasingly used for balloon-uncrossable and balloon-undilatable lesions. It is not very effective against severe calcium on its own, with the notable exception of underexpanded stents.",
        },
        {
          kind: "table",
          caption: "The laser system (Brilakis 30.11, 23.1.6, 20.9.6)",
          head: ["Feature", "Details"],
          rows: [
            ["Energy", "Ultraviolet light of 308 nm from a pulsed xenon-chlorine laser; pulse frequency 25–80 Hz, fluence 30–80 mJ/mm²; the light disrupts the plaque's molecular structure (photoablation) rather than heating it"],
            ["Catheters", "0.9–2.0 mm; rapid-exchange catheters come in 0.9 mm, 1.4 mm, 1.7 mm and 2.0 mm, and an over-the-wire catheter in 0.9 mm. In coronaries the 0.9 mm catheter, compatible with 6 Fr guides, is nearly always used; larger catheters are for vein grafts or very large native arteries"],
            ["Lasing limit", "The coronary catheter lases for 10 seconds, then switches off for 5 seconds, and is programmed to limit ischaemia with a slow continuous saline infusion; many operators therefore use a 0.9 mm peripheral catheter off label, which has no time limit and allows up to 80 Hz"],
            ["Start-up", "The console needs about 5 minutes to warm up and must be calibrated: anticipate and switch it on early"],
            ["Uses", "Balloon-uncrossable lesions; balloon-undilatable lesions including underexpanded stents; occasionally thrombus (it may vaporise thrombus and inhibits platelet aggregation); an option when atherectomy is needed at a bifurcation with two wires in place, and when aspiration fails after plaque embolisation"],
          ],
        },
        {
          kind: "check",
          stem: "A workhorse wire has crossed a calcified, tortuous RCA lesion, but neither a 1.0 mm balloon nor two microcatheters will follow, despite a guide extension. Why is laser the logical next device here rather than rotational atherectomy?",
          options: [
            "Laser is the most effective device for severe calcium in every situation, de novo or in-stent",
            "Rotational atherectomy is contraindicated in every RCA because of the risk of bradycardia and block",
            "Laser uses the wire already across; the atherectomy wire cannot be exchanged in without a microcatheter",
            "Laser carries no risk of perforation in tortuous vessels, unlike rotational or orbital atherectomy",
          ],
          answer: 2,
          explanation:
            "Without a microcatheter across, the dedicated atherectomy wire cannot be exchanged in, which is the main limitation of rotational atherectomy the Oxford handbook names, with laser as the alternative; Brilakis's reason for laser's growing use is the same. Laser is not very effective against severe calcium in general, and tortuous vessels are exactly where laser perforation happens, so the fourth option is false. Bradycardia in the RCA is managed, not a contraindication.",
        },
        { kind: "h", text: "Laser for a balloon-uncrossable lesion (Brilakis 23.1.6)" },
        {
          kind: "steps",
          items: [
            { title: "1. Catheter and settings", detail: "The 0.9 mm catheter, usually at the highest repetition rate and fluence (80 Hz and 80 mJ/mm²)." },
            { title: "2. Saline, not contrast", detail: "Lase during saline flushing. The laser can modify the uncrossable segment, sometimes just the entry to it without crossing, and let a balloon enter." },
            { title: "3. Lasing with contrast: generally only inside stents", detail: "Contrast can be injected while lasing (through the guide, or the side port of an over-the-wire catheter, which is rarely used in coronaries). Under the laser the contrast forms bubbles that burst violently, and this modifies the plaque far more strongly than lasing in saline, at the price of more vessel injury and perforation. Brilakis generally keeps it for lesions inside previously deployed stents." },
            { title: "4. Then the balloon", detail: "Follow with a small balloon, and continue the uncrossable or undilatable algorithm as needed (outlined in the strategy lesson; to be taught in full in cp-uncrossable)." },
          ],
        },
        { kind: "tip", id: "pci-calc-laser-uncrossable" },
        {
          kind: "list",
          items: [
            "**Perforation.** Especially in tortuous vessels; the risk may be higher at the top settings and with contrast, and is lower inside stents.",
            "**Wire damage.** Lasing over a polymer-jacketed wire can damage the jacket and make the wire sticky.",
            "**Combinations.** Laser can be combined with support techniques and other devices, for example an anchor balloon with laser, or laser followed by orbital or rotational atherectomy as a hybrid strategy for balloon-uncrossable lesions (Fig. 23.6 shows laser, then orbital atherectomy, after a microcatheter would not cross). Laser with rotational atherectomy has been described for highly resistant lesions that neither treats alone (23.2.5).",
          ],
        },
        { kind: "h", text: "Laser for an undilatable lesion or an underexpanded stent (Brilakis 23.2.6)" },
        {
          kind: "steps",
          items: [
            { title: "1. Catheter and settings", detail: "The 0.9 mm catheter at 80 Hz and 80 mJ/mm²." },
            { title: "2. Saline, or contrast if inside the stent", detail: "Lase during saline flushing; inside an underexpanded stent, lasing during contrast injection can often expand it (extra-stent laser-assisted plaque modification). In de novo lesions contrast lasing is rarely used, because it can cause dissection or perforation." },
            { title: "3. Test with a high-pressure balloon", detail: "Inflate a high-pressure balloon to see whether enough modification has happened for the lesion or stent to expand." },
            { title: "4. If it still fails", detail: "In Brilakis's in-stent algorithm, atherectomy follows laser; in-stent atherectomy carries more restenosis than laser and risks embolising stent material, burr entrapment and stent damage that needs another stent, so it comes after laser rather than before." },
          ],
        },
        {
          kind: "check",
          stem: "A long, heavily calcified de novo LAD lesion is undilatable after non-compliant and scoring balloons, and the team proposes laser during contrast injection ‘because it works so well’. What does Brilakis advise?",
          options: [
            "Agree: contrast lasing is the standard technique for de novo calcified lesions",
            "Lase during saline flushing; keep contrast lasing for lesions inside a previously deployed stent",
            "Avoid laser altogether, since it has no role in undilatable lesions",
            "Lase with contrast at the lowest settings, which removes the extra risk",
          ],
          answer: 1,
          explanation:
            "Lasing during contrast injection produces strong plaque modification but raises the risk of dissection and perforation, so Brilakis generally reserves it for lesions within stents, such as underexpanded stents; de novo lesions are lased during saline flushing. Laser does have a role in undilatable lesions (it is in both arms of his algorithm). Brilakis does link more risk with the top settings, but his advice here is about where contrast lasing is done, not about the setting.",
        },
        { kind: "tip", id: "pci-calc-laser-underexpanded-stent" },
        {
          kind: "p",
          text: "Brilakis's illustrative case (Fig. 23.8) shows the whole sequence: in-stent restenosis in a mid RCA with an underexpanded stent (minimal lumen area 3.3 mm² on IVUS) and heavy calcium did not yield to a 3.5 mm non-compliant balloon; multiple laser runs at 80 mJ/mm² and 80 Hz, further non-compliant and scoring balloons still failed on IVUS; rotational atherectomy with a 1.5 mm burr, then a scoring balloon and a 4.0 mm non-compliant balloon, finally expanded the stent. Persistence, imaging at each stage and the right order of tools are the lesson.",
        },
        {
          kind: "pitfalls",
          items: [
            "Forgetting the warm-up and calibration time, and waiting 5 minutes at the critical moment.",
            "Lasing during contrast injection in a de novo lesion.",
            "Lasing over a polymer-jacketed wire and finding it sticky afterwards.",
            "Expecting laser alone to deal with severe de novo calcium.",
            "Using top settings in a tortuous vessel without weighing the perforation risk.",
          ],
        },
        {
          kind: "pearl",
          text: "If a case might need laser, switch the console on when you first suspect it, not when you need it. Laser's value is that it works over the wire you already have; its cost is that it is not ready the moment you reach for it.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For an underexpanded stent in a calcified artery (no laser device in the lab yet), plan the sequence: high-pressure non-compliant balloon with a buddy wire, then a plaque modification balloon, then laser with the 0.9 mm catheter at 80 Hz and 80 mJ/mm² during contrast injection inside the stent, then a high-pressure balloon test and imaging, and say when atherectomy would follow.",
        },
        { kind: "video", id: "fU4zxBe9TRY", note: "Manual of PCI section 9.4: laser for PCI." },
        { kind: "video", id: "3hpSdWyOZjE", note: "Brilakis: the impact of contrast on coronary laser activation." },
        { kind: "video", id: "3Yf6eFN63fw", note: "Manual of CTO Interventions case 47: laser for a balloon-uncrossable lesion." },
        {
          kind: "keypoints",
          items: [
            "Laser (308 nm, 25–80 Hz, 30–80 mJ/mm²) works over any 0.014 in. wire: its key advantage over atherectomy.",
            "Usually the 0.9 mm catheter at 80 Hz and 80 mJ/mm²; coronary catheters lase 10 seconds on, 5 off.",
            "Warm-up and calibration take about 5 minutes: set up early.",
            "Lase during saline flushing; contrast lasing generally only inside stents (underexpanded stents).",
            "Risks: perforation (tortuosity, top settings, contrast) and damage to polymer-jacketed wires.",
            "Not very effective for severe de novo calcium; valuable for uncrossable lesions and underexpanded stents, alone or combined with atherectomy.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-calcium-q1",
      stem: "On the fluoroscopy run before contrast, a proximal LAD lesion shows dense opacities on both sides of the vessel that stay visible when the heart is still. How does Brilakis grade this calcium?",
      options: ["Severe", "Moderate", "Mild", "Cannot be graded without intravascular imaging"],
      answer: 0,
      explanation:
        "Densities visible without cardiac motion and involving both sides of the arterial wall are Brilakis's definition of severe calcification. Moderate calcium covers less than 50% of the reference diameter and is often seen only with cardiac motion. Imaging grades the arc more precisely, but the angiographic grade does not depend on it.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cp-calcium-q2",
      stem: "IVUS of a calcified mid-RCA lesion shows calcium spanning about 200° of the circumference. How does Brilakis grade this arc, and what can IVUS not tell you about it?",
      options: [
        "Mild; IVUS cannot show the calcium's arc reliably at all",
        "Moderate; IVUS cannot show the calcium's thickness, which lies in its shadow",
        "Severe; IVUS cannot show whether the calcium lies close to the lumen or deep in the wall",
        "Moderate; IVUS cannot show the length of the calcified segment",
      ],
      answer: 1,
      explanation:
        "Brilakis grades an arc under 180° as mild, 180–270° as moderate and over 270° as severe. On IVUS the ultrasound is blocked by calcium, which shows a bright front edge and an acoustic shadow, so its thickness is hidden in the shadow; OCT can usually show it. The leading edge still shows whether the calcium is superficial or deep. Arc and length are measured with either method, so the other options name things IVUS does show.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-calcium-q3",
      stem: "A workhorse wire and a microcatheter have crossed a severely calcified, non-tortuous mid-LAD lesion with no stents, but a 1.0 mm balloon will not follow. There is no dissection or thrombus. Which next step best fits Brilakis's algorithms?",
      options: [
        "Orbital atherectomy, because its sideways ablation is best for lesions a balloon cannot cross",
        "Exchange through the microcatheter for the rotational atherectomy wire and use rotational atherectomy",
        "Direct stenting with a low-profile stent, which may cross where the balloon did not",
        "Intravascular lithotripsy, because its emitter balloon crosses tighter lesions than any 1.0 mm balloon can",
      ],
      answer: 1,
      explanation:
        "For a balloon-uncrossable lesion Brilakis prefers rotational atherectomy, because the burr ablates forwards, whereas the orbital crown ablates sideways (though it has been used successfully). The microcatheter across the lesion allows the exchange to the dedicated wire. Direct stenting of heavy calcium is never done, and the lithotripsy balloon's main weakness is crossing tight lesions.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-calcium-q4",
      stem: "You plan rotational atherectomy in a dominant circumflex. Brilakis offers short test runs, without a pacemaker or aminophylline, as one way to handle the risk of bradycardia. What advantage does he give for this approach?",
      options: [
        "Runs can be tailored, stopping when bradycardia appears, and there is no pacing-lead perforation risk",
        "Test runs prevent bradycardia completely, because the burr never reaches the artery supplying the AV node",
        "It avoids atropine, which is contraindicated before atherectomy in the circumflex",
        "It allows a larger burr and longer runs, because the heart rate is being monitored",
      ],
      answer: 0,
      explanation:
        "Brilakis's argument for test runs is that atherectomy can be tailored to the patient (stop when bradycardia develops) and that it avoids the risk of right ventricular perforation by a temporary pacing lead. Test runs detect bradycardia rather than prevent it. Atropine is his alternative drug, and the Oxford handbook recommends atropine pretreatment when bradycardia is likely. Larger burrs and longer runs make bradycardia more likely, not safer.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-calcium-q5",
      stem: "A left main lesion needs rotational atherectomy with a 2.15 mm burr. What is the smallest guide that accepts it, according to Brilakis's table?",
      options: ["6 Fr", "7 Fr", "8 Fr", "Any size, if a guide extension is used"],
      answer: 2,
      explanation:
        "Brilakis's Table 19.1 gives 6 Fr or larger for 1.25–1.75 mm burrs, 7 Fr or larger for 2.0 mm, and 8 Fr or larger for 2.15–2.25 mm. Larger burrs are rarely needed except in the left main, which is why this sizing matters there. A guide extension reduces, rather than increases, the space available for the burr.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-calcium-q6",
      stem: "During rotational atherectomy the burr keeps grabbing at one spot in an angulated calcified segment, with repeated decelerations. Besides lighter pecking, what does Brilakis advise to protect the wire?",
      options: [
        "Increase the speed above 180,000 rpm so the burr passes the spot faster",
        "Change to the floppy wire mid-run, without removing the burr",
        "Move the wire slightly during ablation, briefly releasing the brake to push or pull it",
        "Advance the burr to within a few millimetres of the wire tip to straighten the segment",
      ],
      answer: 2,
      explanation:
        "Where one spot resists, Brilakis moves the wire a little during the run (a brief brake release with a gentle push or pull), so the burr does not keep pressing the same segment of wire against the calcium, which can fracture it. Speeds above 180,000 rpm raise the risk of slow flow and perforation, wires cannot be swapped with the burr in place, and ablating close to the wire tip is itself a cause of wire fracture and perforation.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cp-calcium-q7",
      stem: "In a 3.75 mm calcified RCA, orbital atherectomy at 80,000 rpm has been completed, but the 1:1 non-compliant post-dilatation balloon still does not fully expand. What does Brilakis suggest considering?",
      options: [
        "Switching to 120,000 rpm, which he considers for vessels over 3.5 mm or a balloon that will not expand",
        "Keeping 80,000 rpm but lengthening each run to 60 seconds to increase the treatment effect",
        "Changing to a larger orbital crown, as the 1.25 mm crown cannot treat vessels this large",
        "Abandoning modification and stenting, since the orbital crown has done what it can",
      ],
      answer: 0,
      explanation:
        "Brilakis starts every orbital case at 80,000 rpm and considers high speed when the vessel is over 3.5 mm or the post-dilatation balloon does not fully expand, avoiding it in arteries under 3.0 mm. Runs stay under 15 seconds. Brilakis's system has a single 1.25 mm crown (Fig. 30.99), and his remedy for a vessel over 3.5 mm or a balloon that will not expand is high speed, not a bigger crown. The Oxford handbook, for its part, puts the largest vessel the 1.25 mm crown can treat without upsizing at 3.5 mm; Brilakis does not link his speed rule to that figure. Stenting an unexpanded lesion is what both books warn against.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cp-calcium-q8",
      stem: "A stent implanted two years ago in a calcified circumflex is underexpanded and will not yield to non-compliant or scoring balloons. You plan excimer laser. Which technique fits Brilakis's teaching?",
      options: [
        "A 2.0 mm laser catheter at the lowest settings with saline, to protect the old stent",
        "A 0.9 mm catheter at 80 Hz and 80 mJ/mm², lasing during contrast injection inside the stent",
        "A 0.9 mm catheter during contrast injection, after first stripping the stent with atherectomy",
        "Laser over a polymer-jacketed wire, which tolerates lasing better than a workhorse wire",
      ],
      answer: 1,
      explanation:
        "For undilatable lesions and underexpanded stents Brilakis uses the 0.9 mm catheter at maximum repetition and fluence (80 Hz, 80 mJ/mm²), and lasing during contrast injection is appropriate inside a stent, where it can often expand it. In his in-stent algorithm atherectomy comes after laser, not before. Lasing over a polymer-jacketed wire damages the jacket and makes the wire sticky.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-calcium-q9",
      stem: "Which conclusion is best supported by the ECLIPSE trial of routine orbital atherectomy against balloon preparation in severely calcified lesions?",
      options: [
        "Orbital atherectomy halved target-vessel failure at 1 year and should be used for every calcified lesion",
        "Balloon preparation caused more stent underexpansion, so atherectomy should precede every stent",
        "For lesions that can be crossed and dilated, routine orbital atherectomy added no benefit over balloons",
        "Orbital atherectomy was unsafe and should no longer be used for calcified coronary lesions",
      ],
      answer: 2,
      explanation:
        "In 2,005 patients with lesions suitable for either strategy, routine orbital atherectomy did not reduce target-vessel failure at 1 year (11.5% against 10.0%) or increase the minimal stent area at the site of maximal calcium (7.67 against 7.42 mm²). The authors concluded the data support a balloon-first approach, guided by imaging, for most calcified lesions that can be crossed and dilated. The trial enrolled only lesions suitable for either strategy, so it says nothing about lesions balloons cannot cross or dilate; cardiac deaths at 1 year were numerically higher with orbital atherectomy (39 against 26), with no formal comparison reported.",
      difficulty: 3,
      refs: ["kirtane-eclipse-2025", "brilakis-manual-pci"],
    },
    {
      id: "cp-calcium-q10",
      stem: "A 1.5 mm burr will not advance through a tortuous, calcified proximal RCA to reach a mid-RCA lesion; the guide is an 8 Fr AL1. Which measure is among Brilakis's solutions?",
      options: [
        "Exchanging to a 1.25 mm burr, which is the least likely to become entrapped",
        "Starting the burr at full speed in the guide and pushing it firmly forward",
        "A 7 Fr guide extension, or ablating the proximal calcified segments first",
        "A higher platform speed above 180,000 rpm to reduce friction on the wire",
      ],
      answer: 2,
      explanation:
        "Brilakis's solutions are a gentle pull on the wire while advancing the burr, glide mode, a guide extension (a 7 Fr extension being his preference for a 1.25 or 1.5 mm burr, which is why the guide here is 8 Fr: a 7 Fr guide takes only a 6 Fr extension, which Brilakis describes as accommodating a 1.25 mm burr, 16.2.9), ablating the proximal calcified segments first, and a brief press of the pedal (‘burping’). Small burrs are listed as prevention for delivery problems, but the 1.25 mm burr is the most prone to entrapment, so it is not ‘least likely’ to trap. Forceful advancement and speeds above 180,000 rpm cause complications. Note the guide too: a non-coaxial guide is a listed cause of failed burr delivery, and Brilakis warns that burrs advance poorly through guides with significant bends such as the Amplatz left.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cp-calcium-q11",
      stem: "A balloon inflated at 22 atm in a calcified lesion suddenly loses pressure on the indeflator. What should happen first?",
      options: [
        "Reinflate to the same pressure at once to finish the dilatation",
        "Deflate with suction immediately, remove the balloon and inject to look for perforation or dissection",
        "Leave the ruptured balloon inflated at low pressure for 5 minutes in case it is sealing a perforation",
        "Advance a stent straight away, before the balloon is removed, to cover any dissection",
      ],
      answer: 1,
      explanation:
        "A sudden fall in pressure means the balloon has ruptured. Brilakis deflates at once (with suction so contrast is not forced out through the tear), removes the balloon, aspirates the guide and injects to look for dissection, perforation or no-reflow; if there is a perforation, a new balloon goes in proximal to it immediately. Reinflating a ruptured balloon is impossible and dangerous, and a stent cannot be delivered past a balloon still in the lesion.",
      difficulty: 1,
      refs: BRILAKIS,
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Prepare a heavily calcified lesion step by step: grade the calcium on imaging, choose balloon-first or atherectomy-first, size the burr against the vessel and the guide, prove preparation with a fully expanded 1:1 non-compliant balloon, then stent, post-dilate at 20 atm or more and confirm expansion on imaging.",
    },
  ],
  caseIds: ["cp-calcium-case-dominant-lcx", "cp-calcium-case-underexpanded-stent"],
};

export const cases: CaseStudy[] = [
  {
    id: "cp-calcium-case-dominant-lcx",
    title: "Rotational atherectomy in a dominant circumflex",
    trackId: "complex-pci",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 19.3–19.9 (rotational atherectomy and its complications) and 23.1; Oxford handbook, chapter 8, Rotational atherectomy" },
    summary: "A severely calcified lesion in a dominant circumflex that a 1.5 mm balloon will not cross, prepared with upfront rotational atherectomy: wire exchange, bradycardia planning, burr choice, run technique, slow flow and the finish.",
    presentation:
      "A 76-year-old man has class III angina despite two antianginal drugs and inducible lateral ischaemia. Angiography shows a left-dominant system with a 90% heavily calcified mid-circumflex lesion (reference 3.0 mm); LVEF 50%. You are working from the right radial artery with a 7 Fr extra-backup guide, heart rate 64/min in sinus rhythm.",
    findings: [
      "Left-dominant circulation: the circumflex supplies the posterior descending artery and the AV-nodal artery.",
      "Mid-circumflex: dense calcium visible on both walls before contrast, without cardiac motion.",
      "A workhorse wire has crossed with a microcatheter; the microcatheter is across the lesion.",
      "A 1.5 mm balloon will not cross, and the IVUS catheter will not cross either.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The microcatheter is across but a 1.5 mm balloon is not. What is your plan?",
        options: [
          {
            text: "Exchange through the microcatheter for the floppy rotational atherectomy wire and plan rotational atherectomy",
            best: true,
            feedback: "Right. Severe calcium with no tortuosity, thrombus, dissection or graft favours upfront atherectomy in Brilakis's algorithm (Fig. 19.3); rotational atherectomy is preferred where balloons struggle to cross because it ablates forwards, and the microcatheter already across makes the wire exchange straightforward. Strictly, one failed 1.5 mm balloon does not yet make the lesion balloon uncrossable: a smaller balloon is the formal first line for that.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Try a 1.0 mm low-profile balloon first, keeping atherectomy as the next step",
            acceptable: true,
            feedback: "Also reasonable: the lowest-profile balloons are Brilakis's first choice for a lesion a balloon will not cross (Fig. 23.1). With severe calcium and no contraindication, though, Fig. 19.3 already supports going to atherectomy, which also avoids a balloon-induced dissection that could rule it out.",
          },
          {
            text: "Deep-intubate the guide for support and push the 1.5 mm balloon firmly until it crosses the lesion",
            feedback: "Forceful balloon pushing loses guide and wire position and can dissect the ostium or injure the distal vessel.",
            stateDelta: { stability: -10, flags: ["forced-balloon"] },
            next: "c-wireloss",
          },
        ],
      },
      {
        id: "c-wireloss",
        kind: "consequence",
        prompt: "The guide has backed out of the ostium and the wire tip has slipped back to just beyond the lesion. What now?",
        info: "No dissection is visible. The patient is comfortable; blood pressure 132/78 mmHg.",
        options: [
          {
            text: "Stop pushing; re-engage coaxially, re-advance microcatheter and wire distally, and change to atherectomy",
            best: true,
            feedback: "Forceful balloon advancement is the cause Brilakis gives for losing guide and wire position; the treatment is to re-engage and rewire, and the prevention is to stop forcing equipment. Here the lesion has already told you it needs atherectomy.",
          },
          {
            text: "Re-seat the guide, then push the same balloon again, harder, now that support is back",
            feedback: "Repeating the manoeuvre repeats the problem, and forceful back-and-forth balloon movement can dissect the ostium.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The rotational atherectomy wire is in place. Before choosing and inserting the burr, how do you handle the risk of bradycardia in this dominant circumflex?",
        options: [
          {
            text: "Choose a plan: temporary pacemaker, aminophylline (typically 250–300 mg IV over 10 minutes, per local protocol), test runs or atropine",
            best: true,
            feedback: "Right. A dominant circumflex supplies the AV node, so a plan is needed. Test runs let you stop when the rate falls and avoid a pacing lead; the Oxford handbook advises atropine pretreatment when bradycardia is likely.",
            stateDelta: { stability: 5 },
          },
          {
            text: "No plan is needed: bradycardia during atherectomy is a problem of the RCA, not of the circumflex",
            feedback: "A dominant circumflex carries the same risk as the RCA, because it supplies the AV node.",
            stateDelta: { stability: -15, flags: ["block"] },
            next: "c-block",
          },
        ],
      },
      {
        id: "c-block",
        kind: "consequence",
        prompt: "With no plan in place, the team sets up a burr and starts. Ten seconds into the first run the rhythm drops to complete heart block at 32/min and the pressure falls to 78/45 mmHg. What do you do?",
        options: [
          {
            text: "Stop the run, give atropine, pace if block persists, then restart only with shorter runs and a plan",
            best: true,
            feedback: "Bradycardia usually resolves once the run stops (Brilakis). The Oxford handbook gives atropine 1 mg IV to improve AV conduction and urgent temporary pacing for complete block. Then withdraw the burr, put a plan in place (pacing, aminophylline or brief test runs) and review the set-up before the next run, keeping runs short. Choose the burr again once the plan is in place.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Keep ablating to finish the lesion quickly; the block will resolve once the procedure ends",
            feedback: "Continuing the run prolongs the cause. Stop the run first.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The bradycardia plan is in place. Which burr do you use for this 3.0 mm circumflex, through the 7 Fr guide? (If one was set up before, choose again.)",
        options: [
          {
            text: "1.5 mm",
            best: true,
            feedback: "A burr-to-artery ratio of 0.5, Brilakis's usual choice and his default burr; it fits a 6 Fr guide or larger.",
            stateDelta: { stability: 5 },
          },
          {
            text: "1.25 mm, the smallest available, to be as safe as possible",
            feedback: "The 1.25 mm burr can slip through a tight lesion and then fail to come back (the ‘kokesi’ effect); Brilakis prefers 1.5 mm or larger to avoid entrapment.",
            stateDelta: { stability: -5, flags: ["small-burr"] },
          },
          {
            text: "2.0 mm, to debulk the calcium in one go",
            feedback: "A ratio of about 0.67 exceeds both books' limits (Brilakis about 0.5; Oxford 0.5–0.6). Large burrs raise the risk of slow flow, perforation and bradycardia, and the goal is modification, not debulking.",
            stateDelta: { stability: -10, flags: ["large-burr"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The burr is assembled. How do you get it to the lesion?",
        options: [
          {
            text: "DRAW check, lock the knob 2 cm from the end, advance holding the wire, stop 1–2 cm short, release the tension",
            best: true,
            feedback: "That is Brilakis's sequence. Releasing the stored tension stops the burr leaping into the lesion when it starts.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Skip platforming, advance the burr until it touches the lesion and start it there to save time",
            feedback: "Starting the burr in contact with the lesion, with tension stored in the system, makes it jump into the lesion, decelerate and wedge.",
            stateDelta: { stability: -15, flags: ["entrapment"] },
            next: "c-entrapment",
          },
        ],
      },
      {
        id: "s5",
        prompt: "On the second run the speed falls by 8,000 rpm as the burr meets the calcium, and the run has reached 18 seconds. What now?",
        variants: [{ flag: "small-burr", info: "With the 1.25 mm burr, the burr has slipped partly into the lesion as it slowed." }],
        options: [
          {
            text: "Back off, end the run, wait at least 30 seconds, then resume with lighter, shorter pecking",
            best: true,
            feedback: "Decelerations over 5,000 rpm and runs over 15 seconds are what Brilakis tells you to avoid: they release more and larger debris and risk entrapment. Answer resistance with further short runs, not a longer one.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push on through the lesion while the burr is working",
            feedback: "Forceful advancement with large decelerations is the leading cause of burr entrapment. The burr passes the lesion and will not come back.",
            stateDelta: { stability: -20, flags: ["entrapment"] },
            next: "c-entrapment",
          },
        ],
      },
      {
        id: "c-entrapment",
        kind: "consequence",
        prompt: "The burr is stuck just beyond the lesion and will not come back. Flow is still TIMI 3. What is your sequence?",
        options: [
          {
            text: "Straighten the guide, glide mode, second wire and balloon, cut shaft and guide extension, snare, gentle wire pull; surgery last",
            best: true,
            feedback: "That is Brilakis's algorithm (Fig. 19.9). The burr has diamonds only at the front, so it cannot cut its way back; each step frees it mechanically. The wire tip (0.014 in.) is larger than the burr lumen (0.009 in.), so a gentle wire pull can bring it back.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Pull firmly on the burr and the wire together, with the guide held still, until the burr comes free",
            feedback: "Brilakis's algorithm is stepwise and forceful pulling is not part of it; for trapped wires he warns never to pull hard, because the wire can fracture (27.2). Work through the bail-out instead.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "After the third run flow falls to TIMI 1 and the patient has chest pain with lateral ST elevation; blood pressure 112/68 mmHg. There is no visible dissection. What do you do?",
        variants: [{ flag: "large-burr", info: "You have been using the 2.0 mm burr." }],
        options: [
          {
            text: "Stop atherectomy; distal nicardipine through a microcatheter; intracoronary epinephrine if flow stays poor",
            best: true,
            feedback: "Slow flow with no dissection after a run means distal embolisation. Stop, and deliver vasodilators distally (Brilakis 19.9.5.7.1); avoid repeated contrast injections, which worsen ischaemia (Oxford).",
            stateDelta: { stability: 10 },
          },
          {
            text: "One more short run to finish the lesion before the flow gets any worse",
            feedback: "More ablation adds more debris into a microcirculation that is already blocked.",
            stateDelta: { stability: -20, flags: ["no-reflow"] },
            next: "c-noreflow",
          },
          {
            text: "Stent the lesion now to restore flow and seal any hidden flap",
            feedback: "Stenting is the answer to dissection, not embolisation; Brilakis advises against stenting into plaque embolisation, and the lesion has not been proved to expand.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-noreflow",
        kind: "consequence",
        prompt: "Flow is now TIMI 0–1 with hypotension, 82/50 mmHg. What next?",
        options: [
          {
            text: "Distal nicardipine via microcatheter while supporting the pressure; epinephrine if refractory; IABP if hypotension persists",
            best: true,
            feedback: "Brilakis gives distal vasodilators and epinephrine for refractory no-reflow, and prefers nicardipine because it lowers blood pressure less than nitroprusside or verapamil; at 82/50 mmHg avoid the more hypotensive vasodilators and support the pressure while you treat (he withholds routine pre-atherectomy vasodilators from hypotensive patients). The Oxford handbook suggests an intra-aortic balloon pump to support coronary perfusion when the pressure stays low.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Repeated forceful contrast injections through the guide to flush the debris through the microcirculation",
            feedback: "Repeated injections into a vessel with no-reflow worsen ischaemia (Oxford).",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "Flow has recovered and polishing runs now pass freely without deceleration. How do you finish?",
        options: [
          {
            text: "Remove the burr, angiogram, workhorse wire, 1:1 non-compliant balloon; stent only if it fully expands, then post-dilate and image",
            best: true,
            feedback: "That is Brilakis's sequence (steps 8–11 and 19.10): prove the lesion expands before the stent, then post-dilate and confirm expansion on imaging.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Deploy the stent straight away over the atherectomy wire; the burr passing freely proves the lesion is ready",
            feedback: "A free burr does not prove a 1:1 balloon will expand the lesion. Brilakis always follows atherectomy with a 1:1 non-compliant balloon, and prefers a workhorse wire for stenting.",
            stateDelta: { stability: -10, flags: ["underexpanded"] },
          },
        ],
      },
    ],
    outcome:
      "The 3.0 mm non-compliant balloon expands fully, a 3.0 mm drug-eluting stent is deployed and post-dilated at high pressure, and IVUS confirms good expansion with no edge dissection. Flow is TIMI 3 and the patient is pain-free.",
    outcomeVariants: [
      { flag: "forced-balloon", text: "The forceful early balloon attempts cost guide and wire position and had to be undone before atherectomy." },
      { flag: "block", text: "Complete heart block during the first run needed atropine and temporary pacing; a plan beforehand would have avoided it." },
      { flag: "entrapment", text: "The burr became trapped and had to be retrieved with the stepwise bail-out." },
      { flag: "no-reflow", text: "No-reflow after an extra run needed distal vasodilators, epinephrine and haemodynamic support." },
      { flag: "large-burr", text: "The oversized burr contributed to the slow flow." },
      { flag: "underexpanded", text: "Stenting without a balloon test left a segment underexpanded on IVUS that needed further high-pressure dilatation." },
    ],
    learningPoints: [
      "Severe calcium without tortuosity, thrombus, dissection or a graft: upfront atherectomy is reasonable (Fig. 19.3); with a microcatheter across, exchange to the atherectomy wire. For a truly balloon-uncrossable lesion the smallest, lowest-profile balloon comes first (Fig. 23.1), and among atherectomy devices rotational is preferred because it ablates forwards.",
      "RCA or dominant circumflex: plan for bradycardia (pacing, aminophylline, test runs, or atropine).",
      "Burr-to-artery ratio about 0.5; 1.5 mm is the usual burr; 1.25 mm is the most prone to entrapment.",
      "DRAW, stop 1–2 cm short, release tension; pecking with decelerations under 5,000 rpm, runs under 15 seconds, pauses of 30 seconds or more.",
      "Slow flow without dissection: stop and give vasodilators distally; stent for dissection, not for embolisation.",
      "Trapped burr: straighten, glide mode, wire and balloon, cut shaft and guide extension, snare, gentle wire pull, then surgery.",
      "Always prove expansion with a 1:1 non-compliant balloon before stenting.",
    ],
    refs: BOOKS,
  },
  {
    id: "cp-calcium-case-underexpanded-stent",
    title: "An underexpanded stent in a calcified right coronary artery",
    trackId: "complex-pci",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 23.2 (balloon-undilatable lesions, in-stent algorithm and Fig. 23.8), 19.9.2 and 30.11" },
    summary: "Recurrent angina from in-stent restenosis over an underexpanded stent in heavy calcium: working through Brilakis's in-stent undilatable algorithm, from high-pressure balloons to laser and atherectomy.",
    presentation:
      "A 69-year-old woman has recurrent angina eight months after a mid-RCA stent placed elsewhere for a heavily calcified lesion. Angiography shows severe in-stent restenosis. IVUS shows a stent with a minimal lumen area of 3.3 mm², clearly underexpanded, with heavy calcium behind the struts; the reference vessel is 3.5 mm.",
    findings: [
      "Mid-RCA stent, implanted eight months ago, underexpanded on IVUS (minimal lumen area 3.3 mm²).",
      "Heavy calcium behind the stent; reference diameter 3.5 mm.",
      "7 Fr AL1 guide from the femoral artery (strong support, though its curve can make burr delivery harder); workhorse wire in the distal RCA.",
      "Heart rate 70/min, blood pressure 138/80 mmHg.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "What is your first step to expand the stent?",
        options: [
          {
            text: "A 1:1 non-compliant balloon at high pressure with prolonged inflation, adding a buddy wire if it fails",
            best: true,
            feedback: "Right. Brilakis's in-stent algorithm starts with high-pressure inflation, using a shorter balloon, two balloons side by side or one or more buddy wires to concentrate the force.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Deploy a second drug-eluting stent inside the first to scaffold and treat the restenosis",
            feedback: "Brilakis warns against implanting a stent in a lesion that will not dilate (23.2). A second stent placed inside an unexpanded one simply adds another underexpanded layer and makes the problem harder.",
            stateDelta: { stability: -15, flags: ["double-layer"] },
            next: "c-double",
          },
          {
            text: "Orbital atherectomy as the first step, since the stent is old enough to have endothelialised",
            feedback: "Not as a first step: orbital atherectomy may be used in older, endothelialised stents (never recently placed ones), but in the in-stent algorithm high-pressure balloons, plaque modification balloons and laser all come first, and in-stent atherectomy carries more restenosis than laser (23.2.5).",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-double",
        kind: "consequence",
        prompt: "The second stent is deployed; IVUS shows two layers of metal, both underexpanded, with a minimal lumen area of 3.0 mm². What now?",
        options: [
          {
            text: "Return to the in-stent algorithm: high-pressure balloons with buddy wires, modified balloons, then laser",
            best: true,
            feedback: "The algorithm is the same, but each step now has to work through two layers of struts. Prevention, by expanding the lesion before any stent, is the lesson Brilakis stresses.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept the result and treat the restenosis with a drug-coated balloon only",
            feedback: "Leaving an undilatable lesion untreated is associated with a higher risk of stent thrombosis and restenosis (Brilakis 23.2.8).",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "A 3.5 mm high-pressure non-compliant balloon, inflated to its rated burst pressure of 26 atm with a buddy wire, leaves a fixed waist. What next?",
        options: [
          {
            text: "A plaque modification balloon (scoring or cutting), inflated as its type requires",
            best: true,
            feedback: "Step 3 of the in-stent algorithm. Remember the cutting balloon's slow inflation and low ceiling.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Laser now, skipping the plaque modification balloon",
            acceptable: true,
            feedback: "Laser is the next step if modified balloons fail and many would move to it quickly here, but Brilakis's sequence puts plaque modification balloons first.",
          },
          {
            text: "Take the non-compliant balloon well beyond its rated burst pressure",
            feedback: "Exceeding the rated pressure in heavy calcium invites rupture, dissection and perforation; Brilakis lists pressures above 20 atm among the causes of rupture (9.7.9).",
            stateDelta: { stability: -15, flags: ["rupture"] },
            next: "c-rupture",
          },
        ],
      },
      {
        id: "c-rupture",
        kind: "consequence",
        prompt: "The indeflator pressure suddenly falls to zero. What do you do?",
        options: [
          {
            text: "Deflate with suction at once, remove the balloon, aspirate the guide and inject; if there is a perforation, inflate a balloon proximal to it",
            best: true,
            feedback: "That is Brilakis's response to rupture (9.7.9, 19.9.3). The injection shows no perforation and no flow-limiting dissection.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Reinflate the same balloon at once to see whether it still holds pressure in the lesion",
            feedback: "A ruptured balloon cannot hold pressure, and contrast forced through the tear can injure the vessel.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The scoring balloon also fails. You decide on excimer laser. How do you use it?",
        options: [
          {
            text: "Console on early; 0.9 mm catheter at 80 Hz and 80 mJ/mm², lasing with contrast inside the stent; balloon test",
            best: true,
            feedback: "That is Brilakis's technique for underexpanded stents (23.2.6): the console needs about 5 minutes to warm up and calibrate, and a high-pressure balloon then tests the result. Contrast lasing is typically reserved for in-stent use because of the higher risk of dissection and perforation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 2.0 mm laser catheter at the lowest settings, lasing with saline only, to avoid damaging the old stent",
            feedback: "The coronary catheter is nearly always the 0.9 mm size, at maximum settings for undilatable lesions; the in-stent position is exactly where contrast lasing is appropriate.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Lase over the polymer-jacketed buddy wire, keeping the workhorse wire untouched in reserve",
            feedback: "Lasing over a polymer-jacketed wire can damage the jacket and make the wire sticky.",
            stateDelta: { stability: -5, flags: ["sticky-wire"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After laser, IVUS shows the stent is still underexpanded despite further non-compliant and scoring balloons. What is the next step in the in-stent algorithm?",
        options: [
          {
            text: "Rotational atherectomy through the stent, considering a larger burr (1.75 mm or more) against entrapment",
            best: true,
            feedback: "In the in-stent algorithm atherectomy follows laser (where lithotripsy is available, it can reasonably be tried first). Brilakis says larger burrs (1.75 mm or more) should be used selectively in undilatable stents to avoid entrapment, and warns of embolised stent material, burr entrapment and stent damage. Expect the burr to advance less easily through the AL1's curve. A guide extension will not help with this burr size in a 7 Fr guide: the 6 Fr extension that fits is described as taking a 1.25 mm burr, and the 7 Fr extensions he prefers for burrs of 1.25 and 1.5 mm need an 8 Fr guide (16.2.9, 19.9.5.6). Rely instead on a gentle pull on the wire while advancing, glide mode and ablating proximally first. Follow with plaque modification and non-compliant balloons.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Intravascular lithotripsy inside the stent where available, then a 1:1 non-compliant balloon test and imaging",
            acceptable: true,
            feedback: "Reasonable where the device is available. Brilakis keeps in-stent atherectomy for when high-pressure balloons, laser or newer techniques such as lithotripsy or a very-high-pressure balloon have failed to expand the stent (23.2.5), and the lithotripsy lesson lists underexpanded stents among its uses. His 2020 algorithm (Fig. 23.7) still shows lithotripsy as a future technique, which is why atherectomy is the step it names after laser. Prove the result with a fully expanded 1:1 non-compliant balloon and imaging.",
          },
          {
            text: "Rotational atherectomy with a 1.25 mm burr, the gentlest choice inside the old stent",
            feedback: "Small burrs and ablation inside stents are both causes of burr entrapment; the 1.25 mm burr combines them.",
            stateDelta: { stability: -15, flags: ["entrapment"] },
            next: "c-burr",
          },
          {
            text: "Rotational atherectomy through the stent with a 1.5 mm burr, then balloons",
            acceptable: true,
            feedback: "Reasonable: Brilakis's own example of this problem (Fig. 23.8) was solved with a 1.5 mm burr followed by a scoring balloon and a 4.0 mm non-compliant balloon. He adds that larger burrs are worth considering selectively in undilatable stents to lower the risk of entrapment.",
          },
          {
            text: "Orbital atherectomy, since this stent is eight months old",
            acceptable: true,
            feedback: "Brilakis allows orbital atherectomy in older stents that have endothelialised, though not in recently implanted ones; both devices carry the risks of in-stent atherectomy.",
          },
          {
            text: "Stop here and refer the patient for CABG now",
            feedback: "CABG is the final step of the algorithm, after atherectomy and subintimal techniques have failed.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-burr",
        kind: "consequence",
        prompt: "The 1.25 mm burr is caught in the stent and will not come back. What is your first move?",
        options: [
          {
            text: "Straighten the guide and retry; then glide mode, wire and balloon, cut shaft and guide extension, snare; surgery last",
            best: true,
            feedback: "Brilakis's stepwise bail-out. The burr is eventually freed with a guide extension over the cut shaft.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Pull hard on the burr and drive shaft to drag it back through the stent struts",
            feedback: "Forceful pulling is not part of Brilakis's stepwise bail-out; for trapped wires he warns never to pull hard, because the wire can fracture (27.2). Use the algorithm.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After atherectomy, a scoring balloon and a 4.0 mm non-compliant balloon, IVUS shows the stent fully expanded. How do you finish?",
        options: [
          {
            text: "Image the segment; if struts are disrupted or restenotic tissue remains, restent, then post-dilate and confirm",
            best: true,
            feedback: "Brilakis warns that in-stent atherectomy can damage the stent badly enough to need another one (23.2.5), and this lesion is in-stent restenosis in any case; let IVUS decide, restent where it shows disruption or residual tissue, then post-dilate and confirm expansion and apposition.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Finish now without further imaging: the stent is expanded and another layer would only add metal",
            feedback: "Brilakis warns that stentablation can damage the stent badly enough to need another; image before deciding, rather than assuming the scaffold is intact.",
            stateDelta: { stability: -10, flags: ["no-restent"] },
          },
        ],
      },
    ],
    outcome:
      "IVUS after atherectomy shows disrupted struts with residual restenotic tissue, so a new 3.5 mm drug-eluting stent is deployed and post-dilated; IVUS shows good expansion and apposition. TIMI 3 flow, no complications, and the patient goes home the next day.",
    outcomeVariants: [
      { flag: "double-layer", text: "The second stent placed before preparation added a second underexpanded layer, lengthening the case." },
      { flag: "rupture", text: "A balloon rupture from exceeding the rated pressure was managed without perforation." },
      { flag: "sticky-wire", text: "Lasing over the polymer-jacketed wire left it sticky, and it had to be replaced." },
      { flag: "entrapment", text: "The small burr became trapped inside the stent and needed the stepwise bail-out." },
      { flag: "no-restent", text: "The case was closed without imaging after atherectomy, so stent damage and residual restenotic tissue went unassessed." },
    ],
    learningPoints: [
      "Never stent inside an underexpanded stent before it has been expanded.",
      "In-stent undilatable algorithm: high-pressure balloons (buddy wires, shorter or paired balloons), plaque modification balloons, laser, lithotripsy or a very-high-pressure balloon where available (future techniques in the 2020 algorithm, but named in 23.2.5 as worth trying before atherectomy), atherectomy, subintimal techniques, CABG; image throughout.",
      "Laser: 0.9 mm, 80 Hz, 80 mJ/mm²; contrast lasing is appropriate inside a stent; warm the console up early.",
      "In-stent rotational atherectomy: consider larger burrs (1.75 mm or more) selectively against entrapment (a 1.5 mm burr worked in Brilakis's example); image afterwards and restent if the old stent is disrupted.",
      "Orbital atherectomy only in older, endothelialised stents, never in recently implanted ones.",
    ],
    refs: BRILAKIS,
  },
];

const PREP_FAIL: ("balloon-uncrossable" | "balloon-undilatable")[] = ["balloon-uncrossable", "balloon-undilatable"];

export const tips: LabTip[] = [
  {
    id: "pci-calc-imaging-decides",
    lab: "pci",
    when: { phase: ["imaging", "lesion-prep"], event: PREP_FAIL, requires: ["calcified-lesion"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Calcium: let imaging choose the tool",
    text: "Describe the calcium by arc, thickness, length and depth. Circumferential superficial calcium, an obstructive calcified nodule or thick calcium predicts that a balloon will fail and atherectomy (or lithotripsy) will be needed; deep calcium may respond to balloons. If the imaging catheter will not cross, predilate or image after atherectomy.",
    tone: "do",
    lessonId: "cp-calcium-recognise",
    sources: [B("19"), B("13.3"), B("13.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-no-stent-until-expanded",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], event: ["balloon-undilatable"], requires: ["calcified-lesion"] },
    title: "No stent until a 1:1 balloon fully expands",
    text: "Never stent a heavily calcified lesion that a 1:1 non-compliant balloon has not fully expanded: an underexpanded stent is far more difficult to fix than a lesion not yet stented. Escalate first (high-pressure and plaque modification balloons, atherectomy, lithotripsy) and prove expansion again.",
    tone: "caution",
    lessonId: "cp-calcium-strategy",
    sources: [B("19"), B("23.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-wire-exchange",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["balloon-uncrossable", "microcatheter-needed"], requires: ["calcified-lesion"] },
    title: "Cross with a workhorse wire, then exchange for the atherectomy wire",
    text: "Cross the calcified lesion with a workhorse wire supported by a microcatheter, then exchange through the microcatheter for the dedicated atherectomy wire; direct wiring with it is difficult because it steers poorly and kinks. If no microcatheter will cross, the atherectomy wire cannot go in: consider laser, which runs over the wire you have.",
    tone: "do",
    lessonId: "cp-calcium-setup",
    sources: [B("19"), B("23.1"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-calc-bradycardia-plan",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: PREP_FAIL, vessel: ["RCA", "LCx"], requires: ["calcified-lesion"] },
    title: "RCA or dominant circumflex atherectomy: plan for bradycardia",
    text: "Before atherectomy in the RCA or a dominant circumflex, choose a temporary pacemaker, aminophylline (typically 250–300 mg IV over 10 minutes or 20–40 mg intracoronary, per local protocol) or brief test runs; atropine is an alternative. Smaller burrs and shorter runs cause less bradycardia. A non-dominant circumflex or the LAD needs no routine pacing.",
    tone: "do",
    lessonId: "cp-calcium-setup",
    sources: [B("19"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-calc-balloon-boost",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"], requires: ["calcified-lesion"] },
    title: "Waist in calcium: more pressure, more time, a buddy wire",
    text: "With a 1:1 non-compliant balloon go to 20 atm or more (within its rating) and inflate for longer; a slowly falling indeflator pressure means the lesion is yielding, so keep going. A buddy wire, a shorter balloon or two smaller balloons side by side concentrate the force. Do not balloon segments you will not stent.",
    tone: "do",
    lessonId: "cp-calcium-balloons",
    sources: [B("19"), B("23.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-cutting-slow",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"], requires: ["calcified-lesion"] },
    title: "Cutting balloon: slowly and at low pressure",
    text: "Inflate and deflate a cutting balloon about 1 atm every 5 seconds so the blades unfold and rewrap; usual pressures are 6–8 atm, with a ceiling of 12 atm (Brilakis chapter 9) or 14 atm (chapter 23). Let it deflate fully before withdrawing it: the blades can injure the artery.",
    tone: "caution",
    lessonId: "cp-calcium-balloons",
    sources: [B("9.7"), B("19"), B("23.2"), O("ch 8: Angioplasty balloons")],
    refs: BOOKS,
  },
  {
    id: "pci-calc-postdilate",
    lab: "pci",
    when: { phase: ["stent", "optimise"], event: ["stent-underexpanded"], requires: ["calcified-lesion"] },
    title: "Calcified segment: post-dilate high and image",
    text: "Post-dilate the stent at 20 atm or more with a 1:1 non-compliant balloon and confirm expansion and the edges on imaging; heavily calcified lesions can look expanded on angiography yet have a small lumen on imaging. If the stent will not expand, move to the in-stent undilatable algorithm rather than a bigger balloon.",
    tone: "do",
    lessonId: "cp-calcium-balloons",
    sources: [B("19"), B("23.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-ivl-crossing",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"], requires: ["calcified-lesion"] },
    title: "Lithotripsy needs a balloon that can cross",
    text: "Lithotripsy is described as promising for undilatable, circumferential calcium (Oxford: it acts on superficial and deeper calcium), particularly in larger or tortuous vessels, but its balloon is bulky and may not cross a tight lesion. Step it along the whole calcified length with overlapping positions, follow the instructions for use for sizing and pulses, and prove the result with a 1:1 non-compliant balloon.",
    tone: "do",
    lessonId: "cp-calcium-ivl",
    sources: [B("19"), B("23.2"), B("30.9"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-calc-rota-draw",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"], requires: ["calcified-lesion"] },
    title: "Rotational atherectomy set-up: DRAW, then release the tension",
    text: "Before the burr enters the guide: Drip from the burr, Rotate outside the body at the chosen speed (usually 140,000–160,000 rpm) clear of towels, Advance and withdraw the knob, and pull the Wire to test the brake. Stop the burr 1–2 cm short of the lesion and draw the knob back to release tension so it cannot jump forward.",
    tone: "do",
    lessonId: "cp-calcium-rota",
    sources: [B("19")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-rota-runs",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"], requires: ["calcified-lesion"] },
    title: "Rotational atherectomy runs: peck, short, pause",
    text: "Start the burr proximal to the lesion and peck gently, avoiding decelerations of more than 5,000 rpm. Keep runs under 15 seconds with at least 30 seconds between them, watching the ECG and pressure. Never start or stop the burr inside the lesion or stop it beyond it; when the lesion resists, add short runs instead of lengthening them.",
    tone: "do",
    lessonId: "cp-calcium-rota",
    sources: [B("19"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-calc-burr-delivery",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["poor-guide-support", "non-coaxial"], requires: ["calcified-lesion"] },
    title: "During rotational atherectomy: if the burr will not reach the lesion",
    text: "If you have chosen rotational atherectomy and the burr will not advance: pull the wire gently while advancing the burr, advance in glide mode, or use a guide extension (7 Fr is the preferred size for a 1.25 or 1.5 mm burr and needs an 8 Fr guide; in a 7 Fr guide a 6 Fr extension takes a 1.25 mm burr). Ablate the proximal calcified segments first, or give a brief press of the pedal. Next time, a coaxial guide without sharp bends and balloon predilatation of the tortuous segment help.",
    tone: "do",
    lessonId: "cp-calcium-rota",
    sources: [B("19")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-rota-slow-flow",
    lab: "pci",
    when: { phase: ["lesion-prep", "complication"], event: ["slow-flow", "no-reflow"] },
    title: "Slow flow during lesion preparation: find the cause, treat distally",
    text: "If atherectomy is running, stop it. If embolisation is the cause, give vasodilators (nicardipine, nitroprusside, verapamil or adenosine) into the distal bed through a microcatheter or dual-lumen catheter, and intracoronary epinephrine if refractory. If dissection is the cause, a stent will probably be needed: a distal injection or IVUS tells them apart. For plaque embolisation, avoid stenting; aspiration, then laser if aspiration fails, can remove debris.",
    tone: "bailout",
    lessonId: "cp-calcium-rota-complications",
    sources: [B("19"), B("25.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-atherectomy-perforation",
    lab: "pci",
    when: { phase: ["lesion-prep", "complication"], event: ["perforation"] },
    title: "Perforation during lesion preparation: balloon first",
    text: "Inflate a balloon proximal to, or at, the perforation straight away to stop bleeding into the pericardium, then follow the perforation algorithm. If atherectomy was in use, large burrs, high speed, small or tortuous vessels, extreme wire bias and a wire tip too close to the lesion are the causes to avoid next time.",
    tone: "bailout",
    lessonId: "cp-calcium-rota-complications",
    sources: [B("19"), B("26.3"), O("ch 10: Coronary perforation")],
    refs: BOOKS,
  },
  {
    id: "pci-calc-burr-entrapment",
    lab: "pci",
    when: { phase: ["lesion-prep", "complication"], event: ["equipment-entrapment"] },
    title: "If a rotational atherectomy burr is trapped: the stepwise bail-out",
    text: "If this happens during atherectomy (a burr, not a balloon or stent), follow the stepwise bail-out rather than force. Straighten the guide and make it coaxial, then try glide mode if the burr still turns. Next a second wire with a balloon beside the burr, then cut the drive shaft and advance a guide extension over it, then a snare over the shaft, then a gentle pull on the wire; surgery is the last step.",
    tone: "bailout",
    lessonId: "cp-calcium-rota-complications",
    sources: [B("19")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-rota-bradycardia",
    lab: "pci",
    when: { phase: ["lesion-prep", "complication"], event: ["bradycardia"] },
    title: "If bradycardia occurs during an atherectomy run: stop the run",
    text: "If this happens during atherectomy, stop the run; bradycardia from ablation usually resolves once it stops. Atropine may help AV conduction, and complete or Mobitz II block may need urgent temporary pacing. Resume only with shorter, gentler runs and a plan (pacing, aminophylline or atropine). Tachyarrhythmias point to slow flow or dissection: treat the cause.",
    tone: "bailout",
    lessonId: "cp-calcium-rota-complications",
    sources: [B("19"), O("ch 10: Arrhythmia")],
    refs: BOOKS,
  },
  {
    id: "pci-calc-orbital-low-speed",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"], requires: ["calcified-lesion"] },
    title: "Orbital atherectomy: low speed, slow advance",
    text: "Start every orbital case at 80,000 rpm with the brake locked and the tension released; advance about 1 mm per second, runs under 15 seconds with rests of 30–60 seconds. Consider 120,000 rpm for vessels over 3.5 mm or when the post-dilatation balloon still does not fully expand, avoid it in arteries under 3.0 mm, and never use the device in a recently placed stent.",
    tone: "do",
    lessonId: "cp-calcium-orbital",
    sources: [B("19")],
    refs: BRILAKIS,
  },
  {
    id: "pci-calc-laser-uncrossable",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Nothing follows the wire: think laser",
    text: "Laser runs over the 0.014 in. wire already across. Use the 0.9 mm catheter, usually at 80 Hz and 80 mJ/mm², lasing during saline flushing; switch the console on early, because it needs about 5 minutes to warm up and calibrate. Avoid lasing over polymer-jacketed wires and take care in tortuous vessels (perforation).",
    tone: "do",
    lessonId: "cp-calcium-laser",
    sources: [B("23.1"), B("30.11"), O_ROTA],
    refs: BOOKS,
  },
  {
    id: "pci-calc-laser-underexpanded-stent",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], event: ["stent-underexpanded"] },
    title: "Underexpanded stent: high-pressure balloons, then laser",
    text: "Work through the in-stent algorithm: high-pressure non-compliant balloons with buddy wires, then plaque modification balloons, then laser (0.9 mm at 80 Hz and 80 mJ/mm²), where lasing during contrast injection is acceptable because the lesion is inside a stent. Test with a high-pressure balloon and image. Lithotripsy or a very-high-pressure balloon, where available, can be tried before atherectomy (listed as future techniques in Brilakis's 2020 algorithm); atherectomy comes last.",
    tone: "bailout",
    lessonId: "cp-calcium-laser",
    sources: [B("23.2"), B("30.11")],
    refs: BRILAKIS,
  },
];

export const refs: Reference[] = [
  {
    id: "mintz-calcium-ivus-1995",
    kind: "paper",
    citation:
      "Mintz GS, Popma JJ, Pichard AD, et al. Patterns of calcification in coronary artery disease. A statistical analysis of intravascular ultrasound and coronary angiography in 1155 lesions. Circulation. 1995;91:1959–1965.",
    url: "https://doi.org/10.1161/01.cir.91.7.1959",
    note: "PMID: 7895353. Checked on PubMed: authors, title, journal, year, volume 91, issue 7, pages 1959–65. Brilakis's reference 1 in chapter 19. Abstract also gives angiographic moderate calcium 306 (26%) and severe 134 (12%), and IVUS lesion calcium only superficial in 48%, only deep in 28%, both in 24%.",
    verified: true,
  },
  {
    id: "abdel-wahab-rotaxus-2013",
    kind: "trial",
    citation:
      "Abdel-Wahab M, Richardt G, Joachim Büttner H, et al. High-speed rotational atherectomy before paclitaxel-eluting stent implantation in complex calcified coronary lesions: the randomized ROTAXUS (Rotational Atherectomy Prior to Taxus Stent Treatment for Complex Native Coronary Artery Disease) trial. JACC Cardiovasc Interv. 2013;6:10–19.",
    url: "https://doi.org/10.1016/j.jcin.2012.07.017",
    note: "PMID: 23266232. Checked on PubMed: authors, title, journal, volume 6, issue 1, pages 10–9 (electronic publication December 2012, issue 2013). Brilakis's reference 6 in chapter 19.",
    verified: true,
  },
  {
    id: "abdel-wahab-prepare-calc-2018",
    kind: "trial",
    citation:
      "Abdel-Wahab M, Toelg R, Byrne RA, et al. High-speed rotational atherectomy versus modified balloons prior to drug-eluting stent implantation in severely calcified coronary lesions. Circ Cardiovasc Interv. 2018;11:e007415.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.118.007415",
    note: "PMID: 30354632 (PREPARE-CALC). Checked on PubMed: authors, title, journal, year, volume 11, issue 10, article e007415. Brilakis's reference 7 in chapter 19.",
    verified: true,
  },
  {
    id: "kirtane-eclipse-2025",
    kind: "trial",
    citation:
      "Kirtane AJ, Généreux P, Lewis B, et al. Orbital atherectomy versus balloon angioplasty before drug-eluting stent implantation in severely calcified lesions eligible for both treatment strategies (ECLIPSE): a multicentre, open-label, randomised trial. Lancet. 2025;405:1240–1251.",
    url: "https://doi.org/10.1016/S0140-6736(25)00450-7",
    note: "PMID: 40174596. Checked on PubMed: authors, title, journal, year, volume 405, issue 10486, pages 1240–1251. The trial Brilakis describes as ongoing in 19.9.1.",
    verified: true,
  },
  {
    id: "barbato-calcium-consensus-2023",
    kind: "consensus",
    citation:
      "Barbato E, Gallinoro E, Abdel-Wahab M, et al. Management strategies for heavily calcified coronary stenoses: an EAPCI clinical consensus statement in collaboration with the EURO4C-PCR group. Eur Heart J. 2023;44:4340–4356.",
    url: "https://doi.org/10.1093/eurheartj/ehad342",
    note: "PMID: 37208199. Checked on PubMed: authors, title, journal, year, volume 44, issue 41, pages 4340–4356. Cited only for what its abstract states (scope: imaging to assess calcium, tool selection by calcium morphology and location, including orbital atherectomy and lithotripsy).",
    verified: true,
  },
  {
    id: "riley-scai-calcium-2024",
    kind: "consensus",
    citation:
      "Riley RF, Patel MP, Abbott JD, et al. SCAI expert consensus statement on the management of calcified coronary lesions. J Soc Cardiovasc Angiogr Interv. 2024;3:101259.",
    url: "https://doi.org/10.1016/j.jscai.2023.101259",
    note: "PMID: 39132214; PMCID: PMC11307856. Checked on PubMed: authors, title, journal, year (published January 2024), volume 3, issue 2, article 101259. Cited only for what its abstract states: methods to identify types of calcified lesions, a central algorithm to guide use of the calcium-modification strategies, and tips for each treatment modality.",
    verified: true,
  },
  {
    id: "lawton-revasc-jacc-2021",
    kind: "guideline",
    citation:
      "Lawton JS, Tamis-Holland JE, Bangalore S, et al. 2021 ACC/AHA/SCAI Guideline for Coronary Artery Revascularization: a report of the American College of Cardiology/American Heart Association Joint Committee on Clinical Practice Guidelines. J Am Coll Cardiol. 2022;79:e21–e129.",
    url: "https://doi.org/10.1016/j.jacc.2021.09.006",
    note: "PMID: 34895950. Checked on PubMed: authors, title, journal, volume 79, issue 2, pages e21–e129 (online December 2021). The full text could not be opened (publisher returned 403; not in PMC), so the classes quoted in the module are taken from the review angsubhakorn-calcium-review-2022, whose PMC full text quotes them, and are attributed to that review.",
    verified: true,
  },
  {
    id: "angsubhakorn-calcium-review-2022",
    kind: "paper",
    citation:
      "Angsubhakorn N, Kang N, Fearon C, et al. Contemporary management of severely calcified coronary lesions. J Pers Med. 2022;12:1638.",
    url: "https://doi.org/10.3390/jpm12101638",
    note: "PMID: 36294777; PMCID: PMC9605395. Checked on PubMed: authors (including Brilakis ES), title, journal, year, volume 12, issue 10, article 1638. Full text read in Europe PMC: it quotes the 2021 ACC/AHA/SCAI guideline as giving rotational atherectomy class 2a, level of evidence B, for fibrotic or heavily calcified lesions, and intracoronary imaging class 2a, level B, for guiding complex stenting. Its lithotripsy section also states that the shockwaves can induce atrial or ventricular ectopic beats and asynchronous pacing, that these transient captures were commonly seen during impulse generation, and that no ventricular tachyarrhythmias or adverse clinical outcomes have been reported.",
    verified: true,
  },
  {
    id: "gurgoglione-esc-ccs-2024",
    kind: "paper",
    citation:
      "Gurgoglione FL, Niccoli G. What is new from the 2024 European Society of Cardiology Congress on the management of chronic coronary syndromes? Updated guidelines and trials. Eur Cardiol. 2024;19:e23.",
    url: "https://doi.org/10.15420/ecr.2024.43",
    note: "PMID: 39651114; PMCID: PMC11622220. Checked on PubMed: authors, title, journal, year, volume 19, article e23 (editorial). Full text read in Europe PMC and on the publisher page: it states that the 2024 ESC CCS guideline for the first time recommends IVUS or OCT to guide PCI in complex lesions; its list of examples reads 'lumen lesions, true bifurcations, and long lesions', where 'lumen' is a garbling of left main (the same text writes 'lumen disease' for the left main CABG recommendation). Left main is confirmed by xie-hybrid-imaging-2025, which quotes the recommendation as covering left main disease, true bifurcations and long lesions. No class is quoted in the module.",
    verified: true,
  },
  {
    id: "xie-hybrid-imaging-2025",
    kind: "paper",
    citation:
      "Xie Y, Han W, Wang S, et al. Advantages of hybrid intravascular ultrasound-optical coherence tomography system in clinical practice. Front Cardiovasc Med. 2025;12:1595889.",
    url: "https://doi.org/10.3389/fcvm.2025.1595889",
    note: "PMID: 40687563; PMCID: PMC12271215. Checked on PubMed: authors, title, journal, year, volume 12, article 1595889. Full text read in Europe PMC: its introduction quotes the 2024 ESC CCS guideline (Vrints et al., Eur Heart J 2024;45:3415-3537) as recommending IVUS or OCT for PCI in complex anatomy, particularly left main disease, true bifurcations and long lesions. Cited only for that list of lesion types.",
    verified: true,
  },
  {
    id: "stone-eclipse-imaging-2025",
    kind: "paper",
    citation:
      "Stone GW, Généreux P, Maehara A, et al. Intravascular imaging vs angiography guidance for PCI of severely calcified lesions: the ECLIPSE trial. JACC Cardiovasc Interv. 2025;18:2338–2351.",
    url: "https://doi.org/10.1016/j.jcin.2025.08.024",
    note: "PMID: 41093451. Checked on PubMed: authors, title, journal, year, volume 18, issue 19, pages 2338–2351. Abstract read: imaging used at operator discretion in 1,246 of 2,005 patients; 1-year TVF 9.3% vs 13.2% (adjusted HR 0.74, 95% CI 0.56–0.97); effect consistent with orbital atherectomy or balloon angioplasty.",
    verified: true,
  },
  {
    id: "blachutzik-rota-shock-2023",
    kind: "trial",
    citation:
      "Blachutzik F, Meier S, Weissner M, et al. Coronary intravascular lithotripsy and rotational atherectomy for severely calcified stenosis: results from the ROTA.shock trial. Catheter Cardiovasc Interv. 2023;102:823–833.",
    url: "https://doi.org/10.1002/ccd.30815",
    note: "PMID: 37668088. Checked on PubMed: authors, title, journal, year, volume 102, issue 5, pages 823–833. Abstract read: 70 patients randomised; OCT minimal stent area 6.10 mm² with lithotripsy vs 6.60 mm² with rotational atherectomy, non-inferior; stent expansion similar.",
    verified: true,
  },
  {
    id: "honton-icare-ofdi-2026",
    kind: "trial",
    citation:
      "Honton B, Motreff P, Mallet JS, et al. Intravascular lithotripsy in comparison to rotational atherectomy for calcified lesions: the ICARE OFDI randomised trial. EuroIntervention. 2026;22:e808–e819.",
    url: "https://doi.org/10.4244/EIJ-D-26-00426",
    note: "PMID: 42200665. Checked on PubMed: authors, title, journal, year, volume 22, issue 15, pages e808–e819. Abstract read: 169 patients analysed, imaging-guided; minimal stent area 6.0 mm² with lithotripsy vs 5.9 mm² with rotational atherectomy, non-inferior; major strut malapposition 57.8% vs 80.2%; lesions described as moderate-to-severe calcified, all procedures guided by optical frequency domain imaging; 12-month target-lesion failure 2.4% with lithotripsy vs 1.2% with rotational atherectomy, described as equivalent.",
    verified: true,
  },
  {
    id: "kristensen-bali-2025",
    kind: "trial",
    citation:
      "Kristensen AT, Christiansen EH, Holm NR, et al. Balloon lithotripsy added to conventional preparation before stent implantation in severely calcified coronary lesions. JACC Cardiovasc Interv. 2026;19:331–341.",
    url: "https://doi.org/10.1016/j.jcin.2025.09.028",
    note: "PMID: 41400597. Checked on PubMed: authors, title, journal, volume 19, issue 3, pages 331–341 (online December 2025). Abstract read: 200 patients (BALI); procedural failure or 1-year target vessel failure 35% with lithotripsy vs 52% without (RR 0.69), driven mainly by residual area stenosis of 20% or more on OCT (32% vs 45%; RR 0.73, 95% CI 0.49–1.04, so that component alone was not significant).",
    verified: true,
  },
  {
    id: "kechichian-ivl-flutter-2021",
    kind: "paper",
    citation:
      "Kechichian A, Allam C, Njeim M, et al. Atrial flutter following Shockwave intravascular lithotripsy during percutaneous intervention of left anterior descending disease. Cardiovasc Revasc Med. 2022;40S:205–208.",
    url: "https://doi.org/10.1016/j.carrev.2021.09.005",
    note: "PMID: 34620569. Checked on PubMed: authors, title, journal, volume 40S, pages 205–208 (online September 2021). Case report; abstract read: new atrial flutter during lithotripsy, returned to sinus rhythm with amiodarone; the authors note that lithotripsy can depolarise cardiomyocytes.",
    verified: true,
  },
  {
    id: "kwok-ivl-capture-2019",
    kind: "paper",
    citation: "Kwok OH, Tse HF. Ventricular capture during Shockwave intravascular lithotripsy. JACC Cardiovasc Interv. 2019;12:e175–e179.",
    url: "https://doi.org/10.1016/j.jcin.2019.06.046",
    note: "PMID: 31563677. Checked on PubMed: authors, title, journal, year, volume 12, issue 20, pages e175–e179. No abstract on PubMed; cited only for its title (ventricular capture has been reported during lithotripsy).",
    verified: true,
  },
];
