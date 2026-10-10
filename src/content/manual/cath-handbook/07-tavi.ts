// Module hb-tavi: TAVI (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 5 (TAVI work-up, aortic
// stenosis, pulmonary valve, pulmonary angiography), chapter 1 (cardiac CT in transcatheter aortic valve
// intervention), chapter 2 (the nurse: sign-out), chapter 3 (arterial closure devices) and chapter 4 (accessing the left
// heart: the difficult aortic valve); Brilakis, Manual of PCI, sections 24.1 (TAVR patients), 14.4 (large-bore
// access, pre-close and crossing a stenotic valve for a microaxial pump), 11.1 (suture closure), 29.1 (femoral
// complications) and 4.1/4.4 (access choice, transcaval access). Neither manual teaches the TAVI procedure itself, so
// verified references carry most of this module: the 2025 ESC/EACTS and 2021 ESC/EACTS valve guidelines (the
// sections whose text could be read), the 2020 ESC adult congenital guideline, the ESCR CT consensus, the BASILICA
// tutorial, a practical review of TAVI complications, EASY TAVI, the coronary obstruction and valve-in-valve
// registries, the two cerebral protection trials, and reviews of paravalvular leak closure and RVOT dysfunction.
// Every claim is listed with its page or reference in docs/curriculum/evidence/hb-tavi.md.
// Neighbouring modules: hb-specific-conditions (aortic stenosis gradients, crossing the valve for haemodynamics,
// pulmonary valve measurement), cp-complex-patients (coronary work-up before TAVI, NOTION-3, PCI through a valve
// frame), cm-access-complications (large-bore bleeding and closure failure in full), pm-physiology (FFR in aortic
// stenosis), hb-additional-procedures (balloon aortic valvuloplasty), hb-mitral-tricuspid-laa (mitral and tricuspid
// transcatheter therapy). Academy lessons this module builds on: sh-as-severity, sh-tavi-vs-savr, sh-tavi-ct,
// sh-tavi-valves, sh-tavi-setup, sh-tavi-deploy, sh-tavi-assess, sh-tavi-pvl-conduction, sh-tavi-coronary,
// sh-tavi-catastrophes, sh-viv, sh-pvl-pulmonary.
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OX = ["oxford-cath-handbook"];
const BR = ["brilakis-manual-pci"];
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });

export const module: Module = {
  id: "hb-tavi",
  title: "TAVI",
  stage: 5,
  summary:
    "Transcatheter aortic valve implantation from the referral to the follow-up: how the Heart Team decides and plans for the patient's lifetime, how the planning CT is acquired and read and what the invasive work-up adds, the transfemoral procedure step by step, coronary obstruction and the later return to the coronaries, vascular injury, stroke, conduction and paravalvular regurgitation, valve-in-valve and redo TAVI, and the closure of paravalvular leaks and the transcatheter treatment of the pulmonary valve.",
  objectives: [
    "Work through a TAVI referral as a Heart Team would: benefit or futility, age and life expectancy, anatomy and access, the coronaries, and a plan that leaves room for a second valve.",
    "Specify a TAVI planning CT, measure the annulus correctly and derive its mean diameters, judge coronary obstruction risk from height, leaflet length and sinus width, and assess both access routes against the sheath.",
    "Perform the steps of a transfemoral TAVI safely: guided large-bore puncture and pre-close, a protection wire, controlled valve crossing, a pacing plan matched to the conduction risk, and a checked closure.",
    "Recognise coronary obstruction, explain why bail-out and prophylactic stenting are unsatisfactory and what leaflet laceration does, and plan coronary access after TAVI.",
    "Manage the access, stroke, conduction and paravalvular complications of TAVI with the evidence behind each decision.",
    "Plan a valve-in-valve or redo TAVI: identify the surgical valve, predict coronary risk with a virtual valve, anticipate a high gradient, and know when ring fracture helps.",
    "Select patients for paravalvular leak closure and treat the phenotype, and describe balloon valvuloplasty and transcatheter valve implantation for pulmonary valve disease, including coronary compression testing.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-candidate",
      title: "Choosing TAVI: benefit, the coronaries and the lifetime plan",
      minutes: 14,
      topics: ["sh-tavi-planning"],
      sources: [O("ch 5: TAVI work-up"), O("ch 5: Aortic stenosis"), B("24.1")],
      refs: [...BOOKS, "esc-vhd-2025", "tamburino-tavi-complications-2020", "francone-escr-tavi-imaging-2020"],
      blocks: [
        {
          kind: "p",
          text: "Oxford describes TAVI as becoming an established treatment for severe symptomatic aortic stenosis, and Brilakis notes that it is now offered even to patients at low surgical risk, many of whom will later need coronary angiography or PCI through the new valve. A TAVI decision therefore has two horizons: will this patient gain from a valve now, and what will the first valve allow or prevent over the decades that follow? Severity grading is taught in sh-as-severity. The Academy lesson sh-tavi-vs-savr gives the 2021 guideline's age and risk table, but the 2025 ESC/EACTS guideline has since moved the age threshold to 70 (below). This lesson takes the Heart Team's reasoning step by step from the text of the 2025 guideline; its recommendation tables could not be read, so no class or level of recommendation is quoted here.",
        },
        { kind: "h", text: "Step by step through a referral" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Confirm the indication from non-invasive data",
              detail:
                "Oxford expects valve area and gradients from non-invasive studies before any catheter study, and treats echocardiography as the reference for most patients. In the TAVI work-up a detailed invasive haemodynamic study may not be needed, depending on how reliable the non-invasive studies are (hb-specific-conditions-as).",
            },
            {
              title: "2. Ask whether the patient will gain",
              detail:
                "In the practical review by Ina Tamburino and colleagues, the Heart Team (clinical and interventional cardiologists, a cardiac surgeon, an anaesthetist) sorts patients into those who benefit most from surgery, those who benefit most from TAVI, and those who benefit from no intervention or from valvuloplasty alone. Their markers of futility are a life expectancy under one year after the procedure and an expected gain of less than one NYHA class. They weigh the STS-PROM and EuroSCORE II alongside risks the scores miss: frailty, life expectancy, organ dysfunction, dementia, previous chest irradiation and deformity of the chest wall or spine.",
            },
            {
              title: "3. Weigh age as a stand-in for life expectancy",
              detail:
                "The 2025 guideline calls age a pragmatic surrogate for life expectancy and points out that patients under 70 are poorly represented in the randomised trials, so the evidence there is limited: the trials comparing TAVI with surgery enrolled patients aged 70–85 across the range of surgical risk. It also notes that most trial patients were men. In the aortic position it generally prefers a mechanical valve below 60 years and a biological one above 65. Its text then sets the age line at 70 (table below).",
            },
            {
              title: "4. Weigh anatomy and access",
              detail:
                "The guideline states that the advantages TAVI showed in randomised trials are largely confined to the transfemoral route, that surgery remains preferred when iliofemoral disease rules transfemoral TAVI out, and that non-transfemoral TAVI is an alternative backed by observational data in patients unsuitable for surgery. A bicuspid valve adds complexity because its calcium is asymmetric and its annulus elliptical. Surgery remains the main treatment for stenotic bicuspid valves, particularly in the young, in those with an associated aortopathy and in those with unfavourable valve anatomy; TAVI may be considered for a bicuspid valve when surgical risk is increased and the anatomy is suitable. The anatomical detail comes from CT (next lesson).",
            },
            {
              title: "5. Decide what to do about the coronaries",
              detail:
                "See the next block. The full coronary work-up, including how the pressure trace and opacification behave in severe aortic stenosis and the NOTION-3 trial, is taught in cp-complex-patients-tavr-before.",
            },
            {
              title: "6. Plan the second valve before choosing the first",
              detail:
                "The 2025 guideline asks the team to anticipate, at the first TAVI, whether a later TAV-in-TAV will be feasible and safe, naming device choice, the height of the new skirt, commissural alignment and implantation depth as the levers. A patient whose annulus is small for their body size is at higher risk of patient–prosthesis mismatch: the guideline's list of bioprosthesis points names surgery with aortic root enlargement or a supra-annular transcatheter valve, and its text adds that surgical annular enlargement (in an experienced centre) allows a larger surgical valve, and that supra-annular transcatheter designs reduce the risk of mismatch, although long-term outcome data are awaited. It finds no systematic difference in durability between surgical and transcatheter valves, and describes surgical explant of a transcatheter valve as rare (under 1% of TAVI procedures), technically demanding, and associated with early mortality as high as 12–17%.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Choosing the mode of intervention in the 2025 ESC/EACTS guideline text (the recommendation table itself, with its classes, is not reproduced here)",
          head: ["Patient", "What the text says", "Why"],
          rows: [
            [
              "Aged 70 or over, tricuspid aortic valve, suitable anatomy, transfemoral access feasible",
              "TAVI is recommended as the primary treatment",
              "To lower the risk of early adverse outcomes and speed recovery",
            ],
            [
              "Under 70 with low surgical risk",
              "Surgery remains the preferred treatment",
              "Lifetime management, and the scarcity of randomised data below 70",
            ],
            [
              "All other candidates for a biological valve",
              "The Heart Team chooses",
              "Procedural risk from anatomy and comorbidity, expected outcomes, lifetime management and the patient's preference",
            ],
          ],
        },
        {
          kind: "check",
          stem: "A 73-year-old man with severe symptomatic aortic stenosis has a tricuspid valve, a low surgical risk score and good femoral arteries on CT. What does the 2025 guideline text point to?",
          options: [
            "Surgery, because he is under 75 and at low surgical risk",
            "TAVI as the primary treatment, because he is over 70 with suitable anatomy and access",
            "Either, with no default: age no longer enters the decision",
            "Balloon valvuloplasty first, with the valve decision deferred for a year",
          ],
          answer: 1,
          explanation:
            "The 2025 text recommends TAVI as the primary treatment from 70 years with a tricuspid valve, suitable anatomy and feasible transfemoral access, to reduce early adverse outcomes and speed recovery. The 'under 75 and low risk means surgery' rule is the 2021 table in sh-tavi-vs-savr, which the 2025 guideline has replaced; surgery is now the preferred option under 70 at low risk. Age remains central, as the surrogate for life expectancy, so 'no default' is wrong, and nothing here calls for valvuloplasty.",
        },
        {
          kind: "check",
          stem: "An 88-year-old woman with severe symptomatic aortic stenosis has advanced dementia, is bedbound from a previous stroke, and her geriatrician estimates a life expectancy of a few months. Her CT shows good femoral access. What does the review's framework suggest?",
          options: [
            "Transfemoral TAVI, because her surgical risk is prohibitive and access is good",
            "The Heart Team should consider no valve intervention: the expected benefit is too small",
            "Surgical replacement, because TAVI is reserved for patients without dementia",
            "Balloon valvuloplasty first, then TAVI once her mobility has recovered",
          ],
          answer: 1,
          explanation:
            "The review names a life expectancy under one year and an expected gain of less than one NYHA class as reasons a patient may benefit from no intervention (or valvuloplasty alone), and lists dementia among the risks scores miss. Good access makes TAVI possible, not worthwhile; a prohibitive surgical risk is a reason against surgery, not a reason for TAVI. Nothing suggests her mobility will recover.",
        },
        { kind: "tip", id: "structural-tavi-futility-check" },
        { kind: "h", text: "The coronaries before TAVI" },
        {
          kind: "list",
          items: [
            "**CT can often replace the invasive angiogram.** In elderly TAVI candidates the 2025 guideline gives CT angiography a high sensitivity (95–97%) but only a modest specificity (68–73%) for obstructive coronary disease, mostly because of calcium and atrial fibrillation. When the planning CT is good enough to exclude relevant disease, it says leaving out invasive angiography should be considered.",
            "**This is a change.** The 2019 ESCR radiology consensus advised against using CT routinely for the coronaries of TAVI candidates, allowing it case by case, and noted coronary disease in 40–75% of them, with coronary information more than 3 months old needing renewal. Read older protocols with that date in mind.",
            "**When to treat a stenosis.** The 2025 text says PCI should be considered in a patient whose main indication is TAVI when there is a stenosis of 90% or more in a vessel of at least 2.5 mm, and may be considered for stenoses of 70% or more depending on symptoms.",
            "**When to do it.** The guideline asks that timing take account of the valve to be used, because tall-framed valves can make later coronary access difficult. Brilakis calls PCI before TAVI in severe aortic stenosis controversial and sets out the trade-off: it carries more risk but may lower the risk of complications during TAVI; PCI in the same session is convenient but adds complexity and contrast; deferring it lets you tell coronary symptoms from valve symptoms, but engaging through the frame can then be hard.",
            "**Same session or not.** Ina Tamburino and colleagues go on to the TAVI in the same procedure only when the PCI has worked, was uncomplicated and did not need much contrast; otherwise the TAVI is put off to a later date. They cite a composite of death, disabling stroke and myocardial infarction of 10.4% with same-session PCI and TAVI, 15.4% with untreated severe coronary disease and 14.8% with no coronary disease, a difference that was not significant (P = 0.77); the review offers it as reassurance that the combined approach is not more hazardous.",
            "**Screening on the planning CT.** The same review describes folding coronary screening into the planning CT and keeping invasive angiography for a significant proximal stenosis (about 20% of patients) or for patients who cannot have CT, such as those with severe chronic renal failure.",
          ],
        },
        {
          kind: "check",
          stem: "A 79-year-old man's ECG-gated planning CT is of good quality and shows no significant coronary stenosis. The referral asks for invasive coronary angiography 'as usual before TAVI'. Following the 2025 ESC/EACTS guideline text, what is the best response?",
          options: [
            "Book it anyway: CT specificity is too low to rely on in any TAVI candidate",
            "Consider leaving it out, because a good-quality CT has excluded relevant disease",
            "Book it, because the guideline requires angiography within 3 months of TAVI",
            "Replace it with an invasive FFR study of every major vessel before the valve",
          ],
          answer: 1,
          explanation:
            "The 2025 guideline says omitting invasive angiography should be considered when the pre-TAVI CT is of sufficient quality to exclude relevant coronary disease. Its caution about specificity (68–73%) matters when CT suggests disease, because a positive CT may be false; it does not undo a clearly negative scan. The 3-month figure is the older radiology consensus's rule for how recent coronary information should be, not a guideline requirement, and Brilakis warns that FFR may underestimate stenoses in severe aortic stenosis.",
        },
        { kind: "h", text: "The lifetime view" },
        {
          kind: "p",
          text: "The guideline also notes that TAVI patients recover faster and leave hospital sooner than surgical patients. The cost of the choice is paid later, at the second valve and at the next coronary angiogram. Brilakis's section shows how a self-expanding frame that rises above the coronary ostia, a commissural post in front of an ostium or a high implant can make re-engagement difficult; those are decisions made, or not made, at the first procedure.",
        },
        { kind: "tip", id: "structural-tavi-plan-second-valve" },
        { kind: "tip", id: "structural-tavr-plan-reaccess" },
        {
          kind: "pitfalls",
          items: [
            "Treating access and anatomy as the decision: a valve that can be implanted is not always a valve worth implanting.",
            "Applying trial results to a 62-year-old when patients under 70 were poorly represented in the trials.",
            "Working from the 2021 age table (75 years) after the 2025 guideline has moved the line to 70.",
            "Booking invasive angiography by habit after a good-quality CT that has already excluded relevant disease.",
            "Choosing the first valve without asking what the second valve, and the next coronary angiogram, will need.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the lifetime plan into the Heart Team record: which valve and depth now, what the second procedure would be, and how the coronaries would be reached. The operator who does the redo procedure may be you, ten years older.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "On the CT planning screen, before you choose a valve, note the coronary heights and sinus width and decide which design and target depth would keep the coronaries reachable and leave room for a second valve. State your reasoning at the debrief.",
        },
        { kind: "video", id: "W82t2ugGWc4", note: "Brilakis channel lecture: TAVR in 2015 (Dallas CVI). An earlier view of the field; compare it with the 2025 guideline points above." },
        {
          kind: "keypoints",
          items: [
            "The Heart Team sorts patients into surgery, TAVI and no intervention; a life expectancy under a year or an expected gain of less than one NYHA class argues against intervening.",
            "Age stands in for life expectancy; patients under 70 and women are under-represented in the trials.",
            "2025 guideline text: TAVI is the primary treatment at 70 or over with a tricuspid valve, suitable anatomy and transfemoral access; surgery is preferred under 70 at low surgical risk; the Heart Team decides the rest.",
            "TAVI's trial advantages are largely confined to the transfemoral route, and surgery is preferred when iliofemoral disease rules it out; stenotic bicuspid valves remain mainly surgical, especially in the young.",
            "A good-quality planning CT that excludes relevant coronary disease can replace invasive angiography (2025 guideline).",
            "PCI should be considered for 90% or greater stenoses in vessels of at least 2.5 mm; its timing depends on the valve.",
            "Plan the TAV-in-TAV and the coronary re-access at the first procedure: device, skirt height, commissural alignment, depth.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-workup",
      title: "The work-up step by step: the planning CT and the invasive study",
      minutes: 18,
      topics: ["sh-tavi-planning"],
      sources: [
        O("ch 1: Cardiac CT in transcatheter aortic valve intervention"),
        O("ch 5: TAVI work-up"),
        O("ch 5: Aortic stenosis"),
      ],
      refs: [...OX, "francone-escr-tavi-imaging-2020", "esc-vhd-2025", "lederman-coronary-obstruction-2019", "ribeiro-coronary-obstruction-2013", "tamburino-tavi-complications-2020"],
      blocks: [
        {
          kind: "p",
          text: "The 2025 ESC/EACTS guideline calls cardiac CT the key test for deciding whether TAVI is suitable and for planning it, with TOE or cardiac MR as alternatives when CT is hard to interpret or relatively contraindicated. Oxford lists what CT provides: the size, tortuosity and disease of the femoral and axillary arteries; annular diameter, area and perimeter for valve size and type; the root and sinotubular junction (which matter for self-expanding valves); the whole aorta, including thrombus and ulceration; valve calcium; the height of the coronary ostia above the annular plane; and the angles for the working view. This lesson follows the European radiology (ESCR) consensus through acquisition and measurement, then adds what Oxford's invasive work-up contributes. The Academy lesson sh-tavi-ct summarises the measurements; here you do them.",
        },
        { kind: "h", text: "Acquiring the scan" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Gate the root",
              detail:
                "An ECG-gated or ECG-triggered contrast scan of the aortic root, reconstructed at 1.0 mm or thinner, on a scanner with 64 or more slices or a dual-source machine. The annulus changes shape through the cycle and is usually largest in systole, so at least a systolic phase is needed; padding or a wide window lets several phases be reconstructed if the rhythm is irregular. Image quality beats phase: if the diastolic images are better, the consensus accepts them.",
            },
            {
              title: "2. Cover the access",
              detail:
                "A second, non-gated acquisition from the subclavian arteries down to the level of the femoral heads, taking in the start of the superficial femoral arteries. Gating the rest of the body adds dose without benefit. Two acquisitions in sequence have a side benefit: they help distinguish a true thrombus from sluggish flow in a big left atrial appendage.",
            },
            {
              title: "3. Spend contrast carefully",
              detail:
                "One injection for both acquisitions, often about 50 mL at 3–4 mL/s but adjusted to the scanner's capabilities and the patient's size, with fast coverage and low tube voltage (70–80 kV). In this frail group the consensus puts saving contrast, and avoiding a repeat scan, ahead of saving radiation.",
            },
            {
              title: "4. Give no nitrates or beta-blockers for the scan",
              detail:
                "The consensus regards both as contraindicated in severe aortic stenosis and says neither belongs in the preparation for this scan, unlike a coronary CT protocol. This concerns doses given to improve the images, not the patient's regular medication.",
            },
            {
              title: "5. Add a calcium scan only if it helps",
              detail:
                "A non-contrast acquisition with calcium-scoring settings (120 kV, 3 mm slices) quantifies valve calcium by the Agatston method when Doppler grading is discordant; only calcium on the leaflets is counted. Proposed cut-offs for severe stenosis are 2000 or more in men and 1200 or more in women (women have more severe stenosis for the same calcium load), and scores of 3000 and 1600 give a positive predictive value for severe stenosis of about 95%. MR is an alternative for planning in severe renal impairment, at the cost of a longer, more complex study and poorer depiction of calcium.",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-no-nitrate-before-ct" },
        { kind: "h", text: "Measuring the annulus" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Find the plane",
              detail:
                "The annulus is not a real structure: it is the virtual ring through the lowest hinge points (nadirs) of the three leaflets, containing no fibrous tissue. Build a double-oblique plane through the three nadirs; standard coronal, sagittal or single-oblique views give wrong measurements. The right coronary nadir often lies lower than the other two. For a bicuspid valve there is no agreed method, because two hinge points cannot define a plane.",
            },
            {
              title: "2. Measure",
              detail:
                "Record the long and short diameters, then trace the perimeter so the workstation derives perimeter and area. The annulus is usually oval at this level, so a single diameter is not enough.",
            },
            {
              title: "3. Derive the mean diameters",
              detail:
                "Average of the two diameters; area-derived diameter; perimeter-derived diameter (formulas below). The area and perimeter formulas assume a circle after implantation, which is almost only true of balloon-expanded valves, so the three numbers drift apart as eccentricity increases, the perimeter method most of all. Sizing rules are therefore device-specific and not interchangeable.",
            },
            {
              title: "4. Between two sizes, measure again",
              detail:
                "If the result falls between sizes, the consensus recommends a blinded complete re-measurement, together with every other imaging source available.",
            },
          ],
        },
        { kind: "formula", name: "Area-derived annular diameter", expr: "D(area) = 2 × √(area ÷ π)", note: "Area in mm², diameter in mm." },
        { kind: "formula", name: "Perimeter-derived annular diameter", expr: "D(perimeter) = perimeter ÷ π", note: "Assumes the annulus becomes circular; least reliable in an eccentric annulus." },
        {
          kind: "check",
          stem: "The systolic annular area is 452 mm² and the perimeter is 76 mm. Which pair of derived diameters is correct?",
          options: [
            "Area-derived 24.0 mm and perimeter-derived 24.2 mm",
            "Area-derived 12.0 mm and perimeter-derived 24.2 mm",
            "Area-derived 24.0 mm and perimeter-derived 12.1 mm",
            "Area-derived 21.3 mm and perimeter-derived 25.4 mm",
          ],
          answer: 0,
          explanation:
            "452 ÷ π = 143.9; its square root is 12.0, and doubling gives 24.0 mm. 76 ÷ π = 24.2 mm. Forgetting to double the square root gives the radius (12.0 mm), and halving the perimeter result is the same error the other way. The two values are close here, which suggests a fairly round annulus; in an eccentric one they would diverge.",
        },
        { kind: "tip", id: "structural-tavi-annulus-double-oblique" },
        { kind: "h", text: "The rest of the root" },
        {
          kind: "table",
          caption: "What to measure above the annulus, and why (ESCR consensus unless stated)",
          head: ["Measurement", "How", "Why it matters"],
          rows: [
            [
              "Leaflet number and calcium",
              "State cuspidity; grade calcium as none, mild, moderate or severe, symmetric or asymmetric, and note extension towards the aortic–mitral curtain or membranous septum",
              "Bulky or eccentric landing-zone calcium can hold the frame off the wall (paravalvular leak, which CT itself cannot grade); heavy calcium is linked to annular rupture with balloon expansion, dislodgement, coronary obstruction, embolism and stroke. A bicuspid valve is not a contraindication but adds complexity and a higher pacemaker rate.",
            ],
            [
              "Coronary heights",
              "Perpendicular from the lower edge of each ostium to the annular plane",
              "Risk of obstruction is considered low above 10–14 mm, but height must be read against the length of the leaflet in front of it. Lederman and colleagues: a leaflet shorter than the coronary height carries little risk; a leaflet reaching above a sinotubular junction that is narrow for the planned valve is potentially obstructive; and bulky calcium on the leaflet tips probably rules out leaflet laceration, can embolise, and can block an ostium like a ball valve. The report should also state any coronary anomaly and whether the coronaries are calcified (ESCR).",
            ],
            [
              "Sinus of Valsalva",
              "Largest diameters and height of each sinus, on a double-oblique view",
              "The sinus is where the displaced leaflet goes; the space needed is device-specific. In Ribeiro's registry, patients with obstruction had a mean left coronary height of 10.6 mm and sinus diameter of 28.1 mm, against 13.4 mm and 31.9 mm in controls.",
            ],
            [
              "Sinotubular junction and ascending aorta",
              "Diameter at the junction and 40 mm above the annulus",
              "Needed to plan the valve, particularly a self-expanding one (Oxford); a low, narrow junction is part of the sinus sequestration picture (next lessons).",
            ],
            [
              "Working angles",
              "Predict the projection that shows the annular plane end on: the three cusp bases evenly spaced and the right coronary cusp sitting centrally",
              "Saves aortograms, contrast and radiation; the prediction assumes the patient lies as they did in the scanner, which is not always true.",
            ],
          ],
        },
        {
          kind: "p",
          text: "The consensus also offers a pointer to valve type, with the caveat that no guideline governs the choice: a self-expanding valve may suit a very oval annulus or low coronary ostia, and a balloon-expandable valve a dilated ascending aorta (over 43 mm) or a steep aortoventricular angle (over 70°). In practice, the consensus says, the choice depends mainly on the Heart Team's experience with a particular valve and on the access routes available. Device-specific choices are taught in sh-tavi-valves.",
        },
        {
          kind: "check",
          stem: "On CT the left main ostium is 9 mm above the annular plane, the left coronary leaflet is 12 mm long and calcified, and the left sinus measures 27 mm. The right coronary ostium is 15 mm high with an 11 mm leaflet. How do you read this?",
          options: [
            "Low risk on both sides, because both heights lie within the 10–14 mm band",
            "High risk on the left: a low ostium, a leaflet longer than the height, a narrow sinus",
            "High risk on the right, because the right coronary leaflet is the shorter of the two",
            "Risk cannot be judged until a balloon aortogram has been done in the lab",
          ],
          answer: 1,
          explanation:
            "On the left all three warning signs coincide: a height below the 10–14 mm low-risk band, a leaflet longer than the height (so it can reach above the ostium), and a narrow sinus, close to the means of the obstruction patients in Ribeiro's registry (10.6 mm and 28.1 mm). On the right the leaflet is shorter than a 15 mm height, which Lederman and colleagues regard as little risk. Lederman notes that the role of balloon aortography in predicting obstruction remains unclear, so it does not replace the CT reading.",
        },
        { kind: "h", text: "The access routes" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Measure the narrowest lumen on both sides",
              detail:
                "Minimal luminal diameter, excluding the wall, of the common femoral, external iliac and common iliac arteries and the aorta, on double-oblique sections perpendicular to the vessel axis.",
            },
            {
              title: "2. Compare it with the sheath",
              detail:
                "Ideally the vessel's lumen exceeds the delivery sheath's outer diameter. When the consensus was written, both main manufacturers had 14 F sheaths (16 F for their largest valves), and depending on the system the minimal vessel diameter could be as low as 5.5 mm. Older 22–24 F systems had vascular complication rates of 23–31%, against 1.9–13.3% with smaller ones.",
            },
            {
              title: "3. Grade tortuosity and calcium",
              detail:
                "Low, moderate or severe for each side; there are no agreed cut-offs. Report each side separately and finish with a recommended route.",
            },
            {
              title: "4. Transfemoral first",
              detail:
                "Choose the least invasive route; an alternative only when the femoral lumen is prohibitively compromised. When iliofemoral disease rules out transfemoral access, the 2025 guideline prefers surgery in a patient who can have it; non-transfemoral TAVI rests mainly on observational data in patients unsuitable for surgery and is a Heart Team decision. Brilakis notes that routes such as transcaval and carotid are rarely used outside structural interventions, and that transcaval access is used for TAVI.",
            },
            {
              title: "5. If transfemoral is not possible",
              detail:
                "The ESCR consensus lists the alternatives: the subclavian, common carotid and brachiocephalic arteries (for both balloon-expandable and self-expanding valves), the left ventricular apex (transapical, for the balloon-expandable SAPIEN family) and the ascending aorta through a mini-sternotomy (transaortic, entered about 6 cm above the annular plane). Every route except transfemoral needs a surgical incision. For transapical access the report must exclude abnormalities of the chest wall or apex (for example an apical infarct with thrombus) and give the angle between the apex and the outflow tract, because steeper angles complicate rigid delivery systems and are linked to more paravalvular regurgitation. For transaortic access it must describe the amount and position of ascending-aortic calcium, since heavy calcium on the front wall can block the device and add complications. Oxford adds axillary and subclavian angiography when iliofemoral disease is marked.",
            },
            {
              title: "6. Read the rest of the scan",
              detail:
                "A whole-aorta CT is a CT of most of the body: the consensus cites clinically significant incidental findings in up to a quarter of TAVI candidates, and asks for every relevant one to be reported.",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-access-min-lumen" },
        { kind: "h", text: "What the invasive work-up adds (Oxford)" },
        {
          kind: "list",
          items: [
            "**A systematic study of the coronary, aortic and peripheral arteries.** An aortogram is always part of it, to show the angle between the valve and the ascending aorta.",
            "**Haemodynamics only if needed.** Gradients and a right heart study may be added when the non-invasive studies are unreliable. Oxford notes that crossing a severely stenotic valve for diagnosis is now rarely done, because the extra data seldom change management and the attempt is hazardous; if the valve must be crossed, use Oxford's controlled technique (hb-specific-conditions-as).",
            "**The iliofemoral run.** A graded pigtail just above the aortic bifurcation, the table raised and checked to pan to both femoral heads, a pump injection (for example 20 mL at 20 mL/s); the grading allows vessel diameters to be measured afterwards.",
            "**Information CT cannot give.** Angiography identifies the puncture site and shows whether tortuous iliac or femoral arteries straighten on an extra-stiff 0.032 inch wire. If iliofemoral disease is marked, image the axillary and subclavian arteries as alternative routes.",
            "**When contrast must be spared.** One review describes doing TAVI without CT in severe renal failure, with an angiographic iliofemoral assessment and a self-expanding valve that can be implanted under echo and angiographic guidance alone. The same review lists a forced-diuresis device (RenalGuard) for an eGFR of 30 mL/min/1.73 m² or below, used with the planning CT, and before, during and for 6–12 hours after the TAVI procedure; an iso-osmolar contrast agent; and injector devices that can cut the contrast given by up to 40% without degrading the images.",
          ],
        },
        { kind: "tip", id: "structural-tavi-iliofemoral-run" },
        {
          kind: "pitfalls",
          items: [
            "Measuring the annulus on a single-oblique or coronal view: the plane misses a hinge point and the size is wrong.",
            "Reading a coronary height without the leaflet length and sinus width beside it.",
            "Giving a beta-blocker or nitrate for image quality, as for a coronary CT.",
            "Measuring access on one side only, or measuring the outer wall rather than the lumen.",
            "Trusting a CT-predicted working angle without confirming it with an aortogram on the table.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you read a single number, check the phase and the plane. Every later decision, from valve size to coronary risk to the working view, inherits any error in the annular plane.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "In the TAVI lab's planning CT, define the annulus through the three hinge points, record area and perimeter and work out both derived diameters by hand, measure both coronary heights against the leaflets, then on the access CT compare each side's narrowest lumen with the sheath before choosing the route.",
        },
        { kind: "video", id: "uvgLPY2gqmQ", note: "Brilakis channel lecture: imaging for structural heart interventions (Dallas CVI 2016)." },
        { kind: "video", id: "XHdnkv7VRI4", note: "Brilakis channel lecture: pitfalls in TAVR imaging (Dallas CVI 2015)." },
        {
          kind: "keypoints",
          items: [
            "Gated root at 1 mm or thinner with at least a systolic phase, plus a non-gated scan from the subclavian to the femoral heads, on one modest contrast bolus.",
            "No nitrates or beta-blockers given for the scan in severe aortic stenosis (the patient's regular drugs are a separate matter).",
            "The annulus is a virtual ring through three nadirs, measured on a double-oblique plane: diameters, area, perimeter; derived diameters diverge in an eccentric annulus.",
            "Coronary risk is the combination of height, leaflet length and sinus width, never height alone.",
            "Measure the narrowest lumen of both access routes against the sheath's outer diameter; transfemoral first, and surgery rather than another route for an operable patient whose iliofemoral arteries rule it out.",
            "Oxford's invasive work-up adds the aortogram angle, the graded iliofemoral run and whether the iliacs straighten on a stiff wire.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-procedure",
      title: "Transfemoral TAVI step by step",
      minutes: 18,
      topics: ["sh-tavi-procedure"],
      sources: [
        O("ch 5: Aortic stenosis"),
        O("ch 4: Accessing the left heart"),
        O("ch 3: Arterial closure devices"),
        O("ch 2: The nurse"),
        O("ch 9: Temporary pacemaker"),
        B("14.4"),
        B("11.1"),
        B("29.1"),
      ],
      refs: [...BOOKS, "tamburino-tavi-complications-2020", "faurie-easy-tavi-2019", "francone-escr-tavi-imaging-2020", "esc-pacing-2021", "esc-vhd-2021", "popular-tavi-a-2020"],
      blocks: [
        {
          kind: "p",
          text: "The Academy lessons sh-tavi-setup, sh-tavi-deploy and sh-tavi-assess describe the set-up, the deployment views, rapid pacing and implant depth. This lesson goes through the procedure in order with the practical detail the sources give: where it is done, how the large-bore artery is entered and later closed, how to cross the stenotic valve, how to choose a pacing method, and what to check before the patient leaves the room. Neither manual teaches TAVI as such; where Brilakis's large-bore technique for a microaxial pump is used, that is said.",
        },
        { kind: "h", text: "Before the first puncture" },
        {
          kind: "list",
          items: [
            "**The room.** Ina Tamburino and colleagues describe TAVI as usually done in a standard catheter laboratory, with a hybrid theatre needed for transapical, direct aortic or trans-subclavian routes or a surgical femoral cut-down. A cardiac surgeon need not be in the room, provided one is ready to come for a life-threatening complication.",
            "**Anaesthesia.** Local anaesthesia in the groin, with or without conscious sedation, needs fewer inotropes and vasopressors and gives shorter procedures, shorter stays and earlier mobilisation than general anaesthesia with intubation, in their review.",
            "**The plan in the room.** Valve type and size, working angles, access side, coronary risk and the closure plan from the CT (previous lesson).",
          ],
        },
        { kind: "h", text: "Access and the closure plan" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Secondary access first",
              detail:
                "The contralateral artery carries the catheter used to guide the main puncture and, at the end, the check angiogram of the closure.",
            },
            {
              title: "2. Guided puncture of the main artery",
              detail:
                "Puncture under fluoroscopic guidance from the contralateral artery, so the needle does not land on the femoral bifurcation, and centrally on the front wall, which makes suture closure most effective. Brilakis's prevention advice for femoral bleeding is the same principle: meticulous technique with fluoroscopic and ultrasound guidance, and wires advanced in the iliac arteries and aorta under fluoroscopy, never pushed against resistance.",
            },
            {
              title: "3. Pre-close before you dilate",
              detail:
                "The review describes fully percutaneous access closed with suture-based devices. Brilakis's large-bore sequence for a 14 F microaxial pump shows the technique: two suture devices deployed at about 10 and 2 o'clock, their sutures left untied and secured, then serial dilators and the large sheath over a stiff wire. When a large arteriotomy is being closed, he reinserts a 0.035 inch wire through the device as it is withdrawn, to keep access to the artery. Oxford describes how a suture device works: small needles carrying suture are delivered through a sheath-based device to the puncture, deployed with a plunger, and the knot is tied before the device is withdrawn.",
            },
            {
              title: "4. A protection wire",
              detail:
                "Many centres, the review notes, park a protective wire in the superficial femoral artery on the TAVI side, so that a balloon or stent can be delivered quickly if the closure fails, sometimes avoiding surgery. The review does not say which access it is passed from; in this module's sequence it comes from the contralateral femoral access over the aortic bifurcation, the crossover route used for the bail-out in cm-access-complications-large-bore.",
            },
            {
              title: "5. Know when not to go percutaneous",
              detail:
                "If CT predicts that closure will fail (severe tortuosity or calcium of the artery, marked obesity), the review advises surgical exposure of the femoral artery instead.",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-guided-puncture" },
        { kind: "tip", id: "structural-tavi-protection-wire" },
        {
          kind: "check",
          stem: "CT shows a soft, straight left common femoral artery of good size, with its bifurcation at the level of the lower femoral head. How should the large-bore puncture be made?",
          options: [
            "By palpation at the skin crease, then pre-close after the large sheath is in",
            "Under fluoroscopy from the contralateral side, centrally on the front wall, then pre-close",
            "Through the surgical cut-down route, because closure devices fail in most TAVI patients",
            "As low as possible on the artery, near the bifurcation, so the puncture can be compressed",
          ],
          answer: 1,
          explanation:
            "Guidance from the contralateral artery keeps the needle off the bifurcation, and a central front-wall puncture gives the suture devices their best chance; the sutures are placed before the artery is dilated, as in Brilakis's large-bore sequence. Surgical exposure is reserved for arteries CT predicts will defeat closure, which this one will not. A low puncture near the bifurcation is exactly what the guidance is meant to avoid.",
        },
        { kind: "h", text: "Crossing the valve and preparing the ventricle" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Image the target",
              detail:
                "An aortogram can show where the leaflets open (Oxford's 'Prussian helmet' sign). Oxford warns that attempts to cross a severely stenotic valve frequently cause silent, and sometimes clinically apparent, cerebral emboli on MRI, so the wire is moved with control, not repeatedly jabbed.",
            },
            {
              title: "2. Catheter and wire",
              detail:
                "Oxford's choice is a 5 F AL1 with a straight-tipped hydrophilic wire. Its general sequence for a difficult valve adds a Judkins right 4 or an Amplatz left to direct the wire, and a straight or hydrophilic wire.",
            },
            {
              title: "3. Into the ventricle and exchange",
              detail:
                "Once the wire is across, advance the catheter into the LV, remove the wire, confirm an LV trace, and exchange over an exchange-length J wire for a pigtail. The stiff valve-delivery wire is then placed through it (sh-tavi-setup).",
            },
            {
              title: "4. If a pigtail will not follow",
              detail:
                "For a microaxial pump, Brilakis notes that aortic stenosis can stop a pigtail advancing through the valve: a 0.035 inch J wire inside stiffens it, and balloon dilation of the valve may be needed.",
            },
            {
              title: "5. Predilatation only for a reason",
              detail:
                "The review argues for avoiding balloon valvuloplasty before the valve where possible, because doing without it lowers the risk of severe aortic regurgitation, uses less contrast and may reduce stroke, while noting that the picture may differ with balloon-expandable valves. Selective uses are listed in sh-tavi-setup.",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-cross-valve" },
        { kind: "h", text: "Choosing how to pace" },
        {
          kind: "p",
          text: "Rapid ventricular pacing holds the heart still for balloon-expandable deployment and for any balloon dilatation; EASY TAVI, the trial below, studied balloon-expandable valves. Whether and how fast to pace for a self-expanding valve follows the device's instructions for use (sh-tavi-deploy). There are two ways to deliver rapid pacing, and the choice depends on the patient's conduction risk.",
        },
        {
          kind: "table",
          head: ["Method", "Evidence and practical points", "Best suited to"],
          rows: [
            [
              "Through the stiff LV wire",
              "In EASY TAVI (303 patients analysed, balloon-expandable valves), pacing via the LV guidewire shortened the procedure (48.4 against 55.6 minutes), fluoroscopy time and cost, with similar effective stimulation (84.9% against 87.1%) and similar 30-day major adverse events (13.9% against 17.1%).",
              "Patients without predictors of heart block; no RV pacing wire is needed for deployment (the sources do not say whether venous access should still be secured as a back-up)",
            ],
            [
              "Temporary wire in the RV",
              "Can be left in place after the procedure. The review notes it can cause RV perforation, and that it may be omitted when neither predilatation nor post-dilatation is planned. Test capture before it is needed: Oxford aims for a threshold of 1 V or lower and sets the output at least three times the threshold.",
              "Patients with heart block or its predictors, who may need pacing after the procedure",
            ],
          ],
        },
        {
          kind: "check",
          stem: "A patient with baseline right bundle branch block is having a self-expanding valve. The team prefers LV guidewire pacing because of EASY TAVI. What is the best plan?",
          options: [
            "LV guidewire pacing, because the trial showed it is quicker, cheaper and as effective",
            "An RV temporary wire, because heart block is more likely and pacing may be needed afterwards",
            "No pacing, because self-expanding valves never require pacing during their deployment",
            "LV guidewire pacing, then a permanent pacemaker on the table whatever the final ECG shows",
          ],
          answer: 1,
          explanation:
            "Right bundle branch block is on the review's list of predictors of complete heart block, as is a CoreValve/Evolut (self-expanding) implant, and the ESCR consensus notes more conduction disturbances with self-expanding valves. In that situation the review advises keeping a temporary pacemaker until it is no longer needed; an LV wire comes out at the end of the case. EASY TAVI supports LV pacing as quicker with similar efficacy, but it studied balloon-expandable valves and does not address who will need pacing afterwards. A permanent pacemaker is decided on the conduction course after TAVI, not in advance.",
        },
        { kind: "tip", id: "structural-tavi-lv-wire-pacing" },
        { kind: "h", text: "Deployment and the working view" },
        {
          kind: "p",
          text: "The CT-predicted projection, confirmed with a root injection, removes most of the trial-and-error aortograms that would otherwise cost contrast, time and radiation (ESCR consensus). Depth targets, the coplanar and cusp-overlap views and the deployment sequences for each valve family are taught in sh-tavi-deploy; follow the device's instructions for use.",
        },
        { kind: "h", text: "Finishing" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Close the large-bore artery and check it",
              detail:
                "Tie the pre-placed sutures over the wire. The review advises a contrast injection through the contralateral access to confirm haemostasis, because a leak that is not yet clinically obvious can later mean anaemia, transfusion, CT and surgical repair. If closure fails, the steps are in cm-access-complications-large-bore.",
            },
            {
              title: "2. Close the contralateral access",
              detail: "With a closure device or by compression, as for any arterial sheath.",
            },
            {
              title: "3. Decide on the temporary pacing wire",
              detail:
                "Remove it in the laboratory after a careful look at the ECG if it is not needed, to avoid later RV perforation. Leave it, with serial ECGs, for complete heart block or its predictors: right bundle branch block, left anterior hemiblock, first-degree AV block, bifascicular block, a low implant, a CoreValve/Evolut (self-expanding) implant, predilatation, or oversizing in a small annulus (review list). If it stays, Oxford's routine applies: stitch both the lead and the sheath in place, fix a loop of lead on the skin so that a tug tightens the loop rather than pulling the wire, and set the box to demand mode with the sensitivity adjusted so that every intrinsic beat is sensed; asynchronous pacing risks ventricular arrhythmia.",
            },
            {
              title: "4. Sign out",
              detail:
                "Oxford's sign-out asks the nurse to record the antiplatelet plan after a stent or other device such as a TAVI valve, its duration, and whether a loading dose has been given in the laboratory or is still due on the ward. Oxford's wording speaks of dual therapy, but that predates the trial evidence: the 2021 ESC/EACTS guideline text reports more major or life-threatening bleeding with dual antiplatelet therapy than with aspirin alone in a meta-analysis, and in POPular TAVI cohort A aspirin alone caused less bleeding than aspirin plus clopidogrel for 3 months (15.1% against 26.6% at a year). Without another indication the current regimen after TAVI is single antiplatelet therapy, with combination therapy only when a coronary stent or other indication requires it (sh-tavi-assess).",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-pacing-wire-decision" },
        { kind: "h", text: "The first 24 hours" },
        {
          kind: "list",
          items: [
            "**Monitor** fluid balance, ECG, haemoglobin and renal function; the review treats a fall in haemoglobin of 10–20 g/L (1–2 g/dL) as expected after TAVI.",
            "**Hydrate and judge filling by echo.** The review hydrates with saline to help clear the contrast (continuing a forced-diuresis device for 6–12 hours if one was used) and uses echo, for example the inferior vena cava and the estimated pulmonary pressure, to judge filling, since the fluid balance tends to run positive.",
            "**Watch the kidneys.** It defines contrast nephropathy as a creatinine rise from baseline of 25% or more, or of about 44 µmol/L (0.5 mg/dL), within 72 hours, and asks for daily renal function. This is the review's definition; other definitions exist.",
            "**Mobilise early** unless there is haemodynamic instability, a vascular complication, poor urine output, or a significant change in haemoglobin, renal function or neurology.",
            "**Conduction.** In the review, a third of permanent pacemakers were implanted in the first 24 hours and half within 48 hours; new left bundle branch block on its own, without pre-existing right bundle branch block, was not a reason to keep the patient in. The 2021 ESC pacing guideline, as taught in sh-tavi-pvl-conduction, is more cautious when the new left bundle branch block is broad (QRS over 150 ms) or the PR exceeds 240 ms and does not progress over 48 hours: ambulatory ECG monitoring or an electrophysiology study should then be considered. The pacing indications are in that lesson.",
            "**Early discharge** within 24–72 hours is possible in selected patients; without new conduction disorders, 24 hours of monitoring may be enough.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing by landmarks and landing on the bifurcation, where suture closure is unreliable.",
            "Dilating the artery before the sutures are in place.",
            "Repeated forceful attempts at the valve: crossing a stenotic valve is itself a source of cerebral emboli.",
            "Planning LV wire pacing for a patient with right bundle branch block, then losing pacing when the wire comes out.",
            "Calling the closure secure without a contralateral check angiogram.",
            "Leaving a temporary wire in by default, with its risk of RV perforation, when the ECG does not need it.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide the pacing route at the planning meeting from the baseline ECG and the valve, not on the table: the patient with conduction disease needs a wire that can stay; everyone else may be paced through the LV wire. The sources do not address a venous back-up, so agree in advance how a temporary wire would be placed quickly if unexpected block appeared.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "Run a full transfemoral TAVI: on the access step choose transfemoral only after checking both iliac lumens against the sheath; on deployment use rapid pacing and keep the valve at the planned depth; at the end, state aloud where the protection wire is, how you will check the closure, and whether the temporary wire stays.",
        },
        { kind: "video", id: "89RNFRwjSo4", note: "Brilakis channel debate: balloon-expandable against self-expanding TAVR (Dallas CVI 2016)." },
        { kind: "video", id: "W82t2ugGWc4", note: "Brilakis channel lecture: TAVR in 2015 (Dallas CVI)." },
        {
          kind: "keypoints",
          items: [
            "Usually a standard catheter laboratory, local anaesthesia with or without sedation, a surgeon available rather than present.",
            "Main puncture under fluoroscopic guidance from the opposite side, centrally on the front wall; pre-close before dilating; a protection wire in the TAVI-side superficial femoral artery, passed in this sequence by crossover from the opposite side.",
            "Surgical exposure when CT predicts closure failure.",
            "Cross the valve with control: AL1 and a straight hydrophilic wire, then exchange for a pigtail.",
            "LV wire pacing is quicker with similar efficacy (EASY TAVI, balloon-expandable valves); use an RV wire that can stay, tested and secured, when heart block or its predictors are present.",
            "Check the closure with a contralateral injection; remove the temporary wire unless conduction disease or its predictors are present.",
            "First 24 hours: fluid balance, ECG, haemoglobin and kidneys; early mobilisation and selective early discharge.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-coronary",
      title: "Coronary obstruction, and coming back to the coronaries later",
      minutes: 16,
      topics: ["sh-tavi-complications"],
      sources: [B("24.1"), B("29.1"), O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
      refs: [...BR, "ribeiro-coronary-obstruction-2013", "lederman-coronary-obstruction-2019", "francone-escr-tavi-imaging-2020", "esc-vhd-2025"],
      blocks: [
        {
          kind: "p",
          text: "Coronary obstruction happens when the new valve pushes the old leaflets outwards over a coronary ostium, or seals the sinus at the sinotubular junction. It is uncommon and often fatal. The Academy lesson sh-tavi-coronary lists the risk factors and the protection strategies; this lesson adds the registry data, the mechanisms that decide which strategy can work, why stenting is a poor answer, how leaflet laceration works, and then the late problem Brilakis's section 24.1 is about: getting back into the coronaries after a TAVI.",
        },
        { kind: "h", text: "What the registry showed" },
        {
          kind: "list",
          items: [
            "**Rare.** In Ribeiro's multicentre registry, 44 of 6,688 TAVI patients (0.66%) had symptomatic obstruction. The ESCR consensus quotes 0.8%, and 3.5% for valve-in-valve, usually during the procedure but reported up to 24 hours later.",
            "**Who.** Older age, female sex, no previous bypass grafting, a balloon-expandable valve and a previous surgical bioprosthesis were associated with obstruction. The left coronary was involved in 88.6%.",
            "**Anatomy.** Pre-TAVI CT was available in only 28 of the obstruction patients (and 345 controls); in them, the left coronary ostium was lower (mean 10.6 against 13.4 mm) and the sinus narrower (28.1 against 31.9 mm), and both differences held in a 1:1 matched comparison.",
            "**How it presents.** Persistent severe hypotension in 68.2% and ECG changes in 56.8%.",
            "**Outcome.** PCI was attempted in 75% and was successful in 81.8%, yet 30-day mortality was 40.9%, and cumulative mortality reached 45.5% at a median of 12 months (with no stent thrombosis or reintervention).",
          ],
        },
        {
          kind: "check",
          stem: "A balloon-expandable valve has just been deployed in a woman with no previous bypass surgery. Pacing has stopped, but the pressure stays at 70/40 mmHg and new ST depression appears. The pigtail is still in the root. What is the most likely diagnosis to exclude first, and how?",
          options: [
            "Slow recovery from rapid pacing: give a vasopressor and wait several minutes before imaging",
            "Coronary obstruction: inject the root at once to see whether both coronaries fill",
            "Vasovagal reaction: give atropine and fluid, and repeat the blood pressure in two minutes",
            "Annular rupture: start pericardiocentesis before any further imaging of the root",
          ],
          answer: 1,
          explanation:
            "Persistent hypotension and ECG changes were the commonest presentations of obstruction in Ribeiro's registry, and this patient has three of its associated features (female sex, no bypass grafts, a balloon-expandable valve). The pigtail is already in the root, so a root injection answers the question in seconds. Waiting for 'pacing recovery' loses time while the left main may be occluded. Rupture is part of the differential, but nothing here points to an effusion, and echo, not blind drainage, would show it. If both coronaries fill, the next suspect is bleeding: Brilakis asks for a retroperitoneal bleed to be considered in any hypotensive patient after femoral access.",
        },
        { kind: "tip", id: "structural-tavi-hypotension-coronary" },
        { kind: "h", text: "Two mechanisms, and why the difference matters" },
        {
          kind: "table",
          head: ["Mechanism", "Anatomy", "What prevents it"],
          rows: [
            [
              "Direct obstruction (deficient sinus)",
              "The displaced leaflet lies against the ostium because there is no room in the sinus; the virtual valve-to-coronary distance is small. Lederman and colleagues regard this as the higher-risk form.",
              "A leaflet laceration must line up exactly with the ostium, and the new valve's skirt and commissural posts can still block it.",
            ],
            [
              "Sinus sequestration",
              "The displaced leaflets meet the wall at a low, narrow sinotubular junction and seal the whole sinus off, even though the ostium itself is clear.",
              "A laceration almost anywhere along the leaflet lets blood back into the sinus and so into the coronary.",
            ],
          ],
        },
        { kind: "h", text: "Why stenting is a poor answer" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Surgery is the standard alternative",
              detail:
                "Lederman and colleagues name careful CT selection as the main way to avoid obstruction, and surgical valve replacement as the standard treatment for the patient at risk, where surgery is feasible.",
            },
            {
              title: "2. Pre-positioned protection has costs",
              detail:
                "A wire, catheter or stent placed in the at-risk artery is pinned between the new valve and the root. A stent waiting in the artery can be caught between the frame and the wall, and may then have to be deployed whether or not it is needed.",
            },
            {
              title: "3. Rescue may be impossible",
              detail:
                "Once the leaflet is pinned over the ostium, rescue PCI often fails because the leaflet cannot be crossed.",
            },
            {
              title: "4. Chimney stents do badly later",
              detail:
                "A stent running up between the valve frame and the aortic wall ('snorkel' or 'chimney') is squeezed with every beat, and the authors report that many become deformed or thrombose, with serious ischaemia as the result.",
            },
            {
              title: "5. Recapturable valves do not remove the risk",
              detail: "Delayed obstruction has been reported with repositionable and retrievable valves, and emergency surgery for early or delayed obstruction carries a high mortality.",
            },
          ],
        },
        {
          kind: "check",
          stem: "In a high-risk root, the team proposes routine left main protection: a wire in the LAD and an undeployed stent in the left main during valve deployment, 'so that nothing can go wrong'. What is the most accurate counter-argument?",
          options: [
            "Protection is never used, because the wire would be crushed by the valve frame",
            "The stent may be trapped and have to be deployed, and chimney stents deform and thrombose",
            "Protection is unnecessary, because obstruction does not occur with modern valves",
            "Protection only works if the stent is fully deployed before the valve is positioned",
          ],
          answer: 1,
          explanation:
            "Lederman and colleagues point out that any protection tool ends up pinned between valve and root, that a waiting stent can be caught and then has to be deployed whether needed or not, and that chimney stents often deform or thrombose with serious ischaemia. Protection is a recognised option, so 'never used' is wrong, and obstruction still occurs (0.66% in Ribeiro's registry, more in valve-in-valve). In a patient who can have surgery, surgery is the standard alternative for a high-risk root.",
        },
        { kind: "tip", id: "structural-tavi-snorkel-limits" },
        { kind: "h", text: "Leaflet laceration (BASILICA) in outline" },
        {
          kind: "p",
          text: "BASILICA splits the native or bioprosthetic leaflet from base to tip, along its midline, using an electrified wire, so that the halves splay apart after the new valve is implanted and blood still reaches the coronary. In the authors' investigational study it succeeded in 28 of 30 subjects (35 of 37 leaflets) with no coronary obstruction, but with 1 definite and 2 possible strokes (3.3% to 10%). They describe CT prediction of obstruction as sensitive but not specific, and call BASILICA a complex technique that some argue should stay in specialist centres. It may fail in TAV-in-TAV, where the split leaflets can stay trapped by the first frame. Because the stroke rate may be higher than in recent TAVI and cerebral protection trials, the authors suggest at least considering cerebral protection before every BASILICA case, and want the patient to share the decision knowing the alternatives (surgery among them), the possibly much higher stroke risk and the local expertise. For a patient who cannot have surgery, they note that expectant or palliative management is common. A fellow does not perform BASILICA, but should recognise the patient who may need it and refer early.",
        },
        { kind: "h", text: "Coming back to the coronaries (Brilakis 24.1)" },
        {
          kind: "list",
          items: [
            "**Plan from the valve.** Engagement is often difficult, especially with self-expanding valves whose frames extend above the ostia. CT can map the frame against the ostia but cannot be done in an emergency, adds contrast, and may not show where the commissural posts lie. Femoral access may be preferred.",
            "**Technique.** Engage with great care, coaxially, never deep; wiring the artery first can make engagement possible. The catheter choices, the diamond to cross and how to avoid entrapment are taught step by step in cp-complex-patients-tavr-after.",
            "**Physiology.** FFR falls significantly after TAVI because hyperaemic flow rises, whereas iFR does not change; before the valve is treated, then, FFR can make a stenosis look milder than it is, and Brilakis advises caution with it (pm-physiology).",
            "**What the 2025 guideline adds.** Its discussion of PCI and TAVI stresses optimised implantation technique and commissural alignment, so that later coronary access stays possible.",
          ],
        },
        { kind: "tip", id: "diag-tavr-left-catheter" },
        {
          kind: "pitfalls",
          items: [
            "Reading persistent hypotension after deployment as slow recovery from pacing.",
            "Treating coronary protection as free insurance: pre-positioned stents are trapped and chimney stents fail late.",
            "Assuming a recapturable valve cannot cause delayed obstruction.",
            "Planning TAVI in a high-risk root without offering surgery, or an expert centre, to a patient who could have them.",
            "Using FFR before TAVI as if aortic stenosis did not change it.",
          ],
        },
        {
          kind: "pearl",
          text: "Before deployment, say out loud which coronary is at risk and what the plan is if it does not fill: who injects the root, who opens the PCI kit, who calls the surgeon. Obstruction kills through delay.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "In the planning step, read the coronary heights (one of the outputs Oxford lists for the TAVI CT) against the leaflets and sinus widths and decide whether coronary protection is justified or whether the patient should be discussed for surgery; at the assess step, explain how you would recognise obstruction and in what order you would act.",
        },
        { kind: "video", id: "XHdnkv7VRI4", note: "Brilakis channel lecture: pitfalls in TAVR imaging (Dallas CVI 2015)." },
        { kind: "video", id: "RdCVVwa1Q1s", note: "Brilakis case 163: PCI through a self-expanding valve (Manual of PCI case)." },
        {
          kind: "keypoints",
          items: [
            "Symptomatic obstruction: 0.66% in Ribeiro's registry, mostly the left coronary; women, no prior bypass grafts, balloon-expandable valves and previous surgical valves are over-represented.",
            "It presents as persistent hypotension and ECG change; 30-day mortality was 40.9% despite usually successful PCI.",
            "Direct (deficient sinus) obstruction is harder to prevent than sinus sequestration.",
            "Pre-positioned stents get trapped, rescue PCI may fail and chimney stents deform and thrombose; surgery is the standard alternative.",
            "BASILICA splits the leaflet so coronary flow is preserved; it is specialised, carries stroke risk and may fail in TAV-in-TAV.",
            "Later angiography: coaxial, not deep, wire first if needed; femoral access may be preferred; FFR may underestimate stenoses in severe aortic stenosis, so use it with caution.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-vascular-stroke",
      title: "Vascular injury, stroke, conduction and paravalvular regurgitation",
      minutes: 15,
      topics: ["sh-tavi-complications"],
      sources: [B("29.1"), B("14.4"), B("11.1"), O("ch 10: Limb ischaemia"), O("ch 5: Aortic regurgitation")],
      refs: [
        ...BOOKS,
        "francone-escr-tavi-imaging-2020",
        "tamburino-tavi-complications-2020",
        "protected-tavr-2022",
        "protect-tavi-2025",
        "genereux-varc3-2021",
        "papadopoulos-pvl-closure-2026",
      ],
      blocks: [
        {
          kind: "p",
          text: "Most TAVI complications are now uncommon, but each has a moment in the procedure when it is made more or less likely. This lesson covers the four that dominate the conversation after a TAVI: the access artery, stroke, the conduction system and paravalvular regurgitation. The full bail-out for large-bore bleeding and closure failure is in cm-access-complications-large-bore, and the sudden-hypotension checklist in sh-tavi-catastrophes.",
        },
        { kind: "h", text: "The access artery" },
        {
          kind: "list",
          items: [
            "**Size drives risk.** The ESCR consensus quotes vascular complication rates of 23–31% with the old 22–24 F systems and 1.9–13.3% with smaller ones. Brilakis lists a large sheath, and an occlusive sheath in a small or diseased artery, among the causes of limb ischaemia.",
            "**Suspect bleeding in every hypotensive patient.** Brilakis's rule for femoral procedures: think retroperitoneal haematoma in anyone who becomes hypotensive during or after the case. If contrast has been given, screening the bladder may show it displaced (the 'dented bladder' sign).",
            "**Recognise it.** The usual signs are hypotension, sweating and lower abdominal or back pain, often with bradycardia and tenderness over the abdomen or above the pubis. Most retroperitoneal bleeds appear within 3 hours of the procedure, and a closure device does not exclude one. Be more suspicious after obesity, uncontrolled hypertension, a high puncture or one not guided by ultrasound or fluoroscopy, and several puncture attempts (Brilakis).",
            "**Find it from the other side.** Still in the lab: angiography through the contralateral access to locate the bleeding.",
            "**Stop it, then fix it.** Inflate a balloon at low pressure over the site first; if prolonged inflation fails, a covered stent seals a large-vessel tear, although covered stents can be hard to deliver (in the common femoral artery self-expanding stents resist flexion better); a small branch is coiled after retrograde filling has been excluded; for a very distal small-vessel bleed that coils cannot reach, microspheres, glue or thrombin are options, as are a balloon or covered stent across the branch origin; surgery if these fail or the tear involves the femoral bifurcation.",
            "**General measures alongside.** Large-bore venous access, saline, cross-matched blood, haemoglobin (a normal value does not exclude acute bleeding, which often does not lower it at once), reversal of anticoagulation once the diagnosis is made, and pressure over the site if there is a groin haematoma.",
          ],
        },
        {
          kind: "check",
          stem: "Ten minutes after the large-bore sheath is removed and the sutures are tied, the patient becomes hypotensive and complains of back pain. The groin looks normal. The contralateral sheath is still in. What is the next step?",
          options: [
            "Transfer to CT for an abdominal scan, keeping the contralateral sheath in place",
            "Angiography through the contralateral sheath, ready to inflate a balloon over any leak",
            "Firm manual compression of the access groin for 20 minutes, then reassess",
            "Remove the contralateral sheath so that only one artery is left at risk",
          ],
          answer: 1,
          explanation:
            "Brilakis's algorithm for suspected retroperitoneal bleeding in a patient still in the laboratory is contralateral access and angiography to find the source, then a low-pressure balloon over the site before a covered stent, coils or surgery. CT is the route for a stable patient who has left the lab, not an unstable one still on the table. A normal-looking groin does not exclude a bleed above the inguinal ligament, which compression cannot reach. Removing the contralateral sheath throws away the route to the fix.",
        },
        { kind: "h", text: "The ischaemic leg" },
        {
          kind: "list",
          items: [
            "**Prevent it.** Brilakis lists the smallest possible sheath, fluoroscopic or ultrasound guidance of the puncture and soft guidewires among the preventive steps. In his large-bore sequence, femoral angiography before the large sheath confirms that the artery is big enough, and a second angiogram after insertion checks that the sheath is not making the leg ischaemic.",
            "**Know the closure risk.** Oxford warns that suture devices can narrow the artery through an overtightened knot, especially when more than one is used to close a large hole, and that plug devices can create a new stenosis in a small or diseased femoral artery.",
            "**Watch the leg.** Oxford asks the nurses to check the limb regularly for a pale or cyanotic colour, coldness, weak or absent pulses, pain and loss of movement or sensation; Brilakis describes acute limb ischaemia by the six Ps (pain, pallor, paralysis, pulse deficit, paraesthesia, poikilothermia).",
            "**Treat it.** Brilakis: contralateral femoral access and angiography to find the cause, then treatment from inside the artery (balloon dilatation, catheter thrombectomy or thrombolysis), with surgery (thrombectomy, endarterectomy or a bypass graft) when that fails. Oxford stresses early involvement of the vascular surgeons and Doppler ultrasound or CT to confirm the diagnosis outside the lab.",
          ],
        },
        { kind: "tip", id: "access-cx-iliofemoral-balloon-first" },
        { kind: "tip", id: "mcs-cx-crossover-balloon-before-removal" },
        { kind: "h", text: "Stroke and cerebral embolic protection" },
        {
          kind: "table",
          head: ["Trial", "Patients", "Stroke at 72 hours or discharge", "Disabling stroke"],
          rows: [
            ["PROTECTED TAVR (2022)", "3,000 transfemoral TAVR, randomised 1:1; device deployed in 94.4% of attempts", "2.3% with protection against 2.9% without (P = 0.30)", "0.5% against 1.3%"],
            ["BHF PROTECT-TAVI (2025)", "7,635 TAVI in 33 UK centres, randomised 1:1", "2.1% against 2.2% (P = 0.94)", "1.2% against 1.4%"],
          ],
        },
        {
          kind: "p",
          text: "Neither trial showed that routine protection lowers stroke within 72 hours. The PROTECTED TAVR authors noted that their confidence interval could not rule out a benefit; the larger UK trial found no difference. What the sources do support is reducing the embolic load you create: Oxford's warning that attempts to cross a stenotic valve frequently cause cerebral emboli on MRI, and the review's argument that avoiding predilatation may reduce stroke risk. Protection is also not free: in BHF PROTECT-TAVI, serious adverse events occurred in 0.6% of patients with the device against 0.3% without, and PROTECTED TAVR recorded one vascular complication at the device's access site (0.1%).",
        },
        {
          kind: "check",
          stem: "A colleague argues that cerebral protection should be routine because disabling stroke was lower with it in PROTECTED TAVR (0.5% against 1.3%). What is the most accurate reply?",
          options: [
            "Correct: disabling stroke was the primary endpoint and was significantly reduced",
            "Disabling stroke was not the primary endpoint, and the larger UK trial found no benefit",
            "The UK trial confirmed a significant reduction in disabling stroke with protection",
            "Protection increased stroke in both trials because of manipulation in the arch",
          ],
          answer: 1,
          explanation:
            "The primary endpoint in both trials was any stroke within 72 hours or before discharge, and neither found a significant reduction (2.3% against 2.9%; 2.1% against 2.2%). The disabling stroke figures are secondary; in BHF PROTECT-TAVI they were 1.2% against 1.4%. Neither trial showed that protection increased stroke.",
        },
        { kind: "h", text: "Conduction" },
        {
          kind: "list",
          items: [
            "**Predictors of complete heart block** (review list): right bundle branch block, left anterior hemiblock, first-degree AV block, bifascicular block, a low implant, a CoreValve/Evolut (self-expanding) implant, predilatation and oversizing in a small annulus. Separately, the ESCR consensus notes more conduction disturbances with self-expanding valves in general, and a higher pacemaker rate with bicuspid valves.",
            "**Timing.** Left bundle branch block and complete heart block are the disturbances that most often lead to a pacemaker; in the review a third were implanted within 24 hours and half within 48.",
            "**What to do.** The temporary wire stays in patients with block or its predictors; the 2021 ESC pacing recommendations are taught in sh-tavi-pvl-conduction.",
          ],
        },
        { kind: "h", text: "Paravalvular regurgitation after TAVI" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Know the mechanism",
              detail:
                "After TAVI the leak is not a dehiscence but incomplete sealing between frame and annulus: an eccentric annulus, bulky or asymmetric calcium in the landing zone, an implant too high or too deep, or an underexpanded frame. Jets are often several, eccentric and irregular, following channels along calcium (Papadopoulos and colleagues).",
            },
            {
              title: "2. Grade it with more than one look",
              detail:
                "Root aortography is quick but operator dependent and agrees only modestly with echo. Oxford grades aortographic regurgitation from I to IV by how densely, and for how long, the LV opacifies compared with the aorta (grade I clears with each beat; grade IV is denser than the aorta and often persists over the following beats), and notes that the grade depends on LV function as well as on the regurgitant volume. Papadopoulos and colleagues note that VARC-3, like the PVL Academic Research Consortium, recommends a more granular five-class grading of paravalvular regurgitation. When echo and angiography disagree, cardiac MR regurgitant fraction is an option: in the multicentre study the review cites, none or trace was under 15%, mild 16–29% and moderate or severe 30% or more.",
            },
            {
              title: "3. Treat the cause first",
              detail:
                "Before any plug closure of a post-TAVI leak, exclude underexpansion, malposition and a mainly transvalvular leak, which need a different answer (sh-tavi-assess). Moderate or severe regurgitation after TAVI has been repeatedly linked to higher mortality, so it is worth the effort.",
            },
          ],
        },
        { kind: "tip", id: "structural-tavi-pvr-mechanism" },
        {
          kind: "pitfalls",
          items: [
            "Attributing hypotension after sheath removal to the anaesthetic or the valve, and missing an iliac bleed above the reach of groin pressure.",
            "Sending an unstable patient to CT instead of injecting through the contralateral sheath.",
            "Quoting a secondary endpoint as proof that routine cerebral protection works.",
            "Grading a leak on a single aortogram, or plugging it before excluding underexpansion and malposition.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep the contralateral sheath until the large-bore artery is confirmed dry on angiography: it is your diagnostic route, your balloon route and your stent route.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "At the assess step, grade the paravalvular regurgitation and name its most likely mechanism before choosing a correction; then, before finishing, describe the closure check and what you would do if it showed extravasation.",
        },
        { kind: "video", id: "W82t2ugGWc4", note: "Brilakis channel lecture: TAVR in 2015 (Dallas CVI)." },
        {
          kind: "keypoints",
          items: [
            "Bigger sheaths in smaller arteries mean more bleeding and limb ischaemia.",
            "Hypotension during or after a femoral procedure is bleeding until proved otherwise: contralateral angiography, low-pressure balloon, then covered stent, coils or surgery.",
            "Routine cerebral protection did not reduce stroke at 72 hours in PROTECTED TAVR or BHF PROTECT-TAVI.",
            "Right bundle branch block, a low implant, a CoreValve/Evolut implant, predilatation and small-annulus oversizing predict heart block; half of pacemakers are implanted within 48 hours.",
            "Prevent limb ischaemia with the smallest sheath and angiography before and after it; watch the leg, and treat ischaemia from the contralateral side first.",
            "Post-TAVI paravalvular regurgitation comes from sealing failure; grade it with more than angiography and correct the mechanism before any plug.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-viv",
      title: "Valve-in-valve and redo TAVI",
      minutes: 14,
      topics: ["sh-tavi-complications"],
      sources: [O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
      refs: [...OX, "esc-vhd-2021", "esc-vhd-2025", "dvir-vivid-2014", "francone-escr-tavi-imaging-2020", "lederman-coronary-obstruction-2019", "allen-bvf-guide-2021"],
      blocks: [
        {
          kind: "p",
          text: "More patients now outlive a bioprosthesis, surgical or transcatheter, and the second procedure is usually a valve inside the first. The 2021 ESC/EACTS guideline calls transcatheter valve-in-valve implantation an option for treating degenerated bioprostheses in patients at increased surgical risk, and redo TAVI safe and feasible in selected patients, with the risks of patient–prosthesis mismatch in small valves and of coronary obstruction. The Academy lesson sh-viv lists the surgical valve features that matter; this lesson works through the planning in order and adds the outcome data. Version note: the points attributed to the 2021 guideline come from its section 11.4; the 2025 update (section 14.4) supersedes it, and that section could not be read, so check it before quoting them.",
        },
        { kind: "h", text: "Before planning: is this structural deterioration?" },
        {
          kind: "list",
          items: [
            "**Exclude the reversible causes first.** The 2021 guideline asks for endocarditis and valve thrombosis to be excluded before calling a failing bioprosthesis structural deterioration.",
            "**Do not balloon a stenotic left-sided bioprosthesis.** The guideline advises avoiding percutaneous balloon interventions for these valves.",
            "**Follow-up catches it early.** The 2025 guideline recommends an early echo within the first weeks after valve replacement as a baseline, and yearly clinical and echo review for every patient with a bioprosthesis.",
          ],
        },
        { kind: "h", text: "What the registry teaches about small and stenotic valves" },
        {
          kind: "p",
          text: "In the international valve-in-valve registry (459 patients, 55 centres), failure was by stenosis in 39.4%, regurgitation in 30.3% and both in 30.3%. Within a month 7.6% had died and 1.7% had a major stroke; one-year survival was 83.2%. Survival was worse with small surgical valves (label size 21 mm or less: 74.8% against 93.3% for large valves) and with stenosis as the failure mode (76.6% against 91.2% for regurgitation). Both were associated with death within a year (hazard ratios 2.04 and 3.07).",
        },
        {
          kind: "check",
          stem: "Which of these patients has both of the features the registry associated with lower one-year survival after aortic valve-in-valve?",
          options: [
            "A failed 27 mm surgical valve with predominant regurgitation",
            "A failed 19 mm surgical valve with predominant stenosis",
            "A failed 25 mm surgical valve with mixed stenosis and regurgitation",
            "A failed 23 mm surgical valve with predominant regurgitation",
          ],
          answer: 1,
          explanation:
            "Small surgical valves (21 mm or less) and stenosis as the failure mode were each associated with death within a year; only the 19 mm stenotic valve has both. Large valves and regurgitation did better (93.3% survival for large valves, 91.2% for regurgitation). This is why a small stenotic valve needs a plan for the residual gradient before you start.",
        },
        { kind: "h", text: "Planning a valve-in-valve, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Identify the surgical valve",
              detail:
                "Its size limits the largest transcatheter valve that can be implanted. Usually it is in the operation note; if not, the ESCR consensus says type and size can be deduced from its CT appearance and standard measurements.",
            },
            {
              title: "2. Know how its leaflets behave",
              detail:
                "Lederman and colleagues: pig-valve leaflets usually shrink back towards the annulus during the second implant, moving away from the ostia, while pericardial and native leaflets keep their length. A bulky surgical frame may shield the ostia, unless the leaflets are mounted outside it to enlarge the opening. Surgical struts can sit in front of an ostium, particularly when the surgical valve was put in for a failed bicuspid valve, where the two coronaries arise opposite each other.",
            },
            {
              title: "3. Simulate the new valve on CT",
              detail:
                "The planning CT supplies what it does for a native TAVI (Oxford lists the annulus, the root and sinotubular junction and the coronary heights among its outputs). For valve-in-valve the consensus calls a simulated implantation mandatory: a virtual cylinder the size of the new valve is placed in the surgical frame and the distance from it to each coronary ostium (the VTC) is measured. Lederman and colleagues regard a VTC below 3–4 mm as high risk, a threshold drawn from valve-in-valve outcomes whose value in native TAVI is less clear. Two cautions go with it. The ESCR consensus says no safe minimum distance has been established or tested in large series, only that several millimetres are needed. And the VTC ignores leaflet thickness and is measured in systole, when the root is larger than during diastolic coronary filling, so the true distance is probably smaller than the number on the screen.",
            },
            {
              title: "4. Account for the new valve's shape",
              detail:
                "Lederman and colleagues describe the self-expanding Evolut as narrowing at its waist (narrower still in place than on the bench) and the balloon-expanded SAPIEN 3 as flaring outwards in a surgical frame, which raises obstruction risk, especially after ring fracture. They choose the virtual valve's diameter with this in mind, and say they have little experience with other designs.",
            },
            {
              title: "5. Know the two routes to obstruction",
              detail:
                "The 2025 guideline explains that a valve-in-valve pins the old leaflets open as a covered tube, a neo-skirt. That tube can block an ostium directly when the sinuses are shallow, or seal off the sinus when the ascending aorta is narrow and the neo-skirt reaches the sinotubular junction. Inside a surgical valve (TAV-in-SAV) the risk of obstruction is particularly high with a stentless valve or a stented one whose leaflets are mounted outside the frame, and its list of bioprosthesis points advises against such valves when a future TAV-in-SAV could obstruct the coronaries. Inside a transcatheter valve (TAV-in-TAV) the guideline singles out sinus sequestration, particularly when the first valve is supra-annular with a high neo-skirt.",
            },
            {
              title: "6. Plan for the gradient",
              detail:
                "Valve-in-valve often leaves the new valve underexpanded and can cause patient–prosthesis mismatch, especially in small surgical valves. Bioprosthetic valve fracture (cracking the ring) or remodelling (stretching it) with a high-pressure inflation of a non-compliant balloon lets the transcatheter valve expand and lowers the residual gradient (Allen and colleagues). It depends on the surgical valve's ring; sh-viv warns against trying to fracture a ring not designed to break.",
            },
          ],
        },
        {
          kind: "check",
          stem: "CT before valve-in-valve in a 21 mm stented surgical valve with leaflets mounted outside the frame shows a virtual valve-to-coronary distance of 2.5 mm for the left main. The patient has no bypass grafts. What does this mean?",
          options: [
            "Low risk, because the surgical frame always protects the ostia from the leaflets",
            "High risk of obstruction: discuss surgery or an expert centre for leaflet laceration",
            "High risk of paravalvular leak, so choose a valve two sizes larger than planned",
            "No conclusion is possible, because the VTC applies only to native-valve TAVI",
          ],
          answer: 1,
          explanation:
            "A VTC below 3–4 mm is regarded as high risk on valve-in-valve outcomes, and externally mounted leaflets remove the protection a surgical frame would otherwise give. Bypass grafts would have protected the territory, but there are none. The VTC was developed for valve-in-valve, where its value is clearest; it measures coronary risk, not leak.",
        },
        { kind: "tip", id: "structural-tavi-vtc-viv" },
        { kind: "h", text: "Redo TAVI" },
        {
          kind: "p",
          text: "TAV-in-TAV carries the same two problems with fewer escape routes: the first valve's leaflets are pinned outwards by the second, so they can sequester the sinus, and a linear laceration may not help because the split leaflets stay trapped inside the first frame (Lederman). The 2025 guideline's answer is planning for the second valve at the first procedure; it also describes surgical explant of a transcatheter valve as rare and technically demanding, with early mortality as high as 12–17%.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling a failing bioprosthesis degenerated before excluding endocarditis and thrombosis.",
            "Ballooning a stenotic left-sided bioprosthesis as a bridge.",
            "Sizing from the label without knowing the valve model, its frame and its leaflets.",
            "Skipping the virtual valve because the surgical valve is stented.",
            "Starting a small, stenotic valve-in-valve without a plan for the residual gradient.",
          ],
        },
        {
          kind: "pearl",
          text: "For every valve-in-valve, write three numbers on the plan before you scrub: the surgical valve's true size, the VTC for each coronary, and the gradient you will accept. If you cannot write all three, the plan is not finished.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "Use the TAVI planning CT as practice for the valve-in-valve questions: identify which measurements predict obstruction, and explain how you would add a virtual valve and a VTC if the patient had a surgical bioprosthesis (the lab has no valve-in-valve mode yet).",
        },
        { kind: "video", id: "89RNFRwjSo4", note: "Brilakis channel debate: balloon-expandable against self-expanding TAVR (Dallas CVI 2016)." },
        {
          kind: "keypoints",
          items: [
            "Exclude endocarditis and thrombosis first; never balloon a stenotic left-sided bioprosthesis.",
            "Small (21 mm or less) surgical valves and stenosis as the failure mode were each associated with lower survival after valve-in-valve.",
            "Identify the surgical valve and how its leaflets are mounted; simulate the new valve on CT and measure the VTC (high risk below 3–4 mm).",
            "In Lederman's experience the balloon-expanded SAPIEN 3 flares in a surgical frame and the self-expanding Evolut narrows at its waist; a VTC is probably an overestimate and has no validated safe threshold.",
            "At TAV-in-SAV, stentless or externally mounted surgical leaflets raise the obstruction risk; at TAV-in-TAV, sinus sequestration is the particular threat, especially after a supra-annular first valve with a high neo-skirt.",
            "Ring fracture or remodelling with a high-pressure non-compliant balloon can lower the residual gradient in suitable valves.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-tavi-pvl-pulmonary",
      title: "Paravalvular leak closure and pulmonary valve interventions",
      minutes: 15,
      topics: ["sh-pvl-pulmonary"],
      sources: [O("ch 5: Pulmonary valve"), O("ch 5: Pulmonary angiography")],
      refs: [
        ...OX,
        "esc-vhd-2021",
        "papadopoulos-pvl-closure-2026",
        "sorajja-pvl-2011",
        "esc-achd-2020",
        "brighenti-rvot-2026",
        "morray-coronary-compression-2013",
      ],
      blocks: [
        {
          kind: "p",
          text: "Paravalvular leak closure and pulmonary valve interventions are specialist procedures that a general fellow observes rather than performs, but the referral, the haemodynamics and the complications pass through every cath lab. The Academy lesson sh-pvl-pulmonary gives the outline; this lesson adds the decision points and the evidence. The measurements themselves (a pulmonary stenosis pullback, a pulmonary angiogram) are taught in hb-specific-conditions. Version note: the paravalvular leak recommendations below come from the 2021 ESC/EACTS guideline (section 11.4.2.2); the 2025 update supersedes it, and its prosthetic-valve section (14.4) could not be read, so check it before quoting them.",
        },
        { kind: "h", text: "Paravalvular leak: who should have it closed" },
        {
          kind: "list",
          items: [
            "**Two phenotypes.** Papadopoulos and colleagues describe heart failure, driven by the regurgitant volume, and haemolysis, driven by a narrow high-velocity jet that shears red cells; many patients have both. A leak graded only 'moderate' can still cause severe haemolysis.",
            "**Look for it.** The 2021 ESC/EACTS guideline makes blood tests for haemolysis part of routine follow-up after valve replacement, and states that diagnosing haemolytic anaemia requires TOE to detect a paravalvular leak.",
            "**Reoperate for these.** It recommends reoperation when the leak is related to endocarditis, or causes haemolysis needing repeated transfusion or severe symptoms. Papadopoulos and colleagues treat active endocarditis as a contraindication to transcatheter closure in nearly all cases (catheter treatment only exceptionally, once the infection is controlled, in a patient at prohibitive surgical risk with well-defined, stable anatomy), and a large dehiscence with a rocking prosthesis as mainly a surgical problem.",
            "**Close these.** The guideline describes transcatheter closure as feasible but with limited experience and no conclusive evidence of consistent efficacy, and says it should be considered for anatomically suitable leaks in patients chosen by the Heart Team. When closure is not possible, iron, beta-blockers and erythropoietin are the medical options for haemolytic anaemia.",
          ],
        },
        {
          kind: "check",
          stem: "Eight months after mitral valve replacement, a patient needs repeated transfusions for haemolysis. TOE shows a paravalvular leak beside a vegetation, and the prosthesis rocks. What is the right pathway?",
          options: [
            "Transcatheter closure with two plugs, because haemolysis needs complete sealing",
            "Surgical review for reoperation: endocarditis and a rocking prosthesis rule out a plug",
            "Medical therapy with iron and beta-blockers alone, as the leak is unlikely to progress",
            "Transcatheter closure after a week of antibiotics, since the vegetation will then be sterile",
          ],
          answer: 1,
          explanation:
            "The 2021 guideline recommends reoperation when the leak is related to endocarditis or causes transfusion-dependent haemolysis, and the review regards active endocarditis as a contraindication to closure and a rocking prosthesis as mainly surgical. Multiple plugs are a strategy for crescentic, haemolysis-driven leaks in suitable anatomy, not for infected dehiscence. Medical therapy is for patients in whom closure or surgery cannot be done.",
        },
        { kind: "h", text: "How a closure is planned and judged" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Map the defect",
              detail:
                "TOE, and for mitral leaks 3D TOE, with CT when the anatomy is complex. Agree before the case on the prosthesis, the leak's clock-face position, its shape (focal, crescent-shaped or with several exits), its estimated size and the structures at risk nearby.",
            },
            {
              title: "2. Choose the route by valve",
              detail:
                "Surgical aortic leaks are often focal and suited to a retrograde arterial approach; there the main hazards during the procedure are restriction of the prosthetic leaflets and compromise of a coronary, so the projections must separate the leak channel from the struts and the ostia. Mitral leaks are often crescentic and approached by transseptal or other routes, and are the most demanding (Papadopoulos).",
            },
            {
              title: "3. Match the device to the shape",
              detail:
                "Crescentic defects are rarely sealed by one round device, and two or more are often needed; dedicated oblong or rectangular devices exist. Larger-disc occluders raise the risk of interfering with the prosthetic leaflets or disc.",
            },
            {
              title: "4. Check before release",
              detail:
                "Leaflet or disc motion and the transvalvular gradient must be unaffected; any interference means recapture and a new strategy. Confirm stability before release, especially on the low-pressure right side, where embolisation is more likely.",
            },
            {
              title: "5. Judge success by the residual leak",
              detail:
                "The goal is mild or less residual regurgitation without leaflet interference, embolisation or major complications; for haemolysis, the target is elimination of the high-velocity jet, not just a lower grade.",
            },
          ],
        },
        {
          kind: "p",
          text: "Sorajja's early series (115 patients, 141 defects) set a benchmark: devices were implanted in 89% of defects, closure to 1+ or less residual regurgitation was achieved in 77% of patients, wire exteriorisation was needed in 29, and the 30-day complication rate was 8.7% (stroke 2.6%, bleeding 5.2%), with 2 devices embolising and retrieved. In the European FFPP registry summarised by Papadopoulos and colleagues (216 patients, 238 procedures), the leak was reduced to grade 2 or less in 85.0% of mitral procedures and 91.4% of aortic ones, yet clinical success at one month was 70.3% for mitral and 88.0% for aortic closures. Technical failure was the strongest independent predictor of clinical failure (odds ratio 7.7), followed by a haemolytic phenotype (3.7) and a mechanical prosthesis (3.6).",
        },
        {
          kind: "check",
          stem: "After plug closure of a crescentic mitral paravalvular leak in a patient referred for haemolysis, the residual leak is graded mild but a narrow high-velocity jet persists at one end. Disc motion is normal. What is the most appropriate next step?",
          options: [
            "Accept the result: mild residual regurgitation is the standard definition of success",
            "Consider a further device for the residual jet, as haemolysis is driven by it",
            "Remove the plug, because any residual flow means the procedure has failed",
            "Accept the result and stop the patient's anticoagulation to reduce haemolysis",
          ],
          answer: 1,
          explanation:
            "Papadopoulos and colleagues describe haemolysis as a 'micro-jet' problem: a small residual high-velocity jet can keep destroying red cells, so in the haemolysis phenotype the target is eliminating that jet, and an additional device should be considered while prosthetic function and stability are preserved. They warn that partial sealing can even raise shear stress and keep the haemolysis going. Mild residual regurgitation is an acceptable end-point in the heart failure phenotype, not necessarily here. Removing a well-placed plug is not indicated, and stopping anticoagulation for a mitral prosthesis has no basis in the sources.",
        },
        { kind: "h", text: "The pulmonary valve" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Measure it",
              detail:
                "Oxford measures pulmonary stenosis with a continuous-pressure pullback from the main pulmonary artery into the RV, and pulmonary regurgitation and pulmonary artery dilatation with a pulmonary angiogram.",
            },
            {
              title: "2. Grade it",
              detail:
                "The 2020 ESC adult congenital guideline grades right ventricular outflow obstruction on echo, by the peak Doppler gradient, as mild below 36 mmHg, moderate at 36–64 mmHg and severe above 64 mmHg, provided RV function and flow are normal, and asks for the RV pressure estimated from tricuspid regurgitation to confirm severe stenosis. It gives no invasive thresholds: catheterisation may be needed to confirm the extent, severity and level of the obstruction, and a peak-to-peak catheter gradient is a different measurement from a Doppler peak gradient.",
            },
            {
              title: "3. Balloon the suitable valve",
              detail:
                "It recommends catheter balloon valvotomy for non-dysplastic valvular stenosis (and for peripheral pulmonary stenosis), calling balloon valvuloplasty the intervention of choice when the valve is anatomically suitable. A dysplastic valve, with thick, poorly mobile cusps, is less common and usually seen in Noonan syndrome. Residual regurgitation after surgical or catheter intervention may need treatment later in life if symptoms develop.",
            },
            {
              title: "4. Replace a failed conduit or valve from below",
              detail:
                "Transcatheter pulmonary valve implantation is used mainly for stenosed or regurgitant RV-to-pulmonary artery conduits; Brighenti and colleagues describe a conduit or bioprosthesis as a cylindrical, constrained landing zone, whereas native or patched outflow tracts are often dilated and need dedicated self-expanding valves or a pre-stent. Those newer self-expanding systems carry a notable rate of early ventricular arrhythmia: 19% of patients in one registry needed treatment for it after a self-expanding valve, and about a third developed early ventricular arrhythmia with a self-expanding pre-stent. Their table of the 2020 guideline also lists a preference for catheter intervention, when anatomically feasible, in patients with no native outflow tract.",
            },
            {
              title: "5. Test for coronary compression first",
              detail:
                "Inflate a balloon in the outflow tract while imaging the coronaries. In Morray's multicentre series, 21 of 404 patients (5%) showed compression on test angioplasty, and 15 of those 21 (71%) had abnormal coronary anatomy, particularly after tetralogy of Fallot or transposition; none of the 343 patients who received a valve developed clinically apparent compression afterwards. Brighenti and colleagues add the Ross procedure to the groups at risk. The 2020 guideline lists conduit rupture and coronary compression among uncommon complications (under 2%), requires the balloon test, and notes that the test itself carries a risk of conduit rupture.",
            },
            {
              title: "6. Prepare the landing zone and plan follow-up",
              detail:
                "Pre-stenting has made stent fracture, once the commonest complication, much less of a problem. Endocarditis remains a concern, at about 2–3% a year in the guideline and 2.2–2.4 per 100 patient-years in the review, which also links a residual invasive RV-to-PA gradient above 15 mmHg to valve dysfunction and endocarditis.",
            },
          ],
        },
        { kind: "tip", id: "haemo-ps-continuous-pullback" },
        { kind: "tip", id: "haemo-pulmonary-angiography-protocol" },
        {
          kind: "check",
          stem: "A 24-year-old with repaired tetralogy of Fallot and an anomalous coronary course is being assessed for a transcatheter valve in a failing RV-to-PA conduit. What must be done before the valve is implanted?",
          options: [
            "Coronary angiography during balloon inflation in the conduit, to exclude compression",
            "A pulmonary angiogram at 30–40 mL, to measure the regurgitant fraction precisely",
            "A transseptal puncture, to measure left atrial pressure before the conduit is stented",
            "Nothing extra: coronary compression affects only native outflow tracts",
          ],
          answer: 0,
          explanation:
            "Coronary compression was seen in 5% on test angioplasty in Morray's series, and abnormal coronary anatomy, especially after tetralogy of Fallot, was the strongest association (71% of those with compression); the 2020 guideline requires the balloon test because compression can be life-threatening. The series concerned conduits, so 'native tracts only' is wrong. A pulmonary angiogram shows regurgitation and dilatation but does not test the coronaries.",
        },
        {
          kind: "pitfalls",
          items: [
            "Offering a plug to a patient whose leak comes from endocarditis or a rocking prosthesis.",
            "Judging a haemolysis-driven closure by grade alone and leaving the micro-jet.",
            "Releasing a device that touches a mechanical disc.",
            "Ballooning a dysplastic pulmonary valve as if it were a domed one.",
            "Implanting a pulmonary valve without a simultaneous balloon and coronary test.",
          ],
        },
        {
          kind: "pearl",
          text: "In paravalvular leak work, decide the success criterion with the patient's phenotype before the case: a heart failure patient may be well served by 'mild', a haemolysis patient often is not.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, record a slow pullback from the pulmonary artery into the RV, identify where the systolic pressure steps up and measure the gradient; then compare it with the echo Doppler grade (severe above 64 mmHg), say whether the two agree, and whether a valvotomy would be considered.",
        },
        { kind: "video", id: "uvgLPY2gqmQ", note: "Brilakis channel lecture: imaging for structural heart interventions (Dallas CVI 2016)." },
        {
          kind: "keypoints",
          items: [
            "Paravalvular leaks present as heart failure, haemolysis or both; screen for haemolysis after valve replacement and use TOE to find the leak.",
            "Endocarditis, transfusion-dependent haemolysis and a rocking prosthesis point to surgery; anatomically suitable leaks in Heart Team-selected patients can be closed.",
            "Crescentic leaks often need more than one device; leaflet or disc motion must be checked before release.",
            "Success is mild or less residual regurgitation; for haemolysis, the high-velocity jet must go.",
            "Pulmonary stenosis: severe above a 64 mmHg peak Doppler gradient on echo; balloon valvotomy for non-dysplastic valves.",
            "Before a transcatheter pulmonary valve: balloon test with coronary imaging (5% compression, mostly abnormal coronary anatomy); pre-stent; watch for endocarditis.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-tavi-q1",
      stem: "According to the 2025 ESC/EACTS guideline text, how does CT angiography perform for obstructive coronary disease in elderly TAVI candidates, and what follows for practice?",
      options: [
        "Sensitivity 68–73%, specificity 95–97%; a positive CT can replace invasive angiography before any PCI",
        "Sensitivity and specificity above 95%; invasive angiography is no longer used before any TAVI",
        "Sensitivity 95–97%, specificity 68–73%; a good-quality negative CT can replace invasive angiography",
        "Sensitivity 80%, specificity 80%; CT should not be used for the coronaries in TAVI candidates",
      ],
      answer: 2,
      explanation:
        "The guideline gives a high sensitivity (95–97%) but modest specificity (68–73%), mainly because of calcium and atrial fibrillation, and says omitting invasive angiography should be considered when the pre-TAVI CT is good enough to exclude relevant disease. Because specificity is modest, a positive CT may be false and does not replace angiography. The older ESCR consensus advised against routine coronary CT, which is how practice used to be.",
      difficulty: 2,
      refs: ["esc-vhd-2025", "francone-escr-tavi-imaging-2020"],
    },
    {
      id: "hb-tavi-q2",
      stem: "On a systolic double-oblique annular plane the perimeter is 78.5 mm and the area is 480 mm². Which statement is correct?",
      options: [
        "Perimeter-derived 25.0 mm and area-derived 12.4 mm; the area method gives the annular radius",
        "Perimeter-derived 25.0 mm and area-derived 24.7 mm; both assume the annulus becomes circular",
        "Perimeter-derived 12.5 mm and area-derived 24.7 mm; the perimeter must be divided by 2π",
        "Perimeter-derived 25.0 mm and area-derived 24.7 mm; the formulas apply equally to every valve",
      ],
      answer: 1,
      explanation:
        "78.5 ÷ π = 25.0 mm; 480 ÷ π = 152.8, whose square root is 12.4, doubled to 24.7 mm. The ESCR consensus points out that both formulas assume circularity after implantation, which is almost only true of balloon-expanded valves, so the derived diameters diverge in an eccentric annulus and sizing rules are device-specific. That is why the answer saying the formulas apply equally to every valve is wrong despite the right numbers.",
      difficulty: 3,
      refs: ["francone-escr-tavi-imaging-2020"],
    },
    {
      id: "hb-tavi-q3",
      stem: "In Ribeiro's registry of symptomatic coronary obstruction after TAVI, which profile was associated with obstruction?",
      options: [
        "Male sex, previous bypass grafts, a self-expanding valve and a native bicuspid aortic valve with a raphe",
        "Female sex, previous bypass grafts, a self-expanding valve and a wide sinus over 32 mm",
        "Male sex, no previous bypass grafts, a balloon-expandable valve and a left main ostium over 14 mm",
        "Female sex, no prior bypass grafts, a balloon-expandable valve, a prior surgical valve",
      ],
      answer: 3,
      explanation:
        "Older age, female sex, no previous bypass grafting, a balloon-expandable valve and a previous surgical bioprosthesis were associated with obstruction, along with a lower left coronary ostium (10.6 mm) and a narrower sinus (28.1 mm). Bypass grafts protect the territory, so their absence, not their presence, raised risk. The left coronary was involved in 88.6%.",
      difficulty: 3,
      refs: ["ribeiro-coronary-obstruction-2013"],
    },
    {
      id: "hb-tavi-q4",
      stem: "Why do Lederman and colleagues regard 'snorkel' or 'chimney' stenting as an unsatisfactory answer to coronary obstruction?",
      options: [
        "The stent cannot be delivered through a valve frame, so it can only ever be placed before the valve is implanted",
        "Chimney stents occlude the aortic valve leaflets and cause severe transvalvular regurgitation",
        "The stent is compressed against the frame each cycle, leading to deformation, thrombosis and ischaemia",
        "Chimney stents always need surgical removal within a year because they erode the aortic wall",
      ],
      answer: 2,
      explanation:
        "The authors explain that these stents are squeezed with every beat and disturbed locally, so that many deform or thrombose and cause serious ischaemia; they add that a stent waiting in the artery can be caught and then has to be deployed, and that rescue PCI may fail because the leaflet cannot be crossed. The other options describe problems the sources do not report.",
      difficulty: 2,
      refs: ["lederman-coronary-obstruction-2019"],
    },
    {
      id: "hb-tavi-q5",
      stem: "What did the EASY TAVI trial find when rapid pacing was delivered through the LV valve-delivery guidewire rather than an RV temporary wire?",
      options: [
        "Longer procedures but fewer RV perforations, with more permanent pacemakers implanted by 30 days",
        "Shorter procedures, less fluoroscopy and lower cost, with similar effective pacing and safety",
        "Less effective pacing (about 60% of attempts) and more valve embolisation at deployment",
        "No difference in time or cost, but fewer strokes and less acute kidney injury at 30 days",
      ],
      answer: 1,
      explanation:
        "In 303 analysed patients with balloon-expandable valves, LV pacing shortened the procedure (48.4 against 55.6 minutes), reduced fluoroscopy time and cost, and gave similar effective stimulation (84.9% against 87.1%) and similar 30-day major adverse events. The trial did not report the stroke, kidney or embolisation differences the distractors claim.",
      difficulty: 2,
      refs: ["faurie-easy-tavi-2019"],
    },
    {
      id: "hb-tavi-q6",
      stem: "Contralateral angiography after TAVI sheath removal shows brisk extravasation from the common femoral artery of the access side, well above the bifurcation. A low-pressure balloon over the site has not sealed it after prolonged inflation. Following Brilakis, what is the next step?",
      options: [
        "A balloon-expandable covered stent, because it is the only type suitable for the femoral artery",
        "Coil embolisation of the common femoral artery, as for a small branch perforation",
        "A self-expanding covered stent across the tear, because it resists deformation with hip flexion",
        "Thrombin injection into the tear under ultrasound, as for a femoral pseudoaneurysm",
      ],
      answer: 2,
      explanation:
        "When prolonged balloon inflation fails, a covered stent seals a large-vessel perforation; Brilakis prefers self-expanding covered stents in the common femoral artery because they resist deformation in flexion, and notes femoral stents are prone to fracture. Balloon-expandable covered stents allow more precise positioning, but Brilakis prefers self-expanding ones in the common femoral artery. Coils are for small-branch bleeding; microspheres, glue or thrombin are options only for very distal small-vessel perforation that coils cannot reach, not for a tear in the common femoral artery.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "hb-tavi-q7",
      stem: "What did the BHF PROTECT-TAVI trial (7,635 patients, 33 UK centres) find about routine cerebral embolic protection?",
      options: [
        "Stroke at 72 hours was halved with protection, from 2.9% to 1.4%, a statistically significant reduction",
        "Protection reduced disabling stroke significantly but increased access-site complications",
        "The trial stopped early because protection increased death from arch manipulation",
        "Stroke at 72 hours was 2.1% with protection and 2.2% without, a non-significant difference",
      ],
      answer: 3,
      explanation:
        "The primary outcome occurred in 2.1% and 2.2% (P = 0.94); disabling stroke was 1.2% against 1.4% and death 0.8% against 0.7%, and access-site complications were similar (8.1% against 7.7%). Routine protection did not reduce stroke within 72 hours, in line with PROTECTED TAVR.",
      difficulty: 1,
      refs: ["protect-tavi-2025", "protected-tavr-2022"],
    },
    {
      id: "hb-tavi-q8",
      stem: "In the international valve-in-valve registry (459 patients), which failed surgical valve combines both of the features associated with lower one-year survival?",
      options: [
        "A large surgical valve (25 mm or more) failing by stenosis",
        "A small surgical valve (21 mm or less) failing by stenosis",
        "A small surgical valve (21 mm or less) failing by regurgitation",
        "An intermediate surgical valve failing by mixed disease",
      ],
      answer: 1,
      explanation:
        "Small surgical valves (hazard ratio 2.04) and stenosis as the failure mode (hazard ratio 3.07) were each associated with death within a year; one-year survival was 74.8% for small valves and 76.6% for stenosis, against 93.3% for large valves and 91.2% for regurgitation. Only the small stenotic valve carries both, which is why its residual gradient must be planned for. The registry did not report outcomes for each combination separately.",
      difficulty: 3,
      refs: ["dvir-vivid-2014"],
    },
    {
      id: "hb-tavi-q9",
      stem: "A patient with a mechanical mitral valve has transfusion-dependent haemolysis from a paravalvular leak. Blood cultures are negative and TOE shows no vegetation or rocking. Surgical risk is prohibitive. According to the 2021 ESC/EACTS guideline and the review literature, what is reasonable?",
      options: [
        "Balloon dilatation of the mechanical prosthesis to reshape the sewing ring against the annulus",
        "Medical therapy only, because transcatheter closure is contraindicated with mechanical valves",
        "Transcatheter closure, with leaflet motion checked before release and a target of no high-velocity jet",
        "Transcatheter closure with a single large-disc occluder, accepting any residual jet so long as it is graded mild",
      ],
      answer: 2,
      explanation:
        "The guideline recommends reoperation for transfusion-dependent haemolysis, but here surgery is prohibitive and there is no endocarditis, and it says transcatheter closure should be considered for anatomically suitable leaks in Heart Team-selected patients. Mechanical valves make it harder (they predicted clinical failure in the FFPP registry) but not contraindicated; disc interference must be excluded before release, larger discs raise that risk, and in haemolysis the high-velocity jet must be eliminated rather than merely downgraded. These guideline points are from the 2021 ESC/EACTS guideline; the 2025 update (section 14.4) supersedes it and should be checked before quoting.",
      difficulty: 3,
      refs: ["esc-vhd-2021", "papadopoulos-pvl-closure-2026"],
    },
    {
      id: "hb-tavi-q10",
      stem: "In Morray's multicentre series of patients referred for transcatheter pulmonary valve implantation, which finding was most strongly associated with coronary compression on test balloon angioplasty?",
      options: [
        "A conduit diameter over 22 mm, present in most of those who showed compression",
        "Age over 40 years at the time of referral for pulmonary valve implantation",
        "Severe pulmonary regurgitation rather than conduit stenosis as the indication",
        "Abnormal coronary anatomy, present in 71% of those who showed compression",
      ],
      answer: 3,
      explanation:
        "Compression was seen in 21 of 404 patients (5%), and 15 of those 21 (71%) had abnormal coronary anatomy, especially after tetralogy of Fallot or transposition; the series did not identify conduit size, age or the haemodynamic lesion as the association. None of the 343 implanted patients developed clinically apparent compression afterwards; the authors call coronary angiography with simultaneous test angioplasty an important step before implantation, and compression on testing is a contraindication to implantation.",
      difficulty: 3,
      refs: ["morray-coronary-compression-2013"],
    },
    {
      id: "hb-tavi-q11",
      stem: "A 30-year-old has a domed, mobile, non-dysplastic pulmonary valve with a peak gradient of 70 mmHg, confirmed by the RV pressure estimated from tricuspid regurgitation. Following the 2020 ESC adult congenital guideline, what is the intervention of choice?",
      options: [
        "Surgical valvotomy, because the gradient is above 64 mmHg",
        "Balloon valvuloplasty, because the valve is anatomically suitable",
        "Transcatheter pulmonary valve implantation, avoiding later regurgitation",
        "Observation, because intervention is reserved for gradients above 80 mmHg",
      ],
      answer: 1,
      explanation:
        "A peak gradient above 64 mmHg is severe, and the guideline recommends balloon valvotomy for non-dysplastic valvular stenosis, calling it the intervention of choice when anatomically suitable. Surgery is the option for infundibular or sub-infundibular obstruction and a hypoplastic annulus, not a domed valve. Transcatheter valves are used mainly for failing conduits.",
      difficulty: 2,
      refs: ["esc-achd-2020"],
    },
  ],
  sims: [
    { sim: "tavi", task: "Plan from CT: define the annulus through the three hinge points, derive the area and perimeter diameters, read each coronary height against its leaflet and sinus, and compare both iliac lumens with the sheath before choosing the route." },
    { sim: "tavi", task: "Perform a transfemoral TAVI with rapid pacing at the planned depth, then at the assess step grade the paravalvular regurgitation, name its mechanism, and state your closure check and pacing-wire decision." },
    { sim: "haemo", task: "Record a pulmonary artery to RV pullback, find the systolic step and measure the gradient, then compare it with the echo Doppler grade (severe above 64 mmHg) and say whether the two agree." },
  ],
  caseIds: ["hb-tavi-case-transfemoral", "hb-tavi-case-viv"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "hb-tavi-case-transfemoral",
    title: "Transfemoral TAVI: from the planning CT to a bleed after closure",
    trackId: "cath-handbook",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook ch 5 (TAVI work-up, aortic stenosis), ch 1 (CT in TAVI), ch 2 (sign-out); Brilakis 29.1 and 14.4; ESCR CT consensus (Francone 2020); Ina Tamburino 2020 review; EASY TAVI; Papadopoulos 2026",
    },
    summary:
      "An 83-year-old woman with severe aortic stenosis and right bundle branch block comes for transfemoral TAVI. Prepare the CT, read it, choose the access side, set up the puncture and closure, choose a pacing route, assess a paravalvular jet, manage a bleed after closure and decide on the pacing wire.",
    presentation:
      "An 83-year-old woman has breathlessness on minimal exertion and two episodes of exertional presyncope. Echo shows severe high-gradient aortic stenosis with a tricuspid valve and an LVEF of 55%. She lives independently, is cognitively intact and wants treatment. The Heart Team has recommended transfemoral TAVI.",
    findings: [
      "Blood pressure 132/70 mmHg, sinus rhythm 72 beats/min",
      "ECG: right bundle branch block, PR 190 ms",
      "eGFR 48 mL/min/1.73 m²; haemoglobin 118 g/L",
      "Drugs: bisoprolol stopped by her GP for bradycardia last year; no anticoagulant",
    ],
    steps: [
      {
        id: "ct-prep",
        prompt: "In the CT department the radiographer, used to coronary CT, offers intravenous metoprolol and sublingual nitrate 'to get better pictures'. What do you say?",
        options: [
          {
            text: "No: neither drug should be given for the scan in severe aortic stenosis; use an ECG-gated or triggered root scan with padding so several phases can be reconstructed, plus a non-gated access scan, on one modest bolus",
            best: true,
            feedback:
              "The ESCR consensus regards nitrates and beta-blockers as contraindicated in severe aortic stenosis and says neither should be given before scanning; this is about doses given for image quality, not her regular medication. Padding or a wide window gives several phases to choose from, the access scan does not need gating, and one injection of about 50 mL at 3–4 mL/s often suffices.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give the nitrate only, since a beta-blocker is the drug that matters in aortic stenosis",
            feedback: "The consensus names both drugs as contraindicated in severe aortic stenosis. Image quality comes from gating and reconstruction, not from vasodilating a patient with a fixed outflow obstruction.",
            stateDelta: { stability: -10, flags: ["ct-drugs"] },
            next: "ct-gating",
          },
          {
            text: "Give both, as for a coronary CT, to slow the heart and dilate the coronaries",
            feedback: "This is the coronary CT protocol, and the consensus says it should not be used before a TAVI scan in severe aortic stenosis.",
            stateDelta: { stability: -15, flags: ["ct-drugs"] },
            next: "ct-gating",
          },
        ],
      },
      {
        id: "ct-gating",
        kind: "consequence",
        prompt: "The attending stops the injection before it is given. The radiographer asks how, without drugs, they can be sure of a motion-free annulus. What do you suggest?",
        options: [
          {
            text: "Gate the root with ECG padding or a wide window so several phases, at least one systolic, can be reconstructed",
            best: true,
            feedback: "That is the consensus approach: multiple reconstructed phases make it likely that one is free of motion even with an irregular rhythm, and image quality takes priority over the exact phase.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Use a single non-gated acquisition of the whole aorta and measure the annulus from it",
            feedback: "A non-gated scan is adequate for the access arteries, but the root needs a gated or triggered acquisition for motion-free measurement.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "ct-read",
        prompt: "The CT is back. Which plan follows from it?",
        info:
          "Systolic annulus: area 440 mm², perimeter 75 mm. Left main 12 mm above the annular plane with a 9 mm left coronary leaflet; right coronary 15 mm with a 10 mm leaflet; sinuses 31–32 mm. Right common iliac minimal lumen 5.2 mm with circumferential calcium; left side minimal lumen 6.8 mm, mildly calcified, straight. The planned valve's sheath requires at least 6.0 mm by its instructions for use.",
        options: [
          {
            text: "Left transfemoral access; coronary risk low on both sides because each leaflet is shorter than its coronary height and the sinuses are not narrow; no routine coronary protection",
            best: true,
            feedback:
              "The left lumen exceeds the sheath's requirement; the right does not and is circumferentially calcified. Both leaflets are shorter than their coronary heights, which Lederman and colleagues regard as little risk, and the sinuses are wider than the obstruction means in Ribeiro's registry.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Right transfemoral access as usual: 5.2 mm is close enough to 6.0 mm, and the right is the operator's habitual side",
            feedback: "The lumen is smaller than the sheath needs and circumferentially calcified. The ESCR consensus asks for a vessel ideally larger than the sheath's outer diameter and for the least invasive suitable route, which here is the left.",
            stateDelta: { stability: -15, flags: ["wrong-side"] },
            next: "right-resistance",
          },
          {
            text: "Left transfemoral access with routine left main protection: a wire in the LAD and an undeployed stent in the left main",
            acceptable: true,
            feedback:
              "The access choice is right, but nothing here suggests a high-risk root, and Lederman and colleagues warn that a waiting stent can be caught between frame and root and then has to be deployed whether needed or not. Protection has costs; keep it for roots where the CT says it is needed.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "right-resistance",
        kind: "consequence",
        prompt: "On the right, the 14 F dilator meets firm resistance at the common iliac artery. What now?",
        options: [
          {
            text: "Stop: do not force it. Withdraw over the wire, check for injury with contralateral angiography, and move to the planned left side",
            best: true,
            feedback: "Brilakis's rule for wires in the iliac arteries, never push against resistance, applies all the more to a large dilator. The left side was always the better route.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push harder with a twisting motion; calcified iliacs often give way to steady pressure",
            feedback: "Forcing a large dilator through a calcified narrowing is how iliac rupture happens. Stop and change sides.",
            stateDelta: { stability: -20, flags: ["iliac-trauma"] },
          },
        ],
      },
      {
        id: "access",
        prompt: "Set up the left femoral access.",
        options: [
          {
            text: "Right femoral secondary access first; puncture the left under fluoroscopic guidance from it, centrally on the front wall above the bifurcation; pre-close with two suture devices before dilating; pass a protection wire from the right side over the bifurcation into the left superficial femoral artery",
            best: true,
            feedback:
              "This follows the review's sequence: contralateral guidance keeps the needle off the bifurcation, a central front-wall puncture helps the sutures, the sutures go in before the artery is dilated, and the protection wire allows a quick balloon or stent if closure fails.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Puncture the left groin by palpation at the skin crease, insert the large sheath, then decide on closure at the end",
            feedback: "Landmark punctures land on or near the bifurcation, and closure planned after the artery has been dilated to a large bore is closure that may fail.",
            stateDelta: { stability: -10, flags: ["unguided-puncture"] },
          },
        ],
      },
      {
        id: "pacing",
        prompt: "How will you pace for deployment?",
        options: [
          {
            text: "A temporary RV pacing wire, tested before the valve enters: with right bundle branch block she may need pacing after the procedure",
            best: true,
            feedback: "Right bundle branch block is on the review's list of predictors of complete heart block, and the wire may need to stay. An LV wire pacing circuit ends when the stiff wire comes out.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pace through the stiff LV guidewire: EASY TAVI showed it is quicker, cheaper and as effective",
            acceptable: true,
            feedback:
              "EASY TAVI does support LV pacing during deployment, but it does not provide pacing after the case, and this patient's baseline right bundle branch block makes post-procedure block a real possibility. The sources do not say how to provide a back-up; if you choose LV pacing, agree beforehand how a temporary wire would be placed quickly.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "post-deploy",
        prompt: "After deployment the pressure recovers to 118/52 mmHg. The root injection shows a paravalvular jet that the operator calls 'moderate'. What is the next step?",
        info: "Both coronaries fill normally. The ECG shows right bundle branch block with a new left axis deviation.",
        options: [
          {
            text: "Confirm and grade the leak with echo, and look for the mechanism (underexpansion, depth, calcium) before deciding whether and how to correct it",
            best: true,
            feedback:
              "Root aortography is operator dependent and agrees only modestly with echo. Post-TAVI leaks come from sealing failure, so the correction depends on the mechanism; underexpansion or malposition need a different answer from a calcium-related channel.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept the aortographic grade and finish; moderate leaks after TAVI are harmless",
            feedback: "Moderate or severe regurgitation after TAVI has been repeatedly linked to higher mortality. Grade it properly and look for a correctable cause.",
            stateDelta: { stability: -10, flags: ["pvr-unassessed"] },
          },
          {
            text: "Arrange plug closure of the leak at once, before any other assessment",
            feedback: "Papadopoulos and colleagues ask for underexpansion, malposition and a transvalvular leak to be excluded before plug closure of a post-TAVI leak.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "sheath-out",
        prompt: "The leak is mild on echo once the frame's expansion is confirmed. Time to remove the large sheath.",
        options: [
          {
            text: "Withdraw the sheath over the wire, tie the pre-close sutures, keep the protection wire and the right femoral sheath, and inject through the right sheath to check the closure",
            best: true,
            feedback: "The review advises a contralateral check angiogram of the closure, and the wire and the right sheath are your routes to a balloon or stent if it shows a leak.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull the sheath and all wires, tie the sutures, and remove the right femoral sheath to finish quickly",
            feedback: "Without a wire or a contralateral sheath, a closure failure has no endovascular route to repair.",
            stateDelta: { stability: -15, flags: ["no-bailout-route"] },
            next: "bleed-no-route",
          },
        ],
      },
      {
        id: "bleed-no-route",
        kind: "consequence",
        prompt: "Five minutes later the pressure falls to 78/44 mmHg and she complains of back pain. Both femoral sheaths are out. What do you do?",
        options: [
          {
            text: "General measures (large-bore IV access, fluids, cross-match, reversal of heparin once bleeding is confirmed) and new contralateral access for angiography and a balloon at once",
            best: true,
            feedback: "Brilakis: suspect bleeding in any hypotensive patient after femoral access; in the lab, obtain contralateral access, find the source on angiography and stop it with a low-pressure balloon before definitive treatment.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Send her to CT to define the injury before anything else",
            feedback: "CT is for a stable patient who has left the lab. An unstable patient on the table needs contralateral angiography and a balloon.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "iliac",
        prompt: "The check injection shows contrast extravasating from the left external iliac artery, and the pressure is falling.",
        variants: [
          { flag: "unguided-puncture", info: "The puncture lies low, close to the femoral bifurcation, and the suture closure has not held; the extravasation itself comes from the external iliac artery above it." },
          { flag: "no-bailout-route", info: "A new right femoral sheath and a wire across the left iliac artery have been placed; the injection through the new sheath shows the leak." },
          { flag: "iliac-trauma", info: "The right common iliac artery, forced earlier, also shows a small dissection flap without extravasation." },
        ],
        options: [
          {
            text: "From the right femoral sheath, cross over and inflate a balloon at low pressure across the tear, keep the protection wire for the repair, start the general measures, and if prolonged inflation fails, place a covered stent",
            best: true,
            feedback:
              "This is Brilakis's sequence: stop the bleeding with a low-pressure balloon first, then seal a large-vessel tear with a covered stent if prolonged inflation fails; surgery if that fails or the bifurcation is involved. Balloon-expandable covered stents allow more precise positioning; covered stents can be hard to deliver, so the wire across the tear matters.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Firm manual compression of the left groin for 20 minutes",
            feedback: "The external iliac artery lies above the inguinal ligament, out of reach of groin pressure. Stop the bleeding from inside.",
            stateDelta: { stability: -15 },
            next: "ct-delay",
          },
          {
            text: "Transfer her to CT to see the full extent of the injury first",
            feedback: "She is unstable and still on the table with the route to a fix in place; CT is for the stable patient outside the lab.",
            stateDelta: { stability: -20 },
            next: "ct-delay",
          },
        ],
      },
      {
        id: "ct-delay",
        kind: "consequence",
        prompt: "The pressure is now 64/38 mmHg. The attending asks what you will do in the next minute.",
        options: [
          {
            text: "Cross over from the right femoral sheath and inflate a balloon across the tear, general measures running, covered stent ready",
            best: true,
            feedback: "Control the inflow from inside first; everything else follows.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give more fluid and wait for the vascular surgeon to arrive before touching anything",
            feedback: "Fluid supports the pressure but does not stop the bleeding; the balloon does, and it is already within reach.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "pacing-wire",
        prompt: "The bleeding is sealed with a covered stent and she is stable. The ECG shows right bundle branch block with new left axis deviation and a PR of 220 ms. What about the temporary pacing wire?",
        options: [
          {
            text: "Keep the temporary wire, secured and in demand mode, with continuous monitoring, and ask the pacing team to review her today about early permanent pacing",
            best: true,
            feedback:
              "Right bundle branch block, left anterior hemiblock and first-degree AV block are all on the review's list of predictors of complete heart block, for which it advises keeping the temporary wire as long as clinically indicated; the review reports that half of permanent pacemakers after TAVI are implanted within 48 hours. Pre-existing right bundle branch block with a new conduction disturbance (here a new left axis deviation and a PR now 220 ms) is also the setting in which the 2021 ESC pacing guideline says early permanent pacing should be considered (sh-tavi-pvl-conduction).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep the wire with serial ECGs and decide on permanent pacing only if complete heart block appears",
            acceptable: true,
            feedback:
              "Keeping the wire is right, but with pre-existing right bundle branch block and a new conduction disturbance the 2021 ESC pacing guideline says early permanent pacing should be considered, so the pacing team should be involved now rather than after block appears.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Remove it in the lab to avoid the risk of RV perforation",
            feedback: "Removing the wire is right when the ECG does not need it; here three predictors of complete heart block are present, and early permanent pacing should have been discussed with the pacing team.",
            stateDelta: { stability: -10, flags: ["wire-removed"] },
          },
        ],
      },
    ],
    outcome:
      "The valve functions well with mild paravalvular regurgitation. The iliac tear is sealed with a covered stent. Her haemoglobin falls more than the 10–20 g/L the review regards as expected and she receives two units of blood. The pacing team reviews her the same day and, given the pre-existing right bundle branch block with new conduction disease, implants a permanent pacemaker the next morning; the temporary wire is then removed. The sign-out records the antiplatelet plan for the valve and the covered stent.",
    outcomeVariants: [
      { flag: "ct-drugs", text: "The drugs were stopped before they were given, but the episode is reported and the department's TAVI CT protocol is rewritten to exclude them." },
      { flag: "wrong-side", text: "The attempt on the right iliac artery added time and contrast; the case review records that the CT had already ruled that side out." },
      { flag: "wire-removed", text: "Overnight she develops complete heart block and needs an urgent transvenous wire before permanent pacing: the predictors were there before the wire was removed." },
      { flag: "pvr-unassessed", text: "Follow-up echo finds moderate paravalvular regurgitation that was never characterised on the table." },
    ],
    learningPoints: [
      "No nitrates or beta-blockers given for a TAVI CT in severe aortic stenosis; gate the root with padding and scan the access without gating.",
      "Choose the access side on the narrowest lumen against the sheath's requirement, and read coronary risk as height against leaflet length and sinus width.",
      "Guided puncture from the other side, pre-close before dilating, and a protection wire make closure failure survivable.",
      "Match the pacing route to the conduction risk: an RV wire that can stay when there is right bundle branch block, and an early pacing-team review when new conduction disease is added to it.",
      "Grade a paravalvular jet with echo and find its mechanism before correcting it.",
      "After closure, inject through the contralateral sheath; for an iliac bleed, balloon first at low pressure, then a covered stent.",
    ],
    refs: [...BOOKS, "francone-escr-tavi-imaging-2020", "tamburino-tavi-complications-2020", "faurie-easy-tavi-2019", "lederman-coronary-obstruction-2019", "papadopoulos-pvl-closure-2026", "esc-pacing-2021"],
  },
  {
    id: "hb-tavi-case-viv",
    title: "A failing 21 mm surgical valve: planning a valve-in-valve",
    trackId: "cath-handbook",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "2021 ESC/EACTS valve guideline (section 11.4; superseded by the 2025 update, whose section 14.4 could not be read); 2025 ESC/EACTS valve guideline (section 8); valve-in-valve registry (Dvir 2014); ESCR CT consensus; Lederman 2019 BASILICA tutorial; Ribeiro 2013; Allen 2021",
    },
    summary:
      "A 78-year-old man with a degenerated 21 mm stented surgical bioprosthesis is referred for valve-in-valve TAVI. Exclude reversible causes, identify the valve, interpret a small virtual valve-to-coronary distance, resist a balloon bridge, and plan for the residual gradient.",
    presentation:
      "A 78-year-old man had surgical aortic valve replacement with a 21 mm stented bioprosthesis 11 years ago. Over 6 months he has become breathless on one flight of stairs. Echo shows severe prosthetic stenosis. His surgeon considers redo surgery high risk because of lung disease and frailty.",
    findings: [
      "Blood pressure 124/76 mmHg, sinus rhythm 68 beats/min, afebrile",
      "Echo: thickened, immobile prosthetic leaflets; mean gradient high; LVEF 50%",
      "No previous coronary bypass grafts",
      "Operation note: stented bioprosthesis, label size 21 mm, leaflets mounted outside the frame",
    ],
    steps: [
      {
        id: "first",
        prompt: "Before planning the valve-in-valve, what should be established?",
        options: [
          {
            text: "That the failure is structural: exclude endocarditis and valve thrombosis first",
            best: true,
            feedback: "The 2021 guideline asks for these reversible causes to be excluded before a failing bioprosthesis is called structural deterioration.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Nothing more: an 11-year-old surgical valve with stenosis is always degenerated",
            feedback: "Thrombosis and endocarditis can mimic degeneration and are treated differently. Exclude them first.",
            stateDelta: { stability: -5, flags: ["no-workup"] },
            next: "missed-cause",
          },
        ],
      },
      {
        id: "missed-cause",
        kind: "consequence",
        prompt: "At the Heart Team meeting the imaging cardiologist asks whether blood cultures and an assessment for thrombosis have been done. They have not. What now?",
        options: [
          {
            text: "Complete the work-up for endocarditis and thrombosis before the valve-in-valve is scheduled",
            best: true,
            feedback: "Both change the treatment; the procedure can wait for the answer.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Proceed: the result will not change the plan",
            feedback: "It may change it entirely. An infected or thrombosed valve is not treated with another valve inside it.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "ct",
        prompt: "Endocarditis and thrombosis are excluded. The planning CT includes a simulated transcatheter valve in the surgical frame.",
        info: "Virtual valve-to-coronary distance (VTC): left main 2.5 mm, right coronary 6 mm. Left main height 8 mm. The sinotubular junction is not narrow.",
        options: [
          {
            text: "High risk of left main obstruction: back to the Heart Team to weigh redo surgery against valve-in-valve with leaflet laceration at an expert centre",
            best: true,
            feedback:
              "A VTC below 3–4 mm is regarded as high risk on valve-in-valve outcomes, and externally mounted leaflets remove the protection of the frame. Lederman and colleagues name surgery as the standard alternative and BASILICA as the transcatheter option to keep the left main open.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Proceed with a standard valve-in-valve: the surgical frame protects the ostium",
            feedback: "Not when the leaflets are mounted outside the frame; with a VTC of 2.5 mm this is a high-risk root.",
            stateDelta: { stability: -20, flags: ["obstruction"] },
            next: "obstruction",
          },
          {
            text: "Proceed with a wire and undeployed stent in the left main, ready to deploy a chimney stent",
            acceptable: true,
            feedback:
              "Protection is a recognised fallback, but Lederman and colleagues warn that a waiting stent can be caught and have to be deployed, and that chimney stents often deform or thrombose, with ischaemia. In a patient who could have surgery or laceration, it should not be the first plan.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "obstruction",
        kind: "consequence",
        prompt: "Immediately after the transcatheter valve is deployed, the pressure falls to 64/40 mmHg with ST depression, and the left main does not fill on the root injection.",
        options: [
          {
            text: "Attempt emergency PCI to the left main and call the surgeon now, with the team supporting the circulation",
            best: true,
            feedback:
              "In Ribeiro's registry PCI was attempted in 75% of obstructions and was successful in 81.8%, but 30-day mortality was 40.9%; Lederman notes rescue PCI may fail because the leaflet cannot be crossed. Act at once.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give a vasopressor and wait for the effect of rapid pacing to wear off",
            feedback: "Persistent hypotension and ECG change after deployment are how obstruction presents, and the left main is not filling. Waiting is the fatal choice.",
            stateDelta: { stability: -25 },
          },
        ],
      },
      {
        id: "bridge",
        prompt: "While the team arranges an expert-centre referral, he is admitted with heart failure. A registrar suggests balloon dilatation of the stenotic bioprosthesis as a bridge.",
        options: [
          {
            text: "No: the guideline advises against percutaneous balloon interventions for stenotic left-sided bioprostheses; treat the heart failure medically and expedite the definitive procedure",
            best: true,
            feedback: "The 2021 guideline advises avoiding balloon interventions on stenotic left-sided bioprostheses (check the 2025 update before quoting it).",
            stateDelta: { stability: 5 },
          },
          {
            text: "Yes: balloon valvuloplasty is a standard bridge for any severely stenotic aortic valve",
            feedback: "That reasoning comes from native valves. For left-sided bioprostheses the guideline advises against it.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "gradient",
        prompt: "At the expert centre, leaflet laceration and valve-in-valve are performed; the left main fills well. The residual mean gradient is still high, and the operator expects patient–prosthesis mismatch. What can be done?",
        options: [
          {
            text: "If the surgical valve's ring can be fractured or remodelled, inflate a high-pressure non-compliant balloon in it to let the transcatheter valve expand and lower the gradient",
            best: true,
            feedback:
              "Allen and colleagues describe bioprosthetic valve fracture (cracking the ring) and remodelling (stretching it) as ways to expand the transcatheter valve fully and reduce the residual gradient. Lederman notes that a balloon-expandable valve flares further after fracture, so the coronary plan must already allow for it.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept it: small surgical valves always leave high gradients and nothing more can be done",
            feedback: "Ring fracture or remodelling exists precisely for this problem in suitable valves; the registry links small valves with worse survival, so the gradient matters.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "follow",
        prompt: "He recovers well. What follow-up does the 2025 guideline recommend for a bioprosthesis?",
        options: [
          {
            text: "An early baseline echo within the first weeks, then yearly clinical and echo review, and sooner if symptoms or signs appear",
            best: true,
            feedback: "That is the guideline's surveillance for every bioprosthesis, and it will catch the next deterioration early.",
            stateDelta: { stability: 5 },
          },
          {
            text: "No routine echo; review only if symptoms return",
            feedback: "The guideline recommends a baseline echo and yearly review for bioprostheses.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "After leaflet laceration, valve-in-valve and ring fracture at an expert centre, the left main is open and the gradient is acceptable. He returns to independent life, with a baseline echo at 6 weeks and yearly review.",
    outcomeVariants: [
      { flag: "obstruction", text: "The left main obstruction was opened by emergency PCI, but he had a large anterior infarction and a long stay in intensive care; the case review records that the CT had predicted the risk." },
      { flag: "no-workup", text: "The delay to complete the endocarditis and thrombosis work-up cost two weeks but avoided implanting a valve into a possibly infected one." },
    ],
    learningPoints: [
      "Exclude endocarditis and thrombosis before calling a bioprosthesis degenerated.",
      "Know the surgical valve: size, frame and how its leaflets are mounted; externally mounted leaflets remove the frame's protection.",
      "A VTC below 3–4 mm on a simulated valve means high obstruction risk: surgery or leaflet laceration, not hope.",
      "Do not balloon a stenotic left-sided bioprosthesis.",
      "Small surgical valves and stenosis as the failure mode were each associated with lower survival after valve-in-valve; plan for the gradient, including ring fracture where possible.",
      "Bioprostheses need a baseline echo within weeks and yearly review.",
    ],
    refs: ["esc-vhd-2021", "esc-vhd-2025", "dvir-vivid-2014", "francone-escr-tavi-imaging-2020", "lederman-coronary-obstruction-2019", "ribeiro-coronary-obstruction-2013", "allen-bvf-guide-2021"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "structural-tavi-futility-check",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "Before planning the valve, ask whether the patient will gain",
    text: "Confirm severity from the non-invasive studies first (Oxford expects gradients and valve area from them before any catheter study). Then ask about benefit: a life expectancy under one year or an expected gain of less than one NYHA class argues for no intervention. Weigh frailty, dementia, organ dysfunction, chest irradiation and chest-wall deformity alongside the surgical risk scores.",
    tone: "caution",
    lessonId: "hb-tavi-candidate",
    sources: [O("ch 5: Aortic stenosis")],
    refs: ["tamburino-tavi-complications-2020"],
  },
  {
    id: "structural-tavi-plan-second-valve",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "Plan the second valve now",
    text: "At the first TAVI, decide whether a later TAV-in-TAV would be feasible: device choice, the height of the new skirt, commissural alignment and implantation depth all affect it. In an annulus small for the patient's size, consider a supra-annular valve or surgery with root enlargement. Brilakis adds the coronary view: a frame rising above the ostia or a commissural post in front of one makes later engagement difficult.",
    tone: "do",
    lessonId: "hb-tavi-candidate",
    sources: [B("24.1")],
    refs: ["esc-vhd-2025"],
  },
  {
    id: "structural-tavi-no-nitrate-before-ct",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "TAVI CT: no nitrates or beta-blockers for the scan",
    text: "Do not give nitrates or beta-blockers to improve image quality before a TAVI planning CT in severe aortic stenosis; this concerns doses for the scan, not regular medication. Gate the root with padding so several phases, at least one systolic, can be reconstructed, and scan the access arteries without gating on the same modest bolus. The scan must deliver what Oxford lists: access arteries, annulus, root and junction, whole aorta, valve calcium, coronary heights and working angles.",
    tone: "caution",
    lessonId: "hb-tavi-workup",
    sources: [O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
    refs: ["francone-escr-tavi-imaging-2020"],
  },
  {
    id: "structural-tavi-annulus-double-oblique",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "Annulus: a double-oblique plane through three nadirs",
    text: "Build the annular plane through the lowest hinge point of each leaflet on a systolic double-oblique view, then record both diameters, perimeter and area. Area-derived diameter is 2 × √(area ÷ π) and perimeter-derived is perimeter ÷ π; if the result falls between two sizes, re-measure blinded.",
    tone: "do",
    lessonId: "hb-tavi-workup",
    sources: [O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
    refs: ["francone-escr-tavi-imaging-2020"],
  },
  {
    id: "structural-tavi-access-min-lumen",
    lab: "structural",
    when: { phase: ["access"], procedure: ["tavi"] },
    title: "Access: narrowest lumen on both sides against the sheath",
    text: "Measure the minimal luminal diameter of the common femoral, external and common iliac arteries on both sides, perpendicular to the vessel axis, and compare it with the sheath's outer diameter. Grade tortuosity and calcium per side, and go transfemoral unless the lumen is prohibitive. If it is, the 2025 guideline prefers surgery for a patient who can have it; non-transfemoral TAVI rests mainly on observational data.",
    tone: "do",
    lessonId: "hb-tavi-workup",
    sources: [O("ch 5: TAVI work-up")],
    refs: ["francone-escr-tavi-imaging-2020"],
  },
  {
    id: "structural-tavi-guided-puncture",
    lab: "structural",
    when: { phase: ["access"], procedure: ["tavi"] },
    title: "Large-bore puncture: guided from the other side, front wall, pre-close",
    text: "Puncture the main artery under fluoroscopic guidance from the contralateral access so the needle avoids the femoral bifurcation, centrally on the front wall. Place the suture closure devices before dilating the artery.",
    tone: "do",
    lessonId: "hb-tavi-procedure",
    sources: [B("14.4"), B("29.1")],
    refs: [...BR, "tamburino-tavi-complications-2020"],
  },
  {
    id: "structural-tavi-protection-wire",
    lab: "structural",
    when: { phase: ["access"], procedure: ["tavi"] },
    title: "Park a protection wire in the superficial femoral artery",
    text: "A protective wire parked in the TAVI-side superficial femoral artery, passed, in this sequence, from the contralateral access over the aortic bifurcation, lets a balloon or stent be delivered at once if the closure fails. At the end, check the closure with a contrast injection through the contralateral access.",
    tone: "do",
    lessonId: "hb-tavi-procedure",
    sources: [B("29.1")],
    refs: ["tamburino-tavi-complications-2020"],
  },
  {
    id: "structural-tavi-cross-valve",
    lab: "structural",
    when: { phase: ["position"], procedure: ["tavi"] },
    title: "Crossing the stenotic valve: AL1, straight hydrophilic wire, control",
    text: "Aim a straight-tipped hydrophilic wire through a 5 F AL1 at the orifice and move it with control; repeated attempts cause cerebral emboli. Once across, advance the catheter, confirm an LV trace and exchange for a pigtail over an exchange-length J wire.",
    tone: "do",
    lessonId: "hb-tavi-procedure",
    sources: [O("ch 5: Aortic stenosis"), O("ch 4: Accessing the left heart")],
    refs: OX,
  },
  {
    id: "structural-tavi-lv-wire-pacing",
    lab: "structural",
    when: { phase: ["plan", "access"], procedure: ["tavi"] },
    title: "Choose the pacing route before access",
    text: "Pacing through the stiff LV guidewire shortened procedures with similar efficacy to an RV wire in EASY TAVI (balloon-expandable valves). It ends when the wire comes out, so use an RV wire that can stay in patients with heart block or its predictors. Test an RV wire before the valve goes in: Oxford aims for a capture threshold of 1 V or lower, with the output at least three times the threshold.",
    tone: "do",
    lessonId: "hb-tavi-procedure",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: ["faurie-easy-tavi-2019", "tamburino-tavi-complications-2020"],
  },
  {
    id: "structural-tavi-pacing-wire-decision",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["tavi"] },
    title: "Temporary wire: keep it for block or its predictors",
    text: "Leave the temporary wire, with serial ECGs, after complete heart block or with predictors such as right bundle branch block, left anterior hemiblock, first-degree AV block, a low implant, a CoreValve/Evolut implant, predilatation or small-annulus oversizing. If it stays, suture lead and sheath, fix a skin loop and set demand mode with the sensitivity adjusted to sense intrinsic beats (Oxford). Otherwise remove it in the lab to avoid RV perforation.",
    tone: "caution",
    lessonId: "hb-tavi-procedure",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: ["tamburino-tavi-complications-2020"],
  },
  {
    id: "structural-tavi-hypotension-coronary",
    lab: "structural",
    when: { phase: ["assess", "complication"], event: ["hypotension", "st-elevation"], procedure: ["tavi"] },
    title: "Hypotension that persists after pacing stops: check the coronaries",
    text: "Persistent hypotension and ECG change after deployment are the commonest presentations of coronary obstruction, usually of the left coronary. Inject the root at once; if a coronary does not fill, start the rescue plan rather than waiting for pacing recovery. If the coronaries fill, keep bleeding in mind: Brilakis asks for a retroperitoneal bleed to be suspected in any hypotensive patient after femoral access.",
    tone: "bailout",
    lessonId: "hb-tavi-coronary",
    sources: [B("29.1")],
    refs: ["ribeiro-coronary-obstruction-2013"],
  },
  {
    id: "structural-tavi-snorkel-limits",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "Coronary protection is not free insurance",
    text: "A stent waiting in the at-risk artery can be caught between frame and root and then has to be deployed; chimney stents often deform or thrombose, and rescue PCI may fail if the leaflet cannot be crossed. Read each coronary height on the planning CT (Oxford lists it among what the scan provides) and, in a high-risk root, discuss surgery or leaflet laceration first.",
    tone: "caution",
    lessonId: "hb-tavi-coronary",
    sources: [O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
    refs: ["lederman-coronary-obstruction-2019"],
  },
  {
    id: "structural-tavi-pvr-mechanism",
    lab: "structural",
    when: { phase: ["assess"], procedure: ["tavi"] },
    title: "Paravalvular jet: grade it properly and find the mechanism",
    text: "Root aortography is operator dependent; Oxford's grades I–IV compare LV with aortic opacification and also depend on LV function, so confirm the grade with echo. Before any plug closure of a post-TAVI leak, exclude underexpansion, malposition and a mainly transvalvular leak.",
    tone: "do",
    lessonId: "hb-tavi-vascular-stroke",
    sources: [O("ch 5: Aortic regurgitation")],
    refs: ["papadopoulos-pvl-closure-2026", "genereux-varc3-2021"],
  },
  {
    id: "structural-tavi-vtc-viv",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["tavi"] },
    title: "Valve-in-valve: simulate the new valve and measure the VTC",
    text: "Start from the coronary heights and root measurements of the planning CT (Oxford), then place a virtual valve the size of the planned device in the surgical frame and measure its distance to each ostium. A distance below 3–4 mm is regarded as high risk, more so with externally mounted or stentless surgical leaflets and no bypass grafts; no safe threshold has been validated, and the true distance is probably smaller than measured.",
    tone: "caution",
    lessonId: "hb-tavi-viv",
    sources: [O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
    refs: ["lederman-coronary-obstruction-2019", "francone-escr-tavi-imaging-2020"],
  },
];

// ---------------------------------------------------------------------------
// New references (each checked against PubMed; PMID or DOI in note)
// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "francone-escr-tavi-imaging-2020",
    kind: "consensus",
    citation:
      "Francone M, Budde RPJ, Bremerich J, et al. CT and MR imaging prior to transcatheter aortic valve implantation: standardisation of scanning protocols, measurements and reporting—a consensus document by the European Society of Cardiovascular Radiology (ESCR). Eur Radiol. 2020;30:2627–2650.",
    url: "https://doi.org/10.1007/s00330-019-06357-8",
    note: "PMID: 31489471; PMCID: PMC7160220 (full text read). Authors, title, journal, year, volume (30, issue 5) and pages checked on PubMed; published online 2019.",
    verified: true,
  },
  {
    id: "lederman-coronary-obstruction-2019",
    kind: "paper",
    citation:
      "Lederman RJ, Babaliaros VC, Rogers T, et al. Preventing coronary obstruction during transcatheter aortic valve replacement: from computed tomography to BASILICA. JACC Cardiovasc Interv. 2019;12:1197–1216.",
    url: "https://doi.org/10.1016/j.jcin.2019.04.052",
    note: "PMID: 31272666; PMCID: PMC6724191 (full text read). Authors, title, journal, year, volume (12, issue 13) and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "tamburino-tavi-complications-2020",
    kind: "paper",
    citation: "Ina Tamburino C, Barbanti M, Tamburino C. Transcatheter aortic valve implantation: how to decrease post-operative complications. Eur Heart J Suppl. 2020;22(Suppl E):E148–E152.",
    url: "https://doi.org/10.1093/eurheartj/suaa081",
    note: "PMID: 32523460; PMCID: PMC7270891 (full text read). Authors (first author listed on PubMed as Ina Tamburino C), title, journal, year, supplement and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "faurie-easy-tavi-2019",
    kind: "trial",
    citation:
      "Faurie B, Souteyrand G, Staat P, et al. Left ventricular rapid pacing via the valve delivery guidewire in transcatheter aortic valve replacement. JACC Cardiovasc Interv. 2019;12:2449–2459.",
    url: "https://doi.org/10.1016/j.jcin.2019.09.029",
    note: "PMID: 31857014. EASY TAVI (NCT02781896). Authors, title, journal, year, volume (12, issue 24) and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "dvir-vivid-2014",
    kind: "paper",
    citation:
      "Dvir D, Webb JG, Bleiziffer S, et al. Transcatheter aortic valve implantation in failed bioprosthetic surgical valves. JAMA. 2014;312:162–170.",
    url: "https://doi.org/10.1001/jama.2014.7246",
    note: "PMID: 25005653. Valve-in-Valve International Data registry. Authors, title, journal, year, volume (312, issue 2) and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "allen-bvf-guide-2021",
    kind: "paper",
    citation: "Allen KB, Chhatriwalla AK, Saxon JT, et al. Bioprosthetic valve fracture: a practical guide. Ann Cardiothorac Surg. 2021;10:564–570.",
    url: "https://doi.org/10.21037/acs-2021-tviv-25",
    note: "PMID: 34733685; PMCID: PMC8505908. Authors, title, journal, year, volume (10, issue 5) and pages checked on PubMed; abstract read (full text not available through PMC).",
    verified: true,
  },
  {
    id: "papadopoulos-pvl-closure-2026",
    kind: "paper",
    citation: "Papadopoulos GE, Ninios I, Evangelou S, et al. Transcatheter paravalvular leak closure: a step-by-step guide. J Cardiovasc Dev Dis. 2026;13(2):96.",
    url: "https://doi.org/10.3390/jcdd13020096",
    note: "PMID: 41745344; PMCID: PMC12941249 (full text read). Authors, title, journal, year, volume (13, issue 2) and article number checked on PubMed. Narrative review; registry figures quoted from it are attributed to the review.",
    verified: true,
  },
  {
    id: "sorajja-pvl-2011",
    kind: "paper",
    citation:
      "Sorajja P, Cabalka AK, Hagler DJ, Rihal CS. Percutaneous repair of paravalvular prosthetic regurgitation: acute and 30-day outcomes in 115 patients. Circ Cardiovasc Interv. 2011;4:314–321.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.110.960955",
    note: "PMID: 21791673. Authors, title, journal, year, volume (4, issue 4) and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "brighenti-rvot-2026",
    kind: "paper",
    citation:
      "Brighenti M, Assenza GE, Mariucci E, et al. Lifelong management of right ventricular outflow tract dysfunction in adults with congenital heart disease. Methodist Debakey Cardiovasc J. 2026;22(3):67–77.",
    url: "https://doi.org/10.14797/mdcvj.1797",
    note: "PMID: 42403549; PMCID: PMC13330989 (full text read). Authors, title, journal, year, volume (22, issue 3) and pages checked on PubMed.",
    verified: true,
  },
  {
    id: "morray-coronary-compression-2013",
    kind: "paper",
    citation:
      "Morray BH, McElhinney DB, Cheatham JP, et al. Risk of coronary artery compression among patients referred for transcatheter pulmonary valve implantation: a multicenter experience. Circ Cardiovasc Interv. 2013;6:535–542.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.113.000202",
    note: "PMID: 24065444. Authors, title, journal, year, volume (6, issue 5) and pages checked on PubMed; abstract read.",
    verified: true,
  },
];
