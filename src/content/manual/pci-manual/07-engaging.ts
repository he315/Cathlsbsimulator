// Module pm-engaging: engaging the coronary arteries (manual curriculum, track pci-manual).
// Sources: Brilakis, Manual of PCI, sections 1.5, 2.3, 5.2-5.8, 6.1-6.7, 8.9.2.1, 15.1.5, 29.2, 30.2;
// Oxford Handbook of Cardiac Catheterization and Coronary Intervention, chapters 2, 3, 4, 6, 8, 10.
// Every claim is listed with its page in docs/curriculum/evidence/pm-engaging.md.
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];

export const module: Module = {
  id: "pm-engaging",
  title: "Engaging the coronary arteries",
  stage: 2,
  summary:
    "How to bring a catheter from the aortic root into each coronary ostium safely: reading the pressure trace and ECG before and after every injection, the femoral and radial techniques for the left main and the RCA, what to do when engagement fails, how to keep torque under control and recover a kinked catheter, how to exchange catheters without losing a hard-won route, and how to manage radial spasm and an entrapped catheter.",
  objectives: [
    "Prepare a catheter so that its pressure trace can be trusted, and recognise a free, damped, ventricularised and spasm trace before any injection.",
    "Apply the stepwise responses to pressure damping and to a catheter that will not aspirate, and recognise the injuries that follow injecting into a damped catheter.",
    "Engage the left main and the RCA from the femoral and radial routes with Judkins, extra-support, Amplatz, Williams and universal radial catheters, and correct deep, non-coaxial and conus positions.",
    "Work through the five-step approach to failed engagement, including cusp injection, manoeuvrability fixes, size and shape changes, and when to stop.",
    "Prevent, recognise and recover catheter kinking, and exchange catheters over long 0.035 inch or 300 cm 0.014 inch wires, using a trapping balloon where needed.",
    "Prevent radial artery spasm and release a catheter entrapped by spasm without injuring the artery.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-trace",
      title: "Reading the pressure trace and ECG around every injection",
      minutes: 13,
      topics: ["dx-pressure-before-injection"],
      sources: [
        { book: "brilakis-pci", loc: "2.3" },
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "6.1" },
        { book: "brilakis-pci", loc: "6.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "brilakis-pci", loc: "6.5" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "6.7" },
        { book: "oxford-cath", loc: "ch 4: Pressure waveforms" },
        { book: "oxford-cath", loc: "ch 6: Radial catheters" },
        { book: "oxford-cath", loc: "ch 10: Coronary dissection" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Once a catheter is in the aortic root, the pressure trace is the only continuous report you have from its tip. It tells you whether the tip is free, whether it is plugging an ostium, and whether the lumen is clear of air, clot or debris. Brilakis makes the check a formal step three times over: before you try to engage (engagement step 6), straight after engaging (step 8), and before and after every cine run (angiography steps 1, 5 and 7). A trace you have not looked at is a trace you cannot rely on.",
        },
        { kind: "h", text: "Getting the catheter ready so the trace means something" },
        {
          kind: "steps",
          title: "From wire out to first look at the trace",
          items: [
            {
              title: "Aspirate before anything else",
              detail:
                "With the wire removed, draw 2–3 mL of blood back from the catheter and discard it, ideally onto a white gauze where you can inspect it. Brilakis looks there for thrombus, which usually comes from the sheath, and for aortic debris, which tends to glisten because it carries cholesterol crystals.",
            },
            {
              title: "If the catheter will not aspirate",
              detail:
                "The tip may be against the aortic or coronary wall, beside a significant ostial lesion, or too large for the artery it has entered. Reposition it, usually by easing it back a few millimetres, and try again. If that fails, change to a different catheter, or take it out and reshape its tip by hand. Suction can itself pull the tip onto the wall or into a tight ostium; if that keeps happening, let the catheter back-bleed instead of pulling on the syringe. Prevention starts with a catheter chosen to fit the aortic root and the position and calibre of the ostia. The full algorithm is in the next lesson.",
            },
            {
              title: "Make a wet connection",
              detail:
                "Attach the hub to the manifold while saline is running through the manifold, so no bubble is trapped in the joint. Stop flushing, draw blood back into the manifold syringe, and discard anything that contains air or visible particles.",
            },
            {
              title: "Fill to the tip with contrast",
              detail: "Once the manifold syringe shows no air or debris, inject contrast until it comes out of the catheter tip.",
            },
            {
              title: "Record the baseline",
              detail:
                "Confirm a crisp aortic waveform and note the ECG rhythm and ST segments now. Brilakis asks for both at the start of the case precisely so that later changes are obvious.",
            },
          ],
        },
        { kind: "h", text: "The patterns" },
        {
          kind: "table",
          caption: "What the trace is telling you",
          head: ["Pattern", "What you see", "Usual meaning"],
          rows: [
            ["Free aortic", "The same aortic waveform you recorded at baseline, before engaging (this module's own description)", "Tip free in the root, or coaxial at the ostium without obstructing it"],
            [
              "Damped",
              "In this module's words: the waveform loses height and shape compared with your baseline, or disappears altogether (Brilakis speaks of dampening or disappearance). Brilakis grades damping and ventricularisation as mild or severe; see his Fig 5.15 and Oxford's Fig 6.2 for examples",
              "At the tip: against the aortic or coronary wall, deep or subselective, sitting on an ostial lesion, or too big for the vessel. In the system: clot, plaque or air in the lumen, a kink, a bubble in the transducer, the transducer switched off or disconnected, or bulky equipment filling a small guide (for example an aspiration catheter in a 6 Fr guide). A lower trace can also be the patient's true pressure: see below",
            ],
            [
              "Ventricularised",
              "Systolic pressure dips while diastolic pressure falls and then rises through diastole, like a ventricular trace. Oxford adds a deflection just before systole, a slower upstroke with a steeper downstroke, and visible a waves",
              "The tip is wedged so it records pressure beyond an obstruction: ostial stenosis, the tip angled into the wall, spasm, or selective entry into the LAD or Cx of a short left main. In the RCA, think of the conus branch or a small non-dominant vessel",
            ],
            [
              "Ventricularises, then keeps falling",
              "A few seconds after engagement the pressure sinks further and recovers only when the catheter is withdrawn",
              "Catheter-tip spasm. Oxford finds it most often in a non-dominant RCA and when the artery is little wider than the catheter, as in short, light patients",
            ],
          ],
        },
        {
          kind: "p",
          text: "Two traps make a trace look abnormal when the tip is fine, or normal when it is not. In aortic stenosis the aortic pulse is small and slow-rising (parvus et tardus) from the start, so it can look damped; judge each trace against the one you recorded before engaging. Conversely, side holes near the tip keep sampling aortic pressure while the end hole is wedged, so a side-hole catheter can show a reassuring trace over an obstructed ostium. This includes the Tiger radial catheter, which Oxford describes as having a side hole close to its tip to reduce damping on engagement: with a Tiger, a normal trace reassures you less, so confirm the position on fluoroscopy, keep the test puff gentle, and watch the ECG and the patient. Oxford notes that the fluid-filled line between tip and transducer can delay and slightly damp the signal, and lists catheter impact, catheter whip and end-pressure artefacts.",
        },
        {
          kind: "check",
          stem: "From the right radial, a JL3.5 drops into the left main as the wire comes out. The trace changes from 135/75 mmHg to a systolic of about 125 mmHg with a diastolic pressure that starts near 10 mmHg and climbs through diastole, with a small hump before each upstroke. What is happening?",
          options: [
            "Ventricularisation: the tip is obstructing the left main ostium, so withdraw before any injection",
            "Normal intracoronary pressure, which always runs lower in diastole than aortic pressure",
            "Transducer drift during the change of position; re-zero and give the planned test puff",
            "Aortic regurgitation unmasked by the catheter crossing the sinus into the outflow",
          ],
          answer: 0,
          explanation:
            "A preserved systolic peak, a low diastolic pressure that rises through diastole and a presystolic a wave are the ventricularised pattern: the tip is wedged against an obstruction (ostial disease, wall contact, spasm or a short left main). Injecting now risks dissection and ischaemia. Coronary pressure in a free, coaxial position matches the aorta; it is not expected to fall in diastole, so the second option is the tempting but wrong explanation.",
        },
        { kind: "h", text: "The trace and the ECG around each run" },
        {
          kind: "steps",
          title: "One injection, four looks",
          items: [
            {
              title: "Before the test puff",
              detail: "Trace undamped and not ventricularised, catheter lumen cleared, tip judged coaxial.",
            },
            {
              title: "Test injection",
              detail:
                "Give 1–2 mL of contrast. It confirms the tip is in the ostium and coaxial rather than tenting the wall, which could dissect it. Brilakis allows the test puff to be skipped when the operator is certain, from the catheter's movement and its jump, that the ostium is engaged.",
            },
            {
              title: "Immediately before cine",
              detail:
                "Look again at the trace (no damping, no ventricularisation, no new hypotension) and at the ECG (no new change). Contrast itself can briefly raise or depress the ST segment or invert T waves. Oxford notes that contrast can slow the heart for a moment, usually recovering within a few seconds, and that short-lived ST changes and a wider QRS are common during angiography.",
            },
            {
              title: "After every run",
              detail:
                "Check the trace for damping or new hypotension and the ECG for ST or rhythm change, including ventricular fibrillation. A catheter that partly blocks inflow can cause hypotension and arrhythmia, even VF, if it is not corrected quickly: withdraw, then re-engage more carefully or with a smaller French size.",
            },
          ],
        },
        {
          kind: "p",
          text: "When the signal itself is poor, fix the signal: flush the transducer and check its connections for a poor pressure trace, and reposition the electrodes for a poor ECG. In the Oxford team model the cardiac physiologist calls out a significant fall in blood pressure from baseline (as a rule of thumb a systolic below 90 mmHg), damping or ventricularisation, ST change, new bradycardia, block or bundle branch block, and VT or VF to the whole team, so that a damped trace is heard about before anyone injects.",
        },
        {
          kind: "check",
          stem: "The RCA test puff showed a coaxial position and the LAO run is complete. As you prepare the RAO run, the trace is 15 mmHg lower than baseline and has lost its shape. What do you do?",
          options: [
            "Inject promptly to finish the run before the catheter moves any further into the artery",
            "Hold the injection, re-examine the tip position and work through the damping steps first",
            "Give a fluid bolus, because the lower trace reflects contrast-induced hypotension",
            "Switch to the automated injector so the contrast is delivered more evenly this time",
          ],
          answer: 1,
          explanation:
            "Brilakis checks the trace before every run and after it (angiography steps 5 and 7), not only before the first, because a position that was safe can change. A trace that has fallen and lost its shape is treated as damping and nothing is injected until the cause is found. Once the trace is free again, Brilakis prefers gentle manual injection to an automated injector where there has been damping or the position is marginal; he never injects into a damped trace. A fluid bolus treats the patient, not the catheter, and should wait until you know whether the pressure is really low (next paragraph).",
        },
        {
          kind: "p",
          text: "**A low trace is not always the catheter.** Brilakis points out that a damped or lost waveform may reflect the true aortic pressure. At the angiography stage he lists the usual causes of real hypotension: nitroglycerin, verapamil given for radial access, right ventricular infarction, hypovolaemia in a fasted patient, recent phosphodiesterase-5 inhibitors and a vasovagal reaction, as well as transducer or connection problems that only look like hypotension. So disengage first. If the trace stays low with the tip free in the root, check the transducer and its connections, and if the pressure is real, treat the patient.",
        },
        { kind: "h", text: "Why the rule is absolute" },
        {
          kind: "list",
          items: [
            "**Coronary dissection**: Brilakis lists a non-coaxial or deep engagement (including a subintimal tip), a tip sitting under, or on the rim of, an eccentric plaque (above all in the left main), an ostial lesion, forceful injection, and injecting into a damped trace. Oxford adds: once the catheter is engaged, avoid moving it, particularly pushing it forward against plaque, and take special care at the LIMA ostium, which dissects easily.",
            "**Aorto-coronary dissection**: contrast forced into the wall at the ostium tracks back into the aortic wall and shows as a stain.",
            "**Embolism**: injecting through a catheter that holds clot, plaque or air sends it into the coronary (ST elevation is usually the first sign) or the systemic circulation, with stroke the most feared result.",
            "**Ventricular fibrillation**: Oxford lists catheter manipulation near a stenosed ostium, plugging a vessel such as an intermediate branch, and injecting into the conus branch.",
          ],
        },
        { kind: "tip", id: "diag-aspirate-before-engaging" },
        { kind: "tip", id: "diag-test-puff-then-recheck" },
        {
          kind: "pitfalls",
          items: [
            "Reading a slow-rising aortic stenosis trace as damping and chasing a problem that is not there, or the reverse: assuming every abnormal trace in AS is ‘just the valve’. Compare with the baseline you recorded.",
            "Trusting a normal trace through a side-hole catheter at an unprotected left main, or through a Tiger, which also has a side hole.",
            "Checking the trace before the first run only.",
            "Connecting a catheter to the manifold without a running flush, which traps air in the joint.",
            "Fixing the transducer last when it is the cause: a bubble or a switched-off transducer damps every trace.",
          ],
        },
        {
          kind: "pearl",
          text: "Look at the screen, not the syringe. Make the last thing your eyes do before every injection a glance at the pressure and ECG.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, after each catheter reaches the root: remove the wire, aspirate, connect and record the aortic trace. Then engage the left main and the RCA, and before every test puff and every cine run name the trace aloud (free, damped or ventricularised). Inject only on a free trace.",
        },
        { kind: "video", id: "TV7kFulrCNg", note: "Damping and ventricularisation, and how to handle them." },
        { kind: "video", id: "QQfDGVH_ogs", note: "A case of hypotension after left main engagement." },
        {
          kind: "keypoints",
          items: [
            "Aspirate 2–3 mL onto a white gauze, connect wet, fill to the tip with contrast, then record the baseline trace and ECG.",
            "Damped: the waveform falls away from baseline or is lost. Ventricularised: diastolic pressure low and rising through diastole. Ventricularising then falling: catheter-tip spasm.",
            "Aortic stenosis can look damped, a low trace can be true hypotension, and side holes (including the Tiger's) can hide damping; compare with your own baseline.",
            "Test puff of 1–2 mL; check trace and ECG before and after every run.",
            "Never inject into a damped or ventricularised trace: dissection, aorto-coronary dissection, embolism and VF follow.",
            "Contrast causes brief ST, T-wave, QRS and rate changes; treat a change that persists as a complication until you have shown otherwise.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-damping",
      title: "When the trace damps: the stepwise response",
      minutes: 13,
      topics: ["dx-pressure-before-injection"],
      sources: [
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.5" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "5.8" },
        { book: "brilakis-pci", loc: "6.2" },
        { book: "brilakis-pci", loc: "6.5" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 10: Coronary dissection" },
        { book: "oxford-cath", loc: "ch 10: Air embolism" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Damping has a short list of causes, and Brilakis orders the response so that the simplest checks come first and the most dangerous possibility, a catheter full of clot, is handled without ever pushing anything forward. Learn the order; under pressure you will not have time to invent it.",
        },
        {
          kind: "steps",
          title: "Pressure damping: six steps (Brilakis 5.6.3.5)",
          items: [
            { title: "1. Withdraw or reposition slightly", detail: "If the tip was against the aortic or coronary wall, this alone brings the trace back." },
            { title: "2. Aspirate", detail: "If material has entered the catheter, drawing it out restores the trace." },
            { title: "3. Check the transducer", detail: "Clear any air bubble, check it is switched on and connected, or swap it for another transducer." },
            { title: "4. Look for a kink", detail: "Screen the whole length of the catheter. A kinked catheter is removed and replaced." },
            {
              title: "5. Remove the catheter, pulling, never pushing",
              detail: "If none of the above works, take the catheter out with a syringe applying suction. Do not inject and do not pass a wire through it.",
            },
            { title: "6. Aspirate the sheath", detail: "Make sure the sheath does not hold thrombus before the next catheter goes in." },
          ],
        },
        {
          kind: "steps",
          title: "A catheter that will not aspirate (Brilakis 5.4.3.4)",
          items: [
            {
              title: "1. Ease back a few millimetres",
              detail: "Often the tip is simply against the wall. When it comes free, blood flows and the pressure trace reappears on the monitor.",
            },
            {
              title: "2. Screen the full length for a kink",
              detail: "Particularly if the catheter needed a lot of torque to get where it is. Remove a kinked catheter (see the kinking lesson).",
            },
            {
              title: "3. Assume it is plugged",
              detail:
                "Not kinked and still no blood: presume thrombus or plaque inside. Withdraw it from the body with continuous suction on the syringe. A wire or a flush would drive the plug into the aorta or a coronary, with stroke or acute vessel occlusion as the result.",
            },
            {
              title: "4. Aspirate the sheath",
              detail: "A blocked catheter has usually scooped up clot that formed in the sheath on its way in.",
            },
          ],
        },
        {
          kind: "p",
          text: "Two refinements. Hard suction on a wedged or blocked catheter can draw air in through the valve of the Y-connector; if you see air, every bubble must be removed before the next injection. And prevention is cheaper than the algorithm: aspirate and discard the sheath contents before a guide goes in and flush the sheath with clean heparinised saline, flush every catheter before it enters the body, and use long femoral sheaths when the iliac arteries and aorta are badly diseased.",
        },
        {
          kind: "check",
          stem: "A JR4 in the right sinus will not aspirate. Easing it back does not help, and fluoroscopy of its whole length shows no kink. What next?",
          options: [
            "Pass the J-wire through the catheter to clear its tip, then aspirate again",
            "Flush firmly with heparinised saline to dislodge whatever is blocking the lumen",
            "Withdraw the catheter under continuous suction, then aspirate the sheath",
            "Give a small contrast puff to see whether the tip is wedged in the coronary",
          ],
          answer: 2,
          explanation:
            "With wall contact and kinking excluded, the working diagnosis is a plug of thrombus or plaque. Brilakis is explicit that no wire is inserted and nothing is flushed or injected, because each would push the plug out of the tip into the aorta or a coronary. The catheter comes out under suction and the sheath, the usual source of the clot, is then aspirated. Passing the wire feels like a gentle fix, which is why it is the dangerous distractor.",
        },
        { kind: "h", text: "Damping that appears only after engagement" },
        {
          kind: "table",
          caption: "Causes specific to the engaged position (Brilakis 5.8; 15.1.5; Oxford)",
          head: ["Cause", "Clue", "What to do"],
          rows: [
            [
              "Ostial lesion",
              "Trace damps every time the tip enters; normal as soon as it backs out",
              "Keep the catheter just outside the ostium. With a 0.014 inch wire in the vessel you can engage only briefly, to inject or to advance equipment, then back out. A smaller French size, a less aggressive shape or reshaping the tip by hand also help",
            ],
            ["Small vessel", "Damping with a small artery or small non-dominant RCA", "Stay disengaged with a wire in the vessel, or use a smaller French size"],
            [
              "Catheter-tip spasm",
              "Ventricularises, then falls further a few seconds later. Oxford notes that it most often follows ostial engagement and that over-engaging a catheter can provoke it, especially in the RCA",
              "Withdraw until the aortic trace returns; nothing is injected while the trace is ventricularised. Oxford gives nitrate if needed. To tell spasm from ostial disease, Oxford gives intracoronary nitrate after careful re-engagement (with a free trace), then records an image showing the spasm has resolved",
            ],
            ["Deep or subselective position", "Damping after the catheter has advanced or rotated further", "Withdraw slightly or reposition"],
          ],
        },
        {
          kind: "list",
          items: [
            "For a guide at an aorto-ostial lesion, Brilakis prefers 6 Fr guides and avoids deep engagement, because larger guides damp more readily. When you need to relieve ischaemia during PCI, take the guide off the ostium by turning it to a non-coaxial position rather than pulling it back, which can drag the wire out.",
            "Side-hole guides prevent damping and can be used in the RCA, bypass grafts and a protected left main, but they hide ischaemia; avoid them in an unprotected left main and in an RCA that supplies collaterals to an occluded left-sided vessel.",
          ],
        },
        { kind: "h", text: "More ways to keep a guide off an aorto-ostial lesion (Brilakis 15.1.5–15.1.6)" },
        {
          kind: "list",
          items: [
            "Load a coronary wire to the tip of the guide before engaging, so the vessel can be wired the moment the guide arrives. Extra-support wires also help engagement, disengagement and coaxial alignment.",
            "A second wire left free in the aortic root (a ‘floating wire’) holds the guide away from the ostium.",
            "A dedicated device that keeps the guide catheter outside the ostium is another option.",
            "A small guide catheter extension can engage the artery while the guide itself is backed out of the ostium.",
            "For isolated aorto-ostial disease, less aggressive shapes (a JR4, sometimes an IM catheter for a shepherd's crook RCA) are easier to engage and disengage intermittently, though they support less than an Amplatz in diffuse or tortuous disease.",
            "If engagement damps severely, non-selective angiography lowers the dissection risk, at the cost of image quality.",
            "Side holes have costs of their own: contrast escapes through them into the aorta, so images are poorer and more contrast is used. Brilakis makes an exception to the left main rule for ostial left main CTOs, and warns that holes made by hand can stop a guide extension passing and weaken the guide so it kinks.",
          ],
        },
        {
          kind: "check",
          stem: "During diagnostic angiography a JR4 damps each time it enters a small RCA with a suspected ostial narrowing. Which approach fits the manual's advice?",
          options: [
            "Exchange to an Amplatz Left, which sits more stably and gives a better selective picture",
            "Keep the tip outside the ostium and image with brief injections, or use a smaller French size",
            "Seat the JR4 deeper so the tip passes the lesion and the trace stops showing damping",
            "Inject with the automated injector at a higher rate so the run is completed more quickly",
          ],
          answer: 1,
          explanation:
            "Damping from an ostial lesion or a small vessel is managed by not wedging the catheter: stay outside the ostium, use a smaller catheter or a less aggressive shape. An Amplatz is more aggressive and deep seating carries the tip past the lesion you need to see and raises the dissection risk. Automated injection into a damped position is exactly what Brilakis warns against.",
        },
        { kind: "h", text: "If an injection was given into a damped catheter" },
        {
          kind: "table",
          head: ["Injury", "How it shows", "First actions"],
          rows: [
            [
              "Coronary dissection",
              "Flow-limiting: ST elevation, possible shock or arrest, especially in the left main. Small: a filling defect, perhaps only seen on the final ostial view; IVUS and especially OCT confirm",
              "Stop injecting and ease the catheter back. If a wire is already in the vessel, keep it there. Otherwise pass a workhorse wire into the true lumen, or re-enter the true lumen distally with chronic total occlusion techniques; a guide with a slightly different distal curve from the one that caused the dissection may be needed. Stent larger dissections, with intravascular imaging (strongly recommended by Brilakis) to confirm the stent covers the ostium; small, non-flow-limiting ones usually need nothing. A dissection made by a diagnostic catheter can be wired through that catheter, then engaged with a guide from a second access (the ‘ping-pong’ technique)",
            ],
            [
              "Aorto-coronary dissection",
              "Contrast staining in the aortic wall next to the ostium",
              "No more injections. Stent the ostium to seal the entry, often flaring the stent at high pressure; a covered stent if that fails, accepting higher restenosis and thrombosis risk",
            ],
            [
              "Coronary embolism",
              "ST elevation, usually first; reduced or absent flow; shock or arrest with a large embolus",
              "Air: 100% oxygen, aspiration through the guide or a thrombectomy catheter if flow stops, repeated forceful saline injections; Brilakis mentions that 0.05 mg of epinephrine given into the coronary has been tried as well. Clot or plaque: anticoagulation and an intravenous antiplatelet agent, thrombectomy for a large visible thrombus, intracoronary vasodilators. Haemodynamic support if needed",
            ],
            ["Systemic embolism", "Stroke: a new focal deficit such as weakness or loss of vision. Leg: weaker or absent pulses and discomfort in the leg", "Stroke: emergency head CT and neurology review, as many benefit from urgent neurointervention. Other sites are usually treated conservatively, though some need endovascular treatment"],
          ],
        },
        { kind: "tip", id: "diag-damped-stepwise" },
        { kind: "tip", id: "diag-ventricularised-stay-out" },
        { kind: "tip", id: "diag-ostial-spasm-withdraw-nitrate" },
        {
          kind: "pitfalls",
          items: [
            "Pulling hard on the syringe against a wedged catheter and drawing air in at the Y-connector.",
            "Passing a wire ‘to clear’ a catheter that will not aspirate.",
            "Forgetting step 6: the sheath that supplied the clot will supply the next catheter too.",
            "Pulling a guide straight back off an ostial lesion during PCI and losing the wire.",
          ],
        },
        {
          kind: "pearl",
          text: "Every step of the damping algorithm moves the catheter back or clears the system; none moves anything forward. If your next action pushes something towards the patient, you have left the algorithm.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "In the cath lab, deliberately advance a JL4 until the trace damps. Then follow the six steps in order: withdraw slightly and watch the trace recover before giving a test puff. Repeat with a JR4 in a small RCA, imaging from just outside the ostium.",
        },
        { kind: "video", id: "XMg0vHj15hs", note: "RCA engagement, left ventricular access, damping and ventricularisation." },
        { kind: "video", id: "M60nxskYnDc", note: "Coronary catheter techniques, part 2, with damping and ventricularisation." },
        {
          kind: "keypoints",
          items: [
            "Damping: withdraw, aspirate, check transducer, look for a kink, remove under suction without injecting or wiring, aspirate the sheath.",
            "No aspiration: ease back, screen for a kink, then assume a plug and remove under suction.",
            "Forceful suction can pull air in at the Y-connector; clear it before the next injection.",
            "Ostial lesion or small vessel: stay outside the ostium, engage briefly over a wire, or go smaller.",
            "Catheter-tip spasm: withdraw first, nitrate if needed, then re-image to show it has gone; never inject into the falling trace.",
            "Disengage a guide from an ostial lesion by turning it off-axis, not by pulling it back.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-left",
      title: "Engaging the left main from the femoral and radial routes",
      minutes: 14,
      topics: ["dx-engage-left"],
      sources: [
        { book: "brilakis-pci", loc: "1.5" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "6.4" },
        { book: "brilakis-pci", loc: "6.6" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Radial catheters" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
        { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "The Judkins Left curve is built to fall into the left main with very little help, which is why left engagement is usually the easy half of the study. When it is not easy, the cause is almost always one of three things: a curve that does not match the root, a tip that has been pushed into the wrong cusp, or an ostium in an unexpected place. This lesson builds the technique from planning to the first test puff.",
        },
        { kind: "h", text: "Plan it before the case (Brilakis 1.5)" },
        {
          kind: "list",
          items: [
            "Read previous angiography and PCI reports for the catheters used. If a route made engagement very difficult or impossible last time, plan a different access, such as femoral. Oxford asks you to document your own catheters for the same reason.",
            "Prior bypass surgery: know the grafts from the operation note and earlier angiograms.",
            "CT aortography, if available: a dilated aorta, or an anomalous coronary origin.",
            "Aortic stenosis or regurgitation: both go with a dilated ascending aorta that may need longer curves.",
          ],
        },
        { kind: "h", text: "What ‘engaged’ should mean (Brilakis 5.7.1)" },
        {
          kind: "list",
          ordered: true,
          items: [
            "No pressure damping.",
            "The tip is coaxial with the vessel, which you can only judge from two orthogonal projections.",
            "The tip is 2–3 mm inside the ostium. Deeper seating adds support for PCI but risks dissection, damping and ischaemia.",
          ],
        },
        { kind: "h", text: "Choosing the curve" },
        {
          kind: "table",
          caption: "Starting catheters for the left main",
          head: ["Route", "Diagnostic", "Guide for PCI"],
          rows: [
            ["Femoral", "JL4", "Extra-support shapes (EBU, XB, Voda). Brilakis uses EBU 3.75 or XB 3.5 in most cases; smaller curves (EBU 3.0 or 3.5) suit LAD work and larger ones (EBU 4.0 or 4.5, XB 4.0, Voda 4.0) suit the circumflex. JL guides give poor support"],
            ["Left radial", "JL4 (Oxford); standard JL, XB and EBU shapes behave well from this side", "EBU, XB or Ikari Left"],
            ["Right radial", "JL3.5 (Oxford), or a universal radial shape that reaches both coronaries (Tiger, Kimny, Jacky)", "EBU, XB or Ikari Left"],
          ],
        },
        {
          kind: "list",
          items: [
            "The JL number is the distance between its primary and secondary curves; the JL has a 90° primary and a 180° secondary curve (Oxford), and Brilakis lists arm lengths of 3.5, 4, 5 and 6 cm.",
            "Go a size **down** (JL3.5) for a short patient, a small root, a left main that arises high, or a separate LAD origin.",
            "Go **up** (JL5, JL6) for a dilated root or a very tall patient. Brilakis gives a rule for a dilated ascending aorta: its diameter in centimetres plus one gives the JL size, so a 4 cm aorta needs a JL5.",
            "Amplatz Left shapes help with dilated sinuses or an ostium in an unusual position.",
          ],
        },
        {
          kind: "p",
          text: "**Support for PCI on the left (Oxford Table 8.4).** Oxford ranks guides by the back-up they give. For the LAD, a JL3.5 or JL4 gives the least, an AL2 more, and an XB or EBU 3.5 the most. For the Cx, a JL4 or JL5 gives the least, an AL2 more, and a Voda, XB or EBU 3.5 or 4 the most. Oxford also notes that, in general, a larger calibre guide (8 Fr more than 7 Fr more than 6 Fr) supports more.",
        },
        {
          kind: "steps",
          title: "Femoral route: JL, EBU or XB over the looped wire (Brilakis)",
          items: [
            { title: "Loop the wire on the valve", detail: "Advance the 0.035 inch J-wire until its curve sits against the aortic valve and turns back up." },
            {
              title: "Park the tip above the right cusp",
              detail: "Bring the catheter over the wire until its tip lies 2–3 cm above the floor of the right coronary cusp, level with the upward limb of the J.",
            },
            {
              title: "Withdraw the wire and let the catheter fold",
              detail: "As the wire pulls back, the curves re-form and the tip swings across into the left cusp; advance gently and it drops into the left main ostium.",
            },
            {
              title: "Do not drive into the right cusp",
              detail: "If the tip has been pushed down into the right cusp, further advancing only buries it deeper there; it will not cross to the left. Pull back up and repeat.",
            },
            {
              title: "Watch the trace as the wire leaves",
              detail: "Oxford notes that removing the wire sometimes engages the left main on its own, so keep an eye on the pressure. Aspirate; if blood will not come, the tip may be against the aortic wall or wedged in the left main, so ease back until it flows freely before you connect. Injecting without doing so risks air embolism.",
            },
            {
              title: "Fine-tune",
              detail: "Little manipulation is usually needed. Slow withdrawal may be enough to select the ostium; occasionally a small turn is needed (see below). Image in AP (PA) or LAO; AP is the usual first view of the left main ostium. If the left main is still not seen easily, change the size or type of catheter (Oxford).",
            },
          ],
        },
        {
          kind: "p",
          text: "**Which way to turn.** Brilakis notes that some rotation is sometimes needed to bring the tip to the ostium, and that an anticlockwise turn may be required because the left main usually lies posteriorly; in other words, anticlockwise takes the JL tip posteriorly. Oxford's own Tiger technique fits the same rule: the tip is turned anticlockwise in the left sinus to find the left coronary. One line of Oxford's Judkins technique, however, labels clockwise as posterior and anticlockwise as anterior, the opposite way round, and says either may occasionally be needed. Do not depend on a label: turn a few degrees at a time, watch which way the tip actually moves in two projections, and let a free pressure trace and a test puff confirm the position.",
        },
        {
          kind: "check",
          stem: "From the femoral artery, you advanced a JL4 over the looped wire until its tip touched the floor of the right cusp, then removed the wire. Pushing the catheter now only bends it further into the right sinus. What is the fix?",
          options: [
            "Advance more firmly so the secondary curve straightens and swings the tip across",
            "Rotate clockwise through a full turn while continuing to advance into the sinus",
            "Pull back, reload the wire, and park the tip 2–3 cm above the floor of the right cusp",
            "Exchange immediately for a JL5, because the curve is too short for this root",
          ],
          answer: 2,
          explanation:
            "Brilakis shows that a tip pushed too deep into the right cusp cannot reach the left cusp; more advancement drives it further into the right sinus. The catheter should be repositioned with its tip 2–3 cm above the floor of the right cusp before the wire is withdrawn. Changing curve size treats a different problem, and forceful advancement is never the answer.",
        },
        {
          kind: "steps",
          title: "Radial route",
          items: [
            {
              title: "Universal radial shapes (Brilakis)",
              detail: "Loop the 0.035 inch wire over the aortic valve, then advance the catheter while pulling the wire back until the tip enters the left main. Usually you then withdraw slightly so the tip lines up coaxially.",
            },
            {
              title: "Tiger catheter (Oxford)",
              detail:
                "With the tip in the left sinus, turn anticlockwise, withdrawing slightly if needed. Once the tip is in the ostium, a gentle clockwise turn seats it fully. Image the left in PA. Disengage with gentle withdrawal before moving to the RCA. If anatomy defeats it, change to a standard Judkins. Oxford notes that the Tiger has a side hole close to its tip to reduce damping on engagement, so its trace can stay normal while the end hole is obstructed: confirm the position on fluoroscopy, keep the test puff gentle, and watch the ECG and the patient.",
            },
            {
              title: "Breathing",
              detail: "Asking the patient to breathe in deeply can help the tip reach the ostium, particularly from the right radial (Oxford). Once you are engaged, though, a deep breath can also pull the catheter out of the ostium during the injection, especially in radial cases (Brilakis), so time the run and check the position again.",
            },
            {
              title: "Standard shapes",
              detail: "JL, XB and EBU catheters can be used from either radial, and work especially well from the left.",
            },
          ],
        },
        {
          kind: "check",
          stem: "A JL4 from the femoral route repeatedly engages selectively in the LAD of a patient with a very short left main, and the circumflex is not seen. What does Oxford suggest?",
          options: [
            "Push the JL4 deeper and rotate anticlockwise until the tip enters the circumflex",
            "A Judkins Left one size up, which usually lets the tip sit back into the circumflex",
            "A Judkins Left one size smaller, which sits higher in the left sinus",
            "A single large-volume injection into the LAD to fill the circumflex retrogradely",
          ],
          answer: 1,
          explanation:
            "With a short or absent left main, a JL that keeps entering the LAD is swapped for the next size up, which usually reaches the Cx. Pushing deeper risks dissection and damping, and a large injection in a selective position is dangerous. Also remember Oxford's point that separate LAD and Cx ostia are common enough to count as a normal variant.",
        },
        { kind: "h", text: "Variants on the left side" },
        {
          kind: "list",
          items: [
            "Separate LAD and Cx ostia in the left sinus are among the commonest variants (Oxford); inject each.",
            "Test puffs help to show anomalous origins and unusual take-offs of the branches (Oxford).",
            "Anomalous origin of the Cx from the RCA or the right sinus is the commonest true anomaly (0.2–0.7% in Oxford). The vessel runs behind the aorta to the posterolateral left ventricle. Suspect it when the lateral wall has no supplying vessel on the left injection, or from the ‘dot’ sign on the left ventriculogram, where the anomalous vessel is seen end-on.",
            "Why it matters: Oxford warns that a missed anomalous Cx can lead to incomplete revascularisation or to the vessel being tied off during valve replacement surgery, and that its retro-aortic segment is often small and hard to graft.",
            "Course matters too: sudden death has been reported with anomalous left coronary vessels that run between the aorta and the pulmonary artery (Oxford).",
            "Anomalous vessels from the left sinus may take a JL of an unusual size or an Amplatz Left. Multipurpose catheters can work but engage at an aggressive angle and can dissect.",
          ],
        },
        { kind: "tip", id: "diag-jl-femoral-wire-loop" },
        { kind: "tip", id: "diag-tig-left-anticlockwise" },
        { kind: "tip", id: "diag-short-lm-size-up" },
        { kind: "tip", id: "diag-small-root-shorter-jl" },
        {
          kind: "pitfalls",
          items: [
            "Leaving the JL tip at the bottom of the right cusp before pulling the wire.",
            "Rotating blindly; watch the tip in two views.",
            "Using a JL guide for PCI where an extra-support shape would hold.",
            "Missing an anomalous Cx because the lateral wall was never checked for a supplying vessel.",
          ],
        },
        {
          kind: "pearl",
          text: "When the JL is the right size you are mostly guiding a fall, not steering. If you find yourself working hard to reach the left main, reconsider the curve before you add torque.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Femoral route: engage the left main with a JL4, parking the tip above the right cusp before withdrawing the wire, and confirm coaxial position in AP and in an LAO view. Then repeat from the right radial with a JL3.5 and with a Tiger (anticlockwise in the left sinus, then a gentle clockwise turn to seat), remembering that the Tiger's side hole can keep its trace looking normal: confirm the position on fluoroscopy before the test puff.",
        },
        { kind: "video", id: "KJ9-7kFZkQY", note: "Engagement via femoral access (Manual of PCI chapter video)." },
        { kind: "video", id: "86EzYKu_Rlc", note: "Engagement via radial access (Manual of PCI chapter video)." },
        { kind: "video", id: "VPCy5Ljum7M", note: "A simple left coronary engagement technique (the triple manoeuvre)." },
        { kind: "video", id: "iCG9Xb8FNdQ", note: "Left coronary engagement with a radial focus: steps, diagrams, tips and cases." },
        {
          kind: "keypoints",
          items: [
            "Good engagement: no damping, coaxial in two views, tip 2–3 mm inside.",
            "JL4 femoral or left radial; JL3.5 right radial; smaller for small roots or high left main; larger for dilated roots (aortic diameter in cm + 1).",
            "Femoral JL: tip 2–3 cm above the floor of the right cusp, withdraw the wire, let it fold into the left cusp.",
            "The left main usually lies posteriorly, so Brilakis may add an anticlockwise turn; one Oxford line labels the directions the other way, so turn a little and watch the tip in two views.",
            "Tiger: anticlockwise in the left sinus, then a gentle clockwise turn to seat; its side hole can hide damping.",
            "Short left main with selective LAD: go up one JL size to reach the Cx.",
            "PCI guides: EBU or XB rather than JL; smaller curves for LAD, larger for Cx; a missed anomalous Cx matters most before valve surgery.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-rca",
      title: "Engaging the RCA, including high, anterior and shepherd's crook origins",
      minutes: 14,
      topics: ["dx-engage-rca"],
      sources: [
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 2: The cardiac physiologist" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 6: Radial catheters" },
        { book: "oxford-cath", loc: "ch 10: Coronary dissection" },
        { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
        { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
        { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
        { book: "oxford-cath", loc: "ch 10: Arrhythmia" },
        { book: "oxford-cath", loc: "ch 8: Guiding catheters" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Unlike the JL, the JR4 does not fall into its ostium; you have to turn it there, with rotation and withdrawal. That makes the right coronary the place where getting the rotation down to the tip and a watchful eye on the trace matter most, and where the conus branch is easily entered while you work around the ostium (Oxford).",
        },
        {
          kind: "steps",
          title: "JR4 from the femoral artery",
          items: [
            {
              title: "Lower than for the left",
              detail: "Advance over the wire until the tip sits on the floor of the right cusp. (For the left, the tip stays 2–3 cm above it.)",
            },
            { title: "Wire out, aspirate, connect", detail: "Check the trace before you start turning." },
            { title: "Pull back a few centimetres", detail: "The ostium sits above the floor of the sinus." },
            {
              title: "Turn with two hands",
              detail:
                "Your right hand turns the catheter clockwise; at the same time your left hand moves the shaft gently back and forth. The small to-and-fro lets the rotation travel down to the tip instead of winding up in the shaft.",
            },
            { title: "Watch in LAO", detail: "Turning clockwise while withdrawing gently brings the tip into the ostium, often with a small jump." },
            {
              title: "Let it settle at the entrance",
              detail:
                "The tip can dive suddenly, particularly into a large dominant RCA. Ease back or give a little anticlockwise rotation so it sits stably at the ostium. Keep watching the pressure.",
            },
            {
              title: "Confirm, then acquire",
              detail: "Test puff before the cine run. Too much torque left in the catheter can also pull the tip back out of the artery.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Other shapes for the RCA",
          head: ["Catheter", "Technique or role", "When to use it"],
          rows: [
            ["Williams right (3DRC)", "Preshaped to reach the RCA with little or no manipulation; sometimes needs a clockwise turn like a JR4. One of Oxford's two alternatives to the JR4", "Femoral diagnostic studies; aorto-ostial RCA lesions (Brilakis); Oxford lists the 3DRC for a shepherd's crook (steep vertical take-off)"],
            ["Modified Amplatz Right (AR MOD)", "The other of Oxford's two alternatives to the JR4", "Shepherd's crook (Oxford)"],
            ["Amplatz Right 1 or 2", "Amplatz right curve in size 1 or 2", "An RCA carried anteriorly by a dilated root (Brilakis), where AL1 or AL2 is the alternative"],
            ["Amplatz Left 1", "Advance until the tip points upward, then rotate into the ostium", "Strongest support: complex RCA PCI and CTO; the preferred RCA guide from the radial artery"],
            ["Hockey stick or internal mammary", "Brilakis lists both for femoral diagnostic angiography of a shepherd's crook RCA; Oxford suggests the IMA catheter", "Shepherd's crook RCA"],
            ["Universal radial (Tiger, Jacky)", "Clockwise torque with gentle withdrawal, as for a JR4 (Oxford, for the Tiger)", "Radial diagnostics without an exchange; the Tiger tends to dive deep, with potential for dissection, and its side hole close to the tip can keep the trace looking normal while the end hole is obstructed, so confirm the position on fluoroscopy and keep the test puff gentle"],
            ["Ikari Right, 3D Right", "PCI guide shapes; Brilakis lists both for radial RCA PCI and the 3D Right also for femoral PCI", "RCA PCI, especially radial, where JR guides often give poor support"],
          ],
        },
        {
          kind: "check",
          stem: "As you turn a JR4 clockwise in LAO, the tip catches at the RCA ostium and the pressure damps at once. No contrast has been given yet. What do you do?",
          options: [
            "Give a 1–2 mL test puff first, to see which vessel the tip has entered",
            "Withdraw quickly but gently, then find the RCA with small turns and angulation",
            "Add more clockwise torque so the tip passes beyond this small branch into the RCA",
            "Leave the catheter in place and give intracoronary nitrate through it for spasm",
          ],
          answer: 1,
          explanation:
            "Damping the instant the tip enters at the RCA ostium suggests the conus branch, where Oxford says the pressure often damps rapidly (a small non-dominant RCA or an ostial lesion are the other causes). Whatever the cause, nothing is injected into a damped trace: Oxford says do not inject with a damped or ventricularised trace, and contrast in the conus can cause a myocardial blush and VF. Withdraw quickly and gently, then use gentle rotation and angulation to reach the main RCA, changing catheter if needed. The test puff is the tempting answer, but it is still an injection into a damped position. More torque drives the tip further, and leaving it wedged prolongs ischaemia.",
        },
        { kind: "h", text: "The conus trap" },
        {
          kind: "p",
          text: "The conus is the RCA's first branch and supplies the right ventricular outflow tract. It is easily entered while working the tip around the ostium, and the pressure often damps rapidly when it is. Selective injection of contrast into it, especially a large volume, can cause ventricular fibrillation; Oxford also warns that simply leaving the catheter in it for long can cause ischaemia and VF. A trace that damps as the tip enters is the warning: withdraw quickly and gently before any injection. A test puff, given only on a free trace, shows which vessel the tip is in. If VF occurs, defibrillate at once following Advanced Life Support.",
        },
        { kind: "h", text: "Ostial lesions and catheter-tip spasm in the RCA" },
        {
          kind: "list",
          items: [
            "A tip sitting too far into the artery can hide an ostial lesion. When unsure, image the right sinus non-selectively.",
            "Oxford notes that catheter-tip spasm most often follows ostial engagement and that over-engaging a catheter can provoke it, especially in the RCA; it is commonest in non-dominant RCAs and in vessels close to the catheter's own calibre. The trace ventricularises and then falls a few seconds after engagement; withdraw, and give nitrate if needed (Oxford). Spasm can look like a severe stenosis, so when in doubt Oxford tries intracoronary nitrate.",
            "Ventricularisation in the RCA can also mean the conus or a small non-dominant vessel has been entered.",
          ],
        },
        { kind: "h", text: "High, anterior and shepherd's crook origins" },
        {
          kind: "list",
          items: [
            "Oxford regards an anterior RCA origin as common enough to be a normal variant.",
            "When the aortic root dilates it also rotates anticlockwise, so the RCA becomes more anterior; Brilakis suggests AR1 or AR2, or AL1 or AL2, in that situation.",
            "A steep vertical take-off (shepherd's crook): Oxford suggests changing to an AR MOD, a 3DRC or an IMA catheter; Brilakis lists the hockey stick or IM catheter for femoral diagnostics.",
            "Anomalous vessels from the right sinus may engage with a JR4, but an Amplatz shape (AL or AR) is often needed (Oxford).",
            "If you cannot find the ostium at all, stop turning and image the sinus: see the failed-engagement lesson.",
          ],
        },
        {
          kind: "p",
          text: "**Support for RCA PCI (Oxford Table 8.4).** Oxford ranks the JR4 as the least supportive RCA guide, an AR1 or AR2 as more supportive, and a hockey stick or an AL1 or AL2 as the most. A JR4 can support more if it sits deep in the vessel without injuring it. Larger calibre guides support more (8 Fr more than 7 Fr more than 6 Fr), but Brilakis warns that at an aorto-ostial lesion larger guides are more likely to damp, which is why he uses 6 Fr there.",
        },
        {
          kind: "check",
          stem: "A patient with severe aortic regurgitation and a dilated root is studied femorally. Several clockwise sweeps with a JR4 fail to find the RCA. Which reasoning is most useful?",
          options: [
            "The dilated root has rotated so the RCA lies more anteriorly; locate it, then try an AR or AL shape",
            "The RCA must be occluded flush at its ostium; complete the study without further RCA attempts",
            "A shorter JR3.5 will reach better because a dilated root shortens the distance to the ostium",
            "Keep sweeping with steadily increasing clockwise torque until the JR4 tip catches the ostium",
          ],
          answer: 0,
          explanation:
            "Brilakis explains that a dilating root rotates anticlockwise and brings the RCA forward, which is why AR1 or AR2 and AL1 or AL2 shapes help. Locate the ostium first with a non-selective sinus injection rather than more sweeps. A flush occlusion is a possible but unproven conclusion, and escalating torque invites kinking and conus entry.",
        },
        { kind: "tip", id: "diag-jr-two-hand-torque" },
        { kind: "tip", id: "diag-rca-dive-back-out" },
        { kind: "tip", id: "diag-conus-withdraw" },
        { kind: "tip", id: "diag-shepherds-crook-shapes" },
        {
          kind: "pitfalls",
          items: [
            "Turning without the back-and-forth movement, so the rotation does not reach the tip.",
            "Injecting before confirming the tip is in the RCA and not the conus.",
            "Accepting a deep position and missing an ostial lesion.",
            "Using a JR guide for radial RCA PCI, where it often lacks support.",
          ],
        },
        {
          kind: "pearl",
          text: "In the RCA, let the trace speak before the syringe does. A pressure that damps as soon as the tip moves means it is somewhere small or obstructed (the conus, a small non-dominant RCA or an ostial lesion), and nothing is injected until it is free.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Femoral route, JR4: drop to the floor of the right cusp, pull back a few centimetres, then rotate clockwise while moving the shaft back and forth in LAO until the tip enters. If it dives deep, back it out with anticlockwise rotation. If it enters the conus, withdraw before any injection. Repeat from the right radial with a Tiger.",
        },
        { kind: "video", id: "rxqCfRG9QNo", note: "How to manipulate catheters to engage via femoral access (Manual of PCI chapter video)." },
        { kind: "video", id: "NbNaLpynHx4", note: "RCA engagement: eleven pitfalls and troubleshooting." },
        { kind: "video", id: "fM2waEXku90", note: "RCA engagement: detailed steps, troubleshooting, Amplatz Left manipulation and RCA guides." },
        { kind: "video", id: "V4GBcaDmbZc", note: "Case: a shepherd's crook calcified RCA." },
        {
          kind: "keypoints",
          items: [
            "JR4: tip to the floor of the right cusp, pull back a few centimetres, clockwise with back-and-forth, LAO.",
            "Expect a dive into a large dominant RCA; ease back or turn anticlockwise.",
            "Conus: the pressure often damps rapidly as the tip enters; withdraw before any injection, as contrast there can cause VF.",
            "Deep tips hide ostial lesions; image the sinus when in doubt.",
            "Dilated root: RCA moves anterior; AR or AL shapes. Shepherd's crook: AR MOD, 3DRC, IMA or hockey stick.",
            "Radial RCA PCI: AL1, Ikari Right or 3D Right rather than JR.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-fail",
      title: "When the ostium will not engage",
      minutes: 11,
      topics: ["dx-engage-left", "dx-engage-rca"],
      sources: [
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis turns failed engagement into five questions asked in order. Each one either solves the problem or tells you which tool to change, and the last one exists because attempts cost contrast: stopping is a legitimate result when there is no emergency.",
        },
        {
          kind: "steps",
          title: "Failure to engage: five steps (Brilakis 5.7.3.6)",
          items: [
            {
              title: "1. Do you know where the ostium is?",
              detail:
                "If not, image it: a non-selective injection into the coronary cusp, or an aortogram through a pigtail (usually 60 mL over 3 seconds). This shows the coronary and graft ostia, and may reveal a flush ostial occlusion, which makes selective engagement unnecessary. For a suspected anomaly, an RAO projection can show what the usual LAO does not; coronary CT can define the anatomy.",
            },
            {
              title: "2. Is the catheter easy to manipulate?",
              detail:
                "If tortuosity is absorbing your movements: put a 0.035 or 0.038 inch wire inside the catheter, insert a long sheath, use a diagnostic catheter instead of a guide, use a catheter 1 Fr smaller than the sheath, or change access. Radial spasm also hinders manipulation and is treated with vasodilators and smaller catheters.",
            },
            { title: "3. Is the curve the right size?", detail: "Go larger or smaller, or use a guide catheter extension." },
            { title: "4. Is the shape right?", detail: "Try other shapes until one reaches the ostium." },
            {
              title: "5. Stop",
              detail:
                "If everything fails, consider ending the procedure, particularly when a large contrast volume has been used and there is no emergency (no STEMI, no cardiogenic shock). Coronary CT can then clarify the coronary and graft anatomy.",
            },
          ],
        },
        {
          kind: "table",
          caption: "Why engagement fails, and the matching fix",
          head: ["Cause", "Clue", "Solutions"],
          rows: [
            [
              "Anomalous origin",
              "No vessel where expected; a territory without supply",
              "Cusp injection or aortogram; RAO as well as LAO; then a catheter suited to the ostium found (for example an Amplatz; for right-sinus anomalies Oxford finds an AL or AR shape is often needed); coronary CT",
            ],
            ["Flush ostial occlusion", "Nothing fills from the sinus", "Cusp injection or aortogram; collaterals from the other artery to that territory confirm it"],
            [
              "Peripheral tortuosity",
              "Rotation at the hub does not reach the tip",
              "A 0.035 or 0.038 inch wire inside (stiffens the catheter, reduces kinking); the back end of a 0.035 inch wire advanced inside the catheter but not out of the tip straightens it and helps engagement, especially radially; a long sheath (for example 45 cm); a catheter 1 Fr smaller than the sheath (a 7 Fr guide in an 8 Fr sheath); a diagnostic catheter (thicker wall, easier to turn) and then exchange to a guide over a 300 cm 0.014 inch support wire; change access",
            ],
            [
              "Curve too big or small",
              "Tip overshoots or falls short of the ostium",
              "Change curve size; guide catheter extension. In a very dilated root with a hard-to-reach left main, a 4 Fr diagnostic catheter can be telescoped through a 6 Fr AL3 guide",
            ],
            ["Wrong shape", "Tip near the ostium but will not enter", "Other shapes; if a guide tip is close, a 0.014 inch wire passed into the vessel can draw it in (often done for IMA grafts)"],
          ],
        },
        {
          kind: "check",
          stem: "In an elective, stable outpatient, a cusp injection and an aortogram showed the RCA ostium in its usual place. A JR4, a JR5 with a guide extension, an AR MOD and an AL1 have all failed despite a wire inside the catheter and a long sheath, and 220 mL of contrast has been used. What does the manual suggest?",
          options: [
            "Try a fourth and a fifth shape, since one is bound to fit eventually",
            "Consider stopping, then define the anatomy with coronary CT",
            "Repeat the cusp injections with larger volumes to outline the ostium",
            "Telescope a 4 Fr catheter through an AL3 guide to reach the RCA ostium",
          ],
          answer: 1,
          explanation:
            "Steps 1 to 4 have been done: the ostium has been located, manoeuvrability addressed, a larger curve and a guide extension tried, and several shapes tried. Step 5 is to consider stopping when everything has failed, especially after a large contrast load in a patient without an emergency such as STEMI or shock, and to use coronary CT. More shapes add contrast with diminishing returns, and repeating the imaging adds contrast without answering a new question, since the ostium has already been found. The telescoping trick is described for a hard-to-reach left main in a very dilated root, not for this situation.",
        },
        { kind: "h", text: "Anomalies you should expect" },
        {
          kind: "list",
          items: [
            "Oxford puts variant or anomalous anatomy at 1–2% of unselected angiography patients.",
            "Separate LAD and Cx ostia and an anterior RCA origin are normal variants.",
            "Common anomalies: the Cx from the RCA or right sinus, the RCA from the left sinus, the left main from the right sinus, or ostia high in the ascending aorta. Rarely the left main or LAD arises from the pulmonary artery.",
            "There is no fixed rule for which catheter engages an anomalous vessel; the aortogram shows the ostium and the first part of its course, and that decides.",
          ],
        },
        {
          kind: "check",
          stem: "A guide catheter will not stay engaged because the subclavian tortuosity absorbs every turn. Which change addresses manoeuvrability rather than shape?",
          options: [
            "Swap to a larger guide curve so the secondary curve finds the far aortic wall",
            "Rotate harder and faster so that the torque overcomes the subclavian loops",
            "Keep a 0.035 inch wire inside the catheter while you manipulate it",
            "Use a side-hole guide so that the pressure trace stays free while you work",
          ],
          answer: 2,
          explanation:
            "Step 2 of the algorithm is about manoeuvrability. A wire inside the catheter stiffens it, transmits manipulation and reduces kinking; long sheaths, a diagnostic catheter, a catheter 1 Fr smaller than the sheath or another access are the alternatives. Harder rotation is how catheters kink, and a curve change answers step 3, not step 2.",
        },
        { kind: "tip", id: "diag-engage-fail-ladder" },
        { kind: "tip", id: "diag-dilated-root-sizing" },
        { kind: "tip", id: "diag-anomalous-origin-image-first" },
        {
          kind: "pitfalls",
          items: [
            "Cycling through catheters before you know where the ostium is.",
            "Treating a tortuosity problem by changing shape.",
            "Missing a flush occlusion and blaming the catheter.",
            "Continuing in an elective case after a large contrast load when CT could answer the question.",
          ],
        },
        {
          kind: "pearl",
          text: "When you do not know where the ostium is, the next move is a picture, not a new catheter: one cusp injection answers ‘where?’ and ‘is it open?’ at the same time.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "Pick a dilated root or an anomalous-origin case in the cath lab. Before changing catheters, perform a non-selective cusp injection and decide from it which shape to try; record your reasoning at each of the five steps in the debrief.",
        },
        { kind: "video", id: "Q6gLRyyF0jI", note: "Case: STEMI and unable to engage." },
        { kind: "video", id: "KFXCz63Bz4s", note: "Review of radial catheter techniques: case illustrations and troubleshooting." },
        {
          kind: "keypoints",
          items: [
            "Five questions: where is the ostium; can I manipulate; is the size right; is the shape right; should I stop.",
            "Cusp injection or aortogram (often 60 mL over 3 seconds) locates ostia and reveals flush occlusions.",
            "Manoeuvrability: wire inside, long sheath, diagnostic catheter, 1 Fr smaller than the sheath, change access.",
            "Size: change curve or use a guide extension; telescoping 4 Fr through a 6 Fr AL3 for a very dilated root.",
            "Stop and use CT in a stable, non-emergency patient after a large contrast load.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-torque",
      title: "Torque control and catheter kinking",
      minutes: 12,
      topics: ["dx-catheter-torque-kinking"],
      sources: [
        { book: "brilakis-pci", loc: "5.4" },
        { book: "brilakis-pci", loc: "5.6" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
        { book: "oxford-cath", loc: "ch 4: Accessing the right heart" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "A catheter has to carry rotation from the hub, through the arm or the iliac arteries, to its tip. In tortuous vessels much of that rotation is absorbed along the shaft, and excessive torque can fold the shaft into a kink. Brilakis returns to kinking in three separate steps of engagement: when the catheter will not aspirate, when the trace damps, and as a complication of manipulation.",
        },
        { kind: "h", text: "Getting rotation to the tip" },
        {
          kind: "list",
          items: [
            "Use two hands: the right hand turns while the left moves the shaft gently in and out, so the rotation travels down to the tip.",
            "Watch the tip, not the hub. If it is not moving in proportion to the torque you have applied, stop adding more.",
            "Keep a 0.035 or 0.038 inch wire inside the catheter while manipulating it in difficult anatomy: it stiffens the shaft, helps manipulation and makes kinking less likely.",
            "Use long sheaths through iliac tortuosity; Brilakis gives 25–55 cm in one place and 45–55 cm in another for long femoral sheaths. A catheter 1 Fr smaller than the sheath also turns more easily.",
            "Diagnostic catheters have thicker walls than guides, so they turn better and kink less. Oxford adds that small, thin-walled catheters are floppier and transmit less torque.",
            "Shortened guides transmit torque poorly, and side holes punched by hand weaken a guide and can lead to kinking.",
          ],
        },
        { kind: "h", text: "Recognising a kink" },
        {
          kind: "table",
          head: ["Sign", "Why"],
          rows: [
            ["The tip does not move when you turn the hub", "The rotation is being absorbed at the kink"],
            ["The pressure trace damps or disappears", "The lumen is narrowed or closed at the kink"],
            ["The catheter will not aspirate", "Same reason; screen the whole length before assuming a clot"],
            ["Engagement has needed a lot of torque", "The usual way kinks are made, especially through severe iliac, aortic or subclavian tortuosity"],
          ],
        },
        {
          kind: "p",
          text: "Fluoroscopy of the entire catheter, from the sheath to the tip, confirms the kink and shows where it is. Never inject or flush through a kinked catheter.",
        },
        {
          kind: "check",
          stem: "From the right radial, you have turned a JR4 several times in a tortuous subclavian. The tip has stopped responding and the aortic trace has flattened. What is the first thing to do?",
          options: [
            "Add another full clockwise turn to transmit the stored rotation down to the tip",
            "Stop turning and screen the whole length of the catheter for a kink",
            "Flush the catheter vigorously to restore the pressure trace before moving it",
            "Inject a small amount of contrast to see whether the tip has entered the RCA",
          ],
          answer: 1,
          explanation:
            "A tip that ignores the hub and a flattened trace after heavy torque in a tortuous vessel point to a kink, which fluoroscopy of the whole catheter confirms. More rotation tightens the kink, and flushing or injecting through it is unsafe. Once confirmed, untwisting starts in the direction opposite to the turns you made.",
        },
        {
          kind: "steps",
          title: "Recovering a kinked catheter (Brilakis 5.7.4.1)",
          items: [
            {
              title: "1. Untwist and pass a wire",
              detail:
                "Turn the catheter gently in the opposite direction to the one used during engagement, and try to advance a 0.035 inch wire through the kinked segment. Its back end can be used instead, but it may perforate the catheter.",
            },
            {
              title: "2. Snare the tip from a second access",
              detail:
                "Obtain radial or femoral access, snare the catheter tip and use it to straighten the kinked segment while untwisting. From the radial route, if the kink is distal to the brachial artery, inflating a blood-pressure cuff over the brachial artery holds the catheter still while you untwist and remove it.",
            },
            { title: "3. Pressurise the catheter", detail: "Attach an inflation device to the hub and inflate gently to 3–4 atm, which may unwind the kink." },
            {
              title: "4. Encase it in a sheath",
              detail:
                "Cut the catheter at the hub and advance a sheath of the same size, or 1–2 Fr larger, over it to cover the kinked segment so it can be withdrawn. A sheath advanced without its dilator can injure the vessel.",
            },
            {
              title: "5. Pull the kink out through the arteriotomy",
              detail: "Draw the kinked segment out through the puncture, provided enough catheter remains to insert a guidewire afterwards.",
            },
          ],
        },
        {
          kind: "p",
          text: "If the catheter fractures during retrieval, the fragments can usually be snared and removed without surgery. A related problem is the knotted catheter. Oxford deals with it in the context of right heart catheters, where vigorous, prolonged manipulation can tie a knot: call for expert help and do not pull it tight. Sometimes a wire advanced carefully loosens it; if not, the knot is pulled as small as possible, brought back to the sheath and removed with it, which can cause significant bleeding and may need surgical repair. Snares and forceps are percutaneous alternatives, and surgical removal is well reported.",
        },
        {
          kind: "check",
          stem: "A guide kinked in the right forearm, below the brachial artery. Untwisting and passing a wire have failed. Which addition does Brilakis describe for this specific situation?",
          options: [
            "Inflate a blood-pressure cuff at the brachial artery to hold the catheter while untwisting",
            "Cut the hub immediately and pull the whole catheter firmly back through the radial artery",
            "Pressurise the catheter to its rated burst pressure with an inflation device to straighten it",
            "Advance a second guide alongside the first through the same radial sheath to splint the kink",
          ],
          answer: 0,
          explanation:
            "For a radial-route kink below the brachial artery, a cuff inflated at the brachial artery fixes the catheter and makes untwisting and removal easier. Pressurising is gentle (3–4 atm), not to burst pressure, and pulling a kink back forcefully through the forearm risks serious arterial injury.",
        },
        { kind: "h", text: "Prevention" },
        {
          kind: "list",
          items: [
            "Long sheaths in tortuous iliac or aortic anatomy.",
            "No excessive rotation, especially when the tip is not following.",
            "A 0.035 or 0.038 inch wire inside the catheter during manipulation.",
            "A different access for extreme subclavian tortuosity or arteria lusoria: from the right radial to the left radial or to femoral.",
          ],
        },
        { kind: "tip", id: "diag-kink-untwist" },
        { kind: "tip", id: "pci-guide-kink-untwist" },
        {
          kind: "pitfalls",
          items: [
            "Adding torque to a tip that has stopped responding.",
            "Assuming a catheter that will not aspirate is clotted without screening it for a kink.",
            "Forcing a kinked or knotted catheter out through the radial artery.",
            "Advancing a sheath over a cut catheter without thinking about vessel trauma.",
          ],
        },
        {
          kind: "pearl",
          text: "Watch the tip, not your hand. Once the tip stops following the hub, the answer is a wire inside the catheter or a different catheter, not another turn.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "From the right radial in a patient with subclavian tortuosity, engage the RCA with a JR4 keeping the 0.035 inch wire inside the catheter until it reaches the sinus. Rotate with a back-and-forth movement and stop as soon as the tip stops following the hub.",
        },
        { kind: "video", id: "Dy0aGjvQq3g", note: "How to approach catheter kinking (Manual of PCI chapter video)." },
        { kind: "video", id: "l8NIYCW_oXk", note: "Case: guide catheter kinking." },
        { kind: "video", id: "Dg-PqPQPhcA", note: "Case: STEMI, kinked guide and VF." },
        { kind: "video", id: "_gNLUyKe-Xg", note: "Case: guide catheter fracture." },
        {
          kind: "keypoints",
          items: [
            "Turn with the right hand while the left moves the shaft back and forth; watch the tip.",
            "Wire inside, long sheath, 1 Fr smaller than the sheath, or a diagnostic catheter for difficult anatomy.",
            "Kink: tip ignores the hub, trace damps or disappears, no aspiration; confirm by screening the whole length.",
            "Recovery: untwist and pass a wire; snare from second access (or brachial cuff for a forearm kink); 3–4 atm with an inflation device; cut and encase in a sheath; pull through the arteriotomy.",
            "Knot: expert help, do not pull tight.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-exchange",
      title: "Exchanging catheters: long wires, 0.014 inch exchanges and trapping",
      minutes: 13,
      topics: ["dx-catheter-exchange"],
      sources: [
        { book: "brilakis-pci", loc: "5.2" },
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "8.9" },
        { book: "brilakis-pci", loc: "15.1" },
        { book: "brilakis-pci", loc: "30.2" },
        { book: "brilakis-pci", loc: "30.7" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "brilakis-pci", loc: "2.3" },
        { book: "oxford-cath", loc: "ch 4: Equipment" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 3: Which arterial access route to use?" },
        { book: "oxford-cath", loc: "ch 10: Cholesterol embolization" },
      ],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Every exchange is a chance to lose a route you worked hard to gain, to scrape the aorta, or to bring air or clot in with the new catheter. The principles are the same for a 0.035 inch exchange in the root and for a guide exchange over a coronary wire: keep the wire where it is, move the catheters over it, and clear the new catheter before it is used.",
        },
        { kind: "h", text: "Rules for moving any catheter" },
        {
          kind: "list",
          items: [
            "Catheters always travel over a 0.035 or 0.038 inch J-wire, whose tip stays ahead of the catheter under fluoroscopy, usually with the assistant fixing the wire. Advancing a catheter without a leading wire is one of the causes of peripheral dissection.",
            "Keep the wire tip in the aortic root: a 0.035 inch wire that slips into the left ventricle can provoke arrhythmias.",
            "Exchange-length wires are 250–300 cm long (Oxford). Hydrophilic wires should never be manipulated through a needle, which can strip the coating.",
            "Through an abdominal aortic aneurysm, exchange over a wire so the catheter does not dislodge thrombus (Oxford). More generally, using wires for exchanges reduces the aortic plaque disruption that causes cholesterol embolisation.",
            "Each radial exchange adds to the spasm risk; universal radial catheters exist partly to avoid an exchange (Oxford).",
          ],
        },
        {
          kind: "steps",
          title: "0.035 inch exchange after a difficult passage",
          items: [
            {
              title: "Do not give the route back",
              detail:
                "Once a loop, tortuous subclavian or aneurysm has been crossed from the radial artery, Brilakis recommends a 300 cm wire (0.035 or 0.038 inch) for every subsequent exchange, with its tip kept in the aortic root. From the femoral route, consider a long sheath across the difficult segment.",
            },
            {
              title: "Consider a long sheath",
              detail: "A long sheath (for example 45 cm), at least 1 Fr larger than the catheter, makes catheter manipulation much easier. From the radial route, Brilakis describes 24 cm sheaths that reach the brachial artery and keep catheter movement out of the radial artery.",
            },
            {
              title: "Prepare the new catheter outside",
              detail:
                "Flush diagnostic catheters and load them over the wire. Connect guides to the Y-connector and flush them before insertion; a haemostatic valve stops bleeding through large guides. Let large guides back-bleed, because aortic debris is easily scraped into them on the way up.",
            },
            { title: "Clear the sheath", detail: "Aspirate and discard the sheath contents before a guide goes in, then flush the sheath with clean heparinised saline." },
            { title: "Clear the new catheter", detail: "In the root: aspirate 2–3 mL, connect wet, check the trace (see the first lesson)." },
          ],
        },
        { kind: "h", text: "From a diagnostic catheter to a guide over a 300 cm 0.014 inch wire" },
        {
          kind: "p",
          text: "When a guide catheter cannot be made to engage, Brilakis uses the diagnostic catheter's better torque: engage the artery with the diagnostic catheter, pass a 300 cm supportive 0.014 inch wire into the coronary, remove the diagnostic catheter over that wire, and advance the guide over it into the ostium. Support wires are built for exactly this kind of task, including guide exchanges. The same idea solves a problem at an ostium with a protruding stent: wire the vessel with a JR4 guide, then exchange for a more supportive guide over a 300 cm supportive wire with the help of a microcatheter.",
        },
        {
          kind: "check",
          stem: "A 6 Fr EBU guide repeatedly fails to engage a left main through a tortuous subclavian, while the JL3.5 diagnostic catheter engaged it easily. What is the manual's solution?",
          options: [
            "Re-engage with the JL3.5, pass a 300 cm supportive 0.014 inch wire, then exchange to the guide over it",
            "Keep the guide and add more torque until it seats, because the diagnostic shape has proved the route",
            "Perform the PCI through the 6 Fr JL3.5 diagnostic catheter, which has already shown a stable position",
            "Exchange the guide over a standard-length 0.014 inch wire left in the aortic root instead",
          ],
          answer: 0,
          explanation:
            "Diagnostic catheters have thicker walls, so they turn better and kink less. Brilakis describes engaging with the diagnostic catheter, wiring the artery with a 300 cm supportive 0.014 inch wire, and exchanging to the guide over it. A diagnostic catheter's smaller lumen is not designed for equipment delivery, and a standard-length wire is too short for an exchange.",
        },
        { kind: "h", text: "Trapping: holding a wire still while equipment comes out (Brilakis 8.9.2.1)" },
        {
          kind: "p",
          text: "Trapping is Brilakis's preferred way to remove or exchange a microcatheter or any over-the-wire device while keeping a coronary wire exactly where it is, with either a short (180–190 cm) or a long (300 cm) wire. It limits wire movement, and the loss of position, distal injury or perforation that movement causes, and it saves fluoroscopy. Hydraulic exchange, wire extensions and cutting the over-the-wire device are the alternatives, taught in the wiring module.",
        },
        {
          kind: "steps",
          title: "The trapping technique",
          items: [
            { title: "1. Pull the device into the guide", detail: "Pull the microcatheter (or over-the-wire balloon) back inside the guide until it lies just proximal to where the trapping balloon will sit." },
            {
              title: "2. Insert the trapping balloon beside the wire",
              detail:
                "Pass it through the Y-connector next to the wire, not over it. A monorail balloon fits better than an over-the-wire one; dedicated trapping balloons are lower in profile and trap in smaller guides. Leaving the stylet in the end helps it through the haemostatic valve; remove the stylet before advancing further.",
            },
            {
              title: "Choose the size",
              detail:
                "2.5 mm for a 6 or 7 Fr guide, 3.0 mm for a 7 or 8 Fr guide, ideally at least 20 mm long. Length gives more contact, which matters with slippery polymer-jacketed wires.",
            },
            {
              title: "3. Position it",
              detail: "Advance it towards the end of the guide, beyond the distal marker of the device being removed, usually at or near the primary curve. With a short or shortened guide, shaft markers will not stop the balloon entering the coronary.",
            },
            { title: "4. Inflate to 15–20 atm", detail: "The guide pressure should damp while the balloon is trapping. A balloon inflated next to hand-made side holes may rupture." },
            {
              title: "5. Withdraw the device",
              detail: "Fluoroscopy is needed only as removal begins. Polymer-jacketed wires can slip past the balloon if the device is pulled aggressively.",
            },
            { title: "6. Deflate and remove the trapping balloon", detail: "The wire stays in place." },
            {
              title: "7. Back-bleed the Y-connector",
              detail:
                "Air is often drawn into the guide during trapping. Injecting contrast without back-bleeding is likely to cause coronary air embolism. Continuous saline flushing while the devices come out is an alternative.",
            },
          ],
        },
        {
          kind: "list",
          items: [
            "A trapping balloon used several times may deform and stick in the Y-connector valve; replace it, or reinsert it with the stylet.",
            "Trapping several devices in one guide is more likely to fail.",
            "A 6 Fr guide is too small to trap over-the-wire balloons and some larger devices, but 6 Fr guides with a 0.071 inch inner diameter can trap low-profile microcatheters.",
            "Brilakis also describes a guide extension with its own built-in trapping balloon (6–8 Fr). It needs less fluoroscopy than positioning a separate trapping balloon, and avoids a balloon that has become hard to pass back through the Y-connector after many inflations, but it works best with short (135 cm) microcatheters; a 150 cm microcatheter is often too long to leave enough wire exposed for its balloon to trap.",
            "An anchor balloon already in a side branch can be pulled back into the guide and used as the trapping balloon if it is large enough: at least 2.5 mm when the guide is 6 or 7 Fr, and at least 3.0 mm when it is 8 Fr.",
            "If the wire position is lost, rewire. If air was injected, give 100% oxygen and manage as coronary air embolism.",
          ],
        },
        {
          kind: "check",
          stem: "A microcatheter has just been removed from an 8 Fr guide by trapping with a 3.0 mm balloon at 18 atm. The balloon is deflated and out. What must happen before the next contrast injection?",
          options: [
            "Back-bleed the Y-connector, because air is often drawn into the guide during trapping",
            "Re-zero the transducer, because the pressure trace damped while the balloon was inflated",
            "Pass a second wire alongside, because trapping usually pulls the first one back partway",
            "Re-inflate the trapping balloon briefly to check that the wire is still pinned in position",
          ],
          answer: 0,
          explanation:
            "Brilakis singles out back-bleeding as a very important step: air commonly enters the guide during trapping, and injecting without clearing it is likely to embolise air into the coronary. The trace damping during trapping is expected and recovers when the balloon is deflated; it does not mean the transducer needs re-zeroing.",
        },
        { kind: "tip", id: "diag-radial-exchange-long-wire" },
        { kind: "tip", id: "pci-trap-then-backbleed" },
        {
          kind: "pitfalls",
          items: [
            "Pulling a catheter out over a standard-length wire after a hard radial crossing and losing the route.",
            "Letting the wire tip wander into the left ventricle during an exchange.",
            "Inserting a guide through a sheath that has not been aspirated.",
            "Injecting straight after trapping without back-bleeding.",
            "Using too small a trapping balloon for the guide, or a short one with a polymer-jacketed wire.",
          ],
        },
        {
          kind: "pearl",
          text: "A route you have fought for is equipment too. Leave a long wire in it until you are certain you will not need it again.",
        },
        {
          kind: "sim",
          sim: "cathlab",
          task: "From the right radial, exchange a JL3.5 for a JR4 over the 0.035 inch wire with the wire tip held in the aortic root, then aspirate, connect and check the trace before engaging.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the PCI lab, after crossing the lesion, note each moment where equipment is removed over the wire and plan how you would keep the wire still (trapping balloon size for your guide, inflation pressure, and the back-bleed before the next injection).",
        },
        { kind: "video", id: "Ww0SHk97YlY", note: "How to exchange catheters over a 300 cm long supportive 0.014 inch guidewire (Manual of PCI chapter video)." },
        { kind: "video", id: "U7kaCF14SM4", note: "Case: hairpin trap." },
        {
          kind: "keypoints",
          items: [
            "Catheters travel over a wire whose tip stays ahead and in the root, not the LV.",
            "After a difficult radial passage: 300 cm 0.035 or 0.038 inch wire for every exchange; a long sheath at least 1 Fr larger helps.",
            "Aspirate the sheath before a guide goes in; flush and back-bleed guides; aspirate every new catheter.",
            "Guide will not engage: diagnostic catheter in, 300 cm supportive 0.014 inch wire, exchange over it.",
            "Trapping: balloon beside the wire, 2.5 mm (6–7 Fr) or 3.0 mm (7–8 Fr), at least 20 mm, 15–20 atm at the primary curve, then back-bleed.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "pm-engaging-spasm",
      title: "Radial spasm and catheter entrapment",
      minutes: 13,
      topics: ["acc-radial-spasm"],
      sources: [
        { book: "brilakis-pci", loc: "5.3" },
        { book: "brilakis-pci", loc: "5.7" },
        { book: "brilakis-pci", loc: "29.2" },
        { book: "brilakis-pci", loc: "4.3" },
        { book: "brilakis-pci", loc: "11.2" },
        { book: "brilakis-pci", loc: "6.3" },
        { book: "oxford-cath", loc: "ch 3: Radial artery access" },
        { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
        { book: "oxford-cath", loc: "ch 10: Limb ischaemia" },
      ],
      refs: [...BOOKS, "hahalis-radial-heparin-2018"],
      blocks: [
        {
          kind: "p",
          text: "The radial artery is small, and it can go into spasm in response to repeated needle passes, large sheaths, catheter manipulation and exchanges, and an anxious, under-sedated patient. Spasm makes the patient uncomfortable and makes equipment hard to move in either direction; at its worst it grips a catheter so hard that pulling can tear or avulse the artery. Most of the work is prevention, and the rescue is a sequence of patient measures, never force.",
        },
        {
          kind: "table",
          caption: "Who and what causes spasm (Brilakis 5.3.3.4, 29.2.3)",
          head: ["Patient factors", "Procedural factors"],
          rows: [
            ["Small radial artery; high-origin radial artery", "Several needle passes to get access"],
            ["Radial tortuosity", "Sheath or catheter large for the artery"],
            ["Women and smokers", "Extensive catheter manipulation and repeated exchanges"],
            ["Anxiety, inadequate sedation", "No vasodilator after access; intravenous vasopressors"],
          ],
        },
        {
          kind: "steps",
          title: "Prevention",
          items: [
            { title: "Choose the artery", detail: "Use ultrasound: it reduces the number of attempts and so the chance of spasm. Avoid very small radial arteries and use the ulnar or femoral artery instead." },
            {
              title: "Calm patient, numb wrist",
              detail: "Adequate moderate sedation (Oxford suggests mild sedation, for example with an opiate and a benzodiazepine) and adequate local anaesthesia before the puncture.",
            },
            {
              title: "Vasodilator after the sheath",
              detail:
                "Brilakis gives verapamil 2.5 mg, nitroglycerin 100–200 mcg, or both, after the sheath is in, as examples. Oxford describes the common practice of injecting a spasmolytic and anticoagulant cocktail into the radial artery, and gives one example regimen: heparin 2500 IU, verapamil 2.5 mg and GTN 200–400 micrograms. Heparin dosing for radial cases has since been tested: in the randomised SPIRIT OF ARTEMIS trial of transradial diagnostic angiography, 100 IU/kg of heparin led to less radial artery occlusion than a standard 50 IU/kg. Follow your local protocol for all three drugs. The vasodilators lower blood pressure, and verapamil given for radial access is one of the causes of hypotension after nitrate in the angiography step.",
            },
            { title: "Smallest equipment", detail: "The smallest thin-walled sheath possible, and no large catheters, above all in a small radial artery." },
            {
              title: "Fewer movements",
              detail: "Avoid excessive manipulation and repeated exchanges; universal radial catheters can image both coronaries without one. A long (24 cm) radial sheath reaching the brachial artery keeps catheter movement out of the radial artery altogether.",
            },
          ],
        },
        { kind: "h", text: "Recognising it" },
        {
          kind: "p",
          text: "The patient feels the forearm or hand ache; you feel the catheter drag, resist advancement or withdrawal, and turn sluggishly. When a catheter will not advance towards the root, Brilakis's first step is to transduce the pressure from its tip and then perform angiography, which separates spasm from a severe lesion or tortuosity and shows any dissection or perforation that needs treatment first.",
        },
        {
          kind: "check",
          stem: "During a right radial study the patient complains of forearm pain and the JR4 now drags on every movement. Which of these is a recognised cause that you could have avoided?",
          options: [
            "Several catheter exchanges and extensive manipulation through the radial artery",
            "Heparin given intravenously after the sheath was inserted into the artery",
            "Using a thin-walled sheath of the smallest possible diameter",
            "Ultrasound guidance of the radial puncture to reduce the number of passes",
          ],
          answer: 0,
          explanation:
            "Extensive manipulation and multiple exchanges are listed causes of radial spasm. The smallest thin-walled sheath and ultrasound-guided puncture are listed as preventive measures (hydrophilic sheaths also appear among Brilakis's solutions once spasm is present), and heparin is given to protect the artery from occlusion, not a cause of spasm.",
        },
        { kind: "h", text: "A catheter entrapped by spasm: release it, do not pull it" },
        {
          kind: "p",
          text: "First, stop pulling. Forceful withdrawal of a gripped sheath or catheter can avulse the radial artery, and aggressive manipulation in spasm can rupture it, leading to forearm bleeding and, in the worst case, compartment syndrome. Then use any combination of the measures below (Brilakis 5.3.3.4, 11.2.4.3.1, 29.2.3.4). Brilakis lists them without a fixed order; in this module we start with drugs, sedation and warmth and keep the cuff for a grip that persists. Once the grip eases, withdraw gently and re-check the forearm.",
        },
        {
          kind: "list",
          items: [
            "**Vasodilators**: nitroglycerin and verapamil into the artery through the sheath or catheter; if you cannot aspirate through the side port, Brilakis allows the intravenous route. Nitroglycerin can also be injected under the skin around the radial artery (in the access chapter, mixed 1:1 with 1% lidocaine under ultrasound) or given sublingually. The lidocaine mixture goes around the artery, never into it: Brilakis warns that intra-arterial lidocaine can cause seizures.",
            "**More sedation**: anxiety is itself a cause of spasm. Rarely, equipment entrapped by severe spasm needs propofol, a nerve block or even general anaesthesia.",
            "**Warmth**: warm blankets, or gauze soaked in warm sterile saline, over the forearm dilate the artery and can relieve spasm completely.",
            "**A lubricious solution**: Brilakis lists infusion of a lubricious solution (of the kind used during rotational atherectomy) to ease the catheter.",
            "**Ischaemia-induced vasodilation**: pump a blood-pressure cuff on the upper arm beyond systolic and hold it for 5 minutes (the same time in Brilakis's closure and complications chapters); when it is let down, the radial artery often relaxes.",
          ],
        },
        {
          kind: "p",
          text: "If the case must continue through a spastic radial artery, Brilakis lists smaller guides (such as 5 Fr), guides with a dimpled low-friction surface, sheathless guides or dilator systems that let a standard guide pass without a sheath, hydrophilic sheaths and catheters, and low-profile radial sheaths. Changing access is always available.",
        },
        {
          kind: "check",
          stem: "At the end of a radial PCI the sheath will not come out. Vasodilator through the side arm and extra sedation have not helped. Which next step is described in the manual?",
          options: [
            "Hold an upper-arm cuff inflated beyond systolic pressure for 5 minutes, then release it",
            "Apply firm, steady traction on the sheath while the patient takes a deep breath in",
            "Cool the forearm with ice packs to reduce the inflammatory swelling around the sheath",
            "Leave the sheath in place overnight and remove it the next morning without sedation",
          ],
          answer: 0,
          explanation:
            "Ischaemia-mediated vasodilation (cuff above systolic for 5 minutes, then deflation) is one of Brilakis's measures, alongside warming, lubricious solution and deeper sedation. Traction against spasm risks avulsing the artery, and warmth, not cold, relaxes it.",
        },
        { kind: "h", text: "After a difficult radial case" },
        {
          kind: "list",
          items: [
            "Inspect the forearm before the patient leaves. Bleeding from a torn radial artery or an avulsed side branch, or from a compression band placed too far towards the hand, can continue into the forearm and cause compartment syndrome (Brilakis).",
            "Oxford puts forearm haematoma at up to 1% of radial cases, often developing slowly on the ward after sheath removal.",
          ],
        },
        {
          kind: "steps",
          title: "Forearm haematoma: treat it early, before it threatens the compartment",
          items: [
            {
              title: "Compress",
              detail: "Bandage compression of the forearm (Oxford), or an additional compression bracelet over the haematoma (the Bertrand chart reproduced by Brilakis). A local haematoma forming just proximal to the puncture soon after the band goes on is usually fixed by a second band placed against the first (Oxford).",
            },
            { title: "Ice and elevation", detail: "Ice over the haematoma to reduce swelling, and the arm raised in a sling (Oxford)." },
            {
              title: "Treat the patient",
              detail: "Analgesia, control of the blood pressure, and stopping any anticoagulant or antiplatelet infusion or reversing heparin (Oxford; Bertrand chart).",
            },
            {
              title: "A cuff for a larger haematoma",
              detail: "A blood-pressure cuff inflated below systolic. Oxford uses it when a forearm haematoma is noticed, at up to 15 mmHg below systolic, to stop it progressing to compartment syndrome; the Bertrand chart adds it for grade III and IV haematomas, at 20 mmHg below systolic, deflated every 15 minutes, with finger oxygen saturation monitored. Follow local protocol.",
            },
            {
              title: "Grade it and watch it",
              detail: "The Bertrand chart grades radial haematoma from I (local, superficial) through II and III (spreading into the forearm muscles) and IV (above the elbow) to V, an ischaemic threat: compartment syndrome. Measure forearm and arm diameters to follow it.",
            },
          ],
        },
        {
          kind: "p",
          text: "**Compartment syndrome is a different problem.** Its warning signs (Oxford) are pain made worse by passive stretching, pallor, pulselessness, paralysis and paraesthesia in a swollen forearm. Compression and cuffs belong to the haematoma stage; once compartment syndrome is suspected, call the vascular surgeons at once, because emergency fasciotomy may be needed (Brilakis; grade V on the Bertrand chart is an urgent call and a surgical decision). Keep giving analgesia, controlling the blood pressure and stopping or reversing anticoagulation.",
        },
        { kind: "tip", id: "diag-radial-spasm-release" },
        { kind: "tip", id: "access-radial-spasm-no-traction" },
        {
          kind: "pitfalls",
          items: [
            "Pulling harder when the catheter grips.",
            "Skipping sedation in an anxious patient, then fighting the artery for the rest of the case.",
            "Repeated catheter exchanges through a small radial artery.",
            "Forgetting that verapamil and nitrates add up to hypotension.",
            "Leaving the lab without examining the forearm.",
            "Treating a tense forearm with pain on passive stretch as a haematoma to be compressed, instead of calling the surgeons.",
          ],
        },
        {
          kind: "pearl",
          text: "Spasm is solved by time, warmth, drugs and calm. If you catch yourself pulling, stop and work down the list again.",
        },
        {
          kind: "sim",
          sim: "procedure",
          task: "In the full-procedure lab, plan a right radial case for a small, anxious woman who smokes: assess the artery on ultrasound and decide whether it is big enough, give sedation and local anaesthetic before the puncture, use the smallest thin-walled sheath, give the radial vasodilator once the sheath is in, and choose a universal catheter to avoid exchanges. At the end, remove the sheath and check the forearm for haematoma.",
        },
        { kind: "video", id: "Gix-lyDyZcg", note: "How to approach catheter entrapment due to radial artery spasm (Manual of PCI chapter video)." },
        { kind: "video", id: "-MNXJJFMxWo", note: "Case: radial spasm and sequential troubleshooting." },
        {
          kind: "keypoints",
          items: [
            "Causes: small or high-origin radial, tortuosity, women, smokers, anxiety, many punctures, big equipment, much manipulation, many exchanges, no vasodilator, IV vasopressors.",
            "Prevent: ultrasound, avoid tiny radials, sedation and local anaesthetic, vasodilator after the sheath, the smallest thin-walled sheath, few exchanges, long radial sheath.",
            "Release: stop pulling; then any combination of vasodilators (IA, IV, sublingual or around the artery, never IA lidocaine), sedation, warmth, lubricious solution and an upper-arm cuff above systolic for 5 minutes; then gentle withdrawal.",
            "Forceful traction can avulse or rupture the radial artery.",
            "Check the forearm before the patient leaves. Haematoma: compression, ice, elevation, analgesia, blood pressure control, stop or reverse anticoagulation, cuff below systolic for larger ones.",
            "Compartment syndrome (pain on passive stretch in a tense forearm): call the vascular surgeons at once for possible fasciotomy; no more compression.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "pm-engaging-q1",
      stem: "A JL3.5 from the right radial engages as the wire comes out, and the trace now shows a lower systolic peak, a diastolic pressure rising through diastole and a small presystolic hump. The patient is comfortable. What is the safest next action?",
      options: [
        "Give a 1–2 mL test puff now, because a small volume shows whether the narrowing is spasm or fixed ostial disease",
        "Rotate clockwise slightly to move the tip off the wall while keeping the catheter engaged in the ostium",
        "Withdraw slightly until the aortic trace returns, then define the ostium with an injection from just outside it",
        "Give intracoronary nitrate through the catheter in its current position, then repeat the test injection",
      ],
      answer: 2,
      explanation:
        "This is ventricularisation: the tip is obstructing the left main ostium. Nothing is injected through a damped or ventricularised catheter, not even a small test puff, because that risks dissection and ischaemia. Withdrawing until the trace normalises and imaging from just outside the ostium is the safe sequence. Injecting nitrate through the wedged catheter is still an injection into a ventricularised position.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q2",
      stem: "A guide damps on reaching the aortic root. Slight withdrawal and aspiration have both failed to restore the trace. According to Brilakis's algorithm, what is the next step?",
      options: ["Check the pressure transducer", "Screen the guide for a kink", "Remove the guide under suction", "Give a gentle test injection"],
      answer: 0,
      explanation:
        "The order is withdraw, aspirate, check the transducer (a bubble can damp every trace), look for a kink, then remove the catheter under suction without injecting or wiring, and finally aspirate the sheath. A test injection is never part of the damping algorithm.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q3",
      stem: "A catheter will not aspirate. It has been eased back, and fluoroscopy shows no kink. Which statement about the next step is correct?",
      options: [
        "Pass the soft end of the J-wire to clear the tip, then aspirate the catheter once more",
        "Flush gently with a small volume so that the clot is pushed out into the aorta rather than into a coronary artery",
        "Remove it while keeping suction on the syringe, then aspirate the sheath, which is the usual source",
        "Replace the transducer, since an air bubble in the dome is the usual cause of failed aspiration",
      ],
      answer: 2,
      explanation:
        "Once wall contact and kinking are excluded the catheter is presumed plugged with thrombus or plaque, which a wire or a flush would push out into the aorta or a coronary, risking stroke or acute occlusion. It is removed under suction and the sheath, where the clot often formed, is aspirated. A transducer problem damps the trace but does not stop blood being aspirated.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q4",
      stem: "For femoral engagement of the left main with a JL, EBU or XB, where should the catheter tip be when the looped J-wire is withdrawn?",
      options: [
        "Down on the floor of the right coronary cusp, the same position as for the JR4",
        "2–3 cm above the floor of the right cusp, level with the upward limb of the J",
        "Just inside the left ventricle, so the catheter falls back into the left sinus",
        "In the ascending aorta at the level of the brachiocephalic trunk origin",
      ],
      answer: 1,
      explanation:
        "Brilakis parks the tip 2–3 cm above the bottom of the right cusp; as the wire comes out the catheter folds into the left cusp and then the left main. A tip pushed down onto the floor of the right cusp, which is where a JR4 goes, will only go deeper into the right sinus when advanced.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q5",
      stem: "CT before a femoral study shows an ascending aorta of 4 cm in diameter. Which pair of choices follows Brilakis's reasoning about the dilated root?",
      options: [
        "JL3.5 for the left main; JR4 with extra clockwise torque for an RCA that has moved posteriorly",
        "JL4 for the left main; multipurpose for an RCA that has moved down towards the valve",
        "JL6 for the left main; a Tiger catheter for the RCA, which avoids any catheter exchange",
        "JL5 for the left main; AR1 or AR2, or AL1 or AL2, for an RCA that has moved anteriorly",
      ],
      answer: 3,
      explanation:
        "Brilakis's rule adds 1 to the ascending aortic diameter in centimetres to give the JL size (4 cm gives JL5). A dilating root also rotates anticlockwise, bringing the RCA anterior, so AR1 or AR2 and AL1 or AL2 shapes help. A smaller JL would fall short, and the RCA moves anteriorly, not posteriorly.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q6",
      stem: "A JR4 turned clockwise drops abruptly into a large dominant RCA and the trace begins to damp. What should you do?",
      options: [
        "Continue clockwise rotation so the tip turns back out of the artery and into the sinus",
        "Ease it back or give a little anticlockwise rotation so it sits at the ostium",
        "Inject quickly before the trace damps further, then withdraw the catheter",
        "Leave it deep, because a deep position gives the best opacification of the vessel",
      ],
      answer: 1,
      explanation:
        "Oxford warns that the JR4 can dive into large dominant vessels; careful withdrawal or anticlockwise rotation settles it stably at the entrance. More clockwise rotation drives it deeper, and injecting into a damping trace is exactly what must not happen.",
      difficulty: 1,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q7",
      stem: "Which finding during RCA engagement most strongly suggests selective entry into the conus branch?",
      options: [
        "A sudden jump of the tip followed by a normal aortic trace and filling of the PDA",
        "Contrast staining that remains in the wall of the aortic root after washout",
        "Pressure that damps rapidly the moment the tip catches at the RCA ostium",
        "Ventricularisation that progressively falls further a few seconds after engagement",
      ],
      answer: 2,
      explanation:
        "The conus is the first RCA branch, supplying the RV outflow tract; it is easily entered at the ostium and the pressure often damps rapidly when it is (Oxford). The right response is to withdraw before any injection, since contrast there can cause VF. Contrast staining in the aortic wall is aorto-coronary dissection, and a progressive fall a few seconds after ventricularisation is catheter-tip spasm. A jump with a free trace and PDA filling is a normal engagement of the RCA.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q8",
      stem: "A radial JR guide kinks below the brachial artery. Untwisting with a wire has failed and a second access is being obtained. Which sequence matches Brilakis's recovery steps after that?",
      options: [
        "Cut the hub first, then pressurise to 3–4 atm with an inflation device, then snare the tip from the second access",
        "Inflate the catheter to its rated burst pressure with an inflation device, then pull it back firmly through the sheath",
        "Advance a 0.014 inch wire beyond the kink, then remove the guide and the radial sheath together as one unit",
        "Snare and untwist (or use a brachial cuff), then 3–4 atm with an inflation device, then cut the hub and encase it",
      ],
      answer: 3,
      explanation:
        "After untwisting and wiring, Brilakis snares the tip from a second access (or fixes a forearm kink below the brachial with a cuff), then pressurises gently to 3–4 atm, then cuts the hub and advances a same-size or 1–2 Fr larger sheath to encase the kink, and finally pulls the kinked segment through the arteriotomy. Cutting the hub comes late, after the less destructive options, and burst pressure or forceful traction is never part of it.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q9",
      stem: "You need to trap a 0.014 inch wire to remove a low-profile microcatheter from a 6 Fr guide with a 0.071 inch inner diameter. Which set-up follows the manual?",
      options: [
        "A 3.0 mm over-the-wire balloon of 12 mm, loaded over the wire, inflated at 6–8 atm",
        "A 2.0 mm monorail balloon of 8 mm, alongside the wire, at nominal pressure",
        "A 2.5 mm monorail balloon of at least 20 mm, alongside the wire, at 15–20 atm",
        "A 3.5 mm non-compliant balloon of 15 mm, loaded over the wire, at 20 atm",
      ],
      answer: 2,
      explanation:
        "Brilakis uses a 2.5 mm balloon for 6 or 7 Fr guides (3.0 mm for 7 or 8 Fr), ideally at least 20 mm long, inserted next to (not over) the wire and inflated to 15–20 atm near the primary curve. Monorail balloons fit better than over-the-wire balloons. In a 6 Fr guide this works for low-profile microcatheters when the inner diameter is 0.071 inch; a 6 Fr guide is too small to trap an over-the-wire balloon. After deflation, the Y-connector is back-bled before any injection.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q10",
      stem: "Nitroglycerin and verapamil through the side arm, extra sedation and warm saline gauze have not released a gripped 6 Fr radial sheath. Which next measure is supported by the manual?",
      options: [
        "An upper-arm cuff inflated above systolic for about 5 minutes, then released",
        "Intra-arterial lidocaine through the side arm to relax the radial artery wall",
        "Ice packs over the forearm to settle the swelling around the radial artery",
        "A second, larger sheath advanced over the first to free it from the artery",
      ],
      answer: 0,
      explanation:
        "Ischaemia-mediated vasodilation is one of Brilakis's measures: an upper-arm cuff above systolic for 5 minutes, then deflation, after which the radial artery often relaxes. Lidocaine is mixed with nitroglycerin only for injection around the artery; Brilakis warns that intra-arterial lidocaine can cause seizures. Warmth, not cold, relaxes the artery. Advancing a sheath over another catheter is a step for a kinked catheter, not for spasm, and adds trauma to a small artery.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q11",
      stem: "In a STEMI patient the culprit artery cannot be engaged after two catheter shapes, and the location of its ostium is uncertain. What is the best next step?",
      options: [
        "A guide catheter extension advanced through the current catheter",
        "A non-selective cusp injection or an aortogram to locate the ostium",
        "Stop the procedure now and arrange coronary CT to define the anatomy",
        "A third and fourth catheter shape tried before any further imaging",
      ],
      answer: 1,
      explanation:
        "Step 1 of the algorithm is to find the ostium when its location is not understood: a cusp injection or an aortogram (typically 60 mL over 3 seconds through a pigtail), which may also show a flush occlusion. Stopping and using CT is reserved for failure without an emergency, which a STEMI is not. More shapes before knowing where to aim waste time and contrast.",
      difficulty: 2,
      refs: BOOKS,
    },
    {
      id: "pm-engaging-q12",
      stem: "Why does Brilakis advise against side-hole guide catheters in an unprotected left main?",
      options: [
        "The side holes greatly increase the risk of hydraulic dissection with every contrast injection into the left main",
        "Side holes can keep the trace looking normal while the end hole blocks the left main, so ischaemia goes unnoticed",
        "The side holes weaken the catheter tip so much that it cannot hold a stable coaxial position in the left main ostium",
        "The side holes make a trapping balloon rupture whenever one is inflated anywhere inside the guide catheter",
      ],
      answer: 1,
      explanation:
        "Side holes sample aortic pressure, so they can mask damping; a suboptimal position may then go unnoticed, reducing left main flow and causing global ischaemia and haemodynamic collapse. Side-hole guides are, if anything, used to reduce hydraulic dissection risk elsewhere, although dissection can still occur. The balloon rupture caveat applies to hand-made side holes.",
      difficulty: 3,
      refs: BOOKS,
    },
  ],
  sims: [
    { sim: "cathlab", task: "Engage the left main from the femoral route with a JL4 over the looped wire, and from the right radial with a JL3.5 and a Tiger; name the trace before every injection, and with the Tiger confirm the position on fluoroscopy too, because its side hole can hide damping." },
    { sim: "cathlab", task: "Engage the RCA with a JR4 using clockwise rotation with back-and-forth movement in LAO; back out of a deep or conus position before any injection." },
    { sim: "procedure", task: "Run a right radial case from puncture to sheath removal with spasm prevention built in: ultrasound, sedation, vasodilator, a universal catheter and a forearm check." },
  ],
  caseIds: ["pm-engaging-case-radial", "pm-engaging-case-dilated-root"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "pm-engaging-case-radial",
    title: "A right radial study that fights back",
    trackId: "pci-manual",
    stage: 2,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, sections 5.3.3.4, 5.4–5.8, 29.2.1 and 29.2.3; Oxford Handbook, chapter 6 (catheter manipulation, common pitfalls) and chapter 10 (limb ischaemia)" },
    summary: "Diagnostic angiography from the right radial in a small woman with exertional angina: aspiration failure, a ventricularised left main trace, an RCA dive, a kink and an entrapped catheter.",
    presentation:
      "A 64-year-old woman, 1.52 m and 51 kg, a current smoker, with exertional angina and an ischaemic stress test. She is anxious. A right radial approach is planned.",
    findings: ["Blood pressure 138/76 mmHg, sinus rhythm 78/min", "Radial artery smaller than average on ultrasound, but judged adequate for the smallest thin-walled sheath", "No previous angiography"],
    steps: [
      {
        id: "s0",
        prompt: "Ultrasound shows a right radial artery that is smaller than average but judged adequate for the smallest thin-walled sheath; it is not one of the very small arteries to avoid. She is anxious and smokes. How do you plan the access?",
        options: [
          {
            text: "Sedate first, numb the wrist, use the smallest thin-walled sheath, and give radial verapamil and/or nitroglycerin once it is in; change artery only if the radial proves very small",
            best: true,
            feedback: "She has several listed risk factors for spasm: an artery at the small end of the range, female sex, smoking and anxiety. This artery is judged adequate, so the radial can be used with full prevention. Brilakis advises avoiding very small radials (ulnar or femoral instead), adequate sedation and local anaesthesia before the puncture, the smallest thin-walled sheath, and, once the sheath is in, a vasodilator: his examples are verapamil 2.5 mg, nitroglycerin 100–200 mcg, or both (typical doses; follow local protocol).",
          },
          {
            text: "Change to femoral access, given how small the radial artery is",
            acceptable: true,
            feedback: "Reasonable and safe, but not required here: Brilakis advises the ulnar or femoral artery instead of a very small radial, and this artery has been judged adequate. This case continues from the radial so that its spasm prevention can be practised.",
          },
          {
            text: "A 6 Fr sheath straight away, with no sedation and no vasodilator, to save time",
            feedback: "Large equipment in a small artery, anxiety and no vasodilator are each listed causes of radial spasm; together they make spasm much more likely later in the case.",
            stateDelta: { stability: -10, flags: ["spasm-risk"] },
          },
        ],
      },
      {
        id: "s1",
        prompt: "Radial access is obtained under ultrasound on the second pass. Which first catheter for the left coronary artery from the right radial?",
        options: [
          { text: "JL3.5", best: true, feedback: "Oxford's standard for the right radial, and the smaller arm also suits a short patient with a small root." },
          { text: "A universal radial catheter such as a Tiger", acceptable: true, feedback: "Reasonable: it can image both coronaries without an exchange, which may reduce spasm in a small radial artery. Remember its side hole can hide damping." },
          { text: "JL5", feedback: "A JL5 is for dilated roots or very tall patients; a curve too large for the aorta is a recognised cause of failure to engage (Brilakis 5.7.3.4).", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "s2",
        prompt: "The JL3.5 is in the root and the wire is out. You cannot aspirate blood. What now?",
        options: [
          { text: "Ease the catheter back a few millimetres and try again", best: true, feedback: "Often the tip is simply against the wall. A few millimetres often restore free aspiration and the pressure trace." },
          { text: "Flush firmly to clear the catheter", next: "c-flush", feedback: "Flushing a catheter that will not aspirate can push clot or plaque into the circulation.", stateDelta: { stability: -25, flags: ["embolism-risk"] } },
          { text: "Pass the J-wire through the catheter to clear the tip", next: "c-flush", feedback: "A wire through a plugged catheter pushes the plug out of the tip; Brilakis warns against it explicitly.", stateDelta: { stability: -25, flags: ["embolism-risk"] } },
        ],
      },
      {
        id: "c-flush",
        kind: "consequence",
        prompt: "The patient briefly reports blurred vision in one eye, which resolves over a minute. The neurological examination is otherwise normal. What do you do?",
        info: "Blood pressure 142/80 mmHg. The catheter still will not aspirate.",
        options: [
          {
            text: "Remove the catheter under suction, aspirate the sheath, and arrange urgent neurological assessment and imaging",
            best: true,
            feedback: "A possible embolic event needs urgent assessment; Brilakis's stroke pathway is emergency CT and neurology review. The catheter comes out under suction and the sheath is aspirated before any new catheter goes in.",
          },
          { text: "Continue the study, since the symptom has resolved", feedback: "Transient symptoms after a flush through a blocked catheter must be assessed urgently, and the blocked catheter must not be used.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s3",
        prompt: "With a new, cleared JL3.5, the tip drops into the left main as the wire comes out. The trace changes from 138/76 to about 126/12 mmHg with diastolic pressure rising through diastole. What next?",
        info: "The patient has no pain.",
        options: [
          { text: "Withdraw until the aortic trace returns, then image from just outside the ostium", best: true, feedback: "Ventricularisation means the tip is obstructing the ostium. Back out first; an injection from just outside the ostium shows whether there is ostial disease." },
          { text: "Give a gentle 1–2 mL test puff to see what is there", next: "c-dissect", feedback: "Even a small injection into a ventricularised catheter can dissect the ostium.", stateDelta: { stability: -30, flags: ["lm-dissection"] } },
          { text: "Give intracoronary nitrate through the catheter where it is", next: "c-dissect", feedback: "Nitrate through a wedged catheter is still an injection into a ventricularised position.", stateDelta: { stability: -25, flags: ["lm-dissection"] } },
        ],
      },
      {
        id: "c-dissect",
        kind: "consequence",
        prompt: "Contrast hangs at the left main ostium after washout, and the patient develops chest pain with ST-segment elevation. What is the priority?",
        info: "Blood pressure 98/60 mmHg, heart rate 102/min.",
        options: [
          {
            text: "Stop injecting, ease the catheter back, call for help and prepare to wire the true lumen and stent; consider a guide from a second access",
            best: true,
            feedback: "A flow-limiting left main dissection needs urgent stenting. A dissection made by a diagnostic catheter can be wired through it and treated with a guide from a second access (the ping-pong technique).",
          },
          { text: "Repeat the injection to define the dissection better", feedback: "Further injection extends the dissection. Stop injecting.", stateDelta: { stability: -20 } },
        ],
      },
      {
        id: "s4",
        prompt: "The left system is imaged. You turn a JR4 clockwise in LAO and it drops suddenly deep into a large RCA; the trace starts to damp. What do you do?",
        options: [
          { text: "Ease back or turn slightly anticlockwise until it sits at the ostium with a free trace", best: true, feedback: "The JR4 dives into large dominant vessels; settle it at the entrance before injecting." },
          { text: "Inject quickly before the trace damps any further", next: "c-vf", feedback: "Injecting into a damping, deep catheter risks ischaemia, dissection and VF.", stateDelta: { stability: -30, flags: ["vf"] } },
          { text: "Keep turning clockwise to bring the tip back out", feedback: "Clockwise rotation is what drove it in; it will go deeper.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "c-vf",
        kind: "consequence",
        prompt: "The monitor shows ventricular fibrillation.",
        options: [
          { text: "Defibrillate immediately and follow Advanced Life Support; withdraw the catheter from the ostium", best: true, feedback: "VF in the lab needs immediate defibrillation; the catheter is removed from the ostium so it no longer obstructs flow." },
          { text: "Give amiodarone first and prepare to shock if VF persists", feedback: "Defibrillation comes first; drugs are for VF resistant to shocks.", stateDelta: { stability: -20 } },
        ],
      },
      {
        id: "s5",
        prompt: "For a second RCA view you rotate the JR4 again in the tortuous subclavian. After several turns the tip no longer moves with the hub and the trace has flattened. What now?",
        options: [
          { text: "Stop rotating, screen the whole catheter, then untwist in the opposite direction and try to pass a 0.035 inch wire", best: true, feedback: "These are the signs of a kink. Fluoroscopy confirms it; untwisting and wiring is Brilakis's first step." },
          { text: "Add another full turn to transmit the stored torque", next: "c-kink-sub", feedback: "More torque tightens a kink.", stateDelta: { stability: -15, flags: ["kink"] } },
          { text: "Pull the catheter out firmly through the radial sheath", next: "c-kink", feedback: "A kinked catheter forced back through the forearm can injure the artery.", stateDelta: { stability: -20, flags: ["kink"] } },
        ],
      },
      {
        id: "c-kink-sub",
        kind: "consequence",
        prompt: "Fluoroscopy shows a tight kink in the subclavian segment. What do you do?",
        options: [
          {
            text: "Untwist gently in the opposite direction and try to pass a 0.035 inch wire; if that fails, snare the tip from a second access to straighten it",
            best: true,
            feedback: "Brilakis's first two steps. Next would be gentle pressurisation to 3–4 atm with an inflation device, then cutting the hub and encasing the kink in a sheath. A brachial cuff only helps when the kink lies below the brachial artery.",
          },
          { text: "Inflate a blood-pressure cuff at the brachial artery and pull the catheter back", feedback: "The cuff fixes a kink below the brachial artery; this one is in the subclavian, and pulling a kinked catheter risks arterial injury.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "c-kink",
        kind: "consequence",
        prompt: "Pulling has drawn the kink down the arm: it is now tight and lies in the forearm, below the brachial artery. Untwisting fails. What helps?",
        options: [
          { text: "Inflate a blood-pressure cuff at the brachial artery to fix the catheter, then untwist and remove it", best: true, feedback: "For a radial kink below the brachial, a cuff holds the catheter still. Next options are snaring from a second access, gentle pressurisation at 3–4 atm, and encasing in a sheath." },
          { text: "Cut the hub and pull the catheter out by hand", feedback: "Cutting and encasing in a sheath is a later step, and pulling a kink through the forearm risks avulsion.", stateDelta: { stability: -15 } },
        ],
      },
      {
        id: "s6",
        prompt: "The study is complete. As you withdraw the last catheter and then the sheath, both grip and she reports forearm pain. What do you do?",
        options: [
          { text: "Stop pulling; give intra-arterial nitroglycerin and verapamil, more sedation, warm the forearm, and wait", best: true, feedback: "Spasm is released with vasodilators, sedation and warmth, then gentle withdrawal; a cuff above systolic for 5 minutes is the next step if needed." },
          { text: "Apply firm traction to remove the sheath before the spasm worsens", next: "c-avulsion", feedback: "Forceful withdrawal in spasm can avulse or rupture the radial artery.", stateDelta: { stability: -30, flags: ["radial-injury"] } },
        ],
      },
      {
        id: "c-avulsion",
        kind: "consequence",
        prompt: "The sheath comes out with a tearing sensation, and over 20 minutes the forearm becomes tense and very painful on passive finger extension.",
        options: [
          {
            text: "Call the vascular surgeons at once for possible emergency fasciotomy; give analgesia, control the blood pressure and reverse the heparin",
            best: true,
            feedback: "Pain on passive stretch in a tense forearm means suspected compartment syndrome. Oxford asks for early vascular surgical involvement, Brilakis says emergency fasciotomy is needed, and grade V on the Bertrand chart is an urgent call and a surgical decision. Compression and cuffs belong to the earlier haematoma stage.",
          },
          {
            text: "Inflate a cuff 15 mmHg below systolic over the forearm and reassess in 30 minutes",
            feedback: "That is Oxford's measure to stop a forearm haematoma progressing; once compartment syndrome is suspected, waiting delays surgical decompression.",
            stateDelta: { stability: -15 },
          },
          { text: "Apply a second radial band and reassess in the morning", feedback: "A tense forearm with pain on passive stretch cannot wait.", stateDelta: { stability: -20 } },
        ],
      },
    ],
    outcome:
      "The study is completed with a free trace before every injection. The left main is normal when imaged from just outside the ostium; the ventricularisation came from the JL3.5 tip angled up against the wall of the left main ostium. The RCA has a moderate mid lesion for physiological assessment. The sheath came out after vasodilator, sedation and warming, and the forearm is soft at discharge.",
    outcomeVariants: [
      { flag: "embolism-risk", text: "A transient visual symptom after flushing a blocked catheter needed urgent neurological assessment and imaging, and delayed the study." },
      { flag: "lm-dissection", text: "An iatrogenic left main dissection needed emergency stenting through a guide from a second access." },
      { flag: "vf", text: "An injection into a deep, damping RCA position caused VF, treated with immediate defibrillation." },
      { flag: "kink", text: "A kinked JR4 needed untwisting, a wire and further recovery steps, prolonging the case." },
      { flag: "spasm-risk", text: "Access without sedation or vasodilator in a smaller-than-average radial artery set the scene for the spasm that gripped the sheath at the end." },
      { flag: "radial-injury", text: "Forceful sheath removal injured the radial artery, with a forearm haematoma that needed surgical review." },
    ],
    learningPoints: [
      "A catheter that will not aspirate is eased back, screened for a kink, and if still blocked removed under suction: never flushed or wired.",
      "A ventricularised trace on engagement means back out and image from outside the ostium; no test puff, no nitrate through it.",
      "A JR4 that dives into a large RCA is settled with withdrawal or anticlockwise rotation, never more clockwise torque.",
      "A tip that ignores the hub plus a flattened trace is a kink: stop, screen, untwist and wire.",
      "Radial spasm is released with drugs, sedation, warmth and time; forceful traction can avulse the artery.",
      "In a small radial artery: sedation and local anaesthesia first, the smallest thin-walled sheath, a vasodilator after the sheath, or a different artery.",
      "Compression and cuffs are for a forearm haematoma; suspected compartment syndrome needs the vascular surgeons at once.",
    ],
    refs: BOOKS,
  },
  {
    id: "pm-engaging-case-dilated-root",
    title: "Severe aortic regurgitation and an RCA that will not be found",
    trackId: "pci-manual",
    stage: 2,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, sections 1.5, 5.6, 5.7 and 30.2.6; Oxford Handbook, chapter 6 (choice of catheters, catheter manipulation, unusual anatomy)" },
    summary: "Femoral coronary angiography before valve surgery in a man with a dilated ascending aorta: planning the curve, engaging the left main, finding an anterior RCA and handling the conus.",
    presentation:
      "A 71-year-old man, 1.88 m, with severe aortic regurgitation referred for coronary angiography before aortic valve surgery. CT shows an ascending aorta of 4 cm diameter. Right femoral access with a 6 Fr sheath.",
    findings: ["Blood pressure 152/48 mmHg, sinus rhythm 64/min", "eGFR 52 mL/min/1.73 m²", "No previous angiography"],
    steps: [
      {
        id: "s1",
        prompt: "Which catheter do you choose for the left coronary artery?",
        options: [
          { text: "JL5: the 4 cm aorta plus one gives the size", best: true, feedback: "Brilakis's rule for a dilated ascending aorta (diameter in cm plus one) gives JL5, and Oxford advises longer arms for dilated roots and tall patients." },
          { text: "JL4, then step up if it falls short", acceptable: true, feedback: "Workable, but the CT already tells you the root is dilated; planning the size saves an exchange." },
          { text: "JL3.5", feedback: "A smaller curve is for small roots and short patients; a curve too small for the aorta is a recognised cause of failure to engage (Brilakis 5.7.3.4).", stateDelta: { stability: -5, flags: ["extra-exchange"] } },
        ],
      },
      {
        id: "s2",
        prompt: "Over the looped J-wire, where do you put the JL5 tip before pulling the wire?",
        options: [
          { text: "2–3 cm above the floor of the right cusp, at the upward limb of the J", best: true, feedback: "Pulling the wire then lets the catheter fold into the left cusp and drop into the left main." },
          { text: "Down on the floor of the right cusp", next: "c-rightcusp", feedback: "From there the tip cannot cross to the left cusp; advancing just buries it deeper in the right sinus.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "c-rightcusp",
        kind: "consequence",
        prompt: "The tip is bent down into the right sinus and advancing makes it worse. What now?",
        options: [
          { text: "Pull back, reload the wire, re-park the tip 2–3 cm above the cusp floor, then withdraw the wire", best: true, feedback: "Reposition rather than push." },
          { text: "Advance harder so the catheter flips across", feedback: "Advancing only drives the tip deeper into the right sinus; force is never the answer.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "s3",
        prompt: "The left main is engaged and imaged. Several clockwise sweeps with a JR4 do not find the RCA. What next?",
        options: [
          { text: "A non-selective injection into the right cusp to locate the ostium", best: true, feedback: "Step 1 of the failure algorithm: find the ostium before changing shape. It may also show a flush occlusion." },
          { text: "An aortogram through a pigtail", acceptable: true, feedback: "Also step 1 and shows all the ostia, at the cost of a larger contrast volume (usually 60 mL) in a patient with reduced renal function." },
          { text: "Keep sweeping with more clockwise torque", next: "c-torque", feedback: "Repeated hard rotation adds contrast and time and invites kinking or conus entry.", stateDelta: { stability: -10, flags: ["kink-risk"] } },
        ],
      },
      {
        id: "c-torque",
        kind: "consequence",
        prompt: "The JR4 tip has stopped following the hub and the trace looks flatter. What do you do?",
        options: [
          { text: "Stop, screen the whole catheter for a kink, untwist and pass a wire, then go back to locating the ostium", best: true, feedback: "Recognise the kink before anything else, then return to the algorithm." },
          { text: "Flush the catheter to restore the trace", feedback: "Never flush or inject through a possibly kinked catheter.", stateDelta: { stability: -10 } },
        ],
      },
      {
        id: "s4",
        prompt: "The cusp injection shows the RCA arising high and anteriorly from the right sinus. Which shape do you try?",
        info: "The ostium is well above the JR4's reach and faces forward.",
        options: [
          { text: "An Amplatz Right (AR1 or AR2) or Amplatz Left (AL1)", best: true, feedback: "A dilated root rotates anticlockwise and brings the RCA anterior; Brilakis suggests AR or AL shapes." },
          { text: "A multipurpose catheter", feedback: "Oxford notes that multipurpose shapes engage at an aggressive angle with a risk of dissection; an anterior RCA in a dilated root is the situation Brilakis gives for AR or AL shapes.", stateDelta: { stability: -5 } },
          { text: "A JR3.5", feedback: "A shorter JR reaches even less far into a dilated root.", stateDelta: { stability: -5 } },
        ],
      },
      {
        id: "s5",
        prompt: "As the AR tip enters the RCA ostium, the trace damps at once. No contrast has been given.",
        options: [
          { text: "Withdraw quickly but gently, then re-engage the main RCA with small adjustments", best: true, feedback: "Damping as the tip enters at the RCA ostium is typical of the conus branch, where Oxford says the pressure often damps rapidly; injecting into it can cause VF. Withdraw first; a test puff comes only on a free trace." },
          { text: "A small test puff to see which vessel the tip is in", feedback: "Oxford: do not inject with a damped or ventricularised trace. If this is the conus, even a puff can provoke ischaemia and VF.", stateDelta: { stability: -15 } },
          { text: "Inject a full volume to image the vessel properly", next: "c-vf2", feedback: "A full injection into a damped catheter, here sitting in the conus, can cause VF.", stateDelta: { stability: -30, flags: ["vf"] } },
        ],
      },
      {
        id: "c-vf2",
        kind: "consequence",
        prompt: "Ventricular fibrillation.",
        options: [
          { text: "Immediate defibrillation, withdraw the catheter, Advanced Life Support", best: true, feedback: "Shock first." },
          { text: "Atropine, then reassess the rhythm", feedback: "Defibrillation is the immediate treatment for VF (Oxford, following Advanced Life Support); atropine has no role.", stateDelta: { stability: -20 } },
        ],
      },
      {
        id: "s6",
        prompt: "The RCA is now engaged coaxially with a free trace. Before the cine run, what do you check?",
        options: [
          { text: "The pressure trace and ECG again, then a test puff; and the same checks after the run", best: true, feedback: "Brilakis checks pressure and ECG before every run and after it." },
          { text: "Nothing more: the trace was free when the catheter engaged", feedback: "Damping can appear between engagement and injection; look again.", stateDelta: { stability: -5 } },
        ],
      },
    ],
    outcome:
      "Angiography shows unobstructed coronaries, with a high anterior RCA arising from the dilated root and a circumflex from the left main supplying the lateral wall. Contrast use was kept modest by locating the ostium early. The report documents the catheters that worked (JL5 and an Amplatz shape) for the surgical team and any future study.",
    outcomeVariants: [
      { flag: "extra-exchange", text: "A JL3.5 fell short in the dilated root and needed an exchange to a longer curve." },
      { flag: "kink-risk", text: "Repeated hard rotation of the JR4 nearly kinked it and added contrast before the ostium was located." },
      { flag: "vf", text: "Injection into the conus branch caused VF, treated with immediate defibrillation." },
    ],
    learningPoints: [
      "Plan the curve from the CT: in a dilated ascending aorta, JL size is the diameter in centimetres plus one.",
      "For femoral left engagement, park the tip 2–3 cm above the right cusp floor before withdrawing the looped wire.",
      "When the RCA cannot be found, image the sinus before changing shape.",
      "A dilated root rotates anticlockwise and brings the RCA anterior: AR or AL shapes.",
      "Damping as the tip enters the RCA ostium, often the conus: withdraw before any injection.",
      "Before valve surgery, make sure every territory, including the lateral wall, has a supplying vessel: a missed anomalous circumflex can be tied off at the operation (Oxford).",
      "Document the catheters that worked.",
    ],
    refs: BOOKS,
  },
];

// ---------------------------------------------------------------------------
// Lab tips: shown in the labs when their trigger matches, and in the lessons
// ---------------------------------------------------------------------------

const S_ENG = [{ book: "brilakis-pci" as const, loc: "5.7" }];

export const tips: LabTip[] = [
  {
    id: "diag-aspirate-before-engaging",
    lab: "diagnostic",
    when: { phase: ["advance", "exchange"] },
    title: "Aspirate before you engage",
    text: "With the wire out, draw back 2–3 mL and discard it onto a white gauze, then connect to the manifold while it is flushing. If blood will not come, ease back a few millimetres; never flush or pass a wire through a catheter that will not aspirate.",
    tone: "do",
    lessonId: "pm-engaging-trace",
    sources: [
      { book: "brilakis-pci", loc: "5.4" },
      { book: "brilakis-pci", loc: "5.5" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-test-puff-then-recheck",
    lab: "diagnostic",
    when: { phase: ["inject"] },
    title: "Test puff, then look again before every run",
    text: "A 1–2 mL test puff confirms a coaxial position. Check the pressure trace and ECG immediately before each cine run and again after it; inject only on a free trace.",
    tone: "do",
    lessonId: "pm-engaging-trace",
    sources: [
      { book: "brilakis-pci", loc: "6.2" },
      { book: "brilakis-pci", loc: "6.5" },
      { book: "brilakis-pci", loc: "6.7" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-damped-stepwise",
    lab: "diagnostic",
    when: { event: ["pressure-damped"] },
    title: "Damped trace: do not inject, work the steps",
    text: "Withdraw slightly, then aspirate, then check the transducer, then screen for a kink. If none restores the trace, remove the catheter under suction without injecting or passing a wire, and aspirate the sheath.",
    tone: "bailout",
    lessonId: "pm-engaging-damping",
    sources: [{ book: "brilakis-pci", loc: "5.6" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-ventricularised-stay-out",
    lab: "diagnostic",
    when: { event: ["pressure-ventricularised"] },
    title: "Ventricularised: back out, image from outside",
    text: "The tip is obstructing the ostium: an ostial lesion, the wall, spasm or a small branch. Withdraw until the aortic trace returns and image from just outside the ostium. If the trace ventricularises and then keeps falling after engagement, suspect catheter-tip spasm: withdraw first, re-engage carefully (coaxial, not deep), give intracoronary nitrate only once the trace is free, then record an image showing the spasm has gone.",
    tone: "caution",
    lessonId: "pm-engaging-damping",
    sources: [
      { book: "brilakis-pci", loc: "5.8" },
      { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
    ],
    refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
  },
  {
    id: "diag-jl-femoral-wire-loop",
    lab: "diagnostic",
    when: { phase: ["engage-left"], catheter: ["JL", "EBU"] },
    title: "Let the curve fold into the left cusp",
    text: "From the femoral route, loop the J-wire on the valve and park the tip 2–3 cm above the floor of the right cusp before you pull the wire. If the tip is pushed down into the right cusp, advancing only buries it deeper: pull up and repeat.",
    tone: "do",
    lessonId: "pm-engaging-left",
    sources: S_ENG,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-tig-left-anticlockwise",
    lab: "diagnostic",
    when: { phase: ["engage-left"], catheter: ["TIG"] },
    title: "Tiger: anticlockwise in, then seat",
    text: "Put the tip in the left sinus and turn anticlockwise, withdrawing a little if needed; once it is in the ostium a gentle clockwise turn seats it. A deep breath can help from the right radial. The Tiger's side hole near the tip can keep the trace looking normal while the end hole is obstructed, so confirm the position on fluoroscopy and keep the test puff gentle.",
    tone: "do",
    lessonId: "pm-engaging-left",
    sources: [{ book: "oxford-cath", loc: "ch 6: Catheter manipulation" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-short-lm-size-up",
    lab: "diagnostic",
    when: { phase: ["engage-left"], catheter: ["JL"], engagement: ["deep-lm"] },
    title: "Deep in the left main: withdraw first",
    text: "A JL sitting deep in the left main should be withdrawn slightly before any injection. If it keeps entering the LAD because the left main is short, moving up one JL size usually lets the tip reach the circumflex.",
    tone: "caution",
    lessonId: "pm-engaging-left",
    sources: [{ book: "oxford-cath", loc: "ch 6: Common pitfalls" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-jr-two-hand-torque",
    lab: "diagnostic",
    when: { phase: ["engage-right"], catheter: ["JR"] },
    title: "JR4: down, back, then turn with two hands",
    text: "Take the tip to the floor of the right cusp, pull back a few centimetres, then turn clockwise with your right hand as your left hand moves the shaft gently back and forth. Watch in LAO for the small jump into the ostium.",
    tone: "do",
    lessonId: "pm-engaging-rca",
    sources: S_ENG,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-rca-dive-back-out",
    lab: "diagnostic",
    when: { phase: ["engage-right"], catheter: ["JR", "TIG"], engagement: ["deep-rca"] },
    title: "Tip dived deep: ease back or turn anticlockwise",
    text: "JR4 and Tiger catheters can dive into the RCA, the JR4 particularly in a large dominant vessel (Oxford). Ease back or turn slightly anticlockwise so the tip sits at the ostium, and check the trace before any injection.",
    tone: "caution",
    lessonId: "pm-engaging-rca",
    sources: [{ book: "oxford-cath", loc: "ch 6: Catheter manipulation" }],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-conus-withdraw",
    lab: "diagnostic",
    when: { event: ["conus-selective"] },
    title: "Conus branch: withdraw before any injection",
    text: "When the tip enters the conus branch, the pressure often damps rapidly. Withdraw quickly but gently before any injection, because contrast here can cause VF, then find the main RCA with gentle rotation and angulation; occasionally a different catheter is needed.",
    tone: "bailout",
    lessonId: "pm-engaging-rca",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
    ],
    refs: ["oxford-cath-handbook"],
  },
  {
    id: "diag-shepherds-crook-shapes",
    lab: "diagnostic",
    when: { phase: ["engage-right"], event: ["engage-fail"], catheter: ["JR"] },
    title: "RCA not found: locate it, then change the shape",
    text: "First locate the ostium with a non-selective sinus injection. If it shows a steep vertical take-off (shepherd's crook), change shape: an AR MOD, a 3DRC (Williams) or an IMA catheter, or a hockey stick. If the RCA is anterior in a dilated root, try AR1 or AR2, or AL1 or AL2.",
    tone: "do",
    lessonId: "pm-engaging-rca",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Catheter manipulation" },
      { book: "brilakis-pci", loc: "5.7" },
      { book: "brilakis-pci", loc: "30.2" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-engage-fail-ladder",
    lab: "diagnostic",
    when: { event: ["engage-fail"] },
    title: "Failed engagement: five questions",
    text: "Where is the ostium (cusp injection or aortogram)? Can you manipulate the catheter (wire inside, long sheath, diagnostic catheter, change access)? Is the curve the right size? Is the shape right? If all fail in a non-emergency, stop and use CT.",
    tone: "do",
    lessonId: "pm-engaging-fail",
    sources: S_ENG,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-dilated-root-sizing",
    lab: "diagnostic",
    when: { event: ["dilated-root"] },
    title: "Dilated root: longer JL, Amplatz for an anterior RCA",
    text: "Add 1 to the ascending aortic diameter in centimetres to choose the JL (4 cm gives JL5). The dilating root rotates anticlockwise and carries the RCA anteriorly, where AR1 or AR2 and AL1 or AL2 shapes reach it.",
    tone: "do",
    lessonId: "pm-engaging-fail",
    sources: [{ book: "brilakis-pci", loc: "30.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-kink-untwist",
    lab: "diagnostic",
    when: { event: ["catheter-kink"] },
    title: "Tip ignores the hub: stop, screen, untwist",
    text: "Stop rotating and screen the whole catheter. Untwist gently in the opposite direction and pass a 0.035 inch wire through the kink; never inject or flush through it. If that fails: snare from a second access (or a brachial cuff for a forearm kink), 3–4 atm with an inflation device, then cut and encase it in a sheath.",
    tone: "bailout",
    lessonId: "pm-engaging-torque",
    sources: S_ENG,
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-guide-kink-untwist",
    lab: "pci",
    when: { phase: ["guide"], event: ["catheter-kink"] },
    alsoIn: [{ lab: "diagnostic", phase: ["advance", "engage-left", "engage-right"] }],
    title: "Guide tip ignores the hub: stop, screen, untwist",
    text: "Guides kink too, especially through tortuous iliac, aortic or subclavian arteries; shortened guides transmit torque poorly, and hand-made side holes weaken a guide. Stop rotating, screen the whole guide and never inject or flush through it. Untwist in the opposite direction and pass a 0.035 inch wire; if that fails, snare from a second access (or a brachial cuff for a forearm kink), 3–4 atm with an inflation device, then cut and encase it in a sheath.",
    tone: "bailout",
    lessonId: "pm-engaging-torque",
    sources: [
      { book: "brilakis-pci", loc: "5.7" },
      { book: "brilakis-pci", loc: "30.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-ostial-spasm-withdraw-nitrate",
    lab: "diagnostic",
    when: { event: ["ostial-spasm"] },
    title: "Catheter-tip spasm: withdraw, re-engage, then nitrate",
    text: "A trace that ventricularises and then keeps falling a few seconds after engagement, often after over-engagement and most often in a non-dominant RCA, is catheter-tip spasm. Withdraw until the aortic trace returns, then re-engage carefully (coaxial, not deep) and give intracoronary nitrate only once the trace is free. Wait, then record an image showing the spasm has gone, so it is not reported as an ostial stenosis.",
    tone: "bailout",
    lessonId: "pm-engaging-damping",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Use of nitrates" },
      { book: "oxford-cath", loc: "ch 6: Common pitfalls" },
      { book: "brilakis-pci", loc: "25.2" },
    ],
    refs: ["oxford-cath-handbook", "brilakis-manual-pci"],
  },
  {
    id: "diag-anomalous-origin-image-first",
    lab: "diagnostic",
    when: { event: ["anomalous-origin"] },
    title: "Anomalous origin: image the root before choosing",
    text: "Locate the ostium with a cusp injection or an aortogram, and look in RAO as well as the usual LAO. There is no fixed rule for the catheter: from the right sinus an AL or AR shape is often needed, from the left sinus a JL of unusual size or an AL. A multipurpose catheter can work but engages at an aggressive angle and can dissect.",
    tone: "do",
    lessonId: "pm-engaging-fail",
    sources: [
      { book: "brilakis-pci", loc: "5.7" },
      { book: "oxford-cath", loc: "ch 6: Unusual coronary anatomy" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-small-root-shorter-jl",
    lab: "diagnostic",
    when: { phase: ["engage-left"], event: ["small-root"] },
    title: "Small root: a shorter Judkins Left",
    text: "A small aortic root, a short patient or a high left main origin calls for the shorter JL3.5 rather than a JL4 (Oxford). A curve too large (or too small) for the aorta is a recognised cause of failure to engage (Brilakis 5.7.3.4); change size rather than adding force.",
    tone: "do",
    lessonId: "pm-engaging-left",
    sources: [
      { book: "oxford-cath", loc: "ch 6: Choice of catheters" },
      { book: "brilakis-pci", loc: "5.7" },
    ],
    refs: BOOKS,
  },
  {
    id: "diag-radial-exchange-long-wire",
    lab: "diagnostic",
    when: { phase: ["exchange"], event: ["radial-loop", "subclavian-tortuosity"] },
    title: "Keep the route: exchange over a 300 cm wire",
    text: "After a difficult radial passage, use a 300 cm wire (0.035 or 0.038 inch) for every exchange and keep its tip in the aortic root, out of the ventricle. A long sheath at least 1 Fr larger than the catheter makes manipulation easier.",
    tone: "do",
    lessonId: "pm-engaging-exchange",
    sources: [{ book: "brilakis-pci", loc: "5.2" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "pci-trap-then-backbleed",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"] },
    title: "Trapping: right balloon, then back-bleed",
    text: "Trap with a balloon beside the wire: 2.5 mm for 6–7 Fr guides and 3.0 mm for 7–8 Fr guides, ideally at least 20 mm long, at 15–20 atm near the primary curve. After deflating, back-bleed the Y-connector before any injection, because air is often drawn in.",
    tone: "caution",
    lessonId: "pm-engaging-exchange",
    sources: [{ book: "brilakis-pci", loc: "8.9" }],
    refs: ["brilakis-manual-pci"],
  },
  {
    id: "diag-radial-spasm-release",
    lab: "diagnostic",
    when: { event: ["radial-spasm"] },
    title: "Radial spasm: release it, never pull",
    text: "Stop pulling. Combine intra-arterial nitroglycerin or verapamil, deeper sedation and warmth over the forearm; if the catheter is still gripped, inflate an upper-arm cuff above systolic for 5 minutes and let it down. Then withdraw gently. Never give lidocaine into the artery.",
    tone: "bailout",
    lessonId: "pm-engaging-spasm",
    sources: [
      { book: "brilakis-pci", loc: "29.2" },
      { book: "oxford-cath", loc: "ch 3: Radial artery access" },
    ],
    refs: BOOKS,
  },
  {
    id: "access-radial-spasm-no-traction",
    lab: "access",
    when: { phase: ["radial", "closure", "complication"], event: ["radial-spasm"] },
    alsoIn: [{ lab: "diagnostic", phase: ["advance", "exchange", "finish"] }],
    title: "Gripped radial sheath: no traction",
    text: "Forceful withdrawal can avulse the radial artery. Use vasodilators (through the side arm, or intravenously if you cannot aspirate), sedation, warmth and an upper-arm cuff above systolic for 5 minutes before trying again, then check the forearm.",
    tone: "caution",
    lessonId: "pm-engaging-spasm",
    sources: [
      { book: "brilakis-pci", loc: "29.2" },
      { book: "brilakis-pci", loc: "11.2" },
    ],
    refs: ["brilakis-manual-pci"],
  },
];

export const refs: Reference[] = [
  {
    id: "hahalis-radial-heparin-2018",
    kind: "trial",
    citation:
      "Hahalis GN, Leopoulou M, Tsigkas G, et al. Multicenter randomized evaluation of high versus standard heparin dose on incident radial arterial occlusion after transradial coronary angiography: the SPIRIT OF ARTEMIS study. JACC Cardiovasc Interv. 2018;11:2241–2250.",
    url: "https://doi.org/10.1016/j.jcin.2018.08.009",
    note: "PMID: 30391389. Checked on PubMed: authors, title, journal, year, volume 11, issue 22, pages 2241–2250.",
    verified: true,
  },
];
