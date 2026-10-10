// Module pm-monitoring: monitoring and running the room (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.2, 2.1-2.12, 4.2.2, 7.3, 8.5, 8.10, 9.7.8, 9.7.11-9.7.13,
// 10.2.8, 10.2.13, 12.2, 25.1, 26.4 and 28.1; Oxford Handbook of Cardiac Catheterization and Coronary
// Intervention, chapters 1, 2, 4, 5, 6, 8 and 10. Nine new references, each checked on PubMed.
// Every claim is listed with its page in docs/curriculum/evidence/pm-monitoring.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-monitoring",
  title: "Monitoring and running the room",
  stage: 2,
  summary:
    "What to watch from before the first puncture until the patient leaves the lab, and who is watching it: the patient, the ECG, oxygen saturation, the access site and the arterial trace; how to tell real hypotension from a measurement fault; how to set up, zero and level a transducer and test its dynamic response; how to keep the guide and the wire tip where you left them; the brief, sign in, time out and sign out; what each member of the team does; how to lead through a crisis with call-outs and closed loops; and how to keep the room quiet and the field clean.",
  objectives: [
    "Record a baseline and then watch the twelve things Brilakis monitors in every case, recognising the patient, ECG and saturation changes that signal a complication.",
    "Decide within seconds whether a low pressure on the screen is real, working through the five measurement faults before treating the patient, and recognise pulsus paradoxus.",
    "Set up a manifold and transducer, zero it to air, level it to the chosen chest landmark, and use a fast-flush test to recognise an over- or under-damped line.",
    "Keep the guide and the wire tip in view while delivering and withdrawing devices, and recover when either moves.",
    "Run the team brief, sign in, time out and sign out, and state each team member's job in the Oxford model.",
    "Lead a complication with named instructions, check-backs and a scribe, and manage fatigue, noise and distraction.",
    "Keep the table organised and the gloves, wires and catheters clean so that debris never reaches the manifold.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-watch",
      title: "What to watch, and who watches it",
      minutes: 13,
      topics: ["ts-monitoring"],
      sources: [
        { book: "brilakis-pci", loc: "1.2" },
        { book: "brilakis-pci", loc: "2.1" },
        { book: "brilakis-pci", loc: "2.2" },
        { book: "brilakis-pci", loc: "2.4" },
        { book: "brilakis-pci", loc: "2.5" },
        { book: "brilakis-pci", loc: "2.6" },
        { book: "brilakis-pci", loc: "2.7" },
        { book: "brilakis-pci", loc: "2.8" },
        { book: "brilakis-pci", loc: "3.1" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "oxford-cath", loc: "ch 1: Patient preparation" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 4: Contrast media" },
        { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
      ],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook", "hofmann-deto2x-2017", "esc-acs-2023"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis treats monitoring as a step that never stops: it starts before the puncture and ends after the sheath is out, and its purpose is to catch a complication while it is still small. He names twelve things to watch. Learning them as a list is the first step; the second is knowing which ones change first when something goes wrong, and who in the room is looking at each.",
        },
        {
          kind: "table",
          caption: "The twelve things to watch (Brilakis, Fig 2.1), and where this curriculum teaches each",
          head: ["What", "What you are looking for", "Where it is taught"],
          rows: [
            ["1. The patient", "Comfort, pain and whether it was expected, consciousness and breathing, movement of all four limbs, allergy signs", "This lesson"],
            ["2. ECG", "Change from the baseline rhythm, rate and ST segments", "This lesson"],
            ["3. Arterial pressure", "Hypotension, pulsus paradoxus, hypertension, damping or a trace that disappears", "Next lesson"],
            ["4. Oxygen saturation", "Desaturation and its cause", "This lesson"],
            ["5. Radiation dose, shields and detector position", "Cumulative air kerma, dose–area product and dose rate. Brilakis usually stops when air kerma passes 5–7 Gy and calls more than 15 Gy a sentinel event (a term of the US Joint Commission; UK reporting follows IR(ME)R and local radiation protection rules, see the radiation module). Wearable monitors can warn the operator of a high personal dose as it happens, and the shields and image receptor are repositioned throughout the case to keep patient and staff dose down", "Radiation modules"],
            ["6. Contrast volume", "Some injector and contrast-diversion systems count the volume automatically. Brilakis generally stops before 3.7 × GFR (lower in chronic kidney disease or a single kidney), counting contrast given recently, for example for a CT scan", "Kidney and contrast modules"],
            ["7. Access site", "Pulses at the site and beyond it, bleeding, haematoma", "This lesson"],
            ["8. Medications", "Sedation, which nearly every patient receives, titrated to comfort without compromising breathing or blood pressure. Unfractionated heparin in most cases, checked by ACT; Brilakis's targets on a Hemochron device are 300–350 s for most PCI, above 350 s for retrograde CTO PCI, and 200–250 s when a glycoprotein IIb/IIIa inhibitor or cangrelor is also given. Vasopressors or atropine if needed", "Drug modules"],
            ["9. Operators and team", "Fatigue and other states that degrade performance", "Crisis lesson"],
            ["10. Environment", "Noise and distraction", "Sterile-field lesson"],
            ["11. Sterile field and equipment", "An organised table; clean gloves, wires and catheters", "Sterile-field lesson"],
            ["12. Equipment position in the body", "Sheath, guide, wire, balloon and stent where you meant them to be", "Equipment-position lesson"],
          ],
        },
        { kind: "h", text: "Before the first puncture: set the baseline" },
        {
          kind: "steps",
          title: "Six things to record while the patient settles",
          items: [
            {
              title: "A short examination and the blood results",
              detail:
                "Oxford's preparation includes a brief examination: pulse and blood pressure, whether the peripheral pulses are present, and any sign of pulmonary congestion such as a raised jugular venous pressure or crackles at the lung bases. Recent bloods (at least a blood count, electrolytes, renal function and glucose) should be to hand. A new crackle later in the case only means something if you know the chest was clear at the start.",
            },
            {
              title: "A 12-lead ECG and the monitor rhythm",
              detail:
                "Oxford asks for a 12-lead ECG before the catheter study so that it can serve as the baseline. Brilakis asks you to note the ECG morphology and heart rate at the start, because you can only call a change new if you know what was there before. Confirm that the continuous monitor trace is of good quality.",
            },
            {
              title: "Vital signs and pulse oximetry",
              detail:
                "Record blood pressure, heart rate and saturation. Oxford's pre-procedure check looks for a saturation above 96% on room air and gives supplemental oxygen to high-risk patients and to those who will receive large doses of sedation. A lower reading is a reason to look for the cause, not on its own a reason to give oxygen: in acute myocardial infarction, routine oxygen for patients saturating at 90% or more did not lower one-year mortality in the DETO2X-AMI trial, and the 2023 ESC guideline on acute coronary syndromes keeps oxygen for a saturation below 90%.",
            },
            {
              title: "Pulses",
              detail:
                "Feel the pulse at the planned access site and distal to it. Brilakis checks them at the beginning and again at the end of the case, so that a lost pulse is recognised before the patient leaves.",
            },
            {
              title: "Venous access",
              detail: "Oxford wants a venous cannula in place ideally in the left arm, through which sedation, fluids and any emergency drug can be given.",
            },
            {
              title: "The patient as a person",
              detail:
                "Introduce yourself, use the patient's name and say what will happen. A calm patient is easier to monitor: Brilakis notes that discomfort leads to movement, which can itself cause complications, and to a fast heart and breathing rate, which can worsen ischaemia.",
            },
          ],
        },
        { kind: "tip", id: "pci-mon-baseline" },
        { kind: "h", text: "The patient: five questions to keep asking" },
        {
          kind: "table",
          head: ["Question", "Why it matters", "What to do with a yes"],
          rows: [
            ["Is the patient comfortable?", "Discomfort brings movement (a risk during wiring and device delivery) and tachycardia and tachypnoea, which can worsen ischaemia", "Treat the cause; titrate sedation and analgesia so that breathing and blood pressure are not compromised"],
            ["Is there chest, abdominal or groin pain, and was it expected?", "Pain during a balloon inflation may be expected. Unexpected pain may be ischaemia, perforation or another complication", "Unexpected pain is a complication until you have found its cause: look at the ECG, the trace, the vessel and the access site"],
            ["Is the patient conscious and breathing adequately?", "Over-sedation suppresses breathing; a falling level of consciousness may also be neurological", "Decide whether breathing support is needed (Brilakis names non-invasive ventilation or intubation)"],
            ["Can the patient move all four limbs?", "New weakness suggests a stroke. Excessive movement can make the procedure unsafe", "A focal deficit needs urgent assessment (see the embolism and stroke module)"],
            ["Are there signs of allergy?", "Rash, itch, urticaria, lip, tongue or throat swelling, and a falling blood pressure", "Treat as a contrast or drug reaction (see the drug modules)"],
          ],
        },
        {
          kind: "check",
          stem: "Forty minutes into a right femoral LAD PCI, the stent is deployed and the result looks good. The patient, who tolerated the balloon inflations quietly, now complains of new pain low in the abdomen and in the right groin. Blood pressure is 104/62 mmHg, down from 138/80 mmHg. What is the right way to think about this?",
          options: [
            "Pain after a long case is usually from lying flat, so give analgesia and finish the final runs",
            "Repeat the LAD injections first, because the stent is the most likely source of any new pain",
            "Give a fluid bolus and recheck the blood pressure in fifteen minutes before deciding anything",
            "This pain was not expected; treat it as a complication, inspect and feel the access site, and look for bleeding",
          ],
          answer: 3,
          explanation:
            "Brilakis asks one question of every pain: was it expected? Pain in the abdomen and groin that the procedure does not explain, together with a falling pressure, points away from the coronary and towards the access site. Inspecting and palpating the access site is the first move; Brilakis adds that fluoroscopy of the bladder can show the ‘dented bladder’ sign of a retroperitoneal haematoma. Re-imaging the LAD is the tempting reflex but looks in the wrong place, and fluids alone without a search for the cause waste time.",
        },
        { kind: "h", text: "The ECG: what counts as a change" },
        {
          kind: "p",
          text: "Oxford describes how the ECG is usually set up: radiolucent cables in standard positions, a paper speed of 25 mm/s and a gain of 10 mm/mV, with three leads displayed beside the pressure traces and a full 12-lead recording on request. Brilakis lists the changes that should make you stop and think. The Oxford physiologist reports most of them aloud, together with others that Brilakis's list does not name, such as new block, accelerated idioventricular rhythm and asystole.",
        },
        {
          kind: "table",
          caption: "ECG changes of concern (Brilakis 2.2), what the physiologist reports (Oxford), and causes the manuals give",
          head: ["Change", "Causes named in the manuals"],
          rows: [
            ["New ST depression or ST elevation", "Ischaemia. Brilakis calls ST elevation usually the first sign of coronary embolism, shows it appearing after a distal vessel perforation, and warns that a catheter blocking inflow causes ischaemia and arrhythmia. Contrast can briefly raise or depress the ST segment"],
            ["Bradycardia, any degree of AV block (first, second or complete), or a new bundle branch block, especially left", "Contrast can slow the heart for a few seconds (Oxford). In a vasovagal reaction the rate usually falls before the pressure. Oxford asks for every new block and bundle branch block to be called out"],
            ["Tachycardia; atrial fibrillation or flutter", "Discomfort (Brilakis); atrial irritation during right heart catheterisation, ischaemia or pericarditis (Oxford). Tamponade usually comes with a tachycardia (Oxford)"],
            ["QRS widening", "Commonly seen briefly during contrast injection (Oxford); a change that persists needs an explanation"],
            ["Ventricular ectopics during wire manipulation; supraventricular or ventricular ectopics, especially bigeminy, couplets or triplets", "Brilakis lists ventricular ectopy during wire manipulation as a change of concern. Oxford notes that supraventricular and ventricular ectopics are common and usually transient, but asks the physiologist to report them, above all bigeminy and couplets or triplets"],
            ["Ventricular fibrillation", "Oxford: catheter manipulation near a stenosed ostium, plugging a vessel, injection into the conus branch, or ischaemia from a complication. Act at once (see the crisis lesson for who does what)"],
            ["Ventricular tachycardia", "Oxford: the same precipitants as VF, and also manipulation of a right heart catheter (especially in the right ventricular outflow tract) and left ventricular catheterisation. Ventricular arrhythmias are uncommon but can follow a coronary injection"],
            ["Asystole", "Oxford asks the physiologist to call it out at once; it gives no list of causes in this context"],
            ["Accelerated idioventricular rhythm", "Oxford lists it among the rhythms to report and notes it is useful in primary PCI"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis illustrates why the ECG and the pressure trace must be read together: in his example from a chronic total occlusion case in a patient with previous bypass surgery, a distal vessel perforation showed itself as ST elevation together with 35 mmHg of pulsus paradoxus on the arterial trace. Neither sign alone named the problem; together they did.",
        },
        { kind: "tip", id: "pci-mon-st-change" },
        { kind: "h", text: "Oxygen saturation" },
        {
          kind: "p",
          text: "Brilakis gives several possible causes of a falling saturation without ranking them: hypoventilation from heavy sedation, early pulmonary oedema, an artefact, or something else. An arterial blood gas gives a fuller picture of oxygenation and metabolic state. In his sedation section he treats over-sedation by stopping further sedation, reversing it (flumazenil for a benzodiazepine such as midazolam, naloxone for an opioid; doses are taught in the drug module) and intubating if respiratory depression is severe. Oxford adds supplemental oxygen for patients receiving high doses of sedation, and its nurse-led sedation model makes the same point from the other side: after each dose the nurse watches heart rate, blood pressure and saturation.",
        },
        {
          kind: "check",
          stem: "During a radial PCI an anxious patient has received two further doses of a benzodiazepine and an opioid. The saturation probe now reads 87%, the patient is snoring and slow to respond, the blood pressure is unchanged and the chest was clear before the case. What is the best first response?",
          options: [
            "Give a loop diuretic, because early pulmonary oedema is the commonest cause of desaturation in the lab",
            "Reposition the probe and carry on, since a probe artefact is the likeliest cause while the pressure is normal",
            "Stop further sedation, give oxygen, and reverse both drugs: flumazenil for one and naloxone for the other",
            "Give a further small dose of sedative, because restlessness rather than breathing is the real problem here",
          ],
          answer: 2,
          explanation:
            "Recent doses, snoring and drowsiness point to hypoventilation from sedation. Brilakis's treatment is to stop sedating and reverse it (flumazenil for the benzodiazepine, naloxone for the opioid), with intubation if the depression is severe; Oxford adds oxygen for heavily sedated patients. Pulmonary oedema and artefact are both on Brilakis's list of causes and stay in mind (a blood gas helps if the picture is unclear), but treating them first ignores the explanation in front of you. More sedation would deepen the problem.",
        },
        { kind: "h", text: "The access site" },
        {
          kind: "p",
          text: "Bleeding and haematoma can develop at any access site while the patient is fully anticoagulated, so Brilakis asks for the site to be looked at and felt throughout the case, not only at the end, and for the pulses at and beyond it to be checked at the start and the finish, so that bleeding is identified early. The full management of access bleeding is taught in the access-complications module.",
        },
        { kind: "tip", id: "access-mon-pulses-site" },
        { kind: "h", text: "Who is watching" },
        {
          kind: "table",
          caption: "Two descriptions of the same job",
          head: ["Brilakis (US model)", "Oxford (UK model)"],
          rows: [
            ["The primary and secondary operators", "The cardiologist, who as team leader keeps track of ECG, saturation, haemodynamics, comfort, radiation, contrast and ACT"],
            ["A cath lab technician, whose job by tradition is an unbroken watch on the ECG and pressures","The cardiac physiologist, who monitors the ECG and pressures, records the case and calls out abnormal events"],
            ["The cath lab nurse, who watches ECG, pressure and saturation and usually gives the drugs (sedation, anticoagulation, antiplatelet agents)", "The circulating nurse, who watches the patient, tells the operator of any change at once, prepares for it and records it; the scrub nurse supports the monitoring"],
          ],
        },
        { kind: "h", text: "After the lab: what the recovery team watches" },
        {
          kind: "p",
          text: "Monitoring does not stop at the lab door, and the hand-over should tell the recovery nurses what to look for. Oxford's post-procedure observations, which the after-the-procedure module teaches in full, are summarised below; the nurse adjusts the frequency to the patient's condition.",
        },
        {
          kind: "table",
          caption: "Post-procedure observations in the Oxford model",
          head: ["What", "How often, and what to look for"],
          rows: [
            ["Observations", "Non-invasive blood pressure, oxygen saturation and respiratory rate, plus a three-lead ECG if a stent was placed; typically every 15 minutes in the first hour, every 30 minutes in the second, then hourly"],
            ["Radial site", "Check that haemostasis is achieved; look at the wound every 15 minutes until the haemostasis device is off, for any change in colour, sensation, temperature, shape, size or pulse of the forearm, and for pain"],
            ["Femoral site", "Femoral, popliteal and pedal pulses on the punctured side; wound checks every 15 minutes until the patient is mobile, for the same changes"],
            ["Escalation", "Any haemodynamic change goes to the nurse in charge. Chest pain, above all after PCI, means a 12-lead ECG first and a call to the operator, because it may signal a procedural complication"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting without a baseline, so that every later ECG or pressure finding is ambiguous.",
            "Treating all pain as expected because the patient has had balloon inflations; ask each time whether this pain fits what you have just done.",
            "Assuming a low saturation is the probe without looking at the patient.",
            "Checking the access site only when the sheath comes out.",
            "Watching only the coronary image: the ECG, pressure and saturation are on another screen for a reason.",
          ],
        },
        {
          kind: "pearl",
          text: "Make a habit of a slow scan across all the screens and the patient every time you pause, for example while a balloon is inflated: image, ECG, pressure, saturation, face, access site. This is the module's own suggestion for covering Brilakis's twelve items; with practice the scan becomes a quick habit.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the Full procedure lab, before the puncture, record the baseline ECG rhythm and rate, blood pressure, saturation and the radial and ulnar pulses. At each table step, say aloud the ECG, pressure and saturation, and check the access site again before and after the sheath is removed.",
        },
        { kind: "video", id: "XPF_SXb657U", note: "The Manual of PCI chapter on monitoring." },
        { kind: "video", id: "svTApfW9C_o", note: "Sedation and analgesia (Manual of PCI chapter)." },
        {
          kind: "keypoints",
          items: [
            "Monitoring runs from before the puncture to after the sheath is out; Brilakis lists twelve items, from the patient to the position of the equipment.",
            "Record a baseline: a short examination (pulses, signs of pulmonary congestion), 12-lead ECG, rhythm and rate, blood pressure, saturation and pulses at and beyond the access site. Oxford's check looks for a saturation above 96% on room air; a lower value calls for a cause, and in acute coronary syndromes oxygen is for a saturation below 90% (ESC 2023).",
            "Ask of every pain whether it was expected; unexpected pain may be ischaemia, perforation or another complication.",
            "ECG changes of concern: new ST depression or elevation, brady- and tachyarrhythmias, block, QRS widening, ectopy with wire movement, VT and VF.",
            "Desaturation may be hypoventilation from heavy sedation, but it can also be early pulmonary oedema, an artefact or another cause; a blood gas helps.",
            "Read the ECG and pressure together: ST elevation with pulsus paradoxus pointed to a distal perforation in Brilakis's example.",
            "Look at and feel the access site throughout; check the pulses at the start and the end.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-pressure",
      title: "The arterial trace during PCI: is the low pressure real?",
      minutes: 12,
      topics: ["ts-monitoring", "hd-transducers"],
      sources: [
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "28.1" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 5: Pericardial tamponade" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis asks for the arterial pressure to be watched without a break. Four changes concern him: hypotension, pulsus paradoxus, hypertension, and a waveform that damps or disappears. The engagement module teaches what to do when the trace damps at the ostium before an injection. This lesson is about the rest of the case, and above all about the first question when the number on the screen falls: is the patient's pressure really low, or is the measurement wrong?",
        },
        { kind: "h", text: "Step one: exclude a false reading" },
        {
          kind: "steps",
          title: "Five measurement faults to check in seconds (Brilakis 28.1.1.1)",
          items: [
            {
              title: "1. Is the Y-connector valve open?",
              detail: "An open haemostatic valve on the guide's Y-connector lets the pressure escape; the trace falls or flattens. Close it and look again.",
            },
            {
              title: "2. Is the catheter-to-transducer line intact and free of air?",
              detail: "An open connection or air in the line gives a low, blunted trace. Check every connection from the guide hub to the transducer; Brilakis lists simple disconnection of the transducer among the causes of a lost trace.",
            },
            {
              title: "3. Is the guide damping?",
              detail:
                "Common with ostial lesions and with large guides such as 8 Fr, and with deep engagement. Side-hole guides can hide damping, which is why Brilakis rules them out for left main engagement, apart from ostial left main chronic total occlusions: they can mask ischaemia until the patient collapses. Do not inject while the trace is damped: Brilakis warns that an injection then can dissect the coronary or the aortic root and can push air into the artery.",
            },
            {
              title: "4. Is the guide obstructed?",
              detail:
                "Air, thrombus or contrast in the lumen damps the trace; contrast does this especially in 4 and 5 Fr catheters. Air can also be drawn into the guide during a trapping exchange. Aspirate. If nothing comes back, pull the catheter back slightly and aspirate again. If it still fails, take the catheter out while keeping suction on it, without injecting through it and without passing a guidewire through it (either could flush thrombus into the coronary or the systemic circulation), then aspirate the sheath.",
            },
            {
              title: "5. Is there bulky equipment inside the guide?",
              detail: "Devices that fill most of the lumen damp the pressure; Brilakis's example is an aspiration catheter inside a 6 Fr guide.",
            },
          ],
        },
        {
          kind: "p",
          text: "Prevention follows from the list: check every connection, clear the catheter carefully once it is in, and avoid the deep engagement that damps the trace. The damping algorithm itself (withdraw, aspirate, check the transducer, look for a kink, remove under suction, aspirate the sheath) is taught in full in the engagement module.",
        },
        {
          kind: "p",
          text: "Damping is not always an artefact. Brilakis points out that a damped trace may be the patient's true aortic pressure, which is why the check ends with a decision rather than an assumption. Oxford lists where a damped guide tip usually sits: against the aortic wall, too deep in the ostium, against plaque at the ostium of the left main or the RCA, or in the conus branch during RCA cannulation. Its advice matches Brilakis's: no contrast through a damped catheter, or only with great caution, because of the risk of dissecting the aortic or coronary wall. Damping or ventricularisation of the aortic trace is on the list of events the Oxford physiologist calls out, so expect to hear it.",
        },
        { kind: "tip", id: "pci-mon-false-hypotension" },
        {
          kind: "check",
          stem: "You are loading a stent into a 7 Fr EBU guide in the left main. As your assistant opens the Y-connector valve wide, the trace falls from 132/74 mmHg to a flat line at about 40 mmHg. The ECG is unchanged and the patient is talking. What do you do first?",
          options: [
            "Start a vasopressor at once, because the pressure has halved in a few seconds",
            "Close the valve, then reread the trace before treating anything",
            "Pull the guide out of the left main, because the guide must be obstructing flow",
            "Re-zero the transducer to air, because the reading has drifted suddenly",
          ],
          answer: 1,
          explanation:
            "An open haemostatic valve is the first item on Brilakis's list of false hypotension, and the timing (it fell as the valve opened), the unchanged ECG and a talking patient all fit. Close the valve and look again. Brilakis's rule is to correct the identified fault rather than treat the number; a vasopressor given for a measurement fault exposes the patient to a drug he does not need and, by how vasopressors act, may cause hypertension once the valve is closed (this module's reasoning). Pulling the guide is reasonable for true damping, but here the cause is in front of you; re-zeroing does not fix a leak.",
        },
        { kind: "h", text: "Step two: if it is real, think in three groups" },
        {
          kind: "table",
          caption: "True hypotension (Brilakis 28.1.1.2); full management is taught in the hypotension and arrhythmia module",
          head: ["Group", "Causes to look for in the lab"],
          rows: [
            ["Hypovolaemia", "Bleeding, the commonest cause (look at the access sites; a dented bladder on fluoroscopy suggests a retroperitoneal haematoma), and poor hydration in a fasted patient"],
            [
              "Cardiac failure (low stroke volume or a bad rate)",
              "Left or right ventricular failure, usually from ischaemia; valve disease, such as acute regurgitation (including an Amplatz guide, or an EBU guide with a deep curve, pushing an aortic cusp open; repositioning the guide corrects it at once) or stenosis; pericardial causes: tamponade or myocardial rupture; brady- or tachyarrhythmia",
            ],
            ["Peripheral vasodilation", "Vasovagal reaction, anaphylaxis, and drugs: nitroglycerin (especially after a recent phosphodiesterase-5 inhibitor) and verapamil given into the radial artery or the coronary to prevent radial spasm"],
          ],
        },
        {
          kind: "table",
          caption: "What a right heart catheter shows in each group (Brilakis, Fig 28.1)",
          head: ["Group", "Left ventricular filling pressure", "Cardiac output"],
          rows: [
            ["Hypovolaemia", "Low", "Low"],
            ["Cardiac failure", "High (but it can be low when the right ventricle is the one failing)", "Low"],
            ["Peripheral vasodilation", "Low", "High"],
          ],
        },
        {
          kind: "p",
          text: "When the cause is not obvious, Brilakis turns to right heart catheterisation, because those two measurements separate the three groups. He also suggests a pulmonary artery catheter in patients who become hypotensive and in those with heart failure or shock, both to guide decisions about haemodynamic support and to show new changes as they happen. In the Oxford team, the physiologist calls out a significant fall from the baseline pressure, with a systolic below 90 mmHg as the general rule.",
        },
        {
          kind: "list",
          items: [
            "**Preventing true hypotension (Brilakis 28.1.2).** Careful arterial access, radial where possible, and no more anticoagulation than needed, to limit bleeding; enough hydration before the case; prophylactic haemodynamic support for selected high-risk PCI; short coronary occlusions to limit ischaemia; avoiding perforation and the tamponade it brings; premedication for patients with a known contrast allergy; prompt correction of brady- and tachyarrhythmias; enough sedation and fluid to make a vasovagal reaction less likely; and restraint with nitroglycerin and other vasodilators.",
            "**Treating it (Brilakis 28.1.3).** Treat the cause completely and at once where you can. Where you cannot, for example an acute closure that will not reopen, support the circulation at the same time with vasopressors and inotropes, and in some patients mechanical circulatory support. If the patient arrests, Brilakis prefers CPR with an automated compression device, followed by VA-ECMO if recovery is not prompt. Each cause has its own treatment; these are taught in the hypotension and arrhythmia module and the support modules.",
          ],
        },
        { kind: "h", text: "Pulsus paradoxus and hypertension" },
        {
          kind: "p",
          text: "Pulsus paradoxus is a fall in systemic pressure with inspiration; Oxford gives more than 10 mmHg as the usual finding in tamponade, where echocardiography makes the diagnosis at once. On the cath lab monitor it shows as systolic peaks that rise and fall with breathing. Brilakis's example of a 35 mmHg swing after a distal perforation shows why a rhythmic variation in the trace is never a cosmetic problem during PCI. Hypertension is on his list too. Oxford links anxiety in the lab with hypertension, and a vasopressor given for a pressure that was never really low can be expected to raise it (this module's reasoning from how the drugs act).",
        },
        { kind: "tip", id: "pci-mon-pulsus-paradoxus" },
        {
          kind: "check",
          stem: "Near the end of a long CTO case, the heart rate has crept up from 72 to 104/min and the systolic peaks on the arterial trace now rise and fall by about 25 mmHg with each breath. The guide is not damped and all connections are tight. What is the most important next step?",
          options: [
            "Look for a perforation: screen the wire tips and the distal vessel, and get an echocardiogram now",
            "Re-zero and re-level the transducer, because breathing artefact often looks like this on a long case",
            "Give a fluid bolus and recheck in fifteen minutes, because a long case leaves patients dry",
            "Change to a smaller guide, since the swings suggest the guide is partly obstructing the ostium",
          ],
          answer: 0,
          explanation:
            "A respiratory swing of 25 mmHg with a rising heart rate is pulsus paradoxus until proven otherwise, and in a CTO case the leading cause is a perforation filling the pericardium (Brilakis's Fig 2.2 shows pulsus paradoxus after a distal vessel perforation, and Oxford notes that tamponade usually comes with a tachycardia). Echocardiography gives the diagnosis at once. Re-zeroing does not create or remove a respiratory swing, and fluids may support the patient but must not delay the search for the cause.",
        },
        {
          kind: "pitfalls",
          items: [
            "Treating a number: a vasopressor given for false hypotension is a drug the patient did not need, and may leave him hypertensive once the fault is corrected (this module's reasoning).",
            "Injecting through a damped catheter, or flushing a catheter that will not aspirate.",
            "Forgetting that the guide itself can cause true hypotension, by obstructing a vessel or by holding the aortic valve open.",
            "Using a side-hole guide in the left main, where it can hide damping and the ischaemia behind it.",
            "Missing a respiratory swing because only the digital systolic value is being read, not the waveform.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the check aloud as a short chain: valve, line, damping, obstruction, equipment. If all five are clear and the pressure is still low, it is real; say so to the team and start looking for the cause in the three groups.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, before each injection, read the waveform rather than the number: is it an aortic trace with a dicrotic notch, damped, or ventricularised? Disengage, then compare the free aortic trace with your baseline before deciding whether a low pressure is real.",
        },
        { kind: "video", id: "iG18Julm6NA", note: "Hypotension (Manual of PCI chapter)." },
        { kind: "video", id: "QQfDGVH_ogs", note: "A case of hypotension after left main engagement." },
        {
          kind: "keypoints",
          items: [
            "Watch the arterial waveform continuously: hypotension, pulsus paradoxus, hypertension, damping or loss.",
            "Before treating a low pressure, exclude the five faults: open Y-connector valve, open or air-filled line, damping, obstruction by air, thrombus or contrast, bulky equipment in the guide. Never inject through a damped catheter; if aspiration fails, withdraw slightly and retry, then remove it under suction without injecting or passing a wire.",
            "Side-hole guides hide damping; Brilakis rules them out for engaging the left main, except in ostial left main CTOs.",
            "True hypotension: hypovolaemia, cardiac failure (including tamponade, valve regurgitation from the guide, arrhythmia) or vasodilation.",
            "Right heart catheterisation separates the groups when the cause is unclear: low filling pressure and low output in hypovolaemia, high filling pressure and low output in cardiac failure (filling pressure can be low in right ventricular failure), low filling pressure and high output in vasodilation.",
            "Pulsus paradoxus (inspiratory fall over 10 mmHg in tamponade) during PCI means look for a perforation and get an echo.",
            "The Oxford physiologist calls out a significant fall from baseline, as a rule a systolic below 90 mmHg.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-transducers",
      title: "Transducers: zeroing, levelling and the fast-flush test",
      minutes: 13,
      topics: ["hd-transducers"],
      sources: [
        { book: "oxford-cath", loc: "ch 4: Pressure waveforms" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 8: Pressure wire" },
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "12.2" },
      ],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "kovacs-zero-reference-2013", "esc-ph-2022", "michard-damping-2024", "kleinman-fast-flush-1996"],
      blocks: [
        {
          kind: "p",
          text: "Every pressure in the cath lab is measured through a column of fluid: the catheter is connected through a manifold to a transducer, which turns the pressure wave into an electrical signal for the monitor and recorder. Oxford points out that the long path between the catheter tip and the transducer introduces a small delay and some damping. A sensor mounted on the catheter tip would read more truly, but it is too costly and awkward for routine use. Pressure recording has three jobs: monitoring the patient, guiding catheter manipulation (the waveform tells you where the tip is) and diagnosis, for example valve gradients, pulmonary hypertension on a right heart study and pressure-wire physiology. The haemodynamics track covers the physics; this lesson is the bedside routine.",
        },
        { kind: "h", text: "Setting up the line" },
        {
          kind: "steps",
          title: "Manifold, flush and transducer (Oxford)",
          items: [
            {
              title: "Know the manifold's ports",
              detail:
                "A pressure manifold usually has three to five ports. The proximal port goes to the catheter, one to the pressure line fed by a flush infusion, one to the contrast, and the syringe sits on the distal end.",
            },
            {
              title: "Run the flush",
              detail:
                "The flush is usually heparinised saline; Oxford's example adds 1000 IU of heparin to 500 mL of 0.9% saline; follow your hospital's protocol.",
            },
            {
              title: "De-air everything",
              detail:
                "Flush the whole system so no air is trapped that could embolise with an injection, and run contrast through without bubbles. If an assistant set it up, check it yourself before the first injection.",
            },
            {
              title: "Position the patient and the transducer",
              detail:
                "The patient lies flat with one pillow. Oxford gives two different heights in two places: its physiologist section sets the transducer level with the V4 electrode, checked with a ruler, and its equipment section puts the zero point at mid-chest height. They are not the same height. V4 sits on the front of the chest, so a transducer level with it lies above the atria and, taken literally, under-reads every pressure (this module's reasoning from the hydrostatic principle; Kovacs did not test the V4 level). Use the mid-thoracic level, halfway between the front of the sternum and the table. That definition comes from the 2022 ESC/ERS pulmonary hypertension guideline, and Kovacs found this level matched the left atrium; it matches Oxford's mid-chest zero point as usually understood, although Oxford does not define mid-chest further. Keep it the same for the whole case.",
            },
            {
              title: "Zero to air",
              detail:
                "Open the transducer to air through the manifold's distal port and zero it. Calibration and zeroing are done before the case, and can be repeated during it by opening the manifold to air. Oxford's lab checklist includes confirming that the transducer has been calibrated.",
            },
          ],
        },
        { kind: "h", text: "Levelling: why the landmark matters" },
        {
          kind: "p",
          text: "Zeroing removes atmospheric pressure; levelling fixes the height that every reading is referred to. The physics is simple: a transducer placed below the heart reads high and one placed above it reads low, because the column of fluid between them adds or subtracts pressure. On a right heart study the error can change the diagnosis. Kovacs and colleagues compared four landmarks in common use against the centres of the atria measured on CT in 196 patients having right heart catheterisation. The mid-thoracic level matched the left atrium in 97.4% of patients and one third of the chest depth below the front of the chest matched the right atrium in 98.5%. The two landmarks furthest apart (5 cm below the front of the chest and 10 cm above the table) gave readings a median of 8.0 mmHg apart, enough that 59% of the patients would have been labelled as having pulmonary hypertension with one landmark and 80% with the other.",
        },
        {
          kind: "check",
          stem: "After zeroing at the start of a right and left heart study, the table is raised for a difficult femoral venous puncture. The transducer is mounted on a pole and stays where it was, so the patient's chest now sits several centimetres above it. What happens to the pressures you record next?",
          options: [
            "They read higher than the true value, because the reference level is now below the heart",
            "They read lower than the true value, because the reference level is now below the heart",
            "Nothing changes: zeroing to air removes any effect of height between heart and transducer",
            "Only the systolic values are affected; diastolic and mean pressures stay accurate",
          ],
          answer: 0,
          explanation:
            "By the hydrostatic principle, a transducer below the heart adds the weight of the fluid column to every reading, so all the pressures read high. Zeroing removes atmospheric pressure, not this height effect, so re-level after any change in table height. Kovacs showed how much the reference level matters: a median of 8 mmHg between two common landmarks, enough to change the proportion classed as having pulmonary hypertension from 59% to 80% and as having raised left heart pressures from 7% to 38%. The error is not limited to systolic values: it shifts mean and filling pressures alike.",
        },
        { kind: "h", text: "Testing the line: the fast-flush test" },
        {
          kind: "p",
          text: "The two manuals do not describe this test; it comes from the arterial-line literature in anaesthesia and intensive care, where it is the standard bedside check of how faithfully a fluid-filled system reproduces the pressure wave. Kleinman and colleagues, in a bench study of arterial catheter and tubing systems connected to a pressure generator, showed that it gives the same answer as the engineering gold standard, a square-wave test at the catheter tip, when the system is free of air; with a small amount of air in the system the fast flush showed a worse dynamic response than the square-wave test. Michard's 2024 editorial recommends doing the test regularly. Both concern arterial pressure lines rather than coronary catheters, so use the test as a check of the transducer system rather than as a cath lab rule.",
        },
        {
          kind: "steps",
          title: "Doing and reading the test (Michard 2024)",
          items: [
            {
              title: "Flush briefly at high pressure",
              detail: "Where the transducer has a flush device, activate it for a moment and release. The trace jumps up and then falls back, oscillating as it settles.",
            },
            {
              title: "Normal damping",
              detail: "A couple of oscillations, then the arterial waveform resumes.",
            },
            {
              title: "Overdamped",
              detail:
                "No oscillations. The waveform looks flat with a barely visible dicrotic notch, and systolic pressure is underestimated. Look for air bubbles, a kink or partial obstruction of the catheter, and remove the cause.",
            },
            {
              title: "Underdamped (ringing)",
              detail:
                "Several oscillations. The systolic peak overshoots, so systolic pressure is overestimated. Longer tubing makes resonance more likely; resonance filters may be needed.",
            },
            {
              title: "Decide on the mean",
              detail: "Mean pressure is relatively insensitive to both faults, so base treatment decisions on the mean while the line is being corrected.",
            },
          ],
        },
        { kind: "tip", id: "haemo-mon-fast-flush" },
        {
          kind: "check",
          stem: "On a right and left heart study the arterial channel reads 96/62 mmHg (mean 74) while a cuff on the other arm reads 124/58 mmHg (mean 80). A fast flush on the arterial line returns slowly to the waveform with no oscillation at all. What is the most likely explanation and next step?",
          options: [
            "Underdamping from long tubing; add a resonance filter and accept the cuff systolic value",
            "A true pressure difference between the arms; record both values and continue the study",
            "Overdamping; look for air, a kink or clot in the line and catheter, clear it and repeat the test",
            "A transducer placed too high; re-level it, which will correct the systolic but not the mean",
          ],
          answer: 2,
          explanation:
            "No oscillation after a flush is the overdamped pattern, and overdamping underestimates systolic pressure while leaving the mean relatively accurate, which fits a low systolic with a near-normal mean. Michard's list of causes is air, kinking and partial obstruction. Underdamping shows several oscillations and overestimates systolic pressure, the opposite of this picture. A levelling error shifts every reading, the mean included (the hydrostatic principle), so it would not lower the systolic while leaving the mean near normal.",
        },
        { kind: "h", text: "Other artefacts and faults" },
        {
          kind: "list",
          items: [
            "**End-pressure artefact**: a catheter facing a high-velocity jet (Oxford).",
            "**Catheter impact artefact**: the tip touching the vessel wall or a valve.",
            "**Catheter whip artefact**: the catheter moving inside a chamber.",
            "**Transducer faults** (Brilakis): an air bubble in the transducer damps every trace; clear it. A switched-off or disconnected transducer gives no trace; turn it on, reconnect, or change the transducer.",
          ],
        },
        { kind: "h", text: "The aortic line during physiology" },
        {
          kind: "p",
          text: "A pressure wire is only as good as the aortic pressure it is compared with. Both manuals flush and zero the pressure wire before use, then equalise its reading with the guide pressure with the sensor at the guide tip. When equalisation fails, Brilakis's causes include air in the aortic pressure line, and his prevention includes a systemic line that is flushed and properly zeroed. He also lists a loose or malfunctioning transducer as a cause of pressure drift. The full technique is in the physiology module.",
        },
        { kind: "tip", id: "pci-mon-aortic-line-physiology" },
        { kind: "tip", id: "haemo-mon-zero-level" },
        {
          kind: "pitfalls",
          items: [
            "Raising or lowering the table after zeroing without re-levelling a pole-mounted transducer.",
            "Mixing landmarks between studies or between two transducers in the same study.",
            "Accepting an overdamped arterial trace because it ‘looks smooth’, then treating a falsely low systolic pressure.",
            "Leaving contrast in a small catheter, which damps the trace.",
            "Trusting an FFR when the aortic line has air in it or was never zeroed.",
          ],
        },
        {
          kind: "pearl",
          text: "When a pressure does not fit the patient, check the set-up in order: is the line open to the patient, is it level, was it zeroed, and does a flush ring once or twice? Most impossible numbers are explained before you reach the patient.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, zero and level the transducers before you start; record the aortic pressure, then the right heart pressures, and decide for each whether the waveform is faithful before you write down a number.",
        },
        { kind: "video", id: "5ARDKipHats", note: "Essential haemodynamics, pitfalls and anomalies." },
        {
          kind: "keypoints",
          items: [
            "Catheter, manifold, transducer, monitor: the fluid column adds a small delay and some damping.",
            "Flush with heparinised saline per protocol (Oxford example: 1000 IU in 500 mL), and de-air the whole system before the first injection.",
            "Zero by opening the transducer to air and level it at the mid-thoracic level, halfway between the front of the sternum and the table (ESC/ERS 2022; Kovacs), which matches Oxford's mid-chest; Oxford's other landmark, V4 height, lies above the atria. Keep one level throughout.",
            "Mid-thoracic level matches the left atrium; landmarks can differ by a median of 8 mmHg, enough to change a pulmonary hypertension diagnosis (Kovacs).",
            "Fast flush: a couple of oscillations is normal; none means overdamped (systolic too low); many means underdamped (systolic too high). The mean is relatively protected.",
            "Overdamping: air, kink, partial obstruction. Underdamping: long tubing, resonance.",
            "A pressure-wire study needs an aortic line that is flushed, air-free and zeroed.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-position",
      title: "Watching the guide and the wire tip",
      minutes: 13,
      topics: ["ts-equipment-position"],
      sources: [
        { book: "brilakis-pci", loc: "2.12" },
        { book: "brilakis-pci", loc: "8.5" },
        { book: "brilakis-pci", loc: "8.10" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "brilakis-pci", loc: "10.2" },
        { book: "brilakis-pci", loc: "25.1" },
        { book: "brilakis-pci", loc: "26.4" },
      ],
      refs: ["brilakis-manual-pci"],
      blocks: [
        {
          kind: "p",
          text: "Everything you put into the patient (sheath, guide, wire, balloon, stent) has to be watched, Brilakis says, both because it must be in the right place to work and because it can do harm in the wrong one. The two failures he singles out happen when your attention is elsewhere: the guide slipping out of the ostium while you push a stent, and the wire tip wandering into a small branch while the screen is collimated onto the lesion.",
        },
        {
          kind: "table",
          caption: "What moves, and what follows",
          head: ["Equipment", "How it moves", "What follows"],
          rows: [
            ["Guide, backing out", "Pushed back by the resistance of a balloon or stent being forced forward", "Loss of the guide and then of the wire position"],
            ["Guide, diving in", "Advanced deep by forward push, or ‘sucked’ in when a balloon is pulled back forcefully or before it is fully deflated", "Dissection and acute closure, especially if contrast is injected"],
            ["Wire tip, advancing", "Jumps forward when devices are pushed, pulled or exchanged with difficulty", "Entry into a small branch and distal perforation; more likely with polymer-jacketed, stiff or tapered tips (and a knuckled wire can still exit the vessel)"],
            ["Wire tip, retreating", "Dragged back with a sticky or kinked wire, or a device being removed", "Wire pulled proximal to the lesion: a dissection there can no longer be treated"],
          ],
        },
        { kind: "h", text: "Pushing a balloon or stent forward" },
        {
          kind: "steps",
          title: "Delivering without losing position (Brilakis 9.7.8, 10.2.8)",
          items: [
            {
              title: "Watch both ends",
              detail:
                "While the device advances, and while it is withdrawn, keep the guide tip and the distal wire tip on the screen and match how hard you push to what they are doing.",
            },
            {
              title: "Do not force it",
              detail: "Forcing a device through resistance is the cause Brilakis gives for losing the guide and the wire position. If the device stops, stop.",
            },
            {
              title: "Use your hands deliberately",
              detail:
                "Forward push on the guide adds support but can make it prolapse and disengage. The independent-hand technique lets one operator control both: the left hand advances the guide, and the right holds the wire steady and pushes the device.",
            },
            {
              title: "If position is lost",
              detail: "Re-engage the guide, then rewire the lesion or readvance the wire.",
            },
            {
              title: "If the stent will not cross",
              detail:
                "Better lesion preparation, not more force: Brilakis repeats balloon angioplasty (or sometimes uses atherectomy) to let the stent cross. The full ladder of support and preparation options is in the stent delivery module.",
            },
          ],
        },
        { kind: "tip", id: "pci-mon-watch-both-ends" },
        { kind: "tip", id: "pci-mon-guide-backout" },
        {
          kind: "check",
          stem: "A stent will not pass a calcified bend in the mid-RCA. You push harder. On the monitor the JR4 guide has slipped back into the sinus and the wire tip has retreated from the distal vessel to the crux. What now?",
          options: [
            "Keep pushing steadily, because the stent is close to crossing and the wire still lies beyond the lesion",
            "Ask the assistant to push the guide in hard while you keep forcing the stent forward together",
            "Deploy the stent where it is, before the wire retreats any further and you lose the position",
            "Stop pushing, pull the stent back, re-engage the guide and readvance the wire, then prepare the lesion further",
          ],
          answer: 3,
          explanation:
            "Brilakis's rule is to stop forcing as soon as the guide or the wire moves, then re-engage and rewire or readvance, and to solve an uncrossable lesion with more preparation (repeat balloon angioplasty or atherectomy) rather than force. Pushing on risks losing the wire behind the lesion, after which any dissection there cannot be treated. Deploying a stent short of the lesion leaves the problem untreated and harder to fix.",
        },
        { kind: "h", text: "Pulling a balloon back and taking it out" },
        {
          kind: "steps",
          title: "Withdraw, remove, check (Brilakis 9.7.11–9.7.13)",
          items: [
            { title: "Confirm full deflation", detail: "Check on fluoroscopy that the balloon has fully deflated before you pull." },
            {
              title: "Withdraw while watching the guide and wire",
              detail:
                "If the guide starts to be sucked into the vessel, stop, reposition the guide and wire, and hold some traction on the guide. Partly disengaging the guide from the ostium first, or using the independent-hand technique (left hand pulls the guide, right hand withdraws the balloon), prevents guide-induced dissection.",
            },
            {
              title: "Remove over a fixed wire",
              detail:
                "Hold the wire with the left hand close to the Y-connector and draw the balloon back to those fingers with the right; then the right hand fixes the wire while the left takes the balloon off. Keep the wire wiped clean with a wet gauze, make small movements, and screen the wire tip if the balloon moves with difficulty. Trapping the wire prevents tip movement. With two wires, keep them separate and wipe both.",
            },
            {
              title: "Before the next injection",
              detail:
                "Aspirate and flush the guide, then confirm that it is still properly engaged: it may have backed out or dived in while the balloon came out. Only then inject.",
            },
          ],
        },
        { kind: "tip", id: "pci-mon-check-guide-after-removal" },
        { kind: "h", text: "The wire tip" },
        {
          kind: "p",
          text: "Brilakis's goal for this step is simple: no unintended withdrawal and no unintended advancement. Watch the tip and correct it whenever it moves. Monitoring should be continuous or at least intermittent, and it matters most when you have collimated the beam so that the tip is out of the field, and when devices are hard to deliver or withdraw, because that is when the wire moves most. He mentions an imaging system that keeps full image quality only in the region of interest and shows the rest of the field, wire tip included, at lower quality.",
        },
        {
          kind: "list",
          items: [
            "**During exchanges**: uncontrolled advancement of a hydrophilic, polymer-jacketed or stiff wire into a small distal branch during an over-the-wire exchange can perforate it. Brilakis prefers trapping with a balloon, then a wire extension, and avoids the hydraulic exchange for these wires (exchange techniques are taught in the wiring module).",
            "**While the wire enters the guide**: a wire can slip into the coronary during injections without fluoroscopy and cause dissection, perforation or loss of guide position. A torquer tightened about 90 cm from the tip, or the 90 and 100 cm shaft marks on some wires, help; know whether the guide is 90 or 100 cm long. If the wire has gone in, do not pull it out reflexly: inject to see where it is (it is sometimes in the intended branch), then redirect it.",
            "**Side-hole guides**: the wire can leave through the side hole rather than the tip.",
          ],
        },
        {
          kind: "p",
          text: "A distal perforation can be hard to see on a collimated image, and because the pericardium may fill slowly, tamponade can appear hours after the case has ended. Brilakis therefore monitors such patients closely and avoids glycoprotein IIb/IIIa inhibitors and cangrelor in them. If one occurs, his first step is to inflate a balloon upstream of the leak, so that bleeding stops while definitive treatment, usually fat or coil embolisation, is prepared.",
        },
        {
          kind: "list",
          items: [
            "**Preventing distal wire perforation (Brilakis 26.4).** Watch the distal wire closely while delivering equipment and whenever more than one wire is in the vessel, above all with stiff or polymer-jacketed wires; trap the wire during equipment exchanges to keep it still; and once a stiff or polymer-jacketed wire has crossed and its position is confirmed, swap it for a workhorse wire.",
            "**The next steps if it happens.** Pericardiocentesis if the patient becomes hypotensive, and an early call to cardiac surgery in case the percutaneous fix fails. If the balloon seals the leak, watching and reversing heparin (once the equipment is out of the artery) may be enough, but Brilakis prefers definitive treatment in most cases, because the leak can reopen and cause late tamponade. Embolisation means passing a second wire and then a microcatheter into the perforated branch, with brief deflations of the blocking balloon. If the branch cannot be wired, for example because it is too small or angulated, a covered stent across its origin is the alternative. The techniques are taught in the perforation module.",
          ],
        },
        { kind: "tip", id: "pci-mon-wire-tip-collimation" },
        {
          kind: "check",
          stem: "Through a 7 Fr guide you are removing a long over-the-wire balloon over a 190 cm polymer-jacketed wire. It sticks, and before the trapping balloon is inflated you push and pull it several times. When you open the collimator for a check run, the wire tip has advanced from the mid-LAD into a tiny apical branch and there is a faint blush beyond it. What is the right sequence?",
          options: [
            "Inflate a balloon proximal to the perforation, prepare fat or coil embolisation, give no IIb/IIIa inhibitor or cangrelor",
            "Pull the wire back to a safe position and finish the case, since a faint blush rarely matters to the patient afterwards",
            "Give a glycoprotein IIb/IIIa inhibitor to protect the new stent from thrombosis, then repeat the run in ten minutes",
            "Leave the wire where it is and finish the case; deal with the blush later only if the patient becomes hypotensive",
          ],
          answer: 0,
          explanation:
            "This is the scenario Brilakis warns about: a polymer-jacketed wire advancing during a difficult exchange while collimation hid the tip. A blush is a distal perforation until proven otherwise. His first step is a balloon inflated proximal to the perforation to stop bleeding while fat or coil embolisation is prepared (through a microcatheter in the perforated branch), and he avoids glycoprotein IIb/IIIa inhibitors and cangrelor because tamponade can develop hours later. He does not teach pulling the wire back first; the wire access may be needed. Dismissing a faint blush is exactly how delayed tamponade happens.",
        },
        {
          kind: "p",
          text: "Finally, a crisis makes all of this harder. Brilakis notes that acute vessel closure is stressful for the patient and the operator, and stress is when a wire gets pulled out by accident or a guide is moved carelessly. Staying calm, keeping the true-lumen wire where it is and watching the guide throughout are, he says, the key to managing it.",
        },
        { kind: "tip", id: "pci-mon-keep-wire-in-crisis" },
        {
          kind: "pitfalls",
          items: [
            "Watching the stent and not the guide while pushing.",
            "Pulling a balloon that is not fully deflated, sucking the guide into the artery.",
            "Collimating onto the lesion and never opening the field to check the wire tip.",
            "Injecting straight after a balloon comes out without checking that the guide is still coaxial.",
            "Letting blood and contrast dry on the wire, so it moves with the balloon.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every push and every pull, glance at three points on the screen: the guide tip, the device, and the wire tip. If you cannot see all three, open the field before you move.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, take the calcified mid-RCA scenario. While you deliver the balloon and then the stent, watch the guide tip and the distal wire tip on every push; if the guide backs out, stop, re-engage and readvance the wire before trying again.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "On the PCI bench, deliver and withdraw a balloon and a stent, confirming full deflation before each withdrawal and checking the guide position before each run.",
        },
        { kind: "video", id: "wFyDa1UnwH4", note: "How to deliver balloons and stents (Manual of PCI chapter)." },
        { kind: "video", id: "M_ASWxk3Gx0", note: "Distal vessel perforation (Manual of PCI chapter)." },
        { kind: "video", id: "5QqwesnusBk", note: "Case: severe calcification and distal vessel perforation." },
        {
          kind: "keypoints",
          items: [
            "Watch the position of everything in the body; the guide and the wire tip are the two that move without warning.",
            "Do not force a device: watch the guide and the wire tip while advancing and withdrawing, and stop when either moves.",
            "If position is lost: re-engage, then rewire or readvance. If the stent will not cross, prepare the lesion more.",
            "Confirm full deflation, withdraw under vision, partly disengage or use the independent-hand technique to stop the guide being sucked in.",
            "After removing a device, aspirate and flush the guide and confirm engagement before injecting.",
            "Check the wire tip at least intermittently, especially when collimated and during difficult exchanges; polymer-jacketed, stiff and tapered tips perforate most.",
            "A distal perforation may cause tamponade hours later: proximal balloon first, then definitive treatment (usually embolisation, otherwise a covered stent), and no IIb/IIIa inhibitor or cangrelor. Prevent it by watching the tip, trapping during exchanges and swapping stiff or polymer-jacketed wires for a workhorse once across.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-checklist",
      title: "Brief, sign in, time out, sign out",
      minutes: 12,
      topics: ["ts-checklist-timeout"],
      sources: [
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 2: The cardiologist" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 2: The radiographer" },
        { book: "brilakis-pci", loc: "1.1" },
        { book: "brilakis-pci", loc: "2.9" },
      ],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "haynes-checklist-2009", "natssips2-2023"],
      blocks: [
        {
          kind: "p",
          text: "Oxford describes a fixed sequence that every patient passes through: a team brief at the start of the session, then sign in, time out and sign out for each case, built on the WHO surgical safety checklist whose aim is to prevent ‘never events’. UK laboratories run it under their local safety standards for invasive procedures. The evidence for the checklist comes from surgery: in the WHO study across eight hospitals, introducing a 19-item checklist designed to improve team communication was followed by a fall in in-hospital deaths from 1.5% to 0.8% and in complications from 11.0% to 7.0%. The foundations track introduced the checklist; here it is step by step, with who does what.",
        },
        {
          kind: "steps",
          title: "The sequence (Oxford)",
          items: [
            {
              title: "1. Team brief, at the start of the list",
              detail:
                "Everyone attends. The cardiologist leads it and covers the work list, the main details and expected difficulties of each case, the plan during and after each procedure, where each patient goes afterwards (day unit, cardiology ward, coronary care or another ward), any staffing or equipment problems, who coordinates the list, and each person's role if there is a complication or a cardiac arrest.",
            },
            {
              title: "2. Room and kit ready",
              detail:
                "The circulating nurse confirms the safety checks of the room are done and it is tidy. The physiologist confirms that the monitoring (ECG and oximeter), the defibrillator, the temporary pacing box and the balloon pump work and are stocked; the resuscitation trolley is checked daily against a checklist kept with it, for completeness, expiry and sterility. The cardiologist confirms the team is available and the equipment needed is working.",
            },
            {
              title: "3. Sign in, before sedation, anaesthesia or draping",
              detail:
                "With the whole team present: identity (including date of birth and hospital number), procedure and consent. Then the whiteboard: haemoglobin, creatinine, height and weight, where the IV cannula is, dual antiplatelet therapy (maintenance and any loading dose), bleeding problems, respiratory problems, diabetes with the last glucose, drug allergies and the arterial site chosen. Oxford also asks you to confirm the signature on the consent form with the patient, to review the notes so the procedure is still indicated, and to confirm that women who could be pregnant are not.",
            },
            {
              title: "4. Time out, before you start",
              detail:
                "The circulating nurse signs that section of the WHO form and hands it to the operator, who confirms that everyone knows what was discussed at the brief and sign in and that the case can go ahead, that the equipment for the case has been checked and is ready, and that the exposure is authorised under IR(ME)R according to the standard operating procedure.",
            },
            {
              title: "5. Sign out, led by the scrub nurse",
              detail:
                "Confirm the documentation is accurate; check the equipment, count the sharps (needles, scalpels) and verify that the wires are intact; record anything left in place and any unexpected issue; record whether dual antiplatelet therapy is needed and for how long, whether a loading dose has been given in the lab or is due on the ward; and state the key concerns for recovery. The patient does not leave the lab until every section is complete and acted on.",
            },
          ],
        },
        { kind: "tip", id: "pci-mon-time-out" },
        {
          kind: "check",
          stem: "The circulating nurse hands you the WHO form for the time out. The radiographer has stepped out to collect a lead apron and the physiologist is on the phone to the ward. The patient is draped and ready. What do you do?",
          options: [
            "Wait until the whole team is in the room and listening, then run the time out",
            "Run the time out with those present and brief the other two when they return to the room",
            "Skip the time out, because the sign in already covered identity, procedure and consent",
            "Ask the circulating nurse to complete the time out alone while you start the puncture",
          ],
          answer: 0,
          explanation:
            "Oxford lists the brief, sign in, time out and sign out among the duties of every team member, including the radiographer and physiologist, and the time out is where the operator confirms that everyone knows the plan and the equipment is ready. A time out with half the team is a form filled in, not a check. Sign in and time out are different steps: one confirms the patient and the paperwork, the other confirms that the team is ready to start.",
        },
        { kind: "h", text: "Making the PCI time out work" },
        {
          kind: "p",
          text: "Oxford's time out is short: shared information, equipment ready, radiation authorised. For a PCI, the brief is where Oxford puts the procedural plan and each person's role in a complication. A practical way to use that (this module's suggestion, built from Brilakis's planning chapter) is to say the plan aloud in one breath: access and sheath, guide, anticoagulation, the device you expect to need and the bailout kit you want in the room. Brilakis's planning checklist exists so that none of these is decided in a hurry later.",
        },
        { kind: "h", text: "Sign out: the last chance to catch an error" },
        {
          kind: "p",
          text: "Two sign-out items are easy to skip and hard to fix later. The kit check: the cardiologist is responsible for confirming at the end that nothing but the stent has been left in the circulation, and the scrub nurse checks that every wire is intact. And the antiplatelet plan: if a stent or another device such as a TAVI valve went in, the sign out records the need for and duration of dual antiplatelet therapy, whether the loading dose is already on the drug chart, and whether it was given in the lab or must be given on the ward.",
        },
        {
          kind: "check",
          stem: "At sign out the scrub nurse lays the two coronary wires side by side. One looks a few centimetres shorter than the other and its tip coil is missing. The patient is comfortable and the final angiogram looked good. What do you do?",
          options: [
            "Complete the sign out and record it as a manufacturing defect for the company to investigate",
            "Let the patient return to the ward and screen the chest and heart tomorrow if symptoms appear",
            "Stop the sign out, account for the missing piece, record it, and keep the patient in the lab until it is dealt with",
            "Discard the wire to avoid confusion and repeat the count with the remaining equipment only",
          ],
          answer: 2,
          explanation:
            "Verifying wire integrity and recording any equipment left in place are named sign-out steps, and Oxford says the patient should not leave the lab until every section is completed and acted on. The cardiologist must be sure that nothing except the stent remains in the circulation. Retrieval is taught in the equipment-loss module; the point here is that sign out is the moment the discrepancy is caught, and letting the patient go would waste it.",
        },
        { kind: "tip", id: "pci-mon-sign-out" },
        {
          kind: "pitfalls",
          items: [
            "Running the brief, sign in or time out without the whole team in the room.",
            "Signing in after sedation has been given, when the patient can no longer confirm identity and consent reliably.",
            "Leaving the role in a cardiac arrest (who defibrillates?) unassigned at the brief.",
            "Letting the patient leave before the antiplatelet plan and loading dose are recorded.",
            "Not checking wire integrity at the end of the case.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford advises watching several procedures in a new lab before working there, because routines differ from place to place. Ask on your first day where the resuscitation kit and emergency drugs are, how the local resuscitation guideline runs, and who defibrillates.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the diagnostic cath lab, run the pre-brief and time out aloud before access: patient, procedure and consent confirmed; access route; equipment ready; who defibrillates; then complete the case and finish with a sign out that includes the wire and equipment check.",
        },
        { kind: "video", id: "XPF_SXb657U", note: "The Manual of PCI chapter on monitoring." },
        { kind: "video", id: "ELu-yJ7USOU", note: "The Manual of PCI chapter on planning." },
        {
          kind: "keypoints",
          items: [
            "The sequence: team brief, sign in, time out, sign out (WHO checklist); every team member takes part.",
            "Brief: work list, case details and challenges, care plans, destinations, staffing and equipment issues, roles in arrest or complication.",
            "Sign in before sedation, anaesthesia or draping: identity, procedure, consent and the whiteboard items.",
            "Time out: everyone aware and ready, equipment checked, IR(ME)R authorised.",
            "Sign out: documentation, equipment and sharps count, wire integrity, anything left in place, antiplatelet plan, recovery concerns; the patient stays until it is done.",
            "The checklist's evidence: in the WHO study deaths fell from 1.5% to 0.8% and complications from 11.0% to 7.0% in non-cardiac surgery.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-team",
      title: "Who does what: cardiologist, nurses, physiologist, radiographer",
      minutes: 13,
      topics: ["ts-team-roles"],
      sources: [
        { book: "oxford-cath", loc: "ch 2: The cardiologist" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 2: The radiographer" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "brilakis-pci", loc: "2.12" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Oxford describes four professions in the cath lab team, each with defined jobs: cardiologist, specialist nurse, cardiac physiologist and radiographer; its nursing section adds that there are usually at least two nurses, and many centres a third. Knowing those jobs tells you what you can expect from each person, what they need from you, and who will act when something happens. The tables below set out the Oxford model step by step, followed by how the doctors and nurses are trained.",
        },
        { kind: "h", text: "The cardiologist: team leader from referral to discharge" },
        {
          kind: "table",
          head: ["Phase", "Responsibilities (Oxford)"],
          rows: [
            ["Before", "Judge whether the indication is appropriate; admit the patient; arrange any tests needed; explain the options to the patient and family; take consent; plan the procedure and discuss it with the team; check the team is available and the equipment works; lead the brief; be at sign in; lead the time out"],
            ["During", "Asepsis of the field; the patient's ECG, saturation and haemodynamics; comfort (asking for sedation or analgesia); radiation and contrast; the strategy and techniques; regular ACT checks; confirming that the device handed over is the one requested; leading the response to an arrest or complication; confirming at the end that nothing but the stent remains in the circulation"],
            ["After", "Sign out; the report (history, indication, anatomy, steps, equipment including number, type, size and length of stents, complications, plan); the plans for haemostasis, medicines, rehabilitation, discharge and follow-up; a letter to the GP; telling the patient the outcome and, under the duty of candour, any complication; monitoring for early complications or renal failure; overall care to discharge; informing the department manager and the coroner after a death in the lab; a debrief with the team at the end of the day"],
          ],
        },
        { kind: "h", text: "The nurses: scrub and circulating" },
        {
          kind: "table",
          caption: "Usually at least two nurses; many centres add a third for complex or frail patients when staffing allows",
          head: ["Scrub nurse", "Circulating nurse"],
          rows: [
            ["Prepares the equipment in an organised way, following manufacturers' instructions; checks adjuncts and drugs with a second nurse and labels them; takes part in the brief, sign in, time out and sign out for every patient; keeps the patient safe inside the scrubbed field","Confirms the room's safety checks and keeps it tidy; takes a full handover from the preparing nurse (history, bloods, drugs, antiplatelet doses, allergies, renal function, height and weight, other conditions)"],
            ["Keeps the field sterile, follows aseptic technique from hand washing and skin preparation to the end, and encourages the rest of the team to do the same", "Takes part in the WHO checklist, confirming identity and consent; gets every adjunct to the scrub team safely and on time"],
            ["Checks each device and drug before handing it to the operator", "Inspects equipment integrity; documents the procedure on the hospital's reporting system"],
            ["Shares the role of patient advocate with the circulating nurse; with the radiographer, watches the contrast dose", "Watches the patient continuously and tells the operator of any change at once; prepares equipment and drugs in anticipation; records events as they happen (ideally a second circulating nurse does this)"],
            ["Achieves haemostasis at the end with the local device or technique", "Supports timely ACT measurement and makes sure heparin is given when the ACT calls for it; talks to and reassures the patient when the operator is not screening; checks glucose in diabetic patients"],
          ],
        },
        {
          kind: "p",
          text: "Oxford also describes nurse-led sedation: safe IV access, knowledge of the drugs and their reversal agents, judging the need for fluid, inotropes or other blood-pressure support from the patient's heart function and coronary anatomy, monitoring heart rate, blood pressure and saturation after each dose, and the autonomy to titrate the dose the operator asked for, so the operator can concentrate on the case.",
        },
        { kind: "h", text: "The cardiac physiologist: monitoring, measurement, devices" },
        {
          kind: "list",
          items: [
            "Takes part in the brief, sign in, time out and sign out.",
            "Sets up and calibrates the equipment, including resuscitation equipment; makes sure the ECG, oximeter probe, balloon pump, defibrillator and pacing box work and are stocked; checks the resuscitation trolley daily.",
            "Chooses the technology, settings and transducer for each patient, monitors continuously, makes the pressure and haemodynamic measurements, and tells the team (operator, radiographer, scrub and circulating nurses) about any adverse change.",
            "Delivers the shock for a shockable rhythm when the operator instructs. The role is assigned at the brief; unless someone else has been named, the physiologist should assume it.",
            "Works with the operator on rotational atherectomy, pressure-wire studies, temporary pacing (rate, threshold, output) and balloon pumps or other left ventricular support.",
            "Tracks time since the last heparin dose or ACT and gives a 15–20 minute warning when an ACT is due.",
            "Records the whole case and produces the physiologist's report: identity, height and weight, times, access, drugs and their times, contrast volume, equipment, timing of wiring (especially in primary PCI), each inflation's pressure and duration, FFR or iFR values, ACTs, the haemostasis device, total procedure time, fluoroscopy time and dose–area product, complications and their management, and pacing or support settings, with printouts of the baseline, final and event traces.",
          ],
        },
        { kind: "tip", id: "pci-mon-act-warning" },
        { kind: "h", text: "The radiographer: images and radiation" },
        {
          kind: "list",
          items: [
            "Works under the radiation legislation (Oxford cites IR(ME)R 2017 and the Ionising Radiations Regulations 2017) and local protocols, keeping the patient's dose as low as reasonably practicable while giving the image quality needed.",
            "Provides reference views on request; prepares and stocks contrast; checks the quality of protective equipment; checks and documents pregnancy status in women who could be pregnant.",
            "Warns the team about screening time, dose, distance from the image intensifier, and shielding and protective equipment.",
            "When high doses approach, advises on dose reduction: choice of projection, saving fluoroscopy instead of acquiring cine, collimation, a low acquisition rate, avoiding magnification, and added filtration.",
            "During an arrest or complication, works with the team, for example moving the C-arm out of the way for chest compressions.",
            "Records radiation and contrast doses, archives images, reassures patients worried about radiation, teaches and audits. Oxford adds a practical point: if something important is seen on fluoroscopy, such as an air bubble embolising, have the radiographer save that screening loop before you press the pedal again.",
          ],
        },
        { kind: "tip", id: "pci-mon-dose-advice" },
        {
          kind: "check",
          stem: "During a PCI the patient goes into ventricular fibrillation. At the morning brief nobody was named to defibrillate. The pads are on. Who should deliver the shock?",
          options: [
            "The circulating nurse, who is closest to the defibrillator and the patient",
            "The operator, who must leave the sterile field to do it personally",
            "Whoever reaches the defibrillator first, without waiting for an instruction",
            "The cardiac physiologist, on the operator's instruction",
          ],
          answer: 3,
          explanation:
            "In the Oxford model defibrillation is assigned at the brief and, unless someone else was named, the cardiac physiologist takes it on and shocks when the operator instructs. That is why the brief asks who defibrillates: in an arrest nobody should be working this out. The operator stays at the table, keeping the wire and guide in place.",
        },
        {
          kind: "check",
          stem: "The radiographer warns you that the dose for a long LAD bifurcation case is climbing. Which change is on Oxford's list of ways to cut dose that the radiographer may suggest?",
          options: [
            "Magnify the image so that each run can be shorter",
            "Move the detector further from the patient to widen the field",
            "Collimate, lower the acquisition rate and save fluoroscopy instead of acquiring cine where possible",
            "Acquire extra cine runs now so that fewer will be needed later",
          ],
          answer: 2,
          explanation:
            "Oxford's list is projection choice, saving fluoroscopy rather than acquiring cine, collimation, a low acquisition rate, avoiding magnification and added filtration. Magnification is on the list of things to avoid. Detector position and further dose techniques are taught in the radiation module.",
        },
        { kind: "tip", id: "diag-mon-store-loop" },
        { kind: "h", text: "How the team is trained" },
        {
          kind: "list",
          items: [
            "**The cardiologist.** Besides clinical care, Oxford gives the cardiologist teaching duties towards students, trainees and the lab team, and research duties where the job includes them. The European route it describes runs from general medicine (1–2 years) and cardiology (3–4 years) to an interventional fellowship of about 2 years: at least 200 supervised PCIs, a primary PCI rota, imaging and physiology; at least 30 days (240 hours) of accredited formal learning over the 2 years; a logbook on the CARDS data standard signed off monthly; and assessment by an independent trainer, on a simulator and in a final examination. A training centre should do more than 800 coronary interventions a year and have at least two supervisors, each with over 5 years in interventional practice and more than 1000 PCIs. EAPCI certification, launched in 2018, lasts 5 years. The career and training modules cover this in depth.",
            "**The nurses.** Training follows a departmental programme. A new starter is first supernumerary, typically for 10 weeks though this varies with what the person needs, observing both the scrub and the circulating role, then is assessed in practice against a grid and must reach 100% before being signed off as a competent cath lab nurse.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Asking for a device by a vague name, then not checking that what is handed over is what you meant; the operator confirms it.",
            "Ignoring the physiologist's call-out because you are concentrating on the image.",
            "Forgetting that the circulating nurse needs your drug orders clearly and early to prepare them.",
            "Not telling the radiographer before you pan or change view, so dose and time are wasted.",
          ],
        },
        {
          kind: "pearl",
          text: "Brilakis's monitoring list ends with who watches what. Ask at the start of each list who is watching the ECG and pressure, who gives drugs, and who records; when an event happens you will already know whose voice to expect.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the diagnostic cath lab, use the team to work: ask the radiographer for each projection before you acquire, ask the nurse for drugs with name, dose and route, and respond to every physiologist call-out before your next injection.",
        },
        { kind: "video", id: "XPF_SXb657U", note: "The Manual of PCI chapter on monitoring, including who watches what." },
        {
          kind: "keypoints",
          items: [
            "Cardiologist: leads before, during and after; owns indication, consent, plan, brief, time out, the complication response, the report, candour and the debrief.",
            "Scrub nurse: equipment, asepsis, checks before handing over, contrast watch with the radiographer, haemostasis.",
            "Circulating nurse: handover, checklist, supplies, documentation, continuous patient watch, ACT and heparin, patient support, glucose.",
            "Physiologist: equipment and resuscitation checks, monitoring and measurement, call-outs, defibrillation by default, devices, ACT timing, the procedural record.",
            "Radiographer: images, ALARP, pregnancy check, staff protection, dose-reduction advice, C-arm in an arrest, dose records.",
            "Defibrillation is assigned at the brief; by default the physiologist shocks on the operator's instruction.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-crisis",
      title: "Leading through a crisis: call-outs, closed loops and human factors",
      minutes: 13,
      topics: ["ts-crisis-leadership"],
      sources: [
        { book: "oxford-cath", loc: "ch 2: The cardiologist" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 2: The radiographer" },
        { book: "oxford-cath", loc: "ch 10: Death" },
        { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
        { book: "brilakis-pci", loc: "2.9" },
        { book: "brilakis-pci", loc: "2.10" },
        { book: "brilakis-pci", loc: "7.3" },
        { book: "brilakis-pci", loc: "25.1" },
        { book: "brilakis-pci", loc: "28.1" },
      ],
      refs: ["oxford-cath-handbook", "brilakis-manual-pci", "hargestam-closed-loop-2013", "siassakos-teamwork-2011", "grogan-crm-2004", "soar-erc-als-2021"],
      blocks: [
        {
          kind: "p",
          text: "Oxford makes the cardiologist the leader of the response to a cardiac arrest or complication, and asks for that role to be held consciously from the first step of the case to the last. Brilakis adds the human side: an acute closure frightens the operator as well as the patient, and a frightened operator is the one who pulls the wire out by mistake. The technique of each complication is taught in the complications track. This lesson is about running the room while it happens.",
        },
        { kind: "h", text: "The first minutes" },
        {
          kind: "steps",
          title: "A sequence built from the two manuals and the teamwork literature",
          items: [
            {
              title: "1. Keep what you have",
              detail:
                "Hold the wire position and the guide steady. Brilakis calls staying calm and keeping a true-lumen wire in place the key to managing acute closure, and asks for continuous attention to the guide, because careless guide movement is a common way to lose the wire.",
            },
            {
              title: "2. Say what is happening",
              detail:
                "The physiologist calls out the event (VF, asystole, a new block, a pressure fall); the operator then names the problem to the whole room. In the teamwork literature this first spoken observation is the call-out, and it is what turns individual concern into a shared picture.",
            },
            {
              title: "3. Activate the roles agreed at the brief",
              detail:
                "VF needs immediate defibrillation within the advanced life support algorithm (Oxford); the physiologist shocks on your instruction unless someone else was named. In the lab the arrest is witnessed and monitored with the defibrillator at hand, which is the setting where the 2021 European Resuscitation Council ALS guideline allows up to three quick successive shocks to be considered before compressions start (counted as the first shock when timing adrenaline); then follow the algorithm. The radiographer moves the C-arm to allow chest compressions. The circulating nurse brings what is needed and records times; the scrub nurse keeps the field sterile and checks each device before it reaches you. Brilakis prefers a mechanical compression device if CPR is needed, with VA-ECMO if the patient does not recover promptly (taught in the support modules).",
            },
            {
              title: "4. Give orders to a person, and close the loop",
              detail:
                "Name the person, the drug or device, the dose or size and the route. The receiver repeats it back; you confirm that it was understood correctly. Härgestam's discussion cites earlier work showing that orders directed at a named person are more likely to be carried out than orders called into the air (an obstetric simulation study), and that many unaddressed orders overload resuscitation teams.",
            },
            {
              title: "5. Keep a record",
              detail:
                "Ideally a second circulating nurse documents while the others act. The physiologist captures the traces of each event. Oxford gives a documentation list for a death in the lab: clear notes from every member of staff of the exact timing of events, who was present, the equipment used and the likely mechanism of death, and whether the next of kin was contacted and what was said. This module applies the same list to any serious complication as good practice.",
            },
            {
              title: "6. Afterwards",
              detail:
                "Tell the patient and family what happened under the duty of candour and debrief the team at the end of the day. After a death in the lab, Oxford's list for the cardiologist is: contact the next of kin and explain how events unfolded (good communication can often prevent complaints and litigation); let the family see the body in privacy if they wish, respecting any religious requirements; if an iatrogenic complication played a part, inform the unit manager and file an adverse incident report under local policy; tell the GP early, because the GP will support the family in bereavement; discuss the death with the coroner, and request a post-mortem if the death is unexplained; inform the department manager; make room for the team to talk the case through, and cancel or postpone the rest of the list if necessary. Some hospitals offer counselling to staff involved.",
            },
          ],
        },
        { kind: "tip", id: "pci-mon-vf-roles" },
        {
          kind: "list",
          items: [
            "**Why it happened.** Brilakis notes that arrhythmias in the lab are usually ischaemic, so treating the ischaemia improves or ends them, and that they often follow reperfusion. Bradycardia and AV block are often drug-induced, for example by adenosine, whose effect is brief.",
            "**VF that keeps recurring or resists shocks (Oxford).** Consider amiodarone 300 mg IV and a different defibrillator, and correct potassium and magnesium.",
            "**VT (Oxford).** Poorly tolerated VT needs synchronised DC cardioversion under sedation or general anaesthesia (200–360 J, or the biphasic equivalent). If the VT is reasonably tolerated, options are a beta-blocker (such as a 5 mg IV bolus of metoprolol) or 10 minutes of IV amiodarone, 150 mg, given into a large vein; either can be repeated. With a stable blood pressure, lidocaine can follow: 50 mg IV given over 2 minutes, then again every 5 minutes up to 200 mg in all. Watch for hypotension, tell the anaesthetist and have cardioversion ready. Overdrive pacing through a right ventricular wire can end stable monomorphic VT, with a defibrillator ready in case it accelerates.",
            "These doses are typical values from the manual; follow your local protocol. The arrhythmia module teaches the details.",
          ],
        },
        {
          kind: "check",
          stem: "During a large-vessel perforation you have a balloon inflated over the wire. You say, looking at the screen, ‘We need the echo machine and a covered stent, and someone check the ACT.’ Thirty seconds later nobody has moved. What went wrong, and how do you fix it?",
          options: [
            "The team was slow to react; repeat the same request louder so the whole room hears it",
            "Nothing went wrong; the orders were clear, so wait another thirty seconds before you ask again",
            "The orders were addressed to nobody; give each one to a named person and ask each to repeat it back",
            "Leave the table and fetch the covered stent yourself while the scrub nurse holds the balloon",
          ],
          answer: 2,
          explanation:
            "Three orders called into the room, with no names and no check-back, are the pattern that the work Härgestam cites found least likely to be acted on and most likely to overload a team. Give each order to a named person, with the item and size, ask for a check-back, and confirm. Shouting the same unaddressed list again does not fix the problem, and the operator leaving the table puts the wire and balloon at risk.",
        },
        { kind: "h", text: "Closed-loop communication" },
        { kind: "tip", id: "pci-mon-closed-loop" },
        {
          kind: "table",
          caption: "Three steps (Härgestam 2013)",
          head: ["Step", "Who", "Example"],
          rows: [
            ["Call-out: the message", "Sender", "‘Anna, nicardipine 200 micrograms, intracoronary, please. Tell me when it is ready.’"],
            ["Check-back: acknowledgement", "Receiver", "‘Nicardipine 200 micrograms for intracoronary use, drawing it up now.’"],
            ["Verification: the loop closes", "Sender", "‘Yes, that is right.’ Then: ‘Ready.’ ‘Thank you.’"],
          ],
        },
        {
          kind: "p",
          text: "The example dose sits within Brilakis's intracoronary range for nicardipine (100–300 micrograms), the agent he prefers for no-reflow; follow your local protocol. Closed loops are harder than they look. In Härgestam's simulated trauma teams, only about one call-out in seven led to a completed loop, even though the participants had just watched a video stressing it; teams led in a more egalitarian style closed more loops and teams led in an authoritarian style closed fewer, and members who had attended two or more structured trauma courses closed more. Hesitation to speak up against authority is a recognised cause of breakdowns. In simulated eclampsia, Siassakos found that teams which declared the emergency early and delegated the critical task clearly, with the loop closed, gave the magnesium sooner. The practical lesson for the operator is to invite check-backs and make it easy for anyone to call out what they see.",
        },
        { kind: "h", text: "Human factors the manuals name" },
        {
          kind: "list",
          items: [
            "**Fatigue.** Brilakis asks for attention to the operators' and the team's state, naming excessive fatigue as a condition that leads to worse outcomes. Operator or patient fatigue after a diagnostic study is on his list of reasons to defer an ad hoc PCI, and on his list of reasons to stage multivessel PCI.",
            "**Noise and distraction.** Brilakis wants excessive noise and distraction avoided, and a rule like aviation's ‘sterile cockpit’ during the critical parts of the procedure (taught in the sterile-field lesson).",
            "**Stress.** Acute closure stresses patient and operator, and stress leads to accidental wire removal (Brilakis 25.1).",
            "**Team training.** Crew resource management, borrowed from aviation, covers managing fatigue, building and running teams, recognising red flags, cross-checking and communication, decision making and feedback on performance. Grogan's study of an 8-hour course, whose participants included cath lab staff, found that attitudes to these skills improved and that 95% of respondents expected the training to reduce errors; it measured attitudes, not patient outcomes.",
          ],
        },
        {
          kind: "check",
          stem: "At 7.30 pm, after a long list, your diagnostic angiogram in a stable patient shows a complex distal left main bifurcation that was not expected. The patient consented to PCI if needed, but the consent discussion did not cover left main stenting. You and the nurse in charge are both tired. What does Brilakis's teaching support?",
          options: [
            "Proceed now, because the patient is already on the table and a second procedure carries its own risks",
            "Proceed but use a smaller guide and fewer views to shorten the case and limit the fatigue",
            "Proceed if the radiographer agrees that the dose so far is low enough to allow it",
            "Defer the PCI: fatigue and consent that did not cover this risk are both his reasons not to go ahead ad hoc",
          ],
          answer: 3,
          explanation:
            "Brilakis lists operator or patient fatigue after a diagnostic study, and consent that did not cover an anatomy whose PCI risk is substantially higher, among the reasons to defer ad hoc PCI. Both apply here. Technical shortcuts do not remove the effect of fatigue on judgement, and the dose is one consideration among several, not a licence to proceed.",
        },
        { kind: "tip", id: "pci-mon-fatigue-defer" },
        {
          kind: "pitfalls",
          items: [
            "Letting go of the wire, or moving the guide, while attention is on the emergency.",
            "Orders into the air with no name and no check-back.",
            "Nobody writing down times and drugs, so the debrief and the report rely on memory.",
            "Carrying on with the list straight after a death in the lab as if nothing had happened.",
            "Starting a complex ad hoc PCI when you and the team are exhausted.",
          ],
        },
        {
          kind: "pearl",
          text: "Name your scribe as soon as a crisis starts. A person whose only job is to write down times, drugs and events frees everyone else to act, and gives you the timeline you will need for the patient, the family and the debrief.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, take the LCx STEMI scenario. If ventricular fibrillation or hypotension occurs, keep the wire in place, give each instruction to a named team member, and wait for the check-back before you move on.",
        },
        { kind: "video", id: "dsUWJcXEQto", note: "Acute vessel closure (Manual of PCI chapter)." },
        { kind: "video", id: "ELNZNLV4Vq8", note: "Overall management of perforation (Manual of PCI chapter)." },
        {
          kind: "keypoints",
          items: [
            "The cardiologist leads the response; roles in an arrest are set at the brief.",
            "First: keep the wire and steady the guide; stress is when wires are pulled out by mistake.",
            "Call out the event, then name the problem to the room.",
            "Give each order to a named person; receiver repeats it back; sender confirms. Unaddressed orders tend not to be carried out.",
            "VF: immediate defibrillation within ALS (in the monitored lab, up to three quick successive shocks may be given before compressions, ERC 2021); the physiologist shocks on instruction; the radiographer moves the C-arm for compressions.",
            "Keep a scribe; document times, people, equipment and mechanism; debrief the team; candour with the patient and family.",
            "Fatigue is a reason to defer ad hoc PCI or stage multivessel PCI.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-monitoring-sterile",
      title: "The sterile field, the room and handling equipment",
      minutes: 11,
      topics: ["ts-sterile-environment"],
      sources: [
        { book: "brilakis-pci", loc: "2.10" },
        { book: "brilakis-pci", loc: "2.11" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "9.7" },
        { book: "oxford-cath", loc: "ch 1: Catheter laboratory preparation" },
        { book: "oxford-cath", loc: "ch 2: The nurse" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
        { book: "oxford-cath", loc: "ch 10: Stroke" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Two of Brilakis's twelve monitored items are about the room rather than the patient: the environment and the sterile field. A quiet room keeps attention on the case; a clean, ordered table keeps debris out of the patient and puts the right device in your hand the first time. The foundations track teaches scrubbing and gowning; this lesson covers what to keep doing during the case.",
        },
        { kind: "h", text: "The room: a sterile cockpit" },
        {
          kind: "p",
          text: "Brilakis asks for excessive noise and distraction to be avoided, and borrows a rule from aviation. The ‘sterile cockpit rule’ is the informal name for the US Federal Aviation Administration regulation that, during critical phases of flight, crew do only what the safe operation of the aircraft requires. His point is that the same rule should hold during the critical parts of a procedure. The manuals do not list which parts are critical; agree at the brief which steps the team will treat that way for this case.",
        },
        { kind: "tip", id: "pci-mon-sterile-cockpit" },
        { kind: "h", text: "Getting the field ready (Oxford)" },
        {
          kind: "steps",
          items: [
            { title: "Protective wear", detail: "Masks and hats according to local policy; lead protection and a sterile scrub suit." },
            {
              title: "Prepare and drape the access site aseptically",
              detail:
                "Check the local procedure with the nursing staff. Brilakis applies the antiseptic at the groin from the puncture site outwards in concentric circles, lets it dry at the groin or wrist so the drape will stick, and repeats the scrub if the site is contaminated, for example by the patient's hand. Full access preparation is taught in the access module.",
            },
            {
              title: "Check the trolley",
              detail: "Make sure everything the case needs is on the sterile trolley before you start.",
            },
            {
              title: "Check the manifold",
              detail:
                "Confirm it has been flushed and that contrast has been run through without air bubbles. Oxford's stroke prevention adds: before starting, inspect all tubing, the manifold and the syringes for bubbles, and flush every catheter and clean every wire with heparinised saline before use.",
            },
          ],
        },
        {
          kind: "check",
          stem: "The right radial site has been prepared and draped. While you open the sheath pack, the anxious patient reaches up and touches the prepared wrist with the other hand. What should happen before the puncture?",
          options: [
            "Repeat the antiseptic preparation of the site, let it dry, and re-drape as needed",
            "Wipe the spot with a dry sterile swab and go ahead, since the hand only brushed the skin briefly",
            "Go ahead, but give a dose of prophylactic antibiotic after the procedure to cover the contamination",
            "Switch to the left radial artery, because a contaminated site cannot be used again in the same case",
          ],
          answer: 0,
          explanation:
            "Brilakis is specific: if the prepared site is contaminated, for example by the patient's hands, the antiseptic scrub is repeated. A dry wipe does not restore sterility, and there is no need to abandon the site. Antibiotics are not a substitute for asepsis and are not part of this teaching.",
        },
        { kind: "h", text: "Keeping the table and the kit clean during the case" },
        {
          kind: "p",
          text: "Blood and contrast dry on gloves and equipment. Brilakis points out two consequences: wires, catheters, balloons and stents become sticky and hard to handle, and dried debris can be carried into the manifold and embolise. The cure is routine: keep the table organised so each item can be found and identified, wipe your gloves and the equipment regularly, and flush the catheters with heparinised saline.",
        },
        {
          kind: "steps",
          title: "Handling habits that protect the wire position",
          items: [
            { title: "Wipe the wire", detail: "Before removing a balloon, wipe the part of the wire outside the guide with a wet gauze so that it is clean and slippery." },
            { title: "Separate multiple wires", detail: "Keep two wires apart and wipe both before taking a balloon off, so they do not wrap round each other." },
            { title: "Small movements", detail: "Remove devices in small, controlled movements; a sticky wire will otherwise follow the balloon out." },
            { title: "Replace a kinked wire", detail: "If a wire kinks, put a new wire in first, then take the kinked one out." },
          ],
        },
        { kind: "tip", id: "pci-mon-wipe-wire" },
        {
          kind: "check",
          stem: "After several high-pressure inflations, the balloon will not slide back over the wire; as you pull, the distal wire tip moves back with it. Your gloves are smeared with dried contrast. What is the best response?",
          options: [
            "Pull more firmly in one smooth movement so the balloon comes off before the wire can move further",
            "Ask the assistant to hold the wire tightly while you jerk the balloon back to break it free",
            "Remove the wire and balloon together and rewire the vessel from the start with a new wire",
            "Stop, wipe the wire and your gloves with a wet gauze, then remove the balloon in small movements while watching the wire tip",
          ],
          answer: 3,
          explanation:
            "Brilakis lists high-pressure inflations (over 20 atm) and a sticky wire among the causes of losing wire position during balloon removal; prevention is wiping the wire with a wet gauze, small movements and screening the wire tip, with trapping as an option. Pulling harder or jerking is how the wire is lost. Removing everything and rewiring gives up the position you are trying to keep.",
        },
        {
          kind: "pitfalls",
          items: [
            "Background conversation and phone calls during wiring or device delivery.",
            "A cluttered table where the wrong balloon is picked up, or a wire end slides off the edge.",
            "Gloves and wires left coated with dried blood and contrast.",
            "Carrying on after the prepared site has been touched.",
            "Assuming the manifold is free of air because someone else set it up.",
          ],
        },
        {
          kind: "pearl",
          text: "Wipe on every exchange. Each time a device comes out, wipe the wire and your gloves before the next one goes in; it costs seconds and keeps the wire where you left it.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the Full procedure lab, set up the table with the equipment in the order you will use it, check the manifold for air, and at each exchange wipe the wire and flush the catheter before reconnecting.",
        },
        { kind: "video", id: "XPF_SXb657U", note: "The Manual of PCI chapter on monitoring, including the environment and sterile field." },
        { kind: "video", id: "icI8Zn2FFvQ", note: "How to perform balloon angioplasty (Manual of PCI chapter)." },
        {
          kind: "keypoints",
          items: [
            "Avoid noise and distraction; apply a sterile cockpit rule during the critical parts of the case.",
            "Prepare the field aseptically and repeat the scrub if the site is contaminated.",
            "Inspect tubing, manifold and syringes for bubbles; flush catheters and clean wires with heparinised saline.",
            "Keep the table organised; wipe gloves and equipment regularly so they do not become sticky.",
            "Dried debris that reaches the manifold can embolise.",
            "Wipe the wire with wet gauze, separate multiple wires, and use small movements when removing devices.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-monitoring-q1",
      stem: "During LAD PCI through a 6 Fr guide, the arterial trace falls from 128/70 to 70/45 mmHg with a rounded waveform as a thrombus aspiration catheter is advanced inside the guide. The ECG is unchanged and the patient feels well. What is the most likely explanation?",
      options: [
        "A vasovagal reaction to the manipulation, which should be treated with atropine and fluids now",
        "Damping from bulky equipment filling the guide lumen, which is a false hypotension",
        "Ischaemia from distal embolisation caused by the aspiration catheter passing the lesion",
        "Tamponade from a wire perforation, which typically flattens the arterial waveform first",
      ],
      answer: 1,
      explanation:
        "Bulky equipment within the guide is one of Brilakis's five causes of false hypotension, and his example is an aspiration catheter inside a guide. The timing and the unchanged ECG in a comfortable patient fit. A vasovagal reaction usually comes with bradycardia and symptoms, and ischaemia or tamponade would be expected to change the ECG, the patient or the respiratory variation of the trace.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q2",
      stem: "Which pair of findings, appearing together during a CTO PCI in a patient with previous bypass surgery, did Brilakis use to illustrate a distal vessel perforation?",
      options: [
        "ST-segment depression in the inferior leads together with a new right bundle branch block",
        "Sinus bradycardia with a sudden rise in systolic pressure and pulse pressure",
        "ST-segment elevation with about 35 mmHg of pulsus paradoxus on the arterial trace",
        "Accelerated idioventricular rhythm with a damped trace from the guide catheter",
      ],
      answer: 2,
      explanation:
        "In Brilakis's Fig 2.2, from a CTO case in a patient with previous bypass surgery, a distal perforation produced ST elevation together with 35 mmHg of pulsus paradoxus. It is his example of reading the ECG and pressure trace together. Accelerated idioventricular rhythm is a rhythm Oxford asks the physiologist to report, noting that it is useful in primary PCI; it is not a sign of perforation.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q3",
      stem: "An Amplatz guide is advanced deep for support during RCA PCI. As it is pushed in, the trace keeps a sharp upstroke and a clear aortic shape with a dicrotic notch, but the pressure falls from 135/70 to 118/38 mmHg, and it recovers when the guide is eased back; the ECG is unchanged. Brilakis describes a mechanism for this. What should you do?",
      options: [
        "Reposition the guide, since an Amplatz pushed deep can hold an aortic cusp open and cause acute regurgitation",
        "Give a vasopressor and continue, because the support given by the deep Amplatz position is needed to finish",
        "Insert a pulmonary artery catheter before changing anything, to measure the filling pressures and cardiac output",
        "Give intracoronary nitrate, because the falling pressure suggests spasm around the guide tip",
      ],
      answer: 0,
      explanation:
        "Brilakis describes Amplatz guides (and EBU guides with a deep curve) pushing an aortic cusp open and causing acute aortic regurgitation, with hypotension that simple repositioning of the guide corrects at once. The link between guide position and pressure points to it, and a falling diastolic with a widening pulse pressure and an undamped waveform fits regurgitation rather than damping from deep intubation. A right heart catheter helps when the cause is unclear, but here the cause is in front of you. Nitrate would lower the pressure further.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q4",
      stem: "On a right heart study, the mean pulmonary artery pressure and wedge pressure are both higher than the echocardiogram suggested. Which explanation does the Kovacs study make most important to check first?",
      options: [
        "The transducer was zeroed but referenced to a level below the heart, adding pressure to every reading",
        "The fluid-filled line was underdamped, so resonance overestimated the mean pulmonary and wedge pressures",
        "Catheter whip in the pulmonary artery, which adds a fixed offset to both the mean and wedge pressures",
        "The patient's breathing raised the wedge pressure, which should be read at end inspiration",
      ],
      answer: 0,
      explanation:
        "Kovacs showed that the choice of reference level alone changed readings by a median of 8 mmHg between landmarks and moved the proportion labelled as having pulmonary hypertension from 59% to 80%; by the hydrostatic principle, a reference level below the heart adds pressure to every reading. Underdamping mainly overestimates systolic pressure and leaves the mean relatively protected (Michard). Catheter whip is a motion artefact (Oxford) that distorts the waveform rather than adding a fixed offset. The respiratory timing of the wedge reading is a separate question that the Kovacs study did not address.",
      difficulty: 3,
      refs: ["kovacs-zero-reference-2013", "michard-damping-2024"],
    },
    {
      id: "pm-monitoring-q5",
      stem: "A fast-flush test on an arterial line produces several sharp oscillations that take a long time to settle, and the systolic peak looks spiky. Which statement is correct?",
      options: [
        "The line is overdamped; systolic pressure is underestimated and the cause is usually an air bubble",
        "The line is ideally damped; a long run of oscillations shows a fast, faithful system",
        "The line is underdamped; the mean pressure is the value most affected and should not be used",
        "The line is underdamped; systolic pressure is overestimated and long tubing makes this more likely",
      ],
      answer: 3,
      explanation:
        "Multiple oscillations (‘ringing’) mean underdamping, which overestimates systolic pressure; longer tubing makes resonance more likely (Michard 2024). A normal line shows only a couple of oscillations, and an overdamped line none. The mean is relatively insensitive to both faults, which is why treatment decisions should rest on it while the line is corrected.",
      difficulty: 2,
      refs: ["michard-damping-2024"],
    },
    {
      id: "pm-monitoring-q6",
      stem: "A JR4 guide backs out of the RCA ostium as you push a stent at a calcified bend, and the wire tip retreats to just beyond the lesion. Which response follows Brilakis's teaching?",
      options: [
        "Push the guide in firmly with the left hand while continuing to drive the stent forward with the right hand",
        "Deploy the stent at its current position to secure the vessel before the wire retreats any further than it has",
        "Withdraw the stent, re-engage the guide, readvance the wire, and prepare the lesion further before trying again",
        "Remove the stent and wire together, then rewire with a stiffer wire for more support",
      ],
      answer: 2,
      explanation:
        "Brilakis's prevention is to avoid forceful advancement and to watch the guide and the distal wire while pushing; once position is lost, re-engage and readvance or rewire; and when a stent will not cross, repeat balloon angioplasty or sometimes atherectomy. The independent-hand technique gives control but does not justify continuing to force a stent while the guide is backing out.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q7",
      stem: "After a long OCT-guided case a small distal blush is seen in an apical LAD branch where the wire tip had been sitting. A proximal balloon has stopped the leak on repeat injection. Which plan follows Brilakis?",
      options: [
        "Give a glycoprotein IIb/IIIa inhibitor to protect the new stent, and discharge the patient as planned if well tomorrow",
        "Reverse all anticoagulation at once and withhold the antiplatelet loading dose for the new stent until the next day",
        "Accept the result now that the leak has stopped, and arrange a routine echocardiogram in a week",
        "Avoid IIb/IIIa inhibitors and cangrelor, prepare embolisation, and monitor closely because tamponade can appear hours later",
      ],
      answer: 3,
      explanation:
        "Brilakis warns that distal perforations are easy to miss under collimation and can cause tamponade hours after the case because the pericardium fills slowly; such patients are monitored closely and do not receive IIb/IIIa inhibitors or cangrelor. A proximal balloon is the first step while definitive treatment, usually fat or coil embolisation, is prepared. Stopping the antiplatelet plan for a new stent is not part of this teaching.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q8",
      stem: "In the Oxford model, which of these belongs to the time out rather than to the sign in?",
      options: [
        "Confirming the patient's identity with date of birth and hospital number",
        "Confirming that the equipment for the case has been checked and is ready",
        "Recording haemoglobin, creatinine, height and weight on the whiteboard",
        "Recording the dual antiplatelet regimen, including any loading dose",
      ],
      answer: 1,
      explanation:
        "At the time out the operator confirms that everyone knows the information from the brief and sign in, that the equipment is checked and ready, and that the exposure is authorised under IR(ME)R. Identity, consent and the whiteboard items (haemoglobin, creatinine, height and weight, IV site, antiplatelet therapy, bleeding and respiratory issues, diabetes, allergies, arterial site) belong to the sign in, which is done before sedation or draping.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "pm-monitoring-q9",
      stem: "A cardiac physiologist gives you a warning 50 minutes into a CTO case. Which item on Oxford's list of events to call out is a timing warning rather than an abnormality?",
      options: [
        "A significant fall in blood pressure from baseline, as a rule a systolic below 90 mmHg",
        "The onset of a new bundle branch block, especially a left bundle branch block",
        "The onset of an accelerated idioventricular rhythm during primary PCI",
        "A 15–20 minute warning that the next activated clotting time check is due",
      ],
      answer: 3,
      explanation:
        "Oxford's list of events the physiologist calls out ends with a 15–20 minute warning for the ACT check, a timing prompt rather than an abnormal finding; the physiologist tracks the time since the last heparin dose or ACT. The other three are abnormal events on the trace or ECG.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "pm-monitoring-q10",
      stem: "In Härgestam's study of closed-loop communication in simulated emergency teams, which finding is the most useful for an operator leading a cath lab crisis?",
      options: [
        "Few call-outs led to a completed loop, and an authoritarian leadership style was linked with fewer loops",
        "Closed loops were used in nearly every exchange once the teams had watched a short teaching video",
        "Attending two or more structured trauma courses was linked with fewer closed loops",
        "Previous simulation training with a patient simulator was the strongest predictor of closed-loop use",
      ],
      answer: 0,
      explanation:
        "Only about one call-out in seven was completed as a closed loop, even after a reminder video, and an authoritarian leadership style was associated with fewer loops while an egalitarian style was associated with more. Previous simulation training with a patient simulator did not increase their use, whereas two or more structured trauma courses were linked with more closed loops, not fewer. The lesson is to name the person, invite the check-back and make speaking up easy.",
      difficulty: 3,
      refs: ["hargestam-closed-loop-2013"],
    },
    {
      id: "pm-monitoring-q11",
      stem: "Why does Brilakis advise regular wiping of gloves and equipment and flushing of catheters during a case?",
      options: [
        "To keep the radiographic markers visible, because dried contrast on the kit obscures them on fluoroscopy",
        "To maintain the hydrophilic coating, which dissolves away when it stays in contact with dried blood",
        "Because dried blood and contrast make kit sticky and debris entering the manifold can embolise",
        "Because dried contrast on the gloves raises the operator's radiation dose from scatter",
      ],
      answer: 2,
      explanation:
        "Brilakis gives two reasons: dried blood and contrast make gloves, wires, catheters, balloons and stents sticky and hard to handle, and debris that enters the manifold creates a risk of embolism. Wiping and flushing with heparinised saline make handling easier and reduce complications. The other options are not part of his reasoning.",
      difficulty: 1,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-monitoring-q12",
      stem: "Midway through a radial PCI, saturation falls from 97% to 89%. The patient is drowsy after sedation but has also had 200 mL of contrast and has a reduced ejection fraction, with new crackles at both bases. What is the best course?",
      options: [
        "Treat it as possible early pulmonary oedema as well as over-sedation: stop sedation, support breathing and check a blood gas",
        "Attribute it to sedation alone, give a reversal agent at once and continue the case without further assessment",
        "Assume the probe is reading falsely because of the radial sheath on that side and move it to the other hand",
        "Ignore it unless it falls below 85%, because saturation usually dips a little during long cases under sedation",
      ],
      answer: 0,
      explanation:
        "Brilakis lists hypoventilation from sedation, early pulmonary oedema, artefact and other causes for desaturation, and suggests an arterial blood gas for a fuller picture. With new crackles and poor ventricular function, early pulmonary oedema must be considered alongside sedation; stopping sedation and supporting breathing are right in either case. Fixing on one cause, or on the probe, risks missing the other.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
  ],
  sims: [
    { sim: "procedure", task: "Run a full radial case saying the monitoring aloud: baseline ECG, pressure, saturation and pulses before access; trace and ECG at every step; access site at the start and end." },
    { sim: "haemo", task: "Zero and level the transducers, then judge each waveform before recording any number." },
    { sim: "cathlab", task: "Run the time out with the team, give drug and view orders by name, and respond to every physiologist call-out before the next injection." },
    { sim: "pci-bench", task: "Deliver and withdraw a balloon and a stent while checking the guide and wire positions before each movement." },
  ],
  caseIds: ["pm-monitoring-case-lad", "pm-monitoring-case-stemi-night"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-monitoring-case-lad",
    title: "An elective LAD stent that keeps you watching",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, sections 1.2, 2.1-2.12, 8.10, 9.7.8, 9.7.11-9.7.13, 10.2.8, 26.4 and 28.1; Oxford Handbook, chapter 1 (catheter laboratory preparation), chapter 2 (the team) and chapter 4 (equipment)",
    },
    summary:
      "Elective radial PCI of a calcified mid-LAD lesion: the baseline and the time out, a sudden fall in pressure that may or may not be real, a stent that will not cross, a wire tip out of view, and the sign out.",
    presentation:
      "A 71-year-old man with stable angina despite two antianginal drugs and an ischaemic stress test. Diagnostic angiography last month showed a calcified 85% mid-LAD stenosis. He is on aspirin and loaded with clopidogrel. Right radial access with a 6 Fr EBU 3.5 guide is planned.",
    findings: ["Blood pressure 146/78 mmHg, sinus rhythm 64/min, saturation 97% on room air", "eGFR 52 mL/min/1.73 m²", "Good radial and ulnar pulses on the right"],
    steps: [
      {
        id: "s0",
        prompt: "The patient is on the table. The physiologist asks whether you want the transducer zeroed now. What do you do before the puncture?",
        options: [
          {
            text: "Level the transducer at the mid-thoracic level and zero it to air; record the baseline ECG, rate, pressure, saturation and the pulses at and beyond the access site",
            best: true,
            feedback:
              "This is Brilakis's monitoring baseline (1.2 and 2.7) and Oxford's set-up: transducer zeroed by opening it to air at mid-chest height, taken here as the mid-thoracic level, a good continuous ECG, saturation checked. Every later change is judged against these numbers.",
          },
          {
            text: "Zero it later once the guide is in, to save time now",
            acceptable: true,
            feedback:
              "Zeroing can be repeated during the case by opening the manifold to air, but Oxford calibrates and zeroes before the procedure, and without a baseline you will have nothing to compare a later fall against.",
            stateDelta: { stability: -3, flags: ["no-baseline"] },
          },
          {
            text: "Skip the baseline; the monitor will show any problem when it happens",
            feedback: "Brilakis records the ECG, rate and vital signs at the start precisely so that later changes are recognised as new.",
            stateDelta: { stability: -8, flags: ["no-baseline"] },
          },
        ],
      },
      {
        id: "s1",
        prompt: "The circulating nurse hands you the WHO form for the time out. The radiographer has gone to fetch more contrast. What now?",
        options: [
          {
            text: "Wait for the radiographer, then run the time out with everyone present: plan, equipment ready, IR(ME)R authorised, who defibrillates",
            best: true,
            feedback: "Oxford includes the radiographer in the time out, and the operator confirms that everyone knows the plan and the equipment is ready. A minute's wait costs nothing.",
          },
          {
            text: "Run it now and tell the radiographer the plan later",
            next: "c-timeout",
            feedback: "A time out that misses a team member does not do its job.",
            stateDelta: { stability: -5, flags: ["partial-timeout"] },
          },
        ],
      },
      {
        id: "c-timeout",
        kind: "consequence",
        prompt: "The radiographer returns as you puncture and asks which views and how much contrast are planned; she also notes that the eGFR is 52 and asks about a contrast limit. What do you do?",
        info: "Brilakis generally stops before 3.7 × GFR of contrast, prefers a lower threshold in chronic kidney disease, and counts any recent contrast. With an eGFR of 52 this patient has chronic kidney disease, so the plan should be a limit below 3.7 × 52 (about 190 mL), and he should be asked about any recent contrast scan.",
        options: [
          {
            text: "Pause, repeat the plan aloud for the whole team including the contrast limit and the projections, and then continue",
            best: true,
            feedback: "Recovering the time out late is better than never. The shared plan, including the contrast limit, is what the time out exists to give the team.",
          },
          {
            text: "Tell her you will decide as you go",
            feedback: "The radiographer records contrast and radiation and advises on dose; she cannot do so without the plan.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The guide is in the left main and the wire is across. As your assistant opens the Y-connector wide to load a balloon, the trace falls to a flat line around 45 mmHg. The ECG is unchanged and the patient is chatting. What now?",
        variants: [{ flag: "no-baseline", info: "Without a recorded baseline, you are less sure what his normal trace looked like." }],
        options: [
          {
            text: "Close the valve and reread the trace; if it is still low, check the line, damping, obstruction and equipment before treating",
            best: true,
            feedback: "An open haemostatic valve is the first cause of false hypotension in Brilakis's list. The timing and a well patient make it the likeliest explanation.",
          },
          {
            text: "Start a vasopressor straight away",
            next: "c-pressor",
            feedback: "Treating a measurement fault exposes the patient to a drug he does not need.",
            stateDelta: { stability: -12, flags: ["vasopressor-given"] },
          },
          {
            text: "Pull the guide out of the left main at once",
            acceptable: true,
            feedback: "Partial withdrawal is the first step for true damping, but it costs position when the wire is across and a balloon is being loaded, and the cause here was the open valve.",
            stateDelta: { stability: -2 },
          },
        ],
      },
      {
        id: "c-pressor",
        kind: "consequence",
        prompt: "A bolus of vasopressor is given. Seconds later the assistant closes the valve and the trace jumps to 198/104 mmHg. The patient has a headache. What do you do?",
        info: "This consequence illustrates the module's reasoning from how vasopressors act; Brilakis's own rule is simply to find and correct a false reading rather than treat it.",
        options: [
          {
            text: "Recognise the false hypotension, stop any further vasopressor, and let the pressure settle while monitoring",
            best: true,
            feedback: "The vasopressor was given for a reading, not a patient. Stop, monitor and run the five-point check before any future treatment.",
          },
          {
            text: "Give intravenous nitrate to bring the pressure down quickly",
            feedback: "Chasing one drug with another adds risk; stop, monitor, and let the pressure settle.",
            stateDelta: { stability: -6 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After predilatation, the 3.0 × 28 mm stent stops at the calcified mid-LAD. You push harder and see the guide tip slip back from the left main ostium. What do you do?",
        options: [
          {
            text: "Stop pushing, pull the stent back into the guide, re-engage, check the wire tip, and prepare the lesion further before trying again",
            best: true,
            feedback: "Brilakis: avoid forceful advancement, watch the guide and wire, re-engage if position is lost, and use more lesion preparation when a stent will not cross.",
          },
          {
            text: "Push harder while the assistant holds the guide in",
            next: "c-wire-lost",
            feedback: "Forceful advancement through resistance is the cause Brilakis gives for losing the guide and wire position.",
            stateDelta: { stability: -18, flags: ["wire-lost"] },
          },
          {
            text: "Use the independent-hand technique to push the guide gently while advancing the stent once more, watching both ends",
            acceptable: true,
            feedback: "A legitimate support manoeuvre, but forward push can make the guide prolapse; if the stent still does not cross, prepare the lesion more.",
          },
        ],
      },
      {
        id: "c-wire-lost",
        kind: "consequence",
        prompt: "The guide falls into the aorta and the wire springs back to the proximal LAD. A repeat injection shows a dissection flap at the lesion with TIMI 2 flow. The patient has chest pain and new ST elevation in V2–V4.",
        info: "Blood pressure 112/70 mmHg, heart rate 92/min.",
        options: [
          {
            text: "Call it out, re-engage the guide carefully, rewire the true lumen under vision, and plan to stent the dissection; ask for help early",
            best: true,
            feedback: "Brilakis: dissection with compromised flow needs the wire back in the true lumen and a stent; losing the wire behind the lesion is exactly the scenario his warnings are meant to prevent.",
          },
          {
            text: "Inject repeatedly to define the dissection before doing anything else",
            feedback: "Repeated injections can extend a dissection; the priority is to regain wire position and restore flow.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The stent is deployed and post-dilated. You have been working collimated onto the mid-LAD. Before the final runs, what do you do?",
        options: [
          {
            text: "Open the collimation and look at the distal wire tip before the final runs",
            best: true,
            feedback: "Brilakis wants the wire tip watched all the time, or at least checked repeatedly, above all when collimation hides it. The tip sits in a large distal LAD, with no blush.",
          },
          {
            text: "Go straight to the final runs with the field collimated on the stent",
            next: "c-blush",
            feedback: "Collimation is when distal perforations are missed.",
            stateDelta: { stability: -10, flags: ["missed-tip"] },
          },
        ],
      },
      {
        id: "c-blush",
        kind: "consequence",
        prompt: "On the final wide run you notice the wire tip in a tiny apical branch with a small blush beyond it. The pressure is 124/70 mmHg with no respiratory swing yet.",
        options: [
          {
            text: "Inflate a balloon proximal to the perforation, then proceed to definitive treatment (usually fat or coil embolisation), avoid IIb/IIIa inhibitors and cangrelor, and monitor closely for delayed tamponade",
            best: true,
            feedback: "Brilakis's sequence for distal perforation: stop the bleeding with a proximal balloon first. Even if the balloon seals the leak, he prefers definitive treatment (embolisation, or a covered stent if the branch cannot be reached) in most cases, because the leak can reopen and cause late tamponade. Avoid IIb/IIIa inhibitors and cangrelor, and watch closely.",
          },
          {
            text: "Withdraw the wire and finish; a small blush rarely matters",
            feedback: "Tamponade from a distal perforation can develop hours after the case; it must be dealt with and monitored.",
            stateDelta: { stability: -15, flags: ["late-tamponade-risk"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The result is good. At sign out the scrub nurse asks about the antiplatelet plan and holds up the wire for the integrity check. What completes the case?",
        options: [
          {
            text: "Confirm the wire is intact and nothing is left in place, record the antiplatelet regimen and duration and that the loading dose was given before the case, and hand over the access site plan",
            best: true,
            feedback: "Oxford's sign out: documentation, equipment and sharps check, wire integrity, anything left in place, antiplatelet need and duration and loading dose status, and recovery concerns. The patient leaves only when it is done.",
          },
          {
            text: "Let the nurse finish the sign out while you start dictating the report",
            feedback: "The scrub nurse leads the sign out, but signing the patient out is also one of the cardiologist's duties in Oxford's list, including confirming that nothing but the stent remains in the circulation. Stay for it.",
            stateDelta: { stability: -3 },
          },
        ],
      },
    ],
    outcome:
      "The LAD was stented with a good result through the radial route. The patient went to the day unit with a radial band, the dual antiplatelet plan recorded, and instructions to report chest pain or dizziness.",
    outcomeVariants: [
      { flag: "vasopressor-given", text: "A vasopressor given for a false low pressure caused a brief hypertensive spike and headache, which settled." },
      { flag: "wire-lost", text: "Losing the wire behind the lesion caused a dissection with chest pain; it was rewired and stented, at the cost of a longer case and a troponin rise." },
      { flag: "late-tamponade-risk", text: "The distal blush was not treated in the lab; he was kept for observation and an echocardiogram, and his discharge was delayed." },
    ],
    learningPoints: [
      "Record a baseline and zero and level the transducer before the puncture.",
      "Run the time out with the whole team, including the contrast limit and the bailout plan.",
      "A sudden low trace with a well patient is a measurement fault until the five checks are done: valve, line, damping, obstruction, equipment.",
      "Never force a stent: watch the guide and wire tip, stop when either moves, and prepare the lesion more.",
      "Look at the wire tip whenever you have been working collimated.",
      "Sign out includes wire integrity, anything left in place and the antiplatelet plan.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-monitoring-case-stemi-night",
    title: "Primary PCI at 2 am: running the room",
    trackId: "pci-manual",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook, chapter 2 (the cardiologist, the nurse, the cardiac physiologist, the radiographer) and chapter 10 (arrhythmia, death); Brilakis, Manual of PCI, sections 2.1, 2.4, 2.9, 2.10, 3.1, 25.1 and 28.1; Härgestam et al. 2013 (closed-loop communication)",
    },
    summary:
      "An inferior STEMI at night with a tired on-call team: the brief, sedation and desaturation, ventricular fibrillation on reperfusion, giving orders in a crisis, and the debrief.",
    presentation:
      "A 58-year-old man with 90 minutes of chest pain and inferior ST elevation arrives by ambulance at 2 am. He is distressed and in pain. The on-call team has already done one primary PCI tonight.",
    findings: ["Blood pressure 108/66 mmHg, sinus rhythm 58/min, saturation 95% on room air", "ST elevation in II, III and aVF", "Right radial access planned"],
    steps: [
      {
        id: "s0",
        prompt: "The team gathers as the patient arrives. There is no formal brief at night in your unit. What do you do?",
        options: [
          {
            text: "Hold a short brief: the plan, expected problems, where he goes afterwards, and each person's role if he arrests, including who defibrillates",
            best: true,
            feedback: "Oxford's brief covers the case, expected challenges, destination and roles in an arrest or complication. At night, with a tired team, it matters more, not less.",
          },
          {
            text: "Skip it; everyone knows the routine",
            feedback: "Routines vary, and fatigue makes assumptions more dangerous. Nobody has been named to defibrillate.",
            stateDelta: { stability: -6, flags: ["no-brief"] },
          },
        ],
      },
      {
        id: "s1",
        prompt: "He is distressed and moving. He receives two small doses of sedative and opioid. A few minutes later the saturation is 86%, he is snoring, and his breathing is shallow. The chest was clear on arrival.",
        options: [
          {
            text: "Stop further sedation, give oxygen, give flumazenil and naloxone to reverse the two drugs, and keep watching the saturation",
            best: true,
            feedback: "Brilakis: desaturation may be hypoventilation from heavy sedation, but it can also be early pulmonary oedema, an artefact or another cause. His treatment for over-sedation is to stop sedating and reverse it (flumazenil for the benzodiazepine, naloxone for the opioid), with intubation for severe respiratory depression; Oxford adds oxygen for heavily sedated patients.",
          },
          {
            text: "He is still restless; give another dose of sedative",
            next: "c-resp",
            feedback: "More sedation deepens the respiratory depression.",
            stateDelta: { stability: -15, flags: ["oversedated"] },
          },
          {
            text: "Assume the probe is wrong and carry on",
            feedback: "Artefact is possible, but snoring and shallow breathing after sedation point to the patient, not the probe.",
            stateDelta: { stability: -8 },
          },
        ],
      },
      {
        id: "c-resp",
        kind: "consequence",
        prompt: "The saturation falls to 79% and he no longer responds to voice. The blood pressure is 96/60 mmHg.",
        options: [
          {
            text: "Stop sedation, support the airway and ventilation, give reversal agents, and call the anaesthetist",
            best: true,
            feedback: "This is severe respiratory depression; Brilakis's treatment is to stop sedation and reverse it, with intubation if needed.",
          },
          {
            text: "Continue with the angioplasty and treat the breathing when the vessel is open",
            feedback: "Airway and breathing come first; a hypoxic patient tolerates ischaemia and arrhythmia badly.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The RCA is occluded. As the first balloon restores flow, the monitor shows ventricular fibrillation. The physiologist calls out ‘VF’. What do you do?",
        variants: [{ flag: "no-brief", info: "Nobody was named to defibrillate at the start; the nurse and the physiologist both hesitate." }],
        options: [
          {
            text: "Keep the wire in place, tell the physiologist by name to shock now and to repeat up to three shocks if VF persists, and ask the radiographer to move the C-arm in case compressions are needed",
            best: true,
            feedback: "Oxford: immediate defibrillation within ALS; the physiologist shocks on the operator's instruction unless another person was named; the radiographer moves the C-arm for CPR. In a witnessed, monitored arrest with the defibrillator ready, the ERC 2021 ALS guideline allows up to three quick successive shocks before compressions. Brilakis: keep the wire, and expect arrhythmias after reperfusion.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull the balloon and wire out so the team can resuscitate",
            next: "c-wire-out",
            feedback: "Removing the wire throws away access to the artery you will need as soon as the rhythm is restored.",
            stateDelta: { stability: -15, flags: ["wire-removed"] },
          },
          {
            text: "Shout ‘Somebody shock him’ to the room",
            next: "c-delay",
            feedback: "An order with no name attached is the kind least likely to be acted on.",
            stateDelta: { stability: -10, flags: ["shock-delay"] },
          },
        ],
      },
      {
        id: "c-wire-out",
        kind: "consequence",
        prompt: "After one shock he is back in sinus rhythm at 82/min. The RCA has reoccluded and the wire is out of the body. What now?",
        options: [
          {
            text: "Re-engage, rewire the RCA carefully, and restore flow, with the team's roles now stated aloud",
            best: true,
            feedback: "You can recover, but you now have to cross the occlusion again; Brilakis warns that stress is when wires are pulled out by accident.",
          },
          {
            text: "Stop the procedure because he has had VF",
            feedback: "VF on reperfusion that has been treated is not a reason to abandon an occluded infarct artery.",
            stateDelta: { stability: -12 },
          },
        ],
      },
      {
        id: "c-delay",
        kind: "consequence",
        prompt: "Fifteen seconds pass while two people look at each other. The physiologist asks, ‘Do you want me to shock?’ What do you say?",
        options: [
          {
            text: "‘Yes, Sam, shock now,’ and once the shock is given, assign the remaining tasks by name",
            best: true,
            feedback: "A named instruction ends the hesitation. Assigning roles by name for the rest of the event prevents the same delay recurring.",
          },
          {
            text: "‘Whoever is nearest, please,’ and turn back to the screen",
            feedback: "Still no name, still no loop; the delay continues.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Sinus rhythm returns after one shock. Flow down the RCA is slow, and you want an intracoronary vasodilator for no-reflow; you also need the time of the shock recorded. How do you ask?",
        options: [
          {
            text: "‘Anna, nicardipine 200 micrograms intracoronary, please; read it back to me. Ben, please write down the time of the shock and keep the log.’ Wait for each to repeat it back",
            best: true,
            feedback: "Named person, drug, dose and route, check-back, confirmation: a closed loop (Härgestam). Nicardipine is Brilakis's preferred intracoronary agent for no-reflow, and 200 micrograms lies within his 100–300 microgram range (follow local protocol). Naming a scribe gives you the timeline Oxford asks you to document.",
          },
          {
            text: "‘Can someone get the drug ready and someone note the time?’",
            next: "c-double",
            feedback: "Two unaddressed requests, no check-back.",
            stateDelta: { stability: -8, flags: ["comm-error"] },
          },
        ],
      },
      {
        id: "c-double",
        kind: "consequence",
        prompt: "Two nurses each draw up the drug and both start to hand you a syringe; nobody has recorded the time of the shock. What now?",
        options: [
          {
            text: "Stop, confirm aloud which syringe you are using and discard the other, then name a scribe to reconstruct and record the timeline",
            best: true,
            feedback: "Close the loop now: one syringe, one confirmed dose, one named recorder.",
          },
          {
            text: "Give both to be sure the dose is adequate",
            feedback: "A doubled dose from a communication error is exactly the kind of harm closed-loop communication prevents.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The RCA is stented with good flow. As the trace settles, the physiologist says, ‘Twenty minutes since the heparin; ACT due soon.’ Pressure is 112/70 mmHg. What do you do?",
        options: [
          {
            text: "Thank her, ask the circulating nurse by name to check the ACT, and review the plan for the rest of the case",
            best: true,
            feedback: "The 15–20 minute ACT warning is one of the physiologist's standard call-outs; the circulating nurse supports the measurement and any heparin needed.",
          },
          {
            text: "Ignore it; the case is nearly over",
            feedback: "Even if you are about to finish, acknowledge every call-out and decide with the team whether a further ACT is needed; the warning exists so that the operator knows when to recheck the ACT or give heparin. A culture of ignored warnings is how important ones get missed.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The RCA is stented; he is stable, pain-free and ready to go to the coronary care unit. It is 3.15 am and the team is subdued after the arrest. What do you do before he leaves and before the next call?",
        options: [
          {
            text: "Complete the sign out, check that the timeline and event traces are recorded, tell the patient (and family) what happened including the arrest, and debrief the team briefly",
            best: true,
            feedback: "Oxford: sign out before the patient leaves, accurate documentation of events, candour with the patient and family, and a debrief whenever there has been a complication or a learning point.",
          },
          {
            text: "Send everyone to rest and leave the debrief and documentation until the morning",
            feedback: "Rest matters after a long night, but Oxford keeps the patient in the lab until every section of the sign out, including accurate documentation of the procedure, is complete and acted on. The record of times and events is also most accurate now. Finish the sign out and the record first, and keep the debrief short rather than skip it.",
            stateDelta: { stability: -3 },
          },
        ],
      },
    ],
    outcome: "The RCA was opened and stented. He had one episode of VF on reperfusion, treated with a single shock, and was stable on the coronary care unit.",
    outcomeVariants: [
      { flag: "oversedated", text: "Over-sedation caused a period of hypoxia that needed reversal and airway support before the PCI could continue." },
      { flag: "wire-removed", text: "Pulling the wire out during VF meant recrossing the occlusion, prolonging the ischaemic time." },
      { flag: "shock-delay", text: "An unaddressed order delayed the first shock by several seconds." },
      { flag: "comm-error", text: "Unaddressed requests led to a duplicated syringe and a gap in the event record, caught before harm." },
    ],
    learningPoints: [
      "Brief the team even at night: plan, destination and roles in an arrest, including who defibrillates.",
      "Desaturation after sedation: stop sedating, give oxygen and reverse the drugs; keep pulmonary oedema and artefact in mind.",
      "VF on reperfusion: keep the wire, instruct the physiologist by name to shock (up to three quick shocks in the monitored lab), move the C-arm for compressions if needed.",
      "Give orders to named people and wait for the check-back; name a scribe.",
      "Acknowledge every call-out, including the ACT timing warning.",
      "Finish with the sign out, the record, candour and a short debrief.",
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci", "hargestam-closed-loop-2013", "soar-erc-als-2021"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const tips: LabTip[] = [
  {
    id: "pci-mon-baseline",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Record the baseline before the puncture",
    text: "Note the ECG rhythm, rate and ST segments, the blood pressure, the saturation and the pulses at and beyond the access site. Oxford's check looks for a saturation above 96% on room air; a lower value calls for a cause, and in acute coronary syndromes oxygen is for a saturation below 90%. Without a baseline you cannot call any later change new.",
    tone: "do",
    lessonId: "pm-monitoring-watch",
    sources: [B("1.2"), B("2.2"), B("2.7"), O("ch 1: Catheter laboratory preparation")],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook", "esc-acs-2023", "hofmann-deto2x-2017"],
  },
  {
    id: "pci-mon-st-change",
    lab: "pci",
    when: { event: ["st-elevation", "chest-pain"] },
    title: "New ST change or pain: was it expected?",
    text: "Say it aloud, then ask whether the procedure explains it. Unexpected pain or ST change may be ischaemia, perforation or another complication: look at the vessel, the wire tip, the guide position and the arterial trace, including any respiratory swing.",
    tone: "caution",
    lessonId: "pm-monitoring-watch",
    sources: [B("2.1"), B("2.2"), B("2.3")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "access-mon-pulses-site",
    lab: "access",
    when: { event: ["haematoma", "bleeding"] },
    title: "Look at and feel the access site throughout",
    text: "Check the pulse at the access site and beyond it at the start and at the end of the case, and inspect and palpate the site during it, so that bleeding or a haematoma is identified early.",
    tone: "caution",
    lessonId: "pm-monitoring-watch",
    sources: [B("2.7")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-false-hypotension",
    lab: "pci",
    when: { event: ["hypotension"] },
    title: "Low pressure: is it real?",
    text: "Before treating, check five things: the Y-connector valve is closed, the line to the transducer is connected and free of air, the guide is not damping, the guide is not blocked by air, thrombus or contrast, and no bulky device is filling the guide. If all are clear, the hypotension is real: think hypovolaemia, cardiac failure (including tamponade and a guide holding the aortic valve open) or vasodilation.",
    tone: "bailout",
    lessonId: "pm-monitoring-pressure",
    sources: [B("28.1"), B("2.3")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-pulsus-paradoxus",
    lab: "pci",
    when: { event: ["perforation"] },
    title: "Watch the trace for a respiratory swing",
    text: "Pulsus paradoxus (an inspiratory fall in systolic pressure, more than 10 mmHg in tamponade) with a rising heart rate means blood in the pericardium until proven otherwise. Look at the wire tips and get an echocardiogram.",
    tone: "caution",
    lessonId: "pm-monitoring-pressure",
    sources: [B("2.3"), O("ch 5: Pericardial tamponade")],
    refs: BOOKS,
  },
  {
    id: "haemo-mon-zero-level",
    lab: "haemo",
    when: { phase: ["setup"] },
    title: "Level, then zero, then keep the landmark",
    text: "With the patient flat, set the transducer at the mid-thoracic level (Oxford's mid-chest level), defined by ESC/ERS 2022 and Kovacs as halfway between the front of the sternum and the table, and zero it by opening it to air. Re-level after any change in table height; on a right heart study a different landmark can move readings by several mmHg.",
    tone: "do",
    lessonId: "pm-monitoring-transducers",
    sources: [O("ch 2: The cardiac physiologist"), O("ch 4: Equipment")],
    refs: ["oxford-cath-handbook", "kovacs-zero-reference-2013", "esc-ph-2022"],
  },
  {
    id: "haemo-mon-fast-flush",
    lab: "haemo",
    when: { phase: ["setup", "right-heart", "left-heart"] },
    title: "Fast-flush the line before you trust a number",
    text: "A brief high-pressure flush should be followed by a couple of oscillations. None means overdamped (systolic reads low) and many means underdamped (systolic reads high); base decisions on the mean until the line is fixed. The test comes from the arterial-line literature (Michard, Kleinman), not the two manuals. Brilakis 5.6 covers the causes of damping to clear: air in the transducer, a kink, thrombus.",
    tone: "do",
    lessonId: "pm-monitoring-transducers",
    sources: [B("5.6")],
    refs: ["michard-damping-2024", "kleinman-fast-flush-1996", "brilakis-manual-pci"],
  },
  {
    id: "pci-mon-aortic-line-physiology",
    lab: "pci",
    when: { phase: ["physiology"] },
    title: "Flush and zero the aortic line before equalising",
    text: "A pressure-wire ratio is only as good as the aortic pressure. Make sure the guide and the aortic line are flushed and free of air and the transducer is zeroed and tight before you equalise with the sensor at the guide tip.",
    tone: "do",
    lessonId: "pm-monitoring-transducers",
    sources: [B("12.2"), O("ch 8: Pressure wire")],
    refs: BOOKS,
  },
  {
    id: "pci-mon-watch-both-ends",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent"] },
    title: "Watch the guide and the wire tip while you push or pull",
    text: "Keep the guide tip and the distal wire tip on screen while a balloon or stent moves, and match your force to what they do. Confirm full deflation before pulling a balloon back, and partly disengage the guide or use the independent-hand technique so it is not sucked in.",
    tone: "do",
    lessonId: "pm-monitoring-position",
    sources: [B("2.12"), B("9.7"), B("10.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-guide-backout",
    lab: "pci",
    when: { event: ["guide-backout", "stent-uncrossable", "balloon-uncrossable"] },
    title: "Guide backing out: stop pushing",
    text: "Stop advancing, pull the device back, re-engage the guide and readvance the wire. If the stent will not cross, prepare the lesion further rather than pushing harder.",
    tone: "bailout",
    lessonId: "pm-monitoring-position",
    sources: [B("9.7"), B("10.2"), B("8.10")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-check-guide-after-removal",
    lab: "pci",
    when: { phase: ["optimise"] },
    title: "After a device comes out, check the guide before injecting",
    text: "Aspirate and flush the guide, then confirm it is still coaxial: it may have backed out or dived in while the balloon came out. Only then inject.",
    tone: "do",
    lessonId: "pm-monitoring-position",
    sources: [B("9.7"), B("10.2")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-wire-tip-collimation",
    lab: "pci",
    when: { event: ["wire-distal-position"] },
    title: "Wire tip out of view: open the field",
    text: "When you collimate, the wire tip may be outside the image. Look at it at least from time to time, especially after a difficult delivery or exchange; polymer-jacketed, stiff and tapered tips in small branches cause distal perforation.",
    tone: "caution",
    lessonId: "pm-monitoring-position",
    sources: [B("2.12"), B("8.10"), B("26.4")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-keep-wire-in-crisis",
    lab: "pci",
    when: { event: ["acute-closure", "dissection"] },
    title: "In a crisis, keep the wire",
    text: "Stress is when wires are pulled out by mistake. Keep the true-lumen wire where it is and pay attention to the guide while you work out the cause.",
    tone: "bailout",
    lessonId: "pm-monitoring-position",
    sources: [B("25.1")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-time-out",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Time out with the whole team",
    text: "With everyone present, confirm that the team knows the brief and sign-in information, that the equipment is checked and ready and that the exposure is authorised. Who defibrillates should already have been agreed at the brief. This module also suggests saying the plan aloud: access, guide, anticoagulation and the bailout kit.",
    tone: "do",
    lessonId: "pm-monitoring-checklist",
    sources: [O("ch 2: The nurse"), O("ch 2: The cardiologist"), B("1.1")],
    refs: BOOKS,
  },
  {
    id: "pci-mon-sign-out",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Sign out before the patient leaves",
    text: "Check the equipment and sharps, verify every wire is intact, record anything left in place, record the antiplatelet regimen, duration and loading dose status, and state the recovery concerns. The patient stays until it is done.",
    tone: "do",
    lessonId: "pm-monitoring-checklist",
    sources: [O("ch 2: The nurse"), O("ch 2: The cardiologist")],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "pci-mon-act-warning",
    lab: "pci",
    when: { event: ["low-act"] },
    title: "Act on the ACT warning",
    text: "The physiologist tracks the time since the last heparin or ACT and warns 15–20 minutes before a check is due. Acknowledge it, and ask the circulating nurse by name to measure the ACT and prepare heparin if it is needed.",
    tone: "do",
    lessonId: "pm-monitoring-team",
    sources: [O("ch 2: The cardiac physiologist"), O("ch 2: The nurse")],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "pci-mon-dose-advice",
    lab: "pci",
    when: { event: ["high-radiation-dose"] },
    title: "High dose: take the radiographer's advice",
    text: "Change the projection, save fluoroscopy instead of acquiring cine, collimate, lower the acquisition rate, avoid magnification and use extra filtration. Brilakis usually stops when air kerma passes 5–7 Gy.",
    tone: "caution",
    lessonId: "pm-monitoring-team",
    sources: [O("ch 2: The radiographer"), B("2.5")],
    refs: BOOKS,
  },
  {
    id: "diag-mon-store-loop",
    lab: "diagnostic",
    when: { event: ["air"] },
    title: "Store the loop before you screen again",
    text: "If you see something important on fluoroscopy, such as an air bubble embolising, ask the radiographer to store the screening loop before you press the pedal again.",
    tone: "do",
    lessonId: "pm-monitoring-team",
    sources: [O("ch 6: Imaging the coronaries")],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "pci-mon-vf-roles",
    lab: "pci",
    when: { event: ["vf"] },
    alsoIn: [{ lab: "diagnostic" }],
    title: "VF: keep the wire, name the person who shocks",
    text: "Keep the wire in place and tell the physiologist by name to shock (the default unless someone else was named at the brief). In this witnessed, monitored arrest up to three quick successive shocks may be given before compressions (ERC 2021), then follow advanced life support; ask the radiographer to move the C-arm if compressions are needed, and name a scribe.",
    tone: "bailout",
    lessonId: "pm-monitoring-crisis",
    sources: [O("ch 2: The cardiac physiologist"), O("ch 2: The radiographer"), O("ch 10: Arrhythmia"), B("25.1")],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci", "soar-erc-als-2021"],
  },
  {
    id: "pci-mon-closed-loop",
    lab: "pci",
    when: { phase: ["complication"] },
    title: "Orders to a named person, then a check-back",
    text: "Give each instruction to a named team member with the drug or device, dose or size, and route; wait for it to be repeated back and confirm it. The studies Härgestam cites found that orders called into the air are less likely to be carried out than directed ones.",
    tone: "do",
    lessonId: "pm-monitoring-crisis",
    sources: [O("ch 2: The cardiologist")],
    refs: ["hargestam-closed-loop-2013", "oxford-cath-handbook"],
  },
  {
    id: "pci-mon-fatigue-defer",
    lab: "pci",
    when: { event: ["high-contrast-volume", "high-radiation-dose"] },
    title: "Tired, or out of contrast and dose: stage it",
    text: "Operator or patient fatigue, and a high contrast or radiation dose already given or expected, are reasons to stage the rest of a multivessel PCI rather than finish everything now. If you are treating a complication, secure the vessel first; staging applies to the lesions that remain.",
    tone: "caution",
    lessonId: "pm-monitoring-crisis",
    sources: [B("7.3"), B("2.9")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-sterile-cockpit",
    lab: "pci",
    when: { phase: ["wire", "stent"] },
    title: "Sterile cockpit for the critical steps",
    text: "During the parts of the case the team agreed are critical, only conversation needed for the procedure; no background talk or calls. Noise and distraction worsen outcomes.",
    tone: "do",
    lessonId: "pm-monitoring-sterile",
    sources: [B("2.10")],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-mon-wipe-wire",
    lab: "pci",
    when: { phase: ["lesion-prep", "stent", "optimise"] },
    title: "Wipe the wire and your gloves on every exchange",
    text: "Dried blood and contrast make wires and devices sticky and can carry debris into the manifold. Wipe the wire outside the guide with a wet gauze, separate multiple wires, and remove devices in small movements.",
    tone: "do",
    lessonId: "pm-monitoring-sterile",
    sources: [B("2.11"), B("9.7")],
    refs: ["brilakis-manual-pci"],
  },
];

// ---------------------------------------------------------------------------
// New references (each checked on PubMed: authors, title, journal, year, volume, pages)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "kovacs-zero-reference-2013",
    kind: "paper",
    citation: "Kovacs G, Avian A, Olschewski A, Olschewski H. Zero reference level for right heart catheterisation. Eur Respir J. 2013;42:1586–1594.",
    url: "https://doi.org/10.1183/09031936.00050713",
    note: "PMID: 23794468. Checked on PubMed: authors, title, journal, year, volume 42, issue 6, pages 1586–1594.",
    verified: true,
  },
  {
    id: "michard-damping-2024",
    kind: "paper",
    citation: "Michard F. Towards the automatic detection and correction of abnormal arterial pressure waveforms. J Clin Monit Comput. 2024;38:749–752.",
    url: "https://doi.org/10.1007/s10877-024-01152-3",
    note: "PMID: 38573369; PMCID: PMC11297833 (full text read). Checked on PubMed: author, title, journal, year, volume 38, issue 4, pages 749–752. Editorial.",
    verified: true,
  },
  {
    id: "kleinman-fast-flush-1996",
    kind: "paper",
    citation: "Kleinman B, Powell S, Gardner RM. Equivalence of fast flush and square wave testing of blood pressure monitoring systems. J Clin Monit. 1996;12:149–154.",
    url: "https://doi.org/10.1007/BF02078135",
    note: "PMID: 8823635. Checked on PubMed: authors, title, journal, year, volume 12, issue 2, pages 149–154.",
    verified: true,
  },
  {
    id: "hargestam-closed-loop-2013",
    kind: "paper",
    citation:
      "Härgestam M, Lindkvist M, Brulin C, Jacobsson M, Hultin M. Communication in interdisciplinary teams: exploring closed-loop communication during in situ trauma team training. BMJ Open. 2013;3:e003525.",
    url: "https://doi.org/10.1136/bmjopen-2013-003525",
    note: "PMID: 24148213; PMCID: PMC3808778 (full text read). Checked on PubMed: authors, title, journal, year, volume 3, issue 10, article e003525.",
    verified: true,
  },
  {
    id: "grogan-crm-2004",
    kind: "paper",
    citation:
      "Grogan EL, Stiles RA, France DJ, et al. The impact of aviation-based teamwork training on the attitudes of health-care professionals. J Am Coll Surg. 2004;199:843–848.",
    url: "https://doi.org/10.1016/j.jamcollsurg.2004.08.021",
    note: "PMID: 15555963. Checked on PubMed: authors, title, journal, year, volume 199, issue 6, pages 843–848.",
    verified: true,
  },
  {
    id: "hofmann-deto2x-2017",
    kind: "trial",
    citation: "Hofmann R, James SK, Jernberg T, et al. Oxygen therapy in suspected acute myocardial infarction. N Engl J Med. 2017;377:1240–1249.",
    url: "https://doi.org/10.1056/NEJMoa1706222",
    note: "PMID: 28844200 (DETO2X-AMI). Checked on PubMed: authors, title, journal, year, volume 377, issue 13, pages 1240–1249; abstract read.",
    verified: true,
  },
  {
    id: "soar-erc-als-2021",
    kind: "guideline",
    citation: "Soar J, Böttiger BW, Carli P, et al. European Resuscitation Council Guidelines 2021: adult advanced life support. Resuscitation. 2021;161:115–151.",
    url: "https://doi.org/10.1016/j.resuscitation.2021.02.010",
    note: "PMID: 33773825. Checked on PubMed: authors, title, journal, year, volume 161, pages 115–151. The recommendation on up to three successive shocks was read in the authorised German translation (Notf Rett Med 2021;24:406–446, PMID 34121923, PMC8185697).",
    verified: true,
  },
  {
    id: "siassakos-teamwork-2011",
    kind: "paper",
    citation: "Siassakos D, Bristowe K, Draycott TJ, et al. Clinical efficiency in a simulated emergency and relationship to team behaviours: a multisite cross-sectional study. BJOG. 2011;118:596–607.",
    url: "https://doi.org/10.1111/j.1471-0528.2010.02843.x",
    note: "PMID: 21291509. Checked on PubMed: authors, title, journal, year, volume 118, issue 5, pages 596–607; abstract read.",
    verified: true,
  },
  {
    id: "haynes-checklist-2009",
    kind: "trial",
    citation:
      "Haynes AB, Weiser TG, Berry WR, et al. A surgical safety checklist to reduce morbidity and mortality in a global population. N Engl J Med. 2009;360:491–499.",
    url: "https://doi.org/10.1056/NEJMsa0810119",
    note: "PMID: 19144931. Checked on PubMed: authors, title, journal, year, volume 360, issue 5, pages 491–499.",
    verified: true,
  },
];
