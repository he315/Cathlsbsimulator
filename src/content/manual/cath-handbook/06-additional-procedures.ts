// Module hb-additional-procedures: temporary pacing, endomyocardial biopsy, balloon valvuloplasty,
// alcohol septal ablation and septal defect closure (manual curriculum, track cath-handbook).
// Sources: Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapter 9 (temporary
// pacemaker, endomyocardial biopsy), chapter 5 (aortic stenosis, mitral stenosis, atrial septal defect,
// cardiomyopathy, MINOCA), chapter 10 (arrhythmia, cardiac tamponade), chapter 4 (accessing the right and
// left heart, right heart waveforms), chapter 3 (femoral and internal jugular venous access), chapter 2 (the
// cardiac physiologist) and chapter 6 (coronary anatomy); Brilakis, Manual of PCI, sections 3.2, 3.6, 3.7,
// 6.6, 10.2, 12.2, 14.4, 15.1 and 19.9, where pacing, aortic stenosis and hypertrophic cardiomyopathy change a
// coronary procedure. Neither manual describes valvuloplasty, septal ablation or septal occlusion as
// procedures, so PubMed-verified references carry those steps (listed in `refs` below and, claim by claim, in
// docs/curriculum/evidence/hb-additional-procedures.md).
// Neighbouring modules: hb-specific-conditions (valve and HOCM haemodynamics), hb-cardiac-catheterisation
// (the shunt run and the ASD study), hb-tavi (TAVI and predilatation), hb-mitral-tricuspid-laa (transseptal
// puncture, TEER, LAAO), cm-perforation (pericardiocentesis), cp-calcium (pacing before atherectomy).
import type { CaseStudy, Module, Reference, SourceLoc } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const OX = ["oxford-cath-handbook"];
const B = (loc: string): SourceLoc => ({ book: "brilakis-pci", loc });
const O = (loc: string): SourceLoc => ({ book: "oxford-cath", loc });

export const module: Module = {
  id: "hb-additional-procedures",
  title: "Other procedures in the lab",
  stage: 3,
  summary:
    "The procedures that share the coronary lab but are not coronary interventions: placing, testing and using a temporary transvenous pacing wire (including external and overdrive pacing), right ventricular endomyocardial biopsy, balloon aortic valvuloplasty, percutaneous mitral commissurotomy, alcohol septal ablation for obstructive hypertrophic cardiomyopathy, and device closure of a patent foramen ovale or secundum atrial septal defect, each taught as a sequence of moves with its hazards and bail-outs.",
  objectives: [
    "Place a temporary wire from the femoral vein by Oxford's sequence, recognise a coronary sinus position, measure the threshold, set a demand box safely, and use external and overdrive pacing correctly.",
    "List every situation in the two manuals where a procedure needs pacing, and choose between atropine, a wire and external pacing.",
    "Take a right ventricular endomyocardial biopsy step by step, quote its complication rates in transplant and cardiomyopathy patients, and respond to a perforation.",
    "Decide when balloon aortic valvuloplasty still has a role, size the balloon to the annulus, inflate under rapid pacing, judge the result and recognise acute aortic regurgitation.",
    "Select patients for percutaneous mitral commissurotomy using the 2021 ESC/EACTS criteria, explain why TOE comes first, and apply stepwise dilatation with a clear stopping point.",
    "Perform alcohol septal ablation in order: pacing wire, gradient, septal branch, sealed balloon, contrast echo territory, alcohol dose and timing, and aftercare.",
    "Plan PFO and ASD device closure from the catheter study to follow-up, and name the risk factors for device erosion, atrial fibrillation and residual shunt.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-pacing",
      title: "Temporary transvenous pacing in the lab: placing, testing and using the wire",
      minutes: 16,
      topics: ["oth-temporary-pacing"],
      sources: [
        O("ch 9: Temporary pacemaker"),
        O("ch 10: Arrhythmia"),
        O("ch 10: Cardiac tamponade"),
        O("ch 2: The cardiac physiologist"),
        O("ch 3: Femoral vein access"),
        O("ch 4: Accessing the right heart"),
        O("ch 4: Right heart pressures and waveforms"),
        B("3.7"),
        B("10.2"),
        B("12.2"),
        B("15.1"),
        B("19.3"),
        B("19.9"),
      ],
      refs: [...BOOKS, "keeble-bav-2016", "rigopoulos-asa-2016"],
      blocks: [
        {
          kind: "p",
          text: "A temporary pacing wire is the lab's answer to a heart rate that has fallen too far, and some procedures place one before anything has gone wrong. The Academy lessons bed-pacing-indications, bed-pacing-insertion and bed-pacing-settings already cover indications on the ward, lead types, the choice of vein and a troubleshooting table. This lesson goes further in three directions: every situation in the two manuals where a procedure needs pacing, Oxford's insertion sequence taken one move at a time, and the box, external pacing and overdrive pacing as Oxford sets them up.",
        },
        { kind: "h", text: "When a procedure calls for pacing" },
        {
          kind: "table",
          caption: "Pacing situations in the two manuals",
          head: ["Situation", "What the manuals teach", "Source"],
          rows: [
            [
              "Slowing during a coronary injection",
              "Transient bradycardia or a junctional rhythm is common and usually recovers by itself or after atropine 0.5–1 mg IV (typical dose; follow local protocol). Slowing may also mean a vasovagal reaction is starting, and hypotensive collapse can follow it.",
              "Oxford ch 10",
            ],
            [
              "Advanced AV block during catheterisation",
              "Usually in patients with known conduction delay, from mechanical injury to a bundle branch (usually the right) or from ischaemia (typically the RCA). Conduction usually returns within minutes unless ischaemia continues. First-degree and Wenckebach block do not normally need urgent action; Mobitz II and complete block may need urgent transvenous pacing. Atropine 1 mg IV may improve AV conduction. IV isoprenaline (Oxford's figures: a 25–50 microgram bolus, then 5–10 micrograms/min; typical doses, follow local protocol) or another sympathomimetic seldom improves conduction, although it can speed the sinus node. Oxford's ECG definitions of each degree of block are in the table below.",
              "Oxford ch 10",
            ],
            [
              "AV block after intracoronary adenosine",
              "Usually over within seconds because of the drug's short half-life; ask the patient to cough. If block without an escape rhythm persists, brief CPR and temporary pacing may be needed. Prevention: avoid doses above 100 mcg in the RCA.",
              "Brilakis 12.2",
            ],
            [
              "Amiodarone",
              "Slows AV nodal conduction and can cause bradycardia or AV block: stop it, and temporary pacing may be needed. Do not give it to a patient with second- or third-degree block who has no pacemaker.",
              "Brilakis 3.7",
            ],
            [
              "Atherectomy of the RCA or a dominant circumflex",
              "A pacemaker is not routinely needed for the LAD or a non-dominant circumflex. For the RCA or a dominant circumflex Brilakis gives three options: a temporary pacemaker, aminophylline (250–300 mg IV over 10 minutes or a 20–40 mg intracoronary bolus; typical figures, follow local protocol), or brief test runs. Test runs let the operator stop when the rate falls and avoid the risk of right ventricular perforation by a pacing lead. Atropine before atherectomy is a further preventive option. Large burrs and long runs slow the heart more than small burrs and brief runs, and orbital atherectomy may cause it less than rotational (taught fully in cp-calcium).",
              "Brilakis 19.3, 19.9",
            ],
            [
              "Haemodynamically stable sustained monomorphic VT",
              "Overdrive pacing through a right ventricular wire (steps below). VT that is poorly tolerated is not paced: it needs immediate synchronised DC cardioversion under sedation or anaesthesia.",
              "Oxford ch 10",
            ],
            [
              "A stent that moves with each beat",
              "Rapid pacing during deployment can limit movement, for example when placing an ostial stent.",
              "Brilakis 10.2, 15.1",
            ],
            [
              "Valvuloplasty and septal ablation",
              "Rapid pacing steadies the balloon during aortic valvuloplasty; a wire is placed before alcohol septal ablation because heart block is its commonest complication (both taught later in this module).",
              "Refs keeble-bav-2016, rigopoulos-asa-2016",
            ],
            ["Support needed before a wire can be placed", "External (transcutaneous) pacing is the temporising measure.", "Oxford ch 9"],
          ],
        },
        {
          kind: "table",
          caption: "Reading the degree of AV block on the monitor (Oxford ch 10)",
          head: ["Block", "ECG appearance", "Urgency in the lab"],
          rows: [
            ["First degree", "PR interval longer than 200 ms (one large square); every P wave is followed by a QRS", "Not normally urgent"],
            ["Second degree, Mobitz I (Wenckebach)", "The PR interval grows with each beat until one P wave fails to conduct", "Not normally urgent"],
            ["Second degree, Mobitz II", "P waves fail to conduct in a fixed ratio, with no lengthening or variation of the PR interval beforehand", "May need urgent transvenous pacing"],
            ["Third degree (complete)", "No P wave conducts; a slow escape rhythm runs independently, narrow or wide depending on where it arises", "May need urgent transvenous pacing"],
          ],
        },
        {
          kind: "check",
          stem: "During a diagnostic study in a 72-year-old with right bundle branch block, complete heart block follows an RCA injection. The pressure is 82/50 mmHg with a slow escape and has not recovered after 30 seconds. Which response follows the manuals?",
          options: [
            "Wait without preparing anything, because conduction after an injection always returns within a minute",
            "Start an isoprenaline infusion straight away, as the treatment that reliably restores AV conduction in this setting",
            "Give atropine 1 mg IV, get femoral venous access and prepare a temporary wire, with external pacing as the bridge",
            "Give intracoronary adenosine down the RCA to reset the AV node and restore conducted beats",
          ],
          answer: 2,
          explanation:
            "Oxford: advanced block in the lab usually occurs in known conduction disease, usually recovers within minutes unless ischaemia continues, and Mobitz II or complete block may need urgent transvenous pacing; atropine may improve AV conduction, external pacing temporises. Isoprenaline rarely improves conduction (it acts mainly on the sinus node), and adenosine itself causes AV block (Brilakis 12.2). Waiting is reasonable only while you prepare, not instead of preparing.",
        },
        { kind: "h", text: "Placing the wire: Oxford's sequence" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Venous access with a sheath one size up",
              detail:
                "Oxford usually goes through the femoral vein and uses a sheath of larger diameter than the pacing wire, so the wire turns and slides freely. Oxford also names the femoral vein as a route for temporary wires in patients who are anticoagulated or have clotting abnormalities, because its complication risk is low. Jugular, subclavian and arm routes are compared in bed-pacing-insertion.",
            },
            {
              title: "2. Screen the wire into the right atrium",
              detail:
                "Advance under X-ray. The distal end of the wire is J-shaped, so turning the proximal end swings the tip round: rotation is how you aim it.",
            },
            {
              title: "3. Aim at the right ventricular apex",
              detail: "On an AP image the RV apex sits a little inside (medial to) the tip of the heart shadow. Point the wire there.",
            },
            {
              title: "4. If it will not cross, make an atrial loop",
              detail:
                "When the wire does not pass straight over the tricuspid valve, form a loop in the right atrium, usually by letting the tip catch against the lateral wall of the right atrium; then rotate and advance so the loop prolapses through the valve. Oxford teaches the same loop for taking a right heart catheter into the ventricle.",
            },
            {
              title: "5. Read the ectopics",
              detail: "Expect a few ectopic beats as the tip crosses into the ventricle; they are a useful sign that it has arrived in the RV.",
            },
            {
              title: "6. Shape the final position",
              detail:
                "Manipulate the tip so it curves down to the apex. Oxford compares the finished shape to a sock: the heel sits in the right atrium and the toe in the RV apex (its Fig 9.2).",
            },
          ],
        },
        { kind: "tip", id: "bed-pace-sheath-up-femoral" },
        { kind: "tip", id: "bed-pace-steer-to-apex" },
        { kind: "tip", id: "bed-pace-atrial-loop" },
        { kind: "tip", id: "bed-pace-sock-shape" },
        { kind: "h", text: "The coronary sinus trap" },
        {
          kind: "p",
          text: "The coronary sinus opens into the right atrium just above the tricuspid valve, so a wire can slip into it on the way to the ventricle. Oxford gives two screening signs. On AP the wire sits more cranially than a ventricular wire would. On a lateral view it runs posteriorly, whereas an RV lead runs anteriorly. The Academy lesson bed-pacing-insertion adds the ECG sign: a right bundle branch block paced pattern suggests left ventricular capture, which a coronary sinus position can produce.",
        },
        { kind: "tip", id: "bed-pace-coronary-sinus" },
        {
          kind: "check",
          stem: "The wire looks acceptable on AP, but the tip seems higher than you expected and capture is intermittent. On the lateral view the tip runs back towards the spine. What is happening, and what do you do?",
          options: [
            "The wire has entered the coronary sinus; pull back into the atrium and redirect it to the RV apex",
            "The tip is wedged firmly in the RV apex; increase the output to maximum and accept the present position",
            "The wire has crossed into the pulmonary artery; advance it further so it wedges more firmly",
            "The tip is in the RV outflow tract; that position is normal, so leave it and secure the lead",
          ],
          answer: 0,
          explanation:
            "Oxford's two signs of a coronary sinus wire are a more cranial position on AP and a posterior course on the lateral view; an RV lead goes anteriorly. Pull back into the right atrium and aim again for the apex, then confirm the anterior course on the lateral. Raising the output does not correct a wrong position, and pushing a stiff wire harder risks perforating the thin RV wall.",
        },
        { kind: "h", text: "Testing the threshold and setting the box" },
        {
          kind: "steps",
          items: [
            { title: "1. Pace faster than the patient", detail: "Connect the lead to the box and pace above the intrinsic rate so that every beat is paced." },
            {
              title: "2. Turn the output down from 3 V",
              detail: "Starting at 3 V, reduce the output slowly while watching the ECG monitor for the point at which capture is lost.",
            },
            {
              title: "3. Find the threshold on the way back up",
              detail: "Increase the output slowly until capture returns. That value is the pacing threshold; Oxford wants it at 1 V or lower.",
            },
            { title: "4. Set the margin", detail: "Set the output to at least three times the threshold, so that every impulse captures the ventricle." },
            {
              title: "5. Choose demand mode and a rate",
              detail:
                "Set demand at the rate required, for example 70 per minute. Beat by beat, the box fires whenever it detects no ventricular beat at or above that rate (the red pace light shows) and holds back when the patient's own rate is faster (the sense light shows).",
            },
            {
              title: "6. Adjust the sensitivity",
              detail:
                "A lower number makes the box more sensitive. Aim for a setting at which the box sees all of the patient's own beats yet is not switched off by noise from skeletal muscle.",
            },
            { title: "7. Check it is not asynchronous", detail: "Confirm demand mode before you leave the box: asynchronous pacing risks inducing ventricular arrhythmias." },
            {
              title: "8. Secure the wire",
              detail:
                "Suture the lead and the sheath to the skin, cover with transparent occlusive dressings, and tape or otherwise fix the external lead. Leave a loop fixed on the skin: if the wire is pulled, the loop takes up the tension before the lead moves.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Volts or milliamps.** Oxford's box (its Fig 9.3) reads output in volts and sensitivity in millivolts, whereas the Academy lesson bed-pacing-settings and the CathMaster pacing lab express output in milliamps. The method does not change: find the lowest output that captures, then set a margin above it. Read the units on the box in front of you before you quote a threshold.",
        },
        { kind: "tip", id: "bed-pace-threshold-margin" },
        { kind: "tip", id: "bed-pace-demand-sensitivity" },
        { kind: "tip", id: "bed-pace-skin-loop" },
        { kind: "h", text: "External pacing as the bridge" },
        {
          kind: "p",
          text: "Oxford places gel pads at the apex and in the right parasternal position, sets a rate of 70 per minute in demand mode, and turns the output up until there is electrical capture, then confirms that the output is producing a pulse. Skeletal muscle contraction is uncomfortable and can cause ECG artefact, so sedation is usually needed. Bed-pacing-settings explains why a femoral pulse or an arterial trace is a better check of mechanical capture than the carotid.",
        },
        { kind: "tip", id: "bed-pace-external-bridge" },
        { kind: "h", text: "Overdrive pacing for stable monomorphic VT" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Only for VT the patient tolerates",
              detail:
                "Oxford reserves overdrive pacing for stable, reasonably tolerated monomorphic VT. Poorly tolerated VT needs immediate synchronised DC cardioversion under sedation or general anaesthesia (Oxford gives 200–360 J or the biphasic equivalent), and VT that persists despite pacing is cardioverted in the same way. For tolerated VT Oxford also considers drugs (a beta-blocker, amiodarone or lidocaine) while preparing for cardioversion.",
            },
            {
              title: "2. Agree who shocks",
              detail:
                "Oxford makes the cardiac physiologist responsible for delivering a shock when the operator asks, a role usually assigned at the team briefing; confirm it before you start pacing.",
            },
            { title: "3. Expect it to work", detail: "Oxford reports that pacing ends sustained monomorphic VT without a shock in 80–90% of cases." },
            {
              title: "4. Pace faster than the VT",
              detail: "With a wire in the right ventricle, pace 15–20 beats per minute faster than the tachycardia. Many temporary boxes have a '×3' rate setting for this purpose.",
            },
            { title: "5. Use a high output", detail: "An output of 5–10 V may be needed." },
            {
              title: "6. Recognise capture",
              detail: "The QRS morphology changes and the monitored rate rises to the pacing rate.",
            },
            { title: "7. Stop abruptly", detail: "Switch pacing off suddenly after 5–10 seconds of ventricular capture." },
            {
              title: "8. Be ready to shock",
              detail: "The VT can accelerate and degenerate into pulseless VT or VF, so the defibrillator must be ready before you start.",
            },
            {
              title: "9. Consider background pacing",
              detail: "Once sinus rhythm returns, constant pacing at 90–110 per minute may prevent recurrence. It is most worth doing when pauses or a slow rate preceded the VT.",
            },
          ],
        },
        { kind: "tip", id: "bed-pace-overdrive-vt" },
        { kind: "h", text: "The team, the trace and the risk" },
        {
          kind: "list",
          items: [
            "**The physiologist** checks that the temporary pacing box is working and stocked, helps the operator set the pacing rate, threshold and amplitude, and records the venous access and the pacing settings in the procedure log (Oxford ch 2).",
            "**The right atrial trace** in complete heart block shows cannon waves: large a waves as the atrium contracts against a closed tricuspid valve (Oxford ch 4). If a right heart catheter is in, the trace can tell you about the rhythm before the ECG is read.",
            "**Tamponade** is the serious complication. Among Oxford's causes is moving catheters or pacing wires about in the right ventricle, whose wall is thin; deterioration can be rapid, with tachycardia and hypotension. Echo confirms it, but when suspicion is high Oxford proceeds straight to pericardiocentesis (taught in cm-perforation-pericardiocentesis).",
            "**A wire is not free.** Brilakis's preference for test runs before atherectomy rests partly on avoiding the risk of right ventricular perforation from the lead.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "A sheath no larger than the wire, so the wire binds and will not turn.",
            "Accepting a tip that sits high on AP and runs posteriorly on the lateral: that is the coronary sinus.",
            "Setting the output at or just above the threshold instead of at least three times it.",
            "Leaving the box asynchronous: Oxford warns that this risks inducing ventricular arrhythmias.",
            "Starting overdrive pacing for VT without the defibrillator charged and pads on, or pacing VT that is poorly tolerated instead of cardioverting it.",
            "Forgetting external pacing while the venous sheath is being placed in a patient who is already compromised.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the wire is secured, have the physiologist read back four numbers: the threshold, the output, the rate and the sensitivity. If the output is not at least three times the threshold, fix it now; the same four numbers go into the log.",
        },
        {
          kind: "sim",
          sim: "pacing",
          task: "Open the 'Inferior STEMI · CHB' scenario and choose the femoral route. Cross the tricuspid valve, forming an atrial loop if the wire will not cross directly, and check the lateral view to rule out the coronary sinus. Then pace above the intrinsic rate, lower the output until capture is lost, read the threshold, and set the output to three times the threshold in VVI.",
        },
        {
          kind: "keypoints",
          items: [
            "Pacing in the lab: Mobitz II or complete block, persistent adenosine or amiodarone block, atherectomy of the RCA or a dominant circumflex (one of three options), stable monomorphic VT, a moving stent, valvuloplasty and septal ablation.",
            "Femoral vein, a sheath larger than the wire, steer the J tip by rotation, aim just medial to the silhouette apex, loop in the atrium if needed, ectopics confirm the RV.",
            "Coronary sinus: more cranial on AP and posterior on the lateral; an RV wire runs anteriorly.",
            "Threshold from 3 V down, 1 V or less is desirable, output at least three times the threshold, demand mode, sensitivity so every intrinsic beat is seen but muscle noise is not.",
            "External pacing: pads apex and right parasternal, 70 per minute demand, raise output to capture, confirm a pulse, sedate.",
            "Overdrive pacing, for stable VT only: 15–20 above the VT rate, 5–10 V, stop after 5–10 s of capture, defibrillator ready; poorly tolerated VT is cardioverted.",
            "RV manipulation can cause tamponade; tachycardia and hypotension after a wire need an echo or immediate drainage.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-emb",
      title: "Endomyocardial biopsy step by step",
      minutes: 13,
      topics: ["oth-emb"],
      sources: [
        O("ch 9: Endomyocardial biopsy"),
        O("ch 3: How to obtain venous access"),
        O("ch 3: Internal jugular vein access"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 10: Cardiac tamponade"),
      ],
      refs: [...OX, "deckers-emb-1992", "baraldi-junkins-emb-transplant-1993", "from-emb-2011", "seferovic-emb-2021", "esc-myopericardial-2025"],
      blocks: [
        {
          kind: "p",
          text: "Endomyocardial biopsy takes small pieces of heart muscle with a bioptome, a long forceps passed through a vein. Oxford usually takes it from the right ventricle, because sampling the left carries a risk of systemic embolisation. The Academy lesson bed-emb lists the clinical scenarios where tissue changes management and how samples are fixed; this lesson follows Oxford's procedure move by move and puts numbers on the risk, so that you can consent a patient and recognise a perforation early.",
        },
        { kind: "h", text: "Who has a biopsy" },
        {
          kind: "table",
          head: ["Indication in Oxford", "Comment"],
          rows: [
            ["Monitoring for rejection after heart transplantation", "The established use. From and colleagues describe biopsy surveillance after transplant as accepted practice, and the 2021 HFA/HFSA/JHFS position statement names it as the commonest use of biopsy worldwide."],
            ["Myocarditis and acute heart failure", "Oxford's MINOCA section notes that myocarditis can be confirmed on cardiac MRI and that biopsy is now rarely performed for it. The 2025 ESC myocarditis and pericarditis guideline agrees that imaging, CMR above all, has reduced its role, but keeps biopsy for high-risk patients and, case by case, for some intermediate-risk patients when the histological type or a specific cause would change treatment."],
            ["Restrictive cardiomyopathies", "Bed-emb lists the infiltrative and storage diseases that tissue can identify when non-invasive tests are inconclusive. The 2021 position statement also gives biopsy a complementary role in other cardiomyopathies, drug-related cardiotoxicity, amyloidosis and other infiltrative and storage disorders."],
            ["Cardiac masses", "Oxford's Fig 9.4 shows intracardiac echo guiding the bioptome into a mass where the right atrium meets the right ventricle, the forceps tip buried in the tissue."],
          ],
        },
        {
          kind: "p",
          text: "From and colleagues argue that outside transplantation the decision is patient-specific: blood tests, echocardiography, nuclear imaging and MRI often make the diagnosis, so biopsy is justified by the prognostic or treatment information that only tissue can add.",
        },
        {
          kind: "check",
          stem: "A 34-year-old with new heart failure has an MRI pattern typical of myocarditis and is stable and improving on standard treatment. A colleague books a biopsy 'to confirm'. Which response best reflects the sources?",
          options: [
            "Proceed, because a biopsy is required in every patient before myocarditis can be diagnosed",
            "Proceed, but take all the samples from the left ventricle, where the yield in myocarditis is always higher",
            "Cancel all biopsy referrals, because the procedure is no longer used for any cardiac indication",
            "Ask what tissue would add: MRI can confirm myocarditis, and biopsy should change treatment or prognosis",
          ],
          answer: 3,
          explanation:
            "Oxford notes that myocarditis can be confirmed on cardiac MRI and that biopsy is now rarely performed for it; From and colleagues make the decision outside transplantation depend on the information tissue would add beyond non-invasive tests. This patient is stable and improving, so is not in the high-risk group for whom the 2025 ESC guideline keeps biopsy. Biopsy is not obsolete (transplant surveillance, high-risk myocarditis, restrictive disease, masses), and Oxford usually takes it from the right ventricle because of the embolic risk on the left.",
        },
        { kind: "h", text: "The procedure (Oxford)" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Sheath in the right internal jugular vein",
              detail:
                "Oxford names the right internal jugular vein; its venous access section lists myocardial biopsy among the reasons for using that vein. The vein lies lateral and anterior to the carotid artery within the carotid sheath, and a handheld ultrasound can help find it. Oxford's list of jugular access complications: inadvertent arterial puncture, local haematoma, infection and injury to a cervical nerve root, plus pneumothorax or haemothorax with the low (supraclavicular) approach and chylothorax from the left side. Because the apical pleura lies close to the low approach, pneumothorax is a real danger there, and Oxford leaves that route to experienced operators. From and colleagues describe both jugular and femoral routes; in Deckers's series of 546 biopsies the internal jugular was the primary route in 96%.",
            },
            {
              title: "2. Bioptome into the right atrium",
              detail:
                "Oxford advances a 7–9 F stiff bioptome into the right atrium. Note that From and colleagues tie their serious complication rate of under 1% to current flexible bioptomes; use the device your unit trains on.",
            },
            {
              title: "3. Image the approach",
              detail: "Guide the bioptome with intracardiac echocardiography or with fluoroscopy, using 60° LAO or 30° RAO.",
            },
            {
              title: "4. Confirm contact with the RV myocardium",
              detail: "Contact shows as resistance to further advancement and as ventricular ectopics.",
            },
            {
              title: "5. Take the bite",
              detail:
                "Withdraw the forceps slightly, open the jaws, advance, close, then withdraw again. Slight resistance as the sample comes away is expected.",
            },
            {
              title: "6. Look at every sample",
              detail: "Inspect every specimen to be sure there is enough tissue before transferring it gently into the specimen pot.",
            },
            { title: "7. Take four or five", detail: "Oxford asks for four or five samples." },
            { title: "8. Watch for tamponade", detail: "Keep the patient under observation for tamponade for some hours afterwards." },
          ],
        },
        {
          kind: "p",
          text: "The Academy lesson bed-emb adds where in the ventricle to aim: the jaws are turned towards the interventricular septum, away from the thin free wall and the apex, and the orientation is confirmed in a second projection or on echo. Oxford's two fluoroscopic views serve that purpose.",
        },
        { kind: "h", text: "Complications and how often they happen" },
        {
          kind: "p",
          text: "Oxford lists four: cardiac perforation, tamponade, embolism (of tissue, air or thrombus) and atrial or ventricular arrhythmias. Two series put numbers on them, and the contrast between them is instructive.",
        },
        {
          kind: "table",
          head: ["Series", "Population", "Findings"],
          rows: [
            [
              "Deckers 1992",
              "546 diagnostic right ventricular biopsies in 464 adults with cardiomyopathy, jugular route in 96%",
              "Complications 6% overall. During insertion 2.7%: arterial puncture 2%, vasovagal reaction 0.4%, prolonged bleeding 0.2%. During biopsy 3.3%: arrhythmias 1.1%, conduction abnormalities 1%, possible perforation 0.7%, definite perforation with pericardial fluid 0.5%. Two of the three patients with a definite perforation died (0.4%).",
            ],
            [
              "Baraldi-Junkins 1993",
              "2,454 biopsies in 133 heart transplant recipients",
              "Complications 3.0%, mostly at insertion: carotid puncture 1.8%, prolonged bleeding 0.4%, vasovagal 0.1%. During biopsy: arrhythmias 0.25%, conduction abnormalities 0.2%. Also five allergic reactions (in three patients) to a reusable bioptome and one pacemaker dislodgement. No ventricular perforations and no deaths.",
            ],
            ["From 2011", "Review, 2011", "Serious acute complications under 1% with current flexible bioptomes."],
          ],
        },
        {
          kind: "p",
          text: "The transplant recipients had no perforations at all, while the cardiomyopathy patients had a definite perforation in 0.5% with deaths. Baraldi-Junkins and colleagues draw that contrast themselves. Treat the first biopsy in a dilated, diseased ventricle as the higher-risk case, and have echo and a pericardiocentesis set ready.",
        },
        {
          kind: "check",
          stem: "Ten minutes after an uneventful-looking right ventricular biopsy for suspected cardiomyopathy, the patient becomes tachycardic and the pressure falls to 84/60 mmHg. What is the priority?",
          options: [
            "Treat as a vasovagal reaction with fluids and atropine, and reassess the patient in an hour",
            "Suspect perforation and tamponade: urgent echo, and drain at once if suspicion is high",
            "Take a further sample from the septum to complete the set of five before stopping",
            "Start an inotrope and transfer to the ward for overnight monitoring and a morning echo",
          ],
          answer: 1,
          explanation:
            "Perforation and tamponade head Oxford's list of biopsy complications, and Deckers found definite perforation in 0.5% of cardiomyopathy biopsies, two of three fatal. A vasovagal reaction slows the heart; tamponade usually brings tachycardia. Oxford's tamponade management: echo confirms it, but with high suspicion perform pericardiocentesis immediately, leave the drain until bleeding stops, and think about anticoagulation.",
        },
        {
          kind: "pitfalls",
          items: [
            "Biopsying the left ventricle when the right would answer the question: Oxford avoids the left because of systemic embolisation.",
            "Pushing on after resistance and ectopics have already told you the jaws are against muscle.",
            "Sending a pot without checking that each piece is there: Oxford asks you to inspect every sample for quantity.",
            "Stopping at two pieces: Oxford wants four or five.",
            "Sending the patient straight to the ward: watch for tamponade for several hours.",
            "Carotid puncture on the way in, the commonest access complication in the transplant series.",
          ],
        },
        {
          kind: "pearl",
          text: "Count the samples aloud with the scrub nurse as each one goes into the pot, and say what each looks like. It keeps the tally honest and it tells you when a bite has come back empty.",
        },
        {
          kind: "sim",
          sim: "pacing",
          task: "Choose the right internal jugular route and practise taking the tip from the right atrium into the right ventricle in the AP and lateral views. Watch for the signs Oxford uses to confirm that a bioptome is against the RV myocardium: resistance to further advancement and ventricular ectopics. The current of injury on this lab's tip electrogram belongs to a pacing lead; a bioptome records no such signal. A bioptome mode for this lab has been requested.",
        },
        { kind: "video", id: "QO7mqNJoefM", note: "Elias Hanna's lecture on acute pericarditis and myocarditis." },
        {
          kind: "keypoints",
          items: [
            "Oxford's indications: transplant rejection, myocarditis and acute heart failure, restrictive cardiomyopathy, cardiac masses. Myocarditis can be confirmed on MRI and biopsy is now rarely performed for it; the 2025 ESC guideline keeps it for high-risk and selected intermediate-risk cases.",
            "Usually the right ventricle, because the left carries a systemic embolic risk.",
            "Right internal jugular sheath, 7–9 F bioptome, ICE or fluoroscopy at 60° LAO or 30° RAO.",
            "Contact = resistance plus ventricular ectopics; withdraw slightly, open, advance, close, withdraw.",
            "Inspect each sample, take four or five, observe for tamponade for several hours.",
            "Cardiomyopathy series: 6% complications, definite perforation 0.5% with deaths; transplant series: 3%, no perforations.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-bav",
      title: "Balloon aortic valvuloplasty step by step",
      minutes: 15,
      topics: ["sh-balloon-valvuloplasty"],
      sources: [
        O("ch 5: Aortic stenosis"),
        O("ch 4: Accessing the left heart"),
        O("ch 9: Temporary pacemaker"),
        O("ch 10: Cardiac tamponade"),
        O("ch 1: Cardiac CT or invasive angiography?"),
        B("14.4"),
        B("10.2"),
        B("15.1"),
      ],
      refs: [...BOOKS, "keeble-bav-2016", "esc-vhd-2025", "esc-vhd-2021"],
      blocks: [
        {
          kind: "p",
          text: "Balloon aortic valvuloplasty (BAV) stretches a stenotic aortic valve with a large balloon. It gives a modest gain in valve area that usually does not last, so today it is mostly a bridge or a test. The Academy lesson sh-bav lists the indications and an outline; this lesson walks through the procedure move by move, using Oxford's crossing technique and the detailed practice described by Keeble and colleagues (a UK narrative review), and shows how to judge the result on the pressure trace.",
        },
        { kind: "h", text: "Is there still a role?" },
        {
          kind: "list",
          items: [
            "**The 2025 ESC/EACTS guideline** says BAV may, rarely, be used to bridge carefully selected patients to TAVI or surgery when they have decompensated aortic stenosis, and in severe aortic stenosis needing urgent high-risk non-cardiac surgery, and that it carries significant risks of acute complications. In cardiogenic shock it has largely been replaced by TAVI because of the high risk of severe aortic regurgitation and death in the acute setting. The 2021 guideline also asked for Heart Team discussion first.",
            "**Other uses described by Keeble:** testing the 'therapeutic response' in borderline patients (poor LV function, COPD, frailty) before committing to TAVI; predilatation during TAVI; and palliation. In the early era restenosis and recurrent symptoms were common after six months, and one-year mortality was similar to untreated patients.",
            "**Brilakis's view from the support chapter:** a stenotic valve can stop a pigtail advancing before a microaxial pump, and balloon dilation of the valve may be needed first.",
          ],
        },
        {
          kind: "table",
          caption: "Who should not have BAV (Keeble)",
          head: ["Exclusion", "Note"],
          rows: [
            ["A metallic or bioprosthetic aortic valve", "Keeble's reason: the prosthesis could fragment"],
            ["Active aortic valve endocarditis", "Listed by Keeble"],
            ["Aortic stenosis that is not severe, or pre-existing severe aortic regurgitation", "Listed by Keeble; acute regurgitation is itself a complication of the procedure. Oxford's severe range is a valve area below 1.0 cm², a peak gradient above 65 mmHg and a mean gradient above 40 mmHg"],
            ["LV thrombus, significant left main stenosis, or bleeding that would make full heparinisation unsafe", "Listed by Keeble; full heparinisation is part of the procedure"],
            ["Frailty such that no further valve intervention is possible and BAV would not change quality or length of life", "Listed by Keeble"],
            ["An annulus too small or too large for the available balloons", "Keeble expects this to be rare given the range of sizes"],
          ],
        },
        {
          kind: "p",
          text: "Before starting, agree the ceiling of care with the patient and family: would they be offered emergency sternotomy, bypass or surgery if a catastrophic complication occurred? Keeble limits BAV to experienced operators in centres where surgical and TAVI bail-out is available, after a consent discussion that covers the procedural risks he lists: vascular injury needing intervention or surgery (haematoma, haemorrhage, pseudoaneurysm, dissection, limb ischaemia), myocardial infarction, stroke, perforation of a cardiac chamber, tamponade needing drainage or surgery, arrhythmia, annular rupture, aortic dissection, emergency cardiac surgery and death. The indication (palliation, a staged step towards TAVI or surgery, or cover for urgent non-cardiac surgery) should be clear before any intervention.",
        },
        { kind: "tip", id: "structural-bav-exclusions-ceiling" },
        { kind: "h", text: "The procedure" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Arterial access sized to the balloon",
              detail:
                "Usually femoral, with an 8–12 F sheath depending on the balloon. Above 8 F, a suture-based closure device may need to be deployed before the sheath goes in. Preclosure, assessing the peripheral arteries beforehand and a micropuncture technique all reduce vascular complications.",
            },
            {
              title: "2. Venous access and a pacing wire",
              detail:
                "Most cases need a temporary wire for rapid pacing (Oxford's insertion technique is in the pacing lesson). Keeble notes that jugular or subclavian wires lower infection and venous thrombosis risk and let a pacing-dependent patient mobilise; a patient with a permanent pacemaker can be rapid-paced through it.",
            },
            {
              title: "3. Heparin",
              detail: "Keeble gives 75–100 U/kg to an ACT of 250–300 s (typical figures; follow local protocol).",
            },
            {
              title: "4. Cross the valve",
              detail:
                "Oxford's technique for a severely stenotic valve: a 5 F AL1 with a hydrophilic straight-tipped wire, moved with great care, an aortogram showing the 'Prussian helmet' if the orifice is hard to find. Oxford warns that attempts to cross a stenotic valve frequently produce silent, and sometimes symptomatic, cerebral emboli on MRI, so keep the crossing controlled and brief. Keeble usually uses a JR4 or AL1 with the soft straight end of a standard 0.035 in. wire, an AL2 particularly for a horizontal root or vertical valve, or an AR1, turning gently to line up with the orifice, in AP or 10–20° LAO; a hydrophilic wire helps if the standard wire will not cross.",
            },
            {
              title: "5. Measure the gradient",
              detail:
                "Advance the catheter, exchange over a long J wire for a pigtail, and record LV pressure against the femoral sheath side arm; a dual-lumen pigtail gives central aortic and LV pressures together and is more accurate. Oxford's point that simultaneous LV and aortic pressures are the most accurate method applies here (hb-specific-conditions-as).",
            },
            {
              title: "6. Park a stiff wire at the apex",
              detail:
                "Exchange the pigtail for a pre-shaped exchange-length extra-stiff wire with an atraumatic curve, placed at the LV apex where it is clear of the mitral apparatus and provokes few ectopics. An RAO view helps check this. Before such pre-shaped wires, operators had to shape the curve themselves to reduce the risk of perforation.",
            },
            {
              title: "7. Choose the balloon",
              detail:
                "Size from the annulus on echo or CT (Oxford lists annulus and sinotubular junction sizing among the CT measurements for TAVI): up to 1:1 with the annulus, or at most 10% larger than the LVOT diameter, and always smaller than the sinotubular junction. Keeble sizes more aggressively when BAV is the treatment or the test than when it is a TAVI predilatation. Semi-compliant balloons have a lower profile; non-compliant balloons reach a more predictable diameter and tolerate higher pressure. Balloons are 3–6 cm long and hold 25–60 mL; they are filled with a contrast–saline mixture, so that they are visible on fluoroscopy and deflate quickly, and de-aired.",
            },
            {
              title: "8. Inflate under rapid pacing",
              detail:
                "With the balloon across the annulus, pace at 180–220 per minute to drop stroke volume. When the arterial pressure falls, check the balloon has not moved, inflate rapidly for about 3 seconds, deflate, stop pacing, and pull the balloon back into the ascending aorta while the pressure recovers. Watch on fluoroscopy that the balloon inflates fully across the annulus.",
            },
            {
              title: "9. Reassess before any further inflation",
              detail:
                "Put the pigtail back in the LV (or use echo). The usual aim is a 40–50% fall in the peak gradient without a significant increase in aortic regurgitation. Do not inflate again until the pressure is back to baseline.",
            },
            {
              title: "10. Finish",
              detail:
                "Close the artery with a device, or compress once the ACT is below 150 s. Remove the pacing wire according to the risk of bradycardia. Recover on a coronary care unit, repeat the echo, and if BAV was a bridge, review within 4–6 weeks to decide on TAVI or surgery.",
            },
          ],
        },
        { kind: "h", text: "Variations Keeble describes" },
        {
          kind: "list",
          items: [
            "**Anaesthesia and imaging.** BAV can be done under local or general anaesthesia, on fluoroscopy with or without TOE.",
            "**Other arterial routes.** When the femoral arteries are severely diseased, a brachial or subclavian cut-down is a rare alternative.",
            "**Antegrade approach.** Where retrograde access is impossible, a transseptal puncture and a wire loop from the right heart across the septum and the aortic valve allow dilatation with a single-balloon (Inoue-type) catheter; this avoids large-bore arterial access but carries a higher risk of damaging the mitral apparatus.",
            "**Balloon shape.** Current balloons are hourglass-shaped rather than cylindrical, which steadies them during inflation and makes annular rupture less likely.",
            "**Contrast.** Apart from the contrast in the balloon, the procedure needs little or no contrast in the circulation, which matters in advanced kidney disease (the case below has a raised creatinine).",
            "**The pacing wire itself.** In a series of 423 patients, using a temporary wire made no difference to mortality or complications, and Saia needed right ventricular pacing only occasionally.",
            "**Going home.** After monitoring and a repeat echo, many patients can be discharged the next day.",
          ],
        },
        { kind: "tip", id: "structural-bav-stiff-wire-apex" },
        { kind: "tip", id: "structural-bav-balloon-size" },
        { kind: "tip", id: "structural-bav-rapid-pacing" },
        {
          kind: "check",
          stem: "CT gives an annulus of 22 mm, an LVOT of 21 mm and a sinotubular junction of 25 mm. BAV is planned as a stand-alone bridge. Which balloon fits Keeble's sizing rules?",
          options: [
            "A 25 mm balloon, matching the sinotubular junction so that the whole root is dilated",
            "A 26 mm balloon, about 20% larger than the annulus, to make sure the leaflets crack",
            "A 22 mm balloon: up to 1:1 with the annulus and smaller than the sinotubular junction",
            "A 16 mm balloon whatever the anatomy, because no larger size is safe in calcific stenosis",
          ],
          answer: 2,
          explanation:
            "Keeble sizes up to 1:1 with the annulus (or at most 10% over the LVOT, here about 23 mm) and always below the sinotubular junction; a 22 mm balloon satisfies all three. A 25 or 26 mm balloon exceeds the annulus and reaches the sinotubular junction, risking severe regurgitation and annular rupture. A fixed small balloon ignores the anatomy and the fact that sizing can be more aggressive for stand-alone BAV than for predilatation.",
        },
        { kind: "h", text: "Reading the result on the trace" },
        {
          kind: "p",
          text: "A good result shows as a smaller LV–aortic gradient, a higher aortic systolic pressure and a brisker arterial upstroke. Keeble's illustration falls from 72 mmHg to 13 mmHg on simultaneous traces. The warning signs are a clear jump in LVEDP or a fall in aortic diastolic pressure, which point to regurgitation severe enough to matter. New left bundle branch block can follow: it may be transient and rate-related after the burst of rapid pacing, or permanent because the AV node and conduction tissue lie close to the annulus.",
        },
        { kind: "tip", id: "structural-bav-ar-signs" },
        {
          kind: "check",
          stem: "After the second inflation the peak gradient has fallen from 64 to 30 mmHg. The LVEDP has risen from 18 to 32 mmHg and the aortic diastolic pressure has fallen from 60 to 38 mmHg. What do you conclude?",
          options: [
            "Significant aortic regurgitation is likely; stop inflating and assess with echo and aortography",
            "An excellent result; upsize the balloon by 2 mm and inflate again to bring the gradient down further",
            "The rise in LVEDP is expected after rapid pacing and needs no further assessment at all",
            "The pigtail has slipped into the aorta, so the gradient should simply be measured again",
          ],
          answer: 0,
          explanation:
            "Keeble: a clear jump in LVEDP or a fall in aortic diastolic pressure points to regurgitation that matters haemodynamically. The gradient has already fallen by more than 50%, which meets the usual aim, so further inflation adds only risk. Assess the regurgitation; Keeble's management options include inotropes and stabilisation, rapid pacing to limit diastolic regurgitation, and urgent TAVI or surgery.",
        },
        { kind: "h", text: "Complications and bail-outs (Keeble)" },
        {
          kind: "table",
          head: ["Complication", "Recognition and response"],
          rows: [
            ["Vascular haemorrhage (groin haematoma, retroperitoneal bleed)", "Occlusion balloon from the other side, volume and blood products, reverse anticoagulation, covered stent or surgery"],
            ["Bradycardia, complete AV block, pauses", "Atropine IV and the temporary pacing wire"],
            ["Tamponade, including from the pacing wire", "Emergency pericardiocentesis, reverse anticoagulation, volume and blood, surgery if bleeding continues (Oxford's tamponade management agrees)"],
            ["Severe aortic regurgitation", "Inotropes, diuresis and stabilisation; rapid pacing can limit diastolic regurgitation; in one series a locked cusp was freed with a stiff-wire-reinforced pigtail; urgent TAVI or surgery"],
            ["Annular rupture", "Very high mortality; fluids, treat tamponade, emergency surgery if appropriate"],
            ["Acute mitral regurgitation, coronary ischaemia, sustained VT, acute LV failure", "Also on Keeble's list; mitral regurgitation can come from entrapment of the wire or pigtail in the mitral apparatus, or from balloon disruption"],
            [
              "Stroke and systemic embolism",
              "Systemic embolisation heads Keeble's list of procedural complications from the early era, and stroke occurred in 0.5% of Saia's 415 patients. Oxford adds that crossing a stenotic aortic valve often causes silent cerebral emboli on MRI: keep valve manipulation to the minimum",
            ],
            [
              "Acute kidney injury",
              "18% in Saia's series. Keeble notes that, apart from the contrast in the balloon, BAV needs little or no contrast in the circulation, an advantage in advanced kidney disease",
            ],
          ],
        },
        {
          kind: "p",
          text: "**Hypotension after BAV** needs a fast, ordered search, because these patients tolerate low pressure badly and slide into a cycle of hypotension and coronary ischaemia. Give fluid and inotropes or vasopressors while you look at the ECG, echo (annular rupture, regurgitation, tamponade) and fluoroscopy of the iliofemoral vessels and aorta for contrast extravasation.",
        },
        {
          kind: "table",
          caption: "What the numbers show (Keeble's summary)",
          head: ["Data set", "Result"],
          rows: [
            ["NHLBI registry, 674 patients (1987–89)", "Valve area 0.5 to 0.8 cm², peak gradient 65 to 31 mmHg; 14% dead by 30 days, more often with poor LV function, low output, hypotension or NYHA IV"],
            ["Mechanism (Serruys)", "Laceration of the valve stroma, fracture of calcium, separation of fused commissures; healing scar then stiffens the leaflets again (restenosis)"],
            [
              "Saia, 415 patients (2000–10)",
              "In-hospital mortality 5.1%, concentrated in cardiogenic shock (56.5%, against about 2% in the other groups); acute aortic regurgitation 2.6%; stroke 0.5%; life-threatening bleeding 1.5%; acute kidney injury 18%; repeat BAV in 30.8% within two years; one-year mortality 33.2%. Right ventricular pacing was needed only occasionally",
            ],
            ["Seven European centres, 811 patients (2006–13)", "65.1% of those intended for bridging to TAVI had no further intervention"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Doing BAV without a plan for the ceiling of care and without surgical or TAVI bail-out on site.",
            "Choosing a balloon larger than the annulus or as large as the sinotubular junction.",
            "Inflating without rapid pacing when the balloon needs it: it is pushed out of the valve.",
            "Inflating again before the pressure has recovered from the last run.",
            "Ignoring a rising LVEDP and falling diastolic pressure: that is aortic regurgitation until proved otherwise.",
            "Letting the bridge become the destination: the outcomes of BAV alone are poor, so plan the definitive treatment at the time of BAV.",
          ],
        },
        {
          kind: "pearl",
          text: "Say the three diameters aloud at the time-out: annulus, LVOT, sinotubular junction. If the balloon in the operator's hand is not at or below the first and below the third, it goes back in the packet.",
        },
        {
          kind: "sim",
          sim: "tavi",
          task: "In the TAVI lab, plan a balloon-expandable case with predilatation and choose the predilatation balloon from the annulus measurement. Inflate it once without rapid pacing and once with rapid pacing, and compare how stable the balloon is across the annulus. A stand-alone valvuloplasty pathway, with the gradient measured before and after in the haemodynamics lab, has been requested.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open the 'Exertional syncope with an ejection systolic murmur' scenario and record simultaneous LV and aortic pressures, so you know the baseline peak-to-peak and mean gradients a valvuloplasty would be judged against.",
        },
        { kind: "video", id: "7l5kBea_XIk", note: "Elias Hanna on technical tips for the haemodynamic assessment of aortic stenosis." },
        {
          kind: "keypoints",
          items: [
            "2025 ESC: BAV rarely, as a bridge in decompensated stenosis or before urgent high-risk surgery; largely replaced by TAVI in shock.",
            "Exclusions: prosthetic valve, endocarditis, non-severe stenosis, severe regurgitation, LV thrombus, left main disease, bleeding.",
            "Femoral sheath 8–12 F (preclose above 8 F), pacing wire, heparin to ACT 250–300 s.",
            "Cross with AL1 (or JR4) and a straight or hydrophilic wire, pigtail gradient, stiff pre-shaped wire at the apex clear of the mitral valve.",
            "Balloon up to 1:1 with the annulus, at most 10% over the LVOT, smaller than the sinotubular junction.",
            "Rapid pace 180–220 per minute, inflate about 3 s, deflate, stop pacing, pull back, wait for recovery.",
            "Aim for a 40–50% fall in peak gradient; rising LVEDP or falling aortic diastolic pressure means regurgitation.",
            "Consent covers vascular injury, MI, stroke, perforation and tamponade, arrhythmia, annular rupture, aortic dissection, emergency surgery and death; Saia's in-hospital mortality was 5.1%, mostly in cardiogenic shock.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-pmc",
      title: "Percutaneous mitral commissurotomy: selection, haemodynamics and stepwise dilatation",
      minutes: 12,
      topics: ["sh-balloon-valvuloplasty"],
      sources: [O("ch 5: Mitral stenosis"), O("ch 4: Accessing the left heart")],
      refs: [...OX, "esc-vhd-2021", "esc-vhd-2025", "sanzruiz-mitral-stenosis-2022", "hung-inoue-complications-1999", "lau-inoue-height-sizing-1996", "wilkins-score-1988"],
      blocks: [
        {
          kind: "p",
          text: "Percutaneous mitral commissurotomy (PMC) splits fused commissures in rheumatic mitral stenosis with a balloon taken across the atrial septum. It only works where there is commissural fusion, so selection decides most of the result. The Academy lesson sh-pmc gives the Wilkins score, the contraindication table and the inflation sequence for the single-balloon technique; this lesson adds the 2021 ESC/EACTS selection criteria as far as they could be verified, Oxford's catheter assessment of mitral stenosis, and the evidence behind stepwise dilatation and pre-procedure TOE.",
        },
        { kind: "h", text: "Selecting the patient" },
        {
          kind: "list",
          items: [
            "**Threshold.** The 2021 ESC/EACTS guideline generally limits intervention to clinically significant (moderate-to-severe) rheumatic stenosis, a valve area of 1.5 cm² or less.",
            "**Symptomatic patients.** In the 2021 guideline, symptomatic patients with clinically significant stenosis are treated (class I), with PMC first when there are no unfavourable characteristics for it. Percutaneous treatment of significant symptomatic stenosis without unfavourable characteristics carries a IIa recommendation whatever the cause of the stenosis (as Sanz-Ruiz and colleagues summarise the guideline).",
            "**Asymptomatic patients.** In the 2021 guideline PMC can be considered (IIa) in asymptomatic patients at high risk of thromboembolism or of haemodynamic decompensation. The guideline's examples of a high risk of decompensation are a resting systolic pulmonary pressure above 50 mmHg, need for major non-cardiac surgery, and a wish for pregnancy.",
            "**Unfavourable characteristics** in the 2021 guideline count when several are present. Clinical: old age, previous commissurotomy, NYHA class IV, permanent AF, severe pulmonary hypertension. Anatomical: an echo score above 8, a Cormier score of 3, calcification of any extent on fluoroscopy, a very small valve area, severe tricuspid regurgitation.",
            "**Borderline anatomy.** In the 2021 guideline, PMC should be considered as the first treatment for selected patients with mild to moderate calcification or an impaired subvalvular apparatus whose clinical characteristics are otherwise favourable.",
            "**Where.** In countries with little rheumatic fever, the 2021 guideline restricts PMC to expert operators in specialised centres.",
            "**Contraindications** as Sanz-Ruiz and colleagues list them: left atrial thrombus, more than mild mitral regurgitation, and severe concomitant aortic or tricuspid disease or coronary disease needing surgery; severe or bicommissural calcification favours surgery; there must be commissural fusion.",
            "**Version note.** Everything above is from the 2021 guideline. The 2025 ESC/EACTS guideline now speaks of clinically severe rheumatic stenosis, a valve area of 1.5 cm² or less (the title of its management figure), and has its own recommendation table for PMC and a table of contraindications (its Table 8); their text could not be read for this lesson, so check the 2025 wording before quoting the current criteria.",
          ],
        },
        {
          kind: "p",
          text: "**TOE first, every time.** The 2021 guideline asks for TOE to exclude left atrial thrombus before PMC. Hung and colleagues show why: in 799 commissurotomies with a single, self-positioning (Inoue-type) balloon, all 11 systemic emboli (1.4%) occurred among the first 353 patients, before pre-procedure TOE became routine.",
        },
        { kind: "tip", id: "structural-pmc-toe-first" },
        {
          kind: "check",
          stem: "A 58-year-old with rheumatic mitral stenosis (valve area 1.1 cm²) is in permanent AF, has had a surgical commissurotomy, has fluoroscopic calcification of the valve and an echo score of 10. Which statement fits the 2021 ESC criteria?",
          options: [
            "She is an ideal PMC candidate, because her valve area is well below the 1.5 cm² threshold",
            "PMC is contraindicated only by her age, so it should proceed if she were ten years younger",
            "No assessment is needed, because echo scores do not apply to patients in permanent AF",
            "Several unfavourable characteristics are present, so surgery should be weighed against PMC",
          ],
          answer: 3,
          explanation:
            "Permanent AF, previous commissurotomy, fluoroscopic calcification and an echo score above 8 are each among the guideline's unfavourable characteristics, which count when several are present. The valve area makes intervention appropriate but does not make PMC the right intervention. Age is only one of the clinical factors, and the echo score applies whatever the rhythm.",
        },
        { kind: "h", text: "Oxford's catheter assessment of mitral stenosis" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Plan the study",
              detail:
                "Oxford's assessment usually combines simultaneous left and right heart catheterisation, and coronary angiography is usually added when mitral valve surgery is under consideration.",
            },
            {
              title: "2. Right heart catheter to the main PA",
              detail: "An MPA2 or balloon flotation catheter records the PA systolic pressure, then advances to the wedge position as a surrogate for left atrial pressure (Oxford).",
            },
            { title: "3. Pigtail in the LV body", detail: "Record LV pressure and the LVEDP." },
            {
              title: "4. Mean gradient",
              detail: "The mean mitral gradient is the area between the wedge (or left atrial) curve and the LV curve in diastole. Average at least 10 beats, particularly in AF, because heart rate changes the gradient.",
            },
            {
              title: "5. Correct for the wedge",
              detail:
                "Oxford warns that in mitral stenosis the wedge probably overestimates left atrial pressure by 2–3 mmHg. Once the septum has been crossed for PMC, the left atrium itself can be measured, which avoids this error (author's reasoning from Oxford's transseptal route into the left heart).",
            },
            {
              title: "6. Ventriculography if needed",
              detail: "Oxford occasionally ends with a left ventriculogram to look at valve calcification, leaflet movement and mitral regurgitation.",
            },
          ],
        },
        {
          kind: "p",
          text: "The wedge and LV technique, Oxford's severity table and the Gorlin mitral formula are taught in hb-specific-conditions-mitral; Oxford notes that the Gorlin valve area is prone to error and is now rarely calculated; the transseptal puncture itself belongs to hb-mitral-tricuspid-laa. Oxford's route into the left atrium can also run across an existing PFO or ASD.",
        },
        { kind: "h", text: "Dilating in steps, and when to stop" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Size from the patient's height",
              detail:
                "Hung's group chose the balloon size with a height-derived method, and Lau's group used the same height-based method to plan stepwise dilatation.",
            },
            {
              title: "2. Start small and step up",
              detail:
                "Inflate below the target diameter first, then increase step by step, measuring the gradient and area and looking at the valve and the regurgitation on echo after each inflation (sh-pmc gives the inflation sequence).",
            },
            {
              title: "3. Do not pull on the septum",
              detail: "Hung's group lists avoiding traction on the interatrial septum during inflation among the refinements that cut complications.",
            },
            {
              title: "4. Know what a good result is",
              detail:
                "Lau and colleagues define an optimal result as a valve area increase of 50% or more, or a final area of 1.5 cm² or more, without significant regurgitation, meaning an increase of two grades or more or a final grade of 3 or more. Their mean area rose from 0.8 to 1.7 cm².",
            },
            {
              title: "5. Use that definition as the stopping point",
              detail:
                "Lau's definition is an outcome definition, not a published stopping rule; this lesson uses it as the point at which to stop stepping up. Severe regurgitation is the complication that ends the procedure. Hung found severe (grade 3 or more) regurgitation in 2% of pliable valves but 9% of calcified valves or valves with severe subvalvular disease, falling with experience and technique.",
            },
          ],
        },
        { kind: "tip", id: "structural-pmc-stepwise-stop" },
        {
          kind: "table",
          caption: "Why the anatomy matters (verified series)",
          head: ["Finding", "Source"],
          rows: [
            ["Severe regurgitation 2% in pliable valves vs 9% in calcified or severely diseased subvalvular apparatus", "Hung 1999 (799 patients)"],
            ["In heavily calcified valves the balloon can tear calcified leaflet tissue instead of splitting the commissures, causing severe acute regurgitation needing emergency surgery in 2–19%", "Sanz-Ruiz 2022"],
            ["Significant residual interatrial shunt (Qp:Qs 1.3 or more) fell from 12% to 6% with technique refinements", "Hung 1999"],
            ["Restenosis (loss of more than half the gain, an area below 1.5 cm², or both) in 9.8% at a mean of 20 months", "Lau 1996 (105 patients)"],
          ],
        },
        {
          kind: "check",
          stem: "After the third inflation the area has risen from 0.9 to 1.6 cm², and the regurgitation grade has risen from 1 to 2 (Lau graded it angiographically). Should you inflate again at a larger diameter?",
          options: [
            "Yes, because any area under 2.0 cm² counts as a failed commissurotomy that needs more dilatation",
            "No: the area is above 1.5 cm² and regurgitation has risen one grade, so Lau's optimal result is met; stop here",
            "Yes, because regurgitation must reach grade 3 or more before it should limit any further inflation in practice",
            "No, and the septum should now be closed with a device, because every PMC leaves a large shunt",
          ],
          answer: 1,
          explanation:
            "Lau's optimal result is a final area of 1.5 cm² or more (or a 50% increase) without significant regurgitation, defined as a rise of two grades or a final grade of 3 or more. This patient meets the area criterion and has risen one grade: an optimal result by Lau's definition, which this lesson uses as the stopping point, and a further step risks the severe regurgitation that ends the procedure. Waiting for grade 3 is waiting for the complication. Hung found significant shunts in a minority, falling to 6%, not in every patient.",
        },
        {
          kind: "pitfalls",
          items: [
            "Proceeding without TOE: in Hung's series every embolus came before routine TOE.",
            "Offering PMC to a valve without commissural fusion, or to one with severe or bicommissural calcification.",
            "Starting at the full diameter instead of stepping up from a smaller one.",
            "Pulling the inflated balloon against the septum.",
            "Taking one more step once Lau's optimal result (the stopping point used here) has been reached.",
            "Reporting a wedge-based gradient as if it were left atrial: the wedge reads 2–3 mmHg high in mitral stenosis.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the stopping point on the board before the first inflation (here, Lau's definition of an optimal result): the area you will accept and the regurgitation grade you will not. The decision to stop is easier to make before the balloon is in the valve.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open the 'Breathlessness and palpitations, previous rheumatic fever' scenario. Record wedge and LV pressures together, average the mean gradient over at least 10 beats, and note how the wedge-based gradient would read if the left atrial pressure is 2–3 mmHg lower. A PMC pathway with direct left atrial pressure and stepwise inflation has been requested.",
        },
        { kind: "video", id: "1_8lFiWvrPc", note: "Elias Hanna on valve area calculation and the haemodynamics of mitral stenosis and regurgitation." },
        {
          kind: "keypoints",
          items: [
            "PMC needs commissural fusion; in the 2021 ESC/EACTS guideline intervention is generally at an area of 1.5 cm² or less, class I with PMC first in symptomatic patients without unfavourable features, IIa in asymptomatic patients at high thromboembolic or decompensation risk.",
            "Unfavourable (2021 guideline): old age, previous commissurotomy, NYHA IV, permanent AF, severe pulmonary hypertension, echo score above 8, Cormier 3, fluoroscopic calcification, very small area, severe TR.",
            "TOE to exclude left atrial thrombus first: all emboli in Hung's series came before routine TOE.",
            "Wedge overestimates left atrial pressure by 2–3 mmHg; average 10 beats.",
            "Height-based balloon choice, stepwise inflation, no traction on the septum.",
            "Lau's optimal result, used here as the stopping point: area 1.5 cm² or more or a 50% increase, without a two-grade rise or grade 3 regurgitation.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-asa",
      title: "Alcohol septal ablation step by step",
      minutes: 16,
      topics: ["sh-asa"],
      sources: [O("ch 5: Cardiomyopathy"), O("ch 6: Coronary anatomy"), B("3.2"), B("3.6"), B("6.6")],
      refs: [...BOOKS, "rigopoulos-asa-2016", "veselka-euro-asa-2016", "esc-cardiomyopathy-2023", "verheyen-hcm-austria-2024"],
      blocks: [
        {
          kind: "p",
          text: "Alcohol septal ablation (ASA) infarcts the part of the basal septum that obstructs the outflow tract in hypertrophic obstructive cardiomyopathy, by injecting alcohol into the septal branch that supplies it. Oxford's anatomy section notes that the septal branches of the LAD supply the anterior two-thirds of the septum and the left bundle; Rigopoulos and Seggewiss add that the first septal branch runs close to the His bundle and right bundle, which is why heart block is the commonest complication. The Academy lesson sh-asa gives the choice between ablation and myectomy and an outline; this lesson walks through the procedure as Rigopoulos and Seggewiss describe it in their review, with the haemodynamics from Oxford and the drug cautions from Brilakis.",
        },
        { kind: "h", text: "Who is a candidate" },
        {
          kind: "list",
          items: [
            "**Haemodynamic and clinical criteria today.** The 2024 Austrian consensus statement, which summarises the international guidelines including the 2023 ESC cardiomyopathy guideline, recommends septal reduction for a resting or maximal provoked gradient of 50 mmHg or more with exertional breathlessness (at least NYHA class II) or exertional syncope that persist **even on the maximum tolerated drug treatment, a cardiac myosin inhibitor included**. A myosin inhibitor added to existing treatment should be considered first when symptoms and a gradient of 50 mmHg or more persist despite maximum tolerated drugs and the LVEF is 55% or more. The 2023 ESC guideline's own recommendation table and its pre-assessment checklist for septal reduction could not be read for this lesson; check them before quoting a class.",
            "**The older wording.** Rigopoulos and Seggewiss, citing the 2014 European guideline, gave the same 50 mmHg threshold with NYHA class II–IV symptoms despite maximum tolerated medical therapy (class I), and recurrent exertional syncope from such obstruction (IIa); there are no data to support septal reduction in asymptomatic patients.",
            "**Work-up.** The authors advise cardiopulmonary exercise testing in every candidate for septal reduction, because patients adapt to their limits and symptoms can be vague. They warn that verapamil can paradoxically raise the gradient by lowering systemic vascular resistance. The operator should belong to a multidisciplinary HCM team; recent American guidelines set 10 procedures a year as the minimum to maintain skills.",
            "**Morphology:** asymmetric basal septal hypertrophy with systolic anterior motion of the mitral leaflet; septal thickness at the obstruction above 15 mm. Mid-ventricular obstruction can also be considered with echo guidance.",
            "**Surgery instead** when the obstruction comes from the mitral leaflets or papillary muscles, when there is a discrete subaortic membrane, or when other valve disease or coronary disease needing bypass surgery is present.",
            "**Less severe coronary disease** does not rule out ablation: it can follow successful PCI of all the coronary lesions if symptoms persist, and rarely, when the LAD is narrowed where the target septal branch arises, the LAD can be stented in the same sitting after the ablation.",
            "**Contraindication:** hypertrophy that does not involve the septum (apical or free wall only).",
            "**Provoke before you decide.** Obstruction varies with preload, afterload and contractility, so Valsalva or exercise should always be used, especially when the resting gradient is small. Oxford provokes in the lab with Valsalva or a vasodilator such as sublingual GTN; Brilakis warns that nitroglycerin worsens outflow obstruction and lists HOCM as a reason not to give it. Hb-specific-conditions-hocm sets out both positions.",
          ],
        },
        { kind: "h", text: "Setting up" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Admit the day before",
              detail: "So that beta-blockers, verapamil and disopyramide can be withheld on the day.",
            },
            {
              title: "2. Pacing wire first",
              detail:
                "A temporary wire is mandatory unless the patient already has a pacemaker or ICD; it can go in through the femoral vein. If the patient already has a pacemaker or ICD, raise its pacing output to avoid loss of capture, especially in high-risk patients (previous myectomy, baseline left bundle branch block, septal pacing).",
            },
            {
              title: "3. Two arterial accesses and a continuous gradient",
              detail:
                "A guide catheter (6 F is adequate; 7 F gives better support and pressure) sits at the left coronary ostium, usually a standard Judkins left, and a pigtail with holes only at its distal end records LV pressure. Guide pressure against LV pressure gives the gradient throughout the procedure. For the diagnostic study in patients without aortic stenosis, a 5 F distal-hole pigtail in the LV and a long 6 F sheath (45 cm or more) in the descending aorta give the gradient from one femoral puncture. In unclear cases a slow pullback of the pigtail locates the site of the maximal gradient; a two-lumen pigtail is an alternative. Holes only at the tip matter because side holes that straddle the obstruction would record a mixture of pressures from above and below it and under-read the gradient (author's explanation). Radial access is possible but loses continuous gradient monitoring.",
            },
            {
              title: "4. Record the baseline",
              detail:
                "Gradient at rest, during the strain phase of Valsalva and after an extrasystole. Oxford's pullback shows where the pressure falls (below the valve in obstruction), and the beat after an ectopic shows a lower aortic pressure in HOCM but a higher one in fixed aortic stenosis.",
            },
            { title: "5. Heparin and analgesia", detail: "Weight-adjusted heparin, and opiate analgesia before the alcohol." },
          ],
        },
        { kind: "tip", id: "haemo-asa-pacing-first" },
        { kind: "h", text: "Finding the right septal branch" },
        {
          kind: "steps",
          items: [
            {
              title: "6. Angiography in RAO cranial",
              detail:
                "The usual view for the septal branches. Look also at the diagonal and intermediate branches, and rarely the proximal RCA, for septal branches that arise atypically. In outflow obstruction the first large septal branch is commonly the target.",
            },
            {
              title: "7. Wire and balloon",
              detail:
                "A floppy angioplasty wire into the septal branch, then a short (6–10 mm) compliant over-the-wire balloon, usually 1.5–2.5 mm and compatible with alcohol, inflated at nominal pressure. Choose it slightly oversized so alcohol cannot flow back into the LAD, and place it just beyond the origin of the septal branch, not in the LAD, where it could cause a dissection.",
            },
            {
              title: "8. Myocardial contrast echo",
              detail:
                "Angiography is not enough: septal anatomy varies and collaterals are common. Withdraw the wire and inject 1–2 mL of echo contrast through the balloon lumen while transthoracic echo images parasternal, apical and subcostal views against baseline. The opacified area must be the septum next to the obstruction, and nothing else may light up: not the right ventricle, not a papillary muscle, not another LV segment. If it does, choose another branch.",
            },
            {
              title: "9. Prove the seal",
              detail: "Selective injection into the septal branch through the balloon confirms that the balloon seals it and that there is no collateral flow to distant territory.",
            },
          ],
        },
        {
          kind: "check",
          stem: "Contrast injected through the balloon in the first septal branch opacifies the basal septum at the point of mitral–septal contact, and also the anterolateral papillary muscle. What next?",
          options: [
            "Inject alcohol but halve the dose, so that the papillary muscle receives only a small amount",
            "Inject the full dose, because the target septum is opacified and that is all that matters",
            "Do not inject: this branch also supplies the papillary muscle; test another branch",
            "Move the balloon back into the LAD so the contrast spreads more evenly across the septum",
          ],
          answer: 2,
          explanation:
            "Rigopoulos and Seggewiss require both conditions: the branch must perfuse the septum next to the obstruction, and no other structure (right ventricle, papillary muscle, other LV segments) may opacify. Any alcohol in this branch reaches the papillary muscle whatever the dose. A balloon in the LAD risks dissection and lets alcohol reach the whole LAD territory.",
        },
        { kind: "h", text: "Giving the alcohol" },
        {
          kind: "steps",
          items: [
            {
              title: "10. Dose",
              detail:
                "1–3 mL of absolute alcohol; the authors' rule of thumb is 1 mL for every 10 mm of septal thickness on echo (typical figures; follow your unit's protocol).",
            },
            { title: "11. Rate", detail: "About 1 mL per minute, under continuous fluoroscopy to show that the balloon has not moved." },
            { title: "12. Stop on any warning", detail: "Stop injecting at once if the catheter moves or the injection meets resistance." },
            { title: "13. Wait", detail: "Leave the balloon inflated for another ten minutes after the last injection; shorter times have been linked to more complications." },
            {
              title: "14. Check",
              detail: "After removing the balloon, an angiogram should show the septal branch occluded and normal LAD flow. Record the gradient again at rest and with provocation.",
            },
            {
              title: "15. Judge later",
              detail:
                "If the ablated area on echo is satisfactory, the authors wait 3–6 months for remodelling to lower the gradient further rather than ablate a second branch at once; if the area is patchy and the gradient unchanged, they test another branch that would cover the missed part.",
            },
          ],
        },
        { kind: "h", text: "Heart block and the other complications" },
        {
          kind: "list",
          items: [
            "**Conduction defects in up to 50%** in the first hours, mostly resolving in the lab or on the coronary care unit; the first septal branch runs close to the His bundle and right bundle. Only a minority eventually need a permanent pacemaker: 5–10% in Rigopoulos and Seggewiss's review of experienced centres, but 20% in the early Mayo series of 138 patients they cite, and 10–20% in the 2024 Austrian consensus. Contrast echo and smaller alcohol volumes have reduced the need for permanent pacing.",
            "**Higher risk** with pre-existing AV conduction disease or left bundle branch block; a permanent pacemaker before ASA can be recommended. If the patient needs an ICD, implanting it first is practical.",
            "**Alcohol in the LAD** from an incompletely sealed branch, collaterals, balloon slippage or rupture, or early deflation causes a remote infarct. Prevention is the protocol itself: slightly oversized balloon, careful angiography of the branch, watching the balloon during slow injection, deflation after ten minutes.",
            "**Technical complications** (rare in high-volume centres): coronary dissection or spasm, tamponade, pulmonary embolism, cardiogenic shock, stroke, access problems.",
            "**Hypotension during the case:** Brilakis advises phenylephrine as the vasopressor of choice in hypertrophic cardiomyopathy, because an inotrope can worsen intracavitary obstruction, and no nitroglycerin.",
            "**Coronary injections may fill poorly**: Brilakis lists HOCM among the high-flow states that defeat a weak injection or a small catheter.",
          ],
        },
        {
          kind: "check",
          stem: "A 70-year-old man with left bundle branch block on the baseline ECG is referred for alcohol septal ablation. What does the evidence suggest about pacing?",
          options: [
            "He is at higher risk of complete block; a permanent pacemaker before ASA can be recommended",
            "No special plan: permanent pacing is needed in under 1% of patients after ablation",
            "Left bundle branch block protects against block, because the right bundle is never affected",
            "A temporary wire is not needed in his case, since an existing block cannot get any worse",
          ],
          answer: 0,
          explanation:
            "Rigopoulos and Seggewiss: pre-existing AV conduction abnormalities or left bundle branch block raise the risk of complete heart block, and permanent pacing before ASA can be recommended. Early conduction defects occur in up to half of patients, and 5–10% eventually need a permanent pacemaker in their review. The first septal branch runs close to the His bundle and right bundle, so a patient already relying on the right bundle has little reserve.",
        },
        { kind: "h", text: "Aftercare and results" },
        {
          kind: "list",
          items: [
            "**Coronary care for at least 48 hours** with continuous rhythm and haemodynamic monitoring; enzymes every 6–8 hours to find the peak CK.",
            "**The temporary wire** can come out the day after if there is no AV block; if longer pacing is needed, the authors prefer a jugular or subclavian route.",
            "**Arrhythmias:** ventricular arrhythmias early after ablation are regarded as benign, as in acute ischaemia; later ones count as a sudden death risk factor, and ICD decisions follow standard risk stratification.",
            "**Predictors of success** in a Mayo Clinic study cited by the authors: age 65 or over, a gradient below 100 mmHg, a septum of 18 mm or less and a left atrium under 40 mm.",
            "**Results:** relief of obstruction in 90% or more in the authors' review; a second ablation is needed in about 3–14%. In the Euro-ASA registry of 1,275 patients, 30-day mortality was 1%, survival 98%, 89% and 77% at 1, 5 and 10 years, the gradient fell from 67 to 16 mmHg and NYHA class from 2.9 to 1.6; a higher residual gradient was one of the independent predictors of death.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Starting without a pacing wire because only a minority need permanent pacing.",
            "Choosing the branch from the angiogram alone: contrast echo must show the target and nothing else.",
            "An undersized balloon, or one sitting in the LAD: backflow or dissection.",
            "Injecting quickly, or deflating as soon as the alcohol is in: wait ten minutes.",
            "Treating hypotension with an inotrope or nitroglycerin in obstructive physiology.",
            "Removing the wire on the table; pull it the next day only if there is no AV block.",
            "Ablating a second branch at once when the first has given a good echo result; the gradient keeps falling for months.",
          ],
        },
        {
          kind: "pearl",
          text: "Keep the gradient on the screen from the first minute to the last: guide pressure against a distal-hole pigtail in the LV. It tells you the baseline, the effect of the balloon test, and the result after alcohol, without a single extra crossing.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open the 'Exertional syncope in a young man with a loud murmur' scenario. Record the LV–aortic gradient at rest and on the beat after an ectopic (watch the aortic pressure fall), and decide whether a 50 mmHg threshold is reached at rest or on provocation. A Valsalva provocation and septal branch selection in the PCI lab, linked to this gradient, have been requested.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Engage the left coronary artery with a JL4 and acquire an RAO cranial run. Identify the septal branches leaving the LAD and decide which is the first large septal branch, the usual first target for ablation.",
        },
        { kind: "video", id: "gcsqWvUe0wQ", note: "Elias Hanna on additional valve and HOCM haemodynamics." },
        { kind: "video", id: "azHS4z4gllQ", note: "Elias Hanna's cases of combined aortic stenosis and HOCM, with echo and catheter haemodynamics." },
        {
          kind: "keypoints",
          items: [
            "Candidate: gradient of 50 mmHg or more at rest or provoked, symptoms despite maximum tolerated medical treatment, which now includes a cardiac myosin inhibitor where appropriate; septum above 15 mm at the obstruction; no mitral or other lesion needing surgery.",
            "Pacing wire first; two arterial accesses for a continuous gradient; RAO cranial for the septal branches.",
            "Short slightly oversized over-the-wire balloon just inside the septal branch, never in the LAD.",
            "Contrast echo: target septum opacified and nothing else; prove the seal by selective injection.",
            "Alcohol 1–3 mL (about 1 mL per 10 mm of septum) at 1 mL per minute; balloon up ten more minutes.",
            "Conduction defects up to 50% early; permanent pacing 5–10% in the authors' review (10–20% in other reports); LBBB raises the risk.",
            "At least 48 hours of monitoring; wire out next day only if no AV block; judge the gradient at 3–6 months.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "hb-additional-procedures-septal-closure",
      title: "PFO and ASD closure: from the catheter study to follow-up",
      minutes: 14,
      topics: ["sh-pfo-asd"],
      sources: [
        O("ch 5: Atrial septal defect"),
        O("ch 4: Accessing the left heart"),
        O("ch 5: Myocardial infarction with non-obstructed coronary arteries"),
        O("ch 3: Femoral vein access"),
        O("ch 10: Cardiac tamponade"),
      ],
      refs: [...OX, "pfo-position-2019", "amin-asd-erosion-2004", "rommens-pfo-af-2026", "rojko-pfo-residual-2026", "anggrahini-ice-tee-2026", "esc-achd-2020"],
      blocks: [
        {
          kind: "p",
          text: "A patent foramen ovale (PFO) and a secundum atrial septal defect (ASD) are both closed with a double-disc occluder, usually delivered from the femoral vein (the route Oxford uses for routine right heart work; the Academy lessons sh-pfo-closure and sh-asd describe the delivery), but the reasons differ: a PFO is closed to prevent paradoxical embolism, an ASD to remove a left-to-right shunt that loads the right heart. The Academy lessons sh-pfo-stroke, sh-pfo-closure and sh-asd cover patient selection, the trials, the rims and the deployment; hb-cardiac-catheterisation-shunts covers the oximetry run. This lesson joins them into one sequence and adds what Oxford and the verified literature say about the study, imaging, sizing and the complications that appear after the patient has gone home.",
        },
        { kind: "h", text: "Where the catheter lab meets the septum" },
        {
          kind: "list",
          items: [
            "**ASD (Oxford):** often presents with breathlessness or palpitation from right heart failure and pulmonary hypertension; echo (TTE and TOE) will usually have supported the diagnosis. The right heart study measures pressures, looks for pulmonary hypertension, quantifies the shunt and excludes anomalous pulmonary venous drainage: PA pressure, a right heart pullback, an attempt to cross the defect for a left atrial saturation, then the shunt calculation.",
            "**Closure is planned with the study.** Oxford notes that secundum ASDs are now commonly closed percutaneously, often planned at the time of the catheter study, with transoesophageal or intracardiac echo to guide it (its Fig 5.8 shows a large defect on TOE and the septal occluder in place).",
            "**The septum as a route.** Oxford lists a PFO and an ASD, as well as a transseptal puncture, as ways from the right atrium into the left heart. In the author's view, a catheter that passes into the left atrium unexpectedly during a right heart study is therefore worth recording in the report.",
            "**PFO and myocardial infarction:** in Oxford's MINOCA section, paradoxical embolism through an abnormal connection can cause infarction, often with an abrupt occlusion of a terminal branch, sometimes with no visible embolus. Suspicion should rise in young patients without risk factors; transthoracic or transoesophageal echo is needed to find the communication.",
          ],
        },
        {
          kind: "check",
          stem: "A 31-year-old with no risk factors has an infarct; the angiogram shows an abrupt cut-off of a distal LAD branch and otherwise normal arteries. Which next step follows Oxford's MINOCA teaching?",
          options: [
            "Stent the distal branch and discharge without further tests once the stent is well expanded",
            "Diagnose coronary spasm and start a calcium channel blocker straight away, without any further assessment",
            "Arrange a right ventricular endomyocardial biopsy to look for myocarditis as the first test",
            "Consider paradoxical embolism and arrange echocardiography to look for an intracardiac communication",
          ],
          answer: 3,
          explanation:
            "Oxford lists paradoxical embolism as a MINOCA mechanism: an abrupt terminal branch occlusion in a young patient without risk factors should raise the suspicion, and transthoracic or transoesophageal echo is needed to identify the communication. Spasm needs provocation testing to confirm it, and Oxford confirms myocarditis on MRI, with biopsy now rarely performed.",
        },
        { kind: "h", text: "The septal occluder sequence" },
        {
          kind: "steps",
          items: [
            {
              title: "1. Confirm the indication",
              detail:
                "PFO: the stroke work-up, RoPE and the trials in sh-pfo-stroke, with the 2019 European position paper's approach. ASD: right ventricular volume load and pulmonary vascular resistance as set out in sh-asd from the 2020 ESC adult congenital guideline.",
            },
            {
              title: "2. Femoral venous access",
              detail: "Oxford's routine route for right heart work; the sheath sidearm is flushed to prevent thrombus.",
            },
            {
              title: "3. Choose the imaging",
              detail:
                "TOE or intracardiac echo (Oxford). In a 2026 meta-analysis of 12 studies (5,054 ASD or PFO closures), ICE gave shorter procedures (by about 21 minutes) with similar fluoroscopy time, similar success and closure rates, and fewer major complications (risk ratio 0.77) than TOE. The pooled studies were comparative clinical studies in children and adults, and the authors call ICE a promising alternative, so the choice still rests on local expertise and the anatomy.",
            },
            {
              title: "4. Cross and study",
              detail: "For an ASD, cross the defect, take the left atrial saturation and complete the shunt calculation (hb-cardiac-catheterisation-shunts).",
            },
            {
              title: "5. Size without overstretching (ASD)",
              detail:
                "Sh-asd describes balloon sizing to the stop-flow diameter. Amin and colleagues add that the defect should not be overstretched during balloon sizing, because an oversized device raises the risk of erosion.",
            },
            {
              title: "6. Deploy, test and release",
              detail:
                "Left atrial disc, waist, right atrial disc; both discs on the correct sides; a push–pull test; then release (sh-pfo-closure, sh-asd). For a PFO, the position paper notes that larger devices carry a higher risk of residual shunt.",
            },
            {
              title: "7. Aftercare",
              detail:
                "The position paper bases antithrombotic therapy after PFO closure on the strategies used in the randomised trials, notes that the device may keep endothelialising for up to five years, and advises considering antibiotic prophylaxis against endocarditis before invasive or surgical procedures in the first six months after implantation, and probably beyond that if a residual shunt persists. Five of the six randomised trials used dual antiplatelet therapy for the first one to six months after closure.",
            },
          ],
        },
        { kind: "tip", id: "structural-septal-occluder-no-overstretch" },
        { kind: "tip", id: "structural-septal-occluder-release-check" },
        { kind: "h", text: "What happens after the patient goes home" },
        {
          kind: "table",
          head: ["Problem", "What the evidence shows", "Source"],
          rows: [
            [
              "Atrial fibrillation after PFO closure",
              "The most frequent undesirable event; the excess risk does not extend beyond 45 days. In 867 patients followed for a median 11.7 years, new AF occurred in 11.2% (1.0 per 100 patient-years), 26.8% of it within three months; older age, larger device and moderate or severe valve regurgitation predicted it.",
              "pfo-position-2019; rommens-pfo-af-2026",
            ],
            [
              "Residual shunt after PFO closure",
              "Complete closure rose from 64% immediately to 80% at six months and then stayed level; functional closure (10 bubbles or fewer) was 93% from the start. Causes of a larger residual shunt included leakage at the device, a fenestration or ASD, and pulmonary arteriovenous malformation.",
              "rojko-pfo-residual-2026",
            ],
            ["Device thrombosis", "The most frequent late complication of PFO closure, at 1.0–2.0%.", "pfo-position-2019"],
            [
              "Erosion of an ASD device",
              "Rare (0.1% in the United States). Among 28 reported adverse-event cases (14 in the United States), each erosion was at the roof of the atria beside the aortic root; 89% had a deficient aortic rim and the defects were high, suggesting a deficient superior rim; the device was larger relative to the unstretched defect than in the approval trials. A small pericardial effusion at 24 hours calls for closer follow-up.",
              "amin-asd-erosion-2004",
            ],
            ["Erosion of a PFO device", "Reported only anecdotally.", "pfo-position-2019"],
          ],
        },
        { kind: "tip", id: "structural-septal-occluder-effusion-24h" },
        {
          kind: "check",
          stem: "The morning after ASD closure, the echo shows a small new pericardial effusion. The defect was high, with a deficient aortic rim, and the device was chosen at the upper end of the sizing range. How do you interpret this?",
          options: [
            "As an expected post-procedure finding needing no change to the standard follow-up plan",
            "As a warning: deficient aortic and superior rims, oversizing and early effusion mark erosion risk",
            "As proof of device embolisation into the pericardial space, which needs immediate snare retrieval in the lab",
            "As a sign the defect was undersized, so a second, larger device should be planned straight away",
          ],
          answer: 1,
          explanation:
            "Amin and colleagues found every erosion at the roof of the atria beside the aortic root, a deficient aortic rim in 89%, high defects suggesting a deficient superior rim, and larger device-to-defect ratios; they advise closer follow-up when a small effusion is present at 24 hours and warn against overstretching during balloon sizing. An effusion does not mean embolisation, and a larger device adds to the erosion risk.",
        },
        {
          kind: "pitfalls",
          items: [
            "Missing anomalous pulmonary venous drainage during the ASD study: Oxford lists excluding it as a purpose of the study.",
            "Overstretching the defect with the sizing balloon and then choosing an oversized device.",
            "Judging a PFO closure as failed on the table: complete closure keeps increasing for six months.",
            "Discharging without telling the patient about palpitations: AF is the commonest event after PFO closure.",
            "Ignoring a small effusion at 24 hours after an ASD device in a patient with a deficient aortic rim.",
            "Forgetting antibiotic prophylaxis before invasive or surgical procedures in the first six months after implantation (longer if a residual shunt persists).",
          ],
        },
        {
          kind: "pearl",
          text: "Before you release, run through the three erosion questions for an ASD device: is the aortic rim deficient, is the defect high, and is this device larger than the defect needs? Any yes, especially with a small effusion at 24 hours, calls for the closer follow-up Amin and colleagues advise.",
        },
        {
          kind: "sim",
          sim: "haemo",
          task: "Open the 'Palpitations and a fixed split second heart sound' scenario. Take the SVC, IVC, right atrial, PA and aortic saturations, find the step-up, build the mixed venous saturation from the caval samples, calculate Qp:Qs, and decide whether the shunt supports closure.",
        },
        {
          kind: "sim",
          sim: "laao",
          task: "Run the appendage occluder's deploy, tug and release sequence, paying attention to the checks before release. A septal occluder variant of this flow, with balloon sizing and erosion risk factors, has been requested.",
        },
        { kind: "video", id: "Jxm_X5EDPWw", note: "Elias Hanna on shunt haemodynamics, left-to-right and right-to-left, from simple to complex calculations." },
        { kind: "video", id: "qE1c8z5CPwM", note: "Elias Hanna on quick assessment of cardiac shunts and a quick Qp/Qs calculation." },
        {
          kind: "keypoints",
          items: [
            "ASD study (Oxford): PA pressure, pullback, cross for a left atrial saturation, shunt calculation, exclude anomalous pulmonary veins; closure often planned at the same time.",
            "Imaging: TOE or ICE; ICE shortened procedures with fewer major complications in a 2026 meta-analysis.",
            "Do not overstretch an ASD when sizing; oversizing and deficient aortic or superior rims mark erosion risk (0.1% in the United States).",
            "PFO aftercare: antithrombotic therapy as in the trials (dual antiplatelet therapy for one to six months in five of six), antibiotic prophylaxis before invasive procedures in the first six months, endothelialisation for up to five years.",
            "AF is the commonest event after PFO closure; the early excess fades after 45 days but new AF accrues over years.",
            "Judge residual shunt at six months: complete closure rose from 64% to 80%.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "hb-additional-procedures-q1",
      stem: "You have positioned a temporary wire. Following Oxford, how do you measure the threshold and set the output?",
      options: [
        "Start at 3 V, lower slowly to loss of capture, raise to recapture; aim for 1 V or less; set at least 3× threshold",
        "Start at 0.1 V, raise until capture appears; accept up to 5 V as normal; set the output exactly at that threshold",
        "Start at 3 V and leave it there, since thresholds are only measured on the ward the next day after insertion",
        "Pace below the intrinsic rate, lower the output to loss of sensing, and set the output to twice that value",
      ],
      answer: 0,
      explanation:
        "Oxford paces above the intrinsic rate, starts at 3 V, turns the output down slowly until capture is lost and back up to recapture; that is the threshold, ideally 1 V or less, and the output then goes to a minimum of three times that value. Pacing below the intrinsic rate tests sensing, not capture, and setting the output at the threshold leaves no margin.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-additional-procedures-q2",
      stem: "Which pair of fluoroscopic signs does Oxford give for a pacing wire that has entered the coronary sinus?",
      options: [
        "More caudal on the AP view, and anterior on the lateral view, like a normal right ventricular wire",
        "A tip that crosses the spine to the left on AP, and that pulsates with the pulmonary artery on lateral",
        "More cranial on the AP view, and posterior on the lateral view, where an RV lead would run anteriorly",
        "A loop in the right atrium on AP, and a tip that disappears from view on the lateral projection",
      ],
      answer: 2,
      explanation:
        "The coronary sinus opens above the tricuspid valve; Oxford's signs are a more cranial position on AP and a posterior course on the lateral, whereas an RV lead runs anteriorly. An atrial loop is a manoeuvre for crossing the tricuspid valve, not a sign of the coronary sinus.",
      difficulty: 2,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-additional-procedures-q3",
      stem: "A haemodynamically stable patient in the lab has sustained monomorphic VT at 160 per minute, and an RV wire is in place. Which overdrive pacing plan follows Oxford?",
      options: [
        "Pace at 120 per minute (slower than the VT) at 1 V for one minute, then reduce the rate gradually",
        "Pace at 300 per minute at maximum output and continue until the VT stops by itself after a minute or more",
        "Pace at 165 per minute at threshold output, then taper the rate down slowly over several minutes",
        "Pace at 175–180 per minute, output 5–10 V, stop abruptly after 5–10 s of capture, defibrillator ready",
      ],
      answer: 3,
      explanation:
        "Oxford paces 15–20 per minute faster than the VT (here 175–180), with an output of 5–10 V if needed, recognises capture by a change in QRS morphology and a rise to the pacing rate, and stops abruptly after 5–10 seconds of capture, ready to defibrillate because the VT can accelerate or degenerate. Pacing slower than the VT cannot capture it, and a slow taper is not Oxford's method.",
      difficulty: 3,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "hb-additional-procedures-q4",
      stem: "Which comparison of endomyocardial biopsy complications is supported by the two series in the lesson?",
      options: [
        "Transplant recipients had more perforations than cardiomyopathy patients, because of the scarred donor heart",
        "Cardiomyopathy biopsies had definite perforation in 0.5%, two of three fatal; transplant biopsies had none",
        "Both series reported definite perforation in about 5% of procedures and a mortality of about 1% each",
        "Neither series reported any arrhythmia or conduction disturbance during the sampling part of the biopsy",
      ],
      answer: 1,
      explanation:
        "Deckers (546 biopsies, cardiomyopathy) reported 6% complications with definite perforation in 0.5% and two deaths among three perforations; Baraldi-Junkins (2,454 transplant biopsies) reported 3.0%, mostly at insertion, with no perforations or deaths. Both recorded arrhythmias and conduction abnormalities during biopsy (1.1% and 1%; 0.25% and 0.2%).",
      difficulty: 3,
      refs: ["deckers-emb-1992", "baraldi-junkins-emb-transplant-1993"],
    },
    {
      id: "hb-additional-procedures-q5",
      stem: "In Keeble's description of balloon aortic valvuloplasty, what are the rapid pacing rate and inflation sequence?",
      options: [
        "120–140 per minute; inflate slowly over 30 seconds while pacing continues during the recovery period",
        "250–300 per minute; inflate first, then start pacing once the balloon is fully expanded across the valve",
        "180–220 per minute; when the pressure falls, check position, inflate about 3 s, deflate, stop pacing",
        "No pacing is needed with any balloon; inflate at nominal pressure for one minute and then deflate",
      ],
      answer: 2,
      explanation:
        "Keeble paces at 180–220 per minute to drop stroke volume, confirms the balloon is unchanged once the pressure falls, inflates rapidly for about 3 seconds, deflates, stops pacing and pulls back to the ascending aorta. Pacing after inflation defeats its purpose of steadying the balloon; Keeble notes that pacing is not essential with some non-compliant balloon designs, not that it is never needed.",
      difficulty: 2,
      refs: ["keeble-bav-2016"],
    },
    {
      id: "hb-additional-procedures-q6",
      stem: "During BAV, which haemodynamic change after an inflation most suggests significant acute aortic regurgitation?",
      options: [
        "A rise in LVEDP with a fall in aortic diastolic pressure after the inflation has been completed",
        "A fall in the peak gradient to 40% of its baseline value with a brisker arterial upstroke on the trace",
        "A rise in aortic systolic pressure with a slight fall in heart rate once pacing has been stopped",
        "A transient fall in arterial pressure during rapid pacing that recovers fully within a minute",
      ],
      answer: 0,
      explanation:
        "Keeble: a clear jump in LVEDP or a fall in aortic diastolic pressure points to regurgitation severe enough to matter. A falling gradient, a brisker upstroke and a higher systolic pressure are signs of a good result, and a fall during rapid pacing is intended.",
      difficulty: 2,
      refs: ["keeble-bav-2016"],
    },
    {
      id: "hb-additional-procedures-q7",
      stem: "What does the 2025 ESC/EACTS guideline say about balloon aortic valvuloplasty?",
      options: [
        "It is first-line therapy for severe aortic stenosis in patients over 80 who are unsuitable for surgery",
        "It is recommended for every patient before TAVI, to test whether the symptoms improve after dilatation",
        "It is the preferred definitive treatment in cardiogenic shock because it avoids leaving an implant behind",
        "It may rarely be considered as a bridge in decompensated stenosis; TAVI has largely replaced it in shock",
      ],
      answer: 3,
      explanation:
        "The 2025 guideline: BAV may, rarely, be used to bridge carefully selected patients with decompensated stenosis to TAVI or surgery, or before urgent high-risk non-cardiac surgery, carries significant acute risks, and has largely been replaced by TAVI in cardiogenic shock because of the risk of severe regurgitation and death. Testing the therapeutic response is a use Keeble describes in borderline patients, not a routine step before every TAVI.",
      difficulty: 3,
      refs: ["esc-vhd-2025", "keeble-bav-2016"],
    },
    {
      id: "hb-additional-procedures-q8",
      stem: "In Hung's series of 799 single-balloon commissurotomies, what happened to systemic embolism?",
      options: [
        "It occurred at a steady 1.4% throughout, unaffected by any change in technique or experience",
        "It was eliminated only by switching from femoral venous access to a jugular venous route",
        "All 11 emboli occurred among the first 353 patients, before pre-procedure TOE became routine",
        "It occurred mainly in pliable valves and was absent in heavily calcified valves throughout",
      ],
      answer: 2,
      explanation:
        "Hung and colleagues: systemic embolic events occurred in 11 patients (1.4%), all among the first 353, before routine pre-procedure TOE. That is the evidence behind the guideline's call for TOE to exclude left atrial thrombus before PMC. With growing experience and their technical refinements (height-based sizing, stepwise dilatation, no traction on the septum), severe regurgitation and significant shunting also fell (shunts from 12% to 6%).",
      difficulty: 3,
      refs: ["hung-inoue-complications-1999", "esc-vhd-2021"],
    },
    {
      id: "hb-additional-procedures-q9",
      stem: "Which group lists only features the 2021 ESC/EACTS guideline counts as unfavourable for PMC?",
      options: [
        "Previous commissurotomy, permanent AF, echo score above 8 and calcification seen on fluoroscopy",
        "Young age, sinus rhythm, pliable leaflets and a valve area of 1.4 cm² on transthoracic echocardiography",
        "Pregnancy wish, PA systolic pressure of 55 mmHg, and need for major non-cardiac surgery",
        "Mild mitral regurgitation, NYHA class II symptoms and a Cormier score of 1 on assessment",
      ],
      answer: 0,
      explanation:
        "The guideline's unfavourable characteristics include, clinically, old age, previous commissurotomy, NYHA IV, permanent AF and severe pulmonary hypertension, and anatomically, an echo score above 8, Cormier 3, fluoroscopic calcification, a very small area and severe tricuspid regurgitation. Pregnancy wish, a systolic PA pressure above 50 mmHg and major non-cardiac surgery are the guideline's examples of a high risk of haemodynamic decompensation, which in the 2021 guideline are grounds to consider PMC even in an asymptomatic patient.",
      difficulty: 2,
      refs: ["esc-vhd-2021"],
    },
    {
      id: "hb-additional-procedures-q10",
      stem: "For alcohol septal ablation in a 20 mm septum, which plan matches the technique Rigopoulos and Seggewiss describe?",
      options: [
        "About 6 mL of alcohol injected as a single rapid bolus, with the balloon deflated straight afterwards",
        "About 2 mL of alcohol injected into the LAD just proximal to the septal branch to spread it evenly",
        "About 1 mL of alcohol followed by a saline flush, then immediate deflation and a final angiogram",
        "About 2 mL of alcohol at 1 mL per minute, balloon kept inflated ten minutes after the last injection",
      ],
      answer: 3,
      explanation:
        "The authors give 1–3 mL, about 1 mL for every 10 mm of septal thickness (so about 2 mL here), at 1 mL per minute, and leave the balloon inflated for another ten minutes because shorter times have been linked to more complications. Large volumes, rapid boluses, early deflation and injection in the LAD all risk alcohol reaching territory outside the septum.",
      difficulty: 3,
      refs: ["rigopoulos-asa-2016"],
    },
    {
      id: "hb-additional-procedures-q11",
      stem: "According to Rigopoulos and Seggewiss, what is the expected course of conduction disturbance after alcohol septal ablation?",
      options: [
        "Conduction defects in under 1%, and permanent pacing almost never needed after the procedure",
        "Conduction defects in up to 50% early, mostly resolving; permanent pacing in about 5–10%",
        "Complete heart block in every patient, permanent in about half of them by the time of discharge",
        "Block occurring only weeks later, so the temporary wire can be removed as soon as alcohol is in",
      ],
      answer: 1,
      explanation:
        "Rigopoulos and Seggewiss: up to half of patients develop conduction defects in the first hours, which mostly resolve in the lab or coronary care unit, and 5–10% eventually need a permanent pacemaker. That is why the wire is placed first and removed the next day only if there is no AV block.",
      difficulty: 2,
      refs: ["rigopoulos-asa-2016"],
    },
    {
      id: "hb-additional-procedures-q12",
      stem: "Which combination did Amin and colleagues associate with erosion of an ASD occluder?",
      options: [
        "A deficient inferior rim, a small device and erosion through the free wall of the right ventricle",
        "A long PFO tunnel, an atrial septal aneurysm, and erosion into the coronary sinus several years after closure",
        "A deficient aortic rim, a high defect and a large device for the unstretched defect, near the aortic root",
        "A normal set of rims, a well-sized device and erosion caused only by endocarditis after closure",
      ],
      answer: 2,
      explanation:
        "In 28 reported adverse-event cases (14 in the United States), Amin and colleagues found every erosion at the roof of the atria beside the aortic root; 89% had a deficient aortic rim, the defects were high (suggesting a deficient superior rim), and the device was larger relative to the unstretched defect than in the approval trials. They advise against overstretching during balloon sizing and closer follow-up for a small effusion at 24 hours.",
      difficulty: 3,
      refs: ["amin-asd-erosion-2004"],
    },
  ],
  sims: [
    { sim: "pacing", task: "Inferior STEMI with complete heart block: femoral wire, rule out the coronary sinus on the lateral view, measure the threshold and set the output at three times it." },
    { sim: "tavi", task: "Predilatation with and without rapid pacing: choose the balloon from the annulus and compare balloon stability." },
    { sim: "haemo", task: "HOCM scenario: gradient at rest and after an ectopic, as the baseline for septal ablation." },
    { sim: "haemo", task: "ASD scenario: saturation run, step-up and Qp:Qs before closure." },
  ],
  caseIds: ["hb-additional-procedures-case-asa", "hb-additional-procedures-case-bav"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases: CaseStudy[] = [
  {
    id: "hb-additional-procedures-case-asa",
    title: "Alcohol septal ablation: from pacing wire to coronary care",
    trackId: "cath-handbook",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Rigopoulos and Seggewiss 2016 (alcohol septal ablation technique and complications); Oxford Handbook ch 5 (cardiomyopathy) and ch 9 (temporary pacemaker); Brilakis 3.2 and 3.6 (nitroglycerin and phenylephrine in HOCM)",
    },
    summary:
      "A symptomatic patient with obstructive hypertrophic cardiomyopathy comes for alcohol septal ablation. Prepare the pacing, measure and provoke the gradient, choose and test the septal branch, give the alcohol safely, handle heart block and hypotension, and plan the aftercare.",
    presentation:
      "A 66-year-old woman has NYHA class III breathlessness despite maximum tolerated beta-blocker and disopyramide; a cardiac myosin inhibitor was discussed and she declined it. Echo shows asymmetric basal septal hypertrophy of 20 mm with systolic anterior motion of the mitral leaflet, no intrinsic mitral valve abnormality, and an outflow gradient of 40 mmHg at rest rising to 85 mmHg with Valsalva. The heart team has recommended alcohol septal ablation. Her ECG shows sinus rhythm with a normal PR interval and right bundle branch block.",
    findings: [
      "Blood pressure 118/70 mmHg, heart rate 62 beats/min, sinus rhythm",
      "Coronary angiography last year: no significant coronary disease",
      "Medication withheld on the morning of the procedure after admission the day before",
      "Femoral arterial and venous access planned; transthoracic echo with contrast available in the lab",
    ],
    steps: [
      {
        id: "setup",
        prompt: "How do you set up before any balloon goes into a septal branch?",
        options: [
          {
            text: "Temporary pacing wire through the femoral vein, a guide at the left coronary ostium and a distal-hole pigtail in the LV for a continuous gradient",
            best: true,
            feedback:
              "Right. Rigopoulos and Seggewiss make the temporary wire mandatory in a patient without a pacemaker, and two arterial accesses let guide pressure against LV pressure show the gradient throughout.",
            stateDelta: { stability: 5 },
          },
          {
            text: "No pacing wire: only 5–10% of patients need a permanent pacemaker, so the risk does not justify one",
            feedback:
              "The 5–10% figure is for permanent pacing; up to half of patients have conduction defects in the first hours. The wire goes in first.",
            stateDelta: { stability: -10, flags: ["no-wire"] },
            next: "no-wire",
          },
          {
            text: "A single radial access with the guide only, and the gradient estimated from echo during the case",
            feedback:
              "Radial access is possible, but the authors note it gives up continuous gradient monitoring, and there is still no pacing wire.",
            stateDelta: { stability: -5, flags: ["no-wire"] },
            next: "no-wire",
          },
        ],
      },
      {
        id: "no-wire",
        kind: "consequence",
        prompt: "While the pigtail is being manipulated in the LV, against the left side of the septum, complete heart block appears with a slow escape and a pressure of 70/40 mmHg. What now?",
        options: [
          {
            text: "Start external pacing at once, pull the pigtail back from the LV, and place a femoral venous wire before going any further",
            best: true,
            feedback: "External pacing is Oxford's temporising measure while the wire goes in. Oxford notes that advanced block during catheterisation usually arises where conduction is already delayed, from mechanical injury to a bundle branch or from ischaemia; with her right bundle already blocked, catheter trauma to the left bundle left nothing to conduct. The wire should have been there from the start.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Carry on to the gradient and the septal branch, and deal with the rhythm afterwards",
            feedback: "Carrying on in an unprotected patient in complete block is the wrong order. Restore a safe rhythm first.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "gradient",
        prompt: "The resting gradient in the lab is 35 mmHg. How do you complete the baseline?",
        info: "Simultaneous guide and LV pressures are on screen. The patient is awake and able to cooperate.",
        options: [
          {
            text: "Record the gradient during the strain phase of Valsalva and on the beat after an extrasystole",
            best: true,
            feedback:
              "These are the authors' provocations, and Oxford's: obstruction depends on loading, so a modest resting gradient must be provoked. In HOCM the aortic pressure after an ectopic is usually lower than before it.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give sublingual GTN to provoke it, with phenylephrine drawn up",
            acceptable: true,
            feedback:
              "Oxford uses a vasodilator such as GTN to accentuate the gradient, but Brilakis warns that nitroglycerin worsens outflow obstruction and advises against it in HOCM. Valsalva and the post-ectopic beat give the answer without that risk.",
            stateDelta: { stability: -5 },
          },
          {
            text: "Abandon the procedure: a resting gradient under 50 mmHg means she is not a candidate",
            feedback: "The threshold is 50 mmHg at rest or on provocation, and her echo gradient rose to 85 mmHg with Valsalva.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "branch",
        prompt: "Valsalva raises the gradient to 90 mmHg. How do you find the target branch?",
        options: [
          {
            text: "RAO cranial left coronary angiography; also inspect the diagonal and intermediate branches for atypical septal origins; first large septal branch as the likely target",
            best: true,
            feedback: "The authors' view and their warning about atypically arising septal branches.",
            stateDelta: { stability: 5 },
          },
          {
            text: "LAO caudal only, and pick the largest septal branch wherever it arises",
            feedback: "RAO cranial is the usual view for septal branches, and the target is the branch supplying the septum at the obstruction, not simply the largest.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "balloon",
        prompt: "Where and what balloon do you place?",
        options: [
          {
            text: "A short (6–10 mm) compliant over-the-wire balloon, slightly oversized for the branch, just beyond its origin and not in the LAD",
            best: true,
            feedback: "Slight oversizing stops alcohol flowing back into the LAD; keeping out of the parent vessel avoids dissection.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A balloon straddling the septal origin with its proximal half in the LAD, to seal the ostium",
            feedback: "A balloon in the parent vessel can dissect the LAD, and the authors place it just inside the septal branch.",
            stateDelta: { stability: -15, flags: ["lad-balloon"] },
            next: "lad-injury",
          },
          {
            text: "A deliberately undersized balloon so that it cannot injure the septal branch",
            feedback: "An undersized balloon does not seal the branch, so alcohol can reflux into the LAD.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "lad-injury",
        kind: "consequence",
        prompt: "After inflation, contrast through the guide shows a new linear filling defect in the LAD at the septal origin. What do you do?",
        options: [
          {
            text: "Abandon alcohol in this position, treat the LAD dissection as a coronary complication, and reconsider the branch only once the LAD is secure",
            best: true,
            feedback: "Coronary dissection is among the technical complications the authors list; the LAD comes first.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject alcohol now, before the dissection extends",
            feedback: "Alcohol near a dissected LAD risks a large anterior infarct. Stop and secure the LAD.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "mce",
        prompt: "Through the balloon lumen, 1–2 mL of echo contrast opacifies the basal septum at the contact point and also the anterolateral papillary muscle. What next?",
        options: [
          {
            text: "No alcohol in this branch; test another septal branch with contrast echo",
            best: true,
            feedback: "The branch must perfuse the septum next to the obstruction and nothing else. A papillary muscle would receive alcohol whatever the dose.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inject a reduced dose of alcohol into this branch",
            feedback: "Any alcohol here reaches the papillary muscle. The test has said no.",
            stateDelta: { stability: -15, flags: ["papillary"] },
            next: "papillary",
          },
        ],
      },
      {
        id: "papillary",
        kind: "consequence",
        prompt: "Echo after the injection shows new hypokinesia of the anterolateral papillary muscle region and new moderate mitral regurgitation. What do you take from this?",
        options: [
          {
            text: "Stop: inject nothing more, monitor closely, and record the lesson that contrast echo outside the target means another branch",
            best: true,
            feedback: "Excluding opacification of other structures is the purpose of contrast echo. It cannot be undone.",
            stateDelta: { stability: 0 },
          },
          {
            text: "Inject more alcohol to complete the septal effect",
            feedback: "More alcohol into a branch already shown to feed a papillary muscle adds harm.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "alcohol",
        prompt: "A second, smaller septal branch opacifies only the basal septum at the contact point, and selective injection shows the balloon seals it with no collateral flow. How do you give the alcohol?",
        info: "Septal thickness on echo is 20 mm.",
        options: [
          {
            text: "About 2 mL of absolute alcohol at 1 mL per minute under continuous fluoroscopy, stopping if the balloon moves or resistance appears, then keep the balloon up for ten minutes",
            best: true,
            feedback: "1 mL per 10 mm of septum, slowly, watching the balloon, and ten minutes before deflation: the authors' technique.",
            stateDelta: { stability: 5 },
          },
          {
            text: "5 mL as a rapid bolus to be sure of a large enough infarct, then deflate straight away",
            feedback: "A large, fast dose and early deflation are the ways alcohol escapes into the LAD.",
            stateDelta: { stability: -20, flags: ["lad-alcohol"] },
          },
        ],
      },
      {
        id: "block",
        prompt: "Two minutes after the injection, complete heart block appears. The pacing box was set in demand mode at 70 per minute; the pressure falls to 86/52 mmHg and paced complexes are not following every spike. What do you do?",
        variants: [{ flag: "no-wire", info: "The femoral wire was placed after the earlier episode of block and is now connected." }],
        options: [
          {
            text: "Increase the output, check the connections and confirm capture; once paced beats follow every spike, recheck the threshold and set the output at least three times it",
            best: true,
            feedback:
              "Loss of capture with spikes visible: raise the output and check the system first, then re-establish the margin Oxford asks for.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Start a dobutamine infusion to support the pressure",
            feedback: "An inotrope worsens intracavitary obstruction in hypertrophic cardiomyopathy (Brilakis). Restore capture; if a vasopressor is needed, phenylephrine is Brilakis's choice.",
            stateDelta: { stability: -15 },
          },
          {
            text: "Give sublingual GTN to relieve the chest discomfort",
            feedback: "Brilakis: nitroglycerin worsens outflow obstruction and should not be given in HOCM, least of all with a low pressure.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "after",
        prompt: "Capture is restored and the pressure recovers. The final angiogram shows an occluded septal branch and normal LAD flow; the gradient is 20 mmHg. What is the plan?",
        options: [
          {
            text: "Coronary care for at least 48 hours with the wire in place, enzymes every 6–8 hours, remove the wire the next day only if there is no AV block, and judge the gradient over 3–6 months",
            best: true,
            feedback: "The authors' aftercare; early ventricular arrhythmias are regarded as benign, and the gradient keeps falling with remodelling.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Remove the wire now that the rhythm has recovered and discharge tomorrow morning",
            feedback: "Conduction defects come and go in the first hours; the wire stays until the next day and only comes out if there is no AV block.",
            stateDelta: { stability: -10 },
          },
          {
            text: "Ablate a third septal branch now to bring the gradient to zero",
            feedback: "With a satisfactory ablated area the authors wait 3–6 months rather than treating more branches at once.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The gradient fell to 20 mmHg in the lab. She spent 48 hours on the coronary care unit; conduction recovered by the next morning, the wire was removed, and at three months her gradient was lower still with NYHA class I symptoms.",
    outcomeVariants: [
      { flag: "no-wire", text: "The episode of block before any temporary wire was in place needed external pacing; the wire should have been the first step." },
      { flag: "lad-balloon", text: "A balloon placed partly in the LAD caused a dissection that had to be treated before ablation could continue." },
      { flag: "papillary", text: "Alcohol injected into a branch that also fed the papillary muscle left new mitral regurgitation." },
      { flag: "lad-alcohol", text: "A rapid large bolus with early deflation let alcohol into the LAD, with a remote anterior infarct." },
    ],
    learningPoints: [
      "The temporary wire goes in first: up to half have early conduction defects, and 5–10% needed permanent pacing in the authors' review.",
      "Provoke a modest resting gradient with Valsalva and the post-ectopic beat; Brilakis advises against nitroglycerin in HOCM.",
      "RAO cranial; look for atypical septal origins; short slightly oversized balloon just inside the branch, never in the LAD.",
      "Contrast echo must show the target septum and nothing else; then prove the seal by selective injection.",
      "About 1 mL of alcohol per 10 mm of septum at 1 mL per minute; balloon up ten more minutes.",
      "Hypotension in obstruction: restore capture or rhythm, phenylephrine rather than an inotrope, no nitrate.",
    ],
    refs: ["rigopoulos-asa-2016", "oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "hb-additional-procedures-case-bav",
    title: "Balloon aortic valvuloplasty as a bridge",
    trackId: "cath-handbook",
    stage: 4,
    provenance: {
      kind: "synthetic",
      basedOn:
        "Keeble et al. 2016 (BAV technique, sizing, complications); 2025 ESC/EACTS valve guideline (role of BAV); Oxford Handbook ch 5 (aortic stenosis), ch 9 (temporary pacemaker) and ch 10 (cardiac tamponade)",
    },
    summary:
      "An unstable patient with severe aortic stenosis is bridged with balloon valvuloplasty. Confirm the indication and exclusions, set up access and pacing, cross and wire the valve, size the balloon, inflate under rapid pacing, read the result and plan the definitive treatment.",
    presentation:
      "An 86-year-old man with severe aortic stenosis (mean gradient 46 mmHg, valve area 0.6 cm²) is admitted with decompensated heart failure; his LVEF is 30%. He is too unwell for TAVI work-up to be completed this week. The heart team recommends balloon aortic valvuloplasty as a bridge to TAVI.",
    findings: [
      "Blood pressure 104/66 mmHg, heart rate 88 beats/min, sinus rhythm",
      "CT: annulus 23 mm, LVOT 22 mm, sinotubular junction 27 mm; iliofemoral arteries of adequate size",
      "Echo: no LV thrombus, mild aortic regurgitation, native valve",
      "No left main stenosis on angiography two years ago; creatinine mildly raised",
    ],
    steps: [
      {
        id: "indication",
        prompt: "Before you scrub, what must be settled?",
        options: [
          {
            text: "Confirm there is no exclusion (prosthetic valve, endocarditis, severe regurgitation, LV thrombus, left main disease, bleeding), consent him for the listed risks including stroke and death, agree the ceiling of care with him and his family, and confirm surgical and TAVI bail-out is available",
            best: true,
            feedback: "Keeble's checklist and the conversation about what would happen after a catastrophic complication. With his raised creatinine, plan to keep intravascular contrast to a minimum, which Keeble notes is possible in BAV.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Nothing further: the heart team has decided, so proceed directly",
            feedback: "The heart team decided the strategy; the operator still checks exclusions and the ceiling of care before starting.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "access",
        prompt: "How do you set up access and anticoagulation?",
        options: [
          {
            text: "Micropuncture femoral arterial access with suture-based preclosure for a sheath above 8 F, a venous pacing wire, and heparin to an ACT of 250–300 s",
            best: true,
            feedback: "Keeble's set-up: preclose large sheaths, a wire for rapid pacing, heparin 75–100 U/kg to an ACT of 250–300 s.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 12 F femoral sheath without preclosure, planning manual compression at the end",
            feedback: "Keeble deploys a suture-based device before inserting sheaths above 8 F; large-bore access in frail patients is a major source of bleeding.",
            stateDelta: { stability: -10, flags: ["bleed"] },
          },
        ],
      },
      {
        id: "wire",
        prompt: "The valve is crossed with an AL1 and a straight wire, and a pigtail records the gradient. Which wire supports the balloon?",
        options: [
          {
            text: "A pre-shaped exchange-length extra-stiff wire with an atraumatic curve at the apex, checked in RAO to be clear of the mitral apparatus",
            best: true,
            feedback: "Atraumatic, less arrhythmogenic, and away from the mitral valve, as Keeble advises.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A straight stiff wire pushed hard into the apex without a curve",
            feedback: "Before pre-shaped wires existed, operators shaped a curve precisely to reduce the risk of perforation.",
            stateDelta: { stability: -15, flags: ["tamponade"] },
            next: "tamponade",
          },
        ],
      },
      {
        id: "tamponade",
        kind: "consequence",
        prompt: "Ten minutes later the pressure falls to 70/40 mmHg with a tachycardia; the echo shows a new pericardial effusion with right heart collapse. What now?",
        options: [
          {
            text: "Emergency pericardiocentesis, reverse anticoagulation, volume and blood, and surgery if bleeding continues",
            best: true,
            feedback: "Keeble's and Oxford's tamponade management.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Continue with the valvuloplasty, since the stenosis is the main problem",
            feedback: "Tamponade will kill him before the stenosis does. Drain first.",
            stateDelta: { stability: -25 },
          },
        ],
      },
      {
        id: "size",
        prompt: "Which balloon do you choose (annulus 23 mm, LVOT 22 mm, sinotubular junction 27 mm)?",
        options: [
          {
            text: "23 mm: up to 1:1 with the annulus, within 10% of the LVOT, and smaller than the sinotubular junction",
            best: true,
            feedback: "All three of Keeble's rules satisfied.",
            stateDelta: { stability: 5 },
          },
          {
            text: "26 mm, to make sure the leaflets crack",
            feedback: "Larger than the annulus and close to the sinotubular junction: the risk of severe regurgitation and annular rupture rises.",
            stateDelta: { stability: -15, flags: ["ar"] },
          },
          {
            text: "18 mm, because a small balloon is always the safe choice",
            feedback: "Unlikely to achieve a useful fall in gradient. Keeble sizes up to 1:1 with the annulus, and more aggressively when BAV stands alone than for TAVI predilatation; he does not describe undersizing as the safe option.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "inflate",
        prompt: "The balloon is across the annulus. How do you inflate?",
        options: [
          {
            text: "Rapid pacing at 180–220 per minute; when the pressure falls, confirm position, inflate for about 3 seconds, deflate, stop pacing and pull back",
            best: true,
            feedback: "Keeble's sequence; then wait for the pressure to recover before anything else.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Inflate without pacing, slowly, over 20 seconds",
            feedback: "Without rapid pacing the balloon is pushed out of the valve. Keeble's contemporary sequence is a rapid inflation of about 3 seconds under rapid pacing.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "assess",
        prompt: "After one inflation and recovery of the pressure, the peak gradient has fallen from 60 to 28 mmHg. What next?",
        variants: [{ flag: "ar", info: "The LVEDP has risen from 22 to 34 mmHg and the aortic diastolic pressure has fallen from 58 to 36 mmHg." }],
        options: [
          {
            text: "Check the LVEDP and aortic diastolic pressure and the echo; if there is no significant new regurgitation, stop: the fall is over 50%",
            best: true,
            feedback: "Keeble's usual aim is a 40–50% fall in peak gradient without significant new regurgitation; a rising LVEDP or falling diastolic pressure would mean regurgitation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Upsize the balloon by 3 mm and inflate twice more to bring the gradient below 10 mmHg",
            feedback: "Further gradient reduction has to be weighed against regurgitation and annular rupture with larger balloons and repeated dilatations.",
            stateDelta: { stability: -15, flags: ["ar"] },
          },
        ],
      },
      {
        id: "finish",
        prompt: "How do you finish and what follows?",
        options: [
          {
            text: "Close the artery (device, or compression once the ACT is below 150 s), decide on the pacing wire by bradycardia risk, coronary care monitoring, repeat echo, and review within 4–6 weeks to move to TAVI without delay",
            best: true,
            feedback: "Keeble's finish; outcomes after BAV alone are poor, so the bridge must lead somewhere.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Treat the result as definitive and discharge to routine annual follow-up",
            feedback: "Restenosis is common, and in the European series most patients intended for bridging never reached TAVI. Plan the definitive procedure now.",
            stateDelta: { stability: -10 },
          },
        ],
      },
    ],
    outcome:
      "The peak gradient halved without new regurgitation. He recovered on the coronary care unit, his breathlessness improved over two weeks, and TAVI was performed five weeks later.",
    outcomeVariants: [
      { flag: "bleed", text: "A large unclosed femoral puncture bled after the procedure and needed transfusion." },
      { flag: "tamponade", text: "An unshaped stiff wire perforated the left ventricle; pericardiocentesis and reversal of anticoagulation were needed." },
      { flag: "ar", text: "Oversizing or repeated dilatation produced significant aortic regurgitation, and TAVI had to be brought forward urgently." },
    ],
    learningPoints: [
      "BAV today is mainly a bridge (2025 ESC: rarely, in carefully selected patients); plan the definitive treatment at the same time.",
      "Check Keeble's exclusions and agree the ceiling of care before starting.",
      "Preclose sheaths above 8 F; rapid pacing through a temporary wire; heparin to an ACT of 250–300 s.",
      "Pre-shaped stiff wire at the apex clear of the mitral apparatus.",
      "Balloon up to 1:1 with the annulus, at most 10% over the LVOT, smaller than the sinotubular junction.",
      "Aim for a 40–50% fall in peak gradient; rising LVEDP and falling aortic diastolic pressure mean regurgitation.",
    ],
    refs: ["keeble-bav-2016", "esc-vhd-2025", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------
export const tips: LabTip[] = [
  {
    id: "bed-pace-sheath-up-femoral",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Use a sheath larger than the wire, usually femoral",
    text: "Oxford's default is the femoral vein, and the sheath should be wider than the pacing wire so the wire turns and advances freely. The femoral route is also Oxford's choice for temporary wires in anticoagulated patients or those with clotting problems.",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker"), O("ch 3: Femoral vein access")],
    refs: OX,
  },
  {
    id: "bed-pace-steer-to-apex",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Steer the J tip by rotation towards the apex",
    text: "The wire's distal end is J-shaped, so turning the proximal end swings the tip. On an AP image aim a little inside the tip of the heart shadow, where the RV apex sits.",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-atrial-loop",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Will not cross? Loop it in the atrium",
    text: "If the wire does not pass straight over the tricuspid valve, let the tip catch the lateral wall of the right atrium to form a loop, then rotate and advance so the loop prolapses into the ventricle. A few ventricular ectopics confirm you are in the RV.",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker"), O("ch 4: Accessing the right heart")],
    refs: OX,
  },
  {
    id: "bed-pace-sock-shape",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Finish with the sock shape",
    text: "Bring the tip down into the RV apex. Oxford's final position looks like a sock: the heel curves through the right atrium and the toe rests at the apex.",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-coronary-sinus",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "High on AP and posterior on lateral: coronary sinus",
    text: "The coronary sinus opens just above the tricuspid valve. A wire in it sits more cranially on AP and runs posteriorly on the lateral view, whereas an RV lead runs anteriorly. Pull back into the atrium and redirect.",
    tone: "caution",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-threshold-margin",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Threshold from 3 V down, output three times it",
    text: "Pace above the intrinsic rate, start at 3 V and lower the output slowly until capture is lost, then raise it slowly to recapture: that is the threshold, ideally 1 V or less. Set the output to at least three times the threshold (Oxford's box reads volts; check the units on yours).",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-demand-sensitivity",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Demand mode, sensitivity set against muscle noise",
    text: "Leave the box in demand mode: asynchronous pacing risks ventricular arrhythmias. The lower the sensitivity number, the more sensitive the box; choose a value at which all of the patient's own beats are seen and muscle noise does not switch pacing off.",
    tone: "caution",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-skin-loop",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Secure the wire with a loop on the skin",
    text: "Suture the lead and the sheath, use transparent occlusive dressings and tape the external lead. Fix a loop on the skin so that a pull on the wire is taken up by the loop before the lead moves.",
    tone: "do",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-external-bridge",
    lab: "bedside",
    when: { phase: ["pacing"], event: ["bradycardia", "hypotension"] },
    title: "Bradycardia while the wire is not in: external pacing",
    text: "One pad over the apex and one to the right of the sternum, demand mode at 70 per minute, and raise the output until electrical capture; confirm that it produces a pulse. Expect painful muscle contraction and ECG artefact, so sedate.",
    tone: "bailout",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 9: Temporary pacemaker")],
    refs: OX,
  },
  {
    id: "bed-pace-overdrive-vt",
    lab: "bedside",
    when: { phase: ["pacing"] },
    title: "Overdrive pacing for stable monomorphic VT: defibrillator ready",
    text: "Only for VT the patient tolerates; poorly tolerated VT goes straight to synchronised cardioversion. Pace 15–20 per minute faster than the VT with an output of 5–10 V if needed; capture shows as a new QRS shape and a rise to the paced rate. Stop abruptly after 5–10 seconds of capture, with the defibrillator charged in case the VT accelerates or degenerates.",
    tone: "bailout",
    lessonId: "hb-additional-procedures-pacing",
    sources: [O("ch 10: Arrhythmia")],
    refs: OX,
  },
  {
    id: "structural-bav-exclusions-ceiling",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["bav"] },
    title: "Balloon valvuloplasty: exclusions and ceiling of care first",
    text: "Do not dilate a prosthetic valve, an infected valve, a valve that is not severely stenotic (Oxford's severe range: area below 1.0 cm², mean gradient above 40 mmHg) or one with severe regurgitation, or treat a patient with LV thrombus, significant left main disease or active bleeding. Agree beforehand whether emergency surgery would be offered, and work where surgical and TAVI bail-out exist.",
    tone: "caution",
    lessonId: "hb-additional-procedures-bav",
    sources: [O("ch 5: Aortic stenosis")],
    refs: ["keeble-bav-2016", "esc-vhd-2025", "oxford-cath-handbook"],
  },
  {
    id: "structural-bav-stiff-wire-apex",
    lab: "structural",
    when: { phase: ["position"], procedure: ["bav"] },
    title: "Balloon valvuloplasty: curved stiff wire at the apex",
    text: "Support the balloon on a pre-shaped extra-stiff wire with an atraumatic curve at the LV apex, placed clear of the mitral apparatus and where it provokes few ectopics; an RAO view helps check it. Make every exchange over the wire in the controlled way Oxford asks for whenever a wire crosses a stenotic aortic valve.",
    tone: "do",
    lessonId: "hb-additional-procedures-bav",
    sources: [O("ch 5: Aortic stenosis")],
    refs: ["keeble-bav-2016", "oxford-cath-handbook"],
  },
  {
    id: "structural-bav-balloon-size",
    lab: "structural",
    when: { phase: ["plan", "position"], procedure: ["bav"] },
    title: "Balloon valvuloplasty: size to the annulus",
    text: "Take the annulus and sinotubular junction diameters from the planning CT (Oxford lists both among the CT measurements for TAVI). Choose a balloon up to 1:1 with the annulus, or at most 10% larger than the LVOT, and always smaller than the sinotubular junction. Stand-alone BAV can be sized more firmly than TAVI predilatation.",
    tone: "caution",
    lessonId: "hb-additional-procedures-bav",
    sources: [O("ch 1: Cardiac CT or invasive angiography?")],
    refs: ["keeble-bav-2016", "oxford-cath-handbook"],
  },
  {
    id: "structural-bav-rapid-pacing",
    lab: "structural",
    when: { phase: ["deploy"], procedure: ["bav"] },
    title: "Balloon valvuloplasty: pace, check, inflate, deflate, stop",
    text: "Rapid pace at 180–220 per minute; when the arterial pressure falls, confirm the balloon has not moved, inflate for about 3 seconds, deflate, stop pacing and pull back to the ascending aorta. Do not inflate again until the pressure is back to baseline. The principle is the one Brilakis uses for a stent that moves with each beat: rapid pacing cuts the motion.",
    tone: "do",
    lessonId: "hb-additional-procedures-bav",
    sources: [B("10.2"), B("15.1")],
    refs: ["keeble-bav-2016", "brilakis-manual-pci"],
  },
  {
    id: "structural-bav-ar-signs",
    lab: "structural",
    when: { phase: ["assess"], event: ["hypotension"], procedure: ["bav"] },
    title: "After dilatation: rising LVEDP and falling diastolic pressure",
    text: "A clear rise in LVEDP or fall in aortic diastolic pressure suggests significant aortic regurgitation; stop inflating. Treat hypotension at once with fluid and pressors while ECG, echo and fluoroscopy look for regurgitation, annular rupture, tamponade or bleeding.",
    tone: "bailout",
    lessonId: "hb-additional-procedures-bav",
    sources: [O("ch 10: Cardiac tamponade")],
    refs: ["keeble-bav-2016", "oxford-cath-handbook"],
  },
  {
    id: "structural-pmc-toe-first",
    lab: "structural",
    when: { phase: ["plan"], procedure: ["pmc"] },
    title: "Mitral commissurotomy: TOE for left atrial thrombus first",
    text: "Exclude left atrial thrombus with TOE before PMC, that is, before the transseptal puncture that takes the balloon from the right atrium into the left (Oxford's transseptal route into the left heart). In Hung's 799 single-balloon procedures, every systemic embolus occurred before pre-procedure TOE became routine.",
    tone: "caution",
    lessonId: "hb-additional-procedures-pmc",
    sources: [O("ch 4: Accessing the left heart")],
    refs: ["esc-vhd-2021", "hung-inoue-complications-1999", "oxford-cath-handbook"],
  },
  {
    id: "structural-pmc-stepwise-stop",
    lab: "structural",
    when: { phase: ["deploy", "assess"], procedure: ["pmc"] },
    title: "Mitral commissurotomy: step up, and stop at an optimal result",
    text: "Start below the target balloon diameter and increase step by step, assessing gradient, area and regurgitation after each inflation, without pulling on the septum; read the mean gradient from simultaneous left atrial (or wedge) and LV pressures averaged over at least 10 beats, as Oxford does. Lau's definition of an optimal result, used here as the stopping point, is an area of 1.5 cm² or more (or a 50% rise) without a two-grade increase or grade 3 regurgitation.",
    tone: "caution",
    lessonId: "hb-additional-procedures-pmc",
    sources: [O("ch 5: Mitral stenosis")],
    refs: ["hung-inoue-complications-1999", "lau-inoue-height-sizing-1996", "oxford-cath-handbook"],
  },
  {
    id: "haemo-asa-pacing-first",
    lab: "haemo",
    when: { phase: ["left-heart"] },
    title: "Septal ablation: pacing wire and continuous gradient first",
    text: "Place a temporary wire before anything enters a septal branch, unless a pacemaker or ICD is already in. Record guide pressure against a distal-hole pigtail in the LV so the gradient is visible at rest, with Valsalva and after an ectopic, throughout the case.",
    tone: "caution",
    lessonId: "hb-additional-procedures-asa",
    sources: [O("ch 5: Cardiomyopathy"), O("ch 9: Temporary pacemaker")],
    refs: ["rigopoulos-asa-2016", "oxford-cath-handbook"],
  },
  {
    id: "structural-septal-occluder-no-overstretch",
    lab: "structural",
    when: { phase: ["plan", "position"], procedure: ["septal-occluder"] },
    title: "Septal occluder: do not overstretch the defect when sizing",
    text: "When balloon-sizing a secundum ASD under TOE or intracardiac echo guidance (Oxford's imaging for closure), avoid overstretching the defect and avoid choosing an oversized device. Erosions cluster in high defects with a deficient aortic rim and a device that is large for the unstretched defect.",
    tone: "caution",
    lessonId: "hb-additional-procedures-septal-closure",
    sources: [O("ch 5: Atrial septal defect")],
    refs: ["amin-asd-erosion-2004", "oxford-cath-handbook"],
  },
  {
    id: "structural-septal-occluder-release-check",
    lab: "structural",
    when: { phase: ["deploy", "assess"], procedure: ["septal-occluder"] },
    title: "Septal occluder: both discs on the right sides before release",
    text: "Before releasing, confirm on TOE or intracardiac echo that the left and right atrial discs sit on their own sides of the septum and that the device holds on a push–pull test. For a PFO, larger devices carry a higher risk of residual shunt.",
    tone: "caution",
    lessonId: "hb-additional-procedures-septal-closure",
    sources: [O("ch 5: Atrial septal defect")],
    refs: ["pfo-position-2019", "oxford-cath-handbook"],
  },
  {
    id: "structural-septal-occluder-effusion-24h",
    lab: "structural",
    when: { phase: ["assess", "complication"], procedure: ["septal-occluder"] },
    title: "ASD device and a small effusion at 24 hours: follow closely",
    text: "A small pericardial effusion the day after ASD closure calls for closer follow-up, particularly with a deficient aortic or superior rim or a large device, because erosion near the aortic root can present this way. If tachycardia and hypotension develop, manage it as tamponade: echo confirms it, and Oxford drains at once when suspicion is high.",
    tone: "caution",
    lessonId: "hb-additional-procedures-septal-closure",
    sources: [O("ch 10: Cardiac tamponade")],
    refs: ["amin-asd-erosion-2004", "oxford-cath-handbook"],
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed in this session)
// ---------------------------------------------------------------------------
export const refs: Reference[] = [
  {
    id: "keeble-bav-2016",
    kind: "paper",
    citation:
      "Keeble TR, Khokhar A, Akhtar MM, Mathur A, Weerackody R, Kennon S. Percutaneous balloon aortic valvuloplasty in the era of transcatheter aortic valve implantation: a narrative review. Open Heart. 2016;3(2):e000421.",
    url: "https://doi.org/10.1136/openhrt-2016-000421",
    note: "PMID: 28008354; PMCID: PMC5174794. Authors, title, journal, year, volume, issue and article number checked on PubMed; full text read in PMC.",
    verified: true,
  },
  {
    id: "hung-inoue-complications-1999",
    kind: "paper",
    citation:
      "Hung JS, Lau KW, Lo PH, Chern MS, Wu JJ. Complications of Inoue-balloon mitral commissurotomy: impact of operator experience and evolving technique. Am Heart J. 1999;138(1 Pt 1):114–121.",
    url: "https://doi.org/10.1016/s0002-8703(99)70255-3",
    note: "PMID: 10385773. Authors, title, journal, year, volume and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "lau-inoue-height-sizing-1996",
    kind: "paper",
    citation:
      "Lau KW, Gao W, Ding ZP, Hung JS. Immediate and long-term results of percutaneous Inoue balloon mitral commissurotomy with use of a simple height-derived balloon sizing method for the stepwise dilation technique. Mayo Clin Proc. 1996;71(6):556–563.",
    url: "https://doi.org/10.4065/71.6.556",
    note: "PMID: 8642884. Authors, title, journal, year, volume and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "sanzruiz-mitral-stenosis-2022",
    kind: "paper",
    citation:
      "Sanz-Ruiz R, Vázquez-Álvarez ME, Gutiérrez-Ibañes E, et al. New percutaneous approaches for the treatment of heavily calcified mitral valve stenosis. J Clin Med. 2022;11(21):6444.",
    url: "https://doi.org/10.3390/jcm11216444",
    note: "PMID: 36362671; PMCID: PMC9657244. Authors, title, journal, year, volume and article number checked on PubMed; full text read in PMC (section 2 used).",
    verified: true,
  },
  {
    id: "rigopoulos-asa-2016",
    kind: "paper",
    citation: "Rigopoulos AG, Seggewiss H. Twenty years of alcohol septal ablation in hypertrophic obstructive cardiomyopathy. Curr Cardiol Rev. 2016;12(4):285–296.",
    url: "https://doi.org/10.2174/1573403x11666150107160344",
    note: "PMID: 25563291; PMCID: PMC5304253. Authors, title, journal, year, volume and pages checked on PubMed; full text read in PMC.",
    verified: true,
  },
  {
    id: "veselka-euro-asa-2016",
    kind: "paper",
    citation:
      "Veselka J, Jensen MK, Liebregts M, et al. Long-term clinical outcome after alcohol septal ablation for obstructive hypertrophic cardiomyopathy: results from the Euro-ASA registry. Eur Heart J. 2016;37(19):1517–1523.",
    url: "https://doi.org/10.1093/eurheartj/ehv693",
    note: "PMID: 26746632. Authors, title, journal, year, volume and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "deckers-emb-1992",
    kind: "paper",
    citation:
      "Deckers JW, Hare JM, Baughman KL. Complications of transvenous right ventricular endomyocardial biopsy in adult patients with cardiomyopathy: a seven-year survey of 546 consecutive diagnostic procedures in a tertiary referral center. J Am Coll Cardiol. 1992;19(1):43–47.",
    url: "https://doi.org/10.1016/0735-1097(92)90049-s",
    note: "PMID: 1729344. Authors, title, journal, year, volume and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "baraldi-junkins-emb-transplant-1993",
    kind: "paper",
    citation:
      "Baraldi-Junkins C, Levin HR, Kasper EK, Rayburn BK, Herskowitz A, Baughman KL. Complications of endomyocardial biopsy in heart transplant patients. J Heart Lung Transplant. 1993;12(1 Pt 1):63–67.",
    note: "PMID: 8443204. Authors, title, journal, year, volume and pages checked on PubMed; abstract read. No DOI listed in PubMed.",
    verified: true,
  },
  {
    id: "from-emb-2011",
    kind: "paper",
    citation: "From AM, Maleszewski JJ, Rihal CS. Current status of endomyocardial biopsy. Mayo Clin Proc. 2011;86(11):1095–1102.",
    url: "https://doi.org/10.4065/mcp.2011.0296",
    note: "PMID: 22033254; PMCID: PMC3203000. Authors, title, journal, year, volume and pages checked on PubMed; abstract read (full text not available through PMC in this session).",
    verified: true,
  },
  {
    id: "amin-asd-erosion-2004",
    kind: "paper",
    citation:
      "Amin Z, Hijazi ZM, Bass JL, Cheatham JP, Hellenbrand WE, Kleinman CS. Erosion of Amplatzer septal occluder device after closure of secundum atrial septal defects: review of registry of complications and recommendations to minimize future risk. Catheter Cardiovasc Interv. 2004;63(4):496–502.",
    url: "https://doi.org/10.1002/ccd.20211",
    note: "PMID: 15558755. Authors, title, journal, year, volume and pages checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "rommens-pfo-af-2026",
    kind: "paper",
    citation:
      "Rommens O, Blondeel M, Maes M, et al. Long-term incidence and risk factors of atrial fibrillation after percutaneous patent foramen ovale occlusion: a retrospective cohort study. Open Heart. 2026;13(2).",
    url: "https://doi.org/10.1136/openhrt-2026-004344",
    note: "PMID: 42731861; PMCID: PMC13583860. Authors, title, journal, year, volume and issue checked on PubMed (article number not listed there); abstract read.",
    verified: true,
  },
  {
    id: "rojko-pfo-residual-2026",
    kind: "paper",
    citation: "Rojko M, Suligoj NC, Zvan B, Zorc M, Kar S, Noc M. Long-term echocardiographic features after percutaneous closure of patent foramen ovale. Interv Cardiol. 2026;21:e01.",
    url: "https://doi.org/10.15420/icr.2025.30",
    note: "PMID: 41674999; PMCID: PMC12888103. Authors, title, journal, year, volume and article number checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "anggrahini-ice-tee-2026",
    kind: "paper",
    citation:
      "Anggrahini DW, Bramantyo BB, Damarkusuma A, et al. Contemporary imaging modalities for transcatheter interatrial communication closure: a comparative meta-analysis of intracardiac and transesophageal echocardiography. Echocardiography. 2026;43(8):e70598.",
    url: "https://doi.org/10.1111/echo.70598",
    note: "PMID: 42599761; PMCID: PMC13475591. Authors, title, journal, year, volume, issue and article number checked on PubMed; abstract read.",
    verified: true,
  },
  {
    id: "verheyen-hcm-austria-2024",
    kind: "consensus",
    citation:
      "Verheyen N, Auer J, Bonaros N, et al. Austrian consensus statement on the diagnosis and management of hypertrophic cardiomyopathy. Wien Klin Wochenschr. 2024;136(Suppl 15):571–597.",
    url: "https://doi.org/10.1007/s00508-024-02442-1",
    note: "PMID: 39352517; PMCID: PMC11445290. Authors, title, journal, year, volume, supplement and pages checked on PubMed; full text read in PMC (sections on refractory symptoms, septal reduction therapy and alcohol septal ablation).",
    verified: true,
  },
  {
    id: "seferovic-emb-2021",
    kind: "consensus",
    citation:
      "Seferović PM, Tsutsui H, McNamara DM, et al. Heart Failure Association of the ESC, Heart Failure Society of America and Japanese Heart Failure Society position statement on endomyocardial biopsy. Eur J Heart Fail. 2021;23(6):854–871.",
    url: "https://doi.org/10.1002/ejhf.2190",
    note: "PMID: 34010472. Authors, title, journal, year, volume, issue and pages checked on PubMed; abstract read (no PMC full text).",
    verified: true,
  },
];
