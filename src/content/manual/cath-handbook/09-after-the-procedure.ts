// Module hb-after-the-procedure: the report and hand-over, recovery observations, the antiplatelet
// plan at discharge (DAPT duration, high bleeding risk, triple therapy, surgery), talking to the
// patient and family (including after a complication), and discharge (manual curriculum, track
// cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 11 (post
// procedure: nursing care, the patient, results, communication, discharge plans, discharge summary),
// chapter 8 (antiplatelet therapy, stent thrombosis, the PCI procedure), chapter 2 (the cardiologist,
// the nurse), chapter 1 (dose excess, patient preparation), chapter 3 (femoral line removal, closure
// devices) and chapter 10 (death, myocardial infarction, stroke, hypotension, tamponade, renal failure,
// contrast nephropathy); Brilakis, Manual of PCI, sections 1.1, 2.7, 3.5, 6.6, 6.8, 7.1, 10.2, 28.2
// and 28.3. Current practice comes from verified references: the 2023 ESC ACS guideline, the 2022 ESC
// non-cardiac surgery guideline, the ARC-HBR consensus, the MASTER DAPT and AUGUSTUS trials, the DVLA
// guide and the GMC/NMC candour guidance (claim by claim in docs/curriculum/evidence/hb-after-the-procedure.md).
// Neighbouring modules: pm-antithrombotics (the drugs, loading, switching), pm-closure (haemostasis),
// pm-monitoring (monitoring in the lab, sign out), pm-interpreting (reading the angiogram),
// cm-patient-complications and cm-access-complications (treating complications).
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OX = ["oxford-cath-handbook"];
const BR = ["brilakis-manual-pci"];
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });

export const module: Module = {
  id: "hb-after-the-procedure",
  title: "After the procedure",
  stage: 2,
  summary:
    "What happens between the last cine run and the patient's front door: the operator's report and the review of results, the hand-over to the ward, recovery observations and the warning signs that need action, the antiplatelet plan at discharge (DAPT duration, high bleeding risk, triple therapy with an anticoagulant, surgery on DAPT), explaining results and complications to the patient and family, and the discharge plan and summary.",
  objectives: [
    "Write an operator's report that contains everything Oxford requires, describe each lesion with the parameters Brilakis assesses, and record what the next operator will need.",
    "Hand a patient over to the ward with the four items Oxford lists, and review the results of every case before the patient leaves.",
    "Set up and interpret post-procedure observations, access-site checks and mobilisation, and act on chest pain, hypotension, neurological symptoms and kidney injury.",
    "Choose the duration of dual antiplatelet therapy from the presentation, the bleeding risk (ARC-HBR, PRECISE-DAPT) and the ischaemic risk, and state what the 2023 ESC ACS guideline changed.",
    "Plan antithrombotic therapy for a patient who also needs an oral anticoagulant, and advise on surgery after a stent.",
    "Explain results to a patient and family, and disclose a complication in line with the professional duty of candour.",
    "Discharge a patient safely with the advice, follow-up and discharge summary that the manuals and UK practice require.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-after-the-procedure-report",
      title: "The report, the review of results and the hand-over",
      minutes: 15,
      topics: ["post-reporting-handover"],
      sources: [
        O("ch 2: The cardiologist"),
        O("ch 2: The nurse"),
        O("ch 11: Results"),
        O("ch 11: The patient"),
        O("ch 1: Dose excess"),
        O("ch 8: The PCI procedure"),
        O("ch 10: Death"),
        B("6.8"),
        B("6.6"),
        B("1.1"),
      ],
      refs: [...BOOKS],
      blocks: [
        {
          kind: "p",
          text: "Once the sheath is out, the procedure survives only as what you write and what you say. Three readers depend on it: the ward nurse who receives the patient within minutes, the doctor who reviews the patient before discharge, and an operator months or years from now who opens your report before the next angiogram. The Academy lesson dx-report gives a report template; this lesson goes through Oxford's list of what the operator owes after the case, Brilakis's per-lesson checklist, the review of results, the hand-over and what the next operator will look for.",
        },
        { kind: "h", text: "What the operator's report must contain" },
        {
          kind: "table",
          caption: "The operator's report and plan (Oxford ch 2, the cardiologist's post-procedural duties)",
          head: ["Section", "What to put in it"],
          rows: [
            ["Clinical history", "The presentation and relevant background that led to the procedure"],
            ["Indication", "Why the procedure was done: the question it was meant to answer"],
            ["Anatomy", "The coronary anatomy and the pattern of disease, artery by artery"],
            ["Procedure", "The steps of any intervention, in order"],
            ["Equipment", "What was used; for stents, the number, type, diameter and length of every stent"],
            ["Complications", "Any that occurred, and how each was managed"],
            ["Post-procedure plan", "Haemostasis, medicines for primary and secondary prevention, cardiac rehabilitation where indicated, discharge plan and follow-up"],
            ["Radiation", "If the radiographer warned that 1 Gy had been reached, the dose received, which Oxford asks the operator to record in the report and explain to the patient"],
          ],
        },
        {
          kind: "p",
          text: "The report is only one item on Oxford's list. Before the patient leaves the lab, the operator checks that every piece of kit has come out intact, so that nothing apart from the stent remains in the circulation, and signs the patient out. Oxford also lists a detailed letter to the general practitioner covering the stay, the procedural outcome and the future plan, and, after a death in the lab, informing the department manager and the coroner. For a PCI, record the final result the way Oxford judges it: from two or more orthogonal projections, taken after the coronary wire has been pulled out so that it cannot distort the vessel; angiographic success is generally taken as a residual diameter stenosis under 20%.",
        },
        { kind: "p", text: "Oxford gives the operator four more duties once the case is over:" },
        {
          kind: "list",
          items: [
            "Tell the patient and family how the procedure went, and about any incident or complication, under the duty of candour (communication lesson).",
            "Keep watching the patient afterwards, looking above all for the first signs of a complication or of kidney failure (monitoring lesson).",
            "Stay responsible for the patient's overall care until discharge.",
            "Debrief the lab team at the end of the day, particularly after a complication or whenever there are lessons worth sharing.",
          ],
        },
        { kind: "tip", id: "pci-post-report-stents" },
        { kind: "h", text: "Describing each lesion: Brilakis's checklist" },
        {
          kind: "p",
          text: "Brilakis assesses the same parameters for every artery and lesion in each run (section 6.8). Working through them in a fixed order is what makes a report reproducible. The full definitions and scales are taught in pm-interpreting; the table is the checklist to write against.",
        },
        {
          kind: "table",
          caption: "What to record for each lesion (Brilakis 6.8)",
          head: ["Parameter", "How to express it in the report"],
          rows: [
            ["Flow", "TIMI flow grade 0–3"],
            ["Severity", "Percent diameter stenosis against the adjacent angiographically normal segment, from the orthogonal view in which it looks worst and is least foreshortened. Brilakis treats 70–90% or more outside the left main, and 50% or more in the left main, as significant, but prefers physiology to decide on intervention (not in an ACS culprit)"],
            ["Length", "Measured in millimetres between the normal-looking reference segments on either side"],
            ["Thrombus", "TIMI thrombus grade 1–5; angiography detects thrombus poorly and can mistake a calcific nodule for it"],
            ["Calcification", "Severe: calcium visible on both sides of the vessel wall on fluoroscopy before any contrast, even when the heart is still. Moderate: densities under 50% of the reference diameter, often seen only with cardiac motion. Angiography underestimates calcium compared with intravascular imaging"],
            ["Dissection", "NHLBI type A–F"],
            ["Branch involvement", "Bifurcation lesion, using the European Bifurcation Club definition"],
            ["Ostial location", "Within 3–5 mm of the origin: aorto-ostial (RCA, left main, grafts) or branch ostial"],
            ["Tortuosity", "Proximal: moderate with at least 2 bends over 70° or 1 over 90°; severe with 2 bends over 90° or 1 over 120°. Within the lesion, a bend over 45° is significant for a CTO"],
            ["Aneurysm", "A local or diffuse widening to over 1.5 times the neighbouring normal diameter"],
            ["Collaterals", "Rentrop grade for filling and Werner grade for size"],
            ["Perforation", "Ellis class, and location (large vessel, distal or collateral)"],
            ["Fistula", "Connection and destination"],
          ],
        },
        {
          kind: "p",
          text: "**An honest report beats a confident one.** Brilakis is explicit: if the artery could not be filled completely, call the angiogram non-diagnostic rather than offer an interpretation that may be wrong. His causes of incomplete filling are a small catheter (4 F above all), side holes, large or ectatic arteries, poor engagement, high coronary flow (as in dilated or hypertrophic obstructive cardiomyopathy, severe aortic stenosis or an arteriovenous fistula), viscous contrast (iso-osmolar agents are thicker than low-osmolar ones), a weak injection and a high LVEDP. To prevent it, change to a wider lumen (a guide catheter, or a bigger French size of diagnostic catheter), avoid side-hole catheters and inject more forcefully, perhaps with an automated injector; if the pressure is slightly damped, inject by hand, because a manual injection lets you adjust the force.",
        },
        { kind: "tip", id: "diag-post-nondiagnostic" },
        {
          kind: "check",
          stem: "A colleague's PCI report reads: 'Successful PCI to mid LAD with DES. Good result. Continue DAPT.' You are booked to treat a new lesion in the same patient. Which omission will cost you most?",
          options: [
            "The make of the contrast agent and the total volume of contrast used for the case",
            "The number, diameter and length of the stents, and the final result in orthogonal views",
            "The name of the scrub nurse and the time at which the case started and finished",
            "The patient's height and weight, which can be found in the nursing notes anyway",
          ],
          answer: 1,
          explanation:
            "Oxford asks for the number, type, size and length of every stent, and you need them to decide where a new stent may overlap, which balloon to post-dilate with and whether the earlier result was adequate (two orthogonal views, wire out, residual stenosis under 20%). Contrast volume matters for the kidneys and belongs in the record, but it does not change how you treat the next lesion.",
        },
        { kind: "h", text: "Reviewing the results before the patient leaves" },
        {
          kind: "steps",
          title: "Oxford's review of a case (ch 11)",
          items: [
            {
              title: "1. Put the question and the answer side by side",
              detail: "Re-read the clinical indication, the diagnostic findings of the case and anything learned during the admission.",
            },
            {
              title: "2. Go through every stored loop",
              detail: "For both diagnostic angiography and PCI, look at each run again specifically to exclude a complication such as a dissection or an embolus that was missed in the moment.",
            },
            { title: "3. Re-measure the stenoses", detail: "Reassess the quantification of each narrowing rather than relying on the estimate made during the case." },
            { title: "4. Note the haemodynamics", detail: "Examine the pressure data and write the values down." },
            {
              title: "5. Look at the bloods",
              detail: "Make the results available for comment, in particular renal function, cholesterol and glucose.",
            },
            {
              title: "6. After complex PCI, check for myocardial injury",
              detail:
                "An ECG and, where needed, a cardiac troponin. Oxford notes that routine enzyme measurement after PCI picks up small, usually silent infarcts that still carry a higher later risk of death or MI.",
            },
            {
              title: "7. Make it a teaching moment",
              detail: "Oxford regards these reviews as excellent education and training, and wants every member of the team invited.",
            },
          ],
        },
        { kind: "tip", id: "pci-post-ecg-complex" },
        { kind: "tip", id: "pci-post-ecg-bifurcation" },
        { kind: "h", text: "Handing over to the ward" },
        {
          kind: "p",
          text: "The hand-over starts in the lab. The team brief has already named the destination (day-case unit, cardiology ward, coronary care or another ward). At sign out the scrub nurse confirms that the procedure is documented, records any equipment left in place and any unexpected issue, records the need for and duration of dual antiplatelet therapy and whether the loading dose was given in the lab or must be given on arrival, and highlights concerns for recovery; Oxford keeps the patient in the lab until every section is done (taught step by step in pm-monitoring). Then, on the ward, the nurses must be told four things.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "What was done, and who did it.",
            "Any difficulty or complication during the case.",
            "The drugs given: medication, anticoagulation and sedation.",
            "The access sites, any closure device, every line still in place, and when each line is to come out.",
          ],
        },
        { kind: "tip", id: "diag-post-ward-handover" },
        {
          kind: "check",
          stem: "You transfer a patient after radial PCI with a femoral venous sheath left in from a temporary pacing wire that has since been removed. Heparin was given and midazolam 2 mg. Which hand-over follows Oxford?",
          options: [
            "Procedure and operator, any difficulty, heparin and sedation given, both access sites, the venous sheath still in place and when it should come out",
            "Procedure and operator, and that the result was good; the drug chart will show anything given in the lab without further comment",
            "The radial band only, because the venous sheath is low-pressure and the ward does not need to know about it",
            "The diagnosis and the plan for discharge tomorrow; details of the lab drugs are for the operator's report rather than the ward",
          ],
          answer: 0,
          explanation:
            "Oxford's hand-over has four parts: the procedure and who did it, difficulties or complications, medication, anticoagulation and sedation used, and the access sites, closure devices, lines in situ with the timing of their removal. A forgotten venous sheath in an anticoagulated, sedated patient is exactly what this list is designed to prevent. The drug chart does not tell the nurse why the patient is drowsy.",
        },
        { kind: "h", text: "Writing for the next operator" },
        {
          kind: "p",
          text: "Brilakis's planning checklist (Table 1.1) shows what a future operator will hunt for in your report and images before the next procedure. Writing these down now saves that operator time, contrast and complications.",
        },
        {
          kind: "list",
          items: [
            "Access: where the femoral bifurcation lies, peripheral arterial disease, a scarred groin, stented or narrowed iliac arteries, a radial loop, a narrowed or tortuous subclavian artery, whether a long sheath was needed, and any access problem that forced a crossover.",
            "Coronary features: the extent of calcification, previous stents, old severe lesions left untreated, an anomalous coronary origin, and any difficulty engaging the LIMA or other grafts.",
            "Equipment: the diagnostic and guide catheters used and whether they gave enough support, the guidewires used, any difficulty delivering stents, and whether atherectomy was needed.",
          ],
        },
        {
          kind: "p",
          text: "**After a death in the lab** Oxford asks every member of staff for clear, legible notes: the exact timing of events, who was present, the equipment used and the perceived mechanism, and a record of whether the family has been reached and what was said to them. Talking to the family is covered in the communication lesson of this module.",
        },
        { kind: "tip", id: "diag-post-radiation-record" },
        {
          kind: "pitfalls",
          items: [
            "'Good result' with no stent sizes, no final views and no residual stenosis.",
            "Calling an incompletely filled artery normal instead of reporting the study as non-diagnostic.",
            "Reporting a stenosis from a foreshortened view, or from a single projection.",
            "A hand-over that leaves out a sheath, a closure device or the sedation given.",
            "Never reviewing the stored loops, so a small dissection seen only on one run goes unrecorded.",
            "Omitting a radiation dose that triggered the 1 Gy warning.",
          ],
        },
        {
          kind: "pearl",
          text: "Dictate the report while the runs are still on the screen and before you leave the control room. The details you will forget first, which catheter gave support, which wire crossed, where the stent edges sit, are exactly the ones the next operator needs.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, finish a diagnostic case and write the hand-over note before the patient leaves: procedure and operator, difficulties, drugs (heparin, sedation, nitrate), access site and closure, lines and their removal time. Then list, for each lesion you saw, the flow grade, stenosis, length and any calcium, thrombus, ostial or bifurcation involvement.",
        },
        { kind: "video", id: "qK2euYOpfEU", note: "Manual of PCI chapter video 6.2: how to interpret the coronary angiogram." },
        {
          kind: "keypoints",
          items: [
            "Oxford's report: history, indication, anatomy and pattern of disease, procedural steps, equipment with the number, type, size and length of stents, complications and their management, and the care plan.",
            "The operator also checks the kit is intact, signs out, tells the patient and family, watches for complications and kidney failure, stays responsible until discharge and debriefs the team.",
            "The plan covers haemostasis, prevention medicines, cardiac rehabilitation, discharge and follow-up; the GP gets a detailed letter.",
            "Describe each lesion with Brilakis's parameters: flow, stenosis from the worst least-foreshortened view, length, thrombus, calcium, dissection, branch and ostial involvement, tortuosity, aneurysm, collaterals, perforation, fistula.",
            "An artery that could not be filled completely is a non-diagnostic study, not a normal one.",
            "Review every loop, re-measure the stenoses, note the haemodynamics and bloods, and check ECG and troponin after complex PCI.",
            "Hand over four things: procedure and operator, difficulties, drugs given, access sites and lines with removal times.",
            "Record what the next operator will need: access problems, catheters and support, wires, delivery problems, calcium.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-after-the-procedure-monitoring",
      title: "Recovery on the ward: observations, mobilisation and warning signs",
      minutes: 15,
      topics: ["post-monitoring"],
      sources: [
        O("ch 11: Nursing care"),
        O("ch 11: The patient"),
        O("ch 2: The nurse"),
        O("ch 3: Femoral artery access"),
        O("ch 3: Arterial closure devices"),
        O("ch 1: Patient preparation"),
        O("ch 10: Hypotension"),
        O("ch 10: Cardiac tamponade"),
        O("ch 10: Stroke"),
        O("ch 10: Renal failure"),
        O("ch 10: Contrast nephropathy"),
        O("ch 10: Vascular complications"),
        B("1.3"),
        B("2.7"),
        B("28.3"),
      ],
      refs: [...BOOKS, "grossman-nifedipine-1996", "powers-acute-stroke-2019", "vandermolen-pcaki-definition-2018", "vandermolen-esur-pcaki-2018"],
      blocks: [
        {
          kind: "p",
          text: "Most catheter labs recover patients on a dedicated ward or day-case unit staffed by specialist nurses, who check the patient in, record the medicines, take observations, talk through the procedure and help remove arterial and venous lines. Their job after the case is to catch complications early, while they are still easy to treat. The Academy lesson pci-after-monitoring-hypotension works through the hypotensive patient; this lesson sets out Oxford's recovery routine step by step and what each finding should trigger.",
        },
        { kind: "h", text: "When the patient arrives on the ward" },
        {
          kind: "steps",
          items: [
            { title: "1. Pulse and blood pressure at once", detail: "Check them and write them down the moment the patient arrives, before anything else." },
            {
              title: "2. A quick neurological check",
              detail: "A brief assessment to exclude a neurological event that happened during the transfer, so that a deficit is not discovered hours later with no clear start time.",
            },
            {
              title: "3. Look at every access site",
              detail: "Arterial and venous, for bleeding or bruising. If a sheath is still in, agree the plan and the time for removing it.",
            },
            {
              title: "4. Start regular observations",
              detail:
                "Pulse, blood pressure and oxygen saturation, with particular attention after sedation. Oxford's nursing section lists the full set: non-invasive blood pressure, respiratory rate, oxygen saturation, and three-lead ECG monitoring if a stent was placed.",
            },
            { title: "5. ECG after complex PCI", detail: "Record a 12-lead ECG to help diagnose a procedural myocardial infarction." },
            {
              title: "6. Watch the kidneys when they are at risk",
              detail: "In known or suspected renal dysfunction, chart the urine output and consider blood tests to see whether renal function has changed.",
            },
          ],
        },
        {
          kind: "table",
          caption: "How often, and what to look at (Oxford ch 2, post-procedure care); nursing judgement adjusts the frequency to the patient's condition",
          head: ["What", "Schedule and content"],
          rows: [
            ["Observations", "Typically every 15 minutes for the first hour, every 30 minutes for the second hour, then hourly"],
            ["Radial site", "Confirm patent haemostasis; inspect every 15 minutes until the radial haemostasis device is off, for a change in the colour, sensation, temperature, shape or size of the forearm, the pulse, and pain; manage bleeding or haematoma; look for infection if the stay is long"],
            ["Femoral site", "Femoral, popliteal and pedal pulses on the punctured side; inspect every 15 minutes until the patient is mobile, for the same changes; manage bleeding or haematoma; look for infection if the stay is long"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis makes the same point from inside the lab (section 2.7): feel the pulses at the access site and distal to it at the start and again at the end of the case, so that a change can be recognised, and keep looking at and feeling the site, because early bleeding and haematoma are found by inspection and palpation.",
        },
        { kind: "tip", id: "access-post-pulses-start-end" },
        { kind: "tip", id: "access-post-radial-obs" },
        {
          kind: "check",
          stem: "Forty minutes after femoral diagnostic angiography with manual compression, the nurse asks how often to observe the patient for the next two hours. What does Oxford's routine give?",
          options: [
            "Every 15 minutes until the end of the first hour, then every 30 minutes through the second hour, with groin and distal pulse checks every 15 minutes until mobile",
            "Hourly from arrival, because femoral punctures that have been compressed manually no longer bleed once the first 30 minutes have passed",
            "Every 5 minutes for two hours, then stop observations entirely once the patient is allowed to sit up and to eat",
            "Every 30 minutes from the start, with the groin examined only if the patient reports pain or notices fresh blood",
          ],
          answer: 0,
          explanation:
            "Oxford typically observes every 15 minutes in the first hour, every 30 minutes in the second and hourly after that, adjusted by nursing judgement, and checks a femoral site and the femoral, popliteal and pedal pulses every 15 minutes until the patient is mobile. These checks run on a schedule until the patient is mobile, not only when symptoms appear: a retroperitoneal bleed after a high puncture may first show as a falling blood pressure, with flank bruising seen only occasionally (Oxford ch 10).",
        },
        { kind: "h", text: "Sitting up, walking and eating" },
        {
          kind: "p",
          text: "Most patients need only a brief period of rest and observation. Make an explicit plan for when the patient may sit up, walk, eat and drink; it depends on local practice, the access site, the size of the puncture and whether it was arterial or venous. Oxford's figures are a guide, not a protocol.",
        },
        {
          kind: "table",
          caption: "Time to mobilise in Oxford",
          head: ["Situation", "Oxford's guide"],
          rows: [
            ["Radial access, a vascular closure device, or a small femoral sheath", "The time before walking can be short, about 1 hour"],
            ["6 F femoral arterial puncture (ch 11)", "Lie flat for 1 hour after the line is removed; walk from 2½ hours after removal"],
            ["Femoral line removal (ch 3)", "Usually up and about once 3 hours of bed rest have passed"],
          ],
        },
        {
          kind: "p",
          text: "The two Oxford chapters differ slightly (2½ hours from removal against 3 hours of bed rest), which is one more reason to follow the local protocol and write the plan down. Femoral sheath removal itself (Oxford delays it until the ACT has fallen below 150–200 seconds, or for 3–4 hours, presses firmly with at least two fingers about 1 cm proximal to the arterial puncture, and holds pressure for roughly 8–10 minutes) is taught in pm-closure. Oxford adds that a hypertensive patient may need an antihypertensive before removal to help haemostasis. Its example, sublingual nifedipine capsules, is no longer used, because of reports of abrupt hypotension, stroke, myocardial infarction and death (Grossman 1996); use a titratable agent according to local protocol (pm-closure).",
        },
        { kind: "tip", id: "access-post-femoral-mobilise" },
        {
          kind: "p",
          text: "**Diabetes.** Oxford asks the team to encourage eating and drinking once the patient has recovered and to restart the usual medication. It notes that the risk of lactic acidosis on metformin is very low when renal function is normal, yet still withholds metformin on the day before the procedure and for 2 days afterwards. Brilakis is less restrictive: in chronic kidney disease he holds it on the day of the procedure and restarts it no sooner than 48 hours later; without chronic kidney disease it can continue, with renal function checked afterwards and the drug held if that function worsens. The 2018 ESUR recommendations stop metformin from the time of contrast only when the eGFR is below 30, in acute kidney injury, or when contrast reaches the kidneys on its first pass (for example a left ventriculogram or an aortogram above the renal arteries; ESUR counts coronary injections as second-pass). Follow the local protocol and write the restart date in the plan.",
        },
        { kind: "h", text: "Warning signs and what each one triggers" },
        {
          kind: "table",
          caption: "Recognising trouble after the case (Oxford ch 2 and ch 10; Brilakis 28.3)",
          head: ["Finding", "What it may mean", "First action"],
          rows: [
            ["Chest pain, especially after PCI", "Oxford: possibly a procedural complication. Examples are acute vessel closure, which Oxford treats with immediate revascularisation (ch 10), and stent thrombosis", "Record a 12-lead ECG first and tell the operator"],
            ["Any change in the haemodynamics", "Bleeding, tamponade, ischaemia, a drug effect", "Alert the nurse in charge, who escalates"],
            ["Hypotension", "Common before, during and after catheterisation from fasting and blood-pressure-lowering drugs, and often corrected by a slow IV infusion; but exclude the other reversible causes, tamponade, a contrast reaction, a vasovagal reaction, bleeding and ischaemia, some of them dangerous if left untreated", "Call for senior help and give fluids while you look for the reversible causes: the access site and haemoglobin, an ECG and a bedside echo (pci-after-monitoring-hypotension)"],
            ["Tachycardia, hypotension and syncope over minutes", "Cardiac tamponade (after a coronary perforation, an intramyocardial injection during ventriculography, or catheters or pacing wires in the right ventricle)", "Echocardiography confirms it; with high suspicion, immediate pericardiocentesis. Oxford then leaves the drain in until the bleeding stops (possibly a few days), considers reversing heparin with protamine and giving platelets and clotting factors, and treats the cause, such as sealing a perforation with a covered stent or coils (cm-patient-complications)"],
            ["New visual disturbance, weakness, aphasia or confusion", "Stroke, which can appear hours after the study through late embolisation", "Airway, breathing and circulation first (Oxford). Note the time of onset and call the stroke team at once; full neurological examination documented in the notes; urgent CT to exclude haemorrhage, with CT angiography to find a large-vessel occlusion that thrombectomy could treat (AHA/ASA 2019); review the anticoagulant and antiplatelet status with the stroke team"],
            ["Rising creatinine", "Contrast nephropathy. Oxford uses the older definition: a creatinine increase, 24–48 hours after the procedure, reaching 44 µmol/L, or more than 25% over baseline (44 µmol/L equals 0.5 mg/dL). The 2018 ESUR recommendations call it post-contrast acute kidney injury and use the KDIGO threshold instead: a rise of at least 0.3 mg/dL (26.5 µmol/L), or to at least 1.5 times baseline, within 48–72 hours", "Brilakis monitors creatinine for at least 48 hours and makes hydration with normal saline the key action after the case. ESUR puts the usual peak at 2–3 days and Oxford at 4–5 days, so a normal 48-hour value does not settle it; recheck patients at risk at 48–72 hours or later"],
          ],
        },
        {
          kind: "p",
          text: "**Protecting the kidneys after the case.** In patients at risk, Oxford gives 0.45–0.9% saline, 1 mL/kg/hour, for the 12 hours on each side of the procedure and withholds nephrotoxic drugs where it can. Brilakis specifies normal saline, because no other fluid, half-normal saline and bicarbonate included, has been shown to do better. The manuals therefore differ on half-normal saline; follow the local protocol. Once the injury has happened there is no specific treatment. Oxford expects renal function to drift back to baseline over about a week (ESUR: within 1–3 weeks), and fewer than 1% of patients are left with permanent, dialysis-dependent renal failure.",
        },
        { kind: "tip", id: "pci-post-chest-pain-ward" },
        { kind: "tip", id: "pci-post-contrast-kidney" },
        {
          kind: "check",
          stem: "Three hours after an uncomplicated elective PCI, a patient says the vision in one half of his visual field has gone. His airway, breathing, blood pressure and access site are normal. Which response follows Oxford and current stroke guidance?",
          options: [
            "Reassure him that transient visual upset is common after contrast, and review him again on the morning ward round",
            "Note the time of onset, call the stroke team, examine and document, review his anticoagulation and arrange urgent CT with CT angiography",
            "Give a further dose of heparin straight away, because a stroke after PCI is always embolic and heparin will stop it extending",
            "Restart observations at 15-minute intervals and wait to see whether the deficit resolves within 24 hours before arranging any imaging",
          ],
          answer: 1,
          explanation:
            "Oxford warns that stroke symptoms can start hours after the study because of late embolisation; visual disturbance is among the commonest. Oxford's sequence is airway, breathing and circulation, then a full neurological examination recorded in the notes, the anticoagulation status (haemorrhagic or embolic?), CT to exclude haemorrhage and expert input such as the stroke unit. Current AHA/ASA guidance adds vascular imaging, so that a large-vessel occlusion can be treated by mechanical thrombectomy, which is why the stroke team is called at once and the time of onset recorded. Waiting 24 hours loses that chance, and heparin before CT could worsen a bleed.",
        },
        { kind: "h", text: "Teaching the patient to look after the site" },
        {
          kind: "list",
          items: [
            "Report any chest pain or dizziness at once.",
            "Drink to rehydrate after the procedure.",
            "Avoid activities that could make the puncture site bleed, and know how to press on it if it does.",
            "Keep to bed rest after femoral access.",
            "Understand why dual antiplatelet therapy matters after a stent and what a missed dose can lead to.",
            "For the first 48 hours, avoid strenuous activity and alcohol, and, if sedation was given, do not sign legal documents; follow the driving advice.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Skipping the neurological check on arrival, so a stroke during transfer has no time of onset.",
            "Treating post-procedure hypotension as dehydration without excluding bleeding, tamponade, a contrast reaction and ischaemia.",
            "Giving sublingual nitrate for chest pain on the ward before a 12-lead ECG.",
            "No written plan for sitting up, walking and eating, so each nurse guesses.",
            "Assuming a normal creatinine at 48 hours rules out contrast nephropathy.",
            "Not comparing the distal pulses with those recorded at the start of the case.",
          ],
        },
        {
          kind: "pearl",
          text: "A slow pulse with a falling pressure during sheath removal is often vagal, but write down the time and recheck the site and the haemoglobin anyway: Oxford lists bleeding alongside the vasovagal reaction among the reversible causes, and the two can occur together.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab's recovery stage, set the observation schedule (15-minutely for the first hour, 30-minutely for the second, then hourly), check the access site and distal pulses against those recorded at the start, write the mobilisation and eating plan for the access route used, and say what you would do if the patient developed chest pain.",
        },
        { kind: "video", id: "XPF_SXb657U", note: "Manual of PCI chapter video 2: monitoring." },
        {
          kind: "keypoints",
          items: [
            "On arrival: pulse and blood pressure documented, quick neurological check, all access sites inspected, a plan for any sheath.",
            "Observations every 15 minutes for the first hour, every 30 minutes for the second, then hourly; three-lead ECG if stented.",
            "Radial site checks every 15 minutes until the band is off; femoral site and femoral, popliteal and pedal pulses every 15 minutes until mobile.",
            "Walking after about 1 hour with radial access, a closure device or a small sheath; after a 6 F femoral arterial puncture, flat for 1 hour after line removal and walking from 2½ hours after removal (Oxford ch 11).",
            "Chest pain: 12-lead ECG first, then the operator. Haemodynamic change: the nurse in charge.",
            "Stroke can appear hours later: call the stroke team, examine, document and scan (CT and CT angiography).",
            "Creatinine can keep rising after 48 hours (usual peak 2–3 days, up to 4–5 days in Oxford), so recheck patients at risk at 48–72 hours or later.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-after-the-procedure-dapt",
      title: "The antiplatelet plan at discharge: DAPT duration, high bleeding risk and triple therapy",
      minutes: 18,
      topics: ["ph-dapt-hbr"],
      sources: [B("3.5"), B("1.1"), B("10.2"), O("ch 8: Antiplatelet therapy"), O("ch 8: Stent thrombosis"), O("ch 11: Communication"), O("ch 2: The nurse")],
      refs: [
        ...BOOKS,
        "esc-acs-2023",
        "urban-arc-hbr-2019",
        "valgimigli-master-dapt-2021",
        "lopes-augustus-2019",
        "esc-ncs-2022",
      ],
      blocks: [
        {
          kind: "p",
          text: "The antiplatelet plan decides more about the next year than almost anything done in the lab. Stopping too early risks stent thrombosis; Oxford names premature discontinuation of dual antiplatelet therapy (DAPT), or of clopidogrel alone, as a predisposing factor, and calls adherence crucial. Continuing too long, or adding drugs on top, causes bleeding. The drugs, their doses, loading and switching are taught in pm-antithrombotics, and the Academy lessons pci-pharm-dapt-duration and pci-pharm-oac summarise the guidelines. This lesson turns them into decisions, adds what changed after the manuals were written, and ends with how to write the plan so that it is followed.",
        },
        { kind: "h", text: "Five questions before you write the discharge prescription" },
        {
          kind: "steps",
          items: [
            { title: "1. Was this an ACS or stable disease?", detail: "It sets the default duration and the default P2Y12 inhibitor (clopidogrel in stable disease; prasugrel or ticagrelor in ACS, unless contraindicated)." },
            { title: "2. Is the bleeding risk high?", detail: "Apply the ARC-HBR criteria or the PRECISE-DAPT score (below)." },
            { title: "3. Is the ischaemic risk high?", detail: "It may justify longer or stronger treatment if bleeding risk allows (the DAPT score, below)." },
            { title: "4. Does the patient need an oral anticoagulant?", detail: "Then the regimen changes completely: aspirin goes early and clopidogrel is the partner." },
            { title: "5. Is surgery coming, or is adherence doubtful?", detail: "Brilakis would rather avoid PCI, and stent implantation where possible, if non-cardiac surgery is likely within 6–12 months or the patient is unlikely to take the medicines, preferring medical therapy or CABG; if a stent is already in, plan the timing of surgery with the surgeon (below)." },
          ],
        },
        { kind: "h", text: "How long: the manuals and the 2023 ESC ACS guideline" },
        {
          kind: "table",
          caption: "DAPT duration after PCI",
          head: ["Situation", "Brilakis 3.5", "Oxford Table 8.8", "Since the manuals"],
          rows: [
            ["Stable disease, bleeding risk not high", "6 months (clopidogrel)", "Aspirin with clopidogrel, 6 months", "See pci-pharm-dapt-duration for the 2024 ESC CCS guideline"],
            ["Stable disease, high bleeding risk", "3 months when PRECISE-DAPT is 25 or more", "Aspirin with clopidogrel, 3 months (the cell also carries the note 'No <1 month', which Oxford does not explain)", "MASTER DAPT (high-bleeding-risk patients with or without ACS): one month after a biodegradable-polymer sirolimus-eluting stent, switching from DAPT to a single antiplatelet drug was non-inferior to continuing DAPT for at least 2 more months and caused less bleeding"],
            ["ACS, bleeding risk not high", "12 months (prasugrel or ticagrelor)", "Aspirin with ticagrelor, clopidogrel or prasugrel, 12 months", "2023 ESC ACS: 12 months of DAPT with a potent P2Y12 inhibitor remains the default"],
            ["ACS, high bleeding risk", "6 months when PRECISE-DAPT is 25 or more", "Aspirin with clopidogrel or ticagrelor, 6 months", "2023 ESC ACS: aspirin or P2Y12 inhibitor monotherapy after 1 month of DAPT may be considered; MASTER DAPT (row above) included ACS patients"],
            ["Dropping aspirin early (P2Y12 monotherapy)", "TWILIGHT: stopping aspirin after 3 months and continuing ticagrelor alone reduced bleeding without more major adverse events", "Not covered", "2023 ESC ACS: in patients event-free after 3–6 months and not at high ischaemic risk, shorter DAPT, preferably followed by P2Y12 inhibitor monotherapy, should be considered"],
            ["Stepping down to clopidogrel", "An option when bleeding risk outweighs thrombotic risk after ACS PCI (Fig 3.4)", "Not covered", "2023 ESC ACS: not in the first 30 days; may be considered after 30 days to reduce bleeding"],
            ["Stepping up to ticagrelor or prasugrel", "Occasionally after elective PCI when thrombotic risk outweighs bleeding risk (Fig 3.4)", "Not covered", "Not reviewed in this lesson"],
            ["Longer than 12 months", "Considered when bleeding risk is not high and ischaemic risk is; a DAPT score of 2 or more favours it", "Not covered", "Not reviewed in this lesson; see pci-pharm-dapt-duration"],
          ],
        },
        {
          kind: "p",
          text: "Oxford gives two older minimums for clopidogrel by stent type, at least 4 weeks after a bare-metal stent and at least 6 months after a drug-eluting stent, adding that many centres now advise 12 months or more, above all after complex PCI. Brilakis's Fig 3.4 frames switching in both directions: stepping down to clopidogrel after ACS PCI, or up to a potent agent after elective PCI, decided on clinical, procedural and socioeconomic grounds, with platelet function testing or genotyping as possible guides. Oxford also gives two tables beyond PCI: after CABG for ACS the same 12 months (6 at high bleeding risk) as after PCI, no DAPT indication after CABG for stable disease, and, for ACS managed medically, 12 months of DAPT or more than 1 month of aspirin with clopidogrel at high bleeding risk.",
        },
        { kind: "h", text: "Deciding that bleeding risk is high" },
        {
          kind: "p",
          text: "Brilakis uses PRECISE-DAPT, which scores haemoglobin, white cell count, age, creatinine clearance and previous bleeding; a score of 25 or more means high bleeding risk. The 2023 ESC ACS guideline accepts that threshold and also the Academic Research Consortium definition (ARC-HBR): one major or two minor criteria.",
        },
        {
          kind: "table",
          caption: "ARC-HBR criteria at the time of PCI (Urban et al. 2019)",
          head: ["Domain", "Major criterion", "Minor criterion"],
          rows: [
            ["Age", "None", "75 years or older"],
            ["Anticoagulation", "Long-term oral anticoagulation expected", "None"],
            ["Kidneys", "eGFR under 30 mL/min (severe or end-stage CKD)", "eGFR 30–59 mL/min"],
            ["Haemoglobin", "Under 11 g/dL", "11–12.9 g/dL in men, 11–11.9 g/dL in women"],
            ["Previous bleeding", "Spontaneous bleeding needing admission or transfusion in the past 6 months, or at any time if recurrent", "Such bleeding in the past 12 months that does not meet the major criterion"],
            ["Platelets and clotting", "Platelet count under 100 × 10⁹/L before PCI; chronic bleeding diathesis; cirrhosis with portal hypertension", "None"],
            ["Drugs", "None", "Long-term oral NSAIDs or steroids"],
            ["Cancer", "Active malignancy (not non-melanoma skin cancer) within the past 12 months", "None"],
            ["Brain", "Previous spontaneous intracranial haemorrhage at any time; traumatic intracranial haemorrhage within 12 months; a brain arteriovenous malformation; moderate or severe ischaemic stroke within 6 months", "Any other ischaemic stroke at any time"],
            ["Surgery and trauma", "Major surgery that cannot be deferred, due while on DAPT; major surgery or major trauma within 30 days before PCI", "None"],
          ],
        },
        {
          kind: "p",
          text: "**Ischaemic risk and going beyond a year.** Brilakis reassesses at 12 months using the DAPT score (his Fig 3.6): age 75 or over scores −2, 65–74 scores −1 and under 65 scores 0; cigarette smoking, diabetes, MI at presentation, previous PCI or MI, a paclitaxel-eluting stent and a stent under 3 mm each score 1; heart failure or LVEF under 30% and vein graft stenting each score 2. A total of 2 or more favours continuing DAPT beyond 12 months, in an uneventful patient without high bleeding risk. The figure is drawn for ACS patients: PRECISE-DAPT is applied at the time of PCI and the DAPT score at 12 months in patients who have had no events; in the study that validated it, short DAPT meant 3–6 months and standard DAPT at least 12.",
        },
        {
          kind: "check",
          stem: "A 68-year-old woman has PCI for NSTEMI. Her eGFR is 26 mL/min, haemoglobin 12.4 g/dL, and she takes no anticoagulant. How do the ARC-HBR criteria classify her, and what may the 2023 ESC ACS guideline allow?",
          options: [
            "Not high bleeding risk, since one criterion is not enough; give 12 months of DAPT with a potent agent",
            "High bleeding risk from one major criterion; aspirin or P2Y12 monotherapy after 1 month may be considered",
            "High bleeding risk from two minor criteria; stop all antiplatelet therapy after 1 month of DAPT",
            "Not classifiable without a PRECISE-DAPT score; give 6 months of aspirin alone without any P2Y12 inhibitor",
          ],
          answer: 1,
          explanation:
            "An eGFR under 30 mL/min is a major ARC-HBR criterion, and one major criterion is enough. Her haemoglobin of 12.4 g/dL is a minor criterion only in a man (in women the minor band is 11–11.9). For high-bleeding-risk ACS patients the 2023 guideline says monotherapy after 1 month of DAPT may be considered; a single antiplatelet drug then continues, it is not stopped.",
        },
        { kind: "h", text: "The patient who also needs an anticoagulant" },
        {
          kind: "p",
          text: "Brilakis's rule is simple: with warfarin or a direct oral anticoagulant, aspirin is usually stopped after the procedure (commonly after anything from 1–4 weeks to 6 months), and the patient continues the anticoagulant with clopidogrel; prasugrel and ticagrelor are avoided because the bleeding risk is high. Oxford's Table 8.10 sets the sequence by the balance of risks.",
        },
        {
          kind: "table",
          caption: "Oxford Table 8.10: antiplatelet therapy with an oral anticoagulant (A aspirin, C clopidogrel, O oral anticoagulant). Oxford leaves some cells empty and does not say whether the regimen above them simply continues; read them alongside the 2023 ESC sequence below.",
          head: ["Period", "Ischaemic risk higher than bleeding risk", "Bleeding risk higher, moderate", "Bleeding risk higher, high"],
          rows: [
            ["1st month", "A + C + O", "A + C + O", "C + O"],
            ["6th month", "Triple (A + C + O), or dual (A + O or C + O)", "Dual: A + O or C + O", "Blank in the table"],
            ["12th month", "Dual: A + O or C + O", "Blank in the table", "Blank in the table"],
            ["After the 12th month", "O", "O", "O"],
          ],
        },
        {
          kind: "p",
          text: "Oxford also notes that apixaban with clopidogrel may be better than adding aspirin. That is the AUGUSTUS trial: in 4,614 patients with atrial fibrillation and a recent ACS or PCI taking a P2Y12 inhibitor, apixaban caused less major or clinically relevant bleeding than a vitamin K antagonist (10.5% against 14.7%), aspirin caused more than placebo (16.1% against 9.0%), and ischaemic events did not differ significantly.",
        },
        {
          kind: "steps",
          title: "The 2023 ESC ACS guideline for a patient with atrial fibrillation who has PCI",
          items: [
            { title: "1. Question the anticoagulant", detail: "Re-assess the indication and continue it only if there is a compelling one." },
            { title: "2. Triple therapy for up to 1 week", detail: "Aspirin and clopidogrel with the anticoagulant, a non-vitamin K oral anticoagulant preferred, at the dose recommended for stroke prevention." },
            { title: "3. Then dual therapy for up to 12 months", detail: "The anticoagulant with one antiplatelet drug, preferably clopidogrel." },
            { title: "4. Adjust for the balance of risk", detail: "When ischaemic risk or anatomical and procedural features outweigh bleeding risk, triple therapy may continue for up to 1 month. In selected patients, such as those with several bleeding risk factors, dual therapy may be shortened to 6 months by stopping the antiplatelet drug." },
            { title: "5. Never with a potent P2Y12 inhibitor", detail: "Prasugrel or ticagrelor as part of triple therapy is not recommended." },
            { title: "6. After 12 months", detail: "Stop the antiplatelet drug and continue the anticoagulant alone in most patients." },
          ],
        },
        { kind: "tip", id: "pci-post-oac-clopidogrel" },
        {
          kind: "check",
          stem: "A 72-year-old man with atrial fibrillation on apixaban has PCI for NSTEMI. Ischaemic risk is not unusually high. Which discharge plan follows the 2023 ESC ACS guideline?",
          options: [
            "Apixaban, aspirin and ticagrelor for 12 months, then apixaban alone indefinitely afterwards",
            "Apixaban, aspirin and clopidogrel for up to 1 week, then apixaban and clopidogrel for up to 12 months, then apixaban alone",
            "Stop apixaban for 12 months and give aspirin with prasugrel instead, restarting apixaban afterwards",
            "Apixaban at a reduced dose with aspirin and clopidogrel for 6 months, because of the added antiplatelets",
          ],
          answer: 1,
          explanation:
            "The default is up to 1 week of triple therapy with aspirin and clopidogrel, then the anticoagulant with clopidogrel for up to 12 months, then the anticoagulant alone. The anticoagulant stays at its stroke-prevention dose. Ticagrelor or prasugrel in triple therapy is not recommended, and stopping the anticoagulant leaves the stroke risk untreated.",
        },
        { kind: "h", text: "Preventing and handling bleeding on DAPT (Brilakis 3.5)" },
        {
          kind: "list",
          items: [
            "Prevention: shorten aspirin in patients on an anticoagulant with a P2Y12 inhibitor; match the P2Y12 duration to the predicted bleeding risk; avoid prasugrel and ticagrelor at high bleeding risk, including patients on an anticoagulant; give a proton pump inhibitor routinely with DAPT.",
            "The 2023 ESC ACS guideline frames the proton pump inhibitor by risk: it is advised for patients on DAPT whose risk of gastrointestinal bleeding is higher than average, and anticoagulant therapy and long-term NSAIDs or corticosteroids are among the features that raise that risk.",
            "Treatment: control the bleeding site, and step down to clopidogrel if the patient was on ticagrelor or prasugrel.",
            "Life-threatening bleeding on an irreversible agent (aspirin, clopidogrel, prasugrel): platelet transfusion. With ticagrelor it may not work, because the drug binds the receptor reversibly; in 2020 Brilakis noted that a specific reversal agent was in development.",
          ],
        },
        { kind: "tip", id: "pci-post-bleeding-dapt" },
        { kind: "h", text: "Surgery after a stent" },
        {
          kind: "table",
          caption: "Surgery and antiplatelet therapy",
          head: ["Question", "Oxford Table 8.11 and ch 8", "2022 ESC non-cardiac surgery guideline"],
          rows: [
            ["When can elective surgery happen?", "Not stated", "After the full DAPT course: 6 months after elective PCI and 12 months after ACS"],
            ["And time-sensitive surgery?", "Not stated", "After at least 1 month of DAPT; at least 3 months should be considered in high-risk patients such as after ACS"],
            ["Aspirin?", "Not stopped (a case-by-case decision)", "Low-dose aspirin continued around the operation after previous PCI, unless bleeding risk is very high; surgery is done while the patient is still on aspirin"],
            ["When to stop the P2Y12 inhibitor, if it must stop", "Prasugrel 7 days, clopidogrel 5 days, ticagrelor 3 days before", "Prasugrel 7 days, clopidogrel 5 days, ticagrelor 3–5 days before"],
            ["Restart", "Day 1–4 after surgery", "As soon as possible after an interdisciplinary risk assessment, within 48 hours"],
            ["Heparin bridging?", "No evidence that heparin or low-molecular-weight heparin protects the stent", "Not covered here"],
          ],
        },
        {
          kind: "check",
          stem: "Four months after elective PCI with a drug-eluting stent for stable angina, a patient is listed for an elective hip replacement. The surgeon asks whether to stop clopidogrel. What do you advise, following the 2022 ESC guideline?",
          options: [
            "Stop both aspirin and clopidogrel 7 days before, and cover the gap with low-molecular-weight heparin",
            "Defer the elective operation until 6 months after the PCI, when the DAPT course is complete",
            "Operate now on aspirin alone, because DAPT after elective PCI needs only 1 month in every patient",
            "Operate now on full DAPT without interruption, as orthopaedic bleeding is easily controlled",
          ],
          answer: 1,
          explanation:
            "Elective non-cardiac surgery waits until the full DAPT course is complete, 6 months after elective PCI and 12 months after ACS. One month of DAPT is the minimum before surgery that is time-sensitive, which an elective hip replacement is not. Oxford adds that heparin bridging gives no proven protection to the stent.",
        },
        { kind: "h", text: "Writing the plan so that it happens" },
        {
          kind: "steps",
          items: [
            { title: "Name everything", detail: "Each drug, dose, start date and stop or review date; the proton pump inhibitor; which drug continues after DAPT ends." },
            { title: "Record the loading dose", detail: "At sign out, record the need for and duration of DAPT and whether the load was given in the lab or must be given on the ward (Oxford ch 2)." },
            { title: "Tell the patient why and for how long", detail: "Oxford asks the doctor to explain why new tablets are starting and how long to take them, particularly clopidogrel, and the nurse to explain the danger of missed doses." },
            { title: "Warn about side effects", detail: "Ticagrelor makes patients breathless more often than the other P2Y12 inhibitors: Oxford gives non-severe dyspnoea in up to 15% in the first week, and also bradycardia. Brilakis looks for another cause (heart failure, lung disease); if the breathlessness persists and none is found, he replaces ticagrelor with prasugrel or clopidogrel rather than leaving the patient without a P2Y12 inhibitor. For an allergic reaction he changes to another P2Y12 inhibitor, or desensitises to aspirin when aspirin is the cause; clopidogrel very rarely causes thrombotic thrombocytopenic purpura." },
            { title: "Put it in the discharge summary", detail: "The full medicine list with every change (next lessons)." },
          ],
        },
        { kind: "tip", id: "pci-post-dapt-plan" },
        {
          kind: "pitfalls",
          items: [
            "Calling a woman with haemoglobin 12.4 g/dL anaemic under ARC-HBR, or missing that one major criterion is enough.",
            "Twelve months of triple therapy by default, or ticagrelor or prasugrel added to an anticoagulant and aspirin.",
            "Stepping down from a potent P2Y12 inhibitor in the first 30 days after ACS without bleeding.",
            "Stopping aspirin and the P2Y12 inhibitor together for a minor operation, and bridging with heparin.",
            "A discharge letter that says 'DAPT' without the drugs, doses and stop dates.",
            "Expecting platelets to reverse ticagrelor in a life-threatening bleed.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask at the end of every PCI, before the patient leaves the lab: will this patient need an anticoagulant or an operation in the next year? If yes, the antiplatelet plan, and sometimes the stent strategy, should already reflect it.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure lab, after the PCI, write the antithrombotic discharge plan for the scenario: classify bleeding risk with ARC-HBR, choose the P2Y12 inhibitor and DAPT duration, state the stop dates, add a proton pump inhibitor, and if the patient takes an anticoagulant give the triple and dual therapy durations.",
        },
        { kind: "video", id: "mya4I8_dbMQ", note: "Dallas CVI 2016 debate: whether short or long DAPT is preferred after PCI (recorded before the current ESC guidance taught above)." },
        { kind: "video", id: "ggykHH5RGkY", note: "Dallas CVI 2015 lecture on anticoagulation strategies in atrial fibrillation (recorded before the current ESC guidance taught above)." },
        { kind: "video", id: "MEE4UZGHSWE", note: "Dallas CVI 2016 lecture on managing patients with stents who need non-cardiac surgery (recorded before the current ESC guidance taught above)." },
        { kind: "video", id: "w4RODmGMdEc", note: "Dallas CVI 2015 lecture: antiplatelet therapy, state of the art (recorded before the current ESC guidance taught above)." },
        {
          kind: "keypoints",
          items: [
            "Manuals: 6 months (stable) or 12 months (ACS), shortened to 3 or 6 months when PRECISE-DAPT is 25 or more; beyond 12 months when the DAPT score is 2 or more and bleeding risk is not high.",
            "2023 ESC ACS: 12 months with a potent P2Y12 inhibitor by default; shorter DAPT then preferably P2Y12 monotherapy for event-free patients after 3–6 months; monotherapy after 1 month may be considered at high bleeding risk; no de-escalation in the first 30 days.",
            "High bleeding risk: one major or two minor ARC-HBR criteria, or PRECISE-DAPT 25 or more.",
            "With an anticoagulant: clopidogrel, triple therapy up to 1 week (up to 1 month if ischaemic risk dominates), dual therapy up to 12 months, then the anticoagulant alone; never prasugrel or ticagrelor in triple therapy.",
            "Proton pump inhibitor with DAPT (Brilakis routinely; ESC 2023 when gastrointestinal bleeding risk is raised, as with an anticoagulant); platelets may not reverse ticagrelor.",
            "Elective surgery after 6 months (elective PCI) or 12 months (ACS); time-sensitive surgery after at least 1 month; keep aspirin; no heparin bridging.",
            "Write named drugs, doses and stop dates, and tell the patient why each tablet matters.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-after-the-procedure-communication",
      title: "Explaining results and complications to the patient and family",
      minutes: 14,
      topics: ["post-communication"],
      sources: [
        O("ch 11: Communication"),
        O("ch 11: Results"),
        O("ch 2: The cardiologist"),
        O("ch 1: Dose excess"),
        O("ch 10: Death"),
        B("7.1"),
        B("28.2"),
      ],
      refs: [...BOOKS, "gmc-nmc-candour-2015"],
      blocks: [
        {
          kind: "p",
          text: "Telling the patient what was found, and what happens next, is part of the procedure, and so is telling them honestly when something went wrong. Oxford makes both the operator's duty, the second explicitly under the duty of candour. Brilakis reminds us whose decision any treatment is: the patient's, with the operator and the heart team there to inform and support it. The Academy lesson bed-ind-decisions-consent covers consent before the case; this lesson covers the conversation after it.",
        },
        { kind: "h", text: "Giving the results: Oxford's sequence" },
        {
          kind: "steps",
          items: [
            { title: "1. Know the answer first", detail: "Examine the coronary anatomy and the results of the study before you speak, so that you give one clear message rather than a provisional one." },
            { title: "2. Wait for sedation to wear off", detail: "Oxford calls giving results under midazolam sedation unhelpful. The GMC/NMC candour guidance makes the same point for disclosure: speak at a time and in a place where the patient can best understand and remember what is said." },
            { title: "3. Choose the place", detail: "Somewhere quiet and away from other patients for anything sensitive: news that bypass surgery is needed should never be broken across a busy ward." },
            { title: "4. Ask who should be there", detail: "Check that the patient is happy for relatives or friends to stay; if not, ask them to step out." },
            { title: "5. Start with their experience", detail: "Ask how they found the procedure; the answer may change how you do the next one." },
            { title: "6. Explain in plain words", detail: "Go through the findings without jargon. Drawing the coronary arteries helps understanding and gives the patient something to look at later and show the family at home." },
            { title: "7. Leave room for questions", detail: "Give time, then offer information sheets or reliable websites." },
            { title: "8. Say what happens next and when", detail: "If you are referring them on, for example for CABG, give a likely timeframe." },
            { title: "9. Go through the medicines", detail: "Some may now be stopped. Explain why any new tablet is starting and how long it must continue, which matters most for drugs such as clopidogrel." },
            { title: "10. Write it down", detail: "Document the consultation in the medical notes." },
          ],
        },
        { kind: "tip", id: "diag-post-sedated-results" },
        {
          kind: "check",
          stem: "Twenty minutes after a femoral angiogram under midazolam, you have found left main disease that needs surgery. The patient is in a four-bed bay, drowsy, with his daughter beside him. What do you do?",
          options: [
            "Tell him now at the bedside, so he hears it before the daughter leaves, and draw the arteries on the report",
            "Wait until the sedation has worn off, then talk in a quiet room, check he wants his daughter there, and give a timeframe for surgery",
            "Tell the daughter in the corridor now and ask her to explain it to him when he is more awake later",
            "Leave the news for the surgeon to give in clinic, and tell him only that the test went well for now",
          ],
          answer: 1,
          explanation:
            "Oxford advises against giving results to a patient still sedated with midazolam, against breaking news of bypass surgery on a ward full of other patients, and asks that the patient agree to family being present. A likely timeframe for the surgery is part of the conversation. Saying the test went well is untrue. Telling the daughter before him, without his agreement, also goes against ordinary professional rules on confidentiality, which Oxford does not discuss here.",
        },
        { kind: "h", text: "When something has gone wrong" },
        {
          kind: "p",
          text: "The GMC and NMC joint guidance on the professional duty of candour asks every professional to be open and honest when something that goes wrong with care causes, or could cause, harm or distress. It names four duties: tell the patient, or their family or advocate where appropriate; say sorry; offer support or a remedy where one exists; and explain what the event means now and in the long run. It does not apply when a condition worsens through the natural course of the illness.",
        },
        {
          kind: "steps",
          title: "Disclosing a complication, step by step (GMC/NMC candour guidance)",
          items: [
            { title: "1. Make the patient safe first", detail: "Do what you can to put matters right; then you, or someone from the team, must speak to the patient. Usually that is the lead or accountable clinician, and someone in the team must take on the task." },
            { title: "2. Speak as soon as possible, in the right setting", detail: "Soon after you realise something has gone wrong, with someone available to support the patient, such as a relative, friend or colleague. Choose a time and place where the patient can best take the information in and retain it, give the information in words they can understand, and deliver distressing news considerately, respecting privacy and dignity." },
            { title: "3. Do not wait for the investigation", detail: "Share what you know and believe to be true about what happened, why, and the likely consequences; be clear about what is still uncertain, and answer questions honestly." },
            { title: "4. Apologise properly", detail: "Patients expect three things: what happened, what can be done about any harm, and what will be done to stop it happening to someone else. A personal 'I am sorry' means more than an organisation's regret, and an apology is not an admission of legal liability." },
            { title: "5. Respect a wish not to know", detail: "Offer the option of not hearing every detail; if the patient declines, try to understand why, respect it as far as possible after explaining the consequences, record it, and make clear they can ask later." },
            { title: "6. Leave a route back", detail: "Make sure the patient knows whom to contact in the team with further questions or concerns, and about advocacy, counselling or support services." },
            { title: "7. Record it", detail: "Write the details of the apology in the clinical record; a written apology may follow, depending on the patient's wishes and local policy. Report the incident through your organisation's system." },
          ],
        },
        { kind: "tip", id: "pci-post-complication-candour" },
        {
          kind: "p",
          text: "**Near misses** (an incident that could have harmed but did not) need judgement: tell the patient when the information is something they need or would want to know, and seek advice from a senior colleague if unsure. **After a death or severe harm** that leaves the patient unlikely to regain consciousness or capacity, the same openness is owed to those close to the patient. Oxford's list after a death in the lab: contact the next of kin and explain how events unfolded, because good communication often prevents complaints and litigation; let the family view the body in privacy if they wish and respect religious requirements; if a complication of the procedure contributed, speak to the unit manager and file an adverse incident report under local policy; tell the GP early, who will support the family; discuss the case with the coroner (Oxford asks for a post-mortem to be requested if the death is unexplained; the rules on reporting a death and on post-mortem examination are set nationally, so follow the local and national procedure); and give the team time to talk, postponing further cases if necessary. Oxford notes that some hospitals offer staff a counselling service after a death. The candour guidance adds that bereaved people should be treated with respect and sensitivity, taking account of what the patient wanted, including about sharing information; that support should be offered, for example help with practical tasks after a death or involving chaplaincy or bereavement staff; and that those close to the patient should have a named point of contact for later questions.",
        },
        {
          kind: "check",
          stem: "During PCI a wire caused a small distal perforation, sealed in the lab. The patient is stable and awake. He listens to your opening sentence and says, 'I don't want the details, just tell me I'm fine.' What does the candour guidance ask of you?",
          options: [
            "Tell him he is fine and move on, because a sealed perforation that caused no harm need not be disclosed at all",
            "Insist on giving every technical detail now, because he cannot waive his right to the information",
            "Find out why he does not want to hear it, explain what it could mean for him, respect his wish as far as possible, record it and tell him he can ask later",
            "Tell his wife the details instead, so that someone in the family knows what happened during the procedure",
          ],
          answer: 2,
          explanation:
            "Patients may choose not to receive every detail; the guidance asks you to explore why, explain the potential consequences, respect the wish as far as possible, record that he did not want the information and make clear he can change his mind. A perforation that needed treatment and needs monitoring is not a near miss, and saying 'you are fine' would be untrue. Telling his wife without his agreement would also go against ordinary professional rules on confidentiality.",
        },
        { kind: "h", text: "Explaining a high radiation dose" },
        {
          kind: "p",
          text: "Oxford asks the operator to record the dose in the report and explain it to the patient whenever the radiographer has warned that 1 Gy has been reached. Brilakis gives the reason this conversation matters: after an air kerma dose over 5 Gy the patient should be seen within a month and the skin of the back examined and documented, and someone who does not know the risk may take a red, sore patch to a dermatologist, whose biopsy can leave an ulcer that will not heal. Tell the patient what to look for and whom to contact.",
        },
        {
          kind: "pitfalls",
          items: [
            "Results given to a sedated patient, or to a relative before the patient.",
            "Bad news broken in an open bay.",
            "Medical terms such as 'TIMI 2' or 'Medina 1,1,1' left unexplained.",
            "No timeframe for a referral, so the patient waits without knowing what is normal.",
            "Waiting for the investigation before saying anything about a complication.",
            "A vague 'these things happen' instead of an explanation and a personal apology, and nothing written in the notes.",
          ],
        },
        {
          kind: "pearl",
          text: "Draw it. A two-minute sketch of the three arteries with the narrowing or the stent marked, handed to the patient, does more than any leaflet: Oxford points out that the patient can show it to the family at home and look at it again when the questions come later.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "After a full procedure case, explain the findings to the patient as Oxford teaches: check sedation has worn off, pick a quiet setting, confirm who may be present, explain in plain words with a drawing, give the next step and its timeframe, review the medicines and document the conversation. Repeat after a case with a complication, disclosing it as the candour guidance asks.",
        },
        { kind: "video", id: "-XS6vpzZ4vk", note: "For patients: the ten most common questions about coronary CTOs." },
        {
          kind: "keypoints",
          items: [
            "Review the results first, wait for sedation to wear off, choose a quiet place and check who the patient wants present.",
            "Ask about their experience, explain without jargon, draw the arteries, leave time for questions and offer written information.",
            "Give the timeframe for any referral, review every medicine and explain how long new ones last.",
            "Candour: tell, apologise, offer a remedy or support, and explain the short- and long-term effects.",
            "Speak as soon as possible, with support present, without waiting for the investigation; say what is known and what is not.",
            "An apology is not an admission of legal liability; record it and report the incident.",
            "Record and explain a radiation dose after the 1 Gy warning; over 5 Gy, arrange skin review within a month.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-after-the-procedure-discharge",
      title: "Discharge: the plan, the advice and the summary",
      minutes: 13,
      topics: ["post-discharge"],
      sources: [
        O("ch 11: Discharge plans"),
        O("ch 11: Discharge summary"),
        O("ch 11: Results"),
        O("ch 2: The cardiologist"),
        O("ch 2: The nurse"),
        O("ch 1: Patient preparation"),
        O("ch 8: Stent thrombosis"),
        O("ch 10: Contrast nephropathy"),
        B("1.3"),
        B("28.2"),
        B("28.3"),
      ],
      refs: [...BOOKS, "dvla-fitness-to-drive", "vandermolen-pcaki-definition-2018"],
      blocks: [
        {
          kind: "p",
          text: "Oxford is blunt that the discharge summary is often done badly and with little thought, leaving the referrer and GP with no real idea of what the patient has been through. Discharge is where the plan made in the lab is handed to the people who will carry it out: the patient, the family and the GP. The Academy lesson pci-after-discharge gives a secondary-prevention checklist with current lipid targets; this lesson follows Oxford's discharge steps and adds the follow-up that the procedure itself generates.",
        },
        { kind: "h", text: "Before the patient goes" },
        {
          kind: "steps",
          items: [
            { title: "1. Planned before admission", detail: "The expected length of stay should be known before the patient comes in. Most diagnostic procedures are day cases; some complex cases are admitted electively overnight for observation." },
            { title: "2. Walking and sites settled", detail: "Confirm the patient is fully ambulant and that every arterial and venous access site is satisfactory." },
            { title: "3. Someone at home", detail: "Advise the patient to have someone with them at home on the evening they leave hospital, in case of problems." },
            { title: "4. Driving and work", detail: "Say when driving may resume and when to go back to work (UK rules below)." },
            { title: "5. Blood tests that must happen", detail: "Patients with renal dysfunction, and those restarting anticoagulation, need instructions on when to repeat bloods; if a test must be arranged, phone the person who will arrange it rather than relying on the letter." },
            { title: "6. A number to call", detail: "Give a telephone number for advice at home, for example the coronary care unit." },
          ],
        },
        {
          kind: "table",
          caption: "Driving after the procedure",
          head: ["Source", "Rule"],
          rows: [
            ["Oxford ch 11", "Usually no driving for at least 24 hours after an arterial puncture"],
            ["DVLA, car or motorcycle (group 1), elective PCI", "No driving for at least 1 week; DVLA need not be told"],
            ["DVLA group 1, ACS treated by successful PCI", "Driving may resume after 1 week if no other urgent revascularisation is planned (within 4 weeks of the event), the LVEF is at least 40% before discharge and there is no other disqualifying condition; otherwise after 4 weeks. DVLA need not be told"],
            ["DVLA, bus or lorry (group 2), elective PCI or any ACS", "Must stop driving and tell DVLA; relicensing may be considered after at least 6 weeks if the LVEF is at least 40%, the functional test requirements are met and there is no other disqualifying condition"],
          ],
        },
        {
          kind: "p",
          text: "UK patients should be pointed to the current DVLA guidance, which is updated regularly. Oxford's nurses add advice for the first 48 hours: no strenuous activity and no alcohol, and no signing of legal documents if sedation was given.",
        },
        {
          kind: "check",
          stem: "A lorry driver goes home the day after successful PCI for NSTEMI with an LVEF of 50%. What do you tell him about driving his lorry?",
          options: [
            "He may drive his lorry again after 1 week, because the PCI was successful and his LVEF is over 40%",
            "He must stop, tell DVLA, and may be considered for relicensing after at least 6 weeks if he meets the requirements",
            "He may drive after 24 hours, because that is the usual restriction after an arterial puncture",
            "He may drive after 4 weeks without telling DVLA, as long as he has no further chest pain",
          ],
          answer: 1,
          explanation:
            "For bus and lorry (group 2) licences, DVLA requires the driver to stop and notify it after any ACS; relicensing may be considered after at least 6 weeks with an LVEF of at least 40%, the functional tests and no other disqualifying condition. The 1-week rule applies to car and motorcycle (group 1) licences, and Oxford's 24 hours is a minimum after any arterial puncture, not the post-ACS rule.",
        },
        { kind: "h", text: "What the plan must cover" },
        {
          kind: "list",
          items: [
            "Haemostasis and the access site: what is normal and what to do if it bleeds.",
            "Medicines for primary and secondary prevention, with every change, including the antiplatelet plan with stop dates (previous lesson). Oxford's review of results looks specifically at cholesterol and glucose, and its pre-procedure checks record the lipid status.",
            "Cardiac rehabilitation where indicated.",
            "The discharge plan and future follow-up.",
            "Adherence: Oxford calls DAPT adherence crucial, and the nurse explains what missed doses can do.",
          ],
        },
        { kind: "h", text: "Follow-up created by the procedure" },
        {
          kind: "table",
          head: ["What happened in the lab", "What the discharge plan must arrange"],
          rows: [
            ["Air kerma over 5 Gy (Brilakis 28.2)", "Review within a month with the skin of the back examined and documented; refer to a dermatologist or plastic surgeon if injury is found"],
            ["Air kerma over 10 Gy (Brilakis 28.2)", "A qualified physicist calculates the peak skin dose promptly, and the skin is examined at 2–4 weeks"],
            ["Peak skin dose over 15 Gy (Brilakis 28.2)", "A sentinel event under the US Joint Commission: hospital risk management and the regulators are contacted within 24 hours. Elsewhere, follow the local and national reporting rules"],
            ["A large contrast load or renal impairment", "Creatinine for at least 48 hours (Brilakis 28.3), with a recheck at 48–72 hours or later in patients at risk, because it can keep rising (usual peak 2–3 days in ESUR, 4–5 days in Oxford); hydration"],
            ["Metformin", "Withheld for 2 days after the procedure (Oxford; Brilakis at least 48 hours in chronic kidney disease), so the restart date belongs in the plan"],
            ["Anticoagulation to restart", "Instructions on when to repeat the blood test (Oxford ch 11); also state in the plan the date on which the anticoagulant restarts"],
          ],
        },
        { kind: "tip", id: "pci-post-radiation-follow-up" },
        { kind: "h", text: "The discharge note and the discharge summary" },
        {
          kind: "p",
          text: "Oxford uses two documents. The patient leaves the department with a short discharge note saying which procedure was done and anything important to pass on, such as drug changes. A full typed summary follows without delay, preferably on the same day the patient goes home. The operator also owes the GP a detailed letter on the stay, the outcome and the plan.",
        },
        {
          kind: "table",
          caption: "Minimum content of the typed discharge summary (Oxford ch 11)",
          head: ["Item", "Example of what to write"],
          rows: [
            ["Diagnosis", "NSTEMI; single-vessel disease of the mid LAD"],
            ["Date and summary of the procedure", "Date; radial PCI to the mid LAD with one drug-eluting stent (diameter and length); complications, if any"],
            ["Management plan", "Secondary prevention, cardiac rehabilitation, blood tests due, skin review if the dose was high"],
            ["Full medicine list with changes", "Each drug and dose; what was started, stopped or changed; antiplatelet stop dates"],
            ["Follow-up", "Who sees the patient, when, and what to do in the meantime"],
          ],
        },
        {
          kind: "check",
          stem: "A patient with an eGFR of 38 mL/min goes home the day after PCI that used 240 mL of contrast. He takes metformin. Which discharge plan covers what the procedure requires?",
          options: [
            "Restart metformin the same evening, and repeat creatinine only if he feels unwell or notices reduced urine output",
            "A creatinine check at least 48 hours after the procedure, metformin withheld for 2 days, hydration advice, and the GP told by phone",
            "A creatinine check at 6 weeks in clinic, because contrast nephropathy is diagnosed only after a full month",
            "No renal follow-up, because contrast nephropathy causes symptoms that he would notice and report straight away",
          ],
          answer: 1,
          explanation:
            "Brilakis monitors creatinine for at least 48 hours and makes hydration the key action; Oxford withholds metformin for 2 days after the procedure (Brilakis, in chronic kidney disease, for at least 48 hours), notes that contrast nephropathy is usually asymptomatic and that creatinine can still be rising at 4–5 days, and asks you to call whoever must arrange an important blood test. Six weeks is too late to act, and waiting for symptoms misses a silent rise.",
        },
        {
          kind: "pitfalls",
          items: [
            "A discharge summary written days later, or not at all, with no stent details or medicine changes.",
            "Relying on the letter for a time-critical blood test instead of phoning.",
            "Telling a group 2 driver he can drive after a week.",
            "No skin follow-up after a long, high-dose case.",
            "Metformin restarted immediately in a patient with renal impairment and a large contrast load.",
            "No telephone number, so a bleeding access site at midnight goes to the nearest emergency department without the history.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the typed summary before the patient leaves, while the details are in front of you. Oxford wants it ideally on the day of discharge; done at the bedside, it also lets you check with the patient that the medicine list matches what they will actually take at home.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "At the end of a full procedure case, write the discharge note and the typed summary (diagnosis, date and summary of the procedure, plan, full medicine list with changes, follow-up), give the driving advice for the patient's licence group, and list any follow-up the case generated (radiation, kidneys, metformin, anticoagulation).",
        },
        { kind: "video", id: "9YiLAQ8qQ-Y", note: "Dallas CVI 2016 lecture on lipid-lowering guidelines." },
        {
          kind: "keypoints",
          items: [
            "Before discharge: fully ambulant, access sites satisfactory, someone at home that evening, a number to call.",
            "Driving: Oxford's minimum is 24 hours after arterial puncture; DVLA group 1 is at least 1 week after PCI, group 2 must notify DVLA.",
            "For 48 hours: no strenuous activity or alcohol, and no legal documents signed if sedation was given.",
            "Arrange the bloods that renal impairment or restarting anticoagulation needs, and phone the person responsible.",
            "Over 5 Gy: skin review within a month; over 10 Gy: physicist and skin review at 2–4 weeks; peak skin dose over 15 Gy: a reportable sentinel event in the US.",
            "Discharge note on leaving; typed summary ideally the same day: diagnosis, procedure with date, plan, full medicine list with changes, follow-up.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-after-the-procedure-q1",
      stem: "Which four items does Oxford say the ward nurses must be told when a patient returns from the catheter lab?",
      options: [
        "Procedure and operator; difficulties or complications; drugs given, including anticoagulation and sedation; access sites, closure devices and lines with removal times",
        "The diagnosis; the patient's next of kin and their contact details; the planned discharge date; and the name of the consultant responsible for ongoing care on the ward",
        "The contrast volume; the fluoroscopy time; the radiation dose-area product; and the total number of catheters that were used during the case",
        "The pre-procedure observations; the fasting time; the allergy status; and the result of the pregnancy test for any woman of child-bearing age",
      ],
      answer: 0,
      explanation:
        "Oxford's hand-over: what was done and by whom, difficulties or complications, the drugs, anticoagulant and sedation given, and every access site, closure device and line still in place with the time it comes out. The other lists contain items that matter elsewhere (consent, the report, the dose record) but do not tell the receiving nurse what to watch for.",
      difficulty: 1,
      refs: OX,
    },
    {
      id: "hb-after-the-procedure-q2",
      stem: "A patient returns to the ward after radial PCI with a stent. Which observation schedule and set fit Oxford's post-procedure care?",
      options: [
        "Blood pressure, respiratory rate and oxygen saturation every hour from arrival on the ward, with no ECG monitoring of any kind unless the patient develops chest pain",
        "Non-invasive blood pressure, three-lead ECG, oxygen saturation and respiratory rate every 15 minutes for an hour, then every 30 minutes, then hourly",
        "Continuous invasive arterial pressure for 24 hours, with a 12-lead ECG every 15 minutes during the first two hours",
        "Pulse and blood pressure on arrival and again at discharge only, since radial access rarely causes bleeding problems",
      ],
      answer: 1,
      explanation:
        "Oxford's full set is non-invasive blood pressure, three-lead ECG if stented, oxygen saturation and respiratory rate, typically every 15 minutes in the first hour, every 30 minutes in the second and hourly after that, with nursing judgement. The radial site is checked every 15 minutes until the band is off. Observing only at arrival and discharge would miss a forearm haematoma or ischaemia.",
      difficulty: 2,
      refs: OX,
    },
    {
      id: "hb-after-the-procedure-q3",
      stem: "After an uncomplicated 6 F femoral diagnostic angiogram, what does Oxford's chapter 11 suggest as a guide for mobilising?",
      options: [
        "Sit up at once and walk after 30 minutes, the same timing as after radial access",
        "Lie flat for 1 hour after line removal, then walk from 2½ hours after removal",
        "Strict bed rest for 6 hours after line removal, then walk with assistance",
        "Lie flat until the next morning, because femoral punctures rebleed with movement",
      ],
      answer: 1,
      explanation:
        "For a 6 F femoral arterial puncture Oxford's guide is an hour flat once the line is out, and walking only from 2½ hours after removal; its vascular access chapter says the patient can usually be mobilised after 3 hours of bed rest, and local protocol decides. About 1 hour is Oxford's figure for radial access, closure devices and smaller sheaths, not for this patient.",
      difficulty: 2,
      refs: OX,
    },
    {
      id: "hb-after-the-procedure-q4",
      stem: "Which of these is a major ARC-HBR criterion on its own, enough to make a patient high bleeding risk?",
      options: [
        "Age 81 years, in a patient with otherwise normal blood tests and no previous bleeding history",
        "An eGFR of 45 mL/min in a patient with diabetes and long-standing treated hypertension",
        "A haemoglobin of 10.6 g/dL in a man with iron-deficiency anaemia that is under investigation",
        "Long-term oral steroid treatment for rheumatoid arthritis, with no history of bleeding or ulcer",
        "A mild ischaemic stroke three years ago that left no residual neurological deficit at all",
      ],
      answer: 2,
      explanation:
        "Haemoglobin under 11 g/dL is a major criterion. Age 75 or over, an eGFR of 30–59 mL/min, long-term oral NSAIDs or steroids, and an ischaemic stroke at any time that does not meet the major criterion (moderate or severe within 6 months) are each minor; two minor criteria are needed for high bleeding risk.",
      difficulty: 3,
      refs: ["urban-arc-hbr-2019"],
    },
    {
      id: "hb-after-the-procedure-q5",
      stem: "A patient with atrial fibrillation on a DOAC has PCI for ACS. Thrombotic risk clearly outweighs bleeding risk because of complex left main stenting. Which plan matches the 2023 ESC ACS guideline?",
      options: [
        "Triple therapy with ticagrelor for 1 month, then the DOAC with ticagrelor for 12 months",
        "Triple therapy with clopidogrel for up to 1 month, then the DOAC with clopidogrel for up to 12 months",
        "Triple therapy with clopidogrel for a full 12 months, then the DOAC alone indefinitely once that is complete",
        "Aspirin with prasugrel for 12 months, with the DOAC paused until DAPT is finished",
      ],
      answer: 1,
      explanation:
        "The default is up to 1 week of triple therapy, but when ischaemic risk or anatomical and procedural features outweigh bleeding risk, triple therapy may be prolonged for up to 1 month, followed by dual therapy (anticoagulant plus a single antiplatelet, preferably clopidogrel) for up to 12 months. Prasugrel or ticagrelor in triple therapy is not recommended, and 12 months of triple therapy is not a guideline option.",
      difficulty: 3,
      refs: ["esc-acs-2023"],
    },
    {
      id: "hb-after-the-procedure-q6",
      stem: "Three weeks after PCI for STEMI, a patient on aspirin and ticagrelor asks to change to clopidogrel because it is cheaper. He has not bled. What does the 2023 ESC ACS guideline say about this de-escalation?",
      options: [
        "It is recommended at any time after ACS, because clopidogrel protects the stent as well as ticagrelor does",
        "It is not recommended in the first 30 days; after 30 days it may be considered to reduce bleeding",
        "It is required at 1 month in every patient, whatever the bleeding and ischaemic risk",
        "It is acceptable only if aspirin is stopped at the same time, leaving clopidogrel alone",
      ],
      answer: 1,
      explanation:
        "The guideline does not recommend de-escalation in the first 30 days after ACS, and allows it to be considered beyond 30 days as an alternative strategy to reduce bleeding. At three weeks, without bleeding, the potent agent should continue. Brilakis likewise frames de-escalation as an option when bleeding risk outweighs thrombotic risk.",
      difficulty: 2,
      refs: ["esc-acs-2023", "brilakis-manual-pci"],
    },
    {
      id: "hb-after-the-procedure-q7",
      stem: "Six months after PCI for ACS, a patient needs a time-sensitive cancer operation. Following the 2022 ESC guideline, which approach is right if the P2Y12 inhibitor must stop?",
      options: [
        "Stop aspirin and ticagrelor 7 days before, and bridge with low-molecular-weight heparin",
        "Proceed now on aspirin, stopping ticagrelor 3–5 days before and restarting it within 48 hours",
        "Defer the operation until 12 months after the PCI have passed, whatever the oncological urgency may be",
        "Proceed now with no change at all, because DAPT does not affect surgical bleeding",
      ],
      answer: 1,
      explanation:
        "Time-sensitive surgery can proceed after at least 1 month of DAPT (3 months should be considered after ACS); this patient has had 6. Aspirin continues and the operation is done on it; ticagrelor is withheld for 3–5 days (Oxford gives 3) and restarted as soon as possible, within 48 hours. Oxford found no evidence that heparin bridging protects the stent, and deferring cancer surgery for the full 12 months is for elective operations.",
      difficulty: 3,
      refs: ["esc-ncs-2022", "oxford-cath-handbook"],
    },
    {
      id: "hb-after-the-procedure-q8",
      stem: "In Oxford's review of results after a case, which step is specific to patients who have had complex PCI?",
      options: [
        "Re-examining each stored loop to exclude complications such as dissection or embolism",
        "Checking an ECG and possibly a troponin to exclude significant myocardial injury",
        "Making renal function, cholesterol and glucose results available for comment",
        "Re-reading the clinical indication alongside the diagnostic information obtained",
      ],
      answer: 1,
      explanation:
        "Oxford reviews every stored loop, re-quantifies stenoses, notes haemodynamics and makes bloods available for all cases; the ECG and cardiac troponin check is added after complex PCI, because small enzymatic infarcts are usually silent yet carry a higher later risk of death or MI.",
      difficulty: 2,
      refs: OX,
    },
    {
      id: "hb-after-the-procedure-q9",
      stem: "A CTO PCI ends with an air kerma of 7.5 Gy. What follow-up does Brilakis recommend?",
      options: [
        "None, because skin injury is unlikely below a threshold of 15 Gy air kerma",
        "Review within a month with the skin of the back examined and the result documented",
        "A physicist's peak skin dose calculation and skin examination at 2–4 weeks",
        "Immediate dermatology referral for a biopsy of the irradiated skin before discharge",
      ],
      answer: 1,
      explanation:
        "Brilakis follows up every patient with more than 5 Gy within a month and documents the skin examination, looking at the back. The physicist calculation with skin review at 2–4 weeks is for more than 10 Gy, and a peak skin dose over 15 Gy is the US Joint Commission sentinel-event threshold. A biopsy of radiation injury can produce a non-healing ulcer, which is why the patient must be told about the risk.",
      difficulty: 3,
      refs: BR,
    },
    {
      id: "hb-after-the-procedure-q10",
      stem: "A patient's creatinine is unchanged 48 hours after PCI with a large contrast load. Why does Oxford warn against concluding that contrast nephropathy has been excluded?",
      options: [
        "Because contrast nephropathy is defined only by a rise after 7 days",
        "Because creatinine peaks 4–5 days after contrast, so a 48-hour test can miss it",
        "Because creatinine always falls during the first 48 hours after any exposure to contrast",
        "Because the diagnosis rests on urine output, not on serum creatinine at all",
      ],
      answer: 1,
      explanation:
        "Oxford defines contrast nephropathy as a creatinine rise of 44 µmol/L or more than 25% at 24–48 hours, but creatinine peaks 4–5 days after contrast, so a test at 48 hours can miss a rise that is still to come. Brilakis monitors creatinine for at least 48 hours; at-risk patients may need a later check as well. Current ESUR guidance puts the usual peak a little earlier, at 2–3 days, so a single test at 48 hours can still come before the peak.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "hb-after-the-procedure-q11",
      stem: "Under the GMC/NMC duty of candour guidance, which statement about apologising to a patient after a complication is correct?",
      options: [
        "An apology should wait until the investigation is complete, so that it is accurate",
        "It is not an admission of legal liability, and should cover what happened, what can be done and how recurrence will be prevented",
        "An apology should come from the organisation rather than from any named clinician, so that no single individual is personally blamed for it",
        "An apology is needed only when the complication was caused by an individual's error",
      ],
      answer: 1,
      explanation:
        "The guidance says apologising does not mean admitting legal liability, and patients expect to hear what happened, what can be done to deal with any harm and what will be done to prevent it happening to someone else. Speak as soon as possible without waiting for the investigation; a personal apology is more meaningful than organisational regret; and the patient is owed an apology whoever or whatever was responsible.",
      difficulty: 3,
      refs: ["gmc-nmc-candour-2015"],
    },
    {
      id: "hb-after-the-procedure-q12",
      stem: "Which list gives the minimum content Oxford sets for the formal typed discharge summary?",
      options: [
        "Diagnosis; date and summary of procedure; management plan; full medicine list with changes; follow-up",
        "Diagnosis; cine run list; catheter sizes; contrast type; fluoroscopy time; the name of the circulating nurse",
        "Procedure date only, with a copy of the consent form and the WHO checklist attached for the GP",
        "Diagnosis and follow-up only, since medicine changes are communicated separately by the hospital pharmacy",
      ],
      answer: 0,
      explanation:
        "Oxford's minimum is a diagnosis, the date and a summary of the procedure, the subsequent management plan, a full list of medicines including changes, and follow-up arrangements, ideally typed on the day of discharge after a shorter discharge note given as the patient leaves. Technical run details belong in the operator's report.",
      difficulty: 1,
      refs: OX,
    },
  ],
  sims: [
    { sim: "procedure", task: "Finish a case and write the ward hand-over note: procedure and operator, difficulties, drugs given, access sites and lines with removal times." },
    { sim: "procedure", task: "Recovery: set the observation schedule, check the access site and distal pulses, write the mobilisation plan and respond to chest pain or hypotension." },
    { sim: "procedure", task: "Discharge: write the antithrombotic plan (ARC-HBR, DAPT duration, anticoagulant if any), the driving advice and the typed discharge summary." },
  ],
  caseIds: ["hb-after-the-procedure-case-day-after", "hb-after-the-procedure-case-complication"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "hb-after-the-procedure-case-day-after",
    title: "From the lab to the front door: NSTEMI PCI in a patient on apixaban",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook ch 11 (the patient, results, communication, discharge plans, discharge summary), ch 2 (the nurse, the cardiologist) and ch 8 (antiplatelet therapy, Table 8.10); Brilakis 2.7 and 3.5; 2023 ESC ACS guideline; ARC-HBR consensus; DVLA guidance",
    },
    summary:
      "A 74-year-old man with atrial fibrillation on apixaban has radial PCI for NSTEMI. Hand him over, run his recovery, handle chest pain on the ward, explain the result, write his antithrombotic plan and discharge him safely.",
    presentation:
      "A 74-year-old man presented with 2 hours of chest pain, dynamic T-wave inversion and a raised troponin. He has atrial fibrillation treated with apixaban at the standard stroke-prevention dose (held for the procedure), type 2 diabetes on metformin and an eGFR of 52 mL/min. Angiography by the right radial artery showed a severe mid LAD stenosis treated with one 3.0 × 28 mm drug-eluting stent; the circumflex and RCA were unobstructed. Heparin and midazolam 1 mg were given. He drives a car. Echo shows an LVEF of 50%.",
    findings: [
      "After PCI: TIMI 3 flow, no residual stenosis in two orthogonal views with the wire removed",
      "Haemoglobin 13.8 g/dL, platelets 210 × 10⁹/L, no previous bleeding",
      "Contrast used: 140 mL",
      "Radial compression band in place; a left forearm venous cannula is the only other line",
    ],
    steps: [
      {
        id: "handover",
        prompt: "He arrives on the cardiology ward. What do you hand over to the receiving nurse?",
        options: [
          {
            text: "PCI to the mid LAD by you, no difficulties, heparin and midazolam given, right radial band with its release plan, and the venous cannula",
            best: true,
            feedback: "These are Oxford's four hand-over items: procedure and operator, difficulties, drugs including anticoagulation and sedation, and access sites, devices and lines with their removal timing.",
            stateDelta: { stability: 5 },
          },
          {
            text: "'Straightforward stent, all fine', and point the nurse to the electronic report for the rest",
            feedback: "The nurse needs to know about sedation, heparin and the band now, not after reading a report. Oxford's hand-over is spoken and specific.",
            stateDelta: { stability: -10, flags: ["poor-handover"] },
            next: "band-problem",
          },
          {
            text: "Hand over the diagnosis and the plan for discharge tomorrow only, as the lab nurse will hand over the rest",
            feedback: "Oxford's hand-over has four items: the procedure and operator, any difficulties, the drugs including heparin and sedation, and the band and cannula with their removal plan. Whoever gives it, make sure all four reach the ward nurse; this answer passes on none of them.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "band-problem",
        kind: "consequence",
        prompt: "Ninety minutes later a nurse who was not told about the band finds the forearm swollen and tense above it, with blood under the band. What now?",
        options: [
          {
            text: "Press firmly over the puncture, check the colour, sensation and pulse of the hand, call the operator, and recheck the forearm every 15 minutes",
            best: true,
            feedback: "Oxford's radial checks are handling bleeding or haematoma and reviewing the forearm every 15 minutes for changes in its colour, feeling, warmth, shape and size, the pulse and any pain. A forearm haematoma is treated as taught in pm-closure and cm-access-complications.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inflate the band further and leave it for the morning round",
            feedback: "Over-inflating without assessing the forearm risks occlusion and missing a growing haematoma; the site needs frequent review.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "chest-pain",
        prompt: "Four hours after PCI he reports central chest tightness. Blood pressure 128/76 mmHg, heart rate 82 in AF. The nurse offers sublingual GTN. What comes first?",
        options: [
          {
            text: "A 12-lead ECG straight away, and call the operator",
            best: true,
            feedback: "Oxford's rule for chest pain after PCI: record a 12-lead ECG first and alert the operator, because it may be a procedural complication; stent thrombosis is the one to exclude here.",
            stateDelta: { stability: 5 },
          },
          {
            text: "GTN and reassurance; recheck in an hour",
            feedback: "Treating the symptom first delays the ECG that could show acute stent thrombosis.",
            stateDelta: { stability: -15, flags: ["delayed-ecg"] },
            next: "late-ecg",
          },
          {
            text: "Send a troponin and review the result in the morning",
            feedback: "A troponin is raised after NSTEMI anyway and takes time; the ECG is the first and fastest test.",
            stateDelta: { stability: -10, flags: ["delayed-ecg"] },
            next: "late-ecg",
          },
        ],
      },
      {
        id: "late-ecg",
        kind: "consequence",
        prompt: "An hour later the pain persists and the ECG now shows new anterior ST elevation. What now?",
        options: [
          {
            text: "Treat it as acute stent thrombosis: call the interventional team for immediate angiography",
            best: true,
            feedback: "Immediate revascularisation is Oxford's standard for vessel occlusion. The hour lost is the cost of not recording the ECG first.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give more GTN and repeat the ECG in 30 minutes",
            feedback: "New ST elevation after a stent is an emergency; waiting extends the infarct.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "explain",
        prompt: "The ECG is unchanged and the pain settles; it is judged to be benign. The next morning his wife has arrived. How do you explain the procedure?",
        variants: [{ flag: "delayed-ecg", info: "He went back to the lab overnight for a thrombosed stent, which was reopened. He is now pain free." }],
        options: [
          {
            text: "In a quiet room once he is fully alert: check he wants his wife present, ask how he found it, draw the LAD and the stent, explain plainly, invite questions, go through his medicines and document it",
            best: true,
            feedback: "This is Oxford's sequence. If anything went wrong overnight, the same conversation includes an honest account and an apology under the duty of candour.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Explain at the bedside in the open bay during the ward round, using the report's wording",
            feedback: "Sensitive news belongs in a quiet place, and report language such as 'TIMI 3 flow' needs translating.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "antithrombotic",
        prompt: "Write his antithrombotic plan. Bleeding risk: by ARC-HBR, long-term anticoagulation is a major criterion. Ischaemic risk is not unusually high.",
        options: [
          {
            text: "Apixaban at his usual dose with aspirin and clopidogrel for up to 1 week, then apixaban with clopidogrel to 12 months, then apixaban alone; a proton pump inhibitor; stop dates written",
            best: true,
            feedback: "The 2023 ESC ACS default: up to 1 week of triple therapy, then the anticoagulant at its stroke-prevention dose with clopidogrel for up to 12 months, then the anticoagulant alone. Brilakis gives a proton pump inhibitor routinely with DAPT, and the 2023 ESC guideline counts anticoagulant therapy among the features that raise gastrointestinal bleeding risk; with an anticoagulant on board, keeping the same protection is a reasonable judgement.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Apixaban, aspirin and ticagrelor for 12 months",
            feedback: "Ticagrelor or prasugrel in triple therapy is not recommended, and 12 months of triple therapy greatly increases bleeding.",
            stateDelta: { stability: -15, flags: ["bleed-risk"] },
            next: "bleed",
          },
          {
            text: "Apixaban at half his usual dose with aspirin and clopidogrel for 6 months, to offset the antiplatelets",
            feedback: "The anticoagulant stays at the dose recommended for stroke prevention, and 6 months of triple therapy is far longer than the guideline default.",
            stateDelta: { stability: -10, flags: ["bleed-risk"] },
            next: "bleed",
          },
        ],
      },
      {
        id: "bleed",
        kind: "consequence",
        prompt: "Three weeks later he returns with melaena and a haemoglobin of 9.1 g/dL. What do you do with his antithrombotics once the bleeding is controlled?",
        options: [
          {
            text: "Stop aspirin, change any ticagrelor to clopidogrel, keep the anticoagulant at the stroke-prevention dose with a proton pump inhibitor, after senior review",
            best: true,
            feedback: "Brilakis: shorten aspirin with an anticoagulant, step down to clopidogrel, give a proton pump inhibitor. The guideline default would have avoided this.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stop every antithrombotic drug for 3 months",
            feedback: "That exposes a 3-week-old stent to thrombosis and the patient to stroke; adjust, do not abandon, after specialist review.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "discharge",
        prompt: "He is ready to go home. Which discharge advice is right?",
        options: [
          {
            text: "Someone at home tonight; apixaban restart time stated; no driving for 1 week (DVLA group 1 after successful PCI for ACS, LVEF over 40%, nothing urgent planned); metformin withheld for 2 days with a creatinine check; CCU phone number; typed summary today",
            best: true,
            feedback: "This combines Oxford's discharge plan and summary (drug changes, including when the held apixaban restarts, belong in the discharge note), Oxford's metformin rule, Brilakis's 48-hour creatinine and the DVLA group 1 rule after successful PCI for ACS.",
            stateDelta: { stability: 5 },
          },
          {
            text: "He may drive after 24 hours, since that is the usual rule after an arterial puncture",
            feedback: "Twenty-four hours is Oxford's minimum after any arterial puncture; after PCI for ACS the DVLA group 1 rule is at least 1 week if the criteria are met.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Discharge with a handwritten note only; the typed summary can follow at the clinic appointment",
            feedback: "Oxford wants the typed summary sent without delay, preferably on the day he goes home, listing every medicine and every change.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "He went home the day after PCI with a clear antithrombotic plan, written stop dates and the apixaban restart time, a creatinine check booked and a typed summary sent to his GP the same day.",
    outcomeVariants: [
      { flag: "delayed-ecg", text: "The delay in recording an ECG cost an hour of ischaemia from stent thrombosis before the stent was reopened." },
      { flag: "bleed-risk", text: "An over-intense antithrombotic regimen led to a gastrointestinal bleed and readmission." },
      { flag: "poor-handover", text: "A forearm haematoma went unrecognised for longer than it should have because the band was not handed over." },
    ],
    learningPoints: [
      "Hand over the procedure and operator, difficulties, drugs given and access sites and lines with removal times.",
      "Chest pain after PCI: 12-lead ECG first, then the operator.",
      "Explain results once sedation has worn off, in a quiet place, with the people the patient chooses.",
      "With an anticoagulant after ACS PCI: up to 1 week of triple therapy with clopidogrel, then dual therapy to 12 months, then the anticoagulant alone, at the full stroke-prevention dose.",
      "Discharge with someone at home, the restart time of any anticoagulant held for the procedure, driving advice by licence group, the blood tests that are due and a typed summary the same day.",
    ],
    refs: [...BOOKS, "esc-acs-2023", "urban-arc-hbr-2019", "dvla-fitness-to-drive"],
  },
  {
    id: "hb-after-the-procedure-case-complication",
    title: "After a difficult case: perforation, a high dose and an honest conversation",
    trackId: "cath-handbook",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook ch 2 (the cardiologist), ch 11 (results, communication), ch 1 (dose excess) and ch 10 (hypotension, cardiac tamponade); Brilakis 6.8 and 28.2; GMC/NMC guidance on the professional duty of candour",
    },
    summary:
      "A long PCI of a calcified RCA ends with a small distal wire perforation sealed in the lab and an air kerma of 6.4 Gy. Write the report, manage the first hours, disclose the complication properly and plan the follow-up.",
    presentation:
      "A 66-year-old woman with stable angina despite two anti-anginal drugs had elective PCI of a heavily calcified mid RCA by the right femoral artery. During wiring of the distal vessel, a hydrophilic wire caused a small distal perforation with a myocardial blush and no exit hole of 1 mm or more, which sealed after prolonged balloon inflation. Two stents were placed with a good result. The radiographer warned when 1 Gy was reached; the final air kerma was 6.4 Gy. A closure device was used.",
    findings: [
      "End of case: blood pressure 124/70 mmHg, heart rate 76, no effusion on bedside echo",
      "Final angiogram: TIMI 3 flow, no contrast extravasation",
      "Contrast used: 260 mL; eGFR 64 mL/min",
      "She received midazolam 2 mg and fentanyl 50 micrograms",
    ],
    steps: [
      {
        id: "report",
        prompt: "What must the report record about the complication and the dose?",
        options: [
          {
            text: "The perforation with its Ellis class (2: blush without a 1 mm exit hole) and location (distal), how it was sealed, both stents with sizes and lengths, and the 6.4 Gy dose",
            best: true,
            feedback: "Oxford asks for details of complications and their management, every stent's number, type, size and length, and the dose when the 1 Gy warning was given; Brilakis classifies perforations by Ellis class and by location.",
            stateDelta: { stability: 5 },
          },
          {
            text: "'Successful PCI RCA; minor wire issue resolved'; the dose is on the X-ray system",
            feedback: "A vague phrase hides a complication that the ward must watch for and that the patient must be told about; Oxford asks for the dose in the report.",
            stateDelta: { stability: -10, flags: ["vague-report"] },
            next: "ward-unaware",
          },
        ],
      },
      {
        id: "ward-unaware",
        kind: "consequence",
        prompt: "Two hours later her blood pressure falls to 92/60 mmHg with a heart rate of 108. The ward team, unaware of the perforation, suggest fluids for dehydration. What do you do?",
        options: [
          {
            text: "Go to her now, give fluids while arranging an urgent echo for tamponade, check the groin and haemoglobin, and tell the ward about the perforation",
            best: true,
            feedback: "Fasting and drugs often explain hypotension after a case, but Oxford lists tamponade and bleeding among the reversible causes that must be excluded; echo confirms tamponade. If it is tamponade: pericardiocentesis with the drain left in until the bleeding stops, consider protamine, platelets and clotting factors, and treat the cause (cm-patient-complications).",
            stateDelta: { stability: 5 },
            next: "when-to-tell",
          },
          {
            text: "Agree with fluids alone and review in the morning",
            feedback: "Tachycardic hypotension after a perforation is tamponade until proven otherwise.",
            stateDelta: { stability: -20 },
            next: "when-to-tell",
          },
        ],
      },
      {
        id: "first-hours",
        prompt: "She reaches the ward stable. What do you ask for in the first hours?",
        options: [
          {
            text: "Observations every 15 minutes for an hour, then every 30 minutes, then hourly, with the groin and distal pulses checked; a 12-lead ECG; a low threshold for repeat echo if the pressure or heart rate changes",
            best: true,
            feedback: "Oxford's routine plus an ECG after complex PCI, with the ward told exactly what to look for because of the perforation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Hourly observations only, as for any elective case",
            feedback: "Oxford observes every patient every 15 minutes in the first hour and every 30 minutes in the second, so hourly observations are wrong even after an uncomplicated elective case; after a perforation, when delayed tamponade is the risk to catch, they are unsafe.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "when-to-tell",
        prompt: "When and how do you tell her about the perforation?",
        options: [
          {
            text: "That afternoon, once the sedation has worn off, in a quiet room with her husband present if she wishes; without waiting for any review",
            best: true,
            feedback: "Candour guidance: as soon as possible after realising, with support available, and without waiting for an investigation, being clear about what is and is not yet known. Oxford: not while she is still sedated.",
            stateDelta: { stability: 5 },
          },
          {
            text: "At the clinic visit in 6 weeks, once you know whether it caused any lasting harm",
            feedback: "Waiting for the outcome is what the guidance warns against; she needs to know now what happened and what to watch for.",
            stateDelta: { stability: -10, flags: ["late-disclosure"] },
            next: "complaint",
          },
          {
            text: "Straight after the case on the table, while she is still drowsy",
            feedback: "Oxford: telling a patient results while sedated with midazolam is unhelpful; she will not take it in.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "complaint",
        kind: "consequence",
        prompt: "At clinic she says a nurse mentioned 'the bleed around your heart' and she feels misled. What now?",
        options: [
          {
            text: "Explain what happened and why, apologise personally, say what was done and what will change, record it, and give her a contact for further questions",
            best: true,
            feedback: "The three parts of an apology, a personal 'I am sorry', recording the apology and a point of contact. Earlier disclosure would have avoided the loss of trust.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Tell her it was trivial and not worth mentioning",
            feedback: "Minimising it compounds the failure; the duty is to be open and honest.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "what-to-say",
        prompt: "What does the conversation contain?",
        options: [
          {
            text: "What happened and why, how it was sealed, what it means now and later, what to watch for, a personal apology, what the team will learn from it, and whom to contact",
            best: true,
            feedback: "Tell, apologise, explain the short- and long-term effects, and offer support: the guidance's four duties and its three expected parts of an apology.",
            stateDelta: { stability: 5 },
          },
          {
            text: "That a 'small technical issue' occurred, with no apology, because apologising admits liability",
            feedback: "An apology is not an admission of legal liability, and vague wording is not candour.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "dose",
        prompt: "How do you deal with the 6.4 Gy air kerma?",
        options: [
          {
            text: "Explain the risk of a skin reaction on her back, what it looks like and whom to call, and book a review within a month with the skin examined and documented",
            best: true,
            feedback: "Brilakis: over 5 Gy, follow up within a month and document the skin examination; tell the patient so a red patch is not biopsied, which can cause a non-healing ulcer. Oxford: record and communicate the dose after the 1 Gy warning.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Arrange a physicist's peak skin dose calculation and a skin check at 2–4 weeks",
            acceptable: true,
            feedback: "That is Brilakis's step for more than 10 Gy; it is not wrong to involve the physicist, but the required action at 6.4 Gy is review within a month and telling her what to look for.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Nothing: skin injury does not occur below 15 Gy",
            feedback: "Brilakis puts the start of possible skin injury at 5–10 Gy; a peak skin dose over 15 Gy is the US Joint Commission sentinel-event threshold, not the point at which injury begins.",
            stateDelta: { stability: -10, flags: ["no-skin-plan"] },
            next: "skin-injury",
          },
        ],
      },
      {
        id: "skin-injury",
        kind: "consequence",
        prompt: "A month later her GP calls: she has a red, sore patch on her back and the GP plans a dermatology referral for a biopsy. What do you do?",
        options: [
          {
            text: "Explain that it is probably radiation injury from the PCI, see her promptly, document the skin examination, and refer her to a dermatologist or plastic surgeon with the dose and the history",
            best: true,
            feedback: "Brilakis refers radiation skin injury to specialists for evaluation and warns that a biopsy by someone unaware of the dose can cause an ulcer that will not heal. Telling her and the GP at discharge would have prevented the confusion.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Agree with the biopsy plan; skin problems are outside cardiology",
            feedback: "The cause is the procedure, and the biopsy is the danger Brilakis describes.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "close",
        prompt: "Before she goes home the next day, what else completes the episode?",
        options: [
          {
            text: "Report the incident through the local system, debrief the team, check creatinine at 48 hours or later (it can peak at 4–5 days), and send a summary to the GP that names the perforation, the dose and the skin review",
            best: true,
            feedback: "Oxford's cardiologist debriefs the team when there have been complications and writes a detailed GP letter; the candour guidance asks for incidents to be reported; Brilakis checks creatinine for at least 48 hours.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Discharge with the standard elective PCI letter",
            feedback: "The GP must know about the perforation, the dose and the follow-up it requires.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "She went home the next day, understanding what had happened and what to look for, with a skin review booked, a creatinine check and a GP letter that named the complication and the dose.",
    outcomeVariants: [
      { flag: "vague-report", text: "The vague report left the ward unaware of the perforation, and the warning signs of tamponade were nearly put down to dehydration." },
      { flag: "late-disclosure", text: "Learning of the perforation second-hand damaged her trust in the team, and a formal complaint followed." },
      { flag: "no-skin-plan", text: "Without a skin plan, a radiation burn on her back was nearly biopsied before its cause was recognised." },
    ],
    learningPoints: [
      "Report a complication precisely (Ellis class and location for a perforation), how it was managed, and the dose after the 1 Gy warning.",
      "Tell the ward what happened, so that hypotension after a perforation prompts an echo, not just fluids.",
      "Disclose as soon as possible, once sedation has worn off, without waiting for an investigation; apologise personally; record it.",
      "Over 5 Gy: tell the patient, review the skin within a month and document it.",
      "Report the incident, debrief the team and tell the GP.",
    ],
    refs: [...BOOKS, "gmc-nmc-candour-2015"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "diag-post-nondiagnostic",
    lab: "diagnostic",
    when: { phase: ["inject"], event: ["contrast-streaming"] },
    title: "Incomplete filling is a non-diagnostic study",
    text: "If you cannot opacify the artery completely, fix the cause (seat the catheter, use a bigger lumen or a firmer injection) or report the angiogram as non-diagnostic. Brilakis prefers that to an interpretation that may be wrong.",
    tone: "caution",
    lessonId: "hb-after-the-procedure-report",
    sources: [B("6.6"), B("6.8")],
    refs: BR,
  },
  {
    id: "diag-post-ward-handover",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Hand over four things to the ward",
    text: "Tell the receiving nurse what was done and by whom, any difficulty or complication, the drugs given (including heparin and sedation), and every access site, closure device and line with the time it should come out.",
    tone: "do",
    lessonId: "hb-after-the-procedure-report",
    sources: [O("ch 11: The patient")],
    refs: OX,
  },
  {
    id: "pci-post-report-stents",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Report every stent and the final views",
    text: "Write the number, type, diameter and length of each stent, the steps of the intervention, any complication and how it was managed, and the final result in two orthogonal views with the wire out. The next operator plans from these details.",
    tone: "do",
    lessonId: "hb-after-the-procedure-report",
    sources: [O("ch 2: The cardiologist"), O("ch 8: The PCI procedure")],
    refs: OX,
  },
  {
    id: "diag-post-radiation-record",
    lab: "diagnostic",
    when: { event: ["high-radiation-dose"] },
    title: "Record the dose once the 1 Gy warning comes",
    text: "When the radiographer warns that 1 Gy has been reached, Oxford asks the operator to record the dose in the report and explain it to the patient. Over 5 Gy, Brilakis also arranges a skin review within a month.",
    tone: "caution",
    lessonId: "hb-after-the-procedure-report",
    sources: [O("ch 1: Dose excess"), B("28.2")],
    refs: BOOKS,
  },
  {
    id: "pci-post-ecg-complex",
    lab: "pci",
    when: { phase: ["finish"], requires: ["cto"] },
    title: "ECG, and troponin if needed, after complex PCI",
    text: "If you judge this CTO case to be complex PCI, ask for a 12-lead ECG and, where needed, a cardiac troponin to look for procedural myocardial injury, which is usually silent but carries a higher later risk.",
    tone: "do",
    lessonId: "hb-after-the-procedure-report",
    sources: [O("ch 11: Results"), O("ch 11: The patient"), O("ch 10: Myocardial infarction")],
    refs: OX,
  },
  {
    id: "pci-post-ecg-bifurcation",
    lab: "pci",
    when: { phase: ["finish"], requires: ["bifurcation"] },
    title: "After bifurcation PCI: ECG, and troponin if needed",
    text: "If you judge this bifurcation case to be complex PCI, record a 12-lead ECG on the ward and check a cardiac troponin if needed: procedural myocardial injury is usually silent yet raises the later risk of death or MI.",
    tone: "do",
    lessonId: "hb-after-the-procedure-report",
    sources: [O("ch 11: Results"), O("ch 11: The patient"), O("ch 10: Myocardial infarction")],
    refs: OX,
  },
  {
    id: "access-post-pulses-start-end",
    lab: "access",
    when: { phase: ["closure"] },
    title: "Compare the pulses with the start of the case",
    text: "Feel the pulse at the access site and distal to it at the end of the case and compare with what you found at the start. Keep inspecting and palpating the site: early bleeding and haematoma are found that way.",
    tone: "do",
    lessonId: "hb-after-the-procedure-monitoring",
    sources: [B("2.7")],
    refs: BR,
  },
  {
    id: "access-post-radial-obs",
    lab: "access",
    when: { phase: ["closure"], route: ["radial"] },
    title: "Check the radial site every 15 minutes",
    text: "Until the haemostasis device is off, check the site every 15 minutes for changes in the colour, sensation, temperature, shape and size of the forearm, the pulse, and pain. With radial access the patient can usually walk after about an hour.",
    tone: "do",
    lessonId: "hb-after-the-procedure-monitoring",
    sources: [O("ch 2: The nurse"), O("ch 11: The patient")],
    refs: OX,
  },
  {
    id: "access-post-femoral-mobilise",
    lab: "access",
    when: { phase: ["closure"], route: ["femoral"] },
    title: "Write the femoral mobilisation plan",
    text: "As Oxford's guide after a 6 F femoral puncture: flat for 1 hour after the line comes out, walking from 2½ hours, with the groin and the femoral, popliteal and pedal pulses checked every 15 minutes until mobile. Local protocol sets the final timings.",
    tone: "do",
    lessonId: "hb-after-the-procedure-monitoring",
    sources: [O("ch 11: The patient"), O("ch 2: The nurse"), O("ch 3: Femoral artery access")],
    refs: OX,
  },
  {
    id: "pci-post-chest-pain-ward",
    lab: "pci",
    when: { phase: ["finish"], event: ["chest-pain"] },
    title: "Chest pain after PCI: ECG first, then the operator",
    text: "Record a 12-lead ECG before giving nitrate or reassurance, and tell the operator: Oxford warns that chest pain after a stent may signal a procedural complication (acute vessel closure or stent thrombosis, for example).",
    tone: "caution",
    lessonId: "hb-after-the-procedure-monitoring",
    sources: [O("ch 2: The nurse"), O("ch 10: Myocardial infarction")],
    refs: OX,
  },
  {
    id: "pci-post-contrast-kidney",
    lab: "pci",
    when: { phase: ["finish"], event: ["high-contrast-volume"] },
    title: "Plan the creatinine checks before the patient leaves",
    text: "After a large contrast load, hydrate and check creatinine for at least 48 hours, charting urine output if renal function is impaired. Creatinine can keep rising after 48 hours (usual peak 2–3 days, up to 4–5 days in Oxford), so recheck a patient at risk at 48–72 hours or later.",
    tone: "caution",
    lessonId: "hb-after-the-procedure-monitoring",
    sources: [B("28.3"), O("ch 10: Contrast nephropathy"), O("ch 11: The patient")],
    refs: [...BOOKS, "vandermolen-pcaki-definition-2018"],
  },
  {
    id: "pci-post-dapt-plan",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Write the antiplatelet plan with stop dates",
    text: "Name each antiplatelet drug, its dose and its stop or review date, say whether the loading dose was given in the lab or is due on the ward, add a proton pump inhibitor (Brilakis gives one routinely with DAPT; ESC 2023 where gastrointestinal bleeding risk is raised, as with an anticoagulant), and tell the patient why each tablet matters.",
    tone: "do",
    lessonId: "hb-after-the-procedure-dapt",
    sources: [O("ch 2: The nurse"), O("ch 11: Communication"), B("3.5")],
    refs: [...BOOKS, "esc-acs-2023"],
  },
  {
    id: "pci-post-oac-clopidogrel",
    lab: "pci",
    when: { phase: ["plan", "finish"] },
    title: "On an anticoagulant? Clopidogrel and a short triple course",
    text: "If the patient needs an oral anticoagulant, the P2Y12 partner is clopidogrel, never prasugrel or ticagrelor in triple therapy. After ACS the 2023 ESC default is triple therapy for up to 1 week, then the anticoagulant with clopidogrel for up to 12 months.",
    tone: "caution",
    lessonId: "hb-after-the-procedure-dapt",
    sources: [B("3.5"), O("ch 8: Antiplatelet therapy")],
    refs: [...BOOKS, "esc-acs-2023"],
  },
  {
    id: "pci-post-bleeding-dapt",
    lab: "pci",
    when: { event: ["bleeding"] },
    title: "Bleeding on DAPT: local control and step down",
    text: "Control the bleeding site and step down from ticagrelor or prasugrel to clopidogrel. For life-threatening bleeding on aspirin, clopidogrel or prasugrel, platelet transfusion helps; it may not work against ticagrelor, which binds reversibly.",
    tone: "bailout",
    lessonId: "hb-after-the-procedure-dapt",
    sources: [B("3.5")],
    refs: BR,
  },
  {
    id: "diag-post-sedated-results",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Give the results when the sedation has worn off",
    text: "Do not explain findings to a patient still drowsy from midazolam. Wait, find a quiet room away from other patients, check who they want present, and use plain words and a drawing.",
    tone: "do",
    lessonId: "hb-after-the-procedure-communication",
    sources: [O("ch 11: Communication")],
    refs: OX,
  },
  {
    id: "pci-post-complication-candour",
    lab: "pci",
    when: { phase: ["finish"], event: ["perforation", "dissection", "no-reflow", "acute-closure", "stent-loss", "equipment-entrapment"] },
    title: "After a complication, tell the patient soon and honestly",
    text: "Once the patient is safe and awake, explain what happened, what it means now and later and what will be done, and apologise personally; do not wait for the investigation. Record the conversation and report the incident.",
    tone: "do",
    lessonId: "hb-after-the-procedure-communication",
    sources: [O("ch 2: The cardiologist")],
    refs: ["oxford-cath-handbook", "gmc-nmc-candour-2015"],
  },
  {
    id: "pci-post-radiation-follow-up",
    lab: "pci",
    when: { phase: ["finish"], event: ["high-radiation-dose"] },
    title: "Over 5 Gy: book the skin review",
    text: "After an air kerma above 5 Gy, arrange a review within a month with the skin of the back examined and documented, and tell the patient what a reaction looks like. Above 10 Gy a physicist calculates the peak skin dose and the skin is checked at 2–4 weeks.",
    tone: "caution",
    lessonId: "hb-after-the-procedure-discharge",
    sources: [B("28.2"), O("ch 1: Dose excess")],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked in this session)
// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "gmc-nmc-candour-2015",
    kind: "web",
    citation:
      "General Medical Council, Nursing and Midwifery Council. Openness and honesty when things go wrong: the professional duty of candour. GMC; in effect from 29 June 2015, last updated 13 December 2024.",
    url: "https://www.gmc-uk.org/professional-standards/the-professional-standards/candour---openness-and-honesty-when-things-go-wrong",
    note: "Joint GMC and NMC guidance. Title, bodies, effective date (29 June 2015) and update date (13 December 2024) checked on the guidance PDF hosted by the NMC (nmc.org.uk, openness-and-honesty-professional-duty-of-candour.pdf); paragraphs 1–25 read.",
    verified: true,
  },
  {
    id: "vandermolen-pcaki-definition-2018",
    kind: "guideline",
    citation:
      "van der Molen AJ, Reimer P, Dekkers IA, et al. Post-contrast acute kidney injury – Part 1: definition, clinical features, incidence, role of contrast medium and risk factors. Recommendations for updated ESUR Contrast Medium Safety Committee guidelines. Eur Radiol. 2018;28:2845–2855.",
    url: "https://doi.org/10.1007/s00330-017-5246-5",
    note: "PMID: 29426991 (PMC5986826). Checked on PubMed: authors, title, journal, year 2018, volume 28, issue 7, pages 2845–2855; full text read in PMC. Used for: PC-AKI replaces the term contrast-induced nephropathy; KDIGO definition (serum creatinine rise of at least 0.3 mg/dL, or at least 1.5 times baseline) applied within 48–72 hours; the fall in renal function is usually mild, peaks at 2–3 days and returns to baseline within 1–3 weeks.",
    verified: true,
  },
];
