// Module hb-cardiac-catheterisation: right and left heart catheterisation (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 4 (whole chapter),
// chapter 3 (venous access), chapter 5 (aortic stenosis, aortic and mitral regurgitation, ASD, VSD,
// cardiomyopathy, takotsubo), chapter 6 (anomalous circumflex), chapter 7 (aortography for grafts),
// chapter 9 (cardiogenic shock) and chapter 10 (tamponade, arrhythmias, pulmonary oedema); Brilakis,
// Manual of PCI, sections 5.7, 6.6, 7.2, 14.1, 14.4, 18.5, 20.7, 24.2 and 28.1.
// Every claim is listed with its page in docs/curriculum/evidence/hb-cardiac-catheterisation.md.
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OXFORD = ["oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });

export const module: Module = {
  id: "hb-cardiac-catheterisation",
  title: "Right and left heart catheterisation",
  stage: 2,
  summary:
    "How to run a cardiac catheter study from set-up to the last pressure: preparing the manifold, injector and transducer; reaching the right heart, the pulmonary artery and the wedge position, and getting out of trouble on the way; crossing a normal and a difficult aortic valve and reading LV and aortic pressures; cardiac output, resistance and the oximetry calculations; and performing and interpreting left ventriculography and aortography.",
  objectives: [
    "State what a left, right and simultaneous left and right heart study each answers, and prepare the manifold, flush, wires, catheters and pressure injector safely.",
    "Reach the right atrium, right ventricle, pulmonary artery and wedge position with a torque-directed catheter, overcome a difficult right heart, and manage a knotted catheter.",
    "Cross a normal aortic valve with a pigtail, work through the difficult-valve sequence, cross a stenotic valve only when indicated, and measure LVEDP at the right point of the cycle.",
    "Calculate cardiac index, Fick output, cardiac power output, systemic and pulmonary vascular resistance and the shunt ratio, and explain where the manuals and the 2022 ESC/ERS guideline differ.",
    "Plan and run the catheter study of an atrial or ventricular septal defect.",
    "Perform a left ventriculogram and an aortogram with the right catheter position, injector settings and projections, and grade wall motion, mitral and aortic regurgitation without being misled by artefact.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-setup",
      title: "What the study answers, and setting up the kit",
      minutes: 12,
      topics: ["hd-rhc", "hd-lhc"],
      sources: [
        O("ch 4: Cardiac catheterization"),
        O("ch 4: Pressure waveforms"),
        O("ch 4: Equipment"),
        O("ch 4: Catheters"),
        O("ch 5: Aortic stenosis"),
        O("ch 5: Mitral stenosis"),
        O("ch 10: Contrast reaction"),
        B("14.1"),
        B("28.1"),
        B("24.2"),
      ],
      refs: [...BOOKS, "esc-ph-2022", "kovacs-zero-reference-2013", "tehrani-shock-team-2019"],
      blocks: [
        {
          kind: "p",
          text: "A cardiac catheter study gathers two kinds of information. Pressures and oxygen saturations, measured directly or derived from each other, describe how the heart and the two circulations are working; contrast injections show anatomy. Oxford notes that a right heart study was once part of almost every invasive cardiac study, but good echocardiography with Doppler now answers many of the same questions. So the first step is always the same: read the non-invasive imaging and confirm that the study still has a question to answer.",
        },
        {
          kind: "table",
          caption: "What each kind of study is for (Oxford, Cardiac catheterization)",
          head: ["Study", "Main uses"],
          rows: [
            ["Left heart", "Coronary angiography; LV function; severity of valve disease; recording left heart pressures; one half of a simultaneous study"],
            [
              "Right heart",
              "Part of other procedures (pacing wires, electrophysiology, congenital disease, pulmonary embolism intervention, myocardial biopsy); suspected pulmonary hypertension; right heart pressures; an indirect estimate of cardiac output; one half of a simultaneous study",
            ],
            [
              "Simultaneous left and right",
              "Intracardiac shunts; mitral valve disease; suspected constriction; systemic and pulmonary vascular resistance; interventions, especially in congenital heart disease",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds the interventional uses. He strongly recommends a right heart study before complex PCI in a patient with a low ejection fraction or uncertain haemodynamics, uses it to find the cause when blood pressure falls during a case, reproduces a cardiogenic shock pathway (from Tehrani and colleagues) that is built around it, and suggests leaving the pulmonary artery catheter in during the procedure to watch the PA pressure and decide when to escalate or reduce support. Those decisions are taught in the haemodynamic support module (pm-support-choice); the measurements they rely on are taught here.",
        },
        {
          kind: "check",
          stem: "A woman with known mitral valve disease is referred for an invasive study because her symptoms are worse than her echocardiogram suggests. Which kind of study does Oxford list for this question?",
          options: [
            "A left heart study alone, with a ventriculogram to grade the valve",
            "A right heart study alone, because the wedge pressure stands in for left atrial pressure",
            "A simultaneous left and right heart study",
            "Coronary angiography only, as the valve is already characterised by echo",
          ],
          answer: 2,
          explanation:
            "Oxford lists mitral valve disease among the indications for a simultaneous left and right study: the wedge trace (right side) is recorded against the LV trace (left side), and the area between them is the mitral gradient. A right study alone gives the wedge but no LV pressure to compare it with; a left study alone gives the LV but no atrial surrogate.",
        },
        { kind: "h", text: "The pressure system" },
        {
          kind: "steps",
          title: "Preparing the manifold and transducer",
          items: [
            {
              title: "1. Know the ports",
              detail:
                "A pressure manifold has three to five selectable ports. The proximal end connects to the catheter; one port goes to the pressure transducer through the flush infusion; one goes to the contrast; and the syringe sits on the distal end.",
            },
            {
              title: "2. Choose the flush",
              detail:
                "Heparinised saline, made up to local protocol (Oxford's example: 1000 IU of heparin added to 500 mL of 0.9% saline).",
            },
            {
              title: "3. Zero",
              detail:
                "With the transducer level with the patient's mid-chest, open the distal port to air and zero it. The Academy's monitoring lesson explains levelling and the 2022 ESC/ERS mid-thoracic landmark in detail.",
            },
            {
              title: "4. Clear every bubble",
              detail:
                "Air left in the manifold can be injected and embolise. Flush the whole system carefully, and if an assistant set it up, inspect it yourself before the first injection.",
            },
          ],
        },
        {
          kind: "p",
          text: "Oxford reminds you what the fluid column costs. Because the transducer sits a long way from the catheter tip, the signal arrives slightly late and slightly damped; a transducer at the tip would be more accurate but is impractical and expensive. Three artefacts come from the catheter itself: an **end-pressure artefact** when a fast jet strikes the catheter's end hole, a **catheter impact artefact** when the tip touches the wall or a valve, and **catheter whip** when the catheter moves about inside the chamber.",
        },
        {
          kind: "steps",
          title: "One cardiac cycle on the left-sided traces (after Oxford Fig 4.1)",
          items: [
            {
              title: "1. Mitral valve closes",
              detail: "Around the QRS, LV pressure rises past left atrial pressure and the mitral valve shuts. The LV now holds its largest volume, the end-diastolic volume.",
            },
            {
              title: "2. Aortic valve opens",
              detail: "LV pressure climbs steeply until it passes aortic pressure; the aortic valve opens and the two traces run together through ejection while LV volume falls.",
            },
            {
              title: "3. Aortic valve closes",
              detail: "As LV pressure falls below aortic pressure the valve closes, marked on the aortic trace by the dicrotic notch. LV volume is now at its smallest, the end-systolic volume.",
            },
            {
              title: "4. Mitral valve opens",
              detail: "LV pressure keeps falling until it drops under left atrial pressure; the mitral valve opens and the ventricle refills, its volume rising back towards end-diastole.",
            },
          ],
        },
        {
          kind: "p",
          text: "Oxford treats these timings as basic to interpreting any catheter pressure record. The valve gradients taught in the specific-conditions module are read from the same overlaid traces: LV against aorta in systole, wedge against LV in diastole (Oxford Figs 5.1 and 5.3).",
        },
        { kind: "h", text: "Wires, catheters and the injector" },
        {
          kind: "table",
          caption: "The rest of the kit (Oxford, Equipment and Catheters)",
          head: ["Item", "What to know"],
          rows: [
            [
              "Guidewires",
              "Central core, distal spring coil and outer coating. Short wires (30–45 cm) for access; exchange wires (250–300 cm) for catheter swaps; 0.025 inch for arm access; for routine diagnostic work, J wires of 0.03–0.038 inch. Tips are straight or J",
            ],
            [
              "Hydrophilic wires",
              "Very useful in tortuous or narrow vessels and can be swapped for a standard wire once access is secure. Slightly more fragile: never manipulate one through an introducer needle",
            ],
            [
              "Catheters",
              "Sized in French by outer diameter (higher number, larger catheter); usually 4–8 F, typically 6 F; most are 100 cm long with a Luer-lock hub. If the patient has been catheterised before, find out which catheters were used and what was difficult",
            ],
            [
              "Pressure injector",
              "Delivers a set volume of contrast at an exact rate, for chambers and large vessels. Expel air from the reservoir before connecting, make sure the catheter is firmly attached (high pressure can separate it), aspirate to check for bubbles, and watch the screen throughout, ready to stop if the catheter moves or the myocardium stains. Who fires it follows local policy",
            ],
            [
              "Mechanical injector pumps",
              "Used for coronary angiography: the operator controls each contrast injection with a hand controller. Oxford notes they may improve image quality and reduce the contrast dose",
            ],
          ],
        },
        { kind: "h", text: "Contrast" },
        {
          kind: "table",
          caption: "Contrast agents (Oxford, Equipment: Contrast media)",
          head: ["Topic", "What to know"],
          rows: [
            [
              "Why iodine",
              "Plain X-rays outline only large structures such as the aorta. A vessel becomes visible when it is filled with a fluid whose atomic weight exceeds that of the surrounding tissue; angiographic agents usually carry iodine, which is soluble and of relatively low toxicity. They are cleared by the kidneys",
            ],
            [
              "Osmolality",
              "Expressed in mOsm/kg of water. An agent more concentrated than blood opacifies better but draws water out of neighbouring tissue; high osmolality brings a feeling of heat or discomfort on injection and possible toxicity to the kidneys and the blood–brain barrier. The closer to blood, the better tolerated",
            ],
            [
              "Viscosity",
              "Decides how easily and how fast the agent can be injected: a very viscous agent is hard to push through a narrow catheter and fills vessels sluggishly",
            ],
            [
              "Ionic monomer, ionic dimer, non-ionic",
              "Early agents were one tri-iodinated benzoic acid ring with a cation that separates in solution: ionic and high osmolality. Joining two rings (ionic dimer) doubles the iodine and lowers osmolality but still ionises. Replacing the cation with an organic chain that does not separate gives a non-ionic agent of much lower osmolality, generally with fewer side effects but at greater cost",
            ],
            [
              "Idiosyncratic reactions",
              "Anaphylactoid reactions of varying severity that look like IgE-mediated anaphylaxis. Oxford's equipment section calls the mechanism unknown, while its complications chapter describes most reactions as IgE-mediated; management is taught in cm-patient-complications",
            ],
            [
              "Dose-dependent effects",
              "Heat, flushing, local discomfort (for example in the arm during internal mammary injection), vasodilatation, hypotension and depressed contractility. High doses can cause contrast-induced nephropathy, especially with diabetes and a reduced baseline creatinine clearance; transient renal dysfunction is more common with pre-existing renal failure",
            ],
            ["Dose ceiling", "Oxford's good practice is not to exceed 5–7 mL/kg, depending on the agent"],
            [
              "ECG changes",
              "Transient bradycardia that usually settles within a few seconds; transient ST changes and QRS widening are common during coronary injection; ventricular arrhythmias are uncommon but can be provoked by a coronary injection",
            ],
          ],
        },
        {
          kind: "p",
          text: "Contrast is part of the haemodynamics. Its haemodynamic effects (vasodilatation, depressed contractility and a rise in LVEDP) are greater with high-osmolality agents, which is why Oxford suggests considering non-ionic agents for patients with severe LV impairment, severe coronary disease or severe valve disease. Current practice goes further: the Academy's preparation lesson (dx-ind-prep) advises a low- or iso-osmolar agent for every patient and, in renal impairment, an eGFR-based contrast budget as a guide alongside Oxford's ceiling. Every ventriculogram and aortogram in this module spends part of that budget, which is why each is done only when it answers a question. Contrast reactions and kidney protection are taught in pm-lab-drugs and cm-patient-complications.",
        },
        {
          kind: "check",
          stem: "During a power injection into the left ventricle you see the pigtail jump back towards the aortic valve and a blush appear in the wall. What should already have been agreed before the injection?",
          options: [
            "That the injection would run to completion so the run is diagnostic",
            "That the person watching the screen stops the injection if the catheter moves or the myocardium stains",
            "That the injector would be set to a higher rate to finish before the catheter could move",
            "That a hydrophilic wire would be left in the catheter to hold it steady during the run",
          ],
          answer: 1,
          explanation:
            "Oxford's injector advice is to watch the image closely and be ready to stop the injection if the catheter is displaced or the myocardium stains. Running to completion keeps injecting into the wall. A faster rate does not help: Oxford's rise-time advice exists because an abrupt high flow makes the catheter whip.",
        },
        { kind: "tip", id: "haemo-mon-zero-level" },
        { kind: "tip", id: "haemo-mon-fast-flush" },
        { kind: "tip", id: "haemo-setup-manifold-check" },
        {
          kind: "pitfalls",
          items: [
            "Starting an invasive study without reading the echo: the question may already be answered.",
            "Injecting through a manifold someone else prepared without checking it for air.",
            "Pushing a hydrophilic wire back through the introducer needle.",
            "A loose injector connection: high pressure can disconnect the catheter mid-run.",
            "Reading an artefact as physiology: an end-pressure spike, an impact spike or catheter whip.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask what was used last time. Oxford advises checking which catheters a previous study used and whether choosing them caused problems. In practice the check takes a minute, and a curve that failed before is not worth repeating first (practical reasoning, not a manual rule).",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, set up the transducer at mid-chest, zero it, and run a fast-flush test on each channel before recording any pressure.",
        },
        { kind: "video", id: "Ge31Dg3kFlM", note: "Brilakis: cardiac haemodynamics (Dallas CVI 2016)." },
        { kind: "video", id: "5ARDKipHats", note: "Hanna: essential haemodynamics, pitfalls and anomalies." },
        {
          kind: "keypoints",
          items: [
            "Review non-invasive imaging first and confirm the study is still needed.",
            "Left, right and simultaneous studies answer different questions; a mitral, shunt, constriction or resistance question needs both sides.",
            "Zero at mid-chest, flush every bubble out of the manifold, and check a manifold someone else prepared.",
            "Fluid-filled systems add delay and damping; end-pressure, impact and whip artefacts come from the catheter.",
            "Routine diagnostic wires are 0.03–0.038 inch J wires; catheters are usually 6 F and 100 cm.",
            "Secure the injector connection, expel air, and be ready to stop the injection.",
            "Contrast raises LVEDP and depresses contractility, more so with high-osmolality agents; Oxford's ceiling is 5–7 mL/kg, and current practice uses low- or iso-osmolar agents for everyone.",
            "On the left-sided traces, each crossing of LV pressure with atrial or aortic pressure marks a valve opening or closing; the dicrotic notch is aortic valve closure.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-rhc",
      title: "Right heart catheterisation: from the vein to the wedge",
      minutes: 15,
      topics: ["hd-rhc"],
      sources: [
        O("ch 4: Accessing the right heart"),
        O("ch 4: Right heart pressures and waveforms"),
        O("ch 3: How to obtain venous access"),
        O("ch 3: Femoral vein access"),
        O("ch 3: Internal jugular vein access"),
        O("ch 10: Ventricular tachycardia"),
        O("ch 10: Atrial fibrillation"),
        O("ch 10: Cardiac tamponade"),
        B("14.1"),
      ],
      refs: [...BOOKS, "esc-ph-2022", "korabathina-papi-2012", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "The Academy's haemodynamics lessons taught the balloon flotation catheter, the order of a right heart study and the shape of each waveform. This lesson follows Oxford's torque-directed technique with a multipurpose catheter, step by step, adds what to do when the catheter will not go where you want, and sets out Oxford's normal values and how breathing moves them.",
        },
        { kind: "h", text: "Access and catheter" },
        {
          kind: "list",
          items: [
            "Venous access is needed for right heart pressures and saturations, cardiac output, shunt studies, pulmonary angiography and myocardial biopsy. Which vein you use depends on the procedure, the patient and your experience.",
            "For a combined left and right study, Oxford's usual route is the right femoral vein, which lies medial to the femoral artery; a 5 or 6 F sheath is normal and its sidearm is flushed to stop clot forming. Sometimes an approach from above, through the superior vena cava, is the better choice. In current practice many combined studies are done entirely from the arm (an antecubital vein with the radial artery), keeping the femoral vein for transseptal or large-bore work; the Academy's right heart access lesson (hd-basics-catheters-access) teaches that route.",
            "The internal jugular route suits pulmonary artery catheterisation and biopsy, and pulmonary angiography when the inferior vena cava contains thrombus or a filter. The punctures themselves are taught in the access module (pm-access).",
            "The choice runs from short catheters used only for right atrial pressure up to balloon-tipped flotation catheters able to wedge. For most diagnostic right heart studies Oxford uses a **multipurpose** catheter.",
          ],
        },
        { kind: "h", text: "The passage, step by step" },
        {
          kind: "steps",
          title: "Torque-directed right heart catheterisation (Oxford)",
          items: [
            {
              title: "1. Prepare the catheter",
              detail: "Flush it thoroughly before it goes in, and connect it to the pressure trace: the waveform tells you which chamber the tip is in.",
            },
            {
              title: "2. Reach the right atrium",
              detail:
                "From either vena cava this is usually easy. From the femoral vein the tip can catch in a venous side branch; ease it back and turn it under fluoroscopy until it runs freely into the atrium.",
            },
            {
              title: "3. Cross the tricuspid valve",
              detail:
                "Sometimes the tip passes straight through. Often you must form a loop in the right atrium and let it prolapse into the ventricle, the same manoeuvre used for pacing leads. A wire inside the catheter stiffens it and gives torque for steering.",
            },
            {
              title: "4. Confirm the ventricle",
              detail: "Ventricular ectopy tells you the tip has entered the RV, and the trace becomes ventricular.",
            },
            {
              title: "5. Leave the apex and turn upwards",
              detail:
                "To reach the pulmonary artery, first withdraw gently so the tip comes away from the RV apex, then rotate it until it points towards the head and advance into the main pulmonary artery. A wire helps in difficult cases.",
            },
            {
              title: "6. Select a branch if needed",
              detail: "The right and left pulmonary arteries can be entered selectively by gentle rotation and advancement under screening.",
            },
            {
              title: "7. Wedge",
              detail:
                "Advance the catheter while the patient breathes in, until you feel gentle resistance; the trace changes to the wedge pattern. A deep breath also helps carry the catheter into the pulmonary artery and gives a cleaner wedge trace.",
            },
          ],
        },
        {
          kind: "check",
          stem: "From the femoral vein your multipurpose catheter has crossed the tricuspid valve and now sits at the RV apex, provoking runs of ectopics. Pushing further only buckles it. What does Oxford advise?",
          options: [
            "Keep advancing with firmer pressure, because the ectopics show you are in the right chamber",
            "Pull back gently off the apex, rotate the tip to point cranially, then advance into the pulmonary artery",
            "Withdraw to the inferior vena cava and repeat the whole passage with a straight wire leading",
            "Inflate a balloon at the apex and wait for the catheter to float into the outflow tract",
          ],
          answer: 1,
          explanation:
            "Oxford's sequence is to come back off the apex, turn the tip towards the head and then advance into the main PA, with a wire if needed. Vigorous manipulation in the RV is what provokes ventricular arrhythmias, so pushing harder is the wrong instinct. A multipurpose catheter has no balloon, and starting again from the IVC wastes the position you already have.",
        },
        { kind: "h", text: "When the right heart is difficult" },
        {
          kind: "table",
          caption: "Problems on the way to the wedge and what to do",
          head: ["Problem", "What to do"],
          rows: [
            ["Tip catches in a venous side branch (femoral route)", "Withdraw a little and rotate under screening until it moves freely"],
            ["Cannot enter the RV", "Form a loop in the RA so the catheter prolapses across the tricuspid valve; withdraw and rotate to bring the tip into line"],
            ["Catheter too floppy to cross", "Pass a soft-tipped J wire inside it to stiffen it"],
            ["Cannot reach the PA or obtain a clean wedge", "Ask for a deep breath while you advance"],
            [
              "Ectopy or ventricular tachycardia",
              "Stop vigorous manipulation; reposition gently. Oxford notes VT can be provoked particularly in the RV outflow tract. If VT persists, Oxford's complications chapter applies: synchronised DC cardioversion under sedation if it is poorly tolerated; if it is tolerated, consider an IV beta-blocker or amiodarone, with lidocaine or overdrive pacing as further options (doses in cm-patient-complications)",
            ],
          ],
        },
        {
          kind: "steps",
          title: "A knotted catheter",
          items: [
            {
              title: "Know the cause",
              detail: "Oxford links knotting to vigorous, prolonged manipulation. Neither manual gives a recognition rule; a catheter that no longer responds to torque after a long passage is a practical reason to screen for a knot (author's advice).",
            },
            { title: "Call for help at once", detail: "If a knot is suspected, ask for an experienced operator straight away, and do not pull the catheter tight." },
            { title: "Try to undo it", detail: "Now and then the knot can be released by advancing the guidewire with care." },
            {
              title: "If it will not undo",
              detail:
                "Pull the knot tight so it is as small as possible, bring it back to the sheath and remove the whole system together. Expect bleeding; the vein may need surgical repair. Snares and forceps are percutaneous alternatives, and surgical removal is well described.",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "**Arrhythmias:** vigorous RV manipulation causes ventricular ectopy and VT; atrial irritation can start AF, which mostly stops on its own (Oxford, Complications).",
            "**Perforation:** the RV wall is thin, and manipulating catheters or pacing wires there is one of Oxford's listed causes of tamponade.",
            "**Conduction and the pulmonary artery (not in either manual; see the Academy's right heart lesson, hd-basics-catheters-access):** a catheter passing through the RV can cause transient right bundle branch block, which means complete heart block in a patient with left bundle branch block, so check the ECG first and have pacing available. Pulmonary artery rupture is rare but often fatal; its risk rises with pulmonary hypertension, older age, anticoagulation and a distal catheter position.",
          ],
        },
        { kind: "h", text: "Oxford's normal values and how breathing moves them" },
        {
          kind: "table",
          caption: "Normal right heart pressures (Oxford Table 4.1)",
          head: ["Site", "Normal range (mmHg)"],
          rows: [
            ["Right atrium", "0–8"],
            ["Right ventricle", "Systolic 20–25; diastolic 6–12"],
            ["Pulmonary artery", "Systolic 20–25; diastolic 4–8"],
            ["Wedge (PCWP)", "6–12"],
          ],
        },
        {
          kind: "p",
          text: "Normal ranges differ between sources: the Academy's waveform lesson quotes slightly different figures, and the 2022 ESC/ERS guideline defines pulmonary hypertension as a mean PA pressure above 20 mmHg. Use the ranges as a sense check, not as cut-offs. Note one quirk of Oxford's table: its PA diastolic range (4–8) sits below its wedge range (6–12). In a real study, a wedge mean above the PA diastolic pressure usually means the catheter is not properly wedged or the recording is faulty, unless a giant v wave (for example from mitral regurgitation) is raising the mean; reposition and check before you report it (Academy right heart and waveform lessons). The Academy's right heart lesson expects the wedge mean to sit below the PA diastolic, and its ranges (PA diastolic 4–12, wedge 4–12) avoid the clash.",
        },
        {
          kind: "table",
          caption: "Reading the right-sided traces (Oxford Figs 4.18 and 4.19)",
          head: ["Trace", "What the deflections mean", "Abnormal patterns"],
          rows: [
            [
              "Right atrium",
              "a: atrial systole after the P wave (Oxford: its peak is the point of maximal RV filling); c: tricuspid closure; v: atrial filling against the closed tricuspid valve during RV systole (Oxford ties it to RV contraction; the filling mechanism is as taught in the Academy's waveform lesson). RA pressure runs slightly below LA pressure and v is usually slightly smaller than a",
              "AF: a wave lost. Complete heart block or junctional rhythm: cannon a waves. Tricuspid regurgitation: large c and v waves, x descent lost. Tricuspid stenosis: prominent a, muted y descent",
            ],
            ["Right ventricle", "The small a wave before systole is right atrial contraction", "See the waveform lessons (hd-waveforms)"],
            ["Wedge", "A slightly damped copy of left atrial pressure; normally its mean is close to the PA diastolic pressure", "Large v waves (see the mitral lessons in hb-specific-conditions)"],
          ],
        },
        {
          kind: "p",
          text: "With spontaneous breathing, right atrial pressure falls as you breathe in (intrathoracic pressure drops) and rises as you breathe out; under mechanical ventilation the pattern reverses. The 2022 ESC/ERS guideline asks for pressures to be read at end-expiration.",
        },
        {
          kind: "check",
          stem: "A ventilated patient in the coronary care unit has a right atrial trace that rises with each breath delivered by the ventilator. A trainee reports Kussmaul's sign. What is your view?",
          options: [
            "Agree: any rise in RA pressure with a breath is Kussmaul's sign",
            "Disagree: under positive-pressure ventilation the RA pressure normally rises during inspiration",
            "Agree, but only if the a wave is also larger than the v wave",
            "Disagree: RA pressure does not change with breathing in a normal heart",
          ],
          answer: 1,
          explanation:
            "Oxford notes that the respiratory pattern reverses with mechanical ventilation: a delivered breath raises intrathoracic pressure, so RA pressure rises. Kussmaul's sign is an inspiratory rise during spontaneous breathing. RA pressure does move with breathing in normal hearts, which is why the guideline specifies end-expiration.",
        },
        {
          kind: "p",
          text: "Brilakis reads the same numbers for interventional decisions: RA pressure above 12 mmHg or a pulmonary artery pulsatility index (PAPi, the PA pulse pressure divided by RA pressure) below 0.9 suggests RV failure, and a wedge above 18 mmHg suggests LV failure. A wedge above 25 mmHg together with a mixed venous saturation below 50% marks a patient at high risk of pulmonary oedema and shock around the procedure. These are applied in the support and shock lessons (pm-support-choice).",
        },
        { kind: "tip", id: "haemo-rhc-flush-and-watch" },
        { kind: "tip", id: "haemo-rhc-femoral-side-branch" },
        { kind: "tip", id: "haemo-rhc-ra-loop" },
        { kind: "tip", id: "haemo-rhc-apex-to-pa" },
        { kind: "tip", id: "haemo-rhc-wedge-inspiration" },
        { kind: "tip", id: "haemo-rhc-knot" },
        { kind: "tip", id: "haemo-support-rhc-thresholds" },
        {
          kind: "pitfalls",
          items: [
            "Inserting the catheter before it is flushed and connected, then navigating blind to the waveform.",
            "Forceful pushing in the RV: arrhythmias, and in time a knot.",
            "Pulling a knotted catheter tight before help arrives.",
            "Reading a respiratory swing in a ventilated patient as if the patient were breathing spontaneously.",
            "Treating a normal range as a diagnostic threshold.",
          ],
        },
        {
          kind: "pearl",
          text: "Let the patient do some of the work. Oxford's difficult right heart advice is that a deep breath helps guide the catheter into the pulmonary artery and gives a clearer wedge trace, and its wedge step is done as the patient breathes in. Timing your advance to the breath, rather than pushing harder, follows from that (practical reasoning).",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, take a catheter from the femoral vein through RA, RV and PA to the wedge, recording each pressure at end-expiration, and label the a, c and v waves on the atrial trace.",
        },
        { kind: "video", id: "i76OWhbpwM4", note: "Hanna: simple techniques for femoral or difficult right heart catheterisation." },
        { kind: "video", id: "WYll1EHXliE", note: "Hanna: haemodynamic review cases, part 1." },
        { kind: "video", id: "zPZZQHxQiJA", note: "Hanna: haemodynamic review cases, part 2." },
        {
          kind: "keypoints",
          items: [
            "Flush and connect the catheter to pressure before it goes in; navigate by the waveform.",
            "From the femoral vein, a loop in the RA is often needed to prolapse across the tricuspid valve.",
            "To reach the PA: off the apex, tip pointing cranially, then advance; a wire or a deep breath helps.",
            "Wedge by advancing during inspiration to gentle resistance.",
            "Vigorous RV manipulation causes arrhythmias and knots; for a knot, call for help and do not pull tight.",
            "Oxford's normals: RA 0–8, RV 20–25/6–12, PA 20–25/4–8, PCWP 6–12 mmHg.",
            "RA pressure falls on spontaneous inspiration and rises on a ventilator breath.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-lhc",
      title: "Left heart catheterisation: crossing the aortic valve and the left-sided pressures",
      minutes: 15,
      topics: ["hd-lhc"],
      sources: [
        O("ch 4: Accessing the left heart"),
        O("ch 4: Left heart pressures and waveforms"),
        O("ch 5: Aortic stenosis"),
        O("ch 4: Ventriculography"),
        O("ch 10: Ventricular tachycardia"),
        B("14.4"),
        B("6.6"),
      ],
      refs: [...BOOKS, "omran-aortic-crossing-emboli-2003", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Entering the left ventricle is the gateway to LV pressure, the LVEDP, a pullback gradient and the ventriculogram. With a normal valve it takes seconds; with a stiff or stenotic valve it can take a long time and carries embolic risk. This lesson teaches both, in the order Oxford gives them, and finishes with the left-sided waveforms and the LVEDP.",
        },
        {
          kind: "list",
          items: [
            "**Routes:** usually retrograde from an artery (femoral, radial or brachial). The left heart can also be reached from the right atrium across a patent foramen ovale or an ASD, by transseptal puncture, or through a VSD.",
            "**Catheter:** from the femoral artery the pigtail is Oxford's first choice; a multipurpose catheter is an occasional alternative from the arm. Positioning is helped by a 0.035 inch J wire.",
            "**Pigtails and papillary muscles:** when crossing the valve to place a stiff wire for an Impella, Brilakis chooses a pigtail over an Amplatz or multipurpose catheter, as the pigtail is less prone to slipping behind a papillary muscle (14.4.5). Oxford, on the other hand, notes that during ventriculography a catheter tip can catch in the papillary muscles, particularly a pigtail (see the ventriculography lesson). The two points are about different moments and do not cancel each other.",
          ],
        },
        {
          kind: "steps",
          title: "Crossing a normal aortic valve",
          items: [
            { title: "1. To the root", detail: "Advance the catheter over the wire until its tip lies just above the aortic valve." },
            { title: "2. Pressure", detail: "Take the wire out and connect to pressure. If an aortogram is planned, set up the image for it now." },
            { title: "3. View", detail: "Image in AP or RAO." },
            {
              title: "4. Make the U",
              detail: "Push the catheter so its end curls into a shallow U against the valve; with gentle forward pressure it usually drops into the ventricle.",
            },
            { title: "5. Set up", detail: "Confirm the LV trace, then position the image for the pressure recordings and the ventriculogram." },
          ],
        },
        {
          kind: "steps",
          title: "The difficult aortic valve, in order",
          items: [
            {
              title: "1. Is there aortic stenosis?",
              detail: "Before anything else, check the notes and the echo for significant aortic stenosis. If there is, the rules change (below).",
            },
            {
              title: "2. Stiffen the catheter",
              detail: "Reinsert the guidewire into the catheter to stiffen it and try the U again. Brilakis describes the same move in the Impella setting, where the cause of a pigtail that will not cross is aortic stenosis: a 0.035 inch J wire stiffens the pigtail, and balloon dilatation of the stenotic valve may be needed.",
            },
            { title: "3. Lead with the wire", detail: "Advance the wire out of the catheter and across the valve, using the catheter tip to set the angle of approach." },
            { title: "4. Change the catheter that aims the wire", detail: "A Judkins right 4 or an Amplatz left catheter points the wire at the valve better than a pigtail." },
            { title: "5. Change the wire", detail: "A straight-tipped or hydrophilic wire may cross where a J wire does not." },
            { title: "6. Follow the wire", detail: "Once the wire is across, advance the catheter over it, remove the wire and connect to pressure." },
            {
              title: "7. Exchange if needed",
              detail: "If a ventriculogram is planned, swap the crossing catheter for a pigtail over a long (exchange-length) wire.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A pigtail will not drop through the aortic valve of a 58-year-old man despite several U-loops in RAO. What is the first thing Oxford asks you to do?",
          options: [
            "Exchange for an Amplatz left catheter and a straight hydrophilic wire",
            "Check the notes and echo to make sure he does not have significant aortic stenosis",
            "Reinsert the J wire to stiffen the pigtail and push harder",
            "Abandon the LV and record pressures from the femoral sheath instead",
          ],
          answer: 1,
          explanation:
            "Oxford's difficult-valve list starts with the notes: significant aortic stenosis changes whether you should cross at all and how. Stiffening the pigtail with the wire is the next step, and the Amplatz with a straight wire comes later. A femoral sheath pressure is not an LV pressure.",
        },
        { kind: "h", text: "Crossing a stenotic valve" },
        {
          kind: "p",
          text: "Oxford is clear that crossing a severely stenotic aortic valve for diagnosis is now rare: the extra numbers seldom change management, the manoeuvre is hazardous, and brain MRI after crossing attempts often shows emboli, silent or not. Accurate non-invasive testing, especially echocardiography, is the standard for most patients. Cross only when the non-invasive data are inconclusive or do not match the symptoms; Oxford also lists TAVI work-up, but even then crossing is needed only when the non-invasive data leave the question open. In the randomised study by Omran and colleagues, 22% of patients whose stenotic valve was crossed retrogradely had new embolic lesions on diffusion MRI and 3% had a clinically apparent deficit, against none of those whose valve was not crossed; the authors limited crossing to patients with unclear echo findings.",
        },
        {
          kind: "steps",
          title: "When you must cross a stenotic valve (Oxford)",
          items: [
            { title: "1. Equipment", detail: "A 5 F AL1 diagnostic catheter with a straight-tipped hydrophilic guidewire." },
            {
              title: "2. Find the opening",
              detail: "An aortogram can show where the leaflets open, the ‘Prussian helmet’ sign, which gives you a target on the screen.",
            },
            {
              title: "3. Cross with control",
              detail: "Oxford stresses that the wire must be manipulated in a controlled way; crossing attempts frequently cause cerebral emboli, so keep the number of passes down.",
            },
            { title: "4. Exchange", detail: "Once the AL1 is in the ventricle, exchange it for a pigtail over an exchange-length J wire." },
          ],
        },
        {
          kind: "p",
          text: "How to measure the gradient once you are in (simultaneous LV and aortic pressures with two catheters or a double-lumen catheter are most accurate; a pullback gives only a peak-to-peak value) is taught in the aortic stenosis lesson of the specific-conditions module (hb-specific-conditions) and the Academy's valve lessons.",
        },
        { kind: "h", text: "Left-sided waveforms and values" },
        {
          kind: "table",
          caption: "Normal left heart pressures for an adult man (Oxford Fig 4.14)",
          head: ["Site", "Normal (mmHg)"],
          rows: [
            ["Aorta", "100–140 systolic / 60–90 diastolic"],
            ["Left ventricle", "100–140 systolic / 3–12 end-diastolic"],
            ["Left atrium", "1–10"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Left atrium:** three peaks. a is atrial systole (after the P wave), c is the closed mitral valve pressing on the atrium, and v builds during LV systole as the atrium fills against the closed mitral valve (Oxford attributes it simply to LV systole; the filling mechanism is as in the Academy's waveform lesson); v is usually a little higher than a. The x descent after a is atrial relaxation; the y descent after v is atrial emptying.",
            "**Left ventricle:** a small a wave from atrial contraction comes just before the systolic upstroke.",
            "**Aorta:** the dicrotic notch (incisura) on the downstroke marks aortic valve closure and is the timing point for balloon pump inflation.",
          ],
        },
        {
          kind: "steps",
          title: "Measuring the LVEDP",
          items: [
            {
              title: "Find the point",
              detail: "End-diastole: the ‘C point’ immediately after the a wave, which lines up with the ECG's R wave.",
            },
            { title: "Compare", detail: "Normal is 3–12 mmHg. The wedge pressure is an indirect measure of the same filling pressure." },
            {
              title: "Act on it",
              detail:
                "Above 30 mmHg pulmonary oedema is likely. Oxford advises minimising contrast and avoiding the ventriculogram whenever the LVEDP is high, without giving a number for that advice; its figures for reducing the injection and for relative contraindication are in the ventriculography lesson.",
            },
          ],
        },
        {
          kind: "check",
          stem: "On the LV trace the pressure at the R wave, just after a prominent a wave, is 26 mmHg; the early diastolic minimum is 8 mmHg. What is the LVEDP and what does it mean for the rest of the study?",
          options: [
            "8 mmHg: normal, so the ventriculogram can go ahead at standard settings",
            "17 mmHg, the average of the two, which is mildly raised",
            "26 mmHg: raised, so contrast should be kept down and the ventriculogram reduced or omitted",
            "26 mmHg, but the a wave makes it unreliable, so use the wedge pressure instead",
          ],
          answer: 2,
          explanation:
            "LVEDP is read at end-diastole, just after the a wave at the R wave, not at the early diastolic dip. 26 mmHg is well above Oxford's normal of 3–12 mmHg; Oxford reduces the ventriculogram volume and rate above 25 mmHg and avoids it when the LVEDP is high. The a wave is part of normal LV filling and is exactly where the reading is taken.",
        },
        {
          kind: "p",
          text: "Two more reasons to look at the LVEDP early. Brilakis lists a high LVEDP among the causes of a coronary artery that will not fill completely on injection; and Oxford notes that VT can be provoked during LV catheterisation, so watch the monitor as the catheter crosses and moves in the cavity.",
        },
        { kind: "tip", id: "haemo-lhc-u-loop" },
        { kind: "tip", id: "haemo-lhc-difficult-valve" },
        { kind: "tip", id: "haemo-lhc-stenotic-valve" },
        { kind: "tip", id: "haemo-lhc-lvedp-point" },
        { kind: "tip", id: "diag-lvedp-before-lv-gram" },
        {
          kind: "pitfalls",
          items: [
            "Persisting with a pigtail at a valve you have not checked for stenosis.",
            "Crossing a severely stenotic valve when echo has already answered the question.",
            "Probing a stenotic valve with an uncontrolled wire.",
            "Reading LVEDP at the early diastolic nadir rather than after the a wave.",
            "Ventriculography in a patient whose LVEDP is already high.",
          ],
        },
        {
          kind: "pearl",
          text: "If you know you will cross a stenotic valve, take the aortogram first. Oxford notes that aortography may help identify where the leaflets open (the Prussian helmet sign); aiming the AL1 and wire at that spot is the practical use of it (author's reasoning).",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the diagnostic cath lab, take a pigtail over a J wire to just above the aortic valve, remove the wire, and in RAO form a shallow U-loop to enter the left ventricle; confirm the LV trace and read the LVEDP after the a wave.",
        },
        { kind: "video", id: "OrRkCb1QQW0", note: "Hanna: catheter techniques 4, LV catheterisation." },
        { kind: "video", id: "P0czcxqgfOo", note: "Hanna: left ventricular catheterisation, including aortic stenosis, and left ventriculography." },
        { kind: "video", id: "XMg0vHj15hs", note: "Hanna: right coronary engagement, left ventricular access, damping and ventricularisation." },
        { kind: "video", id: "_AH3a_BE0qw", note: "Hanna: discrepancies between LVEDP and PCWP." },
        {
          kind: "keypoints",
          items: [
            "Pigtail from the femoral artery (Oxford); for Impella wire placement Brilakis prefers it because it is less likely to pass behind a papillary muscle.",
            "Normal valve: tip just above the valve, AP or RAO, shallow U-loop, gentle push.",
            "Difficult valve: check for stenosis, stiffen with the wire, lead with the wire, switch to JR4 or AL, try a straight or hydrophilic wire, exchange to a pigtail over a long wire.",
            "Severe AS: cross only when needed (5 F AL1, straight hydrophilic wire, controlled), because crossing causes cerebral emboli.",
            "LVEDP is read just after the a wave, at the R wave; normal 3–12 mmHg, oedema likely above 30.",
            "The aortic dicrotic notch marks valve closure and times balloon pump inflation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-output",
      title: "Cardiac output: thermodilution, Fick and the numbers built on them",
      minutes: 13,
      topics: ["hd-cardiac-output"],
      sources: [
        O("ch 4: Calculations"),
        O("ch 4: Ventriculography"),
        O("ch 9: Mechanical circulatory support devices"),
        O("ch 5: Aortic stenosis"),
        B("24.2"),
        B("28.1"),
      ],
      refs: [...BOOKS, "esc-ph-2022", "tehrani-shock-team-2019", "hanna-pcm"],
      blocks: [
        {
          kind: "p",
          text: "Cardiac output is the flow that every resistance, shunt and valve-area calculation divides by, so an error here spreads through the whole study. The Academy's lessons on the Fick principle and thermodilution taught both methods and their pitfalls. This lesson places them in the manuals, works through the arithmetic, and shows the numbers that are built on output.",
        },
        { kind: "h", text: "Where the sources disagree" },
        {
          kind: "table",
          caption: "Three views of invasive cardiac output",
          head: ["Source", "Position"],
          rows: [
            [
              "Oxford, Calculations",
              "Output can be estimated from the ventriculogram or measured by thermodilution or Fick, but the handbook calls the invasive methods inaccurate and rarely, if ever, used clinically; it teaches them for understanding",
            ],
            [
              "Brilakis, cardiogenic shock (24.2)",
              "Invasive haemodynamics are central: the shock pathway he reproduces defines cardiogenic shock partly by a Fick cardiac index and a cardiac power output, both of which need an output",
            ],
            [
              "2022 ESC/ERS pulmonary hypertension guideline",
              "Cardiac output is one of the core measurements of a diagnostic right heart study in suspected pulmonary hypertension, and thermodilution is the preferred method",
            ],
          ],
        },
        {
          kind: "p",
          text: "Oxford's own position is that the invasive measurements are inaccurate and seldom used clinically, though worth understanding. In practice output still matters wherever pulmonary hypertension, shock or resistance is the question, so state how each output was obtained (author's advice).",
        },
        { kind: "h", text: "Cardiac index" },
        {
          kind: "formula",
          name: "Cardiac index (Oxford)",
          expr: "CI (L/min/m²) = CO (L/min) ÷ body surface area (m²)",
          note: "Oxford's typical range is 2.5–3.5 L/min/m².",
        },
        { kind: "h", text: "Thermodilution" },
        {
          kind: "p",
          text: "A bolus of fluid is injected through the proximal port of a balloon flotation (pulmonary artery) catheter; a thermistor near the distal end records the change in blood temperature, and the computer converts the curve into an output within seconds. The injection technique, the number of injections and the situations in which thermodilution misleads are taught in the Academy's thermodilution lesson (hd-flow-thermodilution).",
        },
        { kind: "h", text: "Fick" },
        {
          kind: "formula",
          name: "Fick cardiac output (Oxford)",
          expr: "CO (L/min) = O₂ consumption (mL/min) ÷ [aortic − PA O₂ content (mL/100 mL) × 10]",
          note: "The aortic sample is arterial blood; the pulmonary artery sample is mixed venous blood. The ×10 converts mL per 100 mL to mL per litre.",
        },
        {
          kind: "p",
          text: "Oxygen consumption is hard to measure, so the **indirect** Fick method assumes a value from the patient's sex, age and body surface area. Every error in that assumption passes straight into the output, and from there into every resistance calculated from it.",
        },
        {
          kind: "steps",
          title: "Worked example: Fick output, index and cardiac power",
          items: [
            { title: "Data", detail: "VO₂ 210 mL/min; haemoglobin 13 g/dL; aortic saturation 96%; PA saturation 66%; body surface area 1.8 m²; mean arterial pressure 65 mmHg." },
            {
              title: "Content difference",
              detail: "Using 1.36 mL of oxygen per gram of haemoglobin (the factor in the Academy's Fick lesson; Oxford's formula takes the content difference as given): 1.36 × 13 × (0.96 − 0.66) = 5.30 mL/100 mL, which is 53.0 mL per litre.",
            },
            { title: "Output", detail: "210 ÷ 53.0 = 3.96 L/min." },
            { title: "Index", detail: "3.96 ÷ 1.8 = 2.2 L/min/m², below Oxford's typical range." },
            {
              title: "Cardiac power output",
              detail: "Brilakis's shock pathway uses CPO = mean arterial pressure × CO ÷ 451. Here 65 × 3.96 ÷ 451 = 0.57 W, below the 0.6 W threshold.",
            },
          ],
        },
        {
          kind: "check",
          stem: "In the example above, the laboratory reports a haemoglobin of 10 g/dL instead of 13 g/dL, with everything else unchanged. What happens to the Fick output?",
          options: [
            "It falls, because less haemoglobin means less oxygen delivered",
            "It rises to about 5.1 L/min, because the content difference shrinks",
            "It is unchanged, because haemoglobin cancels out of the Fick equation",
            "It rises only slightly, to about 4.2 L/min",
          ],
          answer: 1,
          explanation:
            "The content difference becomes 1.36 × 10 × 0.30 = 4.08 mL/100 mL (40.8 mL/L), and 210 ÷ 40.8 is about 5.1 L/min. With the same oxygen uptake and a smaller content difference per litre, more blood must flow to carry it. Haemoglobin cancels only in the shunt ratio, where the same content factor appears above and below the line.",
        },
        { kind: "h", text: "What output feeds into" },
        {
          kind: "table",
          caption: "Haemodynamic criteria built on output and filling pressure",
          head: ["Source", "Criteria"],
          rows: [
            [
              "Brilakis Fig 24.7 (cardiogenic shock pathway)",
              "Clinical entry: systolic pressure below 90 mmHg for more than 30 minutes (or inotropes or vasopressors needed to hold it), evidence of end-organ hypoperfusion, lactate above 2 mmol/L. Haemodynamic: Fick cardiac index below 1.8 L/min/m² without inotropes or vasopressors (below 2.2 with them); wedge above 15 mmHg; CPO below 0.6 W; PAPi below 1.0",
            ],
            [
              "Oxford ch 9 (features of severe cardiogenic shock, in choosing support)",
              "Clinical: blood pressure below 90 mmHg, heart rate above 120 bpm, lactate above 4 mmol/L, cool peripheries, an obtunded patient, two or more inotropic or vasoactive drugs. Haemodynamic: cardiac index below 1.5 L/min/m²; wedge above 30 mmHg; LVEDP above 30 mmHg; cardiac power below 0.6 W",
            ],
            [
              "Brilakis Fig 28.1 (hypotension)",
              "Low output with low LV filling pressure suggests hypovolaemia; low output with high filling pressure suggests cardiac failure; high output with low filling pressure suggests vasodilatation (taught in the resistance lesson)",
            ],
          ],
        },
        {
          kind: "p",
          text: "Note the different PAPi thresholds: 0.9 in Brilakis's section on RV failure and 1.0 in the shock pathway he reproduces from Tehrani and colleagues. Quote the source when you use one. Once a shock patient is identified, Brilakis's monitoring advice is serial: repeated lactate and right heart haemodynamics, regular checks of RV function (RA pressure and PAPi), and a cardiac power output kept above 0.6 W while avoiding ever-rising doses of vasopressors and inotropes.",
        },
        {
          kind: "p",
          text: "Two other calculations depend on output. The ventriculogram gives stroke volume as end-diastolic minus end-systolic volume, and output is stroke volume × heart rate (Brilakis, Hypotension). And the Gorlin valve-area formula divides cardiac output by the product of a constant (44.3 for the aortic valve, 37.7 for the mitral valve), the systolic ejection period (aortic) or diastolic filling period (mitral), the heart rate and the square root of the mean gradient; because it depends on forward flow, Oxford notes that it overestimates the area at high output and underestimates it at low output, and that it is rarely used now. Its use is taught in the valve lessons of hb-specific-conditions.",
        },
        {
          kind: "check",
          stem: "A patient after a large anterior infarct has a mean arterial pressure of 70 mmHg and a thermodilution output of 3.2 L/min. Using Brilakis's formula, what is the cardiac power output and how does it compare with the shock threshold?",
          options: [
            "About 0.50 W, below the 0.6 W threshold",
            "About 0.70 W, above the 0.6 W threshold",
            "About 0.62 W, just above the threshold",
            "About 0.22 W, far below the threshold",
          ],
          answer: 0,
          explanation:
            "CPO = 70 × 3.2 ÷ 451 = 224 ÷ 451, about 0.50 W, which is below the 0.6 W threshold in both Brilakis's pathway and Oxford's list of severe shock features. 0.62 W would need an output of about 4 L/min; 0.22 W divides by 1000 instead of 451.",
        },
        { kind: "tip", id: "haemo-co-say-how" },
        { kind: "tip", id: "haemo-co-index-it" },
        { kind: "tip", id: "haemo-support-cpo-papi" },
        {
          kind: "pitfalls",
          items: [
            "Reporting an indirect Fick output without saying that oxygen consumption was assumed.",
            "Forgetting the ×10 that converts content per 100 mL into content per litre.",
            "Comparing an output with a normal range without indexing it to body size.",
            "Mixing the PAPi thresholds of two different sources without saying which you used.",
            "Trusting a Gorlin area at very high or very low output.",
          ],
        },
        {
          kind: "pearl",
          text: "When the output looks wrong, work backwards through the formula: check the haemoglobin, the two saturations and whether the oxygen consumption was measured or assumed. Most surprising Fick outputs are an input problem, not physiology.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, calculate a Fick output from the measured saturations and haemoglobin, index it to body surface area, and then calculate the cardiac power output from the mean arterial pressure.",
        },
        { kind: "video", id: "VbmoHuCAYqY", note: "Hanna: updated haemodynamics, cardiac output, mixed venous oxygen, oxygen delivery and shock indices." },
        { kind: "video", id: "ycgdPe8_bK0", note: "Hanna: haemodynamics 2, cardiac output, mixed venous oxygen and shock indices." },
        {
          kind: "keypoints",
          items: [
            "Oxford calls invasive output measurement inaccurate; Brilakis's shock pathway and the 2022 ESC/ERS guideline still rely on it.",
            "CI = CO ÷ BSA; Oxford's typical range is 2.5–3.5 L/min/m².",
            "Fick: VO₂ ÷ (arterial − mixed venous content in mL/100 mL × 10); indirect Fick assumes VO₂ from sex, age and BSA.",
            "Thermodilution: a fluid bolus into the proximal port, a thermistor at the distal end.",
            "CPO = MAP × CO ÷ 451; below 0.6 W marks shock in both manuals.",
            "Gorlin areas depend on flow: too large at high output, too small at low output.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-resistance",
      title: "Vascular resistance, hypotension and pulmonary hypertension",
      minutes: 13,
      topics: ["hd-resistance-ph"],
      sources: [O("ch 4: Calculations"), B("28.1"), B("14.1")],
      refs: [...BOOKS, "esc-ph-2022", "korabathina-papi-2012"],
      blocks: [
        {
          kind: "p",
          text: "Resistance is pressure drop divided by flow across a vascular bed. Oxford uses it for two everyday purposes: working out why a patient is hypotensive, and assessing the lungs before cardiac transplantation. The Academy's lesson on resistance taught the 2022 ESC/ERS pulmonary hypertension definitions and vasoreactivity testing; this lesson adds Oxford's formulas and normal values, the hypotension pattern from Brilakis, and the decisions in sequence.",
        },
        {
          kind: "formula",
          name: "Systemic vascular resistance (Oxford)",
          expr: "SVR (dyn·s·cm⁻⁵) = 80 × (mean aortic pressure − mean RA pressure) ÷ CO (L/min)",
          note: "Oxford's normal range: 800–1400 dyn·s·cm⁻⁵.",
        },
        {
          kind: "formula",
          name: "Pulmonary vascular resistance (Oxford)",
          expr: "PVR (dyn·s·cm⁻⁵) = 80 × (mean PA pressure − mean LA pressure or PCWP) ÷ CO (L/min)",
          note: "1 Wood unit (mmHg per L/min) = 80 dyn·s·cm⁻⁵. Oxford's normal range: 25–125 dyn·s·cm⁻⁵, which is about 0.3–1.6 Wood units.",
        },
        {
          kind: "p",
          text: "Each formula subtracts the pressure at the far end of its own circulation: the right atrium for the systemic bed, the left atrium (or its surrogate, the wedge) for the pulmonary bed. Dropping the ×80 gives the answer in Wood units. The 2022 ESC/ERS guideline treats a PVR above 2 Wood units as abnormal, which sits just above Oxford's upper normal of about 1.6.",
        },
        {
          kind: "steps",
          title: "Worked example: is this pulmonary hypertension pre-capillary?",
          items: [
            { title: "Data", detail: "Mean PA pressure 36 mmHg; wedge 12 mmHg; output 4.0 L/min." },
            { title: "Gradient", detail: "36 − 12 = 24 mmHg across the lungs." },
            { title: "PVR", detail: "24 ÷ 4.0 = 6 Wood units, or 6 × 80 = 480 dyn·s·cm⁻⁵: far above Oxford's normal range." },
            {
              title: "Classify (ESC/ERS 2022)",
              detail: "Mean PA pressure above 20 mmHg, wedge 15 mmHg or less, PVR above 2 Wood units: pre-capillary pulmonary hypertension.",
            },
          ],
        },
        {
          kind: "check",
          stem: "Mean PA pressure 30 mmHg, wedge 22 mmHg, cardiac output 5.0 L/min. A colleague calculates PVR as 30 ÷ 5.0 = 6 Wood units and calls the hypertension pre-capillary. What is the correct reading?",
          options: [
            "Agree: 6 Wood units is clearly pre-capillary",
            "PVR is (30 − 22) ÷ 5.0 = 1.6 Wood units; with a wedge above 15 this is isolated post-capillary pulmonary hypertension",
            "PVR is (30 − 22) × 5.0 = 40 Wood units, combined pre- and post-capillary disease",
            "PVR cannot be calculated without a measured LA pressure",
          ],
          answer: 1,
          explanation:
            "PVR uses the pressure drop across the lungs, so the wedge (standing in for LA pressure, as Oxford's formula allows) must be subtracted: 8 ÷ 5.0 = 1.6 Wood units. With mean PA pressure above 20 mmHg, wedge above 15 mmHg and PVR of 2 Wood units or less, the 2022 ESC/ERS category is isolated post-capillary. Dividing mean PA pressure alone ignores downstream pressure; multiplying by flow is the wrong operation.",
        },
        { kind: "h", text: "Hypotension: false first, then the pattern" },
        {
          kind: "steps",
          title: "Brilakis's approach to low pressure in the lab (Fig 28.1)",
          items: [
            {
              title: "1. Exclude a false reading",
              detail:
                "Is the Y-connector valve closed? Is the catheter-to-transducer connection tight and free of air? Is the trace damped? Is the catheter obstructed by air, thrombus or contrast (contrast alone can damp the trace, especially in 4 and 5 F catheters)? If so, aspirate it; if aspiration fails, remove the catheter without injecting. Is there too much equipment inside it? Correct whatever you find.",
            },
            {
              title: "2. If it is real, sort the cause",
              detail: "The three groups are hypovolaemia, cardiac failure and peripheral vasodilatation; a right heart study separates them when the cause is not obvious.",
            },
            { title: "3. Read the pattern", detail: "Combine the LV filling pressure (wedge or LVEDP), the output and, from them, the SVR (table below)." },
          ],
        },
        {
          kind: "table",
          caption: "Right heart patterns in true hypotension (Brilakis Fig 28.1; SVR from Oxford)",
          head: ["Cause", "LV filling pressure", "Cardiac output", "Examples"],
          rows: [
            ["Hypovolaemia", "Low", "Low", "Bleeding, poor hydration"],
            [
              "Cardiac failure",
              "High (can be low in RV failure)",
              "Low",
              "Ischaemia, LV or RV failure, acute regurgitation or stenosis, tamponade or rupture, brady- or tachyarrhythmia. Oxford: SVR typically high in cardiogenic shock",
            ],
            ["Peripheral vasodilatation", "Low", "High", "Vasovagal reaction, anaphylaxis, drugs. Oxford: SVR typically low in sepsis"],
          ],
        },
        { kind: "h", text: "Clues and prevention (Brilakis 28.1)" },
        {
          kind: "list",
          items: [
            "**Damping:** common with ostial coronary lesions and large guides such as 8 F. Side-hole guides can hide damping, so Brilakis never uses them to engage the left main (except for an ostial left main CTO): they can mask ischaemia until the patient collapses.",
            "**Hypovolaemia:** most often bleeding. Inspect the access sites for a haematoma, and screen the bladder: a ‘dented bladder’ suggests a retroperitoneal haematoma.",
            "**Cardiac failure:** stroke volume falls with LV or RV dysfunction (most often ischaemia), acute valve regurgitation or tamponade, and output also falls with brady- or tachyarrhythmias.",
            "**Vasodilatation:** a vasovagal or anaphylactic reaction, or drugs such as nitroglycerin (especially after recent phosphodiesterase-5 inhibitor use) and verapamil given for radial spasm.",
            "**Preventing false hypotension:** check every connection, clear the catheter carefully after insertion, and avoid deep engagement that damps the trace.",
            "**Preventing true hypotension:** careful (preferably radial) access without excessive anticoagulation, adequate hydration beforehand, prophylactic haemodynamic support in high-risk PCI, short coronary occlusions, and avoiding perforation and tamponade.",
          ],
        },
        {
          kind: "check",
          stem: "During a PCI the blood pressure falls to 78/40 mmHg. The connections and trace are sound. A pulmonary artery catheter shows a wedge of 6 mmHg and a thermodilution output of 7.2 L/min. Mean arterial pressure is 53 mmHg and RA pressure 4 mmHg. Which group does this fit?",
          options: [
            "Cardiac failure: the low pressure means the pump is failing",
            "Hypovolaemia from bleeding: the wedge is low",
            "Peripheral vasodilatation: low filling pressure with a high output and an SVR of about 545 dyn·s·cm⁻⁵",
            "False hypotension from damping",
          ],
          answer: 2,
          explanation:
            "Low filling pressure with a high output is Brilakis's vasodilatation pattern; SVR = 80 × (53 − 4) ÷ 7.2 ≈ 545 dyn·s·cm⁻⁵, below Oxford's 800–1400 range. Hypovolaemia also lowers the wedge, but the output falls with it. Cardiac failure raises filling pressure and lowers output. The question states the trace and connections were checked.",
        },
        { kind: "h", text: "The right ventricle" },
        {
          kind: "formula",
          name: "Pulmonary artery pulsatility index (Brilakis 14.1)",
          expr: "PAPi = (PA systolic − PA diastolic) ÷ RA pressure",
          note: "Brilakis: RA pressure above 12 mmHg or PAPi below 0.9 suggests RV failure.",
        },
        { kind: "h", text: "Vasoreactivity: what neither manual covers" },
        {
          kind: "p",
          text: "Neither manual describes acute vasoreactivity testing. The 2022 ESC/ERS guideline restricts it to idiopathic, heritable and drug- or toxin-associated pulmonary arterial hypertension, using inhaled nitric oxide or inhaled iloprost (intravenous epoprostenol as an alternative). A positive test is a fall in mean PA pressure of at least 10 mmHg to 40 mmHg or less, with cardiac output unchanged or higher. The Academy's resistance lesson (hd-flow-resistance-ph) explains why it is avoided in left heart disease.",
        },
        { kind: "tip", id: "haemo-pvr-right-pressures" },
        { kind: "tip", id: "haemo-hypotension-pattern" },
        {
          kind: "pitfalls",
          items: [
            "Subtracting the wrong downstream pressure: RA for SVR, LA or wedge for PVR.",
            "Mixing Wood units and dyn·s·cm⁻⁵ in one report.",
            "Treating a low pressure as real before checking the Y-connector, connections, damping and the catheter lumen.",
            "Injecting through an obstructed catheter that will not aspirate: Brilakis removes it without any injection.",
            "Calling every low pressure with a low wedge hypovolaemia: in RV failure the LV filling pressure can be low too.",
            "Calling a fall in mean PA pressure positive when the output fell with it.",
          ],
        },
        {
          kind: "pearl",
          text: "Write resistance with its ingredients: the two pressures, the output and how the output was measured. A PVR is only as good as the wedge and the output behind it, and the person reading the report needs to know both.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, calculate SVR and PVR in both units from a recorded study, classify the pulmonary pressures by the 2022 definitions, and decide which hypotension pattern the numbers fit.",
        },
        { kind: "video", id: "Vd7emZcvj0g", note: "Hanna: pulmonary hypertension haemodynamics, misunderstood concepts, tips and tricks." },
        { kind: "video", id: "fdcEm7UgYWk", note: "Hanna: pulmonary hypertension updates, vasodilators in combined pre- and post-capillary disease." },
        {
          kind: "keypoints",
          items: [
            "SVR = 80 × (mean Ao − mean RA) ÷ CO; Oxford normal 800–1400 dyn·s·cm⁻⁵.",
            "PVR = 80 × (mean PA − LA or wedge) ÷ CO; Oxford normal 25–125 dyn·s·cm⁻⁵; ESC/ERS 2022 abnormal above 2 Wood units.",
            "1 Wood unit = 80 dyn·s·cm⁻⁵.",
            "Hypotension: exclude a false reading, then read filling pressure and output together.",
            "SVR is typically low in sepsis and high in cardiogenic shock.",
            "RV failure: RA above 12 mmHg or PAPi below 0.9 (Brilakis).",
            "Vasoreactivity testing comes from the 2022 ESC/ERS guideline, not from either manual.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-shunts",
      title: "The shunt study: oximetry, ASD and VSD",
      minutes: 12,
      topics: ["hd-shunts"],
      sources: [
        O("ch 4: Calculations"),
        O("ch 5: Atrial septal defect"),
        O("ch 5: Ventricular septal defect"),
        O("ch 4: Accessing the left heart"),
        O("ch 4: Ventriculography"),
      ],
      refs: [...BOOKS, "esc-achd-2020", "esc-ph-2022"],
      blocks: [
        {
          kind: "p",
          text: "A left-to-right shunt shows itself as oxygenated blood appearing on the right side. The Academy's shunt module taught the full oximetry run, the step-up criteria and the shunt patterns. This lesson gives Oxford's compact method, walks through a calculation including the traps, and then sets out how Oxford runs the catheter study of an atrial and a ventricular septal defect.",
        },
        {
          kind: "steps",
          title: "Oxford's shunt calculation",
          items: [
            { title: "1. Sample", detail: "Superior vena cava, inferior vena cava, pulmonary artery and aorta, at minimum; oximetry uses several venous and arterial samples." },
            {
              title: "2. Build the mixed venous saturation",
              detail: "SVC blood is less saturated than IVC blood, so they are weighted: mixed venous = (3 × SVC + IVC) ÷ 4.",
            },
            {
              title: "3. Pulmonary venous saturation",
              detail: "Sample a pulmonary vein if you can; if not, use 98%.",
            },
            { title: "4. Calculate", detail: "Qp:Qs = (aortic − mixed venous) ÷ (pulmonary venous − PA)." },
            {
              title: "5. Interpret",
              detail:
                "Oxford reads a ratio under 1.5 as a small left-to-right shunt and one over 2 as large. The 2020 ESC adult congenital guideline weighs the ratio together with RV volume load and PVR when deciding on closure.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Worked example: secundum ASD",
          head: ["Sample", "Saturation", "Working"],
          rows: [
            ["SVC", "70%", ""],
            ["IVC", "78%", "Mixed venous = (3 × 70 + 78) ÷ 4 = 72%"],
            ["Pulmonary artery", "85%", ""],
            ["Left atrium (through the defect)", "98%", "Used as pulmonary venous saturation"],
            ["Aorta", "97%", ""],
            ["Qp:Qs", "1.9", "(97 − 72) ÷ (98 − 85) = 25 ÷ 13"],
          ],
        },
        {
          kind: "check",
          stem: "In the example, a trainee uses a single right atrial sample of 84% as the mixed venous saturation. What ratio do they get, and why is it wrong?",
          options: [
            "1.9, the same, because the RA receives both venae cavae",
            "About 1.0, because the RA sample already contains shunted blood, which hides most of the shunt",
            "About 2.5, because the RA overstates the shunt",
            "It cannot be calculated without an IVC sample",
          ],
          answer: 1,
          explanation:
            "(97 − 84) ÷ 13 = 1.0. In an atrial-level shunt the RA is where oxygenated blood enters, so it is not mixed venous blood; using it removes the step-up from the calculation. That is why Oxford builds the mixed venous value from the SVC and IVC. Oxford also names streaming as a source of error, which is one more reason not to rely on a single atrial sample.",
        },
        {
          kind: "list",
          items: [
            "**Streaming and position:** Oxford states that errors arise from streaming and from inaccurate catheter positioning, so take each sample from the right place.",
            "**The denominator is small:** pulmonary venous minus PA saturation is only 13 percentage points in the worked example, so an error of 1–2 points in either sample moves the ratio a long way. Duplicating the key samples guards against this (author's reasoning from the arithmetic).",
            "**The 98% substitution:** Oxford substitutes 98% only when a pulmonary vein cannot be sampled. A measured value is better when you can get one, as through an ASD, and 98% will overstate pulmonary venous saturation if the lungs do not oxygenate normally (author's reasoning).",
          ],
        },
        { kind: "h", text: "The ASD study" },
        {
          kind: "p",
          text: "Atrial septal defect is one of the commonest congenital lesions seen in adults. Patients typically present with breathlessness or palpitation from right heart failure and pulmonary hypertension, and transthoracic and transoesophageal echo will usually have supported the diagnosis before the catheter study.",
        },
        {
          kind: "steps",
          title: "Catheter study of an ASD (Oxford)",
          items: [
            { title: "1. Right heart study", detail: "Record the pressures, including the PA pressure, to look for pulmonary hypertension." },
            { title: "2. Right heart pullback", detail: "Record pressures as the catheter is withdrawn through the chambers." },
            {
              title: "3. Cross the defect",
              detail: "Try to pass the catheter through the ASD and take a left atrial saturation; the defect is also one of the routes into the left heart.",
            },
            {
              title: "4. Quantify the shunt and look for anomalous veins",
              detail: "Calculate Qp:Qs, and exclude anomalous pulmonary venous drainage (Oxford gives this as one of the aims of the study without saying how; the Academy's shunt module covers the oximetry clues).",
            },
            {
              title: "5. Plan closure",
              detail:
                "Secundum defects are now commonly closed percutaneously, often planned alongside the study, with transoesophageal or intracardiac echo to guide the device. Closure itself is taught in the other-procedures module (hb-additional-procedures).",
            },
          ],
        },
        {
          kind: "p",
          text: "Oxford defines resistance as the pressure drop across a circulation divided by the flow passing through it; in a shunt the flow through the lungs is Qp, so PVR is calculated with pulmonary flow (this follows from the definition; Oxford's printed formula simply says cardiac output). The 2020 ESC adult congenital guideline recommends ASD closure in patients with RV volume overload and a PVR below 3 Wood units, regardless of symptoms; above that the decision depends on the remaining left-to-right shunt and expert assessment (see the Academy's shunt patterns lesson).",
        },
        { kind: "h", text: "The VSD study" },
        {
          kind: "steps",
          title: "Catheter study of a VSD (Oxford)",
          items: [
            {
              title: "Context",
              detail:
                "Echo usually confirms the diagnosis; in adults the catheter study is usually done during or just before a corrective procedure, to define the defect's position and size and to quantify the shunt.",
            },
            { title: "Gradient", detail: "Record LV and RV pressures simultaneously to measure the pressure difference across the defect." },
            { title: "Shunt", detail: "Oximetry quantifies the left-to-right flow." },
            { title: "Picture", detail: "A left ventriculogram in the LAO cranial view shows the septum, with contrast crossing from LV to RV through the defect." },
          ],
        },
        {
          kind: "check",
          stem: "You are asked to define a muscular VSD before a planned percutaneous closure. Which ventriculographic view do you set up?",
          options: [
            "RAO 30°, which shows the anterior, apical and inferior walls",
            "LAO about 60° with about 20° cranial tilt, which lays out the septum",
            "AP, which shows the tricuspid valve and pulmonary arteries",
            "RAO caudal, as for the left coronary bifurcation",
          ],
          answer: 1,
          explanation:
            "Oxford's LAO 60° cranial 20° view shows the septal and posterolateral walls and is the view for localising a VSD. RAO 30° shows the anterior, apical and inferior walls, not the septum. AP is Oxford's view for right ventriculography.",
        },
        { kind: "tip", id: "haemo-shunt-mixed-venous" },
        { kind: "tip", id: "haemo-shunt-asd-cross" },
        { kind: "tip", id: "haemo-shunt-vsd-simultaneous" },
        { kind: "tip", id: "haemo-post-mi-shunt-run" },
        {
          kind: "pitfalls",
          items: [
            "Using an RA sample as mixed venous blood in an atrial-level shunt.",
            "Sampling from the wrong position, or relying on single samples where streaming is likely.",
            "Substituting 98% for pulmonary venous saturation when a left atrial sample was obtainable.",
            "Forgetting to look for anomalous pulmonary venous drainage in an ASD study.",
            "Choosing an RAO ventriculogram to show a VSD.",
          ],
        },
        {
          kind: "pearl",
          text: "In an ASD study the defect is your friend: the catheter often passes through it, giving you a measured left atrial saturation for the shunt ratio and access to the left heart without a transseptal puncture.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "In the haemodynamics lab, take SVC, IVC, PA, aortic and left atrial samples in a patient with an ASD, build the mixed venous saturation and calculate Qp:Qs.",
        },
        { kind: "video", id: "qE1c8z5CPwM", note: "Hanna: quick assessment of cardiac shunts and quick Qp/Qs calculation." },
        { kind: "video", id: "Jxm_X5EDPWw", note: "Hanna: shunt haemodynamics, left-to-right and right-to-left, from simple to complex calculations." },
        { kind: "video", id: "JXy5Fe08KY0", note: "Hanna: haemodynamics 3, shunt haemodynamics and case studies." },
        {
          kind: "keypoints",
          items: [
            "Minimum samples: SVC, IVC, PA, aorta; mixed venous = (3 × SVC + IVC) ÷ 4.",
            "Qp:Qs = (Ao − MV) ÷ (PV − PA), using 98% if no pulmonary venous sample.",
            "Oxford: below 1.5 small, above 2 large; ESC ACHD weighs RV load and PVR too.",
            "Oxford's sources of error are streaming and catheter position; duplicating key samples is a sensible guard.",
            "ASD study: right heart pressures, pullback, cross the defect for an LA sample, quantify, exclude anomalous veins.",
            "VSD study: simultaneous LV and RV pressures, oximetry, LAO cranial ventriculogram.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-lv-gram",
      title: "Left ventriculography: doing it and reading it",
      minutes: 15,
      topics: ["dx-lv-aortography"],
      sources: [
        O("ch 4: Ventriculography"),
        O("ch 4: Left heart pressures and waveforms"),
        O("ch 5: Mitral regurgitation"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 6: Unusual coronary anatomy"),
        O("ch 10: Cardiac tamponade"),
        B("7.2"),
        B("20.7"),
      ],
      refs: [...BOOKS, "sellers-1964", "ghadri-takotsubo-consensus-2018"],
      blocks: [
        {
          kind: "p",
          text: "A left ventriculogram shows global and regional LV function, aneurysms, thrombus, septal defects and mitral regurgitation in one run. Oxford points out that a good echocardiogram gives all of this, and more, without radiation or contrast, so the ventriculogram is now done when it answers something echo has not. The Academy's ventriculography lesson gave the overview; this lesson takes you through the injection itself, its problems and the reading, step by step.",
        },
        {
          kind: "table",
          caption: "When to do it, when to think twice, what can go wrong (Oxford)",
          head: ["Indications", "Relative contraindications", "Complications"],
          rows: [
            [
              "LV function in known or suspected coronary disease; LV function in valve disease; grading mitral regurgitation; locating a VSD",
              "Critical aortic stenosis; severe left main stenosis (hypotension); LVEDP above 35 mmHg; pulmonary oedema; LV systolic hypertension; LV thrombus",
              "VT or VF; air or thrombus embolism; contrast reactions and nephropathy; intramyocardial injection (usually benign, occasionally tamponade); access complications",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds an acute use. In an acute coronary syndrome a hypokinetic territory on the ventriculogram (or echo) helps identify the culprit artery, and when no culprit is obvious the ventriculogram can reveal takotsubo cardiomyopathy or a mechanical complication such as papillary muscle or free wall rupture, clarify the infarct territory, or suggest another diagnosis such as myocarditis. A transthoracic echo in the lab is the alternative, and it can also show a post-infarct VSD, ventricular rupture or papillary muscle rupture.",
        },
        {
          kind: "steps",
          title: "Performing the ventriculogram (Oxford)",
          items: [
            { title: "1. Catheter", detail: "A pigtail with side holes, advanced into the LV with or without the wire as taught in the left heart lesson." },
            {
              title: "2. Position",
              detail:
                "Place the tip in the mid-cavity, where it provokes the fewest ectopics and stays clear of the mitral apparatus. If an LV aneurysm is known or suspected, move gently: unseen mural thrombus can be dislodged.",
            },
            { title: "3. Pressure", detail: "Connect to pressure, confirm an LV trace and record the LVEDP." },
            {
              title: "4. Connect the injector without air",
              detail:
                "Attach the injector (an extension is sometimes needed), letting contrast run slowly out of the injector line as you connect so no air enters, and make every connection tight: the pressures are high enough to pull equipment apart.",
            },
            {
              title: "5. Set the injection",
              detail:
                "Oxford's usual volume is 30–35 mL, delivered at 10–15 mL/s. Some operators add a rise time of 0.1–0.5 s, about one-hundredth of the flow rate (0.1 s at 10 mL/s), to reduce catheter whip. With impaired LV function or an LVEDP above 25 mmHg, reduce volume and rate (for example 30 mL at 10 mL/s).",
            },
            {
              title: "6. Warn the patient",
              detail: "Tell them to expect a hot flush through the body and a feeling of passing urine; unexpected, it can frighten them.",
            },
            {
              title: "7. Breath-hold and acquire",
              detail:
                "Ask for a deep breath held in, check the image is lined up, then repeat and acquire. Start the injection a few frames into acquisition and keep acquiring until you have a satisfactory cardiac cycle. Be ready to pull the catheter back quickly if something goes wrong.",
            },
            {
              title: "8. Back to pressure",
              detail: "Reconnect to the transducer, again without letting air in, and check the run is diagnostic; repeat it if opacification or position was poor.",
            },
            {
              title: "9. Pull back",
              detail: "With pressure recording, withdraw from LV to aorta to estimate any gradient through the outflow tract, then remove the catheter over the wire.",
            },
          ],
        },
        {
          kind: "check",
          stem: "The pigtail sits near the apex and every small movement provokes ventricular ectopics. What do you do before the power injection?",
          options: [
            "Inject anyway; ectopics at the start of a run are expected and do not affect the reading",
            "Withdraw it gently into the mid-cavity, away from the apex and the mitral apparatus, and confirm a quiet position",
            "Advance it further into the apex so it is stable",
            "Double the injection rate so the run is over before the ectopics matter",
          ],
          answer: 1,
          explanation:
            "Oxford notes that ectopy is common with apically placed catheters and advises gentle withdrawal and repositioning, aiming for the mid-cavity. Oxford also asks you to exclude MR caused by ectopics before reporting it, so a run full of ectopics is a poor run. A faster injection is the wrong fix: Oxford's rise time exists to prevent catheter whip, which an abrupt high flow encourages.",
        },
        {
          kind: "table",
          caption: "Problems during ventriculography and their fixes (Oxford)",
          head: ["Problem", "Fix"],
          rows: [
            ["Tip caught in the papillary muscles (especially with a pigtail)", "Rotate gently either way and withdraw; this usually frees it"],
            ["Ectopy, especially at the apex", "Withdraw a little and reposition"],
            ["Ectopic beats at the start of the injection", "Keep acquiring until a clean, ectopic-free cycle has been recorded"],
            ["Unsure the tip is clear of an aneurysm or the wall", "Hand-inject 10 mL as a test first; avoid injecting straight into an aneurysm"],
            ["Patient startled by the flush", "Warn them beforehand"],
          ],
        },
        { kind: "h", text: "Views" },
        {
          kind: "table",
          caption: "Projections for ventriculography (Oxford)",
          head: ["View", "Shows"],
          rows: [
            ["RAO 30° (the standard view)", "Anterior, apical and inferior walls; mitral regurgitation, with the image panned to the left atrium"],
            ["LAO 60°, cranial 20°", "Septal and posterolateral walls; the view for localising a VSD; can also show MR"],
            ["Biplane", "Both views from one injection, at the cost of more radiation and time to position the equipment"],
          ],
        },
        { kind: "p", text: "Frame rates of 30–60 frames per second are typical." },
        { kind: "h", text: "Reading the ventriculogram" },
        {
          kind: "list",
          items: [
            "**Global function:** by eye, described as normal, mildly, moderately or severely impaired; dedicated software can analyse stored runs quantitatively. EF (%) = (EDV − ESV) ÷ EDV × 100, where EDV − ESV is the stroke volume.",
            "**Regional wall motion:** normal (uniform concentric contraction), hypokinetic (reduced), akinetic (absent) or dyskinetic (paradoxical).",
            "**Thrombus:** a filling defect, usually at the apex and especially with poor LV function or an aneurysm; it can be laminar.",
            "**Takotsubo:** Oxford describes unobstructed coronary arteries with classical apical ballooning. The 2018 InterTAK consensus adds that apical ballooning is only the commonest of four types (apical, midventricular, basal, focal), and that coexisting coronary disease (reported in 10–29%) does not exclude the diagnosis; the wall-motion abnormality then usually extends beyond the territory of the diseased artery.",
            "**Anomalous circumflex:** a ‘dot’ sign (the vessel seen end-on as it runs behind the aorta) on the ventriculogram, or no vessel supplying the lateral wall.",
            "**VSD:** contrast passing from LV to RV in the LAO cranial view.",
          ],
        },
        {
          kind: "table",
          caption: "Mitral regurgitation on the ventriculogram (Oxford, Mitral regurgitation)",
          head: ["Grade", "Left atrium"],
          rows: [
            ["I", "Minimal regurgitation that clears rapidly with each beat"],
            ["II", "Moderate opacification that clears over the following beats"],
            ["III", "Intense opacification, becoming as dense as the LV"],
            ["IV", "Intense opacification, denser than the LV, often persisting over later beats"],
          ],
        },
        {
          kind: "p",
          text: "The grade depends on the LV's function as well as the regurgitant volume. The Academy's ventriculography lesson uses a grading after Sellers and colleagues that adds timing: its grade 4 MR opacifies the left atrium densely within the first beat, with contrast refluxing into the pulmonary veins. Say which scheme you used. Before you report MR, make sure it is not catheter-induced (the catheter pressing on the mitral apparatus) or produced by ectopic beats; the run may also show the cause, such as a flail leaflet or annular calcification.",
        },
        {
          kind: "check",
          stem: "On an RAO ventriculogram the left atrium becomes as dense as the ventricle over three beats. Two of those beats were ventricular ectopics and the pigtail lay against the posterior mitral leaflet. What do you report?",
          options: [
            "Grade III mitral regurgitation",
            "Grade IV mitral regurgitation, because it persisted over several beats",
            "That the run cannot be graded: reposition to the mid-cavity, wait for clean beats, and repeat if MR still needs grading",
            "Grade I mitral regurgitation, because ectopics always double the apparent grade",
          ],
          answer: 2,
          explanation:
            "Oxford asks you to exclude catheter-induced MR and MR from ectopics before reporting. With the catheter on the leaflet and ectopic beats, this run cannot be graded honestly; reposition and acquire clean beats (or rely on echo). There is no fixed rule for how much ectopics inflate the grade.",
        },
        { kind: "h", text: "Right ventriculography" },
        {
          kind: "p",
          text: "Rarely performed. Oxford lists tricuspid regurgitation, right-to-left shunts, RV cardiomyopathies and RV outflow tract abnormalities; with the catheter in the RV, an AP projection shows the tricuspid valve and the pulmonary arteries.",
        },
        { kind: "tip", id: "diag-lv-gram-mid-cavity" },
        { kind: "tip", id: "diag-lv-gram-injector" },
        { kind: "tip", id: "diag-lv-gram-test-injection" },
        { kind: "tip", id: "diag-lv-gram-papillary" },
        { kind: "tip", id: "diag-lv-gram-clean-cycle" },
        { kind: "tip", id: "diag-lv-gram-views" },
        { kind: "tip", id: "diag-lv-pullback-over-wire" },
        { kind: "tip", id: "diag-lvedp-before-lv-gram" },
        { kind: "tip", id: "diag-lv-gram-tamponade" },
        {
          kind: "pitfalls",
          items: [
            "Ventriculography when a recent good echo already answers the question.",
            "Injecting with the tip at the apex, in the papillary muscles or against the wall.",
            "Air in the injector line or a loose connection.",
            "Grading MR from ectopic beats or with the catheter on the mitral apparatus.",
            "Forgetting the pullback, which is the moment to record an outflow tract gradient.",
            "Missing intramyocardial staining: Oxford lists ventriculography among the causes of tamponade.",
          ],
        },
        {
          kind: "pearl",
          text: "Oxford gives three LVEDP figures on different pages: reduce the injection above 25 mmHg, expect pulmonary oedema above 30 mmHg, and treat above 35 mmHg as a relative contraindication. Separately, it advises avoiding the ventriculogram whenever the LVEDP is high, without giving a number. Working to the lowest figure that applies keeps you out of trouble.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the diagnostic cath lab, place a pigtail in the LV mid-cavity, read the LVEDP, and set up an RAO 30° projection; then pull back to the aorta while watching the pressure for a gradient. (A scored ventriculogram injection is requested from the lab build.)",
        },
        { kind: "video", id: "Cueo0oIz-eA", note: "Brilakis, Manual of PCI 6.6: how to perform and interpret left ventriculography." },
        { kind: "video", id: "P0czcxqgfOo", note: "Hanna: left ventricular catheterisation and left ventriculography, diagrams and cases." },
        {
          kind: "keypoints",
          items: [
            "Do a ventriculogram when echo has not answered the question; in ACS it can identify the culprit territory or takotsubo.",
            "Pigtail in the mid-cavity, clear of the apex and mitral apparatus; record the LVEDP first.",
            "Usual injection: 30–35 mL, delivered at 10–15 mL/s; reduce (e.g. 30 mL at 10 mL/s) with poor LV function or LVEDP above 25 mmHg.",
            "RAO 30°: anterior, apical, inferior walls and MR. LAO 60° cranial 20°: septum, posterolateral wall, VSD.",
            "Wall motion: normal, hypokinetic, akinetic, dyskinetic. MR grade I–IV by LA density relative to the LV.",
            "Exclude catheter-induced and ectopic MR before reporting.",
            "Pull back to the aorta under pressure and remove the catheter over the wire.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-cardiac-catheterisation-aortography",
      title: "Aortography: the root, the valve, grafts and coarctation",
      minutes: 12,
      topics: ["dx-lv-aortography"],
      sources: [
        O("ch 4: Aortography"),
        O("ch 5: Aortic regurgitation"),
        O("ch 5: Aortic stenosis"),
        O("ch 5: TAVI work-up"),
        O("ch 7: Aortography"),
        O("ch 6: Unusual coronary anatomy"),
        B("5.7"),
        B("18.5"),
        B("28.1"),
      ],
      refs: [...BOOKS, "esc-achd-2020", "sellers-1964"],
      blocks: [
        {
          kind: "p",
          text: "An ascending aortogram fills the root with contrast through a pigtail. It is a large single dose, so it should answer a specific question: how much aortic regurgitation there is, what the aorta looks like, where the grafts or an anomalous coronary arise, or how the valve sits before TAVI. The Academy's aortography lesson gave the overview; this lesson gives the manuals' settings, the steps and the reading.",
        },
        {
          kind: "table",
          caption: "Questions an aortogram answers",
          head: ["Question", "Source and detail"],
          rows: [
            ["How severe is the aortic regurgitation?", "Oxford, Aortography and Aortic regurgitation (grading below)"],
            ["Aneurysm, coarctation or (rarely) dissection?", "Oxford, Aortography"],
            ["Where are the bypass grafts, and are they open?", "Oxford ch 4 and ch 7; Brilakis 18.5"],
            [
              "Where is the coronary ostium?",
              "Brilakis 5.7: when a coronary or graft cannot be engaged and the ostium's position is unclear, a cusp injection or aortogram can show an anomalous origin or a flush ostial occlusion",
            ],
            [
              "How does the valve sit before TAVI?",
              "Oxford, TAVI work-up: aortography should always be done to show the angle between the valve and the ascending aorta. The same section notes that CT angiography already supplies part of the work-up (the access vessels) non-invasively; follow your TAVI team's current imaging protocol",
            ],
            ["Where do the stenotic leaflets open?", "Oxford, Aortic stenosis: the ‘Prussian helmet’ sign guides crossing when crossing is needed"],
          ],
        },
        {
          kind: "steps",
          title: "Performing the aortogram",
          items: [
            { title: "1. Catheter", detail: "A pigtail with side holes, advanced on a wire under fluoroscopy to the proximal ascending aorta." },
            {
              title: "2. Keep off the valve",
              detail: "Oxford: check that the catheter is not getting in the way of the leaflets opening or closing. A catheter holding a leaflet can be expected to create or exaggerate regurgitation (author's reasoning; Oxford links catheter interference with the valve to errors in the pullback gradient).",
            },
            { title: "3. Prepare", detail: "Remove the wire, aspirate the catheter and connect the pressure injector." },
            {
              title: "4. Inject",
              detail:
                "Oxford: 40–60 mL at 20 mL/s in an LAO projection during a breath-hold. Brilakis's figures for finding ostia and grafts are similar: 60 mL over 3 seconds, or 60 mL at 20 mL/s in LAO.",
            },
            {
              title: "5. For grafts",
              detail:
                "Sit the pigtail a little higher in the aorta and acquire for longer, so the origin, position and direction of each graft can be traced.",
            },
          ],
        },
        {
          kind: "check",
          stem: "You are about to grade aortic regurgitation, and the pigtail loop is sitting in the non-coronary sinus touching a leaflet. What is the problem?",
          options: [
            "None: closer to the valve gives denser opacification of the LV and a more accurate grade",
            "The catheter can hold the leaflet open and create or exaggerate regurgitation; pull it up until it is clear of the leaflets",
            "The injection will go into the coronary arteries instead of the root",
            "It is the correct position for an aortogram done to find bypass grafts",
          ],
          answer: 1,
          explanation:
            "Oxford's aortography steps include checking that the catheter does not interfere with leaflet opening or closing. Oxford does not spell out the consequence, but a catheter holding a leaflet can be expected to create or exaggerate regurgitation (author's reasoning), so move it clear before grading. For grafts the catheter goes higher, not lower.",
        },
        {
          kind: "table",
          caption: "Aortic regurgitation on the aortogram (Oxford, Aortic regurgitation)",
          head: ["Grade", "Left ventricle"],
          rows: [
            ["I", "Minimal regurgitation that clears rapidly with each beat"],
            ["II", "LV opacified, but less densely than the aorta"],
            ["III", "LV opacification reaching the density of the aorta"],
            ["IV", "Intense LV opacification, denser than the aorta, often persisting over later beats"],
          ],
        },
        {
          kind: "p",
          text: "As with mitral regurgitation, the grade reflects the LV as well as the regurgitant volume (Oxford). The Academy's aortography lesson grades after Sellers and colleagues and adds timing: its grade 4 AR opacifies the LV densely within the first beat. Say which scheme you used.",
        },
        {
          kind: "p",
          text: "Brilakis adds an iatrogenic version during coronary work: an Amplatz catheter, or a deeply curved EBU, can push an aortic cusp open, causing acute regurgitation and hypotension that repositioning corrects at once.",
        },
        { kind: "h", text: "Grafts: the aortogram as a road map" },
        {
          kind: "steps",
          title: "Using an aortogram to find grafts (Oxford ch 7; Brilakis 18.5)",
          items: [
            {
              title: "When",
              detail: "Before or during the search for grafts, when it is unclear which grafts were placed, when a graft may be occluded, or to find a graft's origin.",
            },
            { title: "Acquire", detail: "Usually in LAO, with the pigtail higher in the ascending aorta and a long acquisition." },
            {
              title: "Freeze the best frame",
              detail:
                "Loop through the run and freeze the clearest image. It is your road map for engaging the grafts, as long as you keep the same projection; sternal wires and rib spaces act as landmarks.",
            },
            {
              title: "Keep looking",
              detail: "Brilakis: if the anatomy is unknown, keep searching until every myocardial territory has a source of flow.",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "**Markers are rare:** Brilakis notes that graft markers, which help engagement, are used in only about 10% of bypass patients.",
            "**Catheters:** his most common choices are a multipurpose for right coronary grafts and an AL1 or left coronary bypass catheter for left-sided grafts; a JR4 often engages both, so many operators try it first straight after the native RCA.",
            "**Were the mammary arteries used?** Bilateral subclavian angiography shows whether one or both internal mammary arteries were grafted, and surgical clips along an IMA suggest it was used.",
            "**Aortogram settings for grafts (Brilakis):** about 60 mL at 20 mL/s, filmed in LAO. Graft engagement in detail is taught in cp-prior-cabg.",
          ],
        },
        {
          kind: "check",
          stem: "In a patient with prior surgery and no operation note, a JR4 and an AL1 have failed to find a vein graft to the RCA territory. What is the most efficient next step?",
          options: [
            "Keep trying catheter shapes until the graft is found, as an aortogram adds contrast",
            "Perform an LAO aortogram with the pigtail high and a long acquisition, freeze the clearest frame and engage the graft in the same projection",
            "Conclude that the graft is occluded and report it",
            "Perform a left ventriculogram to see whether the inferior wall is still contracting",
          ],
          answer: 1,
          explanation:
            "Oxford's road-map technique uses the frozen LAO aortogram to guide engagement in the same view, and Brilakis advises an aortogram when graft engagement is challenging. Brilakis's rule is to keep searching until every myocardial territory has a source of flow, so declaring occlusion now is premature; a multipurpose catheter, his usual catheter for right-sided grafts, is also a reasonable next try. A ventriculogram says nothing about where the graft arises.",
        },
        { kind: "h", text: "Coarctation" },
        {
          kind: "p",
          text: "In known or suspected coarctation, the catheter measures the pressure gradient across the narrowing and the aortogram shows its size and site and any other aortic disease; Oxford usually images it in RAO. Oxford gives a gradient above 50 mmHg as an indication for intervention. The 2020 ESC adult congenital guideline uses a lower invasive threshold: repair is indicated in hypertensive patients whose non-invasive gradient is confirmed by an invasive peak-to-peak gradient of 20 mmHg or more. Use the current guideline.",
        },
        { kind: "tip", id: "diag-aortogram-setup" },
        { kind: "tip", id: "diag-aortogram-graft-roadmap" },
        { kind: "tip", id: "diag-aortogram-anomalous-origin" },
        {
          kind: "pitfalls",
          items: [
            "Grading regurgitation with the pigtail interfering with the leaflets.",
            "Spending a large contrast dose on a question echo or CT has already answered.",
            "Searching for grafts in a different projection from the road-map frame.",
            "Calling a graft occluded before every myocardial territory has a source of flow.",
            "Applying Oxford's 50 mmHg coarctation threshold without checking the current guideline.",
          ],
        },
        {
          kind: "pearl",
          text: "When a coronary will not engage and an anomalous origin is possible, Brilakis suggests an RAO projection instead of the more usual LAO for the aortogram or cusp injection.",
        },
        {
          kind: "list",
          items: [
            "**Anomalous origin (Brilakis 5.7.3.1):** cusp angiography or an aortogram, an RAO projection, then a catheter chosen to suit the ostium found (an AL is often needed); coronary CT angiography can clarify the anatomy.",
            "**Flush ostial occlusion (Brilakis 5.7.3.2):** engagement may be impossible; the occlusion can also be confirmed by collateral filling of that territory from another artery.",
            "**Oxford's catheter tips for anomalous coronaries:** there are no fixed rules, and aortography can show the ostium and proximal course. A vessel from the right sinus may take a JR4 but often needs an Amplatz (AL or AR); one from the left sinus may take a JL (occasionally an unusual size) or an AL. Multipurpose catheters can work but their aggressive angle of engagement risks dissection. Anomalies are taught in full in pm-interpreting.",
          ],
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the diagnostic cath lab, place a pigtail in the proximal ascending aorta clear of the leaflets and set an LAO projection for a root injection. (Scored aortogram injections and AR grading are requested from the lab build.)",
        },
        { kind: "video", id: "QzNawwbjU24", note: "Brilakis case 225: the aortogram." },
        {
          kind: "keypoints",
          items: [
            "Uses: AR grading, aortic disease, graft and anomalous ostia, valve angle before TAVI, the Prussian helmet before crossing a stenotic valve.",
            "Pigtail in the proximal ascending aorta, clear of the leaflets; aspirate before connecting the injector.",
            "Oxford: 40–60 mL at 20 mL/s, LAO, breath-hold; for grafts, higher position and longer acquisition.",
            "AR grade I–IV by LV density relative to the aorta; the grade also reflects LV function.",
            "Freeze the clearest LAO frame as the graft road map and engage in the same projection.",
            "Coarctation: Oxford's threshold is above 50 mmHg; the 2020 ESC guideline uses 20 mmHg peak-to-peak invasively in hypertensive patients.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-cardiac-catheterisation-q1",
      stem: "Which of these studies does Oxford list as needing simultaneous left and right heart catheterisation?",
      options: [
        "Assessment of suspected pericardial constriction",
        "Coronary angiography in stable angina",
        "Estimating cardiac output by thermodilution",
        "Measuring right heart pressures before a myocardial biopsy",
      ],
      answer: 0,
      explanation:
        "Oxford's simultaneous indications are shunts, mitral valve disease, suspected constriction, systemic and pulmonary resistance, and interventions, particularly in congenital heart disease. Thermodilution and right heart pressures need only the right side, and coronary angiography only the left.",
      difficulty: 1,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q2",
      stem: "From the femoral vein, a multipurpose catheter repeatedly bounces off the tricuspid annulus and will not enter the right ventricle. Which manoeuvre does Oxford describe first?",
      options: [
        "Exchange for a stiff 0.035 inch wire and cross the valve with the wire tip leading",
        "Curl the catheter into a loop within the right atrium and let it prolapse across the valve",
        "Ask the patient to cough repeatedly while advancing the catheter firmly",
        "Withdraw to the IVC and change to the internal jugular approach",
      ],
      answer: 1,
      explanation:
        "Oxford notes that the catheter often has to be looped within the atrium and prolapsed into the ventricle, the same move as for pacing leads; a soft J wire inside the catheter can stiffen it if needed. A stiff wire leading through the heart is not part of Oxford's sequence, and changing access discards a workable route.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q3",
      stem: "After a long and forceful passage, a right heart catheter will not withdraw freely and fluoroscopy suggests a knot in the RV. According to Oxford, what should you avoid?",
      options: [
        "Calling for an experienced colleague before trying anything",
        "Advancing the guidewire carefully to try to undo the knot",
        "Pulling the catheter tight before help has arrived",
        "Planning for snares, forceps or surgical removal if it will not undo",
      ],
      answer: 2,
      explanation:
        "Oxford's first instructions are to ask for expert help immediately and not to pull the catheter tight. Carefully advancing the wire occasionally undoes the knot; only if that fails is the knot deliberately tightened, brought to the sheath and removed with it, with snares, forceps or surgery as alternatives.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q4",
      stem: "A 79-year-old man has echo showing severe aortic stenosis (mean gradient 48 mmHg, area 0.7 cm²) that matches his symptoms. He is having coronary angiography before valve treatment. What does Oxford advise about crossing the valve?",
      options: [
        "Cross with a 5 F AL1 and straight hydrophilic wire to confirm the gradient, since invasive data are the reference",
        "Do not cross: the data rarely change management, crossing causes cerebral emboli, and echo is the standard here",
        "Cross with a pigtail stiffened by a J wire, which avoids the embolic risk of a straight wire",
        "Cross only if the ventriculogram is needed, as the LVEDP will guide fluid management",
      ],
      answer: 1,
      explanation:
        "Oxford reserves crossing a stenotic valve for a reason such as discordance between symptoms and non-invasive tests, or TAVI work-up, because attempts often produce emboli on brain MRI and the result rarely changes management. When crossing is needed, the 5 F AL1 and straight hydrophilic wire are the technique, not a justification. Critical aortic stenosis is also a relative contraindication to ventriculography.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q5",
      stem: "VO₂ 240 mL/min, haemoglobin 12 g/dL, aortic saturation 95%, PA saturation 65%, body surface area 2.0 m². What is the Fick cardiac index (using 1.36 mL O₂ per g)?",
      options: ["About 2.5 L/min/m²", "About 4.9 L/min/m²", "About 0.25 L/min/m²", "About 24.5 L/min/m²", "About 9.8 L/min/m²"],
      answer: 0,
      explanation:
        "Content difference = 1.36 × 12 × 0.30 = 4.90 mL/100 mL, or 49.0 mL/L. CO = 240 ÷ 49.0 = 4.9 L/min, and CI = 4.9 ÷ 2.0 ≈ 2.45 L/min/m². 4.9 is the output, not the index, and 9.8 multiplies the output by the body surface area instead of dividing. Leaving out the ×10 makes the answer ten times too large (about 24.5); 0.25 comes from multiplying by 100 instead of 10, which makes it ten times too small.",
      difficulty: 2,
      refs: [...OXFORD, "hanna-pcm"],
    },
    {
      id: "hb-cardiac-catheterisation-q6",
      stem: "Mean aortic pressure 90 mmHg, mean RA pressure 10 mmHg, cardiac output 3.2 L/min. What is the SVR and how does it compare with Oxford's normal range?",
      options: [
        "2000 dyn·s·cm⁻⁵, above the range, as expected in cardiogenic shock",
        "25 dyn·s·cm⁻⁵, at the bottom of the pulmonary range",
        "2250 dyn·s·cm⁻⁵, because the RA pressure is not subtracted",
        "1000 dyn·s·cm⁻⁵, within the range",
        "640 dyn·s·cm⁻⁵, below the range, as in sepsis",
      ],
      answer: 0,
      explanation:
        "SVR = 80 × (90 − 10) ÷ 3.2 = 2000 dyn·s·cm⁻⁵, above Oxford's 800–1400; Oxford notes SVR is typically raised in cardiogenic shock and low in sepsis. Forgetting to subtract RA pressure gives 2250; 25 dyn·s·cm⁻⁵ is the Wood-unit figure mislabelled.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q7",
      stem: "In a patient with an ASD: SVC 66%, IVC 74%, PA 85%, aorta 96%, no pulmonary venous sample. Using Oxford's method, what is Qp:Qs and how does Oxford describe it?",
      options: [
        "About 2.2, a large shunt",
        "About 2.0, on the threshold of a large shunt",
        "About 2.2, but still a small shunt by Oxford's thresholds",
        "About 0.85, no meaningful shunt",
        "About 2.5, a large shunt",
      ],
      answer: 0,
      explanation:
        "Mixed venous = (3 × 66 + 74) ÷ 4 = 68%. With 98% substituted for pulmonary venous blood, Qp:Qs = (96 − 68) ÷ (98 − 85) = 28 ÷ 13 ≈ 2.2, and Oxford calls a ratio over 2 a large shunt (under 1.5 small). Using the arterial 96% as the pulmonary venous value gives 28 ÷ 11 ≈ 2.5; weighting SVC and IVC equally gives 26 ÷ 13 = 2.0; using the PA as mixed venous blood gives 11 ÷ 13 ≈ 0.85, hiding the shunt because PA blood already contains it.",
      difficulty: 3,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q8",
      stem: "A patient with impaired LV function has an LVEDP of 27 mmHg and needs a ventriculogram because echo windows are poor. Which injection is in line with Oxford?",
      options: [
        "35 mL at 15 mL/s, the standard settings, so the run is diagnostic first time",
        "30 mL at 10 mL/s, reducing volume and rate because the LVEDP is above 25 mmHg",
        "50 mL at 20 mL/s, the settings for a root injection, to fill a large ventricle",
        "60 mL over 3 seconds by hand to control the delivery",
      ],
      answer: 1,
      explanation:
        "Oxford reduces volume and rate, for example to 30 mL at 10 mL/s, with impaired LV function or LVEDP above 25 mmHg. Oxford adds that pulmonary oedema is likely above 30 mmHg and advises avoiding the ventriculogram whenever the LVEDP is high, without giving a number; here the question cannot be answered by echo, so a reduced run is the Oxford-consistent choice. Standard settings ignore the warning; 40–60 mL at 20 mL/s is Oxford's aortogram dose, and 60 mL over 3 s is Brilakis's aortogram figure.",
      difficulty: 2,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q9",
      stem: "Which pair correctly matches a ventriculographic projection with the walls it shows best (Oxford)?",
      options: [
        "RAO 30°: septal and posterolateral walls",
        "LAO 60° cranial 20°: anterior, apical and inferior walls",
        "LAO 60° cranial 20°: septal and posterolateral walls, and VSDs",
        "AP: anterior wall and the mitral valve",
      ],
      answer: 2,
      explanation:
        "Oxford's LAO 60° cranial 20° view identifies the septal and posterolateral walls and localises VSDs. RAO 30° is the standard view for the anterior, apical and inferior walls (and MR). AP is the view Oxford uses for right ventriculography.",
      difficulty: 1,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q10",
      stem: "On an aortogram the left ventricle opacifies, but less densely than the aorta, and the pigtail is well clear of the leaflets in the proximal ascending aorta. How does Oxford grade the regurgitation?",
      options: ["Grade I", "Grade II", "Grade III", "Grade IV", "It cannot be graded on an aortogram"],
      answer: 1,
      explanation:
        "Oxford's grade II is LV opacification less than the aorta; grade I clears rapidly with each beat, grade III reaches the aortic density and grade IV exceeds it, often persisting. Grading is valid here because the catheter is not interfering with the leaflets.",
      difficulty: 1,
      refs: OXFORD,
    },
    {
      id: "hb-cardiac-catheterisation-q11",
      stem: "During PCI the arterial pressure falls to 70/40 mmHg. The connections are tight, the Y-connector is closed and the trace is not damped. A pulmonary artery catheter shows a wedge of 28 mmHg and an output of 2.6 L/min. Which group of causes does Brilakis's algorithm point to?",
      options: [
        "Hypovolaemia, such as bleeding into a groin haematoma",
        "Peripheral vasodilatation, such as a vasovagal reaction or nitrate",
        "Cardiac failure, for example from ischaemia or an Amplatz holding a cusp open",
        "False hypotension, which a right heart study cannot distinguish",
      ],
      answer: 2,
      explanation:
        "A high LV filling pressure with a low output is the cardiac failure pattern in Brilakis Fig 28.1; his causes include ischaemia, LV or RV failure, acute valve problems (an Amplatz or deeply curved EBU pushing a cusp open), tamponade and arrhythmias. Hypovolaemia lowers both filling pressure and output; vasodilatation lowers filling pressure with a high output. False hypotension has been excluded by the checks.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "hb-cardiac-catheterisation-q12",
      stem: "A 44-year-old with idiopathic PAH has a mean PA pressure of 46 mmHg and output 3.8 L/min. After inhaled nitric oxide the mean PA pressure is 38 mmHg and output 4.1 L/min. How is the test interpreted?",
      options: [
        "Positive: mean PA pressure fell to 40 mmHg or less with output maintained",
        "Negative: the fall is only 8 mmHg, short of the 10 mmHg required",
        "Positive, because output rose by more than 5%",
        "Uninterpretable, because Oxford does not recommend vasoreactivity testing",
      ],
      answer: 1,
      explanation:
        "The 2022 ESC/ERS criteria need both a fall of at least 10 mmHg and an absolute value of 40 mmHg or less, with output unchanged or higher. This patient reaches 38 mmHg but the fall is only 8 mmHg, so the test is negative. Neither manual covers vasoreactivity testing, but that does not make the result uninterpretable.",
      difficulty: 3,
      refs: ["esc-ph-2022"],
    },
  ],
  sims: [
    { sim: "haemo", task: "Run a combined right and left heart study from the femoral vein and artery: right heart pressures to the wedge at end-expiration, LV pressure and LVEDP, a Fick output, SVR and PVR." },
    { sim: "haemo", task: "Perform an oximetry run in a patient with an ASD, build the mixed venous saturation, calculate Qp:Qs and PVR." },
    { sim: "cathlab", task: "Cross the aortic valve with a pigtail using a shallow U-loop in RAO, read the LVEDP, then pull back to the aorta under pressure." },
  ],
  caseIds: ["hb-cardiac-catheterisation-case-asd", "hb-cardiac-catheterisation-case-lv-study"],
};

export const cases: CaseStudy[] = [
  {
    id: "hb-cardiac-catheterisation-case-asd",
    title: "A right heart study for an atrial septal defect",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook ch 4 (Equipment, Accessing the right heart, Right heart pressures and waveforms, Calculations) and ch 5 (Atrial septal defect); ch 3 (Femoral vein access); 2020 ESC ACHD and 2022 ESC/ERS PH guidelines.",
    },
    summary:
      "A breathless woman with a secundum ASD comes for a right heart study and shunt quantification before planned percutaneous closure: preparing the system, reaching the pulmonary artery from the femoral vein, sampling, calculating the shunt and resistance, and deciding on closure.",
    presentation:
      "A 46-year-old woman has 18 months of exertional breathlessness and palpitation. Transthoracic and transoesophageal echo show a secundum ASD with a dilated right ventricle. She is referred for a right heart study and shunt quantification; percutaneous closure is planned if the numbers support it.",
    findings: [
      "Sinus rhythm 78 bpm, BP 124/76 mmHg, oxygen saturation 97% on air",
      "Haemoglobin 13.5 g/dL; body surface area 1.7 m²",
      "Echo: secundum ASD with left-to-right flow, dilated RV, estimated PA systolic pressure mildly raised",
      "Right femoral venous access with a 6 F sheath under local anaesthetic",
    ],
    steps: [
      {
        id: "s1",
        prompt: "The multipurpose catheter is on the table. How do you prepare it?",
        options: [
          {
            text: "Flush the catheter and manifold thoroughly, check the manifold for air, zero at mid-chest, and connect to pressure before inserting",
            best: true,
            feedback:
              "Oxford asks for the catheter to be flushed well before insertion and connected to the pressure trace so the waveform shows where the tip is; air in the manifold can embolise, so check it yourself before the first injection or sample.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Insert it dry to save time and flush once the tip is in the right atrium",
            feedback:
              "A dry catheter carries air into the venous circulation, and with an atrial defect the patient has a communication between the circulations. It also leaves you navigating without a waveform. Oxford's order is flush, connect, then insert.",
            next: "s1-air",
            stateDelta: { stability: -10, flags: ["air-risk"] },
          },
          {
            text: "Flush and insert it, and connect to pressure only when you reach the pulmonary artery",
            acceptable: true,
            feedback: "Flushing is right, but Oxford connects to pressure from the start: the trace confirms each chamber as you pass through it.",
          },
        ],
      },
      {
        id: "s1-air",
        kind: "consequence",
        prompt: "As you flush in the right atrium, small bubbles are seen leaving the catheter tip. The patient is comfortable and the ECG is unchanged. What now?",
        info: "Saturation 97%, BP 120/74 mmHg, sinus rhythm.",
        options: [
          {
            text: "Stop, aspirate the catheter until blood returns without bubbles, flush the manifold properly, and only then continue",
            best: true,
            feedback: "Clearing the catheter and manifold of air before anything else is the fix; Oxford's equipment section is clear that air in the system may embolise during injections.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Carry on: small venous bubbles are filtered by the lungs",
            feedback:
              "Not safely in this patient: an atrial defect connects the two sides of the heart. Clear the air before you go on.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "From the femoral vein the catheter reaches the right atrium, but every push sends the tip into the hepatic veins or bounces it off the tricuspid annulus. What is your next manoeuvre?",
        options: [
          {
            text: "Form a loop in the right atrium and let it prolapse across the tricuspid valve, withdrawing and rotating to line up the tip; a soft J wire inside can stiffen it",
            best: true,
            feedback:
              "This is Oxford's difficult right heart sequence: a loop in the RA prolapses across the valve as with pacing leads, gentle withdrawal and rotation bring the tip into line, and a soft J wire stiffens the catheter.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Push harder and keep probing until the catheter goes through",
            feedback:
              "Forceful manipulation is what Oxford links to ventricular arrhythmias and, with time, to knotting. Change the technique, not the force.",
            next: "s2-vt",
            stateDelta: { stability: -15, flags: ["vigorous-manipulation"] },
          },
          {
            text: "Abandon the femoral route and puncture the internal jugular vein",
            acceptable: true,
            feedback:
              "The jugular route suits PA catheterisation, but the femoral route is Oxford's usual one for this study and the loop technique usually works. Try it before adding a second puncture.",
          },
        ],
      },
      {
        id: "s2-vt",
        kind: "consequence",
        prompt: "The catheter suddenly enters the RV outflow tract and the monitor shows a run of broad-complex tachycardia; the catheter then feels fixed and does not respond to rotation.",
        info: "Runs of VT, self-terminating; BP 108/70 mmHg between runs. Fluoroscopy: a tight loop of catheter in the RV.",
        options: [
          {
            text: "Stop manipulating, ask for an experienced colleague at once, do not pull the catheter tight, and try to undo the knot by carefully advancing the wire",
            best: true,
            feedback:
              "Oxford's knot advice: expert help immediately, never pull tight, try to undo it with the wire; if it will not undo, tighten it deliberately, bring it to the sheath and remove the whole system, with snares, forceps or surgery as alternatives. Stopping the manipulation also removes the trigger for the VT; if VT persisted, Oxford's complications chapter calls for synchronised cardioversion when it is poorly tolerated, or an IV beta-blocker or amiodarone when it is tolerated.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull firmly to straighten the catheter back to the sheath",
            feedback:
              "Pulling a possible knot tight before help arrives is exactly what Oxford warns against; it can make the knot permanent and injure the vein.",
            stateDelta: { stability: -15, flags: ["knot-tightened"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The catheter is now at the RV apex, provoking ectopics. How do you reach the pulmonary artery?",
        options: [
          {
            text: "Withdraw gently off the apex, rotate the tip to point cranially and advance into the main PA, asking for a deep breath",
            best: true,
            feedback:
              "Oxford's route to the PA: away from the apex, tip turned towards the head, then advance; a deep breath helps carry the catheter into the PA, and a wire helps if needed.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance further into the apex until the catheter buckles up into the outflow tract",
            feedback: "Pushing into the apex provokes ectopics and VT and rarely delivers the tip to the outflow tract. Come back first.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "Pressures: RA mean 6, RV 34/8, PA 34/14 (mean 22), wedge mean 9 mmHg. Which samples do you take for the shunt calculation?",
        info: "The catheter crosses the defect easily into the left atrium.",
        options: [
          {
            text: "SVC, IVC, PA and aorta, plus a left atrial sample through the defect, with duplicates where values matter",
            best: true,
            feedback:
              "Oxford's minimum is SVC, IVC, PA and aorta, and the ASD study includes an attempt to cross the defect for a left atrial saturation. A measured LA value is better than assuming 98%, and duplicates are a sensible guard against the streaming and positioning errors Oxford warns about.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A single right atrial sample as mixed venous blood, with the PA and aortic samples",
            feedback:
              "In an atrial shunt the RA is where oxygenated blood arrives, so it cannot stand for mixed venous blood; Oxford also names streaming as a source of sampling error.",
            next: "s4-ra",
            stateDelta: { stability: -5, flags: ["ra-as-mixed-venous"] },
          },
          {
            text: "PA and aorta only, using the PA as mixed venous blood",
            feedback:
              "The PA lies downstream of the shunt, so its saturation is raised by it; it is the pulmonary arterial value in the denominator, not mixed venous blood.",
            next: "s4-pa",
            stateDelta: { stability: -5, flags: ["pa-as-mixed-venous"] },
          },
        ],
      },
      {
        id: "s4-ra",
        kind: "consequence",
        prompt: "Your calculation gives a Qp:Qs of about 1.0, which does not fit the dilated RV on echo. What went wrong?",
        info: "Saturations obtained: RA 84%, PA 85%, aorta 97%; 98% assumed for pulmonary venous blood. (97 − 84) ÷ (98 − 85) = 1.0.",
        options: [
          {
            text: "The mixed venous value came from blood already enriched by the shunt; go back for SVC and IVC samples and build it as (3 × SVC + IVC) ÷ 4",
            best: true,
            feedback:
              "Using shunted blood as the mixed venous value removes the step-up from the numerator. Oxford's weighted SVC and IVC value is built for exactly this situation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Accept it: the shunt is trivial and the echo overestimated it",
            feedback: "A result that contradicts a dilated RV should make you check the method, not discard the echo.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4-pa",
        kind: "consequence",
        prompt: "Your calculation gives a Qp:Qs of about 0.9, which suggests no left-to-right shunt at all in a patient with a dilated RV and a secundum ASD. What went wrong?",
        info: "Saturations obtained: PA 85%, aorta 97%; 98% assumed for pulmonary venous blood. (97 − 85) ÷ (98 − 85) ≈ 0.9.",
        options: [
          {
            text: "PA blood has already received the shunt, so it cannot be mixed venous blood; take SVC and IVC samples and use (3 × SVC + IVC) ÷ 4",
            best: true,
            feedback:
              "The PA sits downstream of an atrial shunt and carries the step-up, so using it as mixed venous blood cancels the shunt out. Oxford's weighted caval value avoids this.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Report no significant shunt and cancel the closure",
            feedback: "The number contradicts the anatomy; check the sampling before acting on it.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Saturations: SVC 70%, IVC 78%, PA 85%, LA 98%, aorta 97%. What is Qp:Qs?",
        options: [
          {
            text: "Mixed venous (3 × 70 + 78) ÷ 4 = 72%; Qp:Qs = (97 − 72) ÷ (98 − 85) = 1.9",
            best: true,
            feedback:
              "Correct. By Oxford's thresholds this is between small (below 1.5) and large (above 2), towards the large end; the closure decision also weighs RV volume load and resistance.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Mixed venous (70 + 78) ÷ 2 = 74%; Qp:Qs = (97 − 74) ÷ (98 − 85) = 1.8",
            acceptable: true,
            feedback: "Close, but SVC blood is weighted three times because its saturation is lower; Oxford's formula is (3 × SVC + IVC) ÷ 4, which gives 72% and a ratio of 1.9.",
          },
          {
            text: "Qp:Qs = (98 − 85) ÷ (97 − 72) = 0.5, a right-to-left shunt",
            feedback: "The fraction is upside down: the systemic arteriovenous difference goes on top and the pulmonary one underneath.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "With measured oxygen consumption, Fick pulmonary flow (Qp) is 7.7 L/min. Mean PA pressure is 22 mmHg and the wedge 9 mmHg. What is the PVR and what does it mean for closure?",
        options: [
          {
            text: "PVR = (22 − 9) ÷ 7.7 ≈ 1.7 Wood units; with RV volume overload and PVR below 3 Wood units, closure is recommended",
            best: true,
            feedback:
              "Resistance in a shunt uses pulmonary flow, because Oxford defines resistance as pressure drop over the flow passing through a circulation, and the flow passing through the lungs is Qp. The 2020 ESC adult congenital guideline recommends ASD closure with RV volume overload and PVR below 3 Wood units regardless of symptoms. Note the mean PA pressure of 22 mmHg is above 20 with a wedge of 15 or less and PVR of 2 or less: the 2022 ESC/ERS category is unclassified pulmonary hypertension, the pattern of high pulmonary flow rather than raised resistance.",
            stateDelta: { stability: 5 },
          },
          {
            text: "PVR = 22 ÷ 7.7 ≈ 2.9 Wood units; close to 3, so closure is doubtful",
            feedback: "The wedge must be subtracted: PVR uses the pressure drop across the lungs. The real value is about 1.7 Wood units.",
            stateDelta: { stability: -5 },
          },
          {
            text: "PVR cannot be calculated in a shunt, so refer for MRI instead",
            feedback: "It can, using pulmonary flow (Qp) as the denominator, and it is one of the main numbers the closure decision depends on.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The right heart study showed a Qp:Qs of 1.9 with a PVR of about 1.7 Wood units and a dilated RV. The defect was closed percutaneously under transoesophageal guidance, and her breathlessness improved over the following months.",
    outcomeVariants: [
      { flag: "knot-tightened", text: "The tightened knot had to be withdrawn with the sheath; the femoral vein needed surgical repair, and the study was completed from the jugular vein a week later." },
      { flag: "ra-as-mixed-venous", text: "The first shunt calculation was wrong because right atrial blood, already enriched by the shunt, was used as mixed venous blood; it was repeated with SVC and IVC samples." },
      { flag: "pa-as-mixed-venous", text: "The first shunt calculation was wrong because pulmonary arterial blood, downstream of the shunt, was used as mixed venous blood; it was repeated with SVC and IVC samples." },
    ],
    learningPoints: [
      "Flush and connect the catheter to pressure before insertion, and check the manifold for air.",
      "From the femoral vein, an RA loop prolapses the catheter across the tricuspid valve; change technique, not force.",
      "For a suspected knot: expert help, do not pull tight, try a wire.",
      "Reach the PA by coming off the apex and pointing the tip cranially; use the patient's breathing.",
      "Mixed venous = (3 × SVC + IVC) ÷ 4; never use RA or PA blood in an atrial shunt.",
      "Calculate PVR with pulmonary flow; closure decisions weigh Qp:Qs, RV volume load and PVR.",
    ],
    refs: [...OXFORD, "esc-achd-2020", "esc-ph-2022"],
  },
  {
    id: "hb-cardiac-catheterisation-case-lv-study",
    title: "A ventriculogram in a breathless patient",
    trackId: "cath-handbook",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Oxford Handbook ch 4 (Accessing the left heart, Left heart pressures and waveforms, Ventriculography) and ch 5 (Mitral regurgitation), ch 10 (Pulmonary oedema, Cardiac tamponade, Vasovagal reaction); Brilakis 14.4.",
    },
    summary:
      "A diagnostic study with a ventriculogram in a man with poor echo windows: crossing a difficult valve, deciding on the injection after the LVEDP, positioning the pigtail, reading wall motion and MR, and finishing safely.",
    presentation:
      "A 67-year-old man with exertional chest tightness and breathlessness has transthoracic images too poor to assess LV function; the aortic valve opened normally on the views obtained, with no gradient. Coronary angiography from the right femoral artery shows an occluded RCA. A ventriculogram is requested to assess LV function and mitral regurgitation.",
    findings: [
      "Sinus rhythm 72 bpm, BP 138/80 mmHg, oxygen saturation 96% on air",
      "Creatinine normal; 70 mL of contrast used so far",
      "6 F pigtail in the aortic root over a 0.035 inch J wire",
      "Echo: technically poor; aortic valve opens normally, no gradient",
    ],
    steps: [
      {
        id: "s1",
        prompt: "In RAO the pigtail forms a U-loop against the valve but will not drop through after several attempts. What next?",
        options: [
          {
            text: "Having confirmed no aortic stenosis, reinsert the J wire to stiffen the pigtail and try again; if that fails, lead with the wire",
            best: true,
            feedback:
              "Oxford's order: check for aortic stenosis (done: the echo valve was normal), stiffen the catheter with the wire, then lead with the wire using the catheter tip to aim. Brilakis describes the same 0.035 inch J wire stiffening of a pigtail when placing an Impella across a stenotic valve.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pushing the pigtail harder against the valve",
            feedback: "More force on the same approach does not help and risks the valve and root. Change the catheter's stiffness or lead with the wire.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Change straight away to an AL1 and a straight hydrophilic wire",
            acceptable: true,
            feedback:
              "An Amplatz with a straight wire is in Oxford's list, but later: the simpler steps of stiffening the pigtail and leading with the J wire come first, and the AL1 then needs an exchange back to a pigtail.",
          },
        ],
      },
      {
        id: "s2",
        prompt: "The pigtail is in the LV. The trace shows LV pressure 142/26 mmHg, with the end-diastolic value read just after the a wave. He lies flat comfortably, his chest is clear and his saturation is unchanged; the referring team needs LV function and MR now, and a contrast echo has already failed to give usable images. What injection do you plan?",
        options: [
          {
            text: "A reduced injection, for example 30 mL at 10 mL/s, because the LVEDP is above 25 mmHg, watching him closely for breathlessness",
            best: true,
            feedback:
              "Oxford reduces volume and rate with an LVEDP above 25 mmHg (its example is 30 mL at 10 mL/s). It also advises avoiding ventriculography whenever the LVEDP is high, and treats pulmonary oedema as a relative contraindication; with no oedema, no orthopnoea and a question that echo has not answered, a reduced run is the reasonable reading. Had he been breathless lying flat, or the LVEDP near or above 30 mmHg, omitting the ventriculogram would be the safer choice.",
            stateDelta: { stability: 5 },
          },
          {
            text: "The standard 35 mL at 15 mL/s, to make sure the run is diagnostic",
            feedback: "With an LVEDP of 26 mmHg the standard dose ignores Oxford's advice to reduce the injection above 25 mmHg and adds to a filling pressure that is already raised.",
            next: "s2-oedema",
            stateDelta: { stability: -15, flags: ["oedema"] },
          },
          {
            text: "Omit the ventriculogram and leave LV function and MR unassessed for now",
            acceptable: true,
            feedback:
              "Safe, and in line with Oxford's advice to avoid ventriculography when the LVEDP is high; it would be the better choice in a breathless patient. Here, though, echo has already failed and the question is needed now, so Oxford's reduced injection answers it at a modest contrast cost.",
          },
        ],
      },
      {
        id: "s2-oedema",
        kind: "consequence",
        prompt: "Two minutes after the run he is coughing and more breathless; saturation falls to 89%.",
        info: "BP 150/88 mmHg, heart rate 96 bpm, crackles at both bases.",
        options: [
          {
            text: "High-flow oxygen, sit him up, stop further contrast, give an IV loop diuretic and IV nitrates (his systolic pressure is above 100 mmHg), and escalate to CPAP if needed",
            best: true,
            feedback:
              "Oxford's sequence for pulmonary oedema in the lab: high-flow oxygen; sit the patient up if possible; an IV loop diuretic (its example is furosemide 80–100 mg); an IV nitrate infusion if systolic pressure is above 100 mmHg (example isosorbide dinitrate 2–10 mg/h); CPAP, which can be very effective; consider an intra-aortic balloon pump; and admit for close monitoring. Doses are typical examples; follow local protocol. The usual cause is a large contrast load in patients with LV impairment, a raised LVEDP, severe aortic or mitral stenosis, or dialysis-dependent renal failure.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Repeat the ventriculogram, as the first run was disturbed by coughing",
            feedback: "More contrast is the cause, not the cure.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "As you prepare the injector, the pigtail drifts to the apex and triggers runs of ectopics. What do you do?",
        options: [
          {
            text: "Withdraw gently to the mid-cavity, clear of the apex and mitral apparatus, confirm quiet rhythm, and connect the injector letting contrast run out to exclude air",
            best: true,
            feedback:
              "Oxford's mid-cavity position minimises ectopy and keeps the catheter off the mitral apparatus; connecting while contrast runs out slowly keeps air out of the system.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject anyway; the ectopics will settle during the run",
            feedback: "Oxford asks you to exclude MR produced by ectopics before reporting it and to reposition an apical catheter that provokes ectopy; an injection against the wall can also stain the myocardium. Reposition first.",
            next: "s3-stain",
            stateDelta: { stability: -15, flags: ["stain"] },
          },
        ],
      },
      {
        id: "s3-stain",
        kind: "consequence",
        prompt: "The run shows a persistent blush of contrast in the apical wall. Ten minutes later his blood pressure falls to 84/56 mmHg with a heart rate of 112 bpm.",
        info: "He feels faint. The heart border on fluoroscopy moves less than before.",
        options: [
          {
            text: "Suspect tamponade from intramyocardial injection: echo now, and pericardiocentesis if it confirms an effusion or he deteriorates, with a review of his anticoagulation",
            best: true,
            feedback:
              "Oxford lists ventriculography with intramyocardial injection among the causes of tamponade; contrast may be seen collecting in the pericardial space. Echo confirms it, but with high clinical suspicion pericardiocentesis should not wait. Leave the drain in until the bleeding stops (this may take days), think about anticoagulation (consider reversing heparin with protamine, and giving platelets and clotting factors), and treat the cause.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Treat as a vasovagal reaction with atropine and fluids, and continue",
            feedback: "Oxford warns that tamponade can present like a vasovagal reaction and just as fast, but usually with a tachycardia, whereas in a vasovagal reaction the heart rate typically slows first. After a myocardial stain, tamponade has to be excluded first, by immediate echo if in doubt.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The RAO run shows an akinetic inferior wall, otherwise normal contraction, and contrast entering the left atrium that clears rapidly with each beat, on clean sinus beats with the catheter clear of the mitral valve. How do you report it?",
        options: [
          {
            text: "Inferior akinesis, consistent with the occluded RCA; grade I mitral regurgitation",
            best: true,
            feedback:
              "RAO 30° shows the anterior, apical and inferior walls. Minimal regurgitation clearing with each beat is Oxford's grade I, and the conditions for a valid grade (clean beats, catheter clear) are met.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inferior dyskinesis and grade III mitral regurgitation",
            feedback: "Dyskinesis is paradoxical outward movement, not absent movement; grade III means the left atrium becomes as dense as the ventricle.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Septal akinesis; the septum is best seen in RAO",
            feedback: "The septum is profiled in LAO 60° cranial 20°, not RAO; the wall described is inferior.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "How do you finish the left heart part of the study?",
        options: [
          {
            text: "Reconnect to pressure without air, record a pullback from LV to aorta, then remove the pigtail over the wire",
            best: true,
            feedback: "Oxford's sequence: back to pressure, pull back while recording to estimate any outflow gradient, and remove the catheter over the guidewire.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull the pigtail straight out without recording, as the valve was normal on echo",
            feedback: "Two steps are missing. Oxford records a pullback from LV to aorta once the pressure is being recorded (the echo was technically poor, so this is the moment to look for a gradient), and then removes the catheter over the guidewire.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The ventriculogram showed inferior akinesis with otherwise good function and trivial mitral regurgitation; there was no gradient on pullback. He was discussed for treatment of the occluded RCA.",
    outcomeVariants: [
      { flag: "oedema", text: "The standard-dose ventriculogram precipitated pulmonary oedema, which settled with oxygen, sitting up, an IV diuretic and nitrates; he was admitted for monitoring." },
      { flag: "stain", text: "An apical myocardial stain caused tamponade; echo confirmed the effusion, pericardiocentesis restored his blood pressure, and the drain stayed in until the bleeding stopped." },
    ],
    learningPoints: [
      "Difficult valve: check for stenosis, stiffen the pigtail with the wire, then lead with the wire.",
      "Read LVEDP just after the a wave. Above 25 mmHg, reduce the injection (Oxford p.119); Oxford also advises avoiding the ventriculogram when the LVEDP is high (p.110), so omit it if echo can answer the question, if the patient is breathless or in pulmonary oedema, or if the LVEDP is near 30 mmHg.",
      "Inject from the mid-cavity, clear of the apex and mitral apparatus, with no air in the line.",
      "Grade MR only on clean beats with the catheter clear of the valve.",
      "A myocardial stain followed by hypotension and tachycardia is tamponade until echo says otherwise.",
      "Finish with a pressure pullback and remove the catheter over the wire.",
    ],
    refs: BOOKS,
  },
];

export const tips: LabTip[] = [
  {
    id: "haemo-setup-manifold-check",
    lab: "haemo",
    when: { phase: ["setup"] },
    title: "Check the manifold for air yourself",
    text: "Flush every port of the manifold until no bubble remains, zero with the distal port open to air at mid-chest, and inspect a manifold an assistant prepared before you inject or sample through it. Air left in the system can embolise.",
    tone: "caution",
    lessonId: "hb-cardiac-catheterisation-setup",
    sources: [O("ch 4: Equipment")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-flush-and-watch",
    lab: "haemo",
    when: { phase: ["right-heart"] },
    title: "Flush and connect before the catheter goes in",
    text: "Flush the right heart catheter well and connect it to the pressure trace before inserting it. Then steer by the waveform: it tells you when the tip is in the atrium, the ventricle, the pulmonary artery and the wedge.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-femoral-side-branch",
    lab: "haemo",
    when: { phase: ["right-heart"], event: ["engage-fail"] },
    title: "Caught in a vein below the heart: back off and turn",
    text: "From the femoral vein the tip can lodge in a venous side branch. Withdraw it slightly and rotate it under fluoroscopy until it runs freely up into the right atrium.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-ra-loop",
    lab: "haemo",
    when: { phase: ["right-heart"], event: ["engage-fail"] },
    title: "Will not enter the RV: make a loop in the atrium",
    text: "Curl the catheter into a loop within the right atrium and let it prolapse across the tricuspid valve, as for a pacing lead; withdraw and rotate to line up the tip. A soft J wire inside the catheter stiffens it and adds torque.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-apex-to-pa",
    lab: "haemo",
    when: { phase: ["right-heart"] },
    title: "From the RV apex to the PA: back, up, forward",
    text: "Pull the catheter gently back off the RV apex, rotate the tip until it points cranially, then advance into the main pulmonary artery. Forceful work in the ventricle provokes ectopics and VT, especially in the outflow tract.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart"), O("ch 10: Ventricular tachycardia")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-wedge-inspiration",
    lab: "haemo",
    when: { phase: ["right-heart"] },
    title: "Wedge on a breath in",
    text: "Advance the catheter while the patient breathes in until you feel gentle resistance and the wedge trace appears. A deep breath also helps the catheter into the pulmonary artery and gives a cleaner wedge.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-rhc-knot",
    lab: "haemo",
    when: { phase: ["right-heart"], event: ["catheter-kink"] },
    title: "Possible knot: get help, do not pull tight",
    text: "Knots follow vigorous, prolonged manipulation. If you suspect one, call an experienced operator and do not pull the catheter tight; carefully advancing the guidewire occasionally undoes it. If it will not undo, the knot is tightened, brought to the sheath and removed with it, or retrieved with a snare, forceps or surgery.",
    tone: "bailout",
    lessonId: "hb-cardiac-catheterisation-rhc",
    sources: [O("ch 4: Accessing the right heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-lhc-u-loop",
    lab: "haemo",
    when: { phase: ["left-heart"] },
    alsoIn: [{ lab: "diagnostic", phase: ["lv-aorta"] }],
    title: "Crossing a normal aortic valve: a shallow U",
    text: "With the pigtail just above the valve and the wire out, image in AP or RAO and push so the catheter curls into a shallow U against the valve; gentle forward pressure usually drops it into the ventricle.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lhc",
    sources: [O("ch 4: Accessing the left heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-lhc-difficult-valve",
    lab: "haemo",
    when: { phase: ["left-heart"], event: ["engage-fail"] },
    alsoIn: [{ lab: "diagnostic", phase: ["lv-aorta"] }],
    title: "Difficult aortic valve: the sequence",
    text: "First confirm there is no significant aortic stenosis. Then stiffen the catheter with the wire, lead with the wire aimed by the catheter tip, switch to a JR4 or AL to direct it, and try a straight or hydrophilic wire. Exchange to a pigtail over a long wire if a ventriculogram is planned.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lhc",
    sources: [O("ch 4: Accessing the left heart")],
    refs: OXFORD,
  },
  {
    id: "haemo-lhc-stenotic-valve",
    lab: "haemo",
    when: { phase: ["valves"] },
    alsoIn: [{ lab: "diagnostic", phase: ["lv-aorta"] }],
    title: "Severe aortic stenosis: cross only with a reason",
    text: "Crossing a stenotic valve causes cerebral emboli and rarely changes management; echo is the standard. Cross only when the non-invasive data are inconclusive or discordant with symptoms (Oxford also lists TAVI work-up); then use a 5 F AL1 with a straight hydrophilic wire under strict control, aim at the opening shown by the aortogram, and exchange to a pigtail over an exchange-length J wire.",
    tone: "caution",
    lessonId: "hb-cardiac-catheterisation-lhc",
    sources: [O("ch 5: Aortic stenosis")],
    refs: [...OXFORD, "omran-aortic-crossing-emboli-2003"],
  },
  {
    id: "haemo-lhc-lvedp-point",
    lab: "haemo",
    when: { phase: ["left-heart"], pressure: ["lv"] },
    title: "Read LVEDP after the a wave",
    text: "Measure the LVEDP at end-diastole, just after the a wave, at the R wave of the ECG, not at the early diastolic dip. Normal is 3–12 mmHg; above 30 mmHg pulmonary oedema is likely.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lhc",
    sources: [O("ch 4: Left heart pressures and waveforms")],
    refs: OXFORD,
  },
  {
    id: "haemo-co-say-how",
    lab: "haemo",
    when: { phase: ["calculations"] },
    title: "Say how the output was obtained",
    text: "Report whether output came from thermodilution, measured-VO₂ Fick or indirect Fick with an assumed VO₂; an assumed value carries its error into every resistance calculated from it. In Fick, remember the ×10 that turns mL/100 mL into mL/L.",
    tone: "caution",
    lessonId: "hb-cardiac-catheterisation-output",
    sources: [O("ch 4: Calculations")],
    refs: OXFORD,
  },
  {
    id: "haemo-co-index-it",
    lab: "haemo",
    when: { phase: ["calculations"] },
    title: "Index the output before you compare it",
    text: "Divide cardiac output by body surface area before judging it. Oxford's typical cardiac index is 2.5–3.5 L/min/m²; shock criteria are written as an index too.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-output",
    sources: [O("ch 4: Calculations"), B("24.2")],
    refs: BOOKS,
  },
  {
    id: "haemo-pvr-right-pressures",
    lab: "haemo",
    when: { phase: ["calculations"] },
    title: "Subtract the right downstream pressure",
    text: "SVR uses mean aortic minus mean RA pressure; PVR uses mean PA minus mean LA pressure or wedge. Divide by output for Wood units and multiply by 80 for dyn·s·cm⁻⁵. In a shunt the flow through the lungs is Qp, so PVR uses pulmonary flow (this follows from defining resistance as gradient ÷ flow through the bed).",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-resistance",
    sources: [O("ch 4: Calculations")],
    refs: OXFORD,
  },
  {
    id: "haemo-hypotension-pattern",
    lab: "haemo",
    when: { phase: ["right-heart", "calculations"], event: ["hypotension"] },
    title: "Low pressure: false reading first, then the pattern",
    text: "Check the Y-connector, connections, damping and bulky equipment first. If air, thrombus or contrast obstructs the catheter, aspirate it; if aspiration fails, remove the catheter without injecting. If the hypotension is real: low filling pressure and low output suggests hypovolaemia, high filling and low output cardiac failure, low filling and high output vasodilatation.",
    tone: "bailout",
    lessonId: "hb-cardiac-catheterisation-resistance",
    sources: [B("28.1"), O("ch 4: Calculations")],
    refs: BOOKS,
  },
  {
    id: "haemo-shunt-mixed-venous",
    lab: "haemo",
    when: { phase: ["shunts"] },
    title: "Build the mixed venous value from both cavae",
    text: "Take SVC, IVC, PA and aortic samples and calculate mixed venous saturation as (3 × SVC + IVC) ÷ 4; never use RA blood in an atrial shunt. Qp:Qs = (Ao − MV) ÷ (PV − PA), using 98% if no pulmonary venous sample. Oxford names streaming and catheter position as the sources of error.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-shunts",
    sources: [O("ch 4: Calculations")],
    refs: OXFORD,
  },
  {
    id: "haemo-shunt-asd-cross",
    lab: "haemo",
    when: { phase: ["shunts"] },
    title: "In an ASD study, cross the defect",
    text: "After the right heart pressures and pullback, try to pass the catheter through the defect and take a left atrial saturation, quantify the shunt, and remember that excluding anomalous pulmonary venous drainage is one of the aims of the study.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-shunts",
    sources: [O("ch 5: Atrial septal defect")],
    refs: OXFORD,
  },
  {
    id: "haemo-shunt-vsd-simultaneous",
    lab: "haemo",
    when: { phase: ["shunts"] },
    title: "VSD: simultaneous LV and RV pressures",
    text: "Record LV and RV pressures at the same time to measure the gradient across the defect, quantify the shunt by oximetry, and show the defect with an LAO cranial ventriculogram.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-shunts",
    sources: [O("ch 5: Ventricular septal defect")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-mid-cavity",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"] },
    title: "Pigtail in the mid-cavity before you inject",
    text: "Position the loop in the mid-cavity, where it provokes the fewest ectopics and stays off the mitral apparatus. If it triggers ectopy at the apex, withdraw it gently and reposition; move carefully if an aneurysm with thrombus is possible.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-injector",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"] },
    title: "Ventriculogram settings and the air check",
    text: "Usual volume 30–35 mL, delivered at 10–15 mL/s; reduce volume and rate (for example 30 mL at 10 mL/s) with poor LV function or LVEDP above 25 mmHg. Let contrast run from the injector line as you connect, tighten every connection, and warn the patient about the hot flush.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-test-injection",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], event: ["catheter-too-deep"] },
    title: "Unsure of the tip position? Test by hand",
    text: "If the tip may be against the wall or in an aneurysm, hand-inject 10 mL first. Injecting into the myocardium can stain the wall and occasionally causes tamponade.",
    tone: "caution",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography"), O("ch 10: Cardiac tamponade")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-papillary",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"], event: ["catheter-kink"] },
    title: "Pigtail caught in the papillary muscles",
    text: "If the pigtail will not move freely in the ventricle, it may be caught in the papillary muscles. Rotate it gently one way or the other and withdraw; this usually frees it.",
    tone: "bailout",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-clean-cycle",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"] },
    title: "Keep acquiring until a clean beat",
    text: "Ectopics are common as the injection starts. Keep acquiring until an ectopic-free cycle is recorded, and do not grade mitral regurgitation from ectopic beats or with the catheter on the mitral apparatus.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography"), O("ch 5: Mitral regurgitation")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-gram-views",
    lab: "diagnostic",
    when: { phase: ["lv-aorta", "views"] },
    title: "Which ventriculogram view for which wall",
    text: "RAO 30° shows the anterior, apical and inferior walls and, panned to the left atrium, mitral regurgitation. LAO 60° with 20° cranial shows the septum and posterolateral wall and localises a VSD.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "diag-lv-pullback-over-wire",
    lab: "diagnostic",
    when: { phase: ["lv-aorta", "exchange"], catheter: ["PIG"] },
    title: "Pull back under pressure, out over the wire",
    text: "After the run, reconnect to pressure without letting air in, record a pullback from LV to aorta to estimate any outflow gradient, then remove the catheter over the guidewire.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-lv-gram",
    sources: [O("ch 4: Ventriculography")],
    refs: OXFORD,
  },
  {
    id: "diag-aortogram-setup",
    lab: "diagnostic",
    when: { phase: ["lv-aorta"], catheter: ["PIG"], engagement: ["ascending-aorta"] },
    title: "Root injection: clear of the leaflets",
    text: "Place the pigtail in the proximal ascending aorta where it does not interfere with leaflet opening or closing (Oxford); a catheter holding a leaflet can be expected to create or exaggerate regurgitation (author's reasoning). Remove the wire, aspirate, connect the injector and give 40–60 mL at 20 mL/s in LAO during a breath-hold.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-aortography",
    sources: [O("ch 4: Aortography")],
    refs: OXFORD,
  },
  {
    id: "diag-aortogram-graft-roadmap",
    lab: "diagnostic",
    when: { phase: ["engage-graft"], event: ["graft-not-found"] },
    title: "Graft not found: aortogram as a road map",
    text: "Take an LAO aortogram with the pigtail higher in the aorta and a long acquisition, freeze the clearest frame, and engage the grafts in the same projection using sternal wires and ribs as landmarks. Keep searching until every territory has a source of flow.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-aortography",
    sources: [O("ch 7: Aortography"), O("ch 4: Aortography"), B("18.5")],
    refs: BOOKS,
  },
  {
    id: "diag-aortogram-anomalous-origin",
    lab: "diagnostic",
    when: { event: ["anomalous-origin", "engage-fail"], phase: ["engage-left", "engage-right"] },
    title: "Cannot find the ostium: cusp injection or aortogram",
    text: "If the ostium's position is not understood, a non-selective cusp injection or an aortogram (about 60 mL over 3 seconds through a pigtail) can show an anomalous origin or a flush occlusion; try RAO as well as LAO, then choose a catheter that suits the origin.",
    tone: "do",
    lessonId: "hb-cardiac-catheterisation-aortography",
    sources: [B("5.7"), O("ch 6: Unusual coronary anatomy")],
    refs: BOOKS,
  },
];

export const refs: Reference[] = [
  {
    id: "ghadri-takotsubo-consensus-2018",
    kind: "guideline",
    citation:
      "Ghadri JR, Wittstein IS, Prasad A, et al. International Expert Consensus Document on Takotsubo Syndrome (Part I): Clinical Characteristics, Diagnostic Criteria, and Pathophysiology. Eur Heart J. 2018;39(22):2032–2046.",
    url: "https://doi.org/10.1093/eurheartj/ehy076",
    note: "PMID: 29850871; PMCID: PMC5991216. Checked on PubMed: authors, title, journal, year, volume 39, issue 22, pages 2032–2046; full text read in PMC. Used for: four major types (apical, midventricular, basal, focal); concomitant coronary disease reported in 10–29% and not an exclusion criterion; wall-motion abnormality usually extends beyond the territory of the diseased artery.",
    verified: true,
  },
];
