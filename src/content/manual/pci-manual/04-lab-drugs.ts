// Module pm-lab-drugs: sedation, vasodilators, vasopressors and inotropes, antiarrhythmics and contrast
// (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 2.1, 2.4, 2.6, 2.8, 3.1, 3.2, 3.3, 3.6, 3.7, 4.3, 5.3, 5.5, 6.3,
// 12.2, 15.1, 17.2, 18.3, 18.9, 19.3, 19.9, 24.2, 25.2, 28.1, 29.2; Oxford Handbook of Cardiac Catheterization and
// Coronary Intervention, chapters 1, 2, 3, 4, 6, 8, 9, 10, 11. Seven new references, checked on PubMed (see refs below);
// current anaphylaxis treatment from the Resuscitation Council UK 2021 guideline (rcuk-anaphylaxis-2021); updates from the
// 2021 ESC heart failure guideline (esc-hf-2021).
// Every claim is listed with its page in docs/curriculum/evidence/pm-lab-drugs.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-lab-drugs",
  title: "Sedation, vasodilators, pressors, antiarrhythmics and contrast",
  stage: 2,
  summary:
    "The drugs other than antithrombotics that you give or order in almost every case, taught as decisions at the table: how much sedation and how to reverse too much; which vasodilator, at what dose and by which route for spasm, radial protection, no-reflow and hyperaemia, and what to do when it drops the pressure or blocks the AV node; which vasopressor or inotrope for which kind of hypotension; amiodarone, lidocaine, atropine and the other rhythm drugs the manuals use in the lab; and contrast itself, from choosing an agent to recognising and treating anaphylaxis.",
  objectives: [
    "Titrate intravenous sedation and analgesia to comfort, monitor for its respiratory effects, reverse a benzodiazepine or opioid with the manuals' flumazenil and naloxone regimens, and explain why opioids slow oral P2Y12 inhibitor absorption in STEMI.",
    "Give intracoronary, intragraft, sublingual and intravenous nitroglycerin at a dose matched to the blood pressure, know its contraindications, and manage nitrate-induced hypotension.",
    "Choose between nicardipine, nitroprusside, verapamil and adenosine for radial protection, no-reflow and hyperaemia, deliver them where they will work, and recognise and treat adenosine-induced heart block, atrial fibrillation and ventricular fibrillation.",
    "Match the vasopressor or inotrope to the mechanism of hypotension, using the manuals' doses, and know when rising doses should prompt mechanical support instead.",
    "Use amiodarone, lidocaine, beta-blockers, verapamil, adenosine, flecainide, atropine and isoprenaline for the rhythms met in the lab, with their cautions, alongside defibrillation, cardioversion and pacing.",
    "Describe how contrast agents differ in ionicity, osmolality and viscosity and what that means at the table, and prevent, recognise and treat contrast reactions, including anaphylaxis by current UK guidance.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-sedation",
      title: "Sedation and analgesia: titrate, watch, reverse",
      minutes: 13,
      topics: ["ph-sedation"],
      sources: [
        { book: "brilakis-pci", loc: "3.1" },
        { book: "brilakis-pci", loc: "2.1" },
        { book: "brilakis-pci", loc: "2.4" },
        { book: "brilakis-pci", loc: "2.8" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "2.12" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 9: Cardioversion/defibrillation" },
        { book: "oxford-cath", loc: "ch 11: Communication" },
      ],
      refs: [...BOOKS, "kubica-impression-2016", "hoffman-flumazenil-1993"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis gives sedation to nearly every patient, and its only stated goal is comfort. Comfort is not a luxury: a patient in discomfort moves, and pain or anxiety drives up the heart rate and breathing rate, which can deepen ischaemia. Too much sedation, though, suppresses breathing. The foundation lesson introduced the drugs; this lesson takes you through dosing, watching and rescuing, step by step.",
        },
        { kind: "h", text: "Step 1: choose the drug and the first dose" },
        {
          kind: "table",
          caption: "Sedatives and analgesics in the two manuals (typical adult doses; follow your local sedation policy)",
          head: ["Drug", "Brilakis 3.1", "Oxford ch 1", "Notes"],
          rows: [
            ["Midazolam (benzodiazepine)", "0.5–1 mg IV, repeatable; acts for 15–80 minutes", "0.5–2.5 mg IV as the patient arrives on the table", "Relieves anxiety and the hypertension that comes with it (Oxford)"],
            ["Diazepam (as an emulsion)", "Not mentioned", "2–10 mg IV", "Oxford's alternative benzodiazepine"],
            ["Fentanyl (opioid)", "25–100 µg IV, repeatable; acts for 30–60 minutes", "Small aliquots, for example 25–50 µg, for additional sedation", "Analgesia as well as sedation; morphine and other opioids are alternatives (Brilakis)"],
          ],
        },
        {
          kind: "p",
          text: "Oxford names the patients who need smaller doses and closer watching: the elderly, those with advanced airways disease, those with significant comorbidity and the obese. Brilakis's monitoring chapter sets the target: enough sedation for acceptable comfort, without compromising breathing or the circulation. In practice that means small doses, repeated against the patient's response, rather than one large dose at the start.",
        },
        {
          kind: "steps",
          title: "Before the first dose",
          items: [
            {
              title: "Check the line and the baseline",
              detail:
                "Oxford wants a working venous cannula (preferably in the left arm) for sedation, fluids and emergency drugs, a good continuous ECG and a pulse oximetry trace confirming a saturation above 96% on room air.",
            },
            {
              title: "Decide on oxygen",
              detail: "Oxford gives supplemental oxygen to high-risk patients and to anyone who will receive large doses of sedation.",
            },
            {
              title: "Know who is giving it",
              detail:
                "In Brilakis's model the cath lab nurse usually gives the sedation and monitors ECG, pressure and saturation. Oxford's account of nurse-led sedation asks for safe cannulation, knowledge of the drugs' and reversal agents' pharmacokinetics, an understanding of the procedure and of when sedation is appropriate, judgement about fluids and blood pressure support in the light of the patient's ventricle and coronaries, monitoring of heart rate, blood pressure and oximetry after each dose, and the freedom to titrate the requested doses so the operator can concentrate on the case.",
            },
            {
              title: "Keep watching consciousness and breathing",
              detail:
                "Brilakis's monitoring checklist puts the level of consciousness and the breathing alongside comfort, and asks throughout whether the patient needs help to breathe, such as BiPAP or intubation.",
            },
          ],
        },
        {
          kind: "check",
          stem: "An 82-year-old woman with COPD and a BMI of 38 is anxious on the table before a radial angiogram. Her saturation is 94% on room air. Which plan fits the manuals?",
          options: [
            "Midazolam 2.5 mg and fentanyl 100 µg together, so that she is settled before the puncture",
            "Oxygen, then midazolam 0.5 mg, reassessing her breathing and saturation before any further dose",
            "No sedation at all, because benzodiazepines are contraindicated in chronic lung disease",
            "Fentanyl alone at 100 µg, because opioids do not depress breathing at analgesic doses",
          ],
          answer: 1,
          explanation:
            "She is elderly, obese and has airways disease, all groups in whom Oxford urges care, and her saturation is already below Oxford's 96% check, so she gets oxygen and small titrated doses. Sedation is not contraindicated: an anxious, under-sedated patient is also a cause of radial spasm. Large combined doses and the belief that opioids spare breathing are what lead to hypopnoea.",
        },
        { kind: "h", text: "Step 2: watch for too much" },
        {
          kind: "p",
          text: "The commonest harm is hypopnoea: sedation suppresses the drive to breathe. Brilakis prevents it by avoiding excessive doses and watching the saturation throughout. His monitoring chapter adds a warning about interpretation: a falling saturation may be hypoventilation from heavy sedation, but it can also be early pulmonary oedema, artefact or something else, and an arterial blood gas gives the fuller picture. Do not assume that every desaturation is the drug.",
        },
        { kind: "tip", id: "diag-sedation-titrate" },
        { kind: "h", text: "Step 3: rescue" },
        {
          kind: "steps",
          title: "Reversing over-sedation (Brilakis 3.1; typical doses, follow local protocol)",
          items: [
            { title: "Stop giving sedation", detail: "No further doses of either drug. Support the airway and give oxygen while you decide which agent to reverse." },
            {
              title: "Benzodiazepine: flumazenil",
              detail:
                "0.2 mg IV, injected across 15 seconds. No response at 45 seconds? A further 0.2 mg across 1 minute, then more at 1-minute intervals, up to 1 mg in total.",
            },
            {
              title: "After flumazenil: keep watching",
              detail:
                "The manual gives the regimen without cautions. A pharmacology review (Hoffman 1993) adds that sedation can return within 1–2 hours of flumazenil, so repeated doses or an infusion may be needed, and lists seizures and cardiovascular effects among its adverse reactions. Midazolam can act for up to 80 minutes, so keep monitoring breathing and saturation after a reversal rather than sending the patient straight back to an unmonitored bed.",
            },
            {
              title: "Opioid: naloxone",
              detail: "0.1–0.2 mg IV, repeated every 2–3 minutes until you reach the degree of reversal you want. Small steps restore breathing without abruptly abolishing analgesia.",
            },
            { title: "If breathing is still inadequate", detail: "Severe respiratory depression may need intubation: call for anaesthetic help early rather than late." },
          ],
        },
        {
          kind: "check",
          stem: "Ten minutes after midazolam 1 mg and fentanyl 50 µg, a patient's saturation falls to 86% and he is hard to rouse. Oxygen is on and the airway is supported. He has received only these two drugs. What does Brilakis's section 3.1 suggest next?",
          options: [
            "Give flumazenil 1 mg as a single rapid bolus to reverse everything at once",
            "Wait for the midazolam to wear off, which takes about 15 minutes",
            "Stop sedation and reverse in small steps: flumazenil 0.2 mg and naloxone 0.1–0.2 mg",
            "Intubate now, because reversal agents should not be used during the procedure",
          ],
          answer: 2,
          explanation:
            "Both drugs can suppress breathing, so both may need reversing, each in small titrated steps: flumazenil 0.2 mg over 15 seconds (repeated to a total of 1 mg) and naloxone 0.1–0.2 mg every 2–3 minutes. Midazolam can act for up to 80 minutes, so waiting is not a plan, and sedation can return after flumazenil, so monitoring continues once he wakes. Intubation is for severe depression that does not respond. And before blaming the drugs for any desaturation, Brilakis reminds you to consider pulmonary oedema and artefact.",
        },
        { kind: "h", text: "Opioids and oral antiplatelet drugs" },
        {
          kind: "p",
          text: "Opioids slow gastric emptying, which slows the absorption of oral P2Y12 inhibitors and can leave the patient poorly protected while stents are being placed. Brilakis therefore avoids opioids in STEMI unless they are needed, and if the oral load has been delayed this way he covers the gap with an intravenous antiplatelet agent (cangrelor or a GP IIb/IIIa inhibitor; the antithrombotics module covers both). The IMPRESSION trial measured the effect: in 70 patients with myocardial infarction, 5 mg of intravenous morphine before a 180 mg ticagrelor load cut total exposure to ticagrelor by 36% and to its active metabolite by 37%, delayed the peak ticagrelor concentration from 2 to 4 hours, and left more patients with high platelet reactivity.",
        },
        { kind: "tip", id: "pci-opioid-delays-p2y12" },
        { kind: "h", text: "Sedation as treatment" },
        {
          kind: "list",
          items: [
            "**Radial spasm.** Anxiety is one of its causes. Brilakis prevents spasm with adequate moderate sedation and treats it with more; rarely, severe spasm that traps equipment needs propofol or general anaesthesia. Oxford prevents spasm with mild sedation (an opiate and a benzodiazepine) before the radial puncture. The engaging module teaches the full spasm sequence.",
            "**Vasovagal reactions.** Brilakis notes that adequate sedation and hydration may reduce them.",
            "**Cardioversion in the lab.** Oxford performs it under intravenous benzodiazepine sedation or general anaesthesia.",
          ],
        },
        { kind: "tip", id: "diag-radial-spasm-release" },
        { kind: "h", text: "After the case" },
        {
          kind: "p",
          text: "Sedation outlasts the procedure. Oxford's nurses tell patients to avoid strenuous activity and alcohol for the first 48 hours, and, if sedation was given, not to sign legal documents in that time. Its communication chapter calls it unhelpful to give results to a patient still sedated with midazolam. Our advice follows from that: plan important discussions for when the patient is fully awake.",
        },
        {
          kind: "pitfalls",
          items: [
            "A large opening dose in an elderly, obese or lung-diseased patient instead of small titrated doses.",
            "Blaming sedation for every fall in saturation and missing pulmonary oedema.",
            "Giving flumazenil or naloxone as one large bolus instead of in the small repeated steps the manual describes.",
            "Stopping the monitoring once a reversed patient wakes: sedation can return as flumazenil wears off.",
            "Generous opioid in a STEMI patient who has just swallowed a P2Y12 loading dose, then stenting without platelet protection.",
            "Under-sedating an anxious patient before radial access and then fighting spasm for the rest of the case.",
            "Discussing results or consent for further treatment while the patient is still sedated.",
          ],
        },
        {
          kind: "pearl",
          text: "Name the reversal doses before you need them. When the nurse confirms at the brief that flumazenil and naloxone are in the room and how they will be given, a rescue later takes seconds rather than minutes.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, sedate an anxious patient before radial access in small steps, checking saturation and breathing after each dose, then complete the puncture. If the saturation falls, decide whether it is the drug or something else before you reverse anything.",
        },
        { kind: "video", id: "svTApfW9C_o", note: "Manual of PCI chapter video on sedation and analgesia (section 3.1)." },
        {
          kind: "keypoints",
          items: [
            "Sedate for comfort: discomfort causes movement, tachycardia and tachypnoea that can worsen ischaemia.",
            "Brilakis: midazolam 0.5–1 mg IV and fentanyl 25–100 µg IV, both repeatable; Oxford: midazolam 0.5–2.5 mg or diazepam 2–10 mg, plus fentanyl 25–50 µg aliquots; typical doses only.",
            "Go carefully in the elderly, the obese, advanced airways disease and significant comorbidity; give oxygen with large doses.",
            "Over-sedation: stop, support, then flumazenil 0.2 mg steps to 1 mg and naloxone 0.1–0.2 mg every 2–3 minutes; intubate if severe; keep monitoring, because sedation can return after flumazenil.",
            "A falling saturation is not always the sedation: think of pulmonary oedema and artefact.",
            "Opioids delay oral P2Y12 absorption (IMPRESSION: ticagrelor exposure down 36%); avoid them in STEMI unless needed and cover with an IV antiplatelet agent if necessary.",
            "Sedation also prevents and treats radial spasm; no important conversations while the patient is still sedated.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-nitrates",
      title: "Nitroglycerin: dose by pressure, route by purpose",
      minutes: 14,
      topics: ["ph-vasodilators"],
      sources: [
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 8: Intravascular ultrasound" },
        { book: "oxford-cath", loc: "ch 10: Pulmonary oedema" },
        { book: "oxford-cath", loc: "ch 5: Cardiomyopathy" },
      ],
      refs: [...BOOKS, "esc-hf-2021"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis sorts the lab's vasodilators by where they act. Nitroglycerin (glyceryl trinitrate, GTN) works mainly on the large, epicardial arteries; nicardipine, nitroprusside and adenosine work mainly on the small resistance vessels (verapamil, which he lists separately, also targets the microcirculation in no-reflow). The distinction decides which drug you reach for: a nitrate for spasm and for sizing the vessel you can see, a microvascular agent for flow that will not come back (next lesson).",
        },
        { kind: "h", text: "What nitroglycerin is for" },
        {
          kind: "list",
          items: [
            "**Before angiography.** Brilakis gives intracoronary nitroglycerin routinely before coronary angiography, so that spasm is prevented and the anatomy is read correctly; it also lets you size balloons and stents on a fully dilated vessel. Oxford notes that some operators give nitrate to every patient (a sublingual spray or an infusion started beforehand) so that all images are taken at maximal dilatation.",
            "**Spasm.** To prevent it, to treat it and to tell it from fixed disease, particularly at an ostium.",
            "**Hypertension and pulmonary oedema** (Brilakis, who gives no route for these goals). For pulmonary oedema Oxford uses an intravenous nitrate infusion (ch 10; see the table).",
            "**Around imaging.** Oxford gives intracoronary GTN before and after intravascular ultrasound to reduce spasm.",
            "**Radial protection.** As part of the radial cocktail given through the sheath (see the table below).",
          ],
        },
        { kind: "h", text: "Doses and routes" },
        {
          kind: "table",
          caption: "Nitrate doses in the manuals (typical adult doses; follow local protocol)",
          head: ["Route", "Dose", "Source and detail"],
          rows: [
            ["Intracoronary or intragraft bolus", "100–300 µg", "Brilakis 3.2 and 25.2 (spasm treatment, repeated if needed)"],
            ["Intracoronary before angiography, by systolic pressure", "Above 120 mmHg: 200 µg; 100–120 mmHg: 100 µg; below 100 mmHg: 50 µg or none", "Brilakis 6.3; then wait 1–2 minutes, since dilatation can take up to 2 minutes to develop"],
            ["Intracoronary GTN or isosorbide dinitrate", "100–250 µg boluses, repeatable", "Oxford ch 6; maximal dilatation may take 1–2 minutes"],
            ["Sublingual", "0.4 mg (Brilakis), or 1–2 puffs of GTN spray (Oxford)", "An alternative before angiography"],
            ["Intravenous nitroglycerin", "Start at 10 µg/min and add 10 µg/min every 5 minutes to effect, keeping systolic pressure above 100 mmHg; maximum 200 µg/min", "Brilakis 3.2"],
            ["Intravenous isosorbide dinitrate for pulmonary oedema", "2–10 mg/hour", "Oxford ch 10, considered only if systolic pressure is above 100 mmHg, alongside a loop diuretic (for example furosemide 80–100 mg IV), oxygen, sitting the patient up and CPAP. The 2021 ESC heart failure guideline uses a higher threshold: IV vasodilators may be considered (class IIb) when systolic pressure is above 110 mmHg"],
            ["Radial artery, through the sheath", "Brilakis: 100–200 µg after sheath insertion; Oxford's example cocktail: GTN 200–400 µg with verapamil 2.5 mg and heparin 2500 IU", "Brilakis 4.3 and 5.3; Oxford ch 3, which stresses that regimens vary. The heparin that protects the radial artery is the systemic dose: Brilakis usually gives 50 units/kg (5000 units at most) in a diagnostic study, noting that 100 units/kg may be more effective (antithrombotics module). He adds that a vasodilator before sheath removal may also lower the risk of radial occlusion"],
          ],
        },
        {
          kind: "p",
          text: "**Two ways to give the bolus.** Through the manifold, or directly into the guide via the introducer needle passed through the haemostatic valve (Brilakis's 'nitro on a stick'). Oxford adds two practical points: a patient already taking oral nitrates can still receive them, but a patient on an intravenous nitrate infusion may show a blunted response.",
        },
        { kind: "tip", id: "diag-nitrate-dose-by-pressure" },
        {
          kind: "check",
          stem: "You have engaged the left coronary for a diagnostic study. The aortic pressure is 108/64 mmHg. Using Brilakis's chapter 6 scheme, how much intracoronary nitroglycerin do you give before the first cine run?",
          options: [
            "200 µg, then inject straight away",
            "100 µg, then wait 1–2 minutes before acquiring",
            "50 µg, because any systolic pressure under 110 mmHg is too low for more",
            "None, because nitroglycerin is only needed when spasm is seen",
          ],
          answer: 1,
          explanation:
            "Systolic 100–120 mmHg calls for 100 µg; 200 µg is for a systolic above 120 mmHg, and 50 µg or none for below 100. Dilatation takes up to 2 minutes, so injecting at once wastes the effect. Brilakis gives nitroglycerin routinely before angiography to prevent spasm and size vessels accurately, not only when spasm appears.",
        },
        { kind: "h", text: "Spasm: catheter tip and beyond" },
        {
          kind: "steps",
          title: "Recognising and treating spasm",
          items: [
            {
              title: "Suspect it",
              detail:
                "Oxford's catheter-tip spasm usually follows ostial engagement: the pressure ventricularises and then falls, recovering only when the catheter is withdrawn. It is commonest in a non-dominant RCA and in vessels about the same calibre as the catheter, so smaller, lighter patients are at greater risk. During PCI, stiff wires that straighten a vessel can also provoke it, and cocaine or amphetamine use can cause refractory spasm.",
            },
            { title: "Free the ostium", detail: "Withdraw the catheter; Oxford notes that withdrawal alone may relieve spasm. Do not inject through a damped trace." },
            {
              title: "Give nitrate",
              detail: "After careful re-engagement, intracoronary nitrate separates spasm from ostial disease. Brilakis gives 100–300 µg and repeats it if needed; he also lists intracoronary calcium channel blockers as a treatment, without ranking the two.",
            },
            {
              title: "Escalate for refractory spasm",
              detail:
                "Oxford adds intracoronary verapamil for drug-induced (cocaine or amphetamine) spasm and keeps nitroprusside, combined with a calcium channel blocker such as verapamil, for intractable cases. If spasm will not yield to nitroglycerin, Brilakis uses OCT or IVUS to tell spasm from atherosclerotic narrowing.",
            },
            { title: "Document relief", detail: "Oxford records an image showing that the spasm has gone, so that it is not reported as a fixed stenosis." },
          ],
        },
        { kind: "tip", id: "diag-ostial-spasm-withdraw-nitrate" },
        { kind: "tip", id: "pci-wire-spasm-nitrate" },
        { kind: "h", text: "When not to give it, and what goes wrong" },
        {
          kind: "table",
          caption: "Nitroglycerin cautions (Brilakis 3.2 and 6.3)",
          head: ["Do not give, or give less, when", "Why"],
          rows: [
            ["The patient is hypotensive or hypovolaemic (for example fasted without IV fluid)", "Venodilation lowers preload and arterial dilatation lowers afterload"],
            ["Right ventricular infarction (acute inferior MI with RV involvement)", "Brilakis lists it as a reason not to give nitroglycerin and as a cause of hypotension after it (3.2, 6.3); neither manual gives the mechanism"],
            ["A PDE-5 inhibitor was taken recently: avanafil, sildenafil or vardenafil within 24 hours, tadalafil within 48 hours", "Brilakis names giving the two together as a cause of nitrate hypotension (3.2)"],
            ["Hypertrophic obstructive cardiomyopathy", "Lower preload and afterload worsen the outflow obstruction; Oxford uses sublingual GTN deliberately to provoke the gradient during a haemodynamic study"],
            ["High or repeated doses", "Cumulative hypotension; Brilakis lists avoiding excessive nitroglycerin among his measures for preventing hypotension"],
          ],
        },
        { kind: "tip", id: "diag-planning-pde5-nitrate" },
        {
          kind: "steps",
          title: "Nitrate-induced hypotension (Brilakis 3.2 and 6.3)",
          items: [
            { title: "Expect some fall", detail: "Brilakis notes that a drop in systemic pressure is common after intracoronary nitroglycerin; what matters is how far and for how long." },
            { title: "No more nitrate", detail: "Its half-life is short, 1.5 to 7.5 minutes, so the fall usually corrects within a few minutes." },
            { title: "Give saline and wait", detail: "Brilakis often gives saline prophylactically after nitroglycerin." },
            { title: "Vasopressor if severe or persistent", detail: "Noradrenaline (norepinephrine) or phenylephrine; chapter 6 names phenylephrine for severe cases." },
            {
              title: "Think of the other causes",
              detail:
                "Brilakis's list of causes goes beyond the nitrate itself: bleeding, a vasovagal reaction to the nitrate, false hypotension from the transducer or its connections, hypovolaemia in a fasted patient without IV fluid, RV infarction, and other vasodilators such as the verapamil given for radial access (6.3). If the pressure stays low, he asks you to look for these, bleeding among them.",
            },
          ],
        },
        {
          kind: "p",
          text: "Expect three lesser effects: headache from dilated intracranial arteries, dizziness and flushing, and a reflex tachycardia as the pressure falls.",
        },
        {
          kind: "check",
          stem: "A 59-year-old man is on the table for elective angiography. While you prepare the nitrate, he mentions he took tadalafil the previous evening, about 30 hours ago. His pressure is 128/76 mmHg. What do you do?",
          options: [
            "Give 200 µg intracoronary nitroglycerin, since more than 24 hours have passed",
            "Halve the nitroglycerin to 100 µg and give saline at the same time",
            "Give no nitroglycerin: tadalafil's exclusion window is 48 hours",
            "Postpone the angiogram until 72 hours after his last tadalafil dose",
          ],
          answer: 2,
          explanation:
            "The 24-hour window applies to avanafil, sildenafil and vardenafil; tadalafil's is 48 hours, so at 30 hours nitroglycerin is still contraindicated. A halved dose is still a nitrate given inside the window. There is no need to postpone the study: acquire without nitrate. Neither manual covers spasm after a PDE-5 inhibitor; our inference is that Brilakis's other spasm treatment, an intracoronary calcium channel blocker (25.2), is the alternative, given cautiously because it also lowers the pressure.",
        },
        {
          kind: "pitfalls",
          items: [
            "Giving nitrate into a damped or ventricularised trace instead of withdrawing first.",
            "Acquiring immediately after the nitrate, before its effect has developed.",
            "Forgetting the PDE-5 question, or applying the 24-hour window to tadalafil.",
            "Giving a nitrate in RV infarction, hypovolaemia or obstructive hypertrophic cardiomyopathy.",
            "Reporting catheter-tip spasm as an ostial stenosis because no post-nitrate image was taken.",
            "Expecting a nitrate to fix no-reflow: Oxford finds no evidence that nitrates help there.",
          ],
        },
        {
          kind: "pearl",
          text: "Read the aortic pressure aloud before every nitrate bolus. It turns Brilakis's dose ladder into a habit and catches the patient whose pressure has drifted since the start of the case.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, engage the RCA with a JR4 and read the systolic pressure. Choose the nitrate dose from it, give it with a free trace, wait 1–2 minutes and then acquire. If the trace damps on engagement, withdraw first and repeat the nitrate only once the trace is free.",
        },
        { kind: "video", id: "d-avT0fHUXM", note: "Manual of PCI chapter video on vasodilators (section 3.2)." },
        { kind: "video", id: "6HmNE36hBec", note: "Brilakis technique video on giving nitroglycerin 'on a stick'." },
        {
          kind: "keypoints",
          items: [
            "Nitroglycerin dilates the large arteries; use it for spasm, sizing, hypertension and pulmonary oedema, not for no-reflow.",
            "Intracoronary 100–300 µg (Brilakis) or 100–250 µg (Oxford); before angiography by pressure: 200, 100 or 50 µg/none; wait 1–2 minutes.",
            "IV nitroglycerin 10 µg/min, up by 10 every 5 minutes, systolic above 100 mmHg, maximum 200 µg/min; sublingual 0.4 mg.",
            "No nitrate in hypotension, hypovolaemia, RV infarction, HOCM, or after a PDE-5 inhibitor (24 hours; tadalafil 48 hours).",
            "Nitrate hypotension: stop, saline, wait (half-life 1.5–7.5 minutes), vasopressor if severe; consider bleeding, vasovagal reaction, transducer error, hypovolaemia, RV infarction and radial verapamil.",
            "Catheter-tip spasm: withdraw, re-engage carefully, give nitrate, document relief; refractory spasm may need verapamil or nitroprusside.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-microvascular",
      title: "Microvascular vasodilators: nicardipine, nitroprusside, verapamil and adenosine",
      minutes: 16,
      topics: ["ph-vasodilators"],
      sources: [
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "12.2" },
        { book: "brilakis-pci", loc: "18.3" },
        { book: "brilakis-pci", loc: "18.8" },
        { book: "brilakis-pci", loc: "18.9" },
        { book: "brilakis-pci", loc: "19.3" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "oxford-cath", loc: "ch 8: The 'no-reflow' phenomenon" },
        { book: "oxford-cath", loc: "ch 8: Vein graft PCI" },
        { book: "oxford-cath", loc: "ch 8: Pressure wire" },
        { book: "oxford-cath", loc: "ch 8: Rotational atherectomy" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "When the epicardial artery is open but contrast will not run off, the problem lies in the small vessels, and a large-vessel drug like nitroglycerin will not solve it. Four agents act there: nicardipine, nitroprusside, verapamil and adenosine. Each also has jobs of its own: verapamil protects the radial artery, adenosine produces hyperaemia for pressure-wire studies. This lesson covers how to choose, dose and deliver them, and the rhythm problems adenosine brings. The recognition and full management of no-reflow belong to the module on no-reflow and embolism; physiology indices belong to the physiology module.",
        },
        { kind: "h", text: "The four agents side by side" },
        {
          kind: "table",
          caption: "Doses in the manuals (typical adult doses; follow local protocol)",
          head: ["Agent", "Uses", "Brilakis", "Oxford (no-reflow)", "Main hazard"],
          rows: [
            [
              "Nicardipine (calcium channel blocker)",
              "Prevent and treat no-reflow, for example during atherectomy and SVG PCI; radial protection",
              "100–300 µg intracoronary or intragraft; 100–200 µg into the radial artery",
              "Not listed",
              "Hypotension, though less than nitroprusside or verapamil",
            ],
            ["Nitroprusside", "Prevent and treat no-reflow", "100–300 µg intracoronary", "50–100 µg intracoronary, repeatable", "Hypotension"],
            [
              "Verapamil (calcium channel blocker)",
              "Prevent radial spasm; prevent and treat no-reflow",
              "2–3 mg into the radial artery; 1 mg intracoronary over 2 minutes",
              "100–500 µg slow intracoronary injection, repeatable; beware heart block",
              "Hypotension; AV block",
            ],
            [
              "Adenosine",
              "Prevent and treat no-reflow; hyperaemia for physiology",
              "RCA 50–100 µg; left main 100–200 µg (several thousand µg, given slowly, in no-reflow); graft 100–200 µg; IV 140 µg/kg/min through a central or large peripheral vein",
              "30–50 µg intracoronary, repeatable; avoid in asthma and in patients taking dipyridamole",
              "AV block, atrial fibrillation, ventricular fibrillation",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Why nicardipine first.** Brilakis prefers nicardipine for preventing and treating no-reflow because it lowers the blood pressure less than nitroprusside or verapamil. He is not consistent about its duration: section 3.2 says it acts for a shorter time, while the bypass-graft chapter prefers it for its prolonged action. Treat duration as unsettled and judge by the response. Brilakis manages hypotension from nicardipine, nitroprusside or verapamil as for nitroglycerin: stop, give saline, wait, and use a vasopressor if it is severe.",
        },
        { kind: "h", text: "Where to give it" },
        {
          kind: "steps",
          title: "Delivering a microvascular vasodilator",
          items: [
            {
              title: "Prevention: through the guide",
              detail:
                "Before the risky step, inject into the artery through the guide (Oxford). Brilakis gives a vasodilator before atherectomy in most patients unless they are hypotensive, and gives nicardipine 100–300 µg into a vein graft both before and after PCI, especially if flow slows.",
            },
            {
              title: "Established no-reflow: go distal",
              detail:
                "With no antegrade flow, a drug injected into the guide refluxes into the aorta. Oxford gives it through an over-the-wire balloon or a multifunction probing catheter placed as close to the distal bed as possible; Brilakis uses a microcatheter, a dual-lumen catheter or an aspiration catheter advanced over the wire.",
            },
            {
              title: "Flush the guide after intracoronary adenosine",
              detail: "For physiology Brilakis flushes the guide afterwards so that the whole dose reaches the artery.",
            },
            {
              title: "Do not keep injecting contrast",
              detail:
                "Oxford warns that each extra contrast injection into a no-reflow vessel adds to the ischaemia. Give the drugs and time a chance to work, since flow commonly recovers with both. If hypotension persists, Oxford considers an intra-aortic balloon pump to raise coronary perfusion pressure.",
            },
            {
              title: "Vein grafts: drugs plus mechanical protection",
              detail:
                "In saphenous vein graft PCI the vasodilator complements an embolic protection device; it does not replace one. Brilakis uses protection devices in SVG PCI whenever technically feasible (18.8) and lists them among the ways to prevent no-reflow (25.2); Oxford, citing randomised trials, treats distal protection as mandatory in SVG PCI. A filter needs a landing zone beyond the lesion. If flow slows or stops with a filter in place, Brilakis aspirates through the guide and then retrieves the filter, which may be full of debris.",
            },
            {
              title: "Refractory no-reflow",
              detail:
                "Brilakis adds intracoronary adrenaline (epinephrine) when no-reflow is refractory, and lists it among the treatments for air embolism, where 0.05 mg has been used.",
            },
          ],
        },
        { kind: "tip", id: "pci-no-reflow-distal-vasodilator" },
        { kind: "tip", id: "pci-svg-intragraft-vasodilator" },
        {
          kind: "check",
          stem: "After stenting a degenerated vein graft, flow falls to TIMI 1. The graft is open with no dissection, and the pressure is 96/58 mmHg. Which drug plan best follows the manuals?",
          options: [
            "Intracoronary nitroglycerin 200 µg through the guide, repeated until flow returns",
            "Nicardipine through a microcatheter placed in the distal graft, watching the pressure",
            "Verapamil 2–3 mg injected quickly through the guide, as for the radial artery",
            "Repeated contrast injections to see whether flow improves before giving anything",
          ],
          answer: 1,
          explanation:
            "Established no-reflow needs a microvascular vasodilator delivered distally; Brilakis prefers nicardipine because it lowers the pressure less than nitroprusside or verapamil, which matters at 96 mmHg systolic. Nitrates have not been shown to help in no-reflow (Oxford). A radial verapamil dose is far larger than an intracoronary one, and given into a stagnant graft it mostly refluxes. Repeated contrast injections worsen ischaemia.",
        },
        { kind: "h", text: "Adenosine and the heart's rhythm" },
        {
          kind: "table",
          caption: "Adenosine's rhythm complications (Brilakis 3.2 and 12.2)",
          head: ["Problem", "Mechanism", "Prevention", "Treatment"],
          rows: [
            [
              "Heart block",
              "Direct effect on the AV node; most likely with injection into the RCA",
              "No high doses in the RCA (above 100 µg intracoronary in the RCA or a dominant circumflex, section 12.2); inject slowly; aminophylline before RCA atherectomy",
              "Watchful waiting, since adenosine is very short acting; ask the patient to cough; transient CPR and temporary pacing if block without an escape rhythm persists",
            ],
            [
              "Atrial fibrillation",
              "Ventricular ectopics during adenosine, sometimes during AV block; the commonest adenosine arrhythmia (2.7% after IV use)",
              "As for heart block",
              "Usually well tolerated, except with an accessory pathway. Cardioversion if it does not revert to sinus rhythm by itself (12.2), or amiodarone, a beta-blocker or a calcium channel blocker if cardioversion is not wanted (3.2)",
            ],
            [
              "Torsades de pointes or VF",
              "R-on-T after a pause, but it can occur without one",
              "As for heart block",
              "Ask the patient to cough forcefully, which can keep them conscious until the shock; defibrillate",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis illustrates how little it can take: in one of his cases, 40 µg of intracoronary adenosine into the RCA caused complete heart block and then atrial fibrillation, which needed cardioversion at the end of the case. Oxford adds that adenosine can cause flushing, chest tightness or chest pain, bronchospasm, bradycardia and AV block, and contraindicates it in asthma and with dipyridamole.",
        },
        {
          kind: "p",
          text: "**Aminophylline.** An A1 adenosine receptor antagonist. During atherectomy, injured red cells release adenosine, which is why bradycardia occurs when the artery supplying the AV node (usually the RCA) is treated. Brilakis may give aminophylline 250–300 mg IV over 10 minutes or 20–40 mg intracoronary to prevent it; alternatives are atropine 0.5–1.0 mg IV before atherectomy, a temporary pacemaker, or short test runs. Oxford pretreats with atropine when the baseline heart rate and ECG suggest a risk of severe bradycardia or complete heart block, and some operators place a temporary wire.",
        },
        { kind: "tip", id: "pci-adenosine-rca-dose" },
        { kind: "tip", id: "pci-adenosine-block-cough-wait" },
        {
          kind: "check",
          stem: "During a pressure-wire study of the RCA, you give intracoronary adenosine. The ECG shows complete heart block with no escape beats; the patient is conscious and the pressure is falling. What first?",
          options: [
            "Atropine 3 mg IV at once to override the block",
            "Ask the patient to cough forcefully while the adenosine wears off",
            "Aminophylline 250 mg IV over 10 minutes",
            "Synchronised DC cardioversion",
          ],
          answer: 1,
          explanation:
            "Adenosine's effect lasts seconds, so watchful waiting is the treatment, and forceful coughing keeps blood reaching the brain meanwhile. Only if block without an escape rhythm persists do transient CPR and temporary pacing follow. Aminophylline over 10 minutes is a prevention given before RCA atherectomy, and cardioversion has no role in heart block. Prevent it next time: no more than 100 µg intracoronary into the RCA, given slowly.",
        },
        { kind: "h", text: "Hyperaemia for physiology" },
        {
          kind: "p",
          text: "Brilakis gives intracoronary adenosine 50–100 µg in the RCA and 200 µg in the left main (up to 600 µg in some studies), or 140–180 µg/kg/min intravenously; section 3.2 gives the IV rate as 140 µg/kg/min. With an intravenous infusion he takes the measurement 1–3 minutes after starting, once hyperaemia is stable; a fall in systolic pressure of about 10 mmHg and a rise in heart rate of 5–10 beats per minute suggest the drug is working. Oxford notes that the intravenous infusion gives more stable hyperaemia than intracoronary boluses but takes 60–90 seconds to reach it and causes slightly more side effects. Alternatives are regadenoson (costly) and papaverine (not available in the United States, and usually avoided because it can cause ventricular arrhythmias, including VF; where it is used, Brilakis gives 8 mg into the RCA and 12 mg into the left main). The physiology module teaches the measurement, including why hyperaemia sometimes fails, for example after caffeine.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting a vasodilator into the guide when the artery is not flowing; it never reaches the microcirculation.",
            "Treating no-reflow with repeated nitrate and contrast injections.",
            "Giving more than 100 µg of intracoronary adenosine into the RCA, or injecting it fast.",
            "Using adenosine in an asthmatic patient or one taking dipyridamole.",
            "Choosing verapamil or nitroprusside in a hypotensive patient when nicardipine, which lowers the pressure less, is available.",
            "Forgetting to flush the guide after an intracoronary adenosine bolus.",
            "Relying on a vasodilator alone in a degenerated vein graft when an embolic protection device could be used.",
          ],
        },
        {
          kind: "pearl",
          text: "Prevention beats rescue. Brilakis gives the vasodilator before atherectomy and before and after vein graft stenting, and Oxford calls established no-reflow difficult to treat: the drug works best when it is already in the microcirculation as the debris arrives.",
        },
        {
          kind: "sim",
          sim: "physiology",
          task: "In the physiology lab, induce hyperaemia in the RCA with intracoronary adenosine at no more than 100 µg, injected slowly with the guide engaged, then flush the guide. Repeat in the left system at 200 µg, and compare with an intravenous infusion at 140 µg/kg/min.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (calcified mid-RCA), before any atherectomy decide how you will prevent bradycardia (aminophylline, atropine, pacing or test runs) and give a microvascular vasodilator unless the patient is hypotensive. If the lab reports slow flow or no-reflow, deliver the vasodilator distally rather than through the guide.",
        },
        { kind: "video", id: "d-avT0fHUXM", note: "Manual of PCI chapter video on vasodilators (section 3.2)." },
        {
          kind: "keypoints",
          items: [
            "Microvascular vasodilators: nicardipine, nitroprusside, verapamil, adenosine; nitrates do not help no-reflow.",
            "Brilakis prefers nicardipine 100–300 µg for no-reflow because it lowers the pressure least; nitroprusside 100–300 µg; verapamil 1 mg IC over 2 minutes (2–3 mg radial).",
            "Oxford no-reflow doses: verapamil 100–500 µg, adenosine 30–50 µg, nitroprusside 50–100 µg, all repeatable.",
            "Prevent through the guide; treat established no-reflow distally through a microcatheter, over-the-wire balloon or dual-lumen catheter.",
            "In vein grafts the vasodilator complements an embolic protection device, used whenever feasible; slow flow with a filter in place: aspirate, then retrieve the filter.",
            "Adenosine: RCA 50–100 µg (not above 100), left main 100–200 µg, IV 140 µg/kg/min; inject slowly; avoid in asthma and with dipyridamole.",
            "Adenosine heart block: wait and cough; AF: cardiovert or rate/rhythm drugs; VF: cough and defibrillate.",
            "RCA atherectomy: aminophylline 250–300 mg IV over 10 minutes (or 20–40 mg IC), atropine, pacing or test runs.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-pressors",
      title: "Vasopressors and inotropes: match the drug to the mechanism",
      minutes: 14,
      topics: ["ph-vasopressors"],
      sources: [
        { book: "brilakis-pci", loc: "3.6" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "24.2" },
        { book: "brilakis-pci", loc: "17.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "2.8" },
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "oxford-cath", loc: "ch 10: Hypotension" },
        { book: "oxford-cath", loc: "ch 10: Myocardial infarction" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
      ],
      refs: [...BOOKS, "debacker-soap2-2010", "esc-hf-2021"],
      blocks: [
        {
          kind: "p",
          text: "A vasopressor raises the blood pressure by constricting vessels; an inotrope raises it by making the heart contract harder. Most intravenous adrenergic drugs do some of both, and the balance between the two is what you choose a drug for. Before any of them, two questions come first: is the hypotension real (the monitoring module's checklist), and what is causing it? Drugs hold the pressure while you treat the cause; they do not replace treating it.",
        },
        { kind: "tip", id: "pci-mon-false-hypotension" },
        { kind: "h", text: "Step 1: name the mechanism" },
        {
          kind: "table",
          caption: "Brilakis's three mechanisms of true hypotension and where drugs fit (section 28.1)",
          head: ["Mechanism", "Lab examples", "First treatment", "Where pressors and inotropes fit"],
          rows: [
            ["Hypovolaemia", "Bleeding, poor hydration after fasting", "Saline and, for bleeding, blood and control of the bleeding site", "A bridge only; Oxford notes that a slow IV infusion is often all that a fasted, dehydrated patient needs"],
            ["Cardiac failure", "Ischaemia, LV or RV failure, acute regurgitation (including an Amplatz or deep EBU holding the aortic valve open), tamponade, brady- or tachyarrhythmia", "Treat the cause: revascularise, reposition the guide, drain the pericardium, correct the rhythm", "Inotropes and vasopressors, with mechanical support when they are not enough"],
            ["Peripheral vasodilation", "Vasovagal reaction, anaphylaxis, drugs such as nitroglycerin (especially after a PDE-5 inhibitor) or verapamil", "Stop the drug; fluids; atropine for vagal bradycardia; adrenaline for anaphylaxis", "A vasopressor (noradrenaline or phenylephrine) for severe or persistent drug-induced vasodilation (Brilakis 3.2, 6.3); adrenaline with fluid for anaphylaxis (28.1)"],
          ],
        },
        {
          kind: "table",
          caption: "When the cause is not obvious: Brilakis's right heart pattern for each mechanism (Fig. 28.1, described in words)",
          head: ["Mechanism", "Left ventricular filling pressure", "Cardiac output"],
          rows: [
            ["Hypovolaemia", "Low", "Low"],
            ["Cardiac failure", "High (but it can be low when the failing ventricle is the right one)", "Low"],
            ["Peripheral vasodilation", "Low", "High"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis finds right heart catheterisation very useful when the reason for true hypotension is not immediately apparent. Some causes need more than drugs. Acute mitral or aortic regurgitation may improve with a vasodilator but is often poorly tolerated and needs urgent or emergency surgery; acute mechanical support helps meanwhile, for example a balloon pump in acute mitral regurgitation. Tamponade is drained, but myocardial rupture, usually after an infarct, needs emergency surgery. If the patient arrests, he performs CPR, ideally with an automated chest compression device, and moves to VA-ECMO if recovery is not prompt.",
        },
        { kind: "h", text: "Step 2: choose the drug" },
        {
          kind: "table",
          caption: "Vasopressors and inotropes in Brilakis 3.6 (typical doses as printed in the manual; follow local protocol and give through a central line if possible)",
          head: ["Drug", "Action", "Dose in the manual", "When the manual favours it"],
          rows: [
            ["Phenylephrine", "Pure vasopressor", "50–100 µg IV bolus, then 0.5–1.4 µg/kg/min", "Hypertrophic cardiomyopathy, where an inotrope worsens the intracavitary obstruction; severe nitrate hypotension"],
            ["Noradrenaline (norepinephrine)", "Mainly vasopressor, some inotropy", "0.1–0.5 µg/kg/min infusion", "The preferred vasopressor in cardiogenic and septic shock; early use if hypotension develops during left main PCI"],
            ["Vasopressin", "Pure vasopressor", "0.03 U/min, rising by 0.005 U/min every 10–15 minutes to a maximum of 0.1 U/min", "—"],
            ["Dopamine", "Dose-dependent: inotropic and chronotropic at 5–10 µg/kg/min, mainly vasopressor above 10", "5–10 µg/kg/min (inotrope); 10–20 µg/kg/min (vasopressor)", "See SOAP II below"],
            ["Adrenaline (epinephrine)", "Vasopressor and inotrope in similar measure", "In arrest, 1 mg IV repeated at 3–5 minute intervals; in cardiogenic shock, an infusion of 2–10 µg/min", "Anaphylaxis has its own regimen (contrast reactions lesson). In cardiogenic shock after MI, a randomised trial comparing it with noradrenaline stopped early because of more refractory shock with adrenaline, and the 2021 ESC heart failure guideline prefers noradrenaline"],
            ["Dobutamine", "Pure inotrope", "Brilakis prints 10–40 µg/kg/min. The 2021 ESC heart failure guideline gives 2–20 µg/kg/min and advises starting inotropes at low doses and uptitrating under close monitoring; check the dose against the BNF or your local protocol", "Not specified by Brilakis. The ESC guideline keeps inotropes for LV systolic dysfunction with low output and low systolic pressure causing poor organ perfusion"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis's trigger for a vasopressor is a mean arterial pressure below 60 mmHg. In the left main chapter he goes further: if hypotension develops, start noradrenaline early, because these patients can collapse quickly, and have defibrillator pads on.",
        },
        { kind: "tip", id: "pci-hypotension-match-pressor" },
        { kind: "tip", id: "pci-left-main-early-noradrenaline" },
        {
          kind: "check",
          stem: "During PCI in a patient with known hypertrophic obstructive cardiomyopathy, the pressure falls to 78/50 mmHg after intracoronary verapamil. The trace is genuine and there is no bleeding. Which drug fits Brilakis's teaching?",
          options: [
            "Dobutamine, to raise cardiac output",
            "Adrenaline infusion at 2–10 µg/min",
            "Phenylephrine 50–100 µg IV, then an infusion if needed",
            "Dopamine at 5 µg/kg/min",
          ],
          answer: 2,
          explanation:
            "This is vasodilator hypotension in obstructive HCM. Phenylephrine is purely a vasopressor, so it raises the pressure without the inotropic effect that would worsen the outflow obstruction. Dobutamine is a pure inotrope, and adrenaline and low-dose dopamine both add inotropy, which is exactly what Brilakis warns against here. Fluid and stopping further vasodilator also belong in the plan.",
        },
        { kind: "h", text: "What goes wrong" },
        {
          kind: "steps",
          title: "Complications and how the manual handles them",
          items: [
            {
              title: "Hypertension",
              detail:
                "From too high a dose, or because the problem that caused the hypotension has been fixed. Catecholamines have short half-lives, so the pressure falls within minutes of stopping or reducing the infusion. Prevent it with the lowest effective dose and, where appropriate, mechanical support instead of escalating drugs.",
            },
            {
              title: "Arrhythmias",
              detail:
                "From excessive adrenergic stimulation and from the underlying disease, ischaemia above all. Use the lowest effective inotrope dose; treat with an antiarrhythmic such as lidocaine or amiodarone; refractory arrhythmias may need VA-ECMO.",
            },
            {
              title: "Radial spasm",
              detail: "Brilakis lists intravenous vasopressors among the causes of radial artery spasm (29.2), so expect a harder radial course in a patient on an infusion.",
            },
            {
              title: "A heart that cannot recover",
              detail:
                "In cardiogenic shock Brilakis warns that pressors and inotropes raise myocardial oxygen demand and can provoke arrhythmias, so they may work against recovery. He advises avoiding pure alpha agonists, which add afterload and give no inotropic support, and notes that early mechanical support can reduce the need for these drugs. His shock targets include keeping cardiac power output above 0.6 W while limiting escalating doses.",
            },
          ],
        },
        {
          kind: "p",
          text: "**SOAP II.** The trial behind the warning about dopamine randomised 1679 patients with shock to dopamine or noradrenaline as the first vasopressor. Death at 28 days did not differ significantly (52.5% versus 48.5%), but arrhythmias were twice as common with dopamine (24.1% versus 12.4%), and in a subgroup analysis of the 280 patients with cardiogenic shock dopamine was associated with more deaths at 28 days. Brilakis cites the trial for the excess arrhythmias (24.2) and, separately, names noradrenaline the preferred vasopressor in cardiogenic shock (3.6). The 2021 ESC heart failure guideline points out that the cardiogenic shock signal came from that subgroup alone, in which fewer than 10% had myocardial infarction, which limits how far it can be generalised; the guideline's recommendation is that a vasopressor, preferably noradrenaline, may be considered (class IIb). The shock module (acute and MCS track) covers milrinone, levosimendan and the drug-versus-device decision.",
        },
        {
          kind: "check",
          stem: "In a patient in cardiogenic shock during primary PCI, the team is escalating noradrenaline and has added dobutamine. The lactate is still rising and ventricular ectopics are increasing. What does Brilakis's teaching suggest?",
          options: [
            "Switch noradrenaline to dopamine, which supports both pressure and contractility",
            "Add phenylephrine to raise the pressure without increasing the heart rate",
            "Keep doubling the doses until the mean arterial pressure exceeds 65 mmHg",
            "Treat the arrhythmia and consider mechanical support rather than more drug",
          ],
          answer: 3,
          explanation:
            "Escalating catecholamines raise oxygen demand and provoke arrhythmias; Brilakis prevents both with the lowest doses and mechanical support, and treats the arrhythmia with lidocaine or amiodarone. Dopamine caused more arrhythmias than noradrenaline in SOAP II and was associated with more deaths in its cardiogenic shock subgroup. A pure alpha agonist adds afterload without inotropy, which Brilakis advises against in shock.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating a damped or disconnected trace with a vasopressor.",
            "Using a pressor to hide bleeding or tamponade instead of finding and treating it.",
            "Giving an inotrope in obstructive hypertrophic cardiomyopathy, where it worsens the obstruction.",
            "Choosing dopamine over noradrenaline in cardiogenic shock.",
            "Escalating doses without asking whether mechanical support would do the job with less harm.",
            "Leaving a high-dose infusion running after the cause has been fixed, and causing rebound hypertension.",
          ],
        },
        {
          kind: "pearl",
          text: "Before you start an infusion, say the mechanism out loud: empty, failing or dilated. It points to the treatment, to the right drug, and to the moment when drugs are no longer the answer.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, when the pressure falls, first confirm it is real, then classify the cause as hypovolaemia, cardiac failure or vasodilation, treat the cause, and only then choose a vasopressor or inotrope and say why.",
        },
        { kind: "sim", sim: "iabp", task: "Set up balloon pump support in a hypotensive patient whose noradrenaline dose keeps rising, and compare the pressure and the drug requirement before and after." },
        { kind: "video", id: "CzztgqvYo0A", note: "Manual of PCI chapter video on vasopressors and inotropes (section 3.6)." },
        {
          kind: "keypoints",
          items: [
            "Confirm the hypotension is real, then name the mechanism: hypovolaemia, cardiac failure or vasodilation; drugs bridge while you treat the cause.",
            "Vasopressors may be needed when the MAP is below 60 mmHg; give through a central line if possible.",
            "Phenylephrine (pure pressor) for HCM; noradrenaline preferred in cardiogenic shock; vasopressin is a pure pressor.",
            "Dopamine is inotropic at 5–10 µg/kg/min and a pressor above 10; SOAP II: more arrhythmias than noradrenaline, and more deaths in the cardiogenic shock subgroup.",
            "Adrenaline: 1 mg every 3–5 minutes in arrest, 2–10 µg/min in cardiogenic shock (ESC 2021 prefers noradrenaline); dobutamine is a pure inotrope: start low (ESC 2–20 µg/kg/min; Brilakis prints 10–40).",
            "If the cause is unclear, right heart catheterisation separates empty (low filling, low output), failing (high filling, low output) and dilated (low filling, high output).",
            "Complications: hypertension (stop or reduce; short half-lives) and arrhythmias (lidocaine or amiodarone; lowest doses; mechanical support).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-antiarrhythmics",
      title: "Antiarrhythmics and atropine in the lab",
      minutes: 16,
      topics: ["ph-antiarrhythmics"],
      sources: [
        { book: "brilakis-pci", loc: "3.7" },
        { book: "brilakis-pci", loc: "3.6" },
        { book: "brilakis-pci", loc: "19.3" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "11.1" },
        { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
        { book: "oxford-cath", loc: "ch 10: Risks of complications" },
        { book: "oxford-cath", loc: "ch 10: Vasovagal reaction" },
        { book: "oxford-cath", loc: "ch 4: Contrast media" },
        { book: "oxford-cath", loc: "ch 9: Cardioversion/defibrillation" },
        { book: "brilakis-pci", loc: "3.4" },
      ],
      refs: [...BOOKS, "esc-va-2022", "cheskes-dose-vf-2022"],
      blocks: [
        {
          kind: "p",
          text: "Oxford puts arrhythmia during diagnostic catheterisation and coronary angiography at 0.4%, and most rhythm disturbances in the lab are brief and benign: ectopics and sinus bradycardia during injections. Brilakis adds that lab arrhythmias are usually ischaemic, so treating the ischaemia often treats the rhythm, and that many follow reperfusion. Drugs therefore come after two questions: what did we just do, and is the patient stable? This lesson teaches the drugs; the complications module teaches the full arrhythmia algorithms, and the monitoring module the team's response to VF.",
        },
        { kind: "h", text: "Amiodarone" },
        {
          kind: "table",
          caption: "Amiodarone in Brilakis 3.7 (typical doses; follow local protocol and current resuscitation guidance)",
          head: ["Situation", "Dose"],
          rows: [
            ["Ventricular or atrial tachyarrhythmia that is not life-threatening", "150 mg over 10 minutes (repeat if it recurs), then 1 mg/min for 6 hours"],
            ["Ventricular fibrillation (refractory)", "300 mg IV push, then 1 mg/min for 6 hours"],
          ],
        },
        {
          kind: "table",
          caption: "What amiodarone can do wrong (Brilakis 3.7)",
          head: ["Problem", "Cause", "Prevention", "Treatment"],
          rows: [
            ["Hypotension", "An allergic reaction (look for angio-oedema or urticaria), or vasodilation and depressed contractility, partly from the solvents (polysorbate 80, benzyl alcohol)", "Care when the baseline pressure is low", "Stop the infusion; treat anaphylaxis if that is the cause; otherwise vasopressors and inotropes"],
            ["Bradycardia or AV block", "Direct slowing of AV nodal conduction", "Not in second- or third-degree block without a pacemaker", "Stop it; temporary pacing may be needed"],
            ["Torsades de pointes or VF", "Prolonged QT; pre-excitation (Wolff–Parkinson–White) with atrial fibrillation", "Not in either situation", "Defibrillate and stop the drug"],
          ],
        },
        {
          kind: "check",
          stem: "A patient develops atrial fibrillation at 140/min during right heart catheterisation. His ECG at baseline showed a short PR interval and delta waves, and he is haemodynamically stable. Which of these is contraindicated according to Brilakis?",
          options: [
            "Amiodarone 150 mg IV over 10 minutes",
            "Heparin 5000 IU IV, as Oxford gives for AF in the lab",
            "Flecainide 2 mg/kg IV, if he has no structural heart disease",
            "Synchronised DC cardioversion if he becomes unstable",
          ],
          answer: 0,
          explanation:
            "Brilakis lists pre-excitation with atrial fibrillation, alongside a long QT interval, as a reason not to give amiodarone, because it can cause torsades or VF. Oxford gives heparin for AF in the lab and flecainide when there is no known structural heart disease; neither manual contraindicates either drug in pre-excitation. Synchronised cardioversion is the treatment if he becomes unstable. Brilakis also notes that adenosine-induced AF is usually well tolerated except when there is an accessory pathway.",
        },
        { kind: "h", text: "Ventricular arrhythmias in Oxford's lab" },
        {
          kind: "steps",
          title: "VF and VT (Oxford ch 10)",
          items: [
            {
              title: "VF: shock first",
              detail:
                "Usual causes are catheter manipulation near a stenosed ostium, a catheter plugging a vessel (for example the intermediate), a conus injection, or ischaemic complications such as dissection or air. Contrast that cannot clear because the catheter occludes the ostium can also trigger VF or VT (Brilakis 15.1): disengage. Defibrillate at once following advanced life support. If VF resists shocks, consider amiodarone 300 mg IV and a different defibrillator, and correct potassium and magnesium. Since the manuals, the DOSE VF trial (2022) found better survival to hospital discharge in out-of-hospital shock-refractory VF when the pads were moved to an anterior–posterior position or two defibrillators delivered shocks in rapid sequence, compared with standard shocks.",
            },
            {
              title: "VT that is poorly tolerated",
              detail: "Synchronised DC cardioversion under sedation or general anaesthesia, 200–360 J or the biphasic equivalent.",
            },
            {
              title: "VT that is tolerated",
              detail:
                "Oxford's options are an IV beta-blocker (metoprolol, for example, as a 5 mg bolus) or amiodarone 150 mg infused across 10 minutes into a large vein, either of which may be repeated. Watch for hypotension, tell an anaesthetist and prepare to cardiovert. If the pressure holds, lidocaine is another choice: 50 mg IV given across 2 minutes, then again at 5-minute intervals, up to 200 mg in total.",
            },
            {
              title: "Stable monomorphic VT: overdrive pacing",
              detail:
                "With a pacing wire in the RV, pace 15–20 beats per minute faster than the VT, at high output (5–10 V) if needed. You know you have captured the ventricle when the QRS shape changes and the monitored rate rises to the paced rate; stop abruptly after 5–10 seconds of capture. It terminates 80–90% of sustained monomorphic VT but can accelerate it into pulseless VT or VF, so be ready to defibrillate. Background pacing at 90–110 bpm can then prevent recurrence, especially when pauses or bradycardia set it off.",
            },
            { title: "If VT persists", detail: "Synchronised DC shock under sedation or anaesthesia." },
          ],
        },
        {
          kind: "p",
          text: "**What has changed since the manuals.** Oxford tries drugs first for tolerated VT and shocks if it persists. The 2022 ESC ventricular arrhythmia guideline now makes synchronised cardioversion the first-line treatment (class I) even for haemodynamically tolerated sustained monomorphic VT, provided the risk of the sedation or anaesthesia is low; in the lab, sedation is already in use and Oxford has an anaesthetist informed. For a regular broad-complex tachycardia with known or suspected structural heart disease, its preferred drug is IV procainamide (class IIa) where available, with only a weaker recommendation for amiodarone; beta-blockers and verapamil belong to particular forms of idiopathic VT (outflow tract and left fascicular).",
        },
        { kind: "tip", id: "diag-vf-shock-then-amiodarone" },
        { kind: "tip", id: "pci-mon-vf-roles" },
        { kind: "h", text: "Supraventricular rhythms (Oxford ch 10)" },
        {
          kind: "table",
          caption: "Atrial fibrillation and SVT in the lab (typical doses; follow local protocol)",
          head: ["Situation", "Management"],
          rows: [
            ["AF from atrial irritation during right heart catheterisation, ischaemia or pericarditis", "Most episodes stop by themselves without treatment"],
            ["AF with severe compromise: rate above 150, hypotension and hypoperfusion, reduced consciousness, pulmonary oedema or ischaemia", "High-flow oxygen, heparin 5000–10,000 IU IV, immediate synchronised DC cardioversion under sedation or anaesthesia (200 J biphasic or 360 J monophasic)"],
            ["AF with mild to moderate compromise: rate below 150, breathlessness or mild hypotension", "Heparin 5000–10,000 IU IV, then weight-adjusted LMWH if AF persists. Flecainide 2 mg/kg (maximum 150 mg) IV over 30 minutes only when the circulation is good, the lungs are dry and there is no known structural heart disease, which Oxford takes to mean no history of coronary or valve disease and a normal echo; plan electrical cardioversion 2–3 hours later if it fails. Amiodarone 300 mg IV over 1 hour is an option, though it works poorly"],
            ["SVT (usually from catheter manipulation in the right atrium or ventricle in a patient predisposed to it, for example by an accessory pathway)", "Usually narrow complex, but the QRS is wide when a bundle branch block or rate-dependent aberrant conduction is present. Vagal manoeuvres, such as carotid sinus massage, the Valsalva manoeuvre or applying ice (Oxford); adenosine 6–18 mg IV bolus followed by a saline flush; if SVT restarts at once, verapamil 5–10 mg by slow IV injection, but not with impaired LV function or significant hypotension; flecainide, esmolol or sotalol only after expert advice; DC cardioversion (200–360 J) if drugs fail. A first episode does not usually need prophylactic drugs; maintenance drugs or referral for ablation depend on how often, how long and how badly it recurs"],
          ],
        },
        {
          kind: "p",
          text: "**Note the two adenosine doses.** The intravenous bolus for SVT is 6–18 mg. The usual intracoronary boluses for no-reflow and physiology are 30–200 µg, although Brilakis allows up to several thousand micrograms, given slowly, into the left main in no-reflow. Say the unit aloud when you order it.",
        },
        {
          kind: "p",
          text: "**Heparin for AF.** Oxford's heparin dose is written for AF arising during a catheter study. A patient having PCI is usually already anticoagulated to an ACT target (antithrombotics module), so in that setting our advice is to check the ACT before adding a further bolus rather than giving the AF dose on top.",
        },
        { kind: "h", text: "Bradycardia and atropine" },
        {
          kind: "steps",
          title: "Slow rhythms in the lab",
          items: [
            {
              title: "Injection bradycardia",
              detail:
                "Transient bradycardia or a junctional rhythm is common during contrast injection and usually recovers within seconds, by itself or with atropine 0.5–1 mg IV (Oxford). Transient ST changes and QRS widening during injection are also common.",
            },
            {
              title: "Think vasovagal",
              detail:
                "Oxford sees faints in 2–3% of catheter patients. Strong emotion, dehydration, mild starvation and the expectation of pain make them more likely, and young, anxious men seem most affected; they cluster around venepuncture, cannulation, arterial puncture and compression. The heart rate usually slows before the pressure falls, and the patient may turn pale, faint, stop breathing and look dead. Lie the patient flat, raise the legs, give atropine 0.5–1.0 mg IV and run saline quickly; if there is no improvement within a few minutes, reconsider the diagnosis (MI, tamponade or a retroperitoneal bleed). Tamponade can look the same but usually brings a tachycardia; if in doubt, Oxford gets an echocardiogram at once.",
            },
            {
              title: "Higher-degree block",
              detail:
                "Usually in patients with known conduction delay, from mechanical injury to a bundle branch (usually the right) or from ischaemia (typically RCA), and usually recovers within minutes unless ischaemia continues. First-degree and Mobitz I block rarely need urgent treatment; Mobitz II and complete block may need urgent temporary pacing. Atropine 1 mg IV may improve AV nodal conduction; isoprenaline (bolus 25–50 µg, infusion 5–10 µg/min) rarely improves conduction but can speed the sinus node.",
            },
            {
              title: "Atropine's dose ceiling and side effects (Brilakis 3.7)",
              detail:
                "0.5 mg IV push, repeated to a total of 3 mg. Expect rebound tachycardia when the cause of the bradycardia resolves or the dose was high (it usually settles without treatment; use the lowest dose), dry mouth, blurred vision from pupil dilatation, and flushing from cutaneous vasodilatation.",
            },
          ],
        },
        { kind: "tip", id: "diag-bradycardia-atropine-or-pace" },
        {
          kind: "check",
          stem: "Five minutes after femoral sheath removal, a 45-year-old man becomes pale, sweaty and nauseated. His heart rate falls from 72 to 44/min, then his pressure falls to 76/40 mmHg. The groin is soft. What do you give first?",
          options: [
            "Amiodarone 150 mg over 10 minutes",
            "Atropine 0.5–1.0 mg IV with legs raised and rapid saline",
            "Isoprenaline infusion at 5–10 µg/min",
            "Adrenaline 0.5 mg IM",
          ],
          answer: 1,
          explanation:
            "Slowing before hypotension, during sheath removal, in a pale, nauseated patient is a vasovagal reaction; Brilakis keeps atropine and fluids ready at sheath removal for exactly this. If he does not improve within minutes, reconsider: bleeding (including retroperitoneal), MI and tamponade. Adrenaline is for anaphylaxis, which usually brings tachycardia with skin or airway signs. Isoprenaline rarely improves AV conduction (Oxford); it mainly speeds the sinus node, and high-grade block that atropine does not fix needs temporary pacing.",
        },
        {
          kind: "pitfalls",
          items: [
            "Giving amiodarone in a long QT, pre-excited AF, or second- or third-degree block without a pacemaker.",
            "Reaching for drugs before the shock in VF.",
            "Repeating atropine for Mobitz II or complete block that needs pacing.",
            "Confusing the intravenous adenosine dose for SVT (milligrams) with intracoronary doses (micrograms).",
            "Giving verapamil for SVT to a patient with poor LV function or significant hypotension.",
            "Reaching for flecainide in AF in a patient with coronary or valve disease, who falls outside Oxford's definition of a structurally normal heart.",
            "Calling it vasovagal and not reconsidering when the patient fails to improve within minutes.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask what the catheter just did. Injection, conus filling, a wire in the RV outflow, an RCA adenosine bolus or a burr in the RCA explains most lab rhythms, and removing the trigger often works faster than any drug.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, inject the RCA and watch the rhythm: if bradycardia follows the injection, wait, then use atropine 0.5–1 mg if it persists. If the pressure damps on engagement, disengage before injecting again, since contrast that cannot clear can trigger VF.",
        },
        { kind: "sim", sim: "pacing", task: "Place a temporary wire in the RV and rehearse overdrive pacing for stable monomorphic VT: 15–20 beats per minute above the VT rate, high output, stop after 5–10 seconds of capture, defibrillator ready." },
        { kind: "video", id: "XBbKQZpKqso", note: "Manual of PCI chapter video on antiarrhythmics (section 3.7)." },
        {
          kind: "keypoints",
          items: [
            "Most lab arrhythmias are brief and caused by what you just did; ischaemia is the usual cause of the rest.",
            "Amiodarone: 150 mg over 10 minutes or 300 mg push in VF, each then 1 mg/min for 6 hours; avoid in long QT, pre-excited AF and high-grade block without pacing; watch for hypotension.",
            "VF: shock first; amiodarone 300 mg and a different defibrillator if it resists; correct K+ and Mg2+; the out-of-hospital DOSE VF trial supports changing the pad position or sequential shocks for refractory VF.",
            "Tolerated monomorphic VT: synchronised cardioversion under sedation first when the sedation risk is low (ESC 2022); Oxford's drug options are metoprolol 5 mg, amiodarone 150 mg or lidocaine 50 mg (to 200 mg); overdrive pacing; DC shock if it persists or is poorly tolerated.",
            "AF: usually self-limiting; unstable means heparin and synchronised DC shock; flecainide only with no known structural heart disease (no history of coronary or valve disease, and a normal echo), so rarely suitable in a patient with coronary disease.",
            "SVT: vagal manoeuvres, adenosine 6–18 mg IV, verapamil 5–10 mg if it restarts (not with poor LV or hypotension).",
            "Atropine 0.5 mg, up to 3 mg (Brilakis), or 0.5–1 mg (Oxford); pace Mobitz II and complete block.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-contrast-media",
      title: "Contrast media: what is in the syringe and what it does",
      minutes: 12,
      topics: ["rc-contrast-media-allergy"],
      sources: [
        { book: "brilakis-pci", loc: "3.3" },
        { book: "brilakis-pci", loc: "2.6" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "oxford-cath", loc: "ch 4: Contrast media" },
        { book: "oxford-cath", loc: "ch 10: Pulmonary oedema" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
      ],
      refs: [...BOOKS, "bednarczuk-eta-contrast-thyroid-2021"],
      blocks: [
        {
          kind: "p",
          text: "Contrast is the drug you give most, in the largest volume, in every case. Brilakis names two goals: to make the arteries visible under X-ray and to clear blood from the artery for OCT. Oxford explains how: iodine has a high atomic number, so a solution containing it absorbs X-rays far more than blood or tissue; iodine is soluble and relatively non-toxic, and the agents are excreted by the kidneys. The foundation lesson introduced the classes; here you learn what their properties mean at the table.",
        },
        { kind: "h", text: "How the agents differ" },
        {
          kind: "list",
          items: [
            "**Ionic or non-ionic.** The early agents were a single iodinated ring paired with a cation that separates from it in solution, which makes them strongly hyperosmolar. Linking two rings (an ionic dimer) raised the iodine per molecule and lowered the osmolality. Replacing the cation with a non-dissociating side chain produced non-ionic agents, whose osmolality is much lower. Oxford: non-ionic agents generally have better side-effect profiles but cost more.",
            "**Osmolality.** Hyperosmolar agents opacify well but pull water from the surrounding tissue; they cause the hot, uncomfortable feeling after injection and can harm the kidneys and the blood–brain barrier. Agents nearer to the osmolality of plasma cause fewer of these effects.",
            "**Viscosity.** A thick agent resists the syringe: it is slower and harder to push, particularly down a narrow catheter, and it fills the artery slowly.",
          ],
        },
        {
          kind: "table",
          caption: "Representative agents (figures from Oxford ch 4; generic names only)",
          head: ["Class", "Agent", "Iodine (mg/mL)", "Viscosity at 37 °C (cP)", "Osmolality (mOsm/kg water)"],
          rows: [
            ["Ionic monomer (high osmolality)", "Diatrizoate", "306", "5.0", "1530"],
            ["Ionic dimer (low osmolality)", "Ioxaglate", "320", "7.5", "580"],
            ["Non-ionic monomers (low osmolality)", "Iopamidol, iohexol, ioversol, iopromide, iobitridol", "300", "4.6–6.3", "610–695"],
            ["Non-ionic dimer", "Iotrolan", "300", "8.1", "320"],
            ["Non-ionic dimer (iso-osmolar)", "Iodixanol", "320", "11.4", "290"],
          ],
        },
        {
          kind: "check",
          stem: "You are injecting through a 4 Fr diagnostic catheter and the hand injection feels stiff, with sluggish filling of the vessel. Which property of the contrast is most likely responsible?",
          options: ["Its iodine concentration", "Its viscosity", "Its osmolality", "Its ionic charge"],
          answer: 1,
          explanation:
            "Viscosity governs how easily and quickly contrast can be pushed, and Oxford warns that viscous agents are hard to inject through small catheters and fill vessels slowly; the iso-osmolar dimer in the table is the most viscous. Osmolality drives heat, discomfort and fluid shifts, not resistance in the syringe. Brilakis adds that contrast can also cause pressure damping in 4 and 5 French catheters.",
        },
        { kind: "h", text: "Expected effects of every injection" },
        {
          kind: "table",
          caption: "Dose-dependent effects (Oxford ch 4 and ch 10; Brilakis 3.3)",
          head: ["Effect", "What you see", "What to do"],
          rows: [
            ["Heat, flushing, local discomfort", "Warmth; arm discomfort during internal mammary injection", "Warn the patient beforehand"],
            ["Haemodynamic load", "Vasodilatation, hypotension, depressed contractility, rising LVEDP; more marked with high-osmolar agents", "Oxford advises non-ionic agents in severe LV impairment, severe coronary disease and severe valve disease"],
            ["Pulmonary oedema", "Large volumes in LV impairment, raised LVEDP, severe aortic or mitral stenosis, or dialysis-dependent renal failure", "Keep volumes low; treat as in the nitrates lesson"],
            ["ECG changes", "Transient bradycardia (usually gone within seconds), ST changes, QRS widening; ventricular arrhythmias are uncommon", "Let the contrast clear; disengage if it cannot"],
            ["Kidney injury", "Contrast-induced acute kidney injury, highest risk in advanced chronic kidney disease (Brilakis) and with diabetes and reduced creatinine clearance (Oxford)", "Lowest possible volume; prevention is taught in the module on hypotension, arrhythmia, radiation, kidneys and bleeding"],
            ["Thyroid dysfunction", "In patients with underlying thyroid disease, the iodine load can cause hyperthyroidism (the Jod–Basedow effect, usually 2–12 weeks later); it can also cause hypothyroidism", "Brilakis avoids contrast in hyper- and hypothyroidism and refers to endocrinology. The 2021 European Thyroid Association guideline is less absolute: most contrast-induced thyroid dysfunction is mild and transient, and it advises an individualised approach based on age, symptoms, existing thyroid disease, other illness and iodine intake. Agree the plan with endocrinology"],
          ],
        },
        { kind: "h", text: "How much is too much" },
        {
          kind: "p",
          text: "The two manuals give different ceilings. Oxford advises not exceeding 5–7 mL/kg, depending on the agent. Brilakis generally stops before 3.7 × GFR, lower in chronic kidney disease or a single kidney, and counts any recent contrast, such as a CT scan. Brilakis also notes that iso-osmolar agents have been associated with a lower risk of contrast nephropathy, and Oxford asks you to consider non-ionic low- or iso-osmolar agents for patients with renal impairment.",
        },
        { kind: "tip", id: "diag-contrast-ceiling-two-rules" },
        {
          kind: "check",
          stem: "A 70 kg patient with a GFR of 30 mL/min/1.73 m² is having a diagnostic study that may become PCI. Which statement about the contrast limit is correct?",
          options: [
            "Oxford's ceiling is about 350–490 mL; Brilakis would generally stop before about 111 mL and lower still in CKD",
            "Both manuals agree on about 210 mL, because each uses 3 mL/kg",
            "There is no ceiling with an iso-osmolar agent, because it does not affect the kidneys",
            "Brilakis allows 5–7 mL/kg if the patient has had no contrast within the past month",
          ],
          answer: 0,
          explanation:
            "Oxford's 5–7 mL/kg gives 350–490 mL for 70 kg; Brilakis's 3.7 × GFR gives about 111 mL, and he prefers a lower threshold in CKD, so here his rule is far stricter. Iso-osmolar agents are associated with lower nephropathy risk, not none. The 5–7 mL/kg figure is Oxford's, not Brilakis's.",
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing a viscous iso-osmolar agent through a 4 Fr catheter and blaming the catheter for poor opacification.",
            "Giving high-osmolar contrast to a patient with severe LV impairment or critical aortic stenosis.",
            "Injecting again while contrast is still sitting in the artery behind an occluding catheter.",
            "Forgetting the CT scan done yesterday when counting toward the contrast ceiling.",
            "Missing a history of thyroid disease before a large iodine load.",
          ],
        },
        {
          kind: "pearl",
          text: "Every millilitre should answer a question. Small test injections, planned views and stopping at the ceiling protect the kidneys and the ventricle at the same time.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Complete a left and right coronary study keeping a running contrast total. Before starting, calculate both ceilings for the patient (Oxford's 5–7 mL/kg and Brilakis's 3.7 × GFR) and stop at the stricter one.",
        },
        { kind: "video", id: "RD6xv1C3jHA", note: "Manual of PCI chapter video on contrast media (section 3.3)." },
        {
          kind: "keypoints",
          items: [
            "Contrast works because iodine absorbs X-rays; agents are excreted by the kidneys.",
            "Non-ionic agents have much lower osmolality and better tolerance than ionic monomers; iodixanol is iso-osmolar but the most viscous.",
            "High osmolality brings heat, fluid shifts, myocardial depression and rising LVEDP; prefer non-ionic agents in severe LV, coronary or valve disease.",
            "Transient bradycardia, ST change and QRS widening are common with injection; let contrast clear.",
            "Ceilings: Oxford 5–7 mL/kg; Brilakis 3.7 × GFR, lower in CKD, counting recent contrast.",
            "Iodine can disturb thyroid function in patients with thyroid disease (Jod–Basedow at 2–12 weeks); Brilakis avoids contrast in thyroid dysfunction, while the 2021 European Thyroid Association guideline individualises the decision because most effects are mild and transient.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-lab-drugs-contrast-reactions",
      title: "Contrast reactions and anaphylaxis on the table",
      minutes: 16,
      topics: ["rc-contrast-media-allergy"],
      sources: [
        { book: "brilakis-pci", loc: "3.3" },
        { book: "brilakis-pci", loc: "3.6" },
        { book: "brilakis-pci", loc: "2.1" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "brilakis-pci", loc: "3.4" },
        { book: "brilakis-pci", loc: "3.7" },
        { book: "oxford-cath", loc: "ch 10: Contrast reaction" },
        { book: "oxford-cath", loc: "ch 10: Risks of complications" },
        { book: "oxford-cath", loc: "ch 10: Vasovagal reaction" },
        { book: "oxford-cath", loc: "ch 4: Contrast media" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      ],
      refs: [...BOOKS, "rcuk-anaphylaxis-2021", "umakoshi-contrast-switch-2022", "vandermolen-contrast-hsr-2024", "mcgwin-ranitidine-2020"],
      blocks: [
        {
          kind: "p",
          text: "Oxford puts contrast reactions at 0.4% of coronary angiograms, less common than they were because of modern low-osmolar non-ionic agents, but a reacting patient can deteriorate fast, with profound hypotension and airway obstruction. Brilakis describes the range: from a skin rash to angio-oedema and anaphylactic shock, either immediately or delayed, usually 6–12 hours later. The planning module teaches premedication; this lesson teaches recognition and treatment, where the manuals and current UK guidance differ in important ways.",
        },
        { kind: "h", text: "Who is at risk and why it happens" },
        {
          kind: "list",
          items: [
            "**Highest risk (Oxford):** a previous anaphylaxis, a previous contrast reaction, atopy and asthma.",
            "**Mechanism.** Brilakis: IgE-mediated reactions or mast cells degranulating directly. Oxford's complications chapter calls them usually type 1 IgE-mediated hypersensitivity, while its equipment chapter describes anaphylactoid reactions as resembling IgE anaphylaxis through an unknown mechanism. In the lab the treatment is the same.",
            "**Agent.** Brilakis cites lower reaction rates with iso-osmolar contrast than with the ionic low-osmolar ioxaglate, but more delayed skin reactions with iso-osmolar agents.",
            "**Not only contrast.** Protamine can cause severe hypotension with pulmonary vasoconstriction 5–10 minutes after the dose (antithrombotics module), amiodarone can cause allergic hypotension, and Oxford notes that a contrast reaction can itself cause coronary spasm with hypotension.",
          ],
        },
        { kind: "h", text: "Recognise it" },
        {
          kind: "table",
          caption: "Contrast reaction or vasovagal reaction?",
          head: ["Feature", "Contrast reaction or anaphylaxis", "Vasovagal reaction"],
          rows: [
            ["Timing", "Usually within 15 minutes of the first injection (Oxford); delayed reactions 6–12 hours later (Brilakis)", "Often at venepuncture, cannulation, arterial puncture or compression"],
            ["Heart rate", "Usually tachycardia; bradycardia in anaphylaxis is usually a late sign, often just before cardiac arrest (RCUK 2021), so the skin and airway signs decide, not the heart rate alone", "Slows, usually before the pressure falls"],
            ["Skin and airway", "Pruritus, flushing, rash, hives, a swollen tongue, lips or throat, wheeze, cyanosis", "Pallor, sweating, nausea; no rash or wheeze"],
            ["First drug", "Adrenaline", "Atropine with fluids and leg elevation"],
          ],
        },
        {
          kind: "p",
          text: "Both cause hypotension, and so does tamponade, which, like anaphylaxis, usually brings a tachycardia. If the picture does not fit, or does not respond, think again and look (echo, the access site, the pressure trace).",
        },
        { kind: "tip", id: "diag-reaction-or-vagal" },
        {
          kind: "check",
          stem: "Three minutes after the first left coronary injection, a woman with asthma becomes flushed and itchy, then wheezy. Her heart rate is 124/min and her pressure 82/46 mmHg. What is happening, and what is the first drug?",
          options: [
            "A vasovagal reaction: atropine 0.5–1.0 mg IV",
            "Contrast anaphylaxis: adrenaline 0.5 mg IM",
            "Contrast anaphylaxis: chlorphenamine 10 mg and hydrocortisone 200 mg IV, then reassess",
            "Nitrate hypotension: saline and phenylephrine",
          ],
          answer: 1,
          explanation:
            "Skin signs, wheeze, tachycardia and hypotension within minutes of contrast in an asthmatic are anaphylaxis, and adrenaline comes first: IM 0.5 mg in current UK guidance and in Oxford. Brilakis also insists on giving adrenaline at once rather than waiting for other drugs to work. Antihistamine and steroid do nothing for the airway or circulation in the first minutes. A vasovagal reaction slows the heart.",
        },
        { kind: "h", text: "Treat it: the manuals, then current UK practice" },
        {
          kind: "table",
          caption: "Treatment of a contrast reaction in the two manuals (typical doses as printed)",
          head: ["Element", "Brilakis 3.3 and 3.6", "Oxford ch 10"],
          rows: [
            ["Airway and oxygen", "Not specified in 3.3", "Secure the airway; 100% oxygen"],
            ["Adrenaline (epinephrine)", "IV in anaphylactic shock: 0.3 mg as the 1:10,000 solution, repeatable up to 1 mg in total; section 3.6 also gives 0.3 to 0.5 mL of the 1 mg/mL strength by the SC or IM route, repeated every 1–2 hours, and given at once rather than after steroids (RCUK now repeats IM doses after 5 minutes)", "IM, 0.5 mg (that is, 0.5 mL of the 1:1000 strength); in severe anaphylaxis consider 100 µg IV (that is, 1 mL of the 1:10,000 strength)"],
            ["Antihistamine", "Diphenhydramine 25–50 mg IV", "Chlorphenamine 10 mg IV"],
            ["H2 blocker", "IV cimetidine 300 mg, or IV ranitidine 50 mg given across 15 minutes. Since then RCUK 2021 has found no evidence for routine H2 blockers in anaphylaxis, and ranitidine was withdrawn from the US market in 2020 over contamination with NDMA, a probable carcinogen", "—"],
            ["Corticosteroid", "Hydrocortisone 100–400 mg IV over 1 minute", "Hydrocortisone 200 mg IV"],
            ["Bronchospasm", "—", "Nebulised salbutamol 5 mg"],
            ["Fluids", "IV normal saline", "IV 0.9% saline"],
            ["Tests", "—", "Serum tryptase rises if mast cells have degranulated"],
            ["Cardiac arrest", "—", "A pulseless patient is treated as PEA, with compressions and ventilation"],
          ],
        },
        {
          kind: "p",
          text: "**What has changed since the manuals.** The 2021 Resuscitation Council UK guideline is the reference for UK practice, and it differs from both books on several points. It makes IM adrenaline the first-line treatment, 0.5 mg (0.5 mL of 1 mg/mL) into the anterolateral thigh in adults, repeated after 5 minutes if airway, breathing or circulation problems persist; it does not recommend the subcutaneous route, which is less effective. It restricts IV adrenaline to experienced specialists in an appropriate setting, because bolus dosing and dilution errors cause dangerous arrhythmias, hypertension and infarction. It gives a rapid crystalloid bolus of 500–1000 mL for hypotension or a poor response to the first dose. It defines refractory anaphylaxis as no improvement after two appropriate IM doses and treats it with a low-dose IV adrenaline infusion with expert help (IV boluses are not recommended unless the patient is in cardiac arrest, though clinicians used to titrating vasopressors may use them while the infusion is prepared). It no longer advises routine corticosteroids, and places antihistamines third, for skin symptoms once the patient is stable, preferring a non-sedating oral agent.",
        },
        {
          kind: "steps",
          title: "Anaphylaxis on the table (Resuscitation Council UK 2021, with the manuals' adjuncts)",
          items: [
            { title: "Stop and call", detail: "Stop the contrast and any other suspect drug; call for help, including an anaesthetist. Keep the patient lying flat (semi-recumbent if breathing is easier), avoiding sudden changes of posture." },
            { title: "IM adrenaline", detail: "0.5 mg IM into the anterolateral thigh. Do not wait for antihistamines or steroids (Brilakis says the same)." },
            {
              title: "Oxygen and fluids",
              detail:
                "High-flow oxygen; a rapid crystalloid bolus of 500–1000 mL for hypotension, repeated as needed. RCUK warns that fluids tend to be under-used: severe anaphylactic shock may need up to 3–5 litres in an adult, and for large volumes it prefers a balanced crystalloid such as Hartmann's or Plasma-Lyte to 0.9% saline, to avoid hyperchloraemia.",
            },
            { title: "Repeat after 5 minutes", detail: "If airway, breathing or circulation problems persist, give a second IM dose." },
            { title: "Refractory after two doses", detail: "Low-dose IV adrenaline infusion with expert critical care help; continue IM doses every 5 minutes until it runs. Reduce the infusion if tachycardia, arrhythmia or hypertension appear. RCUK finds no evidence to favour any particular second-line vasopressor; use one only on expert advice, with the monitoring to catch its side effects." },
            { title: "Adjuncts", detail: "Nebulised salbutamol for bronchospasm (Oxford). A non-sedating antihistamine for skin symptoms once stable; steroids are no longer routine." },
            {
              title: "If the patient arrests",
              detail:
                "Cardiopulmonary resuscitation following advanced life support; Oxford treats it as PEA. RCUK starts compressions early in the peri-arrest patient, and for anaphylaxis around anaesthesia once a cuff systolic pressure stays below 50 mmHg. Because the cause is sudden and potentially reversible in someone previously well, it advises considering prolonged CPR, including extracorporeal CPR.",
            },
            { title: "Tryptase", detail: "First sample as soon as feasible without delaying treatment, the second 1–2 hours after onset (no later than 4 hours), the third at least 24 hours after resolution or at follow-up." },
            { title: "Record and refer", detail: "Record the agent and the reaction, and refer every patient to an allergy clinic." },
          ],
        },
        { kind: "tip", id: "diag-anaphylaxis-im-adrenaline" },
        { kind: "tip", id: "pci-anaphylaxis-im-adrenaline" },
        {
          kind: "check",
          stem: "Five minutes after IM adrenaline 0.5 mg for contrast anaphylaxis, the patient is still wheezy with a pressure of 80/50 mmHg despite a litre of saline. A colleague suggests 1 mg of adrenaline IV. What do you do?",
          options: [
            "Give 1 mg IV adrenaline now, as in cardiac arrest",
            "Give hydrocortisone 200 mg IV and wait 20 minutes for it to act",
            "Repeat IM adrenaline 0.5 mg and call for help to start a low-dose infusion",
            "Switch to phenylephrine, because adrenaline has failed",
          ],
          answer: 2,
          explanation:
            "Persisting problems after 5 minutes call for a second IM dose; failure after two doses defines refractory anaphylaxis, treated with a low-dose IV adrenaline infusion under expert care. A 1 mg IV bolus is the arrest dose and, in a patient with a pulse, risks arrhythmia, severe hypertension and infarction. Steroids act too slowly and are no longer routine.",
        },
        { kind: "h", text: "Next time: premedication or a different agent" },
        {
          kind: "p",
          text: "Both manuals premedicate patients with a known reaction (regimens and timing are in the planning module). Brilakis credits adequate premedication with lowering the risk of anaphylactic shock. Neither mentions changing the agent; since then a 2022 meta-analysis of observational studies associated switching to a different iodinated agent with about 61% fewer repeat reactions, and a 2024 review (written about non-vascular use, but stating that the same preventive measures apply as after intravascular contrast) notes that switching, ideally guided by an allergy specialist, is increasingly advocated in place of premedication. The evidence comes mainly from radiology and from observational studies. Whatever you do, the team should be ready to treat anaphylaxis, because breakthrough reactions occur.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating hypotension and wheeze with antihistamine and steroid while adrenaline waits.",
            "Giving the 1 mg cardiac arrest dose of adrenaline IV to a patient with a pulse.",
            "Using the subcutaneous route, which current guidance considers less effective.",
            "Mistaking anaphylaxis for a vasovagal reaction and giving atropine to a tachycardic patient, or calling a slow rate 'vagal' in a patient with hives and wheeze who is close to arrest.",
            "Sitting the patient up suddenly or standing them while the pressure is low.",
            "Forgetting the timed tryptase samples, the record of the agent, and the allergy referral.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep adrenaline for IM use, 1 mg/mL, and a syringe with a long needle on the emergency trolley, and agree at the brief who gives it. Most of the harm in lab anaphylaxis comes from delay or from the wrong strength by the wrong route.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, if the patient reacts after the first injection, decide between anaphylaxis and a vasovagal reaction from the heart rate and the skin and airway signs. For anaphylaxis: stop contrast, give IM adrenaline 0.5 mg, oxygen and fluid, repeat at 5 minutes, and escalate to an infusion with help if two doses fail.",
        },
        { kind: "video", id: "RD6xv1C3jHA", note: "Manual of PCI chapter video on contrast media (section 3.3)." },
        {
          kind: "keypoints",
          items: [
            "Contrast reactions: 0.4% (Oxford); immediate or delayed 6–12 hours; highest risk after previous anaphylaxis or contrast reaction, atopy and asthma.",
            "Anaphylaxis usually brings tachycardia with skin or airway signs; a vasovagal reaction slows the heart first. Bradycardia in anaphylaxis is a late, pre-arrest sign, so let the skin and airway signs decide.",
            "Adrenaline first, without waiting for anything else: IM 0.5 mg (0.5 mL of 1 mg/mL), repeated after 5 minutes (RCUK 2021, Oxford).",
            "Fluids 500–1000 mL, up to 3–5 litres in severe shock; oxygen; salbutamol for bronchospasm; refractory after two IM doses means an IV infusion with expert help.",
            "IV adrenaline only by experienced hands; never the 1 mg arrest dose in a patient with a pulse.",
            "The manuals' antihistamines, H2 blockers and steroids are now third-line or non-routine (RCUK 2021).",
            "Tryptase at onset, 1–2 hours and 24 hours or later; record the agent; refer to allergy; next time consider a different agent.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-lab-drugs-q1",
      stem: "After midazolam and fentanyl, a patient becomes drowsy and hypopnoeic. Which reversal regimen matches Brilakis's section 3.1?",
      options: [
        "Flumazenil 0.2 mg IV over 15 seconds, repeated to 1 mg; naloxone 0.1–0.2 mg IV every 2–3 minutes",
        "Flumazenil 1 mg IV as one bolus; naloxone 2 mg IV as one bolus, repeated only if needed",
        "Flumazenil 0.5 mg IM every 10 minutes and naloxone 0.4 mg IM every 10 minutes until fully awake again",
        "Naloxone alone, 0.1–0.2 mg IV, because flumazenil has no effect on midazolam at all",
      ],
      answer: 0,
      explanation:
        "Brilakis reverses midazolam with flumazenil 0.2 mg over 15 seconds, a second 0.2 mg across 1 minute when 45 seconds bring no response, then further doses each minute up to 1 mg; and opioids with naloxone 0.1–0.2 mg every 2–3 minutes to the desired effect. Large single boluses are not his regimen, and flumazenil is specifically the midazolam antagonist. Keep monitoring afterwards: sedation can return within 1–2 hours of flumazenil (Hoffman 1993).",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "hoffman-flumazenil-1993"],
    },
    {
      id: "pm-lab-drugs-q2",
      stem: "In the IMPRESSION trial, what did 5 mg of IV morphine given before a ticagrelor load do?",
      options: [
        "Increased ticagrelor exposure by about a third and caused more bleeding",
        "Had no measurable effect on ticagrelor or on its active metabolite",
        "Reduced exposure to ticagrelor by 36% and delayed its peak from 2 to 4 hours",
        "Reduced exposure only to the metabolite, with the peak ticagrelor level unchanged",
      ],
      answer: 2,
      explanation:
        "In 70 patients with myocardial infarction, morphine lowered total exposure to ticagrelor by 36% and to its active metabolite by 37%, delayed the peak plasma concentration from 2 to 4 hours, and increased high platelet reactivity. This fits Brilakis's advice to avoid opioids in STEMI unless needed and to cover a delayed oral load with an IV antiplatelet agent.",
      difficulty: 2,
      refs: ["kubica-impression-2016", "brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q3",
      stem: "Which patient may receive intracoronary nitroglycerin before angiography under Brilakis's rules?",
      options: [
        "A man who took vardenafil 18 hours ago, with a pressure of 142/80 mmHg",
        "A woman with obstructive hypertrophic cardiomyopathy and a pressure of 150/90 mmHg",
        "A man with inferior STEMI and right ventricular infarction, pressure 104/60 mmHg",
        "A woman who took sildenafil 30 hours ago, with a pressure of 134/78 mmHg",
      ],
      answer: 3,
      explanation:
        "Sildenafil's exclusion window is 24 hours, so at 30 hours nitroglycerin may be given (200 µg at a systolic pressure above 120 mmHg). Vardenafil within 24 hours, obstructive HCM and RV infarction are all on Brilakis's do-not-give list. Tadalafil would have needed 48 hours.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q4",
      stem: "During rotational atherectomy of the RCA, which approach to bradycardia does Brilakis describe?",
      options: [
        "Intracoronary adenosine 100 µg before each run to protect the AV node",
        "Aminophylline 250–300 mg IV over 10 minutes, atropine, a temporary wire or test runs",
        "Verapamil 5–10 mg IV before the first burr run, to slow and stabilise AV nodal conduction",
        "Isoprenaline infusion throughout, because atropine does not act during atherectomy",
      ],
      answer: 1,
      explanation:
        "Atherectomy releases adenosine from injured red cells; aminophylline, an A1 antagonist, blocks it (250–300 mg IV over 10 minutes or 20–40 mg intracoronary). Atropine 0.5–1.0 mg IV beforehand, a temporary pacemaker, or brief test runs that stop when bradycardia appears are the alternatives. Adenosine would cause the problem, and IV verapamil is an SVT treatment that also slows AV conduction.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q5",
      stem: "No-reflow follows stenting of a thrombotic LAD; the vessel is open without dissection and contrast hangs in it. Which statement best reflects the manuals?",
      options: [
        "Repeated nitroglycerin boluses into the guide are the most effective first-line treatment",
        "Contrast injections every minute are needed to judge each drug's effect on flow",
        "Vasodilator should go through a distally placed microcatheter or over-the-wire balloon",
        "Once no-reflow is established, vasodilators have no role and only a balloon pump helps",
      ],
      answer: 2,
      explanation:
        "With no antegrade flow, drug injected into the guide refluxes, so Oxford and Brilakis deliver it as close to the distal bed as possible. Oxford states that nitrates have not been shown to help in no-reflow and warns that repeated contrast injections worsen ischaemia. Vasodilators remain the main drugs; a balloon pump is for persisting hypotension.",
      difficulty: 1,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
    {
      id: "pm-lab-drugs-q6",
      stem: "During an RCA physiology study, 150 µg of intracoronary adenosine is followed by a long pause and then polymorphic VT degenerating to VF. What lesson does Brilakis draw for prevention?",
      options: [
        "Use intravenous adenosine only, because intracoronary adenosine is contraindicated in the RCA",
        "Premedicate with amiodarone so that R-on-T ectopics cannot trigger torsades",
        "Give no more than 100 µg intracoronary into the RCA, injected slowly",
        "Give atropine before every adenosine bolus so that the pause cannot occur",
      ],
      answer: 2,
      explanation:
        "Adenosine-induced torsades or VF usually follows a pause (R on T). Brilakis prevents it as he prevents heart block: no high doses in the RCA (not above 100 µg intracoronary in the RCA or a dominant circumflex) and slow injection. Intracoronary RCA adenosine at 50–100 µg is standard, and neither amiodarone nor routine atropine is his prevention. The treatment is coughing and defibrillation.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q7",
      stem: "A patient with obstructive hypertrophic cardiomyopathy becomes hypotensive after a vasodilator during PCI. Why does Brilakis choose phenylephrine?",
      options: [
        "It is the only vasopressor that can be safely given through a peripheral cannula",
        "It is purely a vasopressor, so it adds no inotropy to worsen the obstruction",
        "It raises the heart rate, which shortens the time for outflow obstruction",
        "It is the preferred vasopressor in every cause of cardiogenic shock",
      ],
      answer: 1,
      explanation:
        "Phenylephrine is purely a vasopressor; any inotrope can worsen the intracavitary obstruction of HCM. Noradrenaline, not phenylephrine, is Brilakis's preferred vasopressor in cardiogenic shock, and a faster heart rate would not help obstruction. Brilakis recommends central administration for pressors where possible but does not make it a selection rule.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q8",
      stem: "What did the SOAP II trial show when dopamine was compared with noradrenaline as the first vasopressor in shock?",
      options: [
        "Dopamine lowered 28-day mortality overall, mainly in septic shock",
        "Overall 28-day mortality was similar, but dopamine caused more arrhythmias",
        "Noradrenaline caused more arrhythmias, while dopamine caused more renal failure overall",
        "The trial was stopped early because noradrenaline caused excess deaths",
      ],
      answer: 1,
      explanation:
        "Among 1679 patients, 28-day death was 52.5% with dopamine and 48.5% with noradrenaline (not significant), but arrhythmias were 24.1% versus 12.4%, and in a subgroup analysis of the 280 with cardiogenic shock dopamine was associated with more deaths. Brilakis cites the trial for the excess arrhythmias (24.2) and prefers noradrenaline in cardiogenic shock (3.6); the 2021 ESC heart failure guideline notes that fewer than 10% of that subgroup had myocardial infarction.",
      difficulty: 2,
      refs: ["debacker-soap2-2010", "brilakis-manual-pci", "esc-hf-2021"],
    },
    {
      id: "pm-lab-drugs-q9",
      stem: "A patient with a baseline QTc of 540 ms develops sustained monomorphic VT during LV catheterisation; pressure 112/70 mmHg, alert. Of these drug plans, which fits the manuals best?",
      options: [
        "Amiodarone 150 mg IV over 10 minutes, as it is the first choice whatever the QT",
        "Lidocaine 50 mg IV across 2 minutes, then again at 5-minute intervals up to 200 mg",
        "Verapamil 5–10 mg IV, because the VT is tolerated and the complexes are regular",
        "Adenosine 6 mg IV, then 12 mg, to terminate the tachycardia at the AV node",
      ],
      answer: 1,
      explanation:
        "Brilakis does not give amiodarone with a prolonged QT, because it can cause torsades or VF. With a stable pressure, Oxford's options include lidocaine 50 mg over 2 minutes, repeated every 5 minutes to 200 mg, with a beta-blocker, overdrive pacing or synchronised cardioversion if needed. Verapamil and adenosine are Oxford's SVT drugs, not VT drugs. In a lab where sedation is at hand, the 2022 ESC guideline would cardiovert tolerated monomorphic VT first; among the drug options offered here, lidocaine is the one that avoids Brilakis's warning about amiodarone and a long QT.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "esc-va-2022"],
    },
    {
      id: "pm-lab-drugs-q10",
      stem: "Atrial fibrillation at 165/min starts during right heart catheterisation; the patient has pulmonary oedema and a pressure of 84/50 mmHg. What does Oxford advise?",
      options: [
        "Flecainide 2 mg/kg IV over 30 minutes, with cardioversion 2–3 hours later if it fails",
        "Watchful waiting, since most catheter-induced AF stops without treatment",
        "Amiodarone 300 mg IV over 1 hour, then cardioversion if sinus rhythm does not return",
        "High-flow oxygen, IV heparin and immediate synchronised DC cardioversion",
      ],
      answer: 3,
      explanation:
        "A rate above 150 with hypotension and pulmonary oedema is severe compromise: Oxford gives oxygen, heparin 5000–10,000 IU IV and immediate synchronised cardioversion (360 J monophasic or 200 J biphasic) under sedation or anaesthesia. Flecainide is only for a patient with a good circulation, dry lungs and no known structural heart disease, which Oxford takes to mean no history of coronary or valve disease and a normal echo; waiting suits stable, self-limiting episodes; amiodarone works poorly and slowly.",
      difficulty: 3,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "pm-lab-drugs-q11",
      stem: "Which statement about adrenaline for contrast anaphylaxis reflects the 2021 Resuscitation Council UK guideline rather than the manuals?",
      options: [
        "Give 0.3–0.5 mL of the 1 mg/mL strength SC or IM, repeated every 1–2 hours",
        "Give 0.3 mg of 1:10,000 intravenously, repeating to a total of 1 mg",
        "Give IM 0.5 mg, repeat after 5 minutes, and start an infusion after two failed doses",
        "Give hydrocortisone and an antihistamine first, then adrenaline only if these have failed",
      ],
      answer: 2,
      explanation:
        "RCUK 2021 gives IM adrenaline 0.5 mg in adults, repeated after 5 minutes, and treats anaphylaxis that persists after two IM doses with a low-dose IV infusion under expert care; it does not recommend the subcutaneous route and restricts IV adrenaline to experienced specialists. The first two options are Brilakis's printed regimens (sections 3.6 and 3.3). Steroids and antihistamines are no longer first-line.",
      difficulty: 3,
      refs: ["rcuk-anaphylaxis-2021", "brilakis-manual-pci"],
    },
    {
      id: "pm-lab-drugs-q12",
      stem: "A 60 kg patient with an eGFR of 25 mL/min/1.73 m² needs coronary angiography. Which statement about contrast is best supported by the manuals?",
      options: [
        "Use a non-ionic low- or iso-osmolar agent and stop well below 3.7 × GFR, counting recent contrast",
        "Use an ionic monomer, because its low viscosity allows the smallest total volume",
        "Use up to 7 mL/kg, Oxford's ceiling, which is the stricter of the two rules here",
        "An iso-osmolar agent removes the risk of kidney injury altogether, so no volume ceiling needs to be set",
      ],
      answer: 0,
      explanation:
        "Oxford asks for non-ionic low- or iso-osmolar agents in renal impairment, and Brilakis links iso-osmolar contrast to lower nephropathy risk. His ceiling, 3.7 × GFR (about 93 mL here), is far stricter than Oxford's 5–7 mL/kg (300–420 mL), and he prefers a lower threshold in CKD and counts recent contrast. Ionic monomers are highly osmolar, and no agent removes the risk.",
      difficulty: 3,
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
    },
  ],
  sims: [
    {
      sim: "procedure",
      task: "Run a full case with the drugs as decisions: titrate sedation and say the reversal doses, choose the nitrate dose from the pressure after checking for PDE-5 inhibitors, and treat any hypotension, bradycardia or reaction by its mechanism.",
    },
    {
      sim: "physiology",
      task: "Give intracoronary adenosine at the right dose for each vessel, slowly and with the guide engaged, then flush; if heart block follows, ask the patient to cough and wait.",
    },
    {
      sim: "cathlab",
      task: "Before every intracoronary nitrate bolus, read the systolic pressure aloud and choose 200, 100 or 50 µg (or none); keep a running contrast total against both manuals' ceilings.",
    },
  ],
  caseIds: ["pm-lab-drugs-case-svg", "pm-lab-drugs-case-anaphylaxis"],
};

// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "pm-lab-drugs-case-svg",
    title: "Vein graft PCI: sedation, vasodilators, no-reflow and a falling pressure",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 2.4, 3.1, 3.2, 3.6, 6.3, 12.2, 18.3, 18.8, 18.9, 19.9, 25.2 and 28.1; Oxford Handbook, chapter 1 (catheter laboratory preparation), chapter 6 (use of nitrates), chapter 8 (vein graft PCI, the no-reflow phenomenon) and chapter 10 (hypotension, arrhythmia)",
    },
    summary:
      "An older man with previous bypass surgery has PCI of a degenerated vein graft: sedation in a patient with sleep apnoea, a nitrate decision after a PDE-5 inhibitor, embolic protection with a prophylactic intragraft vasodilator, no-reflow after stenting, hypotension and an adenosine-induced arrhythmia.",
    presentation:
      "A 77-year-old man, 92 kg, with obstructive sleep apnoea and CABG 11 years ago, has crescendo angina. A severe, bulky stenosis in the body of the vein graft to the RCA is the culprit. Baseline pressure 134/72 mmHg, heart rate 68/min, saturation 95% on room air. He mentions that he takes tadalafil and last took it the night before, about 20 hours ago.",
    findings: [
      "Degenerated SVG to RCA with a bulky de novo lesion in the graft body and a long, healthy segment beyond it; native RCA occluded",
      "Obstructive sleep apnoea; BMI 32",
      "Tadalafil about 20 hours ago",
      "Loaded with aspirin and clopidogrel; heparin planned",
    ],
    steps: [
      {
        id: "s1",
        prompt: "He is anxious on the table. How do you sedate him?",
        options: [
          {
            text: "Oxygen, then midazolam 0.5 mg and fentanyl 25 µg, reassessing breathing and saturation before more",
            best: true,
            feedback:
              "He is elderly, obese and has sleep apnoea, so small titrated doses with oxygen fit Oxford's cautions and Brilakis's aim of comfort without compromising breathing.",
          },
          {
            text: "No sedation, to avoid any respiratory risk",
            acceptable: true,
            feedback: "Defensible if he settles with explanation, but an anxious patient moves and becomes tachycardic; small titrated doses are the manuals' approach.",
          },
          {
            text: "Midazolam 2.5 mg and fentanyl 100 µg together, to settle him quickly",
            next: "c1",
            feedback: "Large combined doses in an elderly, obese patient with sleep apnoea invite hypopnoea.",
            stateDelta: { stability: -15, flags: ["oversedated"] },
          },
        ],
      },
      {
        id: "c1",
        kind: "consequence",
        prompt: "Eight minutes later his saturation is 84% and he is snoring, then apnoeic for 15 seconds at a time. His chest is clear and the oximeter trace is good. What now?",
        options: [
          {
            text: "Stop sedation, support the airway, oxygen, then flumazenil 0.2 mg and naloxone 0.1–0.2 mg in small steps",
            best: true,
            feedback: "Brilakis's rescue: stop, reverse each drug in small repeated steps, and intubate only if severe depression persists. The clear chest and good trace make sedation the likely cause rather than oedema or artefact.",
          },
          {
            text: "Give naloxone 2 mg as a single bolus",
            feedback: "Brilakis titrates naloxone at 0.1–0.2 mg every 2–3 minutes; a large bolus abolishes analgesia abruptly and does nothing about the midazolam.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Increase the oxygen and carry on with the PCI",
            feedback: "Oxygen does not treat apnoea; the cause must be reversed before the case goes on.",
            stateDelta: { stability: -15, flags: ["hypoxia"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The guide is engaged in the graft; pressure 130/70 mmHg. Do you give intragraft nitroglycerin before the diagnostic run?",
        options: [
          {
            text: "No: tadalafil was taken within 48 hours; acquire without nitrate",
            best: true,
            feedback: "Tadalafil's window is 48 hours (24 hours for avanafil, sildenafil and vardenafil). Brilakis lists giving the two together as a cause of nitrate hypotension.",
          },
          {
            text: "Yes, 200 µg, since the systolic is above 120 mmHg",
            next: "c2",
            feedback: "The dose ladder applies only once contraindications are excluded; tadalafil 20 hours ago is one.",
            stateDelta: { stability: -20, flags: ["nitrate-pde5"] },
          },
          {
            text: "Yes, but only 50 µg to be cautious",
            next: "c2",
            feedback: "A smaller dose is still a nitrate given inside the tadalafil window.",
            stateDelta: { stability: -10, flags: ["nitrate-pde5"] },
          },
        ],
      },
      {
        id: "c2",
        kind: "consequence",
        prompt: "Within a minute the pressure is 72/40 mmHg and the heart rate 104/min; he feels faint. The trace is genuine. What do you do?",
        options: [
          {
            text: "No more nitrate, saline, and a vasopressor (phenylephrine or noradrenaline) because it is severe; check for bleeding if it persists",
            best: true,
            feedback: "Brilakis's sequence for nitrate hypotension: stop, saline, wait, vasopressor if severe or persistent, and consider the other causes he lists, bleeding among them.",
          },
          {
            text: "Atropine 0.5 mg, as for a vasovagal reaction",
            feedback: "His heart rate has risen, not fallen; this is vasodilation from the drug combination, and atropine does not address it.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The lesion is in the body of the graft, with a good landing zone beyond it. Before stenting this bulky lesion, what is your plan to prevent distal embolisation and no-reflow?",
        options: [
          {
            text: "An embolic protection filter beyond the lesion, plus intragraft nicardipine 100–300 µg before stenting and again afterwards if flow slows",
            best: true,
            feedback: "Both manuals use embolic protection in SVG PCI whenever feasible (Brilakis 18.8; Oxford calls it mandatory). The drug complements the filter, not replaces it: Brilakis gives nicardipine before and after SVG PCI to reduce the consequences of distal embolisation, preferring it for its smaller effect on the pressure.",
            stateDelta: { flags: ["prevented"] },
          },
          {
            text: "Intragraft nicardipine 100–300 µg before and after stenting, without a protection device",
            acceptable: true,
            feedback: "The drug is right, but on its own it leaves out the main mechanical protection. A filter can be landed here, and both manuals would use one in a degenerated graft.",
            stateDelta: { flags: ["no-epd"] },
          },
          {
            text: "Nothing beforehand; treat no-reflow only if it happens",
            feedback: "Brilakis often gives intragraft nicardipine before and after SVG PCI, Oxford notes that vasodilator pretreatment may reduce no-reflow, and both use embolic protection; established no-reflow is hard to treat.",
            stateDelta: { stability: -5, flags: ["unprotected"] },
          },
          {
            text: "A GP IIb/IIIa inhibitor routinely, to prevent embolisation",
            feedback: "Brilakis warns that GP IIb/IIIa inhibitors can cause harm in SVG PCI and should not be used routinely; Oxford finds no benefit from routine use.",
            stateDelta: { stability: -10, flags: ["routine-gpi"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After the stent, flow in the graft is TIMI 1 with no dissection on imaging. Pressure 98/60 mmHg. How do you give the vasodilator?",
        info: "The guide is coaxial and the trace is undamped. Contrast hangs in the graft beyond the stent.",
        variants: [{ flag: "prevented", info: "Despite the filter and pretreatment, slow flow has developed, though less contrast is hanging than you feared. The filter is still deployed beyond the stent." }],
        options: [
          {
            text: "Aspirate through the guide and retrieve any filter, then give nicardipine (or adenosine, verapamil or nitroprusside) through a microcatheter in the distal graft",
            best: true,
            feedback: "With a filter in place, Brilakis aspirates through the guide and then removes the filter, which may be full of debris. Established no-reflow then needs distal delivery: drug given into the guide refluxes when the graft is not flowing.",
          },
          {
            text: "Nitroglycerin 200 µg into the guide, repeated until flow improves",
            next: "c4",
            feedback: "Nitrates have not been shown to help no-reflow, and this patient is inside the tadalafil window.",
            stateDelta: { stability: -15, flags: ["nitrate-pde5"] },
          },
          {
            text: "Repeated contrast injections every minute to watch for improvement",
            next: "c4",
            feedback: "Oxford warns that repeated contrast into a no-reflow vessel worsens ischaemia.",
            stateDelta: { stability: -10, flags: ["ischaemia"] },
          },
        ],
      },
      {
        id: "c4",
        kind: "consequence",
        prompt: "Flow is no better, he has chest pain, and the pressure is 82/50 mmHg. What now?",
        options: [
          {
            text: "Distal vasodilator through a microcatheter, noradrenaline to support the pressure, and consider a balloon pump if hypotension persists",
            best: true,
            feedback: "Deliver the right drug where it can work, hold the pressure while the microcirculation recovers, and use Oxford's balloon pump option for persisting hypotension.",
          },
          {
            text: "Dobutamine to increase contractility",
            feedback: "The problem is microvascular flow and a low pressure; an inotrope treats neither, and Brilakis warns that these drugs raise myocardial oxygen demand.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "You choose adenosine for the distal graft. How much do you give?",
        options: [
          {
            text: "Start low, no more than 100 µg, injected slowly through the microcatheter and repeated if needed, with the ECG watched",
            best: true,
            feedback: "Brilakis's intragraft dose is 100–200 µg, but this graft feeds the RCA and the microcatheter delivers the whole dose into its bed, so it is in effect an RCA injection, where he keeps each bolus at 100 µg or less (12.2); Oxford's no-reflow dose is 30–50 µg. Give it slowly and expect AV block.",
          },
          {
            text: "Adenosine 6 mg, the intravenous SVT dose, through the microcatheter",
            next: "c5",
            feedback: "Milligram doses belong to IV treatment of SVT; delivered into the RCA territory this is a very large dose.",
            stateDelta: { stability: -20, flags: ["adenosine-overdose"] },
          },
          {
            text: "Several thousand micrograms quickly, as Brilakis allows in no-reflow",
            next: "c5",
            feedback: "Brilakis's 'several thousand micrograms, slowly' refers to the left main in no-reflow, not to a graft supplying the AV node, and never fast.",
            stateDelta: { stability: -15, flags: ["adenosine-overdose"] },
          },
        ],
      },
      {
        id: "c5",
        kind: "consequence",
        prompt: "Complete heart block appears with no escape rhythm; he is still conscious.",
        options: [
          {
            text: "Ask him to cough forcefully and wait; prepare for transient CPR and pacing if it persists",
            best: true,
            feedback: "Adenosine wears off in seconds; coughing keeps him conscious meanwhile.",
          },
          {
            text: "Synchronised DC cardioversion",
            feedback: "Cardioversion has no role in heart block.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "Flow improves to TIMI 3, but he now has atrial fibrillation at 128/min after the adenosine. Pressure 108/66 mmHg, no pulmonary oedema. What do you do?",
        options: [
          {
            text: "Observe briefly; if it persists, cardiovert at the end of the case or use rate or rhythm control",
            best: true,
            feedback: "Adenosine-induced AF is usually well tolerated without an accessory pathway; Brilakis cardioverts, or uses amiodarone, beta-blockers or calcium channel blockers, and many catheter-induced AF episodes stop by themselves (Oxford).",
          },
          {
            text: "Immediate DC cardioversion now, mid-procedure",
            acceptable: true,
            feedback: "Reasonable if he deteriorates, but he is stable; Oxford reserves immediate cardioversion for severe compromise.",
          },
          {
            text: "Flecainide 2 mg/kg IV",
            feedback: "Oxford keeps flecainide for patients with no structural heart disease; he has extensive coronary disease and previous bypass surgery.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The graft is stented with TIMI 3 flow. He returns to sinus rhythm spontaneously, and the pressure recovers once the nicardipine wears off. He is monitored overnight and discharged with his antiplatelet plan.",
    outcomeVariants: [
      { flag: "oversedated", text: "The early sedation episode needed reversal and delayed the case; small titrated doses would have avoided it." },
      { flag: "nitrate-pde5", text: "Nitrate given within 48 hours of tadalafil caused avoidable severe hypotension." },
      { flag: "no-epd", text: "The graft was pretreated with nicardipine but stented without embolic protection, although a filter could have been landed beyond the lesion; both manuals would have used one in this degenerated graft." },
      { flag: "unprotected", text: "Stenting a bulky degenerated graft without embolic protection or a vasodilator left the microcirculation exposed to debris; both manuals would have protected it." },
      { flag: "routine-gpi", text: "A routine GP IIb/IIIa inhibitor added bleeding risk without the benefit the manuals look for in SVG PCI." },
      { flag: "adenosine-overdose", text: "An excessive adenosine dose into the RCA territory caused complete heart block." },
    ],
    learningPoints: [
      "Sedate elderly, obese or sleep-apnoea patients in small titrated steps; reverse with flumazenil 0.2 mg steps and naloxone 0.1–0.2 mg, then keep monitoring.",
      "Check PDE-5 inhibitors before any nitrate: 24 hours, or 48 hours for tadalafil.",
      "In degenerated grafts, use an embolic protection device whenever feasible and give a microvascular vasodilator before and after stenting; nicardipine lowers the pressure least.",
      "Slow flow with a filter in place: aspirate, retrieve the filter; treat established no-reflow with distal delivery, not nitrate or repeated contrast.",
      "Adenosine doses: graft 100–200 µg, but no more than 100 µg per bolus when the graft or microcatheter delivers into the RCA (RCA 50–100 µg), slowly; heart block means cough and wait; AF is usually tolerated.",
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pm-lab-drugs-case-anaphylaxis",
    title: "Anaphylaxis after the first injection",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 2.1, 3.3, 3.6, 3.7 and 28.1; Oxford Handbook, chapter 10 (contrast reaction, vasovagal reaction, arrhythmia); Resuscitation Council UK anaphylaxis guideline 2021",
    },
    summary:
      "A woman with asthma and no known contrast allergy reacts to the first injection of a diagnostic study: telling anaphylaxis from a vagal reaction, adrenaline by the right route and dose, refractory anaphylaxis, a tachyarrhythmia on the infusion, and the follow-up.",
    presentation:
      "A 54-year-old woman with asthma and hay fever is having an elective radial angiogram for exertional chest pain. She has no known drug allergies and has never had iodinated contrast. Baseline pressure 138/82 mmHg, heart rate 78/min, saturation 97% on room air.",
    findings: ["Asthma and atopy", "No previous contrast exposure", "Elective diagnostic study, right radial access"],
    steps: [
      {
        id: "s1",
        prompt: "Two minutes after the first left coronary injection she says she is itchy and feels strange. Her face is flushed, she has hives on her chest and a soft wheeze. Heart rate 118/min, pressure 86/50 mmHg. What is this?",
        options: [
          {
            text: "Contrast anaphylaxis: tachycardia, hypotension, skin signs and wheeze within minutes of the first injection",
            best: true,
            feedback: "Oxford's picture: symptoms usually within 15 minutes of the first injection, with pruritus, flushing, rash and wheeze, tachycardia and hypotension. Her asthma and atopy put her in the highest-risk group.",
          },
          {
            text: "A vasovagal reaction to the arterial puncture",
            next: "c1",
            feedback: "A vasovagal reaction slows the heart, usually before the pressure falls, and does not cause hives or wheeze.",
            stateDelta: { stability: -15, flags: ["delay"] },
          },
        ],
      },
      {
        id: "c1",
        kind: "consequence",
        prompt: "Atropine 0.6 mg is given. Her heart rate rises to 136/min, the wheeze worsens and the pressure is now 70/40 mmHg.",
        options: [
          {
            text: "Recognise anaphylaxis: stop contrast and give IM adrenaline 0.5 mg now",
            best: true,
            feedback: "The tachycardia and skin and airway signs were the clue. Adrenaline is the treatment; delay is the main hazard.",
          },
          {
            text: "Repeat atropine to a total of 3 mg",
            feedback: "Atropine treats vagal bradycardia; it worsens this tachycardia and does nothing for anaphylaxis.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "You stop the contrast and call for help. Which drug do you give first, and how?",
        options: [
          {
            text: "Adrenaline 0.5 mg IM (that is, 0.5 mL of the 1 mg/mL strength) into the anterolateral thigh",
            best: true,
            feedback: "The first-line treatment in the 2021 Resuscitation Council UK guideline and in Oxford; Brilakis also insists that adrenaline is given at once, without waiting for other drugs.",
          },
          {
            text: "Adrenaline 1 mg IV, since she has an arterial line and IV access",
            next: "c2",
            feedback: "1 mg IV is the cardiac arrest dose. In a patient with a pulse it can cause severe hypertension, ventricular arrhythmias and infarction; RCUK restricts IV adrenaline to experienced specialists, titrated.",
            stateDelta: { stability: -25, flags: ["iv-adrenaline-error"] },
          },
          {
            text: "Chlorphenamine 10 mg and hydrocortisone 200 mg IV, keeping adrenaline for later",
            next: "c3",
            feedback: "Antihistamines and steroids do not treat the airway or circulation in the first minutes; RCUK no longer advises routine steroids and makes antihistamines third-line.",
            stateDelta: { stability: -15, flags: ["delay"] },
          },
        ],
      },
      {
        id: "c2",
        kind: "consequence",
        prompt: "Within a minute her pressure is 210/120 mmHg and runs of ventricular tachycardia appear. She has a pulse and is conscious.",
        options: [
          {
            text: "Give no more IV adrenaline; support, monitor and prepare to treat VT if it persists, with expert help",
            best: true,
            feedback: "Adrenaline has a short half-life, so the effect fades quickly; the lesson is the dose and route. Any further adrenaline should be IM or a low-dose infusion under experienced supervision.",
          },
          {
            text: "Another 1 mg IV adrenaline in case the anaphylaxis returns",
            feedback: "This repeats the error and may cause VF or infarction.",
            stateDelta: { stability: -25 },
          },
        ],
      },
      {
        id: "c3",
        kind: "consequence",
        prompt: "Ten minutes later the wheeze is worse and the pressure is 68/36 mmHg.",
        options: [
          {
            text: "Give IM adrenaline 0.5 mg now, with oxygen and a fluid bolus",
            best: true,
            feedback: "Adrenaline is still the first drug; every minute of delay matters in anaphylaxis.",
          },
          {
            text: "A second dose of hydrocortisone",
            feedback: "Steroids act too slowly to treat shock and bronchospasm.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "IM adrenaline is in. What else do you do in the next few minutes?",
        options: [
          {
            text: "High-flow oxygen, a rapid crystalloid bolus of 500–1000 mL, nebulised salbutamol for the wheeze, and keep her lying flat",
            best: true,
            feedback: "RCUK's oxygen and fluid bolus, Oxford's salbutamol 5 mg for bronchospasm, and avoiding sudden changes of posture.",
          },
          {
            text: "Sit her up straight away so that she can breathe more easily",
            feedback: "Sudden posture change in anaphylactic hypotension is dangerous; semi-recumbent is acceptable only if breathing needs it and the pressure allows.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Finish the left coronary views quickly so the study is not wasted",
            feedback: "More contrast in a patient reacting to it is the last thing she needs.",
            stateDelta: { stability: -20, flags: ["more-contrast"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Five minutes after the first dose she is still wheezy and the pressure is 80/48 mmHg after a litre of fluid.",
        options: [
          {
            text: "Repeat IM adrenaline 0.5 mg; if two doses fail, start a low-dose adrenaline infusion with the anaesthetist",
            best: true,
            feedback: "RCUK: repeat IM after 5 minutes; failure after two doses is refractory anaphylaxis, treated with an IV infusion under expert care, continuing IM doses until it runs.",
          },
          {
            text: "Switch to phenylephrine, because adrenaline is not working",
            feedback: "Adrenaline remains the first-line vasopressor in anaphylaxis; other pressors are second-line decisions for experts.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Wait 20 minutes for the first dose to work fully",
            feedback: "The repeat interval is 5 minutes when airway, breathing or circulation problems persist.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "On the infusion her pressure recovers to 112/70 mmHg, but she develops a narrow-complex tachycardia at 150/min with frequent ectopics.",
        options: [
          {
            text: "Reduce the adrenaline infusion rate and reassess, since excessive adrenergic stimulation causes arrhythmias",
            best: true,
            feedback: "RCUK advises reducing the infusion if tachycardia, arrhythmia or hypertension appear, and Brilakis's first prevention of inotrope arrhythmias is the lowest effective dose.",
          },
          {
            text: "Amiodarone 300 mg IV push",
            feedback: "That is Brilakis's dose for refractory VF. She is perfusing, and the trigger is the adrenaline dose; amiodarone can also cause hypotension and allergic reactions.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Stop the infusion abruptly",
            acceptable: true,
            feedback: "RCUK stops the infusion if side effects are severe; otherwise reducing it keeps the anaphylaxis treated.",
          },
        ],
      },
      {
        id: "s6",
        prompt: "She is stable. Before she leaves the lab, what must happen?",
        options: [
          {
            text: "Timed tryptase samples, the agent and reaction recorded, an allergy referral, and a plan for any future study",
            best: true,
            feedback: "Tryptase at onset, at 1–2 hours and at 24 hours or later; record the specific agent; RCUK refers every patient to an allergy clinic, and a future study can use a different agent or premedication with a prepared team.",
          },
          {
            text: "Record 'iodine allergy' and tell her she must never have contrast again",
            feedback: "Vague labels help no one; record the specific agent and reaction and let the allergy service advise.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "She is observed on a monitored bed and the infusion is weaned. Tryptase confirms mast cell degranulation. The angiogram is completed weeks later with a different contrast agent after allergy review, with the team ready to treat a reaction.",
    outcomeVariants: [
      { flag: "delay", text: "Delayed adrenaline let the reaction progress and made a refractory course more likely." },
      { flag: "iv-adrenaline-error", text: "An IV arrest dose of adrenaline in a patient with a pulse caused severe hypertension and ventricular tachycardia." },
      { flag: "more-contrast", text: "Further contrast during the reaction prolonged and worsened it." },
    ],
    learningPoints: [
      "Anaphylaxis usually brings tachycardia with skin and airway signs; a vasovagal reaction slows the heart first. Bradycardia in anaphylaxis is a late, pre-arrest sign, so the skin and airway signs decide.",
      "Adrenaline 0.5 mg IM, repeated after 5 minutes; infusion with expert help after two failed doses.",
      "Never give the 1 mg arrest dose IV to a patient with a pulse.",
      "Oxygen, 500–1000 mL fluid (up to 3–5 litres in severe shock), salbutamol for wheeze; antihistamines and steroids are not first-line.",
      "Reduce the adrenaline infusion if it causes tachyarrhythmia; tryptase three times; record the agent and refer.",
    ],
    refs: ["rcuk-anaphylaxis-2021", "oxford-cath-handbook", "brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "diag-sedation-titrate",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Sedate in small steps and watch the saturation",
    text: "Start small (Brilakis: midazolam 0.5–1 mg, fentanyl 25–100 µg IV) and reassess before each repeat, more cautiously still in the elderly, the obese and patients with airways disease. Give oxygen with larger doses, and keep flumazenil and naloxone ready. Typical doses; follow local protocol.",
    tone: "do",
    lessonId: "pm-lab-drugs-sedation",
    sources: [
      { book: "brilakis-pci", loc: "3.1" },
      { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-opioid-delays-p2y12",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Opioids slow the oral P2Y12 load",
    text: "In STEMI, think before giving an opioid: opioids delay gastric emptying and the absorption of oral P2Y12 inhibitors; morphine cut ticagrelor exposure by about a third in IMPRESSION. Avoid opioids in STEMI unless needed, and if the oral load may not be working yet, cover with cangrelor or a GP IIb/IIIa inhibitor.",
    tone: "caution",
    lessonId: "pm-lab-drugs-sedation",
    sources: [{ book: "brilakis-pci", loc: "3.1" }],
    refs: ["brilakis-manual-pci", "kubica-impression-2016"],
  },
  {
    id: "diag-nitrate-dose-by-pressure",
    lab: "diagnostic",
    when: { phase: ["inject"] },
    title: "Dose the nitrate by the systolic pressure",
    text: "Check first for a reason to withhold it: low pressure, suspected hypovolaemia, RV infarction, HOCM or a recent PDE-5 inhibitor (24 h; 48 h for tadalafil). Otherwise dose intracoronary nitroglycerin by systolic pressure: above 120 mmHg 200 µg, 100–120 mmHg 100 µg, below 100 mmHg 50 µg or none. Inject with a free trace and wait 1–2 minutes before acquiring.",
    tone: "do",
    lessonId: "pm-lab-drugs-nitrates",
    sources: [
      { book: "brilakis-pci", loc: "6.3" },
      { book: "brilakis-pci", loc: "3.2" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-wire-spasm-nitrate",
    lab: "pci",
    when: { phase: ["wire", "imaging"], event: ["ostial-spasm"] },
    title: "Spasm during PCI: intracoronary nitrate or calcium blocker",
    text: "Stiff wires that straighten the vessel, deep guide engagement and instrumentation all provoke spasm. Give intracoronary nitroglycerin 100–300 µg, repeated if needed; Brilakis also lists intracoronary calcium channel blockers as a treatment. Consider IVUS or OCT to tell spasm from a fixed lesion.",
    tone: "do",
    lessonId: "pm-lab-drugs-nitrates",
    sources: [
      { book: "brilakis-pci", loc: "25.2" },
      { book: "brilakis-pci", loc: "6.3" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-no-reflow-distal-vasodilator",
    lab: "pci",
    when: { event: ["no-reflow", "slow-flow"] },
    title: "No-reflow: microvascular drug, delivered distally",
    text: "Use a microvascular vasodilator (nicardipine, adenosine, verapamil or nitroprusside), not a nitrate, and give it through a microcatheter, over-the-wire balloon or dual-lumen catheter in the distal vessel, since drug in the guide refluxes. Avoid repeated contrast injections; support the pressure, and consider intracoronary adrenaline if it is refractory.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-microvascular",
    sources: [
      { book: "brilakis-pci", loc: "19.9" },
      { book: "brilakis-pci", loc: "3.2" },
      { book: "oxford-cath", loc: "ch 8: The 'no-reflow' phenomenon" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-svg-intragraft-vasodilator",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"], vessel: ["SVG"] },
    title: "Vein graft: protection device plus vasodilator",
    text: "Use an embolic protection device whenever one can be landed beyond the lesion; the drug complements it. Give intragraft nicardipine 100–300 µg before and after vein graft PCI, especially if flow slows; Brilakis prefers it because it lowers the pressure less than nitroprusside or verapamil. Typical dose; follow local protocol.",
    tone: "do",
    lessonId: "pm-lab-drugs-microvascular",
    sources: [
      { book: "brilakis-pci", loc: "3.2" },
      { book: "brilakis-pci", loc: "18.3" },
      { book: "brilakis-pci", loc: "18.8" },
      { book: "brilakis-pci", loc: "18.9" },
      { book: "oxford-cath", loc: "ch 8: Vein graft PCI" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "pci-adenosine-rca-dose",
    lab: "pci",
    when: { phase: ["physiology"], vessel: ["RCA"] },
    title: "RCA adenosine: no more than 100 µg, slowly",
    text: "Give 50–100 µg of intracoronary adenosine into the RCA (never above 100 µg in the RCA or a dominant circumflex), inject it slowly with the guide engaged, and flush the guide afterwards. Expect transient AV block.",
    tone: "caution",
    lessonId: "pm-lab-drugs-microvascular",
    sources: [
      { book: "brilakis-pci", loc: "3.2" },
      { book: "brilakis-pci", loc: "12.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-adenosine-block-cough-wait",
    lab: "pci",
    when: { phase: ["physiology", "complication"], event: ["bradycardia"] },
    title: "Heart block after adenosine: cough and wait",
    text: "If the block follows an adenosine bolus: adenosine acts for seconds, so watchful waiting is the treatment; ask the patient to cough forcefully meanwhile. If block with no escape rhythm persists, give transient CPR and pace. If torsades or VF follows the pause, defibrillate.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-microvascular",
    sources: [
      { book: "brilakis-pci", loc: "3.2" },
      { book: "brilakis-pci", loc: "12.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-hypotension-match-pressor",
    lab: "pci",
    when: { event: ["hypotension"] },
    title: "Real hypotension: treat the cause, bridge with the right drug",
    text: "Classify it as hypovolaemia, cardiac failure or vasodilation and treat the cause. If the MAP is below 60 mmHg, bridge with a vasopressor: noradrenaline in cardiogenic shock, phenylephrine (pure pressor) in hypertrophic cardiomyopathy. Rising doses are a reason to consider mechanical support.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-pressors",
    sources: [
      { book: "brilakis-pci", loc: "3.6" },
      { book: "brilakis-pci", loc: "28.1" },
      { book: "brilakis-pci", loc: "24.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-left-main-early-noradrenaline",
    lab: "pci",
    when: { phase: ["plan", "guide"], vessel: ["LM"] },
    title: "Left main: pads on, noradrenaline early",
    text: "Patients having left main PCI can deteriorate quickly. Place defibrillator pads beforehand, and if the pressure falls, start noradrenaline early rather than waiting to see whether it recovers.",
    tone: "caution",
    lessonId: "pm-lab-drugs-pressors",
    sources: [{ book: "brilakis-pci", loc: "17.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "mcs-pressor-escalation-limit",
    lab: "mcs",
    when: { phase: ["select", "manage"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Escalating pressors are a cost, not a plan",
    text: "Vasopressors and inotropes raise myocardial oxygen demand and provoke arrhythmias, and pure alpha agonists add afterload without inotropy. Use the lowest effective doses, prefer noradrenaline to dopamine in cardiogenic shock, and consider early mechanical support to reduce the need for drugs.",
    tone: "caution",
    lessonId: "pm-lab-drugs-pressors",
    sources: [
      { book: "brilakis-pci", loc: "24.2" },
      { book: "brilakis-pci", loc: "3.6" },
    ],
    refs: ["brilakis-manual-pci", "debacker-soap2-2010"],
  },
  {
    id: "diag-vf-shock-then-amiodarone",
    lab: "diagnostic",
    when: { event: ["vf"] },
    title: "VF: shock first, drugs for shock-resistant VF",
    text: "Defibrillate at once following advanced life support. If VF persists despite shocks, consider amiodarone 300 mg IV and a different defibrillator, and correct potassium and magnesium; the out-of-hospital DOSE VF trial supports moving the pads to an anterior–posterior position or sequential shocks from two defibrillators. Then find the trigger: conus injection, a plugged vessel, contrast that could not clear, dissection or air.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-antiarrhythmics",
    sources: [
      { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
      { book: "brilakis-pci", loc: "3.7" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci", "cheskes-dose-vf-2022"],
  },
  {
    id: "diag-bradycardia-atropine-or-pace",
    lab: "diagnostic",
    when: { event: ["bradycardia"] },
    title: "Slow after injection: wait, atropine, pace if high-grade",
    text: "Injection bradycardia usually recovers in seconds; if it persists, give atropine 0.5–1 mg IV (to a total of 3 mg). Think vasovagal if the pressure then falls. Mobitz II or complete block may need urgent temporary pacing rather than more atropine.",
    tone: "do",
    lessonId: "pm-lab-drugs-antiarrhythmics",
    sources: [
      { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
      { book: "brilakis-pci", loc: "3.7" },
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "diag-contrast-ceiling-two-rules",
    lab: "diagnostic",
    when: { event: ["high-contrast-volume"] },
    title: "Two contrast ceilings: use the stricter",
    text: "Oxford advises staying within 5–7 mL/kg; Brilakis stops before 3.7 × GFR, lower in chronic kidney disease. In renal impairment the GFR rule is usually far lower, so plan to it, and prefer a non-ionic low- or iso-osmolar agent.",
    tone: "caution",
    lessonId: "pm-lab-drugs-contrast-media",
    sources: [
      { book: "oxford-cath", loc: "ch 4: Contrast media" },
      { book: "brilakis-pci", loc: "2.6" },
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "diag-reaction-or-vagal",
    lab: "diagnostic",
    when: { event: ["hypotension", "contrast-reaction"] },
    title: "Fast or slow? Anaphylaxis or vagal",
    text: "Hypotension with flushing, hives, swelling or wheeze soon after contrast is anaphylaxis, usually with a tachycardia: adrenaline. Hypotension after the heart rate has slowed, with pallor and nausea and no skin or airway signs, is vasovagal: legs up, fluid, atropine. A slow rate with skin or airway signs is late anaphylaxis close to arrest, not vagal. If neither fits or there is no response, think of tamponade and bleeding.",
    tone: "caution",
    lessonId: "pm-lab-drugs-contrast-reactions",
    sources: [
      { book: "oxford-cath", loc: "ch 10: Contrast reaction" },
      { book: "oxford-cath", loc: "ch 10: Vasovagal reaction" },
    ],
    refs: ["oxford-cath-handbook", "rcuk-anaphylaxis-2021"],
  },
  {
    id: "diag-anaphylaxis-im-adrenaline",
    lab: "diagnostic",
    when: { event: ["contrast-reaction"] },
    title: "Anaphylaxis: IM adrenaline now",
    text: "Stop the contrast and call for help. Give adrenaline 0.5 mg IM (that is, 0.5 mL of the 1 mg/mL strength) into the thigh, oxygen and a 500–1000 mL fluid bolus; repeat IM adrenaline after 5 minutes if problems persist, and after two failed doses start an infusion with expert help. Never the 1 mg IV arrest dose with a pulse.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-contrast-reactions",
    sources: [{ book: "oxford-cath", loc: "ch 10: Contrast reaction" }],
    refs: ["rcuk-anaphylaxis-2021", "oxford-cath-handbook"],
  },
  {
    id: "pci-anaphylaxis-im-adrenaline",
    lab: "pci",
    when: { event: ["contrast-reaction"] },
    title: "Reaction during PCI: adrenaline before anything else",
    text: "Hold further contrast and give adrenaline 0.5 mg IM, oxygen and fluid; antihistamines and steroids do not treat the airway or circulation. Remember that protamine and amiodarone can also cause allergic hypotension, and that a reaction can provoke coronary spasm.",
    tone: "bailout",
    lessonId: "pm-lab-drugs-contrast-reactions",
    sources: [
      { book: "brilakis-pci", loc: "3.3" },
      { book: "brilakis-pci", loc: "3.7" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["rcuk-anaphylaxis-2021", "brilakis-manual-pci", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "kubica-impression-2016",
    kind: "trial",
    citation:
      "Kubica J, Adamski P, Ostrowska M, et al. Morphine delays and attenuates ticagrelor exposure and action in patients with myocardial infarction: the randomized, double-blind, placebo-controlled IMPRESSION trial. Eur Heart J. 2016;37:245–252.",
    url: "https://doi.org/10.1093/eurheartj/ehv547",
    note: "PMID: 26491112 (PMC4712351). Checked on PubMed: authors, title, journal, volume 37, issue 3, pages 245–52; published online 2015, issue 2016. 70 patients analysed; morphine 5 mg IV lowered ticagrelor AUC by 36% and its active metabolite by 37%, and delayed peak ticagrelor concentration (4 vs 2 h).",
    verified: true,
  },
  {
    id: "debacker-soap2-2010",
    kind: "trial",
    citation:
      "De Backer D, Biston P, Devriendt J, et al. Comparison of dopamine and norepinephrine in the treatment of shock. N Engl J Med. 2010;362:779–789.",
    url: "https://doi.org/10.1056/NEJMoa0907118",
    note: "PMID: 20200382. The SOAP II trial. Checked on PubMed: authors, title, journal, year, volume 362, issue 9, pages 779–89. 1679 patients; 28-day death 52.5% (dopamine) vs 48.5% (norepinephrine), P = 0.10; arrhythmias 24.1% vs 12.4%; higher 28-day mortality with dopamine in the 280 patients with cardiogenic shock (subgroup analysis, P = 0.03).",
    verified: true,
  },
  {
    id: "hoffman-flumazenil-1993",
    kind: "paper",
    citation: "Hoffman EJ, Warren EW. Flumazenil: a benzodiazepine antagonist. Clin Pharm. 1993;12:641–656.",
    url: "https://pubmed.ncbi.nlm.nih.gov/8306565/",
    note: "PMID: 8306565. Checked on PubMed: authors, title, journal, year, volume 12, issue 9, pages 641–56. Used for: resedation may occur within 1–2 hours of flumazenil, so repeated doses or an infusion may be needed; adverse reactions include resedation, seizures and cardiovascular effects.",
    verified: true,
  },
  {
    id: "esc-va-2022",
    kind: "guideline",
    citation:
      "Zeppenfeld K, Tfelt-Hansen J, de Riva M, et al. 2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death. Eur Heart J. 2022;43:3997–4126.",
    url: "https://doi.org/10.1093/eurheartj/ehac262",
    note: "PMID: 36017572. Checked on PubMed: authors, title, journal, year, volume 43, issue 40, pages 3997–4126. Acute-management points used (cardioversion first-line, class I, for tolerated sustained monomorphic VT when the sedation or anaesthetic risk is low; procainamide IIa in known or suspected structural heart disease; weaker recommendation for amiodarone; verapamil for left fascicular and beta-blockers for outflow tract idiopathic VT) were checked against the guideline summary by Könemann and Eckardt, Herzschrittmacherther Elektrophysiol 2022;33:450–457 (PMID 36385401, PMC9691474).",
    verified: true,
  },
  {
    id: "cheskes-dose-vf-2022",
    kind: "trial",
    citation:
      "Cheskes S, Verbeek PR, Drennan IR, et al. Defibrillation strategies for refractory ventricular fibrillation. N Engl J Med. 2022;387:1947–1956.",
    url: "https://doi.org/10.1056/NEJMoa2207304",
    note: "PMID: 36342151. The DOSE VF trial. Checked on PubMed: authors, title, journal, year, volume 387, issue 21, pages 1947–56. Cluster-randomised, out-of-hospital refractory VF, 405 patients; survival to discharge 30.4% with double sequential external defibrillation and 21.7% with vector change (anterior–posterior pads) versus 13.3% with standard defibrillation.",
    verified: true,
  },
  {
    id: "mcgwin-ranitidine-2020",
    kind: "paper",
    citation: "McGwin G. The association between ranitidine use and gastrointestinal cancers. Cancers (Basel). 2020;13:24.",
    url: "https://doi.org/10.3390/cancers13010024",
    note: "PMID: 33374592 (PMC7793066). Checked on PubMed: author, title, journal, published December 2020, volume 13, issue 1, article 24. Used only for: NDMA, a probable human carcinogen, was found in ranitidine, and in April 2020 the FDA announced that ranitidine was to be withdrawn from the market.",
    verified: true,
  },
  {
    id: "bednarczuk-eta-contrast-thyroid-2021",
    kind: "guideline",
    citation:
      "Bednarczuk T, Brix TH, Schima W, et al. 2021 European Thyroid Association guidelines for the management of iodine-based contrast media-induced thyroid dysfunction. Eur Thyroid J. 2021;10:269–284.",
    url: "https://doi.org/10.1159/000517175",
    note: "PMID: 34395299 (PMC8314764). Checked on PubMed: authors, title, journal, year, volume 10, issue 4, pages 269–84. Used from the abstract: most contrast-induced thyroid dysfunction is mild and transient; an individualised approach based on age, symptoms, pre-existing thyroid disease, comorbidity and iodine intake is advised.",
    verified: true,
  },
];
