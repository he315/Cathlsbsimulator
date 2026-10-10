// Module pm-imaging: intravascular imaging (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.13, 13.1-13.4, 10.2, 19 (calcification, with 19.9, 19.10 and 19.13),
// 20 (acute coronary syndromes and thrombus, with 20.7, 20.8, 20.10 and 20.13), 21.1 with 21.6 and 21.13 (CTO planning),
// 30.17 (imaging equipment), and related passages in 6.8, 7.2, 12.1, 15.1, 15.2, 16.2, 17.13, 22.1-22.4 and 25.2;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 1 (cardiac CT or invasive angiography?),
// chapter 8 (imaging the lesion, the PCI procedure, intravascular ultrasound, optical coherence tomography, IVUS or OCT?,
// restenosis, stent thrombosis, left main stem PCI) and chapter 10 (left main stem dissection).
// Every claim is listed with its page in docs/curriculum/evidence/pm-imaging.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const SRC_OCT = [{ book: "brilakis-pci" as const, loc: "13.3" }];
const SRC_IVUS = [{ book: "brilakis-pci" as const, loc: "13.4" }];

export const module: Module = {
  id: "pm-imaging",
  title: "Intravascular imaging",
  stage: 3,
  summary:
    "IVUS and OCT taught as the manuals teach them, one step at a time: when imaging changes what you do and which modality answers which question; how to prepare, advance, run and read each catheter, and what to do when the run fails; how to plan the case from the images (whether to treat, calcium and preparation, landing zones, length and diameter); how to optimise the stent (expansion, apposition, protrusion, edges, geographic miss, the left main); how OCT finds the culprit in an acute coronary syndrome; and how co-registration and coronary CT angiography help plan, including for chronic total occlusions.",
  objectives: [
    "List the lesions in which Brilakis finds imaging most useful, the questions imaging answers before, during and after PCI, and choose IVUS or OCT for a stated goal, lesion and patient.",
    "Prepare, advance and run an IVUS catheter (phased-array or rotational) and an OCT catheter step by step, with the injection rates, pullback modes and marker positions the manual gives, and recover from a catheter that will not cross, a pullback that will not start, catheter jumps and the common artefacts.",
    "Read the image: tissue appearances on IVUS and OCT, the OCT interpretation algorithm, and the artefacts that mimic disease.",
    "Plan PCI from imaging: when imaging can and cannot decide on revascularisation, the OCT calcium score and the decision for atherectomy, landing zones, length, and stent diameter by lumen, EEM or media-to-media measurement.",
    "Optimise the stent against the expansion, apposition, tissue protrusion and edge-dissection criteria, including the left main segment targets, and treat each shortfall as the manual directs.",
    "Use OCT to identify the culprit in an acute coronary syndrome (rupture, erosion, calcified nodule, thrombus), recognise when imaging can harm (spontaneous dissection), and use co-registration and coronary CT angiography to plan PCI and CTO crossing.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-when-which",
      title: "When to image, and IVUS or OCT",
      minutes: 14,
      topics: ["img-indications-modality"],
      sources: [
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "13.2" },
        { book: "brilakis-pci", loc: "1.13" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "30" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "brilakis-pci", loc: "22.4" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 8: Optical coherence tomography" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
      ],
      refs: [...BOOKS, "hong-ivus-xpl-2015", "ultimate-2018", "stone-imaging-nma-2024", "kang-octivus-2023", "ilumien4-2023", "renovate-2023", "october-2023", "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "An angiogram is a silhouette of the contrast-filled lumen. Intravascular imaging puts a small catheter inside the artery over the coronary wire and shows the wall itself in cross-section, so you can see plaque, calcium, thrombus, the true vessel size and, after stenting, the metal against the wall. There are two modalities: **intravascular ultrasound (IVUS)**, which uses sound, and **optical coherence tomography (OCT)**, which uses near-infrared light. The physics and image anatomy are taught in phy-ivus and phy-oct; this lesson is about the decision you make before you open a catheter: is imaging worth doing here, and which one?",
        },
        { kind: "h", text: "Where imaging pays off most" },
        {
          kind: "p",
          text: "Brilakis notes that some operators image every lesion they stent, but that the benefit seems greatest in complex disease. His list of settings is worth learning as it stands:",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Left main lesions.",
            "Long lesions.",
            "Chronic total occlusions.",
            "Failed stents, whether restenosed or thrombosed.",
            "Severely calcified lesions.",
            "Complex bifurcations.",
            "Lesions causing an acute coronary syndrome.",
            "Patients in whom contrast must be kept to a minimum (with IVUS, which needs no contrast to image).",
          ],
        },
        {
          kind: "p",
          text: "The planning checklist adds one history item: if the target lesion has been treated with PCI before, that alone strongly favours imaging. The Oxford handbook reaches a similar list from a different direction: IVUS adds information that angiography lacks and IVUS-guided PCI has been shown to improve outcomes, but time, cost and training limit its use, so it recommends it above all for ambiguous anatomy, for in-stent restenosis and for left main PCI. Its full list of IVUS indications is wider: a lesion of uncertain severity; anatomy that the angiogram leaves unclear (an aneurysm, a filling defect, a bifurcation, a heavily calcified vessel or a hazy segment); an accurate look at in-stent restenosis; the true calibre of the vessel and the length of the lesion; and complex PCI such as the left main, bifurcations and restenosis.",
        },
        { kind: "tip", id: "pci-planning-imaging-restenosis" },
        {
          kind: "table",
          caption: "What imaging is asked to answer, and when (Brilakis 13.1)",
          head: ["Moment", "Question", "What imaging shows"],
          rows: [
            ["Before PCI", "Does this left main lesion need treatment?", "Minimum lumen area against a threshold (lesson 4). Outside the left main, Brilakis does not use imaging to judge haemodynamic severity."],
            ["Before PCI", "Which lesion caused this acute coronary syndrome?", "Ulceration, erosion, thrombus or a calcified nodule mark the culprit (lesson 6)."],
            ["Before PCI", "What is this odd angiographic appearance?", "Whether a hazy or ambiguous segment is a dissection, thrombus or a calcified nodule."],
            ["Before PCI", "Why did this stent fail?", "The mechanism of restenosis or thrombosis (lesson 5)."],
            ["Before PCI", "Will this lesion embolise?", "A large lipid core or a large thrombus raises the risk of distal embolisation."],
            ["Before PCI", "Is this spasm or fixed disease?", "If a narrowing suspected of being spasm persists after intracoronary nitrate, IVUS or OCT can separate spasm from a true atherosclerotic stenosis (Brilakis 6.3)."],
            ["During PCI", "Does the lesion need preparation first?", "Calcium burden, and therefore whether atherectomy or lithotripsy is needed (lesson 4)."],
            ["During PCI", "Where are the landing zones, and what size and length?", "Disease-free landing zones (to avoid geographic miss), reference diameters, lesion length."],
            ["During PCI", "Is the stent result good?", "Expansion, strut apposition, tissue protrusion, edge dissection, residual disease beyond the edges (lesson 5)."],
            ["During PCI", "Can I spare the kidneys?", "IVUS can check the result with less contrast, lowering the risk of contrast-induced kidney injury in high-risk patients."],
            ["During PCI", "Where is my wire in this occlusion?", "IVUS can help cross a chronic total occlusion (cp-cto-strategy)."],
            ["After PCI", "Why has the stent thrombosed or narrowed?", "The mechanism, which decides the treatment."],
          ],
        },
        {
          kind: "check",
          stem: "A 76-year-old with an eGFR of 24 mL/min/1.73 m² needs PCI of a long mid-RCA lesion. You want imaging to size the stent and check the result while giving as little contrast as possible. Which plan fits the manual?",
          options: [
            "OCT before and after, because its higher resolution means fewer runs are needed",
            "IVUS, which images without contrast and can replace some check angiograms",
            "No imaging at all, because any imaging catheter adds contrast to the case",
            "OCT with saline instead of contrast, the standard flush for kidney disease",
          ],
          answer: 1,
          explanation:
            "Brilakis prefers IVUS in chronic kidney disease because it needs no contrast, and using IVUS to judge the result reduces the contrast volume and the risk of kidney injury. Every OCT run needs a flush that clears the blood: Brilakis states that this is usually contrast and that dextran, the alternative he mentions, has had limited study, and neither manual offers saline as a standard contrast-sparing flush. Avoiding imaging gives up sizing and optimisation in exactly the kind of long lesion where imaging helps.",
        },
        { kind: "h", text: "IVUS and OCT side by side" },
        {
          kind: "table",
          caption: "Technical comparison (Brilakis table 13.1 and text; Oxford table 8.6)",
          head: ["Feature", "IVUS", "OCT"],
          rows: [
            ["Energy", "Ultrasound; Oxford quotes 40 MHz, Brilakis lists catheters from 20 to 65 MHz", "Near-infrared light"],
            ["Blood clearance during the run", "Not needed", "Needed, normally by injecting contrast"],
            ["Axial resolution", "About 100 µm (Brilakis); 80–100 µm (Oxford)", "10–15 µm (Brilakis); 10–20 µm (Oxford): about ten times finer"],
            ["Lateral resolution (Oxford)", "200–250 µm", "20–40 µm"],
            ["Tissue penetration (Oxford)", "4–8 mm", "2–3.5 mm"],
            ["Catheter size (Oxford)", "3.2–3.5 Fr", "2.4–2.7 Fr"],
            ["Frame rate (Oxford)", "30–60 frames/s", "200 frames/s"],
            ["Pullback speed", "0.5–1.0 mm/s (Oxford); usually 1–10 mm/s depending on the catheter (Brilakis)", "18–36 mm/s, up to 40 (Oxford)"],
            ["Pullback length (Oxford)", "150 mm", "54–75 mm, up to 150"],
            ["Pullback type (Oxford)", "Motorised or by hand", "Motorised only"],
            ["Predilatation of a severe lesion before imaging (Brilakis)", "Needed less often", "Needed more often: the catheter and the contrast must both get through"],
            ["Ease of reading (Brilakis)", "Harder", "Easier, because the images are sharper"],
            ["Thrombus (Brilakis grade)", "+", "+++"],
            ["Calcium (Brilakis grade)", "++", "+++"],
            ["Plaque morphology (Brilakis grade)", "++", "+++"],
            ["Stents (Brilakis grade)", "++", "+++"],
            ["Aorto-ostial lesions (Brilakis grade)", "+++", "+"],
          ],
        },
        {
          kind: "p",
          text: "Read Brilakis's grades as a summary of where each modality is stronger: OCT sees thrombus and dissections better, characterises plaque better, and shows whether the stent struts are covered and against the wall; IVUS wins on depth, on aorto-ostial segments and on contrast.",
        },
        {
          kind: "table",
          caption: "Choosing by the question you are asking (Brilakis table 13.2; Oxford ‘IVUS or OCT?’)",
          head: ["Goal", "Better choice", "Reason or caveat"],
          rows: [
            ["Is a left main lesion significant?", "IVUS", "OCT can be used if the lesion is not aorto-ostial. Brilakis notes that there were no outcome data for OCT in the left main when he wrote; OCTOBER (2023) has since randomised complex bifurcations, 18.5% of them involving the left main, with fewer events overall under OCT guidance. OCT still cannot clear an ostial left main"],
            ["Which lesion is the ACS culprit?", "OCT", "Resolution"],
            ["Is this a dissection or thrombus?", "OCT", "Sharper, but the contrast injection may extend a dissection"],
            ["Why did the stent fail?", "Either", "Oxford notes that OCT defines stent parameters better"],
            ["How much plaque, and what kind?", "Either", "IVUS is preferred for plaque volume"],
            ["Does the lesion need preparation? Where are the landing zones? What diameter and length? Is the stent expanded?", "Either", "Both measure these"],
            ["Help crossing a CTO", "IVUS", "Brilakis's choice; the phased-array catheter images closer to its tip (next lesson)"],
            ["Are the struts apposed? Is there an edge dissection?", "OCT", "Resolution"],
            ["Keep contrast to a minimum", "IVUS", "No flush"],
            ["Large vessel, left main stem, aorto-ostial lesion, ectatic or aneurysmal segment (Oxford)", "IVUS", "Penetration, and a flush cannot fill these reliably"],
            ["Calcium, thrombus, intimal thickening, fibrous or lipid plaque, flaps, stent detail (Oxford)", "OCT", "Better definition"],
          ],
        },
        {
          kind: "p",
          text: "The goal is the first thing to settle, but not the only one. Brilakis adds the patient and the lesion (where the lesion is; chronic or acute kidney disease), and what your laboratory has and is practised in acquiring and reading. In large vessels he prefers IVUS because filling a big lumen completely with contrast is difficult, and in small vessels either modality can show the true size and any outward (positive) remodelling that would allow a larger stent.",
        },
        { kind: "tip", id: "pci-img-choose-by-goal" },
        { kind: "tip", id: "pci-img-ivus-contrast-saver" },
        {
          kind: "check",
          stem: "You have stented an aorto-ostial RCA lesion and want to know whether the stent really covers the ostium. Renal function is normal. Which imaging do the manuals favour?",
          options: [
            "IVUS, because a flush cannot clear an aorto-ostial segment reliably",
            "OCT, because it resolves the stent struts better than ultrasound does",
            "Either equally, since both need the same flush to show the ostium",
            "Neither: two orthogonal angiographic views settle ostial coverage",
          ],
          answer: 0,
          explanation:
            "Brilakis grades IVUS clearly better for aorto-ostial lesions, and Oxford lists aorto-ostial lesions among the places where IVUS remains the better option. In his ostial-lesion chapter Brilakis recommends imaging, preferably IVUS, after deployment, because angiography often misses an uncovered ostium: the balloon shoulder dilates the true ostium and makes the result look complete. OCT's resolution is no use if the contrast escapes into the aorta instead of clearing the ostium.",
        },
        { kind: "h", text: "The catheters you will be handed" },
        {
          kind: "list",
          items: [
            "**Solid-state (phased-array) IVUS.** No preparation, so it is quicker to use, but it is harder to deliver, its resolution is lower, and it cannot measure length unless it is co-registered with the angiogram. A short-tip version puts the imaging element 2.5 mm from the tip.",
            "**Rotational IVUS.** A spinning transducer inside a sheath; higher frequencies (Brilakis lists catheters of 40–60 MHz) and higher resolution; must be flushed before use.",
            "**IVUS combined with near-infrared spectroscopy.** Adds a map of lipid core plaque; large lipid cores found this way have been linked to distal embolisation and no-reflow.",
            "**Hybrid IVUS–OCT catheter.** Both images from one pullback.",
            "**OCT.** High-resolution images that are easier to read, at the price of a contrast flush with each run.",
          ],
        },
        { kind: "h", text: "What the evidence adds to the manuals" },
        {
          kind: "p",
          text: "Brilakis cites IVUS-XPL for long lesions: 1,400 patients needing a stent of at least 28 mm were randomised to IVUS or angiographic guidance, and major adverse cardiac events at one year fell from 5.8% to 2.9%, mostly through less repeat revascularisation of the target lesion. ULTIMATE extended the IVUS benefit to an all-comer population. Since the manuals were written, a 2024 network meta-analysis of 22 randomised trials (15,964 patients) found that imaging guidance, by IVUS or OCT, lowered target lesion failure (relative risk 0.71), cardiac death (0.55), stent thrombosis (0.52) and all-cause death (0.75) compared with angiography alone, with similar results for the two modalities. OCTIVUS compared them directly in 2,008 patients: OCT guidance was non-inferior to IVUS guidance at one year (2.5% against 3.1% for the composite end point), with similar rates of contrast nephropathy (1.4% and 1.5%), although its authors warn that the population was selected and that events were rarer than expected. Single trials have not all been positive: in ILUMIEN IV, OCT guidance gave a larger minimum stent area than angiography guidance but no significant reduction in target-vessel failure at two years, whereas RENOVATE-COMPLEX-PCI (imaging by IVUS or OCT) and OCTOBER (OCT in complex bifurcations, median 2 years: 10.1% against 14.1%) showed fewer events in complex lesions. The 2024 ESC chronic coronary syndromes guideline recommends imaging to guide PCI of anatomically complex lesions, in particular the left main, true bifurcations and long lesions.",
        },
        {
          kind: "p",
          text: "The practical message: which modality you choose matters less than choosing one when the lesion is complex, acquiring it well, and acting on what it shows.",
        },
        {
          kind: "pitfalls",
          items: [
            "Opening an OCT catheter for an ostial left main or aorto-ostial lesion and then failing to clear the ostium.",
            "Reaching for OCT in advanced kidney disease when IVUS would answer the same question without contrast.",
            "Using imaging to decide whether a non-left-main lesion needs treatment. Brilakis uses physiology for that (pm-physiology); lesson 4 gives Oxford's different view.",
            "Imaging and then ignoring the findings: a pullback helps only if you act on what it shows (expansion, apposition, edges).",
            "Forgetting that a target treated before is a reason to image from the start, not only when the result looks doubtful.",
          ],
        },
        {
          kind: "pearl",
          text: "Name the question before you choose the catheter. ‘Is the culprit here?’, ‘Are the struts against the wall?’ and ‘Is the edge dissected?’ point to OCT; ‘Is the ostium covered?’, ‘How big is this left main?’ and ‘Can I avoid contrast?’ point to IVUS. Everything in between, sizing, landing zones, expansion, can be done with either.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For each bench lesion, say before the pullback which modality you would choose and why (goal, lesion site, kidney function), then run the pullback with that modality and note one finding the other modality would have shown less well.",
        },
        { kind: "video", id: "slLO5Xd4FM4", note: "Manual of PCI chapter 13.1: when to image, and which modality." },
        { kind: "video", id: "R7LIfbAwMcQ", note: "A lecture on advanced coronary imaging." },
        { kind: "video", id: "TTC1aoFCBMo", note: "An update lecture on intravascular imaging and physiology." },
        {
          kind: "keypoints",
          items: [
            "Image most readily in the left main, long lesions, CTO, stent failure, severe calcium, complex bifurcations and ACS lesions, and when contrast must be spared (IVUS).",
            "A target lesion that has been stented before strongly favours imaging.",
            "Before PCI imaging decides left main significance, the ACS culprit, ambiguous lesions, the cause of stent failure and embolic risk; during PCI it guides preparation, landing zones, sizing and the result.",
            "OCT: about ten times the resolution, but needs a contrast flush and penetrates less. IVUS: no contrast, deeper penetration, better for ostia, the left main and large vessels.",
            "OCT for culprit, thrombus, dissection, apposition and edges; IVUS for the left main, CTO crossing, plaque volume and contrast saving; either for sizing and expansion.",
            "Imaging guidance lowers target lesion failure and, in pooled trials, death; OCT and IVUS perform similarly.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-ivus",
      title: "IVUS step by step: catheter, pullback and image",
      minutes: 13,
      topics: ["img-ivus"],
      sources: [
        { book: "brilakis-pci", loc: "13.4" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "30" },
        { book: "brilakis-pci", loc: "19.13" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 8: Optical coherence tomography" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis breaks IVUS into four steps: choose and prepare the catheter, advance it beyond the segment, pull it back while recording, and read the images. The starting point is the same as for any device: the guide is engaged in the target vessel and a coronary wire is across the segment you want to see. The Oxford handbook adds intracoronary nitrate (GTN) before and after imaging, so that spasm does not shrink the vessel you are about to measure.",
        },
        { kind: "tip", id: "pci-img-nitrate-first" },
        { kind: "h", text: "Step 1: choose and prepare the catheter" },
        {
          kind: "table",
          caption: "The two IVUS catheter families (Brilakis table 13.4 and section 30.17)",
          head: ["Property", "Phased-array (solid-state)", "Rotational"],
          rows: [
            ["Preparation", "None: open and use", "Flush before it enters the body"],
            ["Lumen appearance", "Black, without blood speckle; colour Doppler can show flow and outline the lumen", "Blood speckle in the lumen; no colour Doppler"],
            ["Crossing a tight lesion", "Harder", "Easier: lower profile"],
            ["Resolution", "Lower (an example catheter runs at 20 MHz)", "Higher, especially the 60 MHz catheters"],
            ["Length measurement", "Not without co-registration", "Yes, with a motorised pullback, and more accurate"],
            ["CTO crossing", "Preferred: the image is taken closer to the tip", "Less suited"],
            ["Catheter jumps during pullback", "Can happen", "Do not happen: the transducer moves inside its own sheath"],
          ],
        },
        {
          kind: "p",
          text: "A third option combines rotational IVUS (35–65 MHz) with near-infrared spectroscopy, which flags lipid core plaque at the same time; large lipid cores have been linked to distal embolisation and no-reflow (cm-flow-embolism).",
        },
        { kind: "h", text: "Step 2: advance the catheter beyond the segment" },
        {
          kind: "steps",
          items: [
            {
              title: "Load it on the wire",
              detail: "Like a balloon catheter, IVUS runs over the coronary wire on a short rapid-exchange (monorail) segment (Oxford).",
            },
            {
              title: "Phased-array only: press clear view in a roomy segment first",
              detail: "Before you take a solid-state catheter through the lesion, park it in a roomy part of the vessel or in the aorta and press the console's ‘clear view’ button (the manual's term). Then advance it.",
            },
            {
              title: "Go past the segment of interest",
              detail: "The pullback records from distal to proximal, so the imaging element must start beyond everything you want to see.",
            },
            {
              title: "If it will not cross",
              detail: "Brilakis lists the causes as a very tight lesion, severe calcium, severe tortuosity and weak guide support. Prevent it by predilating severely narrowed or calcified lesions, by getting good guide support, and by using a supportive wire in a very tortuous vessel. Treat it by taking the catheter out, predilating with a small balloon and increasing support. Never force it: forcing kinks the catheter, and a kinked catheter that still misbehaves after it is straightened has to be replaced.",
            },
          ],
        },
        { kind: "tip", id: "pci-img-ivus-clear-view" },
        { kind: "tip", id: "pci-img-cannot-cross" },
        {
          kind: "check",
          stem: "A rotational IVUS catheter stops at the entry of a tight, calcified mid-LAD lesion. The guide starts to back out as you push. What is the right next step?",
          options: [
            "Push harder with the independent-hand technique; the catheter is low profile",
            "Change to a phased-array catheter, which crosses tight lesions more easily",
            "Image from where it is and assume the lesion matches the proximal frames",
            "Pull it back, predilate with a small balloon, improve support, then retry",
          ],
          answer: 3,
          explanation:
            "Brilakis's treatment for an imaging catheter that will not advance is to remove it, predilate with a small balloon and increase guide support; forcing it risks kinking the catheter and losing guide position. Phased-array catheters are harder, not easier, to deliver than rotational ones. Imaging only the proximal segment tells you nothing about the lesion itself.",
        },
        { kind: "h", text: "Step 3: run the pullback" },
        {
          kind: "steps",
          items: [
            {
              title: "Set the depth",
              detail: "Adjust the imaging depth so that the whole vessel wall, out to its outer border, is in the picture.",
            },
            {
              title: "Start imaging before you pull",
              detail: "Look at the live image first and make sure it is free of artefact.",
            },
            {
              title: "Pull back",
              detail: "By hand or with a motorised pullback. Brilakis gives a usual motorised speed of 1–10 mm/s depending on the catheter; Oxford's table gives 0.5–1.0 mm/s for IVUS and a pullback length of 150 mm. Use the motorised pullback whenever you need lengths: lesion length can only be measured from an automated pullback, and it is more accurate with a rotational catheter.",
            },
            {
              title: "If the image jumps",
              detail: "‘Jumps’ are sudden forward or backward movements of the catheter during pullback, caused by tight lesions, severe tortuosity, severe calcium, or pulling across stent struts (for example after bifurcation stenting). They happen only with solid-state catheters. Prevent them by treating the lesion first and pulling back slowly and steadily; if they persist, change to a rotational catheter, prepare the lesion further, or image while advancing instead of while pulling back.",
            },
          ],
        },
        { kind: "tip", id: "pci-img-ivus-jumps" },
        { kind: "h", text: "Step 4: read the images" },
        {
          kind: "p",
          text: "Set the depth again so the whole vessel is shown, then look for artefacts before you look for disease.",
        },
        {
          kind: "table",
          caption: "IVUS artefacts (Brilakis 13.4; Oxford, Intravascular ultrasound)",
          head: ["Artefact", "What you see", "What to do"],
          rows: [
            ["Ring-down", "Shown in Brilakis figure 13.11; the text names it but does not describe it", "Recognise it as an artefact before you read any tissue"],
            ["Non-uniform rotational distortion (NURD)", "Distortion of part of the image", "Rotational catheters only; Oxford attributes it to the rotation of the transducer"],
            ["Blood speckle", "Echoes from slow-moving blood in the lumen", "Flushing the catheter may help"],
            ["Guidewire artefact", "An acoustic shadow cast by the metal wire", "Recognise it as the wire, not as calcium"],
            ["Motion", "The frame shifts along the vessel as the heart beats", "Remember the catheter moves axially through each cardiac cycle"],
          ],
        },
        {
          kind: "table",
          caption: "How tissues look on IVUS (Oxford: brightness follows density)",
          head: ["Density", "Structures", "Appearance"],
          rows: [
            ["Low", "Blood, media", "Black"],
            ["High", "Intima, adventitia", "White or grey"],
            ["Very high", "Calcium, stent struts", "Bright white, often with a black acoustic shadow behind"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Attenuation without calcium** (the signal fades behind plaque that is not bright) strongly suggests lipid core plaque, which matters because lipid-rich plaque can embolise when it is dilated or stented.",
            "**Calcium** blocks the ultrasound, so IVUS shows its leading edge and a shadow, never its thickness. If depth matters, OCT can measure it (lesson 4).",
            "**Measurements**: the console calculates vessel and lumen areas, lesion length and the reference vessel calibre (Oxford).",
            "Oxford also describes a refinement of IVUS that gives each tissue density its own colour to make the image easier to interpret.",
          ],
        },
        {
          kind: "check",
          stem: "On a phased-array IVUS pullback the lumen is black, and a band of plaque at 2 to 5 o’clock is followed by a dark shadow, although the plaque surface is not bright. What is the most likely tissue, and why does it matter?",
          options: [
            "Calcium; plan atherectomy or lithotripsy before stenting this lesion",
            "Blood speckle; flush the catheter and repeat the pullback run",
            "Lipid-rich plaque, which carries a risk of distal embolisation",
            "Guidewire shadow; rotate the catheter and repeat the pullback run",
          ],
          answer: 2,
          explanation:
            "Brilakis: when the signal fades behind plaque that contains no calcium, a lipid core is very likely, and large lipid cores raise the risk of distal embolisation. Calcium would appear bright white in front of its shadow. A phased-array catheter shows a black lumen without blood speckle, and a wire shadow is cast by the metal wire, not by a band of plaque.",
        },
        { kind: "h", text: "What can go wrong" },
        {
          kind: "list",
          items: [
            "Spasm, in under 3% of cases in Oxford's figures, usually relieved by intracoronary GTN.",
            "Major complications are very uncommon (under 0.3%, Oxford): dissection, thrombus in the vessel, and entrapment of the catheter by a stent strut.",
            "Kinking and failure to advance, as above; Brilakis lists the same problems for IVUS as for OCT.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Quoting a lesion length from a hand pullback, or from a solid-state catheter without co-registration.",
            "Taking a phased-array catheter through the lesion before pressing clear view in a roomy segment or the aorta.",
            "Reading blood speckle as thrombus, or any other artefact as plaque.",
            "Pulling a solid-state catheter quickly across fresh struts or a tight lesion and then measuring frames that jumped.",
            "Forgetting nitrate, so that spasm makes the vessel look smaller and the stent ends up undersized.",
          ],
        },
        {
          kind: "pearl",
          text: "Match the catheter to the job. For sizing and lengths in a native vessel, a rotational catheter with a motorised pullback gives the most reliable numbers. When you are working at the cap of an occlusion, the phased-array catheter earns its place: it images close to its tip and needs no preparation. For a tight lesion that cannot be predilated, choose the rotational catheter, whose lower profile crosses more easily.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Run an IVUS pullback through the bench vessel. Before you read any lesion frame, name every artefact you can see (ring-down, wire shadow, speckle), then find the frame with the smallest lumen and the most normal-looking frames proximal and distal to it.",
        },
        { kind: "video", id: "CLDtpHpXzzo", note: "Manual of PCI: IVUS step by step." },
        { kind: "video", id: "9mDgPltOm7Q", note: "Elias Hanna's lecture on intravascular ultrasound." },
        { kind: "video", id: "e3UfpXqp0uE", note: "Part 1 of a review of coronary near-infrared spectroscopy." },
        {
          kind: "keypoints",
          items: [
            "Start with the guide engaged, the wire across and nitrate given.",
            "Phased-array: no preparation, black lumen, colour Doppler, near-tip image for CTO, but bulkier, lower resolution and prone to jumps. Rotational: flush first, lower profile, higher resolution, accurate lengths.",
            "Press clear view with a phased-array catheter in a roomy segment or the aorta before crossing the lesion.",
            "Will not cross: out, small-balloon predilatation, more support; never force it.",
            "Set the depth to include the whole wall; lengths only from a motorised pullback.",
            "Attenuation without calcium means lipid; calcium hides its own thickness.",
            "Artefacts: ring-down, NURD, speckle, wire shadow and cardiac motion.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-oct",
      title: "OCT step by step: purge, flush, pullback and reading",
      minutes: 15,
      topics: ["img-oct"],
      sources: [
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "13.2" },
        { book: "brilakis-pci", loc: "30" },
        { book: "oxford-cath", loc: "ch 8: Optical coherence tomography" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Light is scattered by red cells, so OCT can only see the wall when the blood has been pushed out of the segment for the few seconds of the run. Early systems did this with an occluding balloon; current systems acquire fast enough for an injection of contrast through the guide to do it (Oxford). Most of the problems the manual lists come back to that flush, so much of what follows is about getting it right.",
        },
        { kind: "h", text: "Before you start" },
        {
          kind: "list",
          items: [
            "The guide is well engaged in the target vessel and a 0.014-inch wire is across the segment.",
            "Intracoronary nitroglycerin has been given unless there is a reason not to.",
            "The guide is usually 6 Fr or larger, so that a hand injection can clear the lumen. Through a 5 Fr guide you need a power injector to fill the vessel well enough for a good run.",
          ],
        },
        { kind: "tip", id: "pci-img-oct-guide-size" },
        {
          kind: "steps",
          title: "Steps 1 to 4: catheter ready and in position",
          items: [
            {
              title: "1. Prepare the catheter",
              detail: "Take it out of its packaging, flush it with undiluted (100%) contrast, put the pullback unit in its sterile bag and connect the catheter to it. If it will not image, suspect a faulty catheter, a kinked shaft, a pullback unit damaged by being disconnected wrongly, or a lens damaged while the wire was threaded through the short monorail segment. Handle it gently; replace a faulty catheter and send a faulty pullback unit for repair.",
            },
            {
              title: "2. Advance it beyond the target",
              detail: "The catheter has three markers: at the tip, at the wire exit port (the middle one), and 50 mm proximal to the imaging lens. To be sure the lesion is imaged, place the middle marker at least 57 mm beyond the target. The two proximal markers sit on the imaging core and move with the lens, and the distance between them roughly matches the length of a high-resolution run, which helps you choose the mode in step 5.",
            },
            {
              title: "3. Purge the catheter",
              detail: "Flush it again with 100% contrast and confirm on the image that there is no blood or air left inside it. Air casts a shadow and blood attenuates the signal; either spoils the run.",
            },
            {
              title: "4. Calibrate",
              detail: "Press the calibration button so that the automated measurements are correct. Do not calibrate while you are purging.",
            },
          ],
        },
        { kind: "tip", id: "pci-img-oct-marker" },
        { kind: "tip", id: "pci-img-oct-purge-calibrate" },
        {
          kind: "p",
          text: "If the catheter will not advance, the causes, prevention and treatment are those listed for IVUS in the previous lesson: predilate a severe or calcified lesion (which also lets the contrast get through for the run), improve guide support, use a supportive wire in tortuous vessels, and never force the catheter.",
        },
        { kind: "h", text: "Step 5: the imaging run" },
        {
          kind: "table",
          caption: "The two acquisition modes of one OCT system (Brilakis table 13.3)",
          head: ["", "Survey mode", "High-resolution mode"],
          rows: [
            ["Pullback length", "75 mm", "54 mm"],
            ["Pullback speed", "36 mm/s", "18 mm/s"],
            ["Duration", "2.1 s", "3.0 s"],
            ["Frames acquired (at 180 frames/s)", "375", "540"],
            ["Frame density", "5 frames/mm", "10 frames/mm"],
            ["Use", "Standard for imaging before PCI", "When fine detail is needed"],
          ],
        },
        {
          kind: "steps",
          items: [
            {
              title: "Choose the pullback length",
              detail: "Survey mode covers more vessel quickly; high-resolution mode doubles the frame density over a shorter segment.",
            },
            {
              title: "Test the engagement",
              detail: "A small test injection confirms that the guide is well seated and that contrast will go down the vessel, not back into the aorta.",
            },
            {
              title: "Enable and inject",
              detail: "Press enable, then inject, usually while recording cine so you see on the angiogram which segment is being imaged. An automated injector fills the vessel more reliably; typical settings are 4 mL/s for 4 seconds in the left coronary artery and 3 mL/s for 3 seconds in the right.",
            },
            {
              title: "Let the system trigger",
              detail: "The pullback starts automatically when the console detects a blood-free lumen; you can also start it by hand.",
            },
            {
              title: "Hold the catheter and wire",
              detail: "A forceful injection can drive an unheld OCT catheter and wire distally. If that happens, check the distal vessel for injury or a perforation, and deal with what you find.",
            },
          ],
        },
        { kind: "tip", id: "pci-img-oct-flush-rates" },
        { kind: "tip", id: "pci-img-oct-hold-catheter" },
        {
          kind: "table",
          caption: "When the run fails (Brilakis 13.3.5)",
          head: ["Problem", "Causes", "Prevention", "Treatment"],
          rows: [
            [
              "The pullback will not start",
              "Contrast does not penetrate the segment; weak injection; the guide has disengaged",
              "Check coaxial engagement before injecting; use an injector or a thin syringe; confirm contrast passes the lesion",
              "Re-engage, or use a guide extension; inject at least 3 mL/s in the RCA and 4 mL/s in the left main; redilate a lesion that is still very tight; trigger by hand; raise the rate or length of the injection (a non-linear rise if the guide is stable)",
            ],
            [
              "Artefacts",
              "Poor clearance; poor catheter preparation; one or more buddy wires",
              "Fill the vessel well with good engagement (an injector helps); take buddy wires out",
              "Correct the cause, then repeat the run",
            ],
            [
              "Catheter migrates distally",
              "Forceful injection with the catheter and wire not held",
              "Hold both during the injection",
              "Check for distal injury or perforation and treat it",
            ],
          ],
        },
        { kind: "tip", id: "pci-img-oct-no-pullback" },
        {
          kind: "check",
          stem: "You inject for an OCT run in the LAD through a 6 Fr EBU guide. The lumen never clears and the pullback does not start; on the cine, contrast refluxes into the aorta. What do you do first?",
          options: [
            "Repeat the run unchanged, since failed triggers are random and usually clear",
            "Re-seat the guide coaxially, test it with a small injection, then rerun",
            "Change to high-resolution mode, which needs less contrast to trigger",
            "Lower the injection to 2 mL/s so the guide stays in the ostium",
          ],
          answer: 1,
          explanation:
            "Reflux into the aorta means the guide is not delivering the flush into the artery. Brilakis's first remedies are coaxial engagement (or a guide extension), confirmed with a test injection, then a powerful injection of at least 4 mL/s for the left main. High-resolution mode is a slower, shorter pullback; it does not need less flush. A weaker injection makes clearance worse.",
        },
        { kind: "h", text: "Step 6: reading the OCT" },
        {
          kind: "p",
          text: "Set the visualisation depth so the whole vessel is in view. Then go through the images in the same order every time: artefacts first, then the baseline lesion, then, after stenting, the stent (lesson 5).",
        },
        {
          kind: "table",
          caption: "OCT artefacts (Brilakis figure 13.3)",
          head: ["Artefact", "What you see", "Cause, where the manual gives one"],
          rows: [
            ["Incomplete blood clearance", "The light is attenuated by residual blood in the lumen", "Poor flush"],
            ["Eccentric imaging wire", "Struts appear to line up towards the imaging wire (‘sunflower’) and look elongated (‘merry-go-round’)", "The imaging wire lies off-centre in the lumen"],
            ["Saturation", "Some scan lines look streaked", "Not given"],
            ["Sew-up", "The image is misaligned at one point of the circle", "Rapid movement of the wire or vessel during the frame"],
            ["Air in the catheter", "An arc of attenuated image, sometimes with small bright bubbles visible", "Incomplete purge"],
            ["Fold-over", "A folded image; in Brilakis's example the frame lies at a side branch", "Described with Fourier-domain systems"],
          ],
        },
        {
          kind: "p",
          text: "For the vessel wall Brilakis gives a simple algorithm. Ask first whether the three layers (bright intima, dark media, bright adventitia) can be traced all the way round. If they can, the wall is normal or the plaque is fibrous. If they cannot, ask where the change in signal is, and then whether it attenuates the light strongly:",
        },
        {
          kind: "table",
          caption: "The OCT reading algorithm, in table form (Brilakis figures 13.4 and 13.5)",
          head: ["Where the signal changes", "Attenuation", "Likely finding", "Appearance"],
          rows: [
            ["Layers visible all round", "Not applicable", "Normal wall or fibrous plaque", "Three layers; fibrous plaque is homogeneous and signal-rich"],
            ["In the lumen", "High", "Red (red-cell-rich) thrombus", "Mass on or near the surface that casts a shadow on the wall behind it"],
            ["In the lumen", "Low", "White (platelet-rich) thrombus", "Mass in the lumen with little attenuation"],
            ["In the wall", "High", "Lipid", "Signal-poor, with poorly defined borders; the media cannot be seen behind it"],
            ["In the wall", "Low", "Calcium", "Signal-poor, with sharp borders; its depth and arc can usually be measured"],
          ],
        },
        {
          kind: "p",
          text: "Real lesions are often mixed, so use the algorithm to name each component rather than to give the whole lesion one label. Oxford adds the uses of OCT before and after PCI: vessel sizing (lumen areas and diameters at the references, the minimum lumen area, measured by lumen contour or from media to media), the ACS culprit, high-risk plaque, and the causes of a poor stent result or of stent failure, all taught in the next lessons.",
        },
        {
          kind: "check",
          stem: "On an OCT frame there is a dark arc between 5 and 9 o’clock, and you can see a few small bright dots inside the catheter at that position. The vessel wall elsewhere looks normal. What is it, and what do you do?",
          options: [
            "Red thrombus; give a glycoprotein IIb/IIIa inhibitor and aspirate",
            "Lipid plaque; plan a stent long enough to cover the whole arc",
            "Air in the catheter; purge again with contrast and repeat the run",
            "Fold-over at a side branch; ignore it and read the next frame",
          ],
          answer: 2,
          explanation:
            "Air bubbles inside the catheter attenuate the image along the corresponding arc, and the bubbles themselves may be visible as bright structures. The prevention is a thorough purge with 100% contrast before the run (step 3), and the treatment is to correct it and repeat. Thrombus and lipid are in the lumen and the wall, not inside the catheter.",
        },
        {
          kind: "pitfalls",
          items: [
            "Running OCT through a 5 Fr guide by hand injection.",
            "Leaving air or blood in the catheter, then reading the resulting shadow as disease.",
            "Calibrating while purging.",
            "Parking the catheter too close: the middle marker should be at least 57 mm beyond the target.",
            "Leaving a buddy wire in during the run.",
            "Injecting hard without holding the catheter and wire, so they jump distally.",
            "Pushing contrast forcefully into a suspected spontaneous dissection (lesson 6).",
          ],
        },
        {
          kind: "pearl",
          text: "Spend one small test injection before every run. If the test does not fill the vessel cleanly, a full run will not either; fix the guide or the injection first and you save both a run's worth of contrast and the time of reading a useless pullback.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Acquire an OCT pullback on the bench: choose survey or high-resolution mode and say why, then check every frame for incomplete clearance, air shadow, sew-up and sunflower struts before you classify the plaque with the algorithm (layers visible? lumen or wall? high or low attenuation?).",
        },
        { kind: "video", id: "hBNmLRfw44o", note: "Manual of PCI: OCT step by step." },
        { kind: "video", id: "dFlnQ6aD0ks", note: "Elias Hanna's lecture on optical coherence tomography." },
        { kind: "video", id: "E1jrJqvJNPM", note: "A CTO case using OCT for thrombus and dissection." },
        {
          kind: "keypoints",
          items: [
            "Usually a guide of 6 Fr or more for hand injection; a 5 Fr guide needs an injector.",
            "Prepare and purge with 100% contrast; no blood or air in the catheter; calibrate, but not while purging.",
            "Middle marker at least 57 mm beyond the target; the proximal marker is 50 mm from the lens.",
            "Survey mode: 75 mm at 36 mm/s, 5 frames/mm; high resolution: 54 mm at 18 mm/s, 10 frames/mm.",
            "Test injection, then typically 4 mL/s × 4 s for the left system and 3 mL/s × 3 s for the RCA; automatic trigger on a clear lumen.",
            "Hold catheter and wire during the injection; remove buddy wires.",
            "Read in order: artefacts, then tissue (layers? lumen or wall? high or low attenuation?).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-planning",
      title: "Planning PCI from the images: whether, how to prepare, where and what size",
      minutes: 15,
      topics: ["img-pre-pci-planning"],
      sources: [
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "13.4" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "19.13" },
        { book: "brilakis-pci", loc: "17.13" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "22.3" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
      ],
      refs: [...BOOKS, "fujino-calcium-2018", "zhang-ivus-calcium-2021", "ilumien3-2016", "litro-2011", "october-2023"],
      blocks: [
        {
          kind: "p",
          text: "Imaging before the stent answers two separate questions: should this lesion be treated at all, and if so, how? Brilakis breaks the ‘how’ into three parts that you should work through in order: does the lesion need atherectomy or other calcium modification, how long should the stent be, and what diameter? The sizing basics (distal reference, never the proximal) are in pm-prep-and-stent; here they are done with images.",
        },
        { kind: "h", text: "1. Should PCI be done?" },
        {
          kind: "table",
          caption: "Imaging thresholds for the left main (Brilakis 13.1, 13.3, 13.4, 17.13)",
          head: ["Modality", "Significant (revascularise)", "Not significant", "Caveat"],
          rows: [
            ["IVUS", "Minimum lumen area below 6.0 mm²", "Above 6.0 mm²", "A cut-off of 4.5 mm² has been proposed for Korean patients, whose coronary arteries are smaller; the threshold differs between populations"],
            ["OCT", "Below 5.4 mm²", "Above 5.4 mm²", "Proposed but not prospectively validated; the ostial left main is hard to image with OCT. Brilakis notes there were no outcome data for OCT in the left main when he wrote; OCTOBER (2023) has since included left main bifurcations among the complex bifurcations it randomised (lesson 1)"],
          ],
        },
        {
          kind: "p",
          text: "Outside the left main the two books disagree. Brilakis is explicit: the minimum lumen area should not be used to judge the haemodynamic significance of a non-left-main lesion; use physiology (pm-physiology). The Oxford handbook takes a luminal area under 4 mm² to mean that a native epicardial stenosis, outside the left main, probably causes ischaemia (Oxford prints ‘mean’ luminal area; the conventional measure is the minimal lumen area). Treat Oxford's number as a pointer, not a decision; later evidence on single area cut-offs outside the left main is summarised in pm-interpreting. Aorto-ostial lesions need their own approach. When the severity of one is in doubt, give nitrate first to exclude spasm, then use physiology, or imaging if the lesion is at the ostium of the left main. Imaging also spares the ostium the repeated angiographic runs that can dissect it, and it shows how the lesion responds to treatment. The slanted take-off means a two-dimensional IVUS area must be read with care here, especially when the decision concerns the left main (Brilakis 15.1).",
        },
        { kind: "tip", id: "pci-img-lm-threshold" },
        {
          kind: "check",
          stem: "In a stable patient, IVUS of an intermediate mid-LAD lesion shows a minimum lumen area of 3.6 mm². What do the manuals say about using this number to decide on PCI?",
          options: [
            "Both books treat it as significant, so stent the lesion now",
            "Both books say area cannot be used anywhere, including in the left main",
            "Brilakis: significant below 6.0 mm² in any vessel, so stent it",
            "Brilakis: do not use it; Oxford: an area under 4 mm² suggests ischaemia",
          ],
          answer: 3,
          explanation:
            "Brilakis says imaging should not be used to determine the haemodynamic significance of non-left-main lesions; physiology does that. Oxford gives a (mean) luminal area under 4 mm² as a likely ischaemia-producing stenosis outside the left main. The 6.0 mm² IVUS threshold is Brilakis's and applies to the left main only; Oxford excludes the left main from its 4 mm² rule and gives no left main threshold. With the books in disagreement, the safer course is the one with outcome evidence: measure the physiology.",
        },
        { kind: "h", text: "2. Does the calcium need modifying first?" },
        {
          kind: "p",
          text: "Angiography underestimates calcium: in the study Brilakis quotes, calcium was seen in 38% of 1,155 lesions by angiography and in 73% by IVUS. Imaging also grades the arc: more than 270° is severe, 180–270° moderate, under 180° mild. On OCT, calcium is a dark, low-attenuation region with sharp borders, so the light passes through it and both its arc and its thickness can be measured. IVUS shows only the bright front edge and the shadow behind, so OCT may be preferred when depth matters. Three OCT findings predict an underexpanded stent, and they are scored:",
        },
        {
          kind: "table",
          caption: "OCT calcium score (Fujino; Brilakis figure 13.7)",
          head: ["Feature (worst frame or segment)", "Points"],
          rows: [
            ["Maximum calcium arc over 180°", "2"],
            ["Maximum calcium thickness over 0.5 mm", "1"],
            ["Calcium length over 5.0 mm", "1"],
            ["Total", "0 to 4"],
          ],
        },
        {
          kind: "p",
          text: "In Fujino's validation cohort, lesions scoring 4 (all three features) reached a mean stent expansion of only 78%, against 96% for scores of 0 to 3 (Brilakis summarises this as a 22% likelihood of underexpansion, but the paper reports mean expansion, and 22% is the gap between 78% and full expansion, not a probability). A score of 4 therefore favours plaque modification (atherectomy or intravascular lithotripsy, cp-calcium) before the stent. Location matters as well as amount: calcium deep in the wall may give way to a balloon, while calcium at the lumen surface is more likely to need an ablative technique. Brilakis wrote that there were no commonly accepted IVUS criteria for atherectomy, but that calcium which is circumferential and superficial on IVUS favours it (or lithotripsy, where available); an IVUS-derived calcium score has since been published (Zhang 2021). In the calcium chapter Brilakis adds obstructive nodular calcium and thick calcium to the imaging findings that suggest atherectomy will be needed.",
        },
        {
          kind: "check",
          stem: "Pre-PCI OCT of a calcified RCA lesion shows a maximum calcium arc of 200°, a maximum thickness of 0.4 mm and a calcified length of 7 mm. What is the OCT calcium score?",
          options: ["2", "3", "4", "1"],
          answer: 1,
          explanation:
            "Arc over 180° scores 2 points, thickness 0.4 mm (not over 0.5 mm) scores 0, and length over 5.0 mm scores 1: total 3. In Fujino's data, scores of 0 to 3 were followed by good stent expansion; only a score of 4 predicted poor expansion. Still weigh where the calcium lies (superficial or deep) and whether a 1:1 non-compliant balloon expands fully (Brilakis 19.9.3).",
        },
        {
          kind: "list",
          items: [
            "**If the imaging catheter will not cross** a calcified, tortuous segment, image after atherectomy instead.",
            "**After the balloon or atherectomy**, re-image: cracks (fractures) in a ring of superficial calcium give confidence that the stent will expand, and Brilakis notes that OCT-detected calcium fracture goes with better stent expansion.",
            "Imaging is recommended in calcified lesions both before stenting (is the preparation enough?) and after (is the stent expanded, and is there a large edge dissection?).",
          ],
        },
        { kind: "tip", id: "pci-img-calcium-score" },
        { kind: "tip", id: "pci-img-image-after-modification" },
        { kind: "h", text: "3. Where will the stent land, and how long is it?" },
        {
          kind: "steps",
          items: [
            {
              title: "Find landing zones",
              detail: "Land each edge where less than half of the vessel area is plaque and where there is no lipid pool, least of all a thin-cap fibroatheroma: edges on such plaque tend to dissect. Aim for segments as free of disease as possible so that you avoid a geographic miss.",
            },
            {
              title: "Know the limits of OCT here",
              detail: "Where plaque is heavy, and especially behind lipid, OCT may not see the external elastic membrane (EEM), so plaque burden can be hard to judge; IVUS penetrates further.",
            },
            {
              title: "Measure the length between them",
              detail: "Use the automated pullback (with IVUS, lengths are more accurate with a rotational catheter). This is the length the stent must cover, with the injured segments from preparation added, as taught in pm-prep-and-stent.",
            },
          ],
        },
        { kind: "tip", id: "pci-img-landing-zone" },
        { kind: "h", text: "4. What diameter?" },
        {
          kind: "steps",
          items: [
            {
              title: "Measure the distal reference",
              detail: "The distal reference sets the stent diameter. Measure either the distal lumen diameter (the method the manual's authors recommend) or the EEM-to-EEM diameter. Oxford likewise describes measurement by lumen contour or from media to media.",
            },
            {
              title: "Round it",
              detail: "Brilakis's rule is that a lumen-based stent diameter is rounded up by 0.25 mm and an EEM-based one rounded down by 0.25 mm. Worked through: a distal lumen of 2.8 mm plus 0.25 mm is 3.05 mm, so a 3.0 mm stent; a distal EEM of 3.2 mm minus 0.25 mm is 2.95 mm, again a 3.0 mm stent. The wording can also be read as moving to the next stent size up from the lumen or down from the EEM, and that reading gives 3.0 mm from both measurements too. The EEM cannot always be seen, so EEM-based sizing is not always feasible: ILUMIEN III managed it in 77% of cases.",
            },
            {
              title: "Never size to the proximal reference",
              detail: "Coronary arteries taper, so a stent sized to the proximal vessel overstretches the distal vessel and can dissect it (chapter 10 adds perforation and side-branch occlusion from carina shift).",
            },
            {
              title: "Plan the proximal post-dilatation",
              detail: "If the proximal reference is larger than the distal one, post-dilate the mid and proximal stent with a larger but shorter balloon chosen from the proximal reference. Check the stent's labelled expansion limit when the difference is large, as in the left main.",
            },
          ],
        },
        {
          kind: "p",
          text: "Chapter 10 of the same manual gives a third rule for imaging-based sizing when the media is visible: choose a stent diameter of 85% of the media-to-media dimension. The two media-based rules will not always give the same answer; whichever you use, keep the principle that the distal reference sets the stent and the proximal reference sets the post-dilatation balloon.",
        },
        {
          kind: "formula",
          name: "Stent diameter from imaging (Brilakis 13.3 and 10.2)",
          expr: "Lumen-based: mean distal reference lumen diameter + 0.25 mm  ·  EEM-based: distal EEM diameter − 0.25 mm  ·  Media-based (chapter 10): 0.85 × distal media-to-media diameter",
          note: "Then post-dilate the proximal stent to the proximal reference with a shorter balloon.",
        },
        { kind: "tip", id: "pci-img-size-distal-reference" },
        {
          kind: "check",
          stem: "OCT before PCI of a mid-LAD lesion: the distal reference has a mean lumen diameter of 2.8 mm and its EEM cannot be traced; the proximal reference lumen is 3.4 mm. Which plan follows Brilakis?",
          options: [
            "A 3.5 mm stent sized to the proximal reference, for full apposition",
            "A 2.5 mm stent, rounding the distal lumen measurement down by 0.25 mm",
            "A 3.0 mm stent, then a shorter, larger balloon for the proximal part",
            "A 2.75 mm stent with no proximal post-dilatation, to protect the vessel",
          ],
          answer: 2,
          explanation:
            "With no visible EEM, size from the distal lumen and round up by 0.25 mm: 2.8 + 0.25 = 3.05 mm, a 3.0 mm stent (the next size up from 2.8 mm is also 3.0 mm). Rounding down applies to EEM-based sizing. Sizing to the proximal reference risks distal dissection because the vessel tapers; the larger proximal segment is handled by post-dilating with a larger, shorter balloon.",
        },
        { kind: "h", text: "Other planning uses" },
        {
          kind: "list",
          items: [
            "**Risk of embolisation.** A large lipid core plaque or a large thrombus raises the risk of distal embolisation; planning for it is taught in cm-flow-embolism and cp-acs-thrombus.",
            "**Vessel size.** In a small vessel imaging shows the true size and any positive remodelling that would take a larger stent; in a large vessel it gives the true size (IVUS preferred).",
            "**Long lesions.** Imaging measures the proximal and distal references and the length accurately.",
            "**Bifurcations.** Imaging measures diameter and length in the main vessel and the side branch and shows calcium (cp-bifurcation-provisional).",
            "**Left main.** Oxford: use IVUS before PCI to measure the reference diameter and lesion length; judged by eye, the reference may be underestimated, the stent undersized, and restenosis or stent thrombosis can follow.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Deciding to stent a non-left-main lesion on its minimum lumen area alone.",
            "Applying a Western left main threshold without thinking about vessel size and the population it came from.",
            "Reading only the calcium arc and forgetting thickness and length.",
            "Landing an edge on lipid-rich plaque or thin-cap fibroatheroma because the angiogram looked clean there.",
            "Rounding the wrong way: up for lumen, down for EEM.",
            "Choosing the stent from the proximal reference in a tapering vessel.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you leave the console, write the plan as four numbers and one word: distal reference (lumen or EEM), proximal reference, length between landing zones, calcium score, and the preparation tool. If you cannot fill in all five, the pullback has not finished its job.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "From a pre-PCI pullback, score the calcium (arc, thickness, length), choose a preparation tool, mark landing zones with plaque burden below 50% and no lipid-rich plaque, measure the length between them, and size the stent from the distal reference (lumen +0.25 mm or EEM −0.25 mm) with a separate proximal post-dilatation balloon.",
        },
        { kind: "video", id: "5GjTX2J80Fw", note: "Elias Hanna on sizing balloons, stents and drug-coated balloons by angiography and by IVUS or OCT." },
        { kind: "video", id: "so9MltihMSs", note: "Elias Hanna on IVUS and OCT guidance before and after stenting." },
        {
          kind: "keypoints",
          items: [
            "Left main: significant below 6.0 mm² by IVUS or 5.4 mm² by OCT (OCT unvalidated); 4.5 mm² proposed in Korean patients.",
            "Non-left main: Brilakis does not use area to decide; Oxford quotes under 4 mm². Prefer physiology.",
            "Calcium score: arc over 180° = 2, thickness over 0.5 mm = 1, length over 5 mm = 1; a score of 4 predicted poor expansion (mean 78% against 96% for 0 to 3).",
            "Superficial, circumferential, nodular or thick calcium points to atherectomy or lithotripsy; deep calcium may yield to a balloon.",
            "Landing zones: plaque burden below 50%, no lipid-rich plaque or thin-cap fibroatheroma; length from an automated pullback.",
            "Diameter from the distal reference: lumen +0.25 mm, EEM −0.25 mm (or 85% of media-to-media); never the proximal reference.",
            "Proximal segment: post-dilate with a larger, shorter balloon.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-optimisation",
      title: "Optimising the stent: expansion, apposition, protrusion and edges",
      minutes: 15,
      topics: ["img-stent-optimisation"],
      sources: [
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "13.4" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "17.13" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "15.2" },
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "19.13" },
        { book: "brilakis-pci", loc: "21.13" },
        { book: "brilakis-pci", loc: "22.2" },
        { book: "brilakis-pci", loc: "17.12" },
        { book: "brilakis-pci", loc: "23.2" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
        { book: "oxford-cath", loc: "ch 8: Restenosis" },
        { book: "oxford-cath", loc: "ch 8: Stent thrombosis" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
      ],
      refs: [...BOOKS, "eapci-imaging-2018", "kang-lm-ivus-2011", "soeda-oct-protrusion-2015"],
      blocks: [
        {
          kind: "p",
          text: "A stent can look perfect on the angiogram and still be too small, partly off the wall, or ending on a torn edge. An underexpanded stent is more likely to restenose or thrombose, which is why the post-stent pullback is where imaging pays for itself. The sequence below is Brilakis's example of OCT-guided PCI; his IVUS section lists its own post-stent checks, which appear in the IVUS column of the table further down.",
        },
        {
          kind: "steps",
          title: "The imaging-guided loop",
          items: [
            { title: "1. Image before PCI", detail: "Predilate first if the catheter or the flush cannot get through." },
            { title: "2. Measure and choose", detail: "References, length and diameter, as in lesson 4." },
            { title: "3. Deploy the stent", detail: "As taught in pm-prep-and-stent." },
            { title: "4. Is the angiographic result good?", detail: "If not, post-dilate before you image." },
            { title: "5. Image after PCI", detail: "Check the four parameters below in order." },
            { title: "6. Target met?", detail: "If not, post-dilate (or treat the edge) and image again; if yes, the procedure is complete." },
          ],
        },
        {
          kind: "p",
          text: "Brilakis also uses imaging to decide whether post-dilatation is needed at all. His usual practice after deploying at 12–14 atm is high-pressure post-dilatation, usually at 20 atm or more, with a shorter non-compliant balloon. He lists three exceptions: excellent expansion confirmed by imaging, concern about thrombus or plaque embolisation, and concern about compromising a large jailed branch. When the X-ray stent-enhancement mode or imaging shows a poor result, longer inflations or higher pressures can be tried (up to 20 atm for semi-compliant and 26–28 atm for non-compliant balloons). Those pressures may exceed a balloon's rated burst pressure, and a ruptured balloon can dissect or perforate the vessel, so know the rated burst pressure of the balloon you are using and escalate deliberately (Brilakis 23.2).",
        },
        { kind: "h", text: "The four checks after the stent" },
        {
          kind: "table",
          caption: "Post-stent criteria (Brilakis 13.3 and 13.4, from the EAPCI consensus)",
          head: ["Check", "OCT", "IVUS", "If it fails"],
          rows: [
            [
              "1. Expansion (minimum stent area, MSA)",
              "Non-left main: MSA over 4.5 mm² or over 80% of the average reference lumen area; or, alternatively, over 90% of the proximal reference for the proximal half and of the distal reference for the distal half. Left main: over 8.0 mm²",
              "At least 5.5 mm² (non-left main) or 8.0 mm² (left main); plaque burden below 50% at both edges",
              "Non-compliant balloon at least the stent diameter, at more than 18 atm; re-image",
            ],
            [
              "2. Malapposition",
              "Acute malapposition (a strut at least 200 µm off the intima) has not been linked to stent failure. Extensive malapposition, as Brilakis words it: maximum distance of 400 µm or more, or a malapposed length of 1 mm or more (see the note below the table)",
              "Assessed after stenting; Brilakis illustrates severe malapposition with phased-array IVUS and colour Doppler",
              "Correct extensive malapposition by post-dilatation, usually with a semi-compliant balloon at low pressure",
            ],
            [
              "3. Tissue protrusion",
              "Brilakis: not linked to adverse outcomes. Later OCT data separate the types: smooth protrusion has not been linked to outcomes, but irregular protrusion (found in about half of the lesions studied) independently predicted device-oriented events at one year (Soeda 2015)",
              "Brilakis: not linked to adverse outcomes",
              "Post-dilate if the remaining effective lumen is inadequate",
            ],
            [
              "4. Edge dissection",
              "OCT is more sensitive than IVUS. Small, non-flow-limiting: no treatment. Larger (over 60° of arc and/or over 3 mm long), especially at the distal edge: an additional stent may be best",
              "There should be no edge dissection involving the media and longer than 3 mm",
              "Additional stent",
            ],
          ],
        },
        {
          kind: "p",
          text: "The thresholds are not equally firm. The EAPCI writing group whose consensus Brilakis reproduces says that some rest on consistent prospective data (stent expansion, the landing zone) and others are less well established (malapposition). The malapposition rule is also worded differently in different places: Brilakis treats a distance of 400 µm or more **or** a length of 1 mm or more as extensive, whereas the Academy's IVUS lesson (phy-ivus-optimisation) applies the distance and the length together. Every example in this module gives the same answer under either reading.",
        },
        {
          kind: "p",
          text: "Two more findings complete the review. **Geographic miss**: residual disease beyond an edge, the reason for covering the whole lesion and every balloon-injured segment. **Intramural haematoma** after stenting, which Brilakis lists as a fourth IVUS post-stent finding; its management belongs with acute closure and dissection (cm-principles-closure). Brilakis's chapter 10 lists the causes of a distal edge dissection: an oversized stent, very high pressure, and incomplete lesion coverage, especially with the edge sitting on lipid-rich plaque.",
        },
        { kind: "tip", id: "pci-img-underexpansion-fix" },
        { kind: "tip", id: "pci-img-malapposition" },
        { kind: "tip", id: "pci-img-edge-dissection" },
        {
          kind: "check",
          stem: "After a 3.0 mm stent in the mid-LAD, OCT shows an MSA of 3.9 mm². The proximal and distal reference lumen areas are 7.0 and 5.0 mm². What should you do?",
          options: [
            "Accept it: the MSA is above the IVUS threshold of 3.5 mm² for this vessel size",
            "Post-dilate with a semi-compliant balloon at low pressure, as you would for malapposition",
            "Implant a second stent inside the first to add radial strength to the segment",
            "Post-dilate with a non-compliant balloon of 3.0 mm or more above 18 atm, then re-image",
          ],
          answer: 3,
          explanation:
            "The average reference lumen area is 6.0 mm², so 80% is 4.8 mm²; an MSA of 3.9 mm² fails both the absolute (over 4.5 mm²) and the relative target. Brilakis treats acute underexpansion with a non-compliant balloon at least the stent's diameter at more than 18 atm, then images again. Low-pressure semi-compliant inflation is his treatment for extensive malapposition, not for underexpansion. There is no 3.5 mm² IVUS threshold; the IVUS target is 5.5 mm².",
        },
        {
          kind: "check",
          stem: "After post-dilatation the stent is well expanded. OCT shows a few struts 300 µm off the wall over a length of 0.6 mm, and a short intimal flap at the distal edge spanning 30° with normal flow. What next?",
          options: [
            "Nothing further: neither finding meets the criteria for treatment",
            "A second short stent at the distal edge, then more post-dilatation",
            "Post-dilate the whole stent again with a balloon 0.5 mm larger",
            "Repeat OCT in high-resolution mode before deciding on treatment",
          ],
          answer: 0,
          explanation:
            "Brilakis calls malapposition extensive at a maximum distance of 400 µm or more, or a length of 1 mm or more; 300 µm over 0.6 mm meets neither. A small, non-flow-limiting edge dissection does not need treatment; Brilakis reserves an extra stent for larger ones (over 60° of arc and/or over 3 mm), especially distally. An oversized balloon chases a finding that does not need treating and can itself cause an edge dissection.",
        },
        { kind: "h", text: "The left main" },
        {
          kind: "p",
          text: "In the left main, Brilakis calls IVUS or OCT mandatory for judging the final result, imaged from both branches (LAD and circumflex). To lower the risk of restenosis, each segment of the bifurcation should reach a minimum IVUS lumen area:",
        },
        {
          kind: "table",
          caption: "Left main segment targets after stenting (Brilakis figure 17.3, from Korean IVUS data)",
          head: ["Segment", "Minimum lumen area"],
          rows: [
            ["Circumflex ostium", "5 mm²"],
            ["LAD ostium", "6 mm²"],
            ["Polygon of confluence", "7 mm²"],
            ["Left main above the polygon of confluence", "8 mm²"],
          ],
        },
        {
          kind: "p",
          text: "After provisional stenting from the left main into the LAD, a jailed circumflex ostium that looks narrowed is assessed with imaging and physiology before you decide on a second stent; Brilakis defers circumflex stenting if the FFR is above 0.80 or the resting index is above its cut-off (cp-left-main). Oxford agrees on IVUS after left main PCI, to confirm full deployment and expansion, and points out that visual estimation may underestimate the reference and undersize the stent there. In bifurcation PCI Brilakis adds that imaging can show the cause of a complication, such as a wire that has passed under the stent struts (cp-bifurcation-provisional, cp-left-main).",
        },
        { kind: "tip", id: "pci-img-lm-both-branches" },
        { kind: "h", text: "Special situations" },
        {
          kind: "table",
          caption: "Where imaging after the stent matters most",
          head: ["Situation", "What imaging is for"],
          rows: [
            ["Aorto-ostial stent", "Angiography often misses an uncovered ostium because the balloon shoulder dilates it; image, preferably with IVUS, for ostial coverage and expansion"],
            ["Stenting an ostial dissection caused by the catheter", "Confirm the stent covers the ostial dissection completely"],
            ["Branch ostial stent", "Expansion, ostial coverage and how far the side-branch stent protrudes into the main vessel"],
            ["Heavy calcium", "Adequate expansion and large edge dissections"],
            ["CTO", "Long stents and a negatively remodelled distal vessel make expansion and apposition especially important"],
            ["Acute coronary syndrome", "Expansion, apposition, geographic miss, residual thrombus, dissection (lesson 6)"],
            ["In-stent restenosis or stent thrombosis", "The mechanism: neointima, neoatherosclerosis, underexpansion, malapposition (Oxford) or fracture; then sizing and expansion of any new stent; a gap between stents is closed with imaging and stent-enhancement modes"],
          ],
        },
        {
          kind: "p",
          text: "Oxford adds that IVUS-guided stent deployment has been shown to reduce restenosis, that IVUS in restenosis shows how well the original stent was expanded and whether any new stent is well apposed, and that imaging to prevent malapposition may help prevent stent thrombosis. Stent failure itself is taught in cp-other-complex.",
        },
        { kind: "tip", id: "pci-img-ostial-coverage" },
        {
          kind: "pitfalls",
          items: [
            "Accepting an angiographically ‘perfect’ stent in the left main, an ostium or heavy calcium without imaging.",
            "Grading apposition before expansion; expansion heads Brilakis's list of the four post-stent checks, so look at it first.",
            "Correcting malapposition with a high-pressure oversized balloon instead of a semi-compliant balloon at low pressure.",
            "Adding a stent for every small edge flap, or ignoring a long one at the distal edge.",
            "Imaging the left main from the LAD only.",
            "Post-dilating smooth tissue protrusion when the lumen is already adequate, or ignoring irregular protrusion that narrows the lumen.",
          ],
        },
        {
          kind: "pearl",
          text: "Write three numbers on the board before the post-stent run: the proximal and distal reference lumen areas and 80% of their average. Then the run answers one question immediately (is the stent expanded?) and you only move on to apposition and edges once that answer is yes.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the focal mid-LAD scenario, after deploying the stent, decide whether you would post-dilate before imaging, then state the OCT and IVUS expansion targets you would apply and the treatment for each possible failure (underexpansion, extensive malapposition, large distal edge dissection).",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Image a deployed stent, calculate 80% of the average reference lumen area, compare it with the MSA, post-dilate with a non-compliant balloon of at least the stent diameter above 18 atm if needed, then re-image and grade any malapposition and edge dissection against the criteria.",
        },
        { kind: "video", id: "TsqRwqZju4s", note: "A Manual of PCI case on treating underexpanded stents." },
        { kind: "video", id: "so9MltihMSs", note: "Elias Hanna on IVUS and OCT guidance before and after stenting." },
        {
          kind: "keypoints",
          items: [
            "Order: expansion, malapposition, protrusion, edges; then geographic miss (and intramural haematoma on IVUS).",
            "OCT MSA over 4.5 mm² or over 80% of the mean reference lumen area; IVUS at least 5.5 mm²; left main 8.0 mm².",
            "Underexpansion: non-compliant balloon at least the stent diameter, above 18 atm, then re-image.",
            "Extensive malapposition (Brilakis: 400 µm or more, or 1 mm or longer): semi-compliant balloon at low pressure.",
            "Tissue protrusion: post-dilate if the effective lumen is inadequate; irregular protrusion has been linked to events, smooth protrusion has not.",
            "Edge dissection: leave small, non-flow-limiting ones; stent those over 60° and/or over 3 mm, especially distally.",
            "Left main: image both branches; 5, 6, 7 and 8 mm² for the circumflex ostium, LAD ostium, polygon of confluence and left main.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-acs",
      title: "Imaging the ACS culprit: rupture, erosion, nodule and thrombus",
      minutes: 13,
      topics: ["img-acs-culprit"],
      sources: [
        { book: "brilakis-pci", loc: "20.7" },
        { book: "brilakis-pci", loc: "20.8" },
        { book: "brilakis-pci", loc: "20.10" },
        { book: "brilakis-pci", loc: "20.13" },
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "brilakis-pci", loc: "22.1" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
      ],
      refs: [...BOOKS, "jia-oct-erosion-2013", "tearney-oct-standards-2012", "esc-acs-2023", "licordari-esc-acs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Most acute coronary syndromes have an obvious culprit: an occlusion full of thrombus. Some do not. The patient has a troponin rise and two or three moderate lesions, or none that looks guilty. Brilakis calls OCT the gold standard for finding the culprit: he prefers it to IVUS because of its higher resolution, and calls it the best modality for detecting thrombus. Choosing what to treat in ACS is taught in pm-target; this lesson is about what the images show.",
        },
        { kind: "h", text: "When the angiogram shows no clear culprit" },
        {
          kind: "steps",
          items: [
            { title: "1. Look again", detail: "Review the angiogram carefully: contrast staining or thrombus can be very subtle. Brilakis's clues are the ECG, slow flow, haziness suggesting thrombus, collaterals and distal branch occlusion suggesting embolism." },
            { title: "2. Look at the ventricle", detail: "A left ventriculogram or an echocardiogram in the lab can show the hypokinetic territory, or an alternative diagnosis such as takotsubo cardiomyopathy." },
            { title: "3. Image the candidates with OCT", detail: "OCT can show whether a culprit is present, or confirm that there is none." },
            { title: "4. If still unclear, MRI later", detail: "Cardiac magnetic resonance can show the injured myocardium and so point to the vessel." },
          ],
        },
        { kind: "tip", id: "pci-oct-unclear-culprit" },
        {
          kind: "p",
          text: "**Current guidance:** the 2023 ESC ACS guideline, which postdates both manuals, gives intravascular imaging, preferably OCT, a class IIb recommendation for clarifying an ambiguous culprit lesion, and recommends cardiac MRI (class I) when a diagnosis of MINOCA is still uncertain after angiography, as summarised in a published appraisal of the guideline (pm-target).",
        },
        {
          kind: "p",
          text: "Do not use physiology to decide about a suspected culprit: the injured microcirculation makes the measurements unreliable (Brilakis 12.1 and 20.12). Physiology is fine for non-culprit lesions, whose measurements do not change much over time.",
        },
        { kind: "h", text: "What a culprit looks like" },
        {
          kind: "p",
          text: "Brilakis names ulceration and thrombus as the hallmarks of a culprit, notes that some culprits show only erosion, and lists ulceration, erosion, thrombus and calcified nodules as the findings that help locate it. The OCT definitions below come from the study that first set out OCT criteria for erosion and calcified nodule (Jia, 2013).",
        },
        {
          kind: "table",
          caption: "The three culprit mechanisms on OCT (Jia 2013; Brilakis 13.1 and 20.13)",
          head: ["Mechanism", "OCT criteria", "Typical setting in Jia's series of 126 ACS patients"],
          rows: [
            ["Plaque rupture", "Discontinuity of the fibrous cap with a clear cavity inside the plaque", "43.7% of culprits; always over lipid plaque; red thrombus most often seen here; STEMI more common than with the other two"],
            ["Erosion (definite)", "Thrombus attached to a plaque whose surface is intact and visible", "31.0% (definite and probable together); younger patients, more often NSTE-ACS, less severe stenosis, thicker caps, fibrous plaque in just over half, white thrombus predominant"],
            ["Erosion (probable)", "An irregular luminal surface without thrombus, or thrombus attenuating the plaque with no superficial lipid or calcium just proximal or distal to it", "As above"],
            ["Calcified nodule", "Fibrous cap disruption over calcified plaque, with protruding calcium, superficial calcium and substantial calcium either side", "7.9%; older patients, more hypertension and chronic kidney disease, white thrombus predominant"],
          ],
        },
        {
          kind: "p",
          text: "In Jia's definitions, thrombus is a mass of more than 250 µm attached to the surface or floating in the lumen; red thrombus attenuates the light strongly and shadows the wall behind it, white thrombus does not (lesson 3). Oxford adds the features of high-risk plaque: a fibrous cap thinner than 65 µm, a lipid core with posterior attenuation, a lipid arc wider than 90°, and macrophage infiltration.",
        },
        {
          kind: "check",
          stem: "OCT of a suspected NSTEMI culprit shows white thrombus attached to a fibrous plaque whose surface is intact; there is no cavity. How is this classified?",
          options: ["Definite erosion", "Plaque rupture", "Calcified nodule", "Probable erosion"],
          answer: 0,
          explanation:
            "Thrombus attached to an intact, visualised plaque meets the OCT criteria for definite erosion. Rupture needs a cap discontinuity with a cavity; a calcified nodule needs disrupted cap over protruding calcium; probable erosion is the label when there is no thrombus but the surface is irregular, or when thrombus hides the plaque without lipid or calcium nearby.",
        },
        {
          kind: "p",
          text: "Does the mechanism change treatment? Jia's group suggested that because erosion leaves less thrombus and a larger lumen, some patients might be stabilised with antithrombotic therapy alone, without a stent, but stated that more evidence was needed. The manuals do not recommend withholding stents on the basis of an OCT diagnosis of erosion, and neither does this lesson; treat it as an open question (see the Hanna video below). Brilakis does describe a different situation in which the stent is sometimes left out: when thrombus aspiration alone gives an excellent angiographic result, especially in a small culprit vessel. In the small STEMI series he cites (28 patients with TIMI 3 flow restored, only limited residual thrombus, no significant residual stenosis and no significant distal embolisation), the vessel was still open at repeat angiography a few days later. That decision rests on the angiogram after aspiration, not on an OCT finding of erosion.",
        },
        { kind: "h", text: "Imaging during PCI for ACS" },
        {
          kind: "list",
          items: [
            "**Wrong vessel or more than one culprit.** If wiring keeps failing, the occlusion may be chronic rather than acute, or there may be two culprits. Thrombus or ulceration in a lesion on imaging, especially OCT, strongly suggests it is a culprit.",
            "**Is the wire in the lumen?** After crossing an occlusion, IVUS can often confirm that the wire is intraluminal, without the risk of injecting contrast through a microcatheter that might sit in a dissection plane.",
            "**Thrombus distorts sizing.** Thrombus can lead to an undersized, malapposed stent (Brilakis 20.10), so choose reference frames away from it, and image after stenting to check expansion, apposition and residual thrombus (20.13).",
            "**Embolic risk.** Large lipid core plaque and large thrombus raise the risk of distal embolisation; lipid-rich plaque is among the causes of plaque embolisation (cm-flow-embolism).",
            "**After stenting.** Imaging optimises expansion and apposition, looks for geographic miss, and shows residual thrombus or dissection.",
          ],
        },
        { kind: "tip", id: "pci-img-thrombus-sizing" },
        { kind: "tip", id: "pci-img-ivus-wire-position" },
        { kind: "h", text: "When imaging can harm: spontaneous dissection" },
        {
          kind: "p",
          text: "OCT can confirm spontaneous coronary artery dissection (SCAD), but there is concern that wiring and contrast injection may extend the dissection flap hydraulically and close the vessel. Brilakis therefore advises using imaging cautiously in SCAD, and his modality table notes that OCT may extend a dissection because of the contrast injection. For a dissected left main, Oxford prefers IVUS to OCT for confirming the wire position, because IVUS needs no contrast injection that might enlarge the false lumen. SCAD management is taught in cp-other-complex.",
        },
        { kind: "tip", id: "pci-img-scad-caution" },
        {
          kind: "check",
          stem: "A 41-year-old woman, three weeks post-partum, has an NSTEMI. The mid-LAD shows a long, smooth narrowing. A colleague suggests an OCT run to ‘make sure’. What do the manuals advise?",
          options: [
            "OCT at once with a powerful injection; it is the gold standard for any ACS",
            "Physiology first; an FFR above 0.80 would exclude a dissection",
            "Be cautious: wiring and the contrast flush can extend a dissection",
            "OCT is safe if the injection is reduced to 1 mL/s for 3 seconds",
          ],
          answer: 2,
          explanation:
            "This presentation suggests SCAD. Brilakis notes that OCT can diagnose SCAD, but wiring and contrast injection may extend the flap hydraulically and close the vessel, so imaging is used cautiously, if at all; for wire position in a dissected left main Oxford prefers IVUS because it needs no contrast. Physiology is not used to judge a suspected culprit, and a weaker injection simply gives a non-diagnostic run.",
        },
        {
          kind: "pitfalls",
          items: [
            "Measuring FFR in a suspected culprit to decide whether it caused the event.",
            "Calling the most severe lesion the culprit when another, milder lesion holds the thrombus.",
            "Sizing the stent from frames full of thrombus.",
            "Forceful OCT runs in a suspected spontaneous dissection.",
            "Treating erosion differently from rupture outside a trial on the strength of the image alone.",
          ],
        },
        {
          kind: "pearl",
          text: "When the angiogram offers two or three candidates, image them all with OCT before you treat any of them. A ruptured cap or attached thrombus in one, and fibrous intact plaque in the others, turns a guess into a decision, and the bystanders can be assessed later with physiology.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Review the bench's ACS culprit pullback: name the mechanism using the OCT criteria (cap discontinuity with cavity, attached thrombus over an intact surface, or disrupted cap over protruding calcium), classify the thrombus as red or white by its attenuation, and choose reference frames free of thrombus for sizing.",
        },
        { kind: "video", id: "VRqERXKp-rU", note: "A Manual of PCI case using MRI and OCT to find an NSTEMI culprit." },
        { kind: "video", id: "mYP2z4159Fk", note: "Elias Hanna on the types of plaque disruption by OCT and the value of OCT in MINOCA." },
        { kind: "video", id: "wcLcxt3ojUU", note: "A Manual of PCI case using IVUS to identify the culprit vessel in NSTEMI." },
        { kind: "video", id: "xSXwJGTdXA4", note: "Elias Hanna on MI with plaque disruption on IVUS or OCT but a stenosis under 50%: whether to stent." },
        {
          kind: "keypoints",
          items: [
            "No clear culprit: review the angiogram, look at the ventricle, image the candidates with OCT, and use MRI if doubt remains.",
            "OCT is the gold standard for the culprit; hallmarks are ulceration and thrombus, sometimes only erosion.",
            "Rupture: cap discontinuity with a cavity. Definite erosion: thrombus on an intact surface. Calcified nodule: disrupted cap over protruding calcium.",
            "Red thrombus shadows the wall; white thrombus does not.",
            "No physiology on a suspected culprit; physiology is fine for non-culprits.",
            "Thrombus can cause undersizing and malapposition: take references away from it and re-image.",
            "Suspected SCAD: imaging with caution; contrast can extend the dissection.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-imaging-coreg-ct",
      title: "Co-registration and coronary CT angiography for planning",
      minutes: 12,
      topics: ["img-coregistration", "pi-ct-planning"],
      sources: [
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "brilakis-pci", loc: "30" },
        { book: "brilakis-pci", loc: "21.1" },
        { book: "brilakis-pci", loc: "21.6" },
        { book: "brilakis-pci", loc: "21.8" },
        { book: "brilakis-pci", loc: "21.5" },
        { book: "brilakis-pci", loc: "21.13" },
        { book: "oxford-cath", loc: "ch 1: Cardiac CT or invasive angiography?" },
      ],
      refs: [...BOOKS, "opolski-ct-rector-2015"],
      blocks: [
        {
          kind: "p",
          text: "Images are most useful when you know exactly where on the angiogram each one was taken. **Co-registration** links the two: each imaging frame, or each point of a pressure-wire pullback, is shown at its position on the angiogram. **Coronary CT angiography (CCTA)** works the other way round: a three-dimensional picture of the artery made before the procedure, which can be read for planning and can also be co-registered with the live fluoroscopy in real time.",
        },
        { kind: "h", text: "What co-registration is used for" },
        {
          kind: "list",
          items: [
            "**Placing the stent.** Brilakis lists angiographic co-registration with imaging or physiology systems as an aid to optimal stent positioning, alongside fixed landmarks such as clips and old stents.",
            "**Choosing landing zones.** OCT co-registration helps position stents accurately in several anatomical subsets, including bifurcations; the landing zones you chose on the pullback (lesson 4) appear as marks on the angiogram.",
            "**Lengths from a solid-state IVUS catheter.** Without co-registration it cannot measure length.",
            "**Showing what happened.** Imaging before and after lithotripsy, co-registered to the lens position on the angiogram, shows where calcium fractured and where the lumen gained.",
            "**Physiology.** Newer systems map a pressure-wire pullback onto the angiogram, showing where along the vessel the pressure drops (pm-physiology).",
            "**CTO crossing.** Real-time co-registration of a pre-procedure CCTA with fluoroscopy is one way of resolving an ambiguous proximal cap.",
          ],
        },
        {
          kind: "check",
          stem: "You have chosen distal and proximal landing zones on an IVUS pullback taken with a phased-array catheter by hand. The console offers no length. Why, and what would have given you one?",
          options: [
            "Phased-array catheters can never measure any length, so only a rotational catheter could ever give one",
            "A hand pullback with a solid-state catheter: length needs a motorised pullback and co-registration",
            "Length requires OCT, because IVUS measures only the areas and diameters at each frame",
            "The console needs the planned stent diameter entered first, and only then calculates a length",
          ],
          answer: 1,
          explanation:
            "Brilakis requires a motorised pullback for any length, and a solid-state catheter also needs co-registration with the angiogram before it can give one; this run failed on both counts. A rotational catheter with a motorised pullback gives the most accurate lengths, but a phased-array catheter can give one when both conditions are met. IVUS measures length well when it is acquired correctly, so OCT is not required.",
        },
        { kind: "tip", id: "pci-img-coreg-landing" },
        { kind: "h", text: "Coronary CT angiography for planning" },
        {
          kind: "p",
          text: "The Oxford handbook lists, among the main indications for cardiac CT, clarifying the anatomy of a chronic total occlusion before revascularisation: the coronary anatomy, the proximal cap and the distal landing zone. Brilakis adds the course of the occluded segment (21.6 and 21.8) and agrees that CCTA can be useful for evaluating the occluded segment and planning PCI. CTO PCI is normally planned rather than done ad hoc, which leaves time for a scan.",
        },
        {
          kind: "steps",
          title: "Reading a CCTA before a CTO, item by item",
          items: [
            {
              title: "1. Proximal cap",
              detail: "Where exactly the occlusion starts and what its stump looks like. An ambiguous cap is dangerous to probe blindly (perforation). The tools to resolve it are extra angiographic projections, a selective injection through a microcatheter near the cap, IVUS, preprocedural CCTA or real-time CCTA co-registration, and ‘move the cap’ dissection techniques. If it stays ambiguous, a primary retrograde approach or a move-the-cap technique is often recommended (cp-cto-strategy).",
            },
            {
              title: "2. Course",
              detail: "Where the vessel runs through the occlusion, and how tortuous or bent it is. If the course is unclear or very tortuous, a knuckled wire or the retrograde approach is often preferred. CCTA, like IVUS, can show the course before an antegrade attempt on an ambiguous cap.",
            },
            {
              title: "3. Calcium",
              detail: "Severe calcium in the occluded segment makes crossing harder and subintimal (extraplaque) wire entry more likely.",
            },
            {
              title: "4. Length and distal cap",
              detail: "Antegrade-only injections tend to overestimate occlusion length because the distal vessel underfills; dual injection or CCTA gives a more accurate cap position, length and distal cap anatomy.",
            },
            {
              title: "5. Working projections",
              detail: "CCTA can show the fluoroscopic angles with the least foreshortening of the occluded segment, to use while crossing.",
            },
            {
              title: "6. Difficulty score",
              detail: "CCTA-based scores grade the difficulty, for example the CT-RECTOR score and the Korean multicentre CTO CT registry score.",
            },
          ],
        },
        {
          kind: "table",
          caption: "The CT-RECTOR score (Opolski 2015): one point for each predictor of slower wire crossing",
          head: ["Predictor on CCTA or history", "Points"],
          rows: [
            ["Multiple occlusions", "1"],
            ["Blunt stump", "1"],
            ["Severe calcification", "1"],
            ["Bending of the occluded segment", "1"],
            ["Occlusion present for 12 months or more", "1"],
            ["Previously failed PCI", "1"],
            ["Grades: 0 easy, 1 intermediate, 2 difficult, 3 or more very difficult", "Wire crossing within 30 minutes in 95%, 88%, 57% and 22%"],
          ],
        },
        {
          kind: "p",
          text: "In the derivation registry (240 CTO lesions in four centres) the CT-RECTOR score discriminated better than the angiographic J-CTO score (area under the curve 0.83 against 0.71). One caution before you score a lesion yourself: the published abstract does not say how much bending counts, and the angle that defines it is given only in the full paper, which has not been checked for this lesson, so no threshold is quoted here.",
        },
        {
          kind: "check",
          stem: "CCTA of an RCA occlusion shows a blunt stump and severe calcification in the occluded segment; one previous attempt failed. There is a single occlusion, no bending, and the occlusion dates back about 8 months. What is the CT-RECTOR score and grade?",
          options: [
            "3: very difficult, with wire crossing in 30 minutes in about 22%",
            "2: difficult, with wire crossing in 30 minutes in about 57%",
            "4: very difficult; the failed attempt scores two points",
            "1: intermediate, because calcification does not form part of the score",
          ],
          answer: 0,
          explanation:
            "Blunt stump, severe calcification and previously failed PCI score one point each: 3, the very difficult group, in which wire crossing within 30 minutes occurred in 22% in the derivation study. Duration scores only at 12 months or more, and every predictor, including the failed attempt, scores one point.",
        },
        { kind: "tip", id: "pci-img-ct-cap" },
        { kind: "h", text: "IVUS during CTO crossing" },
        {
          kind: "p",
          text: "Imaging matters in CTO PCI for crossing as well as for the stent (Brilakis 21.13). The crossing strategies themselves are taught in cp-cto-strategy; what IVUS contributes is this:",
        },
        {
          kind: "list",
          items: [
            "**Locating an ambiguous proximal cap**, alongside the other tools listed above.",
            "**Re-entry into the true lumen.** When the wire has crossed outside the true lumen, IVUS helps a second wire re-enter (the parallel-wire technique) and confirms when it has, in antegrade and retrograde work alike.",
            "**Reverse CART.** IVUS helps choose the size of the antegrade balloon, and in a reverse CART that is failing it can show why, which improves the chance of success.",
            "**Guide size.** IVUS-guided antegrade re-entry needs 8 Fr guides and an operator practised in reading IVUS, and the subintimal IVUS catheter can restrict how freely the wire moves. Brilakis favours 7 or 8 Fr guides for CTO PCI, chiefly for support, and warns that a 6 Fr guide may rule out IVUS-guided cap penetration and limit how complications can be managed.",
          ],
        },
        { kind: "h", text: "When CT is less useful" },
        {
          kind: "p",
          text: "Oxford lists the factors that degrade CT accuracy: the scanner (64-detector rows is the minimum standard), the pretest probability of disease, a high coronary calcium score, a fast heart rate and a high body mass index. It advises against cardiac CT, as a rule, when the pretest probability is high, when the calcium score is very high (over 1000), in large body habitus, and after previous stenting, where accuracy for in-stent restenosis falls in stents under 3 mm and in thick-strut first-generation stents. CT-derived FFR is taught in pm-physiology, and the choice between CT and invasive angiography in hb-lab-and-radiation.",
        },
        {
          kind: "pitfalls",
          items: [
            "Attacking an ambiguous proximal cap without resolving it first.",
            "Trusting an antegrade-only angiogram for the occlusion length.",
            "Choosing working views by habit when the CCTA can show the least foreshortened angles.",
            "Quoting a length from a hand pullback, or from a solid-state pullback without co-registration.",
            "Expecting CT to judge in-stent restenosis in a small, thick-strut stent.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat the CCTA of a CTO as the first ‘run’ of the case. If you have already decided where the cap is, which way the vessel bends, how much calcium lies in the path, how long the occlusion is and which projection opens it out, the angiographic time on the table goes to crossing, not to working out the anatomy.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the mid-RCA CTO scenario, before any wiring, describe the four CTO features (proximal cap, course and calcium, distal vessel, collaterals), say which would be clarified by a preprocedural CCTA, and score the lesion with CT-RECTOR from the features you can infer.",
        },
        { kind: "video", id: "78bi9BATCLQ", note: "A CTO case using CT co-registration to clarify ambiguity." },
        { kind: "video", id: "u1Ysqluo_ZU", note: "A CTO case on the benefits of coronary CT angiography." },
        { kind: "video", id: "r_sMoTLkbqM", note: "A CTO case in which CT came to the rescue." },
        {
          kind: "keypoints",
          items: [
            "Co-registration marks each imaging frame or pressure value on the angiogram: for stent positioning, landing zones, bifurcations and physiology maps.",
            "A solid-state IVUS catheter gives lengths only with co-registration; all lengths need an automated pullback.",
            "CCTA before a CTO: cap, course, calcium, length and distal cap, working projections, and a difficulty score.",
            "Ambiguous cap: projections, microcatheter injection, IVUS, CCTA or real-time CCTA co-registration, or move-the-cap; otherwise retrograde.",
            "CT-RECTOR: multiple occlusions, blunt stump, severe calcification, bending, duration of 12 months or more, failed PCI; 3 or more is very difficult.",
            "IVUS in CTO crossing: cap location, true-lumen re-entry, reverse-CART balloon sizing and failure analysis; IVUS-guided re-entry needs 8 Fr guides.",
            "CT is less accurate with heavy calcium, fast heart rates, high body mass index and small or thick-strut stents.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-imaging-q1",
      stem: "Which situation is NOT on Brilakis's list of settings where intravascular imaging appears most beneficial?",
      options: [
        "In-stent restenosis of a target lesion that was stented two years ago",
        "A complex bifurcation lesion that needs a two-stent strategy",
        "A focal, non-calcified mid-RCA lesion in a patient with stable angina",
        "A patient whose contrast dose must be kept to a minimum",
      ],
      answer: 2,
      explanation:
        "Brilakis lists the left main, long lesions, CTO, stent failure, severe calcium, complex bifurcations, ACS lesions and contrast minimisation with IVUS. A focal, non-calcified lesion in a stable patient is not on the list, although some operators image every lesion. A previously treated target lesion also strongly favours imaging in his planning checklist.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-imaging-q2",
      stem: "Through a 6 Fr guide in the left main, an OCT run fails: the lumen never clears and the pullback does not trigger. Which change is consistent with Brilakis's troubleshooting?",
      options: [
        "Change to survey mode, which needs less contrast to clear the lumen",
        "Leave the buddy wire in place to steady the catheter during the run",
        "Release the catheter during the injection so it can travel with the flush",
        "Re-seat the guide coaxially, then inject at 4 mL/s or more for the run",
      ],
      answer: 3,
      explanation:
        "For a pullback that will not start, Brilakis's remedies are good (coaxial) engagement or a guide extension, a powerful injection (at least 4 mL/s for the left main, 3 mL/s for the RCA), redilating a still-tight lesion, a manual trigger, or a faster or longer injection. Buddy wires cause artefacts and should be removed, and the catheter and wire must be held during injection to stop distal migration. Survey mode shortens the run (2.1 s against 3.0 s) but does not change the injection rate needed to clear the lumen; the trigger failed because the flush is not reaching the artery.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-imaging-q3",
      stem: "Why does Brilakis recommend a phased-array rather than a rotational IVUS catheter for work at the cap of a chronic total occlusion?",
      options: [
        "It has the higher resolution of the two types",
        "It has the lower crossing profile of the two",
        "It needs flushing, which clears the false lumen",
        "Its image is taken closer to the catheter tip",
      ],
      answer: 3,
      explanation:
        "Table 13.4: the phased-array catheter is preferred for CTO crossing because imaging occurs closer to the tip. Rotational catheters have the higher resolution and lower profile, and it is the rotational catheter that needs flushing before use.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-imaging-q4",
      stem: "Pre-PCI OCT of a calcified LAD lesion shows calcium with a maximum arc of 320°, a maximum thickness of 1.1 mm and a length of 11 mm, lying at the luminal surface. What does Brilakis's teaching support?",
      options: [
        "Score 3; a 1:1 compliant balloon at nominal pressure, then stent it directly",
        "Score 4; plan atherectomy or lithotripsy before stenting this lesion",
        "Score 4; stent directly, then post-dilate above 18 atm to crack the calcium",
        "Score 2; superficial calcium usually yields to a standard balloon alone",
      ],
      answer: 1,
      explanation:
        "Arc over 180° (2), thickness over 0.5 mm (1) and length over 5 mm (1) give 4, the score that predicted poor stent expansion in Fujino's validation cohort (mean 78% against 96% for scores 0 to 3), favouring plaque modification. Superficial calcium is more likely to need an ablative technique; it is deep calcium that may respond to a balloon. Stenting first and fixing it afterwards leaves an underexpanded stent that is much harder to treat.",
      difficulty: 2,
      refs: [...BOOKS, "fujino-calcium-2018"],
    },
    {
      id: "pm-imaging-q5",
      stem: "IVUS of a distal LAD reference: mean lumen diameter 2.8 mm, EEM diameter 3.2 mm, both clearly seen. The proximal reference lumen is 3.5 mm. Which stent diameter fits Brilakis's chapter 13 rules (lumen rounded up by 0.25 mm, EEM rounded down by 0.25 mm)?",
      options: [
        "3.5 mm, matching the proximal reference so that the edge is apposed",
        "3.0 mm by either rule, then post-dilate proximally to about 3.5 mm",
        "2.5 mm, rounding the distal lumen diameter down by 0.25 mm",
        "3.25 mm, taking the distal EEM diameter to its nearest stent size",
      ],
      answer: 1,
      explanation:
        "Lumen-based sizing rounds up: 2.8 + 0.25 = 3.05 mm, a 3.0 mm stent. EEM-based sizing rounds down: 3.2 − 0.25 = 2.95 mm, again 3.0 mm. Reading the rule instead as a move to the next stent size (up from the lumen, down from the EEM) also gives 3.0 mm from both. The proximal reference is not used for the stent (distal dissection in a tapering vessel); it sets the shorter post-dilatation balloon. Rounding the lumen down undersizes, and taking the EEM to its nearest size (3.25 mm) skips the downward step that EEM-based sizing needs, so it oversizes.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-imaging-q6",
      stem: "After LAD stenting, OCT shows an MSA of 5.6 mm² (average reference lumen area 6.5 mm²), struts 450 µm off the wall over 2 mm at the proximal end, and no edge dissection. What is the best next step?",
      options: [
        "Post-dilate the whole stent with a non-compliant balloon above 18 atm",
        "Implant a second, shorter stent overlapping the proximal edge of the first",
        "Low-pressure semi-compliant post-dilatation of the proximal stent segment",
        "Accept the result, since malapposition has not been linked to stent failure",
      ],
      answer: 2,
      explanation:
        "Expansion is adequate (5.6 mm² is over 4.5 mm² and 86% of the reference). The malapposition is extensive (400 µm or more, and 1 mm or longer), which Brilakis corrects by post-dilatation, usually with a semi-compliant balloon at low pressure. Only acute malapposition of smaller degree (from 200 µm) has not been linked to failure. High-pressure non-compliant inflation is the treatment for underexpansion.",
      difficulty: 3,
      refs: [...BOOKS, "eapci-imaging-2018"],
    },
    {
      id: "pm-imaging-q7",
      stem: "After provisional left main to LAD stenting, IVUS from the LAD shows 9.0 mm² in the left main above the carina, 7.5 mm² at the polygon of confluence and 6.4 mm² at the LAD ostium; IVUS from the circumflex shows 4.3 mm² at its ostium. Which segment falls short of Brilakis's targets?",
      options: [
        "The LAD ostium, which should reach 7 mm²",
        "The polygon of confluence, which should reach 8 mm²",
        "The circumflex ostium, which should reach 5 mm²",
        "None of them; every segment meets its target",
      ],
      answer: 2,
      explanation:
        "The targets are 5 mm² at the circumflex ostium, 6 mm² at the LAD ostium, 7 mm² at the polygon of confluence and 8 mm² in the left main above it. Only the circumflex ostium (4.3 mm²) falls short, which is also why the left main must be imaged from both branches. The distractors shift each target up by one step.",
      difficulty: 3,
      refs: [...BOOKS, "kang-lm-ivus-2011"],
    },
    {
      id: "pm-imaging-q8",
      stem: "In an NSTEMI with two intermediate lesions and no obvious culprit, OCT of one lesion shows a fibrous cap discontinuity with a cavity inside lipid plaque and red thrombus. What does this show?",
      options: [
        "Definite erosion, because there is thrombus lying over the plaque surface",
        "A calcified nodule, because the cavity shadows the wall behind",
        "An artefact of poor clearance, so repeat the run before deciding",
        "Plaque rupture with thrombus, which marks this lesion as the culprit",
      ],
      answer: 3,
      explanation:
        "A cap discontinuity with a clear cavity in the plaque is the OCT definition of rupture, and rupture with thrombus marks the culprit. Erosion requires an intact plaque surface. A calcified nodule is disrupted cap over protruding calcium. Poor clearance attenuates the whole image; it does not create a cavity with a cap edge.",
      difficulty: 2,
      refs: [...BOOKS, "jia-oct-erosion-2013"],
    },
    {
      id: "pm-imaging-q9",
      stem: "Which statement about the evidence for imaging-guided PCI is correct?",
      options: [
        "IVUS-XPL found lower mortality with IVUS guidance in long lesions at one year",
        "The 2024 meta-analysis found a clear benefit for IVUS guidance but not for OCT guidance",
        "ULTIMATE was restricted to left main lesions treated with two-stent techniques",
        "OCTIVUS found OCT non-inferior to IVUS, with similar rates of contrast nephropathy",
      ],
      answer: 3,
      explanation:
        "OCTIVUS (2,008 patients) showed OCT non-inferior to IVUS (2.5% against 3.1%) with contrast nephropathy in 1.4% and 1.5%. IVUS-XPL's benefit came mainly from less target lesion revascularisation; cardiac death did not differ significantly. The 2024 network meta-analysis found similar results for OCT and IVUS, and ULTIMATE enrolled all-comers.",
      difficulty: 3,
      refs: ["kang-octivus-2023", "hong-ivus-xpl-2015", "stone-imaging-nma-2024", "ultimate-2018"],
    },
    {
      id: "pm-imaging-q10",
      stem: "Before an antegrade attempt on an LAD occlusion whose proximal cap is ambiguous on the angiogram, which measure is NOT among those Brilakis lists to clarify the cap?",
      options: [
        "Probing the presumed cap with a stiff, tapered wire to see where it goes",
        "Preprocedural CCTA, or real-time co-registration of CCTA with fluoroscopy",
        "IVUS from a side branch near the cap to show where the occlusion begins",
        "A selective injection through a microcatheter placed close to the cap",
      ],
      answer: 0,
      explanation:
        "Brilakis's tools for an ambiguous cap are extra projections, a microcatheter injection near the cap, IVUS, preprocedural CCTA or real-time CCTA co-registration, and move-the-cap techniques; if the cap remains ambiguous, a retrograde or move-the-cap approach is recommended. Probing blindly with a penetrating wire is exactly what risks perforation.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-imaging-q11",
      stem: "A 5 Fr guide is in the RCA and you want an OCT run by hand injection. What does Brilakis say?",
      options: [
        "Hand injection through 5 Fr is fine as long as you choose the high-resolution mode",
        "OCT through a 5 Fr guide requires saline rather than contrast for the flush",
        "Use a power injector; a hand injection usually needs a guide of 6 Fr or more",
        "5 Fr is preferable, because the smaller lumen makes the flush more forceful",
      ],
      answer: 2,
      explanation:
        "Brilakis: clearing the blood by hand injection usually needs a guide of 6 Fr or more; through a 5 Fr guide a power injector is needed to fill the lumen adequately. The acquisition mode does not change the flush needed, and the flush is normally contrast (dextran has had limited study).",
      difficulty: 1,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Choose IVUS or OCT for the lesion and say why, acquire the pullback correctly (nitrate, position, purge or calibration, flush), score the calcium, mark landing zones with plaque burden below 50% and no lipid, size the stent from the distal reference (lumen +0.25 mm or EEM −0.25 mm), deploy, then optimise until the MSA exceeds 4.5 mm² on OCT (5.5 mm² on IVUS) or 80% of the mean reference lumen area, and grade malapposition and edges." },
    { sim: "pci-bench", task: "Read an ACS culprit pullback: classify rupture, erosion or calcified nodule by the OCT criteria, red or white thrombus by attenuation, and choose thrombus-free reference frames." },
  ],
  caseIds: ["pm-imaging-case-calcified-lad", "pm-imaging-case-nstemi-culprit"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-imaging-case-calcified-lad",
    title: "OCT-guided PCI of a long calcified LAD lesion",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 13.1-13.3, 10.2, 19.9, 19.10, 19.13 and 23.2; Oxford Handbook, chapter 8 (optical coherence tomography, IVUS or OCT?)",
    },
    summary: "Elective PCI of a long, calcified proximal-to-mid LAD lesion: choosing the modality, getting the catheter across and the flush right, scoring calcium, sizing, then optimising expansion and dealing with an edge dissection.",
    presentation:
      "A 68-year-old man has CCS class III angina despite two antianginal drugs and anterior ischaemia on stress perfusion imaging. Angiography shows a 30 mm, 85% proximal-to-mid LAD stenosis with calcium visible on both walls before contrast is injected. A 6 Fr EBU 3.5 guide is engaged from the right radial artery and a workhorse wire is in the distal LAD.",
    findings: ["Blood pressure 132/76 mmHg, sinus rhythm 64/min", "eGFR 74 mL/min/1.73 m²", "Heparin given; ACT in range", "Intracoronary nitroglycerin given"],
    steps: [
      {
        id: "s1",
        prompt: "Before preparing the lesion you want intravascular imaging. Which modality, and why?",
        options: [
          {
            text: "OCT: kidney function is good and you need the calcium thickness as well as its arc and length",
            best: true,
            feedback: "Brilakis notes that OCT can measure calcium depth whereas IVUS images are blocked by calcium and show only a shadow, and the OCT calcium score needs thickness. With normal kidney function the contrast flush is acceptable.",
          },
          {
            text: "IVUS: it sizes the vessel and shows the arc and length of the calcium",
            acceptable: true,
            feedback: "Reasonable, and either modality can guide preparation and sizing (table 13.2). But IVUS cannot see through calcium, so you lose the thickness, one of the three components of the score that predicts underexpansion. Your consultant asks for OCT instead, because the score needs the thickness; the case continues with OCT.",
          },
          {
            text: "No imaging: a 1:1 balloon will show whether the lesion expands",
            next: "c-noimage",
            feedback: "Severe calcium is on Brilakis's list of lesions where imaging helps most; angiography underestimates calcium, and a balloon that seems to expand can give a false impression of adequate preparation.",
            stateDelta: { stability: -5, flags: ["no-imaging"] },
          },
        ],
      },
      {
        id: "c-noimage",
        kind: "consequence",
        prompt: "A 3.0 mm non-compliant balloon looks fully expanded at 18 atm, and a 3.0 × 32 mm stent is deployed. The final angiogram looks good, but stent-enhanced fluoroscopy suggests a narrow segment in the mid-stent. What now?",
        options: [
          {
            text: "Image now: OCT or IVUS of the stent to measure its expansion",
            best: true,
            next: "c-noimage-oct",
            feedback: "Imaging after stenting in calcified lesions is recommended to check expansion and large edge dissections. Better late than never; the next step shows what an underexpanded stent in calcium means.",
          },
          {
            text: "Finish the case; the angiogram is acceptable",
            next: "c-noimage-oct",
            feedback: "Underexpansion raises the risk of restenosis and stent thrombosis, and the angiogram is exactly what misled you. Your consultant stops you and asks for imaging of the stent, as Brilakis recommends after stenting in calcium.",
            stateDelta: { stability: -15, flags: ["underexpanded"] },
          },
        ],
      },
      {
        id: "c-noimage-oct",
        kind: "consequence",
        prompt: "OCT of the new stent: a 300° arc of calcium lies behind the mid-stent, where the minimum stent area is 3.2 mm² against an average reference lumen area of 6.0 mm². The stent is underexpanded.",
        options: [
          {
            text: "High-pressure non-compliant inflations first; if the stent still will not expand, escalate along the undilatable-lesion pathway, re-imaging after each step",
            best: true,
            next: "s7",
            feedback: "Brilakis treats an underexpanded stent as a balloon-undilatable lesion (23.2; cp-uncrossable, cp-calcium): high-pressure non-compliant inflations, with or without buddy wires, then options such as laser, lithotripsy or a very high-pressure balloon. Atherectomy inside a fresh stent is reserved for when these fail, because of the risk of embolisation, burr entrapment and stent damage. Prevention, by imaging and full balloon expansion before stenting, is far easier.",
            stateDelta: { flags: ["stent-rescue"] },
          },
          {
            text: "Rotational atherectomy through the new stent straight away, to ablate the calcium behind it",
            next: "s7",
            feedback: "Atherectomy within a recently implanted stent carries a higher risk of complications, including embolisation of stent material, burr entrapment and stent damage; Brilakis keeps it for when high-pressure balloons, laser or other plaque modification have failed.",
            stateDelta: { stability: -10, flags: ["stent-rescue"] },
          },
          {
            text: "Accept it; an MSA of 3.2 mm² is acceptable in a calcified vessel of this size",
            next: "s7",
            feedback: "It is far below the OCT target (over 4.5 mm² or over 80% of the average reference lumen area, here 4.8 mm²), and underexpansion predisposes to restenosis and stent thrombosis. Your consultant asks you to treat it.",
            stateDelta: { stability: -10, flags: ["underexpanded", "stent-rescue"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The OCT catheter stops at the start of the lesion. As you push, the guide begins to back out.",
        options: [
          {
            text: "Withdraw it, predilate with a small balloon to let both the catheter and the flush through, then readvance",
            best: true,
            feedback: "Brilakis's prevention and treatment for an imaging catheter that will not cross: predilate severe or calcified lesions, which also allows contrast to penetrate for the run, and improve support. Forcing it risks kinking it and losing the guide.",
          },
          {
            text: "Push harder with the independent-hand technique",
            next: "c-kink",
            feedback: "Forceful advancement is the cause of OCT catheter kinking (13.3.2.4).",
            stateDelta: { stability: -5, flags: ["kinked-catheter"] },
          },
          {
            text: "Change to a phased-array IVUS catheter, which crosses tight lesions more easily",
            feedback: "The opposite is true: phased-array catheters are harder to deliver through severe lesions than rotational ones (table 13.4).",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "c-kink",
        kind: "consequence",
        prompt: "The catheter suddenly gives, the image fails, and on fluoroscopy the shaft has a sharp bend just inside the guide.",
        options: [
          {
            text: "Remove it; try to straighten it, and replace it with a new catheter if it still does not image; predilate before the next attempt",
            best: true,
            feedback: "Brilakis: replace the catheter if the malfunction persists after straightening it, and prevent a repeat by preparing a highly stenotic lesion and avoiding force.",
          },
          {
            text: "Keep imaging with the kinked catheter; the distal frames may still be usable",
            feedback: "A kinked catheter is one of the listed causes of failure to image; its frames are unreliable.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After a 2.0 mm balloon, the OCT catheter is in position with its middle marker well beyond the lesion; it has been purged with 100% contrast and calibrated. You inject by hand and the lumen never clears; contrast refluxes into the aorta and the pullback does not start.",
        options: [
          {
            text: "Re-seat the guide coaxially, confirm with a small test injection, then inject at about 4 mL/s for 4 seconds with an injector, holding the catheter and wire",
            best: true,
            feedback: "Reflux means the guide is not delivering the flush into the artery. Brilakis's typical left coronary setting is 4 mL/s for 4 seconds, with coaxial engagement checked first, and the catheter and wire held during the injection.",
          },
          {
            text: "Inject as hard as you can by hand without holding the catheter, to force the lumen clear",
            next: "c-migration",
            feedback: "A forceful injection with the catheter and wire not fixed can drive them distally.",
            stateDelta: { stability: -10, flags: ["distal-migration"] },
          },
          {
            text: "Repeat the same hand injection; failed triggers usually clear on the second attempt",
            feedback: "Nothing has changed, so the run will fail again and you will have given another bolus of contrast for nothing.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "c-migration",
        kind: "consequence",
        prompt: "During the injection the OCT catheter and the wire jump several centimetres distally into a small apical LAD branch. The patient feels a brief sharp pain.",
        options: [
          {
            text: "Pull the catheter back gently, then inject to look for damage or a perforation in the distal vessel, and treat it",
            best: true,
            feedback: "When the OCT catheter migrates distally, Brilakis's answer is to check the distal vessel for injury or perforation and to treat whatever is found (cm-perforation).",
          },
          {
            text: "Ignore it and run the pullback from the new position",
            feedback: "A wire and catheter driven into a small distal branch can perforate it; look first.",
            stateDelta: { stability: -15, flags: ["distal-injury"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The OCT run is clean. The calcium has a maximum arc of 280°, a maximum thickness of 0.9 mm and is 14 mm long, mostly at the luminal surface.",
        options: [
          {
            text: "Score 4: modify the calcium (atherectomy or lithotripsy, per cp-calcium) before stenting, and re-image",
            best: true,
            feedback: "All three components are present (2 + 1 + 1): the score of 4 that predicted poor stent expansion in Fujino's validation cohort (mean 78% against 96%). Superficial calcium is more likely to need an ablative technique. Re-imaging afterwards shows whether the calcium has fractured.",
            stateDelta: { flags: ["planned-prep"] },
          },
          {
            text: "High-pressure non-compliant balloon first, moving to atherectomy only if it fails to expand",
            acceptable: true,
            feedback: "‘Secondary’ atherectomy after balloon failure is one of Brilakis's two accepted approaches. With a score of 4 and superficial calcium, the imaging favours going straight to modification; a balloon can also give a false impression of adequate preparation.",
            stateDelta: { flags: ["planned-prep"] },
          },
          {
            text: "Stent now and post-dilate hard afterwards",
            next: "c-underexpanded",
            feedback: "Brilakis rules out stenting a heavily calcified lesion without preparation; an underexpanded stent is much harder to treat than an undilatable lesion.",
            stateDelta: { stability: -15, flags: ["underexpanded"] },
          },
        ],
      },
      {
        id: "c-underexpanded",
        kind: "consequence",
        prompt: "After deployment and a 3.0 mm non-compliant post-dilatation at 24 atm, OCT shows an MSA of 3.4 mm² in the most calcified part, with an elliptical stent.",
        options: [
          {
            text: "Treat it as an underexpanded stent in calcium, following the balloon-undilatable pathway (cp-uncrossable, cp-calcium), and re-image after each step",
            best: true,
            next: "s7",
            feedback: "This is the situation imaging before stenting was meant to prevent. Brilakis treats underexpanded stents with the undilatable-lesion algorithm (23.2): high-pressure non-compliant inflations first, then laser, lithotripsy or a very high-pressure balloon, with atherectomy inside the stent kept for when these fail; imaging guides each step.",
            stateDelta: { flags: ["stent-rescue"] },
          },
          {
            text: "Accept it; the angiogram looks reasonable",
            next: "s7",
            feedback: "An MSA of 3.4 mm² is well below the OCT target of 4.5 mm²; underexpansion raises the risk of restenosis and stent thrombosis. Your consultant asks you to treat it before the final run.",
            stateDelta: { stability: -10, flags: ["stent-rescue"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "After calcium modification, re-imaging shows several calcium fractures and a 3.0 mm non-compliant balloon expands fully. The distal reference has a mean lumen diameter of 2.8 mm and its EEM cannot be traced; the proximal reference lumen is 3.5 mm. The planned proximal landing zone is on a lipid-rich plaque with a thin cap; 4 mm further proximally the plaque burden is under 50% with no lipid.",
        options: [
          {
            text: "3.0 mm stent (lumen rounded up by 0.25 mm), long enough to land proximally beyond the lipid-rich plaque, then post-dilate the proximal part with a shorter 3.5 mm non-compliant balloon",
            best: true,
            feedback: "Lumen-based sizing rounds up by 0.25 mm; landing zones should avoid lipid-rich plaque and thin-cap fibroatheroma, where edges tend to dissect; the proximal segment is matched by post-dilatation.",
            stateDelta: { flags: ["sized-planned"] },
          },
          {
            text: "3.5 mm stent sized to the proximal reference",
            feedback: "Sizing to the proximal reference in a tapering vessel risks distal dissection or perforation.",
            stateDelta: { stability: -10, flags: ["oversized"] },
          },
          {
            text: "3.0 mm stent landing on the lipid-rich plaque, to keep the stent shorter",
            feedback: "Brilakis lists an edge implanted over lipid-rich plaque among the causes of edge dissection.",
            stateDelta: { stability: -5, flags: ["lipid-landing"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The stent is deployed at 14 atm and post-dilated proximally. Post-stent OCT: proximal reference lumen area 9.0 mm², distal 5.4 mm²; MSA 4.2 mm² in the mid-stent. Some struts are 250 µm from the wall over 0.5 mm.",
        variants: [
          { flag: "oversized", info: "There is also a dissection flap at the distal edge from the oversized stent." },
          { flag: "lipid-landing", info: "There is also a flap at the proximal edge, where it sits on the lipid-rich plaque." },
        ],
        options: [
          {
            text: "Post-dilate the mid-stent with a 3.0 mm or larger non-compliant balloon above 18 atm, then re-image",
            best: true,
            feedback: "The average reference lumen area is 7.2 mm², so 80% is 5.76 mm²; an MSA of 4.2 mm² fails both the absolute OCT target (over 4.5 mm²) and the relative one. Brilakis treats underexpansion with a non-compliant balloon at least the stent diameter at more than 18 atm. The malapposition is not extensive (under 400 µm and under 1 mm) and needs no treatment of its own.",
          },
          {
            text: "Treat the malapposed struts with a semi-compliant balloon at low pressure",
            feedback: "Malapposition of 250 µm over 0.5 mm is not extensive by Brilakis's definition, and low-pressure inflation does nothing for the expansion shortfall. Your consultant asks for non-compliant post-dilatation of the mid-stent before the final run.",
            stateDelta: { stability: -3 },
          },
          {
            text: "Accept it; the angiographic result looks good and the struts are nearly apposed",
            feedback: "Brilakis's OCT targets are an MSA over 4.5 mm² or over 80% of the average reference lumen area; 4.2 mm² meets neither, and underexpansion raises the risk of restenosis and stent thrombosis. Your consultant asks for non-compliant post-dilatation of the mid-stent before the final run.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "Final OCT: MSA 6.3 mm². At the distal edge there is a flap spanning about 90° of the circumference, 4 mm long, with flow behind it; TIMI 3 flow on the angiogram.",
        variants: [{ flag: "stent-rescue", info: "(This is the run after the underexpanded stent was treated; the planned preparation and sizing steps no longer applied once the stent was in.)" }],
        options: [
          {
            text: "Cover it with an additional short stent landing in a disease-free segment",
            best: true,
            feedback: "A dissection over 60° of arc and over 3 mm long, especially at the distal edge, may be best treated with an additional stent (Brilakis 13.3); on IVUS, a dissection into the media over 3 mm is also unacceptable.",
            stateDelta: { flags: ["edge-covered"] },
          },
          {
            text: "Leave it; flow is TIMI 3",
            next: "c-edge",
            feedback: "Only small, non-flow-limiting dissections are left alone. This one is large by both the arc and the length criteria.",
            stateDelta: { stability: -10, flags: ["untreated-dissection"] },
          },
          {
            text: "Post-dilate the distal edge with a larger balloon to tack it down",
            feedback: "Oversizing and very high pressure are listed causes of distal edge dissection; a larger balloon at the edge can extend it. Your consultant stops you before the inflation and asks for a short stent to cover the flap.",
            stateDelta: { stability: -10, flags: ["edge-balloon"] },
          },
        ],
      },
      {
        id: "c-edge",
        kind: "consequence",
        prompt: "Ten minutes later the patient has chest pain and the distal LAD fills slowly beyond a hazy distal edge.",
        options: [
          {
            text: "Rewire if needed and stent the dissection at once, then re-image",
            best: true,
            feedback: "A significant dissection with slow flow needs a stent (Brilakis 10.2.13.3.3). It should have been covered at the first sight of it.",
          },
          {
            text: "Give more heparin and watch",
            feedback: "Anticoagulation does not seal a flow-limiting dissection; it needs a stent.",
            stateDelta: { stability: -15, flags: ["acute-closure"] },
          },
        ],
      },
    ],
    outcome:
      "The final OCT showed an MSA of 6.3 mm², and the large distal edge dissection ended up covered by a further stent. He was angina-free at follow-up.",
    outcomeVariants: [
      { flag: "planned-prep", text: "The calcium was scored by OCT and modified before the stent went in." },
      { flag: "sized-planned", text: "The stent was sized from the distal lumen, landed beyond the lipid-rich plaque and post-dilated proximally." },
      { flag: "edge-covered", text: "The distal edge dissection was covered as soon as the final OCT showed it." },
      { flag: "untreated-dissection", text: "The distal edge dissection was left at first and was stented only after chest pain and slow flow developed." },
      { flag: "edge-balloon", text: "A larger balloon was nearly taken to the dissected distal edge, which risked extending the flap, before it was stented." },
      { flag: "stent-rescue", text: "On this path the stent went in before the calcium had been modified, so the result depended on rescuing an underexpanded stent rather than on planned preparation." },
      { flag: "underexpanded", text: "The stent was left underexpanded in calcium for a time and needed a long rescue; underexpansion raises the risk of restenosis and stent thrombosis." },
      { flag: "distal-injury", text: "The unheld catheter injured a small distal branch; it needed treatment for a distal wire perforation before the case could continue." },
      { flag: "acute-closure", text: "The untreated distal dissection progressed to threatened closure and needed urgent stenting." },
    ],
    learningPoints: [
      "In heavy calcium, OCT measures what IVUS cannot: calcium thickness, the third component of the calcium score.",
      "An imaging catheter that will not cross is withdrawn and the lesion predilated; forcing it kinks it.",
      "A failed OCT run is almost always the flush: coaxial guide, test injection, adequate rate (typically 4 mL/s × 4 s in the left system), catheter and wire held.",
      "Calcium score 4 (arc over 180°, thickness over 0.5 mm, length over 5 mm) predicted poor stent expansion and favours plaque modification before stenting; re-image to see fractures.",
      "A stent found underexpanded in calcium is treated as an undilatable lesion: high-pressure non-compliant balloons first, atherectomy inside the stent only if other options fail.",
      "Size from the distal reference (lumen +0.25 mm), land away from lipid-rich plaque, and post-dilate proximally.",
      "Underexpansion: non-compliant balloon at least the stent diameter above 18 atm; large distal edge dissections (over 60°, over 3 mm) get another stent.",
    ],
    refs: [...BOOKS, "fujino-calcium-2018", "eapci-imaging-2018"],
  },
  {
    id: "pm-imaging-case-nstemi-culprit",
    title: "NSTEMI with no obvious culprit",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 7.2, 10.2, 12.1, 13.1-13.3, 20.7, 20.10, 20.12 and 20.13; Oxford Handbook, chapter 8 (IVUS or OCT?, intravascular ultrasound); OCT criteria from Jia et al. 2013",
    },
    summary: "A troponin-positive NSTEMI with two intermediate lesions: finding the culprit with OCT rather than physiology, sizing around thrombus, judging small post-stent findings, and dealing with the bystander.",
    presentation:
      "A 54-year-old man who smokes had 40 minutes of rest chest pain this morning. His ECG shows non-specific T-wave flattening in the lateral leads and his high-sensitivity troponin is rising. Angiography from the right radial shows a hazy 60% stenosis in the proximal circumflex and a smooth 60% stenosis in the mid-LAD; the RCA is normal. Neither lesion looks clearly culpable.",
    findings: ["Blood pressure 128/80 mmHg, sinus rhythm 72/min, pain-free", "eGFR 88 mL/min/1.73 m²", "Echocardiogram: subtle lateral hypokinesis", "Loaded with aspirin and a P2Y12 inhibitor; heparin given"],
    steps: [
      {
        id: "s1",
        prompt: "How do you decide which lesion caused the event?",
        options: [
          {
            text: "OCT of both lesions, after intracoronary nitrate",
            best: true,
            feedback: "OCT is Brilakis's imaging modality of choice for confirming or excluding a culprit, because of its resolution; kidney function allows the contrast flush.",
          },
          {
            text: "FFR of both lesions; treat whichever is 0.80 or less",
            next: "c-ffr",
            feedback: "Physiology should not be used for decisions about a suspected culprit in an acute coronary syndrome: the injured microcirculation makes it unreliable.",
            stateDelta: { stability: -5, flags: ["ffr-culprit"] },
          },
          {
            text: "Stent both lesions now to be sure the culprit is treated",
            feedback: "Your consultant stops you before the first stent is opened. Treating both blindly means stenting at least one lesion that may need nothing, and it still does not tell you which plaque caused the event; OCT of both lesions is done first.",
            stateDelta: { stability: -10, flags: ["stented-both"] },
          },
          {
            text: "Medical therapy only; neither lesion is above 70%",
            feedback: "A rising troponin with lateral hypokinesis and a hazy circumflex lesion deserves an answer; OCT can show whether a culprit is present.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-ffr",
        kind: "consequence",
        prompt: "The circumflex FFR is 0.84 and the LAD 0.78. The registrar proposes stenting the LAD only.",
        options: [
          {
            text: "Stop: an FFR in a suspected culprit is unreliable; image both lesions with OCT instead",
            best: true,
            feedback: "Brilakis advises imaging, not a pressure wire, for any lesion suspected of causing the ACS, because the injured microcirculation makes physiology unreliable there.",
          },
          {
            text: "Stent the LAD as proposed",
            feedback: "Your consultant stops the registrar before the stent is deployed and asks for OCT of both lesions. Stenting on this FFR may treat a bystander while leaving the plaque that caused the infarct.",
            stateDelta: { stability: -10, flags: ["wrong-lesion"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "OCT findings. Circumflex: a fibrous cap discontinuity with a clear cavity inside lipid plaque, with a mass on the surface that strongly attenuates the light and shadows the wall behind it. LAD: homogeneous, signal-rich plaque with the three layers visible either side, an intact surface and no thrombus.",
        options: [
          {
            text: "Circumflex: plaque rupture with red thrombus, the culprit. LAD: fibrous plaque, a bystander",
            best: true,
            feedback: "Cap discontinuity with a cavity is rupture; a strongly attenuating surface mass that shadows the wall is red thrombus. Thrombus and ulceration are the hallmarks of the culprit.",
          },
          {
            text: "Circumflex: erosion with white thrombus. LAD: the culprit",
            feedback: "Erosion requires an intact plaque surface; here there is a cavity. White thrombus attenuates little. The LAD plaque shows nothing of a culprit.",
            stateDelta: { stability: -10, flags: ["wrong-lesion"] },
          },
          {
            text: "Both look culpable; stent both",
            feedback: "Only one lesion has disruption and thrombus. The LAD is fibrous and intact.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "You plan to stent the circumflex. How do you size the stent?",
        options: [
          {
            text: "From reference frames free of thrombus, distal reference first, and plan to image again after the stent",
            best: true,
            feedback: "Thrombus can make you choose too small a stent and leave it malapposed, so measure where the lumen is clean and check the result with imaging, which also shows residual thrombus and dissection.",
            stateDelta: { flags: ["clean-reference"] },
          },
          {
            text: "From the lumen at the thrombus, where the vessel is narrowest",
            next: "c-undersized",
            feedback: "Thrombus shrinks the apparent lumen; sizing there undersizes the stent.",
            stateDelta: { stability: -5, flags: ["undersized"] },
          },
          {
            text: "From the proximal reference, because the circumflex is large",
            feedback: "Size to the distal reference; proximal sizing risks distal dissection.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-undersized",
        kind: "consequence",
        prompt: "The stent sized at the thrombus is deployed. Post-stent OCT: expansion is adequate, but in the proximal half the struts stand up to 500 µm off the wall over 3 mm.",
        options: [
          {
            text: "Post-dilate the proximal half with a semi-compliant balloon sized to the reference lumen, at low pressure, then re-image",
            best: true,
            feedback: "Malapposition of 500 µm over 3 mm is extensive by any reading (Brilakis: 400 µm or more, or 1 mm or more), and Brilakis corrects it by post-dilatation, usually with a semi-compliant balloon at low pressure.",
          },
          {
            text: "Accept it; acute malapposition has not been linked to stent failure",
            feedback: "That applies to lesser acute malapposition (from 200 µm). Extensive malapposition like this should be corrected with post-dilatation; your consultant asks for it before the next run.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Post-dilate the whole stent with a non-compliant balloon 0.5 mm larger at high pressure",
            feedback: "High-pressure non-compliant inflation is the treatment for underexpansion, which this stent does not have; Brilakis also lists concern about thrombus or plaque embolisation as a reason to avoid routine high-pressure post-dilatation, and this is a thrombotic culprit. Your consultant asks for a low-pressure semi-compliant inflation of the proximal half instead.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After the stent, OCT shows an MSA of 5.2 mm² (85% of the average reference lumen area), smooth tissue protrusion between struts without narrowing the lumen much, and a 1.5 mm intimal flap spanning 30° at the distal edge. Flow is TIMI 3.",
        variants: [{ flag: "undersized", info: "(This is the run after the proximal post-dilatation: the struts are now against the wall.)" }],
        options: [
          {
            text: "Accept the result",
            best: true,
            feedback: "Expansion meets both targets; smooth protrusion with an adequate lumen needs no further treatment (it is irregular protrusion that has been linked to events); a small, non-flow-limiting edge dissection needs no treatment.",
            stateDelta: { flags: ["findings-accepted"] },
          },
          {
            text: "Add a stent at the distal edge for the flap",
            next: "c-overtreat",
            feedback: "Brilakis reserves an extra stent for larger dissections (over 60° and/or over 3 mm).",
            stateDelta: { stability: -5, flags: ["extra-stent"] },
          },
          {
            text: "Post-dilate at high pressure for the tissue protrusion",
            feedback: "Protrusion is post-dilated only when the effective lumen is inadequate, and high pressure into a lipid-rich, thrombotic segment invites embolisation.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-overtreat",
        kind: "consequence",
        prompt: "The extra stent is in. Its own distal edge now sits in a smaller segment, and OCT shows a new flap there.",
        options: [
          {
            text: "Grade the new flap by the same criteria before acting, and stop adding metal unless it is large",
            best: true,
            feedback: "Every extra stent creates a new edge. Grade each finding against the criteria; treat only what meets them.",
          },
          {
            text: "Cover the new flap with yet another stent",
            feedback: "Chasing small flaps lengthens the stented segment without benefit.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "What about the 60% mid-LAD lesion with fibrous, intact plaque?",
        options: [
          {
            text: "Assess it with physiology, now or at a staged procedure, and treat according to the result",
            best: true,
            feedback: "Non-culprit lesions in ACS can undergo physiologic assessment. Brilakis does not use imaging areas to judge haemodynamic significance outside the left main.",
            stateDelta: { flags: ["lad-physiology"] },
          },
          {
            text: "Its OCT minimum lumen area is 3.4 mm², so stent it",
            next: "c-mla",
            feedback: "Brilakis does not use the minimum lumen area to judge the haemodynamic significance of a lesion outside the left main. (Oxford quotes a luminal area under 4 mm², printed as a mean area, but the books disagree; physiology answers the question.)",
            stateDelta: { stability: -5, flags: ["mla-decision"] },
          },
          {
            text: "Ignore it; it was not the culprit",
            feedback: "Non-culprit lesions still need assessment; physiology is the tool for them.",
            stateDelta: { stability: -3, flags: ["lad-ignored"] },
          },
        ],
      },
      {
        id: "c-mla",
        kind: "consequence",
        prompt: "Your consultant asks what the pressure wire would have shown.",
        options: [
          {
            text: "Measure FFR or a resting index before any stent; defer if it is not significant",
            best: true,
            feedback: "Physiology tells you whether this fibrous, non-culprit plaque limits flow; the area alone does not.",
            stateDelta: { flags: ["lad-physiology"] },
          },
          {
            text: "Proceed anyway; the area is small",
            feedback: "Stenting on area alone outside the left main is what Brilakis advises against.",
            stateDelta: { stability: -5, flags: ["lad-area-stent"] },
          },
        ],
      },
    ],
    outcome:
      "OCT showed a ruptured circumflex plaque with red thrombus, the culprit, and the circumflex lesion was stented.",
    outcomeVariants: [
      { flag: "clean-reference", text: "The stent was sized from reference frames away from the thrombus." },
      { flag: "findings-accepted", text: "The small edge flap and the smooth tissue protrusion after stenting were left alone." },
      { flag: "extra-stent", text: "An extra stent was placed for a small edge flap and created a new edge of its own." },
      { flag: "lad-physiology", text: "The LAD lesion was assessed with physiology." },
      { flag: "lad-ignored", text: "The non-culprit LAD lesion was left without any assessment." },
      { flag: "lad-area-stent", text: "The LAD was stented on its OCT area alone, without physiology." },
      { flag: "wrong-lesion", text: "For a time the plan targeted the bystander LAD, leaving the ruptured circumflex plaque untreated." },
      { flag: "undersized", text: "The stent sized at the thrombus was undersized and extensively malapposed and needed low-pressure post-dilatation of its proximal half." },
      { flag: "stented-both", text: "A plan to stent both lesions without knowing which caused the event was stopped before any stent was opened." },
    ],
    learningPoints: [
      "No clear culprit: OCT, not physiology, decides which plaque caused the event.",
      "Rupture is a cap discontinuity with a cavity; red thrombus attenuates and shadows the wall; erosion has an intact surface.",
      "Thrombus can cause undersizing and malapposition: take references away from it and re-image; correct extensive malapposition with a semi-compliant balloon at low pressure.",
      "Small non-flow-limiting edge flaps and smooth tissue protrusion with an adequate lumen need no treatment; irregular protrusion has been linked to events.",
      "Non-culprit lesions are assessed with physiology; imaging area does not decide outside the left main.",
    ],
    refs: [...BOOKS, "jia-oct-erosion-2013", "soeda-oct-protrusion-2015"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-img-choose-by-goal",
    lab: "pci",
    when: { phase: ["plan", "imaging", "lesion-prep"] },
    title: "Pick the modality by the question",
    text: "OCT for the culprit, thrombus, dissection, strut apposition and edges; IVUS for the left main, aorto-ostial lesions, large vessels, CTO crossing and when contrast must be spared. Either will size the vessel, find landing zones and check expansion.",
    tone: "do",
    lessonId: "pm-imaging-when-which",
    sources: [{ book: "brilakis-pci", loc: "13.2" }, { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" }],
    refs: BOOKS,
  },
  {
    id: "pci-img-ivus-contrast-saver",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "Spare contrast: check the stent result with IVUS",
    text: "IVUS needs no contrast to image. Using it to judge the stent result, instead of more check angiograms, lowers the contrast volume and the risk of contrast-induced kidney injury.",
    tone: "do",
    lessonId: "pm-imaging-when-which",
    sources: [{ book: "brilakis-pci", loc: "13.1" }, { book: "brilakis-pci", loc: "13.2" }, { book: "brilakis-pci", loc: "10.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-nitrate-first",
    lab: "pci",
    when: { phase: ["imaging", "lesion-prep"] },
    title: "Guide seated, wire across, nitrate given",
    text: "Start imaging only with the guide engaged and the wire across the segment, and give intracoronary nitrate first (Oxford gives it before and after imaging) so spasm does not shrink the vessel you are about to measure.",
    tone: "do",
    lessonId: "pm-imaging-ivus",
    sources: [...SRC_IVUS, ...SRC_OCT, { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" }],
    refs: BOOKS,
  },
  {
    id: "pci-img-ivus-clear-view",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["ivus"] },
    title: "Phased-array IVUS: clear view before the lesion",
    text: "Before taking a solid-state IVUS catheter through the lesion, park it in a roomy part of the vessel or in the aorta and press the ‘clear view’ button; then advance it beyond the segment.",
    tone: "do",
    lessonId: "pm-imaging-ivus",
    sources: SRC_IVUS,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-cannot-cross",
    lab: "pci",
    when: { phase: ["imaging"] },
    title: "Imaging catheter will not cross: predilate, do not force",
    text: "Take it out, predilate with a small balloon (which also lets the OCT flush through) and improve guide support or use a supportive wire. Forcing it kinks the catheter; replace one that still fails after it is straightened.",
    tone: "bailout",
    lessonId: "pm-imaging-ivus",
    sources: [...SRC_OCT, ...SRC_IVUS],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-ivus-jumps",
    lab: "pci",
    when: { phase: ["imaging", "optimise"], imaging: ["ivus"] },
    title: "IVUS image jumping: slow down or change catheter",
    text: "Jumps happen with solid-state catheters across tight, tortuous or calcified segments or stent struts. Pull back slowly and steadily after preparing the lesion; if they persist, use a rotational catheter, prepare further, or image while advancing.",
    tone: "bailout",
    lessonId: "pm-imaging-ivus",
    sources: SRC_IVUS,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-guide-size",
    lab: "pci",
    when: { phase: ["plan", "imaging"], imaging: ["oct"] },
    title: "OCT by hand needs a 6 Fr guide",
    text: "A guide of 6 Fr or larger is usually needed to clear the lumen with a hand injection; through a 5 Fr guide use a power injector.",
    tone: "caution",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-marker",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["oct"] },
    title: "OCT middle marker 57 mm beyond the target",
    text: "Of the three markers (tip, wire exit port, and 50 mm proximal to the lens), place the middle one at least 57 mm distal to the target so the lesion falls inside the run.",
    tone: "do",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-purge-calibrate",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["oct"] },
    title: "OCT: purge with 100% contrast, then calibrate",
    text: "Flush the OCT catheter with undiluted contrast and check there is no blood (attenuation) or air (shadow) inside it, then calibrate, but never while purging.",
    tone: "do",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-flush-rates",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["oct"] },
    title: "OCT: test, then flush at the right rate",
    text: "Confirm engagement with a small test injection. With an injector, typical settings are 4 mL/s for 4 seconds in the left coronary artery and 3 mL/s for 3 seconds in the RCA; the pullback triggers when the lumen clears.",
    tone: "do",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-hold-catheter",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["oct"] },
    title: "Hold the OCT catheter and wire during the flush",
    text: "A forceful injection can drive an unheld catheter and wire distally. If they jump, look for distal vessel injury or perforation before anything else.",
    tone: "caution",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-oct-no-pullback",
    lab: "pci",
    when: { phase: ["imaging"], imaging: ["oct"] },
    title: "OCT pullback will not start: fix the flush",
    text: "Re-engage coaxially or add a guide extension, inject at least 3 mL/s in the RCA or 4 mL/s in the left main (longer or faster if the guide is stable), redilate a lesion that is still very tight, take out buddy wires, and trigger by hand if needed.",
    tone: "bailout",
    lessonId: "pm-imaging-oct",
    sources: SRC_OCT,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-lm-threshold",
    lab: "pci",
    when: { phase: ["plan", "imaging"], vessel: ["LM"] },
    title: "Left main area thresholds, and their limits",
    text: "A left main minimum lumen area below 6.0 mm² by IVUS (or 5.4 mm² by OCT, not prospectively validated) is significant. Thresholds vary with population (4.5 mm² proposed in Korean patients), and an ostial left main is hard to image with OCT. Outside the left main, use physiology.",
    tone: "caution",
    lessonId: "pm-imaging-planning",
    sources: [{ book: "brilakis-pci", loc: "13.1" }, { book: "brilakis-pci", loc: "17.13" }],
    refs: ["brilakis-manual-pci", "litro-2011"],
  },
  {
    id: "pci-img-calcium-score",
    lab: "pci",
    when: { phase: ["lesion-prep", "imaging"], imaging: ["oct"] },
    title: "Score the calcium before choosing the tool",
    text: "On OCT: arc over 180° scores 2, thickness over 0.5 mm scores 1, length over 5 mm scores 1. A score of 4 predicted poor expansion (mean 78% against 96% for scores 0 to 3) and favours atherectomy or lithotripsy; superficial calcium needs ablation more often than deep calcium.",
    tone: "do",
    lessonId: "pm-imaging-planning",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "19.13" }],
    refs: ["brilakis-manual-pci", "fujino-calcium-2018"],
  },
  {
    id: "pci-img-image-after-modification",
    lab: "pci",
    when: { phase: ["lesion-prep"] },
    title: "Re-image after the calcium is treated",
    text: "If the imaging catheter could not cross the calcified segment, image after atherectomy. After a balloon or atherectomy, look for fractures in the calcium ring, which predict better stent expansion.",
    tone: "do",
    lessonId: "pm-imaging-planning",
    sources: [{ book: "brilakis-pci", loc: "19.9" }, { book: "brilakis-pci", loc: "19.13" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-landing-zone",
    lab: "pci",
    when: { phase: ["stent", "imaging"] },
    title: "Land the edges on healthy wall",
    text: "Choose landing zones with plaque burden below 50% and no lipid-rich plaque, especially thin-cap fibroatheroma, where edges dissect. Measure the length between them from an automated pullback.",
    tone: "do",
    lessonId: "pm-imaging-planning",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "13.4" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-size-distal-reference",
    lab: "pci",
    when: { phase: ["stent", "imaging"] },
    title: "Imaging sizing: distal lumen +0.25, EEM −0.25",
    text: "Size the stent to the distal reference: round the lumen diameter up by 0.25 mm, or the EEM diameter down by 0.25 mm. Never size to the proximal reference; post-dilate the proximal stent with a shorter, larger balloon instead.",
    tone: "do",
    lessonId: "pm-imaging-planning",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "10.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-underexpansion-fix",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "Underexpanded on imaging: NC balloon above 18 atm",
    text: "Targets: MSA over 4.5 mm² on OCT (at least 5.5 mm² on IVUS) or over 80% of the mean reference lumen area; 8.0 mm² in the left main. If short, post-dilate with a non-compliant balloon at least the stent diameter above 18 atm, then re-image.",
    tone: "bailout",
    lessonId: "pm-imaging-optimisation",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "13.4" }],
    refs: ["brilakis-manual-pci", "eapci-imaging-2018"],
  },
  {
    id: "pci-img-malapposition",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "Malapposition: treat only the extensive kind",
    text: "Brilakis corrects extensive malapposition (struts 400 µm or more off the wall, or malapposed over 1 mm or more) by post-dilatation, usually with a semi-compliant balloon at low pressure. Lesser acute malapposition has not been linked to stent failure. Check expansion first: it heads his list of post-stent checks.",
    tone: "do",
    lessonId: "pm-imaging-optimisation",
    sources: [{ book: "brilakis-pci", loc: "13.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-edge-dissection",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "After stenting, grade any edge dissection",
    text: "On the post-stent run, leave small, non-flow-limiting edge flaps. A dissection over 60° of arc and/or over 3 mm long, especially at the distal edge, or one into the media over 3 mm on IVUS, is best covered with another stent.",
    tone: "do",
    lessonId: "pm-imaging-optimisation",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "13.4" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-lm-both-branches",
    lab: "pci",
    when: { phase: ["optimise"], vessel: ["LM"] },
    title: "Left main: image from both branches",
    text: "After left main stenting, pull back from the LAD and from the circumflex. Aim for at least 5 mm² at the circumflex ostium, 6 mm² at the LAD ostium, 7 mm² at the polygon of confluence and 8 mm² in the left main above it.",
    tone: "do",
    lessonId: "pm-imaging-optimisation",
    sources: [{ book: "brilakis-pci", loc: "17.13" }, { book: "oxford-cath", loc: "ch 8: Left main stem PCI" }],
    refs: ["brilakis-manual-pci", "kang-lm-ivus-2011"],
  },
  {
    id: "pci-img-ostial-coverage",
    lab: "pci",
    when: { phase: ["plan", "optimise"], requires: ["aorto-ostial-lesion"] },
    title: "Ostial stent: plan to prove the ostium is covered",
    text: "The balloon shoulder can make an uncovered aorto-ostial lesion look treated. Plan to image after deployment, preferably with IVUS, to confirm ostial coverage and expansion.",
    tone: "caution",
    lessonId: "pm-imaging-optimisation",
    sources: [{ book: "brilakis-pci", loc: "15.1" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-thrombus-sizing",
    lab: "pci",
    when: { phase: ["complication", "stent"], event: ["thrombus"] },
    title: "Thrombus misleads sizing",
    text: "Thrombus can make you undersize the stent and leave it malapposed. Choose reference frames away from it, and image again after stenting for expansion, apposition and residual thrombus.",
    tone: "caution",
    lessonId: "pm-imaging-acs",
    sources: [{ book: "brilakis-pci", loc: "20.10" }, { book: "brilakis-pci", loc: "20.13" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-ivus-wire-position",
    lab: "pci",
    when: { phase: ["wire", "imaging"], event: ["wire-subintimal"] },
    title: "Unsure the wire is in the lumen? IVUS, not a microcatheter injection",
    text: "After crossing an occlusion, IVUS can often confirm that the wire is intraluminal. Injecting through a microcatheter or over-the-wire balloon that may lie in a dissection plane risks extending the dissection.",
    tone: "caution",
    lessonId: "pm-imaging-acs",
    sources: [{ book: "brilakis-pci", loc: "20.8" }, { book: "oxford-cath", loc: "ch 10: Left main stem dissection" }],
    refs: BOOKS,
  },
  {
    id: "pci-img-scad-caution",
    lab: "pci",
    when: { phase: ["plan", "imaging"], requires: ["scad-suspected"] },
    title: "Suspected spontaneous dissection: image with caution",
    text: "OCT can confirm SCAD, but wiring and the contrast flush may extend the dissection and close the vessel, so Brilakis advises using it cautiously. The AHA statement reserves imaging for an uncertain angiographic diagnosis, as in type 3, in a vessel large enough to image; for wire position in a dissected left main, Oxford prefers IVUS because it needs no contrast.",
    tone: "caution",
    lessonId: "pm-imaging-acs",
    sources: [{ book: "brilakis-pci", loc: "13.3" }, { book: "brilakis-pci", loc: "22.1" }, { book: "oxford-cath", loc: "ch 10: Left main stem dissection" }],
    refs: [...BOOKS, "hayes-scad-aha-2018"],
  },
  {
    id: "pci-img-coreg-landing",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Use co-registration to place the stent",
    text: "If the system co-registers imaging or physiology with the angiogram, use the marked landing zones to position the stent, together with fixed landmarks such as clips or earlier stents.",
    tone: "do",
    lessonId: "pm-imaging-coreg-ct",
    sources: [{ book: "brilakis-pci", loc: "10.2" }, { book: "brilakis-pci", loc: "13.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-img-ct-cap",
    lab: "pci",
    when: { phase: ["plan", "wire"], requires: ["cto"] },
    title: "Ambiguous CTO cap: resolve it before you probe",
    text: "Use extra projections, a microcatheter injection near the cap, IVUS, a preprocedural CT angiogram or CT co-registration, or move-the-cap techniques. If the cap stays ambiguous, a retrograde or move-the-cap approach is usually recommended.",
    tone: "caution",
    lessonId: "pm-imaging-coreg-ct",
    sources: [{ book: "brilakis-pci", loc: "21.6" }, { book: "brilakis-pci", loc: "21.1" }],
    refs: ["brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "hong-ivus-xpl-2015",
    kind: "trial",
    citation:
      "Hong SJ, Kim BK, Shin DH, et al. Effect of intravascular ultrasound-guided vs angiography-guided everolimus-eluting stent implantation: the IVUS-XPL randomized clinical trial. JAMA. 2015;314:2155–2163.",
    url: "https://doi.org/10.1001/jama.2015.15454",
    note: "PMID: 26556051. Checked on PubMed: authors, title, journal, year, volume 314, issue 20, pages 2155–2163; abstract read (1,400 patients with long lesions, implanted stent ≥28 mm; MACE at 1 year 2.9% vs 5.8%, HR 0.48, driven by ischaemia-driven TLR 2.5% vs 5.0%; cardiac death not significantly different).",
    verified: true,
  },
  {
    id: "stone-imaging-nma-2024",
    kind: "paper",
    citation:
      "Stone GW, Christiansen EH, Ali ZA, et al. Intravascular imaging-guided coronary drug-eluting stent implantation: an updated network meta-analysis. Lancet. 2024;403:824–837.",
    url: "https://doi.org/10.1016/S0140-6736(23)02454-6",
    note: "PMID: 38401549. Checked on PubMed: authors, title, journal, year, volume 403, issue 10429, pages 824–837; abstract read (22 trials, 15,964 patients; imaging vs angiography guidance: TLF RR 0.71, cardiac death RR 0.55, TV-MI RR 0.82, TLR RR 0.72, stent thrombosis RR 0.52, all MI RR 0.83, all-cause death RR 0.75; outcomes similar for OCT and IVUS).",
    verified: true,
  },
  {
    id: "kang-octivus-2023",
    kind: "trial",
    citation:
      "Kang DY, Ahn JM, Yun SC, et al. Optical coherence tomography-guided or intravascular ultrasound-guided percutaneous coronary intervention: the OCTIVUS randomized clinical trial. Circulation. 2023;148:1195–1206.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.123.066429",
    note: "PMID: 37634092. Checked on PubMed: authors, title, journal, year, volume 148, issue 16, pages 1195–1206; abstract read (2,008 patients; composite of cardiac death, target-vessel MI or ischaemia-driven TVR at 1 year 2.5% OCT vs 3.1% IVUS, non-inferior; contrast-induced nephropathy 1.4% vs 1.5%; major procedural complications 2.2% vs 3.7%).",
    verified: true,
  },
  {
    id: "jia-oct-erosion-2013",
    kind: "paper",
    citation:
      "Jia H, Abtahian F, Aguirre AD, et al. In vivo diagnosis of plaque erosion and calcified nodule in patients with acute coronary syndrome by intravascular optical coherence tomography. J Am Coll Cardiol. 2013;62:1748–1758.",
    url: "https://doi.org/10.1016/j.jacc.2013.05.071",
    note: "PMID: 23810884; PMC3874870. Checked on PubMed: authors, title, journal, year, volume 62, issue 19, pages 1748–1758; full text read for the OCT definitions (rupture: fibrous cap discontinuity with a clear cavity; definite erosion: attached thrombus over an intact, visualised plaque; probable erosion: irregular luminal surface without thrombus, or thrombus attenuating plaque without superficial lipid or calcium proximal or distal; calcified nodule: cap disruption over calcified plaque with protruding calcium, superficial calcium and substantive calcium proximal and/or distal; thrombus: mass >250 µm) and results (126 ACS patients: rupture 43.7%, erosion 31.0%, calcified nodule 7.9%; erosion younger, more NSTE-ACS, less stenosis, thicker cap; white thrombus mainly with erosion and nodule, red with rupture; authors suggest erosion might be stabilised without a stent but state that evidence is needed).",
    verified: true,
  },
  {
    id: "opolski-ct-rector-2015",
    kind: "paper",
    citation:
      "Opolski MP, Achenbach S, Schuhbäck A, et al. Coronary computed tomographic prediction rule for time-efficient guidewire crossing through chronic total occlusion: insights from the CT-RECTOR multicenter registry (Computed Tomography Registry of Chronic Total Occlusion Revascularization). JACC Cardiovasc Interv. 2015;8:257–267.",
    url: "https://doi.org/10.1016/j.jcin.2014.07.031",
    note: "PMID: 25700748. Checked on PubMed: authors, title, journal, year, volume 8, issue 2, pages 257–267; abstract read (240 CTO lesions, 4 centres; 1 point each for multiple occlusions, blunt stump, severe calcification, bending, CTO duration ≥12 months, previously failed PCI; groups easy 0, intermediate 1, difficult 2, very difficult ≥3 with wire crossing ≤30 min in 95%, 88%, 57%, 22%; AUC 0.83 vs 0.71 for J-CTO). Full text not available in PMC; the angle that defines bending was not checked and is not quoted.",
    verified: true,
  },
  {
    id: "soeda-oct-protrusion-2015",
    kind: "paper",
    citation:
      "Soeda T, Uemura S, Park SJ, et al. Incidence and clinical significance of poststent optical coherence tomography findings: one-year follow-up study from a multicenter registry. Circulation. 2015;132:1020–1029.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.114.014704",
    note: "PMID: 26162917. Checked on PubMed: authors, title, journal, year, volume 132, issue 11, pages 1020–1029; abstract read (900 lesions with post-stent OCT in 786 patients; smooth protrusion 92.9%, disrupted fibrous tissue protrusion 61.0%, irregular protrusion 53.8%; after adjustment, irregular protrusion (P=0.003) and small minimal stent area (P=0.012) independently predicted 1-year device-oriented clinical end points, driven mainly by target lesion revascularisation).",
    verified: true,
  },
  {
    id: "zhang-ivus-calcium-2021",
    kind: "paper",
    citation:
      "Zhang M, Matsumura M, Usui E, et al. Intravascular ultrasound-derived calcium score to predict stent expansion in severely calcified lesions. Circ Cardiovasc Interv. 2021;14:e010296.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.120.010296",
    note: "PMID: 34665658. Checked on PubMed: authors, title, journal, year, volume 14, issue 10, article e010296. PubMed carries no text abstract (graphical abstract only), so the components of the score were not checked; the module cites it only for the fact that an IVUS-derived calcium score has been published.",
    verified: true,
  },
];
