// Module hb-safe-practice: reflection and morbidity and mortality review, audit and quality, the law
// in the lab, operator wellbeing, and decisions under pressure (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, ch 11 (results review,
// communication), ch 10 (risks of complications; death: relatives, reporting, documentation, handling
// staff), ch 2 (the cardiologist, the nurse, the cardiac physiologist, the radiographer, the WHO
// checklist, accredited centres and the logbook) and ch 1 (radiation safety, IR(ME)R 2017, dose excess,
// patient preparation, catheter laboratory preparation, indications); Brilakis, Manual of PCI:
// Introduction (printed pp. xxiii-xxiv, PDF pp. 25-26; no section number, so cited in the text and the
// evidence file only), 1.1, 2.5, 2.6, 2.9, 2.10, 6.4, 7.1, 7.3, 21.8, 25.1, 25.2 and 28.2. UK legislation checked on
// legislation.gov.uk for the medicolegal lesson: the Notification of Deaths Regulations 2019, the Coroners and Justice
// Act 2009 (s14) and the Health and Social Care (Quality and Engagement) (Wales) Act 2020 (in `refs` below);
// the current national incident-reporting systems checked on england.nhs.uk (LFPSE) and in the 2023 NHS Wales
// national incident policy (Datix Cymru).
// The manuals say little about audit, wellbeing or mindset, so most of that teaching rests on new,
// PubMed-checked references (in `refs` below) and on the GMC/NMC candour guidance already in the
// registry (gmc-nmc-candour-2015), read in full for this module, including its section on reporting and
// learning and its appendix on the statutory duties. Every claim is listed with its page in
// docs/curriculum/evidence/hb-safe-practice.md.
// Neighbouring modules: hb-after-the-procedure (the report, and the disclosure conversation itself),
// hb-the-operator (entrustment, teaching, logbook), pm-monitoring (the team, the checklist, the sterile
// cockpit, crisis leadership), hb-lab-and-radiation (dose reduction and operator protection),
// cm-principles-closure (the acute closure algorithm). Academy lessons this module builds on:
// bed-ind-human-factors-wellbeing, bed-ind-radiation-ergonomics, bed-ind-decisions-consent and the
// Mistake review and Competencies and logbook sections.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OXFORD = ["oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "hb-safe-practice",
  title: "Reflection, quality, the law and looking after yourself",
  stage: 2,
  summary:
    "The professional side of the cath lab that the procedure manuals mention only in passing: how to review your own cases and a morbidity and mortality meeting so that something changes, how to audit your results and read registry and benchmark data without being misled, what the law asks of you in consent, records, radiation and candour, how to look after your body and mind across a long career, and how to keep making good decisions when a case goes wrong.",
  objectives: [
    "Review a case or a complication in a structured way, using the manuals' frames (goal, how, challenges, what can go wrong; causes, prevention, treatment), separating the quality of a decision from its outcome, and turning the review into a named action.",
    "Build a personal audit with a full denominator and standard definitions, explain structure, process and outcome measures, and read a funnel plot, a registry report and a public outcome table critically.",
    "State what consent, the clinical record, IR(ME)R 2017 and the professional and organisational duties of candour require of an operator, and what to record and report after a complication or a death in the lab.",
    "Describe the evidence on burnout, sleep deprivation and orthopaedic injury among interventional cardiologists, and apply practical measures for yourself and the team, including after a major complication.",
    "Explain what the Stoic approach does and does not mean, and use rehearsal, focus on what you control and pre-agreed stopping rules to decide well under pressure.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-safe-practice-reflection",
      title: "Reviewing your own cases: reflection and the morbidity and mortality meeting",
      minutes: 15,
      topics: ["pro-reflection-mm"],
      sources: [O("ch 11: Results"), O("ch 2: The cardiologist"), O("ch 2: The cardiac physiologist"), O("ch 2: The nurse"), B("2.9"), B("2.10"), B("25.1"), B("25.2")],
      refs: [...BOOKS, "gmc-nmc-candour-2015", "orlander-mm-conference-2002", "mann-reflection-review-2009", "touma-operator-grief-2025"],
      blocks: [
        {
          kind: "p",
          text: "Every operator has complications; what separates operators over a career is whether each one teaches them something. The Academy lesson bed-ind-human-factors-wellbeing sets out the principle that morbidity and mortality (M&M) meetings are for learning, not blame. This lesson is the method: how to take one of your own cases apart, step by step, so that the review ends in a change you can name, and how to present it so that the room learns from it too.",
        },
        { kind: "h", text: "Two frames the manuals already give you" },
        {
          kind: "table",
          caption: "Ready-made review frames from the two manuals",
          head: ["Frame", "Questions", "Where it comes from"],
          rows: [
            ["Each step of the case", "What was the goal of this step? How was it done? What made it difficult? What went wrong, or could have?", "The template Brilakis uses for every step of PCI (Introduction)"],
            ["Each challenge or complication", "What caused it? What would have prevented it? How was it treated, and was that the best treatment?", "The same Introduction: every challenge and complication in the manual is discussed as causes, prevention and treatment"],
            ["The data after the case", "Was the indication sound? Does every stored run exclude dissection and embolism? Are the stenosis estimates right? What did the haemodynamics and blood results (renal function, cholesterol, glucose) show? After complex PCI, what do the ECG and troponin show?", "Oxford's review of results, which it treats as a teaching session for the whole team (ch 11)"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds two attitudes worth bringing to every review. His algorithms are those the authors use, not necessarily the best ones, and he invites readers to improve them; and the aim he sets is to keep improving so that each patient gets the best possible outcome. A review that only confirms what you already did has not done its job.",
        },
        { kind: "h", text: "Reviewing a case of your own, step by step" },
        {
          kind: "steps",
          title: "From the record to one change",
          items: [
            {
              title: "1. Gather the record before you rely on memory",
              detail:
                "Collect the procedure report, the physiologist's log (Oxford asks for a recording of the whole procedure with start and end times, drug timings, contrast volume, the equipment and the tracings of each main event), the nursing notes, the dose and contrast figures and the stored runs. Memory after a stressful case is selective; the timestamps are not.",
            },
            {
              title: "2. Rebuild the timeline and mark the decision points",
              detail:
                "Write down, in order, what happened and what you knew at each moment you chose something: the guide, the wire, the device, whether to continue. Judge each decision on the information available then, not on what you learned later.",
            },
            {
              title: "3. Apply the manual's frames to each problem",
              detail:
                "For each step that went badly, ask goal, how, challenge, what went wrong; for each complication, ask cause, prevention, treatment. Use the relevant manual chapter as the reference standard, so the review measures the case against a written algorithm rather than against habit.",
            },
            {
              title: "4. Look past the operator to the team, the room and the system",
              detail:
                "Brilakis asks the team to watch its own operational state, because doing so can help pick up conditions, such as excessive fatigue, that may lead to suboptimal outcomes; he also wants noise and distraction kept down during critical steps. Was the operator post-call? Was the room noisy? Was the right equipment there? Was the case squeezed into the end of a list?",
            },
            {
              title: "5. Separate the decision from the outcome",
              detail:
                "A sound decision can end badly and a poor one can get away with it. Touma and colleagues list outcome bias, replay loops and compartmentalisation among the barriers to an operator's recovery after a procedural death. Outcome bias distorts case reviews in the same way, so grade the decision and the outcome separately.",
            },
            {
              title: "6. Turn the finding into an action with an owner",
              detail:
                "The GMC and NMC candour guidance asks those who lead teams to make sure systems exist so that lessons are drawn from adverse incidents and near misses, shared with the team, followed by concrete action, and practice changed where needed. 'Be more careful' is not an action; 'add the dissection bail-out kit to the CTO trolley checklist, owned by the lab manager, checked in a month' is.",
            },
            {
              title: "7. Record the reflection and take it to appraisal",
              detail:
                "Write it in your reflective log while it is fresh. The same guidance says you must take part in regular reviews and audits of your team's standards and performance, and should discuss adverse incidents and near misses at your appraisal.",
            },
          ],
        },
        { kind: "tip", id: "pci-safe-capture-the-facts" },
        { kind: "tip", id: "diag-operator-review-the-runs" },
        {
          kind: "check",
          stem: "Your patient developed a flow-limiting dissection after you advanced a stent through a calcified, tortuous RCA without lesion preparation. You recovered it with a second stent and the patient did well. In your review, which question best follows the manual's frame for a complication?",
          options: [
            "Was the final angiographic result good enough to call the case a success, since the patient left hospital well?",
            "What caused the dissection, what would have prevented it here, and was the treatment the best available?",
            "Who on the team was responsible for choosing the stent, so that the error can be attributed accurately?",
            "How quickly did the team respond, since speed of response is the main measure of complication management?",
          ],
          answer: 1,
          explanation:
            "Brilakis discusses every challenge and complication as causes, prevention and treatment, and for dissection he lists preparation of calcified lesions among the preventive measures; asking all three is what turns a recovered complication into learning. A good final result describes the outcome, not whether the decisions were sound. Attributing blame and timing the response may feature, but neither is the frame, and a blame-first question is exactly what makes an M&M meeting unproductive.",
        },
        { kind: "h", text: "Presenting at, or chairing, the M&M meeting" },
        {
          kind: "p",
          text: "Orlander and colleagues describe the M&M conference as a double-edged sword. Done well, it models how to learn from error; done badly, it teaches that trying to learn from error is pointless at best and unpleasant at worst. How the meeting is run therefore matters as much as the case chosen. The review need not wait for the meeting: among the cardiologist's duties Oxford lists a debrief of the lab team at the end of the day, above all after a complication or when a learning point should be shared (see also hb-after-the-procedure). The candour guidance gives the professional duties behind it: report early so lessons are learnt quickly; never try to stop a colleague raising a patient-safety concern; and, if you are senior, set the example of openness and build a culture of learning and improvement.",
        },
        {
          kind: "list",
          items: [
            "**Lead with the facts.** The timeline, the images and the numbers, presented neutrally, before any opinion.",
            "**Show the decision points.** Pause the story at each one and ask the room what they would have done with what was known then.",
            "**Use the manual as the standard.** Compare each step with the relevant algorithm; where the team's practice differs from it, say so and ask why.",
            "**Name the system factors.** Fatigue, scheduling, staffing, equipment, distraction.",
            "**Close with actions.** Each with an owner and a date to check that it happened.",
            "**Protect confidentiality.** Good medical practice, quoted in the candour guidance, asks you to follow the GMC's confidentiality guidance when you provide information for incident reviews.",
          ],
        },
        {
          kind: "check",
          stem: "At M&M a registrar presents a case in which he wired a side branch, the wire tip perforated it, and the patient needed a covered stent. The chair's first comment is: 'Why on earth did you use a polymer-jacketed wire there?' What would make this meeting more likely to produce learning?",
          options: [
            "Let the chair continue, because a sharp question makes the point memorable and the registrar will not repeat the error",
            "Move to the next case quickly, because dwelling on a complication only adds to the registrar's distress",
            "Set out the timeline and decision points, ask the room what they would have chosen then, and agree a named action",
            "Ask the registrar to write a statement for his file, because accountability rather than discussion prevents repetition",
          ],
          answer: 2,
          explanation:
            "Orlander's warning is that a badly run M&M teaches people that examining error is unpleasant and unproductive. Facts and decision points first, judged on what was known at the time, then an action with an owner, is what turns a complication into learning. Moving on avoids the learning altogether, and a punitive statement discourages exactly the open reporting the candour guidance asks every organisation to support.",
        },
        {
          kind: "p",
          text: "A note on the evidence. Mann and colleagues began their systematic review by noting that many regard reflective capacity as essential to professional competence, yet the evidence behind reflection curricula remained largely theoretical. That is a reason to keep reflection concrete and tied to a case, a decision and an action, not to drop it.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reviewing from memory, without the timestamps, the runs and the dose figures.",
            "Judging a decision by its outcome: praising a lucky case and condemning an unlucky one.",
            "Stopping at the operator and missing the fatigue, the noise or the missing equipment.",
            "Ending the review with a resolution ('be more careful') rather than an action with an owner.",
            "Reviewing only complications: a near miss teaches the same lesson at no cost to a patient.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep a one-page template for every review: timeline, decision points, goal/how/challenge/what went wrong for each step, cause/prevention/treatment for each complication, system factors, one action. If the same system factor appears in three of your reviews, it is no longer a case problem; it is an audit topic.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Run a diagnostic case and, in the debrief, review it with this lesson's template: rebuild the timeline, name each decision point, apply goal, how, challenge and what went wrong to the step that went least well, and write one action. Then open Mistake review and check whether that step is already one of your recurring patterns.",
        },
        { kind: "video", id: "JUYPS0-Pap8", note: "When disaster strikes (Brilakis channel)." },
        { kind: "video", id: "Y0JQChxwsQw", note: "Complex Coronary Interventions webcast, number XXVI." },
        { kind: "video", id: "dM8usGDfd5w", note: "Complex Coronary Interventions webcast, number XXVII." },
        {
          kind: "keypoints",
          items: [
            "Use the manuals' frames: goal, how, challenges, what can go wrong for each step; causes, prevention, treatment for each complication.",
            "Oxford's results review covers the indication, every stored run, the stenosis estimates, the haemodynamics and the bloods, and is a teaching session for the team.",
            "Rebuild the timeline from the records and judge each decision on what was known then; outcome bias distorts reviews.",
            "Look beyond the operator: team state, fatigue, noise, equipment, scheduling.",
            "End with an action that has an owner and a check date; record the reflection and discuss incidents at appraisal.",
            "A badly run M&M teaches people to avoid examining error; facts and decision points first.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-safe-practice-audit",
      title: "Audit, registries and quality: measuring your results honestly",
      minutes: 15,
      topics: ["pro-quality-audit"],
      sources: [O("ch 2: The cardiologist"), O("ch 2: The radiographer"), O("ch 1: Radiation safety"), O("ch 10: Risks of complications"), O("ch 10: Death"), B("1.1"), B("2.6"), B("7.1"), B("21.8"), B("28.2")],
      refs: [
        ...BOOKS,
        "donabedian-quality-1988",
        "ludman-bcis-registry-2011",
        "spiegelhalter-funnel-plots-2005",
        "joynt-public-reporting-2012",
        "schiele-acvc-qi-2021",
        "tajti-progress-hybrid-2018",
        "gmc-nmc-candour-2015",
        "matrix-2015",
      ],
      blocks: [
        {
          kind: "p",
          text: "A logbook records what you did; an audit asks how well you did it against a standard. Both manuals build audit into the lab: Oxford requires an accredited training centre to keep an electronic database of its diagnostic and interventional procedures that the national interventional society audits regularly, asks the radiographer to audit as needed, and under IR(ME)R expects doses to be audited. Brilakis counts operator experience in every benefit-risk judgement, because greater experience goes with higher success and fewer complications. This lesson is about producing numbers you can trust and reading other people's numbers without being misled.",
        },
        { kind: "h", text: "What to measure: structure, process and outcome" },
        {
          kind: "p",
          text: "Donabedian's classic framework assesses quality through the structure of the setting where care happens, the processes of care, and its outcomes, and stresses that assessment needs information about how the three are causally linked. In the cath lab that gives three kinds of question.",
        },
        {
          kind: "table",
          caption: "Structure, process and outcome in the cath lab (examples drawn from the manuals)",
          head: ["Type", "Examples", "Source of the standard"],
          rows: [
            ["Structure", "An accredited training centre: more than 800 coronary interventions a year, an electronic procedure database audited by the national society, at least two supervisors who each have over 1000 PCIs and more than 5 years in interventional work", "Oxford ch 2"],
            ["Process", "Indication checked against appropriate use criteria; consent documented; clinical evaluation recorded for every exposure; patient radiation and contrast doses recorded; contrast kept below about 3.7 times the GFR (lower in chronic kidney disease or a single kidney, allowing for any recent contrast; for CTO, 21.8 gives the limit as 3.7 times the estimated creatinine clearance); skin review within a month after more than 5 Gy air kerma; above 10 Gy, peak skin dose calculated by a physicist and the skin examined at 2–4 weeks", "Brilakis 1.1, 2.6, 21.8 and 28.2; Oxford ch 1 and ch 2"],
            ["Outcome", "Death, myocardial infarction, stroke, vascular complications, contrast reaction, renal failure; for PCI, success and complication rates", "Oxford ch 10 (diagnostic catheterisation rates); registries for PCI"],
          ],
        },
        {
          kind: "p",
          text: "Process measures are attractive because they are frequent and within your control; outcome measures are what patients care about but are rare and depend heavily on case mix. When the ESC Acute Cardiovascular Care quality indicators for myocardial infarction were applied to three French national registries, most could be measured from existing registry data but the patient-satisfaction domain could not; composite scores of the indicators were associated with 1-year mortality, and grading centres against the national mean was feasible.",
        },
        { kind: "h", text: "Registries: what they give you and what they cannot" },
        {
          kind: "list",
          items: [
            "**The UK national registry (BCIS).** Running since 1994, it aims to include every PCI performed in UK hospitals, about 80,000 new procedures a year at the time of its 2011 description, with 113 variables covering the patient, the indication, the procedure and outcomes to hospital discharge. Centres receive live online analysis and monthly and quarterly reports, including process measures and risk-adjusted outcomes, and national reports appear each year.",
            "**What counts as a case.** The registry counts every attempt: any use of a coronary device to approach, probe or cross a lesion with the intention of intervening. A failed attempt is a case.",
            "**Its limits.** Data are entered locally by clinicians and data clerks, with local validation, range and consistency checks on upload and feedback on completeness, but no external validation. A registry is only as good as what is typed into it.",
            "**Specialist registries.** The PROGRESS CTO registry pooled 3,122 CTO PCIs from 20 centres in its 2018 update, reporting technical success of 87% and in-hospital major complications of 3.0%. Numbers like these are benchmarks for experienced centres, not targets for a first-year CTO operator.",
          ],
        },
        {
          kind: "check",
          stem: "You are compiling your first-year PCI audit. Three cases were abandoned after the wire would not cross, and you are tempted to leave them out because no stent was placed. What should you do?",
          options: [
            "Leave them out, because a PCI audit should only describe procedures in which a stent was implanted",
            "Include them: the national registry counts any attempt in which a device approached, probed or crossed the lesion",
            "Include them only if a complication occurred, since uncomplicated failures carry no information about safety",
            "Report them separately as diagnostic procedures, because no coronary intervention was actually completed in those patients",
          ],
          answer: 1,
          explanation:
            "BCIS defines a PCI as any attempt in which a coronary device is used to approach, probe or cross a lesion with the intention of intervening. Dropping failures inflates your success rate and makes your figures incomparable with the registry. Recoding them as diagnostic, or keeping only those with complications, distorts the denominator in the same way.",
        },
        { kind: "h", text: "Building and reading your personal audit, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Fix the denominator",
              detail: "Every attempt, consecutively, including failures, abandoned cases and cases you only started. A missing case is almost never a random one.",
            },
            {
              title: "2. Use standard definitions",
              detail: "Define success, each complication and each process measure the same way as the registry or the guideline you will compare against, and write the definitions down before you count.",
            },
            {
              title: "3. Collect prospectively",
              detail: "Enter each case as part of finishing it (role, access, presentation, complexity, techniques, complications, dose and contrast) rather than reconstructing the year from memory.",
            },
            {
              title: "4. Expect small numbers",
              detail: "Work out how many events you would expect before reading anything into what you observed. With rare outcomes a single event can swing a personal rate wildly.",
            },
            {
              title: "5. Adjust for case mix",
              detail: "An operator who takes on primary PCI, shock and CTO will have worse crude outcomes than one who does elective single-vessel work. Compare like with like, or use risk-adjusted figures such as those the national registry feeds back. Oxford gives the manual's own case-mix variables: the risk of complications rises with age and co-morbidity, and the risk of death at catheterisation rises with age, left main stenosis, three-vessel disease, class IV heart failure, poor ventricular function and aortic valve disease; these belong in any comparison.",
            },
            {
              title: "6. Plot, do not rank",
              detail: "Show results on a funnel plot rather than a league table (explained below).",
            },
            {
              title: "7. Act and re-audit",
              detail: "The candour guidance asks those who lead teams to have auditing and benchmarking in place to monitor, review and improve the team's work, and to collect and share information on outcomes and patient experience; anyone with a management role must make sure systems, including audit and patient feedback, give early warning of failing clinical performance by an individual or a team. An audit that changes nothing is a report, not an audit; close the loop and measure again.",
            },
          ],
        },
        {
          kind: "formula",
          name: "Expected events",
          expr: "Expected events = number of cases × benchmark rate",
          note: "Example with Oxford's figures for diagnostic catheterisation: 400 studies × vascular complications of 1–2% gives about 4–8 expected; 400 × death of 0.1% gives 0.4, so a single death in 400 studies cannot by itself show whether your practice differs from the benchmark. Choose a benchmark that matches your access route, case mix and complication definitions: Oxford's 1–2% does not state the access route, and in MATRIX (acute coronary syndromes) radial access reduced major bleeding compared with femoral, so a radial-first practice needs a benchmark built for it.",
        },
        {
          kind: "p",
          text: "**Funnel plots.** Spiegelhalter's method plots each operator's or centre's result against a measure of its precision, usually the number of cases, with control limits drawn around the target; because precision grows with numbers, the limits form a funnel, narrow on the right and wide on the left. It is the same idea as a Shewhart control chart. A result outside the limits is the signal to investigate; a result inside is consistent with the target for that number of cases. The method copes with over-dispersion from unmeasured risk factors and avoids ranking institutions into spurious league tables.",
        },
        { kind: "tip", id: "pci-safe-count-every-attempt" },
        { kind: "tip", id: "pci-operator-log-the-case" },
        { kind: "h", text: "When measurement changes behaviour" },
        {
          kind: "p",
          text: "Publishing outcomes is meant to improve care, but it can also change who gets treated. Joynt and colleagues compared Medicare patients with acute myocardial infarction in three US states that publicly reported PCI outcomes with seven nearby states that did not. In 2010, patients in reporting states were less likely to receive PCI, with the largest differences in STEMI and in cardiogenic shock or cardiac arrest, yet overall mortality from myocardial infarction did not differ. The lesson for your own audit is to make sure the measure cannot be improved simply by turning away the sickest patients.",
        },
        {
          kind: "check",
          stem: "Your department proposes publishing each operator's crude 30-day PCI mortality on the intranet, ranked from best to worst, to drive improvement. One operator does most of the shock and cardiac-arrest work. What is the strongest objection, and the better alternative?",
          options: [
            "There is no objection, because a crude ranking is easy for everyone to understand and so drives the most improvement",
            "Crude ranks ignore case mix and chance and may deter high-risk work; plot risk-adjusted outcomes on a funnel plot",
            "Mortality is the wrong measure in principle, so the department should publish only process measures and never outcomes",
            "The ranking should be kept but limited to operators with more than ten deaths, so that small numbers do not mislead",
          ],
          answer: 1,
          explanation:
            "A crude league table mixes case mix with chance; Spiegelhalter's funnel plots were designed to avoid exactly this spurious ranking, and the BCIS registry already feeds back risk-adjusted outcomes. Joynt's study shows that public outcome reporting was associated with fewer PCIs in the highest-risk patients. Outcome measures still matter, so dropping them entirely is not the answer, and a threshold of ten deaths does nothing about case mix.",
        },
        {
          kind: "pitfalls",
          items: [
            "Leaving failed attempts out of the denominator.",
            "Changing definitions part way through the year, or using different definitions from the benchmark.",
            "Drawing conclusions from one or two events in a small series.",
            "Comparing crude outcomes between operators with different case mixes.",
            "Ranking operators or centres in a league table instead of plotting them against control limits.",
            "Choosing a measure that can be 'improved' by avoiding high-risk patients.",
          ],
        },
        {
          kind: "pearl",
          text: "Audit your processes monthly and your outcomes yearly. Processes (consent recorded, dose recorded, contrast within the limit, skin follow-up booked after a high dose) happen in every case, so a month of data already shows a pattern you can fix; outcomes need a much larger denominator before they tell you anything.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "After at least five cases, open Competencies and logbook, Logbook tab. Count every case you started (your denominator), how many met the success definition, and how many had a recorded complication or a contrast or dose figure above the limits taught in this course. Then calculate how many events you would expect from the Oxford rates for a series of that size.",
        },
        { kind: "video", id: "ksjYSNVdnbk", note: "An introduction to the PROGRESS CTO registry." },
        { kind: "video", id: "K73P4S1KvK8", note: "PROGRESS CTO registry update, April 2017." },
        { kind: "video", id: "bYLkq6OmtXY", note: "PROGRESS CTO registry update, May 2018." },
        {
          kind: "keypoints",
          items: [
            "Quality has three faces: structure, process and outcome (Donabedian); assessing it needs information on how they are causally linked.",
            "Count every attempt as a case; BCIS defines PCI as any device use to approach, probe or cross a lesion with intent to intervene.",
            "Use standard definitions, collect prospectively, adjust for case mix and expect small numbers.",
            "Expected events = cases × benchmark rate; compare observed with expected before drawing conclusions.",
            "Funnel plots, not league tables: a result outside the control limits is the signal to investigate.",
            "Public outcome reporting was associated with fewer PCIs in the sickest myocardial infarction patients; design measures that cannot be gamed by avoidance.",
            "Close the loop: act on the audit and measure again.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-safe-practice-medicolegal",
      title: "The law in the lab: consent, records, radiation and candour",
      minutes: 16,
      topics: ["pro-medicolegal"],
      sources: [
        O("ch 1: Indications for cardiac catheterization"),
        O("ch 1: Patient preparation"),
        O("ch 1: Catheter laboratory preparation"),
        O("ch 1: Radiation safety"),
        O("ch 1: Dose excess"),
        O("ch 2: The cardiologist"),
        O("ch 2: The nurse"),
        O("ch 2: The cardiac physiologist"),
        O("ch 2: The radiographer"),
        O("ch 10: Death"),
        O("ch 11: Communication"),
        B("1.1"),
        B("2.5"),
        B("7.3"),
        B("28.2"),
      ],
      refs: [...BOOKS, "montgomery-2015", "gmc-consent-2020", "irmer-2017", "gmc-nmc-candour-2015", "notification-of-deaths-2019", "coroners-justice-act-2009", "wales-candour-act-2020", "nhse-nrls-lfpse-transition-2026", "nhs-wales-incident-policy-2023"],
      blocks: [
        {
          kind: "p",
          text: "The law reaches into the lab at four points: before the case (consent), during and after it (the record), whenever the X-ray tube is on (IR(ME)R 2017 in the UK), and after anything goes wrong (reporting and candour). This lesson covers what each requires of the operator. How to hold the disclosure conversation itself, step by step, is taught in hb-after-the-procedure-communication; taking consent is introduced in the Academy lesson bed-ind-decisions-consent.",
        },
        { kind: "h", text: "Consent: the only absolute contraindication" },
        {
          kind: "p",
          text: "Oxford lists many relative contraindications to cardiac catheterisation but only one absolute one: the patient's refusal to consent. Since Montgomery (2015), UK doctors must take reasonable care that the patient knows of any material risks and of reasonable alternatives; the GMC's 2020 guidance treats consent as a dialogue rather than a signature. The manuals then make consent a checked item at several points.",
        },
        {
          kind: "table",
          caption: "Where consent is checked",
          head: ["When", "What is checked", "Source"],
          rows: [
            ["What the discussion covers", "Oxford asks that the standard consent for catheterisation mention the risk of death, about 1 in 1000, which is higher with age, left main stenosis, three-vessel disease, class IV heart failure, poor ventricular function and aortic valve disease", "Oxford ch 10"],
            ["Planning", "Consent obtained and documented before the procedure; when there is no earlier angiogram, talking through what ad hoc PCI offers and risks is essential", "Brilakis 1.1"],
            ["Pre-procedure checklist", "Consent obtained within 30 days and documented in the chart; whether there is a healthcare proxy; resuscitation status (do not resuscitate or intubate) and whether it has been suspended for the procedure", "Brilakis 1.1 (Table 1.1, a US checklist)"],
            ["Ward preparation", "Risks and benefits discussed, then consent obtained and documented according to local guidelines", "Oxford ch 1"],
            ["Arrival in the lab", "The consent form is checked and the patient confirms the signature is theirs; notes reviewed to confirm the test is still indicated", "Oxford ch 1"],
            ["Sign in (WHO checklist)", "Identity, correct procedure and consent form confirmed before sedation or draping", "Oxford ch 2"],
          ],
        },
        {
          kind: "p",
          text: "Ad hoc PCI is where consent most often falls short. Brilakis lists less time for a detailed discussion of risks and benefits among its disadvantages, and gives inadequate informed consent as a reason to delay PCI: for example, when the diagnostic study shows anatomy whose PCI risk is far higher than what was discussed beforehand.",
        },
        { kind: "tip", id: "diag-planning-ad-hoc-consent" },
        {
          kind: "check",
          stem: "A patient consented in clinic to 'coronary angiography and possible PCI' after a discussion of simple single-vessel stenting. On the table you find a calcified distal left main bifurcation. He is comfortable and lightly sedated. What do the manuals support?",
          options: [
            "Proceed, because the signed form says 'possible PCI' and that wording covers any coronary intervention he might need",
            "Ask him to agree now on the table, because he is awake enough to say yes to the extended procedure",
            "Stop after the diagnostic study, explain the findings when he can take them in, and discuss options before any PCI",
            "Proceed, but write a detailed note afterwards, because careful documentation makes up for an incomplete discussion",
          ],
          answer: 2,
          explanation:
            "Brilakis gives inadequate informed consent, such as anatomy carrying a much higher PCI risk than was discussed, as a reason to delay rather than go ad hoc, and complex left main disease is one of his reasons to favour delayed PCI anyway. A form's wording does not make a discussion of simple stenting into consent for left main PCI, a sedated patient on the table cannot weigh new material risks and alternatives properly, and no note written afterwards repairs a missing discussion.",
        },
        { kind: "h", text: "The record: who writes what" },
        {
          kind: "table",
          caption: "The legal record of a procedure is written by the whole team",
          head: ["Team member", "What they record (Oxford ch 2)"],
          rows: [
            ["Cardiologist", "The procedure report: history, indication, anatomy, the steps taken, the equipment (number, type, size and length of each stent), any complication and how it was managed, and the post-procedure plan (taught in hb-after-the-procedure-report)"],
            ["Nurse", "Clear and thorough documentation on the hospital's reporting platform; notes made at the time of any event, ideally by a second circulating nurse; the nurse also acts as the patient's advocate"],
            ["Cardiac physiologist", "A recording of the whole case: baseline and final ECG and pressure printouts, tracings of each main event, start and end times, drugs with their times, contrast volume, equipment, timings of wiring and inflations, inflation pressures and durations, physiology values, ACT times and values, the haemostasis device, total procedure time, fluoroscopy time and dose-area product, any pacing or support-device settings, and the timing and management of any complication"],
            ["Radiographer", "Patient radiation and contrast doses as local policy requires, and archiving of the images to the standards for digital data"],
            ["Scrub nurse at sign out", "Confirmation that the procedure is accurately documented, the equipment and sharps count and wire integrity, any equipment left in the patient, and any unexpected issue still to be dealt with"],
          ],
        },
        {
          kind: "p",
          text: "After a death in the lab, Oxford wants a readable written account from everyone involved: when each event happened, who was in the room, which equipment was used and what they believe caused the death, together with a note of whether the family has been reached and what was said to them. The same standard is a good one after any serious complication.",
        },
        { kind: "tip", id: "pci-safe-scribe-the-timeline" },
        { kind: "h", text: "After a complication or a death: what to report" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Make the patient safe",
              detail: "Treatment comes first; the record and the reports follow.",
            },
            {
              title: "2. Write the operator's account",
              detail: "Put the complication and its management into the procedure report (Oxford's list of what the report must contain), alongside the contemporaneous timeline kept by the team.",
            },
            {
              title: "3. Tell the patient and record it",
              detail:
                "The professional duty of candour asks you to tell the patient, apologise, offer a remedy or support and explain the short- and long-term effects (conversation taught in hb-after-the-procedure-communication). Patients expect an apology to cover what happened, what can be done about any harm and what will be done to stop it happening to someone else. Oxford likewise lists telling the patient and family about any complication, in line with the duty of candour, among the cardiologist's duties. Record the details of the apology in the clinical record. Apologising does not of itself mean admitting legal liability: the guidance cites the Compensation Act 2006 for England and Wales and notes that NHS Resolution will never refuse cover because an apology was given.",
            },
            {
              title: "4. Report the incident early",
              detail:
                "Follow your organisation's incident-reporting policy; the guidance applies early reporting to any incident, because it lets lessons be learnt quickly. The guidance names the national system of its day (the NRLS, or its replacement); that replacement is now complete. In England, patient safety incidents go to the Learn from Patient Safety Events (LFPSE) service, which fully replaced the NRLS when the NRLS was decommissioned on 30 June 2024. In Wales, national policy asks for every patient safety incident to be reported through Datix Cymru (part of the Once for Wales Concerns Management System). Serious suspected adverse reactions to a medicine (contrast included) go to the MHRA through the Yellow Card scheme, and adverse incidents involving medical devices go to the organisation's device safety lead, if there is one, and the national body (the MHRA in England and Wales). After a death in the lab with an iatrogenic complication, Oxford asks the operator to tell the unit manager and fill in an adverse incident report as local policy requires.",
            },
            {
              title: "5. After a death in the lab: the family",
              detail:
                "Oxford asks you to make the effort to reach the next of kin or family and explain how events unfolded, to let the family see the body in privacy if they wish, and to respect any religious requirements. Record that the next of kin were contacted and what they were told.",
            },
            {
              title: "6. After a death in the lab: who must be told",
              detail:
                "Oxford lists informing and discussing an intra-procedural death with the department manager and the coroner among the cardiologist's duties, and advises that the GP be told early, because the GP will support the family through bereavement, and that a post-mortem be requested if the death is unexplained. In England and Wales notifying the coroner is a statutory duty: under the Notification of Deaths Regulations 2019 a registered medical practitioner who suspects that a death was due to a medical treatment or procedure, or who cannot establish its cause, must notify the senior coroner in writing as soon as reasonably practicable. Once the coroner is involved, it is the coroner who can request a post-mortem examination (Coroners and Justice Act 2009, section 14). The other UK nations have their own arrangements; follow the national and local procedure where you work.",
            },
            {
              title: "7. Know the organisation's statutory duty",
              detail:
                "In England, regulation 20 of the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 requires every provider registered with the CQC to be open and transparent with patients and families, and sets out what the provider must do after a 'notifiable safety incident': tell the person, give reasonable support, give truthful information and a timely apology. The CQC can prosecute breaches of parts of it. This organisational duty does not fall on individuals, but your report is how the organisation learns that the duty has been triggered. Scotland has had an organisational duty of candour since 1 April 2018. Wales has had one on providers of NHS services since 1 April 2023, under the Health and Social Care (Quality and Engagement) (Wales) Act 2020. Northern Ireland had consulted on a statutory duty in 2021 but, when the guidance was last updated, had not introduced one.",
            },
          ],
        },
        { kind: "tip", id: "pci-post-complication-candour" },
        {
          kind: "check",
          stem: "After a coronary perforation sealed with a covered stent, a colleague advises you: 'Don't apologise to the patient and don't file an incident report until the legal team has looked at it; anything you say now could be used against you.' What is the correct position?",
          options: [
            "He is right, because an apology given before the investigation is treated as an admission of negligence",
            "Apologise, but delay the incident report until the patient has decided whether to complain",
            "Apologise and report now: an apology is not of itself an admission of liability, and early reporting is required",
            "File the report but do not apologise, because the statutory duty of candour applies only to the organisation and not to you",
          ],
          answer: 2,
          explanation:
            "The GMC/NMC guidance states that apologising does not mean admitting legal liability (citing the Compensation Act 2006 in England and Wales and NHS Resolution's position) and that incidents should be reported early, under the organisation's policy, so lessons are learnt quickly. The organisational statutory duty does fall on the provider, not the individual, but the professional duty to tell and apologise is personal, so it does not excuse silence. Delaying the report until a complaint arrives inverts its purpose.",
        },
        { kind: "h", text: "Radiation law: IR(ME)R 2017" },
        {
          kind: "list",
          items: [
            "**Duty holders.** Hospitals must hold a register of referrers, practitioners and operators. In the cath lab the cardiologist is often all three at once (Oxford ch 1).",
            "**Every exposure.** A clinical evaluation must be recorded for every exposure, fluoroscopy included, and doses should be audited (Oxford ch 1).",
            "**More than expected.** If a dose greater than expected is given, contact the local radiation protection adviser (Oxford ch 1); under IR(ME)R the medical physics expert analyses accidental or unintended exposures.",
            "**A breach is a criminal offence.** Regulation 18 applies the offence provisions of health and safety law, and the regulator enforces them (the CQC in England). Oxford's wording, that overexposure is a matter for criminal rather than civil law, overstates this: prosecution is separate from any civil claim for negligence that a harmed patient may bring.",
            "**Incidents.** Under IR(ME)R an incident is an unintended exposure or one greater than intended; Oxford distinguishes near misses, incidents not requiring notification and incidents requiring notification, and says that in interventional cardiology an overexposure is usually taken to mean at least ten times the intended dose. The regulations require a significant exposure to be investigated at once and notified to the enforcing authority, and the referrer, practitioner and patient to be told of a clinically significant unintended exposure.",
            "**The 1 Gy warning.** The radiographer should warn the operator at 1 Gy; the operator then records the dose in the report and explains it to the patient (Oxford ch 1). Brilakis asks every lab to have a protocol that alerts the operator, for example by announcing the dose every 1 Gy and/or every 30 minutes. Procedures are usually stopped once air kerma exceeds 5–7 Gy (2.5), and he suggests considering stopping and staging the rest at 7–8 Gy (28.2). Above 10 Gy a qualified physicist should promptly calculate the peak skin dose and the skin should be examined at 2–4 weeks; after more than 5 Gy, every patient is followed up within a month (28.2.3).",
            "**In the US.** Brilakis describes a dose above 15 Gy as a sentinel event for the Joint Commission (as air kerma in 28.2.1 and as peak skin dose in 28.2.3), with hospital risk management and the regulators to be contacted within 24 hours.",
          ],
        },
        { kind: "tip", id: "pci-safe-dose-incident-check" },
        {
          kind: "pitfalls",
          items: [
            "Treating 'possible PCI' on a form as consent for anatomy and risks that were never discussed.",
            "A report that says 'uncomplicated' when a complication was treated; the physiologist's tracings and the images will say otherwise.",
            "Notes of a crisis written hours later from memory, without times or names.",
            "Not apologising for fear of liability, or waiting for the investigation before reporting.",
            "Leaving a high dose unrecorded and unexplained because the patient seemed well.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford makes the point after a death in the lab that effective communication can often avoid complaints and litigation; the same is likely to hold after any complication. Tell the patient promptly and honestly, and make sure the record says the same thing you told them.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Run a full procedure case. At sign in, confirm identity, procedure and consent. At the end, write the operator's account as Oxford lists it, check that the dose and contrast are recorded, and decide whether any event needs an incident report or an explanation to the patient. Practise the disclosure conversation itself in hb-after-the-procedure-communication.",
        },
        { kind: "video", id: "JUYPS0-Pap8", note: "When disaster strikes (Brilakis channel)." },
        {
          kind: "keypoints",
          items: [
            "Refusal of consent is the only absolute contraindication to catheterisation (Oxford); consent is a documented discussion of material risks and reasonable alternatives (Montgomery, GMC 2020).",
            "Inadequate consent for what the angiogram shows is a reason to defer ad hoc PCI (Brilakis).",
            "The record is written by the whole team: report, nursing notes, the physiologist's timed log, doses, images and the sign out.",
            "After a death: timed, legible notes of events, people, equipment and presumed mechanism; next of kin, with privacy and religious needs respected; manager and GP; a statutory notification to the coroner (England and Wales), who can then request a post-mortem.",
            "Apologise and record it; an apology is not of itself an admission of liability; report incidents early under local policy.",
            "In England the statutory duty of candour (regulation 20) falls on CQC-registered providers; the professional duty falls on you.",
            "IR(ME)R 2017: register of duty holders, clinical evaluation for every exposure, dose audit, radiation protection adviser for unexpected doses, notification of significant exposures.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-safe-practice-wellbeing",
      title: "Looking after yourself: burnout, sleep, your body and the aftermath of a complication",
      minutes: 15,
      topics: ["pro-wellbeing"],
      sources: [O("ch 10: Death"), O("ch 1: Radiation safety"), B("2.9"), B("6.4"), B("7.1"), B("7.3"), B("21.8"), B("28.2")],
      refs: [
        ...BOOKS,
        "simsek-wellbeing-survey-2023",
        "lobo-sleep-survey-2019",
        "sandoval-sleep-deprivation-2018",
        "iverson-sleep-pci-outcomes-2018",
        "klein-occupational-hazards-2015",
        "wu-second-victim-2000",
        "touma-operator-grief-2025",
      ],
      blocks: [
        {
          kind: "p",
          text: "Brilakis counts the operator's and staff's condition, for example whether they are rested or sleep deprived, among the things that can change the outcome of a PCI. Your wellbeing is therefore part of patient safety, not an optional extra. This lesson goes beyond the Academy's overview (bed-ind-human-factors-wellbeing and bed-ind-radiation-ergonomics) to what the published surveys actually show, and to concrete steps for your mind, your body and your team.",
        },
        { kind: "h", text: "Burnout: what an international survey found" },
        {
          kind: "p",
          text: "In January 2023, 1,159 interventional cardiology attendings and 192 fellows answered an online well-being survey led from Minneapolis. The figures below are for attendings unless stated; the authors warn of selection bias, because those interested in mental health were more likely to reply.",
        },
        {
          kind: "table",
          caption: "International psychological well-being survey of interventional cardiologists (Simsek 2023)",
          head: ["Finding", "Result"],
          rows: [
            ["Clinical hours", "Mean 63 ± 14 a week (fellows 67 ± 14)"],
            ["Burnout", "69% said burnout affected their life; 64% emotionally exhausted; 78% felt they were working too hard"],
            ["Leaving", "41% had considered leaving their job in the past year; 32% were considering it now"],
            ["Loneliness and unhappiness", "84% felt lonely overall; 28% were unhappy with their life, more often if single (54% vs 25%)"],
            ["On call", "Burnout more common with call three or more times a week (74% vs 66%)"],
            ["Main contributors", "Excessive documentation, lack of administrative support, bureaucratic tasks, insufficient income (fellows rated income highest)"],
            ["Coping", "Talking with family and friends was the leading strategy; 67% had someone to share mental health concerns with"],
            ["Support", "Only 37% had access to mental health support through their employer; 76% were not under, and not seeking, professional care"],
            ["What they asked for", "The main proposed solutions were better administrative support (86%) and removing rules and regulations that do not contribute to patient care (84%)"],
            ["Fellows", "48% felt lonely overall; 29% had considered leaving their job in the past year and 15% were considering it now"],
          ],
        },
        {
          kind: "p",
          text: "The authors suggest that the stigma attached to mental disorders, and fear of professional consequences, may be one reason physicians avoid mental health care, and that employers could offer access to mental health professionals in an anonymised way.",
        },
        { kind: "h", text: "Sleep: what is known and what is not" },
        {
          kind: "list",
          items: [
            "**The manuals.** Brilakis asks the team to watch its operational state for conditions such as excessive fatigue (2.9), lists operator or patient fatigue as reasons to delay ad hoc PCI and to stage the remaining lesions (7.3), and patient or physician fatigue as a reason to stop a CTO attempt (21.8).",
            "**Self-reported harm.** In a multidisciplinary survey (481 of 6,683 invited cardiovascular workers replied, 7.2%; 70% interventional cardiologists), 91% had call duties and 43% did seven or more call nights a month; 25% reported a sleep disorder and 25% used sleep-inducing medication. Sleep deprivation was associated with difficulty concentrating (58%), lack of motivation (56%) and irritability (68%); 46% felt it hindered their work, 8.6% reported an adverse event such as a complication that they thought was likely related, 56.5% felt burnt out, and 85% thought there should be policies letting sleep-deprived staff go home early after call.",
            "**Measured outcomes.** In one centre's 12,680 daytime PCIs (2009 to 2016), 367 (2.9%) were done by operators who had operated between midnight and 7 am the same day. In-hospital death (1.1% vs 1.3%) and bleeding within 72 hours (3.9% vs 2.9%) did not differ significantly.",
            "**The wider picture.** A review from the same group notes that sleep deprivation in general is linked to impaired performance, cognitive deficits, reduced psychomotor vigilance and workplace errors and injuries, but that data specific to interventional cardiology are scarce.",
          ],
        },
        {
          kind: "check",
          stem: "A colleague cites the single-centre study in which PCI outcomes after a night case did not differ, and argues that fatigue therefore does not matter in the lab. What is the most accurate response?",
          options: [
            "He is right; the study shows that sleep deprivation has no effect on any aspect of an interventional cardiologist's performance",
            "It measured only death and bleeding in one centre; surveys report poor concentration and related events, so manage fatigue",
            "The study proves fatigue is dangerous, because its sleep-deprived group had a higher in-hospital mortality than the rested group",
            "The study is irrelevant, because only randomised trials can say anything at all about operator fatigue and patient outcome",
          ],
          answer: 1,
          explanation:
            "Iverson and colleagues found no significant difference in in-hospital death or 72-hour bleeding, in one centre, for a small group of post-call cases; that is not proof of no effect on other outcomes. Self-reports of impaired concentration and adverse events, the general sleep literature and Brilakis's own advice to stage or stop for fatigue all point to managing it. Mortality was numerically lower, not higher, in the post-call group, and observational data are not irrelevant just because they are not randomised.",
        },
        { kind: "tip", id: "pci-safe-state-check" },
        { kind: "tip", id: "pci-mon-fatigue-defer" },
        { kind: "h", text: "Your body: orthopaedic strain" },
        {
          kind: "p",
          text: "In a 2014 survey of members of the US interventional society (314 replies), 49.4% of operators reported at least one orthopaedic injury: lumbar spine problems in 34.4%, cervical spine disease in 24.7% and hip, knee or ankle problems in 19.6%. Age was the strongest correlate and annual caseload was also associated; 6.9% had limited their caseload because of radiation exposure and 9.3% had had a health-related period of absence. The authors noted that the problem had persisted since an earlier survey in 2004 despite greater awareness. The survey also asked about radiation-associated problems and reported that some respondents had had cancer, which the authors described as 'a small but substantial incidence' (the abstract gives no figure and no comparison group); radiation risk and protection are taught in hb-lab-and-radiation.",
        },
        {
          kind: "steps",
          title: "Setting up to protect your back and neck",
          items: [
            {
              title: "1. Table height",
              detail: "Brilakis puts the table as high as possible while it stays comfortable and ergonomic for the operator, with the image receptor close to the patient.",
            },
            {
              title: "2. The apron",
              detail: "Oxford notes that a separate top and skirt may suit those with back problems better than a one-piece apron, and that gowns of higher lead equivalence (most are 0.25–0.35 mm) are heavier.",
            },
            {
              title: "3. Suspended protection where available",
              detail: "Brilakis describes a ceiling-suspended lead system that protects the operator while removing the need to wear lead, and with it the orthopaedic injuries that wearing lead brings.",
            },
            {
              title: "4. Distance and shielding",
              detail: "Stand as far from the patient and tube as the task allows, with the shield between you and the patient; dose reduction is taught in hb-lab-and-radiation.",
            },
          ],
        },
        { kind: "tip", id: "diag-safe-ergonomic-setup" },
        { kind: "h", text: "After a complication or a death" },
        {
          kind: "p",
          text: "Oxford calls a death in the lab one of its most traumatic events: often a long resuscitation with many staff, physically and psychologically draining. It makes the cardiologist in charge responsible for making sure staff can talk the case through and, where needed, for cancelling or postponing the procedures that follow, and notes that some hospitals offer counselling for staff involved in a death. Wu's 2000 BMJ editorial describes the clinician who makes a mistake as a 'second victim' who needs help too. Touma and colleagues describe grief, self-doubt and psychological trauma after a procedural death, made worse by silence and lack of institutional support, and propose reflective practice, reconnecting with the patient's family, peer conversation, structured debriefing and support suited to the person's culture, within an organisation that treats vulnerability as part of professionalism.",
        },
        {
          kind: "steps",
          title: "Looking after yourself and the team, step by step",
          items: [
            {
              title: "1. Before the list",
              detail: "Check your own state and the team's. If you operated through the night, say so at the brief and plan accordingly: a colleague for the complex case, staging rather than finishing everything.",
            },
            {
              title: "2. Straight after a major event",
              detail: "Hold the debrief, give the team time to talk, and decide openly whether the next case should start now or wait. Oxford asks the cardiologist to debrief the team at the end of the day as well, especially after a complication (hb-after-the-procedure).",
            },
            {
              title: "3. In the days after",
              detail: "Talk to someone: a mentor, a trusted colleague, family. Replaying the case (Touma's 'replay loops') is a recognised barrier to recovery; notice it rather than suppress it, and give it a shape with the structured review in hb-safe-practice-reflection.",
            },
            {
              title: "4. Know your support before you need it",
              detail: "Find out now whether your employer offers occupational health or confidential psychological support; in the survey only 37% had such access.",
            },
            {
              title: "5. Look after the body",
              detail: "Ergonomic set-up every case, and attention to the neck, back and joints before they fail.",
            },
            {
              title: "6. Protect your time",
              detail: "Documentation and bureaucracy led the survey's list of contributors to burnout; manage the work that can be planned so that the unplanned work does not take everything.",
            },
          ],
        },
        { kind: "tip", id: "pci-safe-pause-after-major-event" },
        {
          kind: "check",
          stem: "A patient has died in the lab after a long, unsuccessful resuscitation. The next elective case is already on the trolley outside, and the nurse in charge asks whether to bring it in. What does Oxford advise?",
          options: [
            "Bring the next patient in at once, because keeping busy is the best way for the team to cope with the death",
            "Make sure the team can talk the case through first, and postpone or cancel the next procedures if needed",
            "Let the most junior member of staff decide, because the operator is too involved to judge whether to continue",
            "Continue the list and arrange counselling for the team at the end of the week when the workload is lighter",
          ],
          answer: 1,
          explanation:
            "Oxford makes the cardiologist in charge responsible for giving staff time to talk after a death in the lab and, if needed, cancelling or postponing further procedures; it describes such a death as physically and psychologically demanding for everyone involved. Carrying straight on, or deferring support to the end of the week, ignores that. The decision belongs to the cardiologist in charge, not the most junior person present.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating fatigue as a private matter instead of telling the team at the brief.",
            "Starting the next case straight after a death or a major complication without a pause.",
            "Suppressing the reaction to a bad outcome rather than talking it through.",
            "Not knowing what support your employer offers until you need it.",
            "Wearing a heavy one-piece apron through long lists with a bad back when a two-piece or suspended system is available.",
          ],
        },
        {
          kind: "pearl",
          text: "Put yourself on the checklist. At the morning brief, the operator's state ('I was in at three for a primary') is as relevant as the creatinine. Saying it aloud lets the team plan for it, and Brilakis lists it among the factors that change outcome.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Before your next diagnostic case, tell the attending your state as you would at a real brief, set the table height and choose the protection you will wear. After the case, use the debrief to note one thing about your own condition or set-up that you would change.",
        },
        { kind: "video", id: "_9gHUtZwshI", note: "A lecture on an approach to time management." },
        {
          kind: "keypoints",
          items: [
            "The operator's condition is part of the benefit-risk balance (Brilakis); say it at the brief.",
            "International survey (1,159 attendings, 192 fellows): 69% of attendings said burnout affected their life; they averaged 63 clinical hours a week; only 37% had mental health support through their employer.",
            "In one survey 58% of respondents linked sleep deprivation with difficulty concentrating; one centre found no difference in death or bleeding. Manage fatigue as a risk: stage, share, stop.",
            "About half of surveyed operators report an orthopaedic injury; table height, a two-piece apron for back problems and suspended protection help.",
            "After a death: time to talk, postpone if needed, counselling where offered (Oxford).",
            "The operator after a complication is a 'second victim'; peer conversation, structured debriefing and reflective practice help recovery.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-safe-practice-mindset",
      title: "Decisions under pressure: rehearsal, control and the Stoic approach",
      minutes: 14,
      topics: ["pro-mindset"],
      sources: [B("1.1"), B("2.5"), B("2.10"), B("7.1"), B("7.3"), B("21.8"), B("25.1"), B("28.2"), O("ch 2: The cardiologist"), O("ch 1: Catheter laboratory preparation")],
      refs: [...BOOKS, "brown-stoic-training-2022", "harerimana-stoic-attitudes-2025", "touma-operator-grief-2025"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis opens his chapter on acute vessel closure with a human observation, not a technical one: a sudden closure stresses the patient and the operator, and that stress may lead the operator to pull out the very wire that is needed to rescue the vessel. Technique fails when the mind does. This lesson is about preparing your mind before the case and keeping it working during the worst part of one, using the manuals' own advice and what the Stoic tradition (the subject of a talk on the Brilakis channel about CTO and complex PCI) does and does not offer.",
        },
        { kind: "h", text: "What the Stoic approach is, and what it is not" },
        {
          kind: "list",
          items: [
            "**What it is.** Stoicism is an ancient Greek and Roman philosophy. Brown and colleagues describe it as a way of processing negative feelings while keeping human connection; it advocates accepting what you cannot control, and controlling emotions in the sense of keeping them appropriate, not suppressing them. Stoic ideas underpin cognitive behavioural therapy, though CBT has since developed independently.",
            "**What it is not.** The same authors say Stoicism is widely misrepresented in medicine as a 'stiff upper lip' of detachment and suppressed emotion. A scoping review draws the distinction explicitly: Stoicism the philosophy promotes resilience, self-control and rational acceptance of adversity, whereas stoic attitudes or pseudo-stoicism (silent endurance and emotional suppression) were linked, in patients with cancer, to reduced support and delayed help-seeking. The same review found that stoic traits were sometimes associated with persistence and adherence to treatment.",
            "**Three practices.** Negative visualisation (imagining what could go wrong and planning for it), Stoic mindfulness (noticing how you are thinking and feeling) and Stoic reflection.",
            "**The evidence.** In a 12-day online Stoic programme for 24 third-year medical students, scores for Stoic attitudes, resilience and empathy rose, but changes in Stoic attitudes did not correlate with changes in resilience or empathy; the study was small, uncontrolled and self-selected. In interviews, students said negative visualisation helped them feel prepared and make contingency plans rather than catastrophise.",
          ],
        },
        {
          kind: "table",
          caption: "Stoic practices mapped onto the manuals' advice",
          head: ["Practice", "In the lab", "Anchor in the manuals"],
          rows: [
            ["Negative visualisation", "Before the case, say what could go wrong at each step and what you would do", "Brilakis teaches every step as goal, how, challenges and what can go wrong, and makes planning the first step of every PCI: he expects the plan to change as new information arrives during the case, but holds that having one before starting is of great value"],
            ["Accepting what you cannot control", "During a complication, put attention on the next action you control, not on the outcome or on blame", "Brilakis: stay calm and keep the true-lumen wire during acute closure"],
            ["Preparation of roles", "Know before the case who does what if it goes wrong", "Oxford: the brief covers each team member's role in a complication or arrest, and the team should know routines such as who defibrillates before the case starts"],
            ["Reflection", "After the case, review it in a structured way", "Brilakis's causes, prevention and treatment frame (lesson hb-safe-practice-reflection)"],
          ],
        },
        { kind: "tip", id: "pci-safe-name-what-could-go-wrong" },
        {
          kind: "check",
          stem: "A fellow says: 'I'm a Stoic about complications. When one happens I just switch my feelings off and never talk about it afterwards.' Which reply reflects the sources?",
          options: [
            "Good: suppressing emotion completely is the core Stoic skill, and it protects an operator from burnout over a long career",
            "That is pseudo-stoicism: Stoicism keeps emotions appropriate; suppression is linked to late help-seeking in cancer patients",
            "Good, provided he also avoids reviewing the case afterwards, since revisiting a complication only reinforces the fear of it",
            "It makes no difference what attitude he takes, because only technical skill determines how his complications turn out",
          ],
          answer: 1,
          explanation:
            "Brown and colleagues describe the 'stiff upper lip' image as a misrepresentation: Stoic emotional control means keeping emotions appropriate, not suppressing them, and a scoping review in patients with cancer links pseudo-stoic suppression to reduced support and delayed help-seeking. Avoiding review throws away the learning, and Touma lists compartmentalisation among barriers to recovery. Brilakis's own observation, that operator stress can lead to the wire being pulled, shows the operator's state affects the outcome.",
        },
        { kind: "h", text: "When the case goes wrong: deciding under pressure, step by step" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Stop, and say what you see",
              detail: "Name the event aloud ('the vessel has closed', 'pressure is falling') so the team is working on the same problem. Brilakis's first instruction for acute closure is to remain calm.",
            },
            {
              title: "2. Secure what you already have",
              detail: "Keep the true-lumen wire where it is; Brilakis warns that losing it can be catastrophic, especially with a dissection, and that guide manipulation can pull it out. Do not trade a position you have for one you hope to regain.",
            },
            {
              title: "3. Quiet the room",
              detail: "Brilakis asks for a rule like aviation's sterile cockpit during critical parts of a procedure: only the tasks and talk needed for safety.",
            },
            {
              title: "4. Separate what you control from what you do not",
              detail: "You control the next action, the help you call and the information you gather; you do not control the anatomy or the outcome. Spend attention only on the first list.",
            },
            {
              title: "5. Re-weigh benefit and risk at this stage",
              detail: "Brilakis asks for the individual balance of risk and benefit to guide each stage of the procedure, not only the decision to start. A complication, fatigue, or a contrast or dose already high all shift the balance towards staging the rest (7.3).",
            },
            {
              title: "6. Use the stopping rules you set beforehand",
              detail: "For CTO PCI, Brilakis's reasons to stop are a complication, a high radiation dose (usually more than 5 Gy air kerma without crossing or substantial progress), contrast above 3.7 times the estimated creatinine clearance, crossing options exhausted, and patient or physician fatigue. He adds that it is often wiser to settle for STAR (subintimal tracking and re-entry, used today as a bail-out that prepares the vessel for a repeat attempt after 2–3 months) or to accept failure than to persist with very aggressive strategies that could cause serious complications. Outside CTO work, procedures are usually stopped once air kerma exceeds 5–7 Gy (2.5), and Brilakis suggests considering stopping and staging at 7–8 Gy (28.2).",
            },
            {
              title: "7. Call for help early",
              detail: "A second experienced operator, the anaesthetist or the surgeon; the levels of entrustment and when to call are in hb-the-operator-entrustment.",
            },
          ],
        },
        { kind: "tip", id: "pci-safe-control-the-controllable" },
        { kind: "tip", id: "pci-mon-sterile-cockpit" },
        { kind: "tip", id: "pci-safe-cto-stop-rules" },
        {
          kind: "check",
          stem: "Two hours into a right coronary CTO, the air kerma is 5.4 Gy, you have tried antegrade wiring and dissection re-entry without crossing, the contrast is approaching your limit, and you feel exhausted. You suddenly think of one more approach you have not tried. What do Brilakis's stopping rules suggest?",
          options: [
            "Try the new approach, because stopping now would waste the dose and contrast the patient has already received today",
            "Stop: the dose is past 5 Gy without progress, contrast is near its limit and you are exhausted; stage it",
            "Hand over to a colleague and let them continue straight away with the same contrast and radiation budget",
            "Try the new approach but double the frame rate, so that the remaining attempt takes as little time as possible",
          ],
          answer: 1,
          explanation:
            "Brilakis lists high radiation dose (usually over 5 Gy air kerma without crossing or substantial progress), large contrast volume, exhaustion of options and physician fatigue among reasons to stop, and holds that it is often wiser to settle for STAR (a bail-out that prepares for a repeat attempt) or to accept failure than to persist with very aggressive strategies that risk serious complications. The dose and contrast already given are sunk costs, not reasons to continue. A fresh colleague does not reset the patient's dose or contrast, and a higher frame rate increases dose.",
        },
        {
          kind: "pitfalls",
          items: [
            "Confusing Stoicism with suppression: switching feelings off and never discussing the case.",
            "Pulling back a true-lumen wire in the panic of an acute closure.",
            "A noisy room during the critical minutes of a bail-out.",
            "Continuing because of what has already been spent (dose, contrast, time) rather than what further effort is likely to achieve.",
            "Setting stopping rules only once you are already tired and invested in the case.",
          ],
        },
        {
          kind: "pearl",
          text: "Rehearse the bad minute before it happens. At the brief, take the step most likely to go wrong in this case and say aloud the first three things you would do. When it happens, you are carrying out a plan instead of inventing one under stress, which is the practical point of negative visualisation and of Brilakis's 'what can go wrong' question.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Open the mid-RCA CTO scenario in the PCI lab. Before starting, write your stopping rules (dose, contrast as a multiple of creatinine clearance, time, your own state) and the first three actions you would take for a perforation and for an acute closure. Stop when a rule is reached, whatever the angiographic progress, and in the debrief compare what you did with what you planned.",
        },
        { kind: "video", id: "Enkdl19ROrc", note: "How the Stoic philosophy can help with CTO and complex PCI." },
        { kind: "video", id: "E3_npnmSv0I", note: "Canoeing the Boundary Waters: 15 lessons for CTO PCI." },
        {
          kind: "keypoints",
          items: [
            "Operator stress during a complication can cost the wire; remain calm and keep the true-lumen position (Brilakis 25.1).",
            "Stoicism keeps emotions appropriate and accepts what cannot be controlled; pseudo-stoic suppression has been linked, in patients with cancer, to delayed help-seeking.",
            "Negative visualisation is the manual's 'what can go wrong' question, asked before the case with a plan for each answer.",
            "Under pressure: say it aloud, secure the wire, quiet the room, act on what you control, re-weigh benefit and risk, use pre-set stopping rules, call for help.",
            "Brilakis's CTO stopping reasons: complication, more than 5 Gy without progress, contrast above 3.7 × creatinine clearance, options exhausted, patient or physician fatigue.",
            "Dose, contrast and time already spent are not reasons to continue.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-safe-practice-q1",
      stem: "According to the Oxford handbook, what is the only absolute contraindication to cardiac catheterisation?",
      options: [
        "Acute kidney injury with a rising creatinine",
        "A known allergy to radiographic contrast",
        "Refusal of consent by the patient",
        "Untreated coagulopathy with active bleeding",
      ],
      answer: 2,
      explanation:
        "Oxford lists acute kidney injury, contrast allergy, untreated coagulopathy and several others as relative contraindications; the only absolute one is the patient's refusal of consent. Contrast allergy is the tempting answer, but it can be managed with pretreatment and is relative.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "hb-safe-practice-q2",
      stem: "In Brilakis's manual, which three questions are applied to every challenge and complication?",
      options: [
        "Who was involved, when did it occur, and was it reported",
        "Potential causes, prevention, and treatment strategies",
        "Goal of the step, how it is done, and the challenges met",
        "Severity, frequency, and the cost of the consequences",
      ],
      answer: 1,
      explanation:
        "Brilakis teaches each step of PCI as goal, how, challenges and what can go wrong, and then discusses each challenge and complication by its causes, prevention and treatment. Goal, how and challenges is the step template, not the complication frame, which is why it is the most tempting distractor.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "hb-safe-practice-q3",
      stem: "An operator has done 300 diagnostic angiograms in a year and has had 9 vascular complications. Using Oxford's rate of 1–2% for vascular complications of diagnostic catheterisation, what is the best interpretation?",
      options: [
        "The rate is 3%, one and a half times the upper benchmark, so this proves a skill problem that requires suspension from the list",
        "About 3–6 would be expected; 9 is above that, so review case mix, definitions and technique before concluding anything",
        "Nine events is fewer than ten, so the series is too small for any comparison and nothing should be looked at",
        "The operator should be ranked against colleagues in a league table to see where the 3% places them",
      ],
      answer: 1,
      explanation:
        "Expected events are cases × benchmark rate: 300 × 1–2% is 3–6. Nine is above that range and deserves a look at case mix, definitions (was every haematoma counted the same way as the benchmark?) and technique, ideally on a funnel plot. It does not prove a skill problem on its own, and ignoring it is equally wrong. League tables are the spurious ranking that funnel plots were designed to replace. Check, too, that the benchmark fits your access route, case mix and definitions: Oxford's 1–2% does not state the access route, so it may overestimate the expected rate for a radial-first practice.",
      difficulty: 3,
      refs: [...OXFORD, "spiegelhalter-funnel-plots-2005"],
    },
    {
      id: "hb-safe-practice-q4",
      stem: "Which statement about the UK national PCI registry (BCIS), as described in 2011, is correct?",
      options: [
        "It records only successful procedures in which a stent was implanted, with outcomes followed to one year",
        "Its data are externally validated by an independent auditor visiting every centre before any report is issued to that centre",
        "It counts every PCI attempt, follows outcomes to discharge and feeds back risk-adjusted results, without external validation",
        "It covers only a sample of UK centres, chosen afresh each year so as to represent national practice fairly",
      ],
      answer: 2,
      explanation:
        "Ludman describes a registry of all PCI attempts in all UK PCI hospitals since 1994, with 113 variables and outcomes up to hospital discharge, local validation and range checks but no external validation, and feedback that includes risk-adjusted outcomes. The 'successful stents only' option is the error that most distorts a personal audit.",
      difficulty: 2,
      refs: ["ludman-bcis-registry-2011"],
    },
    {
      id: "hb-safe-practice-q5",
      stem: "A study compared US states that publicly reported PCI outcomes with nearby states that did not, in Medicare patients with acute myocardial infarction. What did it find?",
      options: [
        "Lower overall myocardial infarction mortality in reporting states, because reporting drove up the quality of PCI",
        "Less PCI in reporting states, most marked in STEMI and shock or arrest, with no difference in overall mortality",
        "More PCI in reporting states, because hospitals competed to treat more patients and publish higher volumes",
        "No difference in either PCI use or mortality, so public reporting had no measurable effect on behaviour",
      ],
      answer: 1,
      explanation:
        "Joynt and colleagues found patients in reporting states less likely to receive PCI, with the largest gaps in STEMI and in cardiogenic shock or cardiac arrest, and no difference in overall myocardial infarction mortality. The point for audit design is that a measure can be improved by avoiding high-risk patients. The study did not show a mortality benefit from reporting.",
      difficulty: 3,
      refs: ["joynt-public-reporting-2012"],
    },
    {
      id: "hb-safe-practice-q6",
      stem: "Under the GMC/NMC guidance on the duty of candour, which statement is correct?",
      options: [
        "An apology should be withheld until the investigation is complete, because apologising admits legal liability",
        "Apologising does not of itself admit liability; record the apology in the notes and report the incident early",
        "The statutory duty of candour in England falls on each individual clinician, who can be prosecuted by the CQC",
        "Near misses never need to be mentioned to the patient, because by definition no harm resulted from them",
      ],
      answer: 1,
      explanation:
        "The guidance says an apology does not mean admitting legal liability, asks for its details to be recorded in the clinical record, and asks for incidents to be reported early so lessons are learnt quickly. The statutory duty in England (regulation 20) falls on CQC-registered providers, not individuals. Near misses should be discussed when the patient needs or would want to know.",
      difficulty: 2,
      refs: ["gmc-nmc-candour-2015"],
    },
    {
      id: "hb-safe-practice-q7",
      stem: "During a long PCI the radiographer warns you that the dose has passed 1 Gy. Under Oxford's account of dose excess and IR(ME)R, what follows?",
      options: [
        "Nothing until 10 Gy, because only a tenfold overexposure counts as an incident and smaller doses need no record or explanation",
        "Record the dose and explain it to the patient; if it is greater than expected, contact the radiation protection adviser",
        "Stop the procedure immediately, whatever stage it has reached, because 1 Gy is the legal maximum dose for a coronary procedure",
        "Notify the coroner and the CQC within 24 hours, because any dose above 1 Gy counts as a sentinel event",
      ],
      answer: 1,
      explanation:
        "Oxford asks the radiographer to warn at 1 Gy and the operator to record the dose in the report and tell the patient; any dose greater than expected means contacting the radiation protection adviser. The tenfold figure is different: it is how Oxford defines an overexposure for classifying incidents, not the trigger for calling the adviser. 1 Gy is a warning point, not a legal maximum, and the 24-hour sentinel-event rule Brilakis describes is a US Joint Commission rule for doses above 15 Gy.",
      difficulty: 2,
      refs: [...BOOKS, "irmer-2017"],
    },
    {
      id: "hb-safe-practice-q8",
      stem: "What did the single-centre study of 12,680 daytime PCIs find for procedures performed by operators who had operated between midnight and 7 am the same day?",
      options: [
        "Significantly higher in-hospital mortality, which led to a policy banning post-call operating",
        "Significantly more bleeding within 72 hours but no difference in mortality between the two groups",
        "No significant difference in in-hospital death or 72-hour bleeding compared with rested operators",
        "Fewer complications, because post-call operators chose only simple cases for the following day",
      ],
      answer: 2,
      explanation:
        "Iverson and colleagues found 367 (2.9%) post-call PCIs, with in-hospital death 1.1% vs 1.3% and 72-hour bleeding 3.9% vs 2.9%, neither significantly different. Bleeding was numerically higher but not significantly, which is why the answer claiming significantly more bleeding tempts. The finding is from one centre and covers only these outcomes; surveys and Brilakis's advice still treat fatigue as a risk to manage.",
      difficulty: 3,
      refs: ["iverson-sleep-pci-outcomes-2018", ...BRILAKIS],
    },
    {
      id: "hb-safe-practice-q9",
      stem: "Which statement about the Stoic approach is supported by the sources used in this module?",
      options: [
        "It teaches emotional suppression and detachment, which have been shown to protect clinicians from burnout and from delays in seeking help",
        "Stoic control keeps emotions appropriate; suppression (pseudo-stoicism) is linked, in cancer patients, to delayed help-seeking",
        "A large randomised trial has shown that Stoic training reduces complication rates among operators in interventional cardiology",
        "It requires an operator to accept every outcome passively and never to change practice after a complication",
      ],
      answer: 1,
      explanation:
        "Brown and colleagues describe Stoic emotional control as keeping emotions appropriate rather than suppressing them, and a scoping review in patients with cancer links pseudo-stoic suppression to delayed help-seeking. The only trial-type evidence cited is a small, uncontrolled study of 24 medical students, not a randomised trial in operators. Accepting what you cannot control is not the same as passivity: reflection and change remain part of the practice.",
      difficulty: 2,
      refs: ["brown-stoic-training-2022", "harerimana-stoic-attitudes-2025"],
    },
    {
      id: "hb-safe-practice-q10",
      stem: "Which of the following is NOT among Brilakis's reasons to stop a CTO PCI attempt?",
      options: [
        "A complication occurring during the procedure",
        "More than 5 Gy air kerma without crossing or substantial progress",
        "The procedure has lasted longer than one hour",
        "Contrast above 3.7 times the estimated creatinine clearance",
        "Patient or physician fatigue during the attempt",
      ],
      answer: 2,
      explanation:
        "Brilakis's reasons are a complication, a high dose (usually more than 5 Gy air kerma without crossing or substantial progress), contrast above 3.7 times the estimated creatinine clearance, exhausted crossing options, and patient or physician fatigue. He sets no one-hour limit; in the PROGRESS CTO registry the median procedure lasted 123 minutes, and duration matters through dose, contrast and fatigue.",
      difficulty: 2,
      refs: [...BRILAKIS, "tajti-progress-hybrid-2018"],
    },
    {
      id: "hb-safe-practice-q11",
      stem: "After a death in the lab, which set of actions matches Oxford's guidance?",
      options: [
        "Timed notes of events, staff, kit and presumed cause; contact next of kin; notify coroner and unit manager; tell the GP; time to talk",
        "Brief notes written by the operator alone; leave the family to the ward team; continue the list; file an incident form within the month",
        "Wait for the post-mortem result before anyone writes notes, so that the presumed mechanism recorded in them is the correct one",
        "Inform the GP only after the coroner's inquest, so that the family receives a single consistent account",
      ],
      answer: 0,
      explanation:
        "Oxford asks every member of staff to write legible notes timing each event and recording who was there, what equipment was used and how they think the patient died; to contact the next of kin and document what was said; to involve the department manager and the coroner; to tell the GP early for bereavement support; and to give staff time to talk, postponing cases if needed. In England and Wales the coroner must be notified in writing (Notification of Deaths Regulations 2019), and the coroner can then request a post-mortem. Waiting for the post-mortem or the inquest delays the record and the family's support.",
      difficulty: 2,
      refs: [...OXFORD, "notification-of-deaths-2019"],
    },
    {
      id: "hb-safe-practice-q12",
      stem: "In a 2014 survey of US interventional cardiologists, about what proportion reported at least one orthopaedic injury, and which factor correlated most strongly with it?",
      options: [
        "About 10%, most strongly with the use of radial rather than femoral access",
        "About 25%, most strongly with the number of CTO procedures performed",
        "About half, most strongly with the operator's age, and also with annual caseload",
        "About 75%, most strongly with the weight of the thyroid collar the operator wears",
      ],
      answer: 2,
      explanation:
        "Klein and colleagues reported that 49.4% had at least one orthopaedic injury (lumbar 34.4%, cervical 24.7%, hip, knee or ankle 19.6%), with age the strongest correlate and annual caseload also associated. Access route and CTO volume were not reported as the main correlates.",
      difficulty: 3,
      refs: ["klein-occupational-hazards-2015"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Run a case and review it in the debrief with the reflection template: timeline, decision points, goal/how/challenge/what went wrong, causes/prevention/treatment, system factors, one action." },
    { sim: "procedure", task: "Run a full procedure: confirm consent at sign in, write the operator's account at the end, and decide what needs recording, reporting or explaining to the patient." },
  ],
  caseIds: ["hb-safe-practice-case-post-call-dissection"],
};

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "hb-safe-practice-case-post-call-dissection",
    title: "After the night before: a dissection, the record, the patient and the M&M",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, Introduction, 2.6, 2.9, 2.10, 7.1.8, 7.3, 25.1 and 25.2; Oxford Handbook ch 2 (the cardiologist, the nurse, the cardiac physiologist), ch 10 (death: documentation, handling staff) and ch 11 (results); GMC/NMC candour guidance; Iverson 2018, Lobo 2019, Simsek 2023, Spiegelhalter 2005, Touma 2025",
    },
    summary:
      "A post-call operator faces a complex elective PCI, a flow-limiting dissection, the record, the conversation with the patient, his own reaction and the M&M meeting, and is then asked to rank operators by their complication rates.",
    presentation:
      "You are a newly independent interventional cardiologist. You were called in at 02:30 for a primary PCI and finished at 04:15. At 08:00 your elective list starts with a 66-year-old man with stable angina despite two drugs and a heavily calcified, tortuous mid-RCA stenosis, booked for PCI after a heart team discussion. He has given consent for RCA PCI, including a discussion of dissection, perforation and emergency surgery.",
    findings: [
      "Operator: about 2 hours of sleep before the list",
      "Patient: eGFR 58 mL/min/1.73 m²; no previous radiation exposure",
      "Lesion: calcified, tortuous mid-RCA stenosis; previous diagnostic angiogram available",
      "A senior colleague is in the next lab on a diagnostic list",
    ],
    steps: [
      {
        id: "s1-brief",
        prompt: "At the 08:00 team brief, what do you do about your own state?",
        info: "The nurse in charge reads out the list. Nobody has asked about the night.",
        options: [
          {
            text: "Tell the team you were up for a primary until after 4 am, and ask the senior colleague whether he will take the complex RCA case or scrub with you for it",
            best: true,
            feedback:
              "Right. Brilakis counts the operator's condition (rested or sleep deprived) in the benefit-risk balance and asks the team to watch its operational state for fatigue. Saying it aloud lets the team plan: a second operator for the hardest case is a proportionate response.",
            stateDelta: { stability: 5, flags: ["fatigue-declared", "post-call-case"] },
          },
          {
            text: "Say nothing and start: you feel fine, and a single-centre study found no difference in outcomes for post-call operators",
            feedback:
              "Iverson's study found no significant difference in death or bleeding in one centre, but that does not show fatigue is harmless; in one survey of cardiovascular staff (7.2% response), 58% of respondents linked sleep deprivation with difficulty concentrating, and Brilakis lists fatigue among the factors that change outcome. Keeping it from the team removes their chance to help.",
            next: "c1-fatigue",
            stateDelta: { stability: -10, flags: ["fatigue-hidden", "post-call-case"] },
          },
          {
            text: "Do the simple cases yourself and ask for the complex RCA case to be moved to a day when you are rested",
            acceptable: true,
            feedback:
              "Defensible: Brilakis counts operator fatigue among the reasons to delay a procedure, and 85% of respondents in one survey favoured policies letting post-call staff go home early. But the patient has prepared for today and must come back; asking a colleague to share or take the case keeps it on the list without the risk. The case is rebooked for the following week.",
            stateDelta: { stability: 0, flags: ["case-rebooked"] },
          },
        ],
      },
      {
        id: "c1-fatigue",
        kind: "consequence",
        prompt: "Halfway through setting up, you misread the patient's creatinine and have to be corrected by the nurse. What now?",
        info: "The nurse points out that the eGFR is 58, not 85 as you had said aloud when calculating the contrast limit.",
        options: [
          {
            text: "Thank her, tell the team you were up most of the night, recalculate the contrast limit together and ask your senior colleague to scrub with you",
            best: true,
            feedback:
              "Good recovery. The slip is the kind of error sleep-deprived workers describe; declaring it now and adding a second operator restores the safety margin.",
            stateDelta: { stability: 5, flags: ["fatigue-declared"] },
          },
          {
            text: "Correct the number and carry on without mentioning the night",
            feedback:
              "The team has just seen a warning sign and still does not know why. You keep the risk and lose the help.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2-plan",
        prompt: "You are about to start the RCA case. What do you say at the time out?",
        variants: [
          { flag: "fatigue-declared", info: "Your senior colleague has scrubbed with you." },
          { flag: "case-rebooked", info: "It is the following week. You slept normally, and your senior colleague is free in the next lab if needed." },
        ],
        options: [
          {
            text: "Name the step most likely to go wrong (device delivery through calcium and tortuosity), the first three actions if a dissection occurs, the stopping rules for contrast and dose, and who does what in a complication",
            best: true,
            feedback:
              "This is negative visualisation done the manual's way: Brilakis's 'what can go wrong' asked before the case with a plan for each answer, and Oxford's brief, which agrees each person's role in a complication.",
            stateDelta: { stability: 5, flags: ["rehearsed"] },
          },
          {
            text: "Skip the rehearsal to save time; you have done many RCA cases",
            feedback:
              "Experience does not replace a shared plan; when the complication comes, a team in which each person has a different plan is slower than one with a plan agreed in advance.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Agree only the contrast limit, since kidney injury is the main risk in this patient",
            acceptable: true,
            feedback:
              "The contrast limit matters with an eGFR of 58 (Brilakis gives about 3.7 times the GFR, lower in chronic kidney disease, allowing for any recent contrast), but the biggest procedural risk here is delivering a device through calcium and tortuosity, and that deserves its own plan.",
            stateDelta: { stability: 0 },
          },
        ],
      },
      {
        id: "s3-closure",
        prompt: "After balloon predilatation, a spiral dissection appears and antegrade flow falls to TIMI 1. The patient has chest pain. People start talking at once. What do you do?",
        info: "The wire is in the true lumen distally. Blood pressure 105/60 mmHg, heart rate 90 bpm. The radiographer is asking whether to change the angle; a phone is ringing.",
        variants: [{ flag: "rehearsed", info: "The team falls into the roles agreed at the time out: the nurse prepares the next stent sizes and the physiologist calls out the pressures." }],
        options: [
          {
            text: "Say aloud 'flow-limiting dissection, wire is in', hold the wire still, ask for quiet, and stent over the true-lumen wire while someone watches the guide",
            best: true,
            feedback:
              "Right. Brilakis's first step in acute closure is to stay calm and keep the true-lumen wire, watching the guide because its movement can pull the wire out; a sterile-cockpit rule cuts the noise during the critical minutes, and a dissection is treated by stenting.",
            stateDelta: { stability: 10, flags: ["wire-kept"] },
          },
          {
            text: "Pull the wire back and re-wire, so you can be sure you are not in the false lumen",
            feedback:
              "The wire was in the true lumen; giving up that position in a dissection is what Brilakis warns can be catastrophic, because re-wiring may find the false lumen.",
            next: "c2-lost-wire",
            stateDelta: { stability: -25, flags: ["wire-lost"] },
          },
          {
            text: "Give repeated forceful contrast injections in several views to define the dissection fully before deciding",
            feedback:
              "Brilakis advises avoiding contrast injections in a dissection, and if one is essential, giving it non-selectively with the guide disengaged so the dissection is not propagated. With the wire in the true lumen, the next step is stenting, not more pictures.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c2-lost-wire",
        kind: "consequence",
        prompt: "The re-advanced wire goes into a false lumen. Flow is now TIMI 0, the patient is hypotensive at 80/50 mmHg and has ST elevation. What now?",
        options: [
          {
            text: "Hand the lead to your senior colleague (calling him in from the next lab if he is not scrubbed), ask for vasopressor support and the bail-out equipment, and quiet the room",
            best: true,
            feedback:
              "Calling for help early, handing over the lead and supporting the circulation are the right moves when a bail-out has become harder than your experience; the dissection algorithm itself is taught in cm-principles-closure.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pushing the wire yourself; handing over now would look like failure",
            feedback:
              "Pride is not a reason to keep the lead. The case has moved beyond the original plan, and an experienced colleague is at the table or next door.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4-record",
        prompt: "The vessel is stented with TIMI 3 flow. The patient's pain settles and his ECG returns to baseline. It is time to write the report. What goes in it?",
        variants: [{ flag: "wire-lost", info: "The recovery took 40 minutes longer, with a period of hypotension and ST elevation." }],
        options: [
          {
            text: "The full account: the dissection, when it happened, flow, symptoms, what was done and the result, the equipment, dose and contrast, and the plan, checked against the physiologist's timed log",
            best: true,
            feedback:
              "Oxford's report includes any complication and its management, and the physiologist's recording gives the timings. A report that matches the tracings, the images and the nursing notes is the accurate record the patient's later care depends on.",
            stateDelta: { stability: 5, flags: ["full-record"] },
          },
          {
            text: "'Successful PCI to RCA, 2 stents, good result': the dissection was fixed, so it need not be mentioned",
            feedback:
              "An omitted complication is an inaccurate record, and the tracings, images and nursing notes will contradict it. The patient also needs the true account for his follow-up.",
            next: "c3-record",
            stateDelta: { stability: -10, flags: ["record-incomplete"] },
          },
        ],
      },
      {
        id: "c3-record",
        kind: "consequence",
        prompt: "Later that day, the ward registrar calls: the patient has a raised troponin and asks what happened. The nurse's notes describe a dissection that your report does not mention. What do you do?",
        options: [
          {
            text: "Add a clearly dated addendum describing the dissection and its management, see the patient to explain, and complete the incident report",
            best: true,
            feedback:
              "Correcting the record openly, making clear when the addition was made, and then telling the patient is the honest course; the professional duty of candour depends on accurate information.",
            stateDelta: { stability: 5, flags: ["full-record"] },
          },
          {
            text: "Tell the registrar it was a minor technical issue and leave the report as it is",
            feedback:
              "This compounds the problem: an inaccurate record and a patient who is not told. Both duties of candour, professional and organisational, depend on honest information.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5-patient",
        prompt: "The patient is awake and comfortable on the ward. When and how do you tell him about the dissection?",
        options: [
          {
            text: "Now that he can take it in: explain what happened, what was done, what it means for him, apologise personally, record the apology and report the incident",
            best: true,
            feedback:
              "The candour guidance asks you to tell, apologise, offer support and explain the short- and long-term effects, without waiting for an investigation; to record the apology; and to report early. An apology is not of itself an admission of liability.",
            stateDelta: { stability: 5, flags: ["disclosed"] },
          },
          {
            text: "Wait for next week's M&M to establish whether anyone was at fault, then tell him",
            feedback:
              "The guidance asks you to speak to the patient as soon as possible and says you do not have to wait for the outcome of an investigation; say what is known and be clear about what is not yet established.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Mention that 'the artery needed an extra stent' without using the word dissection",
            feedback:
              "True as far as it goes, but incomplete: he needs to know a complication occurred, what it means and that you are sorry, in words he understands. The guidance asks you to share all you know and believe to be true about what went wrong and why, so a euphemism falls short of the professional duty.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6-aftermath",
        prompt: "That night you cannot sleep. You keep replaying the moment the dissection appeared. What do you do?",
        options: [
          {
            text: "Talk it through with your senior colleague or a mentor the next day, and find out what confidential support your hospital offers",
            best: true,
            feedback:
              "Replay loops are a recognised barrier to recovery, and peer conversation and structured debriefing are among the strategies proposed to overcome them. Knowing the support available matters: in the international survey only 37% of operators had access to mental health support through their employer. This is the 'second victim' experience, and the clinician needs help too.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep it to yourself: a good operator switches the feelings off and moves on",
            feedback:
              "That is pseudo-stoicism, not Stoicism: in patients with cancer, suppression has been linked to delayed help-seeking, and compartmentalisation is one of the barriers to recovery after a bad outcome.",
            next: "c4-silence",
            stateDelta: { stability: -10, flags: ["suppressed"] },
          },
        ],
      },
      {
        id: "c4-silence",
        kind: "consequence",
        prompt: "Two weeks later you notice you are avoiding calcified RCA cases and sleeping badly before lists. What now?",
        options: [
          {
            text: "Tell your mentor what has happened, use the occupational health or psychological support service, and take the case to a structured review",
            best: true,
            feedback:
              "Late is better than never. Naming the effect and getting support stops it shaping your practice.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Quietly refer all calcified cases to colleagues from now on",
            feedback:
              "Avoidance leaves the problem in place and narrows your practice; it also hides from your colleagues a change they could help with.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s7-mm",
        prompt: "You are presenting the case at M&M. How do you structure it?",
        options: [
          {
            text: "Timeline from the records; decision points judged on what was known then; causes, prevention and treatment of the dissection; system factors (fatigue, scheduling, staffing, equipment, distraction); one or two actions with owners",
            best: true,
            feedback:
              "That is the structured review: the manual's causes-prevention-treatment frame, a separation of decision from outcome, and a system view (fatigue, scheduling, staffing, equipment, distraction), ending in actions that someone owns.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Present it as your error alone, apologise to the meeting and move on",
            feedback:
              "Honest, but it misses the system factors (for example scheduling, staffing or equipment) that the department can change, and gives the room nothing to act on.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Show only the final result, since the patient recovered fully",
            feedback:
              "Outcome bias: a good recovery does not tell you whether the decisions were sound, and the learning is lost.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s8-audit",
        prompt: "After the meeting, the clinical director proposes ranking all operators by their crude dissection rate this quarter. You had 2 in 40 PCIs; a colleague who does mostly elective simple cases had 0 in 35. What do you suggest?",
        options: [
          {
            text: "Agree standard definitions, include every attempt, adjust for case mix and plot each operator against control limits on a funnel plot, auditing process measures more often",
            best: true,
            feedback:
              "Funnel plots avoid spurious league tables; with numbers this small, crude rates mostly reflect chance and case mix, and ranking can push operators away from high-risk patients, as was seen with public outcome reporting in one US study.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept the ranking, since transparency is always good and crude numbers are easy to understand",
            feedback:
              "Transparency is good; a crude ranking of 2 events in 40 against 0 in 35 is not information, and it rewards avoiding complex cases.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The patient was discharged the next day with TIMI 3 flow and a clear explanation of what had happened. The department adopted a funnel plot with standard definitions for its quarterly audit.",
    outcomeVariants: [
      { flag: "post-call-case", text: "Because the complex case had gone ahead straight after a night on call, the M&M agreed to stop scheduling complex elective cases first for operators coming off a night on call." },
      { flag: "case-rebooked", text: "Because the case had been rebooked, the dissection happened with a rested operator, so fatigue was not a factor at the M&M; the review looked at the other system factors and noted that the patient had needed an extra visit to the hospital." },
      { flag: "wire-lost", text: "Losing the true-lumen wire turned a straightforward bail-out into a prolonged recovery with a period of hypotension and ST elevation; the patient had a larger troponin rise and stayed an extra day." },
      { flag: "record-incomplete", text: "The incomplete report had to be corrected by a dated addendum after the ward team found the dissection in the nursing notes; the incident review noted the discrepancy." },
      { flag: "suppressed", text: "Keeping the reaction to yourself led to weeks of avoidance and poor sleep before you sought support." },
    ],
    learningPoints: [
      "Declare your own state at the brief; Brilakis counts operator condition in the benefit-risk balance, and the team can only help with what it knows.",
      "Rehearse what could go wrong and agree roles before the case; it is negative visualisation done the manual's way.",
      "In acute closure: say it aloud, keep the true-lumen wire, quiet the room, treat the cause.",
      "The report must include the complication and match the timed record; correct an omission openly with a dated addendum.",
      "Tell the patient promptly, apologise, record the apology and report the incident; do not wait for the investigation.",
      "Talk through a bad outcome with a peer or mentor; suppression is pseudo-stoicism, not resilience.",
      "Present M&M with a timeline, decision points, causes-prevention-treatment, system factors and owned actions.",
      "Audit with full denominators, standard definitions, case-mix adjustment and funnel plots, not crude league tables.",
    ],
    refs: [...BOOKS, "gmc-nmc-candour-2015", "iverson-sleep-pci-outcomes-2018", "lobo-sleep-survey-2019", "simsek-wellbeing-survey-2023", "spiegelhalter-funnel-plots-2005", "touma-operator-grief-2025", "joynt-public-reporting-2012", "wu-second-victim-2000", "harerimana-stoic-attitudes-2025"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-safe-capture-the-facts",
    lab: "pci",
    when: { phase: ["finish"], event: ["dissection", "perforation", "no-reflow", "acute-closure", "equipment-entrapment", "stent-loss"] },
    alsoIn: [{ lab: "diagnostic", phase: ["finish"] }],
    title: "Write the timeline while it is fresh",
    text: "Before you leave the lab, note the sequence of events and what you knew at each decision point, using the physiologist's timed log. Then frame the complication as Brilakis frames every complication in his manual: what caused it, what would have prevented it, and whether the treatment was the best available.",
    tone: "do",
    lessonId: "hb-safe-practice-reflection",
    sources: [O("ch 2: The cardiac physiologist"), B("25.1"), B("25.2")],
    refs: BOOKS,
  },
  {
    id: "pci-safe-count-every-attempt",
    lab: "pci",
    when: { phase: ["finish"], event: ["wire-not-crossing", "balloon-uncrossable", "stent-uncrossable"] },
    alsoIn: [{ lab: "diagnostic", phase: ["finish"] }],
    title: "Log every attempt, including the ones that failed",
    text: "The national registry counts any case in which a coronary device approached, probed or crossed a lesion with the intention of intervening. Log failed and abandoned attempts too, with the same definitions as the registry, or your personal success rate will be falsely high.",
    tone: "do",
    lessonId: "hb-safe-practice-audit",
    sources: [O("ch 2: The cardiologist")],
    refs: [...OXFORD, "ludman-bcis-registry-2011"],
  },
  {
    id: "pci-safe-scribe-the-timeline",
    lab: "pci",
    when: { phase: ["complication"] },
    title: "Ask someone to log the times",
    text: "As soon as a complication starts, ask a named team member (ideally a second circulating nurse, as Oxford suggests) to record the times of events, drugs and devices and who is present. Notes written at the time are worth far more than an account reconstructed hours later.",
    tone: "do",
    lessonId: "hb-safe-practice-medicolegal",
    sources: [O("ch 2: The nurse"), O("ch 10: Death")],
    refs: OXFORD,
  },
  {
    id: "pci-safe-dose-incident-check",
    lab: "pci",
    when: { phase: ["finish"], event: ["high-radiation-dose"] },
    title: "High dose: record it, explain it, and escalate if unexpected",
    text: "Record the dose in the report and explain it to the patient. If the dose was greater than expected, contact the local radiation protection adviser (Oxford); under IR(ME)R the medical physics expert analyses unintended exposures, and one significantly greater than proportionate must be investigated at once and notified. Oxford counts an overexposure as usually at least ten times the intended dose.",
    tone: "caution",
    lessonId: "hb-safe-practice-medicolegal",
    sources: [O("ch 1: Dose excess"), O("ch 1: Radiation safety")],
    refs: [...OXFORD, "irmer-2017"],
  },
  {
    id: "pci-safe-state-check",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Say how you are, as well as how the patient is",
    text: "Brilakis counts the operator's and staff's condition, rested or sleep deprived, among the factors that affect outcome. If you operated through the night, say so at the brief and plan for it: a second operator for the hardest case, or staging rather than finishing everything today.",
    tone: "caution",
    lessonId: "hb-safe-practice-wellbeing",
    sources: [B("7.1"), B("2.9"), B("7.3")],
    refs: [...BRILAKIS, "lobo-sleep-survey-2019"],
  },
  {
    id: "diag-safe-ergonomic-setup",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Set up for your back as well as your images",
    text: "Raise the table as high as stays comfortable for you, with the detector close to the patient. If you have back problems, a two-piece apron may suit you better than a one-piece, and a ceiling-suspended lead system, where available, removes the weight altogether.",
    tone: "do",
    lessonId: "hb-safe-practice-wellbeing",
    sources: [B("6.4"), B("28.2"), O("ch 1: Radiation safety")],
    refs: [...BOOKS, "klein-occupational-hazards-2015"],
  },
  {
    id: "pci-safe-pause-after-major-event",
    lab: "pci",
    when: { phase: ["finish"], event: ["perforation", "acute-closure", "vf"] },
    alsoIn: [{ lab: "diagnostic", phase: ["finish"] }],
    title: "After a major event, pause before the next case",
    text: "Debrief the team and give people time to talk before the next patient comes in. Oxford asks the cardiologist in charge, after a death in the lab, to make that time and to postpone or cancel further procedures if needed.",
    tone: "caution",
    lessonId: "hb-safe-practice-wellbeing",
    sources: [O("ch 10: Death")],
    refs: [...OXFORD, "touma-operator-grief-2025"],
  },
  {
    id: "pci-safe-name-what-could-go-wrong",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Rehearse the bad minute before you start",
    text: "Pick the step of this case most likely to go wrong and say aloud the first three things you would do if it did, and who does what. It is Brilakis's 'what can go wrong' question asked in advance, and it means a plan is waiting when stress arrives.",
    tone: "do",
    lessonId: "hb-safe-practice-mindset",
    sources: [B("1.1"), O("ch 2: The cardiologist")],
    refs: [...BOOKS, "brown-stoic-training-2022"],
  },
  {
    id: "pci-safe-control-the-controllable",
    lab: "pci",
    when: { phase: ["complication"], event: ["acute-closure", "dissection", "perforation", "no-reflow"] },
    title: "Secure what you have, then act on what you control",
    text: "Say the problem aloud and keep the true-lumen wire where it is; Brilakis warns that operator stress in a crisis can lead to the wire being pulled. Then put your attention on the next action you control, the help you call and the information you need, not on the outcome.",
    tone: "bailout",
    lessonId: "hb-safe-practice-mindset",
    sources: [B("25.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-safe-cto-stop-rules",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "CTO: write the stopping rules before you start",
    text: "Brilakis's reasons to stop a CTO attempt: a complication, more than about 5 Gy air kerma without crossing or substantial progress, contrast above 3.7 times the creatinine clearance, crossing options exhausted, or patient or physician fatigue. Agree them now, while you are fresh and not yet invested.",
    tone: "caution",
    lessonId: "hb-safe-practice-mindset",
    sources: [B("21.8")],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// New references (PubMed-checked)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "orlander-mm-conference-2002",
    kind: "paper",
    citation: "Orlander JD, Barber TW, Fincke BG. The morbidity and mortality conference: the delicate nature of learning from error. Acad Med. 2002;77(10):1001–1006.",
    url: "https://doi.org/10.1097/00001888-200210000-00011",
    note: "PMID: 12377674. Checked on PubMed: authors, title, journal, year, volume 77, issue 10, pages 1001–1006; abstract read. Used for: the M&M conference as a double-edged sword; if successful it models learning from error, if unsuccessful it conveys that learning from error is unproductive or unpleasant; particular attention should be given to how it is conducted.",
    verified: true,
  },
  {
    id: "mann-reflection-review-2009",
    kind: "paper",
    citation: "Mann K, Gordon J, MacLeod A. Reflection and reflective practice in health professions education: a systematic review. Adv Health Sci Educ Theory Pract. 2009;14(4):595–621.",
    url: "https://doi.org/10.1007/s10459-007-9090-2",
    note: "PMID: 18034364. Checked on PubMed: authors, title, journal, year, volume 14, issue 4, pages 595–621 (published online 2007); abstract read. Used for: reflective capacity regarded by many as essential for professional competence; the evidence supporting reflection curricula remains largely theoretical.",
    verified: true,
  },
  {
    id: "touma-operator-grief-2025",
    kind: "paper",
    citation: "Touma G, Fairley S, Lombardi W, Ada C, Wong B, Khialani B. When a patient dies during a procedure: navigating operator grief in interventional cardiology. Catheter Cardiovasc Interv. 2025;106(7):3642–3648.",
    url: "https://doi.org/10.1002/ccd.70254",
    note: "PMID: 41077766. Checked on PubMed: authors, title, journal, year, volume 106, issue 7, pages 3642–3648; abstract read (review). Used for: intra-procedural death triggers grief, self-doubt and psychological trauma; intersects with moral injury, burnout and professional identity; barriers to recovery include outcome bias, replay loops and compartmentalisation; systemic silence and lack of institutional support prolong distress; strategies: reflective practice, reconnecting with patient families, peer dialogue, structured debriefing, culturally attuned support; vulnerability redefined as professionalism and psychological safety in the organisation.",
    verified: true,
  },
  {
    id: "wu-second-victim-2000",
    kind: "paper",
    citation: "Wu AW. Medical error: the second victim. The doctor who makes the mistake needs help too. BMJ. 2000;320(7237):726–727.",
    url: "https://doi.org/10.1136/bmj.320.7237.726",
    note: "PMID: 10720336 (PMC1117748). Checked on PubMed: author, title, journal, year, volume 320, issue 7237, pages 726–727; editorial, no abstract. Used only for its title: the clinician who makes an error as a 'second victim' who needs help too.",
    verified: true,
  },
  {
    id: "donabedian-quality-1988",
    kind: "paper",
    citation: "Donabedian A. The quality of care. How can it be assessed? JAMA. 1988;260(12):1743–1748.",
    url: "https://doi.org/10.1001/jama.260.12.1743",
    note: "PMID: 3045356. Checked on PubMed: author, title, journal, year, volume 260, issue 12, pages 1743–1748; abstract read. Used for: assessment of quality requires information about the causal linkages among the structural attributes of the settings of care, the processes of care and the outcomes of care.",
    verified: true,
  },
  {
    id: "ludman-bcis-registry-2011",
    kind: "paper",
    citation: "Ludman PF; British Cardiovascular Intervention Society. British Cardiovascular Intervention Society Registry for audit and quality assessment of percutaneous coronary interventions in the United Kingdom. Heart. 2011;97(16):1293–1297.",
    url: "https://doi.org/10.1136/heartjnl-2011-300299",
    note: "PMID: 21719554. Checked on PubMed: author, title, journal, year, volume 97, issue 16, pages 1293–1297; abstract read. Used for: aim of an inclusive registry of all UK PCI for audit, quality improvement and research; all UK PCI hospitals; 1994 to present; about 80,000 new procedures a year; PCI defined as any attempt in which a coronary device is used to approach, probe or cross one or more lesions with the intention of intervening; 113 variables, outcomes to hospital discharge; live online analysis and monthly and quarterly reports including process measures and risk-adjusted outcome; annual national reports; local validation, range and consistency checks, no external validation; feedback of completeness.",
    verified: true,
  },
  {
    id: "spiegelhalter-funnel-plots-2005",
    kind: "paper",
    citation: "Spiegelhalter DJ. Funnel plots for comparing institutional performance. Stat Med. 2005;24(8):1185–1202.",
    url: "https://doi.org/10.1002/sim.1970",
    note: "PMID: 15568194. Checked on PubMed: author, title, journal, year, volume 24, issue 8, pages 1185–1202; abstract read. Used for: an estimate plotted against a measure of its precision; control limits form a funnel around the target, analogous to Shewhart control charts; deals with over-dispersion from unmeasured risk factors; avoids spurious ranking of institutions into league tables.",
    verified: true,
  },
  {
    id: "joynt-public-reporting-2012",
    kind: "paper",
    citation: "Joynt KE, Blumenthal DM, Orav EJ, Resnic FS, Jha AK. Association of public reporting for percutaneous coronary intervention with utilization and outcomes among Medicare beneficiaries with acute myocardial infarction. JAMA. 2012;308(14):1460–1468.",
    url: "https://doi.org/10.1001/jama.2012.12922",
    note: "PMID: 23047360 (PMC3698951). Checked on PubMed: authors, title, journal, year, volume 308, issue 14, pages 1460–1468; abstract read. Used for: Medicare patients with acute MI 2002–2010, three reporting states (New York, Massachusetts, Pennsylvania) vs seven regional non-reporting states; in 2010 PCI less likely in reporting states (37.7% vs 42.7%; adjusted OR 0.82), largest differences in STEMI (61.8% vs 68.0%) and cardiogenic shock or cardiac arrest (41.5% vs 46.7%); no difference in overall acute MI mortality.",
    verified: true,
  },
  {
    id: "schiele-acvc-qi-2021",
    kind: "paper",
    citation: "Schiele F, Gale CP, Simon T, et al. The 2020 ESC-ACVC quality indicators for the management of acute myocardial infarction applied to the FAST-MI registries. Eur Heart J Acute Cardiovasc Care. 2021;10(2):207–215.",
    url: "https://doi.org/10.1093/ehjacc/zuab010",
    note: "PMID: 33675658. Checked on PubMed: authors, title, journal, year, volume 10, issue 2, pages 207–215; abstract read. Used for: 2020 ESC-ACVC quality indicators measured in 12,660 of 13,130 patients from three French national registries; most measurable from existing registries but not the patient-satisfaction domain; both composite indicators associated with adjusted 1-year mortality; centre benchmarking against the national mean feasible.",
    verified: true,
  },
  {
    id: "simsek-wellbeing-survey-2023",
    kind: "paper",
    citation: "Simsek B, Rempakos A, Kostantinis S, et al. International psychological well-being survey of interventional cardiologists. JACC Cardiovasc Interv. 2023;16(11):1401–1407.",
    url: "https://doi.org/10.1016/j.jcin.2023.03.033",
    note: "PMID: 37316149 (PMC10712288). Checked on PubMed: authors, title, journal, year, volume 16, issue 11, pages 1401–1407; no abstract, PMC full text read. Used for: January 2023 online survey; 1,159 attendings and 192 fellows; attendings 91% men, mean 63 ± 14 clinical hours a week (fellows 67 ± 14); 84% lonely; 41% considered leaving in the past year, 32% now; 78% working too hard, 64% emotionally exhausted, 58% frustrated; 28% unhappy (single 54% vs with partner 25%); 69% burnout affected life; call ≥3 times a week 74% vs 66%; contributors: excessive documentation, lack of administrative support, bureaucratic tasks, insufficient income (fellows' top contributor); leading coping: talking with family and friends; 67% had someone to share concerns with; 37% had employer mental health access; 76% not under or seeking professional care; main proposed solutions better administrative support (86%) and removal of rules/regulations that do not contribute to patient care (84%); fellows 48% lonely, 29% considered leaving in the past year, 15% now; stigma associated with mental disorders and fear of professional consequences suggested as possible reasons physicians avoid mental health care; employers could provide anonymised access to mental health professionals; limitations include selection and recall bias.",
    verified: true,
  },
  {
    id: "lobo-sleep-survey-2019",
    kind: "paper",
    citation: "Lobo AS, Sandoval Y, Burke MN, et al. Sleep deprivation in cardiology: a multidisciplinary survey. J Invasive Cardiol. 2019;31(6):195–198.",
    url: "https://doi.org/10.25270/jic/19.00001",
    note: "PMID: 30982778. Checked on PubMed: authors, title, journal, year, volume 31, issue 6, pages 195–198; abstract read. Brilakis ch 7 ref 15. Used for: survey sent to 6,683, completed by 481 (7.2%); 80% men, 70% interventional cardiologists; 91% call duties, 43% ≥7 call nights a month; sleep disorders 25%; sleep-inducing medication 25%; sleep deprivation associated with difficulty concentrating 58%, lack of motivation 56%, irritability 68%; work performance hindered 46%; 8.6% reported an adverse event likely related to sleep deprivation; 56.5% felt burnout; 85% favoured policies allowing sleep-deprived staff to go home early post call.",
    verified: true,
  },
  {
    id: "sandoval-sleep-deprivation-2018",
    kind: "paper",
    citation: "Sandoval Y, Lobo AS, Somers VK, et al. Sleep deprivation in interventional cardiology: implications for patient care and physician-health. Catheter Cardiovasc Interv. 2018;91(5):905–910.",
    url: "https://doi.org/10.1002/ccd.27185",
    note: "PMID: 28707310. Checked on PubMed: authors, title, journal, year, volume 91, issue 5, pages 905–910 (published online 2017); abstract read (review). Brilakis ch 7 ref 16. Used for: sleep deprivation associated with impaired performance, cognitive deficits, reduced psychomotor vigilance, workplace errors and injuries; paucity of outcome data in interventional cardiology.",
    verified: true,
  },
  {
    id: "iverson-sleep-pci-outcomes-2018",
    kind: "paper",
    citation: "Iverson A, Stanberry L, Garberich R, et al. Impact of sleep deprivation on the outcomes of percutaneous coronary intervention. Catheter Cardiovasc Interv. 2018;92(6):1118–1125.",
    url: "https://doi.org/10.1002/ccd.27471",
    note: "PMID: 29314592. Checked on PubMed: authors, title, journal, year, volume 92, issue 6, pages 1118–1125; abstract read. Brilakis ch 7 ref 17. Used for: sleep deprived defined as a daytime procedure (7 am–11:59 pm) preceded by a night procedure (12 am–6:59 am) on the same date; 12,680 daytime PCIs 2009–2016, 367 (2.9%) by sleep-deprived operators; in-hospital death 1.1% vs 1.3% and 72-hour bleeding 3.9% vs 2.9%, not significant; single centre.",
    verified: true,
  },
  {
    id: "klein-occupational-hazards-2015",
    kind: "paper",
    citation: "Klein LW, Tra Y, Garratt KN, et al. Occupational health hazards of interventional cardiologists in the current decade: results of the 2014 SCAI membership survey. Catheter Cardiovasc Interv. 2015;86(5):913–924.",
    url: "https://doi.org/10.1002/ccd.25927",
    note: "PMID: 25810341. Checked on PubMed: authors, title, journal, year, volume 86, issue 5, pages 913–924; abstract read. Used for: 314 responses; 6.9% limited caseload because of radiation exposure; 9.3% health-related absence; 49.4% at least one orthopaedic injury (cervical 24.7%, lumbar 34.4%, hip, knee or ankle 19.6%); age most strongly correlated; caseload associated; radiation-associated problems (cataracts, cancers) asked about, with 'a small but substantial incidence of cancer' (no figure or comparison given); consistent with a 2004 survey, persisting despite increased awareness.",
    verified: true,
  },
  {
    id: "brown-stoic-training-2022",
    kind: "paper",
    citation: "Brown MEL, MacLellan A, Laughey W, et al. Can stoic training develop medical student empathy and resilience? A mixed-methods study. BMC Med Educ. 2022;22(1):340.",
    url: "https://doi.org/10.1186/s12909-022-03391-x",
    note: "PMID: 35505329 (PMC9064267). Checked on PubMed: authors, title, journal, year, volume 22, article 340; PMC full text read. Used for: Stoicism an ancient Greek and Roman philosophy, misrepresented in medicine as a 'stiff upper lip' of detachment and suppression; offers a way to process negative feelings while keeping connection; advocates accepting what cannot be controlled; emotional control means keeping emotions appropriate, not suppressing them; Stoic ideals underpin CBT; three practices (negative visualisation, Stoic mindfulness, Stoic reflection); 24 third-year students, 12-day online programme; Stoic ideation, resilience and empathy scores rose; no correlation between Stoic ideation change and resilience or empathy change; small, uncontrolled, self-selected; qualitatively, negative visualisation aided emotional and practical preparedness and contingency planning and reduced catastrophising.",
    verified: true,
  },
  {
    id: "harerimana-stoic-attitudes-2025",
    kind: "paper",
    citation: "Harerimana A, Pillay JD, Mchunu G. The pitfalls of \"toughing it out\": mapping stoic attitudes in cancer patients. A scoping review. Med Health Care Philos. 2025;28(4):775–790.",
    url: "https://doi.org/10.1007/s11019-025-10293-4",
    note: "PMID: 40828270 (PMC12583391). Checked on PubMed: authors, title, journal, year, volume 28, issue 4, pages 775–790; abstract read. Used for: Stoicism as a philosophy promotes resilience, self-control and rational acceptance of adversity; stoic attitudes or pseudo-stoicism (emotional suppression, silent endurance) linked in cancer patients to reduced social support, delayed help-seeking and poorer psychological outcomes; stoic traits sometimes associated with persistence and treatment adherence.",
    verified: true,
  },
  {
    id: "notification-of-deaths-2019",
    kind: "web",
    citation: "The Notification of Deaths Regulations 2019. SI 2019/1112.",
    url: "https://www.legislation.gov.uk/uksi/2019/1112/made",
    note: "Checked on legislation.gov.uk (made version, made 10 July 2019). Used for: reg 1, in force 1 October 2019; reg 2, a registered medical practitioner must notify the relevant senior coroner when a reg 3(1) circumstance applies; reg 3(1), circumstances include a death the practitioner suspects was due to the person undergoing a treatment or procedure of a medical or similar nature, and (for an attending practitioner) a death whose cause is unknown despite reasonable steps; reg 4, notification as soon as reasonably practicable, in writing (orally only in exceptional circumstances, then confirmed in writing). England and Wales.",
    verified: true,
  },
  {
    id: "coroners-justice-act-2009",
    kind: "web",
    citation: "Coroners and Justice Act 2009, c. 25, section 14 (post-mortem examinations).",
    url: "https://www.legislation.gov.uk/ukpga/2009/25/section/14",
    note: "Checked on legislation.gov.uk. Used for: s14(1), a senior coroner may request a suitable practitioner to make a post-mortem examination when the coroner is investigating the death or needs the examination to decide whether there is a duty to investigate. Extent England and Wales.",
    verified: true,
  },
  {
    id: "wales-candour-act-2020",
    kind: "web",
    citation: "Health and Social Care (Quality and Engagement) (Wales) Act 2020, asc 1, Part 3 (duty of candour).",
    url: "https://www.legislation.gov.uk/asc/2020/1/contents",
    note: "Title, year and Part 3 (duty of candour, sections 3–11) checked on legislation.gov.uk. In force date (1 April 2023) and the duty falling on providers of NHS services (NHS bodies and primary care) taken from the GMC/NMC candour guidance, Appendix 2 (gmc-nmc-candour-2015), which misprints the Act's year as 2000.",
    verified: true,
  },
  {
    id: "nhse-nrls-lfpse-transition-2026",
    kind: "web",
    citation: "NHS England. NRLS to LFPSE Transition Report (January 2021 to December 2024). Patient safety data, statistical work areas, 2024-25.",
    url: "https://www.england.nhs.uk/statistics/statistical-work-areas/patient-safety-data/2024-25/nrls-to-lfpse-transition-report/",
    note: "Checked on england.nhs.uk (October 2026; data extracted 28 January 2026). Used for: the Learn from Patient Safety Events (LFPSE) service has fully replaced the National Reporting and Learning System (NRLS), which was decommissioned on 30 June 2024 because of its ageing infrastructure; the report presents England-only trends (NRLS took Welsh submissions until April 2022).",
    verified: true,
  },
  {
    id: "nhs-wales-incident-policy-2023",
    kind: "web",
    citation: "NHS Wales Executive. National Policy on Patient Safety Incident Reporting and Management. Issued with Welsh Health Circular WHC/2023/017, 12 May 2023.",
    url: "https://www.gov.wales/sites/default/files/publications/2023-05/policy-on-patient-safety-incident-reporting-and-management.pdf",
    note: "Covering circular read on gov.wales (WHC/2023/017, 12 May 2023: new national policy, national thematic analysis using the Once for Wales Concerns Management System). Policy text read in the copy adopted by Velindre University NHS Trust (velindre.nhs.wales, policy QS01). Used for: section 11.4, all patient safety incidents should be reported through Datix Cymru (part of the Once for Wales Concerns Management System); definitions, the Once for Wales Concerns Management System is the national IT system and, for incident reporting and management, is also known as Datix Cymru.",
    verified: true,
  },
];
