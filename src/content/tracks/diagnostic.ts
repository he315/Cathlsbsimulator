// ===========================================================================
// Track 1 — Diagnostic Angiography (id "diagnostic", prefix dx-).
// Built from the supplied EH views notes, the Oxford handbook summary, the
// Medmastery PCI handbook and the annotated angiography atlas, combined with
// ESC guidance and core texts. All wording and tables are original.
// ===========================================================================

import type { CaseStudy, Module, Track } from "../schema";

// ---------------------------------------------------------------------------
// Module 1 — Indications, preparation and consent
// ---------------------------------------------------------------------------
const mIndications: Module = {
  id: "dx-indications",
  title: "Indications, preparation and consent",
  stage: 2,
  summary:
    "Who needs a diagnostic coronary angiogram and when, what to check before the patient reaches the table, and how to consent and sedate proportionately.",
  objectives: [
    "List the main indications for invasive coronary angiography in acute and chronic coronary syndromes and in other settings, with ESC timing for ACS.",
    "Recognise relative contraindications and the patient factors that change timing, access or technique.",
    "Run a structured pre-procedure check covering renal function, antithrombotic drugs, allergy, diabetes and access planning.",
    "Obtain valid consent for diagnostic angiography with possible ad hoc PCI, and plan light sedation and local anaesthesia safely.",
  ],
  lessons: [
    {
      id: "dx-ind-indications",
      title: "Why and when to perform diagnostic angiography",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Invasive coronary angiography (ICA) opacifies the coronary lumen by injecting iodinated contrast selectively into each coronary ostium while recording X-ray cine. It answers three practical questions: is there obstructive epicardial disease, exactly where is it, and is it suitable for PCI, for surgery, or for neither. It is a picture of the lumen only. It says nothing directly about plaque within the wall or about the physiological effect of a narrowing; those need intracoronary imaging or a pressure wire, which appear later in this track.",
        },
        { kind: "h", text: "Acute coronary syndromes" },
        {
          kind: "p",
          text: "In ACS the question is rarely whether to perform angiography, but how soon. The 2023 ESC ACS guideline ties timing to risk.",
        },
        {
          kind: "table",
          caption: "Timing of invasive angiography in ACS (ESC 2023)",
          head: ["Presentation", "Timing", "Practical notes"],
          rows: [
            ["STEMI within the reperfusion window", "Immediate: primary PCI pathway", "Radial access by default. Do not wait for blood results."],
            [
              "NSTE-ACS with very-high-risk features: haemodynamic instability or cardiogenic shock, recurrent or refractory pain despite medical therapy, life-threatening arrhythmia, mechanical complication, acute heart failure clearly due to ischaemia, recurrent dynamic or intermittent ST elevation",
              "Immediate (within 2 hours)",
              "Behave exactly as for STEMI.",
            ],
            [
              "NSTE-ACS with high-risk features: confirmed NSTEMI, dynamic ST/T change, transient ST elevation, GRACE score above 140",
              "Early (within 24 hours) should be considered",
              "Plan the list so that the slot is actually used.",
            ],
            ["NSTE-ACS without high-risk features", "Selective, guided by clinical assessment and non-invasive testing", "Many will still need ICA; the point is to select."],
            ["Resuscitated cardiac arrest with ST elevation", "Immediate", "As for STEMI."],
            [
              "Resuscitated cardiac arrest without ST elevation, haemodynamically stable",
              "Not routinely immediate",
              "COACT and TOMAHAWK showed no survival gain from immediate over delayed or selective angiography. Go early for shock, ongoing ischaemia or a strong suspicion of acute occlusion.",
            ],
          ],
        },
        { kind: "h", text: "Chronic coronary syndromes" },
        {
          kind: "p",
          text: "For stable symptoms the 2024 ESC CCS guideline puts non-invasive testing first for most patients: CT coronary angiography when the clinical likelihood of disease is low to moderate, or functional imaging. Going straight to ICA is reasonable when the clinical likelihood is very high, symptoms are severe or refractory to medication, angina occurs at a low workload, or non-invasive tests show high-risk features or are inconclusive. When ICA is performed to make the diagnosis, have pressure-wire assessment available so that intermediate lesions are judged on physiology rather than on appearance.",
        },
        {
          kind: "p",
          text: "Be clear about what an invasive strategy achieves in stable disease. In ISCHEMIA, routine early invasive management of patients with moderate or severe ischaemia did not reduce death or myocardial infarction overall compared with initial medical therapy; patients with significant left main disease or severe LV dysfunction were excluded. The case for ICA in stable patients therefore rests on symptoms despite medical therapy, suspicion of prognostically important anatomy, or genuine diagnostic uncertainty.",
        },
        {
          kind: "list",
          items: [
            "Heart failure or LV systolic dysfunction of unexplained cause, when CT is unsuitable or inconclusive.",
            "Before valve surgery or TAVI, to define the coronary anatomy (CT can replace ICA in patients at low risk of coronary disease).",
            "Sustained ventricular arrhythmia or aborted sudden cardiac death.",
            "Suspected non-atherosclerotic coronary disease: spontaneous coronary artery dissection, vasospasm (with provocation testing in experienced centres), coronary embolism, or an anomaly first seen on another test.",
            "Work-up before some major non-cardiac procedures, such as transplant assessment, following local pathways.",
          ],
        },
        { kind: "h", text: "Contraindications" },
        {
          kind: "p",
          text: "Apart from refusal by a patient with capacity, there is no absolute contraindication. Almost every contraindication is relative and is really a question of timing: correct what can be corrected unless the indication is an emergency.",
        },
        {
          kind: "table",
          head: ["Relative contraindication", "Why it matters", "Usual response"],
          rows: [
            ["Acute kidney injury or advanced chronic kidney disease", "Contrast-associated kidney injury", "Defer elective cases until stable; hydrate, minimise contrast, consider an alternative test"],
            ["Decompensated heart failure or inability to lie flat", "Pulmonary oedema on the table; poor cooperation", "Treat first; if urgent, sit the patient up between runs and limit contrast"],
            ["Active bleeding or uncorrected coagulopathy", "Access-site bleeding; PCI would need anticoagulant and antiplatelet drugs", "Correct where possible; radial access"],
            ["Previous severe reaction to iodinated contrast", "Recurrence despite precautions", "Plan with the team: different agent, premedication per local protocol, anaesthetic support"],
            ["Uncontrolled hypertension, hypokalaemia, digoxin toxicity", "Bleeding and arrhythmia", "Correct first"],
            ["Fever or active infection", "Bacteraemia; infection of any implanted device", "Treat first unless an emergency"],
            ["Pregnancy", "Fetal radiation exposure", "Only if essential; minimise dose and shield"],
            ["Patient would not accept PCI or surgery", "The result will not change management", "Revisit the indication with the patient"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "ICA images the lumen; it does not measure plaque burden or physiological significance.",
            "In ACS, timing follows risk: immediate for STEMI and very-high-risk NSTE-ACS, early for high-risk NSTE-ACS.",
            "After cardiac arrest without ST elevation, immediate angiography is not routine in stable patients.",
            "In stable disease, non-invasive testing usually comes first; ICA is for refractory symptoms, high-risk findings or diagnostic uncertainty.",
            "Contraindications are almost all relative: fix what can be fixed before an elective study.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every elective case, ask what you will do with each possible answer. If no result would change management, the angiogram is not indicated.",
        },
      ],
      refs: ["esc-acs-2023", "esc-ccs-2024", "coact-2019", "tomahawk-2021", "ischemia-2020", "supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "dx-ind-prep",
      title: "Pre-procedure checks",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "A short, structured check before the patient reaches the table prevents most avoidable problems: the forgotten anticoagulant, the unrecognised kidney injury, the fistula arm used for access. Use the same order every time so that an omission stands out.",
        },
        {
          kind: "steps",
          title: "The pre-procedure check",
          items: [
            { title: "Question and plan", detail: "What question is the study answering? Review previous angiograms, CABG operation notes and the echo. Decide whether ad hoc PCI is plausible and whether the consent covers it." },
            { title: "Renal function", detail: "Check a recent eGFR (same day for in-patients and unstable patients; within the locally agreed window for elective day cases). Estimate the risk of contrast-associated kidney injury and set a contrast budget." },
            { title: "Antithrombotic drugs", detail: "Record every anticoagulant and antiplatelet drug and the time of the last dose. Check the INR in patients on warfarin." },
            { title: "Allergy", detail: "Ask specifically about iodinated contrast, local anaesthetic, latex and heparin (including heparin-induced thrombocytopenia), and grade any previous reaction." },
            { title: "Diabetes", detail: "Plan metformin and insulin around fasting and contrast." },
            { title: "Access", detail: "Feel both radial pulses and both femoral pulses. Note dialysis fistulae, previous difficult access, CABG conduits (especially the LIMA), peripheral arterial disease and aortic aneurysm." },
            { title: "Baseline tests", detail: "Full blood count (haemoglobin and platelets), electrolytes including potassium, and a 12-lead ECG. Site the intravenous cannula away from the intended access arm." },
          ],
        },
        { kind: "h", text: "Kidney function and contrast" },
        {
          kind: "p",
          text: "Contrast-associated acute kidney injury is a rise in creatinine in the days after contrast, usually peaking at 48–72 hours. Risk is driven mainly by baseline renal function and is increased by diabetes, heart failure, hypotension, older age, anaemia, mechanical circulatory support and contrast volume: the variables of the Mehran score. Score high-risk patients formally so the figure can be discussed during consent.",
        },
        {
          kind: "list",
          items: [
            "Stop avoidable nephrotoxins such as NSAIDs. Some units also withhold diuretics or renin–angiotensin blockers on the day, according to local protocol.",
            "Give isotonic intravenous fluid to at-risk patients per local protocol, with care in heart failure.",
            "Use a low- or iso-osmolar agent and count every millilitre. Omit the ventriculogram when a recent echo already answers the question.",
            "Some operators set a contrast budget from the eGFR (for example a total volume in mL not exceeding a small multiple of the eGFR). Treat it as a guide; no threshold is risk-free.",
            "Stage complex work rather than adding PCI to a long diagnostic study in a patient with poor renal function.",
            "Recheck creatinine at 48–72 hours in high-risk patients.",
          ],
        },
        { kind: "h", text: "Antithrombotic drugs" },
        {
          kind: "table",
          caption: "Common approach for elective diagnostic angiography; always check local policy",
          head: ["Drug", "Usual approach"],
          rows: [
            ["Aspirin", "Continue."],
            ["P2Y12 inhibitor", "Continue if already indicated (recent ACS or stent). Routine loading before the anatomy is known is generally not recommended in stable patients; acute patients follow the ACS pathway."],
            ["Warfarin", "Many centres perform radial angiography on uninterrupted warfarin with the INR in range, avoiding supratherapeutic values. Femoral access usually needs warfarin stopped and a lower INR; the threshold is local."],
            ["Direct oral anticoagulant", "Usually omitted for 24–48 hours depending on the drug and renal function; some centres continue it for radial cases."],
            ["Unfractionated heparin infusion", "Often continued for radial ACS cases; paused around a femoral puncture."],
            ["Low-molecular-weight heparin", "Record the time of the last dose: it affects femoral haemostasis and the anticoagulant choice if PCI follows (avoid switching between agents)."],
          ],
        },
        { kind: "h", text: "Contrast allergy and metformin" },
        {
          kind: "p",
          text: "Grade any previous contrast reaction: mild (urticaria, itch), moderate, or severe (bronchospasm, hypotension, laryngeal oedema). Allergy to shellfish or to topical iodine does not predict a contrast reaction and is not a reason to change the plan. After a previous moderate or severe reaction, many units give corticosteroid and antihistamine premedication. It reduces but does not abolish recurrence, so the more important steps are a different contrast agent, a team briefed and equipped to treat anaphylaxis, and clear documentation.",
        },
        {
          kind: "p",
          text: "Metformin can be continued when renal function is normal. When the eGFR is reduced or kidney injury is likely, it is commonly withheld after contrast for 48 hours and restarted once renal function is confirmed stable. Follow your local protocol.",
        },
        { kind: "h", text: "Access planning" },
        {
          kind: "table",
          head: ["Situation", "Usual choice"],
          rows: [
            ["Default", "Radial (right radial in most UK labs)"],
            ["Previous CABG with a LIMA graft", "Left radial or femoral, so that the LIMA is easy to engage"],
            ["Elderly, short or hypertensive patient, or known right subclavian tortuosity", "Consider left radial"],
            ["Existing arteriovenous fistula", "Never the fistula arm"],
            ["Advanced CKD with a possible future fistula", "Discuss with the renal team; many ask for the forearm arteries to be preserved"],
            ["Large-bore equipment or mechanical support likely", "Femoral, ultrasound-guided"],
            ["Absent or weak radial pulse, known radial occlusion", "Contralateral radial, distal radial or femoral"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting an elective case without a recent eGFR.",
            "Discovering on the table that a DOAC was taken this morning before a planned femoral case.",
            "Treating 'iodine allergy' as a contraindication while missing a genuine previous reaction to contrast.",
            "Using the radial artery in an arm with a fistula, or one the renal team wants preserved.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "mehran-cin-2004", "esc-ccs-2024", "esc-acs-2023", "matrix-2015", "hanna-pcm"],
    },
    {
      id: "dx-ind-consent",
      title: "Consent, the team brief and sedation",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Consent is a process, not a signature. In the UK the Montgomery judgment sets the standard: tell the patient about any material risk (one that a reasonable person in their position would want to know, or one you know matters to this particular patient) and discuss reasonable alternatives, including doing nothing. The patient needs capacity, enough time, information in writing as well as in conversation, and the freedom to change their mind at any point. For elective cases, do not take consent for the first time on the table.",
        },
        { kind: "h", text: "What to cover" },
        {
          kind: "table",
          caption: "Use your unit's own figures; these descriptions are typical",
          head: ["Topic", "How to explain it"],
          rows: [
            ["Bruising or haematoma", "Common, usually minor."],
            ["Radial artery occlusion", "Uncommon and usually silent, because the hand has a second supply from the ulnar artery."],
            ["Bleeding or arterial damage needing treatment", "Uncommon; more likely with femoral access."],
            ["Contrast reaction", "Usually mild (rash, itch); severe reactions are rare."],
            ["Kidney injury from contrast", "Depends mainly on baseline kidney function; give an individual estimate."],
            ["Stroke, heart attack, emergency surgery or death", "Rare in stable elective patients (a combined figure in the order of 1 in 1000 is commonly quoted); higher in ACS, shock, advanced age, left main disease and severe LV dysfunction."],
            ["Arrhythmia", "Usually brief; ventricular fibrillation is rare and treated at once."],
            ["Radiation", "Low for a diagnostic study; it adds up if PCI follows."],
          ],
        },
        {
          kind: "p",
          text: "If PCI might follow in the same sitting, discuss and consent for it beforehand: the extra risks, the need for dual antiplatelet therapy, and the alternatives of medical therapy or bypass surgery. Agree in advance what will not be done ad hoc. Left main disease, multivessel disease (especially with diabetes or reduced LV function) and anatomy that might suit surgery are normally stopped after the diagnostic study and taken to the heart team.",
        },
        {
          kind: "p",
          text: "In STEMI there is no time for a full discussion, and the patient may be in pain or have had opiates. A brief explanation of the reason and the main risk, with verbal agreement, is usual and appropriate.",
        },
        {
          kind: "pearl",
          text: "If the patient voices doubt at any stage, defer, discuss and document. A lost list slot costs far less than a procedure the patient did not want.",
        },
        { kind: "h", text: "Team brief and time-out" },
        {
          kind: "steps",
          items: [
            { title: "Identity and procedure", detail: "Confirm the patient, the planned procedure and access side, and that consent covers everything you might do." },
            { title: "Safety facts", detail: "Allergies, eGFR, anticoagulant status and timing, diabetes, and pregnancy status where relevant." },
            { title: "Plan", detail: "Access, sheath size, first catheters, expected views, and whether PCI equipment or a pressure wire may be needed." },
            { title: "Concerns", detail: "Invite every team member to speak up; agree who calls out pressure changes and arrhythmias." },
          ],
        },
        { kind: "h", text: "Sedation and local anaesthesia" },
        {
          kind: "p",
          text: "Most diagnostic studies need only local anaesthetic. Light anxiolysis or analgesia with small intravenous doses (commonly a short-acting benzodiazepine and/or an opioid, per local protocol) suits anxious patients and may reduce radial spasm. Keep it light: the patient must hold a deep breath on command, report chest pain or neurological symptoms, and protect their own airway. Deeper sedation needs appropriate monitoring and skills and is poorly tolerated in severe lung disease, obstructive sleep apnoea, hypotension or critical coronary anatomy. Have reversal agents to hand.",
        },
        {
          kind: "p",
          text: "For radial access raise only a small subcutaneous bleb; a large volume hides the pulse. For femoral access infiltrate more generously along the track, aspirating before each injection, and stay within the maximum recommended dose of the agent.",
        },
        {
          kind: "pitfalls",
          items: [
            "Quoting numbers you cannot justify; use your department's consent-form figures.",
            "Not mentioning that PCI might follow, then facing an unplanned decision on the table.",
            "Oversedating, so breath-holds are poor and the images suffer.",
            "Forgetting pregnancy status in women of child-bearing potential.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "esc-revasc-2018", "radiation-consensus-2018", "hanna-pcm", "montgomery-2015"],
    },
  ],
  quiz: [
    {
      id: "dx-q-ind-nste-very-high",
      stem: "A 66-year-old man with NSTEMI has recurrent chest pain despite intravenous nitrate, and the ECG shows transient ST elevation in V2–V4 during pain. Under the 2023 ESC ACS guideline, when should he have coronary angiography?",
      options: ["Immediately, within 2 hours", "Within 24 hours", "Within 72 hours", "After a stress test to confirm ischaemia", "Only if the troponin keeps rising"],
      answer: 0,
      explanation:
        "Refractory or recurrent pain despite medical therapy and recurrent or intermittent ST elevation are very-high-risk features, which call for an immediate invasive strategy (within 2 hours), as for STEMI. 'Within 24 hours' is the early strategy for high-risk NSTE-ACS without very-high-risk features; choosing it here leaves ongoing ischaemia untreated for hours.",
      difficulty: 2,
      refs: ["esc-acs-2023"],
    },
    {
      id: "dx-q-ind-ohca",
      stem: "A 58-year-old is resuscitated from out-of-hospital VF arrest. After return of circulation he is haemodynamically stable, the ECG shows no ST elevation and there is no ongoing evidence of ischaemia. Which statement best reflects current evidence?",
      options: [
        "Immediate angiography is mandatory because VF is presumed coronary",
        "Randomised trials have not shown a survival benefit from immediate over delayed or selective angiography in this group",
        "Angiography is contraindicated within 72 hours of an arrest",
        "CT coronary angiography should replace invasive angiography in all such patients",
        "Angiography is indicated only if the troponin is raised",
      ],
      answer: 1,
      explanation:
        "COACT and TOMAHAWK randomised resuscitated patients without ST elevation and found no survival advantage from immediate angiography, so a delayed or selective approach is reasonable in stable patients, with early angiography for shock, ongoing ischaemia or strong suspicion of acute occlusion. 'Mandatory immediate angiography' is exactly what the trials tested and failed to support. Troponin is almost always raised after an arrest and does not discriminate.",
      difficulty: 2,
      refs: ["coact-2019", "tomahawk-2021", "esc-acs-2023"],
    },
    {
      id: "dx-q-ind-shellfish",
      stem: "Before elective angiography a patient says she is 'allergic to iodine' because shellfish gave her hives. She has had a contrast CT before without problems. What is the best plan?",
      options: [
        "Proceed as usual: shellfish allergy does not predict a contrast reaction",
        "Cancel and arrange CT coronary angiography, which avoids catheter contrast",
        "Give corticosteroid premedication for 12 hours beforehand, then proceed",
        "Use gadolinium instead of iodinated contrast for the coronary injections",
        "Proceed but cap the total contrast at 30 mL to limit the iodine exposure",
      ],
      answer: 0,
      explanation:
        "Seafood or topical iodine sensitivity does not predict a reaction to iodinated contrast, and she has tolerated contrast before. Steroid premedication is used by many units after a previous moderate or severe reaction to contrast itself, not for shellfish allergy; here it adds delay and side effects without benefit. CT also uses iodinated contrast, and gadolinium is not a substitute for coronary angiography.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-ind-lima-access",
      stem: "A 72-year-old with previous CABG (LIMA to LAD, vein grafts to an obtuse marginal and the RCA) needs angiography for recurrent angina. Which access is usually most practical?",
      options: ["Right radial", "Left radial", "Right brachial cut-down", "Left ulnar", "Distal right radial"],
      answer: 1,
      explanation:
        "From the left radial artery the catheter enters the left subclavian directly, so the LIMA is easy to engage, and the vein grafts can be reached from the same route. Femoral access is the other common choice. Right radial access can image a LIMA, but crossing into the left subclavian is technically demanding and adds time, contrast and radiation.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "dx-q-ind-adhoc",
      stem: "A stable patient with diabetes and an ejection fraction of 40% is consented for 'angiography and possible PCI'. The study shows a severe distal left main bifurcation lesion and severe proximal LAD and RCA disease. What should you do?",
      options: [
        "Proceed to ad hoc left main PCI because consent is in place",
        "Stent the RCA now and stage the left main",
        "Stop after the diagnostic study and refer to the heart team",
        "Measure FFR in all three territories before deciding",
        "Perform IABP-supported PCI today",
      ],
      answer: 2,
      explanation:
        "Left main and multivessel disease in a diabetic patient with reduced LV function is the classic setting for heart team discussion, because CABG may be the better option. Consent for 'possible PCI' does not oblige you to do it. Stenting the RCA first commits the patient to a strategy before that discussion has happened.",
      difficulty: 2,
      refs: ["esc-revasc-2018", "supplied-medmastery"],
    },
    {
      id: "dx-q-ind-mehran",
      stem: "Which of the following is not a variable in the Mehran risk score for contrast-induced nephropathy?",
      options: ["Hypotension", "Use of an intra-aortic balloon pump", "Anaemia", "Current smoking", "Contrast volume"],
      answer: 3,
      explanation:
        "The Mehran score uses hypotension, IABP, heart failure, age over 75, anaemia, diabetes, contrast volume and baseline renal function. Smoking is a cardiovascular risk factor but is not in the score. Contrast volume may look like an odd inclusion, but it is the one variable the operator directly controls.",
      difficulty: 2,
      refs: ["mehran-cin-2004"],
    },
    {
      id: "dx-q-ind-sedation",
      stem: "Why is sedation for diagnostic angiography normally kept light?",
      options: [
        "Benzodiazepines interact with iodinated contrast and raise the reaction risk",
        "The patient must hold a deep breath on command and report symptoms",
        "Sedation increases radial artery spasm by lowering sympathetic tone",
        "Opioids provoke coronary vasospasm and can mimic fixed disease",
        "Local anaesthetic does not work reliably in a heavily sedated patient",
      ],
      answer: 1,
      explanation:
        "Good images depend on a held deep breath, and early warning of ischaemia, contrast reactions and neurological events depends on a patient who can talk. Light anxiolysis and analgesia are appropriate and probably reduce radial spasm, which is why the option claiming that sedation increases spasm is wrong.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 — Vascular access
// ---------------------------------------------------------------------------
const mAccess: Module = {
  id: "dx-access",
  title: "Vascular access: radial and femoral",
  stage: 2,
  summary:
    "Radial-first access with spasm prevention and a troubleshooting plan for the forearm, subclavian and arch, plus a safe femoral puncture using fluoroscopy and ultrasound.",
  objectives: [
    "Describe the radial and femoral access anatomy and choose an access site that suits the patient.",
    "Perform radial puncture and sheath insertion, prevent spasm and radial occlusion, and rescue spasm when it occurs.",
    "Troubleshoot forearm loops, subclavian tortuosity and arteria lusoria, and recognise when to change access.",
    "Puncture the common femoral artery over the femoral head, and explain the consequences of high and low punctures.",
  ],
  lessons: [
    {
      id: "dx-acc-radial",
      title: "Radial access: anatomy and technique",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Radial access is the default in UK and ESC practice. In MATRIX, among patients with ACS, radial access reduced major bleeding and net adverse clinical events compared with femoral access, with lower all-cause mortality. Patients sit up straight away, go home sooner and rarely bleed seriously from the wrist. The trade-offs are a smaller artery, spasm, anatomical variants that must be negotiated, more awkward engagement from the right side, and no route for large-bore mechanical support.",
        },
        { kind: "h", text: "Anatomy you need" },
        {
          kind: "list",
          items: [
            "The radial artery is the lateral terminal branch of the brachial artery. It runs down the lateral forearm under brachioradialis and becomes superficial at the wrist, lateral to the flexor carpi radialis tendon and lying on the distal radius. That bony backing is what makes compression so easy.",
            "Beyond the wrist it passes dorsally through the anatomical snuffbox (the distal radial access site) to form the deep palmar arch. The ulnar artery forms the superficial arch. The two arches give the hand a dual supply, which is why radial occlusion is usually silent.",
            "Common variants: a high origin of the radial from the upper brachial or axillary artery (small and spasm-prone); a radioulnar loop just below the elbow; tortuous or hypoplastic segments.",
            "From the right radial the route runs brachial, axillary, right subclavian, brachiocephalic trunk, then the ascending aorta. From the left radial it runs through the left subclavian straight into the arch, a geometry closer to the femoral route.",
          ],
        },
        {
          kind: "steps",
          title: "Radial puncture and sheath",
          items: [
            { title: "Position", detail: "Arm abducted on a board, wrist gently extended over a roll. Palpate the pulse along 2–3 cm. Use ultrasound when the pulse is weak; it improves first-pass success." },
            { title: "Anaesthetic", detail: "A small subcutaneous bleb only; a large volume hides the pulse." },
            { title: "Site and angle", detail: "Puncture just proximal to the flexor retinaculum, where the artery is straight and lies over bone, with the needle at roughly 30–45 degrees. Too steep an angle makes the wire catch the back wall or lift the intima." },
            { title: "Needle technique", detail: "Either a single anterior-wall puncture with an open needle, or a through-and-through puncture with a cannula that is withdrawn until it bleeds back. Both are acceptable." },
            { title: "Wire", detail: "Advance the short access wire only if it runs freely. If it stops just beyond the needle, withdraw the needle slightly, alter the angle or rotate the bevel, and try again. If it advances and then stops further up, rotate it: it is often in a side branch. Never force it." },
            { title: "Sheath", detail: "Use the smallest hydrophilic sheath that will do the job, with a small skin nick. Long sheaths can reduce spasm in difficult arms." },
            { title: "Cocktail", detail: "Through the side arm give a vasodilator (commonly verapamil, about 2.5–5 mg, and/or a nitrate) and unfractionated heparin (commonly 5000 units or about 50–70 units/kg) to prevent radial occlusion. Diluting the drugs in the patient's own aspirated blood reduces burning. Typical doses only: follow local protocol. Do not give nitroglycerin to a patient who is hypotensive, has right ventricular infarction or HOCM, or has recently taken a PDE-5 inhibitor, and remember that radial verapamil can itself lower the blood pressure." },
            { title: "Secure", detail: "Fix the sheath with a dressing that includes the side arm, so it cannot be pulled out." },
          ],
        },
        {
          kind: "p",
          text: "Many operators no longer perform routine Allen or Barbeau testing, because hand ischaemia after transradial access is very rare; follow local policy. A sheath angiogram is not routine (contrast stings in the forearm), but take one whenever the wire or catheter meets resistance.",
        },
        { kind: "h", text: "Spasm: prevention and rescue" },
        {
          kind: "table",
          head: ["", "Details"],
          rows: [
            ["Risk factors", "Small artery, women, smokers, anxiety and pain, multiple puncture attempts, repeated catheter exchanges, larger catheters, excessive manipulation"],
            ["Prevention", "Calm, comfortable patient (anxiolysis and analgesia), vasodilator cocktail, hydrophilic sheath, long sheath in difficult arms, minimal exchanges (a universal catheter can image both coronaries), the smallest adequate catheter"],
            ["Rescue", "Stop pulling. Give more vasodilator through the sheath, more analgesia or sedation, and wait. Warming the arm can help. Switch to hydrophilic or smaller equipment"],
            ["Entrapped catheter", "Never pull against resistance: forced removal can avulse or evert the artery. Deep sedation or a regional block may be needed before withdrawal"],
            ["Balloon-assisted tracking", "Inflate a small coronary balloon half out of the catheter tip on a coronary wire, then advance catheter and balloon together; the smooth leading edge glides through spasm or tortuosity"],
          ],
        },
        { kind: "h", text: "Distal radial access" },
        {
          kind: "p",
          text: "Puncture in or just beyond the anatomical snuffbox, where the artery lies over the scaphoid and trapezium. Proposed advantages include shorter haemostasis, comfort, preservation of the forearm radial artery for future use, and easier left-sided working because the hand can rest over the groin. The vessel is smaller and the learning curve steeper, with more failed punctures early on.",
        },
        { kind: "h", text: "Ending the case: patent haemostasis" },
        {
          kind: "p",
          text: "Remove the sheath immediately, even after heparin, and apply a compression band. Inflate it until bleeding stops, then let air out until a pulse or oximetry trace returns distal to the band while the site stays dry. This keeps some antegrade flow (patent haemostasis), which reduces radial occlusion. Release gradually over a couple of hours and check the site again before discharge. For the left wrist, most single-cushion bands must be applied the other way up.",
        },
        {
          kind: "keypoints",
          items: [
            "Radial first: less bleeding and, in ACS, lower mortality than femoral access (MATRIX).",
            "Never force a wire; vasodilator plus heparin through the sheath; patent haemostasis at the end.",
            "Spasm is prevented by comfort, drugs and fewer exchanges, and treated by patience, not force.",
          ],
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Perform a right radial puncture, give the spasmolytic cocktail through the sheath, and advance the J-wire to the ascending aorta under fluoroscopy without forcing it.",
        },
      ],
      refs: ["supplied-medmastery", "matrix-2015", "esc-acs-2023", "hanna-pcm", "brilakis-manual-pci"],
    },
    {
      id: "dx-acc-radial-trouble",
      title: "Troubleshooting the radial route",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Radial failures come from four places: the puncture, the forearm, the subclavian and brachiocephalic junction, and the arch. Decide where the problem lies before choosing a fix. The single rule that covers all of them: if the wire or catheter does not move easily, it is in the wrong place or the anatomy needs a different tool.",
        },
        {
          kind: "table",
          caption: "Radial troubleshooting by level",
          head: ["Problem", "Clues", "First move", "If that fails"],
          rows: [
            ["Wire will not leave the needle", "Resistance within a few centimetres", "Withdraw the needle slightly, change angle or bevel", "Re-puncture more proximally; ultrasound"],
            ["Wire stops in the forearm", "Resistance or pain", "Sheath angiogram (after vasodilator, dilute contrast)", "Choose the strategy for the anatomy shown"],
            ["Radial or radioulnar loop", "Angiogram shows a loop, often near the elbow", "Cross with a 0.014-inch coronary wire into the brachial, then advance the catheter over it to straighten the loop gently", "Balloon-assisted tracking; change access if the loop is tight or painful"],
            ["High bifurcation or small radial", "Small calibre, early spasm", "Hydrophilic wire, smaller catheter, more vasodilator", "Contralateral radial or femoral"],
            ["Brachial or axillary tortuosity", "Wire buckles", "Hydrophilic J-wire steered under fluoroscopy", "Stiffer wire; long sheath"],
            ["Wire into the carotid or vertebral", "Wire heads up into the neck", "Withdraw at once and redirect under fluoroscopy", "Use the catheter tip to point the wire caudally"],
            ["Wire goes down the descending aorta", "Wire runs below the arch instead of into the ascending aorta", "Change to LAO, pull the wire back into the catheter and use the catheter tip to aim the wire at the ascending aorta; deep inspiration", "Hydrophilic wire; consider arteria lusoria"],
            ["Catheter will not torque or seat", "Loops in the subclavian absorb torque", "Deep breath; keep a wire inside the catheter while rotating", "Long exchange wire; move to left radial or femoral"],
          ],
        },
        { kind: "h", text: "Subclavian tortuosity and the deep-breath manoeuvre" },
        {
          kind: "p",
          text: "In older, shorter or hypertensive patients the right subclavian artery and brachiocephalic trunk are often elongated and looped. Ask the patient to take a deep breath and hold it. As the diaphragm descends, the mediastinum lengthens and the great vessels are pulled downwards, straightening the curve; the wire often slips into the ascending aorta at that moment. Combine the breath with an LAO projection, which opens out the arch. Once you have position, protect it: when exchanging catheters, use an exchange-length 0.035-inch wire so that you do not have to renegotiate the same segment.",
        },
        { kind: "h", text: "Arteria lusoria" },
        {
          kind: "p",
          text: "An aberrant right subclavian artery arises as the last branch of the arch, distal to the left subclavian, and passes behind the oesophagus to reach the right arm. It is uncommon (around 1% or less). From the right radial the wire repeatedly falls into the descending aorta however you steer it, and the catheter, when it does reach the ascending aorta, sits at an angle that makes engagement unstable. Suspect it early, confirm with a small injection if needed, and move to the left radial or the femoral artery rather than persisting.",
        },
        { kind: "h", text: "Left or right radial?" },
        {
          kind: "table",
          head: ["Feature", "Right radial", "Left radial"],
          rows: [
            ["Ergonomics", "Fits the standard lab set-up; comfortable for the operator", "Operator leans across, or the arm is brought over the patient on a board; hard in central obesity"],
            ["Route to the aorta", "Through the brachiocephalic trunk; tortuosity common in the elderly", "Through the left subclavian; geometry similar to femoral"],
            ["Left Judkins size", "Usually a half size smaller (JL3.5)", "Standard (JL4)"],
            ["LIMA graft", "Possible but technically demanding", "Straightforward"],
            ["Time and dose", "Shortest set-up in most labs", "Set-up may add time and radiation"],
          ],
        },
        { kind: "h", text: "When to bail out, and late bleeding" },
        {
          kind: "p",
          text: "Set yourself a limit, in time or attempts, for each obstacle. Crossing early to the other radial or to the femoral artery is good judgement, not failure: repeated attempts provoke spasm, consume contrast and radiation, and risk perforation. A forearm perforation or dissection can be sealed by the catheter during the case and bleed only when the catheter comes out, when the patient is anticoagulated. Inspect the forearm at the end; if a haematoma is expanding, apply firm pressure, inflate a manual blood-pressure cuff proximally above systolic pressure for a short period to stop inflow, elevate the arm, and watch for compartment syndrome (pain out of proportion, tense swelling, skin change).",
        },
        {
          kind: "pearl",
          text: "If the wire from the right radial keeps choosing the descending aorta despite LAO steering and a deep breath, stop calling it tortuosity and think arteria lusoria.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing through resistance in the forearm instead of taking a sheath angiogram.",
            "Torquing a catheter hard with no wire inside it, which kinks it.",
            "Exchanging catheters without a long wire after a difficult subclavian passage, then losing access.",
            "Removing the sheath and leaving the room without inspecting the forearm.",
          ],
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "From the right radial, steer the wire from the subclavian into the ascending aorta: switch to LAO, use the catheter tip to aim the wire, and time the advance with a held deep breath.",
        },
      ],
      refs: ["supplied-medmastery", "supplied-oxford", "hanna-pcm", "brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "dx-acc-femoral",
      title: "Femoral access",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Femoral access remains essential: for large-bore equipment and mechanical support (IABP, Impella), after radial failure, for some graft studies, and in small patients with tiny radial arteries. The artery does not spasm and accepts large sheaths. Its weaknesses are more bleeding than radial access, a depth that varies with body habitus, atheroma and calcification, and a narrow safe target.",
        },
        { kind: "h", text: "Anatomy" },
        {
          kind: "list",
          items: [
            "The femoral triangle is bounded by the inguinal ligament above, sartorius laterally and adductor longus medially.",
            "The external iliac artery becomes the common femoral artery (CFA) as it passes under the inguinal ligament, just after giving off the inferior epigastric artery. The CFA divides into the superficial femoral and profunda femoris arteries.",
            "From lateral to medial: femoral nerve, artery, vein.",
            "Target: the CFA where it crosses the femoral head, below the inferior epigastric artery and above the bifurcation, so that the puncture can be compressed against bone or closed with a device.",
          ],
        },
        {
          kind: "table",
          caption: "Landmarks for femoral puncture",
          head: ["Landmark", "Reliability", "How to use it"],
          rows: [
            ["Skin crease", "Poor: often lies below the bifurcation, especially in obesity", "Do not use on its own"],
            ["Point of maximal pulse", "Moderate", "Usually over the femoral head"],
            ["Fluoroscopic femoral head", "Good", "Place a metal marker on the skin and aim for an arterial entry over the middle of the femoral head"],
            ["Ultrasound", "Best", "Shows the CFA, the bifurcation, the vein and anterior-wall plaque; reduces attempts and venous puncture"],
          ],
        },
        {
          kind: "steps",
          title: "Femoral puncture",
          items: [
            { title: "Mark", detail: "Screen the femoral head and mark the target. Check the other groin too; disease can be one-sided." },
            { title: "Anaesthetise", detail: "Infiltrate the skin and the track down to the artery." },
            { title: "Puncture", detail: "Under ultrasound, enter the anterior wall at about 45 degrees, away from calcium, ideally with a micropuncture (21G) needle in difficult groins." },
            { title: "Wire", detail: "Advance the J-wire under fluoroscopy. It should run up the iliac towards the aorta; if it deviates or meets resistance, stop and reassess." },
            { title: "Sheath and angiogram", detail: "Insert the sheath and take a femoral angiogram in an ipsilateral oblique view to show the puncture relative to the bifurcation and the inferior epigastric artery. This decides whether a closure device is appropriate." },
          ],
        },
        {
          kind: "table",
          caption: "Why the puncture height matters",
          head: ["Puncture", "Main risk", "Reason"],
          rows: [
            ["High: above the inguinal ligament or inferior epigastric", "Retroperitoneal haemorrhage", "No bony backing; bleeding tracks silently into the retroperitoneum"],
            ["Low: superficial femoral or profunda", "Pseudoaneurysm, arteriovenous fistula, haematoma, vessel occlusion with large sheaths", "Smaller artery, poor compressibility, vein lying behind or over the artery"],
            ["Back-wall or multiple punctures", "Haematoma, retroperitoneal bleed", "Extra holes that cannot all be compressed"],
          ],
        },
        { kind: "h", text: "Haemostasis" },
        {
          kind: "p",
          text: "After a diagnostic study without heparin the sheath can usually come out straight away, with firm manual pressure applied just above the skin puncture, over the arterial hole, until haemostasis (Brilakis: about 2–3 minutes per French size, so 12–18 minutes for 6 Fr; Oxford: about 8–10 minutes). After heparin, wait for the ACT to fall below the local threshold (180 seconds in Brilakis's manual; 150–200 seconds, or 3–4 hours, in the Oxford handbook; 175 seconds in the Medmastery handbook) or use a closure device. Collagen-plug and suture-based devices need a suitable CFA puncture on the sheath angiogram and specific training; follow each device's instructions for use.",
        },
        { kind: "h", text: "Complications to recognise early" },
        {
          kind: "list",
          items: [
            "Retroperitoneal haemorrhage: hypotension or a falling haemoglobin without visible bleeding, often with back, flank or lower abdominal pain. Resuscitate, request urgent CT, reverse anticoagulation where appropriate and involve interventional radiology or vascular surgery.",
            "Pseudoaneurysm: pulsatile swelling with a bruit. Confirm with ultrasound; options include ultrasound-guided compression, thrombin injection when the neck is narrow, or surgery.",
            "Haematoma: compression, analgesia and observation; scan if large or tender to exclude a pseudoaneurysm.",
            "Limb ischaemia, arteriovenous fistula and infection are less common.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Puncturing at the skin crease in an obese patient and entering the superficial femoral artery.",
            "Ignoring a wire that does not run straight up the iliac artery.",
            "Deploying a closure device without checking the sheath angiogram.",
            "Attributing post-procedure hypotension to sedation before excluding a retroperitoneal bleed.",
          ],
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Mark the femoral head under fluoroscopy, puncture the common femoral artery over its middle third, then confirm the puncture site on a sheath angiogram before advancing the J-wire.",
        },
      ],
      refs: ["supplied-medmastery", "matrix-2015", "esc-acs-2023", "hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "dx-q-acc-lusoria",
      stem: "From the right radial artery the J-wire passes into the descending aorta on every attempt, despite steering in LAO and asking the patient to take deep breaths. What is the most likely explanation and the best response?",
      options: [
        "Severe brachiocephalic tortuosity; use a stiffer wire and push harder",
        "Aberrant right subclavian artery (arteria lusoria); move to left radial or femoral access",
        "Radioulnar loop; cross it with a coronary wire",
        "Wire in the right vertebral artery; withdraw and redirect",
        "Aortic dissection; abandon the procedure",
      ],
      answer: 1,
      explanation:
        "An aberrant right subclavian arises distal to the left subclavian, so wires from the right arm fall naturally into the descending aorta and engagement from that route is unstable. The efficient response is to change access. Plain tortuosity usually yields to an LAO view, catheter steering and a deep breath; forcing a stiffer wire risks dissection.",
      difficulty: 2,
      refs: ["supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "dx-q-acc-deep-breath",
      stem: "Why does a held deep inspiration help a wire pass from a tortuous right subclavian artery into the ascending aorta?",
      options: [
        "It raises aortic pressure and so opens up the tortuous vessel ahead of the wire",
        "The diaphragm descends and pulls the great vessels down, straightening the curve",
        "It slows the heart rate so that the wire tip is more stable as it advances",
        "It dilates the subclavian artery through a reflex burst of sympathetic stimulation",
        "It rotates the heart into a more horizontal position that lines up the arch",
      ],
      answer: 1,
      explanation:
        "On deep inspiration the diaphragm descends and the mediastinal structures are drawn downwards, which straightens the subclavian and brachiocephalic loops. It is a mechanical effect. The other options describe effects that do not occur or would not help the wire.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "dx-q-acc-high-puncture",
      stem: "The femoral sheath angiogram shows the arteriotomy above the origin of the inferior epigastric artery. Which complication is this puncture most likely to cause?",
      options: ["Arteriovenous fistula", "Retroperitoneal haemorrhage", "Superficial femoral artery occlusion", "Femoral nerve palsy", "Lymphocoele"],
      answer: 1,
      explanation:
        "A puncture above the inferior epigastric (above the inguinal ligament) has no bony backing and bleeds into the retroperitoneum, where blood loss can be large and concealed. Arteriovenous fistula and pseudoaneurysm are the typical risks of a low puncture, below the femoral bifurcation.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "dx-q-acc-landmark",
      stem: "Which landmark is least reliable for locating the common femoral artery puncture site?",
      options: ["Fluoroscopic position of the femoral head", "Ultrasound of the femoral bifurcation", "The inguinal skin crease", "The point of maximal pulsation", "A femoral sheath angiogram"],
      answer: 2,
      explanation:
        "The skin crease often lies below the femoral bifurcation, particularly in obese patients, so a crease-guided puncture frequently enters the superficial femoral artery. The femoral head on fluoroscopy and ultrasound are the most reliable guides; the sheath angiogram confirms the result afterwards.",
      difficulty: 1,
      refs: ["supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "dx-q-acc-entrapment",
      stem: "At the end of a right radial case the diagnostic catheter will not withdraw; the patient has forearm pain and the catheter feels gripped. What should you do first?",
      options: [
        "Pull firmly and steadily to free it before the spasm gets any worse",
        "Advance the catheter to relieve the spasm, then pull it back quickly",
        "Stop pulling; give more vasodilator, analgesia or sedation, and wait",
        "Cut the catheter at the hub and leave the fragment for surgical removal",
        "Inflate a blood-pressure cuff above systolic pressure, then withdraw",
      ],
      answer: 2,
      explanation:
        "Severe spasm relaxes with vasodilator, analgesia, sedation and time; if it does not, deeper sedation or a regional block is the next step. Pulling against a gripped catheter can avulse or evert the radial artery. An upper-arm cuff inflated above systolic for about 5 minutes and then released (ischaemia-mediated vasodilation) is a recognised later step if vasodilators, sedation and warmth fail (Brilakis 29.2.3.4); it is not the first action.",
      difficulty: 2,
      refs: ["supplied-medmastery", "brilakis-manual-pci"],
    },
    {
      id: "dx-q-acc-patent-haemostasis",
      stem: "After removing a radial sheath you deflate the compression band until a pulse returns distal to it while the puncture stays dry. What is the main purpose?",
      options: [
        "To prevent compartment syndrome in the forearm",
        "To keep antegrade radial flow and reduce occlusion",
        "To allow the ulnar artery to dilate and take over flow",
        "To speed discharge by shortening the compression time",
        "To reduce the risk of a radial pseudoaneurysm forming",
      ],
      answer: 1,
      explanation:
        "Patent haemostasis maintains some flow through the radial artery during compression, which lowers the rate of radial artery occlusion. Over-tight occlusive compression is the main avoidable cause of occlusion. Compartment syndrome relates to bleeding into the forearm, not to how tightly the band is set over a dry puncture.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
    {
      id: "dx-q-acc-loop",
      stem: "A sheath angiogram shows a tight radioulnar loop just below the elbow. The J-wire repeatedly enters the recurrent radial branch. What is the most appropriate next step?",
      options: [
        "Advance the diagnostic catheter over the J-wire into the branch and inject to define it",
        "Cross the loop with a 0.014-inch coronary wire, then track the catheter over it",
        "Give a larger dose of heparin and retry the J-wire with more forward pressure",
        "Abandon radial access in this patient permanently and record it in the notes",
        "Exchange for a 7F sheath, whose stiffness will straighten the loop for the wire",
      ],
      answer: 1,
      explanation:
        "A steerable coronary wire can usually find the true lumen through a loop; once it is in the brachial artery, the catheter (sometimes with balloon-assisted tracking) can straighten the loop gently. If that fails or causes pain, change access. Advancing a catheter into a small branch risks perforation, and a larger sheath makes matters worse.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
    {
      id: "dx-q-acc-matrix",
      stem: "In the MATRIX trial of patients with acute coronary syndromes, what did radial access achieve compared with femoral access?",
      options: [
        "Lower stent thrombosis",
        "Lower major bleeding and net adverse clinical events",
        "Shorter fluoroscopy times",
        "Fewer access crossovers",
        "Lower rates of contrast nephropathy as the primary finding",
      ],
      answer: 1,
      explanation:
        "MATRIX showed that radial access reduced major bleeding and net adverse clinical events, with lower all-cause mortality. This is the basis for radial-first practice. Radial access does not shorten fluoroscopy (if anything it is slightly longer early in the learning curve), and stent thrombosis was not the benefit.",
      difficulty: 1,
      refs: ["matrix-2015"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Complete a right radial case from puncture to ascending aorta, using the deep-breath manoeuvre when the wire stalls at the subclavian." },
    { sim: "procedure", task: "Perform a femoral puncture guided by the femoral head and confirm the arteriotomy is above the bifurcation on the sheath angiogram." },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 — Diagnostic catheters and safe engagement
// ---------------------------------------------------------------------------
const mCatheters: Module = {
  id: "dx-catheters",
  title: "Diagnostic catheters and safe engagement",
  stage: 2,
  summary:
    "How catheter curves seat in the aortic root, which shape to choose for each ostium and route, the engagement ritual before every injection, and what to do when the pressure trace changes.",
  objectives: [
    "Describe catheter construction and explain how the primary and secondary curves hold the tip at an ostium.",
    "Choose Judkins, Amplatz, multipurpose or universal radial catheters according to access route, root size and ostial position.",
    "Perform the safe engagement sequence: wire out, bleed back, connect, aspirate, check pressure, test injection.",
    "Recognise and manage damping, ventricularisation, conus over-selection, ostial disease and catheter-tip spasm.",
  ],
  lessons: [
    {
      id: "dx-cath-anatomy",
      title: "Catheter anatomy and the main shapes",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "A diagnostic catheter is a braided polymer tube with a preformed tip. Its size is given in French, the outer diameter in units of one third of a millimetre (1 F = 0.33 mm); diagnostic studies use 4–6 F. Larger catheters transmit torque better, opacify vessels with less injection force and are more stable. Smaller catheters need a smaller arteriotomy and cause less spasm and bleeding, but they are floppier and need a firmer injection to avoid streaming.",
        },
        {
          kind: "p",
          text: "Two bends do the work. The primary curve, nearest the tip, points the tip into the ostium. The secondary curve, further back, rests against the opposite wall of the aorta and holds the tip in place. The straight segment between them must match the width of the aortic root: that is what the number on a Judkins Left catheter describes. Guide catheters, used for PCI, share these shapes but have a larger lumen, a soft non-tapered tip and sometimes side holes; diagnostic catheters have tapered tips and are not designed for equipment delivery.",
        },
        {
          kind: "table",
          caption: "The main diagnostic shapes",
          head: ["Catheter", "Designed for", "How it seats", "Watch for"],
          rows: [
            ["Judkins Left 4 (JL4)", "Left coronary from the femoral or left radial route, average root", "Advanced into the left sinus; the tip usually drops into the left main with little manipulation while the secondary curve rests on the opposite wall", "Pushing to 'reach' the ostium drives it towards the LV"],
            ["JL3.5", "Right radial route; small root; short patient; high left main; separate LAD ostium", "As JL4", "Can still deep-seat in a short left main"],
            ["JL4.5 / JL5", "Dilated root (aortic stenosis with post-stenotic dilatation, aortic regurgitation, long-standing hypertension), tall patients", "As JL4", "Unstable and high in a normal root"],
            ["Judkins Right 4 (JR4)", "Right coronary from any route", "Tip lowered into the right sinus, then clockwise rotation with slight withdrawal swings it anteriorly into the ostium", "Stored torque makes it dive deep; conus over-selection"],
            ["Amplatz Left (AL1, AL2)", "Difficult left main (wide or horizontal root, high or posterior origin); upward-pointing RCA; some grafts", "Secondary curve sits in the sinus; advancing lifts the tip up into the ostium", "Aggressive; withdrawing makes the tip dive deeper"],
            ["Amplatz Right (modified) / Williams 3DRC", "RCA with a high, anterior or shepherd's-crook origin", "Reaches up onto the cusp shelf", "Damping and deep engagement"],
            ["Multipurpose", "Downward-pointing RCA, vein grafts, LV pressure", "Engages by advancing the angled tip into an ostium that faces downward", "Enters the LV if the ostium is high"],
            ["Tiger / universal radial", "Both coronaries from the radial route without an exchange", "Left: tip in the left sinus with anticlockwise rotation. Right: clockwise torque with gentle withdrawal, like a JR4", "Tends to dive deep into the RCA"],
            ["Internal mammary (IMA)", "LIMA and RIMA grafts", "Sharp hooked tip drops into the IMA from the subclavian", "See the grafts module"],
            ["Pigtail", "LV angiography and aortography", "Coiled atraumatic tip with side holes", "See the final module"],
          ],
        },
        { kind: "h", text: "Judkins Left sizing logic" },
        {
          kind: "keypoints",
          items: [
            "Start with JL4 from the femoral or left radial route and JL3.5 from the right radial route. In practice, coming from the brachiocephalic trunk the catheter approaches the root at a different angle and tends to behave as if it were larger, so a half size smaller usually seats better.",
            "Go smaller for a small root, a short patient, a high left main origin or a separate LAD ostium.",
            "Go larger for a dilated root or a tall patient.",
            "A common rule of thumb when a JL will not seat: a tip that points upward above the ostium with the arm cramped means the curve is too long, so step down; a tip that sits low or folds down into the sinus means the curve is too short, so step up.",
            "With separate LAD and LCx ostia, a shorter curve or slight clockwise rotation tends to favour the anterior LAD; a longer curve or anticlockwise rotation tends to favour the posterior LCx.",
          ],
        },
        { kind: "h", text: "Engagement manoeuvres" },
        {
          kind: "list",
          items: [
            "JL: in LAO or AP, advance slowly into the left sinus and let the tip find the ostium. If the tip sits below the ostium, withdraw a little; if above, advance a little. Little or no rotation is needed. From the right radial a held deep breath may change the angle helpfully.",
            "JR4: in LAO 30–45 degrees, lower the tip to just above the valve with the tip facing the patient's left, then rotate clockwise slowly while withdrawing a few millimetres. The tip swings anteriorly and drops into the RCA. As soon as it engages, let the stored torque out, or it will keep turning and dive deep.",
            "Amplatz: advance until the secondary curve rests in the sinus and the tip rides up into the ostium. To disengage, advance slightly so the tip lifts out, then rotate away and withdraw. Never simply pull it back.",
            "Tiger: for the left system place the tip in the left sinus and turn anticlockwise; for the RCA use clockwise torque with gentle withdrawal. If it dives deep into the RCA, apply gentle anticlockwise torque and withdraw slightly to sit at the ostium.",
          ],
        },
        {
          kind: "pearl",
          text: "Shape solves engagement problems; force does not. If a catheter needs pushing to reach an ostium, it is the wrong size or the wrong shape.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In a normal root and then a dilated root, compare JL3.5, JL4 and JL5: note where each tip sits and which seats coaxially without pushing.",
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "hanna-pcm", "brilakis-manual-pci"],
    },
    {
      id: "dx-cath-engage",
      title: "The safe engagement sequence",
      minutes: 10,
      blocks: [
        {
          kind: "p",
          text: "Every injection is preceded by the same ritual. Most catheter complications (air embolism, ostial dissection, ventricular fibrillation, prolonged ischaemia) happen when a step is skipped, usually because the operator is in a hurry or the last injection went well.",
        },
        {
          kind: "steps",
          title: "Before every injection",
          items: [
            { title: "Lead with the wire", detail: "Advance the catheter into the ascending aorta over a J-wire under fluoroscopy. From the radial route, LAO helps the wire find the ascending aorta. Never advance a catheter without a wire through tortuous arteries." },
            { title: "Wire out, bleed back", detail: "Remove the wire and let the catheter bleed back, or aspirate, to clear air and debris before connecting." },
            { title: "Connect and aspirate", detail: "Connect to the manifold and aspirate until blood flows freely with no bubbles. If you cannot aspirate, the tip is against the aortic wall or already wedged in a vessel: do not flush or inject, reposition first." },
            { title: "Flush and check the aortic trace", detail: "Flush, then confirm a normal aortic waveform with a sharp upstroke and dicrotic notch. This is your reference." },
            { title: "Engage while watching the pressure", detail: "Use the catheter's manoeuvre in the engagement view (left: AP or LAO; right: LAO 30–45 degrees), with an eye on the trace throughout." },
            { title: "Re-check the trace", detail: "After engagement the trace should be unchanged. If it is damped or ventricularised, stop." },
            { title: "Test injection", detail: "A small puff of a few millilitres confirms a selective, coaxial position, shows any ostial lesion or staining, and lets you refine the projection." },
            { title: "Diagnostic run", detail: "Hold the syringe so any bubbles rise towards the plunger, away from the catheter. Ask for a deep breath and hold. Inject smoothly and firmly enough to replace the blood completely (the supplied handbook suggests about 5–10 mL for the left and 3–5 mL for the right, more for large vessels). Keep recording through washout and ask the radiographer to pan to the distal bed and any collaterals." },
            { title: "Between runs", detail: "Disengage if the position is unstable, and recheck the trace before the next injection." },
          ],
        },
        { kind: "h", text: "Reading the pressure trace" },
        {
          kind: "table",
          head: ["Trace", "Appearance", "Usual meaning", "Action"],
          rows: [
            ["Normal aortic", "Sharp upstroke, dicrotic notch, diastolic pressure maintained", "Tip free and coaxial", "Proceed"],
            ["Damped", "Lower, rounded trace; systolic and diastolic both fall; notch lost", "Tip against the wall, non-coaxial or partly wedged; ostial narrowing; kink; air or clot in the line", "Do not inject or flush. Withdraw slightly, aspirate, check the transducer, screen for a kink; if still damped, remove under suction and aspirate the sheath"],
            ["Ventricularised", "Systolic pressure preserved, diastolic pressure low and rising through diastole, like an LV trace", "Tip obstructing the ostium: ostial stenosis, deep seat in a small vessel, conus branch, spasm", "Do not inject. Withdraw at once; non-selective sinus injection"],
            ["Ventricularises, then falls progressively", "As above, followed by a further drop", "Catheter-tip spasm, classically at the RCA ostium", "Withdraw slightly; intracoronary nitrate"],
          ],
        },
        { kind: "h", text: "Conus over-selection" },
        {
          kind: "p",
          text: "The conus artery is the first branch of the RCA and has its own aortic ostium in roughly a third of people, next to the RCA ostium. A JR4 turned with too much torque, or aimed slightly high and anterior, can slip into it. The trace damps, and a test puff fills a small vessel running anteriorly and upwards towards the right ventricular outflow tract, with no RCA. Injecting a full volume here, or occluding it for long, can trigger ventricular fibrillation. Withdraw immediately and re-engage with less rotation. The one exception is deliberate: when you are looking for a conus collateral to an occluded LAD, which is covered in the anatomy module.",
        },
        { kind: "h", text: "Ostial disease and the non-selective sinus injection" },
        {
          kind: "p",
          text: "An ostial lesion can be missed when the catheter sits beyond it, and it can be mimicked by catheter-tip spasm. Both problems have the same answer: pull back until the tip sits just outside the ostium and inject firmly into the sinus, ideally in LAO straight for the left main and LAO for the RCA. A narrowing that persists with no catheter in contact is real. Ostial left main disease often damps the trace as soon as the catheter enters, which is itself a warning sign. If a selective picture is truly essential, an experienced operator may perform a single brief, small injection and withdraw immediately while still recording; this is not a routine manoeuvre.",
        },
        { kind: "h", text: "Exchanges and kinks" },
        {
          kind: "list",
          items: [
            "Exchange catheters over a 0.035-inch wire left in the ascending aorta. After a difficult radial or iliac passage, use an exchange-length wire so you keep the hard-won route.",
            "Withdraw catheters over a wire through tortuous segments to stop the tip scraping the wall and to reduce spasm.",
            "Aspirate and flush after every exchange.",
            "Avoid heavy torque without a wire inside, especially with small catheters. If a catheter kinks, counter-rotate gently and try to pass a wire through the kink before withdrawing it.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting into a damped or ventricularised trace 'just once'.",
            "Skipping aspiration after removing the wire.",
            "A weak injection that streams and creates a false lesion.",
            "Leaving contrast or stagnant blood in the catheter between runs.",
            "Not recording long enough to see the distal bed and collaterals.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA with a JR4 in LAO 30 while watching the pressure trace. When it ventricularises, back off, then perform a non-selective injection in the right sinus.",
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "supplied-eh-views", "hanna-pcm"],
    },
    {
      id: "dx-cath-troubleshoot",
      title: "Troubleshooting difficult engagement",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "When engagement fails, work out why before swapping catheters at random. Three variables explain almost every problem: the size and shape of the root, the position of the ostium (height, and anterior or posterior), and the access route.",
        },
        {
          kind: "table",
          caption: "Common engagement problems",
          head: ["Problem", "Likely reason", "First move", "Next move"],
          rows: [
            ["JL tip falls short; faint non-selective filling", "Dilated root", "JL4.5 or JL5", "Amplatz Left"],
            ["JL deep-seats and damps", "Small root or short left main", "Withdraw; JL3.5", "Smaller catheter; sinus injection"],
            ["JL fills only the LAD or only the LCx", "Short left main or separate ostia", "Inject each vessel selectively: shorter curve or clockwise for LAD, longer curve or anticlockwise for LCx", "Amplatz Left"],
            ["JR4 cannot find the RCA", "High, anterior or shepherd's-crook origin", "Non-selective injection in the right sinus (LAO) to locate it", "Amplatz Right (modified), Williams 3DRC or AL1"],
            ["RCA ostium points downward", "Inferior take-off", "Multipurpose", "JR with a different height"],
            ["Tiger dives deep into the RCA", "Shape of the universal curve", "Gentle anticlockwise torque and withdrawal", "Change to a JR"],
            ["Catheter keeps entering the LV", "Tip too low, below the sinus", "Withdraw above the sinus before rotating", "Reassess the curve size"],
            ["No vessel found where expected", "Anomalous origin", "Aortogram to find the ostium", "Amplatz or multipurpose shapes; CT"],
            ["Catheter will not transmit torque", "Tortuous subclavian or iliac route", "Keep a wire inside while rotating; larger French", "Change access"],
          ],
        },
        { kind: "h", text: "Amplatz safety" },
        {
          kind: "keypoints",
          items: [
            "Amplatz catheters engage deeply and with force; watch the trace continuously.",
            "To disengage, advance slightly so the tip lifts out of the ostium, then rotate away and withdraw.",
            "Pulling an engaged Amplatz back drives the tip deeper and can dissect the vessel.",
            "Use the smallest Amplatz that reaches; an oversized one is even more aggressive.",
          ],
        },
        { kind: "h", text: "Catheter-induced dissection" },
        {
          kind: "p",
          text: "Suspect it when contrast stays in the vessel wall after washout, when a linear lucency or flap appears at the ostium, or when the trace damps after an injection that was previously fine. Stop injecting into that vessel, do not re-engage it forcefully, and call for senior help: an ostial left main or RCA dissection can propagate and may need urgent stenting. Diagnostic catheter tips are tapered and less forgiving than guide catheters; treat every deep engagement with respect.",
        },
        {
          kind: "pearl",
          text: "A non-selective sinus injection in the right projection answers most 'where is the ostium?' questions faster, and more safely, than ten blind rotations.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage a high anterior RCA: try a JR4 first, then an Amplatz Right, and disengage the Amplatz by advancing to lift the tip before withdrawing.",
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "hanna-pcm", "brilakis-manual-pci"],
    },
  ],
  quiz: [
    {
      id: "dx-q-cath-rradial-jl",
      stem: "Which Judkins Left curve is the usual first choice for the left coronary artery from the right radial artery in a patient with a normal aortic root?",
      options: ["JL3.5", "JL4", "JL4.5", "JL5", "JL6"],
      answer: 0,
      explanation:
        "From the right radial route the catheter enters the root from the brachiocephalic trunk and behaves as if it were larger, so a half size smaller (JL3.5) usually seats best. JL4 is the standard for the femoral or left radial route; it often sits high from the right radial, though it can work.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-cath-dilated",
      stem: "An 80-year-old with severe aortic stenosis and a dilated ascending aorta is studied femorally. The JL4 tip falls short of the left main and gives faint non-selective filling. What is the best next catheter?",
      options: ["JL3.5", "JL5", "JR4", "Multipurpose", "Pigtail"],
      answer: 1,
      explanation:
        "A dilated root needs a longer curve so that the tip reaches the left main while the secondary curve rests on the opposite wall; JL5 (or an Amplatz Left) is the logical step. JL3.5 is shorter and would fall even further short.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-cath-ventricularised",
      stem: "After engaging the left main, the aortic trace of 130/75 mmHg changes to 125/15 mmHg with diastolic pressure rising through diastole. What does this indicate and what should you do?",
      options: [
        "A kinked catheter; flush vigorously to restore the normal trace",
        "Ventricularisation from ostial obstruction; do not inject, withdraw",
        "Normal coronary pressure in diastole; proceed with the injection as planned",
        "Severe aortic regurgitation; perform an aortogram before going on",
        "Air in the transducer line; re-zero the system and then inject",
      ],
      answer: 1,
      explanation:
        "Preserved systolic pressure with a low diastolic pressure that rises through diastole is the ventricularised pattern: the tip is obstructing the ostium (ostial disease, deep seating or spasm). Injecting risks dissection, prolonged ischaemia and VF; withdraw and define the ostium with a sinus injection. Flushing vigorously for a presumed kink would be dangerous for the same reasons.",
      difficulty: 2,
      refs: ["supplied-oxford", "supplied-medmastery"],
    },
    {
      id: "dx-q-cath-aspiration",
      stem: "After removing the wire from a JR4 in the aortic root you cannot aspirate blood. What is the correct action?",
      options: [
        "Flush firmly to clear the catheter",
        "Inject a small contrast puff to see where the tip is",
        "Do not flush or inject; reposition the catheter until blood aspirates freely",
        "Replace the transducer",
        "Give intracoronary nitrate",
      ],
      answer: 2,
      explanation:
        "Failure to aspirate means the tip is against the aortic wall or already wedged in a vessel. Flushing or injecting in that position risks air embolism, dissection or a wedged injection. Move the catheter until free back-bleeding returns, then flush.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-cath-conus",
      stem: "While engaging the RCA with a JR4, the trace damps and a test puff fills only a small vessel running anteriorly and upwards towards the RV outflow tract. What is the main danger of injecting a full volume here?",
      options: ["Aortic dissection", "Ventricular fibrillation", "Complete heart block from SA node ischaemia", "Contrast nephropathy", "Spasm of the left main"],
      answer: 1,
      explanation:
        "The catheter is in the conus branch. Injecting contrast into it, or occluding it, can provoke ventricular fibrillation. Withdraw at once and re-engage with less rotation. The SA nodal artery runs towards the SVC and right atrium, not the outflow tract.",
      difficulty: 2,
      refs: ["supplied-oxford", "supplied-medmastery"],
    },
    {
      id: "dx-q-cath-amplatz",
      stem: "An Amplatz Left catheter is engaged in the left main. How should you disengage it?",
      options: [
        "Pull it straight back while watching the tip on fluoroscopy",
        "Rotate it clockwise while pulling back slowly out of the sinus",
        "Advance it slightly so the tip lifts out, then rotate and withdraw",
        "Inject a puff of contrast so that the jet pushes the tip back out of the ostium",
        "Remove it over a wire left in the LAD so the tip cannot dissect",
      ],
      answer: 2,
      explanation:
        "With an Amplatz, withdrawal makes the tip dive deeper into the vessel, which is how dissections happen. Advancing slightly lifts the tip out; then rotate and withdraw. Pulling straight back is the instinctive but dangerous choice.",
      difficulty: 2,
      refs: ["hanna-pcm", "brilakis-manual-pci"],
    },
    {
      id: "dx-q-cath-tiger",
      stem: "A Tiger catheter from the right radial has engaged the RCA and dived deep into the proximal vessel. What is the correct correction?",
      options: [
        "More clockwise torque to turn the tip out of the vessel",
        "Gentle anticlockwise torque with slight withdrawal",
        "Advance the catheter to straighten its secondary curve",
        "Inject a puff of contrast to flush the tip back out",
        "Exchange for an Amplatz Left, which sits more coaxially",
      ],
      answer: 1,
      explanation:
        "The universal radial shape tends to dive into the RCA. Gentle anticlockwise torque with withdrawal backs the tip out to sit at the ostium. More clockwise torque, the movement that engaged it, drives it deeper.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-cath-shepherd",
      stem: "A JR4 cannot engage an RCA that arises high and turns sharply upward before descending (a shepherd's-crook origin). Which catheter is most likely to help?",
      options: [
        "JL4 rotated round into the right sinus",
        "Amplatz Right (modified) or Williams 3DRC",
        "Pigtail placed in the right sinus",
        "JR3.5 with extra clockwise torque applied",
        "Multipurpose with a downward tip",
      ],
      answer: 1,
      explanation:
        "Amplatz Right (modified) and Williams 3DRC shapes reach up to a high, upward-directed ostium and sit coaxially. A multipurpose catheter suits a downward-pointing ostium, the opposite situation.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-cath-ostial",
      stem: "A tight narrowing appears exactly at the tip of the JR4 at the RCA ostium. Which single step best distinguishes catheter-tip spasm from true ostial disease?",
      options: [
        "A larger, forceful selective injection to fill the vessel beyond the narrowing",
        "Give nitrate, withdraw the catheter and inject non-selectively into the sinus",
        "Deeper engagement with the JR4 to see the vessel just beyond the lesion",
        "Change to an Amplatz Right and repeat a selective injection in the same view",
        "Measure FFR across the narrowing immediately, before giving any nitrate",
      ],
      answer: 1,
      explanation:
        "Removing the mechanical stimulus and giving nitrate relieves spasm; a sinus injection with no catheter in contact then shows whether a fixed lesion remains. A larger selective injection, the tempting option, worsens spasm and risks dissection, and cannot separate the two.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Seat a JL3.5 from the right radial in a small root without damping, then inject in LAO caudal." },
    { sim: "cathlab", task: "Engage the RCA with a JR4 using clockwise rotation and slight withdrawal, releasing stored torque as soon as the tip enters the ostium." },
  ],
  caseIds: ["dx-case-left-main"],
};

// ---------------------------------------------------------------------------
// Module 4 — Angiographic views (the core module)
// ---------------------------------------------------------------------------
const mViews: Module = {
  id: "dx-views",
  title: "Angiographic views: the projection playbook",
  stage: 2,
  summary:
    "How projections are named and recognised, the rules that predict where each artery will appear, the best view for every left and right coronary segment, and how to correct overlap and foreshortening.",
  objectives: [
    "Name C-arm projections correctly and identify any projection from the diaphragm, spine, ribs and catheter position.",
    "Apply the caudal-for-proximal and cranial-for-distal principle, the image-intensifier rule and the border rule to predict vessel positions.",
    "Choose the best view for each LCA and RCA segment, including the left main ostium and bifurcation and the RCA crux, and correct overlap or foreshortening.",
    "Adapt the view set to horizontal or vertical hearts, distinguish septal from diagonal branches, and confirm an occluded LAD.",
  ],
  lessons: [
    {
      id: "dx-views-principles",
      title: "Projection principles",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "A projection is named for where the image detector (the image intensifier or flat panel) sits relative to the patient, not for where the X-ray tube is. In LAO the detector is over the patient's left anterior chest; in RAO, over the right anterior chest. Cranial means the detector is tilted towards the head; caudal, towards the feet. The frontal view is called AP in most labs, although strictly the beam travels posterior to anterior (PA). Every view is two numbers: rotation (LAO or RAO, 0–90 degrees) and angulation (cranial or caudal, limited by the table and the patient).",
        },
        {
          kind: "figure",
          id: "views-compass",
          caption: "C-arm angulation: rotation to the patient's left (LAO) or right (RAO) on one axis, tilt towards the head (cranial) or feet (caudal) on the other. The view is named for the detector position.",
        },
        { kind: "h", text: "Rule 1: caudal for the proximal left system, cranial for the distal" },
        {
          kind: "table",
          head: ["Angulation", "Shows well", "Shows poorly"],
          rows: [
            ["Caudal (looking from below)", "Distal left main, proximal LAD, proximal LCx, the LCx body and obtuse marginals", "Mid and distal LAD; diagonal origins"],
            ["Cranial (looking from above)", "Left main ostium; mid and distal LAD with its septal and diagonal origins; distal segments of a dominant LCx; the RCA crux", "Proximal LCx territory, which is thrown upward and overlapped"],
          ],
        },
        { kind: "h", text: "Rule 2: the image-intensifier rule" },
        {
          kind: "p",
          text: "When you move the detector, the circumflex moves with it on the screen and the LAD and diagonals move the opposite way. Tilt more caudal and the LCx is pulled down the screen while the LAD rises; tilt cranial and the LCx rides up. This is why the LCx sits at the top of every cranial view and at the bottom of every caudal view. Use the rule to separate overlapping vessels: decide which vessel you want to move and in which direction, then move the detector accordingly. A related rule from the Oxford handbook: in any view of the left coronary artery, the LCx is the branch that runs closest to the spine.",
        },
        { kind: "h", text: "Rule 3: the border rule" },
        {
          kind: "p",
          text: "An artery running along the very edge of the cardiac silhouette is rarely the LAD. Depending on the view it is usually a diagonal or an obtuse marginal. The LAD stays within the heart shadow as it heads towards the apex. When the true LAD is occluded, a large diagonal can take over its role and run convincingly down the middle, which is the trap described in the caudal-views lesson.",
        },
        { kind: "h", text: "Orthogonal views and foreshortening" },
        {
          kind: "p",
          text: "A view is orthogonal to a segment when the beam is perpendicular to it: the segment is laid out at full length with no geometric distortion. Foreshortening is the opposite: the beam runs partly along the segment, which looks compressed. Contrast in the overlapping proximal and distal parts adds up, so a foreshortened segment often looks like a short, unusually dense blob. Two dangers follow: a significant stenosis can be hidden between the overlapping columns, and lesion length is underestimated.",
        },
        {
          kind: "steps",
          title: "Correcting foreshortening or overlap",
          items: [
            { title: "Spot it", detail: "A segment that looks too short, too dense, or crossed by another vessel at the point of interest." },
            { title: "Predict", detail: "Use the image-intensifier rule to decide which way the vessels will move with rotation or tilt." },
            { title: "Adjust", detail: "Change one axis by 15–30 degrees in the direction that lengthens the segment or separates the vessels." },
            { title: "Confirm", detail: "Record a second view roughly at right angles to the first before grading any lesion." },
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Projections are named for the detector position.",
            "Caudal views show the proximal left system; cranial views show the mid and distal LAD, the left main ostium and the crux.",
            "The LCx moves with the detector; the LAD and diagonals move the other way.",
            "Vessels on the edge of the heart shadow are usually diagonals or marginals, not the LAD.",
            "Foreshortening hides stenoses and shortens lesions: every lesion needs two near-orthogonal views.",
          ],
        },
        {
          kind: "sim",
          sim: "views",
          task: "Move between RAO caudal and RAO cranial and watch the LCx travel with the detector while the LAD moves the opposite way; then find the angle that separates them most.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-medmastery", "supplied-angio-atlas"],
    },
    {
      id: "dx-views-identify",
      title: "Identifying the projection on the screen",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Name the view before you name the arteries. Trainees who try to recognise vessels first are fooled by every unusual anatomy; operators who first fix the projection from bony and soft-tissue landmarks know where each artery should be and notice at once when something is missing. Make it a two-step habit: projection, then vessels.",
        },
        {
          kind: "steps",
          title: "Identify the projection",
          items: [
            { title: "Cranial or caudal?", detail: "Look for the diaphragm. A cranial view projects the dome of the diaphragm over the cardiac silhouette. In a caudal view the diaphragm is not over the heart: it is out of the frame or just visible at the bottom edge." },
            { title: "LAO or RAO? Find the spine", detail: "Spine on the left of the image: RAO. Spine on the right of the image: LAO." },
            { title: "Cross-check with 'open arms'", detail: "Imagine stretching one arm out to the spine and the other to the catheter tip. If your left hand reaches the catheter, it is LAO; if your right hand does, it is RAO." },
            { title: "Cross-check with the ribs", detail: "Clearest in RAO. In RAO the ribs slope down towards your right hand; in LAO they slope down towards your left." },
            { title: "Now name the vessels", detail: "Use the expected positions for that projection, and look for what is missing as well as what is present." },
          ],
        },
        { kind: "h", text: "What each oblique separates" },
        {
          kind: "p",
          text: "RAO looks along the plane of the atrioventricular groove, so it separates the atria from the ventricles. LAO looks along the interventricular septum, so it separates the right heart from the left. This has practical uses. With a coronary fistula, RAO tells you whether it drains into an atrium or a ventricle, and LAO tells you whether that chamber is on the right or the left. On the RCA, RAO separates atrial branches such as the SA nodal artery from ventricular branches such as the acute marginals.",
        },
        {
          kind: "table",
          caption: "Recognition cues",
          head: ["Cue", "RAO", "LAO"],
          rows: [
            ["Spine on the screen", "Left side", "Right side"],
            ["Hand that reaches the catheter ('open arms')", "Right", "Left"],
            ["Rib slope", "Down towards your right", "Down towards your left"],
            ["What it separates", "Atria from ventricles (looks along the AV groove)", "Right heart from left heart (looks along the septum)"],
            ["RCA shape", "An 'L'; the mid RCA and acute marginals are spread out", "A 'C'; the proximal to mid RCA is shown in profile"],
            ["Left system", "LCx runs low and towards the spine in caudal views; LAD towards the apex", "In LAO cranial the LAD runs roughly parallel to the spine and the LCx is thrown to the right of the screen"],
            ["Ventriculogram", "Long axis of the LV in profile: anterior, apical and inferior walls", "Septum seen on edge: septal and posterolateral walls"],
          ],
        },
        {
          kind: "table",
          caption: "Diaphragm cue",
          head: ["Diaphragm position", "Likely angulation"],
          rows: [
            ["Dome overlying the heart shadow", "Cranial"],
            ["Absent, or only at the bottom edge of the frame", "Caudal"],
          ],
        },
        {
          kind: "pearl",
          text: "Say the projection aloud before each run, and check it against the C-arm display. The habit costs nothing and protects you from the commonest identification errors, especially when reviewing someone else's images.",
        },
        {
          kind: "pitfalls",
          items: [
            "Naming vessels before the projection, then forcing the anatomy to fit.",
            "Calling a view cranial because the heart is high in the frame; use the diaphragm, not the heart position.",
            "Relying on one cue only. Use the spine and the ribs or the 'open arms' check together.",
          ],
        },
        {
          kind: "sim",
          sim: "views",
          task: "Identify ten random projections using only the diaphragm, spine, rib and catheter cues before looking at the C-arm readout.",
        },
        {"kind": "cine", "run": "cd-01029-LCA-7", "caption": "Real left coronary run, recorded C-arm angles LAO 30° caudal 26° (the spider view). Before reading the label, name the view from the spine, the diaphragm and the catheter course."},
        {"kind": "drill", "target": "angio-real", "drill": "view", "task": "Name the projection on real runs. Two runs per view; runs within 5° of a naming boundary accept either name."},
        {"kind": "drill", "target": "angio-real", "drill": "view", "params": {"artery": "LCA", "borderline": "exclude"}, "task": "A strict set on left coronary runs only: runs near a naming boundary are left out, so every run has one correct name."},
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas"],
    },
    {
      id: "dx-views-lca-caudal",
      title: "Left coronary: caudal views and heart orientation",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Caudal views are the primary projections for the proximal left system: the distal left main, the origins of its branches and the whole circumflex. Angles below are typical starting points drawn from the supplied sources; adjust them to the patient.",
        },
        {
          kind: "table",
          caption: "Caudal views of the left coronary artery",
          head: ["View", "Typical angles", "Best for", "Poor for", "Pitfall and correction"],
          rows: [
            [
              "RAO caudal",
              "About 20–30 degrees RAO, 20–30 degrees caudal",
              "Distal left main, proximal LAD, the whole LCx with its obtuse marginals; also the best view of the apical LAD",
              "Mid LAD and diagonals, which overlap and foreshorten",
              "LCx ostium hidden behind the left main: go more caudal to pull the LCx down. With an occluded LAD a large diagonal can run down the middle and mimic the LAD: confirm in LAO cranial",
            ],
            [
              "AP caudal",
              "0 degrees, about 30 degrees caudal",
              "Distal left main bifurcation, LCx, proximal LAD; complements RAO caudal",
              "Mid LAD and diagonals",
              "Left main overlapping the branch origins: add a few degrees of RAO or LAO",
            ],
            [
              "LAO caudal ('spider')",
              "About 40–50 degrees LAO, 25–35 degrees caudal",
              "Distal left main and the origins and proximal segments of the LAD, LCx, diagonals, obtuse marginals and any ramus",
              "Mid and distal vessels, which are foreshortened",
              "Catheter high and eccentric, so LAD and LCx overlap: centre the catheter tip in the heart shadow and go more caudal. Hard to obtain in obese patients and vertical hearts",
            ],
          ],
        },
        { kind: "h", text: "RAO caudal" },
        {
          kind: "p",
          text: "This is often the first left view because it lays out the circumflex and its marginals along the bottom of the image while showing the left main and proximal LAD across the top. The LAD runs towards the apex at the right of the screen, and its apical segment is seen best here of all views. The mid LAD and diagonals bunch together, so do not grade lesions there from this view.",
        },
        {
          kind: "p",
          text: "The view's main trap appears when the LAD is occluded, which is common in patients after bypass surgery. A large diagonal enlarges to supply the territory and runs down the centre of the heart, looking exactly like a healthy LAD. Before calling the LAD patent, confirm it in LAO cranial, where septal branches and diagonal branches must arise from opposite sides of a single vessel.",
        },
        { kind: "h", text: "LAO caudal: the spider" },
        {
          kind: "p",
          text: "Seen from below and to the left, the left main points towards the viewer and its branches radiate outwards like the legs of a spider. This gives the clearest picture of the left main bifurcation or trifurcation and of every branch origin. Before injecting, check that the catheter tip sits near the centre of the cardiac silhouette; a high, eccentric catheter overlaps the LAD and LCx, and the correction is more caudal tilt. The mid and distal vessels are foreshortened and cannot be assessed here.",
        },
        { kind: "h", text: "Horizontal and vertical hearts" },
        {
          kind: "table",
          head: ["Heart orientation", "Typical patient", "Caudal views of the left main bifurcation", "Better option"],
          rows: [
            ["Horizontal", "Shorter, heavier patients", "Excellent: the caudal beam is orthogonal to the bifurcation", "Caudal views, especially the spider"],
            ["Vertical", "Tall, thin patients; hyperinflated lungs", "Poor: the caudal beam runs along the bifurcation, so the LAD and LCx origins overlap and foreshorten", "Cranial views, which now become orthogonal to the bifurcation"],
          ],
        },
        {
          kind: "pearl",
          text: "In a vertical heart the rule reverses: the best view of the distal left main may be cranial. If the spider shows a tangle of overlapping origins, try AP or LAO cranial before adding more caudal tilt.",
        },
        {
          kind: "pitfalls",
          items: [
            "Grading a mid LAD lesion in RAO caudal, where it is foreshortened and overlapped.",
            "Accepting a central vessel in RAO caudal as the LAD in a patient with previous CABG.",
            "Persisting with steep caudal tilt in a vertical heart.",
          ],
        },
        {
          kind: "sim",
          sim: "views",
          task: "In the LAO caudal preset, start with the catheter high and the LAD and LCx overlapping; increase the caudal tilt until the bifurcation opens into a spider.",
        },
        {"kind": "cine", "run": "cd-01037-LCA-2", "caption": "Real left coronary run at RAO 26° caudal 30°: follow the circumflex and its marginals, and note how the LAD and left main are foreshortened."},
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas", "supplied-medmastery"],
    },
    {
      id: "dx-views-lca-cranial",
      title: "Left coronary: cranial views and the septal sign",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Cranial views are the workhorses for the mid and distal LAD and the origins of its septal and diagonal branches. They also give some of the best views of the left main ostium. The price is the diaphragm, which rises into the picture, so a good held inspiration matters most here.",
        },
        {
          kind: "table",
          caption: "Cranial and lateral views of the left coronary artery",
          head: ["View", "Typical angles", "Best for", "Poor for", "Notes"],
          rows: [
            [
              "AP cranial / shallow RAO cranial",
              "0–10 degrees RAO, 30–40 degrees cranial",
              "Mid and distal LAD with septal and diagonal branch points; left main ostium",
              "LCx and obtuse marginals, thrown upward and overlapped",
              "A little RAO moves the catheter off the spine, improving the left main ostium. Good for the distal branches of a dominant or co-dominant LCx (left PDA and posterolateral branches)",
            ],
            [
              "LAO cranial",
              "About 30–50 degrees LAO, 20–30 degrees cranial",
              "Mid and distal LAD, separating it from its diagonals; septal and diagonal origins; left main ostium; distal dominant LCx",
              "Proximal LAD and LCx may overlap",
              "LAD runs roughly parallel to the spine; LCx thrown to the right of the screen. Confirms an occluded LAD",
            ],
            [
              "RAO cranial",
              "About 30 degrees RAO, 20–30 degrees cranial",
              "Long, straightened LAD for diffuse disease and lesion length",
              "LCx body (foreshortened); LAD ostium may be obscured",
              "Steeper than the shallow RAO cranial; diaphragm excursion often intrudes",
            ],
            [
              "Left lateral",
              "90 degrees left lateral",
              "Mid and distal LAD free of diagonal overlap; LIMA-to-LAD anastomosis",
              "Left main and proximal LCx",
              "Arms must be raised above the head",
            ],
          ],
        },
        { kind: "h", text: "AP cranial and the shallow RAO cranial" },
        {
          kind: "p",
          text: "In a pure AP cranial view the catheter tip often overlies the spine, which blurs the left main ostium. Adding about 10 degrees of RAO moves it clear. The LAD then runs down the image with septal branches dropping into the septum on one side and diagonals running out to the lateral wall on the other, so branch points can be judged. The circumflex is pushed up and crowded; the exception is the distal part of a dominant LCx near the crux, which cranial views show well.",
        },
        { kind: "h", text: "LAO cranial" },
        {
          kind: "p",
          text: "Here the LAD runs alongside the spine and the circumflex swings away to the right of the screen. Diagonals separate cleanly from the LAD, which makes this the view of choice for diagonal origins. It also settles whether the LAD is occluded: if septal branches arise on one side and diagonal branches on the other, with no vessel between them, the LAD itself is not filling.",
        },
        {
          kind: "list",
          items: [
            "Overlap with the spine can reduce image quality.",
            "Diaphragm movement often obscures the heart, which makes it awkward for intervention.",
            "Steep angulation brings abdominal contents into the field and blurs the image.",
            "It gives the operator the highest scatter dose of the standard views, because the X-ray tube sits on the operator's side of the patient. Keep runs short and shields in place.",
          ],
        },
        { kind: "h", text: "The septal sign" },
        {
          kind: "p",
          text: "When you cannot tell whether a set of branches are septal perforators from the LAD or branches of a diagonal, watch them through systole. Septal perforators run deep inside the septum and stay fairly straight, without twisting or shortening as the heart contracts. Branches of a diagonal lie on the epicardial surface and twist and shorten with the contracting wall. A vessel giving straight, non-shortening branches is the LAD.",
        },
        {
          kind: "keypoints",
          items: [
            "Shallow RAO cranial: mid and distal LAD, branch points, left main ostium.",
            "LAO cranial: separates diagonals and confirms an occluded LAD; highest operator dose.",
            "RAO cranial: long LAD for length and diffuse disease; diaphragm often intrudes.",
            "Left lateral: mid LAD without diagonal overlap and the LIMA anastomosis.",
            "Septals stay straight in systole; diagonal branches twist and shorten.",
          ],
        },
        {
          kind: "sim",
          sim: "views",
          task: "In LAO cranial, identify the LAD running alongside the spine, then name the first diagonal and the first septal from the side each arises on.",
        },
        {"kind": "cine", "run": "cd-01029-LCA-3", "caption": "Real left coronary run at RAO 34° cranial 25°: the mid and distal LAD open out and the diagonals separate from it."},
        {"kind": "cine", "run": "cd-01045-LCA-1", "caption": "Real left coronary run at LAO 22° cranial 23°: compare how this cranial LAO view separates the LAD from its diagonals with the RAO cranial run above."},
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas", "supplied-medmastery"],
    },
    {
      id: "dx-views-lm-rca",
      title: "Left main and right coronary views",
      minutes: 9,
      blocks: [
        { kind: "h", text: "The left main" },
        {
          kind: "p",
          text: "Left main disease carries the largest myocardium at risk of any single lesion, so image it deliberately, segment by segment: ostium, body and distal bifurcation.",
        },
        {
          kind: "table",
          head: ["Segment", "Best views", "Avoid or distrust"],
          rows: [
            ["Ostium", "LAO straight, AP cranial, LAO cranial", "All RAO views (RAO straight, cranial and caudal), which look down the barrel of the ostium and foreshorten it; caudal views, in which the aortic cusp overlaps the ostium"],
            ["Body", "Most views; LAO straight and AP views show it well", "Views in which the catheter overlies it"],
            ["Distal left main and bifurcation", "All caudal views, especially LAO caudal (spider); RAO caudal and AP caudal; RAO straight sometimes helps; in vertical hearts, cranial views", "Steep caudal views in a vertical heart"],
          ],
        },
        {
          kind: "pearl",
          text: "When left main disease is suspected (for example widespread ST depression with ST elevation in aVR, or a high-risk stress test), make LAO straight your first left coronary view, starting with a small test injection.",
        },
        { kind: "h", text: "The right coronary artery" },
        {
          kind: "table",
          caption: "Standard RCA views",
          head: ["View", "Typical angles", "Best for", "Limitation"],
          rows: [
            ["LAO straight ('AV groove shot')", "About 30–45 degrees LAO", "Engagement and first run; the C-shaped proximal and mid RCA", "Distal bifurcation overlapped and foreshortened: PDA and posterolateral origins poorly seen"],
            ["LAO cranial or AP cranial", "LAO about 30–50 degrees with 20–25 degrees cranial; or AP with 25–40 degrees cranial", "Opens the crux: distal RCA, PDA and posterolateral branches", "Mid RCA foreshortened"],
            ["RAO", "About 30 degrees RAO", "Mid RCA and its acute marginal branch points; helps judge dominance or occlusion when other views are ambiguous; guides wiring when the wire keeps entering a marginal", "Distal vessel and crux foreshortened; supplemental rather than routine"],
          ],
        },
        {
          kind: "p",
          text: "A practical minimum for the RCA is two roughly orthogonal views: LAO straight for the body and AP or LAO cranial for the bifurcation. Add RAO when the mid vessel or the branching pattern is in doubt. Deep inspiration suits most views, but the distal RCA is sometimes better seen at end-expiration.",
        },
        { kind: "h", text: "The two bends at the crux" },
        {
          kind: "p",
          text: "In LAO, a true dominant RCA bends twice: once gently as it wraps round the acute margin of the heart, and again, more sharply, at the crux where it turns to give the PDA. A vessel that runs smoothly down the margin with no second bend is probably a large acute marginal branch, which should make you ask whether the RCA is non-dominant or occluded beyond it. This sign is developed fully in the anatomy module.",
        },
        { kind: "h", text: "Best view of the RCA ostium" },
        {
          kind: "p",
          text: "LAO is the best view of the RCA ostium because it is orthogonal to the ostia of both coronary arteries. If the ostium is still unclear, try a steeper LAO (40–45 degrees) or LAO caudal.",
        },
        { kind: "h", text: "A routine to adapt, not obey" },
        {
          kind: "table",
          caption: "One common routine",
          head: ["System", "Core views", "Add when needed"],
          rows: [
            ["Left coronary", "RAO caudal, AP or shallow RAO cranial, LAO cranial, LAO caudal (spider)", "AP caudal, RAO cranial, left lateral, LAO straight"],
            ["Suspected left main disease", "LAO straight first (test injection), then AP cranial", "Spider for the distal left main once the ostium is known to be safe"],
            ["Right coronary", "LAO straight, then AP or LAO cranial", "RAO for the mid vessel and branch identification; steeper LAO or LAO caudal for the ostium"],
          ],
        },
        {
          kind: "p",
          text: "A fixed routine is only a starting point. Missed lesions come from accepting standard views that do not show the segment of interest; change angles until every segment has been seen free of overlap and foreshortening.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Image the RCA in LAO and then LAO cranial: name the two bends in LAO, and the PDA and posterolateral branch in the cranial view.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "For a suspected ostial left main lesion, choose the first view; then choose the best view of the distal left main in a horizontal heart and in a vertical heart.",
        },
        {"kind": "cine", "run": "cd-01029-RCA-8", "caption": "Real right coronary run at LAO 31° caudal 6° in a right-dominant study (dataset label). Trace the vessel to the crux and the posterior descending artery."},
        {"kind": "drill", "target": "angio-real", "drill": "dominance", "task": "Decide dominance on real studies, with equal numbers of right- and left-dominant cases."},
        {"kind": "drill", "target": "angio-real", "drill": "plan", "task": "Plan the next view: see the first runs of a real study and choose the projection you would take next."},
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas", "supplied-medmastery"],
    },
  ],
  quiz: [
    {
      id: "dx-q-views-lao-cranial-id",
      stem: "On a left coronary run, the dome of the diaphragm overlies the lower heart shadow and the spine lies on the right side of the image. Which projection is this?",
      options: ["RAO caudal", "LAO caudal", "LAO cranial", "RAO cranial", "AP caudal"],
      answer: 2,
      explanation:
        "The diaphragm over the heart means cranial angulation, and the spine on the right of the image means LAO. RAO cranial would also show the diaphragm, but the spine would be on the left of the image.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-views-rao-caudal-id",
      stem: "A left coronary run shows no diaphragm over the heart, the spine on the left of the image, and the circumflex with its marginals running along the bottom of the picture. Which view is it?",
      options: ["LAO cranial", "RAO caudal", "LAO caudal", "AP cranial", "Left lateral"],
      answer: 1,
      explanation:
        "No diaphragm over the heart means caudal; spine on the left means RAO. The LCx along the bottom fits the image-intensifier rule (in caudal views the LCx is pulled down). LAO caudal is also caudal but has the spine on the right.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-views-lcx-ostium",
      stem: "In RAO caudal the ostium of the circumflex is hidden behind the distal left main. Which adjustment is most likely to separate them?",
      options: ["Reduce the caudal tilt", "Increase the caudal tilt", "Change to AP cranial", "Increase RAO to 45 degrees with no tilt", "Switch to LAO straight"],
      answer: 1,
      explanation:
        "The LCx moves with the detector: more caudal pulls it down and away from the left main, while the LAD moves up. Reducing caudal tilt moves the LCx back up into the overlap.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-lm-first",
      stem: "A patient has exertional angina with widespread ST depression and ST elevation in aVR on a stress test. Which projection should be your first left coronary view?",
      options: ["RAO caudal", "LAO straight", "LAO caudal", "RAO cranial", "Left lateral"],
      answer: 1,
      explanation:
        "LAO straight is orthogonal to the left main ostium and is recommended as the first view when left main disease is suspected, starting with a small test injection. RAO views look down the barrel of the ostium and foreshorten it; caudal views, including the spider, overlap the ostium with the aortic cusp.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-rao-lm",
      stem: "Why are RAO projections poor for assessing the left main ostium?",
      options: [
        "The spine overlies the ostium in every RAO projection",
        "They look along the ostial axis, foreshortening it",
        "The diaphragm always obscures it in inspiration",
        "The circumflex overlaps the ostium and hides any lesion",
        "They deliver the highest operator dose of all views",
      ],
      answer: 1,
      explanation:
        "In RAO the beam runs down the barrel of the left main ostium, compressing it into a short dense segment where a stenosis can hide. Operator dose is highest in LAO cranial, not RAO, so that option is a distractor.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-septal-sign",
      stem: "In a cranial view you see a vessel giving off several branches. During systole these branches remain straight and do not shorten. What does this tell you?",
      options: [
        "They are diagonal branches, so the parent vessel is a diagonal",
        "They are septal perforators, so the parent vessel is the LAD",
        "They are obtuse marginals",
        "They are collaterals from the RCA",
        "They are acute marginals",
      ],
      answer: 1,
      explanation:
        "Septal perforators run inside the septum and do not twist or shorten in systole; branches on the epicardial surface, such as those of a diagonal, do. Straight, non-shortening branches therefore identify the parent vessel as the LAD.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-occluded-lad",
      stem: "In LAO cranial, septal branches arise on one side and diagonal branches on the other, but no vessel runs between them. What is the most likely explanation?",
      options: ["Normal appearance in LAO cranial", "Occluded LAD", "Myocardial bridge", "Anomalous LAD origin from the right sinus", "Foreshortening of the LAD"],
      answer: 1,
      explanation:
        "LAO cranial separates the septals and diagonals on either side of the LAD. Seeing both families with no parent vessel between them confirms that the LAD itself is not filling. Foreshortening shortens a vessel but does not make it disappear while its branches remain.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-vertical-heart",
      stem: "In a tall, thin patient with emphysema, the spider view shows the LAD and LCx origins overlapping despite steep caudal tilt. What is the best next view of the distal left main?",
      options: [
        "An even steeper LAO caudal with more tilt",
        "A cranial view such as AP or LAO cranial",
        "RAO caudal with more RAO rotation added",
        "A true left lateral at 90 degrees",
        "RAO straight only, with no added tilt",
      ],
      answer: 1,
      explanation:
        "In a vertical heart the caudal beam runs along the bifurcation, so caudal views foreshorten and overlap the origins; cranial views become orthogonal to it. Steeper caudal tilt makes the overlap worse.",
      difficulty: 3,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-crux",
      stem: "In LAO straight the distal RCA bifurcation is overlapped and the PDA origin cannot be assessed. Which view is most likely to open it?",
      options: [
        "RAO 30 straight",
        "AP or LAO cranial",
        "LAO caudal (spider)",
        "RAO caudal 20–30°",
        "Left lateral at 90°",
      ],
      answer: 1,
      explanation:
        "Cranial angulation lifts the distal RCA off the diaphragm and separates the PDA from the posterolateral branches at the crux. It foreshortens the mid RCA, which is why LAO straight plus a cranial view make a complementary pair. RAO foreshortens the crux.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-views-rca-ostium",
      stem: "Which is the best view of the RCA ostium, and what should you try if it remains unclear?",
      options: [
        "RAO 30; then RAO caudal to open the ostium",
        "LAO; then a steeper LAO (40–45°) or LAO caudal",
        "AP cranial; then LAO cranial with more tilt",
        "Left lateral; then RAO cranial to show the origin",
        "RAO 30; then a true left lateral projection",
      ],
      answer: 1,
      explanation:
        "LAO is orthogonal to both coronary ostia, so it is the reference view for the RCA ostium; a steeper LAO or adding caudal tilt is the usual correction. Cranial views open the crux but foreshorten the proximal RCA, so ostial disease is easily missed in them.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-border",
      stem: "In a left coronary view, one large vessel runs along the edge of the cardiac silhouette and another runs down the middle of the heart shadow towards the apex. Which is more likely to be the LAD?",
      options: [
        "The vessel on the border",
        "The vessel in the middle of the heart shadow",
        "Either; position gives no information",
        "Neither; both must be marginals",
        "The one that is larger",
      ],
      answer: 1,
      explanation:
        "Arteries on the border of the silhouette are usually diagonals or obtuse marginals; the LAD stays within the heart shadow as it runs to the apex. Size is unreliable, because a large diagonal can be bigger than a diseased LAD, which is exactly how the RAO caudal trap arises.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-views-operator-dose",
      stem: "Which standard projection usually gives the operator the highest scatter radiation dose?",
      options: ["RAO caudal", "AP caudal", "LAO cranial", "RAO 30", "AP"],
      answer: 2,
      explanation:
        "In LAO cranial the X-ray tube is on the operator's side of the patient and the steep angle increases the tissue the beam must cross, so scatter towards the operator's head and torso is greatest. RAO views put the tube on the far side, reducing operator scatter.",
      difficulty: 2,
      refs: ["supplied-eh-views", "radiation-consensus-2018"],
    },
    {
      id: "dx-q-views-foreshortening",
      stem: "A segment of the mid LAD looks unusually short and densely opacified in one view. What is the most likely explanation, and what should you do?",
      options: [
        "A coronary aneurysm; arrange CT angiography to measure it",
        "Foreshortening; change the angle and add a near-orthogonal view",
        "Thrombus; give a glycoprotein IIb/IIIa inhibitor and repeat the run",
        "Heavy calcification; proceed to intravascular imaging to size it",
        "Normal tapering of the LAD; no further action is needed",
      ],
      answer: 1,
      explanation:
        "When the beam runs along a segment, the overlapping contrast columns add up and the segment looks short and dense; a stenosis can hide there. Changing the angulation and adding a second view resolves it. An aneurysm is a widening of the lumen, not a short dense segment.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "views", task: "Work through every standard LCA and RCA preset and, for each, name the segment it shows best and the segment it foreshortens." },
    { sim: "cathlab", task: "Acquire a full left study (RAO caudal, shallow RAO cranial, LAO cranial, spider) and correct any view in which the LAD and LCx overlap." },
  ],
  caseIds: ["dx-case-left-main", "dx-case-smooth-rca"],
};

// ---------------------------------------------------------------------------
// Module 5 — Interpretation
// ---------------------------------------------------------------------------
const mInterpretation: Module = {
  id: "dx-interpretation",
  title: "Reading the angiogram: stenosis, flow and morphology",
  stage: 2,
  summary:
    "Grading stenoses and knowing the limits of visual estimation, describing flow with TIMI grades and myocardial blush, recognising thrombus, calcium, dissection and ectasia, and deciding when to add physiology or imaging.",
  objectives: [
    "Grade stenosis severity in diameter terms, relate it to area stenosis, and apply the usual thresholds for significance, including the left main.",
    "Explain why a lesion must be seen in at least two near-orthogonal views and list the causes of under- and over-estimation.",
    "Assign TIMI flow grades and describe myocardial blush and its meaning.",
    "Recognise thrombus, calcification, ulceration, dissection, ectasia and spasm, and know when to add a pressure wire or intracoronary imaging.",
  ],
  lessons: [
    {
      id: "dx-int-stenosis",
      title: "Grading stenosis and its limits",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "An angiogram is a luminogram: a shadow of the contrast column. It shows how much the lumen is narrowed, not how much plaque is in the wall. Two arteries with the same lumen can carry very different plaque burdens, and early in disease arteries remodel outwards so that the lumen is preserved even when plaque occupies a substantial part of the vessel (approximately 40% of the area within the internal elastic lamina in classic pathology work). A 'normal' angiogram therefore does not mean a normal artery.",
        },
        {
          kind: "formula",
          name: "Percentage diameter stenosis",
          expr: "%DS = (1 − MLD / RVD) × 100",
          note: "MLD = minimal lumen diameter; RVD = reference vessel diameter, taken from the nearest normal-looking segment (usually proximal). In diffusely diseased vessels the reference is itself narrowed, so %DS underestimates the disease.",
        },
        {
          kind: "formula",
          name: "Diameter versus area stenosis (circular, concentric lesion)",
          expr: "%AS = [1 − (1 − %DS/100)²] × 100",
          note: "A 50% diameter stenosis is about a 75% area stenosis; a 70% diameter stenosis is about a 91% area stenosis.",
        },
        {
          kind: "table",
          caption: "Visual grading (schemes differ slightly between sources)",
          head: ["Category", "Diameter stenosis", "Comment"],
          rows: [
            ["Normal / minimal", "0 to under 25%", "Luminal irregularities only"],
            ["Mild", "About 25–49%", "Rarely flow-limiting"],
            ["Moderate (intermediate)", "About 50–69%", "Grey zone: physiology often needed"],
            ["Severe", "70–99%", "Usually flow-limiting outside the left main"],
            ["Occlusion", "100%", "Describe the stump, length, collaterals and distal vessel"],
          ],
        },
        {
          kind: "p",
          text: "The Oxford handbook uses a simpler three-step scheme (mild up to 30%, moderate 30–70%, severe above 70%). Whichever you use, state it. The conventional thresholds for an angiographically significant lesion are a diameter stenosis of 70% or more in a major epicardial vessel and 50% or more in the left main stem.",
        },
        { kind: "h", text: "Why visual grading misleads" },
        {
          kind: "list",
          items: [
            "Observer variability: differences of around 20 percentage points between and within observers are common, worst for moderate lesions.",
            "Diffuse disease: a diseased reference segment makes a focal stenosis look milder than it is.",
            "Eccentric lesions: an oval lumen looks tight in one view and mild in another. Grade the lesion in the view in which it looks worst; a single view systematically underestimates.",
            "Foreshortening and overlap: a lesion hidden between overlapping contrast columns, or behind a crossing branch, is simply not seen.",
            "Streaming: an injection that is too weak or too small mixes contrast with unopacified blood and creates or hides apparent lesions.",
            "Catheter-tip spasm: mimics ostial disease.",
            "Quantitative coronary angiography (QCA) is more reproducible than the eye but is prone to artefact from branches, bends, overlap and poor opacification.",
          ],
        },
        { kind: "h", text: "Length and lesion character" },
        {
          kind: "p",
          text: "Measure length in a view that does not foreshorten the segment. A practical internal ruler is a device of known length in the artery: the radio-opaque tip of many coronary wires is about 30 mm long, and a deflated balloon has known marker spacing. Describe the lesion fully, because complexity drives the treatment decision.",
        },
        {
          kind: "table",
          caption: "ACC/AHA lesion types (simplified)",
          head: ["Type", "Typical features"],
          rows: [
            ["A", "Discrete (under 10 mm), smooth, in a straight segment, little or no calcium, no major branch involvement, no thrombus"],
            ["B", "Tubular (10–20 mm), moderate tortuosity or angulation, moderate calcium, ostial location, bifurcation needing two wires, some thrombus"],
            ["C", "Diffuse (over 20 mm), very tortuous, side branches that cannot be protected, degenerated vein grafts, chronic total occlusions"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Angiography measures lumen, not plaque; positive remodelling hides early disease.",
            "Significant: 70% or more in an epicardial vessel; 50% or more in the left main.",
            "Every lesion needs at least two near-orthogonal views; grade it where it looks worst.",
            "Diffuse disease, eccentricity, foreshortening, streaming and spasm all distort the estimate.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Image a mid LAD lesion in RAO cranial and LAO cranial; estimate the diameter stenosis in each and report the more severe value.",
        },
        {"kind": "cine", "run": "p11_v16", "showBoxes": true, "caption": "Real right coronary run with the expert's lesion boxes (CADICA label 90–98%) shown on the keyframes. Compare your visual estimate with the label before turning the boxes off."},
        {"kind": "drill", "target": "angio-real", "drill": "estimate", "task": "Estimate stenosis severity in percent and compare with the expert category and the published spread between observers."},
        {"kind": "drill", "target": "angio-real", "drill": "locate", "task": "Find the lesion: click it on a keyframe, or say there is none, then grade it."},
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "hanna-pcm", "glagov-remodelling-1987"],
    },
    {
      id: "dx-int-flow",
      title: "Flow: TIMI grades and myocardial blush",
      minutes: 7,
      blocks: [
        {
          kind: "p",
          text: "Flow is graded using the TIMI scale, introduced in the thrombolysis trials and now used in every report and every primary PCI. Grade the vessel you are describing, and compare its filling and clearance with a normal vessel in the same patient.",
        },
        {
          kind: "table",
          caption: "TIMI flow grades",
          head: ["Grade", "Description", "In plain words"],
          rows: [
            ["TIMI 0", "No antegrade flow beyond the point of occlusion", "Nothing gets past"],
            ["TIMI 1", "Contrast passes the obstruction but does not opacify the whole distal bed during the run", "Penetration without perfusion"],
            ["TIMI 2", "The whole distal vessel opacifies, but filling and/or clearance is slower than in a comparable normal vessel", "Gets there, slowly"],
            ["TIMI 3", "Normal, brisk filling and clearance of the whole distal vessel", "Normal flow"],
          ],
        },
        {
          kind: "p",
          text: "TIMI grade matters clinically. In STEMI, restoring TIMI 3 flow is the goal of reperfusion. In SCAD, TIMI 0–1 flow with ongoing ischaemia is one of the triggers for intervention, whereas TIMI 2–3 flow usually means conservative management. After any PCI the flow should be the same as or better than before.",
        },
        {
          kind: "p",
          text: "A more objective variant counts the cine frames contrast takes to reach a standard distal landmark (the TIMI frame count). It depends on the frame rate and is mostly a research tool, but the idea is useful: slow flow is a measurable delay, not an impression.",
        },
        { kind: "h", text: "Myocardial blush" },
        {
          kind: "p",
          text: "After the epicardial vessel has filled, a healthy microcirculation produces a brief ground-glass opacification of the myocardium in its territory, which then clears. This blush reflects tissue-level perfusion and is graded from 0 (none, or persistent staining) to 3 (normal). An epicardial artery with TIMI 3 flow but absent blush indicates microvascular obstruction: the vessel is open but the muscle is not perfused. To judge blush, keep recording well into washout and do not pan, so that densities can be compared frame to frame.",
        },
        { kind: "h", text: "Causes of slow flow" },
        {
          kind: "table",
          head: ["Cause", "Clue"],
          rows: [
            ["Severe proximal stenosis or thrombus", "Visible lesion; slow filling beyond it"],
            ["Microvascular obstruction (no-reflow)", "Open vessel after PCI with slow flow and poor blush"],
            ["Coronary microvascular dysfunction", "Slow flow in smooth vessels; consider specialist testing"],
            ["Ectasia", "Dilated vessel with sluggish, swirling contrast"],
            ["Spasm or dissection", "Changes with nitrate; intimal flap or staining"],
            ["Distal embolisation", "Abrupt distal cut-offs"],
            ["Technique: small catheter, weak injection, damped catheter", "All vessels look slow; improves with a better injection"],
            ["Systemic: hypotension, very high LV filling pressure", "Global slow flow"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Calling TIMI 2 flow from a weak injection through a 4 F catheter.",
            "Panning during the run, which makes blush impossible to grade.",
            "Comparing flow with a non-comparable vessel (for example a small LCx against a large LAD).",
            "Stopping the run before the distal bed has filled or cleared.",
          ],
        },
        {"kind": "cine", "run": "cdm-00008-RCA-5", "caption": "Real right coronary run labelled 'occlusion in RCA' by the dataset. Look for where the contrast column stops and whether any distal vessel fills."},
        {"kind": "cine", "run": "cdm-00883-LCA-1", "caption": "Real left coronary run labelled 'collaterals' by the dataset. Keep watching late in the run for retrograde filling of the right coronary territory."},
        {"kind": "drill", "target": "angio-real", "drill": "occlusion", "task": "Decide whether the RCA is occluded on real runs, with equal numbers of occluded and patent vessels."},
      ],
      refs: ["timi-1985", "supplied-medmastery", "supplied-eh-views", "esc-acs-2023", "hanna-pcm", "vanthof-mbg-1998", "gibson-tfc-1996"],
    },
    {
      id: "dx-int-morphology",
      title: "Thrombus, calcium, dissection, ectasia and when to add physiology or imaging",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Beyond percentage stenosis, a report must describe what the lesion is made of and what it is doing. Several features are best seen in the first frames of a run, or before any contrast at all.",
        },
        {
          kind: "table",
          caption: "Lesion features",
          head: ["Feature", "Angiographic signs", "Traps"],
          rows: [
            ["Thrombus", "Intraluminal filling defect outlined by contrast; haziness; abrupt cut-off with a convex (meniscus) edge; contrast lingering at the lesion", "Air bubbles; streaming; eccentric plaque mistaken for layered thrombus"],
            ["Calcification", "Radio-opacities that move with the heart and are visible before contrast; parallel 'tramlines' along both walls", "Missed if you inject at once: pause on fluoroscopy first. Heavy calcium predicts poor balloon and stent expansion"],
            ["Ulceration", "A crater or outpouching of contrast beyond the expected lumen contour", "Overlapping branch origin"],
            ["Dissection", "Linear lucency or flap, contrast outside the lumen, persistent staining, spiral filling defect", "Graded A–F by the NHLBI scheme; may be spontaneous (SCAD) or iatrogenic"],
            ["Ectasia and aneurysm", "Ectasia: diffuse dilatation, commonly defined as at least 1.5 times the adjacent normal segment. Aneurysm: focal dilatation of similar degree", "Sluggish flow and thrombus formation; consider vasculitis (for example previous Kawasaki disease) in the young"],
            ["Spasm", "Focal or diffuse narrowing that resolves with intracoronary nitrate", "Catheter-tip spasm at the RCA ostium mimics ostial disease"],
            ["Total occlusion", "Tapered or blunt stump; bridging and distal collaterals; length of the occluded segment", "Collateral filling may make an occlusion look like a severe stenosis on a short run"],
          ],
        },
        {
          kind: "figure",
          id: "nhlbi-dissection",
          caption: "NHLBI dissection types A–F: from a minor radiolucency (A) through persistent staining (C) and spiral defects (D) to filling defects (E) and occlusion (F).",
        },
        { kind: "h", text: "The nitrate test" },
        {
          kind: "steps",
          items: [
            { title: "Check the pressure", detail: "Confirm an adequate blood pressure and no contraindication." },
            { title: "Give nitrate", detail: "Intracoronary glyceryl trinitrate; the supplied sources quote boluses of about 100–400 micrograms. Follow local protocol." },
            { title: "Repeat in the same projection", detail: "Use the same view and similar injection so the comparison is fair." },
            { title: "Interpret", detail: "A narrowing that resolves is spasm. One that persists is fixed disease or another non-atherosclerotic process such as SCAD." },
          ],
        },
        {
          kind: "p",
          text: "Some operators give nitrate routinely before diagnostic runs so that every vessel is seen fully dilated, which also helps vessel sizing if PCI follows. At a minimum, give it before calling any smooth or ostial narrowing fixed.",
        },
        { kind: "h", text: "When angiography is not enough" },
        {
          kind: "table",
          head: ["Situation", "Add", "Why"],
          rows: [
            ["Intermediate stenosis in a stable patient without concordant non-invasive evidence of ischaemia", "Pressure wire: FFR or a non-hyperaemic ratio such as iFR", "FAME: FFR-guided PCI (treating only lesions with FFR 0.80 or below) improved outcomes over angiographic guidance. DEFINE-FLAIR and iFR-SWEDEHEART: iFR (cut-off 0.89) was non-inferior to FFR"],
            ["Intermediate left main lesion", "IVUS (minimal lumen area; under about 6 mm² is a commonly used threshold in Western populations) or physiology", "Visual grading of the left main is particularly unreliable"],
            ["Ambiguous appearance: haziness, possible thrombus versus calcium versus dissection", "IVUS or OCT", "Shows what the lumen cannot"],
            ["Suspected SCAD with uncertain angiographic diagnosis", "Intracoronary imaging only if it will change management", "Instrumentation can extend the dissection"],
            ["Symptoms with no obstructive disease", "Consider testing for vasospastic or microvascular angina in experienced centres", "The 2024 ESC CCS guideline recognises these as common causes of angina"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Look before you inject: calcium is easiest to see on plain fluoroscopy.",
            "Thrombus is a filling defect outlined by contrast; a convex cut-off suggests fresh occlusion.",
            "Give nitrate before calling a narrowing fixed.",
            "Intermediate lesions are judged on physiology; ambiguous ones on imaging.",
          ],
        },
      ],
      refs: ["supplied-oxford", "supplied-medmastery", "supplied-eh-views", "nhlbi-dissection-1991", "fame-2009", "define-flair-2017", "ifr-swedeheart-2017", "esc-ccs-2024", "eapci-imaging-2018", "litro-2011"],
    },
  ],
  quiz: [
    {
      id: "dx-q-int-area",
      stem: "A concentric, circular lesion has a 50% diameter stenosis. Approximately what is the area stenosis?",
      options: ["25%", "50%", "75%", "90%", "100%"],
      answer: 2,
      explanation:
        "Area depends on the square of the diameter: (1 − 0.5)² = 0.25, so a quarter of the area remains and the area stenosis is about 75%. 50% is the tempting answer if you assume diameter and area stenosis are the same.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-int-lm-threshold",
      stem: "What is the conventional angiographic threshold for a significant left main stem stenosis?",
      options: ["30% diameter stenosis", "50% diameter stenosis", "70% diameter stenosis", "90% diameter stenosis", "Any visible plaque"],
      answer: 1,
      explanation:
        "A diameter stenosis of 50% or more in the left main is conventionally significant, compared with 70% or more in other major epicardial vessels, because of the large territory it supplies. Applying the 70% threshold to the left main would miss prognostically important disease.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-int-timi2",
      stem: "After primary PCI, contrast fills the entire distal LAD but takes noticeably longer to fill and clear than the normal LCx. What is the TIMI flow grade?",
      options: ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3", "It cannot be graded without a frame count"],
      answer: 2,
      explanation:
        "Complete opacification of the distal bed with delayed filling or clearance is TIMI 2. TIMI 1 would mean contrast passes the lesion but fails to opacify the whole distal vessel; TIMI 3 requires normal, brisk flow.",
      difficulty: 1,
      refs: ["timi-1985"],
    },
    {
      id: "dx-q-int-timi1",
      stem: "In an acute RCA occlusion, a faint thread of contrast passes the occlusion but never reaches the distal vessel during the run. What is the TIMI grade?",
      options: ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3", "Rentrop 1"],
      answer: 1,
      explanation:
        "Penetration beyond the obstruction without opacification of the whole distal bed is TIMI 1. TIMI 0 means no contrast passes at all. Rentrop grades describe collateral filling, not antegrade flow.",
      difficulty: 1,
      refs: ["timi-1985"],
    },
    {
      id: "dx-q-int-eccentric",
      stem: "A proximal LAD lesion looks like a 40% stenosis in RAO cranial and an 80% stenosis in LAO cranial. How should it be reported?",
      options: [
        "As 60%, the average of the two views",
        "As 40%, because RAO cranial elongates the LAD",
        "As 80%, the most severe view, noting that it is eccentric",
        "As non-diagnostic until QCA is performed",
        "As 40%, because the mildest view is least affected by overlap",
      ],
      answer: 2,
      explanation:
        "Eccentric lesions are graded in the view in which they look most severe; averaging or choosing the milder view systematically underestimates them. If the clinical significance remains uncertain, add physiology or imaging.",
      difficulty: 2,
      refs: ["supplied-medmastery", "supplied-oxford"],
    },
    {
      id: "dx-q-int-diffuse",
      stem: "In a diabetic patient with a diffusely diseased LAD, why does a focal stenosis often look milder than it is?",
      options: [
        "Diabetes causes coronary vasodilatation that masks the lesion",
        "The reference segment used for comparison is itself narrowed",
        "Diffuse disease increases contrast density across the narrowing",
        "The LAD is always foreshortened in diabetic patients",
        "Collaterals fill the lesion and make the lumen look wider",
      ],
      answer: 1,
      explanation:
        "Percentage stenosis compares the narrowest point with a 'normal' reference. When the whole vessel is narrowed, the reference is smaller than the true vessel size and the focal stenosis is underestimated.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-int-blush",
      stem: "After primary PCI the infarct artery has TIMI 3 flow, but there is no myocardial blush in its territory. What does this indicate?",
      options: [
        "Complete reperfusion at tissue level",
        "Microvascular obstruction despite an open epicardial artery",
        "Residual epicardial stenosis",
        "A technical artefact from a large injection",
        "Collateral competition",
      ],
      answer: 1,
      explanation:
        "Blush reflects tissue-level perfusion. Absent blush with TIMI 3 flow means the epicardial artery is open but the microvasculature is not perfusing the muscle. Residual epicardial stenosis would usually slow epicardial flow, not leave it at TIMI 3.",
      difficulty: 2,
      refs: ["supplied-medmastery", "vanthof-mbg-1998"],
    },
    {
      id: "dx-q-int-ffr",
      stem: "In the FAME trial, which FFR value was used as the threshold for treating a lesion with PCI?",
      options: ["0.75 or below", "0.80 or below", "0.89 or below", "0.90 or below", "0.95 or below"],
      answer: 1,
      explanation:
        "FAME treated lesions with FFR of 0.80 or below and showed better outcomes than angiography-guided PCI. 0.89 is the iFR cut-off used in DEFINE-FLAIR and iFR-SWEDEHEART, not the FFR threshold.",
      difficulty: 1,
      refs: ["fame-2009", "define-flair-2017"],
    },
    {
      id: "dx-q-int-calcium",
      stem: "What is the most reliable way to recognise coronary calcification during diagnostic angiography?",
      options: [
        "Look for haziness at the lesion after contrast",
        "Screen the vessel on fluoroscopy before injecting contrast",
        "Measure the pressure gradient",
        "Use the most caudal view",
        "Inject a larger contrast volume",
      ],
      answer: 1,
      explanation:
        "Calcium is visible as radio-opacities that move with the heart, best seen before contrast fills the lumen and hides them. Haziness after contrast is non-specific and may be thrombus, dissection or overlap.",
      difficulty: 1,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Grade the same lesion in two orthogonal views, assign TIMI flow, and decide whether the lesion needs a pressure wire." },
  ],
  caseIds: ["dx-case-scad"],
};

// ---------------------------------------------------------------------------
// Module 6 — Anatomy traps
// ---------------------------------------------------------------------------
const mAnatomy: Module = {
  id: "dx-anatomy-pitfalls",
  title: "Anatomy traps: RCA branches, collaterals, anomalies, spasm and SCAD",
  stage: 2,
  summary:
    "The RCA branches and how dominance shapes them, the acute marginal that impersonates the RCA, collateral pathways and grading, anomalous coronaries and bridges, and the long smooth narrowing that may be spasm or SCAD.",
  objectives: [
    "Identify the conus, SA nodal, acute marginal, AV nodal, PDA and posterolateral branches, with the usual probabilities of their origins.",
    "Distinguish a true dominant RCA from a large acute marginal branch, and explain why misidentification causes stent thrombosis.",
    "Describe the main collateral pathways, Kugel's and Vieussens' collaterals, and Rentrop grading with its timeline.",
    "Recognise common coronary anomalies, fistulae and myocardial bridging, and plan how to image them.",
    "Differentiate catheter-induced spasm, vasospasm and SCAD, classify SCAD angiographically and outline its management.",
  ],
  lessons: [
    {
      id: "dx-anat-rca-branches",
      title: "RCA branches and dominance",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "The RCA arises from the right sinus of Valsalva, anteriorly, and runs in the right atrioventricular (AV) groove to the crux of the heart, where the AV groove meets the posterior interventricular groove. In most people it ends there by dividing into the posterior descending artery (PDA) and posterolateral branches. It supplies the right ventricle, the inferior wall of the LV and the inferior third of the septum.",
        },
        {
          kind: "p",
          text: "Dominance is defined by which artery crosses the crux to give the PDA (and posterolateral branches). The Oxford handbook gives approximate figures of 85% right dominant, 8% left dominant (PDA from the LCx) and 7% co-dominant. Figures vary between sources because definitions vary.",
        },
        {
          kind: "figure",
          id: "coronary-tree",
          caption: "The left and right coronary systems: RCA branches from conus to PDA and posterolateral branches; the left main dividing into LAD and LCx.",
        },
        {
          kind: "table",
          caption: "RCA branches from proximal to distal",
          head: ["Branch", "Origin and course", "Territory", "Practical points"],
          rows: [
            ["Conus", "First branch, at or next to the ostium; has its own aortic ostium in about one third of people", "RV outflow tract", "Catheter over-selection damps the trace; injection can cause VF. Source of Vieussens' collateral"],
            ["SA nodal", "Usually the second branch; runs upward and backwards towards the SVC–right atrial junction. Arises from the proximal RCA in about 60% and the proximal LCx in about 40%", "Sinus node", "Origin does not depend on dominance"],
            ["Acute (RV) marginals", "From the mid RCA along the acute margin of the heart", "RV free wall", "Occluding an RV branch during PCI can produce ST elevation in V1–V2"],
            ["AV nodal", "From the distal RCA at the crux, just before or after the PDA origin; from the RCA in about 90% and the LCx in about 10%, following dominance", "AV node", "Small vessel heading upwards at the crux"],
            ["PDA", "From the crux, running in the posterior interventricular groove", "Inferior septum and inferior wall", "Gives septal branches from below"],
            ["Posterolateral branches", "Beyond the crux", "Inferolateral LV", "Extent depends on dominance"],
            ["Distal AV groove continuation", "Continues along the left AV groove when the LCx is short", "Territory usually supplied by the LCx", "Long slender distal vessel"],
          ],
        },
        { kind: "h", text: "Separating atrial from ventricular branches" },
        {
          kind: "p",
          text: "RAO looks along the AV groove, so branches leaving the RCA split cleanly to either side of it: atrial branches, such as the SA nodal artery, go to one side, and ventricular branches, such as the conus and acute marginals, go to the other. When you are unsure whether a branch is atrial or ventricular, take an RAO view.",
        },
        {
          kind: "keypoints",
          items: [
            "Conus first, SA nodal usually second.",
            "Conus: separate ostium in about a third, so it may not fill on a selective RCA injection.",
            "SA nodal artery: proximal RCA about 60%, proximal LCx about 40%, independent of dominance.",
            "AV nodal artery: RCA about 90%, LCx about 10%, following dominance.",
            "RAO separates atrial from ventricular branches.",
          ],
        },
        {
          kind: "pearl",
          text: "If an RCA injection seems to supply no inferior LV territory, check the LCx: either the patient is left dominant and the RCA is small, or the RCA is occluded and the true distal vessel is waiting to be found.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-angio-atlas", "supplied-medmastery"],
    },
    {
      id: "dx-anat-am-trap",
      title: "True RCA or acute marginal?",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "One of the most consequential errors in the lab is to mistake a large acute marginal branch for the distal RCA. It is not a subtle variant; it is a misreading of the angiogram. If you stent the marginal, the true RCA territory stays ischaemic and the stent sits in a vessel with limited run-off, which predisposes it to thrombosis.",
        },
        {
          kind: "steps",
          title: "Recognising the trap",
          items: [
            { title: "Look for two bends in LAO", detail: "A true dominant RCA bends twice: gently as it wraps round the acute margin, then sharply at the crux where it turns to give the PDA. An acute marginal runs a smooth, straight course with no sharp distal bend." },
            { title: "Treat smooth and straight as a marginal", detail: "A smooth, straight vessel in LAO is an acute marginal until proven otherwise." },
            { title: "Ask what is missing", detail: "Is there a PDA? Septal branches from below? Posterolateral branches? An AV nodal artery at the crux?" },
            { title: "Confirm in RAO", detail: "The marginal runs along the margin of the right ventricle. The true RCA stays in the AV groove and loops round to the back of the heart, bending at the crux before giving the PDA." },
            { title: "Check the left injection", detail: "Is the LCx dominant (so a small RCA ending in a marginal is normal)? Do collaterals fill a PDA or distal RCA (implying an occluded RCA)?" },
            { title: "Look for the stump", detail: "Scrutinise the mid RCA at the AV groove for a nub or abrupt cut-off." },
          ],
        },
        { kind: "h", text: "The low-lying acute marginal" },
        {
          kind: "p",
          text: "In about a quarter of patients a low-lying acute marginal runs along the RV margin and then wraps round the inferior surface of the right ventricle to supply part of the territory normally fed by the PDA. Recognising it matters when deciding whether a lesion in it could ever justify treatment.",
        },
        { kind: "h", text: "Should an acute marginal ever be treated?" },
        {
          kind: "p",
          text: "As a rule, PCI of RV marginal branches is avoided. The thin-walled right ventricle can raise its oxygen extraction considerably, has low microvascular resistance and recruits collaterals readily, so it tolerates branch disease well. When the RV is ischaemic, the cause is often raised RV pressure or dilatation (for example pulmonary hypertension), and treating that matters more than stenting a branch.",
        },
        {
          kind: "table",
          head: ["If", "Then"],
          rows: [
            ["Acute MI with cardiogenic shock from an occluded large acute marginal or non-dominant RCA", "PCI may be life-saving"],
            ["A low-lying marginal supplies significant LV territory, the patient has severe typical exertional angina not explained by other lesions, and FFR or iFR proves significant ischaemia", "PCI may be considered, as an exception"],
            ["Any other situation", "Leave the marginal alone"],
          ],
        },
        { kind: "h", text: "Two lessons in run-off" },
        {
          kind: "p",
          text: "The supplied notes describe two teaching cases. In the first, a woman in her late fifties with an inferior STEMI, recurrent VF and RV shock had a stent placed in what looked like the RCA; it thrombosed during the procedure. Review showed that a single straight acute marginal had been stented and the much larger true RCA had been missed. In the second, a man in his seventies with stable angina had a very long run of overlapping stents placed down the LAD, with the distal end landing in a tiny territory. Two days later the whole stented segment thrombosed and he had a large anterior MI. In both, the stent had too little outflow to stay open.",
        },
        {
          kind: "pitfalls",
          items: [
            "Accepting a smooth, straight vessel in LAO as the distal RCA without looking for the second bend.",
            "Not taking an RAO view when the branching is ambiguous.",
            "Landing a long stent in a small distal vessel with a tiny territory ('stenting towards the tip').",
            "Forgetting to look at the LCx for dominance and collaterals.",
          ],
        },
        {
          kind: "sim",
          sim: "views",
          task: "Use the RCA LAO and RCA RAO presets to trace the true RCA through both bends to the crux, and identify the acute marginal on the ventricular side of the AV groove.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-angio-atlas", "supplied-oxford"],
    },
    {
      id: "dx-anat-collaterals",
      title: "Collaterals: pathways, named channels and grading",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Coronary collaterals are pre-existing arterial connections that enlarge when the territory they link becomes ischaemic. They form between branches that are neighbours. Collaterals show you where the distal bed of an occluded artery lies, how it is fed, and which routes a retrograde CTO strategy might use. They do not by themselves prove that the muscle beyond is viable or protected from ischaemia.",
        },
        {
          kind: "table",
          caption: "The four main pathways",
          head: ["From", "To", "Route"],
          rows: [
            ["LAD septal branches", "RCA (PDA) septal branches", "Through the interventricular septum"],
            ["Distal LCx", "Distal AV groove continuation of the RCA", "Along the AV groove"],
            ["Distal obtuse marginals", "RCA posterolateral branches", "Across the lateral and inferior margin"],
            ["Distal apical LAD", "PDA", "Epicardial, round the apex"],
          ],
        },
        { kind: "h", text: "Named collaterals" },
        {
          kind: "list",
          items: [
            "Kugel's artery: a connection from an atrial branch (of the RCA or LCx) to the AV nodal artery, running through the atrial septum. Classically seen with mid-RCA occlusions, filling the distal RCA from behind.",
            "Vieussens' ring: a connection between the conus artery and the mid LAD. It works in both directions, filling an occluded LAD from the conus or an occluded proximal RCA from the LAD.",
          ],
        },
        {
          kind: "p",
          text: "Vieussens' collateral explains a puzzle: an occluded proximal LAD, a normal anterior wall on echo, and no collaterals visible from the LCx or the RCA. Because the conus has a separate ostium in about a third of people, a selective RCA injection can miss it entirely. Perform a non-selective puff in the right sinus at the RCA ostium, or engage the conus selectively by aiming the catheter a little more anteriorly and superiorly. This is the one time you go looking for the conus rather than backing out of it.",
        },
        {
          kind: "table",
          caption: "Rentrop grading of collateral filling",
          head: ["Grade", "Appearance of the recipient artery"],
          rows: [
            ["0", "No collateral filling"],
            ["1", "Filling of side branches of the recipient artery only; the main epicardial segment is not seen"],
            ["2", "Partial, faint filling of the epicardial segment, not clearly delineated"],
            ["3", "Complete filling of the epicardial segment, clearly delineated"],
          ],
        },
        {
          kind: "p",
          text: "A second scheme grades the size of the connecting channel itself: CC0 (no continuous connection), CC1 (thread-like) and CC2 (side-branch-like, larger channels). Large mature channels can take months to develop.",
        },
        { kind: "h", text: "How quickly collaterals appear" },
        {
          kind: "table",
          head: ["Time after occlusion", "Typical appearance (supplied notes)"],
          rows: [
            ["Within 24 hours", "About half of patients have some collateral filling, usually grade 1–2"],
            ["After the first day to a few days", "Nearly all have some collateral filling"],
            ["After about 2 weeks", "Well-developed grade 3 collaterals begin to appear"],
          ],
        },
        {
          kind: "p",
          text: "The timeline helps date an occlusion. Faint grade 1 filling hours into a STEMI is expected; brisk grade 3 filling of the distal vessel suggests an occlusion weeks old or more, such as a chronic total occlusion with a separate culprit elsewhere.",
        },
        { kind: "h", text: "Filming collaterals" },
        {
          kind: "list",
          items: [
            "Record long runs and keep going until the recipient vessel has filled; collateral filling is late.",
            "Ask the radiographer to pan to the distal bed.",
            "Inject both coronaries in every occlusion, whether or not you expect collaterals; for CTO planning, simultaneous dual injection through two catheters shows the occluded segment and both ends.",
          ],
        },
        {
          kind: "pearl",
          text: "Occluded proximal LAD, normal anterior wall, no visible collaterals: suspect a Vieussens' collateral from a separately arising conus, and puff the right sinus.",
        },
      ],
      refs: ["supplied-eh-views", "rentrop-1985", "supplied-oxford", "supplied-medmastery", "werner-collaterals-2003"],
    },
    {
      id: "dx-anat-anomalies",
      title: "Coronary anomalies, fistulae and myocardial bridging",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Anomalous coronary arteries are found in roughly 1–2% of angiograms. They matter because some cause ischaemia or sudden death, and because an unrecognised anomaly can be mistaken for an occlusion or injured at surgery. The commonest variants, separate LAD and LCx ostia in the left sinus and an anterior or high RCA origin, are frequent enough to be regarded as normal variants.",
        },
        {
          kind: "table",
          caption: "Anomalies to know",
          head: ["Anomaly", "Angiographic clues", "Significance", "Imaging and engagement"],
          rows: [
            ["Separate LAD and LCx ostia", "Left injection fills only one vessel", "Benign", "Engage each ostium (catheter size or rotation)"],
            ["LCx from the right sinus or proximal RCA (commonest true anomaly, about 0.2–0.7%)", "No vessel supplies the lateral wall on left injection (the 'missing circumflex'); faint LCx filling on RCA injection; on an RAO ventriculogram the vessel may be seen end-on behind the aorta as a 'dot'", "Usually a benign retro-aortic course, but ostial disease occurs", "Non-selective right sinus injection; Amplatz or multipurpose shapes; aortogram"],
            ["RCA from the left sinus", "No RCA from the right sinus; left sinus injection shows it", "Risk if the course is between the aorta and pulmonary trunk", "Amplatz Left or similar; CT to define the course"],
            ["Left main from the right sinus", "No left coronary in the left sinus", "Interarterial course is the highest-risk anomaly", "CT; surgical review"],
            ["Interarterial course (between aorta and pulmonary trunk)", "Inferred from the origin and confirmed on CT", "Compression during exertion can cause ischaemia, arrhythmia and sudden death", "CT coronary angiography is the best way to define the course"],
            ["Coronary fistula", "Contrast drains into a chamber, the pulmonary artery or the coronary sinus; dilated, tortuous feeding artery", "Steal, volume load", "RAO: atrium or ventricle? LAO: right or left side?"],
            ["Anomalous left coronary from the pulmonary artery (rare in adults)", "Large, collateral-rich RCA filling the left system, with contrast draining into the pulmonary artery", "Ischaemia, LV dysfunction", "Specialist congenital assessment"],
          ],
        },
        { kind: "h", text: "Finding a missing artery" },
        {
          kind: "steps",
          items: [
            { title: "Notice the absence", detail: "The commonest error is failing to see that a whole territory, such as the lateral wall, has no supply on the left injection." },
            { title: "Search during other injections", detail: "Look for faint filling of the missing vessel on the RCA run and in the sinuses." },
            { title: "Locate the ostium", detail: "Non-selective sinus injections or an aortogram show where it arises." },
            { title: "Engage selectively", detail: "Standard Judkins shapes may succeed, but Amplatz or multipurpose catheters often reach unusual ostia better." },
            { title: "Define the course", detail: "CT coronary angiography shows whether the course is interarterial, retro-aortic, prepulmonic or intraseptal." },
          ],
        },
        { kind: "h", text: "Myocardial bridging" },
        {
          kind: "p",
          text: "A bridge is a segment of an epicardial artery, most often the mid LAD, that dips into the myocardium. In systole the overlying muscle squeezes it, so the segment narrows ('milking') and then reopens in diastole. The key to recognising it is timing: a fixed stenosis looks the same throughout the cardiac cycle, whereas a bridge changes with each beat. Nitrate tends to accentuate the systolic narrowing. Most bridges are incidental; stenting a bridge is generally avoided because of the risks of stent fracture and perforation.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling the LCx 'occluded' when it arises anomalously from the right side.",
            "Measuring a stenosis in a systolic frame of a bridged segment.",
            "Probing repeatedly for an anomalous ostium instead of taking an aortogram.",
          ],
        },
      ],
      refs: ["supplied-oxford", "supplied-eh-views", "hanna-pcm"],
    },
    {
      id: "dx-anat-spasm-scad",
      title: "Spasm and spontaneous coronary artery dissection",
      minutes: 10,
      blocks: [
        { kind: "h", text: "Spasm" },
        {
          kind: "table",
          head: ["Type", "Features", "Response"],
          rows: [
            ["Catheter-induced", "Tight narrowing exactly at the catheter tip, most often at the RCA ostium; the trace ventricularises and then falls", "Withdraw the catheter slightly and give intracoronary nitrate; do not push on or inject more"],
            ["Spontaneous vasospasm", "Rest angina, transient ST elevation, cocaine use; focal or diffuse narrowing that resolves with nitrate", "Nitrate; consider formal provocation testing in experienced centres"],
          ],
        },
        {
          kind: "p",
          text: "In a patient with an inferior MI after cocaine use, a severe mid-RCA narrowing can melt away after intracoronary nitrate to reveal only mild plaque. Without the nitrate test, the narrowing would have been called fixed and stented. Before diagnosing any smooth narrowing as fixed, give nitrate and repeat the run in the same view.",
        },
        { kind: "h", text: "Spontaneous coronary artery dissection (SCAD)" },
        {
          kind: "p",
          text: "SCAD is a non-atherosclerotic cause of ACS in which bleeding into the vessel wall forms an intramural haematoma that compresses the true lumen. It mainly affects women, including during pregnancy and the post-partum period, but about one in ten cases occurs in men, often after intense physical exertion. Fibromuscular dysplasia is found in a large proportion of patients (up to about 70% in the supplied notes). Recognising SCAD matters because the treatment is different: unnecessary instrumentation can turn a self-healing lesion into a catastrophe.",
        },
        {
          kind: "table",
          caption: "Angiographic classification of SCAD",
          head: ["Type", "Appearance"],
          rows: [
            ["Type 1", "Visible intimal flap or double lumen, with contrast staining of the vessel wall"],
            ["Type 2", "Long, diffuse, smooth narrowing caused by intramural haematoma. Type 2A: normal calibre resumes beyond the haematoma. Type 2B: the narrowing runs to the tip of the vessel"],
            ["Type 3", "Focal or tubular narrowing that mimics atherosclerosis; usually needs intracoronary imaging to diagnose"],
          ],
        },
        {
          kind: "list",
          items: [
            "Long lesion (over about 20–30 mm), smooth, without irregular plaque or calcium.",
            "Tortuous vessels, often with smooth narrowing elsewhere.",
            "Usually mid to distal segments; the LAD is the commonest artery involved.",
            "No atherosclerosis in the other vessels.",
          ],
        },
        { kind: "h", text: "Long smooth narrowing: the differential" },
        {
          kind: "steps",
          items: [
            { title: "Think spasm first", detail: "Give intracoronary nitrate (the supplied notes suggest 200–400 micrograms, with verapamil as an option) and repeat in the same view." },
            { title: "If it persists, think SCAD type 2", detail: "Supported by a woman of young or middle age, a long smooth lesion, no response to nitrate and no calcium." },
            { title: "Diffuse atherosclerosis is least likely", detail: "Especially in a young patient with otherwise normal arteries." },
          ],
        },
        { kind: "h", text: "Management principles" },
        {
          kind: "table",
          head: ["Situation", "Approach"],
          rows: [
            ["TIMI 2–3 flow, no ongoing ischaemia, haemodynamically stable", "Conservative: most SCAD heals. Admit for monitoring for several days, because extension occurs early. Medical therapy per local SCAD protocol (beta-blockade is commonly used; the antiplatelet strategy is debated)"],
            ["Ongoing ischaemia or STEMI with TIMI 0–1 flow, or haemodynamic instability", "Revascularise to save myocardium"],
            ["Left main or proximal multivessel involvement", "Consider CABG, particularly if PCI is unfavourable or fails"],
          ],
        },
        {
          kind: "p",
          text: "PCI in SCAD has high rates of technical failure and complications, mainly propagation of the haematoma. When it is necessary, keep it minimal: wire gently with a soft workhorse wire, confirm that the wire is in the true lumen, restore flow with low-pressure inflation of an undersized balloon, and avoid stenting if flow is re-established.",
        },
        {
          kind: "p",
          text: "On IVUS, the intramural haematoma appears as a dark crescent behind the true lumen, with the imaging catheter in the true lumen. During CTO crossing in the subintimal space the picture is reversed: the catheter sits in the dark space and the compressed true lumen appears as a bright collapsed structure. Avoid routine IVUS or OCT when the angiographic diagnosis of SCAD is clear, because instrumentation can extend the dissection (one supplied source quotes about 8%). Even when the vessel is occluded, making the diagnosis matters, because it changes the PCI strategy, the medical therapy, the prognosis and the follow-up.",
        },
        {
          kind: "keypoints",
          items: [
            "Give nitrate before diagnosing SCAD or fixed disease.",
            "Stable SCAD with preserved flow: leave it alone.",
            "Occlusive SCAD with ongoing infarction: minimalist PCI.",
            "Screen for fibromuscular dysplasia; document healing with non-invasive imaging such as CT rather than repeat invasive angiography.",
          ],
        },
        {
          kind: "pearl",
          text: "An apical STEMI can mimic pericarditis with widespread ST elevation. ST elevation in V1, ST segments as tall as the QRS, and a maximum in V2–V4 rather than in II and V5–V6 point to infarction. A very distal LAD occlusion, sometimes from SCAD, is a common culprit.",
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "scad-esc-2018", "scad-saw-2014", "esc-ccs-2024"],
    },
  ],
  quiz: [
    {
      id: "dx-q-anat-conus",
      stem: "Why can a selective RCA injection fail to show the conus artery?",
      options: [
        "The conus arises from the LAD in most people, not the RCA",
        "It has a separate aortic ostium in about one third of people",
        "The conus is always occluded by adulthood and does not fill",
        "The conus fills only in diastole, after the run has ended",
        "The conus is too small to be seen at angiographic resolution",
      ],
      answer: 1,
      explanation:
        "In roughly a third of people the conus arises from its own ostium in the right sinus, so a catheter seated in the RCA does not fill it. This is why Vieussens' collaterals from the conus can be missed. It does not arise from the LAD, although it can connect to the LAD through Vieussens' ring.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-anat-avn",
      stem: "In approximately what proportion of people does the AV nodal artery arise from the RCA?",
      options: ["About 30%", "About 50%", "About 60%", "About 90%", "100%"],
      answer: 3,
      explanation:
        "The AV nodal artery arises from the dominant artery at the crux: the RCA in about 90% and the LCx in about 10%. About 60% is the figure for the SA nodal artery arising from the RCA, which is the tempting confusion.",
      difficulty: 1,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-anat-sa",
      stem: "Which statement about the SA nodal artery is correct?",
      options: [
        "It always arises from the dominant coronary artery",
        "It arises from the proximal RCA in about 60% and the LCx in about 40%",
        "It is always the first branch of the right coronary artery",
        "It runs anteriorly towards the right ventricular outflow tract",
        "It arises from the distal RCA at the crux, close to the origin of the AV nodal artery",
      ],
      answer: 1,
      explanation:
        "The SA nodal artery arises proximally from either the RCA (about 60%) or the LCx (about 40%), independent of dominance, and is usually the second RCA branch, running towards the SVC and right atrium. The conus, not the SA nodal artery, is the first branch and heads to the outflow tract.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-anat-two-bends",
      stem: "In an inferior STEMI, the RCA in LAO gives a large vessel that runs smoothly and straight down the acute margin with no sharp bend at the crux, and no PDA is seen. What is the most appropriate next step?",
      options: [
        "Stent the narrowest point of this vessel, which is the likely culprit",
        "Treat it as an acute marginal: take RAO and look for the true RCA and collaterals",
        "Conclude the patient is left dominant and stop, since no PDA arises from this vessel",
        "Give thrombolysis in the lab, because no culprit can be seen on this injection",
        "Perform a ventriculogram to localise the infarct before any further coronary views",
      ],
      answer: 1,
      explanation:
        "A true dominant RCA bends twice in LAO, the second time sharply at the crux. A smooth straight vessel is an acute marginal until proven otherwise; RAO and the left injection usually reveal an occluded true RCA. Assuming left dominance without checking the LCx is how the true culprit is missed.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-anat-vieussens",
      stem: "A patient has an occluded proximal LAD but normal anterior wall motion. Neither the LCx nor the selective RCA injection shows collaterals to the LAD. What is the best next step?",
      options: [
        "Proceed to CTO PCI of the LAD now, without any further imaging of the right coronary system",
        "Inject in the right sinus, or engage the conus, to look for a Vieussens' collateral",
        "Perform a ventriculogram to confirm the anterior wall motion before deciding",
        "Repeat the left coronary injection with a larger volume and a longer run",
        "Measure FFR in the RCA to see whether it could support collaterals",
      ],
      answer: 1,
      explanation:
        "A viable anterior wall with no visible collaterals suggests a Vieussens' collateral from a conus artery with a separate ostium, which a selective RCA injection misses. A puff in the right sinus or selective conus engagement shows it. A larger LCA injection will not reveal a channel that arises from the right sinus.",
      difficulty: 3,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-anat-kugel",
      stem: "What does Kugel's artery connect?",
      options: [
        "The conus artery and the mid LAD",
        "An atrial branch and the AV nodal artery, through the atrial septum",
        "The distal LAD and the PDA round the apex",
        "The LIMA and the LAD",
        "The obtuse marginals and the posterolateral branches",
      ],
      answer: 1,
      explanation:
        "Kugel's artery runs from an atrial branch of the RCA or LCx through the atrial septum to the AV nodal artery, typically filling the distal RCA in mid-RCA occlusion. The conus-to-LAD connection is Vieussens' ring.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-anat-rentrop",
      stem: "In a patient with an occluded RCA, collaterals from the LAD faintly fill the main PDA, which is visible but not clearly delineated. What is the Rentrop grade?",
      options: ["Grade 0", "Grade 1", "Grade 2", "Grade 3", "CC2"],
      answer: 2,
      explanation:
        "Faint, partial filling of the epicardial recipient vessel is Rentrop grade 2. Grade 1 is filling of side branches only, without the main vessel; grade 3 is complete, clear filling. CC grades describe the size of the connecting channel, not the filling of the recipient.",
      difficulty: 2,
      refs: ["rentrop-1985", "supplied-eh-views", "werner-collaterals-2003"],
    },
    {
      id: "dx-q-anat-dot",
      stem: "A left coronary injection shows no vessel supplying the lateral wall. On the RAO ventriculogram a small round opacity is seen behind the aortic root. What is the most likely diagnosis?",
      options: [
        "Occluded LCx",
        "Anomalous LCx arising from the right side with a retro-aortic course",
        "Myocardial bridge",
        "Coronary fistula to the left atrium",
        "Left main from the right sinus with interarterial course",
      ],
      answer: 1,
      explanation:
        "A 'missing' circumflex and the 'dot sign' (the anomalous vessel seen end-on behind the aorta) indicate an LCx arising from the right sinus or RCA and passing behind the aorta. Calling it occluded is the classic error; look for it on the RCA injection and in the right sinus.",
      difficulty: 3,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-anat-interarterial",
      stem: "Which course of an anomalous coronary artery carries the highest risk of sudden death?",
      options: [
        "Retro-aortic, behind the aortic root",
        "Prepulmonic, anterior to the pulmonary trunk",
        "Interarterial, between aorta and pulmonary trunk",
        "Intraseptal, within the ventricular septum",
        "Retro-cardiac, behind the heart to the AV groove",
      ],
      answer: 2,
      explanation:
        "An interarterial course exposes the vessel to compression between the great arteries during exertion, causing ischaemia, arrhythmia and sudden death; it is most dangerous when the left main arises from the right sinus. A retro-aortic course, typical of an anomalous LCx, is usually benign.",
      difficulty: 2,
      refs: ["supplied-oxford"],
    },
    {
      id: "dx-q-anat-scad-first",
      stem: "A 37-year-old woman with NSTEMI has a 40 mm smooth, tapering narrowing of the mid LAD with tortuous coronaries and no calcium. What is the first step?",
      options: [
        "Predilate and stent the lesion with a long stent",
        "Intracoronary nitrate and a repeat run in the same view",
        "OCT straight away to confirm an intramural haematoma",
        "Intravenous thrombolysis for presumed thrombus",
        "Pressure-wire assessment to decide on revascularisation",
      ],
      answer: 1,
      explanation:
        "The top differential for a long smooth narrowing is vasospasm, so give nitrate first. If the narrowing persists, SCAD type 2 becomes the leading diagnosis. Routine OCT is avoided when the angiographic diagnosis is clear, because instrumentation can extend a dissection; stenting a possible SCAD lesion is the most harmful choice.",
      difficulty: 2,
      refs: ["supplied-eh-views", "scad-esc-2018"],
    },
    {
      id: "dx-q-anat-scad-mgmt",
      stem: "A woman with SCAD type 2A of the mid LAD is pain free with TIMI 3 flow and no ongoing ST elevation. What is the best management?",
      options: [
        "PCI with a long drug-eluting stent to prevent extension",
        "Conservative management with in-hospital monitoring",
        "Balloon angioplasty only",
        "Emergency CABG",
        "IVUS-guided PCI",
      ],
      answer: 1,
      explanation:
        "Non-occlusive SCAD with preserved flow and no ongoing ischaemia is managed conservatively because most dissections heal; PCI in this setting fails or causes complications in a high proportion of cases. Monitor in hospital for several days because early extension can occur.",
      difficulty: 2,
      refs: ["supplied-eh-views", "scad-esc-2018"],
    },
    {
      id: "dx-q-anat-bridge",
      stem: "A mid-LAD segment narrows to about 70% in systole and looks normal in diastole. What is the most likely explanation?",
      options: ["Fixed atherosclerotic stenosis", "Myocardial bridge", "Catheter-induced spasm", "SCAD type 3", "Foreshortening"],
      answer: 1,
      explanation:
        "Systolic compression with diastolic relief of a mid-LAD segment is the typical appearance of a myocardial bridge. A fixed stenosis does not change with the cardiac cycle. Bridges are usually managed without stenting.",
      difficulty: 1,
      refs: ["supplied-oxford"],
    },
  ],
  sims: [
    { sim: "views", task: "In the RCA presets, identify the conus, SA nodal artery, acute marginal, AV nodal artery, PDA and posterolateral branch, and say which view separates atrial from ventricular branches." },
  ],
  caseIds: ["dx-case-smooth-rca", "dx-case-scad"],
};

// ---------------------------------------------------------------------------
// Module 7 — Bypass grafts
// ---------------------------------------------------------------------------
const mGrafts: Module = {
  id: "dx-grafts",
  title: "Bypass graft angiography",
  stage: 2,
  summary:
    "Planning a post-CABG study from the operation note, finding and engaging vein grafts, imaging the three parts of every graft, and engaging and imaging the LIMA, RIMA and radial artery grafts.",
  objectives: [
    "Extract the information needed from a CABG operation note and plan access and catheters accordingly.",
    "Predict where each vein graft arises on the ascending aorta and choose the view in which to engage it.",
    "Image each graft's ostium and body, distal anastomosis and native run-off with the appropriate pair of views.",
    "Engage the LIMA safely, choose views for its anastomosis, and recognise problems specific to arterial grafts.",
  ],
  lessons: [
    {
      id: "dx-graft-plan",
      title: "Planning the post-CABG study and finding vein grafts",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "A graft study is a search followed by an assessment. The search is far easier, and much safer, when you know what you are looking for. Before the patient comes in, find the operation note and any previous angiograms.",
        },
        {
          kind: "table",
          caption: "What to extract from the operation note",
          head: ["Item", "Why it matters"],
          rows: [
            ["Number of grafts and their targets", "Every graft must be found or accounted for"],
            ["Conduit for each graft: LIMA, RIMA, radial artery, saphenous vein", "Determines access, catheter and expected appearance"],
            ["Configuration: in situ or free; sequential ('jump') grafts; Y or T composite grafts", "A sequential graft has two anastomoses; a composite graft fills from another graft, not from the aorta"],
            ["Proximal anastomosis markers (rings, clips)", "Help locate ostia on fluoroscopy when present"],
            ["Date of surgery", "Early, intermediate and late graft failure have different causes"],
            ["Previous angiogram notes", "Which catheter engaged which graft last time"],
          ],
        },
        {
          kind: "p",
          text: "Choose access with the LIMA in mind: left radial or femoral makes it simple, right radial makes it hard. Image the native coronaries first. Knowing which territories fill from the native system, and which fill only via collaterals or retrogradely through a graft, tells you which grafts must be patent and where to look harder.",
        },
        { kind: "h", text: "Where vein grafts arise" },
        {
          kind: "table",
          caption: "Usual positions of proximal vein-graft anastomoses on the ascending aorta",
          head: ["Graft target", "Height on the aorta", "Aortic wall", "Engagement view", "Catheters often used"],
          rows: [
            ["RCA or PDA", "Lowest", "Right side", "LAO", "JR4; multipurpose for a downward-facing graft; Amplatz Right"],
            ["LAD or diagonal", "Middle, just above the left coronary ostium", "Anterior", "LAO, with RAO to confirm the tip points anteriorly", "JR4; Amplatz Left"],
            ["Obtuse marginal or LCx", "Highest", "Usually anterior, towards the left", "LAO or RAO (in RAO the tip points away from the spine)", "JR4; Amplatz Left"],
          ],
        },
        {
          kind: "p",
          text: "The sources differ on the view for left-sided grafts. The Oxford handbook places most vein grafts on the anterior wall of the ascending aorta just above the sinuses, and usually cannulates LAD, diagonal and circumflex grafts in LAO, switching to RAO to check the direction of the tip; Brilakis's usual first projection for any vein graft is also LAO. The supplied views guide teaches an 'opposite' rule instead: RCA grafts engaged in LAO, left-sided grafts in RAO, with OM grafts on the left or posterior border. All three agree on LAO for an RCA graft, and Oxford images every vein graft in both LAO and RAO, so you will use both views whichever you start in.",
        },
        {
          kind: "steps",
          title: "Searching for a vein graft",
          items: [
            { title: "Start in the right view at the right height", detail: "For an RCA graft, start in LAO just above the native RCA ostium; for left grafts, work higher up the aorta, usually in LAO, and check the tip direction in RAO." },
            { title: "Sweep the expected wall", detail: "Point the catheter tip at the wall where the graft should arise and move up or down a centimetre at a time, rotating gently." },
            { title: "Use small test puffs", detail: "A puff shows a filling graft, a stump, or a dimple where an occluded graft once arose." },
            { title: "Watch the pressure", detail: "Vein grafts are large, but damping still means the tip is against the wall or in a stenosed ostium." },
            { title: "If it is not found, stop probing", detail: "Repeated scraping of a diseased aorta or graft ostium risks embolism and dissection. An ascending aortogram in LAO shows patent grafts and stumps; recheck the operation note; consider CT." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Declaring a graft occluded because it could not be found, without a stump, an aortogram or the operation note.",
            "Forgetting sequential grafts and composite grafts, which have no aortic ostium of their own.",
            "Starting graft angiography before knowing which native territories need graft supply.",
          ],
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-medmastery", "hanna-pcm", "brilakis-manual-pci"],
    },
    {
      id: "dx-graft-svg",
      title: "Imaging and interpreting vein grafts",
      minutes: 8,
      blocks: [
        {
          kind: "p",
          text: "Every graft has three parts that must each be seen clearly: the ostium and body, the distal anastomosis, and the native vessel run-off (both the antegrade run-off beyond the anastomosis and any retrograde filling back up the native vessel). Each needs a view chosen for it.",
        },
        {
          kind: "table",
          caption: "Two-view strategy for vein grafts",
          head: ["Graft", "First view: ostium and body", "Second view: anastomosis and native run-off"],
          rows: [
            ["To RCA or PDA", "LAO straight (the engagement view)", "AP cranial or LAO cranial"],
            ["To obtuse marginal", "RAO straight (the engagement view)", "AP caudal or RAO caudal"],
            ["To diagonal or LAD", "RAO straight (the engagement view)", "AP cranial or LAO cranial"],
          ],
        },
        {
          kind: "p",
          text: "The logic is simple. The engagement view usually lays out the graft body. For the second view, choose whichever projection you would use for the native target vessel: caudal views for the circumflex territory, cranial views for the LAD territory and the RCA crux. That view shows the anastomosis and the native vessel beyond it.",
        },
        { kind: "h", text: "What to look for" },
        {
          kind: "table",
          head: ["Finding", "Comment"],
          rows: [
            ["Ostial graft stenosis", "Easily missed if the catheter sits beyond it; check the trace and use a non-selective puff"],
            ["Degenerated graft", "Diffuse irregularity, ectasia, friable plaque and thrombus; high risk of distal embolisation if treated"],
            ["Anastomotic stenosis", "Needs the second view; often the site of early failure"],
            ["Size mismatch", "Grafts are often much larger than the native target"],
            ["Occluded graft", "A stump or dimple at the aortic origin; supply to the territory must come from elsewhere"],
            ["Native run-off", "Disease beyond the anastomosis limits the graft's value; retrograde filling may show the native vessel back to its occlusion"],
          ],
        },
        {
          kind: "p",
          text: "Graft failure has a typical time course. Early failure (in the first weeks) is usually technical or thrombotic; failure in the first year is mainly due to intimal hyperplasia; later failure is due to atherosclerosis within the vein, which is often bulky and friable. Handle old vein grafts gently: an aggressive catheter can dislodge debris.",
        },
        { kind: "h", text: "Technique points" },
        {
          kind: "list",
          items: [
            "Vein grafts are wide: give a full, firm injection, or the graft streams and lesions are under-called.",
            "Keep recording until the native vessel beyond the anastomosis has filled and cleared; slow flow in a large graft takes time.",
            "Sequential ('jump') grafts have two or more anastomoses: follow the graft to its last target and show each anastomosis.",
            "Image the native vessels fully too: native disease progresses, and a patent graft to the LAD 'protects' a diseased left main only while that graft stays open.",
            "If the graft ostium damps the trace, pull back and use a non-selective puff at the ostium, as for a native ostial lesion.",
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Three parts per graft: ostium and body, anastomosis, native run-off.",
            "First view is the engagement view; second view is the best view of the native target.",
            "Record long enough to see the distal bed and any retrograde native filling.",
            "Degenerated vein grafts are friable; minimise manipulation.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Reporting a graft as 'patent' after seeing only its body.",
            "Missing the second anastomosis of a sequential graft.",
            "Under-injecting a large graft and calling streaming a lesion, or missing a real one.",
          ],
        },
      ],
      refs: ["supplied-eh-views", "supplied-medmastery", "hanna-pcm"],
    },
    {
      id: "dx-graft-arterial",
      title: "LIMA, RIMA and radial artery grafts",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "The in situ left internal mammary artery (LIMA) grafted to the LAD is the most durable conduit in coronary surgery. It arises from the inferior surface of the first part of the left subclavian artery, roughly opposite the vertebral artery, and runs down behind the anterior chest wall beside the sternum. It is usually reached from the femoral or left radial route.",
        },
        {
          kind: "steps",
          title: "Engaging the LIMA (femoral or left radial route)",
          items: [
            { title: "Image the subclavian", detail: "A non-selective injection in the proximal left subclavian shows the LIMA origin and any proximal subclavian stenosis, which can starve the graft (coronary-subclavian steal)." },
            { title: "Wire beyond the origin", detail: "From the femoral route, engage the left subclavian from the arch with a JR4 or IMA catheter and pass a soft or hydrophilic wire into the distal subclavian, well beyond the LIMA origin. Watch that it does not enter the vertebral or carotid artery." },
            { title: "Railroad and prepare", detail: "Advance the catheter over the wire beyond the LIMA origin, remove the wire, bleed back and aspirate." },
            { title: "Drop into the LIMA", detail: "Withdraw slowly while rotating so the tip faces downward and forward; it falls into the LIMA with a small jump. Confirm with a test puff." },
            { title: "Warn and inject gently", detail: "Patients often feel warmth or discomfort in the chest wall. Use modest volumes. Do not wedge the catheter in a small or tortuous LIMA: damping, spasm and dissection follow." },
          ],
        },
        {
          kind: "p",
          text: "From the right radial the LIMA can be reached by crossing into the left subclavian from the arch, but this takes experience and time. Inadvertent vertebral injection and contrast reaching the posterior circulation can cause transient neurological or visual symptoms, which are more common after mammary angiography.",
        },
        { kind: "h", text: "Views for the LIMA" },
        {
          kind: "table",
          head: ["Step", "Target", "Views"],
          rows: [
            ["1", "LIMA body", "The engagement view, usually AP or shallow RAO"],
            ["2", "Native LAD run-off", "A standard LAD view, such as shallow RAO cranial"],
            ["3", "Anastomosis (most important, often hardest)", "Left lateral (90 degrees), with the arms above the head, is the gold standard. Then the standard cranial LAD views (AP or LAO cranial). If those fail, RAO straight or LAO caudal may profile it"],
          ],
        },
        {
          kind: "p",
          text: "The distal anastomosis is a frequent site of stenosis, and it is often overlapped in the standard views. Do not finish a LIMA study until it has been seen clearly in at least one view.",
        },
        { kind: "h", text: "Other arterial grafts" },
        {
          kind: "table",
          head: ["Conduit", "Typical configuration", "How to image", "Specific issues"],
          rows: [
            ["RIMA", "In situ to the RCA, or across the front of the aorta to the LAD; or used as a free graft", "Engage the right subclavian (directly from the right radial, or through the brachiocephalic trunk from the femoral route); technique as for the LIMA", "Harder to engage from the femoral route"],
            ["Radial artery graft", "From the aorta, or as a composite graft from the LIMA", "Like a vein graft if aortic; via the LIMA if composite", "Muscular and spasm-prone: give vasodilator before calling a narrowing fixed"],
            ["Composite (Y or T) graft", "A second arterial conduit joined to the LIMA", "Inject the parent LIMA to see both limbs", "No aortic ostium to find"],
            ["Right gastroepiploic (rare)", "To the inferior wall", "Through the coeliac axis", "Check the operation note"],
          ],
        },
        {
          kind: "p",
          text: "An arterial graft that looks diffusely thin along its whole length, with good native flow down a moderately stenosed target vessel, usually reflects competitive flow (the 'string sign') rather than graft disease. Interpret the graft together with the native lesion it was meant to bypass.",
        },
        {
          kind: "pitfalls",
          items: [
            "Engaging the LIMA without first imaging the subclavian origin.",
            "Accepting a LIMA study without a clear view of the anastomosis.",
            "Calling spasm in a radial graft fixed disease without vasodilator.",
            "Searching the aorta for a composite graft that arises from the LIMA.",
          ],
        },
      ],
      refs: ["supplied-eh-views", "supplied-oxford", "supplied-medmastery", "hanna-pcm"],
    },
  ],
  quiz: [
    {
      id: "dx-q-graft-order",
      stem: "In a patient with three vein grafts, which graft usually has the highest proximal anastomosis on the ascending aorta?",
      options: ["Graft to the RCA", "Graft to the PDA", "Graft to the diagonal", "Graft to an obtuse marginal", "They are always at the same level"],
      answer: 3,
      explanation:
        "From bottom to top the usual order is RCA graft, then LAD or diagonal graft, then obtuse marginal or circumflex graft, which arises highest. Oxford places most vein grafts on the anterior aortic wall; the supplied views guide puts OM grafts on the left or posterior border. The RCA graft is the lowest, on the right side.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-graft-engage-view",
      stem: "Which projection is usually best for engaging a vein graft to the RCA?",
      options: ["RAO", "LAO", "AP caudal", "Left lateral", "RAO caudal"],
      answer: 1,
      explanation:
        "The supplied views guide and the Oxford handbook both engage an RCA vein graft in LAO, and LAO is Brilakis's usual first view for any vein graft. RAO is the tempting answer if you match the side of the graft to the side of the view. The views guide uses RAO for left-sided grafts, whereas Oxford uses LAO for them too and turns to RAO to check the tip.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford", "brilakis-manual-pci"],
    },
    {
      id: "dx-q-graft-om-views",
      stem: "A vein graft to an obtuse marginal has been imaged in RAO straight. Which second view is most appropriate for the distal anastomosis and native run-off?",
      options: [
        "AP cranial (0°/30°)",
        "LAO cranial at 45°/25°",
        "AP caudal or RAO caudal",
        "Left lateral at 90 degrees",
        "LAO straight at 45°",
      ],
      answer: 2,
      explanation:
        "The second view should be the best view of the native target, and the circumflex territory is best seen in caudal views. Cranial views suit grafts to the LAD, diagonals and the PDA, but throw the circumflex upward and overlap it.",
      difficulty: 2,
      refs: ["supplied-eh-views"],
    },
    {
      id: "dx-q-graft-lima-anastomosis",
      stem: "Which projection is regarded as the gold standard for showing the LIMA-to-LAD anastomosis?",
      options: [
        "RAO caudal (30°/20°)",
        "AP with no tilt",
        "Left lateral (90 degrees)",
        "LAO caudal (spider) at 45°/25°",
        "RAO cranial (30°/30°)",
      ],
      answer: 2,
      explanation:
        "The left lateral view often gives the only clear, unobstructed view of the anastomosis, although the arms must be raised. AP or LAO cranial are the first alternatives; RAO straight or LAO caudal are useful if those fail. RAO caudal is a poor view for the mid and distal LAD.",
      difficulty: 1,
      refs: ["supplied-eh-views", "supplied-oxford"],
    },
    {
      id: "dx-q-graft-subclavian",
      stem: "Why should the left subclavian artery be imaged before selective LIMA engagement?",
      options: [
        "To measure the LIMA diameter before choosing a catheter",
        "To show the LIMA origin and any subclavian stenosis limiting graft flow",
        "To exclude an aortic dissection extending into the arch as a cause of the symptoms",
        "To reduce the contrast needed for the selective LIMA injection",
        "To check for a vertebral artery aneurysm before passing the wire",
      ],
      answer: 1,
      explanation:
        "A proximal subclavian stenosis reduces flow to the LIMA and can cause coronary-subclavian steal, so it must be recognised; the injection also shows where the LIMA arises. The other options are not reasons for the step.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-graft-not-found",
      stem: "Despite careful searching, you cannot find the vein graft to the diagonal. What is the best next step?",
      options: [
        "Report the graft as occluded and move on to the native vessels",
        "Keep probing the anterior aortic wall with different catheters until it is found",
        "Check the operation note and do an aortogram to find the graft or its stump",
        "Proceed to PCI of the native diagonal, since the graft is probably closed",
        "Perform a ventriculogram to see whether the diagonal territory is still viable",
      ],
      answer: 2,
      explanation:
        "A graft that cannot be found is not proven occluded. The operation note may show it is sequential or composite, and an aortogram shows patent grafts and stumps. Prolonged probing of a diseased aorta risks embolism and dissection.",
      difficulty: 2,
      refs: ["supplied-eh-views", "hanna-pcm"],
    },
    {
      id: "dx-q-graft-string",
      stem: "A LIMA to the LAD is patent but diffusely thin along its whole length. The native LAD has only a 50% proximal stenosis with brisk antegrade flow. What is the most likely explanation?",
      options: ["Diffuse LIMA atherosclerosis", "Competitive flow from the native LAD", "LIMA dissection", "Catheter-induced spasm of the subclavian", "Anastomotic occlusion"],
      answer: 1,
      explanation:
        "When the native vessel is only moderately narrowed, it competes with the graft and the LIMA can become diffusely thin (the 'string sign'). Atherosclerosis in the LIMA itself is uncommon. Interpret arterial grafts together with the native lesion they bypass.",
      difficulty: 3,
      refs: ["hanna-pcm"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage a right-sided vein graft in LAO and a left-sided graft in RAO, sweeping the expected aortic wall in small steps with test puffs." },
  ],
};

// ---------------------------------------------------------------------------
// Module 8 — Ventriculography, aortography, reporting and finishing
// ---------------------------------------------------------------------------
const mLvReport: Module = {
  id: "dx-lv-aorta-report",
  title: "Ventriculography, aortography, reporting and finishing the case",
  stage: 2,
  summary:
    "When and how to perform left ventriculography and aortography, how to grade wall motion and regurgitation, how to write a structured report, and how to finish the case safely.",
  objectives: [
    "Decide when a ventriculogram adds value, perform it safely with a pigtail catheter after measuring LVEDP, and describe wall motion and mitral regurgitation.",
    "Perform an aortic root angiogram and grade aortic regurgitation, recognising the artefacts that distort grading.",
    "Write a structured angiography report that a heart team or another operator can act on.",
    "Finish the case safely: haemostasis, radiation awareness, post-procedure checks and communication.",
  ],
  lessons: [
    {
      id: "dx-lv-gram",
      title: "Left ventriculography",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "Left ventriculography opacifies the LV through a pigtail catheter to show global and regional function and the presence of mitral regurgitation. Echocardiography now answers these questions in most patients without extra contrast, so the ventriculogram is optional. It earns its place when there is no recent echo of adequate quality, when wall motion or mitral regurgitation must be correlated with the coronary findings on the table, or when specific diagnoses such as a ventricular septal defect, LV aneurysm or mid-cavity obstruction are suspected.",
        },
        {
          kind: "table",
          caption: "When to avoid or reconsider a ventriculogram",
          head: ["Situation", "Reason"],
          rows: [
            ["LV thrombus", "Embolism"],
            ["Mechanical aortic valve", "Never cross it with a catheter"],
            ["Severe aortic stenosis", "Crossing only to perform a ventriculogram is not justified"],
            ["Markedly raised LVEDP or decompensated heart failure", "The contrast load can precipitate pulmonary oedema"],
            ["Significant renal impairment", "Contrast budget better spent on the coronaries"],
            ["Critical left main disease, haemodynamic instability", "Extra risk with little gain"],
            ["Pre-existing right bundle branch block", "Catheter contact with the septum can cause left bundle branch block and so complete heart block"],
          ],
        },
        {
          kind: "steps",
          title: "Performing the ventriculogram",
          items: [
            { title: "Cross the valve", detail: "Advance the pigtail over a J-wire to the root, remove the wire, then advance so the pigtail loop prolapses across a normal aortic valve, ideally in RAO." },
            { title: "Position", detail: "Place the loop in the mid cavity, free of the mitral apparatus and away from the walls, where it does not provoke ectopics." },
            { title: "Measure", detail: "Record LV pressure and the LVEDP before any injection. A markedly raised LVEDP is a reason to reduce the volume or abandon the injection." },
            { title: "Test", detail: "A small hand injection confirms position and excludes injection into the wall or trabeculae." },
            { title: "Inject", detail: "Power injection in RAO about 30 degrees, with LAO about 45–60 degrees (with or without cranial tilt) as a second view or biplane. Typical settings are in the order of 30–40 mL at 10–15 mL/s; follow local protocol and adjust for LV size and function." },
            { title: "Pull back", detail: "Withdraw from LV to aorta while recording pressure to look for a gradient across the aortic valve or outflow tract." },
          ],
        },
        {
          kind: "p",
          text: "Measure LVEDP at end-diastole: after the atrial ('a') wave and just before the rapid systolic upstroke, roughly at the R wave of the ECG. Normal values are about 12 mmHg or less.",
        },
        {
          kind: "table",
          caption: "Which walls each projection shows",
          head: ["Projection", "Segments in profile"],
          rows: [
            ["RAO about 30 degrees", "Anterobasal, anterolateral, apical, inferior (diaphragmatic) and inferobasal (posterobasal) walls; mitral regurgitation into the left atrium"],
            ["LAO about 45–60 degrees (with cranial tilt for the septum)", "Septal and posterolateral (inferolateral) walls; ventricular septal defect"],
          ],
        },
        {
          kind: "list",
          items: [
            "Wall motion: normal, hypokinetic (reduced), akinetic (absent), dyskinetic (paradoxical outward systolic movement), aneurysmal (a persistent outward bulge in diastole and systole).",
            "Ejection fraction is estimated from end-diastolic and end-systolic outlines, usually by the area-length method.",
          ],
        },
        {
          kind: "formula",
          name: "Ejection fraction",
          expr: "EF = (EDV − ESV) / EDV × 100",
          note: "EDV and ESV are end-diastolic and end-systolic volumes. Use sinus beats, not ectopic or post-ectopic beats.",
        },
        {
          kind: "table",
          caption: "Angiographic grading of mitral regurgitation (qualitative)",
          head: ["Grade", "Appearance of the left atrium"],
          rows: [
            ["1+", "Contrast enters the left atrium but clears with each beat; the atrium is never fully opacified"],
            ["2+", "Faint opacification of the whole left atrium, less dense than the LV, not clearing completely"],
            ["3+", "Left atrium progressively opacifies and reaches the density of the LV over several beats"],
            ["4+", "Left atrium dense within the first beat, with contrast refluxing into the pulmonary veins"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Grading mitral regurgitation from ectopic or post-ectopic beats, which exaggerate it.",
            "A catheter caught in the mitral apparatus, producing artefactual regurgitation.",
            "Endocardial staining from injection with the tip against the wall.",
            "Injecting without checking LVEDP in a patient with borderline heart failure.",
          ],
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Record LV pressure and identify the LVEDP correctly before a ventriculogram, then perform an LV-to-aorta pullback and look for a gradient.",
        },
      ],
      refs: ["hanna-pcm", "esc-vhd-2021", "sellers-1964"],
    },
    {
      id: "dx-aortography",
      title: "Aortography",
      minutes: 6,
      blocks: [
        {
          kind: "p",
          text: "An aortic root angiogram injects contrast through a pigtail above the aortic valve. Echocardiography, CT and MR are the first-line tests for the aortic valve and aorta, so aortography is used selectively.",
        },
        {
          kind: "list",
          items: [
            "Grading aortic regurgitation when non-invasive assessment is inconclusive.",
            "Finding vein grafts and stumps in post-CABG patients when selective engagement fails.",
            "Locating an anomalous coronary ostium.",
            "Assessing the size of the root and ascending aorta, a sinus of Valsalva aneurysm, or coarctation (CT is usually preferred for anatomy, and suspected dissection should be imaged by CT rather than by catheter).",
          ],
        },
        {
          kind: "steps",
          items: [
            { title: "Position", detail: "Place the pigtail loop in the ascending aorta a little above the valve, not in a sinus and not touching the leaflets: a catheter too close to the valve can cause artefactual regurgitation." },
            { title: "Projection", detail: "LAO, commonly about 45–60 degrees, lays out the ascending aorta and root; RAO about 30 degrees is also used for regurgitation." },
            { title: "Inject", detail: "Use a power injection with a larger volume at a faster rate than for a ventriculogram, following local protocol, and record several beats." },
          ],
        },
        {
          kind: "table",
          caption: "Angiographic grading of aortic regurgitation (qualitative)",
          head: ["Grade", "Appearance of the LV"],
          rows: [
            ["1+", "A small jet faintly opacifies the LV and clears with each beat"],
            ["2+", "Faint opacification of the whole LV that does not clear between beats"],
            ["3+", "LV density rises to equal that of the aorta over a few beats"],
            ["4+", "Dense LV opacification within the first beat, greater than that of the aorta, persisting"],
          ],
        },
        {
          kind: "p",
          text: "Angiographic grading is qualitative and depends on the injection, the catheter position, the size of the LV and the heart rate. Use it as a supplement to echocardiographic or CMR quantification, and state in the report how the study was performed.",
        },
        { kind: "h", text: "Aortography in the post-CABG patient" },
        {
          kind: "p",
          text: "When a vein graft cannot be found, an ascending aortogram with the pigtail in the mid ascending aorta shows patent grafts arising from the aortic wall and the stumps of occluded ones. An LAO run profiles the right anterior aspect of the aorta, where RCA grafts arise; an RAO run profiles the left anterior aspect, where most left-sided grafts arise. Once a graft origin has been seen, selective engagement is quicker and uses less contrast than further blind searching.",
        },
        {
          kind: "pearl",
          text: "An aortogram is a large single dose of contrast. Decide beforehand what question it answers, and whether echo, CT or a few more minutes with the operation note would answer it instead.",
        },
        {
          kind: "pitfalls",
          items: [
            "Catheter too close to, or across, the valve, producing false regurgitation.",
            "Ectopic beats during the run.",
            "A dilated LV dilutes the contrast, so severity is underestimated.",
            "Spending a large contrast volume on a question echo or CT could answer.",
          ],
        },
      ],
      refs: ["hanna-pcm", "esc-vhd-2021", "supplied-oxford", "supplied-eh-views", "sellers-1964"],
    },
    {
      id: "dx-report",
      title: "Structured reporting and finishing safely",
      minutes: 9,
      blocks: [
        {
          kind: "p",
          text: "The report is the product of the procedure. A surgeon, another interventionist or a heart team should be able to make a decision from it without rerunning every cine loop. Write it in a fixed order and describe every segment, using standard segment names.",
        },
        {
          kind: "figure",
          id: "aha-segments",
          caption: "AHA/SYNTAX coronary segment numbering: use segment names or numbers in every report so lesions can be located unambiguously.",
        },
        {
          kind: "table",
          caption: "Structured report",
          head: ["Section", "Include"],
          rows: [
            ["Indication", "Clinical presentation and the question being answered"],
            ["Procedure", "Access site and side, sheath size, ultrasound use; catheters; drugs (heparin, vasodilators, nitrate); contrast agent and volume; fluoroscopy time and radiation dose (dose-area product and reference air kerma)"],
            ["Haemodynamics", "Aortic pressure, LVEDP, any gradient on pullback"],
            ["Anatomy", "Dominance; left main, LAD, LCx, RCA and grafts in turn"],
            ["Each lesion", "Segment, percentage stenosis, length, ostial or bifurcation involvement, calcium, thrombus, TIMI flow"],
            ["Occlusions", "Location, stump, length, collaterals (donor, recipient, Rentrop grade)"],
            ["LV and valves", "Ejection fraction, regional wall motion, regurgitation grade (if performed)"],
            ["Complications", "Any, and how they were managed"],
            ["Conclusion and plan", "One-line summary (for example 'severe three-vessel disease'), recommended next step (medical therapy, PCI now or staged, physiology, heart team), haemostasis method and post-procedure instructions"],
          ],
        },
        { kind: "h", text: "When to involve the heart team" },
        {
          kind: "p",
          text: "Under ESC revascularisation guidance, stable patients with left main disease, multivessel disease (particularly with diabetes or reduced LV function) or complex anatomy in whom both PCI and CABG are reasonable options should be discussed by a heart team before revascularisation. The SYNTAX score grades anatomical complexity; higher scores favoured CABG over PCI for multivessel disease in the SYNTAX trial. Calculate or estimate it when multivessel or left main disease is found.",
        },
        { kind: "h", text: "Radiation" },
        {
          kind: "list",
          items: [
            "Use the least fluoroscopy and the fewest cine frames that answer the question; use low frame rates where image quality allows.",
            "Collimate tightly, keep the detector close to the patient and the tube far away.",
            "Steep angulations, especially LAO cranial, raise both patient and operator dose; keep those runs short.",
            "In long cases, vary the angles so that skin dose is not concentrated on one spot.",
            "Reference air kerma relates to the risk of skin injury (deterministic effects); dose-area product relates to the cancer risk (stochastic effects). Follow local thresholds for skin follow-up.",
            "Use shields, distance and personal protection; wear your dosimeter.",
          ],
        },
        { kind: "h", text: "Finishing the case" },
        {
          kind: "steps",
          items: [
            { title: "Remove catheters safely", detail: "Withdraw over a wire through tortuous segments; aspirate before any final injection." },
            { title: "Haemostasis", detail: "Radial: compression band with patent haemostasis. Femoral: manual compression or a closure device chosen after the sheath angiogram." },
            { title: "Check the limb", detail: "Distal pulses, capillary refill, hand or leg perfusion, and the access site before leaving the room." },
            { title: "Observe", detail: "Heart rate, blood pressure, rhythm, oxygen saturation, symptoms, access site and, where relevant, urine output." },
            { title: "Kidneys and drugs", detail: "Hydration for at-risk patients, creatinine at 48–72 hours when indicated, and metformin restarted per protocol." },
            { title: "Communicate", detail: "Explain the findings and the plan to the patient, document them, and give written advice about the access site, symptoms and driving according to national rules." },
          ],
        },
        {
          kind: "table",
          caption: "Hypotension after the procedure",
          head: ["Benign causes", "Serious causes to exclude first"],
          rows: [
            ["Sedation and analgesia", "Access-site bleeding, including retroperitoneal haemorrhage"],
            ["Intracoronary nitrate or the radial cocktail", "Cardiac tamponade or coronary perforation"],
            ["Vasovagal reaction", "Anaphylactoid contrast reaction"],
            ["Dehydration after fasting", "Myocardial infarction or acute vessel closure"],
          ],
        },
        {
          kind: "keypoints",
          items: [
            "Report in a fixed order, by segment, with flow, collaterals and a clear plan.",
            "Left main, multivessel and complex disease in stable patients go to the heart team.",
            "Air kerma predicts skin injury; dose-area product predicts stochastic risk.",
            "Treat unexplained post-procedure hypotension as bleeding until proven otherwise.",
          ],
        },
      ],
      refs: ["supplied-medmastery", "esc-revasc-2018", "syntax-2009", "radiation-consensus-2018", "hanna-pcm", "austen-aha-segments-1975", "sianos-syntax-score-2005"],
    },
  ],
  quiz: [
    {
      id: "dx-q-lv-lvedp",
      stem: "Before a ventriculogram the LVEDP is 32 mmHg in a breathless patient. What is the most appropriate action?",
      options: [
        "Proceed with a standard 40 mL power injection at 12 mL/s as planned",
        "Omit or shrink the ventriculogram and treat the filling pressure",
        "Increase the injection rate so that the run is shorter",
        "Switch to a hand injection of 40 mL to control the delivery",
        "Perform an aortogram instead to assess the valve and root",
      ],
      answer: 1,
      explanation:
        "A markedly raised LVEDP means the ventricle is already congested; a large contrast load can tip the patient into pulmonary oedema. Echo can usually provide the information. A hand injection of the same volume carries the same load, and an aortogram would add contrast without answering the question.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-lv-rao-walls",
      stem: "Which LV walls are best assessed on an RAO 30-degree ventriculogram?",
      options: [
        "Septal and posterolateral walls",
        "Anterior, apical and inferior walls",
        "Lateral wall only",
        "Right ventricular free wall",
        "Septum and outflow tract",
      ],
      answer: 1,
      explanation:
        "RAO shows the LV long axis in profile: anterobasal, anterolateral, apical, inferior and inferobasal segments. The septal and posterolateral walls need an LAO projection, which looks along the septum.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-lv-mr-grade",
      stem: "During a ventriculogram the left atrium opacifies progressively and reaches the same density as the LV after several beats. What angiographic grade of mitral regurgitation is this?",
      options: ["1+", "2+", "3+", "4+", "Cannot be graded angiographically"],
      answer: 2,
      explanation:
        "Equal atrial and ventricular density reached over several beats is 3+. In 4+ the atrium is dense within the first beat and contrast refluxes into the pulmonary veins; in 2+ the atrium is opacified only faintly.",
      difficulty: 2,
      refs: ["hanna-pcm", "sellers-1964"],
    },
    {
      id: "dx-q-lv-ectopy",
      stem: "Mitral regurgitation is seen on a ventriculogram only during and immediately after ventricular ectopic beats. How should it be interpreted?",
      options: [
        "As severe regurgitation that needs surgical review",
        "As probably artefactual; grade it on sinus beats only",
        "As evidence of papillary muscle rupture after infarction",
        "As a reason to repeat the run with a larger contrast volume",
        "As confirmation of a ventricular septal defect with shunting",
      ],
      answer: 1,
      explanation:
        "Ectopic and post-ectopic beats distort contraction and can produce regurgitation that is not present in sinus rhythm. Grade only sinus beats, and reposition the catheter if it is provoking ectopy. Repeating with a larger volume adds contrast without fixing the cause.",
      difficulty: 2,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-lv-contraindication",
      stem: "Which finding is the strongest reason not to perform a left ventriculogram?",
      options: ["Moderate mitral regurgitation on echo", "LV apical thrombus", "Previous inferior MI", "Ejection fraction of 45%", "Atrial fibrillation with controlled rate"],
      answer: 1,
      explanation:
        "A pigtail and a power injection in a ventricle containing thrombus risk systemic embolism. Mitral regurgitation and previous infarction are reasons one might perform a ventriculogram, not reasons to avoid it.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-ao-catheter",
      stem: "During aortography for suspected aortic regurgitation, where should the pigtail sit?",
      options: [
        "Across the aortic valve, in the left ventricular outflow tract",
        "Deep in the non-coronary sinus, touching the base of the leaflet",
        "In the ascending aorta a little above the valve, clear of the leaflets",
        "In the aortic arch, just beyond the origin of the left subclavian artery",
        "In the descending thoracic aorta, below the isthmus",
      ],
      answer: 2,
      explanation:
        "The loop should sit above the valve, clear of the leaflets and sinuses. A catheter too close to or across the valve can hold the leaflets open and create artefactual regurgitation; a catheter too far up dilutes the contrast in the root.",
      difficulty: 1,
      refs: ["hanna-pcm"],
    },
    {
      id: "dx-q-rep-air-kerma",
      stem: "Which radiation dose metric is most closely related to the risk of skin injury in the patient?",
      options: ["Fluoroscopy time", "Dose-area product", "Reference point air kerma", "Number of cine runs", "Operator dosimeter reading"],
      answer: 2,
      explanation:
        "Reference air kerma estimates the dose at the skin entrance point and tracks deterministic effects such as skin injury. Dose-area product reflects the total energy delivered and relates to stochastic (cancer) risk. Fluoroscopy time ignores dose rate, cine and angulation.",
      difficulty: 2,
      refs: ["radiation-consensus-2018"],
    },
    {
      id: "dx-q-rep-hypotension",
      stem: "Two hours after femoral angiography a patient's blood pressure is 82/50 mmHg and the heart rate 110 bpm. The groin looks unremarkable. What should be assumed until proven otherwise?",
      options: ["Delayed effect of sedation", "Vasovagal reaction", "Retroperitoneal haemorrhage", "Dehydration", "Delayed nitrate effect"],
      answer: 2,
      explanation:
        "Hypotension with tachycardia after femoral access, without visible bleeding, is retroperitoneal haemorrhage until proven otherwise: resuscitate, check haemoglobin and request urgent CT. A vasovagal reaction typically causes bradycardia, not tachycardia, and sedation should have worn off.",
      difficulty: 2,
      refs: ["supplied-medmastery"],
    },
  ],
  sims: [
    { sim: "haemo", task: "Measure LVEDP correctly from an LV trace and decide whether a ventriculogram is safe." },
  ],
  caseIds: ["dx-case-left-main"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
const caseSmoothRca: CaseStudy = {
  id: "dx-case-smooth-rca",
  title: "The smooth RCA that wasn't",
  trackId: "diagnostic",
  stage: 2,
  provenance: { kind: "synthetic", basedOn: "Teaching scenario in the supplied EH notes: an acute marginal stented in place of an occluded true RCA." },
  summary:
    "An inferior STEMI in which the obvious 'RCA' is a large acute marginal branch and the true culprit, an occluded mid RCA, has to be found.",
  presentation:
    "A 58-year-old woman with type 2 diabetes presents 2 hours after the onset of central chest pain. ECG: 2–3 mm ST elevation in II, III and aVF (III greater than II), reciprocal ST depression in I and aVL, and 1 mm ST elevation in V4R. Blood pressure 96/60 mmHg, heart rate 54 bpm in sinus rhythm, oxygen saturation 96% on air. She has received aspirin and anticoagulation on the primary PCI pathway. Right radial access, 6 F sheath.",
  findings: [
    "Inferior STEMI with ECG evidence of right ventricular involvement",
    "Relative hypotension and sinus bradycardia",
    "Radial access established without difficulty",
  ],
  steps: [
    {
      id: "s1",
      prompt: "What is your interpretation of the RCA injection?",
      info:
        "Left coronary (RAO caudal, LAO caudal, AP cranial): large LAD wrapping the apex, small non-dominant LCx, no significant stenosis. RCA with a JR4 in LAO 30 degrees: normal proximal segment, then a large, smooth vessel running straight down the acute margin and tapering towards the apex. It has a 60% narrowing in its proximal third and TIMI 3 flow. No vessel turns at the crux; no PDA or posterolateral branches are seen.",
      options: [
        {
          text: "This is the culprit RCA: wire it and stent the 60% narrowing.",
          feedback:
            "A smooth, straight vessel with no bend at the crux is an acute marginal until proven otherwise. With a non-dominant LCx, someone must be supplying the PDA territory, and a 60% narrowing with TIMI 3 flow does not explain an inferior STEMI. Stenting here is exactly the error that leads to stent thrombosis in a vessel with poor run-off.",
          next: "s1-marginal-stented", stateDelta: {"stability": -20, "flags": ["wrong-vessel"]} },
        {
          text: "Treat this vessel as a large acute marginal until proven otherwise; the PDA territory is unaccounted for, so look for an occluded true RCA.",
          best: true,
          feedback:
            "Correct. The true dominant RCA should bend twice in LAO, the second time sharply at the crux. Nothing here does, the LCx is not dominant, and the ECG is inferior. The likeliest explanation is an occluded true RCA beyond a large marginal.",
          next: "s2",
        },
        {
          text: "She must be left dominant; the infarct is from the LCx.",
          feedback:
            "The LCx is small, non-dominant and free of disease on the left injection. Dominance is an observation, not an assumption; here it points away from the LCx.",
          next: "s2",
        },
        {
          text: "Perform a non-selective right sinus injection to look for a separate conus artery.",
          feedback:
            "A separate conus matters when looking for Vieussens' collaterals, but it does not explain an absent PDA. The priority is to find the true RCA.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "Which views and injections will settle the anatomy fastest?",
      options: [
        {
          text: "An RCA injection in RAO 30 degrees, scrutinising the mid RCA in the AV groove for a stump, and a review of the late frames of the left injections for collateral filling of a PDA.",
          best: true,
          feedback:
            "RAO separates the AV groove from the ventricular branches, so a marginal and a true RCA stump diverge clearly. Late left frames show whether septal or apical collaterals are filling the PDA territory.",
          next: "s3",
        },
        {
          text: "LAO cranial on the RCA only.",
          acceptable: true,
          feedback:
            "Cranial angulation opens the crux, and an empty crux supports the diagnosis, but it does not show the stump or separate the marginal from the AV groove as well as RAO.",
          next: "s3",
        },
        {
          text: "A left ventriculogram to see which wall is akinetic.",
          feedback:
            "This adds contrast and time in a hypotensive patient with right ventricular involvement, delays reperfusion, and does not identify the culprit vessel.",
          next: "s3",
        },
        {
          text: "IVUS of the marginal branch to characterise the 60% lesion.",
          feedback:
            "Imaging a non-culprit branch delays reperfusion and answers the wrong question.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "How do you interpret these findings?",
      info:
        "RAO 30 degrees: the large vessel runs along the margin of the right ventricle, on the ventricular side of the AV groove. At its origin a 2 mm nub points posteriorly along the AV groove and stops abruptly. On the late frames of the LAO caudal left injection, two inferior septal branches fill faintly from LAD septals; the PDA itself is not seen.",
      options: [
        {
          text: "Acute occlusion of the true mid RCA just beyond a large acute marginal branch; the faint septal filling is early Rentrop grade 1 collateral flow.",
          best: true,
          feedback:
            "Correct. The nub in the AV groove is the occluded RCA. Faint filling of side branches without the main epicardial vessel is Rentrop 1, which about half of patients show within the first day of an occlusion.",
          next: "s4",
        },
        {
          text: "A chronic total occlusion of the RCA; the acute culprit must be elsewhere.",
          feedback:
            "Well-developed, grade 3 collaterals take around two weeks to appear. Faint grade 1 filling a few hours into an inferior STEMI fits an acute occlusion.",
          next: "s4",
        },
        {
          text: "A normal variant: a small RCA ending as an acute marginal.",
          feedback:
            "A small RCA ending in a marginal occurs with a dominant LCx. Here the LCx is non-dominant, there is a stump in the AV groove and septal collaterals are appearing.",
          next: "s4",
        },
        {
          text: "Spasm of the mid RCA; give intracoronary nitrate and reassess.",
          feedback:
            "An abrupt stump with collateral filling of the distal territory in a STEMI is an occlusion. Nitrate is reasonable once flow is restored, but it will not reopen this vessel.",
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      prompt: "You switch to a 6 F JR4 guide and a workhorse wire. Two attempts in a row send the wire into the acute marginal. What helps most?",
      options: [
        {
          text: "Work in RAO, where the AV-groove continuation and the marginal separate, and shape the wire tip to point posteriorly into the stump.",
          best: true,
          feedback:
            "RAO is the view that separates the true RCA from the marginal and is recommended for wiring a mid-RCA lesion when the wire keeps choosing the marginal. A shaped tip aimed at the stump usually crosses a fresh occlusion easily.",
          next: "s5",
        },
        {
          text: "Change to a stiff, polymer-jacketed wire and push firmly.",
          feedback:
            "A fresh thrombotic occlusion is soft. A stiff hydrophilic wire pushed blindly risks dissection or perforation; direction, not force, is the problem.",
          next: "s4-stiff-wire-exit", stateDelta: {"stability": -15} },
        {
          text: "Balloon the acute marginal to open up the origin.",
          feedback:
            "Treating the marginal does nothing for the culprit, and its 60% lesion does not need treatment.",
          next: "s5",
        },
        {
          text: "Stop and refer for emergency CABG.",
          feedback:
            "This is a straightforward wiring problem in a STEMI, not a surgical lesion.",
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      prompt: "How do you plan the stent?",
      info:
        "The wire crosses into the true RCA. After a 2.0 mm balloon, flow returns. In LAO the RCA now shows a gentle bend at the acute margin and a sharp second bend at the crux, giving a large PDA and two posterolateral branches. There is a thrombus-laden 80% mid-RCA lesion. The proximal reference is about 3.5 mm and the distal RCA before the crux about 3.0 mm. Blood pressure 110/70 mmHg.",
      options: [
        {
          text: "One stent sized to the reference vessel, covering the lesion from healthy segment to healthy segment and landing in the 3 mm distal RCA before the crux; confirm the result in two orthogonal views and check TIMI flow and the marginal.",
          best: true,
          feedback:
            "This treats the culprit with good inflow and outflow. Two views confirm full coverage and expansion; TIMI 3 flow and an intact marginal complete the check.",
        },
        {
          text: "A long stent from the mid RCA down into the PDA to cover every hazy segment.",
          feedback:
            "Extending a long stent into a smaller distal branch with limited territory is the 'stenting towards the tip' error: poor run-off predisposes to stent thrombosis. Haziness after thrombus often settles; stent the lesion, not the whole artery.",
        },
        {
          text: "Stent the 60% acute marginal lesion as well while you are there.",
          feedback:
            "RV marginal branches are rarely treated: the right ventricle tolerates branch disease well and this lesion is not causing the infarct. Extra stents add risk without benefit.",
        },
        {
          text: "Leave it after balloon angioplasty alone.",
          feedback:
            "In STEMI a drug-eluting stent is the standard treatment of the culprit lesion once flow is restored; balloon-only treatment leaves a high risk of reocclusion and restenosis unless there is a specific reason (for example SCAD).",
        },
      ],
    },
    {
      "id": "s1-marginal-stented",
      "kind": "consequence",
      "info": "A 3.0 mm stent is deployed in the 'RCA'. Flow in it is brisk, but she still has 3 mm inferior ST elevation and pain 7/10. The PDA territory still does not fill.",
      "prompt": "The stent looks good, yet the ECG and pain are unchanged. What do you conclude?",
      "options": [
        {
          "text": "The stented vessel was an acute marginal; look in RAO and on the left injection for the true, occluded RCA",
          "best": true,
          "feedback": "Persisting injury current with an unfilled PDA territory means the culprit has not been treated; find the true RCA.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Give intracoronary nitrate for presumed distal spasm and wait",
          "feedback": "Spasm does not explain an entire unfilled territory; the occluded true RCA is being missed.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Accept the result; ST elevation often takes hours to resolve",
          "feedback": "Slow resolution happens after successful reperfusion, not with ongoing pain and an unfilled territory.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
    {
      "id": "s4-stiff-wire-exit",
      "kind": "consequence",
      "info": "The polymer-jacketed wire advances easily, but in RAO its tip lies outside the expected AV-groove course, with a faint stain around it.",
      "prompt": "The wire is probably subintimal or has exited the vessel. What now?",
      "options": [
        {
          "text": "Stop advancing, withdraw the wire to the proximal true lumen, image for extravasation and redirect with a softer, shaped workhorse wire in RAO",
          "best": true,
          "feedback": "Recognise the wrong course early, check for perforation and go back to controlled wiring.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Follow the wire with a balloon to see where it is",
          "feedback": "A balloon over a subintimal or perforating wire extends the dissection or enlarges the hole.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Continue pushing until the tip reaches the crux",
          "feedback": "Forcing a stiff hydrophilic wire is how dissections and perforations are created.",
          "stateDelta": {
            "stability": -15
          }
        }
      ]
    },
  ],
  outcome:
    "The true mid RCA was stented with TIMI 3 flow into a large PDA and posterolateral branches. ST elevation resolved, blood pressure recovered and the bradycardia settled. Echo the next day showed inferior hypokinesis with recovering right ventricular function. Had the acute marginal been stented, the infarct would have continued and the stent would have sat in a vessel with poor run-off.",
  outcomeVariants: [
    {
      "flag": "wrong-vessel",
      "text": "An unnecessary stent was left in the acute marginal branch, which now needs dual antiplatelet therapy cover and future surveillance."
    }
  ],
  learningPoints: [
    "In LAO a true dominant RCA bends twice, the second time sharply at the crux; a smooth, straight vessel is an acute marginal until proven otherwise.",
    "Ask what is missing: an absent PDA with a non-dominant LCx means the true RCA has not been seen.",
    "RAO separates the AV groove from the acute marginals: use it to find the stump and to steer the wire.",
    "Faint Rentrop 1 collaterals within hours of an occlusion are expected; grade 3 collaterals suggest a chronic occlusion.",
    "Stents need run-off: never land a stent in a small vessel with a tiny territory.",
  ],
  refs: ["supplied-eh-views", "rentrop-1985", "supplied-angio-atlas", "esc-acs-2023"],
};

const caseScad: CaseStudy = {
  id: "dx-case-scad",
  title: "Young woman with an anterior STEMI and a long smooth narrowing",
  trackId: "diagnostic",
  stage: 2,
  provenance: { kind: "synthetic", basedOn: "SCAD principles and cases in the supplied EH notes and the ESC SCAD position paper." },
  summary:
    "A post-partum woman with an anterior STEMI whose LAD shows a long, smooth narrowing: spasm, SCAD or atherosclerosis, and when to leave it alone.",
  presentation:
    "A 39-year-old woman, four months post-partum, develops severe central chest pain while carrying her baby upstairs. She has never smoked and has no known risk factors. Blood pressure 128/78 mmHg, heart rate 92 bpm. ECG: 2 mm ST elevation in V2–V5. She receives aspirin and unfractionated heparin and is taken for primary PCI via the right radial artery.",
  findings: [
    "Anterior STEMI in a young post-partum woman",
    "Few or no atherosclerotic risk factors",
    "Haemodynamically stable; pain improving on arrival",
  ],
  steps: [
    {
      id: "s1",
      prompt: "What is your next step?",
      info:
        "Pain 3/10 on arrival. Left coronary with a JL3.5 in RAO cranial and LAO cranial: the proximal LAD is normal. From the mid LAD the vessel tapers smoothly over about 45 mm to a uniformly narrow calibre (about 70–80%), then returns to near-normal calibre before the apex. No calcium, no irregularity and no visible flap. The coronary arteries are tortuous; the LCx and RCA are normal. TIMI 3 flow in the LAD.",
      options: [
        {
          text: "Give intracoronary nitrate after checking the blood pressure, and repeat the injection in the same projections.",
          best: true,
          feedback:
            "Vasospasm is the first differential for a long smooth narrowing and the nitrate test is quick and safe. Repeating in identical views makes the comparison meaningful.",
          next: "s2",
        },
        {
          text: "Predilate and stent the narrowed segment with a long drug-eluting stent.",
          feedback:
            "The diagnosis is not yet established. If this is spasm, a stent is unnecessary; if it is SCAD, balloon inflation and stenting can propagate the haematoma and turn a self-healing lesion into an occlusion.",
          next: "s1-scad-stent-extension", stateDelta: {"stability": -20, "flags": ["scad-stented"]} },
        {
          text: "OCT of the LAD before deciding anything.",
          feedback:
            "Imaging is not the first step: nitrate may resolve the question. In SCAD, intracoronary imaging carries a real risk of extending the dissection and is reserved for cases in which it will change management.",
          next: "s2",
        },
        {
          text: "Conclude that the arteries are essentially normal and treat as myocarditis.",
          feedback:
            "A 70–80% narrowing in the territory of the ST elevation cannot be dismissed.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "What is the most likely diagnosis, and how would you classify it?",
      info:
        "After 200 micrograms of intracoronary glyceryl trinitrate the narrowing is unchanged in both views. Pain has settled; the ST elevation has improved but not fully resolved. TIMI 3 flow persists.",
      options: [
        {
          text: "SCAD with intramural haematoma, angiographic type 2A: a long smooth narrowing with normal calibre beyond it.",
          best: true,
          feedback:
            "A long, smooth, nitrate-resistant narrowing in tortuous vessels in a young post-partum woman is SCAD type 2. Because normal calibre returns before the apex, it is 2A rather than 2B.",
          next: "s3",
        },
        {
          text: "SCAD type 1.",
          feedback:
            "Type 1 needs a visible flap, double lumen or contrast staining of the wall. None is present.",
          next: "s3",
        },
        {
          text: "SCAD type 2B.",
          feedback:
            "Type 2B extends to the tip of the vessel. Here the calibre recovers before the apex, which makes it 2A.",
          next: "s3",
        },
        {
          text: "Diffuse atherosclerosis.",
          feedback:
            "The least likely option: a young woman without risk factors, smooth tapering, no calcium and otherwise normal arteries.",
          next: "s3",
        },
        {
          text: "Vasospasm.",
          feedback:
            "Spasm should have responded to nitrate; an unchanged narrowing makes SCAD the leading diagnosis.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "How do you manage her now?",
      options: [
        {
          text: "Conservative management: no PCI, admission to a monitored bed for several days, medical therapy per the local SCAD protocol (commonly including a beta-blocker), and no further instrumentation.",
          best: true,
          feedback:
            "With TIMI 3 flow, no ongoing ischaemia and stable haemodynamics, most SCAD heals. Monitoring for several days matters because extension tends to occur early.",
          next: "s4",
        },
        {
          text: "Stent the segment now to prevent extension.",
          feedback:
            "PCI in non-occlusive SCAD has high rates of failure and complications, mainly haematoma propagation, and there is nothing to gain while flow is preserved.",
          next: "s4",
        },
        {
          text: "IVUS to confirm the diagnosis before deciding.",
          feedback:
            "The angiographic diagnosis is clear and imaging would not change management, so the risk of extending the dissection is not justified.",
          next: "s4",
        },
        {
          text: "Systemic thrombolysis.",
          feedback:
            "There is no thrombus to lyse, and lysis can enlarge an intramural haematoma.",
          next: "s4",
        },
        {
          text: "Discharge tomorrow if the troponin peaks.",
          feedback:
            "Early extension is a recognised feature of SCAD; a short stay misses the period of highest risk.",
          next: "s3-early-discharge", stateDelta: {"stability": -10} },
      ],
    },
    {
      id: "s4",
      prompt: "What now?",
      info:
        "Six hours later she has recurrent severe pain with 3 mm ST elevation in V2–V5. Repeat angiography: the haematoma has extended distally and flow beyond the mid LAD is now TIMI 1. Blood pressure 105/65 mmHg.",
      options: [
        {
          text: "Minimalist PCI: advance a soft workhorse wire gently, confirm a distal true-lumen position in two views, then dilate at low pressure with an undersized balloon to restore flow, avoiding a stent if TIMI 3 flow returns.",
          best: true,
          feedback:
            "Occlusive SCAD with ongoing STEMI needs flow restored to save the apex, but with as little hardware as possible. Low-pressure, undersized balloon dilatation often decompresses the haematoma enough; stenting is kept for failure to restore flow.",
          next: "s5",
        },
        {
          text: "Long overlapping drug-eluting stents from the mid LAD to the apex.",
          feedback:
            "Long stents in a dissected, small distal vessel risk propagating the haematoma and leave a long metal segment in a vessel that would have healed. Reserve stenting for failure of the minimalist approach.",
          next: "s5",
        },
        {
          text: "Continue conservative management.",
          feedback:
            "Ongoing STEMI with TIMI 1 flow is the indication for revascularisation in SCAD; waiting means losing the apex.",
          next: "s5",
        },
        {
          text: "Emergency CABG.",
          feedback:
            "Surgery is considered for left main or proximal multivessel SCAD, or when PCI fails. A mid-to-distal LAD extension should first be approached percutaneously.",
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      prompt: "Which follow-up plan is most appropriate?",
      info:
        "After low-pressure dilatation with a 2.0 mm balloon, TIMI 3 flow returns with a residual smooth narrowing. Pain resolves. Echo: apical hypokinesis, ejection fraction 50%.",
      options: [
        {
          text: "Screen for fibromuscular dysplasia (for example CT or MR angiography of the head, neck, abdomen and pelvis), continue medical therapy, refer to cardiac rehabilitation with tailored exercise advice, counsel about future pregnancy, and document healing with CT coronary angiography rather than invasive angiography.",
          best: true,
          feedback:
            "FMD is common in SCAD and changes follow-up. Non-invasive imaging documents healing without the risk of catheter-induced dissection, and pregnancy counselling matters because of the association with the peripartum period.",
        },
        {
          text: "Routine invasive angiography at 6 weeks to check healing.",
          feedback:
            "Repeat catheterisation carries a risk of iatrogenic dissection in these arteries; CT coronary angiography is the preferred non-invasive way to document healing.",
        },
        {
          text: "High-intensity statin and 12 months of dual antiplatelet therapy as for atherosclerotic MI, with no further tests.",
          feedback:
            "SCAD is not atherosclerotic: statins are used only for standard indications, the role of prolonged dual antiplatelet therapy is debated, and this plan misses FMD screening and SCAD-specific counselling.",
        },
        {
          text: "Lifelong oral anticoagulation.",
          feedback:
            "There is no indication for anticoagulation in SCAD, and it may enlarge an intramural haematoma.",
        },
      ],
    },
    {
      "id": "s1-scad-stent-extension",
      "kind": "consequence",
      "info": "After predilatation, the narrowing extends distally and the mid LAD now has TIMI 1 flow with a new spiral filling defect. Pain 8/10, ST elevation worse.",
      "prompt": "Balloon inflation has propagated the haematoma. What is the safest next step?",
      "options": [
        {
          "text": "Stop further balloon work, confirm the wire is in the true lumen distally, and if flow is impaired use minimal, low-pressure intervention or a long stent only if needed to restore flow",
          "best": true,
          "feedback": "In SCAD, instrumentation extends the dissection; the goal is restoring flow with the least possible intervention.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Inflate a larger balloon at high pressure to tack the flap back",
          "feedback": "High pressure pushes the intramural haematoma further along the vessel.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Stent from the mid LAD to the apex with overlapping stents",
          "acceptable": true,
          "feedback": "Long stenting may be needed as a last resort, but the haematoma resorbs over weeks and leaves the stents malapposed.",
          "stateDelta": {
            "stability": -5
          }
        }
      ]
    },
    {
      "id": "s3-early-discharge",
      "kind": "consequence",
      "info": "Next morning, while you prepare her discharge letter, the nurse reports new chest pain with 2 mm ST elevation in V2–V4.",
      "prompt": "SCAD can extend in the first days. What do you do?",
      "options": [
        {
          "text": "Cancel discharge, repeat the ECG and troponin, and arrange repeat angiography if the pain and ST elevation persist",
          "best": true,
          "feedback": "Early extension is most common in the first days, which is why patients are monitored before discharge.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Discharge with sublingual nitrate and an outpatient review",
          "feedback": "Recurrent ischaemia in SCAD must be assessed before discharge.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Start a heparin infusion and continue the discharge plan for tomorrow",
          "feedback": "Anticoagulation may worsen an intramural haematoma and does not address the ischaemia.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "She remained pain free. CT angiography showed beading of both renal arteries consistent with fibromuscular dysplasia. Follow-up CT coronary angiography showed restoration of normal LAD calibre, and apical function recovered.",
  outcomeVariants: [
    {
      "flag": "scad-stented",
      "text": "Early stenting led to propagation of the haematoma and a long stented segment that will be malapposed once the haematoma resolves."
    }
  ],
  learningPoints: [
    "The first differential for a long smooth narrowing is vasospasm: give nitrate and repeat in the same views.",
    "SCAD type 2 is a long smooth narrowing from intramural haematoma; 2A has normal calibre beyond it, 2B runs to the tip.",
    "Non-occlusive SCAD with preserved flow and no ongoing ischaemia is managed conservatively with a period of in-hospital monitoring.",
    "Occlusive SCAD with ongoing infarction needs minimalist PCI: gentle wiring, true-lumen confirmation, low-pressure undersized balloon, stent only if needed.",
    "Avoid routine intracoronary imaging when the diagnosis is clear; screen for FMD and document healing non-invasively.",
  ],
  refs: ["supplied-eh-views", "scad-esc-2018", "scad-saw-2014"],
};

const caseLeftMain: CaseStudy = {
  id: "dx-case-left-main",
  title: "Suspected left main disease",
  trackId: "diagnostic",
  stage: 2,
  provenance: { kind: "synthetic", basedOn: "Left main imaging principles in the supplied EH notes and catheter safety in the supplied Oxford handbook." },
  summary:
    "A high-risk stress test points to left main disease: choosing the catheter and first view, reacting to a ventricularised trace, proving the lesion is real and finishing safely.",
  presentation:
    "A 71-year-old man has had exertional angina at about 100 metres for three months. An exercise ECG was stopped at 3 minutes: 3 mm horizontal ST depression in I, II and V3–V6, 1.5 mm ST elevation in aVR, and a fall in systolic blood pressure from 150 to 130 mmHg. Echo: normal LV function, aortic sclerosis without stenosis. eGFR 58. He is consented for angiography and possible PCI via the right radial artery.",
  findings: [
    "High-risk exercise test: early widespread ST depression with ST elevation in aVR and an exertional fall in blood pressure",
    "Normal LV function on a recent echo",
    "Mildly reduced renal function",
  ],
  steps: [
    {
      id: "s1",
      prompt: "Which catheter will you start with for the left coronary artery from the right radial?",
      options: [
        {
          text: "JL3.5",
          best: true,
          feedback:
            "From the right radial route a half size smaller than the femoral default usually seats coaxially and gently, which matters when the left main may be diseased.",
          next: "s2",
        },
        {
          text: "JL4",
          acceptable: true,
          feedback:
            "JL4 is the femoral and left radial default. It can work from the right radial, but it often sits high and may need more manipulation.",
          next: "s2",
        },
        {
          text: "JL5",
          feedback:
            "A long curve suits a dilated root. In a normal root from the right radial it will sit high and unstable.",
          next: "s2",
        },
        {
          text: "Amplatz Left 2",
          feedback:
            "Amplatz catheters engage deeply and forcefully: the wrong first choice when ostial left main disease is suspected.",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      prompt: "What will be your first projection for the left coronary artery?",
      options: [
        {
          text: "LAO straight, starting with a small test injection.",
          best: true,
          feedback:
            "LAO straight is orthogonal to the left main ostium and is the recommended first view when left main disease is suspected; a small test injection limits ischaemia if the ostium is tight.",
          next: "s3",
        },
        {
          text: "AP cranial.",
          acceptable: true,
          feedback:
            "AP cranial is one of the good ostial views, but LAO straight is the recommended first view in this situation.",
          next: "s3",
        },
        {
          text: "LAO caudal (spider).",
          acceptable: true,
          feedback:
            "The spider is excellent for the distal left main, but in caudal views the aortic cusp overlaps the ostium; take it once the ostium has been defined.",
          next: "s3",
        },
        {
          text: "RAO caudal.",
          feedback:
            "RAO views look down the barrel of the left main ostium and foreshorten it, so an ostial lesion can be missed entirely.",
          next: "s3",
        },
      ],
    },
    {
      id: "s3",
      prompt: "What do you do?",
      info:
        "As the JL3.5 tip enters the left main, the aortic pressure changes from 140/75 mmHg to 135/20 mmHg, with the diastolic pressure rising through diastole.",
      options: [
        {
          text: "Do not inject. Withdraw out of the ostium at once, confirm the aortic trace recovers, then perform a non-selective injection into the left sinus in LAO straight.",
          best: true,
          feedback:
            "This is a ventricularised trace: the catheter is obstructing the ostium. Withdrawing restores flow, and a sinus injection defines the ostium without wedging the catheter.",
          next: "s4",
        },
        {
          text: "Give a full-volume selective injection quickly to get the picture before he becomes ischaemic.",
          feedback:
            "Injecting into a ventricularised trace risks ostial dissection, prolonged ischaemia and ventricular fibrillation. At most, an experienced operator might use a single small puff while withdrawing; a full selective run is never appropriate.",
          next: "s3-lm-injection-vf", stateDelta: {"stability": -25, "flags": ["lm-vf"]} },
        {
          text: "Advance slightly to obtain a more stable position.",
          feedback:
            "Advancing deepens the obstruction and the risk of dissection.",
          next: "s4",
        },
        {
          text: "Change to a 4 F catheter with side holes and continue selective injections.",
          feedback:
            "Side holes can mask the warning sign without removing the obstruction at the ostium, and the lesion is still at risk from the tip.",
          next: "s4",
        },
      ],
    },
    {
      id: "s4",
      prompt: "Could this be catheter-induced spasm? How do you show the lesion is real?",
      info:
        "Non-selective injection with the catheter just below the ostium in LAO straight opacifies the left main well. There is a smooth 70% narrowing at the left main ostium. The LAD and LCx have no severe disease. The trace damps again whenever the catheter approaches the ostium. Blood pressure 138/74 mmHg.",
      options: [
        {
          text: "Give intracoronary nitrate into the sinus after checking the blood pressure, then repeat non-selective injections in two ostial views (LAO straight and AP cranial) without engaging.",
          best: true,
          feedback:
            "Nitrate relieves spasm; a non-selective injection removes the catheter stimulus; two orthogonal ostial views confirm the narrowing and its severity. A lesion that persists under these conditions is real.",
          next: "s5",
        },
        {
          text: "Accept it as fixed disease on the basis of this single view.",
          feedback:
            "One view, without nitrate, cannot exclude catheter-induced spasm or confirm severity. Ostial left main lesions change management too profoundly to rest on a single image.",
          next: "s5",
        },
        {
          text: "Re-engage selectively with an Amplatz Left for better opacification.",
          feedback:
            "A more aggressive catheter across a tight ostial left main lesion is the setting for catastrophic dissection.",
          next: "s5",
        },
        {
          text: "Cross the lesion now with a pressure wire through the diagnostic catheter.",
          feedback:
            "Physiology is for lesions of uncertain severity, needs a guide catheter positioned out of the ostium, and is not done through a damping diagnostic catheter. This lesion is already clearly severe.",
          next: "s5",
        },
      ],
    },
    {
      id: "s5",
      prompt: "What is the most appropriate way to finish?",
      info:
        "The narrowing is unchanged after nitrate in both views. RCA (JR4, LAO and AP cranial): dominant, with a 50% mid-RCA lesion. Contrast used so far: 70 mL.",
      options: [
        {
          text: "Omit the ventriculogram (recent normal echo), finish the study, write a structured report with segment-level findings, refer promptly to the heart team, and explain the findings and plan to the patient.",
          best: true,
          feedback:
            "Severe ostial left main disease in a stable patient is a heart team decision between CABG and PCI. The echo already answers the LV question, so the contrast is better saved.",
        },
        {
          text: "Proceed to ad hoc left main PCI because he was consented for possible PCI.",
          feedback:
            "Stable left main disease should be discussed by the heart team before revascularisation; consent for possible PCI is not an obligation to perform it.", next: "s5-adhoc-lm", stateDelta: {"stability": -15} },
        {
          text: "IVUS of the left main ostium today to measure the minimal lumen area.",
          feedback:
            "IVUS helps when a left main lesion is of uncertain severity. Here the lesion is clearly severe in two views after nitrate, and further instrumentation of a tight ostium adds risk without changing the decision.",
        },
        {
          text: "Discharge on medical therapy with routine outpatient follow-up.",
          feedback:
            "Severe left main disease with a high-risk stress test needs a prompt revascularisation decision, not routine follow-up.",
        },
      ],
    },
    {
      "id": "s3-lm-injection-vf",
      "kind": "consequence",
      "info": "During the forceful injection into the ventricularised left main the patient becomes unresponsive; the monitor shows ventricular fibrillation.",
      "prompt": "He has arrested in the lab. What do you do first?",
      "options": [
        {
          "text": "Defibrillate immediately (up to three stacked shocks) and pull the catheter out of the ostium",
          "best": true,
          "feedback": "Witnessed VF in the lab is shocked at once; removing the obstructing catheter removes the trigger.",
          "stateDelta": {
            "stability": 5
          }
        },
        {
          "text": "Start two minutes of chest compressions before the first shock",
          "feedback": "Immediate defibrillation is most effective in a monitored, witnessed arrest.",
          "stateDelta": {
            "stability": -15
          }
        },
        {
          "text": "Inject again to see what happened to the left main",
          "feedback": "More contrast into an obstructed left main prolongs ischaemia.",
          "stateDelta": {
            "stability": -20
          }
        }
      ]
    },
    {
      "id": "s5-adhoc-lm",
      "kind": "consequence",
      "info": "You start preparing for ad hoc left main PCI. The patient is stable; the heart team has not discussed him, and the consent covered 'possible PCI' in general terms.",
      "prompt": "A colleague asks whether this is appropriate. What do you do?",
      "options": [
        {
          "text": "Stop: finish the diagnostic study, explain the findings, and bring stable left main disease to the heart team",
          "best": true,
          "feedback": "Stable left main disease needs a heart team decision between PCI and CABG and a fully informed patient.",
          "stateDelta": {
            "stability": 0
          }
        },
        {
          "text": "Proceed, because he signed consent for possible PCI",
          "feedback": "Generic consent does not cover a decision between surgery and left main PCI that the patient has not discussed.",
          "stateDelta": {
            "stability": -10
          }
        },
        {
          "text": "Proceed but call the surgeon afterwards to inform them",
          "feedback": "Informing the surgeon after the event is not a heart team decision.",
          "stateDelta": {
            "stability": -10
          }
        }
      ]
    },
  ],
  outcome:
    "The heart team recommended CABG. Two weeks later he received a LIMA to the LAD and a vein graft to an obtuse marginal, and he was free of angina at follow-up.",
  outcomeVariants: [
    {
      "flag": "lm-vf",
      "text": "The VF arrest from injecting into an obstructed left main was avoidable: a ventricularised trace means do not inject."
    }
  ],
  learningPoints: [
    "When left main disease is suspected, start the left system with a gentle catheter (JL3.5 from the right radial) and make LAO straight the first view, with a test injection.",
    "A ventricularised trace on engagement means stop, withdraw and define the ostium with a non-selective sinus injection.",
    "Prove an ostial lesion is real: nitrate, no catheter contact, two orthogonal ostial views.",
    "RAO and caudal views are poor for the left main ostium.",
    "Stable left main disease goes to the heart team; do not proceed ad hoc simply because consent allowed it.",
  ],
  refs: ["supplied-eh-views", "supplied-oxford", "supplied-medmastery", "esc-revasc-2018"],
};

// ---------------------------------------------------------------------------
// Track export
// ---------------------------------------------------------------------------
export const diagnostic: Track = {
  id: "diagnostic",
  order: 1,
  title: "Diagnostic Angiography",
  tagline: "Access, catheters, engagement, views and interpretation",
  description:
    "Everything a diagnostic operator needs: when to study a patient, radial and femoral access, catheter choice and safe engagement, the full projection playbook for the left main, LAD, circumflex and RCA, reading stenosis and flow, the anatomical traps (acute marginal, collaterals, anomalies, spasm, SCAD), bypass grafts, ventriculography and reporting.",
  stage: 2,
  modules: [mIndications, mAccess, mCatheters, mViews, mInterpretation, mAnatomy, mGrafts, mLvReport],
  cases: [caseSmoothRca, caseScad, caseLeftMain],
};
