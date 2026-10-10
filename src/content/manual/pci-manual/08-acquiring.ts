// Module pm-acquiring: acquiring the angiogram (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.6, 2.5, 5.9, 6.1-6.8, 7.1 (Fig 7.2), 12.2, 15.1, 17.5-17.6,
// 18.6, 19.9, 21.6, 25.2, 28.2; Oxford Handbook of Cardiac Catheterization and Coronary Intervention,
// chapters 1, 6, 8 and 11. Every claim is listed with its page in docs/curriculum/evidence/pm-acquiring.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-acquiring",
  title: "Acquiring the angiogram",
  stage: 2,
  summary:
    "What happens between a safe engagement and a set of diagnostic pictures: the test injection and what it tells you, intracoronary nitrate and how to unmask spasm, setting up the table, detector and shields, recording each run with the right injection, breath-hold, panning and frame rate, building a complete set of named projections, and reading the anatomy and dominance as the runs come in.",
  objectives: [
    "Place the test injection and the intracoronary nitrate correctly in the angiography sequence, read what a test puff shows, and prove or exclude spasm before calling a narrowing fixed.",
    "Set up the table, image receptor, shields and operator position for good images at the lowest dose, and explain how kV, mA, filtration, angulation, magnification and frame rate change dose and image quality.",
    "Record a run step by step: frame the catheter, start cine, inject to full opacification with reflux, hold the breath, decide whether to pan, and stop when every branch and collateral has filled.",
    "Recognise and correct poor filling, streaming and a catheter that backs out during injection, and know when to call an angiogram non-diagnostic.",
    "Name projections in both manuals' conventions, choose the views that show each segment and ostium, and complete orthogonal views of every artery and graft.",
    "Identify the branches of each artery on the run, decide dominance from the origin of the posterior descending artery, number segments as SYNTAX does, and notice a territory that no imaged vessel supplies.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-acquiring-test-nitrate",
      title: "Test injection and intracoronary nitrate before the first run",
      minutes: 14,
      topics: ["dx-test-injection-nitrate"],
      sources: [
        { book: "brilakis-pci", loc: "5.9" },
        { book: "brilakis-pci", loc: "6.1" },
        { book: "brilakis-pci", loc: "6.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "25.2" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "brilakis-pci", loc: "3.2" },
        { book: "brilakis-pci", loc: "17.5" },
      ],
      refs: [...BOOKS, "esc-cardiomyopathy-2023", "esc-ccs-2024", "kunadian-inoca-2020"],
      blocks: [
        {
          kind: "p",
          text: "Engagement ends when the catheter sits in the ostium with a free pressure trace (Brilakis 5.9 simply hands over to chapter 6). Two small steps then stand between you and the first cine run: a test injection, which tells you where the tip really is, and intracoronary nitroglycerin, which removes spasm from the picture before you record it. Both are quick, and skipping either is how fellows end up with a dissected ostium or a 'stenosis' that later vanishes.",
        },
        { kind: "h", text: "The eight steps of a coronary angiogram" },
        {
          kind: "table",
          caption: "Brilakis chapter 6, step by step, and where this curriculum teaches each step",
          head: ["Step", "What you do", "Taught in"],
          rows: [
            ["1. Pressure waveform", "Confirm the tip is free, coaxial and not obstructing flow, and that the lumen holds no clot, plaque or air", "Engaging module (pm-engaging)"],
            ["2. Test injection", "A small hand injection to confirm ostial, coaxial engagement", "This lesson"],
            ["3. Intracoronary nitroglycerin", "Dose by systolic pressure, then wait", "This lesson; doses in detail in the lab drugs module"],
            ["4. Position patient, receptor, shields, operator", "Table height, detector distance, angulation, shielding, standing back", "Lesson 2"],
            ["5. Pressure and ECG before the run", "No damping, ventricularisation, new hypotension or new ECG change", "Engaging module"],
            ["6. Cineangiography", "Record the run", "Lessons 3 and 4"],
            ["7. Pressure and ECG after the run", "No damping, hypotension, ST or rhythm change", "Engaging module"],
            ["8. Interpretation", "Flow, stenosis, length, thrombus, calcium and the rest", "Interpreting module (pm-interpreting); anatomy in lesson 5"],
          ],
        },
        { kind: "h", text: "The test injection" },
        {
          kind: "steps",
          title: "Giving and reading a test puff",
          items: [
            {
              title: "1. Only through a clean catheter",
              detail:
                "The catheter has been aspirated and cleared of thrombus, air and debris, and the trace is free (step 1). A test puff is still an injection: never give it into a damped or ventricularised trace.",
            },
            {
              title: "2. Give a small volume, gently",
              detail:
                "Brilakis uses 1–2 mL by hand; Oxford describes small test injections of a few millilitres. The aim is to see the tip and the first centimetres of the artery, not to opacify the whole tree.",
            },
            {
              title: "3. Is the tip in the ostium and coaxial?",
              detail:
                "The contrast should flow straight down the artery from a tip that points along it. A tip that tents the wall is not coaxial, and Brilakis warns that tenting could lead to dissection.",
            },
            {
              title: "4. Is the whole artery filling?",
              detail:
                "Oxford relies on the test injection to reveal super-selective engagement, from variant anatomy such as a short left main or from pushing the catheter too far. A puff that fills only the LAD, or only a small anterior vessel from the RCA ostium (the conus branch), is the warning. Injecting a large volume into the conus can cause ventricular fibrillation. Brilakis adds a warning from his left main chapter: when the left main is short, a catheter sitting deep in the LAD can block the circumflex ostium completely, and a side-hole catheter can keep the pressure trace looking normal while it does, so he does not engage the left main with side-hole guides (except for a left main chronic total occlusion).",
            },
            {
              title: "5. Is the take-off unusual?",
              detail: "Oxford adds that test injections help to identify anomalous origins and unusual vessel take-off before you commit to a projection or a catheter.",
            },
            {
              title: "6. Use it to frame the picture",
              detail: "Oxford also uses the test puff to confirm the radiographic position before acquisition, so the run that follows is centred and needs little or no panning (lesson 3).",
            },
          ],
        },
        {
          kind: "p",
          text: "**When the test puff can be skipped.** Brilakis allows it to be omitted when you are certain the ostium is engaged, judged from the way the catheter moved and its characteristic jump into the ostium. Certainty is the condition; a fellow learning the catheters should give the puff every time.",
        },
        {
          kind: "check",
          stem: "From the femoral route a JL4 drops in as the wire comes out. The trace is free. The test puff fills a long vessel running to the apex, but no circumflex appears. What is the most likely explanation and the next move?",
          options: [
            "An occluded circumflex: record the run now and look for collaterals from the right",
            "Ostial spasm of the left main: give intracoronary nitrate through the engaged catheter",
            "An anomalous circumflex from the right sinus: abandon the left system and image the RCA",
            "Super-selective LAD engagement from a short left main: try a JL one size larger for the circumflex",
          ],
          answer: 3,
          explanation:
            "A test puff that fills only the LAD is the classic sign of super-selective engagement; Oxford names a short or absent left main as a cause and notes that a Judkins left one size larger will normally engage the circumflex. Calling the circumflex occluded or anomalous from one selective puff is premature: you have not yet shown where its ostium is. An anomalous circumflex is a diagnosis to make once both left vessels have been sought, not after one puff.",
        },
        {
          kind: "p",
          text: "**Why the puff matters: dissection.** Brilakis lists the causes of catheter-induced dissection at this step: a deep, subintimal or non-coaxial tip, a tip resting on the edge of or beneath an eccentric plaque (above all in the left main), an ostial lesion, a forceful injection (usually on top of a poor position), and injecting despite a damped trace. Prevention follows from the list: a free trace before any contrast, coaxial placement, and a gentle hand when injecting manually. If it happens, stop injecting, withdraw gently, wire the true lumen and stent; the full bail-out is in the engaging module.",
        },
        { kind: "tip", id: "diag-acq-read-test-puff" },
        { kind: "h", text: "Intracoronary nitroglycerin" },
        {
          kind: "p",
          text: "Brilakis gives nitroglycerin before angiography for two reasons: to prevent or reverse spasm that could be read as a fixed lesion, and to size balloons and stents on a vessel that is fully dilated. Oxford gives the same rationale in different words: nitrates dilate the coronaries, help to separate spasm from obstructive disease (particularly at an ostium) and show the true luminal diameter for stent sizing.",
        },
        {
          kind: "steps",
          title: "Giving the nitrate in the sequence",
          items: [
            {
              title: "1. Check that a nitrate is safe",
              detail:
                "Ask about phosphodiesterase-5 inhibitors and look at the systolic pressure. Brilakis withholds nitroglycerin in low pressure, suspected hypovolaemia, right ventricular infarction and recent PDE-5 inhibitor use, and in his drugs chapter also in hypertrophic obstructive cardiomyopathy, because it worsens the outflow obstruction. The 2023 ESC cardiomyopathy guideline likewise advises avoiding arterial and venous dilators, nitrates included, where there is resting or provocable LV outflow tract obstruction. The lab drugs module covers these in full.",
            },
            {
              title: "2. Choose the dose from the systolic pressure",
              detail:
                "Brilakis's ladder (typical doses; follow local protocol): above 120 mmHg give 200 µg; 100–120 mmHg give 100 µg; below 100 mmHg give 50 µg or none. Oxford gives glyceryl trinitrate or isosorbide dinitrate as repeated intracoronary boluses of 100–250 µg.",
            },
            {
              title: "3. Give it with the catheter engaged and the trace free",
              detail:
                "Through the manifold, or straight into the catheter with the introducer needle passed through the Y-connector ('nitro on a stick'). Sublingual alternatives: 0.4 mg nitroglycerin (Brilakis) or 1–2 puffs of GTN spray (Oxford).",
            },
            {
              title: "4. Wait before acquiring",
              detail:
                "Vasodilatation can take up to 2 minutes, so Brilakis waits 1–2 minutes before the run; Oxford gives the same 1–2 minutes for maximal effect. Use the time for step 4: table, detector, angle and shields.",
            },
            {
              title: "5. Expect the pressure to fall",
              detail:
                "A drop in systemic pressure is common. Brilakis often gives saline prophylactically after the nitrate, observes until the pressure recovers, and uses a vasopressor such as phenylephrine when hypotension is severe.",
            },
          ],
        },
        { kind: "tip", id: "diag-nitrate-dose-by-pressure" },
        {
          kind: "table",
          caption: "Routine or on demand? What the two manuals say",
          head: ["Approach", "Brilakis", "Oxford"],
          rows: [
            [
              "Routine, before the first run",
              "Step 3 of every angiogram: nitroglycerin goes in before angiography unless something forbids it, low blood pressure being his example; giving it after engagement and before angiography is also one of his measures for preventing spasm",
              "Some operators give nitrate to everyone so that all images are taken at maximal dilatation, usually as a sublingual spray or an infusion started before the procedure",
            ],
            [
              "On demand",
              "For spasm itself, intracoronary nitroglycerin 100–300 µg, repeated if needed, or an intracoronary calcium channel blocker (25.2); before angiography of aorto-ostial lesions he stresses it to exclude spasm",
              "Often given during the case to treat or exclude spasm",
            ],
            [
              "Patients already on nitrates",
              "Not discussed",
              "Oral nitrates do not prevent you giving more; a patient on an intravenous infusion may respond less",
            ],
          ],
        },
        {
          kind: "check",
          stem: "You have engaged the RCA for an elective study. The trace is free at 104/62 mmHg and the test puff shows a coaxial position. What is the best next sequence according to Brilakis?",
          options: [
            "200 µg intracoronary nitroglycerin, then acquire LAO at once while the drug is still peaking",
            "100 µg intracoronary nitroglycerin, set up the first projection, and acquire after 1–2 minutes",
            "No nitrate because the systolic pressure is below 110 mmHg, then acquire the first run",
            "50 µg intravenous nitroglycerin, then acquire after the pressure has settled again",
          ],
          answer: 1,
          explanation:
            "A systolic pressure of 100–120 mmHg calls for 100 µg, and the run waits 1–2 minutes because dilatation can take up to 2 minutes to develop; the waiting time is used to set up the projection. 200 µg is the dose for a systolic pressure above 120 mmHg, and acquiring immediately wastes the effect. There is no 110 mmHg cut-off in the ladder: below 100 mmHg the choice is 50 µg or none.",
        },
        { kind: "h", text: "When a narrowing might be spasm" },
        {
          kind: "steps",
          title: "Proving spasm before you report a stenosis",
          items: [
            {
              title: "1. Think of it",
              detail:
                "Oxford reminds you that spasm can mimic a severe stenosis. It may come from the patient's disease or from the procedure: catheter-tip spasm after ostial engagement, deep or aggressive catheter manipulation and instrumentation (Brilakis 25.2), stiff wires that straighten the artery during PCI, cocaine or amphetamine derivatives, and rarely a contrast reaction.",
            },
            {
              title: "2. If the catheter is the cause, withdraw first",
              detail:
                "Catheter-tip spasm typically ventricularises the trace and then lets it fall, recovering only when the catheter is withdrawn (Oxford). Oxford adds that the pressure usually declines a few seconds after engagement as the spasm develops, that over-engaging a diagnostic catheter is a cause (especially in the RCA), and that it is commonest in a non-dominant RCA and in arteries whose calibre is close to the catheter's, so it is seen more in shorter, lighter patients. Withdrawal alone may relieve it. Nothing is injected while the trace is abnormal.",
            },
            {
              title: "3. Re-engage carefully, then give intracoronary nitrate",
              detail: "Oxford separates spasm from ostial disease by giving intracoronary nitrate after careful re-engagement; re-engage only to the ostium and confirm a free trace before you give it. Oxford's pitfalls section puts it as withdrawing the catheter and giving nitrate if required. Wait 1–2 minutes before the next run.",
            },
            {
              title: "4. Repeat the same projection",
              detail:
                "Compare like with like: the same angles and a full injection. A narrowing that opens up was spasm; Oxford's example is a mid-RCA spasm after cocaine that, after intracoronary GTN, turned out to be non-obstructive plaque.",
            },
            {
              title: "5. If it will not recede, image it",
              detail: "Brilakis uses OCT or IVUS when suspected spasm does not resolve after nitroglycerin, to tell spasm from atherosclerotic narrowing.",
            },
            {
              title: "6. Document the relief",
              detail: "Oxford asks for an image showing that the spasm has gone, so that the report and the next operator are not misled.",
            },
          ],
        },
        {
          kind: "p",
          text: "Oxford notes that diagnostic provocation with intracoronary ergonovine is now rarely performed, because of the risk of intractable spasm and infarction. Where vasospastic angina is suspected, the 2024 ESC chronic coronary syndrome guideline and the EAPCI consensus on ischaemia with non-obstructive coronary arteries support a planned invasive coronary function test with intracoronary acetylcholine instead (taught in the coronary physiology module), not ad hoc provocation during a diagnostic run. Severe or drug-induced spasm may need verapamil or, for intractable cases, nitroprusside; the lab drugs module covers those agents.",
        },
        { kind: "tip", id: "diag-acq-spasm-repeat-view" },
        {
          kind: "check",
          stem: "After 200 µg of nitroglycerin, a focal 80% narrowing in the mid RCA persists on a repeat run in the same projection. The catheter is coaxial with a free trace. What does Brilakis suggest to settle whether it is spasm?",
          options: [
            "Intravascular imaging with OCT or IVUS to distinguish spasm from atherosclerosis",
            "Intracoronary ergonovine to provoke and characterise the spasm under control",
            "Report it as a fixed stenosis, since spasm always responds to a nitrate",
            "Repeat the nitrate every two minutes until the narrowing finally resolves",
          ],
          answer: 0,
          explanation:
            "When suspected spasm does not recede after nitroglycerin, Brilakis turns to OCT or IVUS to tell spasm from atherosclerotic stenosis. Ad hoc ergonovine provocation is not the way to settle this: Oxford notes it is now rarely performed because of the risk of intractable spasm and infarction, and suspected vasospastic angina is investigated with a planned acetylcholine test (physiology module). Reporting a fixed lesion without that check, or repeating nitrate indefinitely, ignores both the persistent doubt and the falling blood pressure that repeated nitrate causes.",
        },
        {
          kind: "pitfalls",
          items: [
            "Giving the test puff, or the nitrate, through a damped or ventricularised catheter.",
            "Reading a puff that fills only the LAD as a left main injection, and missing the circumflex.",
            "Acquiring seconds after the nitrate instead of waiting 1–2 minutes.",
            "Giving nitrate without asking about PDE-5 inhibitors or looking at the systolic pressure.",
            "Reporting a stenosis that was never re-imaged after nitrate, especially at an ostium or in a small vessel.",
            "Chasing persistent 'spasm' with repeated nitrate while the pressure falls, instead of imaging it.",
          ],
        },
        {
          kind: "pearl",
          text: "Make the wait after nitrate productive: it is exactly the time you need to bring the table up, the detector down, the shields in and the first angle set. By the time the vessel is fully dilated, the room is ready to record it.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, engage the left coronary with a JL4. With a free trace, give a 1–2 mL test puff and state aloud whether the tip is coaxial and whether both the LAD and circumflex fill. Read the systolic pressure, choose the nitroglycerin dose from Brilakis's ladder, and wait 1–2 minutes before the first cine run.",
        },
        { kind: "video", id: "Y3bEFuzTpB8", note: "Manual of PCI chapter video on how to perform coronary angiography." },
        { kind: "video", id: "6HmNE36hBec", note: "Giving nitroglycerin 'on a stick'." },
        {
          kind: "keypoints",
          items: [
            "Order: free trace, test puff, nitrate, set up, check trace and ECG, record, check again, interpret.",
            "Test puff: 1–2 mL (Brilakis) or a few millilitres (Oxford) through a cleared catheter; it shows coaxial position, super-selective or conus engagement and unusual take-off.",
            "Skip the puff only when certain from the catheter's movement and jump.",
            "Nitroglycerin by systolic pressure: above 120 mmHg 200 µg, 100–120 mmHg 100 µg, below 100 mmHg 50 µg or none; wait 1–2 minutes.",
            "Expect a fall in pressure; saline, observation and, if severe, phenylephrine.",
            "Spasm mimics stenosis: withdraw if the catheter caused it, re-engage carefully, give intracoronary nitrate, re-image the same view, use OCT or IVUS if it persists, and document relief.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-acquiring-setup",
      title: "Before the pedal: table, detector, shields and the X-ray chain",
      minutes: 13,
      topics: ["dx-cine-acquisition"],
      sources: [
        { book: "brilakis-pci", loc: "1.6" },
        { book: "brilakis-pci", loc: "2.5" },
        { book: "brilakis-pci", loc: "6.4" },
        { book: "brilakis-pci", loc: "28.2" },
        { book: "oxford-cath", loc: "ch 1: Radiology equipment" },
        { book: "oxford-cath", loc: "ch 1: Fluoroscopy and acquisition" },
        { book: "oxford-cath", loc: "ch 1: Radiation safety" },
        { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
      ],
      refs: [...BOOKS, "esc-revasc-2018"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis makes positioning a formal step (step 4) with a single goal: excellent cine images at the lowest possible radiation dose for the patient and the operator. Most of what decides image quality and dose is fixed before the first frame: how high the table is, how far the detector sits from the chest, how steep the angle is, where the shields are and where you stand. Learning why requires a little of the X-ray chain.",
        },
        { kind: "h", text: "The X-ray chain in one page" },
        {
          kind: "list",
          items: [
            "**The tube sits under the table and the detector above the patient** on the C-arm (Oxford). Inside the tube, a heated tungsten coil (cathode) releases electrons, a high voltage (kV) drives them into a spinning tungsten disc (anode), and X-rays and heat are produced; the spinning spreads the heat and makes the whirring you hear.",
            "**Collimators** are lead plates in the tube housing that narrow the beam to the area you need.",
            "**Three settings shape the beam**: tube voltage (kV), tube current (mA) and filtration (an aluminium or copper filter at the beam exit).",
            "**Dose rate control** in modern systems adjusts mA and kV automatically so the detector receives a constant dose, which keeps the image steady when you change angle. The catch: steep angles and thick patients silently drive the dose up.",
            "**Detectors**: the older image intensifier turns X-rays into light, then electrons, then light again for a camera; the newer flat panel turns X-rays into light and then into electrons that form a digital image.",
          ],
        },
        {
          kind: "table",
          caption: "What each setting does (built from Oxford Table 1.1 and its text)",
          head: ["Change", "Number of photons", "Photon energy", "Practical effect"],
          rows: [
            ["Raise kV", "More", "Higher", "More penetrating beam: less is absorbed, so dose falls, but contrast in the image falls too"],
            ["Raise mA", "More", "Unchanged", "More photons, each of the same energy"],
            ["Add filtration", "Fewer", "Higher", "Fewer photons, each of higher energy; by Oxford's rule, higher energy means less absorption and lower image contrast"],
          ],
        },
        {
          kind: "p",
          text: "Oxford defines optimisation as an adequate diagnostic picture at the lowest practicable dose and groups the levers in two. Equipment levers: dose rate control, projection angle (shallow angles expose less thickness and surface), kV and mA, pulsed fluoroscopy and the acquisition settings. Technique levers: the patient as far as possible from the tube and as close as possible to the detector, and collimation.",
        },
        { kind: "h", text: "Step 4: setting up the room" },
        {
          kind: "steps",
          title: "Patient, receptor, shields, operator (Brilakis 6.4, 28.2)",
          items: [
            {
              title: "1. Table up",
              detail:
                "As high as you can while still working comfortably and ergonomically. Raising the table moves the patient away from the tube, which lowers the skin dose at the beam entry.",
            },
            {
              title: "2. Detector down",
              detail:
                "Bring the image receptor as close to the patient as possible. Brilakis reproduces a consensus figure: with a lower table but the detector still close, the entrance dose rate is about 40% higher; with a low table and a raised detector, the skin dose is 260% of the optimal set-up and the image is 40–50% larger from geometric magnification.",
            },
            {
              title: "3. Choose the angle, shallow where you can",
              detail:
                "Brilakis lists the usual first projections: AP for the left main ostium; RAO with some caudal and AP cranial for the LAD; LAO with cranial angulation for the RCA; LAO for saphenous vein and radial grafts; AP for internal mammary grafts. Angles steeper than about 30° from AP raise the dose because the beam crosses more tissue, and Brilakis notes that the automatic dose increase is often not recognised by the operator.",
            },
            {
              title: "4. Move the C-arm with care",
              detail:
                "Excessive detector movement can strike the patient; some systems have collision sensors. Move yourself out of the C-arm's path, because the moving parts can injure the operator too. Oxford adds: let the image intensifier finish moving before you screen.",
            },
            {
              title: "5. Shields between patient and operator",
              detail: "Place the shield to block scatter from the patient. Brilakis adds that fixed shields work best kept low and near the patient.",
            },
            {
              title: "6. Step back",
              detail:
                "Stand as far from the patient and the tube as you can; a tubing extension on the manifold makes this practical. Oxford's inverse square law: doubling your distance from 1 m to 2 m cuts your exposure to a quarter.",
            },
          ],
        },
        { kind: "tip", id: "diag-acq-table-up-detector-down" },
        {
          kind: "check",
          stem: "To make room for your hands, a colleague lowers the table and raises the detector before an LAO cranial run. What happens, according to the consensus figure Brilakis reproduces?",
          options: [
            "Patient skin dose rises to about 2.6 times the optimal set-up and the image is magnified",
            "Dose is unchanged because automatic dose rate control holds the detector exposure constant",
            "Operator dose falls because the patient is further from the tube on the operator's side",
            "Image quality improves because the magnified image shows the small branches more clearly",
          ],
          answer: 0,
          explanation:
            "A low table with a raised detector produced 260% of the skin dose of the high-table, close-detector set-up, with a 40–50% larger image from geometric magnification. Lowering the table brings the skin closer to the tube, so the entrance skin dose rises (Brilakis Fig 28.6; Oxford), and raising the detector adds geometric magnification. Dose rate control keeps the image looking normal, so the penalty is not visible on screen. Magnification by geometry is not a free gain; Oxford notes that magnification raises the skin dose rate.",
        },
        { kind: "h", text: "When the picture is poor" },
        {
          kind: "table",
          caption: "Poor image quality (Brilakis 6.4.3)",
          head: ["Causes", "Prevent", "Fix during the case"],
          rows: [
            [
              "Large patient; excessive angulation; receptor too far from the patient; structures of very different density in the field",
              "Shallower angulation, which the beam penetrates more easily; narrow the beam with collimation to what you need to see, and add filtration",
              "Shallower angulation; change the X-ray settings, for example frame rate and pulse rate, accepting more dose for more penetration",
            ],
          ],
        },
        {
          kind: "list",
          items: [
            "**AP is not always best.** Brilakis notes that a straight AP view puts the spine in the field, so a slightly angulated view is often preferable.",
            "**RAO and the operator.** The RAO projection can give the operator less radiation; it is excellent for the mid LAD, less so for wiring the RCA.",
            "**Magnification costs dose.** Lower magnification needs less radiation (Brilakis); magnification increases the dose rate to the skin (Oxford).",
            "**Collimation** narrows the irradiated skin and lowers the dose-area product, though not the total air kerma, and limits overlapping skin exposure when you change angle. Keep checking the parts you have collimated out, such as the guide tip or wire tip.",
            "**Change the angle in long cases.** Brilakis repositions the image intensifier often so that no single skin entry point takes all the dose; Oxford varies the PCI working view for the same reason, and many systems now show a skin dosimeter.",
          ],
        },
        { kind: "h", text: "Watching the dose as you acquire" },
        {
          kind: "p",
          text: "Brilakis monitors cumulative air kerma and dose-area product throughout (2.5) and tracks the dose rate, acting if it exceeds 20 mGy/min. In 2.5 he writes that the procedure is usually stopped when air kerma exceeds 5–7 Gy; in 28.2 he says to consider stopping, and staging, at 7–8 Gy. Taken together, the same author is telling you that somewhere between 5 and 8 Gy the case needs a deliberate decision to stop or stage. He suggests a lab protocol that announces the dose every 1 Gy and/or every 30 minutes. Oxford puts a typical coronary angiogram at about 6 mSv effective dose, equivalent to about 2.7 years of background radiation and roughly an extra 1 in 3500 lifetime risk of fatal cancer. Oxford asks you to weigh that against the background chance of anyone getting cancer in a lifetime, roughly 1 in 3, and bases its estimates on data from atomic bomb survivors and people who work with nuclear material.",
        },
        {
          kind: "p",
          text: "**High doses and what follows.** Brilakis 2.5 calls an air kerma above 15 Gy a sentinel event; his radiation-injury section (28.2) gives the threshold as a peak skin dose above 15 Gy, a US Joint Commission term, with the hospital's risk management team and the regulators informed within 24 hours. In the UK, exposures are governed by IR(ME)R, and Oxford asks for the local radiation protection adviser to be contacted whenever a dose greater than expected is delivered. The follow-up thresholds in 28.2: after more than 5 Gy air kerma, see the patient within a month and record a skin examination, including the back; after more than 10 Gy, a qualified physicist should promptly calculate the peak skin dose and the skin is examined at 2–4 weeks. Skin injury itself is managed in the complications module.",
        },
        {
          kind: "p",
          text: "**Plan the angiogram before you start (Brilakis 1.6).** In renal failure, limit contrast: biplane angiography if available, fewer cine projections, IVUS, and contrast-saving systems; consider iso-osmolar contrast and give hydration before and after. Brilakis hydrates with normal saline at 1–3 mL/kg/h; the 2018 ESC/EACTS regimen for moderate to severe kidney disease is isotonic saline at 1 mL/kg/h for 12 hours before and 24 hours after, reduced to 0.5 mL/kg/h if the ejection fraction is 35% or less or there is overt heart failure (see the foundations lesson on kidney protection). At the top of Brilakis's range a 70 kg patient would receive about 210 mL an hour, so think about LV function first and follow local protocol. After a previous radiation skin injury, take fewer cine runs and keep the injured skin out of the beam.",
        },
        { kind: "tip", id: "diag-acq-high-dose-adjust" },
        {
          kind: "check",
          stem: "During a long diagnostic study with graft angiography, the dose display shows a rate above 20 mGy/min in a steep LAO cranial view with magnification on. Which change does not lower patient dose?",
          options: [
            "Reducing the angulation towards a shallower projection",
            "Switching to a lower magnification field",
            "Raising the detector away from the patient's chest",
            "Dropping the fluoroscopy rate from 15 to 7.5 frames per second",
          ],
          answer: 2,
          explanation:
            "Raising the detector increases the tube-to-detector distance, and dose rate control then drives more output to keep the detector dose constant; Brilakis and Oxford both want the receptor as close to the patient as possible. Shallower angles, lower magnification and screening at 6–7.5 fps rather than 15 fps (which halves the dose) all reduce dose, and 20 mGy/min is the dose rate at which Brilakis prompts a change. Collimation also helps: it reduces the irradiated skin area and the dose-area product, though not the total air kerma (Brilakis 28.2).",
        },
        {
          kind: "pitfalls",
          items: [
            "A low table and a high detector for comfort: up to 2.6 times the skin dose with a magnified image.",
            "Trusting the image to warn you of dose: automatic dose control hides steep-angle penalties.",
            "Leaving magnification on for the whole case.",
            "Screening while the C-arm is still moving, or standing in its path.",
            "Using the same steep projection for every run of a long case.",
          ],
        },
        {
          kind: "pearl",
          text: "Before every new angle, run a two-second ritual: table high, detector down, shield in, one step back. It costs nothing, and in the consensus figure Brilakis reproduces, poor geometry alone gave up to 2.6 times the skin dose.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, set up an RCA study: choose LAO with cranial angulation as Brilakis's usual first RCA view, then compare a shallow and a steep cranial angle. Note how the image changes and keep the steepest angle you need, not the steepest the C-arm allows.",
        },
        { kind: "video", id: "CuPjSsGRREM", note: "Manual of PCI chapter video on preventing radiation-related complications." },
        { kind: "video", id: "b612bxTygFg", note: "How to reduce radiation dose during cardiac catheterisation." },
        {
          kind: "keypoints",
          items: [
            "Tube below, detector above; kV, mA and filtration shape the beam; dose rate control holds the image steady by changing output.",
            "Table high, detector close, shield between, operator back with a tubing extension.",
            "Usual first views: AP for the left main, RAO caudal and AP cranial for the LAD, LAO cranial for the RCA, LAO for vein and radial grafts, AP for mammary grafts.",
            "Steep angles (beyond about 30° from AP), magnification and a raised detector all raise dose; collimate and change angle in long cases.",
            "Watch air kerma, dose-area product and dose rate (act above 20 mGy/min); stop or stage in the 5–8 Gy range; a peak skin dose above 15 Gy is a US Joint Commission sentinel event (UK: IR(ME)R and local rules); follow up above 5 Gy air kerma.",
            "Plan around renal failure (less contrast; hydrate, at a lower rate if LV function is poor) and previous skin injury before the first run.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-acquiring-cine",
      title: "Recording the run: injection, breath-hold, panning and frame rate",
      minutes: 15,
      topics: ["dx-cine-acquisition"],
      sources: [
        { book: "brilakis-pci", loc: "6.5" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "6.7" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "17.5" },
        { book: "brilakis-pci", loc: "18.6" },
        { book: "brilakis-pci", loc: "21.6" },
        { book: "brilakis-pci", loc: "28.2" },
        { book: "oxford-cath", loc: "ch 1: Fluoroscopy and acquisition" },
        { book: "oxford-cath", loc: "ch 1: Radiation safety" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis states the goal of step 6 plainly: high-quality cine of every coronary artery in orthogonal projections with as little overlap as possible. A run that does not fill the artery, that streams, or that stops before the distal bed has filled is not a diagnostic run, however good the catheter position was; panning across the region of interest degrades the image of the segment you need to grade.",
        },
        { kind: "h", text: "Fluoroscopy and cine are different tools" },
        {
          kind: "table",
          caption: "The two imaging modes (Oxford chapter 1; Brilakis 28.2)",
          head: ["", "Pulsed fluoroscopy (screening)", "Acquisition (cine)"],
          rows: [
            ["Used for", "Real-time scouting, wiring, delivering balloons and stents", "Recording high-resolution, low-noise images for diagnosis and the record"],
            ["Frame rate", "Typically 7.5 frames per second (Oxford); Brilakis uses 6–7.5 fps, which halves the dose compared with 15 fps, and even 3.75 fps in thin patients", "Usually 12.5–30 fps; the Oxford Heart Centre uses 7.5 fps"],
            ["Dose", "Lower", "About 10 times the dose of fluoroscopy (Brilakis), and not counted in the fluoroscopy time"],
            ["Saving", "Modern systems store the last seconds of fluoroscopy ('fluoro save'); use it rather than cine to document balloon and stent inflations", "Every run is stored; how many runs you take and how long they last usually decide most of the patient's dose"],
          ],
        },
        {
          kind: "p",
          text: "Oxford's conclusion is to use cine sparingly. Low frame-rate acquisitions lower the dose at some cost to quality, and Oxford lists long interventions and pregnancy as situations where they are used. If you see something unexpected while screening, such as an air bubble embolising, Oxford asks the radiographer to store that loop before the screening pedal is pressed again.",
        },
        { kind: "h", text: "One run, step by step" },
        {
          kind: "steps",
          title: "Recording a coronary run (Brilakis 6.5–6.7, Oxford ch 6)",
          items: [
            {
              title: "1. Frame it so you will not need to pan",
              detail:
                "Position the table and receptor so the whole artery fits. Brilakis's examples: for the left system in RAO cranial, the catheter tip sits in the upper left corner of the screen; in LAO caudal (the spider), the catheter sits in the middle of the screen.",
            },
            {
              title: "2. Look at the trace and the ECG",
              detail: "No damping, no ventricularisation, no new hypotension and no new ECG change (step 5).",
            },
            {
              title: "3. Check the syringe",
              detail:
                "No air in the syringe or tubing (Oxford). Brilakis holds the syringe vertical during the injection to avoid embolising a bubble; Oxford tilts the distal end of the syringe up for the same reason.",
            },
            {
              title: "4. Breath-hold",
              detail:
                "Oxford asks for deep inspiration so the diaphragm drops and the heart moves less. Some views, such as LAO cranial for the distal RCA, are better at end-expiration. Watch the catheter as the patient breathes in: Brilakis lists deep breaths, especially in radial cases, as a cause of the catheter backing out during injection.",
            },
            {
              title: "5. Press the pedal, then inject",
              detail:
                "Start cine first and inject after 1–2 seconds. The first frames show any stent or calcium before contrast arrives and let the previous injection clear.",
            },
            {
              title: "6. Inject enough, fast enough",
              detail:
                "Fill the artery completely, with contrast refluxing into the aorta. Oxford's typical volumes are 5–10 mL for the left coronary and 3–5 mL for the right, more for grafts; its target is a vessel filled for 3 beats with reflux back into the root. Volume and rate vary with artery size, patient size and conditions such as aortic valve disease, and only a tiny amount is needed for a small non-dominant vessel or an occluded artery.",
            },
            {
              title: "7. Pan only if you must",
              detail:
                "The manuals differ here. Oxford has the radiographer pan to follow the distal vessels, but keeps the field fixed on any particular point of interest. Brilakis pans only when needed to show all branches, the distal vessel and any collateral filling of other arteries, and otherwise avoids it because panning degrades the image, above all in dual injections for chronic total occlusions. Framing the run well (step 1) is what makes panning unnecessary.",
            },
            {
              title: "8. Stop when everything has filled",
              detail:
                "Keep recording until all branches, and collateral branches when an artery is occluded, are opacified. Avoid long runs unless collateral filling is delayed; Oxford uses prolonged acquisition for collaterals and for grading myocardial blush.",
            },
            {
              title: "9. Refill and re-check",
              detail: "Refill the syringe with contrast ready for the next run, then check the trace and ECG again for damping, hypotension, ST change or arrhythmia, including VF (step 7). Brilakis lists four things that can go wrong during cine: spasm, air embolism, embolism of thrombus or other debris, and dissection. Look for each on every run; their management is taught in the engaging module and the complications modules.",
            },
          ],
        },
        { kind: "tip", id: "diag-acq-frame-then-pedal" },
        { kind: "tip", id: "diag-acq-breath-hold" },
        {
          kind: "check",
          stem: "You inject 3 mL briskly into the left coronary. The LAD shows swirls of dark and light contrast and no contrast refluxes into the aorta. What does Oxford call this, and what is the fix?",
          options: [
            "Streaming from too little or too slow an injection; repeat with more volume and force until the root refluxes",
            "Slow flow from a proximal lesion; record a longer run to watch the distal bed fill",
            "Catheter-tip spasm; withdraw the catheter and give intracoronary nitrate before repeating",
            "Super-selective LAD engagement; change to a Judkins left catheter one size larger",
          ],
          answer: 0,
          explanation:
            "Mixing of opacified and unopacified blood is streaming, which Oxford attributes to an inadequate volume or speed of injection; it makes stenoses difficult to grade reliably. Oxford's typical left coronary volume is 5–10 mL, injected so the vessel fills for 3 beats with reflux into the root. Slow flow and spasm are real diagnoses, but neither is suggested by streaming with no reflux after a small injection.",
        },
        { kind: "h", text: "When the run is not good enough" },
        {
          kind: "table",
          caption: "Three acquisition problems (Brilakis 6.6.3; Oxford ch 6)",
          head: ["Problem", "Causes", "What to do"],
          rows: [
            [
              "The artery will not fill",
              "Small catheter (especially 4 French); side-hole catheter; large or ectatic arteries; poor engagement; high coronary flow (from an arteriovenous fistula, dilated or hypertrophic obstructive cardiomyopathy, or severe aortic stenosis); viscous contrast (iso-osmolar agents are thicker than low-osmolar ones); weak injection; high LV end-diastolic pressure",
              "A larger lumen (a guide catheter or a bigger diagnostic catheter); avoid side holes; inject harder, perhaps with an automated injector, though manual injection lets you tailor the force and is preferred if the trace damps slightly. Oxford notes that small catheters need more force and that autoinjectors help them",
            ],
            [
              "The catheter backs out during injection",
              "Poor engagement; a strong injection; too little catheter support for the force needed; deep breaths, especially in radial cases",
              "Prevent: coaxial engagement first, then start the injection softly and build up. Treat: re-engage and retry, change catheter, anchor with a wire in the artery, use a guide catheter extension, or ramp the pressure up slowly",
            ],
            [
              "Some segments are never seen well",
              "Poor engagement; weak injection; overlap; a large patient; too few views",
              "Improve filling (engagement, a larger catheter) and add projections, at least two orthogonal views per segment",
            ],
          ],
        },
        {
          kind: "p",
          text: "Brilakis is firm on the first problem: complete filling is critical to interpretation, and if you cannot achieve it, declare the angiogram non-diagnostic rather than offer an interpretation that may be wrong.",
        },
        { kind: "tip", id: "diag-acq-streaming-fill" },
        { kind: "tip", id: "diag-acq-catheter-backs-out" },
        { kind: "tip", id: "pci-acq-fluoro-save-inflations" },
        {
          kind: "check",
          stem: "A 4 French diagnostic catheter with a free trace cannot fill a large, ectatic RCA despite firm hand injections. The images stream. What does Brilakis recommend?",
          options: [
            "Report the RCA as diffusely diseased, since the ectatic segments are poorly filled anyway",
            "Change to a catheter with a larger lumen, such as a guide or a bigger diagnostic catheter",
            "Change to a side-hole catheter so the contrast can be injected faster without damping",
            "Record longer runs with panning so that the slow filling eventually opacifies the vessel",
          ],
          answer: 1,
          explanation:
            "Small catheters (especially 4 French) and large or ectatic arteries are both on Brilakis's list of causes of incomplete filling, and the remedy is a larger lumen. Side-hole catheters are on the same list as a cause, so changing to one would not help. Reporting disease from an unfilled artery is exactly what he warns against: call it non-diagnostic instead.",
        },
        { kind: "h", text: "Special situations" },
        {
          kind: "list",
          items: [
            "**Left dominance or an occluded RCA.** In his left main chapter Brilakis warns that prolonged injections into the left main can cause hypotension in a left-dominant circulation or when the RCA is totally occluded.",
            "**Contrast that does not clear.** When a catheter occludes an ostium the contrast stays in the artery, and Brilakis warns that VF or VT may follow; disengage so it can wash out. At aorto-ostial lesions he also limits the number of acquisitions to lower the dissection risk, and uses non-selective angiography when engagement damps severely, accepting poorer images.",
            "**Collaterals and occlusions.** In prior bypass patients and whenever a chronic total occlusion is found, Brilakis wants long runs without panning, ideally at low magnification and during a breath-hold, so collaterals fill completely. Most CTO PCI uses dual injection, and panning is best avoided in those runs.",
            "**Bypass grafts.** For long vein grafts that supply a large territory, Brilakis prolongs the run to see how the distal coronary fills. Before selective angiography of an internal mammary graft he images the proximal subclavian artery non-selectively to exclude a stenosis that could cause subclavian steal, or, if he does not, compares the subclavian pressure with the aortic pressure. Graft engagement and angiography are taught in full in the bypass grafts module (cp-prior-cabg).",
            "**After the case.** Oxford reviews each stored loop to exclude complications such as dissection or embolism and reassesses the stenosis grading.",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Injecting at the same moment as pressing the pedal, so there is no contrast-free frame to show calcium or a stent.",
            "Small, slow injections that stream and create false lesions.",
            "Panning through the segment you are trying to grade.",
            "Stopping the run before the distal bed or the collaterals have filled.",
            "Using cine to document every balloon inflation when fluoro save would do.",
            "Accepting a poorly filled artery as diagnostic.",
          ],
        },
        {
          kind: "pearl",
          text: "Count the beats. If the artery is not full for about three beats with contrast spilling back into the aorta, the injection was too small or too slow, whatever it felt like on the syringe.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, record a left coronary run in RAO cranial with the catheter tip in the upper left of the screen: start cine, inject after 1–2 seconds, fill until contrast refluxes into the aorta, and stop when the distal LAD has filled. Then record LAO caudal with the catheter centred, and compare the two without panning.",
        },
        { kind: "video", id: "Y3bEFuzTpB8", note: "Manual of PCI chapter video on how to perform coronary angiography." },
        { kind: "video", id: "XxUGDCim5sg", note: "Coronary angiography tips." },
        {
          kind: "keypoints",
          items: [
            "Fluoroscopy for moving and positioning, cine for recording; cine is about 10 times the dose and is the main source of patient dose; use fluoro save for inflations.",
            "Frame the run first, check trace and ECG, syringe vertical with no air.",
            "Deep inspiration for most views, end-expiration for some (LAO cranial for the distal RCA); watch for the catheter backing out.",
            "Pedal first, inject after 1–2 seconds, fill completely with reflux (about 5–10 mL left, 3–5 mL right; 3 beats).",
            "Pan only when needed (Oxford pans to follow distal vessels; Brilakis avoids it); record until every branch and collateral has filled; long runs only for delayed collaterals or long vein grafts.",
            "Poor filling: larger lumen, no side holes, stronger injection; if still incomplete, call it non-diagnostic.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-acquiring-views",
      title: "Choosing, naming and completing the projections",
      minutes: 15,
      topics: ["dx-projections"],
      sources: [
        { book: "brilakis-pci", loc: "6.4" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "17.6" },
        { book: "brilakis-pci", loc: "28.2" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Left coronary artery" },
        { book: "oxford-cath", loc: "ch 6: Right coronary artery" },
        { book: "oxford-cath", loc: "ch 6: Quantification of stenoses" },
        { book: "oxford-cath", loc: "ch 6: Tips for interpretation" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "The diagnostic views module (dx-views) teaches how to recognise a projection and the rules that predict where each vessel lies. This lesson is about the decisions at the table: which view to take first, how to write it down so anyone can repeat it, which set of views makes an angiogram complete, and how the set changes when the question is a single lesion you are about to treat.",
        },
        { kind: "h", text: "Naming a projection" },
        {
          kind: "list",
          items: [
            "**Two angles.** Rotation to the patient's left (LAO) or right (RAO), and tilt towards the head (cranial) or the feet (caudal).",
            "**AP and PA are the same frontal view.** Brilakis calls it AP; Oxford calls it PA. The beam travels from the tube under the table to the detector above, so the pictures are identical; expect both words in reports.",
            "**Oxford's signed shorthand.** Its figures write rotation first and tilt second, with RAO and caudal negative: RAO caudal (−30°/−20°), LAO cranial (50°/20°), PA cranial (0°/40°). Write the numbers down, not only the name.",
            "**A quick check from the image.** Oxford: if the spine is on the left of the picture the view is RAO, and if it is on the right the view is LAO.",
            "**A rule for choosing tilt.** Oxford: proximal vessels are generally seen with caudal projections and distal vessels with cranial ones.",
          ],
        },
        {
          kind: "check",
          stem: "A colleague's note reads 'LCA (−45°/20°)'. Which view is it, in Oxford's convention?",
          options: ["LAO 45° caudal 20°", "RAO 45° cranial 20°", "RAO 45° caudal 20°", "LAO 20° cranial 45°"],
          answer: 1,
          explanation:
            "Oxford writes rotation first and tilt second, with RAO and caudal negative. −45° is therefore RAO 45°, and +20° is cranial 20°: the RAO cranial view of the main LAD shown in Oxford's figure. Reading the sign of the first number as cranial or caudal is the usual slip.",
        },
        { kind: "h", text: "The first view and the complete set" },
        {
          kind: "table",
          caption: "Brilakis's starting projection and his orthogonal set for each vessel (6.4 and 6.6)",
          head: ["Vessel", "Usual first view", "Complete set"],
          rows: [
            ["Left main", "AP, to see the ostium", "AP, then RAO with caudal tilt, RAO with cranial tilt, LAO with cranial tilt and LAO with caudal tilt (the spider)"],
            ["LAD", "RAO with some caudal angulation, and AP cranial", "AP or RAO cranial, RAO caudal"],
            ["RCA", "LAO with cranial angulation", "LAO, LAO cranial or AP cranial, RAO"],
            ["Saphenous vein and radial grafts", "LAO", "LAO, RAO"],
            ["Internal mammary grafts", "AP", "AP, lateral, AP cranial or RAO cranial"],
          ],
        },
        {
          kind: "p",
          text: "Oxford gives a 'rough guide' (its Table 6.1) that separates the ostium of each vessel from its body. For the left main, both ostium and body are seen in PA, LAO and LAO caudal. For the LAD and diagonals, the ostia show in RAO caudal, PA caudal and LAO cranial and the body in RAO cranial and lateral. For the circumflex, intermediate and obtuse marginals, the ostia show in RAO cranial, RAO caudal and LAO caudal, and the body in LAO caudal. For the RCA, the ostium shows in LAO and RAO and the distal vessel in PA cranial and LAO cranial.",
        },
        {
          kind: "table",
          caption: "One department's routine: the Oxford University Hospitals sequence (rotation/tilt, RAO and caudal negative)",
          head: ["Artery", "Engage in", "Then acquire"],
          rows: [
            ["Left coronary", "PA", "−30°/−10° (RAO, shallow caudal); −90°/0° (right lateral); −45°/20° (RAO cranial); −45°/−20° (RAO, steep caudal); 50°/20° (LAO cranial); 40°/−30° (LAO caudal)"],
            ["Right coronary", "LAO", "45°/0° (LAO); −45°/0° (RAO); −90°/0° (right lateral); 50°/20° (LAO cranial)"],
          ],
        },
        {
          kind: "table",
          caption: "What each of Oxford's illustrated views shows best",
          head: ["View (rotation/tilt)", "Best for"],
          rows: [
            ["PA (0°/0°)", "Proximal left main and LAD"],
            ["PA cranial (0°/40°)", "Mid and distal LAD; for the RCA, the distal vessel and PDA"],
            ["PA caudal (0°/−30°)", "Circumflex, with the ostium and body of the left main and the proximal LAD"],
            ["LAO cranial (50°/20°)", "Separating the LAD from its diagonals; for the RCA, the distal vessel and PDA"],
            ["LAO caudal, the spider (40°/−30°)", "Proximal vessels: left main, proximal LAD, intermediate, proximal circumflex"],
            ["Left lateral (90°/0°)", "Mid LAD, the LIMA-to-LAD anastomosis and the distal LAD"],
            ["RAO caudal (−30°/−20°)", "Proximal circumflex and left main"],
            ["RAO cranial (−45°/20°)", "The main LAD"],
            ["RCA LAO (45°/0°)", "Proximal, mid and distal RCA"],
            ["RCA RAO (−45°/0°)", "Proximal and mid RCA"],
          ],
        },
        {
          kind: "p",
          text: "**The two manuals start differently.** Brilakis begins the left main in AP and Oxford engages and starts in PA, which is the same frontal view; Oxford images left main engagement in PA or LAO, and with the TIG radial catheter uses PA for the left and LAO for the right. Both start the RCA in LAO. Neither treats its list as fixed: Oxford warns that operators should not simply perform a 'standard' set, and that relying on straight LAO and RAO without cranial or caudal tilt images the left coronary artery inadequately.",
        },
        { kind: "tip", id: "diag-acq-complete-view-set" },
        {
          kind: "cine",
          run: "cd-01043-LCA-5",
          caption: "Real left coronary run with recorded C-arm angles LAO 25°, caudal 30° (a spider view). Name the left main, the LAD and the circumflex origins before reading on.",
        },
        {
          kind: "cine",
          run: "cd-01043-LCA-4",
          caption: "The same study in RAO 34°, cranial 25°. Compare how the LAD body is laid out here with the spider view above.",
        },
        { kind: "h", text: "Every segment, two views, least foreshortened" },
        {
          kind: "steps",
          title: "Making sure the set is complete",
          items: [
            {
              title: "1. Two views of every segment, ideally at 90°",
              detail:
                "Brilakis requires orthogonal projections of each arterial segment; Oxford wants every lesion in at least two projections, preferably orthogonal, especially an eccentric stenosis, because an oval lesion can look severe in one view and normal in the other.",
            },
            {
              title: "2. Grade where it looks worst and longest",
              detail: "Brilakis grades the lesion in the projection where it appears most severe and least foreshortened.",
            },
            {
              title: "3. Remove overlap and foreshortening",
              detail:
                "Oxford: a vessel not imaged at 90° to the beam looks shorter and more severe. Choose views that show the lesion free of other vessels, side branches and obscuring structures, and use separate views for the proximal and distal ends of a long lesion if needed.",
            },
            {
              title: "4. Ask what is missing",
              detail: "Before you finish, check that every territory has a supplying vessel (lesson 5) and that each graft is seen from origin to insertion.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A mid-LAD lesion looks 50% narrowed in RAO cranial but 85% in LAO cranial, where it also looks shorter. Which view should you grade it from, and what is the risk?",
          options: [
            "RAO cranial, because a longer-looking lesion is the less foreshortened and so the more accurate projection",
            "LAO cranial, because the most severe appearance is always the one to report whatever the foreshortening",
            "Neither alone: find a view where it is both worst and least foreshortened, because foreshortening exaggerates severity",
            "Average the two estimates to about 68%, because both orthogonal views carry equal weight in grading",
          ],
          answer: 2,
          explanation:
            "Brilakis grades in the view where the lesion looks worst and least foreshortened; here the two criteria point to different views. Oxford warns that a foreshortened lesion appears shorter and more severe, so the LAO cranial figure may overstate it, while an eccentric lesion may be understated in the other view. Adjust the angle until both conditions meet, and remember that physiology or imaging settles an intermediate lesion (interpreting module). Averaging has no basis in either manual.",
        },
        { kind: "h", text: "Views for a lesion you will treat" },
        {
          kind: "p",
          text: "Diagnostic angiography surveys the whole tree; for PCI, Oxford asks for a focused study of the target that defines lesion length, the reference diameter on either side, and complexity features: nearby side branches, tortuosity, calcium and thrombus. Oxford's Table 8.1 offers starting views, which you should adapt to the patient:",
        },
        {
          kind: "table",
          caption: "Starting views for PCI targets (Oxford Table 8.1, rotation then tilt)",
          head: ["Target", "Suggested views"],
          rows: [
            ["Proximal LAD", "RAO 30° with 20° caudal; RAO 30° with 30° cranial; LAO 45° with 25° caudal; PA with 30° caudal"],
            ["Mid and distal LAD", "LAO 50° with 30° cranial; LAO 10° with 35–40° caudal; PA with 30° cranial"],
            ["Circumflex", "RAO 30° with 20° caudal; PA with 30° caudal; LAO 45° with 25° caudal; LAO 60° with no tilt"],
            ["Proximal and mid RCA", "LAO 40–50°; RAO 30°"],
            ["Mid and distal RCA, including the crux", "PA cranial 30°; LAO 45° cranial 30°"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Ostia (Brilakis 15.1.6).** The least foreshortened views of an ostium: RCA, steep LAO with or without caudal tilt; left main, LAO caudal and LAO cranial; right-sided vein grafts, LAO; left-sided vein grafts, RAO; LIMA and RIMA, AP with shallow cranial tilt. A prior coronary CT can tell you the best angle in advance.",
            "**Left main (Brilakis 17.6).** The bifurcation is best seen in RAO caudal, AP caudal and LAO caudal; LAO cranial or AP cranial is most reliable for placing a stent edge at the aorto-ostial junction. The left main ostium is usually oval, so orthogonal views matter.",
            "**The limits of left main angiography (Brilakis 17.6).** Angiography is usually adequate when a left main lesion narrows the diameter by 70% or more, but observers disagree widely on lesions of 30–70%, because a short, often diffusely diseased left main has no normal reference segment. For an intermediate left main lesion, physiology or intravascular imaging is essential (physiology and imaging modules).",
            "**Working view and dose.** Brilakis keeps the PCI working angle shallow, since angles steeper than about 30° from AP raise dose; Oxford varies the view during long procedures to spread the skin dose.",
          ],
        },
        { kind: "tip", id: "pci-acq-target-orthogonal-views" },
        { kind: "tip", id: "diag-acq-ostium-views" },
        {
          kind: "pitfalls",
          items: [
            "Running a fixed routine and never adding the view that the lesion needs.",
            "Using only straight LAO and RAO for the left coronary artery.",
            "Grading a lesion from a single view, or from a foreshortened one.",
            "Recording angles by name only; 'RAO cranial' covers a wide range of real angles.",
            "Assuming AP and PA are different views when reading a report from another lab.",
          ],
        },
        {
          kind: "pearl",
          text: "Write the numbers. A note such as 'LAD lesion best at RAO 30° cranial 30°' lets you, or the operator doing the PCI next week, return to the exact view in one move, which saves runs, contrast and dose.",
        },
        {
          kind: "sim",
          sim: "views",
          task: "In the view trainer, build Brilakis's left main set (AP, then RAO with caudal tilt, RAO with cranial tilt, LAO with cranial tilt and LAO with caudal tilt (the spider)) and write each as Oxford's signed pair (for example −30°/−20°). Then find the least foreshortened view of the RCA ostium.",
        },
        { kind: "drill", target: "angio-real", drill: "view", task: "Name the projection of real runs from the image alone, then check the recorded angles." },
        { kind: "drill", target: "angio-real", drill: "plan", task: "From the first runs of a real study, choose the next projection that completes the orthogonal set." },
        { kind: "video", id: "r2zahMaZjHY", note: "Coronary angiographic views." },
        { kind: "video", id: "XxUGDCim5sg", note: "Coronary angiography tips." },
        {
          kind: "keypoints",
          items: [
            "AP (Brilakis) and PA (Oxford) are the same frontal view; Oxford writes rotation/tilt with RAO and caudal negative.",
            "Spine on the left of the image: RAO; on the right: LAO. Caudal for proximal vessels, cranial for distal.",
            "First views: AP for the left main, RAO caudal and AP cranial for the LAD, LAO cranial for the RCA, LAO for vein and radial grafts, AP for mammary grafts.",
            "Complete sets: left main in AP plus RAO and LAO each with caudal and with cranial tilt (LAO caudal being the spider); LAD AP or RAO cranial, and RAO caudal; RCA LAO, LAO or AP cranial, RAO; grafts as listed.",
            "Every segment in two orthogonal views; grade where worst and least foreshortened; foreshortening makes lesions look shorter and more severe.",
            "For PCI, image the target for length, reference diameter and complexity, and use the ostial views when the lesion is at an ostium; an intermediate (30–70%) left main lesion needs physiology or imaging.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-acquiring-anatomy",
      title: "Reading the anatomy and dominance as the runs come in",
      minutes: 14,
      topics: ["fnd-coronary-anatomy-dominance"],
      sources: [
        { book: "brilakis-pci", loc: "6.8" },
        { book: "brilakis-pci", loc: "7.1" },
        { book: "brilakis-pci", loc: "12.2" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "17.5" },
        { book: "brilakis-pci", loc: "19.9" },
        { book: "oxford-cath", loc: "ch 6: Coronary anatomy" },
        { book: "oxford-cath", loc: "ch 6: Left coronary artery" },
        { book: "oxford-cath", loc: "ch 6: Right coronary artery" },
        { book: "oxford-cath", loc: "ch 6: Tips for interpretation" },
        { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
      ],
      refs: [...BOOKS, "sianos-syntax-score-2005"],
      blocks: [
        {
          kind: "p",
          text: "The foundations module (fnd-coronary-anatomy) teaches the branches and territories. This lesson applies them at the table: naming each branch on a live run, deciding dominance before the study ends, numbering segments the way reports and scores do, and noticing when an area of heart has no visible supply. Doing this while you acquire tells you which view is still missing.",
        },
        { kind: "h", text: "The map, as Oxford draws it" },
        {
          kind: "table",
          caption: "Branches and what they supply (Oxford ch 6: Coronary anatomy)",
          head: ["Vessel", "Course", "Branches and territory"],
          rows: [
            ["Left main stem", "From the left sinus of Valsalva", "Divides into LAD and circumflex; occasionally trifurcates with an intermediate branch between them"],
            ["LAD", "Down the interventricular groove", "Anterior wall; diagonals to the anterolateral wall; septals to the front two-thirds of the septum and to the left bundle branch; its final part reaches the apex and often wraps round to part of the inferior wall"],
            ["Circumflex", "Posteriorly in the left atrioventricular groove", "Posterior wall of the LV; obtuse marginals to the lateral wall"],
            ["RCA", "From the right sinus, down the right atrioventricular groove", "Conus branch (RV outflow tract), acute marginals (RV), the AV node branch and, in 60%, the sinus node branch; beyond the crux the posterior ventricular branch and the PDA, which supplies the inferior LV wall and the inferior third of the septum"],
          ],
        },
        { kind: "h", text: "Naming branches on the screen" },
        {
          kind: "steps",
          title: "Oxford's orientation rules, applied run by run",
          items: [
            {
              title: "1. Fix the view first",
              detail: "Spine on the left of the image means RAO; spine on the right means LAO.",
            },
            {
              title: "2. Find the circumflex",
              detail: "In every view of the left coronary artery, the circumflex lies nearest the spine. The other main vessel is the LAD.",
            },
            {
              title: "3. Sort the LAD's branches by direction",
              detail: "Branches heading towards the circumflex territory (the lateral wall) are diagonals; those heading towards the right ventricle, into the septum, are septals.",
            },
            {
              title: "4. Sort the circumflex's branches",
              detail:
                "Branches running towards the lateral wall are obtuse marginals; the last may be called the terminal marginal. A branch that continues in the AV groove towards the base of the heart is the AV circumflex.",
            },
            {
              title: "5. Name the RCA's branches",
              detail: "One or more RV marginal branches run anteriorly towards the septum but supply mostly RV muscle.",
            },
            {
              title: "6. Check the calibre pattern",
              detail:
                "The LAD tapers as it runs distally (normal proximal diameter: men 3.5–4.0 mm, women 3.0–3.5 mm). The circumflex tapers too, but not until its mid portion, usually after the first obtuse marginal. The RCA keeps a uniform calibre until it divides at the crux.",
            },
          ],
        },
        {
          kind: "check",
          stem: "In an RAO caudal left coronary run, one large vessel runs along the bottom of the image close to the spine and gives branches towards the lateral wall; another runs to the apex. What are they?",
          options: [
            "The vessel near the spine is the circumflex, giving obtuse marginals; the apical vessel is the LAD",
            "The vessel near the spine is the LAD, giving diagonals; the apical vessel is a long obtuse marginal",
            "The vessel near the spine is the intermediate branch; the apical vessel is the circumflex",
            "The vessel near the spine is a septal perforator; the apical vessel is a large diagonal",
          ],
          answer: 0,
          explanation:
            "Oxford's rule is that the circumflex is closest to the spine in every left coronary view, and its branches to the lateral wall are obtuse marginals. The LAD heads for the apex. Calling the spinal vessel the LAD reverses the rule; septals are short branches of the LAD that run into the septum, not a main vessel.",
        },
        { kind: "h", text: "Deciding dominance" },
        {
          kind: "p",
          text: "Oxford defines dominance by the artery that supplies the posterior descending artery: the RCA in 85% of people, the circumflex in 8%, and both (co-dominance or a balanced circulation) in 7%. Brilakis uses the same idea when he describes the PDA and posterolateral branches as branches of the RCA in a right-dominant circulation and of the circumflex in a left-dominant one.",
        },
        {
          kind: "steps",
          title: "Settling dominance during the study",
          items: [
            {
              title: "1. Follow the RCA to its end",
              detail: "In a right-dominant heart it reaches the crux and divides into the PDA and the posterior ventricular branch; LAO cranial or PA cranial shows the distal RCA and PDA (Oxford).",
            },
            {
              title: "2. If the RCA is small and stops early, do not call it occluded yet",
              detail:
                "Look at the left injection: a circumflex that continues in the AV groove to the crux and gives the PDA is left dominance. Oxford notes that a small non-dominant vessel needs only a tiny amount of contrast.",
            },
            {
              title: "3. If neither reaches, look for collaterals",
              detail: "Collateral filling of the distal RCA from the left points to occlusion or a severe stenosis rather than left dominance (interpreting module).",
            },
            {
              title: "4. Record it",
              detail: "Dominance changes segment numbering, SYNTAX weights and several later decisions, so write it in the report.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Why dominance matters later in the case",
          head: ["Situation", "What the manuals say"],
          rows: [
            ["Catheter-tip spasm", "Commonest in a non-dominant RCA and when the artery is little wider than the catheter, so commoner in shorter, lighter patients; the pressure typically falls a few seconds after engagement, and over-engaging a diagnostic catheter, especially in the RCA, is a cause (Oxford)"],
            ["Prolonged contrast injection", "Prolonged injections into the left main can cause hypotension in a left-dominant circulation or when the RCA is totally occluded (Brilakis 17.5)"],
            ["Intracoronary adenosine for physiology", "Brilakis avoids doses above 100 µg in the RCA or a dominant circumflex because of ventricular fibrillation"],
            ["Atherectomy", "For the RCA or a dominant circumflex, plan for bradycardia: a temporary pacemaker, aminophylline or brief test runs (Brilakis 19.9)"],
            ["SYNTAX score", "Segment weights depend on dominance, and co-dominance is not an option (Brilakis Fig 7.2)"],
          ],
        },
        { kind: "tip", id: "diag-acq-dominance-follow-pda" },
        { kind: "tip", id: "diag-acq-small-rca-small-volume" },
        {
          kind: "check",
          stem: "The RCA is small and ends in a marginal branch near the acute margin with no PDA. The left injection shows the circumflex continuing in the AV groove to the crux, where it gives a vessel along the posterior interventricular groove. What should you record?",
          options: [
            "Co-dominance, since both arteries contribute to the inferior wall",
            "Right dominance with a mid-RCA occlusion filled by left-to-right collaterals",
            "Left dominance, with a small non-dominant RCA",
            "An anomalous RCA arising from the circumflex",
          ],
          answer: 2,
          explanation:
            "The artery that gives the PDA defines dominance; here the circumflex does, so the circulation is left dominant (about 8% of people in Oxford's figures) and the small RCA is normal for it. Occlusion would show as an abrupt stop of an RCA that should continue, with collateral filling of its distal bed rather than a circumflex running in the AV groove. Co-dominance (7% in Oxford's figures) does not fit, because the RCA gives no PDA here.",
        },
        {
          kind: "cine",
          run: "cd-01135-LCA-5",
          caption: "Real left coronary run (recorded angles RAO 34°, caudal 17°) from a study the dataset labels left dominant. Follow the circumflex along the AV groove and ask where the posterior descending artery comes from.",
        },
        {
          kind: "cine",
          run: "cd-01135-RCA-7",
          caption: "The right coronary run of the same left-dominant study (recorded angles LAO 26°, cranial 3°). Compare its size and length with the RCA of a right-dominant study.",
        },
        { kind: "h", text: "Numbering the segments" },
        {
          kind: "p",
          text: "Reports, heart team discussions and the SYNTAX score number the segments rather than describe them. Brilakis reproduces the SYNTAX scheme (Fig 7.2) in two versions, one for each dominance, which is the practical point: the numbers you can use depend on the dominance you have just decided. The full names and boundaries are in the foundations lesson on segment numbering.",
        },
        {
          kind: "table",
          caption: "SYNTAX segment numbers by vessel (Brilakis Fig 7.2; names as in the SYNTAX definitions)",
          head: ["Vessel", "Right-dominant", "Left-dominant"],
          rows: [
            ["RCA", "1 proximal, 2 mid, 3 distal, 4 PDA, 16 and 16a–c posterolateral branches", "1, 2 and 3 only"],
            ["Left main", "5", "5"],
            ["LAD and diagonals", "6 proximal, 7 mid, 8 apical; 9 and 9a first diagonal; 10 and 10a second diagonal", "The same"],
            ["Circumflex and its branches", "11 proximal, 13 distal; 12 intermediate; 12a and 12b obtuse marginals; 14, 14a and 14b posterolateral", "The same, plus 15, the PDA arising from the circumflex"],
          ],
        },
        {
          kind: "p",
          text: "Brilakis adds that each segment carries a weight according to its position, from 0.5 for a posterolateral branch up to 6 for the left main in a left-dominant circulation, which is why the same lesion scores differently in the two patterns.",
        },
        {
          kind: "check",
          stem: "In a left-dominant patient, a severe lesion lies in the posterior descending artery arising from the circumflex. Which SYNTAX segment is it?",
          options: ["Segment 4", "Segment 16", "Segment 14", "Segment 15"],
          answer: 3,
          explanation:
            "In the left-dominant version of the SYNTAX scheme the RCA ends at segment 3, and the PDA arising from the circumflex is segment 15. Segment 4 is the PDA from a dominant RCA and segment 16 the right posterolateral branch, neither of which exists in this pattern; 14 is the left posterolateral branch, not the PDA.",
        },
        { kind: "h", text: "The territory that nothing supplies" },
        {
          kind: "p",
          text: "Oxford warns that an anomalous vessel, most often the circumflex, is overlooked when the operator does not notice that part of the myocardium has no visible supply. Separate LAD and circumflex ostia in the left sinus and an anterior RCA origin are common enough to count as normal variants, and test injections help reveal unusual take-offs. Before the last run, ask of each wall in turn (anterior, lateral, inferior, septum, apex) which vessel you have seen supplying it; a gap means looking for the missing vessel before you finish, for example by re-reviewing the other injection for an anomalous vessel (Oxford's example shows an anomalous circumflex filling during the RCA injection) and, if needed, an aortic root injection, since Oxford uses aortography to define the origin and proximal course of an anomalous vessel. Recognising and engaging the anomalies themselves is taught in the interpreting module.",
        },
        { kind: "tip", id: "diag-acq-missing-territory" },
        {
          kind: "p",
          text: "**From anatomy to interpretation.** Brilakis's step 8 then assesses, for each artery in each run, flow (TIMI grade), the presence and severity of lesions, length, thrombus, calcification, dissection, branch involvement, ostial location (within 3–5 mm of the origin), tortuosity, aneurysm, collaterals, perforation and fistulae. The interpreting module teaches that step in full; the anatomy you named here is its foundation.",
        },
        {
          kind: "pitfalls",
          items: [
            "Calling a small RCA occluded or diseased before looking at the circumflex.",
            "Calling the vessel near the spine the LAD.",
            "Numbering a left-dominant PDA as segment 4.",
            "Finishing a study without asking which vessel supplies the lateral wall.",
            "Leaving dominance out of the report, so the next operator must rediscover it.",
          ],
        },
        {
          kind: "pearl",
          text: "Decide dominance aloud as soon as you have seen both injections, and say what it means for this patient: the PDA's source, how much contrast the small artery needs, and which segment numbers apply.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, acquire the RCA in LAO and LAO cranial and the left coronary in RAO caudal. Name the circumflex as the vessel nearest the spine, label its obtuse marginals and the LAD's diagonals and septals, and state the dominance from the origin of the PDA before you finish.",
        },
        { kind: "drill", target: "angio-real", drill: "dominance", task: "Decide dominance on real studies from both injections, then check the dataset label." },
        { kind: "drill", target: "angio-real", drill: "artery", task: "Name the injected artery on real runs, using the spine and branch patterns." },
        { kind: "video", id: "3sGSkQ6hoQ0", note: "Manual of PCI case video on core principles of coronary anatomy assessment." },
        { kind: "video", id: "Rel5KYzYKew", note: "Coronary artery anomalies: angiography and case illustrations." },
        {
          kind: "keypoints",
          items: [
            "The circumflex is the vessel nearest the spine; diagonals head to the lateral wall, septals into the septum; obtuse marginals leave the circumflex for the lateral wall.",
            "Normal proximal LAD: men 3.5–4.0 mm, women 3.0–3.5 mm; LAD tapers early, circumflex from its mid portion, RCA stays uniform to the crux.",
            "Dominance is the PDA's source: RCA 85%, circumflex 8%, co-dominant 7% (Oxford).",
            "A small RCA plus a circumflex reaching the crux is left dominance, not occlusion.",
            "SYNTAX numbering depends on dominance: right-dominant RCA carries 4 and 16; left-dominant circumflex carries 15; co-dominance is not an option.",
            "Before finishing, check that every wall has a supplying vessel.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-acquiring-q1",
      stem: "Which sequence matches Brilakis's chapter 6 for each coronary artery?",
      options: [
        "Test injection first, then check the trace, nitroglycerin, positioning, cine, interpretation, then the trace once more",
        "Check the trace, test injection, nitroglycerin, position, check trace and ECG, cine, check again, interpret",
        "Nitroglycerin, check the trace, position, test injection, cine, check trace and ECG, interpret",
        "Check the trace, position, cine, test injection, nitroglycerin, check trace and ECG, interpret",
      ],
      answer: 1,
      explanation:
        "Brilakis's eight steps are: good pressure waveform, test injection, intracoronary nitroglycerin, optimal positioning of patient, receptor, shields and operator, pressure and ECG before the run, cineangiography, pressure and ECG after the run, and interpretation. Putting the test injection before the trace check reverses the safety logic: nothing, not even a puff, is injected before the waveform is confirmed.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-acquiring-q2",
      stem: "The systolic pressure is 96 mmHg after radial verapamil. The patient took no PDE-5 inhibitor. What does Brilakis's ladder allow before the first run?",
      options: [
        "200 µg intracoronary nitroglycerin given slowly through the manifold over a minute",
        "100 µg intracoronary nitroglycerin, with saline running at the same time",
        "50 µg intracoronary nitroglycerin or none, because of concern about worsening hypotension",
        "0.4 mg sublingual nitroglycerin, which avoids the fall in blood pressure seen with the intracoronary route",
      ],
      answer: 2,
      explanation:
        "Below 100 mmHg Brilakis gives 50 µg or no nitroglycerin, because of the concern about worsening hypotension; verapamil given for radial access is itself on his list of causes of hypotension. 100 µg is for 100–120 mmHg. Sublingual nitroglycerin is an alternative route, not a way of avoiding the pressure fall.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-acquiring-q3",
      stem: "A focal ostial RCA narrowing appears on a run from a JR4 whose trace ventricularised and then fell a few seconds after engagement. What is the best way to establish whether it is fixed disease?",
      options: [
        "Hold the JR4 where it is and inject a larger, more forceful volume of contrast so the ostial narrowing is defined more clearly",
        "Proceed to PCI of the ostial RCA, because ventricularisation of the trace on its own confirms a significant fixed ostial lesion",
        "Inject intracoronary ergonovine through the engaged JR4 to show whether this segment is prone to vasospasm or not",
        "Withdraw until the trace recovers, re-engage carefully with a free trace, give intracoronary nitrate and image again",
      ],
      answer: 3,
      explanation:
        "A trace that ventricularises and then falls after engagement is Oxford's description of catheter-tip spasm, commonest in a non-dominant RCA. Withdraw first (which may relieve it), re-engage carefully with a free trace, give intracoronary nitrate, image the same view again and document relief. Injecting through the ventricularised catheter risks dissection; ventricularisation means obstruction at the tip, not necessarily fixed disease; and ad hoc ergonovine provocation is not the way to settle this, since Oxford notes it is now rarely performed because of intractable spasm.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-acquiring-q4",
      stem: "Which statement about fluoroscopy and cine is correct according to the two manuals?",
      options: [
        "Cine is about 10 times the dose of fluoroscopy, and its dose does not appear in the fluoroscopy time",
        "Cine and fluoroscopy run at the same frame rate in most labs; only the stored image quality differs",
        "Fluoroscopy at 15 frames per second halves the dose compared with fluoroscopy at 7.5 frames per second",
        "Balloon and stent inflations should be recorded on cine because fluoro save loses image resolution",
      ],
      answer: 0,
      explanation:
        "Brilakis puts cine at roughly 10 times the dose of fluoroscopy, not reflected in fluoroscopy time, and uses fluoro save rather than cine to document inflations. Oxford gives fluoroscopy typically 7.5 fps and cine usually 12.5–30 fps. Brilakis's halving is the other way round: 6–7.5 fps halves the dose compared with 15 fps.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-acquiring-q5",
      stem: "During a left coronary run from the right radial, the JL3.5 backs out of the ostium every time contrast is injected. Which is not one of Brilakis's listed remedies?",
      options: [
        "Start the injection softly and then increase the force as you continue to inject",
        "Pass a coronary guidewire into the artery to anchor the catheter",
        "Change to a side-hole catheter so that the injection meets less resistance",
        "Use a guide catheter extension to engage the artery more securely",
      ],
      answer: 2,
      explanation:
        "Brilakis prevents disengagement with coaxial engagement and a soft start to the injection, and treats it by re-engaging, changing catheter, anchoring with a wire, a guide catheter extension or ramping up slowly. Side-hole catheters appear in his list of causes of poor filling, and he advises avoiding them for that reason. He also lists deep breaths during radial procedures as a cause, so watch the catheter during the breath-hold.",
      difficulty: 2,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-acquiring-q6",
      stem: "In a patient with severe aortic stenosis, a 5 French catheter with a free trace gives runs in which the left coronary never fully opacifies. Which response best follows Brilakis?",
      options: [
        "Accept the runs and grade the lesions, since high-flow states make arteries look more diseased rather than less diseased",
        "Record longer runs with panning, because high coronary flow fills the distal bed only late in the cycle",
        "Switch to an iso-osmolar contrast agent, whose higher viscosity improves opacification at high flow",
        "Use a larger-lumen catheter and a stronger injection; if complete filling still fails, call the study non-diagnostic",
      ],
      answer: 3,
      explanation:
        "High coronary flow, as in severe aortic stenosis, is one of Brilakis's causes of incomplete filling; the remedies are a larger lumen and a stronger injection (an automated injector can help). He would rather declare the angiogram non-diagnostic than offer an interpretation that may be wrong. Iso-osmolar agents are more viscous and are listed as a cause of poor filling, not a cure.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-acquiring-q7",
      stem: "A fellow wants to save dose by lowering the table and keeping the detector high above the chest. Using the consensus figure in Brilakis, how does the skin dose compare with a high table and a close detector?",
      options: [
        "About the same, because dose rate control keeps detector exposure constant whatever the geometry",
        "About 40% higher, the same as lowering the table while keeping the detector close to the chest",
        "About 260% of the optimal set-up, with an image 40–50% larger from geometric magnification",
        "Lower, because the X-ray tube is further from the operator's hands on the far side of the table",
      ],
      answer: 2,
      explanation:
        "The low table with a raised detector produced 260% of the optimal skin dose (3 Gy would become 7.8 Gy) and a 40–50% larger image. The 40% figure applies to a lowered table with the detector kept close. Lowering the table brings the skin closer to the tube, so the entrance skin dose rises (Brilakis Fig 28.6; Oxford), and the raised detector adds geometric magnification. Dose rate control keeps the image looking normal, so the penalty is not visible on screen.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-acquiring-q8",
      stem: "You are planning the views for a suspected aorto-ostial left main lesion. Which choice fits Brilakis?",
      options: [
        "RAO caudal for the ostium, because it lays out the left main bifurcation and the proximal parts of both its branches",
        "LAO caudal and LAO cranial for the least foreshortened ostium, with few acquisitions to limit dissection risk",
        "Straight RAO and LAO without tilt, because angulation foreshortens a short left main segment",
        "Many selective runs in steep views, so that the eccentric ostium is caught from every angle",
      ],
      answer: 1,
      explanation:
        "Brilakis lists LAO caudal and LAO cranial as the least foreshortened views of the left main ostium, keeps acquisitions few at aorto-ostial lesions to lower the dissection risk, and uses intravascular imaging to assess them. RAO caudal is one of his best views of the bifurcation, not of the ostium. Oxford warns that straight LAO and RAO without tilt image the left coronary inadequately.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-acquiring-q9",
      stem: "Which statement about coronary dominance is correct?",
      options: [
        "It is defined by the artery supplying the PDA: RCA in about 85%, circumflex in about 8%, both in about 7%",
        "It is defined by the artery that supplies the most left ventricular muscle, usually the left system",
        "It is defined by the origin of the sinus node branch, which arises from the right coronary artery in about 60%",
        "It is defined by which artery gives the conus branch to the right ventricular outflow tract",
      ],
      answer: 0,
      explanation:
        "Oxford defines dominance by the vessel that supplies the posterior descending artery and gives 85% RCA, 8% circumflex and 7% co-dominant. The 60% figure is the proportion in whom the sinus node branch arises from the RCA, which does not define dominance. The amount of LV muscle supplied is a different question.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "pm-acquiring-q10",
      stem: "A patient has left-dominant anatomy and a heavily calcified mid-circumflex lesion. Which plan reflects what Brilakis says about dominance?",
      options: [
        "No special preparation, because bradycardia during atherectomy is a feature of RCA work only",
        "Use high-dose intracoronary adenosine for physiology, since a dominant circumflex needs more drug than usual to reach full hyperaemia",
        "Avoid any contrast injection into the left system, since a dominant circumflex cannot tolerate contrast",
        "Plan for bradycardia with a pacemaker, aminophylline or brief test runs, and keep intracoronary adenosine at or below 100 µg",
      ],
      answer: 3,
      explanation:
        "Brilakis treats a dominant circumflex like the RCA: for atherectomy he plans for bradycardia (temporary pacemaker, aminophylline or brief test runs), and he avoids intracoronary adenosine doses above 100 µg in the RCA or a dominant circumflex because of ventricular fibrillation. Contrast is not forbidden, though he warns that prolonged left main injections can cause hypotension in left dominance.",
      difficulty: 3,
      refs: ["brilakis-manual-pci"],
    },
    {
      id: "pm-acquiring-q11",
      stem: "In a right-dominant study, which SYNTAX segments belong to the RCA?",
      options: [
        "1, 2, 3 and 4, plus 16 with its divisions 16a–c",
        "1, 2 and 3 only, with 4 and 16 given to the circumflex",
        "1, 2, 3 and the posterolateral group 14 with 14a–b",
        "1 to 5, since the left main is counted with the RCA",
      ],
      answer: 0,
      explanation:
        "In Brilakis's reproduction of the SYNTAX scheme, a right-dominant RCA carries segments 1, 2 and 3 plus 4 (its PDA) and 16 with 16a–c (posterolateral branches). Segments 4 and 16 never move to the circumflex: in left dominance they disappear and the circumflex PDA becomes segment 15. Segment 14 is the left posterolateral group, and 5 is the left main, which belongs to neither the RCA nor the circumflex.",
      difficulty: 2,
      refs: ["brilakis-manual-pci", "sianos-syntax-score-2005"],
    },
  ],
  sims: [
    { sim: "cathlab", task: "Run a complete diagnostic study: test puff and nitrate by systolic pressure on each artery, table and detector set before each angle, runs started before injection and filled to reflux, and a full orthogonal set of the left and right coronary arteries. Finish by stating dominance." },
    { sim: "views", task: "Write each view in Oxford's signed rotation/tilt notation, and find the least foreshortened view of the RCA and left main ostia." },
  ],
  caseIds: ["pm-acquiring-case-spasm", "pm-acquiring-case-dominance"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-acquiring-case-spasm",
    title: "The RCA lesion that was not there",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Brilakis, Manual of PCI, sections 6.2–6.7 and 25.2.5; Oxford Handbook, chapter 6 (imaging the coronaries, use of nitrates, common pitfalls) and chapter 1 (fluoroscopy and acquisition)",
    },
    summary: "A right radial diagnostic study in which spasm imitates a severe RCA lesion until a nitrate is given and the same view is repeated.",
    presentation:
      "A 52-year-old woman, 1.58 m and 55 kg, with atypical exertional chest discomfort and an equivocal stress test. Right radial access with a 5 French sheath and verapamil through the sheath. No PDE-5 inhibitor.",
    findings: ["Blood pressure 128/74 mmHg, sinus rhythm 70/min", "A JR4 has engaged the RCA with a free aortic trace"],
    steps: [
      {
        id: "s0",
        prompt: "The JR4 sits in the RCA ostium with a free trace. What do you do before the first cine run?",
        options: [
          {
            text: "A 1–2 mL test puff, then 200 µg intracoronary nitroglycerin, and set up LAO cranial while you wait 1–2 minutes",
            best: true,
            feedback:
              "The puff confirms a coaxial position before a full injection. With a systolic pressure above 120 mmHg Brilakis gives 200 µg (typical dose; follow local protocol), and the 1–2 minutes it takes to act are the time to set up the first view.",
          },
          {
            text: "Record LAO straight away; nitrate can wait until a lesion is seen",
            next: "c-no-nitrate",
            feedback: "Brilakis gives nitroglycerin before angiography, unless contraindicated, precisely so that spasm is not recorded as a fixed lesion.",
            stateDelta: { stability: -5, flags: ["no-nitrate"] },
          },
          {
            text: "Give the full injection without a puff, since the catheter jumped into the ostium",
            acceptable: true,
            feedback: "Brilakis allows the puff to be omitted when you are certain of engagement from the catheter's movement and jump. You still need the nitrate before recording.",
          },
        ],
      },
      {
        id: "c-no-nitrate",
        kind: "consequence",
        prompt: "The LAO run shows a focal, smooth 80% narrowing in the mid RCA. The pressure is 126/72 mmHg with a free trace. The attending asks whether nitrate was given. What now?",
        options: [
          {
            text: "Check the systolic pressure, give intracoronary nitroglycerin at the dose it allows (200 µg above 120 mmHg), wait 1–2 minutes and repeat the same projection",
            best: true,
            feedback: "Late, but right: a dose chosen from the pressure at the time (the radial verapamil can lower it too), a pause, and the same view so the two runs can be compared directly.",
          },
          {
            text: "Report a severe mid-RCA stenosis and plan PCI",
            feedback: "A narrowing that has not been re-imaged after nitrate may be spasm. Oxford warns that spasm can mimic a severe stenosis.",
            stateDelta: { stability: -15, flags: ["misreported"] },
          },
        ],
      },
      {
        id: "s1",
        prompt: "While the nitrate acts, you prepare the room. The radiographer has lowered the table and raised the detector to give you more space. What do you do?",
        options: [
          {
            text: "Raise the table, bring the detector close to the chest, position the shield and step back with the manifold extension",
            best: true,
            feedback: "Brilakis's step 4: table high, receptor close, shield between patient and operator, operator as far away as practical.",
          },
          {
            text: "Accept it; the automatic dose control will keep the image quality the same",
            next: "c-dose",
            feedback: "That is exactly the problem: lowering the table brings the skin closer to the tube and raising the detector magnifies the image, while dose rate control keeps the picture looking normal, so the penalty is not visible on screen. In Brilakis's consensus figure this geometry gave 260% of the skin dose.",
            stateDelta: { stability: -5, flags: ["high-dose-geometry"] },
          },
        ],
      },
      {
        id: "c-dose",
        kind: "consequence",
        prompt: "Halfway through the study the dose display shows more than 20 mGy/min. What do you change?",
        options: [
          {
            text: "Raise the table, lower the detector, reduce magnification and angulation, and collimate",
            best: true,
            feedback: "Brilakis prompts a change above 20 mGy/min. Table, detector, magnification and angle changes all lower the dose; collimation reduces the irradiated skin area and the dose-area product, though not the total air kerma (Brilakis 28.2).",
          },
          {
            text: "Switch to a higher magnification so that fewer runs are needed",
            feedback: "Magnification increases the skin dose rate (Oxford).",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "You record the RCA in LAO cranial. How do you inject?",
        options: [
          {
            text: "Deep breath and hold, press the pedal, inject after 1–2 seconds with the syringe vertical, filling until contrast refluxes into the aorta",
            best: true,
            feedback: "A contrast-free start, a still heart and complete filling with reflux. Watch the JR4 during the deep breath: in radial cases it can back out.",
          },
          {
            text: "Inject 2 mL gently to avoid spasm, starting at the same moment as the pedal",
            next: "c-stream",
            feedback: "A small, soft injection streams; Oxford's typical RCA volume is 3–5 mL with reflux into the root.",
            stateDelta: { stability: -5, flags: ["streaming"] },
          },
        ],
      },
      {
        id: "c-stream",
        kind: "consequence",
        prompt: "The run shows swirling contrast in the mid RCA and no reflux into the aorta. What do you do?",
        options: [
          {
            text: "Repeat the run with a firmer, larger injection that fills the artery and refluxes",
            best: true,
            feedback: "Streaming is an injection problem, not a lesion; repeat properly before grading anything.",
          },
          {
            text: "Grade the mid-RCA appearance as a moderate lesion",
            feedback: "Streaming makes quantification unreliable and can create a false lesion.",
            stateDelta: { stability: -10, flags: ["misreported"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The LAO cranial run shows a smooth, focal 70% narrowing in the mid RCA. The catheter is coaxial with a free trace. What next?",
        variants: [{ flag: "no-nitrate", info: "Remember that nitrate was given only after the first run." }],
        options: [
          {
            text: "Give a further intracoronary nitroglycerin bolus if the pressure allows, wait, and repeat the same projection",
            best: true,
            feedback: "Comparing like with like is the only fair test of spasm. Check the pressure first: the earlier nitrate and the radial verapamil both lower it.",
          },
          {
            text: "Proceed to intravascular imaging straight away",
            acceptable: true,
            feedback: "Also reasonable: Brilakis uses OCT or IVUS when suspected spasm does not recede after nitroglycerin. A further bolus, if the pressure allows, is the quicker first test (Oxford gives nitrate as repeated boluses; Brilakis may need to repeat it).",
          },
          {
            text: "Report a 70% mid-RCA stenosis and book PCI",
            next: "c-misread",
            feedback: "Spasm can mimic a severe stenosis (Oxford), and a narrowing that has not been re-imaged after nitrate cannot be called fixed. Oxford also notes that catheter-related spasm is commoner in the RCA and in shorter, lighter patients.",
            stateDelta: { stability: -15, flags: ["misreported"] },
          },
        ],
      },
      {
        id: "c-misread",
        kind: "consequence",
        prompt: "At the heart team review a colleague asks for the post-nitrate image of the lesion. There is none. What should have been done?",
        options: [
          {
            text: "Nitrate, then the same projection again, with an image documenting the result; intravascular imaging if it persisted",
            best: true,
            feedback: "Oxford asks for an image documenting relief of spasm; Brilakis turns to OCT or IVUS if it does not resolve.",
          },
          {
            text: "Nothing more; a stenosis seen in one view is enough for planning",
            feedback: "Every lesion needs two orthogonal views, and a possible spasm needs a post-nitrate image.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After the repeat nitrate the pressure is 102/60 mmHg, and in the same view the narrowing has become a mild irregularity. What do you record?",
        options: [
          {
            text: "Store this run as documentation, then complete the RCA set with LAO and RAO",
            best: true,
            feedback: "Oxford documents relief of spasm with an image; Brilakis's RCA set is LAO, LAO cranial or AP cranial, and RAO.",
          },
          {
            text: "Stop the RCA here, since the lesion has gone",
            feedback: "Without orthogonal views the rest of the RCA has not been assessed.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Before the left system, her pressure falls to 84/50 mmHg and she feels light-headed. The trace is sharp with the catheter in the aortic root. What do you do?",
        options: [
          {
            text: "No more nitrate; give saline, observe, and use phenylephrine if it is severe or persists",
            best: true,
            feedback: "Nitrate and radial verapamil are both on Brilakis's list of causes; saline, observation and a vasopressor for severe cases is his sequence.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Another 200 µg of nitroglycerin before imaging the left system, to prevent spasm there",
            next: "c-hypotension",
            feedback: "Below 100 mmHg Brilakis gives 50 µg or none, because of worsening hypotension.",
            stateDelta: { stability: -20, flags: ["nitrate-hypotension"] },
          },
        ],
      },
      {
        id: "c-hypotension",
        kind: "consequence",
        prompt: "The pressure falls to 68/40 mmHg. What now?",
        options: [
          {
            text: "Saline, a vasopressor such as phenylephrine, and a check of the transducer and the patient for other causes",
            best: true,
            feedback: "Treat the pressure, and remember pseudohypotension and other causes on Brilakis's list.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Continue with the left coronary runs and recheck later",
            feedback: "Imaging a hypotensive patient risks ischaemia and arrhythmia; treat first.",
            stateDelta: { stability: -15 },
          },
        ],
      },
      {
        id: "s6",
        prompt: "The pressure recovers to 118/70 mmHg. Which set do you record for the left coronary system?",
        options: [
          {
            text: "AP, then RAO with caudal tilt, RAO with cranial tilt, LAO with cranial tilt and LAO with caudal tilt (the spider), adding views for any segment not clearly seen",
            best: true,
            feedback: "Brilakis's left main set gives orthogonal views of every segment; Oxford warns against relying on a standard set without adding what the anatomy needs.",
          },
          {
            text: "Straight LAO and straight RAO only, to limit contrast after the hypotension",
            feedback: "Oxford: straight LAO and RAO without cranial or caudal tilt give inadequate imaging, particularly of the left coronary artery.",
            stateDelta: { stability: -5, flags: ["incomplete-views"] },
          },
        ],
      },
    ],
    outcome:
      "The left system was normal. The RCA narrowing resolved after nitrate in the same projection and was documented as spasm on a minor irregularity. She was treated medically, and the report recorded the doses, the pressures and the post-nitrate image.",
    outcomeVariants: [
      { flag: "misreported", text: "Along the way a lesion was reported from an image that could not support it; without a post-nitrate run, she could have been booked for an unnecessary PCI." },
      { flag: "nitrate-hypotension", text: "The extra nitrate at a systolic pressure below 100 mmHg caused avoidable hypotension." },
      { flag: "high-dose-geometry", text: "The low table and raised detector exposed her to a higher skin dose than needed." },
      { flag: "incomplete-views", text: "The left system was not imaged in a complete orthogonal set, so a lesion could have been missed." },
    ],
    learningPoints: [
      "Test puff first, then nitrate by systolic pressure, then wait 1–2 minutes and use the time to set up the room.",
      "Spasm can imitate a severe stenosis: repeat the same projection after nitrate, image intravascularly if it persists, and document relief.",
      "Streaming is an injection fault: fill to reflux before grading anything.",
      "Table high, detector close: a low table puts the skin nearer the tube and a raised detector magnifies, and because dose rate control keeps the image looking normal, the penalty is not visible on screen.",
      "Nitrate and radial verapamil add up: below 100 mmHg give 50 µg or none.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-acquiring-case-dominance",
    title: "The short right coronary artery",
    trackId: "pci-manual",
    stage: 2,
    provenance: {
      kind: "synthetic",
      basedOn: "Oxford Handbook, chapter 6 (coronary anatomy, imaging the coronaries, use of nitrates, tips for interpretation, unusual coronary anatomy); Brilakis, Manual of PCI, sections 6.6, 7.1 (Fig 7.2), 12.2, 17.5 and 19.9",
    },
    summary: "A femoral diagnostic study in which a small RCA tempts the operator to call an occlusion, until the left injection shows left dominance.",
    presentation:
      "A 67-year-old man with stable angina and an inferior-lateral perfusion defect on stress imaging. Femoral access, 6 French. Blood pressure 136/80 mmHg.",
    findings: ["Sinus rhythm 64/min", "No previous angiography"],
    steps: [
      {
        id: "s0",
        prompt: "A JR4 engages the RCA with a free trace. The test puff shows a small artery. How do you image it?",
        options: [
          {
            text: "Give nitrate by pressure, then small-volume runs in LAO and LAO cranial, keeping the catheter at the ostium",
            best: true,
            feedback: "Oxford notes that a small non-dominant vessel needs only a tiny amount of contrast, and that catheter-tip spasm is commonest in a non-dominant RCA.",
          },
          {
            text: "Advance the JR4 deeper for a stable position and inject forcefully to fill it well",
            next: "c-tip-spasm",
            feedback: "Deep engagement and forceful injection in a small artery invite catheter-tip spasm and dissection.",
            stateDelta: { stability: -15, flags: ["tip-spasm"] },
          },
        ],
      },
      {
        id: "c-tip-spasm",
        kind: "consequence",
        prompt: "The trace ventricularises and then keeps falling. What do you do?",
        options: [
          {
            text: "Withdraw until the aortic trace returns, re-engage carefully at the ostium with a free trace, then give intracoronary nitrate",
            best: true,
            feedback: "Oxford's sequence for catheter-tip spasm: withdraw, then nitrate if required, given after careful re-engagement; nothing is injected while the trace is abnormal.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Inject to see what is happening",
            feedback: "Injecting into a ventricularised trace risks dissection.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s1",
        prompt: "The RCA ends near the acute margin after giving RV marginal branches. There is no PDA. What do you conclude now?",
        options: [
          {
            text: "Nothing yet: dominance and possible occlusion are decided after the left injection",
            best: true,
            feedback: "A small RCA is either non-dominant or occluded beyond its last branch; the left system tells you which.",
          },
          {
            text: "A mid-RCA occlusion; plan to look for collaterals and consider CTO PCI",
            next: "c-premature",
            feedback: "Calling an occlusion before seeing whether the circumflex supplies the PDA is premature.",
            stateDelta: { stability: -5, flags: ["premature-occlusion"] },
          },
        ],
      },
      {
        id: "c-premature",
        kind: "consequence",
        prompt: "The attending asks what would distinguish an occluded dominant RCA from a normal non-dominant one. What is your answer?",
        options: [
          {
            text: "Whether the circumflex runs in the AV groove to the crux and gives the PDA, or the distal RCA fills by collaterals",
            best: true,
            feedback: "Dominance is the PDA's source; collateral filling of a distal RCA bed points to occlusion.",
          },
          {
            text: "The size of the conus branch",
            feedback: "The conus supplies the RV outflow tract and says nothing about dominance.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The left injection in RAO caudal shows the circumflex continuing in the AV groove to the crux and giving a vessel down the posterior interventricular groove. A severe lesion lies in that vessel. How do you record it?",
        options: [
          {
            text: "Left dominance; lesion in segment 15, the PDA arising from the circumflex",
            best: true,
            feedback: "In the left-dominant SYNTAX scheme the RCA ends at segment 3 and the circumflex PDA is segment 15.",
          },
          {
            text: "Right dominance; lesion in segment 4",
            feedback: "Segment 4 is the PDA from a dominant RCA, which this patient does not have.",
            stateDelta: { stability: -5, flags: ["wrong-segment"] },
          },
          {
            text: "Co-dominance; lesion in segment 16",
            feedback: "Co-dominance is not an option in SYNTAX, and 16 is the right posterolateral branch.",
            stateDelta: { stability: -5, flags: ["wrong-segment"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "You want to see the circumflex PDA lesion free of overlap. Which approach follows the manuals?",
        options: [
          {
            text: "Add views until the lesion is seen in two near-orthogonal projections, grading it where it looks worst and least foreshortened",
            best: true,
            feedback: "Brilakis's rule for each lesion; Oxford adds that cranial projections generally show distal vessels.",
          },
          {
            text: "Record one long run with panning to follow the circumflex to its end",
            feedback: "Panning degrades the image and one view cannot grade a lesion.",
            stateDelta: { stability: -5 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The team discusses physiology and possible atherectomy of the dominant circumflex later. Which precaution do you note in the report?",
        options: [
          {
            text: "Dominant circumflex: intracoronary adenosine no more than 100 µg, and plan for bradycardia if atherectomy is used",
            best: true,
            feedback: "Brilakis treats a dominant circumflex like the RCA for adenosine dosing and atherectomy-related bradycardia.",
          },
          {
            text: "No special precautions, since those apply to the RCA only",
            next: "c-vf",
            feedback: "Brilakis names the dominant circumflex alongside the RCA for both precautions.",
            stateDelta: { stability: -10, flags: ["dominance-ignored"] },
          },
        ],
      },
      {
        id: "c-vf",
        kind: "consequence",
        prompt: "At the later physiology study a colleague gives a large intracoronary adenosine bolus into the dominant circumflex and the patient develops VF. What is the immediate treatment?",
        options: [
          {
            text: "Defibrillation",
            best: true,
            feedback: "Brilakis's treatment for adenosine-related VF is defibrillation; prevention was a dose of no more than 100 µg in this artery.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Another adenosine bolus to reset the rhythm",
            feedback: "VF needs defibrillation.",
            stateDelta: { stability: -20 },
          },
        ],
      },
      {
        id: "s5",
        prompt: "Before finishing, you check every wall for a supplying vessel. Which territory would make you look further if nothing supplied it?",
        options: [
          {
            text: "Any of them, especially the lateral wall, where an anomalous circumflex is the vessel most often overlooked",
            best: true,
            feedback: "Oxford: an anomalous circumflex is missed when nobody notices that part of the myocardium has no visible supply.",
          },
          {
            text: "Only the inferior wall, since the other walls always fill from the left main",
            feedback: "Any unsupplied territory needs explaining; the lateral wall is the classic one.",
            stateDelta: { stability: -5 },
          },
        ],
      },
    ],
    outcome:
      "The study showed a left-dominant circulation with a small, normal RCA and a severe lesion in the circumflex PDA (segment 15). The report recorded the dominance and the precautions it implies, and every territory had a supplying vessel.",
    outcomeVariants: [
      { flag: "premature-occlusion", text: "The RCA was briefly labelled occluded before the left injection showed it was simply non-dominant." },
      { flag: "wrong-segment", text: "The lesion was first numbered in the right-dominant scheme, which would have distorted the SYNTAX score." },
      { flag: "tip-spasm", text: "Deep engagement of the small RCA provoked catheter-tip spasm, which needed withdrawal and nitrate." },
      { flag: "dominance-ignored", text: "Leaving the dominance out of the plan led to an adenosine dose that Brilakis advises against in a dominant circumflex." },
    ],
    learningPoints: [
      "Dominance is the PDA's source; decide it only after both injections.",
      "A small non-dominant RCA needs little contrast and is prone to catheter-tip spasm.",
      "SYNTAX numbering depends on dominance: segment 15 exists only in left dominance.",
      "A dominant circumflex shares the RCA's precautions for adenosine and atherectomy.",
      "Finish by checking that every wall has a supplying vessel.",
    ],
    refs: [...BOOKS, "sianos-syntax-score-2005"],
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "diag-acq-read-test-puff",
    lab: "diagnostic",
    when: { phase: ["inject"], engagement: ["coaxial-lm", "selective-lm", "coaxial-rca", "selective-rca"] },
    title: "Read the test puff before the run",
    text: "Give 1–2 mL by hand through a cleared catheter with a free trace. Check that the tip points down the artery rather than tenting the wall, that the whole artery fills (not only the LAD, not only the conus), and that the take-off looks normal.",
    tone: "do",
    lessonId: "pm-acquiring-test-nitrate",
    sources: [
      { book: "brilakis-pci", loc: "6.2" },
      { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-spasm-repeat-view",
    lab: "diagnostic",
    when: { phase: ["views"], event: ["ostial-spasm"] },
    title: "Possible spasm: nitrate, then the same view again",
    text: "If the catheter tip caused it, withdraw first and re-engage carefully. Before calling a smooth focal narrowing fixed, give intracoronary nitrate with a free trace, wait 1–2 minutes and repeat the same projection. If it does not resolve, Brilakis uses OCT or IVUS; if it does, store an image that documents the relief.",
    tone: "caution",
    lessonId: "pm-acquiring-test-nitrate",
    sources: [
      { book: "brilakis-pci", loc: "6.3" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-table-up-detector-down",
    lab: "diagnostic",
    when: { phase: ["setup", "views"] },
    title: "Table up, detector down, shield in, step back",
    text: "Raise the table as high as you can work comfortably and bring the detector close to the chest; a low table with a raised detector gave 2.6 times the skin dose in the figure Brilakis reproduces. Put the shield between patient and operator and stand back with a manifold extension.",
    tone: "do",
    lessonId: "pm-acquiring-setup",
    sources: [
      { book: "brilakis-pci", loc: "6.4" },
      { book: "brilakis-pci", loc: "28.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-acq-high-dose-adjust",
    lab: "diagnostic",
    when: { event: ["high-radiation-dose"] },
    title: "Dose climbing: change the geometry and the settings",
    text: "Use shallower angles (steeper than about 30° from AP raises dose), lower magnification, collimation and a detector close to the patient, and change the skin entry angle in long cases. Act when the dose rate exceeds 20 mGy/min; Brilakis usually stops, or stages the case, once air kerma reaches the 5–8 Gy range (his two chapters give 5–7 and 7–8 Gy).",
    tone: "caution",
    lessonId: "pm-acquiring-setup",
    sources: [
      { book: "brilakis-pci", loc: "2.5" },
      { book: "brilakis-pci", loc: "28.2" },
      { book: "oxford-cath", loc: "ch 1: Radiation safety" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-frame-then-pedal",
    lab: "diagnostic",
    when: { phase: ["inject", "views"] },
    title: "Frame it, pedal first, then inject",
    text: "Place the catheter where the whole artery will fit (upper left of the screen in RAO cranial, centred in the spider) so you need not pan. Start cine, inject after 1–2 seconds with the syringe held vertical, fill until contrast refluxes into the aorta, and keep recording until every branch has filled.",
    tone: "do",
    lessonId: "pm-acquiring-cine",
    sources: [
      { book: "brilakis-pci", loc: "6.6" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-breath-hold",
    lab: "diagnostic",
    when: { phase: ["inject"] },
    title: "Breath-hold, and watch the catheter",
    text: "Ask for a deep breath and hold so the diaphragm drops and the heart stays still; some views, such as LAO cranial for the distal RCA, are better at end-expiration. A deep breath can pull the catheter out of the ostium, especially from the radial, so watch the tip as the patient inhales.",
    tone: "do",
    lessonId: "pm-acquiring-cine",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
      { book: "brilakis-pci", loc: "6.6" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-streaming-fill",
    lab: "diagnostic",
    when: { event: ["contrast-streaming"] },
    title: "Streaming: fill the artery, do not grade it",
    text: "Mixing of dark and light blood means the injection was too small or too slow; aim for a vessel full for about 3 beats with reflux into the root (typically 5–10 mL left, 3–5 mL right). If a small catheter cannot fill it, use a larger lumen; avoid side-hole catheters; inject more strongly; if it still will not fill, call the run non-diagnostic.",
    tone: "caution",
    lessonId: "pm-acquiring-cine",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
      { book: "brilakis-pci", loc: "6.6" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-catheter-backs-out",
    lab: "diagnostic",
    when: { phase: ["inject"], event: ["non-coaxial"] },
    title: "Catheter backing out on injection",
    text: "Make the position coaxial before injecting, then start softly and build up the force. If it still backs out, re-engage, change catheter, anchor it with a wire in the artery or use a guide catheter extension.",
    tone: "bailout",
    lessonId: "pm-acquiring-cine",
    sources: [{ book: "brilakis-pci", loc: "6.6" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-acq-complete-view-set",
    lab: "diagnostic",
    when: { phase: ["views", "finish"] },
    title: "Complete the orthogonal set",
    text: "Left main: AP, then RAO with caudal tilt, RAO with cranial tilt, LAO with cranial tilt and LAO with caudal tilt (the spider). LAD: AP or RAO cranial, and RAO caudal. RCA: LAO, LAO cranial or AP cranial, and RAO. Vein and radial grafts: LAO and RAO; mammary grafts: AP, lateral, and AP or RAO cranial. Add views until every segment is seen twice without overlap or foreshortening.",
    tone: "do",
    lessonId: "pm-acquiring-views",
    sources: [
      { book: "brilakis-pci", loc: "6.6" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-ostium-views",
    lab: "diagnostic",
    when: { phase: ["views"], event: ["pressure-damped"] },
    title: "Damped at an ostium: withdraw, then choose the view",
    text: "Damped trace: do not inject; withdraw until the trace is free. For an ostial question, use steep LAO with or without caudal tilt for the RCA, and LAO caudal or LAO cranial for the left main. At an aorto-ostial lesion keep acquisitions few, and use non-selective injection if engagement damps severely.",
    tone: "caution",
    lessonId: "pm-acquiring-views",
    sources: [
      { book: "brilakis-pci", loc: "6.5" },
      { book: "brilakis-pci", loc: "15.1" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-acq-target-orthogonal-views",
    lab: "pci",
    when: { phase: ["plan"] },
    alsoIn: [{ lab: "diagnostic", phase: ["views"] }],
    title: "Image the target in two orthogonal views",
    text: "Show the target lesion in at least two projections at about 90° to each other, free of overlap and least foreshortened, defining its length, the reference diameter on each side, nearby side branches, tortuosity, calcium and thrombus. Keep the working angle shallow and vary it in long cases to spread skin dose.",
    tone: "do",
    lessonId: "pm-acquiring-views",
    sources: [
      { book: "oxford-cath", loc: "ch 8: Imaging the lesion" },
      { book: "brilakis-pci", loc: "28.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "pci-acq-fluoro-save-inflations",
    lab: "pci",
    when: { phase: ["stent", "optimise"] },
    alsoIn: [{ lab: "diagnostic", phase: ["inject", "views"] }],
    title: "Document inflations with fluoro save, not cine",
    text: "Cine gives about 10 times the dose of fluoroscopy and is not counted in the fluoroscopy time. Use the fluoro store function to record balloon and stent inflations.",
    tone: "do",
    lessonId: "pm-acquiring-cine",
    sources: [
      { book: "brilakis-pci", loc: "28.2" },
      { book: "oxford-cath", loc: "ch 1: Fluoroscopy and acquisition" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-acq-small-rca-small-volume",
    lab: "diagnostic",
    when: { phase: ["inject"], vessel: ["RCA"], engagement: ["deep-rca"] },
    title: "Small RCA: stay at the ostium, inject little",
    text: "If the test puff shows a small RCA, inject only a little contrast: Oxford needs only a tiny amount for a small non-dominant or an occluded artery, and a small non-dominant RCA is where catheter-tip spasm is commonest. Bring the tip back to the ostium rather than over-engaging, and decide dominance from the left injection before calling it occluded.",
    tone: "caution",
    lessonId: "pm-acquiring-anatomy",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Imaging the coronaries" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-acq-dominance-follow-pda",
    lab: "diagnostic",
    when: { phase: ["views"], vessel: ["RCA", "LCx"] },
    title: "Decide dominance from the PDA",
    text: "Follow the RCA to the crux in LAO cranial or PA cranial. If it is small and ends early, look for the circumflex running in the AV groove to the crux and giving the PDA (left dominance) before you consider occlusion. Record the dominance in the report.",
    tone: "do",
    lessonId: "pm-acquiring-anatomy",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Coronary anatomy" },
      { book: "oxford-cath", loc: "ch 6: Right coronary artery" },
    ],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-acq-missing-territory",
    lab: "diagnostic",
    when: { phase: ["finish"] },
    title: "Before you finish: does every wall have a vessel?",
    text: "Go round the anterior, lateral and inferior walls, the septum and the apex and name the vessel you saw supplying each. An unsupplied area, classically the lateral wall, means an anomalous vessel may have been missed: re-review the other injection and, if needed, add an aortic root injection before you take the catheter out.",
    tone: "caution",
    lessonId: "pm-acquiring-anatomy",
    sources: [{ book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" }],
    refs: ["oxford-cath-handbook"],
  },
];

export const refs: Reference[] = [];
