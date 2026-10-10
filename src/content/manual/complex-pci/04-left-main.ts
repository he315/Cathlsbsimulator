// Module cp-left-main: left main and high-risk PCI (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 17 (left main) and 14.1 (when and which support device), with the left
// main passages of 5.6, 5.7, 6.4, 6.8, 7.1, 8, 10.2, 12.3, 13.1, 13.3, 13.4, 15.1, 16.1, 16.2, 19.3, 19.9, 25.2, 28.1
// and 30.2; Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 8 (left main stem PCI,
// bifurcation PCI techniques, intravascular ultrasound, IVUS or OCT), chapter 6 (anatomy, catheter manipulation,
// imaging planes, quantification), chapter 4 (ventriculography), chapter 9 (mechanical circulatory support, CHIP) and
// chapter 10 (death, left main stem dissection).
// Every claim is listed with its page in docs/curriculum/evidence/cp-left-main.md.
// Neighbouring modules: pm-target (the SYNTAX score and the heart-team algorithm for left main disease), pm-physiology
// and pm-imaging (pressure-wire and IVUS/OCT technique), pm-support-choice and pm-support-devices (the device
// algorithm and running each device), cp-ostial (aorto-ostial stenting in full), cp-bifurcation-provisional and
// cp-bifurcation-two-stent (the bifurcation techniques step by step), cp-calcium (atherectomy), cm-principles-closure
// (dissection and acute closure). Academy lessons this module builds on: cx-left-main, phy-ivus, cx-high-risk.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

export const module: Module = {
  id: "cp-left-main",
  title: "Left main and high-risk PCI",
  stage: 5,
  summary:
    "The left main taught as its own procedure: assessing it with angiography, IVUS and the pressure wire; engaging, preparing and stenting the ostium and shaft without causing ischaemia or dissection; choosing and finishing the strategy for the distal bifurcation and trifurcation; and planning protected PCI for the complex, high-risk patient in whom the left main is often the lesion that decides the plan.",
  objectives: [
    "Prepare for a left main case from the old films and the clinical picture, answering Brilakis's four planning questions.",
    "Image the left main in the views that answer each question (ostium, body, bifurcation, stent edge), recognise the limits of the eye between 30% and 70%, and assess an intermediate lesion with IVUS or a pressure wire in both branches.",
    "Engage the left main without damping, side-hole guides or forceful injections, prepare the lesion with short inflations, and place an ostial or shaft stent that covers the ostium and can be expanded to the left main diameter.",
    "Manage a left main dissection caused in the lab, using the two manuals' bail-out steps and Oxford's decision table.",
    "Choose between provisional and two-stent strategies for the distal left main, knowing where Brilakis, the DKCRUSH trials and EBC MAIN agree and disagree, and decide on the jailed circumflex with physiology.",
    "Treat a trifurcation, finish every left main case with imaging from both branches, and know the segment targets.",
    "Define complex high-risk indicated PCI, distinguish a graft-protected left main from device-protected PCI, and plan support, sequence and escalation for a high-risk left main case in the light of PROTECT II, BCIS-1 and CHIP-BCIS3.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-left-main-assess",
      title: "Assessing the left main: films, views, imaging and physiology",
      minutes: 16,
      topics: ["cx-lm-assessment"],
      sources: [
        { book: "brilakis-pci", loc: "17.1" },
        { book: "brilakis-pci", loc: "17.5" },
        { book: "brilakis-pci", loc: "17.6" },
        { book: "brilakis-pci", loc: "17.7" },
        { book: "brilakis-pci", loc: "17.12" },
        { book: "brilakis-pci", loc: "17.13" },
        { book: "brilakis-pci", loc: "6.4" },
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "7.1" },
        { book: "brilakis-pci", loc: "12.3" },
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "oxford-cath", loc: "ch 6: Coronary anatomy" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
        { book: "oxford-cath", loc: "ch 4: Ventriculography" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 10: Death" },
      ],
      refs: [
        ...BOOKS,
        "park-lm-ivus-2014",
        "litro-2011",
        "hamilos-lm-ffr-2009",
        "johnson-eapci-lm-imaging-2026",
        "stone-excel-5y-2019",
        "holm-noble-5y-2020",
        "esc-revasc-2018",
        "esc-ccs-2024",
      ],
      blocks: [
        {
          kind: "p",
          text: "The left main carries the blood supply of most of the myocardium, so anything that slows its flow, a catheter tip, a balloon, a dissection, quickly produces hypotension, shock or arrest. That is why both manuals handle it as a special case from the first injection. Oxford lists a left main stenosis among the features that raise the mortality of a diagnostic catheter study, and counts a severe left main stenosis as a relative contraindication to left ventriculography because of the risk of hypotension. This lesson takes you through the assessment in order: what to find out before you start, how to image the vessel, when to stop trusting your eyes, and how imaging and physiology settle the intermediate lesion. The PCI-or-CABG decision that follows is taught in full in pm-target; the end of this lesson summarises Brilakis's decision algorithm, the five-year trial results he cites and the current European position.",
        },
        {
          kind: "table",
          caption: "Where left main disease sits and what each position means for you",
          head: ["Position", "What the manuals say", "What it means in the lab"],
          rows: [
            ["Ostium (aorto-ostial)", "Often fibrotic or calcified, rigid and liable to recoil; the catheter tip easily damps the pressure on engagement", "Ischaemia at engagement, a risk of ostial or aortic dissection with injections, and lesions that may need atherectomy (Brilakis 15.1)"],
            ["Body (shaft)", "The easiest part of the left main to treat (Brilakis 17)", "Usually a single stent; the problem is sizing to a large vessel"],
            ["Distal bifurcation", "Involved in more than 80% of left main lesions that have PCI (Brilakis 17, citing EXCEL and its five-year report); the figure counts lesions treated by PCI, not all left main disease, so other sources quote different shares", "A bifurcation strategy is needed (lesson 3); the circumflex is the side branch in most cases"],
            ["Trifurcation", "Oxford: the left main occasionally gives an intermediate branch between LAD and circumflex. Brilakis: trifurcating left mains are met only rarely (17.10)","Three ostia to protect; 7 or 8 Fr guides (lesson 3)"],
          ],
        },
        { kind: "h", text: "Step 1: before the first injection" },
        {
          kind: "steps",
          title: "Read the history of this artery (Brilakis 17.1)",
          items: [
            {
              title: "1. Is the RCA diseased or occluded?",
              detail: "If the RCA is blocked or badly narrowed, the left main may be feeding the whole heart, so every moment of reduced left main flow is felt everywhere. Brilakis lists unprotected left main disease with a diseased or occluded RCA among the high-risk lesion locations (14.1.2).",
            },
            {
              title: "2. Does the RCA send collaterals to the left system?",
              detail: "Brilakis asks whether visible collaterals run from the RCA to the left system. He lists it among the questions to answer from the old films before planning, without expanding on how each answer changes the plan.",
            },
            {
              title: "3. Is the left main protected by a working bypass graft?",
              detail: "A patent graft to the LAD or circumflex reduces the myocardium at risk. Oxford lists the protected left main among the elective indications for left main PCI, and Brilakis allows side-hole guides in a protected left main that he forbids in an unprotected one (15.1.5).",
            },
            {
              title: "4. Is there heavy calcium?",
              detail: "Severe calcification may need atherectomy, which lengthens ischaemia and is one of the reasons Brilakis gives for considering support (17.14).",
            },
            {
              title: "5. Add the clinical picture",
              detail: "LV function, baseline haemodynamics, the presentation and the comorbidities decide how much ischaemia the patient can tolerate and whether support is needed. A right heart study measures filling pressures and cardiac output, helps settle the support question before the case and lets you watch the haemodynamics during it (lesson 4).",
            },
          ],
        },
        { kind: "tip", id: "pci-planning-left-main" },
        {
          kind: "check",
          stem: "Old films for a 70-year-old booked for distal left main assessment show a chronically occluded RCA filled by collaterals from the LAD. What does this mean for the angiogram you are about to perform?",
          options: [
            "Nothing changes, because the collaterals from the LAD protect the inferior wall during every left injection",
            "Keep left injections short: the left main feeds both territories and long runs can drop the pressure",
            "A side-hole guide is preferred, because it keeps flow going into the left main during the study",
            "Ventriculography should be done first, as it will show how much of the inferior wall is still alive",
          ],
          answer: 1,
          explanation:
            "Brilakis warns against prolonged contrast injections in a left-dominant system or when the RCA is totally occluded, because they can cause hypotension: here the left main is supplying its own territory and, through the collaterals, the RCA's. The reason Brilakis names for short injections is the occluded RCA (or left dominance), not the collaterals; he does not say how the collaterals themselves change the plan, so do not count on them as protection. Side-hole guides should not be used to engage an unprotected left main because they hide damping, and Oxford treats severe left main stenosis as a relative contraindication to ventriculography because of hypotension.",
        },
        { kind: "h", text: "Step 2: engage gently and image in the right views" },
        {
          kind: "steps",
          title: "Taking the left main pictures",
          items: [
            {
              title: "1. Watch the pressure as the catheter seats",
              detail: "Oxford gives four reasons for damping while the left main is intubated: a left main stenosis, the catheter tip pointing up into the vessel wall, spasm, and a short left main with the tip selectively in the LAD or circumflex. Whatever the cause, a damped catheter is not injected. Withdraw until the trace recovers, and if engagement always damps, take non-selective images from the sinus; Brilakis accepts their poorer quality as the price of a lower dissection risk.",
            },
            {
              title: "2. Recognise the damped trace and rule out the other causes",
              detail: "On the damped trace that Oxford describes, the systolic peak drops and diastole takes on a ventricular shape; compared with the aorta, the pressure rises more slowly and falls more sharply after a small deflection just ahead of systole, and A waves can appear. When nothing comes back on aspiration, the tip is against the aortic wall or seated in the left main. Withdraw a little until aspiration is free and inject only then, because injecting before that point invites air embolism. Brilakis asks you to exclude causes that have nothing to do with the ostium (thrombus or debris inside the catheter, a kink, a non-coaxial tip, a faulty transducer) with a stepwise check: withdraw slightly, aspirate, check the transducer, screen the catheter for a kink, and if all of these fail take the catheter out without injecting through it or passing a wire, keeping suction on it with a syringe, then aspirate the sheath to make sure it holds no thrombus (5.6.3.5). The box in his Fig. 5.16 reads 'without aspirating', but the text asks for suction during removal, which is what stops material inside the catheter from being pushed out; a wire is never passed because it would push that material into the coronary or the aorta (5.6.3.2).",
            },
            {
              title: "3. Exclude spasm",
              detail: "For an aorto-ostial lesion, Brilakis gives nitroglycerin before the angiogram so that catheter-induced spasm is not mistaken for disease.",
            },
            {
              title: "4. Keep injections short and acquisitions few",
              detail: "Avoid long runs in a left-dominant system or with an occluded RCA. At an ostial lesion, each extra selective acquisition is another chance of dissection; intravascular imaging can answer questions that more contrast would not. If contrast hangs in the artery after the injection the catheter is probably blocking the ostium: disengage at once, because VT or VF can follow.",
            },
            {
              title: "5. Choose the view for the question",
              detail: "The left main ostium is usually oval, so one view is never enough; take orthogonal projections. Use the table below.",
            },
          ],
        },
        { kind: "tip", id: "diag-lm-damping-causes" },
        { kind: "tip", id: "diag-lm-short-injections" },
        {
          kind: "table",
          caption: "Views for the left main, by the question you are asking",
          head: ["Question", "Brilakis", "Oxford"],
          rows: [
            ["First look at the ostium", "AP is the usual first projection (6.4)", "PA, LAO and LAO caudal for the ostium (Table 6.1); intubate in PA"],
            ["The full diagnostic set", "AP, RAO caudal, RAO cranial, LAO cranial and LAO caudal (the spider) (6.4)", "PA, LAO and LAO caudal for the main vessel; caudal views generally show proximal vessels. The Oxford sequence for the left coronary: intubate in PA, then RAO shallow caudal, right lateral, RAO cranial, RAO steep caudal, LAO cranial and LAO caudal"],
            ["The bifurcation", "RAO caudal, AP caudal and LAO caudal (17.6)", "LAO caudal shows the left main and proximal LAD and circumflex (Fig. 6.7); PA caudal shows the circumflex together with the ostium and body of the left main and the proximal LAD (Fig. 6.5); RAO caudal shows the left main with the proximal circumflex (Fig. 6.9)"],
            ["The true ostium, least foreshortened", "LAO caudal and LAO cranial (15.1.6); a prior CT can give the best angle in advance", "Not separately stated: Oxford does not rank its views by foreshortening (its PA caudal view, in the bifurcation row, shows the ostium and body)"],
            ["Placing the proximal stent edge at the ostium", "LAO cranial or AP cranial are the most reliable (17.6); confirm in several views, especially LAO cranial (17.10)", "Not separately stated"],
          ],
        },
        {
          kind: "p",
          text: "The lists do not match exactly, and other teaching differs again: the Academy lesson cx-lm-assessment makes LAO straight the first view when left main disease is suspected and warns that caudal angulation can lay the aortic cusp over the ostium. Treat the views as options to test in each patient, take orthogonal pairs, and use a previous CT to choose the angle in advance when one exists.",
        },
        {
          kind: "cine",
          run: "ac-161-3",
          caption: "A left coronary run from a patient whose dataset annotation grades the left main at 76–90% and the proximal circumflex at 76–90% (STEMI presentation, ejection fraction 25%). Find the left main, follow it to the bifurcation, and name the projection from the spine and the catheter course before you read the grading section.",
        },
        { kind: "h", text: "Step 3: grade it, and know when the eye fails" },
        {
          kind: "p",
          text: "Brilakis treats a diameter stenosis of 50% or more in the left main as significant, and Oxford one of more than 50%, against 70% elsewhere (Brilakis gives 70–90% for other vessels). Brilakis adds that angiography is usually good enough when the left main is narrowed by 70% or more, but that observers disagree widely between 30% and 70% (the reproducibility work from CASS). The reasons are anatomical: the left main is short, disease is often diffuse along it, and there is frequently no normal segment to use as the reference. Oxford's general figure for moderate lesions is an inter-observer variability of around ±20%, and it warns that angiography can underestimate severity, in extreme cases by as much as 50%. In other words, the very band in which the decision is hardest is the band in which angiography is least reliable, and Brilakis calls functional or intravascular assessment essential there. He bases this on two studies. Hamilos and colleagues measured FFR in 213 patients with an angiographically equivocal left main: those with an FFR of 0.80 or more were managed without surgery and those below 0.80 had CABG, five-year survival was similar (89.8% and 85.4%), and 23% of lesions narrowed by less than 50% on quantitative angiography were significant by FFR. LITRO, taught under Route A below, did the same for IVUS.",
        },
        {
          kind: "check",
          stem: "In good views a distal left main narrowing is estimated at 55% by one operator and 40% by another. The patient has exertional angina. What is the next step?",
          options: [
            "Treat it as significant, because any left main narrowing above 50% needs revascularisation",
            "Average the two estimates to 47.5% and defer, because the mean is below the 50% threshold",
            "Measure it: IVUS minimum lumen area, or physiology in the LAD and circumflex with pullback",
            "Take more selective acquisitions until both observers agree within ten percentage points",
          ],
          answer: 2,
          explanation:
            "Between 30% and 70% the eye is unreliable in the left main, and Brilakis calls functional or intravascular assessment essential for intermediate lesions. Averaging estimates does not fix a measurement that lacks a reference segment, and repeated selective injections add dissection risk without adding information. The 50% threshold applies to a measured stenosis, which is exactly what is in doubt here.",
        },
        { kind: "h", text: "Step 4: settle the intermediate lesion" },
        {
          kind: "steps",
          title: "Two routes to an answer",
          items: [
            {
              title: "Route A: IVUS (preferred for the ostial left main)",
              detail: "The left main is the one place where Brilakis uses imaging area to decide whether a lesion is significant. He takes a minimum lumen area below 6.0 mm² by IVUS, or below 5.4 mm² by OCT, as significant and needing revascularisation. IVUS is the better tool at the ostium: it needs no contrast flush and penetrates further, which Oxford says suits large vessels, the left main and aorto-ostial lesions; Brilakis notes that the ostial left main is hard to clear for OCT and that there were no outcome data for OCT in the left main when he wrote.",
            },
            {
              title: "What the 6.0 mm² rule rests on, and the grey zone",
              detail: "LITRO applied the 6.0 mm² IVUS rule prospectively in 354 patients with intermediate left main lesions: deferral at 6 mm² or more proved safe at two years (cardiac death-free survival 97.7% deferred against 94.5% revascularised), so the evidence is strongest for deferring above the line. The 2026 EAPCI and European Bifurcation Club consensus treats an MLA of 4.5–6 mm² as a grey zone in which invasive physiology should be considered, together with high-risk plaque features and the clinical picture. It asks for pullbacks from both the LAD and the circumflex and for the smaller of the two MLAs to be used, because a single pullback can overestimate the area. It accepts OCT as an alternative to IVUS for the distal left main in experienced hands (the 264 left main patients in OCTIVUS had equivalent outcomes with either), while favouring IVUS when disease reaches the ostium or kidney disease is advanced.",
            },
            {
              title: "Read the number in context",
              detail: "The threshold depends on the population: 4.5 mm² has been proposed for Korean patients, whose coronary arteries are smaller (Park and colleagues found that cut-off against FFR in 112 patients with intermediate ostial or shaft disease). At the ostium, the coronary leaves the aorta at a slant, so Brilakis warns that a two-dimensional IVUS area there must be interpreted with care before it decides treatment. Oxford also uses the pre-PCI IVUS run to measure the reference diameter and the length of disease for planning.",
            },
            {
              title: "Route B: physiology in both branches",
              detail: "FFR or a resting index can be used. For an ostial left main, disengage the guide so that damping does not raise the reading (give adenosine into the artery and then disengage, or use it intravenously). Place the wire in the LAD and then in the circumflex, each with a pullback, to see whether the pressure step sits in the left main. A normal value in one branch with an abnormal one in the other suggests the left main is not the problem.",
            },
            {
              title: "Beware downstream disease",
              detail: "A stenosis further down the LAD or circumflex limits the maximal flow through the left main, so the distal pressure reads higher and the left main is underestimated.",
            },
            {
              title: "Beware discordant indices and heart failure",
              detail: "Resting and hyperaemic indices disagree in about 14% of lesions, and Brilakis notes that the disagreement is particularly common in large arteries such as the left main and the proximal LAD, and in diabetes; when they disagree, he decides on the clinical presentation. In heart failure with a high right atrial pressure and LVEDP, FFR is affected: it can be corrected for venous pressure, FFR = (Pd − Pv)/(Pa − Pv), but he advises avoiding functional assessment in such patients. He does not name an alternative at that point; it is this module's inference that IVUS area (Route A, 17.13.1) is the natural choice, because it does not depend on pressures.",
            },
          ],
        },
        { kind: "tip", id: "pci-lm-ivus-for-ostium" },
        { kind: "tip", id: "pci-img-lm-threshold" },
        { kind: "tip", id: "pci-phys-left-main-both-branches" },
        {
          kind: "check",
          stem: "You want to know whether an intermediate ostial left main lesion is significant. The guide damps whenever it is seated. Which plan follows the manuals?",
          options: [
            "OCT, because its higher resolution measures the ostium more accurately than IVUS can",
            "FFR with the guide seated, since a damped trace makes the result more conservative",
            "Diagnostic angiography alone in two more projections, then a decision by eye",
            "IVUS rather than OCT, reading the slanted two-dimensional ostial area with care",
          ],
          answer: 3,
          explanation:
            "IVUS needs no contrast clearance and both manuals prefer it for the left main and aorto-ostial lesions (the guide must come off the ostium for physiology, which is the next step if the area falls in the grey zone); Brilakis adds that the slanted take-off makes a two-dimensional ostial area something to interpret carefully. OCT struggles to clear an ostial left main. A seated, damped guide falsely raises FFR and so underestimates the lesion, the opposite of conservative. More pictures do not solve the lack of a reference segment.",
        },
        { kind: "h", text: "From assessment to decision" },
        {
          kind: "p",
          text: "Brilakis's left main decision rests on five things: stable or acute presentation, the extent and complexity of disease and whether revascularisation can be complete, LV function, comorbidities such as diabetes, and the patient's preference. In good surgical candidates without diabetes he describes similar benefit from PCI or CABG with a SYNTAX score of 0–22 or 23–32, and usually more benefit from CABG at 33 or more (his Table 7.1 takes the same cut-offs from the 2018 ESC/EACTS guideline); he notes that the question remains contested and leaves the decision to the heart team (pm-target teaches the score and the algorithm). Among the groups in whom revascularisation may improve prognosis, and not only symptoms, he lists left main stenosis above 50% (7.1.7). His heart-team algorithm (Fig. 17.2, after Ramadan and colleagues) runs as follows: after previous CABG, or when the patient is not a good surgical candidate, PCI is chosen if its benefits outweigh its risks, and otherwise there is no revascularisation; in a good surgical candidate the extent of disease is scored, a SYNTAX score below 33 leaving PCI or CABG open, while at 33 or more CABG is chosen when its benefits outweigh its risks and PCI is weighed when they do not; the patient's preference bears on every branch. Oxford (2nd edition, 2020), whose left main section draws on earlier registry data, says that elective left main PCI remains controversial, with its indications a protected left main, refusal of or unsuitability for CABG, suitable anatomy after informed discussion, and trials; urgent left main PCI is for dissection or other complications involving the left main during PCI, and for primary PCI.",
        },
        {
          kind: "table",
          caption: "Five-year results of EXCEL and NOBLE, the two largest contemporary randomised left main trials (both cited by Brilakis, 17.7)",
          head: ["Trial", "Patients", "Primary outcome at 5 years", "Other findings"],
          rows: [
            ["EXCEL (Stone 2019)", "1905; left main disease of low or intermediate anatomical complexity", "Death, stroke or MI: 22.0% PCI vs 19.2% CABG, not significantly different", "All-cause death 13.0% vs 9.9%; ischaemia-driven revascularisation 16.9% vs 10.0%; all cerebrovascular events fewer after PCI (3.3% vs 5.2%) with stroke not significantly different"],
            ["NOBLE (Holm 2020)", "1201; unprotected left main disease", "MACCE (death, non-procedural MI, repeat revascularisation, stroke): 28% PCI vs 19% CABG; CABG superior", "Mortality 9% in both arms; non-procedural MI 8% vs 3%; repeat revascularisation 17% vs 10%"],
          ],
        },
        {
          kind: "p",
          text: "European guidance has moved on since the manuals, which take their SYNTAX cut-offs from the 2018 ESC/EACTS guideline. The 2024 ESC guideline on chronic coronary syndromes makes CABG the overall preferred mode of revascularisation for significant left main stenosis in patients at low surgical risk, because spontaneous MI and repeat revascularisation are less frequent after it (class I, level A). PCI keeps a place on one condition, that it can achieve revascularisation as complete as CABG would: it is then recommended as an alternative to CABG for low-complexity disease with a SYNTAX score of 22 or less (class I, level A), and it should be considered for intermediate complexity with a score of 23–32 (class IIa, level A), in both cases because it is less invasive and survival is not inferior. The 2018 class III against PCI for left main disease with a score of 33 or more is no longer in the table; for patients at high surgical risk the guideline says PCI may be considered over medical therapy alone (class IIb, level B), which the 2026 EAPCI and European Bifurcation Club consensus summarises as PCI for more complex disease in patients unsuitable for CABG. So the manual's PCI-or-CABG band of 0–32 still holds in outline: at 23–32 PCI remains an option for a patient who could have surgery, with a weaker recommendation than at 22 or less, and it is not reserved for patients unsuitable for CABG.",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting without the old films and operation notes, and discovering the occluded RCA only when the pressure falls during the first left injection.",
            "Injecting through a damped catheter to get a better picture of the ostium: this is how left main dissections are caused.",
            "Reading the ostium from one projection: it is oval, so a single view can make a tight lesion look mild.",
            "Deciding an intermediate left main by eye between 30% and 70%.",
            "Using OCT for an ostial left main, or a Western IVUS cut-off without thinking about vessel size and population.",
            "Measuring FFR from the LAD only, or with the guide seated in an ostial lesion.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first left injection, say the RCA status aloud to the team. If the RCA is occluded or the circulation is left dominant, everyone knows that injections will be short, the catheter will come out at the first sign of damping, and the pressure will be watched rather than glanced at.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the left main with a JL4 and watch the pressure as the tip seats. If the trace damps, withdraw without injecting and take a non-selective image. Then acquire AP, RAO caudal, RAO cranial, LAO cranial and LAO caudal, and state which two views show the ostium least foreshortened.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Run IVUS across an intermediate left main lesion, measure the minimum lumen area and the reference diameter, and decide whether the lesion is significant against the 6.0 mm² threshold. Then state how your answer would change for a patient population in which 4.5 mm² has been proposed.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "grade",
          params: { artery: "LCA" },
          task: "Grade left coronary stenoses on real runs. Whenever the lesion is in the left main, apply the 50% threshold, and say whether your estimate falls in the 30–70% band where the manuals want IVUS or physiology instead of the eye.",
        },
        { kind: "video", id: "NQBd2Z4TD-k", note: "Brilakis on left main PCI (Manual of PCI, section 17.1)." },
        { kind: "video", id: "Wmw8eE8LSuw", note: "Case 28 from the PCI Manual: ad hoc left main PCI." },
        {
          kind: "keypoints",
          items: [
            "Before the case: RCA disease or occlusion, RCA collaterals, graft protection, heavy calcium, then LV function, haemodynamics, presentation and comorbidity.",
            "Damped catheter: no injection; causes are a left main stenosis, the tip against the wall, spasm, or a short left main with selective LAD or circumflex entry.",
            "Short injections with left dominance or an occluded RCA; nitroglycerin first; few acquisitions at an ostial lesion.",
            "Views: AP first; bifurcation in RAO caudal, AP caudal, LAO caudal; ostium in LAO caudal and LAO cranial; stent edge in LAO cranial or AP cranial; always orthogonal views.",
            "Significant at 50% or more (Brilakis) or above 50% (Oxford); the eye is reliable at 70% or more, not between 30% and 70%.",
            "IVUS MLA below 6.0 mm² (OCT below 5.4 mm², unvalidated) is significant for Brilakis; LITRO showed deferral at 6 mm² or more is safe; 4.5–6 mm² is a grey zone for physiology (2026 consensus); 4.5 mm² proposed in Korean patients; use the smaller MLA of the two pullbacks; read ostial areas with care.",
            "Physiology: guide off an ostial lesion, both branches with pullback; downstream disease hides left main severity; resting and hyperaemic indices often disagree in the left main; avoid FFR with high RA pressure and LVEDP.",
            "EXCEL and NOBLE at 5 years: more repeat revascularisation after PCI; NOBLE found CABG superior for its composite. The 2024 ESC guideline prefers CABG, recommends PCI for low-complexity disease (SYNTAX 22 or less) and says it should be considered at 23–32, in both cases only if revascularisation can be as complete as with CABG.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-left-main-technique",
      title: "Left main PCI step by step: access to the ostial and shaft stent",
      minutes: 18,
      topics: ["cx-lm-pci"],
      sources: [
        { book: "brilakis-pci", loc: "17.2" },
        { book: "brilakis-pci", loc: "17.4" },
        { book: "brilakis-pci", loc: "17.5" },
        { book: "brilakis-pci", loc: "17.8" },
        { book: "brilakis-pci", loc: "17.9" },
        { book: "brilakis-pci", loc: "17.10" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "8" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "19.5" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "brilakis-pci", loc: "13.1" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 8: Multivessel PCI" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
        { book: "oxford-cath", loc: "ch 10: Iatrogenic type A aortic dissection" },
        { book: "brilakis-pci", loc: "4.1" },
      ],
      refs: [...BOOKS, "esc-revasc-2018", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Left main PCI follows the same steps as any PCI, but each step has a left main version. The common thread is time: the patient tolerates only short periods of reduced left main flow, so every manoeuvre that might obstruct the ostium, a deep guide, a long injection, a long inflation, is planned and kept brief. The anatomy also works in your favour: Oxford explains that the left main has become a target for PCI because it is wide, rarely tortuous and its lesions are short, which lowers the risk of restenosis. This lesson walks through the case to the end of an ostial or shaft stent, then teaches the bail-out for the complication everyone fears, left main dissection. The distal bifurcation is lesson 3; aorto-ostial stenting in general is taught in cp-ostial.",
        },
        { kind: "h", text: "Monitoring, access and guide" },
        {
          kind: "steps",
          title: "Set up before you engage",
          items: [
            {
              title: "1. Monitor for sudden deterioration",
              detail: "Left main patients can deteriorate fast. Put defibrillator pads on before the case, and if the pressure falls start a vasopressor such as noradrenaline early rather than waiting (Brilakis 17.2).",
            },
            {
              title: "2. Choose the access",
              detail: "For the left main itself Brilakis accepts either radial or femoral access, and may prefer femoral when the anatomy is highly complex; for highly complex aorto-ostial work femoral access with a 7 or 8 Fr guide gives more support, at the price of damping more readily (15.1.4). The two routes are not equal by default, though. In his access chapter he quotes the 2018 ESC guideline, which prefers radial access for any PCI unless procedural considerations override it (4.1), and the 2023 ESC guideline on acute coronary syndromes keeps radial as the standard approach (class I) with the same exception. In left main work the considerations that can override it are the need for a 7 or 8 Fr guide for support, large burrs or two-stent techniques that the radial artery may not accommodate, and the large-bore femoral access a support plan may need (lesson 4). Decide the route before the case and record the reason.",
            },
            {
              title: "3. Choose the guide size",
              detail: "For a left main bifurcation, 7 or 8 Fr guides are preferred: they support better and allow techniques such as V-stenting. Most bifurcation techniques can be done through 6 Fr, but V-stenting and simultaneous kissing stents need at least 7 Fr, and a larger lumen makes it easier to pass two devices (16.2.5). For an isolated aorto-ostial lesion the logic runs the other way: a smaller guide (such as 6 Fr) damps less (15.1.5). Decide which problem dominates in your patient.",
            },
            {
              title: "4. Choose the guide shape",
              detail: "Brilakis prefers supportive EBU or XB shapes for the left main (16.2.5; for calcium, 7 or 8 Fr in these shapes, 19.5). A smaller curve (EBU 3.0 or 3.5) favours LAD work and a larger one (EBU 4.0 or 4.5) favours the circumflex (5.7.2.1).",
            },
            {
              title: "5. Never a side-hole guide in an unprotected left main",
              detail: "Side holes let blood into the guide and keep the pressure trace looking normal while the tip blocks the ostium, so ischaemia goes unnoticed until the patient collapses. The single exception Brilakis makes is the ostial left main chronic total occlusion. With a short left main the danger is greatest: a guide that slips deep into the LAD can block the circumflex ostium completely while the side holes keep the trace pseudonormal and perfuse the LAD. Side holes also do not protect the ostium: an injection through them can still dissect it (5.6.4.3, 30.2.5).",
            },
          ],
        },
        { kind: "tip", id: "pci-left-main-early-noradrenaline" },
        { kind: "tip", id: "pci-lm-no-side-hole-guide" },
        { kind: "h", text: "Engagement" },
        {
          kind: "steps",
          title: "Engaging a diseased left main (Brilakis 17.5 and 15.1.5)",
          items: [
            {
              title: "1. Preload for a severe ostial lesion",
              detail: "Advance a guidewire to the tip of the guide before you engage, and often a balloon on it, so that the moment the guide seats you can wire, and if needed dilate, then back the guide off. Brilakis's alternative is to pass the wire while the guide sits non-selectively at the ostium, which lowers the risk of ischaemia and ostial trauma (15.1.1).",
            },
            {
              title: "2. Watch the pressure continuously",
              detail: "Ostial left main disease can damp severely and cause extensive ischaemia. Take the guide off as soon as the trace damps, before the pressure falls or the ostium is injured.",
            },
            {
              title: "Reduce damping before it happens",
              detail: "Brilakis's measures for aorto-ostial work: keep the guide shallow rather than deep, use a smaller guide where the strategy allows, back the guide out and work through a short guide extension catheter, hold it off the ostium with a floating wire in the aortic root or a dedicated ostial positioning device, and for isolated aorto-ostial disease prefer a less aggressive shape, which is easier to engage and disengage repeatedly but supports less than an aggressive curve (15.1.5). His examples there, the JR4 and the IM for a shepherd's crook origin, are right coronary shapes from a general section on ostial lesions, not left main guides; he names no left main curve for this purpose (cp-ostial covers aorto-ostial lesions in general).",
            },
            {
              title: "3. Work from just outside the ostium",
              detail: "Once a wire is in the vessel, disengage the guide intermittently to relieve the ischaemia. Brilakis prefers to disengage by torquing the guide off axis rather than pulling it back, which can drag the wire out. The independent-hand technique (left hand on the guide, right hand on the device) and a floating wire in the aortic root help control the guide; an extra-support wire in the vessel also makes engagement and disengagement easier.",
            },
            {
              title: "4. Inject only with a free trace",
              detail: "Contrast pushed into a damped catheter can split the ostium and the dissection can run down the artery or back into the aorta. Inject gently by hand and avoid power injectors here.",
            },
            {
              title: "5. Keep injections short with left dominance or an occluded RCA",
              detail: "Long injections in these patients can drop the pressure.",
            },
          ],
        },
        { kind: "tip", id: "pci-lm-preload-wire-ostial" },
        { kind: "tip", id: "pci-lm-damped-torque-off" },
        { kind: "tip", id: "pci-lm-injections-dominance" },
        {
          kind: "check",
          stem: "A 7 Fr EBU 3.5 with side holes is on the table for an unprotected distal left main case with a short left main. Why does Brilakis tell you to change it?",
          options: [
            "The trace can look normal while the tip blocks the circumflex, so ischaemia is hidden",
            "Side holes weaken the guide so much that it cannot support a stent through the left main",
            "Side holes let contrast escape, so the bifurcation cannot be imaged in the spider view",
            "Side holes are reserved for femoral access and should not be used from the radial artery",
          ],
          answer: 0,
          explanation:
            "Side holes mask damping. With a short left main, a guide that has slipped into the LAD can occlude the circumflex ostium completely while blood entering through the side holes keeps the waveform pseudonormal, leaving a large ischaemic territory unnoticed. Brilakis allows side-hole guides in a protected left main, the RCA and grafts, and in an unprotected left main only for an ostial CTO. Contrast loss through side holes is a real drawback but not the reason; guide strength and access route are not the issue.",
        },
        { kind: "h", text: "Wiring and lesion preparation" },
        {
          kind: "list",
          items: [
            "**Wiring.** Use a caudal view to choose between the LAD and circumflex from the left main (Brilakis 8). The difficult left main wiring problems are those of ostial lesions, bifurcations and trifurcations (cp-ostial, cp-bifurcation-provisional).",
            "**Prepare meticulously.** Brilakis treats thorough preparation as critical before any left main stent: balloon angioplasty, plaque modification balloons, and atherectomy if the lesion is heavily calcified. Aorto-ostial lesions resist dilatation and recoil, so primary stenting is avoided in most of them (15.1.10).",
            "**Ballooning an ostial left main.** Brilakis's rules for aorto-ostial preparation (15.1.9): place the balloon partly in the vessel and partly in the aorta, prefer non-compliant and longer balloons (about 30 mm), size them 1:1 with the vessel, and confirm full expansion, ideally with imaging, before any stent goes in. If the balloon squeezes forward into the vessel or back into the aorta (watermelon seeding), inflate slowly, 1 atm at a time while holding gentle backward tension, add a buddy wire, or change to a scoring, cutting or winged balloon, a longer balloon, intravascular lithotripsy or a very-high-pressure balloon. A lesion that still will not open goes to the balloon-undilatable algorithm (cp-ostial and cp-calcium teach both in full).",
            "**Atherectomy in the left main.** Most rotational atherectomy uses a 1.5 mm burr with a burr-to-artery ratio of about 0.5; burrs of 1.75 mm or larger are used infrequently, the left main being the exception. Check the guide: 1.25–1.75 mm burrs need at least 6 Fr, 2.0 mm at least 7 Fr, and 2.15–2.25 mm at least 8 Fr (19.9, Table 19.1). At an aorto-ostial lesion Brilakis uses the extra-support atherectomy wire, keeps the guide coaxial (which lowers the risk of perforation and aortic dissection and helps debulking), often starts the burr at the guide tip with the tension released so that it does not jump into the lesion and become trapped, and may need a larger burr than usual (15.1.9). Avoid damping during the runs, because it makes slow flow and no-reflow more likely, and expect burr advancement to be harder through guides with sharp bends such as Amplatz left shapes (19.9.5). Orbital atherectomy is also possible, but if the device is activated before it is engaged in the ostium the orbit is unconstrained and can injure or perforate the vessel. Brilakis constrains it in one of two ways: if the crown can cross, take it beyond the lesion and treat the ostium on the way back; if it cannot, make the guide coaxial and rest the nose cone in the ostium with the crown 5 mm short of the lesion. At a distal left main bifurcation only the atherectomy wire normally stays in the treated vessel, and the second wire is usually removed to avoid wire fracture, at the cost of a difficult rewire if the unwired branch dissects. To keep both wires, he runs the burr or crown through a guide extension placed over the atherectomy wire alone, when the calcium lies in the proximal side branch or the distal main vessel (a 7 Fr guide with a 6 Fr extension takes a 1.25 mm burr or crown, an 8 Fr guide with a 7 Fr extension a 1.5 mm burr), or protects the other wire inside a small microcatheter, moving it slowly while each run is under way so that the burr or crown does not keep wearing the same part of it (8 Fr guide), or accepts a small risk of damage to an unprotected side-branch wire, or uses laser atherectomy instead (16.2.9). The technique belongs to cp-calcium.",
            "**Inflate briefly.** Watch the aortic pressure during every left main balloon occlusion and keep inflations as short as possible, above all when there is no support device. Filling the indeflator with 70% saline and 30% contrast speeds inflation and deflation.",
          ],
        },
        { kind: "tip", id: "pci-lm-brief-inflations" },
        { kind: "tip", id: "pci-lm-hypotension-inflation" },
        {
          kind: "check",
          stem: "During a 20-second predilatation of a calcified left main body lesion, without support, the pressure falls from 120/70 to 75/45 mmHg. What is the right response?",
          options: [
            "Hold the balloon up until the full 60 seconds, since longer inflations dilate calcium better",
            "Give a rapid fluid bolus and continue the inflation, because hypotension is expected",
            "Deflate now, start a vasopressor early, and plan shorter inflations and support if it recurs",
            "Inflate a second balloon in the LAD to keep the territory perfused through the dilatation",
          ],
          answer: 2,
          explanation:
            "Brilakis asks you to watch the aortic pressure during left main occlusions, keep them as brief as possible (especially without support) and use vasopressors early if hypotension develops. Prolonging the occlusion deepens global ischaemia. A second balloon in the LAD would block flow further, not restore it. The cause is the occlusion itself, so the first step is to restore flow by deflating.",
        },
        { kind: "h", text: "Order of treatment" },
        {
          kind: "p",
          text: "If the LAD and circumflex also need stents and the left main narrowing is not critical, stent them first, because delivering equipment through a freshly stented left main is harder. If the RCA has significant disease, consider treating it first so that the left main PCI is safer. The same principle applies to any ostial stent: distal lesions first, because pushing devices through an ostial stent can deform it or strip equipment (15.1.10). Oxford, writing about multivessel PCI, describes another habit: the sequence is often left to the operator, and a common choice is to start with the hardest lesion, so that surgery is still an option if it fails, instead of finishing with some lesions untreated. The two are not exclusive (a non-critical left main can wait while the branches are treated), but when the left main is itself the hardest lesion the two books point different ways: know both and decide with the team before the case.",
        },
        { kind: "tip", id: "pci-lm-branches-and-rca-first" },
        { kind: "h", text: "Stenting the ostium and shaft" },
        {
          kind: "steps",
          title: "Ostial and shaft left main stent (Brilakis 17.10 with 15.1.10; Oxford left main stem PCI)",
          items: [
            {
              title: "1. Size the stent",
              detail: "Choose the diameter from the distal reference and the length from IVUS so that the whole lesion is covered (Oxford: IVUS before PCI for the reference diameter and the length). Visual estimates tend to undersize the left main, which Oxford links to malapposition, restenosis and stent thrombosis. A stent that will cross from the left main into a branch must be one that can be expanded to the left main diameter: check its labelled post-dilatation limit, and remember that peripheral stents exist for vessels of 6 mm or more (Brilakis 10.2). Brilakis also advises stents longer than 8 mm at an ostium, for coverage and to lower the risk of embolisation.",
            },
            {
              title: "2. Decide where the stent ends",
              detail: "With a short left main, the stent may need to continue into the LAD, which makes it a provisional bifurcation stent (lesson 3). Oxford notes emerging data that restenosis may follow if the left main is not stented back to the ostium.",
            },
            {
              title: "3. Advance, then disengage",
              detail: "Advance the stent across the lesion, then take the guide off the ostium. The two move against each other: pulling the guide back can push the stent forward, and withdrawing the stent can pull the guide in, so keep the stent just outside the guide and move them as one, or disengage by pushing on the wire.",
            },
            {
              title: "4. Position 1–2 mm into the aorta",
              detail: "Pull the stent back until it protrudes 1–2 mm into the aorta, with the guide just outside the ostium so it does not obstruct it but close enough to opacify it. Brilakis uses AP cranial for this in the left main (15.1.10) and asks for confirmation in several views, particularly LAO cranial (17.10). A breath hold, a floating wire marking the ostium and knowing where your platform's stent edge lies relative to its markers all reduce error.",
            },
            {
              title: "5. Deploy, then flare",
              detail: "Deploy with the indeflator connected and ready. Then withdraw the stent balloon partly into the aorta and inflate it at high pressure to flare the few millimetres of overhanging struts, so that the guide can re-engage later without crushing them.",
            },
            {
              title: "If the stent sits too far out, or recoils",
              detail: "Brilakis's remedies (15.1.10.4). Too much stent in the aorta: flare the overhang with a short (6–8 mm) oversized balloon or a dedicated flaring balloon, and consider prolonged dual antiplatelet therapy; if more than half the stent lies outside the ostium it can sometimes be snared and removed, at the risk of coronary injury or embolisation. Acute recoil: post-dilate again and wait a few minutes; if it recurs, place a stent built for high radial force, for example a peripheral one, inside the recoiled stent. His Fig. 15.13 shows exactly this at a heavily calcified ostial left main, rescued with a 5.0 mm renal stent, so choose platforms with good radial strength for aorto-ostial work from the start. To avoid missing the ostium in the first place he adds anchoring a second wire through a proximal stent strut into the aorta (the Szabo technique, which can deform or dislodge the stent), an ostial positioning device, rapid pacing when the stent moves excessively, IVUS to mark the true ostium against a fluoroscopic landmark such as calcium, and, through an 8 Fr guide, IVUS-guided deployment.",
            },
            {
              title: "6. Re-engage gently",
              detail: "Advance the guide over the balloon, aligned, and never force it against resistance: an ostial stent deforms easily.",
            },
            {
              title: "7. Assess the result",
              detail: "Damping should have gone (unless the vessel is no larger than the guide). Use a large enough injection to see contrast spill back into the aorta, because a small puff can hide a residual ostial narrowing, and keep a short length of wire in the artery so the guide stays at the ostium. Then image: IVUS confirms ostial coverage with struts protruding into the aorta and adequate expansion, and in the left main Brilakis makes imaging of both branches mandatory (lesson 3).",
            },
          ],
        },
        { kind: "tip", id: "pci-lm-ostial-stent-position" },
        { kind: "tip", id: "pci-lm-stent-expansion-limit" },
        {
          kind: "check",
          stem: "After an ostial left main stent the angiogram looks good, but IVUS shows that the proximal edge of the stent sits 2 mm inside the ostium. How could the angiogram have misled you, and what follows?",
          options: [
            "IVUS overestimates ostial distance in a slanted take-off, so the result can be accepted",
            "The balloon shoulder dilated the true ostium; a second stent is needed to cover it",
            "The flare inflation always covers 2 mm of uncovered ostium, so no further action is needed",
            "Missing the ostium is harmless in the left main because the aortic wall supports it",
          ],
          answer: 1,
          explanation:
            "Brilakis explains that geographic miss at an ostium is underdiagnosed by angiography because the shoulder of the stent balloon dilates the true ostium and gives a false impression of full coverage; that is why he strongly recommends imaging, preferably IVUS, after deployment. The fix for a missed ostium is another stent covering it. Flaring a stent that does not reach the ostium cannot add coverage, and residual ostial disease is a restenosis risk, not harmless.",
        },
        { kind: "h", text: "When the left main dissects" },
        {
          kind: "p",
          text: "Oxford puts the incidence of iatrogenic left main dissection at 0.02%, rare, but with a very large territory suddenly at risk and rapid haemodynamic collapse. Its causes are the guide (especially 7 or 8 Fr), contrast injected with the guide pointing at the roof of the left main, wiring (more often with polymer-covered or hydrophilic-coated wires), balloon dilatation and stent-edge dissection. Brilakis's list for any coronary dissection adds contrast injected despite a damped trace, a non-coaxial guide, lesion preparation (oversized balloons above all, and atherectomy or laser), balloon rupture, and heavily calcified, tortuous lesions. Its prevention follows from the list: no injection with a damped trace, a coaxial guide, no aggressive wiring and no polymer-jacketed wire as the workhorse, no oversized balloons or very high pressures, and proper preparation of calcium (25.2.1).",
        },
        {
          kind: "steps",
          title: "Bail-out (Brilakis 17.5, 5.6.4.3 and 25.2.1; Oxford chapter 10)",
          items: [
            {
              title: "Is it a dissection that needs treatment?",
              detail: "Brilakis treats small dissections that do not limit flow conservatively, and notes that a dissection at the proximal edge of a new stent usually needs nothing, because the stent stops it propagating forwards; OCT finds such dissections more readily than IVUS (25.2.1). A flap at the left main ostium or in the shaft is a different matter: the territory is large and Brilakis wants proximal dissections stented quickly, so the steps below apply.",
            },
            {
              title: "1. Keep the wire",
              detail: "If a wire is already in the true lumen, do not lose it.",
            },
            {
              title: "2. Stop selective injections",
              detail: "Disengage the guide and take only cautious, non-selective injections from a distance to understand the problem without extending the flap.",
            },
            {
              title: "3. Confirm the lumen",
              detail: "If the vessel must be rewired, confirm true-lumen position with IVUS rather than contrast; Oxford prefers IVUS to OCT here because OCT's contrast flush can expand the false lumen, and Brilakis likewise confirms the wire with IVUS, without contrast, at an ostial dissection (15.1.5). Brilakis notes that OCT detects dissections better than IVUS, but its flush can extend them (Table 13.2, 25.2.1). If the bifurcation is involved, both the LAD and circumflex wires must be in the true lumen.",
            },
            {
              title: "4. Seal the entry fast",
              detail: "Prepare a stent at once and deliver it quickly to seal the entry point; proximal dissections such as the left main need rapid stenting.",
            },
            {
              title: "5. Get access for support",
              detail: "Oxford asks for femoral access ready for a balloon pump or microaxial pump.",
            },
            {
              title: "6. If the stent will not go",
              detail: "If calcium, tortuosity or anything else stops the stent, dilate with a balloon or use a guide extension catheter first; occasionally a prolonged balloon inflation alone is enough, though a stent is better where it can be delivered (25.2.1).",
            },
            {
              title: "7. If the wire is lost or outside the true lumen",
              detail: "Brilakis's sequence (25.2.1): try further wires alongside the first (parallel wiring), and confirm the distal true lumen with IVUS, or by injecting a vessel that sends collaterals to the dissected artery, if there is one (for a left main dissection that usually means the RCA). Do not inject contrast through a microcatheter that may be subintimal, because it widens the false space and makes re-entry harder; instead advance the microcatheter and then a workhorse wire, which runs freely to the distal vessel only if it is in the true lumen. If that fails, use CTO methods to reach the distal true lumen (a re-entry balloon system, retrograde crossing or subintimal tracking and re-entry). When a diagnostic catheter caused the dissection, a wire can be passed through it into the true lumen and a second guide engaged from another arterial access (the 'ping-pong' technique, 5.6.4.3).",
            },
            {
              title: "8. If the true lumen still cannot be wired",
              detail: "Brilakis names left main dissection as a situation in which emergency surgery may be needed when the distal true lumen cannot be entered.",
            },
            {
              title: "If the stain reaches the aorta",
              detail: "Contrast staining the aortic wall around the ostium means an aorto-coronary dissection. Stop injecting into the artery, and stent the ostium to seal the entry, often with high-pressure flaring of the stent; if ordinary stents leave the leak open, a covered stent can be used, though it raises the risk of restenosis and thrombosis (Brilakis 5.6.4.4). His aorto-coronary dissection section (25.2.1.1) adds the detail. The usual causes are deep engagement with an aggressive guide such as an 8 Fr Amplatz left, a damped guide, forceful injection through a wedged guide, predilating the ostium and balloon rupture (with retrograde CTO manoeuvres in the RCA). The sealing stent must be one that can be expanded enough to close the dissection, protruding 1–2 mm into the aorta, and placed under IVUS guidance so that the ostium is fully covered. If you must see the distal vessel, advance a dual-lumen microcatheter, or an aspiration catheter, into it and inject through that, never through the guide. After a large dissection, repeat CT or transoesophageal echo until it has stabilised or resolved, particularly when the ascending aorta is involved, and keep the blood pressure tightly controlled. Few PCI-induced aorto-coronary dissections need an operation. Brilakis keeps surgery for new aortic regurgitation, pericardial rupture with tamponade, or a dissection that continues to spread; one proposed threshold is spread beyond 40 mm from the ostium. An ostial lesion caused by an aortic dissection that the patient presents with is different and needs emergency surgery with aortic root replacement. Oxford adds that an iatrogenic type A dissection tends to contain itself, so a conservative approach can be taken first, with CT after the procedure and again at 24 hours; stenting the ostium where the tear began can seal the entry, and surgery should be considered if the dissection spreads towards the neck vessels with neurological symptoms, a pericardial effusion appears or grows, severe aortic regurgitation develops, or the patient becomes unstable.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Oxford's decision for left main dissection (Table 10.1, in this module's layout)",
          head: ["", "Bifurcation spared", "Bifurcation involved"],
          rows: [
            ["Patient stable", "PCI; a conservative approach can be considered for a low-grade dissection without impaired flow", "Cardiac surgery is the reference; otherwise PCI with a two-stent technique"],
            ["Patient unstable", "PCI", "Discuss surgery, but timing and logistics are usually against it: PCI with a two-stent technique. In extreme cases simultaneous kissing stents can rescue a rapidly deteriorating patient, at the cost of a large guide and a long neo-carina in the left main"],
          ],
        },
        { kind: "tip", id: "pci-lm-dissection-bailout" },
        {
          kind: "pitfalls",
          items: [
            "A side-hole guide in an unprotected left main, or a deep guide in a short left main, with a trace that looks reassuring.",
            "Pulling the guide straight back to disengage and losing the wire across an ostial lesion.",
            "Long inflations without watching the aortic pressure, especially when no support device is in place.",
            "Primary stenting of a fibrotic or calcified ostium that was never fully dilated.",
            "A stent from the left main into the LAD that cannot be post-dilated to the left main diameter.",
            "Stopping short of the ostium, or protruding far into the aorta, because the position was checked in one view.",
            "Forcing the guide back over a fresh ostial stent and deforming it.",
            "Continuing selective injections after a left main dissection has appeared.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you engage a tight ostial left main, have the wire at the guide tip and a balloon behind it, and agree with the team the word you will use to mean 'damped, coming off'. Most ostial left main disasters start with a guide that stayed seated for a few seconds too long.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Size an ostial left main stent from IVUS: choose the diameter from the distal reference, the length to cover the whole lesion, and check whether the platform's labelled post-dilatation limit reaches the left main diameter. Place it 1–2 mm into the aorta, deploy, flare the proximal edge, and confirm on IVUS that the ostium is covered.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Until a left main scenario exists, use the focal mid-LAD case to rehearse left main habits: an extra-support guide without side holes, the wire ready before engagement, short balloon inflations with the aortic pressure in view, and an injection that refluxes into the aorta at the end.",
        },
        { kind: "video", id: "CBFtofcFw5E", note: "Case 85 from the PCI Manual: ostial left main/LAD bifurcation stenting." },
        { kind: "video", id: "9a5X56Df99k", note: "Case 129 from the PCI Manual: unprotected left main PCI." },
        { kind: "video", id: "0zD56xzPKUU", note: "Case 209 from the Manual of PCI: left main occlusion after AVR." },
        { kind: "video", id: "fJFYyOQQRgM", note: "Case 189 from the Manual of PCI: left main thrombus." },
        {
          kind: "keypoints",
          items: [
            "Pads on, noradrenaline early if the pressure falls.",
            "7 or 8 Fr EBU or XB for a bifurcation; a smaller guide damps less at an isolated ostium.",
            "No side-hole guide in an unprotected left main (except an ostial left main CTO).",
            "Severe ostial lesion: wire, and often a balloon, at the guide tip before engaging; disengage at the first damping by torquing off axis; no injection with a damped trace.",
            "Prepare thoroughly; brief inflations with the aortic pressure in view; 70:30 saline:contrast in the indeflator.",
            "Branch lesions first if the left main is not critical; consider the RCA first.",
            "Ostial stent: 1–2 mm into the aorta, confirmed in several views (LAO cranial), flared, re-engaged gently, checked with IVUS; stents into a branch must expand to the left main diameter.",
            "Dissection: keep the wire, stop selective injections, IVUS for the lumen, stent fast, femoral access for support; if the wire is lost, parallel wiring, IVUS or a collateral injection, and CTO re-entry methods before surgery; a stain in the aortic wall means an IVUS-guided ostial stent 1–2 mm into the aorta, distal contrast only through a dual-lumen or aspiration catheter, imaging and blood pressure control, and surgery for aortic regurgitation, tamponade or extension.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-left-main-distal",
      title: "The distal left main: strategy, the jailed circumflex, trifurcations and the finish",
      minutes: 16,
      topics: ["cx-lm-pci"],
      sources: [
        { book: "brilakis-pci", loc: "17.10" },
        { book: "brilakis-pci", loc: "17.12" },
        { book: "brilakis-pci", loc: "17.13" },
        { book: "brilakis-pci", loc: "16.1" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "13.3" },
        { book: "brilakis-pci", loc: "13.4" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 8: Bifurcation PCI techniques" },
        { book: "brilakis-pci", loc: "12.1" },
      ],
      refs: [
        ...BOOKS,
        "dkcrush5-2017",
        "chen-dkcrush3-2013",
        "ebc-main-2021",
        "kang-lm-ivus-2011",
        "johnson-eapci-lm-imaging-2026",
        "definition-2014",
        "esc-ccs-2024",
        "testa-optimal-2026",
        "emara-lm-ivus-meta-2026",
        "gao-dkcrush8-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "Most left main PCI is bifurcation PCI, with the circumflex as the side branch in most cases. The questions are the same as for any bifurcation (cp-bifurcation-provisional and cp-bifurcation-two-stent teach each technique step by step), but the stakes are higher: both branches are large, the territory is most of the heart, and the main vessel above the carina is wider than either branch. Two general rules shape the preparation. Brilakis prepares the main vessel in every case but avoids ballooning the side branch when he plans a provisional strategy, because a side-branch dissection would then force a second stent; when two stents are planned, both branches are prepared routinely (16.2.9). Oxford adds that every extra stent has a price: drug-eluting stents may lower restenosis in complex bifurcation work, but deploying more than one may push up the stent thrombosis risk, by over 5% according to Oxford. This lesson teaches how to choose the strategy for a distal left main, what to do about the circumflex after a provisional stent, how to treat a trifurcation, and how to finish.",
        },
        { kind: "h", text: "Choosing the strategy" },
        {
          kind: "steps",
          title: "Brilakis's bifurcation questions, asked of the distal left main (16.1 and 17.10)",
          items: [
            {
              title: "1. Does the side branch need preserving?",
              detail: "Brilakis usually leaves branches under 2 mm unprotected and otherwise weighs size and territory.",
            },
            {
              title: "2. How likely is it to close after main-vessel stenting?",
              detail: "That depends on where the disease is (the Medina classification), how severe the side-branch disease is, the lesion morphology (calcium, thrombus, length; imaging helps) and the angle. In the definition used by the Bifurcation Academic Research Consortium (quoted in the 2026 EAPCI and EBC consensus), Medina 1,1,1, 1,0,1 and 0,1,1 are true bifurcations; Brilakis's left main rule and DKCRUSH-V name only 1,1,1 and 0,1,1, so check which definition a trial or a recommendation is using.",
            },
            {
              title: "3. Brilakis's left main rule",
              detail: "Provisional stenting is preferred for most left main bifurcations without significant disease in the side branch (usually the circumflex). For true left main bifurcations (Medina 1,1,1 or 0,1,1) he prefers a two-stent technique, especially double kissing (DK) crush, on the strength of the DKCRUSH trials.",
            },
            {
              title: "Refine it by circumflex complexity",
              detail: "The 2026 EAPCI and European Bifurcation Club consensus keeps a stepwise provisional strategy for most cases, escalating to culotte or T and small protrusion if the circumflex needs it, and reserves upfront circumflex treatment (DK crush, or an inverted provisional starting in the circumflex) for anatomy that makes circumflex access difficult or occlusion likely. Its markers of that risk are a circumflex diameter stenosis of 70% or more, an imaging MLA below 4 mm² or plaque burden above 55%, circumflex disease 10 mm or longer, significant calcium, and unstable plaque or thrombus; the Bifurcation Academic Research Consortium, quoted in the same document, calls a bifurcation complex when it is true (Medina 1,1,1, 1,0,1 or 0,1,1) and has one more feature: side-branch disease 10 mm or longer, thrombus, a calcium arc greater than 60° at the culprit site, or expected difficulty reaching the side branch, such as a retroflexed circumflex leaving the left main at less than 90°. The Academy lesson cx-lm-technique teaches the related DEFINITION criteria. So a true bifurcation with short, mild circumflex disease is usually started provisionally, and planned DK crush is most clearly justified when the circumflex disease is long, severe or otherwise complex.",
            },
            {
              title: "4. If two stents: which technique?",
              detail: "For a side-branch angle under 70°, DK crush, culotte or reverse crush, with DK crush preferred in most cases; for 70°–90°, T-stenting or TAP. Medina 0,1,1 can be treated with V-stenting (at least a 7 Fr guide), which is simple and keeps both wires in place throughout, but it creates a neo-carina that can hinder later wiring and equipment delivery. Simultaneous kissing stents are for emergencies only, because the long neo-carina makes later treatment very hard.",
            },
          ],
        },
        {
          kind: "table",
          caption: "The randomised evidence on distal left main strategy",
          head: ["Trial", "Patients", "Result", "What it means"],
          rows: [
            ["DKCRUSH-III (Chen 2013)", "419 with unprotected distal left main bifurcations; DK crush vs culotte", "One-year MACE 6.2% with DK crush vs 16.3% with culotte, mainly from more target vessel revascularisation; side-branch restenosis 6.8% vs 12.6%", "Why Brilakis calls culotte inferior to DK crush in the left main"],
            ["DKCRUSH-V (Chen 2017)", "482 with true distal left main bifurcations (Medina 1,1,1 or 0,1,1); DK crush vs provisional", "One-year target lesion failure 5.0% with DK crush vs 10.7% with provisional (hazard ratio 0.42); less target-vessel MI and stent thrombosis; no difference in cardiac death", "The basis of Brilakis's preference for DK crush in true left main bifurcations"],
            ["EBC MAIN (Hildick-Smith 2021, after the manual)", "467 with true left main bifurcations; stepwise layered provisional vs systematic dual stenting", "Death, MI or target lesion revascularisation at 12 months 14.7% provisional vs 17.7% dual (hazard ratio 0.8, P = 0.34); procedure time, X-ray dose and consumables favoured provisional", "Its authors conclude that stepwise provisional should remain the default for the distal left main"],
          ],
        },
        {
          kind: "p",
          text: "The two strands of evidence disagree, and you should be able to say so. Brilakis prefers a planned two-stent technique, especially DK crush, for true left main bifurcations (T-stenting or TAP if the angle is 70–90°). EBC MAIN, published afterwards, found no advantage for systematic dual stenting in true left main bifurcations and favoured a stepwise provisional approach. The trials did not ask quite the same question: DKCRUSH-V compared one planned two-stent technique, DK crush, with provisional stenting, whereas EBC MAIN compared a stepwise, layered provisional strategy with a systematic dual-stent approach. Oxford says any dedicated bifurcation technique may be used at the terminal left main, and that recent data favour the provisional technique for bifurcations in general. Neither manual could include EBC MAIN: know both positions, and record why you chose the strategy you used.",
        },
        { kind: "tip", id: "pci-lm-distal-strategy" },
        {
          kind: "check",
          stem: "A distal left main lesion is Medina 1,1,1, the circumflex angle is 60°, and IVUS shows long, heavy circumflex ostial disease. Which statement fairly represents the evidence?",
          options: [
            "Both manuals and every trial agree that provisional stenting is mandatory for any left main",
            "Culotte is the preferred two-stent technique here, as DKCRUSH-III showed it beat DK crush",
            "Simultaneous kissing stents suit this lesion best, as both large branches stay wired throughout",
            "Brilakis would plan DK crush here; EBC MAIN later found no advantage for planned dual stenting",
          ],
          answer: 3,
          explanation:
            "This is a true bifurcation with an angle under 70°, for which Brilakis prefers a two-stent technique, especially DK crush, citing DKCRUSH-V. EBC MAIN, published after the manual, found no significant advantage for systematic dual stenting in true left main bifurcations, and its authors kept stepwise provisional as the default. DKCRUSH-III found culotte inferior to DK crush, not the reverse. Simultaneous kissing stents are reserved for emergencies because of the long neo-carina.",
        },
        { kind: "h", text: "Provisional stenting of the distal left main, with the circumflex as side branch" },
        {
          kind: "steps",
          title: "The left main points at each step",
          items: [
            {
              title: "1. Wire both branches, and jail the circumflex wire properly",
              detail: "Wire the LAD and the circumflex with workhorse wires; if a polymer-jacketed wire was needed to reach either branch, exchange it for a workhorse wire before lesion preparation and stenting (16.2.8). Brilakis gives four reasons to leave the circumflex wire jailed under the cross-over stent: it helps keep the branch open and marks where it is if it closes; it changes the angle in a way that makes recrossing easier; it anchors the guide and adds support for later equipment; and in an emergency a low-profile balloon or a torquable microcatheter can be run over it to reopen the branch. Before jailing, pull the wire back so its radiopaque segment lies near the carina where you can see it, but do not jail the radiopaque segment itself, because that makes fracture more likely; make sure the tip is straight, not looped; and avoid jailing a long length of wire (16.2.10.1).",
            },
            {
              title: "2. Size the cross-over stent to the distal main vessel",
              detail: "Size the stent from the distal reference (usually the LAD), not from the left main: sizing to the larger proximal vessel risks distal dissection or perforation and shifts the carina into the side branch. Brilakis makes the same point for the side branch: sizing the main-vessel stent to the distal main vessel lowers the risk of side-branch compromise.",
            },
            {
              title: "3. Optimise the left main portion",
              detail: "Post-dilate the proximal part with a non-compliant balloon sized to the left main (the proximal optimisation technique). Brilakis's POT rules matter most in a short left main: the balloon diameter matches the proximal vessel, and an oversized POT balloon makes circumflex compromise more likely; the balloon is no longer than the stent segment above the carina, with its distal marker at the carina (too distal threatens the side branch, too proximal leaves the stent beside the ostium underexpanded); a balloon longer than that segment injures the vessel above the stent; and because the shortest balloons are 6 mm long, the stent must leave at least 6 mm, ideally 8–10 mm, above the carina. This only works if the stent can be expanded to the left main diameter, which is why the platform matters (lesson 2).",
            },
            {
              title: "4. Judge the circumflex",
              detail: "Brilakis calls an important side branch compromised if flow is below TIMI 3, the stenosis exceeds 70%, or there is an NHLBI type B or worse dissection; then restore flow. If the jailed circumflex ostium merely looks narrowed, give intracoronary nitroglycerin first, because spasm of a jailed branch can reverse, then assess it with imaging and physiology before deciding (next step). Use physiology only if the left main is not the culprit of an acute coronary syndrome. Oxford agrees that touching the side branch after a drug-eluting stent has not been shown to help unless the branch occludes.",
            },
            {
              title: "If the circumflex occludes",
              detail: "This is the emergency branch of Brilakis's provisional algorithm (16.2.10.1, Fig. 16.9), and in the left main it can mean a large ischaemic territory within seconds. First ask whether the circumflex can be rewired through the stent. If it can, rewire through a distal strut, and pull the jailed wire only after a low-profile balloon has passed into the circumflex, which proves that the new wire went through the stent struts rather than behind them; then kiss and finish with a POT. If it cannot, use the jailed wire: pass a 1.0–1.5 mm balloon over it partly into the occluded circumflex, or, if no balloon will cross, spin a torquable microcatheter in to make a channel, and dilate to restore flow. Then rewire the circumflex through the stent, ideally through a dual-lumen microcatheter so that the new wire does not slip behind struts lifted by the balloon, remove the jailed wire, kiss and repeat the POT. The other option is to convert to an inverted DK crush, treating the circumflex as the main vessel and the LAD as the side branch. In every route, a circumflex result that stays poor may still need a stent (T-stenting, TAP, reverse crush or culotte). Keep the pressor and the support plan in view while you work (lesson 4).",
            },
            {
              title: "If the jailed wire will not come out",
              detail: "Never pull hard. A jailed wire pulled forcefully can fracture or unravel, which may need emergency surgery, and the pull can drag the guide deep into the left main, where it can dissect it. Brilakis's sequence: steady, gentle traction; advance a small balloon or microcatheter up to the point where the wire is trapped and withdraw gently; or take a small balloon all the way down the branch and inflate it to free the wire, repeating the POT afterwards; rotating the wire with a torque device may also help (16.2.10.1).",
            },
            {
              title: "5. Decide on further treatment",
              detail: "If the circumflex FFR is above 0.80, or the resting index is above its cut-off, defer treating it. If the FFR is 0.80 or less, the branch needs treatment, provided it is at least 2 mm in diameter (12.1). Follow Brilakis's stepwise provisional sequence for a compromised side branch (16.2.10.1; EBC MAIN likewise tested a stepwise, layered provisional strategy): rewire the circumflex through a distal strut, remove the jailed wire, dilate with kissing balloons and repeat the POT, then re-assess; add a second stent by T-stenting, TAP, reverse crush or culotte (cp-bifurcation-two-stent) only if the result is still inadequate. Know that his two sections differ here: in the left main section (17.12.2) he goes straight to a second stent by one of those techniques when the circumflex FFR is 0.80 or less, whereas his general provisional algorithm (16.2.10.1, Fig. 16.9) first rewires, kisses and repeats the POT, which is the sequence this module uses. Brilakis's example: after left main stenting the circumflex ostium looked compromised, and FFR, with the pressure rising at the left main on pullback, confirmed a significant focal ostial circumflex stenosis.",
            },
            {
              title: "6. Do not kiss by routine",
              detail: "Brilakis sees no clear gain from kissing every provisional left main stent as a matter of routine. The European Bifurcation Club takes the opposite view: it recommends POT, distal rewiring of the circumflex and kissing as part of provisional left main stenting, and the 2026 consensus adds that imaging the circumflex ostium after a cross-over stent requires the struts to be cleared from it, best done by kissing. Neither position has randomised outcome proof. Know both. Brilakis's general bifurcation chapter describes kissing as not always necessary but able to improve the stent geometry, the coverage of the side-branch ostium and later access to it (16.2.10.1). If you kiss: rewire through a distal strut first; use short non-compliant balloons where they will cross (compliant ones are acceptable if high pressures are kept to a minimum); size the pair by Finet's law, in which two balloons inflated side by side behave like one of 0.678 × (diameter 1 + diameter 2), and that effective diameter should be close to the left main diameter; and consider a final POT (not always needed, depending on the kissing result) to correct the oval deformation that two balloons leave in the stent above the carina.",
            },
            {
              title: "7. After the case",
              detail: "Bifurcation stenting carries a higher risk of stent thrombosis, so Brilakis suggests considering prolonged dual antiplatelet therapy when the bleeding risk is low (16.2.3).",
            },
          ],
        },
        { kind: "tip", id: "pci-lm-jailed-circumflex" },
        { kind: "tip", id: "pci-lm-circumflex-occluded" },
        { kind: "tip", id: "pci-lm-jailed-wire-removal" },
        { kind: "tip", id: "pci-lm-no-routine-kissing" },
        {
          kind: "check",
          stem: "Straight after a left main-to-LAD cross-over stent the circumflex stops filling and the patient has chest pain. Several attempts to rewire the circumflex through the stent fail; the jailed circumflex wire is still in place. What is the next step?",
          options: [
            "Pull the jailed wire out firmly, then keep trying to rewire the circumflex through the stent struts",
            "Run a 1.0–1.5 mm balloon over the jailed wire into the circumflex, dilate, then rewire through the stent",
            "Accept the occluded circumflex, since provisional stenting means the side branch is left untreated",
            "Inflate a large non-compliant balloon in the left main to push the struts away from the circumflex",
          ],
          answer: 1,
          explanation:
            "When the occluded side branch cannot be rewired, Brilakis uses the jailed wire: a balloon of 1.0–1.5 mm, or a torquable microcatheter if no balloon crosses, is passed over it into the branch to restore flow, and the circumflex is then rewired through the stent, ideally through a dual-lumen microcatheter, before kissing and a final POT; converting to an inverted DK crush is the alternative. The jailed wire is the marker and the rescue route, so pulling it, and pulling hard in particular, throws away the way back and risks wire fracture and deep guide intubation. Provisional stenting does not mean abandoning a large circumflex, and a left main balloon is not a step in Brilakis's pathway for an occluded side branch (an oversized POT balloon is in fact one of the things that make side-branch compromise more likely).",
        },
        {
          kind: "check",
          stem: "After a left main-to-LAD cross-over stent and proximal optimisation, the circumflex ostium looks 60% narrowed with TIMI 3 flow and no dissection. Circumflex FFR is 0.87. What next?",
          options: [
            "Accept the result and defer a circumflex stent; confirm the whole complex with imaging",
            "Add a circumflex stent by T-stenting, because a 60% narrowing in the left main is significant",
            "Perform routine final kissing, since trials show it improves outcomes after provisional left main stenting",
            "Repeat the FFR with the guide deeply engaged so that the reading is more conservative",
          ],
          answer: 0,
          explanation:
            "Brilakis defers circumflex stenting when the FFR is above 0.80 (or the resting index is above its cut-off), and treats the branch only when it is 0.80 or less. The eye overestimates a jailed ostium, and this branch is not compromised by his criteria (TIMI 3, no dissection, not above 70%). He finds no clear benefit from routine kissing after provisional left main stenting, and although the European Bifurcation Club recommends kissing, no randomised trial has shown that it improves outcomes. A deeply seated guide damps the pressure and falsely raises FFR. Imaging of both branches is still mandatory at the end.",
        },
        { kind: "h", text: "The trifurcation" },
        {
          kind: "list",
          items: [
            "Trifurcating left mains are rare. The strategy follows side-branch involvement: without significant side-branch disease, a single stent.",
            "If a side branch is involved, any two-stent technique can be used; think about a last inflation with three balloons together ('trissing') so that the polygon of confluence stays open.",
            "Brilakis asks for a large (7 or 8 Fr) guide for these cases.",
          ],
        },
        { kind: "tip", id: "pci-lm-trifurcation" },
        { kind: "h", text: "Finishing every left main case" },
        {
          kind: "p",
          text: "Brilakis requires intravascular imaging, IVUS or OCT, at the end of every left main PCI, with pullbacks from both the LAD and the circumflex. The minimum lumen areas he asks for, to lower the risk of restenosis, are 5 mm² at the circumflex ostium, 6 mm² at the LAD ostium, 7 mm² at the polygon of confluence and 8 mm² in the left main above it. They come from Korean IVUS data: Kang and colleagues studied 403 patients after left main stenting and found that minimal stent areas of 5.0, 6.3, 7.2 and 8.2 mm² in those four segments best predicted restenosis, and that underexpansion of any segment went with more restenosis and more adverse events; his imaging chapter also gives a stent-area goal above 8.0 mm² for the left main or, as an alternative, more than 90% of the proximal reference for the proximal segment and of the distal reference for the distal one. These Korean figures, from sirolimus-eluting stents and nine-month angiographic restenosis, are minimums rather than goals. The 2026 EAPCI and European Bifurcation Club consensus notes that Western trials have challenged them (the IVUS substudies of EXCEL and NOBLE reached mean left main stent areas of 9.9 and 12.5 mm²), and asks you to judge each segment by its absolute area and by its expansion against the reference: contemporary left main studies use 80–90% of the reference lumen as the target, and over-expanding the left main merely to reach a number risks perforation. Oxford makes the same case from the other direction: undersizing by eye leads to malapposition, restenosis or thrombosis, and IVUS guidance avoids it. Extra stents may improve the angiogram but add restenosis and thrombosis risk, and Oxford notes that left main in-stent restenosis can be disastrous, so some operators repeat angiography 3–6 months after the PCI.",
        },
        {
          kind: "p",
          text: "Does imaging itself improve outcomes? Since the manuals, European guidance (the 2024 ESC guideline on chronic coronary syndromes) has recommended intravascular imaging to guide PCI of complex lesions, the left main among them, and the 2026 consensus welcomes that recommendation. The randomised evidence specific to the left main is mixed. OPTIMAL, the first randomised trial designed only for unprotected left main disease (806 patients), found no difference between IVUS-guided and angiography-guided PCI in its composite of death from any cause, MI, stroke or any revascularisation at a median of 2.9 years (33.7% vs 30.9%; hazard ratio 1.11, 95% CI 0.87–1.42). The consensus points out that its patients were complex (mean SYNTAX score 29.7), that only 65% of the IVUS arm had imaging before stenting, and that the post-stent pullback led to further optimisation in 29%. A 2026 meta-analysis of four randomised trials (1446 patients) found no significant reduction in major adverse events with IVUS guidance. On the other side, DKCRUSH VIII (555 complex bifurcations treated by DK crush, about 45% of them in the left main) found fewer target-vessel failures at one year with IVUS (6.1% vs 14.7%), and its authors attributed the benefit mainly to reaching the IVUS optimisation targets rather than to the use of IVUS alone. The practical message: a pullback helps the patient only if you measure each segment and act on what you find.",
        },
        { kind: "tip", id: "pci-img-lm-both-branches" },
        {
          kind: "pitfalls",
          items: [
            "Sizing the cross-over stent to the left main: distal dissection, perforation and carina shift into the circumflex.",
            "Predilating the circumflex when the plan is provisional, and creating the dissection that then forces a second stent.",
            "Jailing the radiopaque segment or a looped tip of the circumflex wire, or pulling hard on a trapped jailed wire and drawing the guide deep into the left main.",
            "Removing the jailed wire from an occluded circumflex before a balloon has confirmed that the new wire went through the struts.",
            "Stenting a jailed circumflex because it looks narrowed, without physiology or imaging.",
            "Kissing by habit after a provisional left main stent without a reason, or kissing through a proximal strut without repeating the POT.",
            "Going straight to a second circumflex stent for an FFR of 0.80 or less without first rewiring, kissing and re-optimising (the route Brilakis's general algorithm takes, although his left main section moves directly to a second stent).",
            "Choosing culotte for a left main bifurcation on the basis that it suits similar-sized branches, without knowing that DKCRUSH-III found it inferior to DK crush in the left main.",
            "Using simultaneous kissing stents in a non-emergency case.",
            "Imaging from the LAD only and missing an underexpanded circumflex ostium.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the four minimum areas (5, 6, 7, 8 mm² from circumflex ostium to left main) and each segment's reference lumen area on the board before the case. When the pullbacks come back, the team can check each segment against both numbers rather than against the angiogram.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "After a left main-to-LAD cross-over stent, give intracoronary nitroglycerin and measure FFR in the jailed circumflex with the guide disengaged from the ostium. If the FFR is above 0.80, defer; if 0.80 or less, state the stepwise plan (distal rewiring, kissing and repeat POT, then a second stent by T, TAP, reverse crush or culotte only if still inadequate). Pull back and say where the pressure step sits.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Provisional distal left main stenting: size the cross-over stent from the distal LAD reference, perform the proximal optimisation with a balloon sized to the left main and its distal marker at the carina, then run IVUS from the LAD and from the circumflex and compare the four segment areas with 5, 6, 7 and 8 mm² and with 80–90% of each segment's reference lumen area.",
        },
        { kind: "video", id: "IU43KJYIvu8", note: "Elias Hanna on bifurcation left main stenting." },
        { kind: "video", id: "S61z5nfoLuc", note: "Elias Hanna: bifurcation left main, part 2, case studies of two-stent techniques." },
        { kind: "video", id: "n6xcnJbgluU", note: "Elias Hanna on left main trifurcation strategies." },
        { kind: "video", id: "Z-gkM7As82k", note: "Case 126 from the PCI Manual: trifurcation left main PCI." },
        {
          kind: "keypoints",
          items: [
            "Brilakis: provisional for most distal left main lesions without significant circumflex disease; two stents, especially DK crush, for true (1,1,1 or 0,1,1) bifurcations. The 2026 consensus keeps provisional for most and reserves upfront circumflex treatment for complex circumflex disease (70% or more, 10 mm or longer, calcified, MLA below 4 mm²).",
            "DKCRUSH-III: culotte inferior to DK crush; DKCRUSH-V: DK crush beat provisional for one-year target lesion failure (5.0% vs 10.7%).",
            "EBC MAIN (after the manual): no advantage for systematic dual stenting in true left main bifurcations; provisional kept as the default. The sources disagree.",
            "Cross-over stent sized to the distal vessel, then POT to the left main with a platform that can expand that far.",
            "Jailed circumflex: nitroglycerin first; FFR above 0.80 defer; 0.80 or less, rewire, kiss and re-POT, and stent (T, TAP, reverse crush or culotte) only if still inadequate. Brilakis: no routine kissing; the European Bifurcation Club recommends it; neither has outcome proof. If you kiss, size by Finet (0.678 × the sum of the two diameters, close to the left main) and consider a final POT.",
            "Jailed wire: workhorse, straight tip, not across its radiopaque segment; never pull hard. Occluded circumflex: rewire through a distal strut if possible, otherwise a 1.0–1.5 mm balloon over the jailed wire, then rewire (dual-lumen microcatheter), kiss and POT, or convert to inverted DK crush.",
            "Trifurcation: single stent unless a side branch is diseased; consider trissing; 7 or 8 Fr.",
            "IVUS or OCT from both branches is mandatory: at least 5, 6, 7, 8 mm² from circumflex ostium to left main, and expansion of 80–90% of each segment's reference. OPTIMAL found no outcome benefit from IVUS guidance alone in the left main; the benefit seen in DKCRUSH VIII came mainly from meeting the optimisation targets.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-left-main-chip",
      title: "Complex high-risk indicated PCI and the protected left main",
      minutes: 15,
      topics: ["cx-chip", "cx-lm-pci"],
      sources: [
        { book: "brilakis-pci", loc: "14.1" },
        { book: "brilakis-pci", loc: "17.1" },
        { book: "brilakis-pci", loc: "17.14" },
        { book: "brilakis-pci", loc: "7.1" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "16.2" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "30" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "oxford-cath", loc: "ch 9: Mechanical circulatory support devices" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
        { book: "oxford-cath", loc: "ch 8: Multivessel PCI" },
      ],
      refs: [
        ...BOOKS,
        "kirtane-chip-2016",
        "protect-ii-2012",
        "perera-bcis1-2010",
        "perera-bcis1-longterm-2013",
        "perera-chip-bcis3-2026",
        "rihal-mcs-consensus-2015",
      ],
      blocks: [
        {
          kind: "p",
          text: "Complex high-risk indicated PCI (CHIP) describes the patient who has a clear reason to be revascularised but in whom the procedure itself is dangerous. Kirtane and colleagues, cited by Brilakis, framed this group as patients at high procedural risk from their comorbidities, the complexity of their coronary anatomy, poor haemodynamics, or a combination, and argued that treating them safely needs dedicated, specially trained operators and multidisciplinary assessment before the procedure; Brilakis counts support devices as part of a complex, high-risk PCI programme. The unprotected left main is the archetypal CHIP lesion. This lesson teaches how to recognise CHIP, what 'protected' means, how to decide on support for a left main case, and how to run the case; the device algorithm and the devices themselves are taught in pm-support-choice and pm-support-devices.",
        },
        {
          kind: "table",
          caption: "Oxford's definition: a CHIP case is defined by the coexistence of features from three groups",
          head: ["Group", "Features"],
          rows: [
            ["Complex coronary anatomy", "PCI of unprotected left main disease; multivessel PCI with a SYNTAX score above 33; PCI of the last patent vessel"],
            ["A high comorbidity burden", "Heart failure, severe valve disease, COPD, kidney failure, diabetes, old age, peripheral vascular disease, previous cardiac surgery, an acute presentation, electrical instability"],
            ["Haemodynamic compromise", "Ejection fraction below 35%, systolic pressure below 100 mmHg, or cardiac index below 2.2 L/min/m²"],
          ],
        },
        {
          kind: "p",
          text: "Two definitions are in use, so say which you mean. Oxford defines CHIP by the coexistence of features from the three groups in the table, read most naturally as at least one from each. Kirtane's broader framing counts high procedural risk from comorbidity, anatomical complexity and/or poor haemodynamics, so one or two groups may be enough. Oxford names protected PCI in CHIP patients as the first of three current indications for mechanical circulatory support (the others are cardiogenic shock and salvage in myocardial infarction), while stating that no trial has shown a convincing net survival benefit. Brilakis builds the same patient from the operator's side in his assessment of benefit and risk (7.1.8, Fig. 7.3), which rests on four areas. The impact of the disease (symptoms, ischaemic burden, myocardial function) sets the potential benefit. Operator experience and competence, including whether the operator and team are rested, raise the chance of success and the ability to manage complications. Lesion complexity (the left main is one of his complex subsets, with CTOs, bifurcations, calcium and multivessel disease) and comorbidities lower the chance of technical success and raise the risk: cardiac ones such as an acute coronary syndrome, prior CABG, heart failure, atrial fibrillation, a low ejection fraction, high filling pressures and valve disease, and non-cardiac ones such as advanced age, diabetes, renal failure, COPD, peripheral vascular disease, a high bleeding risk and frailty.",
        },
        { kind: "tip", id: "pci-chip-three-domains" },
        { kind: "h", text: "Two meanings of 'protected'" },
        {
          kind: "table",
          caption: "Do not confuse them",
          head: ["", "Graft-protected left main", "Device-protected PCI"],
          rows: [
            ["What it means", "At least one patent bypass graft supplies the LAD or circumflex, so the left main no longer carries the whole left territory", "A mechanical support device keeps systemic perfusion going (and may unload the LV) through the ischaemic parts of the procedure"],
            ["Where the manuals use it", "Brilakis's third planning question (17.1); Oxford's elective indication for left main PCI; Brilakis allows side-hole guides in a protected left main (15.1.5)", "Oxford's 'protected PCI in CHIP'; Brilakis's prophylactic and standby support (14.1)"],
            ["What it does to the risk", "Lowers it: ischaemia during left main occlusion affects less myocardium", "Is meant to make the ischaemic moments tolerable. Brilakis notes that no randomised trial has shown lower in-hospital death or major complications with support devices. BCIS-1, PROTECT II and CHIP-BCIS3 (table below) each missed their primary end point, although BCIS-1 reported fewer major procedural complications as a secondary end point"],
          ],
        },
        {
          kind: "check",
          stem: "A man with patent grafts to the LAD and an obtuse marginal needs PCI of a severe left main body lesion. An operator proposes a side-hole guide. How do the manuals view this?",
          options: [
            "Never acceptable: side-hole guides are forbidden in every left main, whether grafted or not",
            "Acceptable only if a microaxial pump is inserted first, because device protection is required",
            "Acceptable: the left main is graft-protected, so less myocardium is at risk if damping is hidden",
            "Acceptable only from the radial artery, because femoral guides with side holes dissect the ostium",
          ],
          answer: 2,
          explanation:
            "Brilakis forbids side-hole guides in an unprotected left main because of the large area at risk if damping is masked, but allows them in a protected left main, in the RCA and in grafts (15.1.5). Graft protection, not device protection, is what changes the rule. Side holes still have drawbacks: contrast escapes and more is used, and they do not prevent an injection from dissecting the ostium, so their use is a choice rather than an obligation.",
        },
        { kind: "h", text: "Deciding on support for a left main case" },
        {
          kind: "steps",
          title: "Put the general framework to work on the left main",
          items: [
            {
              title: "1. Measure the haemodynamics",
              detail: "Brilakis strongly recommends a right heart study before complex PCI when the ejection fraction is low or the haemodynamic state is unclear. A wedge above 18 mmHg suggests LV failure; RV failure is suggested by a right atrial pressure above 12 mmHg or a pulmonary artery pulsatility index (PAPi) below 0.9, where PAPi = (systolic PA pressure − diastolic PA pressure) / right atrial pressure; and a wedge above 25 mmHg with a mixed venous saturation below 50% marks a high risk of pulmonary oedema and shock during the procedure. Leave the catheter in to guide escalation.",
            },
            {
              title: "2. Rate the procedure",
              detail: "Brilakis rates the risk of a PCI on three things (14.1.2). Location: an unprotected left main (especially with a diseased or occluded RCA) or the last remaining vessel. Morphology: severe calcification and tortuosity, a tight baseline stenosis that might occlude during wiring, a bifurcation whose large side branches are tightly narrowed and hard to protect, or a large thrombus. The plan: a long procedure with significant ischaemia, as with atherectomy or retrograde CTO PCI. His Fig. 14.1 picks out the unprotected left main, the last remaining vessel, atherectomy and retrograde CTO PCI as the markers of a high-risk procedure. A left main case often combines several: the left main itself, calcium needing atherectomy, and a bifurcation with a large circumflex. For atherectomy in particular he advises considering prophylactic support, especially with poor baseline haemodynamics, a low ejection fraction, a large area of myocardium at risk, severe valve disease or severe pulmonary hypertension (19.9.4).",
            },
            {
              title: "3. Add the left main triggers",
              detail: "Brilakis notes that left main cases often have support, particularly with a low ejection fraction, decompensated haemodynamics (a high LVEDP or wedge), an occluded RCA, or a plan for prolonged ischaemia such as atherectomy. Complex left main bifurcation stenting with a depressed LV may justify support, especially with an occluded or badly diseased RCA (16.2.14). Ostial left main PCI rarely needs it (15.1.14).",
            },
            {
              title: "4. Combine them",
              detail: "Brilakis (after the 2015 SCAI consensus) recommends prophylactic support in most patients with abnormal haemodynamics who need a high-risk PCI, if feasible; with only one of the two abnormal, support is not usually inserted prophylactically but kept immediately available, many operators placing a 4 Fr femoral sheath, though Brilakis allows that some of them may be given support upfront; with neither, no support. CHIP-BCIS3 (below) later found no benefit from routine elective unloading in patients with severe LV dysfunction and extensive disease, so upfront support is best decided case by case.",
            },
            {
              title: "5. Choose the device",
              detail: "Run Brilakis's algorithm (pm-support-choice): microaxial pump contraindications, then the iliofemoral route, then an alternative route, otherwise a balloon pump or VA-ECMO if their own contraindications allow. Oxford's left main section, which draws on earlier registry data, advises an elective balloon pump when LV function is impaired and notes that patients with normal LV function generally tolerate left main inflations well.",
            },
            {
              title: "6. If the patient is already failing, escalate by severity",
              detail: "Brilakis's rule for LV failure (14.1.9): in pre-shock (cardiac index above 2.0 L/min/m²) a balloon pump may be enough, with continuous haemodynamic monitoring, ideally through a PA catheter, to decide on escalation; in shock with isolated severe LV failure a percutaneous microaxial pump is the device most often used; in refractory shock despite it, escalate to VA-ECMO or a larger, surgically inserted microaxial pump, often leaving the pump in to vent the LV; centres experienced with a left atrial-to-femoral centrifugal pump may use one instead of the microaxial pump. The other branches of his Fig. 14.1 matter if the left main case goes wrong: cardiac arrest, or shock with hypoxaemia, calls for VA-ECMO because it supports oxygenation as well as the circulation (14.1.7); isolated RV failure (right atrial pressure above 12 mmHg or PAPi below 0.9) calls for a right ventricular support device (14.1.8); and biventricular failure is usually treated with VA-ECMO, or with left and right ventricular devices combined. pm-support-choice teaches the algorithm in full, and in cardiogenic shock Oxford's chapter 9 chooses the device by how severe and how acute the shock is (Fig. 9.8).",
            },
          ],
        },
        { kind: "tip", id: "haemo-support-rhc-thresholds" },
        { kind: "tip", id: "pci-lm-support-triggers" },
        { kind: "tip", id: "pci-support-standby-sheath" },
        {
          kind: "table",
          caption: "What the randomised trials of elective support found",
          head: ["Trial", "Who", "Comparison", "Result"],
          rows: [
            ["BCIS-1 (Perera 2010; long-term 2013)", "301 patients, ejection fraction 30% or less, extensive disease", "Elective balloon pump vs none", "Primary end point, MACCE at discharge, 15.2% vs 16.0% (no difference); fewer major procedural complications with the balloon pump, a secondary end point (1.3% vs 10.7%), but a trend to more bleeding (19.2% vs 11.3%, P = 0.06) and access-site complications (3.3% vs 0%, P = 0.06), and the authors did not support routine balloon pump use; at a median of 51 months fewer deaths with the balloon pump (hazard ratio 0.66), from long-term follow-up of a trial negative for its primary end point"],
            ["PROTECT II (O'Neill 2012)", "452 patients with complex three-vessel or unprotected left main disease and severely reduced LV function", "Microaxial pump vs balloon pump", "Better haemodynamic support with the pump; primary end point, 30-day major adverse events, 35.1% vs 40.1%, not significantly different; at 90 days a trend favouring the pump (40.6% vs 49.3%, P = 0.066), significant only in the per-protocol analysis (40.0% vs 51.0%)"],
            ["CHIP-BCIS3 (Perera 2026, after both manuals)", "300 patients with severe LV dysfunction and extensive disease having planned complex PCI", "Elective microaxial unloading vs standard care", "No improvement in the hierarchical composite at a median of 22 months (win ratio 0.85, 95% CI 0.63–1.15); deaths 47 vs 33 (hazard ratio 1.54, 95% CI 0.99–2.41)"],
          ],
        },
        {
          kind: "check",
          stem: "A 74-year-old with an ejection fraction of 25%, an occluded RCA and a wedge of 27 mmHg needs distal left main PCI with atherectomy after the heart team declined surgery. What is the most defensible support plan?",
          options: [
            "Upfront microaxial support is mandatory, as trials show it lowers death in exactly this group",
            "Weigh upfront support against standby with team and patient; keep the PA catheter in either way",
            "No preparation for support at all, since CHIP-BCIS3 showed that support devices cause harm in CHIP",
            "An elective balloon pump for every left main case, as BCIS-1 found fewer events at discharge",
          ],
          answer: 1,
          explanation:
            "This is abnormal haemodynamics with a high-risk procedure, where Brilakis recommends prophylactic support in most cases. CHIP-BCIS3, published later, found no benefit from routine elective microaxial unloading in a similar population, with numerically more deaths, so upfront support is now decided case by case; standby with the access in and a pulmonary artery catheter to guide escalation is a valid alternative. No trial has shown lower in-hospital death with support, BCIS-1 found no difference at discharge, and doing nothing ignores the real risk of collapse.",
        },
        { kind: "h", text: "Running a high-risk left main case" },
        {
          kind: "steps",
          title: "In order",
          items: [
            {
              title: "1. Brief the team",
              detail: "State the support plan, where the access is, which device is in the room, the trigger for escalation and who does what if the patient collapses. Brilakis counts the availability of support devices as part of any programme that takes on complex, high-risk PCI.",
            },
            {
              title: "2. Prepare the patient",
              detail: "Defibrillator pads on; a vasopressor drawn up to use early; the pulmonary artery catheter in place and transduced.",
            },
            {
              title: "3. Sequence the lesions",
              detail: "Treat a significant RCA lesion first so that the left main PCI is safer, and stent LAD and circumflex lesions before a non-critical left main.",
            },
            {
              title: "4. Limit ischaemia",
              detail: "Short injections, the guide off the ostium at the first sign of damping, brief inflations with the aortic pressure watched, and 70:30 saline:contrast in the indeflator.",
            },
            {
              title: "5. Escalate on defined triggers",
              detail: "Hypotension or acute pulmonary oedema during or after PCI means support is needed now. In Brilakis's algorithm an unstable patient on standby goes straight to device selection. Acute vessel closure or left main dissection can make support necessary without warning; for a left main dissection, Oxford wants femoral access ready for a balloon pump or microaxial pump.",
            },
            {
              title: "6. Plan the end",
              detail: "Leave a femoral sheath in when a support device may be needed in the next few hours (closure is taught in pm-closure), and do not feel bound to finish everything: Oxford notes that operators may choose not to treat every lesion at one sitting.",
            },
          ],
        },
        { kind: "tip", id: "mcs-select-impella-contraindications" },
        {
          kind: "pitfalls",
          items: [
            "Applying one CHIP definition without saying which: Oxford's lists complex anatomy, comorbidity and haemodynamic compromise as coexisting groups, whereas Kirtane counts any combination of them; calling a case CHIP on anatomy alone ignores the other two groups that Oxford lists.",
            "Confusing a graft-protected left main with device-protected PCI, and applying the wrong side-hole rule.",
            "Treating 'unprotected left main' as an automatic order for a device, or as no reason for a plan: decide from haemodynamics and procedure, write the plan down, and have the access ready.",
            "Telling the patient that support will lower the risk of dying: no trial showed lower early mortality, BCIS-1's late mortality reduction came from long-term follow-up of a trial negative for its primary end point, and CHIP-BCIS3 found numerically more deaths with elective unloading.",
            "Pulling the right heart catheter after the baseline numbers and losing the means to judge escalation.",
            "Doing the RCA or the branch lesions after the left main when they could have made the left main safer.",
          ],
        },
        {
          kind: "pearl",
          text: "For a CHIP left main, decide the worst moment of the case in advance (usually the atherectomy run or the first kissing inflation) and make sure that, at that moment, the support device is either running or one step away, the vasopressor is in the line and everyone knows who calls the stop.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Before a CHIP left main case, perform a right heart study: record RA, PA and wedge pressures and the mixed venous saturation, calculate PAPi as (systolic PA − diastolic PA) / RA, and use Brilakis's thresholds to flag LV failure (wedge above 18 mmHg), RV failure (RA above 12 mmHg or PAPi below 0.9) and a high risk of pulmonary oedema and shock during the case (wedge above 25 mmHg with a mixed venous saturation below 50%). None of these thresholds defines shock on its own, so judge that from the blood pressure and the perfusion as well.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "Rehearse protected left main PCI: confirm aloud that there is no mechanical aortic valve, LV thrombus, severe aortic regurgitation or septal defect, and that the iliofemoral arteries exceed 5 mm without severe calcium, tortuosity or obstructive lesions, then position the pump and keep it stable while the PCI team works.",
        },
        { kind: "video", id: "hlmIo_-6S_o", note: "Brilakis lecture: an unmet need, the complex and higher-risk indicated patients (CHIP)." },
        { kind: "video", id: "WFn91e2qA08", note: "Case 194 from the Manual of PCI: trifurcation PCI with microaxial pump support." },
        { kind: "video", id: "pIdQ-P8Ekpc", note: "Case 36 from the PCI Manual: challenges with microaxial pump-assisted PCI." },
        { kind: "video", id: "o07IELwgyKo", note: "Elias Hanna on LV support in complex PCI, with left main stenting and bifurcation techniques." },
        {
          kind: "keypoints",
          items: [
            "CHIP (Oxford): features coexisting from three groups, complex anatomy (unprotected left main, SYNTAX above 33, last patent vessel), high comorbidity and haemodynamic compromise (EF below 35%, systolic below 100 mmHg, CI below 2.2 L/min/m²); Kirtane's framing counts any combination. Say which definition you use.",
            "Graft-protected left main lowers risk and allows a side-hole guide; device-protected PCI supports the circulation, but no trial has shown lower early mortality (the fewer deaths in BCIS-1 came from long-term follow-up of a trial that missed its primary end point).",
            "Left main support triggers: low EF, high LVEDP or wedge, occluded RCA, prolonged ischaemia such as atherectomy; complex bifurcation with a depressed LV; ostial left main rarely.",
            "Abnormal haemodynamics plus high-risk PCI: Brilakis advises prophylactic support in most; after CHIP-BCIS3 it is decided case by case, with standby, access and a PA catheter as the alternative. One abnormal: standby, upfront in some.",
            "BCIS-1 and PROTECT II missed their primary end points (BCIS-1 had fewer major procedural complications and later fewer deaths; PROTECT II a per-protocol benefit at 90 days); CHIP-BCIS3 found no benefit from elective unloading, with numerically more deaths.",
            "RV failure: RA above 12 mmHg or PAPi below 0.9, PAPi = (sPAP − dPAP) / RA. Failing patient: balloon pump may do in pre-shock (CI above 2.0), microaxial pump in shock with LV failure, VA-ECMO or a larger pump if refractory; VA-ECMO for arrest or hypoxaemia and usually for biventricular failure; an RV support device for isolated RV failure.",
            "High-risk PCI (Brilakis 14.1.2): unprotected left main or last remaining vessel; severe calcium and tortuosity, a tight lesion that may occlude on wiring, a bifurcation with large diseased branches, large thrombus; atherectomy or retrograde CTO PCI.",
            "Run the case: brief, pads and pressor, RCA and branches first, short ischaemic steps, defined escalation triggers, sheath plan and staging.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-left-main-q1",
      stem: "Which statement about angiographic assessment of the left main matches Brilakis?",
      options: [
        "Angiography is reliable down to 30%, because the left main is short and seen in every projection",
        "A left main lesion is significant only above 70%, the same threshold as for the other epicardial vessels",
        "Angiography is usually adequate at 70% or more but observers disagree widely between 30% and 70%",
        "The best view of the bifurcation is RAO cranial, because it opens the angle between LAD and circumflex",
      ],
      answer: 2,
      explanation:
        "Brilakis says angiography usually suffices for left main lesions of 70% or more but that inter-observer variability is large between 30% and 70%, because the vessel is short, often diffusely diseased and lacks a reference segment. The significance threshold in the left main is 50%, not 70%. He images the bifurcation in RAO caudal, AP caudal and LAO caudal views; RAO cranial is not among them.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-left-main-q2",
      stem: "IVUS of an intermediate left main shaft lesion in a European patient with stable angina shows a minimum lumen area of 5.2 mm², the smaller of the LAD and circumflex pullbacks. How should it be read?",
      options: [
        "Not significant, because it is above the 4.0 mm² threshold used for the other epicardial arteries",
        "Significant by Brilakis's 6.0 mm² rule, but in the 4.5–6 mm² grey zone, so confirm with physiology",
        "Not significant, because it is above the 4.5 mm² threshold that applies to every population of patients",
        "Significant beyond doubt, because any left main area below 6.0 mm² must be revascularised at once",
      ],
      answer: 1,
      explanation:
        "Brilakis takes an IVUS minimum lumen area below 6.0 mm² (or below 5.4 mm² by OCT) as significant in the left main, so by his rule 5.2 mm² is significant. The evidence behind the line is strongest for deferral: LITRO showed that deferring at 6 mm² or more is safe, not that every area below it needs treatment, and the 2026 EAPCI and European Bifurcation Club consensus treats 4.5–6 mm² as a grey zone in which invasive physiology should be considered, with high-risk plaque features and the clinical picture, using the smaller MLA of the two pullbacks. That is why the unqualified 'beyond doubt' answer is wrong. The 4.5 mm² cut-off was proposed for Korean patients with smaller arteries and is not universal, and Brilakis does not use area thresholds such as 4 mm² to judge significance outside the left main.",
      difficulty: 2,
      refs: [...BOOKS, "park-lm-ivus-2014", "litro-2011", "johnson-eapci-lm-imaging-2026"],
    },
    {
      id: "cp-left-main-q3",
      stem: "Pressure-wire assessment of an intermediate distal left main stenosis: LAD FFR 0.91 with no step at the left main; circumflex FFR 0.70 with the step at the circumflex ostium. There is no downstream disease. What does this suggest?",
      options: [
        "The left main is significant, because the lowest branch value is below 0.80",
        "The study is invalid, because the left main can only be judged by IVUS",
        "The left main is significant but masked in the LAD by disease further downstream",
        "The left main is probably not significant; the circumflex ostium is the lesion",
      ],
      answer: 3,
      explanation:
        "Brilakis measures both branches with pullback to see whether the step-up is in the left main; a normal value in one branch with an abnormal one in the other suggests the left main is not significant. Here the step sits at the circumflex ostium. Downstream disease can mask left main severity, but the stem says there is none, and physiology is a valid alternative to IVUS in the left main.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-left-main-q4",
      stem: "Why does Brilakis forbid side-hole guides in an unprotected left main, with one exception?",
      options: [
        "They hide damping, so global ischaemia can go unrecognised; the exception is an ostial left main CTO",
        "They cannot pass a rotational atherectomy burr; the exception is a lesion that does not need debulking",
        "They raise the contrast volume too far; the exception is a patient with normal kidney function",
        "They cannot be used from the radial artery; the exception is femoral access with an 8 Fr guide",
      ],
      answer: 0,
      explanation:
        "Side holes let blood into the guide and keep the trace looking normal while the tip obstructs flow, so a large ischaemic territory can go unnoticed until the patient collapses; with a short left main the guide can block the circumflex completely behind a pseudonormal trace. Brilakis's single exception for an unprotected left main is the ostial left main CTO. Extra contrast use is a drawback of side holes, but not the reason for the rule.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-left-main-q5",
      stem: "You are about to engage a severe ostial left main lesion. Which preparation does Brilakis recommend?",
      options: [
        "Engage deeply with an 8 Fr Amplatz so that the guide is stable before any wire enters the diseased vessel",
        "Use a side-hole guide so that the pressure trace stays normal for all the time you need to wire it",
        "Bring a wire, often with a balloon, to the guide tip before engaging, then wire at once and back off",
        "Engage and take a power injection to define the ostium before any wire is passed into the artery",
      ],
      answer: 2,
      explanation:
        "For severe ostial left main disease Brilakis advances a guidewire, and often a balloon on it, to the guide tip before engagement so that wiring (and ballooning) can happen the moment the guide seats, after which the guide is disengaged to relieve ischaemia. A deep, aggressive guide and a forceful injection into a damped catheter are the classic causes of ostial dissection, and side-hole guides hide damping.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-left-main-q6",
      stem: "During PCI the guide tip dissects the left main ostium. A wire is already in the distal LAD and the patient is stable. Which first actions are right?",
      options: [
        "Remove the wire, rewire with a polymer-jacketed wire and inject selectively to map the dissection flap",
        "Keep the wire, disengage, stop selective injections, confirm the lumen with IVUS and stent the entry fast",
        "Leave it alone and repeat the angiogram in 24 hours, as all left main dissections heal without any treatment",
        "Perform OCT straight away, as its contrast flush shows the size of the false lumen better than IVUS",
      ],
      answer: 1,
      explanation:
        "Brilakis: do not lose wire position, disengage the guide, perform only cautious injections from a distance, and prepare to stent at once to seal the entry; rapid stenting is needed for proximal dissections such as the left main. Oxford prefers IVUS to OCT for confirming wire position because the OCT flush can expand the false lumen, and notes that the unpredictable course usually demands intervention. Polymer-jacketed wires are themselves a cause of left main dissection.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cp-left-main-q7",
      stem: "A 5.0 mm left main and a 3.5 mm proximal LAD are to be treated with a provisional cross-over stent. Which sizing plan is correct?",
      options: [
        "A 5.0 mm stent sized to the left main, so that no proximal optimisation is needed afterwards",
        "A stent sized to the LAD and left as deployed, since post-dilating the left main portion risks rupture",
        "A 4.25 mm stent, the average of the two references, to balance the risks at each end of the stent",
        "A stent sized to the LAD, on a platform whose labelled post-dilatation limit reaches 5.0 mm, then POT",
      ],
      answer: 3,
      explanation:
        "Brilakis sizes the stent to the distal reference, because sizing to the larger proximal vessel risks distal dissection or perforation and carina shift into the side branch, and then post-dilates the proximal part to the proximal reference (POT). When the proximal vessel is much larger, as in the left main, he asks you to know each stent's expansion limits. An average size is wrong at both ends, and an un-optimised left main segment is underexpanded.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cp-left-main-q8",
      stem: "On the distal left main, which pair of statements correctly sets Brilakis against the later EBC MAIN trial?",
      options: [
        "Brilakis prefers culotte for true bifurcations; EBC MAIN found DK crush superior to provisional there",
        "Brilakis prefers provisional for true bifurcations; EBC MAIN found planned dual stenting clearly superior there",
        "Brilakis prefers DK crush for true bifurcations; EBC MAIN found no benefit of planned dual stenting there",
        "Brilakis prefers simultaneous kissing stents; EBC MAIN found them equal to provisional stenting there",
      ],
      answer: 2,
      explanation:
        "Brilakis prefers a two-stent technique, especially DK crush, for true (Medina 1,1,1 or 0,1,1) left main bifurcations, citing DKCRUSH-V, in which one-year target lesion failure was 5.0% with DK crush against 10.7% with provisional. EBC MAIN randomised 467 true left main bifurcations and found 14.7% events with stepwise provisional against 17.7% with systematic dual stenting (not significant), and its authors kept provisional as the default. Culotte was inferior to DK crush in DKCRUSH-III, and simultaneous kissing stents are for emergencies.",
      difficulty: 3,
      refs: [...BOOKS, "dkcrush5-2017", "ebc-main-2021", "chen-dkcrush3-2013"],
    },
    {
      id: "cp-left-main-q9",
      stem: "After left main-to-LAD provisional stenting, IVUS shows 8.9 mm² in the left main, 7.4 mm² at the polygon of confluence, 6.3 mm² at the LAD ostium and 4.4 mm² at the circumflex ostium. Circumflex FFR is 0.78. What do you do?",
      options: [
        "Rewire the circumflex distally, kiss and re-POT, re-image, and stent it by T, TAP or culotte only if it stays inadequate",
        "Accept the result: the left main, polygon and LAD ostium all exceed their targets, which is what matters most here",
        "Repeat the circumflex FFR with the guide seated deeper, as a disengaged guide underestimates the FFR values",
        "Add a circumflex stent by culotte at once, because any jailed branch with an FFR below 0.80 needs a second stent",
      ],
      answer: 0,
      explanation:
        "The circumflex ostium falls short of its 5 mm² minimum and its FFR is 0.80 or less, so the branch needs treatment. Brilakis's stepwise provisional sequence for a compromised side branch rewires it through a distal strut, dilates it with kissing balloons and repeats the POT, and adds a second stent (T, TAP, reverse crush or culotte) only if the result is still inadequate; EBC MAIN likewise tested a stepwise approach. His left main section (17.12.2) is shorter and moves directly to a second stent for an FFR of 0.80 or less, so a culotte at once is not indefensible, but 'at once, for any jailed branch' ignores the general algorithm (16.2.10.1). The other segments meet their minimums (8, 7 and 6 mm²), though each should also be checked against its reference area; this is why the left main is imaged from both branches. A deeper guide damps and falsely raises FFR.",
      difficulty: 3,
      refs: [...BOOKS, "kang-lm-ivus-2011", "ebc-main-2021"],
    },
    {
      id: "cp-left-main-q10",
      stem: "Which patient has features from all three of Oxford's groups for a complex high-risk indicated PCI (CHIP) case?",
      options: [
        "Unprotected left main PCI in a fit 55-year-old with normal LV function and normal kidneys",
        "Unprotected left main PCI in a diabetic with kidney failure and an ejection fraction of 30%",
        "Single-vessel mid-LAD PCI in an 85-year-old with kidney failure and an ejection fraction of 30%",
        "Last-remaining-vessel PCI in a 60-year-old with no comorbidity and a cardiac index of 3.0",
      ],
      answer: 1,
      explanation:
        "Oxford defines a CHIP case by the coexistence of features from three groups: complex anatomy (unprotected left main, SYNTAX above 33, last patent vessel), a high comorbidity burden (here diabetes and kidney failure) and haemodynamic compromise (ejection fraction below 35%, systolic below 100 mmHg or cardiac index below 2.2). Only the second patient (unprotected left main, diabetes with kidney failure, ejection fraction 30%) has features from all three. The others each lack at least one group, however high-risk one feature looks. Kirtane's broader framing (comorbidity, anatomy and/or haemodynamics) would count more of them as high risk, which is why you should say which definition you are using.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "kirtane-chip-2016"],
    },
    {
      id: "cp-left-main-q11",
      stem: "PROTECT II, BCIS-1 and CHIP-BCIS3 are often quoted when planning support for left main PCI. Which summary is accurate?",
      options: [
        "PROTECT II showed that a microaxial pump halves 30-day events compared with a balloon pump in left main PCI",
        "BCIS-1 showed fewer major events at discharge with an elective balloon pump, so it is now routine for left main PCI",
        "CHIP-BCIS3 showed that elective unloading improves the hierarchical outcome in severe LV dysfunction",
        "None met its primary end point with elective support, and CHIP-BCIS3 had numerically more deaths with the pump",
      ],
      answer: 3,
      explanation:
        "PROTECT II found better haemodynamic support with the microaxial pump but no significant difference in its primary end point, 30-day major adverse events (35.1% vs 40.1%), with a benefit at 90 days only in the per-protocol analysis; BCIS-1 found no difference in its primary end point, MACCE at discharge (15.2% vs 16.0%), although major procedural complications, a secondary end point, were fewer (1.3% vs 10.7%) and deaths were fewer at a median of 51 months; CHIP-BCIS3 found no improvement with elective unloading (win ratio 0.85) and 47 against 33 deaths. Support remains a case-by-case decision.",
      difficulty: 3,
      refs: ["protect-ii-2012", "perera-bcis1-2010", "perera-bcis1-longterm-2013", "perera-chip-bcis3-2026"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage the left main, withdraw without injecting at the first damping, and acquire the five-view left main set; name the two views that show the ostium least foreshortened." },
    { sim: "pci-bench", task: "Size and place an ostial left main stent 1–2 mm into the aorta, flare it, then run IVUS from both branches after a provisional distal left main stent and check the 5, 6, 7 and 8 mm² minimums and each segment's expansion against its reference." },
    { sim: "physiology", task: "Assess an intermediate left main from the LAD and the circumflex with pullback, guide disengaged, and decide on a jailed circumflex after provisional stenting from its FFR." },
    { sim: "haemo", task: "Before a CHIP left main case, flag LV failure, RV failure and the high-risk pattern from a right heart study using Brilakis's thresholds, and judge shock from the pressure and perfusion as well." },
    { sim: "impella", task: "Confirm the microaxial pump is allowed and position it for protected left main PCI." },
  ],
  caseIds: ["cp-left-main-case-distal", "cp-left-main-case-chip"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cp-left-main-case-distal",
    title: "An intermediate distal left main, from the first injection to the final pullback",
    trackId: "complex-pci",
    stage: 5,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, chapter 17 with 15.1, 16.1 and 16.2; Oxford Handbook, chapter 8 (left main stem PCI) and chapter 6" },
    summary: "A stable patient with an intermediate distal left main lesion, assessed and treated by a provisional strategy with a decision on the jailed circumflex.",
    presentation:
      "A 66-year-old man without diabetes has Canadian class III angina despite two antianginal drugs. A CT coronary angiogram suggested distal left main disease. The heart team reviewed his previous films: the RCA is dominant and normal, there are no grafts, and the ejection fraction is 55%. With a SYNTAX score of 18 he chose PCI after an informed discussion of CABG; consent covers assessment and PCI of the left main.",
    findings: [
      "Blood pressure 134/78 mmHg, heart rate 68/min, sinus rhythm",
      "Creatinine 88 µmol/L; haemoglobin 141 g/L",
      "Previous angiogram: distal left main narrowing estimated at 50–60%, circumflex ostium mildly diseased (Medina 1,1,0 on CT)",
      "Right radial access already in place with a 7 Fr sheath",
    ],
    steps: [
      {
        id: "guide",
        prompt: "Which guide do you choose for the left main?",
        options: [
          {
            text: "7 Fr EBU 3.5 without side holes",
            best: true,
            feedback: "Brilakis prefers supportive EBU or XB shapes and 7 or 8 Fr guides for a left main bifurcation; they support better and leave room for two devices. No side holes in an unprotected left main.",
          },
          {
            text: "7 Fr EBU 3.5 with side holes, so that the trace stays normal",
            feedback: "Side holes mask damping: the trace can stay normal while the tip blocks the left main or, with a short left main, the circumflex. Brilakis forbids them in an unprotected left main except for an ostial CTO.",
            next: "c-sidehole",
            stateDelta: { stability: -20, flags: ["masked-ischaemia"] },
          },
          {
            text: "6 Fr JL4, as for a diagnostic study",
            acceptable: true,
            feedback: "It will engage, but a JL gives weak support and 6 Fr limits bifurcation work. It is not wrong for an angiogram; it is the wrong tool for the PCI that may follow.",
          },
        ],
      },
      {
        id: "c-sidehole",
        kind: "consequence",
        prompt: "Ten seconds after engagement the patient becomes grey, new ST-segment changes appear in the lateral leads and the pressure drifts down to 90/60 mmHg, although the waveform shape looks normal. What do you do?",
        info: "Fluoroscopy shows the guide tip deep in a short left main, pointing into the LAD.",
        options: [
          {
            text: "Disengage the guide at once and change to a guide without side holes",
            best: true,
            feedback: "The tip is probably blocking the circumflex ostium behind a pseudonormal trace, the scenario Brilakis illustrates. Taking the guide out relieves the ischaemia; a guide without side holes makes damping visible.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Inject to see what is wrong",
            feedback: "Injecting through an obstructing guide prolongs the ischaemia and risks dissection. Disengage first.",
            stateDelta: { stability: -15, flags: ["dissection-risk"] },
          },
        ],
      },
      {
        id: "engage",
        prompt: "As the guide seats in the left main, the arterial trace loses its dicrotic notch and the diastolic pressure falls. What next?",
        options: [
          {
            text: "Disengage without injecting, then take a non-selective image or re-seat coaxially with a wire ready",
            best: true,
            feedback: "Damping at the left main usually means the tip is obstructing flow (a left main stenosis, the tip against the wall, spasm, or selective branch entry). Never inject a damped catheter; take the guide off before the pressure falls or the ostium is hurt. Once it is off, if the trace stays damped, exclude the catheter causes in Brilakis's stepwise check (thrombus or debris in the catheter, a kink, a faulty transducer; Fig. 5.16).",
          },
          {
            text: "A firm injection to see whether the ostium is diseased",
            feedback: "Contrast into a damped catheter is the classic cause of left main dissection.",
            next: "c-dissection",
            stateDelta: { stability: -30, flags: ["lm-dissection"] },
          },
          {
            text: "Hold the position for a minute and see whether the trace recovers",
            feedback: "Every second of obstruction is global ischaemia. Brilakis asks for prompt disengagement.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-dissection",
        kind: "consequence",
        prompt: "The injection shows a linear contrast stain at the left main ostium running into the proximal shaft and stopping well short of the bifurcation; the aortic wall is not stained. The patient has chest pain; pressure 100/60 mmHg; TIMI 3 flow. What now?",
        options: [
          {
            text: "Disengage, stop selective injections, wire the LAD, confirm the true lumen with IVUS and stent the entry quickly, with femoral access prepared for support",
            best: true,
            feedback: "These are both manuals' steps: no further selective injections, IVUS (not OCT) for the lumen, rapid stenting of the entry, and femoral access ready for a balloon pump or microaxial pump (Oxford). With the bifurcation spared, Oxford's table gives PCI for both stable and unstable patients; had the flap reached the bifurcation in a stable patient, cardiac surgery would be the reference treatment, with two-stent PCI the alternative.",
            stateDelta: { stability: 15 },
          },
          {
            text: "Take more selective injections to define the extent of the flap",
            feedback: "Selective injections extend the dissection. Only cautious, non-selective injections from a distance.",
            stateDelta: { stability: -20 },
          },
          {
            text: "OCT to see the flap clearly",
            feedback: "The OCT flush can expand the false lumen; Oxford prefers IVUS for wire position in a left main dissection.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "assess",
        prompt: "Non-selective and gently re-seated images show a distal left main narrowing that you estimate at 55%; your colleague says 40%. How do you decide whether to treat?",
        options: [
          {
            text: "IVUS of the left main, with pullbacks from the LAD and from the circumflex",
            best: true,
            feedback: "Between 30% and 70% the eye is unreliable in the left main. IVUS is the preferred imaging test there (no flush needed), and it also gives the reference diameter and lesion length for planning.",
          },
          {
            text: "Pressure wire in the LAD and the circumflex with pullback, guide disengaged",
            acceptable: true,
            feedback: "A valid route: both branches, pullback to locate the step. IVUS has the edge here because it also plans the stent.",
          },
          {
            text: "Treat on the 55% estimate, since anything above 50% is significant",
            feedback: "The 50% threshold applies to a measured stenosis; this one is in the band where observers disagree widely. Measure it.",
            stateDelta: { stability: -5 },
          },
        ],
        variants: [{ flag: "lm-dissection", info: "The ostial and proximal shaft dissection has been sealed with a short stent placed 1–2 mm into the aorta and covering the whole flap; the distal left main lesion still needs assessment." }],
      },
      {
        id: "prep",
        prompt: "IVUS pullbacks from the LAD and the circumflex: smaller minimum lumen area 3.8 mm² at the distal left main, left main reference 4.6 mm in diameter, distal LAD reference 3.5 mm, circumflex ostium plaque but area 6.1 mm², and a 180° arc of superficial calcium. How do you prepare the lesion?",
        info: "The left main is significant by Brilakis's IVUS threshold (below 6.0 mm²) and lies below the 4.5–6 mm² grey zone of the 2026 consensus, so no physiology is needed to decide.",
        options: [
          {
            text: "Non-compliant and scoring balloon inflations kept as brief as possible, watching the aortic pressure, with 70:30 saline:contrast in the indeflator",
            best: true,
            feedback: "Meticulous preparation with brief inflations and attention to the aortic pressure, as Brilakis asks, particularly without support. The dilute contrast speeds inflation and deflation.",
          },
          {
            text: "One prolonged 60-second inflation to crack the calcium",
            feedback: "Long left main occlusions cause global ischaemia; keep inflations brief.",
            next: "c-hypotension",
            stateDelta: { stability: -20, flags: ["hypotension"] },
          },
          {
            text: "Direct stenting to shorten the procedure",
            feedback: "Brilakis calls thorough preparation critical before any left main stent; an underprepared calcified segment risks underexpansion.",
            stateDelta: { stability: -10, flags: ["underprepared"] },
          },
        ],
      },
      {
        id: "c-hypotension",
        kind: "consequence",
        prompt: "At 40 seconds the pressure is 70/40 mmHg and the patient is nauseated. What do you do?",
        options: [
          {
            text: "Deflate at once, give a vasopressor early, and use short inflations from now on",
            best: true,
            feedback: "Restoring flow is the treatment; Brilakis encourages early vasopressors such as noradrenaline when a left main patient becomes hypotensive.",
            stateDelta: { stability: 15 },
          },
          {
            text: "Complete the planned 60 seconds",
            feedback: "Continuing the occlusion risks VF and collapse.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "stent",
        prompt: "The lesion is well prepared. What stent strategy do you use?",
        options: [
          {
            text: "Provisional: a cross-over stent from the left main into the LAD sized to the distal LAD, on a platform that can be expanded to 4.6 mm, then POT with a 4.5 mm non-compliant balloon",
            best: true,
            feedback: "Medina 1,1,0 without significant circumflex disease: Brilakis prefers provisional. Size to the distal main vessel to avoid distal injury and carina shift, then optimise the left main portion with a platform able to reach the left main diameter. The POT balloon matches the 4.6 mm left main and no more, because an oversized POT balloon makes circumflex compromise more likely; place its distal marker at the carina.",
          },
          {
            text: "Planned DK crush",
            feedback: "Brilakis reserves planned two-stent techniques, especially DK crush, for true bifurcations (Medina 1,1,1 or 0,1,1). This one is not.",
            stateDelta: { stability: -5 },
          },
          {
            text: "A 4.5 mm stent sized to the left main and extending into the LAD",
            feedback: "Sizing to the proximal vessel risks dissection or perforation of the 3.5 mm LAD and shifts the carina into the circumflex.",
            stateDelta: { stability: -10, flags: ["oversized"] },
          },
        ],
      },
      {
        id: "lcx",
        prompt: "After stenting and POT the circumflex ostium looks about 60% narrowed. Flow is TIMI 3 and there is no dissection. What next?",
        options: [
          {
            text: "Measure circumflex FFR with the guide disengaged from the ostium",
            best: true,
            feedback: "A jailed circumflex that looks narrowed is assessed with physiology (and imaging) before a second stent. The FFR is 0.88: Brilakis defers circumflex stenting above 0.80.",
          },
          {
            text: "Final kissing balloon inflation as routine",
            acceptable: true,
            feedback: "Brilakis finds no clear benefit from routine kissing after provisional left main stenting, whereas the European Bifurcation Club recommends it as part of provisional stenting; neither has randomised outcome proof. Either way, kissing does not answer whether the branch is significant, and if you kiss, rewire through a distal strut and repeat the POT.",
          },
          {
            text: "T-stent the circumflex now",
            feedback: "The eye overestimates a jailed ostium. Without physiology you may add a stent, and its restenosis and thrombosis risk, for nothing.",
            stateDelta: { stability: -10, flags: ["unneeded-stent"] },
          },
        ],
      },
      {
        id: "finish",
        prompt: "How do you assess the final result?",
        options: [
          {
            text: "IVUS pullbacks from the LAD and from the circumflex, checking 8, 7, 6 and 5 mm² from the left main to the circumflex ostium and each stented segment against its reference",
            best: true,
            feedback: "Brilakis makes imaging of both branches mandatory after left main PCI. Check each segment against its absolute minimum and each stented segment against 80–90% of its reference lumen area, the range used in contemporary left main studies (more than 90% is Brilakis's alternative goal in 13.3, the top of that range). Here the areas are 15.2 mm² in the left main (about 92% of its 16.6 mm² reference), 10.5 mm² at the polygon of confluence, 8.8 mm² at the LAD ostium (about 92% of the 9.6 mm² lumen area of the 3.5 mm LAD reference) and 6.0 mm² at the circumflex ostium. The left main and the LAD ostium meet both tests, and both exceed 90%; the polygon of confluence and the circumflex ostium, which has no stent of its own in this provisional strategy, exceed their 7 and 5 mm² minimums.",
          },
          {
            text: "IVUS from the LAD only",
            feedback: "A pullback from the LAD cannot assess the circumflex ostium, the segment most likely to fall short.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Angiography in the spider view",
            feedback: "Oxford: visual sizing underestimates the left main and leads to malapposition, restenosis and thrombosis. Imaging is mandatory here.",
            stateDelta: { stability: -10 },
          },
        ],
        variants: [
          { flag: "underprepared", info: "IVUS shows the left main segment underexpanded at 6.8 mm² against the 8 mm² target, behind the arc of calcium; high-pressure non-compliant post-dilatation is needed before you can accept it." },
          { flag: "oversized", info: "IVUS shows an edge dissection in the mid LAD where the oversized stent ended." },
        ],
      },
    ],
    outcome:
      "The left main was assessed with IVUS, prepared with brief inflations, treated with a provisional cross-over stent and POT, the circumflex deferred on FFR, and the result confirmed from both branches. He was discharged the next day on dual antiplatelet therapy.",
    outcomeVariants: [
      { flag: "lm-dissection", text: "The injection into a damped catheter caused an ostial dissection that needed an extra stent; the patient's course was longer and the risk he faced much higher." },
      { flag: "masked-ischaemia", text: "The side-hole guide hid an ischaemic episode that a guide without side holes would have shown at once." },
      { flag: "unneeded-stent", text: "A second stent was added to a circumflex that physiology would have shown did not need it." },
    ],
    learningPoints: [
      "No side-hole guide in an unprotected left main; disengage at the first damping and never inject a damped catheter.",
      "Between 30% and 70% measure the left main: IVUS from both branches or physiology in both branches.",
      "Prepare carefully with brief inflations, watching the aortic pressure.",
      "Medina 1,1,0: provisional, cross-over stent sized to the distal vessel, POT to the left main with a platform that can expand that far.",
      "Jailed circumflex: FFR above 0.80, defer; no routine kissing.",
      "Finish with IVUS from both branches against 8, 7, 6 and 5 mm² as minimums, and against each segment's reference lumen area.",
    ],
    refs: [...BOOKS, "kang-lm-ivus-2011", "johnson-eapci-lm-imaging-2026"],
  },
  {
    id: "cp-left-main-case-chip",
    title: "A CHIP left main: support, sequence and the ostium",
    trackId: "complex-pci",
    stage: 5,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, chapters 14.1 and 17 with 15.1 and 19.9; Oxford Handbook, chapter 9 (CHIP, mechanical circulatory support) and chapter 8 (left main stem PCI)" },
    summary: "An elderly patient with heart failure, kidney disease and severe LV dysfunction who needs ostial-to-shaft left main PCI with atherectomy.",
    presentation:
      "A 79-year-old woman with diabetes, stage 4 chronic kidney disease and an ejection fraction of 25% has recurrent heart failure admissions and angina at rest after an NSTEMI. Angiography showed a heavily calcified ostial and shaft left main stenosis with a normal bifurcation, and a chronically occluded RCA filled from the left. The heart team judged her unsuitable for surgery and recommended PCI.",
    findings: [
      "Blood pressure 108/66 mmHg, heart rate 84/min, sinus rhythm",
      "Right heart study: RA 8 mmHg, PA 52/28 mmHg, wedge 26 mmHg, mixed venous saturation 47%",
      "eGFR 24 mL/min/1.73 m²",
      "CT: iliofemoral arteries 7 mm, without severe calcium, tortuosity or obstructive lesions; no mechanical valve, LV thrombus, severe aortic regurgitation or septal defect on echo",
    ],
    steps: [
      {
        id: "classify",
        prompt: "How do you classify this patient and her procedure?",
        options: [
          {
            text: "CHIP: complex anatomy, heavy comorbidity and haemodynamic compromise together; abnormal but stable haemodynamics with a high-risk procedure",
            best: true,
            feedback: "She has features from all three of Oxford's groups, so she is CHIP by either definition (unprotected left main; diabetes, kidney failure, heart failure; EF below 35%). Her wedge above 25 mmHg with a saturation below 50% marks a high risk of oedema and shock; unprotected left main PCI with an occluded RCA and atherectomy is high risk by Brilakis's definition.",
          },
          {
            text: "Normal haemodynamics, because the blood pressure is 108/66 mmHg",
            feedback: "A normal blood pressure does not make the haemodynamics normal; the wedge and saturation show a patient close to failure.",
            next: "c-noplan",
            stateDelta: { stability: -20, flags: ["no-plan"] },
          },
          {
            text: "Cardiogenic shock",
            feedback: "She is not hypotensive and has no stated end-organ hypoperfusion, so she is not in shock, but a mixed venous saturation of 47% shows a low output close to it: check the lactate and cardiac index before the case. Overcalling shock changes the device logic.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-noplan",
        kind: "consequence",
        prompt: "Without a support plan, the first atherectomy run drops the pressure to 65/40 mmHg with ST depression, and she becomes breathless. What now?",
        options: [
          {
            text: "Stop the run, start a vasopressor, and move straight to the device algorithm: no microaxial pump contraindications and good iliofemoral arteries, so insert a microaxial pump",
            best: true,
            feedback: "Instability during the case sends the patient straight to device selection in Brilakis's algorithm. Time lost now is the cost of not having planned access in advance.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Continue the atherectomy to finish quickly",
            feedback: "Continuing ischaemia in a failing heart risks arrest.",
            stateDelta: { stability: -25 },
          },
        ],
      },
      {
        id: "support",
        prompt: "What support plan do you agree with the team before starting?",
        options: [
          {
            text: "Upfront microaxial support, after a discussion with the team and patient recorded in the notes; PA catheter left in; pads on and a vasopressor ready",
            best: true,
            feedback: "Defensible when discussed and documented. Brilakis recommends prophylactic support in most patients with abnormal haemodynamics needing high-risk PCI, and she has no pump contraindications and good iliofemoral arteries; but CHIP-BCIS3 found no benefit from routine elective unloading in a population like hers, with numerically more deaths, so the choice is made case by case. The PA catheter guides escalation.",
          },
          {
            text: "Standby, after the same recorded discussion: a 4 Fr femoral sheath, the device in the room, PA catheter in, pads on and a vasopressor ready",
            best: true,
            feedback: "Equally defensible when discussed and documented, provided the escalation trigger is agreed in advance. CHIP-BCIS3 supports not inserting the pump routinely; Brilakis's framework would favour upfront support for abnormal haemodynamics with a high-risk procedure. Record why you chose it.",
          },
          {
            text: "An elective balloon pump, because Oxford advises one for every impaired ventricle",
            acceptable: true,
            feedback: "Oxford's left main advice, but BCIS-1 found no fewer events at discharge, and a balloon pump adds only 0.3–0.5 L/min. In Brilakis's algorithm it is the device when a microaxial pump cannot be used.",
          },
        ],
      },
      {
        id: "engage",
        prompt: "The agreed support plan is in place (the pump running, or the standby access and device ready). How do you engage the calcified ostial left main?",
        options: [
          {
            text: "7 Fr EBU without side holes, with a wire preloaded to the guide tip, engaging only long enough to wire and then disengaging by torquing off axis",
            best: true,
            feedback: "Preloading lets you wire the moment you seat, and torquing off rather than pulling keeps the wire. No side holes in an unprotected left main, even with support running. The 7 Fr size is a deliberate trade: it takes a burr up to 2.0 mm and gives the support calcium work needs (19.5, Table 19.1), but a larger guide damps more readily than a 6 Fr one would at an isolated ostium (15.1.4, 15.1.5), so disengage early.",
          },
          {
            text: "A side-hole guide, since the support plan protects her from ischaemia",
            feedback: "Device support does not make a left main 'protected' in the graft sense; masked damping still means unrecognised ischaemia.",
            stateDelta: { stability: -10, flags: ["masked-ischaemia"] },
          },
          {
            text: "Deep engagement with an 8 Fr AL for maximal support",
            feedback: "An aggressive, deep guide at a diseased ostium invites damping and dissection.",
            next: "c-deep-guide",
            stateDelta: { stability: -15, flags: ["dissection-risk"] },
          },
        ],
      },
      {
        id: "c-deep-guide",
        kind: "consequence",
        prompt: "The AL seats deeply; the arterial trace ventricularises and the ECG shows new ST depression. What do you do?",
        options: [
          {
            text: "Do not inject; take the guide off the ostium, then re-engage with a less aggressive guide and a wire preloaded to its tip",
            best: true,
            feedback: "A ventricularised trace means the guide is obstructing the ostium. Injecting now risks an ostial dissection that could run into the aorta. Support, running or ready, keeps the circulation going; it does not make an obstructed left main safe.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Inject to see whether the ostium has dissected",
            feedback: "Contrast into a damped guide is the commonest way to create the dissection you are worried about.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "prep",
        prompt: "IVUS shows 360° calcium at the ostium and shaft; the left main measures 4.2 mm. How do you prepare it?",
        options: [
          {
            text: "Rotational atherectomy (a larger burr is reasonable in the left main, with a guide size that fits it), short runs, then non-compliant balloon inflation and IVUS to confirm expansion",
            best: true,
            feedback: "Brilakis uses burrs of 1.75 mm or larger infrequently except in the left main, at a burr-to-artery ratio of about 0.5; 1.75 mm passes through 6 Fr and 2.0 mm needs 7 Fr. Aorto-ostial lesions are often undilatable and recoil, so preparation is essential.",
          },
          {
            text: "Direct stenting with high-pressure post-dilatation",
            feedback: "Primary stenting of a calcified, rigid ostium risks an underexpanded stent that cannot be fixed easily.",
            next: "c-underexpanded",
            stateDelta: { stability: -15, flags: ["underexpanded"] },
          },
        ],
      },
      {
        id: "c-underexpanded",
        kind: "consequence",
        prompt: "IVUS shows the ostial stent expanded to 5.1 mm², below the 8 mm² minimum and well short of 80–90% of the 13.9 mm² reference. What do you do?",
        options: [
          {
            text: "High-pressure inflation (above 18 atm) with a non-compliant balloon at least the stent diameter, then the undilatable-lesion algorithm if needed",
            best: true,
            feedback: "Brilakis treats acute underexpansion with high pressures (above 18 atm) through a non-compliant balloon sized at least to the stent; beyond that, the balloon-undilatable algorithm applies (cp-uncrossable).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept it, because the angiogram looks acceptable",
            feedback: "Underexpansion raises the risk of restenosis and stent thrombosis; in the left main that can be catastrophic.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "stent",
        prompt: "How do you place the ostial-to-shaft stent?",
        options: [
          {
            text: "Advance the stent, disengage the guide, pull back until 1–2 mm protrudes into the aorta, confirm in AP cranial and LAO cranial, deploy, flare with the balloon partly in the aorta, then re-engage gently",
            best: true,
            feedback: "This is Brilakis's aorto-ostial sequence with his left main views. Flaring the overhang lets the guide re-engage without deforming the stent.",
          },
          {
            text: "Deploy with the guide engaged so that the stent cannot move",
            feedback: "An engaged guide covers the ostium and can crush the proximal stent edge; disengage before positioning.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Place the proximal marker 3 mm inside the ostium to avoid metal in the aorta",
            feedback: "That leaves the true ostium uncovered (geographic miss), which the balloon shoulder can hide on angiography.",
            next: "c-ostium-missed",
            stateDelta: { stability: -10, flags: ["ostium-missed"] },
          },
        ],
      },
      {
        id: "c-ostium-missed",
        kind: "consequence",
        prompt: "The angiogram looks good, but IVUS shows the proximal stent edge 3 mm inside the ostium with plaque at the true ostium. What now?",
        options: [
          {
            text: "Cover the ostium with a second, short stent placed 1–2 mm into the aorta, flare it and re-image",
            best: true,
            feedback: "Brilakis's remedy for a missed ostium is another stent that covers it fully. The angiogram looked good because the balloon shoulder dilated the true ostium.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept it, because the angiographic result is good",
            feedback: "Residual ostial disease outside the stent invites restenosis at the most dangerous site in the coronary tree.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "end",
        prompt: "IVUS confirms ostial coverage with 12.6 mm² in the left main, about 90% of its 13.9 mm² reference. Contrast so far is 140 mL. The occluded RCA could also be attempted. What do you do?",
        options: [
          {
            text: "Stop here; keep the plan for the support device and sheath agreed with the team, and discuss the RCA CTO separately after recovery",
            best: true,
            feedback: "The left main is the lesion that mattered; with an eGFR of 24 the contrast already given is substantial, and a CTO attempt now would prolong a high-risk procedure. Staging is a plan, not a failure.",
          },
          {
            text: "Attempt the RCA CTO now while support is in place",
            feedback: "Extending a long, high-risk case in a patient with stage 4 kidney disease adds contrast, time and risk; it belongs to a separate, planned procedure if it is indicated at all.",
            stateDelta: { stability: -15 },
          },
        ],
        variants: [{ flag: "ostium-missed", info: "A second, short ostial stent was needed after the first stopped short of the ostium; contrast used so far includes those extra runs." }],
      },
    ],
    outcome:
      "The left main was treated under planned support with a preloaded wire, atherectomy, an ostial stent placed 1–2 mm into the aorta and confirmed by IVUS. Support was weaned, or the standby sheath managed, as planned at the end of the case, and she went to the coronary care unit with the PA catheter in place.",
    outcomeVariants: [
      { flag: "no-plan", text: "Without a support plan, the device had to go in during a crisis, which is the situation planning is meant to prevent." },
      { flag: "underexpanded", text: "Direct stenting left an underexpanded ostial stent that needed high-pressure rescue." },
      { flag: "dissection-risk", text: "An aggressive, deeply seated guide at a calcified ostium exposed her to dissection she could not afford." },
    ],
    learningPoints: [
      "Oxford defines CHIP by features coexisting from three groups (complex anatomy, comorbidity, haemodynamic compromise); Kirtane counts any combination. A normal blood pressure does not exclude abnormal haemodynamics.",
      "Abnormal haemodynamics plus high-risk PCI: Brilakis advises prophylactic support in most; since CHIP-BCIS3 both upfront support and standby are defensible, and the choice is discussed and recorded.",
      "Device support does not make a left main 'protected': still no side-hole guide.",
      "Ostial left main: preload a wire, disengage by torquing, prepare calcium thoroughly, stent 1–2 mm into the aorta, flare and confirm with IVUS.",
      "Stage the rest when kidney function, contrast and time are limiting.",
    ],
    refs: [...BOOKS, "perera-chip-bcis3-2026", "perera-bcis1-2010", "kirtane-chip-2016"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-lm-ivus-for-ostium",
    lab: "pci",
    when: { phase: ["imaging", "plan"], vessel: ["LM"] },
    title: "Image the left main with IVUS",
    text: "For an ostial or intermediate left main, IVUS is the better tool: it needs no flush, penetrates further and can show the ostium, which OCT struggles to clear. Pull back from both the LAD and the circumflex and use the smaller MLA, and read a two-dimensional ostial area with care because the vessel leaves the aorta at a slant.",
    tone: "do",
    lessonId: "cp-left-main-assess",
    sources: [
      { book: "brilakis-pci", loc: "13.1" },
      { book: "brilakis-pci", loc: "15.1" },
      { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-lm-damping-causes",
    lab: "diagnostic",
    when: { phase: ["engage-left"], event: ["pressure-damped", "pressure-ventricularised"], vessel: ["LM"] },
    title: "Damping at the left main: find the cause, do not inject",
    text: "Damping while the left main is intubated usually means a left main stenosis, the tip pointing into the wall, spasm, or a short left main with the tip in the LAD or circumflex. Do not inject: withdraw until the trace is free, and if engagement always damps, take non-selective images from the sinus.",
    tone: "caution",
    lessonId: "cp-left-main-assess",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-lm-short-injections",
    lab: "diagnostic",
    when: { phase: ["inject"], vessel: ["LM"] },
    title: "Short left injections when the left supplies everything",
    text: "If the circulation is left dominant or the RCA is occluded, keep left coronary injections short: long runs can make the patient hypotensive. If contrast hangs in the artery after the injection, the catheter is probably blocking the ostium; disengage at once, because VT or VF can follow.",
    tone: "caution",
    lessonId: "cp-left-main-assess",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-no-side-hole-guide",
    lab: "pci",
    when: { phase: ["plan", "guide"], vessel: ["LM"] },
    title: "No side holes in an unprotected left main",
    text: "Side-hole guides keep the trace looking normal while the tip obstructs the left main, so global ischaemia can go unnoticed; with a short left main a deep guide can block the circumflex completely behind a pseudonormal trace. Use them only in a graft-protected left main (or for an ostial left main CTO).",
    tone: "caution",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "15.1" },
      { book: "brilakis-pci", loc: "28.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-preload-wire-ostial",
    lab: "pci",
    when: { phase: ["guide"], vessel: ["LM"], requires: ["aorto-ostial-lesion"] },
    title: "Ostial left main: wire ready before you seat",
    text: "With severe ostial left main disease, have a guidewire (and often a balloon on it) at the guide tip before engaging, so you can wire, or dilate, as soon as the guide seats and then back off. Alternatively, pass the wire with the guide sitting non-selectively at the ostium.",
    tone: "do",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-damped-torque-off",
    lab: "pci",
    when: { phase: ["guide", "wire"], vessel: ["LM"], event: ["pressure-damped", "pressure-ventricularised"] },
    title: "Damped at the left main: take the guide off",
    text: "Do not inject. Take the guide off the ostium now, by torquing it off axis rather than pulling it back, which can drag the wire out; the independent-hand technique or a floating wire in the aortic root helps. Work from just outside the ostium and re-seat only briefly.",
    tone: "caution",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-injections-dominance",
    lab: "pci",
    when: { phase: ["guide", "lesion-prep", "stent"], vessel: ["LM"] },
    title: "Gentle, short left main injections",
    text: "Inject by hand and gently, never into a damped guide, and keep injections short if the circulation is left dominant or the RCA is occluded, because long runs can drop the pressure.",
    tone: "caution",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "5.6" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-brief-inflations",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], vessel: ["LM"] },
    title: "Brief left main inflations, pressure in view",
    text: "Watch the aortic pressure throughout every left main balloon occlusion and keep inflations as short as you can, especially without a support device. A 70% saline, 30% contrast mix in the indeflator speeds inflation and deflation.",
    tone: "caution",
    lessonId: "cp-left-main-technique",
    sources: [{ book: "brilakis-pci", loc: "17.9" }],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-hypotension-inflation",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"], vessel: ["LM"], event: ["hypotension"] },
    title: "Pressure falls during a left main inflation",
    text: "Deflate at once to restore flow, start a vasopressor such as noradrenaline early, and plan shorter inflations. If it recurs or the patient develops pulmonary oedema, support is needed now: go to the device decision.",
    tone: "bailout",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.2" },
      { book: "brilakis-pci", loc: "17.9" },
      { book: "brilakis-pci", loc: "14.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-ostial-stent-position",
    lab: "pci",
    when: { phase: ["stent"], vessel: ["LM"], requires: ["aorto-ostial-lesion"] },
    title: "Ostial left main stent: 1–2 mm into the aorta",
    text: "Advance the stent, disengage the guide, then pull the stent back until 1–2 mm protrudes into the aorta. Check the position in more than one view (AP cranial, and LAO cranial in particular), deploy, flare the overhang with the balloon partly withdrawn into the aorta, re-engage gently, and confirm coverage with IVUS.",
    tone: "do",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.10" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-stent-expansion-limit",
    lab: "pci",
    when: { phase: ["plan", "stent"], vessel: ["LM"] },
    title: "Can this stent reach the left main diameter?",
    text: "Size a stent that crosses from the left main into a branch to the distal vessel, but choose a platform whose labelled post-dilatation limit reaches the left main diameter, because the proximal part will be optimised to it. Peripheral stents exist for vessels of 6 mm or more.",
    tone: "caution",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.10" },
      { book: "brilakis-pci", loc: "10.2" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-dissection-bailout",
    lab: "pci",
    when: { phase: ["complication", "guide"], event: ["dissection"], vessel: ["LM"] },
    title: "Left main dissection: keep the wire, stent fast",
    text: "Keep any wire in the true lumen, disengage, and inject only cautiously and non-selectively. Confirm the lumen with IVUS rather than OCT, wire both branches if the bifurcation is involved, stent the entry quickly, and get femoral access ready for support. If the wire is lost, try parallel wires, IVUS and CTO re-entry methods; if the true lumen still cannot be wired, call the surgeons. A stain in the aortic wall means stop injecting and seal the ostium with an IVUS-guided stent protruding 1–2 mm into the aorta.",
    tone: "bailout",
    lessonId: "cp-left-main-technique",
    sources: [
      { book: "brilakis-pci", loc: "17.5" },
      { book: "brilakis-pci", loc: "25.2" },
      { book: "oxford-cath", loc: "ch 10: Left main stem dissection" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-lm-distal-strategy",
    lab: "pci",
    when: { phase: ["plan"], vessel: ["LM"] },
    title: "Distal left main: provisional unless truly bifurcated",
    text: "Without significant circumflex disease, plan provisional stenting. For a true bifurcation (Medina 1,1,1 or 0,1,1) Brilakis prefers DK crush, but EBC MAIN later found no benefit from planned dual stenting, and the 2026 consensus reserves upfront circumflex treatment for complex circumflex disease (70% or more, 10 mm or longer, calcified, MLA below 4 mm²): know both positions and record your reasoning. Keep simultaneous kissing stents for emergencies.",
    tone: "do",
    lessonId: "cp-left-main-distal",
    sources: [
      { book: "brilakis-pci", loc: "17.10" },
      { book: "brilakis-pci", loc: "16.1" },
    ],
    refs: [...BOOKS, "dkcrush5-2017", "ebc-main-2021", "johnson-eapci-lm-imaging-2026"],
  },
  {
    id: "pci-lm-jailed-circumflex",
    lab: "pci",
    when: { phase: ["physiology", "optimise"], vessel: ["LM"], event: ["side-branch-compromise"] },
    title: "Jailed circumflex: measure before a second stent",
    text: "After a left main-to-LAD stent, give nitroglycerin and assess a narrowed-looking circumflex ostium with physiology and imaging. FFR above 0.80, or a resting index above its cut-off: defer. FFR 0.80 or less: rewire through a distal strut, kiss and repeat the POT, and add a stent by T-stenting, TAP, reverse crush or culotte only if the result is still inadequate. Restore flow first if the branch is truly compromised (below TIMI 3, over 70% or a type B or worse dissection).",
    tone: "do",
    lessonId: "cp-left-main-distal",
    sources: [
      { book: "brilakis-pci", loc: "17.12" },
      { book: "brilakis-pci", loc: "16.1" },
    ],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-circumflex-occluded",
    lab: "pci",
    when: { phase: ["stent", "optimise"], vessel: ["LM"], event: ["side-branch-compromise", "acute-closure"] },
    title: "Circumflex occluded after the cross-over stent",
    text: "If you can rewire it, go through a distal strut and pull the jailed wire only once a low-profile balloon has entered the circumflex; then kiss and POT. If you cannot, pass a 1.0–1.5 mm balloon (or a torquable microcatheter) over the jailed wire, dilate to restore flow, rewire through the stent (ideally via a dual-lumen microcatheter), remove the jailed wire, kiss and POT, or convert to an inverted DK crush.",
    tone: "bailout",
    lessonId: "cp-left-main-distal",
    sources: [{ book: "brilakis-pci", loc: "16.2" }],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-jailed-wire-removal",
    lab: "pci",
    when: { phase: ["optimise"], vessel: ["LM"], event: ["equipment-entrapment"] },
    title: "Jailed circumflex wire stuck: do not pull hard",
    text: "A hard pull can fracture or unravel the wire and can draw the guide deep into the left main, where it may dissect it. Use steady gentle traction, run a small balloon or microcatheter up to the trapped point and withdraw gently, or inflate a small balloon further down the branch to free it and then repeat the POT; turning the wire with a torque device can help.",
    tone: "caution",
    lessonId: "cp-left-main-distal",
    sources: [{ book: "brilakis-pci", loc: "16.2" }],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-no-routine-kissing",
    lab: "pci",
    when: { phase: ["optimise"], vessel: ["LM"] },
    title: "No routine kissing after provisional left main",
    text: "Brilakis sees no clear gain from kissing every provisional left main bifurcation stent by routine; the European Bifurcation Club takes the opposite view and recommends POT, distal rewiring and kissing, and neither has randomised outcome proof. Optimise the left main portion with POT, decide on the circumflex from physiology and imaging, and if you kiss, rewire distally and repeat the POT.",
    tone: "do",
    lessonId: "cp-left-main-distal",
    sources: [{ book: "brilakis-pci", loc: "17.10" }],
    refs: BRILAKIS,
  },
  {
    id: "pci-lm-trifurcation",
    lab: "pci",
    when: { phase: ["plan", "stent"], vessel: ["LM"] },
    title: "Left main trifurcation",
    text: "Use a single stent if no side branch has significant disease. If one does, any two-stent technique can be used; think about finishing with three balloons inflated together so the polygon of confluence stays open. Use a 7 or 8 Fr guide.",
    tone: "do",
    lessonId: "cp-left-main-distal",
    sources: [{ book: "brilakis-pci", loc: "17.10" }],
    refs: BRILAKIS,
  },
  {
    id: "pci-chip-three-domains",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Is this a CHIP case?",
    text: "Oxford defines a complex high-risk indicated PCI by features coexisting from three groups: complex anatomy (unprotected left main, SYNTAX above 33, the last patent vessel), a heavy comorbidity burden and haemodynamic compromise (ejection fraction below 35%, systolic pressure below 100 mmHg or cardiac index below 2.2 L/min/m²); Kirtane's framing counts any combination. When the groups stack up, plan support, sequence and escalation before the patient arrives.",
    tone: "do",
    lessonId: "cp-left-main-chip",
    sources: [
      { book: "oxford-cath", loc: "ch 9: Mechanical circulatory support devices" },
      { book: "brilakis-pci", loc: "30" },
    ],
    refs: ["oxford-cath-handbook", "kirtane-chip-2016"],
  },
  {
    id: "pci-lm-support-triggers",
    lab: "pci",
    when: { phase: ["plan"], vessel: ["LM"] },
    title: "When a left main case needs a support plan",
    text: "Left main cases often have support when there is a low ejection fraction, a high LVEDP or wedge, an occluded RCA, or a long ischaemic step such as atherectomy, and complex bifurcation stenting with a depressed LV may justify it; an ostial left main alone rarely needs it. Decide upfront support or standby with the team (CHIP-BCIS3 found no benefit from routine elective unloading) and leave the PA catheter in.",
    tone: "do",
    lessonId: "cp-left-main-chip",
    sources: [
      { book: "brilakis-pci", loc: "17.14" },
      { book: "brilakis-pci", loc: "16.2" },
      { book: "brilakis-pci", loc: "15.1" },
      { book: "brilakis-pci", loc: "14.1" },
    ],
    refs: ["brilakis-manual-pci", "perera-chip-bcis3-2026"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "stone-excel-5y-2019",
    kind: "trial",
    citation: "Stone GW, Kappetein AP, Sabik JF, et al. Five-year outcomes after PCI or CABG for left main coronary disease. N Engl J Med. 2019;381:1820–1830.",
    url: "https://doi.org/10.1056/NEJMoa1909406",
    note: "PMID: 31562798. Checked on PubMed: authors, title, journal, year, volume 381, issue 19, pages 1820–1830. EXCEL: 1905 patients with left main disease of low or intermediate anatomical complexity; death, stroke or MI at 5 years 22.0% PCI vs 19.2% CABG (P = 0.13); all-cause death 13.0% vs 9.9%; ischaemia-driven revascularisation 16.9% vs 10.0%; all cerebrovascular events 3.3% vs 5.2%; stroke 2.9% vs 3.7% (not significant). Cited by Brilakis (17.7, reference 1, printed without authors as N Engl J Med 2019;381:1789).",
    verified: true,
  },
  {
    id: "holm-noble-5y-2020",
    kind: "trial",
    citation: "Holm NR, Mäkikallio T, Lindsay MM, et al. Percutaneous coronary angioplasty versus coronary artery bypass grafting in the treatment of unprotected left main stenosis: updated 5-year outcomes from the randomised, non-inferiority NOBLE trial. Lancet. 2020;395:191–199.",
    url: "https://doi.org/10.1016/S0140-6736(19)32972-1",
    note: "PMID: 31879028. Checked on PubMed: authors, title, journal, volume 395, issue 10219, pages 191–199 (published online December 2019). 1201 patients; 5-year MACCE 28% PCI vs 19% CABG (HR 1.58, 95% CI 1.24–2.01), CABG superior; all-cause mortality 9% vs 9%; non-procedural MI 8% vs 3%; repeat revascularisation 17% vs 10%. Cited by Brilakis (17.7, reference 6).",
    verified: true,
  },
  {
    id: "chen-dkcrush3-2013",
    kind: "trial",
    citation: "Chen SL, Xu B, Han YL, et al. Comparison of double kissing crush versus Culotte stenting for unprotected distal left main bifurcation lesions: results from a multicenter, randomized, prospective DKCRUSH-III study. J Am Coll Cardiol. 2013;61:1482–1488.",
    url: "https://doi.org/10.1016/j.jacc.2013.01.023",
    note: "PMID: 23490040. Checked on PubMed: authors, title, journal, year, volume 61, issue 14, pages 1482–1488. 419 patients randomised to DK crush (210) or culotte (209); 1-year MACE 6.2% vs 16.3%, mainly from TVR (4.3% vs 11.0%); side-branch ISR 6.8% vs 12.6%. Cited by Brilakis (16.2.10.5 and 16.2.10.6, reference 11).",
    verified: true,
  },
  {
    id: "kirtane-chip-2016",
    kind: "paper",
    citation: "Kirtane AJ, Doshi D, Leon MB, et al. Treatment of higher-risk patients with an indication for revascularization: evolution within the field of contemporary percutaneous coronary intervention. Circulation. 2016;134:422–431.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.116.022061",
    note: "PMID: 27482004; PMC9117111. Checked on PubMed: authors, title, journal, year, volume 134, issue 5, pages 422–431. Abstract: patients with an indication for revascularisation at high procedural risk from comorbidities, anatomical complexity and/or poor haemodynamics; calls for dedicated specialists and multidisciplinary pre-procedural risk and treatment assessment. Cited by Brilakis (30.20, reference 82) for support devices as part of complex high-risk PCI programmes.",
    verified: true,
  },
  {
    id: "hamilos-lm-ffr-2009",
    kind: "paper",
    citation: "Hamilos M, Muller O, Cuisset T, et al. Long-term clinical outcome after fractional flow reserve-guided treatment in patients with angiographically equivocal left main coronary artery stenosis. Circulation. 2009;120:1505–1512.",
    url: "https://doi.org/10.1161/CIRCULATIONAHA.109.850073",
    note: "PMID: 19786633. Checked on PubMed: authors, title, journal, year, volume 120, issue 15, pages 1505–1512. 213 patients with an angiographically equivocal left main stenosis; FFR 0.80 or more managed without surgery (138), below 0.80 CABG (75); 5-year survival 89.8% vs 85.4% (P = 0.48); 23% of lesions with diameter stenosis below 50% were significant by FFR. Cited by Brilakis (17.6, reference 4; 12.3, reference 4).",
    verified: true,
  },
  {
    id: "johnson-eapci-lm-imaging-2026",
    kind: "consensus",
    citation: "Johnson TW, Gonzalo N, de la Torre Hernandez JM, et al. Intracoronary imaging for left main percutaneous coronary intervention: a clinical consensus statement of the European Association of Percutaneous Cardiovascular Interventions (EAPCI) of the ESC and the European Bifurcation Club (EBC). Eur Heart J. 2026;47:5247–5265.",
    url: "https://doi.org/10.1093/eurheartj/ehag353",
    note: "PMID: 42135060; PMC13634641. Checked on PubMed (metadata and full text): authors, title, journal, year, volume 47, issue 37, pages 5247–5265. Used for: summary of current European guidance (CABG preferred, class I A; PCI for low-complexity left main disease with SYNTAX 22 or less, class I A; more complex disease only if unsuitable for CABG, class IIb B); IVUS or OCT both supported, OCTIVUS 264 left main patients with equivalent outcomes, IVUS favoured for ostial extension and advanced CKD; pullbacks from LAD and circumflex with the smallest MLA used; MLA 4.5–6 mm2 should lead to consideration of invasive physiology; Western trials have challenged the Korean 5-6-7-8 criteria (EXCEL and NOBLE IVUS left main MSA 9.9 and 12.5 mm2); 80–90% relative expansion; circumflex complexity markers (diameter stenosis 70% or more, MLA below 4 mm2 or plaque burden above 55%, length 10 mm or more, calcification, instability) and Bif-ARC complex bifurcation criteria; EBC recommends POT, distal side-branch rewiring and kissing in provisional stenting, without randomised outcome data; strut clearance by kissing needed to image the circumflex ostium. Round 1 fixes: Bif-ARC complex bifurcation quoted as true bifurcation (Medina 1,1,1, 1,0,1 or 0,1,1) plus SB disease length 10 mm or more, thrombotic lesion, calcium arc above 60 degrees at the culprit site or perceived difficulty with SB access (retroflexed circumflex, LM-circumflex angle below 90 degrees); discussion of OPTIMAL (mean SYNTAX 29.7, pre-PCI IVUS in 65.1%, post-stent IVUS triggered optimisation in 29.3%); recent American and European guidelines endorse imaging for LM PCI.",
    verified: true,
  },
  {
    id: "testa-optimal-2026",
    kind: "trial",
    citation: "Testa L, De la Torre Hernandez JM, De Maria GL, et al. IVUS-guided versus angiography-guided PCI in unprotected left main coronary disease. N Engl J Med. 2026;394:2189–2199.",
    url: "https://doi.org/10.1056/NEJMoa2600440",
    note: "PMID: 41911017. Checked on PubMed: authors, title, journal, year, volume 394, issue 22, pages 2189–2199. OPTIMAL (NCT04111770): 806 patients with unprotected left main disease randomised to IVUS-guided (401) or angiography-guided (405) PCI; patient-oriented composite of any stroke, any MI, any revascularisation or death from any cause at a median of 2.9 years 33.7% vs 30.9% (HR 1.11, 95% CI 0.87–1.42; P = 0.40); no additional benefit from IVUS guidance.",
    verified: true,
  },
  {
    id: "emara-lm-ivus-meta-2026",
    kind: "paper",
    citation: "Emara A, Awashra A, Mansour A, et al. Clinical and procedural outcomes of IVUS-guided versus angiography-guided PCI in unprotected left main coronary disease: an updated meta-analysis of randomized controlled trials. Int J Cardiol. 2026;463:134755.",
    url: "https://doi.org/10.1016/j.ijcard.2026.134755",
    note: "PMID: 42648372. Checked on PubMed: authors, title, journal, year, volume 463, article 134755. Four RCTs, 1446 patients; MACE RR 0.57 (95% CI 0.30–1.09; P = 0.09), not significant in the primary random-effects analysis; significant only after excluding OPTIMAL in an exploratory leave-one-out analysis; no significant difference in cardiac death, MI, TLR, TVR or stent thrombosis.",
    verified: true,
  },
];
