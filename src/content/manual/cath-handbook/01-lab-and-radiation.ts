// Module hb-lab-and-radiation: the lab, imaging equipment and radiation safety (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, ch 1 (background, definitions, history of
// cardiac catheterization, cardiac CT or invasive angiography, radiology equipment, fluoroscopy and acquisition, radiation
// safety, dose excess, patient and laboratory preparation), ch 2 (the radiographer; the cardiac physiologist's procedure
// record), ch 3 (the Seldinger technique; trends in vascular access), ch 4 (ventriculography), ch 8 (history; indications for
// PCI; imaging the lesion); Brilakis, Manual of PCI: 1.1, 1.4, 1.5 (planning, CT before the case), 2.5 (radiation dose: X-ray
// system and shield positioning), 2.6 (contrast from a recent CT), 2.12 (collimation hides equipment), 6.4 (positioning
// patient, receptor, shields and operator), 7.3 (ad hoc versus staged PCI), 8.9 (trapping), 21.8 (reasons to stop a CTO
// attempt), 28.2 (radiation skin injury: causes, prevention, treatment) and 30.19 (radiation protection equipment).
// New references (PubMed-checked) are in `refs` below; UK dose limits and the pregnancy rule checked against the Ionising
// Radiations Regulations 2017 (Schedule 3, reg 9), and patient-exposure rules against IR(ME)R 2017 (regs 6, 8, 14, 18),
// both on legislation.gov.uk.
// Every claim is listed with its page in docs/curriculum/evidence/hb-lab-and-radiation.md.
// Neighbouring modules: cm-patient-complications (high-dose cases: the skin-injury bands, follow-up after 5, 10 and 15 Gy,
// dose excess), pm-acquiring (room set-up for angiography and the first views), pm-monitoring (who watches the dose),
// pm-planning (dose and contrast ceilings at planning), pm-access (the Seldinger technique in practice).
// Academy lessons this module builds on: fnd-safety-rad-principles, fnd-safety-rad-practice, bed-ind-radiation-ergonomics,
// fnd-path-ccs and phy-ad-ct.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OXFORD = ["oxford-cath-handbook"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "hb-lab-and-radiation",
  title: "The lab, imaging equipment and radiation safety",
  stage: 1,
  summary:
    "Where the catheter laboratory came from, when a CT scan should replace or prepare an invasive angiogram, how the C-arm makes its image and its dose, what each number on the dose display means, and the habits that keep the dose to the patient and to you as low as the job allows.",
  objectives: [
    "Define cardiac catheterisation, coronary angiography, PTCA and PCI, and place the milestones from 1929 to the stent era in order, knowing where the sources disagree on dates and details.",
    "Decide between CT coronary angiography and invasive angiography from the question asked, the likelihood of disease and the features that spoil CT, and use a CT to plan an invasive case.",
    "Explain how the X-ray tube, the controls (kV, mA, filtration), automatic dose-rate control and the detector shape both image quality and dose, and choose fluoroscopy or cine for each task.",
    "Read the dose display (air kerma, dose–area product, dose rate, fluoroscopy time), relate each number to deterministic or stochastic harm, and explain the dose and risk of a coronary angiogram to a patient.",
    "Apply the UK IR(ME)R framework in the lab: the duty holders, the clinical evaluation and audit of each exposure, diagnostic reference levels, and the reporting and notification of a dose that is greater than expected; and use Oxford's general rule of a radiographer warning at 1 Gy.",
    "Run a dose-reduction routine through a whole case: planning, equipment, pedal discipline, frame rate, magnification, collimation, angulation, geometry, moving the skin entry point and stopping or staging.",
    "Protect yourself and the team: dosimeters, lead aprons, thyroid collars and glasses, shield positions, distance, operator-only devices and the UK dose limits.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-history",
      title: "What the lab does and how it came to be",
      minutes: 14,
      topics: ["fnd-background-history"],
      sources: [
        O("ch 1: Background"),
        O("ch 1: Definitions"),
        O("ch 1: History of cardiac catheterization"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 3: The Seldinger technique"),
        O("ch 8: History"),
        O("ch 8: Indications for PCI"),
      ],
      refs: [
        "oxford-cath-handbook",
        "packy-forssmann-2016",
        "meyer-forssmann-1990",
        "zimmerman-left-heart-1950",
        "seldinger-technique-1953",
        "ryan-angiogram-history-2002",
        "gruntzig-ptca-1978",
        "sigwart-stents-1987",
      ],
      blocks: [
        {
          kind: "p",
          text: "Everything you will do in the lab rests on a handful of experiments made over about six decades: a catheter passed from a vein into the heart, a needle-and-wire way into an artery, contrast injected selectively into a coronary artery, and finally a balloon and then a metal scaffold carried along the same route. Knowing the sequence explains why the lab is built and staffed as it is. The Oxford handbook adds a practical point about learning: these skills are still taught mainly by apprenticeship, shaped by the habits and beliefs of the trainer, so an independent reference is worth having beside you.",
        },
        {
          kind: "table",
          caption: "The words you will use every day (Oxford ch 1 and ch 8)",
          head: ["Term", "What it means", "What it does not tell you"],
          rows: [
            ["Cardiac catheterisation", "Passing a catheter into the right heart, the left heart or both to gain diagnostic information about the heart or the vessels", "On its own, nothing about the coronary lumen unless the coronaries are injected"],
            ["Coronary angiography", "Injecting contrast into the coronary arteries under X-ray to show their anatomy and how far each lumen is narrowed. Oxford calls it the standard investigation for known or suspected coronary disease, and it remains the reference for coronary anatomy; for suspected chronic coronary syndrome the 2024 ESC guideline usually starts with a non-invasive test (next lesson)", "Anything beyond the lumen: Oxford calls it 'lumenography', because the wall and the plaque are invisible. It does give clues to atheroma extent, thrombus, spasm, myocardial bridging and dissection"],
            ["PTCA", "Percutaneous transluminal coronary angioplasty: dilating a coronary narrowing with a balloon passed through the skin and along the artery", "Whether a stent was used; PTCA is balloon dilatation alone"],
            ["PCI", "Percutaneous coronary intervention: the umbrella term that grew out of PTCA, covering balloon dilatation, stents and the adjunctive therapeutic and imaging techniques", "Which of those techniques was used in a given case"],
          ],
        },
        {
          kind: "steps",
          title: "Milestones, in order",
          items: [
            {
              title: "1929: a catheter in the right heart",
              detail:
                "Werner Forssmann, after first working on cadavers, passed a modified urinary catheter into his own right heart under fluoroscopy, watching in a mirror, and proved its position on a chest X-ray: the first documented right heart catheterisation. A historical review describes him as a 25-year-old surgical trainee one year out of medical school, who later went on to opacify his own right heart chambers by injecting iodinated contrast through the catheter. **The route differs between sources:** the Oxford handbook says the catheter went through the internal jugular vein to the right atrium; a more recent historical review states that he entered through an antecubital (arm) vein and reached his right ventricle.",
            },
            {
              title: "1941: right heart studies become a method",
              detail: "André Cournand turned right heart catheterisation into a detailed physiological study. Oxford says he catheterised the right ventricle in 1941, although the 1941 paper Oxford lists in its further reading is titled as catheterisation of the right auricle (atrium).",
            },
            {
              title: "Late 1940s: the left heart",
              detail:
                "Oxford credits Zimmerman with the first simultaneous left and right heart catheterisation and dates it to 1947. The paper in which Zimmerman, Scott and Becker reported catheterisation of the left side of the heart in man was published in Circulation in 1950, so quote the date with care.",
            },
            {
              title: "1953: a safe way into the vessel",
              detail:
                "Sven-Ivar Seldinger, a Swedish radiologist, described a percutaneous way into the artery designed for arteriography: a needle puncture, a wire passed through the needle, the needle removed, and a catheter passed over the wire in its place, which is what his title, Catheter replacement of the needle, describes. Oxford says the technique is now used in modified form, and its Fig. 3.1 shows today's version: puncture with a hollow bevelled needle, a soft curved-tip wire through it, the needle withdrawn over the wire, an introducer sheath (with or without a dilator) slid over the wire, then the wire removed so that you work through the sheath's haemostatic valve. Every arterial and venous access in this app is a version of it (pm-access teaches it in practice).",
            },
            {
              title: "1956: the Nobel Prize",
              detail: "Forssmann, Cournand and Dickinson Richards were jointly awarded the 1956 Nobel Prize for physiology and medicine for this work.",
            },
            {
              title: "1958 or 1959: selective coronary angiography",
              detail:
                "F. Mason Sones at the Cleveland Clinic developed selective injection of the coronary arteries. Oxford dates his technique to 1959; Ryan's historical account dates the first selective hand injection, into the right coronary artery of a middle-aged man, to 30 October 1958. For the first time the coronary lumen could be seen reliably in a living patient.",
            },
            {
              title: "Mid-1960s: dilating arteries from inside",
              detail:
                "Charles Dotter and Melvin Judkins dilated narrowed leg arteries in patients with severe ischaemic rest pain by passing sequentially larger coaxial sheaths through them. In the same era, according to Ryan, the coronary angiogram led René Favaloro to introduce aortocoronary bypass surgery in May 1967.",
            },
            {
              title: "16 September 1977: the first coronary angioplasty",
              detail:
                "Andreas Gruentzig performed the first PTCA in a conscious patient, in Zurich. It followed years of work on a balloon fit for inflation inside a coronary artery, tested in animals, then in post-mortem specimens, then in peripheral arteries of patients and in coronary arteries during bypass surgery. His key idea, in Oxford's account, was that pressing outwards on the vessel wall (radial force) dilates a stenosis better than pushing dilators along it (longitudinal force). The patient had exertional angina from a severe proximal LAD lesion; the balloon crossed without event, it was inflated twice to relieve the pressure gradient across the lesion, and the angiographic result was good, with no chest pain, ST shift or arrhythmia. Oxford gives his age as 38 in chapter 1 and as 37 (an insurance salesman) in chapter 8. Gruentzig reported the case in the Lancet in 1978.",
            },
            {
              title: "1979: angiography opens the infarct artery",
              detail:
                "Ryan records that in July 1979 Peter Rentrop recanalised an occluded infarct artery with a guidewire and then infused streptokinase into it, opening the reperfusion era that leads to primary PCI.",
            },
            {
              title: "1986 onwards: the stent",
              detail:
                "Oxford's history page dates the first coronary stent implants to 1986. An early human series, reported by Sigwart and colleagues in 1987, used a self-expanding stainless-steel mesh: 24 coronary stents in 19 patients with restenosis, abrupt closure after angioplasty or failing bypass grafts. Oxford's PCI chapter credits Julio Palmaz and Richard Schatz with pioneering stents to prevent abrupt closure and, above all, to scaffold balloon-induced dissection. From the early 1990s devices multiplied; stents are now used in nearly every PCI, and Oxford notes that their uptake has paralleled a fall in the need for urgent bypass surgery and in procedural mortality to below 1%.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A medical student asks what changed in 1977 that the Dotter–Judkins approach had not achieved. Which answer matches Oxford's account?",
          options: [
            "Gruentzig was the first to cross a stenosis with a guidewire, which earlier operators had never attempted",
            "Gruentzig used a balloon that pressed outwards on the vessel wall, a radial force, rather than coaxial dilators pushed along the lesion",
            "Gruentzig was the first to use stainless-steel stents to hold a balloon-dilated coronary artery open",
            "Gruentzig was the first to reach the coronary arteries from the femoral artery rather than from the arm",
          ],
          answer: 1,
          explanation:
            "Oxford credits Gruentzig's realisation that radial force on the wall dilates a stenosis better than longitudinal force; Dotter and Judkins had used sequentially larger coaxial sheaths in leg arteries. Stents came almost a decade later (first coronary implants dated to 1986), so the stent option confuses two eras.",
        },
        {
          kind: "check",
          stem: "You are placing a sheath by the Seldinger method. The guidewire has just passed through the needle into the artery. What is the next step?",
          options: [
            "Advance the sheath over the needle while the wire stays in place inside it",
            "Withdraw the wire and pass the sheath through the needle into the vessel",
            "Remove the needle, leaving the wire in the vessel, and then pass the sheath over the wire",
            "Inject contrast through the needle to confirm the position before going further",
          ],
          answer: 2,
          explanation:
            "Needle, wire through the needle, needle out over the wire, sheath (with or without a dilator) over the wire, wire out leaving the sheath and its haemostatic valve. The sheath never goes over or through the needle: the wire is the rail over which the catheter or sheath replaces the needle, which is what Seldinger's title, Catheter replacement of the needle, describes. In 1953 it was a catheter; the valved introducer sheath is the modern form.",
        },
        {
          kind: "table",
          caption: "Gruentzig's original selection criteria and what PCI now takes on (Oxford ch 8)",
          head: ["Gruentzig required", "Patients and lesions treated today"],
          rows: [
            ["Stable angina", "Unstable patients: acute MI treated by primary PCI, acute coronary syndromes, cardiogenic shock"],
            ["Ischaemia documented on functional testing", "Multivessel disease"],
            ["Single-vessel disease, ideally a proximal lesion that was neither occluded nor calcified", "Bifurcation lesions, left main stem disease, vein graft disease"],
            ["Nothing that would rule out bypass surgery as a bail-out (for example malignancy, severe LV dysfunction or lung disease)", "Patients judged unsuitable for or unfit for bypass surgery"],
          ],
        },
        {
          kind: "check",
          stem: "Which patient would have met all of Gruentzig's original criteria for angioplasty?",
          options: [
            "Stable angina, a positive exercise perfusion scan, a single non-calcified, non-occluded proximal LAD stenosis, and fit for bypass surgery",
            "Unstable angina, a single proximal LAD stenosis on angiography, and turned down for bypass surgery because of severe lung disease",
            "Stable angina with ischaemia on stress echo, a calcified proximal RCA stenosis and a moderate LCx stenosis, fit for bypass",
            "Stable angina with no functional test, a single proximal LAD occlusion, and fit for bypass surgery",
          ],
          answer: 0,
          explanation:
            "The four criteria were stable angina, documented ischaemia, single-vessel disease (preferably proximal, not occluded, not calcified) and no reason surgery could not be the bail-out. Each distractor breaks at least one: instability and unfitness for surgery, calcium and a second vessel, or occlusion without a functional test. Oxford's view is that patients who meet the criteria still do well with few complications.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling every PCI an angioplasty: PTCA is balloon dilatation; PCI includes stents, imaging and adjunctive devices.",
            "Reading the angiogram as if it showed the vessel wall. It shows the lumen only; plaque burden and wall structure need intravascular imaging.",
            "Quoting a single date or detail as settled when the sources differ (Forssmann's route, Cournand's chamber, Zimmerman's year, Sones's year, the first PTCA patient's age).",
            "Forgetting that the reference you learn from first, your trainer, carries personal habits; check them against a written source.",
          ],
        },
        {
          kind: "pearl",
          text: "Gruentzig's four criteria still describe the lowest-risk PCI. When a case meets all of them, expect a straightforward procedure; every criterion it fails is a reason to plan more carefully before you start.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the procedure lab, gain femoral access step by step: needle into the artery, wire through the needle, needle out, sheath over the wire, wire out. Name aloud each step as you do it; this is the modern form of Seldinger's 1953 technique.",
        },
        {
          kind: "keypoints",
          items: [
            "Cardiac catheterisation is diagnostic passage of a catheter into the heart; coronary angiography shows the coronary lumen and nothing beyond it.",
            "1929 Forssmann (right heart, on himself); 1941 Cournand; Zimmerman's left heart work (Oxford 1947; published 1950); 1953 Seldinger; 1956 Nobel Prize.",
            "Selective coronary angiography: Sones at the Cleveland Clinic (Oxford 1959; Ryan 30 October 1958).",
            "First PTCA by Gruentzig, Zurich, 16 September 1977: a severe proximal LAD lesion; radial rather than longitudinal force was the key idea.",
            "First coronary stents 1986; stents now used in almost every PCI, alongside fewer urgent bypass operations and procedural mortality under 1%.",
            "Gruentzig's criteria (stable angina, documented ischaemia, simple single-vessel disease, surgery available) still define the easy case.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-ct",
      title: "CT coronary angiography or invasive angiography",
      minutes: 14,
      topics: ["dx-ct-vs-invasive"],
      sources: [O("ch 1: Cardiac CT or invasive angiography?"), O("ch 1: Radiation safety"), B("1.1"), B("1.4"), B("1.5"), B("2.6"), B("28.2")],
      refs: [...BOOKS, "esc-ccs-2024", "stocker-protection-vi-2018"],
      blocks: [
        {
          kind: "p",
          text: "Invasive angiography became the reference test for coronary anatomy because it has two strengths that small, moving arteries demand: fine spatial resolution and fine temporal resolution. Cardiac CT has closed much of that gap. Oxford describes scanners that acquire up to 320 slices in one rotation and cover the whole heart within a single short breath-hold. The question in front of you is therefore not which test is better, but which test answers this patient's question with the least risk, and how a CT you already have should change the invasive case.",
        },
        {
          kind: "table",
          caption: "How CT performs against invasive angiography (Oxford ch 1)",
          head: ["Property", "What the evidence shows", "What it means at the bedside"],
          rows: [
            ["Sensitivity and negative predictive value", "Consistently high; the negative predictive value can reach 100%", "A normal CT is very reassuring: CT is mainly a rule-out test"],
            ["Specificity and positive predictive value", "Much lower, below 50% in some studies, and strongly dependent on technical and patient factors", "A 'stenosis' on CT may not be one at angiography; it is a reason for further assessment, not a diagnosis"],
            ["What degrades accuracy", "Scanner type (64 detector rows is the minimum standard), pretest probability, a high calcium score, a fast heart rate, a high body mass index", "Check these before you trust a positive or negative result"],
          ],
        },
        {
          kind: "steps",
          title: "Choosing the test, step by step",
          items: [
            {
              title: "1. Name the question",
              detail:
                "Ruling out coronary disease, proving ischaemia and planning revascularisation are different questions. CT answers the first well; Oxford notes that when the handbook was written both European and American guidelines put functional testing (cardiac MRI, stress echo, SPECT or PET) first for suspected disease, while expecting CT-derived FFR and perfusion CT to change that.",
            },
            {
              title: "2. Estimate how likely disease is",
              detail:
                "If the pretest probability is high, Oxford advises that CT should not usually be the test. The current guideline uses the same logic in a structured way: the 2024 ESC guideline for chronic coronary syndromes estimates the clinical likelihood of obstructive disease and prefers CT coronary angiography at low to moderate likelihood, functional imaging as likelihood rises, and invasive angiography directly when likelihood is very high or high-risk features are present (the Academy lesson fnd-path-ccs gives the bands).",
            },
            {
              title: "3. Look for features that spoil CT",
              detail:
                "Oxford lists a calcium score above 1000, a large body mass index and previous stents (accuracy for in-stent restenosis falls with stents smaller than 3 mm and with thick-strut, first-generation stents). A fast heart rate also degrades the images. If any applies, CT is unlikely to settle the question.",
            },
            {
              title: "4. Match the patient to a CT indication",
              detail:
                "Oxford's indications: ruling out disease in patients without known disease who have typical or atypical angina, or non-anginal pain with an abnormal resting ECG; excluding stable disease when probability is low to intermediate or a functional test was inconclusive; excluding coronary lesions in suspected ACS when the ECG and cardiac markers are inconclusive; checking saphenous vein graft patency; mapping the anatomy, distal landing zone and proximal cap before CTO revascularisation; and defining an anomalous coronary origin or course, including a fistula.",
            },
            {
              title: "5. If you go invasive, use the CT to plan",
              detail:
                "Brilakis's planning checklist uses CT before the case: a recent coronary CT angiogram can identify the target lesion in advance; a chest CT shows an anomalous arch, the size and disease of the subclavian and iliac arteries, and an arteria lusoria (an aberrant right subclavian artery, which favours left radial or femoral access); an abdominal and pelvic CT locates the femoral bifurcation and iliofemoral disease; an aortic CT shows a dilated aorta or anomalous coronary arteries that will change your catheter choice.",
            },
            {
              title: "6. Count the CT in today's budget",
              detail:
                "Brilakis asks you to take recent contrast, for example from a contrast CT, into account when you set the contrast limit for the procedure. Planning from a CT also prevents unnecessary steps, which saves both contrast and radiation.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A 74-year-old man with diabetes has typical exertional angina limiting him to one flight of stairs. A previous scan gave a coronary calcium score of 1400. His GP asks whether a CT coronary angiogram is the next test. What do you advise?",
          options: [
            "Yes: CT has a negative predictive value close to 100%, so it will rule out disease safely",
            "Yes, provided a 64-detector scanner is used, because that removes the effect of calcium on accuracy",
            "No: a high likelihood of disease and a calcium score above 1000 are settings where CT should not usually be used",
            "No: CT is contraindicated in diabetes because of the contrast load, so go straight to stress MRI",
          ],
          answer: 2,
          explanation:
            "Oxford lists both a high pretest probability and a calcium score above 1000 as reasons not to use CT: heavy calcium makes a positive result unreliable, and a high-likelihood patient needs a test that can lead to treatment. A 64-row scanner is only the minimum standard; it does not cancel the effect of calcium. The 2024 ESC guideline agrees on both counts: in older patients with heavily calcified arteries it suggests that functional testing may suit better than CT, and with a very high likelihood of disease it indicates invasive angiography (with invasive functional assessment available), particularly when symptoms persist despite anti-anginal treatment or angina comes on at a low workload.",
        },
        {
          kind: "table",
          caption: "Where CT helps and where it does not (Oxford ch 1)",
          head: ["CT is useful for", "CT should not usually be used for"],
          rows: [
            ["Ruling out disease at low to intermediate probability, or after an inconclusive functional test", "Patients with a high pretest probability of coronary disease"],
            ["Suspected ACS with an inconclusive ECG and inconclusive cardiac-injury markers", "A coronary calcium score above 1000"],
            ["Saphenous vein graft patency: grafts move less, are larger and tend not to calcify", "A large body mass index"],
            ["CTO planning: anatomy, distal landing zone and proximal cap", "Previous stents, especially smaller than 3 mm or thick-strut first-generation designs"],
            ["Anomalous coronary origin or course, including arteriovenous fistula", "(A fast heart rate also reduces accuracy)"],
          ],
        },
        {
          kind: "check",
          stem: "A woman with recurrent angina had PCI with 2.5 mm first-generation stents in the mid-LAD eight years ago. She asks for 'the scan instead of the camera test' to check the stents. What is the problem with CT here?",
          options: [
            "CT cannot image the LAD because it lies too close to the sternum",
            "CT accuracy for in-stent restenosis falls with stents under 3 mm and with thick-strut first-generation stents",
            "CT is accurate in stents but the radiation dose is far higher than an invasive angiogram",
            "Stents older than five years cannot be scanned because the metal heats in the scanner",
          ],
          answer: 1,
          explanation:
            "Oxford names previous stenting as a reason CT should not usually be used, because accuracy for in-stent restenosis drops with small stents (under 3 mm) and thick-strut early designs. The dose argument is wrong as stated: in Oxford's risk table a CT coronary angiogram (about 10 mSv) and a diagnostic coronary angiogram (about 6 mSv) are of the same order. Oxford's 10 mSv is also a historical figure: in a 2017 international survey (PROTECTION VI) the median coronary CT dose was 78% lower than in 2007 and varied widely with scanner and protocol.",
        },
        {
          kind: "table",
          caption: "What CT gives the TAVI team (Oxford ch 1, which calls CT a key step in deciding on and planning TAVI; it states a specific purpose only for the first three rows and the last)",
          head: ["Measurement", "What Oxford says it is for"],
          rows: [
            ["Size, tortuosity and disease of the femoral and axillary arteries", "Choosing the vascular access"],
            ["Annulus diameter, area and perimeter", "Choosing the valve size and type"],
            ["Aortic root and sinotubular junction dimensions", "Particularly relevant for self-expanding valves"],
            ["Whole-aorta anatomy, with particular attention to tortuosity, atheroma and complex lesions (thrombus layers, ulceration)", "No specific purpose given; part of deciding on and planning the procedure"],
            ["Degree of aortic valve calcification", "No specific purpose given; part of deciding on and planning the procedure"],
            ["Height of the coronary ostia above the annulus plane", "No specific purpose given; part of deciding on and planning the procedure"],
            ["Angles for the ideal working view", "Identifying the ideal angiographic working view before the case"],
          ],
        },
        { kind: "tip", id: "pci-rad-read-the-ct-first" },
        {
          kind: "pitfalls",
          items: [
            "Treating a CT 'stenosis' as proven: the positive predictive value can be below 50%.",
            "Ordering CT in a high-likelihood patient, or with a calcium score above 1000, and then needing an invasive study anyway.",
            "Asking CT to judge small or first-generation stents.",
            "Forgetting the CT contrast given yesterday when you set today's contrast limit.",
            "Starting a CTO, graft or anomalous-coronary case without opening the CT that is already on the system.",
          ],
        },
        {
          kind: "pearl",
          text: "Read the CT before you scrub, not after the first run. A known arch anomaly, femoral bifurcation, graft course or CTO cap turns into fewer catheters, fewer projections and fewer cine runs, which Brilakis counts among the first ways to cut radiation.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "occlusion",
          task: "Identify the occluded vessel in each study. For each occlusion, say what a pre-procedure CT would add that the angiogram cannot: the course through the occluded segment, the proximal cap and the distal landing zone.",
        },
        { kind: "video", id: "bpLNDwZ6xi0", note: "Lecture on the diagnostic strategy in stable coronary artery disease." },
        { kind: "video", id: "_fb4aU6O7CM", note: "CTO PCI case: a referral made with a CT only." },
        { kind: "video", id: "Sq2RlA7mp9U", note: "CTO interventions case: an emergent CT angiogram." },
        {
          kind: "keypoints",
          items: [
            "Invasive angiography owed its status to spatial and temporal resolution; modern CT covers the heart in one breath-hold.",
            "CT is a rule-out test: high sensitivity and negative predictive value, low and variable positive predictive value.",
            "Avoid CT with a high pretest probability, a calcium score above 1000, a large BMI or previous small or first-generation stents.",
            "CT is good for vein graft patency, CTO planning and anomalous coronary arteries, and essential for TAVI planning.",
            "The 2024 ESC guideline chooses the first test from the clinical likelihood of disease; very high likelihood or high-risk features go to invasive angiography.",
            "A CT you already have should shape access, catheters, target and contrast budget for the invasive case.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-xray-system",
      title: "The C-arm: how the image and the dose are made",
      minutes: 15,
      topics: ["rc-dose-metrics", "rc-dose-reduction"],
      sources: [
        O("ch 1: Radiology equipment"),
        O("ch 1: Fluoroscopy and acquisition"),
        O("ch 1: Radiation safety"),
        O("ch 4: Ventriculography"),
        B("6.4"),
        B("28.2"),
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Every dose decision you make is a decision about a machine. The cath lab images with a C-arm: the X-ray tube sits on the lower arm, under the table, and the detector on the upper arm, above the patient. Understanding what happens inside the tube and at the detector tells you why some settings cost dose without improving the picture, and why the machine sometimes raises the dose without telling you.",
        },
        {
          kind: "steps",
          title: "Inside the X-ray tube (Oxford ch 1)",
          items: [
            { title: "1. Electrons are freed", detail: "The cathode, the negative side, is usually a tungsten wire coil. Current through it heats it until it gives off electrons." },
            { title: "2. Electrons are accelerated", detail: "A high voltage between cathode and anode, measured in kilovolts (kV), drives the electrons towards the positively charged anode." },
            { title: "3. X-rays (and heat) are produced", detail: "The anode is a spinning tungsten disc shaped like a saucer. Electrons striking it produce X-ray photons and a great deal of heat; the disc spins to spread that heat, and the whirring you hear from the tube is the spinning anode." },
            { title: "4. Containment", detail: "Cathode and anode sit in an evacuated glass insert, inside a housing lined with lead that has a small window through which the beam leaves." },
            { title: "5. Collimation", detail: "Collimators are lead panels at the housing exit. The radiographer moves them in to narrow the beam to the area of interest, so tissue outside it is not irradiated." },
          ],
        },
        {
          kind: "table",
          caption: "The three controls that shape the beam (built from Oxford Table 1.1)",
          head: ["Change", "Number of photons", "Energy of each photon", "Practical effect"],
          rows: [
            ["Raise kV (tube voltage)", "More", "Higher", "A more penetrating beam"],
            ["Raise mA (tube current)", "More", "Unchanged", "More photons of the same quality"],
            ["Add filtration (aluminium or copper at the beam exit)", "Fewer", "Higher (the soft, low-energy photons are removed)", "A harder, more penetrating beam"],
          ],
        },
        {
          kind: "p",
          text: "**The trade-off.** More energetic photons penetrate better, so less of the beam is absorbed in the patient and the dose falls. The price is contrast: because more photons pass straight through to the detector, the image looks flatter. Modern systems run **automatic dose-rate control**, which adjusts mA and kV continuously so that the dose reaching the detector stays constant and the picture stays steady when you change projection. The consequence matters: whenever something weakens the beam before it reaches the detector, the tube works harder. Brilakis gives two examples. A steep angle sends the beam through more tissue and the system raises its output automatically, an increase operators often fail to notice. A radiation-absorbing pad placed in the field of view starves the detector, so the tube emits more radiation.",
        },
        {
          kind: "check",
          stem: "The radiographer adds copper filtration during a long case in a slim patient. What happens to the beam?",
          options: [
            "More photons of unchanged energy, so the image brightens and the dose rises",
            "Fewer photons, each of higher average energy, so the beam is harder and more penetrating",
            "More photons of higher energy, exactly as if the kV had been raised",
            "Fewer photons of lower energy, so the image gains contrast at a lower dose",
          ],
          answer: 1,
          explanation:
            "Filtration removes photons, mostly the low-energy ones, so the remaining beam has fewer, more energetic photons (Oxford Table 1.1). More photons of unchanged energy describes raising mA; more photons of higher energy describes raising kV. Filtration appears on Oxford's list of dose-optimising measures the radiographer can offer when doses are high.",
        },
        {
          kind: "table",
          caption: "Two kinds of detector (Oxford ch 1)",
          head: ["Detector", "How it works", "Where you will meet it"],
          rows: [
            ["Image intensifier", "An input phosphor turns X-rays into light; a photocathode turns the light into electrons, which are focused and intensified onto an output phosphor that turns them back into light for a camera", "Older systems; both manuals still call the detector the image intensifier"],
            ["Flat-panel detector", "A phosphor screen turns X-rays into light, which is converted into electrons; these form the digital image", "Newer systems"],
          ],
        },
        {
          kind: "table",
          caption: "Fluoroscopy and acquisition: choose the mode for the task (Oxford ch 1; Brilakis 28.2)",
          head: ["", "Pulsed fluoroscopy ('screening')", "Acquisition ('cine')"],
          rows: [
            ["How it works", "The beam is switched on and off automatically, producing a set number of frames each second, each pulse at a low dose (Oxford calls them low-energy pulses; read this as low dose per pulse, because photon energy is set by the kV)", "A higher-dose series of frames with less noise, higher resolution and better contrast, recorded for diagnosis and the record"],
            ["Typical frame rate", "7.5 frames per second (Oxford); Brilakis uses 6–7.5, or 3.75 in thin patients", "Usually 12.5–30 frames per second; Oxford's own centre uses 7.5. Oxford's ventriculography section gives 30–60 frames per second for that run"],
            ["Use it for", "Scouting, positioning catheters and wires, delivering balloons and stents", "Diagnostic runs and final results that must be recorded"],
            ["Dose", "Lower, for patient and team", "Higher: Brilakis puts cine at about ten times the dose of fluoroscopy; the number and length of cine runs are usually the main source of the patient's dose"],
            ["Storing images", "Modern systems can save the last few seconds of fluoroscopy, so cine is not needed just to keep a record", "Recorded automatically"],
          ],
        },
        { kind: "tip", id: "diag-rad-c-arm-clear" },
        {
          kind: "check",
          stem: "At the end of a PCI the console shows 7 minutes of fluoroscopy. You recorded 18 cine runs, including one for each balloon and stent inflation. Your colleague says it was a low-dose case because the fluoroscopy time is short. What is wrong with that reasoning?",
          options: [
            "Nothing: fluoroscopy time is the standard summary of the whole procedure's dose",
            "Fluoroscopy time counts only pulsed fluoroscopy; cine, at roughly ten times the dose, is not included in it",
            "Fluoroscopy time includes cine, but cine frames are lower-dose than fluoroscopy frames",
            "Fluoroscopy time is only accurate when the frame rate is 15 frames per second",
          ],
          answer: 1,
          explanation:
            "Brilakis notes that cine exposes the patient to about ten times the dose of fluoroscopy and does not appear in the fluoroscopy time. Eighteen runs may have delivered most of the dose. Documenting inflations with the fluoroscopy-save function instead of cine is one of his routine dose savings, and the cumulative air kerma, not the fluoroscopy time, is the number to follow (next lesson).",
        },
        {
          kind: "steps",
          title: "When the picture is poor (Brilakis 6.4)",
          items: [
            { title: "Find the cause", detail: "A large patient, too much angulation, an image receptor too far from the patient, or structures of very different density in the field." },
            { title: "Prevent it", detail: "Choose shallower angles, which the beam penetrates more easily; collimate to the region you need and use filters." },
            { title: "Treat it", detail: "Brilakis lists two treatments: a shallower angle, which helps the beam penetrate, and a change of X-ray settings (frame rate and pulse rate) that adds dose and penetration. He gives them no order. The angle costs no extra radiation, so this module's advice is to try it first and to accept extra dose only when the image is still not diagnostic." },
          ],
        },
        { kind: "tip", id: "diag-rad-grainy-image-flatten" },
        {
          kind: "p",
          text: "**Optimisation.** Oxford defines optimisation as getting a diagnostic image for the lowest dose that is practicable, and sorts the means into two groups. Equipment-based: dose-rate control, the projection angle (shallow angles expose less thickness and surface), kV and mA settings, pulsed fluoroscopy and how acquisition is used. Technique-based: positioning the patient as far as possible from the tube and as close as possible to the detector, and collimation. Biplane imaging is a trade: Oxford notes it can reduce the number of contrast injections, but in ventriculography it raises the radiation dose and takes time to position.",
        },
        {
          kind: "pitfalls",
          items: [
            "Judging dose by fluoroscopy time while recording inflations on cine.",
            "Turning up the dose settings to rescue a poor image without first trying a shallower angle and a closer detector, which cost no extra dose.",
            "Forgetting that automatic dose-rate control raises tube output silently in steep views and large patients.",
            "Leaving a radiation-absorbing pad in the field of view, which makes the tube work harder.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of the detector as asking for a fixed amount of light. Anything you put in the way, more tissue, a steeper angle, a pad in the field, is paid for by the patient's skin at the beam entry, not by a darker image.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Complete a left and right coronary study. Before each pedal press, say whether you need cine or whether fluoroscopy will do. Position every catheter on fluoroscopy, record only diagnostic runs on cine, and at the debrief compare the number of cine runs with the fluoroscopy time.",
        },
        {
          kind: "keypoints",
          items: [
            "Tube under the table, detector above: the beam enters the patient's back.",
            "kV raises photon number and energy; mA raises number only; filtration lowers number and raises energy.",
            "Harder beams lower dose but flatten contrast; dose-rate control keeps detector dose constant by raising output when the beam is weakened.",
            "Fluoroscopy (about 7.5 fps) for positioning and device delivery; cine (usually 12.5–30 fps) for records, about ten times the dose and not in the fluoroscopy time.",
            "Poor image: Brilakis lists a shallower angle and higher-dose settings; try the angle and a closer detector first, because they cost no extra dose.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-dose",
      title: "Reading the dose: units, harm, risk and the rules",
      minutes: 16,
      topics: ["rc-dose-metrics"],
      sources: [
        O("ch 1: Radiation safety"),
        O("ch 1: Dose excess"),
        O("ch 1: Catheter laboratory preparation"),
        O("ch 2: The radiographer"),
        O("ch 2: The cardiac physiologist"),
        B("1.1"),
        B("2.5"),
        B("28.2"),
      ],
      refs: [...BOOKS, "irmer-2017", "icrp-103-2007", "stocker-protection-vi-2018"],
      blocks: [
        {
          kind: "p",
          text: "The dose display in the lab shows several numbers and each answers a different question. One predicts whether the skin on the patient's back will burn; another tracks the total radiation that carries the small long-term cancer risk; others tell you how fast the dose is climbing. This lesson defines them, links them to the two kinds of harm, and sets out the UK rules that govern every exposure. What to do after a high-dose case is taught in cm-patient-complications.",
        },
        {
          kind: "table",
          caption: "Dose quantities you will hear and see (Oxford ch 1; Brilakis 2.5 and 28.2)",
          head: ["Quantity", "Unit", "Meaning", "Use it for"],
          rows: [
            ["Absorbed dose", "Gray (Gy); 1 Gy = 1 joule per kilogram", "Energy deposited per unit mass of tissue", "The physical basis of every other quantity"],
            ["Equivalent dose", "Sievert (Sv)", "Absorbed dose weighted by a quality factor for the type of radiation", "Comparing radiation types"],
            ["Effective dose", "Sievert, usually mSv", "The whole-body dose that would carry the same risk as the actual, uneven exposure", "Comparing examinations and staff exposure; the stochastic risk"],
            ["Cumulative air kerma", "Gy (or mGy) on the console", "Brilakis ties skin injury and cataract to the air kerma delivered to a particular skin area", "Skin-injury risk; stopping and follow-up thresholds"],
            ["Dose–area product (DAP)", "Shown on the console", "As the name says, dose combined with the area of the irradiated field: collimation lowers it even though total air kerma is unchanged (Brilakis)", "The total radiation given; Oxford's procedure record lists it with fluoroscopy time"],
            ["Dose rate", "mGy/min", "How fast the dose is accumulating now", "Real-time feedback: Brilakis acts when it exceeds 20 mGy/min"],
            ["Fluoroscopy time", "Minutes", "Time with pulsed fluoroscopy on", "Part of the procedure record (Oxford ch 2), and the radiographer warns the team about it; but it leaves out cine, so it is a poor guide to the patient's dose"],
          ],
        },
        {
          kind: "check",
          stem: "Halfway through a case the radiographer collimates tightly to the RCA and keeps the same projection and settings. Which change on the dose display does Brilakis predict?",
          options: [
            "Both cumulative air kerma and DAP rise more slowly, by the same proportion",
            "DAP accumulates more slowly, while the cumulative air kerma is not reduced",
            "Cumulative air kerma falls back to a lower value because less skin is exposed",
            "Neither changes, because automatic dose-rate control compensates for collimation",
          ],
          answer: 1,
          explanation:
            "Brilakis states that collimation shrinks the irradiated skin area and reduces the DAP, although the total air kerma is unchanged. Collimation still protects the skin, by making each field smaller and limiting overlap when the angle changes. Cumulative values never fall; they can only rise more slowly.",
        },
        {
          kind: "h",
          text: "What radiation does to tissue",
        },
        {
          kind: "steps",
          items: [
            { title: "Three fates of the beam", detail: "Some X-rays pass through the patient and form the image; some are scattered away from the primary beam (the scatter that reaches the team); some interact within the tissue." },
            { title: "Damage", detail: "Those interactions ionise molecules and generate free radicals, injuring proteins, enzymes and DNA directly or indirectly. The harm depends not only on how much energy is deposited but also on what kind of radiation deposits it and how evenly it is spread." },
            { title: "Deterministic effects", detail: "When enough cells in a tissue die or stop working, the tissue loses function. Oxford's examples are cataract, harm to fetal development, and damage to the nervous system and gut; in the lab, a long exposure of one patch of skin can cause anything from mild redness to ulceration. Oxford does not define the class further; ICRP's definition is a threshold dose, with severity rising as the dose rises above it. Brilakis's air-kerma bands show this for the skin: injury is unlikely below 5 Gy, possible from 5 to 10 Gy and likely from 10 to 15 Gy." },
            { title: "Stochastic effects", detail: "Damaged chromosomal DNA can leave a cell that still divides, and cancer may follow. Oxford calls these stochastic effects without defining the term. ICRP's definition covers cancer and heritable effects: the probability of the effect, not its severity, is treated as a function of dose, with no threshold (fnd-safety-rad-principles teaches the same)." },
            { title: "Where the books seem to differ", detail: "Brilakis places birth defects with the stochastic effects (alongside cancer), whereas Oxford lists impaired fetal development among the deterministic effects. ICRP's framework resolves the apparent conflict if Brilakis's \"birth defects\" is read as heritable effects, passed to the descendants of an irradiated person, which are stochastic. Malformation of an embryo or fetus irradiated in the womb has a threshold dose, like the other tissue reactions. Brilakis does not say which he means." },
          ],
        },
        {
          kind: "table",
          caption: "Putting a coronary angiogram in context (selected rows rebuilt from Oxford Table 1.2; baseline lifetime cancer risk about one in three)",
          head: ["Examination", "Typical effective dose", "Similar to natural background over", "Added lifetime risk of fatal cancer"],
          rows: [
            ["Chest X-ray", "0.02 mSv", "3 days", "1 in 1,000,000"],
            ["CT head", "2.3 mSv", "1 year", "1 in 10,000"],
            ["Coronary angiogram", "6 mSv", "2.7 years", "1 in 3500"],
            ["CT chest", "8 mSv", "3.6 years", "1 in 2500"],
            ["CT coronary angiogram", "10 mSv (an older figure; see below)", "4.5 years", "1 in 2000"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's risk estimates come from studies of survivors of the nuclear bombs and of nuclear workers, and must be set against the normal lifetime risk of developing cancer of about one in three. For context, most of the radiation people receive is natural (87% in Oxford's figure, mainly radon gas and gamma rays) and medical sources account for at least 10%. **The CT figure has fallen.** Oxford's 10 mSv for a CT coronary angiogram reflects older scanners: in an international survey of 4502 patients in 61 hospitals in 2017 (PROTECTION VI), the median dose-length product of coronary CT angiography was 78% lower than in a similar survey in 2007, with a 37-fold spread between the hospitals with the lowest and highest median doses. The dose of a modern CT depends heavily on the scanner and protocol, so do not assume it exceeds that of an invasive study.",
        },
        {
          kind: "check",
          stem: "Before a diagnostic angiogram a patient asks how much radiation she will receive and whether it will give her cancer. Using Oxford's figures, which explanation is accurate?",
          options: [
            "About 6 mSv, similar to 2.7 years of natural background, adding roughly 1 in 3500 to a lifetime cancer risk that is about one in three anyway",
            "About 0.6 mSv, similar to a month of background, so the added risk is too small to estimate meaningfully at all",
            "About 60 mSv, similar to 27 years of background, adding roughly 1 in 350 to her lifetime risk of fatal cancer",
            "About 6 mSv, but because the dose is to the chest the added risk is similar to that of a single chest X-ray",
          ],
          answer: 0,
          explanation:
            "Oxford's table gives a coronary angiogram a typical effective dose of 6 mSv, equal to about 2.7 years of background radiation and an added lifetime risk of fatal cancer of about 1 in 3500, against a background lifetime cancer risk of about one in three. A chest X-ray is 0.02 mSv, three hundred times less. Interventional procedures can deliver much more, which is why the dose is tracked live. Two cautions when you use these numbers: they are population estimates derived from effective dose, which the Academy lesson fnd-safety-rad-principles calls a population measure rather than an individual risk; and Oxford sets an added risk of fatal cancer against a baseline risk of developing cancer, so the two figures are not strictly the same kind.",
        },
        { kind: "h", text: "The UK rules in the lab: IR(ME)R 2017" },
        {
          kind: "steps",
          items: [
            { title: "Duty holders", detail: "Hospitals hold a register of referrers (who may request an exposure, usually clinicians), practitioners (who take responsibility for accepting a request; usually radiologists) and operators (who carry out the exposure, usually radiographers). In the cath lab the cardiologist is often all three." },
            { title: "Every exposure is evaluated", detail: "A clinical evaluation is recorded for every exposure, fluoroscopy included, doses are audited, and hospitals are investigated regularly (Oxford). The regulations also make the employer review diagnostic reference levels and make them available to operators, for interventional procedures where appropriate, and review practice when they are consistently exceeded; the medical physics expert is involved in applying them (IR(ME)R 2017 regs 6 and 14). These levels are the local benchmark for a dose that is unusually high for the procedure." },
            { title: "Before imaging", detail: "Women of child-bearing age confirm that they are not pregnant (Oxford ch 1); the radiographer checks and documents this in line with local policy (Oxford ch 2), and Brilakis's checklist asks for a pregnancy test in women of childbearing potential." },
            { title: "During the case", detail: "As a general rule (Oxford's words; it is not a figure in the regulations), the radiographer warns the operator once 1 Gy has been reached; the operator then records the exposure in the report and explains it to the patient. Brilakis asks every lab to have a protocol for announcing the dose, for example every 1 Gy and/or every 30 minutes." },
            { title: "When the dose is more than expected", detail: "Report it through the employer's IR(ME)R procedure. Oxford names the local radiation protection adviser as the person to contact; the regulations give the medical physics expert a part in analysing accidental or unintended exposures (reg 14). Oxford defines an incident as an unintended exposure or one greater than intended, and sorts events into three classes: a near miss (something that could have led to an unintended exposure or overexposure but was noticed in time for preventive measures), an incident that does not need notification and an incident that does. Under reg 8, when a patient was or may have been exposed to significantly more than is proportionate, the employer investigates at once and notifies the enforcing authority, and the referrer, practitioner and patient are told of any clinically significant unintended exposure. Oxford's rule of thumb for interventional cardiology is that an overexposure is a total at least ten times the intended dose. Oxford states that after an overexposure, those harmed could take action under the criminal law rather than the civil law; the regulations are enforced as health and safety regulations under the Health and Safety at Work etc. Act 1974, so a breach is a criminal offence (reg 18). The follow-up of high-dose patients (skin checks after 5 and 10 Gy) is taught in cm-patient-complications." },
          ],
        },
        { kind: "tip", id: "diag-rad-pregnancy-check" },
        { kind: "tip", id: "diag-rad-read-the-dose-panel" },
        {
          kind: "pitfalls",
          items: [
            "Reporting fluoroscopy time as 'the dose'.",
            "Watching only the cumulative air kerma and ignoring the dose rate, which is the number you can change now.",
            "Assuming that because you referred the patient someone else justified the exposure: in the lab you are usually referrer, practitioner and operator.",
            "Telling a patient there is no risk, or exaggerating it: give the figures and the context.",
          ],
        },
        {
          kind: "pearl",
          text: "The cumulative air kerma keeps counting whichever way the C-arm points, so it overstates the risk to any one patch of skin once you have moved the angle. That is why Brilakis spreads long cases over several entry points: the number still rises, but no single area takes it all. DAP grows with field size, so the answer to a high DAP is to collimate.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Finish a diagnostic study and open the dose panel at the debrief. Say which number predicts skin injury, which reflects the total radiation given, why the fluoroscopy time understates the dose, and what you would record in the report.",
        },
        {
          kind: "keypoints",
          items: [
            "Gy for absorbed dose (J/kg); Sv for equivalent and effective dose.",
            "Cumulative air kerma tracks skin injury; DAP tracks the total radiation; dose rate is the live feedback (act above 20 mGy/min); fluoroscopy time excludes cine.",
            "Deterministic effects have thresholds and grow more severe with dose (skin, cataract); stochastic effects (cancer, heritable effects) grow more likely with dose, with no threshold assumed. Harm to a fetus irradiated in the womb has a threshold (ICRP).",
            "A coronary angiogram is about 6 mSv: roughly 2.7 years of background and 1 in 3500 added lifetime fatal cancer risk (Oxford).",
            "IR(ME)R 2017: register of referrers, practitioners and operators; every exposure evaluated and doses audited against reference levels; a dose greater than expected is reported through the local procedure (Oxford: the radiation protection adviser), and a significant one is notified and explained to the patient. As a general rule (Oxford), the radiographer warns the operator at 1 Gy.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-reduce",
      title: "Reducing the dose through the whole case",
      minutes: 18,
      topics: ["rc-dose-reduction"],
      sources: [
        B("28.2"),
        B("2.5"),
        B("2.12"),
        B("6.4"),
        B("1.1"),
        B("1.6"),
        B("7.3"),
        B("7.4"),
        B("8.9"),
        B("21.8"),
        O("ch 1: Fluoroscopy and acquisition"),
        O("ch 1: Radiation safety"),
        O("ch 2: The radiographer"),
        O("ch 8: Imaging the lesion"),
      ],
      refs: [...BOOKS, "abdelaal-low-frame-rate-2014", "radiation-consensus-2018"],
      blocks: [
        {
          kind: "p",
          text: "Dose reduction is not one setting but a routine that starts before the patient is on the table and continues until the last run. Brilakis organises it in two phases: before the procedure (planning and equipment) and during it (do not use X-ray unless you need it, use as little as you can when you do, and, for the operator only, shielding and distance). Oxford's version is the ALARA principle, 'as low as reasonably achievable', applied to every press of the pedal. The skin-injury follow-up for high-dose cases lives in cm-patient-complications; this lesson is the routine that keeps you from needing it.",
        },
        {
          kind: "steps",
          title: "Before the procedure",
          items: [
            { title: "1. Plan", detail: "A plan built from the previous angiograms, reports and clinical information removes unnecessary steps. Brilakis's example: studying where bypass grafts arise on old films makes graft engagement quicker. Planning matters for every case, not only for complex ones. Part of the plan is the patient's previous radiation: ask about earlier catheterisation or any other procedure done under fluoroscopy, get its images and report, and look at the back for a radiation skin injury. If there is one, Brilakis may postpone or modify the procedure, limits the number of cine runs and keeps the injured area out of the beam (1.1)." },
            { title: "2. Choose the room", detail: "Newer X-ray systems give adequate images at lower dose; Brilakis catheterises very obese patients on a newer system. A region-of-interest add-on that keeps full resolution only where the operator chooses lowers the dose rate elsewhere and reduces the dose by about 75%." },
            { title: "3. Set the defaults", detail: "A fluoroscopy rate of 6–7.5 frames per second (3.75 in thin patients) gives an adequate image in nearly every case and halves the fluoroscopy dose compared with 15 frames per second. The randomised trial Brilakis cites (transradial procedures, 7.5 versus 15 frames per second, both at a fixed dose per pulse) found operator dose 30% lower and patient DAP 19% lower overall, with similar fluoroscopy times. The total DAP fell by much less than half because cine and the rest of the procedure were unchanged, and in the PCI subgroup the 19% lower DAP was not statistically significant (it was 26% lower, and significant, in diagnostic angiography). Oxford adds that low frame-rate acquisition may reduce dose at the cost of image quality, and suggests it for long interventions and in pregnancy. Start at low magnification." },
            { title: "4. Set the geometry", detail: "Table as high as you can work comfortably, detector as close to the patient as possible, shields in place and the operator as far back as the manifold tubing allows (table below). Let the C-arm finish moving before you screen." },
          ],
        },
        {
          kind: "table",
          caption: "Why table height and detector height matter (from a figure in the 2018 multisociety consensus on ionising radiation in cardiovascular imaging (ACC, HRS, NASCI, SCAI, SCCT), reproduced by Brilakis in 28.2)",
          head: ["Set-up", "Tube to detector", "Skin dose at beam entry", "If set-up A needed 3 Gy"],
          rows: [
            ["A: table high, detector close to the chest", "110 cm", "1.0 (reference)", "3 Gy"],
            ["B: table low, detector still close to the chest", "80 cm", "About 1.4 (the skin is nearer the tube)", "4.2 Gy"],
            ["C: table low, detector raised", "110 cm", "About 2.6, and the image is 40–50% larger from geometric magnification", "7.8 Gy"],
          ],
        },
        {
          kind: "steps",
          title: "During the procedure: no X-ray unless it is needed",
          items: [
            { title: "5. Pedal discipline", detail: "Brilakis's 'heavy foot' means any X-ray that is not needed, his example being screening while the operator's eyes are off the monitor, and singles out the lag in lifting the foot as a common habit early in training. Oxford's test: every time your foot moves to the pedal, ask whether screening is necessary now." },
            { title: "6. Let the markers do the work", detail: "Advance balloons, stents and wires inside the guide by watching their shaft markers, and screen only when the device nears the guide tip. Know your guide length: in a shorter 90 cm guide the more proximal marker misleads, because the stent can already be out of the guide and in the coronary artery by the time that marker arrives at the Y-connector." },
            { title: "7. Exchange by trapping", detail: "Trapping secures over-the-wire exchanges with little X-ray, because fluoroscopy is needed only as the catheter starts to come back (Brilakis 8.9)." },
            { title: "8. Save fluoroscopy instead of recording cine", detail: "Use the fluoroscopy-save (image store) button, not cine, to document balloon and stent inflations; cine is about ten times the dose. Oxford's radiographer offers the same advice when doses are high." },
            { title: "9. Image with intravascular imaging", detail: "IVUS or OCT can reduce both the contrast and the radiation used during PCI." },
          ],
        },
        { kind: "tip", id: "diag-rad-pedal-discipline" },
        { kind: "tip", id: "diag-rad-fluoro-rate-default" },
        {
          kind: "check",
          stem: "You are advancing a stent through a 90 cm guide without screening and plan to start fluoroscopy when the more proximal shaft marker reaches the Y-connector. What is the risk Brilakis warns about?",
          options: [
            "None: the proximal marker always sits exactly at the guide tip when it reaches the Y-connector",
            "The stent may already have left the guide and be travelling unseen in the coronary artery",
            "The stent may not yet have entered the guide, so you will screen far too early and waste dose",
            "The marker will damage the haemostatic valve, so the stent must be advanced under continuous screening",
          ],
          answer: 1,
          explanation:
            "Brilakis stresses knowing the guide length: in a shorter 90 cm guide the stent may be out of the guide and in the artery before its proximal marker has even come into view at the Y-connector. Markers save dose only when they are read with the guide length in mind; continuous screening from the Y-connector is the 'heavy foot' habit the markers are meant to replace.",
        },
        {
          kind: "steps",
          title: "During the procedure: as little X-ray as possible",
          items: [
            { title: "10. Low magnification", detail: "Less magnification needs less radiation (Oxford: magnification raises the skin dose rate). Like low frame rates, it takes a short learning curve, but on large modern monitors the image is still big." },
            { title: "11. Collimate, especially when you widen the field", detail: "Collimation shrinks the irradiated skin area, lowers the DAP and limits overlapping exposures when the angle changes. The catch: guide and wire tips may leave the field, so look at them at intervals to catch a wire migrating distally (perforation risk) or a guide diving deep (aortocoronary dissection risk)." },
            { title: "12. Shallow angles", detail: "Keep the working angle within about 30° of AP where you can; steeper views send the beam through more tissue and the system raises the dose without telling you. Pure AP is not ideal either, because the spine is in the field; slight angulation is better. RAO lowers operator exposure and suits the mid-LAD, but makes RCA wiring harder." },
            { title: "13. Move the skin entry point", detail: "In long cases vary the projection during both fluoroscopy and cine, so that no single patch of skin receives all the dose. Oxford gives the same instruction for prolonged PCI, and notes that many newer systems include a skin-dose indicator." },
            { title: "14. Watch the rate and the total", detail: "Change something when the dose rate exceeds 20 mGy/min. Follow the cumulative air kerma and have it announced (for example every 1 Gy and/or every 30 minutes); as a general rule, Oxford's radiographer warns the operator at 1 Gy." },
            { title: "15. Know when to stop or stage", detail: "Brilakis's monitoring chapter says the procedure is usually stopped when air kerma exceeds 5–7 Gy; his radiation section says to consider stopping at 7–8 Gy and staging the rest. For a CTO, a high dose (usually above 5 Gy without crossing or real progress) is a reason to stop the attempt. Excessive radiation during the diagnostic study, or expected during PCI, favours delaying PCI to another day; this applies to stable patients and to ACS without active ischaemia, because with active ischaemia ad hoc PCI is usually needed (Brilakis 7.3). A high dose in the first part of a multivessel PCI favours staging the remaining lesions. In stable multivessel disease, when the dose (or contrast) is already high, Brilakis also suggests treating the easier lesions first and deferring the more complex ones; in ACS the culprit lesion comes first (7.4)." },
          ],
        },
        { kind: "tip", id: "diag-rad-low-magnification" },
        { kind: "tip", id: "pci-rad-shallow-working-view" },
        { kind: "tip", id: "pci-rad-collimate-check-edges" },
        {
          kind: "check",
          stem: "During graft angiography the dose rate reads 28 mGy/min in a steep LAO cranial view with the second magnification field selected and the detector some way above the chest. Which single change does NOT reduce the patient's dose?",
          options: [
            "Bringing the detector down close to the chest",
            "Returning to the lowest magnification field",
            "Opening the collimators fully so the whole heart is in view",
            "Flattening the angulation towards a shallower projection",
          ],
          answer: 2,
          explanation:
            "Opening the collimators enlarges the irradiated area and the DAP; Brilakis recommends collimation, especially when the field of view is increased. Each of the other changes lowers the dose: a closer detector, less magnification and a shallower angle. Above 20 mGy/min Brilakis expects the operator to change something at once.",
        },
        {
          kind: "table",
          caption: "What the radiographer can offer when the dose climbs (Oxford ch 2)",
          head: ["Measure", "Effect"],
          rows: [
            ["Choose a different projection", "Moves the skin entry point and may need less penetration"],
            ["Save fluoroscopy instead of acquiring cine", "Avoids the much higher cine dose"],
            ["Collimate", "Smaller irradiated field and lower DAP"],
            ["Lower the acquisition rate", "Fewer frames per second"],
            ["Avoid zooming (magnification)", "Lower skin dose rate"],
            ["Add filtration", "Removes low-energy photons that add dose but not image"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Screening while looking at the pressure trace or the trolley.",
            "Leaving the default 15 frames per second because 'the patient is big' before trying geometry and angle.",
            "Collimating tightly and forgetting the guide and wire tips outside the field.",
            "Working for an hour in one steep projection on the same skin entry point.",
            "Pressing on past the planned stopping dose because the next lesion looks easy.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the defaults aloud at the start (7.5 frames per second, lowest magnification, table up, detector down, shields in) and the stopping dose at the brief. Once they are the team's routine, every later deviation becomes a decision someone has to justify.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (focal mid-LAD), set fluoroscopy to 7.5 frames per second, choose an RAO working view within about 30° of AP, collimate to the lesion, advance the stent on its markers without screening until it nears the guide tip, and use fluoroscopy save for every inflation. Note the air kerma and DAP at the end.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Complete a left coronary study using the fewest cine runs that answer every question. Keep the lowest magnification, collimate to the heart, and replace any view more than about 30° from AP with a shallower one that still separates the segment you need.",
        },
        { kind: "video", id: "b612bxTygFg", note: "Lecture: how to reduce radiation dose during cardiac catheterisation." },
        { kind: "video", id: "CuPjSsGRREM", note: "Manual of PCI chapter video 28.2: preventing radiation-related complications." },
        {
          kind: "keypoints",
          items: [
            "Before: plan from old films, use newer equipment for large patients, set 6–7.5 fps fluoroscopy, low magnification, table high and detector low.",
            "During: no pedal lag, markers before screening (know the guide length), trapping, fluoroscopy save instead of cine, intravascular imaging.",
            "Collimate (watch the guide and wire tips), stay within about 30° of AP, move the skin entry point in long cases.",
            "Act when the dose rate exceeds 20 mGy/min; announce the cumulative dose; radiographer warns at 1 Gy.",
            "Usually stop at 5–7 Gy (Brilakis 2.5) or consider stopping at 7–8 Gy (28.2); stage or delay when the dose is already high.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-lab-and-radiation-operator",
      title: "Protecting yourself and the team",
      minutes: 15,
      topics: ["rc-operator-protection"],
      sources: [
        O("ch 1: Radiation safety"),
        O("ch 1: Dose excess"),
        O("ch 1: Catheter laboratory preparation"),
        O("ch 2: The radiographer"),
        O("ch 3: Trends in vascular access"),
        B("2.5"),
        B("6.4"),
        B("28.2"),
        B("30.19"),
      ],
      refs: [...BOOKS, "irr-2017"],
      blocks: [
        {
          kind: "p",
          text: "Everything that lowers the patient's dose lowers yours, because your dose is radiation scattered from the patient. Shielding and distance are different: Brilakis stresses that they protect only the staff, and that this still matters greatly because an interventional cardiologist is exposed every working day for decades. Oxford asks that this lifetime exposure be monitored accurately and kept as low as reasonably achievable.",
        },
        {
          kind: "steps",
          title: "Before you scrub",
          items: [
            { title: "1. Know the local rules and wear your dosimeter", detail: "Every member of staff must know the local radiation protection procedures. A designated Radiation Protection Supervisor checks the basic paperwork and issues the dose meters that record your exposure; wear them as issued, every case." },
            { title: "2. Put on the lead", detail: "Aprons come as one piece or as a separate top and skirt, which may suit those with back problems. Protection is expressed as lead equivalent; most aprons are 0.25–0.35 mm, and a higher lead equivalent is heavier. How much an apron protects also depends on the output of the source. Add a lead-rubber thyroid collar of 0.35 mm lead equivalent and lead glasses for the eyes." },
            { title: "3. Check the team's protection", detail: "Viewing areas are usually behind lead glass, and mobile shields are available for staff as well as the operator. The radiographer is responsible for checking the quality of protective equipment and for reminding the team about screening time, doses, distance from the detector and shielding." },
            { title: "4. Know what the radiographer does", detail: "Oxford's list of radiographer duties, set within IR(ME)R 2017 and the Ionising Radiations Regulations 2017, goes beyond the image: keeping the patient's dose as low as reasonably practicable (ALARP, the UK regulatory wording, alongside the ALARA of the radiation safety section) while keeping the image diagnostic; recording the patient's radiation and contrast doses as local policy requires; educating and reassuring patients who are worried about their dose; teaching radiation protection to other staff and training junior radiographers; auditing; and, in an arrest, moving the C-arm out of the way so that resuscitation can go on." },
          ],
        },
        { kind: "tip", id: "diag-rad-lead-check" },
        {
          kind: "steps",
          title: "Setting the shields",
          items: [
            { title: "5. Ceiling shield low and close", detail: "Place the fixed shield between the patient and the operator, near the patient with its lower edge low (Brilakis shows a shield hanging high and away from the patient as the wrong position). The Academy lessons fnd-safety-rad-practice and bed-ind-radiation-ergonomics add the table-mounted lead skirt, lowered on your side to protect your legs; neither manual mentions it. Brilakis asks that shield and image receptor positions be watched and adjusted throughout the case, not set once." },
            { title: "6. Disposable shields on the drape, never in the beam", detail: "Radiation-absorbing pads in the sterile field reduce scatter; Brilakis places them over the patient's abdomen. Keep them out of the field of view: in the beam they make the tube emit more radiation, because less reaches the detector." },
            { title: "7. Operator-only systems", detail: "A ceiling-suspended lead system protects the operator and removes the need to wear an apron, with its orthopaedic burden; robotic PCI almost eliminates operator dose but is available in few centres; add-on shield systems reduce scatter. None of these lowers the patient's dose." },
          ],
        },
        { kind: "tip", id: "diag-rad-shield-low-close" },
        {
          kind: "check",
          stem: "As you start a radial case you see the ceiling shield parked high above the patient's chest with a gap of about 30 cm between its lower edge and the patient, and a radiation-absorbing pad lying over the heart in the field of view. What do you do?",
          options: [
            "Leave both: the shield blocks direct beam at head height and the pad lowers everyone's dose wherever it lies",
            "Lower the shield so it sits close to the patient between beam and operator, and move the pad off the field onto the abdomen",
            "Raise the shield further to protect the eyes and add a second pad over the heart to double the protection",
            "Remove the pad entirely and rely on the apron, because disposable shields always increase the patient's dose",
          ],
          answer: 1,
          explanation:
            "Brilakis wants the fixed shield near the patient with its lower edge low, and disposable pads placed on the drape (over the abdomen) but never in the field of view, where they make the tube emit more radiation. A pad outside the field reduces scatter without that penalty, so removing it altogether throws away protection.",
        },
        {
          kind: "steps",
          title: "During the case: distance and position",
          items: [
            { title: "8. Step back", detail: "Intensity drops in proportion to the square of how far you stand from the source: moving from 1 m to 2 m cuts your exposure to a quarter (Oxford). Stand as far from the patient and the tube as the task allows; Brilakis uses manifold tubing extensions so the radial operator can stand further away." },
            { title: "9. Hands and limbs out of the beam", detail: "No operator's or patient's limbs should be in the imaging field." },
            { title: "10. Angulation and access", detail: "RAO projections give the operator less exposure (Brilakis). Oxford notes concern that radial access may raise operator dose; Brilakis's manifold extensions are one answer for the radial operator." },
            { title: "11. Real-time personal dosimeters", detail: "Monitors that show the operator's dose as it accumulates can alert you to change something; Brilakis reports that they cut operator dose by about 30%." },
            { title: "12. Keep clear of the C-arm", detail: "Moving parts of the X-ray system can injure the operator; step out of its path when it moves (Brilakis 6.4)." },
          ],
        },
        { kind: "tip", id: "diag-rad-step-back-for-cine" },
        { kind: "tip", id: "pci-rad-operator-dose-alarm" },
        {
          kind: "formula",
          name: "Inverse square law",
          expr: "Dose at new distance = dose at old distance × (old distance ÷ new distance)²",
          note: "From 1 m to 2 m: × (1/2)² = one quarter (Oxford). From 0.5 m to 1.5 m: × (1/3)² = one ninth.",
        },
        {
          kind: "check",
          stem: "Leaning over the radial access you stand about 0.5 m from the beam entry. With a manifold extension you could work at 1.5 m. By how much does the inverse square law predict your scatter dose rate would fall?",
          options: [
            "To one third, because you are three times further away",
            "To one sixth, because the extension also adds shielding",
            "To one ninth, because the dose falls with the square of the distance",
            "It would not change, because your apron already absorbs the scatter",
          ],
          answer: 2,
          explanation:
            "Tripling the distance divides the intensity by three squared, nine. Oxford's example is doubling from 1 m to 2 m, a four-fold fall. Distance also protects the parts the apron does not cover, such as the eyes, head and hands (this module's reasoning). Brilakis lists stepping back first among the operator measures.",
        },
        {
          kind: "table",
          caption: "Annual dose limits for staff in the UK (Ionising Radiations Regulations 2017, Schedule 3; the same values appear in Oxford Table 1.3)",
          head: ["Group", "Effective dose", "Lens of the eye", "Skin and extremities"],
          rows: [
            ["Employees aged 18 or over", "20 mSv per year", "20 mSv per year", "500 mSv per year"],
            ["Trainees under 18", "6 mSv per year", "15 mSv per year", "150 mSv per year"],
          ],
        },
        {
          kind: "p",
          text: "Oxford describes the 20 mSv effective limit as averaged over five years; the 2017 regulations set 20 mSv per year and allow a five-year alternative only in defined circumstances. Typical annual whole-body doses are up to 5 mSv for an interventional cardiologist and 0.5–1 mSv for a radiologist (Oxford). **An out-of-date limit:** Oxford's table adds a limit of 13 mSv to the abdomen over any three months for women of reproductive capacity; that limit does not appear in Schedule 3 of the 2017 regulations. What the regulations do contain for pregnancy is a separate duty: once an employee has told her employer in writing that she is pregnant, the equivalent dose to the foetus must be kept as low as reasonably practicable and be unlikely to exceed 1 mSv for the rest of the pregnancy (IRR 2017 reg 9). Tell your radiation protection adviser early, and follow the local rules.",
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving the dosimeter in the locker, or wearing it differently from the way it was issued.",
            "Wearing an apron without a thyroid collar or lead glasses.",
            "A ceiling shield parked high or to the side, or a pad lying in the beam.",
            "Leaning in over the radial access during cine instead of using an extension.",
            "Assuming an operator-only device such as suspended lead or robotics protects the patient too.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first run, look along the shield's lower edge: it should meet the patient. Then take one step back. Those two habits, repeated for a career, matter more than any single heroic saving in one case.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "At the pre-brief, state your shield position, your distance for cine runs and where your dosimeter is worn. During a radial study, choose an RAO view where it answers the question, and step back for each cine run.",
        },
        { kind: "video", id: "b612bxTygFg", note: "Lecture: how to reduce radiation dose during cardiac catheterisation." },
        {
          kind: "keypoints",
          items: [
            "Patient dose reduction protects staff; shielding and distance protect staff only.",
            "Dosimeter from the Radiation Protection Supervisor; apron 0.25–0.35 mm lead equivalent; thyroid collar 0.35 mm; lead glasses.",
            "Ceiling shield near the patient with its lower edge low; disposable pads on the abdomen, never in the beam.",
            "Inverse square law: double the distance, a quarter of the dose; use manifold extensions; limbs out of the field.",
            "RAO lowers operator dose; real-time dosimeters cut operator dose by about 30%.",
            "UK limits (IRR 2017): 20 mSv effective, 20 mSv lens, 500 mSv skin and extremities per year; Oxford's 13 mSv abdominal limit is not in the 2017 regulations, but after a written declaration of pregnancy the foetal dose must be unlikely to exceed 1 mSv for the rest of the pregnancy.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-lab-and-radiation-q1",
      stem: "The radiographer raises the tube current (mA) and leaves the kV and filtration unchanged. What happens to the X-ray beam?",
      options: [
        "More photons are produced, each with the same energy as before",
        "More photons are produced, each with a higher energy than before",
        "Fewer photons are produced, each with a higher energy than before",
        "The same number of photons is produced, each with a higher energy",
      ],
      answer: 0,
      explanation:
        "In Oxford's Table 1.1, raising mA increases the number of photons without changing their energy; raising kV increases both; adding filtration reduces the number and raises the average energy. The kV option is the tempting one, but energy (penetration) is set by the voltage, not the current.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-lab-and-radiation-q2",
      stem: "During a long PCI a disposable radiation-absorbing pad slides from the abdomen into the field of view over the heart. What happens, and why?",
      options: [
        "Patient and operator doses both fall, because the pad absorbs a useful part of the primary X-ray beam",
        "The image darkens but the dose is unchanged, because the generator output is fixed",
        "The tube emits more radiation, because less reaches the detector and dose-rate control compensates",
        "The kV falls automatically to keep contrast constant, so the patient dose falls",
      ],
      answer: 2,
      explanation:
        "Brilakis warns that disposable shields in the field of view increase the radiation emitted by the tube, because less radiation reaches the detector; Oxford explains that dose-rate control adjusts mA and kV to keep the detector dose constant. The pad belongs on the drape over the abdomen, outside the field, where it reduces scatter without that penalty.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "hb-lab-and-radiation-q3",
      stem: "Two operators each perform a 90-minute CTO PCI that ends with the same cumulative air kerma. Both collimate tightly throughout. Operator A works in one projection for the whole case; operator B moves the skin entry point between several projections. Which statement about the risk of skin injury follows from Brilakis?",
      options: [
        "A's risk is lower, because collimating in a single projection keeps the total air kerma lowest",
        "B's risk is lower, because the same air kerma is spread over several skin areas, so each receives less",
        "Their risks are equal, because the cumulative air kerma on the console is the same for both cases",
        "Their risks are equal, because collimation alone already cuts the total air kerma in proportion to the field",
      ],
      answer: 1,
      explanation:
        "Brilakis ties skin injury to the air kerma delivered to a particular skin area. Collimation shrinks each field and the DAP but does not change the total air kerma, so it cannot by itself stop one patch of skin taking the whole dose; moving the entry point spreads that dose so that no single area receives it all. The console's cumulative figure keeps counting whichever way the C-arm points, which is why equal totals do not mean equal skin risk.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "hb-lab-and-radiation-q4",
      stem: "At a debrief you compare two PCIs done in the same room, with the same fluoroscopy rate, magnification, table and detector set-up, in patients of similar size. Case A: fluoroscopy 12 minutes, air kerma 1.1 Gy. Case B: fluoroscopy 13 minutes, air kerma 3.4 Gy. What best explains the difference?",
      options: [
        "Case B's fluoroscopy time must have been recorded wrongly, because air kerma rises in fixed proportion to fluoroscopy time",
        "Case B most likely had more or longer cine runs, about ten times the fluoroscopy dose and left out of the fluoroscopy time",
        "Case A was collimated more tightly, and collimation lowers the cumulative air kerma in proportion to the size of the field",
        "Case A moved the skin entry point more often, and spreading the projections lowers the cumulative air kerma on the console",
      ],
      answer: 1,
      explanation:
        "With the settings, room and patient size matched, cine is the obvious missing term: Brilakis puts it at about ten times the fluoroscopy dose and notes that it is not reflected in the fluoroscopy time, and Oxford calls the number and length of cine runs the main source of the patient's dose. Collimation lowers the DAP but not the total air kerma, and moving the entry point spreads the skin dose without lowering the cumulative figure. Follow the air kerma, not the fluoroscopy time.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "hb-lab-and-radiation-q5",
      stem: "In the consensus figure Brilakis reproduces, a procedure delivers a 3 Gy skin dose with the table high and the detector close to the chest. The next operator lowers the table but keeps the detector close to the chest. Roughly what skin dose would the same procedure deliver?",
      options: [
        "About 3 Gy, because only detector height affects the skin dose",
        "About 2.1 Gy, because the detector now receives more of the beam",
        "About 4.2 Gy, because the skin is closer to the tube (about 40% higher)",
        "About 7.8 Gy, because lowering the table alone multiplies the dose 2.6-fold",
      ],
      answer: 2,
      explanation:
        "With the table low and the detector still close, the entrance dose rate is about 40% higher, so 3 Gy becomes about 4.2 Gy. The 7.8 Gy figure (2.6 times) belongs to the worst set-up: table low and detector raised, which also magnifies the image by 40–50%. Table high and detector close is the reference.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "radiation-consensus-2018"],
    },
    {
      id: "hb-lab-and-radiation-q6",
      stem: "In which patient does the Oxford handbook advise that cardiac CT should NOT usually be the investigation?",
      options: [
        "A patient with low to intermediate probability of stable disease after an inconclusive stress test",
        "A patient with prior bypass surgery in whom saphenous vein graft patency is the question",
        "A patient with a coronary calcium score of 1300 and a high pretest probability of disease",
        "A patient admitted with suspected ACS whose ECG and cardiac markers are both inconclusive",
      ],
      answer: 2,
      explanation:
        "Oxford lists a high pretest probability and a calcium score above 1000 among the settings for avoiding CT, with a large BMI and previous stenting. The other three are on its list of indications: ruling out disease after an inconclusive functional test, vein graft patency (grafts are large, move less and rarely calcify) and suspected ACS with inconclusive ECG and markers.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-lab-and-radiation-q7",
      stem: "Which statement about IR(ME)R 2017 in the cath lab matches the Oxford handbook?",
      options: [
        "Fluoroscopy is exempt from clinical evaluation under the regulations; only the recorded cine runs need a documented evaluation and a later audit",
        "A clinical evaluation is recorded for every exposure, fluoroscopy included, and the cardiologist is often referrer, practitioner and operator",
        "The radiographer must always act as practitioner, so the cardiologist can never justify an exposure",
        "The radiation protection adviser is contacted only when the cumulative air kerma passes 15 Gy at the end of the case",
      ],
      answer: 1,
      explanation:
        "Oxford: hospitals register referrers, practitioners and operators; in cardiac catheterisation the cardiologist often fills all three roles; every exposure, fluoroscopy included, has a recorded clinical evaluation and doses are audited. Any dose greater than expected goes to the radiation protection adviser (Oxford), through the employer's IR(ME)R procedure. The 15 Gy figure is the US Joint Commission sentinel-event threshold, not a UK trigger; Brilakis defines it as a peak skin dose in his treatment section (28.2.3), although his sections 2.5 and 28.2.1 express it as air kerma.",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "irmer-2017", "brilakis-manual-pci"],
    },
    {
      id: "hb-lab-and-radiation-q8",
      stem: "A new fellow reads Oxford Table 1.3 and asks which UK annual dose limits apply to her as an employee aged over 18 under the Ionising Radiations Regulations 2017. Which answer is correct?",
      options: [
        "20 mSv effective, 150 mSv to the lens and 500 mSv to skin and extremities, plus 13 mSv to the abdomen",
        "6 mSv effective, 15 mSv to the lens and 150 mSv to skin and extremities, with no separate abdominal limit",
        "20 mSv effective, 20 mSv to the lens and 500 mSv to skin and extremities, with no separate abdominal limit",
        "20 mSv effective, 20 mSv to the lens, 500 mSv to skin and extremities, plus 13 mSv to the abdomen in any 3 months",
      ],
      answer: 2,
      explanation:
        "Schedule 3 of the 2017 regulations sets 20 mSv effective dose, 20 mSv to the lens and 500 mSv to the skin and extremities per year for employees aged 18 or over. The 6, 15 and 150 mSv figures are the limits for trainees under 18. Oxford's footnote limit of 13 mSv to the abdomen over three months for women of reproductive capacity does not appear in Schedule 3, so the answer that adds 13 mSv in any 3 months to the correct annual limits repeats an out-of-date figure.",
      difficulty: 3,
      refs: ["irr-2017", "oxford-cath-handbook"],
    },
    {
      id: "hb-lab-and-radiation-q9",
      stem: "Your scatter dose rate is measured while you stand 0.5 m from the beam entry. You move to 1.0 m using a manifold extension. What fraction of the original dose rate do you now receive?",
      options: [
        "About one half, because your distance from the source has doubled",
        "About one quarter, because dose falls with the square of distance",
        "About one eighth, because dose falls with the cube of distance",
        "Unchanged, because scatter fills the room evenly",
      ],
      answer: 1,
      explanation:
        "Doubling the distance divides the intensity by two squared, four (Oxford's example is 1 m to 2 m). Brilakis lists stepping back and manifold tubing extensions first among the operator measures. Distance also protects the eyes and hands, which the apron does not cover.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "hb-lab-and-radiation-q10",
      stem: "Which pairing of person and contribution is correct according to the sources in this module?",
      options: [
        "Mason Sones, 1977: the first balloon angioplasty of a human coronary artery, in Zurich",
        "Andreas Gruentzig, 1959: selective coronary angiography at the Cleveland Clinic",
        "André Cournand, 1986: the first implantation of coronary stents in human patients",
        "Sven-Ivar Seldinger, 1953: percutaneous access by needle, guidewire and then catheter",
      ],
      answer: 3,
      explanation:
        "Seldinger described his needle, guidewire and catheter technique for arteriography in 1953; today the catheter is usually an introducer sheath. Sones developed selective coronary angiography (1958 or 1959 depending on the source), Gruentzig performed the first PTCA in Zurich on 16 September 1977, and Cournand advanced right heart catheterisation from 1941. The first coronary stents date to 1986.",
      difficulty: 1,
      refs: ["oxford-cath-handbook", "seldinger-technique-1953", "ryan-angiogram-history-2002"],
    },
    {
      id: "hb-lab-and-radiation-q11",
      stem: "Your lab runs fluoroscopy at 15 frames per second. You propose 7.5. What does Brilakis's chapter, with the randomised trial it cites, support?",
      options: [
        "7.5 fps saves dose per second, but the trial found that it doubled the fluoroscopy time, so the total patient dose was unchanged",
        "7.5 fps is adequate only in thin patients; in all others Brilakis recommends staying at 15 fps to keep image quality acceptable",
        "7.5 fps is adequate in nearly all cases and halves fluoroscopy dose; in the trial, operator dose fell 30% and patient DAP 19%",
        "7.5 fps lowers the operator dose by half but has no effect on the patient, whose dose depends only on the number of cine runs",
      ],
      answer: 2,
      explanation:
        "Brilakis recommends 6–7.5 fps routinely (3.75 in thin patients), says it gives adequate images in nearly all cases, and that it halves the fluoroscopy dose compared with 15 fps. The trial he cites (transradial procedures, 7.5 versus 15 fps) measured 30% lower operator dose and 19% lower patient DAP, with similar fluoroscopy times, so the 'doubled fluoroscopy time' option is wrong. Total procedure DAP fell much less than half because cine runs are unaffected by the fluoroscopy rate, and in the PCI subgroup the DAP reduction was not statistically significant.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "abdelaal-low-frame-rate-2014"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Run a diagnostic study with 7.5 fps fluoroscopy, the lowest magnification, table high and detector low, the shield against the patient and the fewest cine runs; at the debrief read and explain each dose number." },
    { sim: "procedure", task: "Gain femoral access by the Seldinger sequence and name each step." },
    { sim: "views", task: "For each view you choose, say how far it is from AP and replace any view steeper than about 30° with a shallower one that still separates the segment." },
  ],
  caseIds: ["hb-lab-and-radiation-case-large-patient"],
};

// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "hb-lab-and-radiation-case-large-patient",
    title: "A long RCA stent in a large patient: keeping the dose down",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 2.5, 6.4, 7.3 and 28.2 (dose monitoring, positioning, staging, prevention of radiation injury); Oxford Handbook ch 1 (radiology equipment, fluoroscopy and acquisition, radiation safety, dose excess) and ch 2 (the radiographer).",
    },
    summary:
      "A radial PCI of a long right coronary lesion in a patient with severe obesity, followed step by step through the dose decisions: setting up the room, rescuing a poor image, delivering and documenting the stent, protecting the operator, deciding whether to treat a second vessel at a high cumulative dose, and what to record and escalate afterwards.",
    presentation:
      "A 61-year-old man weighing 128 kg (BMI 41) with angina on mild exertion despite two anti-anginal drugs. His recent diagnostic angiogram showed a long severe mid-RCA stenosis and a severe mid-LCx stenosis; the heart team agreed PCI to both, at one sitting or staged. eGFR 68 mL/min. No previous PCI. The diagnostic angiogram three weeks ago was uneventful, its images and report are available, and his back shows no skin reaction. You are the first operator, working from the right radial artery, with an experienced radiographer.",
    findings: [
      "Sinus rhythm 72/min, blood pressure 138/82 mmHg",
      "Right radial access with a 6 French sheath",
      "The lab default fluoroscopy rate is 15 frames per second",
      "The ceiling shield is parked at the head of the table",
      "The room is a recent flat-panel system",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The patient is on the table and draped. How do you set up the room before the first image?",
        options: [
          {
            text: "Table up to the highest height you can work at, detector down close to the chest, fluoroscopy at 7.5 frames per second, lowest magnification, the ceiling shield brought down against the patient, and a manifold extension",
            best: true,
            feedback:
              "This is Brilakis's set-up: table high, receptor close, shield between patient and operator, operator as far back as the tubing allows, and 6–7.5 fps fluoroscopy, which is adequate in nearly all cases and halves the fluoroscopy dose compared with 15 fps. Brilakis catheterises very obese patients on newer X-ray systems, and this room is one.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Lower the table so that you can reach the radial comfortably and raise the detector to give your hands room over the wrist and the chest",
            feedback:
              "A low table with a raised detector is the worst geometry in the figure Brilakis reproduces: about 2.6 times the skin dose of the optimal set-up for the same work, with a magnified image.",
            next: "c-geometry",
            stateDelta: { stability: -10, flags: ["poor-geometry"] },
          },
          {
            text: "Table up, detector down, shield in and an extension fitted, but keep fluoroscopy at the default 15 frames per second because the patient is large",
            acceptable: true,
            feedback:
              "The geometry is right, but Brilakis uses 6–7.5 fps routinely and finds it adequate in nearly all cases; 15 fps doubles the fluoroscopy dose. Try geometry, angle and collimation before buying image quality with dose.",
            stateDelta: { stability: -3, flags: ["high-frame-rate"] },
          },
        ],
      },
      {
        id: "c-geometry",
        kind: "consequence",
        prompt: "The radiographer points out that the dose rate in the first LAO view is already 30 mGy/min and asks about the table height. What now?",
        info: "Dose rate 30 mGy/min in LAO 30°. The image is noticeably larger than on the diagnostic study.",
        options: [
          {
            text: "Raise the table to the highest comfortable height, bring the detector down to the chest, and reassess the dose rate",
            best: true,
            feedback:
              "Correct. Raising the patient away from the tube and the detector towards the patient is one of the largest and cheapest savings available; the magnification from the raised detector disappears too.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep the set-up: automatic dose-rate control will adjust the output and protect the image quality",
            feedback:
              "Dose-rate control protects the image, not the patient: it raises tube output to keep the detector dose constant, which is exactly why this geometry costs so much skin dose.",
            stateDelta: { stability: -8, flags: ["poor-geometry"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "You need a working view of the mid-RCA. In LAO 45° cranial 25° the image is grainy and the dose rate reads 31 mGy/min. What do you do?",
        info: "The lesion is seen, but the edges are noisy. The detector is close to the chest.",
        options: [
          {
            text: "Flatten the projection to a shallower LAO with less cranial angulation that still opens the segment, and collimate to the RCA",
            best: true,
            feedback:
              "Brilakis: shallower angles are easier to penetrate, angles beyond about 30° from AP raise the dose because the beam crosses more tissue, and collimation narrows the field. Above 20 mGy/min something should change, and this is the first thing to change.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Switch to the next magnification field so that the lesion edges are easier to see",
            feedback: "Magnification raises the skin dose rate (Oxford) and does not fix a beam that is struggling through too much tissue.",
            next: "c-magnify",
            stateDelta: { stability: -8, flags: ["magnification"] },
          },
          {
            text: "Keep the view and ask the radiographer to raise the pulse rate to improve penetration",
            acceptable: true,
            feedback:
              "Brilakis does list changing the frame and pulse rate to add dose and penetration, but a shallower angle also improves penetration and costs no extra dose, so it is the better thing to try first. You have paid in dose for something the angle could have given free.",
            stateDelta: { stability: -4 },
          },
        ],
      },
      {
        id: "c-magnify",
        kind: "consequence",
        prompt: "With magnification on, the dose rate climbs to 42 mGy/min and the image is larger but still noisy. What now?",
        options: [
          {
            text: "Return to the lowest magnification, flatten the angle, collimate to the segment and reassess",
            best: true,
            feedback: "Right. Each of these lowers the dose rate, and a shallower angle also helps the beam penetrate; reassess the image after each change.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Add a further magnification step to see the stenosis margins more clearly",
            feedback: "More magnification, more skin dose, and the noise comes from penetration, not image size.",
            stateDelta: { stability: -6, flags: ["magnification"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The wire is across and the lesion has been predilated. You are advancing a long stent through the guide from the Y-connector. How do you use X-ray?",
        options: [
          {
            text: "Advance without screening while watching the shaft markers, knowing the guide length, and start fluoroscopy as the stent nears the guide tip",
            best: true,
            feedback:
              "Brilakis: use balloon, wire and stent shaft markers to judge when the device nears the guide tip, and know the guide length, because with a 90 cm guide the more proximal marker can mislead.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Screen continuously from the moment the stent enters the Y-connector so that you never lose sight of it",
            feedback: "The stent is inside the guide and cannot go anywhere you need to see. This is the 'heavy foot': X-ray without anything to look at.",
            stateDelta: { stability: -4, flags: ["heavy-foot"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The stent is deployed and you post-dilate with a non-compliant balloon in three positions. How do you document the inflations?",
        options: [
          {
            text: "Use the fluoroscopy-save button for each inflation and keep cine for the final result",
            best: true,
            feedback: "Brilakis's routine: fluoroscopy store instead of cine for balloon and stent inflations; cine is about ten times the dose.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Record a cine run for each inflation so that every balloon position is archived in high quality",
            feedback: "Each cine run costs about ten times the fluoroscopy dose for an image that fluoroscopy save would have documented adequately.",
            next: "c-cine",
            stateDelta: { stability: -6, flags: ["cine-heavy"] },
          },
          {
            text: "Use fluoroscopy save for each inflation but switch to the highest magnification field to see the balloon markers",
            acceptable: true,
            feedback: "Fluoroscopy save is right; the magnification is not. Lower magnification needs less radiation, and on modern monitors the markers are large enough.",
            stateDelta: { stability: -2 },
          },
        ],
      },
      {
        id: "c-cine",
        kind: "consequence",
        prompt: "The radiographer notes 16 cine runs so far, while the fluoroscopy time reads only 11 minutes. Your colleague says the dose must be modest. How do you respond?",
        options: [
          {
            text: "Point out that cine is not counted in the fluoroscopy time, check the cumulative air kerma, and use fluoroscopy save from now on",
            best: true,
            feedback: "Correct: fluoroscopy time leaves out cine, which is usually the main source of the patient's dose (Oxford). Air kerma is the number to follow.",
            stateDelta: { stability: 4 },
          },
          {
            text: "Agree: 11 minutes of fluoroscopy is a short case, so the dose is low",
            feedback: "Fluoroscopy time ignores cine; with 16 runs the dose may be several times what the time suggests.",
            stateDelta: { stability: -5, flags: ["cine-heavy"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "While you adjust the radial sheath during post-dilatation in LAO, your personal dosimeter alarms. You are leaning over the wrist and the shield has been pushed aside to give you room. What do you do?",
        options: [
          {
            text: "Bring the shield back down against the patient between the beam and you, step back on the manifold extension, and keep your hands out of the field",
            best: true,
            feedback:
              "Real-time dosimeters exist to prompt this change and cut operator dose by about 30%. Distance follows the inverse square law, and the shield works only when it is low and close to the patient.",
            stateDelta: { stability: 2 },
          },
          {
            text: "Carry on: your apron is 0.35 mm lead equivalent, so the alarm reflects the unprotected dosimeter rather than your real dose",
            feedback: "The apron does not cover your eyes, head or hands, and the alarm tells you that the scatter around you is high. Oxford adds a thyroid collar and lead glasses for exactly that reason.",
            next: "c-operator",
            stateDelta: { stability: -2, flags: ["operator-exposed"] },
          },
          {
            text: "Change to an RAO projection to lower your exposure, accepting a less familiar view for the RCA",
            acceptable: true,
            feedback:
              "RAO does lower operator exposure (Brilakis), but it is a harder view for RCA work, and it leaves the shield and your distance unaddressed. Fix those first.",
            stateDelta: { stability: -1 },
          },
        ],
      },
      {
        id: "c-operator",
        kind: "consequence",
        prompt: "The radiographer reminds you that you are standing about half a metre from the beam entry with no shield between you. What do you do?",
        options: [
          {
            text: "Reposition the shield close to the patient, step back to about 1.5 m with the extension, and check your thyroid collar and glasses",
            best: true,
            feedback: "Tripling your distance cuts your scatter dose to about one ninth, and a shield close to the patient further reduces the scatter that reaches you.",
            stateDelta: { stability: 2 },
          },
          {
            text: "Finish the step quickly from where you are, then step back",
            feedback: "Every second spent close to the beam entry without a shield is dose you did not need; the change takes only a few seconds.",
            stateDelta: { stability: -2, flags: ["operator-exposed"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The RCA result is excellent. After 80 minutes the cumulative air kerma reads 5.4 Gy. The LCx lesion remains. What do you do?",
        info: "Air kerma 5.4 Gy; most of the dose was delivered in LAO projections. The patient is comfortable; contrast used so far 190 mL.",
        variants: [{ flag: "poor-geometry", info: "The early minutes with a low table and raised detector contributed a disproportionate share of the skin dose." }],
        options: [
          {
            text: "Stop here and stage the LCx PCI for another day; record the dose, explain it to the patient and arrange the skin check",
            best: true,
            feedback:
              "Brilakis usually stops when air kerma exceeds 5–7 Gy, and a high dose already given favours staging the remaining lesions. At 5.4 Gy you are at the bottom of that band, so this is a judgement, but the contrast points the same way: 190 mL leaves only about 60 mL below his ceiling of 3.7 × eGFR (about 250 mL here; Brilakis 2.6), and contrast expected to be excessive during PCI of further lesions is another of his reasons to stage (7.3). Above 5 Gy he asks for a skin examination within a month, documented in the notes (cm-patient-complications teaches the follow-up).",
            stateDelta: { stability: 5, flags: ["staged"] },
          },
          {
            text: "Treat the LCx now in the same LAO projections so that the familiar views keep the procedure short",
            feedback:
              "This adds dose on top of the same skin entry point, the combination most likely to injure the skin; Brilakis asks you to stop or stage at this level and to vary projections in long cases.",
            next: "c-skin",
            stateDelta: { stability: -15, flags: ["pushed-on"] },
          },
          {
            text: "Treat the LCx now but in caudal and RAO projections that move the skin entry point, with strict collimation and fluoroscopy save",
            acceptable: true,
            feedback:
              "Moving the entry point and minimising dose help, and Brilakis's radiation section allows you to consider stopping as late as 7–8 Gy. But his monitoring chapter usually stops at 5–7 Gy, and staging is favoured when the dose is already high. Whichever you choose, the dose is already above 5 Gy, so arrange a documented skin examination within a month (Brilakis 28.2.3).",
            stateDelta: { stability: -5, flags: ["second-vessel-same-day"] },
          },
        ],
      },
      {
        id: "c-skin",
        kind: "consequence",
        prompt: "The LCx PCI goes well but adds 2.9 Gy, mostly through the same skin entry point. Final air kerma 8.3 Gy. What follow-up do you arrange?",
        options: [
          {
            text: "Record the dose, explain the risk of a skin reaction on the back, and book a documented skin examination within a month",
            best: true,
            feedback:
              "Above 5 Gy Brilakis asks for follow-up within a month with the back examined and documented, and for any injury to be referred to a specialist. A warned patient will not have an unexplained red patch biopsied.",
            stateDelta: { stability: 3, flags: ["skin-check-booked"] },
          },
          {
            text: "No specific follow-up: skin checks are needed only above 10 Gy",
            feedback: "Brilakis's first follow-up threshold is 5 Gy air kerma; 10 Gy is the level at which a physicist also calculates the peak skin dose.",
            stateDelta: { stability: -6, flags: ["no-follow-up"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The radiographer notes that the dose is well above what the lab usually delivers for a PCI of this kind. What do you record and who is told?",
        options: [
          {
            text: "Record the air kerma, DAP and fluoroscopy time in the report, explain the dose to the patient, and if it was greater than intended, report it through the local IR(ME)R procedure (medical physics expert or radiation protection adviser)",
            best: true,
            feedback:
              "Oxford: the operator records the exposure and communicates it to the patient after the 1 Gy warning, the procedure record lists fluoroscopy time and DAP, and a dose greater than expected is referred to the local radiation protection adviser. Under IR(ME)R 2017 the employer then investigates; an exposure significantly greater than is proportionate is notified to the enforcing authority, and a clinically significant one is explained to the patient.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Nothing beyond the usual report: an overexposure means ten times the intended dose, so no one else needs to know",
            feedback:
              "Ten times the intended dose is Oxford's rule of thumb for an overexposure, not the threshold for reporting: Oxford asks for the radiation protection adviser to be contacted whenever a dose is greater than expected, and for the patient to be told.",
            stateDelta: { stability: -4, flags: ["not-escalated"] },
          },
        ],
      },
    ],
    outcome: "The RCA was stented with an excellent result.",
    outcomeVariants: [
      { flag: "poor-geometry", text: "The low table and raised detector early in the case added skin dose that a few seconds of adjustment would have saved." },
      { flag: "magnification", text: "Magnification used to rescue a poor image raised the dose rate without fixing the problem, which was the angle." },
      { flag: "cine-heavy", text: "Cine runs for each inflation inflated the dose while the fluoroscopy time made the case look short." },
      { flag: "operator-exposed", text: "Your own dose for the day was several times what it needed to be: the shield was out of position and you stood close to the beam entry." },
      { flag: "staged", text: "The patient was told the dose and given written advice about a skin reaction on the back, and his back was examined and documented at a review within a month. The LCx was treated at a second, planned procedure using projections that avoided the first entry area." },
      { flag: "second-vessel-same-day", text: "The LCx was treated at the same sitting through caudal and RAO projections, which spread the extra dose over a new skin entry area but added to a total that was already above 5 Gy. He was told the dose, and his back was examined and documented at a review within a month." },
      { flag: "pushed-on", text: "Finishing the LCx in the same projections took the final dose to 8.3 Gy, much of it through one patch of skin, and redness later appeared on his back." },
      { flag: "skin-check-booked", text: "Because a skin examination had been booked, the redness was seen at the review within a month, documented and referred to dermatology." },
      { flag: "no-follow-up", text: "Without a booked skin check, a later rash on his back would have reached a doctor with no idea of its cause." },
    ],
    learningPoints: [
      "Set the room before the first image: table high, detector close, 6–7.5 fps fluoroscopy, lowest magnification, shield against the patient, manifold extension.",
      "For a poor image, try a shallower angle and collimation before settings that add dose, because they cost nothing; magnification does not fix penetration.",
      "Advance devices on their markers and document inflations with fluoroscopy save; cine is about ten times the dose and is not in the fluoroscopy time.",
      "When your dosimeter alarms: shield down to the patient, step back, hands out of the field.",
      "At around 5–7 Gy, stop and stage the remaining work rather than adding dose to the same skin; above 5 Gy, arrange a documented skin check within a month.",
      "Record the dose, tell the patient, and report a dose greater than expected through the local IR(ME)R procedure (medical physics expert or radiation protection adviser).",
    ],
    refs: [...BOOKS, "irmer-2017"],
  },
];

// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-rad-read-the-ct-first",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Open the CT before you scrub",
    text: "If the patient has a recent coronary or aortic CT, review it at planning: it can show the target lesion, the arch and access vessels, a CTO's cap and landing zone, or an anomalous origin. Count any contrast it used in today's limit.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-ct",
    sources: [B("1.1"), B("1.4"), B("1.5"), B("2.6"), O("ch 1: Cardiac CT or invasive angiography?")],
    refs: BOOKS,
  },
  {
    id: "diag-rad-c-arm-clear",
    lab: "diagnostic",
    when: { phase: ["views"] },
    title: "C-arm moving: clear the path, then screen",
    text: "Before the C-arm swings to a new view, make sure it will clear the patient and step out of its path yourself. Wait until it has stopped before you press the pedal.",
    tone: "caution",
    lessonId: "hb-lab-and-radiation-xray-system",
    sources: [B("6.4"), O("ch 1: Radiation safety")],
    refs: BOOKS,
  },
  {
    id: "diag-rad-grainy-image-flatten",
    lab: "diagnostic",
    when: { phase: ["views", "inject"] },
    title: "Poor image: flatten the angle before adding dose",
    text: "In a large patient or a steep view, try the steps that cost no extra dose first: a shallower angle, the detector down to the chest and collimation. A higher frame or pulse rate also adds penetration, but at the price of more radiation, so keep it for an image that is still not diagnostic.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-xray-system",
    sources: [B("6.4"), B("28.2"), O("ch 1: Fluoroscopy and acquisition")],
    refs: BOOKS,
  },
  {
    id: "diag-rad-pregnancy-check",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Confirm pregnancy status before the first exposure",
    text: "In a woman of child-bearing potential, confirm and document that she is not pregnant before any imaging, following local policy. If an essential procedure must go ahead in pregnancy, Oxford suggests low frame-rate imaging, which may reduce dose at the cost of image quality.",
    tone: "caution",
    lessonId: "hb-lab-and-radiation-dose",
    sources: [O("ch 1: Catheter laboratory preparation"), O("ch 2: The radiographer"), O("ch 1: Radiation safety"), B("1.1")],
    refs: BOOKS,
  },
  {
    id: "diag-rad-read-the-dose-panel",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Read the dose panel and record it",
    text: "Before you leave the table, read the cumulative air kerma, the DAP and the fluoroscopy time, remembering that fluoroscopy time leaves out cine. Record them in the report, and if the dose was greater than expected, tell the patient and report it through the local IR(ME)R procedure (medical physics expert or radiation protection adviser).",
    tone: "do",
    lessonId: "hb-lab-and-radiation-dose",
    sources: [O("ch 1: Radiation safety"), O("ch 1: Dose excess"), O("ch 2: The cardiac physiologist"), B("2.5"), B("28.2")],
    refs: [...BOOKS, "irmer-2017"],
  },
  {
    id: "diag-rad-pedal-discipline",
    lab: "diagnostic",
    when: { phase: ["advance", "engage-left", "engage-right", "exchange"] },
    title: "Screen only while you are looking",
    text: "Press the pedal only when you need to see something and are watching the screen, and lift it the moment you have seen it. A lag in releasing the pedal is a common early habit and pure wasted dose.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-reduce",
    sources: [B("28.2"), O("ch 1: Radiation safety")],
    refs: BOOKS,
  },
  {
    id: "diag-rad-fluoro-rate-default",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Set fluoroscopy to 7.5 frames per second",
    text: "Start at 6–7.5 frames per second (3.75 in a thin patient) and the lowest magnification. Brilakis finds this adequate in nearly all cases and it halves the fluoroscopy dose of 15 frames per second.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-reduce",
    sources: [B("28.2"), O("ch 1: Fluoroscopy and acquisition")],
    refs: [...BOOKS, "abdelaal-low-frame-rate-2014"],
  },
  {
    id: "diag-rad-low-magnification",
    lab: "diagnostic",
    when: { phase: ["views", "inject"] },
    title: "Lowest magnification that answers the question",
    text: "Magnification raises the skin dose rate. Use the lowest field that shows what you need and collimate rather than zoom; on a large monitor the image is still big enough.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-reduce",
    sources: [B("28.2"), O("ch 1: Radiation safety"), O("ch 2: The radiographer")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-shallow-working-view",
    lab: "pci",
    when: { phase: ["plan", "wire"] },
    title: "Keep the working view within about 30° of AP",
    text: "Steeper angles send the beam through more tissue and the system raises the dose without telling you. Use slight rather than zero angulation, so the spine is out of the field; RAO lowers operator exposure and suits the mid-LAD, but is harder for RCA wiring.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-reduce",
    sources: [B("28.2"), O("ch 1: Fluoroscopy and acquisition")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-collimate-check-edges",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent"] },
    title: "Collimate, then glance at what is outside",
    text: "Collimate to the working segment, but open the field at intervals to check the guide tip and the distal wire tip. A wire migrating distally can perforate, and a guide diving deep can dissect the aorto-coronary junction, both unseen.",
    tone: "caution",
    lessonId: "hb-lab-and-radiation-reduce",
    sources: [B("28.2"), B("2.12")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-rad-lead-check",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Apron, collar, glasses, dosimeter",
    text: "Before scrubbing, put on an apron (most are 0.25–0.35 mm lead equivalent; a two-piece suits a bad back), a 0.35 mm lead-equivalent thyroid collar and lead glasses, and wear your dosimeter as issued.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-operator",
    sources: [O("ch 1: Radiation safety"), O("ch 1: Catheter laboratory preparation")],
    refs: OXFORD,
  },
  {
    id: "diag-rad-shield-low-close",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Ceiling shield low and against the patient",
    text: "Bring the ceiling shield down between the patient and you, close to the patient and not hanging high. Put disposable radiation pads on the abdomen, never in the field of view, where they make the tube emit more.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-operator",
    sources: [B("28.2"), B("6.4"), B("2.5")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-rad-step-back-for-cine",
    lab: "diagnostic",
    when: { phase: ["inject"] },
    title: "Step back for the run",
    text: "Use the manifold extension and stand as far back as you can during cine: doubling your distance cuts your dose to a quarter. Keep your hands and the patient's arms out of the field.",
    tone: "do",
    lessonId: "hb-lab-and-radiation-operator",
    sources: [B("28.2"), B("6.4"), O("ch 1: Radiation safety")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-operator-dose-alarm",
    lab: "pci",
    when: { event: ["high-radiation-dose"] },
    alsoIn: [{ lab: "diagnostic" }],
    title: "High dose: protect yourself as well",
    text: "A high patient dose means more scatter reaching you. Bring the shield back down against the patient, step back on the extension and take your hands out of the field; if the view allows, an RAO projection lowers operator exposure. A real-time personal dosimeter, if you wear one, shows whether it worked.",
    tone: "caution",
    lessonId: "hb-lab-and-radiation-operator",
    sources: [B("2.5"), B("28.2")],
    refs: ["brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "irmer-2017",
    kind: "web",
    citation: "The Ionising Radiation (Medical Exposure) Regulations 2017. SI 2017/1322.",
    url: "https://www.legislation.gov.uk/uksi/2017/1322/contents/made",
    note: "Checked on legislation.gov.uk (made version). Used for: reg 6(5)(c) and 6(7), the employer regularly reviews and makes available diagnostic reference levels (for interventional procedures where appropriate) and ensures reviews when they are consistently exceeded; reg 8, an exposure that was or may have been significantly greater than is generally considered proportionate is investigated immediately and notified to the enforcing authority, and the referrer, practitioner and patient are told of a clinically significant unintended or accidental exposure; reg 14(3)(a) and (f), the medical physics expert is involved in applying diagnostic reference levels and in analysing accidental or unintended exposures; reg 18, enforced as health and safety regulations under the Health and Safety at Work etc. Act 1974, whose offence provisions apply. Distinct from the Ionising Radiations Regulations 2017 (SI 2017/1075, ref irr-2017), which protect workers.",
    verified: true,
  },
  {
    id: "stocker-protection-vi-2018",
    kind: "paper",
    citation: "Stocker TJ, Deseive S, Leipsic J, et al. Reduction in radiation exposure in cardiovascular computed tomography imaging: results from the PROspective multicenter registry on radiaTion dose Estimates of cardiac CT angIOgraphy iN daily practice in 2017 (PROTECTION VI). Eur Heart J. 2018;39(41):3715–3723.",
    url: "https://doi.org/10.1093/eurheartj/ehy546",
    note: "PMID: 30165629 (PMC6455904). Checked on PubMed: authors, title, journal, year, volume 39, issue 41, pages 3715–3723; abstract read. Used for: 4502 patients in 61 hospitals in 2017; median coronary CTA dose-length product 195 mGy·cm, 78% lower than in a 2007 survey; 37-fold variability in median DLP between hospitals.",
    verified: true,
  },
  {
    id: "icrp-103-2007",
    kind: "guideline",
    citation: "ICRP. The 2007 Recommendations of the International Commission on Radiological Protection. ICRP publication 103. Ann ICRP. 2007;37(2–4):1–332.",
    url: "https://doi.org/10.1016/j.icrp.2007.10.003",
    note: "PMID: 18082557. Checked on PubMed: title, journal, year, volume 37, issue 2–4, pages 1–332. Content checked in the free extract on icrp.org (executive summary and glossary). Used for: stochastic effects (cancer and heritable effects) defined as effects whose probability, but not severity, is a function of dose without threshold; deterministic effects (tissue reactions) defined by a threshold dose and severity rising with dose; after prenatal exposure a threshold dose exists for the induction of malformations.",
    verified: true,
  },
  {
    id: "packy-forssmann-2016",
    kind: "paper",
    citation: "Packy LM, Krischel M, Gross D. Werner Forssmann - A Nobel Prize winner and his political attitude before and after 1945. Urol Int. 2016;96(4):379–385.",
    url: "https://doi.org/10.1159/000444648",
    note: "PMID: 27007661. Checked on PubMed: authors, title, journal, year, volume 96, issue 4, pages 379–385; abstract read. Used for: the 1929 self-experiment with a urethral catheter passed through his antecubital vein to his right ventricle; the 1956 Nobel Prize shared with Cournand and Richards.",
    verified: true,
  },
  {
    id: "meyer-forssmann-1990",
    kind: "paper",
    citation: "Meyer JA. Werner Forssmann and catheterization of the heart, 1929. Ann Thorac Surg. 1990;49(3):497–499.",
    url: "https://doi.org/10.1016/0003-4975(90)90272-8",
    note: "PMID: 2178572. Checked on PubMed: author, title, journal, year, volume 49, issue 3, pages 497–499; abstract read. Used for: Forssmann a 25-year-old surgical trainee one year out of medical school; later opacified his right heart chambers with iodinated contrast through a catheter, again on himself.",
    verified: true,
  },
  {
    id: "zimmerman-left-heart-1950",
    kind: "paper",
    citation: "Zimmerman HA, Scott RW, Becker NO. Catheterization of the left side of the heart in man. Circulation. 1950;1(3):357–359.",
    url: "https://doi.org/10.1161/01.cir.1.3.357",
    note: "PMID: 15405704. Checked on PubMed: authors, title, journal, year (March 1950), volume 1, issue 3, pages 357–359. No abstract; used only for the title and publication date.",
    verified: true,
  },
  {
    id: "ryan-angiogram-history-2002",
    kind: "paper",
    citation: "Ryan TJ. The coronary angiogram and its seminal contributions to cardiovascular medicine over five decades. Trans Am Clin Climatol Assoc. 2002;113:261–271.",
    url: "https://pubmed.ncbi.nlm.nih.gov/12053714/",
    note: "PMID: 12053714 (PMC2194484). Checked on PubMed: author, title, journal, year, volume 113, pages 261–271; abstract read. Used for: Sones's selective hand injection into the right coronary artery of a middle-aged man on 30 October 1958; Favaloro's aortocoronary bypass surgery in May 1967; Rentrop's guidewire recanalisation and intracoronary streptokinase in July 1979. (Brilakis ch 30 cites a Circulation 2002 article by the same author with the same title; this is a different publication.)",
    verified: true,
  },
  {
    id: "gruntzig-ptca-1978",
    kind: "paper",
    citation: "Gruntzig A. Transluminal dilatation of coronary-artery stenosis. Lancet. 1978;1(8058):263.",
    url: "https://doi.org/10.1016/s0140-6736(78)90500-7",
    note: "PMID: 74678. Checked on PubMed: author, title, journal, year (4 February 1978), volume 1, issue 8058, page 263; a letter (case report), no abstract. Used for: Gruentzig's report of coronary angioplasty in 1978. Cited in Oxford ch 1 further reading.",
    verified: true,
  },
  {
    id: "sigwart-stents-1987",
    kind: "paper",
    citation: "Sigwart U, Puel J, Mirkovitch V, Joffre F, Kappenberger L. Intravascular stents to prevent occlusion and restenosis after transluminal angioplasty. N Engl J Med. 1987;316(12):701–706.",
    url: "https://doi.org/10.1056/NEJM198703193161201",
    note: "PMID: 2950322. Checked on PubMed: authors, title, journal, year, volume 316, issue 12, pages 701–706; abstract read. Used for: self-expanding stainless-steel mesh; 24 coronary stents in 19 patients with restenosis, abrupt closure after angioplasty or deteriorating bypass grafts.",
    verified: true,
  },
];
