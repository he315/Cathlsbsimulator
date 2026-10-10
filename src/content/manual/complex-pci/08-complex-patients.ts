// Module cp-complex-patients: cardiogenic shock, cardiac arrest and TAVI patients (manual curriculum, track complex-pci).
// Sources: Brilakis, Manual of PCI, chapter 24 (24.1 TAVR patients, 24.2 cardiogenic shock patients) with 14.1 (when
// and what device), 14.5 (VA-ECMO insertion step by step), 14.7 (mechanical chest compression), 28.1 (hypotension),
// 20.1-20.8 (ACS planning, access, engagement, culprit), 1.5, 2.2-2.3, 3.2.5.3.3, 3.6-3.7, 4.3.5.3, 5.6.2, 6.5.4,
// 6.6.3.1, 15.1, 17.2 and 25.2.3.3; Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 8
// (primary PCI, cardiac arrest in STEMI, primary PCI in cardiogenic shock), chapter 9 (cardioversion/defibrillation,
// mechanical cardiopulmonary resuscitation, pericardiocentesis), chapter 5 (aortic stenosis, TAVI work-up), chapter 1
// (indications for coronary angiography, cardiac CT in TAVI, catheter laboratory preparation), chapter 2 (the team) and
// chapter 10 (death, contrast reaction, arrhythmia).
// Every claim is listed with its page in docs/curriculum/evidence/cp-complex-patients.md.
// Neighbouring modules: pm-support-choice (shock profiling, device choice, mechanical CPR), pm-support-devices (device
// insertion, VA-ECMO cannulation in full), pm-target (culprit identification, multivessel STEMI), pm-monitoring (team
// roles in a crisis), pm-lab-drugs (drug doses), pm-physiology (FFR in aortic stenosis), cm-patient-complications
// (arrhythmias other than arrest), hb-tavi (the TAVI procedure). Academy lessons this module builds on:
// mcs-shock-definitions, mcs-shock-management, mcs-shock-mcs-choice, mcs-ohca, mcs-lab-arrest, sh-tavi-valves,
// sh-tavi-coronary.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];
const OXFORD = ["oxford-cath-handbook"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "cp-complex-patients",
  title: "Cardiogenic shock, cardiac arrest and TAVI patients",
  stage: 5,
  summary:
    "Three groups of patients who change how a coronary procedure is run: the patient in infarct-related cardiogenic shock, from the first call to the intensive care handover; the patient who has had, or is having, a cardiac arrest, from the decision to go to the lab to defibrillation, the reversible causes and extracorporeal support; and the patient with aortic stenosis before and after a transcatheter valve, from the work-up angiogram to engaging the coronaries through a valve frame.",
  objectives: [
    "Run a cardiogenic shock case in order: recognise and stage it, call the shock team, choose access, measure the haemodynamics before the coronary injections, and limit drugs that raise myocardial oxygen demand.",
    "Find and treat the culprit only in infarct-related shock, explain the CULPRIT-SHOCK and SHOCK results, decide with the team whether support goes in before or after PCI, and plan escalation, weaning, vascular checks and staged revascularisation.",
    "Decide which resuscitated out-of-hospital arrest patients need emergency angiography, contrasting Oxford's criteria with COACT, TOMAHAWK and the 2023 ESC guideline, and adapt access and monitoring after an arrest.",
    "Manage an arrest on the table: defibrillation settings and technique, drug support, the reversible causes the lab itself produces, mechanical compression, VA-ECMO cannulation under CPR, and what to do if the patient dies.",
    "Plan the coronary part of a TAVI work-up, read pressure and opacification correctly in severe aortic stenosis, and weigh PCI before, during or after TAVI, including NOTION-3.",
    "Engage the coronary arteries through a self-expanding or balloon-expandable transcatheter valve: predict difficulty from valve type, implant depth, commissures and sinus width, choose catheters, avoid guide entrapment, and wire before full engagement when needed.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-shock-setup",
      title: "Cardiogenic shock in the lab, part 1: recognise, call, set up and measure",
      minutes: 16,
      topics: ["acs-shock-pci"],
      sources: [
        B("24.2"),
        B("14.1"),
        B("20.1"),
        B("28.1"),
        B("20.4"),
        B("3.6"),
        B("4.3"),
        O("ch 8: Primary PCI in cardiogenic shock"),
        O("ch 8: Primary PCI"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 9: Mechanical cardiopulmonary resuscitation"),
      ],
      refs: [...BOOKS, "brilakis-eckman-shock-2018", "tehrani-shock-team-2019", "basir-ncsi-2019", "scai-shock-2022", "debacker-soap2-2010", "esc-revasc-2018", "rao-acs-guideline-2025"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis frames the shock case as four jobs at once: spot the patient early, work out why the heart is failing, hold the circulation, and revascularise if that is the cause. The Academy lessons on cardiogenic shock define it and stage it, and pm-support-choice teaches the haemodynamic profiles and the device algorithm. This lesson and the next follow one patient through the lab in the order you will act, adding what each manual says at each step.",
        },
        { kind: "h", text: "Step 1: recognise it early and give it a stage" },
        {
          kind: "p",
          text: "Brilakis's point about timing is blunt: patients found before the shock becomes refractory and metabolic have a better chance of surviving. He adds two planning clues from his ACS chapter: a patient with an already reduced ejection fraction is more likely to develop shock with an ACS, and the drugs already given and the comorbidities (kidneys, diabetes, any surgery planned) shape what you can do. In the algorithm he reproduces from Tehrani and colleagues, suspicion rests on a systolic pressure below 90 mmHg for more than 30 minutes (or drugs needed to hold it), signs of end-organ hypoperfusion and a lactate above 2 mmol/L.",
        },
        {
          kind: "table",
          caption: "SCAI shock stages as a shared language for the team (summary; the Academy lesson mcs-shock-definitions has the detail)",
          head: ["Stage", "Name", "What the patient looks like"],
          rows: [
            ["A", "At risk", "A large infarct or decompensated heart failure, but blood pressure and perfusion still normal"],
            ["B", "Beginning", "Relative hypotension or tachycardia without hypoperfusion"],
            ["C", "Classic", "Hypoperfusion that needs more than fluid: a drug or a device"],
            ["D", "Deteriorating", "Failing to respond to the first measures, so support is being escalated"],
            ["E", "Extremis", "Circulatory collapse, for example ongoing CPR or ECMO"],
          ],
        },
        {
          kind: "p",
          text: "Re-stage after each intervention: the stage is a moving target, and an arrest raises the risk at any stage. Oxford's list of class 1 indications reproduces older ACC/AHA criteria, among them angiography as the first step to revascularisation in cardiogenic shock within 18 hours of its onset. That list predates the 2025 ACC/AHA/ACEP/NAEMSP/SCAI guideline for acute coronary syndromes, which brought the 2013 STEMI and 2014 NSTE-ACS guidelines up to date, so check current guidance before quoting the 18-hour figure. What does not change: Brilakis states that infarct-related shock should be revascularised, so the patient goes to the lab for angiography and treatment of the culprit.",
        },
        { kind: "h", text: "Step 2: make one call, and get consent right" },
        {
          kind: "steps",
          title: "Activating the shock pathway",
          items: [
            {
              title: "1. One number, four specialties",
              detail: "In the Tehrani algorithm a single call brings interventional cardiology, cardiac surgery, advanced heart failure and critical care together, and the patient goes to the lab or the cardiac intensive care unit. Brilakis advises every centre to write its own shock algorithm and build a dedicated team, because standard pathways organise complex care for these patients.",
            },
            {
              title: "2. Decide what the lab must do",
              detail: "Suspected infarct-related shock: right heart catheterisation, coronary angiography with revascularisation, and a look at the peripheral arteries (you will need them for devices). Suspected heart-failure shock without an infarct: right heart catheterisation and echo.",
            },
            {
              title: "3. Consent",
              detail: "Oxford warns that consent is hard when the patient is moribund or has had opiates; act in the patient's best interests, or use proxy consent where that applies. Settle resuscitation status before the case starts.",
            },
          ],
        },
        { kind: "tip", id: "pci-shock-one-call-team" },
        { kind: "h", text: "Step 3: choose the access with devices in mind" },
        {
          kind: "p",
          text: "For STEMI in general the two manuals agree on the wrist. Oxford makes radial access the default for primary PCI, citing MATRIX, RIFLE and RIVAL; Brilakis prefers it in ACS, and especially in STEMI, because earlier studies linked it with less bleeding and lower mortality, while noting that SAFARI-STEMI found no difference in outcomes. Shock is Brilakis's exception: there the femoral route may be preferred, because mechanical support is so often needed and the anatomy must be seen quickly. European guidance (the 2018 ESC/EACTS revascularisation guideline, class I, level A) makes radial the standard approach unless procedural considerations override it, and the expected need for large-bore support in shock can be such a consideration. The Academy lesson mcs-shock-management teaches the other workable plan: radial for the coronary work, with ultrasound-guided femoral access planned for the device. Either way, a femoral route for support is decided at the start, not improvised later. Two more Brilakis points tip the balance in shock: intravenous vasopressors and cardiac arrest are risk factors for radial spasm (the fixes are vasodilators, or a switch to the ulnar, the other radial or the femoral artery), and a 14 Fr microaxial pump sheath needs iliofemoral arteries over 5 mm across without severe calcification, tortuosity or obstruction.",
        },
        {
          kind: "steps",
          title: "Access in a shock case",
          items: [
            { title: "Arterial", detail: "The National Cardiogenic Shock Initiative protocol, reproduced by Brilakis, asks for femoral arterial access under direct vision with ultrasound and fluoroscopy." },
            { title: "Venous, at the same time", detail: "Femoral or internal jugular, for the pulmonary artery catheter." },
            { title: "Look at the femoral artery", detail: "Image the iliofemoral run before any large-bore device (taught in pm-support-devices). The access you choose now is the access a pump or ECMO cannula will use later." },
            { title: "If you start radially", detail: "Expect spasm and be quick to convert; do not let the wrist delay reperfusion. Brilakis's general ACS rule is to switch to femoral promptly when radial engagement is slow, since time is muscle." },
          ],
        },
        { kind: "tip", id: "access-shock-femoral-and-vein" },
        { kind: "tip", id: "mcs-largebore-angiogram-first" },
        {
          kind: "check",
          stem: "A man with an anterior STEMI arrives with BP 80/50 mmHg on noradrenaline, cold peripheries and lactate 5.2 mmol/L. Your unit is radial-first. What access plan follows the manuals?",
          options: [
            "Right radial only, with no femoral access planned until a pump is definitely needed, since radial bleeds least",
            "Guided femoral arterial access (or radial for the coronaries plus an early guided femoral sheath), and venous access",
            "Venous access only for now, leaving the choice of arterial route until after the coronary anatomy has been seen on angiography",
            "Femoral arterial access without ultrasound to save time, since the femoral pulse is still easy to find in shock",
          ],
          answer: 1,
          explanation:
            "Brilakis says femoral access may be preferred in shock because support is often needed and the anatomy must be seen fast; the shock protocol he reproduces asks for ultrasound- and fluoroscopy-guided femoral access and venous access for haemodynamics. Radial remains the general standard in ACS (Oxford; 2018 ESC/EACTS), and the Academy plan of radial coronary work with a guided femoral sheath kept for the device is also acceptable. What fails is a plan with no femoral route ready: Brilakis lists vasopressors as a risk factor for radial spasm, a late femoral puncture in a deteriorating patient costs time, and skipping ultrasound in a cold, hypotensive patient raises the chance of a bad puncture exactly where a large-bore device will go. The coronary anatomy cannot be seen without arterial access, so it cannot wait for the anatomy.",
        },
        { kind: "h", text: "Step 4: measure before you inject" },
        {
          kind: "p",
          text: "Brilakis asks for serial perfusion markers (lactate) and invasive haemodynamics, regular checks of the right ventricle (right atrial pressure and PAPi) and a cardiac power output kept above 0.6 W while the vasopressor and inotrope doses are kept from climbing. His support chapter gives the thresholds that make a right heart study useful in the lab: a wedge above 18 mmHg points to LV failure, a PAPi below 0.9 to RV failure, and a wedge above 25 mmHg with a mixed venous saturation below 50% marks a patient at high risk of pulmonary oedema and shock during the procedure. Leave the pulmonary artery catheter in place so that you can watch the pulmonary pressures during PCI.",
        },
        {
          kind: "table",
          caption: "The haemodynamic definition in the Tehrani algorithm Brilakis reproduces (Fig 24.7); if these are met, percutaneous support is considered",
          head: ["Measure", "Threshold for cardiogenic shock"],
          rows: [
            ["Fick cardiac index", "Below 1.8 L/min/m² without inotropes or vasopressors, or below 2.2 L/min/m² on them"],
            ["Pulmonary capillary wedge pressure", "Above 15 mmHg"],
            ["Cardiac power output (MAP × CO ÷ 451)", "Below 0.6 W"],
            ["PAPi ((systolic PA − diastolic PA) ÷ RA)", "Below 1.0"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Two PAPi cut-offs.** This algorithm defines shock with a PAPi below 1.0, whereas Brilakis's support chapter and the NCSI protocol use 0.9 for RV failure and weaning. Know which threshold a given protocol uses before you apply it.",
            "**After the lab, the same algorithm's intensive care bundle:** a bedside echo every day and frequent neurovascular checks for any patient on percutaneous support, repeated CPO, PAPi and lactate to follow perfusion, and a standing question of whether support should be weaned or escalated.",
          ],
        },
        {
          kind: "steps",
          title: "Before you call it shock, check the numbers are real",
          items: [
            { title: "False hypotension", detail: "Brilakis's list: an open Y-connector valve, an open or air-filled transducer connection, pressure damping (common with ostial lesions and with large guides such as 8 Fr), a catheter blocked by air, thrombus or contrast (contrast damps the trace particularly in 4 and 5 Fr catheters), and bulky equipment in the catheter. A blocked catheter that will not aspirate comes out without any injection. Side-hole guides hide damping, which is why Brilakis never uses them to engage the left main (ostial left main CTOs excepted): they can mask ischaemia until the patient collapses." },
            { title: "Iatrogenic true hypotension", detail: "An Amplatz or deeply curved extra back-up guide can prop a cusp of the aortic valve open, producing sudden regurgitation; moving the guide corrects the pressure at once." },
            { title: "Then classify", detail: "Hypovolaemia (bleeding), cardiac failure (ventricle, valve, pericardium, rhythm) or vasodilation (vagal, anaphylaxis, drugs). The right heart study sorts them: low filling pressure and output in hypovolaemia, high filling pressure and low output in pump failure (filling pressure can be low when the RV fails), and high output in vasodilation." },
          ],
        },
        { kind: "tip", id: "haemo-shock-measure-first" },
        { kind: "tip", id: "haemo-support-cpo-papi" },
        {
          kind: "check",
          stem: "Before angiography in an anterior STEMI with shock: MAP 58 mmHg, Fick cardiac output 3.0 L/min (index 1.6), PA 40/24 mmHg, RA 8 mmHg, wedge 28 mmHg, saturation normal on oxygen. What do the numbers say?",
          options: [
            "CPO about 0.39 W and PAPi 2.0: LV-dominant shock with a coping RV and no hypoxaemia",
            "CPO about 0.39 W and PAPi 0.5: RV failure, so a left-sided pump would be unable to fill",
            "CPO about 0.64 W and PAPi 2.0: not shock, so continue with drugs and no further measurement",
            "CPO about 0.39 W with a low wedge: hypovolaemia, so give fluid before any coronary injection",
          ],
          answer: 0,
          explanation:
            "CPO = 58 × 3.0 ÷ 451 ≈ 0.39 W, below 0.6 W. PAPi = (40 − 24) ÷ 8 = 2.0, well above 0.9, so the RV is generating a good pulse. A wedge of 28 mmHg is high: the left ventricle is failing. With no hypoxaemia this is the LV-dominant profile in which Brilakis's algorithm points to a left-sided microaxial pump if support is used, and in which the shock protocol he reproduces places the pump before PCI (cardiac index below 2.2 or LVEDP above 15 mmHg, with suitable anatomy, in a patient without the protocol's exclusions such as a mechanical aortic valve, known LV thrombus, active bleeding or a contraindication to anticoagulation). Hypovolaemia would give a low wedge.",
        },
        { kind: "h", text: "Step 5: drugs as a bridge, not a plan" },
        {
          kind: "list",
          items: [
            "Brilakis accepts that vasopressors and inotropes are often needed, but they raise myocardial oxygen consumption, may provoke arrhythmias and can make recovery less likely.",
            "In SOAP II, 1,679 patients with shock were randomised to dopamine or noradrenaline; dopamine caused more arrhythmias (24.1% against 12.4%), and in the 280 patients (about 17%) whose shock was cardiogenic, 28-day mortality was higher with dopamine in a subgroup analysis. Brilakis gives the cardiogenic share as 19%; the trial report gives 280 patients. He names noradrenaline as the preferred vasopressor in cardiogenic shock.",
            "Pure alpha agonists add afterload without any inotropy: Brilakis advises avoiding them in this setting.",
            "Early mechanical support can lower the drug doses needed; the decision is made with the team (next lesson). Doses are taught in pm-lab-drugs and follow local protocol.",
          ],
        },
        { kind: "tip", id: "mcs-pressor-escalation-limit" },
        {
          kind: "pitfalls",
          items: [
            "Waiting for refractory hypotension, or a lactate that keeps rising despite drugs, before calling the team: Brilakis's window is before the shock becomes refractory and metabolic, and the algorithm he reproduces activates the team once systolic pressure has been below 90 mmHg for 30 minutes or drugs are needed to hold it.",
            "Treating a damped trace as shock, or giving vasopressors for an aortic regurgitation caused by your own Amplatz guide.",
            "Starting the case without venous access, so that the support decision is made on impressions rather than CPO and PAPi.",
            "Persisting with a spastic radial artery in a patient on vasopressors while the infarct evolves.",
            "Putting the arterial sheath in a femoral artery that will not take a pump, without having looked at it.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the first set of numbers (lactate, MAP, cardiac output, CPO, PA pressures, RA, wedge, PAPi, drug doses) on the whiteboard before the first coronary injection. Every later decision in the case, support, escalation or weaning, is a comparison with that line.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Anterior STEMI with shock: obtain RA, PA and wedge pressures and a Fick cardiac output before the coronary injections; calculate CPO and PAPi; say whether the profile is LV-dominant, RV-dominant or biventricular; and list the false-hypotension causes you would exclude first.",
        },
        { kind: "video", id: "DbZ1u0KtmAE", note: "Brilakis: 24.2, PCI in cardiogenic shock (Manual of PCI chapter summary)." },
        { kind: "video", id: "uJ5kQ_pGbl0", note: "Elias Hanna: cardiogenic shock." },
        {
          kind: "keypoints",
          items: [
            "Find shock before it is refractory and metabolic; a low ejection fraction raises the risk in an ACS.",
            "Stage it (SCAI A to E) and re-stage after each intervention; arrest raises the risk at every stage.",
            "One call brings interventional cardiology, cardiac surgery, advanced heart failure and critical care.",
            "Both manuals favour radial for STEMI in general; in shock Brilakis says femoral may be preferred, and vasopressors and arrest predispose to radial spasm. Plan the femoral route for support from the start (femoral for everything, or radial coronaries with a guided femoral sheath), and place a venous sheath at the same time.",
            "Measure before injecting: CPO above 0.6 W is the target; PAPi below 0.9 means RV failure (the Tehrani definition of shock uses below 1.0); wedge above 25 with SvO2 below 50% predicts trouble.",
            "Exclude false hypotension and guide-induced aortic regurgitation before treating the number.",
            "Noradrenaline rather than dopamine; avoid pure alpha agonists; consider support early rather than adding drugs.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-shock-culprit",
      title: "Cardiogenic shock in the lab, part 2: the culprit, the support decision and what follows",
      minutes: 17,
      topics: ["acs-shock-pci"],
      sources: [
        B("24.2"),
        B("20.5"),
        B("20.7"),
        B("20.8"),
        B("14.1"),
        B("14.2"),
        B("28.1"),
        O("ch 8: Primary PCI in cardiogenic shock"),
        O("ch 8: Primary PCI in multivessel disease"),
        O("ch 9: Mechanical cardiopulmonary resuscitation"),
      ],
      refs: [
        ...BOOKS,
        "culprit-shock-2017",
        "thiele-culprit-shock-1y-2018",
        "shock-1999",
        "hochman-shock-longterm-2006",
        "licordari-esc-acs-2024",
        "basir-ncsi-2019",
        "brilakis-eckman-shock-2018",
        "danger-shock-2024",
        "iabp-shock-ii-2012",
        "ecls-shock-2023",
      ],
      blocks: [
        {
          kind: "p",
          text: "With the patient measured and the team called, the next hour decides most of the outcome: which artery caused this, whether to treat anything else, whether the heart needs a device before or after the stent, and what has to happen before the patient leaves the lab. Brilakis's five ingredients (early diagnosis, a pulmonary artery catheter, culprit-only revascularisation, a support decision tailored to need and local expertise, and expert care afterwards) give the frame.",
        },
        { kind: "h", text: "Step 6: why revascularise at all" },
        {
          kind: "p",
          text: "Brilakis states that revascularisation should be provided in infarct-related shock because it improves mortality. The evidence is the SHOCK trial: 302 patients with shock from LV failure after infarction were randomised to emergency revascularisation (by angioplasty or bypass surgery) or initial medical stabilisation. Mortality at 30 days was not significantly different (46.7% against 56.0%), but at 6 months it was lower with revascularisation (50.3% against 63.1%), and the long-term follow-up kept the gain: at 6 years 32.8% of the revascularised group were alive against 19.6%. Surgery belongs in the plan from the start, which is one reason the surgeon is in the shock team.",
        },
        { kind: "h", text: "Step 7: engage in an order that keeps the options open" },
        {
          kind: "p",
          text: "Brilakis's STEMI engagement sequence (taught in pm-target) matters more in shock. If the RCA is stented before the left coronary has been seen, a patient with left main or multivessel disease may turn out to need support or to be better served by surgery; in that situation balloon angioplasty alone of the culprit can be the wiser first step. Brilakis notes that engaging the suspected culprit straight away with a guide brings reperfusion forward by 8–13 minutes of door-to-balloon time; his sequence keeps that gain in an anterior infarct and protects the information in the others.",
        },
        { kind: "tip", id: "diag-stemi-engagement-order" },
        { kind: "h", text: "Step 8: find the culprit, and only the culprit" },
        {
          kind: "steps",
          title: "Clues that identify the culprit (Brilakis 20.7)",
          items: [
            { title: "Angiography", detail: "An occlusion with thrombus is the easy case. Otherwise: slow antegrade flow, luminal haziness that suggests thrombus, collateral flow, and occluded distal branches that suggest embolism." },
            { title: "The ECG", detail: "Match the territory to the leads." },
            { title: "The ventricle", detail: "A left ventriculogram or a transthoracic echo shows the hypokinetic wall. In shock, echo also looks for the mechanical complications (free wall rupture, ventricular septal defect, papillary muscle rupture) that make the problem surgical; Brilakis's complications chapter sends myocardial rupture for emergency surgery. A mechanical complication also takes the patient out of the NCSI pump protocol, which lists it among its exclusions." },
            { title: "Intracoronary imaging", detail: "OCT shows plaque rupture or erosion and thrombus when angiography cannot decide." },
            { title: "A wire that will not cross", detail: "It may be in a chronic occlusion rather than the culprit. Review the films (and old ones), correlate with the ECG, and use imaging; thrombus or ulceration points to the culprit. Thrombus aspiration can show the vessel beyond the occlusion and whether the wire sits in a side branch or the main vessel." },
            { title: "No clear culprit", detail: "Sometimes there is none, because the symptoms were not ischaemic (the ventriculogram may suggest takotsubo cardiomyopathy instead). Sometimes the culprit is invisible on angiography, and OCT can find it. If it stays unclear, a later MRI can show where the myocardium was injured and so which artery was responsible." },
          ],
        },
        {
          kind: "p",
          text: "About two thirds of patients with infarct-related shock have multivessel disease (Brilakis). A few have more than one culprit, and each true culprit is treated. Everything else waits.",
        },
        { kind: "tip", id: "pci-shock-each-true-culprit" },
        { kind: "tip", id: "pci-shock-chronic-not-culprit" },
        {
          kind: "table",
          caption: "CULPRIT-SHOCK: culprit-only PCI (with optional staged PCI) against immediate multivessel PCI, 706 patients",
          head: ["Outcome", "Culprit only", "Immediate multivessel", "Reading"],
          rows: [
            ["Death or renal replacement therapy at 30 days (primary)", "45.9%", "55.4%", "Relative risk 0.83; significant"],
            ["Death at 30 days", "Lower", "Higher", "Relative risk 0.84; significant"],
            ["Renal replacement therapy at 30 days", "Lower", "Higher", "Relative risk 0.71; not significant"],
            ["Death at 1 year", "50.0%", "56.9%", "Relative risk 0.88; the confidence interval crossed 1"],
            ["Repeat revascularisation at 1 year", "32.3%", "9.4%", "The price of staging"],
            ["Rehospitalisation for heart failure at 1 year", "5.2%", "1.2%", "Also higher with culprit only"],
          ],
        },
        {
          kind: "p",
          text: "Both manuals recommend culprit-only PCI at presentation on the basis of CULPRIT-SHOCK; Brilakis adds that the remaining lesions can be treated at a staged procedure. Note how the 30-day benefit arose: the relative risk of death alone was 0.84 (significant), whereas renal replacement therapy alone did not differ significantly (relative risk 0.71, confidence interval 0.49 to 1.03). The 2023 ESC guideline makes culprit-only PCI in shock a class I recommendation and staged non-culprit PCI a class IIa (level C) one. No time window is set for the staged procedure after shock; it is timed to recovery.",
        },
        { kind: "tip", id: "pci-shock-culprit-only" },
        {
          kind: "check",
          stem: "Anterior STEMI in shock. The proximal LAD culprit is stented with TIMI 3 flow. The RCA has a 90% stenosis and the circumflex a chronic occlusion filled by collaterals. Lactate is still 4.8 mmol/L. What do you do with the other two arteries?",
          options: [
            "Stent the RCA now, because a second territory improves perfusion, and leave the occluded circumflex",
            "Stent the RCA and attempt the circumflex occlusion now, since complete revascularisation lowers deaths",
            "Measure FFR in the RCA now and stent it only if the value is 0.80 or less, leaving the occlusion alone",
            "Stop after the culprit, manage the shock and plan any RCA treatment later once the patient has recovered",
          ],
          answer: 3,
          explanation:
            "CULPRIT-SHOCK tested and rejected the idea that treating more arteries in shock improves perfusion: death or renal replacement therapy at 30 days was lower with culprit-only PCI. The manuals and the 2023 ESC guideline recommend culprit-only PCI acutely, and Brilakis and the guideline allow staging later. FFR depends on coronary afterload and may be inaccurate in shock (Brilakis), so it is not a basis for an immediate decision. A chronic occlusion is not the culprit and is not attempted during a shock procedure.",
        },
        { kind: "h", text: "Step 9: support before or after the stent" },
        {
          kind: "p",
          text: "Brilakis's ingredient 4 is a decision, not a device: support before or after PCI, chosen by the haemodynamic need and what the centre can provide, with right heart data and input from heart failure specialists, surgeons and intensivists. He is candid that data showing better outcomes with support in shock are limited. Oxford adds the patient-level questions: age, comorbidity, neurological state, the prospect of long-term survival and the expected quality of life, decided case by case. The device algorithm and the trial evidence (IABP-SHOCK II, ECLS-SHOCK, DanGer Shock) are taught in pm-support-choice; here is how the timing question looks in the lab.",
        },
        {
          kind: "table",
          caption: "Timing of support in the protocol Brilakis reproduces and in the trials",
          head: ["Source", "What it does", "Caveat"],
          rows: [
            ["National Cardiogenic Shock Initiative (NCSI) protocol", "Measure Fick cardiac index or LVEDP first; with LVEDP above 15 mmHg or index below 2.2 L/min/m², and suitable anatomy, insert the microaxial pump before PCI; its quality targets include a door-to-support time under 90 minutes", "One network's single-arm protocol (171 patients in the update, 72% survival to discharge), with no control group"],
            ["DanGer Shock", "Microaxial pump plus standard care against standard care in STEMI shock, with the pump placed before PCI; lower 180-day mortality, more complications", "Excluded comatose survivors of out-of-hospital arrest; not a licence for every shock patient"],
            ["IABP-SHOCK II and ECLS-SHOCK", "Routine balloon pumping and routine early VA-ECMO did not lower 30-day mortality", "Oxford: routine balloon pumping in infarct-related shock is not recommended"],
            ["Oxford on percutaneous support devices", "Data are still scarce; compared with the balloon pump they have not improved 30-day survival significantly", "No recommendation for routine use; decide case by case"],
            ["Brilakis on the evidence and on VA-ECMO", "No randomised trial has shown lower in-hospital mortality with any support device; VA-ECMO keeps the body perfused but raises LV end-diastolic pressure and volume, and so myocardial oxygen demand", "A microaxial pump is often left in during VA-ECMO to vent the LV (pm-support-choice)"],
          ],
        },
        {
          kind: "table",
          caption: "Who the NCSI protocol applies to (Brilakis Fig 24.8)",
          head: ["Part of the protocol", "Content"],
          rows: [
            ["Inclusion: the infarct", "Acute MI, STEMI or NSTEMI: ischaemic symptoms with ECG or biomarker evidence"],
            ["Inclusion: the shock", "Hypotension below 90/60 mmHg, or drugs needed to keep the systolic pressure above 90 mmHg, with end-organ hypoperfusion (cool extremities, oliguria or lactic acidosis)"],
            ["Exclusion: arrest and brain", "Anoxic brain injury; an unwitnessed out-of-hospital arrest; any arrest without return of circulation within 30 minutes"],
            ["Exclusion: other causes of shock", "Septic, anaphylactic, haemorrhagic or neurological shock; non-ischaemic causes such as pulmonary embolism, pneumothorax, myocarditis or tamponade; mechanical complications of the infarct"],
            ["Exclusion: device and bleeding", "A balloon pump placed before the microaxial pump; active bleeding; recent major surgery; known LV thrombus; a mechanical aortic valve; a contraindication to intravenous anticoagulation; a patient who did not undergo revascularisation"],
            ["Quality measures", "Pump placed before PCI; door to support under 90 minutes; TIMI 3 flow; right heart catheterisation; weaning off vasopressors and inotropes; CPO kept above 0.6 W; a survival-to-discharge goal above 80%"],
          ],
        },
        { kind: "tip", id: "mcs-shock-support-before-pci" },
        { kind: "h", text: "Step 10: during and after the PCI" },
        {
          kind: "steps",
          items: [
            { title: "Restore flow", detail: "The NCSI protocol aims for TIMI 3 flow and, if it cannot be achieved, considers intracoronary vasodilators. Its wording covers all major epicardial arteries other than chronic occlusions; where that seems to invite immediate stenting of non-culprit lesions, follow CULPRIT-SHOCK and the guideline, which both manuals endorse." },
            { title: "No pressure wire to decide", detail: "Brilakis: FFR depends on coronary afterload, so in shock it may not show the true severity of a stenosis." },
            { title: "Recalculate at the end", detail: "CPO and PAPi after PCI decide whether to wean drugs, add right-sided support or escalate (the NCSI branches are taught in pm-support-choice)." },
            { title: "Check the leg before you leave", detail: "The NCSI protocol asks for a detailed vascular examination before the patient leaves the lab, including a femoral angiogram and Doppler of the cannulated limb, with external bypass if needed." },
            { title: "Hand over a plan", detail: "Intensive care: daily haemodynamic and vascular assessment, watch for haemolysis and adjust the pump position. Consider removing the pump only once the patient is off all inotropes and vasopressors, with CPO above 0.6 W and PAPi above 0.9. Without myocardial recovery in 3–5 days, refer to an LVAD or transplant centre, or consider palliative care if the patient is not a candidate. Write down which lesions remain and that they will be staged after recovery." },
          ],
        },
        { kind: "tip", id: "pci-support-ffr-in-shock" },
        { kind: "tip", id: "mcs-manage-post-pci-escalation" },
        {
          kind: "check",
          stem: "After culprit PCI with a microaxial pump in place: MAP 70 mmHg, cardiac output 4.6 L/min, PA 30/22 mmHg, RA 16 mmHg, on low-dose noradrenaline. What do the numbers suggest, and what does the protocol Brilakis reproduces advise?",
          options: [
            "CPO about 0.71 W and PAPi 0.5: the RV may be failing; consider right-sided support",
            "CPO about 0.71 W and PAPi 0.5: everything is on target, so stop the noradrenaline and remove the pump now",
            "CPO about 0.51 W and PAPi 1.4: the LV is still failing, so add more left-sided support or plan a transfer",
            "CPO about 0.71 W and PAPi 0.5: increase the pump speed, because a low PAPi means the pump is under-filling the aorta",
          ],
          answer: 0,
          explanation:
            "CPO = 70 × 4.6 ÷ 451 ≈ 0.71 W (above 0.6). PAPi = (30 − 22) ÷ 16 = 0.5 (below 0.9), with a high RA pressure. In the NCSI branches, CPO above 0.6 with PAPi below 0.9 means considering right-sided support when RV dysfunction is suspected clinically. Removal needs PAPi above 0.9 as well as CPO above 0.6 and freedom from all inotropes and vasopressors. A left-sided pump depends on the RV to fill it, so speeding it up does not treat RV failure.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stenting the RCA in a non-anterior infarct before the left coronary has been seen, then discovering left main disease that needed surgery or support.",
            "Treating every severe lesion at the first sitting because 'the heart needs all the blood it can get'.",
            "Spending contrast and time on a chronic occlusion that the wire found instead of the culprit.",
            "Using FFR in shock to decide on non-culprit lesions.",
            "Leaving the lab without CPO and PAPi recalculated, without a femoral angiogram of the cannulated leg, or without a written staging plan.",
            "Starting a device with no exit: the protocol's 3–5 day review and referral is part of the plan from the first day.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the culprit aloud before you wire it, and say the strategy aloud after it is treated: 'culprit done, nothing else today, staged after recovery'. In a shock case, with drugs, devices and many people in the room, a spoken plan is what stops a second stent going in out of momentum.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Open the LCx STEMI scenario and treat it as a shock case: before wiring, name the culprit from the angiogram and the ECG territory and state the other lesions you will leave; after stenting, state the TIMI flow you accept and what you would give if flow were slow.",
        },
        {
          kind: "sim",
          sim: "impella",
          task: "With the pump placed before PCI for LV-dominant shock, run the post-PCI review: calculate CPO and PAPi from the console and pressure readings, and state whether the next step is weaning, right-sided support or escalation.",
        },
        { kind: "video", id: "x9bB5Hab9A0", note: "Brilakis case 27: STEMI and shock (PCI Manual online case)." },
        { kind: "video", id: "k_WRU_1jU60", note: "Elias Hanna: STEMI primary PCI technical tips, including STEMI with shock." },
        { kind: "video", id: "4HsjKW4hA1c", note: "Elias Hanna: cardiogenic shock, tips and updates." },
        {
          kind: "keypoints",
          items: [
            "Revascularisation in infarct-related shock saves lives (SHOCK: survival benefit at 6 months and still present at 6 years); surgery is part of the plan.",
            "Engage so that the left anatomy is known before the RCA is stented; balloon-only is an option when surgery or support may follow.",
            "Culprit clues: occlusion with thrombus, slow flow, haziness, collaterals, distal embolic occlusions, ECG, ventriculogram or echo, OCT. A wire that will not cross may be in a chronic occlusion.",
            "Culprit only acutely (CULPRIT-SHOCK; 2023 ESC class I), staged non-culprit PCI later (IIa C), timed to recovery. Treat each true culprit if there is more than one.",
            "Support before or after PCI is a team decision on haemodynamics, local expertise and the patient's prospects; the NCSI protocol and DanGer Shock place the pump before PCI.",
            "No FFR in shock; recalculate CPO and PAPi after PCI; femoral angiogram and Doppler of the cannulated leg before leaving.",
            "Remove the microaxial pump only when off all inotropes and vasopressors, with CPO above 0.6 W and PAPi above 0.9 (NCSI); refer on if there is no recovery in 3–5 days.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-ohca",
      title: "After an out-of-hospital arrest: who goes to the lab, and how the case changes",
      minutes: 14,
      topics: ["acs-cardiac-arrest"],
      sources: [
        O("ch 8: Cardiac arrest in STEMI"),
        O("ch 8: Primary PCI"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 1: Catheter laboratory preparation"),
        B("24.2"),
        B("20.1"),
        B("20.2"),
        B("4.3"),
        B("14.1"),
        B("17.2"),
      ],
      refs: [...BOOKS, "coact-2019", "tomahawk-2021", "licordari-esc-acs-2024", "esc-acs-2023", "basir-ncsi-2019", "danger-shock-2024", "erc-esicm-post-resuscitation-2021"],
      blocks: [
        {
          kind: "p",
          text: "The resuscitated patient arrives intubated or awake, with an ECG recorded minutes after shocks and adrenaline, and someone has to decide whether the next stop is the lab, the scanner or intensive care. The Academy lesson mcs-ohca explains why the brain, not the coronary anatomy, usually decides the outcome. This lesson sets out the two manuals' advice, what has changed since, and what an arrest changes once the patient is on the table.",
        },
        { kind: "h", text: "Step 1: sort the patient by the ECG and the circulation" },
        {
          kind: "table",
          caption: "Who needs emergency angiography after a resuscitated out-of-hospital arrest",
          head: ["Situation", "Oxford", "Since the manuals"],
          rows: [
            ["ST elevation after return of spontaneous circulation", "Primary PCI is the strategy of choice; emergency angiography whether or not the patient is responsive", "2023 ESC: a primary PCI strategy is recommended for resuscitated arrest with persistent ST elevation (class I, level B)"],
            ["No ST elevation, haemodynamically stable", "Oxford's guideline list also sends patients with chest pain before the arrest or known coronary disease for emergency angiography, but it says delaying angiography until recovery is reasonable in survivors without ST elevation in whom infarction is suspected, with COACT as its further reading", "2023 ESC: routine immediate angiography is not recommended in this group (class III, level A), based on COACT and TOMAHAWK"],
            ["No ST elevation, but shock, ongoing ischaemia or electrical instability", "Not separately addressed in the arrest section", "Urgent angiography is reasonable when an acute coronary occlusion looks likely, decided case by case with the team (Academy lesson mcs-ohca); COACT and TOMAHAWK studied stable patients, so they do not answer this question, and shock has its own pathway (previous lessons)"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's chapter on indications adds a broader point: the older ACC/AHA class 1 indications for coronary angiography it reproduces include patients resuscitated from sudden cardiac death and those with sustained VT or non-sustained polymorphic VT. That is an indication for angiography at some stage, not a statement about timing; the timing is what the table above and the trials address.",
        },
        {
          kind: "table",
          caption: "The two trials behind the change",
          head: ["Trial", "Patients", "Result"],
          rows: [
            ["COACT", "552 patients resuscitated from out-of-hospital arrest without signs of STEMI; immediate angiography or angiography delayed until after neurological recovery", "Alive at 90 days: 64.5% immediate against 67.2% delayed, no significant difference; target temperature was reached later with immediate angiography (median 5.4 against 4.7 hours)"],
            ["TOMAHAWK", "554 patients resuscitated from out-of-hospital arrest of possible coronary origin, no ST elevation after resuscitation; immediate angiography or intensive care first with delayed or selective angiography", "Death at 30 days: 54.0% against 46.0% (hazard ratio 1.28, confidence interval 1.00 to 1.63); death or severe neurological deficit was more frequent with immediate angiography (64.3% against 55.6%)"],
          ],
        },
        { kind: "tip", id: "diag-ohca-ecg-sorts" },
        {
          kind: "check",
          stem: "A 63-year-old was resuscitated from VF arrest at home. He had chest pain the day before. After return of circulation he is haemodynamically stable on no drugs, intubated, with no ST elevation on a repeat ECG. What does current guidance support?",
          options: [
            "Emergency angiography now, because Oxford lists chest pain before the arrest as an indication",
            "Intensive care first, with angiography delayed or selective, since routine immediate angiography did not help this group",
            "Emergency angiography now, because only patients who are responsive can wait for the lab",
            "No angiography at any stage, because COACT and TOMAHAWK showed coronary disease is not the cause",
          ],
          answer: 1,
          explanation:
            "Oxford's list predates TOMAHAWK and the 2023 ESC guideline; Oxford itself already considered delay reasonable without ST elevation. In stable patients without ST elevation, immediate angiography did not improve survival in COACT or TOMAHAWK, and the 2023 ESC guideline advises against routine immediate angiography (class III). The trials did not show that coronary disease is irrelevant: angiography was delayed or selective, not abandoned. Responsiveness is not the criterion; Oxford sends unresponsive survivors with ST elevation to the lab too.",
        },
        { kind: "h", text: "Step 2: before the lab, gather the arrest history" },
        {
          kind: "steps",
          items: [
            { title: "How the arrest went", detail: "Witnessed or not, bystander CPR, first rhythm, number of shocks, time to return of circulation. The shock protocol Brilakis reproduces excludes patients with anoxic brain injury, an unwitnessed out-of-hospital arrest, or any arrest without return of circulation within 30 minutes; DanGer Shock excluded patients who were comatose after an out-of-hospital arrest. The arrest history therefore changes the support decision as well as the prognosis. These exclusions belong to the pump protocol and the pump trial; do not extend them to every shock trial." },
            { title: "The usual STEMI planning", detail: "Brilakis's list: previous revascularisation (stent thrombosis, graft anatomy), cardiac function, comorbidities and the drugs already given." },
            { title: "Consent and status", detail: "Oxford: if the patient cannot consent, act in their best interests; agree resuscitation status for the procedure." },
            { title: "What happens after the lab", detail: "Temperature control and neurological prognostication follow post-resuscitation guidance (Academy lesson mcs-ohca); in COACT, target temperature was reached later with immediate angiography." },
          ],
        },
        { kind: "h", text: "Step 3: on the table, plan for a second arrest" },
        {
          kind: "steps",
          title: "How an arrest changes the procedure",
          items: [
            { title: "Pads on, roles named", detail: "Oxford's team preparation includes deciding who will defibrillate if VF occurs (by default the cardiac physiologist, on the operator's instruction). Brilakis advises pads for left main PCI because ventricular arrhythmia must be treated promptly; the same reasoning applies after an arrest." },
            { title: "Access", detail: "Radial spasm is more likely after an arrest or on vasopressors (Brilakis), and support may be needed; femoral access under ultrasound keeps the device route open. If you work radially, place a guided femoral sheath early or convert at the first sign of spasm." },
            { title: "Expect rhythm trouble", detail: "Brilakis: ACS patients are more prone to arrhythmias and haemodynamic instability; an accelerated idioventricular rhythm with ST resolution often signals reperfusion rather than a new problem." },
            { title: "Keep the compression device and support close", detail: "Mechanical CPR and VA-ECMO are the next steps if the patient arrests again without prompt recovery (next lesson, which also covers the injuries compression devices cause)." },
          ],
        },
        { kind: "tip", id: "access-arrest-radial-spasm" },
        {
          kind: "check",
          stem: "A woman resuscitated from VF has persistent inferior ST elevation and is on noradrenaline. The right radial pulse is weak and she arrested 40 minutes ago. Which plan is most consistent with both manuals?",
          options: [
            "Right radial puncture with extra sedation and nitrate, persisting until it works, with no femoral route planned",
            "Guided femoral access, or radial plus an early femoral sheath; a venous sheath; pads on; one person named to shock",
            "Defer angiography until she is off vasopressors, since arrest survivors who are not yet stable should wait for the lab",
            "Left radial access only, because spasm after an arrest affects the right radial artery but spares the left",
          ],
          answer: 1,
          explanation:
            "Persistent ST elevation after resuscitation means primary PCI. Brilakis lists vasopressors and cardiac arrest as risk factors for radial spasm, and in shock says femoral access may be preferred for speed and possible support; if the coronaries are done radially, a guided femoral sheath placed early keeps the support route open (Academy mcs-shock-management). A venous sheath allows haemodynamic measurement, and Oxford's preparation names who defibrillates. Deferral applies to stable patients without ST elevation, not to this patient. Nothing in the manuals limits spasm to one arm.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading the first ECG after shocks and adrenaline as definitive; repeat it before deciding.",
            "Taking every stable resuscitated patient without ST elevation straight to the lab because of a history of chest pain.",
            "Assuming that a comatose survivor fits the evidence for a microaxial pump: the NCSI protocol excluded anoxic brain injury, unwitnessed out-of-hospital arrests and return of circulation beyond 30 minutes, and DanGer Shock excluded patients comatose after an out-of-hospital arrest.",
            "Fighting a spastic radial artery in a patient on vasopressors.",
            "Starting without pads attached and without a named person to shock.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask the paramedics three numbers before the patient leaves the trolley: minutes to the first shock, minutes to return of circulation, and the dose of adrenaline given. Those numbers shape the ECG you are looking at, the support you can offer and the conversation with the family.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Resuscitated inferior STEMI: choose femoral access, image the left coronary first with a diagnostic catheter, then engage the RCA with a JR4 for the culprit; check the pressure trace before every injection and state who will defibrillate if VF recurs.",
        },
        { kind: "video", id: "YKYwh9ZUbHg", note: "Elias Hanna: cardiac arrest." },
        {
          kind: "keypoints",
          items: [
            "Persistent ST elevation after resuscitation: primary PCI, responsive or not (Oxford; 2023 ESC class I).",
            "No ST elevation and stable: routine immediate angiography is not recommended (2023 ESC class III), after COACT (no survival difference) and TOMAHAWK (no benefit, numerically more deaths).",
            "Oxford's broader list (chest pain before arrest, known coronary disease) predates TOMAHAWK and the 2023 ESC guideline; Oxford already cites COACT and allows delay without ST elevation.",
            "Arrest history matters for support: NCSI excluded anoxic brain injury, unwitnessed out-of-hospital arrest and arrest without return of circulation within 30 minutes; DanGer Shock excluded patients comatose after out-of-hospital arrest.",
            "On the table: pads on, a named defibrillator operator, femoral access favoured, and a plan for a second arrest.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-lab-arrest",
      title: "Arrest on the table: shocks, causes, extracorporeal support and afterwards",
      minutes: 18,
      topics: ["acs-cardiac-arrest"],
      sources: [
        O("ch 9: Cardioversion/defibrillation"),
        O("ch 10: Arrhythmia"),
        O("ch 10: Death"),
        O("ch 10: Contrast reaction"),
        O("ch 9: Pericardiocentesis"),
        O("ch 9: Mechanical cardiopulmonary resuscitation"),
        O("ch 2: The cardiologist"),
        O("ch 2: The cardiac physiologist"),
        O("ch 2: The radiographer"),
        O("ch 6: Common pitfalls"),
        B("14.1"),
        B("14.5"),
        B("14.7"),
        B("28.1"),
        B("3.2"),
        B("3.6"),
        B("3.7"),
        B("6.5"),
        B("15.1"),
        B("25.1"),
        B("25.2"),
      ],
      refs: [...BOOKS, "soar-erc-als-2021", "rcuk-als-2021", "yadav-cath-lab-arrest-2018", "patton-rivera-nirs-ecmo-2018"],
      blocks: [
        {
          kind: "p",
          text: "An arrest in the lab is witnessed, monitored and very often caused by something on the screen: a catheter in the wrong place, air, a closed artery, blood in the pericardium. That is why it is survivable, and why the operator's job is both to resuscitate and to find the cause. The roles in a crisis are taught in pm-monitoring and mechanical compression in pm-support-choice; this lesson follows the arrest from the first beat of VF to extracorporeal support and, if it comes to it, to the conversation afterwards.",
        },
        { kind: "h", text: "Step 1: be ready before it happens" },
        {
          kind: "list",
          items: [
            "**At the team brief**, agree who shocks. Oxford makes the cardiac physiologist responsible for delivering the shock on the operator's instruction unless the brief named someone else, and for checking the defibrillator, pacing box and resuscitation trolley (the trolley daily, against a checklist).",
            "**The radiographer** moves the C-arm so that compressions can start.",
            "**The operator** leads the management of the arrest in Oxford's description of the cardiologist's role. Where a second senior clinician is available, the Academy lesson mcs-lab-arrest gives the leader role to someone who is not scrubbed, so that the operator can concentrate on treating the cause; agree which model your lab uses at the brief.",
            "**The wire stays.** Brilakis's first step in acute vessel closure is to keep a true-lumen wire where it is, because losing it can be catastrophic; apply the same rule to an arrest that happens during PCI.",
            "**Pads** are worth placing before high-risk work (Brilakis, for left main PCI).",
            "**Watch the basics**: Brilakis's monitoring list ends with VF, and his advice before and after every injection is to look at the pressure waveform and the ECG.",
          ],
        },
        { kind: "tip", id: "pci-mon-vf-roles" },
        { kind: "h", text: "Step 2: shock correctly" },
        {
          kind: "table",
          caption: "Defibrillation and cardioversion in the lab (Oxford chapter 9; typical settings, follow your device and local protocol)",
          head: ["", "VF or pulseless VT", "VT with a pulse, poorly tolerated, or an atrial arrhythmia or SVT needing cardioversion"],
          rows: [
            ["Mode", "Unsynchronised, as soon as possible", "Synchronised to the R wave, under intravenous benzodiazepine sedation or general anaesthesia"],
            ["Energy", "High from the start: 150–200 J biphasic or 200–360 J monophasic", "Poorly tolerated VT: 200–360 J or the biphasic equivalent. Stable arrhythmias: Oxford's usual starting energies are 200 J monophasic or 150 J biphasic"],
            ["Check before firing", "Pads on the sternum and over the apex, leads firmly connected", "Connect the defibrillator's ECG leads and choose the lead with the tallest QRS; the sync marker must sit on the R wave, not the T wave (change lead if it does not)"],
            ["Technique", "Shock without delay; nobody touching the patient", "With hand-held paddles over gel pads, press firmly (Oxford gives 8–12 kg): lower thoracic impedance makes cardioversion succeed significantly more often. Self-adhesive pads are not pressed on; make sure nobody touches the patient during the shock"],
            ["If it fails", "Check the settings and consider another defibrillator; amiodarone 300 mg IV; correct potassium and magnesium", "Repeat; drugs or overdrive pacing (taught in cm-patient-complications)"],
          ],
        },
        {
          kind: "steps",
          title: "VF on the table",
          items: [
            { title: "1. Call it and shock", detail: "In a witnessed, monitored arrest with pads on, the 2021 ERC adult ALS guideline allows up to three quick successive shocks before compressions start. Pulseless VT is treated the same way as VF." },
            { title: "2. Then follow the ALS algorithm", detail: "If VF persists, start compressions and continue the algorithm. A mechanical compression device frees hands (pm-support-choice), but both manuals add cautions: Brilakis warns of rib fractures and even cardiac laceration, and Oxford notes that American and European guidelines do not recommend routine mechanical CPR because outcome data are limited, listing organ injury, sternal and rib fractures, pauses in compressions while the device is fitted, and the device slipping during use. Drugs: in the 2021 ERC algorithm for a shockable rhythm, adrenaline 1 mg IV is given after the third shock and then every 3–5 minutes, amiodarone 300 mg IV after three shocks and a further 150 mg after five; when three stacked shocks opened the arrest, they count as the first shock for the timing of the first adrenaline. Brilakis gives the same adrenaline dose and interval, and amiodarone 300 mg IV push for VF followed by a maintenance infusion of 1 mg per minute for 6 hours (do not confuse that maintenance infusion with the bolus timings of the arrest algorithm); Oxford gives amiodarone 300 mg IV for VF resistant to shocks. These are typical doses; follow the current resuscitation guideline and local protocol." },
            { title: "3. Keep the wire", detail: "Do not pull the wire out of the artery during the arrest; you will need it to treat the cause (Brilakis's first rule in acute vessel closure)." },
            { title: "4. A conscious patient who starts to lose output", detail: "Intracoronary adenosine can trigger torsades or VF, usually after a pause (R on T) but sometimes without one. Brilakis has the patient keep coughing hard while the defibrillator charges, because repeated coughs can sustain cerebral perfusion for long enough to stay awake until the shock. Prevention is as for adenosine heart block: give it slowly and avoid high doses in the RCA. Papaverine, an alternative hyperaemic agent, can also cause VF." },
            { title: "5. Resistant arrhythmias", detail: "Oxford describes internal cardioversion through a balloon flotation catheter (one shocking coil in the left pulmonary artery, one in the right atrium, with a pace-sense electrode lying in the RV) for arrhythmias that resist external shocks. Brilakis adds that VA-ECMO may be needed for refractory arrhythmias." },
          ],
        },
        { kind: "tip", id: "pci-arrest-defib-settings" },
        { kind: "tip", id: "diag-vf-shock-then-amiodarone" },
        { kind: "tip", id: "pci-arrest-adenosine-cough" },
        {
          kind: "check",
          stem: "During a diagnostic study the patient develops VF straight after an RCA injection. Pads are on. Pressing the shock button twice has produced no discharge; the physiologist sees that the defibrillator is in synchronised mode. What now?",
          options: [
            "Switch to unsynchronised mode and shock again at high energy, then continue ALS if VF persists",
            "Leave the setting unchanged and give amiodarone 300 mg before any further shock",
            "Start compressions and wait two full minutes before any further attempt at defibrillation",
            "Lower the energy to 50 J to avoid myocardial injury from repeated high-energy shocks",
          ],
          answer: 0,
          explanation:
            "Synchronisation times the shock to the R wave, which is why Oxford reserves it for cardioversion of organised rhythms; in sync mode the device waits for an R wave that VF does not have. VF is treated with high-energy unsynchronised shocks, and Oxford tells you to check the device settings when defibrillation repeatedly fails. Up to three quick shocks are allowed in a monitored arrest before compressions. Amiodarone is for VF that persists despite effective shocks, and a low energy is the wrong direction.",
        },
        { kind: "h", text: "Step 3: find the cause the lab produced" },
        {
          kind: "table",
          caption: "Reversible causes of arrest in the lab, from both manuals",
          head: ["Cause", "Clue", "What to do"],
          rows: [
            ["A catheter obstructing flow (deep or wedged position, a plugged small artery such as an intermediate, an injection into the conus branch)", "Damping or ventricularisation before the event; contrast that does not clear from the artery", "Withdraw the catheter so that flow and clearance return, defibrillate, re-engage more carefully, or use a smaller catheter"],
            ["Acute vessel closure or coronary dissection", "Loss of flow on the last run; ST elevation", "Restore flow with the wire you kept in place"],
            ["Air embolism", "Air in the artery after an injection or a device exchange; deterioration can be very fast", "100% oxygen by non-rebreather mask (it helps the air to be resorbed), a workhorse wire passed distally and into branches to break up bubbles, aspiration through the guide or an aspiration catheter if a large amount of air has embolised, and intracoronary adrenaline if the patient arrests. Large systemic air: a hyperbaric chamber; head-down tilt is controversial because it may worsen cerebral oedema (Brilakis)"],
            ["Tamponade", "Rising filling pressures, falling blood pressure, a perforation", "If tamponade has caused the arrest, drain it immediately; do not wait for echo (steps below)"],
            ["Anaphylaxis to contrast", "Usually within 15 minutes of the first injection: itching, flushing, rash, cyanosis, wheeze, angio-oedema, tachycardia, hypotension", "Oxford (typical doses; follow local protocol): airway and 100% oxygen; IV hydrocortisone 200 mg and an antihistamine such as chlorpheniramine 10 mg; adrenaline 0.5 mg intramuscularly (0.5 mL of a 1:1000 solution); nebulised salbutamol 5 mg for bronchospasm; IV 0.9% saline; serum tryptase. In severe anaphylaxis, with monitoring, consider adrenaline 100 micrograms IV (1 mL of 1:10,000). If pulseless, treat as pulseless electrical activity with compressions and ventilation"],
            ["Intractable ventricular arrhythmia", "Recurring VF", "Shock, amiodarone, potassium and magnesium; treat the ischaemia that drives it"],
          ],
        },
        {
          kind: "p",
          text: "Contrast reactions are now uncommon in coronary angiography (Oxford gives 0.4%) because hypo-osmolar agents are now used, but they can progress quickly to severe hypotension and airway obstruction. Patients with previous anaphylaxis, a previous contrast reaction, atopy or asthma are at highest risk; after a previous contrast reaction Oxford premedicates with chlorpheniramine 10 mg and hydrocortisone 100 mg IV an hour before the procedure (typical doses; the full approach is in pm-lab-drugs).",
        },
        {
          kind: "steps",
          title: "Emergency pericardiocentesis in the lab (Oxford; the full technique is in cm-perforation)",
          items: [
            { title: "1. Why it is harder after PCI", detail: "After PCI a small volume of blood can tamponade a single chamber, which makes percutaneous drainage technically harder; occasionally the apical approach is needed. Get expert help if time and circumstances allow, but in an arrest from tamponade do not wait." },
            { title: "2. Guide the needle", detail: "Oxford recommends imaging during the procedure: fluoroscopic screening with pressure monitoring, and echo if it is at hand, without letting either delay drainage in an arrest." },
            { title: "3. Position and route", detail: "Sit the patient at 45° if possible so that fluid collects inferiorly; enter just below the xiphisternum and aim the needle at the tip of the left shoulder blade, aspirating as the needle advances." },
            { title: "4. Kit", detail: "A 15 cm needle of at least 18 G (a short bevel lowers the risk of lacerating the heart), a 0.035 inch J wire, a 5–7 Fr dilator and a drainage catheter with multiple side holes, such as a pigtail." },
            { title: "5. Drain and recheck", detail: "Removing a modest volume (20–50 mL) improves the haemodynamics. Echo immediately afterwards and then serially to look for reaccumulation." },
          ],
        },
        { kind: "tip", id: "diag-vf-catheter-cause" },
        { kind: "tip", id: "pci-arrest-tamponade-drain" },
        {
          kind: "check",
          stem: "During CTO PCI the pressure falls, the patient loses output and the monitor shows sinus rhythm. A wire exit was suspected 10 minutes earlier. Compressions have started. What does Oxford advise about the pericardium?",
          options: [
            "Perform an echocardiogram first to confirm an effusion, then drain it if one is seen",
            "Drain the pericardium immediately as a life-saving measure, under fluoroscopy, without waiting for echo",
            "Wait for the surgical team, since pericardiocentesis is unsafe after anticoagulation",
            "Give a fluid bolus and adrenaline only, since a small effusion cannot cause an arrest",
          ],
          answer: 1,
          explanation:
            "Oxford: if tamponade is known or suspected to have caused the arrest, drain the pericardium straight away, because it may save the patient; echo comes first only when the situation is less critical. After PCI even a small volume of blood can compress one chamber, which makes drainage technically harder, so use fluoroscopy and pressure monitoring (and echo if immediately available) to guide the needle without delaying it. Fluid and adrenaline do not relieve tamponade, and waiting for surgery wastes the minutes that matter.",
        },
        { kind: "h", text: "Step 4: when the circulation does not come back" },
        {
          kind: "p",
          text: "Brilakis's sequence for an arrest during PCI is CPR, ideally with an automated system, then VA-ECMO if the patient does not recover promptly. Both manuals add cautions about the devices: Brilakis notes rib fractures and even cardiac laceration, and Oxford notes that guidelines do not recommend routine mechanical CPR because outcome data are limited (organ injury, sternal and rib fractures, pauses while the device is fitted, and the device shifting during use). In Brilakis's device algorithm cardiac arrest leads straight to VA-ECMO, because it supports both the circulation and oxygenation. A review of arrest in the lab that he cites (Yadav and Truong) notes that a balloon pump is ineffective in arrest. Before cannulating, recall his contraindications to VA-ECMO: severe aortic regurgitation, aortic dissection and uncontrolled bleeding (although VA-ECMO can run without anticoagulation for a short time in a bleeding patient). Who should receive extracorporeal CPR is a system decision agreed in advance (Academy lesson mcs-lab-arrest).",
        },
        {
          kind: "steps",
          title: "Cannulating for VA-ECMO during CPR (Brilakis 14.5, adapted for the emergency; full steps in pm-support-devices)",
          items: [
            { title: "1. Choose the groins", detail: "Venous cannula usually in the right common femoral vein (the easier path to the right atrium), arterial cannula in the left common femoral artery; never both in one groin, because the arterial cannula can compress the neighbouring vein and congest the leg. Brilakis obtains the access as in his access chapter, that is with ultrasound guidance, as for any large-bore puncture." },
            { title: "2. Skip what an emergency allows you to skip", detail: "The femoral angiogram that normally checks the artery's size and disease is omitted in emergencies. The antegrade perfusion sheath for the leg is best placed before the arterial cannula, but in urgent cases it can follow once extracorporeal flow has started." },
            { title: "3. Anticoagulate", detail: "Unfractionated heparin 70–100 U/kg (typical; follow local protocol)." },
            { title: "4. Venous wire and cannula", detail: "A stiff wire from the right femoral vein into the superior vena cava, confirmed on fluoroscopy and well into the vena cava so that it cannot slip back into the atrium (a wire in the atrium lets the cannula be pushed against an intracardiac structure and perforate it). Open the skin with a haemostat; the cannula (usually 25 Fr) is advanced under fluoroscopy to the junction of the superior vena cava and right atrium, stopping at any resistance, and its back end is clamped. Challenges: resistance is usually at the skin entry and needs more dilation; with femoral venous thrombosis use the other femoral vein or the internal jugular vein, and with an IVC filter use the internal jugular vein." },
            { title: "5. Arterial wire and cannula", detail: "A stiff wire into the thoracic aorta, the skin opened with a haemostat, then the cannula (15 Fr for most women, 17 Fr for most men, larger occasionally in big patients) over it under fluoroscopy, without pushing the wide proximal part through the skin; clamp its back end. If it will not advance, check that the wire has not kinked or prolapsed out of position, because forcing the cannula can perforate the vessel." },
            { title: "6. Connect wet, then flow", detail: "Fill the connection with saline so that no air enters, check for bubbles, remove the clamps, start the pump and watch the flow; then connect the antegrade sheath to the arterial cannula's side port: clamp the circuit, let the sheath back-bleed to clear air, join it with a male-to-male connector, unclamp and restart. If bubbles appear: in the arterial cannula, remove them through the side port; small ones in the venous cannula are cleared by the circuit, but larger ones mean disconnecting from the pump tubing and reconnecting. Avoid squeezing the tubing hard while connecting, and do not tighten a connection until the air is out." },
            { title: "7. Watch the leg", detail: "If near-infrared tissue saturation in the cannulated leg is below 50%, or more than 15% lower than the other leg, an antegrade perfusion catheter is needed. Brilakis usually uses a kink-resistant 6 Fr, 24 cm sheath, placed in the common or superficial femoral artery ideally with ultrasound and a micropuncture needle; with a smaller arterial cannula (15–17 Fr) one may not be needed." },
          ],
        },
        { kind: "tip", id: "pci-arrest-no-rosc-ecmo" },
        { kind: "tip", id: "mcs-ecpr-check-before-cannulating" },
        { kind: "tip", id: "mcs-ecpr-cannulate-under-cpr" },
        { kind: "h", text: "Step 5: if the patient dies" },
        {
          kind: "steps",
          items: [
            { title: "Before it happens", detail: "Oxford puts death at about 1 in 1000 cardiac catheterisations and includes it in standard consent. The risk rises with age, left main stenosis, three-vessel disease, impaired LV function, class IV heart failure and aortic valve disease." },
            { title: "The family", detail: "Oxford: contact the next of kin and explain what happened; good communication often prevents complaints and litigation. Offer the family a private room to be with the patient, and ask about any religious needs. In line with the duty of candour, tell the family about any complication that occurred." },
            { title: "Report", detail: "Inform the department manager and the coroner, and the primary care doctor early, because the family's doctor will be involved in bereavement support. If there was an iatrogenic complication, complete an adverse incident form under local policy. Request a post-mortem if the death is unexplained." },
            { title: "Document", detail: "Clear notes from every member of staff: exact times, who was present, the equipment used, the perceived mechanism of death, and whether and what the next of kin were told." },
            { title: "Look after the team", detail: "A death in the lab usually follows a long resuscitation with many staff. The cardiologist in charge makes time for the team to talk and, if needed, postpones or cancels the rest of the list; some hospitals offer counselling." },
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "A synchronised defibrillator in VF, or a defibrillator that has failed twice and is used a third time unchanged.",
            "Pulling out the wire at the start of an arrest, then having to recross an occluded or dissected artery.",
            "Re-injecting through a catheter that caused the VF by plugging the ostium.",
            "Waiting for echo in an arrest from suspected tamponade.",
            "Advancing an ECMO cannula before fluoroscopy confirms the venous wire in the superior vena cava and the arterial wire in the thoracic aorta, or pushing on against resistance.",
            "Going home after a death in the lab without the family informed, the notes written and the team debriefed.",
          ],
        },
        {
          kind: "pearl",
          text: "When VF follows an injection, the most useful question after the shock is 'what was the catheter doing on the last frame?'. Damping before the injection, a plugged small vessel, a conus run or contrast that hung in the artery tells you the cause, and the fix (back the catheter out) costs nothing.",
        },
        {
          kind: "sim",
          sim: "ecmo",
          task: "Arrest during PCI without return of circulation: place the venous cannula in the right femoral vein and the arterial cannula in the left femoral artery, confirm on fluoroscopy that the venous wire is in the superior vena cava and the arterial wire in the thoracic aorta before advancing either cannula, connect wet, start flow, then add the antegrade perfusion sheath.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the RCA with a JR4 and watch for damping and conus selection; if the trace damps or the conus fills, withdraw before injecting again, and state the defibrillator mode and energy you would use if VF followed.",
        },
        { kind: "video", id: "YKYwh9ZUbHg", note: "Elias Hanna: cardiac arrest." },
        { kind: "video", id: "7vfM7zRRmTk", note: "Brilakis: VA-ECMO cannulation (Manual of PCI, chapter 14)." },
        {
          kind: "keypoints",
          items: [
            "Name the person who shocks at the brief; the physiologist by default (Oxford). The radiographer clears the C-arm.",
            "VF: unsynchronised, high energy at once (150–200 J biphasic, 200–360 J monophasic); up to three quick shocks in a monitored arrest (ERC 2021); then ALS.",
            "Failed shocks: check the settings, another defibrillator, potassium and magnesium. ERC 2021 timing: adrenaline 1 mg after the third shock then every 3–5 minutes, amiodarone 300 mg after three shocks and 150 mg after five; stacked opening shocks count as the first shock for adrenaline timing (typical doses).",
            "Keep the wire. Find the cause: catheter obstructing flow, closure or dissection, air (oxygen, wire, aspiration, intracoronary adrenaline), tamponade (drain at once), anaphylaxis, ischaemia.",
            "No prompt recovery: mechanical CPR then VA-ECMO (Brilakis); mechanical CPR has its own injuries and is not recommended routinely (Oxford), and a balloon pump is ineffective in arrest. Check for severe AR, dissection and uncontrolled bleeding first.",
            "ECPR cannulation: right femoral vein to the SVC–RA junction, left femoral artery with the wire in the thoracic aorta, no femoral angiogram in emergencies, leg perfusion sheath after flow if urgent.",
            "After a death: family, coroner and manager, documentation, and a team debrief.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-tavr-before",
      title: "The TAVI candidate: work-up angiography and when to treat the coronaries",
      minutes: 15,
      topics: ["cx-tavr-pci"],
      sources: [
        O("ch 5: TAVI work-up"),
        O("ch 5: Aortic stenosis"),
        O("ch 1: Cardiac CT in transcatheter aortic valve intervention"),
        O("ch 1: Indications for coronary angiography"),
        O("ch 8: Pressure wire"),
        B("24.1"),
        B("1.5"),
        B("5.6"),
        B("6.6"),
      ],
      refs: [...BOOKS, "ahmad-tavr-physiology-2018", "lonborg-notion3-2024", "yudi-tavr-reaccess-2018", "esc-vhd-2025"],
      blocks: [
        {
          kind: "p",
          text: "Coronary disease is common in patients with severe aortic stenosis, and Oxford notes that it remains routine to consider diagnostic angiography in symptomatic patients assessed for valve surgery, because non-invasive tests struggle to find coronary stenoses when the valve is diseased. Both manuals, and NOTION-3, predate the 2025 ESC/EACTS guideline on valvular heart disease; its recommendations on how to assess the coronaries before TAVI (including the place of CT coronary angiography) are not taught here, so read them before applying this lesson. The study is not a standard angiogram: the pressure trace, the opacification and the physiology all behave differently, the aorta and the access arteries must be imaged too, and the findings feed a decision about whether and when to treat the coronaries. This lesson takes those steps in order; the TAVI procedure itself is taught in the TAVI lab and in hb-tavi.",
        },
        { kind: "h", text: "Step 1: what the work-up must show" },
        {
          kind: "steps",
          items: [
            { title: "The coronaries", detail: "A systematic coronary study (Oxford). Brilakis's planning checklist notes that aortic stenosis or regurgitation can come with a dilated ascending aorta that needs larger catheters to engage." },
            { title: "The aortic root", detail: "Oxford: always perform an aortogram, to judge the angle between the valve and the ascending aorta." },
            { title: "The access arteries", detail: "Oxford calls the transfemoral route both the most used and the preferred one, so the size, tortuosity and calcification of the iliofemoral arteries must be known; if they are badly diseased, image the subclavian and axillary arteries as alternatives." },
            { title: "Haemodynamics, only if needed", detail: "Gradients across the valve and right heart pressures can be measured, but may not be needed, depending on how reliable the non-invasive studies are." },
            { title: "What CT adds", detail: "Oxford lists the CT measurements that plan a TAVI: access arteries, annulus diameter, area and perimeter, the root and sinotubular junction (relevant to self-expanding valves), the whole aorta, valve calcium, the height of the coronary ostia above the annulus, and the angles for the working view." },
          ],
        },
        { kind: "h", text: "Step 2: read the trace and the pictures correctly" },
        {
          kind: "list",
          items: [
            "**A slow, low aortic trace** in severe aortic stenosis can look damped when it is simply the slow-rising, low-amplitude pulse of the valve (Brilakis). True damping still happens; side-hole catheters can hide it at the tip.",
            "**Poor filling.** Severe aortic stenosis raises coronary flow, which is one of Brilakis's causes of an incompletely opacified artery (with hypertrophic obstructive and dilated cardiomyopathy and an arteriovenous fistula; his other causes include a small or side-hole catheter, a large or ectatic artery, poor engagement, viscous iso-osmolar contrast, a weak injection and a high LVEDP). Use a larger lumen (a guide, or a larger diagnostic catheter), avoid side holes, inject more firmly, and if the artery still will not fill, call the study non-diagnostic rather than read a false lesion.",
            "**Crossing the valve** for a gradient is rarely needed now and is hazardous: Oxford cites brain MRI showing emboli after attempts to cross. If you must (symptoms and non-invasive tests disagree, or the TAVI work-up needs it), Oxford uses a 5 Fr AL1 with a straight hydrophilic wire, then exchanges for a pigtail over an exchange-length J wire, manipulating the wire with control; aortography can show the point where the leaflets open (the 'Prussian helmet' sign).",
          ],
        },
        {
          kind: "table",
          caption: "Grading aortic stenosis from the non-invasive data Oxford expects before the study (Table 5.1)",
          head: ["Severity", "Valve area", "Peak gradient", "Mean gradient"],
          rows: [
            ["Mild", "Above 1.4 cm²", "Below 35 mmHg", "Below 20 mmHg"],
            ["Moderate", "1.0–1.4 cm²", "35–65 mmHg", "20–40 mmHg"],
            ["Severe", "Below 1.0 cm²", "Above 65 mmHg", "Above 40 mmHg"],
          ],
        },
        {
          kind: "steps",
          title: "If you do measure the gradient (Oxford)",
          items: [
            { title: "Best: simultaneous pressures", detail: "LV and aortic pressures recorded at the same moment, with two catheters or a double-lumen catheter in the ventricle, give the most accurate gradient. Using the femoral artery pressure instead of the aorta is less accurate." },
            { title: "Usual: the pull-back", detail: "Most labs record a peak-to-peak gradient as the catheter is pulled back from the LV. Its weaknesses are that the two peaks are recorded at different times and the catheter itself interferes with how the valve opens and closes." },
            { title: "Valve area", detail: "The Gorlin formula needs the cardiac output, the mean gradient and the systolic ejection time; its inaccuracies and practical limits have taken it out of routine practice." },
            { title: "Echo is the reference", detail: "Oxford treats accurate non-invasive testing, especially echocardiography, as the gold standard for most patients; the extra invasive data rarely change management." },
          ],
        },
        { kind: "tip", id: "haemo-as-slow-rise-not-damping" },
        { kind: "tip", id: "diag-as-high-flow-fill" },
        {
          kind: "check",
          stem: "In a TAVI work-up, a 5 Fr JL4 gives a slow-rising aortic trace with a low pulse pressure, and the LAD fills patchily with streaming despite a firm 8 mL injection. What is the best interpretation and action?",
          options: [
            "The trace is damped, so the catheter must be wedged: withdraw it and abandon the left coronary run",
            "The patchy LAD shows diffuse disease, so report severe LAD disease and refer for surgery",
            "The slow trace may be the aortic stenosis pulse; the poor filling suggests high flow, so use a larger lumen without side holes",
            "Change to a side-hole catheter, because side holes improve opacification in high-flow arteries",
          ],
          answer: 2,
          explanation:
            "Brilakis notes that in aortic stenosis the aortic trace can look damped when it is really the slow, small pulse of the valve, and lists high coronary flow in severe aortic stenosis among the causes of incomplete opacification; the remedies are a larger lumen, no side holes and a stronger injection, and an artery that still cannot be filled is reported as non-diagnostic. Calling streaming a stenosis is a classic false positive. Side holes reduce the force of the jet into the artery and can mask damping.",
        },
        { kind: "h", text: "Step 3: the iliofemoral run" },
        {
          kind: "steps",
          title: "Oxford's technique",
          items: [
            { title: "1. Catheter", detail: "A graded (marker) pigtail just above the aortic bifurcation; the markers allow vessel diameters to be measured afterwards." },
            { title: "2. Table and field", detail: "Raise the table to widen the field, and check before acquiring that the table can pan down to both femoral heads." },
            { title: "3. Injection", detail: "Usually a pump injection, for example 20 mL at 20 mL per second, for full opacification." },
            { title: "4. Tortuosity", detail: "Invasive angiography also shows the puncture site and whether tortuous iliac or femoral arteries straighten over an extra-stiff wire." },
          ],
        },
        { kind: "tip", id: "structural-tavi-iliofemoral-run" },
        { kind: "h", text: "Step 4: physiology with severe aortic stenosis" },
        {
          kind: "p",
          text: "Brilakis: after TAVI, hyperaemic flow rises and FFR falls significantly, whereas iFR stays the same; before the valve is treated, then, an FFR may make a stenosis look milder than it is, and he advises caution with it. Oxford lists aortic stenosis among the settings where FFR has limited validation. The data behind this (one 28-patient study) and their limits are taught in pm-physiology.",
        },
        { kind: "h", text: "Step 5: before, with, or after the valve?" },
        {
          kind: "table",
          caption: "Timing of PCI in a patient who needs TAVI (Brilakis 24.1.7)",
          head: ["Timing", "For", "Against"],
          rows: [
            ["Before TAVI", "May lower the risk of complications during TAVI", "Controversial: PCI with severe aortic stenosis carries more risk"],
            ["At the same sitting", "Logistically convenient", "More complexity and more contrast"],
            ["After TAVI", "Symptoms from the coronaries can be separated from those of the valve", "Engaging the coronaries through the valve frame can be difficult (next lesson)"],
          ],
        },
        {
          kind: "p",
          text: "Since the manuals, NOTION-3 has randomised 455 patients with severe symptomatic aortic stenosis undergoing TAVI, with stable coronary artery disease (median age 82, median STS predicted mortality 3%), who had at least one stenosis with FFR 0.80 or less or a diameter stenosis of at least 90%, to PCI or conservative treatment. At a median of 2 years, major adverse cardiac events (death from any cause, myocardial infarction or urgent revascularisation) occurred in 26% with PCI against 36% without (hazard ratio 0.71, confidence interval 0.51 to 0.99); bleeding was more frequent with PCI (28% against 20%; hazard ratio 1.51, 1.03 to 2.22), and 3% had a PCI-related complication. The patients had stable disease, so the result does not cover an ACS. Note too that the trial used FFR to select lesions despite the caution above.",
        },
        {
          kind: "check",
          stem: "An 84-year-old with severe aortic stenosis has a 95% proximal LAD stenosis and mild symptoms of angina and breathlessness. The heart team plans TAVI. Which statement fits the manuals and NOTION-3?",
          options: [
            "PCI should never precede TAVI, because both manuals say it adds risk without any benefit",
            "Deferring PCI until after TAVI is always best, since the coronaries are as easy to engage afterwards",
            "PCI is worth considering: NOTION-3 found fewer major adverse events with PCI of such lesions, at a cost in bleeding",
            "Only FFR can decide, because a 95% stenosis may be haemodynamically insignificant with aortic stenosis",
          ],
          answer: 2,
          explanation:
            "Brilakis calls PCI around TAVI controversial and sets out the trade-offs of each timing; deferring has the advantage of separating symptoms but makes engagement harder after a valve, especially a self-expanding one. NOTION-3 included lesions with a diameter stenosis of 90% or more without needing FFR and found fewer major adverse cardiac events with PCI (26% against 36%), with more bleeding. FFR may underestimate stenoses in severe aortic stenosis, so it is not the sole arbiter here.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reporting a coronary stenosis from a streaming, under-filled artery in a high-flow aortic stenosis patient.",
            "Treating the slow aortic upstroke of aortic stenosis as damping, or assuming that every damped trace is the valve.",
            "Crossing the valve routinely in the work-up study.",
            "Forgetting the aortogram and the iliofemoral run, so the TAVI team has to repeat the study.",
            "Deferring a proximal lesion to after a self-expanding valve without considering how it will be reached.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the work-up study, look at the CT if it has been done: the coronary heights and root size tell you which catheter sizes to open, and the planned valve type tells you how hard any later PCI will be. That second point is the strongest argument for deciding about a proximal lesion now.",
        },
        { kind: "tip", id: "structural-tavr-plan-reaccess" },
        {
          kind: "sim",
          sim: "tavi",
          task: "In the CT planning stage, note the coronary heights, sinus widths and sinotubular junction, and record how each would affect a later coronary engagement through a self-expanding or a balloon-expandable valve.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "TAVI work-up: engage the left coronary in a dilated root (choose the larger JL size), check the trace before injecting, and if the artery fills poorly change to a larger lumen without side holes rather than reading the run.",
        },
        { kind: "video", id: "KEEp4H7c0QM", note: "Brilakis: 24.1, PCI in TAVR (Manual of PCI chapter summary)." },
        { kind: "video", id: "TkRshAJXNzM", note: "Brilakis case 110: complicated PCI before TAVR." },
        { kind: "video", id: "mk3HMGICYo4", note: "Brilakis case 62: PCI in a patient with prior CABG and TAVR." },
        {
          kind: "keypoints",
          items: [
            "Work-up angiography: coronaries, an aortogram for the valve–aorta angle, and the access arteries; haemodynamics only if needed, and echo is the reference for grading the valve.",
            "CT adds annulus, root, sinotubular junction, coronary heights, aorta, calcium and working angles.",
            "Severe aortic stenosis: a slow small aortic pulse is not damping; high coronary flow defeats small catheters; call under-filled runs non-diagnostic.",
            "Crossing the valve is rarely needed: 5 Fr AL1 with a straight hydrophilic wire, exchange for a pigtail.",
            "Iliofemoral run: graded pigtail above the bifurcation, table up, pan to both femoral heads, 20 mL at 20 mL/s.",
            "FFR with caution in severe aortic stenosis; iFR does not change after TAVI.",
            "PCI before, with or after TAVI each has a cost; in stable coronary disease NOTION-3 favoured PCI of FFR-positive or 90% lesions, with more bleeding. The 2025 ESC/EACTS valvular guideline postdates all of this.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cp-complex-patients-tavr-after",
      title: "Coronary access through a transcatheter valve",
      minutes: 17,
      topics: ["cx-tavr-pci"],
      sources: [B("24.1"), B("1.5"), O("ch 1: Cardiac CT in transcatheter aortic valve intervention")],
      refs: [...BRILAKIS, "yudi-tavr-reaccess-2018", "harhash-tavr-entrapment-2016"],
      blocks: [
        {
          kind: "p",
          text: "Patients are now treated with TAVI at younger ages and lower risk, so more of them will need coronary angiography and PCI with a valve frame standing in the aortic root. Brilakis's section, built largely on the review by Yudi and colleagues, explains why engagement can be hard (particularly with self-expanding valves, whose frames extend above the coronary ostia) and how to do it. The Academy lesson sh-tavi-coronary covers coronary obstruction during the TAVI itself; this lesson is about coming back later.",
        },
        { kind: "h", text: "Step 1: plan from the valve, the root and the report" },
        {
          kind: "table",
          caption: "What decides how hard re-access will be (Brilakis Fig 24.1, from Yudi and colleagues)",
          head: ["Group", "Factors"],
          rows: [
            ["The patient's anatomy", "Sinotubular junction dimensions; sinus height; length and bulk of the native leaflets; width of the sinus of Valsalva; height of the coronary ostium"],
            ["The valve and how it was implanted", "Orientation of the commissural posts; height of the sealing skirt; depth of implantation"],
          ],
        },
        {
          kind: "steps",
          items: [
            { title: "Know the valve", detail: "Self-expanding or balloon-expandable, which size, and how deep it was implanted (from the implant report and the final aortogram). Brilakis's general planning advice applies too: find out which catheters worked last time." },
            { title: "CT when time allows", detail: "Preprocedural CT angiography shows the three-dimensional relation between the frame, the root and the ostia. Its limits, per Brilakis: it cannot be done in an urgent case such as an ACS, it adds contrast and therefore kidney risk, and motion and image quality may not show where the commissural posts sit relative to the ostia." },
            { title: "Access", detail: "Because engagement is often difficult, Brilakis says femoral access may be preferred." },
          ],
        },
        {
          kind: "check",
          stem: "A woman with a self-expanding TAVI implanted three years ago presents with an anterior STEMI. The registrar suggests a CT angiogram first to map the commissures. What do you do?",
          options: [
            "Obtain the CT first, because commissural position decides the catheter and the CT will show it reliably",
            "Go to the lab now, review the implant report and images on the way, and favour femoral access",
            "Give fibrinolysis while the CT is arranged, since the valve makes primary PCI impossible",
            "Go to the lab but use the radial artery, because the frame makes femoral catheters kink",
          ],
          answer: 1,
          explanation:
            "Brilakis lists the limits of CT after TAVI: it cannot be done in urgent cases such as an ACS needing angiography and PCI, it adds contrast before the cath lab contrast, and motion may hide the commissural posts anyway. Review what is already known about the valve and its depth, and Brilakis suggests femoral access may be preferred because engagement is often challenging. Nothing in the manuals makes primary PCI impossible through a valve, and the kinking problem he describes is at the valve frame, not the access route.",
        },
        { kind: "h", text: "Step 2: the principles for every valve" },
        {
          kind: "list",
          items: [
            "**Coaxial, never deep.** Engage with extreme care, aim for a coaxial position and avoid deep intubation of the artery.",
            "**Wire first if you must.** Wiring the coronary before the catheter is fully engaged can be what makes engagement possible: the wire guides the guide, or a guide extension, into the ostium.",
            "**Expect complex disease.** Brilakis notes that these patients often have severe calcification and chronic occlusions, so plan meticulous lesion preparation before stenting.",
          ],
        },
        { kind: "h", text: "Step 3: self-expanding supra-annular valves" },
        {
          kind: "steps",
          items: [
            {
              title: "Implant depth",
              detail: "With the valve at its optimal depth, the sealing skirt lies below the ostia and coaxial engagement is feasible, provided the native leaflets do not block the way. Implanted high, the valve still leaves the coronary open, since its slim waist sits inside a sinus with room to spare. What changes is access: the supra-annular leaflets and their covered skirt now lie higher than the ostium, so a catheter can reach it only through a frame cell (a 'diamond') above it. For that route Brilakis proposes a JR4 or a similar shape with little curve and a short tip, and he applies it to the left main as well.",
            },
            {
              title: "Commissures",
              detail: "In the valve Brilakis describes, the circumferential skirt is 13 mm high (14 mm in the 34 mm size) but rises to 26 mm where the commissures insert. A commissural post standing directly in front of an ostium makes coaxial engagement difficult or impossible.",
            },
            {
              title: "Sinus width",
              detail: "The sinus is the space between the frame and the ostium: the wider it is, the more room to steer a catheter. A narrow sinus forces such an acute angle that only a non-selective injection may be possible; if selective access is needed, wire the coronary and rail the guide or a guide extension into the ostium.",
            },
            {
              title: "The hardest case",
              detail: "A commissure over a low ostium in a narrow sinus. A tall, bulky native leaflet reaching above the skirt adds to the difficulty. Brilakis's figure shows ostia at about 10, 14 and 18 mm above the annulus each needing a different catheter and approach when the ostium faces the side of a commissural post.",
            },
          ],
        },
        {
          kind: "check",
          stem: "Fluoroscopy shows a self-expanding valve implanted high, with the covered skirt above the level of the left main ostium. A JL4 sits outside the frame and cannot reach the ostium. What does Brilakis suggest?",
          options: [
            "Use a larger, more curved JL5 so the tip can reach under the skirt from outside the frame",
            "Enter through a frame cell above the ostium with a straighter, short-tipped catheter such as a JR4",
            "Push the JL4 harder against the frame until the tip snaps through the nearest commissure",
            "Abandon selective angiography; a high implant means the left main is obstructed and needs surgery",
          ],
          answer: 1,
          explanation:
            "Once the covered skirt lies above the ostium, the only way in is through a cell higher up the frame, and Brilakis's choice for that is a JR4-type catheter with little curve and a short tip, for the left main too. Obstruction is not the problem: the implant's slim waist and the room left in the sinus keep the ostium open. A bigger curve does not get under a covered skirt, and forcing a catheter through the frame is how kinking and entrapment happen.",
        },
        { kind: "h", text: "Step 4: catheters, and how to avoid entrapment" },
        {
          kind: "table",
          caption: "Catheter choice through a self-expanding frame (Brilakis 24.1.5.1)",
          head: ["Artery", "Usual choice", "When to change"],
          rows: [
            ["Left main", "Smaller Judkins curves, JL3.5 or JL3, are often used", "High implant: a short-tipped JR4 through a diamond above the ostium"],
            ["RCA", "JR4 usually manages; Ikari right is the other usual choice", "A wide sinus puts the ostium further from the frame: JR4.5, JR5 or AR2"],
          ],
        },
        {
          kind: "p",
          text: "Extra back-up guides have kinked and become trapped in the frame's diamonds. In the case Brilakis reproduces (Harhash and colleagues, reported as a STEMI after TAVR with a catastrophic outcome), the guide had entered the left coronary at an acute angle to the stent frame, and the case ended in dissection of the left main and LAD; a bench simulation showed an extra back-up 3.5 trapped when it crossed the frame at an acute angle. Brilakis gives three measures that may lower the risk of entrapment; they are preventive, not a tested rescue for a guide that is already stuck:",
        },
        {
          kind: "steps",
          items: [
            { title: "1. Cross perpendicularly", detail: "Pass through a diamond at the level of the ostium, at right angles to the frame." },
            { title: "2. Choose favourable geometry", detail: "For example a Judkins left for the left coronary and an Amplatz right for the RCA." },
            { title: "3. Back out over hardware", detail: "When the catheter has to come out of the ostium, use a balloon, a wire or both to back it out. (Teaching advice, not Brilakis's wording: this is also why you should not simply pull a kinked catheter against the frame.)" },
          ],
        },
        { kind: "tip", id: "diag-tavr-left-catheter" },
        { kind: "tip", id: "diag-tavr-cross-perpendicular" },
        { kind: "tip", id: "diag-tavr-rca-wide-sinus" },
        { kind: "tip", id: "pci-tavr-guide-trapped" },
        { kind: "tip", id: "pci-tavr-wire-then-rail" },
        {
          kind: "check",
          stem: "An extra back-up 3.5 guide has been advanced into the left main through a self-expanding frame at a steep angle. It now kinks and will not withdraw. The wire is in the LAD. What is the safest next step?",
          options: [
            "Rotate the guide hard clockwise while pulling, to unscrew it from the diamond",
            "Use a balloon or the wire to back the guide out of the ostium, then re-cross perpendicularly at ostial level",
            "Remove the coronary wire first, so that the guide has more room to pass back through the cell",
            "Advance the guide deeper into the left main to straighten the kink before pulling it back",
          ],
          answer: 1,
          explanation:
            "Brilakis gives three measures that may minimise entrapment: crossing perpendicularly through a diamond at the ostial level, choosing catheters with favourable geometry, and using a balloon, a wire or both to back the catheter out of the ostium. The last is the one he names for withdrawing from the ostium, so it is the best-supported next step, followed by re-crossing at right angles. The manual offers no tested rescue for an established entrapment, and the case he reproduces ended in left main and LAD dissection, so forceful torque or pushing deeper has no support and courts the same injury. The wire is part of backing out, not something to remove.",
        },
        { kind: "h", text: "Step 5: balloon-expandable valves" },
        {
          kind: "p",
          text: "Engagement is often easier with a balloon-expandable valve than with a self-expanding one, but implant depth still matters. In Brilakis's figure of a 29 mm balloon-expandable valve, the frame is 22.5 mm tall and, at the optimal position, 4.5 mm of it lies below the annular plane. With a higher implant (in the figure, the whole frame above the annulus and the skirt reaching 11.6 mm above it) the ostium comes to lie below the top of the sealing skirt, and a long native leaflet or a lump of calcium on its free edge adds to the difficulty.",
        },
        { kind: "h", text: "Step 6: the rest of the PCI" },
        {
          kind: "list",
          items: [
            "Angiography, stenting, intravascular imaging, closure and haemodynamic support follow the standard chapters.",
            "Lesion preparation deserves extra care: severe calcium and chronic occlusions are common in this group.",
            "Brilakis's caution about FFR is worded for severe aortic stenosis, the state before the valve is treated (pm-physiology).",
            "Record in the report which catheter, which cell of the frame and which projection worked: the next operator will need it.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Pushing a deep-seating extra back-up guide through the frame at an acute angle.",
            "Persisting with a long-tipped left Judkins against a high skirt instead of entering through a diamond above the ostium.",
            "Seeking a selective engagement in a narrow sinus without first wiring the artery.",
            "Delaying an ACS for CT that cannot answer the question in time.",
            "Undertreating calcified lesions because the access was hard won.",
            "Not recording what worked.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first catheter goes in, find on fluoroscopy where the skirt ends and where the commissural posts sit relative to the expected ostia; then pick the diamond you will enter. A plan made on the screen beforehand replaces a lot of probing against the frame.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Practise the catheter choices you would use through a valve frame: engage the left main with a JL3.5 and with a short-tipped JR4, and the RCA with a JR4, then an AR2 for a wide sinus. The lab has no valve frame yet, so state at each step which diamond you would cross and at what angle.",
        },
        { kind: "video", id: "RdCVVwa1Q1s", note: "Brilakis case 163: PCI through a self-expanding valve." },
        { kind: "video", id: "sxjSbA8f3-M", note: "Brilakis case 146: DK crush through a self-expanding valve." },
        { kind: "video", id: "tSNbhjLuLSU", note: "Brilakis case 132: PCI through two TAVRs." },
        { kind: "video", id: "uZ8MjQbKaUE", note: "Brilakis CTO case 113: CTO PCI in a prior TAVR patient." },
        {
          kind: "keypoints",
          items: [
            "Difficulty depends on anatomy (sinotubular junction, sinus height and width, leaflets, coronary height) and on the valve (commissural posts, skirt height, implant depth).",
            "CT helps electively but cannot be done in an ACS, adds contrast and may not show the commissures. Femoral access may be preferred.",
            "Coaxial, not deep; wire first if needed, then rail the guide or a guide extension.",
            "Self-expanding, high implant: enter through a diamond above the ostium with a short-tipped JR4, even for the left main. Commissure in front of a low ostium in a narrow sinus is the hardest case.",
            "Left: JL3.5 or JL3. RCA: JR4 or Ikari right; JR4.5, JR5 or AR2 for a wide sinus.",
            "Avoid entrapment: cross perpendicularly at ostial level, favourable shapes, back out over a balloon or wire.",
            "Balloon-expandable valves are usually easier, but a high implant puts the ostium below the skirt top.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cp-complex-patients-q1",
      stem: "In CULPRIT-SHOCK (706 patients with infarct-related shock and multivessel disease), what did culprit-only PCI with optional staging achieve compared with immediate multivessel PCI?",
      options: [
        "Lower death or renal replacement therapy at 30 days, with more repeat revascularisation by 1 year",
        "Lower death at 1 year with a significant difference, and fewer repeat procedures than multivessel PCI",
        "No difference at 30 days, but fewer heart failure admissions at 1 year than immediate multivessel PCI",
        "Lower death at 30 days only in patients who also had a microaxial pump placed before the PCI",
      ],
      answer: 0,
      explanation:
        "The primary end point (death or renal replacement therapy at 30 days) was 45.9% against 55.4%. By 1 year, death was 50.0% against 56.9% with a confidence interval crossing 1, repeat revascularisation 32.3% against 9.4%, and heart failure rehospitalisation 5.2% against 1.2%. Staging has a cost, but treating everything at once in shock did worse early. The trial did not test pumps.",
      difficulty: 2,
      refs: ["culprit-shock-2017", "thiele-culprit-shock-1y-2018"],
    },
    {
      id: "cp-complex-patients-q2",
      stem: "A man in infarct-related shock is about to have primary PCI. His right radial pulse is weak, he is on noradrenaline, and the team expects to need a pump. Which access plan best follows Brilakis?",
      options: [
        "Right radial, converting to femoral only after two failed punctures, since radial is the primary PCI default",
        "Femoral arterial access under ultrasound and fluoroscopy, with venous access, imaging the femoral artery for devices",
        "Left radial for the coronaries and the right femoral vein only, since arterial pumps are placed after the PCI",
        "Brachial access for the coronaries, because it avoids both radial spasm and the risk of limb ischaemia from a femoral pump sheath",
      ],
      answer: 1,
      explanation:
        "Brilakis says femoral access may be preferred in shock because support is often needed and the anatomy must be seen quickly, and lists vasopressors and arrest as risk factors for radial spasm. The protocol he reproduces asks for ultrasound- and fluoroscopy-guided femoral access and venous access. Radial remains the general ACS standard in both manuals, and radial coronary work with an early guided femoral sheath kept for the pump (Academy mcs-shock-management) is also defensible; what fails is a plan that leaves the femoral route until after repeated radial failures. Nothing in either manual recommends brachial access here.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-complex-patients-q3",
      stem: "After culprit PCI with a microaxial pump: MAP 62 mmHg, cardiac output 3.5 L/min, PA 44/28 mmHg, RA 8 mmHg, on two vasoactive drugs. What does the protocol Brilakis reproduces suggest?",
      options: [
        "CPO about 0.48 W and PAPi 2.0: the targets are met, so wean both drugs and remove the pump before leaving the lab",
        "CPO about 0.48 W and PAPi 2.0: consider more left-sided support or transfer to an advanced heart failure centre",
        "CPO about 0.48 W and PAPi 2.0: add right-sided support, because a high PA pressure means RV failure",
        "CPO about 0.71 W and PAPi 0.5: no change is needed now, so continue as you are and reassess in the intensive care unit",
      ],
      answer: 1,
      explanation:
        "CPO = 62 × 3.5 ÷ 451 ≈ 0.48 W (below 0.6). PAPi = (44 − 28) ÷ 8 = 2.0 (above 0.9): the RV is coping. With CPO below 0.6 and PAPi above 0.9, the NCSI branch is additional left-sided support, by a more powerful device or transfer to an LVAD or transplant centre, by local practice. Weaning needs CPO above 0.6 as well as PAPi above 0.9 and freedom from all inotropes and vasopressors.",
      difficulty: 3,
      refs: [...BRILAKIS, "basir-ncsi-2019"],
    },
    {
      id: "cp-complex-patients-q4",
      stem: "A resuscitated out-of-hospital arrest patient is haemodynamically stable without ST elevation on a repeat ECG. Which statement about immediate angiography is correct?",
      options: [
        "COACT showed better 90-day survival with immediate angiography, so the 2023 ESC guideline now recommends it for every survivor",
        "TOMAHAWK found no benefit and numerically more deaths with immediate angiography; the 2023 ESC guideline advises against routine use",
        "Oxford and the 2023 ESC guideline agree: chest pain before the arrest makes immediate angiography mandatory",
        "Both trials excluded patients whose first rhythm was shockable, so their results do not apply to survivors of VF arrests",
      ],
      answer: 1,
      explanation:
        "TOMAHAWK: death at 30 days 54.0% with immediate against 46.0% with delayed or selective angiography (hazard ratio 1.28, interval 1.00 to 1.63). COACT: 90-day survival 64.5% against 67.2%, no significant difference. The 2023 ESC guideline gives routine immediate angiography in this group class III. Oxford's list including chest pain before arrest predates TOMAHAWK and the 2023 ESC guideline, although Oxford cites COACT. COACT in fact studied patients after shockable-rhythm arrest.",
      difficulty: 2,
      refs: [...OXFORD, "coact-2019", "tomahawk-2021", "licordari-esc-acs-2024"],
    },
    {
      id: "cp-complex-patients-q5",
      stem: "Repeated shocks fail to terminate VF in the lab. According to Oxford, which combination is right?",
      options: [
        "Check the defibrillator settings, consider a different defibrillator, give amiodarone 300 mg IV, and correct potassium and magnesium",
        "Lower the energy to reduce myocardial injury from repeated shocks, give amiodarone 150 mg over 10 minutes, and await a perfusing rhythm",
        "Switch the defibrillator to synchronised mode, give lidocaine 50 mg over 2 minutes, and start ventricular overdrive pacing at once",
        "Stop shocks after the third and rely on mechanical compressions, adrenaline and calcium for the rest of the arrest",
      ],
      answer: 0,
      explanation:
        "Oxford: VF needs immediate unsynchronised, high-energy defibrillation; if it repeatedly fails, check the settings and consider another defibrillator; for VF resistant to shocks consider amiodarone 300 mg IV; correct potassium and magnesium. The 150 mg dose and lidocaine are Oxford's options for tolerated VT, synchronised shocks are for VT with a pulse, and overdrive pacing can accelerate VT into VF.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "cp-complex-patients-q6",
      stem: "VF follows a right coronary injection with a JR4 whose trace damped just before the injection. After successful defibrillation, what does the pattern suggest, and what should you do before injecting again?",
      options: [
        "A conus artery or obstructed ostium is likely: withdraw the catheter and re-engage carefully, or use a smaller catheter",
        "Contrast allergy is the likely cause: give hydrocortisone and an antihistamine, then repeat the same injection from the same position",
        "A reperfusion arrhythmia is the likely cause: repeat the injection at once to show that the artery is still open",
        "Vagal reaction is likely: give atropine and continue injecting from the same position",
      ],
      answer: 0,
      explanation:
        "Oxford lists catheter manipulation near a stenosed ostium, plugging of a vessel and injection into the conus branch as causes of VF; Brilakis warns that a catheter obstructing antegrade flow can cause VF and that contrast which cannot clear from the artery can trigger VF or VT, the remedy being to withdraw and re-engage carefully or use a smaller catheter. A damped trace before the injection is the clue. Repeating the injection from the same position repeats the cause.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "cp-complex-patients-q7",
      stem: "A patient arrests during PCI and does not recover with CPR. VA-ECMO is being prepared. Which finding, according to Brilakis, would contraindicate it?",
      options: [
        "A left ventricular thrombus seen on the last echocardiogram",
        "A mechanical aortic valve in the aortic position",
        "Severe aortic regurgitation",
        "Recent atrial fibrillation without anticoagulation",
      ],
      answer: 2,
      explanation:
        "Brilakis lists severe aortic regurgitation, aortic dissection and uncontrolled bleeding as contraindications to VA-ECMO (and to the balloon pump), noting that both can run briefly without anticoagulation in a bleeding patient. A mechanical aortic valve and LV thrombus are contraindications to the transaortic microaxial pump, not to VA-ECMO.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cp-complex-patients-q8",
      stem: "During emergency VA-ECMO cannulation under CPR, which step does Brilakis allow you to omit or postpone?",
      options: [
        "Fluoroscopic confirmation that the venous wire is in the superior vena cava before advancing the cannula",
        "Filling each cannula-to-tubing connection with saline so that no air enters the circuit when the clamps come off",
        "Angiography of the femoral artery before the arterial cannula, and the leg perfusion sheath until flow has started",
        "Placing the venous and arterial cannulae in different groins, which avoids venous congestion of the cannulated leg",
      ],
      answer: 2,
      explanation:
        "Brilakis omits the femoral angiogram in emergencies and allows the antegrade perfusion sheath to follow the start of extracorporeal flow in urgent cases. The fluoroscopic wire check protects against the cannula being driven into an intracardiac structure, the wet connection prevents air embolism, and separate groins avoid venous congestion; none of these is optional.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cp-complex-patients-q9",
      stem: "A self-expanding valve has a commissural post directly in front of a low left main ostium, and the sinus of Valsalva is narrow. What does Brilakis's section predict, and what is the approach if selective access is needed?",
      options: [
        "The easiest case: a JL4 will engage coaxially because the post guides the catheter towards the ostium",
        "Coronary obstruction is certain in this anatomy, so the patient needs surgical revascularisation rather than any attempt at PCI",
        "The hardest case: wire the coronary through the frame, then rail the guide or a guide extension into the ostium",
        "A moderate case: an extra back-up guide crossing the frame at an acute angle gives the best support",
      ],
      answer: 2,
      explanation:
        "Brilakis calls a commissure over a low ostium in a narrow sinus the most difficult scenario: a narrow sinus forces an acute catheter angle and may allow only a non-selective injection; selective access needs a coronary wire first, then the guide or a guide extension railed into the ostium. Extra back-up guides crossing at an acute angle are the ones reported to kink and become trapped. Difficult access is not obstruction.",
      difficulty: 3,
      refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
    },
    {
      id: "cp-complex-patients-q10",
      stem: "Which statement about physiology and imaging in a patient with severe aortic stenosis awaiting TAVI is correct according to Brilakis?",
      options: [
        "FFR rises after TAVI, so FFR measured before TAVI overestimates the severity of a stenosis",
        "iFR falls after TAVI while FFR is unchanged, so iFR before TAVI underestimates the stenosis",
        "FFR falls after TAVI as hyperaemic flow rises, so FFR before TAVI may underestimate the stenosis",
        "Both indices are unchanged by TAVI, so either can be used without caution in severe aortic stenosis",
      ],
      answer: 2,
      explanation:
        "Brilakis: after TAVI, hyperaemic flow increases and FFR drops while iFR is unchanged, so in severe aortic stenosis an FFR value may understate the stenosis and is used with caution. Oxford also lists aortic stenosis among settings with limited FFR validation.",
      difficulty: 2,
      refs: [...BOOKS, "ahmad-tavr-physiology-2018"],
    },
    {
      id: "cp-complex-patients-q11",
      stem: "A self-expanding valve sits high, with the covered skirt above the left main ostium. Which statement fits Brilakis's account?",
      options: [
        "A high implant usually obstructs the coronary ostium, so bail-out chimney stenting of the left main is the first step to take",
        "The coronary is usually not obstructed, but selective access needs a diamond above the ostium and a short-tipped JR4",
        "A high implant makes engagement easier, because the frame and skirt no longer cross the level of the ostium at all",
        "Only a balloon-expandable valve-in-valve procedure can restore selective coronary access after a high implant of this kind",
      ],
      answer: 1,
      explanation:
        "A high self-expanding implant rarely blocks the ostium, because its waist is slim and the sinus leaves room. The difficulty is reaching the ostium, which now lies below the covered skirt and the leaflets: enter through a cell above it with a JR4-type catheter that has little curve and a short tip, and use that approach for the left main too.",
      difficulty: 3,
      refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
    },
    {
      id: "cp-complex-patients-q12",
      stem: "A patient dies in the lab after a prolonged resuscitation following a coronary dissection. Which set of actions does Oxford describe?",
      options: [
        "Explain events to the next of kin, inform the manager and coroner, document times, staff, kit and mechanism, and debrief",
        "Wait for the post-mortem result before speaking to the family, so that the explanation they receive is accurate and complete",
        "Complete the list as planned to avoid disruption, and debrief the team at the next monthly meeting",
        "Document only the final rhythm and the time of death, since detailed individual staff notes increase the risk of litigation",
      ],
      answer: 0,
      explanation:
        "Oxford: contact the next of kin and explain the course of events (good communication often prevents complaints and litigation), report to the department manager and coroner, complete an adverse incident form for an iatrogenic complication, request a post-mortem if death is unexplained, and have staff write clear notes of times, personnel, equipment and the perceived mechanism. The cardiologist makes time for staff to talk and may postpone the rest of the list.",
      difficulty: 1,
      refs: OXFORD,
    },
  ],
  sims: [
    { sim: "haemo", task: "Shock before PCI: measure RA, PA, wedge and cardiac output, calculate CPO and PAPi, and classify the profile." },
    { sim: "impella", task: "After culprit PCI, use CPO and PAPi to decide between weaning, right-sided support and escalation." },
    { sim: "ecmo", task: "VA-ECMO under CPR: right femoral vein and left femoral artery, wire positions checked on fluoroscopy, wet connection, then leg perfusion." },
    { sim: "cathlab", task: "Engage with catheter choices for a valve frame (JL3.5, short-tipped JR4, AR2) and practise withdrawing on damping before VF can follow an injection." },
    { sim: "tavi", task: "Read coronary heights, sinus widths and the sinotubular junction on CT, and predict how hard later coronary access will be." },
  ],
  caseIds: ["cp-complex-patients-case-arrest-shock", "cp-complex-patients-case-tavr-stemi"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cp-complex-patients-case-arrest-shock",
    title: "Resuscitated, then in shock: an anterior STEMI from the ambulance to intensive care",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI, 24.2, 14.1, 20.5, 20.7 and 28.1; Oxford Handbook, chapter 8 (cardiac arrest in STEMI, primary PCI in cardiogenic shock) and chapter 9 (cardioversion/defibrillation); CULPRIT-SHOCK; the National Cardiogenic Shock Initiative protocol",
    },
    summary:
      "A man resuscitated from VF arrest with an anterior STEMI develops cardiogenic shock. The case follows the decision to go to the lab, access, measurement, the culprit, the support decision and the handover.",
    presentation:
      "A 58-year-old man collapsed at a railway station. Bystander CPR was started at once; the ambulance crew gave two shocks for VF and he had a pulse 7 minutes after the collapse. On arrival he is awake and follows commands (not intubated). The ECG shows persistent anterior ST elevation.",
    findings: [
      "Heart rate 118 bpm, blood pressure 84/56 mmHg on noradrenaline started by the crew",
      "Cold peripheries, lactate 5.4 mmol/L, oxygen saturation 95% on 4 L/min",
      "Weak right radial pulse; both femoral pulses palpable",
      "No anticoagulant; no previous cardiac history",
    ],
    steps: [
      {
        id: "decide",
        prompt: "Where does he go first?",
        options: [
          {
            text: "Straight to the lab for primary PCI, activating the shock team on the way",
            best: true,
            feedback: "Persistent ST elevation after resuscitation means primary PCI (Oxford; 2023 ESC class I). He is in shock, so the shock team (interventional and heart failure cardiologists, the cardiac surgeon and the intensivist) is called with one call.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Intensive care first, with angiography once he is stable, as the arrest trials showed",
            feedback: "COACT and TOMAHAWK studied resuscitated patients without ST elevation who were stable. He has persistent ST elevation and shock.",
            next: "c-delay",
            stateDelta: { stability: -15, flags: ["delayed"] },
          },
          {
            text: "CT of the head and chest first, then decide",
            feedback: "Persistent ST elevation after return of circulation sends him for emergency angiography and primary PCI (Oxford; 2023 ESC class I); CT first only delays reperfusion.",
            next: "c-delay",
            stateDelta: { stability: -10, flags: ["delayed"] },
          },
        ],
      },
      {
        id: "c-delay",
        kind: "consequence",
        prompt: "Forty minutes later his lactate is 7.1 mmol/L and the noradrenaline dose has doubled. The ST elevation persists. What now?",
        options: [
          {
            text: "Take him to the lab now for primary PCI with the shock team",
            best: true,
            feedback: "Brilakis stresses finding shock before it becomes refractory and metabolic; every hour of delay pushes him there.",
          },
          {
            text: "Add an inotrope and wait for the lactate to fall",
            feedback: "Drugs raise oxygen demand and arrhythmias; they do not open the artery.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "access",
        prompt: "In the lab, how do you get in?",
        options: [
          {
            text: "Right femoral artery under ultrasound and fluoroscopy, a femoral venous sheath, and a look at the femoral artery for a possible pump",
            best: true,
            feedback: "Brilakis: femoral access may be preferred in shock; the shock protocol he reproduces asks for guided femoral arterial access and venous access for haemodynamics.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Left radial for the coronaries, with an early ultrasound-guided femoral sheath kept for the pump and a venous sheath",
            acceptable: true,
            feedback: "A workable plan (it is the one the Academy lesson mcs-shock-management teaches, and radial is the general standard in ACS), provided the femoral route is placed now. With a weak pulse on noradrenaline after an arrest, spasm is likely (Brilakis), so femoral for everything is the simpler choice here.",
          },
          {
            text: "Right radial only, with extra nitrate for the weak pulse and no femoral route planned",
            feedback: "Vasopressors and arrest are risk factors for radial spasm (Brilakis); the wrist may delay reperfusion and does not give you a route for support.",
            next: "c-spasm",
            stateDelta: { stability: -10, flags: ["radial-spasm"] },
          },
          {
            text: "Femoral artery by palpation only, to save time",
            acceptable: true,
            feedback: "Femoral is right, but a guided puncture matters most in the artery a large-bore device may use.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-spasm",
        kind: "consequence",
        prompt: "The radial artery goes into spasm; the wire will not pass the forearm after 12 minutes. What now?",
        options: [
          {
            text: "Convert to femoral arterial access under ultrasound now, and add a venous sheath",
            best: true,
            feedback: "Switch promptly when the wrist delays reperfusion; time is muscle.",
          },
          {
            text: "Keep trying with more vasodilator and sedation",
            feedback: "More time lost, in a patient whose shock is deepening.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "measure",
        prompt: "Pulmonary artery catheter numbers: MAP 60 mmHg, cardiac output 3.1 L/min (index 1.7), PA 42/26 mmHg, RA 9 mmHg, wedge 27 mmHg. Saturation 95%. What is the profile, and what do you do next?",
        variants: [{ flag: "radial-spasm", info: "The numbers are obtained about 15 minutes later than they would have been from the groin (12 minutes of radial attempts plus the conversion)." }],
        options: [
          {
            text: "LV-dominant shock (CPO about 0.41 W, PAPi about 1.8); with the shock team, plan a microaxial pump before PCI as the protocol suggests, then image the left coronary",
            best: true,
            feedback: "CPO = 60 × 3.1 ÷ 451 ≈ 0.41 W; PAPi = 16 ÷ 9 ≈ 1.8. The RV is coping, the LV is failing, and there is no hypoxaemia. The NCSI protocol places the pump before PCI when the index is below 2.2; DanGer Shock, which excluded comatose survivors (he is awake), placed it before PCI too. The decision is the team's.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Insert a balloon pump routinely before PCI",
            feedback: "IABP-SHOCK II showed no mortality benefit from routine balloon pumping, and Oxford does not recommend it routinely.",
            next: "c-iabp",
            stateDelta: { stability: -10 },
          },
          {
            text: "Start VA-ECMO now, because the cardiac index is very low",
            feedback: "In Brilakis's algorithm VA-ECMO is for hypoxaemia, biventricular failure or arrest; routine early VA-ECMO did not lower mortality in ECLS-SHOCK and caused more bleeding and vascular complications.",
            next: "c-iabp",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-iabp",
        kind: "consequence",
        prompt: "The shock team questions the device choice. Which profile would make VA-ECMO the logical device in Brilakis's algorithm?",
        options: [
          {
            text: "Hypoxaemia, biventricular failure or cardiac arrest",
            best: true,
            feedback: "Otherwise, LV-dominant shock points to a left-sided microaxial pump if support is used.",
          },
          {
            text: "Any cardiac index below 2.0 L/min/m²",
            feedback: "The index alone does not choose the device; the ventricle and the oxygenation do.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "culprit",
        prompt: "The proximal LAD is occluded with thrombus. The RCA has an 85% mid stenosis and the circumflex a 70% lesion. The LAD is wired and stented with TIMI 2 flow. What next?",
        options: [
          {
            text: "Consider intracoronary vasodilators for the slow flow, then stop: culprit only, the other lesions staged after recovery",
            best: true,
            feedback: "The protocol considers intracoronary vasodilators when TIMI 3 flow is not achieved. CULPRIT-SHOCK and both manuals support culprit-only PCI in shock; Brilakis stages the rest later.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent the RCA and circumflex now while the pump is supporting him",
            feedback: "Immediate multivessel PCI did worse at 30 days in CULPRIT-SHOCK.",
            next: "c-multivessel",
            stateDelta: { stability: -15, flags: ["multivessel"] },
          },
          {
            text: "Measure FFR in the RCA and circumflex to decide",
            feedback: "FFR depends on coronary afterload and may be inaccurate in shock (Brilakis); in any case non-culprit lesions are staged.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-multivessel",
        kind: "consequence",
        prompt: "After two more stents his lactate rises again and the noradrenaline dose has to be increased. What lesson does the trial teach?",
        options: [
          {
            text: "Immediate multivessel PCI in shock raised death or renal replacement therapy at 30 days; culprit-only is the strategy",
            best: true,
            feedback: "In CULPRIT-SHOCK, immediate multivessel PCI increased the composite of death or renal replacement therapy at 30 days, driven mainly by mortality (relative risk of death with culprit-only PCI 0.84); the difference in renal replacement therapy alone was not significant.",
          },
          {
            text: "Renal failure is unrelated to the strategy; multivessel PCI remains right",
            feedback: "The trial says otherwise: the strategy itself mattered, and immediate multivessel PCI did worse on death or renal replacement therapy at 30 days.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "after",
        prompt: "After PCI: MAP 72 mmHg, cardiac output 4.5 L/min, PA 32/24 mmHg, RA 17 mmHg, on low-dose noradrenaline. What do you do before he leaves the lab?",
        options: [
          {
            text: "Recognise possible RV failure (CPO about 0.72 W, PAPi about 0.5), discuss right-sided support, and image the cannulated femoral artery with Doppler of the leg",
            best: true,
            feedback: "CPO above 0.6 with PAPi below 0.9: the NCSI protocol suggests right-sided support if RV dysfunction is suspected clinically. It also asks for a femoral angiogram and Doppler of the affected leg before leaving the lab.",
            stateDelta: { stability: 5 },
          },
          {
            text: "CPO is above 0.6 W, so remove the pump and stop the noradrenaline in the lab",
            feedback: "Removal needs PAPi above 0.9 as well as CPO above 0.6, with the patient off all inotropes and vasopressors.",
            stateDelta: { stability: -15, flags: ["early-removal"] },
          },
          {
            text: "Increase the pump speed to bring the RA pressure down",
            feedback: "A left-sided pump depends on the RV to fill it; it cannot treat RV failure.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "handover",
        prompt: "What goes into the handover to intensive care?",
        options: [
          {
            text: "Daily haemodynamic and vascular checks, haemolysis watch, removal criteria, a 3–5 day recovery review and the staged plan for the RCA and circumflex",
            best: true,
            feedback: "These are the NCSI intensive care, weaning and bridge-to-decision steps, plus Brilakis's staged revascularisation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Plan complete revascularisation within 45 days as for any STEMI",
            acceptable: true,
            feedback: "Staging is right, but the 45-day window comes from stable STEMI trials; after shock no window is set and timing follows recovery.",
          },
        ],
      },
    ],
    outcome:
      "The pump was placed before PCI and the LAD treated alone. Right-sided support was discussed and added for 48 hours. He came off noradrenaline on day 2, the devices were removed on day 4, and his RCA and circumflex lesions were reassessed and treated at a staged procedure before discharge.",
    outcomeVariants: [
      { flag: "delayed", text: "The delay before the lab let the lactate rise and the drug doses double; the shock was deeper by the time the artery was opened." },
      { flag: "multivessel", text: "Immediate multivessel PCI was followed by a rising lactate and a higher noradrenaline dose; in CULPRIT-SHOCK this strategy did worse at 30 days, mainly through more deaths." },
      { flag: "early-removal", text: "The pump was removed too early and he became hypotensive within an hour, needing re-insertion through a new puncture." },
      { flag: "radial-spasm", text: "Radial spasm cost about 15 minutes (12 minutes of attempts plus the conversion) before the femoral route was used." },
    ],
    learningPoints: [
      "Resuscitated with persistent ST elevation: primary PCI, with the shock team called at once.",
      "Femoral arterial access under guidance plus venous access in shock; vasopressors and arrest predispose to radial spasm.",
      "Measure first: CPO and PAPi choose the device and, after PCI, the next step.",
      "Culprit only in shock; intracoronary vasodilators if flow is slow; stage the rest after recovery.",
      "Consider removing the pump only off all inotropes and vasopressors, with CPO above 0.6 and PAPi above 0.9; check the cannulated leg before leaving the lab.",
    ],
    refs: [...BOOKS, "culprit-shock-2017", "basir-ncsi-2019", "danger-shock-2024", "iabp-shock-ii-2012", "ecls-shock-2023", "licordari-esc-acs-2024"],
  },
  {
    id: "cp-complex-patients-case-tavr-stemi",
    title: "STEMI three years after a self-expanding TAVI",
    trackId: "complex-pci",
    stage: 5,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, 24.1 (TAVR patients) with 20.5 and 1.5; Yudi and colleagues (JACC 2018); Harhash and colleagues (JACC Cardiovasc Interv 2016)",
    },
    summary:
      "An anterior STEMI in a woman with a supra-annular self-expanding valve implanted high: planning without CT, entering the frame, avoiding guide entrapment and what to do if it happens, and wiring before engagement.",
    presentation:
      "An 81-year-old woman had a self-expanding supra-annular TAVI three years ago. She presents with 90 minutes of chest pain and anterior ST elevation. Blood pressure 118/70 mmHg, heart rate 92 bpm. The implant report mentions a 'slightly high implant'.",
    findings: [
      "Creatinine 128 µmol/L",
      "Final aortogram from the TAVI available on the system",
      "No CT angiogram since the TAVI",
      "Both femoral pulses palpable",
    ],
    steps: [
      {
        id: "plan",
        prompt: "How do you plan the procedure?",
        options: [
          {
            text: "Go to the lab now; on the way review the implant report and final aortogram, and plan femoral access",
            best: true,
            feedback: "Brilakis: CT cannot be done in urgent cases such as an ACS, adds contrast and may not show the commissures; femoral access may be preferred because engagement is often difficult.",
            stateDelta: { stability: 5 },
          },
          {
            text: "CT angiography first, to see where the commissural posts lie",
            feedback: "That delays reperfusion and adds contrast, and motion may hide the posts anyway.",
            next: "c-ct",
            stateDelta: { stability: -10, flags: ["ct-delay"] },
          },
        ],
      },
      {
        id: "c-ct",
        kind: "consequence",
        prompt: "The CT took 35 minutes and the posts are blurred by motion. Her pain continues. What now?",
        options: [
          {
            text: "Go to the lab and engage with the fluoroscopic anatomy",
            best: true,
            feedback: "Fluoroscopy of the frame and the aortogram give you what you need for the first attempts.",
          },
          {
            text: "Repeat the CT with a higher heart-rate-control dose",
            feedback: "More delay and more contrast.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "left",
        prompt: "On fluoroscopy the covered skirt ends above the expected left main ostium. A JL4 outside the frame cannot reach it. What next?",
        options: [
          {
            text: "Enter through a frame cell above the ostium with a short-tipped JR4",
            best: true,
            feedback: "With a high implant, selective access has to come from a diamond above the ostium; Brilakis suggests a straighter, short-tipped catheter such as a JR4, even for the left main.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance an extra back-up 3.5 guide through the frame, accepting a steep angle to reach the ostium",
            feedback: "Extra back-up guides crossing the frame at an acute angle have kinked and become trapped.",
            next: "c-trapped",
            stateDelta: { stability: -15, flags: ["entrapment"] },
          },
          {
            text: "Change to a JL5 so the tip can reach further",
            feedback: "A bigger curve still has to get past the skirt, which lies above the ostium.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-trapped",
        kind: "consequence",
        prompt: "The guide has kinked in a frame cell and will not withdraw. A workhorse wire is already in the LAD. What do you do?",
        options: [
          {
            text: "Use a balloon over the wire to back the guide out of the ostium, then re-cross perpendicularly at the ostial level",
            best: true,
            feedback: "Backing out of the ostium over a balloon or wire, crossing perpendicularly and choosing catheters of favourable geometry are the three measures Brilakis gives to minimise entrapment; they are preventive advice rather than a tested rescue, but backing out over hardware is the one he names for leaving the ostium.",
          },
          {
            text: "Apply strong torque while pulling",
            feedback: "Nothing in the source supports force here, and the case Brilakis reproduces ended in left main and LAD dissection; back out over the hardware instead.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "engage",
        prompt: "From the diamond above the ostium the JR4 gives a non-selective picture: the LAD is occluded proximally. The catheter will not sit coaxially. What next?",
        options: [
          {
            text: "Wire the left main and LAD first, then rail the guide or a guide extension into the ostium",
            best: true,
            feedback: "Brilakis: wiring may be needed before full engagement; with a difficult angle, the wire lets the guide or an extension follow into the ostium.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push the JR4 deep into the left main to get support",
            feedback: "Engagement should be coaxial with extreme care and without deep intubation.",
            next: "c-deep",
            stateDelta: { stability: -10, flags: ["deep"] },
          },
        ],
      },
      {
        id: "c-deep",
        kind: "consequence",
        prompt: "The pressure damps and she becomes hypotensive. What now?",
        options: [
          {
            text: "Withdraw to restore the pressure, then wire first and rail a guide extension",
            best: true,
            feedback: "A catheter obstructing flow causes ischaemia, hypotension and arrhythmia; withdraw before anything else.",
          },
          {
            text: "Inject to see what is happening",
            feedback: "Brilakis warns that injecting with a damped waveform can cause coronary or aorto-coronary dissection and air embolism.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "prep",
        prompt: "The LAD lesion is heavily calcified once flow is restored. How do you proceed?",
        options: [
          {
            text: "Prepare the lesion meticulously, with intravascular imaging to guide it, before stenting",
            best: true,
            feedback: "Brilakis notes that prior TAVR patients often have severe calcification and occlusions that need meticulous preparation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent directly to limit time in a difficult engagement",
            feedback: "An underexpanded stent in a calcified artery is a poor reward for the effort of access.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "report",
        prompt: "The LAD is stented with a good result. What goes into the report?",
        options: [
          {
            text: "The valve, the frame cell and angle used, the catheters that worked and those that did not, and the plan for other lesions",
            best: true,
            feedback: "The next operator, possibly in another ACS, will start from your report.",
            stateDelta: { stability: 5 },
          },
          {
            text: "The stent details only",
            acceptable: true,
            feedback: "Necessary but not enough: how you got in is the most valuable information for next time.",
          },
        ],
      },
    ],
    outcome: "The LAD was stented through a frame cell above the ostium after wiring first. She was discharged on day 4.",
    outcomeVariants: [
      { flag: "ct-delay", text: "The CT added 35 minutes of ischaemia and contrast without showing the commissural posts." },
      { flag: "entrapment", text: "The extra back-up guide kinked in a frame cell; it was eventually backed out over a balloon and exchanged, at a cost of 15 minutes and a real risk of left main injury." },
      { flag: "deep", text: "Deep intubation caused damping and hypotension before the guide was withdrawn." },
    ],
    learningPoints: [
      "In an ACS after TAVI, do not wait for CT; use the implant report and fluoroscopy, and favour femoral access.",
      "High self-expanding implant: enter through a diamond above the ostium with a short-tipped JR4.",
      "Avoid entrapment: cross perpendicularly at the ostial level, use favourable shapes, back out over a balloon or wire.",
      "Coaxial, not deep; wire first and rail the guide or an extension when the angle is hard.",
      "Expect calcium; record how access was achieved.",
    ],
    refs: [...BRILAKIS, "yudi-tavr-reaccess-2018", "harhash-tavr-entrapment-2016"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-shock-one-call-team",
    lab: "pci",
    when: { phase: ["plan"], event: ["hypotension"] },
    title: "Suspected shock: one call brings the team",
    text: "If hypotension with hypoperfusion suggests cardiogenic shock, activate the shock team with a single call: interventional cardiology, cardiac surgery, advanced heart failure and critical care. Infarct-related shock needs a right heart study, angiography with revascularisation, and a look at the access arteries.",
    tone: "do",
    lessonId: "cp-complex-patients-shock-setup",
    sources: [B("24.2")],
    refs: [...BRILAKIS, "tehrani-shock-team-2019"],
  },
  {
    id: "access-shock-femoral-and-vein",
    lab: "access",
    when: { phase: ["plan"], event: ["hypotension"] },
    title: "Shock: guided femoral artery plus a venous sheath",
    text: "In cardiogenic shock Brilakis says femoral access may be preferred, because support is often needed and the anatomy must be seen quickly. Puncture the femoral artery under ultrasound and fluoroscopy, add femoral or jugular venous access for haemodynamics, and remember that vasopressors and arrest predispose to radial spasm.",
    tone: "do",
    lessonId: "cp-complex-patients-shock-setup",
    sources: [B("24.2"), B("4.3"), O("ch 8: Primary PCI")],
    refs: [...BOOKS, "basir-ncsi-2019"],
  },
  {
    id: "haemo-shock-measure-first",
    lab: "haemo",
    when: { phase: ["right-heart"], event: ["hypotension"] },
    title: "Shock: numbers before the coronary injections",
    text: "Obtain RA, PA and wedge pressures and a cardiac output before the coronary study, and leave the catheter in. A wedge above 18 mmHg suggests LV failure and a PAPi below 0.9 RV failure; a wedge above 25 mmHg with mixed venous saturation below 50% predicts pulmonary oedema and shock during the case.",
    tone: "do",
    lessonId: "cp-complex-patients-shock-setup",
    sources: [B("14.1"), B("24.2")],
    refs: [...BRILAKIS, "korabathina-papi-2012"],
  },
  {
    id: "mcs-shock-support-before-pci",
    lab: "mcs",
    when: { phase: ["select"], event: ["hypotension"], procedure: ["iabp", "impella", "ecmo"] },
    title: "Shock: support before PCI is a team decision on the numbers",
    text: "In infarct-related shock, decide with the shock team whether support goes in before or after PCI. The protocol Brilakis reproduces places a microaxial pump before PCI when LVEDP is above 15 mmHg or the cardiac index below 2.2 L/min/m² and the anatomy suits, in patients without its exclusions (for example a mechanical aortic valve, known LV thrombus, active bleeding or a contraindication to anticoagulation); DanGer Shock also placed the pump before PCI but excluded patients comatose after out-of-hospital arrest. Routine balloon pumping is not recommended.",
    tone: "do",
    lessonId: "cp-complex-patients-shock-culprit",
    sources: [B("24.2"), O("ch 8: Primary PCI in cardiogenic shock")],
    refs: [...BOOKS, "basir-ncsi-2019", "danger-shock-2024", "iabp-shock-ii-2012"],
  },
  {
    id: "pci-shock-each-true-culprit",
    lab: "pci",
    when: { phase: ["plan"], event: ["hypotension"] },
    title: "Shock: name the culprit before you wire",
    text: "Use the angiogram (occlusion with thrombus, slow flow, haziness, collaterals, distal embolic occlusions), the ECG, the ventriculogram or echo and, if needed, OCT. Few shock patients have more than one culprit; treat each true culprit and leave everything else for a staged procedure.",
    tone: "do",
    lessonId: "cp-complex-patients-shock-culprit",
    sources: [B("24.2"), B("20.7")],
    refs: BRILAKIS,
  },
  {
    id: "pci-shock-chronic-not-culprit",
    lab: "pci",
    when: { phase: ["wire"], event: ["hypotension"] },
    title: "Shock and a wire that will not cross: is this the culprit?",
    text: "In an ACS, a wire that will not cross may be in a chronic occlusion rather than the culprit. Review the films and the ECG territory and look for thrombus or ulceration with imaging. In infarct-related cardiogenic shock, do not attempt a chronic occlusion at the index procedure.",
    tone: "caution",
    lessonId: "cp-complex-patients-shock-culprit",
    sources: [B("20.8"), B("24.2")],
    refs: [...BRILAKIS, "basir-ncsi-2019"],
  },
  {
    id: "diag-ohca-ecg-sorts",
    lab: "diagnostic",
    when: { phase: ["setup"], event: ["st-elevation"], requires: ["post-arrest"] },
    title: "Only after a resuscitated arrest: the ECG decides the timing",
    text: "If this patient was resuscitated from a cardiac arrest: persistent ST elevation means primary PCI, whether or not the patient responds. Without ST elevation in a stable patient, routine immediate angiography is not recommended (2023 ESC, after COACT and TOMAHAWK); repeat the ECG before deciding.",
    tone: "do",
    lessonId: "cp-complex-patients-ohca",
    sources: [O("ch 8: Cardiac arrest in STEMI")],
    refs: [...OXFORD, "coact-2019", "tomahawk-2021", "licordari-esc-acs-2024"],
  },
  {
    id: "access-arrest-radial-spasm",
    lab: "access",
    when: { phase: ["plan"], route: ["radial"], event: ["hypotension"] },
    alsoIn: [{ lab: "diagnostic", phase: ["setup", "advance"] }],
    title: "After arrest or on vasopressors, expect radial spasm",
    text: "Brilakis lists intravenous vasopressors and cardiac arrest among the risk factors for radial spasm. If support may be needed, start femoral under ultrasound; if you start radially and it spasms, switch early rather than delay reperfusion.",
    tone: "caution",
    lessonId: "cp-complex-patients-ohca",
    sources: [B("4.3"), B("24.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-arrest-defib-settings",
    lab: "pci",
    when: { event: ["vf"] },
    title: "VF: unsynchronised, high energy, check the settings",
    text: "Shock unsynchronised at high energy straight away (typically 150–200 J biphasic or 200–360 J monophasic) with pads over the sternum and apex. If shocks keep failing, check the defibrillator settings (VF needs the unsynchronised mode) and consider a different defibrillator.",
    tone: "bailout",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [O("ch 9: Cardioversion/defibrillation"), O("ch 10: Arrhythmia")],
    refs: OXFORD,
  },
  {
    id: "pci-arrest-adenosine-cough",
    lab: "pci",
    when: { phase: ["physiology"], event: ["vf"] },
    title: "Torsades or VF after adenosine: cough, then shock",
    text: "Intracoronary adenosine can trigger torsades or VF, usually after a pause (R on T) but sometimes without one. Have a conscious patient keep coughing hard while the defibrillator charges; repeated coughs can sustain cerebral perfusion long enough to stay awake until the shock. Prevent it by giving adenosine slowly and avoiding high doses in the RCA.",
    tone: "bailout",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [B("3.2")],
    refs: BRILAKIS,
  },
  {
    id: "diag-vf-catheter-cause",
    lab: "diagnostic",
    when: { phase: ["inject"], event: ["vf"] },
    title: "VF after an injection: move the catheter before the next one",
    text: "After the shock, look at what the catheter was doing: damping, a plugged small vessel, a conus run or contrast that did not clear. Withdraw from the ostium so flow and clearance return, then re-engage carefully or with a smaller catheter.",
    tone: "bailout",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [B("6.5"), B("15.1"), O("ch 10: Arrhythmia"), O("ch 6: Common pitfalls")],
    refs: BOOKS,
  },
  {
    id: "pci-arrest-tamponade-drain",
    lab: "pci",
    when: { phase: ["complication"], event: ["perforation", "hypotension"] },
    title: "Arrest from suspected tamponade: drain now",
    text: "If tamponade is known or suspected to have caused the arrest, drain the pericardium straight away; echo comes first only in less critical cases. After PCI a small volume of blood can compress a single chamber and make the drainage harder, so guide the needle with fluoroscopy and pressure monitoring (and echo if it is immediately to hand) without delaying it.",
    tone: "bailout",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [O("ch 9: Pericardiocentesis")],
    refs: OXFORD,
  },
  {
    id: "mcs-ecpr-check-before-cannulating",
    lab: "mcs",
    when: { phase: ["select"], event: ["vf"], procedure: ["ecmo"] },
    title: "Before VA-ECMO in an arrest: three contraindications",
    text: "Check for severe aortic regurgitation, aortic dissection and uncontrolled bleeding, which Brilakis lists as contraindications to VA-ECMO (it can run briefly without anticoagulation in a bleeding patient). A review of arrest in the lab that he cites notes that a balloon pump is ineffective in arrest.",
    tone: "caution",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [B("14.1")],
    refs: [...BRILAKIS, "yadav-cath-lab-arrest-2018"],
  },
  {
    id: "mcs-ecpr-cannulate-under-cpr",
    lab: "mcs",
    when: { phase: ["insert"], event: ["vf"], procedure: ["ecmo"] },
    title: "Cannulating during CPR: what to skip, what never to skip",
    text: "In an emergency, omit the femoral angiogram and place the leg perfusion sheath after flow starts. Never skip the fluoroscopic check that the venous wire is in the superior vena cava and the arterial wire in the thoracic aorta, or the wet, bubble-free connection.",
    tone: "do",
    lessonId: "cp-complex-patients-lab-arrest",
    sources: [B("14.5")],
    refs: BRILAKIS,
  },
  {
    id: "haemo-as-slow-rise-not-damping",
    lab: "haemo",
    when: { phase: ["valves"], requires: ["aortic-stenosis"] },
    alsoIn: [{ lab: "diagnostic", phase: ["lv-aorta"] }],
    title: "Severe aortic stenosis: a slow small pulse is not damping",
    text: "With severe aortic stenosis the aortic trace can look damped when it is the slow-rising, low pulse of the valve. True damping still happens, and side-hole catheters can hide it at the tip, so check engagement before blaming the valve.",
    tone: "caution",
    lessonId: "cp-complex-patients-tavr-before",
    sources: [B("5.6")],
    refs: BRILAKIS,
  },
  {
    id: "diag-as-high-flow-fill",
    lab: "diagnostic",
    when: { event: ["contrast-streaming"] },
    title: "High-flow states: a small catheter may not fill the artery",
    text: "Severe aortic stenosis (also hypertrophic obstructive and dilated cardiomyopathy, or an arteriovenous fistula) raises coronary flow and can defeat a small catheter. Use a larger lumen without side holes and inject more firmly; if it still will not fill, report the run as non-diagnostic rather than as a stenosis.",
    tone: "caution",
    lessonId: "cp-complex-patients-tavr-before",
    sources: [B("6.6")],
    refs: BRILAKIS,
  },
  {
    id: "structural-tavi-iliofemoral-run",
    lab: "structural",
    when: { phase: ["access"], procedure: ["tavi"] },
    alsoIn: [{ lab: "diagnostic", phase: ["lv-aorta", "finish"] }],
    title: "Work-up iliofemoral run: graded pigtail, table up, both femoral heads",
    text: "Place a graded pigtail just above the aortic bifurcation, raise the table, check that it can pan to both femoral heads, and inject by pump (for example 20 mL at 20 mL per second). If the iliofemoral arteries are badly diseased, image the subclavian and axillary arteries too.",
    tone: "do",
    lessonId: "cp-complex-patients-tavr-before",
    sources: [O("ch 5: TAVI work-up")],
    refs: OXFORD,
  },
  {
    id: "structural-tavr-plan-reaccess",
    lab: "structural",
    when: { phase: ["plan", "deploy"], procedure: ["tavi"] },
    title: "Plan the next coronary angiogram now",
    text: "Coronary re-access after TAVI depends on the sinotubular junction, sinus height and width, leaflet length and bulk and coronary height, and on commissural post orientation, skirt height and implant depth. Self-expanding frames that extend above the ostia make it hardest.",
    tone: "do",
    lessonId: "cp-complex-patients-tavr-before",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
  },
  {
    id: "diag-tavr-left-catheter",
    lab: "diagnostic",
    when: { phase: ["engage-left"], catheter: ["JL"], event: ["engage-fail"] },
    title: "Through a TAVI frame: smaller JL, or a short JR4 from above",
    text: "If the patient has a transcatheter valve, smaller Judkins curves (JL3.5 or JL3) are often used for the left main. If a self-expanding valve sits high with its skirt above the ostium, enter through a diamond above it with a short-tipped JR4.",
    tone: "do",
    lessonId: "cp-complex-patients-tavr-after",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
  },
  {
    id: "diag-tavr-cross-perpendicular",
    lab: "diagnostic",
    when: { phase: ["engage-left", "engage-right"], catheter: ["EBU", "AL"], event: ["catheter-kink"] },
    title: "Through a TAVI frame: cross at right angles, at ostial level",
    text: "Only if a transcatheter valve is in place: catheters crossing its frame at an acute angle have kinked and become trapped in its cells. Cross perpendicularly through a diamond level with the ostium, prefer a Judkins left for the left and an Amplatz right for the RCA, and back out over a balloon or wire.",
    tone: "caution",
    lessonId: "cp-complex-patients-tavr-after",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "harhash-tavr-entrapment-2016"],
  },
  {
    id: "diag-tavr-rca-wide-sinus",
    lab: "diagnostic",
    when: { phase: ["engage-right"], catheter: ["JR", "AR", "IKR"], event: ["engage-fail"] },
    title: "RCA through a TAVI frame: size up for a wide sinus",
    text: "Only if a transcatheter valve is in place: a JR4 or Ikari right usually reaches the RCA through its frame. A wide sinus puts the ostium further from the frame: change to a JR4.5, JR5 or AR2.",
    tone: "do",
    lessonId: "cp-complex-patients-tavr-after",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
  },
  {
    id: "pci-tavr-guide-trapped",
    lab: "pci",
    when: { phase: ["guide"], event: ["equipment-entrapment"] },
    alsoIn: [{ lab: "diagnostic", phase: ["engage-left", "engage-right"] }],
    title: "Guide caught in a valve frame: back it out over hardware",
    text: "Only if a transcatheter valve is in place: Brilakis's measures to minimise entrapment are to cross at right angles through a cell at ostial level, to choose shapes of favourable geometry, and to back the catheter out of the ostium over a balloon, a wire or both. These are preventive measures, not a tested rescue; if a guide kinks or catches in the frame, back it out over hardware rather than by force (teaching advice). The case he reproduces ended in left main and LAD dissection.",
    tone: "bailout",
    lessonId: "cp-complex-patients-tavr-after",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "harhash-tavr-entrapment-2016"],
  },
  {
    id: "pci-tavr-wire-then-rail",
    lab: "pci",
    when: { phase: ["guide", "wire"], event: ["non-coaxial", "poor-guide-support"] },
    alsoIn: [{ lab: "diagnostic", phase: ["engage-left", "engage-right"] }],
    title: "Cannot sit coaxially through a valve frame: wire first",
    text: "Only if a transcatheter valve is in place: aim for a coaxial position without deep intubation. If the angle allows only a non-selective position, wire the coronary first and rail the guide or a guide extension into the ostium.",
    tone: "do",
    lessonId: "cp-complex-patients-tavr-after",
    sources: [B("24.1")],
    refs: [...BRILAKIS, "yudi-tavr-reaccess-2018"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "yudi-tavr-reaccess-2018",
    kind: "paper",
    citation:
      "Yudi MB, Sharma SK, Tang GHL, Kini A. Coronary angiography and percutaneous coronary intervention after transcatheter aortic valve replacement. J Am Coll Cardiol. 2018;71:1360–1378.",
    url: "https://doi.org/10.1016/j.jacc.2018.01.057",
    note: "PMID: 29566822. Checked on PubMed: authors, title, journal, year, volume 71, issue 12, pages 1360–1378; review. Abstract: technical difficulty with coronary re-engagement after TAVR, particularly with self-expanding valves that extend above the coronary ostia; geometric interactions between valves and ostia. Brilakis chapter 24, reference 1, and source of his Figs 24.1, 24.2, 24.3 and 24.5.",
    verified: true,
  },
  {
    id: "harhash-tavr-entrapment-2016",
    kind: "case",
    citation: "Harhash A, Ansari J, Mandel L, Kipperman R. STEMI after TAVR: procedural challenge and catastrophic outcome. JACC Cardiovasc Interv. 2016;9:1412–1413.",
    url: "https://doi.org/10.1016/j.jcin.2016.04.043",
    note: "PMID: 27388832. Checked on PubMed: authors, title, journal, year, volume 9, issue 13, pages 1412–1413 (no abstract). Case of guide catheter engagement at an acute angle through a TAVR frame with left main and LAD dissection, and an ex vivo simulation of extra back-up guide entrapment; reproduced by Brilakis as Fig 24.4 (chapter 24, reference 3).",
    verified: true,
  },
  {
    id: "thiele-culprit-shock-1y-2018",
    kind: "trial",
    citation: "Thiele H, Akin I, Sandri M, et al. One-year outcomes after PCI strategies in cardiogenic shock. N Engl J Med. 2018;379:1699–1710.",
    url: "https://doi.org/10.1056/NEJMoa1808788",
    note: "PMID: 30145971. Checked on PubMed: authors, title, journal, year, volume 379, issue 18, pages 1699–1710; abstract read. CULPRIT-SHOCK at 1 year: death 50.0% culprit-only vs 56.9% multivessel (RR 0.88, 95% CI 0.76–1.01); repeat revascularisation 32.3% vs 9.4%; heart failure rehospitalisation 5.2% vs 1.2%. Brilakis chapter 24, reference 13.",
    verified: true,
  },
  {
    id: "hochman-shock-longterm-2006",
    kind: "trial",
    citation: "Hochman JS, Sleeper LA, Webb JG, et al. Early revascularization and long-term survival in cardiogenic shock complicating acute myocardial infarction. JAMA. 2006;295:2511–2515.",
    url: "https://doi.org/10.1001/jama.295.21.2511",
    note: "PMID: 16757723; PMC1782030. Checked on PubMed: authors, title, journal, year, volume 295, issue 21, pages 2511–2515; abstract read. SHOCK trial long-term follow-up of 302 patients: 6-year survival 32.8% early revascularisation vs 19.6% initial medical stabilisation (HR 0.74). Brilakis chapter 24, reference 12.",
    verified: true,
  },
];
