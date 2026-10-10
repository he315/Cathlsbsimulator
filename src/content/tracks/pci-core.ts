import type { CaseStudy, Module, Track } from "../schema";

// ===========================================================================
// Track 4: Core PCI. Organised around the step-by-step approach of the
// Manual of PCI: plan -> access -> engage -> wire -> prepare -> stent ->
// optimise -> close. Each step is taught as goal, technique and what goes
// wrong. Complex lesions, complication management and closure devices in
// depth live in their own tracks.
// ===========================================================================

// ---------------------------------------------------------------------------
// Module 1: indications, heart team, patient factors, consent
// ---------------------------------------------------------------------------
const mIndications: Module = {
  id: "pci-indications",
  title: "Who benefits from PCI",
  stage: 3,
  summary:
    "Deciding whether PCI is the right treatment: acute versus chronic coronary syndromes, symptoms versus prognosis, the heart team and SYNTAX, patient factors and informed consent.",
  objectives: [
    "Contrast the evidence for PCI in acute coronary syndromes with the evidence in chronic coronary syndromes.",
    "Explain what ISCHEMIA and REVIVED-BCIS2 showed, and what they did not show.",
    "Use the SYNTAX score and heart-team discussion appropriately for left main and multivessel disease.",
    "Identify patient factors that make PCI unwise or require the strategy to change (DAPT, bleeding, CKD, anticoagulation, frailty, planned surgery).",
    "Obtain valid informed consent for PCI in elective and emergency settings.",
  ],
  lessons: [
    {
      id: "pci-ind-acs-vs-ccs",
      title: "ACS versus chronic coronary syndromes: what PCI achieves",
      minutes: 9,
      refs: [
        "supplied-medmastery",
        "esc-acs-2023",
        "esc-ccs-2024",
        "ischemia-2020",
        "revived-2022",
        "fame2-2012",
        "brilakis-manual-pci",
        "spertus-ischemia-qol-2020",
      ],
      blocks: [
        {
          kind: "p",
          text: "PCI is a tool, not a diagnosis. Before you think about guides and stents, ask what the procedure will achieve for this patient: longer survival, fewer myocardial infarctions, relief of angina, or nothing worth the risk. The answer depends above all on how the patient presented.",
        },
        { kind: "h", text: "Acute coronary syndromes" },
        {
          kind: "p",
          text: "STEMI, NSTEMI and unstable angina are points on one spectrum. A plaque ruptures or erodes, thrombus forms on it and fragments may embolise downstream. This shared mechanism explains two things you will see repeatedly: treatment leans heavily on antithrombotic drugs, and the culprit lesion behaves differently in the lab from a stable plaque, with thrombus, distal embolisation and slow flow.",
        },
        {
          kind: "p",
          text: "The strongest evidence for PCI is in ACS. Prompt reperfusion in STEMI and an invasive strategy in higher-risk NSTE-ACS reduce death and reinfarction, shorten hospital stay and reduce later heart failure and repeat revascularisation. Before you commit, make sure it really is a plaque event: pericarditis, myocarditis, aortic dissection, Takotsubo syndrome and supply-demand (type 2) infarction can all produce chest pain, ECG changes and a troponin rise. A careful history and examination come first.",
        },
        {
          kind: "table",
          caption: "Timing of invasive management in ACS (2023 ESC ACS guideline, summarised)",
          head: ["Presentation", "Timing", "Typical triggers"],
          rows: [
            [
              "STEMI",
              "Primary PCI as soon as possible; fibrinolysis if PCI-mediated reperfusion cannot be achieved within 120 min of diagnosis",
              "Symptoms within 12 h with persistent ST elevation or an equivalent pattern",
            ],
            [
              "NSTE-ACS, very high risk",
              "Immediate (within 2 h)",
              "Haemodynamic instability or shock; recurrent or refractory pain despite treatment; life-threatening arrhythmia; acute heart failure due to ischaemia; mechanical complication; recurrent dynamic ST changes, especially intermittent ST elevation",
            ],
            [
              "NSTE-ACS, high risk",
              "Early (within 24 h) should be considered",
              "NSTEMI confirmed by high-sensitivity troponin; dynamic ST or T changes; transient ST elevation; GRACE score above 140",
            ],
            [
              "NSTE-ACS without high-risk features",
              "Selective invasive approach",
              "Guided by non-invasive testing and clinical judgement",
            ],
          ],
        },
        { kind: "h", text: "Chronic coronary syndromes" },
        {
          kind: "p",
          text: "In stable disease the case for PCI rests mainly on symptoms. PCI relieves angina well, but every patient should already be on guideline-directed medical therapy: antianginal drugs (PCI is usually offered when angina persists on two agents at tolerated doses), lipid lowering, blood pressure and glucose control. These measures matter for long-term outcome whether or not the patient is revascularised.",
        },
        {
          kind: "p",
          text: "ISCHEMIA randomised about 5,000 patients with stable disease and moderate or severe ischaemia on stress testing to a routine invasive strategy or an initial conservative strategy. Patients with significant left main disease, LVEF below 35%, recent ACS or unacceptable angina were excluded. Over a median of about three years, the routine invasive strategy did not reduce the composite of cardiovascular death, myocardial infarction, resuscitated cardiac arrest or hospitalisation for unstable angina or heart failure. Patients who had angina at baseline reported better angina control and quality of life with the invasive strategy.",
        },
        {
          kind: "p",
          text: "REVIVED-BCIS2 asked whether PCI helps patients with severe ischaemic LV dysfunction (LVEF 35% or less), extensive coronary disease and viable myocardium. About 700 patients were randomised to PCI plus optimal medical therapy or medical therapy alone. PCI did not reduce death from any cause or hospitalisation for heart failure, and LVEF did not improve more with PCI.",
        },
        {
          kind: "keypoints",
          title: "Where PCI earns its place in CCS",
          items: [
            "Relief of angina that persists despite optimal medical therapy.",
            "Physiologically significant lesions: in FAME 2, PCI of FFR-positive lesions reduced the composite of death, MI or urgent revascularisation compared with medical therapy alone, driven by fewer urgent revascularisations.",
            "Prognostic benefit is most plausible for significant left main disease and extensive multivessel disease involving the proximal LAD; much of that evidence comes from surgical trials, so these patients belong to the heart team.",
            "Functional testing also tells you which vessel to treat in multivessel disease, which maximises the chance of a symptom-free patient.",
          ],
        },
        {
          kind: "pearl",
          text: "Exertional breathlessness as the main symptom is often multifactorial. It may be an angina equivalent, but promise improvement cautiously: deconditioning, lung disease, obesity and diastolic dysfunction will not respond to a stent.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating the angiogram instead of the patient: a severe-looking lesion in an asymptomatic patient with no ischaemia is not an indication in itself.",
            "Telling a patient with stable disease that a stent will prevent a heart attack or prolong life. For most patients outside the left main and extensive multivessel subsets, that has not been shown.",
            "Opening an occluded artery that supplies full-thickness scar with no viable or ischaemic myocardium: all the risk and none of the benefit.",
            "Labelling every troponin rise as ACS and sending the patient for angiography without considering the mimics.",
          ],
        },
      ],
    },
    {
      id: "pci-ind-heart-team",
      title: "Left main and multivessel disease: SYNTAX and the heart team",
      minutes: 9,
      refs: [
        "syntax-2009",
        "esc-revasc-2018",
        "esc-ccs-2024",
        "dayan-esc-ccs-endorsement-2025",
        "excel-2016",
        "noble-2016",
        "supplied-medmastery",
        "hanna-pcm",
        "sianos-syntax-score-2005",
      ],
      blocks: [
        {
          kind: "p",
          text: "When disease is confined to one or two vessels and the anatomy is favourable, PCI is usually the default revascularisation option. When it involves the left main stem or all three vessels, the choice between PCI and coronary artery bypass grafting (CABG) is a decision for the heart team, made with the patient. The team is at minimum an interventional cardiologist and a cardiac surgeon, often with a non-invasive cardiologist. Medical therapy alone is always one of the options on the table.",
        },
        { kind: "h", text: "The SYNTAX score" },
        {
          kind: "p",
          text: "The SYNTAX score grades the anatomical complexity of coronary disease from the angiogram, lesion by lesion. Points depend on the segment involved (weighted by the myocardium it supplies) and are added for occlusion, bifurcation or trifurcation, aorto-ostial position, severe tortuosity, length over 20 mm, heavy calcification, thrombus and diffuse small-vessel disease. A higher score means more complex anatomy and a lower chance of complete, durable revascularisation by PCI. Surgical risk is estimated separately, for example with EuroSCORE II.",
        },
        {
          kind: "table",
          caption: "SYNTAX score tertiles",
          head: ["Tertile", "Score", "Practical meaning"],
          rows: [
            ["Low", "0–22", "PCI and CABG give broadly similar outcomes in most subsets"],
            ["Intermediate", "23–32", "CABG increasingly favoured in three-vessel disease; PCI remains an option for left main disease"],
            ["High", "33 or more", "CABG generally preferred"],
          ],
        },
        {
          kind: "p",
          text: "The SYNTAX trial randomised 1,800 patients with three-vessel or left main disease to CABG or PCI with first-generation paclitaxel-eluting stents. At 12 months PCI did not meet non-inferiority for the composite of death, stroke, MI or repeat revascularisation, mainly because of more repeat revascularisation; stroke was more frequent after CABG. Outcomes were similar in patients with low scores and favoured CABG as scores rose. Remember that these were first-generation stents, but the gradient with anatomical complexity has persisted with modern devices.",
        },
        {
          kind: "p",
          text: "For left main disease, EXCEL and NOBLE compared contemporary drug-eluting stents with CABG in patients with low to intermediate anatomical complexity. They used different endpoints and reached different conclusions, which is why the guidelines treat PCI as a reasonable alternative to CABG in less complex left main disease and favour CABG when complexity is high.",
        },
        {
          kind: "table",
          caption: "Mode of revascularisation in stable disease: ESC/EACTS 2018 classes of recommendation, with the 2024 ESC chronic coronary syndrome recommendations for three-vessel disease added (rows marked 2024, as quoted in the surgical societies' endorsement). Where the 2018 and 2024 three-vessel rows differ, the 2024 guideline is current.",
          head: ["Anatomy", "CABG", "PCI"],
          rows: [
            ["One- or two-vessel disease without proximal LAD", "IIb", "I"],
            ["One- or two-vessel disease with proximal LAD", "I", "I"],
            ["Left main, SYNTAX 0–22", "I", "I"],
            ["Left main, SYNTAX 23–32", "I", "IIa"],
            ["Left main, SYNTAX 33 or more", "I", "III"],
            ["Three-vessel disease without diabetes, SYNTAX 0–22 (2018)", "I", "I"],
            ["Three-vessel disease without diabetes, SYNTAX above 22 (2018)", "I", "III"],
            ["Three-vessel disease with diabetes, SYNTAX 0–22 (2018)", "I", "IIb"],
            ["Three-vessel disease with diabetes, SYNTAX above 22 (2018)", "I", "III"],
            ["Three-vessel disease with diabetes (2024)", "I (A), recommended over PCI", "No class quoted; CABG is recommended over PCI"],
            ["Three-vessel disease without diabetes, low or intermediate complexity (2024)", "I (A)", "I (A), only if PCI can achieve revascularisation as complete as CABG"],
            ["Three-vessel disease with equal PCI and CABG recommendations (2024)", "Heart team discussion; no ad hoc PCI (I, C)", "Heart team discussion; no ad hoc PCI (I, C)"],
          ],
        },
        {
          kind: "keypoints",
          title: "Factors that tip the balance",
          items: [
            "Towards CABG: diabetes with multivessel disease, high SYNTAX score, reduced LVEF with multivessel disease, anatomy where PCI is unlikely to achieve complete revascularisation, contraindication to DAPT, recurrent diffuse in-stent restenosis.",
            "Towards PCI: severe comorbidity or frailty, limited life expectancy, restricted mobility that would hamper recovery, porcelain aorta, previous chest radiation, chest wall deformity, previous cardiac surgery, low SYNTAX score.",
            "Whatever the anatomy, the patient's informed preference is part of the decision.",
          ],
        },
        {
          kind: "pearl",
          text: "Incomplete revascularisation is one of the main reasons PCI underperforms in complex anatomy. When you plan multivessel PCI, picture the angiogram you will leave behind: residual disease after PCI predicts outcome.",
        },
        {
          kind: "pitfalls",
          items: [
            "Ad hoc PCI of left main or complex three-vessel disease straight after a diagnostic angiogram in a stable patient, before the patient has heard the surgical option.",
            "Using the heart team as a rubber stamp. Bring the angiogram, the LV function, the comorbidities and the patient's wishes, and record the reasoning.",
            "Quoting SYNTAX trial results for modern stents without acknowledging that the device has changed.",
          ],
        },
      ],
    },
    {
      id: "pci-ind-patient-consent",
      title: "Patient factors and informed consent",
      minutes: 10,
      refs: ["supplied-medmastery", "mehran-cin-2004", "esc-ccs-2024", "esc-acs-2023", "esc-af-2024", "urban-arc-hbr-2019", "montgomery-2015"],
      blocks: [
        {
          kind: "p",
          text: "The anatomy may be ideal and the patient still a poor candidate. Before booking PCI, work through the factors that change either the decision to proceed or the way you will do it. A useful framing is to ask what happens to this patient without revascularisation, and set that against the procedural and bleeding risk if you go ahead.",
        },
        {
          kind: "table",
          caption: "Patient factors to check before PCI",
          head: ["Factor", "Why it matters", "What to do"],
          rows: [
            [
              "Ability to take DAPT",
              "A stent cannot be removed; premature interruption of DAPT is a leading cause of early stent thrombosis",
              "Ask about adherence, allergy and any planned surgery or invasive procedures; consider deferring elective PCI until after surgery",
            ],
            [
              "Bleeding risk",
              "Major bleeding after PCI is associated with higher mortality",
              "Ask about previous GI or intracranial haemorrhage, anaemia, low platelets; use a formal assessment (ARC-HBR criteria or PRECISE-DAPT); plan radial access, a PPI and a shorter DAPT course",
            ],
            [
              "Chronic kidney disease",
              "Higher risk of contrast-associated acute kidney injury, especially with diuretics, nephrotoxins or volume depletion",
              "Score the risk (for example the Mehran score), hydrate, hold nephrotoxins, minimise contrast, check creatinine afterwards",
            ],
            [
              "Need for oral anticoagulation",
              "AF, a mechanical valve or venous thromboembolism means combining OAC with antiplatelets, which raises bleeding",
              "Plan the regimen in advance; mechanical valves need a vitamin K antagonist, not a DOAC",
            ],
            [
              "Frailty and comorbidity",
              "Alter procedural risk and the time horizon over which benefit accrues",
              "Use a formal frailty measure (Clinical Frailty Scale or Edmonton Frail Scale); discuss quality of life",
            ],
            [
              "Ability to lie flat and still",
              "Orthopnoea, back pain or confusion can wreck a complex case midway",
              "Treat heart failure first; plan analgesia or anaesthetic support",
            ],
            [
              "Diabetes, LV dysfunction, valve or lung disease",
              "May make CABG or a combined procedure more attractive",
              "Heart team discussion",
            ],
            [
              "Occluded artery",
              "No benefit from opening an artery that supplies non-viable scar",
              "Viability or ischaemia imaging before planning",
            ],
          ],
        },
        { kind: "h", text: "Informed consent" },
        {
          kind: "p",
          text: "Consent must be informed, voluntary and given by a patient with capacity. In the UK, the Montgomery judgment (2015) set the standard: you must disclose material risks, meaning those a reasonable person in the patient's position would consider significant, and those you know or should know matter to this particular patient. You must also explain reasonable alternatives, including medical therapy, CABG and doing nothing.",
        },
        {
          kind: "list",
          items: [
            "Give information in spoken and written form, with time to reflect and to discuss with family or another doctor.",
            "The person taking consent should either perform the procedure or be trained to consent for it.",
            "On the day, the operator confirms consent, asks about remaining concerns and reminds the patient they can withdraw at any point.",
            "If the patient has reservations at any stage: defer, discuss and document.",
          ],
        },
        {
          kind: "table",
          caption: "Risks to cover when consenting for PCI",
          head: ["Risk", "Points to explain"],
          rows: [
            ["Death, stroke, emergency cardiac surgery", "Uncommon in elective PCI (each well under 1% for most patients); higher in ACS, shock and complex PCI. Quote your centre's audited figures."],
            ["Periprocedural myocardial infarction", "Side-branch occlusion, distal embolisation, dissection"],
            ["Bleeding and access-site injury", "Haematoma, false aneurysm, retroperitoneal bleeding (femoral), radial artery occlusion"],
            ["Coronary injury", "Dissection, perforation and tamponade"],
            ["Contrast", "Allergic-type reactions; contrast-associated kidney injury, with an individual risk estimate in CKD"],
            ["Radiation", "Skin injury is rare and mainly follows long, complex procedures"],
            ["Later problems", "Restenosis, stent thrombosis (especially if DAPT is stopped), need for further procedures"],
          ],
        },
        {
          kind: "p",
          text: "Emergencies change the conversation but not the principle. A patient with STEMI may be in pain, frightened and given opioids; a brief explanation and verbal agreement is usually all that is possible. If a patient lacks capacity and treatment cannot wait, act in their best interests under the Mental Capacity Act (England and Wales) or the equivalent legislation, and document why.",
        },
        {
          kind: "pearl",
          text: "When you consent for a diagnostic angiogram with possible PCI, have the PCI conversation then, including the alternatives. If the angiogram shows something you did not discuss, such as left main or three-vessel disease, stop and talk again rather than relying on the original signature.",
        },
        {
          kind: "pitfalls",
          items: [
            "A consent form listing PCI risks that were never actually discussed.",
            "Failing to score contrast nephropathy risk in a patient with CKD, so the consent is not individualised.",
            "Hurrying an anxious patient on the table. Unless it is an emergency, deferral costs little.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-ind-1",
      stem: "A 62-year-old man has CCS class II angina controlled on bisoprolol and moderate inferior ischaemia on perfusion imaging. CT angiography shows no left main disease and LVEF is 55%. He asks whether a stent will help him live longer. Which statement best reflects the ISCHEMIA trial?",
      options: [
        "Invasive care did not cut the primary composite, but improved angina in those with angina.",
        "A routine invasive strategy reduced all-cause mortality over about three years of follow-up.",
        "PCI increased mortality in stable disease and should therefore be avoided in this patient.",
        "A routine invasive strategy reduced spontaneous MI at one year compared with medical therapy.",
        "ISCHEMIA included left main disease and showed a survival benefit in that subgroup.",
      ],
      answer: 0,
      explanation:
        "In ISCHEMIA, a routine invasive strategy did not reduce the primary composite endpoint compared with initial conservative management, but symptomatic patients had better angina control and quality of life. The tempting answer that invasive treatment reduced mortality is wrong: there was no mortality benefit. Left main disease was excluded, so the trial says nothing about it.",
      difficulty: 2,
      refs: ["ischemia-2020", "esc-ccs-2024", "spertus-ischemia-qol-2020"],
    },
    {
      id: "pci-q-ind-2",
      stem: "A 70-year-old with LVEF 28%, extensive multivessel disease and viable myocardium on MRI has no angina. Which statement reflects REVIVED-BCIS2?",
      options: [
        "PCI improved survival compared with optimal medical therapy alone.",
        "PCI improved LVEF at 6 and 12 months by revascularising the viable segments.",
        "CABG was superior to PCI for death and heart failure in this population.",
        "Demonstrating viability on MRI guarantees a survival benefit from PCI.",
        "PCI added to medical therapy did not cut death or heart failure admission.",
      ],
      answer: 4,
      explanation:
        "REVIVED-BCIS2 found no reduction in death or heart failure hospitalisation with PCI, and LVEF did not improve more with PCI. The LVEF option is tempting because restoring flow to viable myocardium sounds as though it should improve function, but the trial did not show it. REVIVED compared PCI with medical therapy, not with CABG.",
      difficulty: 2,
      refs: ["revived-2022"],
    },
    {
      id: "pci-q-ind-3",
      stem: "A 66-year-old non-diabetic man with stable angina has three-vessel disease with a SYNTAX score of 35. According to ESC/EACTS 2018 recommendations, which is correct?",
      options: [
        "PCI and CABG carry equal class I recommendations.",
        "CABG is recommended and PCI is not recommended.",
        "PCI is preferred because it avoids sternotomy.",
        "Medical therapy alone is recommended because of the high score.",
        "PCI is recommended if all lesions can be treated with second-generation DES.",
      ],
      answer: 1,
      explanation:
        "For three-vessel disease with a SYNTAX score above 22, CABG carries a class I and PCI a class III recommendation. Equal class I recommendations apply only to the low tertile in non-diabetic patients. Using newer stents does not change the anatomical complexity that drives the recommendation.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "syntax-2009"],
    },
    {
      id: "pci-q-ind-4",
      stem: "A 66-year-old woman has an NSTEMI with rising high-sensitivity troponin and a GRACE score of 152. She is pain free and haemodynamically stable with no arrhythmia. What timing of invasive angiography does the 2023 ESC ACS guideline suggest?",
      options: [
        "Immediate, within 2 hours",
        "Only after a non-invasive stress test",
        "Fibrinolysis followed by angiography within 24 hours",
        "Early, within 24 hours",
        "Within 7 days, at the next available elective list",
      ],
      answer: 3,
      explanation:
        "A confirmed NSTEMI with GRACE above 140 is high risk, for which an early invasive strategy within 24 hours should be considered. Immediate angiography is reserved for very high-risk features such as shock, refractory pain, life-threatening arrhythmia or acute heart failure. Fibrinolysis has no role in NSTE-ACS.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "pci-q-ind-5",
      stem: "Which finding in a patient with NSTE-ACS calls for immediate (within 2 hours) invasive angiography?",
      options: [
        "Recurrent pain with dynamic ST changes despite treatment",
        "A GRACE score of 145 on the admission risk assessment form",
        "A troponin rise without any accompanying ECG changes",
        "Type 2 diabetes treated with insulin for many years now",
        "Age over 75 years with chronic kidney disease, stage 3",
      ],
      answer: 0,
      explanation:
        "Refractory or recurrent pain with dynamic ECG changes despite treatment is a very high-risk feature and warrants immediate angiography. A GRACE score above 140 and a troponin rise are high-risk features that support an early (within 24 hours) approach, not an immediate one. Diabetes and age raise overall risk but do not set timing.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "pci-q-ind-6",
      stem: "Under UK law after the Montgomery judgment, which risks must you disclose when consenting a patient for PCI?",
      options: [
        "Only risks that occur in more than 1% of PCI procedures",
        "Those that a responsible body of interventional cardiologists would normally disclose to patients",
        "Only death and stroke, as these are the most serious and least reversible outcomes",
        "Risks a reasonable person in the patient's position, or this patient, would find material",
        "None, provided the patient signs the standard printed consent form for PCI",
      ],
      answer: 3,
      explanation:
        "Montgomery replaced the doctor-centred test with a patient-centred materiality test, which includes risks you know matter to this individual. The 'responsible body of doctors' option describes the older Bolam test, which no longer governs disclosure. A percentage cut-off misses rare but serious risks, and a signature does not show that the patient was informed.",
      difficulty: 1,
      refs: ["supplied-medmastery", "montgomery-2015"],
    },
    {
      id: "pci-q-ind-7",
      stem: "A 74-year-old with CCS class II angina on two antianginals has a severe proximal LAD stenosis. A hip replacement is planned in six weeks. What is the most appropriate plan?",
      options: [
        "Proceed with PCI using a bare-metal stent so that DAPT can be stopped before surgery.",
        "Proceed with PCI now and stop all antiplatelet therapy a week before the operation.",
        "Proceed with PCI and insist that the surgeons operate on full dual antiplatelet therapy.",
        "Refer for CABG instead, so that dual antiplatelet therapy is avoided altogether.",
        "If symptoms allow, defer PCI until after surgery and plan timing with the surgeons.",
      ],
      answer: 4,
      explanation:
        "Elective PCI shortly before major surgery forces a choice between operating on DAPT and stopping it early, which risks stent thrombosis. With stable symptoms, deferring PCI is usually best. Bare-metal stents no longer offer a safety advantage: guidelines recommend DES in all patients, including those with planned surgery. Stopping all antiplatelets a few weeks after stenting is dangerous.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "supplied-medmastery", "esc-ncs-2022"],
    },
    {
      id: "pci-q-ind-8",
      stem: "The Mehran score is used before PCI to estimate the risk of which complication?",
      options: [
        "Major bleeding at the access site",
        "Stent thrombosis within the first 30 days",
        "Contrast-associated acute kidney injury",
        "Perioperative death after CABG surgery",
      ],
      answer: 2,
      explanation:
        "The Mehran score combines factors such as hypotension, IABP use, heart failure, age, anaemia, diabetes, contrast volume and renal function to estimate contrast nephropathy risk after PCI. It is not a bleeding score; bleeding risk is assessed with ARC-HBR criteria or PRECISE-DAPT. Surgical mortality is estimated with EuroSCORE II.",
      difficulty: 1,
      refs: ["mehran-cin-2004", "supplied-medmastery", "urban-arc-hbr-2019"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2: peri-PCI pharmacology
// ---------------------------------------------------------------------------
const mPharmacology: Module = {
  id: "pci-pharmacology",
  title: "Peri-PCI pharmacology",
  stage: 3,
  summary:
    "Antiplatelet and anticoagulant strategy around PCI: which P2Y12 inhibitor and when, heparin and ACT, bail-out intravenous agents, DAPT duration and patients who also need oral anticoagulation. Doses are typical values only; always follow local protocol.",
  objectives: [
    "Choose aspirin and a P2Y12 inhibitor appropriately for chronic and acute coronary syndromes.",
    "Apply the 2023 ESC position on P2Y12 pretreatment in NSTE-ACS and STEMI.",
    "Dose unfractionated heparin for PCI and interpret the activated clotting time.",
    "Use GP IIb/IIIa inhibitors and cangrelor in their proper niches.",
    "Set a default DAPT duration and modify it for bleeding risk.",
    "Plan antithrombotic therapy after PCI in a patient who needs oral anticoagulation.",
  ],
  lessons: [
    {
      id: "pci-pharm-antiplatelets",
      title: "Oral antiplatelet agents, loading and pretreatment",
      minutes: 10,
      refs: ["supplied-medmastery", "esc-acs-2023", "esc-ccs-2024", "hanna-pcm", "brilakis-manual-pci", "isar-react5-2019"],
      blocks: [
        {
          kind: "p",
          text: "A freshly implanted stent is bare metal and polymer in contact with flowing blood until it is covered by endothelium. It cannot be removed, so thrombosis must be prevented with drugs. Dual antiplatelet therapy (DAPT) combines aspirin, which irreversibly blocks platelet cyclo-oxygenase-1 and so thromboxane A2 production, with a P2Y12 inhibitor, which blocks the platelet ADP receptor.",
        },
        {
          kind: "table",
          caption: "Oral antiplatelet agents: typical adult doses (check local protocol and the product information)",
          head: ["Drug", "Pharmacology", "Loading dose", "Maintenance", "Key cautions"],
          rows: [
            ["Aspirin", "Irreversible COX-1 inhibitor", "150–300 mg orally", "75–100 mg daily (75 mg in usual UK practice)", "True allergy is rare; GI bleeding"],
            [
              "Clopidogrel",
              "Prodrug; irreversible P2Y12 block after hepatic (CYP2C19) activation",
              "600 mg (300 mg gives a slower onset)",
              "75 mg daily",
              "Slower and more variable effect; reduced response with CYP2C19 loss-of-function variants",
            ],
            [
              "Prasugrel",
              "Prodrug; irreversible; more efficient activation than clopidogrel",
              "60 mg",
              "10 mg daily; 5 mg if aged 75 or over or weight below 60 kg",
              "Contraindicated after previous stroke or TIA",
            ],
            [
              "Ticagrelor",
              "Direct-acting, reversible P2Y12 inhibitor",
              "180 mg",
              "90 mg twice daily",
              "Dyspnoea, bradyarrhythmia; avoid with strong CYP3A4 inhibitors and after previous intracranial haemorrhage; keep aspirin maintenance at 100 mg or less",
            ],
          ],
        },
        { kind: "h", text: "Which P2Y12 inhibitor?" },
        {
          kind: "keypoints",
          items: [
            "Chronic coronary syndrome, elective PCI: aspirin plus clopidogrel is the default (2024 ESC CCS guideline). Prasugrel or ticagrelor may be considered in selected patients at high thrombotic risk, such as previous stent thrombosis or complex left main stenting.",
            "ACS: aspirin plus a potent agent, prasugrel or ticagrelor, unless contraindicated. The 2023 ESC ACS guideline suggests prasugrel should be considered in preference to ticagrelor for patients proceeding to PCI.",
            "Clopidogrel in ACS: when prasugrel and ticagrelor are contraindicated or unavailable, when bleeding risk is high, or when the patient also needs oral anticoagulation.",
            "Potent P2Y12 inhibitors act faster than clopidogrel, which helps in time-critical ACS, but onset still depends on gut absorption.",
          ],
        },
        { kind: "h", text: "Pretreatment and timing" },
        {
          kind: "p",
          text: "Pretreatment means loading a P2Y12 inhibitor before the coronary anatomy is known. In NSTE-ACS when an early invasive strategy (within 24 hours) is planned, the 2023 ESC ACS guideline recommends against routine pretreatment. It may be considered when angiography is not expected within 24 hours and bleeding risk is not high. In STEMI going for primary PCI, pretreatment may be considered. The reasons for restraint: no clear ischaemic benefit with rapid invasive pathways, more bleeding, and delay to surgery if the angiogram shows disease better treated by CABG.",
        },
        {
          kind: "table",
          caption: "Usual minimum interruption before elective CABG",
          head: ["Agent", "Stop at least"],
          rows: [
            ["Ticagrelor", "3 days"],
            ["Clopidogrel", "5 days"],
            ["Prasugrel", "7 days"],
          ],
        },
        {
          kind: "p",
          text: "For elective PCI, a 600 mg clopidogrel load reaches near-maximal effect after roughly two hours. If you load on the table immediately before stenting, platelet inhibition lags behind the stent, and your heparin is doing most of the work. Local protocols differ on reloading patients who are already taking maintenance clopidogrel.",
        },
        {
          kind: "pearl",
          text: "Opioids slow gastric emptying and delay the absorption of oral P2Y12 inhibitors. In a STEMI patient given morphine, effective platelet inhibition may arrive late. Crushing or chewing tablets speeds absorption; an intravenous agent (cangrelor) is an option in selected patients.",
        },
        {
          kind: "p",
          text: "Start or continue a high-intensity statin before PCI. Beyond long-term risk reduction, there is some evidence that statin loading before PCI reduces periprocedural myocardial injury, although the mechanism is uncertain.",
        },
        {
          kind: "pitfalls",
          items: [
            "Prasugrel in a patient with previous stroke or TIA.",
            "Ticagrelor with clarithromycin, ketoconazole or ritonavir (strong CYP3A4 inhibitors).",
            "Assuming a patient loaded with clopidogrel five minutes ago is protected.",
            "Forgetting the aspirin: check that it has actually been given before the case, especially in emergency transfers.",
            "Routine ticagrelor pretreatment in NSTE-ACS, then finding three-vessel disease that needs surgery.",
          ],
        },
      ],
    },
    {
      id: "pci-pharm-anticoagulation",
      title: "Anticoagulation in the lab: heparin, ACT and intravenous agents",
      minutes: 10,
      refs: ["supplied-medmastery", "esc-acs-2023", "esc-ccs-2024", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Every PCI requires anticoagulation. Wires, balloons and stents are thrombogenic, and thrombus can form on the equipment and in the guide as well as in the artery. Unfractionated heparin (UFH) is the default in most labs because it acts immediately, is cheap, is monitored at the bedside and can be reversed with protamine.",
        },
        {
          kind: "table",
          caption: "Parenteral anticoagulants for PCI: typical use (follow local protocol)",
          head: ["Agent", "Typical PCI use", "Points to remember"],
          rows: [
            [
              "Unfractionated heparin",
              "Bolus 70–100 units/kg without a GP IIb/IIIa inhibitor; 50–70 units/kg with one",
              "Check the ACT about 10 minutes after the bolus and about every 30 minutes in long cases; top up as needed",
            ],
            [
              "Enoxaparin",
              "Alternative, particularly if the patient is already on it for ACS",
              "Top-up depends on time since the last dose; avoid switching between UFH and enoxaparin, which increases bleeding",
            ],
            [
              "Fondaparinux",
              "Upstream anticoagulant in NSTE-ACS in many UK units",
              "Never use it alone for PCI: guide catheter thrombosis occurs. Give a full UFH bolus at the time of PCI",
            ],
            [
              "Bivalirudin",
              "Direct thrombin inhibitor; used in heparin-induced thrombocytopenia and as an alternative in selected primary PCI",
              "Short half-life; a post-PCI infusion reduces the risk of acute stent thrombosis after primary PCI",
            ],
          ],
        },
        { kind: "h", text: "The activated clotting time" },
        {
          kind: "p",
          text: "The ACT is a whole-blood clotting test performed in the lab. A common target during PCI with heparin alone is 250–350 seconds; with a GP IIb/IIIa inhibitor, a lower target of around 200–250 seconds is used. Values from different machines are not interchangeable, so learn the targets for your own lab's device. In long or complex cases, ask a team member to set a timer after each heparin dose and remind you to recheck. Once you are concentrating on a difficult lesion, it is easy to lose track of time.",
        },
        {
          kind: "steps",
          title: "Anticoagulation during a typical elective radial PCI",
          items: [
            { title: "At sheath insertion", detail: "Many operators give part of the heparin dose through the radial sheath (often with the spasmolytic cocktail) to protect the radial artery." },
            { title: "Before wiring the coronary", detail: "Complete the weight-based UFH dose. Never pass a coronary guidewire before heparin has been given." },
            { title: "Check the ACT", detail: "About 10 minutes after the bolus. If it is below target, give a further dose and recheck." },
            { title: "Long cases", detail: "Recheck roughly every 30 minutes and top up. Thrombus on a guide extension, microcatheter or wire is a warning that anticoagulation has lapsed." },
            { title: "End of case", detail: "Routine protamine is not given after uncomplicated PCI. Radial sheaths come out immediately; femoral sheaths are removed once the ACT has fallen (or with a closure device)." },
          ],
        },
        { kind: "h", text: "Intravenous antiplatelet agents" },
        {
          kind: "p",
          text: "GP IIb/IIIa inhibitors (eptifibatide, tirofiban) block the final common pathway of platelet aggregation, the binding of fibrinogen to the platelet IIb/IIIa receptor. Abciximab, the original agent, has been withdrawn in many countries. With modern oral P2Y12 inhibitors, their role has narrowed to bail-out: a large thrombus burden, no-reflow or a thrombotic complication during PCI. Routine upstream use is not recommended. Both small-molecule agents need dose adjustment in renal impairment.",
        },
        {
          kind: "pitfalls",
          title: "GP IIb/IIIa hazards",
          items: [
            "Bleeding, particularly in older, low-weight patients and those with CKD: reduce the heparin dose and check that the infusion rate matches renal function.",
            "Thrombocytopenia, which can be profound: check the platelet count within hours of starting and during the infusion.",
            "Femoral access with GP IIb/IIIa inhibition increases access-site bleeding; radial access helps.",
          ],
        },
        {
          kind: "p",
          text: "Cangrelor is an intravenous, direct and reversible P2Y12 inhibitor with an onset within minutes and an offset within about an hour of stopping. It may be considered in P2Y12-naive patients undergoing PCI who cannot absorb oral drugs reliably, for example after cardiac arrest, when intubated or in shock. The transition matters: clopidogrel and prasugrel should be loaded when the infusion stops, because they cannot bind while cangrelor occupies the receptor; ticagrelor can be given during the infusion.",
        },
        {
          kind: "pearl",
          text: "If you see fresh thrombus forming on equipment or in the guide, check the ACT before anything else. The cause is often simple: heparin not given, given into a tissued cannula, or worn off.",
        },
      ],
    },
    {
      id: "pci-pharm-dapt-duration",
      title: "DAPT duration and bleeding risk",
      minutes: 9,
      refs: ["esc-acs-2023", "esc-ccs-2024", "supplied-medmastery", "hanna-pcm", "urban-arc-hbr-2019", "esc-ncs-2022"],
      blocks: [
        {
          kind: "p",
          text: "After PCI, DAPT protects against stent thrombosis and, after ACS, against new events from other plaques. The price is bleeding, and bleeding after PCI carries its own excess mortality. Duration is set by the presentation (ACS or CCS), then adjusted for the patient's bleeding risk, ischaemic risk and any need for oral anticoagulation.",
        },
        {
          kind: "table",
          caption: "Default DAPT strategies (ESC ACS 2023 and CCS 2024, summarised)",
          head: ["Scenario", "Default", "Common modifications"],
          rows: [
            [
              "Elective PCI for CCS",
              "Aspirin plus clopidogrel for up to 6 months, then single antiplatelet therapy long term",
              "High bleeding risk: 1–3 months of DAPT. High ischaemic and low bleeding risk: longer therapy may be considered",
            ],
            [
              "PCI for ACS",
              "Aspirin plus prasugrel or ticagrelor for 12 months, then single antiplatelet therapy",
              "Event-free after 3–6 months and not high ischaemic risk: single antiplatelet therapy, preferably a P2Y12 inhibitor. High bleeding risk: aspirin or P2Y12 inhibitor monotherapy after 1 month. De-escalation to clopidogrel is an alternative strategy, but not in the first 30 days",
            ],
            [
              "Need for oral anticoagulation",
              "See the next lesson",
              "Aspirin is dropped early; clopidogrel is the P2Y12 inhibitor of choice",
            ],
          ],
        },
        { kind: "h", text: "Who is at high bleeding risk?" },
        {
          kind: "p",
          text: "The Academic Research Consortium for High Bleeding Risk (ARC-HBR) defines high bleeding risk as one major or two minor criteria. Major criteria include long-term oral anticoagulation, severe CKD (eGFR below 30), haemoglobin below 11 g/dL, spontaneous bleeding needing admission or transfusion in the past six months, platelet count below 100 × 10⁹/L, previous spontaneous intracranial haemorrhage, active malignancy and non-deferrable major surgery on DAPT. Minor criteria include age 75 or over, moderate CKD and milder anaemia. The PRECISE-DAPT score is an alternative; a score of 25 or more identifies high bleeding risk.",
        },
        {
          kind: "keypoints",
          title: "Reducing bleeding without losing stent protection",
          items: [
            "Radial access.",
            "A proton pump inhibitor for patients on DAPT at increased risk of GI bleeding. Many UK centres avoid omeprazole and esomeprazole with clopidogrel because of a metabolic interaction.",
            "Stop NSAIDs and review other drugs that raise bleeding risk.",
            "Choose clopidogrel rather than a potent agent when bleeding risk dominates.",
            "Shorten DAPT according to the guideline pathways rather than stopping all antiplatelet therapy.",
          ],
        },
        { kind: "h", text: "Surgery and invasive procedures" },
        {
          kind: "p",
          text: "Elective non-cardiac surgery is usually deferred until the planned DAPT course is complete: about 6 months after elective PCI and 12 months after ACS. If surgery cannot wait, the decision is shared between cardiologist, surgeon and anaesthetist. Aspirin is continued wherever the bleeding risk of the operation allows, and the P2Y12 inhibitor is stopped for the minimum time. Most dental work and minor procedures can be done on DAPT.",
        },
        {
          kind: "pearl",
          text: "The most dangerous moment for a new stent outside the lab is when someone stops DAPT without asking. Make sure the patient, the GP and the discharge letter all know the plan, the stop date and who to call before stopping.",
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming a bare-metal stent allows shorter DAPT: it does not reduce bleeding, and modern DES are recommended even when short DAPT is planned.",
            "Continuing prasugrel 10 mg in a patient who has turned 75 or weighs less than 60 kg.",
            "Switching potent P2Y12 inhibitors to clopidogrel in the first weeks after ACS without good reason.",
            "Discharge letters that say 'DAPT' without naming drugs, doses and a stop date.",
          ],
        },
      ],
    },
    {
      id: "pci-pharm-oac",
      title: "PCI in patients who need oral anticoagulation",
      minutes: 8,
      refs: ["esc-af-2024", "esc-acs-2023", "esc-ccs-2024", "supplied-medmastery"],
      blocks: [
        {
          kind: "p",
          text: "A sizeable minority of patients undergoing PCI also need oral anticoagulation (OAC), most often for atrial fibrillation, sometimes for venous thromboembolism or a mechanical heart valve. Combining OAC with DAPT (triple therapy) multiplies bleeding risk, so the strategy is to keep triple therapy as short as possible while still protecting the stent and preventing stroke.",
        },
        {
          kind: "table",
          caption: "Default strategy after PCI in a patient with AF on OAC (ESC ACS 2023 and AF 2024)",
          head: ["Phase", "Regimen", "Notes"],
          rows: [
            ["Peri-PCI, up to 1 week", "OAC + aspirin + clopidogrel", "Extend triple therapy up to 1 month only when thrombotic risk clearly outweighs bleeding risk"],
            ["Up to 12 months after ACS (up to 6 months after elective PCI)", "OAC + clopidogrel", "Shorter in high bleeding risk"],
            ["Thereafter", "OAC alone", "No long-term antiplatelet therapy in most patients"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "A DOAC is preferred over a vitamin K antagonist in eligible patients, at the full stroke-prevention dose unless the drug's own dose-reduction criteria are met.",
            "Clopidogrel is the P2Y12 inhibitor of choice. Prasugrel and ticagrelor are not recommended as part of triple therapy.",
            "Prescribe a proton pump inhibitor while the patient is on combined therapy.",
            "Mechanical heart valves need a vitamin K antagonist; DOACs are contraindicated.",
            "Radial access is strongly preferred.",
          ],
        },
        {
          kind: "p",
          text: "Management of the OAC around the procedure itself (uninterrupted or interrupted, and how much heparin to add) varies between centres and depends on the drug, the INR or time since the last DOAC dose, and the urgency. Follow local protocol and make the plan explicit in the notes before the patient comes to the lab.",
        },
        {
          kind: "p",
          text: "If a vitamin K antagonist is used alongside antiplatelet therapy, keep the INR in the lower part of the therapeutic range (commonly 2.0–2.5) with close monitoring, because time spent above range drives bleeding. Other OAC indications, such as venous thromboembolism or LV thrombus after anterior infarction, follow the same principles, but the duration of anticoagulation is often finite, which changes the plan once the OAC course ends.",
        },
        {
          kind: "table",
          caption: "Questions to answer before PCI in an anticoagulated patient",
          head: ["Question", "Why it matters"],
          rows: [
            ["Is OAC still indicated, and for how long?", "A finite course may end before the antiplatelet plan does"],
            ["Which drug and dose?", "DOAC preferred for AF; check renal function and dose-reduction criteria"],
            ["When was the last dose, or what is the INR?", "Determines procedural heparin dosing per local protocol"],
            ["Which access?", "Radial access reduces access-site bleeding"],
            ["What are the stop dates?", "Aspirin and clopidogrel each need an end date, and the PPI a review date, written on the discharge letter"],
            ["Who reviews the plan?", "Name the clinician responsible for each step-down so it actually happens"],
          ],
        },
        {
          kind: "pearl",
          text: "Before planning triple therapy, ask whether the anticoagulant is still needed. Recalculate stroke risk (the 2024 ESC AF guideline uses CHA2DS2-VA) and check the original indication: a provoked DVT from years ago may no longer justify OAC.",
        },
        {
          kind: "pitfalls",
          items: [
            "Twelve months of triple therapy by default.",
            "Prasugrel or ticagrelor added to OAC and aspirin.",
            "An empirically reduced DOAC dose 'because of the antiplatelets', which leaves the patient under-protected against stroke.",
            "No stop date for aspirin and clopidogrel on the discharge letter, so the GP continues them indefinitely.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-pharm-1",
      stem: "A 64-year-old with stable angina is listed for elective PCI of a single LAD lesion. He takes aspirin 75 mg. Which P2Y12 strategy is the usual default?",
      options: [
        "Ticagrelor 180 mg loading, then 90 mg twice daily",
        "Prasugrel 60 mg loading, then 10 mg daily",
        "No P2Y12 inhibitor; aspirin and heparin are sufficient",
        "Clopidogrel 600 mg loading, then 75 mg daily",
        "Cangrelor infusion during the procedure only",
      ],
      answer: 3,
      explanation:
        "For elective PCI in a chronic coronary syndrome, aspirin plus clopidogrel is the default. Ticagrelor and prasugrel are reserved for ACS or selected high thrombotic-risk elective cases, and they bring more bleeding. Aspirin alone does not protect a stent adequately.",
      difficulty: 1,
      refs: ["esc-ccs-2024", "supplied-medmastery"],
    },
    {
      id: "pci-q-pharm-2",
      stem: "A 68-year-old with NSTEMI needs PCI. He had a TIA two years ago. Which P2Y12 inhibitor should be avoided?",
      options: ["Clopidogrel", "Ticagrelor", "Prasugrel", "Cangrelor"],
      answer: 2,
      explanation:
        "Previous stroke or TIA is a contraindication to prasugrel, which showed net harm in that subgroup. Ticagrelor is the usual potent alternative. A history of intracranial haemorrhage, not TIA, is the main reason to avoid ticagrelor.",
      difficulty: 1,
      refs: ["esc-acs-2023"],
    },
    {
      id: "pci-q-pharm-3",
      stem: "A patient with NSTEMI is scheduled for angiography the next morning (within 24 hours). According to the 2023 ESC ACS guideline, what is the position on P2Y12 pretreatment?",
      options: [
        "Routine pretreatment is not recommended; give it once the anatomy is known.",
        "Load ticagrelor 180 mg on admission in all patients with a raised troponin.",
        "Load clopidogrel 600 mg on admission in all patients awaiting angiography.",
        "Start a GP IIb/IIIa inhibitor upstream instead of an oral P2Y12 inhibitor.",
        "Pretreatment is mandatory if the GRACE score is above 140 on admission.",
      ],
      answer: 0,
      explanation:
        "When early invasive management is planned, routine pretreatment is not recommended: it has not been shown to reduce ischaemic events and it increases bleeding and complicates urgent CABG. Loading ticagrelor on admission was common practice before 2023, which makes that option tempting. Upstream GP IIb/IIIa inhibitors are not recommended.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "pci-q-pharm-4",
      stem: "During elective PCI with heparin alone, what is a typical ACT target and when is it usually checked?",
      options: [
        "150–200 s, checked at the end of the case",
        "400–500 s, checked immediately after the bolus",
        "No ACT is needed if 70 units/kg has been given",
        "200–250 s, checked only if bleeding occurs",
        "250–350 s, checked about 10 minutes after the bolus",
      ],
      answer: 4,
      explanation:
        "A target of about 250–350 seconds, checked roughly 10 minutes after the bolus and rechecked in long cases, is widely used without GP IIb/IIIa inhibition. The lower 200–250 second range applies when a GP IIb/IIIa inhibitor is used. Weight-based dosing does not guarantee a therapeutic ACT, so it should be measured.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-pharm-5",
      stem: "A patient with NSTE-ACS has received fondaparinux 2.5 mg subcutaneously. She now comes to the lab for PCI. What anticoagulation is needed?",
      options: [
        "None; fondaparinux provides adequate anticoagulation for PCI.",
        "A full UFH bolus at the time of PCI.",
        "A second dose of fondaparinux intravenously.",
        "Protamine to reverse fondaparinux, then UFH.",
        "Bivalirudin is mandatory after fondaparinux.",
      ],
      answer: 1,
      explanation:
        "Fondaparinux alone during PCI is associated with guide catheter thrombosis, so a full UFH bolus is given at the time of PCI. Protamine does not reverse fondaparinux and is not needed. Bivalirudin is an alternative in some settings but is not required.",
      difficulty: 2,
      refs: ["esc-acs-2023", "hanna-pcm"],
    },
    {
      id: "pci-q-pharm-6",
      stem: "An intubated patient after out-of-hospital cardiac arrest with STEMI receives cangrelor during primary PCI. When should clopidogrel or prasugrel be loaded?",
      options: [
        "Before starting the cangrelor bolus",
        "Halfway through the cangrelor infusion",
        "When the cangrelor infusion is stopped",
        "Not until 48 hours after the infusion",
        "Never; cangrelor is continued for 30 days",
      ],
      answer: 2,
      explanation:
        "Clopidogrel and prasugrel cannot bind the P2Y12 receptor while cangrelor occupies it, so they are loaded when the infusion stops. Because cangrelor wears off within about an hour, waiting 48 hours would leave the stent unprotected. Ticagrelor is different: it can be given during the infusion.",
      difficulty: 3,
      refs: ["esc-acs-2023"],
    },
    {
      id: "pci-q-pharm-7",
      stem: "A 72-year-old with atrial fibrillation on apixaban undergoes PCI for NSTEMI. Bleeding risk is moderate and thrombotic risk average. What is the default antithrombotic plan?",
      options: [
        "Apixaban + aspirin + ticagrelor for 12 months, then apixaban alone",
        "Triple therapy up to 1 week, then apixaban + clopidogrel to 12 months, then apixaban",
        "Stop apixaban and give aspirin + prasugrel for 12 months, then restart apixaban",
        "Apixaban at a reduced dose + aspirin + clopidogrel for 6 months, then apixaban alone",
        "Aspirin + clopidogrel for 12 months, restarting apixaban once DAPT has been stopped",
      ],
      answer: 1,
      explanation:
        "The default is a short peri-PCI period of triple therapy (up to a week), then OAC plus clopidogrel up to 12 months after ACS, then OAC alone. Potent P2Y12 inhibitors are not recommended in triple therapy. Stopping the anticoagulant leaves the patient exposed to stroke, and empirical DOAC dose reduction under-treats AF.",
      difficulty: 2,
      refs: ["esc-af-2024", "esc-acs-2023"],
    },
    {
      id: "pci-q-pharm-8",
      stem: "In contemporary PCI, what is the main indication for a GP IIb/IIIa inhibitor?",
      options: [
        "Bail-out for large thrombus burden, no-reflow or a thrombotic complication",
        "Routine use in all elective PCI",
        "Upstream treatment of all NSTEMI patients before angiography",
        "Replacement for heparin in patients with CKD",
        "Prevention of radial artery spasm",
      ],
      answer: 0,
      explanation:
        "With potent oral P2Y12 inhibitors, GP IIb/IIIa inhibitors are mainly reserved for bail-out in thrombotic situations. Routine and upstream use increase bleeding without enough benefit. They supplement heparin rather than replace it, and their doses need reducing in CKD.",
      difficulty: 1,
      refs: ["esc-acs-2023", "supplied-medmastery"],
    },
    {
      id: "pci-q-pharm-9",
      stem: "A 58-year-old with NSTEMI was loaded with ticagrelor on admission. Angiography shows three-vessel disease and the heart team recommends CABG. What is the usual minimum interval after stopping ticagrelor before elective CABG?",
      options: ["24 hours", "3 days", "5 days", "7 days", "14 days"],
      answer: 1,
      explanation:
        "Ticagrelor is usually stopped at least 3 days before elective CABG. Clopidogrel needs about 5 days and prasugrel about 7, which makes the 5- and 7-day options tempting if you mix the agents up. Twenty-four hours is too short for an elective operation.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
  ],
  caseIds: ["pci-case-nstemi-thrombus"],
};

// ---------------------------------------------------------------------------
// Module 3: lesion assessment and planning
// ---------------------------------------------------------------------------
const mPlanning: Module = {
  id: "pci-planning",
  title: "Lesion assessment and making a plan",
  stage: 3,
  summary:
    "Reading the lesion before you touch it: severity, length, landing zones, side branches, calcium, thrombus and tortuosity; then turning that into a written plan with an equipment list, budgets and a bailout plan.",
  objectives: [
    "Estimate diameter stenosis and lesion length from angiography and recognise the limits of a luminogram.",
    "Classify lesions using the ACC/AHA scheme and identify features that change strategy.",
    "Define landing zones and anticipate side-branch and size-mismatch problems.",
    "Write a step-by-step plan for a straightforward PCI, including equipment, contrast and radiation budgets and a bailout plan.",
  ],
  lessons: [
    {
      id: "pci-plan-lesion-assessment",
      title: "Reading the lesion: severity, length and neighbours",
      minutes: 9,
      refs: ["supplied-medmastery", "supplied-oxford", "fame-2009", "eapci-imaging-2018", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "An angiogram shows only the lumen. Atheroma inside the wall is inferred from how far it narrows the contrast column, and arteries remodel outwards as plaque accumulates. Two segments with the same lumen can therefore carry very different amounts of plaque. Keep this in mind whenever an angiographically 'normal' segment is chosen as a reference or a landing zone.",
        },
        {
          kind: "formula",
          name: "Percentage diameter stenosis",
          expr: "%DS = (1 − MLD ÷ reference diameter) × 100",
          note: "MLD is the minimal lumen diameter. The reference is the nearest normal-looking segment; in diffuse disease the 'normal' segment is itself narrowed, so %DS underestimates severity.",
        },
        {
          kind: "table",
          caption: "Visual grading of diameter stenosis",
          head: ["Diameter stenosis", "Description"],
          rows: [
            ["0%", "No visible narrowing"],
            ["Under 25%", "Minimal"],
            ["25–49%", "Mild"],
            ["50–69%", "Moderate"],
            ["70–99%", "Severe"],
            ["100%", "Occlusion"],
          ],
        },
        {
          kind: "p",
          text: "Diameter and area are not the same thing. For a circular lumen, area stenosis = 1 − (1 − %DS)², so a 50% diameter stenosis removes about 75% of the cross-sectional area and a 70% diameter stenosis about 91%. Visual estimates are reasonably reliable for severe lesions and least reliable in the moderate range, which is where physiology and intravascular imaging earn their place.",
        },
        {
          kind: "keypoints",
          title: "Getting the views right",
          items: [
            "Plaque is often eccentric. Quantify a lesion on the view that shows it most severe, and always take at least two orthogonal views. Lesions are often underestimated on a single view, but rarely overestimated.",
            "Foreshortening makes a segment running towards or away from the detector look short. Choose the view that lays the segment out flat.",
            "Overlap with branches hides ostial disease. Modified or steep views may be needed, sometimes found by trial and error.",
            "Pause briefly on fluoroscopy before injecting so you can see calcium in the vessel wall.",
          ],
        },
        { kind: "h", text: "Length and landing zones" },
        {
          kind: "p",
          text: "Stents are usually placed from angiographically normal vessel to normal vessel. Landing an edge in plaque increases the risk of edge dissection, restenosis, inflow or outflow problems and a poor angiographic result. To measure length, use the view with least foreshortening and a reference of known size: the radiopaque tip of many workhorse wires is about 3 cm long (check the product information), and the markers of a balloon of known length make a convenient ruler. Calibrated quantitative coronary angiography helps, but it is prone to error with branches, bends, overlap and poor opacification.",
        },
        { kind: "h", text: "Side branches and size mismatch" },
        {
          kind: "list",
          items: [
            "Is there a side branch within or next to the lesion? Is it diseased, how large is it, and could it be lost when the main vessel is stented?",
            "Does the vessel taper markedly across the segment, for example where a large diagonal leaves? Sizing to the proximal vessel risks dissecting or rupturing the distal vessel; sizing to the distal vessel leaves the stent malapposed proximally unless it is post-dilated.",
            "In the RCA, a stent across a right ventricular branch can produce ST elevation in V1–V2 if the branch is occluded. Know this in advance so it does not alarm you.",
            "The conus branch can be occluded or selectively injected by a deep-seated catheter, and this may provoke ventricular fibrillation.",
          ],
        },
        { kind: "h", text: "When the angiogram is not enough" },
        {
          kind: "p",
          text: "Use pressure-wire physiology when you are unsure whether an intermediate lesion causes ischaemia; in FAME, FFR-guided PCI in multivessel disease reduced adverse events compared with angiography-guided PCI. Use IVUS or OCT when you need the true vessel size, the plaque composition, the extent of calcium or the length of disease. Both are covered in depth in the physiology and imaging track.",
        },
        { kind: "figure", id: "aha-segments", caption: "Describe the lesion by segment number so the whole team plans the same target." },
        {
          kind: "sim",
          sim: "views",
          task: "Find the projection that shows a mid-LAD lesion without foreshortening and without diagonal overlap. Compare RAO cranial with LAO cranial and decide which you would use as the working view.",
        },
      ],
    },
    {
      id: "pci-plan-lesion-types",
      title: "Lesion classification and special lesion types",
      minutes: 9,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "hanna-pcm", "jcto-2011"],
      blocks: [
        {
          kind: "p",
          text: "The ACC/AHA classification was developed in the balloon-angioplasty era to predict procedural success and complications. Stents have changed the numbers, but the classification remains a useful shared vocabulary for describing complexity. Type B lesions are subdivided into B1 (one type B feature) and B2 (two or more).",
        },
        {
          kind: "table",
          caption: "ACC/AHA lesion classification",
          head: ["Feature", "Type A", "Type B", "Type C"],
          rows: [
            ["Length", "Discrete, under 10 mm", "Tubular, 10–20 mm", "Diffuse, over 20 mm"],
            ["Access", "Readily accessible", "Moderate tortuosity of the proximal segment", "Excessive tortuosity of the proximal segment"],
            ["Angulation", "Under 45°", "45–90°", "Over 90°"],
            ["Contour and calcium", "Smooth; little or no calcium", "Irregular; moderate to heavy calcium", "As type B"],
            ["Position", "Not ostial; no major branch involved", "Ostial; bifurcation needing two wires", "Major side branch that cannot be protected"],
            ["Thrombus and occlusion", "No thrombus; not occlusive", "Some thrombus; occlusion under 3 months old", "Occlusion over 3 months old or with bridging collaterals; degenerated vein graft"],
          ],
        },
        { kind: "h", text: "Features that change strategy" },
        {
          kind: "table",
          head: ["Feature", "Why it matters", "Planning response"],
          rows: [
            [
              "Calcification",
              "The enemy of PCI: hinders crossing and delivery, and prevents full expansion. An underexpanded stent predisposes to thrombosis and restenosis",
              "Plan imaging; have NC, scoring or cutting balloons ready; agree an escalation route (atherectomy or lithotripsy, covered in the complex PCI track); choose a guide size that allows it",
            ],
            [
              "Thrombus",
              "Distal embolisation, slow flow and no-reflow",
              "Optimise antithrombotic therapy; avoid aggressive, oversized dilatation; consider direct stenting; have aspiration and bail-out drugs ready",
            ],
            [
              "Proximal tortuosity",
              "Device delivery failure; wire-induced pseudolesions",
              "Choose a supportive guide; plan a buddy wire or guide extension",
            ],
            [
              "Size mismatch or taper",
              "Edge injury distally or malapposition proximally",
              "Size to the distal reference and post-dilate the proximal segment with a larger NC balloon",
            ],
            [
              "Aorto-ostial lesion",
              "Elastic recoil and precise positioning",
              "Position with the guide backed out; the stent should just protrude (about 1 mm) into the aorta",
            ],
            [
              "Bifurcation or left main",
              "Side-branch compromise; large myocardium at risk",
              "Heart team for left main; imaging; bifurcation strategy (complex PCI track)",
            ],
            [
              "Saphenous vein graft",
              "Friable debris, distal embolisation, size mismatch with native vessel",
              "Consider embolic protection (complex PCI track)",
            ],
            [
              "Chronic total occlusion",
              "Occluded for at least 3 months; lower success; specialist kit and skills",
              "J-CTO scoring and referral to a CTO operator",
            ],
          ],
        },
        {
          kind: "pearl",
          text: "Wait a second before you inject on every acquisition. Calcium is much easier to see before contrast arrives, and you want to know about it before you are committed to a strategy.",
        },
        {
          kind: "pitfalls",
          items: [
            "Classifying a lesion from one view and missing its angulation or ostial involvement.",
            "Treating thrombus like a fibrotic plaque: big balloons at high pressure push debris downstream.",
            "Starting a calcified case in a 6 Fr guide when your escalation plan needs a larger burr.",
            "Assuming a tapering vessel can be treated with one stent size without a plan for the proximal segment.",
          ],
        },
      ],
    },
    {
      id: "pci-plan-making-plan",
      title: "Making the plan and the bailout plan",
      minutes: 10,
      refs: ["brilakis-manual-pci", "supplied-medmastery", "mehran-cin-2004", "radiation-consensus-2018", "seattle-complications-2020", "ncrp-168-2010"],
      blocks: [
        {
          kind: "p",
          text: "Plan before you touch the patient. Review the diagnostic films with PCI in mind and run through the whole procedure in your head, step by step, before the patient is on the table. For each step, decide what you will use, what can go wrong at that step, and what you will do about it. Be prepared, have a plan, communicate it, and know your bailout.",
        },
        {
          kind: "steps",
          title: "A planning checklist",
          items: [
            { title: "Indication and goal", detail: "Symptom relief, prognosis or culprit treatment in ACS? Which lesion, and what counts as success?" },
            { title: "Patient factors", detail: "DAPT plan, bleeding risk, renal function, anticoagulation, allergies, ability to lie flat." },
            { title: "Access", detail: "Radial by default; femoral or dual access if you need a larger guide or mechanical support. Check pulses and previous access history." },
            { title: "Guide", detail: "Shape and size for the root and the support needed. Choose strong support from the start for difficult anatomy." },
            { title: "Wire", detail: "A workhorse wire for most lesions; plan a second wire for an important side branch or as a buddy." },
            { title: "Lesion preparation", detail: "Balloon size and type, and the escalation route if the lesion does not yield." },
            { title: "Stent", detail: "Diameter from the distal reference or imaging, length normal to normal, and whether more than one stent is needed." },
            { title: "Optimisation", detail: "Post-dilatation balloon size, proximal optimisation if the vessel tapers across a branch, imaging targets." },
            { title: "Budgets", detail: "Maximum contrast volume, radiation dose and procedure time before you stop and rethink." },
            { title: "Bailout", detail: "The two or three complications most likely in this lesion, and confirmation that the kit to treat them is in the room." },
            { title: "Communicate", detail: "Brief the team: target, strategy, equipment and what you want them to watch for." },
          ],
        },
        {
          kind: "table",
          caption: "Anticipating complications by lesion type",
          head: ["Target", "Most likely problems", "Have ready"],
          rows: [
            ["Proximal LAD", "Guide trauma to the left main; diagonal or septal compromise; dissection", "Supportive guide used gently; second wire for a large diagonal; spare stents"],
            ["Calcified RCA", "Underexpansion; perforation; guide-induced ostial dissection", "NC and scoring balloons; covered stent; pericardiocentesis set"],
            ["Thrombotic culprit", "No-reflow; distal embolisation", "Intracoronary vasodilators, GP IIb/IIIa inhibitor, aspiration catheter"],
            ["Small distal vessel", "Distal wire perforation; edge dissection", "Coils or fat embolisation kit; small balloons"],
          ],
        },
        { kind: "h", text: "Contrast and radiation budgets" },
        {
          kind: "formula",
          name: "Contrast volume to creatinine clearance ratio",
          expr: "Ratio = contrast volume (mL) ÷ creatinine clearance (mL/min)",
          note: "Risk of contrast-associated kidney injury rises as the ratio increases. As a practical guide, many operators aim to keep it below about 2–3 in patients at risk. Set the limit before the case and say it out loud.",
        },
        {
          kind: "p",
          text: "For radiation, keep exposure as low as reasonably achievable: collimate, use low frame rates, avoid unnecessary magnification, keep the detector close to the patient and vary the projection in long cases so the same patch of skin is not exposed throughout. Labs set dose thresholds (commonly around 5 Gy reference air kerma) that trigger documentation and skin follow-up.",
        },
        { kind: "h", text: "Knowing when not to start, and when to stop" },
        {
          kind: "list",
          items: [
            "Reversible spasm that resolves with intracoronary nitrate needs no stent.",
            "Small right ventricular marginal branches and other small-territory vessels rarely justify the risk.",
            "Non-occlusive spontaneous coronary artery dissection with preserved flow is usually managed conservatively.",
            "Stop when the contrast, radiation or time budget is reached, or when the patient's condition changes. Coming back another day with a better plan is a legitimate outcome.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "No written plan, so each decision is made under pressure.",
            "Discovering mid-case that the covered stent, the 7 Fr guide or the pericardiocentesis set is not in the lab.",
            "Planning from one view of the lesion.",
            "Not telling the team the plan, so nobody can anticipate the next request.",
          ],
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Plan a 20 mm proximal LAD lesion: choose the pre-dilatation balloon, the stent diameter (from the distal reference) and length (normal to normal), and predict the NC post-dilatation balloon you will need for the proximal segment.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-plan-1",
      stem: "A lesion has a 50% diameter stenosis on QCA. Assuming a circular lumen, approximately what is the area stenosis?",
      options: ["25%", "50%", "65%", "75%", "90%"],
      answer: 3,
      explanation:
        "Area stenosis = 1 − (1 − 0.5)² = 0.75, so about 75%. Answering 50% confuses diameter with area. A 70% diameter stenosis corresponds to about 91% area stenosis, which explains why moderate-looking lesions can still matter.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-plan-2",
      stem: "A 15 mm lesion sits on a 60° bend in the mid circumflex and is moderately calcified. There is no thrombus or branch involvement. How is it classified by the ACC/AHA scheme?",
      options: ["Type A", "Type B1", "Type B2", "Type C"],
      answer: 2,
      explanation:
        "Length 10–20 mm, angulation 45–90° and moderate calcification are all type B features. Two or more type B features make the lesion B2. It would be type C only with features such as length over 20 mm, angulation over 90° or an old occlusion.",
      difficulty: 2,
      refs: ["supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "pci-q-plan-3",
      stem: "The proximal LAD measures 3.5 mm before a large diagonal and the mid LAD 2.75 mm after it. The lesion spans the diagonal origin. How should you size the stent?",
      options: [
        "A 3.5 mm stent deployed at high pressure along its full length to fit the proximal vessel",
        "A 2.75 mm stent deployed at rated burst pressure to stretch the proximal segment",
        "Two overlapping stents of 3.5 mm and 2.75 mm, joined at the diagonal origin",
        "Balloon angioplasty only, because the vessel tapers too much for a stent",
        "Size to the distal reference (2.75–3.0 mm), then post-dilate proximally with a larger NC",
      ],
      answer: 4,
      explanation:
        "In a tapering vessel, size to the distal reference to avoid dissecting or rupturing the distal vessel, then expand the proximal portion with a larger NC balloon so it is apposed proximally. A 3.5 mm stent along the full length risks distal injury. Deploying a 2.75 mm stent at rated burst pressure still leaves the proximal segment malapposed. Check that the platform can expand to the proximal diameter.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-plan-4",
      stem: "Why does coronary angiography tend to underestimate atherosclerotic burden?",
      options: [
        "Contrast dissolves soft plaque, so it is never opacified",
        "X-rays cannot penetrate calcified plaque, so it appears as part of the lumen",
        "Coronary arteries constrict during contrast injection, hiding plaque",
        "It images only the lumen, and arteries remodel outwards as plaque grows",
      ],
      answer: 3,
      explanation:
        "Angiography is a luminogram. Positive remodelling allows plaque to grow outwards while the lumen is preserved, so plaque burden is underestimated. Calcium actually shows up well on fluoroscopy, and contrast does not dissolve plaque.",
      difficulty: 1,
      refs: ["supplied-medmastery", "glagov-remodelling-1987"],
    },
    {
      id: "pci-q-plan-5",
      stem: "During stent deployment in the mid RCA, the patient develops ST elevation in V1 and V2 while the inferior leads stay unchanged. Flow down the RCA is TIMI 3. What is the most likely explanation?",
      options: [
        "Occlusion of a right ventricular branch by the stent",
        "LAD occlusion from catheter manipulation",
        "Acute stent thrombosis",
        "Air embolism into the left main stem",
        "Coronary perforation",
      ],
      answer: 0,
      explanation:
        "Occluding an RV marginal branch can cause right ventricular ischaemia that shows as ST elevation in V1–V2, mimicking an anterior event. Knowing this in advance prevents alarm. LAD occlusion is unlikely without left coronary manipulation, and stent thrombosis or air would affect the RCA territory and flow.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-plan-6",
      stem: "A patient with eGFR 32 mL/min needs PCI. Which measure has the best support for reducing contrast-associated kidney injury?",
      options: [
        "High-osmolar contrast, so that fewer injections are needed and the case is shorter",
        "Oral N-acetylcysteine the day before and the day after as the main preventive measure",
        "Intravenous isotonic hydration and keeping contrast within a preset budget",
        "Stopping the statin 48 hours before the procedure to reduce tubular toxicity",
        "Giving intravenous furosemide before contrast to flush the tubules",
      ],
      answer: 2,
      explanation:
        "Hydration with isotonic fluid and keeping contrast volume low, with a limit set relative to renal function, are the core measures. N-acetylcysteine has not shown consistent benefit. High-osmolar contrast increases risk, and pre-emptive diuretics can worsen volume depletion.",
      difficulty: 2,
      refs: ["mehran-cin-2004", "brilakis-manual-pci", "preserve-2018"],
    },
    {
      id: "pci-q-plan-7",
      stem: "You plan PCI of a heavily calcified proximal RCA. Which pre-procedure check best reflects the bailout principle?",
      options: [
        "Choosing the longest available stent so that all the calcium is covered at once",
        "Confirming that a covered stent and pericardiocentesis kit are in the lab",
        "Booking the patient for same-day discharge to keep the hospital stay short",
        "Planning not to use intracoronary imaging, to save time and contrast in a long case",
        "Selecting a 5 Fr guide to minimise access-site complications in a long procedure",
      ],
      answer: 1,
      explanation:
        "Calcified lesions carry a higher risk of perforation during high-pressure dilatation or plaque modification, so the kit to treat a perforation must be in the room before you start. Imaging is particularly useful in calcium, not something to skip, and a 5 Fr guide would limit your escalation options.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "seattle-complications-2020"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 4: guide catheters and support
// ---------------------------------------------------------------------------
const mGuides: Module = {
  id: "pci-guides",
  title: "Guide catheters and support",
  stage: 3,
  summary:
    "The guide catheter is the platform for everything that follows. Shapes, French size, passive and active support, coaxial engagement, pressure damping and side holes, and the techniques that rescue a case when support fails.",
  objectives: [
    "Describe how a guide catheter differs from a diagnostic catheter.",
    "Select a guide shape and size for common coronary anatomies from radial and femoral access.",
    "Distinguish passive from active support and recognise a non-coaxial guide.",
    "Recognise damped and ventricularised pressure traces and respond safely.",
    "Escalate support in a logical order: buddy wire, anchor balloon, deep seating, guide extension, guide change.",
  ],
  lessons: [
    {
      id: "pci-guides-shapes",
      title: "Guide anatomy and shapes",
      minutes: 9,
      refs: ["supplied-medmastery", "supplied-oxford", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "The guide catheter is arguably the most important device in PCI. Without it you cannot take good pictures or deliver anything into the artery. If the guide is unstable, every later step is harder.",
        },
        {
          kind: "table",
          caption: "Guide versus diagnostic catheter",
          head: ["Feature", "Diagnostic catheter", "Guide catheter"],
          rows: [
            ["Wall", "Thicker, smaller lumen for the same outer size", "Thin, braided wall: larger lumen and kink resistance"],
            ["Tip", "Tapered", "Soft and non-tapered: less traumatic and lets equipment exit freely"],
            ["Shaft", "Designed for engagement and injection", "Stiffer, designed to transmit support for devices"],
            ["Side holes", "Uncommon", "Optional, to allow perfusion around an obstructing tip"],
          ],
        },
        {
          kind: "p",
          text: "Most shapes have a primary curve near the tip, which points the catheter into the ostium, and a secondary curve further back, which rests against the aortic wall opposite the ostium and provides back-up. Extra-backup designs such as EBU, XB and Voda replace the two separate curves with one long curve that lies along the contralateral aortic wall. All guides warm up and soften in the body and lose some of their shape and support as the case goes on.",
        },
        {
          kind: "table",
          caption: "Common guide shapes",
          head: ["Shape", "Typical use", "Support", "Watch out for"],
          rows: [
            [
              "Judkins left (JL 3.5, 4, 5)",
              "Left coronary in normal anatomy, particularly LAD lesions. JL4 is standard from the femoral route; JL3.5 is often chosen from the right radial or in a small root; JL5 in a dilated root",
              "Modest, passive",
              "Points along the LAD, so support for the circumflex is poor",
            ],
            [
              "Extra-backup (EBU, XB, Voda types; 3.5, 3.75, 4.0)",
              "Default for many left coronary PCIs, LAD or circumflex",
              "Strong, from the long contralateral wall contact",
              "Can deep-seat into a short left main or select one branch",
            ],
            [
              "Amplatz left (AL 0.75–3)",
              "Circumflex, unusual or anomalous origins, some RCAs with a high origin, vein grafts",
              "Very strong; active",
              "Ostial dissection, especially in the RCA. To disengage, advance slightly so the tip backs out, then rotate; pulling straight back makes the tip dive deeper",
            ],
            [
              "Judkins right (JR4)",
              "RCA with a normal origin",
              "Weak; depends on active manipulation",
              "Deep intubation, conus selection and spasm",
            ],
            [
              "Amplatz right, Williams (3DRC), hockey stick",
              "RCA where JR4 is unstable, including high or shepherd's crook origins; hockey stick for some grafts",
              "Moderate to good",
              "As for any shaped catheter: coaxiality and gentle handling",
            ],
            [
              "Internal mammary (IM)",
              "Left or right internal mammary artery grafts",
              "Moderate",
              "Subclavian tortuosity; dissection at the graft origin",
            ],
            [
              "Ikari left and right",
              "Designed for radial access; use the contralateral wall for support",
              "Good",
              "Need practice to engage reliably",
            ],
            [
              "Multipurpose",
              "RCA with an inferior origin, vein grafts, femoral cases",
              "Modest; active",
              "Deep intubation",
            ],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "From the right radial, many operators choose a JL half a size smaller than they would from the femoral route.",
            "Choose support for the hardest part of the case, not the easiest. Changing guide later means exchanging over a wire you may lose.",
            "Get to know a small number of guides well so you can predict how they behave.",
          ],
        },
        {
          kind: "pearl",
          text: "Treat every guide with respect. Kink-resistant does not mean kink-proof, and a kinked guide in a radial artery can be very hard to remove. A guide that digs into the ostium can cause a catastrophic dissection, sometimes before you have even wired the vessel.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "From the right radial, seat an EBU 3.5 in the left coronary ostium, confirm a normal pressure trace, then inject in RAO cranial and LAO caudal to check that the tip is coaxial with the left main.",
        },
      ],
    },
    {
      id: "pci-guides-size-support",
      title: "Size, support, coaxiality and the pressure trace",
      minutes: 10,
      refs: ["supplied-medmastery", "supplied-oxford", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "formula",
          name: "French size",
          expr: "Outer diameter (mm) ≈ French size × 0.33",
          note: "A 6 Fr guide is about 2 mm across, which makes it a handy angiographic ruler. Sheaths are labelled by the largest catheter they accept; the sheath's own outer diameter is about 2 Fr larger.",
        },
        {
          kind: "table",
          caption: "Choosing guide size",
          head: ["Size", "Typical uses", "Considerations"],
          rows: [
            ["5 Fr", "Simple PCI; small radial arteries; deep intubation strategies", "Limited room for two devices; less support"],
            ["6 Fr", "The standard: most balloons, stents, imaging catheters and guide extensions; kissing balloons with most current balloons", "Default for radial access"],
            ["7 Fr", "Some two-stent bifurcation techniques, larger atherectomy burrs, extra support, some CTO strategies", "Radial possible in larger arteries or with thin-walled or sheathless systems"],
            ["8 Fr", "Largest burrs and complex combinations", "Usually femoral"],
          ],
        },
        {
          kind: "p",
          text: "Bigger is not always better. Larger guides are stiffer and give more support, but they are more likely to damage the coronary ostium and the access artery, and they may not pass through a small radial artery. A small guide can be advanced more safely into a coronary artery and may give excellent support when deeply engaged, although deep intubation needs experience because of the risk of dissection and impaired flow. A bigger size never compensates for the wrong shape.",
        },
        { kind: "h", text: "Passive and active support" },
        {
          kind: "p",
          text: "Passive support comes from the guide's shape and stiffness as it braces against the aortic wall: an EBU or Amplatz lying along the contralateral wall is the classic example. Active support comes from what you do with it: rotating to increase wall contact, or advancing the guide deeper into the vessel. In general, support increases with a larger guide, a stiffer guide, more contact with the aortic wall, and deeper engagement of a smaller guide.",
        },
        { kind: "h", text: "Coaxiality" },
        {
          kind: "p",
          text: "A coaxial guide has its tip aligned with the axis of the proximal vessel. When it is not coaxial, devices strike the vessel wall and stall, the guide is pushed out as you advance, contrast streams unevenly, and forceful pushing risks ostial dissection. Check engagement in at least two views; for the left main, LAO caudal and RAO caudal are useful. Correct a non-coaxial guide by rotating it, changing its size or changing its shape.",
        },
        { kind: "h", text: "Reading the pressure trace" },
        {
          kind: "table",
          head: ["Trace", "Appearance", "Usual meaning", "Response"],
          rows: [
            ["Normal aortic", "Brisk upstroke, dicrotic notch, well-maintained diastolic pressure", "Tip free in the ostium", "Inject"],
            ["Damped", "Both systolic and diastolic pressure fall; rounded, flattened waveform", "Tip against the wall, ostial stenosis, spasm, a guide too large for the vessel, or a kink", "Do not inject. Withdraw slightly or rotate; consider a different shape, a smaller guide or side holes"],
            ["Ventricularised", "Systolic pressure preserved but diastolic pressure low and rising through diastole, like a ventricular trace", "Tip obstructing inflow to the vessel", "Do not inject. Disengage and reassess"],
          ],
        },
        {
          kind: "p",
          text: "Injecting against a damped or ventricularised trace can raise a dissection flap, drive contrast into the wall and, in the RCA or conus branch, provoke ventricular fibrillation. Make checking the trace before every injection a habit, and ask the physiologist or nurse to call out changes.",
        },
        {
          kind: "p",
          text: "Side holes near the tip let blood enter the coronary artery even if the tip is obstructing the ostium, which helps in ostial disease or small vessels. The trade-offs: the pressure trace can look normal even when the tip is obstructing flow, opacification is poorer because contrast leaves through the side holes, the pressure measured during physiology is altered, and the tip region is weaker.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting on a damped trace because the trace was normal a minute ago.",
            "Over-torquing a small guide, especially without a wire inside it, until it kinks.",
            "Forgetting the guide while concentrating on the stent: an EBU can drift deep into the left main as devices are withdrawn.",
            "Trusting a normal-looking trace from a guide with side holes.",
          ],
        },
      ],
    },
    {
      id: "pci-guides-escalation",
      title: "When support fails: escalation techniques",
      minutes: 9,
      refs: ["brilakis-manual-pci", "supplied-medmastery", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Inadequate support announces itself: the guide backs out of the ostium as you push, the wire prolapses into the aorta, or a balloon or stent stops short while your hand keeps moving. Do not push harder. Stop, look at the guide and the wire, and work out why the device will not advance. There are three usual reasons: the guide is not supportive or coaxial, the lesion is not adequately prepared, or proximal tortuosity, calcification or disease is causing friction. Device profile is a fourth.",
        },
        {
          kind: "table",
          caption: "Techniques to increase support",
          head: ["Technique", "How", "Advantages", "Risks and pitfalls"],
          rows: [
            ["Gentle forward pressure on the guide", "Push the guide slightly while advancing the device; a deep breath can also change the geometry", "Simple and quick", "Overdone, it becomes uncontrolled deep intubation"],
            ["Buddy wire", "Add a second wire, often extra-support, alongside the first", "Straightens bends, reduces friction, stabilises the guide", "Wire wrap; the buddy wire must come out before the stent is deployed"],
            ["Side-branch anchor balloon", "Inflate a small balloon in a side branch to lock the guide in place", "Strong, quick", "Injury to the side branch"],
            ["Deep intubation", "Advance the guide over a balloon shaft into the proximal vessel", "Strong support", "Ostial or proximal dissection, ischaemia, damping; safer with smaller guides"],
            ["Guide extension", "A short flexible tube on a push rod, advanced through the guide into the vessel", "Major support; brings devices close to the lesion", "Proximal dissection, ischaemia, damping, and stents catching on the collar"],
            ["Change of guide", "Exchange for a stronger shape (JL to EBU, JR to Amplatz) or larger size", "Fixes the root cause", "Needs an exchange-length wire, a wire extension or a trapping technique to keep the wire across"],
            ["Sheathless guide", "A guide inserted directly into the radial artery without a sheath", "A 7.5 Fr sheathless guide has a smaller outer diameter than a 6 Fr guide in its sheath, but a larger lumen", "Stiffer; more guide-related dissection; harder to exchange"],
            ["Mother-and-child", "A smaller guide passed inside a larger one", "Deep, coaxial support", "As for deep intubation"],
          ],
        },
        { kind: "h", text: "Using a guide extension safely" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Advance it over a balloon catheter rather than over the bare wire, so its leading edge does not scrape the vessel. An inflated balloon anchored at the lesion can be used to pull the extension into the artery.",
            "Watch the pressure trace and the patient: an extension in the vessel can obstruct flow and cause ischaemia.",
            "If stents catch at the collar where the extension joins its push rod, do not force them. Withdraw and reassess the angle at the guide tip.",
            "For a long segment, take the extension distally and stent from distal to proximal as it is withdrawn.",
            "Before deploying a stent, make sure it is fully out of the extension.",
            "At the end, take a final angiogram of the proximal vessel to check for injury from the extension.",
          ],
        },
        {
          kind: "steps",
          title: "A stent that will not reach the lesion",
          items: [
            { title: "Stop", detail: "Do not push harder. Check the guide position, the wire tip and the patient." },
            { title: "Locate the problem", detail: "Is the stent stopping at a proximal bend or calcified segment, or at the lesion itself?" },
            { title: "If at the lesion", detail: "The lesion is probably not prepared enough: return to balloons (larger, NC, scoring) before trying again." },
            { title: "If proximal", detail: "Reduce friction and increase support: buddy wire, anchor, guide extension or a better guide." },
            { title: "Reconsider the device", detail: "A shorter or lower-profile stent may track where a long one will not." },
            { title: "Withdraw safely", detail: "If you abandon delivery, make the guide coaxial first and withdraw the stent under fluoroscopy. Pulling hard against a non-coaxial guide tip is how stents are stripped off the balloon." },
          ],
        },
        {
          kind: "pearl",
          text: "The cheapest support technique is the right guide at the start. Most guide exchanges in the middle of a case happen because a weak shape was chosen for an anatomy that was already known to be difficult.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-guide-1",
      stem: "What is the approximate outer diameter of a 6 Fr guide catheter?",
      options: ["1 mm", "2 mm", "3 mm", "6 mm", "0.6 mm"],
      answer: 1,
      explanation:
        "One French is about 0.33 mm, so 6 Fr is about 2 mm. This makes the guide a useful reference for estimating vessel size on the angiogram. The 6 mm option confuses French with millimetres.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-guide-2",
      stem: "You are planning PCI of a mid circumflex lesion via the femoral route in a patient with a normal aortic root. Which guide gives the best balance of support and safety?",
      options: [
        "JL4 (Judkins left 4)",
        "JR4 (Judkins right 4)",
        "EBU (extra-backup) 3.75",
        "Multipurpose A2 shape",
        "Internal mammary (IMA) curve",
      ],
      answer: 2,
      explanation:
        "An extra-backup guide sits along the contralateral aortic wall and supports both LAD and circumflex PCI. A JL4 points along the LAD and gives poor support for the circumflex, which makes it the tempting but weaker choice. An Amplatz left (not offered here) would also support well but carries more risk of ostial trauma. JR4, multipurpose and IM shapes are designed for other targets.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-guide-3",
      stem: "After engaging the RCA, the pressure trace shows preserved systolic pressure but low diastolic pressure that rises through diastole. What should you do?",
      options: [
        "Do not inject; disengage the guide and reassess",
        "Inject contrast quickly to confirm the position",
        "Give intracoronary nitrate through the guide and inject",
        "Advance the guide deeper for better support",
        "Ignore it, as it is a transducer artefact",
      ],
      answer: 0,
      explanation:
        "This is a ventricularised trace: the tip is obstructing flow into the vessel. Injecting risks dissection and ventricular fibrillation. Nitrate may help spasm, but only after the guide has been withdrawn so the trace normalises. Advancing deeper worsens the obstruction.",
      difficulty: 1,
      refs: ["supplied-medmastery", "supplied-oxford"],
    },
    {
      id: "pci-q-guide-4",
      stem: "How should you disengage an Amplatz left guide from the RCA or left main?",
      options: [
        "Pull it straight back briskly so the tip clears the ostium",
        "Inject contrast forcefully to push the tip out of the vessel",
        "Withdraw the wire first, then pull the catheter back into the aorta",
        "Advance it slightly so the tip backs out, then rotate away",
      ],
      answer: 3,
      explanation:
        "With Amplatz curves, pulling back makes the tip dive deeper into the vessel and risks dissection. Advancing slightly lifts the tip out of the ostium, after which the guide can be rotated away. Forceful injection is never a way to move a catheter.",
      difficulty: 2,
      refs: ["supplied-oxford", "hanna-pcm"],
    },
    {
      id: "pci-q-guide-5",
      stem: "What is the main disadvantage of a guide catheter with side holes?",
      options: [
        "It cannot be used from the radial artery",
        "It doubles the contrast volume needed for each injection",
        "It is incompatible with 0.014 inch wires",
        "It increases the risk of air embolism",
        "It can mask pressure damping and reduces coronary opacification",
      ],
      answer: 4,
      explanation:
        "Side holes let aortic blood reach the transducer and the vessel, so the trace may look normal even when the tip is obstructing the ostium, and contrast escapes through the holes, so opacification is poorer. Contrast use is somewhat higher for the same image quality, but doubling is an exaggeration, and side holes do not affect wire compatibility or radial use.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-guide-6",
      stem: "A stent will not advance to a well-prepared mid-LAD lesion. Each time you push, the JL3.5 guide backs out of the left main. The wire is well positioned distally. What is the most appropriate next step?",
      options: [
        "Push the stent harder while pulling back on the wire to straighten the system",
        "Deploy the stent where it has stopped and then dilate the lesion through it",
        "Remove the wire and try a different wire with a stiffer shaft first",
        "Withdraw the stent and add support: a guide extension or an extra-backup guide",
        "Pre-dilate again with a larger semi-compliant balloon at high pressure, then retry",
      ],
      answer: 3,
      explanation:
        "The problem is guide support, not lesion preparation, so the fix is more support: a guide extension, a buddy wire, or exchange to an extra-backup guide over an exchange-length wire. Pushing harder while pulling the wire risks losing both guide and wire and can cause dissection. Deploying a stent in the wrong place commits you to a poor result, and removing a well-placed wire throws away your access.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "supplied-medmastery"],
    },
    {
      id: "pci-q-guide-7",
      stem: "Why might an operator use a 7.5 Fr sheathless guide via the radial artery?",
      options: [
        "Its outer diameter is below a 6 Fr guide in a sheath, yet its lumen is larger",
        "It allows insertion of an intra-aortic balloon pump through the same radial artery",
        "It is more flexible and less likely to dissect the ostium than a standard guide",
        "It removes the need for systemic heparin because no sheath sits in the artery",
      ],
      answer: 0,
      explanation:
        "Without a sheath, a 7.5 Fr sheathless guide has a smaller total outer diameter than a standard 6 Fr guide in its sheath, yet offers a larger lumen for complex equipment. Sheathless guides are actually stiffer and associated with more guide-related dissection, not less. Mechanical support devices are not placed through the radial artery.",
      difficulty: 3,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage the left coronary with a JL3.5 and then an EBU 3.5 from the right radial; compare how coaxial each sits in RAO caudal and LAO caudal, and watch the pressure trace as you advance each one deeper." },
  ],
  caseIds: ["pci-case-lad-support"],
};

// ---------------------------------------------------------------------------
// Module 5: coronary guidewires
// ---------------------------------------------------------------------------
const mWires: Module = {
  id: "pci-wires",
  title: "Coronary guidewires",
  stage: 3,
  summary:
    "How workhorse wires are built, how to shape and steer them, how to cope with tortuosity and pseudolesions, when to use buddy, polymer-jacketed and extra-support wires, and how to keep the distal tip out of trouble.",
  objectives: [
    "Relate wire construction (core, tip, coating, tip load, support) to handling.",
    "Shape a wire tip appropriately for vessel size and branch angle.",
    "Steer a wire through a lesion safely and confirm true-lumen distal position.",
    "Recognise pseudolesions and manage buddy wires.",
    "Choose a safe distal wire position and maintain it throughout the case.",
  ],
  lessons: [
    {
      id: "pci-wires-construction",
      title: "How a coronary wire is built",
      minutes: 8,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "brilakis-manual-cto", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Without a wire across the lesion, nothing else can be delivered. A coronary wire has to do several things at once: be visible on fluoroscopy, transmit rotation from your fingers to the tip (torque), be steerable, flex around bends, be stiff enough to push, support balloons and stents along its length, and tell your fingers what the tip is doing. No single wire is best at all of these, which is why there are so many.",
        },
        {
          kind: "table",
          caption: "Wire anatomy and what each component changes",
          head: ["Component", "Options", "Effect on handling"],
          rows: [
            ["Diameter", "0.014 inch is standard", "Fits all rapid-exchange and over-the-wire coronary devices"],
            ["Length", "About 180–190 cm for rapid exchange; about 300 cm exchange length; extension wires", "Long wires or extensions are needed for over-the-wire exchanges"],
            ["Core material", "Stainless steel; nitinol; composite", "Steel transmits torque and push well; nitinol is flexible, kink-resistant and springs back straight after bending, but transmits torque less precisely"],
            ["Core design", "Core-to-tip or shaping ribbon", "Core-to-tip gives better torque and tip control; a shaping ribbon is softer and holds a shape"],
            ["Tip covering", "Spring coil or polymer jacket", "Coils give tactile feedback; polymer jackets glide through tortuosity and tiny channels but tell you less"],
            ["Coating", "Hydrophilic or hydrophobic", "Hydrophilic reduces friction but increases the risk of entering the wall or a small branch unnoticed"],
            ["Tip load", "Grams of force to buckle the tip", "Workhorse wires have soft tips (around 1 g or less); CTO wires are much stiffer"],
            ["Shaft support", "Light, moderate (workhorse), extra support", "More support delivers devices but straightens vessels and creates pseudolesions"],
            ["Radiopaque segment", "Often about 3 cm on workhorse wires", "Lets you see the tip; also a rough ruler"],
          ],
        },
        {
          kind: "table",
          caption: "Wire families",
          head: ["Family", "Typical features", "Use", "Caution"],
          rows: [
            ["Workhorse", "Soft coil tip, moderate support, often hydrophilic coating on the coil", "The large majority of lesions", "Know two or three well"],
            ["Polymer-jacketed hydrophilic", "Slippery jacket over the tip", "Severe tortuosity, very tight lesions, small channels", "Higher risk of dissection and distal perforation; less feedback"],
            ["Extra-support", "Stiff shaft, often a soft tip", "Straightening tortuosity, delivering devices, buddy wire", "Pseudolesions; vessel trauma; poorer steering"],
            ["CTO wires", "Tapered or stiff tips with high tip load", "Chronic total occlusions, usually with a microcatheter", "Dangerous in routine PCI; taught in the CTO module"],
            ["Specialist", "Atherectomy wires, pressure wires", "Specific devices and physiology", "Follow device-specific instructions"],
          ],
        },
        {
          kind: "p",
          text: "A torque device clipped to the wire gives grip, which is especially useful with slippery hydrophilic wires. Some operators prefer bare fingers for most of the case because the device dampens feel. Either way, keep the wire wet and clean: blood and contrast make it sticky and impede balloons and stents.",
        },
        {
          kind: "keypoints",
          items: [
            "Start with a workhorse wire and escalate only for a reason you can name.",
            "Learn the behaviour of a small number of wires in your own hands before trying many.",
            "Tip load measures how stiff the tip is, not how supportive the shaft is. The two are independent properties.",
          ],
        },
      ],
    },
    {
      id: "pci-wires-shaping-steering",
      title: "Shaping and steering",
      minutes: 9,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Most coronary wires come straight and are shaped by the operator to suit the vessel. The shape should match the diameter of the vessel you are navigating and the angle of the branch you need to enter. A small primary bend at the tip lets you steer; a second, larger bend further back helps in large vessels and at acute take-offs.",
        },
        {
          kind: "steps",
          title: "Preparing the wire",
          items: [
            { title: "Wet the wire", detail: "Flush the hoop with heparinised saline; hydrophilic coatings only work when wet." },
            { title: "Shape the tip", detail: "Use the introducer needle or a shaping tool to make a gentle curve. Avoid crimping, which damages the coil or jacket and ruins torque response." },
            { title: "Choose the bend", detail: "For most lesions, a short bend of 1–2 mm at roughly 30–45°. Add a longer secondary bend for large vessels or sharply angled branches." },
            { title: "Load", detail: "Back-load the tip into the introducer, pass it through the haemostatic valve and advance it to the guide tip under fluoroscopy." },
            { title: "Attach a torque device", detail: "Optional, a comfortable distance from the valve." },
          ],
        },
        {
          kind: "table",
          caption: "Matching the tip shape to the task",
          head: ["Task", "Shape", "Reason"],
          rows: [
            ["Typical lesion in a medium-sized vessel", "Small single bend, 1–2 mm", "Precise steering without catching the wall"],
            ["Tight lesion or small channel", "Very small bend, about 1 mm", "A long curve cannot enter a small lumen"],
            ["Large proximal vessel with a branch to select", "Longer primary bend or a second bend", "The tip must reach across the vessel to find the ostium"],
            ["Acutely angled branch (for example circumflex from a short left main)", "Larger or double bend; consider a microcatheter", "Gives the tip reach and direction"],
          ],
        },
        { kind: "h", text: "Steering technique" },
        {
          kind: "steps",
          items: [
            { title: "Roadmap", detail: "Freeze the frame that shows the lesion best and display it next to live fluoroscopy, so you are not injecting contrast every few seconds." },
            { title: "Point, then push", detail: "Rotate the tip to face the direction you want, then advance. Rotate in small increments (a quarter turn or so)." },
            { title: "Watch the tip", detail: "It should move freely and change direction when you turn it, especially through diseased segments." },
            { title: "Resistance means stop", detail: "If the tip buckles or stops, pull back, rotate and try again. Never push against resistance: a pushed tip lifts flaps and dissects." },
            { title: "Confirm the position", detail: "Check in an orthogonal view that the wire follows the course of the vessel you intend to treat and moves freely distally." },
            { title: "Park it", detail: "Position the tip distally for support but in a vessel large enough to tolerate it." },
          ],
        },
        {
          kind: "p",
          text: "Confirm which branch you are in before advancing anything over the wire. In the LAD, the main vessel runs to and often around the apex, septal branches are straight and short and run towards the septum, and diagonals head out over the lateral wall. A second view almost always settles it.",
        },
        {
          kind: "pitfalls",
          items: [
            "Spinning the wire many turns in one direction: the tip can become trapped or the coil can unravel and fracture.",
            "Pushing a buckled tip through a lesion and creating a dissection.",
            "Delivering a balloon into a side branch because the wire position was confirmed in only one view.",
            "An oversized tip curve that catches in every branch and will not enter the lesion.",
          ],
        },
        {
          kind: "pearl",
          text: "Wire husbandry is a team skill. Before anyone moves anything, say who has the wire: 'I have the wire' and 'Do you have the wire?' are not pedantry, they are how wires stay where you put them.",
        },
      ],
    },
    {
      id: "pci-wires-difficult-anatomy",
      title: "Tortuosity, buddy wires and wire safety",
      minutes: 9,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "brilakis-manual-cto", "ellis-1994"],
      blocks: [
        {
          kind: "p",
          text: "In a tortuous artery, the wire takes the shortest route around each bend and presses against the inner curve. This wire bias increases friction for balloons and stents and can direct a device, such as an atherectomy burr, preferentially against one wall.",
        },
        { kind: "h", text: "Pseudolesions" },
        {
          kind: "p",
          text: "A stiff wire straightens a tortuous segment, and the redundant vessel wall folds inwards like a concertina. The result looks like new stenoses or even a dissection where there was none before. Recognise the pattern before you stent it.",
        },
        {
          kind: "table",
          head: ["Feature", "Pseudolesion", "True lesion or dissection"],
          rows: [
            ["Timing", "Appears after a stiff wire or device straightens the vessel", "Present before, or appears after balloon injury"],
            ["Site", "At bends in a tortuous segment", "Anywhere, often at the treated lesion or stent edge"],
            ["Response to withdrawing the wire to its floppy segment, or exchanging for a softer wire", "Resolves", "Persists"],
            ["Flow", "Usually preserved", "May be reduced"],
          ],
        },
        { kind: "h", text: "Buddy wires" },
        {
          kind: "list",
          items: [
            "A second wire alongside the first straightens bends, reduces friction and steadies the guide.",
            "Devices do not always travel more easily on the stiffer wire: because of wire bias, the softer wire is sometimes the better rail.",
            "Wires interact: they can wrap around each other, and advancing a device on one can push the other forward.",
            "Mark or label the wires outside the patient and keep them apart, for example with a spare torque device on one.",
            "Remove the buddy wire before deploying the stent. A wire trapped behind a stent, particularly in a calcified vessel, can be very hard to remove. Bifurcation techniques that deliberately jail a side-branch wire are a separate topic in the complex PCI track.",
            "When removing a buddy wire, double-check you are not pulling out the wire carrying the stent.",
          ],
        },
        { kind: "h", text: "Distal wire position and perforation" },
        {
          kind: "p",
          text: "Place the wire tip as far distally as is safe, because distal position gives support for devices. But watch the tip throughout the case, particularly while balloons and stents are advanced: the wire tends to jump forward, and a tip driven into a small terminal branch can perforate it. Hydrophilic and polymer-jacketed tips are the usual culprits. A small distal perforation may show only as a faint blush and present hours later with tamponade, after the patient has left the lab.",
        },
        {
          kind: "keypoints",
          items: [
            "Keep the wire tip inside the field of view, even when you collimate.",
            "Prefer a large distal vessel or branch to a tiny apical twig.",
            "After crossing with a polymer-jacketed wire, consider exchanging to a workhorse wire through a microcatheter or over-the-wire balloon.",
            "Fix the wire with one hand whenever devices are advanced or withdrawn: forward movement risks perforation, backward movement loses the wire.",
            "Look at the distal wire position on the final angiogram.",
          ],
        },
        { kind: "figure", id: "ellis", caption: "Distal wire exits range from a small extraluminal crater or blush to frank extravasation. Even small ones can cause delayed tamponade; management is covered in the complications track." },
        { kind: "h", text: "Microcatheters" },
        {
          kind: "p",
          text: "A microcatheter is a very small-calibre catheter that can be advanced deep into the coronary tree over the wire. It improves wire support and steering, allows wire exchange without losing position, and allows drugs or contrast to be delivered distally. It can also take a stiffer wire straight to an occlusion without dragging that wire through normal vessel, which is how CTO wires are used.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting over a pseudolesion.",
            "Trapping a buddy wire behind a stent.",
            "Losing sight of the wire tip while concentrating on the stent.",
            "Using a hydrophilic polymer-jacketed wire as the default for straightforward lesions.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-wire-1",
      stem: "What does the 'tip load' of a coronary guidewire describe?",
      options: [
        "The support the shaft provides for stent delivery",
        "The force in grams needed to buckle the tip",
        "The length of the radiopaque segment",
        "The maximum torque the wire tolerates before fracture",
        "The thickness of the hydrophilic coating",
      ],
      answer: 1,
      explanation:
        "Tip load is the force needed to bend or buckle the distal tip, a measure of tip stiffness and penetrating ability. It is independent of shaft support, which is why a wire can have a soft tip and an extra-support shaft. The radiopaque length and coating are separate properties.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "brilakis-manual-cto"],
    },
    {
      id: "pci-q-wire-2",
      stem: "You need to cross a tight lesion in a mid-sized LAD with a workhorse wire. Which tip shape is most appropriate?",
      options: [
        "A small bend of about 1–2 mm at the distal tip",
        "A long, wide curve of 8–10 mm",
        "A straight, unshaped tip",
        "A J-shaped curve like a 0.035 inch access wire",
      ],
      answer: 0,
      explanation:
        "A small distal bend allows precise steering and fits into a narrow lumen. A long, wide curve is useful for reaching branches in a large vessel but catches the wall and will not enter a tight lesion. A straight tip cannot be steered.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-wire-3",
      stem: "While crossing a mid-RCA lesion, the wire tip buckles and stops moving when rotated. What should you do?",
      options: [
        "Push firmly so that the tip gets through the resistance",
        "Spin the wire rapidly in one direction until the tip moves",
        "Inject contrast forcefully to open up the lumen ahead of the tip",
        "Follow the wire with a balloon to see where the tip has gone",
        "Withdraw slightly, rotate and re-advance with a free tip",
      ],
      answer: 4,
      explanation:
        "A tip that buckles or does not respond to rotation is caught in the wall, a side branch or plaque. Pull back, redirect and re-advance only when the tip moves freely. Pushing against resistance lifts a flap and causes dissection. Following with a balloon before you know the wire is in the true lumen can extend a dissection.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-wire-4",
      stem: "After an extra-support wire is advanced into a tortuous RCA, two new 'stenoses' appear at bends that were not narrowed before. Flow is TIMI 3. What is the most likely explanation and the best test?",
      options: [
        "Wire-induced dissection at both bends; stent both segments immediately",
        "Spasm at the bends; give intracoronary verapamil and nitrate, and stent if it persists",
        "Pseudolesions from straightening; pull back to the floppy part or use a softer wire",
        "Thrombus forming on the wire; start a GP IIb/IIIa inhibitor and repeat the run",
        "Distal embolisation of plaque; perform aspiration thrombectomy at both sites",
      ],
      answer: 2,
      explanation:
        "New narrowings at bends after a stiff wire has straightened a tortuous vessel are classic pseudolesions. They disappear when the stiff part of the wire is withdrawn or exchanged. Stenting them is a serious error. Spasm can coexist, but stenting is not the response to either.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-wire-5",
      stem: "A stent has been delivered to a calcified LAD lesion with the help of a buddy wire. What must happen before deployment?",
      options: [
        "Advance the buddy wire further distally to anchor the system",
        "Leave both wires in place so that the side branch stays protected during deployment",
        "Inflate a balloon on the buddy wire at the same time as the stent",
        "Remove the buddy wire, checking it is not the wire carrying the stent",
      ],
      answer: 3,
      explanation:
        "A buddy wire left beside the stent will be trapped against the vessel wall when the stent is expanded and may be very hard to remove, particularly in calcium. Label your wires so you remove the right one. Deliberate side-branch wire jailing is a different, planned bifurcation technique, not a buddy wire.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-wire-6",
      stem: "Two hours after uncomplicated LAD PCI using a polymer-jacketed hydrophilic wire, a patient becomes hypotensive with a raised JVP. Review of the films shows the wire tip had been in a small apical branch. What is the most likely cause?",
      options: [
        "Retroperitoneal haemorrhage from the access site",
        "Tamponade from a distal wire perforation",
        "A delayed vasovagal reaction after sheath removal",
        "Contrast anaphylaxis with distributive shock",
        "Acute stent thrombosis extending into the left main",
      ],
      answer: 1,
      explanation:
        "A hydrophilic wire tip in a small distal branch is a classic source of perforation that may be missed in the lab and present later with tamponade: hypotension with a raised JVP. Retroperitoneal bleeding causes hypotension with a low JVP and is associated with femoral access. Vasovagal reactions cause bradycardia and are not associated with a raised JVP.",
      difficulty: 2,
      refs: ["supplied-medmastery", "ellis-1994"],
    },
    {
      id: "pci-q-wire-7",
      stem: "Which property makes polymer-jacketed hydrophilic wires both useful and risky?",
      options: [
        "A high tip load with poor flexibility, which pierces plaque but cannot follow bends",
        "A stiff stainless-steel tip that cannot be shaped, so it is steered by torque alone",
        "Low friction that tracks through tortuosity but gives little tactile feedback",
        "Poor radiopacity of the jacketed tip, so its position must be inferred from the shaft",
      ],
      answer: 2,
      explanation:
        "The slippery jacket lets the wire glide through bends and tiny channels, but the operator feels less, so subintimal passage or distal perforation can go unnoticed. These wires are not defined by a high tip load, and they can be shaped gently. Their tips are radiopaque.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 6: balloons and stents
// ---------------------------------------------------------------------------
const mBalloonsStents: Module = {
  id: "pci-balloons-stents",
  title: "Balloons and stents",
  stage: 3,
  summary:
    "Semi-compliant and non-compliant balloons, compliance charts, nominal and rated burst pressure, scoring, cutting, very-high-pressure and drug-coated balloons; drug-eluting stent design and generations; sizing, deployment pressure and expansion limits.",
  objectives: [
    "Read a compliance chart and explain nominal and rated burst pressure.",
    "Choose between semi-compliant, non-compliant and specialty balloons for a given task.",
    "Describe how DES design has evolved and why it matters.",
    "Size a stent's diameter and length from angiography or imaging and respect its expansion limits.",
  ],
  lessons: [
    {
      id: "pci-bs-balloons",
      title: "Balloon catheters: design, compliance and pressure",
      minutes: 10,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Every coronary balloon has the same basic parts: a tapered plastic tip, a tightly folded balloon between two radiopaque markers, a shaft and an inflation port that connects to a high-pressure syringe with a gauge (the indeflator). Balloons differ in how the wire runs through them and in what the balloon material does under pressure.",
        },
        {
          kind: "table",
          caption: "Rapid-exchange and over-the-wire systems",
          head: ["Feature", "Rapid exchange (monorail)", "Over the wire (OTW)"],
          rows: [
            ["Wire lumen", "Only the distal segment; the wire exits a port part-way along", "Full length; the wire exits at the hub"],
            ["Wire length needed", "Standard (about 180–190 cm)", "Exchange length or extension"],
            ["Strengths", "Fast, single operator, the default", "Wire exchange without losing position; distal injection; extra wire support"],
          ],
        },
        { kind: "h", text: "Compliance" },
        {
          kind: "p",
          text: "Compliance describes how much a balloon's diameter grows as pressure rises. Every balloon comes with a compliance chart listing its diameter at each pressure. Two pressures matter most. Nominal pressure is the pressure at which the balloon reaches its labelled diameter. Rated burst pressure (RBP) is a statistical limit: at RBP, at least 99.9% of balloons will not burst, with 95% confidence. Above RBP, rupture becomes a real possibility.",
        },
        { kind: "figure", id: "stent-compliance", caption: "Diameter against inflation pressure. A semi-compliant balloon keeps growing as pressure rises; a non-compliant balloon stays close to its labelled size. Nominal pressure and RBP are marked on each curve." },
        {
          kind: "table",
          caption: "Semi-compliant and non-compliant balloons (typical; check each device's chart)",
          head: ["Property", "Semi-compliant (SC)", "Non-compliant (NC)"],
          rows: [
            ["Material and profile", "Thinner, lower profile, crosses tight lesions", "Thicker, stronger, bulkier and less flexible"],
            ["Growth with pressure", "Substantial above nominal", "Small, even at high pressure"],
            ["Typical RBP", "Commonly in the mid-teens of atmospheres", "Commonly around 18–20 atm or more"],
            ["Main uses", "Crossing and pre-dilatation; the workhorse", "Resistant lesions; post-dilatation of stents"],
            ["Behaviour in a resistant lesion", "Expands at its unconstrained ends (dog-boning), stretching normal vessel", "Stays near its labelled size and concentrates force on the lesion"],
          ],
        },
        {
          kind: "formula",
          name: "Balloon-to-artery ratio",
          expr: "Ratio = balloon diameter at the chosen pressure ÷ reference vessel diameter",
          note: "Pre-dilatation usually uses a ratio slightly below 1:1 (around 0.8–1.0). NC post-dilatation inside a stent is usually about 1:1 to the reference or to an imaging-derived target.",
        },
        { kind: "h", text: "Inflating a balloon well" },
        {
          kind: "list",
          items: [
            "Check the size on the packaging and on the balloon hub yourself before it goes in. You are responsible for what you put into the patient.",
            "Inflate in a controlled way, calling out the pressure while watching the balloon on fluoroscopy: it should stay over the lesion, the waist should yield, and it should not rupture.",
            "If the lesion is rubbery (in-stent restenosis is typical) and the balloon is inflated quickly, it may squirt forwards or backwards. This is often called watermelon seeding. A scoring balloon or a slower inflation helps.",
            "Deflate by pulling the indeflator to full negative and watch for the final rush of bubbles that tells you the balloon is empty. Larger balloons take longer.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Assuming you were handed the size you asked for.",
            "Inflating above RBP to beat a resistant lesion. Change to a stronger tool instead.",
            "Post-dilating a stent with a semi-compliant balloon longer than the stent at high pressure: the balloon ends injure the vessel at the stent edges.",
            "Moving a balloon before it is fully deflated.",
          ],
        },
      ],
    },
    {
      id: "pci-bs-specialty-balloons",
      title: "Scoring, cutting, very-high-pressure and drug-coated balloons",
      minutes: 9,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "esc-revasc-2018", "jeger-dcb-consensus-2020"],
      blocks: [
        {
          kind: "p",
          text: "When a lesion will not yield to an NC balloon at 1:1 sizing, or when you want to avoid more metal, specialty balloons extend what a balloon can do. Atherectomy and intravascular lithotripsy, used for heavy calcium, are taught in the complex PCI track.",
        },
        {
          kind: "table",
          head: ["Device", "How it works", "Typical uses", "Technique", "Risks"],
          rows: [
            [
              "Cutting balloon",
              "NC balloon carrying longitudinal microblades that incise the plaque",
              "Fibrotic or moderately calcified lesions, in-stent restenosis, ostial lesions",
              "Size about 1:1 or slightly under; inflate and deflate slowly; respect its lower RBP",
              "Bulky and stiff to deliver; dissection; perforation if oversized",
            ],
            [
              "Scoring balloon",
              "Wire or polymer elements on the balloon surface concentrate force along lines",
              "As for cutting balloons; also prevents balloon slippage",
              "As above",
              "As above, usually somewhat less aggressive",
            ],
            [
              "Very-high-pressure NC balloon",
              "Twin-layer NC balloon designed for very high pressures (about 30–40 atm)",
              "Undilatable lesions; stent underexpansion",
              "Dedicated inflation device; follow the instructions for use",
              "Perforation, balloon rupture, bulk",
            ],
            [
              "Drug-coated balloon (DCB)",
              "Antiproliferative drug (paclitaxel or a limus) transferred to the vessel wall during inflation",
              "In-stent restenosis; small vessels; side branches; avoiding more metal",
              "Prepare the lesion first; minimise transit time; inflate at low to moderate pressure for an extended time (commonly 30–60 s)",
              "Drug loss in transit; geographic mismatch; recoil or dissection without a stent",
            ],
          ],
        },
        { kind: "h", text: "Using a drug-coated balloon" },
        {
          kind: "steps",
          items: [
            { title: "Prepare the lesion", detail: "Pre-dilate with an SC, NC, scoring or cutting balloon sized about 0.8–1.0 to the vessel." },
            { title: "Judge the result", detail: "Proceed with DCB only if the residual stenosis is small (commonly 30% or less), flow is TIMI 3 and there is no flow-limiting dissection. Otherwise, stent." },
            { title: "Deliver promptly", detail: "Drug is lost to the bloodstream while the balloon is in transit, so go straight to the lesion." },
            { title: "Cover generously", detail: "The DCB should extend a few millimetres beyond the prepared segment at each end, so that no injured vessel is left untreated (geographic mismatch)." },
            { title: "Inflate", detail: "At nominal or modest pressure for the time stated in the instructions, commonly 30–60 seconds or more, as the patient tolerates." },
          ],
        },
        {
          kind: "p",
          text: "The 2018 ESC/EACTS revascularisation guideline recommends both drug-eluting stents and drug-coated balloons for in-stent restenosis. Their use in de novo disease, particularly small vessels and side branches, is growing; follow current consensus guidance and local practice.",
        },
        {
          kind: "pearl",
          text: "An NC balloon that will not fully expand at high pressure is the lesion telling you it is not ready for a stent. Escalate the preparation before you deploy. Once an underexpanded stent is in place, your options shrink to post-dilatation and techniques with more risk.",
        },
        {
          kind: "pitfalls",
          items: [
            "Oversizing a cutting balloon in an angulated segment.",
            "Taking a drug-coated balloon on a slow trip through a tortuous vessel and arriving with little drug left.",
            "Using a DCB after inadequate preparation and leaving a residual stenosis or dissection without a stent.",
            "Inflating ordinary NC balloons far beyond RBP instead of choosing a device designed for that pressure.",
          ],
        },
      ],
    },
    {
      id: "pci-bs-des",
      title: "Drug-eluting stents: design and generations",
      minutes: 9,
      refs: ["supplied-medmastery", "esc-revasc-2018", "brilakis-manual-pci", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Plain balloon angioplasty has two weaknesses: abrupt closure from dissection or recoil, and restenosis at the site of injury. Bare-metal stents solved abrupt closure by scaffolding the vessel, but neointimal hyperplasia inside the stent caused in-stent restenosis. Drug-eluting stents (DES) release an antiproliferative drug, from the limus family or paclitaxel, that suppresses smooth-muscle proliferation. In conventional DES the drug is carried in a polymer coating on the metal.",
        },
        {
          kind: "table",
          caption: "Evolution of coronary stents (strut thicknesses approximate)",
          head: ["Generation", "Platform and struts", "Polymer and drug", "Main issue"],
          rows: [
            ["Bare-metal stent", "Stainless steel, later cobalt-chromium", "None", "Restenosis; now superseded"],
            ["First-generation DES", "Stainless steel, struts about 130–140 µm", "Durable polymers; sirolimus or paclitaxel", "Delayed healing with late and very late stent thrombosis"],
            ["Newer-generation durable-polymer DES", "Cobalt-chromium or platinum-chromium, struts about 80–90 µm", "Thin, biocompatible durable polymer; everolimus or zotarolimus", "Much lower thrombosis and restenosis rates"],
            ["Biodegradable-polymer DES", "Often ultrathin struts (about 60–70 µm in some designs)", "Polymer degrades over months; limus drugs", "Comparable to newer durable-polymer DES"],
            ["Polymer-free drug-coated stent", "Drug applied directly to the metal surface", "No polymer", "Used particularly with short DAPT in high bleeding risk"],
            ["Bioresorbable scaffold", "Polymer (PLLA) scaffold with thick struts; magnesium designs in development", "Everolimus", "Higher scaffold thrombosis; the first commercial device was withdrawn"],
          ],
        },
        {
          kind: "p",
          text: "The 2018 ESC/EACTS guideline recommends DES over bare-metal stents for any PCI, whatever the clinical presentation, lesion type, planned non-cardiac surgery, expected DAPT duration or concomitant anticoagulation. Many modern DES are licensed for short DAPT courses, down to about one month in high bleeding risk.",
        },
        { kind: "h", text: "Design features that affect your choice" },
        {
          kind: "list",
          items: [
            "Radial strength versus longitudinal flexibility: stents are strong across their diameter but flexible and compressible along their length.",
            "Strut thickness: thinner struts mean less vessel injury and faster healing, at some cost to radial strength and visibility.",
            "Cell size and connectors: larger cells make rewiring a side branch through the stent easier.",
            "Expansion range: each platform has a maximum diameter to which it can be post-dilated. Several labelled diameters may share one scaffold mounted on different balloons.",
            "Visibility: platinum-containing alloys are more radiopaque, which helps in large patients.",
            "Deliverability: depends on the stent, the balloon and the tip together.",
            "Available sizes: very long or very large stents (for example for the left main) exist only on some platforms.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing a guide catheter or guide extension into an ostial stent: stents compress longitudinally, and the deformation may not be obvious until imaging.",
            "Choosing a small-vessel platform for a segment that needs large post-dilatation, which overstretches it beyond its limit.",
            "Using a bare-metal stent in the belief that it allows shorter DAPT.",
          ],
        },
        {
          kind: "pearl",
          text: "Before loading a stent, look at it. Check where the markers sit relative to the stent edges and inspect it for damage from packaging or handling. A damaged stent may not cross and can injure the vessel.",
        },
      ],
    },
    {
      id: "pci-bs-sizing",
      title: "Sizing and deploying stents",
      minutes: 10,
      refs: ["supplied-medmastery", "eapci-imaging-2018", "ultimate-2018", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Choose a stent by diameter, length, design and drug. Of these, diameter and length are the ones you can most easily get wrong, and the consequences are serious: an undersized or underexpanded stent is thrombogenic and prone to restenosis, and an oversized one can dissect or rupture the vessel.",
        },
        { kind: "h", text: "Diameter" },
        {
          kind: "list",
          items: [
            "Angiographically, estimate the reference diameter against the guide (6 Fr is about 2 mm), use QCA, or inflate the pre-dilatation balloon at nominal pressure and compare it with the vessel.",
            "In a tapering vessel, size to the distal reference and post-dilate the proximal segment with a larger NC balloon.",
            "With IVUS, a common approach sizes to the external elastic membrane diameter at the distal reference, rounded down to the nearest 0.25 mm. With OCT, when the external elastic membrane is not visible, sizing is based on the lumen. Details are in the physiology and imaging track.",
          ],
        },
        { kind: "h", text: "Length" },
        {
          kind: "list",
          items: [
            "Cover the whole lesion, landing both edges in normal-looking vessel (or, with imaging, in segments with modest plaque).",
            "Tortuous vessels need more length than a straight-line estimate suggests.",
            "Stents shorten slightly when expanded beyond nominal, and more so the further they are expanded.",
            "If two stents are needed, deploy the distal one first and overlap by a few millimetres to avoid a gap.",
          ],
        },
        { kind: "h", text: "Deployment pressure and expansion limits" },
        {
          kind: "p",
          text: "A stent's delivery balloon has its own compliance chart. A widely used approach is to deploy at nominal or moderately higher pressure, then post-dilate with an NC balloon of the same or larger diameter, shorter than the stent, at high pressure. The NC balloon delivers more even force and stays within the stent, which avoids injuring the edges. Overexpansion beyond a platform's limit distorts cells, reduces scaffolding and drug delivery per unit area, weakens radial strength and can fracture struts. Check the instructions for use for each platform's maximum expansion.",
        },
        {
          kind: "table",
          caption: "Imaging targets for stent optimisation (approximate; see the imaging track)",
          head: ["Target", "Typical criterion"],
          rows: [
            ["Relative expansion", "Minimal stent area at least 80–90% of the reference lumen area"],
            ["Absolute expansion (non-left main)", "Minimal stent area above about 5.5 mm² by IVUS or 4.5 mm² by OCT"],
            ["Edges", "Avoid landing in heavy plaque (plaque burden around 50% or more); treat large edge dissections"],
            ["Apposition", "Struts in contact with the wall, especially where the vessel is large"],
          ],
        },
        {
          kind: "formula",
          name: "Stent expansion",
          expr: "Expansion (%) = minimal stent area ÷ mean reference lumen area × 100",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "A LAD tapers from 3.5 mm proximally to 2.75 mm distally over a 24 mm lesion. Choose a stent sized to the distal reference on a platform that can reach 3.5 mm, deploy at nominal pressure, then post-dilate the proximal half with a 3.5 mm NC balloon and check expansion against the imaging targets.",
        },
        {
          kind: "pitfalls",
          items: [
            "An undersized stent left underexpanded because the angiogram 'looked fine'.",
            "Sizing to the proximal vessel in a tapering segment and dissecting the distal edge.",
            "A gap between two stents, or an edge landing in plaque (geographic miss).",
            "Exceeding the platform's maximum expansion diameter.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-bs-1",
      stem: "What does the rated burst pressure (RBP) of a balloon represent?",
      options: [
        "The pressure at which the balloon reaches its labelled diameter",
        "The average pressure at which balloons burst in testing",
        "The pressure at which at least 99.9% of balloons will not burst, with 95% confidence",
        "The minimum pressure needed to expand a stent",
        "The pressure at which the balloon becomes non-compliant",
      ],
      answer: 2,
      explanation:
        "RBP is a statistical safety limit: at that pressure, at least 99.9% of balloons survive with 95% confidence. The pressure at which the balloon reaches its labelled diameter is the nominal pressure. Mean burst pressure is higher than RBP, which is why exceeding RBP does not always cause rupture, but it does increase the risk.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-bs-2",
      stem: "Why is an NC balloon shorter than the stent preferred for post-dilatation?",
      options: [
        "It has a lower crossing profile than a semi-compliant balloon of the same size",
        "It releases antiproliferative drug into the vessel wall at the stent edges",
        "It can be inflated well above its rated burst pressure without any risk",
        "It barely grows with pressure, giving high even force inside the stent",
        "It reduces the duration of DAPT needed after the procedure",
      ],
      answer: 3,
      explanation:
        "NC balloons stay close to their labelled diameter at high pressure, so force is concentrated within the stent, and keeping the balloon shorter than the stent protects the edges. Semi-compliant balloons, not NC balloons, have the lower crossing profile. No balloon should be routinely taken above RBP.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-bs-3",
      stem: "A 3.0 × 20 mm semi-compliant balloon is used to post-dilate a 3.0 × 15 mm stent at 18 atm. What is the main risk?",
      options: [
        "Edge dissection from balloon overhang at high pressure",
        "Stent thrombosis from underexpansion",
        "Side-branch occlusion",
        "Stent embolisation",
        "Contrast nephropathy",
      ],
      answer: 0,
      explanation:
        "The balloon is longer than the stent and semi-compliant, so its ends expand beyond the stent edges into unprotected vessel at high pressure. This causes edge dissection and later edge restenosis (the 'candy wrapper' pattern). The correct tool is a shorter NC balloon positioned inside the stent.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-bs-4",
      stem: "After pre-dilating a small-vessel lesion, which finding means you should NOT proceed with a drug-coated balloon alone?",
      options: [
        "TIMI 3 flow",
        "Residual stenosis of 20%",
        "A minor non-flow-limiting haziness at the lesion site",
        "A vessel diameter of 2.5 mm",
        "A flow-limiting dissection",
      ],
      answer: 4,
      explanation:
        "DCB-only treatment needs good preparation: small residual stenosis (commonly 30% or less), TIMI 3 flow and no flow-limiting dissection. A flow-limiting dissection needs a stent. A 2.5 mm vessel is a typical DCB target, and minor non-flow-limiting haziness is usually acceptable.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "supplied-medmastery", "jeger-dcb-consensus-2020"],
    },
    {
      id: "pci-q-bs-5",
      stem: "What was the main clinical problem with first-generation drug-eluting stents?",
      options: [
        "Higher restenosis rates than with bare-metal stents at one year",
        "Late and very late stent thrombosis from delayed healing",
        "Inability to deliver them through 6 Fr guides in tortuous vessels",
        "Lack of radiopacity, so the stent edges could not be seen",
        "Rapid drug release within hours, before neointima had formed",
      ],
      answer: 1,
      explanation:
        "First-generation DES reduced restenosis compared with bare-metal stents, but thick stainless-steel struts and less biocompatible durable polymers delayed healing and were associated with late and very late stent thrombosis. Newer platforms with thinner struts and better polymers addressed this. Restenosis was lower, not higher.",
      difficulty: 2,
      refs: ["supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "pci-q-bs-6",
      stem: "A patient at high bleeding risk who takes apixaban for AF needs PCI. What stent does the 2018 ESC/EACTS guideline recommend?",
      options: [
        "A bare-metal stent to allow shorter DAPT",
        "A bioresorbable scaffold",
        "A drug-eluting stent",
        "No stent; balloon angioplasty only",
      ],
      answer: 2,
      explanation:
        "The guideline recommends DES over bare-metal stents for any PCI, including patients who need anticoagulation or short DAPT. The old rationale for bare-metal stents (shorter DAPT) no longer applies, because modern DES are safe with short DAPT and restenose less. Bioresorbable scaffolds were withdrawn because of higher thrombosis.",
      difficulty: 1,
      refs: ["esc-revasc-2018"],
    },
    {
      id: "pci-q-bs-7",
      stem: "An NC balloon sized 1:1 to the vessel still shows a persistent waist at 20 atm in a calcified lesion before stenting. What is the best next step?",
      options: [
        "Deploy the stent at high pressure; the stent will crack the calcium as it expands",
        "Do not stent yet: escalate lesion preparation and consider imaging",
        "Inflate the same NC balloon to 30 atm, well above its rated burst pressure",
        "Stent with a smaller-diameter stent sized to the residual lumen of the lesion",
        "Abandon PCI permanently and refer for surgery without further attempts",
      ],
      answer: 1,
      explanation:
        "A lesion that will not yield to an NC balloon will not yield to a stent, and an underexpanded stent is hard to fix. Escalate preparation first. Taking a standard NC balloon far above RBP risks rupture and perforation. An undersized stent leaves a small lumen with a high risk of thrombosis and restenosis.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-bs-8",
      stem: "Why should a stent not be post-dilated beyond its platform's maximum expansion diameter?",
      options: [
        "The drug reaches toxic tissue concentrations once the stent is overexpanded",
        "The stent lengthens as it expands and covers side branches at both edges",
        "The balloon will not deflate inside an overexpanded stent and becomes trapped",
        "Cells distort, scaffolding and drug coverage fall, and struts can fracture",
      ],
      answer: 3,
      explanation:
        "Overexpansion stretches the cells, reduces scaffolding and drug delivery per unit area, weakens the stent and can fracture struts. Stents shorten rather than lengthen when overexpanded. Check each platform's limit in the instructions for use.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    {
      sim: "pci-bench",
      task: "Read a compliance chart: predict the diameter of a 3.0 mm SC balloon and a 3.0 mm NC balloon at 14 atm, then confirm on the bench and note which one stays near its label.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 7: the procedure step by step
// ---------------------------------------------------------------------------
const mProcedure: Module = {
  id: "pci-procedure",
  title: "The procedure, step by step",
  stage: 3,
  summary:
    "A straightforward PCI broken into steps, each with a goal, a technique and the ways it goes wrong: access, engagement, wiring, lesion preparation, stent positioning and deployment, optimisation and assessing the result.",
  objectives: [
    "Perform radial and femoral access safely and troubleshoot radial problems.",
    "Seat a guide coaxially and confirm a normal pressure trace before every injection.",
    "Wire a lesion using a frozen roadmap and maintain wire position.",
    "Pre-dilate with controlled inflation and recognise balloon rupture and watermelon seeding.",
    "Position and deploy a stent without geographic miss.",
    "Optimise the result with NC post-dilatation and, where relevant, proximal optimisation, and judge success in two orthogonal views.",
  ],
  lessons: [
    {
      id: "pci-proc-access-engage",
      title: "Access and engagement",
      minutes: 11,
      refs: ["supplied-medmastery", "matrix-2015", "brilakis-manual-pci", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Think of a PCI as a chain of steps, each with a goal, a technique and a list of things that can go wrong. Naming the step you are on, out loud if it helps, keeps you and the team oriented and makes it obvious when a step has not been completed before the next begins.",
        },
        {
          kind: "table",
          caption: "The steps of a straightforward PCI",
          head: ["Step", "Goal", "Key technique", "What goes wrong"],
          rows: [
            ["Plan", "Right patient, right strategy, kit available", "Review films; plan and bailout plan", "Surprises mid-case"],
            ["Access", "Safe arterial access with a sheath", "Radial first; ultrasound; femoral over the femoral head", "Spasm, haematoma, bleeding"],
            ["Engage", "Coaxial, supportive guide with a normal trace", "Check the pressure before every injection", "Ostial dissection, damping"],
            ["Wire", "Wire in the distal true lumen", "Roadmap; free tip; orthogonal check", "Dissection, wrong branch, perforation"],
            ["Prepare", "A lesion that expands fully", "Controlled balloon inflation; escalate if needed", "Dissection, slippage, rupture"],
            ["Stent", "Lesion covered normal to normal", "Markers, landmarks, contrast puffs", "Geographic miss, delivery failure"],
            ["Optimise", "Full expansion, apposition, clean edges", "NC post-dilatation; proximal optimisation; imaging", "Edge dissection, perforation"],
            ["Close", "Haemostasis and safe recovery", "Patent radial haemostasis", "Bleeding, radial occlusion"],
          ],
        },
        { kind: "h", text: "Access" },
        {
          kind: "p",
          text: "Radial access is the default in UK practice. In MATRIX, patients with ACS treated via the radial artery had fewer bleeding complications and lower all-cause mortality than those treated via the femoral artery. The radial artery is rarely diseased, bleeding is easy to see and control, and patients can sit up and walk immediately. Its limits are size (especially in small patients), spasm, loops and tortuosity, the angle into the aortic root, and the impossibility of placing large-bore support devices. Femoral access offers a large, spasm-free artery for big guides and mechanical support, at the cost of more bleeding.",
        },
        {
          kind: "steps",
          title: "Radial access",
          items: [
            { title: "Position", detail: "Arm comfortable, wrist slightly extended; local anaesthetic." },
            { title: "Puncture", detail: "Just proximal to the flexor retinaculum, needle at about 30–45° to the skin. Too steep an angle makes the wire more likely to enter the wall." },
            { title: "Wire", detail: "It should advance without resistance. If not: withdraw the needle slightly, adjust the bevel or angle, and try again. Never force it." },
            { title: "Sheath and cocktail", detail: "Insert the sheath and give a spasmolytic cocktail (commonly verapamil and a nitrate, diluted in the patient's blood to reduce discomfort) and heparin." },
            { title: "Secure it", detail: "Fix the sheath, including the side arm, so it cannot be pulled out." },
            { title: "Advance to the root", detail: "Under fluoroscopy. Radial angiography is not routine because contrast stings, but take one if the wire meets resistance." },
          ],
        },
        {
          kind: "table",
          caption: "Troubleshooting the radial route",
          head: ["Problem", "Response"],
          rows: [
            ["Tortuous radial or brachial artery", "A hydrophilic-coated J-wire negotiates bends with less spasm"],
            ["Radial loop", "Steer a coronary wire around the loop; it often straightens gently as the catheter follows"],
            ["Catheter will not track despite being in the main artery", "Balloon-assisted tracking: inflate a small balloon half in, half out of the catheter tip to give it a smooth leading edge"],
            ["Wire enters the descending aorta", "Change to LAO, pull back, and use the catheter to redirect the wire into the ascending aorta; a deep breath can help"],
            ["Spasm", "More cocktail, analgesia and anxiolysis; minimise catheter exchanges and manipulation"],
          ],
        },
        {
          kind: "steps",
          title: "Femoral access",
          items: [
            { title: "Landmarks", detail: "Aim for the common femoral artery over the medial part of the femoral head, below the inguinal ligament and the inferior epigastric artery and above the bifurcation. Check the pulse on both sides; disease can be unilateral." },
            { title: "Imaging", detail: "Use fluoroscopy to mark the femoral head and ultrasound to see the artery and its bifurcation. A micropuncture set helps with deep or difficult arteries." },
            { title: "Confirm", detail: "An angiogram through the sheath in an ipsilateral oblique view shows the puncture site relative to the bifurcation before you consider a closure device." },
          ],
        },
        { kind: "h", text: "Engaging the guide" },
        {
          kind: "steps",
          items: [
            { title: "Choose", detail: "Match the guide shape and size to the root, the target and the support you need." },
            { title: "De-air", detail: "After removing the J-wire, aspirate and flush the guide, and connect the manifold without bubbles." },
            { title: "Check the trace", detail: "Look at the pressure before engaging and again before every injection." },
            { title: "Engage coaxially", detail: "Confirm in at least two views that the tip is aligned with the vessel and not digging into the wall." },
            { title: "Baseline angiography", detail: "Take views that show the lesion without foreshortening or overlap, then choose a working view in which the lesion, the guide tip and the wire course are all visible." },
            { title: "Anticoagulate", detail: "Complete the heparin dose, and check the ACT if required by your protocol, before any wire enters the coronary artery." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting on a damped or ventricularised trace.",
            "Air in the manifold or guide: aspirate and flush every time something is removed.",
            "An extra-backup or Amplatz guide drifting deep into the left main or RCA while your attention is elsewhere.",
            "A radial perforation or dissection that the guide was sealing: it may bleed into the forearm only when the catheter is removed at the end.",
          ],
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Complete right radial access, advance a J-wire and an EBU 3.5 to the ascending aorta and engage the left coronary, confirming a normal pressure trace before the first injection.",
        },
      ],
    },
    {
      id: "pci-proc-wire-prepare",
      title: "Wiring and lesion preparation",
      minutes: 10,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "nhlbi-dissection-1991"],
      blocks: [
        {
          kind: "p",
          text: "The goal of this step is a wire in the true lumen, distal to the lesion, and a lesion that has been opened enough to accept a stent and let it expand fully.",
        },
        {
          kind: "steps",
          title: "Wiring the lesion",
          items: [
            { title: "Freeze the roadmap", detail: "Display the best frame of the lesion next to live fluoroscopy." },
            { title: "Shape and load", detail: "Shape the tip for the vessel; pass it through the introducer and haemostatic valve." },
            { title: "Cross with a free tip", detail: "Steer through the lesion with small rotations. The tip must move freely; if it catches, pull back and redirect." },
            { title: "Confirm", detail: "Check in an orthogonal view that the wire is in the intended vessel and moves freely distally." },
            { title: "Park", detail: "Distal enough for support, in a vessel large enough to be safe." },
            { title: "Husbandry", detail: "From now on, one hand controls the wire whenever devices move. Wipe it clean and communicate who has it." },
          ],
        },
        {
          kind: "steps",
          title: "Pre-dilatation",
          items: [
            { title: "Check the balloon", detail: "Confirm the size on the packet and hub. Prepare it with dilute contrast, removing air under negative pressure." },
            { title: "Open the valve", detail: "Open the haemostatic valve just wide enough for the balloon, then close it. Tell the physiologist when it is open so a lost pressure trace is not a surprise." },
            { title: "Advance", detail: "Hold the wire still while the balloon slides over it. Make sure you are loading the intended wire if more than one is in place." },
            { title: "Position", detail: "Use the markers to centre the balloon on the lesion." },
            { title: "Inflate under control", detail: "Bring the indeflator from negative to neutral, then inflate steadily, calling out the pressures while you watch the balloon on fluoroscopy." },
            { title: "Watch the waist", detail: "It should yield. A fully expanded balloon at nominal pressure also gives you a gauge of the vessel diameter." },
            { title: "Deflate fully", detail: "Pull to full negative and wait for the final bubbles before moving the balloon." },
            { title: "Measure", detail: "The deflated balloon's markers, of known spacing, help you choose the stent length." },
            { title: "Reassess", detail: "Withdraw the balloon into the guide and take an angiogram." },
          ],
        },
        {
          kind: "p",
          text: "Choose a pre-dilatation balloon close to, or slightly smaller than, the vessel size. Too large risks dissection; too small tells you nothing about whether the lesion will yield. Direct stenting, without pre-dilatation, is reasonable in selected soft lesions with good visibility, such as some thrombotic culprit lesions, but not in calcified or very tight lesions.",
        },
        {
          kind: "table",
          caption: "What goes wrong at this step",
          head: ["Problem", "How you recognise it", "First response"],
          rows: [
            ["Balloon will not cross", "Balloon stops at the lesion; guide backs out", "Smaller, lower-profile balloon; more support; microcatheter"],
            ["Watermelon seeding", "Balloon squirts out of the lesion during inflation", "Slower inflation, scoring balloon, longer balloon, better guide support"],
            ["Balloon rupture", "Sudden pressure loss, contrast puff in the vessel, blood in the hub", "Full negative, withdraw, angiogram to look for dissection or perforation"],
            ["Persistent waist", "Balloon will not fully expand", "Do not stent; NC, cutting, scoring or very-high-pressure balloon; consider imaging and calcium modification"],
            ["Dissection after pre-dilatation", "Linear lucency or contrast staining", "Keep the wire in; grade it; usually treated by the planned stent if the wire is in the true lumen"],
            ["Chest pain and ST change", "During inflation", "Expected and transient; worry if it persists after deflation"],
          ],
        },
        {
          kind: "pearl",
          text: "After any dissection, the wire is your lifeline. Do not pull it out to 'have another look'; re-crossing a dissected vessel may be impossible.",
        },
        {
          kind: "figure",
          id: "nhlbi-dissection",
          caption: "Grade dissections using the NHLBI types A to F. Higher grades and flow-limiting dissections carry more risk of acute closure; management is covered in the complications track.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Pre-dilate a fibrotic lesion first with an undersized SC balloon and then with a 1:1 NC balloon. Record the pressure at which the waist disappears and decide whether the lesion is ready for a stent.",
        },
      ],
    },
    {
      id: "pci-proc-stent",
      title: "Positioning and deploying the stent",
      minutes: 9,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Stents are metal, rougher and bulkier than balloons and meet much more friction. Positioning is harder, and deployment is a one-way door: once the balloon starts to expand the stent, you are committed to that position.",
        },
        {
          kind: "steps",
          title: "Delivering and positioning",
          items: [
            { title: "Inspect", detail: "Check the stent, its markers and the absence of damage before loading." },
            { title: "Open the valve", detail: "Wide enough that the stent passes without being scraped." },
            { title: "Check the platform", detail: "The guide is well engaged and supportive, and the wire is far enough distal." },
            { title: "Advance", detail: "Smoothly, watching the guide and the wire tip as well as the stent." },
            { title: "Position", detail: "Use landmarks (side branches, calcium, previous stents) and inject contrast to confirm that both markers sit in normal vessel beyond the lesion." },
            { title: "If the stent occludes the vessel", detail: "Pull it back until contrast passes, inject a small puff as you advance it again, or use a visible proximal branch as a landmark." },
            { title: "Clear the decks", detail: "Remove any buddy wire. Make sure the stent is fully outside any guide extension." },
            { title: "Stabilise", detail: "Guide and wire steady; ask the patient to breathe quietly or hold their breath, because a few millimetres of movement can cause a geographic miss." },
          ],
        },
        {
          kind: "steps",
          title: "Deploying",
          items: [
            { title: "Record", detail: "Acquire an image of the final position for reference." },
            { title: "Go negative to neutral", detail: "Then inflate under fluoroscopy, counting the atmospheres aloud as you go." },
            { title: "Watch", detail: "Look for uniform expansion and for any waist where the lesion is constraining the stent." },
            { title: "Hold", detail: "Maintain the target pressure until it is stable and the stent is fully expanded." },
            { title: "Deflate", detail: "Full negative, wait for complete deflation, then withdraw the balloon gently into the guide, keeping the wire in place." },
          ],
        },
        {
          kind: "p",
          text: "Geographic miss means the stent does not cover the whole lesion or the injured segment, or ends in plaque. It follows from poor views, an underestimate of length, movement of the guide, wire or patient during deployment, or a stent that is too short. It increases the risk of edge dissection and restenosis. Prevent it with good orthogonal views, generous length and a steady system at the moment of deployment.",
        },
        {
          kind: "p",
          text: "For aorto-ostial lesions, disengage the guide slightly so the stent can be placed with its proximal edge just protruding (about 1 mm) into the aorta. Avoid pushing a guide or guide extension into a freshly placed ostial stent, which can crush it longitudinally. Branch-ostial and bifurcation positioning is covered in the complex PCI track.",
        },
        {
          kind: "pitfalls",
          items: [
            "Deploying in an underprepared lesion. It is tempting, but it is often the start of a very long case: before deployment you can still escalate preparation or stop; afterwards you are left with post-dilatation and riskier options.",
            "Deploying with a buddy wire still beside the stent.",
            "Deploying with part of the stent still inside a guide extension.",
            "Relying on bony landmarks or a roadmap overlay alone: the patient and table move.",
            "Rapid, uncontrolled inflation that hides an emerging waist.",
          ],
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Position a 3.0 × 23 mm stent so that both markers sit in angiographically normal vessel a few millimetres beyond each end of the lesion, deploy at nominal pressure, and inspect for any waist before deciding on post-dilatation.",
        },
      ],
    },
    {
      id: "pci-proc-optimise",
      title: "Optimisation and judging the result",
      minutes: 11,
      refs: [
        "supplied-medmastery",
        "timi-1985",
        "eapci-imaging-2018",
        "renovate-2023",
        "ilumien4-2023",
        "ultimate-2018",
        "esc-ccs-2024",
        "brilakis-manual-pci",
      ],
      blocks: [
        {
          kind: "p",
          text: "A stent that looks acceptable at deployment is often not fully expanded, particularly where plaque is eccentric or calcified. A dependable approach is to deploy at modest pressure, then post-dilate with an NC balloon of the same or larger diameter that is slightly shorter than the stent. The NC balloon keeps its shape under pressure and delivers controlled, even force.",
        },
        {
          kind: "steps",
          title: "Optimising the stent",
          items: [
            { title: "Look for underexpansion", detail: "Use the enhanced stent visualisation available on most lab systems, and look for a waist on the deployment image." },
            { title: "Choose the NC balloon", detail: "Diameter about 1:1 to the reference or to the imaging target; length shorter than the stent." },
            { title: "Keep it inside", detail: "Confirm that both balloon markers are within the stent edges before inflating, using an enhanced image or a run without contrast." },
            { title: "Inflate high", detail: "Inflate to high pressure within the chart's limits, and repeat in overlapping positions for long stents." },
            { title: "Proximal optimisation", detail: "Where the vessel tapers across a side branch, inflate a short balloon sized to the proximal reference in the proximal segment, ending just before the carina. This apposes the proximal stent and can open the cells facing the branch (bifurcation detail is in the complex PCI track)." },
            { title: "Image when it matters", detail: "IVUS or OCT for left main, long lesions, calcium, in-stent restenosis, an ambiguous angiographic result or unexplained flow problems." },
          ],
        },
        {
          kind: "p",
          text: "Evidence for imaging guidance has grown. ULTIMATE found fewer target-vessel failures with IVUS-guided implantation in all-comers. RENOVATE-COMPLEX-PCI found fewer target-vessel failures with IVUS or OCT guidance in complex lesions. ILUMIEN IV showed larger stent areas with OCT guidance, although its primary clinical endpoint did not differ significantly. The 2024 ESC CCS guideline recommends imaging guidance for anatomically complex lesions such as the left main, true bifurcations and long lesions.",
        },
        { kind: "h", text: "Assessing success" },
        {
          kind: "list",
          items: [
            "The patient: mild discomfort during inflations is common and usually settles. Worsening or persisting pain, persistent ECG changes, ventricular arrhythmia or haemodynamic instability mean something has gone wrong.",
            "The angiogram, in at least two orthogonal views: residual stenosis, stent expansion, TIMI flow (the same as or better than before), side branches, filling defects suggesting thrombus, and plaque shifted beyond the stent.",
            "The edges: inflow and outflow for dissection.",
            "The wide view: the guide and the ostium for catheter or guide-extension trauma, and the distal wire tip for migration or perforation.",
          ],
        },
        {
          kind: "table",
          caption: "TIMI flow grades",
          head: ["Grade", "Definition"],
          rows: [
            ["0", "No antegrade flow beyond the obstruction"],
            ["1", "Contrast passes the obstruction but does not opacify the whole distal bed"],
            ["2", "The whole distal vessel opacifies, but filling or clearance is slower than in normal vessels"],
            ["3", "Normal, prompt filling and clearance"],
          ],
        },
        {
          kind: "p",
          text: "In the stent era, angiographic success is commonly defined as a residual diameter stenosis below about 20% with TIMI 3 flow and no flow-limiting dissection, lost side branch or visible thrombus. With high-resolution imaging, tiny edge dissections are frequently seen; if they are small and flow is good, they are usually left alone. Larger or flow-limiting edge dissections are normally covered with another stent.",
        },
        {
          kind: "steps",
          title: "Ending the case",
          items: [
            { title: "Final views with the wire in", detail: "In two orthogonal projections. If there is a problem, the wire is still in place to fix it." },
            { title: "Remove the wire", detail: "Then take a final run: the straightened vessel relaxes, and wire-induced pseudolesions disappear." },
            { title: "Inspect the ostium and the distal vessel", detail: "Look for guide trauma and distal wire perforation." },
            { title: "Withdraw the guide carefully", detail: "Disengage Amplatz shapes by advancing and rotating, never by pulling." },
            { title: "Record", detail: "Contrast volume, radiation dose, final ACT and the plan for the sheath and medication." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a visible waist because the stenosis 'looks better than before'.",
            "Tunnel vision: judging only the stented segment and missing a left main dissection or a distal perforation.",
            "Post-dilating with the balloon partly outside the stent.",
            "Removing the wire before you are satisfied with the result.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "After a simulated LAD stent, acquire final views in two orthogonal projections with a wide field that includes the left main and the distal LAD, then grade the TIMI flow.",
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-proc-1",
      stem: "You have just engaged the left main with an EBU guide. What must you do before the first contrast injection?",
      options: [
        "Advance the coronary wire into the LAD to secure access",
        "Give a GP IIb/IIIa inhibitor through the guide catheter",
        "Take a femoral angiogram to document the access site",
        "Check that the pressure trace is not damped or ventricularised",
        "Inflate a balloon in the left main to anchor the guide in place",
      ],
      answer: 3,
      explanation:
        "Checking the trace before each injection is the main protection against injecting into a guide that is wedged against the wall or obstructing the ostium, which can cause dissection or arrhythmia. Wiring comes later and only after heparin. The other options are unrelated to safe engagement.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-2",
      stem: "What is the purpose of displaying a frozen angiographic frame next to live fluoroscopy while wiring?",
      options: [
        "It is a roadmap for steering the wire with fewer contrast injections",
        "It reduces radiation dose because live fluoroscopy can then be stopped",
        "It is required by the software to calculate the SYNTAX score of the lesion",
        "It allows automatic stent sizing from the frozen frame by the C-arm software",
      ],
      answer: 0,
      explanation:
        "The frozen frame is a reference map of the vessel and lesion, which lets you steer the wire with fewer contrast injections. It does not replace live fluoroscopy, so it does not directly stop radiation, and it has nothing to do with the SYNTAX score.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-3",
      stem: "During pre-dilatation at 12 atm, the pressure suddenly falls, contrast puffs into the vessel and blood appears in the balloon hub. What is the first action?",
      options: [
        "Reinflate to a higher pressure to finish the dilatation",
        "Deploy a stent immediately over the same balloon position",
        "Deflate fully, withdraw the balloon and take an angiogram",
        "Remove the wire to check that its tip has not been damaged",
        "Give protamine at once to reverse the procedural heparin",
      ],
      answer: 2,
      explanation:
        "These are signs of balloon rupture. Deflate fully, withdraw the balloon and check the angiogram for dissection or perforation. Reinflating a ruptured balloon is pointless and dangerous. Removing the wire throws away your access at the moment you may need it, and protamine is only considered once a perforation has been identified.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-4",
      stem: "A semi-compliant balloon repeatedly squirts forwards out of a rubbery in-stent restenosis lesion during inflation. What best addresses this?",
      options: [
        "Inflate faster to higher pressure",
        "Use a smaller balloon",
        "Proceed directly to a new stent without preparation",
        "Remove the guide extension",
        "Use a scoring or cutting balloon with a slower, controlled inflation",
      ],
      answer: 4,
      explanation:
        "Watermelon seeding happens when a balloon cannot grip a resistant, slippery lesion. Scoring elements grip the plaque, and slower inflation helps. Faster inflation makes slippage worse. Stenting without preparation risks underexpansion, especially in restenosis.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-5",
      stem: "Which practice best reduces the risk of geographic miss?",
      options: [
        "Choosing the shortest stent that covers the tightest part of the lesion",
        "Deploying very quickly to minimise any movement of the heart and table",
        "Relying on the roadmap overlay alone to place both edges of the stent",
        "Orthogonal views, landmarks, a steady system and a held breath",
        "Positioning only in the LAO cranial view, which shows most LAD lesions",
      ],
      answer: 3,
      explanation:
        "Geographic miss comes from incomplete visualisation, underestimated length and movement during deployment. Good views, landmarks, a stable system and controlled breathing prevent it. A stent that covers only the tightest part leaves diseased edges. Overlays drift with patient and table movement.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-6",
      stem: "After stent deployment, where should the NC post-dilatation balloon be positioned?",
      options: [
        "Entirely within the stent, confirmed on an enhanced stent image",
        "Extending 5 mm beyond each stent edge to treat the edges as well",
        "Only at the proximal stent edge, where malapposition is most common",
        "Distal to the stent, to open the outflow and improve run-off",
      ],
      answer: 0,
      explanation:
        "Keeping the high-pressure balloon inside the stent expands the stent without injuring unstented vessel at the edges. Extending beyond the edges causes edge dissection. Proximal optimisation deliberately uses the proximal segment, but it still stays within the stent.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-proc-7",
      stem: "After stenting, the whole distal vessel opacifies, but filling and clearance are clearly slower than in the other coronary arteries. What TIMI grade is this?",
      options: ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3"],
      answer: 2,
      explanation:
        "TIMI 2 means the entire distal vessel fills but slowly. TIMI 1 is penetration without complete distal filling, and TIMI 3 is normal, prompt flow. Slow flow after stenting needs explaining: dissection, thrombus, distal embolisation or no-reflow.",
      difficulty: 1,
      refs: ["timi-1985", "supplied-medmastery"],
    },
    {
      id: "pci-q-proc-8",
      stem: "The final stent result in the mid LAD looks excellent. Which additional check is most often missed?",
      options: [
        "The SYNTAX score of the residual disease after PCI",
        "Femoral angiography in a radial case, to check the backup access",
        "A ventriculogram to document the final LV function",
        "The ACT, to decide whether more heparin is needed",
        "A wide view of the left main, guide tip and distal wire tip",
      ],
      answer: 4,
      explanation:
        "Tunnel vision on the stent can miss a left main or ostial dissection caused by the guide or guide extension, or a distal wire perforation that later presents as tamponade. The ACT matters for sheath removal but is not the commonly missed angiographic check. A femoral angiogram has no place in a radial case.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "pci-q-proc-9",
      stem: "In which situation does current ESC guidance most clearly support intravascular imaging to guide PCI?",
      options: [
        "A short, focal lesion in a 3.5 mm mid RCA with an excellent angiographic result",
        "Anatomically complex lesions such as left main, true bifurcations and long lesions",
        "Every diagnostic angiogram",
        "Only after a complication has occurred",
      ],
      answer: 1,
      explanation:
        "The 2024 ESC CCS guideline recommends imaging guidance for anatomically complex lesions, supported by trials such as RENOVATE-COMPLEX-PCI. Imaging may still help in simple lesions, but that is where its benefit is least established. Imaging is a planning and optimisation tool, not only a complication tool.",
      difficulty: 2,
      refs: ["esc-ccs-2024", "renovate-2023"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Practise right radial access through to engagement of the left coronary with a supportive guide, checking the pressure trace before every injection." },
    { sim: "pci-bench", task: "Run a complete straightforward PCI on the bench: pre-dilate, size and position the stent normal to normal, deploy, post-dilate with an NC balloon inside the stent, and check expansion." },
    { sim: "cathlab", task: "Acquire final views of a treated vessel in two orthogonal projections, include the ostium and distal wire tip, and grade TIMI flow." },
  ],
  caseIds: ["pci-case-lad-support"],
};

// ---------------------------------------------------------------------------
// Module 8: after the procedure
// ---------------------------------------------------------------------------
const mAfter: Module = {
  id: "pci-after",
  title: "After PCI: haemostasis, monitoring and discharge",
  stage: 3,
  summary:
    "Removing sheaths safely, patent radial haemostasis and femoral options, monitoring after PCI, a structured approach to the hypotensive patient, neurological and visual symptoms, and discharge with DAPT counselling, secondary prevention and follow-up.",
  objectives: [
    "Remove radial and femoral sheaths safely and achieve patent radial haemostasis.",
    "Monitor patients after PCI and recognise early signs of complications.",
    "Work through the differential diagnosis of post-PCI hypotension systematically.",
    "Recognise stroke and contrast-related neurological symptoms after PCI.",
    "Discharge patients with a clear antiplatelet plan, secondary prevention, rehabilitation and follow-up.",
  ],
  lessons: [
    {
      id: "pci-after-haemostasis",
      title: "Sheath removal and haemostasis",
      minutes: 9,
      refs: ["supplied-medmastery", "matrix-2015", "brilakis-manual-pci", "oxford-cath-handbook"],
      blocks: [
        { kind: "h", text: "Radial" },
        {
          kind: "p",
          text: "Because the radial artery is small, superficial and easy to compress, and bleeding is easy to see, the sheath is removed at the end of the procedure even when the patient is fully anticoagulated. A compression band presses on the radial artery while the ulnar artery keeps the hand perfused. The aim is patent haemostasis: enough pressure to stop bleeding, but not so much that flow in the radial artery stops, because occlusive compression is a major cause of radial artery occlusion.",
        },
        {
          kind: "steps",
          title: "Patent radial haemostasis with a compression band",
          items: [
            { title: "Position", detail: "Place the band so its compression point sits over the arterial puncture, which lies slightly proximal to the skin nick. A band that is too distal compresses only skin and will not stop bleeding." },
            { title: "Inflate and remove", detail: "Inflate to the manufacturer's recommended volume as the sheath is withdrawn, and confirm there is no bleeding." },
            { title: "Release to patency", detail: "Let air out slowly until a pulse (or a plethysmograph trace from a pulse oximeter on the hand) just returns distal to the band, with no bleeding. Recheck haemostasis." },
            { title: "Confirm radial flow", detail: "With the oximeter on the index finger, compress the ulnar artery: if the trace persists, the radial artery is open." },
            { title: "Wean", detail: "Reduce the pressure gradually over a couple of hours according to local protocol, then observe for about an hour after removal before discharge." },
            { title: "Left radial", detail: "Single-balloon bands are designed for the right wrist; on the left, the band often needs to be applied upside down." },
          ],
        },
        {
          kind: "keypoints",
          title: "Preventing radial artery occlusion",
          items: [
            "Adequate heparin during the procedure.",
            "Patent haemostasis with the shortest compression time that works.",
            "The smallest sheath that does the job.",
            "Check the radial pulse before discharge. Occlusion is usually painless but removes the artery for future procedures.",
          ],
        },
        {
          kind: "p",
          text: "A radial perforation or dissection may have been sealed by the guide during the case and bleed only once the guide is removed, while the patient is still anticoagulated. Apply firm pressure over the site. If bleeding into the forearm continues, a blood pressure cuff inflated above systolic pressure for a short time stops inflow while the band is repositioned. Elevate the arm. Watch for compartment syndrome: increasing pain, a tense forearm, pain on passive finger extension, or paraesthesia. It is rare but needs urgent surgical review.",
        },
        { kind: "h", text: "Femoral" },
        {
          kind: "table",
          head: ["Option", "How", "Notes"],
          rows: [
            ["Manual compression", "Remove the sheath once the ACT has fallen below the local threshold (180 s in Brilakis; 150–200 s, or after 3–4 hours, in Oxford; 175 s in the Medmastery handbook); press 1–2 cm proximal to the skin puncture, over the arterial puncture", "Occlusive pressure first, then reduce so the distal pulse returns without bleeding; until haemostasis, about 2–3 minutes per French size in Brilakis (12–18 minutes for 6 Fr) or about 8–10 minutes in Oxford; bed rest for some hours"],
            ["Mechanical compression device", "An air-filled pad held by a strap around the patient, deflated gradually", "Frees staff time; still slow"],
            ["Vascular closure device", "Collagen plug or suture-mediated closure at the end of the case", "Immediate removal and earlier mobilisation; needs device-specific training and a suitable puncture site on femoral angiography. Covered in the procedures track"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Compressing the skin nick rather than the arterial puncture.",
            "Leaving a radial band fully inflated for hours.",
            "Pulling a femoral sheath while the ACT is still high.",
            "Missing a high femoral puncture that cannot be compressed against bone.",
            "Ignoring a patient who reports increasing forearm pain under the band.",
          ],
        },
      ],
    },
    {
      id: "pci-after-monitoring-hypotension",
      title: "Monitoring and the hypotensive patient",
      minutes: 11,
      refs: ["supplied-medmastery", "seattle-complications-2020", "brilakis-manual-pci", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "After PCI, monitor heart rate, blood pressure, ECG rhythm, oxygen saturation, conscious level (if sedated), symptoms and the access site. Measure urine output if there was haemodynamic compromise or pre-existing renal impairment. Check a full blood count and renal function, take a 12-lead ECG, and measure troponin if anything during the case suggested periprocedural infarction. A falling blood pressure or a rising heart rate may be the first sign of bleeding and needs prompt assessment.",
        },
        { kind: "h", text: "Hypotension after PCI" },
        {
          kind: "table",
          caption: "Causes of post-PCI hypotension",
          head: ["Cause", "Clues", "Key test"],
          rows: [
            ["Drugs", "Recent sedation, opioids, intracoronary nitrate or the radial cocktail; often mild, patient otherwise well", "Drug chart; response to fluids"],
            ["Dehydration", "Fasting, contrast diuresis, diuretics", "Fluid balance; response to fluids"],
            ["Vasovagal reaction", "Bradycardia with hypotension, nausea, pallor and sweating; often during sheath removal or pain", "Monitor and ECG"],
            ["Retroperitoneal haemorrhage", "Femoral access (especially a high puncture), tachycardia, back, flank or lower abdominal pain, falling haemoglobin; the groin may look normal. Flank and periumbilical bruising appear late", "CT of the abdomen and pelvis"],
            ["Other bleeding", "Access-site haematoma, gastrointestinal bleeding", "Inspection, haemoglobin"],
            ["Cardiac tamponade", "Tachycardia, raised JVP, pulsus paradoxus; may follow an unnoticed distal wire perforation hours after the case", "Bedside echocardiography"],
            ["Acute stent thrombosis or MI", "Chest pain, new ST elevation, arrhythmia, pulmonary oedema", "12-lead ECG, then urgent angiography"],
            ["Arrhythmia", "Brady- or tachyarrhythmia on the monitor", "12-lead ECG"],
            ["Anaphylactic or anaphylactoid reaction", "Rash, urticaria, wheeze, angio-oedema", "Clinical diagnosis"],
            ["LV failure or cardiogenic shock", "Cold peripheries, pulmonary oedema, poor LV on echo", "Echocardiography"],
          ],
        },
        {
          kind: "steps",
          title: "A structured first response",
          items: [
            { title: "Call for help early", detail: "Inform the operator and the cardiology registrar. Hypotension after PCI is a complication until proven otherwise." },
            { title: "ABC", detail: "Lie the patient flat, give oxygen if hypoxic, and repeat a full set of observations." },
            { title: "Access and bloods", detail: "Secure large-bore IV access; send FBC, renal function, clotting and a group and crossmatch; a venous gas gives a rapid haemoglobin and lactate." },
            { title: "Fluids", detail: "Give a fluid bolus. A vasopressor such as metaraminol or phenylephrine may be needed while the cause is found; blood products if major bleeding is likely." },
            { title: "Examine", detail: "Access site (look and feel, including above the groin crease), abdomen and flanks, skin, JVP, heart sounds and chest." },
            { title: "ECG", detail: "A 12-lead ECG for ischaemia, stent thrombosis or arrhythmia." },
            { title: "Echo", detail: "Bedside echocardiography to exclude tamponade and assess LV function." },
            { title: "Review drugs", detail: "Sedation and opioids (consider reversal), vasodilators, antithrombotics." },
            { title: "Targeted imaging", detail: "CT for suspected retroperitoneal bleeding; urgent angiography for suspected stent thrombosis or perforation." },
            { title: "Antithrombotic decisions", detail: "Made with the senior interventionalist, weighing bleeding against the risk of stent thrombosis. Management of specific complications is covered in the complications track." },
          ],
        },
        {
          kind: "pearl",
          text: "Hypotension with tachycardia after femoral access and no visible bleeding is retroperitoneal haemorrhage until proven otherwise. Hypotension with bradycardia during sheath removal is often vagal, but a slow pulse is also often seen with a retroperitoneal bleed, so it does not exclude one. But beta-blockers blunt tachycardia, and a vagal episode can coexist with bleeding, so do not let the first impression stop the assessment.",
        },
        { kind: "h", text: "Neurological and visual symptoms" },
        {
          kind: "p",
          text: "Check for signs of stroke: facial droop, limb weakness, speech disturbance or a homonymous visual field defect. If present, request urgent brain imaging and involve the stroke team. Haemorrhagic stroke may need reversal of heparin (guided by the ACT), interruption of antiplatelets and, in selected cases, platelet transfusion. Ischaemic stroke may be treated with thrombectomy or, if not contraindicated, thrombolysis, coordinated with the stroke team.",
        },
        {
          kind: "p",
          text: "Contrast can also cause non-specific neurological symptoms in the absence of a stroke: confusion, cortical blindness, ophthalmoplegia or ataxia (contrast-induced encephalopathy). These are more common after large contrast volumes, in hypertension and renal impairment, and after internal mammary artery injections. Transient visual disturbance, sometimes a migraine-like aura, is also common after high contrast volumes and intracoronary nitrates. Most of these episodes resolve completely with supportive care, hydration and sitting the patient up, but imaging is still needed to exclude a stroke when signs are focal.",
        },
      ],
    },
    {
      id: "pci-after-discharge",
      title: "Discharge, secondary prevention and follow-up",
      minutes: 9,
      refs: ["supplied-medmastery", "esc-acs-2023", "esc-ccs-2024", "hanna-pcm", "cutlip-arc-2007", "dvla-fitness-to-drive"],
      blocks: [
        {
          kind: "p",
          text: "Discharge is a clinical procedure in its own right. Patients go home with a new stent, new drugs and many questions, and most late problems after PCI come from what happens in the weeks after discharge. After uncomplicated elective radial PCI, same-day discharge is routine in many UK centres once the patient is stable, the access site is settled and they have been counselled.",
        },
        {
          kind: "table",
          caption: "Discharge checklist",
          head: ["Item", "Content"],
          rows: [
            ["Antiplatelet plan", "Named drugs, doses, duration and stop date; never stop without cardiology advice; who to contact before surgery or dental work"],
            ["Gastric protection", "A proton pump inhibitor if GI bleeding risk is increased"],
            ["Lipids", "High-intensity statin; ESC goal for very high-risk patients is LDL cholesterol below 1.4 mmol/L and at least a 50% reduction; add ezetimibe or other agents if needed"],
            ["Blood pressure and diabetes", "Treat to target; in diabetes, prefer agents with proven cardiovascular benefit (SGLT2 inhibitors, GLP-1 receptor agonists)"],
            ["Other secondary prevention", "ACE inhibitor where indicated (heart failure, LV dysfunction, diabetes, hypertension, CKD); beta-blocker after MI with LVEF 40% or less; smoking cessation"],
            ["Symptom relief", "Sublingual GTN and clear instructions on when to call an ambulance"],
            ["Access site", "What is normal bruising; what to do if it bleeds (press firmly and seek help); signs of a false aneurysm or infection"],
            ["Driving and work", "UK patients should follow current DVLA guidance; ordinary car licence holders are usually advised not to drive for about a week after uncomplicated PCI, and bus or lorry licence holders must notify DVLA"],
            ["Cardiac rehabilitation", "Refer every eligible patient"],
            ["Follow-up", "Clinic review; renal function at 48–72 hours if at risk of contrast-associated kidney injury"],
          ],
        },
        {
          kind: "pearl",
          text: "Ask the patient to tell you, in their own words, how long they will take each antiplatelet drug and what they would do if a dentist or surgeon told them to stop. If they cannot, the counselling has not worked yet.",
        },
        { kind: "h", text: "Late problems" },
        {
          kind: "table",
          caption: "Stent thrombosis by timing (Academic Research Consortium definitions)",
          head: ["Category", "Time after PCI", "Common associations"],
          rows: [
            ["Acute", "Within 24 hours", "Mechanical problems: underexpansion, edge dissection, residual thrombus, inadequate antithrombotic cover"],
            ["Subacute", "24 hours to 30 days", "As above, plus early DAPT interruption or poor response"],
            ["Late", "30 days to 1 year", "DAPT interruption, malapposition, underexpansion"],
            ["Very late", "Over 1 year", "Neoatherosclerosis, delayed healing, malapposition"],
          ],
        },
        {
          kind: "p",
          text: "Stent thrombosis usually presents abruptly as STEMI and needs immediate angiography. In-stent restenosis develops more gradually, typically months after the procedure, with returning angina, although it can present as ACS. Patients with recurrent symptoms after PCI deserve assessment rather than reassurance.",
        },
        {
          kind: "pitfalls",
          items: [
            "Discharge letters without a DAPT stop date or with the wrong P2Y12 inhibitor.",
            "Prasugrel 10 mg continued in an older or low-weight patient.",
            "NSAIDs prescribed for musculoskeletal pain on top of DAPT.",
            "Aspirin stopped by a dentist without discussion.",
            "Patients told their artery is 'fixed', who then stop the statin.",
            "No rehabilitation referral.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pci-q-after-1",
      stem: "What is the purpose of releasing air from a radial compression band until a pulse just returns distal to it?",
      options: [
        "To reduce the patient's discomfort during the compression period",
        "To allow earlier discharge regardless of any bleeding at the site",
        "To check ulnar artery patency while the radial is compressed",
        "To achieve patent haemostasis and lower radial occlusion risk",
        "To reduce the ACT before the band is removed completely",
      ],
      answer: 3,
      explanation:
        "Patent haemostasis stops bleeding while keeping flow in the radial artery, which reduces radial artery occlusion. Comfort improves too, but that is not the main aim. The ulnar artery is assessed separately by compressing it while watching the oximeter trace.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-after-2",
      stem: "A femoral sheath is to be removed with manual compression after PCI using heparin. What is the conventional ACT threshold for removal?",
      options: ["Below about 175–180 s", "Below about 300 s", "Below about 400 s", "The ACT does not matter", "Above 250 s"],
      answer: 0,
      explanation:
        "Brilakis delays femoral sheath removal and manual pressure until the ACT is below 180 seconds, and the Medmastery handbook uses below 175 seconds; the Oxford handbook gives below 150–200 seconds, or 3–4 hours after heparin, according to local protocol. All aim to limit bleeding and haematoma. A value of 300 seconds is in the therapeutic range for PCI and far too high for sheath removal. Radial sheaths are different: they are removed straight away.",
      difficulty: 1,
      refs: ["supplied-medmastery", "brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "pci-q-after-3",
      stem: "During femoral sheath removal, a patient becomes pale, sweaty and nauseated. Heart rate is 42/min and blood pressure 78/40 mmHg. What is the most likely cause?",
      options: ["Retroperitoneal haemorrhage", "Vasovagal reaction", "Cardiac tamponade", "Acute stent thrombosis", "Anaphylaxis"],
      answer: 1,
      explanation:
        "Bradycardia with hypotension, pallor, sweating and nausea during sheath removal is typical of a vasovagal reaction: lie the patient flat, raise the legs, give fluids and atropine if needed. Bleeding and tamponade usually cause tachycardia, although beta-blockers can blunt this, so reassess once the episode settles.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-after-4",
      stem: "Three hours after femoral PCI, a patient is hypotensive and tachycardic with right flank pain. The groin is soft with no haematoma. Haemoglobin has fallen by 25 g/L. Which investigation is most appropriate once resuscitation has started?",
      options: [
        "Repeat coronary angiography",
        "Groin ultrasound only",
        "CT of the abdomen and pelvis",
        "Repeat haemoglobin in six hours",
        "Chest X-ray",
      ],
      answer: 2,
      explanation:
        "This picture suggests retroperitoneal haemorrhage, which is invisible at the groin and diagnosed by CT. Groin ultrasound shows a false aneurysm but not retroperitoneal blood. Waiting six hours risks deterioration. Coronary angiography does not address the likely cause.",
      difficulty: 2,
      refs: ["supplied-medmastery", "seattle-complications-2020"],
    },
    {
      id: "pci-q-after-5",
      stem: "Two hours after PCI, a patient is hypotensive with a raised JVP and pulsus paradoxus. The ECG shows sinus tachycardia without new ST changes. What is the most urgent test?",
      options: [
        "Bedside echocardiography",
        "CT of the abdomen",
        "Repeat troponin",
        "Chest X-ray",
        "Cardiac MRI",
      ],
      answer: 0,
      explanation:
        "Raised JVP, hypotension and pulsus paradoxus suggest tamponade, often from a distal wire perforation, and bedside echocardiography confirms it quickly. CT is the test for retroperitoneal bleeding, which would cause a low JVP. Troponin and MRI are too slow and do not guide the immediate decision.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "pci-q-after-6",
      stem: "Six hours after LAD stenting, a patient develops severe chest pain with new anterior ST elevation. What is the most likely diagnosis and management?",
      options: [
        "Pericarditis; give NSAIDs",
        "Contrast reaction; give antihistamines",
        "Vasovagal reaction; give atropine",
        "Gastro-oesophageal reflux; give a PPI",
        "Acute stent thrombosis; urgent repeat angiography",
      ],
      answer: 4,
      explanation:
        "New ST elevation in the territory of a recently stented vessel is acute stent thrombosis until proven otherwise and needs urgent angiography. Post-procedure pericarditis is uncommon and would not cause territorial ST elevation within hours of a stent. NSAIDs would add bleeding risk on DAPT.",
      difficulty: 1,
      refs: ["supplied-medmastery", "esc-acs-2023"],
    },
    {
      id: "pci-q-after-7",
      stem: "A patient has stent thrombosis four months after elective PCI. How is this classified by the Academic Research Consortium timing categories?",
      options: ["Acute", "Subacute", "Late", "Very late"],
      answer: 2,
      explanation:
        "Late stent thrombosis occurs between 30 days and one year. Acute is within 24 hours, subacute between 24 hours and 30 days, and very late after one year. Premature DAPT interruption is a common association in this period.",
      difficulty: 1,
      refs: ["hanna-pcm", "cutlip-arc-2007"],
    },
    {
      id: "pci-q-after-8",
      stem: "After a long PCI with a large contrast volume and internal mammary graft injections, a hypertensive patient with CKD develops confusion and bilateral blurred vision. Brain imaging shows no stroke or haemorrhage. What is the most likely cause?",
      options: [
        "Contrast-induced encephalopathy",
        "Hypoglycaemia",
        "Retinal artery occlusion in both eyes",
        "Heparin-induced thrombocytopenia",
        "Opioid toxicity",
      ],
      answer: 0,
      explanation:
        "Large contrast volumes, hypertension, renal impairment and mammary artery injections are associated with contrast-induced neurotoxicity, which can cause confusion and cortical visual loss and usually resolves with supportive care. Bilateral simultaneous retinal artery occlusion is very unlikely. Always check glucose, but the clinical setting points to contrast.",
      difficulty: 3,
      refs: ["supplied-medmastery"],
    },
  ],
  caseIds: ["pci-case-ward-hypotension"],
};

// ---------------------------------------------------------------------------
// Cases (synthetic)
// ---------------------------------------------------------------------------
const caseLadSupport: CaseStudy = {
  id: "pci-case-lad-support",
  title: "Elective proximal LAD PCI: the stent that would not go",
  trackId: "pci-core",
  stage: 3,
  provenance: { kind: "synthetic" },
  summary:
    "Elective radial PCI of a proximal LAD lesion in which a weak guide fails to deliver the stent. Covers loading, guide choice, escalating support, safe deployment with a guide extension, and optimisation.",
  presentation:
    "A 64-year-old man with CCS class III angina despite bisoprolol 5 mg and isosorbide mononitrate 60 mg. Diagnostic angiography three weeks ago showed an 80% stenosis in the proximal LAD, beginning just beyond the first diagonal, with moderate calcification. FFR was 0.70. The heart team agreed on PCI. He takes aspirin 75 mg and atorvastatin 80 mg. eGFR 78, haemoglobin 142 g/L, weight 86 kg. Right radial pulse is strong.",
  findings: [
    "Proximal LAD stenosis, 80%, about 18 mm long, starting 3 mm beyond a 2.25 mm first diagonal",
    "Moderate calcification and a 60° bend in the proximal LAD",
    "Reference diameters: LAD just beyond the first diagonal 3.25 mm, mid LAD 3.0 mm",
    "Normal aortic root; short left main",
  ],
  steps: [
    {
      id: "s1",
      prompt: "He arrives on the day unit having taken aspirin but no P2Y12 inhibitor. The list starts in about three hours. What is the best antiplatelet plan?",
      info: "BP 138/82 mmHg, HR 62/min, SpO2 97%. No bleeding history. Not on anticoagulants.",
      options: [
        {
          text: "Give ticagrelor 180 mg now because it acts faster.",
          feedback:
            "Ticagrelor is not the default for uncomplicated elective PCI. It adds bleeding and side effects without proven benefit here; reserve potent agents for ACS or selected high thrombotic-risk elective cases.",
          next: "s2",
        },
        {
          text: "Postpone the case until he has taken clopidogrel 75 mg daily for a week.",
          acceptable: true,
          feedback:
            "This works, and some units prefer maintenance loading for elective cases, but it is unnecessary: a 600 mg load a few hours before the case achieves adequate inhibition without cancelling the list slot.",
          next: "s2",
        },
        {
          text: "Give clopidogrel 600 mg now and proceed.",
          best: true,
          feedback:
            "Correct. For elective PCI in a chronic coronary syndrome, aspirin plus clopidogrel is the default, and a 600 mg load given a few hours ahead gives good platelet inhibition by the time of stenting.",
          next: "s2",
        },
        {
          text: "Proceed on aspirin alone and give a GP IIb/IIIa inhibitor in the lab instead.",
          feedback:
            "GP IIb/IIIa inhibitors are a bail-out tool for thrombotic complications, not a replacement for a P2Y12 inhibitor. This approach adds bleeding risk and still leaves him without DAPT afterwards.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "A 6 Fr right radial sheath is in and heparin has been given (ACT 286 s). Which guide do you choose for this proximal LAD lesion with calcium and a 60° bend?",
      options: [
        {
          text: "JL3.5, 6 Fr",
          acceptable: true,
          feedback:
            "A JL3.5 will engage nicely from the right radial and is fine for many simple LAD lesions, but its support is modest. With calcium and a proximal bend, you may run out of support. Read on to see what happens with this choice.",
          next: "s3",
        },
        {
          text: "EBU 3.5, 6 Fr",
          best: true,
          feedback:
            "An extra-backup guide sits along the contralateral aortic wall and gives strong passive support for the LAD and circumflex. With calcium and a bend ahead of you, plan for the hardest part of the case. Watch for deep seating in the short left main.",
          next: "s3",
        },
        {
          text: "AL2, 6 Fr",
          feedback:
            "An Amplatz gives strong support, but it is more aggressive at the ostium and in a short left main it risks dissection. It is not a first choice for a routine LAD lesion in a normal root.",
          next: "s3",
        },
        {
          text: "JR4, 6 Fr",
          feedback: "A JR4 is designed for the right coronary artery and will not engage the left coronary system usefully.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "In this case a JL3.5 was used. A workhorse wire crossed easily and is parked in the distal LAD. A 2.5 × 15 mm SC balloon fully expanded at 10 atm with no residual waist. A 3.0 × 23 mm DES now stops at the 60° bend, and the guide backs out of the left main with each push. What next?",
      info: "The wire tip is stable in the distal LAD. The patient is comfortable; ECG unchanged. ACT 268 s.",
      options: [
        {
          text: "Add a second extra-support buddy wire.",
          acceptable: true,
          feedback:
            "Reasonable: a buddy wire straightens the bend and reduces friction, and is often tried first. With the guide already backing out, it may not be enough, and the buddy wire must be removed before deployment.",
          next: "s4",
        },
        {
          text: "Exchange the JL3.5 for an EBU 3.5 over an exchange-length wire.",
          acceptable: true,
          feedback:
            "This fixes the root cause, but an exchange risks losing wire position and takes time. Many operators try a buddy wire or guide extension first and reserve a guide change for when those fail.",
          next: "s4",
        },
        {
          text: "Push harder while pulling back on the wire to 'straighten' the system.",
          feedback:
            "Pulling the wire while pushing the stent loses distal wire position, and forceful pushing against a non-coaxial guide risks left main dissection and stripping the stent off its balloon. Stop and think about support instead.",
          next: "s3-pushed-dissection", stateDelta: {"stability": -20, "flags": ["guide-dissection"]} },
        {
          text: "Withdraw the stent into the guide, keep the wire, and advance a guide extension into the proximal LAD over a balloon.",
          best: true,
          feedback:
            "The lesion is prepared (the balloon expanded fully), so the problem is support and proximal friction. A guide extension, delivered over a balloon to protect the vessel, increases support and carries the stent beyond the bend. Watch the pressure trace for damping.",
          next: "s4",
        },
        {
          text: "Deploy the stent at the bend and dilate the lesion through it later.",
          feedback:
            "Deploying a stent away from the lesion commits you to a poor result and makes later device delivery even harder. Never deploy in the wrong place to escape a delivery problem.",
          next: "s3-deployed-at-bend", stateDelta: {"stability": -15} },
      ],
    },
    {
      id: "s4",
      prompt: "With the guide extension in the proximal LAD, the stent reaches the lesion. How do you deploy it?",
      info: "The extension tip lies 10 mm proximal to the lesion. The pressure trace is mildly damped. The proximal stent marker is 3 mm beyond the first diagonal origin.",
      options: [
        {
          text: "Deploy immediately at rated burst pressure to save time, as the extension is causing damping.",
          feedback:
            "Rushing risks geographic miss and an edge dissection. Deploying at RBP is not a substitute for checking position and post-dilating properly. Damping is managed by limiting the time the extension spends in the vessel, not by skipping checks.",
          next: "s3-pushed-dissection", stateDelta: {"stability": -15, "flags": ["guide-dissection"]} },
        {
          text: "Deploy with the proximal stent edge still inside the guide extension so it stays stable.",
          feedback:
            "Expanding a stent inside or at the tip of a guide extension can crush or deform the stent and trap the extension. Always confirm the stent is fully clear before inflation.",
          next: "s5",
        },
        {
          text: "Confirm the position with contrast in two views, pull the extension back so the stent is completely out of it, steady the system, and deploy under fluoroscopy at nominal pressure, watching for a waist.",
          best: true,
          feedback:
            "Correct. The stent must be fully outside the extension before deployment, and position must be confirmed in more than one view to avoid geographic miss. The mild damping is another reason to keep the extension in the vessel only as long as necessary.",
          next: "s5",
        },
        {
          text: "Advance the extension further, over the lesion, so the stent can be unsheathed exactly in position.",
          acceptable: true,
          feedback:
            "Some operators do take the extension across or near the lesion and withdraw it to expose the stent, but this increases the risk of damping, ischaemia and vessel injury. It is a valid technique in difficult cases, not the default here.",
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      prompt: "After deployment at 12 atm, the stent shows a waist in its mid portion and a residual stenosis of about 25%. TIMI 3 flow. What next?",
      options: [
        {
          text: "Perform IVUS to measure expansion and size the post-dilatation balloons.",
          acceptable: true,
          feedback:
            "A good choice, particularly with calcium. Imaging will confirm underexpansion and guide balloon size. You will still need NC post-dilatation; imaging adds precision.",
          next: "s6",
        },
        {
          text: "Post-dilate with a 3.5 × 30 mm SC balloon at 18 atm along the whole stent.",
          feedback:
            "A long, semi-compliant balloon at high pressure will overhang the stent edges and grow beyond its label in the distal 3.0 mm vessel, risking edge dissection and perforation.",
          next: "s6",
        },
        {
          text: "Accept the result because flow is TIMI 3.",
          feedback:
            "TIMI 3 flow does not mean the stent is well expanded. Underexpansion is a leading cause of stent thrombosis and restenosis.",
          next: "s6",
        },
        {
          text: "Post-dilate with a 3.0 × 15 mm NC balloon inside the stent at high pressure, then post-dilate the proximal segment with a 3.25 mm NC balloon.",
          best: true,
          feedback:
            "Correct. A shorter NC balloon inside the stent expands the waist without injuring the edges, and the proximal segment, with its 3.25 mm reference, needs a slightly larger balloon to be apposed. Confirm that the 3.0 mm platform can safely reach that diameter.",
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      prompt: "After post-dilatation the stent looks well expanded. How do you finish?",
      options: [
        {
          text: "Remove the wire, take one view of the stented segment and finish.",
          feedback:
            "One view of the stent alone misses ostial or left main injury from the guide and extension, edge dissections hidden by overlap and distal perforation. And once the wire is out, fixing any problem is harder.",
        },
        {
          text: "Take final views in two orthogonal projections with the wire still in, including the left main and distal LAD; then remove the wire and take a final run.",
          best: true,
          feedback:
            "Correct. Leave the wire in until you are satisfied, look beyond the stent for guide or extension trauma to the left main and for distal wire perforation, and take a final run after wire removal to unmask pseudolesions.",
        },
        {
          text: "Perform IVUS of the whole LAD and left main before removing the wire.",
          acceptable: true,
          feedback:
            "Reasonable when there is doubt about the result or about injury from the extension, but it does not replace final angiography in two views.",
        },
      ],
    },
    {
      "id": "s3-pushed-dissection",
      "kind": "consequence",
      "info": "As the guide jumps forward the patient feels pain. The next injection shows a spiral dissection flap starting at the left main ostium; LAD flow TIMI 2.",
      "prompt": "The guide has dissected the left main. What is your priority?",
      "options": [
        {
          "text": "Keep the wire in the LAD, avoid forceful injections, and seal the entry with a stent from the left main into the LAD; image to confirm coverage",
          "best": true,
          "feedback": "A guide-induced left main dissection is sealed promptly over the wire you already have.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Withdraw everything and send the patient for surgery",
          "feedback": "Losing the wire loses the means to treat a dissection that can usually be stented now.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Inject forcefully to define the extent of the flap",
          "feedback": "Forceful injections extend the dissection.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s3-deployed-at-bend",
      "kind": "consequence",
      "info": "The stent is deployed proximal to the lesion at the bend. The lesion itself is untreated and now lies beyond a stent that a new stent must cross.",
      "prompt": "How do you recover?",
      "options": [
        {
          "text": "Increase support (guide extension or extra-backup guide), then deliver a second stent through the first to cover the lesion with a short overlap",
          "best": true,
          "feedback": "Support solves delivery; the lesion still needs coverage.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Balloon the lesion and leave it unstented",
          "acceptable": true,
          "feedback": "A possible fallback, but it leaves a stented bend and an unstented calcified lesion.",
          "stateDelta": {
            "stability": -5
          }
        },
        {
          "text": "Push a second stent harder through the first without extra support",
          "feedback": "The same problem recurs and now the stent may strip on the deployed struts.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
  ],
  outcome:
    "The stent was delivered with a guide extension, deployed without geographic miss, and optimised with NC post-dilatation. Final angiography showed no residual stenosis, TIMI 3 flow, a normal left main and a safe distal wire position. He went home the same day on aspirin and clopidogrel for six months, then single antiplatelet therapy, with his angina resolved at follow-up.",
  outcomeVariants: [
    {
      "flag": "guide-dissection",
      "text": "Pushing against a backing-out guide caused a left main dissection that needed an extra stent."
    }
  ],
  learningPoints: [
    "Choose guide support for the hardest part of the case: calcium and proximal bends call for an extra-backup guide from the start.",
    "When a stent will not advance after good lesion preparation, the problem is support or friction: add support rather than force.",
    "With a guide extension, make sure the stent is completely clear of it before deployment and check the proximal vessel at the end.",
    "Post-dilate with a short NC balloon inside the stent and size the proximal segment to its own reference.",
    "Finish with two orthogonal views and a wide field before and after removing the wire.",
  ],
  refs: ["supplied-medmastery", "brilakis-manual-pci", "esc-ccs-2024"],
};

const caseNstemiThrombus: CaseStudy = {
  id: "pci-case-nstemi-thrombus",
  title: "NSTEMI culprit with thrombus: drugs and timing",
  trackId: "pci-core",
  stage: 3,
  provenance: { kind: "synthetic" },
  summary:
    "A high-risk NSTEMI with a thrombotic circumflex culprit. Covers timing of angiography, P2Y12 pretreatment, anticoagulation after fondaparinux, bail-out GP IIb/IIIa use, DAPT duration and the non-culprit lesion.",
  presentation:
    "A 67-year-old man with two hours of central chest pain, now settled after GTN. Hypertension, ex-smoker. ECG: 1 mm ST depression in V4–V6 and lead I, resolving after GTN. High-sensitivity troponin T 64 ng/L, rising to 210 ng/L at one hour. Weight 82 kg, eGFR 74, haemoglobin 148 g/L. No previous stroke or bleeding.",
  findings: [
    "NSTEMI with dynamic lateral ST depression and rising troponin",
    "GRACE score 148",
    "Pain free on arrival on the ward; haemodynamically stable",
  ],
  steps: [
    {
      id: "s1",
      prompt: "He is pain free and stable. When should invasive angiography take place?",
      info: "BP 146/88 mmHg, HR 78/min, no crackles, no arrhythmia on telemetry.",
      options: [
        {
          text: "Immediately, within 2 hours.",
          feedback:
            "Immediate angiography is for very high-risk features: shock, refractory pain, life-threatening arrhythmia, acute heart failure or mechanical complications. He has none. Move him up to immediate if pain recurs with ECG changes.",
          next: "s2",
        },
        {
          text: "Within 24 hours (early invasive strategy).",
          best: true,
          feedback:
            "Correct. A confirmed NSTEMI with dynamic ECG changes and GRACE above 140 is high risk, for which the 2023 ESC guideline suggests an early invasive strategy within 24 hours.",
          next: "s2",
        },
        {
          text: "After a non-invasive stress test.",
          feedback:
            "A selective invasive strategy guided by testing is for patients without high-risk features. Stress testing a patient with a confirmed NSTEMI delays the appropriate treatment.",
          next: "s2",
        },
        {
          text: "Give fibrinolysis now and arrange angiography within 24 hours.",
          feedback: "Fibrinolysis has no role in NSTE-ACS and increases bleeding without benefit.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "Angiography is booked for the next morning, within 24 hours. He has had aspirin 300 mg. What about a P2Y12 inhibitor and anticoagulation tonight?",
      options: [
        {
          text: "Load ticagrelor 180 mg now.",
          feedback:
            "Routine pretreatment used to be standard, but it has not been shown to reduce ischaemic events when angiography is early, and if he needs CABG, ticagrelor delays surgery by several days.",
          next: "s3",
        },
        {
          text: "Start a GP IIb/IIIa inhibitor infusion upstream.",
          feedback: "Upstream GP IIb/IIIa inhibitors are not recommended. They increase bleeding without sufficient benefit.",
          next: "s3",
        },
        {
          text: "No anticoagulation; aspirin is enough until angiography.",
          feedback: "Parenteral anticoagulation is recommended in NSTE-ACS until angiography alongside antiplatelet therapy.",
          next: "s3",
        },
        {
          text: "No routine P2Y12 pretreatment; give parenteral anticoagulation per local protocol and load the P2Y12 inhibitor once the anatomy is known.",
          best: true,
          feedback:
            "Correct. The 2023 ESC ACS guideline recommends against routine pretreatment when angiography is planned within 24 hours. This avoids extra bleeding and keeps the CABG option open. Many UK units use fondaparinux upstream.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "He received fondaparinux 2.5 mg subcutaneously last night. Radial angiography shows a 90% proximal circumflex stenosis with a hazy, irregular filling defect and TIMI 2 flow. The LAD is normal; the mid RCA has a 50–60% stenosis. You decide to treat the circumflex. What anticoagulant and antiplatelet treatment do you give now?",
      info: "ACT before heparin 132 s. He has no contraindication to potent P2Y12 inhibitors.",
      options: [
        {
          text: "UFH bolus of 70–100 units/kg to a therapeutic ACT, and prasugrel 60 mg.",
          best: true,
          feedback:
            "Correct. Fondaparinux alone is associated with guide catheter thrombosis, so a full UFH bolus is needed for PCI. The 2023 ESC guideline suggests prasugrel should be considered in preference to ticagrelor for ACS patients proceeding to PCI. He is under 75, over 60 kg and has no history of stroke.",
          next: "s4",
        },
        {
          text: "UFH bolus to a therapeutic ACT, and ticagrelor 180 mg.",
          acceptable: true,
          feedback: "A sound alternative. Ticagrelor is an appropriate potent P2Y12 inhibitor in ACS; current ESC guidance slightly favours prasugrel when PCI is performed.",
          next: "s4",
        },
        {
          text: "No heparin, because he had fondaparinux; give clopidogrel 600 mg.",
          feedback:
            "Fondaparinux does not protect against catheter thrombosis during PCI: a full UFH bolus is needed. Clopidogrel is also a weaker choice than prasugrel or ticagrelor in ACS without high bleeding risk or OAC.",
          next: "s3-no-heparin-thrombus", stateDelta: {"stability": -20} },
        {
          text: "Reduced-dose UFH (30 units/kg) to avoid bleeding with fondaparinux on board.",
          feedback:
            "A prophylactic fondaparinux dose does not justify under-anticoagulating the PCI. Aim for the standard ACT target.",
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      prompt: "The wire crosses easily. After a small balloon pre-dilatation, flow falls to TIMI 1 and the filling defect has grown. He reports chest pain and there is 2 mm ST elevation in I and aVL. BP 118/70 mmHg. What next?",
      options: [
        {
          text: "Perform aspiration thrombectomy, then stent.",
          acceptable: true,
          feedback:
            "Selective, bail-out aspiration is reasonable with a large thrombus burden, provided it is done carefully with a well-engaged guide to avoid embolising thrombus into the aorta. It works best alongside optimised antithrombotic therapy.",
          next: "s5",
        },
        {
          text: "Post-dilate repeatedly with a large balloon at high pressure to 'push the thrombus away'.",
          feedback:
            "Aggressive, oversized dilatation in thrombus drives debris downstream and worsens slow flow and no-reflow.",
          next: "s4-pushed-thrombus", stateDelta: {"stability": -20, "flags": ["no-reflow"]} },
        {
          text: "Give a GP IIb/IIIa inhibitor as bail-out (with the heparin dose and ACT target adjusted), and consider selective aspiration before stenting.",
          best: true,
          feedback:
            "Correct. A growing thrombus burden with deteriorating flow is the classic bail-out indication for a GP IIb/IIIa inhibitor. Aspiration can be used selectively, but routine aspiration did not improve outcomes in TOTAL. Check platelet counts during the infusion.",
          next: "s5",
        },
        {
          text: "Stop the procedure and send him back to the ward on prasugrel.",
          feedback:
            "With falling flow, ongoing pain and ST elevation, the artery is threatened. This needs treatment now, not withdrawal.",
          next: "s4-pushed-thrombus", stateDelta: {"stability": -15, "flags": ["no-reflow"]} },
      ],
    },
    {
      id: "s5",
      prompt: "A 3.5 × 18 mm DES is implanted and optimised with an NC balloon. Final flow is TIMI 3, pain has gone and the ST segments resolve. What antiplatelet plan do you write on the discharge letter?",
      options: [
        {
          text: "Aspirin and clopidogrel for 6 months.",
          feedback: "That is the default after elective PCI for a chronic coronary syndrome, not after ACS in a patient without high bleeding risk.",
          next: "s6",
        },
        {
          text: "Aspirin 75 mg and prasugrel 10 mg for 12 months, then single antiplatelet therapy; a PPI if GI bleeding risk is increased.",
          best: true,
          feedback:
            "Correct. Twelve months of DAPT with a potent P2Y12 inhibitor is the default after ACS without high bleeding risk. The ESC guideline also allows a switch to single antiplatelet therapy after 3–6 months in event-free patients who are not at high ischaemic risk.",
          next: "s6",
        },
        {
          text: "Aspirin and prasugrel for 1 month only.",
          feedback: "One month of DAPT is reserved for patients at high bleeding risk. He has none of the criteria.",
          next: "s6",
        },
        {
          text: "Lifelong aspirin and prasugrel.",
          feedback: "Indefinite potent DAPT increases bleeding; extended antithrombotic therapy is reserved for selected high ischaemic-risk patients without high bleeding risk.",
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      prompt: "What do you do about the 50–60% mid-RCA stenosis?",
      options: [
        {
          text: "Stent it now while the guide is in place.",
          feedback:
            "An intermediate lesion should not be stented on appearance alone, and adding a second vessel in a thrombotic, unstable procedure adds risk. Assess it first.",
        },
        {
          text: "Ignore it; he can have a stress test if symptoms return.",
          acceptable: true,
          feedback:
            "Some clinicians take this approach with intermediate non-culprit disease, but the guideline position favours considering complete revascularisation in multivessel ACS, so a planned assessment is better.",
        },
        {
          text: "Assess it physiologically (during this admission or as a staged procedure) and treat it only if it is significant.",
          best: true,
          feedback:
            "Correct. In NSTE-ACS with multivessel disease, complete revascularisation should be considered, and functional assessment of an intermediate non-culprit lesion avoids stenting lesions that do not cause ischaemia.",
        },
        {
          text: "Refer for CABG to treat the RCA.",
          feedback: "Surgery for a single intermediate RCA lesion after a successful culprit PCI is not indicated.",
        },
      ],
    },
    {
      "id": "s4-pushed-thrombus",
      "kind": "consequence",
      "info": "Flow is now TIMI 0–1 with contrast hanging in the distal vessel. ST elevation 4 mm in I and aVL; BP 92/60 mmHg.",
      "prompt": "This is no-reflow with distal embolisation. What now?",
      "options": [
        {
          "text": "Stop balloon work; bail-out GP IIb/IIIa, aspiration if a large thrombus remains, and distal vasodilator through a microcatheter",
          "best": true,
          "feedback": "Further dilatation embolises more; pharmacological rescue and distal delivery are the steps.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Stent the segment immediately to trap the thrombus",
          "acceptable": true,
          "feedback": "Stenting may be needed but does not treat embolised microvascular obstruction.",
          "stateDelta": {
            "stability": -5
          }
        },
        {
          "text": "Inject adenosine through the guide only",
          "feedback": "With no forward flow, guide-delivered drug refluxes into the aorta.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
    {
      "id": "s3-no-heparin-thrombus",
      "kind": "consequence",
      "info": "During wiring, fresh thrombus forms on the guide tip and a new filling defect appears in the proximal circumflex. ACT 140 s.",
      "prompt": "Fondaparinux alone does not protect against catheter thrombus. What do you do?",
      "options": [
        {
          "text": "Give a full UFH bolus to a therapeutic ACT, aspirate the guide, and continue cautiously",
          "best": true,
          "feedback": "Patients on fondaparinux need standard UFH during PCI because of catheter thrombosis.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Give a second dose of fondaparinux",
          "feedback": "Fondaparinux does not prevent catheter thrombus at PCI doses.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Continue without anticoagulation to limit bleeding",
          "feedback": "Thrombus will grow and embolise.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
  ],
  outcome:
    "The circumflex culprit was treated successfully with bail-out GP IIb/IIIa inhibition and a DES. A staged pressure-wire study of the RCA was negative (not significant), so it was treated medically. He was discharged on aspirin and prasugrel for 12 months, high-intensity statin and an ACE inhibitor, with a cardiac rehabilitation referral.",
  outcomeVariants: [
    {
      "flag": "no-reflow",
      "text": "Aggressive balloon work on a thrombotic lesion caused no-reflow and a larger infarct."
    }
  ],
  learningPoints: [
    "High-risk NSTEMI (confirmed infarction, dynamic ECG changes, GRACE above 140) calls for an early invasive strategy within 24 hours; very high-risk features call for immediate angiography.",
    "Routine P2Y12 pretreatment is not recommended when early angiography is planned; load once the anatomy is known.",
    "Fondaparinux must be followed by a full UFH bolus at PCI.",
    "GP IIb/IIIa inhibitors are a bail-out tool for growing thrombus or slow flow; avoid aggressive dilatation in thrombus.",
    "Twelve months of DAPT with a potent P2Y12 inhibitor is the default after ACS, adjusted for bleeding risk.",
  ],
  refs: ["esc-acs-2023", "total-2015", "supplied-medmastery", "brilakis-manual-pci", "isar-react5-2019"],
};

const caseWardHypotension: CaseStudy = {
  id: "pci-case-ward-hypotension",
  title: "Hypotension on the ward two hours after PCI",
  trackId: "pci-core",
  stage: 3,
  provenance: { kind: "synthetic" },
  summary:
    "A patient becomes hypotensive two hours after femoral PCI. Covers the structured first response, the differential diagnosis, investigation, antithrombotic decisions and prevention.",
  presentation:
    "A 74-year-old woman (58 kg) had PCI to the mid RCA for NSTEMI this afternoon. Right radial access failed because of a small, spastic artery and a radial loop, so a 6 Fr right femoral sheath was used. She received UFH and is on aspirin and ticagrelor. The sheath was removed with manual compression when the ACT was 165 s. Two hours later, the ward nurse calls: blood pressure 84/50 mmHg (128/72 mmHg after the procedure), heart rate 112/min, and she feels sweaty and unwell.",
  findings: [
    "Femoral access after failed radial access",
    "Hypotension with tachycardia two hours after PCI",
    "On aspirin and ticagrelor; heparin given during the procedure",
  ],
  steps: [
    {
      id: "s1",
      prompt: "You arrive on the ward. What is your first action?",
      info: "Alert and orientated. BP 82/48 mmHg, HR 114/min sinus rhythm, RR 22/min, SpO2 96% on air, cool peripheries.",
      options: [
        {
          text: "Give a fluid bolus and review her in an hour.",
          feedback:
            "Fluids are appropriate, but waiting an hour without examination, bloods or escalation risks missing bleeding or tamponade while they progress.",
          next: "s1-delayed-review", stateDelta: {"stability": -15, "flags": ["bleed-delay"]} },
        {
          text: "Start metaraminol and continue observations.",
          feedback:
            "A vasopressor may be needed while you find the cause, but on its own it treats the number, not the patient. Bleeding needs volume and source control.",
          next: "s2",
        },
        {
          text: "Give atropine 600 micrograms.",
          feedback: "She is tachycardic, not bradycardic. Atropine is for vasovagal bradycardia and will not help here.",
          next: "s2",
        },
        {
          text: "Lie her flat, call the cardiology registrar and operator, insert two large-bore cannulas, send FBC, renal function, clotting and a group and crossmatch, start a fluid bolus, and examine the access site, abdomen, JVP and chest while arranging a 12-lead ECG.",
          best: true,
          feedback:
            "Correct. Treat post-PCI hypotension as a complication until proven otherwise: resuscitate, escalate early and start the targeted assessment at the same time.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "On examination, what is the most likely diagnosis?",
      info: "The right groin is soft with a small bruise and no expanding haematoma; distal pulses are present. She now reports right lower back and flank pain. JVP is not visible lying flat; heart sounds are normal; chest is clear. ECG: sinus tachycardia, no new ST changes. A venous gas shows haemoglobin 96 g/L (124 g/L before the procedure) and lactate 3.1 mmol/L.",
      options: [
        {
          text: "Cardiac tamponade",
          acceptable: true,
          feedback:
            "Tamponade must always be considered after PCI, and a bedside echo should exclude it. But the low JVP, flank pain and falling haemoglobin point to blood loss rather than tamponade.",
          next: "s3",
        },
        {
          text: "Acute stent thrombosis",
          feedback: "No chest pain and no new ST changes make stent thrombosis unlikely, and it would not explain the fall in haemoglobin.",
          next: "s3",
        },
        {
          text: "Retroperitoneal haemorrhage",
          best: true,
          feedback:
            "Correct. Hypotension and tachycardia after femoral access, flank or back pain, a falling haemoglobin and an unremarkable groin are the classic pattern. The bleeding is hidden behind the peritoneum, often from a puncture above the inguinal ligament.",
          next: "s3",
        },
        {
          text: "Vasovagal reaction",
          feedback: "Vasovagal reactions cause bradycardia and are short-lived. Tachycardia with a falling haemoglobin means bleeding.",
          next: "s3",
        },
        {
          text: "Anaphylactoid contrast reaction",
          feedback: "There is no rash, wheeze or angio-oedema, and a contrast reaction would not lower the haemoglobin.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "A bedside echo shows a hyperdynamic LV and no pericardial effusion. After 1 litre of crystalloid, BP is 94/58 mmHg and HR 104/min. What next?",
      options: [
        {
          text: "Repeat haemoglobin in six hours.",
          feedback: "Haemoglobin lags behind blood loss, and she is already shocked. Delay risks further deterioration.",
          next: "s1-delayed-review", stateDelta: {"stability": -15, "flags": ["bleed-delay"]} },
        {
          text: "Urgent CT of the abdomen and pelvis (including an arterial phase), with blood ready and interventional radiology and vascular surgery informed.",
          best: true,
          feedback:
            "Correct. CT confirms retroperitoneal haemorrhage, shows its extent and can identify active bleeding and its source, which guides endovascular or surgical treatment.",
          next: "s4",
        },
        {
          text: "Duplex ultrasound of the groin only.",
          acceptable: true,
          feedback:
            "Groin ultrasound will show a false aneurysm or haematoma at the puncture site but cannot assess the retroperitoneum. It does not answer the key question here.",
          next: "s4",
        },
        {
          text: "Repeat coronary angiography to check the RCA stent.",
          feedback: "The picture is of bleeding, not ischaemia. Angiography adds contrast, more anticoagulation and another arterial puncture.",
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      prompt: "CT shows a large right retroperitoneal haematoma with a small focus of active contrast extravasation at the external iliac artery, above the inguinal ligament. Haemoglobin is now 84 g/L. What do you do about her antithrombotic therapy?",
      options: [
        {
          text: "Make a joint decision with the interventional cardiologist, interventional radiology and haematology: confirm no residual heparin effect, interrupt antiplatelet therapy only as far as needed to control the bleeding, and plan to restart as soon as it is safe.",
          best: true,
          feedback:
            "Correct. The risk of stent thrombosis in a stent placed hours ago is high, so antiplatelet therapy is interrupted only as much and as briefly as necessary, ideally keeping aspirin. The balance is made by the senior team; management detail is in the complications track.",
          next: "s5",
        },
        {
          text: "Stop aspirin and ticagrelor permanently.",
          feedback: "Stopping all antiplatelet therapy for good after a fresh stent exposes her to stent thrombosis, which is often fatal.",
          next: "s5",
        },
        {
          text: "Continue everything unchanged; the bleeding will tamponade itself.",
          feedback:
            "Active extravasation in a shocked, anticoagulated patient will not reliably stop on its own. The source needs treatment and the antithrombotic plan needs reviewing.",
          next: "s5",
        },
        {
          text: "Give a platelet transfusion and protamine routinely.",
          feedback:
            "Protamine only helps if heparin effect persists, and platelet transfusion is less effective while ticagrelor is still circulating. Neither is a routine first step.",
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      prompt: "How should the bleeding source be treated?",
      options: [
        {
          text: "Firm manual compression over the groin crease for 30 minutes.",
          feedback:
            "The bleeding point is above the inguinal ligament, where there is no bone behind the artery to compress against. Compression at the crease will not reach it.",
          next: "s5-compression-fails", stateDelta: {"stability": -15} },
        {
          text: "Apply a mechanical femoral compression device and observe.",
          feedback: "As with manual compression, this cannot compress an artery above the inguinal ligament.",
          next: "s6",
        },
        {
          text: "Endovascular treatment by interventional radiology (covered stent or embolisation as appropriate), with transfusion continuing.",
          best: true,
          feedback:
            "Correct. An actively bleeding puncture above the inguinal ligament cannot be compressed against bone. Endovascular repair controls it without open surgery in a patient on antiplatelet therapy. Open repair is the alternative if endovascular treatment is not possible.",
          next: "s6",
        },
        {
          text: "Conservative management with transfusion alone.",
          acceptable: true,
          feedback:
            "Many retroperitoneal bleeds settle with resuscitation and transfusion, but active extravasation in a patient who remains unstable is an indication for intervention.",
          next: "s6",
        },
      ],
    },
    {
      id: "s6",
      prompt: "She recovers. At the morbidity and mortality meeting, what single change would most reduce the chance of this happening again?",
      options: [
        {
          text: "Use a larger femoral sheath for better guide support.",
          feedback: "Larger sheaths increase bleeding risk.",
        },
        {
          text: "Persist with radial access where possible (including the other radial or distal radial), and when femoral access is needed, use ultrasound and fluoroscopy to puncture the common femoral artery over the femoral head.",
          best: true,
          feedback:
            "Correct. Radial access reduces bleeding, and when the femoral route is needed, image-guided puncture below the inguinal ligament and over the femoral head makes retroperitoneal bleeding much less likely.",
        },
        {
          text: "Give more heparin to prevent stent thrombosis.",
          feedback: "Over-anticoagulation increases bleeding; the stent is protected by DAPT and appropriate procedural heparin.",
        },
        {
          text: "Routinely use a vascular closure device for every femoral case.",
          acceptable: true,
          feedback:
            "Closure devices allow earlier mobilisation, but they do not reliably prevent bleeding from a high puncture. Above the inguinal ligament the collagen plug should be avoided; Brilakis's algorithm prefers a suture device there, although elsewhere he advises avoiding any closure device after a high stick. Puncture site selection matters more.",
        },
      ],
    },
    {
      "id": "s1-delayed-review",
      "kind": "consequence",
      "info": "An hour later: BP 70/40 mmHg, HR 128/min, confused, haemoglobin 82 g/L (was 128 g/L before the procedure).",
      "prompt": "She has continued to bleed. What now?",
      "options": [
        {
          "text": "Major haemorrhage protocol, two large-bore cannulas, cross-matched blood, stop antithrombotics pending a decision, and urgent CT angiography with interventional radiology alerted",
          "best": true,
          "feedback": "Haemorrhagic shock needs simultaneous resuscitation and source identification.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Another fluid bolus and review in an hour",
          "feedback": "Repeating the strategy that has failed allows the bleed to continue.",
          "stateDelta": {
            "stability": -20
          }
        },
        {
          "text": "Start a noradrenaline infusion to keep MAP above 65 mmHg",
          "feedback": "Pressors without volume and source control mask a bleed.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s5-compression-fails",
      "kind": "consequence",
      "info": "After 30 minutes of groin compression, BP is 78/44 mmHg and the CT haematoma has enlarged on repeat imaging.",
      "prompt": "Why did compression fail, and what is the next step?",
      "options": [
        {
          "text": "The bleed is from the external iliac above the ligament, which cannot be compressed; arrange endovascular control now",
          "best": true,
          "feedback": "Above the inguinal ligament there is no bone to compress against; the source needs a covered stent or embolisation.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Compress harder for another 30 minutes",
          "feedback": "Pressure over the groin cannot reach an iliac bleed.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Apply a mechanical compression device",
          "feedback": "The same problem: the bleeding point is out of reach.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "Interventional radiology sealed the bleeding point with a covered stent. She received three units of red cells. Aspirin was continued throughout and ticagrelor was restarted after 24 hours once haemoglobin was stable. She was discharged on day five with no further bleeding and no stent thrombosis.",
  outcomeVariants: [
    {
      "flag": "bleed-delay",
      "text": "The delay in recognising haemorrhagic shock meant more transfusion and a longer intensive care stay."
    }
  ],
  learningPoints: [
    "Hypotension after PCI is a complication until proven otherwise: resuscitate, escalate and assess systematically.",
    "Hypotension with tachycardia, a low JVP, flank or back pain and a falling haemoglobin after femoral access suggests retroperitoneal haemorrhage, even with a normal-looking groin.",
    "Bedside echo excludes tamponade quickly; CT confirms retroperitoneal bleeding and its source.",
    "Antithrombotic interruption after a fresh stent is a senior, shared decision balancing bleeding against stent thrombosis.",
    "Radial access and image-guided femoral puncture over the femoral head are the best prevention.",
  ],
  refs: ["supplied-medmastery", "matrix-2015", "seattle-complications-2020", "brilakis-manual-pci"],
};

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------
export const pciCore: Track = {
  id: "pci-core",
  order: 4,
  title: "Core PCI",
  tagline: "Plan, access, engage, wire, prepare, stent, optimise, close",
  description:
    "From deciding who should have PCI to sending them home safely. The drugs, the equipment and the procedure itself, taught step by step: plan, access, engage, wire, prepare, stent, optimise and close, with the goal of each step, how to do it and what goes wrong.",
  stage: 3,
  modules: [mIndications, mPharmacology, mPlanning, mGuides, mWires, mBalloonsStents, mProcedure, mAfter],
  cases: [caseLadSupport, caseNstemiThrombus, caseWardHypotension],
};
