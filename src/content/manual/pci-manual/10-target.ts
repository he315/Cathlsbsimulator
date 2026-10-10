// Module pm-target: choosing what to treat, and when (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.1, 1.7, 1.12, 3.5.1.2.3, 7.1-7.4, 12.1.1, 12.3.4, 13.1.1, 17.1, 17.6-17.7,
// 17.10, 18.7, 20.1, 20.4-20.8, 20.12, 21.1 and 24.2.7, 24.2.12; Oxford Handbook of Cardiac Catheterization and
// Coronary Intervention, chapter 1 (indications for cardiac catheterization and coronary angiography), chapter 2 (the
// cardiologist) and chapter 8 (indications for PCI, pressure wire, IVUS or OCT, PCI in acute MI, primary PCI, primary
// PCI in cardiogenic shock and in multivessel disease, multivessel PCI, left main stem PCI).
// Every claim is listed with its page in docs/curriculum/evidence/pm-target.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-target",
  title: "Choosing what to treat, and when",
  stage: 3,
  summary:
    "The decisions that sit between the diagnostic run and the first guidewire: whether the patient should be in the lab at all, whether revascularisation can help, whether it should be PCI or surgery, whether to proceed now or come back, which lesion to treat first, how to find the culprit in an acute coronary syndrome, how soon a patient with NSTE-ACS needs the lab, and what to do about the other arteries after a STEMI.",
  objectives: [
    "Triage a referral for catheterisation or angiography using the handbook's indications, its relative contraindications and the questions Brilakis asks before every case.",
    "Work through Brilakis's stable-disease algorithm (symptoms, extent, previous CABG, diabetes, surgical risk, complexity, benefit against risk, patient preference) and say what revascularisation can and cannot achieve in chronic coronary syndromes.",
    "Score anatomical complexity with the SYNTAX score, apply the SYNTAX thresholds for three-vessel and left main disease, and know when a stable patient must leave the table for the heart team.",
    "Decide between ad hoc and delayed PCI, stage multivessel procedures for the right reasons, and choose the order of lesions within a vessel, across vessels and around the left main.",
    "Identify the culprit in an acute coronary syndrome from the ECG, wall motion and angiographic signs, follow the STEMI engagement sequence, and work up the patient with no obvious culprit.",
    "Time the angiogram in NSTE-ACS and manage multivessel disease after a STEMI: complete revascularisation in stable patients, culprit-only PCI in cardiogenic shock.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-target-indications",
      title: "Who should come to the lab: indications for catheterisation and angiography",
      minutes: 12,
      topics: ["dx-indications"],
      sources: [
        { book: "oxford-cath", loc: "ch 1: Indications for cardiac catheterization" },
        { book: "oxford-cath", loc: "ch 1: Indications for coronary angiography" },
        { book: "oxford-cath", loc: "ch 1: Cardiac CT or invasive angiography?" },
        { book: "brilakis-pci", loc: "1.1" },
        { book: "brilakis-pci", loc: "1.7" },
        { book: "brilakis-pci", loc: "1.12" },
        { book: "brilakis-pci", loc: "7.1" },
      ],
      refs: [...BOOKS, "esc-ccs-2024"],
      blocks: [
        {
          kind: "p",
          text: "Every case starts before the patient reaches the table, with the question of whether an invasive study is the right test at all. The Oxford handbook describes cardiac catheterisation mainly as the way to define how much coronary disease there is and where, adding to what non-invasive imaging has shown, and also as a tool for assessing left ventricular function, valves, the pericardium, congenital lesions and cardiomyopathies. This lesson turns the handbook's lists and Brilakis's planning questions into a triage routine you can run on any referral.",
        },
        {
          kind: "p",
          text: "Keep in mind what an angiogram can and cannot tell you. It outlines the lumen. It shows where narrowings are and how extensive the atheroma is, and it can reveal thrombus, spasm, myocardial bridging and dissection, but it does not see into the vessel wall. The handbook calls it ‘lumenography’ for that reason. When the wall or the physiology matters, imaging and the pressure wire answer what the angiogram cannot.",
        },
        {
          kind: "steps",
          title: "Triage a referral, step by step",
          items: [
            {
              title: "1. Name the presentation",
              detail: "Brilakis's first planning question is how the patient presented: stable angina, an acute coronary syndrome (ACS) or something else, and whether there is chest pain now. The presentation decides urgency and which algorithm you will use after the angiogram (lessons 2 to 7 of this module).",
            },
            {
              title: "2. In stable disease, test the indication",
              detail: "Brilakis asks whether the indication is appropriate and points to the appropriate use criteria for revascularisation in stable ischaemic heart disease. The handbook's class 1 list (table below) gives the classic stable triggers: angina of Canadian Cardiovascular Society class 3 or 4 despite drug treatment, and high-risk features on non-invasive testing. Which non-invasive test should come first is covered in the next section.",
            },
            {
              title: "3. Ask what happens after a stent",
              detail: "Brilakis's planning list asks whether the patient is likely to stop taking medication or to need non-cardiac surgery in the coming 6 to 12 months. Either raises the risk of stent thrombosis, from the operation itself and from stopping dual antiplatelet therapy early, so PCI may be best avoided and medical therapy or CABG preferred. Know this before a stable study, because it changes what you would do with what you find.",
            },
            {
              title: "4. Check the symptoms are real and current",
              detail: "Symptoms can only improve if they are there to begin with. Some patients say they have none because they have quietly cut back what they do; Brilakis suggests asking the family and using an exercise test to find out whether the patient is truly asymptomatic.",
            },
            {
              title: "5. Gather what is already known",
              detail: "Find earlier catheter studies and any other procedure done under fluoroscopy, with images and reports, and the operation note after CABG. Brilakis calls a review of earlier angiograms essential for seeing what has changed since, and notes that earlier non-invasive tests point to the likely culprit. After a recent angiogram or coronary CT angiogram the target lesion may already be known before the patient arrives.",
            },
            {
              title: "6. Plan for physiology if ischaemia is unproven",
              detail: "When symptoms are equivocal and no non-invasive test has shown ischaemia, Brilakis recommends having physiological assessment of the lesions available. Ask whether adenosine or another intracoronary vasodilator has caused a reaction before, or is contraindicated.",
            },
            {
              title: "7. Look for contraindications",
              detail: "The handbook gives one absolute contraindication: the patient does not consent. Everything else is relative and is weighed against the reason for the study (list below).",
            },
          ],
        },
        { kind: "h", text: "Which test first: CT, functional imaging or the catheter?" },
        {
          kind: "list",
          items: [
            "Why invasive angiography held its place: it resolves small structures well in space and fast-moving structures well in time. Modern CT scanners, acquiring up to 320 slices per rotation and covering the whole heart in one short breath-hold, have narrowed that gap.",
            "The handbook's position when it was written: European and American guidelines both put functional non-invasive testing (cardiac MRI, stress echo, SPECT or PET) first for suspected coronary disease and for guiding revascularisation. It added that evidence on CT-derived FFR and perfusion CT was likely to change this.",
            "What CT does well, per the handbook: very high sensitivity and negative predictive value, but a much lower positive predictive value, worse with an older scanner (64 detector rows is the minimum), higher pretest probability, heavy calcium, a fast heart rate and a high body mass index. So CT is mainly a rule-out test.",
            "The handbook's six main CT indications: excluding coronary disease in typical or atypical angina, or non-anginal pain with an abnormal resting ECG, in patients without known disease; excluding stable disease when the pretest probability is low or intermediate, or when a functional test has been inconclusive; excluding coronary lesions in suspected ACS when the ECG and cardiac markers are inconclusive; checking vein-graft patency (grafts are big, move less than native arteries and seldom calcify, so CT images them well); mapping a chronic total occlusion before revascularisation (the anatomy, the proximal cap and the distal landing zone); and defining an anomalous coronary origin or course, including arteriovenous fistulae.",
            "When the handbook says CT is usually the wrong test: a high pretest probability of coronary disease, a calcium score above 1000, a large body mass index, and previous stenting (accuracy for in-stent restenosis falls in stents under 3 mm and in thick-strut, first-generation stents).",
            "**Current guidance:** the 2024 ESC chronic coronary syndrome guideline recommends coronary CT angiography as the first test for many patients with a lower clinical likelihood of obstructive disease, and functional imaging when the likelihood is higher (taught in the physiology and imaging track, lesson phy-ad-ct).",
          ],
        },
        {
          kind: "table",
          caption: "Class 1 indications for coronary angiography as reproduced in the Oxford handbook (ACC/AHA list; a US guideline set that predates current ESC practice)",
          head: ["Setting", "Indications"],
          rows: [
            [
              "Stable angina, known or suspected coronary disease",
              "Angina of Canadian Cardiovascular Society class 3 or 4 despite drug treatment; non-invasive tests with high-risk features; survival after sudden cardiac death, sustained VT, or polymorphic non-sustained VT",
            ],
            [
              "Unstable coronary syndromes",
              "High or intermediate risk with angina that persists despite adequate first-line drug treatment, or returns once the patient has settled; high risk of an adverse outcome; high- or intermediate-risk unstable angina that settles after initial treatment; initially low-risk unstable angina that later proves high risk on non-invasive testing",
            ],
            [
              "ST-elevation myocardial infarction",
              "Before primary PCI within 12 hours of symptom onset; before revascularisation in cardiogenic shock within 18 hours of the onset of shock; recurrent (stuttering) symptomatic ischaemia; after myocardial infarction, ischaemia at a low workload with 1 mm or more of ST depression",
            ],
          ],
        },
        {
          kind: "check",
          stem: "Four referrals arrive for the same list. Which is the weakest indication for invasive coronary angiography according to the handbook?",
          options: [
            "A 58-year-old with angina at a low workload despite two antianginal drugs and an anterior perfusion defect",
            "A 66-year-old being assessed for mitral valve surgery who has diabetes and hypertension",
            "A 52-year-old coach driver whose fitness-to-drive exercise test was borderline",
            "A 49-year-old with no symptoms and a normal stress test who would like to be ‘checked’",
          ],
          answer: 3,
          explanation:
            "The handbook regards angiography as almost never justified when a patient has neither symptoms nor any sign of ischaemia. Limiting angina despite medication with ischaemia on imaging is a class 1 indication; valve surgery in a patient over 40 with risk factors is a routine reason to image the coronaries; and the handbook explicitly lists pilots and bus drivers with borderline investigations among its other indications.",
        },
        { kind: "h", text: "Angiography before valve surgery" },
        {
          kind: "list",
          items: [
            "Coronary stenoses are hard to diagnose non-invasively when there is significant valve disease, so it remains routine to consider angiography in symptomatic patients being assessed for valve surgery. The small extra risk is judged worth avoiding a missed severe stenosis, and the result feeds the surgical risk assessment.",
            "The handbook's practical guide: angiography for everyone over 40 with one or more cardiac risk factors (such as diabetes, hypertension or a family history), for asymptomatic patients with suspected ischaemia, and for patients with left ventricular systolic dysfunction. Practice varies between centres.",
            "Why it matters: adding CABG to aortic valve replacement in an elderly patient raises the operative risk considerably, and in mitral valve disease unrecognised coronary disease may be the cause of the regurgitation.",
            "Endocarditis is the exception: angiography before surgery is advised only with multiple cardiac risk factors or evidence of coronary embolism.",
          ],
        },
        { kind: "h", text: "The handbook's other indications" },
        {
          kind: "list",
          items: [
            "Typical angina despite antianginal medication.",
            "Atypical chest pain with repeated hospital admissions.",
            "Patients in whom non-invasive testing is unsuitable.",
            "Heart failure of unknown cause.",
            "Pilots and bus drivers whose investigations are borderline.",
            "Chest pain soon after coronary revascularisation.",
          ],
        },
        {
          kind: "table",
          caption: "Relative contraindications listed by the Oxford handbook. Each one is weighed against the indication for the study (the same benefit–risk principle Brilakis applies to revascularisation).",
          head: ["Relative contraindication", "Group"],
          rows: [
            ["Acute kidney injury", "Kidney"],
            ["Pulmonary oedema", "Heart failure"],
            ["Known allergy to radiographic contrast", "Contrast"],
            ["Uncontrolled hypertension", "Haemodynamic"],
            ["Active gastrointestinal haemorrhage; untreated coagulopathy", "Bleeding"],
            ["Acute stroke", "Neurological"],
            ["Untreated or unexplained febrile illness", "Infection"],
          ],
        },
        {
          kind: "check",
          stem: "A 71-year-old with infective endocarditis of the aortic valve is listed for urgent valve replacement. She has no cardiac risk factors, no angina and no sign of coronary embolism. Does the handbook advise coronary angiography first?",
          options: [
            "Yes: everyone over 40 needs angiography before any valve operation",
            "No: in endocarditis it is advised only with multiple risk factors or coronary embolism",
            "Yes: valve disease makes non-invasive testing unreliable, so always image the coronaries",
            "No: angiography is contraindicated in all patients with active infection",
          ],
          answer: 1,
          explanation:
            "Endocarditis has its own rule in the handbook: angiography before surgery only when there are multiple cardiac risk factors or evidence of coronary embolisation. The ‘over 40 with risk factors’ guide applies to valve surgery generally and needs at least one risk factor. Fever is a relative contraindication, not an absolute one, so ruling out angiography in every infected patient overstates it.",
        },
        { kind: "tip", id: "diag-review-previous-films" },
        {
          kind: "pitfalls",
          items: [
            "Accepting ‘no symptoms’ at face value from a patient who has stopped climbing stairs. Ask the family and consider an exercise test.",
            "Starting without the old films. Without them you cannot tell a new lesion from an old one, or know which catheters and wires worked last time.",
            "Missing coronary disease before valve surgery in a patient over 40 with a risk factor, or imaging the coronaries routinely in endocarditis without a reason.",
            "Treating a relative contraindication as absolute in an emergency, or ignoring one in an elective case where it could be corrected first.",
          ],
        },
        {
          kind: "pearl",
          text: "Read the referral as a question the angiogram must answer. Brilakis's planning list starts with the presentation and the indication for a reason: the same narrowing means something different in a patient with a STEMI, in one with limiting angina, and in one with no symptoms at all.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Run the full procedure. Before the puncture, say aloud the presentation (stable, ACS or other), the indication, any relative contraindication and how you have dealt with it, and which earlier studies you have reviewed.",
        },
        { kind: "video", id: "bpLNDwZ6xi0", note: "Diagnostic strategy in stable coronary disease (Elias Hanna)." },
        { kind: "video", id: "hoSxeSgno4M", note: "Revascularisation concepts and diagnostic strategy in stable coronary disease (Elias Hanna)." },
        { kind: "video", id: "_2PhFRt81bg", note: "Heart failure and coronary disease: whether to revascularise and whether every patient needs angiography (Elias Hanna)." },
        {
          kind: "keypoints",
          items: [
            "Catheterisation defines the extent of coronary disease and complements non-invasive imaging; it also assesses LV function, valves, pericardium, congenital disease and cardiomyopathy.",
            "Angiography is lumenography: it shows the lumen, not the wall.",
            "The only absolute contraindication is refusal of consent; acute kidney injury, pulmonary oedema, contrast allergy, uncontrolled hypertension, GI bleeding, acute stroke, coagulopathy and unexplained fever are relative.",
            "Before valve surgery, consider angiography in patients over 40 with a risk factor, in suspected ischaemia and in LV dysfunction; in endocarditis only with multiple risk factors or coronary embolism.",
            "With neither symptoms nor evidence of ischaemia, angiography is almost never justified.",
            "Review earlier angiograms and tests before the case: they show interval change and often the likely target.",
            "Likely non-adherence or non-cardiac surgery within 6–12 months argues against PCI (stent thrombosis risk); medical therapy or CABG may be better.",
            "The handbook put functional testing first and used CT mainly to rule disease out; the 2024 ESC guideline makes CT angiography the first test for many lower-likelihood patients.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-ccs-why",
      title: "Stable disease: what revascularisation can and cannot do",
      minutes: 14,
      topics: ["dec-ccs-revasc"],
      sources: [
        { book: "brilakis-pci", loc: "7.1" },
        { book: "brilakis-pci", loc: "1.7" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "oxford-cath", loc: "ch 8: Indications for PCI" },
      ],
      refs: [...BOOKS, "boden-courage-2007", "ischemia-2020", "al-lamee-orbita-2018", "rajkumar-orbita2-2023", "revived-2022", "fame-2009", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025"],
      blocks: [
        {
          kind: "p",
          text: "Once the angiogram is on the screen, Brilakis asks three questions in order. Is revascularisation needed? If so, PCI or CABG? And if PCI, which lesions, in what order and with what technique? This lesson covers the first question in chronic coronary syndromes; the next covers the choice of modality.",
        },
        {
          kind: "p",
          text: "Revascularisation can do two things: make the patient feel better (fewer symptoms) or help them live longer and avoid events such as myocardial infarction. In stable disease these goals have very different evidence behind them, and you should know which one you are offering before you open a guidewire.",
        },
        {
          kind: "steps",
          title: "Question 1: are there symptoms to relieve?",
          items: [
            { title: "Typical angina", detail: "Chest pain that comes on with exertion and settles with rest. Pain at rest is the signature of an ACS and follows the ACS pathway instead." },
            { title: "Anginal equivalents", detail: "Breathlessness on exertion is a common equivalent of angina." },
            { title: "No symptoms", detail: "A patient without symptoms cannot be made to feel better. Revascularisation can then only be justified on prognostic grounds (below)." },
            { title: "Hidden symptoms", detail: "Check for activity that has been given up, with the family's help and an exercise test, before you accept that a patient is asymptomatic." },
          ],
        },
        { kind: "h", text: "What the trials show in stable disease" },
        {
          kind: "list",
          items: [
            "Brilakis summarises the evidence this way: revascularisation relieves angina better than drugs, reduces or removes the need for antianginal medication and improves quality of life, but it has not been shown to reduce myocardial infarction or death in stable patients, except possibly in high-risk anatomy. The Oxford handbook agrees that PCI is generally indicated to relieve angina and that no study has clearly shown a prognostic benefit from PCI, in contrast with CABG for multivessel or left main disease.",
            "COURAGE (2,287 patients with objective ischaemia): adding PCI to optimal medical therapy did not reduce death or non-fatal myocardial infarction over a median of 4.6 years.",
            "ISCHEMIA (5,179 patients with moderate or severe ischaemia): an initial invasive strategy did not reduce ischaemic events or death compared with an initial conservative strategy over a median of 3.2 years; the result depended on how myocardial infarction was defined.",
            "ORBITA (200 patients randomised, single-vessel stenoses of 70% or more, after 6 weeks of medication optimisation): PCI did not increase exercise time more than a placebo procedure. Its authors concluded that invasive procedures can be tested against a placebo control, as drugs are.",
            "ORBITA-2 (301 patients with stable angina and objective ischaemia, all antianginal drugs stopped before randomisation): at 12 weeks PCI gave a lower angina symptom score than a placebo procedure (2.9 against 5.6). Together the two trials say that PCI does relieve angina beyond placebo, while ORBITA's exercise-time result is a reminder that the size of the gain varies and should be weighed honestly.",
            "REVIVED-BCIS2 (700 patients, LVEF 35% or less, extensive disease, viable myocardium): PCI added to optimal medical therapy did not reduce death or heart-failure hospitalisation over a median of 41 months, and LVEF did not improve more with PCI.",
          ],
        },
        {
          kind: "table",
          caption: "Brilakis's list (from the 2018 ESC/EACTS guideline) of stable patients in whom revascularisation may improve prognosis",
          head: ["Anatomy or finding", "Threshold"],
          rows: [
            ["Left main disease", "Stenosis above 50%"],
            ["Proximal LAD disease", "Stenosis above 50%"],
            ["Two- or three-vessel disease with impaired LV function", "Stenoses above 50% with LVEF 35% or less"],
            ["Large ischaemic territory", "More than 10% of the LV on functional testing, or an abnormal invasive FFR"],
            ["Single remaining patent coronary artery", "Stenosis above 50%"],
            ["Arrhythmic presentation", "Survived sudden death from VF or VT"],
          ],
        },
        {
          kind: "p",
          text: "**What has changed since the manual.** REVIVED-BCIS2 tested PCI in a population similar to the LVEF 35%-or-less group above and found no reduction in death or heart-failure admission, so that line now needs care when the plan is PCI. The trial tested PCI only: the surgical societies that endorsed the 2024 ESC guideline conclude that in complex three-vessel disease on medical therapy CABG is recommended to improve survival whatever the LVEF. The 2024 ESC guideline on chronic coronary syndromes, as quoted in that endorsement, recommends revascularisation in addition to guideline-directed medical therapy for functionally significant three-vessel disease when LVEF is above 35%, to improve long-term survival and reduce cardiovascular death and spontaneous myocardial infarction.",
        },
        {
          kind: "check",
          stem: "A 63-year-old has no symptoms on a treadmill test that took him to a high workload. Angiography after an equivocal CT shows a single 80% mid-RCA stenosis; perfusion imaging showed ischaemia in about 5% of the LV. LVEF is normal. What does Brilakis's algorithm advise?",
          options: [
            "No revascularisation: no symptoms, ischaemia under 10% and no proximal LAD lesion",
            "PCI of the RCA, because an 80% stenosis is likely to be haemodynamically significant",
            "CABG, because surgery is the treatment that improves prognosis in coronary disease",
            "FFR of the RCA first, then PCI if the value is 0.80 or less, whatever his symptoms",
          ],
          answer: 0,
          explanation:
            "In an asymptomatic patient with single-vessel disease, Brilakis's algorithm only proceeds to a risk–benefit decision if ischaemia exceeds 10% of the LV or the proximal LAD has a 50% or greater stenosis. Neither applies, and he cannot feel better because he has no symptoms. Physiology tells you whether a lesion is significant, not whether revascularising it will help a patient without symptoms or a large ischaemic burden.",
        },
        {
          kind: "steps",
          title: "Question 2: how much disease, and how severe?",
          items: [
            { title: "Count the diseased vessels", detail: "The extent of disease is central to both whether to revascularise and how. Single-vessel disease is treated with PCI in most cases; multivessel or left main disease can be treated with PCI or CABG (lesson 3)." },
            { title: "Grade each lesion", detail: "A stenosis of 90% or more is almost always haemodynamically significant. Below that, coronary physiology defines severity more accurately than the eye (the pressure wire is taught in pm-physiology); FAME showed that FFR-guided multivessel PCI treats fewer lesions with better outcomes than angiographic guidance." },
            { title: "In the asymptomatic patient", detail: "Single vessel: go on to weigh benefit and risk only if ischaemia exceeds 10% or there is a proximal LAD stenosis of 50% or more. Multivessel: go on to the modality questions only if ischaemia exceeds 10%, LVEF is below 35% or the left main has a 50% or greater stenosis. Otherwise, no revascularisation." },
          ],
        },
        {
          kind: "steps",
          title: "Question 3: do the benefits outweigh the risks?",
          items: [
            { title: "A. The impact of the disease", detail: "Symptoms, ischaemic burden and myocardial function. The worse the angina (for example at minimal exertion), the more there is to gain." },
            { title: "B. The operator", detail: "Experience brings higher success and fewer complications, and better handling of complications when they happen. The state of the operator and team, such as being well rested rather than sleep deprived, also affects outcome." },
            { title: "C. The lesions", detail: "Chronic total occlusion, bifurcation, left main, vein graft, thrombus, calcium, ostial position, multivessel, small-vessel and diffuse disease each lower the chance of technical success and raise the complication risk." },
            { title: "D. Comorbidities", detail: "Cardiac: ACS, previous CABG, heart failure, atrial fibrillation, low ejection fraction, high filling pressures, valve disease. Non-cardiac: advanced age, diabetes, renal failure, COPD, peripheral vascular disease, high bleeding risk, frailty. They raise the risk and can shrink the benefit: revascularisation for prognosis makes no sense in a patient with a terminal non-cardiac illness such as cancer." },
            { title: "The risk side of the ledger", detail: "Acute: vessel closure, perforation, lost equipment, myocardial infarction, emergency CABG, tamponade, arrhythmia, access complications, thromboembolism, contrast complications, radiation injury, shock and death. Long-term: in-stent restenosis, stent thrombosis and complications of dual antiplatelet therapy." },
            { title: "Question 4: what does the patient want?", detail: "The decision is always the patient's. The interventional cardiologist and the heart team inform and guide; they do not decide for the patient." },
          ],
        },
        {
          kind: "list",
          items: [
            "The Oxford handbook's minimum for any PCI: symptoms consistent with ischaemia (chest pain, breathlessness), objective ischaemia (an acute ECG change, or an abnormal functional imaging test), coronary anatomy that is technically suitable, and appropriate consent.",
            "Gruentzig's original selection criteria were stable angina, ischaemia documented on functional testing, single-vessel disease (ideally a proximal, non-occluded, non-calcified lesion) and nothing that would prevent bail-out CABG. The handbook notes these patients still do well with low risk, while PCI has since extended to unstable patients, multivessel, bifurcation, left main and vein-graft disease, and patients unfit for CABG.",
          ],
        },
        {
          kind: "check",
          stem: "A 79-year-old with metastatic lung cancer and an estimated survival of months has angina at rest-to-minimal exertion despite three drugs. Angiography shows a 90% proximal LAD stenosis. How does Brilakis's benefit–risk framework apply?",
          options: [
            "Do not revascularise: terminal cancer removes any prognostic benefit, so nothing can be gained",
            "Refer for CABG, because a proximal LAD lesion is a prognostic indication for surgery",
            "Prognostic benefit is not a goal here, but symptom relief may still justify PCI if the patient wants it",
            "Treat medically only, because the ORBITA trial showed that PCI does not relieve angina in single-vessel disease",
          ],
          answer: 2,
          explanation:
            "Brilakis rules out revascularisation aimed at prognosis in terminal non-cardiac disease, but severe angina at minimal exertion is exactly the situation where the potential symptomatic benefit is greatest; the comorbidity raises the risk and the patient decides. ORBITA did not show that PCI never relieves angina: it showed no greater gain in exercise time than a placebo procedure in its population, and ORBITA-2, with antianginal drugs stopped, found less angina after PCI than after placebo.",
        },
        { kind: "tip", id: "pci-plan-name-the-goal" },
        {
          kind: "pitfalls",
          items: [
            "Promising a stable patient that a stent will prevent a heart attack. For most stable patients that has not been shown.",
            "Treating an intermediate lesion on its appearance alone when physiology could be measured.",
            "Leaving the operator's own state out of the risk estimate: a tired team at the end of a long list is part of the risk.",
            "Offering prognostic revascularisation to a patient whose comorbidity will limit life far more than the coronary disease.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the goal on the plan: ‘symptom relief’, ‘prognosis’ or ‘ACS culprit’. It changes how much risk is acceptable, whether incomplete revascularisation matters, and what you tell the patient afterwards.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "estimate",
          task: "Estimate each stenosis, then decide for each one whether it is in the 90%-or-more group that is almost always significant, or an intermediate lesion that needs physiology before a revascularisation decision.",
        },
        { kind: "video", id: "9Oc0eRl_xP8", note: "Manual of PCI chapter 7.1: PCI versus CABG versus no revascularisation." },
        { kind: "video", id: "pyrNwXtfGfU", note: "Stable coronary disease part 1: concepts, screening and management (Elias Hanna)." },
        { kind: "video", id: "khoa3Fd8hqg", note: "Stable coronary disease part 2: questions, summary and INOCA (Elias Hanna)." },
        { kind: "video", id: "DiobAb9Fw04", note: "Viability testing in ischaemic cardiomyopathy: concepts, caveats and cases (Elias Hanna)." },
        {
          kind: "keypoints",
          items: [
            "Three questions after every angiogram: revascularise? PCI or CABG? Which lesions, in what order, how?",
            "In stable disease revascularisation relieves angina better than medication and improves quality of life (Brilakis; ORBITA-2 showed benefit over placebo); weigh the size of the gain honestly, and remember a prognostic benefit is limited to high-risk subsets.",
            "No symptoms means no symptomatic benefit: then revascularise only for prognosis (left main, proximal LAD, ischaemia over 10%, and the other listed subsets).",
            "A stenosis of 90% or more is almost always significant; below that, use physiology.",
            "Weigh four things: the impact of the disease, the operator, the lesions and the comorbidities, against the acute and long-term risks.",
            "REVIVED-BCIS2 found no reduction in death or heart-failure admission with PCI for ischaemic LV dysfunction; it did not test CABG.",
            "The patient makes the final decision.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-heart-team",
      title: "PCI or CABG: surgical risk, the SYNTAX score and the heart team",
      minutes: 16,
      topics: ["dec-heart-team", "dec-ccs-revasc"],
      sources: [
        { book: "brilakis-pci", loc: "7.1" },
        { book: "brilakis-pci", loc: "17.1" },
        { book: "brilakis-pci", loc: "17.6" },
        { book: "brilakis-pci", loc: "17.7" },
        { book: "brilakis-pci", loc: "17.12" },
        { book: "brilakis-pci", loc: "17.13" },
        { book: "brilakis-pci", loc: "17.14" },
        { book: "brilakis-pci", loc: "3.5" },
        { book: "oxford-cath", loc: "ch 8: Indications for PCI" },
        { book: "oxford-cath", loc: "ch 8: Multivessel PCI" },
        { book: "oxford-cath", loc: "ch 8: Left main stem PCI" },
        { book: "oxford-cath", loc: "ch 2: The cardiologist" },
      ],
      refs: [...BOOKS, "sianos-syntax-score-2005", "syntax-2009", "farkouh-freedom-2012", "excel-2016", "noble-2016", "esc-revasc-2018", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025", "preserve-2018", "mehilli-isar-sweet-2004"],
      blocks: [
        {
          kind: "p",
          text: "When a stable patient has disease in more than one vessel or in the left main, both PCI and CABG are on the table. Brilakis's summary of the trade-off: PCI is usually easier and carries less upfront risk, but more patients need a repeat procedure later. This lesson works through his modality questions in order, then teaches the SYNTAX score step by step, and ends with the heart team.",
        },
        {
          kind: "steps",
          title: "The modality questions, in order",
          items: [
            {
              title: "1. Has the patient had CABG before?",
              detail: "Redo CABG carries more risk of death and complications and is done infrequently, so PCI is usually favoured. Redo surgery can still be considered when grafts are severely diseased or occluded, the native vessels are not suitable for PCI, LVEF is depressed and no arterial graft is patent; internal mammary grafts are used at reoperation if feasible.",
            },
            {
              title: "2. Does the patient have diabetes?",
              detail: "In several trials, patients with diabetes and multivessel disease did better with CABG, including lower mortality, although most used first-generation drug-eluting stents. Brilakis links this to more restenosis and more progression in unstented segments in diabetes, and to the LIMA-to-LAD graft. CABG is generally preferred for a patient with diabetes and multivessel disease who is a good surgical candidate.",
            },
            {
              title: "3. Is the patient a good surgical candidate?",
              detail: "Estimate surgical risk with the STS score (estimates the chance of death in hospital or by 30 days, and of complications in hospital) or EuroSCORE II (predicts in-hospital mortality). The factors they weigh are listed in the table below.",
            },
            {
              title: "4. How complex is the disease?",
              detail: "Measure it with the SYNTAX score (next section). Brilakis prefers CABG for complex multivessel disease and PCI for less complex disease, although his SYNTAX table allows either for three-vessel disease scoring 0–22. Note where the question sits in his stable algorithm: complexity is asked only in patients without diabetes, and before surgical candidacy. Complex disease then leads to the surgical-candidate question; less complex disease goes straight to the PCI benefit–risk question.",
            },
            {
              title: "5. Then the same last steps as before",
              detail: "Benefit against risk for the chosen modality, then the patient's informed preference.",
            },
          ],
        },
        {
          kind: "table",
          caption: "What surgical risk scores take into account (Brilakis's list, regrouped)",
          head: ["Cardiac", "Non-cardiac"],
          rows: [
            ["Recent ACS; urgency of operation; severity of angina", "Age, sex, height and weight, mobility"],
            ["LV function; heart failure; pulmonary hypertension", "Renal disease, liver disease, chronic lung disease"],
            ["Valve disease; active endocarditis; previous cardiac surgery", "Peripheral arterial disease, cerebrovascular disease, diabetes"],
            ["Porcelain aorta; atrial fibrillation; heart block; cardiogenic shock", "Immunocompromise, previous mediastinal radiation, severe chest deformity or scoliosis"],
            ["Current drugs (P2Y12 inhibitors, glycoprotein IIb/IIIa inhibitors and others)", "Illicit drug use, cancer, haematocrit, platelet count, frailty"],
          ],
        },
        {
          kind: "check",
          stem: "A 61-year-old with type 2 diabetes has three-vessel disease and limiting angina. LVEF is 45%. He is fit, with a low STS score. Which modality does Brilakis's algorithm favour?",
          options: [
            "PCI with modern drug-eluting stents, since the diabetes trials used older stents",
            "Medical therapy, because revascularisation does not improve prognosis in stable disease",
            "CABG, because he has diabetes with multivessel disease and is a good surgical candidate",
            "PCI of the LAD only, leaving the other vessels to medical therapy",
          ],
          answer: 2,
          explanation:
            "Diabetes plus multivessel disease in a good surgical candidate leads to CABG in Brilakis's algorithm. FREEDOM (1,900 patients with diabetes and multivessel disease) found death, myocardial infarction or stroke at 5 years in 26.6% after PCI against 18.7% after CABG, with more strokes after CABG. The older-stent caveat is real but does not reverse the recommendation; he has symptoms, so medical therapy alone is not the default answer.",
        },
        {
          kind: "list",
          items: [
            "Oxford on diabetes: these patients tend to have diffuse multivessel disease in small vessels, often alongside poor LV function, kidney impairment and cerebrovascular disease, and the historical trials favoured CABG with an apparent survival benefit.",
            "If a patient with diabetes does have PCI, the handbook suggests preparing them: good glycaemic control beforehand (its target is an HbA1c of 7.0% or less); statin loading before the procedure, for lipid lowering and to limit procedural myocardial injury; fluids beforehand and a minimal contrast volume when the kidneys are impaired; and drug-eluting stents because restenosis risk is high.",
            "The handbook also suggests considering a glycoprotein IIb/IIIa inhibitor, especially in insulin-treated patients. Treat that as dated: in ISAR-SWEET (701 diabetic patients having elective PCI after a 600 mg clopidogrel load) routine abciximab did not reduce death or myocardial infarction at 1 year (8.3% against 8.6%), although it reduced restenosis with bare-metal stents. Brilakis gives the goals of intravenous antiplatelet drugs as stopping thrombus growth when there is large thrombus or no-reflow, and preventing stent thrombosis.",
            "The same list includes N-acetylcysteine. The later PRESERVE trial found no benefit of oral acetylcysteine over placebo for death, dialysis, persistent kidney decline or contrast-associated kidney injury after angiography, so it is not taught here as a measure to use.",
          ],
        },
        { kind: "h", text: "The SYNTAX score, step by step" },
        {
          kind: "p",
          text: "The SYNTAX score grades how anatomically complex the disease is. Each lesion with a diameter stenosis of 50% or more in a vessel of at least 1.5 mm is scored separately, and the lesion scores are added. Work through these steps for each lesion:",
        },
        {
          kind: "table",
          caption: "Scoring a lesion (Brilakis Fig. 7.2, from the 2018 ESC/EACTS guideline)",
          head: ["Step", "What you assess", "Points"],
          rows: [
            ["1", "Dominance", "Right or left; segment weights depend on it. There is no co-dominant option."],
            ["2", "Segment", "Each segment has a weight from 0.5 (posterolateral branch) to 6 (left main in a left-dominant system); the left main weighs 5 in a right-dominant system."],
            ["3", "Diameter stenosis", "Segment weight × 2 for a 50–99% stenosis; × 5 for a total occlusion."],
            ["3a", "Extra points for an occlusion", "+1 if over 3 months old or of unknown age; +1 blunt stump; +1 bridging collaterals; +1 for each segment not visible before the first visible distal segment; a branch arising at the occlusion adds +1 when it is smaller than 1.5 mm, +1 when there are branches both smaller and larger than 1.5 mm, and nothing when it is 1.5 mm or larger (that case is scored as a bifurcation)"],
            ["4", "Trifurcation", "+3, +4, +5 or +6 for one, two, three or four diseased segments"],
            ["5", "Bifurcation (Medina)", "+1 for 1,0,0 or 0,1,0 or 1,1,0; +2 for 1,1,1 or 0,0,1 or 1,0,1 or 0,1,1; +1 more if the bifurcation angle is under 70°"],
            ["6", "Aorto-ostial", "+1"],
            ["7", "Severe tortuosity proximal to the lesion", "+2"],
            ["8", "Length over 20 mm", "+1"],
            ["9", "Heavy calcification", "+2"],
            ["10", "Thrombus", "+1"],
            ["11", "Diffuse disease or small vessels downstream", "+1 per segment number, when at least 75% of the segment beyond the lesion is under 2 mm"],
          ],
        },
        {
          kind: "formula",
          name: "SYNTAX lesion score",
          expr: "lesion score = (segment weight × stenosis factor) + points for adverse features; SYNTAX score = sum of all lesion scores",
          note: "Stenosis factor 2 for 50–99%, 5 for total occlusion. Worked example: a heavily calcified, 70% distal left main lesion, Medina 1,0,0 with a branch angle of 70° or more, right-dominant system: 5 × 2 = 10, +1 bifurcation, +2 calcium = 13 for this lesion.",
        },
        {
          kind: "table",
          caption: "Using the score (Brilakis Table 7.1, from the 2018 ESC/EACTS guideline, and section 17.7; the 2024 ESC change is in the last row)",
          head: ["Anatomy", "SYNTAX", "Modality"],
          rows: [
            ["Two-vessel disease", "No threshold given", "PCI or CABG"],
            ["Three-vessel disease", "0–22", "PCI or CABG (Brilakis, 2018 ESC)"],
            ["Three-vessel disease", "Above 22", "CABG (Brilakis, 2018 ESC)"],
            ["Left main", "0–32 (low 0–22, intermediate 23–32)", "PCI or CABG: similar benefit in good surgical candidates without diabetes"],
            ["Left main", "33 or more", "CABG usually benefits good surgical candidates more"],
            ["Three-vessel disease, 2024 ESC", "Low or intermediate complexity", "Without diabetes: PCI is a class I alternative to CABG if it can match CABG's completeness. With diabetes: CABG over PCI (class I)"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds that the left main question remains controversial, with some studies showing better outcomes after CABG, and that the decision belongs to a heart team that takes the patient's preference and comorbidities into account. The trials behind these thresholds are SYNTAX (three-vessel or left main disease; at 12 months PCI with first-generation stents had more major adverse events, driven by repeat revascularisation, while stroke was more frequent after CABG) and, for the left main, EXCEL and NOBLE.",
        },
        {
          kind: "p",
          text: "The history behind the comparison, as the Oxford handbook tells it: CABG became the reference treatment for multivessel disease because complete revascularisation of every compromised territory goes with better survival. The balloon-angioplasty trials BARI and EAST found death and myocardial infarction similar to CABG, but more events overall because angioplasty patients needed repeat procedures. With stents (SoS, ARTS) the need for further PCI fell, and drug-eluting stents compared well with surgery against historical controls (ARTS-II).",
        },
        { kind: "h", text: "Is the left main lesion significant? (Brilakis 17.1, 17.6, 17.12, 17.13)" },
        {
          kind: "steps",
          title: "Before the left main algorithm, establish the lesion",
          items: [
            { title: "1. Trust the eye only for severe lesions", detail: "Angiography is usually adequate when the left main narrowing is 70% or more. Between 30% and 70%, observers disagree substantially, because the left main is short, often diffusely diseased and lacks a normal reference segment. Image the bifurcation in caudal views (RAO caudal, AP caudal and the LAO caudal ‘spider’) and use orthogonal views, since the ostium is usually oval." },
            { title: "2. Intermediate lesion: measure it", detail: "Physiology or intravascular imaging is essential for an intermediate left main lesion. With a pressure wire, disengage the guide from an ostial lesion so it does not damp, measure in both the LAD and the circumflex, and pull back to show whether the step-up is in the left main. A normal value in one branch but not the other suggests the problem is in the branch rather than the left main." },
            { title: "3. Beware downstream disease", detail: "A stenosis further down the LAD or circumflex limits the maximal flow that can be reached, so the distal pressure reads higher and the left main lesion looks less severe than it is." },
            { title: "4. Imaging thresholds", detail: "Unlike most other lesions, the left main can be judged by imaging: a minimum lumen area under 6.0 mm² by IVUS or under 5.4 mm² by OCT is taken as significant and needing revascularisation. In Korean patients, whose coronary arteries are smaller, a lower IVUS cut-off of 4.5 mm² has been suggested. (Imaging technique is taught in pm-imaging; left main PCI itself in cp-left-main.)" },
            { title: "5. Plan the risk", detail: "Review earlier angiograms and operation notes. Right heart catheterisation shows filling pressures and cardiac output, helps decide on haemodynamic support before the intervention and lets you monitor during it. Brilakis describes support as common practice in left main PCI, particularly with a low ejection fraction, decompensated haemodynamics (high LV end-diastolic or wedge pressure), an occluded RCA, or a planned long ischaemic procedure such as atherectomy (device choice is taught in pm-support-choice)." },
          ],
        },
        {
          kind: "steps",
          title: "Left main disease: Brilakis's heart-team algorithm (after Ramadan, Boden and Kinlay)",
          items: [
            { title: "Previous CABG?", detail: "Yes: ask whether PCI benefits outweigh its risks. If so, PCI; if not, no revascularisation." },
            { title: "Good surgical candidate?", detail: "No: go to the PCI benefit–risk question. Yes: assess the extent of disease." },
            { title: "SYNTAX below 33", detail: "Both options remain: weigh the benefit and risk of CABG and of PCI." },
            { title: "SYNTAX 33 or more", detail: "Ask whether CABG benefits outweigh its risks. Yes: CABG. No: return to the PCI benefit–risk question." },
            { title: "Patient preference", detail: "Runs across every branch: the informed patient chooses between the options that remain." },
          ],
        },
        {
          kind: "list",
          items: [
            "Brilakis lists five inputs to every left main decision: stable versus acute presentation, the extent and complexity of the anatomy and whether complete revascularisation is achievable, LV function, comorbidities such as diabetes, and patient preference.",
            "Planning questions before any left main intervention (17.1): is the RCA also diseased or occluded, are there collaterals from the RCA to the left system, is the left main protected by a patent bypass graft, and is there calcium that may need atherectomy? LV function, haemodynamics, presentation and comorbidity decide procedural risk and the need for support.",
            "The Oxford handbook's view is more cautious and older. It notes that the left main, traditionally a surgical lesion, is increasingly treated with PCI because it is wide, rarely tortuous and its lesions are short, which lowers restenosis risk. It still describes elective left main PCI as controversial and lists its indications as a protected left main, refusal of CABG, unsuitability for CABG, suitable anatomy after informed discussion, and clinical trials. It reserves urgent left main PCI for dissection or other complications involving the left main and for primary PCI.",
            "Oxford's technical points for left main PCI: IVUS before the stent to size the vessel and length, and after it to confirm expansion; an intra-aortic balloon pump electively when LV function is impaired (normal ventricles usually tolerate brief left main inflations); and, because left main in-stent restenosis can be disastrous, some operators repeat angiography 3–6 months later.",
          ],
        },
        {
          kind: "check",
          stem: "A 68-year-old without diabetes has an isolated distal left main stenosis and a SYNTAX score of 26, found at a diagnostic angiogram for stable angina. She is a good surgical candidate with normal LV function. What should happen next, according to Brilakis?",
          options: [
            "Heart-team discussion of PCI and CABG, then the patient's informed choice; no ad hoc PCI",
            "Ad hoc left main PCI now, because a score of 26 is in the range where PCI and CABG are similar",
            "Refer for CABG only, because any left main stenosis is a surgical indication",
            "Medical therapy, since a SYNTAX score under 33 means revascularisation adds nothing",
          ],
          answer: 0,
          explanation:
            "An intermediate score (23–32) in a good surgical candidate without diabetes is where Brilakis says CABG and PCI give similar benefit, which makes it a heart-team decision with the patient's preference. Unprotected left main disease is also first on his list of reasons to defer rather than proceed ad hoc. Similar outcomes are a reason to discuss, not a licence to proceed on the table; and a left main lesion is not a reason for medical therapy alone.",
        },
        { kind: "h", text: "The heart team" },
        {
          kind: "list",
          items: [
            "Brilakis: the interventional cardiologist and the heart team educate the patient and help them decide; the final decision is the patient's.",
            "The Oxford handbook expects an interventional trainee to take part in heart-team discussions and to be able to explain the advantages and disadvantages of medical therapy, PCI and surgery to patients, their families and the wider team.",
            "Oxford on multivessel PCI: if the patient meets the classic criteria for surgery, the advice given and the consent taken must reflect that.",
            "**Current guidance on three-vessel disease:** the 2024 ESC chronic coronary syndrome guideline, as quoted in the surgical societies' endorsement, recommends CABG over PCI and over medical therapy alone in patients with diabetes (class I). Without diabetes, CABG is recommended over medical therapy alone to improve survival, symptoms and major events (class I); PCI is recommended alongside CABG for low or intermediate complexity only if it can achieve similarly complete revascularisation (class I), because it is less invasive and not inferior for overall survival. CABG still reduces spontaneous myocardial infarction and cardiovascular death more than PCI in that group, and repeat revascularisation is consistently more frequent after PCI. When PCI and CABG carry equal recommendations, a heart-team discussion is needed and ad hoc PCI should not be performed (class I).",
          ],
        },
        { kind: "tip", id: "diag-stop-for-heart-team" },
        {
          kind: "pitfalls",
          items: [
            "Using 33 for three-vessel disease: it is a left main threshold. In three-vessel disease Brilakis's table moves to CABG above 22, the 2024 ESC guideline lets PCI stand beside CABG at low or intermediate complexity without diabetes, and diabetes changes the answer whatever the score.",
            "Scoring a co-dominant system: SYNTAX has no co-dominant option, so you must call it right or left.",
            "Forgetting diabetes. It moves a multivessel patient towards CABG whatever the SYNTAX score.",
            "Presenting the heart team's view as the decision. The informed patient decides between the reasonable options.",
          ],
        },
        {
          kind: "pearl",
          text: "Score SYNTAX before you present the case, not in the meeting. Doing it lesion by lesion forces you to look at every segment, dominance, every bifurcation and every occlusion, and the number then anchors a discussion that might otherwise rest on impressions.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "estimate",
          task: "For each run, estimate the stenosis and decide whether it would count in a SYNTAX score (50% or more in a vessel of at least 1.5 mm), then name the adverse features you would add (length over 20 mm, heavy calcium, thrombus, bifurcation, aorto-ostial position).",
        },
        { kind: "video", id: "-HrCN7ZzFQE", note: "Revascularisation strategies (Dallas CVI 2016 lecture)." },
        { kind: "video", id: "6Zm42-ZZD_U", note: "Coronary artery bypass graft surgery in 2016 (Dallas CVI lecture)." },
        { kind: "video", id: "XzWU4SptnzQ", note: "Case: three-vessel PCI with an RCA chronic total occlusion." },
        {
          kind: "keypoints",
          items: [
            "Order of questions: previous CABG, then diabetes; with diabetes go to surgical candidacy (STS, EuroSCORE II), without it ask about complexity (SYNTAX) first; then benefit against risk and patient preference.",
            "Previous CABG, poor surgical candidacy and less complex disease favour PCI; diabetes, reduced LVEF and complex multivessel disease favour CABG.",
            "SYNTAX: segment weight × 2 (50–99%) or × 5 (occlusion), plus points for occlusion features, trifurcation, bifurcation, ostial position, tortuosity, length over 20 mm, heavy calcium, thrombus and diffuse small-vessel disease.",
            "Brilakis (2018 ESC): three-vessel disease 0–22 either, above 22 CABG; left main 0–32 either, 33 or more CABG. 2024 ESC: in three-vessel disease without diabetes, PCI is a class I alternative at low or intermediate complexity if it can match CABG's completeness; with diabetes, CABG over PCI.",
            "An intermediate left main lesion needs physiology (in both branches, with pullback) or imaging (IVUS MLA under 6.0 mm², OCT under 5.4 mm²).",
            "Left main decisions also depend on presentation, LV function, comorbidity and whether revascularisation can be complete.",
            "Unprotected left main and multivessel disease are on Brilakis's list of reasons to defer ad hoc PCI; for three-vessel disease the 2024 ESC guideline adds that equal PCI and CABG recommendations mean a heart-team discussion and no ad hoc PCI.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-timing",
      title: "Ad hoc or staged, and the order of lesions",
      minutes: 14,
      topics: ["dec-timing-sequence"],
      sources: [
        { book: "brilakis-pci", loc: "7.3" },
        { book: "brilakis-pci", loc: "7.4" },
        { book: "brilakis-pci", loc: "1.1" },
        { book: "brilakis-pci", loc: "17.10" },
        { book: "brilakis-pci", loc: "21.1" },
        { book: "oxford-cath", loc: "ch 8: Multivessel PCI" },
      ],
      refs: [...BOOKS, "blankenship-ad-hoc-2013", "complete-2019", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025"],
      blocks: [
        {
          kind: "p",
          text: "PCI done immediately after the diagnostic angiogram, on the same table, is called ad hoc PCI. The alternative is to stop, plan and come back. Once PCI is chosen, the order of the lesions matters as much as the decision to treat them. This lesson gives you the reasons to defer, the reasons to stage a multivessel procedure, and the rules for sequence.",
        },
        {
          kind: "table",
          caption: "Ad hoc versus delayed PCI (Brilakis 7.3.1)",
          head: ["", "Ad hoc PCI", "Delayed PCI"],
          rows: [
            ["Main advantage", "No second procedure, so no second set of procedural risks", "Time to plan, and to discuss risks and benefits properly with the patient"],
            ["Main cost", "More contrast and radiation in one sitting, less planning, less time for the consent conversation", "A second arterial access and procedure"],
            ["Where it is favoured", "Needed in most ACS patients with active ischaemia, because CABG would bring delay", "Stable patients, or ACS patients without active ischaemia, when one of the listed reasons applies (for example complex anatomy)"],
          ],
        },
        {
          kind: "p",
          text: "The SCAI consensus on ad hoc PCI that Brilakis cites makes the same balance explicit: no randomised trial has compared the two strategies, cohort studies have not found consistent differences in safety or efficacy, ad hoc PCI is the default for ACS, and in stable disease it needs planning beforehand and a reassessment of appropriateness after the diagnostic angiogram.",
        },
        {
          kind: "steps",
          title: "The pause after the diagnostic run: reasons to defer (Brilakis, after the SCAI consensus)",
          items: [
            { title: "Anatomy", detail: "Complex or high-risk disease: unprotected left main, chronic total occlusion, multivessel disease, bifurcations." },
            { title: "Dose", detail: "Too much contrast or radiation already used, or expected to be needed for the PCI." },
            { title: "Place", detail: "A centre without on-site surgery when patient or lesion risk is high, or one that lacks the equipment the lesion needs." },
            { title: "Consent", detail: "The anatomy carries a much higher PCI risk than was discussed before the diagnostic study." },
            { title: "Symptoms and ischaemia", detail: "Uncertainty about how symptomatic a stable patient really is; no evidence of ischaemia when FFR or IVUS is unavailable." },
            { title: "Complication", detail: "Anything that went wrong during the diagnostic study, such as a stroke or access-site bleeding." },
            { title: "People", detail: "Operator or patient fatigue; a scheduling clash, such as a STEMI coming in just as you weigh ad hoc PCI in a stable patient." },
            { title: "Preparation", detail: "No aspirin before the study, an inadequate trial of antianginal therapy, inadequate hydration." },
            { title: "Choice", detail: "The patient prefers to wait." },
          ],
        },
        {
          kind: "list",
          items: [
            "Brilakis's planning chapter adds that in renal failure or in an anticoagulated patient it may be best to stage a non-emergency PCI.",
            "Brilakis advises against ad hoc CTO PCI in most cases, to leave time for planning, preparation and counselling, to limit contrast, radiation and fatigue, and to allow tests such as viability. Exceptions he gives: an ACS from a failing, heavily diseased vein graft, where treating the native CTO is preferred if feasible, and patients in whom arterial access is very difficult to obtain.",
            "**Current guidance:** for three-vessel disease, the 2024 ESC chronic coronary syndrome guideline, as quoted by the surgical societies that endorsed it, states that when PCI and CABG carry equal recommendations a heart-team discussion is needed and ad hoc PCI should not be performed (class I).",
          ],
        },
        {
          kind: "check",
          stem: "A stable patient was consented for angiography with possible PCI of ‘a single narrowing’. The angiogram shows a severe RCA lesion and a chronic total occlusion of the LAD. 110 mL of contrast has been used. The RCA lesion looks straightforward. What is the best course?",
          options: [
            "Treat the RCA now, since the patient consented to possible PCI and the lesion is straightforward",
            "Treat both lesions now, because a second arterial puncture carries its own risk",
            "Attempt the LAD occlusion first, so CABG can be offered if the attempt fails",
            "Stop: complex anatomy and a risk not covered by the consent; plan and discuss before any PCI",
          ],
          answer: 3,
          explanation:
            "Two of Brilakis's reasons to defer apply: the anatomy includes a CTO and multivessel disease, and the consent covered a much simpler procedure. Brilakis advises against ad hoc CTO PCI in most cases, and a patient with an LAD occlusion and other disease may be a surgical candidate who should hear that option first. Treating the RCA alone now commits the patient to a strategy before the plan exists.",
        },
        { kind: "h", text: "Staging a multivessel procedure" },
        {
          kind: "p",
          text: "Complete revascularisation, either at once or staged, reduces cardiovascular death or myocardial infarction after STEMI with multivessel disease (COMPLETE), and observational data in stable patients also favour completeness. The Oxford handbook notes that complete revascularisation of every compromised territory is associated with better survival, and that registries suggest PCI achieves it in only 30–70% of patients. Staging is how you get there safely.",
        },
        {
          kind: "steps",
          title: "Reasons to stop and stage the remaining lesions (Brilakis 7.3.2)",
          items: [
            { title: "The remaining lesions are complex", detail: "Leave them for a planned procedure with the right equipment and time." },
            { title: "They cause no active ischaemia (ACS)", detail: "Once the culprit is treated, non-culprit lesions can wait for a later sitting." },
            { title: "Dose", detail: "Too much contrast or radiation already, or expected for the next lesions." },
            { title: "Complications", detail: "Any complication during the first part of the procedure." },
            { title: "Fatigue", detail: "Of the operator, or of the patient." },
          ],
        },
        {
          kind: "list",
          items: [
            "Oxford: operators may choose not to treat every lesion in one sitting, especially CTOs and bifurcations; the later procedures are staged procedures.",
            "Oxford: multivessel PCI raises the risk of hypotension and haemodynamic compromise if a target vessel occludes while other vessels are stenosed, and more stents and greater stent length may raise the risk of restenosis and stent thrombosis.",
          ],
        },
        { kind: "h", text: "Choosing the order" },
        {
          kind: "steps",
          title: "Sequence rules",
          items: [
            { title: "ACS first principle", detail: "In ACS with multivessel disease, treat the culprit first, especially when it is causing active ischaemia (such as the STEMI culprit)." },
            { title: "Several lesions in one artery (stable)", detail: "Start distally, unless a proximal or ostial lesion damps the pressure badly, provokes ischaemia, or is too tight to pass devices through. Deal with every significant lesion in the vessel you are working on during the same sitting." },
            { title: "Several arteries (stable): complexity", detail: "Starting with the simpler lesions can make the harder ones easier to tackle." },
            { title: "Several arteries: dose", detail: "If a lot of contrast or radiation has already been given, treat the easier lesions and defer the complex ones." },
            { title: "Several arteries: the fallback", detail: "With an LAD CTO plus non-occlusive RCA and circumflex lesions, some operators attempt the CTO first and refer for CABG if it fails; others treat the RCA and circumflex first to make the CTO attempt safer, given CTO success of 85–90% in experienced centres. The Oxford handbook says many operators like to start with the hardest lesion, keeping CABG as the option if it fails, rather than leave the patient partly revascularised." },
            { title: "Around the left main", detail: "When the left main narrowing is not critical and LAD and circumflex lesions also need stents, treat those branch lesions first, because delivering equipment through a freshly stented left main can be harder. If the RCA has significant lesions, consider treating the RCA first to make the left main PCI safer." },
          ],
        },
        {
          kind: "check",
          stem: "A stable patient has a 70% ostial RCA lesion that damps the guide on engagement and a 90% distal RCA lesion. In what order should they be treated?",
          options: [
            "Distal lesion first, because the distal lesion is always the one treated first in serial disease",
            "Ostial lesion first, because it damps the guide and stands between you and the distal lesion",
            "Distal lesion in this procedure and the ostial lesion staged after a few weeks",
            "Treat only the 90% lesion, since a 70% ostial lesion is not significant",
          ],
          answer: 1,
          explanation:
            "Distal-first is the default, but Brilakis makes exceptions for a proximal or ostial lesion that causes severe damping or ischaemia, or that stops devices passing. A damping ostial lesion is exactly that. All significant lesions in the same target vessel should be treated in one procedure, so staging the ostial lesion is not the plan, and its significance would be judged by physiology or imaging, not dismissed on its appearance.",
        },
        { kind: "tip", id: "diag-ad-hoc-pause" },
        { kind: "tip", id: "pci-stage-on-dose" },
        { kind: "tip", id: "pci-serial-distal-first" },
        { kind: "tip", id: "pci-lm-branches-and-rca-first" },
        { kind: "tip", id: "pci-stage-after-complication" },
        {
          kind: "pitfalls",
          items: [
            "Letting the open sheath make the decision. A second puncture is a small price for a planned procedure and an informed patient.",
            "Treating the easy lesion ad hoc in a patient who may need CABG: it commits the patient before the heart team has met.",
            "Stenting the left main first and then struggling to deliver equipment to LAD and circumflex lesions you could have treated beforehand.",
            "Carrying on after a complication or past a contrast or radiation limit because only one lesion remains.",
          ],
        },
        {
          kind: "pearl",
          text: "Make the ad hoc decision a formal pause, not a drift. Run Brilakis's list aloud while the diagnostic images replay: anatomy, dose, place, consent, symptoms, complications, people, preparation, preference. If any item fails, stop and plan.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "At the hand-over from the diagnostic study to PCI, decide ad hoc or delayed PCI and say which of Brilakis's reasons to defer apply, including the contrast and screening time used so far.",
        },
        { kind: "video", id: "CdBNiNmilgQ", note: "Manual of PCI chapter 7.3: PCI timing, lesion selection and sequence." },
        { kind: "video", id: "V4IaG-MUBV0", note: "Case: staged culprit and non-culprit PCI." },
        { kind: "video", id: "Wmw8eE8LSuw", note: "Case: ad hoc left main PCI." },
        {
          kind: "keypoints",
          items: [
            "Ad hoc PCI saves a second procedure but adds contrast and radiation and shortens planning and consent; it is the default in ACS with active ischaemia.",
            "Defer for complex anatomy, dose, place, inadequate consent, uncertain symptoms or ischaemia, complications, fatigue, scheduling, poor preparation or patient preference.",
            "Brilakis advises against ad hoc CTO PCI in most cases; in three-vessel disease with equal PCI and CABG recommendations, the 2024 ESC guideline says no ad hoc PCI.",
            "Stage the rest for complexity, no active ischaemia, dose, complications or fatigue.",
            "Culprit first in ACS; distal first within a vessel unless the proximal lesion damps, causes ischaemia or blocks devices; every significant lesion in the working vessel in one sitting.",
            "Around the left main: branch lesions before a non-critical left main, and consider the RCA first.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-culprit",
      title: "Finding the culprit in an acute coronary syndrome",
      minutes: 15,
      topics: ["dec-acs-culprit"],
      sources: [
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "20.1" },
        { book: "brilakis-pci", loc: "20.4" },
        { book: "brilakis-pci", loc: "20.5" },
        { book: "brilakis-pci", loc: "20.7" },
        { book: "brilakis-pci", loc: "20.8" },
        { book: "brilakis-pci", loc: "20.9" },
        { book: "brilakis-pci", loc: "20.10" },
        { book: "brilakis-pci", loc: "20.11" },
        { book: "brilakis-pci", loc: "20.12" },
        { book: "brilakis-pci", loc: "20.13" },
        { book: "brilakis-pci", loc: "20.14" },
        { book: "brilakis-pci", loc: "12.1" },
        { book: "brilakis-pci", loc: "13.1" },
        { book: "brilakis-pci", loc: "24.2" },
        { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
        { book: "oxford-cath", loc: "ch 8: Pressure wire" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI" },
      ],
      refs: [...BOOKS, "licordari-esc-acs-2024", "oat-2006"],
      blocks: [
        {
          kind: "p",
          text: "The culprit is the lesion causing the patient's symptoms and the acute syndrome. In an ACS it is treated first. Often it is obvious, an occluded artery full of thrombus, but sometimes nothing looks acute and sometimes two or three lesions compete for the title. Treating the wrong one exposes the patient to all the risk of PCI and leaves the real cause untouched.",
        },
        {
          kind: "steps",
          title: "Before the first run: clues from the history (Brilakis 20.1)",
          items: [
            { title: "Previous stent", detail: "A STEMI in a patient with a stent may be stent thrombosis." },
            { title: "Previous CABG", detail: "Knowing the graft anatomy speeds up the diagnostic study." },
            { title: "Recent pregnancy", detail: "A postpartum STEMI may be a spontaneous coronary artery dissection." },
            { title: "Recent emotional stress", detail: "In women this may point to stress (takotsubo) cardiomyopathy, but angiography is often still needed to exclude other causes." },
            { title: "Earlier tests", detail: "Earlier non-invasive tests can indicate the likely culprit territory, and earlier angiograms show which lesions are new." },
            { title: "Heart, kidneys and drugs", detail: "A known low ejection fraction raises the risk of cardiogenic shock in an ACS. Note renal failure, diabetes and any planned future surgery, and find out which antithrombotic drugs have already been given. Haemodynamic support is more often needed in ACS than in stable angina, because of the myocardial injury." },
          ],
        },
        { kind: "h", text: "The STEMI engagement sequence" },
        {
          kind: "p",
          text: "Whether to engage the suspected culprit straight away with a guide or to complete diagnostic angiography of both arteries first is often debated. Going straight to the culprit cuts 8–13 minutes from the door-to-balloon time. The catch: if the culprit is in the RCA and you stent it without having seen the left coronary artery, you may miss significant left main or multivessel disease in a patient who needs haemodynamic support, or who would be better served by CABG, in which case balloon angioplasty of the culprit without a stent may be preferable. Brilakis's recommended sequence resolves this:",
        },
        {
          kind: "steps",
          title: "Brilakis's recommended engagement order in STEMI",
          items: [
            { title: "Anterior STEMI", detail: "Engage the left main with the guide catheter, treat the culprit, then perform diagnostic angiography of the RCA." },
            { title: "Non-anterior STEMI", detail: "Start with diagnostic angiography of the left coronary artery. If the culprit is there, follow the anterior sequence: engage the left main with a guide, treat the culprit, then perform diagnostic angiography of the RCA." },
            { title: "Culprit not in the left", detail: "Engage the RCA with the guide and treat the culprit, now knowing the left coronary anatomy." },
            { title: "Access", detail: "Radial access is generally preferred in ACS, especially STEMI, because earlier studies showed less bleeding and lower mortality, although SAFARI-STEMI found no difference in clinical outcomes between femoral and radial access. Femoral access is preferred after CABG, because grafts are often hard to engage from the radial. If radial engagement is delaying reperfusion (for example with an aberrant right subclavian artery), convert promptly to femoral." },
          ],
        },
        {
          kind: "table",
          caption: "Signs that a lesion is the culprit (Brilakis 7.2.1a, 20.7 and 13.1.1; Oxford IVUS or OCT?)",
          head: ["Source", "What favours a culprit"],
          rows: [
            ["ECG", "The artery supplies the territory with ST elevation"],
            ["Wall motion", "The artery supplies hypokinetic or akinetic myocardium on left ventriculography or echocardiography"],
            ["Lumen", "Thrombus; luminal haziness suggesting thrombus; contrast staining"],
            ["Flow", "Slow antegrade flow"],
            ["Collaterals", "Poor or absent collaterals (a recent occlusion has had no time to recruit them)"],
            ["Distal bed", "Occluded distal branches, suggesting embolism"],
            ["Wire behaviour", "The lesion is easy to wire"],
            ["Intravascular imaging", "Plaque rupture, ulceration or erosion, thrombus, or a calcified nodule (OCT preferred for its resolution)"],
          ],
        },
        {
          kind: "check",
          stem: "A 66-year-old has an NSTEMI. The ECG shows non-localising ST depression; echo shows lateral hypokinesis. The RCA is occluded mid-vessel with a tapered stump and well-developed bridging and left-to-right collaterals. The circumflex has a 90% hazy lesion with TIMI 2 flow. Which is the culprit?",
          options: [
            "The circumflex lesion: haze, slow flow and matching wall motion",
            "The RCA occlusion, because a total occlusion is always the culprit",
            "Neither: with two candidate lesions, treat both at once",
            "Cannot be decided until FFR has been measured in both arteries",
          ],
          answer: 0,
          explanation:
            "The circumflex lesion has the culprit features: luminal haziness, slow flow and a wall-motion territory that matches. ST depression does not localise the culprit: the manuals' ECG criterion is the territory of ST elevation, so here wall motion, the angiographic features and, if needed, OCT do the work. Well-developed collaterals suggest the RCA occlusion is chronic. Physiology should not be used on a suspected culprit, because the microcirculation is injured in an ACS, so FFR cannot settle the question.",
        },
        {
          kind: "steps",
          title: "No obvious culprit: the work-up (Brilakis 7.2.10–7.2.12 and 20.7)",
          items: [
            { title: "1. Look again, carefully", detail: "Staining and thrombus can be subtle. Review every run, and earlier angiograms if you have them, against the ECG." },
            { title: "2. Left ventriculography or echo in the lab", detail: "Shows the hypokinetic territory, which points to the culprit artery; suggests other diagnoses such as takotsubo or myocarditis; and reveals mechanical complications such as papillary muscle rupture, free-wall rupture or a ventricular septal defect." },
            { title: "3. Intravascular imaging, OCT preferred", detail: "OCT's higher resolution makes it the modality of choice for finding, or excluding, a culprit: thrombus and plaque rupture are the findings to look for, and some culprits show only erosion. The Oxford handbook lists plaque rupture and plaque erosion as the OCT signs of the culprit." },
            { title: "4. Cardiac MRI later", detail: "If the culprit is still unclear, MRI can show where the myocardium was injured and so which artery was responsible, or suggest another diagnosis such as myocarditis." },
            { title: "Remember", detail: "Some patients have no culprit because the syndrome is not ischaemic (takotsubo). Others have more than one culprit, though few patients in cardiogenic shock have more than one that needs treatment." },
          ],
        },
        {
          kind: "list",
          items: [
            "**Do not use physiology on the culprit.** Brilakis: pressure-wire assessment should not guide decisions in culprit or suspected culprit lesions, because of microcirculatory injury; use intracoronary imaging instead. Oxford: avoid FFR in the STEMI culprit vessel. Non-culprit lesions can be assessed with physiology, because the measurements change little over time. In cardiogenic shock, FFR may be inaccurate because it depends on coronary afterload.",
            "**When the wire will not cross the ‘culprit’.** Work through the soft-wire sequence below first. If it still fails, ask whether this is the culprit at all: it may be a chronic total occlusion, or there may be more than one culprit. Review the angiogram and earlier films again and correlate the ECG with the angiogram. Image the other candidate lesions with OCT (the best modality for thrombus): finding thrombus or ulceration makes a culprit very likely. Aspirating thrombus can reveal the anatomy beyond the occlusion and whether the wire is in a side branch.",
            "**Current guidance:** the 2023 ESC ACS guideline gives intravascular imaging, especially OCT, a class IIb recommendation to clarify ambiguous culprit lesions, and recommends cardiac MRI after angiography when a diagnosis of MINOCA remains uncertain (class I), as summarised in a published appraisal of the guideline.",
          ],
        },
        {
          kind: "steps",
          title: "Wiring an acute occlusion (Brilakis 20.8)",
          items: [
            { title: "Why it is different", detail: "Thrombus hides the vessel beyond the occlusion, and a recent occlusion has had no time to grow collaterals that would show it. You cannot see angulation inside the occluded segment or tell whether the wire has gone into a side branch, and a balloon pushed over a wire that has left the vessel can perforate it." },
            { title: "1. Soft workhorse wire, no hydrophilic tip", detail: "The first attempt, to keep the perforation risk low. Sometimes the wire alone restores some flow, which helps everything that follows." },
            { title: "2. Soft wire with a hydrophilic tip", detail: "If the workhorse wire will not advance through the occlusion." },
            { title: "3. Soft polymer-jacketed wire", detail: "The usual next step if the workhorse wires fail. Avoid stiffer polymer-jacketed wires if you can: they raise the perforation risk, though a difficult lesion occasionally needs one." },
            { title: "Extra support", detail: "Pushing the wire forward with a microcatheter, or a 1.0–1.5 mm balloon, behind it adds support and lets you exchange wires without losing position. A knuckled wire can pass tortuous segments with low (not zero) perforation risk but may need strong guide support, such as a guide extension." },
            { title: "Confirm the wire position before ballooning", detail: "If you are unsure where the tip is, do not advance a balloon yet. With no antegrade flow at all, a second arterial access and a contralateral injection may show the vessel through collaterals. Avoid injecting contrast down a microcatheter or an over-the-wire balloon, because a tip sitting under the intima would extend the dissection. IVUS can confirm the wire is in the lumen. Gentle ‘dottering’ with a small short balloon may restore enough flow to show the wire, but it does not reliably prove a true-lumen position." },
          ],
        },
        {
          kind: "check",
          stem: "During primary PCI for an inferior STEMI, a soft workhorse wire will not advance through an abrupt, hazy mid-RCA occlusion without collaterals. The patient has ongoing pain and inferior ST elevation. What next?",
          options: [
            "Escalate straight to a stiff polymer-jacketed wire to force a way through",
            "Measure FFR in the RCA first to confirm that the occlusion is significant",
            "Change to a soft hydrophilic-tipped wire, then a soft polymer-jacketed one",
            "Abandon PCI and refer the patient straight on for emergency bypass surgery",
          ],
          answer: 2,
          explanation:
            "Everything here fits an acute RCA culprit: the ECG territory, ongoing pain, haziness and no collaterals. So keep wiring, following Brilakis's sequence: a soft wire with a hydrophilic tip, then a soft polymer-jacketed wire. Stiffer polymer-jacketed wires raise the perforation risk and should be avoided where possible. Reconsidering the target becomes the question when the soft-wire sequence fails, or when the occlusion looks chronic (for example, bridging collaterals) or does not match the ECG territory. Physiology has no place in a suspected culprit.",
        },
        {
          kind: "list",
          items: [
            "**After the wire crosses: thrombus.** Brilakis's thrombus algorithm (Fig. 20.2) and its steps are taught in cp-acs-thrombus. In outline: if flow is restored but a large thrombus remains, one option is to defer further intervention for 24–48 hours of intense antithrombotic therapy and repeat the angiogram; if you proceed because of ongoing symptoms or high-risk plaque, consider thrombectomy, a filter or laser before more ballooning and stenting, although routine thrombectomy is not supported by randomised trials.",
            "**Stent or not?** Stenting is usually delayed until after thrombectomy when the thrombus is large. Where aspiration alone leaves an excellent result, especially in a small vessel, observation without a stent has been advocated in selected patients (cp-acs-thrombus).",
            "**Access and closure.** Radial access is an advantage in ACS because potent antithrombotic regimens raise bleeding risk. With femoral access in a patient whose haemodynamics are borderline, the sheath is sometimes left for a few hours in case a support device is needed, at the cost of more bleeding.",
          ],
        },
        { kind: "tip", id: "diag-stemi-engagement-order" },
        { kind: "tip", id: "diag-culprit-not-obvious" },
        { kind: "tip", id: "pci-wire-fails-wrong-vessel" },
        { kind: "tip", id: "pci-no-physiology-in-culprit" },
        { kind: "tip", id: "pci-oct-unclear-culprit" },
        {
          kind: "pitfalls",
          items: [
            "Stenting an RCA culprit in a STEMI without having seen the left coronary artery, then finding left main disease that needed surgery or support.",
            "Calling a chronic occlusion with collaterals the culprit because it is the most dramatic lesion on the screen.",
            "Measuring FFR in a suspected culprit: the injured microcirculation makes the value unreliable.",
            "Stopping at ‘no culprit’ without a ventriculogram or echo, imaging, and a plan for MRI.",
            "Treating a late, stable, occluded infarct artery out of reflex: the Oxford handbook notes no benefit from reperfusion in stable STEMI patients more than 48 hours after pain onset (OAT).",
          ],
        },
        {
          kind: "pearl",
          text: "Say the ECG territory aloud before you engage. Predicting the culprit from the ECG first, then confirming it on the angiogram, protects you from being captured by the most impressive lesion, and it tells you at once when the angiogram does not fit the story.",
        },
        {
          kind: "drill",
          target: "angio-real",
          drill: "locate",
          task: "Find the lesion in each run. Then, before revealing the answer, say which features you would use to call it a culprit in an ACS (thrombus or haze, staining, slow flow, absent collaterals, distal emboli) and which features suggest a chronic lesion.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Take the LCx STEMI scenario. Before engaging, state the ECG territory and the engagement order you will use for a non-anterior STEMI; after the diagnostic runs, name the culprit and the features that identify it before you wire.",
        },
        { kind: "video", id: "p0OmzHpuoq8", note: "Manual of PCI chapter 7.2: finding the ACS culprit." },
        { kind: "video", id: "mzIP07Vc-Og", note: "Manual of PCI chapter 20.1: PCI in ACS patients." },
        { kind: "video", id: "NkXfgmUCW-A", note: "Case: STEMI culprit?" },
        { kind: "video", id: "VRqERXKp-rU", note: "Case: MRI and OCT to find an NSTEMI culprit." },
        {
          kind: "keypoints",
          items: [
            "The culprit causes the syndrome and is treated first.",
            "Anterior STEMI: guide into the left main first, RCA angiography after. Non-anterior: diagnostic left angiography first, then guide into whichever artery holds the culprit.",
            "Culprit features: matching ECG and wall motion, thrombus or haze, staining, slow flow, few collaterals, distal emboli, easy wiring, rupture or erosion on OCT.",
            "No obvious culprit: review again, ventriculogram or echo, OCT, then MRI.",
            "Acute occlusion: soft workhorse wire, then soft hydrophilic-tipped, then soft polymer-jacketed; avoid stiff polymer-jacketed wires where possible. If that fails or the lesion does not fit the ECG, ask whether it is a chronic occlusion rather than the culprit.",
            "No physiology in the culprit; non-culprit lesions can be assessed with it.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-nste",
      title: "NSTE-ACS: how soon, and what to decide on the table",
      minutes: 11,
      topics: ["acs-nste-timing"],
      sources: [
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "7.3" },
        { book: "brilakis-pci", loc: "7.4" },
        { book: "brilakis-pci", loc: "3.5" },
        { book: "brilakis-pci", loc: "18.7" },
        { book: "oxford-cath", loc: "ch 1: Indications for coronary angiography" },
      ],
      refs: [...BOOKS, "licordari-esc-acs-2024", "biscaglia-fire-2023", "bohm-full-revasc-2024", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "In non-ST-elevation ACS (NSTEMI and unstable angina) the question is less whether to go to the lab than how soon, and what to do once you are there. The manuals frame it around one finding: whether ischaemia is still going on. The guideline timing tables are taught in mcs-arrest-nste and fnd-pathways; this lesson adds the manuals' decision logic and what has changed in the 2023 guideline.",
        },
        {
          kind: "steps",
          title: "The decision, step by step",
          items: [
            { title: "1. Is there ongoing ischaemia?", detail: "NSTE-ACS with ongoing chest pain is, like STEMI, a case of active ischaemia: Brilakis indicates immediate PCI of the culprit. Ad hoc PCI is needed in most such cases, because CABG would mean delay." },
            { title: "2. Find the culprit", detail: "Use the criteria of the previous lesson. Brilakis's ECG criterion is the territory of ST elevation, and ST depression does not localise the culprit, so in NSTE-ACS that criterion is usually unavailable. That leaves the others: wall motion, thrombus or haze, staining, flow, collaterals and ease of wiring, with OCT when the culprit is unclear." },
            { title: "3. No ongoing ischaemia: work the algorithm", detail: "Extent of disease, previous CABG, diabetes, surgical candidacy, complexity, benefit against risk and patient preference all apply exactly as in stable disease, but the decision is more urgent because delayed revascularisation can cause harm." },
            { title: "4. Complex anatomy without active ischaemia", detail: "Brilakis favours delayed PCI here, which leaves time for the heart team and a planned procedure." },
            { title: "5. Think about surgery before loading", detail: "Brilakis notes that STEMI patients usually arrive preloaded with an oral P2Y12 inhibitor, which raises bleeding if emergency CABG follows. In NSTE-ACS he does not pretreat with a P2Y12 inhibitor before the anatomy is known; for stable patients he gives it once PCI is planned." },
            { title: "6. If the culprit is an RCA, see the left first", detail: "Before stenting an RCA culprit, know the left coronary anatomy: left main or multivessel disease may call for haemodynamic support or CABG, and then balloon angioplasty of the culprit without a stent may be the better first move." },
          ],
        },
        {
          kind: "table",
          caption: "Unstable coronary syndromes: class 1 indications for angiography in the ACC/AHA list reproduced by the Oxford handbook",
          head: ["Clinical situation", "Our reading of the item (not stated in the handbook)"],
          rows: [
            ["High or intermediate risk with angina refractory to adequate initial medical therapy, or recurring after stabilisation", "Ongoing or recurrent ischaemia despite treatment"],
            ["High risk for an adverse outcome", "Risk alone justifies angiography"],
            ["High- or intermediate-risk unstable angina that settles with initial treatment", "Stabilising does not remove the underlying risk"],
            ["Low short-term risk at first, high risk on later non-invasive testing", "Testing has reclassified the patient"],
          ],
        },
        {
          kind: "p",
          text: "**What changed in 2023.** The 2023 ESC ACS guideline merged STEMI and NSTE-ACS into one document. It now gives an early invasive strategy (within 24 hours) a class IIa recommendation for patients with a confirmed NSTEMI diagnosis, dynamic ST-segment or T-wave changes, transient ST elevation or a GRACE score above 140; the previous NSTE-ACS guideline made it class I. The appraisal of the guideline links the downgrade to logistics and to a meta-analysis in which early invasive treatment reduced recurrent ischaemia and rehospitalisation without improving hard endpoints. Routine P2Y12 pretreatment before the anatomy is known is not recommended when early (within 24 hours) angiography is planned; it may be considered (class IIb) when angiography is expected later than 24 hours.",
        },
        {
          kind: "check",
          stem: "A 74-year-old with an NSTEMI has had no pain for 18 hours on medical therapy. Angiography shows three-vessel disease with an identifiable circumflex culprit; she has diabetes and is a reasonable surgical candidate. What does Brilakis's approach suggest?",
          options: [
            "Ad hoc PCI of all three vessels now, because ACS always requires immediate revascularisation",
            "Ad hoc PCI of the circumflex culprit, then leave the other vessels on medical therapy permanently",
            "Discharge on medical therapy, since NSTE-ACS without pain has no indication for revascularisation",
            "Delay PCI: no active ischaemia and complex anatomy, so the heart team reviews the modality",
          ],
          answer: 3,
          explanation:
            "Brilakis favours delayed PCI in ACS patients without active ischaemia who have complex anatomy, and the modality questions apply as in stable disease, with diabetes and multivessel disease pointing towards CABG in a good surgical candidate. The decision is more urgent than in stable disease, but there is time for the heart team. Ad hoc PCI is the default only when ischaemia is ongoing.",
        },
        { kind: "h", text: "After the culprit in NSTE-ACS" },
        {
          kind: "list",
          items: [
            "Brilakis's ACS algorithm continues after culprit PCI: if there are other lesions, they go through the same modality questions, and if the patient is not in cardiogenic shock they can be treated at the same sitting or staged. In shock: stop after the culprit (lesson 7).",
            "**2023 ESC guideline:** in NSTE-ACS with multivessel disease, complete revascularisation should be considered, preferably during the index procedure (class IIa, level C; the 2020 guideline gave index-procedure completion only IIb). In cardiogenic shock the 2023 guideline recommends culprit-only PCI (class I), with staged non-culprit PCI to be considered (class IIa, level C); the 2020 NSTE-ACS guideline had already advised against routine immediate non-culprit PCI in shock (class III).",
            "FIRE randomised 1,445 patients aged 75 or over with myocardial infarction and multivessel disease (about a third with STEMI) to physiology-guided complete revascularisation or culprit-only PCI. Complete revascularisation lowered death, myocardial infarction, stroke or any revascularisation at 1 year (15.7% against 21.0%), with no apparent difference in kidney injury, stroke or bleeding.",
            "FULL REVASC, in contrast, randomised 1,542 patients with STEMI or very-high-risk NSTEMI and multivessel disease: FFR-guided complete revascularisation did not lower death, myocardial infarction or unplanned revascularisation compared with culprit-only PCI over a median of 4.8 years (19.0% against 20.4%). Read it with care: the trial was framed as a STEMI question and enrolled patients at primary PCI of the culprit, so its neutral result says at least as much about STEMI as about NSTEMI. For multivessel NSTE-ACS the 2023 ESC recommendation for complete revascularisation remains class IIa, level C.",
            "Vein-graft ACS: Brilakis prefers PCI of the native artery supplied by a failing vein graft when that is easily done, and accepts ad hoc treatment of a native CTO in an ACS caused by a failing, heavily diseased graft (taught in cp-prior-cabg).",
          ],
        },
        {
          kind: "check",
          stem: "An 81-year-old with an NSTEMI has a circumflex culprit treated and a 75% mid-LAD lesion. He is stable. Which statement is supported by the FIRE trial?",
          options: [
            "Complete revascularisation lowered the 1-year composite of ischaemic events",
            "Age over 75 is a reason to leave non-culprit lesions alone to limit kidney injury",
            "Complete revascularisation lowered mortality but doubled major bleeding",
            "FIRE only included STEMI, so its result does not apply to an NSTEMI patient",
          ],
          answer: 0,
          explanation:
            "FIRE enrolled patients aged 75 or over with myocardial infarction and multivessel disease, most of them without ST elevation, and physiology-guided complete revascularisation reduced the 1-year composite (15.7% against 21.0%). The safety composite of kidney injury, stroke or bleeding did not appear to differ, so age alone is not a reason to stop at the culprit.",
        },
        { kind: "tip", id: "pci-acs-culprit-first" },
        {
          kind: "pitfalls",
          items: [
            "Letting a pain-free NSTE-ACS patient with complex anatomy drift into ad hoc multivessel PCI without considering surgery.",
            "Missing ongoing ischaemia: recurrent or refractory pain turns an NSTE-ACS into an immediate case.",
            "Loading a P2Y12 inhibitor before the anatomy is known when early angiography is planned, then finding a surgical patient.",
            "Assuming older age rules out complete revascularisation.",
          ],
        },
        {
          kind: "pearl",
          text: "The single most useful question in NSTE-ACS is ‘is this patient ischaemic now?’. Yes makes it a culprit-first emergency; no buys time to think about the whole coronary tree, the surgeon and the patient's wishes.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Run the full procedure as an NSTE-ACS. Before the puncture, decide whether ischaemia is ongoing and therefore whether ad hoc PCI is the default, or whether a complex angiogram would lead you to stop and plan.",
        },
        { kind: "video", id: "4zVZl0Mx3Ys", note: "Case: a ‘routine’ NSTEMI." },
        { kind: "video", id: "QyVowJ3GHSU", note: "Case: NSTEMI in an elderly patient." },
        { kind: "video", id: "j5fLkQ4EBpk", note: "NSTEMI angiographic and PCI tips (Elias Hanna)." },
        { kind: "video", id: "AcSgEXGX6RM", note: "NSTEMI (Elias Hanna)." },
        {
          kind: "keypoints",
          items: [
            "Ongoing ischaemia (such as continuing chest pain) makes NSTE-ACS an immediate culprit PCI, done ad hoc.",
            "Without active ischaemia, the stable-disease modality questions apply, more urgently; complex anatomy favours delayed PCI.",
            "Brilakis does not pretreat NSTE-ACS with a P2Y12 inhibitor; the 2023 ESC guideline advises against routine pretreatment when early angiography is planned, with a IIb option if angiography will be later than 24 hours.",
            "2023 ESC: early (under 24 h) invasive strategy for high-risk NSTE-ACS is now class IIa.",
            "Other lesions after the culprit: same sitting or staged unless the patient is in shock; 2023 ESC: complete revascularisation should be considered in multivessel NSTE-ACS, preferably at the index procedure (IIa C).",
            "FIRE (age 75 or over) favoured physiology-guided complete revascularisation; FULL REVASC did not show a benefit of FFR-guided completion.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-target-multivessel-stemi",
      title: "STEMI with multivessel disease: culprit only or complete",
      minutes: 14,
      topics: ["dec-multivessel-stemi"],
      sources: [
        { book: "brilakis-pci", loc: "7.2" },
        { book: "brilakis-pci", loc: "7.3" },
        { book: "brilakis-pci", loc: "20.5" },
        { book: "brilakis-pci", loc: "20.7" },
        { book: "brilakis-pci", loc: "20.12" },
        { book: "brilakis-pci", loc: "24.2" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI in multivessel disease" },
        { book: "oxford-cath", loc: "ch 8: Primary PCI in cardiogenic shock" },
        { book: "oxford-cath", loc: "ch 8: Multivessel PCI" },
      ],
      refs: [...BOOKS, "complete-2019", "multistars-ami-2023", "culprit-shock-2017", "bohm-full-revasc-2024", "licordari-esc-acs-2024", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Nearly half of STEMI patients have disease in more than one artery (Oxford), and about two thirds of patients with infarct-related cardiogenic shock do (Brilakis). Once the culprit is open, you must decide what to do about the bystander lesions: treat them now, treat them later, or leave them. The answer is different in the stable patient and the patient in shock.",
        },
        {
          kind: "table",
          caption: "The four trials the Oxford handbook summarises, and how they defined and timed non-culprit PCI",
          head: ["Trial", "Which non-culprit lesions", "When"],
          rows: [
            ["PRAMI", "Angiographic stenosis above 50%", "At the primary PCI"],
            ["CvLPRIT", "Angiographic stenosis above 70%", "At the primary PCI or later in the same admission"],
            ["DANAMI-PRIMULTI", "FFR 0.80 or less", "Staged, same admission"],
            ["COMPARE-ACUTE", "FFR 0.80 or less", "At the primary PCI or later in the same admission"],
          ],
        },
        {
          kind: "p",
          text: "The handbook's reading of these four trials: complete revascularisation in STEMI gives a prognostic benefit, but one driven mainly by fewer repeat revascularisations rather than by better survival or fewer myocardial infarctions; and because immediate and staged strategies had not been compared, the guidelines of the time asked for completeness before discharge.",
        },
        {
          kind: "list",
          items: [
            "**COMPLETE** (published after those trials; 4,041 patients with STEMI and multivessel disease after successful culprit PCI): PCI of angiographically significant non-culprit lesions reduced cardiovascular death or myocardial infarction over a median of 3 years (7.8% against 10.5%), and the benefit held whether the non-culprit PCI was planned during or after the index admission. Brilakis cites COMPLETE and says complete revascularisation improves hard outcomes. The two books therefore differ: Oxford's summary does not include COMPLETE and reflects the 2017–2018 guidelines.",
            "**MULTISTARS AMI** (840 haemodynamically stable STEMI patients): immediate multivessel PCI was non-inferior, and on testing also superior, to staged PCI 19–45 days later for a composite of death, myocardial infarction, stroke, unplanned ischaemia-driven revascularisation or heart-failure admission at 1 year (8.5% against 16.3%), driven by fewer myocardial infarctions and unplanned revascularisations in the immediate group.",
            "**Current guidance:** the 2023 ESC ACS guideline recommends complete revascularisation in STEMI with multivessel disease, either during the index procedure or within 45 days (class I, upgraded from IIa), with PCI of non-infarct arteries based on angiographic severity (class I). As summarised in the appraisal, FFR guidance of non-culprit lesions did not beat angiographic guidance in FLOWER-MI, while FRAME-AMI favoured FFR but stopped early with fewer patients than planned.",
            "**Angiography or physiology for the non-culprit lesions?** The sources do not agree, so know both. Brilakis accepts physiology in non-culprit lesions because the measurements change little over time. The 2023 ESC guideline bases non-infarct-artery PCI on angiographic severity (class I), and the published appraisal reads this as advising against FFR during the index STEMI procedure. FFR guidance did not beat angiographic guidance in FLOWER-MI. FULL REVASC asked a different question: in 1,542 patients with STEMI or very-high-risk NSTEMI, FFR-guided complete revascularisation did not reduce death, myocardial infarction or unplanned revascularisation compared with culprit-only PCI over a median of 4.8 years. Angiographic guidance is therefore the default; the culprit itself is never assessed with a pressure wire.",
          ],
        },
        {
          kind: "check",
          stem: "A 62-year-old with an inferior STEMI has the RCA culprit stented with TIMI 3 flow. He is stable and pain free. The LAD has an 80% mid-vessel stenosis. Contrast so far is 140 mL, his eGFR is normal and the case has been quick. Which plan follows the evidence?",
          options: [
            "Culprit-only PCI, with the LAD left on medical therapy and reviewed only if angina recurs",
            "No further PCI in this admission, then a stress test at 3 months to decide",
            "Complete revascularisation of the LAD, now or staged within 45 days",
            "Measure FFR in the treated RCA segment to decide whether more PCI is needed",
          ],
          answer: 2,
          explanation:
            "In a stable STEMI patient with multivessel disease, complete revascularisation reduced cardiovascular death or MI in COMPLETE, and the 2023 ESC guideline recommends it during the index procedure or within 45 days, guided by angiographic severity. With no reason to stage (little contrast, normal kidneys, a quick case), doing it now is reasonable, and MULTISTARS AMI supports immediate PCI in stable patients. Culprit-only PCI is the strategy for shock, not for this patient.",
        },
        { kind: "h", text: "Cardiogenic shock: the exception" },
        {
          kind: "list",
          items: [
            "CULPRIT-SHOCK randomised 706 patients with myocardial infarction, cardiogenic shock and multivessel disease. At 30 days, death or renal-replacement therapy occurred in 45.9% after culprit-only PCI (with the option of staged non-culprit PCI) against 55.4% after immediate multivessel PCI; the relative risk of death alone was 0.84.",
            "Both books, and the 2023 ESC guideline (class I), recommend culprit-only PCI in the acute setting of infarct-related cardiogenic shock. Staged revascularisation of the non-culprit lesions can follow if needed (class IIa, level C in the 2023 guideline). The 45-day window comes from the trials in stable STEMI patients (COMPLETE, MULTISTARS AMI); no time window is set after shock, so the staged procedure is timed to the patient's recovery.",
            "In Brilakis's ACS algorithm the shock question comes straight after culprit PCI: no shock, treat other lesions at once or staged; shock, stop and consider staged PCI later.",
          ],
        },
        {
          kind: "steps",
          title: "After the culprit is open: the decision sequence",
          items: [
            { title: "1. Is the patient in cardiogenic shock?", detail: "Yes: stop after the culprit, support the circulation (taught in pm-support-choice) and plan any non-culprit PCI later." },
            { title: "2. Is the anatomy one that might need surgery?", detail: "Significant left main or complex multivessel disease raises the question of CABG and of haemodynamic support. This is why Brilakis wants the left coronary anatomy known before an RCA culprit is stented." },
            { title: "3. List the non-culprit lesions", detail: "Judge them by angiographic severity, the guideline default. Physiology is valid in a non-culprit lesion (Brilakis), but FFR guidance has not outperformed angiographic guidance (FLOWER-MI). Never measure the culprit." },
            { title: "4. Now or staged?", detail: "Use Brilakis's staging reasons: complex remaining lesions, no active ischaemia from them, high contrast or radiation, a complication, operator or patient fatigue. Without any of these, immediate completion is reasonable." },
            { title: "5. Write the plan", detail: "Document which lesions remain, how they will be treated and when, and tell the patient. In a stable patient: at the index procedure or within 45 days. After shock: staged after recovery, timed individually, since the guideline sets no window." },
          ],
        },
        {
          kind: "check",
          stem: "A 70-year-old with an anterior STEMI is in cardiogenic shock (BP 78/50 mmHg on noradrenaline, lactate 6 mmol/L). The proximal LAD culprit has been stented with TIMI 3 flow. There are 90% lesions in the circumflex and RCA. What next?",
          options: [
            "Treat the circumflex and RCA now, because complete revascularisation improves perfusion in shock",
            "Stop after the culprit; manage shock and consider staged non-culprit PCI later",
            "Treat the circumflex now, since it is the larger territory, and stage the RCA",
            "Measure FFR in both non-culprit vessels and treat whichever is 0.80 or less",
          ],
          answer: 1,
          explanation:
            "In shock, culprit-only PCI at the index procedure reduced death or renal-replacement therapy at 30 days in CULPRIT-SHOCK, and it is the recommended strategy in both manuals and the 2023 ESC guideline. Staged revascularisation can follow later. The theoretical argument that more revascularisation improves perfusion is the one the trial tested and rejected. Brilakis also warns that FFR may be inaccurate in shock.",
        },
        { kind: "tip", id: "pci-shock-culprit-only" },
        { kind: "tip", id: "pci-stemi-nonculprit-plan" },
        {
          kind: "pitfalls",
          items: [
            "Doing immediate multivessel PCI in cardiogenic shock.",
            "Leaving a stable STEMI patient with significant non-culprit disease on culprit-only treatment without a plan.",
            "Pressure-wire measurement in the infarct artery, or relying on FFR in a patient in shock.",
            "Discharging a stable STEMI patient without a booked date for the staged procedure, so the 45-day window passes.",
            "Quoting the older trials' conclusion that complete revascularisation only reduces repeat procedures: COMPLETE showed fewer cardiovascular deaths or myocardial infarctions.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide the non-culprit plan before you take the guide out, while the whole tree is fresh on the screen and the patient's state is in front of you. A plan written then is far more likely to be carried out than one left for the ward round.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "Assess an intermediate non-culprit lesion with the pressure wire as if after a STEMI, and state why the same measurement would not be valid in the culprit artery.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Take the LCx STEMI scenario. After the culprit is treated, decide whether the patient is stable, list any non-culprit lesions and say whether you would treat them now or stage them within 45 days, giving your reason.",
        },
        { kind: "video", id: "V4IaG-MUBV0", note: "Case: staged culprit and non-culprit PCI." },
        { kind: "video", id: "36JzHvjGfLE", note: "Case: CABG for STEMI." },
        { kind: "video", id: "alUicTA4Ay4", note: "Beta-blockers after MI and non-culprit PCI in MI: review and updates from ESC 2025 (Elias Hanna)." },
        { kind: "video", id: "_RETPg_jBvs", note: "Completeness of revascularisation: why and when? (Dallas CVI 2016 lecture)." },
        {
          kind: "keypoints",
          items: [
            "About half of STEMI patients, and about two thirds of those in shock, have multivessel disease.",
            "Stable STEMI: complete revascularisation (COMPLETE), during the index procedure or within 45 days (2023 ESC, class I), guided by angiographic severity.",
            "Immediate completion was non-inferior, and on testing superior, to staging at 19–45 days in MULTISTARS AMI; stage when Brilakis's reasons apply.",
            "Cardiogenic shock: culprit-only PCI acutely (CULPRIT-SHOCK), with staged PCI later if needed, timed to recovery.",
            "Angiographic severity guides non-culprit PCI (2023 ESC); physiology is valid in non-culprit lesions (Brilakis), but FFR guidance did not beat angiographic guidance in FLOWER-MI, and in FULL REVASC FFR-guided completion did not beat culprit-only PCI; never on the culprit, and unreliable in shock.",
            "Oxford's summary does not include COMPLETE and says the benefit came from fewer repeat procedures; COMPLETE showed fewer cardiovascular deaths or MIs.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-target-q1",
      stem: "A 66-year-old without diabetes has three-vessel disease, limiting angina and a SYNTAX score of 27 (intermediate). He is a good surgical candidate with normal LV function, and the interventionist thinks PCI could treat every lesion. How do Brilakis's table and the 2024 ESC guideline apply?",
      options: [
        "PCI and CABG are equivalent in both, because 27 is below the left main threshold of 33",
        "Brilakis's table: CABG above 22; 2024 ESC: PCI beside CABG if it is equally complete",
        "Both now say CABG only, because a three-vessel SYNTAX score above 22 rules out PCI entirely",
        "Medical therapy alone, because the ISCHEMIA trial showed no benefit from revascularisation",
      ],
      answer: 1,
      explanation:
        "Brilakis's Table 7.1 (from the 2018 ESC/EACTS guideline) gives PCI or CABG for three-vessel disease scoring 0–22 and CABG above 22. The 2024 ESC guideline, as quoted by the surgical societies that endorsed it, recommends PCI alongside CABG in patients without diabetes at low or intermediate complexity, but only if PCI can achieve similarly complete revascularisation; with equal recommendations he goes to the heart team, not ad hoc PCI. The 33 threshold belongs to the left main. He has limiting angina, so symptom relief is a valid goal whatever ISCHEMIA showed about events.",
      difficulty: 3,
      refs: [...BOOKS, "syntax-2009", "esc-revasc-2018", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025"],
    },
    {
      id: "pm-target-q2",
      stem: "During a radial angiogram for stable angina, a 60-year-old without diabetes is found to have isolated distal left main disease with a SYNTAX score of 24. The consent covered ‘angiography and PCI if needed’. LVEF is normal and she is a good surgical candidate. What is the correct next step?",
      options: [
        "Ad hoc left main PCI, because PCI and CABG give similar results at a score of 24",
        "Ad hoc PCI only if FFR of the left main is 0.80 or less, measured in the LAD",
        "Stop, then heart-team discussion and an informed choice between PCI and CABG",
        "Refer for CABG only, because elective left main PCI is a contraindicated procedure",
      ],
      answer: 2,
      explanation:
        "At an intermediate score in a good surgical candidate without diabetes, Brilakis says PCI and CABG give similar benefit and the decision belongs to the heart team with the patient's preference; unprotected left main disease is also first on his list of reasons to defer ad hoc PCI. Similar outcomes are a reason to discuss, not to proceed; an FFR result does not remove the reasons to defer; and elective left main PCI is not contraindicated.",
      difficulty: 3,
      refs: [...BOOKS, "excel-2016", "noble-2016"],
    },
    {
      id: "pm-target-q3",
      stem: "A woman with an NSTEMI has non-localising ST depression and anterior hypokinesis on echo. The RCA is occluded with a blunt stump, bridging collaterals and retrograde filling from the LAD. The LAD has a 70% hazy lesion with a filling defect. Which lesion should be treated, and why?",
      options: [
        "The RCA occlusion, because a total occlusion is the most severe lesion and so must be the culprit",
        "The LAD lesion: haze, a filling defect suggesting thrombus, and wall motion that matches",
        "Both at once, because an occlusion with collaterals counts as a second culprit lesion",
        "Neither until FFR has been measured in both, to find which one limits flow",
      ],
      answer: 1,
      explanation:
        "The LAD lesion carries the culprit features: luminal haziness and a filling defect suggesting thrombus, with hypokinesis in its territory. ST depression does not localise the culprit, so the ECG adds nothing here. A blunt stump with bridging collaterals and retrograde filling suggests a chronic RCA occlusion, which is not the culprit and, if anything, depends on the LAD. Physiology should not be used in a suspected culprit lesion.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-target-q4",
      stem: "A patient arrives with an anterior STEMI. Which engagement sequence does Brilakis recommend?",
      options: [
        "Engage the left main with a guide, treat the culprit, then perform RCA angiography",
        "Diagnostic angiography of both arteries first, then a guide into the culprit artery",
        "Engage the RCA first, since it may supply collaterals to the infarct territory",
        "Perform a left ventriculogram first to confirm the anterior wall is akinetic",
      ],
      answer: 0,
      explanation:
        "For anterior STEMI, Brilakis engages the left main with the guide catheter straight away, treats the culprit and then images the RCA, which saves time (immediate culprit engagement cuts 8–13 minutes from the door-to-balloon time). Starting with diagnostic angiography of the left is his sequence for non-anterior STEMI, where the culprit may lie in either artery.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-target-q5",
      stem: "In a stable patient, the LAD has a 95% ostial lesion that causes pressure damping with the guide, and a 90% mid-LAD lesion. Which sequence follows Brilakis's rules?",
      options: [
        "Mid-LAD first, because in serial lesions the distal lesion is always treated first",
        "Mid-LAD now and the ostial lesion staged, to limit contrast in one procedure",
        "Ostial LAD only, and reassess the mid-LAD lesion at a later procedure",
        "Ostial LAD first, because it damps the guide and limits device passage downstream",
      ],
      answer: 3,
      explanation:
        "The default is distal first, but Brilakis makes an exception when a proximal or ostial lesion causes severe damping or ischaemia, or will not let devices through. He also says all significant lesions in the same target vessel should be treated in one procedure, so neither staging option is the rule.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-target-q6",
      stem: "Which situation is on Brilakis's list of reasons to defer PCI after a diagnostic angiogram in a stable patient?",
      options: [
        "A single focal lesion in a large vessel, with ischaemia already shown on stress testing",
        "A patient who is keen to have everything done today to avoid a second procedure",
        "Anatomy whose PCI risk is much higher than the risk discussed before the study",
        "An operator who is confident with the lesion and has the equipment in the room",
      ],
      answer: 2,
      explanation:
        "Inadequate informed consent, where the anatomy carries a much higher PCI risk than was discussed beforehand, is one of Brilakis's reasons to delay. A patient who prefers ad hoc treatment, a focal lesion with proven ischaemia, and an experienced operator with the right kit are all circumstances in which ad hoc PCI may be reasonable; patient preference counts as a reason to defer only when the patient wants to wait.",
      difficulty: 1,
      refs: [...BOOKS, "blankenship-ad-hoc-2013"],
    },
    {
      id: "pm-target-q7",
      stem: "What did CULPRIT-SHOCK show in myocardial infarction with cardiogenic shock and multivessel disease?",
      options: [
        "Immediate multivessel PCI reduced 30-day death, because treating every lesion improved perfusion",
        "There was no difference in outcome, so the choice depends on the contrast already given",
        "Culprit-only PCI lowered 30-day death or renal replacement against immediate multivessel PCI",
        "Culprit-only PCI reduced death but needed more mechanical circulatory support",
      ],
      answer: 2,
      explanation:
        "At 30 days, death or renal-replacement therapy occurred in 45.9% after culprit-only PCI against 55.4% after immediate multivessel PCI, and the relative risk of death alone was 0.84. Both manuals and the 2023 ESC guideline therefore recommend culprit-only PCI acutely, with staged PCI later if needed. The intuitive argument for more revascularisation in shock is exactly what the trial disproved.",
      difficulty: 2,
      refs: [...BOOKS, "culprit-shock-2017"],
    },
    {
      id: "pm-target-q8",
      stem: "After primary PCI of an LAD culprit, the operator wants to measure FFR in the treated LAD and in an intermediate RCA lesion. The patient is stable. Which is correct?",
      options: [
        "Both measurements are valid, because FFR is independent of the microcirculation",
        "Neither is valid in the acute phase, so all decisions must wait for a stress test",
        "The RCA reading is physiologically valid; the LAD culprit should not be assessed",
        "The LAD measurement is valid, because the new stent has restored normal flow down the culprit artery",
      ],
      answer: 2,
      explanation:
        "Brilakis and Oxford both advise against physiology in the infarct (culprit) vessel, because microcirculatory injury makes the reading unreliable. Brilakis states that non-culprit lesions can be assessed with physiology because the values change little over time, so the RCA reading is not invalid. For the decision, though, the 2023 ESC guideline bases non-culprit PCI on angiographic severity, its appraisal reads this as advising against FFR during the index STEMI procedure; FFR guidance did not beat angiographic guidance in FLOWER-MI, and in FULL REVASC FFR-guided completion did not beat culprit-only PCI.",
      difficulty: 2,
      refs: [...BOOKS, "licordari-esc-acs-2024", "bohm-full-revasc-2024"],
    },
    {
      id: "pm-target-q9",
      stem: "According to the Oxford handbook, which is an absolute contraindication to cardiac catheterisation?",
      options: [
        "Known allergy to radiographic contrast medium",
        "Acute kidney injury at the time of referral",
        "Uncontrolled hypertension on the day of the study",
        "Refusal of consent by the patient",
      ],
      answer: 3,
      explanation:
        "The handbook names refusal of consent as the only absolute contraindication. Contrast allergy, acute kidney injury and uncontrolled hypertension are on its list of relative contraindications, which are weighed against the urgency and value of the study.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-target-q10",
      stem: "A 58-year-old with hypertension is being assessed for aortic valve replacement for severe aortic stenosis. He has exertional breathlessness but no angina. According to the Oxford handbook, should his coronary arteries be imaged before surgery?",
      options: [
        "No, because without angina, coronary disease is unlikely to change how the valve operation is done",
        "No, because valve disease makes coronary angiography too risky in aortic stenosis",
        "Only if a stress test performed first is positive for ischaemia",
        "Yes, because he is over 40 with a cardiac risk factor and is symptomatic before valve surgery",
      ],
      answer: 3,
      explanation:
        "The handbook's guide is coronary angiography for all patients over 40 with one or more cardiac risk factors being assessed for valve surgery, because non-invasive tests are unreliable with significant valve disease and missed coronary disease changes surgical risk and the operation. A preliminary stress test is the weak link the handbook warns about, since valve disease makes non-invasive diagnosis of stenoses difficult.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-target-q11",
      stem: "The Oxford handbook concludes that complete revascularisation in STEMI gives a prognostic benefit mainly through fewer repeat revascularisations. Why does Brilakis state a stronger conclusion?",
      options: [
        "Because CULPRIT-SHOCK showed that complete revascularisation reduced death in cardiogenic shock",
        "Because COMPLETE later showed fewer cardiovascular deaths or myocardial infarctions",
        "Because PRAMI used FFR to select lesions, which reduced myocardial infarction",
        "Because MULTISTARS AMI showed staged PCI was better than immediate PCI",
      ],
      answer: 1,
      explanation:
        "Oxford summarises PRAMI, CvLPRIT, DANAMI-PRIMULTI and COMPARE-ACUTE, whose benefit came mainly from fewer repeat procedures. COMPLETE, published after those four trials and cited by Brilakis but not included in Oxford's summary, showed fewer cardiovascular deaths or myocardial infarctions (7.8% against 10.5%). CULPRIT-SHOCK favoured culprit-only PCI, PRAMI was angiography-guided, and MULTISTARS found immediate PCI non-inferior, and on testing superior, to staged PCI.",
      difficulty: 3,
      refs: [...BOOKS, "complete-2019", "multistars-ami-2023"],
    },
    {
      id: "pm-target-q12",
      stem: "A stable patient needs PCI of a non-critical distal left main stenosis, a severe proximal LAD lesion and a severe mid-RCA lesion. Which sequence does Brilakis suggest?",
      options: [
        "RCA first to make left main PCI safer, LAD lesion before the left main stent",
        "Left main first, so the LAD and RCA are treated with the left main protected by a stent",
        "LAD first, then left main, and leave the RCA to a staged procedure in all cases",
        "Left main and LAD in one sitting, the RCA last, because the RCA is the least important",
      ],
      answer: 0,
      explanation:
        "Brilakis advises treating significant RCA lesions first, because that makes the left main PCI safer, and, when the left main is not critical, stenting LAD and circumflex lesions before the left main because delivering equipment through a stented left main can be harder. Stenting the left main first makes downstream delivery harder, and staging the RCA routinely ignores the reason it is treated first.",
      difficulty: 3,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "procedure", task: "Before the puncture, state the indication and the presentation; at the hand-over to PCI, decide ad hoc or delayed PCI and name which of Brilakis's reasons to defer apply." },
    { sim: "physiology", task: "Assess an intermediate non-culprit lesion after a STEMI and explain why the culprit vessel is not assessed with the pressure wire." },
    { sim: "cathlab", task: "Rehearse the STEMI engagement order: for a non-anterior STEMI, image the left coronary artery with a diagnostic catheter first, then engage the culprit artery; for an anterior STEMI, go straight to the left main with the guide." },
  ],
  caseIds: ["pm-target-case-stable-3vd", "pm-target-case-inferior-stemi"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-target-case-stable-3vd",
    title: "Three-vessel disease found at a stable angiogram",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 1.1, 7.1 (Fig. 7.1, Fig. 7.2, Table 7.1), 7.3 and 7.4; Oxford Handbook, chapter 8 (indications for PCI, multivessel PCI)",
    },
    summary: "A diabetic man with limiting angina has three-vessel disease at angiography: the ad hoc decision, SYNTAX, the heart team, an informed refusal of surgery, sequence and staging.",
    presentation:
      "A 64-year-old man with type 2 diabetes has exertional angina that limits him despite two antianginal drugs. Stress echocardiography showed anterior and inferior ischaemia. He is booked for right radial angiography with possible PCI.",
    findings: ["Blood pressure 136/78 mmHg, sinus rhythm 68/min", "LVEF 50% on echo", "eGFR 62 mL/min/1.73 m²", "No previous angiography or surgery"],
    steps: [
      {
        id: "s0",
        prompt: "At the consent conversation before the angiogram, what do you discuss about possible PCI?",
        options: [
          {
            text: "Explain that a simple lesion might be treated on the day, but complex or multivessel anatomy would mean stopping and discussing PCI and surgery first",
            best: true,
            feedback: "Brilakis stresses discussing ad hoc PCI before an angiogram in a patient who has never had one. Agreeing in advance what will not be done ad hoc protects against the inadequate-consent problem that is one of his reasons to defer.",
          },
          {
            text: "A form that says ‘PCI as necessary’, without discussing what anatomy would change the plan",
            feedback: "Consent that does not anticipate complex findings becomes inadequate as soon as the angiogram shows anatomy with higher risk than was discussed.",
            stateDelta: { flags: ["thin-consent"] },
          },
          {
            text: "No discussion of PCI: he can be consented for that afterwards on the table if needed",
            feedback: "Consent on the table, sedated and supine, is not the considered discussion that ad hoc PCI requires.",
            stateDelta: { flags: ["thin-consent"] },
          },
        ],
      },
      {
        id: "s1",
        prompt: "The angiogram shows a right-dominant system, a normal left main, a 15 mm 80% proximal LAD stenosis ending before the first diagonal, a 12 mm 90% proximal circumflex stenosis and an 85% heavily calcified 25 mm mid-RCA lesion. 70 mL of contrast has been used. What now?",
        info: "He is comfortable and haemodynamically stable.",
        variants: [{ flag: "thin-consent", info: "The consent form reads ‘PCI as necessary’; multivessel disease and surgery were not discussed." }],
        options: [
          {
            text: "Stop. Explain the findings and refer to the heart team before any PCI",
            best: true,
            feedback: "Brilakis lists multivessel disease and inadequate consent among the reasons to defer ad hoc PCI, and in his algorithm diabetes with multivessel disease in a good surgical candidate leads to CABG. The 2024 ESC guideline recommends CABG over PCI in diabetes with three-vessel disease (class I), so ad hoc PCI would pre-empt the recommended option.",
          },
          {
            text: "Stent the proximal LAD now, since it is the most important lesion, and decide about the rest later",
            next: "c-adhoc",
            feedback: "Treating one vessel ad hoc in a patient who may need surgery commits him to a strategy before the heart team has met.",
            stateDelta: { stability: -10, flags: ["ad-hoc-lad"] },
          },
          {
            text: "Treat all three vessels now while access is in place",
            next: "c-adhoc",
            feedback: "Ad hoc three-vessel PCI in a diabetic patient, including a calcified RCA, without discussing surgery: complex anatomy, a high contrast load and inadequate consent all argue against it.",
            stateDelta: { stability: -20, flags: ["ad-hoc-lad"] },
          },
        ],
      },
      {
        id: "c-adhoc",
        kind: "consequence",
        prompt: "The LAD stent is in. Contrast is now 210 mL. Back on the ward the patient asks why nobody mentioned bypass surgery, which his brother had. What do you do now?",
        info: "Creatinine is checked the next day and is unchanged.",
        options: [
          {
            text: "Apologise, explain honestly, and take the remaining disease to the heart team before anything else is done",
            best: true,
            feedback: "The right recovery: the remaining decision (PCI or CABG for the circumflex and RCA) still belongs to the heart team and the informed patient.",
          },
          {
            text: "Book him for PCI of the circumflex and RCA next week without further discussion",
            feedback: "That repeats the original error: the modality decision has still not been made with the patient.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "At the heart-team meeting the SYNTAX score is worked out lesion by lesion (right dominance): proximal LAD, weight 3.5 × 2 = 7; proximal circumflex, 1.5 × 2 = 3; mid-RCA, 1 × 2 = 2, plus 2 for heavy calcium and 1 for length over 20 mm = 5. Total 15. How do you interpret it for him?",
        options: [
          {
            text: "Low complexity, but diabetes with multivessel disease in a fit patient still points to CABG",
            best: true,
            feedback: "Diabetes is the deciding factor here, not the score. In Brilakis's stable algorithm, a patient with diabetes and multivessel disease goes straight to the surgical-candidate question, and a good candidate goes to CABG; complexity is weighed only in patients without diabetes. The 2024 ESC guideline also recommends CABG over PCI in diabetes with three-vessel disease (class I), and FREEDOM found fewer deaths and MIs with CABG, at the cost of more strokes.",
          },
          {
            text: "A score of 22 or less in three-vessel disease, so PCI and CABG are equivalent for him",
            feedback: "Brilakis's SYNTAX table alone does allow either for three-vessel disease scoring 0–22, but the table is not the whole algorithm: with diabetes and multivessel disease in a good surgical candidate, CABG is preferred whatever the score.",
            stateDelta: { flags: ["diabetes-overlooked"] },
          },
          {
            text: "The score is low, so his disease is mild and medical therapy alone is the best plan",
            feedback: "SYNTAX grades anatomical complexity, not how much the disease affects him. He has limiting angina despite two drugs and ischaemia in two territories, so there is a clear reason to revascularise.",
          },
        ],
      },
      {
        id: "s3",
        prompt: "The surgeon assesses him as a good candidate with a low predicted risk and the heart team recommends CABG. After a full discussion, including the higher rate of repeat procedures and the FREEDOM results, he declines surgery and asks for PCI. What do you do?",
        options: [
          {
            text: "Respect his informed decision, document the discussion, and plan PCI aiming for complete revascularisation",
            best: true,
            feedback: "Brilakis: the final decision is always the patient's; the heart team's role is to inform and help. Documenting the discussion and aiming for completeness gives PCI its best chance.",
          },
          {
            text: "Tell him PCI cannot be offered because the heart team recommended CABG",
            next: "c-preference",
            feedback: "The heart team advises; it does not decide for an informed patient with capacity.",
            stateDelta: { flags: ["preference-overridden"] },
          },
          {
            text: "Offer medical therapy only, since he refused the recommended treatment",
            feedback: "He has limiting angina despite two drugs; refusing CABG does not remove the reason to revascularise, and PCI remains a reasonable option.",
          },
        ],
      },
      {
        id: "c-preference",
        kind: "consequence",
        prompt: "He leaves the clinic upset and his GP writes asking why a reasonable alternative was not offered. How do you respond?",
        options: [
          {
            text: "Arrange to see him again, set out PCI as a reasonable alternative with its trade-offs, and plan it if he still wishes",
            best: true,
            feedback: "Patient preference sits across every branch of Brilakis's algorithm. PCI with a higher chance of repeat procedures is still a legitimate choice for an informed patient.",
          },
          {
            text: "Reply that the heart-team decision is final",
            feedback: "That misreads the heart team's role, which is to inform, not to decide for the patient.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "You plan the first PCI session. Which lesions do you start with?",
        options: [
          {
            text: "The less complex LAD and circumflex lesions first, with the calcified RCA planned separately with lesion preparation",
            best: true,
            feedback: "Brilakis: treating less complex lesions first may make later complex lesions easier, and the calcified RCA needs its own plan. Oxford's alternative of tackling the hardest lesion first keeps CABG as the fallback, but he has declined CABG, so that argument is weak here.",
          },
          {
            text: "The calcified RCA first, because it is the hardest",
            acceptable: true,
            feedback: "Oxford notes many operators tackle the most challenging lesion first to keep surgery as the fallback. With surgery declined, Brilakis's easier-first approach makes more sense, but this is not unreasonable.",
          },
          {
            text: "Whichever vessel is easiest to engage on the day",
            feedback: "Sequence should be a plan based on complexity, dose and fallback options, not convenience on the table.",
          },
        ],
      },
      {
        id: "s5",
        prompt: "The LAD and circumflex are stented successfully. Contrast is 220 mL and air kerma 2.1 Gy after 75 minutes. The team suggests ‘finishing the job’ with atherectomy of the RCA now. What do you decide?",
        info: "eGFR 62 mL/min/1.73 m². He is comfortable but tired of lying flat.",
        options: [
          {
            text: "Stage the RCA as a separate, planned procedure",
            best: true,
            feedback: "Excessive contrast or radiation used or anticipated, complex remaining lesions and patient fatigue are all on Brilakis's list of reasons to stage. Calcified RCA PCI will need more contrast and time.",
          },
          {
            text: "Proceed to RCA atherectomy now, since access is in place",
            next: "c-overreach",
            feedback: "A complex calcified lesion at the end of a long case, after a large contrast load in a diabetic patient, is exactly the situation in which Brilakis advises staging.",
            stateDelta: { stability: -20, flags: ["overreach"] },
          },
        ],
      },
      {
        id: "c-overreach",
        kind: "consequence",
        prompt: "After 40 more minutes and 160 mL more contrast, the RCA is stented. Two days later his creatinine has risen by 40%. What is the lesson for the next case?",
        options: [
          {
            text: "Set contrast and dose limits before the case and stage when they are reached or a complex lesion remains",
            best: true,
            feedback: "Staging for dose and complexity protects kidneys and skin; the limits are part of the plan, not an afterthought (contrast limits are taught in pm-planning).",
          },
          {
            text: "Kidney injury is unpredictable, so staging would not have helped",
            feedback: "Contrast volume is a modifiable risk; staging the RCA would have spread the load across two procedures.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The RCA is treated at a second planned session with lesion preparation for calcium. He is free of angina at follow-up, understanding that he may need further procedures more often than after surgery.",
    outcomeVariants: [
      { flag: "ad-hoc-lad", text: "The early ad hoc LAD stent was placed before the modality decision; the remaining disease had to be taken to the heart team afterwards." },
      { flag: "overreach", text: "The single long session ended with a contrast-associated rise in creatinine that a staged plan would probably have avoided." },
      { flag: "diabetes-overlooked", text: "The low SYNTAX score was briefly allowed to outweigh his diabetes during the discussion." },
    ],
    learningPoints: [
      "Multivessel disease in a stable diabetic patient is a reason to stop after the diagnostic study and go to the heart team.",
      "Score SYNTAX lesion by lesion; in diabetes with multivessel disease, CABG is favoured in a good surgical candidate whatever the score, because complexity is weighed only in patients without diabetes.",
      "The informed patient makes the final decision; PCI remains legitimate if surgery is declined.",
      "Easier lesions first may help later ones; plan complex calcified lesions separately.",
      "Stage for contrast, radiation, complexity and fatigue.",
    ],
    refs: [...BOOKS, "farkouh-freedom-2012", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025", "blankenship-ad-hoc-2013", "sianos-syntax-score-2005"],
  },
  {
    id: "pm-target-case-inferior-stemi",
    title: "Inferior STEMI with a second diseased artery",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 7.2 (Fig. 7.4), 7.3.2, 20.4, 20.5 (Fig. 20.1), 20.7, 20.12 and 24.2.7; Oxford Handbook, chapter 8 (primary PCI in cardiogenic shock and in multivessel disease)",
    },
    summary: "Primary PCI for an inferior STEMI: the engagement order, the culprit, the non-culprit LAD, a fall into shock, and the discharge plan.",
    presentation:
      "A 57-year-old man has had 2 hours of central chest pain. The ECG shows ST elevation in II, III and aVF with ST depression in I and aVL. He is taken straight to the lab for primary PCI via the right radial artery.",
    findings: ["Blood pressure 118/74 mmHg, heart rate 64/min, Killip class I", "No previous coronary history", "Aspirin given by the ambulance crew"],
    steps: [
      {
        id: "s1",
        prompt: "Radial access is obtained. In what order do you engage the coronary arteries?",
        options: [
          {
            text: "Diagnostic angiography of the left coronary artery first, then a guide into whichever artery holds the culprit",
            best: true,
            feedback: "This is Brilakis's sequence for a non-anterior STEMI: the left anatomy is known before an RCA culprit is stented, which matters if there is left main or multivessel disease needing support or surgery.",
          },
          {
            text: "A guide straight into the RCA to open it as fast as possible",
            acceptable: true,
            feedback: "Immediate culprit engagement saves 8–13 minutes and is debated, but if you stent the RCA without seeing the left you may miss disease that changes the strategy.",
          },
          {
            text: "Change to femoral access, because radial engagement is slower in STEMI",
            feedback: "Radial access is generally preferred in STEMI; Brilakis converts to femoral only when radial engagement is actually causing delay.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The left system: normal left main, a 75% smooth mid-LAD stenosis with brisk flow, a small circumflex with minor disease. The RCA is occluded in its mid segment with an abrupt cut-off and haziness, and no collaterals are seen. Which lesion do you treat first?",
        options: [
          {
            text: "The RCA occlusion: it matches the inferior ST elevation and looks acute",
            best: true,
            feedback: "The ECG territory, the abrupt hazy occlusion and the absence of collaterals all identify the RCA as the culprit, and the culprit is treated first.",
          },
          {
            text: "The LAD, because it supplies more myocardium",
            next: "c-wrong-target",
            feedback: "The LAD lesion has no culprit features and does not match the ECG. Treating it first delays reperfusion of the infarct.",
            stateDelta: { stability: -20, flags: ["delayed-reperfusion"] },
          },
        ],
      },
      {
        id: "c-wrong-target",
        kind: "consequence",
        prompt: "Twenty minutes later the LAD is stented, the patient is still in pain and the inferior ST elevation has deepened. Blood pressure has fallen to 98/60 mmHg. What now?",
        options: [
          {
            text: "Engage the RCA with a guide and open the occlusion at once",
            best: true,
            feedback: "The culprit is still occluded; reperfusing it is the only priority now.",
          },
          {
            text: "Measure FFR in the RCA before deciding",
            feedback: "Physiology is not used in a suspected culprit, and an occluded artery in a STEMI needs opening, not measuring.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The RCA is wired, opened and stented with TIMI 3 flow; the pain settles and the ST segments fall. What do you plan for the 75% LAD lesion?",
        options: [
          {
            text: "Complete revascularisation of the LAD, now or staged within 45 days",
            best: true,
            feedback: "In stable STEMI patients with multivessel disease, complete revascularisation reduced cardiovascular death or MI in COMPLETE; the 2023 ESC guideline recommends it at the index procedure or within 45 days, guided by angiographic severity.",
          },
          {
            text: "Measure FFR in the LAD now and treat only if 0.80 or less",
            feedback: "Brilakis accepts physiology in non-culprit lesions because the values change little over time, but the 2023 ESC guideline bases non-culprit PCI on angiographic severity, its appraisal reads this as advising against FFR during the index STEMI procedure; FFR guidance did not beat angiographic guidance in FLOWER-MI, and in FULL REVASC FFR-guided completion did not beat culprit-only PCI.",
          },
          {
            text: "Leave the LAD on medical therapy and review in clinic",
            next: "c-culprit-only",
            feedback: "Culprit-only PCI is the strategy for shock; in a stable patient it leaves a lesion whose treatment reduced cardiovascular death or MI in COMPLETE.",
            stateDelta: { stability: -10, flags: ["no-nonculprit-plan"] },
          },
        ],
      },
      {
        id: "c-culprit-only",
        kind: "consequence",
        prompt: "On the ward round the next morning the consultant asks what the plan for the LAD is. What do you answer?",
        options: [
          {
            text: "Revise the plan: book staged PCI of the LAD within 45 days and explain it to the patient",
            best: true,
            feedback: "Staged completion remains available and evidence-based; the key is to book it within the window.",
          },
          {
            text: "No plan is needed unless he has angina",
            feedback: "That gives up the benefit shown in COMPLETE for stable STEMI patients with multivessel disease.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Before you start on the LAD, his blood pressure falls to 80/50 mmHg, he becomes cold and clammy, and a lactate of 5 mmol/L is reported. The RCA stent is patent with TIMI 3 flow. What now?",
        info: "Heart rate 104/min. Echo in the lab shows impaired inferior and right ventricular function and no pericardial effusion.",
        options: [
          {
            text: "Stop after the culprit: treat the shock, consider support, and stage the LAD later",
            best: true,
            feedback: "In cardiogenic shock, culprit-only PCI acutely reduced death or renal-replacement therapy in CULPRIT-SHOCK. Brilakis's ACS algorithm says stop after the culprit in shock and consider staged PCI of other lesions later. The echo shows RV involvement, which needs its own management (a preload-dependent RV, so no nitrates; taught in mcs-stemi-rv-minoca), and RV-specific support may be needed (device choice in pm-support-choice).",
          },
          {
            text: "Stent the LAD now to improve perfusion of the rest of the heart",
            next: "c-shock-mvpci",
            feedback: "That is the strategy CULPRIT-SHOCK tested and found worse than culprit-only PCI.",
            stateDelta: { stability: -25, flags: ["mv-pci-in-shock"] },
          },
          {
            text: "Measure FFR in the LAD to decide whether it contributes to the shock",
            feedback: "Brilakis warns that FFR may be inaccurate in cardiogenic shock, and the question is not one physiology can answer here.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-shock-mvpci",
        kind: "consequence",
        prompt: "During LAD stenting there is slow flow, the pressure falls to 68/40 mmHg and he needs more noradrenaline. What do you do?",
        options: [
          {
            text: "Finish as quickly and safely as possible, stop further PCI, and focus on supporting the circulation",
            best: true,
            feedback: "The immediate task is to stop adding ischaemic and contrast burden and stabilise him; any further revascularisation waits.",
          },
          {
            text: "Continue to optimise the LAD result with post-dilatation and imaging",
            feedback: "More time and contrast in a shocked patient compounds the harm.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "He recovers over 4 days and comes off vasopressors. What do you write in the discharge plan?",
        options: [
          {
            text: "Staged PCI of the LAD after recovery, with a booked date and the reason explained to him",
            best: true,
            feedback: "Staged completion after recovery from shock is the plan both manuals describe, and writing the date makes it happen. The 45-day window comes from trials in stable STEMI patients; after shock the 2023 ESC guideline supports staged non-culprit PCI (class IIa, level C) without a time window, so the timing is set by his recovery.",
          },
          {
            text: "LAD to be reassessed if symptoms recur",
            feedback: "A significant non-culprit lesion after STEMI needs a plan, not a wait for symptoms.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "He undergoes staged LAD PCI four weeks later and is discharged the same day, free of symptoms.",
    outcomeVariants: [
      { flag: "delayed-reperfusion", text: "Reperfusion of the RCA was delayed while a non-culprit lesion was treated first, adding to the infarct." },
      { flag: "mv-pci-in-shock", text: "Immediate non-culprit PCI in shock added slow flow and haemodynamic deterioration; he needed a longer stay in intensive care." },
      { flag: "no-nonculprit-plan", text: "The non-culprit plan was made only after it was questioned on the ward round." },
    ],
    learningPoints: [
      "Non-anterior STEMI: diagnostic angiography of the left first, then a guide into the culprit artery.",
      "The culprit matches the ECG and looks acute; treat it first.",
      "Stable patients: complete revascularisation now or within 45 days.",
      "Cardiogenic shock: culprit only, then staged PCI timed to recovery (the 45-day window is from stable-STEMI trials).",
      "No physiology in the culprit, and FFR is unreliable in shock.",
    ],
    refs: [...BOOKS, "complete-2019", "culprit-shock-2017", "bohm-full-revasc-2024", "licordari-esc-acs-2024"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "diag-review-previous-films",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Open the old films before the first run",
    text: "Before you start, review earlier angiograms, reports and any recent CT: they show what has changed, which catheters worked, and often the likely target. After CABG, have the operation note to hand.",
    tone: "do",
    lessonId: "pm-target-indications",
    sources: [
      { book: "brilakis-pci", loc: "1.1" },
      { book: "brilakis-pci", loc: "1.5" },
      { book: "brilakis-pci", loc: "1.7" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-plan-name-the-goal",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Name the goal before the first wire",
    text: "Say whether this PCI is for symptom relief, prognosis or an ACS culprit. In stable disease the benefit is mainly symptomatic, so the acceptable risk and the value of completeness depend on that answer.",
    tone: "do",
    lessonId: "pm-target-ccs-why",
    sources: [
      { book: "brilakis-pci", loc: "7.1" },
      { book: "oxford-cath", loc: "ch 8: Indications for PCI" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "diag-stop-for-heart-team",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Left main or multivessel disease in a stable patient: stop",
    text: "If a stable patient has unprotected left main or multivessel disease, end the diagnostic study and take the case to the heart team: both are on Brilakis's list of reasons to defer ad hoc PCI. For three-vessel disease, the 2024 ESC guideline also says no ad hoc PCI when PCI and CABG are equally recommended.",
    tone: "caution",
    lessonId: "pm-target-heart-team",
    sources: [
      { book: "brilakis-pci", loc: "7.1" },
      { book: "brilakis-pci", loc: "7.3" },
      { book: "brilakis-pci", loc: "17.7" },
    ],
    refs: ["brilakis-manual-pci", "esc-ccs-2024", "dayan-esc-ccs-endorsement-2025"],
  },
  {
    id: "diag-ad-hoc-pause",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Pause before converting to PCI",
    text: "Before going on to ad hoc PCI, run the deferral checks: complex anatomy, contrast and radiation so far, the centre's capability, whether the consent covers this risk, unclear ischaemia, any complication, fatigue, preparation and the patient's wishes. If any fails, stop and plan.",
    tone: "do",
    lessonId: "pm-target-timing",
    sources: [{ book: "brilakis-pci", loc: "7.3" }],
    refs: ["brilakis-manual-pci", "blankenship-ad-hoc-2013"],
  },
  {
    id: "pci-stage-on-dose",
    lab: "pci",
    when: { event: ["high-contrast-volume", "high-radiation-dose"] },
    title: "High contrast or dose: treat the easy lesion, stage the rest",
    text: "When contrast or radiation is already high, finish the lesion in hand and stage the remaining ones, especially complex ones, for another day.",
    tone: "caution",
    lessonId: "pm-target-timing",
    sources: [
      { book: "brilakis-pci", loc: "7.3" },
      { book: "brilakis-pci", loc: "7.4" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-serial-distal-first",
    lab: "pci",
    when: { phase: ["plan", "stent"] },
    title: "Serial lesions: distal first, with three exceptions",
    text: "With several lesions in one artery, start distally, unless the proximal or ostial lesion damps the guide, causes ischaemia, or blocks devices. Finish every significant lesion in that artery in this sitting.",
    tone: "do",
    lessonId: "pm-target-timing",
    sources: [{ book: "brilakis-pci", loc: "7.4" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-lm-branches-and-rca-first",
    lab: "pci",
    when: { phase: ["plan"], vessel: ["LM"] },
    title: "Around the left main: branches and RCA before the left main stent",
    text: "If the LAD and circumflex need stents and the left main is not critical, treat them first; delivery through a fresh left main stent is harder. Consider treating significant RCA disease first to make left main PCI safer.",
    tone: "do",
    lessonId: "pm-target-timing",
    sources: [{ book: "brilakis-pci", loc: "17.10" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-stage-after-complication",
    lab: "pci",
    when: { phase: ["complication"] },
    title: "After a complication, stage the remaining lesions",
    text: "Once a complication has been dealt with, do not press on to the next lesion: a complication is one of the reasons to stage the rest of a multivessel procedure.",
    tone: "caution",
    lessonId: "pm-target-timing",
    sources: [{ book: "brilakis-pci", loc: "7.3" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-stemi-engagement-order",
    lab: "diagnostic",
    when: { phase: ["engage-left", "engage-right"], event: ["st-elevation"] },
    title: "STEMI: engage in the right order",
    text: "Anterior STEMI: guide into the left main, treat the culprit, then image the RCA. Non-anterior STEMI: image the left coronary artery first; if the culprit is there, guide into the left main, treat it and then image the RCA; if not, guide into the RCA, so it is never stented with the left anatomy unknown.",
    tone: "do",
    lessonId: "pm-target-culprit",
    sources: [{ book: "brilakis-pci", loc: "20.5" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-culprit-not-obvious",
    lab: "diagnostic",
    when: { phase: ["lv-aorta", "views"], event: ["st-elevation", "chest-pain"] },
    title: "ACS with no obvious culprit: the next three steps",
    text: "If an ACS angiogram shows no clear culprit, review every run again for subtle haze or staining, perform a ventriculogram (or echo in the lab) to find the hypokinetic territory and exclude takotsubo or a mechanical complication, then use OCT; cardiac MRI can follow.",
    tone: "do",
    lessonId: "pm-target-culprit",
    sources: [
      { book: "brilakis-pci", loc: "7.2" },
      { book: "brilakis-pci", loc: "20.7" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-wire-fails-wrong-vessel",
    lab: "pci",
    when: { phase: ["wire"], event: ["wire-not-crossing"] },
    title: "ACS wire will not cross: is this the culprit?",
    text: "If a soft workhorse wire fails in an acute occlusion, try a soft hydrophilic-tipped wire, then a soft polymer-jacketed one; avoid stiff polymer-jacketed wires where possible. If wiring still fails, recheck the angiogram and old films against the ECG: this may be a chronic occlusion, not the culprit. Image other candidate lesions with OCT.",
    tone: "caution",
    lessonId: "pm-target-culprit",
    sources: [{ book: "brilakis-pci", loc: "20.8" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-no-physiology-in-culprit",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "No pressure wire in the culprit",
    text: "Do not use FFR or resting indices to decide on a culprit or suspected culprit lesion: the injured microcirculation makes them unreliable. Non-culprit lesions can be measured, though after STEMI the guideline bases non-culprit PCI on angiographic severity, and FFR is unreliable in cardiogenic shock.",
    tone: "caution",
    lessonId: "pm-target-culprit",
    sources: [
      { book: "brilakis-pci", loc: "12.1" },
      { book: "brilakis-pci", loc: "20.12" },
      { book: "brilakis-pci", loc: "24.2" },
      { book: "oxford-cath", loc: "ch 8: Pressure wire" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "licordari-esc-acs-2024"],
  },
  {
    id: "pci-oct-unclear-culprit",
    lab: "pci",
    when: { phase: ["imaging"], event: ["st-elevation", "chest-pain"] },
    title: "Unclear culprit: image with OCT",
    text: "When the culprit is uncertain, OCT is the imaging of choice: look for plaque rupture, erosion, ulceration, thrombus or a calcified nodule. Their presence strongly suggests the lesion is a culprit.",
    tone: "do",
    lessonId: "pm-target-culprit",
    sources: [
      { book: "brilakis-pci", loc: "13.1" },
      { book: "brilakis-pci", loc: "20.8" },
      { book: "brilakis-pci", loc: "20.13" },
      { book: "oxford-cath", loc: "ch 8: IVUS or OCT?" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-acs-culprit-first",
    lab: "pci",
    when: { phase: ["plan"], event: ["st-elevation", "chest-pain"] },
    title: "Ongoing ischaemia: culprit first, now",
    text: "With ongoing ischaemia, whether STEMI or NSTE-ACS with continuing pain, treat the culprit immediately and first. But know the left coronary anatomy before stenting an RCA culprit: left main or multivessel disease may change how you treat it (support, CABG, or balloon angioplasty alone).",
    tone: "do",
    lessonId: "pm-target-nste",
    sources: [
      { book: "brilakis-pci", loc: "7.2" },
      { book: "brilakis-pci", loc: "7.4" },
      { book: "brilakis-pci", loc: "20.5" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-shock-culprit-only",
    lab: "pci",
    when: { phase: ["plan", "finish"], event: ["hypotension"] },
    title: "Cardiogenic shock: culprit only",
    text: "If the hypotension is infarct-related cardiogenic shock in multivessel disease, treat only the culprit acutely; immediate multivessel PCI did worse in CULPRIT-SHOCK. Stage any other lesions after recovery, timed to the patient.",
    tone: "caution",
    lessonId: "pm-target-multivessel-stemi",
    sources: [
      { book: "brilakis-pci", loc: "7.2" },
      { book: "brilakis-pci", loc: "24.2" },
      { book: "oxford-cath", loc: "ch 8: Primary PCI in cardiogenic shock" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "culprit-shock-2017"],
  },
  {
    id: "pci-stemi-nonculprit-plan",
    lab: "pci",
    when: { phase: ["finish"], event: ["st-elevation"] },
    title: "Before the guide comes out: the non-culprit plan",
    text: "In a stable STEMI patient with multivessel disease, decide before you finish whether the remaining angiographically significant lesions are treated now or staged within 45 days, and write it down.",
    tone: "do",
    lessonId: "pm-target-multivessel-stemi",
    sources: [
      { book: "brilakis-pci", loc: "7.3" },
      { book: "brilakis-pci", loc: "20.7" },
    ],
    refs: ["brilakis-manual-pci", "complete-2019", "licordari-esc-acs-2024"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "boden-courage-2007",
    kind: "trial",
    citation: "Boden WE, O'Rourke RA, Teo KK, et al. Optimal medical therapy with or without PCI for stable coronary disease. N Engl J Med. 2007;356:1503–1516.",
    url: "https://doi.org/10.1056/NEJMoa070829",
    note: "PMID: 17387127. The COURAGE trial. Checked on PubMed: authors, title, journal, year, volume 356, issue 15, pages 1503–1516.",
    verified: true,
  },
  {
    id: "al-lamee-orbita-2018",
    kind: "trial",
    citation: "Al-Lamee R, Thompson D, Dehbi HM, et al. Percutaneous coronary intervention in stable angina (ORBITA): a double-blind, randomised controlled trial. Lancet. 2018;391:31–40.",
    url: "https://doi.org/10.1016/S0140-6736(17)32714-9",
    note: "PMID: 29103656. Checked on PubMed: authors, title, journal, volume 391, issue 10115, pages 31–40 (online 2017, issue dated 2018).",
    verified: true,
  },
  {
    id: "farkouh-freedom-2012",
    kind: "trial",
    citation: "Farkouh ME, Domanski M, Sleeper LA, et al. Strategies for multivessel revascularization in patients with diabetes. N Engl J Med. 2012;367:2375–2384.",
    url: "https://doi.org/10.1056/NEJMoa1211585",
    note: "PMID: 23121323. The FREEDOM trial. Checked on PubMed: authors, title, journal, year, volume 367, issue 25, pages 2375–2384.",
    verified: true,
  },
  {
    id: "biscaglia-fire-2023",
    kind: "trial",
    citation: "Biscaglia S, Guiducci V, Escaned J, et al. Complete or culprit-only PCI in older patients with myocardial infarction. N Engl J Med. 2023;389:889–898.",
    url: "https://doi.org/10.1056/NEJMoa2300468",
    note: "PMID: 37634150. The FIRE trial. Checked on PubMed: authors, title, journal, year, volume 389, issue 10, pages 889–898.",
    verified: true,
  },
  {
    id: "blankenship-ad-hoc-2013",
    kind: "consensus",
    citation: "Blankenship JC, Gigliotti OS, Feldman DN, et al. Ad hoc percutaneous coronary intervention: a consensus statement from the Society for Cardiovascular Angiography and Interventions. Catheter Cardiovasc Interv. 2013;81:748–758.",
    url: "https://doi.org/10.1002/ccd.24701",
    note: "PMID: 23197438. Checked on PubMed: authors, title, journal, volume 81, issue 5, pages 748–758 (online 2012, issue dated 2013). Cited by Brilakis, section 7.3.1.",
    verified: true,
  },
  {
    id: "licordari-esc-acs-2024",
    kind: "paper",
    citation: "Licordari R, Costa F, Garcia-Ruiz V, et al. The evolving field of acute coronary syndrome management: a critical appraisal of the 2023 European Society of Cardiology guidelines for the management of acute coronary syndrome. J Clin Med. 2024;13(7):1885.",
    url: "https://doi.org/10.3390/jcm13071885",
    note: "PMID: 38610650; PMC11012418. Checked on PubMed: authors, title, journal, year, volume 13, issue 7, article 1885. Full text read in PMC; used for the class and level of the 2023 ESC ACS recommendations it quotes (early invasive strategy, pretreatment, multivessel disease, cardiogenic shock, intravascular imaging, CMR in MINOCA).",
    verified: true,
  },
  {
    id: "dayan-esc-ccs-endorsement-2025",
    kind: "consensus",
    citation: "Dayan V, Sabik JF III, Ono M, et al. Multisociety endorsement of the 2024 European guideline recommendations on coronary revascularization. Braz J Cardiovasc Surg. 2025;40(1):e20250900.",
    url: "https://doi.org/10.21470/1678-9741-2025-0900",
    note: "PMID: 39873335; PMC11771970. Checked on PubMed: authors, title, journal, year, volume 40, issue 1, article e20250900. Full text read in PMC; it quotes the 2024 ESC chronic coronary syndrome recommendations on revascularisation in three-vessel disease, diabetes, PCI versus CABG, and no ad hoc PCI when PCI and CABG are equally recommended.",
    verified: true,
  },
  {
    id: "rajkumar-orbita2-2023",
    kind: "trial",
    citation: "Rajkumar CA, Foley MJ, Ahmed-Jushuf F, et al. A placebo-controlled trial of percutaneous coronary intervention for stable angina. N Engl J Med. 2023;389:2319–2330.",
    url: "https://doi.org/10.1056/NEJMoa2310610",
    note: "PMID: 38015442; PMC7615400. The ORBITA-2 trial. Checked on PubMed: authors, title, journal, year, volume 389, issue 25, pages 2319–2330; abstract read (301 patients, antianginal drugs stopped, angina symptom score 2.9 vs 5.6 at 12 weeks, OR 2.21, 95% CI 1.41–3.47).",
    verified: true,
  },
  {
    id: "bohm-full-revasc-2024",
    kind: "trial",
    citation: "Böhm F, Mogensen B, Engstrøm T, et al. FFR-guided complete or culprit-only PCI in patients with myocardial infarction. N Engl J Med. 2024;390:1481–1492.",
    url: "https://doi.org/10.1056/NEJMoa2314149",
    note: "PMID: 38587995. The FULL REVASC trial. Checked on PubMed: authors, title, journal, year, volume 390, issue 16, pages 1481–1492; abstract read (1,542 patients with STEMI or very-high-risk NSTEMI, primary outcome 19.0% vs 20.4% at a median of 4.8 years, HR 0.93).",
    verified: true,
  },
  {
    id: "mehilli-isar-sweet-2004",
    kind: "trial",
    citation: "Mehilli J, Kastrati A, Schühlen H, et al. Randomized clinical trial of abciximab in diabetic patients undergoing elective percutaneous coronary interventions after treatment with a high loading dose of clopidogrel. Circulation. 2004;110:3627–3635.",
    url: "https://doi.org/10.1161/01.CIR.0000148956.93631.4D",
    note: "PMID: 15531766. The ISAR-SWEET trial. Checked on PubMed: authors, title, journal, year, volume 110, issue 24, pages 3627–3635; abstract read (701 diabetic patients, 600 mg clopidogrel load, death or MI at 1 year 8.3% vs 8.6%, restenosis 28.9% vs 37.8% with bare-metal stents).",
    verified: true,
  },
];
