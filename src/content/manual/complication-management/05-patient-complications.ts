// Module cm-patient-complications: hypotension, arrhythmia, radiation, kidneys and bleeding (manual curriculum,
// track complication-management).
// Sources: Brilakis, Manual of PCI: 2.2 (electrocardiogram), 2.5 (radiation dose), 2.6 (contrast volume), 3.2 (vasodilators:
// nitroglycerin, verapamil, adenosine), 3.3 (contrast media), 3.4 (anticoagulants), 3.5 (antiplatelet agents), 3.6
// (vasopressors), 3.7 (antiarrhythmics), 28.1 (hypotension), 28.2 (radiation skin injury), 28.3 (contrast-induced acute
// kidney injury), 29.1 (femoral access complications: bleeding and the retroperitoneal algorithm) and chapter 30 (30.2.5
// side-hole guides, 30.19 radiation protection, 30.21 contrast management), with related passages in 1.1, 1.3, 1.6 (planning:
// kidneys, metformin, prior skin injury, hydration), 6.3 and 6.5 (nitroglycerin hypotension, catheter-induced ischaemia),
// 11.1 (vagal reactions at sheath removal), 12.2 (adenosine in physiology), 15.1 (contrast that does not clear at an ostium),
// 17 (left main monitoring), 19.3 (bradycardia in atherectomy) and 26.2 (protamine after perforation);
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention: ch 1 (radiation safety, dose excess), ch 2 (the
// cardiologist, the physiologist, the radiographer), ch 3 (anticoagulation issues), ch 4 (contrast media, systemic vascular
// resistance), ch 9 (cardioversion/defibrillation) and ch 10 (risks, hypotension, cardiac tamponade with protamine, contrast
// reaction, vasovagal reaction, arrhythmia, vascular complications, renal failure, contrast nephropathy, cholesterol
// embolisation).
// New references (PubMed-checked) are in `refs` below.
// Every claim is listed with its page in docs/curriculum/evidence/cm-patient-complications.md.
// Neighbouring modules: pm-monitoring (the five checks for a false low pressure, the right heart catheter patterns, crisis
// roles), pm-lab-drugs (antiarrhythmic, atropine, pressor and contrast-reaction doses), pm-antithrombotics (heparin, ACT and
// protamine), pm-planning (contrast and dose ceilings at planning), cp-complex-patients (arrest on the table, cardiogenic
// shock), cm-perforation (tamponade and pericardiocentesis), cm-access-complications (groin haematoma, pseudoaneurysm,
// fistula, limb ischaemia and the radial complications). Academy lessons this module builds on: pci-after (monitoring and the
// hypotensive patient), fnd-ecg-arrhythmias, fnd-safety-contrast, comp-bleeding-contrast-aki and
// comp-stroke-arrhythmia-radiation.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

export const module: Module = {
  id: "cm-patient-complications",
  title: "Hypotension, arrhythmia, radiation, kidneys and bleeding",
  stage: 3,
  summary:
    "The complications that happen to the patient rather than to the artery: a pressure that falls, a rhythm that changes, a skin dose that climbs, a contrast load that threatens the kidneys, and bleeding that needs the anticoagulant undone. Each is taught as a sequence you can run at the table: confirm, classify, support, treat the cause, and plan the follow-up, with the habits that stop it happening in the first place.",
  objectives: [
    "Run the hypotension sequence aloud: exclude a false reading, sort the cause into hypovolaemia, pump failure or vasodilation, support perfusion while you look, and treat each cause the way Brilakis and Oxford describe.",
    "Recognise a vasovagal reaction from the order of its signs, treat it in seconds, and know the mimics (tamponade, retroperitoneal bleeding, anaphylaxis) that must be reconsidered when the patient does not recover within minutes.",
    "Link each lab arrhythmia to the manoeuvre that provokes it, prevent it, and deliver the right electrical or pharmacological treatment, synchronised or not.",
    "Track cumulative air kerma and dose rate, use the levers that lower them, apply the 5, 10 and 15 Gy follow-up rules, and handle a dose excess within the UK IR(ME)R framework.",
    "Set a contrast ceiling for each patient from renal function, recent exposures and weight, keep within it with contrast-sparing technique, and know where the books' rules differ.",
    "Prevent contrast-associated acute kidney injury before, during and after the case, and know which older preventive measures a later trial overturned.",
    "Manage major bleeding: resuscitate, reverse what can be reversed (and in the right order), find and stop the source, and decide about transfusion and antiplatelet therapy.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-hypotension",
      title: "Hypotension on the table: confirm, classify, support, treat",
      minutes: 16,
      topics: ["comp-hypotension-vasovagal"],
      sources: [B("28.1"), B("2.3"), B("3.2"), B("3.6"), B("6.3"), B("6.5"), B("17"), O("ch 10: Hypotension"), O("ch 10: Cardiac tamponade"), O("ch 4: Systemic vascular resistance")],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Oxford calls hypotension a common problem before, during and after catheterisation. Most often the patient is a little dry from fasting and is taking several drugs that lower the pressure, and a slow infusion of fluid is all that is needed. The danger is that the same number on the monitor can also mean tamponade, anaphylaxis, bleeding or ischaemia, each of which kills if it is missed. Brilakis's answer is a fixed differential that you run every time. The module pm-monitoring teaches its first step, deciding whether the low reading is real; this lesson takes you through the rest.",
        },
        { kind: "h", text: "The sequence" },
        {
          kind: "steps",
          title: "When the pressure falls (built from Brilakis Fig. 28.1 and section 28.1)",
          items: [
            {
              title: "1. Say it, and check the reading",
              detail:
                "Announce the number so the team hears it. Then run the five quick checks for a false reading (pm-monitoring-pressure): Y-connector valve, transducer line and air, damping, an obstructed catheter, bulky equipment inside the guide. Correct any fault you find and look again. If all five are clear, the hypotension is real.",
            },
            {
              title: "2. Look at the patient and the rate",
              detail:
                "Is the patient awake, pale, sweating, in pain (chest, abdomen, back, groin), itching or wheezing? Is the heart fast or slow? The rate is one of the quickest clues: tamponade usually brings a tachycardia and anaphylaxis can (Oxford), a vasovagal reaction slows the heart first, and a retroperitoneal bleed often comes with a slow pulse too (Brilakis 29.1).",
            },
            {
              title: "3. Ask what has just been done",
              detail:
                "A nitrate or intra-arterial verapamil, a deep guide, a balloon occluding a large artery, an injection that has not cleared, a wire that may have exited, the first contrast run in a patient with a history of reactions, a femoral sheath coming out. The last manoeuvre often names the cause.",
            },
            {
              title: "4. Place it in one of three groups",
              detail:
                "Hypovolaemia (bleeding, poor hydration), cardiac failure (a low stroke volume from the myocardium, a valve or the pericardium, or a rate that is too slow or too fast), or peripheral vasodilation (vasovagal reaction, anaphylaxis, drugs). The table below lists what to look for in each.",
            },
            {
              title: "5. Support the circulation while you look",
              detail:
                "Complete treatment of the cause is best, but it is not always possible at once (Brilakis's example is an acute closure that cannot be reopened). Meanwhile give fluid, and a vasopressor or inotrope if needed; Brilakis says vasopressors may be required when the mean arterial pressure is below 60 mmHg, ideally through a central line. Some patients need mechanical circulatory support. If the patient arrests, start CPR (Brilakis prefers an automated compression device) and move to VA-ECMO if there is no prompt recovery.",
            },
            {
              title: "6. If the cause is still unclear, measure it",
              detail:
                "Brilakis turns to right heart catheterisation. Low left-sided filling pressure with a low output means hypovolaemia; high filling pressure with a low output means cardiac failure (filling pressure can be low when the right ventricle is the one failing); low filling pressure with a high output means vasodilation. Oxford adds systemic vascular resistance (normal 800–1400 dynes·s·cm⁻⁵), typically low in sepsis and high in cardiogenic shock.",
            },
          ],
        },
        {
          kind: "table",
          caption: "True hypotension: the three groups, the clue and the first move (Brilakis 28.1; Oxford ch 10)",
          head: ["Group and cause", "What points to it in the lab", "First move"],
          rows: [
            ["Hypovolaemia: bleeding", "The commonest cause of hypovolaemia. Haematoma at an access site; after femoral access, back or lower abdominal pain, sweating, often a slow pulse; a displaced ('dented') bladder on fluoroscopy", "Saline and blood; if an arterial access site is bleeding, inflate a balloon to stop it, then repair it from inside or surgically (bleeding lesson)"],
            ["Hypovolaemia: poor hydration", "Fasted patient with no IV fluid, on drugs that lower the pressure", "Fluid; Oxford notes that a slow infusion is often all that is needed"],
            ["Cardiac failure: ischaemia (left or right ventricle)", "ST change, chest pain, a closed or slow artery, a long balloon inflation. Brilakis lists left and right ventricular failure separately: when the right ventricle fails, the left-sided filling pressure can be low rather than high. Oxford: hypotension, bradycardia and ventricular arrhythmias are common when a vessel occludes", "Restore flow; mechanical support in some patients (Oxford inserts a balloon pump, if available, when cardiogenic shock follows an occlusion)"],
            ["Cardiac failure: valve", "An Amplatz guide, or an EBU guide with a deep curve, sitting on the aortic valve and holding a cusp open (acute aortic regurgitation); acute mitral regurgitation; Brilakis's diagram also lists a stenotic valve under the valvular causes","Reposition the guide: the pressure recovers at once. Acute mitral or aortic regurgitation is often poorly tolerated and may need urgent surgery; vasodilators may help, and a balloon pump can support acute mitral regurgitation"],
            ["Cardiac failure: pericardium", "Rising heart rate, pulsus paradoxus, contrast collecting around the heart, a wire beyond the vessel", "Echo and pericardiocentesis (cm-perforation); myocardial rupture, usually after infarction, needs emergency surgery"],
            ["Cardiac failure: rate", "Bradycardia or AV block (often after a drug such as adenosine, whose effect is very short) or a tachyarrhythmia", "Treat the rhythm and the ischaemia behind it (arrhythmia lesson)"],
            ["Vasodilation: vasovagal reaction", "Pallor, sweating, nausea, the heart slowing before the pressure falls", "Legs up, atropine, fast saline (next lesson)"],
            ["Vasodilation: anaphylaxis", "Within minutes of contrast: itching, flushing, rash, wheeze, angio-oedema, tachycardia", "Adrenaline and fluid (pm-lab-drugs gives the doses)"],
            ["Vasodilation: drugs", "Just after nitroglycerin, above all after a recent phosphodiesterase-5 inhibitor, or after verapamil given into the radial artery or the coronary", "No more vasodilator, saline, wait, and a vasopressor if the fall is severe (below)"],
          ],
        },
        { kind: "tip", id: "pci-hypo-amplatz-valve" },
        {
          kind: "check",
          stem: "You have seated an AL1 guide in a large RCA for a proximal lesion. As you push it a little deeper for support, the aortic pressure falls from 128/70 to 94/48 mmHg. The trace is not damped, the ECG is unchanged and the patient is comfortable. What is the most likely cause and the first step?",
          options: [
            "An inferior ischaemic event: give intracoronary nitroglycerin and start a noradrenaline infusion",
            "Early anaphylaxis to the contrast: give adrenaline intramuscularly before any further injection",
            "The deep Amplatz is holding an aortic cusp open: pull the guide back and reposition it",
            "An open Y-connector valve: close it and re-zero the transducer, and treat nothing else for now",
          ],
          answer: 2,
          explanation:
            "Brilakis describes exactly this: an Amplatz guide, or a deeply curved EBU guide, can hold one aortic cusp open so that the valve leaks acutely, and simply repositioning the guide corrects the pressure at once (his Fig. 28.2 shows the pressure recovering as the Amplatz is withdrawn from the valve). The five checks for a false reading, the Y-connector valve among them, still come first; but once they are clear, a fall that begins as the guide goes deeper, with an unchanged ECG and a comfortable patient, points to the guide. A nitrate would lower the pressure further, and nothing suggests anaphylaxis.",
        },
        { kind: "h", text: "Vasodilator hypotension" },
        {
          kind: "p",
          text: "Nitroglycerin lowers the pressure by dilating veins (less preload) and arteries (less afterload). Brilakis lists the situations where it should not be given: a low systemic pressure, suspected hypovolaemia, right ventricular infarction, hypertrophic obstructive cardiomyopathy (it worsens the outflow gradient), and a phosphodiesterase-5 inhibitor taken recently (sildenafil, vardenafil or avanafil within 24 hours, tadalafil within 48 hours). A patient kept nil by mouth without intravenous fluid is effectively hypovolaemic. Brilakis also scales the intracoronary dose to the systolic pressure before giving it: 200 µg when it is above 120 mmHg, 100 µg between 100 and 120 mmHg, and 50 µg or none at all below 100 mmHg; he waits 1–2 minutes for the vessel to dilate before the angiogram and expects some fall in systemic pressure. Verapamil given into the radial artery to prevent spasm, and the small-vessel dilators nicardipine and nitroprusside, can do the same, and some patients have a vasovagal reaction to the nitrate itself.",
        },
        {
          kind: "steps",
          title: "Treating it (Brilakis 3.2.1 and 6.3; typical practice, follow local protocol)",
          items: [
            { title: "Stop", detail: "No further nitroglycerin or other vasodilator. Its half-life is short, between 1.5 and 7.5 minutes." },
            { title: "Fill", detail: "Give normal saline; Brilakis notes that many operators give it routinely after intracoronary nitroglycerin." },
            { title: "Wait and watch", detail: "The pressure often recovers within a few minutes." },
            { title: "Pressor if it is extreme or persists", detail: "Noradrenaline or phenylephrine. Phenylephrine is a pure vasopressor and the drug of choice in hypertrophic cardiomyopathy, where an inotrope worsens the obstruction (Brilakis 3.6)." },
            { title: "If it does not recover, it was not the nitrate", detail: "Persistent hypotension sends you back to the differential, bleeding first." },
          ],
        },
        { kind: "tip", id: "diag-hypo-after-vasodilator" },
        {
          kind: "check",
          stem: "Before RCA angiography in a man with an inferior STEMI, 200 µg of intracoronary nitroglycerin is given. The pressure falls from 112/70 to 78/50 mmHg and the heart rate rises to 96/min. Three minutes later, after a 250 mL saline bolus, it is 84/54 mmHg. The groin is soft and the trace is not damped. What is the best course?",
          options: [
            "Keep filling, avoid more vasodilator, use a pressor if it worsens, and think of right ventricular infarction",
            "Give a further 100 µg of nitroglycerin, since the ST elevation suggests spasm is still present",
            "Give atropine 1 mg intravenously, because a nitrate-induced fall is a vagal reflex in most patients",
            "Stop the case and send him for an urgent echocardiogram before any further coronary angiography or PCI is attempted",
          ],
          answer: 0,
          explanation:
            "Brilakis would not have given nitroglycerin to a hypotensive patient or one with suspected right ventricular infarction, a real risk in an inferior STEMI, and at a systolic pressure of 112 mmHg his dose would have been 100 µg, not 200 µg. Once it is given, the treatment is saline, time, and a vasopressor such as phenylephrine if the fall is severe or persists. The rising rate argues against a vagal reaction, so atropine is not the answer. Reperfusion should not be delayed by an echo when the cause is evident.",
        },
        { kind: "h", text: "Treating each cause (Brilakis 28.1.3)" },
        {
          kind: "list",
          items: [
            "**Hypovolaemia.** Normal saline, and blood if the cause is bleeding. A bleeding arterial access site is controlled first with a balloon inflated across the hole, then repaired from inside or surgically.",
            "**Myocardial dysfunction.** Usually ischaemic, so revascularise; some patients also need mechanical support.",
            "**Valve.** Vasodilators can help acute mitral or aortic regurgitation, but these lesions are often poorly tolerated and may need urgent or emergency surgery; acute mechanical support, such as a balloon pump for acute mitral regurgitation, can bridge.",
            "**Pericardium.** Tamponade is drained; a ruptured myocardium, usually after acute infarction, goes to emergency surgery. Oxford describes tamponade as fast: tachycardia, hypotension and syncope within minutes, sometimes with contrast visible in the pericardium. If clinical suspicion is high, Oxford drains without waiting for the echo.",
            "**Rhythm.** Lab arrhythmias are usually ischaemic and often follow reperfusion; treating the ischaemia usually treats the rhythm.",
            "**Peripheral vasodilation.** Adrenaline for anaphylaxis, and fluid.",
            "**Left main work.** Brilakis encourages early vasopressors (such as noradrenaline) in left main PCI as soon as the pressure falls, because these patients can deteriorate very quickly; defibrillator pads should ideally already be on.",
          ],
        },
        {
          kind: "list",
          items: [
            "**Preventing it (Brilakis 28.1.2).** For false readings: check every connection, clear the catheter carefully after insertion, avoid deep engagement. For true hypotension: careful access, radial where possible, and no more anticoagulant than needed; hydration before the case; prophylactic haemodynamic support for selected high-risk PCI; short coronary occlusions; avoiding perforation; premedication when there is a contrast allergy; early correction of arrhythmias; enough sedation and fluid to make a vasovagal reaction less likely; and restraint with nitroglycerin and other vasodilators.",
          ],
        },
        { kind: "tip", id: "pci-hypo-rhc-when-unclear" },
        { kind: "tip", id: "pci-mon-false-hypotension" },
        {
          kind: "pitfalls",
          items: [
            "Treating a number before the five checks have shown it is real.",
            "Reaching for a vasopressor and stopping there: a pressor buys time, it does not find a bleed, a tamponade or a guide on the aortic valve.",
            "Giving more nitroglycerin to a patient whose pressure has just fallen after nitroglycerin.",
            "Assuming a slow pulse excludes bleeding: patients with a retroperitoneal haematoma often become bradycardic.",
            "Forgetting the guide: a deep Amplatz or EBU can hold the aortic valve open, and a catheter that occludes the ostium can cause ischaemia, hypotension and arrhythmia (Brilakis 6.5).",
            "Using a side-hole guide in the left main, where it can hide damping and the global ischaemia behind it until the patient collapses.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep two questions running side by side: what can I do in the next 30 seconds to keep this patient perfused, and what is the cause? Assign the first to a team member (fluid, pressor, pads) so that your own attention stays on the second.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, engage the RCA with an AL1 and then a JR4. Watch the aortic trace as you advance each one: if the pressure falls while the Amplatz sits deep on the cusp, withdraw it and see the trace recover. Say aloud the three groups of true hypotension and which one a guide on the aortic valve belongs to.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Run a right heart study and calculate cardiac output and systemic vascular resistance. Then state which pattern of left-sided filling pressure and output you would expect in hypovolaemia, pump failure and vasodilation.",
        },
        { kind: "video", id: "iG18Julm6NA", note: "Manual of PCI chapter video 28.1: hypotension." },
        { kind: "video", id: "QQfDGVH_ogs", note: "Case 145 from the Manual of PCI: hypotension after left main engagement." },
        { kind: "video", id: "l5PoQy7dgWo", note: "Case 165 from the Manual of CTO PCI: collapse." },
        {
          kind: "keypoints",
          items: [
            "Confirm the low reading is real (five checks), then classify: hypovolaemia, cardiac failure (myocardium, valve, pericardium, rate) or peripheral vasodilation.",
            "Look at the rate and ask what was just done: those two answers usually name the cause.",
            "Support while you search: fluid, a vasopressor if the mean pressure is below 60 mmHg, mechanical support or VA-ECMO when needed.",
            "Right heart catheterisation separates the groups when the cause is unclear (filling pressure and output).",
            "An Amplatz or deep EBU guide can hold an aortic cusp open; repositioning it corrects the pressure at once.",
            "Intracoronary nitroglycerin by systolic pressure (Brilakis): 200 µg above 120, 100 µg at 100–120, 50 µg or none below 100 mmHg. After a nitrate fall: no more vasodilator, saline, wait, then noradrenaline or phenylephrine; if it does not recover, look elsewhere.",
            "In left main PCI, use vasopressors early and have pads on.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-vasovagal",
      title: "The vasovagal reaction and the conditions that imitate it",
      minutes: 12,
      topics: ["comp-hypotension-vasovagal"],
      sources: [O("ch 10: Vasovagal reaction"), O("ch 10: Risks of complications"), O("ch 10: Vascular complications"), O("ch 10: Arrhythmia"), O("ch 10: Contrast reaction"), B("28.1"), B("11.1"), B("26.2"), B("29.1"), B("3.7"), B("6.3")],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Fainting is one of the commonest events around catheterisation: Oxford gives a rate of 2–3% of patients. The reaction combines slowing of the heart (cardioinhibitory) with dilation of the vessels (vasodepressor). It is usually easy to treat, and that is the trap: the same picture can be the first sign of a bleed or a tamponade. This lesson teaches how to recognise it, how to treat it, and when to stop calling it vasovagal.",
        },
        {
          kind: "table",
          caption: "Who and when (Oxford ch 10; Brilakis 11.1, 28.1, 6.3)",
          head: ["", "Details"],
          rows: [
            ["Predisposing state", "Strong emotion, dehydration, mild starvation from fasting, and the expectation of pain. Oxford finds young, anxious men particularly prone"],
            ["When it happens", "Often on the ward before the procedure, during venepuncture or cannulation; then at arterial puncture and during compression haemostasis. Brilakis adds a vagal reaction to nitrates"],
            ["Pain as the trigger", "A painful groin haematoma can itself set off a vagal collapse (Oxford); so can the pain of a sheath inserted without enough local anaesthetic (Brilakis)"],
          ],
        },
        {
          kind: "steps",
          title: "Recognise it",
          items: [
            { title: "The patient tells you first", detail: "A vague sense of being unwell, tiredness, nausea and sweating usually come before anything changes on the monitor." },
            { title: "The rate falls before the pressure", detail: "Oxford's key sign: the heart slows, then the blood pressure drops." },
            { title: "Then the faint", detail: "Pallor, loss of consciousness, a pause in breathing; the patient may look dead. Early recognition can abort the syncope altogether." },
          ],
        },
        {
          kind: "steps",
          title: "Treat it (Oxford ch 10; Brilakis 11.1, 3.7; typical doses, follow local protocol)",
          items: [
            { title: "1. Flat, legs up", detail: "Lie the patient flat and raise the legs if you can. If it starts during femoral compression, the person compressing keeps pressing." },
            { title: "2. Monitor", detail: "ECG on, and regular pressure readings; in the lab this is already running." },
            { title: "3. Atropine", detail: "Oxford gives 0.5–1.0 mg IV. Brilakis's dosing is 0.5 mg IV, repeated as needed up to a total of 3 mg; expect a dry mouth, blurred vision, flushing, and a rebound tachycardia once the cause has passed." },
            { title: "4. Fast saline", detail: "Run 0.9% saline quickly. Brilakis treats a vagal reaction with saline and keeps atropine for the bradycardia." },
            { title: "5. Set a time limit", detail: "Oxford expects improvement within a few minutes. If it does not come, reconsider the diagnosis and look actively for the other causes of hypotension: myocardial infarction, tamponade, retroperitoneal bleeding." },
          ],
        },
        { kind: "tip", id: "diag-vagal-sequence" },
        {
          kind: "check",
          stem: "As the radial sheath is removed, a 32-year-old anxious man becomes pale and nauseated; the heart rate falls from 78 to 46/min, then the pressure falls to 80/45 mmHg. You lie him flat, raise his legs and give atropine 0.6 mg with fast saline. Two minutes later the rate is 84/min and the pressure 112/68 mmHg. What does this tell you?",
          options: [
            "A rate that rises after atropine shows that the patient is bleeding; arrange a CT scan of the abdomen at once",
            "Atropine has masked a tamponade; perform pericardiocentesis without waiting for the echocardiogram",
            "The recovery means the reaction was anaphylactic; give intramuscular adrenaline to prevent a relapse",
            "The sequence and the rapid response fit a vasovagal reaction; keep observing but no further search is needed",
          ],
          answer: 3,
          explanation:
            "Slowing before the fall, in an anxious young man, at sheath removal, with prompt recovery after legs up, atropine and saline is Oxford's vasovagal reaction. The time limit matters in the other direction: had he not improved within a few minutes, Oxford tells you to reconsider and look for infarction, tamponade or bleeding. A rise in rate after atropine is the drug working, and nothing here suggests anaphylaxis (skin or airway signs with tachycardia).",
        },
        { kind: "h", text: "The mimics" },
        {
          kind: "table",
          caption: "When it is not vasovagal",
          head: ["Mimic", "What separates it", "What to do"],
          rows: [
            ["Tamponade", "Develops just as quickly, but usually with a tachycardia (Oxford); a perforation, a wire exit, a temporary pacing wire or right heart manipulation in the history, or contrast injected into the myocardium at left ventriculography (Oxford)", "Immediate echo if there is any doubt (Oxford); drain if it is tamponade, leaving the drain in until the bleeding has stopped, which can take a few days (Oxford; cm-perforation)"],
            ["Retroperitoneal haematoma after femoral access", "Hypotension, sweating, lower abdominal or back pain, tenderness over the abdomen or above the pubis. Brilakis warns that these patients often become bradycardic, so a slow pulse does not settle the question. Usually in the first 3 hours", "Suspect it in every patient who becomes hypotensive during or after femoral catheterisation (bleeding lesson)"],
            ["Anaphylaxis", "Usually within 15 minutes of the first injection, with itching, flushing, rash, wheeze or angio-oedema and a tachycardia (Oxford)", "Adrenaline, fluid, airway (pm-lab-drugs)"],
            ["Myocardial infarction", "Chest pain, pallor and sweating with ST change; hypotension and bradycardia are common with vessel occlusion (Oxford)", "Angiography and revascularisation"],
          ],
        },
        {
          kind: "check",
          stem: "Forty minutes after a femoral PCI with closure-device haemostasis, a 79-year-old woman becomes sweaty and complains of low back pain. Pulse 52/min, pressure 84/50 mmHg. The groin looks normal. The nurse says, 'It's vagal, she had a faint like this at cannulation.' What is the right response?",
          options: [
            "Agree: give atropine and saline and reassess in thirty minutes, since the groin is clean and a closure device was used",
            "Bradycardia makes bleeding very unlikely, so the next step is an urgent echocardiogram to exclude a pericardial tamponade",
            "Give atropine and saline, but treat this as a retroperitoneal bleed until proven otherwise and start the bleeding measures now",
            "Give protamine at once to reverse the heparin, because the closure device has probably failed",
          ],
          answer: 2,
          explanation:
            "Brilakis: suspect a retroperitoneal haematoma in every patient who becomes hypotensive during or after femoral catheterisation; back or lower abdominal pain and sweating are typical, these patients often develop bradycardia, it usually appears within the first 3 hours, and a closure device does not exclude it. Atropine and fluid are reasonable support, but the general bleeding measures (large-bore access, saline, crossmatch, haemoglobin) start now. Protamine comes after the diagnosis is established, not as a first move.",
        },
        { kind: "h", text: "Preventing it" },
        {
          kind: "list",
          items: [
            "Adequate sedation and hydration make a vasovagal reaction less likely (Brilakis 28.1.2).",
            "Generous local anaesthetic before the sheath goes in, to avoid a pain-provoked reaction (Brilakis 11.1).",
            "Saline running before a femoral sheath is removed, and someone ready to give atropine or fluid during manual compression, with the patient on telemetry and non-invasive pressure monitoring (Brilakis 11.1).",
          ],
        },
        { kind: "tip", id: "access-vagal-prevention" },
        { kind: "tip", id: "access-vasovagal-or-tamponade" },
        {
          kind: "pitfalls",
          items: [
            "Calling it vasovagal and not setting a time limit: if there is no improvement within a few minutes, the diagnosis is wrong until shown otherwise.",
            "Letting a slow pulse reassure you about bleeding after femoral access.",
            "Stopping groin compression to treat the faint, and turning a vagal episode into a haematoma.",
            "Sitting a fainting patient up. (Sitting up belongs to a different emergency, pulmonary oedema after a large contrast load, taught in the kidney lesson.)",
            "Missing anaphylaxis because the pressure fell: look at the skin, listen to the chest, and count the rate.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the time on the board when you give the atropine. If the patient is not clearly better a few minutes later, the team has agreed in advance to look for blood (groin, bladder screen, haemoglobin) and for pericardial fluid (echo), rather than give a second dose and wait.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, remove the femoral sheath at the end of the case. If the patient's heart rate falls and the pressure follows, keep compressing, raise the legs, give atropine and saline, and decide within a few minutes whether it was vagal or whether you must look for bleeding.",
        },
        { kind: "video", id: "iG18Julm6NA", note: "Manual of PCI chapter video 28.1: hypotension." },
        {
          kind: "keypoints",
          items: [
            "Vasovagal reactions affect 2–3% of catheter patients (Oxford): emotion, dehydration, fasting and anticipated pain; young anxious men most often.",
            "The rate falls before the pressure; the patient feels unwell, nauseated and sweaty first.",
            "Flat, legs up, monitor, atropine (0.5–1.0 mg, Oxford; 0.5 mg repeated to 3 mg, Brilakis), fast saline; keep compressing.",
            "No clear improvement within a few minutes: reconsider infarction, tamponade and retroperitoneal bleeding.",
            "Tamponade is usually tachycardic; a retroperitoneal bleed may be bradycardic.",
            "Prevent it with sedation, hydration, local anaesthetic and saline before sheath removal.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-arrhythmia",
      title: "Arrhythmias in the lab: the trigger, the rhythm, the response",
      minutes: 18,
      topics: ["comp-arrhythmia"],
      sources: [
        B("2.2"),
        B("3.7"),
        B("3.2"),
        B("3.6"),
        B("6.5"),
        B("12.2"),
        B("15.1"),
        B("17"),
        B("19.3"),
        B("28.1"),
        O("ch 10: Arrhythmia"),
        O("ch 10: Risks of complications"),
        O("ch 9: Cardioversion/defibrillation"),
        O("ch 2: The cardiac physiologist"),
        O("ch 6: Common pitfalls"),
        O("ch 6: Catheter manipulation"),
        O("ch 4: Contrast media"),
      ],
      refs: [...BOOKS, "soar-erc-als-2021", "esc-va-2022"],
      blocks: [
        {
          kind: "p",
          text: "Oxford puts serious arrhythmia during diagnostic catheterisation at 0.4%, listing ventricular fibrillation, ventricular tachycardia, atrial fibrillation, supraventricular tachycardia and heart block under that heading; brief, harmless rhythms (atrial and ventricular ectopics, sinus bradycardia) are seen frequently. Brilakis adds two principles: lab arrhythmias are usually ischaemic, so treating the ischaemia usually treats the rhythm, and many appear at reperfusion. This lesson organises the arrhythmias by what provokes them, because the trigger tells you how to prevent the next one. The drug doses are in pm-lab-drugs and the full arrest sequence in cp-complex-patients; here the focus is on cause, prevention and the electrical treatment.",
        },
        { kind: "h", text: "Before anything happens" },
        {
          kind: "steps",
          items: [
            { title: "Record the baseline", detail: "Brilakis asks for the ECG morphology and the heart rate to be noted at the start, so that later changes stand out; Oxford wants a 12-lead ECG before every catheterisation as the baseline." },
            { title: "Know what to watch for", detail: "Brilakis's list of ECG changes that matter: new ST depression, new ST elevation, bradycardia, tachycardia, QRS widening, ventricular ectopics during wire manipulation, and VF." },
            { title: "Know what the physiologist will call", detail: "Oxford's physiologist warns the team of significant bradycardia, new bundle branch block (above all left), any degree of heart block, atrial flutter or fibrillation, VT, accelerated idioventricular rhythm (useful information in primary PCI), VF and asystole, together with ST changes and a 15–20 minute warning for the next ACT." },
            { title: "Agree who shocks", detail: "Oxford expects the team to know before the case who will defibrillate if VF occurs (pm-monitoring)." },
            { title: "Pads on in left main PCI", detail: "Brilakis would ideally have defibrillator pads on the patient during left main PCI, so that a ventricular arrhythmia can be shocked at once." },
          ],
        },
        { kind: "tip", id: "pci-arrhythmia-ecg-baseline" },
        { kind: "h", text: "Trigger by trigger" },
        {
          kind: "table",
          caption: "What provokes lab arrhythmias, and how to prevent and treat each (Brilakis 3.2, 3.6, 3.7, 6.5, 12.2, 15.1, 19.3, 28.1; Oxford ch 2, 4, 6, 10)",
          head: ["Trigger", "Rhythm", "Prevention", "Response"],
          rows: [
            ["Catheter manipulation near a stenosed ostium, a catheter plugging a small vessel (for example an intermediate), deep engagement occluding flow", "VF, VT; hypotension from ischaemia", "Watch the trace before every injection; never inject a damped catheter", "Defibrillate if VF; withdraw the catheter so flow returns, then re-engage more carefully or with a smaller catheter"],
            ["Selective engagement of the conus branch, or a large injection into it", "VF (the conus supplies the right ventricular outflow tract; an injection into it produces a myocardial blush and ischaemia there, Oxford ch 6)", "Recognise damping on RCA engagement and withdraw quickly and gently", "Defibrillate; re-engage the main RCA with gentle rotation, or change catheter"],
            ["Contrast that does not clear because the catheter occludes an ostium", "VF or VT (Brilakis 15.1)", "Let each injection clear; disengage at ostial lesions", "Disengage so the contrast washes out; defibrillate if needed"],
            ["Contrast injection itself", "Transient bradycardia or junctional rhythm, ST changes, QRS widening; ventricular arrhythmias uncommon (Oxford)", "None needed for the transient changes", "Usually recovers within seconds; atropine 0.5–1 mg if it does not (Oxford)"],
            ["Intracoronary adenosine, especially into the RCA", "AV block; AF (the commonest documented adenosine arrhythmia, 2.7% after IV use); torsades or VF, usually after a pause (R on T), sometimes without one", "Avoid high doses in the RCA (Brilakis's physiology chapter sets no more than 100 µg there or in a dominant circumflex); give it slowly", "Block: wait, it is short-lived; ask the patient to cough. AF: DC cardioversion, or amiodarone or an AV nodal blocker if cardioversion is not wanted. VF: keep the patient coughing until the shock, then defibrillate"],
            ["Papaverine (an alternative hyperaemic agent)", "VF", "Know the risk before choosing it", "Defibrillate"],
            ["Atherectomy in the RCA or a dominant circumflex", "Bradycardia, AV block", "Temporary pacing wire, aminophylline (250–300 mg IV over 10 minutes) or atropine (0.5–1.0 mg IV) beforehand; or brief test runs, which let the runs be tailored and avoid the risk of a pacing lead perforating the right ventricle. Bigger burrs and longer or more forceful runs cause more bradycardia, so avoid aggressive runs; orbital atherectomy may cause less than rotational", "Stop the run: the bradycardia usually resolves"],
            ["Right heart catheter in the RV outflow, or catheters in the LV", "VT", "Know that these sites provoke it (Oxford)", "Taking the catheter out of the ventricle is the obvious first move (this module's reasoning); if VT persists, treat it as in the list below"],
            ["Catheters in the right atrium or ventricle", "AF from atrial irritation; SVT in a patient with a predisposition such as an accessory pathway", "Know that atrial irritation provokes it (Oxford)", "Most induced AF stops by itself; if it does not, see the list below. SVT: pm-lab-drugs-antiarrhythmics"],
            ["Ischaemia: dissection, air, closure, a long balloon inflation; RCA ischaemia", "VF, VT; AV block with RCA ischaemia", "Short occlusions; prevent the complication", "Restore flow: treating the ischaemia usually corrects the rhythm"],
            ["Reperfusion of an occluded artery", "Post-reperfusion arrhythmias; accelerated idioventricular rhythm", "Expect them in primary PCI", "Shock VF; finish restoring flow"],
            ["Drugs given to treat something else", "Amiodarone: AV block; torsades or VF with a long QT or pre-excited AF; hypotension, from an allergic reaction or from vasodilation and depressed contractility (partly due to the solvent). Inotropes: excess adrenergic drive", "Respect the contraindications; take care giving amiodarone when the baseline pressure is low; use the lowest inotrope dose, or mechanical support instead", "Stop the drug; pacing or defibrillation as needed; for amiodarone hypotension, treat anaphylaxis if that is the cause, otherwise vasopressors and inotropes; lidocaine or amiodarone for inotrope arrhythmias, VA-ECMO if refractory"],
          ],
        },
        { kind: "tip", id: "diag-conus-withdraw" },
        { kind: "tip", id: "diag-vf-catheter-cause" },
        {
          kind: "check",
          stem: "During FFR of a mid-RCA in-stent restenosis, 40 µg of intracoronary adenosine produces complete heart block, followed a few seconds later by atrial fibrillation at 110/min. The patient is comfortable with a pressure of 118/70 mmHg. Which plan follows Brilakis?",
          options: [
            "Give flecainide 2 mg/kg IV now, because adenosine-induced AF in a stable patient needs prompt chemical cardioversion",
            "Give a further 100 µg of adenosine to terminate the AF, since adenosine is short-acting and safe to repeat",
            "Abandon the PCI and transfer to the ward for anticoagulation and rate control over the following days",
            "Treat the lesion, then DC cardioversion, or amiodarone or an AV nodal blocker if a shock is not wanted",
          ],
          answer: 3,
          explanation:
            "This is Brilakis's own example (Fig. 3.2): RCA adenosine caused complete heart block and then AF; the RCA was stented, and a shock delivered once the case was over brought back sinus rhythm. His treatment for adenosine AF is DC cardioversion, with amiodarone or an AV nodal blocker (beta-blocker or calcium channel blocker) if cardioversion is not wanted. Adenosine AF is usually well tolerated unless there is an accessory pathway. Oxford reserves flecainide (2 mg/kg, maximum 150 mg, over 30 minutes) for patients with no known structural heart disease, a definition that excludes ischaemic heart disease, and this patient has coronary disease; more adenosine repeats the trigger.",
        },
        { kind: "h", text: "Electrical treatment, done properly (Oxford ch 9)" },
        {
          kind: "steps",
          title: "Synchronised cardioversion (AF, SVT, VT with a pulse)",
          items: [
            { title: "1. Sedate", detail: "Oxford cardioverts atrial arrhythmias, SVT and VT in the lab with the patient under IV benzodiazepine sedation or general anaesthesia." },
            { title: "2. Pads", detail: "Gel pads on the sternum and over the apex." },
            { title: "3. Leads and synchronisation", detail: "Connect the defibrillator firmly and attach its own ECG leads to the patient; choose the lead with the tallest QRS. Switch synchronisation on and check that the marker sits on the R wave, not the T wave; change lead if it does not." },
            { title: "4. Energy", detail: "Oxford's usual starting energies for a stable arrhythmia are 150 J biphasic or 200 J monophasic; for poorly tolerated VT, 200–360 J or the biphasic equivalent; for AF with severe compromise, 200 J biphasic or 360 J monophasic." },
            { title: "5. Contact", detail: "Oxford describes hand-held electrodes placed over gel contact pads: pressed on firmly (it gives 8–12 kg), they lower chest impedance and make success significantly more likely. The 2021 ERC guideline is written for self-adhesive pads rather than paddles, and Brilakis wants pads already on in left main PCI; with adhesive pads nobody presses, so make sure each pad lies flat in full contact with the skin, and that nobody is touching the patient when the shock is delivered (ERC 2021 counts hands-on contact during a shock as a risk to the rescuer, even with gloves)." },
          ],
        },
        {
          kind: "steps",
          title: "Defibrillation (VF, pulseless VT)",
          items: [
            { title: "1. As fast as possible", detail: "Unsynchronised, at high energy from the first shock: 150–200 J biphasic or 200–360 J monophasic. A defibrillator left in synchronised mode waits for an R wave that VF does not have. In the lab the arrest is witnessed and monitored with the defibrillator at hand, the setting in which the 2021 ERC guideline allows up to three quick successive shocks to be considered before compressions start (cp-complex-patients teaches the rest of the arrest sequence)." },
            { title: "2. If shocks keep failing", detail: "Check the settings and consider a different defibrillator; amiodarone 300 mg IV; correct potassium and magnesium (Oxford ch 10)." },
            { title: "3. Resistant arrhythmias", detail: "Oxford describes internal cardioversion through a balloon flotation catheter for arrhythmias that resist external shocks; Brilakis adds VA-ECMO for refractory arrhythmias." },
            { title: "4. The conscious patient losing output after adenosine", detail: "Have the patient cough forcefully and repeatedly while the defibrillator charges: Brilakis notes that coughing can keep enough blood reaching the brain to preserve consciousness until the shock." },
          ],
        },
        { kind: "tip", id: "pci-arrest-defib-settings" },
        { kind: "tip", id: "pci-arrest-adenosine-cough" },
        { kind: "h", text: "Tachycardias that persist (Oxford ch 10)" },
        {
          kind: "list",
          items: [
            "**First, remove the trigger.** Pull the catheter out of the ventricle or the outflow tract, let the contrast clear, and treat any ischaemia, which Brilakis says usually corrects the rhythm (this module adds removing the catheter from the ventricle).",
            "**VT that is poorly tolerated:** synchronised DC cardioversion under sedation or anaesthesia straight away (200–360 J, or the biphasic equivalent).",
            "**VT that is reasonably tolerated:** Oxford's drug options, each repeatable, are a 5 mg IV bolus of metoprolol, or 150 mg of amiodarone infused into a large vein across 10 minutes; with a stable pressure, 50 mg of lidocaine IV across 2 minutes, which can be given again at 5-minute intervals up to 200 mg in total. Watch for hypotension, tell an anaesthetist, and have the defibrillator ready; cardiovert if VT continues. The manual predates the 2022 ESC guideline, which now puts synchronised cardioversion first for tolerated sustained monomorphic VT when the risk of sedation or anaesthesia is low; Oxford's drugs then become the alternative (pm-lab-drugs-antiarrhythmics).",
            "**Overdrive pacing for sustained monomorphic VT:** with a wire in the right ventricle, pace 15–20 beats per minute faster than the VT (a high output of 5–10 V may be needed); capture shows as a change in QRS shape with the rate rising to the paced rate, and pacing is stopped abruptly after 5–10 seconds of capture. Oxford reports termination in 80–90%, but the VT can accelerate or turn into VF, so be ready to shock. Background pacing at 90–110 per minute afterwards can prevent recurrences, especially when pauses or bradycardia set the VT off.",
            "**AF with severe compromise** (rate above 150, hypotension and poor perfusion, a falling conscious level, pulmonary oedema or ischaemia): high-flow oxygen, heparin 5000–10,000 IU IV, then immediate synchronised shock under sedation (200 J biphasic or 360 J monophasic).",
            "**AF with mild to moderate compromise:** heparin 5000–10,000 IU IV, followed by weight-adjusted low-molecular-weight heparin if AF persists; flecainide only for the patient without known structural heart disease (electrical cardioversion 2–3 hours later if it fails); amiodarone 300 mg IV over an hour is an option, though it works poorly.",
            "**Doses and cautions** for each drug, and the SVT sequence, are taught in pm-lab-drugs-antiarrhythmics; typical doses, follow local protocol.",
          ],
        },
        { kind: "h", text: "Slow rhythms" },
        {
          kind: "list",
          items: [
            "**Transient slowing during an injection** is common and recovers within seconds, by itself or with atropine 0.5–1 mg IV (Oxford).",
            "**Bradycardia may announce a vasovagal collapse** (previous lesson).",
            "**Higher-degree block** usually arises in a patient with known conduction delay, from mechanical injury to a bundle branch (usually the right) or from ischaemia (typically RCA). Conduction usually returns within minutes unless ischaemia continues (Oxford).",
            "**Which block needs what.** First-degree and Mobitz I block rarely need urgent treatment; Mobitz II and complete block may need urgent temporary transvenous pacing. Atropine 1 mg may improve AV nodal conduction; isoprenaline rarely improves conduction but can speed the sinus node.",
            "**Adenosine block** usually resolves within seconds because of its short half-life; have the patient cough. If AV block without an escape rhythm persists, Brilakis uses brief CPR and temporary pacing.",
            "**Atherectomy bradycardia** usually stops when the run stops (cp-calcium).",
          ],
        },
        {
          kind: "check",
          stem: "After 150 µg of intracoronary adenosine into a dominant RCA, the patient goes into complete heart block with no escape rhythm. Ten seconds later there is still no QRS and he is losing consciousness. What do you do?",
          options: [
            "Wait another 30 seconds: adenosine's half-life is very short and conduction will return without any intervention",
            "Ask him to cough; if asystole persists, give brief chest compressions and pace through a temporary wire",
            "Give amiodarone 300 mg IV, because the block is likely to be followed by ventricular fibrillation",
            "Give aminophylline 250 mg IV over 10 minutes and then repeat the FFR measurement with a lower dose",
          ],
          answer: 1,
          explanation:
            "Brilakis's physiology chapter: adenosine bradycardia usually resolves within seconds, ask the patient to cough (self-CPR), and if the block persists with no escape rhythm, he uses brief CPR and a temporary pacing wire. The dose given breached his limit of 100 µg in the RCA. Waiting passively in an unconscious patient is wrong, amiodarone itself slows AV conduction, and aminophylline over 10 minutes is a preventive measure for atherectomy, not a rescue.",
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting again before the last injection has cleared, or through a damped or ventricularised trace.",
            "Leaving the defibrillator in synchronised mode for VF.",
            "Giving high-dose adenosine into the RCA or a dominant circumflex.",
            "Choosing amiodarone in a long QT, in pre-excited AF, or in second- or third-degree block without a pacemaker.",
            "Treating the rhythm and forgetting the ischaemia that caused it.",
            "Not recording a baseline ECG, and then being unable to tell whether a bundle branch block is new.",
          ],
        },
        {
          kind: "pearl",
          text: "When a rhythm changes, look first at the screen, not the drug cupboard: where is the catheter tip, is the trace damped, has the last run cleared, what went down the artery in the last minute? Removing the trigger is usually faster than any drug.",
        },
        { kind: "tip", id: "pci-arrhythmia-reperfusion" },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, engage the RCA and watch for damping or conus selectivity before every injection; if the trace damps, withdraw before injecting. After each RCA run, watch the rhythm: wait for transient slowing to recover, and use atropine 0.5–1 mg only if it persists.",
        },
        {
          kind: "sim",
          sim: "pacing",
          task: "Place a temporary pacing wire in the right ventricle, confirm capture and set a safety rate, as you would before rotational atherectomy of a dominant RCA or for Mobitz II or complete block that does not respond to atropine.",
        },
        { kind: "video", id: "Dg-PqPQPhcA", note: "Case 153 from the Manual of PCI: STEMI, a kinked guide and VF." },
        { kind: "video", id: "MG8W3F3qGa8", note: "Case 77 from the Manual of PCI: snaring for treating ventricular tachycardia." },
        { kind: "video", id: "XBbKQZpKqso", note: "Manual of PCI chapter video 3.7: antiarrhythmics." },
        {
          kind: "keypoints",
          items: [
            "Record a baseline ECG and rate; know Brilakis's list of concerning ECG changes and what the physiologist will call.",
            "Most lab arrhythmias come from the catheter, the injection, a drug or ischaemia: identify and remove the trigger.",
            "VF after an injection: shock first (unsynchronised, high energy; up to three quick shocks in the monitored lab, ERC 2021), then withdraw the catheter so flow and contrast clearance return.",
            "Adenosine: no more than 100 µg into the RCA or a dominant circumflex, given slowly; block resolves in seconds, AF is cardioverted, VF is shocked after coughing.",
            "Synchronised cardioversion: sedation, pads sternum and apex, sync marker on the R wave; firm paddle pressure (8–12 kg) or well-applied adhesive pads, with everyone clear of the patient.",
            "Mobitz II and complete block may need temporary pacing; atropine for nodal slowing.",
            "Arrhythmias at reperfusion are expected; finish restoring flow.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-radiation",
      title: "High-dose cases: watching the dose and following up the skin",
      minutes: 16,
      topics: ["rc-dose-excess"],
      sources: [B("28.2"), B("2.5"), B("1.1"), B("1.6"), B("30.19"), O("ch 1: Radiation safety"), O("ch 1: Dose excess"), O("ch 2: The radiographer")],
      refs: [...BOOKS, "abdelaal-low-frame-rate-2014", "radiation-consensus-2018", "irr-2017"],
      blocks: [
        {
          kind: "p",
          text: "Radiation harms in two ways. Stochastic effects, above all cancer, are a matter of probability: Oxford puts a typical coronary angiogram at an effective dose of about 6 mSv, roughly 2.7 years of natural background radiation, with an added lifetime risk of fatal cancer of about 1 in 3500, set against a normal lifetime cancer risk of about one in three. Deterministic effects, such as skin injury and cataract, appear once the dose to one area passes a threshold, and Brilakis ties them to the air kerma dose delivered to a particular patch of skin. The books file harm to the unborn child differently: Brilakis lists birth defects among the stochastic effects, whereas Oxford lists impaired fetal development among the deterministic ones. Brilakis's own example of skin injury comes from a CTO procedure. This lesson is about the high-dose case: watching the numbers, bringing them down, deciding when to stop, and what you owe the patient afterwards.",
        },
        {
          kind: "table",
          caption: "Cumulative air kerma and skin injury (Brilakis 28.2.1). Brilakis lists all four bands as air kerma, but his follow-up section, like the Joint Commission, defines the 15 Gy sentinel event as a peak skin dose (28.2.3), which a physicist estimates from the case data",
          head: ["Air kerma", "What it means"],
          rows: [
            ["Below 5 Gy", "Skin injury unlikely"],
            ["5–10 Gy", "Skin injury possible"],
            ["10–15 Gy", "Skin injury likely; the case needs a physicist's assessment"],
            ["Above 15 Gy (defined as peak skin dose, estimated by a physicist)", "A sentinel event for the US Joint Commission, reportable to the regulators"],
          ],
        },
        {
          kind: "p",
          text: "**What injury looks like.** Brilakis shows a patch of redness and hair loss on a patient's back one month after a CTO procedure that delivered 11.8 Gy of air kerma. The injury appears weeks after the case, on the back where the beam entered, far from the cardiologist's eyes.",
        },
        { kind: "h", text: "During the case: watch three numbers" },
        {
          kind: "steps",
          items: [
            { title: "Cumulative air kerma and dose–area product", detail: "Brilakis monitors both continuously and recommends that every lab has a protocol for announcing the dose, for example every 1 Gy and/or every 30 minutes. Oxford makes the radiographer responsible for warning the operator once the dose reaches 1 Gy." },
            { title: "Dose rate", detail: "Many operators do not look at it, yet it is real-time feedback: if it exceeds 20 mGy/min, change something (Brilakis)." },
            { title: "Operator dose", detail: "Real-time personal dosimeters have been shown to cut operator dose by about 30%." },
            { title: "Decide on stopping", detail: "Brilakis's monitoring chapter says the procedure is usually stopped when air kerma exceeds 5–7 Gy; his radiation section says to consider stopping at 7–8 Gy and staging the rest. Either way, the decision is made before the numbers run away, and staging is a legitimate outcome (cm-principles-closure)." },
          ],
        },
        { kind: "tip", id: "pci-rad-dose-callouts" },
        {
          kind: "table",
          caption: "Levers that lower the dose, and why they work (Brilakis 28.2.2; Oxford ch 1 and ch 2)",
          head: ["Lever", "Detail"],
          rows: [
            ["No X-ray unless you are looking", "The 'heavy foot': screening when nobody is watching the screen, and a lag in lifting the pedal, common early in training. Oxford: ask whether screening is needed every time your foot goes down, and let the C-arm stop moving before you screen"],
            ["Use the shaft markers", "Advance balloons, wires and stents by their shaft markers and screen only as they near the guide tip; know the guide length, because in a 90 cm guide the more proximal marker can be misleading and the device can leave the guide before the marker reaches the Y-connector"],
            ["Trap for exchanges; image with IVUS", "The trapping technique allows exchanges with little X-ray; intravascular imaging saves both contrast and radiation"],
            ["Fluoro save instead of cine", "Cine gives roughly 10 times the dose of fluoroscopy and is not counted in the fluoroscopy time; document balloon and stent inflations with the fluoro-save function"],
            ["Low frame rate", "Brilakis uses 6–7.5 frames per second (even 3.75 in thin patients) as routine and says it halves the dose compared with 15 fps. The randomised trial he cites (transradial cases, 7.5 vs 15 fps) measured a 30% fall in operator dose and a 19% fall in the patient's dose–area product, with similar fluoroscopy times"],
            ["Low magnification", "Less magnification, less dose; Oxford notes that magnification increases the skin dose rate"],
            ["Collimate", "Shrinks the irradiated skin area and the dose–area product (total air kerma is unchanged) and limits overlap when angles change. Caveat: wire tips and the guide may leave the field, so look at them intermittently to catch distal wire migration or deep guide engagement"],
            ["Avoid steep angles", "More than about 30° from AP raises the dose because the beam crosses more tissue, and the system raises its output automatically without telling you. AP itself puts the spine in the field, so slight angulation is better. RAO lowers operator dose and suits mid-LAD work but makes RCA wiring harder"],
            ["Table high, detector low", "The table as high as possible and the image receptor as close to the patient as possible. In Brilakis's figure, the same work costing a 3 Gy skin dose with that geometry would cost 4.2 Gy with a low table and the receptor close, and 7.8 Gy with a low table and a raised receptor (2.6 times the skin dose)"],
            ["Move the entry point", "In long cases, vary the projection so that no single patch of skin takes all the dose: a high total spread over several areas is less harmful"],
            ["Equipment", "Newer X-ray systems give adequate images at lower dose and should be used for very obese patients; a region-of-interest add-on lowers the dose rate outside the area the operator chooses to see in full resolution and reduces radiation dose by about 75%. Ceiling-suspended lead, robotic PCI and scatter shields protect the operator only"],
          ],
        },
        { kind: "tip", id: "diag-acq-high-dose-adjust" },
        { kind: "tip", id: "pci-acq-fluoro-save-inflations" },
        {
          kind: "check",
          stem: "The first half of a long RCA CTO case, done with the table high and the image receptor close to the chest, delivered a skin dose of about 3 Gy at the beam entrance. For the second half the table is lowered for a short operator and the receptor raised to give room for the wires. If the second half needs the same imaging, roughly what skin dose does Brilakis's geometry figure suggest it will deliver?",
          options: [
            "About 3 Gy again, because table height changes the operator's dose but not the patient's skin dose",
            "About 1.5 Gy, because a raised receptor sits further from the scattered radiation",
            "About 7.8 Gy, roughly 2.6 times the skin dose of the first half for the same work",
            "About 4.2 Gy, the figure for a low table if the receptor had instead been kept close to the chest",
          ],
          answer: 2,
          explanation:
            "Brilakis's Fig. 28.6 (from the 2018 radiation consensus) compares the skin dose at the beam entrance for the same procedure: 3 Gy with a high table and the receptor close, 4.2 Gy (about 40% more) with a low table and the receptor still close, and 7.8 Gy (260%) with a low table and a raised receptor. Note that the figure is about the patient's skin dose at the beam entrance, not the cumulative air kerma shown on the screen. Raising the table and lowering the receptor is one of the cheapest dose reductions available, for the patient and the operator.",
        },
        { kind: "h", text: "After the case: follow-up by threshold (Brilakis 28.2.3)" },
        {
          kind: "steps",
          items: [
            { title: "Record and tell", detail: "Write the dose in the report and tell the patient. Oxford asks the operator to record the exposure and communicate it appropriately once the 1 Gy warning has been given." },
            { title: "Above 5 Gy", detail: "See the patient within a month, examine the skin of the back and document the examination in the record. Refer any injury to a dermatologist or plastic surgeon." },
            { title: "Why the warning matters", detail: "A patient who does not know the risk may take a red, sore patch on the back to a dermatologist who biopsies it, and the biopsy can leave an ulcer that will not heal." },
            { title: "Above 10 Gy", detail: "A qualified physicist calculates the peak skin dose promptly, and the skin is examined at 2–4 weeks." },
            { title: "Above 15 Gy peak skin dose", detail: "A sentinel event for the US Joint Commission: hospital risk management and the regulators are contacted within 24 hours." },
            { title: "Before the next procedure", detail: "Brilakis's planning checklist asks whether the patient has radiation injury on the back. If so, the procedure may be postponed or modified: fewer cine runs, and the injured skin kept out of the beam." },
          ],
        },
        { kind: "tip", id: "pci-rad-skin-follow-up" },
        {
          kind: "p",
          text: "**The UK framework (Oxford ch 1).** Under IR(ME)R 2017, hospitals keep a register of referrers, practitioners and operators; in the cath lab the cardiologist is often all three. A clinical evaluation is recorded for every exposure, including fluoroscopy, and doses are audited. An incident is an exposure the patient was not meant to receive or one greater than intended; Oxford distinguishes a near miss (caught in time to prevent it), an incident that does not need notification, and one that does. In interventional cardiology an overexposure is usually taken to mean a total at least ten times the intended dose. When a dose is greater than expected, contact the local radiation protection adviser.",
        },
        {
          kind: "check",
          stem: "A complex left main and CTO procedure ends at 11.2 Gy air kerma. Which follow-up plan meets Brilakis's recommendations?",
          options: [
            "Record the dose, and arrange a skin examination of the back at the routine 6-month clinic visit",
            "Notify the regulator within 24 hours as a sentinel event, then examine the skin of the back at the 3-month clinic visit",
            "No action is needed unless the patient reports symptoms, because erythema usually resolves by itself",
            "Record and explain the dose, ask a physicist to calculate the peak skin dose promptly, and examine the back at 2–4 weeks",
          ],
          answer: 3,
          explanation:
            "Above 10 Gy, Brilakis asks for a prompt physicist calculation of peak skin dose and a skin examination at 2–4 weeks (above 5 Gy, follow-up within a month in any case), with the dose recorded and explained so that the patient does not end up with a biopsy of an unexplained lesion. The 24-hour notification applies to peak skin doses above 15 Gy in the US Joint Commission's terms; in the UK, a dose greater than expected goes to the radiation protection adviser.",
        },
        {
          kind: "list",
          items: [
            "**Protecting the team (Oxford ch 1; Brilakis 28.2.2.5).** Distance first: dose falls with the square of the distance, so one step back from 1 m to 2 m cuts exposure four-fold. Keep everyone's hands out of the beam. Lead aprons are usually 0.25–0.35 mm lead equivalent; wear a thyroid collar and lead glasses. Fixed shields belong near the patient and low enough to block scatter; disposable shields sit on the patient's abdomen but never in the field of view, where they make the tube work harder. Manifold extension tubing lets the radial operator stand further back. Oxford's annual limits for staff are 20 mSv effective dose (averaged over 5 years; a typical interventional cardiologist receives up to 5 mSv a year), 500 mSv to skin and extremities and 20 mSv to the lens, with lower limits for trainees under 18. Oxford also lists 13 mSv to the abdomen over any three months for women of reproductive capacity, a limit that is not in Schedule 3 of the Ionising Radiations Regulations 2017; once an employee notifies her employer in writing that she is pregnant, regulation 9 requires the dose to the foetus to be as low as reasonably practicable and unlikely to exceed 1 mSv for the rest of the pregnancy.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Watching fluoroscopy time and ignoring cine, which delivers about ten times the dose and is not counted in it.",
            "One projection for an hour on the same patch of skin.",
            "A low table with a raised receptor: up to 2.6 times the skin dose for the same images.",
            "Collimating tightly and then losing sight of the wire tip or the guide.",
            "Discharging a patient after a 9 Gy case without telling them, without a documented skin examination, and without a date to look at their back.",
            "Repeating a procedure through skin already injured by the last one.",
          ],
        },
        {
          kind: "pearl",
          text: "Agree the stopping dose and the call-out interval at the team brief, and let the radiographer read the dose aloud at each step. A number heard every gray turns 'one more try' into a deliberate decision.",
        },
        { kind: "tip", id: "pci-rad-prior-skin-injury" },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (mid-RCA CTO), set the fluoroscopy rate to 7.5 fps, collimate to the working segment, and change the projection at least once each 1 Gy. Use fluoro save for every balloon inflation. At the end, state the air kerma and the follow-up you would arrange.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "For each projection you choose, say how far it is from AP; replace any view more than about 30° from AP with a shallower one that still separates the segment you need.",
        },
        { kind: "video", id: "CuPjSsGRREM", note: "Manual of PCI chapter video 28.2: preventing radiation-related complications." },
        { kind: "video", id: "b612bxTygFg", note: "Lecture: how to reduce radiation dose during cardiac catheterisation." },
        {
          kind: "keypoints",
          items: [
            "Skin injury thresholds (air kerma): below 5 Gy unlikely, 5–10 possible, 10–15 likely; above 15 Gy (peak skin dose) is a sentinel event.",
            "Watch air kerma, DAP and dose rate (act above 20 mGy/min); call out every 1 Gy and/or 30 minutes; Oxford's radiographer warns at 1 Gy.",
            "Usually stop at 5–7 Gy (Brilakis 2.5), consider stopping at 7–8 Gy (Brilakis 28.2); stage the rest.",
            "Biggest levers: 6–7.5 fps, fluoro save instead of cine, table high and detector low, shallow angles, collimation, changing the entry point.",
            "Above 5 Gy: tell the patient, skin check of the back within a month; above 10 Gy: physicist peak skin dose and examination at 2–4 weeks.",
            "UK: IR(ME)R 2017; a dose greater than expected goes to the radiation protection adviser; overexposure is usually at least ten times the intended dose.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-contrast-budget",
      title: "The contrast budget: setting the limit and staying inside it",
      minutes: 15,
      topics: ["rc-contrast-volume"],
      sources: [B("2.6"), B("28.3"), B("1.1"), B("1.6"), B("30.2"), B("30.21"), B("3.3"), O("ch 4: Contrast media"), O("ch 2: The cardiac physiologist"), O("ch 2: The radiographer"), O("ch 10: Contrast nephropathy")],
      refs: [...BOOKS, "laskey-vcrcl-2007", "gurm-contrast-dose-2011", "almendarez-caki-strategies-2019"],
      blocks: [
        {
          kind: "p",
          text: "Contrast volume is the one risk factor for kidney injury that the operator controls minute by minute. The habit to build is simple: before the case, work out this patient's ceiling and say it at the brief; during the case, know where you are against it; and use the techniques that do the same job with less dye. The next lesson covers everything else that protects the kidney.",
        },
        { kind: "h", text: "Setting the ceiling" },
        {
          kind: "formula",
          name: "Brilakis's general ceiling",
          expr: "Stop before contrast volume (mL) reaches 3.7 × GFR (mL/min)",
          note: "Brilakis 2.6 and 1.1. His monitoring chapter prefers a lower threshold in chronic kidney disease or a single kidney, while his planning chapter applies 3.7 × GFR to patients at increased risk, such as those with chronic kidney disease; plan to the lower figure. Count recent contrast, such as a contrast CT, against it. The 3.7 figure matches Laskey's 2007 cohort of 3,179 PCI patients, in which a contrast volume to creatinine clearance ratio of 3.7 or more was independently associated with an early rise in creatinine. You will also meet a rule of two to three times the clearance: that is Gurm's planning limit (below), and both it and the 3.7 figure are lowered in kidney disease.",
        },
        {
          kind: "formula",
          name: "Advanced kidney disease (eGFR below 30 mL/min/1.73 m²)",
          expr: "Ideally contrast volume (mL) < creatinine clearance (mL/min); a ratio above 2 predicts injury",
          note: "Brilakis 28.3. Gurm's Michigan registry (58,957 PCIs, all levels of renal function) found that the risk approached significance above twice the calculated creatinine clearance and was clearly raised above three times; the authors suggested planning below three, and preferably two, times. Brilakis cites this study for the ratio above 2 in patients with an eGFR below 30.",
        },
        {
          kind: "formula",
          name: "Oxford's weight-based limit",
          expr: "No more than 5–7 mL/kg, depending on the agent",
          note: "Oxford ch 4. This rule ignores renal function, so in kidney disease the GFR-based ceiling is far lower and is the one to plan to (pm-planning).",
        },
        {
          kind: "table",
          caption: "One patient, four numbers: 80 kg, eGFR 25 mL/min/1.73 m² (worked example, using eGFR as a stand-in for creatinine clearance)",
          head: ["Rule", "Ceiling", "Comment"],
          rows: [
            ["Oxford 5–7 mL/kg", "400–560 mL", "Far too generous for this patient"],
            ["Brilakis 3.7 × GFR", "About 92 mL", "The general ceiling; Brilakis asks for a lower one in chronic kidney disease"],
            ["Twice the clearance", "About 50 mL", "Gurm's preferred planning limit; Brilakis: a ratio above 2 independently predicts injury when eGFR is below 30"],
            ["Below the clearance (Brilakis, advanced CKD)", "Under about 25 mL", "The ideal: an ultra-low contrast plan built round imaging"],
          ],
        },
        {
          kind: "check",
          stem: "A 70 kg man with an eGFR of 40 mL/min/1.73 m² had a contrast CT of the aorta two days ago (90 mL). He now needs diagnostic angiography and possible ad hoc PCI. Using Brilakis's rule, what is the right plan?",
          options: [
            "About 148 mL (3.7 × 40), set lower for his CKD and the recent CT, which may justify delaying an elective case",
            "A ceiling of about 350–490 mL based on his weight, because the CT contrast has already been cleared by the kidneys",
            "No ceiling is required for a diagnostic study, because only contrast given during PCI damages the kidney",
            "A ceiling of exactly 148 mL, with the CT ignored because it was intravenous rather than intra-arterial contrast",
          ],
          answer: 0,
          explanation:
            "Brilakis's ceiling is 3.7 × GFR, about 148 mL here, but he asks for a lower threshold in chronic kidney disease and for recent contrast such as a CT to be taken into account. Staging non-emergent PCI in renal failure is one of his planning options (how long to wait after a CT is not stated in either book). Oxford's weight rule (350–490 mL) ignores the kidneys, and every millilitre counts, diagnostic or interventional.",
        },
        { kind: "h", text: "Tracking it" },
        {
          kind: "list",
          items: [
            "**Count it as you go.** Some injector and diversion systems track the volume automatically (Brilakis 2.6). Oxford gives the operator responsibility for monitoring radiation and contrast, the radiographer for recording both, and the physiologist for putting the contrast volume in the procedure report.",
            "**Say it at checkpoints.** Read out the volume against the ceiling at each strategy change, as you do for the dose (cm-principles-closure). Approaching the ceiling means stop or stage.",
            "**Contrast diversion.** A device placed between the injection syringe and the manifold diverts the part of each hand injection that would reflux into the aortic root and measures the volume actually given; Brilakis quotes early studies showing 20–40% less contrast.",
            "**Automated injectors.** Do not flush saline through the system proximal to the Y-connector once the case has started (only before it begins), because refilling the tubing adds contrast.",
          ],
        },
        { kind: "tip", id: "pci-contrast-budget-ckd" },
        { kind: "h", text: "Spending less (Brilakis Table 28.1, from Almendarez 2019, and 30.2.5)" },
        {
          kind: "table",
          head: ["Stage of the case", "Contrast-sparing technique"],
          rows: [
            ["Before any injection", "Put the previous angiograms up on the lab monitor rather than repeating them; use biplane or rotational angiography; for diagnostic work use 5 Fr catheters without side holes. Side-hole guides waste contrast into the aorta and degrade the image (Brilakis 30.2.5)"],
            ["Each injection", "Small volumes, ideally 2–3 mL per injection; diluted contrast; 15 or 25 fps for the diagnostic runs and the final result, so that each run is good enough not to repeat"],
            ["Engaging the guide", "Confirm engagement by passing the guidewire into the ostium instead of a test injection"],
            ["Before new equipment", "Let the guide clear its contrast by back-bleeding or aspiration, so the next device does not push a column of dye into the artery"],
            ["Mapping the vessel", "Extra guidewires as a roadmap of the vessel and its branches, or roadmap software; stent-enhancement imaging"],
            ["Replacing angiography", "IVUS throughout, including live-view IVUS to find side branches you cannot wire; dextran-flushed OCT; physiology"],
            ["Zero-contrast PCI", "Echocardiogram before and after, to exclude a pericardial effusion from an unseen perforation"],
          ],
        },
        { kind: "tip", id: "pci-contrast-sparing-tactics" },
        {
          kind: "check",
          stem: "You are working through a 7 Fr side-hole guide in an ostial RCA in a patient with an eGFR of 22. The images are faint and you keep repeating 8 mL injections. Which change saves the most contrast without losing safety?",
          options: [
            "Increase each injection to 12 mL so that every run is diagnostic first time, which avoids repeats",
            "A guide without side holes if the pressure allows, 2–3 mL injections, and IVUS for sizing",
            "Switch to a 5 Fr guide with side holes, because a smaller lumen halves the contrast per injection",
            "Stop flushing the guide between injections so that contrast remains inside it ready for the next run",
          ],
          answer: 1,
          explanation:
            "Brilakis notes that side-hole guides increase contrast use and degrade images because contrast escapes into the aorta; small injections and IVUS are the core of ultra-low contrast PCI. Whether a guide without side holes is safe depends on the pressure trace at this ostium (pm-engaging teaches the trade-off). Larger injections spend more, a small side-hole guide keeps the leak, and leaving contrast in the guide means it is delivered with the next device.",
        },
        {
          kind: "pitfalls",
          items: [
            "Setting no ceiling, or setting it by weight in a patient with kidney disease.",
            "Forgetting the CT from yesterday.",
            "Test injections to check engagement when a wire into the ostium would do.",
            "Repeating poor-quality runs at low frame rates instead of acquiring one good run.",
            "Pushing equipment into a guide still full of contrast.",
            "Zero-contrast PCI without an echo before and after.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the ceiling on the whiteboard next to the dose limit before the patient is on the table. When the number is visible to everyone, the circulating nurse will tell you when you have reached half of it.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab (focal mid-LAD), treat the patient as having an eGFR of 25: confirm engagement with the wire rather than a test injection, keep injections small, size the stent without extra runs, and finish within a ceiling below the creatinine clearance.",
        },
        { kind: "video", id: "Ml8VQrwAVDU", note: "Case 259 from the Manual of CTO PCI: ultra-low contrast CTO PCI." },
        { kind: "video", id: "Zl_oDZ2rbiE", note: "Case 103 from the Manual of PCI: DK crush with 5 mL of contrast." },
        {
          kind: "keypoints",
          items: [
            "Brilakis: stop before 3.7 × GFR; lower in CKD or a single kidney; subtract recent contrast.",
            "Advanced CKD: ideally less contrast (mL) than the creatinine clearance (mL/min); a ratio above 2 predicts injury.",
            "Oxford: no more than 5–7 mL/kg, a rule that ignores the kidneys; in renal disease plan to the GFR rule.",
            "Track the volume as you go and read it out against the ceiling at checkpoints; stop or stage when you reach it.",
            "2–3 mL injections, wire instead of test injections, clear the guide before new equipment, no side-hole guides if avoidable, IVUS and physiology instead of runs.",
            "Zero-contrast PCI needs an echo before and after.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-kidney",
      title: "Preventing contrast-associated acute kidney injury: before, during, after",
      minutes: 15,
      topics: ["rc-caki-prevention"],
      sources: [B("28.3"), B("3.3"), B("1.1"), B("1.3"), B("1.6"), O("ch 10: Renal failure"), O("ch 10: Contrast nephropathy"), O("ch 10: Cholesterol embolization"), O("ch 10: Pulmonary oedema"), O("ch 4: Contrast media")],
      refs: [...BOOKS, "preserve-2018", "kdigo-aki-2012", "mehran-cin-2004", "almendarez-caki-strategies-2019"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis calls it contrast-induced acute kidney injury and is blunt about it: once it is established there is no specific treatment, so the whole effort goes into prevention. Oxford gives the scale: transient renal dysfunction in up to 15% of coronary interventions, about 7 in 1000 patients needing renal support, and fewer than 1% left on dialysis. Kidney injury that needs dialysis after angiography carries a 35% mortality at one year, and even a creatinine rise of 25% or more brings excess risk of death, sepsis and bleeding, although Oxford adds that the significance of minor rises has yet to be proven and that no preventive measure has yet been shown to reduce those risks.",
        },
        {
          kind: "table",
          caption: "Who is at risk",
          head: ["Brilakis 28.3", "Oxford ch 10 adds"],
          rows: [
            ["Chronic kidney disease: with an eGFR below 30 mL/min/1.73 m², the incidence can reach 27%", "Pre-existing renal dysfunction and diabetes are the main associations"],
            ["Contrast volume: a contrast-to-clearance ratio above 2 predicts injury when eGFR is below 30", "High contrast volumes"],
            ["Hypotension, in cardiogenic shock, acute heart failure or an acute coronary syndrome", "Congestive cardiac failure"],
            ["Age over 75", "Increasing age"],
            ["Diabetes; anaemia; low ejection fraction; volume depletion", "Hypertension; hypovolaemia; peripheral vascular disease"],
          ],
        },
        {
          kind: "p",
          text: "**Scoring.** Brilakis names three tools: the Mehran score, the Blue Cross Blue Shield of Michigan (BMC2) model and the NCDR CathPCI acute kidney injury model. The Mehran score adds points for hypotension, balloon pump use, heart failure, age over 75, anaemia, diabetes, contrast volume and renal function. Scoring before the case identifies the patients for whom every step below matters most.",
        },
        { kind: "h", text: "Before the procedure" },
        {
          kind: "steps",
          items: [
            { title: "Hydrate with saline", detail: "Brilakis calls hydration the single most important measure, before and after the procedure, and uses intravenous normal saline because no other fluid (bicarbonate, half-normal saline) has proved better. His planning chapter: normal saline at 1–3 mL/kg/h, before and after. Oxford uses 1 mL/kg/h of 0.45–0.9% saline for the 12 hours before and the 12 hours after; the books differ on half-normal saline, which Brilakis specifically does not prefer to normal saline. Tailor the rate to the patient's volume status: Oxford warns that large contrast loads can cause pulmonary oedema in LV impairment, a raised LVEDP, severe aortic or mitral stenosis and dialysis-dependent renal failure." },
            { title: "Statins", detail: "Brilakis lists high-dose statins among the pre-procedure measures." },
            { title: "Stop nephrotoxic drugs", detail: "NSAIDs where possible (Brilakis); Oxford withholds nephrotoxic medication and names aminoglycosides as a cause of renal failure after catheterisation." },
            { title: "Metformin", detail: "Brilakis: in chronic kidney disease hold it on the day and restart no earlier than 48 hours after; without CKD it need not be stopped, but check renal function afterwards and withhold it if function worsens." },
            { title: "Decide whether to stage", detail: "In renal failure Brilakis may stage non-emergent PCI, and considers ultra-low or zero-contrast PCI in advanced disease." },
          ],
        },
        {
          kind: "list",
          items: [
            "**If the fluid and contrast load tip the patient into pulmonary oedema (Oxford ch 10; typical doses, follow local protocol).** High-flow oxygen; sit the patient up if possible (the one emergency in this module where sitting up is right); an IV loop diuretic such as furosemide 80–100 mg; an IV nitrate infusion if the systolic pressure is above 100 mmHg; CPAP, which can work very well; consider a balloon pump; and admit for close monitoring. Oxford also advises non-ionic contrast for patients with severe LV impairment, severe coronary disease or severe valve disease.",
          ],
        },
        {
          kind: "p",
          text: "**Where Oxford is out of date.** In severe renal dysfunction Oxford suggests N-acetylcysteine 600 mg every 12 hours for four doses, starting the day before, or a sodium bicarbonate infusion. The PRESERVE trial (2018) randomised 5,177 high-risk patients having angiography to IV 1.26% sodium bicarbonate or IV 0.9% saline, and to oral acetylcysteine or placebo: neither bicarbonate nor acetylcysteine reduced death, dialysis or persistent loss of kidney function at 90 days, or contrast-associated kidney injury. Brilakis's preference for plain saline is consistent with that result; do not give acetylcysteine or bicarbonate for this purpose.",
        },
        {
          kind: "check",
          stem: "A 74-year-old diabetic woman with an eGFR of 26, an ejection fraction of 50% and no heart failure is booked for elective PCI. The ward asks which preparation to prescribe. Which is best supported by the sources?",
          options: [
            "Oral N-acetylcysteine 600 mg twice daily for two days plus a sodium bicarbonate infusion starting 1 hour before",
            "No fluid, to avoid pulmonary oedema, with a loop diuretic given before the case to protect the kidney",
            "Half-normal saline only after the procedure, because hydration before the case dilutes the contrast too much",
            "IV normal saline before and after, matched to volume status; NSAIDs stopped, metformin held, high-dose statin",
          ],
          answer: 3,
          explanation:
            "Brilakis: hydration with normal saline before and after is the most important measure, together with high-dose statins and stopping nephrotoxic drugs; in CKD metformin is held on the day and for at least 48 hours. PRESERVE showed no benefit from acetylcysteine or bicarbonate, so Oxford's older suggestion should not be followed. Her ventricle is good, so saline is safe at a rate matched to her volume status.",
        },
        { kind: "h", text: "During the procedure" },
        {
          kind: "list",
          items: [
            "**Keep within the ceiling** and use the contrast-sparing techniques (previous lesson). In advanced CKD, aim below the creatinine clearance.",
            "**Choose the agent.** Brilakis: iso-osmolar media have been associated with a lower risk of nephropathy and are listed among the measures during the case. Oxford: think of a non-ionic agent of low or iso-osmolality.",
            "**Keep the pressure up.** Hypotension is a risk factor; haemodynamic support, if needed, may lower the risk by reducing how often and how long the patient is unstable.",
            "**Other measures** in the figure Brilakis reproduces from the Almendarez 2019 review (Fig. 28.9): device-based measures (a contrast diversion system, the RenalGuard system and the Impella pump, each named there); coronary imaging and physiology in place of angiography (IVUS, dextran-flushed OCT, FFR or iFR); and other strategies: the contrast-sparing techniques of the previous lesson, coronary sinus aspiration, remote ischaemic conditioning, radial access, and the choice between iso- and low-osmolar contrast.",
          ],
        },
        { kind: "tip", id: "diag-caki-prepare" },
        { kind: "h", text: "After the procedure" },
        {
          kind: "steps",
          items: [
            { title: "Keep hydrating", detail: "Brilakis calls post-procedure hydration the key measure after the case." },
            { title: "Measure creatinine for long enough", detail: "Brilakis monitors serum creatinine for at least 48 hours. Oxford warns that creatinine peaks 4–5 days after exposure, so a single 48-hour value can miss some cases." },
            { title: "Define it", detail: "Oxford defines it as creatinine rising by 0.5 mg/dL (44 µmol/L), or by more than a quarter of the baseline value, 24–48 hours after the procedure. Current practice usually uses the KDIGO criteria: a rise of at least 0.3 mg/dL (26.5 µmol/L) within 48 hours, or to at least 1.5 times baseline within 7 days." },
            { title: "Manage it", detail: "There is no specific treatment. Usually asymptomatic; function returns towards baseline over about a week in most patients (Oxford), though some need dialysis (Brilakis). Keep nephrotoxins stopped and match fluid to volume status." },
            { title: "Consider the other cause", detail: "Cholesterol embolisation also follows catheter work in an atheromatous aorta, more often with an aortic aneurysm or cerebrovascular disease: renal impairment persisting beyond 2 weeks, livedo reticularis, blue toes or digital gangrene, visual or neurological signs and a rising eosinophil count; a tissue biopsy showing cholesterol crystals in occluded arterioles confirms it (Oxford, which quotes an incidence of up to 1.4% at routine angiography). Brilakis's triad is leg or foot pain, livedo reticularis and intact pulses, often with a high eosinophil count. Prevention is mechanical: gentle catheter work in the aorta, exchanges over a wire, soft-tipped catheters and no high-pressure injections against the vessel wall. Treatment is supportive (careful hydration and blood-pressure control, renal advice if function is badly affected); Oxford calls anticoagulants, statins and steroids controversial, while Brilakis notes that statins may help the kidney injury. Multisystem disease carries a grim outlook: Oxford reports death within 3 months in up to 90%." },
          ],
        },
        { kind: "tip", id: "pci-caki-after-case" },
        {
          kind: "check",
          stem: "A man with an eGFR of 30 had PCI with 60 mL of contrast. His creatinine is 168 µmol/L before, 176 µmol/L at 48 hours, and he is due to go home. What do the sources suggest?",
          options: [
            "Repeat the creatinine in the next few days, as it peaks at 4–5 days; keep nephrotoxins and metformin stopped",
            "Discharge without further tests: the 48-hour value is stable, which excludes contrast nephropathy",
            "Start N-acetylcysteine for 4 days, which treats contrast nephropathy once the creatinine has started to rise",
            "Give a loop diuretic and repeat the creatinine at 6 weeks, since injury from contrast takes weeks to appear",
          ],
          answer: 0,
          explanation:
            "Brilakis monitors creatinine for at least 48 hours; Oxford adds that it peaks at 4–5 days, so a 48-hour value can miss some injuries. There is no specific treatment once injury is established (and acetylcysteine has no proven preventive role either, from PRESERVE), so the value of the later test is to catch injury early and protect the kidney from further insults.",
        },
        {
          kind: "pitfalls",
          items: [
            "Following Oxford's acetylcysteine and bicarbonate suggestions, which PRESERVE did not support.",
            "Running fixed high-rate saline in a patient with a high LVEDP or severe valve disease.",
            "Checking creatinine once at 24 hours and calling the patient safe.",
            "Restarting metformin the next morning in a patient with CKD.",
            "Blaming contrast for renal failure that persists beyond 2 weeks with livedo and eosinophilia.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of kidney protection as three prescriptions written at the same time: the fluid chart (before and after), the contrast ceiling (during), and the blood test dates (after). A patient who leaves the lab with all three is protected; one who leaves with only the first is not.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "Run the full procedure for a patient with an eGFR of 28: write the hydration order before the puncture, state the contrast ceiling at the brief, keep the diagnostic runs small, and at hand-over to PCI say how much of the budget remains.",
        },
        { kind: "video", id: "XF9bo16qAy0", note: "Manual of PCI chapter video 28.3: how to prevent contrast-induced acute kidney injury." },
        {
          kind: "keypoints",
          items: [
            "Risk: CKD (up to 27% incidence with eGFR below 30), contrast volume, hypotension, age over 75, diabetes, anaemia, low EF, volume depletion; score it (Mehran, BMC2, NCDR).",
            "Before: IV normal saline before and after (1–3 mL/kg/h, Brilakis; 1 mL/kg/h for 12 h each side, Oxford), tailored to volume status; high-dose statin; stop NSAIDs; hold metformin in CKD.",
            "PRESERVE: no benefit from acetylcysteine or bicarbonate over saline.",
            "During: within the ceiling, iso- or low-osmolar agent, keep the pressure up.",
            "After: keep hydrating; creatinine for at least 48 h, remembering the peak at 4–5 days.",
            "No specific treatment once established; most recover, some need dialysis; consider cholesterol embolisation if it persists beyond 2 weeks.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "cm-patient-complications-bleeding",
      title: "Major bleeding: resuscitate, reverse, find the source, stop it",
      minutes: 18,
      topics: ["comp-major-bleeding"],
      sources: [B("29.1"), B("3.4"), B("3.5"), B("26.2"), B("28.1"), B("11.1"), B("1.1"), O("ch 3: Anticoagulation issues"), O("ch 10: Vascular complications"), O("ch 10: Cardiac tamponade")],
      refs: [...BOOKS, "ellis-retroperitoneal-2006", "steffel-ehra-noac-2021", "bhatt-bentracimab-2022", "tomaselli-acc-oac-bleeding-2020"],
      blocks: [
        {
          kind: "p",
          text: "Bleeding is the commonest cause of hypovolaemia in the lab (Brilakis 28.1). It usually comes from an access site, and sometimes from a wire that has perforated an iliac, renal or other peripheral artery. Brilakis lists three causes of bleeding in the anticoagulated patient: excessive anticoagulation, an access-site complication and hypertension. The approach is the same whatever the source: resuscitate, reverse what can be reversed at the right moment, find the source, stop it, and then decide about blood and antiplatelet therapy. Groin haematoma, pseudoaneurysm and the radial complications are taught in cm-access-complications; this lesson deals with the bleed that threatens the patient's life.",
        },
        { kind: "h", text: "The first five minutes (Brilakis Fig. 29.4, general measures)" },
        {
          kind: "steps",
          items: [
            { title: "1. Access for volume", detail: "Large-bore intravenous access; sometimes a central line, to give vasopressors and large volumes of crystalloid or blood." },
            { title: "2. Volume", detail: "Normal saline; several litres may be needed." },
            { title: "3. Blood", detail: "Send blood for group and crossmatch, and transfuse according to how much the patient is bleeding and how the circulation is responding." },
            { title: "4. Haemoglobin", detail: "Measure it, but do not be reassured by it: in acute bleeding the haemoglobin often does not fall at once." },
            { title: "5. Pressure", detail: "Hold manual pressure over the access site, particularly when there is also a groin haematoma. Oxford notes that compression is unlikely to help a retroperitoneal bleed from a high puncture, so do not let it delay the next step." },
            { title: "6. Reverse, once the diagnosis is established", detail: "Protamine for heparin; stop GP IIb/IIIa inhibitors and cangrelor (table below). Brilakis reverses only after all intracoronary equipment is out, because reversing heparin with equipment still in place risks thrombosis of the guide and the vessel, and he warns that reversal still carries a risk of stent thrombosis once stents have been implanted." },
          ],
        },
        { kind: "tip", id: "pci-bleed-general-measures" },
        { kind: "h", text: "Reversing the antithrombotic drugs" },
        {
          kind: "table",
          caption: "What can be reversed, and how (Brilakis 3.4, 3.5, 26.2; Oxford ch 10; typical doses, follow local protocol)",
          head: ["Drug", "Reversal", "Details that matter"],
          rows: [
            ["Unfractionated heparin", "Protamine", "Brilakis 3.4: 1–1.5 mg per 100 units, never more than 50 mg, given slowly. Brilakis 26.2: 1 mg per 100 units, maximum 50 mg, no faster than 5 mg/min. Oxford: 1 mg neutralises 80–100 units if given within 15 minutes of the heparin, as an infusion over 10 minutes, maximum 50 mg; use less as time passes, because heparin is cleared quickly"],
            ["Bivalirudin", "None", "Stop the infusion; its half-life is about 25 minutes"],
            ["Eptifibatide, tirofiban, cangrelor", "None", "Stop the infusion; platelet function recovers gradually. Cangrelor's short half-life gives the fastest return, which is its advantage over GP IIb/IIIa inhibitors when bleeding is a concern"],
            ["Aspirin, clopidogrel, prasugrel", "Platelet transfusion", "For life-threatening bleeding, because their inhibition is irreversible"],
            ["Ticagrelor", "Platelets may fail", "Ticagrelor binds reversibly, so transfused platelets can be inhibited too; when Brilakis wrote, a specific reversal agent was still in development. Since then, in the single-arm REVERSE-IT study (patients on ticagrelor needing urgent surgery or with major bleeding), the antibody fragment bentracimab reversed ticagrelor's effect within 5–10 minutes, with thrombotic events in about 5%. It has not been tested in a randomised trial, and whether it is available depends on local approval"],
            ["Direct oral anticoagulant (dabigatran, apixaban, rivaroxaban, edoxaban)", "Specific agents, not covered by either manual", "From the 2021 EHRA practical guide: for life-threatening bleeding or bleeding at a critical site, reversal may be considered alongside the standard measures; send coagulation tests first but do not wait for the results, and note the time of the last dose, the dose and renal function. Dabigatran: idarucizumab, 5 g IV in two 2.5 g doses (dialysis can remove some dabigatran if idarucizumab is not available). Apixaban or rivaroxaban: andexanet alfa (a bolus, then a 2-hour infusion, the regimen depending on the drug and the time since the last dose); its use with edoxaban is extrapolated. Prothrombin complex concentrate, or its activated form, may be considered when a specific agent is unavailable. Vitamin K and fresh frozen plasma have no role, and protamine only reverses any heparin also given. Follow local haematology protocol"],
            ["Warfarin", "Not covered by either manual", "Both manuals deal with stopping it before elective procedures (below) and prefer radial access in anticoagulated patients. Neither book, nor the EHRA guide on the newer drugs, gives a warfarin reversal regimen, so this module leaves the regimen to your hospital's haematology protocol. For further reading, the 2020 ACC expert consensus decision pathway deals with managing bleeding in patients on oral anticoagulants, warfarin included"],
          ],
        },
        {
          kind: "p",
          text: "**How long heparin lasts.** Brilakis notes that its half-life is 1–2 hours and lengthens with the dose: about 30 minutes after an IV bolus of 25 units/kg, 60 minutes after 100 units/kg, and 150 minutes after 400 units/kg. Oxford gives about 60–90 minutes. Both points argue for working out what is still circulating rather than reversing the whole dose given at the start: Oxford's advice to use less protamine as time passes, and the 50 mg ceiling in both books, follow from it.",
        },
        {
          kind: "steps",
          title: "Giving protamine safely",
          items: [
            { title: "Is the coronary empty?", detail: "All intracoronary equipment out first (Brilakis). After a perforation, Brilakis delays reversal further, until the equipment is out and the pericardium has been drained (cm-perforation)." },
            { title: "Who is at risk of a reaction?", detail: "Previous NPH (isophane) or protamine zinc insulin, fish allergy, vasectomy, severe LV dysfunction and abnormal pulmonary haemodynamics (Brilakis); Oxford singles out diabetic patients who have had isophane insulin." },
            { title: "Give it slowly", detail: "Slow administration reduces hypersensitivity and anaphylaxis. Protamine in high doses has an anticoagulant effect of its own (Oxford), another reason for the 50 mg cap." },
            { title: "Watch for 5–10 minutes", detail: "The reaction to fear is severe systemic hypotension with relative pulmonary hypertension from pulmonary vasoconstriction, usually 5–10 minutes after the dose. Brilakis notes that methylene blue may help recovery." },
          ],
        },
        {
          kind: "check",
          stem: "A femoral PCI has finished and all equipment is out of the coronary. The patient received 6,000 units of heparin 75 minutes ago and is now bleeding into the groin despite pressure. Which protamine plan fits both manuals?",
          options: [
            "60–90 mg as a rapid bolus, since the whole 6,000 units must be neutralised to stop the bleeding",
            "Less than the full calculated dose, given slowly and capped at 50 mg, as much heparin has been cleared",
            "No protamine: reversal is never allowed after stent implantation because of the risk of stent thrombosis",
            "50 mg immediately, then a second 50 mg dose 10 minutes later if the bleeding continues",
          ],
          answer: 1,
          explanation:
            "Oxford's ratio applies to heparin given within 15 minutes and tells you to give less as time passes, because heparin is cleared quickly (half-life about 60–90 minutes in Oxford, 1–2 hours in Brilakis). Both books cap a dose at 50 mg and give it slowly. Brilakis allows reversal after stenting once all coronary equipment is out, accepting a risk of stent thrombosis. Large or repeated doses invite hypotension, pulmonary vasoconstriction and, at high doses, an anticoagulant effect of protamine itself.",
        },
        { kind: "h", text: "The retroperitoneal bleed" },
        {
          kind: "table",
          caption: "Recognising it (Brilakis 29.1.2; Oxford ch 10)",
          head: ["", "Details"],
          rows: [
            ["Signs", "Hypotension, sweating, lower abdominal or back pain; often bradycardia; tenderness on abdominal or suprapubic palpation; flank bruising occasionally (Oxford). Progressive hypotension or sudden collapse"],
            ["Timing", "Usually within the first 3 hours after the procedure"],
            ["Who", "Obese patients; uncontrolled hypertension before or during the case; a high femoral puncture (above the lowest border of the inferior epigastric artery, or above the inguinal ligament in Oxford's words), a puncture not guided by ultrasound or fluoroscopy, several puncture attempts, a back-wall puncture; excessive or prolonged anticoagulation, GP IIb/IIIa inhibitors or cangrelor; a hydrophilic wire perforating an iliac or renal branch"],
            ["Closure devices", "Do not exclude it; avoid a collagen-plug device after a high puncture, where the collagen can become tangled in the abdominal wall muscles"],
            ["In the lab", "If contrast has been given, screen the bladder: a displaced ('dented') bladder strongly suggests a retroperitoneal haematoma"],
          ],
        },
        {
          kind: "steps",
          title: "Finding and stopping the source (Brilakis Fig. 29.4)",
          items: [
            { title: "1. Suspect it", detail: "In every patient who becomes hypotensive during or after femoral catheterisation." },
            { title: "2. General measures", detail: "As above: access, saline, crossmatch, haemoglobin, reversal once the diagnosis is established, pressure on the site." },
            { title: "3. Where is the patient?", detail: "In the lab: screen the bladder, obtain contralateral femoral access and perform iliofemoral angiography to show whether and where it is bleeding. Out of the lab and unstable: straight back to the lab or to theatre. Brilakis prefers direct transfer to the lab over imaging when suspicion is high, because imaging can delay treatment. Out of the lab and stable: CT of the abdomen and pelvis to confirm the haematoma and look for active extravasation." },
            { title: "4. Active bleeding: stop the flow first", detail: "Inflate a balloon at low pressure across the bleeding point before any definitive treatment. Then decide which kind of perforation it is." },
            { title: "5. Large vessel", detail: "A covered stent across the hole if prolonged balloon inflation fails. Balloon-expandable covered stents allow more precise placement; self-expanding ones are preferred in the common femoral artery, where flexion deforms stents, and stents there are prone to fracture. Delivery can be difficult." },
            { title: "6. Small branch (for example the inferior epigastric or lateral circumflex iliac)", detail: "Coil embolisation, after excluding retrograde bleeding into the perforation; for very distal branches, microspheres, cyanoacrylate glue or thrombin, without letting the sealant leak outside the vessel. A long balloon inflation or a covered stent across the branch origin is an alternative." },
            { title: "7. Surgery", detail: "If a covered stent fails or is undesirable, for example at the superficial femoral and profunda bifurcation." },
            { title: "8. No active bleeding", detail: "A retroperitoneal haematoma without ongoing bleeding is managed conservatively; no haematoma on CT means looking for another cause of the symptoms." },
          ],
        },
        { kind: "tip", id: "pci-bleed-bladder-screen" },
        { kind: "tip", id: "access-bleed-endovascular-control" },
        {
          kind: "check",
          stem: "In the lab, contralateral angiography in a hypotensive patient shows brisk extravasation from a small branch arising from the right external iliac artery just above the femoral head. A balloon inflated at low pressure across the branch origin has slowed the bleeding. What is the definitive option Brilakis favours for this kind of vessel?",
          options: [
            "A balloon-expandable covered stent across the external iliac artery, as for any iliofemoral bleed",
            "Manual compression over the groin for 20 minutes, since the balloon has already reduced the flow",
            "Coil embolisation of the branch, after checking that blood is not also entering the perforation retrogradely",
            "Thrombin injected into the main external iliac artery itself, to seal the origin of the branch from the inside",
          ],
          answer: 2,
          explanation:
            "Brilakis separates large-vessel perforations (covered stent) from small-branch perforations such as the inferior epigastric or lateral circumflex iliac (coil embolisation, after excluding retrograde bleeding; microspheres, glue or thrombin for very distal branches). A covered stent across the origin is an alternative, but not the first choice for a branch. Oxford notes that compression is unlikely to help a retroperitoneal bleed, and sealant must stay inside the perforated branch, not the main artery.",
        },
        { kind: "h", text: "After the bleeding stops: antiplatelet therapy" },
        {
          kind: "list",
          items: [
            "**Brilakis's options when bleeding on dual antiplatelet therapy:** de-escalate from ticagrelor or prasugrel to clopidogrel, treat the bleeding site locally, and keep platelet transfusion for life-threatening bleeding on an irreversible agent. Brilakis warns that stopping dual antiplatelet therapy early after a stent risks stent thrombosis, so make this decision deliberately and record it. He frames de-escalation as reasonable when the bleeding risk outweighs the thrombotic risk.",
            "**How to switch for bleeding (Brilakis Fig. 3.5, from the international switching consensus):** give clopidogrel 75 mg as a maintenance dose, without a loading dose, 24 hours after the last dose of ticagrelor or prasugrel. (Outside bleeding, a switch in the first 30 days is usually made with a loading dose.)",
            "**Prevention for the rest of the course:** shorten aspirin in patients who also need an oral anticoagulant, avoid prasugrel and ticagrelor in those at high bleeding risk such as patients on warfarin or a DOAC, give a proton pump inhibitor routinely with dual antiplatelet therapy, and adjust the P2Y12 duration to the predicted bleeding risk (pm-antithrombotics).",
          ],
        },
        { kind: "tip", id: "pci-bleed-antiplatelet-platelets" },
        { kind: "h", text: "Preventing major bleeding" },
        {
          kind: "list",
          items: [
            "**Access.** Ultrasound and fluoroscopic guidance with an immediate femoral angiogram; radial where possible. Oxford catheterises fully anticoagulated patients radially and regards femoral access as generally safer when the INR on warfarin is below 2.0; if the femoral route is used in an anticoagulated patient, guide the puncture with fluoroscopy and ultrasound.",
            "**Wires.** Advance wires through the iliac arteries and aorta under fluoroscopy, and never push against resistance.",
            "**Anticoagulation.** No supratherapeutic doses; ACT every 20–30 minutes; GP IIb/IIIa inhibitors and cangrelor only for large thrombus or thrombotic complications in patients with an acceptable bleeding risk, with the ACT kept at 200–250 s.",
            "**Blood pressure.** Control hypertension before and during the case.",
            "**Oral anticoagulants: the books differ.** Brilakis stops warfarin 5 days before an elective procedure and checks the INR on the day; DOACs are held by drug and creatinine clearance (his Table 1.2: apixaban 2 days; rivaroxaban and edoxaban 2 days, or 3 days with a clearance of 15–49 mL/min; dabigatran 2, 3, 4 or 5 days as clearance falls from above 80 to 15–29 mL/min). Oxford stops warfarin 3–5 days before, holds DOACs for 24 hours (72 hours for dabigatran with renal impairment), and restarts either drug the evening after if there has been no bleeding. The 2021 EHRA practical guide times a DOAC interruption by the drug, renal function and the bleeding risk of the procedure, places routine elective coronary intervention among its minor-bleeding-risk procedures (complex work such as CTO PCI is high risk), and does not recommend heparin bridging for patients on DOACs. Brilakis prefers radial access in anticoagulated patients. Follow local protocol.",
            "**When Oxford does not stop warfarin.** Oxford weighs the bleeding risk of the puncture against the thrombotic risk of stopping. It stops warfarin for low-risk AF (normal LV function, no previous stroke), laminar apical thrombus with impaired LV function (keeping catheters out of the ventricle), recurrent DVT or pulmonary embolism, or when no arm access is possible. It does not stop it in moderate- or high-risk AF (poor LV function, previous stroke, diabetes), with prosthetic valves (above all mechanical), rheumatic mitral disease or known non-laminar intracardiac thrombus: warfarin is either continued (radial access in a fully anticoagulated patient) or replaced by IV unfractionated heparin, stopped just before the procedure and restarted just after.",
            "**Tamponade is bleeding too.** Oxford adds platelets and clotting factors to protamine when tamponade occurs in an anticoagulated patient.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Waiting for the haemoglobin to fall before acting.",
            "Holding pressure on the groin for a retroperitoneal bleed and calling it treatment.",
            "Sending an unstable patient to CT instead of the lab or theatre.",
            "Giving protamine with a wire or balloon still in the coronary, or as a fast, uncapped dose.",
            "Transfusing platelets for ticagrelor bleeding and expecting them to work.",
            "Coiling a large-vessel tear, or covering a branch bleed with a stent without considering coils.",
            "Stopping all antiplatelet therapy days after a stent without a senior decision.",
          ],
        },
        {
          kind: "pearl",
          text: "When a femoral patient becomes hypotensive on the table and the reading is real, screen the pelvis early: if contrast has been given, the bladder is already opacified, and a dented bladder turns a vague differential into a plan.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full procedure, after a femoral case, the patient becomes hypotensive with back pain. Run the general bleeding measures aloud, screen the bladder, and describe the contralateral access, the low-pressure balloon and the choice between covered stent and coils that would follow.",
        },
        { kind: "video", id: "UzFqEfJIeeY", note: "Manual of PCI chapter video 29.2: femoral access bleeding." },
        { kind: "video", id: "ukNF_xn93-s", note: "Manual of PCI chapter video 29.3: approach to suspected retroperitoneal haematoma." },
        { kind: "video", id: "cf0NjN55w4s", note: "Manual of PCI chapter video 3.4: anticoagulation." },
        {
          kind: "keypoints",
          items: [
            "General measures: large-bore or central access, saline, crossmatch and transfuse to the bleeding and haemodynamics, haemoglobin (which lags), pressure on the site, reversal once diagnosed.",
            "Protamine only with the coronary empty, slowly, never above 50 mg, less as time passes; watch for hypotension and pulmonary vasoconstriction at 5–10 minutes.",
            "No antidote for bivalirudin, GP IIb/IIIa inhibitors or cangrelor: stop the infusion.",
            "Platelets for life-threatening bleeding on aspirin, clopidogrel or prasugrel; they may fail with ticagrelor; de-escalate to clopidogrel (75 mg, no loading dose, 24 hours after the last ticagrelor or prasugrel).",
            "Retroperitoneal bleed: suspect it with any hypotension after femoral access (often bradycardic, usually within 3 hours); dented bladder; contralateral angiography; balloon, then covered stent (large vessel) or coils (small branch), surgery if these fail.",
            "Stable outside the lab: CT; unstable: lab or theatre.",
            "DOAC bleeding that threatens life: idarucizumab for dabigatran, andexanet alfa for apixaban or rivaroxaban, prothrombin complex concentrate if no specific agent is available (EHRA 2021); warfarin reversal follows local haematology protocol.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "cm-patient-complications-q1",
      stem: "During PCI the arterial pressure falls to 80/42 mmHg. The five measurement checks are clear. A right heart catheter shows a low pulmonary capillary wedge pressure and a high cardiac output. Which cause fits best?",
      options: [
        "Retroperitoneal bleeding from a high femoral puncture, which lowers both filling pressure and output",
        "Anaphylaxis to the contrast medium, a form of peripheral vasodilation with a raised cardiac output",
        "Acute aortic regurgitation from an Amplatz guide sitting on the valve, which raises the wedge pressure",
        "Tamponade from a distal wire perforation, which equalises filling pressures and lowers cardiac output",
      ],
      answer: 1,
      explanation:
        "In Brilakis's Fig. 28.1, peripheral vasodilation (vasovagal reaction, anaphylaxis, drugs) gives a low left-sided filling pressure with a high output. Hypovolaemia gives low filling pressure with low output; cardiac failure (valve, myocardium, pericardium) gives a low output with a high filling pressure, except that the filling pressure can be low when the right ventricle fails.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-patient-complications-q2",
      stem: "Which statement about the vasovagal reaction during catheterisation is correct according to Oxford?",
      options: [
        "It affects about 0.4% of patients and usually begins with a tachycardia before the blood pressure falls",
        "It affects 2–3% of patients, and the heart rate usually falls before the blood pressure does",
        "It is rare at arterial puncture and mainly occurs during the first injection of contrast into the left system",
        "It is most frequent in elderly women and is best treated with intramuscular adrenaline in the first minute",
      ],
      answer: 1,
      explanation:
        "Oxford gives 2–3% for faints during catheterisation, with young anxious men most affected, and notes that the heart rate usually slows before the pressure drops; they occur at venepuncture, cannulation, arterial puncture and compression. The 0.4% figure is Oxford's rate for arrhythmia (and for contrast reactions), and adrenaline is for anaphylaxis.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "cm-patient-complications-q3",
      stem: "An hour after a femoral PCI, a patient has a pulse of 54/min, a pressure of 82/48 mmHg, sweating and lower back pain. Atropine and 500 mL of saline produce no lasting improvement after five minutes. Which conclusion is most consistent with Brilakis?",
      options: [
        "The slow pulse makes bleeding unlikely, so a second dose of atropine and a longer wait are the right course",
        "Retroperitoneal bleeding is likely despite the slow pulse; start the general bleeding measures and image or return to the lab",
        "A closure device was used, so a retroperitoneal haematoma can be excluded and tamponade is the leading diagnosis",
        "This is a delayed contrast reaction, which typically presents with back pain and bradycardia about an hour after the case rather than at once",
      ],
      answer: 1,
      explanation:
        "Brilakis: retroperitoneal haematomas present with hypotension, sweating and lower abdominal or back pain, the patients often develop bradycardia, they usually occur within 3 hours, and closure devices do not exclude them. Oxford tells you to reconsider a vasovagal diagnosis that has not improved within a few minutes. Tamponade usually brings a tachycardia, and Brilakis places delayed contrast reactions usually 6–12 hours after the contrast; the picture here is that of a retroperitoneal bleed.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "cm-patient-complications-q4",
      stem: "VF follows an RCA injection in a monitored patient. The physiologist presses the shock button twice and nothing happens. What is the most likely reason, and the fix?",
      options: [
        "The pads are on the sternum and the apex, which is the wrong position for VF; move them to the anterior–posterior position",
        "The defibrillator is in synchronised mode and is waiting for an R wave; switch sync off and shock at high energy",
        "The energy is set too high for a first shock; reduce it to 50 J, because VF in the lab responds to low energies",
        "Amiodarone has not been given; VF in the lab does not respond to shocks until amiodarone 300 mg has been given",
      ],
      answer: 1,
      explanation:
        "Oxford reserves synchronisation for cardioversion of organised rhythms, where the shock is timed to the R wave; VF needs unsynchronised high-energy shocks (150–200 J biphasic, 200–360 J monophasic) as fast as possible, and repeated failure means checking the settings or using another defibrillator. Sternum and apex is Oxford's standard pad position. Amiodarone is for VF that persists despite shocks.",
      difficulty: 2,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "cm-patient-complications-q5",
      stem: "For rotational atherectomy of a dominant RCA in a patient with a normal baseline ECG, which preparation does Brilakis describe for the risk of bradycardia?",
      options: [
        "None: bradycardia during atherectomy is rare in the RCA and resolves when the patient coughs during each run",
        "A temporary pacing wire, aminophylline 250–300 mg IV over 10 minutes or IV atropine, or brief test runs",
        "Intracoronary adenosine 200 µg before the first run to precondition the AV node against further ischaemia",
        "Isoprenaline infusion at 5–10 µg/min throughout, because it reliably improves AV conduction during runs",
      ],
      answer: 1,
      explanation:
        "Brilakis's calcium chapter gives a temporary pacemaker, aminophylline (250–300 mg IV over 10 minutes, or 20–40 mg intracoronary) or atropine 0.5–1.0 mg IV before atherectomy, or brief test runs that are stopped if bradycardia appears; atherectomy bradycardia usually resolves when the run stops. Adenosine is the mediator released by injured red cells and would make it worse; Oxford notes that isoprenaline rarely improves AV conduction.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "cm-patient-complications-q6",
      stem: "Which combination of set-up changes would lower a patient's skin dose the most for the same images, according to Brilakis?",
      options: [
        "Lower the table for operator comfort, raise the image receptor, and use 15 fps fluoroscopy for better images",
        "Raise the table, bring the receptor close to the chest, use 6–7.5 fps, and keep within about 30° of AP",
        "Use magnification throughout, keep a single steep LAO cranial projection, and rely on cine to document inflations",
        "Place a disposable shield inside the field of view and remove collimation so that the wire tips are always visible",
      ],
      answer: 1,
      explanation:
        "Brilakis: table high and receptor close (the alternative geometries cost 1.4 and 2.6 times the dose), 6–7.5 fps routinely, low magnification, collimation, angles within about 30° of AP, fluoro save instead of cine (about 10 times less dose), and changing the skin entry point. A disposable shield in the field makes the tube work harder.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "cm-patient-complications-q7",
      stem: "A CTO case ends at 7.6 Gy air kerma. Which statement best reflects the two manuals?",
      options: [
        "Brilakis would usually have stopped (5–7 Gy) or considered stopping (7–8 Gy); check the back within a month",
        "Both manuals set 15 Gy as the point at which a procedure must stop, and skin follow-up is needed only above that dose",
        "Oxford's 1 Gy warning is a stopping rule: the operator must end the case once the radiographer announces 1 Gy",
        "Below 10 Gy no follow-up is needed, because skin injury is unlikely below that threshold in Brilakis's table",
      ],
      answer: 0,
      explanation:
        "Brilakis's two chapters give slightly different stopping points (usually stop above 5–7 Gy in 2.5; consider stopping at 7–8 Gy in 28.2.2.4.8). Above 5 Gy he follows the patient up within a month with a documented skin examination. Skin injury is 'possible' at 5–10 Gy, not unlikely. Oxford's 1 Gy warning is a prompt to record and communicate the dose, not a stopping rule; 15 Gy is the US sentinel-event threshold.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "cm-patient-complications-q8",
      stem: "An 85 kg woman with an eGFR of 20 mL/min/1.73 m² needs PCI of a proximal LAD. Which contrast plan reflects Brilakis's advice for advanced kidney disease?",
      options: [
        "Up to 425–595 mL, as Oxford's 5–7 mL/kg rule allows for her weight",
        "Up to about 74 mL (3.7 × GFR), which is the ceiling Brilakis applies in every patient",
        "Ideally less than about 20 mL, with imaging-guided, ultra-low contrast technique",
        "Up to about 40 mL (twice the clearance), since injury only occurs above three times the clearance",
      ],
      answer: 2,
      explanation:
        "Brilakis 28.3: in advanced CKD (eGFR below 30), giving less contrast than the creatinine clearance is ideal, and a ratio above 2 predicts injury. The 3.7 × GFR ceiling is his general rule, lowered in CKD. Gurm found a trend towards more injury above twice the clearance and a clear rise above three times, not a safe zone up to three times. Oxford's weight rule ignores the kidneys. Here the eGFR stands in for the creatinine clearance; strictly, the rule uses the calculated creatinine clearance, which can differ from the indexed eGFR in a heavier patient.",
      difficulty: 3,
      refs: [...BRILAKIS, "gurm-contrast-dose-2011"],
    },
    {
      id: "cm-patient-complications-q9",
      stem: "Which preventive measure for contrast-associated kidney injury, recommended in one of the manuals, was not supported by the PRESERVE trial?",
      options: [
        "Intravenous normal saline before and after the procedure, tailored to volume status",
        "N-acetylcysteine 600 mg 12-hourly, or a sodium bicarbonate infusion, in severe renal dysfunction",
        "Limiting the contrast volume to less than the creatinine clearance in advanced kidney disease",
        "Stopping NSAIDs and holding metformin in chronic kidney disease around the procedure",
      ],
      answer: 1,
      explanation:
        "Oxford suggests acetylcysteine and bicarbonate; PRESERVE (5,177 high-risk patients) found no benefit of IV bicarbonate over IV saline or of oral acetylcysteine over placebo for death, dialysis, persistent renal decline at 90 days, or contrast-associated kidney injury. Saline hydration (Brilakis's preferred fluid), contrast limitation and stopping nephrotoxins remain the core measures.",
      difficulty: 2,
      refs: ["oxford-cath-handbook", "preserve-2018"],
    },
    {
      id: "cm-patient-complications-q10",
      stem: "A patient bleeding heavily from a femoral access site after PCI is taking aspirin and ticagrelor; a GP IIb/IIIa inhibitor infusion is running and heparin was given 20 minutes ago. All coronary equipment has been removed. Which set of actions is correct?",
      options: [
        "Stop the GP IIb/IIIa infusion, give protamine slowly (up to 50 mg), control the site, and remember that platelets may not overcome ticagrelor",
        "Give a specific antidote for the GP IIb/IIIa inhibitor, transfuse platelets to reverse ticagrelor, and wait to give protamine until the next day",
        "Continue all antithrombotic drugs because the stent is new, and treat the bleeding only with prolonged manual compression",
        "Give protamine 100 mg rapidly to neutralise all the heparin and the GP IIb/IIIa inhibitor at once, then repeat the ACT",
      ],
      answer: 0,
      explanation:
        "Brilakis: eptifibatide, tirofiban and cangrelor have no reversal agent, so the infusion is stopped; heparin is reversed with protamine (capped at 50 mg, given slowly) once all coronary equipment is out; platelet transfusion may not work for ticagrelor because its binding is reversible; and the site is treated specifically. Protamine does not reverse GP IIb/IIIa inhibitors, and doses above 50 mg are outside both manuals.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "cm-patient-complications-q11",
      stem: "In a hypotensive patient after femoral access, contralateral angiography shows active bleeding from a large-vessel perforation of the external iliac artery. Prolonged low-pressure balloon inflation has not achieved haemostasis. What is the next step in Brilakis's algorithm?",
      options: [
        "Coil embolisation of the external iliac artery at the site of the tear",
        "A covered stent across the perforation, with surgery if it fails",
        "Withdraw the balloon and hold manual pressure over the groin for 30 minutes",
        "Inject thrombin around the perforation under ultrasound guidance",
      ],
      answer: 1,
      explanation:
        "Brilakis Fig. 29.4: active bleeding from a large-vessel perforation is treated with a covered stent across the perforation when balloon inflation fails, with surgery if the stent fails or is not suitable. Coils and sealants are for small branches; thrombin injection under ultrasound treats a femoral pseudoaneurysm (Oxford), not a free iliac tear; compression is unlikely to help a retroperitoneal bleed.",
      difficulty: 3,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage both coronaries watching the trace before every injection; if the pressure falls, run the false-reading checks, then name the group of true hypotension; if the trace damps or the conus fills, withdraw before injecting." },
    { sim: "procedure", task: "For a patient with an eGFR of 28, write the hydration order and the contrast ceiling before the puncture; at the end, after femoral closure, manage a fall in pressure as vagal or bleeding within a stated time limit." },
    { sim: "pacing", task: "Place a temporary wire before atherectomy of a dominant RCA, and rehearse pacing for Mobitz II or complete block that does not respond to atropine." },
  ],
  caseIds: ["cm-patient-complications-case-femoral-collapse", "cm-patient-complications-case-ckd-cto"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "cm-patient-complications-case-femoral-collapse",
    title: "A falling pressure after femoral PCI",
    trackId: "complication-management",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 28.1 (hypotension: false and true, Fig. 28.1), 29.1.2 (femoral bleeding and the Fig. 29.4 retroperitoneal algorithm), 3.4 and 26.2 (protamine), 3.5 (antiplatelet reversal); Oxford Handbook ch 10 (vasovagal reaction, vascular complications, cardiac tamponade).",
    },
    summary:
      "Hypotension at the end of a femoral PCI: excluding a false reading, recognising that a slow pulse does not exclude bleeding, running the general bleeding measures, reversing heparin correctly, confirming a retroperitoneal bleed in the lab, stopping it from the other groin, and planning the antiplatelet therapy afterwards.",
    presentation:
      "A 76-year-old woman (62 kg) with NSTEMI. Both radial arteries were found to be occluded, so the right femoral artery was used; the puncture needed three attempts and was not guided by ultrasound. A mid-LAD lesion was stented. She received aspirin, ticagrelor and 6,000 units of heparin (ACT 290 s). The coronary wire and balloon have been removed and the final images are being taken through the guide.",
    findings: [
      "Arterial pressure on the guide trace falls over two minutes from 132/70 to 84/50 mmHg",
      "Heart rate 56/min, sinus rhythm, no new ST changes",
      "She is pale and sweaty and says her back aches",
      "Haemoglobin before the case 118 g/L",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The pressure on the monitor has fallen. What do you do first?",
        options: [
          {
            text: "Announce it, and in a few seconds check the Y-connector valve, the line and transducer, damping, catheter obstruction and equipment inside the guide",
            best: true,
            feedback: "Right: Brilakis's sequence starts by excluding a false reading. Here the trace is a good aortic waveform with the guide disengaged, the valve is closed and the line is intact, so the hypotension is real.",
          },
          {
            text: "Start a noradrenaline infusion at once, because a systolic of 84 mmHg will not perfuse the newly stented LAD",
            feedback: "A pressor may be needed, but giving it before you know whether the reading is real, and before you have looked for a cause, treats a number. It also hides how fast she is deteriorating.",
            next: "c-pressor",
            stateDelta: { stability: -10, flags: ["pressor-first"] },
          },
          {
            text: "Give atropine 0.6 mg for the slow pulse and continue the final runs, since this is clearly a vasovagal reaction",
            feedback: "Atropine may support a slow pulse, but this skips Brilakis's first step (is the reading real?), carries on imaging a patient who may be bleeding, and labels her vagal without evidence. After femoral access, Brilakis wants a retroperitoneal bleed suspected in every patient who becomes hypotensive.",
            stateDelta: { stability: -8 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The reading is real. Heart rate 54/min, pressure 82/48 mmHg, pale, sweating, aching back. The groin looks flat. What is your working diagnosis and plan?",
        options: [
          {
            text: "Give atropine and fast saline as support, but treat this as a retroperitoneal bleed until proven otherwise: screen the pelvis now and start the bleeding measures",
            best: true,
            feedback: "Brilakis suspects a retroperitoneal haematoma in every patient who becomes hypotensive during or after femoral catheterisation; back pain and sweating are typical, these patients are often bradycardic, and the risk factors here are a femoral puncture without imaging guidance and several attempts. The bladder is outlined by contrast already.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Vasovagal reaction: legs up, atropine and saline, and reassess in 15 minutes once the final runs are finished",
            feedback: "Oxford gives a few minutes, not fifteen, for a vagal reaction to improve before the diagnosis is reconsidered, and the slow pulse does not exclude a bleed.",
            next: "c-wait",
            stateDelta: { stability: -15, flags: ["delayed-diagnosis"] },
          },
          {
            text: "Tamponade from the LAD wire: perform pericardiocentesis immediately without imaging",
            feedback: "Tamponade usually brings a tachycardia, and nothing in the procedure suggests a perforation; an echo would answer the question in a minute if you were worried. Draining a pericardium without fluid exposes her to injury.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "Fluoroscopy of the pelvis shows the bladder pushed across from the right. Her pressure is 80/46 mmHg after 500 mL of saline. What now?",
        info: "A displaced ('dented') bladder: strongly suggestive of a retroperitoneal haematoma.",
        options: [
          {
            text: "Call for help; large-bore IV access, more saline, group and crossmatch, haemoglobin; protamine now the diagnosis is made and the coronary is empty",
            best: true,
            feedback: "These are Brilakis's general measures. With the coronary empty and the diagnosis established, reversal with protamine is appropriate: slowly, capped at 50 mg, and less than the full calculated dose given the time since the heparin.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give protamine 60 mg as a rapid push to neutralise all 6,000 units, then reassess the groin",
            feedback: "Over the 50 mg cap, too fast, and more than the heparin still circulating. Protamine given like this can itself cause severe hypotension and pulmonary vasoconstriction within minutes.",
            next: "c-protamine",
            stateDelta: { stability: -15, flags: ["protamine-reaction"] },
          },
          {
            text: "Send her for an urgent CT scan of the abdomen and pelvis to confirm the haematoma before doing anything further",
            feedback: "CT is for a stable patient outside the lab. She is unstable and already in the lab, where angiography can show and treat the source.",
            stateDelta: { stability: -10, flags: ["delayed-diagnosis"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The general measures are running. How do you find the source?",
        options: [
          {
            text: "Obtain contralateral (left) femoral access and perform angiography of the right iliac and femoral arteries",
            best: true,
            feedback: "Brilakis's algorithm, in the lab: bladder fluoroscopy, then contralateral access and iliofemoral angiography to find the bleeding point and treat it.",
          },
          {
            text: "Hold firm pressure over the right groin for 20 minutes and see whether the pressure stabilises",
            feedback: "Oxford: manual compression is unlikely to help a retroperitoneal bleed from a high puncture. Pressure at the site is part of the general measures, not a substitute for finding the source.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Inject contrast through the right femoral sheath while pulling it back to find the hole",
            acceptable: true,
            feedback: "A sheath angiogram from the same side may show the problem, but Brilakis's algorithm uses contralateral access, which also gives you a route to place a balloon and a covered stent across the hole.",
          },
        ],
      },
      {
        id: "s5",
        prompt: "Angiography shows brisk extravasation from the right external iliac artery itself, just above the inguinal ligament, at the puncture site. What is your first move?",
        options: [
          {
            text: "Inflate a balloon at low pressure across the bleeding point to stop the flow before any definitive treatment",
            best: true,
            feedback: "Brilakis: stop the ongoing bleeding first with a low-pressure balloon across the site, then decide on definitive treatment by the type of perforation.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Deliver coils into the external iliac artery at the point of extravasation",
            feedback: "Coils are for small branch perforations such as the inferior epigastric; in a large vessel they would occlude the iliac artery and the leg's supply.",
            next: "c-coil",
            stateDelta: { stability: -15 },
          },
          {
            text: "Send her straight to theatre for surgical repair of the artery",
            acceptable: true,
            feedback: "Surgery is part of the algorithm when endovascular treatment fails or is unsuitable, but a balloon can stop the bleeding in seconds while that decision is made.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "After several minutes of balloon inflation, deflation still shows extravasation. What definitive treatment do you choose?",
        options: [
          {
            text: "A covered stent across the perforation in the external iliac artery, choosing the type by where it must sit",
            best: true,
            feedback: "Brilakis: when prolonged inflation fails, a covered stent seals a large-vessel perforation. Balloon-expandable covered stents place more precisely; self-expanding ones are preferred in the common femoral artery, where flexion deforms stents. Choosing a balloon-expandable stent for a tear that stays above the common femoral artery is this module's reasoning from those two points.",
            stateDelta: { stability: 10 },
          },
          {
            text: "A bare-metal stent across the hole, because it is easier to deliver than a covered stent",
            feedback: "A bare stent does not seal a perforation.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Surgical repair now, without trying a covered stent first",
            acceptable: true,
            feedback: "Surgery is the fallback when a covered stent fails or is undesirable (for example at the femoral bifurcation); in Brilakis's algorithm a covered stent is tried first for a large-vessel tear when balloon inflation fails.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "s7",
        prompt: "The bleeding has stopped, she has received two units of blood and her pressure is 118/64 mmHg. The LAD stent is 90 minutes old. What do you do about her antiplatelet therapy?",
        options: [
          {
            text: "Continue dual antiplatelet therapy, consider de-escalating ticagrelor to clopidogrel, and record the decision and the reasons for it",
            best: true,
            feedback: "Brilakis lists de-escalation from ticagrelor or prasugrel to clopidogrel among the treatments for bleeding on dual antiplatelet therapy; for bleeding, his switching scheme gives clopidogrel 75 mg as a maintenance dose, with no loading dose, 24 hours after the last ticagrelor dose. Stopping both agents hours after stenting risks stent thrombosis.",
          },
          {
            text: "Stop aspirin and ticagrelor for a week to let the iliac artery heal",
            feedback: "Stopping both agents so soon after a stent invites stent thrombosis, and the source has already been sealed.",
            stateDelta: { stability: -15, flags: ["dapt-stopped"] },
          },
          {
            text: "Transfuse platelets to reverse the ticagrelor before she returns to the ward",
            feedback: "The bleeding has stopped, and Brilakis notes that transfused platelets may not work against ticagrelor, whose binding is reversible.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "c-pressor",
        kind: "consequence",
        prompt: "On noradrenaline the pressure rises to 96/60 mmHg for a few minutes, then falls again despite a higher dose. She is sweating and her back hurts more. What now?",
        options: [
          {
            text: "Keep the infusion but now run the checks and the differential: the pressor is buying time, not treating the cause",
            best: true,
            feedback: "Support and diagnosis run side by side (Brilakis 28.1.3). A rising pressor requirement in a femoral patient is a bleed until shown otherwise.",
            next: "s2",
          },
          {
            text: "Double the noradrenaline dose again and wait for it to work",
            feedback: "Escalating a pressor without a diagnosis lets a bleed continue.",
            next: "s2",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-wait",
        kind: "consequence",
        prompt: "Fifteen minutes later she is grey and confused; pressure 70/40 mmHg, pulse 50/min, despite atropine and a litre of saline.",
        options: [
          {
            text: "Reconsider at once: this is not a vagal reaction; screen the pelvis and start the bleeding measures",
            best: true,
            feedback: "Oxford: if the patient has not improved within a few minutes, reconsider the diagnosis and exclude infarction, tamponade and a retroperitoneal bleed. The delay has cost blood.",
            next: "s3",
          },
          {
            text: "Give a second dose of atropine and another litre, then reassess",
            feedback: "Repeating vagal treatment without a new diagnosis lets the bleed continue.",
            next: "s3",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-protamine",
        kind: "consequence",
        prompt: "Eight minutes after the rapid protamine dose her pressure falls to 60/35 mmHg, although the bleeding appears no worse.",
        options: [
          {
            text: "Treat a protamine reaction: vasopressor support and fluid, consider methylene blue, and carry on finding the bleeding source",
            best: true,
            feedback: "Brilakis: protamine can cause severe systemic hypotension with relative pulmonary hypertension, usually 5–10 minutes after the dose, and methylene blue may help recovery. Slow, capped doses make it less likely.",
            next: "s4",
          },
          {
            text: "Give a further 50 mg of protamine, assuming the fall is from continued bleeding",
            feedback: "More protamine worsens a protamine reaction and, at high doses, protamine itself has an anticoagulant effect (Oxford).",
            next: "s4",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-coil",
        kind: "consequence",
        prompt: "The coils slow the bleeding but the right leg is now pale and cold, with no flow below the coils.",
        options: [
          {
            text: "Recognise that coils occluded a large vessel: restore flow (endovascular or surgical) and seal the tear with a covered stent or surgery",
            best: true,
            feedback: "Coils belong in small branches. A large-vessel tear needs a covered stent or surgical repair so that the limb keeps its supply.",
            next: "s6",
          },
          {
            text: "Accept the occlusion: the bleeding has slowed, and the leg will recover through collaterals",
            feedback: "An occluded external iliac artery threatens the limb; this is a new complication that needs treatment.",
            next: "s6",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "The external iliac perforation at a high, unguided puncture was sealed with a covered stent after low-pressure balloon tamponade. Two units of blood, saline and slow, capped protamine restored her pressure. She stayed on dual antiplatelet therapy, de-escalated to clopidogrel, and left hospital five days later.",
    outcomeVariants: [
      { flag: "delayed-diagnosis", text: "Treating the collapse as vagal, or sending an unstable patient to CT, delayed control of the bleeding: she needed more blood and an intensive care stay." },
      { flag: "protamine-reaction", text: "The rapid, uncapped protamine dose caused a reaction that added to the instability and needed pressor support." },
      { flag: "dapt-stopped", text: "Stopping both antiplatelet drugs within hours of stenting exposed her to stent thrombosis, the very complication the stent was meant to prevent." },
      { flag: "pressor-first", text: "Starting a pressor before a diagnosis masked the speed of the bleed for several minutes." },
    ],
    learningPoints: [
      "Confirm that the low pressure is real, then classify it; a femoral patient who becomes hypotensive has a retroperitoneal bleed until proven otherwise (Brilakis).",
      "A slow pulse does not exclude bleeding: retroperitoneal haematomas are often bradycardic.",
      "Give a vagal reaction a few minutes to improve; if it does not, reconsider (Oxford).",
      "General measures: large-bore access, saline, crossmatch, haemoglobin (which lags), pressure, then reversal once the diagnosis is made.",
      "Protamine only with the coronary empty, slowly, capped at 50 mg, and less as time passes.",
      "In the lab: bladder screen, contralateral access, iliofemoral angiography, low-pressure balloon, then covered stent for a large vessel or coils for a small branch; surgery if these fail.",
      "Afterwards, de-escalate rather than stop dual antiplatelet therapy, and remember that platelets may not overcome ticagrelor.",
    ],
    refs: BOOKS,
  },
  {
    id: "cm-patient-complications-case-ckd-cto",
    title: "A long RCA case in a patient with failing kidneys",
    trackId: "complication-management",
    stage: 3,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Brilakis, Manual of PCI 2.5 and 2.6 (dose and contrast monitoring), 28.2 (radiation skin injury: prevention, thresholds, follow-up), 28.3 (contrast-induced acute kidney injury), 1.1 and 1.6 (planning in renal failure), 15.1 (contrast that does not clear), 3.7 (amiodarone); Oxford Handbook ch 9 (defibrillation) and ch 10 (contrast nephropathy, arrhythmia).",
    },
    summary:
      "An RCA chronic total occlusion in a diabetic man with an eGFR of 28: planning the contrast ceiling and the kidney protection, sparing contrast, handling VF after an injection, bringing the dose rate down, deciding to stop and stage, and arranging the skin and kidney follow-up.",
    presentation:
      "A 69-year-old man (80 kg) with diabetes and chronic kidney disease (eGFR 28 mL/min/1.73 m², creatinine 205 µmol/L), angina despite three drugs, and a mid-RCA chronic total occlusion with good left-to-right collaterals. His creatinine clearance by the Cockcroft–Gault equation is about 34 mL/min. He takes metformin and ibuprofen for knee pain. He had a contrast CT of the chest 2 days ago for a lung nodule. Ejection fraction 55%.",
    findings: [
      "Elective admission for RCA CTO PCI",
      "Radial and femoral access both suitable",
      "No previous radiation injury on examination of the back",
      "Pressure 138/76 mmHg, heart rate 68/min, sinus rhythm",
    ],
    steps: [
      {
        id: "s1",
        prompt: "At the planning stage, what contrast ceiling and kidney preparation do you set?",
        options: [
          {
            text: "Count the CT and consider delaying this elective case; IV normal saline before and after; stop ibuprofen and hold metformin; ceiling well below 3.7 × GFR (about 104 mL), ideally below his clearance of about 34 mL/min",
            best: true,
            feedback: "Brilakis: count recent contrast against the ceiling, use a lower threshold than 3.7 × GFR in CKD, aim below the clearance in advanced disease with an imaging-led plan, hydrate with normal saline, stop NSAIDs, and in CKD hold metformin on the day and for at least 48 hours afterwards. He allows non-emergent PCI to be staged in renal failure; delaying after a CT, and for how long, is this module's reasoning rather than a rule in either book. His eGFR is 28, but Brilakis's contrast ratio is built on the creatinine clearance (his Table 1.2 points to a Cockcroft–Gault calculator). By Cockcroft and Gault's formula, (140 − 69) × 80 ÷ (72 × 2.32 mg/dL), that is about 34 mL/min.",
          },
          {
            text: "A ceiling of 400–560 mL using Oxford's 5–7 mL/kg rule, with acetylcysteine and bicarbonate to protect the kidneys",
            feedback: "The weight rule ignores his kidneys, and PRESERVE found no benefit from acetylcysteine or bicarbonate over saline.",
            next: "c-overload",
            stateDelta: { stability: -15, flags: ["high-contrast"] },
          },
          {
            text: "A ceiling of 104 mL (3.7 × GFR), proceeding tomorrow with the CT contrast ignored, saline hydration and metformin continued",
            feedback: "The arithmetic is right for the general rule, but this plan breaks three of Brilakis's points: he lowers the ceiling in CKD, counts the recent CT against it, and holds metformin in CKD.",
            stateDelta: { stability: -10, flags: ["high-contrast"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The case starts a week later. How do you image the RCA and its collaterals with the least contrast?",
        options: [
          {
            text: "Put the previous angiograms on the lab monitor, confirm guide engagement with the wire, use 2–3 mL injections, avoid side-hole guides if the trace allows, and use IVUS for the stent",
            best: true,
            feedback: "These are the contrast-sparing measures in Brilakis's Table 28.1 and 30.2.5.",
          },
          {
            text: "Repeat full diagnostic views of both arteries with 8–10 mL injections and add a ventriculogram to document the ejection fraction",
            feedback: "Old angiograms and the echo already answer these questions; repeating them spends the budget before the PCI starts.",
            next: "c-overload",
            stateDelta: { stability: -10, flags: ["high-contrast"] },
          },
          {
            text: "Use test injections before every device to confirm guide position, but keep each one under 5 mL",
            acceptable: true,
            feedback: "Small injections help, but the wire in the ostium confirms engagement without any contrast.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "After a 3 mL injection through a deeply seated guide with a damped trace, the contrast stays in the proximal RCA and the monitor shows VF. The patient is unresponsive.",
        options: [
          {
            text: "Unsynchronised shock at high energy straight away, then pull the guide out of the ostium so the contrast clears, and re-engage carefully",
            best: true,
            feedback: "VF is shocked first (Oxford: unsynchronised, high initial energy). Contrast that does not clear because the catheter occludes the ostium causes VF and VT, and the remedy is to disengage (Brilakis 15.1, 6.5). The lesson for next time: no injection through a damped trace.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give amiodarone 300 mg IV, then shock if VF continues",
            feedback: "Shock first; amiodarone is for VF that resists defibrillation.",
            next: "c-vf",
            stateDelta: { stability: -20, flags: ["delayed-shock"] },
          },
          {
            text: "Inject saline down the guide to flush the contrast, then defibrillate",
            feedback: "Injecting through a damped, wedged guide risks dissection and air, and delays the shock.",
            next: "c-vf",
            stateDelta: { stability: -20, flags: ["delayed-shock"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Sinus rhythm returns after one shock. An hour later, working in a steep LAO projection, the air kerma is 4.1 Gy and the dose rate reads 34 mGy/min. The table is low and the receptor is raised. What do you change?",
        options: [
          {
            text: "Raise the table, bring the receptor down to the chest, move to a shallower angle, collimate, drop to 7.5 fps, use fluoro save, and vary the projection",
            best: true,
            feedback: "Brilakis acts on a dose rate above 20 mGy/min: geometry (up to 2.6 times the skin dose with a low table and raised receptor), angles within about 30° of AP, collimation, low frame rate and moving the skin entry point.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep the same projection because it shows the occlusion best, and switch to 15 fps to see the wire better",
            feedback: "One steep projection for an hour concentrates the dose on one patch of skin, and 15 fps roughly doubles the rate.",
            next: "c-dose",
            stateDelta: { stability: -10, flags: ["high-dose"] },
          },
          {
            text: "Change only the projection, leaving the table height and frame rate as they are",
            acceptable: true,
            feedback: "Moving the entry point helps, but the biggest gains here are the geometry and the frame rate.",
            stateDelta: { stability: -3 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "At 6.8 Gy and 30 mL of contrast, the antegrade wire is still subintimal and re-entry has failed twice. What now?",
        options: [
          {
            text: "Stop and stage: you are at Brilakis's usual stopping dose and close to the contrast ideal; plan a second attempt (possibly retrograde) after recovery",
            best: true,
            feedback: "Brilakis usually stops at 5–7 Gy (2.5), or considers stopping at 7–8 Gy and staging (28.2); the 30 mL of contrast is already close to his clearance of about 34 mL/min, and Brilakis would ideally stay below the clearance in advanced CKD. Staging is a planned outcome, not a failure.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Carry on with a retrograde approach now, since the patient is stable and the collaterals are good",
            feedback: "Starting a new strategy at this dose and contrast load pushes both well past the limits set at the brief.",
            next: "c-dose",
            stateDelta: { stability: -15, flags: ["high-dose", "high-contrast"] },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The case ends at 6.9 Gy air kerma and 32 mL of contrast. What do you arrange before he goes home?",
        options: [
          {
            text: "Tell him the dose and what a skin reaction would look like, document it, book a skin check of his back within a month, continue saline, check creatinine at 48 hours and again in the following days, and keep metformin and ibuprofen stopped",
            best: true,
            feedback: "Above 5 Gy Brilakis follows up within a month with a documented skin examination and warns the patient so that a red patch is not biopsied. Creatinine is checked for at least 48 hours (Brilakis), remembering the peak at 4–5 days (Oxford).",
          },
          {
            text: "No radiation follow-up, because injury is unlikely below 10 Gy; creatinine at 24 hours before discharge",
            feedback: "Skin injury is possible from 5 Gy, and a single 24-hour creatinine can miss injury that peaks at 4–5 days.",
            stateDelta: { stability: -10, flags: ["no-follow-up"] },
          },
          {
            text: "Arrange a physicist's peak skin dose calculation and notify the regulator within 24 hours",
            feedback: "The physicist calculation is Brilakis's step above 10 Gy and the 24-hour notification belongs to peak skin doses above 15 Gy, so the regulator is notified unnecessarily, while the steps that matter at 6.9 Gy are missing: telling the patient, documenting, and a skin check within a month.",
            stateDelta: { stability: -5, flags: ["no-follow-up"] },
          },
        ],
      },
      {
        id: "s7",
        prompt: "At 48 hours his creatinine is 262 µmol/L (from 205). He feels well and is passing urine. How do you manage it?",
        options: [
          {
            text: "This meets the definition of contrast-associated kidney injury; there is no specific treatment: keep nephrotoxins and metformin stopped, match fluid to his volume status, and recheck the creatinine",
            best: true,
            feedback: "A rise of 57 µmol/L (28%) within 48 hours meets Oxford's definition (more than 25%, or 44 µmol/L, at 24–48 hours) and the KDIGO criterion of at least 26.5 µmol/L within 48 hours. Because creatinine peaks at 4–5 days (Oxford), keep measuring. Brilakis: no specific treatment once established; most patients return to baseline, some need dialysis. If impairment persisted beyond 2 weeks with livedo or eosinophilia, cholesterol embolisation would be the alternative diagnosis.",
          },
          {
            text: "Start N-acetylcysteine and a bicarbonate infusion to reverse the injury",
            feedback: "Neither treats established injury, and PRESERVE showed no preventive benefit either.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Restart metformin now that the procedure is over, since he feels well",
            feedback: "In CKD Brilakis restarts metformin no earlier than 48 hours, and certainly not while creatinine is rising.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "c-overload",
        kind: "consequence",
        prompt: "By the time the wire reaches the occlusion, 160 mL of contrast has been used. What do you do?",
        options: [
          {
            text: "Stop now and stage; tell the team the contrast ceiling has been passed; hydrate and follow the creatinine closely",
            best: true,
            feedback: "Approaching or passing the ceiling means stop or stage. Every extra millilitre adds to the risk in advanced CKD.",
          },
          {
            text: "Continue: the damage is done, so a little more makes no difference",
            feedback: "Risk rises with each step above the ceiling (Gurm: steeply above three times the clearance).",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-vf",
        kind: "consequence",
        prompt: "Forty seconds pass before the first shock. VF continues after it.",
        options: [
          {
            text: "Shock again immediately at high energy with sync off, start compressions if VF persists, give amiodarone 300 mg for shock-resistant VF, and disengage the guide",
            best: true,
            feedback: "Oxford: defibrillate as fast as possible; if VF resists, amiodarone 300 mg and consider another defibrillator; correct potassium and magnesium. The trigger (a wedged guide with retained contrast) must be removed.",
          },
          {
            text: "Wait for the amiodarone to take effect before the next shock",
            feedback: "Every delay in defibrillation lowers the chance of success.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "c-dose",
        kind: "consequence",
        prompt: "The air kerma reaches 9.8 Gy, most of it through one entry point on his right back.",
        options: [
          {
            text: "Stop, record the dose, explain it, ask a physicist to estimate the peak skin dose, and arrange skin checks within weeks",
            best: true,
            feedback: "Near 10 Gy, injury is possible to likely; Brilakis asks for a physicist's peak skin dose estimate and early skin examination above 10 Gy, and follow-up within a month above 5 Gy.",
          },
          {
            text: "Continue: skin injury is only likely above 15 Gy",
            feedback: "Injury is likely from 10 Gy; 15 Gy is the sentinel-event threshold.",
            stateDelta: { stability: -15 },
          },
        ],
      },
    ],
    outcome:
      "The occlusion was not crossed at the first attempt, but the procedure stopped close to the dose and contrast limits (32 mL, just below his creatinine clearance of about 34 mL/min; 6.9 Gy, at the top of Brilakis's usual 5–7 Gy stopping range). His creatinine rose modestly and returned towards baseline over the next week; the skin of his back was normal at the 4-week check. A second, retrograde attempt was planned with an ultra-low contrast protocol.",
    outcomeVariants: [
      { flag: "high-contrast", text: "The contrast load far exceeded his clearance: his creatinine rose further and he needed a longer admission and renal follow-up." },
      { flag: "delayed-shock", text: "The delay to defibrillation prolonged the arrest; he recovered, but the case had to be abandoned." },
      { flag: "high-dose", text: "The concentrated dose produced redness and hair loss on his back at four weeks, which was recognised because he had been warned and was examined." },
      { flag: "no-follow-up", text: "Without a booked skin check or later creatinine, problems would have been found late, if at all." },
    ],
    learningPoints: [
      "Set the contrast ceiling from renal function, lower it in CKD, count recent contrast, and in advanced disease aim below the creatinine clearance.",
      "Saline hydration, stopping NSAIDs and holding metformin are the preparation; acetylcysteine and bicarbonate are not (PRESERVE).",
      "Wire instead of test injections, 2–3 mL runs, no side-hole guide where avoidable, IVUS instead of angiography.",
      "VF after an injection into a wedged guide: shock first, then disengage so the contrast clears.",
      "Act on a dose rate above 20 mGy/min: table up, receptor down, shallower angles, collimation, 7.5 fps, changing the entry point.",
      "Stop and stage around 5–7 Gy; above 5 Gy, warn the patient and check the back within a month.",
      "Follow creatinine beyond 48 hours; there is no specific treatment once kidney injury is established.",
    ],
    refs: [...BOOKS, "preserve-2018", "cockcroft-creatinine-clearance-1976"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-hypo-amplatz-valve",
    lab: "pci",
    when: { event: ["hypotension"], catheter: ["AL", "EBU"] },
    title: "Pressure falls with an Amplatz or deep EBU: free the aortic valve",
    text: "An Amplatz, or an EBU with a deep curve, can hold one aortic cusp open so that the valve leaks acutely, and the systemic pressure falls. Pull the guide back or reposition it: if this is the cause, the pressure recovers at once.",
    tone: "caution",
    lessonId: "cm-patient-complications-hypotension",
    sources: [B("28.1")],
    refs: BRILAKIS,
  },
  {
    id: "diag-hypo-amplatz-valve",
    lab: "diagnostic",
    when: { event: ["hypotension"], catheter: ["AL"] },
    title: "Low pressure with an Amplatz seated deep: check the valve",
    text: "A deeply advanced Amplatz can hold an aortic cusp open and cause acute regurgitation and hypotension. Withdraw it a little and watch the trace; Brilakis shows the pressure recovering as soon as the catheter comes off the valve.",
    tone: "caution",
    lessonId: "cm-patient-complications-hypotension",
    sources: [B("28.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-hypo-rhc-when-unclear",
    lab: "pci",
    when: { phase: ["complication"], event: ["hypotension"] },
    title: "Hypotension without an obvious cause: measure it",
    text: "If the reading is real and the cause is not apparent, a right heart catheter separates the groups: low filling pressure and low output means hypovolaemia, high filling pressure and low output means pump failure (low filling pressure if the right ventricle fails), low filling pressure and high output means vasodilation. Support the pressure while you measure.",
    tone: "do",
    lessonId: "cm-patient-complications-hypotension",
    sources: [B("28.1"), B("2.3")],
    refs: BRILAKIS,
  },
  {
    id: "diag-hypo-after-vasodilator",
    lab: "diagnostic",
    when: { phase: ["setup", "inject", "engage-left", "engage-right"], event: ["hypotension"] },
    title: "Pressure down: if a nitrate or verapamil was just given, stop, fill, wait",
    text: "If a vasodilator has just gone in, give no more; nitroglycerin's half-life is only minutes. Run saline and watch: the pressure often recovers within a few minutes. Use noradrenaline or phenylephrine if the fall is extreme or persists, and if it does not recover, look for another cause, bleeding first.",
    tone: "bailout",
    lessonId: "cm-patient-complications-hypotension",
    sources: [B("3.2"), B("6.3")],
    refs: BRILAKIS,
  },
  {
    id: "diag-vagal-sequence",
    lab: "diagnostic",
    when: { event: ["bradycardia"], requires: ["hypotension"] },
    title: "Slow, then low: treat the vagal reaction and start the clock",
    text: "Lie the patient flat, raise the legs, give atropine 0.5–1.0 mg IV and run saline fast (typical doses; follow local protocol). Note the time: if there is no clear improvement within a few minutes, reconsider and look for infarction, tamponade or bleeding.",
    tone: "bailout",
    lessonId: "cm-patient-complications-vasovagal",
    sources: [O("ch 10: Vasovagal reaction"), B("28.1")],
    refs: BOOKS,
  },
  {
    id: "access-vagal-prevention",
    lab: "access",
    when: { phase: ["puncture", "sheath", "closure"] },
    title: "Head off the vagal reaction",
    text: "Give generous local anaesthetic before the sheath goes in, and keep sedation and hydration adequate. Before a femoral sheath comes out, run saline and have someone ready with atropine and fluid, with the patient on ECG and pressure monitoring.",
    tone: "do",
    lessonId: "cm-patient-complications-vasovagal",
    sources: [B("11.1"), B("28.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-arrhythmia-ecg-baseline",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Record the baseline rhythm before you start",
    text: "Note the ECG morphology and the heart rate at the start so that new ST depression or elevation, slowing, tachycardia, QRS widening or a new bundle branch block stand out later. In left main PCI, Brilakis would ideally have defibrillator pads on the patient from the start.",
    tone: "do",
    lessonId: "cm-patient-complications-arrhythmia",
    sources: [B("2.2"), B("17"), O("ch 2: The cardiac physiologist")],
    refs: BOOKS,
  },
  {
    id: "pci-arrhythmia-reperfusion",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep", "stent"], event: ["vf"], requires: ["total-occlusion"] },
    title: "VF as the occluded artery opens: shock, then finish the job",
    text: "Arrhythmias often appear at reperfusion and are usually driven by ischaemia. Defibrillate VF straight away, keep the wire in place, and complete the restoration of flow: treating the ischaemia usually settles the rhythm.",
    tone: "bailout",
    lessonId: "cm-patient-complications-arrhythmia",
    sources: [B("28.1"), O("ch 10: Arrhythmia")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-dose-callouts",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Agree the dose call-outs and the stopping dose at the brief",
    text: "Ask for the cumulative air kerma to be announced every 1 Gy and/or every 30 minutes, and say in advance where you will stop (Brilakis usually stops at 5–7 Gy). Watch the dose rate as well: above 20 mGy/min, change the geometry or the settings.",
    tone: "do",
    lessonId: "cm-patient-complications-radiation",
    sources: [B("28.2"), B("2.5"), O("ch 1: Dose excess")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-skin-follow-up",
    lab: "pci",
    when: { phase: ["finish"], event: ["high-radiation-dose"] },
    title: "High dose: tell the patient and book the skin check",
    text: "Record the dose and explain it. Above 5 Gy air kerma, examine the back within a month and document it; above 10 Gy, ask a physicist for the peak skin dose promptly and examine the skin at 2–4 weeks. A warned patient will not have an unexplained red patch biopsied.",
    tone: "do",
    lessonId: "cm-patient-complications-radiation",
    sources: [B("28.2"), O("ch 1: Dose excess")],
    refs: BOOKS,
  },
  {
    id: "pci-rad-prior-skin-injury",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Previous high-dose case: look at the back first",
    text: "Before repeating a procedure after a high-dose case, examine the back for radiation injury. If there is any, postpone or modify the procedure: fewer cine runs, and projections chosen so that the injured skin stays out of the beam.",
    tone: "caution",
    lessonId: "cm-patient-complications-radiation",
    sources: [B("1.1"), B("1.6")],
    refs: BRILAKIS,
  },
  {
    id: "pci-contrast-budget-ckd",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Kidney disease: plan below the creatinine clearance",
    text: "Work out 3.7 × GFR, then go lower in kidney disease and subtract any recent contrast such as a CT. With an eGFR below 30, aim to give less contrast in millilitres than the creatinine clearance; a ratio above 2 predicts injury. Say the number at the brief.",
    tone: "do",
    lessonId: "cm-patient-complications-contrast-budget",
    sources: [B("2.6"), B("28.3")],
    refs: [...BRILAKIS, "gurm-contrast-dose-2011"],
  },
  {
    id: "pci-contrast-sparing-tactics",
    lab: "pci",
    when: { phase: ["guide", "wire", "stent", "optimise"], event: ["high-contrast-volume"] },
    title: "Spend less dye for the same answer",
    text: "Confirm engagement with the wire rather than a test injection, keep injections to 2–3 mL, let the guide clear by back-bleeding or aspiration before advancing new equipment, use extra wires as a roadmap, and let IVUS and physiology replace angiographic runs.",
    tone: "do",
    lessonId: "cm-patient-complications-contrast-budget",
    sources: [B("28.3"), B("30.2")],
    refs: [...BRILAKIS, "almendarez-caki-strategies-2019"],
  },
  {
    id: "diag-caki-prepare",
    lab: "diagnostic",
    when: { phase: ["setup"] },
    title: "Kidneys at risk: fluid, agent and catheters before the first run",
    text: "Make sure IV normal saline is running (Brilakis gives 1–3 mL/kg/h before and after, tailored to volume status), NSAIDs are stopped and metformin is held in CKD. Use an iso- or low-osmolar agent, 5 Fr catheters without side holes, and the previous angiograms instead of repeat runs.",
    tone: "do",
    lessonId: "cm-patient-complications-kidney",
    sources: [B("1.6"), B("1.3"), B("28.3"), O("ch 10: Contrast nephropathy")],
    refs: BOOKS,
  },
  {
    id: "pci-caki-after-case",
    lab: "pci",
    when: { phase: ["finish"], event: ["high-contrast-volume"] },
    title: "After a large contrast load: hydrate and follow the creatinine",
    text: "Continue saline hydration after the procedure, keep nephrotoxins and metformin stopped, and check creatinine for at least 48 hours; creatinine peaks 4–5 days after exposure, so plan a later check too. There is no specific treatment once injury is established.",
    tone: "do",
    lessonId: "cm-patient-complications-kidney",
    sources: [B("28.3"), O("ch 10: Contrast nephropathy")],
    refs: BOOKS,
  },
  {
    id: "pci-bleed-general-measures",
    lab: "pci",
    when: { event: ["bleeding"], requires: ["hypotension"] },
    title: "Bleeding with a falling pressure: the general measures",
    text: "Large-bore IV or central access, saline, group and crossmatch, haemoglobin (which often lags), and firm pressure on the access site. Once the diagnosis is made and the coronary is empty, reverse heparin with protamine and stop any GP IIb/IIIa inhibitor or cangrelor.",
    tone: "bailout",
    lessonId: "cm-patient-complications-bleeding",
    sources: [B("29.1"), B("3.4")],
    refs: BRILAKIS,
  },
  {
    id: "pci-bleed-bladder-screen",
    lab: "pci",
    when: { phase: ["complication", "finish"], event: ["hypotension"] },
    title: "Femoral access and a falling pressure: screen the bladder",
    text: "If access was femoral, suspect a retroperitoneal bleed in any patient who becomes hypotensive during or after the case, even if the pulse is slow or a closure device was used. With contrast on board, a quick look at the pelvis may show a displaced bladder; then image the iliac arteries from the other groin.",
    tone: "caution",
    lessonId: "cm-patient-complications-bleeding",
    sources: [B("29.1"), B("28.1")],
    refs: [...BRILAKIS, "ellis-retroperitoneal-2006"],
  },
  {
    id: "access-bleed-endovascular-control",
    lab: "access",
    when: { phase: ["complication"], event: ["bleeding"], route: ["femoral"] },
    title: "Active iliofemoral bleeding: balloon first, then seal it",
    text: "From the other groin, inflate a balloon at low pressure across the bleeding point. If the hole persists, seal a large vessel with a covered stent (self-expanding in the common femoral artery) and a small branch with coils after excluding retrograde bleeding; go to surgery if these fail.",
    tone: "bailout",
    lessonId: "cm-patient-complications-bleeding",
    sources: [B("29.1")],
    refs: BRILAKIS,
  },
  {
    id: "pci-bleed-antiplatelet-platelets",
    lab: "pci",
    when: { phase: ["complication", "finish"], event: ["bleeding"] },
    title: "Bleeding on antiplatelets: know what platelets can do",
    text: "Platelet transfusion is for life-threatening bleeding on an irreversible agent (aspirin, clopidogrel, prasugrel); it may fail with ticagrelor, whose binding is reversible. De-escalate ticagrelor or prasugrel to clopidogrel (75 mg, no loading dose, 24 hours after the last dose) rather than stopping everything after a new stent.",
    tone: "caution",
    lessonId: "cm-patient-complications-bleeding",
    sources: [B("3.5")],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// New references (PubMed-checked)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "tomaselli-acc-oac-bleeding-2020",
    kind: "guideline",
    citation:
      "Tomaselli GF, Mahaffey KW, Cuker A, et al. 2020 ACC expert consensus decision pathway on management of bleeding in patients on oral anticoagulants: a report of the American College of Cardiology Solution Set Oversight Committee. J Am Coll Cardiol. 2020;76(5):594–622.",
    url: "https://doi.org/10.1016/j.jacc.2020.04.053",
    note: "PMID: 32680646. DOI: 10.1016/j.jacc.2020.04.053. Checked on PubMed: authors, title, journal, year, volume 76, issue 5, pages 594–622; PubMed keywords include warfarin. No abstract on PubMed and no PMC full text; the publisher's page could not be read, so this module cites it as further reading only and takes no regimen, dose or recommendation from it.",
    verified: true,
  },
  {
    id: "cockcroft-creatinine-clearance-1976",
    kind: "paper",
    citation: "Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31–41.",
    url: "https://doi.org/10.1159/000180580",
    note: "PMID: 1244564. DOI: 10.1159/000180580. Checked on PubMed: authors, title, journal, year, volume 16, issue 1, pages 31–41. Formula read in the abstract on the publisher's page: clearance = (140 − age) × weight (kg) / (72 × serum creatinine in mg/100 mL) for adult men, 15% less in women. Used for the clearance of the CKD case patient (about 34 mL/min); Brilakis Table 1.2 points to a Cockcroft–Gault calculator.",
    verified: true,
  },
  {
    id: "gurm-contrast-dose-2011",
    kind: "paper",
    citation:
      "Gurm HS, Dixon SR, Smith DE, et al. Renal function-based contrast dosing to define safe limits of radiographic contrast media in patients undergoing percutaneous coronary interventions. J Am Coll Cardiol. 2011;58(9):907–914.",
    url: "https://doi.org/10.1016/j.jacc.2011.05.023",
    note: "PMID: 21851878. Checked on PubMed: authors, title, journal, year, volume 58, issue 9, pages 907–914; abstract read. Used for: 58,957 PCIs in the BMC2 registry; risk of nephropathy and of dialysis approached significance when contrast/calculated creatinine clearance exceeded 2 and was markedly raised above 3; authors suggest planning below three and preferably two times the clearance. Brilakis ch 28 ref 17.",
    verified: true,
  },
  {
    id: "almendarez-caki-strategies-2019",
    kind: "paper",
    citation:
      "Almendarez M, Gurm HS, Mariani J Jr, et al. Procedural strategies to reduce the incidence of contrast-induced acute kidney injury during percutaneous coronary intervention. JACC Cardiovasc Interv. 2019;12(19):1877–1888.",
    url: "https://doi.org/10.1016/j.jcin.2019.04.055",
    note: "PMID: 31521648. Checked on PubMed: authors, title, journal, year, volume 12, issue 19, pages 1877–1888; abstract read (review: contrast minimisation, IVUS and non-contrast OCT, radial access, remote ischaemic conditioning, haemodynamic support). Source of Brilakis Table 28.1 and Fig. 28.9 (ch 28 ref 16).",
    verified: true,
  },
  {
    id: "abdelaal-low-frame-rate-2014",
    kind: "trial",
    citation:
      "Abdelaal E, Plourde G, MacHaalany J, et al. Effectiveness of low rate fluoroscopy at reducing operator and patient radiation dose during transradial coronary angiography and interventions. JACC Cardiovasc Interv. 2014;7(5):567–574.",
    url: "https://doi.org/10.1016/j.jcin.2014.02.005",
    note: "PMID: 24746649. Checked on PubMed: authors, title, journal, year, volume 7, issue 5, pages 567–574; abstract read. Used for: 363 transradial patients randomised to 7.5 vs 15 fps fluoroscopy; operator dose 30% lower, patient dose-area product 19% lower, fluoroscopy times similar. Brilakis ch 28 ref 9.",
    verified: true,
  },
  {
    id: "steffel-ehra-noac-2021",
    kind: "guideline",
    citation:
      "Steffel J, Collins R, Antz M, et al. 2021 European Heart Rhythm Association practical guide on the use of non-vitamin K antagonist oral anticoagulants in patients with atrial fibrillation. Europace. 2021;23(10):1612–1676.",
    url: "https://doi.org/10.1093/europace/euab065",
    note: "PMID: 33895845 (PMC11636576). Checked on PubMed: authors, title, journal, year, volume 23, issue 10, pages 1612–1676. Full text read on the publisher's page: sections on managing bleeding under NOAC therapy (reversal considered for life-threatening or critical-site bleeding; idarucizumab 5 g IV as two 2.5 g doses; andexanet alfa bolus then 2-hour infusion, approved for apixaban and rivaroxaban, use with edoxaban extrapolated; PCC or aPCC may be considered when a specific agent is unavailable; vitamin K, protamine and fresh frozen plasma not useful for NOAC bleeding) and on planned interventions (interruption by drug, renal function and procedural bleeding risk; Table 12: routine elective coronary/peripheral artery intervention, except complex procedures, listed under minor-risk interventions, and CTO PCI among the high-risk complex interventions; no heparin bridging). The guide does not cover warfarin reversal.",
    verified: true,
  },
  {
    id: "bhatt-bentracimab-2022",
    kind: "trial",
    citation:
      "Bhatt DL, Pollack CV, Mazer CD, et al. Bentracimab for ticagrelor reversal in patients undergoing urgent surgery. NEJM Evid. 2022;1(3):EVIDoa2100047.",
    url: "https://doi.org/10.1056/EVIDoa2100047",
    note: "PMID: 38319214. Checked on PubMed: authors, title, journal, volume 1, issue 3, article EVIDoa2100047 (PubMed lists the publication date as 1 December 2021); abstract read. Used for: REVERSE-IT prespecified interim analysis, single-arm, 150 ticagrelor-treated patients needing urgent surgery (142) or with major haemorrhage (8); reversal within 5–10 minutes, sustained beyond 24 hours; adjudicated haemostasis in more than 90%; thrombotic events in about 5%.",
    verified: true,
  },
];
