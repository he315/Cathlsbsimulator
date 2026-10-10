// Module hb-the-operator: becoming an operator (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, ch 1 (background: learning by apprenticeship),
// ch 2 (the cardiologist: roles, training, apprenticeship, formal learning, assessment, accredited centres, logbook,
// certification; the nurse and the radiographer: training and teaching duties), ch 3 (trends in vascular access), ch 6
// (quantification of stenoses; common pitfalls), ch 8 (restenosis, drug-eluting stents, bioresorbable scaffolds, stent
// thrombosis), ch 10 (air embolism), ch 11 (results: review sessions); Brilakis, Manual of PCI: Introduction (printed pp.
// xxiii–xxiv, PDF pp. 25–26; it has no section number, so it is cited in the text and in the evidence file rather than in
// `sources`), 2.9 (operator and team performance), 4 (access: expertise in both routes), 7.1 and 7.3 (operator competence in
// the benefit–risk balance; ad hoc versus delayed PCI) and the whole of chapter 21 (chronic total occlusions).
// New references (PubMed-checked, or checked on the publisher's page) are in `refs` below.
// Every claim is listed with its page in docs/curriculum/evidence/hb-the-operator.md.
// Neighbouring modules: pm-monitoring (the team's roles, the checklist, crisis leadership), hb-safe-practice (reflection,
// audit, the law, wellbeing), cp-cto-strategy, cp-cto-antegrade and cp-cto-retrograde (CTO technique), hb-after-the-procedure
// (reporting and communication). Academy lessons this module builds on: bed-ind-curriculum, bed-ind-stop-help and the
// Competencies and logbook and Assessment sections.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OXFORD = ["oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "hb-the-operator",
  title: "Becoming an operator",
  stage: 2,
  summary:
    "How a trainee becomes an operator who can be trusted alone and then trusted to teach: the levels of entrustment and how they are decided, the training pathway, logbook and certification, learning from and becoming a mentor or proctor, what it takes to build a CTO or complex PCI programme, and how to read the trials and judge the devices that change practice.",
  objectives: [
    "Describe the five EAPCI 2020 levels of competence and the evidence (supervised cases, assessment, outcomes) on which a decision to let an operator work without direct supervision rests.",
    "Set out the European training pathway, the accreditation requirements for a training centre, the logbook and certification, and where the Oxford handbook and the EAPCI 2020 curriculum differ.",
    "Use deliberate practice with a teacher to improve, give structured teaching in the lab, and explain what a mentor and a proctor each contribute.",
    "List the clinical, equipment, safety and audit components a CTO programme needs, and interpret learning-curve and experience data when a programme starts.",
    "Appraise a trial or registry: design, population, end points and their definitions, follow-up and reporting, and follow how a device moves from idea to routine use or to restriction to clinical studies.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-the-operator-entrustment",
      title: "Entrustment: the five levels and the decision to work alone",
      minutes: 14,
      topics: ["pro-independence"],
      sources: [O("ch 2: The cardiologist"), O("ch 1: Background"), O("ch 3: Trends in vascular access"), O("ch 6: Common pitfalls"), O("ch 10: Air embolism"), B("2.9"), B("4"), B("7.1")],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "eapci-curriculum", "tencate-epa-guide-2020"],
      blocks: [
        {
          kind: "p",
          text: "Independence is not a date on a rota. It is a judgement, made by supervisors about one activity at a time, that a trainee can carry the whole of that activity, including its complications, without a senior at the table. Both manuals treat the operator's skill as part of the patient's risk: Brilakis lists operator competence beside the impact of the disease, the complexity of the lesion and the comorbidities when he weighs benefit against risk. This lesson goes beyond the Academy's earlier overview (bed-ind-curriculum) to the definitions the decision uses and the evidence behind them.",
        },
        { kind: "h", text: "The five levels of competence (EAPCI 2020)" },
        {
          kind: "table",
          caption: "EAPCI 2020 core curriculum levels, in this module's words",
          head: ["Level", "What the trainee does", "Supervision"],
          rows: [
            ["I", "Knows when the procedure is indicated and can interpret its results; no procedural skill is required, though taking part in procedures during training helps", "Not an operator"],
            ["II", "Has some procedural skill, usually as assistant or second operator", "Senior is first operator"],
            ["III", "Interprets the data, recognises the indication, performs the procedure and manages its complications as first operator", "Direct supervision by a senior interventional cardiologist"],
            ["IV", "Does all of level III independently, as first operator", "No direct supervision; cases may be reviewed afterwards with senior colleagues"],
            ["V", "Everything at level IV, and can teach and supervise more junior colleagues", "Supervises others"],
          ],
        },
        {
          kind: "p",
          text: "The curriculum adapted these levels from the idea of **entrustable professional activities** (EPAs). An EPA is a unit of work, such as 'radial diagnostic angiography' or 'primary PCI of a culprit RCA', that can be handed to a trainee once he or she is trusted to do it. AMEE Guide 140 recommends describing each EPA in eight parts: its title; what it includes and excludes; the risks if it fails; the competency domains it draws on; the knowledge, skills, attitudes and experience it needs; the information used to judge progress and support the summative decision; the level of entrustment expected at each stage of training; and how long the entrustment lasts if the activity is not practised. The last part matters: an activity you stop doing can lapse.",
        },
        {
          kind: "check",
          stem: "A second-year fellow performs femoral primary PCI as first operator and, when a dissection occurs, manages it herself while her consultant stands scrubbed beside her, guiding her. On which EAPCI level is she working for femoral primary PCI?",
          options: [
            "Level II, because her consultant was scrubbed and guiding her through the complication",
            "Level III, because she is first operator, complications included, under direct supervision",
            "Level IV, because she performed the whole procedure, the bail-out included, herself as first operator",
            "Level V, because a fellow who manages a dissection is expected to supervise others",
          ],
          answer: 1,
          explanation:
            "First operator, managing the complication, with a senior directly supervising is level III. Level IV needs the same activity, bail-outs included, done without direct supervision, so the consultant at her side means she is not yet there. Level II is the assistant or second-operator role, which she has passed because she, not the consultant, is operating.",
        },
        { kind: "h", text: "What the decision rests on" },
        {
          kind: "steps",
          title: "Building the case for entrustment, activity by activity",
          items: [
            {
              title: "1. Supervised volume of rising complexity",
              detail:
                "Oxford's model fellowship has the trainee perform supervised procedures of increasing complexity, discuss cases with the supervisor, join the primary PCI rota and gain expertise in intravascular imaging and invasive physiology. It names a minimum of 200 PCIs. The EAPCI 2020 curriculum deliberately sets no minimum or optimal number, because numbers alone do not describe proficiency; it asks for competencies to be shown instead. Treat a number as a floor for exposure, never as proof of competence.",
            },
            {
              title: "2. Exposure to both access routes",
              detail:
                "Brilakis calls expertise in both radial and femoral access essential for a contemporary interventional cardiologist. Oxford warns that operators who were not trained radially meet a steep learning curve, with longer procedures and more failures as they cross over. Check your logbook for both routes before you claim either.",
            },
            {
              title: "3. Before and after the procedure, not only during it",
              detail:
                "Oxford's apprenticeship lists pre-procedural work (admission, consent, arranging non-invasive tests, pre-PCI drugs, heart team meetings) and post-procedural work (the report, monitoring the patient, and discussing drugs and follow-up with the supervisor). The operator's duties as team leader across the whole pathway are tabulated in pm-monitoring; an independent operator owns all of them.",
            },
            {
              title: "4. Complications handled as first operator",
              detail:
                "Level III is defined partly by managing complications under supervision. Brilakis notes that experienced operators may be more adept at managing complications; Oxford records that coronary air embolism, seen in about 0.4% of angiograms, depends on training, and that inexperienced operators can produce incomplete or misreported studies. Entrustment for an activity therefore includes its bail-outs.",
            },
            {
              title: "5. Assessment beyond your own impression",
              detail:
                "Oxford's programme assesses through documented course attendance, the logbook, skill assessment by an independent trainer and on a simulator, appraisal by the programme director, and a final examination. The EAPCI curriculum asks for regular review or appraisal of progress and formal assessment of knowledge and procedural competence.",
            },
            {
              title: "6. The state of the operator on the day",
              detail:
                "Brilakis adds that the operator's and staff's condition, for example being rested rather than sleep deprived, affects outcome, and that watching the team's operational state helps catch conditions such as excessive fatigue. Entrustment is a standing judgement; whether to proceed today is a fresh one.",
            },
          ],
        },
        { kind: "tip", id: "pci-operator-know-your-level" },
        { kind: "tip", id: "pci-operator-help-early" },
        { kind: "tip", id: "pci-operator-check-the-device" },
        {
          kind: "check",
          stem: "A newly appointed operator, trained almost entirely through the femoral route, is asked to take over a radial-first list on his own. What do the manuals predict, and what is the safest response?",
          options: [
            "No change in performance, because catheter skills transfer directly from one access route to another",
            "Longer procedures and more failures at first; arrange supervised radial cases before working alone",
            "Fewer access complications at once, so he can safely work alone from his very first radial list",
            "Higher success from the start, because radial access gives more guide support",
          ],
          answer: 1,
          explanation:
            "Oxford describes a steep radial learning curve for operators not trained radially, with longer procedures and more failures during the crossover, and Brilakis expects expertise in both routes. Radial access does reduce access-site bleeding, but that is a property of the route in trained hands, not a reason to skip the learning curve; Brilakis also notes that guide support can be less from the radial route, and Oxford mentions a more recent concern that radial work may raise the operator's radiation dose.",
        },
        { kind: "h", text: "What a simulator can and cannot show" },
        {
          kind: "p",
          text: "The EAPCI curriculum encourages training centres to add interventional simulators because they have helped novices progress, while noting that their role in the most advanced skills is still to be clarified; Oxford's programme already lists skill assessment on a simulator. In this app the levels shown in Competencies and logbook are simulator entrustment: level II is earned from passed practice cases, and levels III and above only in exam mode on held-out cases. They are a useful rehearsal and a record of practice, never a clinical sign-off. At present the PCI, haemodynamics, MCS, structural and bedside labs log practice only and can reach level II, because they have no held-out exam cases yet (requested in this module's lab file).",
        },
        {
          kind: "pitfalls",
          items: [
            "Equating a case count with competence: the 2020 curriculum sets no number because numbers do not show proficiency.",
            "Claiming independence for 'PCI' as a whole when the logbook shows no complex subsets, one access route, or no complications handled.",
            "Forgetting that an entrustment lapses when an activity is not practised.",
            "Judging only the procedure and not the consent, the report and the follow-up plan.",
            "Proceeding on a day when you or the team are exhausted because you are entrusted on paper.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask your supervisor to name the activities, not the grade. 'You can do elective radial single-vessel PCI alone; you still need me scrubbed for left main and for femoral large-bore work' is an entrustment you can act on.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Take one held-out exam case in Assessment for right radial access and left engagement. Then open Competencies and logbook and read, for that activity, the eight EPA sections (risks, knowledge, evidence, expected level, expiry) and the level you now hold.",
        },
        { kind: "video", id: "39Qaoh6ycsI", note: "Sensei Podcast episode 100, with Morton Kern." },
        { kind: "video", id: "VlUjTm7od90", note: "Sensei Podcast episode 110, with David Holmes." },
        {
          kind: "keypoints",
          items: [
            "EAPCI levels: I knows and interprets; II assists; III first operator under direct supervision, managing complications; IV first operator without direct supervision; V can also teach and supervise.",
            "Entrustment is given per activity (EPA) and can lapse if the activity is not practised; AMEE Guide 140 describes each EPA in eight parts.",
            "Oxford's fellowship names 200 supervised PCIs; the EAPCI 2020 curriculum sets no number and judges competencies.",
            "Both access routes, radial and femoral, are expected of an operator; switching route late carries a learning curve.",
            "Operator competence, and the operator's state on the day, are part of the benefit–risk balance of every PCI.",
            "Simulator levels in this app are rehearsal, not clinical entrustment.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-the-operator-pathway",
      title: "The training pathway, logbook, certification and the job",
      minutes: 14,
      topics: ["pro-career"],
      sources: [O("ch 2: The cardiologist")],
      refs: ["oxford-cath-handbook", "eapci-curriculum"],
      blocks: [
        {
          kind: "p",
          text: "The route to an interventional consultant post is long and, in Europe, increasingly standardised. Knowing the requirements early lets you plan exposure, courses and research rather than discovering gaps at the end. The two sources below were written a few years apart and differ on durations and numbers; where they differ, both positions are given, and the national rules where you train decide.",
        },
        {
          kind: "table",
          caption: "The pathway, in two versions",
          head: ["Stage", "Oxford handbook (2020)", "EAPCI core curriculum (2020, published 2021)"],
          rows: [
            ["Before cardiology", "1–2 years of general medicine", "Not specified in the passages used here"],
            ["General cardiology", "3–4 years, with exposure to invasive and non-invasive work; a prerequisite for subspecialty training", "At least four years of full-time general cardiology"],
            ["Interventional training", "Ideally a 2-year apprenticeship or fellowship plus formal learning", "At least two years of full-time, dedicated subspecialty training"],
            ["Procedure numbers", "Supervised procedures of rising complexity, minimum 200 PCIs", "No minimum or optimal number; competencies are assessed instead"],
            ["Formal learning", "At least 30 full days of accredited sessions (240 hours) during the 2 years, and involvement in research", "Structured learning under supervision, about two hours a day suggested; research participation recommended"],
          ],
        },
        {
          kind: "check",
          stem: "A trainee notes that her logbook will reach 200 PCIs six months before her two years of fellowship end and asks whether she will then have met the European standard. What is the most accurate answer?",
          options: [
            "Yes: 200 PCIs is the EAPCI 2020 threshold, after which the remaining months of fellowship are optional",
            "No: 200 is Oxford's minimum; EAPCI 2020 sets no number but needs two full-time years and assessed competencies",
            "No: the 2020 curriculum requires at least 800 PCIs per trainee, logged as first operator, before certification",
            "Yes, provided that her supervisor has performed more than 1000 PCIs and has over five years of practice",
          ],
          answer: 1,
          explanation:
            "Oxford's model fellowship states a minimum of 200 PCIs; the EAPCI 2020 curriculum chose not to set procedure numbers and asks for at least two years of full-time subspecialty training with formal assessment. The 800 figure is Oxford's annual volume for an accredited centre, and the supervisor's 1000 PCIs is a centre requirement, not a trainee standard.",
        },
        { kind: "h", text: "What the curriculum expects you to be able to do" },
        {
          kind: "list",
          items: [
            "Define the right indication and timing for PCI while using the available resources cost-effectively.",
            "Explain the advantages and drawbacks of medical treatment, PCI and surgery to patients, families and the multidisciplinary team.",
            "Have the knowledge and practical skill to perform PCI as an independent first operator.",
            "Manage the patient before, during and after the procedure: choice of access, adjunctive drugs, adjunctive techniques, complications, haemostasis, follow-up and secondary prevention.",
          ],
        },
        { kind: "h", text: "Where you train" },
        {
          kind: "table",
          caption: "Requirements for a centre that trains interventional cardiologists",
          head: ["Item", "Oxford handbook", "EAPCI 2020"],
          rows: [
            ["Unit", "An independent interventional unit integrated with the cardiology department", "A catheter laboratory with 24-hour on-call PCI; Heart Team meetings that include clinical cardiologists"],
            ["Volume", "More than 800 coronary interventions a year", "No specific volume; follow national minimums; public reporting of training programmes, volumes and outcomes advised"],
            ["Data", "An electronic record of every diagnostic and interventional case, audited regularly by the national society", "The same audited database, a performance report at least annually, and a quality and radiation-safety programme"],
            ["Trainers", "At least two supervisors, each with more than 1000 PCIs and more than 5 years of interventional practice", "At least two trainers with more than five years' experience; trainees should not outnumber trainers"],
            ["Advanced work", "Not specified", "Standard centres: intravascular imaging (IVUS and/or OCT) and pressure-based physiology (FFR or iFR) are mandatory; involvement in complex PCI such as left main and multivessel disease is strongly recommended; left ventricular support (an intra-aortic balloon pump or a microaxial flow pump), a CTO programme and rotational atherectomy are desirable but not mandatory; institutional coronary and structural Heart Teams are encouraged even without TAVI. Advanced centres: everything a standard centre needs, plus a structural heart programme with at least TAVI (according to national regulation), transseptal procedures and a structured CTO programme; other structural and interventional procedures (for example stroke, carotid, peripheral, adult congenital, septal ablation and left atrial appendage occlusion) are recommended; a Heart Team is mandatory"],
            ["Research", "Trainees involved in research", "An active clinical research programme or trial involvement is mandatory for centres"],
          ],
        },
        { kind: "h", text: "The logbook, done properly" },
        {
          kind: "steps",
          title: "Keeping a logbook that will stand up at accreditation",
          items: [
            {
              title: "1. Use the recognised template",
              detail: "Oxford recommends the ESC-endorsed CARDS (Cardiology Audit and Registration Data Standards) template for interventional cardiology, because the logbook is one of the main documents you present for final accreditation and for reaccreditation.",
            },
            {
              title: "2. Record each case in full",
              detail:
                "Date; diagnostic or interventional; first or second operator; vascular access; presentation (elective stable disease, urgent acute coronary syndrome, or emergency primary PCI or shock); complexity (left main stem, bifurcation, calcified lesion, multivessel disease, vein graft, chronic total occlusion); special techniques (intravascular imaging, invasive physiology, laser, rotational atherectomy, distal protection filters, thrombus aspiration); and complications with their management (perforation, dissection, lost equipment).",
            },
            {
              title: "3. Record your role honestly",
              detail: "First or second operator is the field that maps onto the entrustment levels. Inflating it hides exactly the gaps that a supervisor needs to see.",
            },
            {
              title: "4. Have it signed off",
              detail: "For trainees Oxford asks for monthly review and sign-off. After training the logbook remains part of the annual appraisal and of revalidation.",
            },
            {
              title: "5. Read it for gaps",
              detail: "Sort by access route, presentation, complexity and technique each quarter. An empty column (no femoral cases, no imaging, no complications managed) is next quarter's training plan.",
            },
          ],
        },
        { kind: "tip", id: "pci-operator-log-the-case" },
        {
          kind: "check",
          stem: "In a quarterly review you sort your logbook and find 140 PCIs, all radial, 6 with intravascular imaging, none involving a calcified lesion or a vein graft, and no complications recorded. What should the review produce?",
          options: [
            "Nothing yet: the total is on track, and the complexity mix will even out by itself over the next year",
            "A plan for femoral, imaging-guided, calcified and graft cases, and for supervised complication management",
            "A request to record future second-operator cases as first-operator cases, so as to reach the target faster",
            "A decision to stop logging radial cases, since that route is already well represented",
          ],
          answer: 1,
          explanation:
            "The logbook's complexity, technique and complication fields exist so that gaps show. Here the gaps are femoral access, imaging, calcium, grafts and complications, and each needs planned, supervised exposure. Recording your role inaccurately defeats the purpose and is dishonest; continuing to log every case keeps the record complete.",
        },
        { kind: "h", text: "Certification and the job afterwards" },
        {
          kind: "p",
          text: "In 2018 the EAPCI launched certification for interventional cardiologists in two parts: Part A, a written multiple-choice test on the core curriculum, and Part B, a practical skills assessment. Oxford describes access as requiring EAPCI membership and either national board certification in cardiology or current specialist training confirmed by the training director; when Oxford was written Part B was still being developed and certification was granted on passing Part A, valid for 5 years before recertification. The 2020 curriculum states that full certification requires both parts. Oxford's own programme ends with a final examination: 100 multiple-choice questions in 120 minutes and 50 questions on 10–20 case studies. Check the current rules before you plan, because they may have changed since both sources were written.",
        },
        {
          kind: "p",
          text: "The consultant job that follows is wider than the lab. Oxford describes clinical duties from before the procedure to discharge, adds that the cardiologist may also teach medical students, trainees and the lab team, and makes research duties depend on the individual job description. The EAPCI curriculum adds that the work requires lifelong learning and that decisions should rest on the best available evidence and on the four principles of healthcare ethics: autonomy, beneficence, non-maleficence and justice. When you negotiate a post, the job description is where teaching, research and programme time are written down or left out.",
        },
        {
          kind: "pitfalls",
          items: [
            "Planning only for a case number and arriving at the end of training without imaging, physiology, both access routes or complex subsets.",
            "Logging cases in an informal format that does not match the audited template.",
            "Leaving formal learning and research until the final months.",
            "Assuming certification rules from an older source are still current.",
            "Accepting a post whose job description gives no time for the teaching or research you are expected to do.",
          ],
        },
        {
          kind: "pearl",
          text: "Write next year's training plan from the empty columns of this year's logbook, and agree it with your supervisor before the rota is made.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Run a full case from ultrasound-guided puncture to closure, then open the Logbook tab and check that the entry records your role, access, presentation and complexity as Oxford's logbook would.",
        },
        { kind: "video", id: "f8FsMGo91kk", note: "Sensei Podcast episode 101, with Yousif Ahmad." },
        { kind: "video", id: "-heelz-MoJ4", note: "Sensei Podcast episode 96, with David Hildick-Smith." },
        {
          kind: "keypoints",
          items: [
            "Oxford: 1–2 years general medicine, 3–4 years cardiology, a 2-year fellowship with at least 200 supervised PCIs and 30 days (240 hours) of formal learning.",
            "EAPCI 2020: at least four years of cardiology and two full-time years of interventional training; no procedure numbers; competencies assessed.",
            "Training centres: Oxford asks for over 800 interventions a year and two supervisors with over 1000 PCIs and 5 years; EAPCI 2020 sets no volume but asks for 24-hour PCI, audit, research and at least two trainers with over five years.",
            "Logbook: CARDS template; role, access, presentation, complexity, techniques, complications; monthly sign-off in training, then appraisal and revalidation.",
            "EAPCI certification: Part A theory and Part B practical; full certification needs both in the 2020 curriculum.",
            "The job may include teaching and, by job description, research; lifelong learning is part of it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-the-operator-teaching",
      title: "Learning from a teacher, and becoming one: mentorship, teaching and proctoring",
      minutes: 14,
      topics: ["pro-mentorship-teaching"],
      sources: [O("ch 1: Background"), O("ch 2: The cardiologist"), O("ch 2: The nurse"), O("ch 2: The radiographer"), O("ch 11: Results")],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "eapci-curriculum", "karmpaliotis-cto-programme-2013", "calic-remote-proctoring-2024"],
      blocks: [
        {
          kind: "p",
          text: "Cath lab skills are still passed on mostly by apprenticeship. Oxford points out the weakness of that: the training follows the skills and beliefs of the particular trainer, so a trainee also needs an independent reference. Brilakis states the other half plainly: reading will not make anyone an expert interventionalist; expertise comes from deliberate practice, which he describes as working on the areas where you are weak, with a teacher. This lesson is about using teachers well and then being one.",
        },
        { kind: "h", text: "Deliberate practice: how to learn from a case" },
        {
          kind: "steps",
          title: "One case, used deliberately",
          items: [
            {
              title: "1. Name the target before you scrub",
              detail: "Pick one step you do badly (guide engagement from the left radial, wire shaping, stent positioning) and tell your trainer it is today's target. Brilakis sets deliberate practice, aimed at your deficiencies with a teacher, against naive practice; naming the deficiency is where it starts.",
            },
            {
              title: "2. Build the mental picture first",
              detail:
                "Brilakis wrote his manual so that operators build detailed and correct mental pictures of how a PCI can unfold, and he regards such pictures as the key to expert performance. Before the target step, say aloud what you expect to see, what could go wrong and what you will do about it.",
            },
            {
              title: "3. Use the manual's four questions",
              detail:
                "Every step in the Manual of PCI is taught as goal, how, challenges and what can go wrong, and each challenge or complication as causes, prevention and treatment. The same frame works for a trainee's pre-brief and a trainer's questions.",
            },
            {
              title: "4. Get feedback at the moment and afterwards",
              detail:
                "Ask for comments during the step and review the films afterwards, which show what you could not see while working. Oxford wants every stored loop looked at again once the case is over, and treats that look-back as a teaching session open to the whole team.",
            },
            {
              title: "5. Close the loop",
              detail: "Write down what you will change and do it on the next case. Brilakis frames the aim of his book as always improving, for the best outcome for each patient.",
            },
          ],
        },
        { kind: "tip", id: "pci-operator-one-target" },
        { kind: "tip", id: "diag-operator-review-the-runs" },
        {
          kind: "check",
          stem: "A fellow has done 60 diagnostic studies and still struggles to seat a JL from the right radial. Which plan fits Brilakis's account of how expertise develops?",
          options: [
            "Keep doing as many cases as possible on any list, since the volume will correct the problem in time",
            "Read the engagement chapter twice more before the next list, since knowing the technique well is enough on its own",
            "Make right radial left engagement the named target, with trainer feedback during attempts and a film review",
            "Switch to femoral cases for now and wait until the radial problem resolves without further attention",
          ],
          answer: 2,
          explanation:
            "Brilakis contrasts naive practice with deliberate practice: working on a specific deficiency with a teacher. More of the same cases without a target is naive practice; reading alone, he says, will not make you an expert; avoiding the route leaves the gap in place, and Brilakis expects expertise in both routes.",
        },
        { kind: "h", text: "Roles in a training programme" },
        {
          kind: "table",
          caption: "Who teaches whom (EAPCI 2020 and Oxford)",
          head: ["Role", "What they do"],
          rows: [
            ["Director of training (national or regional)", "Leads training at national or regional level"],
            ["Cath lab director or supervisor", "Responsible for the interventional unit and for trainees meeting their objectives"],
            ["Training (educational) mentor", "Organises the trainee's programme: rotations, courses and structured learning"],
            ["Clinical trainers (clinical mentors)", "Supervise and teach in the lab day to day"],
            ["Level V operator", "Any independent operator who can also teach and supervise juniors"],
            ["Consultant cardiologist (Oxford)", "May also have teaching duties towards medical students, trainees and the lab team"],
            ["Radiographer (Oxford)", "Teaches other staff radiation protection and trains junior radiographers"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Structured learning.** The EAPCI curriculum suggests about two hours a day under supervision: explicit learning (journal club, postgraduate teaching, evidence-based medicine exercises) and implicit learning (ward rounds, case-based discussion, supervised skill acquisition).",
            "**Ratio.** Trainees should not outnumber trainers; ideally full-time trainers match or exceed trainees.",
            "**Accountability.** Both trainees and training mentors should be assessed periodically.",
            "**The rest of the team.** Oxford's nurse training shows a model worth copying: a supernumerary period (usually 10 weeks, adjusted to the person), locally designed workbooks, observation in every procedure against an assessment grid, and 100% required before sign-off.",
          ],
        },
        { kind: "h", text: "Teaching a trainee at the table" },
        {
          kind: "steps",
          title: "A supervised case from the trainer's side",
          items: [
            {
              title: "1. Agree the level for this activity",
              detail: "Is the trainee assisting (level II) or first operator under your direct supervision (level III)? Say so at the brief, so the team knows who is operating and when you will take over.",
            },
            {
              title: "2. Agree the trainee's target",
              detail: "Choose one step to teach well rather than commenting on everything.",
            },
            {
              title: "3. Let the trainee manage, within safety",
              detail: "Level III includes managing complications as first operator under supervision. Let the trainee lead the first moves of a bail-out while you watch closely, and take over without hesitation when the patient's safety needs it.",
            },
            {
              title: "4. Debrief the same day",
              detail: "Oxford expects the cardiologist to hold a team debrief once the list is over, above all after a complication or when there is something to learn. Start with what the trainee would change.",
            },
          ],
        },
        { kind: "tip", id: "pci-operator-debrief-after-complication" },
        { kind: "h", text: "Mentors and proctors" },
        {
          kind: "p",
          text: "A **mentor** guides a person's development over months or years. A **proctor** is a more experienced operator who works alongside another operator and supervises the procedure. When a US centre set up a dedicated CTO programme, it decided from the start to teach the techniques formally, to have an expert proctor in the room, to vet every case beforehand, to follow written safety rules and to scrub two operators for each case; the authors put forward standards, expert mentoring, joint case review and lab policies as a template that other centres could follow. Proctoring by a more experienced operator is associated with greater CTO success, and remote proctoring through live audio and video with a head-mounted mixed-reality display was feasible in ten CTO procedures, although its effect on outcomes is still to be tested.",
        },
        {
          kind: "check",
          stem: "Your centre is starting a new complex technique. A senior visiting operator offers to scrub in on your first cases. Which arrangement matches the published programme model?",
          options: [
            "The visitor performs every case alone while you watch and take notes from the control room window",
            "You perform the cases alone, and the visitor reviews the stored films with you a month later",
            "The proctor scrubbed with two operators per case, each case vetted beforehand, and agreed safety rules",
            "Remote proctoring only, because it has been shown to improve outcomes over proctoring on site in CTO work",
          ],
          answer: 2,
          explanation:
            "The CTO programme model combined formal teaching, an expert proctor in the room, vetting of each case, written safety rules and two operators per case. Watching from the control room teaches little hands-on skill, and late film review protects no patient. Remote proctoring has been shown to be feasible, not to improve outcomes.",
        },
        {
          kind: "pitfalls",
          items: [
            "Copying one trainer's habits without checking them against an independent reference.",
            "Practising without a named target, then wondering why the same step stays weak.",
            "Supervising silently and then taking over without explaining why.",
            "Skipping the debrief after a complication, when the team most needs it.",
            "Treating a proctored series as proof of independent competence before the proctor has stepped back.",
          ],
        },
        {
          kind: "pearl",
          text: "When you start teaching, use the manual's frame for every step: what is the goal, how is it done, what makes it hard, what can go wrong. A trainee who can answer those four questions for the next step has the mental picture Brilakis aims for; whether they try the step is still the supervisor's decision at the agreed level.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Run a diagnostic study and, before each step, say aloud its goal, how you will do it, the likely challenge and what could go wrong, as if teaching a trainee. At the debrief, name the one step you would make your target next time.",
        },
        { kind: "video", id: "SfBqV2CFc8g", note: "Sensei Podcast episode 141, with Rick Nishimura." },
        { kind: "video", id: "opt-u_NIcbA", note: "Sensei Podcast episode 138, with Arnold Seto." },
        { kind: "video", id: "LG9L5obOz2A", note: "Sensei Podcast episode 99, with Sudhir Rathore." },
        {
          kind: "keypoints",
          items: [
            "Apprenticeship passes on the trainer's beliefs as well as skills; keep an independent reference.",
            "Deliberate practice is targeted work on a weakness with a teacher; reading or repetition alone is not enough.",
            "Teach and debrief with the manual's frame: goal, how, challenges, what can go wrong; causes, prevention, treatment.",
            "Training programmes have a director, a lab director, a training mentor and clinical trainers; trainees should not outnumber trainers; about two hours a day of structured learning.",
            "Review every stored loop after the case and invite the team; debrief at the end of the day, especially after a complication.",
            "A new programme can use formal teaching, an on-site proctor, case vetting, written safety rules and two operators per case.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-the-operator-programme",
      title: "Building a CTO or complex PCI programme",
      minutes: 15,
      topics: ["pro-programme"],
      sources: [B("21"), B("21.1"), B("21.2"), B("21.3"), B("21.4"), B("21.5"), B("21.6"), B("21.8"), B("21.10"), B("21.12"), B("21.13"), B("21.14"), B("7.3"), B("7.4"), B("2.6")],
      refs: ["brilakis-manual-pci", "eapci-curriculum", "karmpaliotis-cto-programme-2013", "young-cto-learning-curve-2019", "zein-cto-experience-2020"],
      blocks: [
        {
          kind: "p",
          text: "A chronic total occlusion is a coronary artery completely occluded, with TIMI 0 flow, for an estimated 3 months or more. Brilakis says the choice of crossing strategy depends on the lesion and on the equipment and expertise available locally, so success is a property of the programme, not only of the operator. The techniques are taught in the three CTO modules (cp-cto-strategy, cp-cto-antegrade, cp-cto-retrograde); this lesson lists what a centre must put in place before the first case and how to judge the results once cases begin. The EAPCI curriculum expects an advanced training centre to have a structured CTO programme.",
        },
        { kind: "h", text: "The building blocks" },
        {
          kind: "steps",
          title: "What the programme provides (Brilakis ch 21, unless stated)",
          items: [
            {
              title: "1. A referral pathway that plans",
              detail:
                "The main indication is improving symptoms. Brilakis advises against treating most CTOs at the same sitting as the diagnostic study, so that there is time to plan, prepare and counsel; planning also cuts contrast, radiation and fatigue and allows tests such as viability. Exceptions exist: an acute coronary syndrome from a failing, badly diseased vein graft, where treating the native CTO is preferred if feasible, or a patient in whom arterial access is very difficult. Access to coronary CT helps: Brilakis finds it can be useful for assessing the occlusion, planning the procedure and choosing working projections with the least foreshortening.",
            },
            {
              title: "2. Diagnostic films good enough to plan from",
              detail:
                "Collateral assessment decides whether a retrograde approach is possible, so Brilakis asks for the collaterals to be filmed well as a routine part of any diagnostic study that finds a CTO: without panning, with the breath held and at low zoom, in the best projections, and long enough for the collaterals to fill completely. A programme should feed this standard back to every diagnostic operator who refers to it.",
            },
            {
              title: "3. Case review before booking",
              detail:
                "Assess the four angiographic features of every CTO: the proximal cap; the length, course and composition of the occlusion; the distal vessel; and the collaterals. The US programme above added routine review of whether each case was appropriate.",
            },
            {
              title: "4. The equipment, in the room",
              detail:
                "Dual (sometimes triple) arterial access, femoral or wrist, with long femoral sheaths or long radial sheaths; dual injection, which Brilakis calls the simplest and most effective way to raise success when contralateral collaterals exist, and which also makes the case safer by showing where the wire is and helping to manage a perforation; large (7 or 8 French) supportive guides, an AL shape for the RCA and an EBU or XB shape for the left system, because 6 French guides limit IVUS-guided cap puncture and complication management; IVUS, with the caveat that IVUS-guided re-entry needs 8 French guides and operators expert in reading IVUS, and that the IVUS catheter in the subintimal space can restrict wire movement; dedicated re-entry systems; guide catheter extensions; long stents; and haemodynamic support, which is used in about 4% of US CTO PCI. Brilakis also lists a facility lacking the necessary equipment among the reasons to delay rather than proceed ad hoc.",
            },
            {
              title: "5. Written protocols for the high-risk moments",
              detail:
                "Monitor the ECG, haemodynamics, radiation and contrast throughout, because CTO PCI can be long and use high doses. Use unfractionated heparin, because it can be reversed after a severe perforation, with Hemochron ACT targets above 300 seconds for antegrade and above 350 seconds for retrograde work (some operators accept above 250 and above 300, checking very often in the low 300s), rechecked every 20–30 minutes once therapeutic. Bivalirudin is best avoided, because its effect cannot be reversed (Brilakis also mentions unpublished guide thrombosis in long cases). Give no glycoprotein IIb/IIIa inhibitor or cangrelor, even after successful crossing and stenting, because small wire perforations can reopen and cause a delayed effusion and tamponade. Treat lesions in a donor artery on the retrograde route, to avoid donor thrombosis; use intravascular imaging to optimise the long stents; and have a team ready for perforation.",
            },
            {
              title: "6. Reasons to stop, agreed in advance",
              detail:
                "Brilakis's reasons to stop (stopping triggers) are a complication, a high radiation dose (usually more than 5 Gy air kerma without crossing or substantial progress), contrast beyond 3.7 times the estimated creatinine clearance, no crossing options left, and patient or physician fatigue. Recent contrast, such as the diagnostic study the same day, counts towards the limit, and a lower threshold is preferable in chronic kidney disease or a single kidney (Brilakis 2.6). The decision still rests on weighing this patient's risk against the benefit at each stage. Brilakis judges that a STAR bail-out (subintimal tracking and re-entry, now ballooned without a stent to prepare a later attempt), or accepting failure, is often better than escalating into aggressive manoeuvres that risk serious harm.",
            },
            {
              title: "7. People and supervision",
              detail:
                "Brilakis generally prefers antegrade crossing as the first strategy, because retrograde work carries more complications, longer procedures and more radiation and still needs antegrade lesion preparation; he adds that some retrograde complications are caused by the antegrade attempts. Ambiguous proximal caps and flush aorto-ostial CTOs are often approached retrograde from the start (strategy in detail: cp-cto-strategy). His hybrid approach depends on being able to change strategy, including converting to retrograde, which he calls critical for high success in more complex CTOs. A new programme therefore needs operators trained in every strategy it will use; the US programme used formal teaching, an on-site proctor and two operators per case.",
            },
            {
              title: "8. Audit from case one",
              detail:
                "The published programme examined procedural outcomes, in-hospital events and cost; the registry studies below add contrast, fluoroscopy time and bleeding. Record all of them for every case. Compare your results with three benchmarks, not one: new-operator learning curves, what a proctored new programme achieved, and the 85–90% success that Brilakis quotes for experienced centres.",
            },
          ],
        },
        { kind: "tip", id: "pci-operator-cto-kit-before-start" },
        { kind: "tip", id: "pci-operator-cto-second-operator" },
        {
          kind: "check",
          stem: "A district hospital wants to start CTO PCI next month. It has 6 French guides only, no IVUS, no re-entry system and no proctor, and plans to treat CTOs found at diagnostic angiography ad hoc. Which first change best reflects Brilakis and the published programme model?",
          options: [
            "Keep the ad hoc plan, since repeating the arterial access for a second procedure carries more risk",
            "Plan cases with prior review, and secure large guides, IVUS, re-entry kit and an on-site proctor first",
            "Start at once with 6 French guides but restrict the programme to retrograde crossing to avoid needing IVUS",
            "Start at once and add equipment only after the first complication shows which device is needed most",
          ],
          answer: 1,
          explanation:
            "Brilakis discourages ad hoc CTO PCI in most cases, warns that 6 French guides limit IVUS-guided cap puncture and complication management, and lists missing equipment as a reason to delay; the published programme started with formal teaching, an on-site proctor and vetting of each case. The retrograde option is wrong twice over: Brilakis generally prefers antegrade crossing first, because retrograde work brings more complications, time and radiation and still needs antegrade preparation, and retrograde work is not a way around missing equipment.",
        },
        { kind: "h", text: "Reading your results: learning curves and experience" },
        {
          kind: "table",
          caption: "Three studies a new programme should know",
          head: ["Study", "What was found", "What it means for a programme"],
          rows: [
            ["Karmpaliotis 2013: one US centre with a new dedicated programme, 160 consecutive CTO procedures in 145 patients over 15 months (2009–2010)", "Success 85.6%; in-hospital death 0.6%, emergency bypass 0.6%, tamponade 0.6%, myocardial infarction 1.9%; cost per patient higher than non-CTO PCI but a similar contribution margin", "A new programme with standards, proctorship and two operators per case reported outcomes comparable with established centres"],
            ["Young 2019: US CathPCI Registry, 70,916 CTO PCIs by 7,251 new operators (fewer than 10 CTO cases a year)", "Success 61.4%, major events 4.2%; crossing, stenting and success improved as cases accrued, but with more contrast, fluoroscopy and bleeding; major event rates stable beyond the 12th case", "Expect success to climb slowly; watch bleeding and dose as well as success"],
            ["Zein 2020: Michigan registry, 7,389 CTO PCIs", "Success 53% overall, rising from 45% to 65% from the lowest to the highest operator-experience tertile; experience related to success but not to major events; inexperienced operators did better at experienced centres", "The authors suggested selective referral of CTO PCI to experienced operators at highly experienced centres, which challenges small new programmes; this module's way of reconciling that with a new programme is to work with an experienced centre and refer the most complex cases"],
          ],
        },
        {
          kind: "check",
          stem: "After 15 cases your new programme's technical success is 62%, with no tamponade, one major bleed and rising average air kerma. The hospital manager quotes the 85–90% success reported at experienced centres and asks you to stop. What is the best evidence-based reply?",
          options: [
            "Agree to stop at once, because a 62% success rate shows that the programme can never reach experienced-centre results",
            "Keep proctoring and selection, review case choice and technique with the proctor, and audit bleeding and dose too",
            "Propose taking every referral from now on, because only a higher volume of cases will lift the success rate",
            "Stop recording air kerma and bleeding, since technical success is the only end point the audit needs to track",
          ],
          answer: 1,
          explanation:
            "Experienced-centre results (85–90% in Brilakis) are not the right benchmark on their own. Young found a learning curve for success in new operators (61.4% overall), with major events stable after about a dozen cases but bleeding, contrast and fluoroscopy rising, and Zein found experience related to success rather than major events. But the proctored model programme reached 85.6% from its start, so 62% after 15 cases sits within new-operator registry data yet below what a dedicated, proctored programme achieved: the audit should prompt a review of case selection and technique with the proctor, not reassurance alone. Widening selection early and dropping safety measures go the wrong way.",
        },
        {
          kind: "pitfalls",
          items: [
            "Starting with ad hoc cases found on diagnostic lists, without time to plan or counsel.",
            "Running a programme on 6 French guides and no IVUS, so that both cap puncture options and complication management are limited.",
            "Stopping triggers that live only in the operator's head instead of on the plan the team can see.",
            "Giving a IIb/IIIa inhibitor or cangrelor after success (a sealed wire perforation can reopen), or starting bivalirudin, which cannot be reversed.",
            "Judging a new programme against one benchmark only: expert series alone look too harsh, learning curves alone too reassuring.",
            "Auditing success only and missing bleeding, dose and tamponade.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the programme's first page before the first case: indication and selection, the equipment list, the heparin and drug rules, the reasons to stop, who scrubs, and what is audited. Every later case is then measured against the same page.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Open the mid-RCA CTO scenario as if it were the programme's first case. Before wiring, state the selection decision, the equipment you need in the room (access, guide sizes, IVUS, re-entry and support), the ACT targets, the drugs you will avoid and why, and your stopping triggers for air kerma and contrast (counting any contrast already given that day).",
        },
        { kind: "video", id: "64FJxY-NWnE", note: "Lecture: starting a CTO PCI programme." },
        { kind: "video", id: "bagOcjuvmwY", note: "Lecture: how to start a CTO programme (Dallas CVI 2015)." },
        {
          kind: "keypoints",
          items: [
            "Crossing strategy depends on the lesion and on local equipment and expertise: a CTO programme is a service.",
            "Planned, not ad hoc, in most cases; CT access; diagnostic films that show the collaterals.",
            "Equipment: dual access, 7–8 French supportive guides, IVUS (8 French for IVUS-guided re-entry), re-entry systems, guide extensions, support (about 4% of US cases).",
            "Protocols: monitor ECG, haemodynamics, dose and contrast; heparin with ACT above 300 s antegrade and above 350 s retrograde, every 20–30 minutes; bivalirudin best avoided (not reversible); no IIb/IIIa or cangrelor, even after success, because wire perforations can reopen.",
            "Reasons to stop: a complication, usually more than 5 Gy without progress, contrast above 3.7 times creatinine clearance (recent contrast counts), no options left, or fatigue; weigh risk and benefit at each stage.",
            "Judge a new programme against learning curves, a proctored new programme (85.6%) and experienced centres (85–90%), not one of them alone.",
            "New operators improve with experience (Young); experience relates to success, not major events, and experienced centres help (Zein).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-the-operator-evidence",
      title: "Research, reading the trials and judging new devices",
      minutes: 15,
      topics: ["pro-research-innovation"],
      sources: [O("ch 8: Restenosis"), O("ch 8: Drug-eluting stents"), O("ch 8: Bioresorbable scaffolds"), O("ch 8: Stent thrombosis"), O("ch 3: Trends in vascular access"), O("ch 6: Quantification of stenoses"), B("21.8"), B("21.12"), B("10.2")],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "eapci-curriculum", "hopewell-consort-2025", "karacsonyi-crossboss-first-2018", "cutlip-arc-2007", "garcia-garcia-arc2-2018", "palmerini-des-thrombosis-2012", "esc-revasc-2018"],
      blocks: [
        {
          kind: "p",
          text: "Interventional cardiology changes through devices and trials faster than most specialties, and the operator has to decide which changes to adopt. The EAPCI curriculum makes active research mandatory for training centres, recommends that trainees take part, and expects decisions to rest on the best available evidence; Brilakis says of his own algorithms that they are the authors' methods, not necessarily the best ones, and invites improvement. This lesson turns the history in the two manuals into a method for reading evidence.",
        },
        { kind: "h", text: "Appraising a study, step by step" },
        {
          kind: "steps",
          title: "Seven questions for any trial or registry",
          items: [
            {
              title: "1. What was compared, and how were patients allocated?",
              detail:
                "A randomised trial compares strategies in patients allocated by chance; a registry describes what happened in practice. Oxford notes that the change from femoral to radial access was driven by both randomised trials and registry data.",
            },
            {
              title: "2. Who was studied?",
              detail:
                "Oxford observes that the drug-eluting stent trials showed fewer target-lesion revascularisations and adverse events in highly selected populations; in harder lesions and everyday patients, both big registries and smaller trials found benefit in the same direction, but smaller. Ask whether your patient would have been enrolled.",
            },
            {
              title: "3. Is the end point clinical or a surrogate?",
              detail:
                "Angiographic restenosis is much commoner than clinical restenosis (which occurs in only about 10% of patients, a figure from Oxford's account of the balloon and bare-metal stent eras), so Oxford calls it a controversial surrogate in trials, and planned follow-up angiography that finds restenosis without symptoms inflates repeat revascularisation rates. Late lumen loss, the renarrowing in millimetres between the post-procedure and follow-up angiograms, predicted restenosis when drug-eluting stents were compared with bare-metal stents, but whether the late-loss advantage of one drug-eluting stent over another translates into clinical benefit was, in Oxford's words, still to be seen.",
            },
            {
              title: "4. Were the outcomes defined in the same way?",
              detail:
                "Oxford explains that the frequency of stent thrombosis was hard to establish because definitions were inconsistent and follow-up in randomised trials was limited, which is why the Academic Research Consortium agreed standard definitions at meetings in 2006 (published in 2007). Those definitions were updated in 2018 as the ARC-2 consensus, which revisited them for more complex patients and newer devices and is advocated for coronary device trials. Also ask how the measurement itself varies: Oxford puts inter-observer variability in visual grading of moderate lesions at about ±20%.",
            },
            {
              title: "5. Was follow-up long enough?",
              detail: "Oxford reports concern about stent thrombosis occurring very late after drug-eluting stent implantation, sometimes despite continued dual antiplatelet therapy, looks to large studies with prolonged follow-up for answers, and lists relatively short-term efficacy and safety data among its considerations with these stents. Events that appear late are missed by short trials. Those concerns were about the first-generation paclitaxel- and sirolimus-eluting stents. Brilakis notes that newer-generation drug-eluting stents are now used in the vast majority of patients because they give less restenosis and less stent thrombosis than bare-metal stents (vein grafts excepted); a network meta-analysis of 49 trials found definite stent thrombosis lower with cobalt-chromium everolimus-eluting stents than with bare-metal stents up to 2 years; and the 2018 ESC/EACTS revascularisation guideline recommends drug-eluting over bare-metal stents for any PCI.",
            },
            {
              title: "6. Was the result a difference, or no difference?",
              detail:
                "In the CrossBoss First trial, 246 patients at 11 US centres were randomised to a blunt dissection catheter first or to antegrade wire escalation. Crossing time (56 against 66 minutes), success and major events did not differ significantly, nor did equipment use or cost. A well-designed neutral trial is still informative: it did not show the new strategy to be better on the measures tested. It is not proof that the two are equivalent; before drawing that conclusion, check the sample size calculation and the confidence intervals, which show how large a difference the trial could have missed.",
            },
            {
              title: "7. Was it reported completely?",
              detail: "The CONSORT 2025 statement gives a 30-item checklist and a participant flow diagram that a randomised trial report should contain, including a new open-science section. Use it as a reading checklist: if the flow of patients or the primary outcome is missing, be wary.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A new stent shows lower late lumen loss than the current one at 9-month angiography in a randomised trial of patients with short, simple lesions. There is no clinical end point. What can you conclude?",
          options: [
            "The new stent reduces clinical restenosis in all patients, because late loss always predicts clinical events",
            "It may be promising, but late loss is a surrogate, the patients were selected, and clinical benefit is unproven",
            "The result can be ignored, because randomised trials in selected patients carry no information about efficacy",
            "The new stent should replace the current one, because angiographic follow-up is the most reliable end point of all",
          ],
          answer: 1,
          explanation:
            "Oxford notes that late loss predicted restenosis in comparisons with bare-metal stents but that it was uncertain whether a late-loss advantage between drug-eluting stents translates into clinical differences; it also notes that in the drug-eluting stent trials, highly selected populations showed larger effects than real-world patients. The trial is informative, but it does not prove clinical benefit, and angiographic follow-up itself inflates repeat revascularisation.",
        },
        { kind: "h", text: "How devices and techniques reach practice, and sometimes are held back" },
        {
          kind: "table",
          caption: "Four histories from the manuals",
          head: ["Innovation", "What happened", "Lesson for appraisal"],
          rows: [
            ["Drug-eluting stents", "Restenosis came mainly from neointimal growth once stents had removed recoil and negative remodelling; the similarity to tumour cell growth led to anticancer and immunomodulatory drugs carried on polymer coatings. First-generation paclitaxel and sirolimus stents reduced target-lesion revascularisation and adverse events in trials; very late stent thrombosis then raised new concern (Oxford). Newer-generation stents now give less restenosis and less stent thrombosis than bare-metal stents (Brilakis; Palmerini 2012) and are recommended for PCI in the 2018 ESC/EACTS guideline", "Benefit on one end point can be followed by a safety signal that needs longer follow-up and standard definitions, and later generations need their own evidence"],
            ["Bioresorbable scaffolds", "After nearly 30 years of uncertain research the first polymer scaffold was widely tested; several scaffolds were approved in Europe and the USA, yet in the light of the randomised data the 2018 European guideline did not recommend them outside clinical studies, and research on the first-generation limitations continues (Oxford)", "A plausible mechanism is not proof; approval is not guideline endorsement, and randomised data can reverse enthusiasm"],
            ["STAR (subintimal tracking and re-entry)", "Uncontrolled re-entry meant stenting long segments, losing side branches, with high restenosis and reocclusion; it became a bail-out (balloon, no stent, then another attempt 2–3 months later). Limited dissection and re-entry techniques were then developed to reduce injury and stent length and to keep side branches, and have been linked with favourable clinical outcomes (Brilakis)", "Outcome data can turn a technique into a bail-out and drive a better one"],
            ["Radial access", "Randomised trials and registries showed less bleeding and lower mortality; the mortality benefit was thought, not proven, to come from fewer bleeds. Other benefits are quicker mobilisation, comfort and lower cost; drawbacks include radial occlusion, which matters if dialysis access or arterial grafting may be needed. Uptake still varies by operator and institution, and a newer concern about higher operator radiation dose shows that an adopted change still needs follow-up evidence (Oxford)", "Separate the shown effect from the suggested mechanism; evidence alone does not change practice"],
          ],
        },
        {
          kind: "check",
          stem: "Two studies report that the FFR of a donor artery rose after a CTO it supplied was opened, one by 0.03 and one by 0.10. How should you use these figures when measuring a donor artery before CTO PCI?",
          options: [
            "Ignore them, because two studies that give different figures cancel each other out entirely",
            "Use their average, 0.065, as a fixed correction to apply to every donor artery you measure",
            "Allow for a possible rise of 0.03 to 0.10 after recanalisation when reading borderline values",
            "Assume the donor FFR will fall after recanalisation, because the collateral demand disappears",
          ],
          answer: 2,
          explanation:
            "Brilakis cites two studies, giving increases of 0.03 and 0.10, and says that the significance of a donor lesion may change after recanalisation and that this should be taken into account when assessing donor vessels. He gives no reason for the different figures, so the useful reading is a possible rise within that range, not a single averaged correction, and certainly not a fall.",
        },
        {
          kind: "list",
          items: [
            "**Take part.** The EAPCI curriculum recommends trainee participation in clinical or translational research and asks centres for an active research programme or trial involvement; Oxford's formal learning also expects research involvement.",
            "**Read regularly.** Journal clubs and evidence-based medicine exercises are part of the structured learning the curriculum suggests.",
            "**Feed back.** Brilakis asks readers to send feedback so that his algorithms can be improved, and hopes that algorithms for every PCI procedure will become freely available and continually improved.",
          ],
        },
        { kind: "tip", id: "diag-operator-moderate-lesion-measure" },
        {
          kind: "pitfalls",
          items: [
            "Adopting a device on a surrogate end point such as late loss or crossing time alone.",
            "Applying an expert-centre or selected-population result to every patient and every operator.",
            "Reading a neutral trial as 'no information', or as proof that two strategies are equivalent.",
            "Comparing event rates from studies that used different definitions or follow-up lengths.",
            "Confusing the mechanism a study proposes with the effect it showed.",
            "Using a single study's number as a fixed correction when other studies give a range.",
          ],
        },
        {
          kind: "pearl",
          text: "This module's rule of thumb for any new device: ask four things before you use it. Was it randomised against what you do now, in patients like yours, on a clinical end point with standard definitions, with long enough follow-up? If any answer is no, weigh it with caution, ideally within a study.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "estimate",
          task: "Estimate the diameter stenosis of each lesion, then compare with the reference value. Note how far your estimates stray in moderate lesions compared with mild and severe ones, the variability that makes visual grading a soft end point. Remember Oxford's other limits of the angiogram: in extreme cases it can make a lesion look up to 50% less severe than it is, it resolves only about 0.2 mm, and its appearance may not match the lesion's physiological effect.",
        },
        { kind: "video", id: "-hOsoZZNt6g", note: "The CrossBoss First randomised controlled trial." },
        { kind: "video", id: "wYFG4aC_J8s", note: "Sensei Podcast episode 151, with Marco Valgimigli." },
        { kind: "video", id: "Ry3XMHIzalk", note: "Lecture: the five most important trials of 2015 (Dallas CVI 2016)." },
        { kind: "video", id: "u3RHDe7k-gQ", note: "Lecture: robotic PCI (Dallas CVI 2016)." },
        {
          kind: "keypoints",
          items: [
            "Appraise: allocation, population, clinical or surrogate end point, standard definitions, follow-up, difference or no difference, completeness of reporting.",
            "Angiographic restenosis and late loss are surrogates; planned angiographic follow-up inflates repeat revascularisation.",
            "Stent thrombosis needed the Academic Research Consortium definitions (agreed 2006, published 2007, updated as ARC-2 in 2018) because earlier trials defined and followed it inconsistently.",
            "In the drug-eluting stent trials, highly selected populations showed larger effects than the real-world registries (Oxford); the first-generation safety concerns do not apply unchanged to newer stents.",
            "A neutral randomised trial (CrossBoss First) showed no advantage for the new strategy; it is not by itself proof of equivalence.",
            "Bioresorbable scaffolds and STAR show that plausible ideas can fail on outcome data; research participation is expected of trainees and centres.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-the-operator-q1",
      stem: "Which description matches level IV in the EAPCI 2020 core curriculum?",
      options: [
        "First operator managing complications, with a senior interventional cardiologist directly supervising",
        "First operator without direct supervision, with the option of reviewing cases afterwards with seniors",
        "Some procedural skill, usually acting as the assistant or second operator to a senior colleague",
        "First operator without direct supervision who can also teach and supervise junior colleagues",
      ],
      answer: 1,
      explanation:
        "Level IV is independent first-operator practice, with post hoc review possible. Direct supervision while managing complications is level III; assisting is level II; adding the ability to teach and supervise makes level V.",
      difficulty: 1,
      refs: ["eapci-curriculum"],
    },
    {
      id: "hb-the-operator-q2",
      stem: "How do the Oxford handbook and the EAPCI 2020 curriculum differ on procedure numbers for interventional trainees?",
      options: [
        "Both require 800 PCIs, the figure being the trainee's personal total across the two years of fellowship",
        "Oxford names a minimum of 200 PCIs; the 2020 curriculum sets no minimum and assesses competencies",
        "Oxford sets no number; the 2020 curriculum requires 200 PCIs plus 30 days of courses",
        "Both name 1000 PCIs, which is also the requirement for a supervisor in a training centre",
      ],
      answer: 1,
      explanation:
        "Oxford's fellowship lists supervised procedures of increasing complexity with a minimum of 200 PCIs. The EAPCI 2020 curriculum chose not to set minimum or optimal numbers because numbers alone do not describe proficiency. 800 is Oxford's yearly centre volume and 1000 PCIs its supervisor requirement.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "eapci-curriculum"],
    },
    {
      id: "hb-the-operator-q3",
      stem: "AMEE Guide 140 recommends that each entrustable professional activity be described in eight parts. Which of these is one of them, and why does it matter to an operator?",
      options: [
        "The minimum number of cases, because entrustment is awarded once that number is reached",
        "The time until the entrustment expires if the activity is not practised, because skills lapse",
        "The trainee's examination score, because it replaces the supervisor's judgement of the activity",
        "The name of the supervising consultant, because entrustment belongs to the trainer and not the activity",
      ],
      answer: 1,
      explanation:
        "The eight parts are the title, specification and limitations, risks of failure, competency domains, knowledge, skills, attitudes and experience, information sources for assessment, the expected entrustment level at each stage, and the time to expiry if not practised. Expiry is why an activity you stop doing must be refreshed. Experience is part of one section, but entrustment rests on the information sources and the supervisor's judgement, not on reaching a number.",
      difficulty: 2,
      refs: ["tencate-epa-guide-2020"],
    },
    {
      id: "hb-the-operator-q4",
      stem: "According to Oxford, which centre would qualify to offer accredited interventional training?",
      options: [
        "An independent unit within cardiology, 950 interventions a year, an audited database, and two supervisors each with 1200 PCIs and 8 years",
        "A unit performing 2000 interventions a year with an audited database and one supervisor with 3000 PCIs and 20 years of interventional practice",
        "An independent interventional unit doing 600 interventions a year with an audited database and three supervisors with 1500 PCIs each",
        "A unit performing 1200 interventions a year with two supervisors of 1100 PCIs and 6 years each, but with no procedural database",
      ],
      answer: 0,
      explanation:
        "Oxford's requirements are an independent unit integrated with cardiology, more than 800 coronary interventions a year, an electronic database audited by the national society, and at least two supervisors each with more than 1000 PCIs and more than 5 years' experience. One supervisor, 600 cases a year or no database each fails a requirement, however strong the rest.",
      difficulty: 3,
      refs: OXFORD,
    },
    {
      id: "hb-the-operator-q5",
      stem: "Which entry would be incomplete as a logbook record under the field list Oxford gives?",
      options: [
        "Date, PCI, first operator, right radial, urgent ACS, bifurcation, intravascular imaging, no complication",
        "Date, PCI, second operator, femoral, elective stable disease, calcified lesion, rotational atherectomy, dissection treated with a stent",
        "Date, PCI, first operator, left radial, CTO, intravascular imaging, perforation sealed",
        "Date, diagnostic, first operator, right radial, elective stable disease, no complex features, no special techniques, no complication",
      ],
      answer: 2,
      explanation:
        "Oxford's logbook records date, diagnostic or interventional, first or second operator, access, clinical presentation (elective, urgent or emergent), complexity, special techniques and complications. The CTO entry has no presentation, so it cannot be sorted into elective, urgent or emergency work. The others carry every field.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-the-operator-q6",
      stem: "Brilakis says reading his manual will not make anyone an expert. What does he say is needed instead?",
      options: [
        "A high annual volume of cases on any list, since repetition itself builds expertise over the years",
        "Deliberate practice: working to improve the areas where you are deficient, with a teacher",
        "Memorising every algorithm in the book until each can be recited without referring to it",
        "Passing the theoretical part of a certification examination early in the fellowship",
      ],
      answer: 1,
      explanation:
        "Brilakis contrasts naive practice with deliberate practice, which he describes as a teacher helping you work on the things you do poorly, and he regards detailed, correct mental pictures of how a PCI can unfold as the key to expert performance. Volume without a target is naive practice, and he describes his algorithms as open to improvement rather than as material to recite.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "hb-the-operator-q7",
      stem: "A hospital starts a CTO programme. Which combination did the published single-centre programme (Karmpaliotis 2013) require?",
      options: [
        "Single operators from the very first case, ad hoc treatment of CTOs found at diagnostic angiography, and a review of the results after one year",
        "Formal teaching of the techniques, an expert proctor on site, vetting of every case, written safety rules and two operators scrubbed per case",
        "Remote proctoring alone, a retrograde-first crossing strategy for every lesion, and no formal process for selecting cases",
        "Treatment only of short occlusions with tapered caps, by a single operator, until the programme's success rate had reached 90%",
      ],
      answer: 1,
      explanation:
        "The programme set out formal teaching, an on-site proctor, vetting of each case for appropriateness, written safety rules and two operators per case, and reported 85.6% success in its first 160 procedures. Ad hoc single-operator work is what Brilakis discourages, and remote proctoring was a later feasibility idea, not part of that model.",
      difficulty: 2,
      refs: ["karmpaliotis-cto-programme-2013", "brilakis-manual-pci"],
    },
    {
      id: "hb-the-operator-q8",
      stem: "In the US registry of new CTO operators (Young 2019), what happened as operators accumulated cases?",
      options: [
        "Success and major events both improved steadily, and bleeding fell to the level of non-CTO PCI",
        "Success did not change, but major events fell sharply with every additional five cases performed",
        "Success improved, at the cost of more contrast, fluoroscopy and bleeding; major events were stable after about the 12th case",
        "Success fell as operators took on harder lesions, while their contrast use and fluoroscopy time both declined over the same period",
      ],
      answer: 2,
      explanation:
        "Crossing, stenting and success improved with accrued volume, but with increased contrast, fluoroscopy time and bleeding, and major event rates were stable beyond the 12th case. That is why a new programme must audit dose and bleeding, not success alone.",
      difficulty: 3,
      refs: ["young-cto-learning-curve-2019"],
    },
    {
      id: "hb-the-operator-q9",
      stem: "In the Michigan registry (Zein 2020), inexperienced CTO operators did better in one setting. Which, and what did the authors suggest?",
      options: [
        "At low-experience hospitals, because they selected easier cases; they suggested spreading CTO work widely",
        "At high-experience centres, with higher success but similar major events; they suggested referral to experienced operators at experienced centres",
        "At high-experience centres, with fewer major events but similar success rates; the authors suggested mandatory proctoring for every new CTO operator",
        "In no setting, because experience was unrelated to success; they suggested that volume targets for operators be abandoned altogether",
      ],
      answer: 1,
      explanation:
        "Operator and hospital experience related to procedural success (45% to 65% across operator tertiles) but not to major events, and inexperienced operators at high-experience centres had higher success than those at low-experience hospitals. The authors suggested selective referral to experienced operators at experienced centres.",
      difficulty: 3,
      refs: ["zein-cto-experience-2020"],
    },
    {
      id: "hb-the-operator-q10",
      stem: "Why does Oxford call angiographic restenosis a controversial end point in stent trials?",
      options: [
        "Because it is rarer than clinical restenosis, so that trials built on it would need impractically large numbers of enrolled patients",
        "Because it is much commoner than clinical restenosis, and finding it at planned angiography inflates repeat revascularisation",
        "Because restenosis can be measured only with intravascular ultrasound, which few trials have been able to use",
        "Because restenosis was abolished by bare-metal stents, so it no longer occurs in contemporary trials",
      ],
      answer: 1,
      explanation:
        "Angiographic restenosis is much commoner than clinical restenosis (about 10% of patients in the balloon and bare-metal stent eras that Oxford describes), and finding restenosis without symptoms on routine scheduled angiograms leads to more repeat revascularisation than symptoms alone would. Bare-metal stents reduced restenosis (from about 25% to 10–15% with successive generations) but did not abolish it.",
      difficulty: 3,
      refs: OXFORD,
    },
  ],
  sims: [
    { sim: "cathlab", task: "Take a held-out exam case in Assessment, then read the EPA description and your level for that activity in Competencies and logbook." },
    { sim: "procedure", task: "Run a full case and check that the logbook entry records role, access, presentation and complexity." },
  ],
  caseIds: ["hb-the-operator-case-first-cto"],
};

// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "hb-the-operator-case-first-cto",
    title: "The first cases of a new CTO programme",
    trackId: "cath-handbook",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, Introduction, 7.1.8, 7.3.1 and 2.6 (contrast volume), 28.2.3 (radiation skin injury follow-up) and chapter 21 (planning, monitoring, medications, access, engagement, reasons to stop); Oxford Handbook ch 2 (the cardiologist: debrief, duty of candour, logbook) and ch 11 (results review); the published CTO programme model (Karmpaliotis 2013) and registry data on CTO learning curves and experience (Young 2019, Zein 2020).",
    },
    summary:
      "A newly appointed consultant starting a CTO programme with a visiting proctor follows one referral from the diagnostic list to a failed first attempt, then defends the programme at its first audit.",
    presentation:
      "A 63-year-old man with angina on mild exertion despite two anti-anginal drugs. A colleague's diagnostic angiogram this morning showed a chronic total occlusion of the mid right coronary artery, filling by collaterals from the LAD, with good LV function and no other significant disease; the collaterals were not filmed until fully opacified. Estimated creatinine clearance 72 mL/min. You were appointed three months ago; your hospital has agreed to start a CTO programme, and you have done six CTO cases as second operator during training. The patient, still on the table, asks whether you can 'just open it now'.",
    findings: [
      "Sinus rhythm 68/min, blood pressure 132/78 mmHg",
      "Right radial 6 French sheath from the diagnostic study; 160 mL of contrast already given",
      "Mid-RCA occlusion with a blunt-looking cap; collaterals incompletely filmed",
      "The hospital has 6, 7 and 8 French guides, IVUS and one dissection re-entry system; a visiting CTO proctor can attend booked lists",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The patient asks you to open the occlusion now. What do you do?",
        options: [
          {
            text: "Explain that CTO PCI is planned, not ad hoc; finish the study and book a film review, any tests and a proctored list",
            best: true,
            feedback:
              "Brilakis discourages ad hoc CTO PCI in most cases: planning time allows counselling, viability testing if needed, lower contrast and radiation and less fatigue. This patient is stable and his collaterals were not fully filmed, so the plan cannot yet be made. His consent covered a diagnostic study, not CTO PCI (inadequate consent is one of Brilakis's reasons to delay), and the 160 mL already given counts towards today's contrast limit (Brilakis 2.6).",
            stateDelta: { stability: 5, flags: ["planned"] },
          },
          {
            text: "Proceed now through the right radial sheath with a 6 French guide, since a second procedure carries its own risks for him",
            feedback:
              "Avoiding a second procedure is the advantage of ad hoc PCI, but for CTOs Brilakis discourages it in most cases; here the contrast already given, the incomplete collateral films, the 6 French guide and the absence of a proctor all argue against it.",
            next: "c-adhoc",
            stateDelta: { stability: -15, flags: ["ad-hoc"] },
          },
          {
            text: "Book a planned list, but without reviewing the films or arranging further imaging of the collaterals first",
            acceptable: true,
            feedback:
              "Planning is right, but the plan rests on the four angiographic features, and the collaterals, which decide whether a retrograde option exists, have not been seen properly. Brilakis wants them filmed until fully opacified when a CTO is found.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "c-adhoc",
        kind: "consequence",
        prompt: "Forty minutes later the wire has not crossed, the contrast total is 290 mL and the 6 French guide keeps backing out. What now?",
        info: "Air kerma 2.1 Gy. The patient is comfortable. No complication so far.",
        options: [
          {
            text: "Stop, explain to the patient, and plan a staged attempt with proper films, larger guides, dual access and the proctor",
            best: true,
            feedback:
              "Correct. The contrast limit of 3.7 times his creatinine clearance (about 266 mL) has already been passed, and the 290 mL includes the diagnostic dose, which counts; that is one of Brilakis's reasons to stop on its own, and he notes that accepting failure is often better than pushing aggressive strategies. Stop now, recheck his renal function after the procedure, and keep a planned attempt safe.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Escalate to a stiff high-penetration wire and keep going, since the patient is comfortable and nothing has gone wrong yet",
            feedback:
              "A stiff wire pushed with poor support and no contralateral injection can leave the vessel unnoticed, and the contrast (290 mL) has already passed 3.7 times his creatinine clearance (about 266 mL).",
            stateDelta: { stability: -12, flags: ["pushed-adhoc"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "At the planning meeting you review new films, which show a long blunt occlusion with good septal collaterals from the LAD. How do you set up the first list?",
        info: "The proctor has agreed to attend. The programme protocol is in draft.",
        options: [
          {
            text: "Proctor scrubbed as second operator; dual access with 7–8 French AL and EBU guides; IVUS and re-entry kit; written heparin plan and stop triggers",
            best: true,
            feedback:
              "This is the programme model and Brilakis's set-up: on-site proctorship and two operators, dual injection, large supportive guides, IVUS (8 French if IVUS-guided re-entry may be needed) and protocols that the team can see.",
            stateDelta: { stability: 5, flags: ["proctored"] },
          },
          {
            text: "Single operator, a single right radial 6 French guide and no contralateral injection, to keep the first case as simple as possible",
            feedback:
              "Dual injection is the simplest and most effective way to raise CTO success when contralateral collaterals exist, and 6 French guides limit IVUS-guided cap puncture and complication management. Working alone on your first programme case drops the safety that proctorship gives.",
            next: "c-kit",
            stateDelta: { stability: -12, flags: ["under-equipped"] },
          },
          {
            text: "Dual access, 7 French supportive guides and IVUS in the room, but the proctor observes the case from the control room rather than scrubbing",
            acceptable: true,
            feedback:
              "The kit is right, but a proctor in the control room cannot help with the hands-on decisions; the published programme used on-site proctorship and two operators per case.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "c-kit",
        kind: "consequence",
        prompt: "On the day, the antegrade wire runs into the wall of the occlusion and you cannot tell where it is without a contralateral injection. What now?",
        info: "Single 6 French right radial guide. No LAD injection is possible.",
        options: [
          {
            text: "Add a second arterial access and a guide in the left system for dual injection before going further",
            best: true,
            feedback: "Correct. Dual injection shows where the wire is and is essential before any further crossing attempt or any device follows the wire.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance a microcatheter over the wire and inject through it to see exactly where the wire tip is sitting",
            feedback:
              "If the wire has left the vessel structure, Brilakis warns against advancing microcatheters or balloons over it, because that can enlarge or create a perforation. Find the wire's position with dual injection first.",
            stateDelta: { stability: -12, flags: ["perforation-risk"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The patient is on the table, with access and guides in place. Which anticoagulation plan do you follow?",
        options: [
          {
            text: "Unfractionated heparin to an ACT above 300 s antegrade (above 350 s retrograde), rechecked every 20–30 minutes",
            best: true,
            feedback: "Heparin is preferred because it can be reversed after a severe perforation; these are Brilakis's targets (measured on a Hemochron analyser; targets differ between devices) and his recheck interval.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Bivalirudin, because its predictable effect avoids the need for repeated ACT checks during a long CTO case",
            feedback:
              "Brilakis advises avoiding bivalirudin in CTO PCI because its effect cannot be reversed if a perforation occurs, and mentions unpublished cases of guide thrombosis in long procedures.",
            next: "c-bival",
            stateDelta: { stability: -10, flags: ["bivalirudin"] },
          },
          {
            text: "Unfractionated heparin to an ACT of 250 seconds, checked once at the start and then without any planned rechecks",
            feedback:
              "Brilakis's targets are above 300 seconds antegrade (some operators accept above 250) and above 350 seconds retrograde, with the ACT checked every 20–30 minutes once therapeutic. A single check at 250 seconds with no rechecks falls short, all the more with a retrograde option in view, and the ACT can drift below target unnoticed.",
            stateDelta: { stability: -8, flags: ["act-drift"] },
          },
        ],
      },
      {
        id: "c-bival",
        kind: "consequence",
        prompt: "The proctor queries the bivalirudin before any wire is advanced. What do you do?",
        options: [
          {
            text: "Stop the infusion and change to unfractionated heparin with ACT monitoring before crossing begins",
            best: true,
            feedback: "Changing to heparin before any wire crosses is this module's suggested correction, not a step either manual describes. The bivalirudin already given cannot be reversed, which is why Brilakis advises not starting it in CTO PCI.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Continue the bivalirudin and keep protamine drawn up and ready in case a perforation occurs",
            feedback: "Unlike heparin, bivalirudin cannot be reversed if a perforation occurs; that is exactly why Brilakis avoids it in CTO PCI.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After 100 minutes, antegrade wiring and a re-entry attempt have failed. Air kerma is 5.4 Gy, contrast 230 mL, and there has been no substantial progress. The patient is stable. What do you do?",
        info: "The septal collaterals remain an option in principle. You and the team have been working since 08:00. The proctor asks which stopping triggers now apply.",
        options: [
          {
            text: "Stop: film to exclude perforation, document the dose, warn him of skin effects with review in a month, and plan with the proctor",
            best: true,
            feedback:
              "More than 5 Gy without crossing or substantial progress is one of Brilakis's reasons to stop, and fatigue is another; weighed against an uncertain gain, both point to stopping, and he notes that accepting failure is often better than highly aggressive strategies. Above 5 Gy air kerma Brilakis also asks for follow-up within a month with a documented skin examination, including the back, and for the patient to know the risk, so that a later skin change is not biopsied in error, which can leave a non-healing ulcer. A planned second attempt, possibly retrograde through the septal collaterals, can start fresh.",
            stateDelta: { stability: 5, flags: ["stopped"] },
          },
          {
            text: "Switch now to the retrograde approach through the septal collaterals, because the procedure has already cost so much time and dose",
            feedback:
              "Changing strategy is the hybrid approach, but not after passing the dose trigger without progress, with a tired team. Adding a retrograde attempt at 5.4 Gy and after 100 minutes is the sunk-cost reasoning the stopping triggers exist to prevent.",
            next: "c-push",
            stateDelta: { stability: -15, flags: ["pushed-on"] },
          },
        ],
      },
      {
        id: "c-push",
        kind: "consequence",
        prompt: "Forty minutes later the retrograde wire has crossed the septal channel but not the occlusion. Air kerma is 7.6 Gy and contrast 330 mL. The proctor suggests stopping.",
        options: [
          {
            text: "Stop now, check the donor and collateral channel for injury, document the dose and contrast, and arrange skin and kidney follow-up",
            best: true,
            feedback: "Correct, though later than it should have been. Brilakis asks for anyone who received more than 5 Gy air kerma to be seen within a month, with the skin examination (back included) documented; tell the patient about the skin risk and what to look for, because an unwarned patient may have a radiation lesion biopsied and left as a non-healing ulcer. Above 10 Gy a qualified physicist should promptly calculate the peak skin dose. Oxford asks the operator to watch for renal failure after the procedure.",
            stateDelta: { stability: 3 },
          },
          {
            text: "Continue for another thirty minutes, because the retrograde wire is close and the septal channel has already been crossed safely",
            feedback: "Contrast is now above 3.7 times creatinine clearance and the dose is far above the trigger; continuing adds risk for an uncertain gain.",
            stateDelta: { stability: -15, flags: ["far-past-limits"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The procedure is over. What do you do before the end of the day?",
        options: [
          {
            text: "Tell the patient why you stopped, debrief with the proctor and team, review the runs, and log a failed attempt as first operator",
            best: true,
            feedback:
              "Oxford asks the cardiologist to tell the patient the outcome, to debrief the team at the end of the day when there are learning points, and to review every stored loop; an honest logbook records role and outcome as they were.",
            stateDelta: { stability: 5, flags: ["debriefed"] },
          },
          {
            text: "Log the case with the proctor as first operator, so that your own success rate is not lowered during the programme's early audit",
            feedback:
              "A logbook that misstates the operator's role hides exactly what a supervisor and an audit need to see, and is dishonest. Your role in the case was first operator.",
            stateDelta: { stability: -10, flags: ["logbook-misstated"] },
          },
          {
            text: "Write the report and move on to the next patient, leaving the debrief and the film review for the monthly meeting",
            acceptable: true,
            feedback:
              "The report is necessary, but the learning is freshest today; Oxford places the debrief at the end of the day, especially after complications or when there are learning points to share.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Six months later the programme has done 15 cases: success 62%, no tamponade, one major bleed, and average air kerma rising. A manager quotes the 85–90% success reported at experienced centres and proposes closing the programme. What do you recommend?",
        options: [
          {
            text: "Keep the proctor and case vetting, review selection and technique, audit bleeding and dose, and refer the hardest cases",
            best: true,
            feedback:
              "Experienced-centre figures (85–90% in Brilakis) are not the right benchmark on their own. Young found that new operators' success (61.4% overall) improves with experience while major events are stable after about a dozen cases, but with more bleeding, contrast and fluoroscopy; Zein found experience related to success, not major events, and his authors favoured selective referral of CTO PCI to experienced operators at experienced centres. The proctored model programme, though, reached 85.6% from its start, so 62% after 15 cases sits within new-operator registry data but below what a dedicated, proctored programme achieved: review case selection and technique with the proctor rather than settling for reassurance. Referring the hardest cases is this module's way of reconciling Zein's advice with a new programme.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Close the programme now, because 62% is far below the 85–90% success that experienced centres report for CTO PCI",
            feedback: "Experienced-centre series are not the right benchmark on their own for a programme in its first 15 cases; registry data show new operators' success rising with experience without a rise in major events. The gap from the proctored model programme (85.6%) calls for review, not closure.",
            stateDelta: { stability: -8, flags: ["closed-early"] },
          },
          {
            text: "Drop proctoring and accept every referral, so that volume, and with it the success rate, rises as quickly as possible",
            feedback:
              "Removing supervision and case selection just as the learning curve is steepest is the opposite of the programme model, and higher volume does not by itself make each case safer.",
            stateDelta: { stability: -10, flags: ["unsupervised"] },
          },
        ],
      },
    ],
    outcome:
      "The patient returned for a planned second attempt with the proctor. The programme continued under its written protocol, with each case audited for success, complications, bleeding, contrast and dose.",
    outcomeVariants: [
      { flag: "ad-hoc", text: "The ad hoc attempt used contrast and time without a usable plan, and the films needed for planning still had to be obtained afterwards; because the contrast had passed his limit, his renal function was rechecked after the procedure." },
      { flag: "pushed-adhoc", text: "Escalating wires on the ad hoc attempt added still more contrast beyond his limit, and his creatinine was rechecked before discharge." },
      { flag: "under-equipped", text: "The first planned case began without dual injection or adequate guides, and time was lost putting them in place." },
      { flag: "perforation-risk", text: "A microcatheter advanced over a wire of unknown position risked enlarging a perforation; the proctor stopped it." },
      { flag: "bivalirudin", text: "The anticoagulant was changed to heparin before crossing; the bivalirudin already given could not be reversed, which is why Brilakis avoids starting it." },
      { flag: "act-drift", text: "Without planned rechecks, the ACT was found below target an hour into the case." },
      { flag: "stopped", text: "Stopping at the trigger avoided a complication; at 5.4 Gy he was told about possible skin effects and reviewed at a month, and a fresh plan was made for the septal collaterals." },
      { flag: "pushed-on", text: "Continuing took the dose from 5.4 to 7.6 Gy and the contrast past his limit, adding skin and kidney risk to a failed attempt." },
      { flag: "far-past-limits", text: "The extra time took both contrast and dose far beyond the limits on the plan." },
      { flag: "logbook-misstated", text: "The misstated logbook entry was corrected at the monthly sign-off, and the audit was rerun." },
      { flag: "closed-early", text: "Closing the programme after 15 cases would have ended it in the steepest part of its learning curve." },
      { flag: "unsupervised", text: "Dropping supervision and selection at this stage removed the measures the published programme relied on." },
    ],
    learningPoints: [
      "Most CTO PCI should be planned, not ad hoc; film the collaterals fully when a CTO is found, and count the diagnostic contrast towards the day's limit.",
      "Start a programme with formal teaching, an on-site proctor, case vetting, written safety rules and two operators per case.",
      "Set up with dual injection, 7–8 French supportive guides, IVUS and re-entry kit available.",
      "Use unfractionated heparin with ACT targets and rechecks every 20–30 minutes; bivalirudin is best avoided because it cannot be reversed, and IIb/IIIa inhibitors and cangrelor are not given because wire perforations can reopen.",
      "Consider stopping at more than 5 Gy without progress, contrast above 3.7 times creatinine clearance, exhausted options or fatigue, weighing risk against benefit at each stage.",
      "Above 5 Gy, tell the patient about skin effects and arrange a documented skin review within a month; recheck renal function after a high contrast dose.",
      "Tell the patient, debrief the team, review the runs and log the case honestly.",
      "Judge a new programme against learning curves, the proctored model programme and experienced centres together, audit safety as well as success, and review selection with the proctor.",
    ],
    refs: [...BOOKS, "karmpaliotis-cto-programme-2013", "young-cto-learning-curve-2019", "zein-cto-experience-2020"],
  },
];

// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-operator-know-your-level",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Count your own experience in the risk",
    text: "Brilakis puts operator competence beside the disease, the lesion and the comorbidities when weighing benefit against risk, and notes that the team's state on the day matters too. If this lesion or this bail-out is beyond what you are entrusted to do alone, have a senior scrubbed before you start, not after the trouble begins.",
    tone: "caution",
    lessonId: "hb-the-operator-entrustment",
    sources: [B("7.1"), B("2.9")],
    refs: [...BRILAKIS, "eapci-curriculum"],
  },
  {
    id: "pci-operator-help-early",
    lab: "pci",
    when: { phase: ["complication"] },
    title: "A complication you have not managed alone: call now",
    text: "Managing complications as first operator under direct supervision is level III; doing it unsupervised is what level IV adds. If you have not yet been entrusted with this bail-out, call your supervisor at once rather than after the first attempts have failed.",
    tone: "bailout",
    lessonId: "hb-the-operator-entrustment",
    sources: [B("7.1"), O("ch 2: The cardiologist")],
    refs: [...BOOKS, "eapci-curriculum"],
  },
  {
    id: "pci-operator-check-the-device",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Confirm the device before it goes in",
    text: "Oxford makes the operator responsible for checking that each balloon or stent handed over is the one requested. Read the type, diameter and length aloud before the device enters the guide.",
    tone: "caution",
    lessonId: "hb-the-operator-entrustment",
    sources: [O("ch 2: The cardiologist")],
    refs: OXFORD,
  },
  {
    id: "pci-operator-log-the-case",
    lab: "pci",
    when: { phase: ["finish"] },
    alsoIn: [{ lab: "diagnostic", phase: ["finish"] }],
    title: "Log the case as it happened",
    text: "Record your role (first or second operator), the access, the presentation, the complexity, the techniques used and any complication with its management. An honest entry is what shows your supervisor which activities you still need.",
    tone: "do",
    lessonId: "hb-the-operator-pathway",
    sources: [O("ch 2: The cardiologist")],
    refs: OXFORD,
  },
  {
    id: "pci-operator-one-target",
    lab: "pci",
    when: { phase: ["plan", "finish"] },
    alsoIn: [{ lab: "diagnostic", phase: ["finish"] }],
    title: "One named target per case",
    text: "Before the case, tell your trainer the one step you want to improve; afterwards, say what you will change next time. The introduction to Brilakis's manual builds expertise on deliberate practice, targeted work on a weakness with a teacher, and Oxford reminds you that apprenticeship carries the trainer's habits as well as skills.",
    tone: "do",
    lessonId: "hb-the-operator-teaching",
    sources: [O("ch 1: Background"), O("ch 2: The cardiologist")],
    refs: BOOKS,
  },
  {
    id: "diag-operator-review-the-runs",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Review every stored run after the case",
    text: "Once the study is over, go through each stored loop to exclude a dissection or embolism and to reassess the stenoses, and look again at the haemodynamics, the blood results (renal function, cholesterol, glucose) and, after complex PCI, the ECG and troponin. Invite the team: Oxford treats the review as a teaching session.",
    tone: "do",
    lessonId: "hb-the-operator-teaching",
    sources: [O("ch 11: Results")],
    refs: OXFORD,
  },
  {
    id: "pci-operator-debrief-after-complication",
    lab: "pci",
    when: { phase: ["finish"], event: ["dissection", "perforation", "no-reflow", "acute-closure", "equipment-entrapment"] },
    title: "After a complication: tell the patient, debrief the team",
    text: "Explain to the patient and family what happened, in line with the duty of candour, and debrief the team before the day ends while the learning points are fresh.",
    tone: "do",
    lessonId: "hb-the-operator-teaching",
    sources: [O("ch 2: The cardiologist")],
    refs: OXFORD,
  },
  {
    id: "pci-operator-cto-kit-before-start",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "CTO: is the equipment in the room?",
    text: "Before starting, confirm dual access, 7–8 French supportive guides, IVUS and a re-entry system are available; 6 French guides limit IVUS-guided cap puncture and complication management. Brilakis lists a facility lacking the necessary equipment among the reasons to delay rather than proceed.",
    tone: "caution",
    lessonId: "hb-the-operator-programme",
    sources: [B("21.4"), B("21.5"), B("21.8"), B("7.3")],
    refs: BRILAKIS,
  },
  {
    id: "pci-operator-cto-second-operator",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "Early CTO cases: two operators and a proctor",
    text: "A published CTO programme started with on-site proctorship and two operators for every case (Karmpaliotis). In a Michigan registry, inexperienced operators had higher success at high-experience centres, and the authors suggested referring CTO PCI to experienced operators at experienced centres (Zein). Brilakis links greater operator experience with higher success and fewer complications.",
    tone: "do",
    lessonId: "hb-the-operator-programme",
    sources: [B("7.1")],
    refs: [...BRILAKIS, "karmpaliotis-cto-programme-2013", "zein-cto-experience-2020"],
  },
  {
    id: "diag-operator-moderate-lesion-measure",
    lab: "diagnostic",
    when: { phase: ["views"] },
    title: "Moderate-looking lesion: more than one view, then measure",
    text: "Visual grading of moderate lesions varies by about ±20% between observers, and an oval lesion can look severe in one view and normal in another. Film it in at least two projections, preferably orthogonal; at the extreme the angiogram can make a lesion look up to 50% milder than it is, and it may not match the physiology, so use quantitative angiography, a pressure wire or imaging when the decision depends on it.",
    tone: "do",
    lessonId: "hb-the-operator-evidence",
    sources: [O("ch 6: Quantification of stenoses"), O("ch 6: Tips for interpretation")],
    refs: OXFORD,
  },
];

// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "tencate-epa-guide-2020",
    kind: "paper",
    citation: "Ten Cate O, Taylor DR. The recommended description of an entrustable professional activity: AMEE Guide No. 140. Med Teach. 2021;43(10):1106–1114.",
    url: "https://doi.org/10.1080/0142159X.2020.1838465",
    note: "PMID: 33167763. Checked on PubMed: authors, title, journal, volume 43, issue 10, pages 1106–1114 (published online 9 November 2020); abstract read. Used for: EPAs first proposed in 2005; the eight sections of a full EPA description (title; specification and limitations; risks in case of failure; most relevant competency domains; knowledge, skills, attitudes and experience; information sources to assess progress and support summative entrustment; entrustment or supervision level expected at which stage; time to expiration if not practised).",
    verified: true,
  },
  {
    id: "karmpaliotis-cto-programme-2013",
    kind: "paper",
    citation: "Karmpaliotis D, Lembo N, Kalynych A, et al. Development of a high-volume, multiple-operator program for percutaneous chronic total coronary occlusion revascularization: procedural, clinical, and cost-utilization outcomes. Catheter Cardiovasc Interv. 2013;82(1):1–8.",
    url: "https://doi.org/10.1002/ccd.24387",
    note: "PMID: 23576529. Checked on PubMed: authors, title, journal, year, volume 82, issue 1, pages 1–8; abstract read. Used for: programme requirements (extensive didactic training, on-site proctorship, routine determination of case appropriateness, adherence to procedural safety guidelines, two operators per case); 160 procedures in 145 patients, October 2009 to December 2010; success 85.6%; in-hospital death 0.6%, emergency bypass 0.6%, tamponade 0.6%, MI 1.9%; higher cost than non-CTO PCI but similar contribution margins; educational and performance standards, mentorship from experts, consensus appropriateness review and lab policies proposed as a model for programme development.",
    verified: true,
  },
  {
    id: "young-cto-learning-curve-2019",
    kind: "paper",
    citation: "Young MN, Secemsky EA, Kaltenbach LA, et al. Examining the operator learning curve for percutaneous coronary intervention of chronic total occlusions. Circ Cardiovasc Interv. 2019;12(8):e007877.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.119.007877",
    note: "PMID: 31416356. Checked on PubMed: authors, title, journal, year, volume 12, issue 8, article e007877; abstract read. Used for: CathPCI Registry 2009–2015; new CTO operators defined as fewer than 10 CTO PCIs a year; 70,916 cases by 7,251 new operators; success 61.4%, MACE 4.2%; crossing, stenting and success improved with accrued volume, with more contrast, fluoroscopy time and bleeding; MACE stable beyond the 12th case.",
    verified: true,
  },
  {
    id: "zein-cto-experience-2020",
    kind: "paper",
    citation: "Zein R, Seth M, Othman H, et al. Association of operator and hospital experience with procedural success rates and outcomes in patients undergoing percutaneous coronary interventions for chronic total occlusions: insights from the Blue Cross Blue Shield of Michigan Cardiovascular Consortium. Circ Cardiovasc Interv. 2020;13(8):e008863.",
    url: "https://doi.org/10.1161/CIRCINTERVENTIONS.119.008863",
    note: "PMID: 32791954. Checked on PubMed: authors, title, journal, year, volume 13, issue 8, article e008863; abstract read. Used for: 7,389 CTO PCIs (3.5% of 210,172 registry patients, 2010–2018); success 53%; 45% and 65% in the lowest and highest operator-experience tertiles; operator and site experience related to success but not to MACE; inexperienced operators at high-experience centres had higher success than at low-experience hospitals; authors suggest selective referral to experienced operators at experienced centres.",
    verified: true,
  },
  {
    id: "calic-remote-proctoring-2024",
    kind: "paper",
    citation: "Calic S, Jortveit J, Andersen JO, Eek CH. Remote proctoring in complex percutaneous coronary intervention aided by mixed reality technology. Eur Heart J Digit Health. 2024;5(5):633–636.",
    url: "https://doi.org/10.1093/ehjdh/ztae037",
    note: "PMID: 39318687 (PMC11417479). Checked on PubMed: authors, title, journal, year, volume 5, issue 5, pages 633–636; abstract read. Used for: proctoring defined as cooperation and supervision by a more experienced operator, associated with improved CTO success (stated in the background); remote proctoring with a head-mounted mixed-reality display and web-based audio and video was feasible in 10 CTO procedures; impact on procedural and patient outcomes still to be assessed.",
    verified: true,
  },
  {
    id: "palmerini-des-thrombosis-2012",
    kind: "paper",
    citation: "Palmerini T, Biondi-Zoccai G, Della Riva D, et al. Stent thrombosis with drug-eluting and bare-metal stents: evidence from a comprehensive network meta-analysis. Lancet. 2012;379(9824):1393–1402.",
    url: "https://doi.org/10.1016/S0140-6736(12)60324-9",
    note: "PMID: 22445239. Checked on PubMed: authors, title, journal, year, volume 379, issue 9824, pages 1393–1402; abstract read. Used for: network meta-analysis of 49 randomised trials (50,844 patients); 1-year definite stent thrombosis lower with cobalt-chromium everolimus-eluting stents than with bare-metal stents (OR 0.23), still lower at 2 years (OR 0.35); no other drug-eluting stent had lower definite thrombosis than bare-metal stents at 2 years.",
    verified: true,
  },
  {
    id: "hopewell-consort-2025",
    kind: "guideline",
    citation: "Hopewell S, Chan AW, Collins GS, et al. CONSORT 2025 statement: updated guideline for reporting randomised trials. BMJ. 2025;389:e081123.",
    url: "https://doi.org/10.1136/bmj-2024-081123",
    note: "PMID: 40228833 (PMC11995449). Checked on PubMed: authors, title, journal, year, volume 389, article e081123; abstract read. Also published simultaneously in JAMA, Nat Med and PLoS Med. Used for: CONSORT first published 1996, updated 2001 and 2010; CONSORT 2025 is a 30-item checklist plus a participant flow diagram; restructured with a new open-science section.",
    verified: true,
  },
];
